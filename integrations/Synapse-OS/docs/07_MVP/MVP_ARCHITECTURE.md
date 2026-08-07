# MVP_ARCHITECTURE

## 目的

MVP Architecture は、最小構成でEnterprise OSの核であるIssue、Approval、AI Audit、Document Governance、Federation Authを成立させる構造である。

## MVP構成

```mermaid
flowchart TD
    UI["Enterprise Control Room UI"]
    API["API Gateway"]
    Issue["Issue Service"]
    Approval["Approval Workflow"]
    AIGW["AI Gateway"]
    Doc["Document Governance"]
    Auth["Federation Auth"]
    Audit["Immutable Audit"]
    Dashboard["Dashboard"]

    UI --> API
    API --> Issue
    Issue --> Approval
    Issue --> AIGW
    Issue --> Doc
    API --> Auth
    Approval --> Audit
    AIGW --> Audit
    Doc --> Audit
    Auth --> Audit
    Audit --> Dashboard
```

## 最小Enterprise Object

| Object | MVPでの扱い |
|---|---|
| Issue | すべての起点 |
| Approval | 承認・稟議 |
| Document | DLP対象 |
| AI Action | Promptと出力 |
| Audit | 証跡 |
| Federation Event | A社/B社/C社境界 |

## MVPで守ること

- 実装詳細よりContractと責務境界を優先する
- AI直接接続を作らない
- Auditを後付けにしない
- Tenant境界を後回しにしない
- Dashboardは状態可視化の入口として扱う

