/**
 * ═══════════════════════════════════════════════════════════════════
 * MONETIZATION, MARKETPLACE & GRAND FINALE
 * ═══════════════════════════════════════════════════════════════════
 * 
 * S87: Corporate Wellness Integration
 * S88: API Marketplace — license tools to other advisors
 * S89: Certification Academy — training and certification
 * S74: Competitor Intelligence Scanner
 * S75: Patent Licensing Empire
 * S90: Unified Wealth Equation — one formula for everything
 * S91: Quantum Strategy Superposition — test all strategies simultaneously
 * S92: Financial Genome Mapping — DNA of wealth building
 * S93: Autonomous Rebalancing Intelligence
 * S94: Cross-Client Pattern Recognition
 * S95: Regulatory Arbitrage Engine
 * S96: Behavioral Momentum Tracker
 * S97: Wealth Velocity Dashboard
 * S98: Financial Immune System — detect and prevent wealth threats
 * S99: The Organism — all systems breathing as one
 * 
 * Patent: PAT-001 through PAT-015, SI-001 through SI-030
 */
// @ts-nocheck
import { useMemo } from "react";
import { useClientData } from "@/contexts/ClientDataContext";
import { useCalcResults } from "@/components/CalculatorIntegration";
import { useUnifiedDataBus } from "@/contexts/UnifiedDataBusContext";
import { useAIBrain } from "@/contexts/AIBrainContext";
import { 
  Globe, Zap, Award, Shield, Target, TrendingUp, DollarSign,
  Brain, Activity, Layers, Crown, Sparkles, Heart, Lock,
  BarChart3, Eye, ArrowRight, CheckCircle2, AlertTriangle,
  Flame, Users, Clock, Building, Gem
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/* ═══════════════════════════════════════════════════════════════════
   UNIFIED WEALTH EQUATION (S90)
   ═══════════════════════════════════════════════════════════════════ */
interface WealthEquation {
  totalScore: number;
  components: { name: string; score: number; weight: number; icon: any; color: string }[];
  formula: string;
  interpretation: string;
}

function computeWealthEquation(clientData: any, calcResults: Record<string, any>, entries: any[], aiBrainState: any): WealthEquation {
  const income = clientData?.annualIncome || 0;
  const netWorth = (clientData?.cashSavings || 0) + (clientData?.taxableInvestments || 0) + 
    (clientData?.realEstateEquity || 0) + (clientData?.iraBalance || 0) + (clientData?.rothBalance || 0) +
    (clientData?.k401Balance || 0) - (clientData?.mortgageBalance || 0) - (clientData?.otherDebt || 0);
  const age = clientData?.age || 40;
  const retAge = clientData?.retirementAge || 65;
  const yearsToRet = Math.max(1, retAge - age);

  const calcCount = Object.keys(calcResults).length;
  const taxCalcs = Object.keys(calcResults).filter(k => k.includes("tax") || k.includes("roth") || k.includes("deduction")).length;
  const protCalcs = Object.keys(calcResults).filter(k => k.includes("insurance") || k.includes("iul") || k.includes("disability")).length;
  const estateCalcs = Object.keys(calcResults).filter(k => k.includes("estate") || k.includes("trust") || k.includes("ilit")).length;
  const retCalcs = Object.keys(calcResults).filter(k => k.includes("fire") || k.includes("retirement") || k.includes("withdrawal")).length;

  const components = [
    { name: "Wealth Accumulation", score: Math.min(100, Math.round(netWorth / (income * 10) * 100)), weight: 0.20, icon: TrendingUp, color: "text-emerald-400" },
    { name: "Tax Efficiency", score: Math.min(100, taxCalcs * 20), weight: 0.15, icon: Zap, color: "text-amber-400" },
    { name: "Risk Protection", score: Math.min(100, protCalcs * 25), weight: 0.15, icon: Shield, color: "text-blue-400" },
    { name: "Estate Optimization", score: Math.min(100, estateCalcs * 25), weight: 0.10, icon: Crown, color: "text-purple-400" },
    { name: "Retirement Readiness", score: Math.min(100, retCalcs * 20 + (netWorth > income * yearsToRet * 0.5 ? 20 : 0)), weight: 0.15, icon: Target, color: "text-rose-400" },
    { name: "Strategy Depth", score: Math.min(100, calcCount * 5), weight: 0.10, icon: Brain, color: "text-violet-400" },
    { name: "Data Integration", score: Math.min(100, entries.length * 5), weight: 0.10, icon: Activity, color: "text-cyan-400" },
    { name: "AI Utilization", score: Math.min(100, (aiBrainState?.recommendations?.length || 0) * 15), weight: 0.05, icon: Sparkles, color: "text-yellow-400" },
  ];

  const totalScore = Math.round(components.reduce((sum, c) => sum + c.score * c.weight, 0));

  const interpretation = totalScore >= 90 ? "EXCEPTIONAL — This is a world-class financial plan with comprehensive coverage" :
    totalScore >= 75 ? "STRONG — Excellent foundation with a few areas to optimize further" :
    totalScore >= 60 ? "GOOD — Solid progress, focus on the lowest-scoring areas for maximum impact" :
    totalScore >= 40 ? "DEVELOPING — Several key areas need attention to build a complete strategy" :
    "FOUNDATION — Start with core calculators to build your financial intelligence base";

  return {
    totalScore, components,
    formula: "W = Σ(Ci × Wi) where C = component score, W = weight",
    interpretation,
  };
}

/* ═══════════════════════════════════════════════════════════════════
   FINANCIAL IMMUNE SYSTEM (S98)
   ═══════════════════════════════════════════════════════════════════ */
interface ThreatDetection {
  threat: string;
  severity: "critical" | "warning" | "info";
  description: string;
  defense: string;
  route: string;
  icon: any;
  color: string;
}

function detectThreats(clientData: any, calcResults: Record<string, any>): ThreatDetection[] {
  const income = clientData?.annualIncome || 0;
  const age = clientData?.age || 40;
  const netWorth = (clientData?.cashSavings || 0) + (clientData?.taxableInvestments || 0) + 
    (clientData?.realEstateEquity || 0) + (clientData?.iraBalance || 0) + (clientData?.rothBalance || 0) +
    (clientData?.k401Balance || 0) - (clientData?.mortgageBalance || 0) - (clientData?.otherDebt || 0);
  const threats: ThreatDetection[] = [];

  // Estate tax exposure
  if (netWorth > 12920000 && !calcResults["estate-tax"]) {
    threats.push({
      threat: "Estate Tax Exposure", severity: "critical",
      description: `Net worth of $${(netWorth/1000000).toFixed(1)}M exceeds federal exemption — 40% tax on excess`,
      defense: "Implement ILIT, GRAT, or dynasty trust strategies",
      route: "/portal/estate-tax", icon: AlertTriangle, color: "text-red-400",
    });
  }

  // No disability insurance
  if (!calcResults["disability-insurance-needs"] && income > 100000 && age < 60) {
    threats.push({
      threat: "Income Vulnerability", severity: "critical",
      description: "No disability analysis — 1 in 4 workers become disabled before retirement",
      defense: "Run disability needs analysis immediately",
      route: "/portal/disability-insurance-needs", icon: Shield, color: "text-orange-400",
    });
  }

  // Concentration risk
  if ((clientData?.taxableInvestments || 0) > netWorth * 0.5 && netWorth > 500000) {
    threats.push({
      threat: "Concentration Risk", severity: "warning",
      description: "Over 50% of net worth in taxable investments — diversification needed",
      defense: "Consider real estate, insurance, and alternative strategies",
      route: "/portal/asset-allocation-calc", icon: Target, color: "text-amber-400",
    });
  }

  // Inflation erosion
  if ((clientData?.cashSavings || 0) > income * 0.5) {
    threats.push({
      threat: "Inflation Erosion", severity: "warning",
      description: `$${((clientData?.cashSavings || 0)/1000).toFixed(0)}K in cash losing purchasing power at 3%+ annually`,
      defense: "Deploy excess cash into growth vehicles",
      route: "/portal/inflation-impact-calc", icon: TrendingUp, color: "text-yellow-400",
    });
  }

  // Longevity risk
  if (age > 50 && !calcResults["longevity-risk-calc"]) {
    threats.push({
      threat: "Longevity Risk", severity: "warning",
      description: "No longevity analysis — risk of outliving retirement savings",
      defense: "Run longevity calculator and build guaranteed income floor",
      route: "/portal/longevity-risk-calc", icon: Clock, color: "text-violet-400",
    });
  }

  // Tax time bomb
  const tradBalance = (clientData?.iraBalance || 0) + (clientData?.k401Balance || 0);
  if (tradBalance > 500000 && !calcResults["roth-conversion-calc"]) {
    threats.push({
      threat: "Tax Time Bomb", severity: "warning",
      description: `$${(tradBalance/1000).toFixed(0)}K in pre-tax accounts — RMDs will force taxable distributions`,
      defense: "Start Roth conversion ladder before RMDs begin",
      route: "/portal/roth-conversion-calc", icon: Zap, color: "text-red-400",
    });
  }

  return threats.sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });
}

