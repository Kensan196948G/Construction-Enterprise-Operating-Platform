"""CIM データ管理 + 点群タイル化 stub."""
from __future__ import annotations

from typing import Annotated

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db_session
from ..models import CimDataset

router = APIRouter(prefix="/cim", tags=["cim"])


class CimDatasetIn(BaseModel):
    dataset_name: str
    project_id: int | None = None
    data_type: str
    file_format: str
    storage_url: str
    crs: str | None = None
    point_count: int | None = None
    attributes: dict | None = None


class CimDatasetOut(CimDatasetIn):
    id: int
    tile_url_template: str | None = None

    model_config = {"from_attributes": True}


@router.get("", response_model=list[CimDatasetOut])
async def list_datasets(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[CimDatasetOut]:
    rows = (await session.execute(select(CimDataset))).scalars().all()
    return [CimDatasetOut.model_validate(r) for r in rows]


@router.post("", response_model=CimDatasetOut, status_code=status.HTTP_201_CREATED)
async def create_dataset(
    body: CimDatasetIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> CimDatasetOut:
    dataset = CimDataset(**body.model_dump(exclude_none=True))
    session.add(dataset)
    await session.flush()
    return CimDatasetOut.model_validate(dataset)


@router.post("/{dataset_id}/tile", response_model=CimDatasetOut)
async def request_tiling(
    dataset_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> CimDatasetOut:
    """点群タイル化を要求 (将来 Potree / 3D Tiles へ非同期パイプラインを接続)."""
    dataset = await session.get(CimDataset, dataset_id)
    if dataset is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "cim dataset not found")
    dataset.tile_url_template = (
        f"/static/tiles/{dataset_id}/{{level}}/{{x}}/{{y}}/{{z}}.bin"
    )
    await session.flush()
    return CimDatasetOut.model_validate(dataset)
