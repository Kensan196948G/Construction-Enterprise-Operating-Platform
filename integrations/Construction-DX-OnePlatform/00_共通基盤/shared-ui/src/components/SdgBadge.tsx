import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../utils/cn';

/** SDGs 1-17 */
export type SdgGoal =
  | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
  | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17;

export interface SdgBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** SDGs ゴール番号 (1-17) */
  goal: SdgGoal;
  /** タイトルを併記 */
  showTitle?: boolean;
  /** サイズ */
  size?: 'sm' | 'md' | 'lg';
}

/** 公式 SDGs カラー (国連推奨) */
const SDG_META: Record<SdgGoal, { color: string; title: string }> = {
  1: { color: '#E5243B', title: '貧困をなくそう' },
  2: { color: '#DDA63A', title: '飢餓をゼロに' },
  3: { color: '#4C9F38', title: 'すべての人に健康と福祉を' },
  4: { color: '#C5192D', title: '質の高い教育をみんなに' },
  5: { color: '#FF3A21', title: 'ジェンダー平等を実現しよう' },
  6: { color: '#26BDE2', title: '安全な水とトイレを世界中に' },
  7: { color: '#FCC30B', title: 'エネルギーをみんなに そしてクリーンに' },
  8: { color: '#A21942', title: '働きがいも経済成長も' },
  9: { color: '#FD6925', title: '産業と技術革新の基盤をつくろう' },
  10: { color: '#DD1367', title: '人や国の不平等をなくそう' },
  11: { color: '#FD9D24', title: '住み続けられるまちづくりを' },
  12: { color: '#BF8B2E', title: 'つくる責任 つかう責任' },
  13: { color: '#3F7E44', title: '気候変動に具体的な対策を' },
  14: { color: '#0A97D9', title: '海の豊かさを守ろう' },
  15: { color: '#56C02B', title: '陸の豊かさも守ろう' },
  16: { color: '#00689D', title: '平和と公正をすべての人に' },
  17: { color: '#19486A', title: 'パートナーシップで目標を達成しよう' },
};

const SIZE_STYLE: Record<NonNullable<SdgBadgeProps['size']>, string> = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
};

/**
 * SDGs 17 ゴール バッジ。
 */
export const SdgBadge = forwardRef<HTMLSpanElement, SdgBadgeProps>(
  ({ goal, showTitle = false, size = 'md', className, ...rest }, ref) => {
    const meta = SDG_META[goal];
    return (
      <span
        ref={ref}
        role="img"
        aria-label={`SDGs ${goal}: ${meta.title}`}
        className={cn('inline-flex items-center gap-1.5 font-medium', className)}
        {...rest}
      >
        <span
          className={cn(
            'inline-flex items-center justify-center rounded-sm text-white font-bold',
            SIZE_STYLE[size],
          )}
          style={{ backgroundColor: meta.color }}
          aria-hidden="true"
        >
          {goal}
        </span>
        {showTitle && <span className="text-sm text-slate-700">{meta.title}</span>}
      </span>
    );
  },
);
SdgBadge.displayName = 'SdgBadge';
