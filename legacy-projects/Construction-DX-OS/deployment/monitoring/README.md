# Monitoring Deployment Guide

cdx-os-server の `/metrics`（Prometheus exposition）を Prometheus 3.3 + Grafana 11 で
可視化・アラート発報する手順です。Issue 0027（ダッシュボード）と Issue 0030（アラートルール）
で整備した設定ファイル群を本番ホストへ展開する流れをまとめています。

> 関連: [`../README.md`](../README.md) | [`../postgres/README.md`](../postgres/README.md)

---

## 前提

- cdx-os-server が `:8300/metrics` で Prometheus exposition を返すこと
  （/metrics は専用 bind を想定。外部公開は推奨しない）
- Docker Engine 24+ または Podman 4+ が利用できること
  （ホスト直インストールでも可）
- ネットワーク到達:
  - Prometheus → cdx-os-server `8300/tcp`
  - Grafana → Prometheus `9090/tcp`
  - 運用者 → Grafana `3000/tcp`（リバースプロキシ経由を推奨）

---

## アセット配置

リポジトリにコミット済みの設定一式：

```
monitoring/
├── prometheus.yml                              # scrape 設定（cdx-server:8000/metrics, 15s）
└── grafana/
    ├── dashboards/
    │   └── cdx-server.json                     # ダッシュボード本体（Issue 0027）
    └── provisioning/
        ├── datasources/prometheus.yaml         # Prometheus データソース自動登録
        ├── dashboards/dashboards.yaml          # ダッシュボード自動 provisioning
        └── alerting/
            ├── cdx-server-rules.yaml           # アラートルール（Issue 0030 / 0054）
            ├── contact-points.yaml             # 通知先定義（Issue 0055）
            └── notification-policies.yaml      # ルーティングポリシー（Issue 0055）
```

> **注意**: `prometheus.yml` の `targets` は Docker Compose ネットワーク内の DNS 名
> `cdx-server:8000` を指しています。compose 外で動かす場合は実 IP / ホスト名と
> 公開ポート（既定 8300）に書き換えてください。

---

## 構成パターン

### A. Docker Compose（推奨）

リポジトリ同梱の `docker-compose.yml` に `prometheus` / `grafana` サービスを定義済み。

```bash
# Prometheus + Grafana のみ起動（cdx-server を別ホストで動かす場合）
docker compose up -d prometheus grafana

# cdx-server も同梱で動かす場合
docker compose up -d cdx-server prometheus grafana

# 起動確認
docker compose ps prometheus grafana
curl -fsS http://localhost:9090/-/ready              # Prometheus
curl -fsS http://localhost:3000/api/health           # Grafana
```

### B. ホストインストール

```bash
# Prometheus（systemd で常駐させる場合の最小例）
wget https://github.com/prometheus/prometheus/releases/download/v3.3.0/prometheus-3.3.0.linux-amd64.tar.gz
sudo tar -xzf prometheus-3.3.0.linux-amd64.tar.gz -C /opt/
sudo ln -sfn /opt/prometheus-3.3.0.linux-amd64 /opt/prometheus
sudo cp monitoring/prometheus.yml /etc/prometheus/prometheus.yml

# Grafana（apt 公式リポジトリ）
sudo apt install -y grafana
sudo cp -r monitoring/grafana/provisioning/* /etc/grafana/provisioning/
sudo cp -r monitoring/grafana/dashboards/    /var/lib/grafana/dashboards/
sudo systemctl enable --now grafana-server
```

ホストインストール時は `prometheus.yml` の `targets` を実 IP `["<cdx-host>:8300"]` に
書き換えること。

---

## 環境変数

| 変数                     | 用途                         | 既定                     |
| ------------------------ | ---------------------------- | ------------------------ |
| `GRAFANA_ADMIN_PASSWORD` | Grafana 初期管理者パスワード | `admin`（**変更必須**）  |
| `GF_SERVER_ROOT_URL`     | リバースプロキシ配下の URL   | `http://localhost:3000/` |

`.env` で以下のように設定:

```ini
GRAFANA_ADMIN_PASSWORD=$(openssl rand -base64 24)
```

---

## 観測対象メトリクス

cdx-os-server が公開している Prometheus メトリクス（Issue 0027 で確認済み）：

| メトリクス                  | 型      | 主要ラベル              | 用途                     |
| --------------------------- | ------- | ----------------------- | ------------------------ |
| `cdx_heartbeat_total`       | Counter | `device_id`, `status`   | 端末別ハートビート受信数 |
| `cdx_inventory_total`       | Counter | `device_id`, `status`   | インベントリ受信数       |
| `cdx_rate_limit_hits_total` | Counter | `device_id`, `endpoint` | レート制限ヒット数       |
| `cdx_iso_build_total`       | Counter | `profile`, `status`     | ISO ビルド集計           |
| `cdx_iso_build_audit_total` | Counter | `action`                | ISO ビルド監査ログ操作数 |

