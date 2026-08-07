"""欠品アラート強化サービス.

在庫予測 + 工事スケジュール紐付けで欠品リスクを判定し、
重要度 low / medium / high / critical を返却する。

判定軸:
  - 予測必要在庫 vs 現在庫
  - 工程のクリティカルパス (critical_path=True なら 1 段階上)
  - 工事開始日までの猶予
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Iterable, Sequence

from .inventory_forecaster import ForecastResult, forecast_inventory


Severity = str  # "low" | "medium" | "high" | "critical"


@dataclass(frozen=True)
class ScheduleLink:
    """資材と工事工程の紐付け."""

    project_code: str
    process_name: str
    required_qty: float
    required_by: date
    critical_path: bool = False


@dataclass(frozen=True)
class StockoutAlertItem:
    """欠品アラート 1 件."""

    material_id: int | None
    material_code: str
    project_code: str | None
    process_name: str | None
    required_by: date | None
    days_to_deadline: int
    current_qty: float
    predicted_consumption: float
    predicted_shortage: float
    severity: Severity
    message: str
    notify_at: date           # 通知すべき日 (前日通知)


@dataclass
class StockoutAlertReport:
    """欠品アラート全体."""

    generated_at: date = field(default_factory=date.today)
    alerts: list[StockoutAlertItem] = field(default_factory=list)


# ---------- 判定ロジック ----------


def _severity(
    shortage_ratio: float,
    days_to_deadline: int,
    critical_path: bool,
) -> Severity:
    """欠品比率 + 期限まで日数 + クリパス で重要度判定."""
    # shortage_ratio = (predicted_shortage / required_qty)
    base: Severity
    if shortage_ratio <= 0 and days_to_deadline > 7:
        base = "low"
    elif shortage_ratio <= 0.1 or days_to_deadline > 14:
        base = "low"
    elif shortage_ratio <= 0.3 or days_to_deadline > 7:
        base = "medium"
    elif shortage_ratio <= 0.6 or days_to_deadline > 3:
        base = "high"
    else:
        base = "critical"

    if critical_path:
        order = ["low", "medium", "high", "critical"]
        idx = min(order.index(base) + 1, len(order) - 1)
        base = order[idx]
    return base


def _project_consumption_until(forecast: ForecastResult, target_day: date) -> float:
    """予測結果から target_day までの予測消費量を線形補間."""
    if not forecast.points:
        return 0.0
    if not forecast.points[0].target_date:
        return 0.0
    base_day = forecast.points[0].target_date - timedelta(days=forecast.points[0].horizon_days)
    days = (target_day - base_day).days
    if days <= 0:
        return 0.0
    # 平均日次 (最遠 horizon の平均) を流用
    avg_daily = forecast.points[-1].predicted_avg_daily
    return round(avg_daily * days, 3)


def evaluate_stockout_alerts(
    materials: Iterable[dict],
    schedule: Sequence[ScheduleLink],
    today: date | None = None,
) -> StockoutAlertReport:
    """資材毎・工程毎に欠品アラートを生成.

    materials: [{
        "material_id": int|None,
        "material_code": str,
        "current_qty": float,
        "history": [{"day": date, "quantity": float}, ...]
    }, ...]
    """
    today = today or date.today()
    report = StockoutAlertReport(generated_at=today)

    # 資材コード → 予測 + 現在庫 マップ
    forecasts: dict[str, tuple[ForecastResult, float, int | None]] = {}
    for m in materials:
        code = str(m.get("material_code", ""))
        history = m.get("history") or []
        f = forecast_inventory(
            history,
            horizons=(30, 60, 90),
            material_id=m.get("material_id"),
        )
        forecasts[code] = (f, float(m.get("current_qty", 0.0)), m.get("material_id"))

    for link in schedule:
        # この schedule に紐付く資材は material_code が schedule 側に無いため、
        # 「全資材 × 全工程」ではなく呼出側が必要に応じて materials を絞る前提。
        # ここでは materials の各 code 毎に link を評価する。
        for code, (fc, current, mid) in forecasts.items():
            days_to_deadline = (link.required_by - today).days
            predicted = _project_consumption_until(fc, link.required_by)
            shortage = max(0.0, link.required_qty + predicted - current)
            ratio = shortage / link.required_qty if link.required_qty > 0 else 0.0
            sev = _severity(ratio, days_to_deadline, link.critical_path)
            # low かつ shortage = 0 なら通知しない
            if sev == "low" and shortage <= 0:
                continue
            notify_at = link.required_by - timedelta(days=1)
            msg = (
                f"{code} @ {link.project_code}/{link.process_name}: "
                f"必要 {link.required_qty:.1f}, 現在庫 {current:.1f}, "
                f"予測不足 {shortage:.1f} ({sev})"
            )
            report.alerts.append(
                StockoutAlertItem(
                    material_id=mid,
                    material_code=code,
                    project_code=link.project_code,
                    process_name=link.process_name,
                    required_by=link.required_by,
                    days_to_deadline=days_to_deadline,
                    current_qty=current,
                    predicted_consumption=predicted,
                    predicted_shortage=round(shortage, 3),
                    severity=sev,
                    message=msg,
                    notify_at=notify_at,
                )
            )
    # severity 順 (critical → low) で並べる
    order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    report.alerts.sort(key=lambda a: (order.get(a.severity, 9), a.days_to_deadline))
    return report
