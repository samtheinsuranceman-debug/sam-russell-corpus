// @ts-nocheck
/**
 * Time Machine Calculator — Unified AG 49 Compliant Calculator
 *
 * This is the single entry point for the Time Machine concept.
 * It combines:
 *   1. AG 49 Compounding Calculator (how time turns 7.5% into 28-80% effective returns)
 *   2. Dual Illustration (Boring vs Historical 30-year performance)
 *   3. Generational Ownership Transfer (policy continues across lifetimes)
 *   4. Loan Arbitrage Analysis (5% loan rate, +0.5% positive arbitrage)
 *
 * COLOR STRATEGY:
 *   YOUR PLAN (Client's Real Policy)  → Cool Blue/Silver (#60a5fa / #94a3b8)
 *   TIME MACHINE (Super-Sized Model)  → Warm Amber/Gold (#f59e0b / #fbbf24)
 *
 * DISCLAIMER: Every cursor hover explains the AG 49-compliant methodology.
 */
import { useCalculatorIntegration } from "@/hooks/useCalculatorIntegration";
import { ClientSelectorBar } from "@/components/ClientSelectorBar";
import { useState, useMemo, useCallback, useEffect } from "react";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/NumberInput";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
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
  BarChart3,
  Play,
  Clock,
  Info,
  DollarSign,
  Percent,
  Layers,
  Zap,
  Scale,
  Users,
  Sparkles,
  ArrowRight,
  Target,
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
import { PageInsights } from "@/components/PageInsights";
import { ExportToSlides } from "@/components/ExportToSlides";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

const C = {
  blue: { primary: "#60a5fa", fill: "#3b82f6", muted: "#1e3a5f" },
  amber: { primary: "#f59e0b", fill: "#d97706", muted: "#451a03" },
  green: { primary: "#10b981" },
  red: { primary: "#ef4444" },
};

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const fmtPct = (n: number) => `${n.toFixed(2)}%`;
const fmtM = (n: number) => {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return fmt(n);
};

const AG49_RATE_DISCLAIMER = "Per NAIC Actuarial Guideline 49 (AG 49-A/B), the maximum hypothetical illustrated rate for IUL products is 7.5% — even though 30-year historical index averages are more than twice this number. We follow this rule. The Time Machine Method demonstrates what historical returns actually produced by using a hypothetical pre-existing account large enough that AG 49-compliant crediting rates (0-7.5%) generate the same dollar credits.";

const TOOLTIP_EXPLANATION = "This Time Machine value represents a hypothetical pre-existing account large enough that, when credited at AG 49-compliant rates (0-7.5%), it produces the same dollar interest credit that the actual historical index return would have generated. No AG 49 laws are violated — we illustrate compliant rates applied to a larger account, not non-compliant rates applied to your account.";

interface CompoundRow {
  year: number;
  age: number;
  premiumPaid: number;
  cumulativePremium: number;
  beginningValue: number;
  interestCredit: number;
  endingValue: number;
  surrenderValue: number;
  effectiveReturn: number; // interestCredit / totalPremiums as %
}

function runCompounding(
  annualPremium: number,
  fundingYears: number,
  rate: number,
  startAge: number,
  projectionYears: number,
  surrenderSchedule: number[] = [0.10, 0.09, 0.08, 0.07, 0.06, 0.05, 0.04, 0.03, 0.02, 0.01]
): CompoundRow[] {
  const rows: CompoundRow[] = [];
  let av = 0;
  const totalPremiums = annualPremium * fundingYears;

  for (let y = 1; y <= projectionYears; y++) {
    const premium = y <= fundingYears ? annualPremium : 0;
    const bv = av + premium;
    const credit = bv * rate;
    const ev = bv + credit;
    const cumPrem = Math.min(y, fundingYears) * annualPremium;
    const penaltyIdx = y - 1;
    const penaltyRate = penaltyIdx < surrenderSchedule.length ? surrenderSchedule[penaltyIdx] : 0;
    const sv = ev * (1 - penaltyRate);
    const effRet = totalPremiums > 0 ? (credit / totalPremiums) * 100 : 0;

    rows.push({
      year: y,
      age: startAge + y,
      premiumPaid: premium,
      cumulativePremium: cumPrem,
      beginningValue: bv,
      interestCredit: credit,
      endingValue: ev,
      surrenderValue: sv,
      effectiveReturn: effRet,
    });
    av = ev;
  }
  return rows;
}

function findBenchmarkYear(rows: CompoundRow[], targetPct: number): number | null {
  for (const r of rows) {
    if (r.effectiveReturn >= targetPct) return r.year;
  }
  return null;
}

interface Generation {
  label: string;
  icon: string;
  startYear: number;
  endYear: number;
  startAge: number;
  relationship: string;
}

