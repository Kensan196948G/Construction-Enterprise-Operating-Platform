---
id: "0018"
title: "Phase 2: shared_secret を bcrypt ハッシュで保存"
status: done
priority: P2
phase: "Phase 2"
labels: [security, auth, database]
created: "2026-04-22"
---

## Summary

現在 `PostgresStorage.register_device()` は `shared_secret` をそのまま
`shared_secret_hash` カラムに保存している（Phase 1 互換のため）。
Phase 2 では bcrypt ハッシュに移行し、漏洩時のリスクを低減する。

## 現状 (storage_pg.py:150)

```python
shared_secret_hash=shared_secret,  # Phase 1: verbatim
```

## 対応方針

1. `pyproject.toml`: `bcrypt>=4.0` を dependencies に追加
2. `storage_pg.py`: `register_device` で `bcrypt.hashpw()` を使用
3. `auth.py`: `verify_signed_request` の HMAC 検証では生の secret が必要 →
   インメモリ/DBから取得した hash を比較するのではなく、
   **HMAC 検証は変更せず、bcrypt は /admin ログイン用 admin_token のみ適用**
   （device の shared_secret は HMAC 用なので平文保存が必要 — 設計注意）

## 設計再検討

`shared_secret` は HMAC-SHA256 の鍵として使用されるため、
**ハッシュして保存すると HMAC 検証時に平文が必要で矛盾が生じる。**

より現実的な対応:
- `shared_secret` は引き続き平文保存（HMAC のため必須）
- `shared_secret_hash` カラム名は誤解を招く → `shared_secret` にリネーム検討
- カラム名変更は Alembic migration 0002 で対応

## Acceptance Criteria

- [ ] `shared_secret_hash` → `shared_secret` カラム名変更 (Alembic 0002)
- [ ] `storage_pg.py`: カラム名リファクタ
- [ ] `models.py`: フィールド名更新
- [ ] 既存 255+ テスト全通過
- [ ] CI 全ジョブ green

## 注意事項

- STABLE N=5 要件（認証/DB変更）
- 専用ブランチ `feat/issue-0018-column-rename` で実施
- Alembic migration test が CI で走るため、migration 整合性は自動検証される
