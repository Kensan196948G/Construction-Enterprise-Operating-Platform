"""End-to-end contract test: cdx-agent ApiClient ↔ cdx-server TestClient.

This test imports BOTH local packages to prove that the agent-side signing
matches exactly what the server-side auth dependency expects. If either side
changes its canonicalisation, this test flips red.

The test monkey-patches ``httpx.Client.post`` so the agent's ApiClient
actually hits the FastAPI app's TestClient instead of opening a socket.
"""

from __future__ import annotations

from collections import deque
from unittest.mock import MagicMock

import pytest
from cdx_agent.api_client import ApiClient
from cdx_agent.backoff import BackoffPolicy
from cdx_agent.spool import Spool, SpoolEntry
from cdx_agent.sync import SyncOrchestrator
from fastapi.testclient import TestClient

from cdx_server.app import create_app
from cdx_server.storage import InMemoryStorage

DEVICE_ID = "contract-device-1"
SECRET = "contract-secret-thirty-two-characters"


@pytest.fixture
def contract_client(registration_headers):
    storage = InMemoryStorage()
    app = create_app(storage=storage)
    fastapi_client = TestClient(app)

    response = fastapi_client.post(
        "/api/v1/devices/register",
        json={
            "device_id": DEVICE_ID,
            "profile": "standard",
            "hostname": "contract-host",
            "shared_secret": SECRET,
        },
        headers=registration_headers,
    )
    assert response.status_code == 200, response.text
    return fastapi_client, storage


def _agent_client(fastapi_client: TestClient, clock: float = 120.0) -> ApiClient:
    # FastAPI's TestClient is httpx.Client-compatible: reuse it as the session.
    return ApiClient(
        base_url="",
        device_id=DEVICE_ID,
        shared_secret=SECRET,
        session=fastapi_client,
        clock=lambda: clock,
    )


@pytest.mark.asyncio
async def test_heartbeat_roundtrip(contract_client):
    fastapi_client, storage = contract_client
    agent = _agent_client(fastapi_client)

    result = agent.send(
        "heartbeat",
        {
            "device_id": DEVICE_ID,
            "agent_version": "0.2.0",
            "uptime_seconds": 42,
            "sent_at": "2026-04-15T00:00:00+00:00",
            "kind": "heartbeat",
        },
        "/api/v1/heartbeat",
    )
    assert result.ok
    assert result.status_code == 200
    assert await storage.count_heartbeats() == 1


@pytest.mark.asyncio
async def test_inventory_roundtrip(contract_client):
    fastapi_client, storage = contract_client
    # inventory uses 1-hour bucket — pick clock 3660 → bucket 3600
    agent = _agent_client(fastapi_client, clock=3660.0)

    result = agent.send(
        "inventory",
        {
            "device_id": DEVICE_ID,
            "hostname": "contract-host",
            "cpu": "x86_64",
            "cpu_count": 4,
            "memory_bytes": 8 * 1024 * 1024 * 1024,
            "os_version": "Debian 13",
            "kernel_version": "6.9.0",
            "timezone": "UTC",
            "collected_at": "2026-04-15T01:01:00+00:00",
        },
        "/api/v1/inventory",
    )
    assert result.ok
    assert await storage.count_inventories() == 1


@pytest.mark.asyncio
async def test_sync_orchestrator_flushes_spool(tmp_path, contract_client):
    fastapi_client, storage = contract_client
    agent = _agent_client(fastapi_client)

    spool = Spool(tmp_path / "outbox.jsonl")
    orchestrator = SyncOrchestrator(agent, spool)

    for n in range(3):
        spool.append(
            SpoolEntry(
                payload_type="heartbeat",
                body={
                    "device_id": DEVICE_ID,
                    "agent_version": "0.2.0",
                    "uptime_seconds": n,
                    "sent_at": f"2026-04-15T00:0{n}:00+00:00",
                    "kind": "heartbeat",
                },
                enqueued_at=float(n),
            )
        )

    result = orchestrator.drain()
    assert result.all_flushed
    assert result.sent == 3
    # All three heartbeats land in the same bucket=60 because clock is fixed → 1 stored (idempotent).
    # The drain still reports sent=3 because all requests were accepted; storage dedupes.
    assert await storage.count_heartbeats() == 1


