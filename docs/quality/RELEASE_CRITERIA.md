# 🚀 Release Criteria

Release Candidateは次をすべて満たす場合だけRelease可能です。

| Decision Area     | 必須条件                                                                 | Evidence                        |
| ----------------- | ------------------------------------------------------------------------ | ------------------------------- |
| Software          | `pnpm run verify` と `pnpm run build` 成功、skip/todoによる回避なし      | CI logs、test artifacts         |
| Dependency        | `pnpm audit --audit-level=high` が0件                                    | Security Audit job              |
| Logic/Data        | Golden、Boundary、Malformed、Metamorphic、Data Qualityが成功             | Product Assurance JSONL/summary |
| Product           | required Chromium PR E2Eと直近Nightly全Browserが成功                     | Playwright reports              |
| Security          | static/secret/dependency scan、authn/authz/tenant/audit tests成功        | CI Security artifacts/logs      |
| Resilience/Safety | dependency failureを正常値として返さず、判定不能と人間確認を返す         | QA-RES evidence                 |
| Recovery          | backup integrity、migration、audit chain、data consistencyを復元物で確認 | restore verifier log            |
| AI                | AI機能があるReleaseでは固定Eval成功。根拠・誤回答対策なしの承認不可      | AI Eval evidence                |
| Human             | 業務担当者または専門家がHA-001..005を確認                                | RC actor、Evidence Ref          |

## 🛑 Release停止条件

Critical/High security finding、失敗または欠落した必須Evidence、stale Golden Dataset、Toleranceの未承認変更、監査鎖破損、復元失敗、AIの根拠なし承認、Human Acceptance未実施が1つでもあればRelease不可です。環境障害で判定できない場合もPASSではなく`indeterminate`として停止します。

Nightlyの一時的なInfrastructure FailureはProduct Failureと分離して原因を記録しますが、原因不明のままReleaseしません。再実行は原因仮説を持って行い、同一失敗の無意味な反復を避けます。
