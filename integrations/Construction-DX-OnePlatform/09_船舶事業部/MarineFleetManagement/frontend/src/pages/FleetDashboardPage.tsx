import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { apiClient } from '@/api/client';

interface FleetSummary {
  vessels: { total: number; active: number };
  voyages: { total: number; in_transit: number; utilization_rate: number };
  fuel: { total_refuel_liters: number };
  construction_contribution: { vessel_used_days: number };
  safety: { accident_free_hours: number };
}

export default function FleetDashboardPage() {
  const [data, setData] = useState<FleetSummary | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<FleetSummary>('/dashboard/summary')
      .then((r) => setData(r.data))
      .catch((e) => setErr(e.message));
  }, []);

  return (
    <section>
      <h2 className="mb-4 text-xl font-bold">船隊ダッシュボード</h2>
      {err && <p className="text-sm text-red-600">{err}</p>}
      {data && (
        <div className="grid gap-4 md:grid-cols-4">
          <Kpi label="登録船舶数" value={data.vessels.total} />
          <Kpi label="稼働中船舶" value={data.vessels.active} />
          <Kpi
            label="航海稼働率"
            value={`${(data.voyages.utilization_rate * 100).toFixed(1)}%`}
          />
          <Kpi label="連続無事故" value={`${data.safety.accident_free_hours} h`} />
          <Kpi
            label="燃料補給累計"
            value={`${data.fuel.total_refuel_liters.toLocaleString()} L`}
          />
          <Kpi
            label="工事貢献日数"
            value={`${data.construction_contribution.vessel_used_days} 日`}
          />
          <div className="md:col-span-4 rounded border bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-bold">運航状況</h3>
            <div style={{ width: '100%', height: 200 }}>
              <ResponsiveContainer>
                <BarChart
                  data={[
                    { name: '計画', count: data.voyages.total },
                    { name: '航行中', count: data.voyages.in_transit },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0c4a6e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded border bg-white p-4 shadow-sm">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-marine-primary">{value}</div>
    </div>
  );
}
