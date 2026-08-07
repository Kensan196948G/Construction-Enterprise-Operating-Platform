import { useEffect, useState } from "react";
import { api } from "@/api/client";
import EtlStatusChip from "@/components/EtlStatusChip";
import LineageGraph from "@/components/LineageGraph";

interface EtlJob {
  job_id: string;
  name: string;
  output_table: string;
  schedule_cron: string | null;
  status: string;
  last_run_at: string | null;
  airflow_dag_id: string | null;
}
interface EtlRun {
  run_id: string;
  job_id: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  rows_in: number | null;
  rows_out: number | null;
  error_message: string | null;
}

// Skeleton: hardcoded representative lineage for the platform.
const LINEAGE_NODES = [
  { node_id: "source:04_construction.projects", kind: "source", label: "施工管理: 工事" },
  { node_id: "source:06_safety.records", kind: "source", label: "安全品質: ヒヤリハット" },
  { node_id: "table:stg_projects", kind: "table", label: "stg_projects" },
  { node_id: "table:fct_project_summary", kind: "table", label: "fct_project_summary" },
  { node_id: "dataset:exec_dashboard", kind: "dataset", label: "経営ダッシュボード" }
];
const LINEAGE_EDGES = [
  { src: "source:04_construction.projects", dst: "table:stg_projects" },
  { src: "table:stg_projects", dst: "table:fct_project_summary" },
  { src: "source:06_safety.records", dst: "table:fct_project_summary" },
  { src: "table:fct_project_summary", dst: "dataset:exec_dashboard" }
];

export default function EtlPipelinesPage() {
  const [jobs, setJobs] = useState<EtlJob[]>([]);
  const [runs, setRuns] = useState<EtlRun[]>([]);

  useEffect(() => {
    api.get<EtlJob[]>("/etl/jobs").then((r) => setJobs(r.data)).catch(() => setJobs([]));
    api.get<EtlRun[]>("/etl/runs", { params: { limit: 20 } }).then((r) => setRuns(r.data)).catch(() => setRuns([]));
  }, []);

  const trigger = async (id: string) => {
    await api.post(`/etl/jobs/${id}/run`).catch(() => null);
    const r = await api.get<EtlRun[]>("/etl/runs", { params: { limit: 20 } });
    setRuns(r.data);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">ETL パイプライン</h2>

      <section>
        <h3 className="font-semibold mb-2">ジョブ一覧</h3>
        <div className="bg-white rounded shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th className="p-2">名称</th>
                <th className="p-2">出力テーブル</th>
                <th className="p-2">cron</th>
                <th className="p-2">Airflow DAG</th>
                <th className="p-2">状態</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr><td colSpan={6} className="p-4 text-center text-slate-400">ジョブ未登録</td></tr>
              ) : (
                jobs.map((j) => (
                  <tr key={j.job_id} className="border-t border-slate-100">
                    <td className="p-2 font-medium">{j.name}</td>
                    <td className="p-2 font-mono text-xs">{j.output_table}</td>
                    <td className="p-2 font-mono text-xs">{j.schedule_cron ?? "-"}</td>
                    <td className="p-2 text-xs">{j.airflow_dag_id ?? "-"}</td>
                    <td className="p-2"><EtlStatusChip status={j.status} /></td>
                    <td className="p-2">
                      <button onClick={() => trigger(j.job_id)} className="text-xs px-2 py-1 rounded bg-brand text-white">
                        実行
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="font-semibold mb-2">実行履歴 (直近 20 件)</h3>
        <div className="bg-white rounded shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th className="p-2">開始</th>
                <th className="p-2">終了</th>
                <th className="p-2">状態</th>
                <th className="p-2">in / out</th>
                <th className="p-2">エラー</th>
              </tr>
            </thead>
            <tbody>
              {runs.length === 0 ? (
                <tr><td colSpan={5} className="p-4 text-center text-slate-400">実行履歴なし</td></tr>
              ) : (
                runs.map((r) => (
                  <tr key={r.run_id} className="border-t border-slate-100">
                    <td className="p-2 text-xs">{r.started_at}</td>
                    <td className="p-2 text-xs">{r.finished_at ?? "-"}</td>
                    <td className="p-2"><EtlStatusChip status={r.status} /></td>
                    <td className="p-2 text-xs">{r.rows_in ?? "-"} / {r.rows_out ?? "-"}</td>
                    <td className="p-2 text-xs text-rose-600">{r.error_message ?? ""}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 className="font-semibold mb-2">データ系統 (Lineage)</h3>
        <LineageGraph nodes={LINEAGE_NODES} edges={LINEAGE_EDGES} />
      </section>
    </div>
  );
}
