---
id: "0036"
title: "README に月次進捗バーナー（Month 1-6 完了率）を追加"
status: done
priority: P3
phase: "Month 4 Quality"
labels: [docs, readme, ux]
created: "2026-05-06"
closed: "2026-05-06"
closed_by_loop: 72
---

## Summary

README 冒頭に「6ヶ月計画の現在地」を可視化するセクションを追加し、
利用者・ステークホルダーに「いま Month 何で、何が完了し、残期間がどれだけか」
を一目で示す。

## 表示内容

```
🗓️ Month 1-2 (Build): ████████████░░ 85%  (Phase 1+2 ISO Builder UI 完了)
🗓️ Month 3-4 (Quality): ████████░░░░░░ 60% (Coverage gate / Grafana / PG永続化 完了)
🗓️ Month 5 (Stabilize):  ░░░░░░░░░░░░░░  0%
🗓️ Month 6 (Release):    ░░░░░░░░░░░░░░  0%
```

## Acceptance Criteria

- [x] README 冒頭（タイトル直下）にバーナー追加
- [x] state.json の `loop_history` から自動生成 or 静的記載（CTO 判断）→ 静的採用
- [x] 月次進捗の数値はラフでよい（CTO 推定値）

## 実装サマリ (Loop 72)

PR: TBD（main 直前に小規模 docs commit、CI required check 適用外パス）

### 配置

`# 建設DX OS` タイトル + tagline 直後、`## ✨ プロジェクト概要` の直前に
新規セクション `## 📊 6ヶ月計画 進捗バナー` を挿入。

### 表示内容

| 要素 | 内容 |
|---|---|
| 現在日付 / 残日数 | 2026-05-06 / 残 157 日 |
| 現在 Loop / Phase | Loop 72 / Month 4 Quality |
| Month 1-2 (Build) | 100% ✅ Phase 1+2 完了 |
| Month 3-4 (Quality) | 70% 🔄 (coverage 98.83% / PG永続化 / Grafana / deployment / audit gap) |
| Month 5 (Stabilize) | 0% ⏳ |
| Month 6 (Release) | 0% ⏳ |

進捗バーは Markdown 罫線文字 (`█` / `░`) を 20 文字で構成し、5% 単位で可視化。

### 採用判断

- 自動生成は YAML/JSON parser を README に持ち込むことになり過剰。Issue AC も「静的記載 or 自動生成、CTO 判断」のため静的採用
- 数値は state.json の loop_history から手動推定 (作業完了率ベース)。次ループで再見直し
