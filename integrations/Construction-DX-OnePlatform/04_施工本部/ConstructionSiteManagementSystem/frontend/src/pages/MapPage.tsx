/**
 * 地図ページ.
 * - プロジェクト位置 (geom POINT, site_location_wkt) を Leaflet で表示
 * - 現場ポリゴン (geom POLYGON) を polygon で描画
 * - マーカークリックでプロジェクト詳細ポップアップ
 *
 * shared-ui の <MapViewer> を経由 (engine=leaflet)。
 */
import { useEffect, useMemo, useState } from 'react';
import { MapViewer, type MapMarker, type MapPolygon } from '@cdx/shared-ui';
import { apiClient } from '@/api/client';

interface Project {
  id: number;
  project_code: string;
  project_name: string;
  status: string;
  start_date?: string | null;
  end_date?: string | null;
  site_location_wkt?: string | null;
  site_polygon_wkt?: string | null;
  progress_rate?: number | null;
}

/**
 * 単純な WKT パーサ.
 *  POINT(lng lat)
 *  POLYGON((lng lat, lng lat, ...))
 * 不正な入力は null を返す。本番では wellknown 系パッケージ推奨。
 */
function parsePoint(wkt?: string | null): [number, number] | null {
  if (!wkt) return null;
  const m = /POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i.exec(wkt);
  if (!m) return null;
  const lng = Number(m[1]);
  const lat = Number(m[2]);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return [lat, lng];
}

function parsePolygon(wkt?: string | null): Array<[number, number]> | null {
  if (!wkt) return null;
  const m = /POLYGON\s*\(\s*\(([^)]+)\)\s*\)/i.exec(wkt);
  if (!m) return null;
  const points = m[1]
    .split(',')
    .map((s) => s.trim().split(/\s+/).map(Number))
    .filter((arr) => arr.length === 2 && arr.every((n) => Number.isFinite(n)))
    .map(([lng, lat]) => [lat, lng] as [number, number]);
  return points.length >= 3 ? points : null;
}

export default function MapPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<Project[]>('/projects')
      .then((r) => setProjects(r.data))
      .catch((e) => setErr(e?.message ?? '取得に失敗しました'));
  }, []);

  const markers = useMemo<MapMarker[]>(() => {
    return projects
      .map((p): MapMarker | null => {
        const pt = parsePoint(p.site_location_wkt);
        if (!pt) return null;
        return {
          id: p.id,
          lat: pt[0],
          lng: pt[1],
          label: p.project_name,
          popup: (
            <div className="text-xs">
              <div className="font-bold">{p.project_name}</div>
              <div className="text-gray-500">{p.project_code}</div>
              <div className="mt-1">進捗率: {p.progress_rate ?? 0}%</div>
              {p.start_date && p.end_date && (
                <div>
                  工期: {p.start_date} 〜 {p.end_date}
                </div>
              )}
              <div className="mt-1 inline-block bg-blue-100 text-blue-800 px-1 rounded">
                {p.status}
              </div>
            </div>
          ),
        };
      })
      .filter((m): m is MapMarker => m !== null);
  }, [projects]);

  const polygons = useMemo<MapPolygon[]>(() => {
    return projects
      .map((p): MapPolygon | null => {
        const poly = parsePolygon(p.site_polygon_wkt);
        if (!poly) return null;
        return {
          id: `poly-${p.id}`,
          positions: poly,
          label: p.project_name,
          color: '#f97316',
          fillOpacity: 0.25,
        };
      })
      .filter((p): p is MapPolygon => p !== null);
  }, [projects]);

  const center = useMemo<[number, number]>(() => {
    if (markers.length === 0) return [35.6762, 139.6503];
    const lat = markers.reduce((s, m) => s + m.lat, 0) / markers.length;
    const lng = markers.reduce((s, m) => s + m.lng, 0) / markers.length;
    return [lat, lng];
  }, [markers]);

  return (
    <section>
      <h2 className="text-xl font-bold mb-4">現場マップ</h2>
      {err && <p className="text-red-600 text-sm mb-2">{err}</p>}
      <MapViewer
        engine="leaflet"
        center={center}
        zoom={markers.length > 0 ? 10 : 5}
        markers={markers}
        polygons={polygons}
        height={520}
      />
      <p className="text-xs text-gray-500 mt-2">
        マーカー数: {markers.length} / ポリゴン数: {polygons.length}
      </p>
    </section>
  );
}
