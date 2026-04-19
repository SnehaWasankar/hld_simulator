import type { GraphNode } from "./types";

export function simulateLatency(componentType: string): number {
  const baseLatencies: Record<string, number> = {
    client: 0,
    load_balancer: 1 + Math.random() * 3,
    api_server: 8 + Math.random() * 25,
    cache: 0.2 + Math.random() * 1.5,
    database: 3 + Math.random() * 12,
    message_queue: 2 + Math.random() * 8,
    worker: 50 + Math.random() * 200,
    notification_service: 10 + Math.random() * 50,
    rate_limiter: 0.5 + Math.random() * 2,
  };

  return Math.round((baseLatencies[componentType] ?? 10) * 100) / 100;
}

export function getComponentAction(
  componentType: string,
  method: string,
  dataFlows: Record<string, { processes: string }>
): string {
  const flow = dataFlows[componentType];
  if (flow) return flow.processes;

  const defaults: Record<string, string> = {
    client: `${method} request initiated`,
    load_balancer: "Route to healthy instance",
    api_server: "Process business logic",
    cache: "Key lookup in memory store",
    database: "Query execution",
    message_queue: "Enqueue message",
    worker: "Background processing",
    notification_service: "Send notification",
    rate_limiter: "Check rate limit counter in Redis",
  };

  return defaults[componentType] ?? "Processing";
}

export function buildDataForComponent(
  componentType: string,
  method: string,
  payload: Record<string, unknown>,
  response: Record<string, unknown>,
  cacheHitRate?: number
): { dataIn: unknown; dataOut: unknown } {
  const isCacheHit = Math.random() < (cacheHitRate ?? 0.8);

  switch (componentType) {
    case "client":
      return {
        dataIn: { userAction: method === "POST" ? "Submit form" : "Page load" },
        dataOut: { method, payload },
      };
    case "load_balancer": {
      const instance = Math.floor(Math.random() * 4) + 1;
      return {
        dataIn: { request: `${method} /api/...`, headers: { "X-Request-Id": crypto.randomUUID().slice(0, 8) } },
        dataOut: { routed_to: `api-server-${instance}`, algorithm: "round-robin", health: "all healthy" },
      };
    }
    case "api_server":
      return { dataIn: payload, dataOut: response };
    case "cache":
      if (isCacheHit) {
        return {
          dataIn: { operation: "GET", key: Object.keys(payload)[0] || "key" },
          dataOut: { status: "HIT", data: response, ttl_remaining: Math.floor(Math.random() * 300) },
        };
      }
      return {
        dataIn: { operation: "GET", key: Object.keys(payload)[0] || "key" },
        dataOut: { status: "MISS", action: "query_database" },
      };
    case "database":
      if (method === "POST") {
        return {
          dataIn: { operation: "INSERT", table: "records", data: payload },
          dataOut: { rows_affected: 1, id: crypto.randomUUID().slice(0, 8) },
        };
      }
      return {
        dataIn: { operation: "SELECT", table: "records", where: payload },
        dataOut: { rows: [response], query_time_ms: (Math.random() * 5).toFixed(2) },
      };
    case "message_queue":
      return {
        dataIn: { operation: "ENQUEUE", message: { type: "task", payload } },
        dataOut: { message_id: `msg_${crypto.randomUUID().slice(0, 6)}`, queue_depth: Math.floor(Math.random() * 50), status: "enqueued" },
      };
    case "worker":
      return {
        dataIn: { job_id: `job_${crypto.randomUUID().slice(0, 6)}`, type: "process", payload },
        dataOut: { job_id: `job_${crypto.randomUUID().slice(0, 6)}`, status: "completed", result: response },
      };
    case "notification_service":
      return {
        dataIn: { type: "push", target: `user_${Math.floor(Math.random() * 1000)}`, message: "You have a new update" },
        dataOut: { notification_id: `notif_${crypto.randomUUID().slice(0, 6)}`, status: "sent", channel: "FCM" },
      };
    default:
      return { dataIn: payload, dataOut: response };
  }
}

export function buildHopPayload(
  node: GraphNode,
  method: string,
  payload: Record<string, unknown>,
  response: Record<string, unknown>,
  dataFlows: Record<string, { processes: string }>
) {
  return {
    action: getComponentAction(node.componentType, method, dataFlows),
    ...buildDataForComponent(node.componentType, method, payload, response, node.cacheHitRate),
  };
}
