"""技術問合せ RAG (Retrieval-Augmented Generation) サービス.

問合せ -> ナレッジ検索 (embedding) -> Azure OpenAI Chat Completion -> 引用付き回答。

Azure OpenAI 未設定時のフォールバック:
top-3 記事を結合してテンプレ回答を組み立てる。
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Awaitable, Callable, Optional

from ..config import get_settings
from .knowledge_embedder import embed_text, search_articles


@dataclass
class Citation:
    article_id: int
    title: str
    score: float


@dataclass
class RagAnswer:
    answer: str
    citations: list[Citation]
    source: str  # "azure_openai" or "fallback_template"


# テスト用 Azure Chat フック
_AZURE_CHAT_OVERRIDE: Optional[Callable[[str, str], Awaitable[str]]] = None


def set_azure_chat_override(
    fn: Optional[Callable[[str, str], Awaitable[str]]],
) -> None:
    global _AZURE_CHAT_OVERRIDE
    _AZURE_CHAT_OVERRIDE = fn


async def _call_azure_openai_chat(system: str, user: str) -> str:
    settings = get_settings()
    if _AZURE_CHAT_OVERRIDE is not None:
        return await _AZURE_CHAT_OVERRIDE(system, user)

    import httpx  # 遅延 import

    url = (
        f"{settings.azure_openai_endpoint.rstrip('/')}/openai/deployments/"
        f"{settings.azure_openai_chat_deployment}/chat/completions"
        f"?api-version=2024-02-15-preview"
    )
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            url,
            headers={"api-key": settings.azure_openai_key or ""},
            json={
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                "temperature": 0.2,
                "max_tokens": 800,
            },
        )
        resp.raise_for_status()
        data = resp.json()
        return data["choices"][0]["message"]["content"]


def _build_prompt(question: str, articles: list[tuple[float, Any]]) -> tuple[str, str]:
    system = (
        "あなたは建設業の技術相談に答える上級エンジニアです。"
        "提供された参考記事を根拠に、簡潔かつ正確に日本語で回答してください。"
        "回答末尾に [#記事ID] 形式で引用元を必ず明記し、根拠が不足する場合はその旨を述べてください。"
    )
    refs = []
    for score, art in articles:
        title = getattr(art, "title", "")
        body = getattr(art, "body_markdown", "") or ""
        snippet = body[:400]
        refs.append(f"# 記事 #{art.id} (cos={score:.3f}) {title}\n{snippet}")
    refs_block = "\n\n".join(refs) if refs else "(参考記事なし)"
    user = (
        f"## 質問\n{question}\n\n"
        f"## 参考記事\n{refs_block}\n\n"
        "## 出力\n5-10行で回答し、最後に [#ID] で引用してください。"
    )
    return system, user


def _fallback_answer(question: str, articles: list[tuple[float, Any]]) -> str:
    if not articles:
        return (
            f"質問「{question}」に対応する関連記事が見つかりませんでした。"
            "担当者の手動回答をお待ちください。"
        )
    bullets = []
    for score, art in articles[:3]:
        title = getattr(art, "title", "")
        bullets.append(f"- 記事 #{art.id} {title} (類似度 {score:.2f})")
    refs_list = "\n".join(bullets)
    citations = " ".join(f"[#{art.id}]" for _, art in articles[:3])
    return (
        f"以下の関連記事を参考にしてください:\n{refs_list}\n"
        f"詳細は各記事を参照してください。{citations}"
    )


async def generate_rag_answer(
    question: str,
    articles: list[Any],
    top_k: int = 5,
) -> RagAnswer:
    """質問 + 候補記事から RAG 回答を生成する."""
    settings = get_settings()
    q_emb = await embed_text(question)
    ranked = search_articles(q_emb.vector, articles, k=top_k)

    citations = [
        Citation(
            article_id=getattr(a, "id", 0),
            title=getattr(a, "title", ""),
            score=score,
        )
        for score, a in ranked
        if getattr(a, "id", None) is not None
    ]

    use_azure = (
        _AZURE_CHAT_OVERRIDE is not None
        or (settings.azure_openai_endpoint and settings.azure_openai_key)
    )
    if use_azure:
        try:
            system, user = _build_prompt(question, ranked)
            text = await _call_azure_openai_chat(system, user)
            return RagAnswer(
                answer=text.strip(),
                citations=citations,
                source="azure_openai",
            )
        except Exception:
            pass

    return RagAnswer(
        answer=_fallback_answer(question, ranked),
        citations=citations,
        source="fallback_template",
    )
