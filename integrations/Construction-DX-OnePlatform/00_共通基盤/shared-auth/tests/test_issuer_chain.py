"""IssuerChain — Codex L3 (HENNGE SSO) 対応の単体テスト."""
from __future__ import annotations

import pytest
from cdx_auth.config import AuthSettings
from cdx_auth.issuer_chain import IssuerChain
from cdx_auth.jwks import AuthInfraError


@pytest.fixture(autouse=True)
def _env(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("ENTRA_TENANT_ID", "tenant-aaa")
    monkeypatch.setenv("ENTRA_CLIENT_ID", "client-aaa")
    monkeypatch.setenv("ENTRA_CLIENT_SECRET", "x")
    monkeypatch.setenv("JWT_AUDIENCE", "cdx-prod")
    yield
    for k in (
        "HENNGE_ISSUER",
        "HENNGE_JWKS_URI",
        "HENNGE_AUDIENCE",
        "HENNGE_CLIENT_ID",
        "HENNGE_CLIENT_SECRET",
    ):
        monkeypatch.delenv(k, raising=False)


def test_entra_only_chain_has_one_issuer():
    settings = AuthSettings()  # type: ignore[call-arg]
    chain = IssuerChain(settings)
    assert chain.is_trusted(settings.entra_issuer)
    assert not chain.is_trusted("https://login.microsoftonline.com/other/v2.0")


def test_hennge_added_when_all_three_envs_set(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("HENNGE_ISSUER", "https://example.hennge.com")
    monkeypatch.setenv("HENNGE_JWKS_URI", "https://example.hennge.com/.well-known/jwks.json")
    monkeypatch.setenv("HENNGE_AUDIENCE", "cdx-hennge")
    settings = AuthSettings()  # type: ignore[call-arg]
    chain = IssuerChain(settings)
    assert chain.is_trusted("https://example.hennge.com")
    assert chain.audience_for("https://example.hennge.com") == "cdx-hennge"


def test_hennge_skipped_when_partial(monkeypatch: pytest.MonkeyPatch):
    # JWKS URI と AUDIENCE が無いので HENNGE は登録されない
    monkeypatch.setenv("HENNGE_ISSUER", "https://example.hennge.com")
    settings = AuthSettings()  # type: ignore[call-arg]
    chain = IssuerChain(settings)
    assert not chain.is_trusted("https://example.hennge.com")


def test_untrusted_issuer_cache_raises():
    settings = AuthSettings()  # type: ignore[call-arg]
    chain = IssuerChain(settings)
    with pytest.raises(AuthInfraError):
        chain.cache_for("https://attacker.example/v2.0")
