"""HENNGE URL バリデーション — Codex Loop #5 Medium 1 対応."""
from __future__ import annotations

import pytest
from cdx_auth.config import AuthSettings


@pytest.fixture(autouse=True)
def _base(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("ENTRA_TENANT_ID", "tenant-aaa")
    monkeypatch.setenv("ENTRA_CLIENT_ID", "client-aaa")
    monkeypatch.setenv("ENTRA_CLIENT_SECRET", "x")
    monkeypatch.setenv("JWT_AUDIENCE", "cdx-prod")


def test_https_issuer_accepted(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("HENNGE_ISSUER", "https://example.hennge.com")
    monkeypatch.setenv("HENNGE_JWKS_URI", "https://example.hennge.com/.well-known/jwks.json")
    monkeypatch.setenv("HENNGE_AUDIENCE", "cdx-hennge")
    s = AuthSettings()  # type: ignore[call-arg]
    assert s.hennge_enabled() is True


def test_http_issuer_rejected(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("HENNGE_ISSUER", "http://example.hennge.com")
    monkeypatch.setenv("HENNGE_JWKS_URI", "https://example.hennge.com/.well-known/jwks.json")
    monkeypatch.setenv("HENNGE_AUDIENCE", "cdx-hennge")
    with pytest.raises(Exception):  # ValidationError 経路
        AuthSettings()  # type: ignore[call-arg]


def test_control_char_in_url_rejected(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("HENNGE_ISSUER", "https://example.hennge.com\nattacker")
    monkeypatch.setenv("HENNGE_JWKS_URI", "https://example.hennge.com/.well-known/jwks.json")
    monkeypatch.setenv("HENNGE_AUDIENCE", "cdx-hennge")
    with pytest.raises(Exception):
        AuthSettings()  # type: ignore[call-arg]


def test_jwks_uri_must_be_under_issuer_host(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("HENNGE_ISSUER", "https://legit.hennge.com")
    monkeypatch.setenv("HENNGE_JWKS_URI", "https://attacker.example/.well-known/jwks.json")
    monkeypatch.setenv("HENNGE_AUDIENCE", "cdx-hennge")
    s = AuthSettings()  # type: ignore[call-arg]
    assert s.hennge_enabled() is False  # ホスト不整合で無効化


def test_jwks_uri_subdomain_accepted(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("HENNGE_ISSUER", "https://hennge.com")
    monkeypatch.setenv("HENNGE_JWKS_URI", "https://idp.hennge.com/.well-known/jwks.json")
    monkeypatch.setenv("HENNGE_AUDIENCE", "cdx-hennge")
    s = AuthSettings()  # type: ignore[call-arg]
    assert s.hennge_enabled() is True
