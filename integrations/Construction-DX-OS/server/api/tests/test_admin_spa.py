"""Tests for the /admin-spa static bundle (Issue 0039).

Verifies the Anthropic Design Canvas bundle is served correctly as static
assets at /admin-spa/, and that public access does not require auth (the
SPA itself uses the auth-gated JSON APIs for any privileged data).
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from cdx_server.app import create_app
from cdx_server.storage import InMemoryStorage


@pytest.fixture()
def client() -> TestClient:
    app = create_app(storage=InMemoryStorage())
    return TestClient(app)


def test_admin_spa_index_served(client: TestClient) -> None:
    """GET /admin-spa/ returns the design bundle index.html."""
    resp = client.get("/admin-spa/")
    assert resp.status_code == 200
    assert "text/html" in resp.headers["content-type"]
    # Title from the design bundle (建設DX OS 管理WebUI.html).
    assert "建設DX OS" in resp.text
    assert "中央管理コンソール" in resp.text


def test_admin_spa_index_html_explicit(client: TestClient) -> None:
    """GET /admin-spa/index.html returns the same index document."""
    resp = client.get("/admin-spa/index.html")
    assert resp.status_code == 200
    assert "<div id=\"root\"></div>" in resp.text


def test_admin_spa_jsx_assets_served(client: TestClient) -> None:
    """All 9 JSX modules referenced by index.html are reachable."""
    expected = [
        "proto-app.jsx",
        "proto-data.jsx",
        "proto-page-dashboard.jsx",
        "proto-page-devices.jsx",
        "proto-page-iso.jsx",
        "proto-page-rings.jsx",
        "proto-page-security.jsx",
        "proto-page-others.jsx",
        "proto-page-settings.jsx",
    ]
    for name in expected:
        resp = client.get(f"/admin-spa/{name}")
        assert resp.status_code == 200, f"missing asset: {name}"
        # JSX is served as text — exact MIME varies by platform
        # (text/jsx, application/octet-stream, etc.), so just check non-empty.
        assert len(resp.content) > 0


def test_admin_spa_does_not_break_existing_admin_routes(client: TestClient) -> None:
    """Mounting /admin-spa must not shadow the existing /admin Jinja2 UI."""
    resp = client.get("/admin")
    # /admin is auth-gated; either 200 (dev mode bypass) or 401 is acceptable.
    # What matters is that it is NOT a 404 from path collision.
    assert resp.status_code in (200, 401)


def test_admin_spa_prebuilt_bundle_served(client: TestClient) -> None:
    """GET /admin-spa/dist/bundle.js returns the prebuilt JS bundle (Issue 0043)."""
    resp = client.get("/admin-spa/dist/bundle.js")
    assert resp.status_code == 200
    # Bundle should be non-trivial (> 10 KB)
    assert len(resp.content) > 10_000


def test_admin_spa_vendor_react_served(client: TestClient) -> None:
    """Self-hosted React vendor files are served (no CDN dependency)."""
    for path in ("vendor/react.min.js", "vendor/react-dom.min.js"):
        resp = client.get(f"/admin-spa/{path}")
        assert resp.status_code == 200, f"missing vendor: {path}"
        assert len(resp.content) > 1_000


def test_admin_spa_index_no_cdn_references(client: TestClient) -> None:
    """index.html must not reference external CDNs (CSP self-hosted requirement)."""
    resp = client.get("/admin-spa/index.html")
    assert resp.status_code == 200
    html = resp.text
    assert "unpkg.com" not in html, "CDN reference (unpkg.com) found in index.html"
    assert "cdn.jsdelivr.net" not in html, "CDN reference (jsdelivr) found in index.html"
    assert "babel" not in html, "Babel CDN reference found in index.html"
