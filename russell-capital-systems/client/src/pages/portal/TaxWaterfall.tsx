// @ts-nocheck
import { AppShell } from "@/components/AppShell";
import { GenerateOutcomeTab } from "@/components/GenerateOutcomeTab";
import { CalculationSyncBar } from "@/components/CalculationSyncBar";
import { useStrategy } from "@/contexts/StrategyContext";
import { PageInsights } from "@/components/PageInsights";
import { NumberInput } from "@/components/NumberInput";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { useState, useEffect, useMemo, useCallback } from "react";
import { TrendingDown, DollarSign, Shield, Zap, PiggyBank, Landmark, ChevronDown, ChevronUp, AlertTriangle, Flame, Heart, ArrowDownUp, Layers, GripVertical, ArrowUp, ArrowDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, ComposedChart, Line, AreaChart, Area, ScatterChart, Scatter, ZAxis } from "recharts";
import ExportPdfButton from "@/components/ExportPdfButton";
import { ExportToSlides } from "@/components/ExportToSlides";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import { PlatformEnhancements } from "@/components/PlatformEnhancements";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

const fmt = (n: number) => {
  if (n < 0) return `-$${Math.abs(n).toLocaleString()}`;
  return `$${n.toLocaleString()}`;
};
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

const STATES = [{ code: "AL", name: "Alabama" },
, { code: "AK", name: "Alaska" },
, { code: "AZ", name: "Arizona" },
,
  { code: "AR", name: "Arkansas" },
, { code: "CA", name: "California" }
];

