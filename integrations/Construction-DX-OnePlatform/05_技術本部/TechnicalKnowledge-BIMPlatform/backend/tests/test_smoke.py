"""エンドポイント存在 / 認証スモークテスト."""
from __future__ import annotations

from fastapi.testclient import TestClient


def test_health(client: TestClient) -> None:
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"
    assert r.json()["service"] == "cdx-tech-api"


def test_knowledge_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/knowledge")
    assert r.status_code == 401


def test_bim_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/bim")
    assert r.status_code == 401


def test_cim_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/cim")
    assert r.status_code == 401


def test_drawings_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/drawings")
    assert r.status_code == 401


def test_specs_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/specs")
    assert r.status_code == 401


def test_inquiries_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/inquiries")
    assert r.status_code == 401


def test_dashboard_requires_auth(client: TestClient) -> None:
    r = client.get("/api/v1/dashboard/stats")
    assert r.status_code == 401


def test_openapi_includes_all_routes(client: TestClient) -> None:
    spec = client.get("/openapi.json").json()
    paths = set(spec["paths"].keys())
    assert "/api/v1/knowledge" in paths
    assert "/api/v1/bim" in paths
    assert "/api/v1/cim" in paths
    assert "/api/v1/drawings" in paths
    assert "/api/v1/specs" in paths
    assert "/api/v1/inquiries" in paths
    assert "/api/v1/dashboard/stats" in paths
