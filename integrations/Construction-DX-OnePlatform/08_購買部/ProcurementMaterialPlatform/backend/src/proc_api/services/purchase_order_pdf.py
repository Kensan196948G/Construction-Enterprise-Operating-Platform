"""発注書 PDF 生成サービス (cdx_pdf.JaPDF 経由).

cdx_pdf.JaPDF (内部で fpdf2) を用いて発注書を PDF バイト列で返却する。
インボイス番号 (T + 13 桁) を明記し、明細 / 合計 / 振込先 / 納期を含む。
日本語フォントは IPAex を自動取得 (失敗時は Helvetica + ASCII fallback)。
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import date
from typing import Sequence


# 適格請求書発行事業者番号: T + 13 桁
INVOICE_PATTERN = re.compile(r"^T\d{13}$")


@dataclass(frozen=True)
class PoLine:
    """発注書 1 明細."""

    line_no: int
    material_name: str
    quantity: float
    unit: str
    unit_price: float
    amount: float


@dataclass(frozen=True)
class PurchaseOrderPdfData:
    """発注書 PDF 入力."""

    po_number: str
    supplier_name: str
    supplier_address: str = ""
    issuer_name: str = "株式会社 Construction DX"
    issuer_invoice_no: str = "T0000000000000"
    issued_date: date = field(default_factory=date.today)
    delivery_date: date | None = None
    delivery_place: str = "本社倉庫"
    payment_terms: str = "月末締め翌月末払い"
    bank_account: str = "○○銀行 △△支店 普通 1234567"
    items: Sequence[PoLine] = field(default_factory=tuple)
    subtotal: float = 0.0
    tax_rate: float = 0.10
    tax_amount: float = 0.0
    total_amount: float = 0.0
    note: str = ""


def validate_invoice_no(invoice_no: str) -> bool:
    """T + 13 桁の形式チェック."""
    return bool(INVOICE_PATTERN.match(invoice_no))


def generate_purchase_order_pdf(data: PurchaseOrderPdfData) -> bytes:
    """発注書 PDF をバイト列で返却.

    cdx_pdf / fpdf2 未インストール時は ImportError を伝搬。pyproject に依存追加済。
    """
    from cdx_pdf import JaPDF, render_table  # 遅延 import

    if not validate_invoice_no(data.issuer_invoice_no):
        raise ValueError(
            f"invoice_no must match T + 13 digits, got {data.issuer_invoice_no!r}"
        )

    pdf = JaPDF(orientation="P", unit="mm", format="A4")
    pdf.add_page()

    # タイトル
    pdf.add_jp_text("発注書 / PURCHASE ORDER", font_size=18, bold=True, align="C", h=12)
    pdf.ln(2)

    # ヘッダ情報 2 段
    pdf.set_font(pdf.default_font, "", 10)
    pdf.cell(95, 6, pdf._safe(f"PO No.: {data.po_number}"), border=0)
    pdf.cell(0, 6, pdf._safe(f"発行日: {data.issued_date.isoformat()}"), ln=1)
    pdf.cell(95, 6, pdf._safe(f"宛先: {data.supplier_name} 御中"), border=0)
    pdf.cell(
        0,
        6,
        pdf._safe(f"納期: {data.delivery_date.isoformat() if data.delivery_date else '-'}"),
        ln=1,
    )
    if data.supplier_address:
        pdf.cell(0, 6, pdf._safe(f"住所: {data.supplier_address}"), ln=1)
    pdf.ln(2)

    # 発行者情報 + インボイス番号
    pdf.add_jp_text(f"発行者: {data.issuer_name}", font_size=10, bold=True)
    pdf.add_jp_text(
        f"適格請求書発行事業者番号: {data.issuer_invoice_no}", font_size=10
    )
    pdf.ln(2)

    # 明細テーブル (共通ヘルパ)
    rows = []
    for line in data.items:
        rows.append(
            (
                str(line.line_no),
                str(line.material_name)[:40],
                f"{line.quantity:.2f}",
                line.unit,
                f"{line.unit_price:,.2f}",
                f"{line.amount:,.2f}",
            )
        )
    render_table(
        pdf,
        headers=["No.", "品目", "数量", "単位", "単価", "金額"],
        rows=rows,
        widths=[12, 70, 20, 15, 35, 38],
        font_size=10,
    )

    pdf.ln(2)
    pdf.set_font(pdf.default_font, "B", 10)
    pdf.cell(152, 6, pdf._safe("小計 / Subtotal"), align="R")
    pdf.cell(38, 6, f"{data.subtotal:,.2f}", align="R", ln=1)
    pdf.cell(152, 6, pdf._safe(f"消費税 ({data.tax_rate*100:.0f}%)"), align="R")
    pdf.cell(38, 6, f"{data.tax_amount:,.2f}", align="R", ln=1)
    pdf.cell(152, 6, pdf._safe("合計 / TOTAL"), align="R")
    pdf.cell(38, 6, f"{data.total_amount:,.2f}", align="R", ln=1)
    pdf.ln(4)

    # フッタ情報
    pdf.set_font(pdf.default_font, "", 9)
    pdf.cell(0, 5, pdf._safe(f"納入場所: {data.delivery_place}"), ln=1)
    pdf.cell(0, 5, pdf._safe(f"支払条件: {data.payment_terms}"), ln=1)
    pdf.cell(0, 5, pdf._safe(f"振込先: {data.bank_account}"), ln=1)
    if data.note:
        pdf.ln(2)
        pdf.add_jp_paragraph(f"備考: {data.note}", font_size=9)

    out = pdf.output()
    if isinstance(out, (bytes, bytearray)):
        return bytes(out)
    return out.encode("latin-1", "replace")  # type: ignore[union-attr]
