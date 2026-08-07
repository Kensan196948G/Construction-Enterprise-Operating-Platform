"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapSitePin {
  id: number;
  name: string;
  lat: number;
  lng: number;
  status: string;
  workers: number;
  alerts: number;
}

export interface MapRouteSegment {
  id: string;
  name: string;
  points: [number, number][];
  status?: string;
  color?: string;
}

export interface MapArea {
  id: string;
  name: string;
  points: [number, number][];
  color?: string;
  fillOpacity?: number;
}

interface LeafletMapProps {
  sitePins?: MapSitePin[];
  routeSegments?: MapRouteSegment[];
  areas?: MapArea[];
  height?: string;
  center?: [number, number];
  zoom?: number;
  scrollWheelZoom?: boolean;
}

const OSM_TILE_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION =
  '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const DEFAULT_CENTER: [number, number] = [35.6, 139.7];

function pinColor(status: string): string {
  if (status === "alert") return "#ef4444";
  if (status === "planning") return "#93c5fd";
  return "#2563eb";
}

function createDivIcon(status: string): L.DivIcon {
  const color = pinColor(status);
  const icon = status === "alert" ? "⚠" : status === "planning" ? "📋" : "🏗";
  return L.divIcon({
    className: "",
    html: `<div style="
      background:${color};
      width:32px;height:32px;
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:14px;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
      border:2px solid white;
      cursor:pointer;
    ">${icon}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -34],
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isValidPoint(point: [number, number]): boolean {
  return Number.isFinite(point[0]) && Number.isFinite(point[1]);
}

function statusColor(status?: string): string {
  if (status === "通行止め" || status === "alert" || status === "closed") {
    return "#dc2626";
  }
  if (status === "工事中" || status === "warning" || status === "construction") {
    return "#f97316";
  }
  if (status === "迂回推奨" || status === "detour") return "#7c3aed";
  return "#2563eb";
}

export default function LeafletMap({
  sitePins = [],
  routeSegments = [],
  areas = [],
  height = "480px",
  center = DEFAULT_CENTER,
  zoom = 11,
  scrollWheelZoom = true,
}: LeafletMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const routeLayersRef = useRef<L.Polyline[]>([]);
  const areaLayersRef = useRef<L.Polygon[]>([]);
  const centerLat = center[0];
  const centerLng = center[1];

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = L.map(containerRef.current, {
      center: [centerLat, centerLng],
      zoom,
      zoomControl: false,
      scrollWheelZoom,
    });
    mapRef.current.attributionControl.setPrefix(false);

    L.tileLayer(OSM_TILE_URL, {
      attribution: OSM_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(mapRef.current);

    L.control.zoom({ position: "topright" }).addTo(mapRef.current);
    const resizeTimer = setTimeout(() => mapRef.current?.invalidateSize(), 0);

    return () => {
      clearTimeout(resizeTimer);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [centerLat, centerLng, scrollWheelZoom, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    routeLayersRef.current.forEach((layer) => layer.remove());
    routeLayersRef.current = [];
    areaLayersRef.current.forEach((layer) => layer.remove());
    areaLayersRef.current = [];

    areas.forEach((area) => {
      const points = area.points.filter(isValidPoint);
      if (points.length < 3) return;
      const color = area.color ?? "#16a34a";
      const polygon = L.polygon(points, {
        color,
        weight: 2,
        opacity: 0.9,
        fillColor: color,
        fillOpacity: area.fillOpacity ?? 0.14,
      }).addTo(map);
      polygon.bindPopup(
        `<div style="min-width:150px;font-family:sans-serif">
          <p style="font-weight:700;font-size:13px;margin:0;color:#0f172a">${escapeHtml(area.name)}</p>
          <p style="font-size:12px;color:#6b7280;margin:4px 0 0">OpenStreetMap エリア</p>
        </div>`,
      );
      areaLayersRef.current.push(polygon);
    });

    routeSegments.forEach((route) => {
      const points = route.points.filter(isValidPoint);
      if (points.length < 2) return;
      const color = route.color ?? statusColor(route.status);
      const polyline = L.polyline(points, {
        color,
        weight: 5,
        opacity: 0.82,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);
      polyline.bindPopup(
        `<div style="min-width:160px;font-family:sans-serif">
          <p style="font-weight:700;font-size:13px;margin:0 0 4px;color:#0f172a">${escapeHtml(route.name)}</p>
          ${route.status ? `<p style="font-size:12px;color:${color};margin:2px 0;font-weight:600">${escapeHtml(route.status)}</p>` : ""}
          <p style="font-size:12px;color:#6b7280;margin:2px 0">OpenStreetMap ルート</p>
        </div>`,
      );
      routeLayersRef.current.push(polyline);
    });

    sitePins.forEach((pin) => {
      if (!Number.isFinite(pin.lat) || !Number.isFinite(pin.lng)) return;
      const marker = L.marker([pin.lat, pin.lng], {
        icon: createDivIcon(pin.status),
      }).addTo(map);

      const popupHtml = `
        <div style="min-width:160px;font-family:sans-serif">
          <p style="font-weight:700;font-size:13px;margin:0 0 4px">${escapeHtml(pin.name)}</p>
          ${pin.workers > 0 ? `<p style="font-size:12px;color:#6b7280;margin:2px 0">作業員: ${pin.workers}名</p>` : ""}
          ${pin.alerts > 0 ? `<p style="font-size:12px;color:#dc2626;margin:2px 0">⚠ ${pin.alerts}件 アラート</p>` : ""}
          <p style="font-size:11px;color:#9ca3af;margin:4px 0 0">${pin.lat.toFixed(4)}, ${pin.lng.toFixed(4)}</p>
        </div>`;
      marker.bindPopup(popupHtml);

      markersRef.current.push(marker);
    });

    const boundsPoints: [number, number][] = [
      ...sitePins.map((p) => [p.lat, p.lng] as [number, number]),
      ...routeSegments.flatMap((r) => r.points),
      ...areas.flatMap((a) => a.points),
    ].filter(isValidPoint);

    if (boundsPoints.length > 0) {
      const bounds = L.latLngBounds(boundsPoints);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
    }
    const resizeTimer = setTimeout(() => map.invalidateSize(), 0);
    return () => clearTimeout(resizeTimer);
  }, [areas, routeSegments, sitePins]);

  return <div ref={containerRef} style={{ height, width: "100%" }} />;
}