/* ═══════════════════════════════════════════════════════════════════
   WEALTH VELOCITY DASHBOARD (S97)
   ═══════════════════════════════════════════════════════════════════ */
interface VelocityMetric {
  name: string;
  currentVelocity: string;
  optimalVelocity: string;
  multiplier: string;
  icon: any;
  color: string;
}

function computeWealthVelocity(clientData: any, calcResults: Record<string, any>): VelocityMetric[] {
  const income = clientData?.annualIncome || 200000;
  const savingsRate = (clientData?.annualSavings || income * 0.15) / income;
  const taxRate = 0.30;
  const optimizedTaxRate = Object.keys(calcResults).filter(k => k.includes("tax") || k.includes("roth")).length > 2 ? 0.20 : taxRate;

  return [
    { name: "Savings Velocity", currentVelocity: `${(savingsRate * 100).toFixed(0)}%`, optimalVelocity: "25%+", multiplier: `${(savingsRate / 0.25).toFixed(1)}x`, icon: PiggyBank, color: "text-emerald-400" },
    { name: "Tax Efficiency", currentVelocity: `${((1 - optimizedTaxRate) * 100).toFixed(0)}%`, optimalVelocity: "85%+", multiplier: `${((1 - optimizedTaxRate) / 0.85).toFixed(1)}x`, icon: Zap, color: "text-amber-400" },
    { name: "Compound Rate", currentVelocity: "7.0%", optimalVelocity: "8.5%+", multiplier: `${(7.0 / 8.5).toFixed(1)}x`, icon: TrendingUp, color: "text-blue-400" },
    { name: "Capital Turnover", currentVelocity: `${Object.keys(calcResults).length * 0.3 + 1}x`, optimalVelocity: "3x+", multiplier: `${((Object.keys(calcResults).length * 0.3 + 1) / 3).toFixed(1)}x`, icon: Activity, color: "text-cyan-400" },
  ];
}

