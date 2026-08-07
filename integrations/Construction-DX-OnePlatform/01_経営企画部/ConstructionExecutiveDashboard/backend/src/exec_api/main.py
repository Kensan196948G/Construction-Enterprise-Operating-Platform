"""FastAPI エントリポイント (経営ダッシュボード)."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routes import alerts, bcp, dashboard, esg, forecasts, kpi, reports


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        description=(
            "Construction Executive Dashboard API。"
            "他部門 API を集約し, KPI/予測/アラート/BCP/ESG/取締役会報告書を提供する。"
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
        return {"status": "ok", "service": "cdx-exec-api"}

    prefix = settings.api_v1_prefix
    app.include_router(dashboard.router, prefix=prefix)
    app.include_router(kpi.router, prefix=prefix)
    app.include_router(forecasts.router, prefix=prefix)
    app.include_router(alerts.router, prefix=prefix)
    app.include_router(bcp.router, prefix=prefix)
    app.include_router(esg.router, prefix=prefix)
    app.include_router(reports.router, prefix=prefix)
    return app


app = create_app()
