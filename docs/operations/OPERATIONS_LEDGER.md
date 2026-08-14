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

## 実行記録（2026-08-07・P5 本番切替）

| 日時 (JST) | 内容 | 結果 |
| --- | --- | --- |
| 18:33 | parity 検証（FEATURE_INVENTORY 突合 + API 24 プローブ + migration 24 件） | ✅ |
| 18:34 | migration 016〜024 欠落を検出・復元（PR #37） | ✅ |
| 18:40 | v0.10.0 修正版 tag（a005ab6）・Release workflow success（GHCR） | ✅ |
| 18:41 | 本番 migration 001〜024 適用・9 業務テーブル確認 | ✅ |
| 18:42 | コンテナ差し替え v0.10.0（旧 v0.9.0 保持）・スモーク全 PASS（/metrics・/portal 含む） | ✅ |
| 18:45 | Prometheus(19090)/Grafana(13001) 導入（host network・loopback・read-only）・target up | ✅ |

## 実行記録（2026-08-07・P6 削除）

| 日時 (JST) | 内容 | 結果 |
| --- | --- | --- |
| 19:0x | 旧5リポジトリの完全ミラー退避（/var/backups/ceop-repo-absorption-20260807・root 700・fsck OK） | ✅ |
| 19:0x | `gh repo delete` で5リポジトリ削除（ユーザー Y 承認）・GraphQL 不存在確認 | ✅ |
| 19:0x | WORKING_LOG / OPERATIONS_LEDGER へ記録・PR #39 | ✅ |

## 実行記録（2026-08-09・v0.11.0 IMS 吸収）

| 日時 (JST) | 内容 | 結果 |
| --- | --- | --- |
| 20:20 | IMS スナップショット取得・アーカイブ（bundle/issues.json 50/pulls.json 37） | ✅ |
| 20:30〜 | ISO 統合マネジメント実装（domain/persistence/routes/UI/migration 025） | ✅ |
| 20:30〜 | 連携先6システム連携基盤（webhook/event/retry/contract/migration 026） | ✅ |
| 21:0x | AI ガバナンス拡張（evidence/retention/pii/mitigation/利用停止） | ✅ |
| 21:0x | ISO 管理コンソール `/iso-app`（CRUD・状態遷移・分析・連携表示） | ✅ |
| 21:1x | Playwright E2E 追加（`/iso-app` 認証・CRUD・状態遷移・連携表示） | ✅ |
| 21:2x | PR #40 CI: E2E (Playwright) 含む全ジョブ成功 | ✅ |
| 21:3x | イベント自動配送（integration:dispatch）+ 契約 eventTypes 厳格検証 | ✅ |
| 21:5x | v0.11.0 本番デプロイ（PR #40 マージ 804e1bf・migration 025/026・コンテナ差し替え・スモーク全 PASS） | ✅ |
| 21:5x | 本番 DB コピーで import→backup→delete→restore（3 件）実演 | ✅ |
| 21:5x | Tunnel 経路に /iso・/iso-app・/portal 追加・公開確認（/iso 200・/iso-app 401） | ✅ |
| 21:5x | 連携先実 URL 特定・設定（4D/Idea/AI-Build/Atlas/現場LAN）・到達性確認 | ✅ |
| 21:5x | Civil-Construction-IMS 削除（ミラー退避 → `gh repo delete` → 404 確認） | ✅ |
| 22:0x | v0.11.1 検証デプロイ（本番外 3121・本番 DB コピー）スモーク: version/health/CSV/manifest/HMAC 全 PASS | ✅ |
| 22:0x | v0.11.1 本番適用（PR #42 マージ f669114・事前バックアップ ceop-predeploy-v0.11.1-20260809T192926Z・コンテナ差し替え・current タグ更新） | ✅ |
| 22:0x | 本番スモーク: version=0.11.1・public 200 / iso-app 401・metrics 新 gauge・CSV 200・HMAC 401 確認 | ✅ |
| 21:1x | データ移行・復旧実演（import 3 件 → backup → delete → restore 3 件） | ✅ |
| 21:1x | `pnpm run verify` 398/398・parity 27/27・build・audit 0 | ✅ |
| 21:0x | PR `feat/ims-integration-v0.11.0`（#40）CI 全ジョブ成功 | ✅ |

## 実行記録（2026-08-14・v0.13.x MVP/Prototype + 本番ダミーデータ置換）

| 日時 (JST) | 内容 | 結果 |
| --- | --- | --- |
| 08:5x | MVP/Prototype 実装（架空デモデータ一式・デモ CLI・PWA アイコン修正・E2E 拡充）→ PR #50 マージ（ade9efd） | ✅ |
| 09:1x | ブラウザ用デモログイン `/demo-login`（Cookie/JWT・本番無効）→ PR #51 マージ（372ac17） | ✅ |
| 09:3x | MVP 公開 URL `ceop-mvp.mirai-dx-platform.com`（専用 Tunnel `ceop-mvp`）公開 | ✅ |
| 09:4x | 未認証ブラウザアクセスを `/demo-login` へ自動リダイレクト → PR #52 マージ（49dd015） | ✅ |
| 10:1x | 本番 DB 確認: 業務テーブル全 0 件（api_keys 2・audit_log 5・migration 026） | ✅ |
| 10:2x | 本番 DB 事前バックアップ `ceop-predemo-v0.13.2-20260814T012400Z.db` | ✅ |
| 10:2x | 本番 DB へ全架空デモデータ投入（seed-demo・監査チェーン 15 件 valid） | ✅ |
| 10:2x | 本番コンテナ v0.12.1 → v0.13.2 差し替え（旧 `ceop-platform-prev-0121` 保持・ハーデニング維持） | ✅ |
| 10:2x | 本番スモーク: healthy・version=0.13.2・projects=5・ISO=32・監査/連携/通知 API 正常 | ✅ |
