interface Props {
  priority?: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW' | string;
  score?: number | string | null;
}

const STYLE: Record<string, string> = {
  URGENT: 'bg-red-600 text-white',
  HIGH: 'bg-orange-500 text-white',
  MEDIUM: 'bg-amber-400 text-gray-900',
  LOW: 'bg-emerald-500 text-white',
};

export default function AssetAgeBadge({ priority, score }: Props) {
  const cls = priority ? STYLE[priority] ?? 'bg-gray-300' : 'bg-gray-300';
  return (
    <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold ${cls}`}>
      {priority ?? '—'}
      {score != null && <span className="opacity-80">({score})</span>}
    </span>
  );
}
