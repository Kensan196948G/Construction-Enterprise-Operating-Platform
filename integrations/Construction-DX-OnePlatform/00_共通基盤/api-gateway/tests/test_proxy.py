"""リバースプロキシのテスト (httpx.MockTransport 使用)."""
from __future__ import annotations

import httpx
import pytest
from cdx_gateway.main import create_app
from fastapi.testclient import TestClient


def _mock_transport_factory(captured: dict) -> httpx.MockTransport:
    def handler(request: httpx.Request) -> httpx.Response:
        captured["url"] = str(request.url)
        captured["method"] = request.method
        captured["headers"] = dict(request.headers)
        captured["content"] = request.content
        return httpx.Response(
            200,
            json={"status": "success", "data": {"echo": "ok", "path": request.url.path}},
            headers={"X-Backend": "mock"},
        )

    return httpx.MockTransport(handler)


@pytest.fixture()
def client_with_mock():  # type: ignore[no-untyped-def]
    app = create_app()
    captured: dict = {}
    transport = _mock_transport_factory(captured)

    with TestClient(app) as client:
        # lifespan 起動後に http_client を差し替え
        app.state.http_client = httpx.AsyncClient(transport=transport)
        yield client, captured


def test_proxy_construction_forwards_path_and_headers(client_with_mock) -> None:  # type: ignore[no-untyped-def]
    client, captured = client_with_mock
    resp = client.get(
        "/api/v1/construction/sites/123",
        headers={"X-Request-ID": "test-req-001", "Authorization": "Bearer dummy"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["data"]["echo"] == "ok"
    # 後段に転送されたヘッダー
    assert captured["headers"]["x-request-id"] == "test-req-001"
    assert captured["headers"]["x-department"] == "construction"
    # SITE_API_URL の path 部に sites/123 が含まれる
    assert "/sites/123" in captured["url"]
    # ゲートウェイ側で X-Request-ID が応答に付与
    assert resp.headers.get("X-Request-ID") == "test-req-001"


def test_proxy_safety_post_forwards_body(client_with_mock) -> None:  # type: ignore[no-untyped-def]
    client, captured = client_with_mock
    payload = {"incident": "near miss", "severity": 1}
    resp = client.post("/api/v1/safety/incidents", json=payload)
    assert resp.status_code == 200
    assert captured["method"] == "POST"
    assert b"near miss" in captured["content"]
    assert captured["headers"]["x-department"] == "safety"


def test_proxy_unknown_department_returns_404(client_with_mock) -> None:  # type: ignore[no-untyped-def]
    client, _ = client_with_mock
    resp = client.get("/api/v1/unknown/anything")
    # ルートが存在しないので 404
    assert resp.status_code == 404
    body = resp.json()
    assert body["status"] == "error"


def test_proxy_query_string_is_forwarded(client_with_mock) -> None:  # type: ignore[no-untyped-def]
    client, captured = client_with_mock
    resp = client.get("/api/v1/itsm/tickets?status=open&limit=10")
    assert resp.status_code == 200
    assert "status=open" in captured["url"]
    assert "limit=10" in captured["url"]


def test_proxy_upstream_timeout_returns_504() -> None:
    """タイムアウト時に 504 + 共通エラーフォーマットを返す."""
    app = create_app()

    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.TimeoutException("simulated timeout", request=request)

    with TestClient(app) as client:
        app.state.http_client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
        resp = client.get("/api/v1/procurement/orders")
    assert resp.status_code == 504
    body = resp.json()
    assert body["status"] == "error"
    assert body["error"]["code"] == "UPSTREAM_TIMEOUT"


def test_proxy_upstream_unreachable_returns_502() -> None:
    """到達不可時に 502 を返す."""
    app = create_app()

    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.ConnectError("connection refused", request=request)

    with TestClient(app) as client:
        app.state.http_client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
        resp = client.get("/api/v1/sales/leads")
    assert resp.status_code == 502
    body = resp.json()
    assert body["error"]["code"] == "UPSTREAM_UNREACHABLE"
