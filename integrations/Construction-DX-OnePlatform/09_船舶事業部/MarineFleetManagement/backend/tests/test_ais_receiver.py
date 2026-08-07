"""AIVDM パーサテスト.

サンプル sentence は AIS 公開資料 (gpsd / IALA 教材) で広く使われる Type 1 / 3 の例。
"""
from __future__ import annotations

import pytest

from marine_api.services.ais_receiver import parse_aivdm


def test_parse_type1_position_report() -> None:
    """Type 1 Position Report A (Class A) サンプル.

    sample: 標準的な AIS Type 1 例 (gpsd ドキュメント由来).
    MMSI 366053209 など、Type 1 の典型ペイロード。
    """
    sentence = "!AIVDM,1,1,,A,13aGt0PP00Oh<:tEEHO0?wvL2HHU,0*39"
    pos = parse_aivdm(sentence)
    assert pos.message_type == 1
    # MMSI は 9 桁の数値文字列
    assert pos.mmsi.isdigit()
    assert len(pos.mmsi) <= 9
    # 緯度経度は妥当な範囲
    if pos.latitude is not None:
        assert -90.0 <= pos.latitude <= 90.0
    if pos.longitude is not None:
        assert -180.0 <= pos.longitude <= 180.0


def test_parse_type3_position_report() -> None:
    """Type 3 (Position Report Class A - Response to interrogation) サンプル."""
    sentence = "!AIVDM,1,1,,B,35MC>W@01g0`q5BEhEi`OwwR2<11,0*3F"
    pos = parse_aivdm(sentence)
    assert pos.message_type == 3
    assert pos.mmsi.isdigit()


def test_invalid_sentence_raises() -> None:
    with pytest.raises(ValueError):
        parse_aivdm("$GPGGA,123519,4807.038,N,01131.000,E,1,08,0.9,545.4,M,46.9,M,,*47")


def test_empty_payload_raises() -> None:
    with pytest.raises(ValueError):
        parse_aivdm("!AIVDM,1,1,,A,,0*26")
