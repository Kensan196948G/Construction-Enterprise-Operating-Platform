---
id: "0031"
title: "テストカバレッジ計測 + 低カバレッジモジュール補強"
status: done
priority: P2
phase: "Month 3-4 Quality"
labels: [testing, quality, coverage]
created: "2026-05-06"
resolved: "2026-05-14"
---

## Summary

現在 199 テストが存在するが、ブランチカバレッジを測定していない。
Month 3-4 品質フェーズに向けて、カバレッジを計測し低いモジュールにテストを追加する。

## 対応内容

1. `pytest --cov=cdx_server --cov-report=html` でカバレッジ計測
2. 目標: 行カバレッジ 90% 以上
3. 不足しているテストの特定と追加（特に `storage_pg.py`, `obs/` 配下）
4. CI に `--cov-fail-under=85` を追加してカバレッジゲートを設ける

## Acceptance Criteria

- [x] `pytest --cov` が CI で動作する
- [x] 行カバレッジが 85% 以上 — **実績: 98.76%** (Loop 86 / 2026-05-14)
- [x] カバレッジレポートが GitHub Actions Summary に出力される (.github/scripts/coverage_summary.py)

## 解決メモ

Loop 75-85 のテスト強化により、カバレッジが 85% → 98.76% に到達。
`--cov-fail-under=85` は CI で稼働中 (server/api/pyproject.toml)。
