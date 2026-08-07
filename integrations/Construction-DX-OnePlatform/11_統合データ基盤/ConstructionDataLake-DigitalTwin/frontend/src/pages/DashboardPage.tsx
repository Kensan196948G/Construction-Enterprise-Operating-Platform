import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "@/api/client";

interface Summary {
  sources: { total: number; active: number };
  etl: { jobs: number; runs_24h: number };
  lake: { tables: number };
  ai: { models: number };
  iot: { devices: number };
  twin: { objects: number };
}
interface PipelineStatus {
  recent_runs: number;
  by_status: Record<string, number>;
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [pipeline, setPipeline] = useState<PipelineStatus | null>(null);

  useEffect(() => {
    api.get("/dashboard/summary").then((r) => setSummary(r.data)).catch(() => null);
    api.get("/dashboard/pipeline-status").then((r) => setPipeline(r.data)).catch(() => null);
  }, []);

  const chart = pipeline
    ? Object.entries(pipeline.by_status).map(([k, v]) => ({ status: k, count: v }))
    : [];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">統合データ基盤ダッシュボード</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card title="データソース (アクティブ)" value={`${summary?.sources.active ?? 0} / ${summary?.sources.total ?? 0}`} />
        <Card title="ETLジョブ" value={summary?.etl.jobs ?? 0} />
        <Card title="24h ETL 実行" value={summary?.etl.runs_24h ?? 0} />
        <Card title="DataLake テーブル" value={summary?.lake.tables ?? 0} />
        <Card title="AI モデル" value={summary?.ai.models ?? 0} />
        <Card title="IoT デバイス" value={summary?.iot.devices ?? 0} />
      </div>

      <div className="bg-white rounded shadow-sm p-3">
        <h3 className="font-semibold mb-2">最近のパイプライン状態 (直近 20 件)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chart}>
            <XAxis dataKey="status" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#0EA5E9" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded shadow-sm p-3">
        <h3 className="font-semibold mb-2">デジタルツインオブジェクト</h3>
        <div className="text-3xl font-bold text-brand">{summary?.twin.objects ?? 0}</div>
        <p className="text-xs text-slate-500">建物 / 構造物 / 重機 / 船舶 の合計</p>
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="bg-white rounded shadow-sm p-3">
      <div className="text-xs text-slate-500">{title}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
