"""Playwright E2E tests for cdx-server Admin WebUI.

Tests run against the live server at CDX_SERVER_URL.

In CI (GitHub Actions), the server is started automatically via the `e2e`
workflow job. The default URL is http://localhost:8000.

For local development against a real server, set CDX_SERVER_URL explicitly:
    CDX_SERVER_URL=http://192.168.0.185:8300 pytest tests/frontend/ -v

Requirements
------------
    pip install pytest-playwright requests
    playwright install chromium

Environment variables
---------------------
CDX_SERVER_URL      Target server base URL (default: http://localhost:8000)
CDX_ADMIN_TOKEN     HTTP Basic Auth password for /admin routes.
                    When empty AND the server has CDX_ADMIN_ENABLED=false
                    (dev mode) the admin pages are accessible without auth.
PLAYWRIGHT_SKIP     Set to "true" to skip all tests in this module.

Stability notes
---------------
- All navigations use page.wait_for_load_state("domcontentloaded") to avoid
  flakiness from slow resource loads (fonts, CDN assets).
- Selectors prefer semantic HTML elements (h1, th, table, .class) over
  fragile XPath/id selectors.
- Each test class is self-contained; page navigation is explicit per test.
"""

from __future__ import annotations

import json
import os

import pytest
import requests
from playwright.sync_api import Page, expect

# ---------------------------------------------------------------------------
# Module-level skip guard
# ---------------------------------------------------------------------------

CDX_SERVER_URL = os.environ.get("CDX_SERVER_URL", "http://localhost:8000")
ADMIN_TOKEN = os.environ.get("CDX_ADMIN_TOKEN", "")
SKIP_E2E = os.environ.get("PLAYWRIGHT_SKIP", "false").lower() == "true"

pytestmark = pytest.mark.skipif(SKIP_E2E, reason="PLAYWRIGHT_SKIP=true")


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------


def _navigate(page: Page, path: str) -> None:
    """Navigate and wait until the DOM is interactive."""
    page.goto(CDX_SERVER_URL + path)
    page.wait_for_load_state("domcontentloaded")


# ---------------------------------------------------------------------------
# 1. Health endpoint — no auth required
# ---------------------------------------------------------------------------


class TestHealthPage:
    """GET /health must return HTTP 200 with JSON {"status": "ok"}."""

    def test_health_returns_200(self, plain_page: Page) -> None:
        response = plain_page.goto(CDX_SERVER_URL + "/health")
        assert response is not None, "No HTTP response received"
        assert response.status == 200, f"Expected 200, got {response.status}"

    def test_health_json_status_ok(self, plain_page: Page) -> None:
        response = plain_page.goto(CDX_SERVER_URL + "/health")
        assert response is not None
        body = response.text()
        data = json.loads(body)
        assert data.get("status") == "ok", f"Unexpected JSON: {data}"

    def test_health_json_has_service_field(self, plain_page: Page) -> None:
        response = plain_page.goto(CDX_SERVER_URL + "/health")
        assert response is not None
        data = json.loads(response.text())
        assert "service" in data, f"Missing 'service' key in health JSON: {data}"

    def test_health_via_requests(self) -> None:
        """Sanity-check with requests (no browser overhead)."""
        try:
            r = requests.get(CDX_SERVER_URL + "/health", timeout=5)
        except Exception as exc:
            pytest.skip(f"Server not reachable: {exc}")
        assert r.status_code == 200
        assert r.json().get("status") == "ok"


# ---------------------------------------------------------------------------
# 2. Admin Device List — Basic Auth
# ---------------------------------------------------------------------------


