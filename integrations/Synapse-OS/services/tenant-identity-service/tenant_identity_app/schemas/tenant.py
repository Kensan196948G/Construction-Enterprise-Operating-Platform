"""Tenant Schema (BL-001 Sprint 0).

Tenant は Synapse-OS の最上位境界 Object。
A社 / B社 / C社 / Cross Tenant (global) を表現する。

正本:
- docs/02_Federation/FEDERATION_MODEL.md
- docs/12_Design_Review_Readiness/G1_ID_ENUM_FINALIZATION.md (Tenant Code 表)
"""

from __future__ import annotations

from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, Field, field_validator
from synapse_shared.enums import Classification, TenantCode, TrustLevel
from synapse_shared.ids import is_valid_id


def _utcnow() -> datetime:
    return datetime.now(tz=timezone.utc)


class Tenant(BaseModel):
    """Sprint 0 minimal Tenant Object.

    Sprint 0 範囲:
    - 静的に定義された A社/B社/C社/global を Read-Only で取得可能にする
    - default_trust_level は Federation 評価の初期値として使用される（Sprint 1+）

    Sprint 0 非対象:
    - Tenant 作成 / 更新 API
    - 階層 Tenant、Sub-Tenant
    - Per-Tenant Policy Override
    """

    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    tenant_id: str = Field(..., description="ten_global_yyyymmdd_seq")
    tenant_code: TenantCode
    display_name: str = Field(..., min_length=1, max_length=128)
    default_classification: Classification = Field(default=Classification.INTERNAL)
    default_trust_level: TrustLevel = Field(default=TrustLevel.L1_INTERNAL)
    is_active: bool = True
    created_at: datetime = Field(default_factory=_utcnow)

    @field_validator("tenant_id")
    @classmethod
    def _validate_tenant_id_format(cls, v: str) -> str:
        if not is_valid_id(v):
            raise ValueError(f"tenant_id violates Synapse ID format: {v!r}")
        if not v.startswith("ten_"):
            raise ValueError("tenant_id prefix must be 'ten'")
        if "_global_" not in v:
            raise ValueError("Tenant Object 自身の ID は scope=global で発行する")
        return v
