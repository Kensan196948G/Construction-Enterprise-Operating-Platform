"""PFI 評価ロジックのユニットテスト (NPV / IRR / VFM 検算)."""

from __future__ import annotations

import math

from sol_api.services.pfi_evaluator import (
    PfiInput,
    evaluate,
    monte_carlo,
    sensitivity,
)


def test_npv_simple_two_year_project() -> None:
    """初期投資 100, 年次 60/60, 割引率 10% の NPV.

    NPV = -100 + 60/1.10 + 60/1.21
        = -100 + 54.5454545... + 49.5867768...
        = 4.1322313...
    """
    res = evaluate(
        PfiInput(
            initial_investment=100.0,
            annual_cashflows=[60.0, 60.0],
            discount_rate=0.10,
        )
    )
    assert math.isclose(res.npv, 4.13, abs_tol=0.01)
    assert res.is_viable is True
    assert res.payback_period_years == 2  # 累積 -100 + 60 + 60 = 20 -> t=2 で正に


def test_irr_balanced_cashflows() -> None:
    """初期投資 1000, 年次 500 を 3 年 受取の IRR.

    NPV(r) = -1000 + 500/(1+r) + 500/(1+r)^2 + 500/(1+r)^3 = 0
    -> IRR ≒ 0.2337 (約 23.37%)
    """
    res = evaluate(
        PfiInput(
            initial_investment=1000.0,
            annual_cashflows=[500.0, 500.0, 500.0],
            discount_rate=0.05,
        )
    )
    assert res.irr is not None
    assert math.isclose(res.irr, 0.2337, abs_tol=0.005)
    # 割引率 5% より IRR が大きいので viable
    assert res.is_viable is True


def test_vfm_calculation() -> None:
    """VFM = (PSC - PFI) / PSC."""
    res = evaluate(
        PfiInput(
            initial_investment=200.0,
            annual_cashflows=[100.0, 100.0, 100.0],
            discount_rate=0.05,
            psc_cost=1000.0,
            pfi_cost=850.0,
        )
    )
    assert res.vfm is not None
    assert math.isclose(res.vfm, 0.15, abs_tol=0.001)


# ============ Monte Carlo / 感度分析 ============


def test_monte_carlo_reproducible_with_seed() -> None:
    """同一 seed で 2 回回した結果が完全一致 (再現性)."""
    inp = PfiInput(
        initial_investment=1000.0,
        annual_cashflows=[400.0, 400.0, 400.0, 400.0],
        discount_rate=0.05,
    )
    r1 = monte_carlo(inp, iterations=1000, seed=42)
    r2 = monte_carlo(inp, iterations=1000, seed=42)
    assert r1.mean_npv == r2.mean_npv
    assert r1.p5_npv == r2.p5_npv
    assert r1.p95_npv == r2.p95_npv


def test_monte_carlo_distribution_around_base_npv() -> None:
    """擾乱を加えた NPV 分布の平均が base NPV 近傍に収束する."""
    inp = PfiInput(
        initial_investment=500.0,
        annual_cashflows=[200.0, 200.0, 200.0],
        discount_rate=0.05,
    )
    base = evaluate(inp).npv
    res = monte_carlo(inp, iterations=5000, seed=7)
    # CF/rate ともガウス平均0 -> mean は base 近傍 (許容幅 base+25%)
    assert abs(res.mean_npv - base) < max(20.0, abs(base) * 0.25)
    # p5 < median < p95
    assert res.p5_npv <= res.median_npv <= res.p95_npv
    # ヒストグラム件数が iterations と一致
    assert sum(b["count"] for b in res.histogram) == res.iterations
    assert 0.0 <= res.prob_positive_npv <= 1.0


def test_sensitivity_ranks_variables_by_impact() -> None:
    """感度分析で impact 降順に並び、3 変数が返る."""
    inp = PfiInput(
        initial_investment=1000.0,
        annual_cashflows=[300.0, 300.0, 300.0, 300.0, 300.0],
        discount_rate=0.04,
    )
    res = sensitivity(inp, delta_pct=0.10, rate_delta_abs=0.02)
    names = [r.variable for r in res.rows]
    assert set(names) == {"initial_investment", "discount_rate", "annual_cashflow"}
    # impact 降順
    impacts = [r.impact for r in res.rows]
    assert impacts == sorted(impacts, reverse=True)
    # annual_cashflow の影響は initial_investment の影響より大きい (CF が複数年ある)
    cf_impact = next(r.impact for r in res.rows if r.variable == "annual_cashflow")
    inv_impact = next(r.impact for r in res.rows if r.variable == "initial_investment")
    assert cf_impact > inv_impact
