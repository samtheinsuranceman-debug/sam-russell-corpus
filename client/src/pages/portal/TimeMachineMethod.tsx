// @ts-nocheck
/**
 * Time Machine Method — Dual Illustration Generator
 *
 * COLOR STRATEGY:
 *   YOUR PLAN (Client's Real Policy)  → Cool Blue/Silver (#60a5fa / #94a3b8)
 *   TIME MACHINE (Historical Model)   → Warm Amber/Gold (#f59e0b / #fbbf24)
 *
 * Every hover tooltip explains the AG 49-compliant methodology:
 * We show compliant crediting rates (0-7.5%) applied to a hypothetical
 * pre-existing account large enough that the dollar credits match what
 * actual historical index returns would have produced.
 */
import { useCalculatorIntegration } from "@/hooks/useCalculatorIntegration";
import { ClientSelectorBar } from "@/components/ClientSelectorBar";
import { useState, useMemo, useCallback, useEffect } from "react";
import { PageInsights } from "@/components/PageInsights";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/NumberInput";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, BarChart, Bar, Legend, AreaChart, Area, ComposedChart,
  ReferenceLine,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Shield,
  BarChart3,
  Play,
  Clock,
  Info,
  DollarSign,
  Layers,
  Zap,
  Download,
  AlertTriangle,
  Scale,
} from "lucide-react";
import { toast } from "sonner";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";

import {
  generateDualIllustration,
  getPopularIndexOptions,
  ALL_INDEX_OPTIONS,
  CARRIERS,
  type TimeMachineInputs,
  type DualIllustrationResult,
} from "@shared/timeMachineEngine";
import { TimeMachineInlineDisclaimer } from "@/components/TimeMachineInlineDisclaimer";
import { ExportToSlides } from "@/components/ExportToSlides";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

const COLORS = {
  yourPlan: {
    primary: "#60a5fa",     // blue-400
    secondary: "#93c5fd",   // blue-300
    muted: "#1e3a5f",       // dark blue bg
    fill: "#3b82f6",        // blue-500
    border: "border-blue-700/40",
    bg: "bg-blue-950/15",
    text: "text-blue-400",
    textLight: "text-blue-300",
    badge: "bg-blue-600/20 text-blue-300 border-blue-600/40",
  },
  timeMachine: {
    primary: "#f59e0b",     // amber-500
    secondary: "#fbbf24",   // amber-400
    muted: "#451a03",       // dark amber bg
    fill: "#d97706",        // amber-600
    border: "border-amber-700/40",
    bg: "bg-amber-950/15",
    text: "text-amber-400",
    textLight: "text-amber-300",
    badge: "bg-amber-600/20 text-amber-300 border-amber-600/40",
  },
};

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const fmtPct = (n: number) => `${n.toFixed(2)}%`;
const fmtM = (n: number) => {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return fmt(n);
};

const AG49_TOOLTIP = {
  yourPlan: "YOUR PLAN: This column shows your actual premium schedule compounding at the AG 49-compliant flat illustrated rate. These are the numbers you would see on a standard carrier illustration.",
  timeMachine: (year: number, rate: number, startYear: number) => {
    const calYear = startYear + year - 1;
    return `TIME MACHINE MODEL (${calYear}): This value represents a hypothetical pre-existing account large enough that, when credited at the AG 49-compliant rate of ${fmtPct(rate * 100)}, it produces the same dollar interest credit that the actual historical index return would have generated in ${calYear}. No AG 49 laws are violated — we illustrate compliant crediting rates (0%-7.5%) applied to a larger account, not non-compliant rates applied to your account.`;
  },
  chartHover: (year: number, startYear: number) => {
    const calYear = startYear + year - 1;
    return `Year ${year} (Calendar ${calYear}): The Time Machine model demonstrates actual 30+ year historical index performance by imagining a super-sized pre-existing account compounding at AG 49-compliant maximum rates. This allows the truth of historical returns to be shown without violating any NAIC AG 49 laws.`;
  },
  rateHover: (rate: number, calYear: number) =>
    rate === 0
      ? `${calYear}: 0% floor protection activated. The index returned negative this year, but the IUL floor guaranteed no loss. This is one of the most powerful features of indexed crediting.`
      : `${calYear}: ${fmtPct(rate * 100)} credited after applying the strategy's cap, floor, participation rate, and spread to the actual index return. This is the rate that would have been credited to a real policy in ${calYear}.`,
};

