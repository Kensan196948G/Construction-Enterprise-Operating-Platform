import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '@/api/client';
import { BidStatusBadge, type BidStatus } from '@/components/BidStatusBadge';

interface Bid {
  id: number;
  bid_code: string;
  bid_type: 'public' | 'private';
  issuer_name: string;
  project_name: string;
  bid_date?: string | null;
  bid_price?: number | null;
  estimated_price?: number | null;
  result: BidStatus;
}

interface Stats {
  total_count: number;
  won_count: number;
  lost_count: number;
  win_rate: number;
  average_price_gap_ratio: number | null;
  top_competitors: { name: string; wins: number }[];
}

export default function BidsPage() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    apiClient.get<Bid[]>('/bids').then((r) => setBids(r.data));
    apiClient.get<Stats>('/bids/stats/summary').then((r) => setStats(r.data));
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">入札一覧</h2>
      {stats && (
        <div className="rounded border bg-white p-3 text-sm flex flex-wrap gap-6">
          <span>件数: {stats.total_count}</span>
          <span>落札: {stats.won_count}</span>
          <span>失注: {stats.lost_count}</span>
          <span>落札率: {(stats.win_rate * 100).toFixed(1)}%</span>
          {stats.average_price_gap_ratio !== null && (
            <span>
              予定価格比 平均差異: {(stats.average_price_gap_ratio * 100).toFixed(2)}%
            </span>
          )}
        </div>
      )}
      <div className="overflow-auto rounded border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left">入札番号</th>
              <th className="px-3 py-2 text-left">区分</th>
              <th className="px-3 py-2 text-left">発注者</th>
              <th className="px-3 py-2 text-left">案件</th>
              <th className="px-3 py-2 text-left">入札日</th>
              <th className="px-3 py-2 text-right">入札額</th>
              <th className="px-3 py-2 text-left">結果</th>
            </tr>
          </thead>
          <tbody>
            {bids.map((b) => (
              <tr key={b.id} className="border-t">
                <td className="px-3 py-2">
                  <Link to={`/bids/${b.id}`} className="text-crm-primary underline">
                    {b.bid_code}
                  </Link>
                </td>
                <td className="px-3 py-2">{b.bid_type === 'public' ? '公共' : '民間'}</td>
                <td className="px-3 py-2">{b.issuer_name}</td>
                <td className="px-3 py-2">{b.project_name}</td>
                <td className="px-3 py-2">{b.bid_date ?? ''}</td>
                <td className="px-3 py-2 text-right">
                  {b.bid_price ? b.bid_price.toLocaleString() : ''}
                </td>
                <td className="px-3 py-2">
                  <BidStatusBadge status={b.result} />
                </td>
              </tr>
            ))}
            {bids.length === 0 && (
              <tr>
                <td className="px-3 py-4 text-gray-500" colSpan={7}>
                  入札データはまだありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
