import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '@/api/client';

interface Vessel {
  id: number;
  vessel_code: string;
  vessel_name: string;
  vessel_type: string;
  imo_number?: string | null;
  mmsi?: string | null;
  gross_tonnage?: number | null;
  length_overall_m?: number | null;
  draft_m?: number | null;
  main_engine_kw?: number | null;
  build_year?: number | null;
  home_port?: string | null;
  status: string;
}

interface Position {
  vessel_id: number;
  time: string;
  speed_knots: number | null;
  heading_deg: number | null;
  source: string;
}

interface Utilization {
  vessel_id: number;
  voyages_total: number;
  voyages_active: number;
  utilization_rate: number;
}

export default function VesselDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [vessel, setVessel] = useState<Vessel | null>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [util, setUtil] = useState<Utilization | null>(null);

  useEffect(() => {
    if (!id) return;
    apiClient.get<Vessel>(`/vessels/${id}`).then((r) => setVessel(r.data)).catch(() => {});
    apiClient
      .get<Position>(`/positions/${id}/latest`)
      .then((r) => setPosition(r.data))
      .catch(() => {});
    apiClient
      .get<Utilization>(`/vessels/${id}/utilization`)
      .then((r) => setUtil(r.data))
      .catch(() => {});
  }, [id]);

  if (!vessel) return <p>読み込み中...</p>;

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold">{vessel.vessel_name}</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded border bg-white p-4 shadow-sm">
          <h3 className="font-bold mb-2">諸元</h3>
          <dl className="grid grid-cols-2 gap-y-1 text-sm">
            <dt className="text-gray-500">コード</dt>
            <dd>{vessel.vessel_code}</dd>
            <dt className="text-gray-500">船種</dt>
            <dd>{vessel.vessel_type}</dd>
            <dt className="text-gray-500">IMO</dt>
            <dd>{vessel.imo_number ?? '—'}</dd>
            <dt className="text-gray-500">MMSI</dt>
            <dd>{vessel.mmsi ?? '—'}</dd>
            <dt className="text-gray-500">総トン</dt>
            <dd>{vessel.gross_tonnage ?? '—'}</dd>
            <dt className="text-gray-500">全長</dt>
            <dd>{vessel.length_overall_m ?? '—'} m</dd>
            <dt className="text-gray-500">喫水</dt>
            <dd>{vessel.draft_m ?? '—'} m</dd>
            <dt className="text-gray-500">出力</dt>
            <dd>{vessel.main_engine_kw ?? '—'} kW</dd>
            <dt className="text-gray-500">建造年</dt>
            <dd>{vessel.build_year ?? '—'}</dd>
            <dt className="text-gray-500">所属港</dt>
            <dd>{vessel.home_port ?? '—'}</dd>
          </dl>
        </div>
        <div className="rounded border bg-white p-4 shadow-sm">
          <h3 className="font-bold mb-2">最新位置</h3>
          {position ? (
            <dl className="grid grid-cols-2 gap-y-1 text-sm">
              <dt className="text-gray-500">取得時刻</dt>
              <dd>{position.time}</dd>
              <dt className="text-gray-500">速度</dt>
              <dd>{position.speed_knots ?? '—'} kn</dd>
              <dt className="text-gray-500">針路</dt>
              <dd>{position.heading_deg ?? '—'}°</dd>
              <dt className="text-gray-500">取得源</dt>
              <dd>{position.source}</dd>
            </dl>
          ) : (
            <p className="text-sm text-gray-400">船位データなし</p>
          )}
          {util && (
            <div className="mt-3 text-sm">
              稼働率:{' '}
              <span className="font-bold">
                {(util.utilization_rate * 100).toFixed(1)}%
              </span>{' '}
              ({util.voyages_active}/{util.voyages_total} 航海)
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