function TimeMachineChartTooltip({ active, payload, label, startYear, totalPremiums }: any) {
  if (!active || !payload?.length) return null;
  const year = typeof label === "number" ? label : parseInt(label);
  const calYear = startYear + year - 1;

  return (
    <div className="bg-background/95 backdrop-blur border border-border rounded-lg p-3 shadow-xl max-w-sm">

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
        calculatorName="TimeMachineMethod"
      />
      <p className="text-xs font-bold mb-2">
        Year {year} · Age {payload[0]?.payload?.age} · Calendar {calYear}
      </p>
      <div className="space-y-1.5">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="TimeMachineMethod" />

        <ExecutiveSummary
          pageTitle="Time Machine Method"
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
        <GoalsAccelerator pageName="Time Machine Method" pageContext="Time Machine Method — financial analysis modeling with projections and scenario analysis" />
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
        {payload.map((entry: any, i: number) => {
          const isTimeMachine = entry.dataKey?.toLowerCase().includes("historical") || entry.dataKey?.toLowerCase().includes("tm");
          const color = isTimeMachine ? COLORS.timeMachine.primary : COLORS.yourPlan.primary;
          const label = isTimeMachine ? "TIME MACHINE" : "YOUR PLAN";
          return (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="text-[10px] font-medium" style={{ color }}>{label}</span>
              <span className="text-xs font-medium ml-auto">
                {typeof entry.value === "number"
                  ? entry.value > 1000 ? fmt(entry.value) : `${entry.value.toFixed(2)}%`
                  : entry.value}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 pt-2 border-t border-border/50">
        <p className="text-[9px] text-muted-foreground leading-tight">
          The Time Machine values represent a hypothetical pre-existing account credited at AG 49-compliant rates
          ({"\u2264"}7.5%) sized to match what actual {calYear} index returns would have produced.
          No non-compliant rates are illustrated.
        </p>
      </div>
    </div>
  );
}

function RateChartTooltip({ active, payload, label, startYear }: any) {
  if (!active || !payload?.length) return null;
  const year = typeof label === "number" ? label : parseInt(label);
  const calYear = startYear + year - 1;
  const histRate = payload.find((p) => p.dataKey === "historicalRate")?.value ?? 0;

  return (
    <div className="bg-background/95 backdrop-blur border border-border rounded-lg p-3 shadow-xl max-w-sm">
      <p className="text-xs font-bold mb-2">Year {year} · Calendar {calYear}</p>
      <div className="space-y-1.5">
        {payload.map((entry: any, i: number) => {
          const isHist = entry.dataKey === "historicalRate";
          const color = isHist ? COLORS.timeMachine.primary : COLORS.yourPlan.primary;
          return (
            <div key={i} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="text-[10px] font-medium" style={{ color }}>
                {isHist ? "TIME MACHINE" : "YOUR PLAN"}
              </span>
              <span className="text-xs font-bold ml-auto">{fmtPct(entry.value)}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 pt-2 border-t border-border/50">
        <p className="text-[9px] text-muted-foreground leading-tight">
          {AG49_TOOLTIP.rateHover(histRate / 100, calYear)}
        </p>
      </div>
    
        <ComplianceFooter pageName="TimeMachineMethod" showsIUL showsTax showsEstate showsProjections showsHistoricalData showsPolicyLoans />
      </div>
  );
}

const TIME_MACHINE_DISCLAIMER = `THE TIME MACHINE METHOD — EDUCATIONAL PURPOSE & LEGAL DISCLOSURE

This tool employs the "Time Machine Method," a proprietary educational framework designed to illustrate the mathematical relationship between compound interest, time, and indexed crediting strategies. It is NOT an insurance illustration as defined by NAIC Actuarial Guideline 49 (AG 49), AG 49-A, or AG 49-B.

HOW THE TIME MACHINE METHOD WORKS WITHIN THE LAW:

Rather than illustrating non-compliant crediting rates (which would violate AG 49), the Time Machine Method takes a different approach. It imagines a hypothetical pre-existing account that is large enough that, when credited at AG 49-compliant rates (0% to 7.5%), the resulting dollar amount of interest credit matches what actual historical index returns would have produced. This is mathematically equivalent but legally distinct:

• WHAT WE DO NOT DO: We never show a crediting rate above the AG 49 maximum. Every rate shown is between 0% and the strategy's cap rate.
• WHAT WE DO: We show what account value would be required so that a compliant crediting rate produces the same dollar result as the historical return.
• WHY THIS MATTERS: It allows clients to see the truth of 30+ years of actual market history applied to real carrier crediting parameters — without any AG 49 violation.

PURPOSE: The Time Machine Method helps clients understand:

1. THE POWER OF COMPOUND INTEREST OVER TIME — How modest annual crediting rates (5-7.5%) produce extraordinary effective returns on original premium when given sufficient time to compound.

2. FLOOR PROTECTION IN ACTION — How the 0% floor protects account values during market downturns (2000-2002, 2008, 2022) while still capturing upside in recovery years.

3. LOAN ARBITRAGE REALITY — Carriers quote policy loan rates of 5-8%, but the actual cost to the policyholder is typically only the 0.5-1% "wash" spread because borrowed funds continue earning index credits. The "stated" loan rate dramatically overstates the true cost.

4. GENERATIONAL WEALTH TRANSFER — Unlike securities accounts, a properly structured IUL policy does not terminate at the death of the insured. Ownership can be transferred to a surviving spouse, children, or grandchildren, allowing the compounding engine to continue across multiple lifetimes.

IMPORTANT LIMITATIONS:
• Historical index returns are NOT indicative of future performance
• Actual IUL policies include cost of insurance (COI), administrative charges, premium loads, and surrender charges that reduce account values
• Cap rates, participation rates, floors, and spreads change annually at the carrier's discretion
• This tool uses simplified assumptions and does not account for all policy-specific variables
• All projections are hypothetical and for educational comparison only
• Consult a licensed insurance professional for actual policy illustrations

The "Your Plan" illustration uses a flat assumed crediting rate compliant with AG 49 guidelines. The "Time Machine" illustration applies actual index crediting rates that would have been credited based on the selected index strategy's parameters (cap, floor, participation, spread) applied to historical market data. Neither illustration guarantees future performance.`;

function InfoPill({ text, variant }: { text: string; variant: "yourPlan" | "timeMachine" }) {
  const c = COLORS[variant];
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium cursor-help ${c.badge} border`}>
            <Info className="w-2.5 h-2.5" />
            {variant === "yourPlan" ? "Your Plan" : "Time Machine"}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs leading-relaxed">
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function TimeMachineMethod() {
  const calcIntegration = useCalculatorIntegration({
    calculatorName: "TimeMachineMethod",
    strategyType: "iul-growth",
  });

  const { data: clientData } = useClientData();
  const [annualPremium, setAnnualPremium] = useState(400000);
  const [fundingYears, setFundingYears] = useState(5);
  const [currentAge, setCurrentAge] = useState(45);
  const [projectionYears, setProjectionYears] = useState(30);

  useEffect(() => {
    if (clientData) {
      if (clientData.annualPremium) setAnnualPremium(clientData.annualPremium);
      if (clientData.age) setCurrentAge(clientData.age);
    }
  }, [clientData]);
  const [boringRate, setBoringRate] = useState(6.0);
  const [historicalStartYear, setHistoricalStartYear] = useState(1994);
  const [selectedOptions, setSelectedOptions] = useState<string[]>(["am-sp500-ptp"]);
  const [showLoanAnalysis, setShowLoanAnalysis] = useState(false);
  const [loanStartYear, setLoanStartYear] = useState(20);
  const [annualLoanAmount, setAnnualLoanAmount] = useState(100000);

  const [activeTab, setActiveTab] = useState("setup");
  const [result, setResult] = useState<DualIllustrationResult | null>(null);

  const popularOptions = useMemo(() => getPopularIndexOptions(), []);
  const carrierGroups = useMemo(() => {
    const groups: Record<string, typeof popularOptions> = {};
    for (const opt of popularOptions) {
      if (!groups[opt.carrier]) groups[opt.carrier] = [];
      groups[opt.carrier].push(opt);
    }
    return groups;
  }, [popularOptions]);

  const totalPremiums = annualPremium * fundingYears;

  const runSimulation = useCallback(() => {
    if (selectedOptions.length === 0) {
      toast.error("Select at least one index option");
      return;
    }
    const inputs: TimeMachineInputs = {
      premiumSchedule: { annualPremium, fundingYears },
      currentAge,
      projectionYears,
      boringRate: boringRate / 100,
      selectedIndexOptions: selectedOptions,
      historicalStartYear,
      statedLoanRate: 0.05,
      actualArbitrageSpread: 0.005,
      loanStartYear: showLoanAnalysis ? loanStartYear : undefined,
      annualLoanAmount: showLoanAnalysis ? annualLoanAmount : undefined,
    };
    const res = generateDualIllustration(inputs);
    setResult(res);
    setActiveTab("comparison");
    toast.success("Dual illustration generated!");
  }, [annualPremium, fundingYears, currentAge, projectionYears, boringRate, selectedOptions, historicalStartYear, showLoanAnalysis, loanStartYear, annualLoanAmount]);

  const comparisonChartData = useMemo(() => {
    if (!result) return [];
    return result.boring.map((b, i) => ({
      year: b.year,
      age: b.age,
      yourPlanAV: b.accountValue,
      timeMachineAV: result.historical[i]?.accountValue ?? 0,
      yourPlanSV: b.surrenderValue,
      timeMachineSV: result.historical[i]?.surrenderValue ?? 0,
      boringRate: b.creditingRate * 100,
      historicalRate: (result.historical[i]?.creditingRate ?? 0) * 100,
      yourPlanCredit: b.interestCredit,
      timeMachineCredit: result.historical[i]?.interestCredit ?? 0,
      yourPlanEffective: b.effectiveReturnOnPremium,
      historicalEffective: result.historical[i]?.effectiveReturnOnPremium ?? 0,
    }));
  }, [result]);

  const loanChartData = useMemo(() => {
    if (!result || !showLoanAnalysis) return [];
    return result.boring.map((b, i) => ({
      year: b.year,
      age: b.age,
      statedCost: b.statedLoanInterest,
      actualCost: b.actualLoanInterest,
      yourPlanNetCV: b.netCashValue,
      historicalNetCV: result.historical[i]?.netCashValue ?? 0,
    }));
  }, [result, showLoanAnalysis]);

  const exportCSV = useCallback(() => {
    if (!result) return;
    const headers = [
      "Year", "Age", "Premium",
      "YourPlan Rate%", "YourPlan Credit", "YourPlan AV", "YourPlan SV",
      "TimeMachine Rate%", "TimeMachine Credit", "TimeMachine AV", "TimeMachine SV",
      "YourPlan Eff%", "TimeMachine Eff%",
    ];
    const rows = result.boring.map((b, i) => {
      const h = result.historical[i];
      return [
        b.year, b.age, b.premiumPaid,
        (b.creditingRate * 100).toFixed(2), Math.round(b.interestCredit), Math.round(b.accountValue), Math.round(b.surrenderValue),
        ((h?.creditingRate ?? 0) * 100).toFixed(2), Math.round(h?.interestCredit ?? 0), Math.round(h?.accountValue ?? 0), Math.round(h?.surrenderValue ?? 0),
        b.effectiveReturnOnPremium.toFixed(2), (h?.effectiveReturnOnPremium ?? 0).toFixed(2),
      ].join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `time-machine-method-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported!");
  }, [result]);

  const toggleOption = useCallback((optionId: string) => {
    setSelectedOptions(prev => {
      if (prev.includes(optionId)) return prev.filter((id) => id !== optionId);
      if (prev.length < 3) return [...prev, optionId];
      toast.error("Maximum 3 index options");
      return prev;
    });
  }, []);

  const yourPlanLabel = `Your Plan (${fmtPct(boringRate)} flat)`;
  const tmLabel = `Time Machine (Historical)`;

  return (
    <div className="space-y-6">
      <FactFinderBadge className="mb-4" />
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-600 to-blue-600 shadow-lg shadow-amber-900/20">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Time Machine Method</h1>
            <p className="text-muted-foreground text-sm">
              Dual Illustration — <span className={COLORS.yourPlan.text}>Your Plan</span> vs. <span className={COLORS.timeMachine.text}>30-Year Historical Model</span>
            </p>
          </div>
        </div>
        {/* Color Legend */}
        <div className="hidden md:flex items-center gap-4 text-xs">
          <ExportToSlides
            toolName="Time Machine Method"
            getSections={() => [
              {
                title: "Premium Schedule",
                items: [
                  { label: "Annual Premium", value: fmt(annualPremium) },
                  { label: "Funding Years", value: String(fundingYears) },
                  { label: "Client Age", value: String(currentAge) },
                  { label: "Projection Years", value: String(projectionYears) },
                  { label: "Total Premiums", value: fmt(totalPremiums) }
                ]
              },
              {
                title: "Assumptions",
                items: [
                  { label: "Your Plan Rate", value: fmtPct(boringRate) },
                  { label: "Historical Start Year", value: String(historicalStartYear) }
                ]
              }
            ]}
          />
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border" style={{ borderColor: COLORS.yourPlan.primary + "40", background: COLORS.yourPlan.muted + "30" }}>
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.yourPlan.primary }} />
            <span style={{ color: COLORS.yourPlan.primary }}>Your Plan</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border" style={{ borderColor: COLORS.timeMachine.primary + "40", background: COLORS.timeMachine.muted + "30" }}>
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.timeMachine.primary }} />
            <span style={{ color: COLORS.timeMachine.primary }}>Time Machine</span>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="setup"><Layers className="w-4 h-4 mr-1" /> Setup</TabsTrigger>
          <TabsTrigger value="comparison" disabled={!result}><Scale className="w-4 h-4 mr-1" /> Compare</TabsTrigger>
          <TabsTrigger value="yearByYear" disabled={!result}><BarChart3 className="w-4 h-4 mr-1" /> Year-by-Year</TabsTrigger>
          <TabsTrigger value="loanArbitrage" disabled={!result}><DollarSign className="w-4 h-4 mr-1" /> Loan Arbitrage</TabsTrigger>
          <TabsTrigger value="disclaimer"><Shield className="w-4 h-4 mr-1" /> Disclaimer</TabsTrigger>
        </TabsList>

        {/* ═══════════════ SETUP TAB ═══════════════ */}
        <TabsContent value="setup" className="space-y-6">
          {/* Premium Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-500" /> Premium Schedule & Client Info
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Annual Premium</Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <NumberInput value={annualPremium} onChange={setAnnualPremium} className="pl-9" min={10000} step={25000} />
                  </div>
                </div>
                <div>
                  <Label>Funding Years</Label>
                  <Select value={String(fundingYears)} onValueChange={v => setFundingYears(Number(v))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 7, 10, 15, 20].map((y) => (
                        <SelectItem key={y} value={String(y)}>{y} Year{y > 1 ? "s" : ""}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Client Age</Label>
                  <NumberInput value={currentAge} onChange={setCurrentAge} className="mt-1" min={18} max={80} />
                </div>
                <div>
                  <Label>Projection Years</Label>
                  <Select value={String(projectionYears)} onValueChange={v => setProjectionYears(Number(v))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[10, 15, 20, 25, 30].map((y) => (
                        <SelectItem key={y} value={String(y)}>{y} Years</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-3 p-3 rounded-lg bg-muted/30 flex items-center gap-4">
                <Badge variant="outline" className="text-base px-3 py-1">
                  Total Premiums: <span className="font-bold ml-1 text-emerald-400">{fmt(totalPremiums)}</span>
                </Badge>
                <Badge variant="outline" className="text-sm">Age at End: {currentAge + projectionYears}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Boring Rate */}
          <Card className={COLORS.yourPlan.border}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.yourPlan.primary }} />
                <span className={COLORS.yourPlan.text}>Your Plan</span> — AG 49 Illustrated Rate
              </CardTitle>
              <CardDescription>
                The standard flat crediting rate used for the compliant illustration.
                This is what a carrier would show you on a standard illustration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="w-48">
                  <Select value={String(boringRate)} onValueChange={v => setBoringRate(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[4.0, 4.5, 5.0, 5.5, 6.0, 6.25, 6.5, 7.0, 7.5].map((r) => (
                        <SelectItem key={r} value={String(r)}>{r}%</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-sm text-muted-foreground">
                  AG 49-B limits illustrated rates to the lesser of 6.5% or the Benchmark Index Account rate.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Historical Index Selection */}
          <Card className={COLORS.timeMachine.border}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.timeMachine.primary }} />
                <span className={COLORS.timeMachine.text}>Time Machine</span> — Historical Index Selection
                <Badge className="bg-amber-600 text-[10px]">30-Year Model</Badge>
              </CardTitle>
              <CardDescription>
                Select 1-3 index strategies. The engine applies their actual historical crediting rates
                (with caps, floors, participation, and spreads) to a hypothetical super-sized account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-48">
                  <Label className="text-xs">Historical Start Year</Label>
                  <Select value={String(historicalStartYear)} onValueChange={v => setHistoricalStartYear(Number(v))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 2025 - 1994 + 1 }, (_, i) => 1994 + i).map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Data available 1994-2025. Simulation uses {projectionYears} years starting from this year.
                </p>
              </div>

              {Object.entries(carrierGroups).map(([carrierId, options]) => {
                const carrier = CARRIERS.find((c) => c.id === carrierId);
                return (
                  <div key={carrierId} className="space-y-2">
                    <p className="text-sm font-medium" style={{ color: carrier?.color }}>{carrier?.name ?? carrierId}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {options.map((opt) => {
                        const isSelected = selectedOptions.includes(opt.id);
                        const fullOpt = ALL_INDEX_OPTIONS.find((o) => o.id === opt.id);
                        return (
                          <button
                            key={opt.id}
                            onClick={() => toggleOption(opt.id)}
                            className={`text-left p-3 rounded-lg border transition-all ${
                              isSelected
                                ? "bg-amber-600/20 border-amber-500 ring-1 ring-amber-500/50"
                                : "bg-card border-border hover:border-amber-700"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {isSelected && <Zap className="w-4 h-4 text-amber-400 shrink-0" />}
                              <span className="text-sm font-medium">{opt.label.split(": ")[1]}</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {fullOpt?.cap !== null && fullOpt?.cap !== undefined ? (
                                <Badge variant="secondary" className="text-[10px]">{fullOpt.cap}% cap</Badge>
                              ) : (
                                <Badge className="text-[10px] bg-emerald-600">Uncapped</Badge>
                              )}
                              {fullOpt && fullOpt.participation !== 100 && fullOpt.participation > 0 && (
                                <Badge variant="outline" className="text-[10px]">{fullOpt.participation}% part.</Badge>
                              )}
                              {fullOpt && fullOpt.spread > 0 && (
                                <Badge variant="outline" className="text-[10px] text-amber-500">{fullOpt.spread}% spread</Badge>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div className="flex items-center gap-2">
                <Badge variant={selectedOptions.length > 0 ? "default" : "destructive"} className="text-sm px-3 py-1">
                  {selectedOptions.length}/3 Selected
                </Badge>
                {selectedOptions.length === 0 && <span className="text-sm text-destructive">Select at least one index</span>}
              </div>
            </CardContent>
          </Card>

          {/* Loan Analysis Toggle */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Scale className="w-5 h-5 text-violet-500" /> Loan Arbitrage Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 mb-4">
                <Switch checked={showLoanAnalysis} onCheckedChange={setShowLoanAnalysis} />
                <Label>Include policy loan analysis (7% stated vs 0.5% actual)</Label>
              </div>
              {showLoanAnalysis && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Start Taking Loans in Year</Label>
                    <NumberInput value={loanStartYear} onChange={setLoanStartYear} className="mt-1" min={1} max={projectionYears} />
                  </div>
                  <div>
                    <Label>Annual Loan Amount</Label>
                    <div className="relative mt-1">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <NumberInput value={annualLoanAmount} onChange={setAnnualLoanAmount} className="pl-9" min={10000} step={25000} />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Run Button */}
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={runSimulation}
              disabled={selectedOptions.length === 0}
              className="bg-gradient-to-r from-amber-600 to-blue-600 hover:from-amber-500 hover:to-blue-500 text-white px-8 py-6 text-lg shadow-lg"
            >
              <Play className="w-5 h-5 mr-2" />
              Generate Dual Illustration
            </Button>
          </div>
        </TabsContent>

        {/* ═══════════════ COMPARISON TAB ═══════════════ */}
        <TabsContent value="comparison" className="space-y-6">
          {result && (
            <>
              {/* Summary Cards — Color-Coded */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* YOUR PLAN */}
                <Card className={`${COLORS.yourPlan.border} ${COLORS.yourPlan.bg}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.yourPlan.primary }} />
                      <span className={COLORS.yourPlan.text}>Your Plan</span>
                      <InfoPill text={AG49_TOOLTIP.yourPlan} variant="yourPlan" />
                    </CardTitle>
                    <CardDescription>Flat {fmtPct(result.inputs.boringRate * 100)} crediting · {fmt(totalPremiums)} total premium</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Final Account Value</p>
                        <p className="text-xl font-bold" style={{ color: COLORS.yourPlan.primary }}>{fmtM(result.summary.boringFinalAV)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Final Surrender Value</p>
                        <p className="text-xl font-bold" style={{ color: COLORS.yourPlan.secondary }}>{fmtM(result.summary.boringFinalSV)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Avg Crediting Rate</p>
                        <p className="text-lg font-bold">{fmtPct(result.summary.boringAvgRate)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Premiums</p>
                        <p className="text-lg font-bold">{fmtM(result.summary.totalPremiums)}</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-blue-800/20">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Effective Return Milestones</p>
                      <div className="flex flex-wrap gap-1.5">
                        {result.benchmarks.boring.map((bm) => (
                          <Badge key={bm.targetPct} variant="outline" className="text-xs border-blue-700/40 text-blue-300">
                            {bm.targetPct}%: {bm.yearReached ? `Yr ${bm.yearReached} (Age ${bm.ageReached})` : "—"}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* TIME MACHINE */}
                <Card className={`${COLORS.timeMachine.border} ${COLORS.timeMachine.bg}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.timeMachine.primary }} />
                      <span className={COLORS.timeMachine.text}>Time Machine</span>
                      <Badge className="bg-amber-600 text-[10px]">Historical</Badge>
                      <InfoPill
                        text="TIME MACHINE: This model shows what a hypothetical super-sized pre-existing account would have produced when credited at AG 49-compliant rates matching actual historical index returns. The account is sized so that compliant rates produce dollar credits equivalent to what the real index returned."
                        variant="timeMachine"
                      />
                    </CardTitle>
                    <CardDescription>
                      {selectedOptions.length} index{selectedOptions.length > 1 ? " blend" : ""} from {historicalStartYear}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Final Account Value</p>
                        <p className="text-xl font-bold" style={{ color: COLORS.timeMachine.primary }}>{fmtM(result.summary.historicalFinalAV)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Final Surrender Value</p>
                        <p className="text-xl font-bold" style={{ color: COLORS.timeMachine.secondary }}>{fmtM(result.summary.historicalFinalSV)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Avg Crediting Rate</p>
                        <p className="text-lg font-bold">{fmtPct(result.summary.historicalAvgRate)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Floor Protected</p>
                        <p className="text-lg font-bold text-emerald-400">
                          <Shield className="w-4 h-4 inline mr-1" />{result.summary.historicalFloorProtectedYears} yrs
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-amber-800/20">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Effective Return Milestones</p>
                      <div className="flex flex-wrap gap-1.5">
                        {result.benchmarks.historical.map((bm) => (
                          <Badge key={bm.targetPct} variant="outline" className="text-xs border-amber-700/40 text-amber-300">
                            {bm.targetPct}%: {bm.yearReached ? `Yr ${bm.yearReached} (Age ${bm.ageReached})` : "—"}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Difference Banner */}
              <Card className={result.summary.avDifference >= 0 ? "border-emerald-700/50 bg-emerald-950/10" : "border-red-700/50 bg-red-950/10"}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {result.summary.avDifference >= 0 ? <TrendingUp className="w-6 h-6 text-emerald-400" /> : <TrendingDown className="w-6 h-6 text-red-400" />}
                      <div>
                        <p className="text-sm text-muted-foreground">Time Machine vs Your Plan Difference</p>
                        <p className={`text-2xl font-bold ${result.summary.avDifference >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {result.summary.avDifference >= 0 ? "+" : ""}{fmtM(result.summary.avDifference)}
                        </p>
                      </div>
                    </div>
                    <Badge className={`text-lg px-4 py-2 ${result.summary.avDifference >= 0 ? "bg-emerald-600" : "bg-red-600"}`}>
                      {result.summary.avDifferencePct >= 0 ? "+" : ""}{fmtPct(result.summary.avDifferencePct)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Account Value Chart */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Account Value Comparison</CardTitle>
                      <CardDescription>
                        <span style={{ color: COLORS.yourPlan.primary }}>Blue (dashed)</span> = Your Plan ·
                        <span style={{ color: COLORS.timeMachine.primary }}> Gold (solid)</span> = Time Machine Historical
                      </CardDescription>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="p-1.5 rounded-md hover:bg-muted"><Info className="w-4 h-4 text-muted-foreground" /></button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm text-xs">
                          Hover over any point to see the AG 49-compliant methodology. The Time Machine model uses a hypothetical super-sized account credited at compliant rates to demonstrate what actual historical index returns would have produced.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={comparisonChartData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v: number) => fmtM(v)} tick={{ fontSize: 11 }} />
                      <RTooltip content={<TimeMachineChartTooltip startYear={historicalStartYear} totalPremiums={totalPremiums} />} />
                      <Legend
                        formatter={(value: string) => (
                          <span style={{ color: value.includes("Your") ? COLORS.yourPlan.primary : COLORS.timeMachine.primary, fontSize: 12 }}>
                            {value}
                          </span>
                        )}
                      />
                      <Area
                        type="monotone" dataKey="yourPlanAV" name={yourPlanLabel}
                        fill={COLORS.yourPlan.fill} fillOpacity={0.08}
                        stroke={COLORS.yourPlan.primary} strokeWidth={2.5} strokeDasharray="8 4"
                      />
                      <Area
                        type="monotone" dataKey="timeMachineAV" name={tmLabel}
                        fill={COLORS.timeMachine.fill} fillOpacity={0.12}
                        stroke={COLORS.timeMachine.primary} strokeWidth={3}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Crediting Rate Chart */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Crediting Rate: Flat vs. Historical</CardTitle>
                      <CardDescription>
                        <span style={{ color: COLORS.yourPlan.primary }}>Blue line</span> stays flat.
                        <span style={{ color: COLORS.timeMachine.primary }}> Gold bars</span> show actual historical rates.
                        Note the <span className="text-emerald-400">0% floor protection</span> during downturns.
                      </CardDescription>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="p-1.5 rounded-md hover:bg-muted"><Info className="w-4 h-4 text-muted-foreground" /></button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm text-xs">
                          Every gold bar represents the actual credited rate that would have been applied based on the index strategy's cap, floor, participation rate, and spread. All rates are AG 49-compliant (0% to cap). Hover any bar for details.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={comparisonChartData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v: number) => `${v}%`} tick={{ fontSize: 11 }} />
                      <RTooltip content={<RateChartTooltip startYear={historicalStartYear} />} />
                      <Legend
                        formatter={(value: string) => (
                          <span style={{ color: value.includes("Your") ? COLORS.yourPlan.primary : COLORS.timeMachine.primary, fontSize: 12 }}>
                            {value}
                          </span>
                        )}
                      />
                      <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                      <Line type="monotone" dataKey="boringRate" name={`Your Plan (${fmtPct(boringRate)})`} stroke={COLORS.yourPlan.primary} strokeWidth={2.5} strokeDasharray="8 4" dot={false} />
                      <Bar dataKey="historicalRate" name="Time Machine Rate" fill={COLORS.timeMachine.primary} fillOpacity={0.55} barSize={14} radius={[2, 2, 0, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Effective Return Chart */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">Effective Return on Original Premium</CardTitle>
                      <CardDescription>
                        What percentage of your original {fmt(totalPremiums)} did you earn THIS year in interest?
                        This is the Time Machine insight — time turns modest rates into extraordinary effective returns.
                      </CardDescription>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="p-1.5 rounded-md hover:bg-muted"><Info className="w-4 h-4 text-muted-foreground" /></button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm text-xs">
                          Effective Return = (This Year's Interest Credit / Total Premiums Paid) x 100. When the gold line crosses 28%, 50%, or 80%, it means a single year's interest credit equals that percentage of all premiums ever paid — using only AG 49-compliant rates.
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={comparisonChartData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v: number) => `${v}%`} tick={{ fontSize: 11 }} />
                      <RTooltip content={<TimeMachineChartTooltip startYear={historicalStartYear} totalPremiums={totalPremiums} />} />
                      <Legend
                        formatter={(value: string) => (
                          <span style={{ color: value.includes("Your") ? COLORS.yourPlan.primary : COLORS.timeMachine.primary, fontSize: 12 }}>
                            {value}
                          </span>
                        )}
                      />
                      <ReferenceLine y={28} stroke="#22c55e" strokeDasharray="3 3" label={{ value: "28%", fill: "#22c55e", fontSize: 10 }} />
                      <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: "50%", fill: "#f59e0b", fontSize: 10 }} />
                      <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "80%", fill: "#ef4444", fontSize: 10 }} />
                      <Line type="monotone" dataKey="yourPlanEffective" name={`Your Plan Eff. Return`} stroke={COLORS.yourPlan.primary} strokeWidth={2.5} strokeDasharray="8 4" dot={false} />
                      <Line type="monotone" dataKey="historicalEffective" name="Time Machine Eff. Return" stroke={COLORS.timeMachine.primary} strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Per-Index Breakdown */}
              {result.indexBreakdowns.length > 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Individual Index Breakdowns</CardTitle>
                    <CardDescription>Performance of each selected Time Machine index strategy independently</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {result.indexBreakdowns.map((bd) => {
                        const last = bd.years[bd.years.length - 1];
                        const carrier = CARRIERS.find((c) => c.id === bd.carrier);
                        return (
                          <Card key={bd.optionId} className={`${COLORS.timeMachine.border}`}>
                            <CardContent className="pt-4">
                              <p className="text-xs font-medium" style={{ color: carrier?.color }}>{carrier?.name}</p>
                              <p className="text-sm font-medium mt-1">{bd.optionName}</p>
                              <div className="mt-2 space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">Final AV</span>
                                  <span className="font-bold" style={{ color: COLORS.timeMachine.primary }}>{fmtM(last?.accountValue ?? 0)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">Avg Rate</span>
                                  <span className="font-bold">{fmtPct(bd.years.reduce((s, r) => s + r.creditingRate * 100, 0) / bd.years.length)}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">Final Eff. Return</span>
                                  <span className="font-bold" style={{ color: COLORS.timeMachine.primary }}>{fmtPct(last?.effectiveReturnOnPremium ?? 0)}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

            </>
          )}
        </TabsContent>

        {/* ═══════════════ YEAR-BY-YEAR TAB ═══════════════ */}
        <TabsContent value="yearByYear" className="space-y-6">
          {result && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Year-by-Year Dual Illustration</h2>
                <Button variant="outline" size="sm" onClick={exportCSV}>
                  <Download className="w-4 h-4 mr-1" /> Export CSV
                </Button>
              </div>

              {/* Color Legend Bar */}
              <div className="flex items-center gap-6 p-3 rounded-lg bg-muted/20 border border-border/50">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-2 rounded" style={{ backgroundColor: COLORS.yourPlan.primary }} />
                  <span className="text-xs" style={{ color: COLORS.yourPlan.primary }}>Your Plan — Standard AG 49 flat rate illustration</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-2 rounded" style={{ backgroundColor: COLORS.timeMachine.primary }} />
                  <span className="text-xs" style={{ color: COLORS.timeMachine.primary }}>Time Machine — Historical index performance model</span>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="ml-auto p-1 rounded hover:bg-muted"><Info className="w-3.5 h-3.5 text-muted-foreground" /></button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-sm text-xs">
                      Hover over any Time Machine cell for a detailed explanation of how that value was calculated using AG 49-compliant rates applied to a hypothetical super-sized account.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <Card>
                <CardContent className="pt-4">
                  <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-background z-10">
                        <tr className="border-b">
                          <th className="text-left py-2 px-2 text-xs" rowSpan={2}>Yr</th>
                          <th className="text-left py-2 px-2 text-xs" rowSpan={2}>Age</th>
                          <th className="text-right py-2 px-2 text-xs" rowSpan={2}>Premium</th>
                          <th
                            className="text-center py-1.5 px-2 text-xs border-b-2"
                            colSpan={4}
                            style={{ color: COLORS.yourPlan.primary, borderColor: COLORS.yourPlan.primary }}
                          >
                            Your Plan ({fmtPct(boringRate)})
                          </th>
                          <th
                            className="text-center py-1.5 px-2 text-xs border-b-2"
                            colSpan={4}
                            style={{ color: COLORS.timeMachine.primary, borderColor: COLORS.timeMachine.primary }}
                          >
                            Time Machine (Historical)
                          </th>
                        </tr>
                        <tr className="border-b">
                          <th className="text-right py-1 px-2 text-[10px]" style={{ color: COLORS.yourPlan.secondary }}>Rate</th>
                          <th className="text-right py-1 px-2 text-[10px]" style={{ color: COLORS.yourPlan.secondary }}>Credit</th>
                          <th className="text-right py-1 px-2 text-[10px]" style={{ color: COLORS.yourPlan.secondary }}>Acct Value</th>
                          <th className="text-right py-1 px-2 text-[10px]" style={{ color: COLORS.yourPlan.secondary }}>Cash Value</th>
                          <th className="text-right py-1 px-2 text-[10px]" style={{ color: COLORS.timeMachine.secondary }}>Rate</th>
                          <th className="text-right py-1 px-2 text-[10px]" style={{ color: COLORS.timeMachine.secondary }}>Credit</th>
                          <th className="text-right py-1 px-2 text-[10px]" style={{ color: COLORS.timeMachine.secondary }}>Acct Value</th>
                          <th className="text-right py-1 px-2 text-[10px]" style={{ color: COLORS.timeMachine.secondary }}>Cash Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.boring.map((b, i) => {
                          const h = result.historical[i];
                          const calYear = historicalStartYear + b.year - 1;
                          return (
                            <TooltipProvider key={b.year}>
                              <tr className={`${i % 2 === 0 ? "bg-muted/10" : ""} hover:bg-muted/30 transition-colors`}>
                                <td className="py-1.5 px-2 font-mono text-xs">{b.year}</td>
                                <td className="py-1.5 px-2 text-xs">{b.age}</td>
                                <td className="py-1.5 px-2 text-right text-xs">{b.premiumPaid > 0 ? fmt(b.premiumPaid) : "—"}</td>
                                {/* YOUR PLAN columns */}
                                <td className="py-1.5 px-2 text-right text-xs" style={{ color: COLORS.yourPlan.primary }}>{fmtPct(b.creditingRate * 100)}</td>
                                <td className="py-1.5 px-2 text-right text-xs" style={{ color: COLORS.yourPlan.secondary }}>{fmt(b.interestCredit)}</td>
                                <td className="py-1.5 px-2 text-right text-xs font-medium" style={{ color: COLORS.yourPlan.primary }}>{fmtM(b.accountValue)}</td>
                                <td className="py-1.5 px-2 text-right text-xs" style={{ color: COLORS.yourPlan.secondary }}>{fmtM(b.surrenderValue)}</td>
                                {/* TIME MACHINE columns */}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <td className={`py-1.5 px-2 text-right text-xs font-medium cursor-help ${
                                      (h?.creditingRate ?? 0) === 0 ? "text-emerald-400" : ""
                                    }`} style={(h?.creditingRate ?? 0) > 0 ? { color: COLORS.timeMachine.primary } : undefined}>
                                      {fmtPct((h?.creditingRate ?? 0) * 100)}
                                      {(h?.creditingRate ?? 0) === 0 && <Shield className="w-3 h-3 inline ml-0.5" />}
                                    </td>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs text-xs">
                                    {AG49_TOOLTIP.rateHover(h?.creditingRate ?? 0, calYear)}
                                  </TooltipContent>
                                </Tooltip>
                                <td className="py-1.5 px-2 text-right text-xs" style={{ color: COLORS.timeMachine.secondary }}>{fmt(h?.interestCredit ?? 0)}</td>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <td className="py-1.5 px-2 text-right text-xs font-medium cursor-help" style={{ color: COLORS.timeMachine.primary }}>
                                      {fmtM(h?.accountValue ?? 0)}
                                    </td>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-sm text-xs leading-relaxed">
                                    {AG49_TOOLTIP.timeMachine(b.year, h?.creditingRate ?? 0, historicalStartYear)}
                                  </TooltipContent>
                                </Tooltip>
                                <td className="py-1.5 px-2 text-right text-xs" style={{ color: COLORS.timeMachine.secondary }}>{fmtM(h?.surrenderValue ?? 0)}</td>
                              </tr>
                            </TooltipProvider>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

            </>
          )}
        </TabsContent>

        {/* ═══════════════ LOAN ARBITRAGE TAB ═══════════════ */}
        <TabsContent value="loanArbitrage" className="space-y-6">
          {result && (
            <>
              <Card className="border-violet-800/30">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Scale className="w-5 h-5 text-violet-400" /> The Loan Arbitrage Reality
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-red-800/30">
                      <CardContent className="pt-4 text-center">
                        <p className="text-xs text-muted-foreground">Stated Loan Rate</p>
                        <p className="text-3xl font-bold text-red-400">7.00%</p>
                        <p className="text-xs text-muted-foreground mt-1">What carriers quote</p>
                      </CardContent>
                    </Card>
                    <Card className="border-emerald-800/30">
                      <CardContent className="pt-4 text-center">
                        <p className="text-xs text-muted-foreground">Actual Arbitrage Spread</p>
                        <p className="text-3xl font-bold text-emerald-400">0.50%</p>
                        <p className="text-xs text-muted-foreground mt-1">What you actually pay</p>
                      </CardContent>
                    </Card>
                    <Card className="border-amber-800/30">
                      <CardContent className="pt-4 text-center">
                        <p className="text-xs text-muted-foreground">Overstatement Factor</p>
                        <p className="text-3xl font-bold text-amber-400">14x</p>
                        <p className="text-xs text-muted-foreground mt-1">How much cost is exaggerated</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/20 border border-border/50">
                    <h3 className="font-medium mb-2">How Loan Arbitrage Works</h3>
                    <p className="text-sm text-muted-foreground">
                      When you take a policy loan, the carrier charges 7% interest on the borrowed amount.
                      However, the funds backing your loan <strong>continue earning index credits</strong> inside the policy.
                      If the policy earns 6.5% and the loan costs 7%, the <strong>real net cost is only 0.5%</strong> —
                      the "arbitrage spread." Many carriers offer "wash loans" after year 10+ where the spread is
                      effectively 0%, making policy loans nearly free.
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-red-400">What Critics Say:</p>
                        <p className="text-muted-foreground">"You're paying 7% to borrow your own money!"</p>
                      </div>
                      <div>
                        <p className="font-medium text-emerald-400">The Reality:</p>
                        <p className="text-muted-foreground">"You're paying 0.5% while your money keeps compounding."</p>
                      </div>
                    </div>
                  </div>

                  {showLoanAnalysis && loanChartData.length > 0 && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="pt-4 text-center">
                            <p className="text-xs text-muted-foreground">Total Stated Cost</p>
                            <p className="text-xl font-bold text-red-400">{fmtM(result.summary.totalStatedLoanCost)}</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4 text-center">
                            <p className="text-xs text-muted-foreground">Total Actual Cost</p>
                            <p className="text-xl font-bold text-emerald-400">{fmtM(result.summary.totalActualLoanCost)}</p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4 text-center">
                            <p className="text-xs text-muted-foreground">Cost Overstatement</p>
                            <p className="text-xl font-bold text-amber-400">{fmtM(result.summary.loanCostOverstatement)}</p>
                          </CardContent>
                        </Card>
                      </div>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Annual Loan Cost: Stated vs. Actual</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={loanChartData.filter((d) => d.statedCost > 0 || d.actualCost > 0)}>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                              <XAxis dataKey="age" tick={{ fontSize: 11 }} />
                              <YAxis tickFormatter={(v: number) => fmtM(v)} tick={{ fontSize: 11 }} />
                              <RTooltip formatter={(value: any) => [typeof value === "number" ? fmt(value) : value]} />
                              <Legend />
                              <Bar dataKey="statedCost" name="Stated Cost (7%)" fill="#ef4444" fillOpacity={0.6} radius={[2, 2, 0, 0]} />
                              <Bar dataKey="actualCost" name="Actual Cost (0.5%)" fill="#22c55e" fillOpacity={0.6} radius={[2, 2, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Net Cash Value After Loans</CardTitle>
                          <CardDescription>
                            <span style={{ color: COLORS.yourPlan.primary }}>Blue (dashed)</span> = Your Plan ·
                            <span style={{ color: COLORS.timeMachine.primary }}> Gold (solid)</span> = Time Machine
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={loanChartData}>
                              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                              <XAxis dataKey="age" tick={{ fontSize: 11 }} />
                              <YAxis tickFormatter={(v: number) => fmtM(v)} tick={{ fontSize: 11 }} />
                              <RTooltip content={<TimeMachineChartTooltip startYear={historicalStartYear} totalPremiums={totalPremiums} />} />
                              <Legend
                                formatter={(value: string) => (
                                  <span style={{ color: value.includes("Your") ? COLORS.yourPlan.primary : COLORS.timeMachine.primary, fontSize: 12 }}>
                                    {value}
                                  </span>
                                )}
                              />
                              <Area type="monotone" dataKey="yourPlanNetCV" name="Your Plan Net CV" fill={COLORS.yourPlan.fill} fillOpacity={0.08} stroke={COLORS.yourPlan.primary} strokeWidth={2.5} strokeDasharray="8 4" />
                              <Area type="monotone" dataKey="historicalNetCV" name="Time Machine Net CV" fill={COLORS.timeMachine.fill} fillOpacity={0.12} stroke={COLORS.timeMachine.primary} strokeWidth={3} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
                    </>
                  )}

                  {!showLoanAnalysis && (
                    <div className="p-4 rounded-lg border border-dashed border-violet-800/30 text-center">
                      <p className="text-sm text-muted-foreground">
                        Enable "Loan Arbitrage Analysis" in the Setup tab to see detailed loan cost comparisons.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

            </>
          )}
        </TabsContent>

        {/* ═══════════════ DISCLAIMER TAB ═══════════════ */}
        <TabsContent value="disclaimer" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                The Time Machine Method — Full Disclosure
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert prose-sm max-w-none">
                {TIME_MACHINE_DISCLAIMER.split("\n\n").map((para, i) => (
                  <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-3 whitespace-pre-line">
                    {para}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>

          <NAICDisclaimer
            variant="full"
            showsHistoricalData showsProjections showsComparisons showsPolicyLoans showsCashValues
            additionalText="The Time Machine Method is a proprietary educational framework of Russell Capital Systems™. It demonstrates actual 30+ year historical index performance by imagining a super-sized pre-existing account compounding at AG 49-compliant maximum rates, allowing the truth of historical returns to be shown without violating any NAIC AG 49 laws."
          />
        </TabsContent>
      </Tabs>
<TimeMachineInlineDisclaimer />
      <PageInsights pageId="time-machine-method" />
    </div>
  );
}
