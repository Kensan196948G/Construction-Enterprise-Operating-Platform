"""Tenant Read-Only API (Sprint 0).

POST/PUT/DELETE は Sprint 0 範囲外。
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from ..schemas.tenant import Tenant
from ..storage.repository import TenantRepository

router = APIRouter(prefix="/tenants", tags=["tenant"])


def get_tenant_repo() -> TenantRepository:
    return _SINGLETON


_SINGLETON = TenantRepository()


@router.get("", response_model=list[Tenant])
def list_tenants(repo: TenantRepository = Depends(get_tenant_repo)) -> list[Tenant]:
    return repo.list()


@router.get("/{tenant_id}", response_model=Tenant)
def get_tenant(
    tenant_id: str,
    repo: TenantRepository = Depends(get_tenant_repo),
) -> Tenant:
    tenant = repo.get_by_id(tenant_id)
    if tenant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="tenant not found")
    return tenant
