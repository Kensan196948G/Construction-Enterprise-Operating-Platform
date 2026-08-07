/**
 * オフライン/同期状態バナー.
 * 将来 @cdx/shared-ui の OfflineIndicator / SyncStatusBar に置き換える。
 */
import { useSyncStore } from '@/store/syncStore';
import { useOfflineSync } from '@/hooks/useOfflineSync';

export function OfflineSyncBanner() {
  useOfflineSync();
  const online = useSyncStore((s) => s.online);
  const pending = useSyncStore((s) => s.pendingCount);
  const last = useSyncStore((s) => s.lastSyncedAt);

  if (online && pending === 0) {
    return (
      <div className="bg-emerald-50 text-emerald-800 text-xs px-4 py-1 border-b border-emerald-200">
        オンライン (最終同期: {last ?? '—'})
      </div>
    );
  }
  return (
    <div className="bg-amber-50 text-amber-900 text-xs px-4 py-1 border-b border-amber-200 flex items-center gap-3">
      <span>{online ? 'オンライン' : 'オフライン'}</span>
      {pending > 0 && <span>未送信 {pending} 件</span>}
    </div>
  );
}