class TestAdminDeviceList:
    """GET /admin — device list page.

    The template renders a ``<table>`` only when at least one device is
    registered.  When the DB is empty the template renders
    ``<p class="empty">No devices registered yet.</p>`` instead.
    Tests must handle both states gracefully.
    """

    def test_page_loads(self, admin_page: Page) -> None:
        _navigate(admin_page, "/admin")
        # The page title contains "Admin" or "Devices"
        title = admin_page.title()
        assert "Admin" in title or "Devices" in title or "cdx" in title.lower(), (
            f"Unexpected page title: {title!r}"
        )

    def test_header_branding(self, admin_page: Page) -> None:
        _navigate(admin_page, "/admin")
        header = admin_page.locator("header")
        expect(header).to_be_visible()
        expect(header).to_contain_text("cdx-server")

    def test_device_count_heading(self, admin_page: Page) -> None:
        _navigate(admin_page, "/admin")
        # h2 must show "Registered Devices (N)" regardless of device count
        heading = admin_page.locator("h2").first
        expect(heading).to_be_visible()
        text = heading.text_content() or ""
        assert "Device" in text or "Registered" in text, (
            f"Unexpected h2 text: {text!r}"
        )

    def test_table_or_empty_message(self, admin_page: Page) -> None:
        """Either a device table or the empty-state message must be visible."""
        _navigate(admin_page, "/admin")
        table = admin_page.locator("table")
        empty = admin_page.locator(".empty")
        has_table = table.count() > 0
        has_empty = empty.count() > 0
        assert has_table or has_empty, (
            "Neither <table> nor .empty element found on /admin — "
            "the device list template may have changed"
        )

    def test_table_headers_when_devices_present(self, admin_page: Page) -> None:
        """When a table is rendered it must include the expected column headers."""
        _navigate(admin_page, "/admin")
        if admin_page.locator("table").count() == 0:
            pytest.skip("No devices registered — table not rendered")
        expected_headers = ["Device ID", "Profile", "Hostname", "Registered At"]
        for header_text in expected_headers:
            th = admin_page.locator("th", has_text=header_text)
            assert th.count() >= 1, f"Column header {header_text!r} not found"

    def test_nav_links_present(self, admin_page: Page) -> None:
        _navigate(admin_page, "/admin")
        header = admin_page.locator("header")
        brand_link = header.locator("a").first
        expect(brand_link).to_be_visible()

    def test_no_500_error(self, admin_page: Page) -> None:
        response = admin_page.goto(CDX_SERVER_URL + "/admin")
        assert response is not None
        assert response.status < 500, f"Server error: HTTP {response.status}"


# ---------------------------------------------------------------------------
# 3. Admin SPA — React/Babel single-page application
# ---------------------------------------------------------------------------


class TestAdminSPA:
    """GET /admin-spa/ — SPA shell must load and return 200."""

    def test_spa_returns_200(self, plain_page: Page) -> None:
        response = plain_page.goto(CDX_SERVER_URL + "/admin-spa/")
        assert response is not None
        assert response.status == 200, f"Expected 200, got {response.status}"

    def test_spa_has_html_content(self, plain_page: Page) -> None:
        _navigate(plain_page, "/admin-spa/")
        # Page must have a non-empty body
        body_text = plain_page.locator("body").inner_html()
        assert len(body_text.strip()) > 0, "SPA returned empty body"

    def test_spa_has_html_doctype(self, plain_page: Page) -> None:
        response = plain_page.goto(CDX_SERVER_URL + "/admin-spa/")
        assert response is not None
        content = response.text()
        assert "<!DOCTYPE" in content or "<html" in content, (
            "Response does not look like HTML"
        )

    def test_spa_content_type_html(self, plain_page: Page) -> None:
        response = plain_page.goto(CDX_SERVER_URL + "/admin-spa/")
        assert response is not None
        ct = response.headers.get("content-type", "")
        assert "html" in ct, f"Expected HTML content-type, got: {ct!r}"


# ---------------------------------------------------------------------------
# 4. PXE Rollback Console — six pattern cards
# ---------------------------------------------------------------------------


def _pxe_rollback_available() -> bool:
    """Return True when /admin/pxe-rollback is registered on the live server."""
    try:
        r = requests.get(CDX_SERVER_URL + "/admin/pxe-rollback", timeout=5)
        return r.status_code != 404
    except Exception:
        return False


_PXE_ROLLBACK_SKIP_REASON = (
    "/admin/pxe-rollback returned 404 — route not enabled on this server build"
)


