"""提案書 PDF 生成 (cdx_pdf.JaPDF).

生成する章構成:
1. 表紙
2. 概要 (顧客名/テーマ/想定金額/期限)
3. ソリューション一覧 (採用カタログ + 見積)
4. F/S 結果 (4軸スコア + 判定)
5. PFI 概算 (NPV / IRR / VFM)
6. 期待効果
7. 付録 (備考)

日本語フォントは ``cdx_pdf`` (IPAex 自動取得) で対応し、取得失敗時は
Helvetica + ASCII fallback に縮退する。
"""

from __future__ import annotations

import io
from dataclasses import dataclass, field
from decimal import Decimal

try:
    from cdx_pdf import JaPDF, render_table
except ImportError:  # pragma: no cover - cdx_pdf 未インストール
    JaPDF = None  # type: ignore[assignment]
    render_table = None  # type: ignore[assignment]


@dataclass
class SolutionLine:
    name: str
    category: str
    quantity: Decimal
    unit_price: Decimal | None
    amount: Decimal


@dataclass
class FsSection:
    technical: Decimal
    legal: Decimal
    environment: Decimal
    business: Decimal
    total: Decimal
    decision: str  # GO / HOLD / NO_GO


@dataclass
class PfiSection:
    npv: float | None
    irr: float | None
    vfm: float | None
    payback_years: int | None
    is_viable: bool


@dataclass
class ProposalPdfInput:
    proposal_code: str
    client_name: str
    theme: str
    description: str | None
    expected_amount: Decimal | None
    proposal_deadline: str | None  # ISO date string
    primary_category: str | None
    owner_name: str | None
    solutions: list[SolutionLine] = field(default_factory=list)
    fs: FsSection | None = None
    pfi: PfiSection | None = None
    expected_benefits: list[str] = field(default_factory=list)
    appendix: str | None = None


