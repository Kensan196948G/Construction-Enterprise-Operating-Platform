"""HMAC-SHA256 request verification + operator bearer-token check.

Mirrors :mod:`cdx_agent.sign` on the client side. The canonical input is
reconstructed from the identity headers + a SHA-256 digest of the raw body.

We reject the request before JSON parsing so a bad signature does not get
a chance to trip Pydantic validators on attacker-controlled input.

Operator endpoints (device registration) are gated by a separate static
bearer token sourced from the ``CDX_REGISTRATION_TOKEN`` env var. If the
env var is unset the registration endpoint refuses ALL requests with 503
so that mis-deployed servers cannot accidentally accept open provisioning.
"""

from __future__ import annotations

import hashlib
import hmac
import os
from dataclasses import dataclass

from fastapi import HTTPException, Request, status

from cdx_server.obs.metrics import CDX_AUTH_FAILURE_TOTAL
from cdx_server.storage_protocol import Storage

REGISTRATION_TOKEN_ENV = "CDX_REGISTRATION_TOKEN"
BOOTSTRAP_SECRET_ENV = "CDX_BOOTSTRAP_SECRET"


@dataclass(frozen=True, slots=True)
class VerifiedIdentity:
    device_id: str
    payload_type: str
    timestamp_bucket: int
    body_bytes: bytes


def _require_header(request: Request, name: str) -> str:
    value = request.headers.get(name)
    if not value:
        CDX_AUTH_FAILURE_TOTAL.labels(reason="missing_header").inc()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing required header: {name}",
        )
    return value


def _hmac_hex(secret: str, canonical: str) -> str:
    return hmac.new(secret.encode("utf-8"), canonical.encode("utf-8"), hashlib.sha256).hexdigest()


async def verify_signed_request(
    request: Request,
    expected_payload_type: str,
    storage: Storage,
) -> VerifiedIdentity:
    device_id = _require_header(request, "X-CDX-Device-Id")
    payload_type = _require_header(request, "X-CDX-Payload-Type")
    bucket_raw = _require_header(request, "X-CDX-Timestamp-Bucket")
    signature = _require_header(request, "X-CDX-Signature")

    if payload_type != expected_payload_type:
        CDX_AUTH_FAILURE_TOTAL.labels(reason="payload_type_mismatch").inc()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payload type mismatch: header={payload_type} expected={expected_payload_type}",
        )

    try:
        bucket = int(bucket_raw)
    except ValueError as exc:
        CDX_AUTH_FAILURE_TOTAL.labels(reason="bad_bucket_header").inc()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="X-CDX-Timestamp-Bucket must be an integer epoch value",
        ) from exc

    device = await storage.get_device(device_id)
    if device is None:
        CDX_AUTH_FAILURE_TOTAL.labels(reason="unknown_device").inc()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unknown device",
        )

    body_bytes = await request.body()
    body_sha = hashlib.sha256(body_bytes).hexdigest()
    canonical = "\n".join([device_id, payload_type, str(bucket), body_sha])
    expected = _hmac_hex(device.shared_secret, canonical)

    if not hmac.compare_digest(expected, signature):
        CDX_AUTH_FAILURE_TOTAL.labels(reason="bad_signature").inc()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid signature",
        )

    return VerifiedIdentity(
        device_id=device_id,
        payload_type=payload_type,
        timestamp_bucket=bucket,
        body_bytes=body_bytes,
    )


def require_registration_token(request: Request) -> None:
    """Reject the request unless ``Authorization: Bearer <CDX_REGISTRATION_TOKEN>`` matches.

    Closed-by-default semantics: if the env var is unset, registration is
    refused with 503 so a mis-deployed server cannot accidentally accept
    open provisioning. Operators must explicitly opt in.
    """
    expected = os.environ.get(REGISTRATION_TOKEN_ENV, "").strip()
    if not expected:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Registration is disabled: server has no CDX_REGISTRATION_TOKEN "
                "configured. Set the env var on the server to enable provisioning."
            ),
        )

    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Bearer token for registration endpoint",
        )

    presented = auth[len("Bearer ") :].strip()
    if not hmac.compare_digest(expected, presented):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid registration token",
        )


def require_bootstrap_secret(request: Request) -> None:
    """Reject unless ``X-CDX-Bootstrap-Secret: <CDX_BOOTSTRAP_SECRET>`` matches.

    Used by the ephemeral registration-token issuance endpoint (Issue 0042
    Phase 4.3).  The secret is passed via a custom header (not Authorization)
    to avoid accidental caching by HTTP intermediaries that index auth headers.

    Closed-by-default: 503 when the env var is unset.
    """
    expected = os.environ.get(BOOTSTRAP_SECRET_ENV, "").strip()
    if not expected:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Token issuance is disabled: server has no CDX_BOOTSTRAP_SECRET "
                "configured. Set the env var to enable PXE provisioning."
            ),
        )

    presented = request.headers.get("X-CDX-Bootstrap-Secret", "").strip()
    if not presented:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-CDX-Bootstrap-Secret header",
        )
    if not hmac.compare_digest(expected, presented):
        CDX_AUTH_FAILURE_TOTAL.labels(reason="bad_bootstrap_secret").inc()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid bootstrap secret",
        )
