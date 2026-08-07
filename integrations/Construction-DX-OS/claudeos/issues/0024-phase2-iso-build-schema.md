---
id: "0024"
title: "Phase 2: iso_build_jobs / iso_build_audit テーブル + Alembic migration"
status: done
priority: P2
phase: "Phase 2"
labels: [db, alembic, iso, phase2]
created: "2026-04-28"
closed: "2026-04-29"
closed_by: "Loop 54 (Phase A 52d3ec8 schema + Phase B a0daa48 storage)"
acceptance_outcome:
  alembic_upgrade_head: pass (sqlite + postgres CI)
  alembic_downgrade_minus1: pass
  ci_smoke_test: covered by existing alembic upgrade head step
  postgres_storage_iso_build_protocol: implemented (insert/get/list/count/update + audit append/list)
  unit_tests: 11 passed (sqlite); postgres path activates when TEST_DATABASE_URL set
---

## Summary

Issue 0022 の永続化レイヤ。ビルドジョブのライフサイクルと監査ログを格納する 2 テーブルを追加する。

## テーブル

### `iso_build_jobs`

| カラム | 型 | 制約 |
|---|---|---|
| `id` | UUID | PK (uuid7 推奨) |
| `profile` | TEXT | NOT NULL, CHECK in (admin/standard/field/kiosk/admin-support) |
| `requested_by` | TEXT | NOT NULL |
| `status` | TEXT | NOT NULL, CHECK in (queued/running/succeeded/failed/cancelled) |
| `git_ref` | TEXT | NOT NULL |
| `started_at` | TIMESTAMPTZ | |
| `finished_at` | TIMESTAMPTZ | |
| `iso_path` | TEXT | |
| `iso_sha256` | TEXT | |
| `iso_size_bytes` | BIGINT | |
| `log_path` | TEXT | |
| `error_message` | TEXT | |
| `notes` | TEXT | |
| `created_at` | TIMESTAMPTZ | NOT NULL DEFAULT now() |

INDEX: `(status, created_at DESC)`, `(profile, created_at DESC)`

### `iso_build_audit`

| カラム | 型 | 制約 |
|---|---|---|
| `id` | BIGSERIAL | PK |
| `job_id` | UUID | FK → iso_build_jobs.id ON DELETE CASCADE |
| `actor` | TEXT | NOT NULL |
| `action` | TEXT | NOT NULL, CHECK in (enqueue/cancel/download/view) |
| `at` | TIMESTAMPTZ | NOT NULL DEFAULT now() |
| `request_id` | TEXT | |

INDEX: `(job_id, at)`, `(actor, at DESC)`

## マイグレーション

- 新規 revision `0002_iso_build_jobs.py`
- downgrade で 2 テーブル + ENUM を drop

## Acceptance Criteria

- [ ] `alembic upgrade head` で 2 テーブル作成成功
- [ ] `alembic downgrade -1` で復元
- [ ] CI smoke test に追加
- [ ] PostgresStorage に `IsoBuildStorage` Protocol 追加（list/get/insert/update）

## 依存

- Issue 0022 (API/WebUI 設計)
