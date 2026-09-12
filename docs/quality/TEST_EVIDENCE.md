# 📊 Test Evidence

## 📌 記録形式

重要テストは1行1JSONで次を記録します。

| Field                           | 内容                                        |
| ------------------------------- | ------------------------------------------- |
| `requirementId` / `testId`      | Requirementと一意なTestの対応               |
| `version`                       | `src/version.ts` のProduct version          |
| `input` / `expected` / `actual` | 再現可能な入力と独立期待値、実測値          |
| `tolerance`                     | 許容差。非数値判定は`null`                  |
| `testDataVersion`               | Golden/Eval Dataset version                 |
| `environment` / `timestamp`     | 実行環境とUTC時刻                           |
| `result` / `log`                | pass/failと短い根拠。秘密・個人データは禁止 |

## 🔧 実行例

```bash
CEOP_TEST_EVIDENCE_FILE=artifacts/local-evidence.jsonl \
CEOP_TEST_ENVIRONMENT=local \
pnpm run quality:merge

pnpm run quality:evidence -- \
  artifacts/local-evidence.jsonl \
  artifacts/local-summary.json
```

SummaryはEvidenceが0件、failを含む、JSON不正、Test ID重複の場合にRelease Readyとしません。GitHubのmain/Nightly artifactは90日保持します。Releaseに使用した証跡はRelease記録側で参照を固定し、秘密・token・入力本文・個人情報を保存しません。

Human Acceptanceは自動テストによる代替を禁止します。RC workflowを実行したGitHub actorと、承認内容を追跡できるIssue/文書/artifact IDをEvidence Refとして残します。
