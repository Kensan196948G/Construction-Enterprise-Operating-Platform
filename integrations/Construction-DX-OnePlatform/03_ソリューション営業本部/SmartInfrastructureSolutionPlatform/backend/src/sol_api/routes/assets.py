"""インフラ資産 CRUD + 老朽度分析."""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Annotated

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends, HTTPException, status
from geoalchemy2.elements import WKTElement
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db_session
from ..models import InfrastructureAsset
from ..services.infrastructure_age_analyzer import (
    AgeAnalysisInput,
    AssetPoint,
    analyze,
    build_heatmap_geojson,
)

router = APIRouter(prefix="/assets", tags=["assets"])


class AssetIn(BaseModel):
    asset_code: str
    name: str
    asset_type: str
    longitude: float | None = None
    latitude: float | None = None
    address: str | None = None
    region: str | None = None
    scale_metric: Decimal | None = None
    scale_unit: str | None = None
    built_year: int | None = None
    last_inspection_date: date | None = None
    deterioration_score: Decimal | None = None
    importance_level: str | None = None
    applicable_laws: dict | None = None
    description: str | None = None


class AssetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    asset_code: str
    name: str
    asset_type: str
    longitude: float | None = None
    latitude: float | None = None
    address: str | None = None
    region: str | None = None
    scale_metric: Decimal | None = None
    scale_unit: str | None = None
    built_year: int | None = None
    last_inspection_date: date | None = None
    deterioration_score: Decimal | None = None
    importance_level: str | None = None
    description: str | None = None


def _to_out(obj: InfrastructureAsset) -> AssetOut:
    lon: float | None = None
    lat: float | None = None
    if obj.location is not None:
        try:
            # WKBElement -> WKT 文字列を簡易パース ("POINT(lon lat)")
            wkt = getattr(obj.location, "data", None) or str(obj.location)
            if isinstance(wkt, str) and wkt.upper().startswith("POINT"):
                inner = wkt[wkt.find("(") + 1 : wkt.rfind(")")]
                parts = inner.strip().split()
                if len(parts) >= 2:
                    lon, lat = float(parts[0]), float(parts[1])
        except Exception:
            pass
    return AssetOut(
        id=obj.id,
        asset_code=obj.asset_code,
        name=obj.name,
        asset_type=obj.asset_type,
        longitude=lon,
        latitude=lat,
        address=obj.address,
        region=obj.region,
        scale_metric=obj.scale_metric,
        scale_unit=obj.scale_unit,
        built_year=obj.built_year,
        last_inspection_date=obj.last_inspection_date,
        deterioration_score=obj.deterioration_score,
        importance_level=obj.importance_level,
        description=obj.description,
    )


class AgeAnalysisOut(BaseModel):
    age_years: int | None
    deterioration_score: Decimal
    priority: str


@router.get("", response_model=list[AssetOut])
async def list_assets(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[AssetOut]:
    result = await session.execute(select(InfrastructureAsset))
    return [_to_out(a) for a in result.scalars().all()]


@router.post("", response_model=AssetOut, status_code=status.HTTP_201_CREATED)
async def create_asset(
    body: AssetIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> AssetOut:
    data = body.model_dump(exclude={"longitude", "latitude"}, exclude_none=True)
    obj = InfrastructureAsset(**data)
    if body.longitude is not None and body.latitude is not None:
        obj.location = WKTElement(
            f"POINT({body.longitude} {body.latitude})", srid=4326
        )
    session.add(obj)
    await session.flush()
    return _to_out(obj)


@router.get("/age-heatmap")
async def age_heatmap(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    environment: str | None = None,
) -> dict:
    """全資産を老朽スコア付きで GeoJSON FeatureCollection として返す."""
    result = await session.execute(select(InfrastructureAsset))
    points: list[AssetPoint] = []
    for obj in result.scalars().all():
        out = _to_out(obj)
        points.append(
            AssetPoint(
                asset_id=obj.id,
                asset_code=obj.asset_code,
                name=obj.name,
                asset_type=obj.asset_type,
                longitude=out.longitude,
                latitude=out.latitude,
                built_year=obj.built_year,
                inspection_score=obj.deterioration_score,
                environment=environment,
                importance_level=obj.importance_level,
            )
        )
    return build_heatmap_geojson(points)


@router.get("/{asset_id}/age-analysis", response_model=AgeAnalysisOut)
async def age_analysis(
    asset_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    environment: str | None = None,
) -> AgeAnalysisOut:
    obj = await session.get(InfrastructureAsset, asset_id)
    if obj is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "asset not found")
    res = analyze(
        AgeAnalysisInput(
            built_year=obj.built_year,
            last_inspection_date=obj.last_inspection_date,
            inspection_score=obj.deterioration_score,
            environment=environment,
            importance_level=obj.importance_level,
        )
    )
    return AgeAnalysisOut(
        age_years=res.age_years,
        deterioration_score=res.deterioration_score,
        priority=res.priority,
    )
