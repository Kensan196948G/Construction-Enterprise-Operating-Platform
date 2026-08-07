import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '@/api/client';

interface Quotation {
  id: number;
  quotation_number: string;
  version: number;
  title: string;
  total_amount: number;
  status: string;
  issue_date?: string | null;
  valid_until?: string | null;
}

export default function QuotationsPage() {
  const [items, setItems] = useState<Quotation[]>([]);

  useEffect(() => {
    apiClient.get<Quotation[]>('/quotations').then((r) => setItems(r.data));
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">見積一覧</h2>
        <Link
          to="/quotations/new"
          className="rounded bg-crm-primary px-3 py-1 text-sm text-white"
        >
          新規作成
        </Link>
      </div>
      <div className="overflow-auto rounded border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left">見積番号</th>
              <th className="px-3 py-2 text-right">版</th>
              <th className="px-3 py-2 text-left">件名</th>
              <th className="px-3 py-2 text-right">合計 (円)</th>
              <th className="px-3 py-2 text-left">発行日</th>
              <th className="px-3 py-2 text-left">有効期限</th>
              <th className="px-3 py-2 text-left">ステータス</th>
            </tr>
          </thead>
          <tbody>
            {items.map((q) => (
              <tr key={q.id} className="border-t">
                <td className="px-3 py-2">
                  <Link to={`/quotations/${q.id}`} className="text-crm-primary underline">
                    {q.quotation_number}
                  </Link>
                </td>
                <td className="px-3 py-2 text-right">v{q.version}</td>
                <td className="px-3 py-2">{q.title}</td>
                <td className="px-3 py-2 text-right">{q.total_amount.toLocaleString()}</td>
                <td className="px-3 py-2">{q.issue_date ?? ''}</td>
                <td className="px-3 py-2">{q.valid_until ?? ''}</td>
                <td className="px-3 py-2">{q.status}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="px-3 py-4 text-gray-500" colSpan={7}>
                  見積はまだありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
