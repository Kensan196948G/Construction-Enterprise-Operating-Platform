---
id: "0017"
title: "python-jose → PyJWT 移行 (メンテ停止ライブラリ排除)"
status: done
priority: P2
phase: "Phase 7"
labels: [security, dependency, auth]
created: "2026-04-22"
---

## Summary

現在 OIDC 認証 (`cdx_server/oidc_auth.py`) で使用している `python-jose[cryptography]` は
2022 年から更新が停止しており、将来の CVE リスクが高い。
より積極的にメンテナンスされている `PyJWT` への移行を計画する。

## 現状

```toml
# server/api/pyproject.toml
"python-jose[cryptography]>=3.3",
```

使用箇所: `cdx_server/oidc_auth.py` — JWT デコード + JWKS 検証

## 移行先

`PyJWT[cryptography]` (python-jose との API 差異は少ない)
- 積極的にメンテナンス中
- RSA/ECDSA/HMAC 対応
- `jwt.decode()` API は互換性が高い

## 対応方針

1. `server/api/pyproject.toml`: `python-jose` → `PyJWT[cryptography]>=2.8`
2. `cdx_server/oidc_auth.py`: import と API を PyJWT 相当に書き換え
3. `test_oidc_auth.py`: MockOIDCServer の JWT 生成部分を PyJWT で書き換え
4. pytest filterwarnings: `jose` の警告が不要になるため削除可能

## Acceptance Criteria

- [ ] `python-jose` が依存から削除される
- [ ] `PyJWT>=2.8` が追加される
- [ ] 既存 OIDC テスト 6 件がすべて green
- [ ] CI 全ジョブ green
- [ ] `filterwarnings` から `jose` の抑制行を削除可能

## 注意事項

- 大きな変更のため、専用ブランチ `feat/issue-0017-pyjwt-migration` で実施
- Codex review 必須（認証変更）
- STABLE N=5 適用（セキュリティ変更）
