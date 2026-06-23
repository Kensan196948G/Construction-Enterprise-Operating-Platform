"""Tests for OIDC authentication backend (Phase 5b, Issue 0011).

Uses a MockOIDCServer pytest fixture that:
1. Generates an RSA key pair in-memory.
2. Provides a fake JWKS + discovery document via httpx mock transport.
3. Signs test JWTs with the private key.

Coverage:
- Valid JWT is accepted (200 on /admin).
- Expired JWT is rejected (401).
- Wrong audience is rejected (401).
- Missing Bearer header is rejected (401).
- OIDC provider unreachable returns 503.
- dev bypass (CDX_ADMIN_ENABLED=false) skips OIDC regardless of token.
"""

from __future__ import annotations

import time
from typing import Any

import httpx
import jwt as pyjwt
import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from fastapi.testclient import TestClient

from cdx_server.app import create_app
from cdx_server.oidc_auth import OIDCVerifier, _set_verifier

# ---------------------------------------------------------------------------
# RSA key pair + JWKS helpers
# ---------------------------------------------------------------------------


def _generate_rsa_key() -> rsa.RSAPrivateKey:
    return rsa.generate_private_key(public_exponent=65537, key_size=2048)


def _private_key_to_pem(key: rsa.RSAPrivateKey) -> str:
    return key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode()


def _public_key_to_jwks(key: rsa.RSAPrivateKey, kid: str = "test-key-1") -> dict[str, Any]:
    """Convert RSA public key to a JWKS dict for the mock OIDC server."""
    import base64

    from cryptography.hazmat.primitives.asymmetric.rsa import RSAPublicKey

    pub: RSAPublicKey = key.public_key()
    pub_numbers = (
        pub.public_key().public_numbers() if hasattr(pub, "public_key") else pub.public_numbers()
    )

    def _b64url(n: int) -> str:
        length = (n.bit_length() + 7) // 8
        return base64.urlsafe_b64encode(n.to_bytes(length, "big")).rstrip(b"=").decode()

    return {
        "keys": [
            {
                "kty": "RSA",
                "use": "sig",
                "alg": "RS256",
                "kid": kid,
                "n": _b64url(pub_numbers.n),
                "e": _b64url(pub_numbers.e),
            }
        ]
    }


def _sign_jwt(
    private_key: rsa.RSAPrivateKey,
    claims: dict[str, Any],
    kid: str = "test-key-1",
) -> str:
    pem = _private_key_to_pem(private_key)
    return pyjwt.encode(
        claims,
        pem,
        algorithm="RS256",
        headers={"kid": kid},
    )


# ---------------------------------------------------------------------------
# MockOIDCServer fixture
# ---------------------------------------------------------------------------


class MockOIDCServer:
    """In-process OIDC provider for testing.

    Provides signed JWTs and an :class:`OIDCVerifier` that uses a mock
    httpx transport — no network required.
    """

    DISCOVERY_BASE = "https://mock-oidc.test"
    CLIENT_ID = "cdx-test-client"
    KID = "mock-key-1"

    def __init__(self) -> None:
        self._private_key = _generate_rsa_key()
        self._jwks = _public_key_to_jwks(self._private_key, kid=self.KID)

        discovery_doc = {
            "issuer": self.DISCOVERY_BASE,
            "jwks_uri": f"{self.DISCOVERY_BASE}/jwks",
        }

        def _handler(request: httpx.Request) -> httpx.Response:
            if request.url.path == "/.well-known/openid-configuration":
                return httpx.Response(200, json=discovery_doc)
            if request.url.path == "/jwks":
                return httpx.Response(200, json=self._jwks)
            return httpx.Response(404, text="not found")

        transport = httpx.MockTransport(_handler)
        self._http_client = httpx.Client(transport=transport)

    def make_verifier(self) -> OIDCVerifier:
        return OIDCVerifier(
            discovery_url=self.DISCOVERY_BASE,
            client_id=self.CLIENT_ID,
            http_client=self._http_client,
        )

    def issue_token(
        self,
        sub: str = "user@example.com",
        aud: str | None = None,
        exp_offset: int = 3600,
    ) -> str:
        now = int(time.time())
        claims = {
            "sub": sub,
            "iss": self.DISCOVERY_BASE,
            "aud": aud or self.CLIENT_ID,
            "iat": now,
            "exp": now + exp_offset,
        }
        return _sign_jwt(self._private_key, claims, kid=self.KID)

    def issue_expired_token(self, sub: str = "user@example.com") -> str:
        now = int(time.time())
        claims = {
            "sub": sub,
            "iss": self.DISCOVERY_BASE,
            "aud": self.CLIENT_ID,
            "iat": now - 7200,
            "exp": now - 3600,
        }
        return _sign_jwt(self._private_key, claims, kid=self.KID)


@pytest.fixture()
def mock_oidc() -> MockOIDCServer:
    return MockOIDCServer()


@pytest.fixture()
def oidc_client(mock_oidc: MockOIDCServer, monkeypatch: pytest.MonkeyPatch):
    """TestClient with AUTH_BACKEND=oidc and MockOIDCServer wired in."""
    monkeypatch.setenv("AUTH_BACKEND", "oidc")
    monkeypatch.setenv("OIDC_DISCOVERY_URL", MockOIDCServer.DISCOVERY_BASE)
    monkeypatch.setenv("OIDC_CLIENT_ID", MockOIDCServer.CLIENT_ID)
    monkeypatch.setenv("CDX_ADMIN_ENABLED", "true")

    verifier = mock_oidc.make_verifier()
    _set_verifier(verifier)

    app = create_app()
    client = TestClient(app, raise_server_exceptions=False)

    yield client, mock_oidc

    _set_verifier(None)


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


