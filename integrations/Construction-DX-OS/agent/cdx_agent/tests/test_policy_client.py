"""Tests for cdx_agent.policy.PolicyClient."""

from __future__ import annotations

import httpx
import pytest

from cdx_agent import sign as sign_mod
from cdx_agent.policy import (
    DEFAULT_HEARTBEAT_INTERVAL_SECONDS,
    DEFAULT_INVENTORY_INTERVAL_SECONDS,
    POLICY_PAYLOAD_TYPE,
    PolicyClient,
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _make_policy_response(*, status_code: int = 200, body: dict | None = None) -> httpx.Response:
    if body is None:
        body = {
            "profile": "standard",
            "update_ring": "ring1",
            "heartbeat_interval_seconds": 60,
            "inventory_interval_seconds": 3600,
            "policy_version": 1,
        }
    return httpx.Response(status_code=status_code, json=body)


class _MockSession:
    """Minimal httpx GET mock with request capture."""

    def __init__(self, response: httpx.Response):
        self._response = response
        self.captured_url: str | None = None
        self.captured_headers: dict[str, str] | None = None

    def get(self, url: str, *, headers: dict[str, str]) -> httpx.Response:
        self.captured_url = url
        self.captured_headers = headers
        return self._response


def _client_with(response: httpx.Response, *, device_id: str = "dev-001", secret: str = "test-secret-000000000000000000"):
    session = _MockSession(response)
    client = PolicyClient(
        base_url="http://cdx.test/api/v1",
        device_id=device_id,
        shared_secret=secret,
        session=session,
        clock=lambda: 1_000_000.0,  # deterministic bucket
    )
    return client, session


# ---------------------------------------------------------------------------
# Happy path
# ---------------------------------------------------------------------------


def test_fetch_returns_ok_on_200():
    client, _ = _client_with(_make_policy_response())
    result = client.fetch()
    assert result.ok is True
    assert result.status_code == 200


def test_fetch_populates_policy_fields():
    client, _ = _client_with(_make_policy_response())
    result = client.fetch()
    p = result.policy
    assert p is not None
    assert p.profile == "standard"
    assert p.update_ring == "ring1"
    assert p.heartbeat_interval_seconds == 60
    assert p.inventory_interval_seconds == 3600
    assert p.policy_version == 1


def test_fetch_sends_correct_url():
    client, session = _client_with(_make_policy_response())
    client.fetch()
    assert session.captured_url == "http://cdx.test/api/v1/policy"


def test_fetch_sends_required_identity_headers():
    client, session = _client_with(_make_policy_response())
    client.fetch()
    headers = session.captured_headers
    assert "X-CDX-Device-Id" in headers
    assert "X-CDX-Payload-Type" in headers
    assert "X-CDX-Timestamp-Bucket" in headers
    assert "X-CDX-Signature" in headers
    assert headers["X-CDX-Payload-Type"] == POLICY_PAYLOAD_TYPE


def test_fetch_signature_is_hmac_of_empty_body():
    """The HMAC canonical string for a policy request uses SHA-256 of empty bytes."""
    secret = "test-secret-000000000000000000"
    device_id = "dev-sig-test"
    fixed_clock = 1_000_000.0

    client, session = _client_with(
        _make_policy_response(), device_id=device_id, secret=secret
    )
    client.fetch()

    bucket = sign_mod.bucket_for(POLICY_PAYLOAD_TYPE, fixed_clock)
    canonical = sign_mod.canonical_string(
        device_id=device_id,
        payload_type=POLICY_PAYLOAD_TYPE,
        timestamp_bucket=bucket,
        body_bytes=b"",
    )
    expected_sig = sign_mod.sign(secret, canonical)
    assert session.captured_headers["X-CDX-Signature"] == expected_sig


# ---------------------------------------------------------------------------
# Failure paths
# ---------------------------------------------------------------------------


def test_fetch_returns_failure_on_401():
    client, _ = _client_with(_make_policy_response(status_code=401, body={"detail": "Unauthorized"}))
    result = client.fetch()
    assert result.ok is False
    assert result.status_code == 401
    assert result.policy is None


def test_fetch_returns_failure_on_404():
    client, _ = _client_with(_make_policy_response(status_code=404, body={"detail": "Not found"}))
    result = client.fetch()
    assert result.ok is False
    assert result.status_code == 404


def test_fetch_returns_failure_on_transport_error():
    class _BrokenSession:
        def get(self, url, *, headers):
            raise httpx.ConnectError("connection refused")

    client = PolicyClient(
        base_url="http://nowhere.test/api/v1",
        device_id="dev-001",
        shared_secret="test-secret-000000000000000000",
        session=_BrokenSession(),
    )
    result = client.fetch()
    assert result.ok is False
    assert result.status_code == 0


def test_fetch_returns_failure_on_malformed_json():
    broken_body = {"profile": "standard"}  # missing required fields
    client, _ = _client_with(_make_policy_response(body=broken_body))
    result = client.fetch()
    assert result.ok is False


# ---------------------------------------------------------------------------
# Constructor validation
# ---------------------------------------------------------------------------


def test_empty_device_id_raises():
    with pytest.raises(ValueError, match="device_id"):
        PolicyClient(base_url="http://x", device_id="", shared_secret="s")


def test_empty_secret_raises():
    with pytest.raises(ValueError, match="shared_secret"):
        PolicyClient(base_url="http://x", device_id="dev", shared_secret="")


# ---------------------------------------------------------------------------
# Default constants
# ---------------------------------------------------------------------------


def test_default_intervals_match_server_defaults():
    assert DEFAULT_HEARTBEAT_INTERVAL_SECONDS == 60
    assert DEFAULT_INVENTORY_INTERVAL_SECONDS == 3600
