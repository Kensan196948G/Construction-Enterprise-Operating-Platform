"""経営アラート評価サービス.

KPI 値が経営閾値を超えた/下回った場合にアラートを生成する。
ルールベース (将来は ML ベース異常検知に拡張)。
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any

from ..config import ExecApiSettings, get_settings


@dataclass(frozen=True)
class AlertCandidate:
    alert_code: str
    level: str  # critical|warning|info
    category: str
    title: str
    message: str
    kpi_type: str
    threshold_value: float
    actual_value: float
    triggered_at: datetime
    notify_targets: list[str]


def _gen_code(prefix: str) -> str:
    return f"{prefix}-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"


def evaluate(metrics: dict[str, Any], settings: ExecApiSettings | None = None) -> list[AlertCandidate]:
    """集約 KPI dict (consolidate_kpi の出力) からアラートを発火.

    Rules:
    - 平均利益率 < alert_profit_margin_min  -> warning (critical if <0)
    - 赤字案件数 > alert_deficit_project_max -> warning
    - 事故件数 > alert_accident_max          -> critical
    - 平均残業時間 > alert_overtime_hours_max -> warning
    """
    s = settings or get_settings()
    now = datetime.utcnow()
    alerts: list[AlertCandidate] = []

    profit = float(metrics.get("average_profit_margin", 0) or 0)
    if profit < s.alert_profit_margin_min:
        alerts.append(
            AlertCandidate(
                alert_code=_gen_code("PROFIT"),
                level="critical" if profit < 0 else "warning",
                category="profit",
                title="平均利益率が閾値を下回りました",
                message=(
                    f"平均利益率 {profit:.2%} が経営閾値 {s.alert_profit_margin_min:.2%} "
                    f"を下回っています。赤字案件レビューを推奨します。"
                ),
                kpi_type="average_profit_margin",
                threshold_value=s.alert_profit_margin_min,
                actual_value=profit,
                triggered_at=now,
                notify_targets=["executive", "planning_dept_head"],
            )
        )

    deficit = int(metrics.get("deficit_project_count", 0) or 0)
    if deficit > s.alert_deficit_project_max:
        alerts.append(
            AlertCandidate(
                alert_code=_gen_code("DEFICIT"),
                level="warning",
                category="profit",
                title="赤字案件数が閾値を超過",
                message=(
                    f"赤字案件 {deficit} 件が閾値 {s.alert_deficit_project_max} 件を超過。"
                    f"利益率低下予測モデルでの精査を推奨します。"
                ),
                kpi_type="deficit_project_count",
                threshold_value=float(s.alert_deficit_project_max),
                actual_value=float(deficit),
                triggered_at=now,
                notify_targets=["executive", "planning_dept_head", "site_managers"],
            )
        )

    accidents = int(metrics.get("accident_count", 0) or 0)
    if accidents > s.alert_accident_max:
        alerts.append(
            AlertCandidate(
                alert_code=_gen_code("SAFETY"),
                level="critical",
                category="safety",
                title="重大事故件数が閾値を超過",
                message=(
                    f"事故件数 {accidents} 件が閾値 {s.alert_accident_max} 件を超過。"
                    f"安全パトロール強化と全社安全大会を即時実施。"
                ),
                kpi_type="accident_count",
                threshold_value=float(s.alert_accident_max),
                actual_value=float(accidents),
                triggered_at=now,
                notify_targets=["executive", "safety_officer", "all_site_managers"],
            )
        )

    overtime = float(metrics.get("labor_overtime_avg", 0) or 0)
    if overtime > s.alert_overtime_hours_max:
        alerts.append(
            AlertCandidate(
                alert_code=_gen_code("OVERTIME"),
                level="warning",
                category="labor",
                title="平均残業時間が経営閾値を超過",
                message=(
                    f"平均残業 {overtime:.1f}h/月 が閾値 {s.alert_overtime_hours_max:.1f}h を"
                    f"超過。働き方改革に基づく業務再配分を検討。"
                ),
                kpi_type="labor_overtime_avg",
                threshold_value=s.alert_overtime_hours_max,
                actual_value=overtime,
                triggered_at=now,
                notify_targets=["executive", "corporate"],
            )
        )

    return alerts
