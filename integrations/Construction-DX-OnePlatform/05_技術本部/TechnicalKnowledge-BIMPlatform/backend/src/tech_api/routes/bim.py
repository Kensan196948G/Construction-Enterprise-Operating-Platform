"""BIM モデル upload/download + メタデータ + LOD 切替."""
from __future__ import annotations

import io
from typing import Annotated

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db_session
from ..models import BimModel
from ..services.i_construction_validator import validate_submission
from ..services.ifc_parser import parse_ifc_stream

router = APIRouter(prefix="/bim", tags=["bim"])


class BimModelOut(BaseModel):
    id: int
    model_name: str
    project_id: int | None
    file_format: str
    ifc_schema: str | None
    storage_url: str
    file_size_bytes: int | None
    version: int
    lod: str
    crs: str | None
    attributes: dict | None

    model_config = {"from_attributes": True}


class BimMetadataPatch(BaseModel):
    lod: str | None = None
    crs: str | None = None
    attributes: dict | None = None


@router.get("", response_model=list[BimModelOut])
async def list_models(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    project_id: int | None = None,
) -> list[BimModelOut]:
    stmt = select(BimModel)
    if project_id is not None:
        stmt = stmt.where(BimModel.project_id == project_id)
    rows = (await session.execute(stmt)).scalars().all()
    return [BimModelOut.model_validate(r) for r in rows]


@router.post("/upload", response_model=BimModelOut, status_code=status.HTTP_201_CREATED)
async def upload_ifc(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    file: UploadFile = File(...),
    model_name: str = Form(...),
    project_id: int | None = Form(None),
    lod: str = Form("LOD200"),
    crs: str | None = Form(None),
) -> BimModelOut:
    # i-Construction 形式チェック
    validation = validate_submission(
        filename=file.filename or "unknown.ifc",
        category="bim",
        metadata={"project_id": project_id, "work_type": "BIM", "lod": lod},
        strict_naming=False,
    )
    if not validation.valid:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail={"reason": "i-Construction validation failed", **validation.as_dict()},
        )

    raw = await file.read()
    summary = parse_ifc_stream(io.BytesIO(raw))

    model = BimModel(
        model_name=model_name,
        project_id=project_id,
        file_format="IFC",
        ifc_schema=summary.schema,
        storage_url=f"file://uploaded/{file.filename}",  # 本番は Blob/S3 へ
        file_size_bytes=len(raw),
        lod=lod,
        crs=crs,
        attributes=summary.as_dict(),
    )
    session.add(model)
    await session.flush()
    return BimModelOut.model_validate(model)


@router.get("/{model_id}", response_model=BimModelOut)
async def get_model(
    model_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> BimModelOut:
    model = await session.get(BimModel, model_id)
    if model is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "bim model not found")
    return BimModelOut.model_validate(model)


@router.patch("/{model_id}", response_model=BimModelOut)
async def patch_metadata(
    model_id: int,
    body: BimMetadataPatch,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> BimModelOut:
    model = await session.get(BimModel, model_id)
    if model is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "bim model not found")
    if body.lod is not None:
        model.lod = body.lod
    if body.crs is not None:
        model.crs = body.crs
    if body.attributes is not None:
        model.attributes = body.attributes
    await session.flush()
    return BimModelOut.model_validate(model)
