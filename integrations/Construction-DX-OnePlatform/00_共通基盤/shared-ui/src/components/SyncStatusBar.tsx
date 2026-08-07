import { forwardRef, type HTMLAttributes } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { cn } from '../utils/cn';

export type SyncState = 'idle' | 'syncing' | 'error' | 'success';

export interface SyncStatusBarProps extends HTMLAttributes<HTMLDivElement> {
  /** 未同期件数 */
  pendingCount: number;
  /** 最終同期時刻 */
  lastSyncedAt?: Date | null;
  /** 同期状態 */
  state?: SyncState;
  /** 手動同期ボタンのハンドラ */
  onSync?: () => void | Promise<void>;
  /** エラーメッセージ (state === 'error' のとき表示) */
  errorMessage?: string;
  /** 同期中ボタンを無効化 */
  disabled?: boolean;
}

const formatRelative = (date: Date): string => {
  const diff = Date.now() - date.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec} 秒前`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} 分前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} 時間前`;
  const day = Math.floor(hr / 24);
  return `${day} 日前`;
};

/**
 * オフラインファースト用の同期ステータスバー。
 * pending 件数 / 最終同期時刻 / 手動同期ボタンを表示。
 */
export const SyncStatusBar = forwardRef<HTMLDivElement, SyncStatusBarProps>(
  (
    {
      pendingCount,
      lastSyncedAt,
      state = 'idle',
      onSync,
      errorMessage,
      disabled = false,
      className,
      ...rest
    },
    ref,
  ) => {
    const hasPending = pendingCount > 0;
    const isSyncing = state === 'syncing';

    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-cdx border text-sm',
          state === 'error'
            ? 'bg-danger-50 border-danger-100 text-danger-700'
            : hasPending
              ? 'bg-accent-50 border-accent-200 text-accent-800'
              : 'bg-success-50 border-success-100 text-success-700',
          className,
        )}
        {...rest}
      >
        <span className="inline-flex items-center gap-1.5 font-medium">
          {state === 'error' ? (
            <AlertCircle size={16} aria-hidden="true" />
          ) : hasPending ? (
            <Clock size={16} aria-hidden="true" />
          ) : (
            <CheckCircle2 size={16} aria-hidden="true" />
          )}
          {state === 'error'
            ? `同期エラー${errorMessage ? `: ${errorMessage}` : ''}`
            : hasPending
              ? `未同期 ${pendingCount} 件`
              : '同期済み'}
        </span>

        <span className="text-xs text-slate-500 ml-auto">
          {lastSyncedAt
            ? `最終同期: ${formatRelative(lastSyncedAt)}`
            : '最終同期: なし'}
        </span>

        {onSync && (
          <button
            type="button"
            onClick={() => void onSync()}
            disabled={disabled || isSyncing}
            aria-label="手動で同期"
            className={cn(
              'inline-flex items-center gap-1 px-2 py-1 rounded border text-xs',
              'bg-white border-slate-300 hover:bg-slate-50',
              'disabled:opacity-50 disabled:cursor-not-allowed',
            )}
          >
            <RefreshCw
              size={14}
              className={cn(isSyncing && 'animate-spin')}
              aria-hidden="true"
            />
            {isSyncing ? '同期中...' : '今すぐ同期'}
          </button>
        )}
      </div>
    );
  },
);
SyncStatusBar.displayName = 'SyncStatusBar';
