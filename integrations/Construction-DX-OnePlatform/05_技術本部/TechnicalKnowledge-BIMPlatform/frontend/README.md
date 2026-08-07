# cdx-tech-frontend — Technical Knowledge & BIM Platform Frontend

React + Vite + TypeScript + Three.js + web-ifc による技術ナレッジ・BIM/CIM フロントエンド。

## 機能

- ダッシュボード (利用統計, 人気記事)
- 技術ナレッジ検索・閲覧 (Markdown 表示)
- BIM ビューア (Three.js + web-ifc placeholder, LOD 切替, レイヤー切替)
- CIM / 点群ビューア skeleton (将来 Potree / 3D Tiles へ)
- 標準図ライブラリ
- 仕様書一覧
- 技術問合せ Q&A (AI ドラフト回答付き)

## ローカル開発

```bash
npm install --legacy-peer-deps
npm run dev
```

`/api` リクエストは `vite.config.ts` の proxy で `http://localhost:8000` に転送されます。

## 認証

`localStorage.cdx_token` に Entra ID から取得した Bearer JWT を格納してください。
全ての API 呼び出しに自動で `Authorization` ヘッダを付与します。

## 3D ライブラリ

- `three`, `@react-three/fiber`, `@react-three/drei`
- `web-ifc` / `web-ifc-three`: 実 IFC ロードを行う際に `BimViewer3D` を拡張

## 注意

- IFC 実ファイルロードは骨格段階では未接続。Placeholder メッシュを描画します。
- CIM 点群はダミー生成。本番では `tile_url_template` から 3D Tiles を読み込みます。
