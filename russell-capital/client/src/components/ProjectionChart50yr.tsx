import { useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface ProjectionDataPoint {
  year: number;
  [key: string]: number;
}

interface SeriesConfig {
  key: string;
  label: string;
  color: string;
  type?: "area" | "line";
}

interface ProjectionChart50yrProps {
  data: ProjectionDataPoint[];
  series: SeriesConfig[];
  title?: string;
  height?: number;
}

function formatAxisValue(value: number): string {
  if (Math.abs(value) >= 1_000_000) return "$" + (value / 1_000_000).toFixed(1) + "M";
  if (Math.abs(value) >= 1_000) return "$" + (value / 1_000).toFixed(0) + "K";
  return "$" + value.toFixed(0);
}

function formatTooltipValue(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ProjectionChart50yr({
  data,
  series,
  title = "50-Year Projection",
  height = 400,
}: ProjectionChart50yrProps) {
  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 mt-6">
      <h3 className="text-lg font-bold text-emerald-400 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={`grad-${s.key}`} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={s.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={s.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="year"
            stroke="#94a3b8"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            label={{ value: "Year", position: "insideBottomRight", offset: -5, fill: "#94a3b8" }}
          />
          <YAxis
            stroke="#94a3b8"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            tickFormatter={formatAxisValue}
            width={70}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "1px solid #475569",
              borderRadius: "8px",
              color: "#e2e8f0",
            }}
            formatter={(value: number, name: string) => [formatTooltipValue(value), name]}
            labelFormatter={(label) => `Year ${label}`}
          />
          <Legend wrapperStyle={{ color: "#e2e8f0", fontSize: 12 }} />
          {series.map((s) =>
            s.type === "line" ? (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ) : (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2}
                fill={`url(#grad-${s.key})`}
                dot={false}
                activeDot={{ r: 4 }}
              />
            )
          )}
        </ComposedChart>
      </ResponsiveContainer>
      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
        {series.map((s) => {
          const lastPoint = data[data.length - 1];
          const firstPoint = data[0];
          if (!lastPoint || !firstPoint) return null;
          const endVal = lastPoint[s.key] ?? 0;
          const startVal = firstPoint[s.key] ?? 0;
          const growth = startVal > 0 ? ((endVal - startVal) / startVal * 100).toFixed(0) : "N/A";
          return (
            <div key={s.key} className="bg-slate-900/60 rounded-lg p-3 border border-slate-700/50">
              <div className="text-xs text-slate-400 mb-1">{s.label} (Yr 50)</div>
              <div className="text-sm font-bold" style={{ color: s.color }}>
                {formatTooltipValue(endVal)}
              </div>
              {growth !== "N/A" && (
                <div className="text-xs text-emerald-400/80 mt-0.5">+{growth}% growth</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Helper: generate generic 50-year compound growth projection ──
export function generate50YrProjection(
  initialValue: number,
  annualGrowthRate: number,
  annualContribution: number = 0,
  comparisonValue?: number,
  comparisonGrowthRate?: number,
): ProjectionDataPoint[] {
  const data: ProjectionDataPoint[] = [];
  let primary = initialValue;
  let comparison = comparisonValue ?? initialValue;
  for (let yr = 0; yr <= 50; yr++) {
    const point: ProjectionDataPoint = {
      year: yr,
      primary: Math.round(primary),
    };
    if (comparisonValue !== undefined) {
      point.comparison = Math.round(comparison);
    }
    data.push(point);
    primary = (primary + annualContribution) * (1 + annualGrowthRate);
    if (comparisonValue !== undefined) {
      comparison = comparison * (1 + (comparisonGrowthRate ?? annualGrowthRate * 0.6));
    }
  }
  return data;
}
