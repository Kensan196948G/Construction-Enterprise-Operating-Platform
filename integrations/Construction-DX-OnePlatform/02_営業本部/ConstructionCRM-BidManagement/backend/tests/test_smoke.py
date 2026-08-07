"""エンドポイント存在 / 認証スモークテスト."""

from __future__ import annotations

from fastapi.testclient import TestClient


def test_health(client: TestClient) -> None:
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_clients_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/clients")
    assert r.status_code == 401


def test_opportunities_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/opportunities")
    assert r.status_code == 401


def test_bids_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/bids")
    assert r.status_code == 401


def test_quotations_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/quotations")
    assert r.status_code == 401


def test_contracts_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/contracts")
    assert r.status_code == 401


def test_activities_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/activities")
    assert r.status_code == 401


def test_dashboard_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/dashboard/summary")
    assert r.status_code == 401


def test_forecast_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/opportunities/forecast/summary")
    assert r.status_code == 401


def test_bid_stats_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/bids/stats/summary")
    assert r.status_code == 401


def test_bid_analytics_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/bids/analytics")
    assert r.status_code == 401


def test_quotation_pdf_stream_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/quotations/1/pdf")
    assert r.status_code == 401


def test_opportunity_summarize_requires_auth(client: TestClient) -> None:
    r = client.post("/api/v1/opportunities/1/summarize")
    assert r.status_code == 401
