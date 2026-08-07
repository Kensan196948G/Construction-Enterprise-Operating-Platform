# PostgreSQL Deployment Guide

cdx-os-server の永続ストレージとして PostgreSQL 17 を本番構成で立ち上げる手順です。
**Phase 2 以降、Postgres は必須**（InMemoryStorage は開発専用）。

> 関連: [`../README.md`](../README.md) | [`../systemd/README.md`](../systemd/README.md)

---

## 前提

- OS: Ubuntu 22.04 LTS / Debian 12 / RHEL 9 系のいずれか
- PostgreSQL **17 系**（ホストインストール または Docker いずれも可）
- ディスク: 初期 10GB / 月次成長見積 1〜3GB（device_event ログ保持に依存）
- ネットワーク: cdx-os-server から Postgres の TCP 5432 へ到達可能

---

## 構成パターン

### A. Docker Compose（推奨：ステージング / 中規模本番）

`docker-compose.yml` の `postgres` サービスを利用：

```bash
# .env を作成（POSTGRES_PASSWORD を強い値に）
cp .env.example .env
sed -i 's/change-me-generate-a-random-password-here/'"$(openssl rand -base64 32)"'/' .env
chmod 600 .env

# Postgres のみ起動
docker compose up -d postgres

# ヘルスチェック
docker compose exec postgres pg_isready -U cdx
# → /var/run/postgresql:5432 - accepting connections
```

ボリューム: `postgres-data` (Docker named volume)。
ホストパスに固定したい場合は `docker-compose.override.yml` で
`/var/lib/cdx-postgres:/var/lib/postgresql/data` にバインド。

### B. ホストインストール（推奨：単一サーバー本番）

```bash
sudo apt update && sudo apt install -y postgresql-17 postgresql-client-17
sudo systemctl enable --now postgresql

# DB / role 作成
sudo -u postgres psql <<'SQL'
CREATE ROLE cdx WITH LOGIN PASSWORD 'REPLACE_WITH_STRONG_PASSWORD';
CREATE DATABASE cdx OWNER cdx;
GRANT ALL PRIVILEGES ON DATABASE cdx TO cdx;
SQL
```

`pg_hba.conf` に以下の行（cdx-os-server が同ホスト上の場合）：

```
local   cdx             cdx                                     scram-sha-256
host    cdx             cdx             127.0.0.1/32            scram-sha-256
host    cdx             cdx             ::1/128                 scram-sha-256
```

リモートから接続する場合は `listen_addresses = '*'` と
`pg_hba.conf` で対象ネットワークを明示すること。

---

## DATABASE_URL の決定

```ini
# /etc/cdx-os/server.env （systemd EnvironmentFile）
DATABASE_URL=postgresql+asyncpg://cdx:STRONG_PASSWORD@localhost:5432/cdx
```

- driver は **asyncpg**（runtime）/ **psycopg2** （Alembic 用に互換）両対応
- パスワードに `@`, `:`, `/` が含まれる場合は URL encoding 必須
  （`python -c "from urllib.parse import quote_plus; print(quote_plus('YOUR_PASS'))"`）

接続プール設定（任意）：

| 変数 | 既定 | 用途 |
|---|---|---|
| `CDX_DB_POOL_SIZE` | 5 | 通常コネクション数 |
| `CDX_DB_MAX_OVERFLOW` | 10 | バースト時の追加上限 |
| `CDX_DB_POOL_RECYCLE` | 300 | 接続再利用秒数 (PG idle timeout 対策) |
| `CDX_DB_POOL_TIMEOUT` | 30 | acquire 待ち上限 |

---

## Alembic マイグレーション

リポジトリの `server/api/migrations/versions/` に管理されている。

```bash
cd server/api
# DATABASE_URL を環境に渡す
export DATABASE_URL="postgresql+asyncpg://cdx:STRONG_PASSWORD@localhost:5432/cdx"

# 現在の HEAD を確認
.venv/bin/alembic current

# 最新まで適用
.venv/bin/alembic upgrade head

# 適用済みリビジョン履歴
.venv/bin/alembic history --verbose
```

現在管理されているマイグレーション（2026-05-06 時点）：

| Revision | 内容 |
|---|---|
| `0001_initial_schema` | `device`, `device_event`, `audit_log` などのコアテーブル |
| `0002_iso_build_jobs` | `iso_build_job`, `iso_build_audit` (Issue 0023) |

> CI で `alembic upgrade head` の冪等性を SQLite `aiosqlite` 上で検証している
> （`server/api/tests/test_alembic_migrate.py` 相当）。

---

## 動作確認

```bash
# 1. Postgres 接続テスト
psql "$DATABASE_URL" -c "SELECT version();"

# 2. cdx-os-server 起動 → /healthz が 200
curl -fsS http://localhost:8300/api/v1/healthz

# 3. テーブル一覧
psql "$DATABASE_URL" -c "\dt"
# → device, device_event, audit_log, iso_build_job, iso_build_audit, alembic_version
```

---

## チューニング指針

| 項目 | 目安 | 備考 |
|---|---|---|
| `shared_buffers` | RAM の 25% | Postgres 既定 128MB は本番では小さい |
| `effective_cache_size` | RAM の 50〜75% | プランナのヒント |
| `max_connections` | 100 | アプリ pool size + 監視ツール分 |
| `wal_compression` | `on` | WAL サイズ削減 |
| `log_min_duration_statement` | `500ms` | スロークエリ検知 |

> 大量端末を抱える場合は、`device_event` テーブルへの partitioning を検討
> （Issue 化候補: 端末数 1000 を超えたら）

---

## トラブルシュート

| 症状 | 切り分け |
|---|---|
| `connection refused` | Postgres 起動状態 / `listen_addresses` / firewall |
| `password authentication failed` | `pg_hba.conf` の認証方式 / パスワード URL encoding |
| `relation "device" does not exist` | `alembic upgrade head` 未実行 |
| `role "cdx" does not exist` | DB を別ホストから流用した場合に発生。role を再作成 |
| `too many connections` | `CDX_DB_POOL_SIZE` を絞る / Postgres `max_connections` を上げる |

---

## バックアップ / リストア

別ガイドに分離: [`../backup/README.md`](../backup/README.md)
