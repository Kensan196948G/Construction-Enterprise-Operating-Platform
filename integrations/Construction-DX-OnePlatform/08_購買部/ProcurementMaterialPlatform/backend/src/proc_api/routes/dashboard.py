"""ダッシュボード KPI."""
from __future__ import annotations

from typing import Annotated

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..db.session import get_db_session
from ..models import Inventory, PurchaseOrder, Supplier
from ..services import scan_stock_alerts

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
async def summary(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict:
    """発注実績 / 在庫アラート / 評価分布の総合ビュー."""
    total_orders = (await session.execute(select(func.count(PurchaseOrder.id)))).scalar_one()
    total_amount = (
        await session.execute(select(func.coalesce(func.sum(PurchaseOrder.total_amount), 0)))
    ).scalar_one()
    supplier_rows = (
        await session.execute(select(Supplier.evaluation_rank, func.count(Supplier.id)).group_by(Supplier.evaluation_rank))
    ).all()
    rank_dist = {r or "未評価": c for r, c in supplier_rows}

    inv_rows = (await session.execute(select(Inventory))).scalars().all()
    inv_dicts = [
        {
            "material_code": r.material_code,
            "warehouse": r.warehouse,
            "quantity": r.quantity,
            "reorder_point": r.reorder_point,
            "avg_daily_usage": r.avg_daily_usage,
        }
        for r in inv_rows
    ]
    alerts = scan_stock_alerts(inv_dicts)
    alert_summary = {
        "ok": sum(1 for a in alerts if a.level == "OK"),
        "warning": sum(1 for a in alerts if a.level == "WARNING"),
        "danger": sum(1 for a in alerts if a.level == "DANGER"),
    }

    return {
        "orders": {
            "count": int(total_orders),
            "total_amount": float(total_amount or 0),
        },
        "suppliers": {
            "rank_distribution": rank_dist,
        },
        "inventory_alerts": alert_summary,
    }
