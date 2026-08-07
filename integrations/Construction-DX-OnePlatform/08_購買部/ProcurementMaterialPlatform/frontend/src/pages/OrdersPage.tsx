import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '@/api/client';

interface Order {
  id: number;
  po_number: string;
  supplier_id: number;
  project_code: string | null;
  status: string;
  total_amount: number;
  delivery_date: string | null;
}

export default function OrdersPage() {
  const [items, setItems] = useState<Order[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<Order[]>('/orders')
      .then((r) => setItems(r.data))
      .catch((e) => setErr(e.message));
  }, []);

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold">発注一覧</h2>
        <Link
          to="/orders/new"
          className="rounded bg-proc-primary px-3 py-1.5 text-sm text-white hover:bg-proc-accent"
        >
          + 新規発注
        </Link>
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <table className="w-full border-collapse bg-white text-sm shadow-sm">
        <thead className="bg-proc-primary/10">
          <tr>
            <th className="border p-2 text-left">発注番号</th>
            <th className="border p-2 text-left">協力会社ID</th>
            <th className="border p-2 text-left">工事</th>
            <th className="border p-2 text-right">合計</th>
            <th className="border p-2 text-left">納期</th>
            <th className="border p-2 text-left">ステータス</th>
          </tr>
        </thead>
        <tbody>
          {items.map((o) => (
            <tr key={o.id}>
              <td className="border p-2">
                <Link to={`/orders/${o.id}`} className="text-proc-primary hover:underline">
                  {o.po_number}
                </Link>
              </td>
              <td className="border p-2">{o.supplier_id}</td>
              <td className="border p-2">{o.project_code ?? '-'}</td>
              <td className="border p-2 text-right">¥{o.total_amount.toLocaleString()}</td>
              <td className="border p-2">{o.delivery_date ?? '-'}</td>
              <td className="border p-2">
                <span className="rounded bg-gray-200 px-2 py-0.5 text-xs">{o.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
