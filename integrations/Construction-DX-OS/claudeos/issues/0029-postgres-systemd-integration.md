---
id: "0029"
title: "systemd cdx-os-server に PostgreSQL 永続化を設定"
status: done
priority: P2
phase: "Phase 9"
labels: [database, deploy, systemd]
created: "2026-05-06"
---

## Summary

現在の `cdx-os-server` systemd サービスは `InMemoryStorage` で動作しており、
サーバー再起動のたびにデバイス・ハートビート・インベントリデータが消える。
本番運用に向けて PostgreSQL 永続化を有効にする。

## 対応内容

1. PostgreSQL サーバー（既存または新規）に `cdx` データベース作成
2. `.env` に `DATABASE_URL` と `POSTGRES_PASSWORD` を追加
3. Alembic マイグレーション実行（テーブル自動作成）
4. systemd サービス再起動・動作確認

## Acceptance Criteria

- [ ] `health` エンドポイントが `"storage_backend": "PostgresStorage"` を返す
- [ ] サーバー再起動後もデバイス登録データが保持される
- [ ] `.env` に DATABASE_URL が正しく設定されている
- [ ] マイグレーション実行ログにエラーなし

## 依存

- PostgreSQL サーバーが利用可能であること（docker-compose または既存 PG インスタンス）
