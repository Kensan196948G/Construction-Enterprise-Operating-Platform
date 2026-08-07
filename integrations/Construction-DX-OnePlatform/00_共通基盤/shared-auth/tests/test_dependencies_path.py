"""依存性レベル単体テスト — Codex Loop #5 Medium 指摘 (実検証経路テスト不足) への対応.

HENNGE トークンは HENNGE audience で通る / Entra audience では落ちる /
未登録 issuer は JWKS 取得前に拒否される — を直接検証する。
"""
from __future__ import annotations

from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException


@pytest.fixture(autouse=True)
def _env(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("ENTRA_TENANT_ID", "tenant-aaa")
    monkeypatch.setenv("ENTRA_CLIENT_ID", "client-aaa")
    monkeypatch.setenv("ENTRA_CLIENT_SECRET", "x")
    monkeypatch.setenv("JWT_AUDIENCE", "cdx-prod")
    monkeypatch.setenv("HENNGE_ISSUER", "https://example.hennge.com")
    monkeypatch.setenv("HENNGE_JWKS_URI", "https://example.hennge.com/.well-known/jwks.json")
    monkeypatch.setenv("HENNGE_AUDIENCE", "cdx-hennge")
    yield


def _build_token(payload: dict, kid: str = "test-kid", alg: str = "RS256") -> str:
    """JWT 風文字列を組み立てる (署名は固定文字、検証は patch でバイパス)."""
    import base64
    import json

    def b64(d: dict | bytes) -> str:
        raw = d if isinstance(d, bytes) else json.dumps(d).encode()
        return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()

    return f"{b64({'alg': alg, 'kid': kid, 'typ': 'JWT'})}.{b64(payload)}.{b64(b'sig')}"


@pytest.mark.asyncio
async def test_untrusted_issuer_rejected_before_jwks_fetch():
    """未登録 issuer は JWKS 取得を試みずに 401."""
    import importlib

    import cdx_auth.dependencies as dep

    importlib.reload(dep)
    token = _build_token(
        {"iss": "https://attacker.example/v2.0", "sub": "u", "tid": "tenant-aaa"}
    )
    with patch.object(dep._issuer_chain, "get_key", AsyncMock()) as get_key_mock:
        with pytest.raises(HTTPException) as exc:
            await dep._verify_bearer(token)
    assert exc.value.status_code == 401
    get_key_mock.assert_not_awaited()


@pytest.mark.asyncio
async def test_hennge_token_uses_hennge_audience():
    """HENNGE トークンは HENNGE audience でデコード経路に入る."""
    import importlib

    import cdx_auth.dependencies as dep

    importlib.reload(dep)
    token = _build_token({"iss": "https://example.hennge.com"})
    captured: dict = {}

    def fake_decode(_t, _k, **kwargs):
        captured.update(kwargs)
        return {
            "iss": "https://example.hennge.com",
            "sub": "user-hennge",
            "tid": "tenant-aaa",
            "iat": 1,
            "exp": 9999999999,
        }

    with patch.object(
        dep._issuer_chain, "get_key", AsyncMock(return_value={"kid": "test-kid"})
    ), patch("cdx_auth.dependencies.jwt.decode", side_effect=fake_decode):
        user = await dep._verify_bearer(token)

    assert captured["audience"] == "cdx-hennge"
    assert captured["issuer"] == "https://example.hennge.com"
    assert user.sub == "user-hennge"


@pytest.mark.asyncio
async def test_entra_token_uses_entra_audience():
    """Entra トークンは Entra audience でデコード経路に入る."""
    import importlib

    import cdx_auth.dependencies as dep

    importlib.reload(dep)
    entra_iss = "https://login.microsoftonline.com/tenant-aaa/v2.0"
    token = _build_token({"iss": entra_iss})
    captured: dict = {}

    def fake_decode(_t, _k, **kwargs):
        captured.update(kwargs)
        return {
            "iss": entra_iss,
            "sub": "user-entra",
            "tid": "tenant-aaa",
            "iat": 1,
            "exp": 9999999999,
        }

    with patch.object(
        dep._issuer_chain, "get_key", AsyncMock(return_value={"kid": "test-kid"})
    ), patch("cdx_auth.dependencies.jwt.decode", side_effect=fake_decode):
        user = await dep._verify_bearer(token)

    assert captured["audience"] == "cdx-prod"
    assert captured["issuer"] == entra_iss
    assert user.sub == "user-entra"


@pytest.mark.asyncio
async def test_entra_token_rejected_with_wrong_tid():
    """Entra issuer であっても tid が一致しなければ 401."""
    import importlib

    import cdx_auth.dependencies as dep

    importlib.reload(dep)
    entra_iss = "https://login.microsoftonline.com/tenant-aaa/v2.0"
    token = _build_token({"iss": entra_iss})

    with patch.object(
        dep._issuer_chain, "get_key", AsyncMock(return_value={"kid": "test-kid"})
    ), patch(
        "cdx_auth.dependencies.jwt.decode",
        return_value={
            "iss": entra_iss,
            "sub": "user-entra",
            "tid": "tenant-INTRUDER",
            "iat": 1,
            "exp": 9999999999,
        },
    ), pytest.raises(HTTPException) as exc:
        await dep._verify_bearer(token)
    assert exc.value.status_code == 401
