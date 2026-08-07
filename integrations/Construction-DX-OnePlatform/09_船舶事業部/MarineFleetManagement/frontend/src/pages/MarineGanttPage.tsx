import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '@/api/client';

/**
 * 海上工事ガント・カレンダー.
 *
 * - voyage と marine_construction_link を統合して、船舶ごとの稼働期間を可視化。
 * - 競合 (1 隻が複数工事に同時割当) を赤強調。
 */

interface Voyage {
  id: number;
  voyage_no: string;
  vessel_id: number;
  project_code?: string | null;
  planned_departure_at: string;
  planned_arrival_at: string;
  status: string;
}

interface ConstructionLink {
  id: number;
  vessel_id: number;
  project_code: string;
  project_name?: string | null;
  start_date: string;
  end_date?: string | null;
  status: string;
}

interface Vessel {
  id: number;
  vessel_name: string;
}

interface GanttBar {
  vesselId: number;
  vesselName: string;
  label: string;
  kind: 'voyage' | 'construction';
  start: Date;
  end: Date;
  projectCode?: string | null;
  conflict: boolean;
}

const DAY_MS = 86400000;

function parseDate(s: string): Date {
  return new Date(s);
}

function rangesOverlap(a: GanttBar, b: GanttBar): boolean {
  return a.start < b.end && b.start < a.end;
}

export default function MarineGanttPage() {
  const [vessels, setVessels] = useState<Vessel[]>([]);
  const [voyages, setVoyages] = useState<Voyage[]>([]);
  const [links, setLinks] = useState<ConstructionLink[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [days, setDays] = useState(60);

  useEffect(() => {
    Promise.all([
      apiClient.get<Vessel[]>('/vessels').then((r) => setVessels(r.data)),
      apiClient.get<Voyage[]>('/voyages').then((r) => setVoyages(r.data)),
      apiClient
        .get<ConstructionLink[]>('/vessels/construction-links')
        .then((r) => setLinks(r.data))
        .catch(() => setLinks([])),
    ]).catch((e: Error) => setErr(e.message));
  }, []);

  const vesselNameById = useMemo(() => {
    const m = new Map<number, string>();
    vessels.forEach((v) => m.set(v.id, v.vessel_name));
    return m;
  }, [vessels]);

  // ガントバー化
  const bars: GanttBar[] = useMemo(() => {
    const out: GanttBar[] = [];
    voyages.forEach((v) => {
      out.push({
        vesselId: v.vessel_id,
        vesselName: vesselNameById.get(v.vessel_id) ?? `#${v.vessel_id}`,
        label: v.voyage_no,
        kind: 'voyage',
        start: parseDate(v.planned_departure_at),
        end: parseDate(v.planned_arrival_at),
        projectCode: v.project_code,
        conflict: false,
      });
    });
    links.forEach((l) => {
      out.push({
        vesselId: l.vessel_id,
        vesselName: vesselNameById.get(l.vessel_id) ?? `#${l.vessel_id}`,
        label: l.project_name ?? l.project_code,
        kind: 'construction',
        start: parseDate(l.start_date),
        end: l.end_date ? parseDate(l.end_date) : new Date(Date.now() + 30 * DAY_MS),
        projectCode: l.project_code,
        conflict: false,
      });
    });

    // 競合検出: 同一 vessel で他のバーと重複するか
    for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        if (out[i].vesselId === out[j].vesselId && rangesOverlap(out[i], out[j])) {
          out[i].conflict = true;
          out[j].conflict = true;
        }
      }
    }
    return out;
  }, [voyages, links, vesselNameById]);

  // タイムスケール
  const now = new Date();
  const start0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end0 = new Date(start0.getTime() + days * DAY_MS);

  // 船舶ごとに行を作る
  const rows = useMemo(() => {
    const map = new Map<number, GanttBar[]>();
    bars.forEach((b) => {
      const arr = map.get(b.vesselId) ?? [];
      arr.push(b);
      map.set(b.vesselId, arr);
    });
    return Array.from(map.entries()).map(([vid, items]) => ({
      vesselId: vid,
      vesselName: vesselNameById.get(vid) ?? `#${vid}`,
      bars: items,
    }));
  }, [bars, vesselNameById]);

  const pxPerDay = 14;
  const headerDays: Date[] = [];
  for (let i = 0; i <= days; i += 7) {
    headerDays.push(new Date(start0.getTime() + i * DAY_MS));
  }

  function barStyle(b: GanttBar): React.CSSProperties {
    const left = Math.max(0, ((b.start.getTime() - start0.getTime()) / DAY_MS) * pxPerDay);
    const widthDays = Math.max(
      1,
      (Math.min(b.end.getTime(), end0.getTime()) -
        Math.max(b.start.getTime(), start0.getTime())) /
        DAY_MS,
    );
    return {
      left,
      width: widthDays * pxPerDay,
    };
  }

  const conflictCount = bars.filter((b) => b.conflict).length;

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl font-bold">海上工事ガント・カレンダー</h2>
        <div className="flex items-center gap-3 text-sm">
          {conflictCount > 0 && (
            <span className="rounded bg-marine-danger px-2 py-1 text-white">
              競合 {conflictCount} 件
            </span>
          )}
          <label>
            表示日数:
            <select
              className="ml-1 rounded border px-1"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              <option value={30}>30 日</option>
              <option value={60}>60 日</option>
              <option value={90}>90 日</option>
            </select>
          </label>
        </div>
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}

      <div className="overflow-auto rounded border bg-white shadow-sm">
        <div className="flex">
          <div className="w-40 shrink-0 border-r bg-gray-50 p-2 text-xs font-bold">
            船舶 / 工事
          </div>
          <div className="relative" style={{ width: days * pxPerDay }}>
            <div className="flex border-b text-xs text-gray-500">
              {headerDays.map((d, i) => (
                <div
                  key={i}
                  style={{ width: 7 * pxPerDay }}
                  className="border-r px-1 py-1"
                >
                  {`${d.getMonth() + 1}/${d.getDate()}`}
                </div>
              ))}
            </div>
          </div>
        </div>

        {rows.map((row) => (
          <div key={row.vesselId} className="flex border-t">
            <div className="w-40 shrink-0 border-r bg-gray-50 p-2 text-xs">
              {row.vesselName}
            </div>
            <div
              className="relative"
              style={{ width: days * pxPerDay, minHeight: row.bars.length * 22 + 4 }}
            >
              {row.bars.map((b, idx) => (
                <div
                  key={idx}
                  className={`absolute rounded px-1 text-xs text-white shadow ${
                    b.conflict
                      ? 'bg-marine-danger'
                      : b.kind === 'voyage'
                        ? 'bg-marine-accent'
                        : 'bg-marine-wave'
                  }`}
                  style={{ ...barStyle(b), top: idx * 22 + 2, height: 18 }}
                  title={`${b.kind === 'voyage' ? '運航' : '工事'} ${b.label} / ${b.start.toISOString().slice(0, 10)}〜${b.end.toISOString().slice(0, 10)}${b.conflict ? ' [競合]' : ''}`}
                >
                  {b.label}
                </div>
              ))}
            </div>
          </div>
        ))}
        {!rows.length && (
          <p className="p-4 text-sm text-gray-400">表示対象のデータがありません</p>
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-xs">
        <span className="rounded bg-marine-accent px-2 py-1 text-white">運航 voyage</span>
        <span className="rounded bg-marine-wave px-2 py-1 text-white">海上工事</span>
        <span className="rounded bg-marine-danger px-2 py-1 text-white">競合 (要調整)</span>
      </div>
    </section>
  );
}
