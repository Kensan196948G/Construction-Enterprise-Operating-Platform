"""Common Object Contract.

正本: docs/09_Design_Refinement/DATA_CONTRACT_MODEL.md "Common Object Contract"

Sprint 0 では Tenant / Identity / Policy Decision / Audit Event の 4 種で使用する。
Issue / Approval / AI Action / Federation Event は Sprint 1 以降で派生 Schema を追加する。
"""

from __future__ import annotations

from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, Field

from .enums import AuthorityRole, Classification, ObjectType
from .ids import is_valid_id


def _utcnow() -> datetime:
    return datetime.now(tz=timezone.utc)


class CommonObject(BaseModel):
    """Common Object Contract の Sprint 0 共通基底."""

    model_config = ConfigDict(frozen=False, str_strip_whitespace=True, extra="forbid")

    object_id: str = Field(..., description="Synapse-OS ID 規約準拠")
    object_type: ObjectType
    tenant_id: str = Field(..., description="ten_* ID。Cross Tenant の場合は global Tenant")
    owner_id: str = Field(..., description="責任者 (Identity ID)")
    classification: Classification = Field(default=Classification.INTERNAL)
    created_at: datetime = Field(default_factory=_utcnow)
    updated_at: datetime = Field(default_factory=_utcnow)
    policy_result_ref: str | None = Field(
        default=None, description="直近 Policy Decision ID"
    )
    authority_ref: str | None = Field(
        default=None,
        description="Governance authority that permitted this operation (Identity ID or system ref)",
    )
    authority_role: AuthorityRole | None = Field(
        default=None,
        description="Role under which authority_ref acted (owner / delegated / system / policy_override / emergency)",
    )
    audit_event_refs: list[str] = Field(default_factory=list)
    federation_scope: str | None = Field(
        default=None, description="共有範囲。Cross Tenant 時のみ設定"
    )
    external_refs: dict[str, str] = Field(
        default_factory=dict,
        description="外部 IdP / SaaS / git などの外部 ID。Synapse 主 ID とは混合しない。",
    )

    def assert_id_format(self) -> None:
        if not is_valid_id(self.object_id):
            raise ValueError(f"object_id violates Synapse ID format: {self.object_id!r}")
