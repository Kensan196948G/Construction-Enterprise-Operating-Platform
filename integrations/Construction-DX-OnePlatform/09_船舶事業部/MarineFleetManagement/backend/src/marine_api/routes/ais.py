"""AIS 受信エンドポイント (NMEA AIVDM 投入)."""
from __future__ import annotations

from typing import Annotated

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from ..services import parse_aivdm

router = APIRouter(prefix="/ais", tags=["ais"])


class AISSentenceIn(BaseModel):
    sentence: str = Field(..., description="NMEA0183 AIVDM/AIVDO センテンス全体")


@router.post("/decode")
async def decode_sentence(
    body: AISSentenceIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> dict:
    """単一の AIVDM センテンスを解析して位置情報を返す.

    将来的にはここから VesselPosition を upsert する想定。
    """
    try:
        pos = parse_aivdm(body.sentence)
    except ValueError as e:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(e)) from e
    return {
        "mmsi": pos.mmsi,
        "message_type": pos.message_type,
        "longitude": pos.longitude,
        "latitude": pos.latitude,
        "sog_knots": pos.sog_knots,
        "cog_deg": pos.cog_deg,
        "heading_deg": pos.heading_deg,
    }
