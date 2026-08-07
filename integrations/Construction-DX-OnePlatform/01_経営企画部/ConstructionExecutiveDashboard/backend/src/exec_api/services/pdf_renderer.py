"""Markdown → PDF レンダラ.

CI 環境 (Linux) でも動くよう、優先順位:
1. ``weasyprint`` (Markdown → HTML → PDF, 高品質). HTML レンダリングは
   ``markdown`` ライブラリで行う。
2. ``fpdf2`` (純 Python, ヘッドレス GTK 不要). フォールバック。
3. それも失敗した場合は ``RuntimeError``。

呼び出し側は ``render_markdown_to_pdf(md_text) -> bytes`` を使う。
"""

from __future__ import annotations

import io
import logging
import re

log = logging.getLogger(__name__)


def _try_weasyprint(md_text: str) -> bytes | None:
    try:
        from weasyprint import HTML  # type: ignore[import-not-found]
    except Exception as e:  # pragma: no cover
        log.debug("weasyprint unavailable: %s", e)
        return None
    try:
        try:
            import markdown as md_lib  # type: ignore[import-not-found]

            html_body = md_lib.markdown(md_text, extensions=["tables"])
        except Exception:
            # 最低限の HTML: <pre> でラップ
            html_body = "<pre>" + (md_text.replace("&", "&amp;")
                                          .replace("<", "&lt;")
                                          .replace(">", "&gt;")) + "</pre>"
        html_doc = (
            "<html><head><meta charset='utf-8'>"
            "<style>"
            "body { font-family: 'Noto Sans CJK JP', sans-serif; font-size: 11pt; }"
            "h1 { font-size: 18pt; border-bottom: 2px solid #333; }"
            "h2 { font-size: 14pt; margin-top: 1em; }"
            "table { border-collapse: collapse; width: 100%; }"
            "th, td { border: 1px solid #888; padding: 4px 8px; }"
            "</style>"
            "</head><body>" + html_body + "</body></html>"
        )
        return HTML(string=html_doc).write_pdf()
    except Exception as e:  # pragma: no cover
        log.warning("weasyprint render failed: %s", e)
        return None


def _try_fpdf(md_text: str) -> bytes | None:
    """cdx_pdf.JaPDF (内部で fpdf2) を使った Markdown → PDF レンダリング.

    JaPDF が IPAex を取得できた場合は日本語をそのまま描画する。
    取得失敗時は内部で ASCII fallback (? 置換) に縮退するため、本関数は
    常に何らかの PDF bytes を返す (fpdf2 未インストール時のみ None)。
    """
    try:
        from cdx_pdf import JaPDF  # type: ignore[import-not-found]
    except Exception as e:
        log.debug("cdx_pdf/fpdf unavailable: %s", e)
        return None
    try:
        pdf = JaPDF()
        pdf.add_page()
        for raw_line in md_text.splitlines():
            line = raw_line.rstrip()
            # 見出し
            if line.startswith("# "):
                pdf.set_font(pdf.default_font, "B", 16)
                text = line[2:]
            elif line.startswith("## "):
                pdf.set_font(pdf.default_font, "B", 13)
                text = line[3:]
            elif line.startswith("### "):
                pdf.set_font(pdf.default_font, "B", 11)
                text = line[4:]
            else:
                pdf.set_font(pdf.default_font, "", 10)
                text = line
            pdf.multi_cell(0, 5, pdf._safe(text) if text else " ")
        out = pdf.output()
        if isinstance(out, str):
            return out.encode("latin-1", "replace")
        if isinstance(out, (bytes, bytearray)):
            return bytes(out)
        return bytes(out)
    except Exception as e:  # pragma: no cover
        log.warning("cdx_pdf render failed: %s", e)
        return None


def _minimal_pdf_fallback(md_text: str) -> bytes:
    """全 PDF ライブラリが使えない場合の最小 PDF 1 ページ.

    PDF 1.4 仕様に沿った極小ファイル。本文は ASCII 化 (CJK は ? 置換)。
    """
    # ASCII 化
    safe = md_text.encode("ascii", "replace").decode("ascii")
    lines = safe.splitlines() or [""]
    # 1 行 = 12pt 行間, 50pt から開始, 760pt が天井
    content_ops = ["BT", "/F1 10 Tf", "50 760 Td"]
    for line in lines[:60]:
        # PDF 文字列中で () と \ をエスケープ
        esc = line.replace("\\", r"\\").replace("(", r"\(").replace(")", r"\)")
        content_ops.append(f"({esc}) Tj")
        content_ops.append("0 -12 Td")
    content_ops.append("ET")
    stream = "\n".join(content_ops).encode("ascii", "replace")

    buf = io.BytesIO()
    buf.write(b"%PDF-1.4\n")
    offsets: list[int] = []

    def _w(obj_num: int, body: bytes) -> None:
        offsets.append(buf.tell())
        buf.write(f"{obj_num} 0 obj\n".encode())
        buf.write(body)
        buf.write(b"\nendobj\n")

    _w(1, b"<< /Type /Catalog /Pages 2 0 R >>")
    _w(2, b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>")
    _w(3, b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] "
          b"/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>")
    _w(4, f"<< /Length {len(stream)} >>\nstream\n".encode() + stream + b"\nendstream")
    _w(5, b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")

    xref_pos = buf.tell()
    buf.write(b"xref\n0 6\n0000000000 65535 f \n")
    for off in offsets:
        buf.write(f"{off:010d} 00000 n \n".encode())
    buf.write(b"trailer\n<< /Size 6 /Root 1 0 R >>\n")
    buf.write(f"startxref\n{xref_pos}\n%%EOF\n".encode())
    return buf.getvalue()


def render_markdown_to_pdf(md_text: str) -> bytes:
    """Markdown を PDF (bytes) に変換.

    試行順: weasyprint → fpdf2 → 最小内蔵フォールバック。
    例外は投げず、最低でも内蔵フォールバックで PDF を返す。
    """
    pdf = _try_weasyprint(md_text)
    if pdf is not None:
        return pdf
    pdf = _try_fpdf(md_text)
    if pdf is not None:
        return pdf
    log.info("Using minimal builtin PDF fallback (no weasyprint/fpdf installed).")
    return _minimal_pdf_fallback(md_text)


def looks_like_pdf(blob: bytes) -> bool:
    """PDF マジック判定 (テスト・呼出側用)."""
    return blob.startswith(b"%PDF-")


_HEADING_RE = re.compile(r"^(#{1,6})\s+(.+)$")


def extract_headings(md_text: str) -> list[tuple[int, str]]:
    """Markdown から (level, text) の見出しを抽出 (テスト用)."""
    out: list[tuple[int, str]] = []
    for line in md_text.splitlines():
        m = _HEADING_RE.match(line)
        if m:
            out.append((len(m.group(1)), m.group(2).strip()))
    return out
