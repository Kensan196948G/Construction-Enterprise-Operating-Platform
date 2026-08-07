import { forwardRef, type HTMLAttributes } from 'react';
import { MapPin, Layers, Hash, ExternalLink } from 'lucide-react';
import { cn } from '../utils/cn';
import { BimViewerThumb } from './BimViewerThumb';

export type DigitalTwinKind =
  | 'building'
  | 'bridge'
  | 'road'
  | 'tunnel'
  | 'dam'
  | 'plant'
  | 'other';

export interface DigitalTwinPanelProps extends HTMLAttributes<HTMLDivElement> {
  /** Twin オブジェクト名 */
  name: string;
  /** Twin 種別 */
  kind: DigitalTwinKind;
  /** Twin 一意ID (例: DT-2026-0001) */
  twinId: string;
  /** 位置 (緯度経度 or 住所) */
  location?: { lat: number; lng: number } | string;
  /** 関連工事ID */
  relatedProjectId?: string;
  /** 関連工事名 */
  relatedProjectName?: string;
  /** BIM サムネ画像 */
  thumbnailSrc?: string;
  /** BIM フォーマット */
  bimFormat?: string;
  /** 3Dビューア起動 */
  onOpenViewer?: () => void;
  /** 関連工事画面遷移 */
  onOpenProject?: () => void;
}

const KIND_LABEL: Record<DigitalTwinKind, string> = {
  building: '建築',
  bridge: '橋梁',
  road: '道路',
  tunnel: 'トンネル',
  dam: 'ダム',
  plant: 'プラント',
  other: 'その他',
};

const formatLocation = (loc: { lat: number; lng: number } | string): string =>
  typeof loc === 'string' ? loc : `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`;

/**
 * DigitalTwin オブジェクトの情報パネル。
 * 種別 / 位置 / 関連工事 / 3D サムネイルをまとめて表示。
 */
export const DigitalTwinPanel = forwardRef<HTMLDivElement, DigitalTwinPanelProps>(
  (
    {
      name,
      kind,
      twinId,
      location,
      relatedProjectId,
      relatedProjectName,
      thumbnailSrc,
      bimFormat,
      onOpenViewer,
      onOpenProject,
      className,
      ...rest
    },
    ref,
  ) => {
    return (
      <article
        ref={ref}
        aria-label={`DigitalTwin ${name}`}
        className={cn('cdx-card p-4 flex gap-4', className)}
        {...rest}
      >
        <BimViewerThumb
          modelName={name}
          size="sm"
          thumbnailSrc={thumbnailSrc}
          format={bimFormat}
          onOpenViewer={onOpenViewer}
        />
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <header className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-slate-900 truncate">{name}</h3>
            <span className="text-[10px] font-mono bg-secondary-100 text-secondary-800 px-1.5 py-0.5 rounded shrink-0">
              {KIND_LABEL[kind]}
            </span>
          </header>
          <dl className="text-xs text-slate-600 space-y-1">
            <div className="flex items-center gap-1">
              <Hash size={12} aria-hidden="true" />
              <dt className="sr-only">Twin ID</dt>
              <dd className="font-mono">{twinId}</dd>
            </div>
            {location && (
              <div className="flex items-center gap-1">
                <MapPin size={12} aria-hidden="true" />
                <dt className="sr-only">位置</dt>
                <dd className="truncate">{formatLocation(location)}</dd>
              </div>
            )}
            {relatedProjectName && (
              <div className="flex items-center gap-1">
                <Layers size={12} aria-hidden="true" />
                <dt className="sr-only">関連工事</dt>
                <dd className="truncate">
                  {onOpenProject ? (
                    <button
                      type="button"
                      onClick={onOpenProject}
                      className="inline-flex items-center gap-0.5 text-secondary-700 hover:underline"
                    >
                      {relatedProjectName}
                      <ExternalLink size={10} aria-hidden="true" />
                    </button>
                  ) : (
                    <span>{relatedProjectName}</span>
                  )}
                  {relatedProjectId && (
                    <span className="text-slate-400 ml-1">({relatedProjectId})</span>
                  )}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </article>
    );
  },
);
DigitalTwinPanel.displayName = 'DigitalTwinPanel';
