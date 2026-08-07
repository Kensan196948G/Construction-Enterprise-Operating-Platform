"""quotation_pdf 単体テスト."""

from __future__ import annotations

import hashlib
from datetime import date
from decimal import Decimal
from pathlib import Path

from crm_api.services.quotation_pdf import QuotationPdfInput, render_quotation_pdf


def _sample_payload() -> QuotationPdfInput:
    return QuotationPdfInput(
        quotation_number="Q-2026-0001",
        version=1,
        title="○○ビル新築工事",
        client_name="サンプル建設様",
        total_amount=Decimal("11000000"),
        subtotal_amount=Decimal("10000000"),
        tax_amount=Decimal("1000000"),
        issue_date=date(2026, 5, 22),
        valid_until=date(2026, 6, 22),
        items=[
            ("基礎工事", Decimal("1"), Decimal("5000000"), Decimal("5000000")),
            ("躯体工事", Decimal("1"), Decimal("5000000"), Decimal("5000000")),
        ],
        bank_info="○○銀行 本店 普通 1234567",
    )


def test_render_quotation_pdf_creates_file_and_returns_sha256(tmp_path: Path) -> None:
    """PDF 生成: ファイル作成 + sha256 が 64 桁 hex で返る."""
    result = render_quotation_pdf(_sample_payload(), output_dir=tmp_path)
    p = Path(result.file_path)
    assert p.exists()
    assert p.stat().st_size > 0
    assert result.size_bytes == p.stat().st_size
    assert len(result.sha256) == 64
    # 16進
    int(result.sha256, 16)


def test_render_quotation_pdf_sha256_matches_file_bytes(tmp_path: Path) -> None:
    """SHA-256 検証: ファイルバイト列の hash と返却値が一致 (電帳法ハッシュ整合)."""
    result = render_quotation_pdf(_sample_payload(), output_dir=tmp_path)
    blob = Path(result.file_path).read_bytes()
    assert hashlib.sha256(blob).hexdigest() == result.sha256
    # fpdf2 が使われたなら PDF ヘッダで始まる。fallback (テキスト) の場合は QUOTATION で始まる
    assert blob.startswith(b"%PDF") or blob.startswith(b"QUOTATION")
