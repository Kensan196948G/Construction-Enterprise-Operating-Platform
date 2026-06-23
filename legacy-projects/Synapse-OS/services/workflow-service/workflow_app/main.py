"""workflow-service entrypoint (Sprint 1 / BL-003).

起動例:
    uvicorn workflow_app.main:app --port 8005 --reload

注意:
    Sprint 1 単体起動時は Policy / Audit / Object client が Stub にフォールバックする。
    本番経路 (BL-013 統合テスト) では POLICY_BASE_URL / AUDIT_BASE_URL / OBJECT_BASE_URL
    を渡し、HttpPolicyClient / HttpAuditClient / HttpObjectClient が自動的に選択される。
"""

from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import approvals as approvals_api

_cors_origins = [
    o.strip()
    for o in os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000").split(",")
]

app = FastAPI(
    title="Synapse-OS Workflow Service",
    version="0.0.1-sprint1",
    description=(
        "Sprint 1 minimum Approval Workflow API (BL-003 / ADR-005). "
        "POST /approvals は object-service から Issue を取得し、Policy 評価を経由した上で "
        "Approval Object を生成、Audit Service に ApprovalDecided を送る。"
        "承認迂回 (Policy deny) は Approval を作らず ApprovalRequested-blocked-by-policy "
        "を Audit に残すことで監査可能性を維持する。"
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(approvals_api.router)


@app.get("/healthz", tags=["meta"])
def healthz() -> dict[str, str]:
    return {"status": "ok", "service": "workflow-service", "sprint": "1"}
