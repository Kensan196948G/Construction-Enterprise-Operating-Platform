"""Entra ID OIDC ミドルウェア (Starlette/FastAPI).

Codex Review M2/M3/L4 対応:
- PUBLIC_PATHS を設定で上書き可能化 (本番では /docs 等を非公開)
- 外部レスポンスは固定文言、詳細は秘匿ログ
- 静的配信パスは正規化済みパスで判定
"""
from __future__ import annotations

import logging
import posixpath
from collections.abc import Awaitable, Callable

from fastapi import HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from cdx_auth.config import AuthSettings
from cdx_auth.dependencies import _verify_bearer
from cdx_auth.jwks import AuthInfraError

log = logging.getLogger(__name__)


def _normalized_path(path: str) -> str:
    return posixpath.normpath("/" + path.lstrip("/"))


class EntraOIDCMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, settings: AuthSettings | None = None):  # type: ignore[no-untyped-def]
        super().__init__(app)
        self._settings = settings or AuthSettings()  # type: ignore[call-arg]
        self._public_paths = self._settings.public_paths()

    def _is_public(self, path: str) -> bool:
        normalized = _normalized_path(path)
        if normalized in self._public_paths:
            return True
        if normalized.startswith("/static/"):
            return True
        return False

    async def dispatch(
        self,
        request: Request,
        call_next: Callable[[Request], Awaitable[Response]],
    ) -> Response:
        if self._is_public(request.url.path):
            return await call_next(request)

        auth = request.headers.get("authorization", "")
        if not auth.lower().startswith("bearer "):
            return JSONResponse({"error": "invalid_token"}, status_code=401)
        try:
            user = await _verify_bearer(auth.split(" ", 1)[1])
        except AuthInfraError as e:
            log.error("auth_middleware: infra error: %s", e)
            return JSONResponse({"error": "auth_unavailable"}, status_code=503)
        except HTTPException as e:
            payload = {"error": e.detail if isinstance(e.detail, str) else "invalid_token"}
            log.info("auth_middleware: rejected status=%s", e.status_code)
            return JSONResponse(payload, status_code=e.status_code)
        except Exception as e:  # noqa: BLE001
            log.info("auth_middleware: rejected: %s", e)
            return JSONResponse({"error": "invalid_token"}, status_code=401)
        request.state.user = user
        return await call_next(request)
