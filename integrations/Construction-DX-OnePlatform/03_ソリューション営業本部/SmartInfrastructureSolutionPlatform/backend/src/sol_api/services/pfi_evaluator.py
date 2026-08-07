"""PFI / PPP 事業性評価.

- NPV (Net Present Value)  : Σ CF_t / (1 + r)^t
- IRR (Internal Rate of Return): NPV = 0 となる割引率 (bisection)
- VFM (Value For Money)        : (PSC - PFI) / PSC
- Monte Carlo                  : CF / discount_rate に乱数擾乱を加えた NPV 分布
- 感度分析                      : 各入力 ±幅 を加えた時の NPV 変化幅 (中央値からの差)
"""

from __future__ import annotations

import random
import statistics
from dataclasses import dataclass
from decimal import Decimal


@dataclass(frozen=True)
class PfiInput:
    initial_investment: float  # t=0 の投資 (正の値で受け取り内部で負号付与)
    annual_cashflows: list[float]  # t=1..N の年次キャッシュフロー
    discount_rate: float  # 例 0.04
    psc_cost: float | None = None
    pfi_cost: float | None = None


@dataclass(frozen=True)
class PfiResult:
    npv: float
    irr: float | None
    vfm: float | None
    payback_period_years: int | None
    is_viable: bool


@dataclass(frozen=True)
class MonteCarloResult:
    iterations: int
    mean_npv: float
    median_npv: float
    std_npv: float
    p5_npv: float
    p95_npv: float
    prob_positive_npv: float  # 0.0 - 1.0
    histogram: list[dict]  # [{bin_min, bin_max, count}, ...]


@dataclass(frozen=True)
class SensitivityRow:
    variable: str
    delta_low: float  # variable - delta -> npv 差
    delta_high: float  # variable + delta -> npv 差
    impact: float  # |delta_high - delta_low| /2 (絶対影響度)


@dataclass(frozen=True)
class SensitivityResult:
    base_npv: float
    rows: list[SensitivityRow]


def _npv(rate: float, cashflows: list[float]) -> float:
    """cashflows[0] が t=0, cashflows[i] が t=i."""
    total = 0.0
    for t, cf in enumerate(cashflows):
        total += cf / ((1.0 + rate) ** t)
    return total


def _irr(cashflows: list[float], *, max_iter: int = 200, tol: float = 1e-7) -> float | None:
    """IRR を求める. 解が存在しないとき None."""
    if not cashflows or len(cashflows) < 2:
        return None
    lo, hi = -0.99, 10.0
    f_lo = _npv(lo, cashflows)
    f_hi = _npv(hi, cashflows)
    if f_lo * f_hi > 0:
        return None
    for _ in range(max_iter):
        mid = (lo + hi) / 2
        f_mid = _npv(mid, cashflows)
        if abs(f_mid) < tol:
            return mid
        if f_mid * f_lo < 0:
            hi = mid
            f_hi = f_mid
        else:
            lo = mid
            f_lo = f_mid
    return (lo + hi) / 2


def evaluate(inp: PfiInput) -> PfiResult:
    """PFI/PPP 事業を評価する."""
    cashflows: list[float] = [-abs(inp.initial_investment), *inp.annual_cashflows]
    npv = _npv(inp.discount_rate, cashflows)
    irr = _irr(cashflows)

    payback: int | None = None
    cum = -abs(inp.initial_investment)
    for t, cf in enumerate(inp.annual_cashflows, start=1):
        cum += cf
        if cum >= 0:
            payback = t
            break

    vfm: float | None = None
    if inp.psc_cost is not None and inp.pfi_cost is not None and inp.psc_cost > 0:
        vfm = (inp.psc_cost - inp.pfi_cost) / inp.psc_cost

    is_viable = npv > 0 and (irr is None or irr > inp.discount_rate)

    return PfiResult(
        npv=round(npv, 2),
        irr=round(irr, 6) if irr is not None else None,
        vfm=round(vfm, 4) if vfm is not None else None,
        payback_period_years=payback,
        is_viable=is_viable,
    )


