import { useEffect, useState } from "react";
import { api } from "@/api/client";
import DigitalTwinScene from "@/components/DigitalTwinScene";

interface GeoFeature {
  type: "Feature";
  geometry: { type: string; coordinates: number[] };
  properties: Record<string, unknown>;
}
interface FeatureCollection {
  type: "FeatureCollection";
  features: GeoFeature[];
  metadata?: { count?: number; bbox?: number[] | null };
}

export default function DigitalTwinPage() {
  const [scene, setScene] = useState<FeatureCollection | null>(null);

  useEffect(() => {
    api.get<FeatureCollection>("/digital-twin/scene", { params: { include_iot: true } })
      .then((r) => setScene(r.data))
      .catch(() => setScene({ type: "FeatureCollection", features: [], metadata: { count: 0 } }));
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-3">
        <h2 className="text-2xl font-bold">デジタルツイン</h2>
        <span className="text-xs text-slate-500">{scene?.metadata?.count ?? 0} オブジェクト</span>
      </div>
      <p className="text-xs text-slate-500">
        VITE_CESIUM_ION_ACCESS_TOKEN が設定されていれば Cesium + Cesium World Terrain で 3D 描画、
        未設定の場合は Cesium + OSM、Cesium 自体が未導入なら Leaflet + OSM にフォールバックします。
      </p>
      <DigitalTwinScene scene={scene} height={560} />

      <div className="grid grid-cols-5 gap-2 text-xs">
        <Legend color="#0EA5E9" label="建物 (Building)" />
        <Legend color="#6366F1" label="構造物 (Structure)" />
        <Legend color="#F59E0B" label="重機 (ICT建機)" />
        <Legend color="#10B981" label="船舶 (Vessel)" />
        <Legend color="#EF4444" label="IoT センサー" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 bg-white rounded p-2 shadow-sm">
      <div style={{ background: color }} className="w-3 h-3 rounded-full" />
      <span>{label}</span>
    </div>
  );
}
