"""Per-device token-bucket rate limiter.

Phase 1 uses an in-process in-memory implementation. The ``RateLimiter``
Protocol keeps the Phase 2 swap to a distributed backend (Redis, etc.) a
drop-in replacement — mirroring the ``Storage`` Protocol pattern.

Design choices worth recording here because they are load-bearing:

* **monotonic clock** — bucket refill uses ``time.monotonic`` so NTP slews or
  clock jumps never grant (or revoke) tokens retroactively. The wall clock
  ``time.time`` would cause a refill spike after every NTP correction.
* **cardinality-safe metrics** — the Prometheus counter is labelled only by
  ``endpoint``. Including ``device_id`` would create one label pair per
  fleet device, blowing up TSDB cardinality on a fleet of hundreds/thousands.
  Per-device diagnostics go through structured logs (already carry
  ``request_id`` and ``device_id``).
* **single lock, not per-bucket** — the bucket map itself needs a lock for
  concurrent insertion; a finer-grained per-bucket lock adds complexity
  that Phase 1 does not need at its expected QPS. We can re-evaluate if
  the lock becomes contended (visible via ``cdx_rate_limit_exceeded_total``
  spikes disjoint from actual traffic).
"""

from __future__ import annotations

import math
import threading
import time
from collections.abc import Callable
from dataclasses import dataclass, field
from typing import Protocol, runtime_checkable


@dataclass(frozen=True)
class RateLimitPolicy:
    """Immutable policy: capacity and steady-state refill."""

    capacity: int
    refill_per_second: float

    def __post_init__(self) -> None:
        if self.capacity <= 0:
            raise ValueError("capacity must be positive")
        if self.refill_per_second <= 0:
            raise ValueError("refill_per_second must be positive")


@dataclass
class Decision:
    """Outcome of a rate-limit check.

    ``retry_after_seconds`` is always 0 when allowed; when rejected it is
    the (ceil-rounded) seconds the caller should wait before retrying —
    suitable as a ``Retry-After`` HTTP header.
    """

    allowed: bool
    retry_after_seconds: int = 0


@runtime_checkable
class RateLimiter(Protocol):
    """Protocol implemented by rate-limiting backends."""

    def check(self, *, device_id: str, endpoint: str) -> Decision: ...


@dataclass
class _Bucket:
    tokens: float
    last_refill: float
    lock: threading.Lock = field(default_factory=threading.Lock)


class InMemoryRateLimiter:
    """Thread-safe in-memory token bucket per (device_id, endpoint).

    ``policies`` maps endpoint name → RateLimitPolicy. A request for an
    unknown endpoint is *allowed* (fail-open for unconfigured endpoints);
    this is deliberate so we never 429 on a misconfiguration.
    """

    def __init__(
        self,
        policies: dict[str, RateLimitPolicy],
        *,
        time_source: Callable[[], float] | None = None,
    ) -> None:
        self._policies = dict(policies)
        self._time_source = time_source or time.monotonic
        self._buckets: dict[tuple[str, str], _Bucket] = {}
        self._map_lock = threading.Lock()

    def check(self, *, device_id: str, endpoint: str) -> Decision:
        policy = self._policies.get(endpoint)
        if policy is None:
            return Decision(allowed=True)

        # Single clock read: passed to bucket creation AND used as the
        # refill reference so a newly created bucket cannot show nonzero
        # elapsed time against itself (TOCTOU on first use).
        now = self._time_source()
        key = (device_id, endpoint)
        bucket = self._get_or_create(key, policy, now)

        with bucket.lock:
            elapsed = max(0.0, now - bucket.last_refill)
            bucket.tokens = min(
                float(policy.capacity),
                bucket.tokens + elapsed * policy.refill_per_second,
            )
            bucket.last_refill = now

            if bucket.tokens >= 1.0:
                bucket.tokens -= 1.0
                return Decision(allowed=True)

            deficit = 1.0 - bucket.tokens
            wait = deficit / policy.refill_per_second
            return Decision(allowed=False, retry_after_seconds=max(1, _ceil(wait)))

    def _get_or_create(self, key: tuple[str, str], policy: RateLimitPolicy, now: float) -> _Bucket:
        with self._map_lock:
            bucket = self._buckets.get(key)
            if bucket is None:
                bucket = _Bucket(
                    tokens=float(policy.capacity),
                    last_refill=now,
                )
                self._buckets[key] = bucket
            return bucket


class NullRateLimiter:
    """No-op limiter for tests or disabled deployments. Always allows."""

    def check(self, *, device_id: str, endpoint: str) -> Decision:
        del device_id, endpoint
        return Decision(allowed=True)


def _ceil(seconds: float) -> int:
    """Integer ceiling; thin wrapper over ``math.ceil``.

    Kept as a module-private helper so the ``check`` call site reads as a
    domain verb ("ceil the retry-after") rather than pulling in ``math``
    at the hot-path import surface. Behaviour matches ``math.ceil`` across
    the full real-number domain, including negatives.
    """
    return math.ceil(seconds)
