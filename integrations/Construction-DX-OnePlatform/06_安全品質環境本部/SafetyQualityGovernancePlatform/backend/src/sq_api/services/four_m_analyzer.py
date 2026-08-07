"""4M (Man/Machine/Material/Method) 分析サマリ.

ヒヤリハットと労災を統合した期間集計を提供する。
- 4M 別件数
- 4M 別重大度合計 (リスクレベル/severity を点数化)
- 部署 (dept_id) フィルタ対応
- 期間フィルタ (from / to, ISO 8601 date or datetime)
"""
from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass, field

# 4M キーは固定
FOUR_M_KEYS = ("man", "machine", "material", "method")

# リスク/重大度の点数 (大きいほど重大)
RISK_WEIGHT = {
    "low": 1,
    "medium": 3,
    "high": 7,
    "critical": 10,
    # 労災 severity
    "first_aid": 1,
    "minor": 3,
    "serious": 7,
    "fatal": 10,
}


@dataclass
class FourMSummary:
    """4M 集計結果."""

    total_records: int = 0
    by_4m_count: dict[str, int] = field(default_factory=lambda: dict.fromkeys(FOUR_M_KEYS, 0))
    by_4m_severity: dict[str, int] = field(default_factory=lambda: dict.fromkeys(FOUR_M_KEYS, 0))
    near_miss_count: int = 0
    accident_count: int = 0

    def to_dict(self) -> dict:
        return {
            "total_records": self.total_records,
            "near_miss_count": self.near_miss_count,
            "accident_count": self.accident_count,
            "by_4m_count": dict(self.by_4m_count),
            "by_4m_severity": dict(self.by_4m_severity),
        }


def _in_range(occurred_at: str | None, from_: str | None, to: str | None) -> bool:
    if not occurred_at:
        return True
    occ = occurred_at[:10]
    if from_ and occ < from_[:10]:
        return False
    if to and occ > to[:10]:
        return False
    return True


def _matches_dept(item: dict, dept_id: str | None) -> bool:
    if not dept_id:
        return True
    return item.get("dept_id") == dept_id or item.get("project_id") == dept_id


def summarize(
    near_miss_records: Iterable[dict],
    accident_records: Iterable[dict],
    from_: str | None = None,
    to: str | None = None,
    dept_id: str | None = None,
) -> FourMSummary:
    """ヒヤリハット + 労災を統合した 4M 集計を返す."""
    summary = FourMSummary()

    for nm in near_miss_records:
        if not _in_range(nm.get("occurred_at"), from_, to):
            continue
        if not _matches_dept(nm, dept_id):
            continue
        summary.total_records += 1
        summary.near_miss_count += 1
        ca = nm.get("cause_analysis") or {}
        risk = str(nm.get("risk_level", "medium")).lower()
        weight = RISK_WEIGHT.get(risk, 3)
        for k in FOUR_M_KEYS:
            if ca.get(k):
                summary.by_4m_count[k] += 1
                summary.by_4m_severity[k] += weight

    for ac in accident_records:
        if not _in_range(ac.get("occurred_at"), from_, to):
            continue
        if not _matches_dept(ac, dept_id):
            continue
        summary.total_records += 1
        summary.accident_count += 1
        sev = str(ac.get("severity", "minor")).lower()
        weight = RISK_WEIGHT.get(sev, 3)
        # 労災は root_cause / cause_analysis があればそれを使い、無ければ man に寄せる
        ca = ac.get("cause_analysis") or {}
        matched = False
        for k in FOUR_M_KEYS:
            if ca.get(k):
                summary.by_4m_count[k] += 1
                summary.by_4m_severity[k] += weight
                matched = True
        if not matched:
            summary.by_4m_count["man"] += 1
            summary.by_4m_severity["man"] += weight

    return summary
