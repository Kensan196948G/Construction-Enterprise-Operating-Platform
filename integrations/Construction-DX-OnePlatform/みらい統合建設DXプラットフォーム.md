日本の建設土木事業者として、組織図を見ると「営業」「施工」「技術」「安全品質環境」「管理」「船舶」「ソリューション営業」などがかなり明確に分離されています。
これは逆に言うと、**“部門単位で業務支援システムを構築しやすい”** 構造です。

さらに、将来的に「統合建設DXプラットフォーム」へ発展させやすい理想的な形です。
特に公共工事比率が高い企業では、

* ISO9001
* ISO14001
* ISO45001
* 建設業法
* 品確法
* 労働安全衛生法
* i-Construction 2.0

への対応が非常に重要になります。 ([未来建設][1])

また、ユーザー環境は

* Microsoft 365
* Entra ID
* SharePoint Online
* FortiGate
* Cisco
* DeskNet's NEO

を既に保有しているため、**“ゼロから全部作る”より、既存基盤をDXハブ化する方が成功率が高い**です。 

---

# 🏗 全体構想

## 最終形

```text
Construction DX One Platform
（統合建設DX基盤）

├── 経営・経営企画
├── 営業
├── 技術
├── 施工
├── 安全品質環境
├── 管理本部
├── 船舶事業
├── 調達・購買
├── 現場管理
├── 協力会社
├── BIM/CIM
├── AI分析
├── ITSM/IT運用
└── 統合データレイク
```

---

# 🧭 部門別 業務支援システム提案

---

# ① 経営企画部・経営層

（経営企画室・経営企画部）

## 推奨システム

### 📊 Construction Executive Dashboard

### 機能

* 受注高分析
* 工事利益率分析
* 原価推移
* 工事進捗
* 事故件数
* 労務状況
* 資機材コスト分析
* AI予測分析
* BCP状況
* KPI管理
* ESG/SDGs分析

---

## AI活用

* 利益率低下予測
* 赤字案件予測
* 工期遅延予測
* 人材不足予測

---

# ② 営業本部

（営業第一部・第二部・営業統括部・支店営業）

## 推奨システム

### 🤝 Construction CRM & Bid Management

## 機能

* 案件管理
* 入札管理
* 総合評価点分析
* 発注機関分析
* 営業日報
* 名刺OCR
* 契約管理
* 電子契約
* AI入札支援
* 受注確率分析

---

## 特に重要

公共工事では：

* 総合評価点
* 過去実績
* 技術提案書

が重要。

そのため、

```text
AI 技術提案書生成
```

は極めて有効。

---

# ③ ソリューション営業本部

## 推奨システム

### 🌐 Smart Infrastructure Solution Platform

## 機能

* BIM/CIM提案
* IoT提案
* AI解析
* ドローン測量
* 維持管理DX
* 防災DX
* 港湾DX
* 河川監視

---

## 将来的に強い

この部門は、

```text
「建設会社」→「インフラデータ企業」
```

への変革の中心になります。

---

# ④ 施工本部

（工事部・現場）

## 推奨システム

### 🏗 Construction Site Management System

## 機能

* 工程管理
* 出来高管理
* 原価管理
* 現場写真管理
* 電子黒板
* 日報
* KY管理
* 作業員入退場
* 重機管理
* AI工程分析
* ドローン連携
* BIM/CIM連携

---

## 最重要ポイント

### 📱 PWA（オフライン対応）

現場は圏外が多い。

そのため：

```text
オフライン → 後同期
```

が必須。

これは非常に重要です。 

---

# ⑤ 技術本部

（技術部・研究開発部・エンジニアリング部）

## 推奨システム

### 🧠 Technical Knowledge & BIM Platform

## 機能

* 技術資料管理
* BIM/CIM
* CAD図面管理
* 技術ナレッジ
* 施工標準
* AI類似工法検索
* 研究管理
* 特許管理
* 技術提案DB
* 土質データ管理

---

## AI活用

### 🤖 AI施工ナレッジ検索

```text
「過去の港湾工事で地盤改良した事例」
```

を即検索。

