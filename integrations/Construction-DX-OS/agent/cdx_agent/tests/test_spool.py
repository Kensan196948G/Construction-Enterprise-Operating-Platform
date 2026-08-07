"""Tests for cdx_agent.spool."""

from __future__ import annotations

from cdx_agent.spool import Spool, SpoolEntry


def _entry(kind: str = "heartbeat", n: int = 1) -> SpoolEntry:
    return SpoolEntry(
        payload_type=kind,
        body={"n": n},
        enqueued_at=1000.0 + n,
    )


def test_append_and_iter_roundtrip(tmp_path):
    spool = Spool(tmp_path / "outbox.jsonl")
    spool.append(_entry("heartbeat", 1))
    spool.append(_entry("inventory", 2))
    got = list(spool.iter_all())
    assert [e.payload_type for e in got] == ["heartbeat", "inventory"]
    assert [e.body for e in got] == [{"n": 1}, {"n": 2}]


def test_load_all_returns_empty_when_file_missing(tmp_path):
    spool = Spool(tmp_path / "outbox.jsonl")
    assert spool.load_all() == []


def test_replace_all_truncates_file(tmp_path):
    spool = Spool(tmp_path / "outbox.jsonl")
    for i in range(3):
        spool.append(_entry(n=i))
    spool.replace_all([])
    assert spool.load_all() == []


def test_replace_all_preserves_subset(tmp_path):
    spool = Spool(tmp_path / "outbox.jsonl")
    for i in range(3):
        spool.append(_entry(n=i))
    kept = spool.load_all()[1:]
    spool.replace_all(kept)
    assert [e.body for e in spool.load_all()] == [{"n": 1}, {"n": 2}]


def test_replace_all_is_atomic_on_rewrite(tmp_path):
    """The temporary write file must be removed after rename — no residue."""
    path = tmp_path / "outbox.jsonl"
    spool = Spool(path)
    spool.append(_entry(n=1))
    spool.replace_all([])
    siblings = list(path.parent.iterdir())
    # Only the canonical file should remain; no .tmp leftover.
    assert siblings == [path]


def test_len_counts_entries(tmp_path):
    spool = Spool(tmp_path / "outbox.jsonl")
    assert len(spool) == 0
    spool.append(_entry(n=1))
    spool.append(_entry(n=2))
    assert len(spool) == 2


def test_entry_serialisation_roundtrip():
    entry = _entry(n=7)
    restored = SpoolEntry.from_dict(entry.to_dict())
    assert restored == entry


def test_spool_handles_unicode_body(tmp_path):
    spool = Spool(tmp_path / "outbox.jsonl")
    spool.append(
        SpoolEntry(payload_type="heartbeat", body={"note": "現場"}, enqueued_at=1.0)
    )
    loaded = spool.load_all()
    assert loaded[0].body == {"note": "現場"}
