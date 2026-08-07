import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/dexie';
import { apiClient } from '@/api/client';
import { useOfflineStore } from '@/store/offlineStore';

interface ServerLog {
  id: number;
  entity_type: string;
  operation: string;
  status: string;
  server_timestamp: string | null;
}

export default function SyncStatusPage() {
  const deviceId = useOfflineStore((s) => s.deviceId);
  const queue = useLiveQuery(() => db.syncQueue.toArray(), []);
  const [server, setServer] = useState<ServerLog[]>([]);

  useEffect(() => {
    apiClient
      .get<{ recent: ServerLog[] }>('/sync/status', { params: { device_id: deviceId } })
      .then((r) => setServer(r.data.recent ?? []))
      .catch(() => setServer([]));
  }, [deviceId]);

  return (
    <section className="grid gap-6">
      <h2 className="text-xl font-bold">同期ステータス</h2>
      <div>
        <h3 className="font-semibold mb-2">デバイス: {deviceId}</h3>
      </div>
      <div>
        <h3 className="font-semibold mb-2">ローカル送信キュー ({queue?.length ?? 0})</h3>
        <ul className="bg-white border rounded divide-y text-sm">
          {(queue ?? []).map((q) => (
            <li key={q.id} className="p-2 flex justify-between">
              <span>
                {q.entityType} / {q.operation}
              </span>
              <span className="text-gray-500">{q.createdAt}</span>
            </li>
          ))}
          {queue && queue.length === 0 && <li className="p-2 text-gray-500">空</li>}
        </ul>
      </div>
      <div>
        <h3 className="font-semibold mb-2">サーバー側 同期ログ (直近)</h3>
        <ul className="bg-white border rounded divide-y text-sm">
          {server.map((s) => (
            <li key={s.id} className="p-2 flex justify-between">
              <span>
                {s.entity_type} / {s.operation}
              </span>
              <span
                className={
                  s.status === 'synced'
                    ? 'text-emerald-700'
                    : s.status === 'conflict'
                      ? 'text-amber-700'
                      : 'text-red-700'
                }
              >
                {s.status}
              </span>
            </li>
          ))}
          {server.length === 0 && <li className="p-2 text-gray-500">ログなし</li>}
        </ul>
      </div>
    </section>
  );
}
