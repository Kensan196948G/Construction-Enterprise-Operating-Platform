import { useCallback, useEffect, useState } from "react";
import { apiClient } from "../api/client";

type Drawing = {
  id: number;
  drawing_code: string;
  drawing_name: string;
  category: string | null;
  file_format: string;
  revision: string | null;
  storage_url: string;
};

export default function DrawingsPage() {
  const [items, setItems] = useState<Drawing[]>([]);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    const r = await apiClient.get<Drawing[]>("/drawings", {
      params: q ? { q } : undefined,
    });
    setItems(r.data);
  }, [q]);

  useEffect(() => {
    load();
  }, [load]);

  const thumbnailUrl = (id: number) => {
    const token = localStorage.getItem("cdx_token");
    // axios で blob 取得もできるが、img タグでは Bearer を付けにくいので
    // クエリパラメータ token は使わず、サーバが Cookie or Basic 経由でも認証する想定にする。
    // ローカル開発では認証が緩い想定で <img src> 直叩き。
    return token
      ? `/api/v1/drawings/${id}/thumbnail?token=${encodeURIComponent(token)}`
      : `/api/v1/drawings/${id}/thumbnail`;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">標準図ライブラリ</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
        className="flex gap-2"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="border rounded px-3 py-2 flex-1"
          placeholder="コード / 図面名"
        />
        <button
          type="submit"
          className="bg-tech-primary text-white px-4 rounded"
        >
          検索
        </button>
      </form>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((d) => (
          <div key={d.id} className="bg-white rounded shadow overflow-hidden">
            <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center">
              <img
                src={thumbnailUrl(d.id)}
                alt={`${d.drawing_code} thumbnail`}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
            <div className="px-3 py-2 text-sm space-y-1">
              <div className="font-mono text-xs text-gray-500">
                {d.drawing_code}
              </div>
              <div className="font-medium">{d.drawing_name}</div>
              <div className="text-xs text-gray-500">
                {d.category ?? "-"} / {d.file_format} / {d.revision ?? "-"}
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="col-span-full text-center text-gray-400 py-6">
            標準図が未登録です
          </div>
        )}
      </div>
    </div>
  );
}
