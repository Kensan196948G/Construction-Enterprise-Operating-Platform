"""発注書 PDF 生成テスト."""
from __future__ import annotations

from datetime import date

import pytest

from proc_api.services.purchase_order_pdf import (
    PoLine,
    PurchaseOrderPdfData,
    generate_purchase_order_pdf,
    validate_invoice_no,
)


def test_pdf_generation_produces_valid_pdf_bytes() -> None:
    """PDF が生成され、ヘッダ %PDF- が先頭にあること."""
    data = PurchaseOrderPdfData(
        po_number="PO-2026-0001",
        supplier_name="ABC Corporation",
        supplier_address="Tokyo, Japan",
        issuer_invoice_no="T1234567890123",
        issued_date=date(2026, 5, 22),
        delivery_date=date(2026, 6, 15),
        items=[
            PoLine(1, "Steel Beam H-200", 10, "pcs", 15000.0, 150000.0),
            PoLine(2, "Concrete C-30", 5, "m3", 22000.0, 110000.0),
        ],
        subtotal=260000.0,
        tax_amount=26000.0,
        total_amount=286000.0,
    )
    pdf_bytes = generate_purchase_order_pdf(data)
    assert isinstance(pdf_bytes, bytes)
    assert pdf_bytes.startswith(b"%PDF-")
    # 末尾は EOF マーカ
    assert b"%%EOF" in pdf_bytes[-32:]
    # 一定サイズ以上 (空ではない)
    assert len(pdf_bytes) > 1000


def test_pdf_invalid_invoice_no_raises() -> None:
    """インボイス番号が T+13 桁で無いと ValueError."""
    assert validate_invoice_no("T1234567890123") is True
    assert validate_invoice_no("1234567890123") is False
    assert validate_invoice_no("T123") is False

    data = PurchaseOrderPdfData(
        po_number="PO-X",
        supplier_name="X",
        issuer_invoice_no="INVALID",
        items=[PoLine(1, "item", 1, "個", 100.0, 100.0)],
        subtotal=100.0,
        tax_amount=10.0,
        total_amount=110.0,
    )
    with pytest.raises(ValueError):
        generate_purchase_order_pdf(data)
