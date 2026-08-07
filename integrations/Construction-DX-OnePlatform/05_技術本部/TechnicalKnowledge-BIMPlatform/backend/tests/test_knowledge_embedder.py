"""Knowledge embedder のフォールバック / Azure mock / 検索テスト (Loop #6)."""
from __future__ import annotations

from types import SimpleNamespace

import pytest

from tech_api.services.knowledge_embedder import (
    cosine_similarity,
    embed_text,
    search_articles,
    set_azure_embed_override,
)


@pytest.mark.asyncio
async def test_embed_text_fallback_deterministic() -> None:
    a = await embed_text("地盤改良の施工事例")
    b = await embed_text("地盤改良の施工事例")
    c = await embed_text("橋梁の補修事例")

    assert a.source == "fallback_hash"
    assert a.dim == len(a.vector) == 1536
    assert a.vector == b.vector
    assert a.vector != c.vector
    assert cosine_similarity(a.vector, b.vector) == pytest.approx(1.0, abs=1e-6)
    assert cosine_similarity(a.vector, c.vector) < 1.0


@pytest.mark.asyncio
async def test_embed_text_uses_azure_when_configured() -> None:
    """Azure OpenAI 呼び出しが mock 経由で行われ source=azure_openai を返す."""
    calls: list[str] = []

    async def fake_azure(text: str) -> list[float]:
        calls.append(text)
        # 16 次元の固定ベクトル (テスト用)
        return [0.1] * 16

    set_azure_embed_override(fake_azure)
    try:
        r = await embed_text("コンクリート打設要領")
    finally:
        set_azure_embed_override(None)

    assert r.source == "azure_openai"
    assert len(calls) == 1 and calls[0] == "コンクリート打設要領"
    assert r.dim == 16
    assert r.vector == [0.1] * 16


@pytest.mark.asyncio
async def test_search_articles_topk_by_cosine() -> None:
    """search_articles が cosine 類似度で top-k を返す."""
    q = await embed_text("RC造の配筋検査")
    target = await embed_text("RC造の配筋検査")
    other = await embed_text("液状化対策の動向")

    art1 = SimpleNamespace(id=1, embedding={"vector": target.vector})
    art2 = SimpleNamespace(id=2, embedding={"vector": other.vector})
    art3 = SimpleNamespace(id=3, embedding=None)  # embedding 欠落
    art4 = SimpleNamespace(id=4)  # embedding 属性なし

    results = search_articles(q.vector, [art1, art2, art3, art4], k=2)
    assert len(results) == 2
    # 完全一致が最上位
    assert results[0][1].id == 1
    assert results[0][0] == pytest.approx(1.0, abs=1e-6)
    assert results[1][1].id == 2
    assert results[0][0] >= results[1][0]
