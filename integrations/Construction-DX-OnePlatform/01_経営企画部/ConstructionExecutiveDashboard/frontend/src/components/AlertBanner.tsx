type Alert = {
  id: number;
  level: 'critical' | 'warning' | 'info' | string;
  title: string;
  message: string;
  triggered_at: string;
};

type Props = { alerts: Alert[] };

const LEVEL_STYLE: Record<string, string> = {
  critical: 'bg-rose-100 border-rose-500 text-rose-900',
  warning: 'bg-amber-100 border-amber-500 text-amber-900',
  info: 'bg-sky-100 border-sky-500 text-sky-900',
};

export default function AlertBanner({ alerts }: Props) {
  if (alerts.length === 0) {
    return (
      <div className="rounded border-l-4 border-exec-ok bg-emerald-50 p-3 text-sm">
        現在、未解決の経営アラートはありません。
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {alerts.map((a) => (
        <div
          key={a.id}
          className={`rounded border-l-4 p-3 text-sm ${LEVEL_STYLE[a.level] ?? LEVEL_STYLE.info}`}
        >
          <div className="font-semibold">
            [{a.level.toUpperCase()}] {a.title}
          </div>
          <div className="mt-1 text-xs">{a.message}</div>
          <div className="mt-1 text-[10px] text-slate-500">{a.triggered_at}</div>
        </div>
      ))}
    </div>
  );
}
