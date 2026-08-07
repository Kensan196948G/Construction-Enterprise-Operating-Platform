# 要件定義書：Construction ITSM & ZeroTrust Platform
# IT/DX部門 業務支援システム

| 項目 | 内容 |
|------|------|
| ドキュメントID | REQ-ITZ-001 |
| バージョン | 1.0 |
| 作成日 | 2026-05-16 |
| 対象部門 | IT/DX部門 |
| システム名 | Construction ITSM & ZeroTrust Platform |

---

## 1. 概要
### 1.1 目的
全社IT基盤の運用管理・セキュリティ監視・資産管理を統合するITSMプラットフォームを構築する。既存のEntra ID / FortiGate / Cisco環境と連携し、ゼロトラストセキュリティを実現する。

### 1.2 背景
- 既存環境：Entra ID / HENNGE / FortiGate / Cisco / SharePoint / Exchange Online
- 建設現場の分散環境におけるセキュリティ課題
- Phase1最優先システム（全社DX基盤の前提）

---

## 2. 機能要件

### 2.1 ITSM（ITサービス管理）
- FR-ITZ-001: インシデント管理
- FR-ITZ-002: 問題管理
- FR-ITZ-003: 変更管理
- FR-ITZ-004: サービスリクエスト管理
- FR-ITZ-005: サービスカタログ
- FR-ITZ-006: SLA管理

### 2.2 CMDB（構成管理データベース）
- FR-ITZ-010: IT資産台帳（PC・サーバー・ネットワーク機器）
- FR-ITZ-011: ソフトウェアライセンス管理
- FR-ITZ-012: 構成アイテム間の関連管理
- FR-ITZ-013: 自動ディスカバリ（ネットワークスキャン）

### 2.3 SIEM/SOC（セキュリティ監視）
- FR-ITZ-020: FortiGateログ収集・分析
- FR-ITZ-021: Ciscoログ収集・分析
- FR-ITZ-022: Entra IDサインインログ分析
- FR-ITZ-023: 異常検知アラート
- FR-ITZ-024: セキュリティインシデント管理
- FR-ITZ-025: 脅威インテリジェンス連携

### 2.4 資産管理（Intune代替）
- FR-ITZ-030: デバイス管理（PC・タブレット・スマートフォン）
- FR-ITZ-031: ポリシー配布
- FR-ITZ-032: リモートワイプ
- FR-ITZ-033: ソフトウェア配布

### 2.5 AD/Entra連携
- FR-ITZ-040: Entra IDとの同期
- FR-ITZ-041: グループポリシー管理
- FR-ITZ-042: 条件付きアクセスポリシー管理

### 2.6 ネットワーク監視
- FR-ITZ-050: FortiGate監視（VPN・ファイアウォール）
- FR-ITZ-051: Ciscoスイッチ・ルーター監視
- FR-ITZ-052: ネットワークトポロジー可視化
- FR-ITZ-053: 帯域使用量分析

### 2.7 AI HelpDesk
- FR-ITZ-060: AIチャットボット（問い合わせ自動応答）
- FR-ITZ-061: ナレッジベース自動検索
- FR-ITZ-062: チケット自動分類・ルーティング

---

## 3. 非機能要件
- NFR-ITZ-001: 24/365監視対応
- NFR-ITZ-002: ログ保持期間：1年以上
- NFR-ITZ-003: Entra ID SSO
- NFR-ITZ-004: FortiGate syslog連携
- NFR-ITZ-005: SNMP v3対応

---

## 4. 技術スタック

| レイヤー | 技術 |
|----------|------|
| フロントエンド | React + TypeScript |
| バックエンド | Python FastAPI |
| データベース | PostgreSQL + TimescaleDB（ログ） |
| SIEM | Wazuh / Elastic SIEM |
| 監視 | Zabbix / Grafana |
| AI | Azure OpenAI（HelpDesk） |
| 認証 | Entra ID + HENNGE SSO |

---

## 5. 統合要件
- 全部門システムの統合認証基盤として機能
- 全システムのログ集約
- 統合データレイクへのIT運用データETL

---

## 6. フェーズ計画
**Phase1最優先**。統合認証・ITSM・基本監視から着手。

