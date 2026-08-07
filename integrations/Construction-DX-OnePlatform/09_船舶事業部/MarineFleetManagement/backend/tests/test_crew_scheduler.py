"""シフト最適化テスト."""
from __future__ import annotations

from datetime import date

from marine_api.services.crew_scheduler import (
    CrewSnapshot,
    VoyagePlan,
    optimize_shifts,
)


def _voyage(vid: int, start: date, days: int, required: dict[str, int] | None = None) -> VoyagePlan:
    return VoyagePlan(
        voyage_id=vid,
        voyage_no=f"V{vid:03d}",
        start_date=start,
        end_date=date.fromordinal(start.toordinal() + days - 1),
        required=required or {"船長": 1, "機関長": 1, "甲板員": 1},
    )


def _crew(
    cid: int, rank: str, *, license_grade: str | None = None, consec: int = 0
) -> CrewSnapshot:
    return CrewSnapshot(
        crew_id=cid,
        crew_code=f"C{cid:03d}",
        rank=rank,
        license_grade=license_grade,
        current_consecutive_days=consec,
        last_rest_at=date(2026, 5, 15),
    )


def test_simple_assignment_succeeds() -> None:
    """単純な要件を満たすクルーがいれば全員割当."""
    voyages = [_voyage(1, date(2026, 5, 20), days=5)]
    crew = [
        _crew(1, "船長", license_grade="海技士(航海) 2 級"),
        _crew(2, "機関長", license_grade="海技士(機関) 2 級"),
        _crew(3, "甲板員"),
    ]
    r = optimize_shifts(voyages, crew)
    assert len(r.assignments) == 3
    assert r.unfilled == ()
    assert r.violations == ()


def test_unfilled_when_no_license_match() -> None:
    """船長必要だが免状が無いクルーしかいない → 未充足."""
    voyages = [_voyage(1, date(2026, 5, 20), days=3, required={"船長": 1})]
    crew = [_crew(1, "船長", license_grade=None)]  # 免状なし → 不適格
    r = optimize_shifts(voyages, crew)
    assert r.assignments == ()
    assert len(r.unfilled) == 1
    assert r.unfilled[0][1] == "船長"
    assert any("船長" in v for v in r.violations)


def test_exceeds_max_consecutive_days_rejected() -> None:
    """既に 28 日連続 + 5 日航海 = 33 日 → 上限 30 超過で割当拒否."""
    voyages = [_voyage(1, date(2026, 5, 20), days=5, required={"甲板員": 1})]
    crew = [_crew(1, "甲板員", consec=28)]
    r = optimize_shifts(voyages, crew, max_consecutive_days=30)
    assert r.assignments == ()
    assert any("連続乗船" in v for v in r.violations)


def test_low_consecutive_days_prioritized() -> None:
    """連続日数が少ないクルーが優先される (公平性)."""
    voyages = [_voyage(1, date(2026, 5, 20), days=3, required={"甲板員": 1})]
    crew = [
        _crew(1, "甲板員", consec=20),
        _crew(2, "甲板員", consec=5),
        _crew(3, "甲板員", consec=15),
    ]
    r = optimize_shifts(voyages, crew)
    assert len(r.assignments) == 1
    assert r.assignments[0].crew_id == 2  # 最も連続日数が少ない