これは建設会社では非常に価値があります。

---

# ⑥ 安全品質環境本部

（安全管理部・品質環境部）

## 推奨システム

### 🦺 Safety & Quality Governance Platform

## 機能

* ヒヤリハット
* KY活動
* 労災分析
* 安全パトロール
* 品質記録
* 是正処置
* ISO監査
* CO2排出量
* 産廃管理
* PPE管理
* AI危険予測

---

## AI映像解析

将来的には：

* ヘルメット未着用
* 立入禁止侵入
* 重機接触危険

などをAI検知。

---

# ⑦ 管理本部

（総務・経理・人事・管理）

## 推奨システム

### 🏢 Corporate Operation Platform

## 機能

### 人事

* 人材配置
* 技能資格管理
* 教育管理
* 健康診断
* 労務

### 経理

* 原価
* 支払
* 電帳法
* インボイス

### 総務

* 契約
* 車両
* 備品
* 稟議
* ワークフロー

---

# ⑧ 購買部

## 推奨システム

### 📦 Procurement & Material Platform

## 機能

* 資材発注
* 在庫
* リース
* 協力会社
* 単価比較
* 納期管理
* AI価格予測

---

# ⑨ 船舶事業部

## 推奨システム

### 🚢 Marine Fleet Management

## 機能

* 船舶稼働管理
* AIS連携
* GPS管理
* 燃料管理
* 保守点検
* 航行記録
* 浚渫管理

---

# ⑩ IT/DX部門

（超重要）

## 推奨システム

### 🛡 Construction ITSM & ZeroTrust Platform

## 機能

* ITSM
* CMDB
* SIEM
* SOC
* 資産管理
* Intune代替
* AD/Entra連携
* FortiGate監視
* Cisco監視
* AI HelpDesk

---

## ユーザー環境との親和性

既に：

* Entra ID
* HENNGE
* FortiGate
* SharePoint
* Exchange Online

があるため、かなり強い。 

---

# 🧠 最終的に統合すべきもの

---

# 🌐 Construction Data Lake

全部門データを統合。

## 統合対象

* 工事
* 写真
* BIM
* 人員
* 原価
* 安全
* 資材
* 車両
* ドローン
* IoT
* GPS
* AI解析

---

# 🚀 最終完成形

## Construction Digital Twin Platform

```text
現場
↓
IoT
↓
BIM/CIM
↓
AI解析
↓
経営分析
↓
全社最適化
```

---

# 📌 最初に着手すべき優先順位（重要）

## Phase1（最優先）

1. 施工管理
2. 安全品質
3. ITSM
4. 文書管理
5. 統合認証

---

## Phase2

1. 原価
2. 購買
3. CRM
4. 技術ナレッジ

---

## Phase3

1. BIM/CIM
2. AI解析
3. IoT
4. デジタルツイン

---

# 🎯 特におすすめの戦略

ユーザー環境では、

```text
SharePoint Online
＋
Flask/FastAPI
＋
PostgreSQL
＋
PWA
＋
AI
```

が非常に相性が良いです。

---

# 💡 私ならこう設計します

## 共通基盤

### 認証

* Entra ID
* HENNGE SSO

### 文書

* SharePoint Online
* DirectCloud

### ワークフロー

* DeskNet's NEO
* Flask Workflow Engine

### データ

* PostgreSQL
* Data Lake

### AI

* Azure OpenAI
* ローカルLLM

---

# 🏗 建設土木業で極めて強い構成

```text
WebUI
＋
PWA
＋
オフライン対応
＋
BIM/CIM
＋
AI
＋
IoT
＋
GIS
```

これは今後かなり伸びます。

特に国交省の i-Construction 2.0 と非常に相性が良いです。 

---

# 総合評価

この組織図を見る限り、

```text
「統合建設DX基盤」
```

を構築するポテンシャルはかなり高いです。

特に：

* 支店構造
* 施工本部
* 技術本部
* 安全品質環境本部
* ソリューション営業本部

が独立しているため、

```text
部門別MVP → API統合 → 全社統合
```

の流れが非常に作りやすいです。

