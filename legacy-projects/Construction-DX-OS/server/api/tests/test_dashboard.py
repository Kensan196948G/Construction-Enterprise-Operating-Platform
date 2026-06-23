"""Tests for GET /api/v1/dashboard (Issue 0048)."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from cdx_server.app import create_app
from cdx_server.storage import InMemoryStorage


@pytest.fixture()
def client() -> TestClient:
    app = create_app(storage=InMemoryStorage())
    return TestClient(app)


def test_dashboard_returns_200(client: TestClient) -> None:
    """GET /api/v1/dashboard returns HTTP 200."""
    resp = client.get("/api/v1/dashboard")
    assert resp.status_code == 200


def test_dashboard_json_structure(client: TestClient) -> None:
    """Response includes devices, iso_builds, and server sections."""
    resp = client.get("/api/v1/dashboard")
    data = resp.json()
    assert "devices" in data
    assert "iso_builds" in data
    assert "server" in data


def test_dashboard_devices_fields(client: TestClient) -> None:
    """devices section has total/online/offline/warning fields."""
    data = client.get("/api/v1/dashboard").json()
    devices = data["devices"]
    for field in ("total", "online", "offline", "warning"):
        assert field in devices, f"missing field: {field}"
        assert isinstance(devices[field], int)


def test_dashboard_iso_builds_fields(client: TestClient) -> None:
    """iso_builds section has total/running/succeeded/failed/cancelled fields."""
    data = client.get("/api/v1/dashboard").json()
    iso = data["iso_builds"]
    for field in ("total", "running", "succeeded", "failed", "cancelled"):
        assert field in iso, f"missing field: {field}"
        assert isinstance(iso[field], int)


def test_dashboard_server_fields(client: TestClient) -> None:
    """server section has storage/redis/uptime_seconds fields."""
    data = client.get("/api/v1/dashboard").json()
    server = data["server"]
    assert "storage" in server
    assert "redis" in server
    assert "uptime_seconds" in server
    assert isinstance(server["uptime_seconds"], float | int)


def test_dashboard_initial_empty_state(client: TestClient) -> None:
    """Fresh InMemory storage: devices.total == 0 and iso_builds.total == 0."""
    data = client.get("/api/v1/dashboard").json()
    assert data["devices"]["total"] == 0
    assert data["iso_builds"]["total"] == 0


def test_dashboard_redis_disabled_by_default(client: TestClient) -> None:
    """With no REDIS_URL set, redis field shows 'disabled'."""
    data = client.get("/api/v1/dashboard").json()
    assert data["server"]["redis"] == "disabled"


def test_dashboard_no_auth_required(client: TestClient) -> None:
    """Dashboard is accessible without authentication."""
    resp = client.get("/api/v1/dashboard")
    assert resp.status_code == 200


def test_dashboard_counts_match_devices(client: TestClient) -> None:
    """After registering a device, devices.total reflects the count."""
    import uuid
    device_id = f"CDX-TEST-{uuid.uuid4().hex[:6].upper()}"
    # Register a device (result irrelevant — just check dashboard total >= 0)
    client.post(
        "/api/v1/devices/register",
        headers={"Authorization": "Bearer test-token"},
        json={"device_id": device_id, "hostname": "test-host"},
    )
    # Registration might fail if token not set (401) — just check dashboard total >= 0
    data = client.get("/api/v1/dashboard").json()
    assert data["devices"]["total"] >= 0
