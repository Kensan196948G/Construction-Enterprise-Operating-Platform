"""在庫最適化サービス.

主要ロジック:
  - 適正発注点 = リードタイム消費量 + 安全在庫
  - 安全在庫 = 平均日消費量 × バッファ日数 (default 7 日)
  - アラート分類:
      OK       : current >= reorder_point
      WARNING  : current < reorder_point (発注点割れ)
      DANGER   : 欠品予測日数 <= 7 (= current / avg_daily_usage)
"""
from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Iterable


@dataclass(frozen=True)
class InventoryAdvice:
    """発注点推奨."""

    material_code: str
    safety_stock: float
    reorder_point: float
    recommended_order_qty: float


@dataclass(frozen=True)
class StockAlert:
    """アラート."""

    material_code: str
    warehouse: str
    current_qty: float
    reorder_point: float
    avg_daily_usage: float
    days_to_stockout: float | None
    level: str  # OK / WARNING / DANGER


def optimize_reorder_point(
    avg_daily_usage: float,
    lead_time_days: int,
    buffer_days: int = 7,
    target_cover_days: int = 30,
) -> InventoryAdvice | None:
    """発注点と推奨発注量を計算する."""
    if avg_daily_usage <= 0:
        return None
    safety_stock = avg_daily_usage * buffer_days
    reorder_point = avg_daily_usage * lead_time_days + safety_stock
    recommended_order_qty = avg_daily_usage * target_cover_days
    return InventoryAdvice(
        material_code="",  # 呼び出し側で埋める
        safety_stock=round(safety_stock, 4),
        reorder_point=round(reorder_point, 4),
        recommended_order_qty=round(recommended_order_qty, 4),
    )


def _to_float(v: Decimal | float | int | None) -> float:
    if v is None:
        return 0.0
    return float(v)


def _classify(
    current_qty: float,
    reorder_point: float,
    avg_daily_usage: float,
    danger_days: int,
) -> tuple[str, float | None]:
    """level / days_to_stockout を判定する."""
    days: float | None = None
    if avg_daily_usage > 0:
        days = current_qty / avg_daily_usage
    if days is not None and days <= danger_days:
        return "DANGER", round(days, 2)
    if current_qty < reorder_point:
        return "WARNING", round(days, 2) if days is not None else None
    return "OK", round(days, 2) if days is not None else None


def scan_stock_alerts(
    inventories: Iterable[dict],
    danger_days: int = 7,
) -> list[StockAlert]:
    """在庫の dict 列を受け取り、アラートを返却する.

    各 dict のキー: material_code, warehouse, quantity, reorder_point, avg_daily_usage
    """
    alerts: list[StockAlert] = []
    for inv in inventories:
        cur = _to_float(inv.get("quantity"))
        rp = _to_float(inv.get("reorder_point"))
        adu = _to_float(inv.get("avg_daily_usage"))
        level, days = _classify(cur, rp, adu, danger_days)
        alerts.append(
            StockAlert(
                material_code=str(inv.get("material_code", "")),
                warehouse=str(inv.get("warehouse", "")),
                current_qty=cur,
                reorder_point=rp,
                avg_daily_usage=adu,
                days_to_stockout=days,
                level=level,
            )
        )
    return alerts
