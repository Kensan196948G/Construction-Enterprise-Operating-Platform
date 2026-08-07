"""ソリューションカタログ管理."""

from __future__ import annotations

from decimal import Decimal
from typing import Annotated, Literal

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db_session
from ..models import SolutionCatalog

router = APIRouter(prefix="/catalog", tags=["catalog"])

Category = Literal[
    "port_dx", "renewable_energy", "disaster_dx", "pfi", "ppp", "environment"
]


class CatalogIn(BaseModel):
    catalog_code: str
    name: str
    category: Category
    summary: str | None = None
    description: str | None = None
    price_min: Decimal | None = None
    price_max: Decimal | None = None
    standard_duration_months: int | None = None
    application_examples: dict | None = None
    tags: dict | None = None
    is_active: bool = True


class CatalogOut(CatalogIn):
    model_config = ConfigDict(from_attributes=True)
    id: int


@router.get("", response_model=list[CatalogOut])
async def list_catalog(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    category: Annotated[Category | None, Query()] = None,
) -> list[CatalogOut]:
    stmt = select(SolutionCatalog)
    if category:
        stmt = stmt.where(SolutionCatalog.category == category)
    result = await session.execute(stmt)
    return [CatalogOut.model_validate(c) for c in result.scalars().all()]


@router.post("", response_model=CatalogOut, status_code=status.HTTP_201_CREATED)
async def create_catalog(
    body: CatalogIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> CatalogOut:
    obj = SolutionCatalog(**body.model_dump(exclude_none=True))
    session.add(obj)
    await session.flush()
    return CatalogOut.model_validate(obj)


@router.get("/{catalog_id}", response_model=CatalogOut)
async def get_catalog(
    catalog_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> CatalogOut:
    obj = await session.get(SolutionCatalog, catalog_id)
    if obj is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "catalog not found")
    return CatalogOut.model_validate(obj)
