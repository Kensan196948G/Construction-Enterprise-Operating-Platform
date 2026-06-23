---
id: "0001"
title: "Bootstrap: repo skeleton と state.json v8 化"
status: done
priority: P1
phase: "Phase 0"
labels: [bootstrap, infra]
created: "2026-04-15"
closed: "2026-04-15"
---

## Summary

Greenfield リポジトリに `.gitignore`, `claudeos/state.json` (v8), local Issue Factory
(`claudeos/issues/`) を整備する。

## Acceptance Criteria

- [x] `.gitignore` が Python / live-build / IDE / secrets をカバー
- [x] `claudeos/state.json` が CLAUDE.md v8 (max_duration=300min, token allocation) に整合
- [x] `claudeos/issues/README.md` で運用規約を明示
- [x] `cto_decisions.scope_priority` を v6.4 から継承して保持

## 結果

完了。state.json v8.0 に更新し、継承元 (v6.4) を `inherited_from` で明示。
