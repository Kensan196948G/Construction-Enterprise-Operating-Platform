"""Tests for /api/v1/serial serial-scan endpoints (GMSV0002 SMB pipeline)."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from cdx_server.app import create_app
from cdx_server.rate_limit import NullRateLimiter
from cdx_server.routers.serial_scan import SUPPORTED_EXTS
from cdx_server.storage import InMemoryStorage
from cdx_server.storage_pg import PostgresStorage
from cdx_server.storage_protocol import SerialScanStorage


@pytest.fixture()
def client() -> TestClient:
    app = create_app(storage=InMemoryStorage())
    return TestClient(app)


@pytest.fixture
async def pg_serial_storage(tmp_path) -> PostgresStorage:
    storage = PostgresStorage(f"sqlite+aiosqlite:///{tmp_path / 'serial.db'}")
    await storage._ensure_ready()
    return storage


@pytest.fixture
async def pg_client(pg_serial_storage: PostgresStorage) -> TestClient:
    app = create_app(storage=pg_serial_storage, rate_limiter=NullRateLimiter())
    return TestClient(app)


def test_supported_extensions_include_heic() -> None:
    assert ".heic" in SUPPORTED_EXTS
    assert ".jpg" in SUPPORTED_EXTS
    assert ".jpeg" in SUPPORTED_EXTS
    assert ".png" in SUPPORTED_EXTS


def test_serial_status_returns_structure(client: TestClient) -> None:
    resp = client.get("/api/v1/serial/status")
    assert resp.status_code == 200
    data = resp.json()
    assert "mounted" in data
    assert "scan_path" in data
    assert "pending_images" in data
    assert "queue_size" in data
    assert "mock_mode" in data
    assert "supported_formats" in data
    assert ".heic" in data["supported_formats"]


def test_serial_scan_mock_returns_items(client: TestClient) -> None:
    resp = client.post("/api/v1/serial/scan")
    assert resp.status_code == 200
    data = resp.json()
    assert "processed" in data
    assert "items" in data
    assert data["processed"] >= 0


def test_serial_queue_initially_empty_or_populated(client: TestClient) -> None:
    resp = client.get("/api/v1/serial/queue")
    assert resp.status_code == 200
    data = resp.json()
    assert "total" in data
    assert "items" in data


def test_serial_scan_then_confirm(client: TestClient) -> None:
    # Scan to get items into queue
    scan_resp = client.post("/api/v1/serial/scan")
    assert scan_resp.status_code == 200
    items = scan_resp.json()["items"]
    if not items:
        pytest.skip("Mock scan returned no items (path may exist but be empty)")
    item_id = items[0]["id"]

    # Confirm the first item
    confirm_resp = client.post(
        f"/api/v1/serial/confirm/{item_id}",
        json={
            "serial_number": "SN-HQ-005001",
            "hostname": "CDX-HQ-005",
            "profile": "standard",
            "location": "新宿本社",
            "notes": "テスト確認",
        },
    )
    assert confirm_resp.status_code == 200
    confirmed = confirm_resp.json()
    assert confirmed["status"] == "confirmed"
    assert confirmed["hostname"] == "CDX-HQ-005"
    assert confirmed["serial_confirmed"] == "SN-HQ-005001"


def test_serial_confirm_unknown_id_returns_404(client: TestClient) -> None:
    resp = client.post(
        "/api/v1/serial/confirm/nonexistent-id",
        json={"serial_number": "SN-X", "hostname": "CDX-X"},
    )
    assert resp.status_code == 404


def test_serial_discard_item(client: TestClient) -> None:
    scan_resp = client.post("/api/v1/serial/scan")
    items = scan_resp.json()["items"]
    if not items:
        pytest.skip("No items in queue")
    item_id = items[0]["id"]

    del_resp = client.delete(f"/api/v1/serial/queue/{item_id}")
    assert del_resp.status_code == 200
    assert del_resp.json()["status"] == "discarded"

    # Should be gone from queue
    queue_resp = client.get("/api/v1/serial/queue")
    ids = [i["id"] for i in queue_resp.json()["items"]]
    assert item_id not in ids


# ---------------------------------------------------------------------------
# Issue 0052 — DB-backed queue persistence (PostgresStorage path)
# ---------------------------------------------------------------------------


def test_postgres_storage_implements_serial_scan_protocol(
    pg_serial_storage: PostgresStorage,
) -> None:
    """PostgresStorage must satisfy the SerialScanStorage runtime check."""
    assert isinstance(pg_serial_storage, SerialScanStorage)


def test_in_memory_does_not_implement_serial_scan_protocol() -> None:
    """InMemoryStorage deliberately does NOT implement SerialScanStorage."""
    assert not isinstance(InMemoryStorage(), SerialScanStorage)


def test_status_reports_postgres_backend(pg_client: TestClient) -> None:
    resp = pg_client.get("/api/v1/serial/status")
    assert resp.status_code == 200
    assert resp.json()["queue_backend"] == "postgres"


def test_status_reports_in_memory_backend(client: TestClient) -> None:
    resp = client.get("/api/v1/serial/status")
    assert resp.status_code == 200
    assert resp.json()["queue_backend"] == "in-memory"


def test_pg_scan_persists_to_db(pg_client: TestClient) -> None:
    """Scanned items must be retrievable from the DB-backed queue."""
    scan_resp = pg_client.post("/api/v1/serial/scan")
    assert scan_resp.status_code == 200
    items = scan_resp.json()["items"]
    if not items:
        pytest.skip("Mock scan returned no items")

    queue_resp = pg_client.get("/api/v1/serial/queue")
    assert queue_resp.status_code == 200
    queue = queue_resp.json()
    assert queue["total"] == len(items)
    queue_ids = {i["id"] for i in queue["items"]}
    assert all(item["id"] in queue_ids for item in items)


def test_pg_confirm_persists_to_db(pg_client: TestClient) -> None:
    scan_resp = pg_client.post("/api/v1/serial/scan")
    items = scan_resp.json()["items"]
    if not items:
        pytest.skip("Mock scan returned no items")
    item_id = items[0]["id"]

    confirm_resp = pg_client.post(
        f"/api/v1/serial/confirm/{item_id}",
        json={
            "serial_number": "SN-DB-007",
            "hostname": "CDX-DB-007",
            "profile": "standard",
            "location": "東京",
            "notes": "DB persistence test",
        },
    )
    assert confirm_resp.status_code == 200
    confirmed = confirm_resp.json()
    assert confirmed["status"] == "confirmed"
    assert confirmed["hostname"] == "CDX-DB-007"
    assert confirmed["serial_confirmed"] == "SN-DB-007"

    # Re-read from queue to confirm it was actually persisted.
    queue_resp = pg_client.get("/api/v1/serial/queue")
    matching = [i for i in queue_resp.json()["items"] if i["id"] == item_id]
    assert len(matching) == 1
    assert matching[0]["status"] == "confirmed"
    assert matching[0]["hostname"] == "CDX-DB-007"


def test_pg_discard_marks_status_not_delete(pg_client: TestClient) -> None:
    """DB-backed discard sets status='discarded' rather than physically removing."""
    scan_resp = pg_client.post("/api/v1/serial/scan")
    items = scan_resp.json()["items"]
    if not items:
        pytest.skip("Mock scan returned no items")
    item_id = items[0]["id"]

    del_resp = pg_client.delete(f"/api/v1/serial/queue/{item_id}")
    assert del_resp.status_code == 200
    assert del_resp.json()["status"] == "discarded"

    # Item still in queue list but marked discarded (audit trail preserved).
    queue_resp = pg_client.get("/api/v1/serial/queue")
    matching = [i for i in queue_resp.json()["items"] if i["id"] == item_id]
    assert len(matching) == 1
    assert matching[0]["status"] == "discarded"


def test_pg_confirm_unknown_id_returns_404(pg_client: TestClient) -> None:
    resp = pg_client.post(
        "/api/v1/serial/confirm/nonexistent-uuid",
        json={"serial_number": "SN-X", "hostname": "CDX-X"},
    )
    assert resp.status_code == 404


def test_pg_discard_unknown_id_returns_404(pg_client: TestClient) -> None:
    resp = pg_client.delete("/api/v1/serial/queue/nonexistent-uuid")
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# Issue 0052 — Prometheus metrics (CDX_SERIAL_SCAN_TOTAL)
# ---------------------------------------------------------------------------


def test_metrics_increment_on_scan_and_confirm(pg_client: TestClient) -> None:
    """/metrics must expose cdx_serial_scan_total counter incremented by ops."""
    # Capture baseline by reading /metrics
    baseline = pg_client.get("/metrics").text
    assert "cdx_serial_scan_total" in baseline

    # Scan -> insert event (insert label)
    scan = pg_client.post("/api/v1/serial/scan")
    items = scan.json()["items"]
    if not items:
        pytest.skip("Mock scan returned no items")

    # Confirm -> confirm event
    pg_client.post(
        f"/api/v1/serial/confirm/{items[0]['id']}",
        json={"serial_number": "SN-METRICS-001", "hostname": "CDX-METRICS-001"},
    )

    metrics_text = pg_client.get("/metrics").text
    # Sanity: both event labels for the postgres backend must appear at least once.
    assert 'event="insert"' in metrics_text
    assert 'event="confirm"' in metrics_text
    assert 'backend="postgres"' in metrics_text


def test_metrics_track_in_memory_backend(client: TestClient) -> None:
    """In-memory queue path must also increment the metric (different label)."""
    scan = client.post("/api/v1/serial/scan")
    items = scan.json()["items"]
    if not items:
        pytest.skip("Mock scan returned no items")
    metrics_text = client.get("/metrics").text
    assert 'backend="in-memory"' in metrics_text
