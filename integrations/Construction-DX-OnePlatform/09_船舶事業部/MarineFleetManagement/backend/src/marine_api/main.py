"""FastAPI エントリポイント."""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routes import (
    ais,
    crew,
    dashboard,
    fuel,
    port_calls,
    positions,
    vessels,
    voyages,
    weather,
)


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        description="船舶運航管理プラットフォーム API (AIS / 燃費 / 海象 / 乗組員 / 工事連携)",
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
        return {"status": "ok", "service": "cdx-marine-api"}

    prefix = settings.api_v1_prefix
    app.include_router(vessels.router, prefix=prefix)
    app.include_router(voyages.router, prefix=prefix)
    app.include_router(positions.router, prefix=prefix)
    app.include_router(ais.router, prefix=prefix)
    app.include_router(weather.router, prefix=prefix)
    app.include_router(fuel.router, prefix=prefix)
    app.include_router(crew.router, prefix=prefix)
    app.include_router(port_calls.router, prefix=prefix)
    app.include_router(dashboard.router, prefix=prefix)
    return app


app = create_app()
