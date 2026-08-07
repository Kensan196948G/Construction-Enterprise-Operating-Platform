---
id: "0015"
title: "pytest deprecation warnings の抑制・解消"
status: done
priority: P3
phase: "Phase 7"
labels: [test, quality]
created: "2026-04-22"
---

## Summary

`make test` 実行時に以下の deprecation warning が発生している。
これらはサードパーティライブラリ起因だが、テスト出力を汚染し、
将来的な Python バージョンアップ時にエラー化するリスクがある。

## 発生している警告

### 1. python-jose の datetime.utcnow() 使用
```
/home/kensan/.local/lib/python3.12/site-packages/jose/jwt.py:311:
DeprecationWarning: datetime.datetime.utcnow() is deprecated
Use timezone-aware objects to represent datetimes in UTC: datetime.datetime.now(datetime.UTC)
```
- 対象テスト: `test_oidc_auth.py` の 3 テスト
- 原因: `python-jose` ライブラリ内部の実装
- 修正方針: `pytest.ini` または `pyproject.toml` の `filterwarnings` で抑制

### 2. uvicorn の websockets.legacy 使用
```
/home/kensan/.local/lib/python3.12/site-packages/uvicorn/protocols/websockets/websockets_impl.py:16:
DeprecationWarning: websockets.legacy is deprecated
```
- 対象テスト: `test_sdk_smoke.py` の health エンドポイントテスト
- 原因: uvicorn が古い websockets API を使用
- 修正方針: filterwarnings で抑制 (uvicorn 側の問題)

## 対応方針

`server/api/pyproject.toml` の `[tool.pytest.ini_options]` に filterwarnings を追加:

```toml
[tool.pytest.ini_options]
filterwarnings = [
    "ignore::DeprecationWarning:jose.*",
    "ignore::DeprecationWarning:websockets.*",
    "ignore::DeprecationWarning:uvicorn.*",
]
```

## Acceptance Criteria

- [ ] `make test` 実行時に `warnings summary` セクションが出ない
- [ ] 全 248 テストが引き続き green
- [ ] 正当な DeprecationWarning（自プロジェクトコード起因）は抑制しない
