"""Tests for POST /api/v1/heartbeat."""

import hashlib
import hmac
import json

import pytest


def _sign(secret, canonical):
    return hmac.new(secret.encode(), canonical.encode(), hashlib.sha256).hexdigest()


def _post_signed(client, device, bucket, body_obj):
    body = json.dumps(body_obj).encode()
    canonical = "\n".join(
        [device["device_id"], "heartbeat", str(bucket), hashlib.sha256(body).hexdigest()]
    )
    headers = {
        "Content-Type": "application/json",
        "X-CDX-Device-Id": device["device_id"],
        "X-CDX-Payload-Type": "heartbeat",
        "X-CDX-Timestamp-Bucket": str(bucket),
        "X-CDX-Signature": _sign(device["shared_secret"], canonical),
    }
    return client.post("/api/v1/heartbeat", content=body, headers=headers)


def _hb_body(device_id: str) -> dict:
    return {
        "device_id": device_id,
        "agent_version": "0.2.0",
        "uptime_seconds": 12345,
        "sent_at": "2026-04-15T00:00:00+00:00",
        "kind": "heartbeat",
    }


@pytest.mark.asyncio
async def test_heartbeat_accepts_valid_payload(client, registered_device, storage):
    body = _hb_body(registered_device["device_id"])
    response = _post_signed(client, registered_device, bucket=60, body_obj=body)
    assert response.status_code == 200
    data = response.json()
    assert data["accepted"] is True
    assert data["duplicate"] is False
    assert await storage.count_heartbeats() == 1


@pytest.mark.asyncio
async def test_heartbeat_is_idempotent_within_same_bucket(client, registered_device, storage):
    body = _hb_body(registered_device["device_id"])
    first = _post_signed(client, registered_device, bucket=120, body_obj=body)
    second = _post_signed(client, registered_device, bucket=120, body_obj=body)
    assert first.json()["duplicate"] is False
    assert second.json()["duplicate"] is True
    assert await storage.count_heartbeats() == 1


def test_heartbeat_rejects_body_device_id_mismatch(client, registered_device):
    body = _hb_body("other-device")
    response = _post_signed(client, registered_device, bucket=180, body_obj=body)
    assert response.status_code == 400


def test_heartbeat_rejects_malformed_json(client, registered_device):
    bad_body = b"not json"
    canonical = "\n".join(
        [
            registered_device["device_id"],
            "heartbeat",
            "240",
            hashlib.sha256(bad_body).hexdigest(),
        ]
    )
    headers = {
        "Content-Type": "application/json",
        "X-CDX-Device-Id": registered_device["device_id"],
        "X-CDX-Payload-Type": "heartbeat",
        "X-CDX-Timestamp-Bucket": "240",
        "X-CDX-Signature": _sign(registered_device["shared_secret"], canonical),
    }
    response = client.post("/api/v1/heartbeat", content=bad_body, headers=headers)
    assert response.status_code == 400


def test_heartbeat_rejects_schema_invalid_payload(client, registered_device):
    bad_body = json.dumps({"device_id": registered_device["device_id"], "bad": 1}).encode()
    canonical = "\n".join(
        [
            registered_device["device_id"],
            "heartbeat",
            "300",
            hashlib.sha256(bad_body).hexdigest(),
        ]
    )
    headers = {
        "Content-Type": "application/json",
        "X-CDX-Device-Id": registered_device["device_id"],
        "X-CDX-Payload-Type": "heartbeat",
        "X-CDX-Timestamp-Bucket": "300",
        "X-CDX-Signature": _sign(registered_device["shared_secret"], canonical),
    }
    response = client.post("/api/v1/heartbeat", content=bad_body, headers=headers)
    assert response.status_code == 422
