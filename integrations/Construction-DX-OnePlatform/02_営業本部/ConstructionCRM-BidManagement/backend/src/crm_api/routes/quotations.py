"""見積 CRUD + PDF 生成 stub + バージョン管理."""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Annotated

from io import BytesIO

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, ConfigDict
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import get_settings
from ..db.session import get_db_session
from ..models import Client, Quotation, QuotationItem
from ..services.quotation_pdf import QuotationPdfInput, render_quotation_pdf

router = APIRouter(prefix="/quotations", tags=["quotations"])


class QuotationItemIn(BaseModel):
    item_name: str
    unit: str | None = None
    quantity: Decimal = Decimal("1")
    unit_price: Decimal = Decimal("0")
    amount: Decimal = Decimal("0")
    remarks: str | None = None


class QuotationIn(BaseModel):
    quotation_number: str
    client_id: int
    opportunity_id: int | None = None
    title: str
    work_description: str | None = None
    subtotal_amount: Decimal = Decimal("0")
    tax_amount: Decimal = Decimal("0")
    total_amount: Decimal = Decimal("0")
    issue_date: date | None = None
    valid_until: date | None = None
    status: str = "draft"
    remarks: str | None = None
    items: list[QuotationItemIn] = []


class QuotationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    quotation_number: str
    version: int
    client_id: int
    opportunity_id: int | None
    title: str
    subtotal_amount: Decimal
    tax_amount: Decimal
    total_amount: Decimal
    issue_date: date | None
    valid_until: date | None
    status: str
    pdf_path: str | None
    pdf_sha256: str | None


class PdfOut(BaseModel):
    file_path: str
    sha256: str
    size_bytes: int


@router.get("", response_model=list[QuotationOut])
async def list_quotations(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[QuotationOut]:
    result = await session.execute(select(Quotation).order_by(desc(Quotation.id)))
    return [QuotationOut.model_validate(q) for q in result.scalars().all()]


@router.post("", response_model=QuotationOut, status_code=status.HTTP_201_CREATED)
async def create_quotation(
    body: QuotationIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> QuotationOut:
    """新規見積を作成 (バージョン: 既存番号があれば +1, 無ければ 1)."""
    existing = await session.execute(
        select(Quotation)
        .where(Quotation.quotation_number == body.quotation_number)
        .order_by(desc(Quotation.version))
        .limit(1)
    )
    last = existing.scalar_one_or_none()
    new_version = (last.version + 1) if last else 1
    if last and last.status == "locked":
        # 電帳法対応: locked 後も新バージョン作成は許容 (旧版は不変)
        pass

    quotation = Quotation(
        quotation_number=body.quotation_number,
        version=new_version,
        client_id=body.client_id,
        opportunity_id=body.opportunity_id,
        title=body.title,
        work_description=body.work_description,
        subtotal_amount=body.subtotal_amount,
        tax_amount=body.tax_amount,
        total_amount=body.total_amount,
        issue_date=body.issue_date,
        valid_until=body.valid_until,
        status=body.status,
        remarks=body.remarks,
    )
    session.add(quotation)
    await session.flush()
    for i, item in enumerate(body.items, start=1):
        session.add(
            QuotationItem(
                quotation_id=quotation.id,
                line_no=i,
                **item.model_dump(exclude_none=True),
            )
        )
    await session.flush()
    return QuotationOut.model_validate(quotation)


@router.get("/{quotation_id}", response_model=QuotationOut)
async def get_quotation(
    quotation_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> QuotationOut:
    q = await session.get(Quotation, quotation_id)
    if q is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "quotation not found")
    return QuotationOut.model_validate(q)


@router.post("/{quotation_id}/pdf", response_model=PdfOut)
async def generate_pdf(
    quotation_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> PdfOut:
    """見積 PDF 生成 (電帳法対応: ファイルパス + sha256 を保存)."""
    settings = get_settings()
    q = await session.get(Quotation, quotation_id)
    if q is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "quotation not found")
    client = await session.get(Client, q.client_id)
    items_rs = await session.execute(
        select(QuotationItem).where(QuotationItem.quotation_id == q.id).order_by(QuotationItem.line_no)
    )
    items = [
        (i.item_name, i.quantity, i.unit_price, i.amount) for i in items_rs.scalars().all()
    ]
    result = render_quotation_pdf(
        QuotationPdfInput(
            quotation_number=q.quotation_number,
            version=q.version,
            title=q.title,
            client_name=client.client_name if client else "",
            total_amount=q.total_amount,
            items=items,
            subtotal_amount=q.subtotal_amount,
            tax_amount=q.tax_amount,
            issue_date=q.issue_date,
            valid_until=q.valid_until,
        ),
        output_dir=settings.quotation_pdf_path,
    )
    q.pdf_path = result.file_path
    q.pdf_sha256 = result.sha256
    await session.flush()
    return PdfOut(
        file_path=result.file_path, sha256=result.sha256, size_bytes=result.size_bytes
    )


@router.get("/{quotation_id}/pdf")
async def stream_pdf(
    quotation_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> StreamingResponse:
    """見積 PDF を生成して StreamingResponse で返却する."""
    settings = get_settings()
    q = await session.get(Quotation, quotation_id)
    if q is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "quotation not found")
    client = await session.get(Client, q.client_id)
    items_rs = await session.execute(
        select(QuotationItem)
        .where(QuotationItem.quotation_id == q.id)
        .order_by(QuotationItem.line_no)
    )
    items = [
        (i.item_name, i.quantity, i.unit_price, i.amount)
        for i in items_rs.scalars().all()
    ]
    result = render_quotation_pdf(
        QuotationPdfInput(
            quotation_number=q.quotation_number,
            version=q.version,
            title=q.title,
            client_name=client.client_name if client else "",
            total_amount=q.total_amount,
            items=items,
            subtotal_amount=q.subtotal_amount,
            tax_amount=q.tax_amount,
            issue_date=q.issue_date,
            valid_until=q.valid_until,
        ),
        output_dir=settings.quotation_pdf_path,
    )
    q.pdf_path = result.file_path
    q.pdf_sha256 = result.sha256
    await session.flush()

    from pathlib import Path as _P

    blob = _P(result.file_path).read_bytes()
    headers = {
        "Content-Disposition": (
            f'attachment; filename="{q.quotation_number}_v{q.version}.pdf"'
        ),
        "X-Quotation-SHA256": result.sha256,
    }
    return StreamingResponse(BytesIO(blob), media_type="application/pdf", headers=headers)
