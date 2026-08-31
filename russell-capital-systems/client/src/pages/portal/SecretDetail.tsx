import { useState, useMemo } from "react";
import { useParams, Link } from "wouter";
import {
  ArrowLeft, TrendingUp, DollarSign, Shield, User, MapPin, Briefcase, Calendar,
  Scale, Zap, Tag, BookOpen, Calculator, PiggyBank, FileText, Target,
  ChevronDown, ChevronUp, Activity, BarChart3, Home, Landmark
} from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, ComposedChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import strategiesData from "@/data/strategies.json";
import { PDFExportButton } from "@/components/PDFExport";

const COLORS = ["#a855f7", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#84cc16", "#f97316", "#6366f1"];

function formatMoney(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function formatFullMoney(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function getImpactColor(score: number) {
  if (score >= 12) return { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20", hex: "#ef4444" };
  if (score >= 11) return { text: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20", hex: "#f59e0b" };
  if (score >= 10) return { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", hex: "#22c55e" };
  if (score >= 9) return { text: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", hex: "#3b82f6" };
  return { text: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", hex: "#a855f7" };
}

/* ─── ROI Calculator ─── */
function ROICalculator({ strategy }: { strategy: any }) {
  const cp = strategy.clientProfile;
  const [years, setYears] = useState(10);
  const [annualReturn, setAnnualReturn] = useState(8);

  const projections = useMemo(() => {
    const data = [];
    let withStrategy = strategy.finalNetWorth || cp?.startingNetWorth || 5000000;
    let withoutStrategy = cp?.startingNetWorth || 5000000;
    const taxRate = 0.37;
    const annualTaxSaved = (strategy.totalTaxSaved || 0) / Math.max(years, 1);

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
  }, [years, annualReturn, strategy]);

  const finalDiff = projections[projections.length - 1];
  const startNW = strategy.clientProfile?.startingNetWorth || 5000000;
  const roiPct = ((finalDiff.withStrategy - finalDiff.withoutStrategy) / startNW * 100).toFixed(1);

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <Calculator className="w-4 h-4 text-purple-400" /> ROI Projection Calculator
      </h3>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <label className="text-[10px] text-gray-500 block mb-1">Years to Project</label>
          <input type="range" min={5} max={50} value={years} onChange={(e) => setYears(Number(e.target.value))} className="w-full accent-purple-500" />
          <span className="text-xs text-purple-400">{years} years</span>
        </div>
        <div>
          <label className="text-[10px] text-gray-500 block mb-1">Annual Return %</label>
          <input type="range" min={4} max={15} step={0.5} value={annualReturn} onChange={(e) => setAnnualReturn(Number(e.target.value))} className="w-full accent-blue-500" />
          <span className="text-xs text-blue-400">{annualReturn}%</span>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-gray-500 mb-1">Strategy ROI Advantage</p>
          <p className="text-2xl font-bold text-purple-400">+{roiPct}%</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={projections}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 10 }} interval={Math.max(1, Math.floor(years / 8))} />
          <YAxis tickFormatter={(v) => formatMoney(v)} tick={{ fill: "#94a3b8", fontSize: 10 }} />
          <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }} formatter={(value: number) => [formatFullMoney(value), ""]} />
          <Area type="monotone" dataKey="withStrategy" stroke="#a855f7" fill="#a855f7" fillOpacity={0.12} strokeWidth={2} name="With Strategy" />
          <Area type="monotone" dataKey="withoutStrategy" stroke="#ef4444" fill="#ef4444" fillOpacity={0.08} strokeWidth={2} name="Without Strategy" />
        </AreaChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-3 gap-3 mt-3">
        <div className="rounded-lg bg-purple-500/10 border border-purple-500/20 p-2 text-center">
          <p className="text-[10px] text-gray-500">With Strategy ({years}yr)</p>
          <p className="text-sm font-bold text-purple-400">{formatMoney(finalDiff.withStrategy)}</p>
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
function TaxBracketCalculator({ strategy }: { strategy: any }) {
  const income = strategy.clientProfile?.annualIncome || 850000;
  const taxSaved = strategy.totalTaxSaved || 0;

  const brackets = [
    { rate: 10, min: 0, max: 22000, color: "#22c55e" },
    { rate: 12, min: 22001, max: 89450, color: "#84cc16" },
    { rate: 22, min: 89451, max: 190750, color: "#f59e0b" },
    { rate: 24, min: 190751, max: 364200, color: "#f97316" },
    { rate: 32, min: 364201, max: 462500, color: "#ef4444" },
    { rate: 35, min: 462501, max: 693750, color: "#dc2626" },
    { rate: 37, min: 693751, max: Infinity, color: "#991b1b" },
  ];

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

  const originalTax = calcTax(income);
  const reducedTax = calcTax(reducedIncome);
  const actualSavings = originalTax - reducedTax;

  const bracketData = brackets.map(b => ({
    bracket: `${b.rate}%`,
    original: Math.min(Math.max(income - b.min, 0), b.max - b.min) * b.rate / 100,
    reduced: Math.min(Math.max(reducedIncome - b.min, 0), b.max - b.min) * b.rate / 100,
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
          <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }} formatter={(value: number) => [formatFullMoney(value), ""]} />
          <Bar dataKey="original" name="Before Strategy" fill="#ef4444" fillOpacity={0.6} radius={[0, 4, 4, 0]} />
          <Bar dataKey="reduced" name="After Strategy" fill="#22c55e" fillOpacity={0.6} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─── Fact Finder ─── */
function FactFinder({ strategy }: { strategy: any }) {
  const [expanded, setExpanded] = useState(false);
  const cp = strategy.clientProfile;
  const steps = strategy.steps || [];
  const totalDeployed = steps.reduce((s: number, st: any) => s + (st.dollarAmount || 0), 0);
  const totalTaxSaved = strategy.totalTaxSaved || steps.reduce((s: number, st: any) => s + (st.taxSaved || 0), 0);
  const netGrowth = (strategy.finalNetWorth || 0) - (cp?.startingNetWorth || 0);
  const growthPct = cp?.startingNetWorth ? ((netGrowth / cp.startingNetWorth) * 100).toFixed(1) : "0";
  const taxEfficiency = totalDeployed > 0 ? ((totalTaxSaved / totalDeployed) * 100).toFixed(1) : "0";

  return (
    <div className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent p-5">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between text-sm font-semibold text-white">
        <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-purple-400" /> Client Fact Finder</span>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {expanded && (
        <div className="mt-4 space-y-4">
          <div>
            <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">Client Demographics</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: "Client Name", value: cp?.name },
                { label: "Profession", value: cp?.profession },
                { label: "Age", value: cp?.age },
                { label: "Family Status", value: cp?.familyStatus || "Married, 2 children" },
                { label: "State", value: cp?.state },
                { label: "Tax Bracket", value: cp?.taxBracket || "37% Federal" },
              ].map((item, i) => (
                <div key={i} className="rounded-lg bg-white/5 border border-white/10 p-3">
                  <p className="text-[10px] text-gray-500">{item.label}</p>
                  <p className="text-sm text-white font-medium">{item.value || "N/A"}</p>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">Financial Snapshot</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                <p className="text-[10px] text-gray-500">Annual Income</p>
                <p className="text-sm text-white font-medium">{formatFullMoney(cp?.annualIncome || 0)}</p>
              </div>
              <div className="rounded-lg bg-white/5 border border-white/10 p-3">
                <p className="text-[10px] text-gray-500">Starting Net Worth</p>
                <p className="text-sm text-white font-medium">{formatFullMoney(cp?.startingNetWorth || 0)}</p>
              </div>
              <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3">
                <p className="text-[10px] text-gray-500">Final Net Worth</p>
                <p className="text-sm text-emerald-400 font-medium">{formatFullMoney(strategy.finalNetWorth || 0)}</p>
              </div>
              <div className="rounded-lg bg-yellow-500/5 border border-yellow-500/20 p-3">
                <p className="text-[10px] text-gray-500">Total Tax Saved</p>
                <p className="text-sm text-yellow-400 font-medium">{formatFullMoney(totalTaxSaved)}</p>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">Strategy Performance</h4>
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
                <p className="text-[10px] text-gray-500">Total Deployed</p>
                <p className="text-sm text-white font-bold">{formatFullMoney(totalDeployed)}</p>
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">Goals & Objectives</h4>
            <div className="space-y-2">
              {[
                { goal: "Minimize federal & state income tax liability", status: "achieved" },
                { goal: "Grow net worth through tax-advantaged vehicles", status: "achieved" },
                { goal: "Protect assets from estate taxation", status: "achieved" },
                { goal: "Create multi-generational wealth transfer", status: "in-progress" },
                { goal: "Establish tax-free retirement income streams", status: "in-progress" },
              ].map((g, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className={`text-xs w-5 h-5 rounded-full flex items-center justify-center ${g.status === "achieved" ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                    {g.status === "achieved" ? "✓" : "→"}
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
export default function SecretDetail() {
  const params = useParams();
  const id = Number(params?.id);
  const strategy = (strategiesData as any[]).find((s) => s.id === id);

  if (!strategy) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <p className="text-gray-400">Strategy not found</p>
        <Link href="/portal/secret-secrets" className="text-purple-400 hover:underline text-sm">Back to all secrets</Link>
      </div>
    );
  }

  const impact = getImpactColor(strategy.impactScore);
  const cp = strategy.clientProfile;
  const steps = strategy.steps || [];
  const hasFinancialData = steps.length > 0 && steps[0]?.dollarAmount !== undefined;

  // Chart data
  const netWorthData = hasFinancialData ? steps.map((s: any) => ({
    name: `Step ${s.stepNumber}`,
    netWorth: s.netWorthAfter,
    taxSaved: s.taxSaved,
  })) : [];

  const taxSavingsData = hasFinancialData ? steps.map((s: any) => ({
    name: `S${s.stepNumber}`,
    taxSaved: s.taxSaved,
    action: s.action?.substring(0, 50),
  })) : [];

  const deploymentData = hasFinancialData ? steps.map((s: any, i: number) => ({
    name: `Step ${s.stepNumber}`,
    value: s.dollarAmount,
    color: COLORS[i % COLORS.length],
  })) : [];

  const cumulativeData = hasFinancialData ? steps.reduce((acc: any[], s: any) => {
    const prev = acc.length > 0 ? acc[acc.length - 1] : { cumTax: 0 };
    acc.push({
      name: `Step ${s.stepNumber}`,
      cumTax: prev.cumTax + (s.taxSaved || 0),
      netWorth: s.netWorthAfter,
      cumGrowth: s.netWorthAfter - (cp?.startingNetWorth || 0),
    });
    return acc;
  }, []) : [];

  // 50-Year projection
  const yearProjection = useMemo(() => {
    const data = [];
    let nw = strategy.finalNetWorth || cp?.startingNetWorth || 5000000;
    const annualGrowth = 0.07;
    const annualTaxSaving = (strategy.totalTaxSaved || 0) * 0.15;

    for (let y = 0; y <= 50; y++) {
      data.push({
        year: `Yr ${y}`,
        netWorth: Math.round(nw),
        taxFreeIncome: Math.round(nw * 0.04),
      });
      nw = nw * (1 + annualGrowth) + annualTaxSaving;
    }
    return data;
  }, [strategy]);

  // Strategy effectiveness radar
  const radarData = hasFinancialData ? [
    { metric: "Tax Savings", value: Math.min(100, ((strategy.totalTaxSaved || 0) / ((cp?.startingNetWorth || 5000000) * 0.15)) * 100) },
    { metric: "Net Growth", value: Math.min(100, (((strategy.finalNetWorth || 0) - (cp?.startingNetWorth || 0)) / (cp?.startingNetWorth || 5000000)) * 200) },
    { metric: "Diversification", value: Math.min(100, steps.length * 15) },
    { metric: "Tax Efficiency", value: Math.min(100, ((strategy.totalTaxSaved || 0) / Math.max(steps.reduce((s: number, st: any) => s + (st.dollarAmount || 0), 0), 1)) * 300) },
    { metric: "Asset Protection", value: Math.min(100, 60 + steps.length * 5) },
    { metric: "Legacy Planning", value: Math.min(100, 50 + (strategy.netWorthMultiplier || 1) * 20) },
  ] : [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Back nav */}
      <div className="flex items-center justify-between">
        <Link href="/portal/secret-secrets" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-purple-400 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Secret Strategies
        </Link>
        <PDFExportButton data={strategy} type="strategy" />
      </div>

      {/* Header */}
      <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-[#1a0d2e] via-[#0a1628] to-[#1a0d2e] p-6 md:p-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-bold text-purple-400">Secret #{strategy.id}</span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${impact.text} ${impact.bg} ${impact.border}`}>
            <Zap className="w-3 h-3" /> Impact: {strategy.impactScore}/12
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-4">{strategy.title}</h1>

        {/* Categories */}
        <div className="flex items-center gap-2 flex-wrap mb-6">
          {strategy.categories?.map((cat: string) => (
            <span key={cat} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 text-gray-300 text-xs border border-white/10">
              <Tag className="w-3 h-3" /> {cat}
            </span>
          ))}
        </div>

        {/* Client Profile */}
        {cp && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <div><p className="text-[10px] text-gray-500">Client</p><p className="text-sm text-white">{cp.name}</p></div>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <div><p className="text-[10px] text-gray-500">Profession</p><p className="text-sm text-white">{cp.profession}</p></div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div><p className="text-[10px] text-gray-500">Age</p><p className="text-sm text-white">{cp.age}</p></div>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-yellow-400 flex-shrink-0" />
              <div><p className="text-[10px] text-gray-500">State</p><p className="text-sm text-white">{cp.state}</p></div>
            </div>
          </div>
        )}

        {/* Property & Mortgage Info */}
        {cp?.houseValue && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-center">
              <Home className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-cyan-400">{formatMoney(cp.houseValue)}</p>
              <p className="text-[10px] text-gray-500">House Value</p>
            </div>
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-center">
              <Landmark className="w-4 h-4 text-red-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-red-400">{formatMoney(cp.originalMortgage || 0)}</p>
              <p className="text-[10px] text-gray-500">Original Mortgage</p>
            </div>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
              <TrendingUp className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-emerald-400">{formatMoney(cp.homeEquity || 0)}</p>
              <p className="text-[10px] text-gray-500">Home Equity</p>
            </div>
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-3 text-center">
              <Shield className="w-4 h-4 text-green-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-green-400">$0</p>
              <p className="text-[10px] text-gray-500">Final Mortgage</p>
            </div>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {cp?.startingNetWorth && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
              <p className="text-lg font-bold text-white">{formatMoney(cp.startingNetWorth)}</p>
              <p className="text-[10px] text-gray-500">Starting Net Worth</p>
            </div>
          )}
          {strategy.finalNetWorth && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
              <p className="text-lg font-bold text-emerald-400">{formatMoney(strategy.finalNetWorth)}</p>
              <p className="text-[10px] text-gray-500">Final Net Worth</p>
            </div>
          )}
          {strategy.totalTaxSaved && (
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3 text-center">
              <p className="text-lg font-bold text-yellow-400">{formatMoney(strategy.totalTaxSaved)}</p>
              <p className="text-[10px] text-gray-500">Total Tax Saved</p>
            </div>
          )}
          {strategy.netWorthMultiplier && (
            <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-3 text-center">
              <p className="text-lg font-bold text-purple-400">{strategy.netWorthMultiplier}x</p>
              <p className="text-[10px] text-gray-500">Net Worth Multiplier</p>
            </div>
          )}
        </div>
      </div>

      {/* Fact Finder */}
      {cp && <FactFinder strategy={strategy} />}

      {/* Strategy Description */}
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-purple-400" /> Strategy Deep Dive
        </h3>
        <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{strategy.description}</p>
        {strategy.ircCodes && strategy.ircCodes.length > 0 && (
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <Scale className="w-4 h-4 text-gray-500" />
            <span className="text-xs text-gray-500">IRC References:</span>
            {strategy.ircCodes.map((code: string, i: number) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                §{code}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Charts */}
      {hasFinancialData && (
        <>
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
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }} formatter={(value: number) => [formatFullMoney(value), ""]} />
                  <Area type="monotone" dataKey="netWorth" stroke="#a855f7" fill="#a855f7" fillOpacity={0.15} strokeWidth={2} name="Net Worth" />
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
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }} formatter={(value: number) => [formatFullMoney(value), "Tax Saved"]} />
                  <Bar dataKey="taxSaved" name="Tax Saved" radius={[4, 4, 0, 0]}>
                    {taxSavingsData.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cumulative Tax Savings vs Net Worth Growth */}
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
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }} formatter={(value: number) => [formatFullMoney(value), ""]} />
                <Area yAxisId="left" type="monotone" dataKey="cumGrowth" stroke="#a855f7" fill="#a855f7" fillOpacity={0.1} strokeWidth={2} name="Net Worth Growth" />
                <Line yAxisId="right" type="monotone" dataKey="cumTax" stroke="#f59e0b" strokeWidth={2} dot={{ fill: "#f59e0b", r: 3 }} name="Cumulative Tax Saved" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Capital Deployment Pie + Strategy Radar */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-blue-400" /> Capital Deployment Breakdown
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={deploymentData} cx="50%" cy="50%" innerRadius={55} outerRadius={100} dataKey="value" nameKey="name"
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {deploymentData.map((entry: any, i: number) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }} formatter={(value: number) => [formatFullMoney(value), "Deployed"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-cyan-400" /> Strategy Effectiveness Score
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#1e293b" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <PolarRadiusAxis tick={false} domain={[0, 100]} />
                  <Radar name="Score" dataKey="value" stroke="#a855f7" fill="#a855f7" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 50-Year Net Worth Projection */}
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
            <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-400" /> 50-Year Net Worth Projection
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={yearProjection}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 10 }} interval={9} />
                <YAxis tickFormatter={(v) => formatMoney(v)} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }} formatter={(value: number) => [formatFullMoney(value), ""]} />
                <Area type="monotone" dataKey="netWorth" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.12} strokeWidth={2} name="Projected Net Worth" />
                <Area type="monotone" dataKey="taxFreeIncome" stroke="#22c55e" fill="#22c55e" fillOpacity={0.08} strokeWidth={1.5} name="Tax-Free Income (4%)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {/* Calculators */}
      {hasFinancialData && (
        <>
          <ROICalculator strategy={strategy} />
          <TaxBracketCalculator strategy={strategy} />
        </>
      )}

      {/* Implementation Steps */}
      {hasFinancialData && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Implementation Steps</h2>
          {steps.map((step: any, i: number) => (
            <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-5 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              <div className="pl-4">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] + "20", color: COLORS[i % COLORS.length] }}>
                    Step {step.stepNumber}
                  </span>
                </div>
                <p className="text-sm text-gray-300 mb-3 leading-relaxed">{step.action}</p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  <div>
                    <p className="text-[10px] text-gray-500">Capital Deployed</p>
                    <p className="text-sm font-semibold text-blue-400">{formatFullMoney(step.dollarAmount)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">Tax Saved</p>
                    <p className="text-sm font-semibold text-yellow-400">{formatFullMoney(step.taxSaved)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500">Net Worth After</p>
                    <p className="text-sm font-semibold text-emerald-400">{formatFullMoney(step.netWorthAfter)}</p>
                  </div>
                  {step.helocDraw != null && (
                    <div>
                      <p className="text-[10px] text-gray-500">HELOC Draw</p>
                      <p className="text-sm font-semibold text-cyan-400">{formatFullMoney(step.helocDraw)}</p>
                    </div>
                  )}
                  {step.mortgageBalance != null && (
                    <div>
                      <p className="text-[10px] text-gray-500">Mortgage Balance</p>
                      <p className={`text-sm font-semibold ${step.mortgageBalance === 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {step.mortgageBalance === 0 ? '✓ PAID OFF' : formatFullMoney(step.mortgageBalance)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Time Horizon */}
      {strategy.timeHorizon && (
        <div className="rounded-xl border border-purple-500/10 bg-purple-500/5 p-4 text-center">
          <p className="text-sm text-purple-400 font-semibold">Estimated Time Horizon: {strategy.timeHorizon}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        {strategy.id > 1 && (
          <Link href={`/portal/secret-secrets/${strategy.id - 1}`} className="text-sm text-gray-400 hover:text-purple-400 transition-colors">
            ← Secret #{strategy.id - 1}
          </Link>
        )}
        <div className="flex-1" />
        {strategy.id < 100 && (
          <Link href={`/portal/secret-secrets/${strategy.id + 1}`} className="text-sm text-gray-400 hover:text-purple-400 transition-colors">
            Secret #{strategy.id + 1} →
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
