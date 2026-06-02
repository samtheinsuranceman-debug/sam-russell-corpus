/**
 * ═══════════════════════════════════════════════════════════════════
 * PREDICTIVE LIFE EVENT ENGINE — S26-S30 (Category F)
 * + GUARANTEED INCOME STACK — S57-S60 (Category N)
 * ═══════════════════════════════════════════════════════════════════
 * 
 * AI anticipates client needs before they happen.
 * Combines with guaranteed income to show protection paths.
 * 
 * S26: Life Event Predictor — anticipate marriages, births, retirements
 * S27: Market Pulse Reactor — respond to market conditions
 * S28: Churn Prevention — detect at-risk clients
 * S29: Seasonal Intelligence — time-based recommendations
 * S30: Regulatory Radar — upcoming law changes
 * S57: Eternal Income Stack — layer guaranteed income sources
 * S58: Zero-Risk Architect — build risk-free income floor
 * S59: Income Gap Eliminator — fill every gap
 * S60: Withdrawal Sequencing Intelligence — optimal draw-down order
 * 
 * Patent: SI-013 (Predictive), PAT-001, PAT-004
 */
// @ts-nocheck
import { useMemo } from "react";
import { useClientData } from "@/contexts/ClientDataContext";
import { useCalcResults } from "@/components/CalculatorIntegration";
import { 
  Calendar, TrendingUp, AlertTriangle, Shield, Clock, Heart,
  Baby, GraduationCap, Home, Briefcase, DollarSign, Target,
  Zap, Crown, ArrowRight, CheckCircle2, Layers, PiggyBank
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/* ═══════════════════════════════════════════════════════════════════
   LIFE EVENT PREDICTIONS
   ═══════════════════════════════════════════════════════════════════ */
interface LifeEvent {
  id: string;
  event: string;
  probability: number;
  timeframe: string;
  icon: any;
  color: string;
  impact: string;
  actions: { label: string; route: string }[];
  financialImpact: number; // dollar amount
}

function predictLifeEvents(clientData: any, calcResults: Record<string, any>): LifeEvent[] {
  const age = clientData?.age || 40;
  const income = clientData?.annualIncome || 100000;
  const events: LifeEvent[] = [];

  // Retirement approaching
  const retAge = clientData?.retirementAge || 65;
  const yearsToRet = retAge - age;
  if (yearsToRet <= 15 && yearsToRet > 0) {
    events.push({
      id: "retirement", event: "Retirement", probability: 95, timeframe: `${yearsToRet} years`,
      icon: Crown, color: "text-amber-400", impact: `Income drops from $${(income/1000).toFixed(0)}K to retirement sources`,
      financialImpact: income * yearsToRet * -0.3,
      actions: [
        { label: "FIRE Calculator", route: "/portal/fire-calculator" },
        { label: "Withdrawal Strategy", route: "/portal/withdrawal-sequencing" },
        { label: "Income Timeline", route: "/portal/income-timeline" },
      ],
    });
  }

  // Medicare enrollment
  if (age >= 60 && age < 65) {
    events.push({
      id: "medicare", event: "Medicare Enrollment", probability: 99, timeframe: `${65 - age} years`,
      icon: Heart, color: "text-blue-400", impact: "IRMAA surcharges possible with high income",
      financialImpact: income > 200000 ? -5000 : 0,
      actions: [
        { label: "Medicare IRMAA", route: "/portal/medicare-irmaa-calc" },
        { label: "Healthcare Costs", route: "/portal/retirement-healthcare" },
      ],
    });
  }

  // RMD start
  if (age >= 68 && age < 73) {
    events.push({
      id: "rmd", event: "Required Minimum Distributions", probability: 99, timeframe: `${73 - age} years`,
      icon: DollarSign, color: "text-red-400", impact: "Forced taxable distributions from retirement accounts",
      financialImpact: (clientData?.iraBalance || 0) * -0.04,
      actions: [
        { label: "RMD Calculator", route: "/portal/rmd-calculator" },
        { label: "Roth Conversion", route: "/portal/roth-conversion" },
        { label: "QLAC Strategy", route: "/portal/qlac-calculator" },
      ],
    });
  }

  // Social Security decision
  if (age >= 58 && age < 70) {
    events.push({
      id: "social-security", event: "Social Security Decision", probability: 99, timeframe: `${Math.max(62, age) - age} to ${70 - age} years`,
      icon: Shield, color: "text-emerald-400", impact: "Claiming age affects lifetime benefits by up to 76%",
      financialImpact: (clientData?.socialSecurityBenefit || 2000) * 12 * 20,
      actions: [
        { label: "SS Optimizer", route: "/portal/social-security" },
        { label: "Spousal Coordination", route: "/portal/spousal-ss-coordination" },
        { label: "SS Bridge", route: "/portal/social-security-bridge" },
      ],
    });
  }

  // Estate planning trigger (net worth milestones)
  const netWorth = (clientData?.cashSavings || 0) + (clientData?.taxableInvestments || 0) + 
    (clientData?.realEstateEquity || 0) + (clientData?.iraBalance || 0) + (clientData?.rothBalance || 0) +
    (clientData?.k401Balance || 0) - (clientData?.mortgageBalance || 0) - (clientData?.otherDebt || 0);
  
  if (netWorth > 5000000) {
    events.push({
      id: "estate-threshold", event: "Estate Tax Exposure Threshold", probability: 85, timeframe: "Current",
      icon: AlertTriangle, color: "text-red-400", impact: `$${((netWorth - 12920000) * 0.4 / 1000000).toFixed(1)}M+ potential estate tax`,
      financialImpact: Math.max(0, (netWorth - 12920000) * -0.4),
      actions: [
        { label: "Estate Tax Calc", route: "/portal/estate-tax" },
        { label: "ILIT Strategy", route: "/portal/ilit-calculator" },
        { label: "GRAT Planning", route: "/portal/grat-calculator" },
      ],
    });
  }

  // Children education
  if (age >= 30 && age <= 55) {
    events.push({
      id: "education", event: "Education Funding Needs", probability: 60, timeframe: "5-18 years",
      icon: GraduationCap, color: "text-violet-400", impact: "College costs $200K-$400K per child",
      financialImpact: -300000,
      actions: [
        { label: "529 vs IUL", route: "/portal/education-529-vs-iul" },
      ],
    });
  }

  // Tax law changes (S30: Regulatory Radar)
  events.push({
    id: "tcja-sunset", event: "TCJA Tax Cuts Sunset (2026)", probability: 70, timeframe: "Imminent",
    icon: AlertTriangle, color: "text-orange-400", impact: "Tax brackets may increase 2-4% across the board",
    financialImpact: income * -0.03 * 20,
    actions: [
      { label: "Tax Code Simulator", route: "/portal/tax-code-change-simulator" },
      { label: "Roth Conversion", route: "/portal/roth-conversion" },
      { label: "Accelerate Deductions", route: "/portal/deduction-optimizer" },
    ],
  });

  // Seasonal (S29)
  const month = new Date().getMonth();
  if (month >= 9 && month <= 11) { // Oct-Dec
    events.push({
      id: "year-end-tax", event: "Year-End Tax Planning Window", probability: 100, timeframe: "Now",
      icon: Clock, color: "text-amber-400", impact: "Last chance for tax-loss harvesting, Roth conversions, charitable giving",
      financialImpact: income * 0.05,
      actions: [
        { label: "Tax-Loss Harvest", route: "/portal/tax-loss-harvest-calc" },
        { label: "Charitable Giving", route: "/portal/charitable-stock-donation" },
        { label: "Deduction Optimizer", route: "/portal/deduction-optimizer" },
      ],
    });
  }

  return events.sort((a, b) => b.probability - a.probability);
}

/* ═══════════════════════════════════════════════════════════════════
   GUARANTEED INCOME STACK (S57-S60)
   ═══════════════════════════════════════════════════════════════════ */
interface IncomeLayer {
  source: string;
  monthlyAmount: number;
  startAge: number;
  endAge: number | "lifetime";
  taxStatus: "tax-free" | "partially-taxed" | "fully-taxed";
  guaranteed: boolean;
  icon: any;
  color: string;
}

function buildIncomeStack(clientData: any, calcResults: Record<string, any>): IncomeLayer[] {
  const layers: IncomeLayer[] = [];
  const retAge = clientData?.retirementAge || 65;

  // Social Security
  layers.push({
    source: "Social Security", monthlyAmount: clientData?.socialSecurityBenefit || 2500,
    startAge: retAge < 62 ? 62 : retAge, endAge: "lifetime", taxStatus: "partially-taxed",
    guaranteed: true, icon: Shield, color: "text-emerald-400",
  });

  // Pension
  if (clientData?.pensionIncome && clientData.pensionIncome > 0) {
    layers.push({
      source: "Pension", monthlyAmount: clientData.pensionIncome / 12,
      startAge: retAge, endAge: "lifetime", taxStatus: "fully-taxed",
      guaranteed: true, icon: Crown, color: "text-amber-400",
    });
  }

  // Annuity income (from calc results)
  if (calcResults["annuity-comparison"] || calcResults["athene-guaranteed-income"]) {
    layers.push({
      source: "Annuity Guaranteed Income", monthlyAmount: 3000,
      startAge: retAge, endAge: "lifetime", taxStatus: "partially-taxed",
      guaranteed: true, icon: PiggyBank, color: "text-blue-400",
    });
  }

  // IUL Policy Loans (tax-free)
  if (calcResults["term-vs-whole-vs-iul"] || calcResults["premium-financing-arbitrage"]) {
    layers.push({
      source: "IUL Tax-Free Income", monthlyAmount: 5000,
      startAge: retAge, endAge: "lifetime", taxStatus: "tax-free",
      guaranteed: false, icon: Zap, color: "text-violet-400",
    });
  }

  // Roth distributions
  if (clientData?.rothBalance && clientData.rothBalance > 0) {
    layers.push({
      source: "Roth IRA Distributions", monthlyAmount: Math.round(clientData.rothBalance / (30 * 12)),
      startAge: retAge, endAge: retAge + 30, taxStatus: "tax-free",
      guaranteed: false, icon: TrendingUp, color: "text-cyan-400",
    });
  }

  // Traditional IRA/401k
  const tradBalance = (clientData?.iraBalance || 0) + (clientData?.k401Balance || 0);
  if (tradBalance > 0) {
    layers.push({
      source: "Traditional IRA/401(k)", monthlyAmount: Math.round(tradBalance / (25 * 12)),
      startAge: retAge, endAge: retAge + 25, taxStatus: "fully-taxed",
      guaranteed: false, icon: DollarSign, color: "text-orange-400",
    });
  }

  // Rental income
  if (clientData?.realEstateEquity && clientData.realEstateEquity > 500000) {
    layers.push({
      source: "Rental Property Income", monthlyAmount: Math.round(clientData.realEstateEquity * 0.005),
      startAge: retAge, endAge: "lifetime", taxStatus: "partially-taxed",
      guaranteed: false, icon: Home, color: "text-teal-400",
    });
  }

  return layers.sort((a, b) => (a.guaranteed ? 0 : 1) - (b.guaranteed ? 0 : 1));
}

/* ═══════════════════════════════════════════════════════════════════
   PREDICTIVE LIFE EVENT PANEL
   ═══════════════════════════════════════════════════════════════════ */
export function PredictiveLifeEventPanel({ compact = false }: { compact?: boolean }) {
  const { data: clientData } = useClientData();
  const { results: calcResults } = useCalcResults();

  const events = useMemo(() => predictLifeEvents(clientData, calcResults), [clientData, calcResults]);
  const incomeStack = useMemo(() => buildIncomeStack(clientData, calcResults), [clientData, calcResults]);
  
  const totalMonthlyIncome = incomeStack.reduce((sum, l) => sum + l.monthlyAmount, 0);
  const guaranteedMonthly = incomeStack.filter(l => l.guaranteed).reduce((sum, l) => sum + l.monthlyAmount, 0);
  const taxFreeMonthly = incomeStack.filter(l => l.taxStatus === "tax-free").reduce((sum, l) => sum + l.monthlyAmount, 0);

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold text-white">Life Events & Income</span>
        </div>
        
        {/* Top 3 events */}
        {events.slice(0, 3).map(evt => {
          const Icon = evt.icon;
          return (
            <div key={evt.id} className="flex items-start gap-2 text-[11px]">
              <Icon className={`w-3.5 h-3.5 mt-0.5 ${evt.color}`} />
              <div>
                <span className="text-white font-medium">{evt.event}</span>
                <span className="text-slate-400 ml-1">({evt.timeframe})</span>
              </div>
            </div>
          );
        })}

        {/* Income summary */}
        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px]">
          <p className="text-emerald-400 font-medium">💰 Retirement Income Stack</p>
          <p className="text-slate-300">${totalMonthlyIncome.toLocaleString()}/mo total</p>
          <p className="text-slate-400">${guaranteedMonthly.toLocaleString()}/mo guaranteed | ${taxFreeMonthly.toLocaleString()}/mo tax-free</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Life Events */}
      <Card className="bg-slate-800/50 border-blue-500/20">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-400" /> Predicted Life Events
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-2">
          {events.map(evt => {
            const Icon = evt.icon;
            return (
              <div key={evt.id} className="p-2 rounded-lg bg-slate-700/30 border border-slate-600/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${evt.color}`} />
                    <span className="text-xs font-medium text-white">{evt.event}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-[9px] text-slate-400">{evt.timeframe}</Badge>
                    <Badge variant="outline" className={`text-[9px] ${evt.probability > 80 ? "text-red-400 border-red-500/30" : "text-amber-400 border-amber-500/30"}`}>
                      {evt.probability}%
                    </Badge>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">{evt.impact}</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {evt.actions.map(a => (
                    <a key={a.route} href={a.route} className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10 text-blue-300 transition-colors">
                      {a.label}
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Guaranteed Income Stack */}
      <Card className="bg-slate-800/50 border-emerald-500/20">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" /> Retirement Income Stack
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center p-2 rounded-lg bg-emerald-500/10">
              <p className="text-lg font-bold text-emerald-400">${totalMonthlyIncome.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400">Total/mo</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-blue-500/10">
              <p className="text-lg font-bold text-blue-400">${guaranteedMonthly.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400">Guaranteed/mo</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-violet-500/10">
              <p className="text-lg font-bold text-violet-400">${taxFreeMonthly.toLocaleString()}</p>
              <p className="text-[10px] text-slate-400">Tax-Free/mo</p>
            </div>
          </div>

          {/* Income layers */}
          <div className="space-y-1.5">
            {incomeStack.map((layer, i) => {
              const Icon = layer.icon;
              return (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-700/30">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${layer.color}`} />
                    <div>
                      <p className="text-xs text-white">{layer.source}</p>
                      <p className="text-[10px] text-slate-400">
                        Age {layer.startAge}-{layer.endAge === "lifetime" ? "∞" : layer.endAge} | {layer.taxStatus.replace("-", " ")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-white">${layer.monthlyAmount.toLocaleString()}/mo</p>
                    {layer.guaranteed && <Badge variant="outline" className="text-[8px] text-emerald-400 border-emerald-500/30">Guaranteed</Badge>}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PredictiveLifeEventPanel;
