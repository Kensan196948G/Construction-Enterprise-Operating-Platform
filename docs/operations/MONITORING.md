# CEOP 監視設計

対象本番環境: `https://ceop.mirai-dx-platform.com`
（Docker コンテナ `ceop-platform` + `cloudflared-ceop.service`。詳細は `RUNBOOK.md`）

このファイルは **実装済みの監視** と **未実装の目標設計** を明確に分けて記載します。
目標設計を実装済みとして読めてしまう状態が過去に発生したため、章を分離しています。

---


### Prometheus メトリクス（P4）

- `GET /metrics`（loopback 3120）が `ceop_http_requests_total` と runtime gauges
  （audit/notifications/ai-actions/workflow-instances/gateway-services）を text format で公開。
- `CEOP_METRICS_TOKEN` 設定時は Bearer 必須（公開 ingress では `/metrics` を Tunnel 分割で非公開にすること）。
- 構成資産: `deploy/prometheus/prometheus.yml`・`deploy/grafana/provisioning/`。
  実機導入は `docker compose --profile monitoring up -d`（loopback 9090/3001・read-only・cap-drop ALL）。

## 1. 実装済みの監視

| #   | 仕組み              | 実体                                                                                    | 検知できること                                        | 通知                         |
| --- | ------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------- | ---------------------------- |
| 1   | コンテナ内 liveness | `Dockerfile` の `HEALTHCHECK`（30 秒間隔 / timeout 10 秒 / 3 回連続失敗で `unhealthy`） | プロセスが `/health` に応答しない                     | **なし**（下記の注意を参照） |
| 2   | 外形プローブ        | `scripts/health-probe.sh`（cron・`/health/ready` を外部 URL 経由で取得）                | Tunnel・TLS・DNS を含む経路全体の不通、readiness 失敗 | ログ追記 + 終了コード 1      |
| 3   | バックアップ成否    | cron の `sqlite-backup.ts`（`/home/kensan/.ceop/backup.log`）                           | バックアップ失敗                                      | ログ追記のみ                 |

### ⚠️ HEALTHCHECK は誰にも通知しない

コンテナの再起動ポリシーは `unless-stopped` で、これは**コンテナが終了したとき**に再起動します。
Docker の `HEALTHCHECK` が `unhealthy` を立てても再起動は起きず、そのまま稼働し続けます。
つまり #1 は「状態を記録する」だけで、**人にも自動処理にも伝わりません**。
経路全体の異常を実際に検知する手段は現状 #2 の外形プローブだけです。

### 外形プローブの設計理由

`MONITORING.md` は当初から「3 回連続失敗でアラート」を掲げていましたが、
cron から `curl` を 1 回叩くだけでは連続失敗を表現できません（各実行は自分の結果しか知らない）。
`scripts/health-probe.sh` は連続失敗回数をディスク上に保持し、この方針を実際に実装します。

| ログ種別                                 | 意味                               | 終了コード |
| ---------------------------------------- | ---------------------------------- | ---------- |
| `OK`                                     | 応答成功。カウンタを 0 に戻す      | 0          |
| `WARN`                                   | 失敗したが閾値未満                 | 0          |
| `ALERT`                                  | 閾値に到達した瞬間（1 回だけ出力） | 1          |
| `WARN ... still failing (N consecutive)` | 閾値超過後の継続失敗               | 1          |
| `RECOVERED`                              | 障害継続後の復旧。継続回数を併記   | 0          |

設定は環境変数で上書きします。

| 変数                    | 既定値                                            |
| ----------------------- | ------------------------------------------------- |
| `CEOP_HEALTH_URL`       | `https://ceop.mirai-dx-platform.com/health/ready` |
| `CEOP_HEALTH_LOG`       | `/home/kensan/.ceop/health.log`                   |
| `CEOP_HEALTH_STATE`     | `/home/kensan/.ceop/health-probe.state`           |
| `CEOP_HEALTH_THRESHOLD` | `3`                                               |
| `CEOP_HEALTH_TIMEOUT`   | `10`（秒）                                        |

**成功も必ず記録します。** 失敗時だけ書き込むログは、「一度も失敗していない」のか
「プローブ自体が動いていない」のかを区別できません（実際に旧 cron ではログファイルが
存在せず、どちらであるか判別できませんでした）。

状態ファイルが破損・欠損した場合はカウンタ 0 から再開します。
ディスクが飛んだことでアラートが黙るのは、失敗の方向として誤っているためです。

### cron 登録

```cron
# 5 分間隔の外形プローブ（3 回連続失敗 = 15 分の不通で ALERT）
*/5 * * * * /home/kensan/Projects/Mirai-DX-Project/Construction-Enterprise-Operating-Platform/scripts/health-probe.sh
```

動作確認は `scripts/health-probe.test.ts`（`pnpm run test` に含まれる）で自動検証しています。

