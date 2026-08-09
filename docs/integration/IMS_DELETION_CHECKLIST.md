# Civil-Construction-IMS 削除判定チェックリスト

対象: https://github.com/Kensan196948G/Civil-Construction-IMS（既定ブランチ main）
判定日: 2026-08-09 / 判定者: CTO（主任エージェント）
凡例: ✅ 満たす / ⚠️ 条件付き（残作業あり） / ❌ 未達

| # | 条件 | 状態 | 根拠・残作業 |
|---|---|---|---|
| 1 | 移行台帳が 100% 判定・実施済み | ✅ | `docs/integration/IMS_MIGRATION_LEDGER.md` に全機能を判定・実装。API/データモデル/監査/権限は CEOP へ統合済み |
| 2 | 必要なコード・データ・文書・設定例・ライセンス表記を移管 | ✅ | `integrations/Civil-Construction-IMS/` スナップショット・移行台帳・NOTICE 更新・import スクリプト |
| 3 | Git 履歴・最終 commit SHA・Issue・PR・リリースを保存 | ✅ | `reports/ims-archive/civil-construction-ims.bundle`（最終 commit `51351a4b`）、issues.json 50 件・pulls.json 37 件 |
| 4 | 中核のビルド・主要テスト・E2E・CI・データ移行検証が成功 | ⚠️ | ローカル build ✅・テスト 398/398 ✅・parity 27/27 ✅・PR #40 CI 全成功 ✅・一時 SQLite への実 import（3 件）✅・Playwright E2E（`/iso-app`）追加 ✅。E2E の CI 実行結果と本番 DB への実 import は確認待ち |
| 5 | 旧リポジトリへの依存・URL・Webhook・Actions・デプロイ・外部参照がゼロ | ✅ | 参照は `integrations/`・`reports/`・文書・import スクリプトのみ。ランタイム依存なし |
| 6 | 中核単独で主要業務を再現・バックアップ/ロールバック検証済み | ⚠️ | ISO 主要業務（品質/環境/安全/資産/BIM/監査/是正/ISMS/BCP）は API + `/iso-app` コンソールで再現 ✅。一時 SQLite で import→バックアップ→削除→復元を実演 ✅。本番 DB での実演はデプロイ時に実施 |
| 7 | 統合報告書と削除判定チェックリストが完成 | ✅ | 本チェックリスト + `docs/integration/IMS_MIGRATION_LEDGER.md` + 統合報告書 |
| 8 | 削除対象が Civil-Construction-IMS であることを直前に再確認 | ⏳ | 削除実行直前に `gh repo view Kensan196948G/Civil-Construction-IMS` で再確認し、ユーザーへ Y/N を提示 |

## 残作業（削除前に実施またはユーザー判断）

1. PR（`feat/ims-integration-v0.11.0`）の GitHub Actions 成功 ✅（#40 全ジョブ pass）。
2. 本番/検証環境へ v0.11.0 をデプロイし、ISO API スモークと `import-ims-records` 実 import を実施する。
3. CI で Playwright E2E ジョブ（`/iso-app` の CRUD・状態遷移・連携契約表示）の成功を確認する。
4. バックアップ・ロールバック実演（本番 DB）を実施する。
5. 連携先6システム側の実稼働 URL 設定（`CEOP_INTEGRATION_URL_*`）と疎通確認を実施する。
6. ユーザーが削除を Y と承認した場合のみ、削除対象を再確認して GitHub からリポジトリ削除を実行する。
