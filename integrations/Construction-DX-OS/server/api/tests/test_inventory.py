"""Tests for POST /api/v1/inventory."""

import hashlib
import hmac
import json

import pytest


def _sign(secret, canonical):
    return hmac.new(secret.encode(), canonical.encode(), hashlib.sha256).hexdigest()


def _post_signed(client, device, bucket, body_obj):
    body = json.dumps(body_obj).encode()
    canonical = "\n".join(
        [device["device_id"], "inventory", str(bucket), hashlib.sha256(body).hexdigest()]
    )
    headers = {
        "Content-Type": "application/json",
        "X-CDX-Device-Id": device["device_id"],
        "X-CDX-Payload-Type": "inventory",
        "X-CDX-Timestamp-Bucket": str(bucket),
        "X-CDX-Signature": _sign(device["shared_secret"], canonical),
    }
    return client.post("/api/v1/inventory", content=body, headers=headers)


def _inv_body(device_id: str) -> dict:
    return {
        "device_id": device_id,
        "hostname": "host-1",
        "cpu": "x86_64",
        "cpu_count": 8,
        "memory_bytes": 16 * 1024 * 1024 * 1024,
        "os_version": "Debian GNU/Linux 13 (trixie)",
        "kernel_version": "6.9.0-1-amd64",
        "timezone": "JST",
        "collected_at": "2026-04-15T00:00:00+0900",
    }


@pytest.mark.asyncio
async def test_inventory_accepts_valid_payload(client, registered_device, storage):
    body = _inv_body(registered_device["device_id"])
    response = _post_signed(client, registered_device, bucket=3600, body_obj=body)
    assert response.status_code == 200
    assert response.json()["duplicate"] is False
    assert await storage.count_inventories() == 1


@pytest.mark.asyncio
async def test_inventory_idempotency_same_hour(client, registered_device, storage):
    body = _inv_body(registered_device["device_id"])
    _post_signed(client, registered_device, bucket=7200, body_obj=body)
    response = _post_signed(client, registered_device, bucket=7200, body_obj=body)
    assert response.json()["duplicate"] is True
    assert await storage.count_inventories() == 1


@pytest.mark.asyncio
async def test_inventory_different_buckets_are_distinct(client, registered_device, storage):
    body = _inv_body(registered_device["device_id"])
    _post_signed(client, registered_device, bucket=3600, body_obj=body)
    _post_signed(client, registered_device, bucket=7200, body_obj=body)
    assert await storage.count_inventories() == 2


def test_inventory_rejects_body_device_id_mismatch(client, registered_device):
    body = _inv_body("other-device")
    response = _post_signed(client, registered_device, bucket=3600, body_obj=body)
    assert response.status_code == 400


def test_inventory_rejects_malformed_json(client, registered_device):
    bad_body = b"not json"
    canonical = "\n".join(
        [
            registered_device["device_id"],
            "inventory",
            "3600",
            hashlib.sha256(bad_body).hexdigest(),
        ]
    )
    headers = {
        "Content-Type": "application/json",
        "X-CDX-Device-Id": registered_device["device_id"],
        "X-CDX-Payload-Type": "inventory",
        "X-CDX-Timestamp-Bucket": "3600",
        "X-CDX-Signature": _sign(registered_device["shared_secret"], canonical),
    }
    response = client.post("/api/v1/inventory", content=bad_body, headers=headers)
    assert response.status_code == 400


def test_inventory_rejects_schema_invalid_payload(client, registered_device):
    bad_body = json.dumps({"device_id": registered_device["device_id"], "bad_field": 999}).encode()
    canonical = "\n".join(
        [
            registered_device["device_id"],
            "inventory",
            "3600",
            hashlib.sha256(bad_body).hexdigest(),
        ]
    )
    headers = {
        "Content-Type": "application/json",
        "X-CDX-Device-Id": registered_device["device_id"],
        "X-CDX-Payload-Type": "inventory",
        "X-CDX-Timestamp-Bucket": "3600",
        "X-CDX-Signature": _sign(registered_device["shared_secret"], canonical),
    }
    response = client.post("/api/v1/inventory", content=bad_body, headers=headers)
    assert response.status_code == 422
