import clsx from 'clsx';

interface Props {
  current: number;
  reorderPoint: number;
  level?: 'OK' | 'WARNING' | 'DANGER';
}

export function StockLevelBar({ current, reorderPoint, level }: Props) {
  const max = Math.max(current, reorderPoint, 1) * 1.2;
  const pct = Math.min(100, (current / max) * 100);
  const reorderPct = Math.min(100, (reorderPoint / max) * 100);

  const barColor =
    level === 'DANGER'
      ? 'bg-proc-danger'
      : level === 'WARNING'
        ? 'bg-proc-warn'
        : 'bg-proc-ok';

  return (
    <div className="w-full">
      <div className="relative h-3 w-full overflow-hidden rounded bg-gray-200">
        <div className={clsx('h-full transition-all', barColor)} style={{ width: `${pct}%` }} />
        <div
          className="absolute top-0 h-full border-l-2 border-dashed border-gray-700"
          style={{ left: `${reorderPct}%` }}
          title={`発注点: ${reorderPoint}`}
        />
      </div>
      <div className="mt-1 flex justify-between text-xs text-gray-600">
        <span>現在 {current}</span>
        <span>発注点 {reorderPoint}</span>
      </div>
    </div>
  );
}
