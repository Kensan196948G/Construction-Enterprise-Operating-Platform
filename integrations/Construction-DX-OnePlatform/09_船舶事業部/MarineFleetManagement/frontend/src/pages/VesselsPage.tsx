import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '@/api/client';

interface Vessel {
  id: number;
  vessel_code: string;
  vessel_name: string;
  vessel_type: string;
  imo_number?: string | null;
  mmsi?: string | null;
  gross_tonnage?: number | null;
  status: string;
}

export default function VesselsPage() {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<Vessel[]>('/vessels')
      .then((r) => setVessels(r.data))
      .catch((e) => setErr(e.message));
  }, []);

  return (
    <section>
      <h2 className="mb-4 text-xl font-bold">船舶一覧</h2>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <table className="min-w-full divide-y divide-gray-200 bg-white text-sm shadow-sm">
        <thead className="bg-marine-deck">
          <tr>
            <th className="px-3 py-2 text-left">コード</th>
            <th className="px-3 py-2 text-left">船名</th>
            <th className="px-3 py-2 text-left">船種</th>
            <th className="px-3 py-2 text-left">IMO</th>
            <th className="px-3 py-2 text-left">MMSI</th>
            <th className="px-3 py-2 text-right">総トン</th>
            <th className="px-3 py-2 text-left">状態</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {vessels.map((v) => (
            <tr key={v.id}>
              <td className="px-3 py-2 font-mono text-xs">{v.vessel_code}</td>
              <td className="px-3 py-2">
                <Link to={`/vessels/${v.id}`} className="text-marine-accent hover:underline">
                  {v.vessel_name}
                </Link>
              </td>
              <td className="px-3 py-2">{v.vessel_type}</td>
              <td className="px-3 py-2">{v.imo_number ?? '—'}</td>
              <td className="px-3 py-2">{v.mmsi ?? '—'}</td>
              <td className="px-3 py-2 text-right">{v.gross_tonnage ?? '—'}</td>
              <td className="px-3 py-2">{v.status}</td>
            </tr>
          ))}
          {!vessels.length && (
            <tr>
              <td colSpan={7} className="px-3 py-6 text-center text-gray-400">
                船舶が登録されていません
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
