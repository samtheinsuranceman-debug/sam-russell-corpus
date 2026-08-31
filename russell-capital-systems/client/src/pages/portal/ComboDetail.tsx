import { useState, useMemo } from "react";
import { useParams, Link } from "wouter";
import {
  ArrowLeft, TrendingUp, DollarSign, Shield, User, MapPin, Briefcase, Calendar,
  Scale, Calculator, FileText, Target, PiggyBank, BarChart3, Activity, ChevronDown, ChevronUp
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ComposedChart,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import combosData from "@/data/combos.json";
import { PDFExportButton } from "@/components/PDFExport";

const COLORS = ["#22c55e", "#3b82f6", "#a855f7", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#6366f1"];

function formatMoney(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function formatFullMoney(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

/* ─── ROI Calculator ─── */
function ROICalculator({ combo }: { combo: any }) {
  const [investmentAmount, setInvestmentAmount] = useState(combo.totalDeployed || 500000);
  const [years, setYears] = useState(10);
  const [annualReturn, setAnnualReturn] = useState(8);

  const projections = useMemo(() => {
    const data = [];
    let withStrategy = combo.clientProfile.startingNetWorth;
    let withoutStrategy = combo.clientProfile.startingNetWorth;
    const taxRate = 0.37;
    const annualTaxSaved = (combo.totalTaxSaved || 0) / Math.max(years, 1);

    for (let y = 0; y <= years; y++) {
      data.push({
        year: `Year ${y}`,
        withStrategy: Math.round(withStrategy),
        withoutStrategy: Math.round(withoutStrategy),
        difference: Math.round(withStrategy - withoutStrategy),
      });
      withStrategy = withStrategy * (1 + annualReturn / 100) + annualTaxSaved;
      withoutStrategy = withoutStrategy * (1 + (annualReturn / 100) * (1 - taxRate));
    }
    return data;
  }, [investmentAmount, years, annualReturn, combo]);

  const finalDiff = projections[projections.length - 1];
  const roiPct = ((finalDiff.withStrategy - finalDiff.withoutStrategy) / combo.clientProfile.startingNetWorth * 100).toFixed(1);

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <Calculator className="w-4 h-4 text-emerald-400" /> ROI Projection Calculator
      </h3>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <label className="text-[10px] text-gray-500 block mb-1">Years to Project</label>
          <input
            type="range" min={5} max={50} value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
          <span className="text-xs text-emerald-400">{years} years</span>
        </div>
        <div>
          <label className="text-[10px] text-gray-500 block mb-1">Annual Return %</label>
          <input
            type="range" min={4} max={15} step={0.5} value={annualReturn}
            onChange={(e) => setAnnualReturn(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
          <span className="text-xs text-blue-400">{annualReturn}%</span>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-gray-500 mb-1">Strategy ROI Advantage</p>
          <p className="text-2xl font-bold text-emerald-400">+{roiPct}%</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={projections}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 10 }} interval={Math.max(1, Math.floor(years / 8))} />
          <YAxis tickFormatter={(v) => formatMoney(v)} tick={{ fill: "#94a3b8", fontSize: 10 }} />
          <Tooltip
            contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
            formatter={(value: number) => [formatFullMoney(value), ""]}
          />
          <Area type="monotone" dataKey="withStrategy" stroke="#22c55e" fill="#22c55e" fillOpacity={0.12} strokeWidth={2} name="With Strategy" />
          <Area type="monotone" dataKey="withoutStrategy" stroke="#ef4444" fill="#ef4444" fillOpacity={0.08} strokeWidth={2} name="Without Strategy" />
        </AreaChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-3 gap-3 mt-3">
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2 text-center">
          <p className="text-[10px] text-gray-500">With Strategy ({years}yr)</p>
          <p className="text-sm font-bold text-emerald-400">{formatMoney(finalDiff.withStrategy)}</p>
        </div>
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2 text-center">
          <p className="text-[10px] text-gray-500">Without Strategy</p>
          <p className="text-sm font-bold text-red-400">{formatMoney(finalDiff.withoutStrategy)}</p>
        </div>
        <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-2 text-center">
          <p className="text-[10px] text-gray-500">Tax Alpha Advantage</p>
          <p className="text-sm font-bold text-blue-400">{formatMoney(finalDiff.difference)}</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Tax Bracket Calculator ─── */
function TaxBracketCalculator({ combo }: { combo: any }) {
  const income = combo.clientProfile.annualIncome || 850000;
  const taxSaved = combo.totalTaxSaved || 0;

  const brackets = [
    { rate: 10, min: 0, max: 22000, color: "#22c55e" },
    { rate: 12, min: 22001, max: 89450, color: "#84cc16" },
    { rate: 22, min: 89451, max: 190750, color: "#f59e0b" },
    { rate: 24, min: 190751, max: 364200, color: "#f97316" },
    { rate: 32, min: 364201, max: 462500, color: "#ef4444" },
    { rate: 35, min: 462501, max: 693750, color: "#dc2626" },
    { rate: 37, min: 693751, max: Infinity, color: "#991b1b" },
  ];

  const effectiveIncome = income;
  const reducedIncome = Math.max(0, income - taxSaved);

  const calcTax = (inc: number) => {
    let tax = 0;
    for (const b of brackets) {
      if (inc > b.min) {
        const taxable = Math.min(inc, b.max) - b.min;
        tax += taxable * (b.rate / 100);
      }
    }
    return tax;
  };

  const originalTax = calcTax(effectiveIncome);
  const reducedTax = calcTax(reducedIncome);
  const actualSavings = originalTax - reducedTax;

  const bracketData = brackets.map(b => ({
    bracket: `${b.rate}%`,
    original: Math.min(Math.max(effectiveIncome - b.min, 0), b.max - b.min) * b.rate / 100,
    reduced: Math.min(Math.max(reducedIncome - b.min, 0), b.max - b.min) * b.rate / 100,
    color: b.color,
  })).filter(b => b.original > 0);

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <PiggyBank className="w-4 h-4 text-yellow-400" /> Tax Bracket Impact Analysis
      </h3>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2 text-center">
          <p className="text-[10px] text-gray-500">Original Tax Burden</p>
          <p className="text-sm font-bold text-red-400">{formatFullMoney(originalTax)}</p>
        </div>
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2 text-center">
          <p className="text-[10px] text-gray-500">After Strategy</p>
          <p className="text-sm font-bold text-emerald-400">{formatFullMoney(reducedTax)}</p>
        </div>
        <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-2 text-center">
          <p className="text-[10px] text-gray-500">Effective Savings</p>
          <p className="text-sm font-bold text-yellow-400">{formatFullMoney(actualSavings)}</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={bracketData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis type="number" tickFormatter={(v) => formatMoney(v)} tick={{ fill: "#94a3b8", fontSize: 10 }} />
          <YAxis type="category" dataKey="bracket" tick={{ fill: "#94a3b8", fontSize: 11 }} width={40} />
          <Tooltip
            contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
            formatter={(value: number) => [formatFullMoney(value), ""]}
          />
          <Bar dataKey="original" name="Before Strategy" fill="#ef4444" fillOpacity={0.6} radius={[0, 4, 4, 0]} />
          <Bar dataKey="reduced" name="After Strategy" fill="#22c55e" fillOpacity={0.6} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── Fact Finder ─── */
function FactFinder({ combo }: { combo: any }) {
  const [expanded, setExpanded] = useState(false);
  const cp = combo.clientProfile;
  const steps = combo.steps || [];

  const totalDeployed = combo.totalDeployed || steps.reduce((s: number, st: any) => s + (st.amountDeployed || 0), 0);
  const totalTaxSaved = combo.totalTaxSaved || steps.reduce((s: number, st: any) => s + (st.taxSaved || 0), 0);
  const avgStepSize = totalDeployed / Math.max(steps.length, 1);
  const netGrowth = (combo.finalNetWorth || 0) - (cp.startingNetWorth || 0);
  const growthPct = ((netGrowth / Math.max(cp.startingNetWorth, 1)) * 100).toFixed(1);
  const taxEfficiency = ((totalTaxSaved / Math.max(totalDeployed, 1)) * 100).toFixed(1);

  const strategyTypes: string[] = Array.from(new Set(steps.map((s: any) => s.strategyName).filter(Boolean))) as string[];

  return (
    <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-transparent p-5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-sm font-semibold text-white"
      >
        <span className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" /> Client Fact Finder
        </span>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Demographics */}
          <div>
            <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">Client Demographics</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                <p className="text-[10px] text-gray-500">Client Name</p>
                <p className="text-sm text-white font-medium">{cp.name}</p>
              </div>
              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                <p className="text-[10px] text-gray-500">Profession</p>
                <p className="text-sm text-white font-medium">{cp.profession}</p>
              </div>
              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                <p className="text-[10px] text-gray-500">Age</p>
                <p className="text-sm text-white font-medium">{cp.age}</p>
              </div>
              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                <p className="text-[10px] text-gray-500">Family Status</p>
                <p className="text-sm text-white font-medium">{cp.familyStatus || "Married, 2 children"}</p>
              </div>
              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                <p className="text-[10px] text-gray-500">State</p>
                <p className="text-sm text-white font-medium">{cp.state}</p>
              </div>
              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                <p className="text-[10px] text-gray-500">Tax Bracket</p>
                <p className="text-sm text-white font-medium">{cp.taxBracket || "37% Federal"}</p>
              </div>
            </div>
          </div>

          {/* Financial Snapshot */}
          <div>
            <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">Financial Snapshot</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                <p className="text-[10px] text-gray-500">Annual Income</p>
                <p className="text-sm text-white font-medium">{formatFullMoney(cp.annualIncome || 0)}</p>
              </div>
              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                <p className="text-[10px] text-gray-500">Starting Net Worth</p>
                <p className="text-sm text-white font-medium">{formatFullMoney(cp.startingNetWorth)}</p>
              </div>
              <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3">
                <p className="text-[10px] text-gray-500">Final Net Worth</p>
                <p className="text-sm text-emerald-400 font-medium">{formatFullMoney(combo.finalNetWorth)}</p>
              </div>
              <div className="rounded-lg bg-yellow-500/5 border border-yellow-500/20 p-3">
                <p className="text-[10px] text-gray-500">Total Tax Saved</p>
                <p className="text-sm text-yellow-400 font-medium">{formatFullMoney(totalTaxSaved)}</p>
              </div>
            </div>
          </div>

          {/* Strategy Metrics */}
          <div>
            <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">Strategy Performance Metrics</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                <p className="text-[10px] text-gray-500">Net Growth</p>
                <p className="text-sm text-emerald-400 font-bold">+{formatFullMoney(netGrowth)}</p>
              </div>
              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                <p className="text-[10px] text-gray-500">Growth Rate</p>
                <p className="text-sm text-blue-400 font-bold">+{growthPct}%</p>
              </div>
              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                <p className="text-[10px] text-gray-500">Tax Efficiency</p>
                <p className="text-sm text-purple-400 font-bold">{taxEfficiency}%</p>
              </div>
              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                <p className="text-[10px] text-gray-500">Avg Step Size</p>
                <p className="text-sm text-white font-bold">{formatFullMoney(avgStepSize)}</p>
              </div>
            </div>
          </div>

          {/* Strategies Used */}
          <div>
            <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">Strategies Deployed ({strategyTypes.length})</h4>
            <div className="flex flex-wrap gap-2">
              {strategyTypes.map((name: string, i: number) => (
                <span key={i} className="text-xs px-2 py-1 rounded-full border border-white/10 bg-white/5 text-gray-300">
                  {name}
                </span>
              ))}
            </div>
          </div>

          {/* Goals & Objectives */}
          <div>
            <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">Goals & Objectives</h4>
            <div className="space-y-2">
              {[
                { goal: "Minimize federal & state income tax liability", status: "achieved", icon: "✓" },
                { goal: "Grow net worth through tax-advantaged vehicles", status: "achieved", icon: "✓" },
                { goal: "Protect assets from estate taxation", status: "achieved", icon: "✓" },
                { goal: "Create multi-generational wealth transfer", status: "in-progress", icon: "→" },
                { goal: "Establish tax-free retirement income streams", status: "in-progress", icon: "→" },
              ].map((g, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className={`text-xs w-5 h-5 rounded-full flex items-center justify-center ${g.status === "achieved" ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                    {g.icon}
                  </span>
                  <span className="text-sm text-gray-300">{g.goal}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Component ─── */
export default function ComboDetail() {
  const params = useParams();
  const id = Number(params?.id);
  const combo = (combosData as any[]).find((c) => c.id === id);

  if (!combo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-gray-400">Combo not found</p>
        <Link href="/portal/tax-combos" className="text-emerald-400 hover:underline text-sm">Back to all combos</Link>
      </div>
    );
  }

  const { clientProfile: cp, steps } = combo;

  // Chart data
  const netWorthProgression = steps.map((s: any) => ({
    name: `Step ${s.stepNumber}`,
    before: s.netWorthBefore,
    after: s.netWorthAfter,
    strategy: s.strategyName?.substring(0, 20) + "...",
  }));

  const taxSavingsData = steps.map((s: any) => ({
    name: `S${s.stepNumber}`,
    taxSaved: s.taxSaved,
    fullName: s.strategyName,
  }));

  const deploymentData = steps.map((s: any, i: number) => ({
    name: s.strategyName?.substring(0, 25) || `Step ${s.stepNumber}`,
    value: s.amountDeployed,
    color: COLORS[i % COLORS.length],
  }));

  const cumulativeData = steps.reduce((acc: any[], s: any) => {
    const prev = acc.length > 0 ? acc[acc.length - 1] : { cumTax: 0, cumGrowth: 0 };
    acc.push({
      name: `Step ${s.stepNumber}`,
      cumTax: prev.cumTax + s.taxSaved,
      cumGrowth: s.netWorthAfter - cp.startingNetWorth,
      netWorth: s.netWorthAfter,
    });
    return acc;
  }, []);

  // Year-by-year projection data (50 years)
  const yearProjection = useMemo(() => {
    const data = [];
    let nw = combo.finalNetWorth || cp.startingNetWorth;
    const annualGrowth = 0.07;
    const annualTaxSaving = (combo.totalTaxSaved || 0) * 0.15; // recurring annual benefit

    for (let y = 0; y <= 50; y++) {
      data.push({
        year: `Yr ${y}`,
        netWorth: Math.round(nw),
        taxFreeIncome: Math.round(nw * 0.04), // 4% withdrawal rate
      });
      nw = nw * (1 + annualGrowth) + annualTaxSaving;
    }
    return data;
  }, [combo]);

  // Strategy effectiveness radar
  const radarData = [
    { metric: "Tax Savings", value: Math.min(100, ((combo.totalTaxSaved || 0) / (cp.startingNetWorth * 0.15)) * 100) },
    { metric: "Net Growth", value: Math.min(100, (((combo.finalNetWorth || 0) - cp.startingNetWorth) / cp.startingNetWorth) * 200) },
    { metric: "Diversification", value: Math.min(100, steps.length * 12) },
    { metric: "Tax Efficiency", value: Math.min(100, ((combo.totalTaxSaved || 0) / Math.max(combo.totalDeployed || 1, 1)) * 300) },
    { metric: "Asset Protection", value: Math.min(100, 60 + steps.length * 4) },
    { metric: "Legacy Planning", value: Math.min(100, 50 + (combo.netWorthMultiplier || 1) * 20) },
  ];

  // Wealth allocation pie
  const wealthAllocation = [
    { name: "Tax-Free Vehicles", value: Math.round((combo.finalNetWorth || 0) * 0.35), color: "#22c55e" },
    { name: "Tax-Deferred", value: Math.round((combo.finalNetWorth || 0) * 0.25), color: "#3b82f6" },
    { name: "Real Estate", value: Math.round((combo.finalNetWorth || 0) * 0.20), color: "#a855f7" },
    { name: "Business Equity", value: Math.round((combo.finalNetWorth || 0) * 0.12), color: "#f59e0b" },
    { name: "Liquid Assets", value: Math.round((combo.finalNetWorth || 0) * 0.08), color: "#06b6d4" },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Back nav */}
      <div className="flex items-center justify-between">
        <Link href="/portal/tax-combos" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-emerald-400 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Tax-Free Wealth Combos
        </Link>
        <PDFExportButton data={combo} type="combo" />
      </div>

      {/* Header */}
      <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-[#0d1a0d] via-[#0a1628] to-[#0d1a0d] p-6 md:p-8">
        <p className="text-xs font-semibold tracking-[0.3em] text-emerald-400 uppercase mb-1">Combo #{combo.id}</p>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">{combo.comboName}</h1>

        {/* Client Profile */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div><p className="text-[10px] text-gray-500">Client</p><p className="text-sm text-white">{cp.name}</p></div>
          </div>
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <div><p className="text-[10px] text-gray-500">Profession</p><p className="text-sm text-white">{cp.profession}</p></div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-400 flex-shrink-0" />
            <div><p className="text-[10px] text-gray-500">Age</p><p className="text-sm text-white">{cp.age}</p></div>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-yellow-400 flex-shrink-0" />
            <div><p className="text-[10px] text-gray-500">State</p><p className="text-sm text-white">{cp.state}</p></div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
            <p className="text-lg font-bold text-white">{formatMoney(cp.startingNetWorth)}</p>
            <p className="text-[10px] text-gray-500">Starting Net Worth</p>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
            <p className="text-lg font-bold text-emerald-400">{formatMoney(combo.finalNetWorth)}</p>
            <p className="text-[10px] text-gray-500">Final Net Worth</p>
          </div>
          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3 text-center">
            <p className="text-lg font-bold text-yellow-400">{formatMoney(combo.totalTaxSaved)}</p>
            <p className="text-[10px] text-gray-500">Total Tax Saved</p>
          </div>
          <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3 text-center">
            <p className="text-lg font-bold text-purple-400">{combo.netWorthMultiplier}x</p>
            <p className="text-[10px] text-gray-500">Net Worth Multiplier</p>
          </div>
        </div>
      </div>

      {/* Fact Finder (expandable) */}
      <FactFinder combo={combo} />

      {/* Primary Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Net Worth Progression */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" /> Net Worth Progression
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={cumulativeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis tickFormatter={(v) => formatMoney(v)} tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
                labelStyle={{ color: "#94a3b8" }}
                formatter={(value: number) => [formatFullMoney(value), ""]}
              />
              <Area type="monotone" dataKey="netWorth" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} strokeWidth={2} name="Net Worth" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Tax Savings per Step */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-yellow-400" /> Tax Savings by Step
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={taxSavingsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis tickFormatter={(v) => formatMoney(v)} tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
                formatter={(value: number, name: string, props: any) => [formatFullMoney(value), props.payload.fullName]}
              />
              <Bar dataKey="taxSaved" name="Tax Saved" radius={[4, 4, 0, 0]}>
                {taxSavingsData.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cumulative Tax Savings + Net Worth Growth (Composed Chart) */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-purple-400" /> Cumulative Tax Savings vs. Net Worth Growth
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={cumulativeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <YAxis yAxisId="left" tickFormatter={(v) => formatMoney(v)} tick={{ fill: "#94a3b8", fontSize: 10 }} />
            <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => formatMoney(v)} tick={{ fill: "#94a3b8", fontSize: 10 }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
              formatter={(value: number) => [formatFullMoney(value), ""]}
            />
            <Area yAxisId="left" type="monotone" dataKey="cumGrowth" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} strokeWidth={2} name="Net Worth Growth" />
            <Line yAxisId="right" type="monotone" dataKey="cumTax" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b", r: 3 }} name="Cumulative Tax Saved" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Capital Deployment Pie + Strategy Radar */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Capital Deployment Pie */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-blue-400" /> Capital Deployment Breakdown
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={deploymentData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={100}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {deploymentData.map((entry: any, i: number) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
                formatter={(value: number) => [formatFullMoney(value), "Deployed"]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Strategy Effectiveness Radar */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-cyan-400" /> Strategy Effectiveness Score
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1e293b" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <PolarRadiusAxis tick={false} domain={[0, 100]} />
              <Radar name="Score" dataKey="value" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Wealth Allocation Pie + 30-Year Projection */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Wealth Allocation */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-400" /> Post-Strategy Wealth Allocation
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={wealthAllocation}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {wealthAllocation.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
                formatter={(value: number) => [formatFullMoney(value), ""]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 50-Year Net Worth Projection */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" /> 50-Year Net Worth Projection
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={yearProjection}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 10 }} interval={9} />
              <YAxis tickFormatter={(v) => formatMoney(v)} tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }}
                formatter={(value: number) => [formatFullMoney(value), ""]}
              />
              <Area type="monotone" dataKey="netWorth" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.12} strokeWidth={2} name="Projected Net Worth" />
              <Area type="monotone" dataKey="taxFreeIncome" stroke="#22c55e" fill="#22c55e" fillOpacity={0.08} strokeWidth={1.5} name="Tax-Free Income (4%)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Calculators */}
      <ROICalculator combo={combo} />
      <TaxBracketCalculator combo={combo} />

      {/* Strategy Steps */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Strategy Execution Steps</h2>
        {steps.map((step: any, i: number) => (
          <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-5 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            <div className="pl-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full mr-2" style={{ backgroundColor: COLORS[i % COLORS.length] + "20", color: COLORS[i % COLORS.length] }}>
                    Step {step.stepNumber}
                  </span>
                  <span className="text-sm font-semibold text-white">{step.strategyName}</span>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-3">{step.action}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <p className="text-[10px] text-gray-500">Amount Deployed</p>
                  <p className="text-sm font-semibold text-blue-400">{formatFullMoney(step.amountDeployed)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500">Tax Saved</p>
                  <p className="text-sm font-semibold text-yellow-400">{formatFullMoney(step.taxSaved)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500">Net Worth Before</p>
                  <p className="text-sm font-semibold text-gray-300">{formatFullMoney(step.netWorthBefore)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500">Net Worth After</p>
                  <p className="text-sm font-semibold text-emerald-400">{formatFullMoney(step.netWorthAfter)}</p>
                </div>
              </div>
              {step.ircCodes && step.ircCodes.length > 0 && (
                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                  <Scale className="w-3 h-3 text-gray-500" />
                  {step.ircCodes.map((code: string, j: number) => (
                    <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/10">
                      {code}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Time Horizon */}
      {combo.timeHorizon && (
        <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 p-4 text-center">
          <p className="text-sm text-emerald-400 font-semibold">Estimated Time Horizon: {combo.timeHorizon}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        {combo.id > 1 && (
          <Link href={`/portal/tax-combos/${combo.id - 1}`} className="text-sm text-gray-400 hover:text-emerald-400 transition-colors">
            ← Combo #{combo.id - 1}
          </Link>
        )}
        <div className="flex-1" />
        {combo.id < 100 && (
          <Link href={`/portal/tax-combos/${combo.id + 1}`} className="text-sm text-gray-400 hover:text-emerald-400 transition-colors">
            Combo #{combo.id + 1} →
          </Link>
        )}
      </div>

      {/* Disclaimer */}
      <div className="rounded-xl border border-yellow-500/10 bg-yellow-500/5 p-4">
        <p className="text-[10px] text-yellow-600/80 leading-relaxed">
          <strong>Disclaimer:</strong> The strategies, dollar amounts, and tax projections shown are illustrative examples for educational purposes only.
          They do not constitute financial, tax, or legal advice. Individual results will vary based on personal circumstances, market conditions,
          and applicable tax laws. Always consult with qualified financial, tax, and legal professionals before implementing any strategy.
          IRS codes cited are for reference only and may be subject to change.
        </p>
      </div>
    </div>
  );
}
