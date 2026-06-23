"""JWT auth flow test for tenant-identity-service."""
from __future__ import annotations

import pytest
from starlette.testclient import TestClient

from tenant_identity_app.main import app


@pytest.fixture(scope="module")
def client() -> TestClient:
    return TestClient(app)


def test_login_success(client: TestClient) -> None:
    res = client.post(
        "/auth/token",
        data={"username": "admin@synapse.local", "password": "admin1234"},
    )
    assert res.status_code == 200
    body = res.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"


def test_login_wrong_password(client: TestClient) -> None:
    res = client.post(
        "/auth/token",
        data={"username": "admin@synapse.local", "password": "wrong"},
    )
    assert res.status_code == 401


def test_login_unknown_user(client: TestClient) -> None:
    res = client.post(
        "/auth/token",
        data={"username": "nobody@example.com", "password": "x"},
    )
    assert res.status_code == 401


def test_get_me_with_valid_token(client: TestClient) -> None:
    login_res = client.post(
        "/auth/token",
        data={"username": "admin@synapse.local", "password": "admin1234"},
    )
    token = login_res.json()["access_token"]
    me_res = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    data = me_res.json()
    assert data["username"] == "admin@synapse.local"
    assert data["role"] == "admin"


def test_get_me_with_invalid_token(client: TestClient) -> None:
    res = client.get("/auth/me", headers={"Authorization": "Bearer invalid.token.here"})
    assert res.status_code == 401
