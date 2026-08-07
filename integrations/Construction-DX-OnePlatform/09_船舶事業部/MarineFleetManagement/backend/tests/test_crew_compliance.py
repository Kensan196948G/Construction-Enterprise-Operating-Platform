"""船員労働法準拠チェックテスト."""
from __future__ import annotations

import pytest

from marine_api.services.crew_compliance_checker import check_crew_compliance


def test_compliant_case() -> None:
    r = check_crew_compliance("C001", consecutive_days=20, rest_hours_last_week=30.0)
    assert r.is_compliant is True
    assert r.violations == ()


def test_over_max_consecutive_days() -> None:
    r = check_crew_compliance("C002", consecutive_days=35, rest_hours_last_week=30.0)
    assert r.is_compliant is False
    assert any("連続乗船" in v for v in r.violations)


def test_insufficient_weekly_rest() -> None:
    r = check_crew_compliance("C003", consecutive_days=10, rest_hours_last_week=12.0)
    assert r.is_compliant is False
    assert any("休息" in v for v in r.violations)


def test_warning_near_limit() -> None:
    """上限手前 (28 日) は warning が出るが violation ではない."""
    r = check_crew_compliance("C004", consecutive_days=28, rest_hours_last_week=30.0)
    assert r.is_compliant is True
    assert len(r.warnings) >= 1


def test_negative_input_raises() -> None:
    with pytest.raises(ValueError):
        check_crew_compliance("C005", consecutive_days=-1, rest_hours_last_week=30.0)
