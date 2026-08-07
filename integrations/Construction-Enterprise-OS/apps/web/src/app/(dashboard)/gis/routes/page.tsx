"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { Route, Truck, AlertTriangle } from "lucide-react";
import type { MapRouteSegment, MapSitePin } from "@/components/gis/LeafletMap";

const LeafletMap = dynamic(() => import("@/components/gis/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-gray-50 text-gray-400 text-sm">
      OpenStreetMapを読み込み中...
    </div>
  ),
});

type RouteStatus = "通常" | "工事中" | "通行止め" | "迂回推奨";

interface TransportRoute {
  id: string;
  name: string;
  origin: string;
  destination: string;
  distance: string;
  duration: string;
  weightLimit: string;
  status: RouteStatus;
  tripsThisMonth: number;
  points: [number, number][];
}

const MOCK_ROUTES: TransportRoute[] = [
  {
    id: "1",
    name: "メインルートA",
    origin: "資材置き場（南ゲート）",
    destination: "第1工区 作業エリア",
    distance: "1.2 km",
    duration: "8 分",
    weightLimit: "25 t",
    status: "通常",
    tripsThisMonth: 142,
    points: [
      [35.6238, 139.7391],
      [35.6261, 139.7422],
      [35.6291, 139.746],
      [35.6317, 139.7485],
    ],
  },
  {
    id: "2",
    name: "資材搬入ルートB",
    origin: "資材置き場（南ゲート）",
    destination: "第2工区 作業エリア",
    distance: "2.1 km",
    duration: "14 分",
    weightLimit: "20 t",
    status: "工事中",
    tripsThisMonth: 87,
    points: [
      [35.6238, 139.7391],
      [35.6205, 139.7427],
      [35.6172, 139.7459],
      [35.6146, 139.749],
    ],
  },
  {
    id: "3",
    name: "土砂搬出ルートC",
    origin: "掘削エリア（東）",
    destination: "土砂仮置き場",
    distance: "0.8 km",
    duration: "5 分",
    weightLimit: "30 t",
    status: "通常",
    tripsThisMonth: 215,
    points: [
      [35.632, 139.751],
      [35.6295, 139.7545],
      [35.6267, 139.758],
      [35.6232, 139.7612],
    ],
  },
  {
    id: "4",
    name: "重機搬入ルートD",
    origin: "北ゲート",
    destination: "第3工区 重機置き場",
    distance: "3.4 km",
    duration: "22 分",
    weightLimit: "50 t",
    status: "通行止め",
    tripsThisMonth: 0,
    points: [
      [35.6382, 139.7424],
      [35.635, 139.744],
      [35.6328, 139.7468],
      [35.6302, 139.7496],
    ],
  },
  {
    id: "5",
    name: "コンクリートルートE",
    origin: "生コン車進入口",
    destination: "打設エリア",
    distance: "1.6 km",
    duration: "10 分",
    weightLimit: "20 t",
    status: "迂回推奨",
    tripsThisMonth: 63,
    points: [
      [35.618, 139.7358],
      [35.6158, 139.7396],
      [35.6164, 139.7445],
      [35.6192, 139.7482],
    ],
  },
  {
    id: "6",
    name: "廃材搬出ルートF",
    origin: "解体エリア",
    destination: "廃材置き場（西）",
    distance: "2.8 km",
    duration: "18 分",
    weightLimit: "15 t",
    status: "通常",
    tripsThisMonth: 98,
    points: [
      [35.6287, 139.7318],
      [35.626, 139.7342],
      [35.6227, 139.7358],
      [35.6195, 139.7375],
    ],
  },
];

const STATUS_CONFIG: Record<RouteStatus, { className: string; dot: string }> = {
  通常: { className: "bg-green-100 text-green-800", dot: "bg-green-500" },
  工事中: { className: "bg-yellow-100 text-yellow-800", dot: "bg-yellow-500" },
  通行止め: { className: "bg-red-100 text-red-800", dot: "bg-red-500" },
  迂回推奨: {
    className: "bg-orange-100 text-orange-800",
    dot: "bg-orange-500",
  },
};

const STATUS_MAP_COLOR: Record<RouteStatus, string> = {
  通常: "#16a34a",
  工事中: "#eab308",
  通行止め: "#dc2626",
  迂回推奨: "#f97316",
};

// Helper to normalize API route status to RouteStatus
function normalizeRouteStatus(raw: string): RouteStatus {
  const map: Record<string, RouteStatus> = {
    normal: "通常",
    active: "通常",
    open: "通常",
    under_construction: "工事中",
    construction: "工事中",
    closed: "通行止め",
    blocked: "通行止め",
    detour: "迂回推奨",
    detour_recommended: "迂回推奨",
  };
  return map[raw?.toLowerCase()] ?? "通常";
}

function normalizeRoutePoints(value: unknown): [number, number][] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((point) => {
    if (Array.isArray(point) && point.length >= 2) {
      const first = Number(point[0]);
      const second = Number(point[1]);
      if (!Number.isFinite(first) || !Number.isFinite(second)) return [];
      return Math.abs(first) > 90 ? [[second, first] as [number, number]] : [[first, second] as [number, number]];
    }

    if (point && typeof point === "object") {
      const record = point as Record<string, unknown>;
      const lat = Number(record.lat ?? record.latitude);
      const lng = Number(record.lng ?? record.lon ?? record.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return [[lat, lng] as [number, number]];
    }

    return [];
  });
}

