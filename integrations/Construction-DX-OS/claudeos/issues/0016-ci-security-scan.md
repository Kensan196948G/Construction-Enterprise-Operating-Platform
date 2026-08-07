---
id: "0016"
title: "CI セキュリティスキャン: pip-audit + bandit 追加"
status: done
priority: P2
phase: "Phase 7"
labels: [ci, security, devops]
created: "2026-04-22"
---

## Summary

Explore エージェントの調査により、CI に以下の静的セキュリティ解析ツールが未導入であることが判明。
これらは DevSecOps の最低限の品質ゲートとして必要。

## 追加するツール

### pip-audit
- **目的**: Python 依存パッケージの既知 CVE を検出
- **実行**: `pip-audit` (PyPI)
- **出力**: CVE ID / GHSA ID + 影響バージョン + 修正バージョン
- **ポリシー**: CRITICAL/HIGH は CI 失敗、MEDIUM は警告（初期運用）

### bandit
- **目的**: Python ソースコードの静的セキュリティ解析（SQLインジェクション、ハードコードシークレット等）
- **実行**: `bandit -r cdx_server cdx_agent --severity-level medium`
- **ポリシー**: HIGH/CRITICAL 検出で CI 失敗

## Acceptance Criteria

- [x] `.github/workflows/ci.yml` に `security-scan` ジョブを追加
- [x] `pip-audit` が server + agent 両パッケージを対象にスキャン
- [x] `bandit` が cdx_server + cdx_agent ソースをスキャン
- [x] 初回 scan で既存 HIGH/CRITICAL 指摘ゼロを確認 (B104 nosec 処理済)
- [x] CI 全 7 ジョブ green (run #24755190351)

## Resolution (2026-04-22, Loop 30-31)

- `security-scan` ジョブを CI に追加
- `pip-audit --skip-editable`: CVE ゼロ確認
- `bandit --severity-level medium`: High/Critical ゼロ、B104 nosec
- CI run #24755190351: 7/7 ジョブ green ✅

## 依存追加

`server/api/pyproject.toml` と `agent/cdx_agent/pyproject.toml` の `[dev]` extras に追加:
```toml
"pip-audit>=2.7",
"bandit[toml]>=1.7",
```

## 参照

- Explore エージェント報告: 2026-04-22
- 関連: Issue 0014 (Node.js 24 migration)
