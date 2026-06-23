"""Tests for cdx_agent.api_client.

We use ``httpx.MockTransport`` so no real HTTP stack is exercised and the
signature verification can be done inline.
"""

from __future__ import annotations

import json

import httpx
import pytest

from cdx_agent import sign as sign_mod
from cdx_agent.api_client import ApiClient

SECRET = "t0p-secret"
DEVICE_ID = "dev-42"


def _transport(handler):
    return httpx.MockTransport(handler)


def _fixed_clock() -> float:
    # Lands inside heartbeat bucket 60
    return 90.0


def test_send_builds_signed_headers_and_returns_ok():
    captured: dict[str, object] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["url"] = str(request.url)
        captured["headers"] = dict(request.headers)
        captured["body"] = bytes(request.content)
        return httpx.Response(202, json={"received": True})

    session = httpx.Client(transport=_transport(handler))
    client = ApiClient(
        base_url="https://api.example/",
        device_id=DEVICE_ID,
        shared_secret=SECRET,
        session=session,
        clock=_fixed_clock,
    )

    result = client.send("heartbeat", {"k": 1}, "/api/v1/heartbeat")
    assert result.ok
    assert result.status_code == 202
    headers = captured["headers"]
    assert headers["x-cdx-device-id"] == DEVICE_ID
    assert headers["x-cdx-payload-type"] == "heartbeat"
    assert headers["x-cdx-timestamp-bucket"] == "60"
    assert headers["content-type"].startswith("application/json")

    canonical = sign_mod.canonical_string(
        device_id=DEVICE_ID,
        payload_type="heartbeat",
        timestamp_bucket=60,
        body_bytes=captured["body"],
    )
    assert sign_mod.verify(SECRET, canonical, headers["x-cdx-signature"])


def test_send_returns_not_ok_on_4xx():
    def handler(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(401, json={"error": "unauthorized"})

    session = httpx.Client(transport=_transport(handler))
    client = ApiClient(
        base_url="https://api.example",
        device_id=DEVICE_ID,
        shared_secret=SECRET,
        session=session,
        clock=_fixed_clock,
    )
    result = client.send("heartbeat", {}, "/api/v1/heartbeat")
    assert not result.ok
    assert result.status_code == 401


def test_body_is_canonicalised_sorted_keys():
    captured: dict[str, bytes] = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["body"] = bytes(request.content)
        return httpx.Response(200)

    session = httpx.Client(transport=_transport(handler))
    client = ApiClient(
        base_url="https://api.example",
        device_id=DEVICE_ID,
        shared_secret=SECRET,
        session=session,
        clock=_fixed_clock,
    )
    client.send("inventory", {"b": 2, "a": 1}, "/api/v1/inventory")
    # Sorted keys put "a" before "b" regardless of dict insertion order.
    decoded = json.loads(captured["body"])
    assert list(decoded.keys()) == ["a", "b"]


def test_missing_device_id_raises():
    with pytest.raises(ValueError):
        ApiClient(base_url="https://x", device_id="", shared_secret="s")


def test_missing_secret_raises():
    with pytest.raises(ValueError):
        ApiClient(base_url="https://x", device_id="d", shared_secret="")


def test_retries_on_5xx_then_succeeds():
    from cdx_agent.backoff import BackoffPolicy

    responses = [httpx.Response(503), httpx.Response(503), httpx.Response(202)]
    call_count = {"n": 0}

    def handler(_request: httpx.Request) -> httpx.Response:
        idx = call_count["n"]
        call_count["n"] += 1
        return responses[idx]

    sleeps: list[float] = []

    session = httpx.Client(transport=_transport(handler))
    client = ApiClient(
        base_url="https://api.example",
        device_id=DEVICE_ID,
        shared_secret=SECRET,
        session=session,
        clock=_fixed_clock,
        backoff=BackoffPolicy(base_seconds=0.01, cap_seconds=0.1, max_retries=2),
        sleep=sleeps.append,
    )
    result = client.send("heartbeat", {}, "/api/v1/heartbeat")
    assert result.ok
    assert result.status_code == 202
    assert result.attempts == 3
    assert len(sleeps) == 2  # slept before each of the 2 retries


def test_retries_exhausted_returns_last_status():
    from cdx_agent.backoff import BackoffPolicy

    def handler(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(503)

    session = httpx.Client(transport=_transport(handler))
    client = ApiClient(
        base_url="https://api.example",
        device_id=DEVICE_ID,
        shared_secret=SECRET,
        session=session,
        clock=_fixed_clock,
        backoff=BackoffPolicy(base_seconds=0.01, cap_seconds=0.05, max_retries=2),
        sleep=lambda _s: None,
    )
    result = client.send("heartbeat", {}, "/api/v1/heartbeat")
    assert not result.ok
    assert result.status_code == 503
    assert result.attempts == 3


def test_4xx_does_not_retry():
    """4xx is a programmer/auth bug — retrying does not help."""
    from cdx_agent.backoff import BackoffPolicy

    call_count = {"n": 0}

    def handler(_request: httpx.Request) -> httpx.Response:
        call_count["n"] += 1
        return httpx.Response(401)

    session = httpx.Client(transport=_transport(handler))
    client = ApiClient(
        base_url="https://api.example",
        device_id=DEVICE_ID,
        shared_secret=SECRET,
        session=session,
        clock=_fixed_clock,
        backoff=BackoffPolicy(base_seconds=0.01, cap_seconds=0.05, max_retries=5),
        sleep=lambda _s: None,
    )
    result = client.send("heartbeat", {}, "/api/v1/heartbeat")
    assert result.status_code == 401
    assert result.attempts == 1
    assert call_count["n"] == 1


def test_no_backoff_means_no_retry():
    """Default behavior (no backoff policy) is single-attempt."""
    call_count = {"n": 0}

    def handler(_request: httpx.Request) -> httpx.Response:
        call_count["n"] += 1
        return httpx.Response(503)

    session = httpx.Client(transport=_transport(handler))
    client = ApiClient(
        base_url="https://api.example",
        device_id=DEVICE_ID,
        shared_secret=SECRET,
        session=session,
        clock=_fixed_clock,
    )
    result = client.send("heartbeat", {}, "/api/v1/heartbeat")
    assert call_count["n"] == 1
    assert result.attempts == 1
