"""Federation Events API (BL-008 / Sprint 2).

Endpoints:
    POST /federation-events             : Federation Event を生成し Policy 評価 + Trust 確認 +
                                          Shared Audit までを一連で行う (Acceptance 4 を 1 endpoint で満たす)
    GET  /federation-events             : tenant_id + as_target=bool で source/target 両方向の一覧
    GET  /federation-events/{id}        : 単発取得 (Federation Event ID で逆引き)

Acceptance 4 (Federation Auth / Boundary) を 1 endpoint で固定する:
    1. A社/B社/C社 の Tenant 区別                  -> source != target を Schema validator で必須化
    2. Cross Tenant 共有要求が Federation Event に  -> 本 endpoint が唯一の経路 (ADR-002)
    3. Trust Level 表示                            -> response.trust_level
    4. 双方承認 / Policy 判定残存                   -> status + policy_result_ref
    5. Shared Audit に記録                          -> SHARED 経路で source / target 両 tenant_id に
                                                     同一 correlation_id (= federation_event_id) で append

ADR-002 "Cross Tenant 操作は通常 Object 更新ではなく Federation Event" を実装で固定:
    - blocked path でも Federation Event Object は永続化する (試行事実を消さない)
    - federation_review_required は status=REVIEW_REQUIRED として残し、後続 Workflow の判断材料にする
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from functools import lru_cache

from fastapi import APIRouter, Depends, HTTPException, Query, status
from synapse_shared.enums import ObjectType, PolicyDecisionType

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
from ..schemas.federation_event import (
    AuditBoundary,
    FederationEvent,
    FederationEventCreateRequest,
    FederationEventStatus,
)
from ..storage.federation_event_repository import (
    FederationEventRepository,
    get_repository,
)

router = APIRouter(prefix="/federation-events", tags=["federation-events"])


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


def _resolve_outcome(
    final_decision: str,
) -> tuple[FederationEventStatus, AuditBoundary]:
    """Policy Decision -> (status, audit_boundary).

    table-driven. blocked のときだけ audit_boundary を SOURCE_ONLY に縮退させる
    (target が拒否を表明した場合に target tenant_id へは追記しない方針)。
    """

    if final_decision == PolicyDecisionType.ALLOW.value:
        return (FederationEventStatus.APPROVED, AuditBoundary.SHARED)
    if final_decision == PolicyDecisionType.DENY.value:
        return (FederationEventStatus.BLOCKED, AuditBoundary.SOURCE_ONLY)
    # federation_review_required / approval_required / mask_required / quarantine 等:
    # すべて REVIEW_REQUIRED に丸める. SHARED にして双方が監査参照できるようにする.
    return (FederationEventStatus.REVIEW_REQUIRED, AuditBoundary.SHARED)


def _build_policy_input(
    *, payload: FederationEventCreateRequest, event_id: str
) -> dict[str, str | float | bool]:
    """Federation Event 用 Policy 入力.

    - object_type=FEDERATION_EVENT で評価することで、Policy Engine 側の Federation rule
      (Trust Level x classification x target_tenant) が発火する。
    - target_tenant は通常 PolicyDecisionInput には無いが Federation 評価では必須なので、
      input_snapshot に拡張属性として渡す (Policy Engine 側で trust evaluation に使う)。
    - data_destination は cross-tenant 表現として "tenant:{target}" を使う。
      これにより既存の data_destination 上の DLP rule 群と整合する。
    """

    return {
        "actor_id": payload.actor_id,
        "actor_type": payload.actor_type,
        "tenant_id": payload.source_tenant,
        "object_type": ObjectType.FEDERATION_EVENT.value,
        "object_id": event_id,
        "classification": payload.classification.value,
        "action": payload.requested_action,
        "data_destination": f"tenant:{payload.target_tenant}",
        "trust_level": payload.trust_level.value,
        "target_tenant": payload.target_tenant,
        "shared_object_id": payload.shared_object_id,
        "shared_object_type": payload.shared_object_type.value,
        "policy_binding": payload.policy_binding,
        "risk_score": payload.risk_score,
        "approval_state": "none",
        "is_state_change": True,
    }


def _build_audit_ingress(
    *,
    tenant_id: str,
    payload: FederationEventCreateRequest,
    event: FederationEvent,
    decision: dict[str, object],
    event_type: str,
) -> dict[str, object]:
    """AuditEventIngress と互換な dict.

    correlation_id = federation_event_id とすることで、source 側からも target 側からも
    Audit Timeline で同じ FederationEvent を引ける (= Shared Audit / Acceptance 4 #5)。

    after_state には trust_level / status / shared_object を載せる。
    """

    return {
        "event_type": event_type,
        "tenant_id": tenant_id,
        "actor_id": payload.actor_id,
        "actor_type": payload.actor_type,
        "action": payload.requested_action,
        "object_id": event.object_id,
        "object_type": ObjectType.FEDERATION_EVENT.value,
        "correlation_id": event.object_id,
        "policy_decision_ref": decision.get("policy_decision_id"),
        "policy_result": decision.get("final_decision"),
        "after_state": {
            "status": event.status.value,
            "classification": event.classification.value,
            "source_tenant": event.source_tenant,
            "target_tenant": event.target_tenant,
            "shared_object_id": event.shared_object_id,
            "shared_object_type": event.shared_object_type.value,
            "trust_level": event.trust_level.value,
            "policy_binding": event.policy_binding,
            "audit_boundary": event.audit_boundary.value,
        },
    }


def _event_type_for_status(status_value: FederationEventStatus) -> str:
    if status_value == FederationEventStatus.BLOCKED:
        return "FederationBlocked"
    if status_value == FederationEventStatus.REVIEW_REQUIRED:
        return "FederationReviewRequired"
    return "FederationShared"


@router.post(
    "",
    response_model=FederationEvent,
    status_code=status.HTTP_201_CREATED,
    summary="Federation Event を生成する (Policy + Trust + Shared Audit を含む唯一の Cross Tenant 経路)",
)
def create_federation_event(
    payload: FederationEventCreateRequest,
    repo: FederationEventRepository = Depends(get_repository),
    policy_client: PolicyClient = Depends(get_policy_client),
    audit_client: AuditClient = Depends(get_audit_client),
) -> FederationEvent:
    event_id = repo.federation_event_id(source_tenant=payload.source_tenant)

    decision = policy_client.evaluate(_build_policy_input(payload=payload, event_id=event_id))
    final_decision = str(decision.get("final_decision", PolicyDecisionType.DENY.value))
    decision_id = decision.get("policy_decision_id")

    event_status, audit_boundary = _resolve_outcome(final_decision)

    reasons = decision.get("reasons") or []
    reason_text = "; ".join(str(r) for r in reasons) if reasons else final_decision
    reasoning_summary = (
        f"Policy decision={final_decision}. Reasons: {reason_text}"
    )

    event = FederationEvent(
        object_id=event_id,
        tenant_id=payload.source_tenant,
        owner_id=payload.owner_id,
        classification=payload.classification,
        source_tenant=payload.source_tenant,
        target_tenant=payload.target_tenant,
        shared_object_id=payload.shared_object_id,
        shared_object_type=payload.shared_object_type,
        trust_level=payload.trust_level,
        policy_binding=payload.policy_binding,
        audit_boundary=audit_boundary,
        risk_score=payload.risk_score,
        status=event_status,
        reasoning_summary=reasoning_summary,
        requested_action=payload.requested_action,
        policy_result_ref=decision_id if decision_id is None else str(decision_id),
    )
    repo.save(event)

    event_type = _event_type_for_status(event_status)
    audit_event_ids: list[str] = []

    # source 側 Audit (常に append)
    stored_source = audit_client.append(
        _build_audit_ingress(
            tenant_id=payload.source_tenant,
            payload=payload,
            event=event,
            decision=decision,
            event_type=event_type,
        )
    )
    if (sid := stored_source.get("audit_event_id")):
        audit_event_ids.append(str(sid))

    # target 側 Audit (Shared Audit の場合のみ. SOURCE_ONLY = blocked では追記しない)
    if audit_boundary == AuditBoundary.SHARED:
        stored_target = audit_client.append(
            _build_audit_ingress(
                tenant_id=payload.target_tenant,
                payload=payload,
                event=event,
                decision=decision,
                event_type=event_type,
            )
        )
        if (tid := stored_target.get("audit_event_id")):
            audit_event_ids.append(str(tid))

    if audit_event_ids:
        event.audit_event_refs.extend(audit_event_ids)
        event.updated_at = datetime.now(tz=timezone.utc)
        repo.save(event)
    return event


@router.get(
    "/{federation_event_id}",
    response_model=FederationEvent,
    summary="Federation Event を ID で取得する",
)
def get_federation_event(
    federation_event_id: str,
    repo: FederationEventRepository = Depends(get_repository),
) -> FederationEvent:
    event = repo.get(federation_event_id)
    if event is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"federation_event_id not found: {federation_event_id}",
        )
    return event


@router.get(
    "",
    response_model=list[FederationEvent],
    summary="Federation Event を tenant_id でフィルタする (source / target 両方向)",
)
def list_federation_events(
    tenant_id: str | None = Query(default=None),
    as_target: bool = Query(
        default=False,
        description="True にすると target_tenant=tenant_id でフィルタする (受信側 view).",
    ),
    repo: FederationEventRepository = Depends(get_repository),
) -> list[FederationEvent]:
    return repo.list(tenant_id=tenant_id, as_target=as_target)


__all__ = [
    "router",
    "get_policy_client",
    "get_audit_client",
]
