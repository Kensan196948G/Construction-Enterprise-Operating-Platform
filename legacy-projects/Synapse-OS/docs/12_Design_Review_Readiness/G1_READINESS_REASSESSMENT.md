# G1_READINESS_REASSESSMENT

## 目的

この文書は、G1 Gap Closure後にMVP実装可否を再判定するためのReadiness Reassessmentである。

## G1 Closure Summary

| Gap | Closure Document | Status |
|---|---|---|
| GAP-001 ID採番規則の詳細 | G1_ID_ENUM_FINALIZATION.md | Closed |
| GAP-002 Enum最終一覧 | G1_ID_ENUM_FINALIZATION.md | Closed |
| GAP-003 Policy条件の最小セット | G1_MINIMUM_POLICY_RULE_SET.md | Closed |
| GAP-004 Audit Event必須属性 | G1_AUDIT_EVENT_SCHEMA_FINALIZATION.md | Closed |
| GAP-005 MVP画面項目の最小セット | G1_MVP_SCREEN_FIELD_LIST.md | Closed |

## Reassessment Matrix

| 領域 | 旧状態 | 新状態 | 理由 |
|---|---|---|---|
| Constitution | Ready | Ready | 変更なし |
| Object Model | Ready | Ready | ID/Enumが確定 |
| Policy Kernel | Conditional Ready | Ready | 最小Policy Rule Setが確定 |
| Authority | Conditional Ready | Conditional Ready | External IdP MappingはG2残 |
| Audit | Conditional Ready | Ready | Audit Event Schemaが確定 |
| AI Governance | Conditional Ready | Ready | AI/DLP/Model Routing最小Policyが確定 |
| Federation | Conditional Ready | Ready for MVP | Trust/Federation最小Policyと画面項目が確定 |
| UX / UI | Conditional Ready | Ready for MVP | MVP Screen Field Listが確定 |
| Test Strategy | Ready | Ready | 変更なし |
| Backlog | Ready | Ready | 変更なし |

## 残るG2/G3

| Gap | 扱い |
|---|---|
| External IdP属性Mapping | MVP初期Sprintで解消 |
| DLP Mask表現 | MVP初期Sprintで解消 |
| Explainability詳細粒度 | MVP初期Sprintで調整 |
| Retention既定値詳細 | MVP初期Sprintで調整 |
| Pilotデータセット | Pilot前に解消 |
| Pilot評価票 | Pilot前に解消 |

## Reassessment Decision

```text
MVP Implementation Readiness:
- Previous: Conditional Ready
- Current: Ready for MVP Implementation Planning
- Coding: Not Yet
- Reason:
  - G1 GapはClosed。
  - ただし次は即Codingではなく、MVP Implementation PlanningでSprint/Issue/Review Gateを確定する。
```

## 実装開始前に残す条件

- ADR-001からADR-007のSignoff
- P1 BacklogのSprint分割
- Test StrategyとBacklogの対応表
- G2 GapをMVP初期Sprintへ割り当て

