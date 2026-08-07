/**
 * 与信ランクバッジ (A/B/C/D/未評価).
 */
import type { ReactElement } from 'react';

export type CreditRank = 'A' | 'B' | 'C' | 'D' | '未評価';

const RANK_STYLE: Record<CreditRank, string> = {
  A: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  B: 'bg-sky-100 text-sky-800 border-sky-300',
  C: 'bg-amber-100 text-amber-800 border-amber-300',
  D: 'bg-rose-100 text-rose-800 border-rose-300',
  未評価: 'bg-gray-100 text-gray-700 border-gray-300',
};

interface Props {
  rank: CreditRank;
}

export function CreditRankBadge({ rank }: Props): ReactElement {
  const cls = RANK_STYLE[rank] ?? RANK_STYLE['未評価'];
  return (
    <span className={`inline-block rounded border px-2 py-0.5 text-xs font-semibold ${cls}`}>
      与信 {rank}
    </span>
  );
}