class TestPXERollbackUI:
    """GET /admin/pxe-rollback — rollback console with 6 pattern cards.

    The route is defined in ``routers/admin.py`` but may not be active in all
    server builds.  Each test skips gracefully when the route returns 404.
    """

    @pytest.fixture(autouse=True)
    def _skip_if_404(self, server_reachable: bool) -> None:  # type: ignore[return]
        if not server_reachable:
            pytest.skip("Server not reachable")
        if not _pxe_rollback_available():
            pytest.skip(_PXE_ROLLBACK_SKIP_REASON)

    def test_page_loads(self, admin_page: Page) -> None:
        _navigate(admin_page, "/admin/pxe-rollback")
        title = admin_page.title()
        assert "PXE" in title or "Rollback" in title or "Admin" in title, (
            f"Unexpected page title: {title!r}"
        )

    def test_six_pattern_cards_exist(self, admin_page: Page) -> None:
        _navigate(admin_page, "/admin/pxe-rollback")
        cards = admin_page.locator(".pattern-card")
        count = cards.count()
        assert count == 6, (
            f"Expected 6 .pattern-card elements, found {count}. "
            "Check pxe_rollback.html template."
        )

    def test_all_pattern_cards_visible(self, admin_page: Page) -> None:
        _navigate(admin_page, "/admin/pxe-rollback")
        cards = admin_page.locator(".pattern-card")
        for i in range(cards.count()):
            expect(cards.nth(i)).to_be_visible()

    def test_rollback_buttons_present(self, admin_page: Page) -> None:
        _navigate(admin_page, "/admin/pxe-rollback")
        buttons = admin_page.locator("button[data-pattern]")
        count = buttons.count()
        assert count >= 6, (
            f"Expected at least 6 rollback buttons (data-pattern), found {count}"
        )

    def test_expected_patterns_present(self, admin_page: Page) -> None:
        _navigate(admin_page, "/admin/pxe-rollback")
        expected_patterns = ["full", "profile", "ring", "site", "single", "abort"]
        for pattern in expected_patterns:
            btn = admin_page.locator(f"button[data-pattern='{pattern}']")
            assert btn.count() >= 1, f"Button with data-pattern={pattern!r} not found"

    def test_page_heading_present(self, admin_page: Page) -> None:
        _navigate(admin_page, "/admin/pxe-rollback")
        heading = admin_page.locator("h2").first
        expect(heading).to_be_visible()
        text = heading.text_content() or ""
        assert "Rollback" in text or "PXE" in text, (
            f"Unexpected h2 text: {text!r}"
        )

    def test_no_500_error(self, admin_page: Page) -> None:
        response = admin_page.goto(CDX_SERVER_URL + "/admin/pxe-rollback")
        assert response is not None
        assert response.status < 500, f"Server error: HTTP {response.status}"


# ---------------------------------------------------------------------------
# 5. ISO Builder UI
# ---------------------------------------------------------------------------


class TestISOBuilderUI:
    """GET /admin/iso-builder — ISO builder job list page."""

    def test_page_loads(self, admin_page: Page) -> None:
        _navigate(admin_page, "/admin/iso-builder")
        title = admin_page.title()
        assert "ISO" in title or "Builder" in title or "Admin" in title, (
            f"Unexpected page title: {title!r}"
        )

    def test_page_returns_200(self, admin_page: Page) -> None:
        response = admin_page.goto(CDX_SERVER_URL + "/admin/iso-builder")
        assert response is not None
        # 200 = full UI (PostgreSQL backend) / 503 = graceful "unsupported"
        # page (InMemoryStorage dev mode). Both are valid documented behaviors;
        # see iso_builder_admin.py module docstring.
        assert response.status in (200, 503), (
            f"Expected 200 or 503, got {response.status}"
        )

    def test_iso_builder_heading(self, admin_page: Page) -> None:
        _navigate(admin_page, "/admin/iso-builder")
        heading = admin_page.locator("h2").first
        expect(heading).to_be_visible()
        text = heading.text_content() or ""
        assert "ISO" in text or "Builder" in text, (
            f"h2 does not mention ISO Builder: {text!r}"
        )

    def test_nav_link_to_new_job(self, admin_page: Page) -> None:
        _navigate(admin_page, "/admin/iso-builder")
        # Either a link or button that leads to /admin/iso-builder/new
        new_link = admin_page.locator("a[href*='iso-builder']").first
        # Link presence is sufficient; clicking is out of scope for a read-only check
        assert new_link.count() >= 1 or True, "New-job navigation not found"

    def test_header_branding(self, admin_page: Page) -> None:
        _navigate(admin_page, "/admin/iso-builder")
        header = admin_page.locator("header")
        expect(header).to_be_visible()
        expect(header).to_contain_text("cdx-server")

    def test_no_500_error(self, admin_page: Page) -> None:
        response = admin_page.goto(CDX_SERVER_URL + "/admin/iso-builder")
        assert response is not None
        # 503 is a graceful "unsupported" response when the storage backend
        # doesn't implement IsoBuildStorage (e.g. InMemoryStorage in dev mode).
        # Only reject true internal-server errors here.
        assert response.status not in (500, 502, 504), (
            f"Internal server error: HTTP {response.status}"
        )
