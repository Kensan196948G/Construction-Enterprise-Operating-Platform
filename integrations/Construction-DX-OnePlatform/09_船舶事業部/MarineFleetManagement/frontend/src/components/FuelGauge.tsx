import clsx from 'clsx';

interface Props {
  remainingLiters?: number | null;
  capacityLiters?: number | null;
  consumptionLph?: number | null;
}

export function FuelGauge({ remainingLiters, capacityLiters, consumptionLph }: Props) {
  const ratio =
    remainingLiters != null && capacityLiters && capacityLiters > 0
      ? Math.min(1, remainingLiters / capacityLiters)
      : null;
  const pct = ratio != null ? Math.round(ratio * 100) : null;
  const tone =
    pct == null
      ? 'bg-gray-300'
      : pct < 15
        ? 'bg-marine-danger'
        : pct < 30
          ? 'bg-marine-warn'
          : 'bg-marine-ok';

  return (
    <div className="rounded border bg-white p-3 shadow-sm">
      <div className="text-xs text-gray-500">燃料残量</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-bold">
          {remainingLiters != null ? remainingLiters.toLocaleString() : '--'} L
        </span>
        {pct != null && <span className="text-xs text-gray-500">({pct}%)</span>}
      </div>
      <div className="mt-2 h-2 w-full rounded bg-gray-200">
        <div
          className={clsx('h-2 rounded', tone)}
          style={{ width: `${pct ?? 0}%` }}
        />
      </div>
      {consumptionLph != null && (
        <div className="mt-2 text-xs text-gray-500">燃費 {consumptionLph.toFixed(2)} L/h</div>
      )}
    </div>
  );
}
