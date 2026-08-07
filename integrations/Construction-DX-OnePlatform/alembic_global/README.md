# alembic_global — Construction DX One Platform 統合マイグレーション

## 目的

Loop #1〜#2 で生成された 6 つのバックエンド (shared-auth / shared-db / api-gateway /
04 施工 / 06 安全品質 / 10 ITSM) は、それぞれ独立に `alembic/` を持っている。

本ディレクトリはこれらを **集約する** ためのレイヤーであり、既存サブプロジェクトの
migration を **物理的に統合 (移動 / 削除) はしない**。`scripts/migrate-all.ps1` が
順序を強制したうえで、サブプロジェクト毎の `alembic upgrade head` を順次呼び出す。

## 運用モード

| モード | 利用場面 | コマンド |
| --- | --- | --- |
| **開発 (per-subproject)** | 機能開発・モデル追加 | サブプロジェクト内で `alembic upgrade head` |
| **本番統合 (orchestrated)** | デプロイ・新規環境構築 | リポジトリルートで `./scripts/migrate-all.ps1` |
| **集約 autogenerate (参考用)** | 全テーブル一括 DDL を確認したい時のみ | `alembic_global` から `alembic upgrade head` |

### 開発モード

各部門のエンジニアは自分のサブプロジェクトだけを意識すればよい。

```powershell
# 例: 04 施工
cd 04_施工本部/ConstructionSiteManagementSystem/backend
alembic upgrade head
```

### 本番統合モード

`migrate_log/*.yaml` の `order` 順 (shared=10, site=20, sq=30, itsm=40) で
サブプロジェクト毎の alembic を実行する。これにより、たとえば `cdx_db.Project` を
参照する `site_api` のテーブルが、master 側より先に作られる事故を防げる。

```powershell
./scripts/migrate-all.ps1            # 全部 head へ
./scripts/migrate-all.ps1 -Dry       # 実行せず順序だけ表示
./scripts/migrate-all.ps1 -Only site # site のみ
```

### 集約 autogenerate モード

`env.py` は import 解決可能なサブシステムをすべて `Base.metadata` に集約する。
新規 DB に対して `alembic upgrade head` を直接実行すると、**統合専用 version table
(`alembic_version_global`)** を使った 1 トランザクション昇順適用が行われる。
ただしこのモードは **既存 per-subproject alembic と version table が分離している** ため、
混在運用は禁止 (どちらか片方で運用する)。

## 命名規約 (新規 migration)

```
YYYYMMDD_<subsystem>_<seq>_<desc>.py
```

| subsystem | 領域 |
| --- | --- |
| `shared` | `cdx_db` (master) |
| `site` | 04 施工管理 |
| `sq` | 06 安全品質環境 |
| `itsm` | 10 IT-DX / ITSM |

既存ファイルは互換のため即時改名しない。新規分から本規約を適用し、`migrate_log/*.yaml` の
`heads` に追記する。

## env.py の責務

- `cdx_db.base.Base` を取得
- 以下のサブプロジェクトを動的 import (失敗時はスキップ):
  - `cdx_db.models`
  - `site_api.models`
  - `sq_api.models`
  - `itsm_api.models`
- `DATABASE_URL` 環境変数 → `cdx_db.config.get_db_settings().sync_dsn` の順で接続先解決
- `alembic_version_global` という独立 version table を使い、per-subproject の
  `alembic_version` と干渉しない

## 依存関係 (図)

```
shared-db (cdx_db.models)
   ├── site_api (FK to project / branch / employee)
   ├── sq_api  (FK to project / employee)
   └── itsm_api (FK to employee)
```

この順序を `migrate_log/*.yaml::order` で固定化している。
