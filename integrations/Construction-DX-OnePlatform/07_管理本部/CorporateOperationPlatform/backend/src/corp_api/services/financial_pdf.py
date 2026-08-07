"""財務諸表 PDF 出力 (cdx_pdf.JaPDF).

B/S・P/L・C/F を 1 PDF にまとめる。前期比較あり。
日本語フォントは ``cdx_pdf`` 経由で IPAex を自動取得 (取得失敗時は
Helvetica + ASCII fallback)。
"""
from __future__ import annotations

from typing import Any

try:
    from cdx_pdf import JaPDF  # type: ignore[import-not-found]

    _FPDF_AVAILABLE = True
except ImportError:  # pragma: no cover
    JaPDF = None  # type: ignore[misc,assignment]
    _FPDF_AVAILABLE = False


class FinancialPdfError(RuntimeError):
    pass


def _fmt(v: Any) -> str:
    try:
        n = float(v)
    except (TypeError, ValueError):
        return str(v)
    return f"{n:,.0f}"


def _section(pdf: JaPDF, title: str, rows: list[tuple[str, str]]) -> None:
    pdf.add_jp_text(title, font_size=12, bold=True, h=8)
    pdf.set_font(pdf.default_font, "", 10)
    for label, value in rows:
        pdf.cell(120, 6, pdf._safe(label))
        pdf.cell(40, 6, pdf._safe(value), align="R", ln=1)
    pdf.ln(2)


def render_financial_statements_pdf(
    current: dict,
    *,
    previous: dict | None = None,
    cash_flow: dict | None = None,
    year: int | None = None,
) -> bytes:
    """B/S・P/L・C/F PDF を生成して bytes を返す.

    current: build_financial_statements(...).to_dict() 形式.
    previous: 同形式 (前期). None なら比較なし.
    cash_flow: CashFlowStatement.to_dict() 形式.
    """
    if not _FPDF_AVAILABLE:
        raise FinancialPdfError("cdx_pdf (fpdf2) is not installed")

    pdf = JaPDF(orientation="P", unit="mm", format="A4")
    pdf.add_page()

    title = f"財務諸表 / Financial Statements{' ' + str(year) if year else ''}"
    pdf.add_jp_text(title, font_size=16, bold=True, align="C", h=10)
    pdf.ln(2)

    # B/S サマリ
    bs_rows: list[tuple[str, str]] = [
        ("資産合計 (Total Assets)", _fmt(current.get("total_assets"))),
        ("負債+純資産合計", _fmt(current.get("total_liabilities_equity"))),
        ("バランス", "YES" if current.get("bs_balanced") else "NO"),
    ]
    if previous:
        bs_rows.append(("(前期) 資産合計", _fmt(previous.get("total_assets"))))
    _section(pdf, "貸借対照表 (B/S) 概要", bs_rows)

    # B/S 明細
    cat_labels = {"asset": "資産", "liability": "負債", "equity": "純資産"}
    for cat in ("asset", "liability", "equity"):
        rows = current.get("balance_sheet", {}).get(cat, [])
        if rows:
            _section(
                pdf,
                f"  {cat_labels[cat]} 明細",
                [(r["account_name"], _fmt(r["balance"])) for r in rows],
            )

    # P/L サマリ
    pl_rows: list[tuple[str, str]] = [
        ("売上合計 (Total Revenue)", _fmt(current.get("total_revenue"))),
        ("費用合計 (Total Expense)", _fmt(current.get("total_expense"))),
        ("当期純利益 (Net Income)", _fmt(current.get("net_income"))),
    ]
    if previous:
        pl_rows.append(("(前期) 当期純利益", _fmt(previous.get("net_income"))))
    _section(pdf, "損益計算書 (P/L) 概要", pl_rows)

    pl_labels = {"revenue": "売上", "expense": "費用"}
    for cat in ("revenue", "expense"):
        rows = current.get("profit_loss", {}).get(cat, [])
        if rows:
            _section(
                pdf,
                f"  {pl_labels[cat]} 明細",
                [(r["account_name"], _fmt(r["balance"])) for r in rows],
            )

    # C/F
    if cash_flow:
        _section(
            pdf,
            "キャッシュフロー計算書 (C/F)",
            [
                ("営業CF", _fmt(cash_flow.get("operating"))),
                ("投資CF", _fmt(cash_flow.get("investing"))),
                ("財務CF", _fmt(cash_flow.get("financing"))),
                ("正味増加額", _fmt(cash_flow.get("net_increase"))),
                ("期末現金残高", _fmt(cash_flow.get("closing_cash"))),
            ],
        )

    out = pdf.output()
    if isinstance(out, str):
        return out.encode("latin-1")
    return bytes(out)
