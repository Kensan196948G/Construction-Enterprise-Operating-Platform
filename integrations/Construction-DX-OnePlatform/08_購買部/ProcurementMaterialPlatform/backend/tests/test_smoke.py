"""エンドポイント存在 / 認証スモークテスト."""
from __future__ import annotations

from fastapi.testclient import TestClient


def test_health(client: TestClient) -> None:
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"
    assert r.json()["service"] == "cdx-proc-api"


def test_suppliers_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/suppliers")
    assert r.status_code == 401


def test_requests_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/requests")
    assert r.status_code == 401


def test_orders_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/orders")
    assert r.status_code == 401


def test_inventory_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/inventory")
    assert r.status_code == 401


def test_inventory_alerts_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/inventory/alerts")
    assert r.status_code == 401


def test_deliveries_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/deliveries")
    assert r.status_code == 401


def test_dashboard_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/dashboard/summary")
    assert r.status_code == 401
