"""Non Goals Guard (BL-012).

Sprint 0 で意図的に**入れない**ものが、コードや依存にこっそり混入していないかを
機械的に検証する。

設計原則:
- 各テストは「失敗したら ADR / G1 仕様違反の可能性が高い」という性質に絞る。
- 「将来必須化されるが Sprint 0 では先送り」項目（previous_hash_ref 必須化など）は
  ここではガードしない（紛らわしいので別ファイルに分離する）。
"""

from __future__ import annotations

import re
from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parents[2]
SERVICES = REPO / "services"


# ----------------------- ADR-001: AI Gateway Mandatory -----------------------


@pytest.mark.parametrize(
    "forbidden_module",
    [
        "openai",
        "anthropic",
        "google.generativeai",
        "google_generativeai",
    ],
)
def test_no_direct_ai_sdk_imports(forbidden_module: str) -> None:
    """services/ から AI ベンダ SDK を直接 import してはならない.

    ai-gateway-service だけは例外: 唯一の許可された LLM 経路として SDK を直接使う (ADR-001).
    他のサービスが LLM SDK を直接 import していた場合は AI Gateway 経由ではないため違反。
    """
    pattern = re.compile(
        rf"^\s*(import\s+{re.escape(forbidden_module)}|from\s+{re.escape(forbidden_module)}\s+import)",
        re.MULTILINE,
    )
    ai_gateway_dir = SERVICES / "ai-gateway-service"
    offenders: list[Path] = []
    for path in SERVICES.rglob("*.py"):
        # ai-gateway-service is the sole authorised LLM gateway; SDK imports are expected there.
        if path.is_relative_to(ai_gateway_dir):
            continue
        if any(part in {".venv", "node_modules", "__pycache__"} for part in path.parts):
            continue
        text = path.read_text(encoding="utf-8")
        if pattern.search(text):
            offenders.append(path)
    assert offenders == [], (
        f"AI Gateway Mandatory 違反: {forbidden_module} を直接 import しているファイル: "
        f"{[str(p.relative_to(REPO)) for p in offenders]}"
    )


# ----------------------- Audit Immutability -----------------------


def test_audit_event_is_frozen() -> None:
    """AuditEvent (Immutable) は frozen=True を維持する."""
    from synapse_shared.audit_base import AuditEvent

    cfg = AuditEvent.model_config
    assert cfg.get("frozen") is True
    assert cfg.get("extra") == "forbid"


# ----------------------- Schema 厳格性 (Pydantic extra=forbid) -----------------------


@pytest.mark.parametrize(
    "import_path",
    [
        "synapse_shared.audit_base:AuditEvent",
        "synapse_shared.audit_base:AIAuditExtension",
        "synapse_shared.object_base:CommonObject",
    ],
)
def test_shared_models_use_extra_forbid(import_path: str) -> None:
    module_name, attr = import_path.split(":")
    import importlib

    cls = getattr(importlib.import_module(module_name), attr)
    assert cls.model_config.get("extra") == "forbid", (
        f"{import_path} は extra='forbid' であるべき"
    )


# ----------------------- ADR-007: MVP Scope (no infra yet) -----------------------
# Sprint 2 (2026-05-13): .github/workflows は CI 導入のため解禁。
# Sprint 2 MVP RC (2026-05-13): Dockerfile / docker-compose は MVP RC のため解禁。
#   IaC (.tf / Pulumi) / 他 CI(.gitlab / Jenkinsfile) は引き続き Sprint 2 非対象。


@pytest.mark.parametrize(
    "glob",
    [
        ".gitlab-ci.yml",
        "Jenkinsfile",
        "**/*.tf",
        "Pulumi.yaml",
    ],
)
def test_no_infra_or_cicd_files(glob: str) -> None:
    """IaC / 非GitHub CI は Sprint 2 でも非対象 (ADR-007).

    Note:
    - .github/workflows は Sprint 2 入口で解禁済み（CI Pipeline 導入）。
    - Dockerfile / docker-compose は Sprint 2 MVP RC で解禁済み（Docker起動要件）。
    - IaC (.tf / Pulumi) / 他 CI は引き続き本ガードで保護する。
    """
    matches = [
        p
        for p in REPO.glob(glob)
        if not any(part in {".venv", "node_modules", ".git"} for part in p.parts)
    ]
    assert matches == [], (
        f"Sprint 0 非対象のファイルが存在する: {[str(p.relative_to(REPO)) for p in matches]}"
    )


# ----------------------- 禁止されている runtime 依存 -----------------------


@pytest.mark.parametrize(
    "forbidden_dep",
    [
        "docker",
        "kubernetes",
        "python-terraform",
        "pulumi",
        "boto3",  # Sprint 0 では AWS SDK 未使用
    ],
)
def test_no_forbidden_runtime_deps(forbidden_dep: str) -> None:
    """services/*/pyproject.toml の dependencies に Sprint 0 非対象を含めない."""
    offenders: list[Path] = []
    for pyproject in SERVICES.glob("*/pyproject.toml"):
        text = pyproject.read_text(encoding="utf-8")
        # dependencies / optional-dependencies どちらでも検出
        if re.search(rf"['\"]{re.escape(forbidden_dep)}['\"]", text):
            offenders.append(pyproject)
    assert offenders == [], (
        f"{forbidden_dep} は Sprint 0 では禁止: {[str(p.relative_to(REPO)) for p in offenders]}"
    )


# ----------------------- ADR Signoff の網羅性 -----------------------


def test_adr_signoff_covers_adr_001_to_008() -> None:
    """ADR_SIGNOFF.md が ADR-001 から ADR-008 までを参照している."""
    signoff = REPO / "docs" / "12_Design_Review_Readiness" / "ADR_SIGNOFF.md"
    text = signoff.read_text(encoding="utf-8")
    missing = [f"ADR-{n:03d}" for n in range(1, 9) if f"ADR-{n:03d}" not in text]
    assert missing == [], f"ADR_SIGNOFF.md に未記載: {missing}"


# ----------------------- Decision Type は audit_required を含まない -----------------------


def test_audit_required_is_not_a_policy_decision_type() -> None:
    """G1: audit_required は最終 decision ではなく cross-cutting trigger.

    PolicyDecisionType に audit_required を混ぜると優先順序の判断が
    破綻するので enum の純度をガードする。
    """
    from synapse_shared.enums import PolicyDecisionType

    assert "audit_required" not in {e.value for e in PolicyDecisionType}
