"""ai-gateway-service entrypoint (Sprint 2 / BL-006).

起動例:
    uvicorn ai_gateway_app.main:app --port 8005 --reload

注意:
    Sprint 2 単体起動時は Policy / Audit / LLM client がすべて Stub にフォールバックする。
    本番経路 (BL-013 統合テスト) では POLICY_BASE_URL / AUDIT_BASE_URL を渡し、
    HttpPolicyClient / HttpAuditClient が自動的に選択される。LLM 接続は
    Sprint 3 以降で本物 (OpenAI / Anthropic / Local vLLM) に差し替える。

ADR-001 "Direct AI Access 禁止" を実装で固定する唯一の経路:
    すべての AI 呼び出しは POST /ai-actions を通る。Object Service / Integration Service /
    UX から外部 LLM への直接 API 呼び出しは禁止 (CLAUDE.md / SERVICE_RESPONSIBILITY_MODEL.md)。
"""

from __future__ import annotations

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api import ai_actions as ai_actions_api

_cors_origins = [
    o.strip()
    for o in os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000").split(",")
]

app = FastAPI(
    title="Synapse-OS AI Gateway Service",
    version="0.0.1-sprint2",
    description=(
        "Sprint 2 AI Gateway (BL-006). POST /ai-actions が唯一の AI 経路。"
        "Policy Service へ評価を委譲し、DLP マスク / Model Routing / "
        "Audit Service への AIInvoked / AIBlocked / AIMasked 送出までを一連で行う。"
        "Direct AI Access / Policy 判定の自前実装 / Audit 省略 / "
        "AI Action Object 省略 はいずれも禁止 (ADR-001 / ADR-003 / ADR-006)。"
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_actions_api.router)


@app.get("/healthz", tags=["meta"])
def healthz() -> dict[str, str]:
    return {"status": "ok", "service": "ai-gateway-service", "sprint": "2"}
