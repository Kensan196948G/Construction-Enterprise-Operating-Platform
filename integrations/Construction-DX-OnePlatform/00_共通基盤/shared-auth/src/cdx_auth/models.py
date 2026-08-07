"""認証ドメインモデル."""
from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field


class Role(str, Enum):
    """アプリ内ロール — Entra IDグループから写像する."""

    SYSTEM_ADMIN = "system_admin"
    EXECUTIVE = "executive"
    SALES_MANAGER = "sales_manager"
    SOLUTION_SALES = "solution_sales"
    SITE_MANAGER = "site_manager"
    SITE_WORKER = "site_worker"
    TECHNICAL = "technical"
    SAFETY_OFFICER = "safety_officer"
    QUALITY_OFFICER = "quality_officer"
    ENVIRONMENT_OFFICER = "environment_officer"
    CORPORATE = "corporate"
    PROCUREMENT = "procurement"
    MARINE = "marine"
    IT_DX = "it_dx"
    DATA_ANALYST = "data_analyst"
    PARTNER = "partner"


class AuthenticatedUser(BaseModel):
    """認証済みユーザー."""

    sub: str = Field(..., description="Entra ID の subject (oid)")
    upn: str = Field(..., description="UserPrincipalName")
    name: str
    email: str | None = None
    department: str | None = None
    roles: list[Role] = Field(default_factory=list)
    groups: list[str] = Field(default_factory=list, description="Entra ID Group object IDs")
    tenant_id: str
    issued_at: int
    expires_at: int

    def has_role(self, *roles: Role) -> bool:
        return any(r in self.roles for r in roles)
