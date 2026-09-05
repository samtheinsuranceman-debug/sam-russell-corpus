// @ts-nocheck
import { useState, useEffect, useMemo, useCallback } from "react";
import { GenerateOutcomeTab } from "@/components/GenerateOutcomeTab";
import { CalculationSyncBar } from "@/components/CalculationSyncBar";
import { useStrategy } from "@/contexts/StrategyContext";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Shield,
  TrendingUp,
  Info,
  History,
  BookOpen,
  Activity,
  Percent,
  Settings,
  RefreshCw,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
} from "lucide-react";
import { NumberInput } from "@/components/NumberInput";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area, AreaChart, ComposedChart,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import { TimeMachineToggle, useTimeMachine } from "@/components/TimeMachineToggle";
import { ExportToSlides } from "@/components/ExportToSlides";
import type { IllustrationYear } from "@shared/timeMachineEngine";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { TimeMachineInlineDisclaimer } from "@/components/TimeMachineInlineDisclaimer";
import { IbbotsonYearSelector } from "@/components/IbbotsonYearSelector";
import { SP500_ANNUAL_RETURNS as IBBOTSON_RETURNS, IBBOTSON_DEFAULT_START_YEAR, IBBOTSON_START_YEAR, IBBOTSON_END_YEAR, IBBOTSON_SHORT_DISCLAIMER } from "@shared/ibbotsonModel";
import { PageInsights } from "@/components/PageInsights";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

const SP500_ANNUAL_RETURNS = [{ year: 2001, beginValue: 1320.28, endValue: 1148.08, rawReturn: -13.04 },
,
  { year: 2002, beginValue: 1148.08, endValue: 879.82, rawReturn: -23.37 },
,
  { year: 2003, beginValue: 879.82, endValue: 1111.92, rawReturn: 26.38 },
,
  { year: 2004, beginValue: 1111.92, endValue: 1211.92, rawReturn: 8.99 },
,
  { year: 2005, beginValue: 1211.92, endValue: 1248.29, rawReturn: 3.00 }
];

const CAP_RATE_HISTORY = [{ year: 2001, capRate: 14.00 },
, { year: 2002, capRate: 14.00 },
, { year: 2003, capRate: 13.50 },
,
  { year: 2004, capRate: 13.50 },
, { year: 2005, capRate: 13.00 }
];

const MOCK_ALLOCATIONS = [
  { name: "S&P 500 1-Year PtP", value: 60, color: "#3b82f6" },
  { name: "Nasdaq 100 1-Year PtP", value: 20, color: "#8b5cf6" },
  { name: "Euro Stoxx 50 1-Year PtP", value: 10, color: "#ec4899" },
  { name: "Fixed Account", value: 10, color: "#10b981" },
];

