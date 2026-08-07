import { useEffect, useState } from 'react';
import { apiClient } from '@/api/client';

interface Voyage {
  id: number;
  voyage_no: string;
  vessel_id: number;
  project_code?: string | null;
  departure_port: string;
  arrival_port: string;
  planned_departure_at: string;
  planned_arrival_at: string;
  actual_departure_at?: string | null;
  actual_arrival_at?: string | null;
  status: string;
  purpose?: string | null;
}

const STATUS_TONE: Record<string, string> = {
  planned: 'bg-gray-200',
  departed: 'bg-marine-wave text-white',
  in_transit: 'bg-marine-accent text-white',
  arrived: 'bg-marine-ok text-white',
  canceled: 'bg-marine-danger text-white',
};

export default function VoyagesPage() {
  const [voyages, setVoyages] = useState<Voyage[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<Voyage[]>('/voyages')
      .then((r) => setVoyages(r.data))
      .catch((e) => setErr(e.message));
  }, []);

  return (
    <section>
      <h2 className="mb-4 text-xl font-bold">運航計画</h2>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <div className="space-y-2">
        {voyages.map((v) => (
          <div key={v.id} className="rounded border bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="font-mono text-xs text-gray-500">{v.voyage_no}</div>
              <span
                className={`rounded px-2 py-0.5 text-xs font-bold ${
                  STATUS_TONE[v.status] ?? 'bg-gray-200'
                }`}
              >
                {v.status}
              </span>
            </div>
            <div className="mt-1 text-sm">
              <span className="font-bold">{v.departure_port}</span>
              <span className="mx-2 text-marine-accent">→</span>
              <span className="font-bold">{v.arrival_port}</span>
              {v.project_code && (
                <span className="ml-3 text-xs text-gray-500">工事案件: {v.project_code}</span>
              )}
            </div>
            <div className="mt-1 text-xs text-gray-600">
              計画: {v.planned_departure_at} → {v.planned_arrival_at}
            </div>
            {v.actual_departure_at && (
              <div className="text-xs text-gray-600">
                実績: {v.actual_departure_at} → {v.actual_arrival_at ?? '航行中'}
              </div>
            )}
          </div>
        ))}
        {!voyages.length && (
          <p className="text-sm text-gray-400">運航計画が登録されていません</p>
        )}
      </div>
    </section>
  );
}
