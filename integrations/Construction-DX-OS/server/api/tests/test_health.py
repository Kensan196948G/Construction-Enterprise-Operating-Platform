"""Tests for GET /health."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from cdx_server.app import create_app
from cdx_server.rate_limit import NullRateLimiter
from cdx_server.storage import InMemoryStorage


def test_health_returns_ok(client):
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["service"] == "cdx-server"
    assert "version" in body


def test_health_includes_storage_fields(client):
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["storage"] == "ok"
    assert body["storage_backend"] == "InMemoryStorage"


def test_health_degraded_when_storage_fails():
    """503 with status=degraded when storage.ping() raises."""
    storage = InMemoryStorage()

    # Monkey-patch ping to an async coroutine that raises
    async def _failing_ping() -> bool:
        raise RuntimeError("db down")

    storage.ping = _failing_ping  # type: ignore[method-assign]

    app = create_app(storage=storage, rate_limiter=NullRateLimiter())
    with TestClient(app, raise_server_exceptions=False) as c:
        response = c.get("/health")

    assert response.status_code == 503
    body = response.json()
    # FastAPI wraps HTTPException detail in {"detail": ...}
    detail = body.get("detail", body)
    assert detail["status"] == "degraded"
    assert detail["storage"] == "error"


@pytest.mark.asyncio
async def test_health_ping_not_called_for_in_memory():
    """InMemoryStorage.ping() always returns True without raising."""
    s = InMemoryStorage()
    assert await s.ping() is True


def test_health_includes_uptime_seconds(client):
    """uptime_seconds should be a non-negative float."""
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert "uptime_seconds" in body
    assert isinstance(body["uptime_seconds"], (int, float))
    assert body["uptime_seconds"] >= 0.0


# ---------------------------------------------------------------------------
# Issue 0053: Kubernetes-style liveness / readiness probes
# ---------------------------------------------------------------------------


def test_health_live_returns_200(client):
    """GET /health/live must always return 200 — process-level vitals only."""
    response = client.get("/health/live")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["service"] == "cdx-server"
    assert "version" in body
    assert "uptime_seconds" in body
    assert isinstance(body["uptime_seconds"], (int, float))
    assert body["uptime_seconds"] >= 0.0


def test_health_live_omits_dependency_fields(client):
    """Liveness response must NOT expose storage / Redis status.

    A downstream outage must not leak into the liveness payload, otherwise
    operators may wire it to a deep monitor and trigger pod restarts on
    transient dependency failures (the bug this Issue exists to prevent).
    """
    body = client.get("/health/live").json()
    assert "storage" not in body
    assert "storage_backend" not in body
    assert "redis" not in body


def test_health_live_stays_200_when_storage_fails():
    """Storage failure MUST NOT fail liveness — that would cause restart loops."""
    storage = InMemoryStorage()

    async def _failing_ping() -> bool:
        raise RuntimeError("db down")

    storage.ping = _failing_ping  # type: ignore[method-assign]

    app = create_app(storage=storage, rate_limiter=NullRateLimiter())
    with TestClient(app, raise_server_exceptions=False) as c:
        response = c.get("/health/live")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_health_ready_returns_200_when_storage_ok(client):
    """GET /health/ready returns 200 with deep-check fields when storage is ok."""
    response = client.get("/health/ready")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["storage"] == "ok"
    assert body["storage_backend"] == "InMemoryStorage"


def test_health_ready_503_when_storage_fails():
    """/health/ready must return 503 when storage.ping() raises."""
    storage = InMemoryStorage()

    async def _failing_ping() -> bool:
        raise RuntimeError("db down")

    storage.ping = _failing_ping  # type: ignore[method-assign]

    app = create_app(storage=storage, rate_limiter=NullRateLimiter())
    with TestClient(app, raise_server_exceptions=False) as c:
        response = c.get("/health/ready")

    assert response.status_code == 503
    detail = response.json().get("detail", {})
    assert detail.get("status") == "degraded"
    assert detail.get("storage") == "error"


def test_health_legacy_endpoint_unchanged(client):
    """Backward compatibility: GET /health behaviour must match pre-0053."""
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["service"] == "cdx-server"
    assert body["storage"] == "ok"
    assert "version" in body
    assert "uptime_seconds" in body


def test_root_redirects_to_admin_spa(client: TestClient) -> None:
    """GET / must redirect to /admin-spa/ (Issue 0039, Loop 73)."""
    resp = client.get("/", follow_redirects=False)
    assert resp.status_code == 302
    assert resp.headers["location"] == "/admin-spa/"


def test_root_redirect_chain_serves_spa(client: TestClient) -> None:
    """Following the root redirect lands on the Admin SPA index page."""
    resp = client.get("/", follow_redirects=True)
    assert resp.status_code == 200
    assert "text/html" in resp.headers["content-type"]
    assert "建設DX OS" in resp.text
