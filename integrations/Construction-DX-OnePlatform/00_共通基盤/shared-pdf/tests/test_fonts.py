"""cdx_pdf.fonts のテスト.

ネットワークに依存しないテストのみ含める:
- ``get_font_dir`` が環境変数を尊重する
- ``ensure_ja_fonts(allow_download=False)`` がフォント未配置時に
  ``FontAcquisitionError`` を出す (graceful)
- ローカルにダミー TTF を置くと検出される (実体は空ファイルでも OK)
"""

from __future__ import annotations

from pathlib import Path

import pytest
from cdx_pdf.fonts import (
    FontAcquisitionError,
    ensure_ja_fonts,
    get_font_dir,
)


def test_get_font_dir_respects_env(monkeypatch, tmp_path: Path) -> None:
    custom = tmp_path / "custom_fonts"
    monkeypatch.setenv("CDX_PDF_FONT_DIR", str(custom))
    assert get_font_dir() == custom


def test_get_font_dir_default(monkeypatch) -> None:
    monkeypatch.delenv("CDX_PDF_FONT_DIR", raising=False)
    p = get_font_dir()
    assert "cdx_pdf" in str(p)


def test_ensure_ja_fonts_missing_raises(monkeypatch, tmp_path: Path) -> None:
    """フォント未配置で ``allow_download=False`` なら FontAcquisitionError."""
    monkeypatch.setenv("CDX_PDF_FONT_DIR", str(tmp_path / "nope"))
    # 既定キャッシュも空に
    monkeypatch.setenv("HOME", str(tmp_path / "fake_home"))
    monkeypatch.setenv("USERPROFILE", str(tmp_path / "fake_home"))
    with pytest.raises(FontAcquisitionError):
        ensure_ja_fonts(allow_download=False)


def test_ensure_ja_fonts_finds_local_files(monkeypatch, tmp_path: Path) -> None:
    """``CDX_PDF_FONT_DIR`` 内に IPAex*.ttf があれば検出 (空ファイルでも path 返る)."""
    font_dir = tmp_path / "fonts"
    font_dir.mkdir()
    g = font_dir / "IPAexGothic.ttf"
    m = font_dir / "IPAexMincho.ttf"
    g.write_bytes(b"\x00\x01")  # ダミー (パス検出のみのテスト)
    m.write_bytes(b"\x00\x01")
    monkeypatch.setenv("CDX_PDF_FONT_DIR", str(font_dir))
    gp, mp = ensure_ja_fonts(allow_download=False)
    assert gp == g
    assert mp == m
