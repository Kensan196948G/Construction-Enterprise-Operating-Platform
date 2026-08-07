import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../api/client';

type KpiRow = {
  id: number;
  kpi_type: string;
  department_code?: string | null;
  fiscal_year?: number | null;
  fiscal_month?: number | null;
  target_value?: number | null;
  actual_value: number;
  achievement_rate?: number | null;
  unit?: string | null;
};

export default function KpiAnalysisPage() {
  const [rows, setRows] = useState<KpiRow[]>([]);
  const [kpiType, setKpiType] = useState<string>('orders_amount');

  useEffect(() => {
    api
      .get<KpiRow[]>('/kpi', { params: { kpi_type: kpiType, limit: 24 } })
      .then((r) => setRows(r.data))
      .catch(() => setRows([]));
  }, [kpiType]);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">KPI ドリルダウン</h2>
      <div className="flex gap-2 items-center">
        <label className="text-sm">KPI 種別:</label>
        <select
          value={kpiType}
          onChange={(e) => setKpiType(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="orders_amount">受注高</option>
          <option value="profit_margin">利益率</option>
          <option value="cost_ratio">原価率</option>
          <option value="accident_count">事故件数</option>
          <option value="labor_status">労務状況</option>
        </select>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-4">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fiscal_month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="target_value" fill="#cbd5e1" name="目標" />
            <Bar dataKey="actual_value" fill="#1e3a8a" name="実績" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <table className="w-full text-sm bg-white rounded-lg shadow-sm">
        <thead className="bg-slate-100">
          <tr>
            <th className="text-left p-2">期</th>
            <th className="text-left p-2">部門</th>
            <th className="text-right p-2">目標</th>
            <th className="text-right p-2">実績</th>
            <th className="text-right p-2">達成率</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t">
              <td className="p-2">{r.fiscal_year}-{r.fiscal_month ?? '-'}</td>
              <td className="p-2">{r.department_code ?? '-'}</td>
              <td className="p-2 text-right">{r.target_value ?? '-'}</td>
              <td className="p-2 text-right">{r.actual_value}</td>
              <td className="p-2 text-right">
                {r.achievement_rate != null ? `${(Number(r.achievement_rate) * 100).toFixed(1)}%` : '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
