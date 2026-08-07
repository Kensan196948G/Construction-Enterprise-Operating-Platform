"""PFI / PPP 事業性評価 API."""

from __future__ import annotations

from typing import Annotated

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from ..services.pfi_evaluator import (
    PfiInput,
    evaluate,
    monte_carlo,
    sensitivity,
)

router = APIRouter(prefix="/pfi", tags=["pfi"])


class PfiEvalIn(BaseModel):
    initial_investment: float = Field(..., ge=0)
    annual_cashflows: list[float]
    discount_rate: float = Field(..., gt=-1.0, lt=1.0)
    psc_cost: float | None = None
    pfi_cost: float | None = None


class PfiEvalOut(BaseModel):
    npv: float
    irr: float | None
    vfm: float | None
    payback_period_years: int | None
    is_viable: bool


class MonteCarloIn(PfiEvalIn):
    iterations: int = Field(default=10_000, ge=100, le=100_000)
    cf_sigma: float = Field(default=0.10, ge=0.0, le=1.0)
    rate_sigma: float = Field(default=0.02, ge=0.0, le=0.5)
    seed: int = 42
    bins: int = Field(default=20, ge=5, le=100)


class HistogramBin(BaseModel):
    bin_min: float
    bin_max: float
    count: int


class MonteCarloOut(BaseModel):
    iterations: int
    mean_npv: float
    median_npv: float
    std_npv: float
    p5_npv: float
    p95_npv: float
    prob_positive_npv: float
    histogram: list[HistogramBin]


class SensitivityIn(PfiEvalIn):
    delta_pct: float = Field(default=0.10, gt=0.0, le=0.5)
    rate_delta_abs: float = Field(default=0.02, gt=0.0, le=0.2)


class SensitivityRowOut(BaseModel):
    variable: str
    delta_low: float
    delta_high: float
    impact: float


class SensitivityOut(BaseModel):
    base_npv: float
    rows: list[SensitivityRowOut]


def _to_input(body: PfiEvalIn) -> PfiInput:
    return PfiInput(
        initial_investment=body.initial_investment,
        annual_cashflows=body.annual_cashflows,
        discount_rate=body.discount_rate,
        psc_cost=body.psc_cost,
        pfi_cost=body.pfi_cost,
    )


@router.post("/evaluate", response_model=PfiEvalOut)
async def evaluate_pfi(
    body: PfiEvalIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> PfiEvalOut:
    res = evaluate(_to_input(body))
    return PfiEvalOut(
        npv=res.npv,
        irr=res.irr,
        vfm=res.vfm,
        payback_period_years=res.payback_period_years,
        is_viable=res.is_viable,
    )


@router.post("/monte-carlo", response_model=MonteCarloOut)
async def monte_carlo_pfi(
    body: MonteCarloIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> MonteCarloOut:
    res = monte_carlo(
        _to_input(body),
        iterations=body.iterations,
        cf_sigma=body.cf_sigma,
        rate_sigma=body.rate_sigma,
        seed=body.seed,
        bins=body.bins,
    )
    return MonteCarloOut(
        iterations=res.iterations,
        mean_npv=res.mean_npv,
        median_npv=res.median_npv,
        std_npv=res.std_npv,
        p5_npv=res.p5_npv,
        p95_npv=res.p95_npv,
        prob_positive_npv=res.prob_positive_npv,
        histogram=[HistogramBin(**h) for h in res.histogram],
    )


@router.post("/sensitivity", response_model=SensitivityOut)
async def sensitivity_pfi(
    body: SensitivityIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
) -> SensitivityOut:
    res = sensitivity(
        _to_input(body),
        delta_pct=body.delta_pct,
        rate_delta_abs=body.rate_delta_abs,
    )
    return SensitivityOut(
        base_npv=res.base_npv,
        rows=[SensitivityRowOut(**row.__dict__) for row in res.rows],
    )
