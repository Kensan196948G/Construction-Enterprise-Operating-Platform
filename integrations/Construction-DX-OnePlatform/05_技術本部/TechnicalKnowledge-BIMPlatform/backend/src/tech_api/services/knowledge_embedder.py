"""ナレッジ記事の埋め込みベクトル生成サービス (Loop #6 強化).

- 本番: Azure OpenAI ``text-embedding-3-small`` (1536 次元) を呼び出す。
- フォールバック: API キー未設定の場合、決定論的ハッシュベースの擬似ベクトルを返す。
  これにより オフライン環境でも全文検索 + 類似度 (cosine) の単体テストを通せる。

Loop #6 追加:
- 実 Azure OpenAI 呼び出しの mock 注入 (テスト用 ``_AZURE_EMBED_OVERRIDE``)
- ``search_articles`` ヘルパ: top-k cosine 検索 (pgvector が無くても動作)
"""
from __future__ import annotations

import hashlib
import math
from dataclasses import dataclass
from typing import Any, Awaitable, Callable, Optional

from ..config import get_settings


@dataclass
class EmbeddingResult:
    vector: list[float]
    model: str
    dim: int
    source: str  # "azure_openai" or "fallback_hash"


# テスト用フック: 本番 Azure 呼び出しを差し替える
_AZURE_EMBED_OVERRIDE: Optional[Callable[[str], Awaitable[list[float]]]] = None


def set_azure_embed_override(
    fn: Optional[Callable[[str], Awaitable[list[float]]]],
) -> None:
    """テストや代替実装で Azure 呼び出しを差し替えるフック."""
    global _AZURE_EMBED_OVERRIDE
    _AZURE_EMBED_OVERRIDE = fn


def _hash_fallback(text: str, dim: int) -> list[float]:
    """ハッシュベースの決定論的擬似 embedding (テスト/開発用)."""
    seed = hashlib.sha256(text.encode("utf-8")).digest()
    out: list[float] = []
    buf = seed
    while len(out) < dim:
        buf = hashlib.sha256(buf).digest()
        for i in range(0, len(buf), 4):
            if len(out) >= dim:
                break
            n = int.from_bytes(buf[i : i + 4], "big", signed=False)
            out.append((n / 0xFFFFFFFF) * 2.0 - 1.0)
    # L2 normalize
    norm = math.sqrt(sum(v * v for v in out)) or 1.0
    return [v / norm for v in out]


async def _call_azure_openai_embedding(text: str) -> list[float]:
    """Azure OpenAI Embedding API を呼び出してベクトルを返す."""
    settings = get_settings()
    if _AZURE_EMBED_OVERRIDE is not None:
        return await _AZURE_EMBED_OVERRIDE(text)

    import httpx  # 遅延 import

    url = (
        f"{settings.azure_openai_endpoint.rstrip('/')}/openai/deployments/"
        f"{settings.azure_openai_embed_deployment}/embeddings?api-version=2024-02-15-preview"
    )
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            url,
            headers={"api-key": settings.azure_openai_key or ""},
            json={"input": text},
        )
        resp.raise_for_status()
        data = resp.json()
        return data["data"][0]["embedding"]


async def embed_text(text: str) -> EmbeddingResult:
    """テキストを embedding ベクトルへ変換する."""
    settings = get_settings()
    dim = settings.embedding_dim

    use_azure = (
        _AZURE_EMBED_OVERRIDE is not None
        or (settings.azure_openai_endpoint and settings.azure_openai_key)
    )
    if use_azure:
        try:
            vector = await _call_azure_openai_embedding(text)
            return EmbeddingResult(
                vector=vector,
                model=settings.azure_openai_embed_deployment,
                dim=len(vector),
                source="azure_openai",
            )
        except Exception:
            # フォールバック
            pass

    return EmbeddingResult(
        vector=_hash_fallback(text, dim),
        model="fallback-sha256",
        dim=dim,
        source="fallback_hash",
    )


def cosine_similarity(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    na = math.sqrt(sum(x * x for x in a)) or 1.0
    nb = math.sqrt(sum(y * y for y in b)) or 1.0
    return dot / (na * nb)


def search_articles(
    query_vector: list[float],
    articles: list[Any],
    k: int = 10,
) -> list[tuple[float, Any]]:
    """クエリベクトルと記事リストから top-k 類似記事を返す.

    各 article は ``embedding`` 属性 (dict with "vector") を保持する想定。
    pgvector が利用できない/未マイグレーション環境のためのインメモリ実装。
    """
    scored: list[tuple[float, Any]] = []
    for art in articles:
        emb = getattr(art, "embedding", None)
        vec = emb.get("vector") if isinstance(emb, dict) else None
        if not vec:
            continue
        scored.append((cosine_similarity(query_vector, vec), art))
    scored.sort(key=lambda x: x[0], reverse=True)
    return scored[:k]
