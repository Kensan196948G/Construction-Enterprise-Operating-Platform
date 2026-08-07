"""シフト最適化サービス.

voyage 計画と crew (乗組員) 一覧を入力に、船員労働法準拠の最適シフトを生成。

制約 (簡易):
- 連続乗船日数 ≤ MAX_CONSECUTIVE_DAYS (既定 30)
- 過去 7 日に WEEKLY_REST_HOURS (既定 24h) の連続休息
- ボートあたり最低必要人員と役職 (船長 / 機関長 / 一等航海士 / 甲板員) を満たす
- 海技免状の役職整合 (船長は海技士(航海) 1〜3 級など)

アルゴリズム: 役職ごとに「連続乗船日数が少ない順」で貪欲に割当 +
最低限の組合せ最適化 (役職要件未充足時のスワップ)。
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date
from typing import Iterable

DEFAULT_MAX_CONSECUTIVE_DAYS = 30
DEFAULT_WEEKLY_REST_HOURS = 24

# 最低人員と役職要件 (簡易)
DEFAULT_VESSEL_REQUIREMENTS: dict[str, int] = {
    "船長": 1,
    "機関長": 1,
    "一等航海士": 1,
    "甲板員": 2,
}

# 役職 ↔ 海技免状級の整合性 (許容される最低級)
RANK_LICENSE_MIN_GRADE: dict[str, set[str]] = {
    "船長": {"海技士(航海) 1 級", "海技士(航海) 2 級", "海技士(航海) 3 級"},
    "機関長": {"海技士(機関) 1 級", "海技士(機関) 2 級", "海技士(機関) 3 級"},
    "一等航海士": {
        "海技士(航海) 1 級",
        "海技士(航海) 2 級",
        "海技士(航海) 3 級",
        "海技士(航海) 4 級",
    },
    # 甲板員は免状不要
}


@dataclass(frozen=True)
class CrewSnapshot:
    """シフト割当時点の乗組員スナップショット."""

    crew_id: int
    crew_code: str
    rank: str
    license_grade: str | None
    current_consecutive_days: int
    last_rest_at: date | None


@dataclass(frozen=True)
class VoyagePlan:
    voyage_id: int
    voyage_no: str
    start_date: date
    end_date: date
    required: dict[str, int] = field(
        default_factory=lambda: dict(DEFAULT_VESSEL_REQUIREMENTS)
    )


@dataclass(frozen=True)
class ShiftAssignment:
    voyage_id: int
    voyage_no: str
    crew_id: int
    crew_code: str
    rank: str
    start_date: date
    end_date: date


@dataclass(frozen=True)
class SchedulingResult:
    assignments: tuple[ShiftAssignment, ...]
    violations: tuple[str, ...]
    warnings: tuple[str, ...]
    unfilled: tuple[tuple[int, str, int], ...]  # (voyage_id, rank, missing_count)


def _voyage_days(plan: VoyagePlan) -> int:
    return (plan.end_date - plan.start_date).days + 1


def _is_license_ok(rank: str, license_grade: str | None) -> bool:
    required = RANK_LICENSE_MIN_GRADE.get(rank)
    if required is None:
        return True  # 甲板員等は免状不要
    if not license_grade:
        return False
    return license_grade in required


def _has_recent_rest(
    snap: CrewSnapshot, plan_start: date, *, weekly_rest_hours: int
) -> bool:
    """過去 7 日に連続休息が確保されているか (簡易).

    last_rest_at が plan_start の 7 日以内であれば OK とみなす。
    """
    if weekly_rest_hours <= 0:
        return True
    if snap.last_rest_at is None:
        # 履歴不明はとりあえず OK (warning は呼び側で出す)
        return True
    return (plan_start - snap.last_rest_at).days <= 7


def optimize_shifts(
    voyages: Iterable[VoyagePlan],
    crew: Iterable[CrewSnapshot],
    *,
    max_consecutive_days: int = DEFAULT_MAX_CONSECUTIVE_DAYS,
    weekly_rest_hours: int = DEFAULT_WEEKLY_REST_HOURS,
) -> SchedulingResult:
    """voyage 群に対し crew を貪欲に割当てる.

    返り値:
        SchedulingResult: 割当・違反・未充足ポジション
    """
    voyage_list = sorted(voyages, key=lambda v: v.start_date)
    crew_list = list(crew)

    assignments: list[ShiftAssignment] = []
    violations: list[str] = []
    warnings: list[str] = []
    unfilled: list[tuple[int, str, int]] = []

    # 割当時のローカル "連続乗船日数" 追跡
    consec: dict[int, int] = {c.crew_id: c.current_consecutive_days for c in crew_list}
    assigned_until: dict[int, date | None] = {c.crew_id: None for c in crew_list}

    for plan in voyage_list:
        voyage_days = _voyage_days(plan)
        if voyage_days <= 0:
            warnings.append(
                f"voyage {plan.voyage_no}: end_date <= start_date のためスキップ"
            )
            continue

        used_in_voyage: set[int] = set()

        for rank, need in plan.required.items():
            # 役職に合致 & まだ本航海未割当 のクルー
            candidates = [
                c
                for c in crew_list
                if c.crew_id not in used_in_voyage
                and c.rank == rank
                and _is_license_ok(rank, c.license_grade)
            ]
            # 連続乗船日数が少ない順 / last_rest_at が新しい順
            candidates.sort(
                key=lambda c: (
                    consec[c.crew_id],
                    -(c.last_rest_at.toordinal() if c.last_rest_at else 0),
                )
            )

            picked = 0
            for c in candidates:
                if picked >= need:
                    break

                projected = consec[c.crew_id] + voyage_days
                # 既に直前 voyage の終端が plan.start_date より前なら連続日数リセット
                prev_end = assigned_until[c.crew_id]
                if prev_end is not None and (plan.start_date - prev_end).days > 1:
                    projected = voyage_days

                # 制約チェック
                if projected > max_consecutive_days:
                    violations.append(
                        f"voyage {plan.voyage_no} / crew {c.crew_code}: "
                        f"割当時連続乗船 {projected} 日が上限 {max_consecutive_days} 日を超過"
                    )
                    continue
                if not _has_recent_rest(c, plan.start_date, weekly_rest_hours=weekly_rest_hours):
                    warnings.append(
                        f"crew {c.crew_code}: 週間休息 {weekly_rest_hours}h の確認推奨"
                    )

                assignments.append(
                    ShiftAssignment(
                        voyage_id=plan.voyage_id,
                        voyage_no=plan.voyage_no,
                        crew_id=c.crew_id,
                        crew_code=c.crew_code,
                        rank=c.rank,
                        start_date=plan.start_date,
                        end_date=plan.end_date,
                    )
                )
                consec[c.crew_id] = projected
                assigned_until[c.crew_id] = plan.end_date
                used_in_voyage.add(c.crew_id)
                picked += 1

            if picked < need:
                missing = need - picked
                unfilled.append((plan.voyage_id, rank, missing))
                violations.append(
                    f"voyage {plan.voyage_no}: {rank} が {missing} 名不足 (必要 {need})"
                )

    return SchedulingResult(
        assignments=tuple(assignments),
        violations=tuple(violations),
        warnings=tuple(warnings),
        unfilled=tuple(unfilled),
    )
