import { useEffect, useState } from "react";
import { api, endpoints } from "../api/client";

interface Archive {
  archive_id: string;
  target_type: string;
  file_name: string;
  sha256: string;
  timestamp_token?: string;
  search_date?: string;
  search_amount?: number;
  search_counterparty?: string;
  retention_until?: string;
  revision_history: Array<{
    revised_at: string;
    reason: string;
    prev_sha256: string;
    new_sha256: string;
  }>;
}

export default function ArchivesPage() {
  const [items, setItems] = useState<Archive[]>([]);
  const [q, setQ] = useState<{
    q: string;
    counterparty: string;
    date_from: string;
    date_to: string;
    amount_min: string;
    amount_max: string;
  }>({
    q: "",
    counterparty: "",
    date_from: "",
    date_to: "",
    amount_min: "",
    amount_max: "",
  });
  const [period, setPeriod] = useState("");

  const reload = () => {
    const params = new URLSearchParams();
    if (q.q) params.append("q", q.q);
    if (q.counterparty) params.append("counterparty", q.counterparty);
    if (q.date_from) params.append("date_from", q.date_from);
    if (q.date_to) params.append("date_to", q.date_to);
    if (q.amount_min) params.append("amount_min", q.amount_min);
    if (q.amount_max) params.append("amount_max", q.amount_max);
    // 新検索エンドポイント
    api
      .get<Archive[]>(`${endpoints.archives}/search?${params.toString()}`)
      .then((r) => setItems(r.data))
      .catch(() =>
        // 後方互換: 旧 endpoint
        api
          .get<Archive[]>(`${endpoints.archives}?${params.toString()}`)
          .then((r) => setItems(r.data))
      );
  };

  const exportZip = () => {
    const params = new URLSearchParams();
    if (period) params.append("period", period);
    else {
      if (q.date_from) params.append("date_from", q.date_from);
      if (q.date_to) params.append("date_to", q.date_to);
    }
    api
      .get(`${endpoints.archives}/export?${params.toString()}`, {
        responseType: "blob",
      })
      .then((r) => {
        const url = window.URL.createObjectURL(new Blob([r.data]));
        const a = document.createElement("a");
        a.href = url;
        a.download = `archives_${period || "export"}.zip`;
        a.click();
        window.URL.revokeObjectURL(url);
      });
  };

  useEffect(reload, []);

  const verify = (id: string) =>
    api
      .get(`${endpoints.archives}/${id}/verify`)
      .then((r) =>
        alert(
          r.data.integrity_ok
            ? "改ざんなし (SHA-256一致)"
            : "改ざん検知! SHA-256不一致"
        )
      );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">電帳法アーカイブ</h1>
      <div className="bg-white p-3 rounded-xl shadow grid gap-2 grid-cols-1 md:grid-cols-4">
        <input
          placeholder="全文検索 (ファイル名 / 取引先 / 種別)"
          value={q.q}
          onChange={(e) => setQ({ ...q, q: e.target.value })}
          className="border rounded px-2 py-1 md:col-span-2"
        />
        <input
          placeholder="取引先"
          value={q.counterparty}
          onChange={(e) => setQ({ ...q, counterparty: e.target.value })}
          className="border rounded px-2 py-1"
        />
        <input
          type="date"
          value={q.date_from}
          onChange={(e) => setQ({ ...q, date_from: e.target.value })}
          className="border rounded px-2 py-1"
        />
        <input
          type="date"
          value={q.date_to}
          onChange={(e) => setQ({ ...q, date_to: e.target.value })}
          className="border rounded px-2 py-1"
        />
        <input
          type="number"
          placeholder="金額下限"
          value={q.amount_min}
          onChange={(e) => setQ({ ...q, amount_min: e.target.value })}
          className="border rounded px-2 py-1"
        />
        <input
          type="number"
          placeholder="金額上限"
          value={q.amount_max}
          onChange={(e) => setQ({ ...q, amount_max: e.target.value })}
          className="border rounded px-2 py-1"
        />
        <button
          onClick={reload}
          className="bg-cdx-corp text-white rounded px-3 py-1 min-h-tap"
        >
          検索
        </button>
        <div className="flex gap-2 md:col-span-4 items-center">
          <input
            placeholder="期間 (YYYY-MM)"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border rounded px-2 py-1"
          />
          <button
            onClick={exportZip}
            className="bg-cdx-accounting text-white rounded px-3 py-1 min-h-tap text-sm"
          >
            ZIPエクスポート
          </button>
        </div>
      </div>
      <table className="w-full bg-white rounded-xl shadow text-sm">
        <thead className="bg-slate-100">
          <tr>
            <th className="p-2 text-left">ファイル</th>
            <th className="p-2 text-left">対象種別</th>
            <th className="p-2 text-left">取引先</th>
            <th className="p-2 text-right">金額</th>
            <th className="p-2 text-left">SHA-256</th>
            <th className="p-2 text-left">訂正履歴</th>
            <th className="p-2 text-left">保存期限</th>
            <th className="p-2"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.archive_id} className="border-t">
              <td className="p-2">{i.file_name}</td>
              <td className="p-2">{i.target_type}</td>
              <td className="p-2">{i.search_counterparty}</td>
              <td className="p-2 text-right">
                {i.search_amount
                  ? `¥${Number(i.search_amount).toLocaleString("ja-JP")}`
                  : ""}
              </td>
              <td className="p-2">
                <code className="text-xs">{i.sha256.slice(0, 12)}…</code>
              </td>
              <td className="p-2 text-center">
                {i.revision_history?.length ?? 0}
              </td>
              <td className="p-2 text-xs">
                {i.retention_until?.slice(0, 10) ?? ""}
              </td>
              <td className="p-2">
                <button
                  onClick={() => verify(i.archive_id)}
                  className="bg-cdx-accounting text-white rounded px-2 py-1 text-xs min-h-tap"
                >
                  改ざん検証
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
