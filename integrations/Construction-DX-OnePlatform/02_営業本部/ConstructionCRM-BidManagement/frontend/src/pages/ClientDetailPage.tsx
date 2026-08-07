import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '@/api/client';
import { CreditRankBadge, type CreditRank } from '@/components/CreditRankBadge';

interface Client {
  id: number;
  client_code: string;
  client_name: string;
  client_type: string;
  industry?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  credit_rank: CreditRank;
  credit_limit?: number | null;
  relationship_score: number;
  notes?: string | null;
}

interface Opportunity {
  id: number;
  title: string;
  stage: string;
  expected_amount?: number | null;
}

export default function ClientDetailPage() {
  const { id } = useParams();
  const [client, setClient] = useState<Client | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

  useEffect(() => {
    if (!id) return;
    apiClient.get<Client>(`/clients/${id}`).then((r) => setClient(r.data));
    apiClient
      .get<Opportunity[]>('/opportunities')
      .then((r) => setOpportunities(r.data.filter((o: any) => o.client_id === Number(id))));
  }, [id]);

  if (!client) return <p>読み込み中...</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">
        {client.client_name}{' '}
        <span className="text-sm text-gray-500">({client.client_code})</span>
      </h2>
      <section className="rounded border bg-white p-4 space-y-2">
        <div className="flex items-center gap-3">
          <CreditRankBadge rank={client.credit_rank} />
          <span className="text-sm">関係性スコア: {Number(client.relationship_score).toFixed(1)}</span>
          {client.credit_limit !== null && client.credit_limit !== undefined && (
            <span className="text-sm">与信限度: {client.credit_limit.toLocaleString()}円</span>
          )}
        </div>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <Field label="業種" value={client.industry} />
          <Field label="区分" value={client.client_type} />
          <Field label="住所" value={client.address} />
          <Field label="電話" value={client.phone} />
          <Field label="メール" value={client.email} />
        </dl>
        {client.notes && <p className="text-sm text-gray-700 whitespace-pre-wrap">{client.notes}</p>}
      </section>
      <section className="rounded border bg-white p-4">
        <h3 className="mb-2 font-semibold">関連案件</h3>
        <ul className="text-sm space-y-1">
          {opportunities.map((o) => (
            <li key={o.id} className="border-b py-1">
              [{o.stage}] {o.title} — {(o.expected_amount ?? 0).toLocaleString()}円
            </li>
          ))}
          {opportunities.length === 0 && <li className="text-gray-500">関連案件はありません</li>}
        </ul>
      </section>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd>{value || '—'}</dd>
    </div>
  );
}
