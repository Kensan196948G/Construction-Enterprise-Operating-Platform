"""Tests for PXE rollback intent API (Issue 0042 Phase 4.5).

Covers:
- POST /api/v1/pxe/rollback: all 6 patterns return 202 + script command
- Auth: requires admin credentials (HTTP Basic)
- Validation: reason min_length, invalid pattern, invalid profile/ring
- Response fields: pattern, audit_id, script_name, command
- Command contains correct flags for each pattern
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

ADMIN_TOKEN = "unit-test-admin-token"
ADMIN_HEADERS = {"Authorization": f"Basic {__import__('base64').b64encode(f'admin:{ADMIN_TOKEN}'.encode()).decode()}"}

VALID_REASON = "Emergency rollback due to boot failure in ring2 pilot"
VALID_FINGERPRINT = "a" * 64


@pytest.fixture(autouse=True)
def _set_admin_token(monkeypatch):
    monkeypatch.setenv("CDX_ADMIN_TOKEN", ADMIN_TOKEN)
    yield


def _rollback(client: TestClient, **kwargs):
    payload = {"reason": VALID_REASON, **kwargs}
    return client.post(
        "/api/v1/pxe/rollback",
        json=payload,
        headers=ADMIN_HEADERS,
    )


class TestFullRollback:
    def test_full_rollback_returns_202(self, client: TestClient):
        r = _rollback(client, pattern="full")
        assert r.status_code == 202
        data = r.json()
        assert data["pattern"] == "full"
        assert data["script_name"] == "01-full-rollback.sh"
        assert "01-full-rollback.sh" in data["command"]
        assert data["recorded"] is True
        assert "audit_id" in data

    def test_full_rollback_with_version(self, client: TestClient):
        r = _rollback(client, pattern="full", target_version="20260501")
        assert r.status_code == 202
        assert "--version 20260501" in r.json()["command"]


class TestProfileRollback:
    def test_profile_rollback_standard(self, client: TestClient):
        r = _rollback(client, pattern="profile", profile="standard")
        assert r.status_code == 202
        data = r.json()
        assert data["script_name"] == "02-profile-rollback.sh"
        assert "--profile standard" in data["command"]

    def test_profile_rollback_field(self, client: TestClient):
        r = _rollback(client, pattern="profile", profile="field")
        assert r.status_code == 202
        assert "--profile field" in r.json()["command"]

    def test_invalid_profile_returns_422(self, client: TestClient):
        r = _rollback(client, pattern="profile", profile="invalid")
        assert r.status_code == 422


class TestRingRollback:
    def test_ring_rollback_ring2(self, client: TestClient):
        r = _rollback(client, pattern="ring", ring="ring2")
        assert r.status_code == 202
        data = r.json()
        assert data["script_name"] == "03-ring-rollback.sh"
        assert "--ring ring2" in data["command"]

    def test_invalid_ring_returns_422(self, client: TestClient):
        r = _rollback(client, pattern="ring", ring="ring9")
        assert r.status_code == 422


class TestSiteRollback:
    def test_site_rollback(self, client: TestClient):
        r = _rollback(client, pattern="site", site="tokyo-hq", backup_pxe_ip="192.168.1.10")
        assert r.status_code == 202
        data = r.json()
        assert data["script_name"] == "04-site-rollback.sh"
        assert "--site tokyo-hq" in data["command"]
        assert "--backup-pxe 192.168.1.10" in data["command"]


class TestSingleRollback:
    def test_single_rollback_with_mac(self, client: TestClient):
        r = _rollback(client, pattern="single", device_mac="00:11:22:33:44:55")
        assert r.status_code == 202
        data = r.json()
        assert data["script_name"] == "05-single-rollback.sh"
        assert "--mac 00:11:22:33:44:55" in data["command"]


class TestAbort:
    def test_abort(self, client: TestClient):
        r = _rollback(client, pattern="abort")
        assert r.status_code == 202
        data = r.json()
        assert data["script_name"] == "06-abort.sh"
        assert "06-abort.sh" in data["command"]


class TestAuthAndValidation:
    def test_missing_auth_returns_401(self, client: TestClient):
        r = client.post("/api/v1/pxe/rollback", json={"pattern": "abort", "reason": VALID_REASON})
        assert r.status_code == 401

    def test_wrong_auth_returns_401(self, client: TestClient):
        bad_headers = {"Authorization": "Basic d3Jvbmc6d3Jvbmc="}  # wrong:wrong
        r = client.post(
            "/api/v1/pxe/rollback",
            json={"pattern": "abort", "reason": VALID_REASON},
            headers=bad_headers,
        )
        assert r.status_code == 401

    def test_reason_too_short_returns_422(self, client: TestClient):
        r = _rollback(client, pattern="abort", reason="short")
        assert r.status_code == 422

    def test_invalid_pattern_returns_422(self, client: TestClient):
        r = _rollback(client, pattern="invalid_pattern")
        assert r.status_code == 422
