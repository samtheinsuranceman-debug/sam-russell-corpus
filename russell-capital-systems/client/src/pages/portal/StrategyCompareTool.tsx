import { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  Scale, TrendingUp, DollarSign, Shield, Search, X, Plus, ArrowRight,
  BarChart3, Target, Zap, ChevronDown
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  AreaChart, Area, ComposedChart, Line
} from "recharts";
import strategiesData from "@/data/strategies.json";
import combosData from "@/data/combos.json";

const COLORS = ["#a855f7", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444"];

function formatMoney(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function formatFullMoney(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

type DataItem = {
  id: number;
  type: "strategy" | "combo";
  title: string;
  clientProfile: any;
  steps: any[];
  totalTaxSaved: number;
  totalDeployed: number;
  finalNetWorth: number;
  netWorthMultiplier: number;
  timeHorizon: string;
  impactScore?: number;
  categories?: string[];
};

function normalizeItem(item: any, type: "strategy" | "combo"): DataItem {
  return {
    id: item.id,
    type,
    title: type === "strategy" ? item.title : item.comboName,
    clientProfile: item.clientProfile,
    steps: item.steps,
    totalTaxSaved: item.totalTaxSaved,
    totalDeployed: item.totalDeployed,
    finalNetWorth: item.finalNetWorth,
    netWorthMultiplier: item.netWorthMultiplier,
    timeHorizon: item.timeHorizon,
    impactScore: item.impactScore,
    categories: item.categories,
  };
}

export default function StrategyCompareTool() {
  const [selected, setSelected] = useState<DataItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "strategy" | "combo">("all");

  const allItems = useMemo(() => {
    const strats = (strategiesData as any[]).map(s => normalizeItem(s, "strategy"));
    const combos = (combosData as any[]).map(c => normalizeItem(c, "combo"));
    return [...strats, ...combos];
  }, []);

  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      if (filterType !== "all" && item.type !== filterType) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return item.title.toLowerCase().includes(q) ||
          item.clientProfile.name.toLowerCase().includes(q) ||
          item.clientProfile.profession.toLowerCase().includes(q);
      }
      return true;
    });
  }, [allItems, searchQuery, filterType]);

  const addItem = (item: DataItem) => {
    if (selected.length < 3 && !selected.find(s => s.id === item.id && s.type === item.type)) {
      setSelected([...selected, item]);
      setShowPicker(false);
      setSearchQuery("");
    }
  };

  const removeItem = (idx: number) => {
    setSelected(selected.filter((_, i) => i !== idx));
  };

  /* ─── Comparison Data ─── */
  const barData = useMemo(() => {
    if (selected.length === 0) return [];
    return [
      {
        metric: "Tax Saved",
        ...Object.fromEntries(selected.map((s, i) => [`item${i}`, s.totalTaxSaved])),
      },
      {
        metric: "Capital Deployed",
        ...Object.fromEntries(selected.map((s, i) => [`item${i}`, s.totalDeployed])),
      },
      {
        metric: "Final Net Worth",
        ...Object.fromEntries(selected.map((s, i) => [`item${i}`, s.finalNetWorth])),
      },
    ];
  }, [selected]);

  const radarData = useMemo(() => {
    if (selected.length === 0) return [];
    return [
      { metric: "Tax Efficiency", fullMark: 100, ...Object.fromEntries(selected.map((s, i) => [`item${i}`, Math.min(100, (s.totalTaxSaved / (s.clientProfile.startingNetWorth * 0.1)) * 100)])) },
      { metric: "ROI", fullMark: 100, ...Object.fromEntries(selected.map((s, i) => [`item${i}`, Math.min(100, ((s.finalNetWorth - s.clientProfile.startingNetWorth) / s.clientProfile.startingNetWorth) * 100 * 10)])) },
      { metric: "Steps", fullMark: 100, ...Object.fromEntries(selected.map((s, i) => [`item${i}`, s.steps.length * 10])) },
      { metric: "Multiplier", fullMark: 100, ...Object.fromEntries(selected.map((s, i) => [`item${i}`, s.netWorthMultiplier * 50])) },
      { metric: "Impact", fullMark: 100, ...Object.fromEntries(selected.map((s, i) => [`item${i}`, (s.impactScore || 8) * 8.33])) },
    ];
  }, [selected]);

  const projectionData = useMemo(() => {
    if (selected.length === 0) return [];
    const data = [];
    for (let y = 0; y <= 50; y += 5) {
      const point: any = { year: `Year ${y}` };
      selected.forEach((s, i) => {
        const startNW = s.clientProfile.startingNetWorth;
        const endNW = s.finalNetWorth;
        const annualGrowth = 0.06;
        const taxSavingsPerYear = s.totalTaxSaved / 10;
        if (y === 0) {
          point[`item${i}`] = startNW;
        } else {
          const base = endNW * Math.pow(1 + annualGrowth, y);
          const reinvested = taxSavingsPerYear * ((Math.pow(1 + annualGrowth, y) - 1) / annualGrowth);
          point[`item${i}`] = Math.round(base + reinvested);
        }
      });
      data.push(point);
    }
    return data;
  }, [selected]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-[#1a0d2e] via-[#0a1628] to-[#0d1a2e] p-6 md:p-8">
        <div className="flex items-center gap-3 mb-2">
          <Scale className="w-6 h-6 text-purple-400" />
          <h1 className="text-2xl md:text-3xl font-bold text-white">Strategy Comparison Tool</h1>
        </div>
        <p className="text-gray-400 text-sm max-w-2xl">
          Select up to 3 strategies or combos to compare side-by-side. Analyze tax savings, net worth growth,
          ROI metrics, and 50-year projections across different approaches.
        </p>
      </div>

      {/* Selection Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[0, 1, 2].map(idx => (
          <div key={idx} className="relative">
            {selected[idx] ? (
              <div className={`rounded-xl border-2 p-4 bg-slate-900/50 ${
                idx === 0 ? "border-purple-500/40" : idx === 1 ? "border-blue-500/40" : "border-emerald-500/40"
              }`}>
                <button onClick={() => removeItem(idx)} className="absolute top-2 right-2 p-1 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-colors">
                  <X className="w-3 h-3" />
                </button>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: COLORS[idx] }} />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: COLORS[idx] }}>
                    {selected[idx].type === "strategy" ? `Strategy #${selected[idx].id}` : `Combo #${selected[idx].id}`}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white truncate mb-1">{selected[idx].title}</h3>
                <p className="text-xs text-gray-400">{selected[idx].clientProfile.name}</p>
                <p className="text-xs text-gray-500">{selected[idx].clientProfile.profession}</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase">Tax Saved</p>
                    <p className="text-sm font-bold text-emerald-400">{formatMoney(selected[idx].totalTaxSaved)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase">Final NW</p>
                    <p className="text-sm font-bold text-blue-400">{formatMoney(selected[idx].finalNetWorth)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowPicker(true)}
                className="w-full h-full min-h-[160px] rounded-xl border-2 border-dashed border-gray-700 hover:border-purple-500/40 bg-slate-900/30 hover:bg-slate-900/50 flex flex-col items-center justify-center gap-2 transition-all"
              >
                <Plus className="w-6 h-6 text-gray-500" />
                <span className="text-sm text-gray-500">Add {idx === 0 ? "first" : idx === 1 ? "second" : "third"} strategy</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Picker Modal */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowPicker(false)}>
          <div className="bg-slate-900 border border-gray-700 rounded-2xl w-full max-w-2xl max-h-[70vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center gap-3 mb-3">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, profession, or strategy title..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm"
                  autoFocus
                />
                <button onClick={() => setShowPicker(false)} className="p-1 rounded-full hover:bg-gray-700 text-gray-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-2">
                {(["all", "strategy", "combo"] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      filterType === t ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600"
                    }`}
                  >
                    {t === "all" ? "All" : t === "strategy" ? "Strategies" : "Combos"}
                  </button>
                ))}
              </div>
            </div>
            <div className="overflow-y-auto max-h-[50vh] p-2">
              {filteredItems.slice(0, 50).map(item => {
                const alreadySelected = selected.some(s => s.id === item.id && s.type === item.type);
                return (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => !alreadySelected && addItem(item)}
                    disabled={alreadySelected}
                    className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
                      alreadySelected ? "opacity-40 cursor-not-allowed bg-gray-800/50" : "hover:bg-slate-800 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                            item.type === "strategy" ? "bg-purple-500/20 text-purple-400" : "bg-emerald-500/20 text-emerald-400"
                          }`}>
                            {item.type === "strategy" ? `S#${item.id}` : `C#${item.id}`}
                          </span>
                          <span className="text-sm font-semibold text-white truncate">{item.title}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{item.clientProfile.name} — {item.clientProfile.profession}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-emerald-400">{formatMoney(item.totalTaxSaved)}</p>
                        <p className="text-[10px] text-gray-500">tax saved</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Comparison Charts */}
      {selected.length >= 2 && (
        <>
          {/* Legend */}
          <div className="flex items-center gap-4 flex-wrap">
            {selected.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-xs text-gray-400">{s.title}</span>
              </div>
            ))}
          </div>

          {/* Metrics Comparison Table */}
          <div className="rounded-xl border border-gray-700/50 bg-slate-900/50 overflow-hidden">
            <div className="p-4 border-b border-gray-700/50">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-400" /> Head-to-Head Metrics
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700/50">
                    <th className="text-left p-3 text-gray-400 font-semibold">Metric</th>
                    {selected.map((s, i) => (
                      <th key={i} className="text-right p-3 font-semibold" style={{ color: COLORS[i] }}>
                        {s.type === "strategy" ? `Strategy #${s.id}` : `Combo #${s.id}`}
                      </th>
                    ))}
                    <th className="text-right p-3 text-amber-400 font-semibold">Winner</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Starting Net Worth", key: "startNW", fn: (s: DataItem) => s.clientProfile.startingNetWorth, format: formatFullMoney, best: "max" },
                    { label: "Final Net Worth", key: "finalNW", fn: (s: DataItem) => s.finalNetWorth, format: formatFullMoney, best: "max" },
                    { label: "Net Worth Growth", key: "growth", fn: (s: DataItem) => ((s.finalNetWorth - s.clientProfile.startingNetWorth) / s.clientProfile.startingNetWorth * 100), format: (n: number) => `+${n.toFixed(2)}%`, best: "max" },
                    { label: "Total Tax Saved", key: "taxSaved", fn: (s: DataItem) => s.totalTaxSaved, format: formatFullMoney, best: "max" },
                    { label: "Capital Deployed", key: "deployed", fn: (s: DataItem) => s.totalDeployed, format: formatFullMoney, best: "min" },
                    { label: "Wealth Multiplier", key: "mult", fn: (s: DataItem) => s.netWorthMultiplier, format: (n: number) => `${n}x`, best: "max" },
                    { label: "Tax Saved / Deployed", key: "efficiency", fn: (s: DataItem) => s.totalTaxSaved / Math.max(s.totalDeployed, 1) * 100, format: (n: number) => `${n.toFixed(1)}%`, best: "max" },
                    { label: "Number of Steps", key: "steps", fn: (s: DataItem) => s.steps.length, format: (n: number) => `${n}`, best: "min" },
                  ].map(row => {
                    const values = selected.map(s => row.fn(s));
                    const bestVal = row.best === "max" ? Math.max(...values) : Math.min(...values);
                    const winnerIdx = values.indexOf(bestVal);
                    return (
                      <tr key={row.key} className="border-b border-gray-800/50 hover:bg-slate-800/30">
                        <td className="p-3 text-gray-300 font-medium">{row.label}</td>
                        {selected.map((s, i) => (
                          <td key={i} className={`p-3 text-right font-semibold ${i === winnerIdx ? "text-amber-400" : "text-gray-400"}`}>
                            {row.format(values[i])}
                            {i === winnerIdx && " ★"}
                          </td>
                        ))}
                        <td className="p-3 text-right text-amber-400 font-bold text-xs">
                          {selected[winnerIdx]?.type === "strategy" ? `S#${selected[winnerIdx]?.id}` : `C#${selected[winnerIdx]?.id}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <div className="rounded-xl border border-gray-700/50 bg-slate-900/50 p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" /> Financial Comparison
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="metric" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={v => formatMoney(v)} />
                  <Tooltip
                    contentStyle={{ background: "#1e293b", border: "1px solid #475569", borderRadius: "8px" }}
                    labelStyle={{ color: "#e2e8f0" }}
                    formatter={(v: number) => formatFullMoney(v)}
                  />
                  {selected.map((_, i) => (
                    <Bar key={i} dataKey={`item${i}`} fill={COLORS[i]} radius={[4, 4, 0, 0]} name={selected[i]?.title} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Radar Chart */}
            <div className="rounded-xl border border-gray-700/50 bg-slate-900/50 p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-400" /> Strategy Profile Radar
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <PolarRadiusAxis tick={false} domain={[0, 100]} />
                  {selected.map((_, i) => (
                    <Radar key={i} dataKey={`item${i}`} stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.15} name={selected[i]?.title} />
                  ))}
                  <Tooltip
                    contentStyle={{ background: "#1e293b", border: "1px solid #475569", borderRadius: "8px" }}
                    labelStyle={{ color: "#e2e8f0" }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 50-Year Projection */}
          <div className="rounded-xl border border-gray-700/50 bg-slate-900/50 p-5">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" /> 50-Year Net Worth Projection (6% Annual Growth + Reinvested Tax Savings)
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={projectionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 11 }} interval={1} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={v => formatMoney(v)} />
                <Tooltip
                  contentStyle={{ background: "#1e293b", border: "1px solid #475569", borderRadius: "8px" }}
                  labelStyle={{ color: "#e2e8f0" }}
                  formatter={(v: number) => formatFullMoney(v)}
                />
                {selected.map((_, i) => (
                  <Area
                    key={i}
                    type="monotone"
                    dataKey={`item${i}`}
                    stroke={COLORS[i]}
                    fill={COLORS[i]}
                    fillOpacity={0.1}
                    strokeWidth={2}
                    name={selected[i]?.title}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Step-by-Step Comparison */}
          <div className="rounded-xl border border-gray-700/50 bg-slate-900/50 p-5">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> Step-by-Step Net Worth Progression
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-700/50">
                    <th className="text-left p-2 text-gray-400">Step</th>
                    {selected.map((s, i) => (
                      <th key={i} className="text-center p-2" style={{ color: COLORS[i] }}>
                        {s.type === "strategy" ? `S#${s.id}` : `C#${s.id}`}
                        <div className="text-[10px] text-gray-500 font-normal truncate max-w-[150px]">{s.title}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: Math.max(...selected.map(s => s.steps.length)) }, (_, stepIdx) => (
                    <tr key={stepIdx} className="border-b border-gray-800/30 hover:bg-slate-800/20">
                      <td className="p-2 text-gray-400 font-semibold">{stepIdx + 1}</td>
                      {selected.map((s, i) => {
                        const step = s.steps[stepIdx];
                        if (!step) return <td key={i} className="p-2 text-center text-gray-600">—</td>;
                        return (
                          <td key={i} className="p-2">
                            <div className="text-gray-300 font-medium truncate max-w-[180px]">{step.strategyName}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-emerald-400">{formatMoney(step.taxSaved)}</span>
                              <ArrowRight className="w-3 h-3 text-gray-600" />
                              <span className="text-blue-400 font-semibold">{formatMoney(step.netWorthAfter)}</span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-purple-500/5 p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" /> Comparison Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {selected.map((s, i) => {
                const growth = ((s.finalNetWorth - s.clientProfile.startingNetWorth) / s.clientProfile.startingNetWorth * 100).toFixed(1);
                const efficiency = (s.totalTaxSaved / Math.max(s.totalDeployed, 1) * 100).toFixed(1);
                return (
                  <div key={i} className="rounded-lg border p-4" style={{ borderColor: `${COLORS[i]}40`, background: `${COLORS[i]}08` }}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: COLORS[i] }}>
                        {s.type === "strategy" ? `Strategy #${s.id}` : `Combo #${s.id}`}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-white mb-2 truncate">{s.title}</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between"><span className="text-gray-400">Growth</span><span className="text-emerald-400 font-bold">+{growth}%</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Tax Saved</span><span className="text-emerald-400 font-bold">{formatMoney(s.totalTaxSaved)}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Efficiency</span><span className="text-blue-400 font-bold">{efficiency}%</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Steps</span><span className="text-purple-400 font-bold">{s.steps.length}</span></div>
                    </div>
                    <Link
                      href={s.type === "strategy" ? `/portal/secret-secrets/${s.id}` : `/portal/tax-combos/${s.id}`}
                      className="mt-3 block text-center text-xs font-semibold py-1.5 rounded-lg transition-colors"
                      style={{ color: COLORS[i], background: `${COLORS[i]}15`, border: `1px solid ${COLORS[i]}30` }}
                    >
                      View Full Details →
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Empty State */}
      {selected.length < 2 && (
        <div className="rounded-xl border border-gray-700/50 bg-slate-900/30 p-12 text-center">
          <Scale className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-400 mb-2">Select at Least 2 Strategies to Compare</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Click the "+" cards above to add strategies or combos. You can compare up to 3 items side-by-side
            with detailed metrics, charts, and 50-year projections.
          </p>
        </div>
      )}
    </div>
  );
}
