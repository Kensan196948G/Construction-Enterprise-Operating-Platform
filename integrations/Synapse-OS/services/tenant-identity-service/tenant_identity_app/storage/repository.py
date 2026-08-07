"""In-memory repository (Sprint 0).

Sprint 0 では DB を持たない。seed.py の固定データを参照するだけ。
DB 化は Sprint 1+ で ADR を起票して行う。
"""

from __future__ import annotations

from collections.abc import Iterable

from synapse_shared.enums import TenantCode

from ..schemas.identity import Identity
from ..schemas.tenant import Tenant
from .seed import SEED_IDENTITIES, SEED_TENANTS


class TenantRepository:
    def __init__(self, tenants: Iterable[Tenant] = SEED_TENANTS) -> None:
        self._by_id: dict[str, Tenant] = {t.tenant_id: t for t in tenants}
        self._by_code: dict[TenantCode, Tenant] = {t.tenant_code: t for t in tenants}

    def list(self) -> list[Tenant]:
        return list(self._by_id.values())

    def get_by_id(self, tenant_id: str) -> Tenant | None:
        return self._by_id.get(tenant_id)

    def get_by_code(self, code: TenantCode) -> Tenant | None:
        return self._by_code.get(code)


class IdentityRepository:
    def __init__(self, identities: Iterable[Identity] = SEED_IDENTITIES) -> None:
        self._by_id: dict[str, Identity] = {i.identity_id: i for i in identities}

    def list(self, tenant_id: str | None = None) -> list[Identity]:
        items = self._by_id.values()
        if tenant_id is None:
            return list(items)
        return [i for i in items if i.tenant_id == tenant_id]

    def get_by_id(self, identity_id: str) -> Identity | None:
        return self._by_id.get(identity_id)