def test_unregistered_device_is_rejected(contract_client):
    fastapi_client, _ = contract_client
    # Use a device the registry does not know about.
    rogue = ApiClient(
        base_url="",
        device_id="rogue-device",
        shared_secret=SECRET,
        session=fastapi_client,
        clock=lambda: 60.0,
    )
    result = rogue.send(
        "heartbeat",
        {
            "device_id": "rogue-device",
            "agent_version": "0.2.0",
            "uptime_seconds": 1,
            "sent_at": "2026-04-15T00:00:00+00:00",
            "kind": "heartbeat",
        },
        "/api/v1/heartbeat",
    )
    assert not result.ok
    assert result.status_code == 401


# ---------------------------------------------------------------------------
# Retry contract: 5xx → retry → success
# ---------------------------------------------------------------------------


class _FaultInjectSession:
    """Wraps a real TestClient but returns synthetic 5xx responses for the
    first ``fault_count`` POST calls, then delegates to the real client.

    This lets us verify that ApiClient's backoff loop retries transient server
    errors and eventually delivers a successful request — without needing a
    real network or a Postgres service.
    """

    def __init__(self, real_client: TestClient, fault_count: int, fault_status: int = 503):
        self._client = real_client
        self._faults: deque[int] = deque([fault_status] * fault_count)

    def post(self, url: str, **kwargs):  # signature matches httpx.Client.post
        if self._faults:
            status = self._faults.popleft()
            resp = MagicMock()
            resp.status_code = status
            resp.headers = {}
            return resp
        return self._client.post(url, **kwargs)


@pytest.mark.asyncio
async def test_5xx_retry_eventually_succeeds(contract_client):
    """ApiClient retries 5xx responses and delivers the payload on recovery.

    Scenario: server returns 503 twice, then accepts on the third attempt.
    The test verifies:
    - result.ok is True (200 received on attempt 3)
    - result.attempts == 3
    - sleep was called twice (once per failed attempt)
    - the heartbeat lands in storage (server processed it)
    """
    fastapi_client, storage = contract_client

    fault_session = _FaultInjectSession(fastapi_client, fault_count=2, fault_status=503)

    sleep_calls: list[float] = []
    agent = ApiClient(
        base_url="",
        device_id=DEVICE_ID,
        shared_secret=SECRET,
        session=fault_session,
        clock=lambda: 240.0,  # bucket=240 — different from other tests
        backoff=BackoffPolicy(base_seconds=0.001, cap_seconds=0.01, max_retries=3),
        sleep=sleep_calls.append,
    )

    result = agent.send(
        "heartbeat",
        {
            "device_id": DEVICE_ID,
            "agent_version": "0.2.0",
            "uptime_seconds": 99,
            "sent_at": "2026-04-16T04:00:00+00:00",
            "kind": "heartbeat",
        },
        "/api/v1/heartbeat",
    )

    assert result.ok, f"Expected success after retry; got status={result.status_code}"
    assert result.attempts == 3, f"Expected 3 attempts; got {result.attempts}"
    assert len(sleep_calls) == 2, f"Expected 2 sleeps; got {sleep_calls}"
    assert await storage.count_heartbeats() >= 1


def test_5xx_all_retries_exhausted_returns_failure(contract_client):
    """ApiClient gives up after max_retries and surfaces the last error status.

    Scenario: server always returns 500. With max_retries=2 the client makes
    3 total attempts, then returns a failed SendResult (not raises).
    """
    fastapi_client, _ = contract_client

    # Inject more faults than max_retries so the client never sees a 200.
    fault_session = _FaultInjectSession(fastapi_client, fault_count=10, fault_status=500)

    sleep_calls: list[float] = []
    agent = ApiClient(
        base_url="",
        device_id=DEVICE_ID,
        shared_secret=SECRET,
        session=fault_session,
        clock=lambda: 300.0,
        backoff=BackoffPolicy(base_seconds=0.001, cap_seconds=0.01, max_retries=2),
        sleep=sleep_calls.append,
    )

    result = agent.send(
        "heartbeat",
        {
            "device_id": DEVICE_ID,
            "agent_version": "0.2.0",
            "uptime_seconds": 0,
            "sent_at": "2026-04-16T04:00:00+00:00",
            "kind": "heartbeat",
        },
        "/api/v1/heartbeat",
    )

    assert not result.ok
    assert result.status_code == 500
    assert result.attempts == 3  # initial + 2 retries
    assert len(sleep_calls) == 2
