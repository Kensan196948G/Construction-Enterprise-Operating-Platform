# Construction DX — Integrated Data Lake & Digital Twin Frontend (`cdx-data-frontend`)

統合データ基盤 (11 番領域) の Web UI。React 18 + Vite + Tailwind。

## 構成

| ページ | 機能 |
|--------|------|
| `/dashboard` | DataLake 全体状況 (ETL/AI/IoT/Twin/DataSource) |
| `/sources` | 部門別データソース一覧 |
| `/etl` | ETLジョブ + 履歴 + Lineage (SVG) |
| `/lake` | DataLake テーブル一覧 + サンプル表示 |
| `/analytics` | 分析クエリプレイグラウンド |
| `/ai` | AIモデル管理 + 推論実行 |
| `/iot` | デバイス一覧 + テレメトリチャート |
| `/twin` | デジタルツイン: GeoJSON シーン (Leaflet/Cesium 切り替え) |
| `/search` | Elasticsearch 横断検索 (kuromoji + ハイライト) |

## デジタルツイン描画方針

- 本番では `cesium` + `resium` + Cesium Ion (3D Tiles) を使用する想定。
- ライセンス / バンドルサイズの観点から、skeleton では `leaflet` + OSM タイル
  を使用し、サーバから取得した GeoJSON FeatureCollection をマーカーで描画。
- `CESIUM_ION_ACCESS_TOKEN` が指定された場合は Cesium 実装へ差し替え可能な
  境界を `components/DigitalTwinScene.tsx` で確保。

## 開発

```powershell
npm install
npm run dev          # http://localhost:5181
npm run typecheck
npm run build
```

`/api/*` は `vite.config.ts` の proxy で `http://localhost:8000` (FastAPI) に転送。
