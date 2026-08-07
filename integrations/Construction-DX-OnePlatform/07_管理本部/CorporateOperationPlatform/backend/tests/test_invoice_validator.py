"""適格請求書発行事業者番号 (T + 13 桁) 形式検証."""
from __future__ import annotations

import pytest
from corp_api.services.invoice_validator import (
    InvalidInvoiceRegistrationNo,
    assert_valid_format,
    validate_format,
)


def test_valid_registration_number() -> None:
    assert validate_format("T1234567890123") is True


def test_invalid_when_lowercase_t_or_wrong_digits() -> None:
    assert validate_format("t1234567890123") is False  # 小文字
    assert validate_format("T123456789012") is False   # 12 桁
    assert validate_format("T12345678901234") is False  # 14 桁
    assert validate_format("T123456789012A") is False   # 数字以外
    assert validate_format("") is False
    assert validate_format("1234567890123") is False


def test_assert_valid_raises_for_bad_format() -> None:
    with pytest.raises(InvalidInvoiceRegistrationNo):
        assert_valid_format("INVALID")
