"""RAG prompt construction tests."""
from itsm_api.services.rag_engine import RagSource, build_prompt


def test_prompt_includes_system_and_user() -> None:
    sources = [
        RagSource(article_id="a1", title="VPN接続トラブル", score=0.9, snippet="FortiClient再起動"),
        RagSource(article_id="a2", title="Entra MFA再設定", score=0.6, snippet="Authenticator再登録"),
    ]
    msgs = build_prompt("VPNがつながらない", sources)
    assert msgs[0]["role"] == "system"
    assert msgs[1]["role"] == "user"
    assert "VPN接続トラブル" in msgs[1]["content"]
    assert "Authenticator再登録" in msgs[1]["content"]
    assert "VPNがつながらない" in msgs[1]["content"]


def test_prompt_no_sources() -> None:
    msgs = build_prompt("test", [])
    assert "no related articles" in msgs[1]["content"]
