"""Policy Test Matrix runner (BL-013).

`fixtures/*.yaml` に定義されたケースを Policy Engine に流し、
final_decision / applied_rules / requires_audit が期待通りであることを検証する。

このテストは「QA / セキュリティチームが追加した YAML だけで挙動を増減できる」
ことを担保する Sprint 0 の足場。
"""

from __future__ import annotations

from pathlib import Path

import pytest
import yaml

from policy_app.policy_rules.engine import evaluate
from policy_app.schemas.decision import PolicyDecisionInput

FIXTURE_DIR = Path(__file__).parent / "fixtures"


def _load_cases() -> list[dict]:
    cases: list[dict] = []
    for path in sorted(FIXTURE_DIR.glob("*.yaml")):
        loaded = yaml.safe_load(path.read_text(encoding="utf-8"))
        if loaded:
            cases.extend(loaded)
    return cases


_CASES = _load_cases()


@pytest.mark.parametrize("case", _CASES, ids=[c["name"] for c in _CASES])
def test_policy_matrix_case(case: dict) -> None:
    inp = PolicyDecisionInput(**case["input"])
    result = evaluate(inp, decision_id="pde_tena_20260502_0001")

    expected = case["expect"]
    assert result.final_decision.value == expected["final_decision"], (
        f"final_decision mismatch in '{case['name']}': "
        f"expected={expected['final_decision']} actual={result.final_decision.value}; "
        f"applied={[r.rule_id for r in result.applied_rules]}"
    )
    rule_ids = {r.rule_id for r in result.applied_rules}
    missing = set(expected.get("must_include_rule_ids", [])) - rule_ids
    assert not missing, (
        f"applied_rules missing in '{case['name']}': missing={missing}; got={rule_ids}"
    )
    if "requires_audit" in expected:
        assert result.requires_audit is expected["requires_audit"], (
            f"requires_audit mismatch in '{case['name']}': "
            f"expected={expected['requires_audit']} actual={result.requires_audit}"
        )


def test_matrix_has_minimum_coverage() -> None:
    """Sprint 0 では最低 5 ケース必要 (CLAUDE.md / G1 期待値)."""
    assert len(_CASES) >= 5
    names = {c["name"] for c in _CASES}
    # confidential x 外部 AI のケースが含まれていること（G1 代表ケース）
    assert any("confidential" in n.lower() and "external" in n.lower() for n in names)
