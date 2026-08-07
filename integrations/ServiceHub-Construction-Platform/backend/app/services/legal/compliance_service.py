"""
Compliance Check Service — 建設業法・下請法・労働安全衛生法 コンプライアンスチェック
Claude AI または ルールベースエンジン（フォールバック）で法令違反を検知する
"""

from __future__ import annotations

import logging
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.legal import ComplianceRepository
from app.schemas.legal import (
    ComplianceCheckRequest,
    ComplianceCheckResponse,
    ComplianceStatusSummary,
    ComplianceViolation,
)
from app.services.legal.anthropic_client import get_anthropic_client

logger = logging.getLogger(__name__)

MODEL_LEGAL = "claude-opus-4-7"

# ---------------------------------------------------------------------------
# Anthropic tool schema for compliance check
# ---------------------------------------------------------------------------

COMPLIANCE_CHECK_TOOL = {
    "name": "run_compliance_check",
    "description": (
        "建設業法・下請代金支払遅延等防止法（下請法）・労働安全衛生法の観点から"
        "建設プロジェクトのコンプライアンス状況を評価し、違反・改善提案を出力する。"
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "status": {
                "type": "string",
                "enum": ["PASS", "FAIL", "WARNING"],
                "description": "コンプライアンス総合判定",
            },
            "score": {
                "type": "integer",
                "minimum": 0,
                "maximum": 100,
                "description": "コンプライアンススコア（100=完全準拠）",
            },
            "violations": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "law": {
                            "type": "string",
                            "enum": [
                                "construction_law",
                                "subcontract_law",
                                "labor_safety",
                                "other",
                            ],
                        },
                        "article": {"type": "string"},
                        "description": {"type": "string"},
                        "severity": {
                            "type": "string",
                            "enum": ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
                        },
                        "recommendation": {"type": "string"},
                    },
                    "required": [
                        "law",
                        "article",
                        "description",
                        "severity",
                        "recommendation",
                    ],
                },
            },
            "recommendations": {
                "type": "array",
                "items": {"type": "string"},
                "description": "改善提案リスト",
            },
        },
        "required": ["status", "score", "violations", "recommendations"],
    },
}

COMPLIANCE_SYSTEM_PROMPT = """あなたは建設業専門の法務 AI アシスタントです。
以下の法令に精通しており、建設プロジェクトのコンプライアンス状況を正確に評価できます。

【適用法令】
1. 建設業法:
   - 第19条: 契約書面の必須記載事項（工期・請負代金・支払方法など）
   - 第19条の3: 不当に低い請負代金の禁止
   - 第22条: 一括下請負の禁止
   - 第26条: 主任技術者・監理技術者の配置義務
2. 下請代金支払遅延等防止法（下請法）:
   - 第2条の2: 支払期限（給付受領後60日以内）
   - 第3条: 書面交付義務
   - 第4条: 不当減額・返品・買いたたき禁止
3. 労働安全衛生法:
   - 第15条: 統括安全衛生責任者の選任
   - 第20〜25条: 事業者の安全配慮義務
   - リスクアセスメント義務

【判定基準】
- PASS (85-100点): 重大な問題なし
- WARNING (50-84点): 改善推奨事項あり
- FAIL (0-49点): 法令違反あり、または重大リスク

必ず日本語で回答し、run_compliance_check ツールを使用してください。"""


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------


