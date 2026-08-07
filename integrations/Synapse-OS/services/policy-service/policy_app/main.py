"""policy-service entrypoint (Sprint 0).

起動例:
    uvicorn app.main:app --port 8002 --reload
"""

from __future__ import annotations

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from .api import decisions as decisions_api
from .storage.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    init_db()
    yield


app = FastAPI(
    title="Synapse-OS Policy Service",
    version="0.0.1-sprint0",
    lifespan=lifespan,
    description=(
        "Sprint 0 minimum Policy Decision API. "
        "G1 最小ルールセット (AUTHORITY/DLP/AI/FEDERATION/APPROVAL/AUDIT) を評価し、"
        "決定 + 適用ルール + 理由 を返す。"
        "Sprint 0 では in-memory ストア。Sprint 1 で永続化と Audit Service 連携を行う。"
    ),
)

app.include_router(decisions_api.router)


@app.get("/healthz", tags=["meta"])
def healthz() -> dict[str, str]:
    return {"status": "ok", "service": "policy-service", "sprint": "0"}
