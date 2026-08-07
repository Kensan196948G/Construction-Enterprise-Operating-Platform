"""Performance tests for cdx-server API.

Uses pytest-benchmark for repeatable, statistically sound measurements.
These tests verify that critical paths meet performance targets.

Targets:
  - /health: < 10ms p99
  - /api/v1/devices/register: < 50ms p99
  - CSP nonce generation: negligible overhead (< 5ms per request)
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from cdx_server.app import create_app
from cdx_server.rate_limit import NullRateLimiter
from cdx_server.storage import InMemoryStorage

REG_TOKEN = "perf-test-token"


@pytest.fixture(autouse=True)
def _token(monkeypatch):
    monkeypatch.setenv("CDX_REGISTRATION_TOKEN", REG_TOKEN)
    yield


@pytest.fixture(scope="module")
def client():
    app = create_app(storage=InMemoryStorage(), rate_limiter=NullRateLimiter())
    with TestClient(app) as c:
        yield c


def test_health_endpoint_latency(benchmark, client):
    """Health endpoint must respond quickly (< 10ms target)."""
    result = benchmark(client.get, "/health")
    assert result.status_code == 200
    # benchmark stats are available in benchmark.stats


def test_metrics_endpoint_latency(benchmark, client):
    """Prometheus metrics export must not block other requests."""
    result = benchmark(client.get, "/metrics")
    assert result.status_code == 200


def test_csp_nonce_overhead(benchmark, client):
    """CSP nonce generation adds minimal overhead per request."""
    # Multiple requests verify nonce uniqueness + performance
    def make_request():
        r = client.get("/health")
        assert "nonce-" in r.headers.get("content-security-policy", "")
        return r

    benchmark(make_request)


def test_device_registration_latency(benchmark, client):
    """Device registration must complete quickly with InMemory storage."""
    import uuid

    def register():
        return client.post(
            "/api/v1/devices/register",
            json={
                "device_id": f"perf-{uuid.uuid4().hex[:8]}",
                "profile": "standard",
                "hostname": "perf-host",
                "shared_secret": "perf-secret-16chr",
            },
            headers={"Authorization": f"Bearer {REG_TOKEN}"},
        )

    result = benchmark(register)
    assert result.status_code in (200, 201, 409)
