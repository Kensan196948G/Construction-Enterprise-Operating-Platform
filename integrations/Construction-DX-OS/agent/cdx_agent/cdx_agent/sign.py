"""HMAC-SHA256 request signing for cdx-agent ↔ central-platform.

Phase 1 authentication uses a shared secret per device provisioned at imaging
time (`CDX_SHARED_SECRET` env var on the client, same value in the server's
device registry).

The signature is computed over a canonical string built from the request's
identity headers plus a SHA-256 digest of the raw body — so the server can
verify the signature before parsing potentially malicious JSON.

Canonical string format (LF-separated, no trailing newline)::

    device_id
    payload_type
    timestamp_bucket
    sha256(body_bytes) as lowercase hex

Phase 2 will replace this with device certificates and PKI trust chains.
"""

from __future__ import annotations

import hashlib
import hmac

CANONICAL_JOINER = "\n"


def body_digest(body_bytes: bytes) -> str:
    return hashlib.sha256(body_bytes).hexdigest()


def canonical_string(
    *,
    device_id: str,
    payload_type: str,
    timestamp_bucket: int,
    body_bytes: bytes,
) -> str:
    return CANONICAL_JOINER.join(
        [
            device_id,
            payload_type,
            str(timestamp_bucket),
            body_digest(body_bytes),
        ]
    )


def sign(secret: str, canonical: str) -> str:
    mac = hmac.new(secret.encode("utf-8"), canonical.encode("utf-8"), hashlib.sha256)
    return mac.hexdigest()


def verify(secret: str, canonical: str, signature: str) -> bool:
    expected = sign(secret, canonical)
    return hmac.compare_digest(expected, signature)


HEARTBEAT_BUCKET_SECONDS = 60
INVENTORY_BUCKET_SECONDS = 3600
DEFAULT_BUCKET_SECONDS = 300


def bucket_for(payload_type: str, now_epoch: float) -> int:
    """Return the timestamp bucket an event belongs to.

    Heartbeat uses a 1-minute bucket (idempotent within the heartbeat cadence).
    Inventory uses a 1-hour bucket (collection is coarser).
    Unknown payload types fall back to 5 minutes.
    """
    if payload_type == "heartbeat":
        step = HEARTBEAT_BUCKET_SECONDS
    elif payload_type == "inventory":
        step = INVENTORY_BUCKET_SECONDS
    else:
        step = DEFAULT_BUCKET_SECONDS
    return int(now_epoch) // step * step
