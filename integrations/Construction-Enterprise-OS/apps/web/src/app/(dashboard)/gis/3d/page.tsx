"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Mountain, Layers, Ruler, Globe } from "lucide-react";
import type { MapArea, MapRouteSegment } from "@/components/gis/LeafletMap";

const LeafletMap = dynamic(() => import("@/components/gis/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-gray-50 text-gray-400 text-sm">
      OpenStreetMapを読み込み中...
    </div>
  ),
});

const DISPLAY_LAYERS = [
  { id: "construction", label: "工事区域", defaultChecked: true },
  { id: "contour", label: "等高線", defaultChecked: true },
  { id: "buildings", label: "建物", defaultChecked: true },
  { id: "infrastructure", label: "インフラ", defaultChecked: false },
  { id: "labels", label: "注記", defaultChecked: true },
];

const MAP_TYPES = ["地形", "衛星", "建物3D"] as const;
type MapType = (typeof MAP_TYPES)[number];

type TerrainArea = MapArea & { layerId: string };

const TERRAIN_AREAS: TerrainArea[] = [
  {
    id: "construction-main",
    layerId: "construction",
    name: "第1工区 工事区域",
    color: "#2563eb",
    fillOpacity: 0.16,
    points: [
      [34.6812, 135.5157],
      [34.6844, 135.5188],
      [34.6829, 135.5235],
      [34.6795, 135.5219],
    ],
  },
  {
    id: "contour-low",
    layerId: "contour",
    name: "標高 20m 等高線帯",
    color: "#16a34a",
    fillOpacity: 0.1,
    points: [
      [34.6849, 135.5128],
      [34.6875, 135.516],
      [34.6862, 135.5206],
      [34.6833, 135.5181],
    ],
  },
  {
    id: "buildings-zone",
    layerId: "buildings",
    name: "既存建物群",
    color: "#7c3aed",
    fillOpacity: 0.12,
    points: [
      [34.6779, 135.5168],
      [34.6797, 135.5184],
      [34.6787, 135.5212],
      [34.6768, 135.5197],
    ],
  },
];

const INFRASTRUCTURE_ROUTES: MapRouteSegment[] = [
  {
    id: "infra-access-road",
    name: "仮設アクセス道路",
    status: "通常",
    color: "#f97316",
    points: [
      [34.6768, 135.5135],
      [34.6791, 135.5162],
      [34.6817, 135.519],
      [34.6845, 135.5223],
    ],
  },
];

