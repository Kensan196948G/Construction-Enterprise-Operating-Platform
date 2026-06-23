"""Federation Event Object Schema (BL-008 / Sprint 2).

ADR-002 "Cross Tenant 操作は通常 Object 更新ではなく Federation Event" を schema 側で固定する。
FEDERATION_MODEL.md 由来の必須属性:

    source_tenant   : 起点組織
    target_tenant   : 対象組織
    shared_object   : 共有対象 (object_id + object_type)
    trust_level     : Trust Level (l1_internal .. l5_public)
    policy_binding  : 適用 Policy
    audit_boundary  : 監査保存先

FederationEventStatus は Policy Decision からの派生:
    allow                       -> APPROVED              (双方 Approval 不要 / Policy で完結)
    deny                        -> BLOCKED               (Trust 不足 / DLP 拒否)
    federation_review_required  -> REVIEW_REQUIRED       (双方 Approval / Federation Council 待ち)
    approval_required           -> REVIEW_REQUIRED       (Tenant 内 Approval が先に要る)
    その他                      -> REVIEW_REQUIRED

Acceptance 4 (Federation Auth/Boundary) の固定点:
    1. A社/B社/C社 の Tenant 区別           -> source_tenant != target_tenant を必須化
    2. Cross Tenant 共有要求が Federation Event に -> POST /federation-events が唯一の経路
    3. Trust Level 表示                            -> trust_level: TrustLevel
    4. 双方承認 / Policy 判定残存                  -> status + policy_decision_ref + audit_event_refs
    5. Shared Audit に記録                         -> audit_boundary + audit_event_refs (cross-tenant correlation)
"""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from synapse_shared.enums import Classification, ObjectType, TrustLevel
from synapse_shared.object_base import CommonObject


class FederationEventStatus(str, Enum):
    """Federation Event の終端 status.

    Sprint 2 では同期 API として 1 回の POST /federation-events で必ず終端まで進む。
    REVIEW_REQUIRED は "Federation Council / 双方 Approval を待つ" 状態を表し、
    後続の workflow-service / approval flow で APPROVED / BLOCKED に遷移しうる
    (Sprint 2 段階では本サービス側で遷移はしない -- 状態保持だけ)。
    """

    APPROVED = "approved"
    REVIEW_REQUIRED = "review_required"
    BLOCKED = "blocked"


class AuditBoundary(str, Enum):
    """Audit 保存境界 (FEDERATION_MODEL.md "audit_boundary").

    shared : 双方 Tenant + global の 3 経路に同一 correlation_id で残す (通常)
    source_only : target 拒否などで source のみに記録 (BLOCKED 時)
    """

    SHARED = "shared"
    SOURCE_ONLY = "source_only"


