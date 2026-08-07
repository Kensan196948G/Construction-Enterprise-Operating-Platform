"""労働安全衛生統計の度数率・強度率計算 (per 労安法 / ISO 45001)."""
from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass


@dataclass(frozen=True)
class SafetyStats:
    """災害統計 (度数率 / 強度率)."""

    injuries: int
    lost_days: int
    total_work_hours: float
    frequency_rate: float  # 度数率
    severity_rate: float  # 強度率


def frequency_rate(injuries: int, total_work_hours: float) -> float:
    """度数率 = (死傷者数 / 延べ労働時間数) × 1,000,000.

    労安法・厚労省統計準拠。延べ労働時間が 0 以下なら 0 を返す。
    """
    if total_work_hours is None or total_work_hours <= 0:
        return 0.0
    return (injuries / total_work_hours) * 1_000_000


def severity_rate(lost_days: int, total_work_hours: float) -> float:
    """強度率 = (労働損失日数 / 延べ労働時間数) × 1,000."""
    if total_work_hours is None or total_work_hours <= 0:
        return 0.0
    return (lost_days / total_work_hours) * 1_000


def aggregate(records: Iterable[dict], total_work_hours: float) -> SafetyStats:
    """事故レコード列から度数率/強度率を集計.

    records: [{"injuries": int, "lost_days": int}, ...]
    """
    injuries = 0
    lost_days = 0
    for r in records:
        injuries += int(r.get("injuries", 0) or 0)
        lost_days += int(r.get("lost_days", 0) or 0)
    return SafetyStats(
        injuries=injuries,
        lost_days=lost_days,
        total_work_hours=float(total_work_hours or 0),
        frequency_rate=frequency_rate(injuries, total_work_hours),
        severity_rate=severity_rate(lost_days, total_work_hours),
    )
