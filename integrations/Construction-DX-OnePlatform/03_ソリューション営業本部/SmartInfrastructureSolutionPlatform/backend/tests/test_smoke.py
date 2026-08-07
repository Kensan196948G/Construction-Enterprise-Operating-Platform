"""エンドポイント存在 / 認証スモークテスト."""

from __future__ import annotations

from fastapi.testclient import TestClient


def test_health(client: TestClient) -> None:
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_catalog_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/catalog")
    assert r.status_code == 401


def test_proposals_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/proposals")
    assert r.status_code == 401


def test_feasibility_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/feasibility")
    assert r.status_code == 401


def test_assets_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/assets")
    assert r.status_code == 401


def test_partners_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/partners")
    assert r.status_code == 401


def test_cases_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/cases")
    assert r.status_code == 401


def test_dashboard_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/dashboard/summary")
    assert r.status_code == 401


def test_pfi_evaluate_requires_auth(client: TestClient) -> None:
    r = client.post(
        "/api/v1/pfi/evaluate",
        json={
            "initial_investment": 100,
            "annual_cashflows": [50, 60],
            "discount_rate": 0.05,
        },
    )
    assert r.status_code == 401
