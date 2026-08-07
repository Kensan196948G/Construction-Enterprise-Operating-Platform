"""購買依頼 + 承認ワークフロー."""

from __future__ import annotations

from datetime import date
from typing import Annotated, Any

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..db.session import get_db_session
from ..models import PurchaseRequest
from ..services import ApprovalDecision, determine_workflow, next_approval_state

router = APIRouter(prefix="/requests", tags=["requests"])

_vendor_quotes: dict[int, list] = {}
_MIN_VENDOR_QUOTE_AMOUNT = 1_000_000  # 3社見積必須金額閾値 (JPY)


class VendorQuoteIn(BaseModel):
    vendor_name: str
    quoted_amount: float
    quote_date: date | None = None
    validity_days: int | None = None
    note: str | None = None


class RequestIn(BaseModel):
    request_no: str = Field(..., max_length=20)
    project_code: str | None = None
    requester_name: str | None = None
    items: list[dict[str, Any]] = Field(default_factory=list)
    estimated_total: float = 0
    desired_delivery_date: date | None = None
    note: str | None = None


class RequestOut(RequestIn):
    id: int
    status: str
    current_approval_step: int
    total_approval_steps: int


class ApprovalIn(BaseModel):
    decision: str = Field(..., description="approve | reject")
    comment: str | None = None


@router.get("", response_model=list[RequestOut])
async def list_requests(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[RequestOut]:
    rows = (await session.execute(select(PurchaseRequest))).scalars().all()
    return [RequestOut.model_validate(r, from_attributes=True) for r in rows]


@router.post("", response_model=RequestOut, status_code=status.HTTP_201_CREATED)
async def submit_request(
    body: RequestIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> RequestOut:
    s = get_settings()
    wf = determine_workflow(
        body.estimated_total,
        threshold_small=s.approval_threshold_small,
        threshold_medium=s.approval_threshold_medium,
    )
    pr = PurchaseRequest(
        **body.model_dump(exclude_none=True),
        status="submitted",
        current_approval_step=0,
        total_approval_steps=wf.total_steps,
        approval_history=[],
    )
    session.add(pr)
    await session.flush()
    return RequestOut.model_validate(pr, from_attributes=True)


@router.post("/{request_id}/quotes", status_code=status.HTTP_201_CREATED)
async def add_vendor_quote(
    request_id: int,
    body: VendorQuoteIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict:
    """J-SOX 業務統制: 3社見積 — 見積書を登録する."""
    pr = await session.get(PurchaseRequest, request_id)
    if pr is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "request not found")
    quotes = _vendor_quotes.setdefault(request_id, [])
    quotes.append(
        {
            "vendor_name": body.vendor_name,
            "quoted_amount": body.quoted_amount,
            "quote_date": body.quote_date.isoformat()
            if body.quote_date
            else date.today().isoformat(),
            "validity_days": body.validity_days,
            "note": body.note,
            "submitted_by": user.email if hasattr(user, "email") else None,
        }
    )
    return {"request_id": request_id, "quote_count": len(quotes), "quotes": quotes}


@router.post("/{request_id}/approve")
async def approve_request(
    request_id: int,
    body: ApprovalIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict:
    pr = await session.get(PurchaseRequest, request_id)
    if pr is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "request not found")
    # J-SOX 業務統制: 3社見積必須 — 金額閾値以上の発注は承認前に見積3件以上が必要
    if pr.estimated_total >= _MIN_VENDOR_QUOTE_AMOUNT:
        quote_count = len(_vendor_quotes.get(request_id, []))
        if quote_count < 3:
            raise HTTPException(
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                f"3社見積未達: 現在 {quote_count}/3 件 — /{request_id}/quotes で見積を追加してください",
            )
    try:
        decision = ApprovalDecision(body.decision)
    except ValueError as exc:  # pragma: no cover
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc))
    result = next_approval_state(pr.current_approval_step, pr.total_approval_steps, decision)
    pr.status = result["status"]
    pr.current_approval_step = result["current_step"]
    history = list(pr.approval_history or [])
    history.append(
        {
            "step": result["current_step"],
            "decision": decision.value,
            "approver": user.email if hasattr(user, "email") else None,
            "comment": body.comment,
        }
    )
    pr.approval_history = history
    await session.flush()
    return {
        "request_id": request_id,
        "status": pr.status,
        "current_step": pr.current_approval_step,
        "total_steps": pr.total_approval_steps,
    }
