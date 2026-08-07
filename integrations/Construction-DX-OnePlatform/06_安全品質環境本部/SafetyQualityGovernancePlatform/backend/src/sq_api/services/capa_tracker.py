"""CAPA (Corrective / Preventive / Effectiveness) の経過日数追跡.

各不適合の CAPA 段階の滞留 (stale) を検出し、ダッシュボード用サマリを生成する。
30 日以上同じ段階に留まっている案件は `stale=True` のフラグを立てる。
"""
from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass
from datetime import UTC, date, datetime

DEFAULT_STALE_THRESHOLD_DAYS = 30
CAPA_STAGES = ("open", "corrected", "prevented", "verified", "closed")


@dataclass
class CapaItem:
    nc_id: str
    title: str
    capa_status: str
    severity: str
    days_in_stage: int
    days_since_detected: int
    stale: bool
    due_date: str | None
    overdue: bool


def _parse_date(s: str | None) -> date | None:
    if not s:
        return None
    try:
        return datetime.fromisoformat(s.replace("Z", "+00:00")).date()
    except ValueError:
        try:
            return date.fromisoformat(s[:10])
        except ValueError:
            return None


def _today(today: date | None = None) -> date:
    return today or datetime.now(UTC).date()


def evaluate(
    nonconformities: Iterable[dict],
    *,
    today: date | None = None,
    stale_threshold_days: int = DEFAULT_STALE_THRESHOLD_DAYS,
) -> dict:
    """CAPA 状態を評価し、滞留検知 + 集計を返す."""
    now = _today(today)
    items: list[CapaItem] = []
    stage_counts: dict[str, int] = dict.fromkeys(CAPA_STAGES, 0)
    stale_count = 0
    overdue_count = 0

    for nc in nonconformities:
        nc_id = nc.get("nc_id", "")
        status = str(nc.get("capa_status", "open"))
        stage_counts[status] = stage_counts.get(status, 0) + 1

        detected = _parse_date(nc.get("detected_at"))
        # capa の最終更新日を擬似的に detected_at から算出 (DB 連携前)
        stage_started = _parse_date(nc.get("stage_started_at")) or detected
        days_in_stage = (now - stage_started).days if stage_started else 0
        days_since_detected = (now - detected).days if detected else 0

        due = _parse_date(nc.get("due_date"))
        overdue = bool(due and now > due and status != "closed")
        stale = status != "closed" and days_in_stage >= stale_threshold_days
        if stale:
            stale_count += 1
        if overdue:
            overdue_count += 1

        items.append(
            CapaItem(
                nc_id=nc_id,
                title=str(nc.get("title", "")),
                capa_status=status,
                severity=str(nc.get("severity", "minor")),
                days_in_stage=max(days_in_stage, 0),
                days_since_detected=max(days_since_detected, 0),
                stale=stale,
                due_date=nc.get("due_date"),
                overdue=overdue,
            )
        )

    stale_items = [i.__dict__ for i in items if i.stale]
    return {
        "as_of": now.isoformat(),
        "stale_threshold_days": stale_threshold_days,
        "total": len(items),
        "by_stage": stage_counts,
        "stale_count": stale_count,
        "overdue_count": overdue_count,
        "stale_items": stale_items,
        "items": [i.__dict__ for i in items],
    }
