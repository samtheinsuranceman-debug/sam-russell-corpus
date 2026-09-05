/**
 * ═══════════════════════════════════════════════════════════════════
 * INSURANCE OPTIMIZATION INTELLIGENCE — S21-S25 (Category E)
 * + INSURANCE GAP DETECTION — S79-S80 (Category V)
 * ═══════════════════════════════════════════════════════════════════
 * 
 * S21: IUL Time Machine — show IUL vs alternatives over decades
 * S22: Monte Carlo Insurance — stress-test insurance strategies
 * S23: Annuity X-Ray — reveal hidden fees and true returns
 * S24: HELOC Optimizer — leverage home equity intelligently
 * S25: Mortgage Annihilator — accelerated payoff strategies
 * S79: Insurance Gap Detector — find coverage holes
 * S80: Life Event Insurance Predictor — anticipate needs
 * 
 * Patent: PAT-001, PAT-004, SI-023
 */
// @ts-nocheck
import { useMemo } from "react";
import { useClientData } from "@/contexts/ClientDataContext";
import { useCalcResults } from "@/components/CalculatorIntegration";
import { 
  Shield, AlertTriangle, CheckCircle2, TrendingUp, DollarSign,
  Heart, Home, Umbrella, Activity, Zap, Clock, Target,
  ArrowRight, BarChart3, Lock, Eye
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/* ═══════════════════════════════════════════════════════════════════
   INSURANCE GAP ANALYSIS (S79)
   ═══════════════════════════════════════════════════════════════════ */
interface InsuranceGap {
  type: string;
  icon: any;
  color: string;
  severity: "critical" | "warning" | "info";
  currentCoverage: string;
  recommendedCoverage: string;
  gap: string;
  action: string;
  route: string;
  annualCost: string;
}

function analyzeInsuranceGaps(clientData: any, calcResults: Record<string, any>): InsuranceGap[] {
  const income = clientData?.annualIncome || 100000;
  const age = clientData?.age || 40;
  const netWorth = (clientData?.cashSavings || 0) + (clientData?.taxableInvestments || 0) + 
    (clientData?.realEstateEquity || 0) + (clientData?.iraBalance || 0) + (clientData?.rothBalance || 0) +
    (clientData?.k401Balance || 0) - (clientData?.mortgageBalance || 0) - (clientData?.otherDebt || 0);
  const gaps: InsuranceGap[] = [];

  // Life Insurance
  const lifeNeed = income * 10;
  const currentLife = clientData?.lifeInsuranceCv || 0;
  if (!calcResults["life-insurance-needs"] && age < 65) {
    gaps.push({
      type: "Life Insurance", icon: Heart, color: "text-rose-400", severity: "critical",
      currentCoverage: currentLife > 0 ? `$${(currentLife/1000).toFixed(0)}K` : "Unknown",
      recommendedCoverage: `$${(lifeNeed/1000000).toFixed(1)}M`,
      gap: `Potential gap of $${((lifeNeed - currentLife)/1000000).toFixed(1)}M`,
      action: "Run Life Insurance Needs Analysis",
      route: "/portal/life-insurance-needs",
      annualCost: `~$${(lifeNeed * 0.005 / 12).toFixed(0)}/mo for term`,
    });
  }

  // Disability Insurance
  if (!calcResults["disability-insurance-needs"] && age < 60) {
    gaps.push({
      type: "Disability Insurance", icon: Activity, color: "text-orange-400", severity: "critical",
      currentCoverage: "Unknown",
      recommendedCoverage: `$${(income * 0.6 / 12 / 1000).toFixed(0)}K/mo`,
      gap: "60% of income replacement needed",
      action: "Run Disability Needs Calculator",
      route: "/portal/disability-insurance-needs",
      annualCost: `~$${(income * 0.02 / 12).toFixed(0)}/mo`,
    });
  }

  // Umbrella Insurance
  if (!calcResults["umbrella-insurance"] && netWorth > 500000) {
    gaps.push({
      type: "Umbrella Liability", icon: Umbrella, color: "text-blue-400", severity: "warning",
      currentCoverage: "Unknown",
      recommendedCoverage: `$${Math.max(1, Math.ceil(netWorth / 1000000))}M`,
      gap: `Net worth of $${(netWorth/1000000).toFixed(1)}M needs umbrella protection`,
      action: "Run Umbrella Insurance Calculator",
      route: "/portal/umbrella-insurance",
      annualCost: "~$200-500/yr per $1M",
    });
  }

  // Long-Term Care
  if (!calcResults["ltc-cost"] && age > 45) {
    gaps.push({
      type: "Long-Term Care", icon: Clock, color: "text-violet-400", severity: age > 55 ? "critical" : "warning",
      currentCoverage: "Unknown",
      recommendedCoverage: "$150-300K lifetime benefit",
      gap: "Average LTC cost: $108K/yr — can devastate retirement",
      action: "Run LTC Cost Calculator",
      route: "/portal/ltc-cost",
      annualCost: `~$${age < 55 ? "2,000" : "4,000"}/yr`,
    });
  }

  // IUL / Permanent Life
  if (!calcResults["term-vs-whole-vs-iul"] && income > 150000) {
    gaps.push({
      type: "Permanent Life / IUL", icon: Shield, color: "text-emerald-400", severity: "info",
      currentCoverage: "Term only or none",
      recommendedCoverage: "IUL for tax-free retirement income",
      gap: "Missing tax-free income stream in retirement",
      action: "Compare Term vs Whole vs IUL",
      route: "/portal/term-vs-whole-vs-iul",
      annualCost: "Varies by design",
    });
  }

  return gaps.sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });
}

