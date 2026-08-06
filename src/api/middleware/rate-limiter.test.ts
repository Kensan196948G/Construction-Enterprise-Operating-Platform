/**
 * Unit tests for the sliding-window rate limiter.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { createRateLimiter } from "./rate-limiter.ts";

// ---------------------------------------------------------------------------
// Allow path
// ---------------------------------------------------------------------------

test("rate-limiter: allows requests up to maxRequests", () => {
  const rl = createRateLimiter({ maxRequests: 3, windowMs: 60_000 });
  const now = 1_000_000;
  for (let i = 0; i < 3; i++) {
    const r = rl.check("ip-a", now + i);
    assert.ok(r.allowed, `request ${i} should be allowed`);
  }
});

test("rate-limiter: remaining decrements with each request", () => {
  const rl = createRateLimiter({ maxRequests: 5, windowMs: 60_000 });
  const now = 2_000_000;
  const r1 = rl.check("ip-b", now);
  assert.equal(r1.remaining, 4);
  const r2 = rl.check("ip-b", now + 1);
  assert.equal(r2.remaining, 3);
});

// ---------------------------------------------------------------------------
// Block path
// ---------------------------------------------------------------------------

test("rate-limiter: blocks the (maxRequests+1)-th request", () => {
  const rl = createRateLimiter({ maxRequests: 2, windowMs: 60_000 });
  const now = 3_000_000;
  rl.check("ip-c", now);
  rl.check("ip-c", now + 1);
  const blocked = rl.check("ip-c", now + 2);
  assert.ok(!blocked.allowed);
  assert.equal(blocked.remaining, 0);
});

test("rate-limiter: blocked result has positive resetAt", () => {
  const rl = createRateLimiter({ maxRequests: 1, windowMs: 10_000 });
  const now = 4_000_000;
  rl.check("ip-d", now);
  const blocked = rl.check("ip-d", now + 100);
  assert.ok(!blocked.allowed);
  assert.ok(blocked.resetAt > now, "resetAt should be in the future relative to first request");
  assert.equal(blocked.resetAt, now + 10_000);
});

// ---------------------------------------------------------------------------
// Window expiry
// ---------------------------------------------------------------------------

test("rate-limiter: allows requests once window expires", () => {
  const rl = createRateLimiter({ maxRequests: 2, windowMs: 1_000 });
  const now = 5_000_000;
  rl.check("ip-e", now);
  rl.check("ip-e", now + 100);

  // Advance time past the window.
  const future = now + 1_001;
  const r = rl.check("ip-e", future);
  assert.ok(r.allowed);
});

test("rate-limiter: old timestamps are pruned from window", () => {
  const rl = createRateLimiter({ maxRequests: 2, windowMs: 500 });
  const now = 6_000_000;
  rl.check("ip-f", now); // timestamp at now
  rl.check("ip-f", now + 200); // timestamp at now+200

  // Advance so only the second timestamp is still in the window.
  const r = rl.check("ip-f", now + 600);
  // now+0 expired (600 > 500), now+200 is still valid (600 - 500 = 100, 200 > 100).
  // So one slot is occupied, one is free for the new request.
  assert.ok(r.allowed);
});

// ---------------------------------------------------------------------------
// Multi-key isolation
// ---------------------------------------------------------------------------

test("rate-limiter: different keys are independent", () => {
  const rl = createRateLimiter({ maxRequests: 1, windowMs: 60_000 });
  const now = 7_000_000;
  rl.check("ip-g", now);
  const blocked = rl.check("ip-g", now + 1);
  assert.ok(!blocked.allowed);

  // A different key is unaffected.
  const allowed = rl.check("ip-h", now + 1);
  assert.ok(allowed.allowed);
});

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

test("rate-limiter: reset clears all buckets", () => {
  const rl = createRateLimiter({ maxRequests: 1, windowMs: 60_000 });
  const now = 8_000_000;
  rl.check("ip-i", now);
  assert.ok(!rl.check("ip-i", now + 1).allowed);

  rl.reset();

  assert.ok(rl.check("ip-i", now + 2).allowed);
});
