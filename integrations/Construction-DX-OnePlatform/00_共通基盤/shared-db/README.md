# cdx-shared-db

Construction DX One Platform の **共通マスタ DB モジュール** です。
PostgreSQL 16 + PostGIS + TimescaleDB を前提に、部門 / 支店 / 従業員 /
発注者 / 工事 / 資材 の各マスタテーブルを SQLAlchemy 2.0 と Alembic で
管理します。

## 提供物

| カテゴリ | 内容 |
| --- | --- |
| パッケージ | `cdx_db` (公開 API: `Base`, `CommonBase`, `session_scope`, 各モデル) |
| マイグレーション | `alembic/` (初回 `0001_init_master`) |
| 初期化 SQL | `init/01_init.sql` (Docker 用、PostGIS/TimescaleDB 拡張) |
| シード | `seeds/seed_master.py` (開発用ダミー) |
| テスト | `tests/test_models.py` (スモーク) |

## 必要環境

- Python 3.12+
- PostgreSQL 16 (PostGIS 3.x / TimescaleDB 2.x 同梱)
- Windows 11 で開発する場合は `psycopg[binary]` がそのまま動作するため
  追加のビルドツールは不要

## 環境変数

リポジトリ直下の `.env.example` に倣って `.env` を作成してください。

```
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=construction_dx
POSTGRES_USER=cdx_user
POSTGRES_PASSWORD=change_me
POSTGRES_SSL_MODE=disable
```

## セットアップ (Windows 11)

PowerShell 7+ を想定しています。

```powershell
cd D:\Construction-DX-OnePlatform\00_共通基盤\shared-db

# 仮想環境
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1

# インストール (editable + dev)
pip install -U pip
pip install -e ".[dev]"
```

## DB 起動 (Docker)

リポジトリ直下の `docker-compose.yml` で PostgreSQL を起動し、
`init/01_init.sql` を `/docker-entrypoint-initdb.d/` にマウントすると
PostGIS / TimescaleDB 拡張が自動作成されます。

```yaml
services:
  postgres:
    image: timescale/timescaledb-ha:pg16
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - ./00_共通基盤/shared-db/init:/docker-entrypoint-initdb.d:ro
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"
```

## マイグレーション

```powershell
# 現在のリビジョン確認
alembic current

# head まで適用
alembic upgrade head

# 1 段戻す
alembic downgrade -1

# 新規リビジョンをモデル差分から自動生成
alembic revision --autogenerate -m "add some column"
```

`alembic/env.py` は `cdx_db.config.DBSettings` から sync DSN
(`postgresql+psycopg://`) を取得します。`alembic.ini` の
`sqlalchemy.url` はプレースホルダなので変更不要です。

## シード投入

```powershell
# 先に alembic upgrade head を完了させてから
python -m seeds.seed_master
```

冪等に書かれているので複数回実行しても安全です。

## テスト

```powershell
pytest -q
```

DB レスのスモークテストのみが含まれます。実 DB に対する結合テストは
将来別途追加します。

## ライセンス

社内利用専用 (Proprietary - Internal Use Only)。
