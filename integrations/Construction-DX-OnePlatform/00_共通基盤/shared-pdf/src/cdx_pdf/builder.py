"""``JaPDF``: 日本語対応 fpdf2 サブクラス.

``register_ja_fonts`` が成功した場合は ``gothic`` (デフォルト) で日本語をその
まま描画する。失敗した場合は Helvetica にフォールバックし、ASCII 外の文字を
``?`` に置換して描画する (PDF 生成自体は止めない)。

呼び出し側は以下の高レベル ヘルパを使えば、フォントが入っていても入って
いなくても同じコードで動く::

    pdf = JaPDF()
    pdf.add_page()
    pdf.add_jp_text("見積書", font_size=18, bold=True, align="C")
    pdf.add_jp_text("お客様各位")

ヘッダ / フッタ / ページ番号 / 印影プレースホルダ は ``set_company_header``
で有効化する。共通の表ヘルパは ``render_table`` を参照。
"""

from __future__ import annotations

import logging
from collections.abc import Iterable, Sequence

try:
    from fpdf import FPDF  # type: ignore[import-not-found]
except ImportError as _e:  # pragma: no cover - fpdf2 必須
    FPDF = None  # type: ignore[assignment]
    _IMPORT_ERROR = _e
else:
    _IMPORT_ERROR = None

from .fonts import register_ja_fonts

log = logging.getLogger(__name__)


def _ascii_safe(text: str) -> str:
    """Latin-1 不可文字を ``?`` に置換."""
    if text is None:
        return ""
    return str(text).encode("latin-1", errors="replace").decode("latin-1")


