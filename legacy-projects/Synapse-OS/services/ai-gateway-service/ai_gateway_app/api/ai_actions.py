"""AI Actions API (BL-006 / Sprint 2).

Endpoints:
    POST /ai-actions          : AI Action を生成し Policy 評価 + DLP + Routing + LLM 呼び出し +
                                Audit 送出までを一連で行う (Acceptance 2 を 1 endpoint で満たす)
    GET  /ai-actions          : tenant_id フィルタ付きで一覧 (Audit と同等の "AI 利用履歴")
    GET  /ai-actions/{id}     : 単発取得 (Prompt Audit ID で逆引き)

Acceptance 2 (AI Audit) を 1 endpoint で固定する:
    1. AI 利用は AI Gateway 経由である       -> 本 endpoint が唯一の入口 (ADR-001)
    2. Prompt Audit ID が生成される          -> object_id (aia_*) がそのまま Prompt Audit ID
    3. Model Provider と Model 名が記録される -> AI Action.model_provider / model_name
    4. DLP 判定が AI Action に紐づく          -> AI Action.dlp_result + dlp_findings
    5. Reasoning Summary と参照 Knowledge     -> AI Action.reasoning_summary + context_refs

ADR-006 "AI Action は補助ログではなく独立 Object" を実装で固定:
    - blocked path でも AI Action Object は永続化する
      (試行事実を消さない / Auditability)
    - LLM が呼ばれなかった場合でも reasoning_summary に "なぜ呼ばれなかったか" を入れる
"""

from __future__ import annotations

import hashlib
import os
from datetime import datetime, timezone
from functools import lru_cache

from fastapi import APIRouter, Depends, HTTPException, Query, status
from synapse_shared.enums import Classification, ObjectType, PolicyDecisionType

from ..clients.audit_client import (
    AuditClient,
    HttpAuditClient,
    StubAuditClient,
)
from ..clients.policy_client import (
    HttpPolicyClient,
    PolicyClient,
    StubPolicyClient,
)
from ..llm.llm_client import AnthropicLLMClient, LLMClient, StubLLMClient
from ..schemas.ai_action import (
    AIAction,
    AIActionCreateRequest,
    AIActionExplanation,
    AIActionStatus,
    DLPResult,
    ModelRoute,
)
from ..storage.ai_action_repository import AIActionRepository, get_repository

router = APIRouter(prefix="/ai-actions", tags=["ai-actions"])


@lru_cache(maxsize=1)
def get_policy_client() -> PolicyClient:
    base_url = os.environ.get("POLICY_BASE_URL")
    if base_url:
        return HttpPolicyClient(base_url=base_url)
    return StubPolicyClient()


@lru_cache(maxsize=1)
def get_audit_client() -> AuditClient:
    base_url = os.environ.get("AUDIT_BASE_URL")
    if base_url:
        return HttpAuditClient(base_url=base_url)
    return StubAuditClient()


@lru_cache(maxsize=1)
def get_llm_client() -> LLMClient:
    """Return AnthropicLLMClient when ANTHROPIC_API_KEY is set, else StubLLMClient."""
    if os.environ.get("ANTHROPIC_API_KEY"):
        return AnthropicLLMClient()
    return StubLLMClient()


_LOCAL_PROVIDER = "local-vllm"
_LOCAL_MODEL = "local-llama-3.1-8b"


def _hash_prompt(prompt: str) -> str:
    return "sha256:" + hashlib.sha256(prompt.encode("utf-8")).hexdigest()


def _apply_mask(prompt: str) -> tuple[str, list[str]]:
    """Sprint 2 stub の DLP マスク.

    実 DLP は Sprint 3 で AI_GATEWAY_MODEL の DLP 連携を本実装する。
    ここでは "Confidential を外部送信しようとしたら全文 [REDACTED] に置換する" 最小実装。
    findings は audit に残るので、後段の DLP 強化時にこの list を埋め直すだけで済む。
    """

    return ("[REDACTED]", ["DLP-003: confidential payload masked before external_ai_cloud send"])


