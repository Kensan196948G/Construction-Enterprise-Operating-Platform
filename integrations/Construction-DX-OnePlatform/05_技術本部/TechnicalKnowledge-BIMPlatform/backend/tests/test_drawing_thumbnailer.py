"""標準図サムネイル生成テスト."""
from __future__ import annotations

from tech_api.services.drawing_thumbnailer import render_pdf_thumbnail


def test_render_pdf_thumbnail_returns_placeholder_when_no_data() -> None:
    """PDF が空の時は SVG プレースホルダを返す."""
    result = render_pdf_thumbnail(None, label="標準図 STD-001")
    assert result.source == "placeholder"
    assert result.media_type == "image/svg+xml"
    assert b"<svg" in result.content
    assert "STD-001".encode("utf-8") in result.content


def test_render_pdf_thumbnail_invalid_bytes_fallbacks_to_placeholder() -> None:
    """壊れた PDF データを渡しても例外にならずプレースホルダにフォールバック."""
    result = render_pdf_thumbnail(b"not-a-pdf", label="bad")
    assert result.source == "placeholder"
    assert result.media_type == "image/svg+xml"
