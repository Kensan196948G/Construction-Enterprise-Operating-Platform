"""Device registry router.

Registration is gated by ``CDX_REGISTRATION_TOKEN`` (Bearer auth) so that
no third party can pre-register a device with their own shared secret —
which would otherwise enable a "first-write-wins" secret-substitution
attack against legitimate provisioning.

Phase 2 will replace the bearer token with operator certificates and an
out-of-band secret exchange (most likely PKCS#11-backed).
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Request

from cdx_server.auth import require_registration_token
from cdx_server.dependencies import get_storage
from cdx_server.obs.metrics import CDX_REGISTRATION_TOTAL
from cdx_server.schemas import RegisterRequest, RegisterResponse
from cdx_server.storage_protocol import Storage

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/devices", tags=["devices"])


@router.post("/register", response_model=RegisterResponse)
async def register_device(
    request: Request,
    payload: RegisterRequest,
    storage: Storage = Depends(get_storage),
) -> RegisterResponse:
    require_registration_token(request)
    record, already = await storage.register_device(
        device_id=payload.device_id,
        profile=payload.profile,
        hostname=payload.hostname,
        shared_secret=payload.shared_secret,
    )
    if already:
        logger.info("device %s registration ignored — already registered", payload.device_id)
        CDX_REGISTRATION_TOTAL.labels(result="already_registered").inc()
    else:
        logger.info("device %s registered (profile=%s)", payload.device_id, payload.profile)
        CDX_REGISTRATION_TOTAL.labels(result="accepted").inc()
    return RegisterResponse(
        device_id=record.device_id,
        registered_at=record.registered_at,
        already_registered=already,
    )
