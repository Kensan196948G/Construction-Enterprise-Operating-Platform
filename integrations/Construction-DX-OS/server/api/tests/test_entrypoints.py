"""Tests for server entrypoints and DI sentinel functions.

Covers:
- cdx_server/__main__.py (module entrypoint)
- cdx_server/dependencies.py (RuntimeError guard sentinels)
- cdx_server/app.py (env-driven configuration paths)
"""

from __future__ import annotations

import sys
import warnings

import pytest


class TestMainEntrypoint:
    """cdx_server/__main__.py: python -m cdx_server and cdx-server script."""

    def test_main_returns_zero(self, monkeypatch):
        captured: dict = {}

        def _fake_run(app_str, **kwargs):
            captured["app"] = app_str
            captured.update(kwargs)

        monkeypatch.setattr("uvicorn.run", _fake_run)
        import cdx_server.__main__ as entrypoint

        result = entrypoint.main()

        assert result == 0
        assert captured["app"] == "cdx_server.app:app"
        assert captured["host"] == "0.0.0.0"
        assert captured["port"] == 8080
        assert captured["reload"] is False


class TestDependencySentinels:
    """cdx_server/dependencies.py: DI override guard functions."""

    def test_get_storage_raises_without_override(self):
        from cdx_server.dependencies import get_storage

        with pytest.raises(RuntimeError, match="Storage dependency must be overridden"):
            get_storage()

    def test_get_rate_limiter_raises_without_override(self):
        from cdx_server.dependencies import get_rate_limiter

        with pytest.raises(RuntimeError, match="RateLimiter dependency must be overridden"):
            get_rate_limiter()


class TestAppEnvPaths:
    """cdx_server/app.py: environment-variable-driven configuration branches."""

    def test_rate_limiter_disabled_returns_null(self, monkeypatch):
        from cdx_server.app import _build_default_rate_limiter
        from cdx_server.rate_limit import NullRateLimiter

        monkeypatch.setenv("CDX_RATE_LIMIT_ENABLED", "false")
        monkeypatch.delenv("REDIS_URL", raising=False)

        limiter = _build_default_rate_limiter()

        assert isinstance(limiter, NullRateLimiter)

    def test_env_int_custom_values_accepted(self, monkeypatch):
        from cdx_server.app import _build_default_rate_limiter
        from cdx_server.rate_limit import InMemoryRateLimiter

        monkeypatch.delenv("CDX_RATE_LIMIT_ENABLED", raising=False)
        monkeypatch.delenv("REDIS_URL", raising=False)
        monkeypatch.setenv("CDX_RATE_LIMIT_HEARTBEAT_PER_MIN", "5")
        monkeypatch.setenv("CDX_RATE_LIMIT_INVENTORY_PER_HOUR", "2")

        limiter = _build_default_rate_limiter()

        assert isinstance(limiter, InMemoryRateLimiter)

    def test_rate_limiter_redis_import_error_falls_back(self, monkeypatch):
        """REDIS_URL set but redis not importable → InMemoryRateLimiter + warning."""
        from cdx_server.app import _build_default_rate_limiter
        from cdx_server.rate_limit import InMemoryRateLimiter

        monkeypatch.delenv("CDX_RATE_LIMIT_ENABLED", raising=False)
        monkeypatch.setenv("REDIS_URL", "redis://localhost:6379/0")

        # Hide redis so the ImportError branch is exercised.
        hidden = {}
        for mod in ("redis", "cdx_server.rate_limit_redis"):
            if mod in sys.modules:
                hidden[mod] = sys.modules.pop(mod)
        sys.modules["redis"] = None  # type: ignore[assignment]

        try:
            with warnings.catch_warnings(record=True) as caught:
                warnings.simplefilter("always")
                limiter = _build_default_rate_limiter()
        finally:
            del sys.modules["redis"]
            sys.modules.update(hidden)

        assert isinstance(limiter, InMemoryRateLimiter)
        assert any("Falling back to InMemoryRateLimiter" in str(w.message) for w in caught)

    def test_build_default_storage_no_database_url_uses_inmemory(self, monkeypatch):
        """No DATABASE_URL → InMemoryStorage."""
        from cdx_server.app import _build_default_storage
        from cdx_server.storage import InMemoryStorage

        monkeypatch.delenv("DATABASE_URL", raising=False)

        storage = _build_default_storage()

        assert isinstance(storage, InMemoryStorage)

    def test_build_default_storage_sqlite_url_uses_postgres_storage(self, monkeypatch, tmp_path):
        """DATABASE_URL set (SQLite) → PostgresStorage created and seeded."""
        from cdx_server.app import _build_default_storage
        from cdx_server.storage_pg import PostgresStorage

        db_path = tmp_path / "entrypoints_test.db"
        monkeypatch.setenv("DATABASE_URL", f"sqlite:///{db_path}")

        storage = _build_default_storage()

        assert isinstance(storage, PostgresStorage)

    def test_build_default_storage_import_error_falls_back(self, monkeypatch):
        """DATABASE_URL set but SQLAlchemy not importable → InMemoryStorage + warning."""
        from cdx_server.app import _build_default_storage
        from cdx_server.storage import InMemoryStorage

        monkeypatch.setenv("DATABASE_URL", "postgresql://user:pw@localhost/cdx")

        hidden = {}
        for mod in list(sys.modules):
            if "sqlalchemy" in mod or "storage_pg" in mod:
                hidden[mod] = sys.modules.pop(mod)
        sys.modules["sqlalchemy"] = None  # type: ignore[assignment]

        try:
            with warnings.catch_warnings(record=True) as caught:
                warnings.simplefilter("always")
                storage = _build_default_storage()
        finally:
            del sys.modules["sqlalchemy"]
            sys.modules.update(hidden)

        assert isinstance(storage, InMemoryStorage)
        assert any("Falling back to InMemoryStorage" in str(w.message) for w in caught)
