"""Tests for SecurityHeadersMiddleware.

Verifies that defensive HTTP security headers are present on every response
regardless of the endpoint, and that no existing header is overwritten.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from cdx_server.app import create_app


@pytest.fixture()
def client() -> TestClient:
    return TestClient(create_app())


_EXPECTED_HEADERS = [
    ("x-content-type-options", "nosniff"),
    ("x-frame-options", "DENY"),
    ("x-xss-protection", "0"),
    ("referrer-policy", "strict-origin-when-cross-origin"),
    ("permissions-policy", "geolocation=(), microphone=(), camera=()"),
]


@pytest.mark.parametrize("endpoint", ["/health", "/admin", "/docs"])
def test_security_headers_present(client: TestClient, endpoint: str) -> None:
    resp = client.get(endpoint)
    for header, expected_value in _EXPECTED_HEADERS:
        assert header in resp.headers, f"Missing header {header!r} on {endpoint}"
        assert resp.headers[header] == expected_value, (
            f"Header {header!r} value mismatch on {endpoint}: "
            f"{resp.headers[header]!r} != {expected_value!r}"
        )


def test_csp_header_present(client: TestClient) -> None:
    resp = client.get("/health")
    assert "content-security-policy" in resp.headers
    csp = resp.headers["content-security-policy"]
    assert "default-src 'self'" in csp
    assert "frame-ancestors 'none'" in csp


def test_csp_no_external_origins(client: TestClient) -> None:
    """Issue 0043: Admin SPA is now pre-built (esbuild JSX→JS) with self-hosted
    React/ReactDOM.  The CSP must no longer allow external CDN origins or
    unsafe-eval.  Any regression here re-introduces supply-chain attack surface.
    """
    resp = client.get("/health")
    csp = resp.headers["content-security-policy"]
    assert "https://unpkg.com" not in csp, "unpkg.com CDN must not appear in CSP"
    assert "'unsafe-eval'" not in csp, "'unsafe-eval' must not appear in CSP"
    assert "https://fonts.googleapis.com" not in csp, "Google Fonts CSS CDN must not appear"
    assert "https://fonts.gstatic.com" not in csp, "Google Fonts file CDN must not appear"


def test_csp_uses_nonce_in_script_src(client: TestClient) -> None:
    """CSPNonceMiddleware must inject 'nonce-...' into script-src.

    TestClient creates a new ASGI scope per request so each call gets a fresh
    nonce.  We verify the nonce pattern is present and 'unsafe-inline' is
    absent (when nonce is active, unsafe-inline is removed).
    """
    import re

    resp = client.get("/health")
    csp = resp.headers.get("content-security-policy", "")
    # Nonce-based CSP replaces unsafe-inline with 'nonce-<token>'
    assert re.search(r"'nonce-[A-Za-z0-9_-]+'", csp), f"No nonce found in CSP: {csp}"


def test_csp_nonces_differ_per_request(client: TestClient) -> None:
    """Each request must get a unique nonce (replay protection)."""
    import re

    def get_nonce(resp):
        csp = resp.headers.get("content-security-policy", "")
        m = re.search(r"'nonce-([A-Za-z0-9_-]+)'", csp)
        return m.group(1) if m else None

    nonce1 = get_nonce(client.get("/health"))
    nonce2 = get_nonce(client.get("/health"))
    assert nonce1 is not None
    assert nonce2 is not None
    assert nonce1 != nonce2, "Nonces must be unique per request"


def test_favicon_returns_204(client: TestClient) -> None:
    resp = client.get("/favicon.ico")
    assert resp.status_code == 204


def test_security_headers_on_error_response(client: TestClient) -> None:
    resp = client.get("/nonexistent-route-404")
    assert resp.status_code == 404
    assert "x-content-type-options" in resp.headers
    assert resp.headers["x-content-type-options"] == "nosniff"
