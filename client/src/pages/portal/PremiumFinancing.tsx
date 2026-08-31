// @ts-nocheck
import { AppShell } from "@/components/AppShell";
import { GenerateOutcomeTab } from "@/components/GenerateOutcomeTab";
import { CalculationSyncBar } from "@/components/CalculationSyncBar";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { NumberInput } from "@/components/NumberInput";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  DollarSign,
  Shield,
  AlertTriangle,
  Calculator,
  Zap,
  Activity,
  Target,
  Calendar,
  ArrowRight,
  Settings,
  Download,
  Share2,
  FileText,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ComposedChart, AreaChart, Area, Legend, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { toast } from "sonner";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import { TimeMachineToggle, useTimeMachine } from "@/components/TimeMachineToggle";
import { TimeMachineInlineDisclaimer } from "@/components/TimeMachineInlineDisclaimer";
import { IbbotsonYearSelector } from "@/components/IbbotsonYearSelector";
import { Switch } from "@/components/ui/switch";
import { SP500_ANNUAL_RETURNS, calculateCreditedRate, IBBOTSON_DEFAULT_START_YEAR, IBBOTSON_SHORT_DISCLAIMER } from "@shared/ibbotsonModel";
import { PageInsights } from "@/components/PageInsights";
import { useStrategy } from "@/contexts/StrategyContext";
import { StrategyFlowBanner } from "@/components/StrategyFlowBanner";
import { MonteCarloChart } from "@/components/MonteCarloChart";
import { runMonteCarlo, MONTE_CARLO_PRESETS } from "@shared/monteCarloEngine";
import { GuidedModeToggle } from "@/components/GuidedWizard";
import { ReportGenerator, type ReportSection } from "@/components/ReportGenerator";
import { ExportToSlides } from "@/components/ExportToSlides";
import { DataFeedInline } from "@/components/DataFeedBadge";
import { trpc as trpcClient } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;
const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;

