"""Policy Decision Request / Response Schema (BL-004).

Inputs / Outputs は CLAUDE.md "Policy Engine I/O" に揃える。

Sprint 0 では Audit Event の生成は audit-service 側に委譲する。
ここでは Policy Decision の Schema と explanation 生成のみを担う。
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field
from synapse_shared.enums import (
    ActorType,
    Classification,
    ObjectType,
    PolicyDecisionType,
    TrustLevel,
)


def _utcnow() -> datetime:
    return datetime.now(tz=timezone.utc)


PolicyDomain = Literal["AUTHORITY", "DLP", "AI", "FEDERATION", "APPROVAL", "AUDIT"]


class PolicyDecisionInput(BaseModel):
    """Policy Engine 入力（CLAUDE.md / G1 ルール表に準拠）.

    フィールドは Sprint 0 の最小構成。Sprint 1 で動的 context_attrs を追加する。
    """

    model_config = ConfigDict(
        extra="forbid", str_strip_whitespace=True, protected_namespaces=()
    )

    actor_id: str
    actor_type: ActorType
    tenant_id: str
    target_tenant_id: str | None = Field(
        default=None,
        description="Cross Tenant 操作のとき設定。同一なら省略可。",
    )
    object_type: ObjectType
    object_id: str | None = None
    classification: Classification = Classification.INTERNAL
    action: str = Field(..., min_length=1, max_length=128)
    data_destination: Literal[
        "internal", "cross_tenant", "external_ai_cloud", "external_partner"
    ] = "internal"
    model_provider: Literal["local", "external_cloud", "n/a"] = "n/a"
    trust_level: TrustLevel | None = None
    risk_score: float = Field(default=0.0, ge=0.0, le=100.0)
    approval_state: Literal["none", "required", "approved", "rejected"] = "none"

    issue_type: (
        Literal["request", "incident", "change", "approval", "security"] | None
    ) = None
    is_production_change: bool = False
    has_prompt_audit_ref: bool = False
    has_dlp_result_ref: bool = False
    is_state_change: bool = False
    is_ai_execution: bool = False
    is_approval_decision: bool = False


class AppliedRule(BaseModel):
    model_config = ConfigDict(extra="forbid")

    rule_id: str
    domain: PolicyDomain
    decision: PolicyDecisionType | Literal["audit_required"]
    reason: str


class PolicyDecisionResult(BaseModel):
    """Policy Decision 出力.

    Auditability 原則のため、decision に至った全 applied_rules と理由 reasons を必ず返す。
    """

    model_config = ConfigDict(extra="forbid")

    policy_decision_id: str
    decided_at: datetime = Field(default_factory=_utcnow)
    final_decision: PolicyDecisionType
    requires_audit: bool = True
    reasons: list[str] = Field(default_factory=list)
    applied_rules: list[AppliedRule] = Field(default_factory=list)
    input_snapshot: PolicyDecisionInput
