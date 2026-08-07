"""度数率 / 強度率の単体テスト (固定値検算)."""
from sq_api.services.safety_metrics import (
    aggregate,
    frequency_rate,
    severity_rate,
)


def test_frequency_rate_basic() -> None:
    # 死傷者 2人, 延べ労働時間 1,000,000h -> 度数率 = 2 / 1,000,000 * 1,000,000 = 2.0
    assert frequency_rate(2, 1_000_000) == 2.0


def test_frequency_rate_厚労省例() -> None:
    # 死傷者 5人 / 延べ 2,000,000h -> 2.5
    assert frequency_rate(5, 2_000_000) == 2.5


def test_severity_rate_basic() -> None:
    # 損失 150日 / 延べ 1,000,000h -> 強度率 = 150 / 1,000,000 * 1,000 = 0.15
    assert severity_rate(150, 1_000_000) == 0.15


def test_zero_hours_returns_zero() -> None:
    assert frequency_rate(3, 0) == 0.0
    assert severity_rate(3, 0) == 0.0


def test_aggregate_multiple_records() -> None:
    records = [
        {"injuries": 1, "lost_days": 30},
        {"injuries": 2, "lost_days": 70},
    ]
    s = aggregate(records, total_work_hours=1_000_000)
    assert s.injuries == 3
    assert s.lost_days == 100
    assert s.frequency_rate == 3.0  # 3 / 1e6 * 1e6
    assert s.severity_rate == 0.1  # 100 / 1e6 * 1e3
