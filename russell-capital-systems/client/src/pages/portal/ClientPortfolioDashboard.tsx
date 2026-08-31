// @ts-nocheck
import { useState, useMemo, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { NumberInput } from "@/components/NumberInput";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, ComposedChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadialBarChart, RadialBar,
} from "recharts";
import {
  Briefcase, DollarSign, TrendingUp, Shield, Target, Zap,
  Building2, Home, Landmark, Flame, PieChart as PieChartIcon,
  ArrowUpRight, ArrowDownRight, ChevronDown, ChevronUp,
  Clock, Award, BarChart3, Layers, Scale, Info, Lock,
  CheckCircle2, AlertTriangle, Wallet, Percent, Users,
} from "lucide-react";
import { runMYGAWaterfall, getDefaultInput, type MYGAWaterfallInput } from "@shared/mygaWaterfall";

/* ═══════════════════════════════════════════════════════════════════════════
   FORMATTERS
   ═══════════════════════════════════════════════════════════════════════════ */
function fmt$(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}
function fmtFull(n: number): string {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}
function fmtPct(n: number): string { return `${n.toFixed(1)}%`; }

/* ═══════════════════════════════════════════════════════════════════════════
   STRATEGY DEFINITIONS — The 7 Core Wealth Engines
   ═══════════════════════════════════════════════════════════════════════════ */
interface StrategyDef {
  id: string;
  name: string;
  shortName: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  ircCodes: string[];
  category: string;
}

