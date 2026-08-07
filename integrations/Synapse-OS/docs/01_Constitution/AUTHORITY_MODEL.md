# AUTHORITY_MODEL

## 目的

Authority Model は、「誰が」「何を」「どの条件で」「どの範囲まで」実行できるかを定義する。

## 基本思想

従来RBACだけでは不十分である。Enterprise OSでは、PBAC、AI-Aware Authorization、Federation Authorityを組み合わせる。

```text
RBAC
+ PBAC
+ Context Based Access
+ AI-Aware Authorization
+ Federation Boundary
```

## 主体

| 主体 | 例 |
|---|---|
| Human | 部長、情シス、監査担当 |
| AI Agent | AI CAB、AI Reviewer、AI DLP |
| Workflow | Auto Approval、Escalation |
| Organization | A社、B社、C社 |
| External Partner | SI、監査法人、委託先 |

## 権限判定要素

| 要素 | 内容 |
|---|---|
| identity | ユーザーまたはAI Agent ID |
| role | 職務・責任 |
| policy | 適用規程 |
| context | 時刻、場所、端末、Tenant、案件 |
| risk_score | AIまたはSecurityのリスク値 |
| federation_scope | 組織間共有範囲 |
| approval_state | 承認状態 |

## AI-Aware Authorization

AI Agentは独立した実行主体として扱う。ただし、以下は禁止する。

- 本番環境変更の単独実行
- 高機密文書の外部AI送信
- Federation境界を越えた無承認Knowledge参照
- Policy例外の自己承認

## Authority Flow

```mermaid
sequenceDiagram
    participant Actor
    participant Policy
    participant Authority
    participant Approval
    participant Audit
    Actor->>Policy: 実行要求
    Policy->>Authority: 条件評価
    Authority-->>Approval: 必要時は承認要求
    Approval-->>Audit: 判断と根拠を保存
```

