# Issue 0052: serial-scan キューのDB永続化

**Priority**: P3 (軽微改善)
**Status**: Resolved (Loop 88, 2026-05-21)
**Phase**: Build
**Created**: 2026-05-14 (Loop 87)
**Resolved**: 2026-05-21 (Loop 88, PR pending)

## 概要

`serial_scan.py` の `_ocr_queue: dict[str, dict]` は In-memory のため、
cdx-server 再起動でキューが消失する。PostgreSQL に移行して再起動耐性を持たせる。

## 要件

- OCRキューアイテムをDBに保存（テーブル: `serial_scan_queue`）
- status: pending / confirmed / discarded
- confirmed アイテムは展開台帳 (`devices` テーブル) に関連付け
- SERIAL_SCAN_MOCK モードでは DB 不要 (インメモリ継続)

## スキーマ案

```sql
CREATE TABLE serial_scan_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename TEXT NOT NULL,
    serial_extracted TEXT NOT NULL,
    serial_confirmed TEXT,
    hostname TEXT,
    profile TEXT DEFAULT 'standard',
    location TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending',  -- pending/confirmed/discarded
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    confirmed_at TIMESTAMPTZ
);
```

## 依存

- Issue 0051: 実機テスト完了後に優先度を上げる
- PostgresStorage (Issue #4) で確立したパターンを踏襲

## 実装結果 (Loop 88)

- `models.py`: `SerialScanQueueModel` 追加（CHECK 制約 + Index）
- `migrations/versions/0003_serial_scan_queue.py`: 新規マイグレーション
- `storage.py`: `SerialScanQueueRecord` dataclass 追加
- `storage_protocol.py`: `SerialScanStorage` Protocol 追加 (runtime_checkable)
- `storage_pg.py`: `PostgresStorage` に Protocol 実装（insert/get/list/confirm/discard）
- `routers/serial_scan.py`: Protocol 検出パターン
  - `isinstance(storage, SerialScanStorage)` → DB path (永続化)
  - 未実装 → in-memory dict fallback (Phase 1 互換性)
- `tests/test_serial_scan.py`: +9 tests (DB path + Protocol check) = 16 total
- Total: 340 server tests + 32 integration tests pass
