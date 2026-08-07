"""Tests for GET /api/v1/policy."""

from __future__ import annotations

import hashlib
import hmac


def _sign(secret: str, canonical: str) -> str:
    return hmac.new(secret.encode(), canonical.encode(), hashlib.sha256).hexdigest()


def _get_policy_signed(client, device: dict, bucket: int):
    """Build a signed GET /api/v1/policy request (empty body)."""
    empty_body_sha = hashlib.sha256(b"").hexdigest()
    canonical = "\n".join([device["device_id"], "policy", str(bucket), empty_body_sha])
    headers = {
        "X-CDX-Device-Id": device["device_id"],
        "X-CDX-Payload-Type": "policy",
        "X-CDX-Timestamp-Bucket": str(bucket),
        "X-CDX-Signature": _sign(device["shared_secret"], canonical),
    }
    return client.get("/api/v1/policy", headers=headers)


# ---------------------------------------------------------------------------
# Happy path
# ---------------------------------------------------------------------------


def test_policy_returns_200_for_registered_device(client, registered_device):
    response = _get_policy_signed(client, registered_device, bucket=100)
    assert response.status_code == 200, response.text


def test_policy_body_matches_standard_defaults(client, registered_device):
    response = _get_policy_signed(client, registered_device, bucket=100)
    data = response.json()
    assert data["profile"] == "standard"
    assert data["update_ring"] == "ring1"
    assert data["heartbeat_interval_seconds"] == 60
    assert data["inventory_interval_seconds"] == 3600
    assert data["policy_version"] >= 1


def test_policy_response_has_no_extra_fields(client, registered_device):
    response = _get_policy_signed(client, registered_device, bucket=100)
    data = response.json()
    expected_keys = {
        "profile",
        "update_ring",
        "heartbeat_interval_seconds",
        "inventory_interval_seconds",
        "policy_version",
    }
    assert set(data.keys()) == expected_keys


def test_policy_idempotent_same_bucket(client, registered_device):
    r1 = _get_policy_signed(client, registered_device, bucket=200)
    r2 = _get_policy_signed(client, registered_device, bucket=200)
    assert r1.status_code == 200
    assert r2.status_code == 200
    assert r1.json() == r2.json()


# ---------------------------------------------------------------------------
# Field profile
# ---------------------------------------------------------------------------


def test_policy_field_profile_ring2(client, registration_headers):
    """Devices with the 'field' profile receive ring2 policy."""
    device = {
        "device_id": "dev-field-001",
        "profile": "field",
        "hostname": "field-host",
        "shared_secret": "field-test-shared-secret-00000000",
    }
    client.post("/api/v1/devices/register", json=device, headers=registration_headers)
    response = _get_policy_signed(client, device, bucket=300)
    assert response.status_code == 200
    data = response.json()
    assert data["profile"] == "field"
    assert data["update_ring"] == "ring2"


# ---------------------------------------------------------------------------
# Auth failures
# ---------------------------------------------------------------------------


def test_policy_unknown_device_returns_401(client):
    ghost = {
        "device_id": "ghost-device",
        "shared_secret": "does-not-matter-000000000000000",
    }
    response = _get_policy_signed(client, ghost, bucket=400)
    assert response.status_code == 401


def test_policy_bad_signature_returns_401(client, registered_device):
    empty_body_sha = hashlib.sha256(b"").hexdigest()
    canonical = "\n".join([registered_device["device_id"], "policy", "500", empty_body_sha])
    bad_sig = _sign("wrong-secret-000000000000000000", canonical)
    headers = {
        "X-CDX-Device-Id": registered_device["device_id"],
        "X-CDX-Payload-Type": "policy",
        "X-CDX-Timestamp-Bucket": "500",
        "X-CDX-Signature": bad_sig,
    }
    response = client.get("/api/v1/policy", headers=headers)
    assert response.status_code == 401


def test_policy_missing_headers_returns_400(client, registered_device):
    response = client.get("/api/v1/policy")
    assert response.status_code == 400


def test_policy_wrong_payload_type_returns_400(client, registered_device):
    empty_body_sha = hashlib.sha256(b"").hexdigest()
    canonical = "\n".join([registered_device["device_id"], "heartbeat", "600", empty_body_sha])
    headers = {
        "X-CDX-Device-Id": registered_device["device_id"],
        "X-CDX-Payload-Type": "heartbeat",  # wrong type for this endpoint
        "X-CDX-Timestamp-Bucket": "600",
        "X-CDX-Signature": _sign(registered_device["shared_secret"], canonical),
    }
    response = client.get("/api/v1/policy", headers=headers)
    assert response.status_code == 400


def test_policy_returns_404_when_no_policy_for_profile(client, registered_device, storage):
    """404 is returned when the device's profile has no policy entry."""
    # Remove all policies so the storage returns None for any profile.
    storage._state.policies.clear()  # type: ignore[attr-defined]
    response = _get_policy_signed(client, registered_device, bucket=700)
    assert response.status_code == 404
    assert "No policy configured" in response.json()["detail"]
