import { forwardRef, useEffect, useState, type ReactNode } from 'react';
import { cn } from '../utils/cn';

export type MapEngine = 'leaflet' | 'cesium';

export interface MapMarker {
  id: string | number;
  lat: number;
  lng: number;
  label?: string;
  /** ポップアップ内容 */
  popup?: ReactNode;
  /** マーカー色など (実装エンジン依存) */
  color?: string;
}

export interface MapPolygon {
  id: string | number;
  /** [[lat, lng], ...] の閉路 */
  positions: Array<[number, number]>;
  color?: string;
  fillOpacity?: number;
  label?: string;
}

export interface MapViewerProps {
  /** 描画エンジン (デフォルト leaflet) */
  engine?: MapEngine;
  /** 中心座標 [lat, lng]。省略時は日本中心 */
  center?: [number, number];
  /** 初期ズーム */
  zoom?: number;
  /** マーカー */
  markers?: MapMarker[];
  /** ポリゴン */
  polygons?: MapPolygon[];
  /** マーカークリック */
  onMarkerClick?: (marker: MapMarker) => void;
  /** 高さ */
  height?: number | string;
  /** 追加クラス */
  className?: string;
  /** タイル URL (leaflet のみ) */
  tileUrl?: string;
  /** タイル属性 (leaflet のみ) */
  tileAttribution?: string;
}

const DEFAULT_CENTER: [number, number] = [35.6762, 139.6503]; // 日本 (東京)
const DEFAULT_TILE = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const DEFAULT_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

interface LeafletModules {
  MapContainer: typeof import('react-leaflet').MapContainer;
  TileLayer: typeof import('react-leaflet').TileLayer;
  Marker: typeof import('react-leaflet').Marker;
  Popup: typeof import('react-leaflet').Popup;
  Polygon: typeof import('react-leaflet').Polygon;
  Tooltip: typeof import('react-leaflet').Tooltip;
}

/**
 * 地図ビュア。Leaflet (既定) / CesiumJS (3D) を切替できる。
 * Cesium は重いため動的 import。プロジェクトで cesium を別途インストールしない限り
 * `engine="cesium"` は警告メッセージのみ表示する。
 */
export const MapViewer = forwardRef<HTMLDivElement, MapViewerProps>((props, ref) => {
  const {
    engine = 'leaflet',
    center = DEFAULT_CENTER,
    zoom = 5,
    markers = [],
    polygons = [],
    onMarkerClick,
    height = 400,
    className,
    tileUrl = DEFAULT_TILE,
    tileAttribution = DEFAULT_ATTR,
  } = props;

  const [leaflet, setLeaflet] = useState<LeafletModules | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (engine !== 'leaflet') return;
    let cancelled = false;
    (async () => {
      try {
        const mod = await import('react-leaflet');
        // Leaflet CSS をユーザー側で読み込む前提
        if (!cancelled) {
          setLeaflet({
            MapContainer: mod.MapContainer,
            TileLayer: mod.TileLayer,
            Marker: mod.Marker,
            Popup: mod.Popup,
            Polygon: mod.Polygon,
            Tooltip: mod.Tooltip,
          });
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : 'Leaflet の読み込みに失敗しました');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [engine]);

  if (engine === 'cesium') {
    return (
      <div
        ref={ref}
        role="region"
        aria-label="3D地図 (Cesium)"
        className={cn(
          'cdx-card flex items-center justify-center text-sm text-slate-500',
          className,
        )}
        style={{ height }}
      >
        Cesium エンジンはプロジェクトで個別に統合してください。
      </div>
    );
  }

  if (loadError) {
    return (
      <div
        ref={ref}
        role="alert"
        className={cn('cdx-card p-4 text-danger', className)}
        style={{ height }}
      >
        地図の読み込みに失敗しました: {loadError}
      </div>
    );
  }

  if (!leaflet) {
    return (
      <div
        ref={ref}
        role="status"
        aria-label="地図読み込み中"
        className={cn(
          'cdx-card flex items-center justify-center text-sm text-slate-500',
          className,
        )}
        style={{ height }}
      >
        地図を読み込んでいます...
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, Popup, Polygon, Tooltip } = leaflet;

  return (
    <div
      ref={ref}
      role="region"
      aria-label="地図ビュア"
      className={cn('cdx-card overflow-hidden', className)}
      style={{ height }}
    >
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer url={tileUrl} attribution={tileAttribution} />
        {markers.map((m) => (
          <Marker
            key={m.id}
            position={[m.lat, m.lng]}
            eventHandlers={
              onMarkerClick
                ? {
                    click: () => onMarkerClick(m),
                  }
                : undefined
            }
          >
            {m.label && <Tooltip>{m.label}</Tooltip>}
            {m.popup && <Popup>{m.popup}</Popup>}
          </Marker>
        ))}
        {polygons.map((p) => (
          <Polygon
            key={p.id}
            positions={p.positions}
            pathOptions={{
              color: p.color ?? '#f97316',
              fillOpacity: p.fillOpacity ?? 0.25,
            }}
          >
            {p.label && <Tooltip>{p.label}</Tooltip>}
          </Polygon>
        ))}
      </MapContainer>
    </div>
  );
});
MapViewer.displayName = 'MapViewer';
