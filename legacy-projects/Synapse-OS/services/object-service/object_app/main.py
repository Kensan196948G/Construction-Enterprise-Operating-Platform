"""object-service entrypoint (Sprint 1 / BL-002).

起動例:
    uvicorn object_app.main:app --port 8004 --reload

注意:
    Sprint 1 単体起動時は Policy / Audit client が Stub にフォールバックする。
    本番経路 (BL-013 統合テスト) では POLICY_BASE_URL / AUDIT_BASE_URL を渡し、
    HttpPolicyClient / HttpAuditClient が自動的に選択される。
"""

from __future__ import annotations

import os
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import documents as documents_api
from .api import issues as issues_api
from .storage.database import init_db

_cors_origins = [
    o.strip()
    for o in os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000").split(",")
]


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    init_db()
    yield


app = FastAPI(
    title="Synapse-OS Object Service",
    version="0.0.2-sprint2",
    lifespan=lifespan,
    description=(
        "Sprint 1 minimum Issue + Sprint 2 Document Object API (BL-002 / BL-007). "
        "POST /issues, POST /documents は Policy Service へ評価を委譲し、"
        "Audit Service に IssueCreated / DocumentCreated を送る。"
        "Direct AI Access / Policy 判定の自前実装 / Audit 省略 はいずれも禁止 "
        "(Service 責務分割 + ADR-001/003)。"
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(issues_api.router)
app.include_router(documents_api.router)


@app.get("/healthz", tags=["meta"])
def healthz() -> dict[str, str]:
    return {"status": "ok", "service": "object-service", "sprint": "1"}
