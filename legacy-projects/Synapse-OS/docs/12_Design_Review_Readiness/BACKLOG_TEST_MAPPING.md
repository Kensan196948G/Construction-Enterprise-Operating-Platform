# BACKLOG_TEST_MAPPING

## 目的

Backlog-Test Mapping は、各Backlogがどの検証観点で合格判定されるかを定義する。実装後に「作ったが統制されていない」状態を防ぐ。

## Test Layer

| Test | 目的 |
|---|---|
| Contract Test | Data/API Contract確認 |
| Policy Test | Policy Decision確認 |
| Workflow Test | 状態遷移と禁止遷移確認 |
| AI Governance Test | Gateway/DLP/Explainability確認 |
| Federation Test | Tenant/Trust/Cross Tenant確認 |
| Audit Test | Audit Event確認 |
| UX Acceptance Test | Dashboard/Detail/Timeline確認 |
| Non Goals Guard Test | Scope逸脱防止 |

## Sprint 0 Mapping

| Backlog | Contract | Policy | Workflow | AI | Federation | Audit | UX | Non Goals |
|---|---|---|---|---|---|---|---|---|
| BL-001 Tenant / Identity | Yes | Yes | No | No | Yes | Yes | Yes | Yes |
| BL-004 Policy Decision | Yes | Yes | No | Yes | Yes | Yes | No | Yes |
| BL-005 Audit Timeline | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes |
| BL-012 Non Goals Guard | No | No | No | Yes | Yes | No | No | Yes |
| BL-013 Policy Test Matrix | Yes | Yes | No | Yes | Yes | Yes | No | Yes |

## Sprint 1 Mapping

| Backlog | Contract | Policy | Workflow | AI | Federation | Audit | UX | Non Goals |
|---|---|---|---|---|---|---|---|---|
| BL-002 Issue Object | Yes | Yes | Yes | Conditional | No | Yes | Yes | Yes |
| BL-003 Approval Workflow | Yes | Yes | Yes | Conditional | No | Yes | Yes | Yes |
| BL-010 Dashboard | No | No | No | Yes | Yes | Yes | Yes | Yes |

## Sprint 2 Mapping

| Backlog | Contract | Policy | Workflow | AI | Federation | Audit | UX | Non Goals |
|---|---|---|---|---|---|---|---|---|
| BL-007 Document Classification | Yes | Yes | No | Yes | Conditional | Yes | Yes | Yes |
| BL-006 AI Gateway | Yes | Yes | No | Yes | No | Yes | Yes | Yes |
| BL-009 AI Explainability View | Yes | Yes | No | Yes | No | Yes | Yes | Yes |
| BL-008 Federation Event | Yes | Yes | Yes | Conditional | Yes | Yes | Yes | Yes |
| BL-011 Knowledge Lineage | Yes | Conditional | No | Yes | Conditional | Yes | Yes | Yes |

## Critical Acceptance Mapping

| Critical Scenario | Backlog |
|---|---|
| Issue作成でIssueCreated Audit生成 | BL-002, BL-005 |
| Approval判断でDecision Reason保存 | BL-003, BL-005 |
| AI Risk分析でPrompt/DLP/Model/Reasoning保存 | BL-006, BL-009 |
| Restricted文書の外部AI送信deny | BL-007, BL-006, BL-004 |
| Federation共有でTrust/DLP/Approval/Audit | BL-008, BL-004, BL-005 |
| 承認迂回の拒否 | BL-003, BL-004 |
| AI直接接続なし | BL-006, BL-012 |

## Mapping Decision

```text
Backlog-Test Mapping: Completed
Rule:
- P1/P2 Backlogは少なくともPolicyまたはAuditのどちらかに接続する。
- AI/Federation関連Backlogは該当Testを必須にする。
```

