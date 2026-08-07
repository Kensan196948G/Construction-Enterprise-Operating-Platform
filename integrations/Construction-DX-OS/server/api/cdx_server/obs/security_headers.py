"""Security headers ASGI middleware.

Adds defensive HTTP response headers to every response.  These cannot be
set per-route in FastAPI without repetition, so a middleware layer is the
correct place.

Headers added
-------------
X-Content-Type-Options     nosniff — prevents MIME-type sniffing
X-Frame-Options            DENY    — clickjacking protection
X-XSS-Protection           0       — disable legacy XSS filter (CSP is authoritative)
Referrer-Policy            strict-origin-when-cross-origin
Content-Security-Policy    nonce-based strict policy (Issue 0044 + 0043)
Permissions-Policy         deny camera/mic/geolocation

CSP nonce integration (Issue 0044)
-----------------------------------
CSPNonceMiddleware (cdx_server.obs.csp_nonce) runs first and stores a
per-request nonce in scope["state"]["csp_nonce"].  This middleware reads that
nonce and injects ``'nonce-{nonce}'`` into script-src, eliminating the need
for 'unsafe-inline' in script-src.

Templates must use:
  <script nonce="{{ request.state.csp_nonce }}">...</script>

Issue 0043 resolution
---------------------
Admin SPA is now pre-built (JSX → JS via esbuild) and React/ReactDOM are
self-hosted under /admin-spa/vendor/.  Babel standalone is no longer loaded
at runtime, so 'unsafe-eval' and https://unpkg.com are removed.
Google Fonts replaced by system font stack, removing external font sources.
"""

from __future__ import annotations

from collections.abc import Awaitable, Callable

# Static headers that don't depend on the per-request nonce.
_STATIC_HEADERS: list[tuple[bytes, bytes]] = [
    (b"x-content-type-options", b"nosniff"),
    (b"x-frame-options", b"DENY"),
    (b"x-xss-protection", b"0"),
    (b"referrer-policy", b"strict-origin-when-cross-origin"),
    (b"permissions-policy", b"geolocation=(), microphone=(), camera=()"),
]

# CSP template — nonce placeholder replaced per request.
_CSP_TEMPLATE = (
    "default-src 'self'; "
    "script-src 'self' 'nonce-{nonce}'; "
    "style-src 'self' 'unsafe-inline'; "
    "img-src 'self' data:; "
    "font-src 'self'; "
    "connect-src 'self'; "
    "frame-ancestors 'none'"
)


class SecurityHeadersMiddleware:
    """ASGI middleware that appends security headers to every HTTP response.

    Reads the per-request CSP nonce from scope["state"]["csp_nonce"] (set by
    CSPNonceMiddleware) and injects it into the Content-Security-Policy header.
    Falls back to 'unsafe-inline' if no nonce is present (e.g. in unit tests
    that don't use CSPNonceMiddleware).
    """

    def __init__(self, app: Callable[..., Awaitable]) -> None:
        self.app = app

    async def __call__(self, scope: dict, receive: Callable, send: Callable) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        # Read nonce set by CSPNonceMiddleware (or fall back for test isolation).
        nonce = scope.get("state", {}).get("csp_nonce", "")
        if nonce:
            csp_value = _CSP_TEMPLATE.format(nonce=nonce).encode()
        else:
            # Fallback: no nonce available — use 'unsafe-inline' for backward compat.
            csp_value = (
                b"default-src 'self'; "
                b"script-src 'self' 'unsafe-inline'; "
                b"style-src 'self' 'unsafe-inline'; "
                b"img-src 'self' data:; "
                b"font-src 'self'; "
                b"connect-src 'self'; "
                b"frame-ancestors 'none'"
            )

        headers_to_add = [*_STATIC_HEADERS, (b"content-security-policy", csp_value)]

        async def send_with_security(message: dict) -> None:
            if message["type"] == "http.response.start":
                headers = list(message.get("headers") or [])
                existing = {name.lower() for name, _ in headers}
                for name, value in headers_to_add:
                    if name not in existing:
                        headers.append((name, value))
                message = {**message, "headers": headers}
            await send(message)

        await self.app(scope, receive, send_with_security)
