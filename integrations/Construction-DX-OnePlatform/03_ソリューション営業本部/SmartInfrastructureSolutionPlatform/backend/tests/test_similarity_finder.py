"""類似事例検索のユニットテスト.

Azure OpenAI は実呼び出しせず mock embed_fn を注入。
"""

from __future__ import annotations

from sol_api.services.similarity_finder import (
    CaseDoc,
    cosine,
    find_similar,
)


# ----- 1. 実 API mock 経路 (embed_fn 注入) -----
def test_find_similar_uses_embedding_when_available() -> None:
    cases = [
        CaseDoc(case_id=1, title="port DX", summary="container yard", tags=["port"]),
        CaseDoc(case_id=2, title="solar farm", summary="renewable", tags=["solar"]),
        CaseDoc(case_id=3, title="bridge inspection", summary="aging", tags=["bridge"]),
    ]

    # 単純なハッシュベクトル (test 用)
    def fake_embed(text: str) -> list[float]:
        # 'port' が含まれる文書 / クエリは vector[0]=1.0、それ以外は他軸を立てる
        v = [0.0, 0.0, 0.0]
        t = text.lower()
        if "port" in t:
            v[0] = 1.0
        if "solar" in t:
            v[1] = 1.0
        if "bridge" in t:
            v[2] = 1.0
        return v

    hits = find_similar("port automation", cases, top_k=3, embed_fn=fake_embed)
    assert hits, "expected at least one hit"
    # トップは case_id=1 (port)
    assert hits[0].case_id == 1
    assert hits[0].score > 0.9  # 同軸 cosine = 1.0


# ----- 2. fallback: embed_fn が None を返す -> Jaccard -----
def test_find_similar_fallback_to_keyword_when_embed_fails() -> None:
    cases = [
        CaseDoc(case_id=10, title="港湾自動化システム", summary="port DX project", tags=["port"]),
        CaseDoc(case_id=11, title="ダム改修", summary="dam repair", tags=["dam"]),
    ]

    def broken_embed(_: str) -> list[float] | None:
        return None  # 常に None -> fallback

    hits = find_similar("port dx", cases, top_k=2, embed_fn=broken_embed)
    # キーワードで case_id=10 が引っかかる
    assert any(h.case_id == 10 for h in hits)


# ----- 3. 検索順序 (score 降順) -----
def test_find_similar_returns_results_in_descending_score_order() -> None:
    cases = [
        CaseDoc(case_id=1, title="dam repair", summary="aging concrete dam", tags=["dam"]),
        CaseDoc(
            case_id=2,
            title="port DX automation",
            summary="container handling DX",
            tags=["port", "dx"],
        ),
        CaseDoc(case_id=3, title="random", summary="unrelated", tags=[]),
    ]
    hits = find_similar("port DX", cases, top_k=3)
    # キーワード fallback でも案件2 が トップになるはず
    assert hits[0].case_id == 2
    # 降順チェック
    scores = [h.score for h in hits]
    assert scores == sorted(scores, reverse=True)


def test_cosine_basic() -> None:
    assert cosine([1.0, 0.0], [1.0, 0.0]) == 1.0
    assert cosine([1.0, 0.0], [0.0, 1.0]) == 0.0
    assert cosine([], [1.0]) == 0.0
