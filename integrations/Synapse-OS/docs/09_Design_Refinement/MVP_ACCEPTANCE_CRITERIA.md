# MVP_ACCEPTANCE_CRITERIA

## 目的

MVP Acceptance Criteria は、AI Native Enterprise OS のMVPが「動く」だけでなく、Enterprise OSとして成立しているかを判定するための受け入れ条件である。

## Acceptance 1: Issue + Approval

| 条件 | 判定 |
|---|---|
| Issueが作成できる | 必須 |
| IssueにTenant、Owner、Priority、Classificationがある | 必須 |
| ApprovalがIssueに紐づく | 必須 |
| AI Risk分析を承認前に参照できる | 必須 |
| 承認判断がAudit Timelineに残る | 必須 |

## Acceptance 2: AI Audit

| 条件 | 判定 |
|---|---|
| AI利用はAI Gateway経由である | 必須 |
| Prompt Audit IDが生成される | 必須 |
| Model ProviderとModel名が記録される | 必須 |
| DLP判定がAI Actionに紐づく | 必須 |
| Reasoning Summaryと参照Knowledgeが確認できる | 必須 |

## Acceptance 3: Document Governance

| 条件 | 判定 |
|---|---|
| DocumentにClassificationが付く | 必須 |
| Confidential以上はDLP判定対象になる | 必須 |
| Restricted文書は外部AI送信されない | 必須 |
| Retention PolicyがDocumentに紐づく | 必須 |
| Lineageが確認できる | 推奨 |

## Acceptance 4: Federation Auth / Boundary

| 条件 | 判定 |
|---|---|
| A社/B社/C社のTenantを区別できる | 必須 |
| Cross Tenant共有要求がFederation Eventになる | 必須 |
| Trust Levelが表示される | 必須 |
| 双方承認またはPolicy判定が残る | 必須 |
| Shared Auditに記録される | 必須 |

## Acceptance 5: Enterprise Dashboard

| 条件 | 判定 |
|---|---|
| 承認待ち件数が見える | 必須 |
| AI Risk件数が見える | 必須 |
| DLP警告が見える | 必須 |
| Federation要求が見える | 必須 |
| Dashboardから対象Objectへ遷移できる | 必須 |

## Acceptance 6: Non Goals維持

| 条件 | 判定 |
|---|---|
| ERP機能へ広げていない | 必須 |
| GitHub clone化していない | 必須 |
| Direct AI Accessを作っていない | 必須 |
| 巨大モノリス前提にしていない | 必須 |
| AI Black Boxになっていない | 必須 |

## MVP完了判定

```text
MVP Design Ready:
- 必須Acceptanceがすべて満たされる設計である
- 未解決リスクが明示されている
- 実装対象と非対象が分離されている
- Security / Audit / AI Gateway / Federation境界が省略されていない
```

