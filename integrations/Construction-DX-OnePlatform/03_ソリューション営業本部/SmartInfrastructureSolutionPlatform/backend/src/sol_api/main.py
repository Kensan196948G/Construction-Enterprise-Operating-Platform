"""FastAPI エントリポイント (Smart Infrastructure Solution Platform)."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routes import (
    assets,
    catalog,
    cases,
    dashboard,
    feasibility,
    partners,
    pfi,
    proposals,
)


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        description=(
            "Smart Infrastructure Solution Platform API。"
            "提案型営業 (港湾DX/再エネ/防災/PFI・PPP/環境保全) のソリューションカタログ・"
            "提案案件・実現可能性スタディ (F/S)・インフラ資産・パートナー・事例集を統合管理する。"
        ),
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health", tags=["meta"])
    async def health() -> dict[str, str]:
        return {"status": "ok", "service": "cdx-sol-api"}

    prefix = settings.api_v1_prefix
    app.include_router(catalog.router, prefix=prefix)
    app.include_router(proposals.router, prefix=prefix)
    app.include_router(feasibility.router, prefix=prefix)
    app.include_router(assets.router, prefix=prefix)
    app.include_router(partners.router, prefix=prefix)
    app.include_router(cases.router, prefix=prefix)
    app.include_router(pfi.router, prefix=prefix)
    app.include_router(dashboard.router, prefix=prefix)
    return app


app = create_app()
