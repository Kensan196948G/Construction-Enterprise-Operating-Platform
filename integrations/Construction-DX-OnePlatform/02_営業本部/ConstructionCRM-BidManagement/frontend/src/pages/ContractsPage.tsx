import { useEffect, useState } from 'react';
import { apiClient } from '@/api/client';

interface Contract {
  id: number;
  contract_number: string;
  project_name: string;
  contract_amount: number;
  contract_date?: string | null;
  work_start_date?: string | null;
  work_end_date?: string | null;
  status: string;
}

export default function ContractsPage() {
  const [items, setItems] = useState<Contract[]>([]);

  useEffect(() => {
    apiClient.get<Contract[]>('/contracts').then((r) => setItems(r.data));
  }, []);

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold">契約一覧</h2>
      <div className="overflow-auto rounded border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left">契約番号</th>
              <th className="px-3 py-2 text-left">案件名</th>
              <th className="px-3 py-2 text-right">契約金額</th>
              <th className="px-3 py-2 text-left">契約日</th>
              <th className="px-3 py-2 text-left">工期</th>
              <th className="px-3 py-2 text-left">ステータス</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-3 py-2">{c.contract_number}</td>
                <td className="px-3 py-2">{c.project_name}</td>
                <td className="px-3 py-2 text-right">{c.contract_amount.toLocaleString()}</td>
                <td className="px-3 py-2">{c.contract_date ?? ''}</td>
                <td className="px-3 py-2">
                  {c.work_start_date} 〜 {c.work_end_date}
                </td>
                <td className="px-3 py-2">{c.status}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="px-3 py-4 text-gray-500" colSpan={6}>
                  契約はまだありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
