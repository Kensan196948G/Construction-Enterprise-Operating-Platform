# Construction-DX-OS Runbook — 障害対応手順書

> バージョン: v1.0-rc1  
> 最終更新: 2026-06-17  
> 対象環境: 本番 Docker Compose / Kubernetes

---

## 目次

1. [障害分類と SLO](#1-障害分類と-slo)
2. [監視エンドポイント一覧](#2-監視エンドポイント一覧)
3. [初動チェックリスト](#3-初動チェックリスト)
4. [API サーバー障害 (500/503)](#4-api-サーバー障害-500503)
5. [データベース接続障害](#5-データベース接続障害)
6. [Redis 障害](#6-redis-障害)
7. [ログ確認コマンド](#7-ログ確認コマンド)
8. [ヘルスチェック 503 対応フロー](#8-ヘルスチェック-503-対応フロー)
9. [エスカレーション基準](#9-エスカレーション基準)

---

## 1. 障害分類と SLO

| 優先度 | 影響範囲                                        | 対応開始目標 | 復旧目標 (RTO) |
| ------ | ----------------------------------------------- | ------------ | -------------- |
| **P1** | 全サービス停止 / API 全応答不能                 | 15 分以内    | 1 時間以内     |
| **P2** | 機能縮退 (一部エンドポイント障害 / DB 接続不可) | 30 分以内    | 4 時間以内     |
| **P3** | 軽微影響 (メトリクス欠落 / ログ欠損)            | 翌営業日     | 1 週間以内     |

---

## 2. 監視エンドポイント一覧

| エンドポイント      | ポート | 用途                           | 期待応答                                |
| ------------------- | ------ | ------------------------------ | --------------------------------------- |
| `GET /health/live`  | 8000   | Liveness probe (プロセス死活)  | `{"status":"ok"}` 200                   |
| `GET /health/ready` | 8000   | Readiness probe (依存確認)     | `{"status":"ok"}` 200 / degraded 時 503 |
| `GET /health`       | 8000   | レガシー互換 (= /health/ready) | 同上                                    |
| `GET /metrics`      | 8000   | Prometheus メトリクス          | text/plain 200                          |
| Prometheus UI       | 9090   | クエリ・アラート確認           | —                                       |
| Grafana             | 3000   | ダッシュボード                 | —                                       |

**ヘルスレスポンスの `status` フィールド:**

```json
// 正常
{"status": "ok", "storage": "ok", "redis": "ok"|"disabled"}

// 異常 (HTTP 503)
{"status": "degraded", "storage": "error", ...}
```

---

## 3. 初動チェックリスト

障害報告を受けたら **5 分以内** に以下を実施:

```bash
# 1. API サーバー死活確認
curl -sf http://localhost:8000/health/live && echo "LIVE" || echo "DOWN"

# 2. 依存サービス確認
curl -sf http://localhost:8000/health/ready | python3 -m json.tool

# 3. コンテナ状態確認
docker compose ps

# 4. 直近エラーログ確認 (最新 50 行)
docker compose logs --tail=50 cdx-server | grep -E "ERROR|CRITICAL|Exception"
```

---

## 4. API サーバー障害 (500/503)

### 4.1 全 API が 500 を返す

```bash
# スタックトレース確認
docker compose logs cdx-server | grep -A 10 "Traceback"

# アプリ再起動
docker compose restart cdx-server

# 再起動後の確認
curl -sf http://localhost:8000/health/live
```

**よくある原因:**

- 環境変数 `CDX_REGISTRATION_TOKEN` 未設定 → WARNING ログのみ、起動は継続
- `DATABASE_URL` が誤っている → PostgresStorage 初期化失敗で 500

### 4.2 `/health/ready` が 503 を返す

→ [セクション 8](#8-ヘルスチェック-503-対応フロー) を参照

### 4.3 特定エンドポイントのみ 500

```bash
# リクエスト ID でログを絞り込む (X-Request-ID ヘッダーを確認)
docker compose logs cdx-server | grep "request-id=<YOUR_ID>"
```

---

## 5. データベース接続障害

### 5.1 症状確認

```bash
# health/ready の storage フィールドを確認
curl -s http://localhost:8000/health/ready | python3 -c "import sys,json; h=json.load(sys.stdin); print(h['storage'], h['storage_backend'])"
```

`storage: "error"` が返る場合は PostgreSQL 障害。

### 5.2 PostgreSQL コンテナ確認

```bash
# コンテナ状態
docker compose ps cdx-postgres

# PostgreSQL ログ
docker compose logs --tail=100 cdx-postgres

# 手動接続テスト
docker compose exec cdx-postgres psql -U cdxuser -d cdxdb -c "SELECT 1;"
```

### 5.3 DB 復旧手順

```bash
# 1. コンテナ再起動
docker compose restart cdx-postgres

# 2. 30 秒待機後に接続テスト
sleep 30 && docker compose exec cdx-postgres psql -U cdxuser -d cdxdb -c "SELECT 1;"

# 3. cdx-server を再起動して接続プールをリセット
docker compose restart cdx-server
```

### 5.4 フォールバック動作

`DATABASE_URL` 未設定時: `InMemoryStorage` にフォールバック。
**注意:** InMemoryStorage はサーバー再起動でデータが失われる。本番では必ず `DATABASE_URL` を設定すること。

---

## 6. Redis 障害

### 6.1 症状確認

```bash
curl -s http://localhost:8000/health/ready | python3 -c "import sys,json; h=json.load(sys.stdin); print('redis:', h.get('redis'))"
```

| `redis` の値 | 意味                        |
| ------------ | --------------------------- |
| `"ok"`       | 正常                        |
| `"disabled"` | `REDIS_URL` 未設定 (想定内) |
| `"error"`    | 接続失敗                    |

### 6.2 Redis コンテナ確認

```bash
docker compose ps cdx-redis
docker compose logs --tail=50 cdx-redis
docker compose exec cdx-redis redis-cli ping
```

### 6.3 フォールバック動作

`REDIS_URL` が設定されているが Redis が不通の場合: **`InMemoryRateLimiter` にフォールバック**
(`server/api/cdx_server/app.py` の `_build_default_rate_limiter()` 参照)。

- レート制限は動作継続 (メモリ内)
- 複数インスタンス間でのレート制限共有は失われる
- Redis 復旧後に `docker compose restart cdx-server` でリセット

```bash
# Redis 再起動
docker compose restart cdx-redis

# 接続確認
docker compose exec cdx-redis redis-cli ping
# → PONG が返れば正常
```

---

## 7. ログ確認コマンド

### 7.1 基本ログ確認

```bash
# リアルタイムログ
docker compose logs -f cdx-server

# 直近 N 行
docker compose logs --tail=100 cdx-server

# 時刻指定 (直近1時間)
docker compose logs --since=1h cdx-server
```

### 7.2 エラー絞り込み

```bash
# ERROR / CRITICAL のみ
docker compose logs cdx-server | grep -E '"level":"(ERROR|CRITICAL)"'

# 特定リクエスト ID の追跡
docker compose logs cdx-server | grep '"request_id":"<ID>"'

# HTTP 5xx エラーのみ
docker compose logs cdx-server | grep '"status_code": 5'
```

### 7.3 systemd 環境 (非 Docker)

```bash
journalctl -u cdx-server -n 100 --no-pager
journalctl -u cdx-server --since "1 hour ago"
```

### 7.4 Prometheus でエラー率を確認

```
# クエリ例 (Prometheus UI: http://localhost:9090)
rate(cdx_requests_total{status=~"5.."}[5m])
```

---

## 8. ヘルスチェック 503 対応フロー

```
/health/ready が 503 を返す
│
├─ storage: "error" ?
│   ├─ YES → セクション 5 (PostgreSQL 障害) を参照
│   └─ NO  ↓
│
├─ redis: "error" ?
│   ├─ YES → セクション 6 (Redis 障害) を参照
│   └─ NO  ↓
│
└─ それ以外 → docker compose logs cdx-server でスタックトレース確認
              → 解決しない場合はセクション 9 (エスカレーション) へ
```

**Kubernetes 環境での注意:**

- `livenessProbe` → `/health/live` : ストレージ依存なし。この probe が失敗した場合は pod が再起動される
- `readinessProbe` → `/health/ready` : 503 の場合は pod が LB から切り離される (再起動しない)

---

## 9. エスカレーション基準

| 状況                        | アクション                                     |
| --------------------------- | ---------------------------------------------- |
| P1 障害が 15 分で解決しない | 開発チームに即時連絡                           |
| DB データ破損の疑い         | 書き込み停止 → バックアップ取得 → 開発チームへ |
| セキュリティインシデント    | 即時サービス停止 → セキュリティ担当に連絡      |
| 同一障害が週 3 回以上       | P1 扱いで根本原因調査 Issue 起票               |

### 連絡先・リソース

- GitHub Issues: https://github.com/Kensan196948G/Construction-DX-OS/issues
- バックアップ手順: `scripts/cdx-pg-backup.sh`
- スモークテスト: `scripts/smoke-test.sh`
- デプロイチェックリスト: `docs/10_開発・品質管理/05_v1-release-checklist.md`