class ComplianceService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = ComplianceRepository(db)

    async def run_check(
        self,
        project_id: uuid.UUID,
        data: ComplianceCheckRequest,
        created_by: uuid.UUID,
    ) -> ComplianceCheckResponse:
        """コンプライアンスチェックを実行し結果を DB に保存する。"""
        client = get_anthropic_client()

        if client is not None:
            try:
                result = await _call_claude_compliance(client, data)
                ai_used = True
            except Exception as exc:
                logger.warning(
                    "Claude compliance check failed (%s), falling back to rule-based",
                    exc,
                )
                result = _rule_based_compliance(data)
                ai_used = False
        else:
            result = _rule_based_compliance(data)
            ai_used = False

        status, score, violations, recommendations = result

        check = await self.repo.create(
            project_id=project_id,
            data=data,
            status=status,
            score=score,
            violations={"items": [v.model_dump() for v in violations]},
            recommendations={"items": recommendations},
            ai_used=ai_used,
            created_by=created_by,
        )
        return _to_response(check)

    async def get_status(self, project_id: uuid.UUID) -> ComplianceStatusSummary:
        """プロジェクトの最新コンプライアンス状態サマリーを返す。"""
        latest = await self.repo.get_latest(project_id)
        if latest is None:
            return ComplianceStatusSummary(
                project_id=project_id,
                latest_check_id=None,
                overall_status="NOT_CHECKED",
                overall_score=None,
                critical_violations=0,
                high_violations=0,
                last_checked_at=None,
            )

        violations: list[dict] = []
        if latest.violations_json and "items" in latest.violations_json:
            violations = latest.violations_json["items"]

        critical = sum(1 for v in violations if v.get("severity") == "CRITICAL")
        high = sum(1 for v in violations if v.get("severity") == "HIGH")

        return ComplianceStatusSummary(
            project_id=project_id,
            latest_check_id=latest.id,
            overall_status=latest.status,
            overall_score=latest.score,
            critical_violations=critical,
            high_violations=high,
            last_checked_at=latest.checked_at,
        )

    async def get_history(
        self,
        project_id: uuid.UUID,
        page: int = 1,
        per_page: int = 20,
    ) -> tuple[list[ComplianceCheckResponse], int]:
        offset = (page - 1) * per_page
        items = await self.repo.get_history(project_id, limit=per_page, offset=offset)
        total = await self.repo.count_history(project_id)
        return [_to_response(c) for c in items], total


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

_CheckResult = tuple[str, int, list[ComplianceViolation], list[str]]


def _to_response(check) -> ComplianceCheckResponse:
    """ORM ComplianceCheck → ComplianceCheckResponse Pydantic モデル変換。"""
    violations: list[ComplianceViolation] = []
    if check.violations_json and "items" in check.violations_json:
        for v in check.violations_json["items"]:
            try:
                violations.append(ComplianceViolation(**v))
            except Exception as exc:  # noqa: BLE001
                logger.debug("Skipping malformed violation entry: %s", exc)

    recommendations: list[str] = []
    if check.recommendations_json and "items" in check.recommendations_json:
        recommendations = [
            r for r in check.recommendations_json["items"] if isinstance(r, str)
        ]

    return ComplianceCheckResponse(
        id=check.id,
        project_id=check.project_id,
        check_type=check.check_type,
        status=check.status,
        score=check.score,
        violations=violations,
        recommendations=recommendations,
        ai_used=check.ai_used,
        checked_at=check.checked_at,
        created_by=check.created_by,
    )


async def _call_claude_compliance(client, data: ComplianceCheckRequest) -> _CheckResult:
    """Claude API を呼び出してコンプライアンスチェックを実行する。"""
    parts = [f"コンプライアンスチェック種別: {data.check_type}"]
    if data.project_summary:
        parts.append(f"\nプロジェクト概要:\n{data.project_summary}")
    if data.payment_overdue_days is not None:
        parts.append(f"\n未払い経過日数: {data.payment_overdue_days}日")
    if data.near_miss_count is not None:
        parts.append(f"\n直近のヒヤリハット件数: {data.near_miss_count}件")

    _tool_instruction = (
        "\n\nrun_compliance_check ツールを使って評価結果を返してください。"  # noqa: E501
    )
    user_message = "\n".join(parts) + _tool_instruction

    response = await client.messages.create(
        model=MODEL_LEGAL,
        max_tokens=4096,
        system=COMPLIANCE_SYSTEM_PROMPT,
        tools=[COMPLIANCE_CHECK_TOOL],
        tool_choice={"type": "tool", "name": "run_compliance_check"},
        messages=[{"role": "user", "content": user_message}],
    )

    tool_use = next(
        (b for b in response.content if b.type == "tool_use"),
        None,
    )
    if tool_use is None:
        raise ValueError("Claude did not return tool_use block")

    inp = tool_use.input
    violations = [ComplianceViolation(**v) for v in inp.get("violations", [])]
    return (
        inp["status"],
        int(inp["score"]),
        violations,
        inp.get("recommendations", []),
    )


