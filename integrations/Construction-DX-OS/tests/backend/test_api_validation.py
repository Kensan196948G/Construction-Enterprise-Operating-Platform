"""Backend API validation and error handling tests.

Covers HTTP status codes, security headers, and auth enforcement.
Uses InMemoryStorage with NullRateLimiter for full isolation.
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../server/api"))

import pytest
from fastapi.testclient import TestClient

from cdx_server.app import create_app
from cdx_server.rate_limit import NullRateLimiter
from cdx_server.storage import InMemoryStorage

REG_TOKEN = "backend-test-token-16chars-plus"

# Shared secret must be >= 16 chars (RegisterRequest.shared_secret min_length=16)
SHARED_SECRET = "backend-test-shared-secret-16plus"


@pytest.fixture(autouse=True)
def _token(monkeypatch):
    monkeypatch.setenv("CDX_REGISTRATION_TOKEN", REG_TOKEN)
    yield


@pytest.fixture
def client():
    app = create_app(storage=InMemoryStorage(), rate_limiter=NullRateLimiter())
    with TestClient(app) as c:
        yield c


class TestAPIStatusCodes:
    def test_health_200(self, client):
        assert client.get("/health").status_code == 200

    def test_nonexistent_endpoint_404(self, client):
        assert client.get("/api/v1/nonexistent").status_code == 404

    def test_register_without_auth_401(self, client):
        r = client.post(
            "/api/v1/devices/register",
            json={
                "device_id": "x",
                "profile": "standard",
                "hostname": "h",
                "shared_secret": SHARED_SECRET,
            },
        )
        assert r.status_code == 401

    def test_register_with_wrong_token_401(self, client):
        r = client.post(
            "/api/v1/devices/register",
            json={
                "device_id": "x",
                "profile": "standard",
                "hostname": "h",
                "shared_secret": SHARED_SECRET,
            },
            headers={"Authorization": "Bearer wrong-token"},
        )
        assert r.status_code == 401

    def test_post_with_invalid_json_422(self, client):
        r = client.post(
            "/api/v1/devices/register",
            content=b"not-json",
            headers={
                "Authorization": f"Bearer {REG_TOKEN}",
                "Content-Type": "application/json",
            },
        )
        assert r.status_code == 422

    def test_root_redirects(self, client):
        """GET / should redirect (302) to the admin SPA."""
        r = client.get("/", follow_redirects=False)
        assert r.status_code in (301, 302, 307, 308)

    def test_metrics_endpoint_accessible(self, client):
        """Prometheus /metrics must return 200 with text/plain content."""
        r = client.get("/metrics")
        assert r.status_code == 200


class TestSecurityHeaders:
    def test_x_content_type_options(self, client):
        r = client.get("/health")
        assert r.headers.get("x-content-type-options") == "nosniff"

    def test_x_frame_options(self, client):
        r = client.get("/health")
        assert r.headers.get("x-frame-options") in ("DENY", "SAMEORIGIN")

    def test_csp_header_present(self, client):
        r = client.get("/health")
        assert "content-security-policy" in r.headers

    def test_referrer_policy_present(self, client):
        r = client.get("/health")
        assert "referrer-policy" in r.headers

    def test_permissions_policy_present(self, client):
        r = client.get("/health")
        assert "permissions-policy" in r.headers
