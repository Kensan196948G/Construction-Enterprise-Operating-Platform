"""federation-service entrypoint (Sprint 2 / BL-008).

起動例:
    uvicorn federation_app.main:app --port 8006 --reload

注意:
    Sprint 2 単体起動時は Policy / Audit client がすべて Stub にフォールバックする。
    本番経路 (BL-013 統合テスト) では POLICY_BASE_URL / AUDIT_BASE_URL を渡し、
    HttpPolicyClient / HttpAuditClient が自動的に選択される。

ADR-002 "Cross Tenant 操作は通常 Object 更新ではなく Federation Event" を実装で固定する唯一の経路:
    すべての Cross Tenant 共有要求は POST /federation-events を通る。
    Object Service / Workflow Service / Knowledge Service から他 Tenant に直接書き込む経路は禁止
    (CLAUDE.md / SERVICE_RESPONSIBILITY_MODEL.md)。
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import federation_demo as federation_demo_api
from .api import federation_events as federation_events_api

app = FastAPI(
    title="Synapse-OS Federation Service",
    version="0.0.1-sprint2",
    description=(
        "Sprint 2 Federation Service (BL-008). POST /federation-events が唯一の Cross Tenant 経路。"
        "Policy Service へ Trust + DLP 評価を委譲し、Shared Audit を source / target 両方に記録する。"
        "Direct Cross Tenant 書き込み / Federation Event 省略 / Shared Audit 省略 は"
        "いずれも禁止 (ADR-002 / ADR-003)。"
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(federation_events_api.router)
app.include_router(federation_demo_api.router)


@app.get("/healthz", tags=["meta"])
def healthz() -> dict[str, str]:
    return {"status": "ok", "service": "federation-service", "sprint": "2"}
