import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/api/client";

interface Summary {
  window_hours: number;
  by_action: Record<string, number>;
}

interface WazuhInfo {
  status: string;
  data: { agents_active?: number; alerts_24h?: number; level_high?: number };
}

export default function SiemDashboardPage() {
  const [fg, setFg] = useState<Summary | null>(null);
  const [wazuh, setWazuh] = useState<WazuhInfo | null>(null);
  const [grafana, setGrafana] = useState<{ base_url: string; dashboards: { key: string; url: string }[] } | null>(
    null
  );

  useEffect(() => {
    api.get("/logs/fortigate/summary", { params: { hours: 24 } }).then((r) => setFg(r.data)).catch(() => null);
    api.get("/dashboard/wazuh").then((r) => setWazuh(r.data)).catch(() => null);
    api.get("/dashboard/grafana").then((r) => setGrafana(r.data)).catch(() => null);
  }, []);

  const chart = fg ? Object.entries(fg.by_action).map(([k, v]) => ({ action: k, count: v })) : [];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">SIEM / SOC ダッシュボード</h2>

      <div className="grid grid-cols-3 gap-3">
        <Card title="Wazuh Active Agents" value={wazuh?.data.agents_active ?? "-"} />
        <Card title="24h Alerts" value={wazuh?.data.alerts_24h ?? "-"} />
        <Card title="High Severity" value={wazuh?.data.level_high ?? "-"} />
      </div>

      <div className="bg-white rounded shadow-sm p-3">
        <h3 className="font-semibold mb-2">FortiGate Action (24h)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chart}>
            <XAxis dataKey="action" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#1F6FEB" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded shadow-sm p-3">
        <h3 className="font-semibold mb-2">Grafana ダッシュボード</h3>
        <ul className="list-disc ml-6 text-sm">
          {grafana?.dashboards.map((d) => (
            <li key={d.key}>
              <a href={d.url} target="_blank" rel="noreferrer" className="text-brand underline">
                {d.key}
              </a>
            </li>
          ))}
        </ul>
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