def _resolve_outcome(
    *,
    final_decision: str,
    payload: AIActionCreateRequest,
) -> tuple[AIActionStatus, ModelRoute, DLPResult, str, str, bool]:
    """Policy Decision から (status, route, dlp_result, provider, model, should_call_llm) を決定する.

    table-driven. 戻り値の provider/model は LLM 呼び出しに実際に渡す値
    (= local_llm_required の場合は payload の値ではなく local 用に書き換えた値が入る)。
    """

    if final_decision == PolicyDecisionType.DENY.value:
        # DLP-004 等: Restricted の外部送信. LLM 呼ばない.
        return (
            AIActionStatus.BLOCKED,
            ModelRoute.NONE,
            DLPResult.BLOCKED,
            payload.model_provider,
            payload.model_name,
            False,
        )
    if final_decision == PolicyDecisionType.MASK_REQUIRED.value:
        # DLP-003: Confidential を外部送信. mask して呼ぶ.
        return (
            AIActionStatus.MASKED,
            ModelRoute.CLOUD,
            DLPResult.MASKED,
            payload.model_provider,
            payload.model_name,
            True,
        )
    if final_decision == PolicyDecisionType.LOCAL_LLM_REQUIRED.value:
        # Confidential だが local LLM なら可. provider を強制書き換え.
        return (
            AIActionStatus.ROUTED_LOCAL,
            ModelRoute.LOCAL,
            DLPResult.PASS,
            _LOCAL_PROVIDER,
            _LOCAL_MODEL,
            True,
        )
    if final_decision == PolicyDecisionType.ALLOW.value:
        return (
            AIActionStatus.COMPLETED,
            ModelRoute.CLOUD,
            DLPResult.PASS,
            payload.model_provider,
            payload.model_name,
            True,
        )
    # approval_required / federation_review_required / quarantine 等: 呼ばない.
    return (
        AIActionStatus.REVIEW_REQUIRED,
        ModelRoute.NONE,
        DLPResult.PASS,
        payload.model_provider,
        payload.model_name,
        False,
    )


def _build_policy_input(
    *, payload: AIActionCreateRequest, action_id: str
) -> dict[str, str | float | bool]:
    """PolicyDecisionInput と互換な dict.

    object_type=AI_ACTION で評価することで、Policy Engine 側の AI 用 rule
    (DLP-001/003/004) が classification + data_destination の組で発火する。
    """

    return {
        "actor_id": payload.actor_id,
        "actor_type": payload.actor_type,
        "tenant_id": payload.tenant_id,
        "object_type": ObjectType.AI_ACTION.value,
        "object_id": action_id,
        "classification": payload.classification.value,
        "action": payload.requested_action,
        "data_destination": payload.data_destination,
        "model_provider": payload.model_provider,
        "risk_score": payload.risk_score,
        "approval_state": "none",
        "is_state_change": True,
    }


def _build_audit_ingress(
    *,
    payload: AIActionCreateRequest,
    action: AIAction,
    decision: dict[str, object],
    event_type: str,
) -> dict[str, object]:
    """AuditEventIngress と互換な dict.

    correlation_id = ai_action_id とすることで、Prompt Audit ID で
    Audit Timeline を引ける (Acceptance 2 #2)。

    after_state には dlp_result / route / model_provider / model_name を載せる
    -- Audit を読むだけで Acceptance 2 #3/#4 が確認できる形にする。
    """

    return {
        "event_type": event_type,
        "tenant_id": payload.tenant_id,
        "actor_id": payload.actor_id,
        "actor_type": payload.actor_type,
        "action": payload.requested_action,
        "object_id": action.object_id,
        "object_type": ObjectType.AI_ACTION.value,
        "correlation_id": action.object_id,
        "policy_decision_ref": decision.get("policy_decision_id"),
        "policy_result": decision.get("final_decision"),
        "after_state": {
            "status": action.status.value,
            "classification": action.classification.value,
            "model_provider": action.model_provider,
            "model_name": action.model_name,
            "route": action.route.value,
            "dlp_result": action.dlp_result.value,
            "context_refs": list(action.context_refs),
            "data_destination": payload.data_destination,
        },
    }


def _event_type_for_status(status_value: AIActionStatus) -> str:
    if status_value == AIActionStatus.BLOCKED:
        return "AIBlocked"
    if status_value == AIActionStatus.MASKED:
        return "AIMasked"
    if status_value == AIActionStatus.ROUTED_LOCAL:
        return "AIRoutedLocal"
    if status_value == AIActionStatus.REVIEW_REQUIRED:
        return "AIReviewRequired"
    return "AIInvoked"


