interface Props {
  name: string;
  category: string;
  summary?: string | null;
  priceMin?: string | number | null;
  priceMax?: string | number | null;
  onClick?: () => void;
}

const CATEGORY_LABEL: Record<string, string> = {
  port_dx: '港湾DX',
  renewable_energy: '再エネ',
  disaster_dx: '防災DX',
  pfi: 'PFI',
  ppp: 'PPP',
  environment: '環境保全',
};

const CATEGORY_COLOR: Record<string, string> = {
  port_dx: 'bg-blue-100 text-blue-800',
  renewable_energy: 'bg-emerald-100 text-emerald-800',
  disaster_dx: 'bg-amber-100 text-amber-800',
  pfi: 'bg-purple-100 text-purple-800',
  ppp: 'bg-indigo-100 text-indigo-800',
  environment: 'bg-teal-100 text-teal-800',
};

export default function SolutionCard({
  name,
  category,
  summary,
  priceMin,
  priceMax,
  onClick,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-gray-900">{name}</h3>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
            CATEGORY_COLOR[category] ?? 'bg-gray-100 text-gray-700'
          }`}
        >
          {CATEGORY_LABEL[category] ?? category}
        </span>
      </div>
      {summary && <p className="mt-2 text-sm text-gray-600 line-clamp-3">{summary}</p>}
      {(priceMin != null || priceMax != null) && (
        <p className="mt-3 text-xs text-gray-500">
          価格帯: {priceMin ?? '—'} 〜 {priceMax ?? '—'} 円
        </p>
      )}
    </button>
  );
}
