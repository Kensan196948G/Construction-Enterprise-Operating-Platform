/**
 * Background Sync 連携フック.
 * - online/offline イベント監視
 * - 同期キューを集計
 * - online 復帰時に push を試みる
 */
import { useEffect } from 'react';
import { db } from '@/db/dexie';
import { useSyncStore } from '@/store/syncStore';
import { useOfflineStore } from '@/store/offlineStore';
import { apiClient } from '@/api/client';

export function useOfflineSync() {
  const setOnline = useSyncStore((s) => s.setOnline);
  const setPending = useSyncStore((s) => s.setPending);
  const setLastSynced = useSyncStore((s) => s.setLastSynced);
  const deviceId = useOfflineStore((s) => s.deviceId);

  useEffect(() => {
    const update = async () => {
      const n = await db.syncQueue.count();
      setPending(n);
    };
    void update();

    const onOnline = () => {
      setOnline(true);
      void flush();
    };
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    async function flush() {
      const items = await db.syncQueue.toArray();
      if (items.length === 0) return;
      try {
        await apiClient.post('/sync/push', {
          device_id: deviceId,
          sync_batch: items.map((i) => ({
            entity_type: i.entityType,
            operation: i.operation,
            data: i.payload,
            client_timestamp: i.createdAt,
            client_version: 1,
          })),
        });
        await db.syncQueue.clear();
        setLastSynced(new Date().toISOString());
        await update();
      } catch (e) {
        console.warn('[sync] push failed; will retry via Background Sync', e);
      }
    }

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [setOnline, setPending, setLastSynced, deviceId]);
}
