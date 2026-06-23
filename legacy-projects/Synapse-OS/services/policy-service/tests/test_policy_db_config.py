"""Tests for database URL resolution logic (G3 — DATABASE_URL support)."""
from __future__ import annotations

from sqlalchemy.pool import StaticPool

from policy_app.storage.database import _resolve_db_config


def test_database_url_takes_priority() -> None:
    url, kwargs = _resolve_db_config(
        database_url="postgresql://user:pass@localhost:5432/synapse",
        sqlite_raw="mydb.sqlite",
    )
    assert url == "postgresql://user:pass@localhost:5432/synapse"
    assert kwargs == {}


def test_database_url_no_extra_connect_args() -> None:
    url, kwargs = _resolve_db_config(database_url="postgresql://localhost/test")
    assert "connect_args" not in kwargs
    assert "poolclass" not in kwargs


def test_sqlite_db_fallback_when_no_database_url() -> None:
    url, kwargs = _resolve_db_config(database_url="", sqlite_raw="mydb.sqlite")
    assert url == "sqlite:///mydb.sqlite"
    assert kwargs["connect_args"] == {"check_same_thread": False}


def test_sqlite_db_with_full_url() -> None:
    url, kwargs = _resolve_db_config(database_url="", sqlite_raw="sqlite:///explicit.db")
    assert url == "sqlite:///explicit.db"
    assert kwargs["connect_args"] == {"check_same_thread": False}


def test_default_is_memory_db() -> None:
    url, kwargs = _resolve_db_config(database_url="", sqlite_raw="")
    assert url == "sqlite:///:memory:"
    assert kwargs["connect_args"] == {"check_same_thread": False}
    assert kwargs["poolclass"] is StaticPool


def test_postgresql_scheme_recognized() -> None:
    url, kwargs = _resolve_db_config(
        database_url="postgresql+psycopg2://user:pw@db:5432/synapse_pilot"
    )
    assert url.startswith("postgresql")
    assert kwargs == {}


def test_database_url_empty_string_falls_through_to_sqlite() -> None:
    url, kwargs = _resolve_db_config(database_url="   ", sqlite_raw="")
    assert url == "sqlite:///:memory:"
