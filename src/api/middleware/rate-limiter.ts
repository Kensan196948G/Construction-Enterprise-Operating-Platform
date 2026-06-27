/**
 * Sliding-window in-memory rate limiter.
 *
 * Each key (typically an IP address) gets an independent window. On every call
 * to `check()` the bucket is pruned of timestamps older than `windowMs`; this
 * "lazy cleanup" avoids timer overhead and works well in Node.js's single-threaded
 * event loop. The limiter has no persistence — it resets on process restart.
 */

export interface RateLimiterConfig {
  /** Maximum requests allowed within `windowMs`. */
  readonly maxRequests: number;
  /** Window size in milliseconds. */
  readonly windowMs: number;
}

export interface RateLimitResult {
  readonly allowed: boolean;
  /** Requests remaining in the current window (0 when rejected). */
  readonly remaining: number;
  /** Unix epoch (ms) when the oldest request in the window expires. */
  readonly resetAt: number;
}

export interface RateLimiter {
  check(key: string, nowMs?: number): RateLimitResult;
  /** Remove all buckets — useful in tests. */
  reset(): void;
}

const MAX_BUCKETS = 10_000;

export function createRateLimiter(config: RateLimiterConfig): RateLimiter {
  const { maxRequests, windowMs } = config;
  if (!Number.isSafeInteger(maxRequests) || maxRequests <= 0) {
    throw new Error("maxRequests must be a positive safe integer");
  }
  if (!Number.isSafeInteger(windowMs) || windowMs <= 0) {
    throw new Error("windowMs must be a positive safe integer");
  }

  // Each key maps to an array of request timestamps (ascending).
  const buckets = new Map<string, number[]>();

  // Evict buckets when the map exceeds MAX_BUCKETS to bound memory use.
  // First pass: remove fully-expired buckets (no active timestamps in current window).
  // Second pass: if still over cap, evict oldest active buckets (FIFO) to enforce hard limit.
  function pruneStale(nowMs: number): void {
    if (buckets.size <= MAX_BUCKETS) return;
    const windowStart = nowMs - windowMs;
    for (const [key, timestamps] of buckets) {
      const lastSeen = timestamps[timestamps.length - 1];
      if (lastSeen === undefined || lastSeen < windowStart) {
        buckets.delete(key);
      }
      if (buckets.size <= MAX_BUCKETS) return;
    }
    // Still over cap after expiry pass: force-evict oldest live buckets.
    for (const key of buckets.keys()) {
      buckets.delete(key);
      if (buckets.size <= MAX_BUCKETS) break;
    }
  }

  function check(key: string, nowMs: number = Date.now()): RateLimitResult {
    pruneStale(nowMs);
    const windowStart = nowMs - windowMs;
    let timestamps = buckets.get(key) ?? [];

    // Prune expired entries (lazy cleanup — O(k) where k = expired entries).
    timestamps = timestamps.filter((ts) => ts > windowStart);

    if (timestamps.length >= maxRequests) {
      buckets.set(key, timestamps);
      const resetAt = (timestamps[0] ?? nowMs) + windowMs;
      return { allowed: false, remaining: 0, resetAt };
    }

    timestamps.push(nowMs);
    buckets.set(key, timestamps);

    const resetAt = (timestamps[0] ?? nowMs) + windowMs;
    return { allowed: true, remaining: maxRequests - timestamps.length, resetAt };
  }

  function reset(): void {
    buckets.clear();
  }

  return { check, reset };
}
