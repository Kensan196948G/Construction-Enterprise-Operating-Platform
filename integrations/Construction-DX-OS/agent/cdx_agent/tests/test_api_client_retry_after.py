"""Tests for HTTP ``Retry-After`` header honoring on transient failures.

The cdx-server returns ``Retry-After: <seconds>`` alongside HTTP 429 when the
per-device token bucket is empty (see Loop 8). The agent must honor this hint
instead of the locally computed exponential-backoff delay, otherwise a fleet
under load will retry too soon and amplify the rate-limit storm.

Scope (per CTO decision for Loop 9):
    * Honor the delta-seconds form (integer seconds).
    * Apply to *any* transient status (429, 503, ...) — honoring is driven by
      the presence of the header, not the status code.
    * Clamp to ``BackoffPolicy.cap_seconds`` to defend against a misbehaving
      server that advertises unreasonably long delays.
    * HTTP-date form (RFC 7231 §7.1.3) is intentionally *not* supported here:
      the cdx-server only emits delta-seconds today, so adding clock-skew
      parsing for a hypothetical sender would be premature.
"""

from __future__ import annotations

import httpx

from cdx_agent.api_client import ApiClient
from cdx_agent.backoff import BackoffPolicy

SECRET = "t0p-secret"
DEVICE_ID = "dev-42"


def _transport(handler):
    return httpx.MockTransport(handler)


def _fixed_clock() -> float:
    return 90.0


def _responses_handler(responses: list[httpx.Response]):
    """Serve ``responses`` in order; later calls beyond the list 500 loudly."""
    state = {"i": 0}

    def handler(_request: httpx.Request) -> httpx.Response:
        idx = state["i"]
        state["i"] += 1
        if idx >= len(responses):
            return httpx.Response(500, json={"error": "handler-overflow"})
        return responses[idx]

    return handler


def _make_client(handler, *, backoff: BackoffPolicy, sleeps: list[float]):
    return ApiClient(
        base_url="https://api.example",
        device_id=DEVICE_ID,
        shared_secret=SECRET,
        session=httpx.Client(transport=_transport(handler)),
        clock=_fixed_clock,
        backoff=backoff,
        sleep=sleeps.append,
    )


def test_429_with_retry_after_seconds_is_honored_exactly():
    """Server says ``Retry-After: 3``; agent sleeps exactly 3.0 s before retry."""
    handler = _responses_handler([
        httpx.Response(429, headers={"Retry-After": "3"}),
        httpx.Response(202),
    ])
    sleeps: list[float] = []
    # base 100 / cap 200 makes a randomized backoff land nowhere near 3.0,
    # so an assertion on exactness proves the header overrode backoff.
    client = _make_client(
        handler,
        backoff=BackoffPolicy(base_seconds=100.0, cap_seconds=200.0, max_retries=3),
        sleeps=sleeps,
    )

    result = client.send("heartbeat", {}, "/api/v1/heartbeat")

    assert result.ok
    assert result.status_code == 202
    assert result.attempts == 2
    assert sleeps == [3.0], sleeps


def test_429_without_retry_after_falls_back_to_backoff():
    """Without the header, the agent uses full-jitter exponential backoff."""
    handler = _responses_handler([
        httpx.Response(429),
        httpx.Response(202),
    ])
    sleeps: list[float] = []
    client = _make_client(
        handler,
        backoff=BackoffPolicy(base_seconds=0.05, cap_seconds=0.1, max_retries=2),
        sleeps=sleeps,
    )

    result = client.send("heartbeat", {}, "/api/v1/heartbeat")

    assert result.ok
    assert len(sleeps) == 1
    # Full-jitter range: 0 ≤ delay ≤ cap_seconds
    assert 0.0 <= sleeps[0] <= 0.1


def test_429_malformed_retry_after_falls_back_to_backoff():
    """Garbage header must not crash the client; fall back to backoff."""
    handler = _responses_handler([
        httpx.Response(429, headers={"Retry-After": "not-a-number"}),
        httpx.Response(202),
    ])
    sleeps: list[float] = []
    client = _make_client(
        handler,
        backoff=BackoffPolicy(base_seconds=0.05, cap_seconds=0.1, max_retries=2),
        sleeps=sleeps,
    )

    result = client.send("heartbeat", {}, "/api/v1/heartbeat")

    assert result.ok
    assert 0.0 <= sleeps[0] <= 0.1


