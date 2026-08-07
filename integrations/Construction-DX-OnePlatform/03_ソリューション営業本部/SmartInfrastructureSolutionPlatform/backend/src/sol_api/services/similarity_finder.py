"""類似事例検索 (Azure OpenAI embedding + キーワード fallback).

- 本番: Azure OpenAI ``text-embedding-3-small`` で query / case を埋め込み、
  cosine 類似度で上位 k 件を返す。
- フォールバック: AZURE_OPENAI_ENDPOINT / AZURE_OPENAI_API_KEY が未設定、
  あるいは API 呼び出しに失敗した場合は Jaccard 風キーワード一致でランキング。

DB 側は ``t_sol_case_study.embedding`` (pgvector vector(1536)) を保持し、
事前に埋め込みをキャッシュしておく想定 (alembic 0002 で列追加)。
"""

from __future__ import annotations

import logging
import math
import re
from dataclasses import dataclass

import httpx

from ..config import get_settings

logger = logging.getLogger(__name__)

# text-embedding-3-small / -large 共通で次元 1536 を採用 (small デフォルト)
EMBED_DIM = 1536
EMBED_MODEL_DEFAULT = "text-embedding-3-small"

_TOKEN_RE = re.compile(r"[A-Za-z0-9_]+|[぀-ヿ一-鿿]+")


def _tokenize(text: str) -> set[str]:
    if not text:
        return set()
    return {t.lower() for t in _TOKEN_RE.findall(text) if len(t) >= 2}


@dataclass(frozen=True)
class CaseDoc:
    case_id: int
    title: str
    summary: str
    tags: list[str]
    embedding: list[float] | None = None  # 事前計算済みベクトル (任意)


@dataclass(frozen=True)
class SimilarityHit:
    case_id: int
    title: str
    score: float  # 0.0 - 1.0


def cosine(a: list[float], b: list[float]) -> float:
    """cosine 類似度 (a, b は同次元)."""
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = 0.0
    na = 0.0
    nb = 0.0
    for x, y in zip(a, b):
        dot += x * y
        na += x * x
        nb += y * y
    if na == 0.0 or nb == 0.0:
        return 0.0
    return dot / (math.sqrt(na) * math.sqrt(nb))


def azure_openai_configured() -> bool:
    s = get_settings()
    return bool(s.azure_openai_endpoint and s.azure_openai_api_key)


def embed_text(
    text: str,
    *,
    model: str = EMBED_MODEL_DEFAULT,
    api_version: str = "2024-02-15-preview",
    client: httpx.Client | None = None,
) -> list[float] | None:
    """Azure OpenAI Embeddings 呼び出し. 未設定/失敗時は None.

    ``client`` は test での mock 用 (httpx.Client) を受け取る。
    """
    if not azure_openai_configured():
        return None
    s = get_settings()
    endpoint = (s.azure_openai_endpoint or "").rstrip("/")
    url = f"{endpoint}/openai/deployments/{model}/embeddings?api-version={api_version}"
    headers = {"api-key": s.azure_openai_api_key or "", "Content-Type": "application/json"}
    payload = {"input": text}
    try:
        if client is None:
            with httpx.Client(timeout=15.0) as c:
                resp = c.post(url, headers=headers, json=payload)
        else:
            resp = client.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()
        return list(data["data"][0]["embedding"])
    except Exception as exc:  # noqa: BLE001
        logger.warning("azure embedding failed: %s -> fallback to keyword", exc)
        return None


def _keyword_score(query: str, doc: CaseDoc) -> float:
    q = _tokenize(query)
    if not q:
        return 0.0
    doc_tokens = _tokenize(doc.title) | _tokenize(doc.summary) | {t.lower() for t in doc.tags}
    if not doc_tokens:
        return 0.0
    inter = len(q & doc_tokens)
    union = len(q | doc_tokens)
    return inter / union if union else 0.0


def find_similar(
    query: str,
    cases: list[CaseDoc],
    top_k: int = 5,
    *,
    embed_fn=None,  # type: ignore[no-untyped-def]
) -> list[SimilarityHit]:
    """クエリと類似する事例をランキング.

    1. Azure OpenAI が設定済みかつ ``CaseDoc.embedding`` が事前計算済みなら cosine。
    2. 事前埋め込みが無い場合は query のみ埋め込んで、その場で各 case を埋め込む
       (件数が多いと API コスト増)。
    3. 上記が失敗した場合は Jaccard 係数 fallback。

    ``embed_fn`` は test 用 hook (string -> list[float] | None).
    """
    if not query.strip() or not cases:
        return []

    use_embed = embed_fn is not None or azure_openai_configured()
    hits: list[SimilarityHit] = []

    if use_embed:
        ef = embed_fn or embed_text
        q_vec = ef(query)
        if q_vec is not None:
            ok = True
            for c in cases:
                vec = c.embedding
                if vec is None:
                    doc_text = f"{c.title}\n{c.summary}\n{' '.join(c.tags)}"
                    vec = ef(doc_text)
                if vec is None:
                    ok = False
                    break
                score = cosine(q_vec, vec)
                if score > 0:
                    hits.append(SimilarityHit(case_id=c.case_id, title=c.title, score=score))
            if ok and hits:
                hits.sort(key=lambda h: h.score, reverse=True)
                return hits[:top_k]
            # 失敗時は下に落ちて fallback
            hits.clear()

    # キーワード fallback
    for c in cases:
        score = _keyword_score(query, c)
        if score > 0:
            hits.append(SimilarityHit(case_id=c.case_id, title=c.title, score=score))
    hits.sort(key=lambda h: h.score, reverse=True)
    return hits[:top_k]
