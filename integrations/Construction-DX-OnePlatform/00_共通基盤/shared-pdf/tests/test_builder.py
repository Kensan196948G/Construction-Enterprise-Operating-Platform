"""``JaPDF`` の基本動作 (ASCII fallback パス) を検証.

ネットワーク禁止 + フォント未配置の環境を想定し、Helvetica fallback で
PDF が問題なく生成できることを確認する。
"""

from __future__ import annotations

import pytest

pytest.importorskip("fpdf", reason="fpdf2 not installed")

from cdx_pdf import JaPDF, render_table  # noqa: E402


def _build_no_font(monkeypatch, tmp_path) -> JaPDF:
    monkeypatch.setenv("CDX_PDF_FONT_DIR", str(tmp_path / "empty"))
    monkeypatch.setenv("HOME", str(tmp_path / "fake_home"))
    monkeypatch.setenv("USERPROFILE", str(tmp_path / "fake_home"))
    return JaPDF(allow_font_download=False)


def test_japdf_falls_back_to_helvetica(monkeypatch, tmp_path) -> None:
    pdf = _build_no_font(monkeypatch, tmp_path)
    assert pdf.has_jp_font is False
    assert pdf.default_font == "Helvetica"


def test_japdf_renders_japanese_in_fallback(monkeypatch, tmp_path) -> None:
    """日本語が含まれていてもクラッシュせず PDF bytes を返す."""
    pdf = _build_no_font(monkeypatch, tmp_path)
    pdf.add_page()
    pdf.add_jp_text("見積書", font_size=18, bold=True, align="C")
    pdf.add_jp_text("お客様各位")
    blob = bytes(pdf.output())
    assert blob.startswith(b"%PDF-")
    assert b"%%EOF" in blob


def test_render_table_basic(monkeypatch, tmp_path) -> None:
    pdf = _build_no_font(monkeypatch, tmp_path)
    pdf.add_page()
    render_table(
        pdf,
        headers=["Item", "Qty", "Price"],
        rows=[("Steel", "10", "1500"), ("Concrete", "5", "2200")],
        widths=[60, 30, 40],
    )
    blob = bytes(pdf.output())
    assert blob.startswith(b"%PDF-")


def test_header_with_company_name(monkeypatch, tmp_path) -> None:
    monkeypatch.setenv("CDX_PDF_FONT_DIR", str(tmp_path / "empty"))
    monkeypatch.setenv("HOME", str(tmp_path / "fake_home"))
    monkeypatch.setenv("USERPROFILE", str(tmp_path / "fake_home"))
    pdf = JaPDF(
        allow_font_download=False,
        company_name="Construction DX Corp.",
    )
    pdf.set_company_header("Construction DX Corp.", show_page_number=True)
    pdf.add_page()
    pdf.add_jp_text("Body line 1")
    blob = bytes(pdf.output())
    assert blob.startswith(b"%PDF-")
