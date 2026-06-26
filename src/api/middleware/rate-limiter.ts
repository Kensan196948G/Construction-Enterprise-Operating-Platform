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

export function createRateLimiter(config: RateLimiterConfig): RateLimiter {
  const { maxRequests, windowMs } = config;

  // Each key maps to an array of request timestamps (ascending).
  const buckets = new Map<string, number[]>();

  function check(key: string, nowMs: number = Date.now()): RateLimitResult {
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
