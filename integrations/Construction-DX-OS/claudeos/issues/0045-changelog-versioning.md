---
id: "0045"
title: "CHANGELOG.md 作成 + v0.1.0 タグ付け (MVP RC リリース記録)"
status: done
resolved: "2026-05-14"
resolution_pr: "#39"
priority: P2
phase: "Month 5 Stabilize"
labels: [release, documentation, versioning]
created: "2026-05-14"
---

## Summary

MVP RC (Loop 84, PR #37) を v0.1.0 として記録し、以降のリリース管理の基盤を整える。
CHANGELOG.md を Keep a Changelog 形式で作成し、git タグ v0.1.0 を打つ。

## 対応内容

1. CHANGELOG.md を Keep a Changelog 形式で作成
2. v0.1.0 (MVP RC) のリリースノートを記録
3. `git tag v0.1.0` 打付け + GitHub Releases
4. README のバージョンバッジ更新

## Acceptance Criteria

- [x] CHANGELOG.md が CHANGELOG 形式に従い、v0.1.0 セクションを含む (PR#39)
- [x] `git tag v0.1.0` が main ブランチ最新コミットに存在する (2026-05-14)
- [x] README にバージョンバッジ (v0.1.0) が表示される (PR#39)
- [x] GitHub Release v0.1.0 作成完了

## 関連

- MVP RC 完成: Loop 84 / PR #37
- Admin SPA prebuild: Loop 85 / PR #38
