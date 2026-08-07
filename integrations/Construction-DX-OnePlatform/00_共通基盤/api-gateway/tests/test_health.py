"""ヘルスチェックエンドポイントのテスト."""
from __future__ import annotations

from cdx_gateway.main import create_app
from fastapi.testclient import TestClient


def test_health_liveness_returns_200() -> None:
    app = create_app()
    with TestClient(app) as client:
        resp = client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "success"
    assert body["data"]["alive"] is True


def test_root_returns_service_info() -> None:
    app = create_app()
    with TestClient(app) as client:
        resp = client.get("/")
    assert resp.status_code == 200
    assert resp.json()["service"] == "cdx-api-gateway"


def test_metrics_returns_prometheus_format() -> None:
    app = create_app()
    with TestClient(app) as client:
        resp = client.get("/metrics")
    assert resp.status_code == 200
    assert "text/plain" in resp.headers["content-type"]


def test_ready_returns_response(monkeypatch) -> None:  # type: ignore[no-untyped-def]
    """依存先が無い環境では 503 になることを許容して構造のみ確認."""
    app = create_app()
    with TestClient(app) as client:
        resp = client.get("/ready")
    assert resp.status_code in (200, 503)
    body = resp.json()
    assert "status" in body
