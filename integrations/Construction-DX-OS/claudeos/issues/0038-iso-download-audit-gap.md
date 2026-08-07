---
id: "0038"
title: "ISO download endpoint が audit ログを残さない (compliance gap)"
status: done
priority: P2
phase: "Month 4 Quality"
labels: [security, audit, compliance, bug]
created: "2026-05-06"
closed: "2026-05-06"
closed_by_loop: 72
discovered_in: "Issue 0035 (Loop 72)"
---

## Summary

`GET /api/v1/iso-builds/{id}/download` (Issue 0025 / Phase F) は metric カウンタ
`CDX_ISO_BUILD_AUDIT_TOTAL{action="download"}` を増やすだけで、
`iso_build_audit` テーブルに監査行を残していない。

他の mutating endpoint（enqueue / view / cancel）はすべて
`append_iso_build_audit()` を呼び出しているのに対し、download はメトリクスのみで
**「誰がいつどの ISO をダウンロードしたか」のレコードが残らない**。

## Why this matters

- ISO は端末向け bootable イメージで、配布は実質的なデータ持ち出し
- compliance 観点では「データ取得」は最高位の audit 対象
- 既存の `iso_build_audit` テーブル設計には `action="download"` を受け入れる前提があり、
  metric のラベルとも整合している（実装漏れの蓋然性が高い）

## Where

- `server/api/cdx_server/routers/iso_builds.py` line 341 周辺
- `download_iso_redirect()` の 307 return 直前

## Acceptance Criteria

- [x] `download_iso_redirect` 内で `iso_storage.append_iso_build_audit(action="download", ...)` を呼ぶ
- [x] `request_id` と `_resolve_actor(request)` の actor を渡す
- [x] `tests/test_iso_download.py` に audit row 検証テストを追加
- [x] CDX_ISO_BUILD_AUDIT_TOTAL とテーブル両方が更新されることを確認

## Risk

低 — 既存テーブルへの追記のみ。スキーマ変更なし。

## 実装サマリ (Loop 72)

PR: TBD（`session/loop72-iso-download-audit` ブランチ）

### 変更点

`server/api/cdx_server/routers/iso_builds.py` の `download_iso_redirect()` 内で
307 return / metric increment 直前に `iso_storage.append_iso_build_audit()` を追加。

```python
await iso_storage.append_iso_build_audit(
    job_id=job_id,
    actor=_resolve_actor(request),
    action="download",
    request_id=getattr(request.state, "request_id", None),
)
CDX_ISO_BUILD_AUDIT_TOTAL.labels(action="download").inc()
```

これで enqueue / cancel と同じ呼び出しパターンに揃い、download も
「誰が・いつ・どの ISO を取得したか」のレコードを残せるようになった。

### テスト

`server/api/tests/test_iso_download.py` に 2 ケース追加（13 → 15）：

| テスト | 検証内容 |
|---|---|
| `test_download_appends_audit_row_on_307` | 成功 download 後に `iso_build_audit` から `action="download"` 行が読み出せ、`actor == "admin@basic"` / `job_id` 一致 |
| `test_download_failure_paths_do_not_append_audit` | MinIO 未設定 503 時に audit テーブルへ phantom 行が混入しないこと |

### 検証結果

- `pytest tests/test_iso_download.py -x` → 15 passed
- 全体: `pytest --no-cov` → 247 passed, 3 skipped（245 → 247）
- coverage: 98.83% 維持、`iso_builds.py` 99%（line 119 OIDC subject path のみ未到達、Issue 0035 時点と同じ）
- `ruff check` → All checks passed
