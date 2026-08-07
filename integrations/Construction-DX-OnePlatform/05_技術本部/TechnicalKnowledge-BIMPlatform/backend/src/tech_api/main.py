"""FastAPI エントリポイント."""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routes import (
    bim,
    cim,
    dashboard,
    drawings,
    inquiries,
    knowledge,
    specs,
)


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        description="技術ナレッジ・BIM/CIM 基盤 API (i-Construction 2.0 準拠)",
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
        return {"status": "ok", "service": "cdx-tech-api"}

    prefix = settings.api_v1_prefix
    app.include_router(knowledge.router, prefix=prefix)
    app.include_router(bim.router, prefix=prefix)
    app.include_router(cim.router, prefix=prefix)
    app.include_router(drawings.router, prefix=prefix)
    app.include_router(specs.router, prefix=prefix)
    app.include_router(inquiries.router, prefix=prefix)
    app.include_router(dashboard.router, prefix=prefix)
    return app


app = create_app()
