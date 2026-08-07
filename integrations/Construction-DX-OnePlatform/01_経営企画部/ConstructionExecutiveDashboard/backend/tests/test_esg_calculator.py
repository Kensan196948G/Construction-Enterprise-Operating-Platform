"""esg_calculator 単体テスト."""

from __future__ import annotations

from exec_api.services.esg_calculator import (
    Co2Input,
    PartnerScoreInput,
    calc_co2,
    calc_female_manager_ratio,
    calc_overall_esg_score,
    calc_partner_score,
    calc_turnover_rate,
)


def test_calc_co2_total_and_scope3_share() -> None:
    r = calc_co2(Co2Input(scope1_t=100, scope2_t=200, scope3_t=700))
    assert r.total_t == 1000
    assert abs(r.scope3_share - 0.7) < 1e-9


def test_calc_turnover_and_female_ratio_edge_cases() -> None:
    # 平均従業員数 0 で安全に 0 を返す
    assert calc_turnover_rate(5, 0) == 0.0
    assert calc_turnover_rate(10, 200) == 0.05
    # 管理職 0 で安全に 0
    assert calc_female_manager_ratio(0, 0) == 0.0
    assert calc_female_manager_ratio(3, 20) == 0.15


def test_calc_overall_esg_scorecard_high_quality_company() -> None:
    """優良企業の値で各軸スコアが 50 以上になる."""
    partner = calc_partner_score(
        PartnerScoreInput(partner_code="P001", quality_score=90, safety_score=95,
                          delivery_score=85, compliance_score=100)
    )
    assert partner > 80
    s = calc_overall_esg_score(
        co2_total_t=900, co2_target_t=1000,  # 目標以下 -> 100
        turnover_rate=0.05, female_manager_ratio=0.2,
        compliance_violations=0, partner_score_avg=partner,
    )
    assert s.environment_score == 100.0
    assert s.social_score >= 50.0
    assert s.governance_score >= 80.0
    assert s.overall_score > 70.0
