"""作業員入退場用 QR トークン (HMAC-SHA256, TTL付き)."""
from __future__ import annotations

import base64
import hmac
import json
import secrets
import time
from hashlib import sha256

from ..config import get_settings


def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("ascii")


def _b64url_decode(data: str) -> bytes:
    pad = 4 - (len(data) % 4)
    return base64.urlsafe_b64decode(data + ("=" * pad))


def issue_token(project_id: int, worker_id: int, ttl: int | None = None) -> str:
    """time-limited QR token を発行."""
    settings = get_settings()
    payload = {
        "project_id": project_id,
        "worker_id": worker_id,
        "exp": int(time.time()) + (ttl or settings.qr_token_ttl_seconds),
        "jti": secrets.token_hex(8),
    }
    body = _b64url(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    sig = hmac.new(settings.qr_token_secret.encode(), body.encode(), sha256).digest()
    return f"{body}.{_b64url(sig)}"


def verify_token(token: str) -> dict:
    """検証して payload を返す。失敗時は ValueError."""
    settings = get_settings()
    try:
        body, sig = token.split(".", 1)
    except ValueError as e:
        raise ValueError("malformed token") from e
    expected = hmac.new(settings.qr_token_secret.encode(), body.encode(), sha256).digest()
    if not hmac.compare_digest(expected, _b64url_decode(sig)):
        raise ValueError("signature mismatch")
    payload = json.loads(_b64url_decode(body))
    if payload.get("exp", 0) < int(time.time()):
        raise ValueError("token expired")
    return payload
