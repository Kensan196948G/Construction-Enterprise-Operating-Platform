"""FastAPI エントリポイント (建設CRM・入札管理)."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routes import (
    activities,
    bids,
    clients,
    contracts,
    dashboard,
    opportunities,
    quotations,
)


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        description=(
            "建設CRM・入札管理 API。"
            "案件パイプライン / 入札 / 見積 (電帳法対応) / 契約 / 営業活動を統合管理する。"
        ),
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # 認証は各 route の Depends(get_current_user) で強制 (cdx-shared-auth)
    @app.get("/health", tags=["meta"])
    async def health() -> dict[str, str]:
        return {"status": "ok", "service": "cdx-crm-api"}

    prefix = settings.api_v1_prefix
    app.include_router(clients.router, prefix=prefix)
    app.include_router(opportunities.router, prefix=prefix)
    app.include_router(bids.router, prefix=prefix)
    app.include_router(quotations.router, prefix=prefix)
    app.include_router(contracts.router, prefix=prefix)
    app.include_router(activities.router, prefix=prefix)
    app.include_router(dashboard.router, prefix=prefix)
    return app


app = create_app()
