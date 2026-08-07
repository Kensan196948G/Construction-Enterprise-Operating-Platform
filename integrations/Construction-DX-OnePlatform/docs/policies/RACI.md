# 👥 RACI マトリクス (役割・責任・認可・情報連絡)

> Construction DX One Platform  
> 適用規格: ISO 27001 A.6.1 (情報セキュリティの役割と責任) / A.6.1.2 (職務分掌)  
> 作成: Loop #36 (2026-06-01)

---

## 📌 RACI 凡例

| 記号  | 英語        | 意味                             |
| :---- | :---------- | :------------------------------- |
| **R** | Responsible | 実行責任者（タスクを実際に行う） |
| **A** | Accountable | 最終説明責任者（承認・最終判断） |
| **C** | Consulted   | 相談対象（事前に意見を求める）   |
| **I** | Informed    | 情報共有対象（事後に通知する）   |

---

## 🗂 ロール定義

| ロール    | 説明                       |
| :-------- | :------------------------- |
| CTO       | 最高技術責任者・全権承認者 |
| Security  | セキュリティ担当チーム     |
| DevOps    | インフラ・CI/CD 担当       |
| Dev Lead  | 開発リード（部門ごと）     |
| Developer | 一般開発者                 |
| QA        | 品質保証担当               |
| DBA       | データベース管理者         |
| All Staff | 全システム利用者           |

---

## 📊 システム開発・運用 RACI

| タスク                    | CTO | Security | DevOps | Dev Lead | Developer | QA  | DBA |
| :------------------------ | :-- | :------- | :----- | :------- | :-------- | :-- | :-- |
| アーキテクチャ設計        | A   | C        | C      | R        | I         | I   | C   |
| セキュリティ設計          | A   | R        | C      | C        | I         | I   | C   |
| コーディング              | I   | C        | I      | A        | R         | C   | I   |
| コードレビュー (PR)       | I   | C        | C      | A        | R         | C   | I   |
| 単体テスト作成            | I   | I        | I      | A        | R         | C   | I   |
| セキュリティスキャン      | A   | R        | R      | I        | I         | I   | I   |
| CI/CD パイプライン管理    | A   | C        | R      | I        | I         | I   | I   |
| 本番デプロイ承認          | A   | C        | R      | C        | I         | I   | I   |
| DB スキーマ変更           | A   | C        | I      | C        | I         | C   | R   |
| DB バックアップ・リストア | A   | I        | C      | I        | I         | I   | R   |
| アクセス権付与・剥奪      | A   | R        | C      | C        | I         | I   | C   |
| インシデント対応          | A   | R        | R      | C        | I         | C   | C   |
| 脆弱性修正                | A   | R        | C      | C        | R         | C   | C   |
| ログ・監査証跡管理        | A   | R        | R      | I        | I         | I   | C   |
| ポリシー更新              | A   | R        | C      | C        | I         | I   | C   |

---

## 🔐 セキュリティ固有 RACI

| タスク                   | CTO | Security | DevOps | Dev Lead | All Staff |
| :----------------------- | :-- | :------- | :----- | :------- | :-------- |
| セキュリティポリシー承認 | A   | R        | C      | I        | I         |
| 年次内部監査             | A   | R        | C      | C        | I         |
| インシデント報告受付     | I   | A/R      | I      | I        | R         |
| セキュリティ訓練 (BCP)   | A   | R        | R      | C        | I         |
| JWT シークレット管理     | A   | R        | R      | I        | I         |
| GitHub Secrets 管理      | A   | C        | R      | C        | I         |
| Wazuh SIEM 運用          | A   | R        | R      | I        | I         |
| Trivy スキャン結果対応   | A   | R        | R      | R        | I         |
| gitleaks 検出時対応      | A   | R        | R      | R        | I         |
| ベンダーセキュリティ評価 | A   | R        | C      | I        | I         |

---

## 📋 変更管理 RACI

| タスク                      | CTO | Security | DevOps | Dev Lead | Developer | QA  |
| :-------------------------- | :-- | :------- | :----- | :------- | :-------- | :-- |
| 変更要求 (RFC) 作成         | I   | I        | I      | A        | R         | C   |
| リスク評価                  | A   | R        | C      | C        | I         | C   |
| 変更承認 (通常)             | I   | C        | A      | C        | I         | C   |
| 変更承認 (セキュリティ影響) | A   | R        | C      | C        | I         | C   |
| 変更実施                    | I   | I        | A      | C        | R         | I   |
| 変更後テスト                | I   | I        | C      | A        | C         | R   |
| 変更記録                    | I   | I        | R      | R        | R         | I   |
| ロールバック判断            | A   | C        | R      | C        | I         | I   |

---

## 🆘 インシデント対応 RACI

| フェーズ         | CTO | Security | DevOps | Dev Lead | DBA |
| :--------------- | :-- | :------- | :----- | :------- | :-- |
| 初動検知・分類   | I   | A/R      | R      | C        | C   |
| 封鎖・隔離       | A   | R        | R      | I        | C   |
| 原因調査         | A   | R        | R      | C        | C   |
| 影響範囲特定     | A   | R        | C      | R        | C   |
| 復旧実施         | I   | C        | A      | R        | R   |
| 経営陣報告       | A   | R        | I      | I        | I   |
| 事後レポート作成 | A   | R        | C      | C        | C   |
| 再発防止策実施   | A   | R        | R      | R        | C   |

---

## 🔑 特権アカウント管理

| アカウント種別      | 保有者   | 承認者   | 棚卸し頻度 |
| :------------------ | :------- | :------- | :--------- |
| GitHub Admin        | DevOps   | CTO      | 四半期     |
| DB スーパーユーザー | DBA      | CTO      | 月次       |
| サーバー root       | DevOps   | CTO      | 月次       |
| Wazuh 管理者        | Security | CTO      | 四半期     |
| Grafana Admin       | DevOps   | Security | 四半期     |
| API Admin Token     | DevOps   | Security | 月次       |

---

## 📅 定期レビュー

| レビュー項目         | 頻度   | 責任者     |
| :------------------- | :----- | :--------- |
| アクセス権棚卸し     | 四半期 | Security   |
| 特権アカウント棚卸し | 月次   | DBA/DevOps |
| RACI 自体のレビュー  | 年次   | CTO        |
| ポリシー準拠確認     | 年次   | Security   |

---

> 🤖 _Generated during ClaudeOS v9.0 Loop #36 / session_2026-06-01_  
> 📋 ISO 27001 A.6.1 (役割と責任) 対応: `☐ → 🟡 初版作成`
