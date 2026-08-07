import { useState } from 'react';
import { db } from '@/db/dexie';
import { useOfflineStore } from '@/store/offlineStore';
import { apiClient } from '@/api/client';

export default function DailyReportPage() {
  const deviceId = useOfflineStore((s) => s.deviceId);
  const [projectId, setProjectId] = useState(1);
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));
  const [weather, setWeather] = useState('晴れ');
  const [safetyNotes, setSafetyNotes] = useState('');
  const [kyText, setKyText] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async () => {
    const payload = {
      project_id: projectId,
      report_date: reportDate,
      weather,
      safety_notes: safetyNotes,
      ky_records: kyText
        .split('\n')
        .filter(Boolean)
        .map((line) => ({ hazard: line })),
      client_id: deviceId,
    };
    try {
      await apiClient.post('/daily-reports', payload);
      setMsg('日報を提出しました');
    } catch {
      await db.dailyReports.add({
        projectId,
        reportDate,
        weather,
        safetyNotes,
        kyRecords: payload.ky_records,
        syncStatus: 'pending',
        updatedAt: new Date().toISOString(),
      });
      await db.syncQueue.add({
        entityType: 'daily_report',
        operation: 'create',
        entityLocalId: 0,
        payload,
        createdAt: new Date().toISOString(),
        attempts: 0,
      });
      setMsg('オフライン保存しました');
    }
  };

  return (
    <section>
      <h2 className="text-xl font-bold mb-4">作業日報 / KY活動</h2>
      <div className="bg-white border rounded p-4 max-w-2xl grid gap-3">
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
          日付
          <input
            type="date"
            className="block border rounded px-2 py-1 w-full"
            value={reportDate}
            onChange={(e) => setReportDate(e.target.value)}
          />
        </label>
        <label className="text-sm">
          天候
          <select
            className="block border rounded px-2 py-1 w-full"
            value={weather}
            onChange={(e) => setWeather(e.target.value)}
          >
            <option>晴れ</option>
            <option>曇り</option>
            <option>雨</option>
            <option>雪</option>
          </select>
        </label>
        <label className="text-sm">
          安全注意事項
          <textarea
            className="block border rounded px-2 py-1 w-full"
            value={safetyNotes}
            onChange={(e) => setSafetyNotes(e.target.value)}
          />
        </label>
        <label className="text-sm">
          KY活動 (1行1項目)
          <textarea
            rows={4}
            className="block border rounded px-2 py-1 w-full"
            value={kyText}
            onChange={(e) => setKyText(e.target.value)}
          />
        </label>
        <button onClick={submit} className="bg-site-primary text-white rounded px-4 py-2">
          提出
        </button>
        {msg && <p className="text-emerald-700 text-sm">{msg}</p>}
      </div>
    </section>
  );
}