> ラベルカーディナリティに注意。`device_id` ラベルは登録端末数だけ系列が増えるため、
> 大規模運用では Prometheus 側で `metric_relabel_configs` による絞り込みを検討する。

---

## ダッシュボード

`monitoring/grafana/dashboards/cdx-server.json` には以下のパネルが含まれます：

- Heartbeat rate（端末別 / グローバル）
- Inventory ingest rate
- Rate limit hits（端末別 top-N）
- ISO build success/failure
- ISO build audit timeline

Grafana 起動後は `http://<host>:3000` の **Dashboards → cdx-server** から自動で表示される
（provisioning 経由）。

---

## アラートルール（Issue 0030 / 0054）

`monitoring/grafana/provisioning/alerting/cdx-server-rules.yaml` で発火条件を定義済み：

| ルール                      | 条件                                                                                    | severity |
| --------------------------- | --------------------------------------------------------------------------------------- | -------- |
| Heartbeat Stopped           | `increase(cdx_ingest_total{endpoint="heartbeat",status="accepted"}[5m]) < 1` を 5分継続 | warning  |
| ISO Build High Failure Rate | `failed / total > 0.2` を 5分継続                                                       | critical |
| Rate Limit Spike            | `rate(cdx_rate_limit_exceeded_total[1m]) * 60 > 10` を 1分継続                          | warning  |

> ⚠️ Issue 0054 でメトリクス名を修正済み。`cdx_heartbeat_total` ではなく
> `cdx_ingest_total{endpoint="heartbeat"}` を使用していることに注意。

---

## アラート通知設定（Issue 0055）

Contact Point と Notification Policy は **リポジトリで provisioning 済み**
（`monitoring/grafana/provisioning/alerting/contact-points.yaml` / `notification-policies.yaml`）。
環境変数を設定するだけで通知が有効になる。

### メール通知の有効化

`.env`（開発）または `.env.prod`（本番）に以下を追加：

```bash
# アラート送信先メールアドレス（複数の場合はカンマ区切り）
CDX_ALERT_EMAIL=ops@example.com

# SMTP サーバー設定
GF_SMTP_ENABLED=true
GF_SMTP_HOST=smtp.example.com:587
GF_SMTP_USER=noreply@example.com
GF_SMTP_PASSWORD=<smtp-password>
GF_SMTP_FROM_ADDRESS=noreply@example.com
```

### Webhook 通知の有効化（Slack など）

```bash
# Slack Incoming Webhook URL を設定
CDX_ALERT_WEBHOOK_URL=https://hooks.slack.com/services/XXX/YYY/ZZZ
```

> `CDX_ALERT_EMAIL` / `CDX_ALERT_WEBHOOK_URL` が未設定のままでも、Grafana は正常起動する（fail-open）。
> アラートは Grafana UI で確認可能だが、外部通知は届かない。

---

## 動作確認

```bash
# 1. Prometheus が cdx-server を scrape できているか
curl -fsS "http://localhost:9090/api/v1/targets" | jq '.data.activeTargets[] | {job: .labels.job, health: .health, lastError: .lastError}'
#   → { "job": "cdx-server", "health": "up", "lastError": "" }

# 2. メトリクスが時系列として記録されているか
curl -fsS "http://localhost:9090/api/v1/query?query=cdx_heartbeat_total" | jq '.data.result | length'
#   → 0 以上の数値（端末がいなくても 0 は許容）

# 3. Grafana のデータソース疎通
curl -fsS -u admin:"$GRAFANA_ADMIN_PASSWORD" \
  "http://localhost:3000/api/datasources/name/Prometheus" | jq '.url'
#   → "http://prometheus:9090"
```

---

## トラブルシュート

| 症状                               | 切り分け                                                                                             |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Prometheus targets が `down`       | cdx-server の `/metrics` 到達確認 / firewall / `prometheus.yml` の target                            |
| Grafana にダッシュボードが見えない | `provisioning/dashboards/dashboards.yaml` のパス / コンテナ内マウント確認                            |
| Alert が発火しない                 | Notification Policy の `service=cdx-server` ラベルマッチ確認 / メール通知は `CDX_ALERT_EMAIL` 設定要 |
| `Datasource Prometheus not found`  | `provisioning/datasources/prometheus.yaml` の `url` がサービス名と一致しているか                     |
| メトリクス系列が増え続ける         | 高カーディナリティラベル (`device_id`) の relabel / drop を検討                                      |

---

## 運用上の注意

- `/metrics` は **Prometheus からのみ** アクセス可能にする（reverse proxy で `Authorization` ヘッダ確認や IP 制限）
- Grafana の `admin` パスワードは初回ログイン時に必ず変更
- Prometheus retention は既定 7 日（`--storage.tsdb.retention.time=7d`）。長期保存が
  必要な場合は外部 TSDB（Mimir / Thanos）への remote_write を検討