class FederationEvent(CommonObject):
    """Federation Event Enterprise Object (ADR-002)."""

    object_type: ObjectType = Field(default=ObjectType.FEDERATION_EVENT, frozen=True)

    source_tenant: str = Field(
        ...,
        description="起点組織 ten_*. CommonObject.tenant_id と一致する (Federation Event の所属境界).",
    )
    target_tenant: str = Field(
        ...,
        description="対象組織 ten_*. source_tenant と異なる必要がある.",
    )

    shared_object_id: str = Field(
        ...,
        description="共有対象 Object の ID (iss_* / doc_* / kno_* / wfi_* / aia_* など).",
    )
    shared_object_type: ObjectType = Field(
        ...,
        description="共有対象 Object の種別. AUDIT_EVENT / POLICY_DECISION の federation 共有は禁止.",
    )

    trust_level: TrustLevel = Field(
        ...,
        description="Trust Evaluation 結果. l1_internal は cross-tenant では拒否される (= source==target 矛盾).",
    )
    policy_binding: str = Field(
        default="default-federation",
        max_length=128,
        description="適用 Federation Policy 識別子 (例: 'default-federation', 'partner-l4-readonly').",
    )
    audit_boundary: AuditBoundary = Field(
        default=AuditBoundary.SHARED,
        description="Audit 保存境界. blocked 時は source_only に縮退する.",
    )

    risk_score: float = Field(default=0.0, ge=0.0, le=100.0)

    status: FederationEventStatus = Field(default=FederationEventStatus.REVIEW_REQUIRED)

    reasoning_summary: str | None = Field(
        default=None,
        max_length=4000,
        description="Policy reasons の人間可読サマリ. blocked / review_required の理由が入る.",
    )
    requested_action: str = Field(default="federation.share")

    @model_validator(mode="after")
    def _enforce_cross_tenant(self) -> "FederationEvent":
        """ADR-002: Federation Event は cross-tenant 専用. source==target は無効."""

        if self.source_tenant == self.target_tenant:
            raise ValueError(
                "FederationEvent must be cross-tenant: source_tenant must differ from target_tenant"
            )
        if self.tenant_id != self.source_tenant:
            raise ValueError(
                "FederationEvent.tenant_id must equal source_tenant (Federation Event は source 側 Tenant に所属する)"
            )
        return self

    @field_validator("shared_object_type")
    @classmethod
    def _disallow_meta_object(cls, v: ObjectType) -> ObjectType:
        """Audit Event / Policy Decision / Federation Event 自身を共有対象にできない.

        - Audit Event の cross-tenant 共有は Audit Federation 経由 (Sprint 3+) で別ルート
        - Policy Decision はテナント内部判定なので共有不可
        - Federation Event の入れ子 (federation of federations) は禁止
        """

        forbidden = {
            ObjectType.AUDIT_EVENT,
            ObjectType.POLICY_DECISION,
            ObjectType.FEDERATION_EVENT,
        }
        if v in forbidden:
            raise ValueError(
                f"shared_object_type={v.value} cannot be federated as a regular Federation Event"
            )
        return v


_FORBIDDEN_SHARED_TYPES = {
    ObjectType.AUDIT_EVENT,
    ObjectType.POLICY_DECISION,
    ObjectType.FEDERATION_EVENT,
}


class FederationEventCreateRequest(BaseModel):
    """POST /federation-events 入力.

    object-service / workflow-service / knowledge-service など caller は本 request のみで
    Cross Tenant 共有を要求できる。直接 Object API で他 Tenant に書き込む経路は存在しない
    (= ADR-002 が成立する)。

    Request 側でも cross-tenant / shared_object_type の制約を持つ理由は、API contract と
    して 422 を返す必要があるため (Response 側 validator は 500 を引き起こすので不適)。
    """

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    source_tenant: str = Field(..., description="ten_* ID. 起点組織.")
    target_tenant: str = Field(..., description="ten_* ID. 対象組織.")

    owner_id: str = Field(..., description="責任 Identity ID (source 側).")
    actor_id: str = Field(..., description="呼び出し Identity ID (Policy 入力 actor).")
    actor_type: str = Field(default="human")

    shared_object_id: str = Field(..., description="共有対象 Object ID.")
    shared_object_type: ObjectType = Field(..., description="共有対象 Object 種別.")
    classification: Classification = Field(
        ...,
        description=(
            "共有対象の分類. Restricted の cross-tenant 共有は Policy で deny されるべき. "
            "Confidential は trust_level >= L3 + DLP 評価で可."
        ),
    )

    trust_level: TrustLevel = Field(
        ...,
        description="caller が事前に評価した Trust. Policy 側で再評価され格下げされうる.",
    )
    policy_binding: str = Field(default="default-federation", max_length=128)
    risk_score: float = Field(default=0.0, ge=0.0, le=100.0)
    requested_action: str = Field(default="federation.share")

    @field_validator("shared_object_type")
    @classmethod
    def _disallow_meta_object_request(cls, v: ObjectType) -> ObjectType:
        if v in _FORBIDDEN_SHARED_TYPES:
            raise ValueError(
                f"shared_object_type={v.value} cannot be federated as a regular Federation Event"
            )
        return v

    @model_validator(mode="after")
    def _enforce_cross_tenant_request(self) -> "FederationEventCreateRequest":
        if self.source_tenant == self.target_tenant:
            raise ValueError(
                "source_tenant and target_tenant must differ (FederationEvent is cross-tenant only)"
            )
        return self
