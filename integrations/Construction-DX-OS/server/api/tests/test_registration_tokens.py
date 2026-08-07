"""Tests for the Registration Token API (Issue 0042 Phase 4.3).

Covers:
- POST /api/v1/devices/registration-tokens (ephemeral token issuance)
- POST /api/v1/auth/rotate (long-lived device token rotation)
- Auth failure paths (missing secret, bad secret, 503 when env unset)
- Token expiry / double-consume semantics (via InMemoryStorage internals)
"""

from __future__ import annotations

import time

import pytest
from fastapi.testclient import TestClient

from cdx_server.auth import BOOTSTRAP_SECRET_ENV
from cdx_server.storage import InMemoryStorage

BOOTSTRAP_SECRET = "unit-test-bootstrap-secret-do-not-use"
BOOTSTRAP_HEADERS = {"X-CDX-Bootstrap-Secret": BOOTSTRAP_SECRET}


@pytest.fixture(autouse=True)
def _set_bootstrap_secret(monkeypatch):
    monkeypatch.setenv(BOOTSTRAP_SECRET_ENV, BOOTSTRAP_SECRET)
    yield


# ---------------------------------------------------------------------------
# POST /api/v1/devices/registration-tokens
# ---------------------------------------------------------------------------


class TestCreateRegistrationToken:
    def test_happy_path_standard(self, client: TestClient):
        response = client.post(
            "/api/v1/devices/registration-tokens",
            json={"profile": "standard", "fingerprint": "a" * 64},
            headers=BOOTSTRAP_HEADERS,
        )
        assert response.status_code == 201
        data = response.json()
        assert "token" in data
        assert len(data["token"]) > 20
        assert "expires_at" in data

    def test_happy_path_field(self, client: TestClient):
        response = client.post(
            "/api/v1/devices/registration-tokens",
            json={"profile": "field", "fingerprint": "b" * 64},
            headers=BOOTSTRAP_HEADERS,
        )
        assert response.status_code == 201

    def test_happy_path_kiosk(self, client: TestClient):
        response = client.post(
            "/api/v1/devices/registration-tokens",
            json={"profile": "kiosk", "fingerprint": "c" * 64},
            headers=BOOTSTRAP_HEADERS,
        )
        assert response.status_code == 201

    def test_invalid_profile(self, client: TestClient):
        response = client.post(
            "/api/v1/devices/registration-tokens",
            json={"profile": "admin", "fingerprint": "a" * 64},
            headers=BOOTSTRAP_HEADERS,
        )
        assert response.status_code == 422

    def test_fingerprint_too_short(self, client: TestClient):
        response = client.post(
            "/api/v1/devices/registration-tokens",
            json={"profile": "standard", "fingerprint": "abc"},
            headers=BOOTSTRAP_HEADERS,
        )
        assert response.status_code == 422

    def test_fingerprint_non_hex(self, client: TestClient):
        response = client.post(
            "/api/v1/devices/registration-tokens",
            json={"profile": "standard", "fingerprint": "g" * 64},
            headers=BOOTSTRAP_HEADERS,
        )
        assert response.status_code == 422

    def test_missing_bootstrap_secret_header(self, client: TestClient):
        response = client.post(
            "/api/v1/devices/registration-tokens",
            json={"profile": "standard", "fingerprint": "a" * 64},
        )
        assert response.status_code == 401

    def test_wrong_bootstrap_secret(self, client: TestClient):
        response = client.post(
            "/api/v1/devices/registration-tokens",
            json={"profile": "standard", "fingerprint": "a" * 64},
            headers={"X-CDX-Bootstrap-Secret": "wrong-secret"},
        )
        assert response.status_code == 401

    def test_bootstrap_secret_unset_returns_503(self, client: TestClient, monkeypatch):
        monkeypatch.delenv(BOOTSTRAP_SECRET_ENV, raising=False)
        response = client.post(
            "/api/v1/devices/registration-tokens",
            json={"profile": "standard", "fingerprint": "a" * 64},
            headers=BOOTSTRAP_HEADERS,
        )
        assert response.status_code == 503

    def test_tokens_are_unique(self, client: TestClient):
        payload = {"profile": "standard", "fingerprint": "a" * 64}
        r1 = client.post("/api/v1/devices/registration-tokens", json=payload, headers=BOOTSTRAP_HEADERS)
        r2 = client.post("/api/v1/devices/registration-tokens", json=payload, headers=BOOTSTRAP_HEADERS)
        assert r1.json()["token"] != r2.json()["token"]

    def test_extra_fields_rejected(self, client: TestClient):
        response = client.post(
            "/api/v1/devices/registration-tokens",
            json={"profile": "standard", "fingerprint": "a" * 64, "extra": "bad"},
            headers=BOOTSTRAP_HEADERS,
        )
        assert response.status_code == 422