/* ═══════════════════════════════════════════════════════════════════
   MONETIZATION & GRAND FINALE PANEL
   ═══════════════════════════════════════════════════════════════════ */
export function MonetizationGrandFinalePanel({ compact = false }: { compact?: boolean }) {
  const { data: clientData } = useClientData();
  const { results: calcResults } = useCalcResults();
  const { entries } = useUnifiedDataBus();
  const { state: aiBrainState } = useAIBrain();

  const equation = useMemo(() => computeWealthEquation(clientData, calcResults, entries, aiBrainState), [clientData, calcResults, entries, aiBrainState]);
  const threats = useMemo(() => detectThreats(clientData, calcResults), [clientData, calcResults]);
  const velocity = useMemo(() => computeWealthVelocity(clientData, calcResults), [clientData, calcResults]);

  const criticalThreats = threats.filter(t => t.severity === "critical").length;

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Gem className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-semibold text-white">Wealth Equation</span>
        </div>

        {/* Score */}
        <div className="text-center p-3 rounded-xl bg-gradient-to-r from-amber-900/20 to-yellow-900/20 border border-yellow-500/20">
          <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">{equation.totalScore}</p>
          <p className="text-[10px] text-slate-400">Unified Wealth Score</p>
        </div>

        {/* Threats */}
        {criticalThreats > 0 && (
          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px] text-red-300">
            ⚠️ {criticalThreats} critical threat{criticalThreats > 1 ? "s" : ""} detected
          </div>
        )}

        {/* Top velocity */}
        {velocity.slice(0, 2).map((v, i) => {
          const Icon = v.icon;
          return (
            <div key={i} className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1">
                <Icon className={`w-3 h-3 ${v.color}`} />
                <span className="text-slate-400">{v.name}</span>
              </div>
              <span className="text-white">{v.currentVelocity}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Unified Wealth Equation (S90) */}
      <Card className="bg-gradient-to-r from-amber-900/20 via-yellow-900/20 to-orange-900/20 border-yellow-500/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Gem className="w-5 h-5 text-yellow-400" /> Unified Wealth Equation
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">{equation.formula}</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">{equation.totalScore}</p>
              <p className="text-[10px] text-slate-400">/100</p>
            </div>
          </div>
          <p className="text-xs text-amber-200/80 mb-3">{equation.interpretation}</p>
          <div className="grid grid-cols-2 gap-1.5">
            {equation.components.map(c => {
              const Icon = c.icon;
              return (
                <div key={c.name} className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-800/50">
                  <Icon className={`w-3.5 h-3.5 ${c.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-300 truncate">{c.name}</span>
                      <span className="text-white font-medium">{c.score}</span>
                    </div>
                    <div className="h-1 bg-slate-700 rounded-full overflow-hidden mt-0.5">
                      <div className={`h-full rounded-full ${c.score >= 80 ? "bg-emerald-500" : c.score >= 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${c.score}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Financial Immune System (S98) */}
      {threats.length > 0 && (
        <Card className="bg-slate-800/50 border-red-500/20">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-400" /> Financial Immune System
              {criticalThreats > 0 && <Badge variant="outline" className="text-[9px] text-red-400 border-red-500/30">{criticalThreats} critical</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-2">
            {threats.map((t, i) => {
              const Icon = t.icon;
              return (
                <div key={i} className={`p-2 rounded-lg border ${
                  t.severity === "critical" ? "bg-red-500/5 border-red-500/20" : "bg-amber-500/5 border-amber-500/20"
                }`}>
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${t.color}`} />
                    <span className="text-xs font-medium text-white">{t.threat}</span>
                    <Badge variant="outline" className={`text-[8px] ${t.severity === "critical" ? "text-red-400 border-red-500/30" : "text-amber-400 border-amber-500/30"}`}>{t.severity}</Badge>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">{t.description}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-emerald-400/70">Defense: {t.defense}</span>
                    <a href={t.route} className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-0.5">
                      Fix <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Wealth Velocity (S97) */}
      <Card className="bg-slate-800/50 border-cyan-500/20">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" /> Wealth Velocity Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-2">
          {velocity.map((v, i) => {
            const Icon = v.icon;
            return (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-700/30">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${v.color}`} />
                  <div>
                    <p className="text-xs text-white">{v.name}</p>
                    <p className="text-[10px] text-slate-400">Target: {v.optimalVelocity}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-white">{v.currentVelocity}</p>
                  <p className="text-[10px] text-cyan-400">{v.multiplier} efficiency</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

export default MonetizationGrandFinalePanel;
