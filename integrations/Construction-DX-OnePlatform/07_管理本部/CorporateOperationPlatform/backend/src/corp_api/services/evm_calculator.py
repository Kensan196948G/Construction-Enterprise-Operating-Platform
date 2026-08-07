"""EVM (Earned Value Management) 指標計算.

PMBOK 標準:
  - PV (Planned Value): 計画した時点までに完了予定の作業の予算額
  - EV (Earned Value):  実際に完了した作業の予算額 = BAC * 進捗率
  - AC (Actual Cost):   実際に発生した費用

  - CV (Cost Variance)        = EV - AC   (>0 で予算内)
  - SV (Schedule Variance)    = EV - PV   (>0 で前倒し)
  - CPI (Cost Performance Idx) = EV / AC  (>=1 で予算内)
  - SPI (Schedule Performance) = EV / PV  (>=1 で前倒し)
  - EAC (Estimate at Complete) = BAC / CPI
  - ETC (Estimate to Complete) = EAC - AC
  - VAC (Variance at Complete) = BAC - EAC
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass
class EvmResult:
    pv: float
    ev: float
    ac: float
    bac: float
    cv: float
    sv: float
    cpi: float
    spi: float
    eac: float
    etc: float
    vac: float
    cost_status: str  # "under_budget" / "on_budget" / "over_budget"
    schedule_status: str  # "ahead" / "on_schedule" / "behind"

    def to_dict(self) -> dict[str, float | str]:
        return self.__dict__.copy()


def calculate_evm(
    pv: float,
    ev: float,
    ac: float,
    bac: float | None = None,
) -> EvmResult:
    """EVM 指標を一括計算."""
    if bac is None:
        # BAC 未指定なら PV の上限と同等とみなす
        bac = pv
    cv = ev - ac
    sv = ev - pv
    cpi = (ev / ac) if ac else 0.0
    spi = (ev / pv) if pv else 0.0
    eac = (bac / cpi) if cpi else float("inf")
    etc = eac - ac
    vac = bac - eac

    def _cost_status(cpi_: float) -> str:
        if cpi_ > 1.0:
            return "under_budget"
        if abs(cpi_ - 1.0) < 1e-9:
            return "on_budget"
        return "over_budget"

    def _schedule_status(spi_: float) -> str:
        if spi_ > 1.0:
            return "ahead"
        if abs(spi_ - 1.0) < 1e-9:
            return "on_schedule"
        return "behind"

    return EvmResult(
        pv=pv,
        ev=ev,
        ac=ac,
        bac=bac,
        cv=cv,
        sv=sv,
        cpi=cpi,
        spi=spi,
        eac=eac,
        etc=etc,
        vac=vac,
        cost_status=_cost_status(cpi),
        schedule_status=_schedule_status(spi),
    )
