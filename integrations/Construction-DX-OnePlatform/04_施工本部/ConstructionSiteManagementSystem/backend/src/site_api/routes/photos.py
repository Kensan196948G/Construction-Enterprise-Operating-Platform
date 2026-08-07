"""現場写真アップロード + AI分類 + S3/MinIO 連携."""
from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Annotated, Any

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends, File, Form, UploadFile, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..db.session import get_db_session
from ..models import SitePhoto
from ..services.ai_photo_classifier import AIPhotoClassifier
from ..services.hashing import compute_bytes_hash
from ..services.s3_storage import S3PhotoStorage

router = APIRouter(prefix="/photos", tags=["photos"])


class PhotoOut(BaseModel):
    id: int
    project_id: int
    file_path: str
    captured_at: datetime | None
    category: str | None
    ai_tags: dict[str, Any] | None
    sha256: str | None
    s3_key: str | None = None


class PresignRequest(BaseModel):
    project_id: int
    filename: str
    content_type: str = "image/jpeg"


class PresignResponse(BaseModel):
    s3_key: str
    upload_url: str | None
    fallback: bool


@router.get("", response_model=list[PhotoOut])
async def list_photos(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    project_id: int | None = None,
) -> list[PhotoOut]:
    stmt = select(SitePhoto)
    if project_id is not None:
        stmt = stmt.where(SitePhoto.project_id == project_id)
    rows = (await session.execute(stmt)).scalars().all()
    return [PhotoOut.model_validate(r, from_attributes=True) for r in rows]


@router.post("/upload", response_model=PhotoOut, status_code=status.HTTP_201_CREATED)
async def upload_photo(
    project_id: Annotated[int, Form()],
    file: Annotated[UploadFile, File()],
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    category: Annotated[str | None, Form()] = None,
) -> PhotoOut:
    settings = get_settings()
    data = await file.read()
    digest = compute_bytes_hash(data)
    # S3 キー: project_id/yyyymm/sha_<filename>
    today = datetime.now(tz=timezone.utc)
    s3_key = (
        f"{project_id}/{today.strftime('%Y%m')}/{digest}_{file.filename or 'photo.jpg'}"
    )
    storage = S3PhotoStorage(settings)
    stored = storage.upload(s3_key, data, content_type=file.content_type or "image/jpeg")
    # ローカル fallback の場合 ``stored`` は実ファイルパス
    file_path = stored if os.path.isabs(stored) else s3_key
    rec = SitePhoto(
        project_id=project_id,
        file_path=file_path,
        captured_at=today,
        category=category,
        sha256=digest,
        s3_key=s3_key,
    )
    session.add(rec)
    await session.flush()
    return PhotoOut.model_validate(rec, from_attributes=True)


@router.post("/presign", response_model=PresignResponse)
async def presign_upload(
    body: PresignRequest,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> PresignResponse:
    settings = get_settings()
    today = datetime.now(tz=timezone.utc)
    s3_key = f"{body.project_id}/{today.strftime('%Y%m')}/{today.timestamp():.0f}_{body.filename}"
    storage = S3PhotoStorage(settings)
    url = storage.presigned_put_url(s3_key)
    return PresignResponse(s3_key=s3_key, upload_url=url, fallback=url is None)


@router.post("/ai-classify")
async def ai_classify(
    file: Annotated[UploadFile, File()],
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> dict[str, Any]:
    data = await file.read()
    classifier = AIPhotoClassifier()
    return await classifier.classify(data, mime=file.content_type or "image/jpeg")
