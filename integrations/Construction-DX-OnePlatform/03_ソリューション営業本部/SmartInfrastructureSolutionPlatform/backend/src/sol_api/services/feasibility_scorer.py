"""F/S スコアラ.

4軸 (技術 / 法務 / 環境 / 事業性) × 0-100 を重み付き合算し
GO / HOLD / NO_GO を判定する.

重み: 技術 0.30 / 法務 0.20 / 環境 0.20 / 事業性 0.30 (合計 1.0)
閾値: total >= 70 -> GO, 50 <= total < 70 -> HOLD, total < 50 -> NO_GO
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from typing import Literal


Decision = Literal["GO", "HOLD", "NO_GO"]


@dataclass(frozen=True)
class FeasibilityWeights:
    technical: Decimal = Decimal("0.30")
    legal: Decimal = Decimal("0.20")
    environment: Decimal = Decimal("0.20")
    business: Decimal = Decimal("0.30")

    def validate(self) -> None:
        total = self.technical + self.legal + self.environment + self.business
        if (total - Decimal("1.0")).copy_abs() > Decimal("0.001"):
            raise ValueError(f"weights must sum to 1.0 (got {total})")


@dataclass(frozen=True)
class FeasibilityInput:
    technical_score: Decimal
    legal_score: Decimal
    environment_score: Decimal
    business_score: Decimal


@dataclass(frozen=True)
class FeasibilityResult:
    total_score: Decimal  # 0-100, 小数2桁
    decision: Decision


def _clip(v: Decimal) -> Decimal:
    if v < Decimal("0"):
        return Decimal("0")
    if v > Decimal("100"):
        return Decimal("100")
    return v


def calculate(
    inp: FeasibilityInput,
    weights: FeasibilityWeights | None = None,
    *,
    threshold_go: Decimal = Decimal("70"),
    threshold_hold: Decimal = Decimal("50"),
) -> FeasibilityResult:
    """4軸スコア -> 重み付き合算 + 判定."""
    w = weights or FeasibilityWeights()
    w.validate()

    total = (
        _clip(inp.technical_score) * w.technical
        + _clip(inp.legal_score) * w.legal
        + _clip(inp.environment_score) * w.environment
        + _clip(inp.business_score) * w.business
    )
    total = total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    if total >= threshold_go:
        decision: Decision = "GO"
    elif total >= threshold_hold:
        decision = "HOLD"
    else:
        decision = "NO_GO"

    return FeasibilityResult(total_score=total, decision=decision)
