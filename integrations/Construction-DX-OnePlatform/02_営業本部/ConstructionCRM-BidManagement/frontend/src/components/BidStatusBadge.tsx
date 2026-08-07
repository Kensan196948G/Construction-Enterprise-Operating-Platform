/**
 * 入札結果バッジ.
 */
import type { ReactElement } from 'react';

export type BidStatus = 'won' | 'lost' | 'cancel' | 'pending';

const LABEL: Record<BidStatus, string> = {
  won: '落札',
  lost: '失注',
  cancel: '中止',
  pending: '結果待ち',
};

const STYLE: Record<BidStatus, string> = {
  won: 'bg-emerald-600 text-white',
  lost: 'bg-rose-600 text-white',
  cancel: 'bg-gray-500 text-white',
  pending: 'bg-amber-500 text-white',
};

interface Props {
  status: BidStatus;
}

export function BidStatusBadge({ status }: Props): ReactElement {
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${STYLE[status]}`}>
      {LABEL[status]}
    </span>
  );
}
