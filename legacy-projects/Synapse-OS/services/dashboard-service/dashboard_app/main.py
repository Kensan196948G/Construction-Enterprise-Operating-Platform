"""dashboard-service entrypoint (Sprint 1 / BL-010).

起動例:
    uvicorn dashboard_app.main:app --port 8010 --reload

注意:
    Sprint 1 単体起動時は Issue / Approval / Audit client が Stub にフォールバックする。
    本番経路 (BL-013 統合テスト) では OBJECT_BASE_URL / WORKFLOW_BASE_URL / AUDIT_BASE_URL
    を渡し、Http*ReadClient が選択される。
"""

from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import dashboard as dashboard_api

_cors_origins = [
    o.strip()
    for o in os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000").split(",")
]

app = FastAPI(
    title="Synapse-OS Dashboard Service",
    version="0.0.1-sprint1",
    description=(
        "Sprint 1 minimum Enterprise Dashboard API (BL-010 / Acceptance 5). "
        "Issue / Approval / Audit Service の REST を読み込み、"
        "G1_MVP_SCREEN_FIELD_LIST.md の Dashboard 必須項目を返す。"
        "業務状態の直接変更は持たない (read-only service)。"
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard_api.router)


@app.get("/healthz", tags=["meta"])
def healthz() -> dict[str, str]:
    return {"status": "ok", "service": "dashboard-service", "sprint": "1"}
