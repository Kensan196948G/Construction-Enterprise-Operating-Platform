"""Infrastructure health tests.

Verifies that the deployed system components are healthy.
Tests are skipped if the live server is unreachable.
"""
import os
import subprocess
import pytest
import requests

CDX_SERVER_URL = os.environ.get("CDX_SERVER_URL", "http://192.168.0.185:8300")


def _server_up():
    try:
        return requests.get(CDX_SERVER_URL + "/health", timeout=5).status_code == 200
    except Exception:
        return False


skip_if_no_server = pytest.mark.skipif(not _server_up(), reason="cdx-server not reachable")


class TestServerHealth:
    @skip_if_no_server
    def test_health_endpoint_ok(self):
        r = requests.get(CDX_SERVER_URL + "/health", timeout=10)
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "ok"
        assert data["storage"] == "ok"

    @skip_if_no_server
    def test_metrics_endpoint_returns_prometheus_format(self):
        r = requests.get(CDX_SERVER_URL + "/metrics", timeout=10)
        assert r.status_code == 200
        assert "cdx_ingest_total" in r.text

    @skip_if_no_server
    def test_root_redirects_to_admin(self):
        r = requests.get(CDX_SERVER_URL + "/", timeout=10, allow_redirects=False)
        assert r.status_code in (301, 302, 307, 308)

    def test_systemd_service_active(self):
        """cdx-os-server systemd service should be active."""
        result = subprocess.run(
            ["systemctl", "is-active", "cdx-os-server"],
            capture_output=True,
            text=True,
        )
        # Skip if systemctl not available (e.g., in CI container)
        if result.returncode == 4:
            pytest.skip("systemctl not available")
        assert result.stdout.strip() == "active", f"cdx-os-server is not active: {result.stdout}"

    def test_postgresql_reachable(self):
        """PostgreSQL should be reachable for health check."""
        try:
            import asyncpg  # noqa: F401
        except ImportError:
            pytest.skip("asyncpg not installed")
        # Just verify the server reports storage=ok (indirectly tests PG)
        if not _server_up():
            pytest.skip("server not reachable")
        r = requests.get(CDX_SERVER_URL + "/health", timeout=10)
        data = r.json()
        assert data.get("storage_backend") == "PostgresStorage"
