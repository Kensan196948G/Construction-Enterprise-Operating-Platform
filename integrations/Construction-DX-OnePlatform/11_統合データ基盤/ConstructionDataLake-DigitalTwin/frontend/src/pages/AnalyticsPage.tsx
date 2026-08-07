import { useState } from "react";
import { api } from "@/api/client";

export default function AnalyticsPage() {
  const [dataset, setDataset] = useState("fct_project_summary");
  const [select, setSelect] = useState("project_id,total_cost,profit_rate");
  const [whereJson, setWhereJson] = useState("{}");
  const [limit, setLimit] = useState(50);
  const [result, setResult] = useState<{ rows: Record<string, unknown>[]; rendered_sql?: string; note?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setResult(null);
    let where: Record<string, unknown> | null = null;
    try {
      const v = JSON.parse(whereJson || "{}");
      if (v && Object.keys(v).length > 0) where = v;
    } catch {
      setError("where 条件は JSON で記述してください");
      return;
    }
    try {
      const r = await api.post<typeof result>("/analytics/query", {
        dataset,
        select: select ? select.split(",").map((s) => s.trim()).filter(Boolean) : null,
        where,
        limit
      });
      setResult(r.data);
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? String(e));
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">分析クエリプレイグラウンド</h2>
      <p className="text-xs text-slate-500">識別子はサーバ側でホワイトリスト検証され、値はパラメタライズされます。</p>

      <div className="bg-white rounded shadow-sm p-3 space-y-3">
        <Field label="dataset (テーブル/ビュー名)" value={dataset} onChange={setDataset} />
        <Field label="select (カンマ区切り、空で *)" value={select} onChange={setSelect} />
        <Field label="where (JSON)" value={whereJson} onChange={setWhereJson} mono />
        <div>
          <label className="block text-xs text-slate-600 mb-1">limit</label>
          <input
            type="number"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="border border-slate-300 rounded px-2 py-1 text-sm w-32"
          />
        </div>
        <button onClick={submit} className="bg-brand text-white px-3 py-1.5 rounded text-sm">クエリ実行</button>
      </div>

      {error && <div className="text-rose-600 text-sm">{error}</div>}

      {result && (
        <div className="bg-white rounded shadow-sm p-3 text-sm">
          {result.rendered_sql && <pre className="text-xs bg-slate-50 p-2 rounded overflow-auto">{result.rendered_sql}</pre>}
          {result.note && <p className="text-amber-600 text-xs my-2">{result.note}</p>}
          {result.rows.length === 0 ? (
            <p className="text-slate-400 text-xs mt-2">行なし</p>
          ) : (
            <table className="w-full text-xs mt-2 border border-slate-100">
              <thead className="bg-slate-50">
                <tr>{Object.keys(result.rows[0]).map((k) => <th key={k} className="p-1 text-left">{k}</th>)}</tr>
              </thead>
              <tbody>
                {result.rows.map((row, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    {Object.values(row).map((v, j) => (
                      <td key={j} className="p-1">{typeof v === "object" ? JSON.stringify(v) : String(v)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, mono }: { label: string; value: string; onChange: (s: string) => void; mono?: boolean }) {
  return (
    <div>
      <label className="block text-xs text-slate-600 mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`border border-slate-300 rounded px-2 py-1 text-sm w-full ${mono ? "font-mono" : ""}`}
      />
    </div>
  );
}
