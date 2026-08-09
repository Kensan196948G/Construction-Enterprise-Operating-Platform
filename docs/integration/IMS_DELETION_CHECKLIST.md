# Civil-Construction-IMS 削除判定チェックリスト

対象: https://github.com/Kensan196948G/Civil-Construction-IMS（既定ブランチ main）
判定日: 2026-08-09 / 判定者: CTO（主任エージェント）
凡例: ✅ 満たす / ⚠️ 条件付き（残作業あり） / ❌ 未達

| # | 条件 | 状態 | 根拠・残作業 |
|---|---|---|---|
| 1 | 移行台帳が 100% 判定・実施済み | ✅ | `docs/integration/IMS_MIGRATION_LEDGER.md` に全機能を判定・実装。API/データモデル/監査/権限は CEOP へ統合済み |
| 2 | 必要なコード・データ・文書・設定例・ライセンス表記を移管 | ✅ | `integrations/Civil-Construction-IMS/` スナップショット・移行台帳・NOTICE 更新・import スクリプト |
| 3 | Git 履歴・最終 commit SHA・Issue・PR・リリースを保存 | ✅ | `reports/ims-archive/civil-construction-ims.bundle`（最終 commit `51351a4b`）、issues.json 50 件・pulls.json 37 件 |
| 4 | 中核のビルド・主要テスト・E2E・CI・データ移行検証が成功 | ✅ | ローカル build ✅・テスト 398/398 ✅・parity 27/27 ✅・PR #40 CI（Typecheck/Lint/Test・Build・Security Audit・**E2E (Playwright)**）全成功 ✅・一時 SQLite への実 import（3 件）✅。本番 DB への実 import はデプロイ時に実施 |
| 5 | 旧リポジトリへの依存・URL・Webhook・Actions・デプロイ・外部参照がゼロ | ✅ | 参照は `integrations/`・`reports/`・文書・import スクリプトのみ。ランタイム依存なし |
| 6 | 中核単独で主要業務を再現・バックアップ/ロールバック検証済み | ✅ | ISO 主要業務は API + `/iso-app` で再現 ✅。本番 DB コピーで import 3 件 → バックアップ → 削除 → 復元 3 件を実演 ✅（2026-08-09） |
| 7 | 統合報告書と削除判定チェックリストが完成 | ✅ | 本チェックリスト + `docs/integration/IMS_MIGRATION_LEDGER.md` + 統合報告書 |
| 8 | 削除対象が Civil-Construction-IMS であることを直前に再確認 | ✅ | 2026-08-09 削除直前に `gh repo view` で nameWithOwner=`Kensan196948G/Civil-Construction-IMS`・branch=main を再確認。ユーザー Y 承認済み |

## 判定結果

**全条件 ✅ — 削除実行済み（2026-08-09）**。
最終ミラー: `/var/backups/ceop-ims-absorption-20260809/Civil-Construction-IMS.git`

## 残作業（削除前に実施またはユーザー判断）

1. PR（`feat/ims-integration-v0.11.0`）の GitHub Actions 成功 ✅（#40 全ジョブ pass）。
2. 本番 v0.11.0 デプロイ・スモーク・本番 DB コピーでの import/復元実演は実施済み ✅。
3. 連携先トークン（`CEOP_INTEGRATION_TOKEN_*`）は各システム側の Access/API 認証提供後に設定して疎通確認する。
4. ユーザーは削除を Y と承認済み（2026-08-09）。削除対象を再確認して GitHub からリポジトリ削除を実行する。
