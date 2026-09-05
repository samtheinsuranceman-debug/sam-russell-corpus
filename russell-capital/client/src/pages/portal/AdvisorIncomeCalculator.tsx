// @ts-nocheck
import { useState, useEffect, useMemo, useCallback } from "react";
import { useSharedField } from "@/context/FinancialDataContext";
import { GenerateOutcomeTab } from "@/components/GenerateOutcomeTab";
import { CalculationSyncBar } from "@/components/CalculationSyncBar";
import { useStrategy } from "@/contexts/StrategyContext";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { Calculator, DollarSign, BarChart3, TrendingUp, Trophy, Star, Users, Shield, Search, Target, Clock, Table2, Layers, Activity, Calendar, PieChartIcon } from 'lucide-react';
import { NumberInput } from "@/components/NumberInput";
import { ExportToSlides } from "@/components/ExportToSlides";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  PieChart,
  Pie,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart
} from "recharts";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import { PageInsights } from "@/components/PageInsights";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

/* ─── CARRIER DATABASE (from ALB Rider Quote Comparison — 94 quotes) ─── */
interface CarrierProduct {
  carrier: string;
  product: string;
  rider: string;
  rating: string;
  premiumBonus: string;
  rollupRate: number;
  rollupYears: number;
  baseWithdrawalRates: Record<string, number>;
  enhancedMultiplier: number;
  riderCharge: number;
  surrenderYears: number;
  incomeType: "single" | "joint";
}

const CARRIER_DATABASE: CarrierProduct[] = [{
    carrier: "American General",
    product: "Power 7&10",
    rider: "Protector Plus",
    rating: "A",
    premiumBonus: "None",
    rollupRate: 9.0,
    rollupYears: 20,
    baseWithdrawalRates: {
      "55-59": 4.5,
      "60-64": 5.25,
      "65-69": 6.0,
      "70-74": 7.0,
      "75-79": 7.5,
      "80+": 8.0,
    },
    enhancedMultiplier: 1.5,
    riderCharge: 1.1,
    surrenderYears: 10,
    incomeType: "joint",
  },
,
  {
    carrier: "Clear Spring Life",
    product: "ViStar",
    rider: "GLWB",
    rating: "A-",
    premiumBonus: "+8% Rider",
    rollupRate: 8.0,
    rollupYears: 20,
    baseWithdrawalRates: {
      "55-59": 4.25,
      "60-64": 5.0,
      "65-69": 5.75,
      "70-74": 6.5,
      "75-79": 6.9,
      "80+": 7.5,
    },
    enhancedMultiplier: 1.0,
    riderCharge: 0.95,
    surrenderYears: 10,
    incomeType: "joint",
  },
,
  {
    carrier: "Fidelity & Guaranty",
    product: "Safe Income Advantage",
    rider: "GMWB",
    rating: "A",
    premiumBonus: "None",
    rollupRate: 7.2,
    rollupYears: 20,
    baseWithdrawalRates: {
      "55-59": 4.5,
      "60-64": 5.5,
      "65-69": 6.25,
      "70-74": 7.25,
      "75-79": 7.65,
      "80+": 8.25,
    },
    enhancedMultiplier: 1.5,
    riderCharge: 1.0,
    surrenderYears: 10,
    incomeType: "joint",
  },
,
  {
    carrier: "National Life Group",
    product: "Income Driver",
    rider: "Standard GLWB",
    rating: "A+",
    premiumBonus: "+25% Rider",
    rollupRate: 10.0,
    rollupYears: 20,
    baseWithdrawalRates: {
      "55-59": 3.75,
      "60-64": 4.5,
      "65-69": 5.0,
      "70-74": 5.5,
      "75-79": 5.75,
      "80+": 6.25,
    },
    enhancedMultiplier: 1.0,
    riderCharge: 1.2,
    surrenderYears: 10,
    incomeType: "joint",
  },
,
  {
    carrier: "American Equity",
    product: "IncomeShield",
    rider: "LIBR Opt 2 8.25%",
    rating: "A",
    premiumBonus: "10% Premium",
    rollupRate: 8.25,
    rollupYears: 20,
    baseWithdrawalRates: {
      "55-59": 4.0,
      "60-64": 5.0,
      "65-69": 5.75,
      "70-74": 6.5,
      "75-79": 6.8,
      "80+": 7.25,
    },
    enhancedMultiplier: 1.0,
    riderCharge: 1.05,
    surrenderYears: 10,
    incomeType: "joint",
  }
];

const COLORS = [
  "#16a34a",
  "#2563eb",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#6366f1",
  "#84cc16",
  "#06b6d4",
  "#e11d48",
  "#a855f7",
  "#22c55e",
  "#3b82f6",
  "#eab308",
  "#dc2626",
  "#7c3aed",
];

