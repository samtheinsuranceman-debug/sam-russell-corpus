/**
 * ═══════════════════════════════════════════════════════════════════
 * CLIENT DIGITAL TWIN — S11-S15 (Category C)
 * ═══════════════════════════════════════════════════════════════════
 * 
 * A complete virtual clone of the client's financial life.
 * Aggregates ALL data from every calculator, context, and AI system
 * into a single unified financial profile.
 * 
 * S11: Client Digital Twin — complete virtual financial clone
 * S12: Wealth Genome Sequencer — DNA of their financial strategy
 * S13: Financial DNA Mutation Tracker — how their profile evolves
 * S14: Fact-Finder Hyperscan — auto-detect missing data
 * S15: Emotion-Sensing Interface — detect engagement level
 * 
 * Patent: PAT-001 (Unified Intelligence), SI-027 (Digital Twin)
 */
// @ts-nocheck
import { useState, useEffect, useMemo, useCallback } from "react";
import { useClientData } from "@/contexts/ClientDataContext";
import { useCalcResults } from "@/components/CalculatorIntegration";
import { useUnifiedDataBus } from "@/contexts/UnifiedDataBusContext";
import { useAIBrain } from "@/contexts/AIBrainContext";
import { 
  User, Brain, Dna, Shield, TrendingUp, DollarSign, Heart, 
  AlertTriangle, CheckCircle2, XCircle, Target, Zap, Activity,
  PieChart, BarChart3, Layers, ArrowRight, Sparkles, Eye,
  Home, Briefcase, GraduationCap, HeartPulse, Lock, Clock
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/* ═══════════════════════════════════════════════════════════════════
   DIGITAL TWIN TYPES
   ═══════════════════════════════════════════════════════════════════ */
interface FinancialDNA {
  riskProfile: "conservative" | "moderate" | "aggressive" | "ultra-aggressive";
  taxStrategy: "minimizer" | "deferrer" | "converter" | "harvester";
  wealthPhase: "accumulation" | "preservation" | "distribution" | "legacy";
  investmentStyle: "passive" | "active" | "hybrid" | "alternative";
  insurancePhilosophy: "self-insure" | "traditional" | "iul-focused" | "comprehensive";
  estateComplexity: "simple" | "moderate" | "complex" | "dynasty";
}

interface TwinScore {
  category: string;
  score: number;
  maxScore: number;
  icon: any;
  color: string;
  gaps: string[];
  strengths: string[];
}

interface DataCompleteness {
  total: number;
  filled: number;
  percentage: number;
  missingCritical: string[];
  missingOptional: string[];
}

/* ═══════════════════════════════════════════════════════════════════
   DIGITAL TWIN ENGINE
   ═══════════════════════════════════════════════════════════════════ */
function buildDigitalTwin(clientData: any, calcResults: Record<string, any>, dataBusEntries: any[]) {
  // S12: Wealth Genome Sequencer — determine financial DNA
  const dna: FinancialDNA = {
    riskProfile: clientData?.riskTolerance > 7 ? "aggressive" : clientData?.riskTolerance > 4 ? "moderate" : "conservative",
    taxStrategy: calcResults["backdoor-roth"] || calcResults["mega-backdoor-roth"] ? "converter" :
      calcResults["tax-loss-harvest-calc"] ? "harvester" :
      calcResults["deferred-compensation"] ? "deferrer" : "minimizer",
    wealthPhase: (clientData?.age || 40) > 65 ? "distribution" :
      (clientData?.age || 40) > 55 ? "preservation" :
      (clientData?.age || 40) > 45 ? "preservation" : "accumulation",
    investmentStyle: calcResults["asset-allocation"] ? "active" : 
      calcResults["private-equity-irr"] ? "alternative" : "passive",
    insurancePhilosophy: calcResults["term-vs-whole-vs-iul"] ? "iul-focused" :
      calcResults["life-insurance-needs"] ? "traditional" : "self-insure",
    estateComplexity: calcResults["gstt-calculator"] || calcResults["grat-calculator"] ? "dynasty" :
      calcResults["ilit-calculator"] || calcResults["estate-tax"] ? "complex" :
      calcResults["estate-liquidity"] ? "moderate" : "simple",
  };

  // S14: Fact-Finder Hyperscan — detect missing data
  const completeness = analyzeCompleteness(clientData, calcResults);

  // Build twin scores
  const scores = buildScores(clientData, calcResults, dna);

  // S15: Engagement level
  const engagement = calculateEngagement(dataBusEntries, calcResults);

  return { dna, completeness, scores, engagement };
}

function analyzeCompleteness(clientData: any, calcResults: Record<string, any>): DataCompleteness {
  const criticalFields = [
    { key: "clientName", label: "Client Name" },
    { key: "age", label: "Age" },
    { key: "annualIncome", label: "Annual Income" },
    { key: "retirementAge", label: "Retirement Age" },
    { key: "riskTolerance", label: "Risk Tolerance" },
    { key: "state", label: "State" },
  ];
  const optionalFields = [
    { key: "cashSavings", label: "Cash Savings" },
    { key: "taxableInvestments", label: "Taxable Investments" },
    { key: "iraBalance", label: "IRA Balance" },
    { key: "rothBalance", label: "Roth Balance" },
    { key: "k401Balance", label: "401k Balance" },
    { key: "realEstateEquity", label: "Real Estate Equity" },
    { key: "mortgageBalance", label: "Mortgage Balance" },
    { key: "lifeInsuranceCv", label: "Life Insurance CV" },
    { key: "annualExpenses", label: "Annual Expenses" },
    { key: "socialSecurityBenefit", label: "Social Security" },
    { key: "pensionIncome", label: "Pension Income" },
    { key: "otherDebt", label: "Other Debt" },
  ];

  const missingCritical = criticalFields.filter(f => !clientData?.[f.key]).map(f => f.label);
  const missingOptional = optionalFields.filter(f => !clientData?.[f.key] || clientData[f.key] === 0).map(f => f.label);
  const total = criticalFields.length + optionalFields.length;
  const filled = total - missingCritical.length - missingOptional.length;

  return { total, filled, percentage: Math.round((filled / total) * 100), missingCritical, missingOptional };
}

function buildScores(clientData: any, calcResults: Record<string, any>, dna: FinancialDNA): TwinScore[] {
  const income = clientData?.annualIncome || 0;
  const netWorth = (clientData?.cashSavings || 0) + (clientData?.taxableInvestments || 0) + 
    (clientData?.realEstateEquity || 0) + (clientData?.iraBalance || 0) + (clientData?.rothBalance || 0) +
    (clientData?.k401Balance || 0) - (clientData?.mortgageBalance || 0) - (clientData?.otherDebt || 0);

  return [
    {
      category: "Tax Optimization",
      score: Math.min(100, (calcResults["marginal-tax-rate"] ? 20 : 0) + (calcResults["backdoor-roth"] ? 20 : 0) + 
        (calcResults["tax-loss-harvest-calc"] ? 20 : 0) + (calcResults["deduction-optimizer"] ? 20 : 0) + 
        (calcResults["state-tax-arbitrage"] ? 20 : 0)),
      maxScore: 100,
      icon: DollarSign,
      color: "text-emerald-400",
      gaps: [
        ...(!calcResults["marginal-tax-rate"] ? ["Run Marginal Tax Rate analysis"] : []),
        ...(!calcResults["deduction-optimizer"] ? ["Optimize deductions"] : []),
        ...(!calcResults["backdoor-roth"] && income > 150000 ? ["Explore Backdoor Roth"] : []),
      ],
      strengths: [
        ...(calcResults["marginal-tax-rate"] ? ["Tax rate analyzed"] : []),
        ...(calcResults["backdoor-roth"] ? ["Roth conversion planned"] : []),
      ],
    },
    {
      category: "Retirement Readiness",
      score: Math.min(100, (calcResults["fire-calculator"] ? 25 : 0) + (calcResults["safe-withdrawal-rate"] ? 25 : 0) + 
        (calcResults["retirement-budget"] ? 25 : 0) + (calcResults["roth-vs-traditional"] ? 25 : 0)),
      maxScore: 100,
      icon: Target,
      color: "text-amber-400",
      gaps: [
        ...(!calcResults["fire-calculator"] ? ["Calculate FIRE number"] : []),
        ...(!calcResults["safe-withdrawal-rate"] ? ["Determine safe withdrawal rate"] : []),
        ...(!calcResults["retirement-budget"] ? ["Build retirement budget"] : []),
      ],
      strengths: [
        ...(calcResults["fire-calculator"] ? ["FIRE number calculated"] : []),
        ...(calcResults["safe-withdrawal-rate"] ? ["Withdrawal rate optimized"] : []),
      ],
    },
    {
      category: "Protection & Insurance",
      score: Math.min(100, (calcResults["life-insurance-needs"] ? 25 : 0) + (calcResults["disability-insurance-needs"] ? 25 : 0) + 
        (calcResults["umbrella-insurance"] ? 25 : 0) + (calcResults["ltc-cost"] ? 25 : 0)),
      maxScore: 100,
      icon: Shield,
      color: "text-blue-400",
      gaps: [
        ...(!calcResults["life-insurance-needs"] ? ["Life insurance needs analysis"] : []),
        ...(!calcResults["disability-insurance-needs"] ? ["Disability coverage review"] : []),
        ...(!calcResults["ltc-cost"] ? ["Long-term care planning"] : []),
      ],
      strengths: [
        ...(calcResults["life-insurance-needs"] ? ["Life insurance analyzed"] : []),
        ...(calcResults["disability-insurance-needs"] ? ["Disability coverage reviewed"] : []),
      ],
    },
    {
      category: "Estate & Legacy",
      score: Math.min(100, (calcResults["estate-tax"] ? 25 : 0) + (calcResults["estate-liquidity"] ? 25 : 0) + 
        (calcResults["ilit-calculator"] ? 25 : 0) + (calcResults["grat-calculator"] ? 25 : 0)),
      maxScore: 100,
      icon: Layers,
      color: "text-violet-400",
      gaps: [
        ...(!calcResults["estate-tax"] && netWorth > 3000000 ? ["Estate tax exposure analysis"] : []),
        ...(!calcResults["estate-liquidity"] ? ["Estate liquidity check"] : []),
        ...(!calcResults["ilit-calculator"] && netWorth > 5000000 ? ["ILIT strategy"] : []),
      ],
      strengths: [
        ...(calcResults["estate-tax"] ? ["Estate tax planned"] : []),
        ...(calcResults["ilit-calculator"] ? ["ILIT established"] : []),
      ],
    },
    {
      category: "Wealth Growth",
      score: Math.min(100, (calcResults["compound-interest"] ? 20 : 0) + (calcResults["asset-allocation"] ? 20 : 0) + 
        (calcResults["portfolio-risk-return"] ? 20 : 0) + (calcResults["fee-impact"] ? 20 : 0) + 
        (calcResults["savings-rate-impact"] ? 20 : 0)),
      maxScore: 100,
      icon: TrendingUp,
      color: "text-cyan-400",
      gaps: [
        ...(!calcResults["asset-allocation"] ? ["Optimize asset allocation"] : []),
        ...(!calcResults["fee-impact"] ? ["Analyze fee drag"] : []),
      ],
      strengths: [
        ...(calcResults["compound-interest"] ? ["Growth projected"] : []),
        ...(calcResults["asset-allocation"] ? ["Allocation optimized"] : []),
      ],
    },
    {
      category: "Debt & Cash Flow",
      score: Math.min(100, (calcResults["debt-payoff-optimizer"] ? 25 : 0) + (calcResults["budget-50-30-20"] || calcResults["zero-based-budget"] ? 25 : 0) + 
        (calcResults["financial-health-score"] ? 25 : 0) + (calcResults["emergency-fund-vs-iul"] ? 25 : 0)),
      maxScore: 100,
      icon: Activity,
      color: "text-rose-400",
      gaps: [
        ...(!calcResults["financial-health-score"] ? ["Run Financial Health Score"] : []),
        ...(!calcResults["debt-payoff-optimizer"] && (clientData?.otherDebt || 0) > 0 ? ["Optimize debt payoff"] : []),
      ],
      strengths: [
        ...(calcResults["financial-health-score"] ? ["Health score calculated"] : []),
        ...(calcResults["debt-payoff-optimizer"] ? ["Debt strategy optimized"] : []),
      ],
    },
  ];
}

function calculateEngagement(entries: any[], calcResults: Record<string, any>) {
  const calcCount = Object.keys(calcResults).length;
  const pageViews = entries.length;
  
  if (calcCount >= 10 && pageViews >= 20) return { level: "Champion", score: 95, color: "text-yellow-400" };
  if (calcCount >= 5 && pageViews >= 10) return { level: "Engaged", score: 70, color: "text-emerald-400" };
  if (calcCount >= 2 && pageViews >= 5) return { level: "Exploring", score: 45, color: "text-blue-400" };
  if (calcCount >= 1) return { level: "Starting", score: 25, color: "text-slate-400" };
  return { level: "New", score: 5, color: "text-slate-500" };
}

/* ═══════════════════════════════════════════════════════════════════
   CLIENT DIGITAL TWIN PANEL — Sidebar component
   ═══════════════════════════════════════════════════════════════════ */
export function ClientDigitalTwinPanel({ compact = false }: { compact?: boolean }) {
  const { data: clientData } = useClientData();
  const { results: calcResults } = useCalcResults();
  const { entries } = useUnifiedDataBus();
  const { state: aiBrainState } = useAIBrain();

  const twin = useMemo(() => {
    return buildDigitalTwin(clientData, calcResults, entries);
  }, [clientData, calcResults, entries]);

  const totalScore = twin.scores.reduce((sum, s) => sum + s.score, 0);
  const maxTotalScore = twin.scores.reduce((sum, s) => sum + s.maxScore, 0);
  const overallPercentage = Math.round((totalScore / maxTotalScore) * 100);

  const dnaLabels: Record<string, Record<string, string>> = {
    riskProfile: { conservative: "🛡️ Conservative", moderate: "⚖️ Moderate", aggressive: "🚀 Aggressive", "ultra-aggressive": "⚡ Ultra-Aggressive" },
    taxStrategy: { minimizer: "📉 Tax Minimizer", deferrer: "⏳ Tax Deferrer", converter: "🔄 Roth Converter", harvester: "🌾 Loss Harvester" },
    wealthPhase: { accumulation: "📈 Accumulation", preservation: "🏦 Preservation", distribution: "💰 Distribution", legacy: "👑 Legacy" },
    investmentStyle: { passive: "🌊 Passive Index", active: "🎯 Active Mgmt", hybrid: "🔀 Hybrid", alternative: "💎 Alternative" },
    insurancePhilosophy: { "self-insure": "🏋️ Self-Insure", traditional: "📋 Traditional", "iul-focused": "⭐ IUL-Focused", comprehensive: "🛡️ Comprehensive" },
    estateComplexity: { simple: "📄 Simple", moderate: "📑 Moderate", complex: "📚 Complex", dynasty: "👑 Dynasty" },
  };

  if (compact) {
    return (
      <div className="space-y-3">
        {/* Compact: Overall score ring */}
        <div className="flex items-center gap-3">
          <div className="relative w-14 h-14">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="4" className="text-slate-700" />
              <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="4" 
                className={overallPercentage >= 70 ? "text-emerald-400" : overallPercentage >= 40 ? "text-amber-400" : "text-red-400"}
                strokeDasharray={`${overallPercentage * 1.508} 150.8`} strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">{overallPercentage}%</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Digital Twin Score</p>
            <p className="text-[11px] text-slate-400">{twin.completeness.percentage}% data complete</p>
            <p className="text-[11px] text-slate-400">{twin.engagement.level} engagement</p>
          </div>
        </div>

        {/* Compact: Score bars */}
        {twin.scores.map((s) => (
          <div key={s.category} className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">{s.category}</span>
              <span className={s.color}>{s.score}%</span>
            </div>
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 ${
                s.score >= 70 ? "bg-emerald-500" : s.score >= 40 ? "bg-amber-500" : "bg-red-500"
              }`} style={{ width: `${s.score}%` }} />
            </div>
          </div>
        ))}

        {/* Compact: Missing critical data */}
        {twin.completeness.missingCritical.length > 0 && (
          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-[10px] font-semibold text-red-400 mb-1">⚠️ Missing Critical Data</p>
            {twin.completeness.missingCritical.map(m => (
              <p key={m} className="text-[10px] text-red-300/70">• {m}</p>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Full panel view
  return (
    <div className="space-y-4">
      {/* Header with overall score */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-violet-900/30 to-purple-900/30 border border-violet-500/20">
        <div className="relative w-20 h-20">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="5" className="text-slate-700" />
            <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="5"
              className={overallPercentage >= 70 ? "text-emerald-400" : overallPercentage >= 40 ? "text-amber-400" : "text-red-400"}
              strokeDasharray={`${overallPercentage * 2.136} 213.6`} strokeLinecap="round" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-white">{overallPercentage}%</span>
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Client Digital Twin</h3>
          <p className="text-sm text-slate-400">{clientData?.clientName || "No Client Loaded"}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className={`text-[10px] ${twin.engagement.color}`}>{twin.engagement.level}</Badge>
            <Badge variant="outline" className="text-[10px] text-slate-400">{twin.completeness.percentage}% complete</Badge>
          </div>
        </div>
      </div>

      {/* Financial DNA */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2"><Dna className="w-4 h-4 text-violet-400" /> Financial DNA</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-1.5">
          {Object.entries(twin.dna).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              <span className="text-white">{dnaLabels[key]?.[value] || value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Category Scores */}
      <div className="space-y-2">
        {twin.scores.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.category} className="bg-slate-800/50 border-slate-700/50">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${s.color}`} />
                    <span className="text-sm font-medium text-white">{s.category}</span>
                  </div>
                  <span className={`text-sm font-bold ${s.color}`}>{s.score}%</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
                  <div className={`h-full rounded-full transition-all duration-500 ${
                    s.score >= 70 ? "bg-emerald-500" : s.score >= 40 ? "bg-amber-500" : "bg-red-500"
                  }`} style={{ width: `${s.score}%` }} />
                </div>
                {s.gaps.length > 0 && (
                  <div className="space-y-0.5">
                    {s.gaps.slice(0, 2).map(g => (
                      <p key={g} className="text-[10px] text-amber-400/70 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {g}
                      </p>
                    ))}
                  </div>
                )}
                {s.strengths.length > 0 && (
                  <div className="space-y-0.5 mt-1">
                    {s.strengths.map(str => (
                      <p key={str} className="text-[10px] text-emerald-400/70 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {str}
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Data Completeness */}
      {twin.completeness.missingCritical.length > 0 && (
        <Card className="bg-red-500/5 border-red-500/20">
          <CardContent className="p-3">
            <p className="text-xs font-semibold text-red-400 mb-2 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Missing Critical Data
            </p>
            {twin.completeness.missingCritical.map(m => (
              <p key={m} className="text-[11px] text-red-300/70 ml-5">• {m}</p>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ClientDigitalTwinPanel;
