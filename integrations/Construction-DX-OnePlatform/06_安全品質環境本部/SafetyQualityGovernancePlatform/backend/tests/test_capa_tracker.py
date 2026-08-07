"""CAPA tracker の単体テスト (滞留検知)."""
from datetime import date

from sq_api.services.capa_tracker import evaluate


def test_capa_evaluates_stale_and_overdue() -> None:
    today = date(2026, 5, 22)
    ncs = [
        {
            "nc_id": "NC-001",
            "title": "図面齟齬",
            "detected_at": "2026-03-01",  # 82 日前 -> stale
            "capa_status": "open",
            "severity": "major",
            "due_date": "2026-04-01",  # overdue
        },
        {
            "nc_id": "NC-002",
            "title": "材料不適合",
            "detected_at": "2026-05-15",  # 7 日前 -> 滞留ではない
            "capa_status": "corrected",
            "severity": "minor",
        },
        {
            "nc_id": "NC-003",
            "title": "完了済",
            "detected_at": "2026-01-01",
            "capa_status": "closed",
            "severity": "minor",
        },
    ]
    r = evaluate(ncs, today=today)
    assert r["total"] == 3
    assert r["by_stage"]["open"] == 1
    assert r["by_stage"]["corrected"] == 1
    assert r["by_stage"]["closed"] == 1
    # NC-001 のみが stale + overdue
    assert r["stale_count"] == 1
    assert r["overdue_count"] == 1
    assert r["stale_items"][0]["nc_id"] == "NC-001"


def test_capa_no_records() -> None:
    r = evaluate([], today=date(2026, 5, 22))
    assert r["total"] == 0
    assert r["stale_count"] == 0
    assert r["by_stage"]["open"] == 0
