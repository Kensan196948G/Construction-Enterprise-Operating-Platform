"""Dashboard response schemas (BL-010 / Acceptance 5).

G1_MVP_SCREEN_FIELD_LIST.md の Dashboard セクションに従い、
Sprint 1 段階で確定する API 形を固定する。

Sprint 1 で実値を返すのは Enterprise Health のみ。
AI / DLP / Federation 領域は Sprint 2 で AI Gateway / Document /
Federation Service が立ち上がるまで ``sprint_ready=False`` で 0 を返す。
これにより UI 側は Sprint 2 で値の流入が始まっても schema 切替不要。

Sprint 4 で GovernanceMetrics を追加。
"""

from __future__ import annotations

from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, Field


class EnterpriseHealth(BaseModel):
    """Enterprise Health area (Sprint 1 で実値)."""

    model_config = ConfigDict(extra="forbid")

    open_issue_count: int = Field(ge=0, description="status != closed の Issue 数")
    pending_approval_count: int = Field(
        ge=0, description="status == approval_required の Issue 数"
    )
    critical_audit_count: int = Field(
        ge=0, description="policy_result == deny の Audit Event 数"
    )


class AIActivity(BaseModel):
    """AI Activity area (Sprint 2 で実値が入る予定)."""

    model_config = ConfigDict(extra="forbid")

    ai_action_count: int = Field(default=0, ge=0)
    high_ai_risk_count: int = Field(default=0, ge=0)
    external_ai_block_count: int = Field(default=0, ge=0)
    sprint_ready: bool = Field(
        default=False,
        description="Sprint 2 で AI Gateway 接続後に True",
    )


class DLPAlerts(BaseModel):
    """DLP Alerts area (Sprint 2 で実値が入る予定)."""

    model_config = ConfigDict(extra="forbid")

    dlp_violation_count: int = Field(default=0, ge=0)
    restricted_document_count: int = Field(default=0, ge=0)
    sprint_ready: bool = Field(
        default=False,
        description="Sprint 2 で Document Classification 接続後に True",
    )


class FederationStats(BaseModel):
    """Federation area (Sprint 2 で実値が入る予定)."""

    model_config = ConfigDict(extra="forbid")

    pending_federation_request_count: int = Field(default=0, ge=0)
    trust_warning_count: int = Field(default=0, ge=0)
    sprint_ready: bool = Field(
        default=False,
        description="Sprint 2 で Federation Service 接続後に True",
    )


class IssueRef(BaseModel):
    """Acceptance 5: 「Dashboard から対象 Object へ遷移できる」ための最小参照."""

    model_config = ConfigDict(extra="forbid")

    object_id: str
    title: str
    status: str
    priority: str
    classification: str


class ApprovalRef(BaseModel):
    """承認結果カードに表示する最小参照."""

    model_config = ConfigDict(extra="forbid")

    object_id: str
    issue_id: str
    decision: str
    approver_id: str


class GovernanceMetrics(BaseModel):
    """Governance KPI metrics (Sprint 4)."""

    model_config = ConfigDict(extra="forbid")

    policy_allow_count: int = Field(default=0, ge=0)
    policy_deny_count: int = Field(default=0, ge=0)
    policy_review_required_count: int = Field(default=0, ge=0)
    audit_event_count: int = Field(default=0, ge=0)
    ai_action_count: int = Field(default=0, ge=0)
    ai_action_blocked_count: int = Field(default=0, ge=0)
    federation_event_count: int = Field(default=0, ge=0)
    federation_blocked_count: int = Field(default=0, ge=0)
    last_updated: datetime = Field(default_factory=lambda: datetime.now(tz=timezone.utc))


class DashboardSummary(BaseModel):
    """GET /dashboard/overview の応答全体."""

    model_config = ConfigDict(extra="forbid")

    tenant_id: str
    generated_at: datetime
    sprint: str = Field(description='現在 Sprint 番号 (例: "1")')
    enterprise_health: EnterpriseHealth
    ai_activity: AIActivity
    dlp_alerts: DLPAlerts
    federation_stats: FederationStats
    recent_issues: list[IssueRef] = Field(
        default_factory=list,
        description="最新 N 件 (Acceptance 5 navigation)",
    )
    recent_approvals: list[ApprovalRef] = Field(default_factory=list)
