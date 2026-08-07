---
id: "0035"
title: "routers/iso_builds.py のテストカバレッジを 90% 以上に引き上げ"
status: done
priority: P3
phase: "Month 4 Quality"
labels: [testing, coverage]
created: "2026-05-06"
resolved: "2026-05-14"
---

## Summary

カバレッジレポートで `routers/iso_builds.py` が 68%（49 行未カバー）と最低スコア。
未カバー範囲: SSE log streaming のエラーパス、cancel エンドポイント、download endpoint の 404/302。

## Acceptance Criteria

- [x] `routers/iso_builds.py` カバレッジが 90% 以上 — **実績: 99%** (Loop 86 / 2026-05-14)
- [x] CI 全体カバレッジが 92% 以上に向上 — **実績: 98.76%**
- [x] 新規テストは既存の `test_iso_builds_*.py` に追加 (Loop 75-85 での対応)

## 解決メモ

Loop 75-85 でSSEエラーパス・cancelエンドポイント・download 404/302 のテストが追加され、
99% カバレッジを達成。CI 全体カバレッジも 98.76% に到達。
