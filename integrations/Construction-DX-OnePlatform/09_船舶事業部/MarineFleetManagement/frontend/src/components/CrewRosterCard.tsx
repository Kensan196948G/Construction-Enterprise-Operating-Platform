import clsx from 'clsx';

interface CrewItem {
  id: number;
  full_name: string;
  rank: string;
  current_consecutive_days: number;
  sea_service_days_total: number;
}

interface Props {
  crew: CrewItem;
  maxConsecutive?: number;
}

export function CrewRosterCard({ crew, maxConsecutive = 30 }: Props) {
  const over = crew.current_consecutive_days >= maxConsecutive;
  const warn = crew.current_consecutive_days >= maxConsecutive - 3 && !over;
  return (
    <div className="rounded border bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="font-bold">{crew.full_name}</div>
        <span className="text-xs rounded bg-marine-deck px-2 py-0.5">{crew.rank}</span>
      </div>
      <div className="mt-2 text-xs text-gray-600 space-y-0.5">
        <div>
          連続乗船:{' '}
          <span
            className={clsx(
              'font-bold',
              over && 'text-marine-danger',
              warn && 'text-marine-warn',
            )}
          >
            {crew.current_consecutive_days}
          </span>
          <span className="text-gray-400"> / {maxConsecutive} 日</span>
        </div>
        <div>通算海上勤務: {crew.sea_service_days_total} 日</div>
        {over && (
          <div className="text-marine-danger font-bold">
            ⚠ 連続乗船上限超過 — 下船・休息が必要
          </div>
        )}
        {warn && (
          <div className="text-marine-warn">▲ 上限まで残り少 — 交代計画を確認</div>
        )}
      </div>
    </div>
  );
}
