---
id: "0037"
title: "deployment/ ディレクトリに包括ドキュメントを整備（PG/Grafana/Prometheus 起動手順）"
status: done
priority: P3
phase: "Month 4 Quality"
labels: [docs, deploy]
created: "2026-05-06"
closed: "2026-05-06"
closed_by_loop: 72
---

## Summary

現在 `deployment/systemd/` 配下に systemd 単体のドキュメントしかない。
本番運用で必要となる「PostgreSQL + cdx-os-server + Prometheus + Grafana」の
フルスタック起動手順を 1 つのガイドにまとめる。

## ドキュメント構成

```
deployment/
├── README.md          ← 本 Issue で新規作成（オーバービュー + index）
├── systemd/README.md  ← 既存（cdx-os-server 単独）
├── postgres/README.md ← 新規（cdxos DB セットアップ）
├── monitoring/README.md ← 新規（Prometheus + Grafana stack）
└── backup/README.md   ← 新規（pg_dump 手順）
```

## Acceptance Criteria

- [x] `deployment/README.md` で 4 サブガイドへリンク + 全体構成図
- [x] 各サブガイドが手順だけで動かせる完全性

## 実装サマリ (Loop 72)

PR: TBD（`session/loop72-deployment-docs` ブランチ）

| ガイド | パス | 行数 | 担当 |
|---|---|---|---|
| 全体 index + 構成図 | `deployment/README.md` | 124 | overview |
| systemd 単独運用 | `deployment/systemd/README.md` | 100 | 既存維持 |
| PostgreSQL 17 構築 | `deployment/postgres/README.md` | 168 | 新規 |
| Prometheus + Grafana | `deployment/monitoring/README.md` | 193 | 新規 |
| pg_dump バックアップ / リストア | `deployment/backup/README.md` | 257 | 新規 |

合計 842 行。各サブガイドは他に依存せず単独で完結（前提・構成パターン A/B・動作確認・トラブルシュート・運用ポリシー）を備える。`deployment/README.md` には 4 サブガイドへの相互リンクと ASCII アーキテクチャ図を含めた。
