"""消費税自動計算 (軽減 8% / 標準 10%) + インボイス制度.

判定ロジック:
* 品目 (`item`) ごとに `category` を分類:
    - "food", "newspaper" -> reduced (8%)
    - それ以外 -> standard (10%)
* 品目名から推定する簡易キーワード辞書も用意。
* インボイス制度:
    - issuer_qualified=True (適格事業者) -> 仕入税額控除 100%
    - issuer_qualified=False -> 経過措置 (2026.05 時点では 80% 控除)
"""
from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass
from decimal import ROUND_DOWN, Decimal
from typing import Literal

TaxCategory = Literal["standard", "reduced", "exempt"]

STANDARD_RATE = Decimal("0.10")
REDUCED_RATE = Decimal("0.08")
EXEMPT_RATE = Decimal("0")

# 経過措置: 適格でない事業者からの仕入の控除率 (2023-10〜2026-09: 80%,
# 2026-10〜2029-09: 50%, 以降: 0%). 簡易化のため一律 80% を採用。
NON_QUALIFIED_DEDUCTION_RATE = Decimal("0.80")

# キーワード -> 軽減税率扱い
_REDUCED_KEYWORDS = (
    "食",
    "弁当",
    "飲料",
    "茶",
    "新聞",
    "food",
    "newspaper",
)


def classify_item(item_name: str, explicit_category: str | None = None) -> TaxCategory:
    """品目名から税区分を判定."""
    if explicit_category in ("standard", "reduced", "exempt"):
        return explicit_category  # type: ignore[return-value]
    if not item_name:
        return "standard"
    name = item_name.lower()
    for kw in _REDUCED_KEYWORDS:
        if kw in name or kw in item_name:
            return "reduced"
    return "standard"


def rate_for(category: TaxCategory) -> Decimal:
    if category == "reduced":
        return REDUCED_RATE
    if category == "exempt":
        return EXEMPT_RATE
    return STANDARD_RATE


@dataclass
class TaxLine:
    item_name: str
    amount_excl_tax: Decimal
    category: TaxCategory
    rate: Decimal
    tax_amount: Decimal

    def to_dict(self) -> dict:
        return {
            "item_name": self.item_name,
            "amount_excl_tax": float(self.amount_excl_tax),
            "category": self.category,
            "rate": float(self.rate),
            "tax_amount": float(self.tax_amount),
        }


@dataclass
class TaxBreakdown:
    lines: list[TaxLine]
    total_excl_tax: Decimal
    total_tax: Decimal
    total_incl_tax: Decimal
    standard_tax: Decimal
    reduced_tax: Decimal
    deductible_tax: Decimal
    issuer_qualified: bool

    def to_dict(self) -> dict:
        return {
            "lines": [l.to_dict() for l in self.lines],
            "total_excl_tax": float(self.total_excl_tax),
            "total_tax": float(self.total_tax),
            "total_incl_tax": float(self.total_incl_tax),
            "standard_tax": float(self.standard_tax),
            "reduced_tax": float(self.reduced_tax),
            "deductible_tax": float(self.deductible_tax),
            "issuer_qualified": self.issuer_qualified,
        }


def _q(d: Decimal) -> Decimal:
    """円未満切り捨て (国税庁 端数処理の一般ルール)."""
    return d.quantize(Decimal("1"), rounding=ROUND_DOWN)


def calculate_tax(
    items: Iterable[dict],
    *,
    issuer_qualified: bool = True,
) -> TaxBreakdown:
    """品目リストから消費税を集計.

    items 各要素:
        {"item_name": str, "amount_excl_tax": number, "category": Optional[str]}
    """
    lines: list[TaxLine] = []
    total_excl = Decimal("0")
    std_tax = Decimal("0")
    rdc_tax = Decimal("0")

    for it in items:
        name = it.get("item_name", "")
        excl = Decimal(str(it.get("amount_excl_tax", 0)))
        cat = classify_item(name, it.get("category"))
        rate = rate_for(cat)
        tax = _q(excl * rate)
        lines.append(
            TaxLine(item_name=name, amount_excl_tax=excl, category=cat, rate=rate, tax_amount=tax)
        )
        total_excl += excl
        if cat == "standard":
            std_tax += tax
        elif cat == "reduced":
            rdc_tax += tax

    total_tax = std_tax + rdc_tax
    if issuer_qualified:
        deductible = total_tax
    else:
        deductible = _q(total_tax * NON_QUALIFIED_DEDUCTION_RATE)

    return TaxBreakdown(
        lines=lines,
        total_excl_tax=total_excl,
        total_tax=total_tax,
        total_incl_tax=total_excl + total_tax,
        standard_tax=std_tax,
        reduced_tax=rdc_tax,
        deductible_tax=deductible,
        issuer_qualified=issuer_qualified,
    )
