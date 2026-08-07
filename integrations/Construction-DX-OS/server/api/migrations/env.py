"""Alembic migration environment for cdx-server."""

from __future__ import annotations

import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

# Import models so Alembic autogenerate can detect them.
from cdx_server.models import Base

config = context.config

# Interpolate DATABASE_URL from environment if not set in alembic.ini.
# Alembic uses a synchronous engine, so asyncpg/aiosqlite drivers are
# incompatible.  Convert async driver names to their sync equivalents so
# developers can keep DATABASE_URL pointing at the asyncpg runtime URL and
# still run `alembic upgrade head` without overriding the variable.
_ASYNC_TO_SYNC = {
    "postgresql+asyncpg": "postgresql+psycopg2",
    "sqlite+aiosqlite": "sqlite",
}

database_url = os.environ.get("DATABASE_URL")
if database_url:
    for async_prefix, sync_prefix in _ASYNC_TO_SYNC.items():
        if database_url.startswith(async_prefix):
            database_url = sync_prefix + database_url[len(async_prefix) :]
            break
    config.set_main_option("sqlalchemy.url", database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode (no DB connection — emit SQL to stdout)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode (live DB connection)."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