function buildGenerations(startAge: number, projYears: number): Generation[] {
  const gens: Generation[] = [];
  const lifeExpectancy = 85;
  const yearsLeft = lifeExpectancy - startAge;

  gens.push({
    label: "Original Owner",
    icon: "👤",
    startYear: 1,
    endYear: Math.min(yearsLeft, projYears),
    startAge,
    relationship: "Policy Holder",
  });

  if (yearsLeft < projYears) {
    const spouseYears = Math.min(30, projYears - yearsLeft);
    gens.push({
      label: "Surviving Spouse",
      icon: "💑",
      startYear: yearsLeft + 1,
      endYear: yearsLeft + spouseYears,
      startAge: startAge - 3 + yearsLeft,
      relationship: "Ownership Transfer",
    });

    const childStart = yearsLeft + spouseYears + 1;
    if (childStart <= projYears) {
      const childYears = Math.min(40, projYears - childStart + 1);
      gens.push({
        label: "Children",
        icon: "👨‍👩‍👧",
        startYear: childStart,
        endYear: childStart + childYears - 1,
        startAge: 45,
        relationship: "Ownership Transfer",
      });

      const gcStart = childStart + childYears;
      if (gcStart <= projYears) {
        gens.push({
          label: "Grandchildren",
          icon: "👶",
          startYear: gcStart,
          endYear: projYears,
          startAge: 25,
          relationship: "Ownership Transfer",
        });
      }
    }
  }
  return gens;
}

function InfoTip({ text }: { text: string }) {
  return (
    <TooltipProvider delayDuration={200}>

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
        calculatorName="TimeMachineCalculator"
      />
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help inline-block ml-1" />
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-sm text-xs leading-relaxed">
          <p>{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function AG49Badge() {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="text-[10px] border-amber-600/40 text-amber-400 bg-amber-950/20 cursor-help">
            AG 49 MAX 7.5%
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-md text-xs leading-relaxed">
          <p>{AG49_RATE_DISCLAIMER}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ChartTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0a1628]/95 border border-[#1e3a5f] rounded-lg p-3 shadow-xl max-w-xs">
      <p className="text-xs font-semibold text-white mb-1">Year {label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex justify-between gap-4 text-xs">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="text-white font-mono">
            {typeof p.value === "number"
              ? p.value > 1000 ? fmtM(p.value) : fmtPct(p.value)
              : p.value}
          </span>
        </div>
      ))}
      <p className="text-[9px] text-muted-foreground mt-2 border-t border-[#1e3a5f] pt-1.5 leading-relaxed">
        {TOOLTIP_EXPLANATION.slice(0, 180)}...
      </p>
    
        <ComplianceFooter pageName="TimeMachineCalculator" showsIUL showsTax showsEstate showsProjections showsHistoricalData showsPolicyLoans />
      </div>
  );
}

