# Civil-Construction-IMS 削除判定チェックリスト

対象: https://github.com/Kensan196948G/Civil-Construction-IMS（既定ブランチ main）
判定日: 2026-08-09 / 判定者: CTO（主任エージェント）
凡例: ✅ 満たす / ⚠️ 条件付き（残作業あり） / ❌ 未達

| # | 条件 | 状態 | 根拠・残作業 |
|---|---|---|---|
| 1 | 移行台帳が 100% 判定・実施済み | ✅ | `docs/integration/IMS_MIGRATION_LEDGER.md` に全機能を判定・実装。API/データモデル/監査/権限は CEOP へ統合済み |
| 2 | 必要なコード・データ・文書・設定例・ライセンス表記を移管 | ✅ | `integrations/Civil-Construction-IMS/` スナップショット・移行台帳・NOTICE 更新・import スクリプト |
| 3 | Git 履歴・最終 commit SHA・Issue・PR・リリースを保存 | ✅ | `reports/ims-archive/civil-construction-ims.bundle`（最終 commit `51351a4b`）、issues.json 50 件・pulls.json 37 件 |
| 4 | 中核のビルド・主要テスト・E2E・CI・データ移行検証が成功 | ⚠️ | ローカル build ✅・テスト 395/395 ✅・parity 27/27 ✅・`import-ims-records` 検証 ✅。PR の GitHub Actions 成功と本番 DB への実 import は未実施 |
| 5 | 旧リポジトリへの依存・URL・Webhook・Actions・デプロイ・外部参照がゼロ | ✅ | 参照は `integrations/`・`reports/`・文書・import スクリプトのみ。ランタイム依存なし |
| 6 | 中核単独で主要業務を再現・バックアップ/ロールバック検証済み | ⚠️ | ISO 主要業務（品質/環境/安全/資産/BIM/監査/是正/ISMS/BCP）は API で再現 ✅。バックアップ/ロールバック手順は `docs/operations/BACKUP_RESTORE.md` に既存。本番 DB での復元実演は未実施 |
| 7 | 統合報告書と削除判定チェックリストが完成 | ✅ | 本チェックリスト + `docs/integration/IMS_MIGRATION_LEDGER.md` + 統合報告書 |
| 8 | 削除対象が Civil-Construction-IMS であることを直前に再確認 | ⏳ | 削除実行直前に `gh repo view Kensan196948G/Civil-Construction-IMS` で再確認し、ユーザーへ Y/N を提示 |

## 残作業（削除前に実施またはユーザー判断）

1. PR（`feat/ims-integration-v0.11.0`）の GitHub Actions 成功を確認する。
2. 本番/検証環境へ v0.11.0 をデプロイし、ISO API スモークと `import-ims-records` 実 import を実施する。
3. IMS の 14 画面相当の UI を CEOP WebUI/ポータルへ完全移植する（現状は `/iso` ランディング + API。設計バンドル編集は別タスク）。
4. バックアップ・ロールバック実演（本番 DB）を実施する。
5. ユーザーが削除を Y と承認した場合のみ、削除対象を再確認して GitHub からリポジトリ削除を実行する。
