import { NextRequest, NextResponse } from 'next/server';
import { SCENARIOS, pickRandom } from '@/lib/scenarios';
import type { RequestHop } from '@/lib/scenarios';

interface SimulateRequestBody {
  scenarioId: string;
  endpointIndex: number;
  payloadIndex?: number;
  graph: {
    nodes: Array<{
      id: string;
      label: string;
      componentType: string;
      serviceId: string;
      cacheHitRate?: number;
      rateLimitAlgorithm?: string;
      rateLimitBucketSize?: number;
      rateLimitRefillRate?: number;
      rateLimitWindowSeconds?: number;
      rateLimitMaxRequests?: number;
      redisCounterTtlSeconds?: number;
    }>;
    edges: Array<{ source: string; target: string }>;
  };
}

// In-memory rate limit state (per node, resets with TTL)
// Stored on globalThis so Next.js hot reloads don't wipe it
type RateLimitEntry = {
  tokens: number;
  lastRefill: number;
  windowStart: number;
  requestCount: number;
};
const g = globalThis as typeof globalThis & { __rateLimitState?: Map<string, RateLimitEntry> };
if (!g.__rateLimitState) g.__rateLimitState = new Map();
const rateLimitState = g.__rateLimitState;

function checkRateLimit(
  node: SimulateRequestBody['graph']['nodes'][0],
  now: number,
): { allowed: boolean; retryAfterMs?: number; counterValue: number; ttlMs: number } {
  const algorithm = node.rateLimitAlgorithm ?? 'token_bucket';
  const stateKey = node.id;
  const ttlSeconds = node.redisCounterTtlSeconds ?? 60;

  if (algorithm === 'token_bucket' || algorithm === 'leaky_bucket') {
    const bucketSize = node.rateLimitBucketSize ?? 100;
    const refillRate = node.rateLimitRefillRate ?? 10; // tokens/sec

    let state = rateLimitState.get(stateKey);
    if (!state || now - state.windowStart > ttlSeconds * 1000) {
      // No state or TTL expired — fresh bucket
      state = { tokens: bucketSize, lastRefill: now, windowStart: now, requestCount: 0 };
      rateLimitState.set(stateKey, state);
    }

    // Refill tokens based on real elapsed time since last request
    const elapsedSec = (now - state.lastRefill) / 1000;
    state.tokens = Math.min(bucketSize, state.tokens + elapsedSec * refillRate);
    state.lastRefill = now;
    state.requestCount++;

    if (state.tokens >= 1) {
      state.tokens -= 1;
      return { allowed: true, counterValue: Math.round(state.tokens), ttlMs: ttlSeconds * 1000 };
    } else {
      const waitMs = Math.ceil((1 - state.tokens) / refillRate * 1000);
      return { allowed: false, retryAfterMs: waitMs, counterValue: 0, ttlMs: ttlSeconds * 1000 };
    }
  }

  if (algorithm === 'fixed_window') {
    const maxRequests = node.rateLimitMaxRequests ?? 100;
    const windowSeconds = node.rateLimitWindowSeconds ?? 60;

    let state = rateLimitState.get(stateKey);
    if (!state || now - state.windowStart > windowSeconds * 1000) {
      state = { tokens: 0, lastRefill: now, windowStart: now, requestCount: 0 };
      rateLimitState.set(stateKey, state);
    }

    state.requestCount++;
    const remainingMs = windowSeconds * 1000 - (now - state.windowStart);
    if (state.requestCount <= maxRequests) {
      return { allowed: true, counterValue: state.requestCount, ttlMs: remainingMs };
    } else {
      return { allowed: false, retryAfterMs: remainingMs, counterValue: state.requestCount, ttlMs: remainingMs };
    }
  }

  if (algorithm === 'sliding_window') {
    const maxRequests = node.rateLimitMaxRequests ?? 100;
    const windowSeconds = node.rateLimitWindowSeconds ?? 60;

    let state = rateLimitState.get(stateKey);
    if (!state) {
      state = { tokens: 0, lastRefill: now, windowStart: now, requestCount: 0 };
      rateLimitState.set(stateKey, state);
    }

    const elapsed = now - state.windowStart;
    if (elapsed > windowSeconds * 1000) {
      state.tokens = state.requestCount;
      state.windowStart = now;
      state.requestCount = 0;
    }

    const overlap = Math.max(0, 1 - elapsed / (windowSeconds * 1000));
    const weightedCount = state.tokens * overlap + state.requestCount;
    state.requestCount++;

    const remainingMs = windowSeconds * 1000 - elapsed;
    if (weightedCount < maxRequests) {
      return { allowed: true, counterValue: Math.round(weightedCount + 1), ttlMs: remainingMs };
    } else {
      return { allowed: false, retryAfterMs: Math.ceil(remainingMs), counterValue: Math.round(weightedCount), ttlMs: remainingMs };
    }
  }

  return { allowed: true, counterValue: 0, ttlMs: ttlSeconds * 1000 };
}