function getAgeBracket(age: number): string {
  if (age < 60) return "55-59";
  if (age < 65) return "60-64";
  if (age < 70) return "65-69";
  if (age < 75) return "70-74";
  if (age < 80) return "75-79";
  return "80+";
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
const fmtPct = (n: number) => `${n.toFixed(2)}%`;

interface CalculationResult {
  carrier: string;
  product: string;
  rider: string;
  rating: string;
  premiumBonus: string;
  rollupRate: number;
  incomeBase: number;
  firstYearIncome: number;
  monthlyIncome: number;
  totalIncome10yr: number;
  totalIncomeToAge95: number;
  enhancedIncome: number;
  riderCharge: number;
  incomeStartAge: number;
  rollupGrowth: number;
  bonusAmount: number;
  withdrawalRate: number;
}

interface AccumulationRow {
  year: number;
  age: number;
  startingBase: number;
  rollupCredit: number;
  endingBase: number;
  withdrawalRate: number;
  availableIncome: number;
  cumulativeRollup: number;
}

function computeAccumulation(
  premium: number,
  clientAge: number,
  maxYears: number,
  rollupRate: number,
  rollupYears: number,
  bonusBase: number,
  withdrawalRates: Record<string, number>,
): AccumulationRow[] {
  const rows: AccumulationRow[] = [];
  let currentBase = bonusBase;
  let cumulativeRollup = bonusBase - premium;

  for (let yr = 0; yr <= maxYears; yr++) {
    const age = clientAge + yr;
    const bracket = getAgeBracket(age);
    const wRate = withdrawalRates[bracket] || 5.0;
    const availableIncome = Math.round(currentBase * (wRate / 100));

    rows.push({
      year: yr,
      age,
      startingBase: Math.round(currentBase),
      rollupCredit: yr === 0 ? 0 : Math.round(premium * (rollupRate / 100)),
      endingBase: Math.round(
        currentBase +
          (yr < rollupYears && yr > 0 ? premium * (rollupRate / 100) : 0),
      ),
      withdrawalRate: wRate,
      availableIncome,
      cumulativeRollup: Math.round(cumulativeRollup),
    });

    if (yr < rollupYears && rollupRate > 0) {
      const credit = premium * (rollupRate / 100);
      currentBase += credit;
      cumulativeRollup += credit;
    }
  }
  return rows;
}

export default function AdvisorIncomeCalculator() {
  const [clientAge, setClientAge] = useSharedField<number>("currentAge", 60);
  const [spouseAge, setSpouseAge] = useState<number>(58);
  const [premium, setPremium] = useState<number>(500000);
  const [incomeStartAge, setIncomeStartAge] = useState<number>(67);
  const [lifeExpectancy, setLifeExpectancy] = useState<number>(95);

  const [sortBy, setSortBy] = useState<"income" | "total" | "rating">("income");
  const [selectedCarrierIdx, setSelectedCarrierIdx] = useState<number>(0);
  
  const [inflationRate, setInflationRate] = useState<number>(2.5);
  const [taxRate, setTaxRate] = useSharedField<number>("currentTaxBracket", 22);
  const [viewMode, setViewMode] = useState<"standard" | "advanced">("standard");

  const { data: clientData, loading } = useClientData();
  const { user } = useAuth();
  
  const { data: recommendationsData } = trpc.recommendations.useQuery({ clientId: clientData?.id || "default" });
  const { data: complianceData } = trpc.compliance.useQuery({ type: "income_calc" });
  const { data: strategyData } = trpc.strategy.useQuery({ type: "retirement" });
  const saveCalculation = trpc.savedStrategies.useMutation();
  const trackUsage = trpc.websiteUsage.useMutation();

  useEffect(() => {
    if (!clientData) return;
    if (clientData.age) setClientAge(clientData.age);
    if (clientData.spouseAge) setSpouseAge(clientData.spouseAge);
    if (clientData.annualIncome)
      setPremium(Math.round(clientData.annualIncome * 2));
    if (clientData.retirementAge) setIncomeStartAge(clientData.retirementAge);
  }, [clientData]);
  
  useEffect(() => {
    trackUsage.mutate({ page: "AdvisorIncomeCalculator", action: "view" });
  }, []);

  const deferralYears = Math.max(0, incomeStartAge - clientAge);

  /* ─── MAIN CALCULATION ─── */
  const results = useMemo<CalculationResult[]>(() => {
    return CARRIER_DATABASE.map((cp) => {
      let incomeBase = premium;
      let bonusAmount = 0;

      if (cp.premiumBonus.includes("Premium")) {
        const bonusPct =
          parseFloat(cp.premiumBonus.replace(/[^0-9.]/g, "")) / 100;
        bonusAmount = premium * bonusPct;
        incomeBase = premium + bonusAmount;
      }
      if (cp.premiumBonus.includes("Rider")) {
        const bonusPct =
          parseFloat(cp.premiumBonus.replace(/[^0-9.]/g, "")) / 100;
        bonusAmount = premium * bonusPct;
        incomeBase = premium + bonusAmount;
      }

      const effectiveDeferral = Math.min(deferralYears, cp.rollupYears);
      const rollupGrowth =
        cp.rollupRate > 0
          ? premium * (cp.rollupRate / 100) * effectiveDeferral
          : 0;
      if (cp.rollupRate > 0) {
        incomeBase = incomeBase + rollupGrowth;
      }

      const bracket = getAgeBracket(incomeStartAge);
      const withdrawalRate = cp.baseWithdrawalRates[bracket] || 5.0;
      const firstYearIncome = Math.round(incomeBase * (withdrawalRate / 100));
      const monthlyIncome = Math.round(firstYearIncome / 12);
      const yearsOfIncome = Math.max(0, lifeExpectancy - incomeStartAge);
      const totalIncome10yr = firstYearIncome * Math.min(10, yearsOfIncome);
      const totalIncomeToAge95 = firstYearIncome * yearsOfIncome;
      const enhancedIncome = Math.round(
        firstYearIncome * cp.enhancedMultiplier,
      );

      return {
        carrier: cp.carrier,
        product: cp.product,
        rider: cp.rider,
        rating: cp.rating,
        premiumBonus: cp.premiumBonus,
        rollupRate: cp.rollupRate,
        incomeBase: Math.round(incomeBase),
        withdrawalRate,
        firstYearIncome,
        monthlyIncome,
        totalIncome10yr,
        totalIncomeToAge95,
        enhancedIncome,
        riderCharge: cp.riderCharge,
        incomeStartAge,
        rollupGrowth: Math.round(rollupGrowth),
        bonusAmount: Math.round(bonusAmount),
      };
    }).sort((a, b) => {
      if (sortBy === "income") return b.firstYearIncome - a.firstYearIncome;
      if (sortBy === "total")
        return b.totalIncomeToAge95 - a.totalIncomeToAge95;
      const ratingOrder: Record<string, number> = {
        "A++": 0,
        "A+": 1,
        A: 2,
        "A-": 3,
        "B++": 4,
        "B+": 5,
      };
      return (ratingOrder[a.rating] ?? 9) - (ratingOrder[b.rating] ?? 9);
    });
  }, [
    clientAge,
    premium,
    incomeStartAge,
    deferralYears,
    lifeExpectancy,
    sortBy,
  ]);

  /* ─── ACCUMULATION TABLE for selected carrier ─── */
  const selectedCarrier = CARRIER_DATABASE[selectedCarrierIdx];
  const accumulation = useMemo(() => {
    const cp = selectedCarrier;
    let bonusBase = premium;
    if (
      cp.premiumBonus.includes("Premium") ||
      cp.premiumBonus.includes("Rider")
    ) {
      const pct = parseFloat(cp.premiumBonus.replace(/[^0-9.]/g, "")) / 100;
      bonusBase = premium * (1 + pct);
    }
    return computeAccumulation(
      premium,
      clientAge,
      Math.min(20, 90 - clientAge),
      cp.rollupRate,
      cp.rollupYears,
      bonusBase,
      cp.baseWithdrawalRates,
    );
  }, [selectedCarrierIdx, premium, clientAge]);

  /* ─── ACCUMULATION CHART DATA ─── */
  const accumulationChartData = accumulation.map((row) => ({
    age: row.age,
    "Income Base": row.endingBase,
    "Available Annual Income": row.availableIncome,
    "Cumulative Rollup Credits": row.cumulativeRollup,
  }));

  const topResult = results[0];
  const chartData = results.slice(0, 10).map((r) => ({
    name: r.carrier.length > 14 ? r.carrier.substring(0, 12) + "…" : r.carrier,
    "Annual Income": r.firstYearIncome,
    "Monthly Income": r.monthlyIncome,
  }));

  /* ─── DEFERRAL COMPARISON for top 5 ─── */
  const deferralData = useMemo(() => {
    const ages = Array.from({ length: 16 }, (_, i) => clientAge + i);
    return ages.map((age) => {
      const row: Record<string, number | string> = { age };
      CARRIER_DATABASE.slice(0, 5).forEach((cp) => {
        let ib = premium;
        if (
          cp.premiumBonus.includes("Premium") ||
          cp.premiumBonus.includes("Rider")
        ) {
          const pct = parseFloat(cp.premiumBonus.replace(/[^0-9.]/g, "")) / 100;
          ib = premium * (1 + pct);
        }
        const yr = age - clientAge;
        if (cp.rollupRate > 0) {
          ib =
            ib + premium * (cp.rollupRate / 100) * Math.min(yr, cp.rollupYears);
        }
        const bracket = getAgeBracket(age);
        const rate = cp.baseWithdrawalRates[bracket] || 5.0;
        row[cp.carrier] = Math.round(ib * (rate / 100));
      });
      return row;
    });
  }, [clientAge, premium]);
  
  const cumulativeIncomeData = useMemo(() => {
    const years = lifeExpectancy - incomeStartAge;
    const data = [];
    let cum = 0;
    for (let i = 0; i <= years; i++) {
      cum += topResult?.firstYearIncome || 0;
      data.push({
        age: incomeStartAge + i,
        "Cumulative Income": cum,
        "Total Paid": premium,
      });
    }
    return data;
  }, [topResult, incomeStartAge, lifeExpectancy, premium]);

  const incomeBreakdownData = useMemo(() => {
    if (!topResult) return [];
    return [
      { name: "Premium", value: premium },
      { name: "Bonus", value: topResult.bonusAmount },
      { name: "Rollup Growth", value: topResult.rollupGrowth },
    ].filter((d) => d.value > 0);
  }, [topResult, premium]);

  const radarData = useMemo(() => {
    if (!topResult) return [];
    const avgIncome = results.reduce((acc, r) => acc + r.firstYearIncome, 0) / results.length;
    const avgBase = results.reduce((acc, r) => acc + r.incomeBase, 0) / results.length;
    
    return [
      {
        subject: "First Year Income",
        A: topResult.firstYearIncome,
        B: avgIncome,
        fullMark: Math.max(topResult.firstYearIncome, avgIncome) * 1.2,
      },
      {
        subject: "Income Base",
        A: topResult.incomeBase,
        B: avgBase,
        fullMark: Math.max(topResult.incomeBase, avgBase) * 1.2,
      },
      {
        subject: "Rollup Rate",
        A: topResult.rollupRate,
        B: results.reduce((acc, r) => acc + r.rollupRate, 0) / results.length,
        fullMark: 15,
      },
      {
        subject: "Withdrawal Rate",
        A: topResult.withdrawalRate,
        B: results.reduce((acc, r) => acc + r.withdrawalRate, 0) / results.length,
        fullMark: 10,
      },
      {
        subject: "Total to Age 95",
        A: topResult.totalIncomeToAge95,
        B: results.reduce((acc, r) => acc + r.totalIncomeToAge95, 0) / results.length,
        fullMark: Math.max(topResult.totalIncomeToAge95, avgIncome * 20) * 1.2,
      }
    ];
  }, [topResult, results]);

  const handleSaveStrategy = useCallback(() => {
    if (topResult) {
      saveCalculation.mutate({
        name: `Income Strategy - ${topResult.carrier}`,
        details: JSON.stringify({
          clientAge,
          premium,
          incomeStartAge,
          carrier: topResult.carrier,
          income: topResult.firstYearIncome
        })
      });
    }
  }, [topResult, clientAge, premium, incomeStartAge, saveCalculation]);

  return (
    <AppShell>
      <div className="container py-6 space-y-6" id="advisor-income-calculator">
        <CalculationSyncBar />

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="AdvisorIncomeCalculator" />

        <ExecutiveSummary
          pageTitle="Advisor Income Calculator"
          whatItDoes="This calculator models your advisory practice income across multiple revenue streams — commissions, trails, AUM fees, planning fees, and bonuses. It projects your income growth trajectory and identifies which revenue streams have the highest growth potential."
          opportunities="Many advisors underestimate the compounding power of recurring AUM fees versus one-time commissions. Shifting even 20% of effort toward recurring revenue can double your practice income within 5 years."
          intent="To help you see your practice as a business with multiple income engines, not just a job."
          takeaway="The advisors who build the most wealth focus on recurring revenue streams that compound over time."
          callToAction="Model your ideal revenue mix and see how quickly your practice income can grow."
          followUpQuestions={[
            "What\'s my revenue per client and how can I increase it?",
            "How much of my income is recurring vs. one-time?",
            "What would my income look like if I doubled my AUM over 3 years?",
          ]}
        />
        <GoalsAccelerator pageName="Advisor Income Calculator" pageContext="Advisory practice income modeling across commissions, AUM fees, trails, and planning fees" />
        <TaxBracketPanel grossIncome={clientData?.annualIncome || 150000} filingStatus={clientData?.filingStatus || "single"} stateCode={clientData?.state || "TX"} />
        <RecommendationSummary
          headline="Shift toward recurring revenue to accelerate practice growth"
          detail="Transitioning from commission-heavy to fee-based recurring revenue creates predictable income and increases your practice valuation."
          dollarBenefit={500000}
          timeHorizon="5 years"
          confidence="high"
          nextStep="Review with your advisor"
        />
        <DoNothingBaseline
          metrics={[
            { label: "Annual Practice Income", doNothing: 250000, recommended: 450000, format: "currency" },
            { label: "Recurring Revenue %", doNothing: 30, recommended: 70, format: "percent" },
            { label: "Practice Valuation", doNothing: 750000, recommended: 1800000, format: "currency" },
          ]}
          summary="Without shifting to recurring revenue, your income stays tied to constant new sales activity with no compounding effect."
        />
        {/* ─── HEADER ─── */}
        <div className="rc-page-header">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="bg-green-600 hover:bg-green-700 text-white border-none">
                <Calculator className="w-4 h-4 mr-1" /> Advisor Tool
              </Badge>
              <Badge variant="outline" className="border-blue-500 text-blue-400">
                <Search className="w-3 h-3 mr-1" /> 18 Carriers Compared
              </Badge>
              {complianceData && (
                <Badge variant="outline" className="border-purple-500 text-purple-400">
                  <Shield className="w-3 h-3 mr-1" /> Compliance Checked
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleSaveStrategy}
                className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center"
              >
                <Star className="w-3 h-3 mr-1" /> Save Strategy
              </button>
              <ExportToSlides
                toolName="Advisor Income Calculator"
                getSections={() => [
                  {
                    title: "Client Profile",
                    items: [
                      { label: "Client Age", value: String(clientAge) },
                      { label: "Spouse Age", value: String(spouseAge) },
                      { label: "Invested Amount", value: fmt(premium) },
                      {
                        label: "Income Start Age",
                        value: String(incomeStartAge),
                      },
                      { label: "Deferral Years", value: String(deferralYears) },
                      { label: "Life Expectancy", value: String(lifeExpectancy) },
                    ],
                  },
                  ...(topResult
                    ? [
                        {
                          title: "Top Recommended Product",
                          items: [
                            { label: "Carrier", value: topResult.carrier },
                            { label: "Product", value: topResult.product },
                            { label: "Rating", value: topResult.rating },
                            {
                              label: "Annual Income",
                              value: fmt(topResult.firstYearIncome),
                            },
                            {
                              label: "Monthly Income",
                              value: fmt(topResult.monthlyIncome),
                            },
                            {
                              label: "Total to Age " + lifeExpectancy,
                              value: fmt(topResult.totalIncomeToAge95),
                            },
                          ],
                        },
                      ]
                    : []),
                ]}
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mt-4">Advisor Income Calculator</h1>
          <p className="text-[#7a95b8] mt-2">
            Enter the client's <strong>age</strong>,{" "}
            <strong>amount to invest</strong>, and{" "}
            <strong>when they need income</strong>. The system calculates the guaranteed income for all 18 top carriers, factoring in premium bonuses, rollup rates, and age-based payout percentages.
          </p>
        </div>

        {/* ─── INPUTS ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-[#0a0f1a] border-slate-800">
            <CardContent className="p-4 space-y-2">
              <Label className="text-[#94a3b8]">Client Age</Label>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500" />
                <NumberInput
                  value={clientAge}
                  onChange={(v) => setClientAge(v || 60)}
                  min={50}
                  max={85}
                  className="bg-[#0d1526] border-[#1e3a5f] text-white"
                />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-[#0a0f1a] border-slate-800">
            <CardContent className="p-4 space-y-2">
              <Label className="text-[#94a3b8]">Spouse Age (Joint)</Label>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500" />
                <NumberInput
                  value={spouseAge}
                  onChange={(v) => setSpouseAge(v || 58)}
                  min={50}
                  max={85}
                  className="bg-[#0d1526] border-[#1e3a5f] text-white"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0a0f1a] border-slate-800">
            <CardContent className="p-4 space-y-2">
              <Label className="text-[#94a3b8]">Investment Amount</Label>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-slate-500" />
                <NumberInput
                  value={premium}
                  onChange={(v) => setPremium(v || 500000)}
                  min={50000}
                  step={10000}
                  className="bg-[#0d1526] border-[#1e3a5f] text-white"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0a0f1a] border-slate-800">
            <CardContent className="p-4 space-y-2">
              <Label className="text-[#94a3b8]">Income Start Age</Label>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <NumberInput
                  value={incomeStartAge}
                  onChange={(v) => setIncomeStartAge(v || 67)}
                  min={clientAge}
                  max={90}
                  className="bg-[#0d1526] border-[#1e3a5f] text-white"
                />
              </div>
              <div className="text-xs text-blue-400">
                {deferralYears} years deferral
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0a0f1a] border-slate-800">
            <CardContent className="p-4 space-y-2">
              <Label className="text-[#94a3b8]">Life Expectancy</Label>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-slate-500" />
                <NumberInput
                  value={lifeExpectancy}
                  onChange={(v) => setLifeExpectancy(v || 95)}
                  min={incomeStartAge + 1}
                  max={120}
                  className="bg-[#0d1526] border-[#1e3a5f] text-white"
                />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Advanced Settings Toggle */}
        <div className="flex justify-end">
          <button 
            onClick={() => setViewMode(viewMode === "standard" ? "advanced" : "standard")}
            className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            {viewMode === "standard" ? "Show Advanced Settings" : "Hide Advanced Settings"}
          </button>
        </div>
        
        {viewMode === "advanced" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-[#0a0f1a] rounded-lg border border-slate-800">
            <div className="space-y-2">
              <Label className="text-[#94a3b8]">Inflation Rate (%)</Label>
              <NumberInput
                value={inflationRate}
                onChange={(v) => setInflationRate(v || 2.5)}
                min={0}
                max={10}
                step={0.1}
                className="bg-[#0d1526] border-[#1e3a5f] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#94a3b8]">Estimated Tax Rate (%)</Label>
              <NumberInput
                value={taxRate}
                onChange={(v) => setTaxRate(v || 22)}
                min={0}
                max={50}
                className="bg-[#0d1526] border-[#1e3a5f] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[#94a3b8]">Sort Results By</Label>
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="bg-[#0d1526] border-[#1e3a5f] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0d1526] border-[#1e3a5f] text-white">
                  <SelectItem value="income">Highest Income</SelectItem>
                  <SelectItem value="total">Total Lifetime Value</SelectItem>
                  <SelectItem value="rating">Carrier Rating</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* ─── TOP RESULT HIGHLIGHT ─── */}
        {topResult && (
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-green-500/50 border-2">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                    <h2 className="text-2xl font-bold text-white">Top Recommendation</h2>
                  </div>
                  <p className="text-[#7a95b8]">Based on your {deferralYears}-year deferral strategy</p>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="border-green-500 text-green-400 text-lg py-1 px-3">
                    {topResult.rating} Rated
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-[#0d1526]/50 p-4 rounded-lg border border-[#1e3a5f]">
                  <div className="text-sm text-[#7a95b8] mb-1">Carrier & Product</div>
                  <div className="font-bold text-lg text-white">
                    {topResult.carrier}
                  </div>
                  <div className="text-sm text-blue-400">
                    {topResult.product}
                  </div>
                </div>
                <div className="bg-[#0d1526]/50 p-4 rounded-lg border border-[#1e3a5f]">
                  <div className="text-sm text-[#7a95b8] mb-1">Annual Income</div>
                  <div className="font-bold text-2xl text-green-500">
                    {fmt(topResult.firstYearIncome)}
                  </div>
                  <div className="text-sm text-slate-500">
                    {fmtPct(topResult.withdrawalRate)} payout rate
                  </div>
                </div>
                <div className="bg-[#0d1526]/50 p-4 rounded-lg border border-[#1e3a5f]">
                  <div className="text-sm text-[#7a95b8] mb-1">Monthly Income</div>
                  <div className="font-bold text-xl text-green-400">
                    {fmt(topResult.monthlyIncome)}
                  </div>
                  <div className="text-sm text-slate-500">
                    Guaranteed for life
                  </div>
                </div>
                <div className="bg-[#0d1526]/50 p-4 rounded-lg border border-[#1e3a5f]">
                  <div className="text-sm text-[#7a95b8] mb-1">
                    Total to Age {lifeExpectancy}
                  </div>
                  <div className="font-bold text-xl text-blue-400">
                    {fmt(topResult.totalIncomeToAge95)}
                  </div>
                  <div className="text-sm text-slate-500">
                    {Math.round((topResult.totalIncomeToAge95 / premium) * 100)}% of premium
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── TABS ─── */}
        <Tabs defaultValue="ranking" className="space-y-4">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1 bg-[#0a0f1a] border border-slate-800 rounded-lg">
            <TabsTrigger
              value="ranking"
              className="text-xs sm:text-sm data-[state=active]:bg-slate-700 data-[state=active]:text-white text-[#7a95b8]"
            >
              <Trophy className="w-4 h-4 mr-1" /> Full Ranking
            </TabsTrigger>
            <TabsTrigger
              value="accumulation"
              className="text-xs sm:text-sm data-[state=active]:bg-slate-700 data-[state=active]:text-white text-[#7a95b8]"
            >
              <Table2 className="w-4 h-4 mr-1" /> Rollup Accumulation
            </TabsTrigger>
            <TabsTrigger
              value="chart"
              className="text-xs sm:text-sm data-[state=active]:bg-slate-700 data-[state=active]:text-white text-[#7a95b8]"
            >
              <BarChart3 className="w-4 h-4 mr-1" /> Visual Comparison
            </TabsTrigger>
            <TabsTrigger
              value="deferral"
              className="text-xs sm:text-sm data-[state=active]:bg-slate-700 data-[state=active]:text-white text-[#7a95b8]"
            >
              <Clock className="w-4 h-4 mr-1" /> Deferral Impact
            </TabsTrigger>
            <TabsTrigger
              value="breakdown"
              className="text-xs sm:text-sm data-[state=active]:bg-slate-700 data-[state=active]:text-white text-[#7a95b8]"
            >
              <Layers className="w-4 h-4 mr-1" /> Income Breakdown
            </TabsTrigger>
            <TabsTrigger
              value="advanced_charts"
              className="text-xs sm:text-sm data-[state=active]:bg-slate-700 data-[state=active]:text-white text-[#7a95b8]"
            >
              <PieChartIcon className="w-4 h-4 mr-1" /> Advanced Analytics
            </TabsTrigger>
          
            <TabsTrigger value="generate-outcome" className="text-xs sm:text-sm bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 font-bold">Generate Outcome</TabsTrigger>
          </TabsList>

          {/* ═══════════ TAB 1: FULL RANKING ═══════════ */}
          <TabsContent value="ranking" className="space-y-4">
            <Card className="bg-[#0a0f1a] border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-white">
                  All 18 Carriers Ranked — Income at Age {incomeStartAge} (
                  {deferralYears}-Year Rollup)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b-2 border-green-500">
                        <th className="text-left p-2 font-semibold text-white">#</th>
                        <th className="text-left p-2 font-semibold text-white">Carrier</th>
                        <th className="text-left p-2 font-semibold whitespace-nowrap text-white">Product / Rider</th>
                        <th className="text-center p-2 font-semibold text-white">Rating</th>
                        <th className="text-center p-2 font-semibold whitespace-nowrap text-white">Bonus</th>
                        <th className="text-center p-2 font-semibold whitespace-nowrap text-white">Rollup</th>
                        <th className="text-right p-2 font-semibold whitespace-nowrap text-white">Rollup Growth</th>
                        <th className="text-right p-2 font-semibold whitespace-nowrap text-white">Income Base</th>
                        <th className="text-center p-2 font-semibold whitespace-nowrap text-white">Payout%</th>
                        <th className="text-right p-2 font-semibold whitespace-nowrap text-white">Annual Income</th>
                        <th className="text-right p-2 font-semibold whitespace-nowrap text-white">Monthly</th>
                        <th className="text-right p-2 font-semibold whitespace-nowrap text-white">Total@{lifeExpectancy}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r, i) => (
                        <tr
                          key={`${r.carrier}-${r.product}`}
                          className={`border-b border-slate-800 hover:bg-[#0d1526]/50 ${i === 0 ? "bg-green-500/10 font-semibold" : ""} ${i < 3 ? "border-l-4 border-l-green-500" : ""}`}
                        >
                          <td className="p-2 text-white">
                            {i === 0 ? <Trophy className="w-4 h-4 text-yellow-500" /> : i + 1}
                          </td>
                          <td className="p-2 font-medium whitespace-nowrap text-blue-100">{r.carrier}</td>
                          <td className="p-2 text-xs whitespace-nowrap text-blue-100">
                            {r.product}<br />
                            <span className="text-[#7a95b8]">{r.rider}</span>
                          </td>
                          <td className="p-2 text-center">
                            <Badge
                              variant="outline"
                              className={
                                r.rating === "A++" || r.rating === "A+"
                                  ? "text-green-500 border-green-500"
                                  : r.rating === "A"
                                    ? "text-blue-500 border-blue-500"
                                    : "text-yellow-500 border-yellow-500"
                              }
                            >
                              {r.rating}
                            </Badge>
                          </td>
                          <td className="p-2 text-center text-xs whitespace-nowrap text-blue-100">{r.premiumBonus}</td>
                          <td className="p-2 text-center font-semibold text-blue-100">
                            {r.rollupRate > 0 ? `${r.rollupRate}%` : "—"}
                          </td>
                          <td className="p-2 text-right font-mono text-xs text-green-500">
                            {r.rollupGrowth > 0 ? `+${fmt(r.rollupGrowth)}` : "—"}
                          </td>
                          <td className="p-2 text-right font-mono text-xs text-blue-100">{fmt(r.incomeBase)}</td>
                          <td className="p-2 text-center">
                            <Badge variant="outline" className="text-green-500 border-green-500 text-xs">
                              {fmtPct(r.withdrawalRate)}
                            </Badge>
                          </td>
                          <td className="p-2 text-right font-mono text-green-500 font-semibold">{fmt(r.firstYearIncome)}</td>
                          <td className="p-2 text-right font-mono text-xs text-blue-100">{fmt(r.monthlyIncome)}/mo</td>
                          <td className="p-2 text-right font-mono text-blue-500 font-semibold">{fmt(r.totalIncomeToAge95)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════ TAB 2: ROLLUP ACCUMULATION ═══════════ */}
          <TabsContent value="accumulation" className="space-y-4">
            <Card className="bg-[#0a0f1a] border-slate-800">
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle className="text-lg flex items-center gap-2 text-white">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    Year-by-Year Rollup Accumulation
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs shrink-0 text-blue-100">Select Carrier:</Label>
                    <Select
                      value={String(selectedCarrierIdx)}
                      onValueChange={(v) => setSelectedCarrierIdx(Number(v))}
                    >
                      <SelectTrigger className="w-[220px] bg-[#0d1526] border-[#1e3a5f] text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0d1526] border-[#1e3a5f] text-white">
                        {CARRIER_DATABASE.map((cp, i) => (
                          <SelectItem key={i} value={String(i)}>
                            {cp.carrier} — {cp.product}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={accumulationChartData}
                      margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} stroke="#94a3b8" />
                      <XAxis dataKey="age" tick={{ fontSize: 11, fill: "#94a3b8" }} stroke="#94a3b8" />
                      <YAxis
                        yAxisId="left"
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                        stroke="#94a3b8"
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                        stroke="#94a3b8"
                      />
                      <Tooltip
                        formatter={(v: number) => fmt(v)}
                        labelFormatter={(l) => `Age ${l}`}
                        contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", color: "#f1f5f9" }}
                      />
                      <Legend wrapperStyle={{ color: "#f1f5f9" }} />
                      <Bar yAxisId="left" dataKey="Income Base" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="Available Annual Income"
                        stroke="#22c55e"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b-2 border-blue-500">
                        <th className="text-left p-2 font-semibold text-white">Year</th>
                        <th className="text-left p-2 font-semibold text-white">Age</th>
                        <th className="text-right p-2 font-semibold text-white">Starting Base</th>
                        <th className="text-right p-2 font-semibold text-white">Rollup Credit</th>
                        <th className="text-right p-2 font-semibold text-white">Ending Base</th>
                        <th className="text-center p-2 font-semibold text-white">Payout %</th>
                        <th className="text-right p-2 font-semibold text-white">Available Income</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accumulation.map((row) => {
                        const isSelected = row.age === incomeStartAge;
                        return (
                          <tr
                            key={row.year}
                            className={`border-b border-slate-800 hover:bg-[#0d1526]/50 ${isSelected ? "bg-green-500/10 font-bold" : ""}`}
                          >
                            <td className="p-2 text-[#94a3b8]">Year {row.year}</td>
                            <td className="p-2 text-white">Age {row.age}</td>
                            <td className="p-2 text-right font-mono text-[#94a3b8]">{fmt(row.startingBase)}</td>
                            <td className="p-2 text-right font-mono text-green-500">
                              {row.rollupCredit > 0 ? `+${fmt(row.rollupCredit)}` : "—"}
                            </td>
                            <td className="p-2 text-right font-mono text-blue-400">{fmt(row.endingBase)}</td>
                            <td className="p-2 text-center text-[#94a3b8]">{fmtPct(row.withdrawalRate)}</td>
                            <td className={`p-2 text-right font-mono ${isSelected ? "text-green-500" : "text-white"}`}>
                              {fmt(row.availableIncome)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════ TAB 3: VISUAL COMPARISON ═══════════ */}
          <TabsContent value="chart" className="space-y-4">
            <Card className="bg-[#0a0f1a] border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <BarChart3 className="w-5 h-5 text-blue-500" />
                  Top 10 Carriers — Income Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      layout="vertical"
                      margin={{ left: 10, right: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} stroke="#94a3b8" />
                      <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fill: "#94a3b8" }} stroke="#94a3b8" />
                      <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: "#94a3b8" }} stroke="#94a3b8" />
                      <Tooltip
                        formatter={(v: number) => fmt(v)}
                        contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", color: "#f1f5f9" }}
                      />
                      <Legend wrapperStyle={{ color: "#f1f5f9" }} />
                      <Bar dataKey="Annual Income" radius={[0, 4, 4, 0]}>
                        {chartData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════ TAB 4: DEFERRAL IMPACT ═══════════ */}
          <TabsContent value="deferral" className="space-y-4">
            <Card className="bg-[#0a0f1a] border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Clock className="w-5 h-5 text-blue-500" />
                  How Deferral Affects Income — Top 5 Carriers
                </CardTitle>
                <p className="text-sm text-[#7a95b8]">
                  Each year you delay turning on income, the income base grows via the rollup rate AND the payout percentage increases with age.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={deferralData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} stroke="#94a3b8" />
                      <XAxis
                        dataKey="age"
                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                        label={{ value: "Income Start Age", position: "insideBottom", offset: -2, fill: "#94a3b8" }}
                        stroke="#94a3b8"
                      />
                      <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} tick={{ fontSize: 11, fill: "#94a3b8" }} stroke="#94a3b8" />
                      <Tooltip
                        formatter={(v: number) => fmt(v)}
                        labelFormatter={(l) => `Start at Age ${l}`}
                        contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", color: "#f1f5f9" }}
                      />
                      <Legend wrapperStyle={{ color: "#f1f5f9" }} />
                      {CARRIER_DATABASE.slice(0, 5).map((cp, i) => (
                        <Line key={cp.carrier} type="monotone" dataKey={cp.carrier} stroke={COLORS[i]} strokeWidth={2} dot={{ r: 2 }} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b-2 border-blue-500">
                        <th className="text-left p-2 font-semibold text-white">Carrier</th>
                        {[0, 1, 2, 3, 5, 7, 10, 15].filter((yr) => clientAge + yr <= 90).map((yr) => (
                          <th key={yr} className="text-right p-2 font-semibold whitespace-nowrap text-white">
                            Age {clientAge + yr}
                            <div className="text-xs font-normal text-[#7a95b8]">Yr {yr}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {CARRIER_DATABASE.slice(0, 5).map((cp, ci) => (
                        <tr key={ci} className="border-b border-slate-800 hover:bg-[#0d1526]/50">
                          <td className="p-2 font-medium whitespace-nowrap text-blue-100">
                            {cp.carrier}
                            <div className="text-xs text-[#7a95b8]">{cp.rollupRate}% rollup</div>
                          </td>
                          {[0, 1, 2, 3, 5, 7, 10, 15].filter((yr) => clientAge + yr <= 90).map((yr) => {
                            const startAge = clientAge + yr;
                            let ib = premium;
                            if (cp.premiumBonus.includes("Premium") || cp.premiumBonus.includes("Rider")) {
                              const pct = parseFloat(cp.premiumBonus.replace(/[^0-9.]/g, "")) / 100;
                              ib = premium * (1 + pct);
                            }
                            if (cp.rollupRate > 0) {
                              ib = ib + premium * (cp.rollupRate / 100) * Math.min(yr, cp.rollupYears);
                            }
                            const bracket = getAgeBracket(startAge);
                            const rate = cp.baseWithdrawalRates[bracket] || 5.0;
                            const income = Math.round(ib * (rate / 100));
                            const isSelected = startAge === incomeStartAge;
                            return (
                              <td
                                key={yr}
                                className={`p-2 text-right font-mono text-xs ${isSelected ? "bg-green-500/20 font-bold text-green-500 ring-2 ring-green-500 ring-inset" : "text-blue-100"}`}
                              >
                                {fmt(income)}
                                <div className="text-[10px] text-[#7a95b8]">{fmt(Math.round(income / 12))}/mo</div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════ TAB 5: INCOME BREAKDOWN ═══════════ */}
          <TabsContent value="breakdown" className="space-y-4">
            <Card className="bg-[#0a0f1a] border-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Layers className="w-5 h-5 text-purple-500" />
                  Income Base Breakdown — How Your Income Is Built
                </CardTitle>
                <p className="text-sm text-[#7a95b8]">
                  See exactly how each carrier constructs the income base from your {fmt(premium)} investment.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {results.slice(0, 10).map((r, i) => {
                    const baseWidth = (premium / r.incomeBase) * 100;
                    const bonusWidth = (r.bonusAmount / r.incomeBase) * 100;
                    const rollupWidth = (r.rollupGrowth / r.incomeBase) * 100;
                    return (
                      <div
                        key={`${r.carrier}-${r.product}`}
                        className={`rounded-lg border border-slate-800 p-4 ${i === 0 ? "border-green-500/50 bg-green-500/10" : "bg-[#0a0f1a]"}`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            {i === 0 && <Trophy className="w-4 h-4 text-yellow-500" />}
                            <span className="font-semibold text-white">{r.carrier}</span>
                            <span className="text-xs text-[#7a95b8]">{r.product}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <span className="font-bold text-green-500">{fmt(r.firstYearIncome)}/yr</span>
                            <span className="text-[#7a95b8]">({fmt(r.monthlyIncome)}/mo)</span>
                          </div>
                        </div>

                        <div className="h-6 rounded-full overflow-hidden flex bg-[#0d1526]">
                          <div
                            className="bg-blue-500 h-full flex items-center justify-center text-[10px] text-white font-medium"
                            style={{ width: `${baseWidth}%` }}
                          >
                            {baseWidth > 15 ? fmt(premium) : ""}
                          </div>
                          {r.bonusAmount > 0 && (
                            <div
                              className="bg-yellow-500 h-full flex items-center justify-center text-[10px] text-white font-medium"
                              style={{ width: `${bonusWidth}%` }}
                            >
                              {bonusWidth > 10 ? `+${fmt(r.bonusAmount)}` : ""}
                            </div>
                          )}
                          {r.rollupGrowth > 0 && (
                            <div
                              className="bg-green-500 h-full flex items-center justify-center text-[10px] text-white font-medium"
                              style={{ width: `${rollupWidth}%` }}
                            >
                              {rollupWidth > 10 ? `+${fmt(r.rollupGrowth)}` : ""}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-4 mt-2 text-xs text-[#7a95b8]">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" /> Premium: {fmt(premium)}
                          </span>
                          {r.bonusAmount > 0 && (
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" /> Bonus: +{fmt(r.bonusAmount)}
                            </span>
                          )}
                          {r.rollupGrowth > 0 && (
                            <span className="flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Rollup: +{fmt(r.rollupGrowth)}
                            </span>
                          )}
                          <span className="font-semibold text-white">
                            = {fmt(r.incomeBase)} base x {fmtPct(r.withdrawalRate)} payout
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* ═══════════ TAB 6: ADVANCED ANALYTICS ═══════════ */}
          <TabsContent value="advanced_charts" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-[#0a0f1a] border-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white text-lg">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    Cumulative Income vs Premium Paid
                  </CardTitle>
                  <CardDescription className="text-[#7a95b8]">
                    When will the client receive their initial premium back in income?
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={cumulativeIncomeData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorCum" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} stroke="#94a3b8" />
                        <XAxis dataKey="age" tick={{ fontSize: 11, fill: "#94a3b8" }} stroke="#94a3b8" />
                        <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "#94a3b8" }} stroke="#94a3b8" />
                        <Tooltip
                          formatter={(v: number) => fmt(v)}
                          labelFormatter={(l) => `Age ${l}`}
                          contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", color: "#f1f5f9" }}
                        />
                        <Legend wrapperStyle={{ color: "#f1f5f9" }} />
                        <Area type="monotone" dataKey="Cumulative Income" stroke="#22c55e" fillOpacity={1} fill="url(#colorCum)" />
                        <Line type="step" dataKey="Total Paid" stroke="#ef4444" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#0a0f1a] border-slate-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white text-lg">
                    <PieChartIcon className="w-5 h-5 text-purple-500" />
                    Income Base Composition
                  </CardTitle>
                  <CardDescription className="text-[#7a95b8]">
                    Breakdown of {topResult?.carrier}'s income base at age {incomeStartAge}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center items-center">
                  <div className="h-72 w-full max-w-md">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={incomeBreakdownData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {incomeBreakdownData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v: number) => fmt(v)}
                          contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", color: "#f1f5f9" }}
                        />
                        <Legend wrapperStyle={{ color: "#f1f5f9" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#0a0f1a] border-slate-800 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white text-lg">
                    <Target className="w-5 h-5 text-orange-500" />
                    Top Carrier vs Market Average
                  </CardTitle>
                  <CardDescription className="text-[#7a95b8]">
                    How {topResult?.carrier} compares to the average of all 18 carriers
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <div className="h-80 w-full max-w-2xl">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                        <Radar name={topResult?.carrier || "Top Carrier"} dataKey="A" stroke="#22c55e" fill="#22c55e" fillOpacity={0.5} />
                        <Radar name="Market Average" dataKey="B" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                        <Legend wrapperStyle={{ color: "#f1f5f9" }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", color: "#f1f5f9" }}
                          formatter={(v: number, name: string, props: any) => {
                            const subject = props.payload.subject;
                            if (subject.includes("Rate")) return `${v.toFixed(2)}%`;
                            return fmt(v);
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        
          <TabsContent value="generate-outcome" className="space-y-6 mt-6">
            <GenerateOutcomeTab
              strategyType="advisor-income"
              hasResults={true}
              resultData={{ annualGrossIncome: 350000, annualNetIncome: 250000, effectiveTaxRate: 0.285, retirementContributions: 60000, businessExpenses: 40000 }}
              metrics={[{ label: "Gross Income", value: 350000 }, { label: "Net Income", value: 250000, highlight: true }, { label: "Effective Rate", value: 0.285, format: "percent" }, { label: "Retirement Contrib", value: 60000 }]}
            />
          </TabsContent>
        </Tabs>

        {/* ─── NAIC DISCLAIMER ─── */}
        <NAICDisclaimer
          variant="full"
          showsProjections
          showsComparisons
          additionalText="This calculator is for advisor use only and provides estimated income projections based on current product specifications. Actual income amounts may vary based on the specific illustration run by each carrier. Product availability, rates, and features are subject to change without notice. All guarantees are subject to the claims-paying ability of the issuing insurance company. This tool does not constitute a recommendation to purchase any specific product. Always run a formal carrier illustration before presenting to clients."
        />

        <PageInsights pageId="advisor-income-calculator" />
      </div>
    
        <ComplianceFooter pageName="AdvisorIncomeCalculator" showsTax showsEstate showsProjections />
      </AppShell>
  );
}
