"""Tests for PXE boot event recording API (Issue 0042 Phase 4.4).

Covers:
- POST /api/v1/pxe/events: bootstrap_complete, bootstrap_failed, other events
- Prometheus counter / histogram increments
- Auth failure paths (missing secret, wrong secret)
- Validation failure paths (invalid profile, invalid fingerprint length)
- token_issued counter increment via registration-tokens endpoint
- bootstrap_complete without duration_seconds
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from cdx_server.auth import BOOTSTRAP_SECRET_ENV
from cdx_server.obs.metrics import CDX_PXE_BOOT_TOTAL, CDX_PXE_PROVISIONING_SECONDS

BOOTSTRAP_SECRET = "unit-test-bootstrap-secret-do-not-use"
BOOTSTRAP_HEADERS = {"X-CDX-Bootstrap-Secret": BOOTSTRAP_SECRET}

# Valid fingerprint: 64 hex chars
VALID_FINGERPRINT = "a" * 64


def _counter_value(counter, **labels) -> float:
    """Read the current value of a labelled Prometheus Counter."""
    try:
        return counter.labels(**labels)._value.get()
    except Exception:
        return 0.0


def _histogram_count(histogram, **labels) -> float:
    """Read the _count of a labelled Prometheus Histogram."""
    try:
        child = histogram.labels(**labels)
        for sample in child._child_samples():
            if sample.name == "_count":
                return sample.value
        return 0.0
    except Exception:
        return 0.0


@pytest.fixture(autouse=True)
def _set_bootstrap_secret(monkeypatch):
    monkeypatch.setenv(BOOTSTRAP_SECRET_ENV, BOOTSTRAP_SECRET)
    yield


# ---------------------------------------------------------------------------
# POST /api/v1/pxe/events — happy paths
# ---------------------------------------------------------------------------


class TestRecordPXEEvent:
    def test_record_bootstrap_complete_increments_counter(self, client: TestClient):
        """bootstrap_complete increments cdx_pxe_boot_total and histogram."""
        before_counter = _counter_value(
            CDX_PXE_BOOT_TOTAL, profile="standard", event="bootstrap_complete"
        )
        before_hist = _histogram_count(CDX_PXE_PROVISIONING_SECONDS, profile="standard")

        response = client.post(
            "/api/v1/pxe/events",
            json={
                "event": "bootstrap_complete",
                "profile": "standard",
                "fingerprint": VALID_FINGERPRINT,
                "duration_seconds": 300.0,
            },
            headers=BOOTSTRAP_HEADERS,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["recorded"] is True
        assert data["event"] == "bootstrap_complete"

        after_counter = _counter_value(
            CDX_PXE_BOOT_TOTAL, profile="standard", event="bootstrap_complete"
        )
        after_hist = _histogram_count(CDX_PXE_PROVISIONING_SECONDS, profile="standard")

        assert after_counter == before_counter + 1
        assert after_hist == before_hist + 1

    def test_record_bootstrap_failed_increments_counter(self, client: TestClient):
        """bootstrap_failed increments counter and includes error_message in log."""
        before = _counter_value(
            CDX_PXE_BOOT_TOTAL, profile="field", event="bootstrap_failed"
        )

        response = client.post(
            "/api/v1/pxe/events",
            json={
                "event": "bootstrap_failed",
                "profile": "field",
                "fingerprint": VALID_FINGERPRINT,
                "error_message": "network timeout during package installation",
            },
            headers=BOOTSTRAP_HEADERS,
        )

        assert response.status_code == 200
        data = response.json()
        assert data["event"] == "bootstrap_failed"

        after = _counter_value(
            CDX_PXE_BOOT_TOTAL, profile="field", event="bootstrap_failed"
        )
        assert after == before + 1

    def test_bootstrap_complete_without_duration(self, client: TestClient):
        """bootstrap_complete without duration_seconds is valid; histogram not observed."""
        before_hist = _histogram_count(CDX_PXE_PROVISIONING_SECONDS, profile="kiosk")

        response = client.post(
            "/api/v1/pxe/events",
            json={
                "event": "bootstrap_complete",
                "profile": "kiosk",
                "fingerprint": VALID_FINGERPRINT,
            },
            headers=BOOTSTRAP_HEADERS,
        )

        assert response.status_code == 200

        after_hist = _histogram_count(CDX_PXE_PROVISIONING_SECONDS, profile="kiosk")
        # Histogram should NOT be incremented when duration is absent
        assert after_hist == before_hist

    def test_first_registration_event(self, client: TestClient):
        """first_registration event is recorded correctly."""
        before = _counter_value(
            CDX_PXE_BOOT_TOTAL, profile="standard", event="first_registration"
        )

        response = client.post(
            "/api/v1/pxe/events",
            json={
                "event": "first_registration",
                "profile": "standard",
                "fingerprint": VALID_FINGERPRINT,
            },
            headers=BOOTSTRAP_HEADERS,
        )

        assert response.status_code == 200
        after = _counter_value(
            CDX_PXE_BOOT_TOTAL, profile="standard", event="first_registration"
        )
        assert after == before + 1


# ---------------------------------------------------------------------------
# Auth failure paths
# ---------------------------------------------------------------------------


class TestPXEEventAuth:
    def test_missing_bootstrap_secret_returns_401(self, client: TestClient):
        """No auth header returns 401."""
        response = client.post(
            "/api/v1/pxe/events",
            json={
                "event": "bootstrap_complete",
                "profile": "standard",
                "fingerprint": VALID_FINGERPRINT,
            },
        )
        assert response.status_code == 401

    def test_wrong_bootstrap_secret_returns_401(self, client: TestClient):
        """Wrong secret value returns 401."""
        response = client.post(
            "/api/v1/pxe/events",
            json={
                "event": "bootstrap_complete",
                "profile": "standard",
                "fingerprint": VALID_FINGERPRINT,
            },
            headers={"X-CDX-Bootstrap-Secret": "totally-wrong-secret"},
        )
        assert response.status_code == 401


# ---------------------------------------------------------------------------
# Validation failure paths
# ---------------------------------------------------------------------------


class TestPXEEventValidation:
    def test_invalid_profile_returns_422(self, client: TestClient):
        """Profile not in (standard, field, kiosk) returns 422."""
        response = client.post(
            "/api/v1/pxe/events",
            json={
                "event": "bootstrap_complete",
                "profile": "admin",
                "fingerprint": VALID_FINGERPRINT,
            },
            headers=BOOTSTRAP_HEADERS,
        )
        assert response.status_code == 422

    def test_invalid_fingerprint_length_returns_422(self, client: TestClient):
        """Fingerprint shorter than 64 chars returns 422."""
        response = client.post(
            "/api/v1/pxe/events",
            json={
                "event": "bootstrap_complete",
                "profile": "standard",
                "fingerprint": "abc",
            },
            headers=BOOTSTRAP_HEADERS,
        )
        assert response.status_code == 422

    def test_fingerprint_too_long_returns_422(self, client: TestClient):
        """Fingerprint longer than 64 chars returns 422."""
        response = client.post(
            "/api/v1/pxe/events",
            json={
                "event": "bootstrap_complete",
                "profile": "standard",
                "fingerprint": "a" * 65,
            },
            headers=BOOTSTRAP_HEADERS,
        )
        assert response.status_code == 422

    def test_invalid_event_type_returns_422(self, client: TestClient):
        """Unknown event type returns 422."""
        response = client.post(
            "/api/v1/pxe/events",
            json={
                "event": "unknown_event",
                "profile": "standard",
                "fingerprint": VALID_FINGERPRINT,
            },
            headers=BOOTSTRAP_HEADERS,
        )
        assert response.status_code == 422

    def test_negative_duration_returns_422(self, client: TestClient):
        """Negative duration_seconds returns 422."""
        response = client.post(
            "/api/v1/pxe/events",
            json={
                "event": "bootstrap_complete",
                "profile": "standard",
                "fingerprint": VALID_FINGERPRINT,
                "duration_seconds": -1.0,
            },
            headers=BOOTSTRAP_HEADERS,
        )
        assert response.status_code == 422

    def test_error_message_too_long_returns_422(self, client: TestClient):
        """error_message exceeding 500 chars returns 422."""
        response = client.post(
            "/api/v1/pxe/events",
            json={
                "event": "bootstrap_failed",
                "profile": "standard",
                "fingerprint": VALID_FINGERPRINT,
                "error_message": "x" * 501,
            },
            headers=BOOTSTRAP_HEADERS,
        )
        assert response.status_code == 422


# ---------------------------------------------------------------------------
# token_issued via registration-tokens endpoint
# ---------------------------------------------------------------------------


class TestTokenIssuanceIncrementsCounter:
    def test_token_issuance_increments_pxe_counter(self, client: TestClient):
        """POST /api/v1/devices/registration-tokens increments token_issued counter."""
        before = _counter_value(
            CDX_PXE_BOOT_TOTAL, profile="standard", event="token_issued"
        )

        response = client.post(
            "/api/v1/devices/registration-tokens",
            json={"profile": "standard", "fingerprint": VALID_FINGERPRINT},
            headers=BOOTSTRAP_HEADERS,
        )

        assert response.status_code == 201
        after = _counter_value(
            CDX_PXE_BOOT_TOTAL, profile="standard", event="token_issued"
        )
        assert after == before + 1

    def test_token_issuance_field_profile_increments_counter(self, client: TestClient):
        """token_issued is profile-scoped; field profile increments field label."""
        before_field = _counter_value(
            CDX_PXE_BOOT_TOTAL, profile="field", event="token_issued"
        )
        before_standard = _counter_value(
            CDX_PXE_BOOT_TOTAL, profile="standard", event="token_issued"
        )

        response = client.post(
            "/api/v1/devices/registration-tokens",
            json={"profile": "field", "fingerprint": "b" * 64},
            headers=BOOTSTRAP_HEADERS,
        )

        assert response.status_code == 201
        after_field = _counter_value(
            CDX_PXE_BOOT_TOTAL, profile="field", event="token_issued"
        )
        after_standard = _counter_value(
            CDX_PXE_BOOT_TOTAL, profile="standard", event="token_issued"
        )
        assert after_field == before_field + 1
        assert after_standard == before_standard  # unchanged