### WebUI（ceop-webui / port 3130）の監視

WebUI 配信サービスにも liveness エンドポイントがあります。

```bash
curl -fsS http://127.0.0.1:3130/healthz
# → {"status":"ok","service":"ceop-webui","version":"0.7.0",...}
```

- `scripts/webui-deploy.sh` はデプロイ直後に `/healthz` を最大 10 秒ポーリングし、
  失敗した場合は非 0 で終了します（デプロイ時の検証は自動）。
- 常時監視の cron 外形プローブは **設定済み（2026-08-07）**。API 側 #2 と同じ
  `health-probe.sh` を `https://ceop.mirai-dx-platform.com/healthz` 対象で 5 分間隔実行し、
  `/home/kensan/.ceop/webui-health.log` に記録します（systemd の `Restart=on-failure`・
  デプロイ時検証・Neon アクセスログと併用）。
- アクセス動向は Neon `ceop-production` の `webui_access_log` テーブルで確認できます
  （ページヒットのみ記録。アセット単位のヒットは記録しません）。

```sql
-- 直近のアクセス概況
SELECT date_trunc('hour', occurred_at) AS hour, count(*) AS hits
FROM webui_access_log GROUP BY 1 ORDER BY 1 DESC LIMIT 24;
```

---

## 2. 未実装（目標設計）

以下は **設計のみで、動いていません**。実装済みとして扱わないでください。

| 項目                                    | 現状                                                                 | 必要なもの                                                                                                               |
| --------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 通知経路（PagerDuty / Slack / メール）  | **プローブ側は実装済み**（`CEOP_ALERT_WEBHOOK_URL` 設定時に ALERT/RECOVERED を JSON POST）。通知先の決定と資格情報の設定は未実施 | 通知先の決定と `CEOP_ALERT_WEBHOOK_URL` の設定（Secrets 管理が必要）                                                     |
| アラートダッシュボード                  | **存在しない**                                                       | メトリクス収集基盤の導入が前提                                                                                           |
| レイテンシ SLI（p95）                   | **未計測**                                                           | リクエストごとの所要時間の収集・集計                                                                                     |
| エラー率 SLI                            | **未計測**                                                           | 5xx 比率の集計                                                                                                           |
| 可用性 SLI（月間 2xx 割合）             | **未計測**（プローブのログから事後集計は可能だが自動化されていない） | プローブログの集計ジョブ                                                                                                 |
| 認証失敗率（401/429 急増）              | **未実装**                                                           | 構造化ログの集計                                                                                                         |
| 監査ログ破損検知                        | `verify()` は実装済みだが**定期実行されていない**                    | 定期実行ジョブ + 結果の通知                                                                                              |
| リソース監視（CPU / メモリ / ディスク） | **未実装**                                                           | ホスト側メトリクス収集                                                                                                   |
| コンテナログのローテーション            | **未設定**（`json-file` ドライバの既定＝サイズ上限なし）             | `--log-opt max-size` / `max-file` の指定。`docker-compose.prod.yml` には記載済みだが本番は `docker run` 運用のため未適用 |

### SLI / SLO（目標値・未計測）

| SLI              | 定義                           | SLO    |
| ---------------- | ------------------------------ | ------ |
| 可用性           | `/health/ready` 2xx の月間割合 | 99.5%  |
| レイテンシ       | `/api/v1/dashboard` の p95     | 500 ms |
| エラー率         | 5xx の全リクエスト比           | < 1%   |
| バックアップ成功 | 直近 7 日間の成功数            | 7/7    |

### アラート重大度（通知経路の実装後に適用）

- **P0**: readiness 3 回連続失敗、認証不能、監査ログ破損
- **P1**: エラー率 > 1%、ディスク使用率 > 80%、バックアップ失敗 2 回連続
- **P2**: レイテンシ SLO 超過、メモリ使用率 > 85%

---

## 3. 当面の運用手順（通知経路が無い間）

通知が自動化されるまでは、**人が定期的にログを読む**ことが唯一の伝達手段です。

| 周期 | 担当 | 手順                                                                | 判定基準                                                                                              |
| ---- | ---- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 日次 | 運用 | `tail -50 /home/kensan/.ceop/health.log`                            | `ALERT` / `still failing` 行がないこと。`OK` 行が想定間隔で並んでいること（欠落はプローブ停止の疑い） |
| 日次 | 運用 | `tail -20 /home/kensan/.ceop/backup.log`                            | 直近のバックアップが成功していること                                                                  |
| 日次 | 運用 | `docker inspect ceop-platform --format '{{.State.Health.Status}}'`  | `healthy` であること                                                                                  |
| 週次 | 運用 | `docker logs --since 168h ceop-platform \| grep -c ' 5[0-9][0-9] '` | 5xx の急増がないこと                                                                                  |
