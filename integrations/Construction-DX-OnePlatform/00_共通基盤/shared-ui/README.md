# @cdx/shared-ui

Construction DX One Platform の **共通UIライブラリ**。
Phase 1 の全部門フロントエンドから `import` される基盤コンポーネント群です。

- React 18 + TypeScript 5 (strict)
- Tailwind CSS v3 (建設DX カラーパレット)
- react-hook-form + zod / Recharts / Leaflet / lucide-react
- ESM + CJS デュアルビルド (`tsup`)

---

## インストール (モノレポ内)

```bash
pnpm add @cdx/shared-ui
# peerDependencies
pnpm add react react-dom
```

### Tailwind 利用側の `tailwind.config.ts`

```ts
import sharedPreset from '@cdx/shared-ui/tailwind.config';

export default {
  presets: [sharedPreset],
  content: [
    './src/**/*.{ts,tsx}',
    './node_modules/@cdx/shared-ui/dist/**/*.{js,cjs}',
  ],
};
```

### Leaflet 利用時

```ts
import 'leaflet/dist/leaflet.css';
```

---

## カラーパレット

| 用途 | キー | 値 |
|---|---|---|
| 安全オレンジ | `primary` | `#f97316` |
| 海上ブルー | `secondary` | `#0284c7` |
| 黄黒安全 | `accent` | `#eab308` |
| 危険 | `danger` | `#dc2626` |
| 成功 | `success` | `#16a34a` |
| 4M / 人 | `4m-man` | `#3b82f6` |
| 4M / 機械 | `4m-machine` | `#f59e0b` |
| 4M / 材料 | `4m-material` | `#10b981` |
| 4M / 方法 | `4m-method` | `#8b5cf6` |

---

## コンポーネント一覧

| コンポーネント | 概要 |
|---|---|
| `Layout` | サイドバー + ヘッダー + メインの3ペインレイアウト (レスポンシブ / 折りたたみ) |
| `DataTable<T>` | ジェネリック型・ソート/フィルタ/ページネーション付きテーブル |
| `FormBuilder` | zod スキーマから動的フォーム生成 (text / number / date / select / textarea / file) |
| `ChartWrapper` | Recharts ラッパー (line / bar / pie 切替) |
| `FileUploader` | D&D + クリック / 複数 / 進捗 / 画像プレビュー / 最大サイズ |
| `OfflineIndicator` | `navigator.onLine` 監視 → 赤バナー & 復帰トースト |
| `SyncStatusBar` | 未同期件数 / 最終同期時刻 / 手動同期 |
| `MapViewer` | Leaflet (既定) / Cesium 切替、マーカー & ポリゴン |
| `SafetyBadge` | 安全レベル + i-Construction 4M 色 |
| `PhotoCard` | 現場写真カード (撮影日時 / 位置 / AI 分類タグ) |

---

## サンプル (Storybook 風)

### Layout

```tsx
import { Layout } from '@cdx/shared-ui';

export function AppShell() {
  return (
    <Layout
      logo={<span>CDX</span>}
      sidebar={
        <ul className="px-3 space-y-1">
          <li>ダッシュボード</li>
          <li>現場一覧</li>
        </ul>
      }
      header={<h1 className="text-base">○○建設</h1>}
    >
      {/* react-router の <Outlet /> 等 */}
    </Layout>
  );
}
```

### DataTable

```tsx
import { DataTable, type DataTableColumn } from '@cdx/shared-ui';

interface Material { id: number; name: string; qty: number }

const columns: DataTableColumn<Material>[] = [
  { key: 'name', header: '資材名', accessor: (r) => r.name, sortable: true },
  { key: 'qty', header: '数量', accessor: (r) => r.qty, sortValue: (r) => r.qty, sortable: true, align: 'right' },
];

<DataTable
  columns={columns}
  data={materials}
  rowKey={(r) => r.id}
  pageSize={20}
  onRowClick={(r) => navigate(`/materials/${r.id}`)}
/>
```

### FormBuilder

```tsx
import { FormBuilder } from '@cdx/shared-ui';
import { z } from 'zod';

const schema = z.object({
  siteName: z.string().min(1, '現場名は必須です'),
  startDate: z.string().min(1, '開始日は必須です'),
});

<FormBuilder
  schema={schema}
  fields={[
    { name: 'siteName', label: '現場名', type: 'text', required: true },
    { name: 'startDate', label: '開始日', type: 'date', required: true },
  ]}
  onSubmit={(values) => console.log(values)}
  showReset
/>
```

### ChartWrapper

```tsx
import { ChartWrapper } from '@cdx/shared-ui';

<ChartWrapper
  type="line"
  title="出来高推移"
  xKey="month"
  data={[
    { month: '4月', planned: 80, actual: 75 },
    { month: '5月', planned: 100, actual: 105 },
  ]}
  series={[
    { dataKey: 'planned', name: '計画 (百万円)' },
    { dataKey: 'actual', name: '実績 (百万円)' },
  ]}
/>
```

