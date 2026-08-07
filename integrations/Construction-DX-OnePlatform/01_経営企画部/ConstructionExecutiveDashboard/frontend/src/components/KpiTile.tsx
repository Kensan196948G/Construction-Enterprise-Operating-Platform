import { ReactNode } from 'react';

type Props = {
  title: string;
  value: ReactNode;
  unit?: string;
  trend?: 'up' | 'down' | 'flat';
  status?: 'ok' | 'warn' | 'danger';
  hint?: string;
};

const STATUS_COLOR: Record<NonNullable<Props['status']>, string> = {
  ok: 'border-exec-ok bg-emerald-50',
  warn: 'border-exec-warn bg-amber-50',
  danger: 'border-exec-danger bg-rose-50',
};

const TREND_GLYPH: Record<NonNullable<Props['trend']>, string> = {
  up: '▲',
  down: '▼',
  flat: '・',
};

export default function KpiTile({ title, value, unit, trend, status = 'ok', hint }: Props) {
  return (
    <div className={`rounded-lg border-l-4 ${STATUS_COLOR[status]} p-4 shadow-sm`}>
      <div className="text-xs text-slate-500">{title}</div>
      <div className="text-2xl font-bold text-exec-primary">
        {value}
        {unit && <span className="ml-1 text-sm text-slate-500">{unit}</span>}
        {trend && <span className="ml-2 text-sm">{TREND_GLYPH[trend]}</span>}
      </div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}
