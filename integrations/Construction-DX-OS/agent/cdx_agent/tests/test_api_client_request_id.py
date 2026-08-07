"""Ensure cdx-agent forwards X-Request-Id when one is bound in context."""

from __future__ import annotations

import httpx

from cdx_agent.api_client import ApiClient
from cdx_agent.obs.request_id import request_scope

SECRET = "s" * 32
DEVICE_ID = "dev-obs"


def _fixed_clock():
    return 90.0


def test_request_id_header_propagates_when_bound():
    captured = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["headers"] = dict(request.headers)
        return httpx.Response(202)

    session = httpx.Client(transport=httpx.MockTransport(handler))
    client = ApiClient(
        base_url="https://api.example",
        device_id=DEVICE_ID,
        shared_secret=SECRET,
        session=session,
        clock=_fixed_clock,
    )
    with request_scope("trace-send-abc"):
        client.send("heartbeat", {}, "/api/v1/heartbeat")
    assert captured["headers"]["x-request-id"] == "trace-send-abc"


def test_request_id_header_absent_when_not_bound():
    captured = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["headers"] = dict(request.headers)
        return httpx.Response(202)

    session = httpx.Client(transport=httpx.MockTransport(handler))
    client = ApiClient(
        base_url="https://api.example",
        device_id=DEVICE_ID,
        shared_secret=SECRET,
        session=session,
        clock=_fixed_clock,
    )
    client.send("heartbeat", {}, "/api/v1/heartbeat")
    assert "x-request-id" not in captured["headers"]


def test_literal_dash_request_id_is_forwarded():
    """A caller-supplied '-' must be propagated (review Loop 7 Medium)."""
    captured = {}

    def handler(request: httpx.Request) -> httpx.Response:
        captured["headers"] = dict(request.headers)
        return httpx.Response(202)

    session = httpx.Client(transport=httpx.MockTransport(handler))
    client = ApiClient(
        base_url="https://api.example",
        device_id=DEVICE_ID,
        shared_secret=SECRET,
        session=session,
        clock=_fixed_clock,
    )
    with request_scope("-"):
        client.send("heartbeat", {}, "/api/v1/heartbeat")
    assert captured["headers"]["x-request-id"] == "-"
