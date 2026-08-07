# migrate_log — サブプロジェクトマイグレーション取り込み履歴

このディレクトリは `alembic_global` がどのサブプロジェクトの何という revision を
取り込んだかを **記録するだけ** の場所であり、実マイグレーションは含まない。

## ファイル運用

サブプロジェクト毎に 1 ファイルを置き、適用順を明示する。形式は YAML 互換の単純な記述。

```
# <subsystem>.yaml
subsystem: site            # site / sq / itsm / shared
order: 30                  # migrate-all.ps1 が昇順で実行する優先度
alembic_dir: 04_施工本部/ConstructionSiteManagementSystem/backend
heads:
  - 20260522_0001_initial_site_tables
  - 20260522_0002_add_photo_s3_key
```

## 命名規約

サブプロジェクトの revision を本リポジトリに新規追加する場合は次の命名に従う:

```
YYYYMMDD_<subsystem>_<seq>_<desc>.py
```

例:

- `20260522_shared_0001_init_master.py`
- `20260522_site_0001_initial_tables.py`
- `20260522_site_0002_add_photo_s3_key.py`
- `20260522_sq_0001_initial.py`
- `20260522_itsm_0001_initial.py`
- `20260522_itsm_0002_pgvector_knowledge.py`

> 既存ファイルの即時リネームは行わない (downgrade chain を破壊するため)。
> 新規 migration からこの規約を適用し、既存分は本ファイル内のマッピングで吸収する。
