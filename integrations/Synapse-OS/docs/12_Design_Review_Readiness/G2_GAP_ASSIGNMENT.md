# G2_GAP_ASSIGNMENT

## 目的

G2 Gap Assignment は、MVP初期Sprintで解消する設計Gapを、BacklogとSprintへ割り当てる。

## G2 Gap一覧

| Gap | 内容 | Sprint | Backlog | 完了条件 |
|---|---|---|---|---|
| GAP-006 | External IdP属性Mapping | Sprint 0 | BL-001 | AD/Entra/LDAPの最小属性表がある |
| GAP-007 | DLP Mask表現 | Sprint 2 | BL-007 | mask_required時の表示/保存/監査方針がある |
| GAP-008 | Explainability詳細粒度 | Sprint 2 | BL-009 | reasoning/source/confidenceの表示粒度がある |
| GAP-009 | Retention既定値 | Sprint 0 | BL-005 | audit_default_long等の既定値がある |

## Sprint 0 G2対応

| Gap | 対応 |
|---|---|
| GAP-006 | Tenant / Identity設計時にExternal ID mappingを最小定義 |
| GAP-009 | Audit Timeline MVPでRetention既定値を定義 |

## Sprint 2 G2対応

| Gap | 対応 |
|---|---|
| GAP-007 | Document Classification MVPでMask表現を定義 |
| GAP-008 | AI Explainability Viewで表示粒度を定義 |

## G2扱いの原則

- G2はCoding開始を止めないが、該当Sprint完了条件に含める。
- Security、AI、Federation、AuditのG2は該当BacklogのAcceptanceに必ず入れる。
- G2が未完了のままPilotへ進まない。

## Assignment Decision

```text
G2 Assignment: Completed
Coding Blocker: No
Pilot Blocker if unresolved: Yes
```

