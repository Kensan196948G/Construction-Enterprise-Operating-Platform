"""標準図 PDF のサムネイル生成サービス.

PyMuPDF (fitz) があれば 1ページ目を PNG にレンダリングする。
未導入環境では SVG プレースホルダ画像を返す。
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass
class ThumbnailResult:
    content: bytes
    media_type: str
    source: str  # "pymupdf" or "placeholder"


_PLACEHOLDER_SVG = (
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 240'>"
    "<rect width='100%' height='100%' fill='#f0f4f8'/>"
    "<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' "
    "font-family='sans-serif' font-size='18' fill='#3b6dc9'>"
    "{label}</text>"
    "</svg>"
)


def _placeholder(label: str = "Drawing PDF") -> ThumbnailResult:
    safe = label.replace("<", "").replace(">", "")[:40]
    svg = _PLACEHOLDER_SVG.format(label=safe)
    return ThumbnailResult(
        content=svg.encode("utf-8"),
        media_type="image/svg+xml",
        source="placeholder",
    )


def render_pdf_thumbnail(
    pdf_bytes: bytes | None,
    *,
    label: str = "Drawing PDF",
    dpi: int = 96,
) -> ThumbnailResult:
    """PDF の 1ページ目をサムネイル PNG として返す.

    pdf_bytes が None / 空 / PyMuPDF 未導入 / 解析失敗の場合は SVG プレースホルダを返す。
    """
    if not pdf_bytes:
        return _placeholder(label)

    try:
        import fitz  # type: ignore  # PyMuPDF

        with fitz.open(stream=pdf_bytes, filetype="pdf") as doc:
            if doc.page_count == 0:
                return _placeholder(label)
            page = doc.load_page(0)
            zoom = dpi / 72.0
            mat = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=mat, alpha=False)
            png = pix.tobytes("png")
            return ThumbnailResult(
                content=png,
                media_type="image/png",
                source="pymupdf",
            )
    except Exception:
        return _placeholder(label)
