import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '@/api/client';

interface Activity {
  id: number;
  activity_date: string;
  activity_type: string;
  subject: string;
  contact_person?: string | null;
  result?: string | null;
  follow_up_date?: string | null;
  reporter_employee_code?: string | null;
}

const TYPE_LABEL: Record<string, string> = {
  visit: '訪問',
  call: '電話',
  email: 'メール',
  proposal: '提案',
  meeting: '会議',
  other: 'その他',
};

export default function ActivitiesPage() {
  const [items, setItems] = useState<Activity[]>([]);

  useEffect(() => {
    apiClient.get<Activity[]>('/activities').then((r) => setItems(r.data));
  }, []);

  // 簡易カレンダー: 日付別グルーピング
  const grouped = useMemo(() => {
    const map = new Map<string, Activity[]>();
    for (const a of items) {
      const k = a.activity_date;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(a);
    }
    return [...map.entries()].sort(([a], [b]) => (a > b ? -1 : 1));
  }, [items]);

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold">営業活動カレンダー</h2>
      {grouped.length === 0 && <p className="text-gray-500">活動記録はまだありません</p>}
      {grouped.map(([date, list]) => (
        <section key={date} className="rounded border bg-white">
          <header className="border-b bg-gray-100 px-3 py-1 text-sm font-semibold">
            {date}
          </header>
          <ul className="divide-y text-sm">
            {list.map((a) => (
              <li key={a.id} className="px-3 py-2 flex items-center justify-between gap-3">
                <span className="rounded bg-crm-primary px-2 py-0.5 text-xs text-white">
                  {TYPE_LABEL[a.activity_type] ?? a.activity_type}
                </span>
                <span className="flex-1 truncate">{a.subject}</span>
                <span className="text-xs text-gray-500">{a.contact_person ?? ''}</span>
                {a.follow_up_date && (
                  <span className="text-xs text-amber-700">FU: {a.follow_up_date}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
