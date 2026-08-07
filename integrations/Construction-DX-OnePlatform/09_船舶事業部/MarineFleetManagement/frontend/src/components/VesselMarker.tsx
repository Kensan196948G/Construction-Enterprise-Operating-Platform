import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

interface Props {
  vesselId: number;
  vesselName: string;
  vesselType?: string;
  lat: number;
  lon: number;
  speedKnots?: number | null;
  heading?: number | null;
}

const COLOR_BY_TYPE: Record<string, string> = {
  作業船: '#0284c7',
  曳船: '#2563eb',
  起重機船: '#7c3aed',
  浚渫船: '#ca8a04',
  台船: '#475569',
};

function shipIcon(color: string, heading: number): L.DivIcon {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28"
         style="transform: rotate(${heading}deg);">
      <path d="M12 2 L18 20 L12 16 L6 20 Z" fill="${color}" stroke="#fff" stroke-width="1"/>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: 'vessel-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

export function VesselMarker({
  vesselId,
  vesselName,
  vesselType,
  lat,
  lon,
  speedKnots,
  heading,
}: Props) {
  const color = COLOR_BY_TYPE[vesselType ?? '作業船'] ?? '#0284c7';
  const hdg = typeof heading === 'number' ? heading : 0;
  return (
    <Marker position={[lat, lon]} icon={shipIcon(color, hdg)}>
      <Popup>
        <div className="text-xs">
          <div className="font-bold">{vesselName}</div>
          <div>ID: {vesselId}</div>
          {vesselType && <div>船種: {vesselType}</div>}
          {typeof speedKnots === 'number' && <div>速度: {speedKnots} kn</div>}
          {typeof heading === 'number' && <div>針路: {heading.toFixed(0)}°</div>}
        </div>
      </Popup>
    </Marker>
  );
}
