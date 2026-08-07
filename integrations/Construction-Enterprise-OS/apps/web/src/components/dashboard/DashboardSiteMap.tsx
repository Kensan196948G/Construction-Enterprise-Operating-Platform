"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ────────────────────────────────────────────────────────────────────────────
// 工事位置マップ — real OpenStreetMap tiles (© OpenStreetMap contributors)
// Imperative Leaflet pattern, matching src/components/gis/LeafletMap.tsx.
// Must be loaded via next/dynamic({ ssr: false }) — Leaflet touches `window`.
// ────────────────────────────────────────────────────────────────────────────

type Site = {
  name: string;
  short: string;
  lat: number;
  lng: number;
  color: string;
  workers: number;
  progress: number;
};

const SITES: Site[] = [
  { name: "品川タワー新築工事", short: "品川", lat: 35.6092, lng: 139.73, color: "#1a56db", workers: 45, progress: 68 },
  { name: "横浜分譲マンション", short: "横浜", lat: 35.4437, lng: 139.638, color: "#16a34a", workers: 32, progress: 42 },
  { name: "大田区土木工事", short: "大田区", lat: 35.5614, lng: 139.716, color: "#f97316", workers: 18, progress: 85 },
  { name: "新宿再開発ビル", short: "新宿", lat: 35.6938, lng: 139.7034, color: "#7c3aed", workers: 28, progress: 23 },
  { name: "川崎物流センター", short: "川崎", lat: 35.5308, lng: 139.7029, color: "#dc2626", workers: 38, progress: 55 },
];

function siteIcon(site: Site): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;flex-direction:column;align-items:center;pointer-events:none">
      <span style="width:14px;height:14px;border-radius:50%;background:${site.color};border:2px solid #fff;box-shadow:0 0 0 4px ${site.color}33,0 1px 4px rgba(0,0,0,.35)"></span>
      <span style="margin-top:3px;font-size:10px;font-weight:600;color:#374151;background:rgba(255,255,255,.92);padding:1px 6px;border-radius:6px;white-space:nowrap;box-shadow:0 1px 2px rgba(0,0,0,.18)">${site.short}</span>
    </div>`,
    iconSize: [72, 40],
    iconAnchor: [36, 9],
    popupAnchor: [0, -8],
  });
}

export default function DashboardSiteMap({ height = "100%" }: { height?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [35.57, 139.7],
      zoom: 10,
      zoomControl: false,
      scrollWheelZoom: false,
    });
    mapRef.current = map;
    map.attributionControl.setPrefix(false);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: "topright" }).addTo(map);

    SITES.forEach((s) => {
      const marker = L.marker([s.lat, s.lng], { icon: siteIcon(s) }).addTo(map);
      marker.bindPopup(
        `<div style="min-width:150px;font-family:sans-serif">
          <p style="font-weight:700;font-size:13px;margin:0 0 4px;color:#0f172a">${s.name}</p>
          <p style="font-size:12px;color:#1a56db;margin:2px 0;font-weight:600">進捗 ${s.progress}%</p>
          <p style="font-size:12px;color:#6b7280;margin:2px 0">作業員 ${s.workers}名</p>
        </div>`,
      );
    });

    const bounds = L.latLngBounds(SITES.map((s) => [s.lat, s.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [34, 34], maxZoom: 12 });

    // Card layout may settle after mount — recompute tile sizing once.
    const t = setTimeout(() => map.invalidateSize(), 0);

    return () => {
      clearTimeout(t);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return <div ref={containerRef} style={{ height, width: "100%" }} />;
}
