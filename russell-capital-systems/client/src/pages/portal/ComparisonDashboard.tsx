// @ts-nocheck
import { useState, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import {
  useStrategy,
  STRATEGY_LABELS,
  STRATEGY_PATHS,
  type StrategyType,
  type ComparisonSlot,
} from "@/contexts/StrategyContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GitCompare,
  Trash2,
  TrendingUp,
  DollarSign,
  Zap,
  Trophy,
  Target,
  Wallet,
  PiggyBank,
  Building2,
  Heart,
  Banknote,
  Scale,
  ChevronRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { toast } from "sonner";
import { useLocation } from "wouter";

const fmt = (n: number) => {
  if (!n || isNaN(n)) return "$0";
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
};

const SLOT_COLORS = ["#22c55e", "#3b82f6", "#a855f7", "#f59e0b", "#ef4444"];

const METRIC_ICONS = {
  "Net Positive": TrendingUp,
  "Interest Paid": Wallet,
  "Interest Saved": PiggyBank,
  "Equity Built": Building2,
  "Tax Savings": Scale,
  "Cash Value": Banknote,
  "Death Benefit": Heart,
  "Income Generated": DollarSign,
  "Opportunity Cost": Target,
};

const ALL_STRATEGY_TYPES: StrategyType[] = [
  "mortgage-killer", "iul-projection", "roth-conversion", "myga-waterfall",
  "tax-waterfall", "retirement-income", "premium-financing", "real-estate-mogul",
  "social-security", "annuity-income", "estate-tax", "fia-collateral",
  "hot-income", "time-machine", "lifetime-income", "dynamic-tax",
  "black-mirror", "endgame", "inflation-analysis", "advisor-income",
];

export default function ComparisonDashboard() {
  const {
    comparisonSlots,
    setComparisonSlot,
    clearComparisonSlot,
    clearAllComparisons,
    getComparisonSummaries,
    activeStrategies,
    results,
  } = useStrategy();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");

  const summaries = getComparisonSummaries();
  const filledSlots = comparisonSlots.filter(s => s.strategyType !== null);
  const availableStrategies = ALL_STRATEGY_TYPES.filter(st => activeStrategies.includes(st));

  const chartData = useMemo(() => {
    if (filledSlots.length === 0) return [];
    const years = [];
    for (let y = 1; y <= 20; y++) {
      const row: any = { year: y };
      filledSlots.forEach(slot => {
        const yearData = slot.projection?.find(p => p.year === y);
        if (yearData) {
          row[`slot${slot.id}_netPositive`] = yearData.cumulativeNetPositive;
          row[`slot${slot.id}_cashValue`] = yearData.cashValue;
          row[`slot${slot.id}_taxSavings`] = yearData.taxSavings;
          row[`slot${slot.id}_income`] = yearData.incomeGenerated;
          row[`slot${slot.id}_equity`] = yearData.equityBuilt;
          row[`slot${slot.id}_interestSaved`] = yearData.interestSaved;
          row[`slot${slot.id}_deathBenefit`] = yearData.deathBenefit;
        }
      });
      years.push(row);
    }
    return years;
  }, [filledSlots]);

  const radarData = useMemo(() => {
    if (summaries.length === 0) return [];
    const maxVals = {
      netPositive: Math.max(...summaries.map(s => Math.abs(s.totalNetPositive)), 1),
      taxSavings: Math.max(...summaries.map(s => s.totalTaxSavings), 1),
      cashValue: Math.max(...summaries.map(s => s.finalCashValue), 1),
      income: Math.max(...summaries.map(s => s.totalIncomeGenerated), 1),
      equity: Math.max(...summaries.map(s => s.totalEquityBuilt), 1),
      deathBenefit: Math.max(...summaries.map(s => s.finalDeathBenefit), 1),
    };
    const metrics = [
      { metric: "Net Positive", key: "netPositive" },
      { metric: "Tax Savings", key: "taxSavings" },
      { metric: "Cash Value", key: "cashValue" },
      { metric: "Income", key: "income" },
      { metric: "Equity", key: "equity" },
      { metric: "Death Benefit", key: "deathBenefit" },
    ];
    return metrics.map(m => {
      const row: any = { metric: m.metric };
      summaries.forEach(s => {
        const val = m.key === "netPositive" ? s.totalNetPositive
          : m.key === "taxSavings" ? s.totalTaxSavings
          : m.key === "cashValue" ? s.finalCashValue
          : m.key === "income" ? s.totalIncomeGenerated
          : m.key === "equity" ? s.totalEquityBuilt
          : s.finalDeathBenefit;
        row[s.label] = Math.round((val / maxVals[m.key]) * 100);
      });
      return row;
    });
  }, [summaries]);

  const winner = summaries.length > 0
    ? summaries.reduce((best, s) => s.totalNetPositive > best.totalNetPositive ? s : best, summaries[0])
    : null;

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/30">
                <GitCompare className="w-6 h-6 text-purple-400" />
              </div>
              Strategy Comparison Dashboard
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Run up to 5 strategies side-by-side with 20-year projections
            </p>
          </div>
          {filledSlots.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-zinc-500 hover:text-red-400"
              onClick={() => {
                clearAllComparisons();
                toast.info("All comparison slots cleared");
              }}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Clear All
            </Button>
          )}
        </div>

        {/* 5 Comparison Slots */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {comparisonSlots.map((slot, i) => (
            <Card
              key={slot.id}
              className={`border-2 transition-all ${
                slot.strategyType
                  ? "bg-zinc-900/80 border-zinc-600/50"
                  : "bg-zinc-900/40 border-dashed border-zinc-700/40 hover:border-zinc-600/50"
              }`}
              style={slot.strategyType ? { borderColor: `${SLOT_COLORS[i]}40` } : undefined}
            >
              <CardContent className="p-3">
                {slot.strategyType ? (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: SLOT_COLORS[i] }}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 w-5 p-0 text-zinc-500 hover:text-red-400"
                        onClick={() => clearComparisonSlot(slot.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="text-xs font-semibold text-zinc-200 truncate">
                      {slot.label}
                    </div>
                    {slot.projection && (
                      <div className="mt-1 text-[10px] text-emerald-400">
                        Net: {fmt(slot.projection[19]?.cumulativeNetPositive ?? 0)}
                      </div>
                    )}
                    <Badge
                      variant="outline"
                      className="mt-1.5 text-[9px] px-1 py-0"
                      style={{ borderColor: `${SLOT_COLORS[i]}60`, color: SLOT_COLORS[i] }}
                    >
                      20yr projected
                    </Badge>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <div className="text-xs text-zinc-500 mb-2">Slot {i + 1}</div>
                    <Select
                      onValueChange={(val) => {
                        if (val) setComparisonSlot(slot.id, val as StrategyType);
                      }}
                    >
                      <SelectTrigger className="h-7 text-[10px] bg-zinc-800/50 border-zinc-700/50">
                        <SelectValue placeholder="Select strategy..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStrategies.length > 0 ? (
                          availableStrategies.map(st => (
                            <SelectItem key={st} value={st} className="text-xs">
                              {STRATEGY_LABELS[st]}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-xs text-zinc-500">
                            Run calculators first to add strategies
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No strategies message */}
        {filledSlots.length === 0 && (
          <Card className="bg-zinc-900/40 border-zinc-700/30">
            <CardContent className="py-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-purple-500/20 flex items-center justify-center">
                <GitCompare className="w-8 h-8 text-purple-400/60" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-300 mb-2">No Strategies to Compare</h3>
              <p className="text-sm text-zinc-500 max-w-lg mx-auto mb-4">
                Run any calculator and click "Add to Comparison" in the Generate Outcome tab,
                or select from your synced strategies above.
              </p>
              {activeStrategies.length > 0 && (
                <p className="text-xs text-emerald-400">
                  <Zap className="w-3 h-3 inline mr-1" />
                  {activeStrategies.length} strategies available — select them in the slots above
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Results Tabs */}
        {filledSlots.length > 0 && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-zinc-800/50 border border-zinc-700/30">
              <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
              <TabsTrigger value="projection" className="text-xs">20-Year Projection</TabsTrigger>
              <TabsTrigger value="metrics" className="text-xs">Detailed Metrics</TabsTrigger>
              <TabsTrigger value="radar" className="text-xs">Radar Analysis</TabsTrigger>
              <TabsTrigger value="yearly" className="text-xs">Year-by-Year</TabsTrigger>
            </TabsList>

            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="space-y-4">
              {/* Winner banner */}
              {winner && summaries.length >= 2 && (
                <Card className="bg-gradient-to-r from-amber-500/10 to-emerald-500/10 border-amber-500/30">
                  <CardContent className="py-3 flex items-center gap-3">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    <div>
                      <span className="text-sm font-semibold text-amber-400">{winner.label}</span>
                      <span className="text-xs text-zinc-400 ml-2">
                        leads with {fmt(winner.totalNetPositive)} net positive over 20 years
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {summaries.map((s, i) => {
                  const slotIdx = comparisonSlots.findIndex(sl => sl.id === s.slotId);
                  const color = SLOT_COLORS[slotIdx] ?? SLOT_COLORS[0];
                  const isWinner = winner && s.slotId === winner.slotId && summaries.length >= 2;

                  return (
                    <Card
                      key={s.slotId}
                      className={`bg-zinc-900/60 border-zinc-700/50 ${isWinner ? "ring-1 ring-amber-500/40" : ""}`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                            <CardTitle className="text-sm font-semibold text-zinc-200">
                              {s.label}
                            </CardTitle>
                          </div>
                          {isWinner && (
                            <Badge className="text-[9px] bg-amber-500/20 text-amber-400 border-amber-500/30">
                              <Trophy className="w-2.5 h-2.5 mr-0.5" /> Best
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <MetricRow label="Net Positive" value={fmt(s.totalNetPositive)} highlight />
                          <MetricRow label="Interest Saved" value={fmt(s.totalInterestSaved)} />
                          <MetricRow label="Tax Savings" value={fmt(s.totalTaxSavings)} />
                          <MetricRow label="Cash Value" value={fmt(s.finalCashValue)} />
                          <MetricRow label="Death Benefit" value={fmt(s.finalDeathBenefit)} />
                          <MetricRow label="Income" value={fmt(s.totalIncomeGenerated)} />
                          <MetricRow label="Equity Built" value={fmt(s.totalEquityBuilt)} />
                          <MetricRow label="Interest Paid" value={fmt(s.totalInterestPaid)} negative />
                        </div>
                        <div className="pt-2 border-t border-zinc-700/30">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-zinc-500">Best metric:</span>
                            <Badge variant="outline" className="text-[9px]" style={{ borderColor: `${color}60`, color }}>
                              {s.bestMetric}: {fmt(s.bestMetricValue)}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* 20-YEAR PROJECTION TAB */}
            <TabsContent value="projection" className="space-y-4">
              <Card className="bg-zinc-900/60 border-zinc-700/50">
                <CardHeader>
                  <CardTitle className="text-sm text-zinc-200">Cumulative Net Positive — 20-Year Trajectory</CardTitle>
                  <CardDescription className="text-xs text-zinc-500">
                    Total wealth accumulation across all strategies
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          {filledSlots.map((slot, i) => (
                            <linearGradient key={slot.id} id={`cmp-grad-${slot.id}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={SLOT_COLORS[i]} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={SLOT_COLORS[i]} stopOpacity={0} />
                            </linearGradient>
                          ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="year" stroke="#71717a" tick={{ fontSize: 10 }} />
                        <YAxis stroke="#71717a" tick={{ fontSize: 10 }} tickFormatter={v => fmt(v)} />
                        <RTooltip
                          contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px", fontSize: "11px" }}
                          formatter={(value: number) => [fmt(value), ""]}
                          labelFormatter={(l) => `Year ${l}`}
                        />
                        <Legend wrapperStyle={{ fontSize: "11px" }} />
                        {filledSlots.map((slot, i) => (
                          <Area
                            key={slot.id}
                            type="monotone"
                            dataKey={`slot${slot.id}_netPositive`}
                            name={slot.label}
                            stroke={SLOT_COLORS[i]}
                            fill={`url(#cmp-grad-${slot.id})`}
                            strokeWidth={2}
                          />
                        ))}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Cash Value comparison */}
              <Card className="bg-zinc-900/60 border-zinc-700/50">
                <CardHeader>
                  <CardTitle className="text-sm text-zinc-200">Cash Value Growth Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="year" stroke="#71717a" tick={{ fontSize: 10 }} />
                        <YAxis stroke="#71717a" tick={{ fontSize: 10 }} tickFormatter={v => fmt(v)} />
                        <RTooltip
                          contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px", fontSize: "11px" }}
                          formatter={(value: number) => [fmt(value), ""]}
                        />
                        <Legend wrapperStyle={{ fontSize: "11px" }} />
                        {filledSlots.map((slot, i) => (
                          <Line
                            key={slot.id}
                            type="monotone"
                            dataKey={`slot${slot.id}_cashValue`}
                            name={`${slot.label} Cash Value`}
                            stroke={SLOT_COLORS[i]}
                            strokeWidth={2}
                            dot={false}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Tax Savings comparison */}
              <Card className="bg-zinc-900/60 border-zinc-700/50">
                <CardHeader>
                  <CardTitle className="text-sm text-zinc-200">Annual Tax Savings Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="year" stroke="#71717a" tick={{ fontSize: 10 }} />
                        <YAxis stroke="#71717a" tick={{ fontSize: 10 }} tickFormatter={v => fmt(v)} />
                        <RTooltip
                          contentStyle={{ backgroundColor: "#18181b", border: "1px solid #3f3f46", borderRadius: "8px", fontSize: "11px" }}
                          formatter={(value: number) => [fmt(value), ""]}
                        />
                        <Legend wrapperStyle={{ fontSize: "11px" }} />
                        {filledSlots.map((slot, i) => (
                          <Bar
                            key={slot.id}
                            dataKey={`slot${slot.id}_taxSavings`}
                            name={`${slot.label} Tax Savings`}
                            fill={SLOT_COLORS[i]}
                            opacity={0.8}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* DETAILED METRICS TAB */}
            <TabsContent value="metrics" className="space-y-4">
              <Card className="bg-zinc-900/60 border-zinc-700/50 overflow-x-auto">
                <CardContent className="p-0">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-zinc-700/30">
                        <th className="text-left px-4 py-3 text-zinc-400 font-medium">Metric</th>
                        {summaries.map((s, i) => {
                          const slotIdx = comparisonSlots.findIndex(sl => sl.id === s.slotId);
                          return (
                            <th key={s.slotId} className="text-right px-4 py-3 font-medium" style={{ color: SLOT_COLORS[slotIdx] }}>
                              {s.label}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: "Total Net Positive", key: "totalNetPositive", icon: TrendingUp },
                        { label: "Total Interest Paid", key: "totalInterestPaid", icon: Wallet },
                        { label: "Total Interest Saved", key: "totalInterestSaved", icon: PiggyBank },
                        { label: "Total Equity Built", key: "totalEquityBuilt", icon: Building2 },
                        { label: "Total Tax Savings", key: "totalTaxSavings", icon: Scale },
                        { label: "Final Cash Value", key: "finalCashValue", icon: Banknote },
                        { label: "Final Death Benefit", key: "finalDeathBenefit", icon: Heart },
                        { label: "Total Income Generated", key: "totalIncomeGenerated", icon: DollarSign },
                        { label: "Total Opportunity Cost", key: "totalOpportunityCost", icon: Target },
                      ].map((metric) => {
                        const values = summaries.map(s => s[metric.key] ?? 0);
                        const maxVal = Math.max(...values);
                        const Icon = metric.icon;
                        return (
                          <tr key={metric.key} className="border-b border-zinc-700/20 hover:bg-zinc-800/30">
                            <td className="px-4 py-2.5 text-zinc-300 flex items-center gap-2">
                              <Icon className="w-3.5 h-3.5 text-zinc-500" />
                              {metric.label}
                            </td>
                            {summaries.map((s, i) => {
                              const val = s[metric.key] ?? 0;
                              const isMax = val === maxVal && val > 0;
                              const slotIdx = comparisonSlots.findIndex(sl => sl.id === s.slotId);
                              return (
                                <td
                                  key={s.slotId}
                                  className={`px-4 py-2.5 text-right font-mono ${
                                    isMax ? "font-bold" : "text-zinc-400"
                                  }`}
                                  style={isMax ? { color: SLOT_COLORS[slotIdx] } : undefined}
                                >
                                  {fmt(val)}
                                  {isMax && summaries.length >= 2 && (
                                    <Trophy className="w-3 h-3 inline ml-1 text-amber-400" />
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* RADAR TAB */}
            <TabsContent value="radar" className="space-y-4">
              <Card className="bg-zinc-900/60 border-zinc-700/50">
                <CardHeader>
                  <CardTitle className="text-sm text-zinc-200">Strategy Strength Radar</CardTitle>
                  <CardDescription className="text-xs text-zinc-500">
                    Normalized comparison across 6 key dimensions (0-100 scale)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#3f3f46" />
                        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "#a1a1aa" }} />
                        <PolarRadiusAxis tick={{ fontSize: 9, fill: "#71717a" }} domain={[0, 100]} />
                        {summaries.map((s, i) => {
                          const slotIdx = comparisonSlots.findIndex(sl => sl.id === s.slotId);
                          return (
                            <Radar
                              key={s.slotId}
                              name={s.label}
                              dataKey={s.label}
                              stroke={SLOT_COLORS[slotIdx]}
                              fill={SLOT_COLORS[slotIdx]}
                              fillOpacity={0.15}
                              strokeWidth={2}
                            />
                          );
                        })}
                        <Legend wrapperStyle={{ fontSize: "11px" }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* YEAR-BY-YEAR TAB */}
            <TabsContent value="yearly" className="space-y-4">
              <Card className="bg-zinc-900/60 border-zinc-700/50 overflow-x-auto">
                <CardHeader>
                  <CardTitle className="text-sm text-zinc-200">Year-by-Year Net Positive Comparison</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-zinc-700/30">
                        <th className="text-left px-3 py-2 text-zinc-400 font-medium sticky left-0 bg-zinc-900">Year</th>
                        {filledSlots.map((slot, i) => (
                          <th key={slot.id} className="text-right px-3 py-2 font-medium" style={{ color: SLOT_COLORS[i] }}>
                            {slot.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: 20 }, (_, y) => {
                        const yearNum = y + 1;
                        const values = filledSlots.map(slot => {
                          const yearData = slot.projection?.find(p => p.year === yearNum);
                          return yearData?.cumulativeNetPositive ?? 0;
                        });
                        const maxVal = Math.max(...values);

                        return (
                          <tr key={yearNum} className="border-b border-zinc-700/20 hover:bg-zinc-800/30">
                            <td className="px-3 py-1.5 text-zinc-300 font-medium sticky left-0 bg-zinc-900">{yearNum}</td>
                            {filledSlots.map((slot, i) => {
                              const yearData = slot.projection?.find(p => p.year === yearNum);
                              const val = yearData?.cumulativeNetPositive ?? 0;
                              const isMax = val === maxVal && val > 0 && filledSlots.length >= 2;
                              return (
                                <td
                                  key={slot.id}
                                  className={`px-3 py-1.5 text-right font-mono ${isMax ? "font-bold" : "text-zinc-400"}`}
                                  style={isMax ? { color: SLOT_COLORS[i] } : undefined}
                                >
                                  {fmt(val)}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Quick-add from active strategies */}
        {availableStrategies.length > 0 && filledSlots.length < 5 && (
          <Card className="bg-zinc-900/40 border-zinc-700/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-emerald-400" />
                Quick Add from Synced Strategies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {availableStrategies
                  .filter(st => !filledSlots.some(s => s.strategyType === st))
                  .map(st => (
                    <Button
                      key={st}
                      size="sm"
                      variant="outline"
                      className="text-xs h-7 border-zinc-700/50 hover:border-emerald-500/40 hover:text-emerald-400"
                      onClick={() => {
                        const emptySlot = comparisonSlots.find(s => !s.strategyType);
                        if (emptySlot) {
                          setComparisonSlot(emptySlot.id, st);
                          toast.success(`Added ${STRATEGY_LABELS[st]} to comparison`);
                        }
                      }}
                    >
                      {STRATEGY_LABELS[st]}
                      <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

function MetricRow({ label, value, highlight, negative }: { label: string; value: string; highlight?: boolean; negative?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-[9px] text-zinc-500 uppercase tracking-wider">{label}</span>
      <span className={`text-xs font-semibold ${
        highlight ? "text-emerald-400" : negative ? "text-red-400" : "text-zinc-200"
      }`}>
        {value}
      </span>
    </div>
  );
}
