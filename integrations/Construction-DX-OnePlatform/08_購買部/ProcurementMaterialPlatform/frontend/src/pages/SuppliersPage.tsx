import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '@/api/client';
import { SupplierRankBadge } from '@/components/SupplierRankBadge';

interface Supplier {
  id: number;
  supplier_code: string;
  company_name: string;
  category: string;
  evaluation_rank: string | null;
  evaluation_score: number | null;
  qualified_invoice_no: string | null;
  construction_license_no: string | null;
}

export default function SuppliersPage() {
  const [items, setItems] = useState<Supplier[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<Supplier[]>('/suppliers')
      .then((r) => setItems(r.data))
      .catch((e) => setErr(e.message));
  }, []);

  return (
    <section>
      <h2 className="mb-4 text-xl font-bold">協力会社マスタ</h2>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <table className="w-full border-collapse bg-white text-sm shadow-sm">
        <thead className="bg-proc-primary/10">
          <tr>
            <th className="border p-2 text-left">コード</th>
            <th className="border p-2 text-left">会社名</th>
            <th className="border p-2 text-left">カテゴリ</th>
            <th className="border p-2 text-left">建設業許可</th>
            <th className="border p-2 text-left">適格請求書事業者</th>
            <th className="border p-2 text-left">評価ランク</th>
          </tr>
        </thead>
        <tbody>
          {items.map((s) => (
            <tr key={s.id} className="hover:bg-gray-50">
              <td className="border p-2">{s.supplier_code}</td>
              <td className="border p-2">
                <Link to={`/suppliers/${s.id}`} className="text-proc-primary hover:underline">
                  {s.company_name}
                </Link>
              </td>
              <td className="border p-2">{s.category}</td>
              <td className="border p-2">{s.construction_license_no ?? '-'}</td>
              <td className="border p-2 font-mono text-xs">{s.qualified_invoice_no ?? '-'}</td>
              <td className="border p-2">
                <SupplierRankBadge rank={s.evaluation_rank} score={s.evaluation_score} />
              </td>
            </tr>
          ))}
          {items.length === 0 && !err && (
            <tr>
              <td colSpan={6} className="p-4 text-center text-gray-500">
                協力会社が登録されていません。
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
