"""G5 Governance Gate: Direct AI Access 禁止 CI 強制 (ADR-001).

ADR-001: AI SDK (anthropic / openai) への直接アクセスは
ai-gateway-service のみに許可する。他サービスは必ず
AI Gateway 経由で呼び出すこと。

このテストは ast モジュールで Python ソースを静的解析し、
ai-gateway-service 以外に AI SDK の import がないことを保証する。
CI で自動実行されることで、将来の誤実装を即座に検出する。
"""

from __future__ import annotations

import ast
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
SERVICES_ROOT = REPO_ROOT / "services"
GATEWAY_SERVICE = SERVICES_ROOT / "ai-gateway-service"

# 禁止対象 AI SDK のトップレベルモジュール名
_FORBIDDEN_AI_SDKS = frozenset({"anthropic", "openai"})


def _collect_ai_imports(py_file: Path) -> list[str]:
    """Return list of forbidden AI SDK import strings found in py_file."""
    try:
        tree = ast.parse(py_file.read_text(encoding="utf-8"))
    except SyntaxError:
        return []

    found: list[str] = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                top = alias.name.split(".")[0]
                if top in _FORBIDDEN_AI_SDKS:
                    found.append(f"  {py_file}: import {alias.name}")
        elif isinstance(node, ast.ImportFrom):
            if node.module:
                top = node.module.split(".")[0]
                if top in _FORBIDDEN_AI_SDKS:
                    found.append(f"  {py_file}: from {node.module} import ...")
    return found


class TestNoDirectAIAccess:
    """ADR-001: only ai-gateway-service may import AI SDKs."""

    def test_no_ai_sdk_imports_outside_gateway(self) -> None:
        violations: list[str] = []
        for py_file in SERVICES_ROOT.rglob("*.py"):
            if "__pycache__" in py_file.parts:
                continue
            if py_file.is_relative_to(GATEWAY_SERVICE):
                continue
            violations.extend(_collect_ai_imports(py_file))

        assert not violations, (
            "Direct AI SDK imports detected outside ai-gateway-service "
            "(violates ADR-001):\n" + "\n".join(violations)
        )

    def test_gateway_service_uses_ai_sdk(self) -> None:
        """Sanity check: ai-gateway-service actually uses the AI SDK."""
        has_import = False
        for py_file in GATEWAY_SERVICE.rglob("*.py"):
            if "__pycache__" in py_file.parts:
                continue
            if _collect_ai_imports(py_file):
                has_import = True
                break
        assert has_import, (
            "ai-gateway-service has no AI SDK import — "
            "did the service get refactored away?"
        )
