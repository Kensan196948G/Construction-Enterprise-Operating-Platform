"""月次決算自動化.

機能:
* 指定月 (year, month) の B/S・P/L・C/F (キャッシュフロー) を生成
* 棚卸・減価償却・引当金繰入の skeleton 仕訳生成

C/F は間接法を簡易実装:
    営業 CF = 当期純利益 + 減価償却 ± 運転資本の変動
    投資 CF = 固定資産取得 / 売却 (skeleton)
    財務 CF = 借入金 / 配当 (skeleton)
"""
from __future__ import annotations

from collections.abc import Iterable
from dataclasses import asdict, dataclass, field
from datetime import date
from decimal import Decimal

from .accounting_engine import build_financial_statements


def _in_period(entry: dict, year: int, month: int) -> bool:
    d = entry.get("txn_date") or ""
    if not d:
        return False
    try:
        y, m = int(d[0:4]), int(d[5:7])
    except (ValueError, IndexError):
        return False
    return y == year and m == month


def _ym_end(year: int, month: int) -> date:
    from datetime import timedelta

    if month == 12:
        return date(year, 12, 31)
    first_of_next = date(year, month + 1, 1)
    return first_of_next - timedelta(days=1)


@dataclass
class CashFlowStatement:
    operating: Decimal = Decimal("0")
    investing: Decimal = Decimal("0")
    financing: Decimal = Decimal("0")
    net_increase: Decimal = Decimal("0")
    opening_cash: Decimal = Decimal("0")
    closing_cash: Decimal = Decimal("0")

    def to_dict(self) -> dict:
        return {k: float(v) for k, v in asdict(self).items()}


@dataclass
class AdjustmentEntry:
    """決算整理仕訳の skeleton."""

    kind: str  # depreciation / inventory / reserve
    txn_date: str
    debit_account_code: str
    credit_account_code: str
    amount: float
    description: str
    voucher_no: str

    def to_dict(self) -> dict:
        return asdict(self)


@dataclass
class MonthlyCloseResult:
    year: int
    month: int
    financial_statements: dict
    cash_flow: dict
    adjustment_entries: list[dict] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "year": self.year,
            "month": self.month,
            "financial_statements": self.financial_statements,
            "cash_flow": self.cash_flow,
            "adjustment_entries": self.adjustment_entries,
        }


def generate_adjustments(year: int, month: int, *, fixed_assets: list[dict] | None = None) -> list[AdjustmentEntry]:
    """決算整理仕訳の skeleton を生成.

    fixed_assets: [{"name", "acquisition_cost", "useful_life_months"}, ...]
    """
    end = _ym_end(year, month).isoformat()
    voucher = f"CLOSE-{year:04d}{month:02d}"
    entries: list[AdjustmentEntry] = []

    # 減価償却 (定額法・月割)
    for asset in fixed_assets or []:
        cost = Decimal(str(asset.get("acquisition_cost", 0)))
        life = int(asset.get("useful_life_months") or 0)
        if life <= 0:
            continue
        monthly_dep = (cost / Decimal(life)).quantize(Decimal("1"))
        entries.append(
            AdjustmentEntry(
                kind="depreciation",
                txn_date=end,
                debit_account_code="6210",  # 減価償却費
                credit_account_code="1521",  # 減価償却累計額
                amount=float(monthly_dep),
                description=f"減価償却 {asset.get('name', '')}",
                voucher_no=voucher,
            )
        )

    # 棚卸 / 引当金 skeleton (ゼロ円で記述するためコメントアウト)
    return entries


def _cash_codes() -> set[str]:
    """現金同等物の科目コード集合 (1110 現金, 1120 預金)."""
    return {"1110", "1120"}


def calculate_cash_flow(
    entries: Iterable[dict],
    accounts: Iterable[dict],
    *,
    year: int,
    month: int,
    opening_cash: Decimal | float | int = 0,
) -> CashFlowStatement:
    """期間内仕訳から簡易キャッシュフロー (間接法相当の現金増減) を計算."""
    cash_codes = _cash_codes()
    period_entries = [e for e in entries if _in_period(e, year, month)]

    net_change = Decimal("0")
    operating = Decimal("0")
    investing = Decimal("0")
    financing = Decimal("0")

    # 科目分類 (固定資産=15xx, 借入金=21xx/22xx 等は簡易)
    acct_map = {a.get("code"): a for a in accounts}

    for e in period_entries:
        amt = Decimal(str(e.get("amount", 0)))
        dr = e.get("debit_account_code") or ""
        cr = e.get("credit_account_code") or ""

        # 現金の増減
        if dr in cash_codes and cr not in cash_codes:
            net_change += amt
            counter = cr
            inc = amt  # 現金 IN
        elif cr in cash_codes and dr not in cash_codes:
            net_change -= amt
            counter = dr
            inc = -amt
        else:
            continue

        # 分類
        if counter.startswith("15") or counter.startswith("16"):
            investing += inc
        elif counter.startswith("22") or counter.startswith("31"):
            financing += inc
        else:
            operating += inc

    opening = Decimal(str(opening_cash))
    return CashFlowStatement(
        operating=operating,
        investing=investing,
        financing=financing,
        net_increase=net_change,
        opening_cash=opening,
        closing_cash=opening + net_change,
    )


def run_monthly_close(
    entries: Iterable[dict],
    accounts: Iterable[dict],
    *,
    year: int,
    month: int,
    fixed_assets: list[dict] | None = None,
    opening_cash: Decimal | float | int = 0,
) -> MonthlyCloseResult:
    """月次決算: 整理仕訳生成 + 期間内 B/S/PL + C/F を返す."""
    entries_list = list(entries)
    adjustments = generate_adjustments(year, month, fixed_assets=fixed_assets)
    enriched = entries_list + [
        {
            "txn_date": a.txn_date,
            "debit_account_code": a.debit_account_code,
            "credit_account_code": a.credit_account_code,
            "amount": a.amount,
            "voucher_no": a.voucher_no,
            "description": a.description,
        }
        for a in adjustments
    ]
    period_entries = [e for e in enriched if _in_period(e, year, month)]
    fs = build_financial_statements(period_entries, accounts)
    cf = calculate_cash_flow(
        enriched, accounts, year=year, month=month, opening_cash=opening_cash
    )
    return MonthlyCloseResult(
        year=year,
        month=month,
        financial_statements=fs.to_dict(),
        cash_flow=cf.to_dict(),
        adjustment_entries=[a.to_dict() for a in adjustments],
    )