@router.post(
    "",
    response_model=AIAction,
    status_code=status.HTTP_201_CREATED,
    summary="AI Action を生成する (Policy + DLP + Routing + LLM + Audit を含む唯一の AI 経路)",
)
def create_ai_action(
    payload: AIActionCreateRequest,
    repo: AIActionRepository = Depends(get_repository),
    policy_client: PolicyClient = Depends(get_policy_client),
    audit_client: AuditClient = Depends(get_audit_client),
    llm_client: LLMClient = Depends(get_llm_client),
) -> AIAction:
    action_id = repo.ai_action_id(tenant_id=payload.tenant_id)

    decision = policy_client.evaluate(_build_policy_input(payload=payload, action_id=action_id))
    final_decision = str(decision.get("final_decision", PolicyDecisionType.DENY.value))
    decision_id = decision.get("policy_decision_id")

    (
        action_status,
        route,
        dlp_result,
        used_provider,
        used_model,
        should_call_llm,
    ) = _resolve_outcome(final_decision=final_decision, payload=payload)

    effective_prompt = payload.prompt
    dlp_findings: list[str] = []
    if dlp_result == DLPResult.MASKED:
        effective_prompt, dlp_findings = _apply_mask(payload.prompt)

    response_text: str | None = None
    reasoning_summary: str | None = None
    if should_call_llm:
        llm_resp = llm_client.invoke(
            provider=used_provider,
            model=used_model,
            prompt=effective_prompt,
            context_refs=payload.context_refs,
        )
        response_text = llm_resp.response_text
        reasoning_summary = llm_resp.reasoning_summary
    else:
        # blocked / review_required: LLM は呼ばないが ADR-006 が要求する
        # "なぜこの結果になったか" を reasoning_summary に残す.
        reasons = decision.get("reasons") or []
        reason_text = "; ".join(str(r) for r in reasons) if reasons else final_decision
        reasoning_summary = (
            f"Policy decision={final_decision} blocked LLM invocation. Reasons: {reason_text}"
        )

    action = AIAction(
        object_id=action_id,
        tenant_id=payload.tenant_id,
        owner_id=payload.owner_id,
        classification=payload.classification,
        prompt=effective_prompt,
        prompt_original_hash=_hash_prompt(payload.prompt),
        model_provider=used_provider,
        model_name=used_model,
        context_refs=list(payload.context_refs),
        risk_score=payload.risk_score,
        dlp_result=dlp_result,
        dlp_findings=dlp_findings,
        route=route,
        status=action_status,
        response_text=response_text,
        reasoning_summary=reasoning_summary,
        requested_action=payload.requested_action,
        policy_result_ref=decision_id if decision_id is None else str(decision_id),
    )
    repo.save(action)

    stored = audit_client.append(
        _build_audit_ingress(
            payload=payload,
            action=action,
            decision=decision,
            event_type=_event_type_for_status(action_status),
        )
    )
    audit_event_id = stored.get("audit_event_id")
    if audit_event_id:
        action.audit_event_refs.append(str(audit_event_id))
        action.updated_at = datetime.now(tz=timezone.utc)
        repo.save(action)
    return action


@router.get(
    "/{ai_action_id}/explanation",
    response_model=AIActionExplanation,
    summary="AI Explainability View を取得する (BL-009 / Acceptance 2 #5 / Acceptance 6)",
)
def get_ai_action_explanation(
    ai_action_id: str,
    repo: AIActionRepository = Depends(get_repository),
) -> AIActionExplanation:
    """Acceptance 6 "AI Black Box になっていない" を API として満たす view.

    Workflow / Dashboard が Approval 前に呼び出すことを想定し、prompt 本文や
    response_text は意図的に **含めない** (機密が説明 view 経由で広く伝播するのを防ぐ)。
    """

    action = repo.get(ai_action_id)
    if action is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"ai_action_id not found: {ai_action_id}",
        )
    return AIActionExplanation(
        ai_action_id=action.object_id,
        tenant_id=action.tenant_id,
        status=action.status,
        classification=action.classification,
        model_provider=action.model_provider,
        model_name=action.model_name,
        route=action.route,
        dlp_result=action.dlp_result,
        dlp_findings=list(action.dlp_findings),
        risk_score=action.risk_score,
        reasoning_summary=action.reasoning_summary,
        context_refs=list(action.context_refs),
        policy_decision_ref=action.policy_result_ref,
        audit_event_refs=list(action.audit_event_refs),
    )


@router.get(
    "/{ai_action_id}",
    response_model=AIAction,
    summary="AI Action を Prompt Audit ID で取得する",
)
def get_ai_action(
    ai_action_id: str,
    repo: AIActionRepository = Depends(get_repository),
) -> AIAction:
    action = repo.get(ai_action_id)
    if action is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"ai_action_id not found: {ai_action_id}",
        )
    return action


@router.get(
    "",
    response_model=list[AIAction],
    summary="AI Action を tenant_id でフィルタする",
)
def list_ai_actions(
    tenant_id: str | None = Query(default=None),
    repo: AIActionRepository = Depends(get_repository),
) -> list[AIAction]:
    return repo.list(tenant_id=tenant_id)


# Expose Classification at module-level for tests that want to assert class enum.
__all__ = [
    "router",
    "get_policy_client",
    "get_audit_client",
    "get_llm_client",
    "Classification",
]
