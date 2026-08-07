"""contract_check.py の AST ベース抽出ロジックを検証するユニットテスト.

Loop #10 で tdd_required 警告 (mocks/contract_check.py) を解消するため追加。
"""

from __future__ import annotations

import textwrap
from pathlib import Path

import contract_check
import pytest
from contract_check import DeptResult, _collect_api_field_names, _parse_mocks_kpi

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture()
def fake_mocks_main(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    """contract_check.MOCKS_FILE を一時ファイルに差し替えるフィクスチャ."""

    main_py = tmp_path / "main.py"
    main_py.write_text(
        textwrap.dedent("""
            from fastapi import APIRouter
            router = APIRouter()

            @router.get("/api/v1/exec/stats")
            def exec_stats():
                return {
                    "dept": "exec",
                    "kpi": {
                        "revenue": 100,
                        "operating_profit": 20,
                    },
                }

            @router.get("/api/v1/safety/stats")
            def safety_stats():
                return {
                    "dept": "safety",
                    "kpi": {
                        "frequency_rate": 0.5,
                        "severity_rate": 0.05,
                    },
                }

            # path が /stats でないものは無視される
            @router.get("/api/v1/itsm/incidents")
            def itsm_incidents():
                return {"dept": "itsm", "kpi": {"open_tickets": 3}}
            """),
        encoding="utf-8",
    )
    monkeypatch.setattr(contract_check, "MOCKS_FILE", main_py)
    return main_py


# ---------------------------------------------------------------------------
# _parse_mocks_kpi
# ---------------------------------------------------------------------------


def test_parse_mocks_kpi_extracts_only_stats_endpoints(fake_mocks_main: Path) -> None:
    result = _parse_mocks_kpi()

    assert set(result.keys()) == {
        "exec",
        "safety",
    }, "/stats 以外のエンドポイントは抽出対象外"
    assert result["exec"] == ["revenue", "operating_profit"]
    assert result["safety"] == ["frequency_rate", "severity_rate"]


def test_parse_mocks_kpi_returns_empty_on_no_match(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    empty = tmp_path / "main.py"
    empty.write_text("# no fastapi routes here\n", encoding="utf-8")
    monkeypatch.setattr(contract_check, "MOCKS_FILE", empty)

    assert _parse_mocks_kpi() == {}


# ---------------------------------------------------------------------------
# _collect_api_field_names
# ---------------------------------------------------------------------------


def test_collect_api_field_names_extracts_annassign_args_and_dict_keys(
    tmp_path: Path,
) -> None:
    routes = tmp_path / "routes"
    routes.mkdir()
    (routes / "dashboard.py").write_text(
        textwrap.dedent("""
            from pydantic import BaseModel

            class ExecStats(BaseModel):
                revenue: int
                operating_profit: int

            def render(dept: str, kpi: dict) -> dict:
                return {"dept": dept, "kpi": kpi, "extra_key": 1}
            """),
        encoding="utf-8",
    )

    names = _collect_api_field_names(routes)

    # AnnAssign フィールド名
    assert "revenue" in names
    assert "operating_profit" in names
    # 関数引数
    assert "dept" in names
    assert "kpi" in names
    # dict literal キー
    assert "extra_key" in names


def test_collect_api_field_names_returns_empty_on_missing_dir(tmp_path: Path) -> None:
    missing = tmp_path / "nonexistent"
    assert _collect_api_field_names(missing) == set()


def test_collect_api_field_names_skips_syntax_errors(tmp_path: Path) -> None:
    routes = tmp_path / "routes"
    routes.mkdir()
    (routes / "broken.py").write_text("def oops(:\n", encoding="utf-8")
    (routes / "ok.py").write_text("class Foo:\n    bar: int = 1\n", encoding="utf-8")

    names = _collect_api_field_names(routes)
    assert names == {
        "bar"
    }, "broken.py は SyntaxError でスキップされ ok.py のみ抽出される"


# ---------------------------------------------------------------------------
# DeptResult.coverage
# ---------------------------------------------------------------------------


def test_dept_result_coverage_zero_when_no_mocks_fields() -> None:
    r = DeptResult(dept="exec")
    assert r.coverage == 0.0


def test_dept_result_coverage_full_match() -> None:
    r = DeptResult(
        dept="exec",
        mocks_kpi_fields=["a", "b", "c"],
        matched=["a", "b", "c"],
    )
    assert r.coverage == 1.0


def test_dept_result_coverage_partial_match() -> None:
    r = DeptResult(
        dept="exec",
        mocks_kpi_fields=["a", "b", "c", "d"],
        matched=["a", "b"],
        unmatched=["c", "d"],
    )
    assert r.coverage == 0.5