const STRATEGIES: StrategyDef[] = [
  {
    id: "miga", name: "MYGA → O&G Waterfall", shortName: "MYGA",
    icon: Flame, color: "text-amber-400", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/30",
    description: "MYGA at 6.25% → Borrow 70% at 7% → Invest in O&G at 15% for 10-12 years → 90% Year 1 tax deduction → Tax savings pay principal-only on bank LOC",
    ircCodes: ["§263(c)", "§613", "§469(c)(3)"],
    category: "Tax Elimination",
  },
  {
    id: "iul", name: "IUL Cash Value Engine", shortName: "IUL",
    icon: Shield, color: "text-emerald-400", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/30",
    description: "Indexed Universal Life policy with tax-free cash value growth, policy loans for property acquisition, and tax-free death benefit",
    ircCodes: ["§7702", "§72(e)", "§101(a)"],
    category: "Tax-Free Growth",
  },
  {
    id: "heloc", name: "HELOC Equity Extraction", shortName: "HELOC",
    icon: Home, color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/30",
    description: "Extract home equity via HELOC → Fund IUL premiums → Policy loans → Acquire properties → Repeat cycle until mortgage = $0",
    ircCodes: ["§163(h)", "§121"],
    category: "Leverage",
  },
  {
    id: "str", name: "Short-Term Rental Strategy", shortName: "STR",
    icon: Building2, color: "text-violet-400", bgColor: "bg-violet-500/10", borderColor: "border-violet-500/30",
    description: "Cost segregation + bonus depreciation on STR properties → massive Year 1 deductions → offset W-2 income → acquire new properties annually",
    ircCodes: ["§168(k)", "§179", "§469(c)(7)"],
    category: "Tax Elimination",
  },
  {
    id: "trusts", name: "Trust Structures", shortName: "Trusts",
    icon: Landmark, color: "text-rose-400", bgColor: "bg-rose-500/10", borderColor: "border-rose-500/30",
    description: "ILIT, SLAT, BLAT, PLAT, Dynasty Trust — estate tax elimination, asset protection, generational wealth transfer",
    ircCodes: ["§2042", "§2503(b)", "§2611", "§677"],
    category: "Estate Planning",
  },
  {
    id: "roth", name: "Roth Conversion Ladder", shortName: "Roth",
    icon: Scale, color: "text-cyan-400", bgColor: "bg-cyan-500/10", borderColor: "border-cyan-500/30",
    description: "Strategic Roth conversions during low-income years → tax-free growth forever → no RMDs → generational Roth IRA",
    ircCodes: ["§408A", "§402(c)"],
    category: "Tax-Free Growth",
  },
  {
    id: "premium_finance", name: "Premium Financing", shortName: "PremFin",
    icon: Wallet, color: "text-orange-400", bgColor: "bg-orange-500/10", borderColor: "border-orange-500/30",
    description: "Borrow to fund large IUL premiums → leverage bank money for tax-free growth → arbitrage between loan rate and policy crediting rate",
    ircCodes: ["§7702", "§264(a)"],
    category: "Leverage",
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   MYGA CYCLE ENGINE — The Core Wealth Machine
   ═══════════════════════════════════════════════════════════════════════════ */
interface MIGACycleYear {
  year: number;
  cycle: number;
  mygaValue: number;
  mygaInterest: number;
  bankLoanBalance: number;
  bankInterest: number;
  ogInvestment: number;
  ogIncome: number;
  ogActiveStreams: number;
  taxDeduction: number;
  taxSavings: number;
  principalPayment: number;
  netCashFlow: number;
  cumulativeWealth: number;
  cumulativeTaxSaved: number;
  cumulativeOGIncome: number;
}

function runMIGAEngine(
  mygaPremium: number,
  mygaRate: number, // 6.25
  bankLTV: number, // 0.70
  bankRate: number, // 7
  ogReturn: number, // 15
  ogTerm: number, // 12
  taxDeductionPct: number, // 90
  annualIncome: number,
  combinedTaxRate: number, // e.g. 0.42
  projectionYears: number,
): MIGACycleYear[] {
  const mygaRateDec = mygaRate / 100;
  const bankRateDec = bankRate / 100;
  const ogReturnDec = ogReturn / 100;
  const deductionPct = taxDeductionPct / 100;

  interface OGStream {
    cycle: number;
    investment: number;
    annualIncome: number;
    startYear: number;
    endYear: number;
  }

  interface BankLoan {
    cycle: number;
    originalPrincipal: number;
    balance: number;
    startYear: number;
  }

  const ogStreams: OGStream[] = [];
  const bankLoans: BankLoan[] = [];
  const results: MIGACycleYear[] = [];

  let currentMygaValue = 0;
  let cumTaxSaved = 0;
  let cumOGIncome = 0;
  let cumWealth = 0;

  for (let year = 1; year <= projectionYears; year++) {
    const cycleNumber = Math.ceil(year / 5);
    const cycleYear = ((year - 1) % 5) + 1;

    // ─── Start of new 5-year MYGA cycle ───
    if (cycleYear === 1) {
      // Maturity rollover from previous cycle
      let rollover = 0;
      if (cycleNumber > 1 && currentMygaValue > 0) {
        // Pay off any remaining bank loan from previous cycle
        const prevLoan = bankLoans.find(l => l.cycle === cycleNumber - 1 && l.balance > 0);
        if (prevLoan) {
          const payoff = Math.min(currentMygaValue, prevLoan.balance);
          prevLoan.balance -= payoff;
          rollover = currentMygaValue - payoff;
        } else {
          rollover = currentMygaValue;
        }
      }

      // New MYGA starts
      currentMygaValue = mygaPremium + rollover;

      // Borrow 70% of MYGA value
      const loanAmount = currentMygaValue * bankLTV;
      bankLoans.push({
        cycle: cycleNumber,
        originalPrincipal: loanAmount,
        balance: loanAmount,
        startYear: year,
      });

      // Invest loan proceeds into O&G
      ogStreams.push({
        cycle: cycleNumber,
        investment: loanAmount,
        annualIncome: loanAmount * ogReturnDec,
        startYear: year,
        endYear: year + ogTerm - 1,
      });
    }

    // ─── MYGA compounds at 6.25% ───
    const mygaInterest = currentMygaValue * mygaRateDec;
    currentMygaValue += mygaInterest;

    // ─── O&G income from all active streams ───
    let yearOGIncome = 0;
    let activeStreams = 0;
    for (const stream of ogStreams) {
      if (year >= stream.startYear && year <= stream.endYear) {
        yearOGIncome += stream.annualIncome;
        activeStreams++;
      }
    }
    cumOGIncome += yearOGIncome;

    // ─── Bank interest across all active loans ───
    let yearBankInterest = 0;
    for (const loan of bankLoans) {
      if (loan.balance > 0) {
        yearBankInterest += loan.balance * bankRateDec;
      }
    }

    // ─── O&G income pays bank loan interest ───
    let ogRemaining = yearOGIncome;
    const interestPaid = Math.min(ogRemaining, yearBankInterest);
    ogRemaining -= interestPaid;

    // ─── Tax deduction — 90% of O&G investment in Year 1 of each stream ───
    let yearTaxDeduction = 0;
    for (const stream of ogStreams) {
      const streamYear = year - stream.startYear + 1;
      if (streamYear === 1) {
        yearTaxDeduction += stream.investment * deductionPct;
      } else if (streamYear <= ogTerm) {
        // Ongoing depletion allowance ~8%
        yearTaxDeduction += stream.investment * 0.08;
      }
    }

    // Tax savings = deduction × combined tax rate
    const effectiveDeduction = Math.min(yearTaxDeduction, annualIncome);
    const yearTaxSavings = effectiveDeduction * combinedTaxRate;
    cumTaxSaved += yearTaxSavings;

    // ─── ALL tax savings go to principal-only on bank LOC ───
    let principalPayment = 0;
    let taxSavingsRemaining = yearTaxSavings;

    // Also apply excess O&G income to principal
    taxSavingsRemaining += ogRemaining;

    const activeLoans = bankLoans
      .filter(l => l.balance > 0)
      .sort((a, b) => a.cycle - b.cycle);

    for (const loan of activeLoans) {
      if (taxSavingsRemaining <= 0) break;
      const payment = Math.min(taxSavingsRemaining, loan.balance);
      loan.balance -= payment;
      principalPayment += payment;
      taxSavingsRemaining -= payment;
    }

    // ─── Net cash flow ───
    const netCashFlow = yearOGIncome - yearBankInterest + yearTaxSavings - principalPayment;

    // ─── Cumulative wealth = MYGA value + remaining O&G principal returns + net cash ───
    const totalLoanBalance = bankLoans.reduce((sum, l) => sum + l.balance, 0);
    cumWealth = currentMygaValue - totalLoanBalance + cumOGIncome * 0.1 + cumTaxSaved * 0.5;

    results.push({
      year,
      cycle: cycleNumber,
      mygaValue: currentMygaValue,
      mygaInterest,
      bankLoanBalance: totalLoanBalance,
      bankInterest: yearBankInterest,
      ogInvestment: ogStreams.filter(s => s.startYear === year).reduce((sum, s) => sum + s.investment, 0),
      ogIncome: yearOGIncome,
      ogActiveStreams: activeStreams,
      taxDeduction: yearTaxDeduction,
      taxSavings: yearTaxSavings,
      principalPayment,
      netCashFlow,
      cumulativeWealth: currentMygaValue + cumOGIncome - totalLoanBalance,
      cumulativeTaxSaved: cumTaxSaved,
      cumulativeOGIncome: cumOGIncome,
    });
  }

  return results;
}

/* ═══════════════════════════════════════════════════════════════════════════
   STRATEGY PROJECTION ENGINES
   ═══════════════════════════════════════════════════════════════════════════ */
interface StrategyProjection {
  year: number;
  netWorth: number;
  taxSaved: number;
  cashFlow: number;
}

function projectIUL(premium: number, years: number, creditRate: number): StrategyProjection[] {
  const results: StrategyProjection[] = [];
  let cashValue = 0;
  let cumTax = 0;
  for (let y = 1; y <= years; y++) {
    cashValue = (cashValue + premium) * (1 + creditRate / 100);
    const surrenderCharge = y <= 10 ? cashValue * Math.max(0, (10 - y) * 0.01) : 0;
    cumTax += premium * 0.35; // tax-free growth benefit
    results.push({ year: y, netWorth: cashValue - surrenderCharge, taxSaved: cumTax, cashFlow: y > 10 ? cashValue * 0.04 : 0 });
  }
  return results;
}

function projectSTR(propertyValue: number, downPct: number, appreciation: number, grossYield: number, years: number, annualIncome: number): StrategyProjection[] {
  const results: StrategyProjection[] = [];
  let totalEquity = 0;
  let cumTax = 0;
  let properties = 0;
  for (let y = 1; y <= years; y++) {
    if (y === 1 || (y % 2 === 0 && y <= 20)) properties++;
    const totalValue = properties * propertyValue * Math.pow(1 + appreciation / 100, y);
    const totalDebt = properties * propertyValue * (1 - downPct / 100);
    totalEquity = totalValue - totalDebt;
    // Cost seg + bonus depreciation: ~60% of building value in Year 1
    const newProps = (y === 1 || (y % 2 === 0 && y <= 20)) ? 1 : 0;
    const costSegDeduction = newProps * propertyValue * 0.8 * 0.6;
    const yearTax = Math.min(costSegDeduction, annualIncome) * 0.42;
    cumTax += yearTax;
    const rentalIncome = properties * propertyValue * (grossYield / 100) * 0.65;
    results.push({ year: y, netWorth: totalEquity, taxSaved: cumTax, cashFlow: rentalIncome });
  }
  return results;
}

function projectHELOC(homeValue: number, equity: number, iulPremium: number, years: number): StrategyProjection[] {
  const results: StrategyProjection[] = [];
  let properties = 1;
  let totalValue = homeValue;
  let totalDebt = homeValue - equity;
  let iulCashValue = 0;
  let cumTax = 0;
  for (let y = 1; y <= years; y++) {
    totalValue *= 1.05;
    iulCashValue = (iulCashValue + iulPremium) * 1.074;
    if (y % 5 === 0 && y <= 30) {
      properties++;
      totalValue += 400000 * Math.pow(1.05, y);
    }
    const netWorth = totalValue - totalDebt + iulCashValue;
    cumTax += iulPremium * 0.35;
    results.push({ year: y, netWorth, taxSaved: cumTax, cashFlow: iulCashValue > 100000 ? iulCashValue * 0.04 : 0 });
  }
  return results;
}

/* ═══════════════════════════════════════════════════════════════════════════
   CHART COLORS
   ═══════════════════════════════════════════════════════════════════════════ */
const COLORS = {
  miga: "#f59e0b",
  iul: "#10b981",
  heloc: "#3b82f6",
  str: "#8b5cf6",
  trusts: "#f43f5e",
  roth: "#06b6d4",
  premium_finance: "#f97316",
  aggregate: "#22d3ee",
};

const PIE_COLORS = ["#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#f43f5e", "#06b6d4", "#f97316"];

/* ═══════════════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function ClientPortfolioDashboard() {
  const { clientData } = useClientData();
  const [activeTab, setActiveTab] = useState("overview");
  const [projectionYears, setProjectionYears] = useState(30);
  const [showMIGADetail, setShowMIGADetail] = useState(false);

  // ─── Client Inputs ───
  const [annualIncome, setAnnualIncome] = useState(clientData?.annualIncome || 500000);
  const [netWorth, setNetWorth] = useState(clientData?.netWorth || 5000000);
  const [homeValue, setHomeValue] = useState(clientData?.homeValue || 800000);
  const [homeEquity, setHomeEquity] = useState(clientData?.homeEquity || 400000);
  const [federalTaxRate, setFederalTaxRate] = useState(37);
  const [stateTaxRate, setStateTaxRate] = useState(5);
  const combinedTaxRate = (federalTaxRate + stateTaxRate) / 100;

  // ─── MYGA Inputs ───
  const [mygaPremium, setMygaPremium] = useState(500000);
  const [mygaRate] = useState(6.25);
  const [bankRate] = useState(7);
  const [ogReturn] = useState(15);
  const [ogTerm] = useState(12);

  // ─── IUL Inputs ───
  const [iulPremium, setIulPremium] = useState(50000);
  const [iulCreditRate] = useState(7.4);

  // ─── STR Inputs ───
  const [strPropertyValue, setStrPropertyValue] = useState(500000);
  const [strDownPct] = useState(25);
  const [strAppreciation] = useState(5);
  const [strGrossYield] = useState(12);

  // ─── Active strategies toggle ───
  const [activeStrategies, setActiveStrategies] = useState<Record<string, boolean>>({
    miga: true, iul: true, heloc: true, str: true, trusts: true, roth: false, premium_finance: false,
  });

  const toggleStrategy = useCallback((id: string) => {
    setActiveStrategies(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // ═══════════════════════════════════════════════════════════════════════
  // MYGA ENGINE
  // ═══════════════════════════════════════════════════════════════════════
  const migaProjection = useMemo(() => {
    if (!activeStrategies.miga) return [];
    return runMIGAEngine(mygaPremium, mygaRate, 0.70, bankRate, ogReturn, ogTerm, 90, annualIncome, combinedTaxRate, projectionYears);
  }, [mygaPremium, mygaRate, bankRate, ogReturn, ogTerm, annualIncome, combinedTaxRate, projectionYears, activeStrategies.miga]);

  // ═══════════════════════════════════════════════════════════════════════
  // OTHER STRATEGY PROJECTIONS
  // ═══════════════════════════════════════════════════════════════════════
  const iulProjection = useMemo(() => {
    if (!activeStrategies.iul) return [];
    return projectIUL(iulPremium, projectionYears, iulCreditRate);
  }, [iulPremium, projectionYears, iulCreditRate, activeStrategies.iul]);

  const strProjection = useMemo(() => {
    if (!activeStrategies.str) return [];
    return projectSTR(strPropertyValue, strDownPct, strAppreciation, strGrossYield, projectionYears, annualIncome);
  }, [strPropertyValue, strDownPct, strAppreciation, strGrossYield, projectionYears, annualIncome, activeStrategies.str]);

  const helocProjection = useMemo(() => {
    if (!activeStrategies.heloc) return [];
    return projectHELOC(homeValue, homeEquity, iulPremium, projectionYears);
  }, [homeValue, homeEquity, iulPremium, projectionYears, activeStrategies.heloc]);

  // ═══════════════════════════════════════════════════════════════════════
  // AGGREGATE PROJECTIONS
  // ═══════════════════════════════════════════════════════════════════════
  const aggregateData = useMemo(() => {
    const data: Array<{
      year: number;
      migaNW: number; iulNW: number; strNW: number; helocNW: number;
      totalNW: number; doNothing: number;
      migaTax: number; iulTax: number; strTax: number; totalTax: number;
      migaCF: number; iulCF: number; strCF: number; helocCF: number; totalCF: number;
      migaOG: number; migaBankBal: number; migaMYGA: number; migaStreams: number;
    }> = [];

    for (let y = 1; y <= projectionYears; y++) {
      const miga = migaProjection[y - 1];
      const iul = iulProjection[y - 1];
      const str = strProjection[y - 1];
      const heloc = helocProjection[y - 1];

      const migaNW = miga?.cumulativeWealth || 0;
      const iulNW = iul?.netWorth || 0;
      const strNW = str?.netWorth || 0;
      const helocNW = heloc?.netWorth || 0;

      const migaTax = miga?.cumulativeTaxSaved || 0;
      const iulTax = iul?.taxSaved || 0;
      const strTax = str?.taxSaved || 0;

      data.push({
        year: y,
        migaNW, iulNW, strNW, helocNW,
        totalNW: migaNW + iulNW + strNW + helocNW,
        doNothing: netWorth * Math.pow(1.03, y), // 3% inflation-adjusted growth
        migaTax, iulTax, strTax,
        totalTax: migaTax + iulTax + strTax,
        migaCF: miga?.netCashFlow || 0,
        iulCF: iul?.cashFlow || 0,
        strCF: str?.cashFlow || 0,
        helocCF: heloc?.cashFlow || 0,
        totalCF: (miga?.netCashFlow || 0) + (iul?.cashFlow || 0) + (str?.cashFlow || 0) + (heloc?.cashFlow || 0),
        migaOG: miga?.ogIncome || 0,
        migaBankBal: miga?.bankLoanBalance || 0,
        migaMYGA: miga?.mygaValue || 0,
        migaStreams: miga?.ogActiveStreams || 0,
      });
    }
    return data;
  }, [migaProjection, iulProjection, strProjection, helocProjection, projectionYears, netWorth]);

  // ─── Summary metrics ───
  const summary = useMemo(() => {
    const last = aggregateData[aggregateData.length - 1];
    if (!last) return null;

    const activeCount = Object.values(activeStrategies).filter(Boolean).length;
    const totalDeployed = mygaPremium + (activeStrategies.iul ? iulPremium * projectionYears : 0) +
      (activeStrategies.str ? strPropertyValue * 0.25 * 10 : 0) +
      (activeStrategies.heloc ? homeEquity * 0.4 : 0);

    // Find the year where MYGA bank LOC is fully paid off
    const locPayoffYear = migaProjection.findIndex(m => m.bankLoanBalance <= 0) + 1;

    return {
      totalNetWorth: last.totalNW,
      doNothingNetWorth: last.doNothing,
      multiplier: last.totalNW / Math.max(last.doNothing, 1),
      totalTaxSaved: last.totalTax,
      totalDeployed,
      roi: ((last.totalNW - netWorth) / Math.max(totalDeployed, 1)) * 100,
      activeCount,
      locPayoffYear: locPayoffYear > 0 ? locPayoffYear : null,
      migaFinalMYGA: last.migaMYGA,
      migaFinalBankBal: last.migaBankBal,
      migaTotalOGIncome: last.migaOG,
      peakStreams: Math.max(...aggregateData.map(d => d.migaStreams)),
    };
  }, [aggregateData, activeStrategies, mygaPremium, iulPremium, strPropertyValue, homeEquity, projectionYears, netWorth, migaProjection]);

  // ─── Strategy allocation for pie chart ───
  const allocationData = useMemo(() => {
    const last = aggregateData[aggregateData.length - 1];
    if (!last) return [];
    const items = [];
    if (activeStrategies.miga && last.migaNW > 0) items.push({ name: "MYGA", value: last.migaNW, color: COLORS.miga });
    if (activeStrategies.iul && last.iulNW > 0) items.push({ name: "IUL", value: last.iulNW, color: COLORS.iul });
    if (activeStrategies.str && last.strNW > 0) items.push({ name: "STR", value: last.strNW, color: COLORS.str });
    if (activeStrategies.heloc && last.helocNW > 0) items.push({ name: "HELOC", value: last.helocNW, color: COLORS.heloc });
    return items;
  }, [aggregateData, activeStrategies]);

  // ─── MYGA virtuous cycle data ───
  const migaCycleData = useMemo(() => {
    return migaProjection.map(m => ({
      year: m.year,
      bankBalance: m.bankLoanBalance,
      bankInterest: m.bankInterest,
      ogIncome: m.ogIncome,
      taxSavings: m.taxSavings,
      principalPaid: m.principalPayment,
      mygaValue: m.mygaValue,
      streams: m.ogActiveStreams,
      netCash: m.ogIncome - m.bankInterest,
    }));
  }, [migaProjection]);

  // ─── Milestone timeline ───
  const milestones = useMemo(() => {
    const items: Array<{ year: number; event: string; icon: any; color: string }> = [];
    if (activeStrategies.miga) {
      items.push({ year: 1, event: "MYGA Cycle 1: MYGA funded, 70% borrowed, O&G invested", icon: Flame, color: "text-amber-400" });
      items.push({ year: 1, event: `90% tax deduction: ${fmt$(mygaPremium * 0.7 * 0.9)} → principal paydown`, icon: DollarSign, color: "text-green-400" });
      if (summary?.locPayoffYear) {
        items.push({ year: summary.locPayoffYear, event: "Bank LOC fully paid off from tax savings + O&G income", icon: CheckCircle2, color: "text-emerald-400" });
      }
      items.push({ year: 5, event: "MYGA matures → rollover + new cycle → 2nd O&G stream begins", icon: Zap, color: "text-amber-400" });
      items.push({ year: 10, event: "3rd MYGA cycle → 3 overlapping O&G streams", icon: Layers, color: "text-amber-400" });
    }
    if (activeStrategies.iul) {
      items.push({ year: 10, event: "IUL cash value accessible tax-free via policy loans", icon: Shield, color: "text-emerald-400" });
    }
    if (activeStrategies.str) {
      items.push({ year: 1, event: "STR: Cost segregation + bonus depreciation → Year 1 tax elimination", icon: Building2, color: "text-violet-400" });
    }
    if (activeStrategies.heloc) {
      items.push({ year: 5, event: "First HELOC cycle complete → equity extracted for property #2", icon: Home, color: "text-blue-400" });
      items.push({ year: 12, event: "Mortgage paid to $0 → full equity unlocked for next acquisition", icon: CheckCircle2, color: "text-blue-400" });
    }
    if (activeStrategies.trusts) {
      items.push({ year: 3, event: "ILIT funded with IUL policy → estate tax elimination begins", icon: Shield, color: "text-rose-400" });
      items.push({ year: 5, event: "SLAT funded → spousal access to trust assets + asset protection", icon: Shield, color: "text-rose-400" });
      items.push({ year: 15, event: "Dynasty Trust funded → multi-generational wealth transfer locked in", icon: Landmark, color: "text-rose-400" });
    }
    if (activeStrategies.miga && summary?.peakStreams && summary.peakStreams >= 2) {
      items.push({ year: 12, event: `Peak O&G production: ${summary.peakStreams} overlapping income streams generating simultaneously`, icon: Layers, color: "text-amber-400" });
    }
    items.push({ year: 20, event: `Projected net worth: ${fmt$(aggregateData[19]?.totalNW || 0)} — wealth compounds exponentially`, icon: TrendingUp, color: "text-emerald-400" });
    items.push({ year: projectionYears, event: `Final net worth: ${fmt$(aggregateData[aggregateData.length - 1]?.totalNW || 0)} — ${summary ? summary.multiplier.toFixed(1) : '?'}x vs Do Nothing`, icon: Target, color: "text-cyan-400" });
    return items.sort((a, b) => a.year - b.year);
  }, [activeStrategies, summary, mygaPremium, aggregateData, projectionYears, fmt$]);

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <AppShell title="Client Portfolio Dashboard" subtitle="Aggregate view of all active strategies">
      <div className="space-y-6 pb-12">

        {/* ─── Hero Stats ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 border-emerald-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-1">
                <TrendingUp className="w-3.5 h-3.5" /> PROJECTED NET WORTH
              </div>
              <div className="text-2xl font-black text-white">{summary ? fmt$(summary.totalNetWorth) : "$0"}</div>
              <div className="text-xs text-gray-400 mt-1">
                {summary ? `${summary.multiplier.toFixed(1)}x vs Do Nothing` : "—"}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-900/40 to-amber-800/20 border-amber-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold mb-1">
                <DollarSign className="w-3.5 h-3.5" /> TOTAL TAX SAVED
              </div>
              <div className="text-2xl font-black text-white">{summary ? fmt$(summary.totalTaxSaved) : "$0"}</div>
              <div className="text-xs text-gray-400 mt-1">Across all active strategies</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 border-blue-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold mb-1">
                <Briefcase className="w-3.5 h-3.5" /> ACTIVE STRATEGIES
              </div>
              <div className="text-2xl font-black text-white">{summary?.activeCount || 0}</div>
              <div className="text-xs text-gray-400 mt-1">of 7 wealth engines</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-violet-900/40 to-violet-800/20 border-violet-500/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-violet-400 text-xs font-semibold mb-1">
                <Target className="w-3.5 h-3.5" /> PORTFOLIO ROI
              </div>
              <div className="text-2xl font-black text-white">{summary ? `${summary.roi.toFixed(0)}%` : "—"}</div>
              <div className="text-xs text-gray-400 mt-1">{projectionYears}-year return</div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Client Inputs Panel ─── */}
        <Card className="border-gray-700/50">
          <CardHeader className="pb-3 cursor-pointer" onClick={() => setShowMIGADetail(prev => !prev)}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                Client Profile & Strategy Inputs
                <FactFinderBadge />
              </CardTitle>
              {showMIGADetail ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </div>
          </CardHeader>
          {showMIGADetail && (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs text-gray-400">Annual Income</Label>
                  <NumberInput value={annualIncome} onChange={setAnnualIncome} prefix="$" />
                </div>
                <div>
                  <Label className="text-xs text-gray-400">Current Net Worth</Label>
                  <NumberInput value={netWorth} onChange={setNetWorth} prefix="$" />
                </div>
                <div>
                  <Label className="text-xs text-gray-400">Home Value</Label>
                  <NumberInput value={homeValue} onChange={setHomeValue} prefix="$" />
                </div>
                <div>
                  <Label className="text-xs text-gray-400">Home Equity</Label>
                  <NumberInput value={homeEquity} onChange={setHomeEquity} prefix="$" />
                </div>
              </div>
              <Separator className="border-gray-700/50" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs text-amber-400">MYGA Premium</Label>
                  <NumberInput value={mygaPremium} onChange={setMygaPremium} prefix="$" />
                </div>
                <div>
                  <Label className="text-xs text-emerald-400">IUL Annual Premium</Label>
                  <NumberInput value={iulPremium} onChange={setIulPremium} prefix="$" />
                </div>
                <div>
                  <Label className="text-xs text-violet-400">STR Property Value</Label>
                  <NumberInput value={strPropertyValue} onChange={setStrPropertyValue} prefix="$" />
                </div>
                <div>
                  <Label className="text-xs text-gray-400">Projection Years</Label>
                  <NumberInput value={projectionYears} onChange={(v) => setProjectionYears(Math.min(50, Math.max(5, v)))} suffix=" yrs" />
                </div>
              </div>
              <Separator className="border-gray-700/50" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs text-gray-400">Federal Tax Rate</Label>
                  <NumberInput value={federalTaxRate} onChange={setFederalTaxRate} suffix="%" />
                </div>
                <div>
                  <Label className="text-xs text-gray-400">State Tax Rate</Label>
                  <NumberInput value={stateTaxRate} onChange={setStateTaxRate} suffix="%" />
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-gray-400">Combined Tax Rate</Label>
                  <div className="text-lg font-bold text-white mt-1">{fmtPct(combinedTaxRate * 100)}</div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* ─── Strategy Toggle Cards ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {STRATEGIES.slice(0, 4).map((s) => (
            <Card
              key={s.id}
              className={`cursor-pointer transition-all duration-200 ${activeStrategies[s.id] ? `${s.borderColor} ${s.bgColor}` : "border-gray-700/30 opacity-50"}`}
              onClick={() => toggleStrategy(s.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                    <span className="text-sm font-bold text-white">{s.shortName}</span>
                  </div>
                  <Badge variant={activeStrategies[s.id] ? "default" : "outline"} className="text-[10px]">
                    {activeStrategies[s.id] ? "ACTIVE" : "OFF"}
                  </Badge>
                </div>
                <p className="text-[10px] text-gray-400 leading-tight">{s.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {s.ircCodes.map(code => (
                    <span key={code} className="text-[9px] px-1.5 py-0.5 bg-black/30 rounded text-gray-400">{code}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {STRATEGIES.slice(4).map((s) => (
            <Card
              key={s.id}
              className={`cursor-pointer transition-all duration-200 ${activeStrategies[s.id] ? `${s.borderColor} ${s.bgColor}` : "border-gray-700/30 opacity-50"}`}
              onClick={() => toggleStrategy(s.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                    <span className="text-sm font-bold text-white">{s.shortName}</span>
                  </div>
                  <Badge variant={activeStrategies[s.id] ? "default" : "outline"} className="text-[10px]">
                    {activeStrategies[s.id] ? "ACTIVE" : "OFF"}
                  </Badge>
                </div>
                <p className="text-[10px] text-gray-400 leading-tight">{s.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ═══ MAIN TABS ═══ */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-900/50 border border-gray-700/50 flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="overview" className="text-xs"><BarChart3 className="w-3.5 h-3.5 mr-1" /> Overview</TabsTrigger>
            <TabsTrigger value="miga" className="text-xs"><Flame className="w-3.5 h-3.5 mr-1" /> MYGA Deep Dive</TabsTrigger>
            <TabsTrigger value="networth" className="text-xs"><TrendingUp className="w-3.5 h-3.5 mr-1" /> Net Worth</TabsTrigger>
            <TabsTrigger value="tax" className="text-xs"><DollarSign className="w-3.5 h-3.5 mr-1" /> Tax Savings</TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs"><Clock className="w-3.5 h-3.5 mr-1" /> Milestones</TabsTrigger>
            <TabsTrigger value="table" className="text-xs"><Layers className="w-3.5 h-3.5 mr-1" /> Year-by-Year</TabsTrigger>
          </TabsList>

          {/* ─── OVERVIEW TAB ─── */}
          <TabsContent value="overview" className="space-y-6 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Net Worth Trajectory */}
              <Card className="border-gray-700/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    Combined Net Worth Trajectory
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={aggregateData}>
                      <defs>
                        <linearGradient id="totalNWGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="doNothingGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6b7280" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#6b7280" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="year" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                      <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} tickFormatter={(v) => fmt$(v)} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: 8 }}
                        formatter={(value: number, name: string) => [fmtFull(value), name]}
                        labelFormatter={(l) => `Year ${l}`}
                      />
                      <Area type="monotone" dataKey="doNothing" name="Do Nothing" stroke="#6b7280" fill="url(#doNothingGrad)" strokeDasharray="5 5" />
                      <Area type="monotone" dataKey="totalNW" name="With Strategies" stroke="#22d3ee" fill="url(#totalNWGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Strategy Allocation */}
              <Card className="border-gray-700/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-violet-400" />
                    Strategy Allocation (Year {projectionYears})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={allocationData}
                        cx="50%" cy="50%"
                        innerRadius={60} outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${fmt$(value)}`}
                      >
                        {allocationData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => fmtFull(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Stacked Net Worth by Strategy */}
            <Card className="border-gray-700/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  Net Worth by Strategy (Stacked)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={aggregateData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="year" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                    <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} tickFormatter={(v) => fmt$(v)} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: 8 }}
                      formatter={(value: number, name: string) => [fmtFull(value), name]}
                      labelFormatter={(l) => `Year ${l}`}
                    />
                    <Legend />
                    {activeStrategies.miga && <Area type="monotone" dataKey="migaNW" name="MYGA" stackId="1" stroke={COLORS.miga} fill={COLORS.miga} fillOpacity={0.6} />}
                    {activeStrategies.iul && <Area type="monotone" dataKey="iulNW" name="IUL" stackId="1" stroke={COLORS.iul} fill={COLORS.iul} fillOpacity={0.6} />}
                    {activeStrategies.str && <Area type="monotone" dataKey="strNW" name="STR" stackId="1" stroke={COLORS.str} fill={COLORS.str} fillOpacity={0.6} />}
                    {activeStrategies.heloc && <Area type="monotone" dataKey="helocNW" name="HELOC" stackId="1" stroke={COLORS.heloc} fill={COLORS.heloc} fillOpacity={0.6} />}
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── MYGA DEEP DIVE TAB ─── */}
          <TabsContent value="miga" className="space-y-6 mt-4">
            {/* MYGA Cycle Explainer */}
            <Card className="bg-gradient-to-r from-amber-900/30 to-orange-900/20 border-amber-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-400" />
                  The MYGA Wealth Engine — How It Works
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                  {[
                    { step: "1", title: "Fund MYGA", desc: `${fmt$(mygaPremium)} at 6.25% guaranteed`, color: "bg-amber-500/20 border-amber-500/40", icon: "💰" },
                    { step: "2", title: "Borrow 70%", desc: `${fmt$(mygaPremium * 0.7)} bank LOC at 7%`, color: "bg-blue-500/20 border-blue-500/40", icon: "🏦" },
                    { step: "3", title: "Invest in O&G", desc: `${fmt$(mygaPremium * 0.7)} → 15% returns/yr`, color: "bg-orange-500/20 border-orange-500/40", icon: "🛢️" },
                    { step: "4", title: "90% Tax Deduction", desc: `${fmt$(mygaPremium * 0.7 * 0.9)} deduction Year 1`, color: "bg-green-500/20 border-green-500/40", icon: "📋" },
                    { step: "5", title: "Pay Down LOC", desc: `Tax savings → principal only`, color: "bg-emerald-500/20 border-emerald-500/40", icon: "✅" },
                    { step: "6", title: "Repeat @ Year 5", desc: "MYGA matures → new cycle", color: "bg-purple-500/20 border-purple-500/40", icon: "🔄" },
                  ].map((s) => (
                    <div key={s.step} className={`rounded-lg border p-3 ${s.color} text-center`}>
                      <div className="text-2xl mb-1">{s.icon}</div>
                      <div className="text-xs font-bold text-white">{s.title}</div>
                      <div className="text-[10px] text-gray-300 mt-1">{s.desc}</div>
                    </div>
                  ))}
                </div>

                {/* The Virtuous Cycle */}
                <div className="mt-4 p-3 bg-black/30 rounded-lg border border-amber-500/20">
                  <h4 className="text-sm font-bold text-amber-400 mb-2">The Virtuous Cycle — Why the LOC Gets Paid Off Fast</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-300">
                    <div>
                      <p className="mb-2"><strong className="text-white">O&G Income (15%)</strong> pays the bank loan interest (7%) — the 8% spread covers debt service with room to spare.</p>
                      <p className="mb-2"><strong className="text-white">90% Tax Deduction</strong> creates {fmt$(mygaPremium * 0.7 * 0.9 * combinedTaxRate)} in Year 1 tax savings at your {fmtPct(combinedTaxRate * 100)} combined rate.</p>
                      <p><strong className="text-white">ALL tax savings</strong> go to principal-only payments on the bank LOC — lowering the balance, which lowers interest, which means more O&G income becomes pure profit.</p>
                    </div>
                    <div>
                      <p className="mb-2"><strong className="text-white">Lower principal → lower interest</strong> → more O&G income freed up → even faster payoff. This is the virtuous cycle.</p>
                      <p className="mb-2"><strong className="text-white">MYGA keeps compounding</strong> at 6.25% the entire time — your collateral grows while the loan shrinks.</p>
                      <p><strong className="text-white">After 5 years</strong>, MYGA matures → roll into new MYGA → borrow 70% again → spawn new O&G stream. Now you have <strong className="text-amber-400">2 overlapping O&G streams</strong>.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* MYGA Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Card className="border-amber-500/20 bg-amber-500/5">
                <CardContent className="p-3">
                  <div className="text-[10px] text-amber-400 font-semibold">MYGA VALUE (Yr {projectionYears})</div>
                  <div className="text-xl font-black text-white">{summary ? fmt$(summary.migaFinalMYGA) : "—"}</div>
                  <div className="text-[10px] text-gray-400">6.25% guaranteed compounding</div>
                </CardContent>
              </Card>
              <Card className="border-green-500/20 bg-green-500/5">
                <CardContent className="p-3">
                  <div className="text-[10px] text-green-400 font-semibold">BANK LOC BALANCE</div>
                  <div className="text-xl font-black text-white">{summary ? fmt$(summary.migaFinalBankBal) : "—"}</div>
                  <div className="text-[10px] text-gray-400">{summary?.locPayoffYear ? `Paid off by Year ${summary.locPayoffYear}` : "Reducing via tax savings"}</div>
                </CardContent>
              </Card>
              <Card className="border-orange-500/20 bg-orange-500/5">
                <CardContent className="p-3">
                  <div className="text-[10px] text-orange-400 font-semibold">PEAK O&G STREAMS</div>
                  <div className="text-xl font-black text-white">{summary?.peakStreams || 0}</div>
                  <div className="text-[10px] text-gray-400">Overlapping income streams</div>
                </CardContent>
              </Card>
              <Card className="border-emerald-500/20 bg-emerald-500/5">
                <CardContent className="p-3">
                  <div className="text-[10px] text-emerald-400 font-semibold">CUMULATIVE TAX SAVED</div>
                  <div className="text-xl font-black text-white">{migaProjection.length > 0 ? fmt$(migaProjection[migaProjection.length - 1].cumulativeTaxSaved) : "—"}</div>
                  <div className="text-[10px] text-gray-400">All applied to LOC principal</div>
                </CardContent>
              </Card>
            </div>

            {/* Bank LOC Paydown Chart — The Virtuous Cycle */}
            <Card className="border-gray-700/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  Bank LOC Paydown — The Virtuous Cycle
                  <Badge variant="outline" className="text-[9px] border-emerald-500/30 text-emerald-400">Tax Savings → Principal Only</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart data={migaCycleData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="year" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                    <YAxis yAxisId="left" tick={{ fill: "#9ca3af", fontSize: 10 }} tickFormatter={(v) => fmt$(v)} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: 8 }}
                      formatter={(value: number, name: string) => [fmtFull(value), name]}
                      labelFormatter={(l) => `Year ${l}`}
                    />
                    <Legend />
                    <Area yAxisId="left" type="monotone" dataKey="bankBalance" name="Bank LOC Balance" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} strokeWidth={2} />
                    <Bar yAxisId="left" dataKey="principalPaid" name="Principal Paid (Tax Savings)" fill="#10b981" fillOpacity={0.7} />
                    <Bar yAxisId="left" dataKey="taxSavings" name="Tax Savings Generated" fill="#22d3ee" fillOpacity={0.5} />
                    <Line yAxisId="left" type="monotone" dataKey="ogIncome" name="O&G Income" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    <Line yAxisId="left" type="monotone" dataKey="bankInterest" name="Bank Interest" stroke="#f87171" strokeWidth={1} strokeDasharray="4 4" dot={false} />
                    <Line yAxisId="right" type="stepAfter" dataKey="streams" name="Active O&G Streams" stroke="#a78bfa" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* MYGA Growth vs Bank Loan */}
            <Card className="border-gray-700/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Scale className="w-4 h-4 text-amber-400" />
                  MYGA Growth (6.25%) vs Bank Loan Balance — Collateral Always Wins
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={migaCycleData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="year" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                    <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} tickFormatter={(v) => fmt$(v)} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: 8 }}
                      formatter={(value: number, name: string) => [fmtFull(value), name]}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="mygaValue" name="MYGA Value (6.25%)" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} strokeWidth={2} />
                    <Area type="monotone" dataKey="bankBalance" name="Bank LOC Balance" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="mt-3 p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <p className="text-xs text-amber-300"><strong>Key Insight:</strong> The MYGA (your collateral) compounds at 6.25% guaranteed while the bank loan balance shrinks from tax savings paying principal. The gap between these two lines is your <strong>net equity gain</strong> — it only grows wider over time.</p>
                </div>
              </CardContent>
            </Card>

            {/* Virtuous Cycle Explainer */}
            <Card className="border-emerald-500/20 bg-gradient-to-r from-emerald-900/20 to-transparent">
              <CardContent className="p-4">
                <h4 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> The Virtuous Cycle — How Tax Savings Destroy the Bank Loan</h4>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                  {[
                    { step: "1", title: "90% Tax Deduction", desc: "O&G investment creates massive Year 1 deduction under IRC §263(c)" },
                    { step: "2", title: "Tax Savings Generated", desc: "Deduction × your tax rate = real cash savings returned to you" },
                    { step: "3", title: "Principal-Only Payment", desc: "ALL tax savings go directly to paying down bank LOC principal" },
                    { step: "4", title: "Lower Interest Next Year", desc: "Smaller principal balance = less interest charged = more O&G profit" },
                    { step: "5", title: "Faster Payoff → Repeat", desc: "LOC paid off faster, MYGA matures, roll into new cycle, stack streams" },
                  ].map((s) => (
                    <div key={s.step} className="p-2 bg-black/30 rounded-lg border border-emerald-500/20 text-center">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center mx-auto mb-1">{s.step}</div>
                      <div className="text-[10px] font-bold text-white mb-0.5">{s.title}</div>
                      <div className="text-[9px] text-gray-400">{s.desc}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-[10px] text-gray-400 text-center">
                  Each 5-year MYGA cycle spawns a new 10-12 year O&G income stream. By Year 15, you have <strong className="text-amber-400">{summary?.peakStreams || 3} overlapping streams</strong> all producing 15% returns simultaneously while the bank loan shrinks to zero.
                </div>
              </CardContent>
            </Card>

            {/* O&G Stream Stacking Visualization */}
            <Card className="border-gray-700/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-400" />
                  Overlapping O&G Income Streams — The Stacking Effect
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Array.from({ length: Math.ceil(projectionYears / 5) }, (_, i) => {
                    const cycleStart = i * 5 + 1;
                    const cycleEnd = Math.min(cycleStart + 11, projectionYears);
                    const investment = mygaPremium * Math.pow(1.0625, i * 5) * 0.7;
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <div className="text-[10px] text-gray-400 w-16 flex-shrink-0">Cycle {i + 1}</div>
                        <div className="flex-1 relative h-6 bg-black/30 rounded overflow-hidden">
                          <div
                            className="absolute h-full rounded"
                            style={{
                              left: `${(cycleStart / projectionYears) * 100}%`,
                              width: `${((cycleEnd - cycleStart + 1) / projectionYears) * 100}%`,
                              backgroundColor: `hsl(${40 + i * 20}, 80%, ${50 - i * 5}%)`,
                              opacity: 0.7,
                            }}
                          />
                          <div className="absolute inset-0 flex items-center px-2">
                            <span className="text-[9px] text-white font-semibold" style={{ marginLeft: `${(cycleStart / projectionYears) * 100}%` }}>
                              Yr {cycleStart}-{cycleEnd} · {fmtFull(investment)} invested · {fmtFull(investment * 0.15)}/yr income
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 text-[10px] text-gray-400">Each horizontal bar represents one O&G income stream. Overlapping bars show simultaneous income production from multiple MYGA cycles.</div>
              </CardContent>
            </Card>

            {/* IRS Codes */}
            <Card className="border-gray-700/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-rose-400" />
                  IRS Code Authority — MYGA Strategy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { code: "IRC §263(c)", title: "Intangible Drilling Costs", desc: "100% deductible in the year incurred. This is the 90% Year 1 deduction — labor, chemicals, fuel, supplies for drilling." },
                    { code: "IRC §613", title: "Percentage Depletion", desc: "15% of gross O&G income is tax-free as depletion allowance. This continues for the full 10-12 year term." },
                    { code: "IRC §469(c)(3)", title: "Working Interest Exception", desc: "O&G working interests are NOT passive — deductions offset W-2 wages and earned income directly." },
                  ].map((item) => (
                    <div key={item.code} className="p-3 bg-black/30 rounded-lg border border-gray-700/50">
                      <div className="text-xs font-bold text-rose-400 mb-1">{item.code}</div>
                      <div className="text-xs font-semibold text-white mb-1">{item.title}</div>
                      <div className="text-[10px] text-gray-400">{item.desc}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── NET WORTH TAB ─── */}
          <TabsContent value="networth" className="space-y-6 mt-4">
            <Card className="border-gray-700/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Net Worth by Strategy — {projectionYears}-Year Projection</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={aggregateData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="year" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                    <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} tickFormatter={(v) => fmt$(v)} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: 8 }}
                      formatter={(value: number, name: string) => [fmtFull(value), name]}
                      labelFormatter={(l) => `Year ${l}`}
                    />
                    <Legend />
                    {activeStrategies.miga && <Line type="monotone" dataKey="migaNW" name="MYGA" stroke={COLORS.miga} strokeWidth={2} dot={false} />}
                    {activeStrategies.iul && <Line type="monotone" dataKey="iulNW" name="IUL" stroke={COLORS.iul} strokeWidth={2} dot={false} />}
                    {activeStrategies.str && <Line type="monotone" dataKey="strNW" name="STR" stroke={COLORS.str} strokeWidth={2} dot={false} />}
                    {activeStrategies.heloc && <Line type="monotone" dataKey="helocNW" name="HELOC" stroke={COLORS.heloc} strokeWidth={2} dot={false} />}
                    <Line type="monotone" dataKey="totalNW" name="Combined" stroke="#22d3ee" strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="doNothing" name="Do Nothing" stroke="#6b7280" strokeWidth={1} strokeDasharray="5 5" dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Do Nothing vs Strategy Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-red-500/20 bg-red-500/5">
                <CardContent className="p-4 text-center">
                  <div className="text-xs text-red-400 font-semibold mb-1">DO NOTHING (Year {projectionYears})</div>
                  <div className="text-3xl font-black text-red-400">{summary ? fmt$(summary.doNothingNetWorth) : "—"}</div>
                  <div className="text-xs text-gray-400 mt-1">3% inflation-adjusted growth only</div>
                </CardContent>
              </Card>
              <Card className="border-emerald-500/20 bg-emerald-500/5">
                <CardContent className="p-4 text-center">
                  <div className="text-xs text-emerald-400 font-semibold mb-1">WITH ALL STRATEGIES (Year {projectionYears})</div>
                  <div className="text-3xl font-black text-emerald-400">{summary ? fmt$(summary.totalNetWorth) : "—"}</div>
                  <div className="text-xs text-gray-400 mt-1">{summary ? `${summary.multiplier.toFixed(1)}x multiplier` : "—"}</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ─── TAX SAVINGS TAB ─── */}
          <TabsContent value="tax" className="space-y-6 mt-4">
            <Card className="border-gray-700/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Cumulative Tax Savings by Strategy</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={aggregateData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="year" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                    <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} tickFormatter={(v) => fmt$(v)} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: 8 }}
                      formatter={(value: number, name: string) => [fmtFull(value), name]}
                      labelFormatter={(l) => `Year ${l}`}
                    />
                    <Legend />
                    {activeStrategies.miga && <Area type="monotone" dataKey="migaTax" name="MYGA Tax Saved" stackId="1" stroke={COLORS.miga} fill={COLORS.miga} fillOpacity={0.6} />}
                    {activeStrategies.iul && <Area type="monotone" dataKey="iulTax" name="IUL Tax Saved" stackId="1" stroke={COLORS.iul} fill={COLORS.iul} fillOpacity={0.6} />}
                    {activeStrategies.str && <Area type="monotone" dataKey="strTax" name="STR Tax Saved" stackId="1" stroke={COLORS.str} fill={COLORS.str} fillOpacity={0.6} />}
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Tax savings breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: "MYGA", tax: migaProjection.length > 0 ? migaProjection[migaProjection.length - 1].cumulativeTaxSaved : 0, color: "amber", desc: "90% IDC deduction + depletion allowance → all savings to LOC principal" },
                { name: "IUL", tax: iulProjection.length > 0 ? iulProjection[iulProjection.length - 1].taxSaved : 0, color: "emerald", desc: "Tax-free growth under §7702 + tax-free loans under §72(e)" },
                { name: "STR", tax: strProjection.length > 0 ? strProjection[strProjection.length - 1].taxSaved : 0, color: "violet", desc: "Cost segregation + bonus depreciation under §168(k)" },
              ].map((s) => (
                <Card key={s.name} className={`border-${s.color}-500/20 bg-${s.color}-500/5`}>
                  <CardContent className="p-4">
                    <div className={`text-xs text-${s.color}-400 font-semibold mb-1`}>{s.name} TAX SAVED</div>
                    <div className="text-2xl font-black text-white">{fmt$(s.tax)}</div>
                    <div className="text-[10px] text-gray-400 mt-1">{s.desc}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ─── MILESTONES TAB ─── */}
          <TabsContent value="timeline" className="space-y-6 mt-4">
            <Card className="border-gray-700/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  Strategy Milestone Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {milestones.map((m, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-black/20 rounded-lg border border-gray-700/30">
                      <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0 border border-gray-600">
                        <span className="text-xs font-bold text-white">Yr {m.year}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-1">
                        <m.icon className={`w-4 h-4 ${m.color} flex-shrink-0`} />
                        <span className="text-sm text-gray-200">{m.event}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── YEAR-BY-YEAR TABLE ─── */}
          <TabsContent value="table" className="space-y-6 mt-4">
            <Card className="border-gray-700/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Year-by-Year Projection — All Strategies Combined</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left p-2 text-gray-400">Year</th>
                        <th className="text-right p-2 text-amber-400">MYGA NW</th>
                        <th className="text-right p-2 text-emerald-400">IUL NW</th>
                        <th className="text-right p-2 text-violet-400">STR NW</th>
                        <th className="text-right p-2 text-blue-400">HELOC NW</th>
                        <th className="text-right p-2 text-cyan-400 font-bold">Total NW</th>
                        <th className="text-right p-2 text-gray-400">Do Nothing</th>
                        <th className="text-right p-2 text-green-400">Tax Saved</th>
                        <th className="text-right p-2 text-orange-400">O&G Streams</th>
                        <th className="text-right p-2 text-red-400">Bank LOC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aggregateData.filter((_, i) => i % (projectionYears > 20 ? 5 : 1) === 0 || i === aggregateData.length - 1).map((row) => (
                        <tr key={row.year} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                          <td className="p-2 font-bold text-white">{row.year}</td>
                          <td className="p-2 text-right text-amber-300">{fmt$(row.migaNW)}</td>
                          <td className="p-2 text-right text-emerald-300">{fmt$(row.iulNW)}</td>
                          <td className="p-2 text-right text-violet-300">{fmt$(row.strNW)}</td>
                          <td className="p-2 text-right text-blue-300">{fmt$(row.helocNW)}</td>
                          <td className="p-2 text-right text-cyan-300 font-bold">{fmt$(row.totalNW)}</td>
                          <td className="p-2 text-right text-gray-400">{fmt$(row.doNothing)}</td>
                          <td className="p-2 text-right text-green-300">{fmt$(row.totalTax)}</td>
                          <td className="p-2 text-right text-orange-300">{row.migaStreams}</td>
                          <td className="p-2 text-right text-red-300">{fmt$(row.migaBankBal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      </div>
    </AppShell>
  );
}