def _rule_based_compliance(data: ComplianceCheckRequest) -> _CheckResult:
    """API 未設定時のルールベースコンプライアンスチェック。"""
    violations: list[ComplianceViolation] = []
    recommendations: list[str] = []
    score = 100
    check_type = data.check_type

    # --- 下請法チェック ---
    if check_type in ("subcontract_law", "all"):
        if data.payment_overdue_days is not None and data.payment_overdue_days > 60:
            violations.append(
                ComplianceViolation(
                    law="subcontract_law",
                    article="下請代金支払遅延等防止法第2条の2",
                    description=(
                        f"支払期限超過: {data.payment_overdue_days}日経過"
                        "（法定上限60日を超えています）"
                    ),
                    severity="CRITICAL",
                    recommendation="直ちに支払い手続きを実施し、下請業者への遅延利息を支払ってください。",
                )
            )
            score -= 55  # CRITICAL: score must fall below 50 to trigger FAIL status
        elif data.payment_overdue_days is not None and data.payment_overdue_days > 45:
            violations.append(
                ComplianceViolation(
                    law="subcontract_law",
                    article="下請代金支払遅延等防止法第2条の2",
                    description=(
                        f"支払期限が近づいています: {data.payment_overdue_days}日経過（上限60日）"  # noqa: E501
                    ),
                    severity="HIGH",
                    recommendation="至急支払い手続きを開始してください。60日以内に支払いを完了させてください。",
                )
            )
            score -= 20
        recommendations.append(
            "下請代金の支払期限（60日）を社内カレンダーで管理し、定期的に確認してください。"
        )

    # --- 労働安全衛生法チェック ---
    if check_type in ("labor_safety", "all"):
        if data.near_miss_count is not None and data.near_miss_count >= 5:
            violations.append(
                ComplianceViolation(
                    law="labor_safety",
                    article="労働安全衛生法第28条の2",
                    description=(
                        f"ヒヤリハット件数が高水準: {data.near_miss_count}件"
                        "（リスクアセスメントの実施が求められます）"
                    ),
                    severity="HIGH",
                    recommendation="緊急安全ミーティングを開催し、リスクアセスメントを実施してください。",
                )
            )
            score -= 25
        elif data.near_miss_count is not None and data.near_miss_count >= 2:
            violations.append(
                ComplianceViolation(
                    law="labor_safety",
                    article="労働安全衛生法第28条の2",
                    description=(
                        f"ヒヤリハット {data.near_miss_count}件を検知。リスク評価を推奨します。"  # noqa: E501
                    ),
                    severity="MEDIUM",
                    recommendation="リスクアセスメントを実施し、安全対策を強化してください。",
                )
            )
            score -= 10
        recommendations.append(
            "ヒヤリハット報告を月次で集計し、安全管理委員会で議論してください。"
        )

    # --- 建設業法チェック（project_summary から簡易判定） ---
    if check_type in ("construction_law", "all"):
        if data.project_summary:
            # Detect signals of potential issues in project summary
            if "一括下請" in data.project_summary:
                violations.append(
                    ComplianceViolation(
                        law="construction_law",
                        article="建設業法第22条",
                        description="一括下請負の可能性が確認されました。",
                        severity="CRITICAL",
                        recommendation=(
                            "一括下請負は原則禁止です。元請業者が主体的に工事を管理してください。"
                        ),
                    )
                )
                score -= 55  # CRITICAL: score must fall below 50 to trigger FAIL status
            summary = data.project_summary
            if "技術者" not in summary and "主任" not in summary:
                recommendations.append(
                    "主任技術者または監理技術者の配置状況を確認してください（建設業法第26条）。"
                )
        recommendations.append(
            "契約書面に建設業法第19条の必須記載事項が含まれているか確認してください。"
        )

    # Determine status from final score
    score = max(0, score)
    if score >= 85:
        status = "PASS"
    elif score >= 50:
        status = "WARNING"
    else:
        status = "FAIL"

    # Override: any CRITICAL violation forces FAIL regardless of score
    if any(v.severity == "CRITICAL" for v in violations):
        status = "FAIL"

    return status, score, violations, recommendations
