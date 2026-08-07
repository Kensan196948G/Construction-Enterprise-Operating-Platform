import { forwardRef, type HTMLAttributes } from 'react';
import { Box, Eye } from 'lucide-react';
import { cn } from '../utils/cn';

export interface BimViewerThumbProps extends HTMLAttributes<HTMLDivElement> {
  /** BIM モデル名 */
  modelName: string;
  /** 事前生成済みサムネ画像 URL (省略時は SVG プレースホルダ) */
  thumbnailSrc?: string;
  /** IFC 等のファイル形式 */
  format?: 'IFC' | 'RVT' | 'glTF' | 'OBJ' | string;
  /** 要素数 / 部材数 */
  elementCount?: number;
  /** クリックでビューア起動 */
  onOpenViewer?: () => void;
  /** サイズ */
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_STYLE: Record<NonNullable<BimViewerThumbProps['size']>, string> = {
  sm: 'w-32 h-24',
  md: 'w-48 h-32',
  lg: 'w-64 h-44',
};

/**
 * BIM モデルのサムネイル表示 (Three.js ビューア起動の placeholder)。
 */
export const BimViewerThumb = forwardRef<HTMLDivElement, BimViewerThumbProps>(
  (
    { modelName, thumbnailSrc, format, elementCount, onOpenViewer, size = 'md', className, ...rest },
    ref,
  ) => {
    const interactive = !!onOpenViewer;
    return (
      <div
        ref={ref}
        role={interactive ? 'button' : 'img'}
        aria-label={`BIM モデル ${modelName}`}
        tabIndex={interactive ? 0 : undefined}
        onClick={onOpenViewer}
        onKeyDown={
          interactive
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onOpenViewer?.();
                }
              }
            : undefined
        }
        className={cn(
          'cdx-card overflow-hidden flex flex-col group',
          interactive && 'cursor-pointer hover:shadow-cdx-md transition-shadow',
          className,
        )}
        {...rest}
      >
        <div
          className={cn(
            'relative bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center',
            SIZE_STYLE[size],
          )}
        >
          {thumbnailSrc ? (
            <img
              src={thumbnailSrc}
              alt={`${modelName} サムネイル`}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <Box size={48} className="text-slate-400" aria-hidden="true" />
          )}
          {interactive && (
            <span
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium gap-1"
              aria-hidden="true"
            >
              <Eye size={14} /> 3D で開く
            </span>
          )}
          {format && (
            <span className="absolute top-1 right-1 text-[10px] font-mono bg-slate-900/70 text-white px-1.5 py-0.5 rounded">
              {format}
            </span>
          )}
        </div>
        <div className="p-2 text-xs">
          <p className="font-semibold text-slate-800 truncate" title={modelName}>
            {modelName}
          </p>
          {typeof elementCount === 'number' && (
            <p className="text-slate-500">要素 {elementCount.toLocaleString('ja-JP')} 件</p>
          )}
        </div>
      </div>
    );
  },
);
BimViewerThumb.displayName = 'BimViewerThumb';
