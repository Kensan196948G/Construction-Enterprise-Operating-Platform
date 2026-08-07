// ============================================================
// @cdx/shared-ui  — Construction DX One Platform 共通UIライブラリ
// ============================================================

// ユーティリティ
export { cn } from './utils/cn';
export {
  formatCurrencyJpy,
  formatPercent,
  formatLargeNumber,
  formatJaDate,
} from './utils/formatters';

// レイアウト
export { Layout } from './components/Layout';
export type { LayoutProps } from './components/Layout';

// データ表示
export { DataTable } from './components/DataTable';
export type { DataTableProps, DataTableColumn } from './components/DataTable';

// フォーム
export { FormBuilder } from './components/FormBuilder';
export type {
  FormBuilderProps,
  FormField,
  FormFieldType,
  FormFieldOption,
} from './components/FormBuilder';

// チャート
export { ChartWrapper } from './components/ChartWrapper';
export type { ChartWrapperProps, ChartKind, ChartSeries } from './components/ChartWrapper';

// ファイル
export { FileUploader } from './components/FileUploader';
export type { FileUploaderProps, UploadedFileInfo } from './components/FileUploader';

// オフラインファースト
export { OfflineIndicator } from './components/OfflineIndicator';
export type { OfflineIndicatorProps } from './components/OfflineIndicator';
export { SyncStatusBar } from './components/SyncStatusBar';
export type { SyncStatusBarProps, SyncState } from './components/SyncStatusBar';

// 地図
export { MapViewer } from './components/MapViewer';
export type {
  MapViewerProps,
  MapEngine,
  MapMarker,
  MapPolygon,
} from './components/MapViewer';

// 安全
export { SafetyBadge } from './components/SafetyBadge';
export type { SafetyBadgeProps, SafetyLevel, FourM } from './components/SafetyBadge';

// 写真
export { PhotoCard } from './components/PhotoCard';
export type { PhotoCardProps, PhotoCardTag } from './components/PhotoCard';

// ----- Phase 2/3 拡張コンポーネント -----

// KPI 表示
export { KpiBigNumber } from './components/KpiBigNumber';
export type { KpiBigNumberProps } from './components/KpiBigNumber';

// 進捗
export { ProgressRing } from './components/ProgressRing';
export type { ProgressRingProps } from './components/ProgressRing';

// リスク
export { RiskHeatmap } from './components/RiskHeatmap';
export type { RiskHeatmapProps, RiskHeatmapCell } from './components/RiskHeatmap';

// 履歴 / 活動ログ
export { TimelineLog } from './components/TimelineLog';
export type {
  TimelineLogProps,
  TimelineLogEntry,
  TimelineSeverity,
} from './components/TimelineLog';

// BIM / DigitalTwin
export { BimViewerThumb } from './components/BimViewerThumb';
export type { BimViewerThumbProps } from './components/BimViewerThumb';
export { DigitalTwinPanel } from './components/DigitalTwinPanel';
export type {
  DigitalTwinPanelProps,
  DigitalTwinKind,
} from './components/DigitalTwinPanel';

// ESG / SDGs
export { SdgBadge } from './components/SdgBadge';
export type { SdgBadgeProps, SdgGoal } from './components/SdgBadge';
export { EsgScoreCard } from './components/EsgScoreCard';
export type { EsgScoreCardProps, EsgScores } from './components/EsgScoreCard';

// アラート
export { AlertSeverityChip } from './components/AlertSeverityChip';
export type {
  AlertSeverityChipProps,
  AlertSeverity,
} from './components/AlertSeverityChip';

// 法令準拠
export { LegalComplianceBadge } from './components/LegalComplianceBadge';
export type {
  LegalComplianceBadgeProps,
  LegalStandard,
  ComplianceStatus,
} from './components/LegalComplianceBadge';