### FileUploader

```tsx
import { FileUploader } from '@cdx/shared-ui';

<FileUploader
  multiple
  maxSize={20 * 1024 * 1024}
  accept="image/*,.pdf"
  onUpload={async (file, onProgress) => {
    // XHR で進捗付きアップロード
    await uploadToS3(file, onProgress);
  }}
/>
```

### OfflineIndicator / SyncStatusBar

```tsx
<OfflineIndicator />
<SyncStatusBar
  pendingCount={pending.length}
  lastSyncedAt={lastSyncedAt}
  state={syncing ? 'syncing' : 'idle'}
  onSync={runSync}
/>
```

### MapViewer

```tsx
<MapViewer
  center={[35.6762, 139.6503]}
  zoom={12}
  markers={sites.map((s) => ({
    id: s.id,
    lat: s.lat,
    lng: s.lng,
    label: s.name,
  }))}
  polygons={[{ id: 'area-1', positions: [[35.67, 139.65], [35.68, 139.65], [35.68, 139.66]] }]}
/>
```

### SafetyBadge

```tsx
<SafetyBadge level="safe" />
<SafetyBadge level="danger" category="machine" label="重機接近" />
```

### PhotoCard

```tsx
<PhotoCard
  src="/photos/2026-05-22-001.jpg"
  alt="基礎工事 配筋検査"
  title="配筋検査"
  takenAt={new Date()}
  location={{ lat: 35.6762, lng: 139.6503 }}
  tags={[
    { label: 'ヘルメット未着用', color: 'danger', confidence: 0.92 },
    { label: '配筋', color: 'secondary' },
  ]}
/>
```

---

## 開発

```bash
pnpm install
pnpm dev               # tsup --watch
pnpm build             # ESM + CJS + d.ts
pnpm test              # vitest
pnpm typecheck         # tsc --noEmit
pnpm lint
pnpm storybook         # Storybook を http://localhost:6006 で起動
pnpm build-storybook   # 静的ビルドを storybook-static/ に出力
```

## Storybook

全コンポーネントのストーリを `src/components/__stories__/*.stories.tsx` に配置しています。
カテゴリ構成は次のとおりです (Storybook サイドバー左上の階層と一致):

- **Foundation** — `Layout` / `DataTable` / `FormBuilder` / `ChartWrapper` / `FileUploader`
- **Status** — `OfflineIndicator` / `SyncStatusBar` / `AlertSeverityChip`
- **Field** — `MapViewer` / `PhotoCard` / `SafetyBadge`
- **KPI** — `KpiBigNumber` / `ProgressRing` / `RiskHeatmap` / `TimelineLog`
- **BIM/DigitalTwin** — `BimViewerThumb` / `DigitalTwinPanel`
- **ESG** — `SdgBadge` / `EsgScoreCard` / `LegalComplianceBadge`

各ストーリには Controls / Docs / a11y アドオンが利用できます。
画像は本リポジトリには含めていません — 実行して確認してください
(`pnpm storybook` 起動後にトップカテゴリから各コンポーネントを選択)。

## Phase 2/3 拡張コンポーネント

| コンポーネント | 概要 |
|---|---|
| `KpiBigNumber` | 経営/部門 KPI の大きな数値カード (前期比・アイコン対応) |
| `ProgressRing` | 進捗率の円リング表示 (SVG) |
| `RiskHeatmap` | 発生確率 × 影響度 のリスクヒートマップ |
| `TimelineLog` | アクティビティ / 監査 / 履歴の時系列ログ |
| `BimViewerThumb` | BIM モデル サムネイル (Three.js ビューア起動用) |
| `DigitalTwinPanel` | DigitalTwin オブジェクト情報パネル (種別/位置/関連工事/3Dサムネ) |
| `SdgBadge` | SDGs 17 ゴール バッジ |
| `EsgScoreCard` | ESG 3軸 (E/S/G) スコアカード |
| `AlertSeverityChip` | アラート重要度 chip (info/warning/critical) |
| `LegalComplianceBadge` | 法令準拠バッジ (ISO/建設業法/品確法/i-Construction/CCUS 等) |

## フォーマッタユーティリティ

`@cdx/shared-ui` から下記をエクスポート:

```ts
import {
  formatCurrencyJpy,   // 12345 → '¥12,345'
  formatPercent,        // 12.345 → '12.3%'
  formatLargeNumber,    // 12345 → '1.2万', 123456789 → '1.2億'
  formatJaDate,         // new Date() → '2026/05/22'
} from '@cdx/shared-ui';
```

---

## ライセンス

UNLICENSED (社内利用限定)
