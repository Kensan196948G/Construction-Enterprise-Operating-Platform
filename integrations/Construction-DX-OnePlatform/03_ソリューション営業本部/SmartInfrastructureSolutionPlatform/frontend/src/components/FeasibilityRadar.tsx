import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface Props {
  technical: number;
  legal: number;
  environment: number;
  business: number;
}

export default function FeasibilityRadar({ technical, legal, environment, business }: Props) {
  const data = [
    { axis: '技術', score: technical },
    { axis: '法務', score: legal },
    { axis: '環境', score: environment },
    { axis: '事業性', score: business },
  ];
  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="axis" />
        <PolarRadiusAxis angle={90} domain={[0, 100]} />
        <Tooltip />
        <Radar name="スコア" dataKey="score" stroke="#1e3a8a" fill="#1e3a8a" fillOpacity={0.5} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
