"""End-to-end contract test for request-id propagation.

The agent binds a request-id in a ``request_scope()`` before calling
``ApiClient.send``; the agent attaches it as ``X-Request-Id``; the server's
``RequestIDMiddleware`` echoes it back on the response. Any regression on
either side (header name typo, missing middleware, missing propagation in
api_client) flips this test red.
"""

from __future__ import annotations

import pytest
from cdx_agent.api_client import ApiClient
from cdx_agent.obs.request_id import request_scope
from fastapi.testclient import TestClient

from cdx_server.app import create_app
from cdx_server.storage import InMemoryStorage

DEVICE_ID = "trace-contract-device"
SECRET = "trace-contract-secret-32chars!!"


@pytest.fixture
def traced_client(registration_headers):
    storage = InMemoryStorage()
    app = create_app(storage=storage)
    fastapi_client = TestClient(app)

    response = fastapi_client.post(
        "/api/v1/devices/register",
        json={
            "device_id": DEVICE_ID,
            "profile": "standard",
            "hostname": "trace-host",
            "shared_secret": SECRET,
        },
        headers=registration_headers,
    )
    assert response.status_code == 200, response.text
    return fastapi_client, storage


def _agent(fastapi_client: TestClient) -> ApiClient:
    return ApiClient(
        base_url="",
        device_id=DEVICE_ID,
        shared_secret=SECRET,
        session=fastapi_client,
        clock=lambda: 120.0,
    )


def test_agent_bound_request_id_is_echoed_by_server(traced_client):
    """When the agent binds a request-id, the server's response echoes it."""
    fastapi_client, _ = traced_client
    agent = _agent(fastapi_client)

    # Capture the server's response headers for this call.
    captured_headers = {}
    original_post = fastapi_client.post

    def post_and_capture(*args, **kwargs):
        response = original_post(*args, **kwargs)
        captured_headers.clear()
        captured_headers.update(response.headers)
        return response

    fastapi_client.post = post_and_capture  # type: ignore[method-assign]

    with request_scope("e2e-trace-abc-123") as rid:
        agent.send(
            "heartbeat",
            {
                "device_id": DEVICE_ID,
                "agent_version": "0.2.0",
                "uptime_seconds": 1,
                "sent_at": "2026-04-15T00:00:00+00:00",
                "kind": "heartbeat",
            },
            "/api/v1/heartbeat",
        )
        assert rid == "e2e-trace-abc-123"

    assert captured_headers.get("x-request-id") == "e2e-trace-abc-123"


def test_unbound_agent_sends_no_id_but_server_generates_one(traced_client):
    """Without a request_scope, agent omits the header and the server
    generates a fresh one (so observability never goes dark)."""
    fastapi_client, _ = traced_client
    agent = _agent(fastapi_client)

    captured_headers = {}
    original_post = fastapi_client.post

    def post_and_capture(*args, **kwargs):
        response = original_post(*args, **kwargs)
        captured_headers.clear()
        captured_headers.update(response.headers)
        return response

    fastapi_client.post = post_and_capture  # type: ignore[method-assign]

    agent.send(
        "heartbeat",
        {
            "device_id": DEVICE_ID,
            "agent_version": "0.2.0",
            "uptime_seconds": 1,
            "sent_at": "2026-04-15T00:00:00+00:00",
            "kind": "heartbeat",
        },
        "/api/v1/heartbeat",
    )

    # Server always tags responses with a request-id — never empty.
    rid = captured_headers.get("x-request-id", "")
    assert len(rid) == 32  # 32-hex UUID
