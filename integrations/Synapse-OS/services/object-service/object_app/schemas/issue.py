"""Issue Object Schema (BL-002).

OBJECT_MODEL.md "Issue" / DATA_CONTRACT_MODEL.md "Common Object Contract" を
継承し、Acceptance 1 で必須となる Tenant / Owner / Priority / Classification を保有する。

Sprint 1 では以下の派生 field を追加する。
- title / description: 業務上の主題
- priority: 4 段階優先度 (Acceptance 1)
- status: IssueStatus (Sprint 1 では DRAFT / SUBMITTED / APPROVAL_REQUIRED / APPROVED / REJECTED / CLOSED を主に扱う)
- requested_action: Policy Engine への入力 action 名 (例: issue.create)
"""

from __future__ import annotations

from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, Field
from synapse_shared.enums import (
    Classification,
    IssuePriority,
    IssueStatus,
    ObjectType,
)
from synapse_shared.object_base import CommonObject


def _utcnow() -> datetime:
    return datetime.now(tz=timezone.utc)


class Issue(CommonObject):
    """Issue Enterprise Object.

    object_type は常に ``ObjectType.ISSUE``。``policy_result_ref`` / ``audit_event_refs``
    は CommonObject から継承し、生成パイプラインの中で順に埋まる。
    """

    object_type: ObjectType = Field(default=ObjectType.ISSUE, frozen=True)
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(default="", max_length=4000)
    priority: IssuePriority
    status: IssueStatus = Field(default=IssueStatus.DRAFT)
    requested_action: str = Field(
        default="issue.create",
        description="Policy Engine 入力の action 名。Sprint 1 では issue.create / issue.submit を扱う。",
    )


class IssueCreateRequest(BaseModel):
    """POST /issues 入力. object_id / created_at / 各種参照は server 側で採番する."""

    model_config = ConfigDict(
        extra="forbid", str_strip_whitespace=True, protected_namespaces=()
    )

    tenant_id: str = Field(..., description="ten_* ID")
    owner_id: str = Field(..., description="責任 Identity ID")
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(default="", max_length=4000)
    priority: IssuePriority
    classification: Classification = Field(default=Classification.INTERNAL)
    actor_id: str = Field(..., description="作成者 Identity ID (Policy 入力 actor)")
    actor_type: str = Field(
        default="human",
        description="ActorType 値. Sprint 1 では human/ai_agent/workflow を想定",
    )
    data_destination: str = Field(default="internal")
    model_provider: str = Field(default="n/a")
    risk_score: float = Field(default=0.0, ge=0.0, le=100.0)
    requested_action: str = Field(default="issue.create")


class IssueUpdateRequest(BaseModel):
    """PATCH /issues/{id} 入力. 全フィールドが optional (部分更新)."""

    model_config = ConfigDict(
        extra="forbid", str_strip_whitespace=True, protected_namespaces=()
    )

    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=4000)
    priority: IssuePriority | None = Field(default=None)
    status: IssueStatus | None = Field(default=None)
    actor_id: str = Field(..., description="更新者 Identity ID (Policy 入力 actor)")
    actor_type: str = Field(
        default="human",
        description="ActorType 値. Sprint 1 では human/ai_agent/workflow を想定",
    )
    data_destination: str = Field(default="internal")
    model_provider: str = Field(default="n/a")
    risk_score: float = Field(default=0.0, ge=0.0, le=100.0)
