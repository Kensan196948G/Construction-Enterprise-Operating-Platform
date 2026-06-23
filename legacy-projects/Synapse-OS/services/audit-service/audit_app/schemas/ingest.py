"""Audit Event Ingest Schema (Sprint 0).

なぜ Ingest 用に別スキーマを切るか:
    AuditEvent 本体は frozen=True / extra="forbid" の Immutable レコード。
    audit_event_id と hash_ref はサーバ側で確定させたい (= 改ざん抑止)。
    そこで API 入力時には id/hash を省略可とし、サーバが付与する形にする。
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field
from synapse_shared.audit_base import AIAuditExtension, AuditEventType, DEFAULT_RETENTION_POLICY_REF
from synapse_shared.enums import ActorType, ObjectType, PolicyDecisionType


class AuditEventIngress(BaseModel):
    """Audit Event の取り込み用入力."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    event_type: AuditEventType
    occurred_at: datetime | None = None
    tenant_id: str
    actor_id: str
    actor_type: ActorType
    action: str = Field(..., min_length=1, max_length=128)
    object_id: str
    object_type: ObjectType
    correlation_id: str
    retention_policy_ref: str = DEFAULT_RETENTION_POLICY_REF

    policy_decision_ref: str | None = None
    policy_result: PolicyDecisionType | None = None
    request_id: str | None = None
    source_ip_or_device: str | None = None
    explanation_ref: str | None = None
    before_state: dict[str, Any] | None = None
    after_state: dict[str, Any] | None = None
    # previous_hash_ref はサーバ側でハッシュチェーンとして自動設定するため、
    # クライアントからの入力フィールドには含めない。

    ai_extension: AIAuditExtension | None = None
