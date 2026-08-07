import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '@/api/client';
import { CreditRankBadge, type CreditRank } from '@/components/CreditRankBadge';

interface Client {
  id: number;
  client_code: string;
  client_name: string;
  client_type: string;
  credit_rank: CreditRank;
  relationship_score: number;
  phone?: string | null;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<Client[]>('/clients')
      .then((r) => setClients(r.data))
      .catch((e) => setError(String(e)));
  }, []);

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold">顧客一覧</h2>
      {error && <p className="text-rose-600">{error}</p>}
      <div className="overflow-auto rounded border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left">コード</th>
              <th className="px-3 py-2 text-left">名称</th>
              <th className="px-3 py-2 text-left">区分</th>
              <th className="px-3 py-2 text-left">与信</th>
              <th className="px-3 py-2 text-right">関係性スコア</th>
              <th className="px-3 py-2 text-left">電話</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-3 py-2">
                  <Link to={`/clients/${c.id}`} className="text-crm-primary underline">
                    {c.client_code}
                  </Link>
                </td>
                <td className="px-3 py-2">{c.client_name}</td>
                <td className="px-3 py-2">{c.client_type}</td>
                <td className="px-3 py-2">
                  <CreditRankBadge rank={c.credit_rank} />
                </td>
                <td className="px-3 py-2 text-right">{Number(c.relationship_score).toFixed(1)}</td>
                <td className="px-3 py-2">{c.phone ?? ''}</td>
              </tr>
            ))}
            {clients.length === 0 && (
              <tr>
                <td className="px-3 py-4 text-gray-500" colSpan={6}>
                  顧客がまだありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
