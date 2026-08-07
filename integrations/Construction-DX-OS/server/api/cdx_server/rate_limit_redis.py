"""Redis-backed sliding-window rate limiter (Phase 4b).

Drop-in replacement for :class:`cdx_server.rate_limit.InMemoryRateLimiter`.
Implements the same :class:`cdx_server.rate_limit.RateLimiter` Protocol so
``app.py`` can swap backends without touching routers.

Algorithm
---------
Uses a Redis sorted set (one per ``(endpoint, device_id)`` pair) as a
sliding-window request log:

1. **ZREMRANGEBYSCORE** — evict timestamps older than the window.
2. **ZCARD** — count requests inside the window.
3. If count < limit: **ZADD** the current timestamp, set TTL, return *allow*.
4. Else: compute ``retry_after`` from the oldest timestamp in the window,
   return *deny*.

All four operations are wrapped in a single Lua script executed via
``redis.execute_command`` so they run atomically on the Redis server.

Window mapping from ``RateLimitPolicy``
---------------------------------------
``RateLimitPolicy.capacity`` → max requests per window.
``RateLimitPolicy.refill_per_second`` → window width = ``capacity /
refill_per_second`` seconds.  This mirrors the InMemory bucket behaviour:
a policy with ``capacity=10, refill_per_second=10/60`` allows 10 requests
per 60-second window.

Configuration
-------------
Pass a connected ``redis.Redis`` instance::

    import redis
    from cdx_server.rate_limit_redis import RedisRateLimiter
    from cdx_server.rate_limit import RateLimitPolicy

    r = redis.Redis.from_url("redis://localhost:6379/0")
    limiter = RedisRateLimiter(
        r,
        {
            "heartbeat": RateLimitPolicy(capacity=10, refill_per_second=10/60),
            "inventory": RateLimitPolicy(capacity=3,  refill_per_second=3/3600),
        },
    )
"""

from __future__ import annotations

import math
import time
from typing import Any

from cdx_server.rate_limit import Decision, RateLimitPolicy

# Lua script: atomic sliding-window check-and-record.
# KEYS[1] = sorted-set key   ARGV[1] = now (float, seconds)
# ARGV[2] = window (float, seconds)   ARGV[3] = capacity (int)
# ARGV[4] = ttl (int, seconds)
# Returns: table {allowed (0|1), retry_after (int seconds)}
_LUA_SLIDING_WINDOW = """
local key      = KEYS[1]
local now      = tonumber(ARGV[1])
local window   = tonumber(ARGV[2])
local capacity = tonumber(ARGV[3])
local ttl      = tonumber(ARGV[4])

-- evict old entries
redis.call('ZREMRANGEBYSCORE', key, '-inf', now - window)

local count = redis.call('ZCARD', key)

if count < capacity then
    -- use a unique member to allow multiple calls at the same millisecond
    redis.call('ZADD', key, now, now .. ':' .. math.random(1, 1000000))
    redis.call('EXPIRE', key, ttl)
    return {1, 0}
else
    -- oldest entry in the window.  The ZRANGE ... WITHSCORES reply shape seen
    -- by server-side Lua differs across backends:
    --   real Redis / fakeredis<2.36 : flat   {member, score, member, score, ...}
    --   fakeredis>=2.36             : nested {{member, score}, ...}
    -- Probe the first element's type so the score read survives both shapes.
    local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
    local oldest_ts
    if type(oldest[1]) == 'table' then
        oldest_ts = tonumber(oldest[1][2])
    else
        oldest_ts = tonumber(oldest[2])
    end
    local retry_after
    if oldest_ts == nil then
        -- Defensive: window is full but no readable score (should not happen).
        -- Fall back to one full window rather than erroring on arithmetic.
        retry_after = math.ceil(window)
    else
        retry_after = math.ceil(oldest_ts + window - now)
    end
    if retry_after < 1 then retry_after = 1 end
    return {0, retry_after}
end
"""


class RedisRateLimiter:
    """Sliding-window rate limiter backed by Redis.

    Parameters
    ----------
    redis_client:
        A connected ``redis.Redis`` (or ``fakeredis.FakeRedis``) instance.
    policies:
        Mapping of endpoint name → :class:`~cdx_server.rate_limit.RateLimitPolicy`.
        Unknown endpoints are allowed (fail-open, same behaviour as
        :class:`~cdx_server.rate_limit.InMemoryRateLimiter`).
    key_prefix:
        Prefix for Redis keys.  Default ``"rl"`` gives keys like
        ``rl:heartbeat:device-abc``.
    time_source:
        Callable returning current time as float seconds since epoch.
        Defaults to ``time.time`` (wall clock — suitable for distributed
        TTL calculations, unlike ``time.monotonic`` which is per-process).
    """

    def __init__(
        self,
        redis_client: Any,
        policies: dict[str, RateLimitPolicy],
        *,
        key_prefix: str = "rl",
        time_source: Any = None,
    ) -> None:
        self._redis = redis_client
        self._policies = dict(policies)
        self._prefix = key_prefix
        self._time_source = time_source or time.time

    def check(self, *, device_id: str, endpoint: str) -> Decision:
        policy = self._policies.get(endpoint)
        if policy is None:
            return Decision(allowed=True)

        window = policy.capacity / policy.refill_per_second  # seconds
        ttl = max(1, math.ceil(window * 2))
        now = self._time_source()
        key = f"{self._prefix}:{endpoint}:{device_id}"

        # Use EVAL directly so the script runs on both real Redis and fakeredis
        # (fakeredis does not support EVALSHA used by register_script).
        result = self._redis.eval(
            _LUA_SLIDING_WINDOW,
            1,  # number of keys
            key,
            str(now),
            str(window),
            str(policy.capacity),
            str(ttl),
        )
        allowed = bool(result[0])
        retry_after = int(result[1])
        return Decision(allowed=allowed, retry_after_seconds=retry_after)
