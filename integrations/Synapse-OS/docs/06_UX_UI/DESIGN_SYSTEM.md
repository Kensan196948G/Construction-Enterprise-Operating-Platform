# DESIGN_SYSTEM

## 目的

Design System は、Enterprise OS全体のUI構造、状態表示、操作部品、色、Timeline、Dashboardを統一する。

## コンポーネント

| Component | 用途 |
|---|---|
| Enterprise Navigation | Governance、Workflow、Knowledge、AI、Audit、Federation |
| Object Header | Issue/Approval/Document等の状態表示 |
| Timeline | Event、Comment、Approval、Audit履歴 |
| Policy Badge | allow / deny / approval_required |
| Risk Indicator | AI Risk、DLP Risk、Security Risk |
| Federation Boundary Tag | A社/B社/C社、共有範囲 |
| Explainability Panel | AI判断根拠 |
| Audit Link | 証跡への導線 |

## 色の意味

| 色 | 意味 |
|---|---|
| Green | 正常 |
| Yellow | Warning |
| Red | Critical |
| Blue | Federation |
| Purple | AI |
| Gray | Audit |

## Layout

```text
Left Navigation
Top Status Bar
Main Object View
Right Governance Panel
Timeline / Audit Trail
```

## 原則

- 見た目より状態理解を優先する
- AIとAuditはサイド情報ではなく主要情報として扱う
- Workflowの現在地と次アクションを常に明示する

