"""Alembic 環境設定。

- `DBSettings` から sync DSN (psycopg) を取得して接続する。
- すべてのモデルを import して ``Base.metadata`` にバインドする。
- PostGIS が管理する ``spatial_ref_sys`` 等のシステムテーブルは
  オートジェネレーション対象から除外する。
"""

from __future__ import annotations

from logging.config import fileConfig

from alembic import context
from cdx_db.base import Base
from cdx_db.config import get_db_settings

# noqa: F401 — モデルを import することで Base.metadata に登録される
from cdx_db.models import (  # noqa: F401
    Branch,
    ClientOrg,
    Department,
    Employee,
    Material,
    Project,
)
from sqlalchemy import engine_from_config, pool

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# DBSettings から実 DSN を流し込む
settings = get_db_settings()
config.set_main_option("sqlalchemy.url", settings.sync_dsn)

target_metadata = Base.metadata

# PostGIS / TimescaleDB が裏で作るオブジェクトを除外する
_EXCLUDED_TABLES = {
    "spatial_ref_sys",
    "geography_columns",
    "geometry_columns",
    "raster_columns",
    "raster_overviews",
}


def _include_object(obj, name, type_, reflected, compare_to):  # noqa: ANN001
    if type_ == "table" and name in _EXCLUDED_TABLES:
        return False
    if type_ == "schema" and name in {"tiger", "tiger_data", "topology", "_timescaledb_internal"}:
        return False
    return True


def run_migrations_offline() -> None:
    """オフラインモード (SQL 出力のみ)。"""
    context.configure(
        url=config.get_main_option("sqlalchemy.url"),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_object=_include_object,
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """オンラインモード (実 DB に接続)。"""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        future=True,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            include_object=_include_object,
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
