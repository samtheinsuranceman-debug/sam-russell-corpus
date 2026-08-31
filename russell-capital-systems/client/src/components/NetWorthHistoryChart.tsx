import { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface NetWorthHistoryChartProps {
  client: {
    iraBalance?: string | number | null;
    rothBalance?: string | number | null;
    taxableAssets?: string | number | null;
    realEstateEquity?: string | number | null;
    lifeInsuranceCv?: string | number | null;
    income?: string | number | null;
  };
}

const fmt = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : n >= 1_000 ? `$${(n / 1_000).toFixed(0)}K` : `$${n.toFixed(0)}`;

export function NetWorthHistoryChart({ client }: NetWorthHistoryChartProps) {
  const data = useMemo(() => {
    const currentNW =
      Number(client.iraBalance ?? 0) +
      Number(client.rothBalance ?? 0) +
      Number(client.taxableAssets ?? 0) +
      Number(client.realEstateEquity ?? 0) +
      Number(client.lifeInsuranceCv ?? 0);

    const income = Number(client.income ?? 0);
    const savingsRate = 0.15; // Assume 15% savings rate
    const growthRate = 0.07; // 7% annual growth

    // Project backwards 5 years and forward 5 years
    const points: { year: string; netWorth: number; projected?: boolean }[] = [];

    for (let y = -5; y <= 5; y++) {
      const factor = y <= 0
        ? Math.pow(1 + growthRate, y) // Discount backwards
        : Math.pow(1 + growthRate, y); // Grow forward

      const savings = y <= 0 ? 0 : income * savingsRate * y;
      const nw = currentNW * factor + savings;

      points.push({
        year: y === 0 ? "Now" : y < 0 ? `${Math.abs(y)}Y ago` : `+${y}Y`,
        netWorth: Math.round(Math.max(0, nw)),
        projected: y > 0,
      });
    }

    return points;
  }, [client]);

  return (
    <div className="rc-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Net Worth Trajectory</h3>
        <span className="text-xs text-[#7a95b8]">Estimated 10-year view</span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
          <XAxis dataKey="year" tick={{ fill: "#7a95b8", fontSize: 10 }} />
          <YAxis tick={{ fill: "#7a95b8", fontSize: 10 }} tickFormatter={(v) => fmt(v)} />
          <Tooltip
            contentStyle={{ backgroundColor: "#0b1628", border: "1px solid #1a3055", borderRadius: "8px" }}
            labelStyle={{ color: "#7a95b8" }}
            formatter={(v: number) => [fmt(v), "Net Worth"]}
          />
          <Area
            type="monotone"
            dataKey="netWorth"
            stroke="#22c55e"
            fill="url(#nwGrad)"
            strokeWidth={2}
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              if (payload.year === "Now") {
                return (
                  <circle cx={cx} cy={cy} r={5} fill="#22c55e" stroke="#0b1628" strokeWidth={2} />
                );
              }
              return <circle cx={cx} cy={cy} r={0} />;
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
