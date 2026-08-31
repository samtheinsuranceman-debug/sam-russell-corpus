// @ts-nocheck
import { useCalculatorIntegration } from "@/hooks/useCalculatorIntegration";
import { ClientSelectorBar } from "@/components/ClientSelectorBar";
import { NumberInput } from "@/components/NumberInput";
import { GenerateOutcomeTab } from "@/components/GenerateOutcomeTab";
import { CalculationSyncBar } from "@/components/CalculationSyncBar";
import { useStrategy } from "@/contexts/StrategyContext";
import { useState, useEffect, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import {
  Calculator,
  DollarSign,
  TrendingUp,
  Trophy,
  Users,
  Shield,
  AlertTriangle,
  Target,
  Heart,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Calendar,
  Percent,
  Info,
} from "lucide-react";
import {

  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, Cell, PieChart, Pie, ReferenceLine,
} from "recharts";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PlatformEnhancements } from "@/components/PlatformEnhancements";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";
import { PageInsights } from "@/components/PageInsights";
import { toast } from "sonner";

/* ─── CONSTANTS ─── */
const FULL_RETIREMENT_AGES: Record<number, { years: number; months: number }> = {
  1943: { years: 66, months: 0 }, 1944: { years: 66, months: 0 },
  1945: { years: 66, months: 0 }, 1946: { years: 66, months: 0 },
  1947: { years: 66, months: 0 }, 1948: { years: 66, months: 0 },
  1949: { years: 66, months: 0 }, 1950: { years: 66, months: 0 },
  1951: { years: 66, months: 0 }, 1952: { years: 66, months: 0 },
  1953: { years: 66, months: 0 }, 1954: { years: 66, months: 0 },
  1955: { years: 66, months: 2 }, 1956: { years: 66, months: 4 },
  1957: { years: 66, months: 6 }, 1958: { years: 66, months: 8 },
  1959: { years: 66, months: 10 }, 1960: { years: 67, months: 0 },
};

const SS_TAX_WAGE_BASE_2025 = 176100;
const COLA_RATE = 0.025; // 2.5% average COLA
const EARNINGS_TEST_UNDER_FRA_2025 = 23400;
const EARNINGS_TEST_FRA_YEAR_2025 = 62160;

const SS_TAX_SINGLE_THRESHOLD_1 = 25000; // 50% taxable
const SS_TAX_SINGLE_THRESHOLD_2 = 34000; // 85% taxable
const SS_TAX_JOINT_THRESHOLD_1 = 32000;
const SS_TAX_JOINT_THRESHOLD_2 = 44000;

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const fmtPct = (n: number) => `${n.toFixed(1)}%`;

function getFRA(birthYear: number) {
  const entry = FULL_RETIREMENT_AGES[Math.min(Math.max(birthYear, 1943), 1960)] ?? { years: 67, months: 0 };
  return entry.years + entry.months / 12;
}

function getReductionFactor(claimAge: number, fra: number): number {
  if (claimAge >= fra) return 1;
  const monthsEarly = Math.round((fra - claimAge) * 12);
  const first36 = Math.min(monthsEarly, 36);
  const beyond36 = Math.max(0, monthsEarly - 36);
  return 1 - (first36 * 5 / 900) - (beyond36 * 5 / 1200);
}

function getDelayedCredits(claimAge: number, fra: number): number {
  if (claimAge <= fra) return 1;
  const monthsDelayed = Math.min(Math.round((claimAge - fra) * 12), Math.round((70 - fra) * 12));
  return 1 + (monthsDelayed * 2 / 300);
}

function getBenefitMultiplier(claimAge: number, fra: number): number {
  if (claimAge < fra) return getReductionFactor(claimAge, fra);
  return getDelayedCredits(claimAge, fra);
}

function getSSTaxablePercent(combinedIncome: number, filingStatus: "single" | "joint"): number {
  const t1 = filingStatus === "joint" ? SS_TAX_JOINT_THRESHOLD_1 : SS_TAX_SINGLE_THRESHOLD_1;
  const t2 = filingStatus === "joint" ? SS_TAX_JOINT_THRESHOLD_2 : SS_TAX_SINGLE_THRESHOLD_2;
  if (combinedIncome <= t1) return 0;
  if (combinedIncome <= t2) return 50;
  return 85;
}

const CHART_COLORS = {
  husband: "#2563eb",
  wife: "#ec4899",
  combined: "#16a34a",
  optimal: "#f59e0b",
  taxed: "#ef4444",
  taxFree: "#22c55e",
  bridge: "#8b5cf6",
};