def render_proposal_pdf(inp: ProposalPdfInput) -> bytes:
    """提案案件から PDF バイト列を生成する."""
    if JaPDF is None:
        raise RuntimeError("cdx_pdf (fpdf2) is not installed")

    pdf = JaPDF(orientation="P", unit="mm", format="A4")
    pdf.set_title(pdf._safe(inp.theme or inp.proposal_code))

    # ---------- 1. Cover ----------
    pdf.add_page()
    pdf.add_jp_text("提案書 / Proposal Document", font_size=24, bold=True, align="C", h=20)
    pdf.ln(20)
    pdf.add_jp_text(inp.theme, font_size=16, bold=True, align="C", h=12)
    pdf.ln(10)
    pdf.add_jp_text(f"提案番号: {inp.proposal_code}", font_size=12, align="C", h=8)
    pdf.add_jp_text(f"顧客: {inp.client_name}", font_size=12, align="C", h=8)
    if inp.proposal_deadline:
        pdf.add_jp_text(f"提出期限: {inp.proposal_deadline}", font_size=12, align="C", h=8)
    if inp.owner_name:
        pdf.add_jp_text(f"担当: {inp.owner_name}", font_size=12, align="C", h=8)

    # ---------- 2. Summary ----------
    pdf.add_page()
    _h1(pdf, "1. 概要 (Summary)")
    _kv(pdf, "顧客", inp.client_name)
    _kv(pdf, "テーマ", inp.theme)
    _kv(pdf, "カテゴリ", inp.primary_category or "-")
    _kv(
        pdf,
        "想定金額",
        f"JPY {inp.expected_amount:,.0f}" if inp.expected_amount else "-",
    )
    _kv(pdf, "提出期限", inp.proposal_deadline or "-")
    if inp.description:
        pdf.ln(2)
        pdf.add_jp_paragraph(inp.description, font_size=11)

    # ---------- 3. Solutions ----------
    _h1(pdf, "2. ソリューション (Solutions)")
    if inp.solutions:
        rows: list[tuple[str, ...]] = []
        total = Decimal("0")
        for s in inp.solutions:
            rows.append(
                (
                    s.name,
                    s.category,
                    f"{s.quantity}",
                    f"{s.unit_price:,.0f}" if s.unit_price is not None else "-",
                    f"{s.amount:,.0f}",
                )
            )
            total += s.amount
        render_table(
            pdf,
            headers=["名称", "カテゴリ", "数量", "単価", "金額"],
            rows=rows,
            widths=[60, 35, 20, 30, 35],
            font_size=10,
        )
        pdf.set_font(pdf.default_font, "B", 11)
        pdf.cell(115, 7, pdf._safe("合計"), border=1)
        pdf.cell(65, 7, pdf._safe(f"JPY {total:,.0f}"), border=1, ln=1, align="R")
    else:
        _p(pdf, "(ソリューション未登録)")

    # ---------- 4. F/S Result ----------
    _h1(pdf, "3. 実現可能性調査 (F/S)")
    if inp.fs:
        _kv(pdf, "技術スコア", f"{inp.fs.technical}")
        _kv(pdf, "法令スコア", f"{inp.fs.legal}")
        _kv(pdf, "環境スコア", f"{inp.fs.environment}")
        _kv(pdf, "事業スコア", f"{inp.fs.business}")
        _kv(pdf, "総合", f"{inp.fs.total}")
        _kv(pdf, "判定", inp.fs.decision)
    else:
        _p(pdf, "(F/S 未実施)")

    # ---------- 5. PFI ----------
    _h1(pdf, "4. PFI / PPP 概算")
    if inp.pfi:
        _kv(pdf, "NPV", f"{inp.pfi.npv:,.2f}" if inp.pfi.npv is not None else "-")
        _kv(
            pdf,
            "IRR",
            f"{inp.pfi.irr * 100:.2f}%" if inp.pfi.irr is not None else "-",
        )
        _kv(
            pdf,
            "VFM",
            f"{inp.pfi.vfm * 100:.2f}%" if inp.pfi.vfm is not None else "-",
        )
        _kv(
            pdf,
            "回収年数",
            str(inp.pfi.payback_years) if inp.pfi.payback_years is not None else "-",
        )
        _kv(pdf, "実現性", "実現可能" if inp.pfi.is_viable else "要再検討")
    else:
        _p(pdf, "(PFI 未評価)")

    # ---------- 6. Expected Benefits ----------
    _h1(pdf, "5. 期待効果 (Expected Benefits)")
    if inp.expected_benefits:
        for b in inp.expected_benefits:
            _p(pdf, f"- {b}")
    else:
        _p(pdf, "(未記入)")

    # ---------- 7. Appendix ----------
    _h1(pdf, "6. 付録 (Appendix)")
    _p(pdf, inp.appendix or "(なし)")

    raw = pdf.output()
    if isinstance(raw, str):  # fpdf1 互換 (latin-1 文字列)
        return raw.encode("latin-1")
    return bytes(raw)


def _h1(pdf: "JaPDF", text: str) -> None:
    pdf.ln(4)
    pdf.set_x(pdf.l_margin)
    pdf.add_jp_text(text, font_size=14, bold=True, h=8)
    pdf.ln(1)


def _kv(pdf: "JaPDF", key: str, value: str) -> None:
    """key/value 行. value は単一行 cell で右端まで描画."""
    pdf.set_font(pdf.default_font, "B", 11)
    pdf.cell(50, 6, pdf._safe(key + ":"), border=0)
    pdf.set_font(pdf.default_font, "", 11)
    remaining = pdf.w - pdf.r_margin - pdf.get_x()
    if remaining < 30:
        pdf.ln(6)
        remaining = pdf.w - pdf.l_margin - pdf.r_margin
    pdf.cell(remaining, 6, pdf._safe(value), border=0, ln=1)


def _p(pdf: "JaPDF", text: str) -> None:
    pdf.add_jp_paragraph(text, font_size=11)


def render_to_buffer(inp: ProposalPdfInput) -> io.BytesIO:
    return io.BytesIO(render_proposal_pdf(inp))
