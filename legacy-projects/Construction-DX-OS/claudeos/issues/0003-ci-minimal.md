---
id: "0003"
title: "CI minimal: ruff + pytest on Python 3.11 / 3.12"
status: done
priority: P1
phase: "Phase 0"
labels: [ci, devops]
created: "2026-04-15"
closed: "2026-04-22"
---

## Summary

GitHub Actions で Python 3.11 / 3.12 マトリクスの lint + test を最小構成で回す。
Phase 0 品質ゲートの土台。

## Acceptance Criteria

- [x] `.github/workflows/ci.yml` が push / pull_request / workflow_dispatch をトリガに設定
- [x] matrix: `[3.11, 3.12]` で ruff + pytest を実行
- [x] `docs-lint` job で必須ドキュメントの存在を verify
- [x] GitHub remote 設定後に 1 度 green を確認する → CI run #24753466312 全 6 ジョブ green ✅

## Resolution (2026-04-22)

Issue 0004 クローズ後、CI 3 連続 success を確認。本 Issue の全 AC が満たされた。
