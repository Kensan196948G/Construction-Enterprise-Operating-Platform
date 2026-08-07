"""Approval API (BL-003 / ADR-005).

Endpoints:
    POST /approvals             : Approval を提出し Policy 評価 + Audit 送出までを一連で行う
    GET  /approvals             : tenant_id / issue_id フィルタ付きで一覧
    GET  /approvals/{id}        : 単発取得

責務境界 (SERVICE_RESPONSIBILITY_MODEL.md):
    - Issue 永続化は持たない -> ObjectClient で object-service に問い合わせ
    - Policy 最終判断は持たない -> PolicyClient へ委譲 (action="approval.decide")
    - Audit 生成は持たない -> AuditClient へ委譲

承認迂回 (ADR-005 + Workflow Test "承認迂回の拒否") の扱い:
    Policy が deny を返した場合、Approval Object は **作成しない**。
    その代わり Auditability を満たすため、Audit Service に
    ``ApprovalRequested`` event (after_state.status = "rejected_by_policy") を残す。
    これにより「迂回しようとした事実」だけが Timeline に固定される。

correlation_id:
    BL-002 と同じく ``correlation_id = issue_id`` を強制する。これで Sprint 1 末
    の Timeline integration test で IssueCreated -> ApprovalDecided が
    同一 correlation_id で取り出せる。
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from functools import lru_cache

from fastapi import APIRouter, Depends, HTTPException, Query, status
from synapse_shared.enums import (
    ApprovalDecision,
    ObjectType,
    PolicyDecisionType,
)

from ..clients.audit_client import AuditClient, HttpAuditClient, StubAuditClient
from ..clients.object_client import (
    HttpObjectClient,
    IssueNotFound,
    ObjectClient,
    StubObjectClient,
)
from ..clients.policy_client import HttpPolicyClient, PolicyClient, StubPolicyClient
from ..schemas.approval import Approval, ApprovalCreateRequest
from ..storage.approval_repository import ApprovalRepository, get_repository

router = APIRouter(prefix="/approvals", tags=["approvals"])


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
def get_object_client() -> ObjectClient:
    base_url = os.environ.get("OBJECT_BASE_URL")
    if base_url:
        return HttpObjectClient(base_url=base_url)
    return StubObjectClient()


def _build_policy_input(
    *,
    payload: ApprovalCreateRequest,
    issue: dict[str, object],
    approval_id: str,
) -> dict[str, object]:
    """PolicyDecisionInput と互換な dict を組み立てる.

    Approval 評価では Issue の classification を引き継ぐ
    (= Restricted Issue は Approval 自身も Restricted として評価される)。
    """

    return {
        "actor_id": payload.approver_id,
        "actor_type": payload.actor_type,
        "tenant_id": payload.tenant_id,
        "object_type": ObjectType.APPROVAL.value,
        "object_id": approval_id,
        "classification": issue.get("classification", "internal"),
        "action": payload.requested_action,
        "data_destination": payload.data_destination,
        "model_provider": payload.model_provider,
        "risk_score": payload.risk_score,
        "approval_state": payload.decision.value,
        "is_state_change": True,
        "is_approval_decision": True,
    }


def _build_decided_audit(
    *,
    payload: ApprovalCreateRequest,
    approval: Approval,
    decision: dict[str, object],
) -> dict[str, object]:
    """ApprovalDecided event 用 ingress dict.

    ``correlation_id = issue_id`` で Issue Timeline に積み上がる。
    """

    return {
        "event_type": "ApprovalDecided",
        "tenant_id": payload.tenant_id,
        "actor_id": payload.approver_id,
        "actor_type": payload.actor_type,
        "action": payload.requested_action,
        "object_id": approval.object_id,
        "object_type": ObjectType.APPROVAL.value,
        "correlation_id": approval.issue_id,
        "policy_decision_ref": decision.get("policy_decision_id"),
        "policy_result": decision.get("final_decision"),
        "after_state": {
            "approval_id": approval.object_id,
            "issue_id": approval.issue_id,
            "decision": approval.decision.value,
            "reason": approval.reason,
        },
    }


def _build_bypass_blocked_audit(
    *,
    payload: ApprovalCreateRequest,
    issue: dict[str, object],
    decision: dict[str, object],
) -> dict[str, object]:
    """承認迂回 deny 時の Audit ingress.

    Approval Object は永続化しないが、Auditability のために
    「迂回しようとした事実」を Issue 軸の Timeline に残す。
    object_id は対象 Issue を指す (= まだ Approval が存在しないため)。
    """

    return {
        "event_type": "ApprovalRequested",
        "tenant_id": payload.tenant_id,
        "actor_id": payload.approver_id,
        "actor_type": payload.actor_type,
        "action": payload.requested_action,
        "object_id": payload.issue_id,
        "object_type": ObjectType.ISSUE.value,
        "correlation_id": payload.issue_id,
        "policy_decision_ref": decision.get("policy_decision_id"),
        "policy_result": decision.get("final_decision"),
        "after_state": {
            "issue_id": payload.issue_id,
            "issue_classification": issue.get("classification"),
            "decision": "rejected_by_policy",
            "reason": payload.reason,
            "attempted_action": payload.requested_action,
        },
    }


@router.post(
    "",
    response_model=Approval,
    status_code=status.HTTP_201_CREATED,
    summary="Approval を提出する (Policy 評価 + Audit 送出を含む)",
)
def create_approval(
    payload: ApprovalCreateRequest,
    repo: ApprovalRepository = Depends(get_repository),
    policy_client: PolicyClient = Depends(get_policy_client),
    audit_client: AuditClient = Depends(get_audit_client),
    object_client: ObjectClient = Depends(get_object_client),
) -> Approval:
    if payload.decision == ApprovalDecision.PENDING:
        raise HTTPException(
            status_code=422,  # HTTP_422_UNPROCESSABLE_CONTENT — integer to avoid Starlette version skew
            detail="decision=pending は POST /approvals では受け付けない (判断の不在を Audit に書けないため)",
        )

    try:
        issue = object_client.get_issue(payload.issue_id)
    except IssueNotFound as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"issue_id not found: {payload.issue_id}",
        ) from exc

    if issue.get("tenant_id") != payload.tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="tenant_id mismatch between approval payload and target issue (cross-tenant approvals must go through Federation)",
        )

    approval_id = repo.approval_id(tenant_id=payload.tenant_id)
    decision = policy_client.evaluate(
        _build_policy_input(payload=payload, issue=issue, approval_id=approval_id)
    )
    final_decision = str(decision.get("final_decision", PolicyDecisionType.DENY.value))

    if final_decision == PolicyDecisionType.DENY.value:
        audit_client.append(
            _build_bypass_blocked_audit(payload=payload, issue=issue, decision=decision)
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "message": "approval blocked by policy",
                "policy_decision_id": decision.get("policy_decision_id"),
                "reasons": decision.get("reasons", []),
            },
        )

    approval = Approval(
        object_id=approval_id,
        tenant_id=payload.tenant_id,
        owner_id=payload.approver_id,
        classification=issue.get("classification", "internal"),
        issue_id=payload.issue_id,
        approver_id=payload.approver_id,
        decision=payload.decision,
        reason=payload.reason,
        decided_at=datetime.now(tz=timezone.utc),
        requested_action=payload.requested_action,
        policy_result_ref=decision.get("policy_decision_id"),
    )
    repo.save(approval)

    stored = audit_client.append(
        _build_decided_audit(payload=payload, approval=approval, decision=decision)
    )
    audit_event_id = stored.get("audit_event_id")
    if audit_event_id:
        approval.audit_event_refs.append(str(audit_event_id))
        approval.updated_at = datetime.now(tz=timezone.utc)
        repo.save(approval)
    return approval


@router.get(
    "/{approval_id}",
    response_model=Approval,
    summary="Approval を ID で取得する",
)
def get_approval(
    approval_id: str,
    repo: ApprovalRepository = Depends(get_repository),
) -> Approval:
    approval = repo.get(approval_id)
    if approval is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"approval_id not found: {approval_id}",
        )
    return approval


@router.get(
    "",
    response_model=list[Approval],
    summary="Approval を tenant_id / issue_id でフィルタする",
)
def list_approvals(
    tenant_id: str | None = Query(default=None),
    issue_id: str | None = Query(default=None),
    repo: ApprovalRepository = Depends(get_repository),
) -> list[Approval]:
    return repo.list(tenant_id=tenant_id, issue_id=issue_id)
