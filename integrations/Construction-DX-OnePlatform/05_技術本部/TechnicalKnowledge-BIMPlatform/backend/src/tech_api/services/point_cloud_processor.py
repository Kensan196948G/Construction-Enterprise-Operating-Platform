"""LAS / LAZ 点群ファイルのメタ抽出 stub.

LAS Public Header (1.2/1.4) の主要フィールドのみを読み取り、点数とバウンディングボックスを返す。
LAZ (圧縮) は ``laspy`` / ``lazrs`` 等の依存が必要なので、本骨格では LAS のみ対応。
"""
from __future__ import annotations

import struct
from dataclasses import dataclass
from typing import IO

LAS_SIGNATURE = b"LASF"


@dataclass
class PointCloudSummary:
    signature: str
    version: str
    point_count: int
    min_x: float
    min_y: float
    min_z: float
    max_x: float
    max_y: float
    max_z: float

    def as_dict(self) -> dict[str, object]:
        return {
            "signature": self.signature,
            "version": self.version,
            "point_count": self.point_count,
            "bbox": {
                "min_x": self.min_x,
                "min_y": self.min_y,
                "min_z": self.min_z,
                "max_x": self.max_x,
                "max_y": self.max_y,
                "max_z": self.max_z,
            },
        }


class PointCloudParseError(ValueError):
    """LAS 解析エラー."""


def parse_las_header(stream: IO[bytes]) -> PointCloudSummary:
    """LAS public header (~227 byte) を読み取り要約を返す."""
    header = stream.read(375)
    if len(header) < 227:
        raise PointCloudParseError("LAS header too short")
    if header[0:4] != LAS_SIGNATURE:
        raise PointCloudParseError("not a LAS file (missing LASF signature)")

    version_major = header[24]
    version_minor = header[25]
    version = f"{version_major}.{version_minor}"

    # Legacy Number of point records (offset 107, uint32) — LAS 1.4 以前で有効
    legacy_pt_count = struct.unpack_from("<I", header, 107)[0]

    # Scale & offset (24 bytes from offset 131)
    x_scale, y_scale, z_scale = struct.unpack_from("<ddd", header, 131)
    x_off, y_off, z_off = struct.unpack_from("<ddd", header, 155)
    max_x, min_x, max_y, min_y, max_z, min_z = struct.unpack_from("<dddddd", header, 179)
    _ = (x_scale, y_scale, z_scale, x_off, y_off, z_off)

    point_count = legacy_pt_count
    if version_major == 1 and version_minor >= 4 and len(header) >= 247 + 8:
        # LAS 1.4 では offset 247 から uint64
        point_count = struct.unpack_from("<Q", header, 247)[0] or legacy_pt_count

    return PointCloudSummary(
        signature=LAS_SIGNATURE.decode(),
        version=version,
        point_count=point_count,
        min_x=min_x,
        min_y=min_y,
        min_z=min_z,
        max_x=max_x,
        max_y=max_y,
        max_z=max_z,
    )
