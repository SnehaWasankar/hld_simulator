export interface SimulateRequestBody {
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

export type GraphNode = SimulateRequestBody["graph"]["nodes"][0];
