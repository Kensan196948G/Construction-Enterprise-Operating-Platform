"""モデル定義の smoke test。

DB に接続せず、SQLAlchemy のメタデータレベルで以下を検証する:
- すべてのモデルが ``Base.metadata`` に登録されていること
- 必須カラム (id, 共通監査カラム) が存在すること
- 主要な外部キーが宣言されていること
- ユニーク制約とインデックスが存在すること
- インスタンス化が例外なく行えること
"""

from __future__ import annotations

from decimal import Decimal

import pytest
from cdx_db import (
    Base,
    Branch,
    ClientOrg,
    Department,
    Employee,
    Material,
    Project,
)

COMMON_COLS = {"id", "created_at", "updated_at", "deleted_at", "created_by", "updated_by"}

EXPECTED_TABLES = {
    "t_department",
    "t_branch",
    "t_employee",
    "t_client_org",
    "t_project",
    "t_material",
}


def test_metadata_contains_all_tables() -> None:
    table_names = set(Base.metadata.tables.keys())
    missing = EXPECTED_TABLES - table_names
    assert not missing, f"未登録テーブル: {missing}"


@pytest.mark.parametrize("model", [Department, Branch, Employee, ClientOrg, Project, Material])
def test_common_columns_present(model) -> None:
    cols = {c.name for c in model.__table__.columns}
    assert COMMON_COLS.issubset(cols), (
        f"{model.__tablename__} に共通カラムが不足: {COMMON_COLS - cols}"
    )


@pytest.mark.parametrize(
    "model,code_col",
    [
        (Department, "dept_code"),
        (Branch, "branch_code"),
        (Employee, "employee_code"),
        (ClientOrg, "client_code"),
        (Project, "project_code"),
        (Material, "material_code"),
    ],
)
def test_code_column_is_unique(model, code_col: str) -> None:
    col = model.__table__.columns[code_col]
    assert col.unique is True, f"{model.__tablename__}.{code_col} は unique であるべき"


def test_branch_foreign_keys() -> None:
    fks = {fk.target_fullname for fk in Branch.__table__.foreign_keys}
    assert "t_department.id" in fks


def test_employee_foreign_keys() -> None:
    fks = {fk.target_fullname for fk in Employee.__table__.foreign_keys}
    assert {"t_department.id", "t_branch.id"}.issubset(fks)


def test_project_foreign_keys() -> None:
    fks = {fk.target_fullname for fk in Project.__table__.foreign_keys}
    assert {"t_client_org.id", "t_department.id", "t_branch.id"}.issubset(fks)


def test_foreign_keys_are_restrict() -> None:
    for model in (Branch, Employee, Project, Department):
        for fk in model.__table__.foreign_keys:
            assert fk.ondelete == "RESTRICT", (
                f"{model.__tablename__}.{fk.parent.name} ondelete は RESTRICT 必須"
            )


def test_geometry_columns_present() -> None:
    assert "geom" in Branch.__table__.columns
    assert "geom" in Project.__table__.columns


def test_instantiate_models() -> None:
    """各モデルが例外なくインスタンス化できること。"""
    Department(dept_code="D999", dept_name="テスト部門")
    Branch(branch_code="B999", branch_name="テスト支店")
    Employee(employee_code="E999", name="テスト 太郎")
    ClientOrg(client_code="C999", client_name="テスト発注者", client_type="private")
    Project(
        project_code="P999",
        project_name="テスト工事",
        contract_amount=Decimal("1000000"),
        status="planned",
    )
    Material(
        material_code="M999",
        name="テスト資材",
        unit="個",
        unit_price=Decimal("100"),
    )
