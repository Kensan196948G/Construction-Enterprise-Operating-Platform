"""knowledge-service entrypoint (Sprint 2 / BL-011).

起動例:
    uvicorn knowledge_app.main:app --port 8007 --reload

注意:
    Sprint 2 単体起動時は Policy / Audit client がすべて Stub にフォールバックする。
    本番経路 (BL-013 統合テスト) では POLICY_BASE_URL / AUDIT_BASE_URL を渡し、
    HttpPolicyClient / HttpAuditClient が自動的に選択される。

責務 (SERVICE_RESPONSIBILITY_MODEL.md):
    持つ : Knowledge Graph / Lineage / Retention
    持たない: DLP 最終判断 (Policy Service に委譲)
"""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import knowledge as knowledge_api

app = FastAPI(
    title="Synapse-OS Knowledge Service",
    version="0.0.1-sprint2",
    description=(
        "Sprint 2 Knowledge Service (BL-011). Document/AI Action Lineage Graph + Retention。"
        "AI 由来 Knowledge は ai_action_id 必須 (DATA_LINEAGE_MODEL.md)、"
        "Legal Hold 中 / Federation 由来 / retain_until 未到達 の Knowledge は削除禁止 "
        "(RETENTION_MODEL.md)。DLP 最終判断は Policy Service に委譲する。"
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(knowledge_api.router)


@app.get("/healthz", tags=["meta"])
def healthz() -> dict[str, str]:
    return {"status": "ok", "service": "knowledge-service", "sprint": "2"}
