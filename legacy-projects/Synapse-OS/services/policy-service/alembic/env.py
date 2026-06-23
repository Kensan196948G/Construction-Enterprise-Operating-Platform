"""Alembic environment configuration for policy-service."""
from __future__ import annotations

import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

# Alembic Config object, providing access to values in alembic.ini
config = context.config

# Interpret the config file for Python logging unless already configured
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Resolve DB URL: DATABASE_URL env var takes priority, then SQLITE_DB,
# then alembic.ini default (sqlite:///:memory: — offline/dev use only)
_env_db_url = os.environ.get("DATABASE_URL", "").strip()
if not _env_db_url:
    _sqlite_raw = os.environ.get("SQLITE_DB", "").strip()
    if _sqlite_raw:
        _env_db_url = (
            _sqlite_raw if _sqlite_raw.startswith("sqlite") else f"sqlite:///{_sqlite_raw}"
        )

if _env_db_url:
    # Escape % for ConfigParser interpolation (passwords may contain %-encoded chars)
    config.set_main_option("sqlalchemy.url", _env_db_url.replace("%", "%%"))

# Import metadata from the ORM models so Alembic can autogenerate migrations
from policy_app.storage.database import Base  # noqa: E402
import policy_app.storage.orm_models  # noqa: E402, F401 — register models

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL and not an Engine.
    By skipping the Engine creation we don't even need a DBAPI to be available.
    Calls to context.execute() emit the given string to the script output.
    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=True,  # required for SQLite ALTER TABLE support
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine and associate a connection
    with the context.
    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=True,  # required for SQLite ALTER TABLE support
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
