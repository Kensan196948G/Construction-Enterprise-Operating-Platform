"""エンドポイント存在 / 認証スモークテスト."""

from __future__ import annotations

from fastapi.testclient import TestClient


def test_health(client: TestClient) -> None:
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_dashboard_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/dashboard/summary")
    assert r.status_code == 401


def test_kpi_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/kpi")
    assert r.status_code == 401


def test_forecasts_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/forecasts")
    assert r.status_code == 401


def test_alerts_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/alerts")
    assert r.status_code == 401


def test_bcp_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/bcp/status")
    assert r.status_code == 401


def test_esg_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/esg/metrics")
    assert r.status_code == 401


def test_reports_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/reports")
    assert r.status_code == 401
