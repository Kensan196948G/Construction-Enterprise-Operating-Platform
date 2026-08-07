"""4M 分析サマリの単体テスト."""
from sq_api.services.four_m_analyzer import summarize


def test_four_m_summary_integrates_near_miss_and_accidents() -> None:
    nm = [
        {
            "occurred_at": "2026-04-10T09:00:00+09:00",
            "cause_analysis": {"man": True, "machine": False, "material": True, "method": False},
            "risk_level": "high",
        },
        {
            "occurred_at": "2026-04-15T09:00:00+09:00",
            "cause_analysis": {"man": True, "machine": True, "material": False, "method": False},
            "risk_level": "medium",
        },
    ]
    ac = [
        {
            "occurred_at": "2026-04-20T09:00:00+09:00",
            "severity": "serious",
            "cause_analysis": {"machine": True},
        }
    ]
    s = summarize(nm, ac, from_="2026-04-01", to="2026-04-30")
    d = s.to_dict()
    assert d["total_records"] == 3
    assert d["near_miss_count"] == 2
    assert d["accident_count"] == 1
    # man: 2件 (NM x2), machine: 2件 (NM1 + AC1), material: 1件
    assert d["by_4m_count"]["man"] == 2
    assert d["by_4m_count"]["machine"] == 2
    assert d["by_4m_count"]["material"] == 1
    # severity weight: man = high(7) + medium(3) = 10
    assert d["by_4m_severity"]["man"] == 10
    # machine = medium(3) + serious(7) = 10
    assert d["by_4m_severity"]["machine"] == 10


def test_four_m_summary_filters_by_period_and_dept() -> None:
    nm = [
        {
            "occurred_at": "2026-03-10T09:00:00+09:00",
            "dept_id": "D1",
            "cause_analysis": {"man": True},
            "risk_level": "low",
        },
        {
            "occurred_at": "2026-04-15T09:00:00+09:00",
            "dept_id": "D2",
            "cause_analysis": {"man": True},
            "risk_level": "low",
        },
        {
            "occurred_at": "2026-04-20T09:00:00+09:00",
            "dept_id": "D1",
            "cause_analysis": {"machine": True},
            "risk_level": "medium",
        },
    ]
    s = summarize(nm, [], from_="2026-04-01", to="2026-04-30", dept_id="D1")
    d = s.to_dict()
    assert d["total_records"] == 1
    assert d["by_4m_count"]["machine"] == 1
    assert d["by_4m_count"]["man"] == 0
