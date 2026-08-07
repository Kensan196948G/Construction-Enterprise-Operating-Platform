#!/usr/bin/env python3
"""Release countdown gate for Construction-DX-OS.

Reads project.registered_at / release_deadline / period_months from
claudeos/state.json (in-repo, trusted) and emits:
  - GitHub Step Summary table
  - GitHub annotation matching the degradation policy in CLAUDE.md §0
  - Exit code 1 if the deadline has already passed.

No untrusted inputs are read; safe for GitHub Actions runs.
"""
from __future__ import annotations

import json
import os
import sys
from datetime import date
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
STATE = REPO_ROOT / "claudeos" / "state.json"


def emit_summary(lines: list[str]) -> None:
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    text = "\n".join(lines) + "\n"
    if summary:
        with open(summary, "a", encoding="utf-8") as fh:
            fh.write(text)
    else:
        sys.stdout.write(text)


def main() -> int:
    data = json.loads(STATE.read_text(encoding="utf-8"))
    project = data["project"]
    registered = date.fromisoformat(project["registered_at"])
    deadline = date.fromisoformat(project["release_deadline"])
    period = project["period_months"]
    today = date.today()

    elapsed = (today - registered).days
    remaining = (deadline - today).days

    rows = [
        "## 🗓️ Construction-DX-OS Release Countdown",
        "",
        "| 項目 | 値 |",
        "|---|---|",
        f"| 登録日 | {registered.isoformat()} |",
        f"| プロジェクト期間 | {period} ヶ月 |",
        f"| リリース期限 | {deadline.isoformat()} |",
        f"| 経過日数 | {elapsed} 日 |",
        f"| **残日数** | **{remaining} 日** |",
        "",
    ]

    if remaining < 0:
        rows.append(
            f"❌ ERROR: リリース期限を過ぎています ({deadline.isoformat()})。state.json または計画を見直してください。"
        )
        emit_summary(rows)
        print(
            f"::error title=Deadline Passed::Release deadline {deadline.isoformat()} has already passed ({remaining} days)."
        )
        return 1

    if remaining <= 7:
        rows.append(
            f"🚀 RELEASE WINDOW: 残 {remaining} 日。リリース準備のみ（CHANGELOG・README・タグ付け）。"
        )
        annotation = (
            f"::warning title=Release Only::Remaining {remaining} days — release-only mode (CHANGELOG/README/tag)."
        )
    elif remaining <= 14:
        rows.append(
            f"🛑 FEATURE FREEZE: 残 {remaining} 日。新機能開発禁止、バグ修正・安定化のみ。"
        )
        annotation = (
            f"::warning title=Feature Freeze::Remaining {remaining} days — no new features, stabilize only."
        )
    elif remaining <= 30:
        rows.append(
            f"🩺 STABILIZE: 残 {remaining} 日。Improvement 縮退、Verify / リリース準備を優先。"
        )
        annotation = (
            f"::notice title=Stabilize::Remaining {remaining} days — improvement freeze, prioritize verify/release prep."
        )
    else:
        rows.append(f"✅ DEVELOPMENT: 残 {remaining} 日。通常開発フェーズ。")
        annotation = ""

    emit_summary(rows)
    if annotation:
        print(annotation)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
