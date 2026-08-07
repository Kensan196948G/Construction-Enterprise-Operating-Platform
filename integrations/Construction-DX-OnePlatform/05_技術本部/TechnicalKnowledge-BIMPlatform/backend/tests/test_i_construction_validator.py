"""i-Construction 2.0 バリデータのテスト."""
from __future__ import annotations

from tech_api.services.i_construction_validator import (
    validate_filename,
    validate_landxml_root,
    validate_submission,
)


def test_validate_submission_bim_ok() -> None:
    result = validate_submission(
        filename="bridge-section-a01.ifc",
        category="bim",
        metadata={"project_id": 1, "work_type": "bridge", "lod": "LOD300"},
    )
    assert result.valid, result.as_dict()


def test_validate_submission_bim_naming_violation_and_missing_meta() -> None:
    result = validate_submission(
        filename="橋梁 図.ifc",  # 日本語 + 空白
        category="bim",
        metadata={"project_id": 1, "work_type": "bridge"},  # lod 欠落
        strict_naming=True,
    )
    assert not result.valid
    codes = {i.code for i in result.issues}
    assert "NAMING_VIOLATION" in codes
    assert "MISSING_META" in codes


def test_validate_submission_point_cloud_extension_rejected() -> None:
    result = validate_submission(
        filename="survey.txt",
        category="point_cloud",
        metadata={"project_id": 1, "crs": "EPSG:6677"},
    )
    assert not result.valid
    codes = {i.code for i in result.issues}
    assert "EXTENSION_NOT_ALLOWED" in codes


def test_validate_filename_strict_vs_non_strict() -> None:
    strict = validate_filename("レポート.pdf", strict=True)
    relaxed = validate_filename("レポート.pdf", strict=False)
    assert not strict.valid
    assert relaxed.valid
    assert any(i.code == "NAMING_WARNING" for i in relaxed.issues)


def test_validate_landxml_root_missing() -> None:
    r = validate_landxml_root("<?xml version='1.0'?><Other/>")
    assert not r.valid
    assert any(i.code == "LANDXML_ROOT_MISSING" for i in r.issues)
