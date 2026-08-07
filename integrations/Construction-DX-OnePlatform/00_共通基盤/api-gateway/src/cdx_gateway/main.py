"""Construction DX 統合APIゲートウェイ FastAPI エントリポイント."""
from __future__ import annotations

import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

import httpx
import structlog
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.middleware import SlowAPIMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from cdx_gateway.config import get_settings
from cdx_gateway.middleware.auth import EntraOIDCMiddleware, patch_public_paths
from cdx_gateway.middleware.logging import RequestLoggingMiddleware, configure_structlog
from cdx_gateway.middleware.rate_limit import (
    RateLimitExceeded,
    limiter,
    rate_limit_exceeded_handler,
)
from cdx_gateway.openapi import COMMON_ERROR_RESPONSES, make_error
from cdx_gateway.routes import health as health_routes
from cdx_gateway.routes import metrics as metrics_routes
from cdx_gateway.routes import proxy as proxy_routes


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """起動・終了時のリソース管理 (httpx クライアント等)."""
    settings = get_settings()
    configure_structlog(settings.LOG_LEVEL)
    log = structlog.get_logger("cdx.gateway")
    log.info("gateway.start", env=settings.ENV, port=settings.GATEWAY_PORT)

    app.state.http_client = httpx.AsyncClient(
        timeout=settings.PROXY_TIMEOUT_SECONDS,
        follow_redirects=False,
    )
    try:
        yield
    finally:
        await app.state.http_client.aclose()
        log.info("gateway.stop")


def create_app() -> FastAPI:
    """FastAPI アプリ生成."""
    settings = get_settings()

    app = FastAPI(
        title="Construction DX One Platform — API Gateway",
        description=(
            "建設DX統合プラットフォームの統一APIゲートウェイ。\n\n"
            "各部門API (建設現場 / 安全衛生 / ITSM / 調達 / 営業) への "
            "認証 / レート制限 / ログ集約 / リバースプロキシを担います。"
        ),
        version="0.1.0",
        lifespan=lifespan,
        responses=COMMON_ERROR_RESPONSES,
        docs_url="/docs",
        openapi_url="/openapi.json",
    )

    # ---- slowapi 連携 ----
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)  # type: ignore[arg-type]

    # ---- ミドルウェア (実行順は逆順登録) ----
    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID"],
    )
    # レート制限
    app.add_middleware(SlowAPIMiddleware)
    # 認証 (PUBLIC_PATHS に /ready /metrics を追加)
    patch_public_paths()
    if os.getenv("CDX_GATEWAY_DISABLE_AUTH", "").lower() not in {"1", "true", "yes"}:
        app.add_middleware(EntraOIDCMiddleware)
    # ロギング (最外側で時間計測)
    app.add_middleware(RequestLoggingMiddleware)

    # ---- 例外ハンドラ (共通エラーフォーマット) ----
    @app.exception_handler(StarletteHTTPException)
    async def _http_exc_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        code_map = {
            400: "BAD_REQUEST",
            401: "UNAUTHORIZED",
            403: "FORBIDDEN",
            404: "NOT_FOUND",
            405: "METHOD_NOT_ALLOWED",
            429: "RATE_LIMIT_EXCEEDED",
            500: "INTERNAL_ERROR",
            502: "BAD_GATEWAY",
            503: "SERVICE_UNAVAILABLE",
            504: "GATEWAY_TIMEOUT",
        }
        code = code_map.get(exc.status_code, f"HTTP_{exc.status_code}")
        body = make_error(code=code, message=str(exc.detail))
        return JSONResponse(status_code=exc.status_code, content=body)

    @app.exception_handler(RequestValidationError)
    async def _validation_exc_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        body = make_error(
            code="VALIDATION_ERROR",
            message="リクエスト内容に誤りがあります。",
        )
        body["error"]["details"] = [
            {"field": ".".join(str(p) for p in err.get("loc", [])), "issue": err.get("msg", "")}
            for err in exc.errors()
        ]
        return JSONResponse(status_code=422, content=body)

    @app.exception_handler(Exception)
    async def _unhandled_exc_handler(request: Request, exc: Exception) -> JSONResponse:
        structlog.get_logger("cdx.gateway").exception("unhandled", error=str(exc))
        body = make_error(code="INTERNAL_ERROR", message="サーバ内部エラーが発生しました。")
        return JSONResponse(status_code=500, content=body)

    # ---- ルーター登録 ----
    app.include_router(health_routes.router)
    app.include_router(metrics_routes.router)
    app.include_router(proxy_routes.router)

    @app.get(
        "/",
        tags=["meta"],
        summary="ルート情報",
        description="ゲートウェイのバージョン情報を返します。",
    )
    async def root() -> dict[str, str]:
        return {
            "service": "cdx-api-gateway",
            "version": app.version,
            "docs": "/docs",
        }

    return app


app = create_app()