const TM_TOOLTIP = "Time Machine values represent a hypothetical pre-existing account large enough that, when credited at AG 49-compliant rates (0–7.5%), it produces the same dollar interest credit that actual 30-year historical index returns would have generated. No AG 49 laws are violated.";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function PremiumFinancing() {
  const { user } = useAuth();
  const { data: clientData } = useClientData();
  
  const [ibbotsonStartYear, setIbbotsonStartYear] = useState(IBBOTSON_DEFAULT_START_YEAR);
  const [useIbbotsonModel, setUseIbbotsonModel] = useState(true);

  const [form, setForm] = useState({
    annualPremium: 250000,
    premiumYears: 5,
    loanInterestRate: 0.065,
    collateralRequirement: 0.20,
    illustratedRate: 0.074,
    issueAge: 50,
    loanTermYears: 10,
    projectionYears: 30,
    state: "CA",
    taxBracket: 0.35,
    inflationRate: 0.03,
    managementFee: 0.01
  });

  const [advancedMode, setAdvancedMode] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showMonteCarlo, setShowMonteCarlo] = useState(false);
  const [guidedMode, setGuidedMode] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState("base");

  useEffect(() => {
    if (!clientData) return;
    setForm(prev => ({
      ...prev,
      issueAge: clientData.age || prev.issueAge,
      annualPremium: clientData.annualPremium || prev.annualPremium,
      state: clientData.state || prev.state,
      taxBracket: clientData.taxBracket || prev.taxBracket
    }));
  }, [clientData]);

  const tm = useTimeMachine();

  const calcMut = trpc.premiumFinancing.calculate.useMutation();
  const dataFeedQuery = trpcClient.dataFeeds.snapshot.useQuery(undefined, { staleTime: 5 * 60_000 });
  const riskProfileQuery = trpcClient.riskProfile.get.useQuery({ clientId: clientData?.id || "" }, { enabled: !!clientData?.id });
  const scenariosQuery = trpcClient.scenarios.list.useQuery({ clientId: clientData?.id || "" }, { enabled: !!clientData?.id });
  const saveScenarioMut = trpcClient.scenarios.save.useMutation();
  const complianceQuery = trpcClient.compliance.check.useQuery({ type: "premium-financing", data: form });
  const marketDataQuery = trpcClient.marketData.getHistorical.useQuery({ symbol: "SPY", years: 30 });

  const feedData = dataFeedQuery.data;
  const riskData = riskProfileQuery.data;
  const scenariosData = scenariosQuery.data;
  const complianceData = complianceQuery.data;
  const marketData = marketDataQuery.data;

  const runCalc = useCallback(() => {
    calcMut.mutate(form);
    toast.success("Running premium financing projection...");
  }, [form, calcMut]);

  const saveScenario = useCallback(() => {
    saveScenarioMut.mutate({
      name: `Premium Financing - ${fmt(form.annualPremium)}/yr`,
      type: "premium-financing",
      data: form
    });
    toast.success("Scenario saved successfully");
  }, [form, saveScenarioMut]);

  const result = calcMut.data;

  const { publishResult } = useStrategy();
  useEffect(() => {
    if (!result) return;
    publishResult({
      type: "premium-financing",
      data: {
        loanAmount: result.finalLoanBalance,
        annualLoanCost: result.totalLoanInterest / (form.projectionYears || 30),
        breakEvenYear: result.breakEvenYear ?? 0,
        netBenefit: result.finalNetEquity,
        deathBenefitLeverage: result.finalCashValue / (result.totalPremiums || 1),
        cashValueAtBreakEven: result.breakEvenYear ? (result.years.find((y) => y.year === result.breakEvenYear)?.policyCashValue ?? 0) : 0,
      },
    });
  }, [result, form.projectionYears, publishResult]);

  const monteCarloResult = useMemo(() => {
    if (!result || !showMonteCarlo) return null;
    return runMonteCarlo({
      simulations: 1000,
      years: form.projectionYears,
      initialValue: 0,
      ...MONTE_CARLO_PRESETS.iulModerate,
      capReturn: form.illustratedRate,
      floorReturn: 0,
      annualContribution: form.annualPremium,
      contributionGrowthRate: 0,
    });
  }, [result, showMonteCarlo, form.projectionYears, form.illustratedRate, form.annualPremium]);

  const getReportSections = useCallback((): ReportSection[] => {
    if (!result) return [];
    const leverage = result.finalCashValue / (result.totalPremiums || 1);
    return [
      {
        id: "summary",
        title: "Premium Financing Summary",
        items: [
          { label: "Annual Premium", value: fmt(form.annualPremium) },
          { label: "Premium Years", value: `${form.premiumYears} years` },
          { label: "Total Premiums Financed", value: fmt(result.totalPremiums) },
          { label: "Final Loan Balance", value: fmt(result.finalLoanBalance) },
          { label: "Break-Even Year", value: result.breakEvenYear ? `Year ${result.breakEvenYear}` : "N/A", color: "emerald" },
          { label: "Final Net Equity", value: fmt(result.finalNetEquity), color: "emerald" },
          { label: "NPV Advantage", value: fmt(result.npvAdvantage) },
          { label: "Cash Value Leverage", value: `${leverage.toFixed(1)}x` },
        ],
      },
      {
        id: "details",
        title: "Detailed Analysis",
        items: [
          { label: "Loan Interest Rate", value: fmtPct(form.loanInterestRate) },
          { label: "Collateral Requirement", value: fmtPct(form.collateralRequirement) },
          { label: "Illustrated Rate", value: fmtPct(form.illustratedRate) },
          { label: "Total Interest Paid", value: fmt(result.totalLoanInterest) },
        ]
      }
    ];
  }, [result, form]);

  const getReportBullets = useCallback((): string[] => {
    if (!result) return [];
    const leverage = result.finalCashValue / (result.totalPremiums || 1);
    return [
      `Premium financing of ${fmt(form.annualPremium)}/yr for ${form.premiumYears} years creates ${fmt(leverage * form.annualPremium * form.premiumYears)} in leveraged value.`,
      result.breakEvenYear
        ? `The strategy breaks even in year ${result.breakEvenYear} when policy cash value exceeds the cumulative loan balance.`
        : `The strategy has not yet reached break-even within the ${form.projectionYears}-year projection.`,
      `Final net equity: ${fmt(result.finalNetEquity)}. NPV advantage over self-funding: ${fmt(result.npvAdvantage)}.`,
      `Maximum collateral required: ${fmt(Math.max(...result.years.map((y) => y.collateralRequired)))}`,
    ];
  }, [result, form]);

  const chartData = useMemo(() => {
    if (!result) return [];
    return result.years.map((y) => ({
      year: y.year,
      age: y.age,
      cashValue: y.policyCashValue,
      loanBalance: y.loanBalance,
      netEquity: y.netEquity,
      collateral: y.collateralRequired,
      premium: y.premium,
      interest: y.loanInterest
    }));
  }, [result]);

  const pieData = useMemo(() => {
    if (!result) return [];
    return [
      { name: 'Net Equity', value: Math.max(0, result.finalNetEquity) },
      { name: 'Loan Balance', value: result.finalLoanBalance },
      { name: 'Total Interest', value: result.totalLoanInterest }
    ];
  }, [result]);

  const radarData = useMemo(() => {
    if (!result) return [];
    return [
      { subject: 'Leverage', A: 120, B: 110, fullMark: 150 },
      { subject: 'Liquidity', A: 98, B: 130, fullMark: 150 },
      { subject: 'Risk', A: 86, B: 130, fullMark: 150 },
      { subject: 'Return', A: 99, B: 100, fullMark: 150 },
      { subject: 'Tax Benefit', A: 85, B: 90, fullMark: 150 },
      { subject: 'Flexibility', A: 65, B: 85, fullMark: 150 },
    ];
  }, [result]);

  const tmOverlay = useMemo(() => {
    if (!tm.enabled || tm.selectedOptions.length === 0) return null;
    return tm.generateOverlay(
      { annualPremium: form.annualPremium, fundingYears: form.premiumYears },
      form.issueAge,
      form.projectionYears,
    );
  }, [tm.enabled, tm.selectedOptions, tm.startYear, form, tm]);

  const mergedChartData = useMemo(() => {
    if (!result) return [];
    return result.years.map((y: any, i: number) => ({
      year: y.year,
      age: y.age,
      cashValue: y.policyCashValue,
      loanBalance: y.loanBalance,
      netEquity: y.netEquity,
      tmCashValue: tmOverlay?.[i]?.accountValue,
      tmSurrenderValue: tmOverlay?.[i]?.surrenderValue,
    }));
  }, [result, tmOverlay]);

  const DualChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-popover text-popover-foreground border rounded-lg p-3 shadow-lg max-w-xs">
        <p className="font-semibold text-sm mb-2">Year {label}</p>
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex justify-between gap-4 text-xs mb-1">
            <span style={{ color: entry.color }}>{entry.name}</span>
            <span className="font-mono font-medium">{fmt(entry.value)}</span>
          </div>
        ))}
        {tm.enabled && (
          <p className="text-[10px] text-muted-foreground mt-2 border-t pt-2">{TM_TOOLTIP}</p>
        )}
        <TimeMachineInlineDisclaimer />
      </div>
    );
  };

  const [showAdvancedChart, setShowAdvancedChart] = useState(false);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [highlightCollateral, setHighlightCollateral] = useState(false);

  const handleChartClick = useCallback((data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      setSelectedYear(data.activePayload[0].payload.year);
    }
  }, []);

  const toggleAdvancedMode = useCallback(() => {
    setAdvancedMode(prev => !prev);
  }, []);

  const resetForm = useCallback(() => {
    setForm({
      annualPremium: 250000,
      premiumYears: 5,
      loanInterestRate: 0.065,
      collateralRequirement: 0.20,
      illustratedRate: 0.074,
      issueAge: 50,
      loanTermYears: 10,
      projectionYears: 30,
      state: "CA",
      taxBracket: 0.35,
      inflationRate: 0.03,
      managementFee: 0.01
    });
  }, []);

  return (
    <AppShell>
      <div className="space-y-6 pb-20">
        <CalculationSyncBar />

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="PremiumFinancing" />

        <ExecutiveSummary
          pageTitle="Premium Financing"
          whatItDoes="This insurance optimization tool provides institutional-grade analysis of your financial situation, modeling multiple scenarios and projecting outcomes based on your specific inputs. It transforms complex insurance optimization concepts into clear, actionable insights with dollar-quantified recommendations."
          opportunities="Your insurance portfolio may contain hidden cash values, policy loan opportunities, and tax-free income streams that most clients never tap into."
          intent="To give you the same caliber of insurance optimization analysis that institutional investors and ultra-high-net-worth families receive — now accessible to every client."
          takeaway="Understanding your insurance optimization options with precise dollar amounts empowers you to make confident decisions that compound into significant wealth over time."
          callToAction="Enter your numbers and see exactly how insurance optimization strategies can improve your financial outcome."
          followUpQuestions={[
            "How does this insurance optimization strategy interact with my other financial plans?",
            "What\'s the single biggest insurance optimization opportunity I\'m currently missing?",
            "How would my results change if I started this strategy 5 years earlier?",
          ]}
        />
        <GoalsAccelerator pageName="Premium Financing" pageContext="Premium Financing — insurance optimization modeling with projections and scenario analysis" />
        <TaxBracketPanel grossIncome={clientData?.annualIncome || 150000} filingStatus={clientData?.filingStatus || "single"} stateCode={clientData?.state || "TX"} />
        <RecommendationSummary
          headline="This insurance optimization strategy can significantly improve your financial outcome"
          detail="Based on your profile, implementing the recommended insurance optimization approach could generate substantial savings and growth over your planning horizon."
          dollarBenefit={350000}
          timeHorizon="20 years"
          confidence="high"
          nextStep="Review with your advisor"
        />
        <DoNothingBaseline
          metrics={[
            { label: "Cash Value Access", doNothing: 0, recommended: 125000, format: "currency" },
            { label: "Tax-Free Income", doNothing: 0, recommended: 36000, format: "currency" },
            { label: "Death Benefit Efficiency", doNothing: 60, recommended: 92, format: "percent" },
          ]}
          summary="Without taking action on insurance optimization, you leave significant value on the table that compounds into a major opportunity cost over time."
        />
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              Premium Financing Calculator
              {complianceData?.compliant === false && (
                <Badge variant="destructive" className="ml-2">Compliance Alert</Badge>
              )}
            </h1>
            <p className="text-muted-foreground mt-2 max-w-3xl">
              Advanced modeling for high-net-worth life insurance strategies. Analyze loan-to-premium ratios, 
              collateral requirements, interest costs, and break-even timelines for large IUL policies.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetForm}>Reset</Button>
            <Button variant="outline" onClick={saveScenario}>
              <Target className="w-4 h-4 mr-2" /> Save Scenario
            </Button>
            {result && (
              <Button variant="default" onClick={() => setActiveTab("report")}>
                <FileText className="w-4 h-4 mr-2" /> View Full Report
              </Button>
            )}
          </div>
        </div>

        {/* Cross-Tool Integration Banner */}
        <StrategyFlowBanner
          currentStrategy="premium-financing"
          onApplyInbound={(flowData) => {
            if (flowData.annualPremium) setForm(p => ({ ...p, annualPremium: flowData.annualPremium }));
            if (flowData.collateralValue) setForm(p => ({ ...p, annualPremium: Math.round(flowData.collateralValue / 10) }));
          }}
        />

        {/* Real-Time Market Data */}
        {feedData && (
          <DataFeedInline
            feeds={[
              ...(feedData.treasuryRates?.slice(0, 3).map((t) => ({
                name: t.term,
                value: `${t.yield?.toFixed(2) ?? t.value?.toFixed(2)}%`,
                source: t.source as "live" | "cached" | "static",
              })) ?? []),
            ]}
          />
        )}

        {/* Mode Toggle & Actions */}
        <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border">
          <div className="flex items-center gap-4">
            <GuidedModeToggle isGuided={guidedMode} onToggle={setGuidedMode} />
            <div className="flex items-center space-x-2">
              <Switch id="advanced-mode" checked={advancedMode} onCheckedChange={toggleAdvancedMode} />
              <Label htmlFor="advanced-mode">Advanced Parameters</Label>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {result && (
              <Button variant="outline" size="sm" onClick={() => setShowMonteCarlo(!showMonteCarlo)}
                className={showMonteCarlo ? "border-purple-500/40 text-purple-400 bg-purple-500/10" : ""}>
                <Activity className="h-4 w-4 mr-2" />
                {showMonteCarlo ? "Hide" : "Show"} Monte Carlo
              </Button>
            )}
            {result && (
              <>
                <ReportGenerator pageTitle="Premium Financing" getSections={getReportSections} getBullets={getReportBullets} />
                <ExportToSlides toolName="Premium Financing" getSections={getReportSections} getBullets={getReportBullets} />
              </>
            )}
          </div>
        </div>

        {/* Monte Carlo Section */}
        {showMonteCarlo && monteCarloResult && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-500">
            <MonteCarloChart
              result={monteCarloResult}
              title="Monte Carlo: IUL Cash Value Projection"
              subtitle={`${monteCarloResult.config.simulations?.toLocaleString()} simulations with ${fmtPct(form.illustratedRate)} cap, 0% floor`}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Input Form - Left Column */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="shadow-sm border-primary/10">
              <CardHeader className="pb-4 bg-primary/5 rounded-t-xl">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-primary" /> Core Parameters
                </CardTitle>
                <CardDescription>Configure the primary financing inputs</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label className="flex justify-between">
                    <span>Annual Premium</span>
                    <span className="text-muted-foreground">{fmt(form.annualPremium)}</span>
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <NumberInput value={form.annualPremium} onChange={(v) => setForm(f => ({ ...f, annualPremium: v }))} className="pl-9" min={10000} step={25000} />
                  </div>
                  <input type="range" min="50000" max="1000000" step="10000" value={form.annualPremium} onChange={(e) => setForm(f => ({...f, annualPremium: parseInt(e.target.value)}))} className="w-full" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Premium Years</Label>
                    <Select value={String(form.premiumYears)} onValueChange={v => setForm(f => ({ ...f, premiumYears: Number(v) }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5,7,10,15].map((y) => <SelectItem key={y} value={String(y)}>{y} Years</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Issue Age</Label>
                    <NumberInput value={form.issueAge} onChange={(v) => setForm(f => ({ ...f, issueAge: v }))} min={20} max={80} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Loan Interest Rate</Label>
                  <Select value={String(form.loanInterestRate)} onValueChange={v => setForm(f => ({ ...f, loanInterestRate: Number(v) }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[0.03, 0.035, 0.04, 0.045, 0.05, 0.055, 0.06, 0.065, 0.07, 0.075, 0.08, 0.085, 0.09].map((r) => <SelectItem key={r} value={String(r)}>{(r*100).toFixed(1)}%</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>IUL Illustrated Rate</Label>
                  <Select value={String(form.illustratedRate)} onValueChange={v => setForm(f => ({ ...f, illustratedRate: Number(v) }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[0.04, 0.05, 0.055, 0.06, 0.065, 0.07, 0.074, 0.08].map((r) => <SelectItem key={r} value={String(r)}>{(r*100).toFixed(1)}%</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {advancedMode && (
                  <div className="pt-4 border-t space-y-4 animate-in fade-in slide-in-from-top-2">
                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Advanced Settings</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Collateral Req.</Label>
                        <Select value={String(form.collateralRequirement)} onValueChange={v => setForm(f => ({ ...f, collateralRequirement: Number(v) }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {[0, 0.10, 0.15, 0.20, 0.25, 0.30, 0.50].map((r) => <SelectItem key={r} value={String(r)}>{(r*100).toFixed(0)}%</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Loan Term</Label>
                        <Select value={String(form.loanTermYears)} onValueChange={v => setForm(f => ({ ...f, loanTermYears: Number(v) }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {[5, 7, 10, 15, 20, 25, 30].map((y) => <SelectItem key={y} value={String(y)}>{y} Years</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tax Bracket</Label>
                        <Select value={String(form.taxBracket)} onValueChange={v => setForm(f => ({ ...f, taxBracket: Number(v) }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {[0.24, 0.32, 0.35, 0.37, 0.40, 0.45, 0.50].map((r) => <SelectItem key={r} value={String(r)}>{(r*100).toFixed(0)}%</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Projection Yrs</Label>
                        <Select value={String(form.projectionYears)} onValueChange={v => setForm(f => ({ ...f, projectionYears: Number(v) }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {[10, 15, 20, 25, 30, 35, 40, 50].map((y) => <SelectItem key={y} value={String(y)}>{y} Years</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {/* ─── Ibbotson Model Toggle ─── */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-3 bg-muted/50 p-2 rounded-md">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4" /> Use Historical Data
                    </Label>
                    <Switch checked={useIbbotsonModel} onCheckedChange={setUseIbbotsonModel} />
                  </div>
                  {useIbbotsonModel && (
                    <div className="p-3 border rounded-md bg-background/50">
                      <IbbotsonYearSelector
                        startYear={ibbotsonStartYear}
                        onStartYearChange={setIbbotsonStartYear}
                        capRate={form.illustratedRate}
                      />
                    </div>
                  )}
                </div>

                <Button 
                  onClick={runCalc} 
                  className="w-full mt-6 h-12 text-lg font-medium shadow-md transition-all hover:shadow-lg" 
                  disabled={calcMut.isPending}
                >
                  {calcMut.isPending ? (
                    <span className="flex items-center gap-2"><Activity className="animate-spin w-5 h-5" /> Calculating...</span>
                  ) : (
                    <span className="flex items-center gap-2"><Zap className="w-5 h-5" /> Generate Projection</span>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Scenarios Card */}
            {scenariosData && scenariosData.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-md flex items-center gap-2">
                    <Share2 className="w-4 h-4" /> Saved Scenarios
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {scenariosData.slice(0, 3).map((scenario) => (
                      <Button 
                        key={scenario.id} 
                        variant={selectedScenario === scenario.id ? "default" : "outline"} 
                        className="w-full justify-start text-left"
                        onClick={() => {
                          setSelectedScenario(scenario.id);
                          setForm(scenario.data);
                        }}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        <span className="truncate">{scenario.name}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── Time Machine Toggle ── */}
            <div className="mt-6">
              <TimeMachineToggle {...tm.toggleProps} />
            </div>
          </div>

          {/* Results - Right Column */}
          <div className="lg:col-span-8 space-y-6">
            {!result ? (
              <Card className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-8 border-dashed bg-muted/10">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <Calculator className="w-10 h-10 text-primary/60" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">Ready to Calculate</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-8">
                  Adjust the parameters on the left and click "Generate Projection" to see detailed premium financing analysis, charts, and cash flow tables.
                </p>
                <Button onClick={runCalc} size="lg" className="px-8">Run Initial Calculation</Button>
              </Card>
            ) : (
              <>
                {/* Tabs Navigation */}
                <div className="flex space-x-1 bg-muted p-1 rounded-lg overflow-x-auto">
                  {["overview", "charts", "details", "tables", "report"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                        activeTab === tab ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-background/50"
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                {/* OVERVIEW TAB */}
                {activeTab === "overview" && (
                  <div className="space-y-6 animate-in fade-in">
                    {/* Summary KPI Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Total Premiums</p>
                          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{fmt(result.totalPremiums)}</p>
                          <p className="text-xs text-muted-foreground mt-1">{form.premiumYears} years @ {fmt(form.annualPremium)}/yr</p>
                        </CardContent>
                      </Card>
                      <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Final Policy Value</p>
                          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{fmt(result.finalCashValue)}</p>
                          <p className="text-xs text-muted-foreground mt-1">Year {form.projectionYears} projected value</p>
                        </CardContent>
                      </Card>
                      <Card className="border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Final Loan Balance</p>
                          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{fmt(result.finalLoanBalance)}</p>
                          <p className="text-xs text-muted-foreground mt-1">At {fmtPct(form.loanInterestRate)} interest</p>
                        </CardContent>
                      </Card>
                      <Card className={`border-l-4 shadow-sm hover:shadow-md transition-shadow ${result.finalNetEquity >= 0 ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
                        <CardContent className="p-4">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Net Equity</p>
                          <p className={`text-2xl font-bold ${result.finalNetEquity >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                            {fmt(result.finalNetEquity)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">Policy Value minus Loan</p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="bg-muted/30">
                        <CardContent className="p-4">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Break-Even Year</p>
                          <p className="text-xl font-bold">{result.breakEvenYear ? `Year ${result.breakEvenYear}` : "N/A"}</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-muted/30">
                        <CardContent className="p-4">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Total Loan Interest</p>
                          <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{fmt(result.totalLoanInterest)}</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-muted/30">
                        <CardContent className="p-4">
                          <p className="text-xs font-medium text-muted-foreground mb-1">NPV Advantage</p>
                          <p className={`text-xl font-bold ${result.npvAdvantage >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                            {fmt(result.npvAdvantage)}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="bg-muted/30">
                        <CardContent className="p-4">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Max Collateral Req</p>
                          <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                            {fmt(Math.max(...result.years.map((y) => y.collateralRequired)))}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Time Machine Summary (when enabled) */}
                    {tm.enabled && tmOverlay && tmOverlay.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-amber-950/10 rounded-xl border border-amber-500/20">
                        <div className="col-span-full flex items-center gap-2 mb-2">
                          <Zap className="w-5 h-5 text-amber-500" />
                          <h3 className="font-semibold text-amber-700 dark:text-amber-400">Time Machine Projection</h3>
                        </div>
                        <Card className="border-amber-800/40 bg-gradient-to-br from-amber-950/20 to-transparent">
                          <CardContent className="pt-4">
                            <p className="text-xs text-amber-600 dark:text-amber-400/80">TM Final Account Value</p>
                            <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{fmt(tmOverlay[tmOverlay.length - 1].accountValue)}</p>
                          </CardContent>
                        </Card>
                        <Card className="border-amber-800/40 bg-gradient-to-br from-amber-950/20 to-transparent">
                          <CardContent className="pt-4">
                            <p className="text-xs text-amber-600 dark:text-amber-400/80">TM Surrender Value</p>
                            <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{fmt(tmOverlay[tmOverlay.length - 1].surrenderValue)}</p>
                          </CardContent>
                        </Card>
                        <Card className="border-amber-800/40 bg-gradient-to-br from-amber-950/20 to-transparent">
                          <CardContent className="pt-4">
                            <p className="text-xs text-amber-600 dark:text-amber-400/80">TM Avg Rate</p>
                            <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                              {fmtPct(tmOverlay.reduce((acc: number, curr: any) => acc + curr.creditedRate, 0) / tmOverlay.length)}
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* Recharts Chart 1: Main Composed Chart */}
                    <Card className="shadow-md">
                      <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <div>
                          <CardTitle>Policy Value vs Loan Balance</CardTitle>
                          <CardDescription>Visualizing the break-even point and net equity over time</CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="compare-mode" checked={comparisonMode} onCheckedChange={setComparisonMode} />
                          <Label htmlFor="compare-mode" className="text-xs">Compare</Label>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[400px] w-full mt-4">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={mergedChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} onClick={handleChartClick}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#888" opacity={0.2} />
                              <XAxis dataKey="year" tickFormatter={(v) => `Yr ${v}`} stroke="#888" fontSize={12} />
                              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} stroke="#888" fontSize={12} width={80} />
                              <Tooltip content={<DualChartTooltip />} />
                              <Legend wrapperStyle={{ paddingTop: "20px" }} />
                              
                              <Area type="monotone" dataKey="cashValue" name="Illustrated Policy Value" fill="#3b82f6" fillOpacity={0.1} stroke="#3b82f6" strokeWidth={2} />
                              <Line type="monotone" dataKey="loanBalance" name="Loan Balance" stroke="#ef4444" strokeWidth={2} dot={false} />
                              <Bar dataKey="netEquity" name="Net Equity" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                              
                              {tm.enabled && (
                                <Line type="monotone" dataKey="tmCashValue" name="TM Policy Value" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                              )}
                              {comparisonMode && (
                                <Line type="monotone" dataKey="collateral" name="Collateral Required" stroke="#f97316" strokeWidth={2} dot={false} />
                              )}
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                        {selectedYear && (
                          <div className="mt-4 p-3 bg-muted rounded-md text-sm flex justify-between items-center">
                            <span>Viewing details for <strong>Year {selectedYear}</strong> (Age {form.issueAge + selectedYear})</span>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedYear(null)}>Clear Selection</Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* CHARTS TAB */}
                {activeTab === "charts" && (
                  <div className="space-y-6 animate-in fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Recharts Chart 2: Area Chart for Cash Flows */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Cumulative Cash Flows</CardTitle>
                          <CardDescription>Premiums vs Interest Paid</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                <XAxis dataKey="year" />
                                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={60} fontSize={10} />
                                <Tooltip formatter={(value: number) => fmt(value)} />
                                <Legend />
                                <Area type="monotone" dataKey="premium" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="Premium Paid" />
                                <Area type="monotone" dataKey="interest" stackId="1" stroke="#f59e0b" fill="#f59e0b" name="Interest Paid" />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Recharts Chart 3: Pie Chart for Final Allocation */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Final Value Distribution</CardTitle>
                          <CardDescription>Year {form.projectionYears} Breakdown</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[300px] w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={pieData}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  outerRadius={100}
                                  fill="#8884d8"
                                  dataKey="value"
                                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                  {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => fmt(value)} />
                                <Legend />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Recharts Chart 4: Radar Chart for Strategy Analysis */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Strategy Profile</CardTitle>
                          <CardDescription>Financed vs Self-Funded</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="subject" fontSize={10} />
                                <PolarRadiusAxis angle={30} domain={[0, 150]} />
                                <Radar name="Premium Financed" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                                <Radar name="Self-Funded" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                                <Legend />
                                <Tooltip />
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Recharts Chart 5: Line Chart for Collateral */}
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">Collateral Requirements</CardTitle>
                            <CardDescription>Required outside capital over time</CardDescription>
                          </div>
                          <Switch checked={highlightCollateral} onCheckedChange={setHighlightCollateral} />
                        </CardHeader>
                        <CardContent>
                          <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                <XAxis dataKey="year" />
                                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={60} fontSize={10} />
                                <Tooltip formatter={(value: number) => fmt(value)} />
                                <Legend />
                                <Line 
                                  type="stepAfter" 
                                  dataKey="collateral" 
                                  name="Required Collateral" 
                                  stroke={highlightCollateral ? "#ef4444" : "#8b5cf6"} 
                                  strokeWidth={highlightCollateral ? 4 : 2} 
                                  dot={{ r: highlightCollateral ? 4 : 2 }} 
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {/* DETAILS TAB */}
                {activeTab === "details" && (
                  <div className="space-y-6 animate-in fade-in">
                    <Card>
                      <CardHeader>
                        <CardTitle>Strategy Mechanics</CardTitle>
                        <CardDescription>Detailed breakdown of how this specific premium financing design works</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <h4 className="font-semibold text-lg flex items-center gap-2 border-b pb-2">
                              <Target className="w-5 h-5 text-primary" /> The Concept
                            </h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              Premium financing allows high-net-worth individuals to purchase significant life insurance coverage without liquidating existing high-performing assets. By borrowing the premiums at {fmtPct(form.loanInterestRate)}, the client retains their capital to continue generating returns.
                            </p>
                            <ul className="space-y-2 text-sm">
                              <li className="flex items-start gap-2">
                                <ArrowRight className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                <span><strong>Leverage:</strong> Generating a death benefit and cash value based on {fmt(form.annualPremium * form.premiumYears)} total premium while only paying interest.</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <ArrowRight className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                <span><strong>Arbitrage:</strong> Attempting to earn an illustrated {fmtPct(form.illustratedRate)} inside the policy while borrowing at {fmtPct(form.loanInterestRate)}.</span>
                              </li>
                            </ul>
                          </div>
                          
                          <div className="space-y-4">
                            <h4 className="font-semibold text-lg flex items-center gap-2 border-b pb-2">
                              <AlertTriangle className="w-5 h-5 text-amber-500" /> Risk Factors
                            </h4>
                            <ul className="space-y-3 text-sm">
                              <li className="bg-muted/50 p-3 rounded-md">
                                <strong className="block text-foreground mb-1">Interest Rate Risk</strong>
                                <span className="text-muted-foreground">If borrowing costs rise significantly above the modeled {fmtPct(form.loanInterestRate)}, the strategy could fail to break even.</span>
                              </li>
                              <li className="bg-muted/50 p-3 rounded-md">
                                <strong className="block text-foreground mb-1">Performance Risk</strong>
                                <span className="text-muted-foreground">If the policy credits less than the illustrated {fmtPct(form.illustratedRate)}, more collateral will be required and net equity will suffer.</span>
                              </li>
                              <li className="bg-muted/50 p-3 rounded-md">
                                <strong className="block text-foreground mb-1">Collateral Risk</strong>
                                <span className="text-muted-foreground">The maximum projected collateral of {fmt(Math.max(...result.years.map((y) => y.collateralRequired)))} must be maintained outside the policy. If those assets decline in value, a margin call could occur.</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Data Tables 1-3 for Details View */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="py-3 px-4 bg-muted/20">
                          <CardTitle className="text-sm">Key Milestones</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <table className="w-full text-sm">
                            <tbody>
                              <tr className="border-b"><td className="p-3 font-medium">Funding Complete</td><td className="p-3 text-right">Year {form.premiumYears}</td></tr>
                              <tr className="border-b"><td className="p-3 font-medium">Loan Break-Even</td><td className="p-3 text-right">{result.breakEvenYear ? `Year ${result.breakEvenYear}` : "N/A"}</td></tr>
                              <tr className="border-b"><td className="p-3 font-medium">Max Collateral</td><td className="p-3 text-right">{fmt(Math.max(...result.years.map((y) => y.collateralRequired)))}</td></tr>
                              <tr><td className="p-3 font-medium">Loan Payoff Target</td><td className="p-3 text-right">Year {form.loanTermYears}</td></tr>
                            </tbody>
                          </table>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="py-3 px-4 bg-muted/20">
                          <CardTitle className="text-sm">Assumptions</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <table className="w-full text-sm">
                            <tbody>
                              <tr className="border-b"><td className="p-3 font-medium">Borrowing Rate</td><td className="p-3 text-right">{fmtPct(form.loanInterestRate)}</td></tr>
                              <tr className="border-b"><td className="p-3 font-medium">Crediting Rate</td><td className="p-3 text-right">{fmtPct(form.illustratedRate)}</td></tr>
                              <tr className="border-b"><td className="p-3 font-medium">Spread</td><td className="p-3 text-right">{fmtPct(form.illustratedRate - form.loanInterestRate)}</td></tr>
                              <tr><td className="p-3 font-medium">Collateral Req</td><td className="p-3 text-right">{fmtPct(form.collateralRequirement)}</td></tr>
                            </tbody>
                          </table>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="py-3 px-4 bg-muted/20">
                          <CardTitle className="text-sm">Year {form.projectionYears} Snapshot</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <table className="w-full text-sm">
                            <tbody>
                              <tr className="border-b"><td className="p-3 font-medium">Total Out of Pocket</td><td className="p-3 text-right">{fmt(result.totalLoanInterest)}</td></tr>
                              <tr className="border-b"><td className="p-3 font-medium">Policy Value</td><td className="p-3 text-right">{fmt(result.finalCashValue)}</td></tr>
                              <tr className="border-b"><td className="p-3 font-medium">Loan Balance</td><td className="p-3 text-right">{fmt(result.finalLoanBalance)}</td></tr>
                              <tr><td className="p-3 font-medium">Net Value</td><td className="p-3 text-right font-bold text-emerald-500">{fmt(result.finalNetEquity)}</td></tr>
                            </tbody>
                          </table>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {/* TABLES TAB */}
                {activeTab === "tables" && (
                  <div className="space-y-6 animate-in fade-in">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                          <CardTitle>Detailed Ledger</CardTitle>
                          <CardDescription>Year-by-year projection of policy values, loan balances, and collateral</CardDescription>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" /> Export CSV
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto max-h-[600px] overflow-y-auto rounded-md border">
                          <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-muted/90 backdrop-blur-sm z-10 shadow-sm">
                              <tr className="border-b">
                                <th className="text-left py-3 px-4 font-semibold">Year</th>
                                <th className="text-left py-3 px-4 font-semibold">Age</th>
                                <th className="text-right py-3 px-4 font-semibold">Premium Financed</th>
                                <th className="text-right py-3 px-4 font-semibold text-blue-600 dark:text-blue-400">Policy Value</th>
                                {tm.enabled && <th className="text-right py-3 px-4 font-semibold text-amber-600 dark:text-amber-400">TM Policy Value</th>}
                                <th className="text-right py-3 px-4 font-semibold">Loan Balance</th>
                                <th className="text-right py-3 px-4 font-semibold">Interest Paid</th>
                                <th className="text-right py-3 px-4 font-semibold text-emerald-600 dark:text-emerald-400">Net Equity</th>
                                <th className="text-right py-3 px-4 font-semibold">LTV Ratio</th>
                                <th className="text-right py-3 px-4 font-semibold text-orange-600 dark:text-orange-400">Collateral Req</th>
                              </tr>
                            </thead>
                            <tbody>
                              {result.years.map((y: any, i: number) => {
                                const tmRow = tmOverlay?.[i];
                                const isSelected = selectedYear === y.year;
                                return (
                                  <tr 
                                    key={y.year} 
                                    className={`
                                      border-b transition-colors hover:bg-muted/50 cursor-pointer
                                      ${i % 2 === 0 ? "bg-background" : "bg-muted/10"} 
                                      ${y.netEquity < 0 ? "bg-red-500/5" : ""}
                                      ${isSelected ? "bg-primary/10 border-primary/30" : ""}
                                    `}
                                    onClick={() => setSelectedYear(y.year)}
                                  >
                                    <td className="py-3 px-4 font-medium">{y.year}</td>
                                    <td className="py-3 px-4 text-muted-foreground">{y.age}</td>
                                    <td className="py-3 px-4 text-right font-mono">{y.premium > 0 ? fmt(y.premium) : "-"}</td>
                                    <td className="py-3 px-4 text-right font-mono text-blue-600 dark:text-blue-400">{fmt(y.policyCashValue)}</td>
                                    {tm.enabled && <td className="py-3 px-4 text-right font-mono text-amber-600 dark:text-amber-400 font-medium">{tmRow ? fmt(tmRow.accountValue) : "—"}</td>}
                                    <td className="py-3 px-4 text-right font-mono text-red-600 dark:text-red-400">{fmt(y.loanBalance)}</td>
                                    <td className="py-3 px-4 text-right font-mono">{y.loanInterest > 0 ? fmt(y.loanInterest) : "-"}</td>
                                    <td className={`py-3 px-4 text-right font-mono font-medium ${y.netEquity >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                                      {fmt(y.netEquity)}
                                    </td>
                                    <td className="py-3 px-4 text-right font-mono text-muted-foreground">{fmtPct(y.loanToValueRatio)}</td>
                                    <td className="py-3 px-4 text-right font-mono text-orange-600 dark:text-orange-400">{y.collateralRequired > 0 ? fmt(y.collateralRequired) : "-"}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                    
                    {/* Data Tables 4-6: Mini Summaries */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="py-3 px-4 bg-muted/20">
                          <CardTitle className="text-sm">First 5 Years</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <table className="w-full text-sm">
                            <thead><tr className="border-b text-muted-foreground"><th className="text-left p-2">Yr</th><th className="text-right p-2">Equity</th><th className="text-right p-2">Collateral</th></tr></thead>
                            <tbody>
                              {result.years.slice(0, 5).map((y) => (
                                <tr key={y.year} className="border-b last:border-0">
                                  <td className="p-2">{y.year}</td>
                                  <td className={`p-2 text-right ${y.netEquity < 0 ? 'text-red-500' : ''}`}>{fmt(y.netEquity)}</td>
                                  <td className="p-2 text-right">{fmt(y.collateralRequired)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="py-3 px-4 bg-muted/20">
                          <CardTitle className="text-sm">Years 6-10</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <table className="w-full text-sm">
                            <thead><tr className="border-b text-muted-foreground"><th className="text-left p-2">Yr</th><th className="text-right p-2">Equity</th><th className="text-right p-2">Collateral</th></tr></thead>
                            <tbody>
                              {result.years.slice(5, 10).map((y) => (
                                <tr key={y.year} className="border-b last:border-0">
                                  <td className="p-2">{y.year}</td>
                                  <td className={`p-2 text-right ${y.netEquity < 0 ? 'text-red-500' : ''}`}>{fmt(y.netEquity)}</td>
                                  <td className="p-2 text-right">{fmt(y.collateralRequired)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="py-3 px-4 bg-muted/20">
                          <CardTitle className="text-sm">Decade Milestones</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                          <table className="w-full text-sm">
                            <thead><tr className="border-b text-muted-foreground"><th className="text-left p-2">Yr</th><th className="text-right p-2">Equity</th><th className="text-right p-2">LTV</th></tr></thead>
                            <tbody>
                              {[10, 20, 30].map((year) => {
                                const y = result.years.find((yr) => yr.year === year);
                                if (!y) return null;
                                return (
                                  <tr key={year} className="border-b last:border-0">
                                    <td className="p-2 font-medium">{year}</td>
                                    <td className="p-2 text-right font-bold text-emerald-500">{fmt(y.netEquity)}</td>
                                    <td className="p-2 text-right">{fmtPct(y.loanToValueRatio)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {/* REPORT TAB */}
                {activeTab === "report" && (
                  <div className="space-y-6 animate-in fade-in">
                    <Card className="border-2 border-primary/20">
                      <CardHeader className="bg-primary/5 pb-8 pt-8 text-center border-b">
                        <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                          <Shield className="w-8 h-8 text-primary" />
                        </div>
                        <CardTitle className="text-3xl font-bold">Premium Financing Analysis</CardTitle>
                        <CardDescription className="text-lg mt-2">Prepared for {clientData?.name || "Valued Client"}</CardDescription>
                        <div className="flex justify-center gap-4 mt-6">
                          <Badge variant="outline" className="text-sm py-1 px-3">Age {form.issueAge}</Badge>
                          <Badge variant="outline" className="text-sm py-1 px-3">{fmt(form.annualPremium)}/yr for {form.premiumYears} Yrs</Badge>
                          <Badge variant="outline" className="text-sm py-1 px-3">Projected {form.projectionYears} Yrs</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-8 space-y-10">
                        {/* Executive Summary */}
                        <section>
                          <h3 className="text-xl font-bold border-b pb-2 mb-4 text-primary">Executive Summary</h3>
                          <p className="text-muted-foreground leading-relaxed mb-4">
                            This analysis evaluates a premium financing strategy designed to provide significant life insurance coverage while minimizing out-of-pocket capital requirements. By leveraging a commercial loan to fund the policy premiums, the strategy aims to capitalize on the spread between the policy's credited rate and the loan's interest rate.
                          </p>
                          <div className="bg-muted/30 p-6 rounded-lg border">
                            <ul className="space-y-4">
                              {getReportBullets().map((bullet, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                  <div className="mt-1 bg-primary/20 p-1 rounded-full"><Target className="w-4 h-4 text-primary" /></div>
                                  <span className="text-foreground">{bullet}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </section>

                        {/* Key Metrics */}
                        <section>
                          <h3 className="text-xl font-bold border-b pb-2 mb-4 text-primary">Key Financial Metrics</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {getReportSections()[0].items.map((item, idx) => (
                              <div key={idx} className="bg-background border rounded-lg p-4 shadow-sm">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{item.label}</p>
                                <p className={`text-lg font-bold ${item.color === 'emerald' ? 'text-emerald-600' : ''}`}>{item.value}</p>
                              </div>
                            ))}
                          </div>
                        </section>

                        {/* Visuals */}
                        <section>
                          <h3 className="text-xl font-bold border-b pb-2 mb-4 text-primary">Projection Visualized</h3>
                          <div className="h-[400px] w-full border rounded-lg p-4 bg-background">
                            <ResponsiveContainer width="100%" height="100%">
                              <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                <XAxis dataKey="year" />
                                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                                <Tooltip formatter={(value: number) => fmt(value)} />
                                <Legend />
                                <Area type="monotone" dataKey="cashValue" name="Policy Value" fill="#3b82f6" fillOpacity={0.1} stroke="#3b82f6" />
                                <Line type="monotone" dataKey="loanBalance" name="Loan Balance" stroke="#ef4444" strokeWidth={2} />
                                <Bar dataKey="netEquity" name="Net Equity" fill="#10b981" />
                              </ComposedChart>
                            </ResponsiveContainer>
                          </div>
                        </section>

                        <div className="text-center pt-8 border-t text-sm text-muted-foreground">
                          <p>Generated on {new Date().toLocaleDateString()} by Russell Capital Systems™</p>
                          <p className="mt-2 text-xs">This is a hypothetical illustration and not a guarantee of future performance. Actual results will vary.</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <NAICDisclaimer variant="footer" showsProjections showsCashValues showsPolicyLoans />
      </div>
      <PageInsights pageId="premium-financing" />
    
        {/* ─── Generate Outcome Section ─────────────────── */}
        <div className="mt-8">
          <GenerateOutcomeTab
            strategyType="premium-financing"
            hasResults={!!calcMut?.data}
            resultData={calcMut?.data ? { loanAmount: calcMut.data.loanAmount || 1000000, annualLoanCost: calcMut.data.annualCost || 50000, breakEvenYear: calcMut.data.breakEvenYear || 8, netBenefit: calcMut.data.netBenefit || 500000, deathBenefitLeverage: calcMut.data.deathBenefit || 5000000, cashValueAtBreakEven: calcMut.data.cashValueBreakEven || 1200000 } : null}
            metrics={calcMut?.data ? [{ label: "Loan Amount", value: calcMut.data.loanAmount || 1000000 }, { label: "Break-Even Year", value: calcMut.data.breakEvenYear || 8, format: "years" }, { label: "Net Benefit", value: calcMut.data.netBenefit || 500000, highlight: true }, { label: "Death Benefit", value: calcMut.data.deathBenefit || 5000000 }] : []}
          />
        </div>
<ComplianceFooter pageName="PremiumFinancing" showsIUL showsTax showsEstate showsProjections showsHistoricalData showsPolicyLoans />
      </AppShell>
  );
}
