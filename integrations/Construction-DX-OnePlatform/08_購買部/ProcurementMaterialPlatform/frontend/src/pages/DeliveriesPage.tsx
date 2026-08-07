import { useEffect, useState } from 'react';
import { apiClient } from '@/api/client';

interface Delivery {
  id: number;
  delivery_no: string;
  order_id: number;
  delivered_qty: number;
  defective_qty: number;
  delivery_date: string;
  status: string;
  inspector_name?: string;
}

export default function DeliveriesPage() {
  const [items, setItems] = useState<Delivery[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const reload = () =>
    apiClient
      .get<Delivery[]>('/deliveries')
      .then((r) => setItems(r.data))
      .catch((e) => setErr(e.message));

  useEffect(() => {
    reload();
  }, []);

  const inspect = async (id: number, accept: boolean) => {
    try {
      await apiClient.post(`/deliveries/${id}/inspect?accept=${accept}`);
      await reload();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <section>
      <h2 className="mb-4 text-xl font-bold">納品検収</h2>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <table className="w-full border-collapse bg-white text-sm shadow-sm">
        <thead className="bg-proc-primary/10">
          <tr>
            <th className="border p-2 text-left">納品番号</th>
            <th className="border p-2 text-left">発注ID</th>
            <th className="border p-2 text-right">納品数</th>
            <th className="border p-2 text-right">不良数</th>
            <th className="border p-2 text-left">納品日</th>
            <th className="border p-2 text-left">ステータス</th>
            <th className="border p-2"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((d) => (
            <tr key={d.id}>
              <td className="border p-2">{d.delivery_no}</td>
              <td className="border p-2">{d.order_id}</td>
              <td className="border p-2 text-right">{d.delivered_qty}</td>
              <td className="border p-2 text-right">{d.defective_qty}</td>
              <td className="border p-2">{d.delivery_date}</td>
              <td className="border p-2">{d.status}</td>
              <td className="border p-2">
                {d.status === 'received' && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => inspect(d.id, true)}
                      className="rounded bg-proc-ok px-2 py-0.5 text-xs text-white"
                    >
                      合格
                    </button>
                    <button
                      onClick={() => inspect(d.id, false)}
                      className="rounded bg-proc-danger px-2 py-0.5 text-xs text-white"
                    >
                      不合格
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
