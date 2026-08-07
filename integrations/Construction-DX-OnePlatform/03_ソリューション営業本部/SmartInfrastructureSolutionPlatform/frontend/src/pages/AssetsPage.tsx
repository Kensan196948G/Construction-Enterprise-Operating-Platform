import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import AssetAgeBadge from "@/components/AssetAgeBadge";
import { apiClient } from "@/api/client";

// Fix default marker icon paths for Leaflet under Vite
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface HeatmapFeature {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: {
    asset_id: number;
    asset_code: string;
    name: string;
    asset_type: string;
    age_years: number | null;
    deterioration_score: number;
    priority: "URGENT" | "HIGH" | "MEDIUM" | "LOW";
    color: string;
  };
}

interface HeatmapResponse {
  type: "FeatureCollection";
  features: HeatmapFeature[];
  color_stops: Array<{ min_score: number; color: string }>;
}

export default function AssetsPage() {
  const [data, setData] = useState<HeatmapResponse | null>(null);

  useEffect(() => {
    apiClient
      .get<HeatmapResponse>("/assets/age-heatmap")
      .then((r) => setData(r.data))
      .catch(() =>
        setData({ type: "FeatureCollection", features: [], color_stops: [] }),
      );
  }, []);

  const ranked = useMemo(() => {
    const features = data?.features ?? [];
    return [...features].sort(
      (a, b) =>
        b.properties.deterioration_score - a.properties.deterioration_score,
    );
  }, [data?.features]);
  const features = data?.features ?? [];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">
        インフラ資産マップ / 老朽度ヒートマップ
      </h2>
      <div className="grid gap-4 md:grid-cols-3">
        <div
          className="md:col-span-2 rounded border bg-white p-2"
          style={{ height: 480 }}
        >
          <MapContainer
            center={[36.0, 138.0]}
            zoom={5}
            scrollWheelZoom
            style={{ width: "100%", height: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {features.map((f) => {
              const [lng, lat] = f.geometry.coordinates;
              const p = f.properties;
              // スコアに応じて半径を 6-18 で線形補完
              const radius = 6 + Math.min(12, p.deterioration_score / 8);
              return (
                <CircleMarker
                  key={p.asset_id}
                  center={[lat, lng]}
                  radius={radius}
                  pathOptions={{
                    color: p.color,
                    fillColor: p.color,
                    fillOpacity: 0.55,
                    weight: 1.5,
                  }}
                >
                  <Popup>
                    <div className="text-xs">
                      <div className="font-bold">{p.name}</div>
                      <div className="text-gray-600">{p.asset_type}</div>
                      <div className="mt-1">
                        <AssetAgeBadge
                          priority={p.priority}
                          score={p.deterioration_score}
                        />
                      </div>
                      <div className="mt-1 text-gray-500">
                        築年数: {p.age_years ?? "—"} 年
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </MapContainer>
        </div>
        <div
          className="rounded border bg-white p-3 overflow-auto"
          style={{ maxHeight: 480 }}
        >
          <h3 className="font-semibold mb-2">老朽度ランキング</h3>
          <ul className="space-y-2 text-sm">
            {ranked.map((f) => (
              <li
                key={f.properties.asset_id}
                className="flex items-center justify-between rounded border p-2"
              >
                <span>
                  <span
                    className="inline-block w-3 h-3 rounded-full mr-2 align-middle"
                    style={{ backgroundColor: f.properties.color }}
                  />
                  <span className="font-medium">{f.properties.name}</span>
                  <span className="ml-2 text-xs text-gray-500">
                    {f.properties.asset_type}
                  </span>
                </span>
                <AssetAgeBadge
                  priority={f.properties.priority}
                  score={f.properties.deterioration_score}
                />
              </li>
            ))}
            {features.length === 0 && (
              <li className="text-gray-500">資産が登録されていません</li>
            )}
          </ul>
          {data?.color_stops && data.color_stops.length > 0 && (
            <div className="mt-3 border-t pt-2 text-xs text-gray-600">
              <div className="font-semibold mb-1">凡例</div>
              <div className="flex flex-wrap gap-2">
                {[...data.color_stops]
                  .sort((a, b) => b.min_score - a.min_score)
                  .map((cs) => (
                    <span
                      key={cs.color}
                      className="inline-flex items-center gap-1"
                    >
                      <span
                        className="inline-block w-3 h-3 rounded"
                        style={{ backgroundColor: cs.color }}
                      />
                      <span>≥ {cs.min_score}</span>
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
