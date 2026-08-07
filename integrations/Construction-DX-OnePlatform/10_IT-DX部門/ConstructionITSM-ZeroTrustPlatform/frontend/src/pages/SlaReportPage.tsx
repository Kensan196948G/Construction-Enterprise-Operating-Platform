import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { api } from "@/api/client";

interface SlaReportData {
  total: number;
  breached: number;
  breach_rate: number;
  by_priority: Record<string, { total: number; breached: number }>;
}

const COLORS = ["#10B981", "#EF4444"];

export default function SlaReportPage() {
  const [data, setData] = useState<SlaReportData | null>(null);

  useEffect(() => {
    api.get<SlaReportData>("/tickets/sla-report").then((r) => setData(r.data)).catch(() => null);
  }, []);

  if (!data) return <div>Loading...</div>;

  const pie = [
    { name: "OK", value: data.total - data.breached },
    { name: "違反", value: data.breached }
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">SLA レポート</h2>

      <div className="grid grid-cols-3 gap-3">
        <Card title="チケット総数" value={data.total} />
        <Card title="SLA 違反数" value={data.breached} />
        <Card title="違反率" value={`${(data.breach_rate * 100).toFixed(1)}%`} />
      </div>

      <div className="bg-white rounded shadow-sm p-3">
        <h3 className="font-semibold mb-2">違反 / OK 比率</h3>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={pie} dataKey="value" nameKey="name" outerRadius={80} label>
              {pie.map((_, i) => (
                <Cell key={i} fill={COLORS[i]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded shadow-sm p-3">
        <h3 className="font-semibold mb-2">優先度別</h3>
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="text-left p-2">優先度</th>
              <th className="text-left p-2">総数</th>
              <th className="text-left p-2">違反</th>
              <th className="text-left p-2">違反率</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(data.by_priority).map(([prio, s]) => (
              <tr key={prio} className="border-t">
                <td className="p-2">{prio}</td>
                <td className="p-2">{s.total}</td>
                <td className="p-2">{s.breached}</td>
                <td className="p-2">{s.total ? `${((s.breached / s.total) * 100).toFixed(1)}%` : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="bg-white rounded shadow-sm p-4">
      <div className="text-xs text-slate-500">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
