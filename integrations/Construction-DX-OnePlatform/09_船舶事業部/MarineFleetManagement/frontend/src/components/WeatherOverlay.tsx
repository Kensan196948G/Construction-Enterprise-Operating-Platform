import clsx from 'clsx';

interface Props {
  windSpeedMps?: number | null;
  windDirectionDeg?: number | null;
  waveHeightM?: number | null;
  visibilityKm?: number | null;
}

function waveLevel(h?: number | null): { label: string; tone: string } {
  if (h == null) return { label: '不明', tone: 'bg-gray-300' };
  if (h < 1.5) return { label: '穏やか', tone: 'bg-marine-ok' };
  if (h < 3.0) return { label: 'やや高い', tone: 'bg-marine-warn' };
  if (h < 4.5) return { label: '高い', tone: 'bg-marine-warn text-white' };
  return { label: '時化', tone: 'bg-marine-danger text-white' };
}

export function WeatherOverlay({
  windSpeedMps,
  windDirectionDeg,
  waveHeightM,
  visibilityKm,
}: Props) {
  const wave = waveLevel(waveHeightM);
  return (
    <div className="rounded border bg-white p-3 shadow-sm text-xs space-y-1">
      <div className="font-bold text-marine-primary mb-1">海象</div>
      <div>
        風: {windSpeedMps?.toFixed(1) ?? '--'} m/s @{' '}
        {windDirectionDeg != null ? `${windDirectionDeg.toFixed(0)}°` : '--'}
      </div>
      <div>
        波高: {waveHeightM?.toFixed(2) ?? '--'} m{' '}
        <span className={clsx('inline-block rounded px-1 ml-1', wave.tone)}>{wave.label}</span>
      </div>
      <div>視程: {visibilityKm?.toFixed(1) ?? '--'} km</div>
    </div>
  );
}
