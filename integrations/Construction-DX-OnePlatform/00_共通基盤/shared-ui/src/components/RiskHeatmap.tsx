import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../utils/cn';

export interface RiskHeatmapCell {
  /** 発生確率 (1-5, X軸) */
  probability: number;
  /** 影響度 (1-5, Y軸) */
  impact: number;
  /** セル件数 */
  count: number;
  /** クリック時に渡されるID等 */
  id?: string;
}

export interface RiskHeatmapProps extends HTMLAttributes<HTMLDivElement> {
  /** リスクセル配列 */
  cells: RiskHeatmapCell[];
  /** 軸サイズ (既定 5x5) */
  axisSize?: number;
  /** X軸ラベル */
  probabilityLabel?: string;
  /** Y軸ラベル */
  impactLabel?: string;
  /** セルクリック */
  onCellClick?: (cell: {
    probability: number;
    impact: number;
    count: number;
    id?: string | undefined;
  }) => void;
}

/** スコア (probability * impact) からセル背景色を決定 */
function scoreColor(score: number, max: number): string {
  const ratio = score / max;
  if (ratio >= 0.7) return 'bg-danger text-white';
  if (ratio >= 0.45) return 'bg-orange-500 text-white';
  if (ratio >= 0.25) return 'bg-accent text-slate-900';
  if (ratio > 0) return 'bg-success-100 text-success-800';
  return 'bg-slate-50 text-slate-400';
}

/**
 * リスクマトリクス (発生確率 × 影響度) ヒートマップ。
 */
export const RiskHeatmap = forwardRef<HTMLDivElement, RiskHeatmapProps>(
  (
    {
      cells,
      axisSize = 5,
      probabilityLabel = '発生確率',
      impactLabel = '影響度',
      onCellClick,
      className,
      ...rest
    },
    ref,
  ) => {
    const maxScore = axisSize * axisSize;
    const map = new Map<string, RiskHeatmapCell>();
    for (const c of cells) {
      map.set(`${c.probability}:${c.impact}`, c);
    }

    // Y軸: 影響度 (高い順に上)、X軸: 発生確率 (低→高)
    const yValues = Array.from({ length: axisSize }, (_, i) => axisSize - i);
    const xValues = Array.from({ length: axisSize }, (_, i) => i + 1);

    return (
      <div
        ref={ref}
        role="table"
        aria-label={`リスクマトリクス ${probabilityLabel} × ${impactLabel}`}
        className={cn('inline-flex flex-col gap-1', className)}
        {...rest}
      >
        <div className="text-xs text-slate-500 text-center">{impactLabel} ↑</div>
        <div className="flex gap-2">
          <div className="flex flex-col-reverse justify-between text-xs text-slate-500 py-1">
            {yValues.slice().reverse().map((y) => (
              <span key={y} className="h-10 flex items-center">
                {y}
              </span>
            ))}
          </div>
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${axisSize}, 2.5rem)` }}
          >
            {yValues.map((y) =>
              xValues.map((x) => {
                const cell = map.get(`${x}:${y}`);
                const count = cell?.count ?? 0;
                const score = x * y;
                const isInteractive = !!onCellClick && count > 0;
                return (
                  <button
                    key={`${x}-${y}`}
                    type="button"
                    role="cell"
                    aria-label={`${probabilityLabel} ${x} / ${impactLabel} ${y}: ${count}件`}
                    disabled={!isInteractive}
                    onClick={
                      isInteractive
                        ? () =>
                            onCellClick?.({
                              probability: x,
                              impact: y,
                              count,
                              id: cell?.id,
                            })
                        : undefined
                    }
                    className={cn(
                      'h-10 w-10 rounded text-sm font-semibold flex items-center justify-center',
                      'transition-transform',
                      scoreColor(count > 0 ? score : 0, maxScore),
                      isInteractive && 'cursor-pointer hover:scale-105 focus-visible:scale-105',
                    )}
                  >
                    {count > 0 ? count : ''}
                  </button>
                );
              }),
            )}
          </div>
        </div>
        <div className="flex gap-2 pl-7">
          <div
            className="grid text-xs text-slate-500 text-center"
            style={{ gridTemplateColumns: `repeat(${axisSize}, 2.5rem)`, gap: '0.25rem' }}
          >
            {xValues.map((x) => (
              <span key={x}>{x}</span>
            ))}
          </div>
        </div>
        <div className="text-xs text-slate-500 text-center">{probabilityLabel} →</div>
      </div>
    );
  },
);
RiskHeatmap.displayName = 'RiskHeatmap';
