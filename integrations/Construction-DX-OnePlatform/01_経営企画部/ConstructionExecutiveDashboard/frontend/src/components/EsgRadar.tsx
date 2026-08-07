import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts';

type Props = {
  environment: number;
  social: number;
  governance: number;
};

export default function EsgRadar({ environment, social, governance }: Props) {
  const data = [
    { axis: '環境 (E)', score: environment },
    { axis: '社会 (S)', score: social },
    { axis: 'ガバナンス (G)', score: governance },
  ];
  return (
    <div className="rounded-lg bg-white shadow-sm p-4">
      <h3 className="text-sm font-semibold mb-2">ESG スコアレーダー</h3>
      <ResponsiveContainer width="100%" height={260}>
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="axis" />
          <PolarRadiusAxis domain={[0, 100]} />
          <Radar name="score" dataKey="score" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.4} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
