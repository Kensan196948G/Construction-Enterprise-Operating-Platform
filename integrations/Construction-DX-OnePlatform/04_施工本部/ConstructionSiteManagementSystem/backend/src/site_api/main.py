"""FastAPI エントリポイント."""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routes import (
    attendance,
    blackboards,
    costs,
    daily_reports,
    equipment,
    photos,
    progress,
    projects,
    schedules,
    sync,
)


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        description="施工管理システム API (PWA + オフライン対応)",
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
        return {"status": "ok", "service": "cdx-site-api"}

    prefix = settings.api_v1_prefix
    app.include_router(projects.router, prefix=prefix)
    app.include_router(schedules.router, prefix=prefix)
    app.include_router(progress.router, prefix=prefix)
    app.include_router(costs.router, prefix=prefix)
    app.include_router(daily_reports.router, prefix=prefix)
    app.include_router(photos.router, prefix=prefix)
    app.include_router(blackboards.router, prefix=prefix)
    app.include_router(attendance.router, prefix=prefix)
    app.include_router(equipment.router, prefix=prefix)
    app.include_router(sync.router, prefix=prefix)
    return app


app = create_app()
