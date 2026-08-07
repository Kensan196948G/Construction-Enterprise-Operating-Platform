# ENTERPRISE_OS_CHARTER

## 位置づけ

本Charterは、AI統制型 Enterprise Operating Platform の存在目的を定義する最上位文書である。

このPlatformは、GitHub clone、ERP clone、ITSM単体、Workflow SaaS単体ではない。企業活動を、統制・権限・監査・Federation・Knowledge・AI Governance・Workflowで制御する **AI Native Enterprise Operating System** である。

## Mission

```text
AIが企業活動を直接支配するのではない。
企業OSがAI・人間・Workflow・Federationを統制し、
説明可能で監査可能な企業活動を成立させる。
```

## 対象世界

| 領域 | Charter上の扱い |
|---|---|
| Governance | すべての機能の前提 |
| Authority | 人・AI Agent・Workflow・組織の権限を統一制御 |
| Audit | 操作、判断、承認、AI推論を証跡化 |
| Federation | A社/B社/C社を分離したまま協調 |
| Knowledge | Enterprise Memoryとして統合 |
| Workflow | 企業活動の実行単位 |
| AI Governance | AI Gatewayを通じて統制 |

## 非目標

| 非目標 | 理由 |
|---|---|
| GitHub clone | OSSホスティングではなく企業統制OSである |
| ERP clone | 会計・販売などの基幹ERPを置換しない |
| 巨大モノリス | Federationと拡張性を破壊する |
| AI Black Box | Explainabilityが必須 |
| 中央集権企業Platform | Federation Nativeを優先する |
| Direct AI Access | AI Gateway Mandatoryに反する |

## 成功条件

- A社/B社/C社がTenant Isolationを維持したまま協調できる
- AI操作はすべてGateway、Policy、DLP、Auditを通過する
- Issue、Approval、Workflow、Knowledge、Audit、Asset、AI Action、Federation Event がEnterprise Objectとして扱われる
- 重要判断は説明可能で、後から追跡可能である

