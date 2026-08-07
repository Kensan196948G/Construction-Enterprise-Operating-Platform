"""
Anthropic Claude クライアント（Legal Tech 共通）
シングルトンパターン + ANTHROPIC_API_KEY 未設定時の graceful degradation
"""

from __future__ import annotations

import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

_client = None


def get_anthropic_client():
    """シングルトン Anthropic クライアントを返す。API キー未設定時は None。"""
    global _client

    if _client is not None:
        return _client

    api_key = getattr(settings, "ANTHROPIC_API_KEY", None)
    if not api_key:
        logger.warning("ANTHROPIC_API_KEY is not set — AI analysis will be skipped")
        return None

    try:
        import anthropic  # type: ignore

        _client = anthropic.AsyncAnthropic(api_key=api_key)
        return _client
    except ImportError:
        logger.warning("anthropic package not installed — AI analysis will be skipped")
        return None


# 法的リスク評価ツールスキーマ（Claude tool_use 用）
CONTRACT_ANALYSIS_TOOL = {
    "name": "analyze_construction_contract",
    "description": (
        "建設業法・下請代金支払遅延等防止法（下請法）・労働安全衛生法の観点から"
        "建設工事契約書を解析し、法的リスクを評価する。"
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "risk_score": {
                "type": "string",
                "enum": ["CRITICAL", "HIGH", "MEDIUM", "LOW"],
                "description": "総合リスクレベル",
            },
            "summary": {
                "type": "string",
                "description": "リスク評価の要約（200字以内）",
            },
            "legal_issues": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "law": {
                            "type": "string",
                            "enum": [
                                "construction_law",
                                "subcontract_law",
                                "labor_safety_law",
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
            "payment_term_days": {
                "type": ["integer", "null"],
                "description": (
                    "契約書記載の支払期限（日数）。"
                    "下請法 60日チェック用。記載なしは null。"
                ),
            },
            "has_required_items": {
                "type": "boolean",
                "description": "建設業法第19条の必須記載事項が充足されているか",
            },
        },
        "required": [
            "risk_score",
            "summary",
            "legal_issues",
            "has_required_items",
        ],
    },
}

# 建設業向け法的解析システムプロンプト
CONSTRUCTION_LAW_SYSTEM_PROMPT = """あなたは建設業専門の法務 AI アシスタントです。
以下の法令に精通しており、建設工事契約書の法的リスクを正確に評価できます。

【適用法令】
1. 建設業法: 第19条（契約書面要件）、第19条の3（不当に低い請負代金の禁止）、
   第22条（一括下請負の禁止）、第26条（主任技術者・監理技術者の設置）
2. 下請代金支払遅延等防止法（下請法）:
   - 支払期限: 給付受領後60日以内（第2条の2）
   - 書面交付義務（第3条）
   - 不当減額禁止（第4条）
3. 労働安全衛生法: 安全管理体制、リスクアセスメント義務

【評価基準】
- CRITICAL: 法令違反確定、または重大な法的リスク。即時対応必須。
- HIGH: 違反の蓋然性が高い、または重要書面要件未充足。24時間以内対応。
- MEDIUM: 軽微な不備または改善推奨。1週間以内対応。
- LOW: ベストプラクティス逸脱のみ。情報提供。

必ず日本語で回答してください。"""
