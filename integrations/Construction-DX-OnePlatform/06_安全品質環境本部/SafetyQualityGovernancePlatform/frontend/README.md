# @cdx/sq-frontend

安全品質ガバナンスプラットフォーム フロントエンド (React + Vite + PWA)。
モバイル現場利用前提、オフライン保存 (Dexie) + Workbox SW。

## 起動

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev   # http://localhost:5173
npm run build
```

`VITE_API_BASE=http://localhost:8000/api/v1` で接続先設定可。

## 画面

| パス | 機能 |
|------|------|
| `/` | ダッシュボード (KPI/4M/CO2) |
| `/near-miss` | ヒヤリハット (4M分析 + オフライン) |
| `/ky` | KY 活動 |
| `/accident` | 労災 + 度数率/強度率 |
| `/patrol` | パトロール (チェックリスト + 写真) |
| `/quality` | 品質 (規格上下限合否) |
| `/nonconformity` | 不適合 + CAPA 3ステップ |
| `/iso` | ISO 9001/14001/45001 監査 |
| `/environment` | CO2 Scope1/2/3 + 産廃 |
| `/ai` | AI 危険予測 |
