# Non Goals Guard (BL-012)

Sprint 0 で **意図的に入れない** ものが、コードや依存関係の中に紛れ込んでいないかを
自動検証するテスト群。

## ガード対象 (Sprint 0)

| カテゴリ | 検出ルール |
|---|---|
| AI Gateway Mandatory (ADR-001) | `openai` / `anthropic` / `google-generativeai` などの直接 SDK import を `services/` で禁止 |
| Audit Immutability | `synapse_shared.audit_base.AuditEvent` が `frozen=True` を維持 |
| Schema 厳格性 | 主要 Pydantic Model が `extra="forbid"` を保持 |
| MVP Scope (ADR-007) | CI/CD (`.github/workflows`), IaC (`*.tf` / Pulumi), Container (`Dockerfile` / `docker-compose.yml`), production IdP 連携などのファイルが存在しないこと |
| ADR Signoff | `ADR_SIGNOFF.md` が ADR-001〜008 を全て参照していること |

## 実行方法

```bash
.venv/bin/python -m pytest tests/non_goals_guard -q
```
