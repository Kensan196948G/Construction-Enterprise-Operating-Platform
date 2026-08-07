import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { Circle, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '../utils/cn';

export type TimelineSeverity = 'info' | 'success' | 'warning' | 'danger';

export interface TimelineLogEntry {
  /** 一意ID */
  id: string;
  /** 時刻 */
  timestamp: Date | string;
  /** 主題 */
  title: string;
  /** 詳細 (省略可) */
  description?: string;
  /** 実行者 (省略可) */
  actor?: string;
  /** 重要度 */
  severity?: TimelineSeverity;
  /** カスタムアイコン */
  icon?: ReactNode;
}

export interface TimelineLogProps extends HTMLAttributes<HTMLOListElement> {
  /** ログエントリ (新しい順を想定) */
  entries: TimelineLogEntry[];
  /** タイムスタンプ表示フォーマッタ */
  formatTimestamp?: (d: Date) => string;
  /** 空表示 */
  emptyLabel?: string;
}

const SEVERITY_STYLE: Record<TimelineSeverity, { dot: string; icon: typeof Circle }> = {
  info: { dot: 'bg-secondary text-white', icon: Info },
  success: { dot: 'bg-success text-white', icon: CheckCircle2 },
  warning: { dot: 'bg-accent text-slate-900', icon: AlertCircle },
  danger: { dot: 'bg-danger text-white', icon: AlertCircle },
};

const defaultFormat = (d: Date): string =>
  d.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

/**
 * 時系列ログ (アクティビティ / 監査 / 履歴) を縦並びで表示。
 */
export const TimelineLog = forwardRef<HTMLOListElement, TimelineLogProps>(
  ({ entries, formatTimestamp = defaultFormat, emptyLabel = 'ログはありません', className, ...rest }, ref) => {
    if (entries.length === 0) {
      return (
        <p className="text-sm text-slate-500 text-center py-4" role="status">
          {emptyLabel}
        </p>
      );
    }

    return (
      <ol
        ref={ref}
        aria-label="活動ログ"
        className={cn('relative space-y-4 pl-6', className)}
        {...rest}
      >
        <span
          aria-hidden="true"
          className="absolute left-2 top-1.5 bottom-1.5 w-px bg-slate-200"
        />
        {entries.map((e) => {
          const sev = e.severity ?? 'info';
          const { dot, icon: DefaultIcon } = SEVERITY_STYLE[sev];
          const ts = typeof e.timestamp === 'string' ? new Date(e.timestamp) : e.timestamp;
          const tsValid = !Number.isNaN(ts.getTime());
          return (
            <li key={e.id} className="relative">
              <span
                aria-hidden="true"
                className={cn(
                  'absolute -left-6 top-0.5 w-4 h-4 rounded-full flex items-center justify-center',
                  dot,
                )}
              >
                {e.icon ?? <DefaultIcon size={10} />}
              </span>
              <div className="flex flex-col gap-0.5">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-slate-800">{e.title}</span>
                  {e.actor && (
                    <span className="text-xs text-slate-500">by {e.actor}</span>
                  )}
                </div>
                {e.description && (
                  <p className="text-xs text-slate-600">{e.description}</p>
                )}
                {tsValid && (
                  <time
                    dateTime={ts.toISOString()}
                    className="text-xs text-slate-400 tabular-nums"
                  >
                    {formatTimestamp(ts)}
                  </time>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    );
  },
);
TimelineLog.displayName = 'TimelineLog';