function simulateLatency(componentType: string, serviceId: string): number {
  const baseLatencies: Record<string, number> = {
    client: 0,
    load_balancer: 1 + Math.random() * 3,
    api_server: 8 + Math.random() * 25,
    cache: 0.2 + Math.random() * 1.5,
    database: 3 + Math.random() * 12,
    message_queue: 2 + Math.random() * 8,
    worker: 50 + Math.random() * 200,
    notification_service: 10 + Math.random() * 50,
    // Rate limiter: very low overhead (check counter in Redis + decision)
    rate_limiter: 0.5 + Math.random() * 2,
  };
  return Math.round((baseLatencies[componentType] ?? 10) * 100) / 100;
}

function getComponentAction(
  componentType: string,
  method: string,
  scenarioId: string,
  dataFlows: Record<string, { processes: string }>,
): string {
  const flow = dataFlows[componentType];
  if (flow) return flow.processes;

  const defaults: Record<string, string> = {
    client: `${method} request initiated`,
    load_balancer: 'Route to healthy instance',
    api_server: 'Process business logic',
    cache: 'Key lookup in memory store',
    database: 'Query execution',
    message_queue: 'Enqueue message',
    worker: 'Background processing',
    notification_service: 'Send notification',
    rate_limiter: 'Check rate limit counter in Redis',
  };
  return defaults[componentType] ?? 'Processing';
}

function buildDataForComponent(
  componentType: string,
  method: string,
  payload: Record<string, unknown>,
  response: Record<string, unknown>,
  scenarioId: string,
  cacheHitRate?: number,
): { dataIn: unknown; dataOut: unknown } {
  const isCacheHit = Math.random() < (cacheHitRate ?? 0.8);

  switch (componentType) {
    case 'client':
      return {
        dataIn: { userAction: method === 'POST' ? 'Submit form' : 'Page load' },
        dataOut: { method, payload },
      };
    case 'load_balancer': {
      const instance = Math.floor(Math.random() * 4) + 1;
      return {
        dataIn: { request: `${method} /api/...`, headers: { 'X-Request-Id': crypto.randomUUID().slice(0, 8) } },
        dataOut: { routed_to: `api-server-${instance}`, algorithm: 'round-robin', health: 'all healthy' },
      };
    }
    case 'api_server':
      return {
        dataIn: payload,
        dataOut: response,
      };
    case 'cache':
      if (isCacheHit) {
        return {
          dataIn: { operation: 'GET', key: Object.keys(payload)[0] || 'key' },
          dataOut: { status: 'HIT', data: response, ttl_remaining: Math.floor(Math.random() * 300) },
        };
      }
      return {
        dataIn: { operation: 'GET', key: Object.keys(payload)[0] || 'key' },
        dataOut: { status: 'MISS', action: 'query_database' },
      };
    case 'database':
      if (method === 'POST') {
        return {
          dataIn: { operation: 'INSERT', table: 'records', data: payload },
          dataOut: { rows_affected: 1, id: crypto.randomUUID().slice(0, 8) },
        };
      }
      return {
        dataIn: { operation: 'SELECT', table: 'records', where: payload },
        dataOut: { rows: [response], query_time_ms: (Math.random() * 5).toFixed(2) },
      };
    case 'message_queue':
      return {
        dataIn: { operation: 'ENQUEUE', message: { type: 'task', payload: payload } },
        dataOut: { message_id: `msg_${crypto.randomUUID().slice(0, 6)}`, queue_depth: Math.floor(Math.random() * 50), status: 'enqueued' },
      };
    case 'worker':
      return {
        dataIn: { job_id: `job_${crypto.randomUUID().slice(0, 6)}`, type: 'process', payload },
        dataOut: { job_id: `job_${crypto.randomUUID().slice(0, 6)}`, status: 'completed', result: response },
      };
    case 'notification_service':
      return {
        dataIn: { type: 'push', target: 'user_' + Math.floor(Math.random() * 1000), message: 'You have a new update' },
        dataOut: { notification_id: `notif_${crypto.randomUUID().slice(0, 6)}`, status: 'sent', channel: 'FCM' },
      };
    default:
      return { dataIn: payload, dataOut: response };
  }
}