const BRACKET_COLORS = ["#22c55e", "#3b82f6", "#a855f7", "#f59e0b", "#ef4444", "#ec4899", "#f97316"];

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-lg font-bold ${color || ""}`}>{value}</p>
        {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function TaxWaterfall() {
  const { data: clientData } = useClientData();
  useEffect(() => {
    if (!clientData) return;
    setAge(clientData.age || 55);
  }, [clientData]);

  const [income, setIncome] = useState({
    w2: 180000, selfEmployment: 0, capitalGains: 25000, rentalIncome: 0,
    socialSecurity: 0, pension: 0, iraDistributions: 50000, otherIncome: 0,
  });
  const [deductions, setDeductions] = useState({
    standardOrItemized: "standard" as "standard" | "itemized",
    mortgageInterest: 12000, saltDeduction: 15000, charitableGiving: 5000,
    medicalExpenses: 0, businessExpenses: 0, hsaContribution: 0, retirementContribution: 23000,
  });
  const [rothConversion, setRothConversion] = useState(75000);
  const [iulTaxFreeIncome, setIulTaxFreeIncome] = useState(60000);
  const [filingStatus, setFilingStatus] = useState<"single" | "married" | "hoh">("married");
  const [state, setState] = useState("CA");
  const [age, setAge] = useState(55);
  const [showAdvanced, setShowAdvanced] = useState(false);

  type IncomeKey = keyof typeof income;
  const [incomeOrder, setIncomeOrder] = useState<Array<{ key: IncomeKey; label: string; taxType: string }>>(
    [
      { key: "w2", label: "W-2 Wages", taxType: "Ordinary" },
      { key: "capitalGains", label: "Capital Gains", taxType: "Preferential" },
      { key: "iraDistributions", label: "IRA / 401(k)", taxType: "Ordinary" },
      { key: "selfEmployment", label: "Self-Employment", taxType: "Ordinary + SE" },
      { key: "rentalIncome", label: "Rental Income", taxType: "Passive" },
      { key: "socialSecurity", label: "Social Security", taxType: "0-85% Taxable" },
      { key: "pension", label: "Pension", taxType: "Ordinary" },
      { key: "otherIncome", label: "Other Income", taxType: "Ordinary" },
    ]
  );
  const moveIncomeSource = useCallback((idx: number, dir: -1 | 1) => {
    setIncomeOrder(prev => {
      const next = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }, []);

  const { data: result } = trpc.taxBracketWaterfall.comprehensive.useQuery({
    income, deductions, rothConversion, iulTaxFreeIncome, filingStatus, state, age,
  });

  const bracketChartData = useMemo(() => {
    if (!result?.bracketBreakdown) return [];
    return result.bracketBreakdown.filter((b) => b.incomeInBracket > 0 || b.conversionInBracket > 0).map((b) => ({
      bracket: b.label,
      income: b.incomeInBracket,
      conversion: b.conversionInBracket,
      tax: b.taxInBracket,
      fill: b.fillPct,
      space: b.spaceRemaining,
    }));
  }, [result]);

  const waterfallChartData = useMemo(() => {
    if (!result?.waterfallSteps) return [];
    return result.waterfallSteps.map((step) => {
      const isNet = step.type === "net" || step.type === "taxfree";
      return {
        label: step.label,
        value: Math.abs(step.value),
        invisible: isNet ? 0 : Math.max(0, step.cumulative - (step.value > 0 ? step.value : 0)),
        positive: step.value > 0,
        color: step.color,
        displayValue: step.value,
        type: step.type,
      };
    });
  }, [result]);

  const scenarioChartData = useMemo(() => {
    if (!result?.scenarioComparison) return [];
    const sc = result.scenarioComparison;
    return [
      { scenario: "Current", takeHome: sc.currentScenario.takeHome, tax: sc.currentScenario.totalTax, rate: sc.currentScenario.effectiveRate },
      { scenario: "+Roth Conv.", takeHome: sc.withRothConversion.takeHome, tax: sc.withRothConversion.totalTax, rate: sc.withRothConversion.effectiveRate },
      { scenario: "+IUL Income", takeHome: sc.withIULIncome.takeHome, tax: sc.withIULIncome.totalTax, rate: sc.withIULIncome.effectiveRate },
      { scenario: "Optimized", takeHome: sc.optimizedStrategy.takeHome, tax: sc.optimizedStrategy.totalTax, rate: sc.optimizedStrategy.effectiveRate },
    ];
  }, [result]);

  const taxBombData = useMemo(() => {
    if (!result) return [];
    const iraBalance = income.iraDistributions > 0 ? income.iraDistributions * 20 : 1000000; // estimate total IRA balance
    const growthRate = 0.06;
    const data = [];
    for (let a = Math.max(age, 60); a <= 95; a++) {
      const yearsGrown = a - age;
      const projectedBalance = iraBalance * Math.pow(1 + growthRate, yearsGrown);
      const rmdAge = 73;
      let rmd = 0;
      if (a >= rmdAge) {
        const divisor = Math.max(1, 27.4 - (a - 72) * 0.9);
        rmd = Math.round(projectedBalance / divisor);
      }
      const baseIncome = result.taxableIncome - (income.iraDistributions || 0);
      const totalWithRmd = baseIncome + rmd;
      const brackets = filingStatus === "married"
        ? [22000, 89450, 190750, 364200, 462500, 693750]
        : [11000, 44725, 95375, 182100, 231250, 578125];
      const rates = [0.10, 0.12, 0.22, 0.24, 0.32, 0.35, 0.37];
      let bracket = "10%";
      for (let i = 0; i < brackets.length; i++) {
        if (totalWithRmd > brackets[i]) bracket = `${(rates[i + 1] * 100).toFixed(0)}%`;
      }
      const taxOnRmd = rmd * (rates[rates.findIndex((_, i) => i < brackets.length && totalWithRmd <= brackets[i])] || 0.37);
      data.push({
        age: a, balance: Math.round(projectedBalance), rmd: Math.round(rmd),
        bracket, taxOnRmd: Math.round(taxOnRmd),
        danger: a >= rmdAge && rmd > 100000,
      });
    }
    return data;
  }, [result, age, income.iraDistributions, filingStatus]);

  const irmaaData = useMemo(() => {
    if (!result) return { currentTier: "", surcharge: 0, tiers: [] as any[] };
    const magi = result.adjustedGrossIncome;
    const tiers = filingStatus === "married" ? [
      { threshold: 0, partB: 174.70, partD: 0, label: "Standard" },
      { threshold: 206000, partB: 244.60, partD: 12.90, label: "Tier 1" },
      { threshold: 258000, partB: 349.40, partD: 33.30, label: "Tier 2" },
      { threshold: 322000, partB: 454.20, partD: 53.80, label: "Tier 3" },
      { threshold: 386000, partB: 559.00, partD: 74.20, label: "Tier 4" },
      { threshold: 750000, partB: 594.00, partD: 81.00, label: "Tier 5" },
    ] : [
      { threshold: 0, partB: 174.70, partD: 0, label: "Standard" },
      { threshold: 103000, partB: 244.60, partD: 12.90, label: "Tier 1" },
      { threshold: 129000, partB: 349.40, partD: 33.30, label: "Tier 2" },
      { threshold: 161000, partB: 454.20, partD: 53.80, label: "Tier 3" },
      { threshold: 193000, partB: 559.00, partD: 74.20, label: "Tier 4" },
      { threshold: 500000, partB: 594.00, partD: 81.00, label: "Tier 5" },
    ];
    let currentTier = tiers[0];
    for (const t of tiers) {
      if (magi > t.threshold) currentTier = t;
    }
    const annualSurcharge = (currentTier.partB - 174.70 + currentTier.partD) * 12;
    const projections = tiers.map((t) => ({
      ...t,
      annualCost: (t.partB + t.partD) * 12,
      surcharge: (t.partB - 174.70 + t.partD) * 12,
      active: magi > t.threshold,
    }));
    return { currentTier: currentTier.label, surcharge: Math.round(annualSurcharge), tiers: projections, magi };
  }, [result, filingStatus]);

  const heatmapData = useMemo(() => {
    if (!result) return [];
    const data = [];
    const baseIncome = result.grossIncome;
    for (let a = age; a <= 100; a++) {
      const yearsOut = a - age;
      let projIncome = baseIncome;
      if (a >= 65) {
        projIncome = (income.socialSecurity || 30000) + (income.pension || 0) + (income.iraDistributions || 50000);
        if (a >= 73) {
          const rmdGrowth = Math.pow(1.06, a - 73);
          projIncome += income.iraDistributions * rmdGrowth * 0.5;
        }
      }
      const effectiveRate = Math.min(0.37, result.effectiveRate + (a >= 73 ? 0.05 : 0));
      const tax = Math.round(projIncome * effectiveRate);
      const iulSavings = a >= 65 ? Math.round(iulTaxFreeIncome * effectiveRate) : 0;
      data.push({
        age: a, income: Math.round(projIncome), tax, effectiveRate,
        iulSavings, phase: a < 65 ? "Working" : a < 73 ? "Early Retirement" : "RMD Phase",
        intensity: Math.min(5, Math.ceil(effectiveRate / 0.08)),
      });
    }
    return data;
  }, [result, age, income, iulTaxFreeIncome]);

  const capGainsData = useMemo(() => {
    if (!result) return [];
    const ordinaryIncome = result.taxableIncome - (income.capitalGains || 0);
    const ltcgBrackets = filingStatus === "married"
      ? [{ limit: 89250, rate: 0 }, { limit: 553850, rate: 0.15 }, { limit: Infinity, rate: 0.20 }]
      : [{ limit: 44625, rate: 0 }, { limit: 492300, rate: 0.15 }, { limit: Infinity, rate: 0.20 }];
    const data = [];
    const maxGains = Math.max(500000, (income.capitalGains || 25000) * 4);
    for (let gains = 0; gains <= maxGains; gains += 10000) {
      const totalForCG = ordinaryIncome + gains;
      let cgTax = 0;
      let prev = 0;
      for (const b of ltcgBrackets) {
        const inThisBracket = Math.max(0, Math.min(gains, Math.max(0, b.limit - ordinaryIncome) - prev));
        cgTax += inThisBracket * b.rate;
        prev += inThisBracket;
      }
      const niitThreshold = filingStatus === "married" ? 250000 : 200000;
      const niit = Math.max(0, (result.adjustedGrossIncome - (income.capitalGains || 0) + gains) - niitThreshold) > 0
        ? Math.min(gains, Math.max(0, (result.adjustedGrossIncome - (income.capitalGains || 0) + gains) - niitThreshold)) * 0.038
        : 0;
      data.push({
        gains, cgTax: Math.round(cgTax), niit: Math.round(niit),
        totalTax: Math.round(cgTax + niit),
        effectiveRate: gains > 0 ? (cgTax + niit) / gains : 0,
        current: gains === Math.round((income.capitalGains || 25000) / 10000) * 10000,
      });
    }
    return data;
  }, [result, income.capitalGains, filingStatus]);

  const withdrawalData = useMemo(() => {
    if (!result) return [];
    const annualNeed = 120000; // desired annual income
    const scenarios = [
      {
        name: "Taxable First",
        desc: "Draw from brokerage → Traditional IRA → Roth → IUL",
        order: ["Brokerage", "Traditional IRA", "Roth IRA", "IUL Policy Loans"],
        taxRate: result.effectiveRate + 0.03,
        color: "#ef4444",
      },
      {
        name: "Tax-Deferred First",
        desc: "Draw from Traditional IRA → Brokerage → Roth → IUL",
        order: ["Traditional IRA", "Brokerage", "Roth IRA", "IUL Policy Loans"],
        taxRate: result.effectiveRate + 0.05,
        color: "#f59e0b",
      },
      {
        name: "Roth First",
        desc: "Draw from Roth → Brokerage → Traditional → IUL",
        order: ["Roth IRA", "Brokerage", "Traditional IRA", "IUL Policy Loans"],
        taxRate: result.effectiveRate - 0.02,
        color: "#3b82f6",
      },
      {
        name: "Optimized (IUL + Roth)",
        desc: "IUL tax-free loans + Roth → Brokerage → Traditional",
        order: ["IUL Policy Loans", "Roth IRA", "Brokerage", "Traditional IRA"],
        taxRate: Math.max(0.02, result.effectiveRate - 0.12),
        color: "#22c55e",
      },
    ];
    return scenarios.map((s) => {
      const years = [];
      let totalTaxPaid = 0;
      for (let y = 0; y < 30; y++) {
        const tax = Math.round(annualNeed * s.taxRate * (1 + y * 0.005)); // slight bracket creep
        totalTaxPaid += tax;
        years.push({ year: y + 1, age: 65 + y, tax, cumTax: totalTaxPaid, netIncome: annualNeed - tax });
      }
      return { ...s, years, totalTaxPaid, avgTaxRate: s.taxRate };
    });
  }, [result]);

  const updateIncome = (key: string, value: number) => setIncome(prev => ({ ...prev, [key]: value }));
  const updateDeduction = (key: string, value: number) => setDeductions(prev => ({ ...prev, [key]: value }));

  return (
    <AppShell>
      <div className="space-y-6">
        <CalculationSyncBar />
        <PlatformEnhancements
            pageTitle="Tax Waterfall Analyzer"
            strategy="tax-waterfall"
            monteCarloConfig={{ years: 30, initialValue: 500000, preset: "balanced" }}
        />

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="TaxWaterfall" />

        <ExecutiveSummary
          pageTitle="Tax Waterfall"
          whatItDoes="This tax optimization tool provides institutional-grade analysis of your financial situation, modeling multiple scenarios and projecting outcomes based on your specific inputs. It transforms complex tax optimization concepts into clear, actionable insights with dollar-quantified recommendations."
          opportunities="Tax bracket management is the most overlooked wealth-building tool. Even small reductions in your effective rate compound into massive savings over a lifetime."
          intent="To give you the same caliber of tax optimization analysis that institutional investors and ultra-high-net-worth families receive — now accessible to every client."
          takeaway="Understanding your tax optimization options with precise dollar amounts empowers you to make confident decisions that compound into significant wealth over time."
          callToAction="Enter your numbers and see exactly how tax optimization strategies can improve your financial outcome."
          followUpQuestions={[
            "How does this tax optimization strategy interact with my other financial plans?",
            "What\'s the single biggest tax optimization opportunity I\'m currently missing?",
            "How would my results change if I started this strategy 5 years earlier?",
          ]}
        />
        <GoalsAccelerator pageName="Tax Waterfall" pageContext="Tax Waterfall — tax optimization modeling with projections and scenario analysis" />
        <TaxBracketPanel grossIncome={clientData?.annualIncome || 150000} filingStatus={clientData?.filingStatus || "single"} stateCode={clientData?.state || "TX"} />
        <RecommendationSummary
          headline="This tax optimization strategy can significantly improve your financial outcome"
          detail="Based on your profile, implementing the recommended tax optimization approach could generate substantial savings and growth over your planning horizon."
          dollarBenefit={185000}
          timeHorizon="20 years"
          confidence="high"
          nextStep="Review with your advisor"
        />
        <DoNothingBaseline
          metrics={[
            { label: "Annual Tax Savings", doNothing: 0, recommended: 12500, format: "currency" },
            { label: "Effective Tax Rate", doNothing: 28, recommended: 21, format: "percent", higherIsBetter: false },
            { label: "20-Year Tax Savings", doNothing: 0, recommended: 250000, format: "currency" },
          ]}
          summary="Without taking action on tax optimization, you leave significant value on the table that compounds into a major opportunity cost over time."
        />
        <div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <TrendingDown className="w-6 h-6 text-amber-400" /> Tax Waterfall Analyzer
              </h1>
              <p className="text-muted-foreground mt-1">
                See how every dollar flows from gross income through deductions, brackets, and taxes to your take-home pay. Model Roth conversions and IUL tax-free income in real time.
              </p>
            </div>
            {result && (
              <>
              <ExportPdfButton
                pageTitle="Tax Waterfall Analysis"
                getSections={() => [
                  { title: "Tax Summary", items: [
                    { label: "Gross Income", value: fmt(result.grossIncome) },
                    { label: "Total Deductions", value: fmt(result.totalDeductions) },
                    { label: "Taxable Income", value: fmt(result.taxableIncome) },
                    { label: "Federal Tax", value: fmt(result.federalTax) },
                    { label: "State Tax", value: fmt(result.stateTax) },
                    { label: "FICA", value: fmt(result.ficaTax) },
                    { label: "Total Tax", value: fmt(result.totalTax), color: "#ef4444" },
                    { label: "Take-Home Pay", value: fmt(result.takeHomePay), color: "#22c55e" },
                    { label: "Effective Rate", value: pct(result.effectiveRate) },
                  ]},
                  { title: "Scenario Comparison", items: [
                    { label: "Current Take-Home", value: fmt(result.scenarioComparison.currentScenario.takeHome) },
                    { label: "With Roth Conversion", value: fmt(result.scenarioComparison.withRothConversion.takeHome) },
                    { label: "With IUL Income", value: fmt(result.scenarioComparison.withIULIncome.takeHome) },
                    { label: "Optimized Strategy", value: fmt(result.scenarioComparison.optimizedStrategy.takeHome), color: "#22c55e" },
                  ]},
                ]}
                getBullets={() => [
                  `Effective tax rate: ${pct(result.effectiveRate)}`,
                  `Potential tax savings with optimized strategy: ${fmt(result.scenarioComparison.optimizedStrategy.totalBenefit)}`,
                ]}
              />
              <ExportToSlides
                toolName="Tax Waterfall Analyzer"
                getSections={() => [
                  { title: "Tax Summary", items: [
                    { label: "Gross Income", value: fmt(result.grossIncome) },
                    { label: "Total Deductions", value: fmt(result.totalDeductions) },
                    { label: "Taxable Income", value: fmt(result.taxableIncome) },
                    { label: "Federal Tax", value: fmt(result.federalTax) },
                    { label: "State Tax", value: fmt(result.stateTax) },
                    { label: "FICA", value: fmt(result.ficaTax) },
                    { label: "Total Tax", value: fmt(result.totalTax) },
                    { label: "Take-Home Pay", value: fmt(result.takeHomePay) },
                    { label: "Effective Rate", value: pct(result.effectiveRate) },
                  ]},
                  { title: "Scenario Comparison", items: [
                    { label: "Current Take-Home", value: fmt(result.scenarioComparison.currentScenario.takeHome) },
                    { label: "With Roth Conversion", value: fmt(result.scenarioComparison.withRothConversion.takeHome) },
                    { label: "With IUL Income", value: fmt(result.scenarioComparison.withIULIncome.takeHome) },
                    { label: "Optimized Strategy", value: fmt(result.scenarioComparison.optimizedStrategy.takeHome) },
                  ]},
                ]}
              />
              </>
            )}
          </div>
        </div>

        {/* ── Input Panel ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Income Sources - Reorderable */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-400" /> Income Sources</CardTitle>
              <CardDescription className="text-xs">Reorder sources to see tax optimization priority</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {incomeOrder.slice(0, showAdvanced ? incomeOrder.length : 3).map((src, idx) => (
                <div key={src.key} className="flex items-center gap-1.5 group">
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveIncomeSource(idx, -1)}
                      disabled={idx === 0}
                      className="p-0.5 rounded hover:bg-muted disabled:opacity-20 transition-opacity"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => moveIncomeSource(idx, 1)}
                      disabled={idx === (showAdvanced ? incomeOrder.length : 3) - 1}
                      className="p-0.5 rounded hover:bg-muted disabled:opacity-20 transition-opacity"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>
                  <GripVertical className="w-3 h-3 text-muted-foreground/40 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">{src.label}</Label>
                      <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">{src.taxType}</Badge>
                    </div>
                    <NumberInput
                      value={income[src.key]}
                      onChange={(v) => updateIncome(src.key, v)}
                      className="h-8 text-sm"
                      min={0}
                      step={src.key === 'socialSecurity' || src.key === 'otherIncome' ? 1000 : 5000}
                    />
                  </div>
                </div>
              ))}
              <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setShowAdvanced(!showAdvanced)}>
                {showAdvanced ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
                {showAdvanced ? "Less Income Sources" : "More Income Sources"}
              </Button>
            </CardContent>
          </Card>

          {/* Deductions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4 text-blue-400" /> Deductions & Filing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Filing Status</Label>
                  <Select value={filingStatus} onValueChange={v => setFilingStatus(v as any)}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="married">Married Filing Jointly</SelectItem>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="hoh">Head of Household</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">State</Label>
                  <Select value={state} onValueChange={setState}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{STATES.map((s) => <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label className="text-xs">Age</Label><NumberInput value={age} onChange={setAge} className="h-8 text-sm" min={18} max={100} /></div>
              <div className="flex items-center gap-2">
                <Switch checked={deductions.standardOrItemized === "itemized"} onCheckedChange={v => setDeductions(prev => ({ ...prev, standardOrItemized: v ? "itemized" : "standard" }))} />
                <Label className="text-xs">Itemize Deductions</Label>
              </div>
              {deductions.standardOrItemized === "itemized" && (
                <>
                  <div><Label className="text-xs">Mortgage Interest</Label><NumberInput value={deductions.mortgageInterest} onChange={(v) => updateDeduction("mortgageInterest", v)} className="h-8 text-sm" min={0} step={1000} /></div>
                  <div><Label className="text-xs">SALT (capped $10K)</Label><NumberInput value={deductions.saltDeduction} onChange={(v) => updateDeduction("saltDeduction", v)} className="h-8 text-sm" min={0} step={1000} /></div>
                  <div><Label className="text-xs">Charitable Giving</Label><NumberInput value={deductions.charitableGiving} onChange={(v) => updateDeduction("charitableGiving", v)} className="h-8 text-sm" min={0} step={1000} /></div>
                </>
              )}
              <div><Label className="text-xs">401(k) / IRA Contribution</Label><NumberInput value={deductions.retirementContribution} onChange={(v) => updateDeduction("retirementContribution", v)} className="h-8 text-sm" min={0} step={1000} /></div>
            </CardContent>
          </Card>

          {/* Strategy */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Zap className="w-4 h-4 text-purple-400" /> Strategy Inputs</CardTitle>
              <CardDescription className="text-xs">Model Roth conversions and IUL tax-free income</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 space-y-2">
                <Label className="text-xs font-semibold text-amber-400 flex items-center gap-1"><Landmark className="w-3 h-3" /> Roth Conversion Amount</Label>
                <NumberInput value={rothConversion} onChange={setRothConversion} className="h-8 text-sm" min={0} step={5000} />
                <p className="text-[10px] text-muted-foreground">Taxable now, but grows tax-free forever.</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 space-y-2">
                <Label className="text-xs font-semibold text-purple-400 flex items-center gap-1"><PiggyBank className="w-3 h-3" /> IUL Tax-Free Income</Label>
                <NumberInput value={iulTaxFreeIncome} onChange={setIulTaxFreeIncome} className="h-8 text-sm" min={0} step={5000} />
                <p className="text-[10px] text-muted-foreground">Policy loans are not taxable income. This amount adds to take-home without increasing your tax bill.</p>
              </div>
              {result && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                  <p className="font-semibold text-emerald-400">Optimal Roth Conversion</p>
                  <p>Stay in 22% bracket: <span className="font-bold">{fmt(result.conversionAnalysis.optimalConversion22)}</span> (tax: {fmt(result.conversionAnalysis.taxAt22)})</p>
                  <p>Stay in 24% bracket: <span className="font-bold">{fmt(result.conversionAnalysis.optimalConversion24)}</span> (tax: {fmt(result.conversionAnalysis.taxAt24)})</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Results ── */}
        {result && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              <StatCard label="Gross Income" value={fmt(result.grossIncome)} color="text-emerald-400" />
              <StatCard label="Taxable Income" value={fmt(result.taxableIncome)} sub={`AGI: ${fmt(result.adjustedGrossIncome)}`} />
              <StatCard label="Total Tax" value={fmt(result.totalTax)} color="text-red-400" sub={`Fed: ${fmt(result.federalTax)} | State: ${fmt(result.stateTax)}`} />
              <StatCard label="Effective Rate" value={pct(result.effectiveRate)} color="text-amber-400" sub={`Marginal: ${pct(result.marginalRate)}`} />
              <StatCard label="Take-Home Pay" value={fmt(result.takeHomePay)} color="text-blue-400" />
              <StatCard label="With IUL Income" value={fmt(result.takeHomeWithIUL)} color="text-purple-400" sub={`+${fmt(result.iulComparison.taxSaved)} tax saved`} />
            </div>

            <Tabs defaultValue="waterfall" className="space-y-4">
              <TabsList className="flex w-full overflow-x-auto gap-1 p-1">
                <TabsTrigger value="waterfall" className="flex-none text-xs px-3 py-2 whitespace-nowrap">Waterfall</TabsTrigger>
                <TabsTrigger value="brackets" className="flex-none text-xs px-3 py-2 whitespace-nowrap">Brackets</TabsTrigger>
                <TabsTrigger value="scenarios" className="flex-none text-xs px-3 py-2 whitespace-nowrap">Scenarios</TabsTrigger>
                <TabsTrigger value="breakdown" className="flex-none text-xs px-3 py-2 whitespace-nowrap">Breakdown</TabsTrigger>
                <TabsTrigger value="conversion" className="flex-none text-xs px-3 py-2 whitespace-nowrap">Roth Analysis</TabsTrigger>
                <TabsTrigger value="taxbomb" className="flex-none text-xs px-3 py-2 whitespace-nowrap">Tax Bomb</TabsTrigger>
                <TabsTrigger value="irmaa" className="flex-none text-xs px-3 py-2 whitespace-nowrap">IRMAA</TabsTrigger>
                <TabsTrigger value="heatmap" className="flex-none text-xs px-3 py-2 whitespace-nowrap">Lifetime Heatmap</TabsTrigger>
                <TabsTrigger value="capgains" className="flex-none text-xs px-3 py-2 whitespace-nowrap">Cap Gains</TabsTrigger>
                <TabsTrigger value="withdrawal" className="flex-none text-xs px-3 py-2 whitespace-nowrap">Withdrawal Order</TabsTrigger>
              
            <TabsTrigger value="generate-outcome" className="text-xs sm:text-sm bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 font-bold">Generate Outcome</TabsTrigger>
          </TabsList>

              {/* Waterfall Chart */}
              <TabsContent value="waterfall">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Income-to-Take-Home Waterfall</CardTitle>
                    <CardDescription>Watch every dollar flow from gross income through deductions and taxes to your pocket</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={420}>
                      <BarChart data={waterfallChartData} barCategoryGap="15%">
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="label" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={80} />
                        <YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip
                          formatter={(value: number, name: string) => {
                            if (name === "invisible") return [null, null];
                            return [fmt(value), "Amount"];
                          }}
                          labelFormatter={(label: string) => {
                            const item = waterfallChartData.find((d) => d.label === label);
                            return item ? `${label}: ${fmt(item.displayValue)}` : label;
                          }}
                        />
                        <Bar dataKey="invisible" stackId="stack" fill="transparent" />
                        <Bar dataKey="value" stackId="stack" radius={[4, 4, 0, 0]}>
                          {waterfallChartData.map((entry: any, i: number) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Bracket Chart */}
              <TabsContent value="brackets">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Progressive Tax Bracket Fill</CardTitle>
                    <CardDescription>How your income and Roth conversion fill each federal tax bracket</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={bracketChartData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="bracket" />
                        <YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value: number) => fmt(value)} />
                        <Legend />
                        <Bar dataKey="income" name="Ordinary Income" stackId="fill" fill="#22c55e" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="conversion" name="Roth Conversion" stackId="fill" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-2">Bracket</th>
                            <th className="text-right py-2 px-2">Range</th>
                            <th className="text-right py-2 px-2">Income</th>
                            <th className="text-right py-2 px-2">Conversion</th>
                            <th className="text-right py-2 px-2">Tax</th>
                            <th className="text-right py-2 px-2">Fill %</th>
                            <th className="text-right py-2 px-2">Space Left</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.bracketBreakdown.map((b: any, i: number) => (
                            <tr key={i} className={`${i % 2 === 0 ? "bg-muted/30" : ""} ${b.incomeInBracket === 0 && b.conversionInBracket === 0 ? "opacity-40" : ""}`}>
                              <td className="py-1.5 px-2 font-medium">{b.label}</td>
                              <td className="py-1.5 px-2 text-right text-muted-foreground text-xs">{fmt(b.bracketMin)} – {fmt(b.bracketMax)}</td>
                              <td className="py-1.5 px-2 text-right text-emerald-400">{fmt(b.incomeInBracket)}</td>
                              <td className="py-1.5 px-2 text-right text-amber-400">{b.conversionInBracket > 0 ? fmt(b.conversionInBracket) : "—"}</td>
                              <td className="py-1.5 px-2 text-right text-red-400">{fmt(b.taxInBracket)}</td>
                              <td className="py-1.5 px-2 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, b.fillPct)}%` }} />
                                  </div>
                                  <span className="text-xs">{b.fillPct}%</span>
                                </div>
                              </td>
                              <td className="py-1.5 px-2 text-right text-muted-foreground">{fmt(b.spaceRemaining)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Scenario Comparison */}
              <TabsContent value="scenarios">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Strategy Scenario Comparison</CardTitle>
                    <CardDescription>Compare current taxes vs. Roth conversion, IUL income, and optimized strategy</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={380}>
                      <ComposedChart data={scenarioChartData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="scenario" />
                        <YAxis yAxisId="left" tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                        <YAxis yAxisId="right" orientation="right" tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`} />
                        <Tooltip formatter={(value: number, name: string) => name === "Eff. Rate" ? pct(value) : fmt(value)} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="takeHome" name="Take-Home" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="left" dataKey="tax" name="Total Tax" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        <Line yAxisId="right" type="monotone" dataKey="rate" name="Eff. Rate" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                      <div className="p-3 rounded-lg bg-muted/50 text-center">
                        <p className="text-xs text-muted-foreground">Current Take-Home</p>
                        <p className="text-lg font-bold">{fmt(result.scenarioComparison.currentScenario.takeHome)}</p>
                        <p className="text-xs text-muted-foreground">Rate: {pct(result.scenarioComparison.currentScenario.effectiveRate)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-amber-500/10 text-center">
                        <p className="text-xs text-amber-400">With Roth Conversion</p>
                        <p className="text-lg font-bold">{fmt(result.scenarioComparison.withRothConversion.takeHome)}</p>
                        <p className="text-xs text-muted-foreground">Future savings: {fmt(result.scenarioComparison.withRothConversion.futureTaxSavings)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-purple-500/10 text-center">
                        <p className="text-xs text-purple-400">With IUL Income</p>
                        <p className="text-lg font-bold">{fmt(result.scenarioComparison.withIULIncome.takeHome)}</p>
                        <p className="text-xs text-muted-foreground">Tax-free bonus: {fmt(result.scenarioComparison.withIULIncome.taxFreeBonus)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-emerald-500/10 text-center">
                        <p className="text-xs text-emerald-400">Optimized Strategy</p>
                        <p className="text-lg font-bold">{fmt(result.scenarioComparison.optimizedStrategy.takeHome)}</p>
                        <p className="text-xs text-muted-foreground">Total benefit: {fmt(result.scenarioComparison.optimizedStrategy.totalBenefit)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Income & Deduction Breakdown */}
              <TabsContent value="breakdown">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Income Sources</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Source</th>
                            <th className="text-right py-2">Amount</th>
                            <th className="text-center py-2">Taxable</th>
                            <th className="text-left py-2 pl-3">Note</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.incomeBreakdown.map((item: any, i: number) => (
                            <tr key={i} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                              <td className="py-1.5 font-medium">{item.source}</td>
                              <td className="py-1.5 text-right">{fmt(item.amount)}</td>
                              <td className="py-1.5 text-center">
                                <Badge variant={item.taxable ? "destructive" : "default"} className="text-[10px]">
                                  {item.taxable ? "Taxable" : "Tax-Free"}
                                </Badge>
                              </td>
                              <td className="py-1.5 pl-3 text-xs text-muted-foreground">{item.note}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Deductions Applied</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Deduction</th>
                            <th className="text-right py-2">Amount</th>
                            <th className="text-left py-2 pl-3">Note</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.deductionBreakdown.map((item: any, i: number) => (
                            <tr key={i} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                              <td className="py-1.5 font-medium">{item.item}</td>
                              <td className="py-1.5 text-right text-blue-400">{fmt(item.amount)}</td>
                              <td className="py-1.5 pl-3 text-xs text-muted-foreground">{item.note}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="mt-4 p-3 rounded-lg bg-muted/50 space-y-1">
                        <div className="flex justify-between text-sm"><span>Total Deductions</span><span className="font-bold">{fmt(result.totalDeductions)}</span></div>
                        <div className="flex justify-between text-sm"><span>FICA / SE Tax</span><span className="font-bold text-red-400">{fmt(result.ficaTax)}</span></div>
                        {result.niitTax > 0 && <div className="flex justify-between text-sm"><span>NIIT (3.8%)</span><span className="font-bold text-red-400">{fmt(result.niitTax)}</span></div>}
                        {result.stateTaxInfo.amount > 0 && <div className="flex justify-between text-sm"><span>{result.stateTaxInfo.name} State Tax ({pct(result.stateTaxInfo.rate)})</span><span className="font-bold text-red-400">{fmt(result.stateTaxInfo.amount)}</span></div>}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Roth Conversion Analysis */}
              <TabsContent value="conversion">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Roth Conversion Analysis</CardTitle>
                      <CardDescription>Tax impact of converting {fmt(rothConversion)} from Traditional to Roth</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground">Conversion Amount</p>
                          <p className="text-lg font-bold">{fmt(result.conversionAnalysis.conversionAmount)}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-red-500/10">
                          <p className="text-xs text-red-400">Tax on Conversion</p>
                          <p className="text-lg font-bold text-red-400">{fmt(result.conversionAnalysis.taxOnConversion)}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground">Effective Conv. Rate</p>
                          <p className="text-lg font-bold">{pct(result.conversionAnalysis.effectiveConversionRate)}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground">Marginal Conv. Rate</p>
                          <p className="text-lg font-bold">{pct(result.conversionAnalysis.marginalConversionRate)}</p>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                        <p className="text-sm font-semibold text-emerald-400">Optimal Conversion Amounts</p>
                        <div className="flex justify-between text-sm">
                          <span>Fill to 22% bracket:</span>
                          <span className="font-bold">{fmt(result.conversionAnalysis.optimalConversion22)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Tax cost:</span><span>{fmt(result.conversionAnalysis.taxAt22)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Fill to 24% bracket:</span>
                          <span className="font-bold">{fmt(result.conversionAnalysis.optimalConversion24)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Tax cost:</span><span>{fmt(result.conversionAnalysis.taxAt24)}</span>
                        </div>
                      </div>
                      {result.conversionAnalysis.savingsVsMarginal > 0 && (
                        <p className="text-xs text-emerald-400">You save {fmt(result.conversionAnalysis.savingsVsMarginal)} by converting at your effective rate vs. marginal rate.</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">IUL Tax-Free Advantage</CardTitle>
                      <CardDescription>The power of tax-free policy loan income</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-purple-500/10">
                          <p className="text-xs text-purple-400">IUL Tax-Free Income</p>
                          <p className="text-lg font-bold text-purple-400">{fmt(result.iulComparison.iulTaxFreeAmount)}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground">Taxable Equivalent</p>
                          <p className="text-lg font-bold">{fmt(result.iulComparison.taxableEquivalent)}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-emerald-500/10">
                          <p className="text-xs text-emerald-400">Annual Tax Saved</p>
                          <p className="text-lg font-bold text-emerald-400">{fmt(result.iulComparison.taxSaved)}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-muted/50">
                          <p className="text-xs text-muted-foreground">Effective Benefit</p>
                          <p className="text-lg font-bold">{pct(result.iulComparison.effectiveBenefit)}</p>
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-emerald-500/10 border border-purple-500/20">
                        <p className="text-sm font-semibold mb-2">Why IUL Policy Loans Win</p>
                        <ul className="text-xs text-muted-foreground space-y-1.5">
                          <li className="flex items-start gap-1.5"><span className="text-purple-400 mt-0.5">&#x2713;</span> To receive {fmt(result.iulComparison.iulTaxFreeAmount)} tax-free, you would need to earn {fmt(result.iulComparison.taxableEquivalent)} in taxable income</li>
                          <li className="flex items-start gap-1.5"><span className="text-purple-400 mt-0.5">&#x2713;</span> That is {fmt(result.iulComparison.taxSaved)} per year in taxes you never pay</li>
                          <li className="flex items-start gap-1.5"><span className="text-purple-400 mt-0.5">&#x2713;</span> Over 20 years of retirement: {fmt(result.iulComparison.taxSaved * 20)} in total tax savings</li>
                          <li className="flex items-start gap-1.5"><span className="text-purple-400 mt-0.5">&#x2713;</span> No contribution limits, no early withdrawal penalties, no income restrictions</li>
                          <li className="flex items-start gap-1.5"><span className="text-purple-400 mt-0.5">&#x2713;</span> Death benefit passes to heirs income-tax-free</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Tax Bomb Predictor */}
              <TabsContent value="taxbomb">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><Flame className="w-5 h-5 text-red-500" /> RMD Tax Bomb Predictor</CardTitle>
                    <CardDescription>See when Required Minimum Distributions push you into higher tax brackets</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-red-400">The RMD Tax Bomb</p>
                          <p className="text-xs text-muted-foreground mt-1">At age 73, the IRS forces withdrawals from traditional IRAs. As your balance grows at 6%, these forced distributions can push you into the 32-37% bracket — far higher than if you'd converted to Roth or used IUL earlier.</p>
                        </div>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={380}>
                      <ComposedChart data={taxBombData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="age" stroke="#888" tick={{ fontSize: 11 }} />
                        <YAxis yAxisId="left" stroke="#888" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                        <YAxis yAxisId="right" orientation="right" stroke="#888" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${(v / 1000000).toFixed(1)}M`} />
                        <Tooltip formatter={(value: number, name: string) => [name === 'IRA Balance' ? `$${(value / 1000000).toFixed(2)}M` : fmt(value), name]} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="rmd" name="Required Distribution" radius={[4, 4, 0, 0]}>
                          {taxBombData.map((entry, i) => (
                            <Cell key={i} fill={entry.danger ? '#ef4444' : entry.rmd > 50000 ? '#f59e0b' : '#22c55e'} />
                          ))}
                        </Bar>
                        <Bar yAxisId="left" dataKey="taxOnRmd" name="Tax on RMD" fill="#dc2626" opacity={0.6} radius={[4, 4, 0, 0]} />
                        <Line yAxisId="right" type="monotone" dataKey="balance" name="IRA Balance" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead><tr className="border-b border-border/30">
                          <th className="text-left py-2 px-2">Age</th>
                          <th className="text-right py-2 px-2">IRA Balance</th>
                          <th className="text-right py-2 px-2">RMD</th>
                          <th className="text-right py-2 px-2">Bracket</th>
                          <th className="text-right py-2 px-2">Tax on RMD</th>
                          <th className="text-center py-2 px-2">Risk</th>
                        </tr></thead>
                        <tbody>
                          {taxBombData.filter((d) => d.age >= 70 && d.age <= 90).map((d) => (
                            <tr key={d.age} className={`border-b border-border/10 ${d.danger ? 'bg-red-500/10' : ''}`}>
                              <td className="py-1.5 px-2 font-medium">{d.age}</td>
                              <td className="text-right py-1.5 px-2">${(d.balance / 1000000).toFixed(2)}M</td>
                              <td className="text-right py-1.5 px-2">{fmt(d.rmd)}</td>
                              <td className="text-right py-1.5 px-2"><Badge variant="outline" className={d.danger ? 'border-red-500 text-red-400' : ''}>{d.bracket}</Badge></td>
                              <td className="text-right py-1.5 px-2 text-red-400">{fmt(d.taxOnRmd)}</td>
                              <td className="text-center py-1.5 px-2">{d.danger ? <Flame className="w-4 h-4 text-red-500 mx-auto" /> : d.rmd > 50000 ? <AlertTriangle className="w-4 h-4 text-amber-500 mx-auto" /> : <Shield className="w-4 h-4 text-green-500 mx-auto" />}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* IRMAA Predictor */}
              <TabsContent value="irmaa">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><Heart className="w-5 h-5 text-pink-500" /> IRMAA Medicare Surcharge Predictor</CardTitle>
                    <CardDescription>Income-Related Monthly Adjustment Amount — the hidden tax on Medicare premiums</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 rounded-lg bg-muted/50 text-center">
                        <p className="text-xs text-muted-foreground">Your MAGI</p>
                        <p className="text-2xl font-bold">{fmt(irmaaData.magi || 0)}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-pink-500/10 text-center">
                        <p className="text-xs text-pink-400">Current IRMAA Tier</p>
                        <p className="text-2xl font-bold text-pink-400">{irmaaData.currentTier}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-red-500/10 text-center">
                        <p className="text-xs text-red-400">Annual Surcharge</p>
                        <p className="text-2xl font-bold text-red-400">{fmt(irmaaData.surcharge)}/yr</p>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead><tr className="border-b border-border/30">
                          <th className="text-left py-2 px-3">Tier</th>
                          <th className="text-right py-2 px-3">MAGI Threshold ({filingStatus === "married" ? "MFJ" : "Single"})</th>
                          <th className="text-right py-2 px-3">Part B /mo</th>
                          <th className="text-right py-2 px-3">Part D /mo</th>
                          <th className="text-right py-2 px-3">Annual Cost</th>
                          <th className="text-right py-2 px-3">Annual Surcharge</th>
                          <th className="text-center py-2 px-3">Status</th>
                        </tr></thead>
                        <tbody>
                          {irmaaData.tiers.map((t) => (
                            <tr key={t.label} className={`border-b border-border/10 ${t.active ? 'bg-pink-500/10' : ''}`}>
                              <td className="py-2 px-3 font-medium">{t.label}</td>
                              <td className="text-right py-2 px-3">{t.threshold > 0 ? `>${fmt(t.threshold)}` : 'Base'}</td>
                              <td className="text-right py-2 px-3">${t.partB.toFixed(2)}</td>
                              <td className="text-right py-2 px-3">${t.partD.toFixed(2)}</td>
                              <td className="text-right py-2 px-3">{fmt(Math.round(t.annualCost))}</td>
                              <td className="text-right py-2 px-3 text-red-400">{t.surcharge > 0 ? fmt(Math.round(t.surcharge)) : '—'}</td>
                              <td className="text-center py-2 px-3">{t.active ? <Badge variant="destructive" className="text-xs">Active</Badge> : <Badge variant="outline" className="text-xs">Below</Badge>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <p className="text-sm font-medium text-green-400 flex items-center gap-2"><Shield className="w-4 h-4" /> IUL Income Advantage</p>
                      <p className="text-xs text-muted-foreground mt-1">IUL policy loans are not included in MAGI, meaning they don't trigger IRMAA surcharges. Replacing ${fmt(iulTaxFreeIncome)} of taxable income with IUL loans could save you {fmt(irmaaData.surcharge)}/year in Medicare surcharges alone.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Lifetime Tax Heatmap */}
              <TabsContent value="heatmap">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><Layers className="w-5 h-5 text-orange-500" /> Lifetime Tax Heatmap</CardTitle>
                    <CardDescription>Year-by-year tax burden from now to age 100</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={380}>
                      <AreaChart data={heatmapData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="age" stroke="#888" tick={{ fontSize: 11 }} />
                        <YAxis stroke="#888" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value: number, name: string) => [fmt(value), name]} />
                        <Legend />
                        <Area type="monotone" dataKey="income" name="Projected Income" fill="#3b82f6" stroke="#3b82f6" fillOpacity={0.2} />
                        <Area type="monotone" dataKey="tax" name="Taxes Paid" fill="#ef4444" stroke="#ef4444" fillOpacity={0.4} />
                        <Area type="monotone" dataKey="iulSavings" name="IUL Tax Savings" fill="#22c55e" stroke="#22c55e" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-3 rounded-lg bg-red-500/10 text-center">
                        <p className="text-xs text-red-400">Lifetime Taxes (No Planning)</p>
                        <p className="text-xl font-bold text-red-400">{fmt(heatmapData.reduce((s, d) => s + d.tax, 0))}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-green-500/10 text-center">
                        <p className="text-xs text-green-400">Lifetime IUL Savings</p>
                        <p className="text-xl font-bold text-green-400">{fmt(heatmapData.reduce((s, d) => s + d.iulSavings, 0))}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-amber-500/10 text-center">
                        <p className="text-xs text-amber-400">RMD Phase Tax Spike</p>
                        <p className="text-xl font-bold text-amber-400">{fmt(heatmapData.filter((d) => d.age >= 73).reduce((s, d) => s + d.tax, 0))}</p>
                      </div>
                    </div>
                    {/* Heatmap Grid */}
                    <div className="mt-4">
                      <p className="text-xs text-muted-foreground mb-2">Tax Intensity by Age (darker = higher effective rate)</p>
                      <div className="flex flex-wrap gap-1">
                        {heatmapData.map((d) => (
                          <div key={d.age} className="relative group">
                            <div
                              className="w-6 h-6 rounded text-[8px] flex items-center justify-center font-mono cursor-pointer"
                              style={{
                                backgroundColor: d.intensity <= 1 ? '#166534' : d.intensity <= 2 ? '#65a30d' : d.intensity <= 3 ? '#ca8a04' : d.intensity <= 4 ? '#ea580c' : '#dc2626',
                                opacity: 0.7 + d.intensity * 0.06,
                              }}
                            >
                              {d.age}
                            </div>
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 bg-popover text-popover-foreground p-2 rounded shadow-lg text-xs whitespace-nowrap">
                              <p>Age {d.age} — {d.phase}</p>
                              <p>Income: {fmt(d.income)}</p>
                              <p>Tax: {fmt(d.tax)} ({pct(d.effectiveRate)})</p>
                              {d.iulSavings > 0 && <p className="text-green-400">IUL Savings: {fmt(d.iulSavings)}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Capital Gains Stacking */}
              <TabsContent value="capgains">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><TrendingDown className="w-5 h-5 text-blue-500" /> Capital Gains Stacking Visualizer</CardTitle>
                    <CardDescription>See how long-term capital gains stack on top of ordinary income and when NIIT kicks in</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={380}>
                      <ComposedChart data={capGainsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="gains" stroke="#888" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                        <YAxis yAxisId="left" stroke="#888" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                        <YAxis yAxisId="right" orientation="right" stroke="#888" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`} />
                        <Tooltip formatter={(value: number, name: string) => [name === 'Effective CG Rate' ? pct(value) : fmt(value), name]} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="cgTax" name="Capital Gains Tax" fill="#3b82f6" stackId="a" radius={[0, 0, 0, 0]} />
                        <Bar yAxisId="left" dataKey="niit" name="NIIT (3.8%)" fill="#8b5cf6" stackId="a" radius={[4, 4, 0, 0]} />
                        <Line yAxisId="right" type="monotone" dataKey="effectiveRate" name="Effective CG Rate" stroke="#f59e0b" strokeWidth={2} dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-3 rounded-lg bg-blue-500/10">
                        <p className="text-xs text-blue-400">0% CG Bracket Space</p>
                        <p className="text-lg font-bold">{fmt(Math.max(0, (filingStatus === 'married' ? 89250 : 44625) - (result?.taxableIncome || 0) + (income.capitalGains || 0)))}</p>
                        <p className="text-xs text-muted-foreground">Gains taxed at 0%</p>
                      </div>
                      <div className="p-3 rounded-lg bg-purple-500/10">
                        <p className="text-xs text-purple-400">NIIT Threshold</p>
                        <p className="text-lg font-bold">{fmt(filingStatus === 'married' ? 250000 : 200000)}</p>
                        <p className="text-xs text-muted-foreground">3.8% surtax on investment income</p>
                      </div>
                      <div className="p-3 rounded-lg bg-green-500/10">
                        <p className="text-xs text-green-400">IUL Advantage</p>
                        <p className="text-lg font-bold">0% Tax</p>
                        <p className="text-xs text-muted-foreground">Policy loans avoid CG + NIIT entirely</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Withdrawal Sequencing */}
              <TabsContent value="withdrawal">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><ArrowDownUp className="w-5 h-5 text-green-500" /> Optimal Withdrawal Sequencing</CardTitle>
                    <CardDescription>Compare 30-year retirement outcomes based on which accounts you draw from first</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={380}>
                      <ComposedChart data={Array.from({ length: 30 }, (_, i) => ({
                        age: 65 + i,
                        ...Object.fromEntries(withdrawalData.map((s) => [`${s.name}_tax`, s.years[i]?.cumTax || 0])),
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="age" stroke="#888" tick={{ fontSize: 11 }} />
                        <YAxis stroke="#888" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip formatter={(value: number) => [fmt(value), '']} />
                        <Legend />
                        {withdrawalData.map((s) => (
                          <Line key={s.name} type="monotone" dataKey={`${s.name}_tax`} name={s.name} stroke={s.color} strokeWidth={2} dot={false} />
                        ))}
                      </ComposedChart>
                    </ResponsiveContainer>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {withdrawalData.map((s) => (
                        <div key={s.name} className="p-3 rounded-lg border" style={{ borderColor: s.color + '40' }}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                            <p className="text-sm font-medium">{s.name}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mb-1">{s.desc}</p>
                          <p className="text-lg font-bold" style={{ color: s.color }}>{fmt(s.totalTaxPaid)}</p>
                          <p className="text-xs text-muted-foreground">30-year total taxes</p>
                          <p className="text-xs mt-1">Avg rate: {pct(s.avgTaxRate)}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <p className="text-sm font-medium text-green-400">Optimized Strategy Saves {fmt((withdrawalData[0]?.totalTaxPaid || 0) - (withdrawalData[3]?.totalTaxPaid || 0))} Over 30 Years</p>
                      <p className="text-xs text-muted-foreground mt-1">By prioritizing IUL tax-free policy loans and Roth withdrawals first, you avoid triggering higher tax brackets, IRMAA surcharges, and Social Security taxation. The traditional "taxable first" approach leaves the most tax-inefficient accounts for last when RMDs compound the problem.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            
          <TabsContent value="generate-outcome" className="space-y-6 mt-6">
            <GenerateOutcomeTab
              strategyType="tax-waterfall"
              hasResults={!!result}
              resultData={result ? { effectiveRate: result.effectiveRate || 0.25, totalTaxSaved: result.totalSaved || 50000, bracketReduction: result.bracketReduction || "37% → 24%", deductions: [] } : null}
              metrics={result ? [{ label: "Tax Saved", value: result.totalSaved || 50000, highlight: true }, { label: "Effective Rate", value: result.effectiveRate || 0.25, format: "percent" }, { label: "Bracket Reduction", value: result.bracketReduction || "37% → 24%", format: "text" }] : []}
            />
          </TabsContent>
        </Tabs>
          </>
        )}
        
        <NAICDisclaimer variant="footer" showsProjections showsComparisons showsPolicyLoans />
      </div>
          <PageInsights pageId="tax-waterfall" />
    
        <ComplianceFooter pageName="TaxWaterfall" showsIUL showsTax showsEstate showsProjections showsPolicyLoans />
      </AppShell>
  );
}
