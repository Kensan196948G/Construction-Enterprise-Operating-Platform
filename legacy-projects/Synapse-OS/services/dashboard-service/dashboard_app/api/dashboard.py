"""Dashboard API (BL-010 / Acceptance 5).

エンドポイント (read-only):
    GET /dashboard/enterprise-health  : Enterprise Health 4 値だけ返す軽量経路
    GET /dashboard/overview           : 全 area + recent_issues / recent_approvals

責務 (SERVICE_RESPONSIBILITY_MODEL "Dashboard Service"):
    - 集計と状態可視化のみを担う
    - **業務状態の直接変更を持たない** (= POST/PUT/DELETE エンドポイントを公開しない)
    - Object/Workflow/Audit Service の REST API を読むだけで永続化はしない

集計ルール (Sprint 1):
    open_issue_count        = Issue.status != closed
    pending_approval_count  = Issue.status == approval_required
    critical_audit_count    = Audit.policy_result == "deny"

AI/DLP/Federation セクションは Sprint 2 で AI Gateway / Document /
Federation Service が立ち上がるまで sprint_ready=False で 0 を返す。
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from functools import lru_cache
from typing import Any

from fastapi import APIRouter, Depends, Query
from synapse_shared.enums import IssueStatus, PolicyDecisionType

from ..clients.ai_gateway_client import (
    AIGatewayReadClient,
    HttpAIGatewayReadClient,
    StubAIGatewayReadClient,
)
from ..clients.approval_client import (
    ApprovalReadClient,
    HttpApprovalReadClient,
    StubApprovalReadClient,
)
from ..clients.audit_client import (
    AuditReadClient,
    HttpAuditReadClient,
    StubAuditReadClient,
)
from ..clients.federation_client import (
    FederationReadClient,
    HttpFederationReadClient,
    StubFederationReadClient,
)
from ..clients.issue_client import (
    HttpIssueReadClient,
    IssueReadClient,
    StubIssueReadClient,
)
from ..clients.policy_client import (
    HttpPolicyReadClient,
    PolicyReadClient,
    StubPolicyReadClient,
)
from ..schemas.dashboard import (
    AIActivity,
    ApprovalRef,
    DashboardSummary,
    DLPAlerts,
    EnterpriseHealth,
    FederationStats,
    GovernanceMetrics,
    IssueRef,
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

SPRINT = "1"
RECENT_LIMIT = 5


@lru_cache(maxsize=1)
def get_issue_client() -> IssueReadClient:
    base_url = os.environ.get("OBJECT_BASE_URL")
    if base_url:
        return HttpIssueReadClient(base_url=base_url)
    return StubIssueReadClient()


@lru_cache(maxsize=1)
def get_approval_client() -> ApprovalReadClient:
    base_url = os.environ.get("WORKFLOW_BASE_URL")
    if base_url:
        return HttpApprovalReadClient(base_url=base_url)
    return StubApprovalReadClient()


@lru_cache(maxsize=1)
def get_audit_client() -> AuditReadClient:
    base_url = os.environ.get("AUDIT_BASE_URL")
    if base_url:
        return HttpAuditReadClient(base_url=base_url)
    return StubAuditReadClient()


@lru_cache(maxsize=1)
def get_ai_gateway_client() -> AIGatewayReadClient:
    base_url = os.environ.get("AI_GATEWAY_BASE_URL")
    if base_url:
        return HttpAIGatewayReadClient(base_url=base_url)
    return StubAIGatewayReadClient()


@lru_cache(maxsize=1)
def get_federation_client() -> FederationReadClient:
    base_url = os.environ.get("FEDERATION_BASE_URL")
    if base_url:
        return HttpFederationReadClient(base_url=base_url)
    return StubFederationReadClient()


@lru_cache(maxsize=1)
def get_policy_read_client() -> PolicyReadClient:
    base_url = os.environ.get("POLICY_BASE_URL")
    if base_url:
        return HttpPolicyReadClient(base_url=base_url)
    return StubPolicyReadClient()


def _aggregate_governance_metrics(
    *,
    policy_decisions: list[dict[str, Any]],
    audit_events: list[dict[str, Any]],
    ai_actions: list[dict[str, Any]],
    federation_events: list[dict[str, Any]],
) -> GovernanceMetrics:
    """Policy decisions / Audit events / AI actions / Federation events を集計する."""

    from datetime import timezone as _tz

    from synapse_shared.enums import PolicyDecisionType

    # Policy decisions の allow / deny / review_required カウント
    policy_allow = sum(
        1
        for d in policy_decisions
        if d.get("final_decision") == PolicyDecisionType.ALLOW.value
    )
    policy_deny = sum(
        1
        for d in policy_decisions
        if d.get("final_decision") == PolicyDecisionType.DENY.value
    )
    policy_review = sum(
        1
        for d in policy_decisions
        if d.get("final_decision") not in (
            PolicyDecisionType.ALLOW.value,
            PolicyDecisionType.DENY.value,
        )
    )

    # AI actions の blocked カウント (status == "blocked")
    ai_blocked = sum(1 for a in ai_actions if a.get("status") == "blocked")

    # Federation events の blocked カウント (status == "blocked")
    fed_blocked = sum(1 for e in federation_events if e.get("status") == "blocked")

    from datetime import datetime as _dt

    return GovernanceMetrics(
        policy_allow_count=policy_allow,
        policy_deny_count=policy_deny,
        policy_review_required_count=policy_review,
        audit_event_count=len(audit_events),
        ai_action_count=len(ai_actions),
        ai_action_blocked_count=ai_blocked,
        federation_event_count=len(federation_events),
        federation_blocked_count=fed_blocked,
        last_updated=_dt.now(tz=_tz.utc),
    )


def _aggregate_enterprise_health(
    *,
    issues: list[dict[str, Any]],
    audits: list[dict[str, Any]],
) -> EnterpriseHealth:
    open_count = sum(1 for i in issues if i.get("status") != IssueStatus.CLOSED.value)
    pending_count = sum(
        1 for i in issues if i.get("status") == IssueStatus.APPROVAL_REQUIRED.value
    )
    critical_count = sum(
        1 for e in audits if e.get("policy_result") == PolicyDecisionType.DENY.value
    )
    return EnterpriseHealth(
        open_issue_count=open_count,
        pending_approval_count=pending_count,
        critical_audit_count=critical_count,
    )


def _recent_issues(issues: list[dict[str, Any]]) -> list[IssueRef]:
    sorted_issues = sorted(
        issues, key=lambda i: i.get("created_at") or "", reverse=True
    )
    return [
        IssueRef(
            object_id=i["object_id"],
            title=i.get("title", ""),
            status=i.get("status", ""),
            priority=i.get("priority", ""),
            classification=i.get("classification", ""),
        )
        for i in sorted_issues[:RECENT_LIMIT]
    ]


def _recent_approvals(approvals: list[dict[str, Any]]) -> list[ApprovalRef]:
    sorted_approvals = sorted(
        approvals, key=lambda a: a.get("decided_at") or "", reverse=True
    )
    return [
        ApprovalRef(
            object_id=a["object_id"],
            issue_id=a["issue_id"],
            decision=a.get("decision", ""),
            approver_id=a.get("approver_id", ""),
        )
        for a in sorted_approvals[:RECENT_LIMIT]
    ]


@router.get(
    "/enterprise-health",
    response_model=EnterpriseHealth,
    summary="Enterprise Health area の 3 値だけを軽量に返す",
)
def get_enterprise_health(
    tenant_id: str = Query(..., description="集計対象 Tenant"),
    issue_client: IssueReadClient = Depends(get_issue_client),
    audit_client: AuditReadClient = Depends(get_audit_client),
) -> EnterpriseHealth:
    issues = issue_client.list(tenant_id=tenant_id)
    audits = audit_client.list(tenant_id=tenant_id)
    return _aggregate_enterprise_health(issues=issues, audits=audits)


@router.get(
    "/overview",
    response_model=DashboardSummary,
    summary="全 area + recent_issues/recent_approvals を返す",
)
def get_overview(
    tenant_id: str = Query(..., description="集計対象 Tenant"),
    issue_client: IssueReadClient = Depends(get_issue_client),
    approval_client: ApprovalReadClient = Depends(get_approval_client),
    audit_client: AuditReadClient = Depends(get_audit_client),
) -> DashboardSummary:
    issues = issue_client.list(tenant_id=tenant_id)
    approvals = approval_client.list(tenant_id=tenant_id)
    audits = audit_client.list(tenant_id=tenant_id)

    return DashboardSummary(
        tenant_id=tenant_id,
        generated_at=datetime.now(tz=timezone.utc),
        sprint=SPRINT,
        enterprise_health=_aggregate_enterprise_health(issues=issues, audits=audits),
        ai_activity=AIActivity(),  # Sprint 2 で sprint_ready=True に切替
        dlp_alerts=DLPAlerts(),
        federation_stats=FederationStats(),
        recent_issues=_recent_issues(issues),
        recent_approvals=_recent_approvals(approvals),
    )


@router.get(
    "/governance-metrics",
    response_model=GovernanceMetrics,
    summary="Governance KPI を集計して返す (Sprint 4)",
)
def get_governance_metrics(
    tenant_id: str = Query(..., description="集計対象 Tenant"),
    audit_client: AuditReadClient = Depends(get_audit_client),
    ai_gateway_client: AIGatewayReadClient = Depends(get_ai_gateway_client),
    federation_client: FederationReadClient = Depends(get_federation_client),
    policy_client: PolicyReadClient = Depends(get_policy_read_client),
) -> GovernanceMetrics:
    policy_decisions = policy_client.list(tenant_id=tenant_id)
    audit_events = audit_client.list(tenant_id=tenant_id)
    ai_actions = ai_gateway_client.list(tenant_id=tenant_id)
    federation_events = federation_client.list(tenant_id=tenant_id)

    return _aggregate_governance_metrics(
        policy_decisions=policy_decisions,
        audit_events=audit_events,
        ai_actions=ai_actions,
        federation_events=federation_events,
    )
