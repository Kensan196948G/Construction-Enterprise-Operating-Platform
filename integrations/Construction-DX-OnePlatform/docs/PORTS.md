# 🔒 Construction DX One Platform — 公式ポート割当 (固定)

> **本プロジェクト専用ポート**。他プロジェクトでの使用禁止。
> Firewall / docker-compose / 自動起動スクリプトはすべてこの表を真実として参照する。

---

## 📋 ポート一覧 (portal auto / 5180-5190 / 8001-8011 + 8080/8090)

### 🌐 統合ポータル (1 ポート)

| ポート | サービス | 用途 |
|:--:|:---|:---|
| **auto** | 統合ポータル (React シェル) | `scripts/cdx-portal-env.sh` がIPと空きポートを自動検出。既定候補は 5179 |

### 🎨 Frontend Vite dev (11 ポート連番)

| ポート | 部門 | アイコン | システム名 |
|:--:|:---|:--:|:---|
| **5180** | 01 経営企画部 | 📊 | Construction Executive Dashboard |
| **5181** | 02 営業本部 | 🤝 | Construction CRM & Bid Management |
| **5182** | 03 ソリューション営業本部 | 🌐 | Smart Infrastructure Solution Platform |
| **5183** | 04 施工本部 | 🏗 | Construction Site Management System |
| **5184** | 05 技術本部 | 🧠 | Technical Knowledge & BIM Platform |
| **5185** | 06 安全品質環境本部 | 🦺 | Safety & Quality Governance Platform |
| **5186** | 07 管理本部 | 🏢 | Corporate Operation Platform |
| **5187** | 08 購買部 | 📦 | Procurement & Material Platform |
| **5188** | 09 船舶事業部 | 🚢 | Marine Fleet Management |
| **5189** | 10 IT-DX部門 | 🛡 | Construction ITSM & ZeroTrust Platform |
| **5190** | 11 統合データ基盤 | 🌐 | Construction Data Lake & Digital Twin |

### 🐍 Backend uvicorn FastAPI (11 ポート連番)

| ポート | 部門 | モジュール |
|:--:|:---|:---|
| **8001** | 01 経営企画 backend | `exec_api.main:app` |
| **8002** | 02 営業 backend | `crm_api.main:app` |
| **8003** | 03 ソリューション backend | `sol_api.main:app` |
| **8004** | 04 施工 backend | `site_api.main:app` |
| **8005** | 05 技術 backend | `tech_api.main:app` |
| **8006** | 06 安全品質 backend | `sq_api.main:app` |
| **8007** | 07 管理 backend | `corp_api.main:app` |
| **8008** | 08 購買 backend | `proc_api.main:app` |
| **8009** | 09 船舶 backend | `marine_api.main:app` |
| **8010** | 10 IT-DX backend | `itsm_api.main:app` |
| **8011** | 11 統合データ backend | `data_api.main:app` |

### 🧱 共通基盤 (2 ポート)

| ポート | サービス | 用途 |
|:--:|:---|:---|
| **8080** | API Gateway | 11 部門 API 集約エッジ (FastAPI) |
| **8090** | Mocks サーバー | 横断モックデータ供給 (dev/UAT) |

---

## 🚫 排他ルール (このプロジェクト専有)

| ポート範囲 | 占有 | 他プロジェクトでの使用 |
|:---|:---|:---|
| `5179`, `5200-5210`, `5180-5190` | Construction DX | ポータル自動採番候補 / 部門WebUI |
| `8001-8011` | Construction DX | 🚫 **禁止** |
| `8080`, `8090` | Construction DX | 🚫 **禁止** |

→ Windows Firewall ルール `CDX-*` で受信を予約 (`scripts/firewall-rules.ps1`)。
→ docker-compose は別途 production 用 `:3000-:3013` を使用 (これらも CDX 専有)。

---

## 🔄 ポート変更時の同期対象 (変更厳禁、するなら一括)

| ファイル | 変更箇所 |
|:---|:---|
| `docs/PORTS.md` | 本ファイル (真実の源) |
| `package.json` | `dev:*` スクリプト 11 件 |
| `scripts/fullstack-up-all.ps1` | `$Frontends` / `$Backends` 定義 |
| `scripts/firewall-rules.ps1` | 受信許可ポート範囲 |
| `00_共通基盤/portal/index.html` | カード URL + Health dot data-port |
| `0[1-9]_*/*/frontend/vite.config.ts` | `server.port` |
| `0[1-9]_*/*/frontend/vite.config.ts` | `proxy.target` |
| `README.md` | URL 一覧テーブル |

---

## 🌐 公式アクセス URL

| アクセス | URL |
|:---|:---|
| ⭐ **統合ポータル** | `.runtime/cdx-portal.env` の `CDX_PORTAL_URL` |
| 11 部門 WebUI | http://192.168.0.143:**5180-5190**/ |
| 11 部門 Backend API | http://192.168.0.143:**8001-8011**/ |
| API Gateway | http://192.168.0.143:**8080**/ |
| Mocks | http://192.168.0.143:**8090**/ |

---

## 📜 改定履歴

| 日付 | Loop | 変更内容 |
|:---|:---:|:---|
| 2026-05-23 | #13 | Frontend ポート 5180-5190 を unique 割当に統一 |
| 2026-05-23 | #14 | Backend ポート 8001-8011 を確定 |
| 2026-05-23 | #17 | 統合ポータル 5179 追加 |
| 2026-05-23 | #18 | 本ドキュメント正式制定 |
| 2026-05-23 | #19 | ポート 5179 を Anthropic Design 由来 React 統合シェル (14 ページ) に置換、旧静的版は `index-legacy-loop18.html` に退避 |
