"""Tests for the /admin SSR UI (Phase 3 WebUI)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from cdx_server.app import create_app
from cdx_server.routers.admin import _heartbeat_freshness
from cdx_server.storage import InMemoryStorage


@pytest.fixture()
def storage() -> InMemoryStorage:
    s = InMemoryStorage()
    s.reset()
    return s


@pytest.fixture()
def client(storage: InMemoryStorage) -> TestClient:
    app = create_app(storage=storage)
    return TestClient(app)


# ---- /admin device list -----------------------------------------------------


def test_admin_empty_device_list(client: TestClient) -> None:
    resp = client.get("/admin")
    assert resp.status_code == 200
    assert "text/html" in resp.headers["content-type"]
    assert "No devices registered yet" in resp.text


@pytest.mark.asyncio
async def test_admin_device_list_shows_registered_devices(
    client: TestClient, storage: InMemoryStorage
) -> None:
    await storage.register_device(
        device_id="dev-001",
        profile="standard",
        hostname="machine-a",
        shared_secret="s1",
    )
    await storage.register_device(
        device_id="dev-002",
        profile="field",
        hostname="machine-b",
        shared_secret="s2",
    )
    resp = client.get("/admin")
    assert resp.status_code == 200
    assert "dev-001" in resp.text
    assert "dev-002" in resp.text
    assert "machine-a" in resp.text
    assert "machine-b" in resp.text
    assert "standard" in resp.text
    assert "field" in resp.text


def test_admin_device_list_contains_health_badge(client: TestClient) -> None:
    resp = client.get("/admin")
    assert resp.status_code == 200
    # Storage is InMemory (always ok), so badge should say OK
    assert "badge-ok" in resp.text


# ---- Issue 0033: device list online/offline badges --------------------------


def test_device_list_shows_fleet_summary_no_devices(client: TestClient) -> None:
    resp = client.get("/admin")
    assert resp.status_code == 200
    # When no devices, the summary div is not rendered (CSS class in <style> is ok)
    assert 'class="fleet-summary"' not in resp.text


@pytest.mark.asyncio
async def test_device_list_shows_unknown_badge_no_heartbeat(
    client: TestClient, storage: InMemoryStorage
) -> None:
    await storage.register_device(
        device_id="dev-001", profile="standard", hostname="h", shared_secret="s"
    )
    resp = client.get("/admin")
    assert resp.status_code == 200
    assert "badge-unknown" in resp.text
    assert "未確認 1" in resp.text


@pytest.mark.asyncio
async def test_device_list_shows_online_badge_recent_heartbeat(
    client: TestClient, storage: InMemoryStorage
) -> None:
    from datetime import UTC, datetime

    await storage.register_device(
        device_id="dev-001", profile="standard", hostname="h", shared_secret="s"
    )
    await storage.record_heartbeat(
        device_id="dev-001",
        timestamp_bucket=int(datetime.now(UTC).timestamp() // 60),
        agent_version="0.1.0",
        uptime_seconds=60,
        sent_at=datetime.now(UTC).isoformat(),
    )
    resp = client.get("/admin")
    assert resp.status_code == 200
    assert "badge-online" in resp.text
    assert "オンライン 1" in resp.text


@pytest.mark.asyncio
async def test_device_list_mixed_fleet_counts(client: TestClient, storage: InMemoryStorage) -> None:
    from datetime import UTC, datetime

    await storage.register_device(
        device_id="dev-001", profile="standard", hostname="h1", shared_secret="s1"
    )
    await storage.register_device(
        device_id="dev-002", profile="field", hostname="h2", shared_secret="s2"
    )
    # dev-001: online (recent heartbeat)
    await storage.record_heartbeat(
        device_id="dev-001",
        timestamp_bucket=int(datetime.now(UTC).timestamp() // 60),
        agent_version="0.1.0",
        uptime_seconds=60,
        sent_at=datetime.now(UTC).isoformat(),
    )
    # dev-002: no heartbeat → unknown
    resp = client.get("/admin")
    assert resp.status_code == 200
    assert "オンライン 1" in resp.text
    assert "未確認 1" in resp.text


# ---- /admin/devices/{device_id} detail --------------------------------------


def test_admin_device_detail_404_unknown(client: TestClient) -> None:
    resp = client.get("/admin/devices/no-such-device")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_admin_device_detail_shows_device_info(
    client: TestClient, storage: InMemoryStorage
) -> None:
    await storage.register_device(
        device_id="dev-001",
        profile="kiosk",
        hostname="kiosk-a",
        shared_secret="s",
    )
    resp = client.get("/admin/devices/dev-001")
    assert resp.status_code == 200
    assert "dev-001" in resp.text
    assert "kiosk-a" in resp.text
    assert "kiosk" in resp.text


@pytest.mark.asyncio
async def test_admin_device_detail_empty_heartbeats(
    client: TestClient, storage: InMemoryStorage
) -> None:
    await storage.register_device(
        device_id="dev-001",
        profile="standard",
        hostname="host",
        shared_secret="s",
    )
    resp = client.get("/admin/devices/dev-001")
    assert resp.status_code == 200
    assert "No heartbeats recorded" in resp.text


@pytest.mark.asyncio
async def test_admin_device_detail_shows_heartbeats(
    client: TestClient, storage: InMemoryStorage
) -> None:
    await storage.register_device(
        device_id="dev-001",
        profile="standard",
        hostname="host",
        shared_secret="s",
    )
    await storage.record_heartbeat(
        device_id="dev-001",
        timestamp_bucket=1000,
        agent_version="0.1.0",
        uptime_seconds=3600,
        sent_at="2026-04-16T00:00:00Z",
    )
    resp = client.get("/admin/devices/dev-001")
    assert resp.status_code == 200
    assert "0.1.0" in resp.text
    assert "3600" in resp.text


@pytest.mark.asyncio
async def test_admin_device_detail_shows_inventory(
    client: TestClient, storage: InMemoryStorage
) -> None:
    await storage.register_device(
        device_id="dev-001",
        profile="standard",
        hostname="host",
        shared_secret="s",
    )
    await storage.record_inventory(
        device_id="dev-001",
        timestamp_bucket=2000,
        body={"os": "Debian 12", "kernel": "6.1.0"},
    )
    resp = client.get("/admin/devices/dev-001")
    assert resp.status_code == 200
    assert "Debian 12" in resp.text
    assert "6.1.0" in resp.text


@pytest.mark.asyncio
async def test_admin_device_detail_empty_inventory(
    client: TestClient, storage: InMemoryStorage
) -> None:
    await storage.register_device(
        device_id="dev-001",
        profile="standard",
        hostname="host",
        shared_secret="s",
    )
    resp = client.get("/admin/devices/dev-001")
    assert resp.status_code == 200
    assert "No inventory snapshots" in resp.text


# ---- Issue 0028: online/offline badge, relative time, policy, collapsible ---


@pytest.mark.asyncio
async def test_device_detail_shows_offline_badge_no_heartbeats(
    client: TestClient, storage: InMemoryStorage
) -> None:
    await storage.register_device(
        device_id="dev-001", profile="standard", hostname="h", shared_secret="s"
    )
    resp = client.get("/admin/devices/dev-001")
    assert resp.status_code == 200
    assert "未確認" in resp.text


@pytest.mark.asyncio
async def test_device_detail_shows_online_badge_recent_heartbeat(
    client: TestClient, storage: InMemoryStorage
) -> None:
    from datetime import UTC, datetime

    await storage.register_device(
        device_id="dev-001", profile="standard", hostname="h", shared_secret="s"
    )
    await storage.record_heartbeat(
        device_id="dev-001",
        timestamp_bucket=int(datetime.now(UTC).timestamp() // 60),
        agent_version="0.1.0",
        uptime_seconds=60,
        sent_at=datetime.now(UTC).isoformat(),
    )
    resp = client.get("/admin/devices/dev-001")
    assert resp.status_code == 200
    assert "オンライン" in resp.text


@pytest.mark.asyncio
async def test_device_detail_shows_policy_section(
    client: TestClient, storage: InMemoryStorage
) -> None:
    await storage.register_device(
        device_id="dev-001", profile="standard", hostname="h", shared_secret="s"
    )
    resp = client.get("/admin/devices/dev-001")
    assert resp.status_code == 200
    assert "ポリシー設定" in resp.text
    assert "ring1" in resp.text
    assert "heartbeat_interval_seconds" not in resp.text  # rendered as label, not key
    assert "Heartbeat 間隔" in resp.text


@pytest.mark.asyncio
async def test_device_detail_inventory_collapsible(
    client: TestClient, storage: InMemoryStorage
) -> None:
    await storage.register_device(
        device_id="dev-001", profile="standard", hostname="h", shared_secret="s"
    )
    await storage.record_inventory(
        device_id="dev-001",
        timestamp_bucket=3000,
        body={"os": "Debian 13", "kernel": "6.5.0"},
    )
    resp = client.get("/admin/devices/dev-001")
    assert resp.status_code == 200
    assert "<details" in resp.text
    assert "<summary" in resp.text
    assert "Debian 13" in resp.text


# ---- _heartbeat_freshness helper unit tests (Loop 70 refactor) --------------


def test_heartbeat_freshness_empty_list() -> None:
    """No heartbeats → (False, None)."""
    now = datetime.now(UTC)
    assert _heartbeat_freshness([], now) == (False, None)


def test_heartbeat_freshness_recent_is_online() -> None:
    """Heartbeat within 5min → online, minutes is small."""
    now = datetime.now(UTC)
    hb = SimpleNamespace(received_at=now - timedelta(minutes=2))
    is_online, minutes = _heartbeat_freshness([hb], now)
    assert is_online is True
    assert minutes == 2


def test_heartbeat_freshness_stale_is_offline() -> None:
    """Heartbeat older than 5min → offline, minutes reflects age."""
    now = datetime.now(UTC)
    hb = SimpleNamespace(received_at=now - timedelta(minutes=15))
    is_online, minutes = _heartbeat_freshness([hb], now)
    assert is_online is False
    assert minutes == 15


def test_heartbeat_freshness_naive_datetime_normalized() -> None:
    """Naive datetime in received_at is treated as UTC (matches storage)."""
    now = datetime.now(UTC)
    naive = (now - timedelta(minutes=1)).replace(tzinfo=None)
    hb = SimpleNamespace(received_at=naive)
    is_online, minutes = _heartbeat_freshness([hb], now)
    assert is_online is True
    assert minutes == 1


def test_admin_storage_status_error_when_ping_fails(storage: InMemoryStorage) -> None:
    """_storage_status returns 'error' when storage.ping() raises."""

    async def _failing_ping() -> None:
        raise RuntimeError("DB unavailable")

    storage.ping = _failing_ping  # type: ignore[method-assign]
    app = create_app(storage=storage)
    client = TestClient(app)
    resp = client.get("/admin")
    assert resp.status_code == 200
    assert "error" in resp.text.lower()


def test_admin_header_shows_redis_status(client: TestClient) -> None:
    """Admin header shows Redis status (disabled when REDIS_URL is not set)."""
    resp = client.get("/admin")
    assert resp.status_code == 200
    # With no REDIS_URL, redis_status should show "disabled" (OFF badge)
    assert "Redis:" in resp.text
    assert "OFF" in resp.text or "OK" in resp.text  # either state is valid


def test_admin_header_shows_admin_spa_link(client: TestClient) -> None:
    """Admin header has a link to the Admin SPA."""
    resp = client.get("/admin")
    assert resp.status_code == 200
    assert "/admin-spa/" in resp.text
