"""Policy pull router.

Devices call ``GET /api/v1/policy`` with HMAC-signed identity headers to
retrieve the policy that governs their operation cadence, update ring, etc.

The request body is empty; the HMAC canonical string is built from the device
id, the literal payload type ``"policy"``, the timestamp bucket, and the
SHA-256 digest of an empty body, keeping it consistent with the heartbeat /
inventory signing scheme.

Phase 1 MVP: policies are static per-profile defaults stored in memory.
Phase 2 will allow operator overrides and per-device policy.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status

from cdx_server.auth import verify_signed_request
from cdx_server.dependencies import get_storage
from cdx_server.schemas import PolicyResponse
from cdx_server.storage_protocol import Storage

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["policy"])


@router.get("/policy", response_model=PolicyResponse)
async def get_policy(
    request: Request,
    storage: Storage = Depends(get_storage),
) -> PolicyResponse:
    identity = await verify_signed_request(request, "policy", storage)

    device = await storage.get_device(identity.device_id)
    if device is None:
        # Should not happen — verify_signed_request already checked, but be
        # explicit so a future storage refactor doesn't silently break this.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unknown device",
        )

    policy = await storage.get_policy(device.profile)
    if policy is None:
        logger.warning(
            "no policy found for device=%s profile=%s",
            identity.device_id,
            device.profile,
        )
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No policy configured for profile '{device.profile}'",
        )

    logger.info(
        "policy served to device=%s profile=%s version=%d",
        identity.device_id,
        policy.profile,
        policy.policy_version,
    )
    return PolicyResponse(
        profile=policy.profile,  # type: ignore[arg-type]
        update_ring=policy.update_ring,  # type: ignore[arg-type]
        heartbeat_interval_seconds=policy.heartbeat_interval_seconds,
        inventory_interval_seconds=policy.inventory_interval_seconds,
        policy_version=policy.policy_version,
    )
