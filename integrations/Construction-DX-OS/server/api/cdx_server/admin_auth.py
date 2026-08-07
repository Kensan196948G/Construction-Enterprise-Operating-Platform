"""Admin authentication gate for the /admin management UI.

Phase 4a: HTTP Basic Auth (CDX_ADMIN_TOKEN).
Phase 5b: OIDC Bearer auth (AUTH_BACKEND=oidc).

Authentication backend is selected by ``AUTH_BACKEND`` env var:

``AUTH_BACKEND=basic`` (default)
    HTTP Basic Auth — password must match ``CDX_ADMIN_TOKEN``.

``AUTH_BACKEND=oidc``
    OIDC JWT Bearer token — see :mod:`cdx_server.oidc_auth` for config vars.

``AUTH_BACKEND=ldap``
    Stub — raises NotImplementedError (future implementation).

Basic Auth interaction matrix
-----------------------------
+---------------------+----------------------+----------------------------+
| CDX_ADMIN_TOKEN set | CDX_ADMIN_ENABLED    | Result                     |
+---------------------+----------------------+----------------------------+
| no                  | any                  | dev mode — open access     |
| yes                 | "false"              | dev mode — open access     |
| yes                 | "true" / unset       | Basic Auth required        |
+---------------------+----------------------+----------------------------+

Security note
-------------
HTTP Basic Auth sends credentials base64-encoded, not encrypted.  This is
acceptable for internal/VPN-only access (the intended deployment).  TLS
termination at the load-balancer protects credentials in transit.
"""

from __future__ import annotations

import os
import secrets

from fastapi import Depends, Request
from fastapi.security import HTTPBasic, HTTPBasicCredentials

ADMIN_TOKEN_ENV = "CDX_ADMIN_TOKEN"
ADMIN_ENABLED_ENV = "CDX_ADMIN_ENABLED"

_security = HTTPBasic(auto_error=False)


def _admin_auth_enabled() -> bool:
    """Return True when Basic Auth should be enforced."""
    token = os.environ.get(ADMIN_TOKEN_ENV, "").strip()
    if not token:
        return False  # no token configured → dev mode
    enabled = os.environ.get(ADMIN_ENABLED_ENV, "true").strip().lower()
    return enabled != "false"


def require_admin_auth(
    credentials: HTTPBasicCredentials | None = Depends(_security),
) -> None:
    """FastAPI dependency: enforce HTTP Basic Auth when configured.

    Raises HTTP 401 with ``WWW-Authenticate: Basic`` on failure so the
    browser displays its native login dialog.

    When auth is disabled (dev mode), the dependency is a no-op.
    Delegates to OIDC when ``AUTH_BACKEND=oidc``.
    """
    from cdx_server.oidc_auth import get_auth_backend

    backend = get_auth_backend()

    if backend == "ldap":
        raise NotImplementedError("LDAP auth backend is not yet implemented")

    if backend == "oidc":
        # OIDC path is handled by require_admin_oidc() dependency.
        # This function is kept for the Basic Auth path only.
        return

    # Default: Basic Auth path.
    if not _admin_auth_enabled():
        return  # dev mode — no auth

    from fastapi import HTTPException, status

    expected_token = os.environ.get(ADMIN_TOKEN_ENV, "")

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin authentication required",
            headers={"WWW-Authenticate": 'Basic realm="cdx-server admin"'},
        )

    # Constant-time comparison to avoid timing attacks.
    ok = secrets.compare_digest(
        credentials.password.encode(),
        expected_token.encode(),
    )
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin credentials",
            headers={"WWW-Authenticate": 'Basic realm="cdx-server admin"'},
        )


async def require_admin_auth_v2(
    request: Request,
    credentials: HTTPBasicCredentials | None = Depends(_security),
) -> None:
    """Unified FastAPI dependency: dispatches to Basic Auth or OIDC.

    Use this on /admin routes to support ``AUTH_BACKEND`` switching.
    """
    from cdx_server.oidc_auth import get_auth_backend, require_admin_oidc

    backend = get_auth_backend()

    if backend == "ldap":
        raise NotImplementedError("LDAP auth backend is not yet implemented")

    if backend == "oidc":
        await require_admin_oidc(request)
        return

    # Basic Auth (default)
    require_admin_auth(credentials)
