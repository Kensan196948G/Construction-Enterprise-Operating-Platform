# 📋 Product Assurance Test Matrix

| Risk ID           | Business Risk                         | Quality Gate         | Test/Data                      | Expected / Safety Decision                            | Stage           | Status          |
| ----------------- | ------------------------------------- | -------------------- | ------------------------------ | ----------------------------------------------------- | --------------- | --------------- |
| QA-LOGIC-001      | 発注金額の誤計算                      | Logic                | Golden purchase order          | `quantity * unitPrice` がTolerance内                  | main/Nightly    | automated       |
| QA-LOGIC-002      | 労務費の誤計算                        | Logic                | Golden labor cost              | 日当＋時間外単価×割増がTolerance内                    | main/Nightly    | automated       |
| QA-DATA-001..003  | 古い・追跡不能・重複データで判定      | Data                 | Golden metadata/schema         | source/version/freshness/unique/range/toleranceが有効 | main/Nightly    | automated       |
| QA-BOUNDARY-*     | 境界値を正常値として誤処理            | Logic/Data           | boundary v1                    | 0を仕様通り許可し、負数/nullを拒否                    | main/Nightly    | automated       |
| QA-SEC-001        | 危険な実行機構・TLS無効化・秘密鍵混入 | Security             | static scan + gitleaks + audit | finding 0 / High audit 0                              | PR/daily/RC     | automated       |
| QA-RES-001        | DB障害を空データと誤認                | Resilience/Fail-Safe | failing repository             | 500、indeterminate、human review、失敗監査            | main/Nightly/RC | automated       |
| QA-FUZZ-001       | malformed payloadで停止・迂回         | Security/Resilience  | malformed JSON corpus          | 400を返し、後続healthが200                            | Nightly         | automated       |
| QA-AI-001         | 根拠なしAI出力の承認                  | AI                   | fixed approval eval v1         | grounding＋human review＋operationalのみ承認          | main/Nightly    | automated       |
| QA-AI-MALFORMED-* | PII保持・不正prompt hash              | AI/Security          | malformed AI corpus            | PII retention=0、不正hash拒否                         | main/Nightly    | automated       |
| QA-PRODUCT-001    | ブラウザ／端末差で業務不能            | Product              | Playwright                     | desktop/mobile Chromium/Firefox/WebKit smoke成功      | PR/Nightly      | automated       |
| QA-PERF-001       | 同時アクセスで応答不能                | Product              | 100 concurrent requests        | 全200かつ5秒未満                                      | Nightly/RC      | automated smoke |
| QA-RECOVERY-001   | 復元物が壊れている                    | Recovery             | SQLite restore verifier        | integrity/migrations/audit chain/data consistency成功 | RC              | automated       |
| HA-001..005       | 技術PASSでも業務上信用できない        | Acceptance           | human checklist                | 専門家が5観点を承認しEvidence Refを登録               | RC              | human gate      |

## ⚠️ 次期拡張

実データ量に基づくLarge Data/File閾値、実外部サービスのNetwork/Timeout fault injection、RPO/RTOを測る定期restore drill、axe等による自動Accessibility、LLM推論導入後の出力Evalは、対象実装または本番相当環境が導入された時点でStatusを`automated`へ移します。それまではRelease Criteriaの条件付き適用とし、未実装機能をPASS扱いにしません。
