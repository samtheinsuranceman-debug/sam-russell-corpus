import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from "recharts";
import { TrendingUp, Target, Zap } from "lucide-react";

interface StrategyPerformanceProps {
  strategies: Array<{
    id: number;
    clientName?: string;
    type?: string;
    createdAt?: string | Date;
    totalTaxSaved?: number;
    rothGrowth?: number;
    iulCashValue?: number;
  }>;
}

const fmt = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${(n / 1_000).toFixed(0)}K` : `$${n.toFixed(0)}`;

export function StrategyPerformanceTracker({ strategies }: StrategyPerformanceProps) {
  const chartData = useMemo(() => {
    // Group strategies by month
    const monthMap: Record<string, { count: number; totalSaved: number; avgGrowth: number }> = {};
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      monthMap[key] = { count: 0, totalSaved: 0, avgGrowth: 0 };
    }

    strategies.forEach((s) => {
      const date = s.createdAt ? new Date(s.createdAt) : new Date();
      const key = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      if (monthMap[key]) {
        monthMap[key].count += 1;
        monthMap[key].totalSaved += s.totalTaxSaved ?? 0;
        monthMap[key].avgGrowth += s.rothGrowth ?? 0;
      }
    });

    return Object.entries(monthMap).map(([month, data]) => ({
      month,
      strategies: data.count,
      taxSaved: data.totalSaved,
      growth: data.avgGrowth,
    }));
  }, [strategies]);

  const totals = useMemo(() => {
    const totalSaved = strategies.reduce((s, st) => s + (st.totalTaxSaved ?? 0), 0);
    const totalGrowth = strategies.reduce((s, st) => s + (st.rothGrowth ?? 0), 0);
    const totalCashValue = strategies.reduce((s, st) => s + (st.iulCashValue ?? 0), 0);
    return { totalSaved, totalGrowth, totalCashValue, count: strategies.length };
  }, [strategies]);

  return (
    <div className="rc-card">
      <div className="flex items-center gap-2 mb-4">
        <Target size={18} className="text-[#a78bfa]" />
        <h3 className="text-white font-bold">Strategy Performance Tracker</h3>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="p-3 rounded-xl bg-[#0f1e35] border border-[#12233e]">
          <div className="text-[10px] text-[#7a95b8] uppercase tracking-wider">Strategies Run</div>
          <div className="text-xl font-bold text-white mt-1">{totals.count}</div>
        </div>
        <div className="p-3 rounded-xl bg-[#0f1e35] border border-[#12233e]">
          <div className="text-[10px] text-[#7a95b8] uppercase tracking-wider">Total Tax Saved</div>
          <div className="text-xl font-bold text-[#22c55e] mt-1">{fmt(totals.totalSaved)}</div>
        </div>
        <div className="p-3 rounded-xl bg-[#0f1e35] border border-[#12233e]">
          <div className="text-[10px] text-[#7a95b8] uppercase tracking-wider">Roth Growth</div>
          <div className="text-xl font-bold text-[#a78bfa] mt-1">{fmt(totals.totalGrowth)}</div>
        </div>
        <div className="p-3 rounded-xl bg-[#0f1e35] border border-[#12233e]">
          <div className="text-[10px] text-[#7a95b8] uppercase tracking-wider">IUL Cash Value</div>
          <div className="text-xl font-bold text-[#f0c040] mt-1">{fmt(totals.totalCashValue)}</div>
        </div>
      </div>

      {/* Monthly trend chart */}
      <div className="mb-4">
        <h4 className="text-xs text-[#7a95b8] mb-2">Monthly Strategy Activity</h4>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
            <XAxis dataKey="month" tick={{ fill: "#7a95b8", fontSize: 10 }} />
            <YAxis tick={{ fill: "#7a95b8", fontSize: 10 }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#0b1628", border: "1px solid #1a3055", borderRadius: "8px" }}
              labelStyle={{ color: "#7a95b8" }}
            />
            <Bar dataKey="strategies" fill="#a78bfa" radius={[4, 4, 0, 0]} name="Strategies" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tax savings trend */}
      <div>
        <h4 className="text-xs text-[#7a95b8] mb-2">Cumulative Tax Savings</h4>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
            <XAxis dataKey="month" tick={{ fill: "#7a95b8", fontSize: 10 }} />
            <YAxis tick={{ fill: "#7a95b8", fontSize: 10 }} tickFormatter={(v) => fmt(v)} />
            <Tooltip
              contentStyle={{ backgroundColor: "#0b1628", border: "1px solid #1a3055", borderRadius: "8px" }}
              labelStyle={{ color: "#7a95b8" }}
              formatter={(v: number) => [fmt(v), ""]}
            />
            <Line type="monotone" dataKey="taxSaved" stroke="#22c55e" strokeWidth={2} dot={{ fill: "#22c55e", r: 3 }} name="Tax Saved" />
            <Line type="monotone" dataKey="growth" stroke="#a78bfa" strokeWidth={2} dot={{ fill: "#a78bfa", r: 3 }} name="Growth" />
            <Legend wrapperStyle={{ fontSize: "10px", color: "#7a95b8" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
