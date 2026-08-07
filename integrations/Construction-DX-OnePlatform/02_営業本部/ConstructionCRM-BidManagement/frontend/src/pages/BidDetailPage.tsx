import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '@/api/client';
import { BidStatusBadge, type BidStatus } from '@/components/BidStatusBadge';

interface Bid {
  id: number;
  bid_code: string;
  bid_type: 'public' | 'private';
  bid_method?: string | null;
  issuer_name: string;
  project_name: string;
  announcement_date?: string | null;
  bid_date?: string | null;
  award_date?: string | null;
  bid_price?: number | null;
  estimated_price?: number | null;
  award_price?: number | null;
  technical_score?: number | null;
  price_score?: number | null;
  evaluation_score?: number | null;
  result: BidStatus;
  winner_name?: string | null;
  remarks?: string | null;
}

export default function BidDetailPage() {
  const { id } = useParams();
  const [bid, setBid] = useState<Bid | null>(null);

  useEffect(() => {
    if (!id) return;
    apiClient.get<Bid>(`/bids/${id}`).then((r) => setBid(r.data));
  }, [id]);

  if (!bid) return <p>読み込み中...</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">{bid.project_name}</h2>
      <div className="flex items-center gap-3">
        <BidStatusBadge status={bid.result} />
        <span>{bid.bid_type === 'public' ? '公共入札' : '民間入札'}</span>
        {bid.bid_method && <span>{bid.bid_method}</span>}
      </div>
      <section className="rounded border bg-white p-4 grid grid-cols-2 gap-3 text-sm">
        <Field label="入札番号" value={bid.bid_code} />
        <Field label="発注者" value={bid.issuer_name} />
        <Field label="公告日" value={bid.announcement_date} />
        <Field label="入札日" value={bid.bid_date} />
        <Field label="落札日" value={bid.award_date} />
        <Field label="入札額" value={bid.bid_price?.toLocaleString()} />
        <Field label="予定価格" value={bid.estimated_price?.toLocaleString()} />
        <Field label="落札額" value={bid.award_price?.toLocaleString()} />
        <Field label="技術点" value={bid.technical_score?.toString()} />
        <Field label="価格点" value={bid.price_score?.toString()} />
        <Field label="総合評価点" value={bid.evaluation_score?.toString()} />
        <Field label="落札者" value={bid.winner_name} />
      </section>
      {bid.remarks && (
        <section className="rounded border bg-white p-4 text-sm whitespace-pre-wrap">
          {bid.remarks}
        </section>
      )}
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
