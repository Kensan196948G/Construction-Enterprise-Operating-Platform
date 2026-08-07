import {
  Area,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

export type ForecastPoint = {
  ds: string;
  yhat: number;
  yhat_lower: number;
  yhat_upper: number;
};

type Props = {
  data: ForecastPoint[];
  title?: string;
};

export default function ForecastChart({ data, title }: Props) {
  return (
    <div className="rounded-lg bg-white shadow-sm p-4">
      {title && <h3 className="text-sm font-semibold mb-2">{title}</h3>}
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="ds" />
          <YAxis />
          <Tooltip />
          {/* 信頼区間を Area で表現 */}
          <Area
            type="monotone"
            dataKey="yhat_upper"
            stroke="#bae6fd"
            fill="#e0f2fe"
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="yhat_lower"
            stroke="#bae6fd"
            fill="#ffffff"
            isAnimationActive={false}
          />
          <Line type="monotone" dataKey="yhat" stroke="#0ea5e9" dot={false} strokeWidth={2} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