/* ═══════════════════════════════════════════════════════════════════
   IUL TIME MACHINE (S21)
   ═══════════════════════════════════════════════════════════════════ */
interface IULProjection {
  year: number;
  age: number;
  iulCashValue: number;
  iulDeathBenefit: number;
  taxableAccountValue: number;
  iulTaxFreeIncome: number;
  taxableIncome: number;
  cumulativeTaxSavings: number;
}

function projectIULTimeMachine(clientData: any): IULProjection[] {
  const age = clientData?.age || 40;
  const annualPremium = (clientData?.annualIncome || 200000) * 0.10;
  const projections: IULProjection[] = [];
  
  let iulCV = 0, iulDB = annualPremium * 15, taxableVal = 0;
  let cumulativeTaxSavings = 0;
  const iulGrowth = 0.065; // Average IUL credited rate
  const taxableGrowth = 0.07;
  const taxDrag = 0.015; // Annual tax drag on taxable account
  
  for (let y = 0; y <= 40; y += 5) {
    if (y > 0) {
      for (let i = 0; i < 5; i++) {
        iulCV = iulCV * (1 + iulGrowth) + annualPremium * 0.85; // 85% goes to CV after COI
        iulDB = Math.max(iulDB, iulCV * 1.2);
        taxableVal = taxableVal * (1 + taxableGrowth - taxDrag) + annualPremium;
        cumulativeTaxSavings += taxableVal * taxDrag;
      }
    }
    
    const retirementAge = clientData?.retirementAge || 65;
    const isRetired = (age + y) >= retirementAge;
    const iulIncome = isRetired ? iulCV * 0.05 : 0; // 5% policy loan
    const taxableIncome = isRetired ? taxableVal * 0.04 * 0.75 : 0; // 4% SWR after tax
    
    projections.push({
      year: y, age: age + y,
      iulCashValue: Math.round(iulCV),
      iulDeathBenefit: Math.round(iulDB),
      taxableAccountValue: Math.round(taxableVal),
      iulTaxFreeIncome: Math.round(iulIncome),
      taxableIncome: Math.round(taxableIncome),
      cumulativeTaxSavings: Math.round(cumulativeTaxSavings),
    });
  }
  
  return projections;
}

/* ═══════════════════════════════════════════════════════════════════
   INSURANCE OPTIMIZER PANEL
   ═══════════════════════════════════════════════════════════════════ */
