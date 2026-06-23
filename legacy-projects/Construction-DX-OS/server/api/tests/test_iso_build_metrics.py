"""Tests for the ISO build Prometheus metrics (Issue 0022 Acceptance Criteria).

Phase 9 (Issue #4): Updated to use async PostgresStorage with aiosqlite.

Asserts that ``cdx_iso_build_total{profile,status}`` and
``cdx_iso_build_audit_total{action}`` increment on the appropriate
state transitions, exposed at /metrics. The Counter values are read
through the same /metrics endpoint operators will scrape, so the test
is end-to-end.
"""

from __future__ import annotations

import re

import pytest
from fastapi.testclient import TestClient

from cdx_server.app import create_app
from cdx_server.rate_limit import NullRateLimiter
from cdx_server.storage_pg import PostgresStorage


@pytest.fixture
async def pg_iso_storage(tmp_path):
    storage = PostgresStorage(f"sqlite+aiosqlite:///{tmp_path / 'iso_metrics.db'}")
    await storage._ensure_ready()
    return storage


@pytest.fixture
async def metrics_client(pg_iso_storage) -> TestClient:
    app = create_app(storage=pg_iso_storage, rate_limiter=NullRateLimiter())
    return TestClient(app, follow_redirects=False)


def _metric_value(text_body: str, name: str, labels: dict[str, str]) -> float:
    """Parse a prometheus exposition line and return the numeric value.

    Returns 0.0 if the metric/label combination is absent.
    """
    label_str = ",".join(f'{k}="{v}"' for k, v in sorted(labels.items()))
    pattern = rf"^{re.escape(name)}\{{{re.escape(label_str)}\}}\s+([0-9.e+-]+)$"
    match = re.search(pattern, text_body, flags=re.MULTILINE)
    return float(match.group(1)) if match else 0.0


def _read_iso_build_count(client: TestClient, profile: str, status_label: str) -> float:
    body = client.get("/metrics").text
    return _metric_value(
        body,
        "cdx_iso_build_total",
        {"profile": profile, "status": status_label},
    )


def _read_audit_count(client: TestClient, action: str) -> float:
    body = client.get("/metrics").text
    return _metric_value(body, "cdx_iso_build_audit_total", {"action": action})


# ---------------------------------------------------------------------------
# API path
# ---------------------------------------------------------------------------


def test_enqueue_increments_queued_metric(metrics_client):
    before = _read_iso_build_count(metrics_client, "standard", "queued")
    before_audit = _read_audit_count(metrics_client, "enqueue")

    resp = metrics_client.post(
        "/api/v1/iso-builds", json={"profile": "standard", "git_ref": "main"}
    )
    assert resp.status_code == 201

    after = _read_iso_build_count(metrics_client, "standard", "queued")
    after_audit = _read_audit_count(metrics_client, "enqueue")

    assert after == before + 1.0
    assert after_audit == before_audit + 1.0


def test_cancel_increments_cancelled_metric(metrics_client):
    job = metrics_client.post(
        "/api/v1/iso-builds", json={"profile": "field", "git_ref": "main"}
    ).json()
    before = _read_iso_build_count(metrics_client, "field", "cancelled")
    before_audit = _read_audit_count(metrics_client, "cancel")

    metrics_client.post(f"/api/v1/iso-builds/{job['id']}/cancel")

    after = _read_iso_build_count(metrics_client, "field", "cancelled")
    after_audit = _read_audit_count(metrics_client, "cancel")
    assert after == before + 1.0
    assert after_audit == before_audit + 1.0


def test_view_increments_audit_only(metrics_client):
    job = metrics_client.post(
        "/api/v1/iso-builds", json={"profile": "kiosk", "git_ref": "main"}
    ).json()
    before_view = _read_audit_count(metrics_client, "view")

    metrics_client.get(f"/api/v1/iso-builds/{job['id']}")

    after_view = _read_audit_count(metrics_client, "view")
    assert after_view == before_view + 1.0


# ---------------------------------------------------------------------------
# WebUI path — verify both surfaces share the same Counter
# ---------------------------------------------------------------------------


def test_webui_enqueue_increments_same_metric(metrics_client):
    before = _read_iso_build_count(metrics_client, "admin", "queued")
    before_audit = _read_audit_count(metrics_client, "enqueue")

    resp = metrics_client.post(
        "/admin/iso-builder",
        data={"profile": "admin", "git_ref": "main"},
    )
    assert resp.status_code == 303

    after = _read_iso_build_count(metrics_client, "admin", "queued")
    after_audit = _read_audit_count(metrics_client, "enqueue")
    assert after == before + 1.0
    assert after_audit == before_audit + 1.0


# ---------------------------------------------------------------------------
# Cardinality guard
# ---------------------------------------------------------------------------


def test_metric_cardinality_is_bounded(metrics_client):
    """The label set is closed: 5 profiles x 5 statuses = at most 25 series."""
    # Trigger one event to ensure the family is registered.
    metrics_client.post("/api/v1/iso-builds", json={"profile": "standard", "git_ref": "main"})
    body = metrics_client.get("/metrics").text

    series = [line for line in body.splitlines() if line.startswith("cdx_iso_build_total{")]
    # We don't assert ==25 (only seen-states are emitted), only an upper bound.
    assert len(series) <= 25, f"unexpected cardinality: {len(series)} series"
