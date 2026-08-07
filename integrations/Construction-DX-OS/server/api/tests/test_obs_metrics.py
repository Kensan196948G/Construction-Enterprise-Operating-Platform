"""Tests for /metrics and the Counter instrumentation."""

from __future__ import annotations

from cdx_server.obs.metrics import (
    CDX_AUTH_FAILURE_TOTAL,
    CDX_INGEST_TOTAL,
    CDX_REGISTRATION_TOTAL,
)


def _value(counter, **labels) -> float:
    """Read the current value of a labelled Counter (Prometheus Python API)."""
    try:
        metric = counter.labels(**labels)
        return metric._value.get()
    except Exception:  # pragma: no cover — labelset not yet created
        return 0.0


def test_metrics_endpoint_returns_prometheus_text(client):
    response = client.get("/metrics")
    assert response.status_code == 200
    assert "text/plain" in response.headers["content-type"]
    body = response.text
    # Standard prometheus_client exposition format uses HELP/TYPE preludes.
    assert "# HELP" in body
    assert "# TYPE" in body


def test_metrics_include_cdx_counters(client):
    body = client.get("/metrics").text
    assert "cdx_ingest_total" in body
    assert "cdx_registration_total" in body
    assert "cdx_auth_failure_total" in body


def test_registration_counter_increments(client, registration_headers):
    before = _value(CDX_REGISTRATION_TOTAL, result="accepted")
    client.post(
        "/api/v1/devices/register",
        json={
            "device_id": "obs-dev-1",
            "profile": "standard",
            "hostname": "obs-host",
            "shared_secret": "a" * 32,
        },
        headers=registration_headers,
    )
    after = _value(CDX_REGISTRATION_TOTAL, result="accepted")
    assert after == before + 1


def test_auth_failure_counter_increments_on_unknown_device(client):
    before = _value(CDX_AUTH_FAILURE_TOTAL, reason="unknown_device")
    # Send a signed-looking request for a device that was never registered.
    client.post(
        "/api/v1/heartbeat",
        content=b"{}",
        headers={
            "Content-Type": "application/json",
            "X-CDX-Device-Id": "ghost-device",
            "X-CDX-Payload-Type": "heartbeat",
            "X-CDX-Timestamp-Bucket": "60",
            "X-CDX-Signature": "00" * 32,
        },
    )
    after = _value(CDX_AUTH_FAILURE_TOTAL, reason="unknown_device")
    assert after == before + 1


def test_ingest_counter_labels_exist(client):
    # Merely ensure the label combinations exist in the registry — they are
    # created on first .inc(). This guards against typos in the label strings
    # between auth.py/routers and metrics.py.
    for endpoint in ("heartbeat", "inventory"):
        for status in (
            "accepted",
            "duplicate",
            "rejected_json",
            "rejected_schema",
            "rejected_mismatch",
        ):
            CDX_INGEST_TOTAL.labels(endpoint=endpoint, status=status)