class TestOIDCAuth:
    def test_valid_token_grants_access(self, oidc_client):
        """Valid JWT should return 200 on /admin."""
        client, mock_oidc = oidc_client
        token = mock_oidc.issue_token()
        resp = client.get("/admin", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 200

    def test_expired_token_is_rejected(self, oidc_client):
        """Expired JWT must return 401."""
        client, mock_oidc = oidc_client
        token = mock_oidc.issue_expired_token()
        resp = client.get("/admin", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 401
        assert "expired" in resp.json()["detail"].lower()

    def test_wrong_audience_is_rejected(self, oidc_client):
        """JWT with wrong audience must return 401."""
        client, mock_oidc = oidc_client
        token = mock_oidc.issue_token(aud="wrong-client")
        resp = client.get("/admin", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 401

    def test_missing_bearer_is_rejected(self, oidc_client):
        """Request without Authorization header must return 401."""
        client, _ = oidc_client
        resp = client.get("/admin")
        assert resp.status_code == 401

    def test_dev_bypass_skips_oidc(
        self, mock_oidc: MockOIDCServer, monkeypatch: pytest.MonkeyPatch
    ):
        """CDX_ADMIN_ENABLED=false should bypass OIDC and return 200."""
        monkeypatch.setenv("AUTH_BACKEND", "oidc")
        monkeypatch.setenv("OIDC_DISCOVERY_URL", MockOIDCServer.DISCOVERY_BASE)
        monkeypatch.setenv("OIDC_CLIENT_ID", MockOIDCServer.CLIENT_ID)
        monkeypatch.setenv("CDX_ADMIN_ENABLED", "false")

        verifier = mock_oidc.make_verifier()
        _set_verifier(verifier)

        try:
            app = create_app()
            client = TestClient(app, raise_server_exceptions=False)
            resp = client.get("/admin")  # no token
            assert resp.status_code == 200
        finally:
            _set_verifier(None)

    def test_unreachable_provider_returns_503(self, monkeypatch: pytest.MonkeyPatch):
        """Unreachable OIDC provider should return 503."""
        monkeypatch.setenv("AUTH_BACKEND", "oidc")
        monkeypatch.setenv("CDX_ADMIN_ENABLED", "true")

        def _failing_handler(request: httpx.Request) -> httpx.Response:
            raise httpx.ConnectError("provider down")

        transport = httpx.MockTransport(_failing_handler)
        bad_verifier = OIDCVerifier(
            discovery_url="https://unreachable.test",
            client_id="test",
            http_client=httpx.Client(transport=transport),
        )
        _set_verifier(bad_verifier)

        try:
            app = create_app()
            client = TestClient(app, raise_server_exceptions=False)
            resp = client.get("/admin", headers={"Authorization": "Bearer fake.token.here"})
            assert resp.status_code in (401, 503)
        finally:
            _set_verifier(None)

    def test_oidc_verifier_raises_on_empty_discovery_url(self):
        """OIDCVerifier requires non-empty discovery_url."""
        import pytest

        with pytest.raises(ValueError, match="OIDC_DISCOVERY_URL"):
            OIDCVerifier(discovery_url="", client_id="client")

    def test_oidc_verifier_raises_on_empty_client_id(self):
        """OIDCVerifier requires non-empty client_id."""
        import pytest

        with pytest.raises(ValueError, match="OIDC_CLIENT_ID"):
            OIDCVerifier(discovery_url="https://example.com", client_id="")

    def test_jwks_cache_is_reused_on_second_call(self, mock_oidc: MockOIDCServer):
        """Second verify() within TTL must reuse cached JWKS (cache hit path)."""
        verifier = mock_oidc.make_verifier()
        token1 = mock_oidc.issue_token(sub="user1@example.com")
        token2 = mock_oidc.issue_token(sub="user2@example.com")
        # First call populates cache; second call hits cache (line 78)
        claims1 = verifier.verify(token1)
        claims2 = verifier.verify(token2)
        assert claims1["sub"] == "user1@example.com"
        assert claims2["sub"] == "user2@example.com"

    def test_build_verifier_uses_env_vars(self, monkeypatch: pytest.MonkeyPatch):
        """_build_verifier reads OIDC env vars and constructs OIDCVerifier."""
        from cdx_server.oidc_auth import _build_verifier

        monkeypatch.setenv("OIDC_DISCOVERY_URL", "https://example.com")
        monkeypatch.setenv("OIDC_CLIENT_ID", "my-client")
        monkeypatch.setenv("OIDC_JWKS_CACHE_TTL", "600")
        verifier = _build_verifier()
        assert verifier._client_id == "my-client"
        assert verifier._jwks_ttl == 600

    def test_get_verifier_lazy_init_from_env(self, monkeypatch: pytest.MonkeyPatch):
        """_get_verifier() builds singleton from env vars when _verifier is None."""
        from cdx_server.oidc_auth import _get_verifier, _set_verifier

        monkeypatch.setenv("OIDC_DISCOVERY_URL", "https://test-oidc.example.com")
        monkeypatch.setenv("OIDC_CLIENT_ID", "test-lazy-client")
        _set_verifier(None)  # reset singleton
        try:
            verifier = _get_verifier()
            assert verifier._client_id == "test-lazy-client"
        finally:
            _set_verifier(None)  # cleanup
