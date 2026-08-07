"""IPAex フォントの取得・キャッシュ・登録ヘルパ.

IPAex (IPAexGothic.ttf / IPAexMincho.ttf) は IPA フォントライセンス v1.1
(再配布可) でリリースされている。本モジュールは以下の優先順位でフォントを
解決する:

1. 環境変数 ``CDX_PDF_FONT_DIR`` で指定されたディレクトリ
2. ユーザー キャッシュ ディレクトリ ``~/.cache/cdx_pdf/fonts``
3. (上記に無い場合) IPA 公式 ZIP をダウンロードして 2. に展開

オフライン環境やダウンロード失敗時は ``FontAcquisitionError`` を送出する。
呼び出し側 (``JaPDF``) はこの例外をキャッチして Helvetica にフォールバック
する責務をもつ。
"""

from __future__ import annotations

import io
import logging
import os
import zipfile
from pathlib import Path

log = logging.getLogger(__name__)

# IPA 公式配布 (https://moji.or.jp/ipafont/ipaex00401/)
IPAEX_ZIP_URL = "https://moji.or.jp/wp-content/ipafont/IPAexfont/IPAexfont00401.zip"

GOTHIC_FILENAME = "ipaexg.ttf"  # IPAex Gothic
MINCHO_FILENAME = "ipaexm.ttf"  # IPAex Mincho

# パッケージ管理者がローカルに事前配置するための代替ファイル名
_ALT_GOTHIC = ("IPAexGothic.ttf", "ipaexg.ttf")
_ALT_MINCHO = ("IPAexMincho.ttf", "ipaexm.ttf")


class FontAcquisitionError(RuntimeError):
    """IPAex フォントの取得 (ローカル探索もネットワーク取得も) に失敗."""


def _default_cache_dir() -> Path:
    """``~/.cache/cdx_pdf/fonts``. ホームディレクトリが取れない環境は ``/tmp`` 配下."""
    home = Path(os.path.expanduser("~"))
    if not home.exists():
        home = Path(os.environ.get("TMPDIR", "/tmp"))
    return home / ".cache" / "cdx_pdf" / "fonts"


def get_font_dir() -> Path:
    """環境変数 / 既定キャッシュ のうち存在するパスを返す.

    存在しない場合でも (これから作る場合のために) 既定キャッシュ パスを返す。
    """
    env = os.environ.get("CDX_PDF_FONT_DIR")
    if env:
        return Path(env)
    return _default_cache_dir()


def _find_in_dir(d: Path, candidates: tuple[str, ...]) -> Path | None:
    if not d.exists():
        return None
    for name in candidates:
        p = d / name
        if p.exists() and p.stat().st_size > 0:
            return p
    return None


def _download_ipaex_zip(timeout: float = 15.0) -> bytes:
    """IPA 公式 ZIP をダウンロード. requests が無い/失敗時は例外."""
    try:
        import requests  # type: ignore[import-not-found]
    except Exception as e:  # pragma: no cover - requests 必須依存だが防御的
        raise FontAcquisitionError(f"requests not available: {e}") from e
    try:
        resp = requests.get(IPAEX_ZIP_URL, timeout=timeout)
        resp.raise_for_status()
        return resp.content
    except Exception as e:
        raise FontAcquisitionError(f"failed to download IPAex zip: {e}") from e


def _extract_ttfs(zip_bytes: bytes, dest: Path) -> tuple[Path, Path]:
    """ZIP から ipaexg.ttf / ipaexm.ttf を ``dest`` に取り出して書き込む."""
    dest.mkdir(parents=True, exist_ok=True)
    gothic_path: Path | None = None
    mincho_path: Path | None = None
    try:
        with zipfile.ZipFile(io.BytesIO(zip_bytes)) as zf:
            for name in zf.namelist():
                base = Path(name).name.lower()
                if base == GOTHIC_FILENAME:
                    gothic_path = dest / GOTHIC_FILENAME
                    gothic_path.write_bytes(zf.read(name))
                elif base == MINCHO_FILENAME:
                    mincho_path = dest / MINCHO_FILENAME
                    mincho_path.write_bytes(zf.read(name))
    except zipfile.BadZipFile as e:
        raise FontAcquisitionError(f"downloaded payload is not a zip: {e}") from e
    if gothic_path is None or mincho_path is None:
        raise FontAcquisitionError("IPAex ttf files not found in archive")
    return gothic_path, mincho_path


def ensure_ja_fonts(*, allow_download: bool = True) -> tuple[Path, Path]:
    """``(gothic_path, mincho_path)`` を返す.

    優先順位:
      1. ``CDX_PDF_FONT_DIR`` 配下に IPAexGothic.ttf / IPAexMincho.ttf
         (または ipaexg.ttf / ipaexm.ttf) があれば利用
      2. 既定キャッシュ ``~/.cache/cdx_pdf/fonts`` に同上ファイルがあれば利用
      3. ``allow_download=True`` ならネットワーク取得を試み 2. へ保存

    すべて失敗した場合は :class:`FontAcquisitionError`.
    """
    search_dirs: list[Path] = []
    env_dir = os.environ.get("CDX_PDF_FONT_DIR")
    if env_dir:
        search_dirs.append(Path(env_dir))
    cache_dir = _default_cache_dir()
    search_dirs.append(cache_dir)

    for d in search_dirs:
        g = _find_in_dir(d, _ALT_GOTHIC)
        m = _find_in_dir(d, _ALT_MINCHO)
        if g and m:
            log.debug("IPAex fonts found in %s", d)
            return g, m

    if not allow_download:
        raise FontAcquisitionError(
            "IPAex fonts not found locally and downloads are disabled"
        )

    log.info("IPAex fonts not cached; attempting download from %s", IPAEX_ZIP_URL)
    blob = _download_ipaex_zip()
    return _extract_ttfs(blob, cache_dir)


def register_ja_fonts(pdf, *, allow_download: bool = True) -> bool:
    """fpdf2 ``FPDF`` インスタンスに gothic / mincho を登録する.

    成功時 ``True``、フォント取得失敗時は ``False`` を返し pdf は変更しない。
    例外送出はしない (呼び出し側の fallback を妨げない)。
    """
    try:
        gothic, mincho = ensure_ja_fonts(allow_download=allow_download)
    except FontAcquisitionError as e:
        log.warning("Japanese font registration skipped: %s", e)
        return False
    # fpdf2 >= 2.5 は uni=True 不要 (常に Unicode). 旧 API も互換のため対応.
    try:
        pdf.add_font("gothic", style="", fname=str(gothic))
        pdf.add_font("gothic", style="B", fname=str(gothic))
        pdf.add_font("mincho", style="", fname=str(mincho))
        pdf.add_font("mincho", style="B", fname=str(mincho))
        return True
    except TypeError:
        try:
            pdf.add_font("gothic", style="", fname=str(gothic), uni=True)
            pdf.add_font("gothic", style="B", fname=str(gothic), uni=True)
            pdf.add_font("mincho", style="", fname=str(mincho), uni=True)
            pdf.add_font("mincho", style="B", fname=str(mincho), uni=True)
            return True
        except Exception as e:  # pragma: no cover
            log.warning("add_font failed: %s", e)
            return False
    except Exception as e:  # pragma: no cover
        log.warning("add_font failed: %s", e)
        return False
