"""エンドポイント存在 / 認証スモークテスト."""
from __future__ import annotations

from fastapi.testclient import TestClient


def test_health(client: TestClient) -> None:
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"
    assert r.json()["service"] == "cdx-marine-api"


def test_vessels_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/vessels")
    assert r.status_code == 401


def test_voyages_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/voyages")
    assert r.status_code == 401


def test_positions_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/positions/1/latest")
    assert r.status_code == 401


def test_ais_requires_auth(client: TestClient) -> None:
    r = client.post("/api/v1/ais/decode", json={"sentence": "!AIVDM,1,1,,A,xxx,0*00"})
    assert r.status_code == 401


def test_weather_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/weather/forecast")
    assert r.status_code == 401


def test_fuel_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/fuel")
    assert r.status_code == 401


def test_crew_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/crew")
    assert r.status_code == 401


def test_port_calls_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/port-calls")
    assert r.status_code == 401


def test_dashboard_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/dashboard/summary")
    assert r.status_code == 401
