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

interface Summary {
  orders: { count: number; total_amount: number };
  suppliers: { rank_distribution: Record<string, number> };
  inventory_alerts: { ok: number; warning: number; danger: number };
}

export default function DashboardPage() {
  const [data, setData] = useState<Summary | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<Summary>('/dashboard/summary')
      .then((r) => setData(r.data))
      .catch((e) => setErr(e.message));
  }, []);

  return (
    <section>
      <h2 className="mb-4 text-xl font-bold">購買ダッシュボード</h2>
      {err && <p className="text-sm text-red-600">{err}</p>}
      {data && (
        <div className="grid gap-4 md:grid-cols-3">
          <Kpi label="発注件数" value={data.orders.count} />
          <Kpi label="発注総額" value={`¥${data.orders.total_amount.toLocaleString()}`} />
          <Kpi
            label="在庫アラート (Warning/Danger)"
            value={`${data.inventory_alerts.warning} / ${data.inventory_alerts.danger}`}
            tone={data.inventory_alerts.danger > 0 ? 'danger' : 'normal'}
          />
          <div className="md:col-span-3 rounded border bg-white p-4 shadow-sm">
            <h3 className="mb-2 text-sm font-bold">協力会社評価分布</h3>
            <div style={{ width: '100%', height: 200 }}>
              <ResponsiveContainer>
                <BarChart
                  data={Object.entries(data.suppliers.rank_distribution).map(([k, v]) => ({
                    rank: k,
                    count: v,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rank" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0f766e" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Kpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: 'normal' | 'danger';
}) {
  return (
    <div className="rounded border bg-white p-4 shadow-sm">
      <div className="text-xs text-gray-500">{label}</div>
      <div
        className={
          tone === 'danger' ? 'mt-1 text-2xl font-bold text-proc-danger' : 'mt-1 text-2xl font-bold'
        }
      >
        {value}
      </div>
    </div>
  );
}
