"""Construction DX One Platform — 全サブシステム統合 alembic env.

本 env は **本番統合配備** 用途を想定した集約点である。

設計方針
========
- 各サブプロジェクトの SQLAlchemy ``Base`` は ``cdx_db.base.Base`` を共有しているため、
  各サブプロジェクトの ``models`` パッケージを import するだけで
  ``Base.metadata`` に全テーブルが集約される。
- 各サブプロジェクト固有の alembic migration は ``versions/`` に **直接置かない**。
  代わりに ``alembic_global/migrate_log/`` に取り込み履歴 (採番表) を残し、
  実マイグレーションは subsystem 毎の alembic を順番に呼び出す
  ``scripts/migrate-all.ps1`` で適用する。
- 本 env が直接 ``upgrade head`` を呼ばれた場合、import 済み metadata から
  ``create_all`` 相当の autogenerate を生成する用途 (新規環境立ち上げ用) に利用する。

import 解決の注意
=================
- 各サブプロジェクトを editable install してから実行することを前提とする。
- import が失敗するサブプロジェクトはスキップ (CI / 本番で順次有効化)。
"""

from __future__ import annotations

import importlib
import logging
import os

from alembic import context
from sqlalchemy import engine_from_config, pool

logger = logging.getLogger("alembic.env")

# ---------------------------------------------------------------------------
# 1) 共有 Base を取得 (全サブシステムは同一の Base を使う前提)
# ---------------------------------------------------------------------------
try:
    from cdx_db.base import Base  # type: ignore
    from cdx_db.config import get_db_settings  # type: ignore
    from cdx_db.models import *  # noqa: F401,F403
    _SHARED_OK = True
except Exception as exc:  # pragma: no cover - 環境依存
    logger.warning("cdx_db import failed: %s", exc)
    Base = None  # type: ignore[assignment]
    get_db_settings = None  # type: ignore[assignment]
    _SHARED_OK = False


# ---------------------------------------------------------------------------
# 2) 各サブシステムの models を import して Base.metadata に集約
# ---------------------------------------------------------------------------
_SUBSYSTEMS = (
    ("exec_api.models", "01_経営企画"),
    ("crm_api.models", "02_営業"),
    ("sol_api.models", "03_ソリューション営業"),
    ("site_api.models", "04_施工"),
    ("tech_api.models", "05_技術"),
    ("sq_api.models", "06_安全品質"),
    ("corp_api.models", "07_管理"),
    ("proc_api.models", "08_購買"),
    ("marine_api.models", "09_船舶"),
    ("itsm_api.models", "10_ITSM"),
    ("data_api.models", "11_統合データ基盤"),
)

_imported: list[str] = []
_skipped: list[tuple[str, str]] = []

for module_name, label in _SUBSYSTEMS:
    try:
        importlib.import_module(module_name)
        _imported.append(f"{label} ({module_name})")
    except Exception as exc:  # noqa: BLE001
        _skipped.append((f"{label} ({module_name})", str(exc)))

if _imported:
    logger.info("alembic_global: imported = %s", ", ".join(_imported))
for name, err in _skipped:
    logger.warning("alembic_global: skipped %s — %s", name, err)


# ---------------------------------------------------------------------------
# 3) alembic 設定
# ---------------------------------------------------------------------------
config = context.config

if config.config_file_name is not None:
    from logging.config import fileConfig  # local import to avoid side effects

    fileConfig(config.config_file_name)


def _resolve_url() -> str:
    """DATABASE_URL > cdx_db settings > placeholder の順で解決する。"""
    env_url = os.environ.get("DATABASE_URL")
    if env_url:
        return env_url
    if get_db_settings is not None:
        try:
            return get_db_settings().sync_dsn
        except Exception as exc:  # noqa: BLE001
            logger.warning("get_db_settings() failed: %s", exc)
    return config.get_main_option("sqlalchemy.url") or ""


config.set_main_option("sqlalchemy.url", _resolve_url())

target_metadata = Base.metadata if _SHARED_OK and Base is not None else None

_EXCLUDED_TABLES = {
    "spatial_ref_sys",
    "geography_columns",
    "geometry_columns",
    "raster_columns",
    "raster_overviews",
}


def _include_object(obj, name, type_, reflected, compare_to):  # noqa: ANN001, D401
    if type_ == "table" and name in _EXCLUDED_TABLES:
        return False
    if type_ == "schema" and name in {"tiger", "tiger_data", "topology", "_timescaledb_internal"}:
        return False
    return True


def run_migrations_offline() -> None:
    context.configure(
        url=config.get_main_option("sqlalchemy.url"),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_object=_include_object,
        compare_type=True,
        version_table="alembic_version_global",
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
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
            version_table="alembic_version_global",
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
