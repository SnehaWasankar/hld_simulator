import type { GraphNode } from "./types";

type RateLimitEntry = {
  tokens: number;
  lastRefill: number;
  windowStart: number;
  requestCount: number;
};

const globalWithState = globalThis as typeof globalThis & {
  __rateLimitState?: Map<string, RateLimitEntry>;
};

if (!globalWithState.__rateLimitState) {
  globalWithState.__rateLimitState = new Map();
}

const rateLimitState = globalWithState.__rateLimitState;

export function checkRateLimit(
  node: GraphNode,
  now: number
): { allowed: boolean; retryAfterMs?: number; counterValue: number; ttlMs: number } {
  const algorithm = node.rateLimitAlgorithm ?? "token_bucket";
  const stateKey = node.id;
  const ttlSeconds = node.redisCounterTtlSeconds ?? 60;

  if (algorithm === "token_bucket" || algorithm === "leaky_bucket") {
    const bucketSize = node.rateLimitBucketSize ?? 100;
    const refillRate = node.rateLimitRefillRate ?? 10;

    let state = rateLimitState.get(stateKey);
    if (!state || now - state.windowStart > ttlSeconds * 1000) {
      state = { tokens: bucketSize, lastRefill: now, windowStart: now, requestCount: 0 };
      rateLimitState.set(stateKey, state);
    }

    const elapsedSec = (now - state.lastRefill) / 1000;
    state.tokens = Math.min(bucketSize, state.tokens + elapsedSec * refillRate);
    state.lastRefill = now;
    state.requestCount++;

    if (state.tokens >= 1) {
      state.tokens -= 1;
      return { allowed: true, counterValue: Math.round(state.tokens), ttlMs: ttlSeconds * 1000 };
    }

    const waitMs = Math.ceil(((1 - state.tokens) / refillRate) * 1000);
    return { allowed: false, retryAfterMs: waitMs, counterValue: 0, ttlMs: ttlSeconds * 1000 };
  }

  if (algorithm === "fixed_window") {
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
    }
    return { allowed: false, retryAfterMs: remainingMs, counterValue: state.requestCount, ttlMs: remainingMs };
  }

  if (algorithm === "sliding_window") {
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
    }
    return { allowed: false, retryAfterMs: Math.ceil(remainingMs), counterValue: Math.round(weightedCount), ttlMs: remainingMs };
  }

  return { allowed: true, counterValue: 0, ttlMs: ttlSeconds * 1000 };
}

export function buildRateLimiterData(
  node: GraphNode,
  allowed: boolean,
  counterValue: number,
  ttlMs: number,
  retryAfterMs?: number
): { dataIn: unknown; dataOut: unknown } {
  const algorithm = node.rateLimitAlgorithm ?? "token_bucket";
  const userId = `user_${Math.floor(Math.random() * 1000)}`;
  const ip = `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 10) + 1}`;

  return {
    dataIn: {
      operation: "INCR",
      key: `rate_limit:${userId}:${ip}`,
      algorithm,
      counter_before: Math.max(0, counterValue - 1),
    },
    dataOut: allowed
      ? {
          decision: "ALLOW",
          counter: counterValue,
          ttl_ms: Math.round(ttlMs),
          redis_ops: ["INCR", `EXPIRE ${Math.ceil(ttlMs / 1000)}s`],
        }
      : {
          decision: "DENY",
          counter: counterValue,
          ttl_ms: Math.round(ttlMs),
          retry_after_ms: retryAfterMs,
          redis_ops: ["INCR (counter only, no forward)"],
        },
  };
}
