"""買掛金 + 支払予定."""

from __future__ import annotations

from datetime import date
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from ._auth import get_current_user
from ._store import MemoryStore

router = APIRouter()
_store = MemoryStore(id_key="payable_id")


class PayableIn(BaseModel):
    invoice_id: str | None = None
    counterparty_name: str
    amount: float
    scheduled_date: str
    payment_method: str = "bank_transfer"
    status: str = "pending"
    note: str | None = None
    submitted_by: str | None = None


class ExpenseApprovalIn(BaseModel):
    decision: str  # "approve" | "reject"
    comment: str | None = None


@router.get("")
def list_payables(_=Depends(get_current_user)) -> list[dict[str, Any]]:
    return _store.list()


@router.post("", status_code=201)
def create(payload: PayableIn, _=Depends(get_current_user)) -> dict[str, Any]:
    return _store.create(payload.model_dump())


@router.post("/{payable_id}/approve", status_code=200)
def approve_payable(
    payable_id: str,
    body: ExpenseApprovalIn,
    user: Any = Depends(get_current_user),
) -> dict[str, Any]:
    """J-SOX 業務統制: 経費申請 SoD — 申請者 ≠ 承認者."""
    item = _store.get(payable_id)
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "payable not found")
    if body.decision not in ("approve", "reject"):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "decision は 'approve' または 'reject' を指定してください",
        )
    approver_id = (
        user.get("sub") if isinstance(user, dict) else getattr(user, "sub", "unknown")
    )
    submitted_by = item.get("submitted_by")
    if submitted_by and approver_id == submitted_by:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            "申請者と承認者が同一です — 職務分離 (SoD) 違反",
        )
    new_status = "approved" if body.decision == "approve" else "rejected"
    updated = _store.update(
        payable_id,
        {
            "status": new_status,
            "approver": approver_id,
            "approval_comment": body.comment,
        },
    )
    return updated


@router.get("/schedule")
def schedule(_=Depends(get_current_user)) -> dict[str, Any]:
    """支払予定 (scheduled_date 順)."""
    today = date.today().isoformat()
    items = _store.list()
    upcoming = sorted(
        [i for i in items if i.get("status") in ("pending", "approved")],
        key=lambda x: x.get("scheduled_date", ""),
    )
    overdue = [i for i in upcoming if i.get("scheduled_date", "") < today]
    return {
        "upcoming": upcoming,
        "overdue": overdue,
        "total_amount": sum(float(i["amount"]) for i in upcoming),
    }