export default function Terrain3DPage() {
  const [mapType, setMapType] = useState<MapType>("地形");
  const [altitude, setAltitude] = useState(50);
  const [opacity, setOpacity] = useState(80);
  const [layers, setLayers] = useState<Record<string, boolean>>(
    Object.fromEntries(DISPLAY_LAYERS.map((l) => [l.id, l.defaultChecked])),
  );
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const toggleLayer = (id: string) => {
    setLayers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const visibleAreas: MapArea[] = TERRAIN_AREAS.filter(
    (area) => layers[area.layerId],
  ).map(({ layerId: _layerId, ...area }) => area);
  const visibleRoutes = layers.infrastructure ? INFRASTRUCTURE_ROUTES : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">3D地形表示</h1>
          <p className="text-sm text-gray-500 mt-1">
            GIS/地図 — 3Dテレイン・標高データ
          </p>
        </div>
        <Mountain className="w-8 h-8 text-green-600" />
      </div>

      {/* 統計カード */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-xs text-gray-500">表示範囲</p>
          <p className="text-sm font-semibold text-gray-800 mt-1">
            北緯34.68° 東経135.52°
          </p>
        </div>
        <div className="bg-white rounded-lg border p-4 flex items-center gap-3">
          <Mountain className="w-7 h-7 text-green-500 shrink-0" />
          <div>
            <p className="text-xs text-gray-500">最高標高</p>
            <p className="text-xl font-bold text-gray-800">142 m</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4 flex items-center gap-3">
          <Globe className="w-7 h-7 text-blue-500 shrink-0" />
          <div>
            <p className="text-xs text-gray-500">最低標高</p>
            <p className="text-xl font-bold text-gray-800">3 m</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border p-4 flex items-center gap-3">
          <Ruler className="w-7 h-7 text-purple-500 shrink-0" />
          <div>
            <p className="text-xs text-gray-500">表示面積</p>
            <p className="text-xl font-bold text-gray-800">2.4 km²</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* コントロールパネル */}
        <div className="lg:col-span-1 space-y-4">
          {/* 地図種別 */}
          <div className="bg-white rounded-lg border p-4 space-y-3">
            <h3 className="font-semibold text-gray-700 text-sm flex items-center gap-1.5">
              <Globe className="w-4 h-4" />
              地図種別
            </h3>
            <div className="space-y-1">
              {MAP_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setMapType(t)}
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    mapType === t
                      ? "bg-blue-600 text-white"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* スライダー */}
          <div className="bg-white rounded-lg border p-4 space-y-4">
            <h3 className="font-semibold text-gray-700 text-sm">表示設定</h3>
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>高度倍率</span>
                <span>{altitude}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={200}
                value={altitude}
                onChange={(e) => setAltitude(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>透明度</span>
                <span>{opacity}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>
          </div>

          {/* レイヤー */}
          <div className="bg-white rounded-lg border p-4 space-y-3">
            <h3 className="font-semibold text-gray-700 text-sm flex items-center gap-1.5">
              <Layers className="w-4 h-4" />
              表示レイヤー
            </h3>
            <div className="space-y-2">
              {DISPLAY_LAYERS.map((layer) => (
                <label
                  key={layer.id}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={layers[layer.id]}
                    onChange={() => toggleLayer(layer.id)}
                    className="accent-blue-600"
                  />
                  <span className="text-sm text-gray-700">{layer.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 計測ツール */}
          <div className="bg-white rounded-lg border p-4 space-y-3">
            <h3 className="font-semibold text-gray-700 text-sm flex items-center gap-1.5">
              <Ruler className="w-4 h-4" />
              計測ツール
            </h3>
            <div className="space-y-1">
              {["面積計測", "距離計測", "標高断面"].map((tool) => (
                <button
                  key={tool}
                  onClick={() =>
                    setActiveTool(activeTool === tool ? null : tool)
                  }
                  className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                    activeTool === tool
                      ? "bg-orange-500 text-white"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {tool}
                  {activeTool === tool && " ✓"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* OpenStreetMap ビューワー */}
        <div className="lg:col-span-3">
          <div className="relative bg-white rounded-lg border overflow-hidden">
            <div className="h-96">
              <LeafletMap
                areas={visibleAreas}
                routeSegments={visibleRoutes}
                height="384px"
                center={[34.6818, 135.5189]}
                zoom={15}
                scrollWheelZoom={false}
              />
            </div>
            <div className="absolute left-4 top-4 rounded-md border border-white/80 bg-white/95 px-3 py-2 shadow-sm">
              <p className="text-xs font-semibold text-gray-900">
                OpenStreetMap 地形ベース
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                地図種別: {mapType} / 高度倍率 {altitude}%
              </p>
            </div>
            {layers.labels && (
              <div className="absolute right-4 top-4 rounded-md border border-white/80 bg-white/95 px-3 py-2 text-xs text-gray-600 shadow-sm">
                北緯34.68° 東経135.52°
              </div>
            )}
            {activeTool && (
              <div className="absolute left-4 bottom-4 px-4 py-2 bg-orange-500 text-white text-sm rounded-lg shadow-sm">
                {activeTool} モード有効
              </div>
            )}
            {mapType === "建物3D" && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-900/20 to-transparent" />
            )}
            <div className="pointer-events-none absolute right-4 bottom-4 flex items-end gap-1">
              {[28, 44, 64, 38, 52].map((height, index) => (
                <span
                  key={index}
                  className="block w-7 rounded-t border border-blue-200 bg-blue-500/35 shadow-sm"
                  style={{
                    height: mapType === "建物3D" ? height : Math.max(6, height * 0.25),
                    opacity: mapType === "建物3D" ? 1 : 0.35,
                  }}
                />
              ))}
            </div>
          </div>
          <div className="mt-3 flex gap-2 text-xs text-gray-500 flex-wrap">
            <span className="bg-gray-100 px-2 py-1 rounded">
              高度倍率: {altitude}%
            </span>
            <span className="bg-gray-100 px-2 py-1 rounded">
              透明度: {opacity}%
            </span>
            <span className="bg-gray-100 px-2 py-1 rounded">
              表示レイヤー: {Object.values(layers).filter(Boolean).length} /{" "}
              {DISPLAY_LAYERS.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
