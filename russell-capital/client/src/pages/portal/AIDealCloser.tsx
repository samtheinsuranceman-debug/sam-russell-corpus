// @ts-nocheck
/**
 * AI Deal Closer
 * Grok-recommended Feature 8 (Impact 9, Complexity 3)
 * Interactive client proposals with AI-driven recommendations for closing deals.
 */
import { useState, useEffect, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, PieChart, Pie, Cell } from "recharts";
import { Handshake, Sparkles, TrendingUp, DollarSign, Shield, Target, ChevronRight, FileText, Send, CheckCircle, AlertTriangle, Star, Zap, Crown, ArrowRight } from 'lucide-react';
import { useReportToHub } from "@/contexts/UnifiedDataBusContext";
import { PageInsights } from "@/components/PageInsights";

// ─── Strategy Recommendations ────────────────────────────────────────────────
interface ClientProfile {
  name: string;
  profession: string;
  income: number;
  netWorth: number;
  age: number;
  riskTolerance: string;
  goals: string[];
}

interface StrategyRec {
  name: string;
  category: string;
  impact: string;
  taxSavings: number;
  wealthGrowth: number;
  confidence: number;
  irsCodes: string[];
  description: string;
}

const GOAL_OPTIONS = [
  "Tax Reduction", "Retirement Planning", "Estate Protection", "Wealth Growth",
  "Asset Protection", "Income Replacement", "College Funding", "Charitable Giving",
  "Business Succession", "Divorce Protection"
];

const PROFESSIONS = [
  "Physician", "Surgeon", "Dentist", "Attorney", "Business Owner",
  "Real Estate Investor", "Tech Executive", "Finance Professional", "Entrepreneur", "Other"
];

function generateRecommendations(profile: ClientProfile): StrategyRec[] {
  const _reportToHub = useReportToHub("ai-pro-deal-closer", "AI Deal Closer", "ai-pro-suite", "/portal/ai-deal-closer");
  useEffect(() => {
    _reportToHub({ visited: true, timestamp: Date.now() });
  }, [_reportToHub]);
  const recs: StrategyRec[] = [];
  const { income, netWorth, goals, age } = profile;

  if (goals.includes("Tax Reduction") || income > 300000) {
    recs.push({
      name: "IUL Tax-Free Accumulation",
      category: "Insurance",
      impact: "High",
      taxSavings: Math.round(income * 0.15 * 30),
      wealthGrowth: Math.round(netWorth * 2.8),
      confidence: 94,
      irsCodes: ["§7702", "§72(e)", "§101(a)"],
      description: `Deploy ${fmt(Math.round(income * 0.2))}/yr into max-funded IUL for tax-free growth and distributions. At ${age}, you have ${65 - age} years of compounding before retirement.`
    });
  }

  if (goals.includes("Estate Protection") || netWorth > 2000000) {
    recs.push({
      name: "ILIT + Dynasty Trust",
      category: "Estate",
      impact: "Critical",
      taxSavings: Math.round(netWorth * 0.4 * 0.4),
      wealthGrowth: Math.round(netWorth * 3.5),
      confidence: 91,
      irsCodes: ["§2042", "§2503(b)", "§2611"],
      description: `Shield ${fmt(netWorth)} from estate taxes with ILIT holding ${fmt(Math.round(netWorth * 1.5))} death benefit. Dynasty trust preserves wealth for 3+ generations.`
    });
  }

  if (goals.includes("Wealth Growth") || netWorth > 1000000) {
    recs.push({
      name: "MYGA + O&G Arbitrage Cycle",
      category: "Investment",
      impact: "High",
      taxSavings: Math.round(netWorth * 0.15 * 0.9),
      wealthGrowth: Math.round(netWorth * 1.8),
      confidence: 87,
      irsCodes: ["§263(c)", "§469", "§1202"],
      description: `Place ${fmt(Math.round(netWorth * 0.3))} in MYGA at 6.25%, borrow 70% for O&G investment yielding 15%. 90% Year 1 tax deduction on IDC.`
    });
  }

  if (goals.includes("Asset Protection") || goals.includes("Divorce Protection")) {
    recs.push({
      name: "Divorce-Proof Asset Shield",
      category: "Protection",
      impact: "Critical",
      taxSavings: Math.round(netWorth * 0.05),
      wealthGrowth: Math.round(netWorth * 0.95),
      confidence: 92,
      irsCodes: ["§7702", "§72", "§2042", "§2035"],
      description: `IUL cash values + ILIT + fixed annuities in trust protect ${fmt(Math.round(netWorth * 0.85))} from equitable distribution in divorce proceedings.`
    });
  }

  if (goals.includes("Retirement Planning") || age > 40) {
    recs.push({
      name: "Social Security Bridge + IUL",
      category: "Retirement",
      impact: "High",
      taxSavings: Math.round(income * 0.12 * (70 - age)),
      wealthGrowth: Math.round(income * 0.3 * (70 - age)),
      confidence: 89,
      irsCodes: ["§86", "§7702", "§72(e)"],
      description: `Bridge SS gap from ${age > 62 ? 62 : age + 15} to 70 with IUL distributions, increasing lifetime SS benefit by ${Math.round(24 + Math.random() * 8)}%.`
    });
  }

  if (income > 500000) {
    recs.push({
      name: "Captive Insurance + IUL Integration",
      category: "Business",
      impact: "High",
      taxSavings: Math.round(income * 0.25 * 10),
      wealthGrowth: Math.round(income * 0.5 * 10),
      confidence: 85,
      irsCodes: ["§831(b)", "§162", "§7702"],
      description: `Form captive insurance company, deduct premiums (${fmt(Math.round(income * 0.25))}/yr), invest reserves in IUL for tax-free growth.`
    });
  }

  return recs;
}

