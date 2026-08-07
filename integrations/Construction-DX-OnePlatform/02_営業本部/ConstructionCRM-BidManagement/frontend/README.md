# cdx-crm-frontend — 建設CRM・入札管理 SPA

Construction DX One Platform 営業本部の建設 CRM & 入札管理フロントエンド (Vite + React 18 + TypeScript strict)。

## 主な画面

- ダッシュボード (受注見込/実績/失注を Recharts で可視化)
- 顧客一覧 / 顧客詳細 (与信ランク A/B/C/D/未評価, 関係性スコア, 取引履歴, 関連案件)
- 案件パイプライン (Kanban + 加重期待値サマリ)
- 入札一覧 / 入札詳細 (公共/民間, 総合評価点, 落札率)
- 見積一覧 / 見積エディタ (React Hook Form + zod, バージョン管理)
- 契約一覧
- 営業活動 (訪問/電話/メール/提案/会議 を日付別にグルーピング表示)

## 起動

```bash
cd 02_営業本部/ConstructionCRM-BidManagement/frontend
npm install
npm run dev    # http://localhost:5173 (API は /api/v1 -> :8000 proxy)
```

## 依存

- `@cdx/shared-ui` の Layout / DataTable / FormBuilder / ChartWrapper を活用可能 (ローカル workspace 依存)
- axios で `/api/v1` プレフィクスを設定し、zustand-persist で JWT を保管

## 認証

`useAuthStore.setToken(jwt)` で Bearer JWT を保存すると、以降の API 呼出に自動付与される。401 受信時は自動で token クリア。
