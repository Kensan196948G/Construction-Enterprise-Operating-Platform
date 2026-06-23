---
id: "0034"
title: "pytest asyncio EventLoop 後処理警告を解消"
status: done
priority: P3
phase: "Month 3 Quality"
labels: [testing, asyncio, quality]
created: "2026-05-06"
---

## Summary

Verify フェーズで `PytestUnhandledThreadExceptionWarning: RuntimeError: Event loop is closed`
が 3件検出されている。テスト自体は pass するが、CI ログが汚れる。

## 原因

`aiosqlite` が pytest 後処理スレッドでイベントループにアクセスしようとするが、
テスト終了後にループが閉じている状態で発生する。

## 対応方針

`pyproject.toml` の `filterwarnings` に asyncio 関連の警告を追加するか、
`asyncio_default_fixture_loop_scope = "function"` の明示設定で解消を試みる。

## Acceptance Criteria

- [ ] `pytest` 実行後に `PytestUnhandledThreadExceptionWarning` が出力されない
- [ ] テスト数・pass 数は変わらない（199 passed 維持）
