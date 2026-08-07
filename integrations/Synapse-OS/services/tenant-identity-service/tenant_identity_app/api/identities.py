"""Identity Read-Only API (Sprint 0).

認証 / 認可は Sprint 0 範囲外。
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status

from ..schemas.identity import Identity
from ..storage.repository import IdentityRepository

router = APIRouter(prefix="/identities", tags=["identity"])

_SINGLETON = IdentityRepository()


def get_identity_repo() -> IdentityRepository:
    return _SINGLETON


@router.get("", response_model=list[Identity])
def list_identities(
    tenant_id: str | None = Query(default=None, description="絞り込み対象 Tenant ID"),
    repo: IdentityRepository = Depends(get_identity_repo),
) -> list[Identity]:
    return repo.list(tenant_id=tenant_id)


@router.get("/{identity_id}", response_model=Identity)
def get_identity(
    identity_id: str,
    repo: IdentityRepository = Depends(get_identity_repo),
) -> Identity:
    identity = repo.get_by_id(identity_id)
    if identity is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="identity not found")
    return identity
