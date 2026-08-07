"""購買承認 WF 金額閾値分岐."""
from __future__ import annotations

import pytest

from proc_api.services.approval_workflow import (
    ApprovalDecision,
    determine_workflow,
    next_approval_state,
)


def test_small_amount_one_step() -> None:
    wf = determine_workflow(500_000)
    assert wf.total_steps == 1
    assert wf.tier == "small"
    assert wf.steps[0].role == "site_manager"


def test_medium_amount_two_steps() -> None:
    wf = determine_workflow(3_000_000)
    assert wf.total_steps == 2
    assert wf.tier == "medium"
    roles = [s.role for s in wf.steps]
    assert roles == ["site_manager", "department_head"]


def test_large_amount_three_steps() -> None:
    wf = determine_workflow(10_000_000)
    assert wf.total_steps == 3
    assert wf.tier == "large"
    assert wf.steps[-1].role == "executive"


def test_threshold_boundary() -> None:
    """境界値: 100 万円ちょうど → small, 100万1円 → medium, 500万円ちょうど → medium, 500万1円 → large."""
    assert determine_workflow(1_000_000).total_steps == 1
    assert determine_workflow(1_000_001).total_steps == 2
    assert determine_workflow(5_000_000).total_steps == 2
    assert determine_workflow(5_000_001).total_steps == 3


def test_state_transition_approve_until_final() -> None:
    # 3 step ワークフロー
    s1 = next_approval_state(0, 3, ApprovalDecision.APPROVE)
    assert s1 == {"status": "approving", "current_step": 1}
    s2 = next_approval_state(1, 3, ApprovalDecision.APPROVE)
    assert s2 == {"status": "approving", "current_step": 2}
    s3 = next_approval_state(2, 3, "approve")
    assert s3 == {"status": "approved", "current_step": 3}


def test_state_transition_reject() -> None:
    s = next_approval_state(1, 3, "reject")
    assert s["status"] == "rejected"


def test_negative_amount_raises() -> None:
    with pytest.raises(ValueError):
        determine_workflow(-1)
