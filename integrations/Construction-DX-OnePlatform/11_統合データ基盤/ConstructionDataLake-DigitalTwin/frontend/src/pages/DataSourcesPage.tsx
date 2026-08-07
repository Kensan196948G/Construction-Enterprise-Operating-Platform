import { useEffect, useState } from "react";
import { api } from "@/api/client";

interface DataSource {
  source_id: string;
  department_id: string;
  system_name: string;
  source_type: string;
  schedule_cron: string | null;
  description: string | null;
  is_active: boolean;
  last_ingested_at: string | null;
}

export default function DataSourcesPage() {
  const [items, setItems] = useState<DataSource[]>([]);

  useEffect(() => {
    api.get<DataSource[]>("/sources").then((r) => setItems(r.data)).catch(() => setItems([]));
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">データソース</h2>
      <p className="text-sm text-slate-600">部門 (01-10) のシステムからのデータ取得元定義一覧</p>

      <div className="bg-white rounded shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left">
            <tr>
              <th className="p-2">部門</th>
              <th className="p-2">システム名</th>
              <th className="p-2">タイプ</th>
              <th className="p-2">スケジュール</th>
              <th className="p-2">最終取得</th>
              <th className="p-2">状態</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-center text-slate-400">データソース未登録</td></tr>
            ) : (
              items.map((s) => (
                <tr key={s.source_id} className="border-t border-slate-100">
                  <td className="p-2">{s.department_id}</td>
                  <td className="p-2 font-medium">{s.system_name}</td>
                  <td className="p-2"><span className="text-xs px-2 py-0.5 rounded bg-slate-100">{s.source_type}</span></td>
                  <td className="p-2 font-mono text-xs">{s.schedule_cron ?? "-"}</td>
                  <td className="p-2 text-xs">{s.last_ingested_at ?? "未実行"}</td>
                  <td className="p-2">
                    <span className={`text-xs ${s.is_active ? "text-emerald-600" : "text-slate-400"}`}>
                      {s.is_active ? "有効" : "無効"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
