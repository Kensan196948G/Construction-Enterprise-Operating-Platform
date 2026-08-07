import { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { cn } from '../utils/cn';

export type ChartKind = 'line' | 'bar' | 'pie';

export interface ChartSeries {
  /** 系列キー (data 内のフィールド名) */
  dataKey: string;
  /** 日本語ラベル */
  name?: string;
  /** 色 (省略でパレットから自動) */
  color?: string;
}

export interface ChartWrapperProps {
  /** チャート種別 */
  type: ChartKind;
  /** データ配列 */
  data: Array<Record<string, unknown>>;
  /** X軸キー (line/bar の場合) または name キー (pie の場合) */
  xKey: string;
  /** 系列定義 (pie の場合は1系列だけ使用) */
  series: ChartSeries[];
  /** 高さ (px or %) */
  height?: number | string;
  /** タイトル (aria 用にも使用) */
  title?: string;
  /** 凡例表示 */
  showLegend?: boolean;
  /** グリッド表示 (line/bar) */
  showGrid?: boolean;
  /** 追加クラス */
  className?: string;
}

const DEFAULT_PALETTE = [
  '#f97316', // primary
  '#0284c7', // secondary
  '#eab308', // accent
  '#16a34a', // success
  '#dc2626', // danger
  '#8b5cf6',
  '#10b981',
  '#3b82f6',
];

/**
 * Recharts の薄いラッパー。LineChart / BarChart / PieChart を切替できる。
 * 軸/凡例ラベルは日本語前提。
 */
export function ChartWrapper(props: ChartWrapperProps): JSX.Element {
  const {
    type,
    data,
    xKey,
    series,
    height = 320,
    title,
    showLegend = true,
    showGrid = true,
    className,
  } = props;

  const colored = useMemo(
    () =>
      series.map((s, i) => ({
        ...s,
        color: s.color ?? DEFAULT_PALETTE[i % DEFAULT_PALETTE.length],
      })),
    [series],
  );

  return (
    <div
      className={cn('w-full cdx-card p-4', className)}
      role="figure"
      aria-label={title ?? 'チャート'}
    >
      {title && <h3 className="text-sm font-semibold text-slate-700 mb-2">{title}</h3>}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          {type === 'line' ? (
            <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
              <XAxis dataKey={xKey} stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip />
              {showLegend && <Legend />}
              {colored.map((s) => (
                <Line
                  key={s.dataKey}
                  type="monotone"
                  dataKey={s.dataKey}
                  name={s.name ?? s.dataKey}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          ) : type === 'bar' ? (
            <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
              <XAxis dataKey={xKey} stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip />
              {showLegend && <Legend />}
              {colored.map((s) => (
                <Bar
                  key={s.dataKey}
                  dataKey={s.dataKey}
                  name={s.name ?? s.dataKey}
                  fill={s.color}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          ) : (
            <PieChart>
              <Tooltip />
              {showLegend && <Legend />}
              <Pie
                data={data}
                dataKey={colored[0]?.dataKey ?? 'value'}
                nameKey={xKey}
                cx="50%"
                cy="50%"
                outerRadius="75%"
                label
              >
                {data.map((_, idx) => (
                  <Cell
                    key={`cell-${idx}`}
                    fill={DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
