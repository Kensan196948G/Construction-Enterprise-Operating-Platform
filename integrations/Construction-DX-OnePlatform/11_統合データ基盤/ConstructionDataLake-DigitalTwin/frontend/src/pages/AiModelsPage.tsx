import { useEffect, useState } from "react";
import { api } from "@/api/client";

interface AiModel {
  model_id: string;
  name: string;
  version: string;
  model_type: string;
  framework: string | null;
  accuracy: number | null;
  metrics: Record<string, unknown> | null;
  deploy_status: string;
  description: string | null;
}

const DEPLOY_COLOR: Record<string, string> = {
  experiment: "bg-slate-100 text-slate-600",
  staging: "bg-amber-100 text-amber-700",
  production: "bg-emerald-100 text-emerald-700",
  retired: "bg-rose-100 text-rose-600"
};

export default function AiModelsPage() {
  const [items, setItems] = useState<AiModel[]>([]);
  const [active, setActive] = useState<AiModel | null>(null);
  const [inputs, setInputs] = useState('{"prompt": "横浜港の工事進捗を要約して"}');
  const [output, setOutput] = useState<unknown>(null);

  useEffect(() => {
    api.get<AiModel[]>("/ai/models").then((r) => setItems(r.data)).catch(() => setItems([]));
  }, []);

  const infer = async () => {
    if (!active) return;
    try {
      const r = await api.post(`/ai/models/${active.model_id}/infer`, { inputs: JSON.parse(inputs) });
      setOutput(r.data);
    } catch (e: any) {
      setOutput({ error: e?.response?.data?.detail ?? String(e) });
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">AI モデル管理</h2>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-left">
              <tr>
                <th className="p-2">名称</th>
                <th className="p-2">バージョン</th>
                <th className="p-2">タイプ</th>
                <th className="p-2">精度</th>
                <th className="p-2">デプロイ</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={6} className="p-4 text-center text-slate-400">モデル未登録</td></tr>
              ) : (
                items.map((m) => (
                  <tr key={m.model_id} className={`border-t border-slate-100 ${active?.model_id === m.model_id ? "bg-brand/5" : ""}`}>
                    <td className="p-2 font-medium">{m.name}</td>
                    <td className="p-2 text-xs">{m.version}</td>
                    <td className="p-2 text-xs">{m.model_type}</td>
                    <td className="p-2 text-xs">{m.accuracy ?? "-"}</td>
                    <td className="p-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${DEPLOY_COLOR[m.deploy_status]}`}>{m.deploy_status}</span>
                    </td>
                    <td className="p-2">
                      <button onClick={() => setActive(m)} className="text-xs px-2 py-1 rounded bg-slate-200">推論</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="col-span-1 bg-white rounded shadow-sm p-3">
          <h3 className="font-semibold mb-2">推論テスト</h3>
          {!active ? (
            <p className="text-slate-400 text-sm">右側から推論するモデルを選んでください</p>
          ) : (
            <div className="space-y-2">
              <p className="text-xs"><span className="font-mono">{active.name}</span> ({active.model_type})</p>
              <textarea
                className="w-full border border-slate-300 rounded p-2 text-xs font-mono h-32"
                value={inputs}
                onChange={(e) => setInputs(e.target.value)}
              />
              <button onClick={infer} className="bg-brand text-white px-3 py-1.5 rounded text-sm">推論実行</button>
              {output !== null && (
                <pre className="bg-slate-50 p-2 rounded text-xs overflow-auto max-h-64">{JSON.stringify(output, null, 2)}</pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
