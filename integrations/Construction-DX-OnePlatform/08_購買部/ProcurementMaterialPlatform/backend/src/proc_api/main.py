"""FastAPI エントリポイント."""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routes import (
    dashboard,
    deliveries,
    inventory,
    orders,
    prices,
    requests,
    suppliers,
)


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        description="購買・調達・資材管理プラットフォーム API",
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
        return {"status": "ok", "service": "cdx-proc-api"}

    prefix = settings.api_v1_prefix
    app.include_router(suppliers.router, prefix=prefix)
    app.include_router(requests.router, prefix=prefix)
    app.include_router(orders.router, prefix=prefix)
    app.include_router(deliveries.router, prefix=prefix)
    app.include_router(inventory.router, prefix=prefix)
    app.include_router(prices.router, prefix=prefix)
    app.include_router(dashboard.router, prefix=prefix)
    return app


app = create_app()
