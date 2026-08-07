import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '@/api/client';

interface Proposal {
  id: number;
  proposal_code: string;
  client_name: string;
  theme: string;
  status: string;
  expected_amount?: string | null;
  proposal_deadline?: string | null;
  owner_employee_code?: string | null;
  primary_category?: string | null;
}

const STAGES: Array<{ key: string; label: string }> = [
  { key: 'lead', label: 'リード' },
  { key: 'qualifying', label: '評価中' },
  { key: 'proposing', label: '提案中' },
  { key: 'in_negotiation', label: '交渉中' },
  { key: 'won', label: '受注' },
  { key: 'lost', label: '失注' },
];

export default function ProposalsPage() {
  const [items, setItems] = useState<Proposal[]>([]);

  useEffect(() => {
    apiClient
      .get<Proposal[]>('/proposals')
      .then((r) => setItems(r.data))
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">提案案件 Kanban</h2>
        <Link
          to="/proposals/new"
          className="rounded bg-sol-primary px-3 py-1 text-sm text-white hover:bg-sol-accent"
        >
          + 新規提案
        </Link>
      </div>
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {STAGES.map((s) => {
          const list = items.filter((p) => p.status === s.key);
          return (
            <div key={s.key} className="rounded border bg-white p-2 min-h-[200px]">
              <h3 className="mb-2 font-semibold text-sm border-b pb-1">
                {s.label} <span className="text-gray-500">({list.length})</span>
              </h3>
              <ul className="space-y-2">
                {list.map((p) => (
                  <li
                    key={p.id}
                    className="rounded border-l-4 border-sol-primary bg-gray-50 p-2 text-xs"
                  >
                    <Link to={`/proposals/${p.id}`} className="font-bold hover:underline">
                      {p.theme}
                    </Link>
                    <div className="text-gray-600">{p.client_name}</div>
                    {p.expected_amount && (
                      <div className="text-gray-500 mt-1">
                        ¥{Number(p.expected_amount).toLocaleString()}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
