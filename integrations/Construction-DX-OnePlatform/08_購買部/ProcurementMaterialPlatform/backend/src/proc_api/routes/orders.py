"""発注 + 注文書PDF生成 (stub)."""
from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Annotated

from cdx_auth.dependencies import get_current_user
from cdx_auth.models import AuthenticatedUser
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from fastapi.responses import Response

from ..db.session import get_db_session
from ..models import PurchaseOrder, PurchaseOrderItem, Supplier
from ..services import PoLine, PurchaseOrderPdfData, generate_purchase_order_pdf

router = APIRouter(prefix="/orders", tags=["orders"])


class OrderItemIn(BaseModel):
    material_code: str | None = None
    material_name: str
    quantity: float
    unit: str = "個"
    unit_price: float


class OrderIn(BaseModel):
    po_number: str = Field(..., max_length=20)
    supplier_id: int
    project_code: str | None = None
    delivery_date: date | None = None
    items: list[OrderItemIn]
    tax_rate: float = 0.1


class OrderOut(BaseModel):
    id: int
    po_number: str
    supplier_id: int
    project_code: str | None
    status: str
    total_amount: float
    tax_amount: float
    delivery_date: date | None


@router.get("", response_model=list[OrderOut])
async def list_orders(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> list[OrderOut]:
    rows = (await session.execute(select(PurchaseOrder))).scalars().all()
    return [
        OrderOut(
            id=r.id,
            po_number=r.po_number,
            supplier_id=r.supplier_id,
            project_code=r.project_code,
            status=r.status,
            total_amount=float(r.total_amount or 0),
            tax_amount=float(r.tax_amount or 0),
            delivery_date=r.delivery_date,
        )
        for r in rows
    ]


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
async def create_order(
    body: OrderIn,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> OrderOut:
    subtotal = sum(Decimal(str(i.quantity)) * Decimal(str(i.unit_price)) for i in body.items)
    tax = (subtotal * Decimal(str(body.tax_rate))).quantize(Decimal("0.01"))
    total = subtotal + tax
    po = PurchaseOrder(
        po_number=body.po_number,
        supplier_id=body.supplier_id,
        project_code=body.project_code,
        delivery_date=body.delivery_date,
        total_amount=total,
        tax_amount=tax,
        status="draft",
    )
    session.add(po)
    await session.flush()
    for idx, it in enumerate(body.items, start=1):
        line_amount = Decimal(str(it.quantity)) * Decimal(str(it.unit_price))
        session.add(
            PurchaseOrderItem(
                order_id=po.id,
                line_no=idx,
                material_code=it.material_code,
                material_name=it.material_name,
                quantity=Decimal(str(it.quantity)),
                unit=it.unit,
                unit_price=Decimal(str(it.unit_price)),
                amount=line_amount,
            )
        )
    await session.flush()
    return OrderOut(
        id=po.id,
        po_number=po.po_number,
        supplier_id=po.supplier_id,
        project_code=po.project_code,
        status=po.status,
        total_amount=float(po.total_amount),
        tax_amount=float(po.tax_amount),
        delivery_date=po.delivery_date,
    )


@router.post("/{order_id}/issue")
async def issue_order(
    order_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> dict:
    po = await session.get(PurchaseOrder, order_id)
    if po is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "order not found")
    po.status = "issued"
    po.issued_at = date.today()
    await session.flush()
    return {"order_id": order_id, "status": po.status}


@router.get("/{order_id}/pdf")
async def order_pdf(
    order_id: int,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> Response:
    """発注書 PDF を application/pdf で返却."""
    po = await session.get(PurchaseOrder, order_id)
    if po is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "order not found")
    items_rows = (
        await session.execute(
            select(PurchaseOrderItem).where(PurchaseOrderItem.order_id == order_id)
        )
    ).scalars().all()
    supplier = await session.get(Supplier, po.supplier_id)
    supplier_name = supplier.company_name if supplier else f"supplier#{po.supplier_id}"
    supplier_address = (supplier.address if supplier and supplier.address else "")

    subtotal = float(po.total_amount or 0) - float(po.tax_amount or 0)
    lines = [
        PoLine(
            line_no=i.line_no,
            material_name=i.material_name,
            quantity=float(i.quantity),
            unit=i.unit,
            unit_price=float(i.unit_price),
            amount=float(i.amount),
        )
        for i in items_rows
    ]
    issuer_invoice = "T1234567890123"

    pdf_bytes = generate_purchase_order_pdf(
        PurchaseOrderPdfData(
            po_number=po.po_number,
            supplier_name=supplier_name,
            supplier_address=supplier_address,
            issuer_invoice_no=issuer_invoice,
            issued_date=po.issued_at or date.today(),
            delivery_date=po.delivery_date,
            items=lines,
            subtotal=round(subtotal, 2),
            tax_amount=float(po.tax_amount or 0),
            total_amount=float(po.total_amount or 0),
        )
    )
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{po.po_number}.pdf"'},
    )
