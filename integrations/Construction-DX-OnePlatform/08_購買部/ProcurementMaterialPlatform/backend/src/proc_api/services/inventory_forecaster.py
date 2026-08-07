"""在庫予測サービス.

時系列の消費履歴から 30/60/90 日後の必要在庫を予測する。
Prophet / 重い ML ライブラリを必須にせず、純 Python + 簡易線形回帰 + 季節性
(月次/四半期) で実装。Prophet 等が利用可能な場合は将来的に差し替え可能なよう
内部 _forecast_engine を分離する。

主要関数:
  - forecast_inventory(history, horizons, seasonality=True) -> ForecastResult
  - has_seasonality(history) -> bool
"""
from __future__ import annotations

import statistics
from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Iterable, Sequence


# ---------- データクラス ----------


@dataclass(frozen=True)
class ConsumptionPoint:
    """日次消費量の 1 点."""

    day: date
    quantity: float


@dataclass(frozen=True)
class ForecastPoint:
    """予測 1 点."""

    horizon_days: int
    target_date: date
    predicted_consumption: float  # 期間累計
    predicted_avg_daily: float
    required_inventory: float     # 推奨保持量 (累計 + バッファ)
    confidence: float             # 0.0-1.0


@dataclass
class ForecastResult:
    """予測結果."""

    material_id: int | None
    method: str  # "linear" / "moving_average" / "fallback"
    seasonality_detected: bool
    sample_size: int
    points: list[ForecastPoint] = field(default_factory=list)
    note: str | None = None


# ---------- 内部ロジック ----------


# 年度末工事集中 (1-3月) のラフ係数。日本の建設業の季節性近似。
_MONTH_SEASONAL_FACTOR: dict[int, float] = {
    1: 1.20, 2: 1.25, 3: 1.30,
    4: 0.95, 5: 0.90, 6: 0.95,
    7: 1.00, 8: 0.90, 9: 1.00,
    10: 1.05, 11: 1.10, 12: 1.05,
}


def _to_points(history: Iterable[dict]) -> list[ConsumptionPoint]:
    out: list[ConsumptionPoint] = []
    for h in history:
        d = h.get("day") or h.get("date") or h.get("effective_date")
        if isinstance(d, str):
            try:
                d = date.fromisoformat(d)
            except ValueError:
                continue
        if not isinstance(d, date):
            continue
        qty = h.get("quantity")
        if qty is None:
            qty = h.get("consumption", 0)
        try:
            out.append(ConsumptionPoint(day=d, quantity=float(qty)))
        except (TypeError, ValueError):
            continue
    out.sort(key=lambda p: p.day)
    return out


def has_seasonality(history: Sequence[ConsumptionPoint], threshold: float = 0.15) -> bool:
    """月別平均の変動係数を見て季節性ありを判定する."""
    if len(history) < 14:
        return False
    monthly: dict[int, list[float]] = {}
    for p in history:
        monthly.setdefault(p.day.month, []).append(p.quantity)
    avgs = [statistics.mean(v) for v in monthly.values() if v]
    if len(avgs) < 2:
        return False
    mean = statistics.mean(avgs)
    if mean <= 0:
        return False
    cv = statistics.pstdev(avgs) / mean
    return cv >= threshold


def _linear_regression(points: Sequence[ConsumptionPoint]) -> tuple[float, float]:
    """単純な最小二乗法で (slope, intercept) を返す. x = 経過日数."""
    n = len(points)
    if n < 2:
        only = points[0].quantity if n == 1 else 0.0
        return 0.0, only
    base_day = points[0].day
    xs = [(p.day - base_day).days for p in points]
    ys = [p.quantity for p in points]
    mean_x = statistics.mean(xs)
    mean_y = statistics.mean(ys)
    num = sum((x - mean_x) * (y - mean_y) for x, y in zip(xs, ys))
    den = sum((x - mean_x) ** 2 for x in xs)
    slope = num / den if den else 0.0
    intercept = mean_y - slope * mean_x
    return slope, intercept


def _seasonal_factor(target_month: int) -> float:
    return _MONTH_SEASONAL_FACTOR.get(target_month, 1.0)


def _confidence(sample_size: int, method: str) -> float:
    if method == "fallback":
        return 0.2
    base = min(1.0, sample_size / 60.0)
    if method == "linear":
        return round(0.5 + base * 0.45, 3)
    return round(0.4 + base * 0.4, 3)


def forecast_inventory(
    history: Iterable[dict],
    horizons: Sequence[int] = (30, 60, 90),
    *,
    safety_buffer_ratio: float = 0.15,
    use_seasonality: bool = True,
    material_id: int | None = None,
) -> ForecastResult:
    """資材消費履歴から将来必要在庫を予測.

    history: [{"day": date|str, "quantity": float}, ...]
    horizons: 予測日数のタプル (例: (30,60,90))
    safety_buffer_ratio: 累計予測消費量に乗せる安全係数
    """
    points = _to_points(history)
    n = len(points)

    # フォールバック (履歴 < 3 点 or 全部 0)
    total = sum(p.quantity for p in points)
    if n < 3 or total <= 0:
        # 直近 1 点があればその値を日次として推定、無ければ 0
        baseline = points[-1].quantity if points else 0.0
        anchor = points[-1].day if points else date.today()
        result = ForecastResult(
            material_id=material_id,
            method="fallback",
            seasonality_detected=False,
            sample_size=n,
            note="履歴が不足しているためフォールバック予測 (直近値ベース) を返却",
        )
        for h in horizons:
            target = anchor + timedelta(days=h)
            consumption = baseline * h
            result.points.append(
                ForecastPoint(
                    horizon_days=h,
                    target_date=target,
                    predicted_consumption=round(consumption, 3),
                    predicted_avg_daily=round(baseline, 4),
                    required_inventory=round(consumption * (1 + safety_buffer_ratio), 3),
                    confidence=_confidence(n, "fallback"),
                )
            )
        return result

    seasonality = use_seasonality and has_seasonality(points)
    slope, intercept = _linear_regression(points)
    base_day = points[0].day
    last_day = points[-1].day
    last_x = (last_day - base_day).days

    result = ForecastResult(
        material_id=material_id,
        method="linear",
        seasonality_detected=seasonality,
        sample_size=n,
    )

    for h in horizons:
        target = last_day + timedelta(days=h)
        # 期間累計消費 = ∫(t=last_x+1..last_x+h) (slope*t + intercept) dt の離散近似
        consumption = 0.0
        for offset in range(1, h + 1):
            day = last_day + timedelta(days=offset)
            x = last_x + offset
            daily = max(0.0, slope * x + intercept)
            if seasonality:
                daily *= _seasonal_factor(day.month)
            consumption += daily
        avg_daily = consumption / h if h else 0.0
        result.points.append(
            ForecastPoint(
                horizon_days=h,
                target_date=target,
                predicted_consumption=round(consumption, 3),
                predicted_avg_daily=round(avg_daily, 4),
                required_inventory=round(consumption * (1 + safety_buffer_ratio), 3),
                confidence=_confidence(n, "linear"),
            )
        )
    return result
