"""標準図ライブラリ."""
from __future__ import annotations

import os
from typing import Annotated
from urllib.parse import urlparse

import httpx
from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from pydantic import BaseModel
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db_session
from ..models import StandardDrawing
from ..services.drawing_thumbnailer import render_pdf_thumbnail

router = APIRouter(prefix="/drawings", tags=["drawings"])


class DrawingIn(BaseModel):
    drawing_code: str
    drawing_name: str
    category: str | None = None
    file_format: str = "DWG"
    storage_url: str
    revision: str | None = None


class DrawingOut(DrawingIn):
    id: int
    version: int

    model_config = {"from_attributes": True}


@router.get("", response_model=list[DrawingOut])
async def list_drawings(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    q: str | None = Query(None),
) -> list[DrawingOut]:
    stmt = select(StandardDrawing)
    if q:
        like = f"%{q}%"
        stmt = stmt.where(
            or_(
                StandardDrawing.drawing_code.ilike(like),
                StandardDrawing.drawing_name.ilike(like),
            )
        )
    rows = (await session.execute(stmt)).scalars().all()
    return [DrawingOut.model_validate(r) for r in rows]


@router.post("", response_model=DrawingOut, status_code=status.HTTP_201_CREATED)
async def create_drawing(
    body: DrawingIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> DrawingOut:
    drawing = StandardDrawing(**body.model_dump(exclude_none=True))
    session.add(drawing)
    await session.flush()
    return DrawingOut.model_validate(drawing)


@router.get("/{drawing_id}", response_model=DrawingOut)
async def get_drawing(
    drawing_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> DrawingOut:
    drawing = await session.get(StandardDrawing, drawing_id)
    if drawing is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "drawing not found")
    return DrawingOut.model_validate(drawing)


async def _fetch_drawing_bytes(storage_url: str) -> bytes | None:
    """storage_url から PDF を取得する.

    file:// or ローカル相対パスはディスク読み込み, http(s) は httpx で取得。
    取得失敗時は None を返してプレースホルダにフォールバックさせる。
    """
    if not storage_url:
        return None
    try:
        parsed = urlparse(storage_url)
        if parsed.scheme in ("", "file"):
            path = parsed.path or storage_url
            if os.name == "nt" and path.startswith("/"):
                path = path.lstrip("/")
            if os.path.exists(path):
                with open(path, "rb") as f:
                    return f.read()
            return None
        if parsed.scheme in ("http", "https"):
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(storage_url)
                if resp.status_code == 200:
                    return resp.content
        return None
    except Exception:
        return None


@router.get("/{drawing_id}/thumbnail")
async def get_drawing_thumbnail(
    drawing_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> Response:
    """PDF 標準図の 1 ページ目をサムネ画像 (PNG or SVG プレースホルダ) として返す."""
    drawing = await session.get(StandardDrawing, drawing_id)
    if drawing is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "drawing not found")

    pdf_bytes: bytes | None = None
    if (drawing.file_format or "").upper() == "PDF":
        pdf_bytes = await _fetch_drawing_bytes(drawing.storage_url)

    result = render_pdf_thumbnail(
        pdf_bytes,
        label=f"{drawing.drawing_code} {drawing.drawing_name[:20]}",
    )
    headers = {"X-Thumbnail-Source": result.source}
    return Response(content=result.content, media_type=result.media_type, headers=headers)
