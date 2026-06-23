"""API Gateway テスト"""

import pytest
from fastapi.testclient import TestClient

from src.config import get_settings
from src.main import app


@pytest.fixture
def client():
    """テストクライアント"""
    return TestClient(app)


def test_health_check(client):
    """ヘルスチェックが 200 を返す"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "api-gateway"


def test_unknown_route_returns_404(client):
    """不明なルートは 404 を返す"""
    response = client.get("/some/random/unknown/path")
    assert response.status_code == 404
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "NOT_FOUND"


def test_auth_required_without_token_returns_401(client):
    """トークンなしで認証必須エンドポイントにアクセスすると 401"""
    response = client.get("/api/v1/users")
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "AUTH_REQUIRED"


def test_auth_with_invalid_token_returns_401(client):
    """不正なトークンでアクセスすると 401"""
    response = client.get(
        "/api/v1/users",
        headers={"Authorization": "Bearer invalid.token.here"},
    )
    assert response.status_code == 401
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "INVALID_TOKEN"


def test_public_paths_no_auth_required(client):
    """公開パスは認証なしでアクセス可能"""
    response = client.get("/health")
    assert response.status_code == 200

    response = client.post("/api/v1/auth/login", json={})
    assert response.status_code != 401  # 認証で弾かれないこと


def test_rate_limiting(client):
    """レート制限を超えると 429 を返す"""
    settings = get_settings()
    original = settings.RATE_LIMIT_PER_MINUTE
    settings.RATE_LIMIT_PER_MINUTE = 2

    headers = {"X-Forwarded-For": "10.0.0.99"}

    try:
        for _ in range(2):
            response = client.get("/health", headers=headers)
            assert response.status_code == 200

        # 3回目で制限超過
        response = client.get("/health", headers=headers)
        assert response.status_code == 429
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "RATE_LIMIT_EXCEEDED"
        assert "Retry-After" in response.headers
    finally:
        settings.RATE_LIMIT_PER_MINUTE = original


def test_x_request_id_header(client):
    """X-Request-ID ヘッダーが付与される"""
    response = client.get("/health")
    assert "X-Request-ID" in response.headers
    assert response.headers["X-Request-ID"] != ""


def test_request_id_forwarded(client):
    """クライアント指定の X-Request-ID が転送される"""
    response = client.get(
        "/health",
        headers={"X-Request-ID": "test-id-12345"},
    )
    assert response.headers["X-Request-ID"] == "test-id-12345"


def test_proxy_request_with_valid_token_format(client):
    """有効なJWT形式のトークンでプロキシーリクエスト（上流未起動のため502）"""
    from jose import jwt as jose_jwt
    from src.config import get_settings

    settings = get_settings()
    token = jose_jwt.encode(
        {
            "sub": "test-user",
            "type": "user",
            "roles": [],
            "scopes": [],
            "exp": 9999999999,
        },
        settings.JWT_PUBLIC_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )

    response = client.get(
        "/api/v1/construction/test",
        headers={"Authorization": f"Bearer {token}"},
    )
    # 認証は通るが上流サービス未起動なので 502
    assert response.status_code == 502
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "BAD_GATEWAY"


def test_public_path_auth_refresh_no_token(client):
    """/api/v1/auth/refresh は公開パスのため GW 認証ミドルウェアに弾かれない"""
    response = client.post("/api/v1/auth/refresh", json={"refresh_token": "dummy"})
    # AUTH_REQUIRED は GW 自身の auth middleware が返すコード。上流の 401 は別コードなので区別する。
    data = response.json()
    assert data.get("error", {}).get("code") != "AUTH_REQUIRED"


def test_public_path_mfa_verify_no_token(client):
    """/api/v1/auth/mfa/verify は公開パスのため 401 なし"""
    response = client.post("/api/v1/auth/mfa/verify", json={"code": "123456"})
    assert response.status_code != 401


def test_post_authenticated_endpoint_without_token(client):
    """認証必須エンドポイントへの POST もトークンなしで 401"""
    response = client.post("/api/v1/construction/projects", json={"name": "テスト"})
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "AUTH_REQUIRED"


def test_delete_authenticated_endpoint_without_token(client):
    """DELETE リクエストもトークンなしで 401"""
    response = client.delete("/api/v1/documents/some-id")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "AUTH_REQUIRED"


def test_put_authenticated_endpoint_without_token(client):
    """PUT リクエストもトークンなしで 401"""
    response = client.put("/api/v1/construction/projects/some-id", json={})
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "AUTH_REQUIRED"


def _make_valid_token() -> str:
    from jose import jwt as jose_jwt
    from src.config import get_settings

    settings = get_settings()
    return jose_jwt.encode(
        {
            "sub": "u1",
            "type": "user",
            "roles": ["admin"],
            "scopes": [],
            "exp": 9999999999,
        },
        settings.JWT_PUBLIC_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def test_rate_limit_different_ips_independent(client):
    """異なる IP はそれぞれ独立したレートリミットカウンターを持つ"""
    settings = get_settings()
    original = settings.RATE_LIMIT_PER_MINUTE
    settings.RATE_LIMIT_PER_MINUTE = 1

    try:
        r1 = client.get("/health", headers={"X-Forwarded-For": "10.0.1.1"})
        assert r1.status_code == 200

        # 別 IP は影響を受けない
        r2 = client.get("/health", headers={"X-Forwarded-For": "10.0.1.2"})
        assert r2.status_code == 200

        # 最初の IP は 2 回目でブロック
        r3 = client.get("/health", headers={"X-Forwarded-For": "10.0.1.1"})
        assert r3.status_code == 429
    finally:
        settings.RATE_LIMIT_PER_MINUTE = original


def test_bearer_prefix_required(client):
    """Authorization ヘッダーに Bearer プレフィックスがないと 401"""
    token = _make_valid_token()
    response = client.get("/api/v1/users", headers={"Authorization": token})
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "AUTH_REQUIRED"


def test_valid_token_with_multiple_upstream_paths(client):
    """有効トークンで複数の異なる上流パスへのルーティングを確認（全て 502）"""
    token = _make_valid_token()
    paths = [
        "/api/v1/safety/test",      # port 8019 — not running in dev
        "/api/v1/partner/test",     # port 8018 — not running in dev
        "/api/v1/maintenance/test", # port 8009 — not running in dev
    ]
    for path in paths:
        response = client.get(path, headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 502, (
            f"{path} should be 502, got {response.status_code}"
        )
        assert response.json()["error"]["code"] == "BAD_GATEWAY"


def test_x_request_id_uniqueness(client):
    """リクエストごとに異なる X-Request-ID が生成される"""
    r1 = client.get("/health")
    r2 = client.get("/health")
    id1 = r1.headers.get("X-Request-ID", "")
    id2 = r2.headers.get("X-Request-ID", "")
    assert id1 != "" and id2 != ""
    assert id1 != id2