function buildRateLimiterData(
  node: SimulateRequestBody['graph']['nodes'][0],
  allowed: boolean,
  counterValue: number,
  ttlMs: number,
  retryAfterMs?: number,
): { dataIn: unknown; dataOut: unknown } {
  const algorithm = node.rateLimitAlgorithm ?? 'token_bucket';
  const userId = `user_${Math.floor(Math.random() * 1000)}`;
  const ip = `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 10) + 1}`;

  return {
    dataIn: {
      operation: 'INCR',
      key: `rate_limit:${userId}:${ip}`,
      algorithm,
      counter_before: Math.max(0, counterValue - 1),
    },
    dataOut: allowed
      ? {
          decision: 'ALLOW',
          counter: counterValue,
          ttl_ms: Math.round(ttlMs),
          redis_ops: ['INCR', `EXPIRE ${Math.ceil(ttlMs / 1000)}s`],
        }
      : {
          decision: 'DENY',
          counter: counterValue,
          ttl_ms: Math.round(ttlMs),
          retry_after_ms: retryAfterMs,
          redis_ops: ['INCR (counter only, no forward)'],
        },
  };
}

function traverseGraph(
  nodes: SimulateRequestBody['graph']['nodes'],
  edges: SimulateRequestBody['graph']['edges'],
): string[] {
  const adjacency = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  for (const node of nodes) {
    adjacency.set(node.id, []);
    inDegree.set(node.id, 0);
  }

  for (const edge of edges) {
    adjacency.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
  }

  // Find entry nodes: client type only (disconnected nodes excluded)
  const entryNodes = nodes
    .filter((n) => n.componentType === 'client' || ((inDegree.get(n.id) ?? 0) === 0 && (adjacency.get(n.id)?.length ?? 0) > 0))
    .map((n) => n.id);

  // BFS traversal to get a reasonable processing order
  const visited = new Set<string>();
  const order: string[] = [];
  const queue = [...entryNodes];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    order.push(current);

    const children = adjacency.get(current) ?? [];
    for (const child of children) {
      if (!visited.has(child)) {
        queue.push(child);
      }
    }
  }

  // Only return nodes reachable via edges from entry points — do NOT include disconnected nodes
  return order;
}

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
  const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

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

  // Detect parallel connections without load balancer
  const parallelWarnings: string[] = [];
  const edgesBySource = new Map<string, Array<{ target: string; targetType: string }>>();
  
  for (const edge of graph.edges) {
    const targetNode = nodeMap.get(edge.target);
    if (!targetNode) continue;
    
    if (!edgesBySource.has(edge.source)) {
      edgesBySource.set(edge.source, []);
    }
    edgesBySource.get(edge.source)!.push({
      target: edge.target,
      targetType: targetNode.componentType,
    });
  }

  // Check for multiple API servers/workers connected to same source
  for (const [sourceId, targets] of edgesBySource) {
    const sourceNode = nodeMap.get(sourceId);
    if (!sourceNode) continue;

    // Group targets by type
    const targetsByType = new Map<string, string[]>();
    for (const t of targets) {
      if (!targetsByType.has(t.targetType)) {
        targetsByType.set(t.targetType, []);
      }
      targetsByType.get(t.targetType)!.push(t.target);
    }

    // Check for parallel API servers or workers without load balancer
    const problematicTypes = ['api_server', 'worker'];
    for (const [targetType, targetIds] of targetsByType) {
      if (problematicTypes.includes(targetType) && targetIds.length > 1) {
        // Check if source is NOT a load balancer
        if (sourceNode.componentType !== 'load_balancer') {
          parallelWarnings.push(
            `⚠️ ${targetIds.length} ${targetType.replace('_', ' ')}s connected directly to ${sourceNode.label} without a load balancer. Each will receive the FULL payload simultaneously. Consider adding a load balancer to distribute traffic.`
          );
        }
      }
    }
  }

  const hops: RequestHop[] = [];
  let cumulativeLatency = 0;
  let rateLimited = false;
  let rateLimitRetryAfterMs: number | undefined;
  const wallNow = Date.now();

  for (const nodeId of nodeOrder) {
    const node = nodeMap.get(nodeId);
    if (!node) continue;

    const latency = simulateLatency(node.componentType, node.serviceId);
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

    const action = getComponentAction(
      node.componentType,
      endpoint.method,
      scenarioId,
      scenario.componentDataFlows,
    );

    const { dataIn, dataOut } = buildDataForComponent(
      node.componentType,
      endpoint.method,
      payload,
      response,
      scenarioId,
      node.cacheHitRate,
    );

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
