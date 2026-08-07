"""RAG engine: pgvector similarity search + Azure OpenAI prompt assembly.

Embedding generation and chat are wrapped behind small DI-friendly functions
so tests can monkeypatch them without standing up Azure OpenAI. When no
embedding client is available we transparently fall back to keyword scoring.
"""
from __future__ import annotations

import logging
from collections.abc import Iterable, Iterator, Sequence
from dataclasses import dataclass

from sqlalchemy import select, text
from sqlalchemy.orm import Session

from itsm_api.config import get_settings
from itsm_api.models.knowledge_article import KnowledgeArticle

logger = logging.getLogger(__name__)


SYSTEM_PROMPT = (
    "You are the Construction DX IT HelpDesk assistant. "
    "Answer the user's IT question in Japanese using the provided knowledge "
    "base context. Cite article titles. If unsure, say you are unsure."
)


@dataclass
class RagSource:
    article_id: str
    title: str
    score: float
    snippet: str


# ---------------------------------------------------------------------------
# Embedding (DI-friendly)
# ---------------------------------------------------------------------------


def _azure_embed(texts: list[str]) -> list[list[float]]:  # pragma: no cover - external
    settings = get_settings()
    from openai import AzureOpenAI

    client = AzureOpenAI(
        api_key=settings.azure_openai_api_key,
        azure_endpoint=settings.azure_openai_endpoint,
        api_version=settings.azure_openai_api_version,
    )
    resp = client.embeddings.create(
        model=settings.azure_openai_embedding_deployment, input=texts
    )
    return [d.embedding for d in resp.data]


def embed_texts(texts: list[str]) -> list[list[float]] | None:
    """Return embeddings for the given texts, or ``None`` if AOAI not configured."""
    settings = get_settings()
    if not (settings.azure_openai_endpoint and settings.azure_openai_api_key):
        return None
    if not texts:
        return []
    try:
        return _azure_embed(texts)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Embedding call failed; falling back: %s", exc)
        return None


def embed_one(text_in: str) -> list[float] | None:
    out = embed_texts([text_in])
    return out[0] if out else None


# ---------------------------------------------------------------------------
# Retrieval
# ---------------------------------------------------------------------------


def _keyword_score(query: str, article: KnowledgeArticle) -> float:
    q_terms = {t.lower() for t in query.split() if t}
    if not q_terms:
        return 0.0
    haystack = " ".join(filter(None, [article.title, article.summary, article.content])).lower()
    hits = sum(1 for t in q_terms if t in haystack)
    return hits / len(q_terms)


def _keyword_retrieve(db: Session, query: str, k: int) -> list[RagSource]:
    stmt = select(KnowledgeArticle).limit(200)
    articles = db.execute(stmt).scalars().all()
    scored = [(a, _keyword_score(query, a)) for a in articles]
    scored.sort(key=lambda x: x[1], reverse=True)
    out: list[RagSource] = []
    for art, sc in scored[:k]:
        if sc <= 0:
            continue
        snippet = (art.summary or art.content or "")[:300]
        out.append(RagSource(article_id=str(art.article_id), title=art.title, score=sc, snippet=snippet))
    return out


def _vector_retrieve(db: Session, embedding: list[float], k: int) -> list[RagSource]:
    """pgvector cosine-distance search. Lower distance = better."""
    vec_literal = "[" + ",".join(f"{v:.6f}" for v in embedding) + "]"
    sql = text(
        """
        SELECT article_id, title, summary, content,
               embedding <=> CAST(:vec AS vector) AS distance
        FROM t_knowledge_article
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> CAST(:vec AS vector)
        LIMIT :k
        """
    )
    rows = db.execute(sql, {"vec": vec_literal, "k": k}).all()
    out: list[RagSource] = []
    for r in rows:
        distance = float(r.distance) if r.distance is not None else 1.0
        score = max(0.0, 1.0 - distance)
        snippet = (r.summary or r.content or "")[:300]
        out.append(
            RagSource(article_id=str(r.article_id), title=r.title, score=score, snippet=snippet)
        )
    return out


def retrieve(db: Session, query: str, k: int = 3) -> list[RagSource]:
    """Top-k retrieval: pgvector when embeddings available, else keyword."""
    q_emb = embed_one(query)
    if q_emb is not None:
        try:
            results = _vector_retrieve(db, q_emb, k)
            if results:
                return results
        except Exception as exc:  # noqa: BLE001
            logger.warning("pgvector search failed; falling back to keyword: %s", exc)
    return _keyword_retrieve(db, query, k)


# ---------------------------------------------------------------------------
# Prompt + chat (sync + streaming)
# ---------------------------------------------------------------------------


def build_prompt(query: str, sources: Sequence[RagSource]) -> list[dict[str, str]]:
    if sources:
        ctx_lines = [f"[{i+1}] {s.title}\n{s.snippet}" for i, s in enumerate(sources)]
        context = "\n\n".join(ctx_lines)
    else:
        context = "(no related articles found)"
    user = (
        f"参考ナレッジ:\n{context}\n\n"
        f"質問: {query}\n\n"
        "上記ナレッジを参考に、根拠となる記事タイトルを引用しながら答えてください。"
    )
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user},
    ]


def run_chat(messages: Iterable[dict[str, str]]) -> str:
    """Non-streaming chat (kept for compatibility / fallbacks)."""
    settings = get_settings()
    msgs = list(messages)
    if not settings.azure_openai_endpoint or not settings.azure_openai_api_key:
        last_user = next((m["content"] for m in reversed(msgs) if m["role"] == "user"), "")
        return f"[stub-response] {last_user[:200]}"
    from openai import AzureOpenAI  # pragma: no cover - external

    client = AzureOpenAI(  # pragma: no cover
        api_key=settings.azure_openai_api_key,
        azure_endpoint=settings.azure_openai_endpoint,
        api_version=settings.azure_openai_api_version,
    )
    resp = client.chat.completions.create(  # pragma: no cover
        model=settings.azure_openai_deployment, messages=msgs, temperature=0.2
    )
    return resp.choices[0].message.content or ""  # pragma: no cover


def stream_chat(messages: Iterable[dict[str, str]]) -> Iterator[str]:
    """Yield assistant content chunks. Falls back to a single chunk in stub mode."""
    settings = get_settings()
    msgs = list(messages)
    if not settings.azure_openai_endpoint or not settings.azure_openai_api_key:
        last_user = next((m["content"] for m in reversed(msgs) if m["role"] == "user"), "")
        yield f"[stub-response] {last_user[:200]}"
        return
    from openai import AzureOpenAI  # pragma: no cover - external

    client = AzureOpenAI(  # pragma: no cover
        api_key=settings.azure_openai_api_key,
        azure_endpoint=settings.azure_openai_endpoint,
        api_version=settings.azure_openai_api_version,
    )
    stream = client.chat.completions.create(  # pragma: no cover
        model=settings.azure_openai_deployment, messages=msgs, temperature=0.2, stream=True
    )
    for chunk in stream:  # pragma: no cover
        if not chunk.choices:
            continue
        delta = chunk.choices[0].delta
        text_part = getattr(delta, "content", None)
        if text_part:
            yield text_part
