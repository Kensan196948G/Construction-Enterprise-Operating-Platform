"""PXE boot event recording endpoint (Issue 0042 Phase 4.4).

agent-bootstrap.sh calls POST /api/v1/pxe/events after each significant
bootstrap stage.  The endpoint is stateless -- it only increments Prometheus
counters.  No DB write; audit trail lives in structured logs + Prometheus.

Auth: X-CDX-Bootstrap-Secret header (same secret used for registration
token issuance).  This keeps the blast radius minimal: a leaked bootstrap
secret cannot access device data -- only report metrics.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Request

from cdx_server.auth import require_bootstrap_secret
from cdx_server.obs.metrics import CDX_PXE_BOOT_TOTAL, CDX_PXE_PROVISIONING_SECONDS
from cdx_server.schemas import PXEBootEvent, PXEEventRequest, PXEEventResponse

logger = logging.getLogger(__name__)

router = APIRouter(tags=["pxe"])


@router.post("/api/v1/pxe/events", response_model=PXEEventResponse, status_code=200)
async def record_pxe_event(
    request: Request,
    payload: PXEEventRequest,
) -> PXEEventResponse:
    """Record a PXE boot lifecycle event and update Prometheus metrics.

    Called by agent-bootstrap.sh at bootstrap_complete and bootstrap_failed.
    The token_issued event is recorded automatically when the registration
    token endpoint issues a token.
    """
    require_bootstrap_secret(request)

    CDX_PXE_BOOT_TOTAL.labels(profile=payload.profile, event=payload.event.value).inc()

    if payload.event == PXEBootEvent.BOOTSTRAP_COMPLETE and payload.duration_seconds is not None:
        CDX_PXE_PROVISIONING_SECONDS.labels(profile=payload.profile).observe(
            payload.duration_seconds
        )

    log_extra: dict = {
        "pxe_event": payload.event.value,
        "profile": payload.profile,
        "fingerprint_prefix": payload.fingerprint[:8],
    }
    if payload.duration_seconds is not None:
        log_extra["duration_seconds"] = payload.duration_seconds
    if payload.error_message:
        log_extra["error_message"] = payload.error_message

    if payload.event == PXEBootEvent.BOOTSTRAP_FAILED:
        logger.warning("pxe.bootstrap_failed", extra=log_extra)
    else:
        logger.info("pxe.event_recorded", extra=log_extra)

    return PXEEventResponse(event=payload.event)
