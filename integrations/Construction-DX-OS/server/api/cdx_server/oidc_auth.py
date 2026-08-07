"""OIDC authentication backend for /admin (Phase 5b, Issue 0011).

Controlled by environment variables:

``AUTH_BACKEND``
    ``"basic"`` (default) — HTTP Basic Auth (existing CDX_ADMIN_TOKEN behaviour).
    ``"oidc"`` — OIDC JWT Bearer token verification.
    ``"ldap"`` — stub; raises NotImplementedError (future implementation).

``OIDC_DISCOVERY_URL``
    Base URL of the OIDC provider, e.g. ``https://login.microsoftonline.com/{tenant}/v2.0``.
    The verifier appends ``/.well-known/openid-configuration`` automatically.

``OIDC_CLIENT_ID``
    Expected ``aud`` claim in the JWT.  Required when ``AUTH_BACKEND=oidc``.

``OIDC_JWKS_CACHE_TTL``
    JWKS cache TTL in seconds (default: 3600).

Usage (dev bypass)
------------------
When ``CDX_ADMIN_ENABLED=false`` *or* ``CDX_ADMIN_TOKEN`` is unset *and*
``AUTH_BACKEND`` is unset or ``"basic"``, the admin UI is open without auth
— same behaviour as Phase 4a.

When ``AUTH_BACKEND=oidc``, the bypass only applies when
``CDX_ADMIN_ENABLED=false`` is explicitly set.
"""

from __future__ import annotations

import os
import time
from typing import Any

import httpx
import jwt as pyjwt
from fastapi import HTTPException, Request, status
from jwt import PyJWKSet
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError

AUTH_BACKEND_ENV = "AUTH_BACKEND"
OIDC_DISCOVERY_URL_ENV = "OIDC_DISCOVERY_URL"
OIDC_CLIENT_ID_ENV = "OIDC_CLIENT_ID"
OIDC_JWKS_CACHE_TTL_ENV = "OIDC_JWKS_CACHE_TTL"

_DEFAULT_JWKS_TTL = 3600


class OIDCVerifier:
    """Verifies OIDC JWT Bearer tokens against the provider's JWKS.

    Designed for testability: pass ``http_client`` to inject a mock transport.
    """

    def __init__(
        self,
        discovery_url: str,
        client_id: str,
        jwks_ttl: int = _DEFAULT_JWKS_TTL,
        http_client: httpx.Client | None = None,
    ) -> None:
        if not discovery_url:
            raise ValueError("OIDC_DISCOVERY_URL must be set when AUTH_BACKEND=oidc")
        if not client_id:
            raise ValueError("OIDC_CLIENT_ID must be set when AUTH_BACKEND=oidc")

        self._discovery_url = discovery_url.rstrip("/")
        self._client_id = client_id
        self._jwks_ttl = jwks_ttl
        self._http = http_client or httpx.Client(timeout=10.0)
        self._jwks: dict[str, Any] | None = None
        self._jwks_fetched_at: float = 0.0

    def _fetch_jwks(self) -> dict[str, Any]:
        now = time.monotonic()
        if self._jwks is not None and (now - self._jwks_fetched_at) < self._jwks_ttl:
            return self._jwks

        discovery = self._http.get(f"{self._discovery_url}/.well-known/openid-configuration")
        discovery.raise_for_status()
        jwks_uri: str = discovery.json()["jwks_uri"]

        jwks_resp = self._http.get(jwks_uri)
        jwks_resp.raise_for_status()
        self._jwks = jwks_resp.json()
        self._jwks_fetched_at = now
        return self._jwks

    def verify(self, token: str) -> dict[str, Any]:
        """Verify a JWT and return the decoded claims.

        Raises :class:`fastapi.HTTPException` (401) on any verification failure.
        """
        try:
            jwks = self._fetch_jwks()
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"OIDC provider unreachable: {exc}",
            ) from exc

        try:
            key_set = PyJWKSet.from_dict(jwks)
            header = pyjwt.get_unverified_header(token)
            kid = header.get("kid")
            signing_key = next(
                (k.key for k in key_set.keys if not kid or k.key_id == kid),
                key_set.keys[0].key if key_set.keys else None,
            )
            claims = pyjwt.decode(
                token,
                signing_key,
                algorithms=["RS256", "RS384", "RS512"],
                audience=self._client_id,
            )
        except ExpiredSignatureError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="OIDC token expired",
                headers={"WWW-Authenticate": "Bearer"},
            ) from exc
        except InvalidTokenError as exc:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"OIDC token invalid: {exc}",
                headers={"WWW-Authenticate": "Bearer"},
            ) from exc

        return claims


# Module-level singleton; replaced by tests via _set_verifier().
_verifier: OIDCVerifier | None = None


def _build_verifier() -> OIDCVerifier:
    discovery_url = os.environ.get(OIDC_DISCOVERY_URL_ENV, "")
    client_id = os.environ.get(OIDC_CLIENT_ID_ENV, "")
    ttl = int(os.environ.get(OIDC_JWKS_CACHE_TTL_ENV, str(_DEFAULT_JWKS_TTL)))
    return OIDCVerifier(discovery_url, client_id, jwks_ttl=ttl)


def _get_verifier() -> OIDCVerifier:
    global _verifier
    if _verifier is None:
        _verifier = _build_verifier()
    return _verifier


def _set_verifier(v: OIDCVerifier | None) -> None:
    """Replace the module-level singleton — for tests only."""
    global _verifier
    _verifier = v


def get_auth_backend() -> str:
    return os.environ.get(AUTH_BACKEND_ENV, "basic").strip().lower()


def _admin_enabled() -> bool:
    """Return False when CDX_ADMIN_ENABLED=false (explicit dev bypass)."""
    return os.environ.get("CDX_ADMIN_ENABLED", "true").strip().lower() != "false"


async def require_admin_oidc(request: Request) -> None:
    """FastAPI dependency: enforce OIDC Bearer auth for the /admin UI.

    Dev bypass: disabled when ``CDX_ADMIN_ENABLED=false``.
    """
    if not _admin_enabled():
        return

    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer token required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = auth_header[len("Bearer ") :]
    _get_verifier().verify(token)
