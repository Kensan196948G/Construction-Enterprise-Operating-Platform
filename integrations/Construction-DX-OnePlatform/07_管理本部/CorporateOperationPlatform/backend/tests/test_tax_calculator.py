"""消費税自動計算 + インボイス制度の単体テスト."""
from __future__ import annotations

from corp_api.services.tax_calculator import calculate_tax, classify_item


def test_classify_standard_default() -> None:
    assert classify_item("建設資材") == "standard"


def test_calculate_standard_only() -> None:
    bd = calculate_tax(
        [{"item_name": "鉄骨", "amount_excl_tax": 100000}],
        issuer_qualified=True,
    )
    assert bd.standard_tax == 10000
    assert bd.reduced_tax == 0
    assert bd.total_tax == 10000
    assert bd.deductible_tax == 10000


def test_calculate_reduced_for_food() -> None:
    bd = calculate_tax(
        [{"item_name": "現場用 弁当", "amount_excl_tax": 10000}],
        issuer_qualified=True,
    )
    # キーワード "弁当" -> reduced 8%
    assert bd.reduced_tax == 800
    assert bd.standard_tax == 0
    assert bd.total_tax == 800


def test_calculate_mixed_standard_and_reduced() -> None:
    bd = calculate_tax(
        [
            {"item_name": "鉄骨", "amount_excl_tax": 100000},
            {"item_name": "新聞", "amount_excl_tax": 5000},
            {"item_name": "弁当", "amount_excl_tax": 2000},
        ],
        issuer_qualified=True,
    )
    assert bd.standard_tax == 10000
    # 5000*0.08 + 2000*0.08 = 400 + 160 = 560
    assert bd.reduced_tax == 560
    assert bd.total_tax == 10560
    assert bd.total_incl_tax == 117560


def test_qualified_issuer_full_deduction() -> None:
    bd = calculate_tax(
        [{"item_name": "鉄骨", "amount_excl_tax": 100000, "category": "standard"}],
        issuer_qualified=True,
    )
    assert bd.deductible_tax == 10000


def test_non_qualified_issuer_partial_deduction() -> None:
    bd = calculate_tax(
        [{"item_name": "鉄骨", "amount_excl_tax": 100000, "category": "standard"}],
        issuer_qualified=False,
    )
    # 80% 経過措置
    assert bd.deductible_tax == 8000
    assert bd.issuer_qualified is False
