# ADR_SIGNOFF

## 目的

ADR Signoff は、MVP実装計画に入る前に、重要Architecture Decisionを承認済みとして固定するための文書である。

## Signoff Summary

| ADR | Decision | Status | Signoff |
|---|---|---|---|
| ADR-001 | AI Gatewayを必須経路にする | Accepted | Signed Off |
| ADR-002 | Federation Eventを独立Entityにする | Accepted | Signed Off |
| ADR-003 | Audit Eventを横断Entityにする | Accepted | Signed Off |
| ADR-004 | Issueを企業活動の起点にする | Accepted | Signed Off |
| ADR-005 | ApprovalをCommentではなくObjectにする | Accepted | Signed Off |
| ADR-006 | AI Actionを独立Objectにする | Accepted | Signed Off |
| ADR-007 | MVPはIssue + Approval中心に絞る | Accepted | Signed Off |
| ADR-008 | BackendをPython + FastAPIに固定する | Accepted | Signed Off (CTO autonomous decision, 2026-05-02) |

## 実装計画への拘束条件

| ADR | 実装計画上の拘束 |
|---|---|
| ADR-001 | AI関連Backlogは必ずAI Gatewayを経由する |
| ADR-002 | Cross Tenant共有はFederation Eventを経由する |
| ADR-003 | 状態変更、承認、AI、FederationはAudit Eventを生成する |
| ADR-004 | MVPの主要業務導線はIssueを起点にする |
| ADR-005 | Approvalは独立Objectとして理由、判断、監査を持つ |
| ADR-006 | AI ActionはPrompt、Model、DLP、Reasoningを持つ |
| ADR-007 | ERP、完全ITSM、完全Knowledge GraphをMVPに混ぜない |
| ADR-008 | 全Service実装はPython + FastAPI、SchemaはPydantic v2、API ContractはOpenAPI生成物を正本とする |

## Signoff Decision

```text
ADR Signoff: Completed (ADR-008 added under CTO autonomous decision)
Coding Constraint: ADR-001 to ADR-008 must not be bypassed.
Change Rule: ADR変更はChange/Approval/Audit対象。
```

