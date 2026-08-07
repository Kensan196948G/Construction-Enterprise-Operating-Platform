"""Tests for cdx_agent.config."""

from __future__ import annotations

from pathlib import Path

from cdx_agent import config as config_module
from cdx_agent.config import (
    DEFAULT_API_ENDPOINT,
    DEFAULT_PROFILE,
    DEFAULT_SPOOL_PATH,
    FALLBACK_DEVICE_ID,
    AgentConfig,
    load_config,
    resolve_device_id,
    resolve_shared_secret,
)


def test_resolve_device_id_prefers_env_override():
    env = {"CDX_DEVICE_ID": "  dev-001  "}
    assert resolve_device_id(env) == "dev-001"


def test_resolve_device_id_falls_back_when_no_source(monkeypatch, tmp_path):
    ghost_override = tmp_path / "override-missing"
    ghost_machine = tmp_path / "machine-missing"
    monkeypatch.setattr(config_module, "DEVICE_ID_OVERRIDE_PATH", ghost_override)
    monkeypatch.setattr(config_module, "MACHINE_ID_PATH", ghost_machine)
    assert resolve_device_id({}) == FALLBACK_DEVICE_ID


def test_resolve_device_id_reads_machine_id_file(monkeypatch, tmp_path):
    machine_id = tmp_path / "machine-id"
    machine_id.write_text("abcdef0123456789\n", encoding="utf-8")
    monkeypatch.setattr(config_module, "DEVICE_ID_OVERRIDE_PATH", tmp_path / "missing")
    monkeypatch.setattr(config_module, "MACHINE_ID_PATH", machine_id)
    assert resolve_device_id({}) == "abcdef0123456789"


def test_resolve_shared_secret_env_wins(monkeypatch, tmp_path):
    monkeypatch.setattr(config_module, "SHARED_SECRET_PATH", tmp_path / "no-file")
    assert resolve_shared_secret({"CDX_SHARED_SECRET": "s3cret"}) == "s3cret"


def test_resolve_shared_secret_reads_file(monkeypatch, tmp_path):
    secret_file = tmp_path / "secret"
    secret_file.write_text("file-secret\n", encoding="utf-8")
    monkeypatch.setattr(config_module, "SHARED_SECRET_PATH", secret_file)
    assert resolve_shared_secret({}) == "file-secret"


def test_resolve_shared_secret_returns_empty_when_unset(monkeypatch, tmp_path):
    monkeypatch.setattr(config_module, "SHARED_SECRET_PATH", tmp_path / "no-file")
    assert resolve_shared_secret({}) == ""


def test_load_config_returns_defaults(monkeypatch, tmp_path):
    monkeypatch.setattr(config_module, "SHARED_SECRET_PATH", tmp_path / "no-file")
    cfg = load_config({"CDX_DEVICE_ID": "unit-test"})
    assert isinstance(cfg, AgentConfig)
    assert cfg.device_id == "unit-test"
    assert cfg.api_endpoint == DEFAULT_API_ENDPOINT
    assert cfg.profile == DEFAULT_PROFILE
    assert cfg.shared_secret == ""
    assert cfg.spool_path == DEFAULT_SPOOL_PATH


def test_load_config_honours_env_overrides(monkeypatch, tmp_path):
    monkeypatch.setattr(config_module, "SHARED_SECRET_PATH", tmp_path / "no-file")
    cfg = load_config(
        {
            "CDX_DEVICE_ID": "dev-42",
            "CDX_API_ENDPOINT": "https://example.test/api",
            "CDX_PROFILE": "field",
            "CDX_SHARED_SECRET": "shh",
            "CDX_SPOOL_PATH": str(tmp_path / "spool.jsonl"),
        }
    )
    assert cfg.api_endpoint == "https://example.test/api"
    assert cfg.profile == "field"
    assert cfg.shared_secret == "shh"
    assert cfg.spool_path == Path(tmp_path / "spool.jsonl")
