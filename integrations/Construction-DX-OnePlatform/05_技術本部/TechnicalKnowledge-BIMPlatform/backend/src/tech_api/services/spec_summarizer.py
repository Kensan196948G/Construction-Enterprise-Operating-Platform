"""仕様書 AI 要約サービス.

Azure OpenAI Chat Completion で長文仕様書を 5-7 行に要約する。
未設定 / 失敗時は機械的な抽出要約 (各セクションの先頭文) を返す。
"""
from __future__ import annotations

import re
from dataclasses import dataclass

from ..config import get_settings
from .inquiry_rag import _call_azure_openai_chat


@dataclass
class SummaryResult:
    summary: str
    line_count: int
    source: str  # "azure_openai" or "fallback_extractive"


_SENTENCE_BOUND = re.compile(r"(?<=[。\.!?！？])\s+|\n+")


def _extractive_fallback(text: str, max_lines: int = 7) -> str:
    """機械的抽出要約: 先頭から段落単位で max_lines 行を整形."""
    cleaned = text.strip()
    if not cleaned:
        return "(要約対象テキストが空です)"
    # 見出し (# ...) と本文先頭文を優先採用
    lines: list[str] = []
    for raw in cleaned.splitlines():
        s = raw.strip()
        if not s:
            continue
        if s.startswith("#"):
            lines.append("- " + s.lstrip("# ").strip())
        else:
            # 最初の文だけ採用
            for sent in _SENTENCE_BOUND.split(s):
                sent = sent.strip()
                if sent:
                    lines.append("- " + sent[:140])
                    break
        if len(lines) >= max_lines:
            break
    return "\n".join(lines) if lines else cleaned[:300]


async def summarize_specification(
    text: str,
    *,
    spec_name: str | None = None,
    max_lines: int = 7,
) -> SummaryResult:
    """仕様書本文を Azure OpenAI Chat で 5-7 行に要約する."""
    settings = get_settings()
    text = (text or "").strip()
    if not text:
        return SummaryResult(
            summary="(要約対象テキストが空です)",
            line_count=0,
            source="fallback_extractive",
        )

    use_azure = (
        # _AZURE_CHAT_OVERRIDE は inquiry_rag 側で管理 (共通)
        settings.azure_openai_endpoint and settings.azure_openai_key
    )
    # 明示的に override が設定されている場合も Azure 経由として扱う
    from . import inquiry_rag as _rag

    if _rag._AZURE_CHAT_OVERRIDE is not None:
        use_azure = True

    if use_azure:
        try:
            system = (
                "あなたは建設仕様書の要約アシスタントです。"
                f"以下の仕様書を {max_lines} 行以内の箇条書きにまとめてください。"
                "工種, 適用範囲, 主要な数値基準, 関連法規, 注意事項 を優先してください。"
            )
            user = (
                f"## 仕様書名: {spec_name or '(無名)'}\n\n"
                f"## 本文\n{text[:6000]}\n\n"
                "## 出力\n箇条書き ('- ' から始まる) で簡潔に。"
            )
            content = await _call_azure_openai_chat(system, user)
            summary = content.strip()
            line_count = sum(1 for line in summary.splitlines() if line.strip())
            return SummaryResult(
                summary=summary,
                line_count=line_count,
                source="azure_openai",
            )
        except Exception:
            pass

    summary = _extractive_fallback(text, max_lines=max_lines)
    line_count = sum(1 for line in summary.splitlines() if line.strip())
    return SummaryResult(
        summary=summary,
        line_count=line_count,
        source="fallback_extractive",
    )
