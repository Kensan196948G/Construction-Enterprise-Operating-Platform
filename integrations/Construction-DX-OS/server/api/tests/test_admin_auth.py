"""Tests for /admin HTTP Basic Auth gate (Phase 4a — Issue 0010)."""

from __future__ import annotations

import base64

import pytest
from fastapi.testclient import TestClient

from cdx_server.app import create_app
from cdx_server.storage import InMemoryStorage


def _basic_header(password: str, username: str = "admin") -> dict[str, str]:
    token = base64.b64encode(f"{username}:{password}".encode()).decode()
    return {"Authorization": f"Basic {token}"}


@pytest.fixture()
def storage() -> InMemoryStorage:
    s = InMemoryStorage()
    s.reset()
    return s


@pytest.fixture()
def client(storage: InMemoryStorage) -> TestClient:
    return TestClient(create_app(storage=storage))


# ---- dev mode (no CDX_ADMIN_TOKEN set) ----------------------------------------


def test_admin_open_in_dev_mode(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    """When CDX_ADMIN_TOKEN is unset, /admin is accessible without credentials."""
    monkeypatch.delenv("CDX_ADMIN_TOKEN", raising=False)
    resp = client.get("/admin")
    assert resp.status_code == 200


def test_admin_open_when_disabled(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    """CDX_ADMIN_ENABLED=false bypasses auth even if token is set."""
    monkeypatch.setenv("CDX_ADMIN_TOKEN", "supersecret")
    monkeypatch.setenv("CDX_ADMIN_ENABLED", "false")
    resp = client.get("/admin")
    assert resp.status_code == 200


# ---- auth enforced (CDX_ADMIN_TOKEN set) --------------------------------------


def test_admin_requires_auth_when_token_set(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """Unauthenticated request returns 401 when CDX_ADMIN_TOKEN is set."""
    monkeypatch.setenv("CDX_ADMIN_TOKEN", "supersecret")
    monkeypatch.setenv("CDX_ADMIN_ENABLED", "true")
    resp = client.get("/admin", headers={})
    assert resp.status_code == 401
    assert "WWW-Authenticate" in resp.headers
    assert "Basic" in resp.headers["WWW-Authenticate"]


def test_admin_wrong_password_returns_401(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("CDX_ADMIN_TOKEN", "supersecret")
    monkeypatch.setenv("CDX_ADMIN_ENABLED", "true")
    resp = client.get("/admin", headers=_basic_header("wrongpassword"))
    assert resp.status_code == 401


def test_admin_correct_password_returns_200(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("CDX_ADMIN_TOKEN", "supersecret")
    monkeypatch.setenv("CDX_ADMIN_ENABLED", "true")
    resp = client.get("/admin", headers=_basic_header("supersecret"))
    assert resp.status_code == 200
    assert "text/html" in resp.headers["content-type"]


@pytest.mark.asyncio
async def test_admin_device_detail_requires_auth(
    client: TestClient, monkeypatch: pytest.MonkeyPatch, storage: InMemoryStorage
) -> None:
    """Auth gate applies to /admin/devices/{id} too."""
    monkeypatch.setenv("CDX_ADMIN_TOKEN", "supersecret")
    monkeypatch.setenv("CDX_ADMIN_ENABLED", "true")
    await storage.register_device(
        device_id="dev-001", profile="standard", hostname="h", shared_secret="s"
    )
    resp = client.get("/admin/devices/dev-001")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_admin_device_detail_correct_password(
    client: TestClient, monkeypatch: pytest.MonkeyPatch, storage: InMemoryStorage
) -> None:
    monkeypatch.setenv("CDX_ADMIN_TOKEN", "supersecret")
    monkeypatch.setenv("CDX_ADMIN_ENABLED", "true")
    await storage.register_device(
        device_id="dev-001", profile="standard", hostname="h", shared_secret="s"
    )
    resp = client.get("/admin/devices/dev-001", headers=_basic_header("supersecret"))
    assert resp.status_code == 200


def test_admin_any_username_accepted(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    """Username field is ignored — only password is checked."""
    monkeypatch.setenv("CDX_ADMIN_TOKEN", "supersecret")
    monkeypatch.setenv("CDX_ADMIN_ENABLED", "true")
    resp = client.get("/admin", headers=_basic_header("supersecret", username="alice"))
    assert resp.status_code == 200


def test_ldap_backend_raises_not_implemented(
    storage: InMemoryStorage, monkeypatch: pytest.MonkeyPatch
) -> None:
    """AUTH_BACKEND=ldap must raise NotImplementedError (not yet implemented)."""
    monkeypatch.setenv("AUTH_BACKEND", "ldap")
    monkeypatch.setenv("CDX_ADMIN_ENABLED", "true")
    safe_client = TestClient(create_app(storage=storage), raise_server_exceptions=False)
    resp = safe_client.get("/admin")
    assert resp.status_code == 500


def test_oidc_backend_skips_basic_auth_check(
    client: TestClient, monkeypatch: pytest.MonkeyPatch
) -> None:
    """require_admin_auth (v1) returns early when AUTH_BACKEND=oidc (OIDC handles it)."""
    monkeypatch.setenv("AUTH_BACKEND", "oidc")
    monkeypatch.setenv("CDX_ADMIN_ENABLED", "false")
    # Dev bypass ensures /admin is reachable without token
    resp = client.get("/admin")
    assert resp.status_code == 200


def test_require_admin_auth_v1_ldap_raises(monkeypatch: pytest.MonkeyPatch) -> None:
    """require_admin_auth (v1) raises NotImplementedError for LDAP backend."""
    import pytest

    from cdx_server.admin_auth import require_admin_auth

    monkeypatch.setenv("AUTH_BACKEND", "ldap")
    with pytest.raises(NotImplementedError, match="LDAP"):
        require_admin_auth(credentials=None)


def test_require_admin_auth_v1_oidc_returns(monkeypatch: pytest.MonkeyPatch) -> None:
    """require_admin_auth (v1) returns early when AUTH_BACKEND=oidc."""
    from cdx_server.admin_auth import require_admin_auth

    monkeypatch.setenv("AUTH_BACKEND", "oidc")
    result = require_admin_auth(credentials=None)
    assert result is None
