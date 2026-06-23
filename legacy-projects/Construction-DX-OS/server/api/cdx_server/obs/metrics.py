"""Prometheus metrics surface for cdx-server.

Counter choices reflect the Phase 1 use cases an operator cares about:

- ``cdx_ingest_total{endpoint,status}`` — successful vs duplicate vs failed
  heartbeat / inventory receives. Operators can alert on
  ``rate(cdx_ingest_total{status="rejected"}[5m]) > THRESHOLD``.
- ``cdx_registration_total{result}`` — device provisioning health.
- ``cdx_auth_failure_total{reason}`` — HMAC mismatch, unknown device,
  missing headers. Spikes indicate misconfigured devices OR an attack.

All counters live in the default global registry so a single
``make_asgi_app()`` mount exposes them at ``/metrics``.
"""

from __future__ import annotations

from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from starlette.requests import Request
from starlette.responses import Response

CDX_INGEST_TOTAL = Counter(
    "cdx_ingest_total",
    "Telemetry ingest events (heartbeat/inventory).",
    labelnames=("endpoint", "status"),
)

CDX_REGISTRATION_TOTAL = Counter(
    "cdx_registration_total",
    "Device registration attempts.",
    labelnames=("result",),
)

CDX_AUTH_FAILURE_TOTAL = Counter(
    "cdx_auth_failure_total",
    "Auth-related rejections (HMAC mismatch, unknown device, etc).",
    labelnames=("reason",),
)

# Cardinality note: do NOT add device_id as a label. A fleet of N devices
# would multiply every other series by N. Per-device rate-limit visibility
# comes from structured logs (request_id + device_id).
CDX_RATE_LIMIT_EXCEEDED_TOTAL = Counter(
    "cdx_rate_limit_exceeded_total",
    "Requests rejected with HTTP 429 by the per-device token bucket.",
    labelnames=("endpoint",),
)

# Phase 2 ISO Builder UI (Issue 0022). The counter records *lifecycle state
# transitions* — not the current number of jobs in each state. Operators
# typically alert on `rate(cdx_iso_build_total{status="failed"}[1h])` or
# graph the queue/run/succeed funnel.
#
# Cardinality is bounded: 5 profiles x 5 statuses = 25 series.
# Profiles + statuses are enums in cdx_server.models so unbounded growth
# cannot leak in via user input.
CDX_ISO_BUILD_TOTAL = Counter(
    "cdx_iso_build_total",
    "ISO build job lifecycle events (state transitions).",
    labelnames=("profile", "status"),
)

# Audit-row counter is finer-grained than the lifecycle counter: every
# operator action (view/enqueue/cancel/download) bumps it. Useful for
# detecting unusual access patterns (e.g. download rate spikes).
CDX_ISO_BUILD_AUDIT_TOTAL = Counter(
    "cdx_iso_build_audit_total",
    "ISO build operator audit events.",
    labelnames=("action",),
)


# Phase 4.4 (Issue 0042): PXE boot provisioning metrics.
#
# cdx_pxe_boot_total tracks lifecycle events from token issuance through
# successful or failed bootstrap completion. Operators alert on failure rate:
#   rate(cdx_pxe_boot_total{event="bootstrap_failed"}[1h])
#   / rate(cdx_pxe_boot_total{event="token_issued"}[1h]) > 0.05
#
# Cardinality: 3 profiles x 4 events = 12 series (bounded).
CDX_PXE_BOOT_TOTAL = Counter(
    "cdx_pxe_boot_total",
    "PXE boot provisioning lifecycle events.",
    labelnames=("profile", "event"),
)

# Histogram for provisioning duration (token_issued -> bootstrap_complete).
# Buckets cover: 1min, 5min, 10min, 20min, 30min, 60min.
CDX_PXE_PROVISIONING_SECONDS = Histogram(
    "cdx_pxe_provisioning_seconds",
    "PXE provisioning duration from token issuance to bootstrap completion.",
    labelnames=("profile",),
    buckets=(60, 300, 600, 1200, 1800, 3600),
)


# Issue 0052: serial-scan OCR pipeline observability.
#
# cdx_serial_scan_total tracks every lifecycle event for an OCR queue item
# (insert / confirm / discard). Useful for monitoring the GMSV0002 OCR
# pipeline throughput and operator confirmation rate:
#
#   rate(cdx_serial_scan_total{event="confirm"}[1h])
#   / rate(cdx_serial_scan_total{event="insert"}[1h])
#
# Cardinality: 3 events (insert/confirm/discard) x 2 backends = 6 series.
CDX_SERIAL_SCAN_TOTAL = Counter(
    "cdx_serial_scan_total",
    "Serial-scan OCR queue lifecycle events (GMSV0002 pipeline).",
    labelnames=("event", "backend"),
)


async def metrics_endpoint(_request: Request) -> Response:
    """Plain Starlette endpoint so FastAPI's OpenAPI does not try to model it."""
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)
