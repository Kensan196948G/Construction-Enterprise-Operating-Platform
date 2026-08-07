"""Heartbeat intake router."""

from __future__ import annotations

import json
import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import ValidationError

from cdx_server.auth import verify_signed_request
from cdx_server.dependencies import get_rate_limiter, get_storage
from cdx_server.obs.metrics import CDX_INGEST_TOTAL, CDX_RATE_LIMIT_EXCEEDED_TOTAL
from cdx_server.rate_limit import RateLimiter
from cdx_server.schemas import HeartbeatRequest, HeartbeatResponse
from cdx_server.storage_protocol import Storage

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["heartbeat"])


@router.post("/heartbeat", response_model=HeartbeatResponse)
async def ingest_heartbeat(
    request: Request,
    storage: Storage = Depends(get_storage),
    rate_limiter: RateLimiter = Depends(get_rate_limiter),
) -> HeartbeatResponse:
    identity = await verify_signed_request(request, "heartbeat", storage)

    decision = rate_limiter.check(device_id=identity.device_id, endpoint="heartbeat")
    if not decision.allowed:
        logger.warning(
            "rate-limit exceeded for device=%s endpoint=heartbeat retry_after=%ds",
            identity.device_id,
            decision.retry_after_seconds,
        )
        CDX_RATE_LIMIT_EXCEEDED_TOTAL.labels(endpoint="heartbeat").inc()
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded for heartbeat",
            headers={"Retry-After": str(decision.retry_after_seconds)},
        )

    try:
        payload_dict = json.loads(identity.body_bytes.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError) as exc:
        logger.warning("malformed heartbeat body from %s", identity.device_id)
        CDX_INGEST_TOTAL.labels(endpoint="heartbeat", status="rejected_json").inc()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Malformed JSON body: {exc}",
        ) from exc

    try:
        parsed = HeartbeatRequest(**payload_dict)
    except ValidationError as exc:
        logger.warning("schema-invalid heartbeat from %s", identity.device_id)
        CDX_INGEST_TOTAL.labels(endpoint="heartbeat", status="rejected_schema").inc()
        raise HTTPException(
            status_code=422,
            detail="Heartbeat payload failed schema validation",
        ) from exc

    if parsed.device_id != identity.device_id:
        logger.warning(
            "device_id mismatch: header=%s body=%s",
            identity.device_id,
            parsed.device_id,
        )
        CDX_INGEST_TOTAL.labels(endpoint="heartbeat", status="rejected_mismatch").inc()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="device_id header/body mismatch",
        )

    record, duplicate = await storage.record_heartbeat(
        device_id=identity.device_id,
        timestamp_bucket=identity.timestamp_bucket,
        agent_version=parsed.agent_version,
        uptime_seconds=parsed.uptime_seconds,
        sent_at=parsed.sent_at,
    )
    if duplicate:
        logger.info(
            "heartbeat duplicate for device=%s bucket=%d",
            identity.device_id,
            identity.timestamp_bucket,
        )
        CDX_INGEST_TOTAL.labels(endpoint="heartbeat", status="duplicate").inc()
    else:
        logger.info(
            "heartbeat accepted for device=%s bucket=%d",
            identity.device_id,
            identity.timestamp_bucket,
        )
        CDX_INGEST_TOTAL.labels(endpoint="heartbeat", status="accepted").inc()
    return HeartbeatResponse(
        accepted=True,
        duplicate=duplicate,
        received_at=record.received_at,
    )
