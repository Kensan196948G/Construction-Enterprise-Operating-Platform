"""技術問合せ RAG サービスの単体テスト."""
from __future__ import annotations

from types import SimpleNamespace

import pytest

from tech_api.services.inquiry_rag import generate_rag_answer, set_azure_chat_override
from tech_api.services.knowledge_embedder import embed_text


@pytest.mark.asyncio
async def test_rag_fallback_when_azure_not_configured() -> None:
    """Azure 未設定時はテンプレート回答 + 引用付きを返す."""
    question = "配筋検査の手順を教えて"
    # 質問と完全一致のテキストで埋め込んだ記事を top に来るようにする (hash fallback)
    e_top = await embed_text(question)
    e2 = await embed_text("RC造の配筋ピッチ")
    e3 = await embed_text("橋梁の塗装仕様")

    arts = [
        SimpleNamespace(
            id=1, title="配筋検査要領", body_markdown="配筋の検測…",
            embedding={"vector": e_top.vector},
        ),
        SimpleNamespace(
            id=2, title="RC配筋ガイド", body_markdown="ピッチの基準…",
            embedding={"vector": e2.vector},
        ),
        SimpleNamespace(
            id=3, title="橋梁塗装", body_markdown="塗装仕様…",
            embedding={"vector": e3.vector},
        ),
    ]
    result = await generate_rag_answer(question, arts, top_k=3)

    assert result.source == "fallback_template"
    assert len(result.citations) == 3
    # 完全一致記事 (#1) が top
    assert result.citations[0].article_id == 1
    assert result.citations[0].score == pytest.approx(1.0, abs=1e-6)
    assert "[#1]" in result.answer
    assert "見つかりませんでした" not in result.answer


@pytest.mark.asyncio
async def test_rag_uses_azure_chat_with_citations() -> None:
    """Azure Chat が呼ばれ、応答テキストと引用が返る."""
    e1 = await embed_text("液状化対策のサンドコンパクション工法")
    arts = [
        SimpleNamespace(
            id=42,
            title="液状化対策事例",
            body_markdown="サンドコンパクション工法の適用例…",
            embedding={"vector": e1.vector},
        ),
    ]

    seen_user: list[str] = []

    async def fake_chat(system: str, user: str) -> str:
        seen_user.append(user)
        return "サンドコンパクション工法が有効です。 [#42]"

    set_azure_chat_override(fake_chat)
    try:
        result = await generate_rag_answer("液状化対策の代表的な工法は?", arts, top_k=3)
    finally:
        set_azure_chat_override(None)

    assert result.source == "azure_openai"
    assert result.answer.startswith("サンドコンパクション")
    assert "[#42]" in result.answer
    assert len(result.citations) == 1
    assert result.citations[0].article_id == 42
    # プロンプトに参考記事が埋め込まれた
    assert seen_user and "記事 #42" in seen_user[0]
