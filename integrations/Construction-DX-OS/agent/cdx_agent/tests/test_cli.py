"""CLI smoke tests."""

from __future__ import annotations

import json

import pytest

from cdx_agent import __version__
from cdx_agent.cli import main


def test_cli_version(capsys):
    rc = main(["version"])
    assert rc == 0
    assert __version__ in capsys.readouterr().out


def test_cli_inventory_emits_valid_json(monkeypatch, capsys):
    monkeypatch.setenv("CDX_DEVICE_ID", "cli-test")
    rc = main(["inventory"])
    assert rc == 0
    payload = json.loads(capsys.readouterr().out)
    assert payload["device_id"] == "cli-test"


def test_cli_heartbeat_emits_valid_json(monkeypatch, capsys):
    monkeypatch.setenv("CDX_DEVICE_ID", "cli-test")
    rc = main(["heartbeat"])
    assert rc == 0
    payload = json.loads(capsys.readouterr().out)
    assert payload["kind"] == "heartbeat"
    assert payload["device_id"] == "cli-test"


def test_cli_config_emits_effective_values(monkeypatch, capsys):
    monkeypatch.setenv("CDX_DEVICE_ID", "cli-test")
    monkeypatch.setenv("CDX_PROFILE", "field")
    monkeypatch.setenv("CDX_SHARED_SECRET", "s3cret")
    rc = main(["config"])
    assert rc == 0
    payload = json.loads(capsys.readouterr().out)
    assert payload["profile"] == "field"
    assert payload["shared_secret_set"] is True


def test_cli_no_subcommand_exits_non_zero(capsys):
    with pytest.raises(SystemExit):
        main([])


def test_cli_enqueue_heartbeat_writes_to_spool(monkeypatch, tmp_path, capsys):
    spool_path = tmp_path / "outbox.jsonl"
    monkeypatch.setenv("CDX_DEVICE_ID", "cli-test")
    monkeypatch.setenv("CDX_SPOOL_PATH", str(spool_path))
    monkeypatch.setenv("CDX_SHARED_SECRET", "s3cret")

    rc = main(["enqueue", "heartbeat"])
    assert rc == 0

    # Spool file is populated with one JSONL row.
    lines = [line for line in spool_path.read_text().splitlines() if line]
    assert len(lines) == 1
    record = json.loads(lines[0])
    assert record["payload_type"] == "heartbeat"


def test_cli_spool_info_reports_entries(monkeypatch, tmp_path, capsys):
    spool_path = tmp_path / "outbox.jsonl"
    monkeypatch.setenv("CDX_DEVICE_ID", "cli-test")
    monkeypatch.setenv("CDX_SPOOL_PATH", str(spool_path))
    monkeypatch.setenv("CDX_SHARED_SECRET", "s")

    main(["enqueue", "heartbeat"])
    main(["enqueue", "inventory"])
    capsys.readouterr()  # drop prior output

    rc = main(["spool-info"])
    assert rc == 0
    payload = json.loads(capsys.readouterr().out)
    assert payload["entries"] == 2


def test_cli_drain_refuses_when_secret_missing(monkeypatch, tmp_path):
    monkeypatch.setenv("CDX_DEVICE_ID", "cli-test")
    monkeypatch.setenv("CDX_SPOOL_PATH", str(tmp_path / "outbox.jsonl"))
    monkeypatch.delenv("CDX_SHARED_SECRET", raising=False)

    # Also point the file-based fallback at a non-existent path so
    # the test does not accidentally pick up a real machine secret.
    from cdx_agent import config as config_module

    monkeypatch.setattr(config_module, "SHARED_SECRET_PATH", tmp_path / "no-file")

    rc = main(["drain"])
    assert rc == 3


def test_cli_drain_returns_4_when_not_all_flushed(monkeypatch, tmp_path):
    """drain returns exit code 4 when items remain in spool after drain."""
    from unittest.mock import patch

    monkeypatch.setenv("CDX_DEVICE_ID", "cli-test")
    monkeypatch.setenv("CDX_SPOOL_PATH", str(tmp_path / "outbox.jsonl"))
    monkeypatch.setenv("CDX_SHARED_SECRET", "test-secret-32chars00000000000000")
    monkeypatch.setenv("CDX_API_ENDPOINT", "http://localhost:9")

    # Simulate drain that leaves items (all_flushed=False)
    from cdx_agent.sync import DrainResult

    mock_result = DrainResult(total=1, sent=0, remaining=1, failed_status=503)
    with patch("cdx_agent.cli._make_orchestrator") as mock_orch:
        mock_orch.return_value.drain.return_value = mock_result
        rc = main(["drain"])
    assert rc == 4


def test_cli_poll_policy_no_secret(monkeypatch, tmp_path):
    """poll-policy returns exit code 3 when CDX_SHARED_SECRET is unset."""
    from cdx_agent import config as config_module

    monkeypatch.setenv("CDX_DEVICE_ID", "cli-test")
    monkeypatch.setenv("CDX_SPOOL_PATH", str(tmp_path / "outbox.jsonl"))
    monkeypatch.delenv("CDX_SHARED_SECRET", raising=False)
    monkeypatch.setattr(config_module, "SHARED_SECRET_PATH", tmp_path / "no-file")
    rc = main(["poll-policy"])
    assert rc == 3


def test_cli_poll_policy_fetch_fails(monkeypatch, tmp_path):
    """poll-policy returns exit code 5 when server fetch fails."""
    from unittest.mock import MagicMock, patch

    monkeypatch.setenv("CDX_DEVICE_ID", "cli-test")
    monkeypatch.setenv("CDX_SPOOL_PATH", str(tmp_path / "outbox.jsonl"))
    monkeypatch.setenv("CDX_SHARED_SECRET", "test-secret-32chars00000000000000")
    monkeypatch.setenv("CDX_API_ENDPOINT", "http://localhost:9")

    mock_result = MagicMock()
    mock_result.ok = False
    mock_result.policy = None
    mock_result.status_code = 503

    with patch("cdx_agent.cli.PolicyClient") as MockPC:
        MockPC.return_value.fetch.return_value = mock_result
        rc = main(["poll-policy"])
    assert rc == 5


def test_main_module_entrypoint(monkeypatch):
    """python -m cdx_agent with no args exits non-zero (coverage for __main__.py)."""
    import runpy
    import sys

    monkeypatch.setattr(sys, "argv", ["cdx-agent"])
    try:
        runpy.run_module("cdx_agent", run_name="__main__", alter_sys=True)
    except SystemExit as exc:
        assert exc.code != 0  # no subcommand → non-zero exit
