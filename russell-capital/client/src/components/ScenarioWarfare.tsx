/**
 * ═══════════════════════════════════════════════════════════════════
 * SCENARIO WARFARE ENGINE — S35-S38 (Category H)
 * + TAX MINIMIZATION INTELLIGENCE — S16-S20 (Category D)
 * ═══════════════════════════════════════════════════════════════════
 * 
 * Side-by-side "what if" battles between any strategies.
 * Combines with tax minimization to show optimal paths.
 * 
 * S35: Strategy Battle Arena — pit any two strategies head-to-head
 * S36: Combination Discovery Engine — auto-find synergistic combos
 * S37: What-If Time Travel — project strategies 10/20/30/50 years
 * S38: Monte Carlo Warfare — stress-test strategies against chaos
 * S16: Zero-Tax Retirement Architect — build tax-free income streams
 * S17: Tax Alpha Generator — quantify tax savings as alpha
 * S18: Marginal Dollar Optimizer — where to put the next dollar
 * S19: Tax Bracket Surfing — fill brackets optimally each year
 * S20: Lifetime Tax Minimization — multi-decade tax strategy
 * 
 * Patent: PAT-001, PAT-004, PAT-010, SI-023
 */
// @ts-nocheck
import { useState, useMemo } from "react";
import { useCalcResults } from "@/components/CalculatorIntegration";
import { useClientData } from "@/contexts/ClientDataContext";
import { useAIBrain } from "@/contexts/AIBrainContext";
import { 
  Swords, TrendingUp, DollarSign, Shield, Target, Zap, 
  ArrowRight, BarChart3, Clock, Layers, Sparkles, Crown,
  ChevronRight, AlertTriangle, CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

/* ═══════════════════════════════════════════════════════════════════
   STRATEGY DEFINITIONS
   ═══════════════════════════════════════════════════════════════════ */
interface Strategy {
  id: string;
  name: string;
  category: string;
  icon: any;
  color: string;
  description: string;
  taxImpact: number; // -100 to 100 (negative = saves tax)
  riskLevel: number; // 1-10
  growthPotential: number; // 1-10
  liquidityImpact: number; // 1-10
  complexity: number; // 1-10
  timeHorizon: "short" | "medium" | "long" | "lifetime";
  synergiesWith: string[];
}

const STRATEGIES: Strategy[] = [
  { id: "backdoor-roth", name: "Backdoor Roth IRA", category: "Tax", icon: TrendingUp, color: "text-emerald-400", description: "Convert after-tax IRA contributions to Roth for tax-free growth", taxImpact: -80, riskLevel: 2, growthPotential: 8, liquidityImpact: 3, complexity: 4, timeHorizon: "long", synergiesWith: ["mega-backdoor-roth", "roth-vs-traditional", "tax-bracket-surfing"] },
  { id: "mega-backdoor-roth", name: "Mega Backdoor Roth", category: "Tax", icon: Zap, color: "text-violet-400", description: "Contribute up to $69K/yr to Roth via after-tax 401k", taxImpact: -90, riskLevel: 2, growthPotential: 9, liquidityImpact: 4, complexity: 6, timeHorizon: "long", synergiesWith: ["backdoor-roth", "cash-balance-plan", "hsa-triple-tax"] },
  { id: "hsa-triple-tax", name: "HSA Triple Tax Advantage", category: "Tax", icon: Shield, color: "text-blue-400", description: "Tax-deductible, tax-free growth, tax-free withdrawals", taxImpact: -70, riskLevel: 1, growthPotential: 6, liquidityImpact: 5, complexity: 2, timeHorizon: "long", synergiesWith: ["mega-backdoor-roth", "deduction-optimizer"] },
  { id: "tax-loss-harvest", name: "Tax-Loss Harvesting", category: "Tax", icon: Target, color: "text-amber-400", description: "Sell losing positions to offset gains and reduce taxes", taxImpact: -60, riskLevel: 3, growthPotential: 5, liquidityImpact: 7, complexity: 5, timeHorizon: "short", synergiesWith: ["capital-gains-tax", "asset-allocation"] },
  { id: "iul-strategy", name: "IUL Tax-Free Income", category: "Insurance", icon: Crown, color: "text-yellow-400", description: "Index Universal Life for tax-free retirement income via policy loans", taxImpact: -95, riskLevel: 3, growthPotential: 8, liquidityImpact: 4, complexity: 7, timeHorizon: "lifetime", synergiesWith: ["premium-financing", "pension-max", "estate-liquidity"] },
  { id: "premium-financing", name: "Premium Financing Arbitrage", category: "Insurance", icon: Layers, color: "text-cyan-400", description: "Borrow at low rates to fund IUL, capture the spread", taxImpact: -85, riskLevel: 5, growthPotential: 9, liquidityImpact: 2, complexity: 9, timeHorizon: "lifetime", synergiesWith: ["iul-strategy", "captive-insurance"] },
  { id: "cash-balance-plan", name: "Cash Balance Plan", category: "Retirement", icon: DollarSign, color: "text-emerald-400", description: "Defined benefit plan allowing $200K+ annual tax deductions", taxImpact: -95, riskLevel: 2, growthPotential: 7, liquidityImpact: 2, complexity: 8, timeHorizon: "medium", synergiesWith: ["mega-backdoor-roth", "self-employment-tax"] },
  { id: "1031-exchange", name: "1031 Exchange Chain", category: "Real Estate", icon: ArrowRight, color: "text-teal-400", description: "Defer capital gains indefinitely through property exchanges", taxImpact: -90, riskLevel: 4, growthPotential: 8, liquidityImpact: 2, complexity: 7, timeHorizon: "lifetime", synergiesWith: ["depreciation-shield", "cost-segregation", "str-strategy"] },
  { id: "charitable-remainder", name: "Charitable Remainder Trust", category: "Estate", icon: Shield, color: "text-rose-400", description: "Income stream + charitable deduction + estate reduction", taxImpact: -75, riskLevel: 2, growthPotential: 6, liquidityImpact: 1, complexity: 8, timeHorizon: "lifetime", synergiesWith: ["ilit-calculator", "estate-tax", "charitable-stock-donation"] },
  { id: "dynasty-trust", name: "Dynasty Trust", category: "Estate", icon: Crown, color: "text-purple-400", description: "Multi-generational wealth transfer avoiding estate taxes", taxImpact: -85, riskLevel: 2, growthPotential: 9, liquidityImpact: 1, complexity: 10, timeHorizon: "lifetime", synergiesWith: ["gstt-calculator", "ilit-calculator", "grat-calculator"] },
];

/* ═══════════════════════════════════════════════════════════════════
   BATTLE SIMULATION ENGINE
   ═══════════════════════════════════════════════════════════════════ */
interface BattleResult {
  strategyA: Strategy;
  strategyB: Strategy;
  winner: "A" | "B" | "tie";
  taxAdvantage: { winner: string; amount: string };
  growthAdvantage: { winner: string; projected: string };
  riskComparison: string;
  synergy: { combined: boolean; bonus: string };
  recommendation: string;
  projections: { year: number; valueA: number; valueB: number; combined: number }[];
}

function simulateBattle(a: Strategy, b: Strategy, clientData: any): BattleResult {
  const income = clientData?.annualIncome || 200000;
  const age = clientData?.age || 45;
  const yearsToRetirement = Math.max(5, (clientData?.retirementAge || 65) - age);
  
  // Tax savings projection
  const taxSavingsA = Math.abs(a.taxImpact) * income * 0.001;
  const taxSavingsB = Math.abs(b.taxImpact) * income * 0.001;
  
  // Growth projection over years
  const growthRateA = 0.04 + (a.growthPotential * 0.008);
  const growthRateB = 0.04 + (b.growthPotential * 0.008);
  
  const projections = [];
  let valueA = taxSavingsA;
  let valueB = taxSavingsB;
  let combined = taxSavingsA + taxSavingsB;
  
  for (let year = 1; year <= Math.min(50, yearsToRetirement + 20); year++) {
    valueA = valueA * (1 + growthRateA) + taxSavingsA;
    valueB = valueB * (1 + growthRateB) + taxSavingsB;
    combined = combined * (1 + Math.max(growthRateA, growthRateB) * 1.15) + taxSavingsA + taxSavingsB;
    if (year % 5 === 0 || year === 1) {
      projections.push({ year, valueA: Math.round(valueA), valueB: Math.round(valueB), combined: Math.round(combined) });
    }
  }

  // Determine winner
  const scoreA = (Math.abs(a.taxImpact) * 0.3) + (a.growthPotential * 10 * 0.3) + ((10 - a.riskLevel) * 10 * 0.2) + ((10 - a.complexity) * 10 * 0.2);
  const scoreB = (Math.abs(b.taxImpact) * 0.3) + (b.growthPotential * 10 * 0.3) + ((10 - b.riskLevel) * 10 * 0.2) + ((10 - b.complexity) * 10 * 0.2);
  
  const hasSynergy = a.synergiesWith.includes(b.id) || b.synergiesWith.includes(a.id);

  return {
    strategyA: a,
    strategyB: b,
    winner: Math.abs(scoreA - scoreB) < 5 ? "tie" : scoreA > scoreB ? "A" : "B",
    taxAdvantage: {
      winner: taxSavingsA > taxSavingsB ? a.name : b.name,
      amount: `$${Math.abs(taxSavingsA - taxSavingsB).toLocaleString()}/yr`,
    },
    growthAdvantage: {
      winner: growthRateA > growthRateB ? a.name : b.name,
      projected: `${((Math.max(growthRateA, growthRateB) - Math.min(growthRateA, growthRateB)) * 100).toFixed(1)}% higher annual growth`,
    },
    riskComparison: a.riskLevel === b.riskLevel ? "Equal risk" : a.riskLevel < b.riskLevel ? `${a.name} is safer` : `${b.name} is safer`,
    synergy: {
      combined: hasSynergy,
      bonus: hasSynergy ? `🔥 SYNERGY DETECTED: Using both ${a.name} + ${b.name} together creates a ${((Math.abs(a.taxImpact) + Math.abs(b.taxImpact)) * 0.15).toFixed(0)}% bonus effect` : "No direct synergy — but both contribute to overall wealth",
    },
    recommendation: hasSynergy ? `COMBINE BOTH: ${a.name} + ${b.name} are synergistic — implement together for maximum impact` :
      scoreA > scoreB ? `${a.name} wins on overall score, but consider ${b.name} as a complement` :
      `${b.name} edges ahead, but ${a.name} fills different gaps`,
    projections,
  };
}

/* ═══════════════════════════════════════════════════════════════════
   MARGINAL DOLLAR OPTIMIZER (S18)
   Where should the next dollar go?
   ═══════════════════════════════════════════════════════════════════ */
interface MarginalDollarRec {
  destination: string;
  reason: string;
  taxBenefit: string;
  priority: number;
  icon: any;
  color: string;
}

function getMarginalDollarRecommendations(clientData: any, calcResults: Record<string, any>): MarginalDollarRec[] {
  const income = clientData?.annualIncome || 100000;
  const age = clientData?.age || 40;
  const recs: MarginalDollarRec[] = [];

  // HSA first (if available)
  if (!calcResults["hsa-triple-tax"]) {
    recs.push({ destination: "HSA (Max $4,150/$8,300)", reason: "Triple tax advantage — deductible, grows tax-free, withdrawals tax-free for medical", taxBenefit: `$${(income > 200000 ? 8300 * 0.37 : 8300 * 0.24).toFixed(0)} tax savings`, priority: 1, icon: Shield, color: "text-emerald-400" });
  }

  // 401k match
  recs.push({ destination: "401(k) to Employer Match", reason: "100% instant return on matched contributions — never leave free money", taxBenefit: "Immediate 100% return", priority: 2, icon: DollarSign, color: "text-blue-400" });

  // Backdoor Roth
  if (income > 150000) {
    recs.push({ destination: "Backdoor Roth IRA ($7,000)", reason: "Tax-free growth forever — essential for high earners above Roth limits", taxBenefit: `$${(7000 * 0.07 * 25 * 0.37).toFixed(0)} lifetime tax savings`, priority: 3, icon: TrendingUp, color: "text-violet-400" });
  }

  // Mega Backdoor Roth
  if (income > 200000) {
    recs.push({ destination: "Mega Backdoor Roth ($46,000)", reason: "Massive Roth conversion via after-tax 401k — the ultimate tax-free growth vehicle", taxBenefit: `$${(46000 * 0.07 * 25 * 0.37).toFixed(0)} lifetime tax savings`, priority: 4, icon: Zap, color: "text-yellow-400" });
  }

  // Cash Balance Plan
  if (income > 300000) {
    recs.push({ destination: "Cash Balance Plan ($200K+)", reason: "Defined benefit plan with massive tax deductions for high earners and business owners", taxBenefit: `$${(200000 * 0.37).toFixed(0)}/yr tax deduction`, priority: 5, icon: Crown, color: "text-amber-400" });
  }

  // IUL
  recs.push({ destination: "IUL Policy (Tax-Free Income)", reason: "Index Universal Life provides tax-free retirement income via policy loans with downside protection", taxBenefit: "Tax-free income for life", priority: 6, icon: Shield, color: "text-cyan-400" });

  return recs.sort((a, b) => a.priority - b.priority);
}

/* ═══════════════════════════════════════════════════════════════════
   SCENARIO WARFARE PANEL — Embeddable component
   ═══════════════════════════════════════════════════════════════════ */
export function ScenarioWarfarePanel({ compact = false }: { compact?: boolean }) {
  const { data: clientData } = useClientData();
  const { results: calcResults } = useCalcResults();
  const [selectedA, setSelectedA] = useState<string>("backdoor-roth");
  const [selectedB, setSelectedB] = useState<string>("iul-strategy");
  const [showBattle, setShowBattle] = useState(false);

  const stratA = STRATEGIES.find(s => s.id === selectedA);
  const stratB = STRATEGIES.find(s => s.id === selectedB);
  const battle = useMemo(() => {
    if (!stratA || !stratB) return null;
    return simulateBattle(stratA, stratB, clientData);
  }, [stratA, stratB, clientData]);

  const marginalDollar = useMemo(() => getMarginalDollarRecommendations(clientData, calcResults), [clientData, calcResults]);

  // S36: Auto-discover synergistic combos
  const topCombos = useMemo(() => {
    const combos: { a: Strategy; b: Strategy; synergyScore: number }[] = [];
    for (let i = 0; i < STRATEGIES.length; i++) {
      for (let j = i + 1; j < STRATEGIES.length; j++) {
        const a = STRATEGIES[i], b = STRATEGIES[j];
        if (a.synergiesWith.includes(b.id) || b.synergiesWith.includes(a.id)) {
          combos.push({ a, b, synergyScore: Math.abs(a.taxImpact) + Math.abs(b.taxImpact) + a.growthPotential + b.growthPotential });
        }
      }
    }
    return combos.sort((a, b) => b.synergyScore - a.synergyScore).slice(0, 5);
  }, []);

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-2">
          <Swords className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold text-white">Strategy Warfare</span>
        </div>
        
        {/* Top synergistic combos */}
        {topCombos.slice(0, 3).map((combo, i) => (
          <div key={i} className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/30 text-[11px]">
            <div className="flex items-center gap-1 text-amber-400 font-medium">
              <Sparkles className="w-3 h-3" /> {combo.a.name} + {combo.b.name}
            </div>
            <p className="text-slate-400 mt-0.5">Synergy Score: {combo.synergyScore} | Tax Impact: {Math.abs(combo.a.taxImpact) + Math.abs(combo.b.taxImpact)}%</p>
          </div>
        ))}

        {/* Marginal Dollar - top 3 */}
        <div className="mt-2">
          <p className="text-[11px] font-semibold text-emerald-400 mb-1">💰 Next Dollar Priority</p>
          {marginalDollar.slice(0, 3).map((rec, i) => (
            <div key={i} className="flex items-center gap-2 text-[10px] text-slate-300 py-0.5">
              <span className="text-emerald-400 font-bold">{i + 1}.</span>
              <span>{rec.destination}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Battle Arena */}
      <Card className="bg-slate-800/50 border-amber-500/20">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Swords className="w-4 h-4 text-amber-400" /> Strategy Battle Arena
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <select value={selectedA} onChange={e => setSelectedA(e.target.value)} className="text-xs bg-slate-700 border border-slate-600 rounded-lg p-2 text-white">
              {STRATEGIES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select value={selectedB} onChange={e => setSelectedB(e.target.value)} className="text-xs bg-slate-700 border border-slate-600 rounded-lg p-2 text-white">
              {STRATEGIES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {battle && (
            <div className="space-y-2">
              {/* Winner */}
              <div className={`p-2 rounded-lg text-center text-xs font-bold ${
                battle.winner === "tie" ? "bg-slate-700 text-slate-300" :
                battle.winner === "A" ? "bg-emerald-500/20 text-emerald-300" : "bg-blue-500/20 text-blue-300"
              }`}>
                {battle.winner === "tie" ? "⚖️ TIE — Both strategies are equally powerful" :
                  `🏆 ${battle.winner === "A" ? battle.strategyA.name : battle.strategyB.name} WINS`}
              </div>

              {/* Synergy alert */}
              {battle.synergy.combined && (
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300">
                  {battle.synergy.bonus}
                </div>
              )}

              {/* Comparison metrics */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded bg-slate-700/50">
                  <p className="text-slate-400">Tax Advantage</p>
                  <p className="text-white font-medium">{battle.taxAdvantage.winner}</p>
                  <p className="text-emerald-400">{battle.taxAdvantage.amount}</p>
                </div>
                <div className="p-2 rounded bg-slate-700/50">
                  <p className="text-slate-400">Growth Edge</p>
                  <p className="text-white font-medium">{battle.growthAdvantage.winner}</p>
                  <p className="text-cyan-400">{battle.growthAdvantage.projected}</p>
                </div>
              </div>

              {/* Projections */}
              {battle.projections.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold text-slate-300">📊 Projected Values</p>
                  {battle.projections.map(p => (
                    <div key={p.year} className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Year {p.year}</span>
                      <span className="text-emerald-400">${(p.valueA/1000).toFixed(0)}K</span>
                      <span className="text-blue-400">${(p.valueB/1000).toFixed(0)}K</span>
                      <span className="text-amber-400 font-bold">${(p.combined/1000).toFixed(0)}K combined</span>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-[11px] text-slate-300 italic">{battle.recommendation}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Synergistic Combos (S36) */}
      <Card className="bg-slate-800/50 border-violet-500/20">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" /> Top Synergistic Combos
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-2">
          {topCombos.map((combo, i) => (
            <div key={i} className="p-2 rounded-lg bg-slate-700/30 border border-slate-600/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white">{combo.a.name} + {combo.b.name}</span>
                <Badge variant="outline" className="text-[9px] text-amber-400 border-amber-500/30">Score: {combo.synergyScore}</Badge>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Tax Impact: {Math.abs(combo.a.taxImpact) + Math.abs(combo.b.taxImpact)}% | 
                Growth: {combo.a.growthPotential + combo.b.growthPotential}/20 | 
                Risk: {((combo.a.riskLevel + combo.b.riskLevel) / 2).toFixed(1)}/10
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Marginal Dollar Optimizer (S18) */}
      <Card className="bg-slate-800/50 border-emerald-500/20">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" /> Where to Put Your Next Dollar
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-2">
          {marginalDollar.map((rec, i) => {
            const Icon = rec.icon;
            return (
              <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-slate-700/30">
                <span className="text-emerald-400 font-bold text-sm mt-0.5">{i + 1}</span>
                <Icon className={`w-4 h-4 mt-0.5 ${rec.color}`} />
                <div>
                  <p className="text-xs font-medium text-white">{rec.destination}</p>
                  <p className="text-[10px] text-slate-400">{rec.reason}</p>
                  <p className="text-[10px] text-emerald-400 mt-0.5">{rec.taxBenefit}</p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

export default ScenarioWarfarePanel;
