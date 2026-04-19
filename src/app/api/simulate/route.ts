import { NextRequest, NextResponse } from "next/server";
import { SCENARIOS, pickRandom } from "@/lib/scenarios";
import type { RequestHop } from "@/lib/scenarios";
import { buildHopPayload, simulateLatency } from "./_lib/component-simulation";
import { detectParallelWarnings, traverseGraph } from "./_lib/graph";
import { buildRateLimiterData, checkRateLimit } from "./_lib/rate-limit";
import type { SimulateRequestBody } from "./_lib/types";

export async function POST(request: NextRequest) {
  const body: SimulateRequestBody = await request.json();
  const { scenarioId, endpointIndex, payloadIndex, graph } = body;

  const scenario = SCENARIOS.find((s) => s.id === scenarioId);
  if (!scenario) {
    return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
  }

  const endpoint = scenario.endpoints[endpointIndex];
  if (!endpoint) {
    return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 });
  }

  const payload = payloadIndex !== undefined
    ? endpoint.samplePayloads[payloadIndex % endpoint.samplePayloads.length]
    : pickRandom(endpoint.samplePayloads);
  const response = payloadIndex !== undefined
    ? endpoint.sampleResponses[payloadIndex % endpoint.sampleResponses.length]
    : pickRandom(endpoint.sampleResponses);

  // Traverse graph — only nodes reachable via edges from entry points
  const nodeOrder = traverseGraph(graph.nodes, graph.edges);
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n] as const));

  // Validate: must have at least 2 connected nodes (client + something)
  if (nodeOrder.length < 2 || graph.edges.length === 0) {
    return NextResponse.json(
      {
        error: 'Invalid architecture',
        message: 'Components are not connected. Draw edges between nodes (e.g. Client → Load Balancer → API Server) before sending requests.',
        hops: [],
        totalLatencyMs: 0,
      },
      { status: 422 }
    );
  }

  const parallelWarnings = detectParallelWarnings(graph, nodeMap);

  const hops: RequestHop[] = [];
  let cumulativeLatency = 0;
  let rateLimited = false;
  let rateLimitRetryAfterMs: number | undefined;
  const wallNow = Date.now();

  for (const nodeId of nodeOrder) {
    const node = nodeMap.get(nodeId);
    if (!node) continue;

    const latency = simulateLatency(node.componentType);
    cumulativeLatency += latency;

    // Rate limiter check — if rate limited, stop traversal and return 429
    if (node.componentType === 'rate_limiter') {
      const rlResult = checkRateLimit(node, wallNow);
      const { dataIn, dataOut } = buildRateLimiterData(node, rlResult.allowed, rlResult.counterValue, rlResult.ttlMs, rlResult.retryAfterMs);

      hops.push({
        nodeId: node.id,
        nodeLabel: node.label,
        componentType: node.componentType,
        action: rlResult.allowed ? 'Rate limit OK — forwarding request' : 'Rate limit exceeded — request dropped',
        dataIn,
        dataOut,
        latencyMs: latency,
        timestamp: wallNow + cumulativeLatency,
        status: rlResult.allowed ? 'ok' : 'rate_limited',
      });

      if (!rlResult.allowed) {
        rateLimited = true;
        rateLimitRetryAfterMs = rlResult.retryAfterMs;
        break; // Stop processing — request is dropped here
      }
      continue;
    }

    const { action, dataIn, dataOut } = buildHopPayload(node, endpoint.method, payload, response, scenario.componentDataFlows);

    hops.push({
      nodeId: node.id,
      nodeLabel: node.label,
      componentType: node.componentType,
      action,
      dataIn,
      dataOut,
      latencyMs: latency,
      timestamp: wallNow + cumulativeLatency,
    });
  }

  // Simulate total processing time
  const totalLatencyMs = hops.reduce((sum, h) => sum + h.latencyMs, 0);

  // Add a small real delay to make it feel realistic (capped at 500ms)
  const realDelay = Math.min(totalLatencyMs / 10, 500);
  await new Promise((resolve) => setTimeout(resolve, realDelay));

  if (rateLimited) {
    return NextResponse.json({
      request: { method: endpoint.method, path: endpoint.path, payload },
      response: {
        status: 429,
        body: {
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Request dropped.',
          retry_after_ms: rateLimitRetryAfterMs,
        },
      },
      hops,
      totalLatencyMs: Math.round(totalLatencyMs * 100) / 100,
      scenarioId,
      statusCode: 429,
      warnings: parallelWarnings.length > 0 ? parallelWarnings : undefined,
    });
  }

  return NextResponse.json({
    request: {
      method: endpoint.method,
      path: endpoint.path,
      payload,
    },
    response: {
      status: 200,
      body: response,
    },
    hops,
    totalLatencyMs: Math.round(totalLatencyMs * 100) / 100,
    scenarioId,
    warnings: parallelWarnings.length > 0 ? parallelWarnings : undefined,
  });
}
