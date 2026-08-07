import { useEffect, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { VesselMarker } from '@/components/VesselMarker';
import { WeatherOverlay } from '@/components/WeatherOverlay';
import { apiClient } from '@/api/client';

interface Vessel {
  id: number;
  vessel_name: string;
  vessel_type: string;
  mmsi?: string | null;
}

interface VesselWithPos extends Vessel {
  lat?: number;
  lon?: number;
  speed_knots?: number | null;
  heading_deg?: number | null;
}

interface Forecast {
  area_code: string;
  wind_speed_mps: number | null;
  wind_direction_deg: number | null;
  wave_height_m: number | null;
  visibility_km: number | null;
}

// 東京湾を初期表示 (海上工事の中心海域)
const DEFAULT_CENTER: [number, number] = [35.45, 139.7];

export default function FleetMapPage() {
  const [vessels, setVessels] = useState<VesselWithPos[]>([]);
  const [forecast, setForecast] = useState<Forecast | null>(null);

  useEffect(() => {
    apiClient
      .get<Vessel[]>('/vessels')
      .then((r) => setVessels(r.data.map((v) => ({ ...v }))))
      .catch(() => {});
    apiClient
      .get<Forecast>('/weather/forecast', { params: { area_code: '130000' } })
      .then((r) => setForecast(r.data))
      .catch(() => {});
  }, []);

  return (
    <section>
      <h2 className="mb-4 text-xl font-bold">海図 (Leaflet)</h2>
      <div className="relative h-[600px] rounded border bg-white shadow-sm overflow-hidden">
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={9}
          scrollWheelZoom
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {vessels
            .filter((v) => typeof v.lat === 'number' && typeof v.lon === 'number')
            .map((v) => (
              <VesselMarker
                key={v.id}
                vesselId={v.id}
                vesselName={v.vessel_name}
                vesselType={v.vessel_type}
                lat={v.lat!}
                lon={v.lon!}
                speedKnots={v.speed_knots}
                heading={v.heading_deg}
              />
            ))}
        </MapContainer>
        {forecast && (
          <div className="absolute right-3 top-3 z-[1000] w-56">
            <WeatherOverlay
              windSpeedMps={forecast.wind_speed_mps}
              windDirectionDeg={forecast.wind_direction_deg}
              waveHeightM={forecast.wave_height_m}
              visibilityKm={forecast.visibility_km}
            />
          </div>
        )}
      </div>
      <p className="mt-2 text-xs text-gray-500">
        ※ 船位は AIS/GPS が未連携の場合は表示されません。AIS 受信機 → /ais/decode で投入。
      </p>
    </section>
  );
}
