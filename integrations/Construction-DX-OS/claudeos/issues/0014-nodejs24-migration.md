---
id: "0014"
title: "GitHub Actions Node.js 24 対応 (2026-06-02 期限)"
status: done
priority: P2
phase: "Phase 7"
labels: [ci, devops, infra]
created: "2026-04-22"
deadline: "2026-06-02"
---

## Summary

GitHub Actions ランナーが 2026-06-02 に Node.js 20 → 24 へ強制切替予定。
現在の CI で使用している全 actions (`checkout@v4`, `setup-python@v5` 等) が
Node.js 20 ベースで動作しているため、deprecation warning が出ている。
期限前に Node.js 24 互換性を検証・対応する。

## 影響する CI ジョブ

| ジョブ | 使用 action | 警告 |
|---|---|---|
| cdx-agent / cdx-server | `actions/checkout@v4` | ⚠️ Node.js 20 deprecated |
| cdx-agent / cdx-server | `actions/setup-python@v5` | ⚠️ Node.js 20 deprecated |
| sdk-check | `actions/setup-node@v4` | ⚠️ Node.js 20 deprecated |
| sdk-check | `actions/setup-java@v4` | ⚠️ Node.js 20 deprecated |

## 対応方針

### Option A: 環境変数でオプトイン（即時対応、推奨）
```yaml
env:
  FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true
```
CI ワークフロー全体に追加し、Node.js 24 で動作することを確認する。

### Option B: action バージョン固定更新
各 action を Node.js 24 サポート版にピン留めする。

## Acceptance Criteria

- [ ] `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` を `.github/workflows/ci.yml` に追加
- [ ] CI が警告なしで green になる（Node.js 20 deprecation warning 消滅）
- [ ] 全 6 ジョブが引き続き success

## 参照

- GitHub Blog: https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/
- 強制切替日: 2026-06-02
- Node.js 20 ランナー削除日: 2026-09-16
