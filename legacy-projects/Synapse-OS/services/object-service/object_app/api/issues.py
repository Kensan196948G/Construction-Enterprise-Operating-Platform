"""Issue API (BL-002).

Endpoints:
    POST   /issues          : Issue を生成し Policy 評価 + Audit 送出までを一連で行う
    GET    /issues          : tenant_id フィルタ付きで一覧
    GET    /issues/{id}     : 単発取得 (Audit 記録あり)
    PATCH  /issues/{id}     : 部分更新 (Policy 評価 + Audit 送出)
    DELETE /issues/{id}     : 削除 (Policy 評価 + Audit 送出)

object-service の責務境界 (SERVICE_RESPONSIBILITY_MODEL.md):
    - Policy 最終判断は持たない -> PolicyClient へ委譲
    - Audit 生成は持たない -> AuditClient へ委譲 (Audit Service が id / hash 採番)
    - 状態遷移ロジック (Approval flow) は持たない -> Sprint 1 BL-003 workflow-service が担当
      ここでは Policy 結果から派生する初期 status (draft / submitted / rejected) のみ扱う

DI:
    Policy / Audit client は ``lru_cache`` で env 由来の default を返し、
    test では ``app.dependency_overrides`` で Stub に差し替える。
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from functools import lru_cache

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import Response
from synapse_shared.enums import IssueStatus, ObjectType, PolicyDecisionType

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
from ..schemas.issue import Issue, IssueCreateRequest, IssueUpdateRequest
from ..storage.issue_repository import IssueRepository, get_repository

router = APIRouter(prefix="/issues", tags=["issues"])


@lru_cache(maxsize=1)
def get_policy_client() -> PolicyClient:
    """Default PolicyClient provider.

    POLICY_BASE_URL が設定されていれば本番 HTTP client、そうでなければ Stub。
    test ではここを ``app.dependency_overrides`` で差し替える。
    """

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


def _initial_status(final_decision: str) -> IssueStatus:
    """Policy Decision から Issue の初期 status を導出する.

    Sprint 1 では 3 値しか使わない:
        deny              -> rejected     (生成は許されたが結果として却下)
        allow             -> draft        (作業中。承認 flow は BL-003 が後で起こす)
        その他 (approval_required / mask_required / local_llm_required /
                federation_review_required / quarantine)
                          -> submitted    (Sprint 1 では BL-003 / 後続 sprint で扱う)
    """

    if final_decision == PolicyDecisionType.DENY.value:
        return IssueStatus.REJECTED
    if final_decision == PolicyDecisionType.ALLOW.value:
        return IssueStatus.DRAFT
    return IssueStatus.SUBMITTED


def _build_policy_input(
    *, payload: IssueCreateRequest, issue_id: str
) -> dict[str, str | float | bool]:
    """PolicyDecisionInput と互換な dict を組み立てる."""

    return {
        "actor_id": payload.actor_id,
        "actor_type": payload.actor_type,
        "tenant_id": payload.tenant_id,
        "object_type": ObjectType.ISSUE.value,
        "object_id": issue_id,
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
    payload: IssueCreateRequest,
    issue: Issue,
    decision: dict[str, object],
) -> dict[str, object]:
    """AuditEventIngress と互換な dict を組み立てる.

    correlation_id = issue_id とすることで、Sprint 1 末の統合 test
    "Issue -> Approval -> Audit Timeline 追跡" で一つの軸で全 event を引ける。
    """

    return {
        "event_type": "IssueCreated",
        "tenant_id": payload.tenant_id,
        "actor_id": payload.actor_id,
        "actor_type": payload.actor_type,
        "action": payload.requested_action,
        "object_id": issue.object_id,
        "object_type": ObjectType.ISSUE.value,
        "correlation_id": issue.object_id,
        "policy_decision_ref": decision.get("policy_decision_id"),
        "policy_result": decision.get("final_decision"),
        "after_state": {
            "status": issue.status.value,
            "priority": issue.priority.value,
            "classification": issue.classification.value,
            "title": issue.title,
        },
    }


@router.post(
    "",
    response_model=Issue,
    status_code=status.HTTP_201_CREATED,
    summary="Issue を生成する (Policy 評価 + Audit 送出を含む)",
)
def create_issue(
    payload: IssueCreateRequest,
    repo: IssueRepository = Depends(get_repository),
    policy_client: PolicyClient = Depends(get_policy_client),
    audit_client: AuditClient = Depends(get_audit_client),
) -> Issue:
    issue_id = repo.issue_id(tenant_id=payload.tenant_id)

    decision = policy_client.evaluate(_build_policy_input(payload=payload, issue_id=issue_id))
    final_decision = str(decision.get("final_decision", PolicyDecisionType.DENY.value))
    decision_id = decision.get("policy_decision_id")

    issue = Issue(
        object_id=issue_id,
        tenant_id=payload.tenant_id,
        owner_id=payload.owner_id,
        classification=payload.classification,
        title=payload.title,
        description=payload.description,
        priority=payload.priority,
        status=_initial_status(final_decision),
        requested_action=payload.requested_action,
        policy_result_ref=decision_id,
    )
    repo.save(issue)

    stored = audit_client.append(
        _build_audit_ingress(payload=payload, issue=issue, decision=decision)
    )
    audit_event_id = stored.get("audit_event_id")
    if audit_event_id:
        issue.audit_event_refs.append(str(audit_event_id))
        issue.updated_at = datetime.now(tz=timezone.utc)
        repo.save(issue)
    return issue


@router.get(
    "/{issue_id}",
    response_model=Issue,
    summary="Issue を ID で取得する (record_audit=true 時に Audit 記録)",
)
def get_issue(
    issue_id: str,
    actor_id: str = Query(default="system", description="参照者 Identity ID"),
    actor_type: str = Query(default="human", description="ActorType 値"),
    record_audit: bool = Query(
        default=False,
        description="true を指定した場合のみ IssueRead Audit Event を記録する",
    ),
    repo: IssueRepository = Depends(get_repository),
    audit_client: AuditClient = Depends(get_audit_client),
) -> Issue:
    issue = repo.get(issue_id)
    if issue is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"issue_id not found: {issue_id}",
        )

    if record_audit:
        # Audit: issue.read イベントを記録 (Policy チェック不要)
        audit_ingress = {
            "event_type": "IssueRead",
            "tenant_id": issue.tenant_id,
            "actor_id": actor_id,
            "actor_type": actor_type,
            "action": "issue.read",
            "object_id": issue.object_id,
            "object_type": ObjectType.ISSUE.value,
            "correlation_id": issue.object_id,
            "after_state": {
                "status": issue.status.value,
                "priority": issue.priority.value,
                "classification": issue.classification.value,
                "title": issue.title,
            },
        }
        stored = audit_client.append(audit_ingress)
        audit_event_id = stored.get("audit_event_id")
        if audit_event_id:
            issue.audit_event_refs.append(str(audit_event_id))
            issue.updated_at = datetime.now(tz=timezone.utc)
            repo.save(issue)

    return issue


@router.get(
    "",
    response_model=list[Issue],
    summary="Issue を tenant_id でフィルタする",
)
def list_issues(
    tenant_id: str | None = Query(default=None),
    repo: IssueRepository = Depends(get_repository),
) -> list[Issue]:
    return repo.list(tenant_id=tenant_id)


@router.patch(
    "/{issue_id}",
    response_model=Issue,
    summary="Issue を部分更新する (Policy 評価 + Audit 送出)",
)
def update_issue(
    issue_id: str,
    payload: IssueUpdateRequest,
    repo: IssueRepository = Depends(get_repository),
    policy_client: PolicyClient = Depends(get_policy_client),
    audit_client: AuditClient = Depends(get_audit_client),
) -> Issue:
    issue = repo.get(issue_id)
    if issue is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"issue_id not found: {issue_id}",
        )

    # Policy チェック
    policy_input = {
        "actor_id": payload.actor_id,
        "actor_type": payload.actor_type,
        "tenant_id": issue.tenant_id,
        "object_type": ObjectType.ISSUE.value,
        "object_id": issue_id,
        "classification": issue.classification.value,
        "action": "issue.update",
        "data_destination": payload.data_destination,
        "model_provider": payload.model_provider,
        "risk_score": payload.risk_score,
        "approval_state": "none",
        "is_state_change": True,
    }
    decision = policy_client.evaluate(policy_input)
    final_decision = str(decision.get("final_decision", "deny"))
    decision_id = decision.get("policy_decision_id")

    # Fail-closed: only "allow" passes; "deny" / "approval_required" / unknown all reject
    if final_decision != "allow":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Policy did not allow issue.update (decision={final_decision})",
        )

    # Snapshot before-state and compute after-state BEFORE any mutation.
    before_state = {
        "status": issue.status.value,
        "priority": issue.priority.value,
        "classification": issue.classification.value,
        "title": issue.title,
    }
    after_state = {
        "status": payload.status.value if payload.status is not None else issue.status.value,
        "priority": payload.priority.value if payload.priority is not None else issue.priority.value,
        "classification": issue.classification.value,
        "title": payload.title if payload.title is not None else issue.title,
    }

    # Audit-first: record the governed action before mutating state.
    # If audit append raises, no DB mutation occurs (no "mutated-but-unaudited" state).
    audit_ingress = {
        "event_type": "IssueUpdated",
        "tenant_id": issue.tenant_id,
        "actor_id": payload.actor_id,
        "actor_type": payload.actor_type,
        "action": "issue.update",
        "object_id": issue.object_id,
        "object_type": ObjectType.ISSUE.value,
        "correlation_id": issue.object_id,
        "policy_decision_ref": decision_id,
        "policy_result": final_decision,
        "before_state": before_state,
        "after_state": after_state,
    }
    stored = audit_client.append(audit_ingress)
    audit_event_id = stored.get("audit_event_id")

    # Apply partial update (only after audit succeeded).
    if payload.title is not None:
        issue.title = payload.title
    if payload.description is not None:
        issue.description = payload.description
    if payload.priority is not None:
        issue.priority = payload.priority
    if payload.status is not None:
        issue.status = payload.status
    issue.policy_result_ref = decision_id
    issue.updated_at = datetime.now(tz=timezone.utc)
    if audit_event_id:
        issue.audit_event_refs.append(str(audit_event_id))
    repo.save(issue)

    return issue


@router.delete(
    "/{issue_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_model=None,
    summary="Issue を削除する (Policy 評価 + Audit 送出)",
)
def delete_issue(
    issue_id: str,
    actor_id: str = Query(default="system", description="削除者 Identity ID"),
    actor_type: str = Query(default="human", description="ActorType 値"),
    data_destination: str = Query(default="internal"),
    model_provider: str = Query(default="n/a"),
    risk_score: float = Query(default=0.0, ge=0.0, le=100.0),
    repo: IssueRepository = Depends(get_repository),
    policy_client: PolicyClient = Depends(get_policy_client),
    audit_client: AuditClient = Depends(get_audit_client),
) -> None:
    issue = repo.get(issue_id)
    if issue is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"issue_id not found: {issue_id}",
        )

    # Policy チェック
    policy_input = {
        "actor_id": actor_id,
        "actor_type": actor_type,
        "tenant_id": issue.tenant_id,
        "object_type": ObjectType.ISSUE.value,
        "object_id": issue_id,
        "classification": issue.classification.value,
        "action": "issue.delete",
        "data_destination": data_destination,
        "model_provider": model_provider,
        "risk_score": risk_score,
        "approval_state": "none",
        "is_state_change": True,
    }
    decision = policy_client.evaluate(policy_input)
    final_decision = str(decision.get("final_decision", "deny"))
    decision_id = decision.get("policy_decision_id")

    # Fail-closed policy gate (allow only "allow")
    if final_decision != "allow":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Policy did not allow issue.delete (decision={final_decision})",
        )

    # Before state snapshot for audit
    before_state = {
        "status": issue.status.value,
        "priority": issue.priority.value,
        "classification": issue.classification.value,
        "title": issue.title,
    }

    # Audit-first: record before mutation.
    audit_ingress = {
        "event_type": "IssueDeleted",
        "tenant_id": issue.tenant_id,
        "actor_id": actor_id,
        "actor_type": actor_type,
        "action": "issue.delete",
        "object_id": issue.object_id,
        "object_type": ObjectType.ISSUE.value,
        "correlation_id": issue.object_id,
        "policy_decision_ref": decision_id,
        "policy_result": final_decision,
        "before_state": before_state,
    }
    audit_client.append(audit_ingress)

    # Delete the issue and verify the operation succeeded.
    deleted = repo.delete(issue_id)
    if not deleted:
        # Race: get() saw the issue but delete() did not. Surface as 409.
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"issue_id could not be deleted (race or already removed): {issue_id}",
        )
    return Response(status_code=status.HTTP_204_NO_CONTENT)
