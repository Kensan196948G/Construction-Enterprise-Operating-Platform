"""AIS センテンス受信・解析 stub.

NMEA0183 の AIVDM / AIVDO センテンスの最低限の解析を行う。
本実装は Type 1/2/3 (Position Report Class A) の主要フィールドのみを抽出する:
- MMSI (9 桁)
- Speed Over Ground (SOG, 0.1 ノット精度)
- Longitude / Latitude (1/10000 分単位 → 度に変換)
- Course Over Ground (COG, 0.1 度精度)
- True Heading

参考: ITU-R M.1371, https://gpsd.gitlab.io/gpsd/AIVDM.html

注: ペイロードのチェックサム検証は本 stub では行わない。
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class AISPosition:
    """AIS Type 1/2/3 から抽出した船位情報."""

    mmsi: str
    message_type: int
    longitude: float | None
    latitude: float | None
    sog_knots: float | None
    cog_deg: float | None
    heading_deg: int | None


# AIS 6bit ASCII テーブル (charcode -> 6bit binary)
def _char_to_sixbit(c: str) -> int:
    """AIS 6bit エンコード文字 → 整数 (0..63)."""
    n = ord(c)
    n -= 48
    if n > 40:
        n -= 8
    return n & 0x3F


def _payload_to_bits(payload: str) -> str:
    return "".join(f"{_char_to_sixbit(c):06b}" for c in payload)


def _bits_to_unsigned(bits: str) -> int:
    return int(bits, 2) if bits else 0


def _bits_to_signed(bits: str) -> int:
    if not bits:
        return 0
    if bits[0] == "0":
        return int(bits, 2)
    # 二の補数
    inverted = "".join("1" if b == "0" else "0" for b in bits)
    return -(int(inverted, 2) + 1)


def parse_aivdm(sentence: str) -> AISPosition:
    """AIVDM / AIVDO センテンスから AIS Position Report を解析する.

    入力例:
        !AIVDM,1,1,,B,15MgK45P3@G?fl0E`JbR0OwT0@MS,0*4E

    Raises:
        ValueError: フォーマットが不正、または対応外メッセージタイプ。
    """
    if not sentence or not sentence.startswith(("!AIVDM", "!AIVDO")):
        raise ValueError("not an AIVDM/AIVDO sentence")

    # チェックサム部 (*XX) を除去
    body = sentence.split("*", 1)[0]
    fields = body.split(",")
    if len(fields) < 7:
        raise ValueError("malformed AIVDM: insufficient fields")

    payload = fields[5]
    if not payload:
        raise ValueError("empty payload")

    bits = _payload_to_bits(payload)
    if len(bits) < 38:
        raise ValueError("payload too short")

    msg_type = _bits_to_unsigned(bits[0:6])
    if msg_type not in (1, 2, 3):
        # 本 stub は Position Report Class A のみ対応
        return AISPosition(
            mmsi=str(_bits_to_unsigned(bits[8:38])),
            message_type=msg_type,
            longitude=None,
            latitude=None,
            sog_knots=None,
            cog_deg=None,
            heading_deg=None,
        )

    mmsi = str(_bits_to_unsigned(bits[8:38]))
    sog_raw = _bits_to_unsigned(bits[50:60])
    sog = sog_raw / 10.0 if sog_raw != 1023 else None

    lon_raw = _bits_to_signed(bits[61:89])
    lat_raw = _bits_to_signed(bits[89:116])
    lon = lon_raw / 600000.0 if lon_raw != 0x6791AC0 else None
    lat = lat_raw / 600000.0 if lat_raw != 0x3412140 else None

    cog_raw = _bits_to_unsigned(bits[116:128])
    cog = cog_raw / 10.0 if cog_raw != 3600 else None

    heading_raw = _bits_to_unsigned(bits[128:137])
    heading = heading_raw if heading_raw != 511 else None

    return AISPosition(
        mmsi=mmsi,
        message_type=msg_type,
        longitude=lon,
        latitude=lat,
        sog_knots=sog,
        cog_deg=cog,
        heading_deg=heading,
    )
