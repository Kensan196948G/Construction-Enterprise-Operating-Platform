import { useEffect, useState } from "react";
import { api } from "@/api/client";

interface LakeTable {
  table_id: string;
  table_name: string;
  zone: string;
  row_count: number | null;
  description: string | null;
  source_systems: string[] | null;
  last_updated: string | null;
}

export default function LakeBrowserPage() {
  const [tables, setTables] = useState<LakeTable[]>([]);
  const [selected, setSelected] = useState<LakeTable | null>(null);
  const [sample, setSample] = useState<Record<string, unknown>[] | null>(null);

  useEffect(() => {
    api.get<LakeTable[]>("/lake/tables").then((r) => setTables(r.data)).catch(() => setTables([]));
  }, []);

  const select = async (t: LakeTable) => {
    setSelected(t);
    setSample(null);
    const r = await api.get<{ rows: Record<string, unknown>[] }>(`/lake/tables/${t.table_id}/sample`).catch(() => null);
    setSample(r?.data.rows ?? []);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">DataLake テーブル</h2>
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1 bg-white rounded shadow-sm">
          <ul className="text-sm divide-y divide-slate-100">
            {tables.length === 0 ? (
              <li className="p-3 text-slate-400">テーブル未登録</li>
            ) : (
              tables.map((t) => (
                <li
                  key={t.table_id}
                  className={`p-3 cursor-pointer hover:bg-slate-50 ${selected?.table_id === t.table_id ? "bg-brand/10" : ""}`}
                  onClick={() => select(t)}
                >
                  <div className="font-medium">{t.table_name}</div>
                  <div className="text-xs text-slate-500">{t.zone} / {t.row_count ?? "?"} rows</div>
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="col-span-2 bg-white rounded shadow-sm p-3">
          {!selected ? (
            <p className="text-slate-400 text-sm">左からテーブルを選択</p>
          ) : (
            <>
              <h3 className="font-semibold mb-1">{selected.table_name}</h3>
              <p className="text-xs text-slate-500 mb-2">{selected.description ?? "-"}</p>
              <p className="text-xs text-slate-500 mb-3">ソース: {selected.source_systems?.join(", ") ?? "-"}</p>
              <h4 className="font-semibold text-sm mb-1">サンプル</h4>
              {sample === null ? (
                <p className="text-slate-400 text-xs">読み込み中…</p>
              ) : sample.length === 0 ? (
                <p className="text-slate-400 text-xs">行なし / 物理テーブル未生成</p>
              ) : (
                <table className="w-full text-xs border border-slate-100">
                  <thead className="bg-slate-50">
                    <tr>{Object.keys(sample[0]).map((k) => <th key={k} className="p-1 text-left">{k}</th>)}</tr>
                  </thead>
                  <tbody>
                    {sample.map((row, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        {Object.values(row).map((v, j) => (
                          <td key={j} className="p-1">{typeof v === "object" ? JSON.stringify(v) : String(v)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