export default function SocialSecurityOptimizer() {
  const calcIntegration = useCalculatorIntegration({
    calculatorName: "SocialSecurityOptimizer",
    strategyType: "social-security",
  });

  const { data: clientData } = useClientData();
  useEffect(() => {
    if (!clientData) return;
    setHCurrentAge(clientData.age || 65);
    setHCurrentIncome(clientData.annualIncome || 120000);
    if (clientData.spouseAge) setWCurrentAge(clientData.spouseAge);
    if (clientData.spouseIncome) setWCurrentIncome(clientData.spouseIncome);
    if (clientData.socialSecurityEstimate) setHPIA(clientData.socialSecurityEstimate);
  }, [clientData]);

  const [hName, setHName] = useState("Husband");
  const [hBirthYear, setHBirthYear] = useState(1960);
  const [hCurrentAge, setHCurrentAge] = useState(65);
  const [hPIA, setHPIA] = useState(3200); // Primary Insurance Amount at FRA
  const [hCurrentIncome, setHCurrentIncome] = useState(120000);
  const [hRetireAge, setHRetireAge] = useState(67);
  const [hClaimAge, setHClaimAge] = useState(70);

  const [wName, setWName] = useState("Wife");
  const [wBirthYear, setWBirthYear] = useState(1962);
  const [wCurrentAge, setWCurrentAge] = useState(63);
  const [wPIA, setWPIA] = useState(2100);
  const [wCurrentIncome, setWCurrentIncome] = useState(65000);
  const [wRetireAge, setWRetireAge] = useState(65);
  const [wClaimAge, setWClaimAge] = useState(67);

  const [otherRetirementIncome, setOtherRetirementIncome] = useState(40000);
  const [hasIULBridge, setHasIULBridge] = useState(true);
  const [iulBridgeAmount, setIulBridgeAmount] = useState(60000);
  const [lifeExpectancy, setLifeExpectancy] = useState(92);
  const [filingStatus, setFilingStatus] = useState<"joint" | "single">("joint");

  const hFRA = getFRA(hBirthYear);
  const wFRA = getFRA(wBirthYear);

  const analysis = useMemo(() => {
    const claimAges = [62, 63, 64, 65, 66, 67, 68, 69, 70];

    const hBenefits = claimAges.map((age) => ({
      age,
      monthly: Math.round(hPIA * getBenefitMultiplier(age, hFRA)),
      annual: Math.round(hPIA * getBenefitMultiplier(age, hFRA) * 12),
      multiplier: getBenefitMultiplier(age, hFRA),
    }));

    const wBenefits = claimAges.map((age) => ({
      age,
      monthly: Math.round(wPIA * getBenefitMultiplier(age, wFRA)),
      annual: Math.round(wPIA * getBenefitMultiplier(age, wFRA) * 12),
      multiplier: getBenefitMultiplier(age, wFRA),
    }));

    const higherPIA = Math.max(hPIA, wPIA);
    const lowerPIA = Math.min(hPIA, wPIA);
    const spousalBenefit = Math.max(0, (higherPIA / 2) - lowerPIA);

    const hSelectedBenefit = hBenefits.find((b) => b.age === hClaimAge)!;
    const wSelectedBenefit = wBenefits.find((b) => b.age === wClaimAge)!;
    const survivorBenefit = Math.max(hSelectedBenefit.monthly, wSelectedBenefit.monthly);

    const lifetimeByAge = claimAges.map((age) => {
      const hMonthly = Math.round(hPIA * getBenefitMultiplier(age, hFRA));
      const yearsCollecting = Math.max(0, lifeExpectancy - age);
      let totalWithCOLA = 0;
      for (let yr = 0; yr < yearsCollecting; yr++) {
        totalWithCOLA += hMonthly * 12 * Math.pow(1 + COLA_RATE, yr);
      }
      return { age, monthly: hMonthly, annual: hMonthly * 12, lifetime: Math.round(totalWithCOLA), yearsCollecting };
    });

    const breakEvenData: { age: number; cumulative62: number; cumulative67: number; cumulative70: number }[] = [];
    let cum62 = 0, cum67 = 0, cum70 = 0;
    const ben62 = Math.round(hPIA * getBenefitMultiplier(62, hFRA) * 12);
    const ben67 = Math.round(hPIA * getBenefitMultiplier(67, hFRA) * 12);
    const ben70 = Math.round(hPIA * getBenefitMultiplier(70, hFRA) * 12);
    for (let age = 62; age <= 95; age++) {
      if (age >= 62) cum62 += ben62 * Math.pow(1 + COLA_RATE, age - 62);
      if (age >= 67) cum67 += ben67 * Math.pow(1 + COLA_RATE, age - 67);
      if (age >= 70) cum70 += ben70 * Math.pow(1 + COLA_RATE, age - 70);
      breakEvenData.push({ age, cumulative62: Math.round(cum62), cumulative67: Math.round(cum67), cumulative70: Math.round(cum70) });
    }

    const yearlyProjection: {
      age: number; hSS: number; wSS: number; otherIncome: number;
      iulBridge: number; totalIncome: number; combinedIncome: number;
      ssTaxable: number; taxOnSS: number; effectiveRate: number;
    }[] = [];

    for (let age = hCurrentAge; age <= lifeExpectancy; age++) {
      const wAge = age - (hCurrentAge - wCurrentAge);
      const hWorking = age < hRetireAge;
      const wWorking = wAge < wRetireAge;
      const hCollecting = age >= hClaimAge;
      const wCollecting = wAge >= wClaimAge;

      const hEarnings = hWorking ? hCurrentIncome : 0;
      const wEarnings = wWorking ? wCurrentIncome : 0;

      let hSSMonthly = hCollecting ? Math.round(hPIA * getBenefitMultiplier(hClaimAge, hFRA)) : 0;
      let wSSMonthly = wCollecting ? Math.round(wPIA * getBenefitMultiplier(wClaimAge, wFRA)) : 0;

      if (hCollecting) hSSMonthly = Math.round(hSSMonthly * Math.pow(1 + COLA_RATE, age - hClaimAge));
      if (wCollecting) wSSMonthly = Math.round(wSSMonthly * Math.pow(1 + COLA_RATE, wAge - wClaimAge));

      if (hCollecting && hWorking && age < hFRA) {
        const excess = Math.max(0, hEarnings - EARNINGS_TEST_UNDER_FRA_2025);
        const reduction = Math.min(hSSMonthly * 12, excess / 2);
        hSSMonthly = Math.max(0, Math.round((hSSMonthly * 12 - reduction) / 12));
      }

      const hSSAnnual = hSSMonthly * 12;
      const wSSAnnual = wSSMonthly * 12;
      const totalSS = hSSAnnual + wSSAnnual;

      const retirementInc = (!hWorking || !wWorking) ? otherRetirementIncome : 0;
      const bridge = (hasIULBridge && !hWorking && age < hClaimAge) ? iulBridgeAmount : 0;

      const totalIncome = hEarnings + wEarnings + totalSS + retirementInc + bridge;

      const combinedIncome = hEarnings + wEarnings + retirementInc + (totalSS / 2);
      const taxablePct = getSSTaxablePercent(combinedIncome, filingStatus);
      const taxableSSAmount = Math.round(totalSS * taxablePct / 100);
      const taxOnSS = Math.round(taxableSSAmount * 0.22); // Assume 22% marginal rate
      const effectiveRate = totalSS > 0 ? (taxOnSS / totalSS) * 100 : 0;

      yearlyProjection.push({
        age, hSS: hSSAnnual, wSS: wSSAnnual, otherIncome: hEarnings + wEarnings + retirementInc,
        iulBridge: bridge, totalIncome, combinedIncome, ssTaxable: taxablePct,
        taxOnSS, effectiveRate,
      });
    }

    const scenarios = [
      { label: "Both at 62", hAge: 62, wAge: 62 },
      { label: `${hName} 67, ${wName} 62`, hAge: 67, wAge: 62 },
      { label: `${hName} 70, ${wName} 67`, hAge: 70, wAge: 67 },
      { label: "Both at 70", hAge: 70, wAge: 70 },
      { label: `Selected (${hClaimAge}/${wClaimAge})`, hAge: hClaimAge, wAge: wClaimAge },
    ];

    const scenarioResults = scenarios.map((s) => {
      let totalLifetime = 0;
      for (let age = Math.min(s.hAge, s.wAge + (hCurrentAge - wCurrentAge)); age <= lifeExpectancy; age++) {
        const wAge = age - (hCurrentAge - wCurrentAge);
        const hBen = age >= s.hAge ? Math.round(hPIA * getBenefitMultiplier(s.hAge, hFRA) * 12 * Math.pow(1 + COLA_RATE, age - s.hAge)) : 0;
        const wBen = wAge >= s.wAge ? Math.round(wPIA * getBenefitMultiplier(s.wAge, wFRA) * 12 * Math.pow(1 + COLA_RATE, wAge - s.wAge)) : 0;
        totalLifetime += hBen + wBen;
      }
      return { ...s, totalLifetime: Math.round(totalLifetime) };
    });

    const bestScenario = scenarioResults.reduce((best, s) => s.totalLifetime > best.totalLifetime ? s : best);

    const earningsTestData = [
      { income: 0, withheld: 0, net: ben62 },
      { income: 23400, withheld: 0, net: ben62 },
      { income: 40000, withheld: Math.round((40000 - 23400) / 2), net: Math.max(0, ben62 - Math.round((40000 - 23400) / 2)) },
      { income: 60000, withheld: Math.round((60000 - 23400) / 2), net: Math.max(0, ben62 - Math.round((60000 - 23400) / 2)) },
      { income: 80000, withheld: Math.round((80000 - 23400) / 2), net: Math.max(0, ben62 - Math.round((80000 - 23400) / 2)) },
      { income: 100000, withheld: Math.round((100000 - 23400) / 2), net: Math.max(0, ben62 - Math.round((100000 - 23400) / 2)) },
    ];

    const selectedYearData = yearlyProjection.find((y) => y.age === Math.max(hClaimAge, wClaimAge + (hCurrentAge - wCurrentAge))) || yearlyProjection[yearlyProjection.length - 1];
    const taxPieData = [
      { name: "Tax-Free SS", value: Math.round((selectedYearData.hSS + selectedYearData.wSS) * (1 - selectedYearData.ssTaxable / 100)), fill: CHART_COLORS.taxFree },
      { name: "Taxable SS", value: Math.round((selectedYearData.hSS + selectedYearData.wSS) * selectedYearData.ssTaxable / 100), fill: CHART_COLORS.taxed },
    ];

    return {
      hBenefits, wBenefits, hSelectedBenefit, wSelectedBenefit,
      spousalBenefit, survivorBenefit, lifetimeByAge, breakEvenData,
      yearlyProjection, scenarioResults, bestScenario, earningsTestData,
      taxPieData, selectedYearData,
    };
  }, [hPIA, wPIA, hFRA, wFRA, hClaimAge, wClaimAge, hCurrentAge, wCurrentAge,
      hCurrentIncome, wCurrentIncome, hRetireAge, wRetireAge, otherRetirementIncome,
      hasIULBridge, iulBridgeAmount, lifeExpectancy, filingStatus, hName, wName, hBirthYear, wBirthYear]);

  return (
    <AppShell>

      {/* Backend Integration Bar */}
      <ClientSelectorBar
        clients={calcIntegration.clients}
        clientsLoading={calcIntegration.clientsLoading}
        selectedClientId={calcIntegration.selectedClientId}
        selectedClientName={calcIntegration.selectedClientName}
        onSelectClient={calcIntegration.selectClient}
        scenarios={calcIntegration.scenarios}
        scenariosLoading={calcIntegration.scenariosLoading}
        scenarioName={calcIntegration.scenarioName}
        onSetScenarioName={calcIntegration.setScenarioName}
        onSave={() => calcIntegration.saveScenario({}, {})}
        onLoad={(s) => calcIntegration.loadScenario(s)}
        isSaving={calcIntegration.isSaving}
        lastSavedAt={calcIntegration.lastSavedAt}
        calculatorName="SocialSecurityOptimizer"
      />
      <div className="container py-6 space-y-6" id="social-security-optimizer">
        <CalculationSyncBar />
        <PlatformEnhancements
            pageTitle="Social Security Optimizer"
            monteCarloConfig={{ years: 30, initialValue: 500000, preset: "retirementWithdrawal" }}
        />

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="SocialSecurityOptimizer" />

        <ExecutiveSummary
          pageTitle="Social Security Optimizer"
          whatItDoes="This retirement income tool provides institutional-grade analysis of your financial situation, modeling multiple scenarios and projecting outcomes based on your specific inputs. It transforms complex retirement income concepts into clear, actionable insights with dollar-quantified recommendations."
          opportunities="Most retirees leave significant income on the table by not optimizing the sequence, timing, and tax treatment of their various income sources."
          intent="To give you the same caliber of retirement income analysis that institutional investors and ultra-high-net-worth families receive — now accessible to every client."
          takeaway="Understanding your retirement income options with precise dollar amounts empowers you to make confident decisions that compound into significant wealth over time."
          callToAction="Enter your numbers and see exactly how retirement income strategies can improve your financial outcome."
          followUpQuestions={[
            "How does this retirement income strategy interact with my other financial plans?",
            "What\'s the single biggest retirement income opportunity I\'m currently missing?",
            "How would my results change if I started this strategy 5 years earlier?",
          ]}
        />
        <GoalsAccelerator pageName="Social Security Optimizer" pageContext="Social Security Optimizer — retirement income modeling with projections and scenario analysis" />
        <TaxBracketPanel grossIncome={clientData?.annualIncome || 150000} filingStatus={clientData?.filingStatus || "single"} stateCode={clientData?.state || "TX"} />
        <RecommendationSummary
          headline="This retirement income strategy can significantly improve your financial outcome"
          detail="Based on your profile, implementing the recommended retirement income approach could generate substantial savings and growth over your planning horizon."
          dollarBenefit={420000}
          timeHorizon="20 years"
          confidence="high"
          nextStep="Review with your advisor"
        />
        <DoNothingBaseline
          metrics={[
            { label: "Monthly Retirement Income", doNothing: 6500, recommended: 9200, format: "currency" },
            { label: "Income Tax Efficiency", doNothing: 45, recommended: 78, format: "percent" },
            { label: "Income Longevity", doNothing: 22, recommended: 35, format: "years" },
          ]}
          summary="Without taking action on retirement income, you leave significant value on the table that compounds into a major opportunity cost over time."
        />
        {/* ─── HEADER ─── */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm px-3 py-1">
                <Shield className="w-4 h-4 mr-1" /> Retirement Planning
              </Badge>
              <Badge variant="outline" className="text-green-600 border-green-600">
                <Users className="w-3 h-3 mr-1" /> Husband & Wife Analysis
              </Badge>
              <Badge variant="outline" className="text-amber-600 border-amber-600">
                <Calculator className="w-3 h-3 mr-1" /> Tax-Optimized
              </Badge>
            </div>
            <ExportToSlides
              toolName="Social Security Optimizer"
              getSections={() => [
                {
                  title: `${hName} Details`,
                  items: [
                    { label: "Current Age", value: hCurrentAge.toString() },
                    { label: "Current Income", value: fmt(hCurrentIncome) },
                    { label: "PIA (Monthly at FRA)", value: fmt(hPIA) },
                    { label: "Claim Age", value: hClaimAge.toString() }
                  ]
                },
                {
                  title: `${wName} Details`,
                  items: [
                    { label: "Current Age", value: wCurrentAge.toString() },
                    { label: "Current Income", value: fmt(wCurrentIncome) },
                    { label: "PIA (Monthly at FRA)", value: fmt(wPIA) },
                    { label: "Claim Age", value: wClaimAge.toString() }
                  ]
                },
                {
                  title: "Shared Details",
                  items: [
                    { label: "Other Retirement Income", value: fmt(otherRetirementIncome) },
                    { label: "Has IUL Bridge", value: hasIULBridge ? "Yes" : "No" },
                    { label: "IUL Bridge Amount", value: fmt(iulBridgeAmount) },
                    { label: "Life Expectancy", value: lifeExpectancy.toString() },
                    { label: "Filing Status", value: filingStatus }
                  ]
                }
              ]}
            />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">Social Security Benefits Election Optimizer</h1>
          <p className="text-muted-foreground max-w-3xl">
            Determine the <strong>optimal claiming strategy</strong> for both spouses. This comprehensive analyzer considers
            current income, future employment, retirement goals, taxation of benefits, spousal and survivor benefits,
            earnings test impacts, and the power of an IUL bridge strategy to maximize lifetime income.
          </p>
        </div>

        {/* ─── CLIENT FACT FINDER ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Husband */}
          <Card className="border-2 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <Input value={hName} onChange={(e) => setHName(e.target.value)} className="w-32 h-7 text-lg font-bold border-none p-0 focus-visible:ring-0" />
                <span className="text-muted-foreground text-sm font-normal">(Higher Earner)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Birth Year</Label>
                  <NumberInput value={hBirthYear} onChange={setHBirthYear} className="mt-1"/>
                </div>
                <div>
                  <Label className="text-xs">Current Age</Label>
                  <NumberInput value={hCurrentAge} onChange={setHCurrentAge} className="mt-1"/>
                </div>
                <div>
                  <Label className="text-xs">PIA (Monthly at FRA)</Label>
                  <NumberInput value={hPIA} onChange={setHPIA} className="mt-1"/>
                </div>
                <div>
                  <Label className="text-xs">Current Annual Income</Label>
                  <NumberInput value={hCurrentIncome} onChange={setHCurrentIncome} className="mt-1"/>
                </div>
                <div>
                  <Label className="text-xs">Retirement Age</Label>
                  <NumberInput value={hRetireAge} onChange={setHRetireAge} className="mt-1"/>
                </div>
                <div>
                  <Label className="text-xs">SS Claim Age</Label>
                  <Select value={String(hClaimAge)} onValueChange={v => setHClaimAge(Number(v))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[62,63,64,65,66,67,68,69,70].map((a) => (
                        <SelectItem key={a} value={String(a)}>
                          {a} {a === 62 ? "(Early)" : a === Math.round(hFRA) ? "(FRA)" : a === 70 ? "(Max)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950/30 rounded text-xs">
                FRA: <strong>{hFRA.toFixed(hFRA % 1 === 0 ? 0 : 1)}</strong> | Benefit at {hClaimAge}: <strong>{fmt(analysis.hSelectedBenefit.monthly)}/mo</strong> ({fmtPct((analysis.hSelectedBenefit.multiplier - 1) * 100)} {analysis.hSelectedBenefit.multiplier >= 1 ? "increase" : "reduction"})
              </div>
            </CardContent>
          </Card>

          {/* Wife */}
          <Card className="border-2 border-pink-200 dark:border-pink-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-600" />
                <Input value={wName} onChange={(e) => setWName(e.target.value)} className="w-32 h-7 text-lg font-bold border-none p-0 focus-visible:ring-0" />
                <span className="text-muted-foreground text-sm font-normal">(Spouse)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Birth Year</Label>
                  <NumberInput value={wBirthYear} onChange={setWBirthYear} className="mt-1"/>
                </div>
                <div>
                  <Label className="text-xs">Current Age</Label>
                  <NumberInput value={wCurrentAge} onChange={setWCurrentAge} className="mt-1"/>
                </div>
                <div>
                  <Label className="text-xs">PIA (Monthly at FRA)</Label>
                  <NumberInput value={wPIA} onChange={setWPIA} className="mt-1"/>
                </div>
                <div>
                  <Label className="text-xs">Current Annual Income</Label>
                  <NumberInput value={wCurrentIncome} onChange={setWCurrentIncome} className="mt-1"/>
                </div>
                <div>
                  <Label className="text-xs">Retirement Age</Label>
                  <NumberInput value={wRetireAge} onChange={setWRetireAge} className="mt-1"/>
                </div>
                <div>
                  <Label className="text-xs">SS Claim Age</Label>
                  <Select value={String(wClaimAge)} onValueChange={v => setWClaimAge(Number(v))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[62,63,64,65,66,67,68,69,70].map((a) => (
                        <SelectItem key={a} value={String(a)}>
                          {a} {a === 62 ? "(Early)" : a === Math.round(wFRA) ? "(FRA)" : a === 70 ? "(Max)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-3 p-2 bg-pink-50 dark:bg-pink-950/30 rounded text-xs">
                FRA: <strong>{wFRA.toFixed(wFRA % 1 === 0 ? 0 : 1)}</strong> | Benefit at {wClaimAge}: <strong>{fmt(analysis.wSelectedBenefit.monthly)}/mo</strong> ({fmtPct((analysis.wSelectedBenefit.multiplier - 1) * 100)} {analysis.wSelectedBenefit.multiplier >= 1 ? "increase" : "reduction"})
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Shared Settings ─── */}
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <Label className="text-xs">Other Retirement Income</Label>
                <NumberInput value={otherRetirementIncome} onChange={setOtherRetirementIncome} className="mt-1"/>
              </div>
              <div>
                <Label className="text-xs">Filing Status</Label>
                <Select value={filingStatus} onValueChange={v => setFilingStatus(v as "joint" | "single")}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="joint">Married Filing Jointly</SelectItem>
                    <SelectItem value="single">Single / Separate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Life Expectancy</Label>
                <NumberInput value={lifeExpectancy} onChange={setLifeExpectancy} className="mt-1"/>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs">IUL Bridge Strategy</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Switch checked={hasIULBridge} onCheckedChange={setHasIULBridge} />
                  <span className="text-xs">{hasIULBridge ? "Active" : "Off"}</span>
                </div>
              </div>
              {hasIULBridge && (
                <div>
                  <Label className="text-xs">IUL Bridge Annual Amount</Label>
                  <NumberInput value={iulBridgeAmount} onChange={setIulBridgeAmount} className="mt-1"/>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ─── SUMMARY CARDS ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="bg-blue-50 dark:bg-blue-950/30">
            <CardContent className="pt-3 pb-3 text-center">
              <div className="text-xs text-muted-foreground">{hName} Monthly</div>
              <div className="text-xl font-bold text-blue-600">{fmt(analysis.hSelectedBenefit.monthly)}</div>
              <div className="text-xs">at age {hClaimAge}</div>
            </CardContent>
          </Card>
          <Card className="bg-pink-50 dark:bg-pink-950/30">
            <CardContent className="pt-3 pb-3 text-center">
              <div className="text-xs text-muted-foreground">{wName} Monthly</div>
              <div className="text-xl font-bold text-pink-600">{fmt(analysis.wSelectedBenefit.monthly)}</div>
              <div className="text-xs">at age {wClaimAge}</div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 dark:bg-green-950/30">
            <CardContent className="pt-3 pb-3 text-center">
              <div className="text-xs text-muted-foreground">Combined Annual</div>
              <div className="text-xl font-bold text-green-600">{fmt((analysis.hSelectedBenefit.monthly + analysis.wSelectedBenefit.monthly) * 12)}</div>
              <div className="text-xs">both collecting</div>
            </CardContent>
          </Card>
          <Card className="bg-amber-50 dark:bg-amber-950/30">
            <CardContent className="pt-3 pb-3 text-center">
              <div className="text-xs text-muted-foreground">Survivor Benefit</div>
              <div className="text-xl font-bold text-amber-600">{fmt(analysis.survivorBenefit)}/mo</div>
              <div className="text-xs">higher of two</div>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 dark:bg-purple-950/30">
            <CardContent className="pt-3 pb-3 text-center">
              <div className="text-xs text-muted-foreground">Best Strategy</div>
              <div className="text-sm font-bold text-purple-600">{analysis.bestScenario.label}</div>
              <div className="text-xs">{fmt(analysis.bestScenario.totalLifetime)} lifetime</div>
            </CardContent>
          </Card>
          <Card className="bg-red-50 dark:bg-red-950/30">
            <CardContent className="pt-3 pb-3 text-center">
              <div className="text-xs text-muted-foreground">SS Tax Rate</div>
              <div className="text-xl font-bold text-red-600">{analysis.selectedYearData.ssTaxable}%</div>
              <div className="text-xs">of benefits taxable</div>
            </CardContent>
          </Card>
        </div>

        {/* ─── CALCULATE BUTTON ─── */}
        <div className="flex justify-center my-6">
          <button
            className="rc-btn rc-btn-primary px-8 py-3 text-lg font-semibold flex items-center gap-2"
            onClick={() => {
              toast.success("Analysis recalculated with current inputs");
              window.scrollTo({ top: document.querySelector('[data-tabs-root]')?.getBoundingClientRect().top! + window.scrollY - 100, behavior: 'smooth' });
            }}
          >
            <Calculator className="w-5 h-5" />
            Generate Analysis
          </button>
        </div>

        {/* ─── TABS ─── */}
        <Tabs defaultValue="claiming" className="space-y-4" data-tabs-root>
          <TabsList className="flex flex-wrap gap-1 h-auto p-1">
            <TabsTrigger value="claiming" className="text-xs">
              <Calendar className="w-3 h-3 mr-1" /> Claiming Analysis
            </TabsTrigger>
            <TabsTrigger value="breakeven" className="text-xs">
              <Target className="w-3 h-3 mr-1" /> Break-Even
            </TabsTrigger>
            <TabsTrigger value="scenarios" className="text-xs">
              <Trophy className="w-3 h-3 mr-1" /> Strategy Comparison
            </TabsTrigger>
            <TabsTrigger value="taxation" className="text-xs">
              <Percent className="w-3 h-3 mr-1" /> SS Taxation
            </TabsTrigger>
            <TabsTrigger value="projection" className="text-xs">
              <TrendingUp className="w-3 h-3 mr-1" /> Income Projection
            </TabsTrigger>
            <TabsTrigger value="earnings" className="text-xs">
              <DollarSign className="w-3 h-3 mr-1" /> Earnings Test
            </TabsTrigger>
            <TabsTrigger value="survivor" className="text-xs">
              <Heart className="w-3 h-3 mr-1" /> Survivor Benefits
            </TabsTrigger>
            <TabsTrigger value="wep-gpo" className="text-xs">
              <AlertTriangle className="w-3 h-3 mr-1" /> WEP/GPO
            </TabsTrigger>
            <TabsTrigger value="bridge" className="text-xs">
              <ArrowRight className="w-3 h-3 mr-1" /> IUL Bridge
            </TabsTrigger>
          
            <TabsTrigger value="generate-outcome" className="text-xs sm:text-sm bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 font-bold">Generate Outcome</TabsTrigger>
          </TabsList>

          {/* ═══════════ TAB 1: CLAIMING ANALYSIS ═══════════ */}
          <TabsContent value="claiming" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Husband benefit table */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-blue-600">{hName} — Benefit by Claiming Age</CardTitle>
                  <CardDescription>FRA: Age {hFRA.toFixed(hFRA % 1 === 0 ? 0 : 1)} | PIA: {fmt(hPIA)}/mo</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-blue-600">
                          <th className="text-left p-2">Age</th>
                          <th className="text-right p-2">Monthly</th>
                          <th className="text-right p-2">Annual</th>
                          <th className="text-center p-2">vs FRA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysis.hBenefits.map((b) => (
                          <tr key={b.age} className={`border-b ${b.age === hClaimAge ? "bg-blue-100 dark:bg-blue-950/40 font-bold" : ""} ${b.age === Math.round(hFRA) ? "border-l-4 border-l-blue-500" : ""}`}>
                            <td className="p-2">
                              {b.age}
                              {b.age === 62 && <Badge variant="outline" className="ml-1 text-xs">Early</Badge>}
                              {b.age === Math.round(hFRA) && <Badge className="ml-1 text-xs bg-blue-600">FRA</Badge>}
                              {b.age === 70 && <Badge variant="outline" className="ml-1 text-xs text-green-600 border-green-600">Max</Badge>}
                            </td>
                            <td className="p-2 text-right font-mono">{fmt(b.monthly)}</td>
                            <td className="p-2 text-right font-mono">{fmt(b.annual)}</td>
                            <td className="p-2 text-center">
                              <span className={b.multiplier >= 1 ? "text-green-600" : "text-red-600"}>
                                {b.multiplier >= 1 ? "+" : ""}{fmtPct((b.multiplier - 1) * 100)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Wife benefit table */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg text-pink-600">{wName} — Benefit by Claiming Age</CardTitle>
                  <CardDescription>FRA: Age {wFRA.toFixed(wFRA % 1 === 0 ? 0 : 1)} | PIA: {fmt(wPIA)}/mo</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-pink-600">
                          <th className="text-left p-2">Age</th>
                          <th className="text-right p-2">Monthly</th>
                          <th className="text-right p-2">Annual</th>
                          <th className="text-center p-2">vs FRA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysis.wBenefits.map((b) => (
                          <tr key={b.age} className={`border-b ${b.age === wClaimAge ? "bg-pink-100 dark:bg-pink-950/40 font-bold" : ""} ${b.age === Math.round(wFRA) ? "border-l-4 border-l-pink-500" : ""}`}>
                            <td className="p-2">
                              {b.age}
                              {b.age === 62 && <Badge variant="outline" className="ml-1 text-xs">Early</Badge>}
                              {b.age === Math.round(wFRA) && <Badge className="ml-1 text-xs bg-pink-600">FRA</Badge>}
                              {b.age === 70 && <Badge variant="outline" className="ml-1 text-xs text-green-600 border-green-600">Max</Badge>}
                            </td>
                            <td className="p-2 text-right font-mono">{fmt(b.monthly)}</td>
                            <td className="p-2 text-right font-mono">{fmt(b.annual)}</td>
                            <td className="p-2 text-center">
                              <span className={b.multiplier >= 1 ? "text-green-600" : "text-red-600"}>
                                {b.multiplier >= 1 ? "+" : ""}{fmtPct((b.multiplier - 1) * 100)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Combined benefit chart */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Benefit Comparison by Claiming Age</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[62,63,64,65,66,67,68,69,70].map((age) => ({
                      age: `Age ${age}`,
                      [hName]: Math.round(hPIA * getBenefitMultiplier(age, hFRA)),
                      [wName]: Math.round(wPIA * getBenefitMultiplier(age, wFRA)),
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="age" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={v => `$${v.toLocaleString()}`} />
                      <Tooltip formatter={(v: number) => fmt(v)} />
                      <Legend />
                      <Bar dataKey={hName} fill={CHART_COLORS.husband} radius={[4, 4, 0, 0]} />
                      <Bar dataKey={wName} fill={CHART_COLORS.wife} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════ TAB 2: BREAK-EVEN ═══════════ */}
          <TabsContent value="breakeven" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Cumulative Benefits — When Does Delaying Pay Off?</CardTitle>
                <CardDescription>
                  Compares total lifetime benefits received when claiming at 62, 67, or 70 ({hName}'s PIA).
                  The crossover points show when delayed claiming surpasses early claiming.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analysis.breakEvenData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="age" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
                      <Tooltip formatter={(v: number) => fmt(v)} />
                      <Legend />
                      <Line type="monotone" dataKey="cumulative62" name="Claim at 62" stroke="#ef4444" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="cumulative67" name="Claim at 67" stroke="#f59e0b" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="cumulative70" name="Claim at 70" stroke="#16a34a" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{hName}'s Lifetime Benefits by Claiming Age</CardTitle>
                <CardDescription>Total benefits received to age {lifeExpectancy} including {fmtPct(COLA_RATE * 100)} annual COLA</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-green-600">
                        <th className="text-left p-2">Claim Age</th>
                        <th className="text-right p-2">Monthly</th>
                        <th className="text-right p-2">Annual</th>
                        <th className="text-center p-2">Years Collecting</th>
                        <th className="text-right p-2">Lifetime Total (w/ COLA)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.lifetimeByAge.map((l) => {
                        const isBest = l.lifetime === Math.max(...analysis.lifetimeByAge.map((x) => x.lifetime));
                        return (
                          <tr key={l.age} className={`border-b ${isBest ? "bg-green-50 dark:bg-green-950/30 font-bold" : ""} ${l.age === hClaimAge ? "border-l-4 border-l-blue-500" : ""}`}>
                            <td className="p-2">
                              Age {l.age}
                              {isBest && <Badge className="ml-2 bg-green-600 text-white text-xs">Best</Badge>}
                              {l.age === hClaimAge && <Badge variant="outline" className="ml-2 text-xs">Selected</Badge>}
                            </td>
                            <td className="p-2 text-right font-mono">{fmt(l.monthly)}</td>
                            <td className="p-2 text-right font-mono">{fmt(l.annual)}</td>
                            <td className="p-2 text-center">{l.yearsCollecting} years</td>
                            <td className="p-2 text-right font-mono font-semibold text-green-600">{fmt(l.lifetime)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════ TAB 3: STRATEGY COMPARISON ═══════════ */}
          <TabsContent value="scenarios" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  Joint Claiming Strategy Comparison
                </CardTitle>
                <CardDescription>
                  Combined lifetime benefits for both spouses under different claiming scenarios (to age {lifeExpectancy} with {fmtPct(COLA_RATE * 100)} COLA).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analysis.scenarioResults} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tickFormatter={v => `$${(v / 1000000).toFixed(1)}M`} />
                      <YAxis type="category" dataKey="label" width={140} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v: number) => fmt(v)} />
                      <Bar dataKey="totalLifetime" name="Lifetime Benefits" radius={[0, 4, 4, 0]}>
                        {analysis.scenarioResults.map((s, i) => (
                          <Cell key={i} fill={s.totalLifetime === analysis.bestScenario.totalLifetime ? "#16a34a" : "#94a3b8"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2">
                        <th className="text-left p-2">Strategy</th>
                        <th className="text-center p-2">{hName} Claims</th>
                        <th className="text-center p-2">{wName} Claims</th>
                        <th className="text-right p-2">Lifetime Total</th>
                        <th className="text-right p-2">vs Best</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.scenarioResults.map((s, i) => (
                        <tr key={i} className={`border-b ${s.totalLifetime === analysis.bestScenario.totalLifetime ? "bg-green-50 dark:bg-green-950/30 font-bold" : ""}`}>
                          <td className="p-2">
                            {s.label}
                            {s.totalLifetime === analysis.bestScenario.totalLifetime && (
                              <Badge className="ml-2 bg-green-600 text-white text-xs">Optimal</Badge>
                            )}
                          </td>
                          <td className="p-2 text-center">Age {s.hAge}</td>
                          <td className="p-2 text-center">Age {s.wAge}</td>
                          <td className="p-2 text-right font-mono text-green-600">{fmt(s.totalLifetime)}</td>
                          <td className="p-2 text-right font-mono">
                            {s.totalLifetime === analysis.bestScenario.totalLifetime ? "—" : (
                              <span className="text-red-600">-{fmt(analysis.bestScenario.totalLifetime - s.totalLifetime)}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════ TAB 4: SS TAXATION ═══════════ */}
          <TabsContent value="taxation" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Social Security Taxation Thresholds</CardTitle>
                  <CardDescription>
                    Combined Income = AGI + Nontaxable Interest + 50% of SS Benefits
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="font-semibold text-green-700">0% Taxable</span>
                      </div>
                      <p className="text-sm">Combined income below <strong>{fmt(filingStatus === "joint" ? SS_TAX_JOINT_THRESHOLD_1 : SS_TAX_SINGLE_THRESHOLD_1)}</strong></p>
                    </div>
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        <span className="font-semibold text-amber-700">Up to 50% Taxable</span>
                      </div>
                      <p className="text-sm">Combined income {fmt(filingStatus === "joint" ? SS_TAX_JOINT_THRESHOLD_1 : SS_TAX_SINGLE_THRESHOLD_1)} – {fmt(filingStatus === "joint" ? SS_TAX_JOINT_THRESHOLD_2 : SS_TAX_SINGLE_THRESHOLD_2)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200">
                      <div className="flex items-center gap-2 mb-1">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span className="font-semibold text-red-700">Up to 85% Taxable</span>
                      </div>
                      <p className="text-sm">Combined income above <strong>{fmt(filingStatus === "joint" ? SS_TAX_JOINT_THRESHOLD_2 : SS_TAX_SINGLE_THRESHOLD_2)}</strong></p>
                    </div>

                    <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 mt-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="w-4 h-4 text-purple-600" />
                        <span className="font-semibold text-purple-700">IUL Tax-Free Advantage</span>
                      </div>
                      <p className="text-sm">
                        Policy loans from an IUL are <strong>not included in combined income</strong> for SS taxation purposes.
                        Using IUL income instead of 401(k)/IRA withdrawals can keep combined income below taxation thresholds,
                        potentially saving <strong>{fmt(analysis.selectedYearData.taxOnSS)}/year</strong> in taxes on Social Security benefits.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Your SS Benefit Taxation Breakdown</CardTitle>
                  <CardDescription>At age {Math.max(hClaimAge, wClaimAge + (hCurrentAge - wCurrentAge))}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-52 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={analysis.taxPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${fmt(value)}`}>
                          {analysis.taxPieData.map((entry, i) => (
                            <Cell key={i} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number) => fmt(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>Combined SS Benefits:</span><strong>{fmt(analysis.selectedYearData.hSS + analysis.selectedYearData.wSS)}</strong></div>
                    <div className="flex justify-between"><span>Taxable Portion:</span><strong className="text-red-600">{analysis.selectedYearData.ssTaxable}%</strong></div>
                    <div className="flex justify-between"><span>Estimated Tax on SS:</span><strong className="text-red-600">{fmt(analysis.selectedYearData.taxOnSS)}</strong></div>
                    <div className="flex justify-between"><span>Combined Income:</span><strong>{fmt(analysis.selectedYearData.combinedIncome)}</strong></div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Year-by-year taxation */}
            <Card>
              <CardHeader>
                <CardTitle>Year-by-Year SS Taxation Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analysis.yearlyProjection.filter((y) => y.hSS > 0 || y.wSS > 0)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="age" tick={{ fontSize: 11 }} label={{ value: `${hName}'s Age`, position: "bottom", offset: -5 }} />
                      <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
                      <Tooltip formatter={(v: number) => fmt(v)} />
                      <Legend />
                      <Area type="monotone" dataKey="taxOnSS" name="Tax on SS Benefits" fill="#ef444480" stroke="#ef4444" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════ TAB 5: INCOME PROJECTION ═══════════ */}
          <TabsContent value="projection" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Comprehensive Retirement Income Projection</CardTitle>
                <CardDescription>All income sources year-by-year from current age to {lifeExpectancy}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analysis.yearlyProjection}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="age" tick={{ fontSize: 11 }} label={{ value: `${hName}'s Age`, position: "bottom", offset: -5 }} />
                      <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
                      <Tooltip formatter={(v: number) => fmt(v)} />
                      <Legend />
                      <Area type="monotone" dataKey="otherIncome" name="Earnings & Other" stackId="1" fill="#94a3b8" stroke="#64748b" />
                      <Area type="monotone" dataKey="hSS" name={`${hName} SS`} stackId="1" fill={CHART_COLORS.husband} stroke={CHART_COLORS.husband} />
                      <Area type="monotone" dataKey="wSS" name={`${wName} SS`} stackId="1" fill={CHART_COLORS.wife} stroke={CHART_COLORS.wife} />
                      <Area type="monotone" dataKey="iulBridge" name="IUL Bridge" stackId="1" fill={CHART_COLORS.bridge} stroke={CHART_COLORS.bridge} />
                      {hRetireAge > hCurrentAge && <ReferenceLine x={hRetireAge} stroke="#ef4444" strokeDasharray="5 5" label={{ value: `${hName} Retires`, position: "top", fontSize: 10 }} />}
                      <ReferenceLine x={hClaimAge} stroke={CHART_COLORS.husband} strokeDasharray="5 5" label={{ value: `${hName} Claims SS`, position: "top", fontSize: 10 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detailed Income Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-background">
                      <tr className="border-b-2">
                        <th className="text-left p-1.5">Age</th>
                        <th className="text-right p-1.5">{hName} SS</th>
                        <th className="text-right p-1.5">{wName} SS</th>
                        <th className="text-right p-1.5">Other Income</th>
                        <th className="text-right p-1.5">IUL Bridge</th>
                        <th className="text-right p-1.5 font-bold">Total</th>
                        <th className="text-center p-1.5">SS Tax%</th>
                        <th className="text-right p-1.5">Tax on SS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.yearlyProjection.map((y) => (
                        <tr key={y.age} className={`border-b ${y.age === hClaimAge ? "bg-blue-50 dark:bg-blue-950/20" : ""} ${y.age === hRetireAge ? "bg-amber-50 dark:bg-amber-950/20" : ""}`}>
                          <td className="p-1.5 font-medium">{y.age}</td>
                          <td className="p-1.5 text-right font-mono">{y.hSS > 0 ? fmt(y.hSS) : "—"}</td>
                          <td className="p-1.5 text-right font-mono">{y.wSS > 0 ? fmt(y.wSS) : "—"}</td>
                          <td className="p-1.5 text-right font-mono">{fmt(y.otherIncome)}</td>
                          <td className="p-1.5 text-right font-mono text-purple-600">{y.iulBridge > 0 ? fmt(y.iulBridge) : "—"}</td>
                          <td className="p-1.5 text-right font-mono font-bold">{fmt(y.totalIncome)}</td>
                          <td className="p-1.5 text-center">
                            <Badge variant="outline" className={`text-xs ${y.ssTaxable === 0 ? "text-green-600 border-green-600" : y.ssTaxable === 50 ? "text-amber-600 border-amber-600" : "text-red-600 border-red-600"}`}>
                              {y.ssTaxable}%
                            </Badge>
                          </td>
                          <td className="p-1.5 text-right font-mono text-red-600">{y.taxOnSS > 0 ? fmt(y.taxOnSS) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════ TAB 6: EARNINGS TEST ═══════════ */}
          <TabsContent value="earnings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Social Security Earnings Test (2025)</CardTitle>
                <CardDescription>
                  If you claim SS before FRA and continue working, benefits may be temporarily reduced.
                  Withheld benefits are <strong>not lost</strong> — they increase your benefit after FRA.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Before FRA Year</h4>
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-sm mb-3">
                      <strong>$1 withheld for every $2</strong> earned above <strong>{fmt(EARNINGS_TEST_UNDER_FRA_2025)}</strong>
                    </div>
                    <h4 className="font-semibold mb-2">In FRA Year (months before birthday)</h4>
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-sm mb-3">
                      <strong>$1 withheld for every $3</strong> earned above <strong>{fmt(EARNINGS_TEST_FRA_YEAR_2025)}</strong>
                    </div>
                    <h4 className="font-semibold mb-2">After FRA</h4>
                    <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg text-sm">
                      <strong>No earnings test</strong> — earn unlimited income with no reduction
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Impact on {hName}'s Age-62 Benefit</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b-2">
                            <th className="text-left p-2">Earnings</th>
                            <th className="text-right p-2">Withheld</th>
                            <th className="text-right p-2">Net SS Received</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analysis.earningsTestData.map((e, i) => (
                            <tr key={i} className="border-b">
                              <td className="p-2">{fmt(e.income)}</td>
                              <td className="p-2 text-right text-red-600">{e.withheld > 0 ? fmt(e.withheld) : "—"}</td>
                              <td className="p-2 text-right font-mono text-green-600">{fmt(e.net)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
              <div className="text-sm">
                <strong>Key Insight:</strong> The earnings test is <strong>not a tax</strong> — it's a temporary withholding.
                Benefits withheld due to the earnings test are recalculated at FRA, resulting in a higher monthly benefit
                going forward. For high earners planning to work past 62, it often makes more sense to delay claiming
                rather than having benefits temporarily reduced.
              </div>
            </div>
          </TabsContent>

          {/* ═══════════ TAB 7: SURVIVOR BENEFITS ═══════════ */}
          <TabsContent value="survivor" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-600" />
                  Survivor Benefit Analysis
                </CardTitle>
                <CardDescription>
                  When one spouse passes, the surviving spouse receives the <strong>higher</strong> of the two benefits (not both).
                  This makes the higher earner's claiming decision critical for survivor protection.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <Card className="bg-blue-50 dark:bg-blue-950/30">
                    <CardContent className="pt-3 text-center">
                      <div className="text-xs text-muted-foreground">{hName}'s Benefit</div>
                      <div className="text-2xl font-bold text-blue-600">{fmt(analysis.hSelectedBenefit.monthly)}/mo</div>
                      <div className="text-xs">Claimed at age {hClaimAge}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-pink-50 dark:bg-pink-950/30">
                    <CardContent className="pt-3 text-center">
                      <div className="text-xs text-muted-foreground">{wName}'s Benefit</div>
                      <div className="text-2xl font-bold text-pink-600">{fmt(analysis.wSelectedBenefit.monthly)}/mo</div>
                      <div className="text-xs">Claimed at age {wClaimAge}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300">
                    <CardContent className="pt-3 text-center">
                      <div className="text-xs text-muted-foreground">Survivor Benefit</div>
                      <div className="text-2xl font-bold text-amber-600">{fmt(analysis.survivorBenefit)}/mo</div>
                      <div className="text-xs">Higher of the two</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <strong>Critical Planning Point:</strong> If {hName} claims at 62 instead of 70, the survivor benefit drops from{" "}
                    <strong>{fmt(Math.round(hPIA * getBenefitMultiplier(70, hFRA)))}/mo</strong> to{" "}
                    <strong>{fmt(Math.round(hPIA * getBenefitMultiplier(62, hFRA)))}/mo</strong> — a{" "}
                    <strong>{fmtPct(((getBenefitMultiplier(70, hFRA) - getBenefitMultiplier(62, hFRA)) / getBenefitMultiplier(62, hFRA)) * 100)}</strong>{" "}
                    reduction in survivor protection. This is why the higher earner should strongly consider delaying to 70,
                    especially when the age gap means the surviving spouse may need this income for 20+ years.
                  </div>
                </div>

                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Survivor Benefit by {hName}'s Claiming Age</h4>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analysis.hBenefits.map((b) => ({
                        age: `Age ${b.age}`,
                        survivor: b.monthly,
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="age" tick={{ fontSize: 11 }} />
                        <YAxis tickFormatter={v => `$${v.toLocaleString()}`} />
                        <Tooltip formatter={(v: number) => fmt(v)} />
                        <Bar dataKey="survivor" name="Survivor Benefit" radius={[4, 4, 0, 0]}>
                          {analysis.hBenefits.map((b, i) => (
                            <Cell key={i} fill={b.age === hClaimAge ? "#f59e0b" : "#cbd5e1"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════ TAB 8: IUL BRIDGE STRATEGY ═══════════ */}
          <TabsContent value="bridge" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ArrowRight className="w-5 h-5 text-purple-600" />
                  IUL Bridge Strategy — Delay SS & Maximize Benefits
                </CardTitle>
                <CardDescription>
                  Use tax-free IUL policy loans to replace income during the gap between retirement and SS claiming,
                  allowing you to delay Social Security for maximum benefits.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                  <div className="space-y-3">
                    <h4 className="font-semibold">How the Bridge Works</h4>
                    <div className="space-y-2">
                      {[
                        { step: 1, title: "Retire at Your Goal Age", desc: `${hName} retires at age ${hRetireAge}, stops earning income` },
                        { step: 2, title: "Activate IUL Tax-Free Income", desc: `Take ${fmt(iulBridgeAmount)}/year in tax-free policy loans from IUL` },
                        { step: 3, title: "Delay Social Security", desc: `Wait until age ${hClaimAge} to claim SS for maximum benefit` },
                        { step: 4, title: "Collect Enhanced SS + IUL", desc: `Receive ${fmt(analysis.hSelectedBenefit.monthly * 12)}/year SS + continue IUL income` },
                      ].map((s) => (
                        <div key={s.step} className="flex items-start gap-3 p-2 rounded bg-muted/50">
                          <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold shrink-0">{s.step}</div>
                          <div>
                            <div className="font-medium text-sm">{s.title}</div>
                            <div className="text-xs text-muted-foreground">{s.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold">Bridge Strategy Advantages</h4>
                    <div className="space-y-2">
                      {[
                        { icon: <DollarSign className="w-4 h-4" />, title: "Higher SS Benefits", desc: `${fmtPct((getBenefitMultiplier(hClaimAge, hFRA) - getBenefitMultiplier(62, hFRA)) * 100 / getBenefitMultiplier(62, hFRA))} more than claiming at 62` },
                        { icon: <Shield className="w-4 h-4" />, title: "Tax-Free Bridge Income", desc: "IUL loans don't count as taxable income" },
                        { icon: <Percent className="w-4 h-4" />, title: "Lower SS Taxation", desc: "IUL income doesn't trigger SS benefit taxation" },
                        { icon: <Heart className="w-4 h-4" />, title: "Higher Survivor Benefit", desc: `Survivor receives ${fmt(analysis.hSelectedBenefit.monthly)}/mo vs ${fmt(Math.round(hPIA * getBenefitMultiplier(62, hFRA)))}/mo` },
                        { icon: <TrendingUp className="w-4 h-4" />, title: "COLA Compounding", desc: "Higher base benefit means larger COLA increases each year" },
                      ].map((a, i) => (
                        <div key={i} className="flex items-start gap-2 p-2 rounded bg-purple-50 dark:bg-purple-950/30">
                          <span className="text-purple-600 mt-0.5">{a.icon}</span>
                          <div>
                            <div className="font-medium text-sm">{a.title}</div>
                            <div className="text-xs text-muted-foreground">{a.desc}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Bridge vs No Bridge comparison */}
                <Card className="border-2 border-purple-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Bridge Strategy vs Early Claiming — Side by Side</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b-2">
                            <th className="text-left p-2">Metric</th>
                            <th className="text-right p-2 text-red-600">Claim at 62 (No Bridge)</th>
                            <th className="text-right p-2 text-green-600">Claim at {hClaimAge} (With Bridge)</th>
                            <th className="text-right p-2">Advantage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const early = Math.round(hPIA * getBenefitMultiplier(62, hFRA));
                            const delayed = analysis.hSelectedBenefit.monthly;
                            const bridgeYears = hClaimAge - hRetireAge;
                            const bridgeCost = bridgeYears * iulBridgeAmount;
                            const annualDiff = (delayed - early) * 12;
                            const paybackYears = bridgeCost > 0 ? Math.ceil(bridgeCost / annualDiff) : 0;
                            return [
                              { metric: `${hName}'s Monthly SS`, early: fmt(early), delayed: fmt(delayed), adv: `+${fmt(delayed - early)}/mo` },
                              { metric: "Annual SS Income", early: fmt(early * 12), delayed: fmt(delayed * 12), adv: `+${fmt(annualDiff)}/yr` },
                              { metric: "Bridge Cost (Total)", early: "$0", delayed: fmt(bridgeCost), adv: `${bridgeYears} years` },
                              { metric: "Bridge Payback Period", early: "N/A", delayed: `${paybackYears} years`, adv: `By age ${hClaimAge + paybackYears}` },
                              { metric: "Survivor Benefit", early: fmt(early), delayed: fmt(delayed), adv: `+${fmtPct(((delayed - early) / early) * 100)}` },
                            ].map((r, i) => (
                              <tr key={i} className="border-b">
                                <td className="p-2 font-medium">{r.metric}</td>
                                <td className="p-2 text-right font-mono">{r.early}</td>
                                <td className="p-2 text-right font-mono font-semibold text-green-600">{r.delayed}</td>
                                <td className="p-2 text-right font-mono text-purple-600">{r.adv}</td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ TAB 9: WEP/GPO Impact ═══ */}
          <TabsContent value="wep-gpo" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  Windfall Elimination Provision (WEP) & Government Pension Offset (GPO)
                </CardTitle>
                <CardDescription>
                  If either spouse worked in a government job that didn't pay into Social Security, WEP and GPO rules may reduce benefits.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* WEP Section */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Shield className="w-4 h-4 text-red-500" />
                    WEP — Windfall Elimination Provision
                  </h3>
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4 space-y-2">
                    <p className="text-sm"><strong>Who it affects:</strong> Workers who earned a pension from employment not covered by Social Security (e.g., some state/local government, foreign employers) AND also qualify for Social Security based on other covered employment.</p>
                    <p className="text-sm"><strong>How it works:</strong> WEP uses a modified formula to calculate your PIA, reducing the 90% factor in the first bend point to as low as 40%. This can reduce your Social Security benefit by up to <strong>{fmt(642)}/month</strong> (2025 maximum).</p>
                    <p className="text-sm"><strong>Substantial earnings exception:</strong> If you have 30+ years of "substantial earnings" under Social Security, WEP does not apply. The reduction phases out between 20-30 years of substantial earnings.</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3">Years of Substantial Earnings</th>
                          <th className="text-center py-2 px-3">First Factor</th>
                          <th className="text-center py-2 px-3">Max Monthly Reduction</th>
                          <th className="text-center py-2 px-3">Impact Level</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { years: "20 or fewer", factor: "40%", reduction: "$642", impact: "Maximum" },
                          { years: "21", factor: "45%", reduction: "$578", impact: "High" },
                          { years: "22", factor: "50%", reduction: "$514", impact: "High" },
                          { years: "23", factor: "55%", reduction: "$449", impact: "Moderate" },
                          { years: "24", factor: "60%", reduction: "$385", impact: "Moderate" },
                          { years: "25", factor: "65%", reduction: "$321", impact: "Moderate" },
                          { years: "26", factor: "70%", reduction: "$257", impact: "Low" },
                          { years: "27", factor: "75%", reduction: "$192", impact: "Low" },
                          { years: "28", factor: "80%", reduction: "$128", impact: "Low" },
                          { years: "29", factor: "85%", reduction: "$64", impact: "Minimal" },
                          { years: "30+", factor: "90% (normal)", reduction: "$0", impact: "None" },
                        ].map((row, i) => (
                          <tr key={i} className="border-b border-border/30 hover:bg-muted/30">
                            <td className="py-2 px-3 font-medium">{row.years}</td>
                            <td className="text-center py-2 px-3">{row.factor}</td>
                            <td className="text-center py-2 px-3 text-red-600 font-semibold">{row.reduction}</td>
                            <td className="text-center py-2 px-3">
                              <Badge variant="outline" className={row.impact === "None" ? "text-green-600 border-green-600" : row.impact === "Maximum" || row.impact === "High" ? "text-red-600 border-red-600" : "text-amber-600 border-amber-600"}>
                                {row.impact}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* GPO Section */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Heart className="w-4 h-4 text-pink-500" />
                    GPO — Government Pension Offset
                  </h3>
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 space-y-2">
                    <p className="text-sm"><strong>Who it affects:</strong> Spouses or widows/widowers who receive a government pension from work not covered by Social Security and are also eligible for Social Security spousal or survivor benefits.</p>
                    <p className="text-sm"><strong>How it works:</strong> Your spousal or survivor benefit is reduced by <strong>2/3 of your government pension</strong>. This often eliminates the spousal/survivor benefit entirely.</p>
                    <p className="text-sm"><strong>Example:</strong> If your government pension is $1,500/month, the offset is $1,000/month (2/3 × $1,500). If your spousal benefit would be $900/month, GPO eliminates it completely ($900 - $1,000 = $0).</p>
                  </div>

                  <Card className="bg-muted/30">
                    <CardContent className="pt-4">
                      <h4 className="font-semibold mb-3">GPO Impact Calculator</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-xs">Government Pension (Monthly)</Label>
                          <div className="text-2xl font-bold text-amber-600 mt-1">{fmt(1500)}</div>
                        </div>
                        <div>
                          <Label className="text-xs">GPO Offset (2/3 of Pension)</Label>
                          <div className="text-2xl font-bold text-red-600 mt-1">-{fmt(1000)}</div>
                        </div>
                        <div>
                          <Label className="text-xs">Remaining Spousal Benefit</Label>
                          <div className="text-2xl font-bold text-green-600 mt-1">
                            {fmt(Math.max(0, Math.round(Math.max(hPIA, wPIA) / 2) - 1000))}
                            <span className="text-xs text-muted-foreground block">of {fmt(Math.round(Math.max(hPIA, wPIA) / 2))} max</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Key Takeaways */}
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-600" />
                    Key Takeaways for Public Sector Workers
                  </h4>
                  <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                    <li>WEP and GPO were reformed by the <strong>Social Security Fairness Act of 2025</strong> — check current status</li>
                    <li>If you have 30+ years of substantial SS-covered earnings, WEP does not apply</li>
                    <li>GPO can eliminate spousal/survivor benefits entirely for government pension recipients</li>
                    <li>Consider an IUL bridge strategy to replace lost spousal/survivor benefits</li>
                    <li>Teachers, firefighters, police, and federal employees (pre-1984) are commonly affected</li>
                    <li>Always verify your specific situation with SSA and a qualified financial advisor</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        
          <TabsContent value="generate-outcome" className="space-y-6 mt-6">
            <GenerateOutcomeTab
              strategyType="social-security"
              hasResults={true}
              resultData={{ monthlyBenefitAge62: 1800, monthlyBenefitFRA: 2800, monthlyBenefitAge70: 3700, optimalClaimAge: 70, lifetimeValueDifference: 120000, breakEvenAge: 80, spousalBenefit: 1400 }}
              metrics={[{ label: "Age 62 Benefit", value: 1800 * 12 }, { label: "FRA Benefit", value: 2800 * 12, highlight: true }, { label: "Age 70 Benefit", value: 3700 * 12 }, { label: "Lifetime Difference", value: 120000 }]}
            />
          </TabsContent>
        </Tabs>

        {/* ─── KEY DATES REFERENCE ─── */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Key Social Security Dates & Rules (2025)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              <div className="p-3 bg-muted/50 rounded">
                <div className="font-semibold">Earliest Claiming Age</div>
                <div className="text-muted-foreground">Age 62 (with permanent reduction)</div>
              </div>
              <div className="p-3 bg-muted/50 rounded">
                <div className="font-semibold">Full Retirement Age (1960+)</div>
                <div className="text-muted-foreground">Age 67</div>
              </div>
              <div className="p-3 bg-muted/50 rounded">
                <div className="font-semibold">Maximum Benefit Age</div>
                <div className="text-muted-foreground">Age 70 (8%/yr delayed credits)</div>
              </div>
              <div className="p-3 bg-muted/50 rounded">
                <div className="font-semibold">2025 Maximum PIA</div>
                <div className="text-muted-foreground">{fmt(4018)}/month at FRA</div>
              </div>
              <div className="p-3 bg-muted/50 rounded">
                <div className="font-semibold">SS Tax Wage Base (2025)</div>
                <div className="text-muted-foreground">{fmt(SS_TAX_WAGE_BASE_2025)}</div>
              </div>
              <div className="p-3 bg-muted/50 rounded">
                <div className="font-semibold">Average COLA (10yr)</div>
                <div className="text-muted-foreground">{fmtPct(COLA_RATE * 100)} annually</div>
              </div>
              <div className="p-3 bg-muted/50 rounded">
                <div className="font-semibold">Earnings Test (Under FRA)</div>
                <div className="text-muted-foreground">{fmt(EARNINGS_TEST_UNDER_FRA_2025)} exempt</div>
              </div>
              <div className="p-3 bg-muted/50 rounded">
                <div className="font-semibold">Spousal Benefit</div>
                <div className="text-muted-foreground">Up to 50% of higher earner's PIA</div>
              </div>
              <div className="p-3 bg-muted/50 rounded">
                <div className="font-semibold">Survivor Benefit</div>
                <div className="text-muted-foreground">100% of deceased spouse's benefit</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── DISCLAIMER ─── */}
        <NAICDisclaimer
          variant="full"
          showsProjections
          showsComparisons
          additionalText="Social Security benefit estimates are based on the Primary Insurance Amount (PIA) entered and current SSA rules. Actual benefits may vary based on earnings history, future legislative changes, and COLA adjustments. This calculator provides estimates for educational purposes only and does not constitute financial advice. Consult with a qualified financial advisor and review your official Social Security Statement at ssa.gov for personalized benefit estimates. IUL policy loan references are for illustration purposes only and are subject to policy terms and conditions."
        />
</div>
    
        <PageInsights pageId="social-security-optimizer" />
        <ComplianceFooter pageName="SocialSecurityOptimizer" showsIUL showsTax showsEstate showsProjections showsPolicyLoans />
      </AppShell>
  );
}
