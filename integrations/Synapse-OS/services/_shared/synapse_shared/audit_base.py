"""Audit Event Schema (G1 Final).

正本: docs/12_Design_Review_Readiness/G1_AUDIT_EVENT_SCHEMA_FINALIZATION.md

Sprint 0 では Schema 定義と受信 API のみ実装する。
- Audit Event の **生成側**（Issue/Policy/AI/Federation 由来）は Sprint 1 で接続する。
- Hash chain (previous_hash_ref) は MVP 推奨、Pilot 前に必須化する。
"""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

from .enums import ActorType, ObjectType, PolicyDecisionType


def _utcnow() -> datetime:
    return datetime.now(tz=timezone.utc)


class AuditEventType(str, Enum):
    ISSUE_CREATED = "IssueCreated"
    ISSUE_READ = "IssueRead"
    ISSUE_UPDATED = "IssueUpdated"
    ISSUE_DELETED = "IssueDeleted"
    POLICY_EVALUATED = "PolicyEvaluated"
    APPROVAL_REQUESTED = "ApprovalRequested"
    APPROVAL_DECIDED = "ApprovalDecided"
    AI_PROMPT_EXECUTED = "AIPromptExecuted"
    MODEL_ROUTE_DECIDED = "ModelRouteDecided"
    AI_RISK_ANALYZED = "AIRiskAnalyzed"
    DOCUMENT_CLASSIFIED = "DocumentClassified"
    DLP_VIOLATION_DETECTED = "DLPViolationDetected"
    FEDERATION_ACCESS_REQUESTED = "FederationAccessRequested"
    FEDERATION_SHARED = "FederationShared"
    FEDERATION_BLOCKED = "FederationBlocked"
    FEDERATION_REVIEW_REQUIRED = "FederationReviewRequired"
    TRUST_EVALUATED = "TrustEvaluated"
    AI_INVOKED = "AIInvoked"
    AI_BLOCKED = "AIBlocked"
    AI_MASKED = "AIMasked"
    AI_ROUTED_LOCAL = "AIRoutedLocal"
    AI_REVIEW_REQUIRED = "AIReviewRequired"


DEFAULT_RETENTION_POLICY_REF = "audit_default_long"


class AIAuditExtension(BaseModel):
    """AI Audit Event 専用の追加属性 (G1 表 "AI Audit追加属性")."""

    model_config = ConfigDict(extra="forbid", protected_namespaces=())

    prompt_audit_ref: str
    model_provider: str
    model_name: str
    context_source_refs: list[str] = Field(default_factory=list)
    dlp_result_ref: str
    reasoning_summary_ref: str
    confidence: float | None = Field(default=None, ge=0.0, le=1.0)
    risk_score: float = Field(..., ge=0.0, le=1.0)


class AuditEvent(BaseModel):
    """Audit Event 必須 Schema (G1 Closed).

    Immutable: Audit Event は更新ではなく追記する。
    Correlatable: correlation_id で関連 Event を追跡する。
    """

    model_config = ConfigDict(frozen=True, extra="forbid", str_strip_whitespace=True)

    audit_event_id: str
    event_type: AuditEventType
    occurred_at: datetime = Field(default_factory=_utcnow)
    tenant_id: str
    actor_id: str
    actor_type: ActorType
    action: str = Field(..., min_length=1, max_length=128)
    object_id: str
    object_type: ObjectType
    correlation_id: str
    hash_ref: str
    retention_policy_ref: str = DEFAULT_RETENTION_POLICY_REF

    policy_decision_ref: str | None = None
    policy_result: PolicyDecisionType | None = None
    request_id: str | None = None
    source_ip_or_device: str | None = None
    explanation_ref: str | None = None
    before_state: dict[str, Any] | None = None
    after_state: dict[str, Any] | None = None
    previous_hash_ref: str = Field(
        description="Hash of the previous audit event. First event in chain uses 'genesis'.",
    )

    ai_extension: AIAuditExtension | None = None