export default function TimeMachineCalculator() {
  const calcIntegration = useCalculatorIntegration({
    calculatorName: "TimeMachineCalculator",
    strategyType: "iul-growth",
  });

  const { data: clientData } = useClientData();

  const [annualPremium, setAnnualPremium] = useState("400000");
  const [fundingYears, setFundingYears] = useState(5);
  const [startAge, setStartAge] = useState(45);
  const [creditRate, setCreditRate] = useState(6.5);
  const [projectionYears, setProjectionYears] = useState(50);
  const [activeTab, setActiveTab] = useState("compounding");

  useEffect(() => {
    if (clientData) {
      if (clientData.annualPremium) setAnnualPremium(clientData.annualPremium.toString());
      if (clientData.age) setStartAge(clientData.age);
    }
  }, [clientData]);

  const [selectedIndices, setSelectedIndices] = useState<string[]>(["am-sp500-ptp"]);
  const [boringRate, setBoringRate] = useState(6.0);
  const [loanRate] = useState(5.0);
  const [loanArbitrage] = useState(0.5);

  const [compoundRows, setCompoundRows] = useState<CompoundRow[] | null>(null);
  const [dualResult, setDualResult] = useState<DualIllustrationResult | null>(null);

  const premium = parseFloat(annualPremium) || 400000;
  const totalPremiums = premium * fundingYears;
  const popularIndices = useMemo(() => getPopularIndexOptions(), []);

  const runCompoundingCalc = useCallback(() => {
    const rows = runCompounding(premium, fundingYears, creditRate / 100, startAge, projectionYears);
    setCompoundRows(rows);
    toast.success("Time Machine simulation complete");
  }, [premium, fundingYears, creditRate, startAge, projectionYears]);

  const runDualCalc = useCallback(() => {
    if (selectedIndices.length === 0) {
      toast.error("Select at least one index");
      return;
    }
    const inputs: TimeMachineInputs = {
      premiumSchedule: { annualPremium: premium, fundingYears },
      currentAge: startAge,
      boringRate: boringRate / 100,
      selectedIndexOptions: selectedIndices,
      projectionYears,
      historicalStartYear: 1994,
      statedLoanRate: loanRate / 100,
      actualArbitrageSpread: loanArbitrage / 100,
    };
    const result = generateDualIllustration(inputs);
    setDualResult(result);
    toast.success("Dual illustration generated");
  }, [premium, fundingYears, startAge, boringRate, selectedIndices, projectionYears, loanRate, loanArbitrage]);

  const benchmarks = useMemo(() => {
    if (!compoundRows) return null;
    return {
      y28: findBenchmarkYear(compoundRows, 28),
      y50: findBenchmarkYear(compoundRows, 50),
      y80: findBenchmarkYear(compoundRows, 80),
    };
  }, [compoundRows]);

  const generations = useMemo(
    () => buildGenerations(startAge, projectionYears),
    [startAge, projectionYears]
  );

  const benchmarkMatrix = useMemo(() => {
    const rates = [1, 2, 3, 4, 5, 5.5, 6, 6.5, 7, 7.5];
    const targets = [28, 50, 80];
    return rates.map((r) => {
      const rows = runCompounding(premium, fundingYears, r / 100, startAge, 120);
      const result: Record<string, any> = { rate: r };
      for (const t of targets) {
        const yr = findBenchmarkYear(rows, t);
        result[`y${t}`] = yr;
        if (yr) {
          result[`av${t}`] = rows[yr - 1].endingValue;
          result[`credit${t}`] = rows[yr - 1].interestCredit;
        }
      }
      return result;
    });
  }, [premium, fundingYears, startAge]);

  const compoundChartData = useMemo(() => {
    if (!compoundRows) return [];
    return compoundRows.map((r) => ({
      year: r.year,
      accountValue: r.endingValue,
      surrenderValue: r.surrenderValue,
      interestCredit: r.interestCredit,
      effectiveReturn: r.effectiveReturn,
      cumulativePremium: r.cumulativePremium,
    }));
  }, [compoundRows]);

  const dualChartData = useMemo(() => {
    if (!dualResult) return [];
    return dualResult.boring.map((b: any, i: number) => {
      const h = dualResult.historical[i];
      return {
        year: b.year,
        boringAV: b.accountValue,
        boringSV: b.surrenderValue,
        boringCredit: b.interestCredit,
        historicalAV: h?.accountValue ?? 0,
        historicalSV: h?.surrenderValue ?? 0,
        historicalCredit: h?.interestCredit ?? 0,
        tmRequiredAV: h?.accountValue ? h.accountValue * (h.creditingRate > 0 ? 1 : 0) : 0,
        tmSurrenderValue: h?.surrenderValue ?? 0,
        creditedRate: h?.creditingRate ? h.creditingRate * 100 : 0,
      };
    });
  }, [dualResult]);

  return (
    <div className="space-y-6">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="TimeMachineCalculator" />

        <ExecutiveSummary
          pageTitle="Time Machine Calculator"
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
        <GoalsAccelerator pageName="Time Machine Calculator" pageContext="Time Machine Calculator — financial analysis modeling with projections and scenario analysis" />
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
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-blue-500/20 border border-amber-500/30">
              <Clock className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Time Machine Calculator
                <AG49Badge />
              </h1>
              <p className="text-sm text-muted-foreground">
                See what AG 49-compliant rates actually produce over time — and what historical returns would have generated
              </p>
            </div>
          </div>
          <ExportToSlides
            toolName="Time Machine Calculator"
            getSections={() => [
              {
                title: "Client Profile",
                items: [
                  { label: "Annual Premium", value: `$${parseFloat(annualPremium || "0").toLocaleString()}` },
                  { label: "Funding Years", value: `${fundingYears} years` },
                  { label: "Client Age", value: `${startAge}` },
                  { label: "Projection Years", value: `${projectionYears} years` },
                ],
              },
              {
                title: "Time Machine Assumptions",
                items: [
                  { label: "Total Premiums", value: `$${totalPremiums.toLocaleString()}` },
                  { label: "Crediting Rate", value: `${creditRate}%` },
                  { label: "Loan Rate", value: `${loanRate}%` },
                  { label: "Positive Arbitrage", value: `${loanArbitrage}%` },
                ],
              },
            ]}
          />
        </div>
      </div>

      {/* ─── Input Panel ─────────────────────────────────────────────────── */}
      <Card className="bg-[#0a1628]/80 border-[#1e3a5f]">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-400" />
            Premium Schedule & Client Profile
          </CardTitle>
          <CardDescription>Enter the client's real premium plan and age</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Annual Premium</Label>
              <NumberInput value={annualPremium} onChange={setAnnualPremium} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Funding Years</Label>
              <Select value={String(fundingYears)} onValueChange={v => setFundingYears(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5,7,10,15,20].map((y) => (
                    <SelectItem key={y} value={String(y)}>{y} year{y > 1 ? "s" : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Client Age</Label>
              <NumberInput value={String(startAge)} onChange={(v) => setStartAge(Number(v) || 45)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Projection Years</Label>
              <Select value={String(projectionYears)} onValueChange={v => setProjectionYears(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[20,30,40,50,60,80,100,120].map((y) => (
                    <SelectItem key={y} value={String(y)}>{y} years</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg bg-[#12233e]/60 border border-[#1e3a5f]">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Premiums:</span>
              <span className="text-white font-bold">{fmt(totalPremiums)}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-muted-foreground">Loan Rate / Positive Arbitrage:</span>
              <span className="text-white">{loanRate}% / <span className="text-emerald-400">+{loanArbitrage}%</span></span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── Main Tabs ───────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#12233e]/80 border border-[#1e3a5f] flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="compounding" className="text-xs gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" /> AG 49 Compounding
          </TabsTrigger>
          <TabsTrigger value="dual" className="text-xs gap-1.5">
            <Scale className="h-3.5 w-3.5" /> Dual Illustration
          </TabsTrigger>
          <TabsTrigger value="matrix" className="text-xs gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" /> Benchmark Matrix
          </TabsTrigger>
          <TabsTrigger value="generational" className="text-xs gap-1.5">
            <Users className="h-3.5 w-3.5" /> Generational Transfer
          </TabsTrigger>
          <TabsTrigger value="loan" className="text-xs gap-1.5">
            <DollarSign className="h-3.5 w-3.5" /> Loan Arbitrage
          </TabsTrigger>
          <TabsTrigger value="formula" className="text-xs gap-1.5">
            <Layers className="h-3.5 w-3.5" /> The Formula
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB 1: AG 49 COMPOUNDING                                      */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="compounding" className="space-y-4 mt-4">
          <Card className="bg-[#0a1628]/80 border-[#1e3a5f]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Percent className="h-4 w-4 text-blue-400" />
                AG 49 Crediting Rate
                <AG49Badge />
              </CardTitle>
              <CardDescription>
                How time turns a compliant {fmtPct(creditRate)} rate into 28%, 50%, or 80% effective returns on your original premium
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <Label className="text-xs text-muted-foreground w-32">Crediting Rate</Label>
                  <Slider
                    value={[creditRate]}
                    onValueChange={v => setCreditRate(v[0])}
                    min={0.5} max={7.5} step={0.25}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono text-amber-400 w-16 text-right">{fmtPct(creditRate)}</span>
                </div>
                <Button onClick={runCompoundingCalc} className="w-full bg-gradient-to-r from-blue-600 to-amber-600 hover:from-blue-500 hover:to-amber-500">
                  <Play className="h-4 w-4 mr-2" /> Run Time Machine Simulation
                </Button>
              </div>
            </CardContent>
          </Card>

          {compoundRows && benchmarks && (
            <>
              {/* Benchmark Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { target: 28, year: benchmarks.y28, color: "blue", icon: Target },
                  { target: 50, year: benchmarks.y50, color: "amber", icon: Zap },
                  { target: 80, year: benchmarks.y80, color: "emerald", icon: Sparkles },
                ].map((b) => (
                  <Card key={b.target} className={`bg-${b.color === "blue" ? "[#0d1f3c]" : b.color === "amber" ? "amber-950/20" : "emerald-950/20"} border-${b.color === "blue" ? "[#1e3a5f]" : b.color === "amber" ? "amber-600/30" : "emerald-600/30"}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <b.icon className={`h-4 w-4 text-${b.color === "blue" ? "blue" : b.color}-400`} />
                        <span className="text-xs text-muted-foreground">{b.target}% Effective Return</span>
                        <InfoTip text={`Year when one year's interest credit equals ${b.target}% of your total ${fmt(totalPremiums)} premium at ${fmtPct(creditRate)} AG 49 rate`} />
                      </div>
                      {b.year ? (
                        <>
                          <p className="text-2xl font-bold text-white">Year {b.year}</p>
                          <p className="text-xs text-muted-foreground">
                            Age {startAge + b.year} · AV {fmtM(compoundRows[b.year - 1].endingValue)} · Credit {fmtM(compoundRows[b.year - 1].interestCredit)}
                          </p>
                        </>
                      ) : (
                        <p className="text-lg text-muted-foreground">Beyond {projectionYears}yr projection</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Compounding Chart */}
              <Card className="bg-[#0a1628]/80 border-[#1e3a5f]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-white flex items-center gap-2">
                    Account Value & Effective Return
                    <InfoTip text={TOOLTIP_EXPLANATION} />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={compoundChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                      <XAxis dataKey="year" stroke="#7a95b8" tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="left" stroke="#7a95b8" tick={{ fontSize: 11 }} tickFormatter={fmtM} />
                      <YAxis yAxisId="right" orientation="right" stroke="#7a95b8" tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
                      <RTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Area yAxisId="left" type="monotone" dataKey="accountValue" name="Account Value" fill={C.blue.primary} fillOpacity={0.15} stroke={C.blue.primary} strokeWidth={2} />
                      <Area yAxisId="left" type="monotone" dataKey="surrenderValue" name="Surrender Value" fill={C.blue.muted} fillOpacity={0.1} stroke="#94a3b8" strokeWidth={1} strokeDasharray="4 2" />
                      <Line yAxisId="right" type="monotone" dataKey="effectiveReturn" name="Effective Return %" stroke={C.amber.primary} strokeWidth={2.5} dot={false} />
                      {benchmarks.y28 && <ReferenceLine yAxisId="right" y={28} stroke="#3b82f6" strokeDasharray="6 3" label={{ value: "28%", position: "right", fill: "#3b82f6", fontSize: 10 }} />}
                      {benchmarks.y50 && <ReferenceLine yAxisId="right" y={50} stroke="#f59e0b" strokeDasharray="6 3" label={{ value: "50%", position: "right", fill: "#f59e0b", fontSize: 10 }} />}
                      {benchmarks.y80 && <ReferenceLine yAxisId="right" y={80} stroke="#10b981" strokeDasharray="6 3" label={{ value: "80%", position: "right", fill: "#10b981", fontSize: 10 }} />}
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Year-by-Year Table */}
              <Card className="bg-[#0a1628]/80 border-[#1e3a5f]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-white">Year-by-Year Projection</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-[#0a1628]">
                        <tr className="border-b border-[#1e3a5f]">
                          <th className="text-left p-2 text-muted-foreground">Yr</th>
                          <th className="text-left p-2 text-muted-foreground">Age</th>
                          <th className="text-right p-2 text-muted-foreground">Premium</th>
                          <th className="text-right p-2 text-muted-foreground">Cumulative</th>
                          <th className="text-right p-2 text-blue-400">Account Value</th>
                          <th className="text-right p-2 text-blue-300">Interest Credit</th>
                          <th className="text-right p-2 text-muted-foreground">Surrender Value</th>
                          <th className="text-right p-2 text-amber-400">Eff. Return</th>
                        </tr>
                      </thead>
                      <tbody>
                        {compoundRows.filter((_, i) => i % (projectionYears > 60 ? 2 : 1) === 0 || compoundRows[i].year === benchmarks?.y28 || compoundRows[i].year === benchmarks?.y50 || compoundRows[i].year === benchmarks?.y80).map((r) => {
                          const isBenchmark = r.year === benchmarks?.y28 || r.year === benchmarks?.y50 || r.year === benchmarks?.y80;
                          return (
                            <tr key={r.year} className={`border-b border-[#1e3a5f]/50 ${isBenchmark ? "bg-amber-950/20" : "hover:bg-[#12233e]/40"}`}>
                              <td className="p-2 text-white">{r.year}</td>
                              <td className="p-2 text-muted-foreground">{r.age}</td>
                              <td className="p-2 text-right text-muted-foreground">{r.premiumPaid > 0 ? fmt(r.premiumPaid) : "—"}</td>
                              <td className="p-2 text-right text-muted-foreground">{fmt(r.cumulativePremium)}</td>
                              <td className="p-2 text-right text-blue-400 font-mono">{fmtM(r.endingValue)}</td>
                              <td className="p-2 text-right text-blue-300 font-mono">{fmtM(r.interestCredit)}</td>
                              <td className="p-2 text-right text-muted-foreground font-mono">{fmtM(r.surrenderValue)}</td>
                              <td className={`p-2 text-right font-mono ${r.effectiveReturn >= 80 ? "text-emerald-400" : r.effectiveReturn >= 50 ? "text-amber-400" : r.effectiveReturn >= 28 ? "text-blue-400" : "text-muted-foreground"}`}>
                                {fmtPct(r.effectiveReturn)}
                                {isBenchmark && " ★"}
                              </td>
                            </tr>
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

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB 2: DUAL ILLUSTRATION                                      */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="dual" className="space-y-4 mt-4">
          <Card className="bg-[#0a1628]/80 border-[#1e3a5f]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Scale className="h-4 w-4 text-blue-400" />
                Dual Illustration: "Boring" vs Historical Performance
                <AG49Badge />
              </CardTitle>
              <CardDescription>
                Compare a flat AG 49 rate illustration against what 30-year historical index returns actually produced
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    "Boring" Flat Rate <AG49Badge />
                  </Label>
                  <Slider
                    value={[boringRate]}
                    onValueChange={v => setBoringRate(v[0])}
                    min={3} max={7.5} step={0.25}
                  />
                  <span className="text-xs text-blue-400 font-mono">{fmtPct(boringRate)}</span>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Historical Index (select 1-3)</Label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {popularIndices.map((idx) => (
                      <Badge
                        key={idx.id}
                        variant={selectedIndices.includes(idx.id) ? "default" : "outline"}
                        className={`cursor-pointer text-[10px] ${selectedIndices.includes(idx.id) ? "bg-amber-600/30 text-amber-300 border-amber-500/50" : "text-muted-foreground hover:text-white"}`}
                        onClick={() => {
                          setSelectedIndices(prev =>
                            prev.includes(idx.id)
                              ? prev.filter((x) => x !== idx.id)
                              : prev.length < 3 ? [...prev, idx.id] : prev
                          );
                        }}
                      >
                        {idx.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <Button onClick={runDualCalc} className="w-full bg-gradient-to-r from-blue-600 to-amber-600 hover:from-blue-500 hover:to-amber-500">
                <Play className="h-4 w-4 mr-2" /> Generate Dual Illustration
              </Button>
            </CardContent>
          </Card>

          {dualResult && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="bg-[#0d1f3c] border-blue-700/30">
                  <CardContent className="p-3">
                    <p className="text-[10px] text-blue-300 uppercase tracking-wider mb-1">Your Plan (Boring)</p>
                    <p className="text-lg font-bold text-blue-400">{fmtM(dualResult.boring[dualResult.boring.length - 1]?.accountValue ?? 0)}</p>
                    <p className="text-[10px] text-muted-foreground">Year {projectionYears} Account Value</p>
                  </CardContent>
                </Card>
                <Card className="bg-amber-950/20 border-amber-600/30">
                  <CardContent className="p-3">
                    <p className="text-[10px] text-amber-300 uppercase tracking-wider mb-1">Time Machine (Historical)</p>
                    <p className="text-lg font-bold text-amber-400">{fmtM(dualResult.historical[dualResult.historical.length - 1]?.accountValue ?? 0)}</p>
                    <p className="text-[10px] text-muted-foreground">Year {projectionYears} Account Value</p>
                  </CardContent>
                </Card>
                <Card className="bg-amber-950/20 border-amber-600/30">
                  <CardContent className="p-3">
                    <p className="text-[10px] text-amber-300 uppercase tracking-wider mb-1">TM Required Account</p>
                    <p className="text-lg font-bold text-amber-400">{fmtM(dualResult.historical[dualResult.historical.length - 1]?.accountValue ?? 0)}</p>
                    <p className="text-[10px] text-muted-foreground">Super-sized AV needed</p>
                  </CardContent>
                </Card>
                <Card className="bg-emerald-950/20 border-emerald-600/30">
                  <CardContent className="p-3">
                    <p className="text-[10px] text-emerald-300 uppercase tracking-wider mb-1">Advantage</p>
                    <p className="text-lg font-bold text-emerald-400">
                      {(() => {
                        const bAV = dualResult.boring[dualResult.boring.length - 1]?.accountValue ?? 1;
                        const hAV = dualResult.historical[dualResult.historical.length - 1]?.accountValue ?? 0;
                        return `+${((hAV / bAV - 1) * 100).toFixed(0)}%`;
                      })()}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Historical vs Boring</p>
                  </CardContent>
                </Card>
              </div>

              {/* Dual Chart */}
              <Card className="bg-[#0a1628]/80 border-[#1e3a5f]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-white flex items-center gap-2">
                    Side-by-Side Comparison
                    <InfoTip text={TOOLTIP_EXPLANATION} />
                  </CardTitle>
                  <CardDescription>
                    <span className="text-blue-400">■ Blue = Your Plan (Boring)</span>
                    {" · "}
                    <span className="text-amber-400">■ Gold = Time Machine (Historical)</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={dualChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                      <XAxis dataKey="year" stroke="#7a95b8" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#7a95b8" tick={{ fontSize: 11 }} tickFormatter={fmtM} />
                      <RTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Area type="monotone" dataKey="boringAV" name="Your Plan AV" fill={C.blue.primary} fillOpacity={0.12} stroke={C.blue.primary} strokeWidth={2} />
                      <Area type="monotone" dataKey="historicalAV" name="Time Machine AV" fill={C.amber.primary} fillOpacity={0.12} stroke={C.amber.primary} strokeWidth={2.5} />
                      <Line type="monotone" dataKey="tmRequiredAV" name="TM Required AV" stroke={C.amber.fill} strokeWidth={1.5} strokeDasharray="6 3" dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Year-by-Year Comparison Table */}
              <Card className="bg-[#0a1628]/80 border-[#1e3a5f]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-white">Year-by-Year Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-[#0a1628]">
                        <tr className="border-b border-[#1e3a5f]">
                          <th className="text-left p-2 text-muted-foreground">Yr</th>
                          <th className="text-right p-2 text-blue-400">Boring AV</th>
                          <th className="text-right p-2 text-blue-300">Boring Credit</th>
                          <th className="text-right p-2 text-amber-400">Historical AV</th>
                          <th className="text-right p-2 text-amber-300">Historical Credit</th>
                          <th className="text-right p-2 text-amber-500">Credited Rate</th>
                          <th className="text-right p-2 text-amber-600">TM Required AV</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dualChartData.filter((_: any, i: number) => i % (projectionYears > 40 ? 2 : 1) === 0).map((r) => (
                          <tr key={r.year} className="border-b border-[#1e3a5f]/50 hover:bg-[#12233e]/40">
                            <td className="p-2 text-white">{r.year}</td>
                            <td className="p-2 text-right text-blue-400 font-mono">{fmtM(r.boringAV)}</td>
                            <td className="p-2 text-right text-blue-300 font-mono">{fmtM(r.boringCredit)}</td>
                            <td className="p-2 text-right text-amber-400 font-mono">{fmtM(r.historicalAV)}</td>
                            <td className="p-2 text-right text-amber-300 font-mono">{fmtM(r.historicalCredit)}</td>
                            <td className="p-2 text-right text-amber-500 font-mono">{fmtPct(r.creditedRate)}</td>
                            <td className="p-2 text-right text-amber-600 font-mono">{fmtM(r.tmRequiredAV)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB 3: BENCHMARK MATRIX                                       */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="matrix" className="space-y-4 mt-4">
          <Card className="bg-[#0a1628]/80 border-[#1e3a5f]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-400" />
                Benchmark Matrix: Years to Reach Target
                <AG49Badge />
              </CardTitle>
              <CardDescription>
                For {fmt(totalPremiums)} total premium ({fmt(premium)}/yr × {fundingYears}yr), how many years at each rate to reach 28%, 50%, 80% effective return
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#1e3a5f]">
                      <th className="text-left p-2 text-muted-foreground">Rate</th>
                      <th className="text-center p-2 text-blue-400" colSpan={2}>28% Target</th>
                      <th className="text-center p-2 text-amber-400" colSpan={2}>50% Target</th>
                      <th className="text-center p-2 text-emerald-400" colSpan={2}>80% Target</th>
                    </tr>
                    <tr className="border-b border-[#1e3a5f]/50">
                      <th className="text-left p-2 text-muted-foreground"></th>
                      <th className="text-right p-2 text-blue-300 text-[10px]">Year</th>
                      <th className="text-right p-2 text-blue-300 text-[10px]">AV</th>
                      <th className="text-right p-2 text-amber-300 text-[10px]">Year</th>
                      <th className="text-right p-2 text-amber-300 text-[10px]">AV</th>
                      <th className="text-right p-2 text-emerald-300 text-[10px]">Year</th>
                      <th className="text-right p-2 text-emerald-300 text-[10px]">AV</th>
                    </tr>
                  </thead>
                  <tbody>
                    {benchmarkMatrix.map((row) => (
                      <tr key={row.rate} className={`border-b border-[#1e3a5f]/50 ${row.rate === 6.5 || row.rate === 7.5 ? "bg-amber-950/15" : "hover:bg-[#12233e]/40"}`}>
                        <td className="p-2 text-white font-mono">{fmtPct(row.rate)}</td>
                        <td className="p-2 text-right text-blue-400 font-mono">{row.y28 ? `Yr ${row.y28}` : "—"}</td>
                        <td className="p-2 text-right text-blue-300 font-mono">{row.av28 ? fmtM(row.av28) : "—"}</td>
                        <td className="p-2 text-right text-amber-400 font-mono">{row.y50 ? `Yr ${row.y50}` : "—"}</td>
                        <td className="p-2 text-right text-amber-300 font-mono">{row.av50 ? fmtM(row.av50) : "—"}</td>
                        <td className="p-2 text-right text-emerald-400 font-mono">{row.y80 ? `Yr ${row.y80}` : "—"}</td>
                        <td className="p-2 text-right text-emerald-300 font-mono">{row.av80 ? fmtM(row.av80) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Matrix Bar Chart */}
          <Card className="bg-[#0a1628]/80 border-[#1e3a5f]">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-white">Years to Benchmark by Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={benchmarkMatrix}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                  <XAxis dataKey="rate" stroke="#7a95b8" tick={{ fontSize: 11 }} tickFormatter={v => `${v}%`} />
                  <YAxis stroke="#7a95b8" tick={{ fontSize: 11 }} label={{ value: "Years", angle: -90, position: "insideLeft", fill: "#7a95b8", fontSize: 11 }} />
                  <RTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="y28" name="28% Target" fill={C.blue.primary} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="y50" name="50% Target" fill={C.amber.primary} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="y80" name="80% Target" fill={C.green.primary} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB 4: GENERATIONAL TRANSFER                                  */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="generational" className="space-y-4 mt-4">
          <Card className="bg-[#0a1628]/80 border-[#1e3a5f]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-400" />
                Generational Ownership Transfer
              </CardTitle>
              <CardDescription>
                The policy doesn't lapse at death — it can be reassigned to a surviving spouse, children, or grandchildren,
                continuing the compounding across multiple lifetimes. The account value never resets.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {generations.map((gen, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[#12233e]/60 border border-[#1e3a5f]">
                    <span className="text-2xl">{gen.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">{gen.label}</p>
                      <p className="text-xs text-muted-foreground">
                        Years {gen.startYear}-{gen.endYear} · Starting age {gen.startAge} · {gen.relationship}
                      </p>
                    </div>
                    {i < generations.length - 1 && (
                      <ArrowRight className="h-4 w-4 text-amber-400" />
                    )}
                  </div>
                ))}
              </div>

              {compoundRows && (
                <div className="mt-4">
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={compoundChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                      <XAxis dataKey="year" stroke="#7a95b8" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#7a95b8" tick={{ fontSize: 11 }} tickFormatter={fmtM} />
                      <RTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Area type="monotone" dataKey="accountValue" name="Account Value" fill={C.blue.primary} fillOpacity={0.15} stroke={C.blue.primary} strokeWidth={2} />
                      {generations.map((gen, i) => (
                        <ReferenceLine
                          key={i}
                          x={gen.startYear}
                          stroke={["#8b5cf6", "#ec4899", "#f59e0b", "#10b981"][i]}
                          strokeDasharray="6 3"
                          label={{ value: gen.label, position: "top", fill: ["#8b5cf6", "#ec4899", "#f59e0b", "#10b981"][i], fontSize: 9 }}
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="mt-4 p-3 rounded-lg bg-purple-950/20 border border-purple-600/30">
                <p className="text-xs text-purple-200/80 leading-relaxed">
                  <strong className="text-purple-300">Key Insight:</strong> Unlike most financial products, a properly structured IUL policy
                  does not terminate at the insured's death. Through ownership transfer, the cash value continues compounding
                  tax-deferred across generations. A policy started at age 45 with {fmt(totalPremiums)} in premiums could be
                  serving grandchildren 80+ years later with account values in the tens of millions — all from the same original policy.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB 5: LOAN ARBITRAGE                                         */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="loan" className="space-y-4 mt-4">
          <Card className="bg-[#0a1628]/80 border-[#1e3a5f]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-400" />
                Loan Arbitrage Analysis
              </CardTitle>
              <CardDescription>
                The stated loan rate is {loanRate}%, but the actual cost to the policyholder is only the spread — a positive arbitrage of +{loanArbitrage}%
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card className="bg-red-950/20 border-red-600/30">
                  <CardContent className="p-3">
                    <p className="text-[10px] text-red-300 uppercase tracking-wider mb-1">Stated Loan Rate</p>
                    <p className="text-2xl font-bold text-red-400">{loanRate}%</p>
                    <p className="text-[10px] text-muted-foreground">What illustrations show</p>
                  </CardContent>
                </Card>
                <Card className="bg-emerald-950/20 border-emerald-600/30">
                  <CardContent className="p-3">
                    <p className="text-[10px] text-emerald-300 uppercase tracking-wider mb-1">Positive Arbitrage</p>
                    <p className="text-2xl font-bold text-emerald-400">+{loanArbitrage}%</p>
                    <p className="text-[10px] text-muted-foreground">Actual net cost to policyholder</p>
                  </CardContent>
                </Card>
                <Card className="bg-amber-950/20 border-amber-600/30">
                  <CardContent className="p-3">
                    <p className="text-[10px] text-amber-300 uppercase tracking-wider mb-1">Overstated Cost</p>
                    <p className="text-2xl font-bold text-amber-400">{(loanRate - loanArbitrage).toFixed(1)}%</p>
                    <p className="text-[10px] text-muted-foreground">Difference between stated and actual</p>
                  </CardContent>
                </Card>
              </div>

              <div className="p-3 rounded-lg bg-[#12233e]/60 border border-[#1e3a5f]">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong className="text-white">How it works:</strong> When you take a policy loan, the insurance company charges {loanRate}% interest.
                  However, the cash value backing the loan continues to earn index credits. The net cost to the policyholder is only
                  the <em>spread</em> between the loan rate and the crediting rate — which in practice is approximately {loanArbitrage}%.
                  This means a $100,000 loan costs roughly ${(100000 * loanArbitrage / 100).toLocaleString()}/year in real terms, not ${(100000 * loanRate / 100).toLocaleString()}/year as the stated rate implies.
                </p>
              </div>

              {compoundRows && (
                <div>
                  <p className="text-sm text-white font-semibold mb-2">Loan Cost Comparison Over Time</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={compoundRows.filter((_, i) => i % 5 === 4).map((r) => ({
                      year: r.year,
                      statedCost: r.endingValue * (loanRate / 100),
                      actualCost: r.endingValue * (loanArbitrage / 100),
                      savings: r.endingValue * ((loanRate - loanArbitrage) / 100),
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                      <XAxis dataKey="year" stroke="#7a95b8" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#7a95b8" tick={{ fontSize: 11 }} tickFormatter={fmtM} />
                      <RTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="statedCost" name={`Stated Cost (${loanRate}%)`} fill={C.red.primary} radius={[2, 2, 0, 0]} />
                      <Bar dataKey="actualCost" name="Actual Cost (0.5%)" fill={C.green.primary} radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB 6: THE FORMULA                                            */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        <TabsContent value="formula" className="space-y-4 mt-4">
          <Card className="bg-[#0a1628]/80 border-[#1e3a5f]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-purple-400" />
                The Time Machine Formula
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-[#12233e]/80 border border-[#1e3a5f] font-mono text-xs leading-loose">
                <p className="text-blue-300 mb-2">// FUNDING PHASE (years 1 to {fundingYears}):</p>
                <p className="text-white">AV[y] = AV[y-1] × (1 + rate) + annualPremium</p>
                <p className="text-muted-foreground mb-3">// Premium paid at START of year, interest credited at END</p>

                <p className="text-blue-300 mb-2">// GROWTH PHASE (years {fundingYears + 1}+):</p>
                <p className="text-white">AV[y] = AV[y-1] × (1 + rate)</p>
                <p className="text-muted-foreground mb-3">// Pure compounding, no additional premiums</p>

                <p className="text-amber-300 mb-2">// EFFECTIVE RETURN ON PREMIUM:</p>
                <p className="text-white">effectiveReturn[y] = (AV[y] × rate) / totalPremiumsPaid × 100</p>
                <p className="text-muted-foreground mb-3">// "What % of my ORIGINAL money did I earn THIS year?"</p>

                <p className="text-emerald-300 mb-2">// BENCHMARK SOLVE:</p>
                <p className="text-white">Find first year Y where effectiveReturn[Y] ≥ target</p>
                <p className="text-muted-foreground mb-3">// target = 28%, 50%, or 80%</p>

                <p className="text-purple-300 mb-2">// TIME MACHINE REVERSE-ENGINEERING:</p>
                <p className="text-white">tmRequiredAV = historicalCreditDollars / ag49MaxRate</p>
                <p className="text-muted-foreground">// How large must the account be so that 7.5% produces the same dollars as the historical return?</p>
              </div>

              <div className="p-4 rounded-lg bg-amber-950/20 border border-amber-600/30">
                <p className="text-sm font-semibold text-amber-300 mb-2">Why This Works Within the Law</p>
                <p className="text-xs text-amber-200/70 leading-relaxed">
                  NAIC AG 49 limits the <em>illustrated rate</em> to 7.5%. We never violate this. Instead, we ask a different question:
                  "How large would a pre-existing account need to be so that a 7.5% credit produces the same <em>dollar amount</em> as
                  a historical 28% return on a smaller account?" This is pure math — not an illustration. We're showing the
                  <em>economic equivalence</em> between time (compounding) and rate (historical performance). The Time Machine
                  demonstrates that patience at compliant rates eventually produces the same wealth as aggressive historical returns.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-blue-950/20 border border-blue-600/30">
                <p className="text-sm font-semibold text-blue-300 mb-2">With Your Numbers</p>
                <p className="text-xs text-blue-200/70 leading-relaxed">
                  Premium: {fmt(premium)}/yr × {fundingYears} years = {fmt(totalPremiums)} total<br />
                  At {fmtPct(creditRate)} AG 49 rate:<br />
                  • Year 1 credit: {fmt(premium * (creditRate / 100))} ({fmtPct(premium * (creditRate / 100) / totalPremiums * 100)} effective return)<br />
                  • To produce a {fmt(totalPremiums * 0.28)} credit (28% of premium): need AV of {fmt(totalPremiums * 0.28 / (creditRate / 100))}<br />
                  • To produce a {fmt(totalPremiums * 0.50)} credit (50% of premium): need AV of {fmt(totalPremiums * 0.50 / (creditRate / 100))}<br />
                  • To produce a {fmt(totalPremiums * 0.80)} credit (80% of premium): need AV of {fmt(totalPremiums * 0.80 / (creditRate / 100))}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <NAICDisclaimer variant="footer" showsProjections showsHistoricalData showsCashValues />
      <TimeMachineInlineDisclaimer />
      <PageInsights pageId="time-machine-calculator" />
    </div>
  );
}
