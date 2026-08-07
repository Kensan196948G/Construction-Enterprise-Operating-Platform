"""E2E contract: 429 + Retry-After header when a device overruns capacity.

Uses a deliberately tight policy (capacity=2, no refill within the test) so
the third legitimate, HMAC-signed heartbeat is rejected. Proves that rate
limiting happens AFTER authentication (device_id is known), not before.
"""

from __future__ import annotations

import hashlib
import hmac
import json

import pytest
from fastapi.testclient import TestClient

from cdx_server.app import create_app
from cdx_server.rate_limit import InMemoryRateLimiter, RateLimitPolicy
from cdx_server.storage import InMemoryStorage
from tests.conftest import REGISTRATION_TOKEN


class _FrozenClock:
    """Frozen at t=0.0 — drives ``elapsed`` to exactly zero inside ``check``
    so the capacity is a hard ceiling in this test. The ``refill_per_second``
    values in the policies below are irrelevant under this clock; they only
    exist to satisfy ``RateLimitPolicy``'s positive-value invariant.
    """

    def __call__(self) -> float:
        return 0.0


@pytest.fixture
def tight_client():
    storage = InMemoryStorage()
    limiter = InMemoryRateLimiter(
        {
            "heartbeat": RateLimitPolicy(capacity=2, refill_per_second=0.01),
            "inventory": RateLimitPolicy(capacity=2, refill_per_second=0.01),
        },
        time_source=_FrozenClock(),
    )
    app = create_app(storage=storage, rate_limiter=limiter)
    return TestClient(app)


def _register(client: TestClient) -> dict[str, str]:
    device = {
        "device_id": "dev-rate-limit-001",
        "profile": "standard",
        "hostname": "rate-test",
        "shared_secret": "rate-test-shared-secret-0000000000",
    }
    response = client.post(
        "/api/v1/devices/register",
        json=device,
        headers={"Authorization": f"Bearer {REGISTRATION_TOKEN}"},
    )
    assert response.status_code == 200, response.text
    return device


def _signed_heartbeat(client: TestClient, device: dict[str, str], bucket: int):
    body_obj = {
        "device_id": device["device_id"],
        "agent_version": "0.2.0",
        "uptime_seconds": 1,
        "sent_at": "2026-04-15T00:00:00+00:00",
        "kind": "heartbeat",
    }
    body = json.dumps(body_obj).encode()
    canonical = "\n".join(
        [device["device_id"], "heartbeat", str(bucket), hashlib.sha256(body).hexdigest()]
    )
    sig = hmac.new(device["shared_secret"].encode(), canonical.encode(), hashlib.sha256).hexdigest()
    return client.post(
        "/api/v1/heartbeat",
        content=body,
        headers={
            "Content-Type": "application/json",
            "X-CDX-Device-Id": device["device_id"],
            "X-CDX-Payload-Type": "heartbeat",
            "X-CDX-Timestamp-Bucket": str(bucket),
            "X-CDX-Signature": sig,
        },
    )


def test_third_heartbeat_returns_429_with_retry_after(tight_client: TestClient):
    device = _register(tight_client)

    # capacity=2 → two accepted.
    r1 = _signed_heartbeat(tight_client, device, bucket=60)
    assert r1.status_code == 200, r1.text
    r2 = _signed_heartbeat(tight_client, device, bucket=120)
    assert r2.status_code == 200, r2.text

    # third rejected with 429 + integer Retry-After.
    r3 = _signed_heartbeat(tight_client, device, bucket=180)
    assert r3.status_code == 429, r3.text
    retry_after = r3.headers.get("Retry-After")
    assert retry_after is not None
    assert retry_after.isdigit() and int(retry_after) >= 1


def test_rate_limit_metric_is_incremented(tight_client: TestClient):
    device = _register(tight_client)
    for bucket in (60, 120):
        assert _signed_heartbeat(tight_client, device, bucket).status_code == 200
    assert _signed_heartbeat(tight_client, device, bucket=180).status_code == 429

    metrics = tight_client.get("/metrics").text
    # Series existence + label; counter body is free-form prometheus text.
    assert 'cdx_rate_limit_exceeded_total{endpoint="heartbeat"}' in metrics


def test_rate_limit_is_per_device(tight_client: TestClient):
    """A second device shares the limiter instance but has its own bucket."""
    dev1 = _register(tight_client)
    # Pre-drain dev1 to ensure dev2 is insulated even when dev1 is already 429.
    for bucket in (60, 120):
        assert _signed_heartbeat(tight_client, dev1, bucket).status_code == 200
    assert _signed_heartbeat(tight_client, dev1, bucket=180).status_code == 429

    # Register a second device and send one — must still succeed.
    dev2 = {
        "device_id": "dev-rate-limit-002",
        "profile": "standard",
        "hostname": "rate-test-2",
        "shared_secret": "rate-test-shared-secret-1111111111",
    }
    tight_client.post(
        "/api/v1/devices/register",
        json=dev2,
        headers={"Authorization": f"Bearer {REGISTRATION_TOKEN}"},
    )
    r = _signed_heartbeat(tight_client, dev2, bucket=60)
    assert r.status_code == 200, r.text


# ---------------------------------------------------------------------------
# Inventory rate-limit coverage (router lines 33-39)
# ---------------------------------------------------------------------------


def _signed_inventory(client: TestClient, device: dict[str, str], bucket: int):
    body_obj = {
        "device_id": device["device_id"],
        "hostname": "test-host",
        "cpu": "x86_64",
        "cpu_count": 4,
        "memory_bytes": 8 * 1024 * 1024 * 1024,
        "os_version": "Debian GNU/Linux 13",
        "kernel_version": "6.9.0-1-amd64",
        "timezone": "JST",
        "collected_at": "2026-04-22T00:00:00+0900",
    }
    body = json.dumps(body_obj).encode()
    canonical = "\n".join(
        [device["device_id"], "inventory", str(bucket), hashlib.sha256(body).hexdigest()]
    )
    sig = hmac.new(device["shared_secret"].encode(), canonical.encode(), hashlib.sha256).hexdigest()
    return client.post(
        "/api/v1/inventory",
        content=body,
        headers={
            "Content-Type": "application/json",
            "X-CDX-Device-Id": device["device_id"],
            "X-CDX-Payload-Type": "inventory",
            "X-CDX-Timestamp-Bucket": str(bucket),
            "X-CDX-Signature": sig,
        },
    )


def test_third_inventory_returns_429_with_retry_after(tight_client: TestClient):
    device = _register(tight_client)

    r1 = _signed_inventory(tight_client, device, bucket=3600)
    assert r1.status_code == 200, r1.text
    r2 = _signed_inventory(tight_client, device, bucket=7200)
    assert r2.status_code == 200, r2.text

    r3 = _signed_inventory(tight_client, device, bucket=10800)
    assert r3.status_code == 429, r3.text
    retry_after = r3.headers.get("Retry-After")
    assert retry_after is not None
    assert retry_after.isdigit() and int(retry_after) >= 1
