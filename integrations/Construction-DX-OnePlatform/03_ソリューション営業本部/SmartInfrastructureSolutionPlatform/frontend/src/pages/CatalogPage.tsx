import { useEffect, useState } from 'react';
import SolutionCard from '@/components/SolutionCard';
import { apiClient } from '@/api/client';

interface CatalogItem {
  id: number;
  catalog_code: string;
  name: string;
  category: string;
  summary?: string | null;
  price_min?: string | null;
  price_max?: string | null;
}

const CATEGORIES = [
  { v: '', label: 'すべて' },
  { v: 'port_dx', label: '港湾DX' },
  { v: 'renewable_energy', label: '再エネ' },
  { v: 'disaster_dx', label: '防災DX' },
  { v: 'pfi', label: 'PFI' },
  { v: 'ppp', label: 'PPP' },
  { v: 'environment', label: '環境保全' },
];

export default function CatalogPage() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [cat, setCat] = useState('');

  useEffect(() => {
    apiClient
      .get<CatalogItem[]>('/catalog', { params: cat ? { category: cat } : {} })
      .then((r) => setItems(r.data))
      .catch(() => setItems([]));
  }, [cat]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">ソリューションカタログ</h2>
        <select
          className="rounded border px-2 py-1 text-sm"
          value={cat}
          onChange={(e) => setCat(e.target.value)}
        >
          {CATEGORIES.map((c) => (
            <option key={c.v} value={c.v}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <SolutionCard
            key={it.id}
            name={it.name}
            category={it.category}
            summary={it.summary}
            priceMin={it.price_min}
            priceMax={it.price_max}
          />
        ))}
        {items.length === 0 && (
          <p className="col-span-full text-gray-500">カタログが登録されていません。</p>
        )}
      </div>
    </div>
  );
}
