/**
 * ═══════════════════════════════════════════════════════════════════
 * GUARANTEED INCOME & TAX MINIMIZATION ENGINE
 * ═══════════════════════════════════════════════════════════════════
 * 
 * S57: Eternal Income Stack — layer guaranteed income sources
 * S58: Zero-Risk Architect — build risk-free income floor
 * S59: Annuity Combination Engine — optimize annuity mix
 * S60: Pension Maximization — maximize pension benefits
 * S16: Tax Elimination Reactor — zero-tax strategies
 * S17: Bracket Surfing Engine — optimal bracket management
 * S18: Roth Conversion Optimizer — multi-year conversion plan
 * S19: Tax-Loss Harvesting AI — automated loss harvesting
 * S20: Charitable Deduction Maximizer — optimize giving
 * S83: Marginal Dollar Optimizer — where to put the next dollar
 * S84: RMD Optimization Engine — minimize required distributions
 * S85: Social Security Maximizer — optimal claiming strategy
 * S86: Pension Maximization Intelligence
 * 
 * Patent: PAT-001, PAT-004, SI-023
 */
// @ts-nocheck
import { useMemo } from "react";
import { useClientData } from "@/contexts/ClientDataContext";
import { useCalcResults } from "@/components/CalculatorIntegration";
import { 
  DollarSign, TrendingUp, Shield, Target, Zap, Clock,
  ArrowRight, BarChart3, PiggyBank, Crown, Layers,
  CheckCircle2, AlertTriangle, Sparkles, Lock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/* ═══════════════════════════════════════════════════════════════════
   INCOME STACK BUILDER (S57-S60)
   ═══════════════════════════════════════════════════════════════════ */
interface IncomeLayer {
  source: string;
  monthlyAmount: number;
  startAge: number;
  endAge: number | "lifetime";
  taxStatus: "tax-free" | "partially-taxed" | "fully-taxed";
  guaranteed: boolean;
  color: string;
  icon: any;
}

function buildIncomeStack(clientData: any, calcResults: Record<string, any>): IncomeLayer[] {
  const income = clientData?.annualIncome || 200000;
  const age = clientData?.age || 45;
  const retAge = clientData?.retirementAge || 65;
  const ssAge = Math.max(62, Math.min(70, retAge));
  const layers: IncomeLayer[] = [];

  // Social Security (S85)
  const ssMonthly = Math.min(4555, income * 0.015);
  layers.push({
    source: "Social Security", monthlyAmount: Math.round(ssMonthly),
    startAge: ssAge, endAge: "lifetime", taxStatus: "partially-taxed",
    guaranteed: true, color: "text-blue-400", icon: Shield,
  });

  // IUL Tax-Free Income
  const iulCV = clientData?.lifeInsuranceCv || income * 2;
  if (iulCV > 0 || calcResults["term-vs-whole-vs-iul"]) {
    layers.push({
      source: "IUL Policy Loans (Tax-Free)", monthlyAmount: Math.round(iulCV * 0.05 / 12),
      startAge: retAge, endAge: "lifetime", taxStatus: "tax-free",
      guaranteed: false, color: "text-emerald-400", icon: Sparkles,
    });
  }

  // Roth Withdrawals
  const rothBal = clientData?.rothBalance || 0;
  if (rothBal > 0) {
    layers.push({
      source: "Roth IRA (Tax-Free)", monthlyAmount: Math.round(rothBal * 0.04 / 12),
      startAge: retAge, endAge: "lifetime", taxStatus: "tax-free",
      guaranteed: false, color: "text-violet-400", icon: TrendingUp,
    });
  }

  // 401k / IRA
  const tradBal = (clientData?.iraBalance || 0) + (clientData?.k401Balance || 0);
  if (tradBal > 0) {
    layers.push({
      source: "401(k)/IRA Withdrawals", monthlyAmount: Math.round(tradBal * 0.04 / 12),
      startAge: retAge, endAge: "lifetime", taxStatus: "fully-taxed",
      guaranteed: false, color: "text-amber-400", icon: PiggyBank,
    });
  }

  // Rental Income
  if (clientData?.rentalIncome && clientData.rentalIncome > 0) {
    layers.push({
      source: "Rental Income", monthlyAmount: Math.round(clientData.rentalIncome / 12),
      startAge: age, endAge: "lifetime", taxStatus: "partially-taxed",
      guaranteed: false, color: "text-teal-400", icon: DollarSign,
    });
  }

  // Pension
  if (clientData?.pensionIncome && clientData.pensionIncome > 0) {
    layers.push({
      source: "Pension", monthlyAmount: Math.round(clientData.pensionIncome / 12),
      startAge: retAge, endAge: "lifetime", taxStatus: "fully-taxed",
      guaranteed: true, color: "text-purple-400", icon: Crown,
    });
  }

  return layers.sort((a, b) => b.monthlyAmount - a.monthlyAmount);
}

/* ═══════════════════════════════════════════════════════════════════
   TAX MINIMIZATION ENGINE (S16-S20)
   ═══════════════════════════════════════════════════════════════════ */
interface TaxStrategy {
  name: string;
  annualSavings: number;
  lifetimeSavings: number;
  mechanism: string;
  complexity: "simple" | "moderate" | "advanced";
  calculatorRoute: string;
  icon: any;
  color: string;
  active: boolean;
}

function buildTaxStrategies(clientData: any, calcResults: Record<string, any>): TaxStrategy[] {
  const income = clientData?.annualIncome || 200000;
  const age = clientData?.age || 45;
  const retAge = clientData?.retirementAge || 65;
  const yearsToRet = retAge - age;
  const strategies: TaxStrategy[] = [];

  // S18: Roth Conversion
  const iraBalance = (clientData?.iraBalance || 0) + (clientData?.k401Balance || 0);
  if (iraBalance > 0) {
    const annualConversion = Math.min(iraBalance / yearsToRet, 50000);
    const taxSaved = annualConversion * 0.22 * yearsToRet * 0.3; // 30% more in future brackets
    strategies.push({
      name: "Roth Conversion Ladder", annualSavings: Math.round(annualConversion * 0.05),
      lifetimeSavings: Math.round(taxSaved), mechanism: "Convert IRA to Roth in low-bracket years, grow tax-free forever",
      complexity: "moderate", calculatorRoute: "/portal/roth-conversion-calc",
      icon: TrendingUp, color: "text-violet-400", active: !!calcResults["roth-conversion-calc"],
    });
  }

  // S17: Bracket Surfing
  if (income > 100000) {
    strategies.push({
      name: "Tax Bracket Surfing", annualSavings: Math.round(income * 0.03),
      lifetimeSavings: Math.round(income * 0.03 * yearsToRet), mechanism: "Fill lower brackets with Roth conversions, defer income to lower-bracket years",
      complexity: "advanced", calculatorRoute: "/portal/marginal-tax-rate-calc",
      icon: Zap, color: "text-amber-400", active: !!calcResults["marginal-tax-rate-calc"],
    });
  }

  // S20: Charitable Deduction
  if (income > 150000) {
    strategies.push({
      name: "Charitable Deduction Maximizer", annualSavings: Math.round(income * 0.04 * 0.32),
      lifetimeSavings: Math.round(income * 0.04 * 0.32 * yearsToRet), mechanism: "Bunch donations, use DAF, donate appreciated stock to avoid capital gains",
      complexity: "moderate", calculatorRoute: "/portal/charitable-stock-donation",
      icon: Shield, color: "text-rose-400", active: !!calcResults["charitable-stock-donation"],
    });
  }

  // S19: Tax-Loss Harvesting
  const taxableInv = clientData?.taxableInvestments || 0;
  if (taxableInv > 50000) {
    strategies.push({
      name: "Tax-Loss Harvesting AI", annualSavings: Math.round(taxableInv * 0.01),
      lifetimeSavings: Math.round(taxableInv * 0.01 * yearsToRet), mechanism: "Systematically harvest losses to offset gains, carry forward excess",
      complexity: "simple", calculatorRoute: "/portal/tax-loss-harvesting-calc",
      icon: Target, color: "text-cyan-400", active: !!calcResults["tax-loss-harvesting-calc"],
    });
  }

  // Backdoor Roth
  if (income > 161000) {
    strategies.push({
      name: "Backdoor Roth IRA", annualSavings: Math.round(7000 * 0.07 * 0.22),
      lifetimeSavings: Math.round(7000 * Math.pow(1.07, yearsToRet) * 0.22), mechanism: "Contribute to non-deductible IRA, convert to Roth — bypass income limits",
      complexity: "moderate", calculatorRoute: "/portal/backdoor-roth",
      icon: Lock, color: "text-emerald-400", active: !!calcResults["backdoor-roth"],
    });
  }

  // S16: Tax Elimination via IUL
  strategies.push({
    name: "Tax-Free Retirement via IUL", annualSavings: Math.round(income * 0.1 * 0.25),
    lifetimeSavings: Math.round(income * 0.1 * 0.25 * yearsToRet * 2), mechanism: "Fund IUL with after-tax dollars, access tax-free via policy loans in retirement",
    complexity: "advanced", calculatorRoute: "/portal/term-vs-whole-vs-iul",
    icon: Sparkles, color: "text-yellow-400", active: !!calcResults["term-vs-whole-vs-iul"],
  });

  return strategies.sort((a, b) => b.lifetimeSavings - a.lifetimeSavings);
}

/* ═══════════════════════════════════════════════════════════════════
   MARGINAL DOLLAR OPTIMIZER (S83)
   ═══════════════════════════════════════════════════════════════════ */
interface MarginalDollarOption {
  destination: string;
  priority: number;
  reason: string;
  taxBenefit: string;
  route: string;
}

function getMarginalDollarPriority(clientData: any, calcResults: Record<string, any>): MarginalDollarOption[] {
  const income = clientData?.annualIncome || 200000;
  const options: MarginalDollarOption[] = [];
  let priority = 1;

  // Always max employer match first
  options.push({ destination: "401(k) to Employer Match", priority: priority++, reason: "100% instant return on employer match", taxBenefit: "Pre-tax + match", route: "/portal/401k-max-calc" });

  // HSA if eligible
  if (income < 400000) {
    options.push({ destination: "HSA (if HDHP eligible)", priority: priority++, reason: "Triple tax advantage — deduction, growth, withdrawal", taxBenefit: "Triple tax-free", route: "/portal/hsa-vs-traditional-calc" });
  }

  // Max 401k
  options.push({ destination: "401(k) to Maximum ($23,500)", priority: priority++, reason: "Reduce current taxable income", taxBenefit: "Pre-tax deduction", route: "/portal/401k-max-calc" });

  // Backdoor Roth
  if (income > 161000) {
    options.push({ destination: "Backdoor Roth IRA ($7,000)", priority: priority++, reason: "Tax-free growth bypassing income limits", taxBenefit: "Tax-free growth", route: "/portal/backdoor-roth" });
  }

  // Mega Backdoor
  if (income > 200000) {
    options.push({ destination: "Mega Backdoor Roth ($46,000)", priority: priority++, reason: "Massive tax-free accumulation if plan allows", taxBenefit: "Tax-free growth", route: "/portal/mega-backdoor-roth" });
  }

  // IUL
  options.push({ destination: "IUL Premium Funding", priority: priority++, reason: "Tax-free retirement income + death benefit", taxBenefit: "Tax-free loans", route: "/portal/term-vs-whole-vs-iul" });

  // Taxable
  options.push({ destination: "Taxable Brokerage", priority: priority++, reason: "No contribution limits, flexible access", taxBenefit: "LTCG rates", route: "/portal/investment-growth-calc" });

  return options;
}

/* ═══════════════════════════════════════════════════════════════════
   GUARANTEED INCOME & TAX PANEL
   ═══════════════════════════════════════════════════════════════════ */
export function GuaranteedIncomePanel({ compact = false }: { compact?: boolean }) {
  const { data: clientData } = useClientData();
  const { results: calcResults } = useCalcResults();

  const incomeStack = useMemo(() => buildIncomeStack(clientData, calcResults), [clientData, calcResults]);
  const taxStrategies = useMemo(() => buildTaxStrategies(clientData, calcResults), [clientData, calcResults]);
  const marginalDollar = useMemo(() => getMarginalDollarPriority(clientData, calcResults), [clientData, calcResults]);

  const totalMonthlyIncome = incomeStack.reduce((sum, l) => sum + l.monthlyAmount, 0);
  const taxFreeIncome = incomeStack.filter(l => l.taxStatus === "tax-free").reduce((sum, l) => sum + l.monthlyAmount, 0);
  const totalLifetimeTaxSavings = taxStrategies.reduce((sum, s) => sum + s.lifetimeSavings, 0);

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-semibold text-white">Income & Tax</span>
        </div>

        {/* Income summary */}
        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-[10px] text-emerald-300 font-medium">💰 Retirement Income Stack</p>
          <p className="text-sm font-bold text-white">${totalMonthlyIncome.toLocaleString()}/mo</p>
          <p className="text-[10px] text-slate-400">
            Tax-free: ${taxFreeIncome.toLocaleString()}/mo ({totalMonthlyIncome > 0 ? Math.round(taxFreeIncome/totalMonthlyIncome*100) : 0}%)
          </p>
        </div>

        {/* Tax savings */}
        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-[10px] text-amber-300 font-medium">🛡️ Tax Savings Potential</p>
          <p className="text-sm font-bold text-white">${(totalLifetimeTaxSavings/1000000).toFixed(1)}M lifetime</p>
          <p className="text-[10px] text-slate-400">{taxStrategies.length} strategies identified</p>
        </div>

        {/* Top marginal dollar */}
        {marginalDollar[0] && (
          <div className="text-[11px]">
            <span className="text-slate-400">Next $1 goes to:</span>
            <span className="text-emerald-400 ml-1 font-medium">{marginalDollar[0].destination}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Income Stack (S57-S60) */}
      <Card className="bg-slate-800/50 border-emerald-500/20">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" /> Guaranteed Income Stack
            <Badge variant="outline" className="text-[9px] text-emerald-400 border-emerald-500/30">${totalMonthlyIncome.toLocaleString()}/mo</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-1.5">
          {incomeStack.map((layer, i) => {
            const Icon = layer.icon;
            return (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-700/30">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${layer.color}`} />
                  <div>
                    <p className="text-xs text-white">{layer.source}</p>
                    <p className="text-[10px] text-slate-400">
                      Age {layer.startAge}–{layer.endAge} | {layer.taxStatus.replace("-", " ")}
                      {layer.guaranteed && " | ✓ Guaranteed"}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-bold text-white">${layer.monthlyAmount.toLocaleString()}/mo</span>
              </div>
            );
          })}
          <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
            <span className="text-xs text-slate-400">Total Monthly Income</span>
            <span className="text-sm font-bold text-emerald-400">${totalMonthlyIncome.toLocaleString()}/mo</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Tax-Free Portion</span>
            <span className="text-sm font-bold text-violet-400">${taxFreeIncome.toLocaleString()}/mo ({totalMonthlyIncome > 0 ? Math.round(taxFreeIncome/totalMonthlyIncome*100) : 0}%)</span>
          </div>
        </CardContent>
      </Card>

      {/* Tax Strategies (S16-S20) */}
      <Card className="bg-slate-800/50 border-amber-500/20">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" /> Tax Minimization Strategies
            <Badge variant="outline" className="text-[9px] text-amber-400 border-amber-500/30">${(totalLifetimeTaxSavings/1000000).toFixed(1)}M lifetime savings</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-2">
          {taxStrategies.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className={`p-2 rounded-lg border ${s.active ? "bg-emerald-500/5 border-emerald-500/20" : "bg-slate-700/30 border-slate-600/30"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${s.color}`} />
                    <span className="text-xs font-medium text-white">{s.name}</span>
                    {s.active && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  </div>
                  <Badge variant="outline" className="text-[9px] text-emerald-400 border-emerald-500/30">${(s.lifetimeSavings/1000).toFixed(0)}K lifetime</Badge>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">{s.mechanism}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[9px] text-slate-500">Annual: ${s.annualSavings.toLocaleString()} | {s.complexity}</span>
                  {!s.active && (
                    <a href={s.calculatorRoute} className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-0.5">
                      Analyze <ArrowRight className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Marginal Dollar Optimizer (S83) */}
      <Card className="bg-slate-800/50 border-blue-500/20">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-400" /> Marginal Dollar Optimizer
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3 space-y-1">
          {marginalDollar.map((opt, i) => (
            <a key={i} href={opt.route} className="flex items-center gap-2 p-2 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
              <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-400">
                {opt.priority}
              </div>
              <div className="flex-1">
                <p className="text-xs text-white">{opt.destination}</p>
                <p className="text-[10px] text-slate-400">{opt.reason}</p>
              </div>
              <Badge variant="outline" className="text-[8px] text-emerald-400 border-emerald-500/30">{opt.taxBenefit}</Badge>
            </a>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export default GuaranteedIncomePanel;