class JaPDF(FPDF if FPDF is not None else object):  # type: ignore[misc]
    """日本語対応 PDF ビルダ.

    Parameters
    ----------
    orientation, unit, format:
        ``fpdf.FPDF`` と同じ.
    allow_font_download:
        IPAex フォントが未キャッシュの場合にネットワーク取得を試みるか。
        オフライン CI 等で確実に ASCII fallback したい場合は ``False``.
    company_name:
        ヘッダに描画する会社名 (ロゴプレースホルダ).
    show_page_number:
        フッタにページ番号 ``n / total`` を出すか.
    """

    def __init__(
        self,
        orientation: str = "P",
        unit: str = "mm",
        format: str = "A4",
        *,
        allow_font_download: bool = True,
        company_name: str | None = None,
        show_page_number: bool = True,
    ) -> None:
        if FPDF is None:  # pragma: no cover
            raise RuntimeError(
                f"fpdf2 is required for JaPDF but not installed: {_IMPORT_ERROR}"
            )
        super().__init__(orientation=orientation, unit=unit, format=format)
        self.set_auto_page_break(auto=True, margin=15)
        # 日本語フォント登録試行
        self._has_jp_font = register_ja_fonts(self, allow_download=allow_font_download)
        if self._has_jp_font:
            self._default_font = "gothic"
        else:
            self._default_font = "Helvetica"
        self._company_name = company_name
        self._show_page_number = show_page_number
        # 既定フォント設定
        self.set_font(self._default_font, "", 11)

    # ------------------------------------------------------------------
    # Properties
    # ------------------------------------------------------------------
    @property
    def has_jp_font(self) -> bool:
        """日本語フォントが登録できたか. ``False`` の場合は ASCII fallback."""
        return self._has_jp_font

    @property
    def default_font(self) -> str:
        return self._default_font

    # ------------------------------------------------------------------
    # Header / Footer (fpdf2 が add_page で自動呼び出し)
    # ------------------------------------------------------------------
    def header(self) -> None:  # noqa: D401 - fpdf2 オーバーライド
        if not self._company_name:
            return
        self.set_font(self._default_font, "B", 9)
        self.set_text_color(80, 80, 80)
        self._write_safe(self._company_name, w=0, h=6, ln=1, align="R")
        self.set_text_color(0, 0, 0)
        self.ln(2)

    def footer(self) -> None:  # noqa: D401 - fpdf2 オーバーライド
        if not self._show_page_number:
            return
        self.set_y(-12)
        self.set_font(self._default_font, "", 8)
        self.set_text_color(120, 120, 120)
        # ``self.page_no()`` は現在ページ番号. 総ページ数は alias で取得.
        text = f"- {self.page_no()} / {{nb}} -"
        self._write_safe(text, w=0, h=5, align="C")
        self.set_text_color(0, 0, 0)

    # ------------------------------------------------------------------
    # Text helpers
    # ------------------------------------------------------------------
    def _safe(self, text: str) -> str:
        """日本語フォント未登録時のみ ASCII 化."""
        if text is None:
            return ""
        if self._has_jp_font:
            return str(text)
        return _ascii_safe(text)

    def _write_safe(
        self,
        text: str,
        *,
        w: float = 0,
        h: float = 6,
        ln: int = 1,
        align: str = "L",
        border: int | str = 0,
    ) -> None:
        self.cell(w, h, self._safe(text), border=border, ln=ln, align=align)

    def add_jp_text(
        self,
        text: str,
        *,
        font_size: int = 11,
        bold: bool = False,
        align: str = "L",
        h: float = 6,
        ln: int = 1,
        w: float = 0,
        border: int | str = 0,
    ) -> None:
        """日本語文字を 1 セルで書き出す高レベル ヘルパ.

        フォントが無い環境では自動的に ASCII 化される。
        """
        style = "B" if bold else ""
        self.set_font(self._default_font, style, font_size)
        self._write_safe(text, w=w, h=h, ln=ln, align=align, border=border)

    def add_jp_paragraph(
        self,
        text: str,
        *,
        font_size: int = 10,
        bold: bool = False,
        h: float = 5,
    ) -> None:
        """複数行段落 (multi_cell) で書き出す."""
        style = "B" if bold else ""
        self.set_font(self._default_font, style, font_size)
        self.set_x(self.l_margin)
        self.multi_cell(0, h, self._safe(text))

    # ------------------------------------------------------------------
    # Convenience
    # ------------------------------------------------------------------
    def set_company_header(
        self,
        company_name: str,
        *,
        show_page_number: bool = True,
    ) -> None:
        """ヘッダの会社名 / ページ番号表示を後付け設定."""
        self._company_name = company_name
        self._show_page_number = show_page_number
        # 総ページ数を {nb} に展開させるための alias 設定
        self.alias_nb_pages()

    def seal_placeholder(self, text: str = "[印]", *, font_size: int = 14) -> None:
        """印影プレースホルダ (右寄せ)."""
        self.set_font(self._default_font, "B", font_size)
        self._write_safe(text, w=0, h=10, ln=1, align="R")


def render_table(
    pdf: JaPDF,
    headers: Sequence[str],
    rows: Iterable[Sequence[str]],
    *,
    widths: Sequence[float] | None = None,
    header_fill: tuple[int, int, int] = (220, 220, 220),
    font_size: int = 10,
    row_height: float = 6,
) -> None:
    """共通の表ヘルパ. ``headers`` 行を強調し、``rows`` を罫線付きで書き出す.

    ``widths`` を省略すると、利用可能幅を等分割する。
    """
    headers = list(headers)
    if widths is None:
        usable = pdf.w - pdf.l_margin - pdf.r_margin
        widths = [usable / len(headers)] * len(headers)
    if len(widths) != len(headers):
        raise ValueError("widths length must match headers length")

    # ヘッダ
    pdf.set_font(pdf.default_font, "B", font_size)
    pdf.set_fill_color(*header_fill)
    for h, w in zip(headers, widths):
        pdf.cell(w, row_height + 1, pdf._safe(str(h)), border=1, align="C", fill=True)
    pdf.ln(row_height + 1)

    # 行
    pdf.set_font(pdf.default_font, "", font_size)
    for row in rows:
        cells = list(row)
        if len(cells) != len(headers):
            raise ValueError("row length must match headers length")
        for c, w in zip(cells, widths):
            pdf.cell(w, row_height, pdf._safe(str(c)), border=1)
        pdf.ln(row_height)
