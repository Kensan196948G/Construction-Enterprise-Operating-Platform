import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { apiClient } from '@/api/client';

interface Summary {
  pipeline_count: number;
  pipeline_gross_amount: number;
  won_count: number;
  won_amount: number;
  lost_count: number;
  contract_count: number;
  contract_amount: number;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<Summary>('/dashboard/summary')
      .then((r) => setSummary(r.data))
      .catch((e) => setError(String(e)));
  }, []);

  const chartData = summary
    ? [
        { name: '受注見込', 件数: summary.pipeline_count, 金額: summary.pipeline_gross_amount },
        { name: '受注実績', 件数: summary.won_count, 金額: summary.won_amount },
        { name: '失注', 件数: summary.lost_count, 金額: 0 },
        { name: '契約', 件数: summary.contract_count, 金額: summary.contract_amount },
      ]
    : [];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">ダッシュボード</h2>
      {error && <p className="text-rose-600">サマリ取得失敗: {error}</p>}
      <div className="grid gap-3 md:grid-cols-4">
        <Card label="受注見込件数" value={summary?.pipeline_count ?? '—'} />
        <Card
          label="受注見込金額"
          value={summary ? `${summary.pipeline_gross_amount.toLocaleString()}円` : '—'}
        />
        <Card label="受注実績件数" value={summary?.won_count ?? '—'} />
        <Card label="失注件数" value={summary?.lost_count ?? '—'} />
      </div>
      <div className="rounded border bg-white p-4">
        <h3 className="mb-2 font-semibold">受注見込 / 実績 / 失注</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="件数" fill="#0f766e" />
            <Bar dataKey="金額" fill="#f59e0b" />
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
