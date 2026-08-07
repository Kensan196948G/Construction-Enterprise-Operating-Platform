"""Common FastAPI dependencies (auth, current user).

Auth design (Loop #34):
- The api-gateway is the primary authenticator (verifies JWT against shared-auth
  EntraOIDCMiddleware before forwarding requests downstream).
- This backend re-verifies the bearer token locally using project-scoped
  PyJWT settings; it does NOT attempt to wire into `cdx_auth` again.
- Removed the historical `from cdx_shared_auth import verify_token` fallback
  (module did not exist — was always falling through to the PyJWT branch).
"""

from __future__ import annotations

from typing import Any

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from itsm_api.config import get_settings


def verify_token(token: str) -> dict[str, Any]:
    """Verify a JWT bearer token against project-scoped settings."""
    settings = get_settings()
    try:
        return jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)
        ) from exc


bearer_scheme = HTTPBearer(auto_error=True)


def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict[str, Any]:
    """Validate bearer token and return user claims."""
    if not creds or not creds.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="missing token"
        )
    claims = verify_token(creds.credentials)
    if not claims:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid token"
        )
    return claims
