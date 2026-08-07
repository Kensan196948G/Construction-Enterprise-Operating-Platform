"""在庫照会 + アラート + 棚卸."""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Annotated

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..db.session import get_db_session
from ..models import Inventory, InventoryMovement
from ..services import forecast_inventory, scan_stock_alerts

router = APIRouter(prefix="/inventory", tags=["inventory"])


class InventoryIn(BaseModel):
    material_code: str = Field(..., max_length=32)
    material_name: str
    warehouse: str = "本社倉庫"
    lot_no: str | None = None
    quantity: float = 0
    unit: str = "個"
    reorder_point: float | None = None
    safety_stock: float | None = None
    avg_daily_usage: float | None = None


class InventoryOut(InventoryIn):
    id: int


class StocktakeIn(BaseModel):
    counted_qty: float


@router.get("", response_model=list[InventoryOut])
async def list_inventory(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[InventoryOut]:
    rows = (await session.execute(select(Inventory))).scalars().all()
    return [InventoryOut.model_validate(r, from_attributes=True) for r in rows]


@router.post("", response_model=InventoryOut, status_code=status.HTTP_201_CREATED)
async def upsert_inventory(
    body: InventoryIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> InventoryOut:
    inv = Inventory(**body.model_dump(exclude_none=True))
    session.add(inv)
    await session.flush()
    return InventoryOut.model_validate(inv, from_attributes=True)


@router.get("/alerts")
async def alerts(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict:
    s = get_settings()
    rows = (await session.execute(select(Inventory))).scalars().all()
    inv_dicts = [
        {
            "material_code": r.material_code,
            "warehouse": r.warehouse,
            "quantity": r.quantity,
            "reorder_point": r.reorder_point,
            "avg_daily_usage": r.avg_daily_usage,
        }
        for r in rows
    ]
    items = scan_stock_alerts(inv_dicts, danger_days=s.stockout_forecast_days)
    return {
        "alerts": [
            {
                "material_code": a.material_code,
                "warehouse": a.warehouse,
                "current_qty": a.current_qty,
                "reorder_point": a.reorder_point,
                "days_to_stockout": a.days_to_stockout,
                "level": a.level,
            }
            for a in items
        ],
        "summary": {
            "ok": sum(1 for a in items if a.level == "OK"),
            "warning": sum(1 for a in items if a.level == "WARNING"),
            "danger": sum(1 for a in items if a.level == "DANGER"),
        },
    }


@router.get("/forecast")
async def forecast(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    material_id: int | None = None,
    material_code: str | None = None,
    days: int = 90,
) -> dict:
    """在庫予測.

    - material_id か material_code いずれかを指定。
    - days <= 30 → [30], <= 60 → [30,60], それ以外 → [30,60,90]
    - 履歴は InventoryMovement (movement_type='out') を日次集計
    """
    inv: Inventory | None = None
    if material_id is not None:
        inv = await session.get(Inventory, material_id)
        if inv is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "inventory not found")
        material_code = inv.material_code
    if material_code is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "material_id か material_code が必要")

    rows = (
        (
            await session.execute(
                select(InventoryMovement).where(
                    InventoryMovement.material_code == material_code,
                    InventoryMovement.movement_type == "out",
                )
            )
        )
        .scalars()
        .all()
    )
    # 日次集計
    daily: dict[str, float] = {}
    for r in rows:
        key = r.movement_date.isoformat()
        daily[key] = daily.get(key, 0.0) + float(r.quantity)
    history = [{"day": k, "quantity": v} for k, v in daily.items()]

    if days <= 30:
        horizons = (30,)
    elif days <= 60:
        horizons = (30, 60)
    else:
        horizons = (30, 60, 90)

    result = forecast_inventory(history, horizons=horizons, material_id=material_id)
    return {
        "material_id": material_id,
        "material_code": material_code,
        "method": result.method,
        "seasonality_detected": result.seasonality_detected,
        "sample_size": result.sample_size,
        "current_qty": float(inv.quantity) if inv is not None else None,
        "points": [
            {
                "horizon_days": p.horizon_days,
                "target_date": p.target_date.isoformat(),
                "predicted_consumption": p.predicted_consumption,
                "predicted_avg_daily": p.predicted_avg_daily,
                "required_inventory": p.required_inventory,
                "confidence": p.confidence,
            }
            for p in result.points
        ],
        "note": result.note,
    }


@router.get("/monthly-report")
async def monthly_stocktake_report(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict:
    """J-SOX 業務統制: 月次棚卸レポート — 31日以上未実施の在庫品目一覧."""
    from datetime import timedelta

    cutoff = date.today() - timedelta(days=31)
    rows = (await session.execute(select(Inventory))).scalars().all()
    overdue = [
        {
            "inventory_id": r.id,
            "material_code": r.material_code,
            "material_name": r.material_name,
            "warehouse": r.warehouse,
            "quantity": float(r.quantity),
            "last_stocktake_at": r.last_stocktake_at.isoformat() if r.last_stocktake_at else None,
            "days_since_stocktake": (date.today() - r.last_stocktake_at).days
            if r.last_stocktake_at
            else None,
        }
        for r in rows
        if r.last_stocktake_at is None or r.last_stocktake_at < cutoff
    ]
    return {
        "report_date": date.today().isoformat(),
        "overdue_count": len(overdue),
        "items": overdue,
    }


@router.post("/{inventory_id}/stocktake")
async def stocktake(
    inventory_id: int,
    body: StocktakeIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict:
    inv = await session.get(Inventory, inventory_id)
    if inv is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "inventory not found")
    diff = Decimal(str(body.counted_qty)) - inv.quantity
    inv.quantity = Decimal(str(body.counted_qty))
    inv.last_stocktake_at = date.today()
    # J-SOX 業務統制: 棚卸差異を InventoryMovement に記録
    if diff != 0:
        movement = InventoryMovement(
            inventory_id=inventory_id,
            material_code=inv.material_code,
            movement_type="adjust_in" if diff > 0 else "adjust_out",
            quantity=abs(diff),
            unit=inv.unit,
            movement_date=date.today(),
            operator_id=str(user.sub) if hasattr(user, "sub") else None,
            remarks=f"棚卸調整 counted={body.counted_qty}",
        )
        session.add(movement)
    await session.flush()
    return {
        "inventory_id": inventory_id,
        "adjusted_by": float(diff),
        "new_qty": float(inv.quantity),
    }