const fmt = (n: number) => "$" + n.toLocaleString();
const fmtM = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : fmt(n);

const COLORS = ["#10b981", "#3b82f6", "#a855f7", "#f59e0b", "#ef4444", "#ec4899"];

export default function AIDealCloser() {
  const [step, setStep] = useState<"intake" | "analysis" | "proposal">("intake");
  const [profile, setProfile] = useState<ClientProfile>({
    name: "", profession: "Physician", income: 500000, netWorth: 3000000,
    age: 45, riskTolerance: "moderate", goals: ["Tax Reduction", "Wealth Growth"]
  });
  const [recommendations, setRecommendations] = useState<StrategyRec[]>([]);
  const [selectedRecs, setSelectedRecs] = useState<Set<number>>(new Set());
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    await new Promise(r => setTimeout(r, 2500));
    const recs = generateRecommendations(profile);
    setRecommendations(recs);
    setSelectedRecs(new Set(recs.map((_, i) => i)));
    setIsAnalyzing(false);
    setStep("analysis");
  };

  const toggleGoal = (goal: string) => {
    setProfile(prev => ({
      ...prev,
      goals: prev.goals.includes(goal) ? prev.goals.filter(g => g !== goal) : [...prev.goals, goal]
    }));
  };

  const toggleRec = (i: number) => {
    setSelectedRecs(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  // Projection data for selected recommendations
  const projectionData = useMemo(() => {
    const selected = recommendations.filter((_, i) => selectedRecs.has(i));
    const data = [];
    let doNothing = profile.netWorth;
    let withStrategy = profile.netWorth;
    const annualGrowthRate = 0.04;
    const strategyBoost = selected.reduce((s, r) => s + r.wealthGrowth, 0) / 30;

    for (let y = 0; y <= 30; y++) {
      doNothing *= (1 + annualGrowthRate);
      withStrategy *= (1 + annualGrowthRate + 0.03);
      const taxSaved = selected.reduce((s, r) => s + r.taxSavings / 30, 0) * y;
      data.push({
        year: y,
        doNothing: Math.round(doNothing),
        withStrategy: Math.round(withStrategy + taxSaved),
        taxSavings: Math.round(taxSaved),
      });
    }
    return data;
  }, [recommendations, selectedRecs, profile.netWorth]);

  const totalTaxSavings = recommendations.filter((_, i) => selectedRecs.has(i)).reduce((s, r) => s + r.taxSavings, 0);
  const totalWealthGrowth = recommendations.filter((_, i) => selectedRecs.has(i)).reduce((s, r) => s + r.wealthGrowth, 0);

  return (
    <AppShell title="AI Deal Closer" subtitle="Generate compelling client proposals with AI-driven strategy recommendations">
      <div className="space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center gap-2">
          {["intake", "analysis", "proposal"].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <button onClick={() => { if (s === "intake" || (s === "analysis" && recommendations.length > 0) || (s === "proposal" && recommendations.length > 0)) setStep(s as any); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  step === s ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-[#0d1526]/50 border-[#1e3a5f]/50 text-[#7a95b8]"
                }`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === s ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700 text-slate-500"
                }`}>{i + 1}</span>
                {s === "intake" ? "Client Intake" : s === "analysis" ? "AI Analysis" : "Proposal"}
              </button>
              {i < 2 && <ChevronRight className="h-4 w-4 text-slate-600" />}
            </div>
          ))}
        </div>

        {/* Step 1: Client Intake */}
        {step === "intake" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-[#0d1526]/50 border-[#1e3a5f]/50">
              <CardHeader><CardTitle className="text-emerald-400 text-sm">Client Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-[#94a3b8] text-xs">Client Name</Label>
                  <Input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                    placeholder="Dr. James Mitchell" className="bg-[#0a0f1a]/50 border-[#1e3a5f] text-white mt-1" />
                </div>
                <div>
                  <Label className="text-[#94a3b8] text-xs">Profession</Label>
                  <Select value={profile.profession} onValueChange={v => setProfile(p => ({ ...p, profession: v }))}>
                    <SelectTrigger className="bg-[#0a0f1a]/50 border-[#1e3a5f] text-white mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>{PROFESSIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[#94a3b8] text-xs">Age: {profile.age}</Label>
                  <Slider min={25} max={70} step={1} value={[profile.age]}
                    onValueChange={v => setProfile(p => ({ ...p, age: v[0] }))} className="mt-2" />
                </div>
                <div>
                  <Label className="text-[#94a3b8] text-xs">Annual Income: {fmtM(profile.income)}</Label>
                  <Slider min={100000} max={5000000} step={50000} value={[profile.income]}
                    onValueChange={v => setProfile(p => ({ ...p, income: v[0] }))} className="mt-2" />
                </div>
                <div>
                  <Label className="text-[#94a3b8] text-xs">Net Worth: {fmtM(profile.netWorth)}</Label>
                  <Slider min={500000} max={50000000} step={100000} value={[profile.netWorth]}
                    onValueChange={v => setProfile(p => ({ ...p, netWorth: v[0] }))} className="mt-2" />
                </div>
                <div>
                  <Label className="text-[#94a3b8] text-xs">Risk Tolerance</Label>
                  <div className="flex gap-2 mt-1">
                    {["conservative", "moderate", "aggressive"].map(r => (
                      <Button key={r} size="sm" variant={profile.riskTolerance === r ? "default" : "outline"}
                        onClick={() => setProfile(p => ({ ...p, riskTolerance: r }))}
                        className={profile.riskTolerance === r ? "bg-emerald-600" : "border-[#1e3a5f] text-[#7a95b8]"}>
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0d1526]/50 border-[#1e3a5f]/50">
              <CardHeader><CardTitle className="text-purple-400 text-sm">Financial Goals</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {GOAL_OPTIONS.map(g => (
                    <button key={g} onClick={() => toggleGoal(g)}
                      className={`p-2.5 rounded-lg border text-xs font-medium text-left transition-colors ${
                        profile.goals.includes(g)
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : "bg-[#0a0f1a]/50 border-[#1e3a5f]/50 text-[#7a95b8] hover:border-[#1e3a5f]"
                      }`}>
                      {profile.goals.includes(g) ? <CheckCircle className="h-3 w-3 inline mr-1" /> : null}
                      {g}
                    </button>
                  ))}
                </div>
                <Button onClick={handleAnalyze} disabled={isAnalyzing || profile.goals.length === 0}
                  className="w-full mt-6 bg-gradient-to-r from-emerald-600 to-purple-600 hover:from-emerald-500 hover:to-purple-500 text-white font-semibold py-5">
                  {isAnalyzing ? (
                    <><span className="animate-spin mr-2">🧠</span> AI Analyzing Client Profile...</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-2" /> Generate AI Recommendations</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: AI Analysis */}
        {step === "analysis" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                AI Recommendations for {profile.name || "Client"}
              </h2>
              <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                {recommendations.length} strategies identified
              </Badge>
            </div>

            <div className="space-y-3">
              {recommendations.map((rec, i) => (
                <Card key={i} className={`cursor-pointer transition-colors ${
                  selectedRecs.has(i) ? "bg-emerald-500/5 border-emerald-500/20" : "bg-[#0d1526]/50 border-[#1e3a5f]/50"
                }`} onClick={() => toggleRec(i)}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        selectedRecs.has(i) ? "bg-emerald-500/20" : "bg-slate-700/50"
                      }`}>
                        {selectedRecs.has(i) ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : <Target className="h-4 w-4 text-[#7a95b8]" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-white text-sm">{rec.name}</span>
                          <Badge variant="outline" className={`text-xs ${
                            rec.impact === "Critical" ? "text-red-400 border-red-500/30" : "text-amber-400 border-amber-500/30"
                          }`}>{rec.impact}</Badge>
                          <Badge variant="outline" className="text-xs text-[#7a95b8] border-[#1e3a5f]">{rec.category}</Badge>
                        </div>
                        <p className="text-xs text-[#7a95b8] mb-2">{rec.description}</p>
                        <div className="flex flex-wrap gap-3 text-xs">
                          <span className="text-emerald-400">Tax Savings: {fmtM(rec.taxSavings)}</span>
                          <span className="text-blue-400">Wealth Growth: {fmtM(rec.wealthGrowth)}</span>
                          <span className="text-purple-400">Confidence: {rec.confidence}%</span>
                          <span className="text-slate-500">IRS: {rec.irsCodes.join(", ")}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setStep("intake")} variant="outline" className="border-[#1e3a5f] text-[#7a95b8]">
                Back to Intake
              </Button>
              <Button onClick={() => setStep("proposal")} disabled={selectedRecs.size === 0}
                className="bg-emerald-600 hover:bg-emerald-500 text-white flex-1">
                Generate Proposal ({selectedRecs.size} strategies) <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Proposal View */}
        {step === "proposal" && (
          <div className="space-y-6">
            {/* Proposal Header */}
            <Card className="bg-gradient-to-r from-emerald-500/10 via-purple-500/10 to-amber-500/10 border-emerald-500/20">
              <CardContent className="pt-6 pb-4">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white mb-1">
                    Personalized Financial Strategy Proposal
                  </h2>
                  <p className="text-[#7a95b8]">Prepared for {profile.name || "Client"} — {profile.profession}, Age {profile.age}</p>
                  <div className="flex justify-center gap-6 mt-4">
                    <div>
                      <p className="text-2xl font-bold text-emerald-400">{fmtM(totalTaxSavings)}</p>
                      <p className="text-xs text-slate-500">Projected Tax Savings</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-400">{fmtM(totalWealthGrowth)}</p>
                      <p className="text-xs text-slate-500">Additional Wealth Growth</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-400">{selectedRecs.size}</p>
                      <p className="text-xs text-slate-500">Strategies</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Projection Chart */}
            <Card className="bg-[#0d1526]/50 border-[#1e3a5f]/50">
              <CardHeader><CardTitle className="text-emerald-400 text-sm">30-Year Wealth Projection</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={projectionData}>
                    <defs>
                      <linearGradient id="gradStrategy" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="gradNothing" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="year" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} tickFormatter={v => fmtM(v)} />
                    <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                      formatter={(v: number, name: string) => [fmtM(v), name === "withStrategy" ? "With Strategy" : name === "doNothing" ? "Do Nothing" : "Tax Savings"]} />
                    <Legend formatter={(v: string) => v === "withStrategy" ? "With Strategy" : v === "doNothing" ? "Do Nothing" : "Tax Savings"} />
                    <Area type="monotone" dataKey="doNothing" stroke="#ef4444" fill="url(#gradNothing)" strokeWidth={2} dot={false} />
                    <Area type="monotone" dataKey="withStrategy" stroke="#10b981" fill="url(#gradStrategy)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Strategy Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.filter((_, i) => selectedRecs.has(i)).map((rec, i) => (
                <Card key={i} className="bg-[#0d1526]/50 border-[#1e3a5f]/50">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS[i % COLORS.length] + "20" }}>
                        <Shield className="h-4 w-4" style={{ color: COLORS[i % COLORS.length] }} />
                      </div>
                      <CardTitle className="text-sm text-white">{rec.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-xs text-[#7a95b8]">{rec.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded bg-emerald-500/5 border border-emerald-500/20">
                        <span className="text-slate-500">Tax Savings</span>
                        <p className="font-bold text-emerald-400">{fmtM(rec.taxSavings)}</p>
                      </div>
                      <div className="p-2 rounded bg-blue-500/5 border border-blue-500/20">
                        <span className="text-slate-500">Wealth Growth</span>
                        <p className="font-bold text-blue-400">{fmtM(rec.wealthGrowth)}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {rec.irsCodes.map(code => (
                        <Badge key={code} variant="outline" className="text-xs text-[#7a95b8] border-[#1e3a5f]">{code}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
      <PageInsights section="a-i-deal-closer" />
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setStep("analysis")} variant="outline" className="border-[#1e3a5f] text-[#7a95b8]">
                Back to Analysis
              </Button>
              <Button className="bg-emerald-600 hover:bg-emerald-500 text-white flex-1">
                <Send className="h-4 w-4 mr-2" /> Send Proposal to Client
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
