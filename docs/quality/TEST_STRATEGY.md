# 📌 Product Assurance Test Strategy

## 📌 目的

CEOPのRelease条件は、画面やAPIが動くことだけではなく、利用者が結果を信用できることです。品質判断はテスト件数やCoverage率ではなく、Business Risk、結果の正確性、Security/Safety、障害影響、Regression Risk、利用頻度、保守コストの順で行います。

## 📋 品質モデル

| Gate             | 保証対象                             | 主な検証                                                                                                                     |
| ---------------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| 1 Software       | 実装が決定的に構築・実行できる       | format、OpenAPI drift、strict typecheck、lint、unit/component/integration、migration、dependency/secret/static scan          |
| 2 Logic & Data   | 入力から得られる結果とデータが正しい | Golden、Expected Result、Boundary、Malformed、Tolerance、Metamorphic、schema、null/duplicate/range、freshness/source/version |
| 3 Product        | 業務フローと利用環境で成立する       | E2E、workflow、cross-browser、responsive、accessibility、performance、large data/file、concurrency                           |
| 4 Risk           | 攻撃・障害時に安全側へ倒れる         | authn/authz、tenant isolation、injection、session/rate limit、audit、DB/API/network outage、recovery、backup/restore         |
| 5 AI             | AI利用が根拠付きで統制される         | fixed eval、grounding、human review、operation stop、PII zero retention、regression evidence                                 |
| Human Acceptance | 専門家が業務上の妥当性を承認する     | 利用可能性、妥当性、誤解防止、根拠追跡、異常時安全性                                                                         |

## 🔁 実行配置

| タイミング        | 内容                                                                   | 入口                                              |
| ----------------- | ---------------------------------------------------------------------- | ------------------------------------------------- |
| PR                | 高速・決定的なSoftware/Securityとrequired Chromium E2E                 | `pnpm run quality:pr`、`.github/workflows/ci.yml` |
| main反映          | Golden、Logic、Data、Resilience、AI Eval                               | `pnpm run quality:merge`                          |
| Nightly           | 上記に加え全Browser/Device、Performance、Fuzz                          | `product-assurance-nightly.yml`                   |
| Release Candidate | dependency/static security、Load、Fail-Safe、Restore、Human Acceptance | `product-assurance-rc.yml`                        |

`pnpm run verify` は開発者向けの完全な自動ゲートであり、既存テストとProduct Assuranceスイートをすべて実行します。Human Acceptanceは人間の判断を偽装しないため自動 `verify` には含めず、RC workflowの入力者・Evidence Refとともに記録します。

## 🔐 Fail-Safe原則

外部依存や永続化層が失敗した場合、空配列やゼロ値を正常結果として返してはいけません。APIは非2xxと `decision=indeterminate`、`action=human_review_required` を返し、認証済み処理の失敗を監査ログへ記録します。機密な例外本文は応答へ含めません。

## 🧠 AI適用範囲

現時点のCEOPはLLM推論エンジン自体を内包せず、AI ActionとAI生成物の統制を担います。そのため現在の固定Evalは、Grounding参照、誤回答対策、人間確認、PII保持、利用停止を独立ルールで検証します。将来モデル出力を生成する実装を追加した時点で、Correctness/Completeness/Hallucination/Tool Selection/Tool Result/Reproducibilityの出力Eval Datasetを同じGateへ追加します。同一AIの自己採点だけを合否判定に使用してはいけません。

## 📊 証跡

重要テストは `CEOP_TEST_EVIDENCE_FILE` を設定してJSON Linesを生成し、`pnpm run quality:evidence -- <input> <summary>` でRelease判断用サマリーにします。証跡の必須項目と保持方針は [TEST_EVIDENCE.md](TEST_EVIDENCE.md) を参照してください。