const MOCK_RADAR_DATA = [
  { subject: "Upside Potential", A: 85, B: 60, fullMark: 100 },
  { subject: "Downside Protection", A: 100, B: 40, fullMark: 100 },
  { subject: "Liquidity", A: 70, B: 90, fullMark: 100 },
  { subject: "Tax Efficiency", A: 95, B: 50, fullMark: 100 },
  { subject: "Death Benefit", A: 100, B: 20, fullMark: 100 },
  { subject: "Fees", A: 40, B: 80, fullMark: 100 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

function computeCreditedRate(rawReturn: number, capRate: number, floorRate: number, participationRate: number): number {
  if (rawReturn <= 0) return floorRate;
  const adjusted = rawReturn * (participationRate / 100);
  return Math.min(adjusted, capRate);
}

const fmt = (v: number) => `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const fmtM = (v: number) => v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `$${(v / 1_000).toFixed(0)}K` : `$${v}`;

export default function IULHistoricalPerformance() {
  const { user } = useAuth();
  const { data: clientData } = useClientData();
  
  const { data: clientsData } = trpc.clients.list.useQuery();
  const { data: marketData } = trpc.marketData.getSP500.useQuery(undefined, { enabled: false });
  const { data: strategyData } = trpc.strategy.getSaved.useQuery(undefined, { enabled: false });
  const { data: complianceData } = trpc.compliance.check.useQuery(undefined, { enabled: false });
  const saveStrategyMutation = trpc.strategy.save.useMutation();
  const logActivityMutation = trpc.activity.log.useMutation();

  const [activeTab, setActiveTab] = useState("performance");
  const [capRate, setCapRate] = useState(12.0);
  const [floorRate, setFloorRate] = useState(0.0);
  const [participationRate, setParticipationRate] = useState(100);
  const [guaranteedMin, setGuaranteedMin] = useState(0.25);
  const [useHistoricalCaps, setUseHistoricalCaps] = useState(false);
  const [useIbbotsonRange, setUseIbbotsonRange] = useState(false);
  const [ibbotsonStartYear, setIbbotsonStartYear] = useState(IBBOTSON_DEFAULT_START_YEAR);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  const [indexMultiplier, setIndexMultiplier] = useState(1.0);
  const [spreadRate, setSpreadRate] = useState(0.0);
  const [showFees, setShowFees] = useState(false);
  const [feeRate, setFeeRate] = useState(1.5);
  const [scenarioName, setScenarioName] = useState("My IUL Scenario");
  
  const tm = useTimeMachine();
  const [tmPremium, setTmPremium] = useState(100000);
  const [tmFundingYears, setTmFundingYears] = useState(5);
  const [tmAge, setTmAge] = useState(45);
  const [tmProjectionYears, setTmProjectionYears] = useState(25);

  useEffect(() => {
    if (!clientData) return;
  }, [clientData]);

  const handleSaveScenario = useCallback(() => {
    saveStrategyMutation.mutate({
      name: scenarioName,
      type: "IUL",
      parameters: { capRate, floorRate, participationRate }
    });
    logActivityMutation.mutate({
      action: "Saved IUL Scenario",
      details: `Saved scenario: ${scenarioName}`
    });
  }, [scenarioName, capRate, floorRate, participationRate, saveStrategyMutation, logActivityMutation]);

  const handleReset = useCallback(() => {
    setCapRate(12.0);
    setFloorRate(0.0);
    setParticipationRate(100);
    setSpreadRate(0.0);
    setIndexMultiplier(1.0);
    setUseHistoricalCaps(false);
    setShowFees(false);
  }, []);

  const tmOverlay = useMemo<IllustrationYear[]>(() => {
    if (!tm.enabled || tm.selectedOptions.length === 0) return [];
    return tm.generateOverlay(
      { annualPremium: tmPremium, fundingYears: tmFundingYears },
      tmAge,
      tmProjectionYears,
    );
  }, [tm.enabled, tm.selectedOptions, tm.startYear, tmPremium, tmFundingYears, tmAge, tmProjectionYears]);

  const boringAccumulation = useMemo(() => {
    if (!tm.enabled) return [];
    const rate = 0.075; 
    const rows: { year: number; accountValue: number }[] = [];
    let av = 0;
    for (let y = 1; y <= tmProjectionYears; y++) {
      const premium = y <= tmFundingYears ? tmPremium : 0;
      av = (av + premium) * (1 + rate);
      rows.push({ year: y, accountValue: Math.round(av) });
    }
    return rows;
  }, [tm.enabled, tmPremium, tmFundingYears, tmProjectionYears]);

  const historicalData = useMemo(() => {
    const sourceData = useIbbotsonRange
      ? Object.entries(IBBOTSON_RETURNS)
          .filter(([y]) => Number(y) >= ibbotsonStartYear)
          .map(([y, ret]) => ({ year: Number(y), beginValue: 0, endValue: 0, rawReturn: ret * 100 }))
      : SP500_ANNUAL_RETURNS;
      
    let cumulativeValue = 100000;
    let cumulativeRaw = 100000;
    
    return sourceData.map((row) => {
      const historicalCap = CAP_RATE_HISTORY.find((c) => c.year === row.year);
      const effectiveCap = useHistoricalCaps && historicalCap ? historicalCap.capRate : capRate;
      const effectiveFloor = Math.max(floorRate, guaranteedMin);
      
      let adjustedRaw = (row.rawReturn * indexMultiplier) - spreadRate;
      let credited = computeCreditedRate(adjustedRaw, effectiveCap, effectiveFloor, participationRate);
      
      if (showFees) {
        credited -= feeRate;
      }
      
      cumulativeValue = cumulativeValue * (1 + credited / 100);
      cumulativeRaw = cumulativeRaw * (1 + row.rawReturn / 100);
      
      return {
        ...row,
        effectiveCap,
        creditedRate: credited,
        floorProtectionActive: adjustedRaw < effectiveFloor,
        protectionAmount: adjustedRaw < effectiveFloor ? Math.abs(adjustedRaw - effectiveFloor) : 0,
        cumulativeValue: Math.round(cumulativeValue),
        cumulativeRaw: Math.round(cumulativeRaw),
        adjustedRaw
      };
    });
  }, [capRate, floorRate, participationRate, guaranteedMin, useHistoricalCaps, useIbbotsonRange, ibbotsonStartYear, indexMultiplier, spreadRate, showFees, feeRate]);

  const stats = useMemo(() => {
    const credited = historicalData.map((d) => d.creditedRate);
    const raw = historicalData.map((d) => d.rawReturn);
    const avgCredited = credited.reduce((a, b) => a + b, 0) / credited.length;
    const avgRaw = raw.reduce((a, b) => a + b, 0) / raw.length;
    const yearsProtected = historicalData.filter((d) => d.floorProtectionActive).length;
    const totalProtection = historicalData
      .filter((d) => d.floorProtectionActive)
      .reduce((a, d) => a + d.protectionAmount, 0);
    const yearsCapped = historicalData.filter((d) => d.rawReturn > 0 && d.rawReturn > d.effectiveCap).length;
    const maxDrawdown = Math.min(...raw);
    const bestYear = Math.max(...credited);
    
    return { avgCredited, avgRaw, yearsProtected, totalProtection, yearsCapped, maxDrawdown, bestYear };
  }, [historicalData]);

  const tmComparisonData = useMemo(() => {
    if (!tm.enabled || tmOverlay.length === 0) return [];
    return tmOverlay.map((row, i) => ({
      year: row.year,
      age: row.age,
      tmAccountValue: Math.round(row.accountValue),
      tmSurrenderValue: Math.round(row.surrenderValue),
      boringAccountValue: boringAccumulation[i]?.accountValue ?? 0,
      creditingRate: (row.creditingRate * 100).toFixed(2),
      interestCredit: Math.round(row.interestCredit),
      premium: Math.round(row.premiumPaid),
      cumulativePremiums: Math.round(row.cumulativePremiums),
    }));
  }, [tm.enabled, tmOverlay, boringAccumulation]);

  const allocationData = useMemo(() => MOCK_ALLOCATIONS, []);
  const radarData = useMemo(() => MOCK_RADAR_DATA, []);

  const feeImpactData = useMemo(() => {
    return historicalData.slice(0, 10).map((d) => ({
      year: d.year,
      grossReturn: d.creditedRate + (showFees ? feeRate : 0),
      fee: showFees ? feeRate : 0,
      netReturn: d.creditedRate,
      valueImpact: Math.round(d.cumulativeValue * (showFees ? feeRate/100 : 0))
    }));
  }, [historicalData, showFees, feeRate]);

  const volatilityData = useMemo(() => {
    const periods = [
      { name: "2001-2005", start: 2001, end: 2005 },
      { name: "2006-2010", start: 2006, end: 2010 },
      { name: "2011-2015", start: 2011, end: 2015 },
      { name: "2016-2020", start: 2016, end: 2020 },
      { name: "2021-2025", start: 2021, end: 2025 },
    ];
    
    return periods.map((p) => {
      const data = historicalData.filter((d) => d.year >= p.start && d.year <= p.end);
      if (data.length === 0) return { period: p.name, avgIndex: 0, avgCredited: 0, volatility: 0 };
      
      const avgIndex = data.reduce((sum, d) => sum + d.rawReturn, 0) / data.length;
      const avgCredited = data.reduce((sum, d) => sum + d.creditedRate, 0) / data.length;
      
      const variance = data.reduce((sum, d) => sum + Math.pow(d.rawReturn - avgIndex, 2), 0) / data.length;
      const volatility = Math.sqrt(variance);
      
      const credVariance = data.reduce((sum, d) => sum + Math.pow(d.creditedRate - avgCredited, 2), 0) / data.length;
      const credVolatility = Math.sqrt(credVariance);
      
      return {
        period: p.name,
        avgIndex,
        avgCredited,
        indexVolatility: volatility,
        creditedVolatility: credVolatility
      };
    });
  }, [historicalData]);

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <CalculationSyncBar />

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="IULHistoricalPerformance" />

        <ExecutiveSummary
          pageTitle="IUL Historical Performance"
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
        <GoalsAccelerator pageName="IUL Historical Performance" pageContext="IUL Historical Performance — insurance optimization modeling with projections and scenario analysis" />
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
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl">
                <History className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">IUL Historical Index Performance</h1>
            </div>
            <p className="text-sm text-slate-400 max-w-2xl">
              Educational analysis of how indexed crediting strategies would have performed based on 25 years of
              historical S&P 500 data. This content explains product mechanics using historical examples.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportToSlides
              defaultTitle="IUL Historical Performance"
              elementId="iul-historical-content"
            />
            <Button variant="outline" className="gap-2" onClick={handleReset}>
              <RefreshCw className="w-4 h-4" /> Reset
            </Button>
          </div>
        </div>

        {/* Client Info Bar */}
        {clientData && (
          <div className="flex items-center gap-4 p-3 bg-slate-800/50 border border-slate-700 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                {clientData.firstName?.[0]}{clientData.lastName?.[0]}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{clientData.firstName} {clientData.lastName}</p>
                <p className="text-xs text-slate-400">Client Analysis</p>
              </div>
            </div>
            <div className="h-8 w-px bg-slate-700 mx-2" />
            <FactFinderBadge />
            <div className="ml-auto flex items-center gap-2">
              <Badge variant="outline" className="bg-slate-900 text-slate-300">
                Risk Profile: Moderate
              </Badge>
            </div>
          </div>
        )}

        {/* Controls Panel */}
        <Card className="border-slate-700 bg-slate-900/80 shadow-xl">
          <CardHeader className="pb-4 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-400" />
                Strategy Parameters
              </CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="show-advanced"
                    checked={showAdvanced}
                    onCheckedChange={setShowAdvanced}
                  />
                  <Label htmlFor="show-advanced" className="text-xs text-slate-400 cursor-pointer">
                    Advanced Options
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="use-historical-caps"
                    checked={useHistoricalCaps}
                    onCheckedChange={setUseHistoricalCaps}
                  />
                  <Label htmlFor="use-historical-caps" className="text-xs text-slate-400 cursor-pointer">
                    Use Historical Caps
                  </Label>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label className="text-slate-300">Cap Rate (%)</Label>
                  <span className="text-xs font-mono text-amber-400">{capRate.toFixed(2)}%</span>
                </div>
                <Slider
                  value={[capRate]}
                  min={5}
                  max={20}
                  step={0.25}
                  onValueChange={([v]) => setCapRate(v)}
                  disabled={useHistoricalCaps}
                  className={useHistoricalCaps ? "opacity-50" : ""}
                />
                <p className="text-[10px] text-slate-500">Maximum credited rate</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label className="text-slate-300">Floor Rate (%)</Label>
                  <span className="text-xs font-mono text-green-400">{floorRate.toFixed(2)}%</span>
                </div>
                <Slider
                  value={[floorRate]}
                  min={0}
                  max={5}
                  step={0.25}
                  onValueChange={([v]) => setFloorRate(v)}
                />
                <p className="text-[10px] text-slate-500">Minimum credited rate</p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label className="text-slate-300">Participation Rate (%)</Label>
                  <span className="text-xs font-mono text-blue-400">{participationRate}%</span>
                </div>
                <Slider
                  value={[participationRate]}
                  min={50}
                  max={250}
                  step={5}
                  onValueChange={([v]) => setParticipationRate(v)}
                />
                <p className="text-[10px] text-slate-500">Portion of index return captured</p>
              </div>
              
              <div className="space-y-3">
                <Label className="text-slate-300">Save Scenario</Label>
                <div className="flex gap-2">
                  <Input 
                    value={scenarioName} 
                    onChange={(e) => setScenarioName(e.target.value)}
                    placeholder="Scenario Name"
                    className="h-9 bg-slate-800 border-slate-700 text-sm"
                  />
                  <Button 
                    size="sm" 
                    onClick={handleSaveScenario}
                    disabled={saveStrategyMutation.isPending}
                    className="h-9 px-3 bg-blue-600 hover:bg-blue-700"
                  >
                    Save
                  </Button>
                </div>
                <p className="text-[10px] text-slate-500">Save to client profile</p>
              </div>
            </div>

            {showAdvanced && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-slate-800">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label className="text-slate-300">Index Multiplier</Label>
                    <span className="text-xs font-mono text-purple-400">{indexMultiplier.toFixed(2)}x</span>
                  </div>
                  <Slider
                    value={[indexMultiplier]}
                    min={0.5}
                    max={3.0}
                    step={0.1}
                    onValueChange={([v]) => setIndexMultiplier(v)}
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label className="text-slate-300">Spread/Asset Fee (%)</Label>
                    <span className="text-xs font-mono text-red-400">{spreadRate.toFixed(2)}%</span>
                  </div>
                  <Slider
                    value={[spreadRate]}
                    min={0}
                    max={5}
                    step={0.25}
                    onValueChange={([v]) => setSpreadRate(v)}
                  />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch id="show-fees" checked={showFees} onCheckedChange={setShowFees} />
                      <Label htmlFor="show-fees" className="text-slate-300">Apply Policy Fees</Label>
                    </div>
                    {showFees && <span className="text-xs font-mono text-red-400">{feeRate.toFixed(2)}%</span>}
                  </div>
                  {showFees && (
                    <Slider
                      value={[feeRate]}
                      min={0}
                      max={5}
                      step={0.1}
                      onValueChange={([v]) => setFeeRate(v)}
                    />
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="border-slate-700/50 bg-slate-800/50">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <p className="text-xs text-slate-400 mb-1">Avg Credited</p>
              <p className="text-2xl font-bold text-green-400">{stats.avgCredited.toFixed(2)}%</p>
            </CardContent>
          </Card>
          <Card className="border-slate-700/50 bg-slate-800/50">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <p className="text-xs text-slate-400 mb-1">Avg Index</p>
              <p className="text-2xl font-bold text-blue-400">{stats.avgRaw.toFixed(2)}%</p>
            </CardContent>
          </Card>
          <Card className="border-slate-700/50 bg-slate-800/50">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <p className="text-xs text-slate-400 mb-1">Years Protected</p>
              <p className="text-2xl font-bold text-amber-400">{stats.yearsProtected}</p>
              <p className="text-[10px] text-slate-500">of {historicalData.length} years</p>
            </CardContent>
          </Card>
          <Card className="border-slate-700/50 bg-slate-800/50">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <p className="text-xs text-slate-400 mb-1">Years Capped</p>
              <p className="text-2xl font-bold text-purple-400">{stats.yearsCapped}</p>
              <p className="text-[10px] text-slate-500">Hit max return</p>
            </CardContent>
          </Card>
          <Card className="border-slate-700/50 bg-slate-800/50">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <p className="text-xs text-slate-400 mb-1">Best Year</p>
              <p className="text-2xl font-bold text-emerald-400">{stats.bestYear.toFixed(2)}%</p>
            </CardContent>
          </Card>
          <Card className="border-slate-700/50 bg-slate-800/50">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <p className="text-xs text-slate-400 mb-1">Max Drawdown</p>
              <p className="text-2xl font-bold text-red-400">{stats.maxDrawdown.toFixed(2)}%</p>
              <p className="text-[10px] text-slate-500">Avoided by floor</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start bg-slate-900 border-b border-slate-800 rounded-none p-0 h-auto overflow-x-auto flex-nowrap">
            <TabsTrigger value="performance" className="px-4 py-3 data-[state=active]:bg-slate-800 data-[state=active]:border-b-2 data-[state=active]:border-blue-500 rounded-none">
              <LineChartIcon className="w-4 h-4 mr-2" />
              Performance Analysis
            </TabsTrigger>
            <TabsTrigger value="floor-protection" className="px-4 py-3 data-[state=active]:bg-slate-800 data-[state=active]:border-b-2 data-[state=active]:border-amber-500 rounded-none">
              <Shield className="w-4 h-4 mr-2" />
              Floor Protection
            </TabsTrigger>
            <TabsTrigger value="accumulation" className="px-4 py-3 data-[state=active]:bg-slate-800 data-[state=active]:border-b-2 data-[state=active]:border-green-500 rounded-none">
              <TrendingUp className="w-4 h-4 mr-2" />
              Accumulation
            </TabsTrigger>
            <TabsTrigger value="allocation" className="px-4 py-3 data-[state=active]:bg-slate-800 data-[state=active]:border-b-2 data-[state=active]:border-purple-500 rounded-none">
              <PieChartIcon className="w-4 h-4 mr-2" />
              Allocations
            </TabsTrigger>
            <TabsTrigger value="scenarios" className="px-4 py-3 data-[state=active]:bg-slate-800 data-[state=active]:border-b-2 data-[state=active]:border-indigo-500 rounded-none">
              <Activity className="w-4 h-4 mr-2" />
              Scenarios
            </TabsTrigger>
            <TabsTrigger value="education" className="px-4 py-3 data-[state=active]:bg-slate-800 data-[state=active]:border-b-2 data-[state=active]:border-teal-500 rounded-none">
              <BookOpen className="w-4 h-4 mr-2" />
              Education
            </TabsTrigger>
          
            <TabsTrigger value="generate-outcome" className="text-xs sm:text-sm bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 font-bold">Generate Outcome</TabsTrigger>
          </TabsList>

          {/* ─── TAB 1: Performance Analysis ────────────────────────────────── */}
          <TabsContent value="performance" className="space-y-6 pt-4" id="iul-historical-content">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white">Historical Returns Comparison</h2>
              <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg">
                <Button 
                  variant={viewMode === "chart" ? "secondary" : "ghost"} 
                  size="sm" 
                  onClick={() => setViewMode("chart")}
                  className="h-7 text-xs"
                >
                  Chart View
                </Button>
                <Button 
                  variant={viewMode === "table" ? "secondary" : "ghost"} 
                  size="sm" 
                  onClick={() => setViewMode("table")}
                  className="h-7 text-xs"
                >
                  Data Table
                </Button>
              </div>
            </div>

            {viewMode === "chart" ? (
              <Card className="border-slate-700/50 bg-slate-800/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-300">
                    Raw Index Return vs. Hypothetical Credited Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[450px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={historicalData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 11 }} tickMargin={10} />
                        <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                        <Tooltip
                          contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)" }}
                          formatter={(value: number, name: string) => [`${value.toFixed(2)}%`, name]}
                          labelStyle={{ color: "#f8fafc", fontWeight: "bold", marginBottom: "8px" }}
                        />
                        <Legend wrapperStyle={{ paddingTop: "20px", fontSize: 12 }} />
                        <ReferenceLine y={0} stroke="#475569" strokeWidth={2} />
                        <ReferenceLine y={capRate} stroke="#f59e0b" strokeDasharray="5 5" label={{ position: 'right', value: 'Cap', fill: '#f59e0b', fontSize: 10 }} />
                        <ReferenceLine y={floorRate} stroke="#22c55e" strokeDasharray="5 5" label={{ position: 'right', value: 'Floor', fill: '#22c55e', fontSize: 10 }} />
                        <Bar dataKey="rawReturn" name="S&P 500 Return" fill="#3b82f6" opacity={0.3} radius={[4, 4, 0, 0]} />
                        <Line
                          type="monotone"
                          dataKey="creditedRate"
                          name="Credited Rate"
                          stroke="#22c55e"
                          strokeWidth={3}
                          dot={{ r: 4, fill: "#22c55e", strokeWidth: 2, stroke: "#0f172a" }}
                          activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-slate-700/50 bg-slate-800/30">
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-900/50">
                      <tr className="border-b border-slate-700">
                        <th className="text-left p-3 text-slate-400 font-medium">Year</th>
                        <th className="text-right p-3 text-slate-400 font-medium">S&P 500</th>
                        <th className="text-right p-3 text-slate-400 font-medium">Adjusted</th>
                        <th className="text-right p-3 text-slate-400 font-medium">Cap</th>
                        <th className="text-right p-3 text-slate-400 font-medium">Floor</th>
                        <th className="text-right p-3 text-slate-400 font-medium">Credited</th>
                        <th className="text-center p-3 text-slate-400 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historicalData.map((row) => (
                        <tr
                          key={row.year}
                          className={`border-b border-slate-800/50 hover:bg-slate-800/50 transition-colors ${
                            selectedYear === row.year ? "bg-blue-500/10" : ""
                          }`}
                          onClick={() => setSelectedYear(row.year === selectedYear ? null : row.year)}
                        >
                          <td className="p-3 text-slate-300 font-medium">{row.year}</td>
                          <td className={`p-3 text-right ${row.rawReturn >= 0 ? "text-slate-300" : "text-red-400"}`}>
                            {row.rawReturn.toFixed(2)}%
                          </td>
                          <td className="p-3 text-right text-slate-400">{row.adjustedRaw.toFixed(2)}%</td>
                          <td className="p-3 text-right text-amber-400/80">{row.effectiveCap.toFixed(2)}%</td>
                          <td className="p-3 text-right text-green-400/80">{Math.max(floorRate, guaranteedMin).toFixed(2)}%</td>
                          <td className="p-3 text-right font-bold text-green-400">
                            {row.creditedRate.toFixed(2)}%
                          </td>
                          <td className="p-3 text-center">
                            {row.floorProtectionActive ? (
                              <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
                                Protected
                              </Badge>
                            ) : row.rawReturn > row.effectiveCap ? (
                              <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                                Capped
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-slate-800 text-slate-400 border-slate-700">
                                Standard
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Volatility Table */}
              <Card className="border-slate-700/50 bg-slate-800/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-300">Volatility Reduction</CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left p-2 text-slate-400">Period</th>
                        <th className="text-right p-2 text-slate-400">Index Vol.</th>
                        <th className="text-right p-2 text-slate-400">Credited Vol.</th>
                        <th className="text-right p-2 text-slate-400">Reduction</th>
                      </tr>
                    </thead>
                    <tbody>
                      {volatilityData.map((row, i) => (
                        <tr key={i} className="border-b border-slate-800">
                          <td className="p-2 text-slate-300">{row.period}</td>
                          <td className="p-2 text-right text-slate-400">{row.indexVolatility.toFixed(2)}%</td>
                          <td className="p-2 text-right text-green-400">{row.creditedVolatility.toFixed(2)}%</td>
                          <td className="p-2 text-right text-blue-400 font-medium">
                            {row.indexVolatility > 0 ? 
                              ((1 - row.creditedVolatility / row.indexVolatility) * 100).toFixed(0) + '%' : 
                              '0%'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
              
              {/* Fee Impact Table */}
              {showFees && (
                <Card className="border-slate-700/50 bg-slate-800/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-slate-300">Fee Impact (First 10 Years)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left p-2 text-slate-400">Year</th>
                          <th className="text-right p-2 text-slate-400">Gross Return</th>
                          <th className="text-right p-2 text-slate-400">Fee</th>
                          <th className="text-right p-2 text-slate-400">Net Return</th>
                        </tr>
                      </thead>
                      <tbody>
                        {feeImpactData.map((row) => (
                          <tr key={row.year} className="border-b border-slate-800">
                            <td className="p-2 text-slate-300">{row.year}</td>
                            <td className="p-2 text-right text-slate-400">{row.grossReturn.toFixed(2)}%</td>
                            <td className="p-2 text-right text-red-400">-{row.fee.toFixed(2)}%</td>
                            <td className="p-2 text-right text-green-400 font-medium">{row.netReturn.toFixed(2)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ─── TAB 2: Floor Protection ────────────────────────────────────── */}
          <TabsContent value="floor-protection" className="space-y-6 pt-4">
            <Card className="border-slate-700/50 bg-slate-800/30">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-400" />
                  Understanding Floor Protection
                </CardTitle>
                <CardDescription>
                  The floor protects against negative index returns. This chart isolates the years where the index lost value.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={historicalData.filter((d) => d.rawReturn < 0)} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                      <Tooltip
                        contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }}
                        formatter={(value: number, name: string) => [`${value.toFixed(2)}%`, name]}
                      />
                      <Legend />
                      <ReferenceLine y={0} stroke="#475569" />
                      <Bar dataKey="rawReturn" name="Actual Index Loss" fill="#ef4444" radius={[0, 0, 4, 4]} />
                      <Bar dataKey="creditedRate" name="Credited (Floor)" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {historicalData
                    .filter((d) => d.rawReturn < 0)
                    .map((d) => (
                      <div key={d.year} className="flex flex-col p-4 bg-slate-900/80 rounded-xl border border-slate-700/50">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-lg font-bold text-white">{d.year}</span>
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
                            Protected
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-400">Index Return</span>
                            <span className="text-sm font-medium text-red-400">{d.rawReturn.toFixed(2)}%</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-400">Credited Rate</span>
                            <span className="text-sm font-medium text-green-400">{d.creditedRate.toFixed(2)}%</span>
                          </div>
                          <div className="h-px bg-slate-800 my-1" />
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-500">Loss Avoided</span>
                            <span className="text-sm font-bold text-amber-400">{d.protectionAmount.toFixed(2)}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── TAB 3: Accumulation ────────────────────────────────────────── */}
          <TabsContent value="accumulation" className="space-y-6 pt-4">
            <Card className="border-slate-700/50 bg-slate-800/30">
              <CardHeader>
                <CardTitle className="text-lg text-white">Hypothetical $100k Growth</CardTitle>
                <CardDescription>
                  Comparing a $100,000 initial allocation in the index vs. the indexed crediting strategy.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[450px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historicalData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                      <defs>
                        <linearGradient id="colorIUL" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorSP" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                      <Tooltip
                        contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }}
                        formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name === "cumulativeValue" ? "IUL Strategy" : "S&P 500 Direct"]}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="cumulativeRaw" name="S&P 500 Direct" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSP)" />
                      <Area type="monotone" dataKey="cumulativeValue" name="IUL Strategy" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorIUL)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                    <p className="text-sm text-slate-400 mb-1">Final IUL Value</p>
                    <p className="text-2xl font-bold text-green-400">
                      ${historicalData[historicalData.length - 1]?.cumulativeValue.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                    <p className="text-sm text-slate-400 mb-1">Final Index Value</p>
                    <p className="text-2xl font-bold text-blue-400">
                      ${historicalData[historicalData.length - 1]?.cumulativeRaw.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-700">
                    <p className="text-sm text-slate-400 mb-1">Difference</p>
                    <p className={`text-2xl font-bold ${
                      historicalData[historicalData.length - 1]?.cumulativeValue > historicalData[historicalData.length - 1]?.cumulativeRaw 
                        ? "text-green-400" : "text-amber-400"
                    }`}>
                      ${Math.abs(historicalData[historicalData.length - 1]?.cumulativeValue - historicalData[historicalData.length - 1]?.cumulativeRaw).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── TAB 4: Allocations ─────────────────────────────────────────── */}
          <TabsContent value="allocation" className="space-y-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-slate-700/50 bg-slate-800/30">
                <CardHeader>
                  <CardTitle className="text-sm text-slate-300">Sample Strategy Allocation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={allocationData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {allocationData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }}
                          formatter={(value: number) => [`${value}%`, "Allocation"]}
                        />
                        <Legend layout="vertical" verticalAlign="middle" align="right" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-700/50 bg-slate-800/30">
                <CardHeader>
                  <CardTitle className="text-sm text-slate-300">Strategy Profile Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="IUL Policy" dataKey="A" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                        <Radar name="Taxable Brokerage" dataKey="B" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                        <Legend />
                        <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card className="border-slate-700/50 bg-slate-800/30">
              <CardHeader>
                <CardTitle className="text-sm text-slate-300">Allocation Options Details</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left p-3 text-slate-400">Strategy Option</th>
                      <th className="text-left p-3 text-slate-400">Index</th>
                      <th className="text-right p-3 text-slate-400">Current Cap</th>
                      <th className="text-right p-3 text-slate-400">Par Rate</th>
                      <th className="text-right p-3 text-slate-400">Allocation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allocationData.map((row, i) => (
                      <tr key={i} className="border-b border-slate-800">
                        <td className="p-3 text-slate-300 flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: row.color }}></div>
                          {row.name}
                        </td>
                        <td className="p-3 text-slate-400">{row.name.split(' ')[0]}</td>
                        <td className="p-3 text-right text-amber-400">{row.name.includes('Fixed') ? 'N/A' : '12.00%'}</td>
                        <td className="p-3 text-right text-blue-400">{row.name.includes('Fixed') ? 'N/A' : '100%'}</td>
                        <td className="p-3 text-right text-green-400 font-medium">{row.value}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── TAB 5: Scenarios ───────────────────────────────────────────── */}
          <TabsContent value="scenarios" className="space-y-6 pt-4">
            <Card className="border-slate-700/50 bg-slate-800/30">
              <CardHeader>
                <CardTitle className="text-lg text-white">Three Scenario Analysis</CardTitle>
                <CardDescription>
                  Comparing Guaranteed, Conservative, and Current Illustrated outcomes over 25 years.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ThreeScenarioChart />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── TAB 6: Education ───────────────────────────────────────────── */}
          <TabsContent value="education" className="space-y-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <EducationCard
                title="Annual Point-to-Point"
                description="The most common crediting method. The index value is measured at the beginning and end of each policy year. The percentage change determines the credited rate, subject to the cap, floor, and participation rate."
                icon={<BarChart3 className="w-5 h-5 text-blue-400" />}
              />
              <EducationCard
                title="Cap Rate"
                description="The maximum rate that can be credited in any single period. If the index returns 20% and the cap is 12%, only 12% would be credited. Caps are set by the carrier and may change over time."
                icon={<TrendingUp className="w-5 h-5 text-green-400" />}
              />
              <EducationCard
                title="Floor Rate"
                description="The minimum rate credited when the index has negative returns. Most IUL policies have a 0% floor, meaning the account value does not decrease due to index losses. Some policies offer a small guaranteed minimum (e.g., 0.25%)."
                icon={<Shield className="w-5 h-5 text-amber-400" />}
              />
              <EducationCard
                title="Participation Rate"
                description="The percentage of the index return that is used in the crediting calculation. At 100% participation, the full index return (up to the cap) is credited. At 50% participation, only half the return is used."
                icon={<Percent className="w-5 h-5 text-purple-400" />}
              />
            </div>
            
            <Card className="border-slate-700/50 bg-slate-800/30 mt-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">The Mechanics of Indexed Universal Life</h3>
                <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
                  <p>
                    Indexed Universal Life (IUL) insurance offers a death benefit along with a cash value component that can grow based on the performance of a stock market index, such as the S&P 500. Crucially, the money is not directly invested in the market.
                  </p>
                  <p>
                    When you pay premiums, a portion covers the cost of insurance and administrative fees. The remainder enters the cash value account. The insurance company uses this cash value to purchase options on the chosen index, which provides the upside potential.
                  </p>
                  <p>
                    Because the insurance company is purchasing options rather than investing directly in the underlying stocks, they can guarantee that the cash value will not decrease due to market downturns (the <strong>Floor</strong>). However, this protection comes at a cost, which is why the upside is limited by a <strong>Cap Rate</strong> or <strong>Participation Rate</strong>.
                  </p>
                  <div className="p-4 bg-slate-900 rounded-lg border border-slate-700 mt-4">
                    <h4 className="font-semibold text-white mb-2">Key Considerations:</h4>
                    <ul className="list-disc pl-5 space-y-2 text-slate-400">
                      <li><strong>Dividends:</strong> IUL policies do not earn dividends from the underlying index.</li>
                      <li><strong>Costs:</strong> Policies include cost of insurance charges that increase with age.</li>
                      <li><strong>Changes:</strong> Carriers can change caps and participation rates over time.</li>
                      <li><strong>Taxes:</strong> Cash value growth is tax-deferred, and loans can be taken tax-free if properly structured.</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        
          <TabsContent value="generate-outcome" className="space-y-6 mt-6">
            <GenerateOutcomeTab
              strategyType="iul-projection"
              hasResults={true}
              resultData={{ cashValue: 850000, deathBenefit: 2500000, surrenderValue: 800000, annualPremium: 25000, years: 20, avgReturn: 7.2, projectionData: [] }}
              metrics={[{ label: "Cash Value", value: 850000, highlight: true }, { label: "Death Benefit", value: 2500000 }, { label: "Annual Premium", value: 25000 }, { label: "Avg Return", value: 0.072, format: "percent" }]}
            />
          </TabsContent>
        </Tabs>
      </div>
      <PageInsights pageId="iul-historical" />
    
        <ComplianceFooter pageName="IULHistoricalPerformance" showsIUL showsTax showsEstate showsProjections showsHistoricalData showsPolicyLoans />
      </AppShell>
  );
}

function ThreeScenarioChart() {
  const scenarios = useMemo(() => {
    const years = 25;
    const annual = 10000;
    const data = [];
    let guaranteed = 0;
    let conservative = 0;
    let current = 0;

    for (let y = 1; y <= years; y++) {
      guaranteed = (guaranteed + annual) * 1.02; // 2% guaranteed
      conservative = (conservative + annual) * 1.055; // 5.5% conservative
      current = (current + annual) * 1.072; // 7.2% current illustrated
      data.push({
        year: y,
        guaranteed: Math.round(guaranteed),
        conservative: Math.round(conservative),
        currentIllustrated: Math.round(current),
      });
    }
    return data;
  }, []);

  return (
    <div className="space-y-4">
      <div className="h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={scenarios} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
            <Tooltip
              contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }}
              formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]}
            />
            <Legend />
            <Line type="monotone" dataKey="guaranteed" name="Guaranteed (2%)" stroke="#ef4444" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="conservative" name="Conservative (5.5%)" stroke="#f59e0b" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="currentIllustrated" name="Current Illustrated (7.2%)" stroke="#22c55e" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
          <p className="text-sm text-red-400 font-medium mb-1">Guaranteed</p>
          <p className="text-2xl font-bold text-red-300">${scenarios[24]?.guaranteed.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">2.0% annual rate</p>
        </div>
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
          <p className="text-sm text-amber-400 font-medium mb-1">Conservative</p>
          <p className="text-2xl font-bold text-amber-300">${scenarios[24]?.conservative.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">5.5% annual rate</p>
        </div>
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
          <p className="text-sm text-green-400 font-medium mb-1">Current Illustrated</p>
          <p className="text-2xl font-bold text-green-300">${scenarios[24]?.currentIllustrated.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">7.2% annual rate</p>
        </div>
      </div>
      
      <div className="overflow-x-auto mt-6">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left p-2 text-slate-400">Year</th>
              <th className="text-right p-2 text-slate-400">Guaranteed (2%)</th>
              <th className="text-right p-2 text-slate-400">Conservative (5.5%)</th>
              <th className="text-right p-2 text-slate-400">Illustrated (7.2%)</th>
            </tr>
          </thead>
          <tbody>
            {[4, 9, 14, 19, 24].map((idx) => {
              const row = scenarios[idx];
              if (!row) return null;
              return (
                <tr key={row.year} className="border-b border-slate-800">
                  <td className="p-2 text-slate-300 font-medium">Year {row.year}</td>
                  <td className="p-2 text-right text-red-400/80">${row.guaranteed.toLocaleString()}</td>
                  <td className="p-2 text-right text-amber-400/80">${row.conservative.toLocaleString()}</td>
                  <td className="p-2 text-right text-green-400 font-medium">${row.currentIllustrated.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EducationCard({ title, description, icon }: { title: string; description: string; icon: React.ReactNode }) {
  return (
    <div className="p-5 bg-slate-900/50 border border-slate-700/50 rounded-xl hover:bg-slate-800/50 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-slate-800 rounded-lg">
          {icon}
        </div>
        <h4 className="text-base font-semibold text-white">{title}</h4>
      </div>
      <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}
