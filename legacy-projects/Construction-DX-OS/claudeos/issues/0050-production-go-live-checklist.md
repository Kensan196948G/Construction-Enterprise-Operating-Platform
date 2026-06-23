---
id: "0050"
title: "本番稼働前チェックリスト (Go-Live Checklist) — 運用準備確認"
status: done
priority: P2
phase: "Month 5 Stabilize"
labels: [production, operations, documentation, checklist]
created: "2026-05-14"
resolved: "2026-05-21"
---

## Summary

本番環境への Go-Live 前に確認すべき事項を網羅したチェックリストを作成する。
`deployment/GO_LIVE_CHECKLIST.md` として配置し、リリース時の手順書とする。

## Acceptance Criteria

- [x] `deployment/GO_LIVE_CHECKLIST.md` が作成されている (114 行)
- [x] インフラ・セキュリティ・監視・バックアップの4セクションを含む (実際は 9 セクション: インフラ/DB/セキュリティ/監視/API スモーク/PXE/バックアップ/運用/Go-Live 判定)
- [x] CI green (main 最終 success)

## 確認 (Loop 88)

`grep "^## "` で確認した結果、すべての要求セクションが含まれている:
1. インフラ / Docker
2. データベース
3. セキュリティ確認
4. 監視 / アラート
5. API / 機能スモークテスト
6. PXE / デバイス登録 (実機テスト)
7. バックアップ
8. ドキュメント / 運用引き継ぎ
9. Go-Live 判定

## 関連

- Issue 0046 (Production Docker)
- Issue 0037 (deployment docs)
