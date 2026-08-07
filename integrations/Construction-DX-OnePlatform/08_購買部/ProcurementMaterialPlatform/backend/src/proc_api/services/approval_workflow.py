"""購買承認ワークフロー.

金額閾値:
    amount <= 1,000,000        : 1 step (現場長)
    amount <= 5,000,000        : 2 steps (現場長 → 部長)
    amount > 5,000,000         : 3 steps (現場長 → 部長 → 役員)

公開 API:
    - determine_workflow(amount, thresholds) -> ApprovalWorkflow
    - next_approval_state(current_step, total_steps, decision) -> 次状態
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

DEFAULT_SMALL = 1_000_000
DEFAULT_MEDIUM = 5_000_000


class ApprovalDecision(str, Enum):
    APPROVE = "approve"
    REJECT = "reject"


@dataclass(frozen=True)
class ApprovalStep:
    step_no: int
    role: str
    label: str


@dataclass(frozen=True)
class ApprovalWorkflow:
    total_steps: int
    steps: tuple[ApprovalStep, ...]
    tier: str  # small / medium / large


def determine_workflow(
    amount: float | int,
    threshold_small: int = DEFAULT_SMALL,
    threshold_medium: int = DEFAULT_MEDIUM,
) -> ApprovalWorkflow:
    """金額からワークフロー定義を決定する."""
    if amount < 0:
        raise ValueError("amount must be non-negative")
    if amount <= threshold_small:
        return ApprovalWorkflow(
            total_steps=1,
            tier="small",
            steps=(ApprovalStep(1, "site_manager", "現場長承認"),),
        )
    if amount <= threshold_medium:
        return ApprovalWorkflow(
            total_steps=2,
            tier="medium",
            steps=(
                ApprovalStep(1, "site_manager", "現場長承認"),
                ApprovalStep(2, "department_head", "部長承認"),
            ),
        )
    return ApprovalWorkflow(
        total_steps=3,
        tier="large",
        steps=(
            ApprovalStep(1, "site_manager", "現場長承認"),
            ApprovalStep(2, "department_head", "部長承認"),
            ApprovalStep(3, "executive", "役員承認"),
        ),
    )


def next_approval_state(
    current_step: int,
    total_steps: int,
    decision: ApprovalDecision | str,
) -> dict:
    """承認 / 却下の遷移結果を返す.

    Returns:
        {"status": "approving" | "approved" | "rejected", "current_step": int}
    """
    if isinstance(decision, str):
        decision = ApprovalDecision(decision)
    if decision == ApprovalDecision.REJECT:
        return {"status": "rejected", "current_step": current_step}
    new_step = current_step + 1
    if new_step >= total_steps:
        return {"status": "approved", "current_step": total_steps}
    return {"status": "approving", "current_step": new_step}
