import { useEffect, useState } from 'react';
import { apiClient } from '@/api/client';
import { WeatherOverlay } from '@/components/WeatherOverlay';

interface Forecast {
  area_code: string;
  issued_at: string;
  wind_speed_mps: number | null;
  wind_direction_deg: number | null;
  wave_height_m: number | null;
  visibility_km: number | null;
  source: string;
}

interface Observation {
  time: string;
  station_code: string;
  wind_speed_mps: number | null;
  wave_height_m: number | null;
  source: string;
}

const AREAS: Array<{ code: string; name: string }> = [
  { code: '130000', name: '東京' },
  { code: '140000', name: '神奈川 (横浜)' },
  { code: '230000', name: '愛知 (名古屋)' },
  { code: '270000', name: '大阪' },
  { code: '400000', name: '福岡' },
];

export default function WeatherPage() {
  const [area, setArea] = useState('130000');
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [obs, setObs] = useState<Observation[]>([]);

  useEffect(() => {
    apiClient
      .get<Forecast>('/weather/forecast', { params: { area_code: area } })
      .then((r) => setForecast(r.data))
      .catch(() => {});
    apiClient
      .get<Observation[]>('/weather/observations')
      .then((r) => setObs(r.data))
      .catch(() => {});
  }, [area]);

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-bold">海象</h2>
        <select
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="rounded border px-2 py-1 text-sm"
        >
          {AREAS.map((a) => (
            <option key={a.code} value={a.code}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {forecast && (
          <div className="space-y-1">
            <h3 className="text-sm font-bold">予報 (出典: {forecast.source})</h3>
            <WeatherOverlay
              windSpeedMps={forecast.wind_speed_mps}
              windDirectionDeg={forecast.wind_direction_deg}
              waveHeightM={forecast.wave_height_m}
              visibilityKm={forecast.visibility_km}
            />
            <div className="text-xs text-gray-500">発表時刻: {forecast.issued_at}</div>
          </div>
        )}
        <div className="rounded border bg-white p-3 shadow-sm">
          <h3 className="text-sm font-bold mb-2">直近観測 ({obs.length} 件)</h3>
          <table className="min-w-full text-xs">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-1">時刻</th>
                <th>観測点</th>
                <th>風 m/s</th>
                <th>波高 m</th>
              </tr>
            </thead>
            <tbody>
              {obs.slice(0, 20).map((o, i) => (
                <tr key={i} className="border-t">
                  <td className="py-1">{o.time}</td>
                  <td>{o.station_code}</td>
                  <td>{o.wind_speed_mps ?? '—'}</td>
                  <td>{o.wave_height_m ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
