"""仕訳 CRUD + 試算表 + B/S・P/L + 月次決算 + PDF."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field

from ..services.accounting_engine import (
    JournalBalanceError,
    build_financial_statements,
    build_trial_balance,
    validate_entries_balance,
)
from ..services.financial_pdf import FinancialPdfError, render_financial_statements_pdf
from ..services.journal_rule_engine import (
    JournalRuleError,
    build_default_engine,
)
from ..services.monthly_close import run_monthly_close
from ._auth import get_current_user
from ._store import MemoryStore

router = APIRouter()
journal_store = MemoryStore(id_key="entry_id")
account_store = MemoryStore(id_key="account_id")


# --- 勘定科目 ---
class AccountIn(BaseModel):
    code: str
    name: str
    category: str = Field(pattern="^(asset|liability|equity|revenue|expense)$")
    parent_code: str | None = None
    level: int = 1


@router.get("/accounts")
def list_accounts(_=Depends(get_current_user)) -> list[dict[str, Any]]:
    return account_store.list()


@router.post("/accounts", status_code=201)
def create_account(payload: AccountIn, _=Depends(get_current_user)) -> dict[str, Any]:
    return account_store.create(payload.model_dump())


# --- 仕訳 ---
class JournalEntryIn(BaseModel):
    txn_date: str
    debit_account_code: str
    credit_account_code: str
    amount: float
    description: str | None = None
    project_id: str | None = None
    voucher_no: str | None = None


@router.get("/journal-entries")
def list_entries(_=Depends(get_current_user)) -> list[dict[str, Any]]:
    return journal_store.list()


@router.post("/journal-entries", status_code=201)
def create_entry(payload: JournalEntryIn, _=Depends(get_current_user)) -> dict[str, Any]:
    data = payload.model_dump()
    # 借貸バランス検証 (この単一エントリ + 既存 voucher 同一行を合算)
    same_voucher = (
        [e for e in journal_store.list() if e.get("voucher_no") == data.get("voucher_no")]
        if data.get("voucher_no")
        else []
    )
    try:
        validate_entries_balance(same_voucher + [data])
    except JournalBalanceError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return journal_store.create(data)


@router.get("/trial-balance")
def trial_balance(_=Depends(get_current_user)) -> dict[str, Any]:
    rows = build_trial_balance(journal_store.list(), account_store.list())
    return {
        "rows": [
            {
                "account_code": r.account_code,
                "account_name": r.account_name,
                "category": r.category,
                "debit_total": float(r.debit_total),
                "credit_total": float(r.credit_total),
                "balance": float(r.balance),
            }
            for r in rows
        ],
        "total_debit": float(sum(r.debit_total for r in rows)),
        "total_credit": float(sum(r.credit_total for r in rows)),
    }


@router.get("/financial-statements")
def financial_statements(_=Depends(get_current_user)) -> dict[str, Any]:
    fs = build_financial_statements(journal_store.list(), account_store.list())
    return fs.to_dict()


# --- 自動仕訳ルールエンジン ---
_rule_engine = build_default_engine()


class RuleEventIn(BaseModel):
    """ルールエンジンに投入する取引イベント payload."""

    event_type: str
    txn_date: str
    amount: float
    voucher_no: str | None = None
    project_id: str | None = None
    description: str | None = None
    # event_type 固有の任意項目
    tax_category: str | None = None
    invoice_number: str | None = None
    issuer_name: str | None = None
    period: str | None = None
    persist: bool = False


@router.get("/journal-rules")
def list_journal_rules(_=Depends(get_current_user)) -> list[dict[str, Any]]:
    return [
        {
            "rule_id": r.rule_id,
            "name": r.name,
            "event_type": r.event_type,
            "match": r.match,
            "debit_account_code": r.debit_account_code,
            "credit_account_code": r.credit_account_code,
        }
        for r in _rule_engine.rules
    ]


@router.post("/journal-rules/apply")
def apply_journal_rule(
    payload: RuleEventIn, _=Depends(get_current_user)
) -> dict[str, Any]:
    """イベント -> 自動仕訳生成. persist=True なら journal_store にも保存."""
    try:
        entry = _rule_engine.apply(payload.model_dump())
    except JournalRuleError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if payload.persist:
        # 借貸バランス検証 (同一 voucher の既存行と合算)
        same_voucher = (
            [e for e in journal_store.list() if e.get("voucher_no") == entry.get("voucher_no")]
            if entry.get("voucher_no")
            else []
        )
        try:
            validate_entries_balance(same_voucher + [entry])
        except JournalBalanceError as e:
            raise HTTPException(status_code=400, detail=str(e))
        return journal_store.create(entry)
    return {"preview": entry}


# --- 月次決算 ---
@router.post("/monthly-close")
def monthly_close(
    year: int,
    month: int,
    opening_cash: float = 0,
    _=Depends(get_current_user),
) -> dict[str, Any]:
    if not (1 <= month <= 12):
        raise HTTPException(status_code=400, detail="month must be 1..12")
    result = run_monthly_close(
        journal_store.list(),
        account_store.list(),
        year=year,
        month=month,
        opening_cash=opening_cash,
    )
    return result.to_dict()


# --- 財務諸表 PDF ---
@router.get("/statements/pdf")
def statements_pdf(
    year: int | None = None,
    compare: bool = False,
    _=Depends(get_current_user),
) -> Response:
    entries = journal_store.list()
    accounts = account_store.list()
    current_fs = build_financial_statements(entries, accounts).to_dict()
    previous_fs = None
    if compare and year is not None:
        prev_entries = [e for e in entries if (e.get("txn_date") or "")[:4] == str(year - 1)]
        previous_fs = build_financial_statements(prev_entries, accounts).to_dict()
    try:
        pdf_bytes = render_financial_statements_pdf(
            current_fs, previous=previous_fs, year=year
        )
    except FinancialPdfError as e:
        raise HTTPException(status_code=500, detail=str(e))
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"inline; filename=statements_{year or 'all'}.pdf"
        },
    )
