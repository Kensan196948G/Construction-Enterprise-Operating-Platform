# Issue 0070: Runbook / 障害対応手順書整備

## 概要

Construction-DX-OS の本番運用に向けた Runbook（障害対応手順書）を整備する。
オンコール担当者が障害発生時に迷わず対応できるレベルの手順書を作成する。

## 背景

- v1.0 本番リリース必須ドキュメントとして `next_loop_candidates` に記録済み
- デプロイ手順書 (`docs/10_.../05_v1-release-checklist.md`) は存在するが、障害時の対応手順が未整備
- ヘルスチェックエンドポイント (`/health/live`, `/health/ready`) が整備されており、監視アラートのトリガー条件が明確
- Prometheus メトリクスが実装済み — アラートルールの参照先が存在する

## 受入れ基準

- [x] `docs/09_運用・保守/runbook.md` を新規作成
- [x] 障害分類 (P1/P2/P3) と対応 SLO を定義
- [x] API サーバー障害 (500/503) の対応手順を記載
- [x] データベース接続障害の診断・復旧手順を記載
- [x] Redis 障害時のフォールバック動作説明を記載
- [x] ログ確認コマンド (`docker compose logs`, `journalctl`) を記載
- [x] `/health/ready` が 503 を返す場合の対応フローチャートを記載
- [x] CI green 維持 (PR #64 CI pending → 確認後クローズ)

## ステータス: RESOLVED (Loop 101, 2026-06-17, PR #64 に同梱)

## スコープ

- `docs/09_運用・保守/runbook.md` 新規作成
- 既存コードの変更なし (ドキュメントのみ)

## 対象外

- Grafana ダッシュボード JSON seed (別 Issue)
- アラートルール設定ファイル作成 (別 Issue)

## 優先度: P2 (本番リリース必須)

## 担当: Developer + doc-updater
