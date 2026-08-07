"""i-Construction 2.0 提出データ形式バリデータ.

国土交通省「i-Construction 2.0 推進方策」「電子納品要領」「3次元計測技術を用いた出来形管理要領」
等を参考にした簡易チェッカ。完全準拠ではなく、骨格段階の入口チェックとして利用する。

チェック項目 (代表):
- ファイル名規約: ASCII 英数とハイフン/アンダースコアのみ。日本語/空白は警告。
- 拡張子ホワイトリスト: 工種別 (BIM: ifc, 点群: las/laz, 図面: dwg/dxf/pdf, 出来形: xml)
- 必須メタ: project_id, work_type, lod (BIM の場合), crs (CIM の場合)
- XML スキーマ系: LandXML / 出来形管理 XML はルート要素の存在のみ確認
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import PurePosixPath

_VALID_NAME = re.compile(r"^[A-Za-z0-9._\-]+$")
_LOD_RE = re.compile(r"^LOD(100|200|300|400|500)$")

ALLOWED_EXTENSIONS: dict[str, set[str]] = {
    "bim": {".ifc", ".ifczip", ".bcf"},
    "point_cloud": {".las", ".laz", ".ply"},
    "drawing": {".dwg", ".dxf", ".pdf"},
    "ortho": {".tif", ".tiff", ".geotiff"},
    "land_xml": {".xml"},
    "document": {".pdf", ".docx", ".xlsx", ".md"},
}

REQUIRED_META: dict[str, set[str]] = {
    "bim": {"project_id", "work_type", "lod"},
    "point_cloud": {"project_id", "crs"},
    "drawing": {"project_id"},
    "land_xml": {"project_id"},
}


@dataclass
class ValidationIssue:
    severity: str  # "error" / "warning"
    code: str
    message: str


@dataclass
class ValidationResult:
    valid: bool = True
    issues: list[ValidationIssue] = field(default_factory=list)

    def add(self, severity: str, code: str, message: str) -> None:
        self.issues.append(ValidationIssue(severity, code, message))
        if severity == "error":
            self.valid = False

    def as_dict(self) -> dict[str, object]:
        return {
            "valid": self.valid,
            "issues": [
                {"severity": i.severity, "code": i.code, "message": i.message}
                for i in self.issues
            ],
        }


def validate_filename(filename: str, strict: bool = True) -> ValidationResult:
    """ファイル名のみを検証する."""
    result = ValidationResult()
    name = PurePosixPath(filename).name
    if not name:
        result.add("error", "FILE_EMPTY", "filename is empty")
        return result
    if strict and not _VALID_NAME.match(name):
        result.add(
            "error",
            "NAMING_VIOLATION",
            f"file name '{name}' contains non-ASCII or unsupported characters",
        )
    elif not _VALID_NAME.match(name):
        result.add(
            "warning",
            "NAMING_WARNING",
            f"file name '{name}' may not be portable across systems",
        )
    return result


def validate_submission(
    *,
    filename: str,
    category: str,
    metadata: dict[str, object] | None = None,
    strict_naming: bool = True,
) -> ValidationResult:
    """i-Construction 提出データの総合バリデーション."""
    metadata = metadata or {}
    result = validate_filename(filename, strict=strict_naming)

    # 拡張子チェック
    suffix = PurePosixPath(filename).suffix.lower()
    allowed = ALLOWED_EXTENSIONS.get(category)
    if allowed is None:
        result.add("error", "UNKNOWN_CATEGORY", f"unknown category: {category}")
    elif suffix not in allowed:
        result.add(
            "error",
            "EXTENSION_NOT_ALLOWED",
            f"extension '{suffix}' is not allowed for category '{category}' "
            f"(allowed: {sorted(allowed)})",
        )

    # 必須メタ
    required = REQUIRED_META.get(category, set())
    for key in required:
        if key not in metadata or metadata[key] in (None, ""):
            result.add("error", "MISSING_META", f"required metadata '{key}' is missing")

    # LOD コード
    if category == "bim" and "lod" in metadata:
        lod = str(metadata["lod"])
        if not _LOD_RE.match(lod):
            result.add(
                "error",
                "INVALID_LOD",
                f"LOD '{lod}' must be one of LOD100/200/300/400/500",
            )

    return result


def validate_landxml_root(xml_text: str) -> ValidationResult:
    """LandXML のルート要素が存在するかを軽く確認 (本格スキーマ検証は xmlschema 等で別途)."""
    result = ValidationResult()
    head = xml_text.lstrip()[:4096]
    if "<LandXML" not in head:
        result.add(
            "error",
            "LANDXML_ROOT_MISSING",
            "root element <LandXML ...> not found in first 4KB",
        )
    return result
