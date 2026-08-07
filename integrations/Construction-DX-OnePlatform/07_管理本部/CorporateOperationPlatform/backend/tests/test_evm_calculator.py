"""EVM 計算: PMBOK 教科書例で検算."""
from __future__ import annotations

import math

from corp_api.services.evm_calculator import calculate_evm


def test_pmbok_example_under_budget_and_behind() -> None:
    """PMBOK 標準例: BAC=100, PV=40, EV=35, AC=30.

    SV = EV - PV = -5 (behind), CV = EV - AC = 5 (under_budget)
    SPI = 35/40 = 0.875, CPI = 35/30 = 1.1667
    EAC = BAC/CPI = 100/1.1667 ~= 85.71
    """
    r = calculate_evm(pv=40, ev=35, ac=30, bac=100)
    assert r.cv == 5
    assert r.sv == -5
    assert math.isclose(r.cpi, 35 / 30, rel_tol=1e-6)
    assert math.isclose(r.spi, 35 / 40, rel_tol=1e-6)
    assert math.isclose(r.eac, 100 / (35 / 30), rel_tol=1e-6)
    assert r.cost_status == "under_budget"
    assert r.schedule_status == "behind"


def test_on_budget_and_on_schedule() -> None:
    r = calculate_evm(pv=100, ev=100, ac=100, bac=200)
    assert r.cv == 0
    assert r.sv == 0
    assert math.isclose(r.cpi, 1.0)
    assert math.isclose(r.spi, 1.0)
    assert r.cost_status == "on_budget"
    assert r.schedule_status == "on_schedule"
    assert math.isclose(r.eac, 200.0)
