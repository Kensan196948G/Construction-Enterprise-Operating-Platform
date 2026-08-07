"""Policy Decision API (BL-004).

Endpoints:
    POST /policy-decisions           : 入力に対し Policy Engine を実行し決定を返す
    GET  /policy-decisions/{id}      : 直近で発番された Decision を参照する

設計メモ:
- final_decision が deny / approval_required のときも HTTP 200 を返す。
  これは「ビジネス的判断」であって「リクエスト失敗」ではない。
  Auditability 原則のため、deny も含めて Decision レコードを返却する。
- 404 は「policy_decision_id が存在しない」場合のみ。
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from ..policy_rules.engine import evaluate
from ..schemas.decision import PolicyDecisionInput, PolicyDecisionResult
from ..storage.decision_store import PolicyDecisionStore, get_store

router = APIRouter(prefix="/policy-decisions", tags=["policy-decisions"])


@router.post(
    "",
    response_model=PolicyDecisionResult,
    status_code=status.HTTP_200_OK,
    summary="Policy Decision を発行する",
)
def create_decision(
    payload: PolicyDecisionInput,
    store: PolicyDecisionStore = Depends(get_store),
) -> PolicyDecisionResult:
    decision_id = store.issue_id(tenant_id=payload.tenant_id)
    result = evaluate(payload, decision_id=decision_id)
    store.save(result)
    return result


@router.get(
    "/{policy_decision_id}",
    response_model=PolicyDecisionResult,
    summary="発行済み Policy Decision を参照する",
)
def get_decision(
    policy_decision_id: str,
    store: PolicyDecisionStore = Depends(get_store),
) -> PolicyDecisionResult:
    found = store.get(policy_decision_id)
    if found is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"policy_decision_id not found: {policy_decision_id}",
        )
    return found
