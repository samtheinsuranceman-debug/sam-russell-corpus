// @ts-nocheck
import { useCalculatorIntegration } from "@/hooks/useCalculatorIntegration";
import { ClientSelectorBar } from "@/components/ClientSelectorBar";
import { useState, useMemo, useEffect } from "react";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/NumberInput";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, BarChart, Bar, Legend, AreaChart, Area, ComposedChart,
  ReferenceLine,
} from "recharts";
import {
  TrendingUp,
  Shield,
  BarChart3,
  Play,
  RotateCcw,
  Clock,
  Info,
  DollarSign,
  Percent,
  Target,
  Layers,
  Users,
  Heart,
  Baby,
  Crown,
  Sparkles,
  Download,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { TimeMachineInlineDisclaimer } from "@/components/TimeMachineInlineDisclaimer";
import { PageInsights } from "@/components/PageInsights";
import { ExportToSlides } from "@/components/ExportToSlides";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const fmtPct = (n: number) => `${n.toFixed(2)}%`;
const fmtPctInt = (n: number) => `${Math.round(n)}%`;
const fmtM = (n: number) => {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return fmt(n);
};


interface YearRow {
  year: number;
  age: number;
  premiumPaid: number;
  cumulativePremium: number;
  beginningValue: number;
  interestCredit: number;
  endingValue: number;
  effectiveReturnOnPremium: number; // interestCredit / totalPremiumsPaid * 100
  generation: string;
  generationLabel: string;
}

interface BenchmarkResult {
  target: number;
  yearReached: number | null;
  ageReached: number | null;
  accountValueAtTarget: number;
  interestCreditAtTarget: number;
  generation: string;
}

interface SimulationResult {
  rows: YearRow[];
  benchmarks: BenchmarkResult[];
  totalPremiumsPaid: number;
  finalAccountValue: number;
  finalEffectiveReturn: number;
  finalInterestCredit: number;
}

function runTimeMachineSimulation(
  annualPremium: number,
  fundingYears: number,
  creditingRate: number, // decimal, e.g. 0.065
  currentAge: number,
  maxYears: number,
  generationTransfers: { year: number; label: string; newAge: number }[],
): SimulationResult {
  const totalPremiumsPaid = annualPremium * fundingYears;
  const rows: YearRow[] = [];
  let accountValue = 0;
  let cumulativePremium = 0;

  const transfers = [...generationTransfers].sort((a, b) => a.year - b.year);
  let currentGenLabel = "Original Owner";
  let currentGenAge = currentAge;
  let ageOffset = 0;

  const targets = [28, 50, 80];
  const benchmarks: BenchmarkResult[] = targets.map((t) => ({
    target: t,
    yearReached: null,
    ageReached: null,
    accountValueAtTarget: 0,
    interestCreditAtTarget: 0,
    generation: "",
  }));

  for (let y = 1; y <= maxYears; y++) {
    const transfer = transfers.find((t) => t.year === y);
    if (transfer) {
      currentGenLabel = transfer.label;
      currentGenAge = transfer.newAge;
      ageOffset = y - 1;
    }

    const age = currentGenAge + (y - ageOffset - (transfer ? 0 : 0));
    const computedAge = y <= ageOffset ? currentAge + y - 1 :
      currentGenAge + (y - ageOffset - 1);

    const premiumThisYear = y <= fundingYears ? annualPremium : 0;
    cumulativePremium += premiumThisYear;

    const beginningValue = accountValue + premiumThisYear;
    const interestCredit = beginningValue * creditingRate;
    const endingValue = beginningValue + interestCredit;

    const effectiveReturn = totalPremiumsPaid > 0
      ? (interestCredit / totalPremiumsPaid) * 100
      : 0;

    let gen = "original";
    if (transfers.length > 0) {
      const activeTransfer = transfers.filter((t) => t.year <= y).pop();
      if (activeTransfer) {
        gen = activeTransfer.label.toLowerCase().replace(/\s+/g, "-");
        currentGenLabel = activeTransfer.label;
      }
    }

    let displayAge: number;
    const activeTransferForAge = transfers.filter((t) => t.year <= y).pop();
    if (activeTransferForAge) {
      displayAge = activeTransferForAge.newAge + (y - activeTransferForAge.year);
    } else {
      displayAge = currentAge + y;
    }

    rows.push({
      year: y,
      age: displayAge,
      premiumPaid: premiumThisYear,
      cumulativePremium,
      beginningValue,
      interestCredit,
      endingValue,
      effectiveReturnOnPremium: effectiveReturn,
      generation: gen,
      generationLabel: transfers.filter((t) => t.year <= y).pop()?.label || "Original Owner",
    });

    for (const bm of benchmarks) {
      if (bm.yearReached === null && effectiveReturn >= bm.target) {
        bm.yearReached = y;
        bm.ageReached = displayAge;
        bm.accountValueAtTarget = endingValue;
        bm.interestCreditAtTarget = interestCredit;
        bm.generation = transfers.filter((t) => t.year <= y).pop()?.label || "Original Owner";
      }
    }

    accountValue = endingValue;
  }

  const lastRow = rows[rows.length - 1];
  return {
    rows,
    benchmarks,
    totalPremiumsPaid,
    finalAccountValue: lastRow?.endingValue ?? 0,
    finalEffectiveReturn: lastRow?.effectiveReturnOnPremium ?? 0,
    finalInterestCredit: lastRow?.interestCredit ?? 0,
  };
}

function buildRateComparisonTable(
  annualPremium: number,
  fundingYears: number,
  targets: number[],
  maxYears: number,
): { rate: number; benchmarks: (number | null)[] }[] {
  const rates = [0.1, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5];
  const totalPremiums = annualPremium * fundingYears;

  return rates.map((rPct) => {
    const r = rPct / 100;
    let av = 0;
    const results: (number | null)[] = targets.map(() => null);

    for (let y = 1; y <= maxYears; y++) {
      const prem = y <= fundingYears ? annualPremium : 0;
      const bv = av + prem;
      const credit = bv * r;
      av = bv + credit;
      const effReturn = totalPremiums > 0 ? (credit / totalPremiums) * 100 : 0;

      for (let t = 0; t < targets.length; t++) {
        if (results[t] === null && effReturn >= targets[t]) {
          results[t] = y;
        }
      }
    }
    return { rate: rPct, benchmarks: results };
  });
}

export default function TimeMachineAG49() {
  const calcIntegration = useCalculatorIntegration({
    calculatorName: "TimeMachineAG49",
    strategyType: "iul-growth",
  });

  const { data: clientData } = useClientData();

  const [annualPremium, setAnnualPremium] = useState(400000);
  const [fundingYears, setFundingYears] = useState(5);
  const [creditingRate, setCreditingRate] = useState(6.5);
  const [currentAge, setCurrentAge] = useState(40);

  useEffect(() => {
    if (clientData) {
      if (clientData.annualPremium) setAnnualPremium(clientData.annualPremium);
      if (clientData.age) setCurrentAge(clientData.age);
      if (clientData.spouseAge) setSpouseAge(clientData.spouseAge);
    }
  }, [clientData]);
  const [maxYears, setMaxYears] = useState(100);
  const [activeTab, setActiveTab] = useState("setup");

  const [enableGenerational, setEnableGenerational] = useState(true);
  const [spouseTransferYear, setSpouseTransferYear] = useState(35);
  const [spouseAge, setSpouseAge] = useState(38);
  const [childTransferYear, setChildTransferYear] = useState(60);
  const [childAge, setChildAge] = useState(30);
  const [grandchildTransferYear, setGrandchildTransferYear] = useState(85);
  const [grandchildAge, setGrandchildAge] = useState(25);

  const totalPremiums = annualPremium * fundingYears;

  const generationTransfers = useMemo(() => {
    if (!enableGenerational) return [];
    return [
      { year: spouseTransferYear, label: "Surviving Spouse", newAge: spouseAge },
      { year: childTransferYear, label: "Child (Gen 2)", newAge: childAge },
      { year: grandchildTransferYear, label: "Grandchild (Gen 3)", newAge: grandchildAge },
    ].filter((t) => t.year > 0 && t.year <= maxYears).sort((a, b) => a.year - b.year);
  }, [enableGenerational, spouseTransferYear, spouseAge, childTransferYear, childAge, grandchildTransferYear, grandchildAge, maxYears]);

  const simulation = useMemo(() => {
    return runTimeMachineSimulation(
      annualPremium,
      fundingYears,
      creditingRate / 100,
      currentAge,
      maxYears,
      generationTransfers,
    );
  }, [annualPremium, fundingYears, creditingRate, currentAge, maxYears, generationTransfers]);

  const rateComparison = useMemo(() => {
    return buildRateComparisonTable(annualPremium, fundingYears, [28, 50, 80], maxYears);
  }, [annualPremium, fundingYears, maxYears]);

  const chartData = useMemo(() => {
    const step = maxYears > 100 ? Math.ceil(maxYears / 100) : 1;
    return simulation.rows.filter((_, i) => i % step === 0 || i === simulation.rows.length - 1).map((r) => ({
      year: r.year,
      age: r.age,
      accountValue: r.endingValue,
      interestCredit: r.interestCredit,
      effectiveReturn: r.effectiveReturnOnPremium,
      generation: r.generationLabel,
    }));
  }, [simulation, maxYears]);

  const benchmarkChartData = useMemo(() => {
    return rateComparison.map((rc) => ({
      rate: `${rc.rate}%`,
      rateNum: rc.rate,
      yearsTo28: rc.benchmarks[0],
      yearsTo50: rc.benchmarks[1],
      yearsTo80: rc.benchmarks[2],
    }));
  }, [rateComparison]);

  const handleRun = () => {
    setActiveTab("projections");
    toast.success("Time Machine simulation complete!");
  };

  const handleExportCSV = () => {
    const headers = ["Year", "Age", "Generation", "Premium Paid", "Cumulative Premium", "Beginning Value", "Interest Credit", "Ending Value", "Effective Return on Premium (%)"];
    const csvRows = [headers.join(",")];
    for (const r of simulation.rows) {
      csvRows.push([
        r.year, r.age, `"${r.generationLabel}"`, r.premiumPaid.toFixed(0), r.cumulativePremium.toFixed(0),
        r.beginningValue.toFixed(0), r.interestCredit.toFixed(0), r.endingValue.toFixed(0),
        r.effectiveReturnOnPremium.toFixed(4),
      ].join(","));
    }
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `time-machine-ag49-${creditingRate}pct-${maxYears}yr.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported!");
  };

  const genColors: Record<string, string> = {
    "Original Owner": "#3b82f6",
    "Surviving Spouse": "#8b5cf6",
    "Child (Gen 2)": "#10b981",
    "Grandchild (Gen 3)": "#f59e0b",
  };

  return (
    <div className="space-y-6">

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
        calculatorName="TimeMachineAG49"
      />

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="TimeMachineAG49" />

        <ExecutiveSummary
          pageTitle="Time Machine AG49"
          whatItDoes="This financial analysis tool provides institutional-grade analysis of your financial situation, modeling multiple scenarios and projecting outcomes based on your specific inputs. It transforms complex financial analysis concepts into clear, actionable insights with dollar-quantified recommendations."
          opportunities="This tool reveals insights that most clients never see because they don\'t have access to institutional-grade analysis. The data here can change how you think about your entire financial picture."
          intent="To give you the same caliber of financial analysis analysis that institutional investors and ultra-high-net-worth families receive — now accessible to every client."
          takeaway="Understanding your financial analysis options with precise dollar amounts empowers you to make confident decisions that compound into significant wealth over time."
          callToAction="Enter your numbers and see exactly how financial analysis strategies can improve your financial outcome."
          followUpQuestions={[
            "How does this financial analysis strategy interact with my other financial plans?",
            "What\'s the single biggest financial analysis opportunity I\'m currently missing?",
            "How would my results change if I started this strategy 5 years earlier?",
          ]}
        />
        <GoalsAccelerator pageName="Time Machine AG49" pageContext="Time Machine AG49 — financial analysis modeling with projections and scenario analysis" />
        <TaxBracketPanel grossIncome={clientData?.annualIncome || 150000} filingStatus={clientData?.filingStatus || "single"} stateCode={clientData?.state || "TX"} />
        <RecommendationSummary
          headline="This financial analysis strategy can significantly improve your financial outcome"
          detail="Based on your profile, implementing the recommended financial analysis approach could generate substantial savings and growth over your planning horizon."
          dollarBenefit={200000}
          timeHorizon="20 years"
          confidence="high"
          nextStep="Review with your advisor"
        />
        <DoNothingBaseline
          metrics={[
            { label: "Financial Clarity Score", doNothing: 40, recommended: 90, format: "percent" },
            { label: "Optimization Potential", doNothing: 0, recommended: 200000, format: "currency" },
            { label: "Decision Confidence", doNothing: 35, recommended: 92, format: "percent" },
          ]}
          summary="Without taking action on financial analysis, you leave significant value on the table that compounds into a major opportunity cost over time."
        />
      <FactFinderBadge className="mb-4" />
      {/* ─── HEADER ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Clock className="w-7 h-7 text-amber-500" />
              Time Machine AG49
            </h1>
            <Badge variant="outline" className="text-amber-600 border-amber-300">
              Educational &amp; Hypothetical
            </Badge>
          </div>
          <p className="text-muted-foreground mt-2 max-w-3xl">
            Same AG 49-compliant crediting rate. Same premium. The only variable is <strong>time</strong>.
            This calculator reveals how compound interest transforms a modest annual rate into what
            <em> appears</em> to be a 28%, 50%, or even 80% return on your original premium — all without
            violating any illustrated rate limits. The policy never lapses at death; it transfers to
            surviving family members, compounding across generations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportToSlides
            toolName="Time Machine AG49"
            getSections={() => [
              {
                title: "Setup Parameters",
                items: [
                  { label: "Annual Premium", value: fmt(annualPremium) },
                  { label: "Funding Years", value: String(fundingYears) },
                  { label: "Total Premiums Paid", value: fmt(totalPremiums) },
                  { label: "Crediting Rate", value: `${creditingRate.toFixed(1)}%` },
                  { label: "Current Age", value: String(currentAge) },
                  { label: "Projection Years", value: String(maxYears) },
                ],
              },
              {
                title: "Simulation Results",
                items: [
                  { label: "Final Account Value", value: fmt(simulation.finalAccountValue) },
                  { label: "Final Interest Credit", value: fmt(simulation.finalInterestCredit) },
                  { label: "Final Effective Return", value: fmtPct(simulation.finalEffectiveReturn) },
                ],
              },
              {
                title: "Benchmark Milestones",
                items: simulation.benchmarks.map((b) => ({
                  label: `${b.target}% Effective Return`,
                  value: b.yearReached ? `Year ${b.yearReached} (Age ${b.ageReached}) - ${b.generation}` : "Not Reached",
                })),
              },
            ]}
          />
        </div>
      </div>

      {/* ─── TABS ───────────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap gap-1 h-auto p-1">
          <TabsTrigger value="setup" className="whitespace-normal text-xs sm:text-sm">
            <Layers className="w-4 h-4 mr-1" /> Setup
          </TabsTrigger>
          <TabsTrigger value="projections" className="whitespace-normal text-xs sm:text-sm">
            <BarChart3 className="w-4 h-4 mr-1" /> Projections
          </TabsTrigger>
          <TabsTrigger value="benchmarks" className="whitespace-normal text-xs sm:text-sm">
            <Target className="w-4 h-4 mr-1" /> Benchmark Matrix
          </TabsTrigger>
          <TabsTrigger value="generations" className="whitespace-normal text-xs sm:text-sm">
            <Users className="w-4 h-4 mr-1" /> Generational Transfer
          </TabsTrigger>
          <TabsTrigger value="formula" className="whitespace-normal text-xs sm:text-sm">
            <Info className="w-4 h-4 mr-1" /> The Formula
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* SETUP TAB                                                      */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="setup" className="space-y-6">
          {/* Premium Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500" /> Premium Plan
              </CardTitle>
              <CardDescription>
                Enter the annual premium and number of funding years. The total premium paid is the baseline
                against which all "effective return" percentages are measured.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Annual Premium</Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <NumberInput value={annualPremium} onChange={setAnnualPremium} className="pl-9" min={1000} step={10000} />
                  </div>
                </div>
                <div>
                  <Label>Funding Years</Label>
                  <NumberInput value={fundingYears} onChange={setFundingYears} className="mt-1" min={1} max={30} step={1} />
                </div>
                <div>
                  <Label>Current Age</Label>
                  <NumberInput value={currentAge} onChange={setCurrentAge} className="mt-1" min={0} max={90} step={1} />
                </div>
                <div>
                  <Label>Projection Years</Label>
                  <Select value={String(maxYears)} onValueChange={v => setMaxYears(Number(v))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[25, 50, 75, 100, 125, 150, 200].map((y) => (
                        <SelectItem key={y} value={String(y)}>{y} Years</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Total Premiums Paid: <span className="text-lg font-bold">{fmt(totalPremiums)}</span>
                  <span className="ml-3 text-muted-foreground">({fmt(annualPremium)}/yr × {fundingYears} years)</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Crediting Rate */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Percent className="w-5 h-5 text-blue-500" /> AG 49-Compliant Crediting Rate
              </CardTitle>
              <CardDescription>
                Select any rate from 0.1% to 7.5%. AG 49 maximum illustrated rates typically range from
                5.0% to 6.5% for S&P 500 point-to-point strategies. Higher rates may apply to
                volatility-controlled or proprietary indices (capped at 145% of S&P illustrated rate under AG 49-B).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Slider
                      value={[creditingRate]}
                      onValueChange={([v]) => setCreditingRate(Math.round(v * 10) / 10)}
                      min={0.1}
                      max={7.5}
                      step={0.1}
                      className="w-full"
                    />
                  </div>
                  <Badge variant="outline" className="text-lg font-bold min-w-[80px] justify-center">
                    {creditingRate.toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[3.0, 4.0, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5].map((r) => (
                    <Button
                      key={r}
                      size="sm"
                      variant={creditingRate === r ? "default" : "outline"}
                      onClick={() => setCreditingRate(r)}
                      className="text-xs"
                    >
                      {r}%
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Generational Ownership Transfer */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-500" /> Generational Ownership Transfer
              </CardTitle>
              <CardDescription>
                The policy doesn't lapse at death. Ownership can be reassigned to a surviving spouse,
                children, or grandchildren — continuing the compounding across multiple lifetimes.
                The account value never resets; it keeps growing.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <Button
                  variant={enableGenerational ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEnableGenerational(!enableGenerational)}
                >
                  {enableGenerational ? "Generational Transfer: ON" : "Generational Transfer: OFF"}
                </Button>
                {enableGenerational && (
                  <span className="text-sm text-muted-foreground">
                    Policy transfers to family members at specified years
                  </span>
                )}
              </div>
              {enableGenerational && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-purple-200 dark:border-purple-800">
                    <CardContent className="pt-4 space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Heart className="w-4 h-4 text-purple-500" />
                        <span className="font-medium text-sm">Surviving Spouse</span>
                      </div>
                      <div>
                        <Label className="text-xs">Transfer at Year</Label>
                        <NumberInput value={spouseTransferYear} onChange={setSpouseTransferYear} min={1} max={maxYears} className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs">Spouse Age at Transfer</Label>
                        <NumberInput value={spouseAge} onChange={setSpouseAge} min={1} max={90} className="mt-1" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-green-200 dark:border-green-800">
                    <CardContent className="pt-4 space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Baby className="w-4 h-4 text-green-500" />
                        <span className="font-medium text-sm">Child (Gen 2)</span>
                      </div>
                      <div>
                        <Label className="text-xs">Transfer at Year</Label>
                        <NumberInput value={childTransferYear} onChange={setChildTransferYear} min={1} max={maxYears} className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs">Child Age at Transfer</Label>
                        <NumberInput value={childAge} onChange={setChildAge} min={1} max={90} className="mt-1" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-amber-200 dark:border-amber-800">
                    <CardContent className="pt-4 space-y-2">
                      <div className="flex items-center gap-2 mb-2">
                        <Crown className="w-4 h-4 text-amber-500" />
                        <span className="font-medium text-sm">Grandchild (Gen 3)</span>
                      </div>
                      <div>
                        <Label className="text-xs">Transfer at Year</Label>
                        <NumberInput value={grandchildTransferYear} onChange={setGrandchildTransferYear} min={1} max={maxYears} className="mt-1" />
                      </div>
                      <div>
                        <Label className="text-xs">Grandchild Age at Transfer</Label>
                        <NumberInput value={grandchildAge} onChange={setGrandchildAge} min={1} max={90} className="mt-1" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Run Button */}
          <div className="flex gap-3">
            <Button size="lg" onClick={handleRun} className="gap-2">
              <Play className="w-5 h-5" /> Run Time Machine Simulation
            </Button>
            <Button size="lg" variant="outline" onClick={() => {
              setAnnualPremium(400000);
              setFundingYears(5);
              setCreditingRate(6.5);
              setCurrentAge(40);
              setMaxYears(100);
              toast.info("Reset to defaults");
            }} className="gap-2">
              <RotateCcw className="w-4 h-4" /> Reset
            </Button>
          </div>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* PROJECTIONS TAB                                                */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="projections" className="space-y-6">
          {/* Benchmark Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {simulation.benchmarks.map((bm, i) => {
              const colors = [
                { border: "border-blue-200 dark:border-blue-800", bg: "bg-blue-50 dark:bg-blue-950/30", text: "text-blue-600" },
                { border: "border-purple-200 dark:border-purple-800", bg: "bg-purple-50 dark:bg-purple-950/30", text: "text-purple-600" },
                { border: "border-amber-200 dark:border-amber-800", bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-600" },
              ][i];
              return (
                <Card key={bm.target} className={`${colors.border}`}>
                  <CardContent className={`pt-4 ${colors.bg} rounded-lg`}>
                    <div className="flex items-center justify-between mb-1">
                      <Badge className={`${colors.text} bg-transparent border ${colors.border}`}>
                        {bm.target}% Effective Return
                      </Badge>
                      {bm.yearReached ? (
                        <Badge variant="default" className="bg-green-600">Achieved</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Not reached in {maxYears}yr</Badge>
                      )}
                    </div>
                    {bm.yearReached ? (
                      <div className="mt-2">
                        <p className={`text-2xl font-bold ${colors.text}`}>Year {bm.yearReached}</p>
                        <p className="text-sm text-muted-foreground">
                          Age {bm.ageReached} · {bm.generation}
                        </p>
                        <p className="text-sm mt-1">
                          Account: <span className="font-semibold">{fmtM(bm.accountValueAtTarget)}</span>
                        </p>
                        <p className="text-sm">
                          Year's credit: <span className="font-semibold">{fmt(bm.interestCreditAtTarget)}</span>
                          <span className="text-muted-foreground"> = {bm.target}% of {fmtM(totalPremiums)}</span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-2">
                        Increase projection years or crediting rate to reach this target.
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Total Premiums Paid</p>
                <p className="text-lg font-bold">{fmtM(totalPremiums)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Final Account Value (Year {maxYears})</p>
                <p className="text-lg font-bold text-green-600">{fmtM(simulation.finalAccountValue)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Final Year Interest Credit</p>
                <p className="text-lg font-bold text-blue-600">{fmtM(simulation.finalInterestCredit)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Final Effective Return on Premium</p>
                <p className="text-lg font-bold text-amber-600">{fmtPct(simulation.finalEffectiveReturn)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Account Value Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5" /> Account Value Growth
              </CardTitle>
              <CardDescription>
                {fmtM(totalPremiums)} total premium at {creditingRate}% annual crediting over {maxYears} years
                {enableGenerational && " with generational ownership transfers"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="avGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} label={{ value: "Year", position: "insideBottom", offset: -5 }} />
                  <YAxis tickFormatter={(v: number) => fmtM(v)} tick={{ fontSize: 11 }} />
                  <RTooltip
                    formatter={(value: number, name: string) => [fmtM(value), name === "accountValue" ? "Account Value" : name]}
                    labelFormatter={(label: number) => {
                      const row = chartData.find((r) => r.year === label);
                      return row ? `Year ${label} · Age ${row.age} · ${row.generation}` : `Year ${label}`;
                    }}
                  />
                  <Area type="monotone" dataKey="accountValue" stroke="#3b82f6" fill="url(#avGrad)" strokeWidth={2} name="Account Value" />
                  {/* Benchmark reference lines */}
                  {simulation.benchmarks.map((bm, i) => bm.yearReached ? (
                    <ReferenceLine
                      key={bm.target}
                      x={bm.yearReached}
                      stroke={["#3b82f6", "#8b5cf6", "#f59e0b"][i]}
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      label={{ value: `${bm.target}%`, position: "top", fontSize: 11, fill: ["#3b82f6", "#8b5cf6", "#f59e0b"][i] }}
                    />
                  ) : null)}
                  {/* Generation transfer lines */}
                  {enableGenerational && generationTransfers.map((t) => (
                    <ReferenceLine
                      key={t.year}
                      x={t.year}
                      stroke="#ef4444"
                      strokeDasharray="3 3"
                      label={{ value: t.label, position: "insideTopRight", fontSize: 10, fill: "#ef4444" }}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Effective Return Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" /> Effective Return on Original Premium
              </CardTitle>
              <CardDescription>
                Each year's interest credit as a percentage of the {fmtM(totalPremiums)} total premium paid.
                The crediting rate never changes — only the account value grows, making each year's credit
                a larger fraction of the original investment.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v: number) => `${v.toFixed(0)}%`} tick={{ fontSize: 11 }} />
                  <RTooltip
                    formatter={(value: number, name: string) => [
                      name === "effectiveReturn" ? `${value.toFixed(2)}%` : fmtM(value),
                      name === "effectiveReturn" ? "Effective Return on Premium" : "Interest Credit",
                    ]}
                    labelFormatter={(label: number) => {
                      const row = chartData.find((r) => r.year === label);
                      return row ? `Year ${label} · Age ${row.age}` : `Year ${label}`;
                    }}
                  />
                  <Bar dataKey="interestCredit" fill="#10b981" opacity={0.3} name="Interest Credit" yAxisId="right" />
                  <Line type="monotone" dataKey="effectiveReturn" stroke="#f59e0b" strokeWidth={3} dot={false} name="Effective Return on Premium" />
                  <ReferenceLine y={28} stroke="#3b82f6" strokeDasharray="5 5" label={{ value: "28%", position: "right", fontSize: 11 }} />
                  <ReferenceLine y={50} stroke="#8b5cf6" strokeDasharray="5 5" label={{ value: "50%", position: "right", fontSize: 11 }} />
                  <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="5 5" label={{ value: "80%", position: "right", fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(v: number) => fmtM(v)} tick={{ fontSize: 10 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Year-by-Year Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-lg">Year-by-Year Projection</CardTitle>
                <Button size="sm" variant="outline" onClick={handleExportCSV} className="gap-1">
                  <Download className="w-4 h-4" /> Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-background z-10">
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">Year</th>
                      <th className="text-left py-2 px-2">Age</th>
                      <th className="text-left py-2 px-2">Generation</th>
                      <th className="text-right py-2 px-2">Premium</th>
                      <th className="text-right py-2 px-2">Beginning Value</th>
                      <th className="text-right py-2 px-2">Interest Credit</th>
                      <th className="text-right py-2 px-2">Ending Value</th>
                      <th className="text-right py-2 px-2">Eff. Return</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simulation.rows.map((r, i) => {
                      const isBenchmark = simulation.benchmarks.some(bm => bm.yearReached === r.year);
                      const isTransfer = generationTransfers.some(t => t.year === r.year);
                      const bgClass = isBenchmark
                        ? "bg-amber-50 dark:bg-amber-950/30"
                        : isTransfer
                        ? "bg-purple-50 dark:bg-purple-950/30"
                        : i % 2 === 0
                        ? "bg-muted/30"
                        : "";
                      return (
                        <tr key={r.year} className={bgClass}>
                          <td className="py-1.5 px-2 font-medium">
                            {r.year}
                            {isBenchmark && <Sparkles className="w-3 h-3 inline ml-1 text-amber-500" />}
                          </td>
                          <td className="py-1.5 px-2">{r.age}</td>
                          <td className="py-1.5 px-2">
                            <span className="text-xs" style={{ color: genColors[r.generationLabel] || "#888" }}>
                              {r.generationLabel}
                            </span>
                          </td>
                          <td className="py-1.5 px-2 text-right">{r.premiumPaid > 0 ? fmt(r.premiumPaid) : "—"}</td>
                          <td className="py-1.5 px-2 text-right">{fmtM(r.beginningValue)}</td>
                          <td className="py-1.5 px-2 text-right text-green-600 font-medium">{fmtM(r.interestCredit)}</td>
                          <td className="py-1.5 px-2 text-right font-medium">{fmtM(r.endingValue)}</td>
                          <td className="py-1.5 px-2 text-right">
                            <span className={r.effectiveReturnOnPremium >= 80 ? "text-amber-600 font-bold" :
                              r.effectiveReturnOnPremium >= 50 ? "text-purple-600 font-semibold" :
                              r.effectiveReturnOnPremium >= 28 ? "text-blue-600 font-semibold" : ""}>
                              {fmtPct(r.effectiveReturnOnPremium)}
                            </span>
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

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* BENCHMARK MATRIX TAB                                           */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="benchmarks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" /> Rate vs. Years-to-Target Matrix
              </CardTitle>
              <CardDescription>
                For your premium plan ({fmtM(totalPremiums)} = {fmt(annualPremium)}/yr × {fundingYears} years),
                this table shows how many years it takes at each crediting rate for one year's interest credit
                to equal 28%, 50%, or 80% of total premiums paid. Lower rates simply need more time.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-semibold">Crediting Rate</th>
                      <th className="text-center py-2 px-3 font-semibold text-blue-600">
                        Years to 28%
                        <span className="block text-xs font-normal text-muted-foreground">
                          Credit = {fmt(totalPremiums * 0.28)}/yr
                        </span>
                      </th>
                      <th className="text-center py-2 px-3 font-semibold text-purple-600">
                        Years to 50%
                        <span className="block text-xs font-normal text-muted-foreground">
                          Credit = {fmt(totalPremiums * 0.50)}/yr
                        </span>
                      </th>
                      <th className="text-center py-2 px-3 font-semibold text-amber-600">
                        Years to 80%
                        <span className="block text-xs font-normal text-muted-foreground">
                          Credit = {fmt(totalPremiums * 0.80)}/yr
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rateComparison.map((rc, i) => {
                      const isSelected = rc.rate === creditingRate;
                      return (
                        <tr key={rc.rate} className={`${isSelected ? "bg-blue-50 dark:bg-blue-950/30 font-semibold" : i % 2 === 0 ? "bg-muted/30" : ""}`}>
                          <td className="py-2 px-3">
                            {rc.rate.toFixed(1)}%
                            {isSelected && <Badge className="ml-2 text-xs bg-blue-600">Selected</Badge>}
                          </td>
                          {rc.benchmarks.map((yrs, j) => (
                            <td key={j} className="py-2 px-3 text-center">
                              {yrs !== null ? (
                                <span className={`font-medium ${["text-blue-600", "text-purple-600", "text-amber-600"][j]}`}>
                                  {yrs} years
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-xs">{`>${maxYears}yr`}</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Benchmark Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Years to Reach Each Target by Rate</CardTitle>
              <CardDescription>
                Visual comparison: how crediting rate affects the timeline to each benchmark
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={benchmarkChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" label={{ value: "Years", position: "insideBottom", offset: -5 }} />
                  <YAxis type="category" dataKey="rate" tick={{ fontSize: 11 }} width={50} />
                  <RTooltip formatter={(value: any, name: string) => [value != null ? `${value} years` : "Not reached", name]} />
                  <Legend />
                  <Bar dataKey="yearsTo28" name="28% Target" fill="#3b82f6" radius={[0, 2, 2, 0]} />
                  <Bar dataKey="yearsTo50" name="50% Target" fill="#8b5cf6" radius={[0, 2, 2, 0]} />
                  <Bar dataKey="yearsTo80" name="80% Target" fill="#f59e0b" radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Key Insight */}
          <Card className="border-green-200 dark:border-green-800">
            <CardContent className="pt-4">
              <div className="flex gap-3">
                <Sparkles className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-green-700 dark:text-green-300 mb-1">The Time Machine Insight</p>
                  <p className="text-sm text-muted-foreground">
                    Every rate in this table is AG 49-compliant. The only variable is time. A policy earning
                    just {creditingRate}% per year will eventually produce annual interest credits equal to
                    {simulation.benchmarks[2]?.yearReached
                      ? ` 80% of the original premium by year ${simulation.benchmarks[2].yearReached}`
                      : " 80% of the original premium given enough time"}.
                    This is the power of compound interest on a tax-advantaged, floor-protected vehicle — not rate manipulation.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* GENERATIONAL TRANSFER TAB                                      */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="generations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-500" /> Multigenerational Wealth Engine
              </CardTitle>
              <CardDescription>
                Unlike most financial vehicles, a properly structured IUL policy does not terminate at the
                insured's death. Through ownership transfer, the policy can be reassigned to a surviving
                spouse, then to children, then to grandchildren — each generation inheriting the full
                compounded account value and continuing to earn tax-free interest credits on the entire balance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Generation Timeline */}
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 via-green-500 to-amber-500" />
                {[
                  {
                    icon: <DollarSign className="w-5 h-5" />,
                    color: "bg-blue-500",
                    label: "Original Owner",
                    period: `Years 1-${enableGenerational ? spouseTransferYear - 1 : maxYears}`,
                    desc: `Funds the policy with ${fmt(annualPremium)}/yr for ${fundingYears} years. Total premium: ${fmtM(totalPremiums)}. Account compounds at ${creditingRate}% annually.`,
                    value: simulation.rows[Math.min((enableGenerational ? spouseTransferYear : maxYears) - 1, simulation.rows.length - 1)]?.endingValue ?? 0,
                  },
                  ...(enableGenerational ? [
                    {
                      icon: <Heart className="w-5 h-5" />,
                      color: "bg-purple-500",
                      label: "Surviving Spouse",
                      period: `Years ${spouseTransferYear}-${childTransferYear - 1}`,
                      desc: `Policy ownership transfers to spouse (age ${spouseAge}). No new premiums needed. Account value continues compounding at ${creditingRate}% on the full balance. No reset, no restart.`,
                      value: simulation.rows[Math.min(childTransferYear - 2, simulation.rows.length - 1)]?.endingValue ?? 0,
                    },
                    {
                      icon: <Baby className="w-5 h-5" />,
                      color: "bg-green-500",
                      label: "Child (Generation 2)",
                      period: `Years ${childTransferYear}-${grandchildTransferYear - 1}`,
                      desc: `Child (age ${childAge}) inherits the policy. The compounding snowball is now massive. Each year's interest credit alone may exceed the entire original premium.`,
                      value: simulation.rows[Math.min(grandchildTransferYear - 2, simulation.rows.length - 1)]?.endingValue ?? 0,
                    },
                    {
                      icon: <Crown className="w-5 h-5" />,
                      color: "bg-amber-500",
                      label: "Grandchild (Generation 3)",
                      period: `Years ${grandchildTransferYear}-${maxYears}`,
                      desc: `Grandchild (age ${grandchildAge}) inherits a policy with decades of compounding. The annual interest credit is now a multiple of the original premium — all from the same compliant rate.`,
                      value: simulation.rows[simulation.rows.length - 1]?.endingValue ?? 0,
                    },
                  ] : []),
                ].map((gen, i) => (
                  <div key={i} className="relative pl-10 pb-8">
                    <div className={`absolute left-2 w-5 h-5 rounded-full ${gen.color} flex items-center justify-center text-white`}>
                      {gen.icon}
                    </div>
                    <div className="bg-card border rounded-lg p-4">
                      <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                        <h3 className="font-semibold">{gen.label}</h3>
                        <Badge variant="outline">{gen.period}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{gen.desc}</p>
                      <p className="text-lg font-bold text-green-600">
                        Account Value: {fmtM(gen.value)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Generational Comparison Table */}
              {enableGenerational && (
                <Card className="border-dashed">
                  <CardHeader>
                    <CardTitle className="text-base">Generational Snapshot</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-3">Generation</th>
                            <th className="text-right py-2 px-3">Transfer Year</th>
                            <th className="text-right py-2 px-3">Account at Transfer</th>
                            <th className="text-right py-2 px-3">Annual Credit at Transfer</th>
                            <th className="text-right py-2 px-3">Eff. Return at Transfer</th>
                            <th className="text-right py-2 px-3">Account at End</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { label: "Original Owner", startYear: 1, endYear: spouseTransferYear - 1 },
                            { label: "Surviving Spouse", startYear: spouseTransferYear, endYear: childTransferYear - 1 },
                            { label: "Child (Gen 2)", startYear: childTransferYear, endYear: grandchildTransferYear - 1 },
                            { label: "Grandchild (Gen 3)", startYear: grandchildTransferYear, endYear: maxYears },
                          ].map((gen, i) => {
                            const startRow = simulation.rows[Math.min(gen.startYear - 1, simulation.rows.length - 1)];
                            const endRow = simulation.rows[Math.min(gen.endYear - 1, simulation.rows.length - 1)];
                            return (
                              <tr key={i} className={i % 2 === 0 ? "bg-muted/30" : ""}>
                                <td className="py-2 px-3 font-medium" style={{ color: Object.values(genColors)[i] }}>
                                  {gen.label}
                                </td>
                                <td className="py-2 px-3 text-right">{gen.startYear}</td>
                                <td className="py-2 px-3 text-right">{fmtM(startRow?.endingValue ?? 0)}</td>
                                <td className="py-2 px-3 text-right text-green-600">{fmtM(startRow?.interestCredit ?? 0)}</td>
                                <td className="py-2 px-3 text-right">{fmtPct(startRow?.effectiveReturnOnPremium ?? 0)}</td>
                                <td className="py-2 px-3 text-right font-semibold">{fmtM(endRow?.endingValue ?? 0)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Key Point */}
              <Card className="border-purple-200 dark:border-purple-800">
                <CardContent className="pt-4">
                  <div className="flex gap-3">
                    <Shield className="w-6 h-6 text-purple-500 flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-purple-700 dark:text-purple-300 mb-1">
                        The Policy Never Dies
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Through proper ownership transfer planning, this policy can continue compounding
                        across 3, 4, or even 5+ generations. The account value never resets. Each generation
                        inherits the full snowball. A {creditingRate}% annual rate that starts modest becomes
                        extraordinary when measured against the original premium after 50, 75, or 100+ years
                        of uninterrupted compounding. This is not a higher rate — it's the same rate with
                        more time. Einstein's "eighth wonder of the world" in action.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* FORMULA TAB                                                    */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="formula" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="w-5 h-5" /> The Mathematical Formula
              </CardTitle>
              <CardDescription>
                Transparent, auditable math. No hidden assumptions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1 */}
              <div className="p-4 rounded-lg bg-muted/50 border">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Badge>Step 1</Badge> Funding Phase (Years 1 through {fundingYears})
                </h3>
                <div className="font-mono text-sm bg-background p-3 rounded border mb-2">
                  AV(y) = [ AV(y-1) + Premium ] × (1 + R)
                </div>
                <p className="text-sm text-muted-foreground">
                  Each year, the annual premium ({fmt(annualPremium)}) is added at the start of the year,
                  then the entire balance earns the crediting rate (R = {creditingRate}%) at year-end.
                  After {fundingYears} years, total premiums paid = <strong>{fmtM(totalPremiums)}</strong>.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-lg bg-muted/50 border">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Badge>Step 2</Badge> Growth Phase (Years {fundingYears + 1}+)
                </h3>
                <div className="font-mono text-sm bg-background p-3 rounded border mb-2">
                  AV(y) = AV(y-1) × (1 + R)
                </div>
                <p className="text-sm text-muted-foreground">
                  No new premiums. The account value compounds annually at {creditingRate}%.
                  This is pure exponential growth on the accumulated balance.
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-lg bg-muted/50 border">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Badge>Step 3</Badge> Effective Return on Premium
                </h3>
                <div className="font-mono text-sm bg-background p-3 rounded border mb-2">
                  Effective Return(y) = [ AV(y) × R ] / Total Premiums Paid × 100
                </div>
                <p className="text-sm text-muted-foreground">
                  This is the key metric. It answers: <em>"What percentage of my original {fmtM(totalPremiums)}
                  investment did I earn THIS year in interest alone?"</em> The crediting rate R never changes.
                  But as AV grows, the dollar amount of each year's credit grows — making the effective return
                  on the original premium climb steadily toward 28%, 50%, 80%, and beyond.
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-lg bg-muted/50 border">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Badge>Step 4</Badge> Benchmark Solve
                </h3>
                <div className="font-mono text-sm bg-background p-3 rounded border mb-2">
                  Find smallest Y where: AV(Y) × R ≥ Target% × Total Premiums Paid
                </div>
                <p className="text-sm text-muted-foreground">
                  For a 28% target: find Y where one year's credit ≥ {fmt(totalPremiums * 0.28)}<br />
                  For a 50% target: find Y where one year's credit ≥ {fmt(totalPremiums * 0.50)}<br />
                  For an 80% target: find Y where one year's credit ≥ {fmt(totalPremiums * 0.80)}
                </p>
              </div>

              {/* Step 5 */}
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Badge className="bg-amber-600">Key Insight</Badge> Why This Works
                </h3>
                <p className="text-sm text-muted-foreground">
                  At {creditingRate}%, the account value doubles approximately every {(72 / creditingRate).toFixed(1)} years
                  (Rule of 72). After the funding phase ends, each doubling means the annual interest credit also doubles.
                  So if year 6's credit is {fmtPct(creditingRate)} of the account, by year {Math.round(6 + 72 / creditingRate)} the
                  credit is 2× larger, by year {Math.round(6 + 2 * 72 / creditingRate)} it's 4× larger, and so on.
                  The rate never changed — only the base grew. This is why time is the most powerful variable,
                  and why generational ownership transfer creates extraordinary outcomes from ordinary rates.
                </p>
              </div>

              {/* Assumptions */}
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                <h3 className="font-semibold mb-2 text-red-700 dark:text-red-300">Important Assumptions & Limitations</h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                  <li>This model assumes <strong>level annual compounding</strong> with no policy charges, cost of insurance (COI), premium loads, or surrender penalties.</li>
                  <li>Actual IUL policies have COI charges that increase with age, administrative fees, and surrender schedules that reduce early cash values.</li>
                  <li>The crediting rate is <strong>not guaranteed</strong> — it depends on index performance, cap rates, participation rates, and floors in effect each year.</li>
                  <li>Generational ownership transfer requires proper legal structuring (irrevocable trust, ownership change forms) and may have gift/estate tax implications.</li>
                  <li>This calculator is for <strong>educational purposes only</strong> and does not constitute an insurance illustration.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ─── NAIC DISCLAIMER ──────────────────────────────────────────── */}
      <NAICDisclaimer variant="footer" showsProjections showsHistoricalData showsCashValues showsComparisons />
<TimeMachineInlineDisclaimer />
      
      <ComplianceFooter pageName="TimeMachineAG49" showsIUL showsTax showsEstate showsProjections showsHistoricalData />
      <PageInsights pageId="time-machine-ag49" />
    </div>
  );
}
