"""会計エンジン: 借貸バランス検証 + 試算表 + B/S・P/L 生成.

仕訳 (`JournalEntry`) は 1 行 1 借方 / 1 貸方 / 1 金額 の単純形式。
複数行仕訳の場合は同一 voucher_no で複数 row を持つ運用とする。
"""
from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass, field
from decimal import Decimal
from typing import Literal

Category = Literal["asset", "liability", "equity", "revenue", "expense"]


class JournalBalanceError(ValueError):
    """借貸バランス不一致."""


@dataclass
class TrialBalanceRow:
    account_code: str
    account_name: str
    category: Category
    debit_total: Decimal = Decimal("0")
    credit_total: Decimal = Decimal("0")

    @property
    def balance(self) -> Decimal:
        """残高 (借方-貸方 を正規化).

        asset / expense は借方残, liability / equity / revenue は貸方残として返す。
        """
        if self.category in ("asset", "expense"):
            return self.debit_total - self.credit_total
        return self.credit_total - self.debit_total


@dataclass
class FinancialStatements:
    """B/S・P/L."""

    balance_sheet: dict[str, list[TrialBalanceRow]] = field(default_factory=dict)
    profit_loss: dict[str, list[TrialBalanceRow]] = field(default_factory=dict)
    total_assets: Decimal = Decimal("0")
    total_liabilities_equity: Decimal = Decimal("0")
    total_revenue: Decimal = Decimal("0")
    total_expense: Decimal = Decimal("0")
    net_income: Decimal = Decimal("0")
    bs_balanced: bool = False

    def to_dict(self) -> dict:
        def serialize(rows: list[TrialBalanceRow]) -> list[dict]:
            return [
                {
                    "account_code": r.account_code,
                    "account_name": r.account_name,
                    "category": r.category,
                    "balance": float(r.balance),
                }
                for r in rows
            ]

        return {
            "balance_sheet": {k: serialize(v) for k, v in self.balance_sheet.items()},
            "profit_loss": {k: serialize(v) for k, v in self.profit_loss.items()},
            "total_assets": float(self.total_assets),
            "total_liabilities_equity": float(self.total_liabilities_equity),
            "total_revenue": float(self.total_revenue),
            "total_expense": float(self.total_expense),
            "net_income": float(self.net_income),
            "bs_balanced": self.bs_balanced,
        }


def validate_entries_balance(entries: Iterable[dict]) -> None:
    """単一仕訳 (1 行借方 / 1 行貸方) は内部で常にバランスする想定だが、
    voucher_no が同じ複数行の借方合計 = 貸方合計を強制する。
    """
    by_voucher: dict[str, dict[str, Decimal]] = {}
    for e in entries:
        voucher = e.get("voucher_no") or e.get("entry_id") or "_"
        slot = by_voucher.setdefault(voucher, {"debit": Decimal("0"), "credit": Decimal("0")})
        amt = Decimal(str(e.get("amount", 0)))
        # 1 行に借方/貸方両方の科目があるモデルなので、両方計上する
        if e.get("debit_account_code"):
            slot["debit"] += amt
        if e.get("credit_account_code"):
            slot["credit"] += amt

    for voucher, totals in by_voucher.items():
        if totals["debit"] != totals["credit"]:
            raise JournalBalanceError(
                f"voucher={voucher} の借貸不一致 debit={totals['debit']} credit={totals['credit']}"
            )


def build_trial_balance(
    entries: Iterable[dict],
    accounts: Iterable[dict],
) -> list[TrialBalanceRow]:
    """試算表を構築する。"""
    acct_map = {a["code"]: a for a in accounts}
    rows: dict[str, TrialBalanceRow] = {}

    def _ensure(code: str) -> TrialBalanceRow:
        if code not in rows:
            meta = acct_map.get(code, {"name": code, "category": "asset"})
            rows[code] = TrialBalanceRow(
                account_code=code,
                account_name=meta.get("name", code),
                category=meta.get("category", "asset"),  # type: ignore[arg-type]
            )
        return rows[code]

    for e in entries:
        amt = Decimal(str(e.get("amount", 0)))
        if e.get("debit_account_code"):
            _ensure(e["debit_account_code"]).debit_total += amt
        if e.get("credit_account_code"):
            _ensure(e["credit_account_code"]).credit_total += amt

    return sorted(rows.values(), key=lambda r: r.account_code)


def build_financial_statements(
    entries: Iterable[dict],
    accounts: Iterable[dict],
) -> FinancialStatements:
    """試算表から B/S・P/L を生成する。"""
    tb = build_trial_balance(entries, accounts)
    bs: dict[str, list[TrialBalanceRow]] = {"asset": [], "liability": [], "equity": []}
    pl: dict[str, list[TrialBalanceRow]] = {"revenue": [], "expense": []}

    total_asset = Decimal("0")
    total_le = Decimal("0")
    total_rev = Decimal("0")
    total_exp = Decimal("0")

    for r in tb:
        if r.category in bs:
            bs[r.category].append(r)
            if r.category == "asset":
                total_asset += r.balance
            else:
                total_le += r.balance
        elif r.category in pl:
            pl[r.category].append(r)
            if r.category == "revenue":
                total_rev += r.balance
            else:
                total_exp += r.balance

    net = total_rev - total_exp
    # 当期純利益を純資産側に加算した上でバランスを確認
    bs_total_le_with_ni = total_le + net
    return FinancialStatements(
        balance_sheet=bs,
        profit_loss=pl,
        total_assets=total_asset,
        total_liabilities_equity=bs_total_le_with_ni,
        total_revenue=total_rev,
        total_expense=total_exp,
        net_income=net,
        bs_balanced=(total_asset == bs_total_le_with_ni),
    )
