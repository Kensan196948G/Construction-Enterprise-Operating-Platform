import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../utils/cn';

export interface KpiBigNumberProps extends HTMLAttributes<HTMLDivElement> {
  /** KPI 名称 */
  label: string;
  /** KPI の値 (数値またはフォーマット済み文字列) */
  value: number | string;
  /** 単位 (例: '百万円', '%', '件') */
  unit?: string;
  /** 前期比 (%)。正で増加、負で減少 */
  deltaPercent?: number;
  /** 増加が好ましくない指標 (事故件数等) なら true を指定 */
  invertDeltaColor?: boolean;
  /** 補足文 */
  caption?: string;
  /** アイコン (lucide-react 等) */
  icon?: ReactNode;
  /** サイズ */
  size?: 'md' | 'lg';
}

/**
 * 経営/部門ダッシュボードで使う「大きな数値」KPI 表示カード。
 */
export const KpiBigNumber = forwardRef<HTMLDivElement, KpiBigNumberProps>(
  (
    {
      label,
      value,
      unit,
      deltaPercent,
      invertDeltaColor = false,
      caption,
      icon,
      size = 'md',
      className,
      ...rest
    },
    ref,
  ) => {
    const hasDelta = typeof deltaPercent === 'number' && Number.isFinite(deltaPercent);
    const positive = hasDelta && deltaPercent! > 0;
    const negative = hasDelta && deltaPercent! < 0;
    const good = invertDeltaColor ? negative : positive;
    const bad = invertDeltaColor ? positive : negative;
    const deltaColor = good
      ? 'text-success-700'
      : bad
        ? 'text-danger-700'
        : 'text-slate-500';
    const DeltaIcon = positive ? TrendingUp : negative ? TrendingDown : Minus;

    return (
      <div
        ref={ref}
        role="group"
        aria-label={`KPI: ${label}`}
        className={cn('cdx-card p-4 flex flex-col gap-1', className)}
        {...rest}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">{label}</span>
          {icon && <span className="text-slate-400" aria-hidden="true">{icon}</span>}
        </div>
        <div className="flex items-baseline gap-1.5">
          <span
            className={cn(
              'font-bold text-slate-900 tabular-nums',
              size === 'lg' ? 'text-4xl' : 'text-3xl',
            )}
          >
            {value}
          </span>
          {unit && <span className="text-sm text-slate-600">{unit}</span>}
        </div>
        {(hasDelta || caption) && (
          <div className="flex items-center gap-2 text-xs">
            {hasDelta && (
              <span
                className={cn('inline-flex items-center gap-0.5 font-medium', deltaColor)}
                aria-label={`前期比 ${deltaPercent! > 0 ? '+' : ''}${deltaPercent!.toFixed(1)}%`}
              >
                <DeltaIcon size={12} aria-hidden="true" />
                {deltaPercent! > 0 ? '+' : ''}
                {deltaPercent!.toFixed(1)}%
              </span>
            )}
            {caption && <span className="text-slate-500">{caption}</span>}
          </div>
        )}
      </div>
    );
  },
);
KpiBigNumber.displayName = 'KpiBigNumber';