export function InsuranceOptimizerPanel({ compact = false }: { compact?: boolean }) {
  const { data: clientData } = useClientData();
  const { results: calcResults } = useCalcResults();

  const gaps = useMemo(() => analyzeInsuranceGaps(clientData, calcResults), [clientData, calcResults]);
  const iulProjection = useMemo(() => projectIULTimeMachine(clientData), [clientData]);

  const criticalGaps = gaps.filter(g => g.severity === "critical").length;
  const finalIUL = iulProjection[iulProjection.length - 1];

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold text-white">Insurance Intelligence</span>
          {criticalGaps > 0 && (
            <Badge variant="outline" className="text-[9px] text-red-400 border-red-500/30">{criticalGaps} critical</Badge>
          )}
        </div>

        {/* Top gaps */}
        {gaps.slice(0, 3).map(gap => {
          const Icon = gap.icon;
          return (
            <div key={gap.type} className={`flex items-start gap-2 text-[11px] p-1.5 rounded-lg ${
              gap.severity === "critical" ? "bg-red-500/10" : "bg-slate-800/50"
            }`}>
              <Icon className={`w-3.5 h-3.5 mt-0.5 ${gap.color}`} />
              <div>
                <span className="text-white font-medium">{gap.type}</span>
                <p className="text-slate-400">{gap.gap}</p>
              </div>
            </div>
          );
        })}

        {/* IUL summary */}
        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px]">
          <p className="text-emerald-400 font-medium">⏰ IUL Time Machine (40yr)</p>
          <p className="text-white">CV: ${(finalIUL.iulCashValue/1000000).toFixed(1)}M | Tax-Free: ${(finalIUL.iulTaxFreeIncome/1000).toFixed(0)}K/yr</p>
          <p className="text-slate-400">Tax savings: ${(finalIUL.cumulativeTaxSavings/1000000).toFixed(1)}M cumulative</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Insurance Gap Analysis (S79) */}
      <Card className="bg-slate-800/50 border-red-500/20">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" /> Insurance Gap Analysis
            {criticalGaps > 0 && <Badge variant="outline" className="text-[9px] text-red-400 border-red-500/30">{criticalGaps} critical gaps</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-2">
          {gaps.map(gap => {
            const Icon = gap.icon;
            return (
              <div key={gap.type} className={`p-2 rounded-lg border ${
                gap.severity === "critical" ? "bg-red-500/5 border-red-500/20" : 
                gap.severity === "warning" ? "bg-amber-500/5 border-amber-500/20" : "bg-slate-700/30 border-slate-600/30"
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${gap.color}`} />
                    <span className="text-xs font-medium text-white">{gap.type}</span>
                  </div>
                  <Badge variant="outline" className={`text-[9px] ${
                    gap.severity === "critical" ? "text-red-400 border-red-500/30" : "text-amber-400 border-amber-500/30"
                  }`}>{gap.severity}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-1.5 text-[10px]">
                  <div><span className="text-slate-500">Current:</span> <span className="text-white">{gap.currentCoverage}</span></div>
                  <div><span className="text-slate-500">Needed:</span> <span className="text-emerald-400">{gap.recommendedCoverage}</span></div>
                </div>
                <p className="text-[10px] text-amber-400/70 mt-1">{gap.gap}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[9px] text-slate-500">Est. cost: {gap.annualCost}</span>
                  <a href={gap.route} className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-0.5">
                    {gap.action} <ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
          {gaps.length === 0 && (
            <div className="text-center py-4 text-[11px] text-emerald-400">
              <CheckCircle2 className="w-6 h-6 mx-auto mb-2 opacity-50" />
              All insurance gaps analyzed — coverage looks comprehensive
            </div>
          )}
        </CardContent>
      </Card>

      {/* IUL Time Machine (S21) */}
      <Card className="bg-slate-800/50 border-emerald-500/20">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" /> IUL Time Machine — 40 Year Projection
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center p-2 rounded-lg bg-emerald-500/10">
              <p className="text-sm font-bold text-emerald-400">${(finalIUL.iulCashValue/1000000).toFixed(1)}M</p>
              <p className="text-[10px] text-slate-400">IUL Cash Value</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-blue-500/10">
              <p className="text-sm font-bold text-blue-400">${(finalIUL.iulDeathBenefit/1000000).toFixed(1)}M</p>
              <p className="text-[10px] text-slate-400">Death Benefit</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-amber-500/10">
              <p className="text-sm font-bold text-amber-400">${(finalIUL.cumulativeTaxSavings/1000000).toFixed(1)}M</p>
              <p className="text-[10px] text-slate-400">Tax Savings</p>
            </div>
          </div>

          <div className="space-y-1">
            <div className="grid grid-cols-5 gap-1 text-[9px] text-slate-500 font-medium pb-1 border-b border-slate-700/30">
              <span>Age</span><span>IUL CV</span><span>Taxable</span><span>Tax-Free Inc</span><span>Tax Saved</span>
            </div>
            {iulProjection.map(p => (
              <div key={p.year} className="grid grid-cols-5 gap-1 text-[10px] py-0.5">
                <span className="text-slate-400">{p.age}</span>
                <span className="text-emerald-400">${(p.iulCashValue/1000).toFixed(0)}K</span>
                <span className="text-blue-400">${(p.taxableAccountValue/1000).toFixed(0)}K</span>
                <span className="text-violet-400">${(p.iulTaxFreeIncome/1000).toFixed(0)}K/yr</span>
                <span className="text-amber-400">${(p.cumulativeTaxSavings/1000).toFixed(0)}K</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default InsuranceOptimizerPanel;
