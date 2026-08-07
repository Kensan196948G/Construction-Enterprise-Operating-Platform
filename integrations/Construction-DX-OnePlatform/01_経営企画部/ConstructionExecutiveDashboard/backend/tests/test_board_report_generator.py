"""board_report_generator 単体テスト."""

from __future__ import annotations

from datetime import date

from exec_api.services.board_report_generator import generate
from exec_api.services.pdf_renderer import (
    extract_headings,
    looks_like_pdf,
    render_markdown_to_pdf,
)


def test_generate_includes_required_sections() -> None:
    """生成された Markdown に必須セクションが含まれる."""
    draft = generate(
        fiscal_period="Q2",
        report_date=date(2026, 5, 22),
        kpis={
            "orders_amount": 1.0e9,
            "average_profit_margin": 0.06,
            "accident_count": 1,
            "deficit_project_count": 2,
        },
        forecasts=[
            {"target_metric": "profit_margin", "summary": "trend up",
             "model_name": "prophet"},
        ],
        alerts=[
            {"level": "warning", "title": "利益率",
             "message": "閾値未満", "category": "profit"},
        ],
        esg={"co2_total_t": 1200, "environment_score": 78.0},
    )
    md = draft.body_markdown
    # 見出しレベル 1/2 が揃う
    headings = dict(extract_headings(md))
    assert any("取締役会報告書" in h for h, _ in [(v, l) for v, l in [(t, l) for l, t in extract_headings(md)]])
    # 主要セクション
    assert "## 1. エグゼクティブサマリ" in md
    assert "## 2. 主要 KPI" in md
    assert "## 3. AI 予測" in md
    assert "## 4. 経営アラート" in md
    assert "## 5. ESG/SDGs ハイライト" in md
    # KPI テーブル
    assert "| KPI | 値 |" in md
    assert "orders_amount" in md
    # サマリには利益率の言及がある (heuristic fallback)
    assert "利益率" in draft.ai_summary
    # period / report_date が反映
    assert draft.fiscal_period == "Q2"
    assert draft.report_date == date(2026, 5, 22)


def test_generate_renders_to_pdf_bytes() -> None:
    """生成 Markdown が PDF (bytes) にレンダリングでき、PDFマジックを持つ."""
    draft = generate(
        fiscal_period="Q2",
        report_date=date(2026, 5, 22),
        kpis={"orders_amount": 1.0e9, "average_profit_margin": 0.08},
    )
    pdf = render_markdown_to_pdf(draft.body_markdown)
    assert isinstance(pdf, bytes)
    assert len(pdf) > 100
    assert looks_like_pdf(pdf)
