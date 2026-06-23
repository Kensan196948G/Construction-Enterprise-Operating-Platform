"""Tests for network-error retry paths in cdx_agent.api_client.

Covers the except (httpx.TransportError, httpx.TimeoutException) block that
handles connection failures during the retry loop.  Existing tests exercise
only transient HTTP-status retries (503, 429); these complement that by
exercising actual transport-level failures.
"""

from __future__ import annotations

import httpx
import pytest

from cdx_agent.api_client import ApiClient
from cdx_agent.backoff import BackoffPolicy

SECRET = "net-error-secret"
DEVICE_ID = "dev-net-err"


def _fixed_clock() -> float:
    return 90.0


def _make_client(
    handler,
    *,
    max_retries: int = 2,
    sleeps: list[float] | None = None,
) -> ApiClient:
    if sleeps is None:
        sleeps = []
    return ApiClient(
        base_url="https://api.example",
        device_id=DEVICE_ID,
        shared_secret=SECRET,
        session=httpx.Client(transport=httpx.MockTransport(handler)),
        clock=_fixed_clock,
        backoff=BackoffPolicy(base_seconds=0.01, cap_seconds=0.1, max_retries=max_retries),
        sleep=sleeps.append,
    )


def test_transport_error_retried_then_succeeds():
    """ConnectError on attempt 0 is retried; attempt 1 succeeds."""
    call_count = {"n": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        n = call_count["n"]
        call_count["n"] += 1
        if n == 0:
            raise httpx.ConnectError("connection refused")
        return httpx.Response(202)

    sleeps: list[float] = []
    client = _make_client(handler, max_retries=2, sleeps=sleeps)
    result = client.send("heartbeat", {}, "/api/v1/heartbeat")

    assert result.ok
    assert result.status_code == 202
    assert call_count["n"] == 2
    assert len(sleeps) == 1  # one sleep between the two attempts


def test_transport_error_exhausted_raises():
    """ConnectError on every attempt raises after retries are exhausted."""

    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("always fails")

    sleeps: list[float] = []
    client = _make_client(handler, max_retries=2, sleeps=sleeps)

    with pytest.raises(httpx.TransportError):
        client.send("heartbeat", {}, "/api/v1/heartbeat")

    assert len(sleeps) == 2  # slept before each of the two retries


def test_timeout_exception_retried_then_succeeds():
    """ReadTimeout (a TimeoutException) on attempt 0 is retried successfully."""
    call_count = {"n": 0}

    def handler(request: httpx.Request) -> httpx.Response:
        n = call_count["n"]
        call_count["n"] += 1
        if n == 0:
            raise httpx.ReadTimeout("read timed out")
        return httpx.Response(200)

    sleeps: list[float] = []
    client = _make_client(handler, max_retries=1, sleeps=sleeps)
    result = client.send("heartbeat", {}, "/api/v1/heartbeat")

    assert result.ok
    assert result.status_code == 200
    assert len(sleeps) == 1
