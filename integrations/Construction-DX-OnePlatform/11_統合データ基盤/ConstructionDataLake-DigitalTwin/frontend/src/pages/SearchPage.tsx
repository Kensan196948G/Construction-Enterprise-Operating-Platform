import { useState } from "react";
import { api } from "@/api/client";

interface Hit {
  index: string;
  score: number;
  source: Record<string, unknown>;
  highlights: Record<string, string[]> | null;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [note, setNote] = useState<string | null>(null);

  const submit = async () => {
    if (!query.trim()) return;
    setNote(null);
    try {
      const r = await api.post<{ hits: Hit[]; note?: string }>("/search", { query, size: 30 });
      setHits(r.data.hits);
      if (r.data.note) setNote(r.data.note);
    } catch {
      setHits([]);
      setNote("検索失敗");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">横断全文検索</h2>
      <p className="text-xs text-slate-500">Elasticsearch + kuromoji で部門横断 DataLake を検索します。</p>

      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="例: 横浜港工事 鉄筋"
          className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm"
        />
        <button onClick={submit} className="bg-brand text-white px-4 py-2 rounded text-sm">検索</button>
      </div>

      {note && <div className="text-amber-600 text-xs">{note}</div>}

      <div className="space-y-2">
        {hits.length === 0 ? (
          <p className="text-slate-400 text-sm">結果なし</p>
        ) : (
          hits.map((h, i) => (
            <div key={i} className="bg-white rounded shadow-sm p-3 text-sm">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-xs font-mono text-slate-500">{h.index}</span>
                <span className="text-xs text-slate-400">score: {h.score?.toFixed(2)}</span>
              </div>
              {h.highlights ? (
                Object.entries(h.highlights).map(([field, frags]) => (
                  <div key={field} className="text-xs">
                    <span className="font-mono text-slate-500">{field}: </span>
                    <span dangerouslySetInnerHTML={{ __html: frags.join(" … ") }} />
                  </div>
                ))
              ) : (
                <pre className="text-xs bg-slate-50 p-2 rounded overflow-auto">{JSON.stringify(h.source, null, 2)}</pre>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
