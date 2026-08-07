"""Registration Token API (Issue 0042 Phase 4.3).

Provides two endpoints:

- POST /api/v1/devices/registration-tokens
  Issued by agent-bootstrap.sh during PXE provisioning.  Gated by
  ``X-CDX-Bootstrap-Secret`` header (CDX_BOOTSTRAP_SECRET env var).
  Returns a 24-hour single-use token that agent-bootstrap.sh writes to
  /etc/cdx-agent/config.toml for first-boot registration.

- POST /api/v1/auth/rotate
  Called by cdx-agent after successful registration to obtain a long-lived
  device token (48h, auto-rotated).  Gated by the normal HMAC-SHA256
  device signature used by heartbeat / inventory endpoints.
"""

from __future__ import annotations

import logging
from typing import cast

from fastapi import APIRouter, Depends, Request

from cdx_server.auth import require_bootstrap_secret, verify_signed_request
from cdx_server.dependencies import get_storage
from cdx_server.obs.metrics import CDX_PXE_BOOT_TOTAL
from cdx_server.schemas import (
    RegistrationTokenRequest,
    RegistrationTokenResponse,
    TokenRotateRequest,
    TokenRotateResponse,
)
from cdx_server.storage_protocol import RegistrationTokenStorage, Storage

logger = logging.getLogger(__name__)

router = APIRouter(tags=["registration"])


@router.post(
    "/api/v1/devices/registration-tokens",
    response_model=RegistrationTokenResponse,
    status_code=201,
)
async def create_registration_token(
    request: Request,
    payload: RegistrationTokenRequest,
    storage: RegistrationTokenStorage = Depends(get_storage),
) -> RegistrationTokenResponse:
    """Issue an ephemeral registration token to a bootstrapping device.

    Called by ``agent-bootstrap.sh`` during PXE provisioning.  The token is
    single-use (consumed on first ``/api/v1/devices/register`` call) and
    expires after 24 hours.
    """
    require_bootstrap_secret(request)
    record = await storage.create_registration_token(
        profile=payload.profile,
        fingerprint=payload.fingerprint,
    )
    logger.info(
        "registration token issued: profile=%s fingerprint_prefix=%s",
        payload.profile,
        payload.fingerprint[:8],
    )
    CDX_PXE_BOOT_TOTAL.labels(profile=payload.profile, event="token_issued").inc()
    return RegistrationTokenResponse(token=record.token, expires_at=record.expires_at)


@router.post("/api/v1/auth/rotate", response_model=TokenRotateResponse)
async def rotate_device_token(
    request: Request,
    payload: TokenRotateRequest,
    storage: Storage = Depends(get_storage),
) -> TokenRotateResponse:
    """Rotate a device's long-lived auth token (48-hour TTL).

    Gated by HMAC-SHA256 device signature (same scheme as heartbeat/inventory).
    The agent calls this endpoint automatically before token expiry.
    """
    identity = await verify_signed_request(request, "token-rotate", storage)
    if identity.device_id != payload.device_id:
        from fastapi import HTTPException, status

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="device_id in body does not match signed identity",
        )
    record = await cast(RegistrationTokenStorage, storage).rotate_device_token(identity.device_id)
    logger.info("device token rotated: device_id=%s", identity.device_id)
    return TokenRotateResponse(token=record.token, expires_at=record.expires_at)
