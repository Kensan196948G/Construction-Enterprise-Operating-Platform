"""仕様書 AI 要約のテスト."""
from __future__ import annotations

import pytest

from tech_api.services.spec_summarizer import summarize_specification


@pytest.mark.asyncio
async def test_summarize_specification_extractive_fallback() -> None:
    """Azure 未設定時は機械的抽出要約 + 箇条書きを返す."""
    text = (
        "# 適用範囲\n"
        "本仕様書はコンクリート構造物の打設要領を定める。\n"
        "対象は土木構造物全般。\n\n"
        "# 材料\n"
        "セメントは普通ポルトランドセメントを基本とする。\n"
        "細骨材は JIS A 5308 に準拠。\n\n"
        "# 施工\n"
        "打設温度は 5〜35℃ の範囲内とする。\n"
    )
    result = await summarize_specification(text, spec_name="コンクリート打設要領")
    assert result.source == "fallback_extractive"
    assert result.line_count >= 3
    # 箇条書き形式
    assert "- " in result.summary
    # 適用範囲のキーワードが含まれる
    assert "適用範囲" in result.summary
