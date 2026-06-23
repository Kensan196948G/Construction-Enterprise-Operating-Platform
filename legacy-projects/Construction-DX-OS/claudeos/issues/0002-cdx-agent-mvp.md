---
id: "0002"
title: "cdx-agent MVP: inventory + heartbeat + CLI 骨組"
status: done
priority: P1
phase: "Phase 0"
labels: [agent, mvp]
created: "2026-04-15"
closed: "2026-04-15"
---

## Summary

docs/cdx-agent仕様書.md の最小セットを実装し、将来の inventory / health / queue /
policy / sync のモジュール分割に耐える骨格を作る。

## Scope

- `cdx_agent/config.py`: device_id + shared_secret + spool_path の layered 解決
- `cdx_agent/inventory.py`: hostname / cpu / memory / os_version / kernel / timezone
- `cdx_agent/heartbeat.py`: device_id / agent_version / uptime / sent_at
- `cdx_agent/sign.py`: HMAC-SHA256 + timestamp bucket (heartbeat=60s, inventory=3600s)
- `cdx_agent/spool.py`: JSONL append + atomic replace_all
- `cdx_agent/api_client.py`: 署名付き POST (injectable session / clock)
- `cdx_agent/sync.py`: drain orchestrator (順序保持・部分失敗停止)
- `cdx_agent/cli.py`: version / inventory / heartbeat / config / enqueue / drain / spool-info
- `pyproject.toml`: setuptools + httpx 依存 + ruff + pytest

## Acceptance Criteria

- [x] `python -m cdx_agent version` が version 文字列を返す
- [x] `cdx-agent inventory` / `heartbeat` が JSON を emit
- [x] `cdx-agent enqueue heartbeat` が spool に 1 行追加
- [x] `cdx-agent drain` が `CDX_SHARED_SECRET` 未設定で 3 を返し abort
- [x] 全 collector が例外で落ちない (graceful degrade)
- [x] 53 unit test がパス
- [x] Contract test (Issue 0005) で server 側と疎通確認

## 完了条件

0.2.0 として完了。Phase 2 拡張は 0006 以降に分離。

## Out of scope (次 phase)

- systemd unit 生成 → Issue 0008
- API 送信 backoff + jitter → Issue 0009
- policy pull → Issue 0010
- 署名付きトークンから PKI 証明書への置換 → Issue 0011
- ローカル暗号化 (AES) → Phase 3

## Lesson learned

- silent failure 対策として `collect_status` フィールド追加を Phase 2 改善で検討
- HMAC canonical string に inventory body の正規化 (sorted keys + separators=,:) が必須 — 両側で一致しないと検証失敗
