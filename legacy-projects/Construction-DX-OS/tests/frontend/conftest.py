"""Shared fixtures for Admin WebUI Playwright E2E tests.

Requires:
    pip install pytest-playwright requests
    playwright install chromium
"""

from __future__ import annotations

import os

import pytest
import requests

CDX_SERVER_URL = os.environ.get("CDX_SERVER_URL", "http://localhost:8000")


@pytest.fixture(scope="session")
def server_reachable() -> bool:
    """Return True when the live cdx-server responds to /health within 5 s."""
    try:
        r = requests.get(CDX_SERVER_URL + "/health", timeout=5)
        if r.status_code != 200:
            return False
        # Verify this is actually cdx-server, not a different app at that URL.
        return r.json().get("service") == "cdx-server"
    except Exception:
        return False


@pytest.fixture
def admin_page(browser, server_reachable):  # noqa: ANN001
    """Authenticated Playwright page for admin routes.

    Skips when:
    - the server is not reachable, OR
    - CDX_ADMIN_TOKEN is not set AND the server is running with auth enabled.

    When CDX_ADMIN_TOKEN is empty the fixture still tries to open the page;
    if the server is in dev-mode (CDX_ADMIN_ENABLED=false / no token set)
    the request will succeed without credentials.
    """
    if not server_reachable:
        pytest.skip("Server not reachable — set CDX_SERVER_URL or start the server")

    admin_token = os.environ.get("CDX_ADMIN_TOKEN", "")

    # Build context: pass credentials only when a token is provided.
    ctx_kwargs: dict = {"base_url": CDX_SERVER_URL}
    if admin_token:
        ctx_kwargs["http_credentials"] = {
            "username": "admin",
            "password": admin_token,
        }

    context = browser.new_context(**ctx_kwargs)
    page = context.new_page()
    yield page
    context.close()


@pytest.fixture
def plain_page(browser, server_reachable):  # noqa: ANN001
    """Unauthenticated Playwright page for public routes."""
    if not server_reachable:
        pytest.skip("Server not reachable — set CDX_SERVER_URL or start the server")

    context = browser.new_context(base_url=CDX_SERVER_URL)
    page = context.new_page()
    yield page
    context.close()
