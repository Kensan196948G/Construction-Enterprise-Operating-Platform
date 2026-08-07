import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { apiClient } from '@/api/client';

interface CategoryStat {
  category: string;
  count: number;
  amount: number;
}

interface Summary {
  proposing_count: number;
  won_count: number;
  lost_count: number;
  in_negotiation_count: number;
  total_amount_won: number;
  win_rate: number;
  by_category: CategoryStat[];
}

export default function DashboardPage() {
  const [data, setData] = useState<Summary | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<Summary>('/dashboard/summary')
      .then((r) => setData(r.data))
      .catch((e) => setErr(String(e)));
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">提案ダッシュボード</h2>
      {err && <p className="text-rose-600">サマリ取得失敗: {err}</p>}
      <div className="grid gap-3 md:grid-cols-4">
        <Card label="提案中" value={data?.proposing_count ?? '—'} />
        <Card label="交渉中" value={data?.in_negotiation_count ?? '—'} />
        <Card label="受注(won)" value={data?.won_count ?? '—'} />
        <Card label="採択率" value={data ? `${(data.win_rate * 100).toFixed(1)}%` : '—'} />
      </div>
      <div className="rounded border bg-white p-4">
        <h3 className="mb-2 font-semibold">カテゴリ別収益</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data?.by_category ?? []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" name="件数" fill="#1e3a8a" />
            <Bar dataKey="amount" name="金額" fill="#0ea5e9" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded border bg-white p-4 shadow-sm">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
