"""Approval Object Schema (BL-003 / ADR-005).

ADR-005 "Approval as Object":
    Approval を **コメントや状態フィールドではなく独立 Object** として扱い、
    ``decision`` / ``reason`` / ``policy_result_ref`` / ``audit_event_refs``
    を必ず保有させる。これにより Audit Timeline で承認判断の根拠
    (Policy / Reason / Approver) を後から完全に再現できる。

Sprint 1 の責務:
    - Issue (BL-002) に紐づく Approval を 1 件生成し、判断結果を保存する
    - Policy 評価結果と Audit Event 採番を Approval Object 自身に保持する
    - ApprovalDecision の状態遷移はここでは扱わない (Sprint 2 で多段承認に拡張)
"""

from __future__ import annotations

from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, Field
from synapse_shared.enums import ApprovalDecision, ObjectType
from synapse_shared.object_base import CommonObject


def _utcnow() -> datetime:
    return datetime.now(tz=timezone.utc)


class Approval(CommonObject):
    """Approval Enterprise Object.

    ``object_type`` は常に ``ObjectType.APPROVAL``。
    起点となる Issue は ``issue_id`` で紐づけ、Audit の correlation_id
    にも同じ Issue ID を入れて Sprint 1 末の Timeline 追跡を成立させる。
    """

    object_type: ObjectType = Field(default=ObjectType.APPROVAL, frozen=True)
    issue_id: str = Field(..., description="承認対象 Issue の object_id")
    approver_id: str = Field(..., description="承認者 Identity ID")
    decision: ApprovalDecision = Field(default=ApprovalDecision.PENDING)
    reason: str = Field(default="", max_length=2000)
    decided_at: datetime | None = Field(
        default=None,
        description="判断確定時刻。pending の間は None。",
    )
    requested_action: str = Field(
        default="approval.decide",
        description="Policy Engine 入力の action 名。Sprint 1 では approval.decide のみ扱う。",
    )


class ApprovalCreateRequest(BaseModel):
    """POST /approvals 入力.

    ``decision`` は承認者がこのリクエストで下す最終判断 (approved / rejected /
    delegated / returned)。pending を直接受け付けると Audit が空回りするため許可しない。
    """

    model_config = ConfigDict(
        extra="forbid", str_strip_whitespace=True, protected_namespaces=()
    )

    tenant_id: str = Field(..., description="ten_* ID")
    issue_id: str = Field(..., description="承認対象 Issue の object_id")
    approver_id: str = Field(..., description="承認者 Identity ID (Policy 入力 actor)")
    actor_type: str = Field(default="human")
    decision: ApprovalDecision = Field(
        ...,
        description="承認者の最終判断。pending は受け付けない。",
    )
    reason: str = Field(default="", max_length=2000)
    requested_action: str = Field(default="approval.decide")
    data_destination: str = Field(default="internal")
    model_provider: str = Field(default="n/a")
    risk_score: float = Field(default=0.0, ge=0.0, le=100.0)
