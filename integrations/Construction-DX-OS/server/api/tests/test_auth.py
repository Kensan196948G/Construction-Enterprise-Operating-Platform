"""Tests for auth-rejection behaviour on signed endpoints."""

import hashlib
import hmac
import json


def _sign(secret: str, device_id: str, payload_type: str, bucket: int, body: bytes) -> str:
    canonical = "\n".join([device_id, payload_type, str(bucket), hashlib.sha256(body).hexdigest()])
    return hmac.new(secret.encode(), canonical.encode(), hashlib.sha256).hexdigest()


def _signed_headers(
    *, secret: str, device_id: str, payload_type: str, bucket: int, body: bytes
) -> dict[str, str]:
    return {
        "Content-Type": "application/json",
        "X-CDX-Device-Id": device_id,
        "X-CDX-Payload-Type": payload_type,
        "X-CDX-Timestamp-Bucket": str(bucket),
        "X-CDX-Signature": _sign(secret, device_id, payload_type, bucket, body),
    }


def test_heartbeat_rejected_without_headers(client):
    response = client.post("/api/v1/heartbeat", content=b"{}")
    assert response.status_code == 400


def test_heartbeat_rejected_for_unknown_device(client):
    body = json.dumps({"device_id": "ghost"}).encode()
    headers = _signed_headers(
        secret="x" * 16,
        device_id="ghost",
        payload_type="heartbeat",
        bucket=60,
        body=body,
    )
    response = client.post("/api/v1/heartbeat", content=body, headers=headers)
    assert response.status_code == 401


def test_heartbeat_rejected_on_bad_signature(client, registered_device):
    body = json.dumps(
        {
            "device_id": registered_device["device_id"],
            "agent_version": "0.2.0",
            "uptime_seconds": 1,
            "sent_at": "2026-04-15T00:00:00+00:00",
            "kind": "heartbeat",
        }
    ).encode()
    headers = {
        "Content-Type": "application/json",
        "X-CDX-Device-Id": registered_device["device_id"],
        "X-CDX-Payload-Type": "heartbeat",
        "X-CDX-Timestamp-Bucket": "60",
        "X-CDX-Signature": "00" * 32,
    }
    response = client.post("/api/v1/heartbeat", content=body, headers=headers)
    assert response.status_code == 401


def test_heartbeat_rejects_mismatched_payload_type_header(client, registered_device):
    body = json.dumps({"device_id": registered_device["device_id"]}).encode()
    headers = _signed_headers(
        secret=registered_device["shared_secret"],
        device_id=registered_device["device_id"],
        payload_type="inventory",
        bucket=60,
        body=body,
    )
    response = client.post("/api/v1/heartbeat", content=body, headers=headers)
    assert response.status_code == 400


def test_bucket_header_must_be_integer(client, registered_device):
    body = json.dumps({"device_id": registered_device["device_id"]}).encode()
    headers = {
        "Content-Type": "application/json",
        "X-CDX-Device-Id": registered_device["device_id"],
        "X-CDX-Payload-Type": "heartbeat",
        "X-CDX-Timestamp-Bucket": "not-a-number",
        "X-CDX-Signature": "00",
    }
    response = client.post("/api/v1/heartbeat", content=body, headers=headers)
    assert response.status_code == 400
