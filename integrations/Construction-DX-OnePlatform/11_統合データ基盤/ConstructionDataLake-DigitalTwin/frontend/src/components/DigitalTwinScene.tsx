/**
 * DigitalTwinScene
 *
 * 設計方針:
 *   - 本番では Cesium + 3D Tiles + Cesium Ion を利用 (`VITE_CESIUM_ION_ACCESS_TOKEN`).
 *   - Cesium が ESM ランタイムで利用可能ならそちらを使う。
 *     利用不可 / ライセンス未設定の場合は Leaflet + OSM フォールバックで描画する。
 *   - 入力は GeoJSON FeatureCollection (backend `/digital-twin/scene` の出力)。
 *
 * UI:
 *   - feature.properties.kind ごとに色分け
 *   - ToolTip に `name / kind / project_id / project_no` を表示
 *   - カメラ初期位置: 日本中心 (35.6762, 139.6503, 高度 100km)
 */
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

interface Props {
  scene: FeatureCollection | null;
  height?: number;
}

const KIND_COLOR: Record<string, string> = {
  building: "#0EA5E9",
  structure: "#6366F1",
  heavy_equipment: "#F59E0B",
  equipment: "#F59E0B",
  vessel: "#10B981",
  sensor: "#EF4444",
  site: "#64748B"
};

const KIND_TO_CSS_COLOR_FALLBACK = "#64748B";

// Japan-centered initial camera (lat, lng, height in meters).
const INITIAL_VIEW = { lat: 35.6762, lng: 139.6503, height: 100_000 };

// ---- Leaflet (fallback) rendering ----------------------------------------
function buildLeafletIcon(kind: string): L.DivIcon {
  const color = KIND_COLOR[kind] ?? KIND_TO_CSS_COLOR_FALLBACK;
  return L.divIcon({
    className: "",
    html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 2px rgba(0,0,0,0.4)"></div>`,
    iconSize: [14, 14]
  });
}

function buildTooltipHtml(props: Record<string, unknown>): string {
  const kind = String(props.kind ?? "");
  const name = String(props.name ?? "");
  const projectId = props.project_id ? String(props.project_id) : "";
  const projectNo = props.project_no ? String(props.project_no) : "";
  const status = props.status ? String(props.status) : "";
  return `
    <div style="font-size:12px;min-width:160px">
      <div style="font-weight:600">${name}</div>
      <div>種別: ${kind}</div>
      ${status ? `<div>状態: ${status}</div>` : ""}
      ${projectId ? `<div>関連工事: ${projectId}</div>` : ""}
      ${projectNo ? `<div>工事番号: ${projectNo}</div>` : ""}
    </div>`;
}

function renderWithLeaflet(
  container: HTMLDivElement,
  scene: FeatureCollection | null
): () => void {
  const map = L.map(container).setView([INITIAL_VIEW.lat, INITIAL_VIEW.lng], 5);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap"
  }).addTo(map);
  const layer = L.layerGroup().addTo(map);
  if (scene && scene.features.length > 0) {
    const bounds: L.LatLngBoundsLiteral = [];
    for (const f of scene.features) {
      const [lng, lat] = f.geometry.coordinates;
      const kind = String(f.properties.kind ?? "site");
      const m = L.marker([lat, lng], { icon: buildLeafletIcon(kind) });
      m.bindPopup(buildTooltipHtml(f.properties));
      m.addTo(layer);
      bounds.push([lat, lng]);
    }
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }
  return () => map.remove();
}

// ---- Cesium rendering (when available) -----------------------------------
// Vite dev mode の import-analysis は文字列リテラルを抽出してしまうので
// 関数引数経由で変数化し、静的解析を抑制する (cesium は optional dep)。
async function _dynImport(pkg: string): Promise<any> {
   
  return import(/* @vite-ignore */ pkg);
}

