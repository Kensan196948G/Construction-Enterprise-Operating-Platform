"""slowapi によるレート制限ミドルウェア (IP + ユーザー単位)."""
from __future__ import annotations

from typing import Any

from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from starlette.requests import Request
from starlette.responses import JSONResponse

from cdx_gateway.config import get_settings
from cdx_gateway.openapi import make_error


def _identify(request: Request) -> str:
    """IP+ユーザー の複合キー."""
    ip = get_remote_address(request)
    user = getattr(request.state, "user", None)
    user_id: str | None = None
    if user is not None:
        # cdx_auth.models.User を想定 (oid / sub / email)
        user_id = (
            getattr(user, "oid", None)
            or getattr(user, "sub", None)
            or getattr(user, "email", None)
        )
    return f"{ip}|{user_id or 'anon'}"


_settings = get_settings()
limiter: Limiter = Limiter(
    key_func=_identify,
    storage_uri=_settings.RATE_LIMIT_STORAGE_URI,
    default_limits=[f"{_settings.RATE_LIMIT_PER_MIN}/minute"],
)


async def rate_limit_exceeded_handler(
    request: Request, exc: Exception
) -> JSONResponse:  # pragma: no cover - 委譲のみ
    """429 を共通エラーフォーマットで返却."""
    detail: Any = getattr(exc, "detail", "rate limit exceeded")
    body = make_error(
        code="RATE_LIMIT_EXCEEDED",
        message="リクエストが多すぎます。しばらくしてから再試行してください。",
    )
    body["error"]["details"] = [{"field": None, "issue": str(detail)}]
    response = JSONResponse(status_code=429, content=body)
    response.headers["Retry-After"] = "60"
    return response


__all__ = ["limiter", "rate_limit_exceeded_handler", "RateLimitExceeded"]
