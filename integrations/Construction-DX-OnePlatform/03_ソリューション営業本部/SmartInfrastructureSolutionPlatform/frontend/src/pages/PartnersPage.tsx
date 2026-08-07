import { useEffect, useState } from 'react';
import { apiClient } from '@/api/client';

interface Partner {
  id: number;
  partner_code: string;
  name: string;
  partner_type: string;
  contact_name?: string | null;
  contact_email?: string | null;
  website?: string | null;
  is_active: boolean;
}

const TYPE_LABEL: Record<string, string> = {
  tech_partner: '技術提携',
  university: '大学',
  municipality: '自治体',
  startup: 'ベンチャー',
  consultant: 'コンサル',
};

export default function PartnersPage() {
  const [items, setItems] = useState<Partner[]>([]);

  useEffect(() => {
    apiClient
      .get<Partner[]>('/partners')
      .then((r) => setItems(r.data))
      .catch(() => setItems([]));
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">パートナー組織</h2>
      <div className="rounded border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-3 py-2">コード</th>
              <th className="px-3 py-2">名称</th>
              <th className="px-3 py-2">種別</th>
              <th className="px-3 py-2">担当者</th>
              <th className="px-3 py-2">連絡先</th>
              <th className="px-3 py-2">Web</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-3 py-2 font-mono text-xs">{p.partner_code}</td>
                <td className="px-3 py-2 font-medium">{p.name}</td>
                <td className="px-3 py-2">{TYPE_LABEL[p.partner_type] ?? p.partner_type}</td>
                <td className="px-3 py-2">{p.contact_name ?? '—'}</td>
                <td className="px-3 py-2">{p.contact_email ?? '—'}</td>
                <td className="px-3 py-2">
                  {p.website ? (
                    <a className="text-sol-accent underline" href={p.website} target="_blank" rel="noreferrer">
                      Link
                    </a>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="px-3 py-4 text-gray-500" colSpan={6}>
                  パートナーが登録されていません。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
