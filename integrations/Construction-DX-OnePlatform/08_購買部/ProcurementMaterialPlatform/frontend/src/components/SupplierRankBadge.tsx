import clsx from 'clsx';

interface Props {
  rank: string | null | undefined;
  score?: number | null;
}

const RANK_COLOR: Record<string, string> = {
  S: 'bg-rank-S text-white',
  A: 'bg-rank-A text-white',
  B: 'bg-rank-B text-white',
  C: 'bg-rank-C text-white',
  D: 'bg-rank-D text-white',
};

export function SupplierRankBadge({ rank, score }: Props) {
  if (!rank) {
    return <span className="text-xs text-gray-500">未評価</span>;
  }
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold',
        RANK_COLOR[rank] ?? 'bg-gray-400 text-white',
      )}
    >
      {rank}
      {typeof score === 'number' && <span className="font-normal">({score.toFixed(1)})</span>}
    </span>
  );
}
