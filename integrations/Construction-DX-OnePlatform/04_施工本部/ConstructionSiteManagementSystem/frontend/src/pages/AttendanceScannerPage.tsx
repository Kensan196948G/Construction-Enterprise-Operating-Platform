import { useState } from 'react';
import { apiClient } from '@/api/client';

export default function AttendanceScannerPage() {
  const [projectId, setProjectId] = useState(1);
  const [workerId, setWorkerId] = useState(1);
  const [token, setToken] = useState<string | null>(null);
  const [workerName, setWorkerName] = useState('');
  const [direction, setDirection] = useState<'in' | 'out'>('in');
  const [msg, setMsg] = useState<string | null>(null);

  const issue = async () => {
    const r = await apiClient.post('/attendance/qr/issue', {
      project_id: projectId,
      worker_id: workerId,
    });
    setToken(r.data.token);
  };

  const checkin = async () => {
    if (!token) return;
    try {
      await apiClient.post('/attendance/qr/checkin', {
        token,
        worker_name: workerName,
        direction,
      });
      setMsg('打刻成功');
    } catch (e) {
      setMsg('打刻失敗: ' + (e as Error).message);
    }
  };

  return (
    <section>
      <h2 className="text-xl font-bold mb-4">入退場管理 (QR)</h2>
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
          作業員ID
          <input
            type="number"
            className="block border rounded px-2 py-1 w-full"
            value={workerId}
            onChange={(e) => setWorkerId(Number(e.target.value))}
          />
        </label>
        <button onClick={issue} className="bg-gray-200 rounded px-3 py-2 text-sm">
          QRトークン発行
        </button>
        {token && <p className="text-xs break-all font-mono bg-gray-100 p-2">{token}</p>}
        <label className="text-sm">
          作業員名
          <input
            className="block border rounded px-2 py-1 w-full"
            value={workerName}
            onChange={(e) => setWorkerName(e.target.value)}
          />
        </label>
        <label className="text-sm">
          方向
          <select
            className="block border rounded px-2 py-1 w-full"
            value={direction}
            onChange={(e) => setDirection(e.target.value as 'in' | 'out')}
          >
            <option value="in">入場</option>
            <option value="out">退場</option>
          </select>
        </label>
        <button onClick={checkin} className="bg-site-primary text-white rounded px-4 py-2">
          打刻
        </button>
        {msg && <p className="text-sm text-emerald-700">{msg}</p>}
      </div>
    </section>
  );
}
