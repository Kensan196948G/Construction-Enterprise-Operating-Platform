"""ESG SDGs マッピング テスト."""

from __future__ import annotations

from exec_api.services.esg_calculator import (
    SDG_GOALS,
    calc_sdg_coverage,
    get_sdg_mapping,
)


def test_sdg_mapping_and_coverage() -> None:
    """マッピング表が 17 ゴール定義を持ち、coverage 計算が正しい."""
    assert len(SDG_GOALS) == 17

    mapping = get_sdg_mapping()
    assert isinstance(mapping, list)
    assert all("kpi" in m and "sdg_goals" in m for m in mapping)
    # 代表 KPI: accident_count は SDG 3 と 8 にマップ
    by_kpi = {m["kpi"]: [g["id"] for g in m["sdg_goals"]] for m in mapping}
    assert 3 in by_kpi["accident_count"]
    assert 8 in by_kpi["accident_count"]
    assert 5 in by_kpi["female_manager_ratio"]
    assert 13 in by_kpi["co2_total_t"]

    # カバレッジ: 3 つの KPI で 4 ゴール (3,5,8,10) をカバー
    cov = calc_sdg_coverage(["accident_count", "female_manager_ratio", "labor_overtime_avg"])
    assert set(cov["covered_goals"]) >= {3, 5, 8, 10}
    assert 0.0 < cov["coverage_ratio"] <= 1.0
    # by_goal は 17 件
    assert len(cov["by_goal"]) == 17
