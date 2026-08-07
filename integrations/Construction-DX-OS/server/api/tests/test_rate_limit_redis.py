"""Tests for RedisRateLimiter (Phase 4b) using fakeredis.

fakeredis provides a fully in-process Redis emulator that supports Lua
scripting, so no real Redis server is required in CI or local dev.

Contract goal: RedisRateLimiter must behave identically to
InMemoryRateLimiter for the same policies.  The tests mirror
test_rate_limit.py where they overlap, adding Redis-specific cases.
"""

from __future__ import annotations

import fakeredis
import pytest

from cdx_server.rate_limit import RateLimiter, RateLimitPolicy
from cdx_server.rate_limit_redis import RedisRateLimiter

# ---- helpers ----------------------------------------------------------------


def _make_limiter(
    capacity: int = 3,
    refill_per_second: float = 1.0,
    *,
    now: float | None = None,
) -> tuple[RedisRateLimiter, list[float]]:
    """Return (limiter, clock_list) where clock_list drives the fake clock."""
    clock: list[float] = [now if now is not None else 1000.0]

    def _clock() -> float:
        return clock[0]

    r = fakeredis.FakeRedis()
    limiter = RedisRateLimiter(
        r,
        {"heartbeat": RateLimitPolicy(capacity=capacity, refill_per_second=refill_per_second)},
        time_source=_clock,
    )
    return limiter, clock


# ---- Protocol conformance ---------------------------------------------------


def test_redis_limiter_satisfies_protocol() -> None:
    r = fakeredis.FakeRedis()
    limiter = RedisRateLimiter(r, {})
    assert isinstance(limiter, RateLimiter)


# ---- basic allow / deny -----------------------------------------------------


def test_allows_up_to_capacity() -> None:
    limiter, _ = _make_limiter(capacity=3)
    for _ in range(3):
        d = limiter.check(device_id="dev-1", endpoint="heartbeat")
        assert d.allowed


def test_denies_beyond_capacity() -> None:
    limiter, _clock = _make_limiter(capacity=3)
    for _ in range(3):
        limiter.check(device_id="dev-1", endpoint="heartbeat")
    d = limiter.check(device_id="dev-1", endpoint="heartbeat")
    assert not d.allowed
    assert d.retry_after_seconds >= 1


def test_unknown_endpoint_always_allowed() -> None:
    limiter, _ = _make_limiter()
    for _ in range(10):
        d = limiter.check(device_id="dev-1", endpoint="unknown_endpoint")
        assert d.allowed


# ---- device isolation -------------------------------------------------------


def test_devices_are_isolated() -> None:
    """Exhausting device-A's bucket must not affect device-B."""
    limiter, _ = _make_limiter(capacity=2)
    limiter.check(device_id="dev-A", endpoint="heartbeat")
    limiter.check(device_id="dev-A", endpoint="heartbeat")
    # dev-A exhausted
    assert not limiter.check(device_id="dev-A", endpoint="heartbeat").allowed
    # dev-B still has full capacity
    assert limiter.check(device_id="dev-B", endpoint="heartbeat").allowed


# ---- endpoint isolation -----------------------------------------------------


def test_endpoints_are_isolated() -> None:
    r = fakeredis.FakeRedis()
    limiter = RedisRateLimiter(
        r,
        {
            "heartbeat": RateLimitPolicy(capacity=1, refill_per_second=1.0),
            "inventory": RateLimitPolicy(capacity=5, refill_per_second=1.0),
        },
    )
    limiter.check(device_id="dev-1", endpoint="heartbeat")
    # heartbeat exhausted
    assert not limiter.check(device_id="dev-1", endpoint="heartbeat").allowed
    # inventory still open
    assert limiter.check(device_id="dev-1", endpoint="inventory").allowed


# ---- window slide -----------------------------------------------------------


def test_window_slides_and_allows_after_expiry() -> None:
    """After the window passes, the counter resets and requests are allowed."""
    limiter, clock = _make_limiter(capacity=2, refill_per_second=1.0)
    # window = capacity / refill = 2 / 1 = 2 seconds
    limiter.check(device_id="dev-1", endpoint="heartbeat")
    limiter.check(device_id="dev-1", endpoint="heartbeat")
    assert not limiter.check(device_id="dev-1", endpoint="heartbeat").allowed

    # advance past the window
    clock[0] += 3.0
    assert limiter.check(device_id="dev-1", endpoint="heartbeat").allowed


# ---- retry_after ------------------------------------------------------------


def test_retry_after_is_positive_integer() -> None:
    limiter, _ = _make_limiter(capacity=1)
    limiter.check(device_id="dev-1", endpoint="heartbeat")
    d = limiter.check(device_id="dev-1", endpoint="heartbeat")
    assert not d.allowed
    assert isinstance(d.retry_after_seconds, int)
    assert d.retry_after_seconds >= 1


# ---- REDIS_URL app integration (smoke) --------------------------------------


def test_app_uses_redis_limiter_when_redis_url_set(monkeypatch: pytest.MonkeyPatch) -> None:
    """When REDIS_URL is set and redis is importable, app uses RedisRateLimiter."""
    import fakeredis

    monkeypatch.setenv("REDIS_URL", "redis://localhost:6379/0")

    # Patch redis.Redis.from_url to return a fakeredis instance
    import redis as redis_lib

    monkeypatch.setattr(redis_lib.Redis, "from_url", lambda *a, **kw: fakeredis.FakeRedis())

    from cdx_server import app as app_module

    limiter = app_module._build_default_rate_limiter()
    assert isinstance(limiter, RedisRateLimiter)


def test_app_falls_back_to_inmemory_without_redis_url(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.delenv("REDIS_URL", raising=False)
    from cdx_server import app as app_module
    from cdx_server.rate_limit import InMemoryRateLimiter

    limiter = app_module._build_default_rate_limiter()
    assert isinstance(limiter, InMemoryRateLimiter)
