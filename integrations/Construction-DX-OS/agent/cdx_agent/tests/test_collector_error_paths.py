"""Tests for error-path branches in inventory and heartbeat collectors.

These tests cover the silent-fallback exception handlers that protect the agent
from crashing when /proc or /etc files are unreadable (e.g. container
environments, permission restrictions, or non-Linux hosts).
"""

from __future__ import annotations

import platform
from unittest.mock import mock_open, patch

from cdx_agent import heartbeat, inventory

# ---------------------------------------------------------------------------
# inventory._detect_memory_bytes
# ---------------------------------------------------------------------------


def test_detect_memory_bytes_returns_zero_on_file_not_found():
    with patch("builtins.open", side_effect=FileNotFoundError):
        assert inventory._detect_memory_bytes() == 0


def test_detect_memory_bytes_returns_zero_on_permission_error():
    with patch("builtins.open", side_effect=PermissionError):
        assert inventory._detect_memory_bytes() == 0


def test_detect_memory_bytes_returns_zero_when_memtotal_absent():
    fake = "SomeOther: 0 kB\nOtherField: 1234 kB\n"
    with patch("builtins.open", mock_open(read_data=fake)):
        assert inventory._detect_memory_bytes() == 0


# ---------------------------------------------------------------------------
# inventory._detect_os_version
# ---------------------------------------------------------------------------


def test_detect_os_version_falls_back_on_file_not_found():
    with patch("builtins.open", side_effect=FileNotFoundError):
        assert inventory._detect_os_version() == platform.platform()


def test_detect_os_version_falls_back_on_permission_error():
    with patch("builtins.open", side_effect=PermissionError):
        assert inventory._detect_os_version() == platform.platform()


# ---------------------------------------------------------------------------
# heartbeat._read_uptime_seconds
# ---------------------------------------------------------------------------


def test_read_uptime_seconds_returns_zero_on_file_not_found():
    with patch("builtins.open", side_effect=FileNotFoundError):
        assert heartbeat._read_uptime_seconds() == 0


def test_read_uptime_seconds_returns_zero_on_permission_error():
    with patch("builtins.open", side_effect=PermissionError):
        assert heartbeat._read_uptime_seconds() == 0


def test_read_uptime_seconds_returns_zero_on_value_error():
    with patch("builtins.open", mock_open(read_data="not-a-number uptime\n")):
        assert heartbeat._read_uptime_seconds() == 0