async function tryRenderWithCesium(
  container: HTMLDivElement,
  scene: FeatureCollection | null
): Promise<(() => void) | null> {
  // Dynamic import so the bundle works without the cesium dependency installed.
  let Cesium: any;
  try {
    Cesium = await _dynImport("cesium");
    await _dynImport("cesium/Build/Cesium/Widgets/widgets.css");
  } catch {
    return null;
  }

  // Cesium Ion token (Vite client-side env var). If absent we still render
  // using OSM tiles so the licence-key path stays purely additive.
  const ionToken =
    (import.meta as any).env?.VITE_CESIUM_ION_ACCESS_TOKEN ?? "";
  if (ionToken) {
    Cesium.Ion.defaultAccessToken = ionToken;
  }

  try {
    const viewerOpts: any = {
      animation: false,
      timeline: false,
      baseLayerPicker: false,
      geocoder: false,
      navigationHelpButton: false,
      sceneModePicker: false,
      homeButton: false,
      infoBox: true
    };

    if (ionToken && typeof Cesium.createWorldTerrainAsync === "function") {
      try {
        viewerOpts.terrain = new Cesium.Terrain(
          Cesium.createWorldTerrainAsync()
        );
      } catch {
        // ignore: fall back to ellipsoid terrain
      }
    } else {
      // Use OSM imagery so no Ion token is required.
      try {
        viewerOpts.imageryProvider = new Cesium.OpenStreetMapImageryProvider({
          url: "https://tile.openstreetmap.org/"
        });
      } catch {
        /* default imagery is used */
      }
    }

    const viewer = new Cesium.Viewer(container, viewerOpts);
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(
        INITIAL_VIEW.lng,
        INITIAL_VIEW.lat,
        INITIAL_VIEW.height
      )
    });

    if (scene && scene.features.length > 0) {
      const ds = await Cesium.GeoJsonDataSource.load(scene, {
        markerSize: 32,
        clampToGround: true
      });
      // colour-code by feature.properties.kind
      for (const entity of ds.entities.values) {
        const kind = String(entity.properties?.kind?.getValue?.() ?? "site");
        const color = KIND_COLOR[kind] ?? KIND_TO_CSS_COLOR_FALLBACK;
        try {
          if (entity.point) {
            entity.point.color = Cesium.Color.fromCssColorString(color);
            entity.point.pixelSize = 12;
            entity.point.outlineColor = Cesium.Color.WHITE;
            entity.point.outlineWidth = 2;
          }
          if (entity.billboard) {
            entity.billboard.color = Cesium.Color.fromCssColorString(color);
          }
        } catch {
          /* style application is best-effort */
        }
        const props = entity.properties;
        const name = props?.name?.getValue?.() ?? entity.name ?? "";
        const kindLabel = kind;
        const projectId = props?.project_id?.getValue?.() ?? "";
        const projectNo = props?.project_no?.getValue?.() ?? "";
        entity.description = `
          <table>
            <tr><th>種別</th><td>${kindLabel}</td></tr>
            ${projectId ? `<tr><th>関連工事</th><td>${projectId}</td></tr>` : ""}
            ${projectNo ? `<tr><th>工事番号</th><td>${projectNo}</td></tr>` : ""}
          </table>`;
        entity.name = String(name);
      }
      viewer.dataSources.add(ds);
      try {
        viewer.zoomTo(ds);
      } catch {
        /* zoomTo may throw before terrain load — non-fatal */
      }
    }

    return () => {
      try {
        viewer.destroy();
      } catch {
        /* ignore */
      }
    };
  } catch (err) {
    console.warn("Cesium rendering failed, falling back to Leaflet:", err);
    return null;
  }
}

export default function DigitalTwinScene({ scene, height = 480 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [engine, setEngine] = useState<"cesium" | "leaflet" | "pending">("pending");

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let disposed = false;
    let dispose: (() => void) | null = null;

    (async () => {
      const cesiumDispose = await tryRenderWithCesium(el, scene);
      if (disposed) {
        cesiumDispose?.();
        return;
      }
      if (cesiumDispose) {
        dispose = cesiumDispose;
        setEngine("cesium");
        return;
      }
      dispose = renderWithLeaflet(el, scene);
      setEngine("leaflet");
    })();

    return () => {
      disposed = true;
      dispose?.();
      // ensure the container is emptied so the next render starts clean
      if (el) el.innerHTML = "";
    };
  }, [scene]);

  return (
    <div className="rounded overflow-hidden border border-slate-200">
      <div ref={containerRef} style={{ height, position: "relative" }} />
      <div className="px-2 py-1 text-[10px] text-slate-500 bg-slate-50 border-t border-slate-200">
        rendering engine: {engine}
        {engine === "leaflet" ? " (Cesium 未導入 / ライセンス未設定のため OSM フォールバック)" : ""}
      </div>
    </div>
  );
}
