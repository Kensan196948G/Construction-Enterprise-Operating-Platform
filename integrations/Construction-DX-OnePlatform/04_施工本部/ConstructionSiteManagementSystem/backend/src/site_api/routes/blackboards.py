"""電子黒板 + SHA-256 改ざん検知."""
from __future__ import annotations

from datetime import date
from typing import Annotated

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db_session
from ..models import ElectronicBoard
from ..services.hashing import compute_blackboard_hash

router = APIRouter(prefix="/electronic-boards", tags=["blackboards"])


class BlackboardIn(BaseModel):
    photo_id: int | None = None
    project_name: str | None = None
    work_type: str | None = None
    measurement_point: str | None = None
    design_value: str | None = None
    actual_value: str | None = None
    contractor: str | None = None
    record_date: date | None = None
    image_base64: str | None = None  # 画像本体は別保存、ハッシュ計算用


class BlackboardOut(BaseModel):
    id: int
    photo_id: int | None
    project_name: str | None
    work_type: str | None
    measurement_point: str | None
    design_value: str | None
    actual_value: str | None
    contractor: str | None
    record_date: date | None
    hash_value: str | None


@router.get("", response_model=list[BlackboardOut])
async def list_blackboards(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[BlackboardOut]:
    rows = (await session.execute(select(ElectronicBoard))).scalars().all()
    return [BlackboardOut.model_validate(r, from_attributes=True) for r in rows]


@router.post("", response_model=BlackboardOut, status_code=201)
async def create_blackboard(
    body: BlackboardIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> BlackboardOut:
    meta = body.model_dump(exclude={"image_base64"})
    h = compute_blackboard_hash(
        {k: (v.isoformat() if hasattr(v, "isoformat") else v) for k, v in meta.items()},
        body.image_base64,
    )
    rec = ElectronicBoard(**meta, hash_value=h)
    session.add(rec)
    await session.flush()
    return BlackboardOut.model_validate(rec, from_attributes=True)


@router.get("/{board_id}/verify")
async def verify_blackboard(
    board_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    image_base64: str | None = None,
) -> dict[str, bool | str]:
    rec = await session.get(ElectronicBoard, board_id)
    if rec is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "board not found")
    meta = {
        "photo_id": rec.photo_id,
        "project_name": rec.project_name,
        "work_type": rec.work_type,
        "measurement_point": rec.measurement_point,
        "design_value": rec.design_value,
        "actual_value": rec.actual_value,
        "contractor": rec.contractor,
        "record_date": rec.record_date.isoformat() if rec.record_date else None,
    }
    h = compute_blackboard_hash(meta, image_base64)
    return {"matches": h == rec.hash_value, "stored": rec.hash_value or "", "recomputed": h}
