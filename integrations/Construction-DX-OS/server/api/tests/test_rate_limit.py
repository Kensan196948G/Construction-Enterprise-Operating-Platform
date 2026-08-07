"""Unit tests for the token-bucket rate limiter."""

from __future__ import annotations

import pytest

from cdx_server.rate_limit import (
    InMemoryRateLimiter,
    NullRateLimiter,
    RateLimiter,
    RateLimitPolicy,
)


class _Clock:
    """Mutable time source so tests can fast-forward deterministically."""

    def __init__(self, t: float = 0.0) -> None:
        self.t = t

    def __call__(self) -> float:
        return self.t

    def advance(self, delta: float) -> None:
        self.t += delta


@pytest.fixture
def clock() -> _Clock:
    return _Clock()


@pytest.fixture
def limiter(clock: _Clock) -> InMemoryRateLimiter:
    return InMemoryRateLimiter(
        {
            "heartbeat": RateLimitPolicy(capacity=3, refill_per_second=1.0),
            "inventory": RateLimitPolicy(capacity=2, refill_per_second=0.1),
        },
        time_source=clock,
    )


def test_policy_rejects_nonpositive_capacity():
    with pytest.raises(ValueError):
        RateLimitPolicy(capacity=0, refill_per_second=1.0)


def test_policy_rejects_nonpositive_refill():
    with pytest.raises(ValueError):
        RateLimitPolicy(capacity=1, refill_per_second=0)


def test_allows_up_to_capacity_then_rejects(limiter: InMemoryRateLimiter):
    # capacity=3 → three allowed, the fourth rejected.
    for _ in range(3):
        assert limiter.check(device_id="dev-a", endpoint="heartbeat").allowed
    decision = limiter.check(device_id="dev-a", endpoint="heartbeat")
    assert not decision.allowed
    assert decision.retry_after_seconds >= 1


def test_retry_after_is_integer_for_http_header(limiter: InMemoryRateLimiter):
    for _ in range(3):
        limiter.check(device_id="dev-a", endpoint="heartbeat")
    decision = limiter.check(device_id="dev-a", endpoint="heartbeat")
    assert isinstance(decision.retry_after_seconds, int)
    assert decision.retry_after_seconds >= 1


def test_refill_restores_capacity(limiter: InMemoryRateLimiter, clock: _Clock):
    # Drain
    for _ in range(3):
        limiter.check(device_id="dev-a", endpoint="heartbeat")
    assert not limiter.check(device_id="dev-a", endpoint="heartbeat").allowed

    # Advance 2 seconds → 2 tokens refilled (refill_per_second=1.0)
    clock.advance(2.0)
    assert limiter.check(device_id="dev-a", endpoint="heartbeat").allowed
    assert limiter.check(device_id="dev-a", endpoint="heartbeat").allowed
    assert not limiter.check(device_id="dev-a", endpoint="heartbeat").allowed


def test_refill_caps_at_capacity(limiter: InMemoryRateLimiter, clock: _Clock):
    # Drain then sleep very long — tokens cap at capacity, not unlimited.
    for _ in range(3):
        limiter.check(device_id="dev-a", endpoint="heartbeat")
    clock.advance(10_000.0)
    for _ in range(3):
        assert limiter.check(device_id="dev-a", endpoint="heartbeat").allowed
    assert not limiter.check(device_id="dev-a", endpoint="heartbeat").allowed


def test_buckets_are_independent_per_device(limiter: InMemoryRateLimiter):
    for _ in range(3):
        limiter.check(device_id="dev-a", endpoint="heartbeat")
    # dev-b still has a full bucket.
    for _ in range(3):
        assert limiter.check(device_id="dev-b", endpoint="heartbeat").allowed


def test_buckets_are_independent_per_endpoint(limiter: InMemoryRateLimiter):
    for _ in range(3):
        limiter.check(device_id="dev-a", endpoint="heartbeat")
    # Separate inventory bucket for same device.
    assert limiter.check(device_id="dev-a", endpoint="inventory").allowed


def test_unknown_endpoint_fails_open(limiter: InMemoryRateLimiter):
    # Fail-open so a misconfigured endpoint never 429s unexpectedly.
    for _ in range(1000):
        assert limiter.check(device_id="dev-a", endpoint="nope").allowed


def test_null_rate_limiter_always_allows():
    null = NullRateLimiter()
    for _ in range(10_000):
        assert null.check(device_id="dev-a", endpoint="heartbeat").allowed


def test_in_memory_limiter_satisfies_protocol(limiter: InMemoryRateLimiter):
    assert isinstance(limiter, RateLimiter)


def test_null_limiter_satisfies_protocol():
    assert isinstance(NullRateLimiter(), RateLimiter)


def test_ceil_handles_negative_inputs():
    # Regression guard: the previous body returned +1 for _ceil(-0.5).
    from cdx_server.rate_limit import _ceil

    assert _ceil(-0.5) == 0
    assert _ceil(-1.0) == -1
    assert _ceil(0.0) == 0
    assert _ceil(0.5) == 1
    assert _ceil(2.0) == 2


def test_env_int_warns_on_invalid_value(monkeypatch):
    from cdx_server.app import _env_int

    monkeypatch.setenv("CDX_TEST_RL_BAD", "abc")
    with pytest.warns(UserWarning, match="not a valid integer"):
        assert _env_int("CDX_TEST_RL_BAD", 7) == 7


def test_env_int_warns_on_nonpositive_value(monkeypatch):
    from cdx_server.app import _env_int

    monkeypatch.setenv("CDX_TEST_RL_NEG", "-3")
    with pytest.warns(UserWarning, match="must be positive"):
        assert _env_int("CDX_TEST_RL_NEG", 7) == 7


def test_env_int_silent_on_unset(monkeypatch):
    import warnings as _warnings

    from cdx_server.app import _env_int

    monkeypatch.delenv("CDX_TEST_RL_UNSET", raising=False)
    with _warnings.catch_warnings():
        _warnings.simplefilter("error")  # any warning becomes an error
        assert _env_int("CDX_TEST_RL_UNSET", 7) == 7


def test_retry_after_matches_deficit(clock: _Clock):
    # Slow refill: 0.5 tokens/sec, capacity 1 — after drain, need ~2s to recover.
    lim = InMemoryRateLimiter(
        {"heartbeat": RateLimitPolicy(capacity=1, refill_per_second=0.5)},
        time_source=clock,
    )
    assert lim.check(device_id="dev-a", endpoint="heartbeat").allowed
    decision = lim.check(device_id="dev-a", endpoint="heartbeat")
    assert not decision.allowed
    # deficit=1.0, refill=0.5/s → 2s ceil.
    assert decision.retry_after_seconds == 2
