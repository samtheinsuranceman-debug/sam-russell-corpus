import { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  User, DollarSign, MapPin, Briefcase, Target, TrendingUp, Shield,
  ArrowRight, Sparkles, Scale, ChevronDown, ChevronUp, Star, Zap, Search
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import strategiesData from "@/data/strategies.json";
import combosData from "@/data/combos.json";

const COLORS = ["#22c55e", "#3b82f6", "#a855f7", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899"];

function formatMoney(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function formatFullMoney(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

const PROFESSIONS = [
  "Physician / Surgeon", "Dentist / Specialist", "Attorney / Law Partner", "Business Owner",
  "Real Estate Investor", "Tech Executive / Founder", "Financial Professional", "Engineer / Architect",
  "Franchise Owner", "Consultant / Advisor", "Entertainment / Media", "Pharmaceutical / Biotech",
  "Construction / Contractor", "Energy / Oil & Gas", "Agriculture / Farming", "Other"
];

const STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
  "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
  "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
  "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
  "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
  "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
  "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
];

const GOALS = [
  { id: "tax_reduction", label: "Reduce Tax Burden", icon: Shield },
  { id: "wealth_growth", label: "Grow Net Worth", icon: TrendingUp },
  { id: "estate_planning", label: "Estate Planning", icon: Scale },
  { id: "retirement", label: "Retirement Income", icon: DollarSign },
  { id: "real_estate", label: "Real Estate Strategies", icon: MapPin },
  { id: "business", label: "Business Optimization", icon: Briefcase },
];

const CATEGORY_MAP: Record<string, string[]> = {
  tax_reduction: ["Tax", "Trusts", "Charitable"],
  wealth_growth: ["Insurance", "Annuities", "Leverage", "Crypto"],
  estate_planning: ["Estate Planning", "Trusts"],
  retirement: ["Retirement", "Annuities", "Insurance"],
  real_estate: ["Real Estate", "Leverage"],
  business: ["Business", "Energy", "Tax"],
};

interface FormData {
  name: string;
  age: string;
  profession: string;
  state: string;
  netWorth: string;
  annualIncome: string;
  familyStatus: string;
  goals: string[];
}

interface Recommendation {
  type: "strategy" | "combo";
  id: number;
  title: string;
  matchScore: number;
  matchReasons: string[];
  taxSaved: number;
  finalNetWorth: number;
  startingNetWorth: number;
  steps: number;
  categories: string[];
  clientProfile: any;
}

function computeRecommendations(form: FormData): Recommendation[] {
  const nw = parseFloat(form.netWorth) || 5000000;
  const income = parseFloat(form.annualIncome) || 500000;
  const age = parseInt(form.age) || 50;
  const goalCategories = form.goals.flatMap(g => CATEGORY_MAP[g] || []);

  const allItems: Recommendation[] = [];

  // Score strategies
  (strategiesData as any[]).forEach(s => {
    let score = 0;
    const reasons: string[] = [];

    // Net worth proximity (within 50% range)
    const nwDiff = Math.abs(s.clientProfile.startingNetWorth - nw) / nw;
    if (nwDiff < 0.2) { score += 30; reasons.push("Net worth closely matches"); }
    else if (nwDiff < 0.5) { score += 20; reasons.push("Similar net worth range"); }
    else if (nwDiff < 1.0) { score += 10; reasons.push("Comparable net worth tier"); }

    // Category match
    const cats = s.categories || [];
    const catMatches = cats.filter((c: string) => goalCategories.includes(c));
    if (catMatches.length > 0) {
      score += catMatches.length * 15;
      reasons.push(`Matches goals: ${catMatches.join(", ")}`);
    }

    // State match
    if (s.clientProfile.state === form.state) {
      score += 10;
      reasons.push("Same state of residence");
    }

    // Age proximity
    const ageDiff = Math.abs(s.clientProfile.age - age);
    if (ageDiff <= 5) { score += 10; reasons.push("Similar age bracket"); }
    else if (ageDiff <= 10) { score += 5; reasons.push("Close age range"); }

    // Profession similarity
    const profLower = form.profession.toLowerCase();
    const clientProfLower = s.clientProfile.profession.toLowerCase();
    if (profLower.includes("physician") || profLower.includes("surgeon") || profLower.includes("dentist")) {
      if (clientProfLower.includes("doctor") || clientProfLower.includes("surgeon") || clientProfLower.includes("physician") || clientProfLower.includes("dentist") || clientProfLower.includes("medical")) {
        score += 15;
        reasons.push("Medical professional match");
      }
    }
    if (profLower.includes("attorney") || profLower.includes("law")) {
      if (clientProfLower.includes("attorney") || clientProfLower.includes("law")) {
        score += 15;
        reasons.push("Legal professional match");
      }
    }
    if (profLower.includes("business") || profLower.includes("owner")) {
      if (clientProfLower.includes("owner") || clientProfLower.includes("ceo") || clientProfLower.includes("founder")) {
        score += 15;
        reasons.push("Business owner match");
      }
    }
    if (profLower.includes("real estate")) {
      if (clientProfLower.includes("real estate") || clientProfLower.includes("property")) {
        score += 15;
        reasons.push("Real estate professional match");
      }
    }
    if (profLower.includes("tech") || profLower.includes("founder")) {
      if (clientProfLower.includes("tech") || clientProfLower.includes("startup") || clientProfLower.includes("fintech") || clientProfLower.includes("cyber") || clientProfLower.includes("ai")) {
        score += 15;
        reasons.push("Tech industry match");
      }
    }

    // Tax savings relative to net worth
    const taxEfficiency = s.totalTaxSaved / s.clientProfile.startingNetWorth;
    if (taxEfficiency > 0.05) { score += 5; reasons.push("High tax efficiency"); }

    allItems.push({
      type: "strategy",
      id: s.id,
      title: s.title,
      matchScore: Math.min(score, 100),
      matchReasons: reasons,
      taxSaved: s.totalTaxSaved,
      finalNetWorth: s.finalNetWorth,
      startingNetWorth: s.clientProfile.startingNetWorth,
      steps: s.steps.length,
      categories: s.categories || [],
      clientProfile: s.clientProfile,
    });
  });

  // Score combos
  (combosData as any[]).forEach(c => {
    let score = 0;
    const reasons: string[] = [];

    const nwDiff = Math.abs(c.clientProfile.startingNetWorth - nw) / nw;
    if (nwDiff < 0.2) { score += 30; reasons.push("Net worth closely matches"); }
    else if (nwDiff < 0.5) { score += 20; reasons.push("Similar net worth range"); }
    else if (nwDiff < 1.0) { score += 10; reasons.push("Comparable net worth tier"); }

    // Combos get a bonus for being comprehensive
    score += 10;
    reasons.push("Multi-strategy combo (comprehensive)");

    if (c.steps.length >= 8) { score += 5; reasons.push("8+ step comprehensive plan"); }

    if (c.clientProfile.state === form.state) {
      score += 10;
      reasons.push("Same state of residence");
    }

    const ageDiff = Math.abs(c.clientProfile.age - age);
    if (ageDiff <= 5) { score += 10; reasons.push("Similar age bracket"); }
    else if (ageDiff <= 10) { score += 5; reasons.push("Close age range"); }

    const taxEfficiency = c.totalTaxSaved / c.clientProfile.startingNetWorth;
    if (taxEfficiency > 0.03) { score += 5; reasons.push("Strong tax savings"); }

    allItems.push({
      type: "combo",
      id: c.id,
      title: c.comboName,
      matchScore: Math.min(score, 100),
      matchReasons: reasons,
      taxSaved: c.totalTaxSaved,
      finalNetWorth: c.finalNetWorth,
      startingNetWorth: c.clientProfile.startingNetWorth,
      steps: c.steps.length,
      categories: [],
      clientProfile: c.clientProfile,
    });
  });

  return allItems.sort((a, b) => b.matchScore - a.matchScore);
}

export default function ClientIntakeRecommender() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    name: "",
    age: "",
    profession: "",
    state: "",
    netWorth: "",
    annualIncome: "",
    familyStatus: "",
    goals: [],
  });
  const [showResults, setShowResults] = useState(false);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const recommendations = useMemo(() => {
    if (!showResults) return [];
    return computeRecommendations(form);
  }, [form, showResults]);

  const topRecs = recommendations.slice(0, 10);

  const toggleGoal = (goalId: string) => {
    setForm(prev => ({
      ...prev,
      goals: prev.goals.includes(goalId)
        ? prev.goals.filter(g => g !== goalId)
        : [...prev.goals, goalId],
    }));
  };

  const canProceed = () => {
    if (step === 1) return form.name && form.age && form.profession;
    if (step === 2) return form.state && form.netWorth && form.annualIncome;
    if (step === 3) return form.goals.length > 0;
    return true;
  };

  const handleSubmit = () => {
    setShowResults(true);
    setStep(4);
  };

  /* ─── Chart Data ─── */
  const taxSavedChart = useMemo(() => {
    return topRecs.slice(0, 5).map((r, i) => ({
      name: `${r.type === "strategy" ? "S" : "C"}#${r.id}`,
      taxSaved: r.taxSaved,
      fill: COLORS[i],
    }));
  }, [topRecs]);

  const categoryBreakdown = useMemo(() => {
    const catCount: Record<string, number> = {};
    topRecs.forEach(r => {
      r.categories.forEach(c => {
        catCount[c] = (catCount[c] || 0) + 1;
      });
    });
    return Object.entries(catCount).map(([name, value]) => ({ name, value }));
  }, [topRecs]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-[#0d1a2e] via-[#0a1628] to-[#0d2e1a] p-6 md:p-8">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-6 h-6 text-cyan-400" />
          <h1 className="text-2xl md:text-3xl font-bold text-white">Client Strategy Recommender</h1>
        </div>
        <p className="text-gray-400 text-sm max-w-2xl">
          Enter your client's profile and financial goals. Our AI engine will analyze all 200 strategies and combos
          to recommend the best-fit approaches ranked by match score.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              s < step ? "bg-cyan-500 text-white" :
              s === step ? "bg-cyan-500/20 text-cyan-400 border-2 border-cyan-500" :
              "bg-gray-800 text-gray-500 border border-gray-700"
            }`}>
              {s < step ? "✓" : s}
            </div>
            {s < 4 && <div className={`w-12 h-0.5 ${s < step ? "bg-cyan-500" : "bg-gray-700"}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Personal Info */}
      {step === 1 && !showResults && (
        <div className="rounded-xl border border-gray-700/50 bg-slate-900/50 p-6 space-y-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-cyan-400" /> Step 1: Client Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1 font-semibold">Client Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., The Harrison Family"
                className="w-full bg-slate-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 font-semibold">Age</label>
              <input
                type="number"
                value={form.age}
                onChange={e => setForm({ ...form, age: e.target.value })}
                placeholder="e.g., 52"
                className="w-full bg-slate-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 font-semibold">Profession</label>
              <select
                value={form.profession}
                onChange={e => setForm({ ...form, profession: e.target.value })}
                className="w-full bg-slate-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="">Select profession...</option>
                {PROFESSIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1 font-semibold">Family Status</label>
            <input
              type="text"
              value={form.familyStatus}
              onChange={e => setForm({ ...form, familyStatus: e.target.value })}
              placeholder="e.g., Married, 3 children"
              className="w-full bg-slate-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => canProceed() && setStep(2)}
              disabled={!canProceed()}
              className="px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold text-sm flex items-center gap-2 transition-colors"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Financial Info */}
      {step === 2 && !showResults && (
        <div className="rounded-xl border border-gray-700/50 bg-slate-900/50 p-6 space-y-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" /> Step 2: Financial Profile
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1 font-semibold">State of Residence</label>
              <select
                value={form.state}
                onChange={e => setForm({ ...form, state: e.target.value })}
                className="w-full bg-slate-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="">Select state...</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 font-semibold">Net Worth ($)</label>
              <input
                type="number"
                value={form.netWorth}
                onChange={e => setForm({ ...form, netWorth: e.target.value })}
                placeholder="e.g., 8000000"
                className="w-full bg-slate-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
              />
              {form.netWorth && (
                <p className="text-xs text-cyan-400 mt-1">{formatFullMoney(parseFloat(form.netWorth) || 0)}</p>
              )}
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1 font-semibold">Annual Income ($)</label>
              <input
                type="number"
                value={form.annualIncome}
                onChange={e => setForm({ ...form, annualIncome: e.target.value })}
                placeholder="e.g., 750000"
                className="w-full bg-slate-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
              />
              {form.annualIncome && (
                <p className="text-xs text-cyan-400 mt-1">{formatFullMoney(parseFloat(form.annualIncome) || 0)}</p>
              )}
            </div>
          </div>
          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">← Back</button>
            <button
              onClick={() => canProceed() && setStep(3)}
              disabled={!canProceed()}
              className="px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold text-sm flex items-center gap-2 transition-colors"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Goals */}
      {step === 3 && !showResults && (
        <div className="rounded-xl border border-gray-700/50 bg-slate-900/50 p-6 space-y-5">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-400" /> Step 3: Financial Goals
          </h2>
          <p className="text-sm text-gray-400">Select all goals that apply to this client:</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {GOALS.map(goal => {
              const isSelected = form.goals.includes(goal.id);
              const Icon = goal.icon;
              return (
                <button
                  key={goal.id}
                  onClick={() => toggleGoal(goal.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? "border-cyan-500 bg-cyan-500/10"
                      : "border-gray-700 bg-slate-800/50 hover:border-gray-600"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isSelected ? "text-cyan-400" : "text-gray-500"}`} />
                    <span className={`text-sm font-semibold ${isSelected ? "text-white" : "text-gray-400"}`}>
                      {goal.label}
                    </span>
                    {isSelected && <Star className="w-4 h-4 text-cyan-400 ml-auto" />}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">← Back</button>
            <button
              onClick={handleSubmit}
              disabled={!canProceed()}
              className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-600 hover:to-emerald-600 disabled:from-gray-700 disabled:to-gray-700 disabled:text-gray-500 text-white font-bold text-sm flex items-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4" /> Generate Recommendations
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Results */}
      {showResults && (
        <>
          {/* Client Summary */}
          <div className="rounded-xl border border-cyan-500/20 bg-slate-900/50 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-cyan-400" /> Client Profile Summary
              </h2>
              <button
                onClick={() => { setShowResults(false); setStep(1); }}
                className="text-xs text-gray-400 hover:text-cyan-400 transition-colors"
              >
                Edit Profile →
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div><span className="text-gray-500">Name:</span> <span className="text-white font-semibold">{form.name}</span></div>
              <div><span className="text-gray-500">Age:</span> <span className="text-white font-semibold">{form.age}</span></div>
              <div><span className="text-gray-500">Profession:</span> <span className="text-white font-semibold">{form.profession}</span></div>
              <div><span className="text-gray-500">State:</span> <span className="text-white font-semibold">{form.state}</span></div>
              <div><span className="text-gray-500">Net Worth:</span> <span className="text-emerald-400 font-semibold">{formatFullMoney(parseFloat(form.netWorth) || 0)}</span></div>
              <div><span className="text-gray-500">Income:</span> <span className="text-blue-400 font-semibold">{formatFullMoney(parseFloat(form.annualIncome) || 0)}</span></div>
              <div><span className="text-gray-500">Family:</span> <span className="text-white font-semibold">{form.familyStatus || "N/A"}</span></div>
              <div><span className="text-gray-500">Goals:</span> <span className="text-cyan-400 font-semibold">{form.goals.length} selected</span></div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top 5 Tax Savings */}
            <div className="rounded-xl border border-gray-700/50 bg-slate-900/50 p-5">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" /> Top 5 — Projected Tax Savings
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={taxSavedChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={v => formatMoney(v)} />
                  <Tooltip
                    contentStyle={{ background: "#1e293b", border: "1px solid #475569", borderRadius: "8px" }}
                    formatter={(v: number) => formatFullMoney(v)}
                  />
                  <Bar dataKey="taxSaved" radius={[4, 4, 0, 0]}>
                    {taxSavedChart.map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Category Breakdown */}
            {categoryBreakdown.length > 0 && (
              <div className="rounded-xl border border-gray-700/50 bg-slate-900/50 p-5">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-400" /> Recommended Category Mix
                </h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryBreakdown.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "#1e293b", border: "1px solid #475569", borderRadius: "8px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {categoryBreakdown.map((c, i) => (
                    <span key={c.name} className="text-[10px] flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-gray-400">{c.name} ({c.value})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recommendations List */}
          <div className="rounded-xl border border-gray-700/50 bg-slate-900/50 overflow-hidden">
            <div className="p-4 border-b border-gray-700/50">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" /> Top 10 Recommended Strategies
              </h2>
              <p className="text-xs text-gray-500 mt-1">Ranked by match score based on client profile and goals</p>
            </div>
            <div className="divide-y divide-gray-800/50">
              {topRecs.map((rec, idx) => (
                <div key={`${rec.type}-${rec.id}`} className="hover:bg-slate-800/30 transition-colors">
                  <div
                    className="p-4 cursor-pointer flex items-center gap-4"
                    onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                  >
                    {/* Rank */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx === 0 ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                      idx === 1 ? "bg-gray-400/20 text-gray-300 border border-gray-400/30" :
                      idx === 2 ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" :
                      "bg-gray-800 text-gray-500 border border-gray-700"
                    }`}>
                      {idx + 1}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          rec.type === "strategy" ? "bg-purple-500/20 text-purple-400" : "bg-emerald-500/20 text-emerald-400"
                        }`}>
                          {rec.type === "strategy" ? `Strategy #${rec.id}` : `Combo #${rec.id}`}
                        </span>
                        <span className="text-sm font-bold text-white truncate">{rec.title}</span>
                      </div>
                      <p className="text-xs text-gray-500">{rec.clientProfile.name} — {rec.clientProfile.profession}</p>
                    </div>

                    {/* Match Score */}
                    <div className="text-right">
                      <div className={`text-lg font-black ${
                        rec.matchScore >= 60 ? "text-emerald-400" :
                        rec.matchScore >= 40 ? "text-amber-400" : "text-gray-400"
                      }`}>
                        {rec.matchScore}%
                      </div>
                      <p className="text-[10px] text-gray-500">match</p>
                    </div>

                    {/* Metrics */}
                    <div className="hidden md:flex gap-6 text-right">
                      <div>
                        <p className="text-xs font-bold text-emerald-400">{formatMoney(rec.taxSaved)}</p>
                        <p className="text-[10px] text-gray-500">tax saved</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-blue-400">{formatMoney(rec.finalNetWorth)}</p>
                        <p className="text-[10px] text-gray-500">final NW</p>
                      </div>
                    </div>

                    {expandedIdx === idx ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                  </div>

                  {/* Expanded Details */}
                  {expandedIdx === idx && (
                    <div className="px-4 pb-4 space-y-3">
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <p className="text-xs font-semibold text-cyan-400 mb-2">Why This Matches:</p>
                        <div className="flex flex-wrap gap-2">
                          {rec.matchReasons.map((reason, i) => (
                            <span key={i} className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-1 rounded-full border border-cyan-500/20">
                              ✓ {reason}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div className="bg-slate-800/30 rounded-lg p-2">
                          <p className="text-[10px] text-gray-500">Starting NW</p>
                          <p className="text-sm font-bold text-white">{formatMoney(rec.startingNetWorth)}</p>
                        </div>
                        <div className="bg-slate-800/30 rounded-lg p-2">
                          <p className="text-[10px] text-gray-500">Final NW</p>
                          <p className="text-sm font-bold text-blue-400">{formatMoney(rec.finalNetWorth)}</p>
                        </div>
                        <div className="bg-slate-800/30 rounded-lg p-2">
                          <p className="text-[10px] text-gray-500">Tax Saved</p>
                          <p className="text-sm font-bold text-emerald-400">{formatMoney(rec.taxSaved)}</p>
                        </div>
                        <div className="bg-slate-800/30 rounded-lg p-2">
                          <p className="text-[10px] text-gray-500">Steps</p>
                          <p className="text-sm font-bold text-purple-400">{rec.steps}</p>
                        </div>
                        <div className="bg-slate-800/30 rounded-lg p-2">
                          <p className="text-[10px] text-gray-500">Categories</p>
                          <p className="text-sm font-bold text-amber-400">{rec.categories.length > 0 ? rec.categories.join(", ") : "Multi"}</p>
                        </div>
                      </div>
                      <Link
                        href={rec.type === "strategy" ? `/portal/secret-secrets/${rec.id}` : `/portal/tax-combos/${rec.id}`}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        View Full Strategy Details <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
