"""cdx_pdf — Construction DX 共通PDF生成モジュール.

このモジュールは fpdf2 を日本語対応させた ``JaPDF`` クラスと、
IPAex フォントの取得/キャッシュロジック ``ensure_ja_fonts`` を提供する。

部門ごとの PDF サービスから次のように利用する::

    from cdx_pdf import JaPDF

    pdf = JaPDF()
    pdf.add_page()
    pdf.add_jp_text("見積書", font_size=18, bold=True)
    blob = bytes(pdf.output())

ネットワーク非接続環境では IPAex を取得できない場合がある。
その場合は ``JaPDF`` は内部的に Helvetica (Latin-1) に縮退し、
ASCII 文字以外を ``?`` に置換 (graceful fallback) する。
"""

from .builder import JaPDF, render_table
from .fonts import (
    FontAcquisitionError,
    ensure_ja_fonts,
    get_font_dir,
    register_ja_fonts,
)

__all__ = [
    "FontAcquisitionError",
    "JaPDF",
    "ensure_ja_fonts",
    "get_font_dir",
    "register_ja_fonts",
    "render_table",
]
