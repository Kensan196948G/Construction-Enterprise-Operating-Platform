"""見積 PDF 生成 (cdx_pdf.JaPDF 経由).

電帳法対応:
- 生成後は不可変ファイルとして保管パス + sha256 を Quotation に記録する。
- PDF メタデータ (Keywords) に SHA-256 を埋め込む (再計算検証用)。
- fpdf2 / cdx_pdf が未インストールの環境 (テスト最低構成等) では ASCII テキスト
  プレースホルダ生成 (旧 stub 挙動) に自動フォールバック。
- 日本語フォント (IPAex) は cdx_pdf 側で自動取得 / fallback。
"""

from __future__ import annotations

import hashlib
from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from pathlib import Path


@dataclass(frozen=True)
class QuotationPdfInput:
    quotation_number: str
    version: int
    title: str
    client_name: str
    total_amount: Decimal
    items: list[tuple[str, Decimal, Decimal, Decimal]]  # (name, qty, unit_price, amount)
    subtotal_amount: Decimal | None = None
    tax_amount: Decimal | None = None
    issue_date: date | None = None
    valid_until: date | None = None
    issuer_name: str = "Construction DX Corp."
    issuer_address: str = ""
    bank_info: str = ""
    seal_placeholder: str = "[印]"


@dataclass(frozen=True)
class QuotationPdfResult:
    file_path: str
    sha256: str
    size_bytes: int


def _format_money(v: Decimal | None) -> str:
    if v is None:
        return "-"
    return f"{int(v):,}"


def _render_with_fpdf(payload: QuotationPdfInput, path: Path) -> bytes | None:
    """cdx_pdf.JaPDF で PDF を生成。失敗時は None。"""
    try:
        from cdx_pdf import JaPDF, render_table
    except Exception:
        return None

    try:
        pdf = JaPDF(orientation="P", unit="mm", format="A4")

        pdf.add_page()
        pdf.add_jp_text("見積書 / QUOTATION", font_size=18, bold=True, align="C")
        pdf.ln(2)

        pdf.add_jp_text(
            f"No: {payload.quotation_number}   Ver: {payload.version}",
            font_size=10,
        )
        if payload.issue_date:
            pdf.add_jp_text(f"発行日: {payload.issue_date.isoformat()}", font_size=10)
        if payload.valid_until:
            pdf.add_jp_text(f"有効期限: {payload.valid_until.isoformat()}", font_size=10)

        pdf.ln(2)
        pdf.add_jp_text(f"宛先: {payload.client_name} 御中", font_size=12, bold=True)
        pdf.add_jp_text(f"件名: {payload.title}", font_size=10)
        pdf.ln(3)

        # 明細表 (共通ヘルパ)
        rows = [
            (
                str(name)[:60],
                _format_money(qty),
                _format_money(price),
                _format_money(amount),
            )
            for (name, qty, price, amount) in payload.items
        ]
        render_table(
            pdf,
            headers=["項目", "数量", "単価", "金額"],
            rows=rows,
            widths=[80, 20, 35, 35],
            font_size=9,
        )

        pdf.ln(2)
        if payload.subtotal_amount is not None:
            pdf.set_font(pdf.default_font, "B", 10)
            pdf.cell(135, 6, pdf._safe("小計"), align="R")
            pdf.cell(35, 6, _format_money(payload.subtotal_amount), align="R", ln=1)
        if payload.tax_amount is not None:
            pdf.set_font(pdf.default_font, "B", 10)
            pdf.cell(135, 6, pdf._safe("消費税"), align="R")
            pdf.cell(35, 6, _format_money(payload.tax_amount), align="R", ln=1)
        pdf.set_font(pdf.default_font, "B", 12)
        pdf.cell(135, 8, pdf._safe("合計 / TOTAL"), align="R")
        pdf.cell(35, 8, _format_money(payload.total_amount), align="R", ln=1)

        pdf.ln(6)
        if payload.bank_info:
            pdf.add_jp_paragraph(f"振込先: {payload.bank_info}", font_size=9)
        if payload.issuer_address:
            pdf.add_jp_paragraph(
                f"発行者: {payload.issuer_name} / {payload.issuer_address}",
                font_size=9,
            )
        else:
            pdf.add_jp_text(f"発行者: {payload.issuer_name}", font_size=9)

        pdf.ln(4)
        pdf.seal_placeholder(payload.seal_placeholder)

        # 一旦ハッシュ無しで bytes 化 -> sha256 -> Keywords に埋めて書き直し
        provisional = bytes(pdf.output())
        sha = hashlib.sha256(provisional).hexdigest()
        pdf.set_keywords(f"sha256:{sha};quotation:{payload.quotation_number}")
        final_bytes = bytes(pdf.output())
        path.write_bytes(final_bytes)
        return final_bytes
    except Exception:
        return None


def _render_fallback(payload: QuotationPdfInput, path: Path) -> bytes:
    """fpdf2 不在/失敗時のテキストプレースホルダ生成."""
    body_lines = [
        f"QUOTATION: {payload.quotation_number} (v{payload.version})",
        f"Title: {payload.title}",
        f"Client: {payload.client_name}",
        "",
        "Items:",
    ]
    for name, qty, price, amount in payload.items:
        body_lines.append(f"  - {name}\tqty={qty} unit={price} amount={amount}")
    body_lines.append("")
    body_lines.append(f"TOTAL: {payload.total_amount}")
    blob = "\n".join(body_lines).encode("utf-8")
    path.write_bytes(blob)
    return blob


def render_quotation_pdf(
    payload: QuotationPdfInput, output_dir: str | Path
) -> QuotationPdfResult:
    """見積 PDF を生成する.

    1. cdx_pdf.JaPDF で実 PDF 生成 (失敗時はテキスト fallback)
    2. ファイルバイト列の SHA-256 を計算 (電帳法ハッシュ)
    """
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)
    filename = f"{payload.quotation_number}_v{payload.version}.pdf"
    path = out / filename

    blob = _render_with_fpdf(payload, path)
    if blob is None:
        blob = _render_fallback(payload, path)

    sha = hashlib.sha256(blob).hexdigest()
    return QuotationPdfResult(file_path=str(path), sha256=sha, size_bytes=len(blob))
