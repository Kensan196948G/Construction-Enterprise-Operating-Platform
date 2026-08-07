"""Integrated Data Lake & Digital Twin Platform - FastAPI entrypoint."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from data_api.config import get_settings
from data_api.routes import (
    ai_models,
    analytics,
    dashboard,
    digital_twin,
    etl,
    iot,
    lake,
    search,
    sources,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logger.info("Starting %s (env=%s)", settings.app_name, settings.environment)
    # In production: launch MQTT subscriber / Airflow client warmup here.
    yield
    logger.info("Shutting down %s", settings.app_name)


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Construction DX Integrated Data Lake & Digital Twin API",
        version="0.1.0",
        debug=settings.debug,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health", tags=["meta"])
    def health() -> dict:
        return {"status": "ok", "service": settings.app_name}

    app.include_router(sources.router)
    app.include_router(etl.router)
    app.include_router(lake.router)
    app.include_router(analytics.router)
    app.include_router(ai_models.router)
    app.include_router(iot.router)
    app.include_router(digital_twin.router)
    app.include_router(search.router)
    app.include_router(dashboard.router)

    return app


app = create_app()
