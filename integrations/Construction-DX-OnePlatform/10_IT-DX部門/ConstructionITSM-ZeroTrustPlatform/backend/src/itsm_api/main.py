"""ITSM & ZeroTrust Platform - FastAPI entrypoint."""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from itsm_api.config import get_settings
from itsm_api.routes import (
    ai_helpdesk,
    cmdb,
    dashboard,
    knowledge,
    logs_cisco,
    logs_entra,
    logs_fortigate,
    sla,
    tickets,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logger.info("Starting %s (env=%s)", settings.app_name, settings.environment)
    # Background collectors (syslog, snmp) would be started here in production.
    yield
    logger.info("Shutting down %s", settings.app_name)


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Construction DX ITSM & ZeroTrust Platform API",
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

    app.include_router(tickets.router)
    app.include_router(cmdb.router)
    app.include_router(sla.router)
    app.include_router(logs_fortigate.router)
    app.include_router(logs_cisco.router)
    app.include_router(logs_entra.router)
    app.include_router(ai_helpdesk.router)
    app.include_router(knowledge.router)
    app.include_router(dashboard.router)

    return app


app = create_app()