# ---------------------------------------------------------------------------
# InMemoryStorage: consume_registration_token semantics
# ---------------------------------------------------------------------------


class TestConsumeRegistrationToken:
    @pytest.mark.anyio
    async def test_consume_valid_token(self):
        storage = InMemoryStorage()
        record = await storage.create_registration_token(profile="standard", fingerprint="a" * 64)
        consumed = await storage.consume_registration_token(record.token)
        assert consumed is not None
        assert consumed.consumed_at is not None

    @pytest.mark.anyio
    async def test_double_consume_returns_none(self):
        storage = InMemoryStorage()
        record = await storage.create_registration_token(profile="standard", fingerprint="a" * 64)
        await storage.consume_registration_token(record.token)
        second = await storage.consume_registration_token(record.token)
        assert second is None

    @pytest.mark.anyio
    async def test_unknown_token_returns_none(self):
        storage = InMemoryStorage()
        result = await storage.consume_registration_token("no-such-token")
        assert result is None

    @pytest.mark.anyio
    async def test_expired_token_returns_none(self):
        storage = InMemoryStorage()
        record = await storage.create_registration_token(
            profile="standard", fingerprint="a" * 64, ttl_seconds=0
        )
        # Force expiry by sleeping 1s (ttl=0 means already expired by the time we check)
        time.sleep(0.01)
        result = await storage.consume_registration_token(record.token)
        assert result is None


# ---------------------------------------------------------------------------
# POST /api/v1/auth/rotate
# ---------------------------------------------------------------------------


class TestRotateDeviceToken:
    def _sign_headers(
        self,
        client: TestClient,
        device_id: str,
        shared_secret: str,
        body_bytes: bytes,
        payload_type: str = "token-rotate",
    ) -> dict[str, str]:
        import hashlib
        import hmac

        bucket = int(time.time()) // 60
        body_sha = hashlib.sha256(body_bytes).hexdigest()
        canonical = "\n".join([device_id, payload_type, str(bucket), body_sha])
        sig = hmac.new(shared_secret.encode(), canonical.encode(), hashlib.sha256).hexdigest()
        return {
            "X-CDX-Device-Id": device_id,
            "X-CDX-Payload-Type": payload_type,
            "X-CDX-Timestamp-Bucket": str(bucket),
            "X-CDX-Signature": sig,
            "Content-Type": "application/json",
        }

    def test_rotate_happy_path(
        self, client: TestClient, registered_device: dict[str, str]
    ):
        import json

        device_id = registered_device["device_id"]
        shared_secret = registered_device["shared_secret"]
        body = json.dumps({"device_id": device_id}).encode()
        headers = self._sign_headers(client, device_id, shared_secret, body)
        response = client.post("/api/v1/auth/rotate", content=body, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "expires_at" in data

    def test_rotate_token_changes_on_second_call(
        self, client: TestClient, registered_device: dict[str, str]
    ):
        import json

        device_id = registered_device["device_id"]
        shared_secret = registered_device["shared_secret"]

        def do_rotate():
            body = json.dumps({"device_id": device_id}).encode()
            headers = self._sign_headers(client, device_id, shared_secret, body)
            r = client.post("/api/v1/auth/rotate", content=body, headers=headers)
            assert r.status_code == 200
            return r.json()["token"]

        t1 = do_rotate()
        t2 = do_rotate()
        assert t1 != t2

    def test_rotate_bad_signature(self, client: TestClient, registered_device: dict[str, str]):
        import json

        device_id = registered_device["device_id"]
        body = json.dumps({"device_id": device_id}).encode()
        headers = self._sign_headers(client, device_id, "wrong-secret", body)
        response = client.post("/api/v1/auth/rotate", content=body, headers=headers)
        assert response.status_code == 401

    def test_rotate_device_id_mismatch(
        self, client: TestClient, registered_device: dict[str, str]
    ):
        import json

        device_id = registered_device["device_id"]
        shared_secret = registered_device["shared_secret"]
        body = json.dumps({"device_id": "other-device"}).encode()
        headers = self._sign_headers(client, device_id, shared_secret, body)
        response = client.post("/api/v1/auth/rotate", content=body, headers=headers)
        assert response.status_code == 403

    def test_rotate_unknown_device(self, client: TestClient):
        import json

        device_id = "ghost-device-999"
        shared_secret = "some-secret"
        body = json.dumps({"device_id": device_id}).encode()
        headers = self._sign_headers(client, device_id, shared_secret, body)
        response = client.post("/api/v1/auth/rotate", content=body, headers=headers)
        assert response.status_code == 401

    def test_rotate_missing_signature_headers(self, client: TestClient, registered_device: dict):
        import json

        body = json.dumps({"device_id": registered_device["device_id"]}).encode()
        response = client.post(
            "/api/v1/auth/rotate",
            content=body,
            headers={"Content-Type": "application/json"},
        )
        assert response.status_code == 400
