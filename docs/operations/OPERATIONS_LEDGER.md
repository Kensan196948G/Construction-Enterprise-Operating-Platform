# CEOP 運用台帳

| 周期   | タスク                                 | 担当         | 手順/判定                                                                                                                                                              |
| ------ | -------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 日次   | バックアップ成功確認                   | 運用         | `tail -20 /home/kensan/.ceop/backup.log`。失敗時は再実行し原因記録                                                                                                     |
| 日次   | 保持ポリシー確認                       | 運用         | `ls /home/kensan/.ceop/backups/` で 14 日より古い `ceop-*.db` が残っていないこと（`backup-retention.ts` 自動削除）                                                    |
| 日次   | ヘルス確認                             | 運用         | `tail -50 /home/kensan/.ceop/health.log`。`ALERT` / `still failing` 行がなく、`OK` 行が想定間隔で並んでいること（欠落＝プローブ停止の疑い）。詳細は `MONITORING.md` §3 |
| 日次   | コンテナ状態確認                       | 運用         | `docker inspect ceop-platform --format '{{.State.Health.Status}}'` が `healthy`。`unhealthy` は自動再起動されないため人の確認が必須                                    |
| 週次   | ログ量・ディスク使用率確認             | 運用         | 80% 超で容量増強計画。v0.8.0 以降は `--log-opt max-size=10m --log-opt max-file=3` 適用予定（デプロイ後に `docker inspect` で確認）                                      |
| 週次   | 依存脆弱性スキャン                     | セキュリティ | `pnpm audit --audit-level=high`（CI でも実行）                                                                                                                         |
| 月次   | 権限棚卸し（API キー・ロール）         | セキュリティ | 不要キーの失効・削除                                                                                                                                                   |
| 月次   | 証明書・ドメイン・Secrets 有効期限確認 | 運用         | 期限 30 日前に更新                                                                                                                                                     |
| 四半期 | バックアップ復元試験                   | 運用         | `BACKUP_RESTORE.md` 手順、結果記録                                                                                                                                     |
| 四半期 | 脆弱性・EOL・ライセンス棚卸し          | セキュリティ | Node.js LTS、依存 EOL、ライセンス                                                                                                                                      |
| 四半期 | 容量・レート・予算レビュー             | 運用         | ピークリクエスト、ストレージ、CI 費用                                                                                                                                  |
| 年次   | 障害/rollback/復旧訓練                 | 運用         | Runbook に基づく机上+実機訓練                                                                                                                                          |

すべての作業は日時・担当・結果・残課題を本台帳に記録します。

## 自動化されていない理由

日次項目が人手なのは、**通知先が未確定**だからです（`MONITORING.md` §2）。
`scripts/health-probe.sh` は連続失敗を検知して終了コード 1 と `ALERT` 行を出し、
`CEOP_ALERT_WEBHOOK_URL` 設定時には JSON POST も行いますが、実際の届け先
（PagerDuty / Slack / メール）と資格情報が決まっていません。
通知先と資格情報が確定した時点で、日次のログ確認 3 項目は自動化に置き換えます。

## 実行記録（2026-08-07）

| 日時 (JST) | 内容 | 結果 |
| --- | --- | --- |
| 16:49 | v0.9.0 tag + Release workflow（GHCR 0.9.0・GitHub Release） | ✅ success |
| 16:50 | 事前バックアップ ceop-predeploy-v0.9.0-20260807T074959Z.db（184KB） | ✅ |
| 16:50 | migration 007（ai_actions）本番適用・テーブル検証 | ✅ |
| 16:51 | コンテナ差し替え ceop-platform:v0.9.0（旧 v0.8.3 は ceop-platform-prev-v0803 保持） | ✅ healthy |
| 16:51 | スモーク: /health・/ready・info=0.9.0・protected 401・WebUI・公開 URL | ✅ 全 PASS |
| 16:51 | ゲートウェイ: CEOP_GATEWAY_SERVICES 未設定（P3 で設定・fail-closed） | ✅ 想定どおり |
