"""Knowledge Item Object Schema (BL-011 / Sprint 2).

DATA_LINEAGE_MODEL.md / KNOWLEDGE_GRAPH_MODEL.md / RETENTION_MODEL.md の 3 文書を
1 個の Knowledge Item に集約する Sprint 2 MVP。

設計上の固定点:
    1. Lineage 必須 (DATA_LINEAGE_MODEL.md 必須属性):
        source_id / source_tenant / transformation_type / actor /
        ai_action_id / workflow_id / policy_result / audit_event_id
       を ``LineageEdge`` 1 個に集約する。Knowledge Item は edge を 0..N 個保持する。

    2. AI 由来 Knowledge は出典必須 (Lineage 原則):
        transformation_type=AI_GENERATED の場合、lineage_edges のいずれかに
        ai_action_id が無いと拒否する (= "AI 生成物は出典不明な文書として扱わない")。

    3. Retention 拘束 (RETENTION_MODEL.md):
        - retention_class は AI/Workflow/Document/Federation/Audit/Incident のいずれか
        - retain_until は UTC ISO datetime
        - legal_hold=True の Knowledge は status=DELETED に遷移できない (削除禁止)
        - retention_class=FEDERATION_LOG の Knowledge は片側削除禁止
          (= federation_event_id を持つもの)

    4. Lineage source 種別の禁止集合 (Non Goals Guard):
        AUDIT_EVENT / POLICY_DECISION を Knowledge の源にしない。
        (Audit/Policy は判断結果であり Knowledge の派生元としない MVP scope)

    5. DLP 最終判断は持たない (SERVICE_RESPONSIBILITY_MODEL.md):
        classification を持つだけで mask/quarantine 判定は Policy Service に委譲する。
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from synapse_shared.enums import Classification, ObjectType
from synapse_shared.object_base import CommonObject


class TransformationType(str, Enum):
    """Lineage の派生種別 (DATA_LINEAGE_MODEL.md transformation_type)."""

    DOCUMENT_INGESTED = "document_ingested"
    AI_GENERATED = "ai_generated"
    HUMAN_AUTHORED = "human_authored"
    DERIVED = "derived"
    FEDERATION_IMPORTED = "federation_imported"


class RetentionClass(str, Enum):
    """RETENTION_MODEL.md "保持対象" カテゴリ.

    Sprint 2 では retention 自体の自動 archive/delete までは行わず、ラベルとして
    持ち、削除リクエスト時のゲート判断材料に使う。
    """

    AUDIT_LOG = "audit_log"
    AI_HISTORY = "ai_history"
    WORKFLOW_HISTORY = "workflow_history"
    DOCUMENT = "document"
    INCIDENT_CHANGE = "incident_change"
    FEDERATION_LOG = "federation_log"


class KnowledgeStatus(str, Enum):
    """Knowledge Item lifecycle.

    QUARANTINED は Policy Service が将来 mask/quarantine を判断したとき格下げするための予約。
    Sprint 2 内では create 時点では ACTIVE のみ採用する。
    """

    ACTIVE = "active"
    QUARANTINED = "quarantined"
    ARCHIVED = "archived"
    DELETED = "deleted"


_FORBIDDEN_LINEAGE_SOURCES = {
    ObjectType.AUDIT_EVENT,
    ObjectType.POLICY_DECISION,
}


class LineageEdge(BaseModel):
    """Lineage 有向辺. source_object → KnowledgeItem を 1 個の構造に集約する.

    DATA_LINEAGE_MODEL.md "必須属性" を 1 行で表現する設計。
    Knowledge Item は 0..N 個の edge を持つ (HUMAN_AUTHORED で 0 件もありうる)。
    """

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    source_object_id: str = Field(..., description="派生元 Object ID (doc_* / aia_* / iss_* / kno_*).")
    source_object_type: ObjectType = Field(..., description="派生元 Object 種別.")
    source_tenant: str = Field(..., description="派生元 Tenant. cross-tenant 派生のみ Knowledge.tenant_id と異なる.")
    transformation_type: TransformationType = Field(..., description="この edge の派生種別.")
    actor_id: str = Field(..., description="派生を起こした Identity ID.")
    ai_action_id: str | None = Field(
        default=None,
        description="AI 由来時は aia_*. AI_GENERATED transformation の Knowledge では必須.",
    )
    workflow_id: str | None = Field(
        default=None,
        description="Workflow 由来時は wfi_*. Approval/差戻しを経た派生のみ.",
    )
    policy_decision_ref: str | None = Field(
        default=None,
        description="この派生を許可した Policy Decision (pde_*).",
    )
    audit_event_ref: str | None = Field(
        default=None,
        description="この派生を記録した Audit Event (aud_*).",
    )

    @field_validator("source_object_type")
    @classmethod
    def _disallow_meta_source(cls, v: ObjectType) -> ObjectType:
        if v in _FORBIDDEN_LINEAGE_SOURCES:
            raise ValueError(
                f"source_object_type={v.value} cannot be a Knowledge lineage source "
                "(Audit/Policy は判断結果であり Knowledge の派生元にしない)"
            )
        return v


class KnowledgeItem(CommonObject):
    """Knowledge Item Enterprise Object (BL-011)."""

    object_type: ObjectType = Field(default=ObjectType.KNOWLEDGE_ITEM, frozen=True)

    title: str = Field(..., max_length=300)
    summary: str = Field(default="", max_length=4000)

    transformation_type: TransformationType = Field(
        ...,
        description="Knowledge 自体の生成種別. lineage_edges 上の値とは独立 (集約結果).",
    )
    lineage_edges: list[LineageEdge] = Field(
        default_factory=list,
        description="0..N 個. AI_GENERATED の場合は ai_action_id 付き edge が必須.",
    )

    retention_class: RetentionClass = Field(
        ...,
        description="RETENTION_MODEL.md カテゴリ. delete 時のゲート条件に使う.",
    )
    retain_until: datetime | None = Field(
        default=None,
        description="保持期限 UTC. None = 無期限保持 (Audit Log / Federation Log で典型).",
    )
    legal_hold: bool = Field(
        default=False,
        description="Legal Hold 中は status=DELETED に遷移できない.",
    )
    status: KnowledgeStatus = Field(default=KnowledgeStatus.ACTIVE)

    federation_event_id: str | None = Field(
        default=None,
        description="cross-tenant 共有起源 (fed_*). 設定時は片側削除禁止 (FEDERATION_LOG 同等).",
    )

    trust_score: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Lineage 充足度 + Policy 結果から計算する 0.0-1.0 信頼度.",
    )

    @model_validator(mode="after")
    def _enforce_ai_lineage(self) -> "KnowledgeItem":
        """AI_GENERATED Knowledge は出典 ai_action_id を 1 件以上持たねばならない."""

        if self.transformation_type == TransformationType.AI_GENERATED:
            has_ai_source = any(e.ai_action_id for e in self.lineage_edges)
            if not has_ai_source:
                raise ValueError(
                    "AI_GENERATED knowledge requires at least one lineage_edge with ai_action_id "
                    "(DATA_LINEAGE_MODEL.md: AI 生成物は出典不明な文書として扱わない)"
                )
        return self

    @model_validator(mode="after")
    def _enforce_federation_lineage(self) -> "KnowledgeItem":
        """FEDERATION_IMPORTED Knowledge は federation_event_id を持つ必要がある."""

        if self.transformation_type == TransformationType.FEDERATION_IMPORTED:
            if not self.federation_event_id:
                raise ValueError(
                    "FEDERATION_IMPORTED knowledge requires federation_event_id "
                    "(FEDERATION_MODEL.md: cross-tenant Knowledge は Federation Event 経由のみ)"
                )
        return self


class KnowledgeItemCreateRequest(BaseModel):
    """POST /knowledge-items 入力.

    Request 側でも cross-source 拒否 / AI lineage 必須 / Federation lineage 必須を検証する。
    Response (KnowledgeItem) 側 validator は最終防衛線で 500 になりうるため、
    422 を返したい契約レベル違反は本 Request 側で先に弾く。
    """

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    tenant_id: str = Field(..., description="ten_* ID. Knowledge を所属させる Tenant.")
    owner_id: str = Field(..., description="責任 Identity ID.")
    actor_id: str = Field(..., description="ingest を起こした Identity ID.")
    actor_type: str = Field(default="human")

    title: str = Field(..., max_length=300)
    summary: str = Field(default="", max_length=4000)
    classification: Classification = Field(
        ...,
        description="Restricted / Confidential は Policy 評価で quarantine / mask に落ちうる.",
    )

    transformation_type: TransformationType
    lineage_edges: list[LineageEdge] = Field(default_factory=list)

    retention_class: RetentionClass
    retain_until: datetime | None = Field(default=None)

    federation_event_id: str | None = Field(default=None)

    requested_action: str = Field(default="knowledge.ingest")

    @model_validator(mode="after")
    def _enforce_ai_lineage_request(self) -> "KnowledgeItemCreateRequest":
        if self.transformation_type == TransformationType.AI_GENERATED:
            has_ai_source = any(e.ai_action_id for e in self.lineage_edges)
            if not has_ai_source:
                raise ValueError(
                    "AI_GENERATED knowledge requires at least one lineage_edge with ai_action_id"
                )
        if self.transformation_type == TransformationType.FEDERATION_IMPORTED:
            if not self.federation_event_id:
                raise ValueError(
                    "FEDERATION_IMPORTED knowledge requires federation_event_id"
                )
        return self


class LegalHoldRequest(BaseModel):
    """POST /knowledge-items/{id}/legal-hold."""

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    actor_id: str
    actor_type: str = Field(default="human")
    reason: str = Field(..., max_length=1000)


class LineageNode(BaseModel):
    """GET /knowledge-items/{id}/lineage の node 表現.

    Sprint 2 では「直接 source の参照を 1 ホップ列挙」+「KNOWLEDGE_ITEM の場合のみ
    1 段だけ再帰展開する」最小 graph traversal にとどめる (完全 Knowledge Graph は MVP scope 外)。
    """

    object_id: str
    object_type: ObjectType
    transformation_type: TransformationType
    depth: int
    ai_action_id: str | None = None
    workflow_id: str | None = None


__all__ = [
    "TransformationType",
    "RetentionClass",
    "KnowledgeStatus",
    "LineageEdge",
    "KnowledgeItem",
    "KnowledgeItemCreateRequest",
    "LegalHoldRequest",
    "LineageNode",
]
