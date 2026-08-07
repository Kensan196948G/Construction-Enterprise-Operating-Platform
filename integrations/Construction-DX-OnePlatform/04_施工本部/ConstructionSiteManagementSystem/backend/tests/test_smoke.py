"""エンドポイント存在 / 認証スモークテスト."""
from __future__ import annotations

from fastapi.testclient import TestClient


def test_health(client: TestClient) -> None:
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_projects_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/projects")
    assert r.status_code == 401


def test_daily_reports_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/daily-reports")
    assert r.status_code == 401


def test_sync_status_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/sync/status")
    assert r.status_code == 401


def test_photos_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/photos")
    assert r.status_code == 401


def test_attendance_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/attendance")
    assert r.status_code == 401


def test_equipment_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/equipment")
    assert r.status_code == 401


def test_blackboards_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/electronic-boards")
    assert r.status_code == 401
