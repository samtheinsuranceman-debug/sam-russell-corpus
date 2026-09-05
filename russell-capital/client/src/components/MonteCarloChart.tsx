import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { MonteCarloResult, PercentileBand } from "@shared/monteCarloEngine";

const fmt = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : n >= 1_000
      ? `$${(n / 1_000).toFixed(0)}K`
      : `$${n.toLocaleString()}`;

interface MonteCarloChartProps {
  result: MonteCarloResult;
  title?: string;
  subtitle?: string;
  /** Show sample simulation paths */
  showPaths?: boolean;
  /** Target value reference line */
  targetValue?: number;
  targetLabel?: string;
  className?: string;
}

/**
 * MonteCarloChart — Reusable confidence band visualization for Monte Carlo simulations.
 *
 * Displays:
 * - Shaded confidence bands (10th-90th, 25th-75th percentile)
 * - Median (50th percentile) line
 * - Optional sample simulation paths
 * - Summary statistics panel
 * - Interactive scenario toggle (best/expected/worst)
 */
export function MonteCarloChart({
  result,
  title = "Monte Carlo Projection",
  subtitle,
  showPaths = false,
  targetValue,
  targetLabel,
  className = "",
}: MonteCarloChartProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [activeScenario, setActiveScenario] = useState<"all" | "best" | "expected" | "worst">("all");

  const { bands, summary, samplePaths } = result;

  // Prepare chart data based on active scenario
  const chartData = useMemo(() => {
    return bands.map((b) => ({
      year: b.year,
      // Full range (10th-90th)
      range: [b.p10, b.p90],
      // Inner range (25th-75th)
      innerRange: [b.p25, b.p75],
      median: b.p50,
      mean: b.mean,
      p10: b.p10,
      p25: b.p25,
      p75: b.p75,
      p90: b.p90,
    }));
  }, [bands]);

  const scenarioValue = activeScenario === "best"
    ? summary.p90
    : activeScenario === "worst"
      ? summary.p10
      : summary.median;

  return (
    <Card className={`bg-zinc-900/80 border-zinc-700/50 ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              {title}
            </CardTitle>
            {subtitle && (
              <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          <Badge
            variant="outline"
            className="text-xs border-purple-500/40 text-purple-400 bg-purple-500/10"
          >
            {result.config.simulations?.toLocaleString() || "1,000"} simulations
          </Badge>
        </div>

        {/* Scenario toggles */}
        <div className="flex gap-1.5 mt-3">
          {(["all", "best", "expected", "worst"] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={activeScenario === s ? "default" : "outline"}
              className={`text-xs h-7 ${
                activeScenario === s
                  ? s === "best"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : s === "worst"
                      ? "bg-red-600 hover:bg-red-700"
                      : s === "expected"
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-purple-600 hover:bg-purple-700"
                  : "border-zinc-700/50"
              }`}
              onClick={() => setActiveScenario(s)}
            >
              {s === "all" ? "All Bands" : s === "best" ? "Best Case" : s === "expected" ? "Expected" : "Worst Case"}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary stats row */}
        <div className="grid grid-cols-4 gap-2">
          <div className="px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-1 mb-0.5">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span className="text-[10px] text-zinc-400 uppercase">Best (90th)</span>
            </div>
            <span className="text-sm font-bold text-emerald-400">{fmt(summary.p90)}</span>
          </div>
          <div className="px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center gap-1 mb-0.5">
              <BarChart3 className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] text-zinc-400 uppercase">Median</span>
            </div>
            <span className="text-sm font-bold text-blue-400">{fmt(summary.median)}</span>
          </div>
          <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-center gap-1 mb-0.5">
              <TrendingDown className="w-3 h-3 text-red-400" />
              <span className="text-[10px] text-zinc-400 uppercase">Worst (10th)</span>
            </div>
            <span className="text-sm font-bold text-red-400">{fmt(summary.p10)}</span>
          </div>
          <div className="px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <div className="flex items-center gap-1 mb-0.5">
              <Activity className="w-3 h-3 text-purple-400" />
              <span className="text-[10px] text-zinc-400 uppercase">Success</span>
            </div>
            <span className="text-sm font-bold text-purple-400">{summary.probabilityOfSuccess}%</span>
          </div>
        </div>

        {/* Chart */}
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="mcOuterBand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0.03} />
                </linearGradient>
                <linearGradient id="mcInnerBand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.08} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis
                dataKey="year"
                stroke="#71717a"
                tick={{ fill: "#a1a1aa", fontSize: 11 }}
                label={{ value: "Year", position: "insideBottom", offset: -2, fill: "#71717a", fontSize: 11 }}
              />
              <YAxis
                stroke="#71717a"
                tick={{ fill: "#a1a1aa", fontSize: 11 }}
                tickFormatter={(v: number) => fmt(v)}
                width={70}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #3f3f46",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: any, name: string) => {
                  if (Array.isArray(value)) return [value.map(fmt).join(" – "), name];
                  return [fmt(value as number), name];
                }}
                labelFormatter={(label: number) => `Year ${label}`}
              />

              {/* Outer band (10th-90th) */}
              {(activeScenario === "all" || activeScenario === "worst" || activeScenario === "best") && (
                <>
                  <Area
                    type="monotone"
                    dataKey="p90"
                    stroke="none"
                    fill="url(#mcOuterBand)"
                    fillOpacity={1}
                    name="90th Percentile"
                  />
                  <Area
                    type="monotone"
                    dataKey="p10"
                    stroke="none"
                    fill="#18181b"
                    fillOpacity={1}
                    name="10th Percentile"
                  />
                </>
              )}

              {/* Inner band (25th-75th) */}
              {activeScenario === "all" && (
                <>
                  <Area
                    type="monotone"
                    dataKey="p75"
                    stroke="none"
                    fill="url(#mcInnerBand)"
                    fillOpacity={1}
                    name="75th Percentile"
                  />
                  <Area
                    type="monotone"
                    dataKey="p25"
                    stroke="none"
                    fill="#18181b"
                    fillOpacity={1}
                    name="25th Percentile"
                  />
                </>
              )}

              {/* Median line */}
              <Area
                type="monotone"
                dataKey="median"
                stroke="#8b5cf6"
                strokeWidth={2}
                fill="none"
                name="Median (50th)"
                dot={false}
              />

              {/* Mean line */}
              <Area
                type="monotone"
                dataKey="mean"
                stroke="#6366f1"
                strokeWidth={1}
                strokeDasharray="4 4"
                fill="none"
                name="Mean"
                dot={false}
              />

              {/* Target reference line */}
              {targetValue && (
                <ReferenceLine
                  y={targetValue}
                  stroke="#f59e0b"
                  strokeDasharray="6 3"
                  label={{
                    value: targetLabel || `Target: ${fmt(targetValue)}`,
                    fill: "#f59e0b",
                    fontSize: 11,
                    position: "right",
                  }}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Expandable details */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-300 transition-colors"
        >
          <Info className="w-3 h-3" />
          {showDetails ? "Hide" : "Show"} Detailed Statistics
          {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {showDetails && (
          <div className="space-y-3 pt-2 border-t border-zinc-700/30">
            {/* Probability analysis */}
            <div>
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Probability Analysis
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/30">
                  <span className="text-[10px] text-zinc-500">Probability of staying above $0</span>
                  <div className="text-sm font-bold text-white">{summary.probabilityOfSuccess}%</div>
                </div>
                <div className="px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700/30">
                  <span className="text-[10px] text-zinc-500">Probability of growth</span>
                  <div className="text-sm font-bold text-white">{summary.probabilityAboveTarget}%</div>
                </div>
              </div>
            </div>

            {/* Percentile table */}
            <div>
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Final Year Percentile Distribution
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-zinc-700/30">
                      <th className="text-left py-1.5 text-zinc-400 font-medium">Percentile</th>
                      <th className="text-right py-1.5 text-zinc-400 font-medium">Value</th>
                      <th className="text-right py-1.5 text-zinc-400 font-medium">Growth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: "90th (Best)", value: summary.p90, color: "text-emerald-400" },
                      { label: "Median", value: summary.median, color: "text-blue-400" },
                      { label: "Mean", value: summary.mean, color: "text-indigo-400" },
                      { label: "10th (Worst)", value: summary.p10, color: "text-red-400" },
                    ].map((row) => (
                      <tr key={row.label} className="border-b border-zinc-800/50">
                        <td className="py-1.5 text-zinc-300">{row.label}</td>
                        <td className={`py-1.5 text-right font-medium ${row.color}`}>{fmt(row.value)}</td>
                        <td className="py-1.5 text-right text-zinc-400">
                          {result.config.initialValue > 0
                            ? `${(((row.value - result.config.initialValue) / result.config.initialValue) * 100).toFixed(1)}%`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Configuration summary */}
            <div>
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Simulation Parameters
              </h4>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { label: "Expected Return", value: `${(result.config.expectedReturn * 100).toFixed(1)}%` },
                  { label: "Volatility", value: `${(result.config.volatility * 100).toFixed(1)}%` },
                  { label: "Years", value: String(result.config.years) },
                  { label: "Initial Value", value: fmt(result.config.initialValue) },
                  ...(result.config.annualContribution ? [{ label: "Annual Contribution", value: fmt(result.config.annualContribution) }] : []),
                  ...(result.config.floorReturn !== undefined ? [{ label: "Floor", value: `${(result.config.floorReturn * 100).toFixed(1)}%` }] : []),
                  ...(result.config.capReturn !== undefined ? [{ label: "Cap", value: `${(result.config.capReturn * 100).toFixed(1)}%` }] : []),
                ].map((item) => (
                  <div key={item.label} className="px-2 py-1 rounded bg-zinc-800/50 text-center">
                    <div className="text-[9px] text-zinc-500">{item.label}</div>
                    <div className="text-xs font-medium text-zinc-300">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Compact inline version ───────────────────────────────────────────────────

interface MonteCarloInlineProps {
  result: MonteCarloResult;
  className?: string;
}

/**
 * MonteCarloInline — Compact summary badge for embedding in any calculator.
 * Shows median, range, and success probability in a single line.
 */
export function MonteCarloInline({ result, className = "" }: MonteCarloInlineProps) {
  const { summary } = result;
  return (
    <div className={`inline-flex items-center gap-3 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 ${className}`}>
      <div className="flex items-center gap-1">
        <Activity className="w-3 h-3 text-purple-400" />
        <span className="text-[10px] text-zinc-400 uppercase">Monte Carlo</span>
      </div>
      <div className="h-3 w-px bg-zinc-700" />
      <span className="text-xs text-zinc-300">
        Median: <strong className="text-blue-400">{fmt(summary.median)}</strong>
      </span>
      <span className="text-xs text-zinc-300">
        Range: <strong className="text-zinc-200">{fmt(summary.p10)}</strong> – <strong className="text-zinc-200">{fmt(summary.p90)}</strong>
      </span>
      <span className="text-xs text-zinc-300">
        Success: <strong className="text-emerald-400">{summary.probabilityOfSuccess}%</strong>
      </span>
    </div>
  );
}
