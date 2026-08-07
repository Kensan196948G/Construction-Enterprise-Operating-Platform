"""船員労働法準拠チェック (簡易).

簡易ルール (船員法 第 64〜81 条をベースに簡略化):
- 連続乗船日数 (consecutive_days) が `max_consecutive_days` (既定 30 日) を超えると違反
- 過去 1 週間の休息時間 (rest_hours_last_week) が `min_weekly_rest_hours` (既定 24h) 未満で違反
- 18 歳未満 (minor) は夜間労働制限など別途警告
"""
from __future__ import annotations

from dataclasses import dataclass, field

DEFAULT_MAX_CONSECUTIVE_DAYS = 30
DEFAULT_MIN_WEEKLY_REST_HOURS = 24


@dataclass(frozen=True)
class CrewComplianceResult:
    crew_code: str
    is_compliant: bool
    violations: tuple[str, ...] = field(default_factory=tuple)
    warnings: tuple[str, ...] = field(default_factory=tuple)


def check_crew_compliance(
    crew_code: str,
    consecutive_days: int,
    rest_hours_last_week: float,
    *,
    is_minor: bool = False,
    max_consecutive_days: int = DEFAULT_MAX_CONSECUTIVE_DAYS,
    min_weekly_rest_hours: float = DEFAULT_MIN_WEEKLY_REST_HOURS,
) -> CrewComplianceResult:
    """乗組員 1 名分のコンプライアンスを判定する."""
    if consecutive_days < 0:
        raise ValueError("consecutive_days must be non-negative")
    if rest_hours_last_week < 0:
        raise ValueError("rest_hours_last_week must be non-negative")

    violations: list[str] = []
    warnings: list[str] = []

    if consecutive_days > max_consecutive_days:
        violations.append(
            f"連続乗船 {consecutive_days} 日が上限 {max_consecutive_days} 日を超過"
        )
    elif consecutive_days >= max_consecutive_days - 3:
        warnings.append(
            f"連続乗船 {consecutive_days} 日 (上限 {max_consecutive_days} 日まで残り少)"
        )

    if rest_hours_last_week < min_weekly_rest_hours:
        violations.append(
            f"週間休息時間 {rest_hours_last_week:.1f}h が下限 {min_weekly_rest_hours}h を下回る"
        )

    if is_minor:
        warnings.append("18 歳未満: 夜間労働制限・労働時間特例の確認が必要")

    return CrewComplianceResult(
        crew_code=crew_code,
        is_compliant=len(violations) == 0,
        violations=tuple(violations),
        warnings=tuple(warnings),
    )
