import { useState } from 'react';
import { db } from '@/db/dexie';
import { useOfflineStore } from '@/store/offlineStore';
import { apiClient } from '@/api/client';

export default function ProgressEntryPage() {
  const deviceId = useOfflineStore((s) => s.deviceId);
  const [projectId, setProjectId] = useState(1);
  const [recordDate, setRecordDate] = useState(new Date().toISOString().slice(0, 10));
  const [progressRate, setProgressRate] = useState(0);
  const [remarks, setRemarks] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  const save = async () => {
    const payload = {
      record_date: recordDate,
      progress_rate: progressRate,
      remarks,
      client_id: deviceId,
    };
    try {
      await apiClient.post(`/projects/${projectId}/progress`, payload);
      setMsg('保存しました (サーバー)');
    } catch {
      await db.syncQueue.add({
        entityType: 'progress',
        operation: 'create',
        entityLocalId: 0,
        payload: { project_id: projectId, ...payload },
        createdAt: new Date().toISOString(),
        attempts: 0,
      });
      setMsg('オフライン: 同期キューに追加しました');
    }
  };

  return (
    <section>
      <h2 className="text-xl font-bold mb-4">出来高入力</h2>
      <div className="bg-white border rounded p-4 max-w-md grid gap-3">
        <label className="text-sm">
          プロジェクトID
          <input
            type="number"
            className="block border rounded px-2 py-1 w-full"
            value={projectId}
            onChange={(e) => setProjectId(Number(e.target.value))}
          />
        </label>
        <label className="text-sm">
          記録日
          <input
            type="date"
            className="block border rounded px-2 py-1 w-full"
            value={recordDate}
            onChange={(e) => setRecordDate(e.target.value)}
          />
        </label>
        <label className="text-sm">
          進捗率 (%)
          <input
            type="number"
            className="block border rounded px-2 py-1 w-full"
            value={progressRate}
            onChange={(e) => setProgressRate(Number(e.target.value))}
          />
        </label>
        <label className="text-sm">
          備考
          <textarea
            className="block border rounded px-2 py-1 w-full"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </label>
        <button onClick={save} className="bg-site-primary text-white rounded px-4 py-2">
          保存
        </button>
        {msg && <p className="text-sm text-emerald-700">{msg}</p>}
      </div>
    </section>
  );
}
