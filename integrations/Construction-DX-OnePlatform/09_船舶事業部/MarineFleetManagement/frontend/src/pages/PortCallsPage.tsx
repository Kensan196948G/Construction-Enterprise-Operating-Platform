import { useEffect, useState } from 'react';
import { apiClient } from '@/api/client';

interface PortCall {
  id: number;
  vessel_id: number;
  port_name: string;
  arrived_at: string;
  departed_at: string | null;
  purpose: string | null;
  cost_jpy: number | null;
}

export default function PortCallsPage() {
  const [rows, setRows] = useState<PortCall[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<PortCall[]>('/port-calls')
      .then((r) => setRows(r.data))
      .catch((e) => setErr(e.message));
  }, []);

  return (
    <section>
      <h2 className="mb-4 text-xl font-bold">寄港記録</h2>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <table className="min-w-full bg-white text-sm shadow-sm">
        <thead className="bg-marine-deck text-left">
          <tr>
            <th className="px-3 py-2">船舶 ID</th>
            <th className="px-3 py-2">港</th>
            <th className="px-3 py-2">入港</th>
            <th className="px-3 py-2">出港</th>
            <th className="px-3 py-2">目的</th>
            <th className="px-3 py-2 text-right">費用 (円)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((r) => (
            <tr key={r.id}>
              <td className="px-3 py-2">{r.vessel_id}</td>
              <td className="px-3 py-2 font-bold">{r.port_name}</td>
              <td className="px-3 py-2 text-xs">{r.arrived_at}</td>
              <td className="px-3 py-2 text-xs">{r.departed_at ?? '停泊中'}</td>
              <td className="px-3 py-2">{r.purpose ?? '—'}</td>
              <td className="px-3 py-2 text-right">
                {r.cost_jpy != null ? r.cost_jpy.toLocaleString() : '—'}
              </td>
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td colSpan={6} className="px-3 py-6 text-center text-gray-400">
                寄港記録がありません
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