def test_429_http_date_retry_after_falls_back_to_backoff():
    """HTTP-date form is out of scope; we treat it as missing and back off."""
    handler = _responses_handler([
        httpx.Response(429, headers={"Retry-After": "Wed, 21 Oct 2026 07:28:00 GMT"}),
        httpx.Response(202),
    ])
    sleeps: list[float] = []
    client = _make_client(
        handler,
        backoff=BackoffPolicy(base_seconds=0.05, cap_seconds=0.1, max_retries=2),
        sleeps=sleeps,
    )

    result = client.send("heartbeat", {}, "/api/v1/heartbeat")

    assert result.ok
    assert 0.0 <= sleeps[0] <= 0.1


def test_429_retry_after_clamped_to_cap_seconds():
    """A misbehaving server sending ``Retry-After: 999999`` must not hang us."""
    handler = _responses_handler([
        httpx.Response(429, headers={"Retry-After": "999999"}),
        httpx.Response(202),
    ])
    sleeps: list[float] = []
    cap = 5.0
    client = _make_client(
        handler,
        backoff=BackoffPolicy(base_seconds=0.5, cap_seconds=cap, max_retries=2),
        sleeps=sleeps,
    )

    result = client.send("heartbeat", {}, "/api/v1/heartbeat")

    assert result.ok
    assert sleeps == [cap]


def test_429_retry_after_zero_sleeps_zero():
    """``Retry-After: 0`` is the server saying "retry now"; honor literally."""
    handler = _responses_handler([
        httpx.Response(429, headers={"Retry-After": "0"}),
        httpx.Response(202),
    ])
    sleeps: list[float] = []
    client = _make_client(
        handler,
        backoff=BackoffPolicy(base_seconds=10.0, cap_seconds=20.0, max_retries=2),
        sleeps=sleeps,
    )

    result = client.send("heartbeat", {}, "/api/v1/heartbeat")

    assert result.ok
    assert sleeps == [0.0]


def test_429_negative_retry_after_is_treated_as_zero():
    """Negative values are non-compliant; we lenient-coerce to 0 rather than crash."""
    handler = _responses_handler([
        httpx.Response(429, headers={"Retry-After": "-5"}),
        httpx.Response(202),
    ])
    sleeps: list[float] = []
    client = _make_client(
        handler,
        backoff=BackoffPolicy(base_seconds=10.0, cap_seconds=20.0, max_retries=2),
        sleeps=sleeps,
    )

    result = client.send("heartbeat", {}, "/api/v1/heartbeat")

    assert result.ok
    assert sleeps == [0.0]


def test_503_with_retry_after_is_also_honored():
    """Honoring is driven by header presence, not status code: 503 works too.

    The server doesn't send Retry-After on 503 today, but the contract should
    be symmetric so we don't have to revisit this when a future upgrade pause
    emits one.
    """
    handler = _responses_handler([
        httpx.Response(503, headers={"Retry-After": "2"}),
        httpx.Response(202),
    ])
    sleeps: list[float] = []
    client = _make_client(
        handler,
        backoff=BackoffPolicy(base_seconds=100.0, cap_seconds=200.0, max_retries=2),
        sleeps=sleeps,
    )

    result = client.send("heartbeat", {}, "/api/v1/heartbeat")

    assert result.ok
    assert sleeps == [2.0]


def test_exhausted_429_retry_after_still_counts_attempts():
    """If every attempt 429s with Retry-After, we return the last status."""
    handler = _responses_handler([
        httpx.Response(429, headers={"Retry-After": "0"}),
        httpx.Response(429, headers={"Retry-After": "0"}),
        httpx.Response(429, headers={"Retry-After": "0"}),
    ])
    sleeps: list[float] = []
    client = _make_client(
        handler,
        backoff=BackoffPolicy(base_seconds=0.01, cap_seconds=0.05, max_retries=2),
        sleeps=sleeps,
    )

    result = client.send("heartbeat", {}, "/api/v1/heartbeat")

    assert not result.ok
    assert result.status_code == 429
    assert result.attempts == 3
    assert sleeps == [0.0, 0.0]
