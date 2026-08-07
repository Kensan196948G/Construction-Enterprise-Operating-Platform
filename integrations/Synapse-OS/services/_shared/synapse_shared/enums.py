"""Synapse-OS Core Enums (G1 final).

正本: docs/12_Design_Review_Readiness/G1_ID_ENUM_FINALIZATION.md
"""

from __future__ import annotations

from enum import Enum


class TenantCode(str, Enum):
    TENA = "tena"
    TENB = "tenb"
    TENC = "tenc"
    GLOBAL = "global"


class ObjectType(str, Enum):
    ISSUE = "issue"
    APPROVAL = "approval"
    WORKFLOW_INSTANCE = "workflow_instance"
    DOCUMENT = "document"
    KNOWLEDGE_ITEM = "knowledge_item"
    AI_ACTION = "ai_action"
    POLICY_DECISION = "policy_decision"
    AUDIT_EVENT = "audit_event"
    FEDERATION_EVENT = "federation_event"


class Classification(str, Enum):
    PUBLIC = "public"
    INTERNAL = "internal"
    CONFIDENTIAL = "confidential"
    RESTRICTED = "restricted"


class ActorType(str, Enum):
    HUMAN = "human"
    AI_AGENT = "ai_agent"
    WORKFLOW = "workflow"
    SYSTEM = "system"
    EXTERNAL_PARTNER = "external_partner"


class PolicyDecisionType(str, Enum):
    ALLOW = "allow"
    DENY = "deny"
    APPROVAL_REQUIRED = "approval_required"
    MASK_REQUIRED = "mask_required"
    LOCAL_LLM_REQUIRED = "local_llm_required"
    FEDERATION_REVIEW_REQUIRED = "federation_review_required"
    QUARANTINE = "quarantine"


class IssueStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    POLICY_CHECKING = "policy_checking"
    AI_REVIEWING = "ai_reviewing"
    APPROVAL_REQUIRED = "approval_required"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXECUTING = "executing"
    AUDITED = "audited"
    CLOSED = "closed"


class IssuePriority(str, Enum):
    """Acceptance 1 で必須となる Issue 優先度.

    Sprint 1 では low/medium/high/critical の 4 段階で扱い、
    Approval / Dashboard も同じ値で集計可能にする。
    """

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ApprovalDecision(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    DELEGATED = "delegated"
    RETURNED = "returned"


class TrustLevel(str, Enum):
    L1_INTERNAL = "l1_internal"
    L2_GROUP = "l2_group"
    L3_JOINT = "l3_joint"
    L4_PARTNER = "l4_partner"
    L5_PUBLIC = "l5_public"


class IdentityKind(str, Enum):
    """ActorType を Identity Object 視点で表現する派生 Enum.

    Sprint 0 では human / ai_agent / workflow のみ Identity 化する。
    system / external_partner は別経路で扱う（External Partner は Federation 側）。
    """

    HUMAN = "human"
    AI_AGENT = "ai_agent"
    WORKFLOW = "workflow"


class AuthorityRole(str, Enum):
    """Governance authority role for a Governed Action.

    Records which authority permitted this operation.
    Combined with policy_result_ref this enables explaining WHY an operation was allowed
    — Policy = the rule, Authority = the holder who exercised it.
    """

    OWNER = "owner"
    DELEGATED = "delegated"
    SYSTEM = "system"
    POLICY_OVERRIDE = "policy_override"
    EMERGENCY = "emergency"