def monte_carlo(
    inp: PfiInput,
    *,
    iterations: int = 10_000,
    cf_sigma: float = 0.10,  # CF を ±10% 標準偏差で擾乱
    rate_sigma: float = 0.02,  # 割引率を ±2pt 標準偏差で擾乱
    seed: int = 42,
    bins: int = 20,
) -> MonteCarloResult:
    """NPV の確率分布をモンテカルロで推計 (固定seedで再現性確保)."""
    rng = random.Random(seed)
    npvs: list[float] = []
    base_cfs = [-abs(inp.initial_investment), *inp.annual_cashflows]

    for _ in range(iterations):
        # CF はガウス、割引率もガウス (rate は >-1 にクリップ)
        sampled = [base_cfs[0]] + [
            cf * (1.0 + rng.gauss(0.0, cf_sigma)) for cf in inp.annual_cashflows
        ]
        rate = inp.discount_rate + rng.gauss(0.0, rate_sigma)
        if rate <= -0.99:
            rate = -0.98
        npvs.append(_npv(rate, sampled))

    npvs_sorted = sorted(npvs)
    mean = statistics.fmean(npvs)
    median = statistics.median(npvs_sorted)
    std = statistics.pstdev(npvs)
    p5 = npvs_sorted[max(0, int(iterations * 0.05) - 1)]
    p95 = npvs_sorted[min(iterations - 1, int(iterations * 0.95))]
    prob_pos = sum(1 for v in npvs if v > 0) / iterations

    # ヒストグラム
    lo_h, hi_h = npvs_sorted[0], npvs_sorted[-1]
    histogram: list[dict] = []
    if hi_h > lo_h:
        width = (hi_h - lo_h) / bins
        counts = [0] * bins
        for v in npvs:
            idx = int((v - lo_h) / width)
            if idx >= bins:
                idx = bins - 1
            counts[idx] += 1
        for i, c in enumerate(counts):
            histogram.append(
                {
                    "bin_min": round(lo_h + width * i, 2),
                    "bin_max": round(lo_h + width * (i + 1), 2),
                    "count": c,
                }
            )
    else:
        histogram.append({"bin_min": round(lo_h, 2), "bin_max": round(hi_h, 2), "count": iterations})

    return MonteCarloResult(
        iterations=iterations,
        mean_npv=round(mean, 2),
        median_npv=round(median, 2),
        std_npv=round(std, 2),
        p5_npv=round(p5, 2),
        p95_npv=round(p95, 2),
        prob_positive_npv=round(prob_pos, 4),
        histogram=histogram,
    )


def sensitivity(
    inp: PfiInput,
    *,
    delta_pct: float = 0.10,  # ±10% で擾乱
    rate_delta_abs: float = 0.02,  # 割引率は ±2pt
) -> SensitivityResult:
    """主要変数の NPV 感度分析.

    変数: initial_investment / discount_rate / annual_cashflow_avg
    """
    base = evaluate(inp).npv

    def _npv_with(initial: float, cfs: list[float], rate: float) -> float:
        cf0 = [-abs(initial), *cfs]
        return _npv(rate, cf0)

    rows: list[SensitivityRow] = []

    # 初期投資
    npv_low = _npv_with(
        inp.initial_investment * (1 - delta_pct), inp.annual_cashflows, inp.discount_rate
    )
    npv_high = _npv_with(
        inp.initial_investment * (1 + delta_pct), inp.annual_cashflows, inp.discount_rate
    )
    rows.append(
        SensitivityRow(
            variable="initial_investment",
            delta_low=round(npv_low - base, 2),
            delta_high=round(npv_high - base, 2),
            impact=round(abs(npv_high - npv_low) / 2, 2),
        )
    )

    # 割引率 (絶対 ±)
    npv_low_r = _npv_with(
        inp.initial_investment, inp.annual_cashflows, inp.discount_rate - rate_delta_abs
    )
    npv_high_r = _npv_with(
        inp.initial_investment, inp.annual_cashflows, inp.discount_rate + rate_delta_abs
    )
    rows.append(
        SensitivityRow(
            variable="discount_rate",
            delta_low=round(npv_low_r - base, 2),
            delta_high=round(npv_high_r - base, 2),
            impact=round(abs(npv_high_r - npv_low_r) / 2, 2),
        )
    )

    # 年次CF (一律 ±delta_pct)
    cfs_low = [cf * (1 - delta_pct) for cf in inp.annual_cashflows]
    cfs_high = [cf * (1 + delta_pct) for cf in inp.annual_cashflows]
    npv_cf_low = _npv_with(inp.initial_investment, cfs_low, inp.discount_rate)
    npv_cf_high = _npv_with(inp.initial_investment, cfs_high, inp.discount_rate)
    rows.append(
        SensitivityRow(
            variable="annual_cashflow",
            delta_low=round(npv_cf_low - base, 2),
            delta_high=round(npv_cf_high - base, 2),
            impact=round(abs(npv_cf_high - npv_cf_low) / 2, 2),
        )
    )

    rows.sort(key=lambda r: r.impact, reverse=True)
    return SensitivityResult(base_npv=round(base, 2), rows=rows)


def to_decimal(value: float) -> Decimal:
    """Helper: float -> Decimal (財務レポート用)."""
    return Decimal(str(value))
