"""JWT Auth endpoint tests for tenant-identity-service (Sprint 4).

Coverage:
    - POST /auth/token: valid credentials -> JWT token
    - POST /auth/token: invalid credentials -> 401
    - POST /auth/token: missing fields -> 422
    - GET /auth/me: valid token -> user info
    - GET /auth/me: invalid token -> 401
    - GET /auth/me: missing auth header -> 401
    - Token payload contains correct fields (sub, tenant_id, role)
    - Admin user can obtain token with admin role
"""

from __future__ import annotations

from fastapi.testclient import TestClient

from tenant_identity_app.main import app

client = TestClient(app)

VALID_ADMIN = {"username": "admin@synapse.local", "password": "admin1234"}
VALID_USER = {"username": "user@tenant-alpha.com", "password": "password123"}


def _get_token(credentials: dict[str, str]) -> str:
    """Helper to POST /auth/token and return access_token string."""
    r = client.post("/auth/token", data=credentials)
    assert r.status_code == 200
    return r.json()["access_token"]


# ---------------------------------------------------------------------------
# POST /auth/token
# ---------------------------------------------------------------------------


def test_login_valid_admin_returns_bearer_token() -> None:
    """Valid admin credentials return access_token with token_type='bearer'."""
    r = client.post("/auth/token", data=VALID_ADMIN)
    assert r.status_code == 200
    body = r.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"
    assert len(body["access_token"]) > 20


def test_login_valid_user_returns_bearer_token() -> None:
    """Valid tenant user credentials return token."""
    r = client.post("/auth/token", data=VALID_USER)
    assert r.status_code == 200
    assert r.json()["token_type"] == "bearer"


def test_login_invalid_password_returns_401() -> None:
    """Wrong password returns HTTP 401."""
    r = client.post("/auth/token", data={"username": "admin@synapse.local", "password": "wrong"})
    assert r.status_code == 401
    assert "Incorrect" in r.json()["detail"]


def test_login_unknown_user_returns_401() -> None:
    """Unknown username returns HTTP 401."""
    r = client.post("/auth/token", data={"username": "nobody@example.com", "password": "pass"})
    assert r.status_code == 401


def test_login_missing_username_returns_422() -> None:
    """Missing username field returns HTTP 422."""
    r = client.post("/auth/token", data={"password": "admin1234"})
    assert r.status_code == 422


def test_login_missing_password_returns_422() -> None:
    """Missing password field returns HTTP 422."""
    r = client.post("/auth/token", data={"username": "admin@synapse.local"})
    assert r.status_code == 422


# ---------------------------------------------------------------------------
# GET /auth/me
# ---------------------------------------------------------------------------


def test_get_me_with_valid_token() -> None:
    """GET /auth/me with valid token returns TokenData."""
    token = _get_token(VALID_ADMIN)
    r = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    body = r.json()
    assert body["username"] == "admin@synapse.local"
    assert body["role"] == "admin"
    assert body["tenant_id"].startswith("ten_global_")


def test_get_me_user_has_correct_tenant() -> None:
    """Tenant user token returns tenant-scoped tenant_id."""
    token = _get_token(VALID_USER)
    r = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert r.status_code == 200
    body = r.json()
    assert body["username"] == "user@tenant-alpha.com"
    assert body["role"] == "user"
    assert body["tenant_id"].startswith("ten_tena_")


def test_get_me_with_invalid_token_returns_401() -> None:
    """Tampered or invalid token returns HTTP 401."""
    r = client.get("/auth/me", headers={"Authorization": "Bearer invalid.jwt.token"})
    assert r.status_code == 401


def test_get_me_without_auth_header_returns_401() -> None:
    """Missing Authorization header returns HTTP 401."""
    r = client.get("/auth/me")
    assert r.status_code == 401


def test_get_me_with_wrong_scheme_returns_401() -> None:
    """Basic auth scheme instead of Bearer returns HTTP 401."""
    token = _get_token(VALID_ADMIN)
    r = client.get("/auth/me", headers={"Authorization": f"Basic {token}"})
    assert r.status_code == 401
