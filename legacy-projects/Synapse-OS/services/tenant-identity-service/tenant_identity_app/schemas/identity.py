"""Identity Schema (BL-001 Sprint 0).

Identity は Tenant に所属する Actor の正準表現。
Sprint 0 では Human / AI Agent / Workflow の 3 種をモデル化する。
External Partner は Federation 側で扱うため Sprint 0 では非対象。
System Actor (内部 Cron 等) は Sprint 1 以降。
"""

from __future__ import annotations

from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, Field, field_validator
from synapse_shared.enums import ActorType, IdentityKind
from synapse_shared.ids import is_valid_id


def _utcnow() -> datetime:
    return datetime.now(tz=timezone.utc)


class Identity(BaseModel):
    """Identity Object (Sprint 0 minimum).

    actor_type は Audit Event に書き込まれる正準値。
    identity_kind は Sprint 0 で扱う 3 種のサブセット表示用。

    Sprint 0 範囲:
    - 静的 seed の Identity を Read-Only で取得
    - identity_id, tenant_id, actor_type, display_name, email or service_principal

    Sprint 0 非対象:
    - 認証 / 認可（Keycloak 連携は Sprint 1+）
    - Group / Role / Permission（Authority Model 別途）
    - 外部 IdP 同期
    """

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    identity_id: str = Field(..., description="idn_{tenant}_{yyyymmdd}_{seq}")
    tenant_id: str = Field(..., description="ten_* ID")
    actor_type: ActorType
    identity_kind: IdentityKind
    display_name: str = Field(..., min_length=1, max_length=128)
    email: str | None = Field(
        default=None,
        description="Human Identity の場合のみ。AI Agent / Workflow は None。",
    )
    service_principal: str | None = Field(
        default=None,
        description="AI Agent / Workflow の論理名。Human の場合は None。",
    )
    is_active: bool = True
    created_at: datetime = Field(default_factory=_utcnow)
    external_refs: dict[str, str] = Field(
        default_factory=dict,
        description="IdP / SaaS 側 ID。Synapse 主 ID とは混合しない。",
    )

    @field_validator("identity_id")
    @classmethod
    def _validate_identity_id(cls, v: str) -> str:
        if not is_valid_id(v):
            raise ValueError(f"identity_id violates Synapse ID format: {v!r}")
        if not v.startswith("idn_"):
            raise ValueError("identity_id prefix must be 'idn'")
        return v

    @field_validator("tenant_id")
    @classmethod
    def _validate_tenant_id(cls, v: str) -> str:
        if not is_valid_id(v) or not v.startswith("ten_"):
            raise ValueError(f"tenant_id must be a valid 'ten_*' ID: {v!r}")
        return v
