"""請求書 + インボイス制度対応."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..config import settings
from ..services.invoice_validator import (
    InvalidInvoiceRegistrationNo,
    assert_valid_format,
    lookup_registration,
    validate_format,
)
from ..services.tax_calculator import calculate_tax
from ._auth import get_current_user
from ._store import MemoryStore

router = APIRouter()
invoice_store = MemoryStore(id_key="invoice_id")
invoice_item_store = MemoryStore(id_key="item_id")


class InvoiceIn(BaseModel):
    invoice_number: str
    direction: str = Field(default="received", pattern="^(received|issued)$")
    issuer_name: str
    issuer_registration_no: str  # T + 13 桁
    counterparty_name: str | None = None
    invoice_date: str
    payment_due_date: str | None = None
    amount_excl_tax: float
    tax_rate: float = 0.10
    tax_amount: float
    amount_incl_tax: float
    project_id: str | None = None


@router.get("")
def list_invoices(_=Depends(get_current_user)) -> list[dict[str, Any]]:
    return invoice_store.list()


@router.post("", status_code=201)
def create_invoice(payload: InvoiceIn, _=Depends(get_current_user)) -> dict[str, Any]:
    try:
        assert_valid_format(payload.issuer_registration_no)
    except InvalidInvoiceRegistrationNo as e:
        raise HTTPException(status_code=400, detail=str(e))
    return invoice_store.create(payload.model_dump())


@router.get("/{invoice_id}")
def get_invoice(invoice_id: str, _=Depends(get_current_user)) -> dict[str, Any]:
    item = invoice_store.get(invoice_id)
    if not item:
        raise HTTPException(status_code=404, detail="not found")
    return item


class TaxLineIn(BaseModel):
    item_name: str
    amount_excl_tax: float
    category: str | None = None  # standard / reduced / exempt (省略時は品名推定)


class TaxCalcIn(BaseModel):
    items: list[TaxLineIn]
    issuer_qualified: bool = True


@router.post("/calculate-tax")
def calculate_tax_endpoint(
    payload: TaxCalcIn, _=Depends(get_current_user)
) -> dict[str, Any]:
    """品目から消費税を自動計算 (軽減/標準/インボイス制度).

    issuer_qualified=False の場合は経過措置 80% 控除。
    """
    breakdown = calculate_tax(
        [l.model_dump() for l in payload.items],
        issuer_qualified=payload.issuer_qualified,
    )
    return breakdown.to_dict()


@router.get("/validate-registration/{registration_no}")
async def validate_registration(
    registration_no: str,
    _=Depends(get_current_user),
) -> dict[str, Any]:
    """適格請求書発行事業者番号の形式検証 + (任意) 国税庁 API 照会."""
    if not validate_format(registration_no):
        return {
            "registration_no": registration_no,
            "is_valid_format": False,
            "is_registered": False,
            "note": "format_invalid",
        }
    result = await lookup_registration(
        registration_no,
        endpoint=settings.nta_invoice_api_endpoint or None,
    )
    return {
        "registration_no": result.registration_no,
        "is_valid_format": result.is_valid_format,
        "is_registered": result.is_registered,
        "name": result.name,
        "note": result.note,
    }
