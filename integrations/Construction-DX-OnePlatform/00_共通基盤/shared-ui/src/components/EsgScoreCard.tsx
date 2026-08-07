import { forwardRef, type HTMLAttributes } from 'react';
import { Leaf, Users, Scale } from 'lucide-react';
import { cn } from '../utils/cn';

export interface EsgScores {
  /** 環境スコア 0-100 */
  environment: number;
  /** 社会スコア 0-100 */
  social: number;
  /** ガバナンススコア 0-100 */
  governance: number;
}

export interface EsgScoreCardProps extends HTMLAttributes<HTMLDivElement> {
  /** ESG 3軸スコア */
  scores: EsgScores;
  /** タイトル */
  title?: string;
  /** 評価期間 */
  period?: string;
}

const AXES = [
  { key: 'environment' as const, label: '環境 (E)', color: 'bg-success', icon: Leaf },
  { key: 'social' as const, label: '社会 (S)', color: 'bg-secondary', icon: Users },
  { key: 'governance' as const, label: 'ガバナンス (G)', color: 'bg-primary', icon: Scale },
];

function clampScore(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, v));
}

function grade(avg: number): { label: string; cls: string } {
  if (avg >= 80) return { label: 'A', cls: 'bg-success text-white' };
  if (avg >= 60) return { label: 'B', cls: 'bg-secondary text-white' };
  if (avg >= 40) return { label: 'C', cls: 'bg-accent text-slate-900' };
  return { label: 'D', cls: 'bg-danger text-white' };
}

/**
 * ESG 3軸 (環境/社会/ガバナンス) のスコアカード。
 */
export const EsgScoreCard = forwardRef<HTMLDivElement, EsgScoreCardProps>(
  ({ scores, title = 'ESG スコア', period, className, ...rest }, ref) => {
    const e = clampScore(scores.environment);
    const s = clampScore(scores.social);
    const g = clampScore(scores.governance);
    const avg = (e + s + g) / 3;
    const gr = grade(avg);

    return (
      <section
        ref={ref}
        aria-label={`${title}${period ? ` (${period})` : ''}`}
        className={cn('cdx-card p-4 flex flex-col gap-3', className)}
        {...rest}
      >
        <header className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">{title}</h3>
            {period && <p className="text-xs text-slate-500">{period}</p>}
          </div>
          <span
            className={cn(
              'inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg',
              gr.cls,
            )}
            aria-label={`総合評価 ${gr.label} (${avg.toFixed(1)})`}
          >
            {gr.label}
          </span>
        </header>
        <ul className="space-y-2">
          {AXES.map((axis) => {
            const v = clampScore(scores[axis.key]);
            const Icon = axis.icon;
            return (
              <li key={axis.key}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="inline-flex items-center gap-1 text-slate-700">
                    <Icon size={12} aria-hidden="true" />
                    {axis.label}
                  </span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {v.toFixed(0)}
                  </span>
                </div>
                <div
                  className="h-2 bg-slate-100 rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuenow={Math.round(v)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={axis.label}
                >
                  <span
                    className={cn('block h-full rounded-full', axis.color)}
                    style={{ width: `${v}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    );
  },
);
EsgScoreCard.displayName = 'EsgScoreCard';
