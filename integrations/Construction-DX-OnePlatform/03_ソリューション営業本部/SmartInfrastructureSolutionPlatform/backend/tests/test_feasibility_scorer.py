"""F/S スコアラのユニットテスト."""

from __future__ import annotations

from decimal import Decimal

from sol_api.services.feasibility_scorer import (
    FeasibilityInput,
    FeasibilityWeights,
    calculate,
)


def test_high_scores_yield_go() -> None:
    res = calculate(
        FeasibilityInput(
            technical_score=Decimal("90"),
            legal_score=Decimal("80"),
            environment_score=Decimal("75"),
            business_score=Decimal("85"),
        )
    )
    # 90*0.3 + 80*0.2 + 75*0.2 + 85*0.3 = 27 + 16 + 15 + 25.5 = 83.5
    assert res.total_score == Decimal("83.50")
    assert res.decision == "GO"


def test_medium_scores_yield_hold() -> None:
    res = calculate(
        FeasibilityInput(
            technical_score=Decimal("60"),
            legal_score=Decimal("55"),
            environment_score=Decimal("50"),
            business_score=Decimal("60"),
        )
    )
    # 60*0.3 + 55*0.2 + 50*0.2 + 60*0.3 = 18 + 11 + 10 + 18 = 57
    assert res.total_score == Decimal("57.00")
    assert res.decision == "HOLD"


def test_low_scores_yield_no_go_and_clipping() -> None:
    # 値が範囲外でもクリップして計算する
    res = calculate(
        FeasibilityInput(
            technical_score=Decimal("30"),
            legal_score=Decimal("-10"),  # -> 0
            environment_score=Decimal("20"),
            business_score=Decimal("40"),
        )
    )
    # 30*0.3 + 0*0.2 + 20*0.2 + 40*0.3 = 9 + 0 + 4 + 12 = 25
    assert res.total_score == Decimal("25.00")
    assert res.decision == "NO_GO"


def test_invalid_weights_raise() -> None:
    import pytest

    bad = FeasibilityWeights(
        technical=Decimal("0.5"),
        legal=Decimal("0.5"),
        environment=Decimal("0.5"),
        business=Decimal("0.5"),
    )
    with pytest.raises(ValueError):
        calculate(
            FeasibilityInput(
                technical_score=Decimal("50"),
                legal_score=Decimal("50"),
                environment_score=Decimal("50"),
                business_score=Decimal("50"),
            ),
            weights=bad,
        )
