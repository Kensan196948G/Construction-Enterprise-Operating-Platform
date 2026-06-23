"""CSP nonce middleware — Issue 0044.

Generates a cryptographically random nonce per HTTP request and injects it
into the Content-Security-Policy script-src directive.  This eliminates the
need for 'unsafe-inline' in script-src while still allowing inline <script>
blocks that carry the matching nonce attribute.

Usage in Jinja2 templates:
  <script nonce="{{ request.state.csp_nonce }}">
    // inline JS here
  </script>
"""

from __future__ import annotations

import secrets
from collections.abc import Awaitable, Callable


class CSPNonceMiddleware:
    """ASGI middleware that generates a per-request CSP nonce.

    The nonce is stored in ``request.state.csp_nonce`` so route handlers and
    Jinja2 templates can access it.  SecurityHeadersMiddleware must run
    *after* this middleware so it can read the nonce from scope['state'].
    """

    def __init__(self, app: Callable[..., Awaitable]) -> None:
        self.app = app

    async def __call__(self, scope: dict, receive: Callable, send: Callable) -> None:
        if scope["type"] == "http":
            # Starlette stores request state in scope["state"] dict.
            state = scope.setdefault("state", {})
            nonce = secrets.token_urlsafe(16)
            state["csp_nonce"] = nonce

        await self.app(scope, receive, send)