export default function RoutesPage() {
  const [routes, setRoutes] = useState<TransportRoute[]>(MOCK_ROUTES);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/gis/routes?per_page=50");
      if (res.ok) {
        const json = await res.json();
        const data: Record<string, unknown>[] =
          json?.data?.items ?? json?.items ?? [];
        if (Array.isArray(data) && data.length > 0) {
          setRoutes(
            data.map((item) => {
              const distance = Number(item.distance ?? 0);
              const duration = Number(item.duration ?? 0);
              const geometry =
                item.geometry && typeof item.geometry === "object"
                  ? (item.geometry as Record<string, unknown>)
                  : null;
              return {
                id: String(item.id ?? ""),
                name: String(item.name ?? ""),
                origin: String(item.origin ?? item.start_point ?? ""),
                destination: String(item.destination ?? item.end_point ?? ""),
                distance: distance > 0 ? `${distance.toFixed(1)} km` : "",
                duration: duration > 0 ? `${duration} 分` : "",
                weightLimit: String(item.weight_limit ?? ""),
                status: normalizeRouteStatus(String(item.status ?? "")),
                tripsThisMonth: Number(
                  item.trips_this_month ?? item.coordinates_count ?? 0,
                ),
                points: normalizeRoutePoints(
                  item.coordinates ?? geometry?.coordinates,
                ),
              };
            }),
          );
        }
      }
    } catch {
      // fallback to mock data
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = {
    total: routes.length,
    closed: routes.filter((r) => r.status === "通行止め").length,
    tripsTotal: routes.reduce((acc, r) => acc + r.tripsThisMonth, 0),
    trucks: 24,
  };

  const routeSegments: MapRouteSegment[] = routes
    .filter((route) => route.points.length >= 2)
    .map((route) => ({
      id: route.id,
      name: route.name,
      points: route.points,
      status: route.status,
      color: STATUS_MAP_COLOR[route.status],
    }));

  const routePins: MapSitePin[] = routeSegments.flatMap((route, index) => {
    const first = route.points[0];
    const last = route.points[route.points.length - 1];
    return [
      {
        id: index * 2 + 1,
        name: `${route.name} 起点`,
        lat: first[0],
        lng: first[1],
        status: "active",
        workers: 0,
        alerts: 0,
      },
      {
        id: index * 2 + 2,
        name: `${route.name} 終点`,
        lat: last[0],
        lng: last[1],
        status: route.status === "通行止め" ? "alert" : "active",
        workers: 0,
        alerts: route.status === "通行止め" ? 1 : 0,
      },
    ];
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">運搬ルート管理</h1>
          <p className="text-sm text-gray-500 mt-1">
            GIS/地図 — 資材運搬ルート・通行状況
          </p>
        </div>
        <div className="flex items-center gap-3">
          {loading && (
            <span className="text-xs text-blue-500 animate-pulse">
              データ取得中...
            </span>
          )}
          <Route className="w-8 h-8 text-blue-600" />
        </div>
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4 flex items-center gap-3">
          <Route className="w-8 h-8 text-blue-500 shrink-0" />
          <div>
            <p className="text-xs text-gray-500">登録ルート数</p>
            <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4 flex items-center gap-3">
          <AlertTriangle className="w-8 h-8 text-red-500 shrink-0" />
          <div>
            <p className="text-xs text-gray-500">通行止め数</p>
            <p className="text-2xl font-bold text-red-600">{stats.closed}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4 flex items-center gap-3">
          <Truck className="w-8 h-8 text-green-500 shrink-0" />
          <div>
            <p className="text-xs text-gray-500">今月通行回数</p>
            <p className="text-2xl font-bold text-gray-800">
              {stats.tripsTotal}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4 flex items-center gap-3">
          <Truck className="w-8 h-8 text-purple-500 shrink-0" />
          <div>
            <p className="text-xs text-gray-500">資材運搬台数</p>
            <p className="text-2xl font-bold text-gray-800">{stats.trucks}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ルートテーブル */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-700">ルート一覧</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      ルート名
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      出発地
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      目的地
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      距離
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      所要時間
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      制限重量
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      通行状況
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">
                      今月回数
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {routes.map((route) => (
                    <tr
                      key={route.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {route.name}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {route.origin}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {route.destination}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {route.distance}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {route.duration}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {route.weightLimit}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[route.status].className}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[route.status].dot}`}
                          />
                          {route.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-right">
                        {route.tripsThisMonth}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* OpenStreetMap */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="px-4 py-3 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-700">
                OpenStreetMap ルート
              </h2>
            </div>
            <div className="h-72">
              <LeafletMap
                sitePins={routePins}
                routeSegments={routeSegments}
                height="288px"
                center={[35.626, 139.746]}
                zoom={14}
                scrollWheelZoom={false}
              />
            </div>
          </div>

          {/* ステータス凡例 */}
          <div className="bg-white rounded-lg border p-4 space-y-2">
            <h3 className="font-semibold text-gray-700 text-sm">
              通行状況凡例
            </h3>
            {(Object.keys(STATUS_CONFIG) as RouteStatus[]).map((status) => (
              <div key={status} className="flex items-center gap-2 text-sm">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${STATUS_CONFIG[status].dot}`}
                />
                <span className="text-gray-700">{status}</span>
                <span className="ml-auto text-gray-500 text-xs">
                  {routes.filter((r) => r.status === status).length} ルート
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
