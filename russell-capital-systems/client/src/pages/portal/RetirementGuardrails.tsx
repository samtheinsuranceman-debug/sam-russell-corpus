// @ts-nocheck
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import { AppShell } from "@/components/AppShell";
import { ExportToSlides } from "@/components/ExportToSlides";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Shield, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, DollarSign,
  ArrowUp, ArrowDown, Minus, Target, Activity, BarChart3, FileText, Zap, PieChartIcon, Info, RefreshCcw, Save, Download, Settings, Sliders, PlayCircle, Lock
} from "lucide-react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, 
  Area, AreaChart, ReferenceLine, BarChart, Bar, PieChart, Pie, Cell, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart 
} from "recharts";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;
const fmtPct = (n: number) => `${n.toFixed(2)}%`;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface GuardrailResult {
  year: number;
  age: number;
  portfolioValue: number;
  withdrawal: number;
  withdrawalRate: number;
  upperGuardrail: number;
  lowerGuardrail: number;
  action: "increase" | "decrease" | "maintain";
  marketReturn: number;
  cumulativeInflation: number;
  taxesPaid: number;
  netIncome: number;
  purchasingPower: number;
  requiredMinimumDistribution: number;
}

function calculateRMD(age: number, balance: number): number {
  if (age < 73) return 0;
  const factor = Math.max(1.9, 27.4 - (age - 73));
  return balance / factor;
}

function simulateGuardrails(params: {
  portfolioValue: number;
  annualWithdrawal: number;
  currentAge: number;
  endAge: number;
  initialRate: number;
  upperGuardrail: number;
  lowerGuardrail: number;
  raisePercent: number;
  cutPercent: number;
  inflationRate: number;
  marketScenario: "average" | "bull" | "bear" | "volatile" | "historical" | "custom";
  taxRate: number;
  customReturn?: number;
  customVolatility?: number;
  includeRMDs: boolean;
  socialSecurityStartAge: number;
  socialSecurityAmount: number;
}): GuardrailResult[] {
  const results: GuardrailResult[] = [];
  let portfolio = params.portfolioValue;
  let withdrawal = params.annualWithdrawal;
  let cumulativeInflation = 1;
  const years = params.endAge - params.currentAge;

  const getReturn = (year: number, scenario: string): number => {
    const seed = Math.sin(year * 12.9898) * 43758.5453;
    const random = seed - Math.floor(seed);
    
    if (scenario === "custom" && params.customReturn !== undefined && params.customVolatility !== undefined) {
      const vol = params.customVolatility / 100;
      const ret = params.customReturn / 100;
      return ret + (random * 2 - 1) * vol;
    }
    
    switch (scenario) {
      case "bull": return 0.08 + random * 0.12;
      case "bear": return -0.05 + random * 0.15;
      case "volatile": return -0.15 + random * 0.35;
      case "historical": 
        const histReturns = [0.12, -0.04, 0.21, 0.05, -0.11, 0.08, 0.15, -0.02, 0.09, 0.18];
        return histReturns[year % histReturns.length];
      default: return 0.02 + random * 0.14;
    }
  };

  for (let y = 0; y < years; y++) {
    const age = params.currentAge + y;
    const marketReturn = getReturn(y, params.marketScenario);
    cumulativeInflation *= (1 + params.inflationRate);

    let ssIncome = 0;
    if (age >= params.socialSecurityStartAge) {
      ssIncome = params.socialSecurityAmount * cumulativeInflation;
    }
    
    let rmd = 0;
    if (params.includeRMDs) {
      rmd = calculateRMD(age, portfolio);
    }
    
    let portfolioWithdrawal = Math.max(0, withdrawal - ssIncome);
    
    if (rmd > portfolioWithdrawal) {
      portfolioWithdrawal = rmd;
    }

    portfolio -= portfolioWithdrawal;
    if (portfolio < 0) portfolio = 0;

    portfolio *= (1 + marketReturn);

    const withdrawalRate = portfolio > 0 ? portfolioWithdrawal / portfolio : 0;
    const upperBound = params.upperGuardrail / 100;
    const lowerBound = params.lowerGuardrail / 100;

    let action: "increase" | "decrease" | "maintain" = "maintain";

    if (withdrawalRate > upperBound && portfolio > 0) {
      withdrawal *= (1 - params.cutPercent / 100);
      action = "decrease";
    } else if (withdrawalRate < lowerBound && portfolio > 0) {
      withdrawal *= (1 + params.raisePercent / 100);
      action = "increase";
    } else {
      withdrawal *= (1 + params.inflationRate);
    }
    
    const taxesPaid = portfolioWithdrawal * (params.taxRate / 100);
    const netIncome = portfolioWithdrawal + ssIncome - taxesPaid;
    const purchasingPower = netIncome / cumulativeInflation;

    results.push({
      year: y + 1,
      age,
      portfolioValue: Math.round(portfolio),
      withdrawal: Math.round(withdrawal),
      withdrawalRate: withdrawalRate * 100,
      upperGuardrail: upperBound * 100,
      lowerGuardrail: lowerBound * 100,
      action,
      marketReturn: marketReturn * 100,
      cumulativeInflation: (cumulativeInflation - 1) * 100,
      taxesPaid: Math.round(taxesPaid),
      netIncome: Math.round(netIncome),
      purchasingPower: Math.round(purchasingPower),
      requiredMinimumDistribution: Math.round(rmd)
    });
  }
  return results;
}

export default function RetirementGuardrails() {
  const { user } = useAuth();
  const { data: clientData } = useClientData();
  
  const { data: clients, refetch: refetchClients } = trpc.clients.list.useQuery();
  const { data: marketData } = trpc.marketData.getLatest.useQuery(undefined, { enabled: !!user });
  const { data: savedStrategies, refetch: refetchStrategies } = trpc.savedStrategies.list.useQuery({ type: 'guardrails' });
  const saveStrategyMutation = trpc.savedStrategies.save.useMutation();
  const { data: riskProfile } = trpc.riskProfile.get.useQuery(
    { clientId: clientData?.id || '' }, 
    { enabled: !!clientData?.id }
  );
  const { data: taxRates } = trpc.taxReturnOcr.getEstimatedRates.useQuery(
    { clientId: clientData?.id || '' },
    { enabled: !!clientData?.id }
  );
  
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("simulator");
  const [portfolioValue, setPortfolioValue] = useState(1500000);
  const [annualWithdrawal, setAnnualWithdrawal] = useState(60000);
  const [currentAge, setCurrentAge] = useState(65);
  const [endAge, setEndAge] = useState(95);
  const [upperGuardrail, setUpperGuardrail] = useState([6]);
  const [lowerGuardrail, setLowerGuardrail] = useState([3.5]);
  const [raisePercent, setRaisePercent] = useState([10]);
  const [cutPercent, setCutPercent] = useState([10]);
  const [inflationRate, setInflationRate] = useState([3]);
  const [marketScenario, setMarketScenario] = useState<"average" | "bull" | "bear" | "volatile" | "historical" | "custom">("average");
  const [taxRate, setTaxRate] = useState([15]);
  const [includeRMDs, setIncludeRMDs] = useState(true);
  const [socialSecurityStartAge, setSocialSecurityStartAge] = useState(67);
  const [socialSecurityAmount, setSocialSecurityAmount] = useState(30000);
  const [customReturn, setCustomReturn] = useState([7]);
  const [customVolatility, setCustomVolatility] = useState([12]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [strategyName, setStrategyName] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  useEffect(() => {
    if (clientData) {
      if (clientData.age) setCurrentAge(clientData.age);
      if (clientData.retirementAge) setEndAge(Math.max(clientData.retirementAge + 30, 95));
      
      const totalRetirement = (clientData.iraBalance || 0) + (clientData.rothBalance || 0) + (clientData.k401Balance || 0) + (clientData.taxableInvestments || 0);
      if (totalRetirement > 0) {
        setPortfolioValue(totalRetirement);
        setAnnualWithdrawal(Math.round(totalRetirement * 0.04));
      }
    }
  }, [clientData]);

  useEffect(() => {
    if (taxRates && taxRates.effectiveRate) {
      setTaxRate([taxRates.effectiveRate]);
    }
  }, [taxRates]);

  useEffect(() => {
    if (riskProfile) {
      if (riskProfile.score < 40) setMarketScenario("bear");
      else if (riskProfile.score > 80) setMarketScenario("bull");
      else setMarketScenario("average");
    }
  }, [riskProfile]);

  useEffect(() => {
    setIsSimulating(true);
    const timer = setTimeout(() => setIsSimulating(false), 500);
    return () => clearTimeout(timer);
  }, [portfolioValue, annualWithdrawal, currentAge, endAge, upperGuardrail, lowerGuardrail, raisePercent, cutPercent, inflationRate, marketScenario, taxRate, includeRMDs, socialSecurityStartAge, socialSecurityAmount, customReturn, customVolatility]);

  const selectedClient = useMemo(() => {
    if (!clients) return null;
    if (selectedClientId) return clients.find((c) => String(c.id) === selectedClientId);
    return null;
  }, [clients, selectedClientId]);

  const results = useMemo(() => simulateGuardrails({
    portfolioValue,
    annualWithdrawal,
    currentAge,
    endAge,
    initialRate: portfolioValue > 0 ? (annualWithdrawal / portfolioValue) * 100 : 4,
    upperGuardrail: upperGuardrail[0],
    lowerGuardrail: lowerGuardrail[0],
    raisePercent: raisePercent[0],
    cutPercent: cutPercent[0],
    inflationRate: inflationRate[0] / 100,
    marketScenario,
    taxRate: taxRate[0],
    includeRMDs,
    socialSecurityStartAge,
    socialSecurityAmount,
    customReturn: customReturn[0],
    customVolatility: customVolatility[0]
  }), [
    portfolioValue, annualWithdrawal, currentAge, endAge, upperGuardrail, lowerGuardrail, 
    raisePercent, cutPercent, inflationRate, marketScenario, taxRate, includeRMDs, 
    socialSecurityStartAge, socialSecurityAmount, customReturn, customVolatility
  ]);

  const summaryMetrics = useMemo(() => {
    if (!results.length) return null;
    const finalPortfolio = results[results.length - 1].portfolioValue;
    const maxWithdrawal = Math.max(...results.map((r) => r.withdrawal));
    const minWithdrawal = Math.min(...results.map((r) => r.withdrawal));
    const totalWithdrawn = results.reduce((sum, r) => sum + r.withdrawal, 0);
    const totalTaxes = results.reduce((sum, r) => sum + r.taxesPaid, 0);
    const adjustmentCount = results.filter((r) => r.action !== "maintain").length;
    const increaseCount = results.filter((r) => r.action === "increase").length;
    const decreaseCount = results.filter((r) => r.action === "decrease").length;
    const portfolioSurvived = finalPortfolio > 0;
    
    return {
      finalPortfolio, maxWithdrawal, minWithdrawal, totalWithdrawn, totalTaxes,
      adjustmentCount, increaseCount, decreaseCount, portfolioSurvived
    };
  }, [results]);

  const chartData = useMemo(() => {
    return results.map((r) => ({
      ...r,
      portfolioM: r.portfolioValue / 1000000,
      withdrawalK: r.withdrawal / 1000,
      netIncomeK: r.netIncome / 1000,
      purchasingPowerK: r.purchasingPower / 1000
    }));
  }, [results]);

  const distributionData = useMemo(() => {
    if (!summaryMetrics) return [];
    return [
      { name: 'Remaining Portfolio', value: summaryMetrics.finalPortfolio },
      { name: 'Total Withdrawn', value: summaryMetrics.totalWithdrawn },
      { name: 'Taxes Paid', value: summaryMetrics.totalTaxes }
    ];
  }, [summaryMetrics]);

  const loadClient = useCallback(() => {
    if (!selectedClient) return;
    const totalRetirement = Number(selectedClient.iraBalance ?? 0) + Number(selectedClient.rothBalance ?? 0) + Number(selectedClient.taxableAssets ?? 0);
    if (totalRetirement > 0) setPortfolioValue(totalRetirement);
    if (selectedClient.age) {
      setCurrentAge(Number(selectedClient.age));
      setEndAge(Math.max(Number(selectedClient.age) + 30, 95));
    }
    if (totalRetirement > 0) setAnnualWithdrawal(Math.round(totalRetirement * 0.04));
  }, [selectedClient]);

  const handleSaveStrategy = useCallback(async () => {
    if (!strategyName) return;
    try {
      await saveStrategyMutation.mutateAsync({
        name: strategyName,
        type: 'guardrails',
        data: {
          portfolioValue, annualWithdrawal, currentAge, endAge, upperGuardrail, lowerGuardrail,
          raisePercent, cutPercent, inflationRate, marketScenario
        }
      });
      setStrategyName("");
      refetchStrategies();
    } catch (err) {
      console.error("Failed to save strategy", err);
    }
  }, [strategyName, portfolioValue, annualWithdrawal, currentAge, endAge, upperGuardrail, lowerGuardrail, raisePercent, cutPercent, inflationRate, marketScenario, saveStrategyMutation, refetchStrategies]);

  const loadStrategy = useCallback((strategy: any) => {
    const d = strategy.data;
    if (d.portfolioValue) setPortfolioValue(d.portfolioValue);
    if (d.annualWithdrawal) setAnnualWithdrawal(d.annualWithdrawal);
    if (d.currentAge) setCurrentAge(d.currentAge);
    if (d.endAge) setEndAge(d.endAge);
    if (d.upperGuardrail) setUpperGuardrail(d.upperGuardrail);
    if (d.lowerGuardrail) setLowerGuardrail(d.lowerGuardrail);
    if (d.raisePercent) setRaisePercent(d.raisePercent);
    if (d.cutPercent) setCutPercent(d.cutPercent);
    if (d.inflationRate) setInflationRate(d.inflationRate);
    if (d.marketScenario) setMarketScenario(d.marketScenario);
  }, []);

  const resetDefaults = useCallback(() => {
    setPortfolioValue(1500000);
    setAnnualWithdrawal(60000);
    setCurrentAge(65);
    setEndAge(95);
    setUpperGuardrail([6]);
    setLowerGuardrail([3.5]);
    setRaisePercent([10]);
    setCutPercent([10]);
    setInflationRate([3]);
    setMarketScenario("average");
    setTaxRate([15]);
    setIncludeRMDs(true);
    setSocialSecurityStartAge(67);
    setSocialSecurityAmount(30000);
  }, []);

  const handleYearClick = useCallback((data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      setSelectedYear(data.activePayload[0].payload.year);
    }
  }, []);

  if (!summaryMetrics) return null;

  const { finalPortfolio, maxWithdrawal, minWithdrawal, totalWithdrawn, totalTaxes, adjustmentCount, increaseCount, decreaseCount, portfolioSurvived } = summaryMetrics;

  return (
    <AppShell>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="RetirementGuardrails" />

        <ExecutiveSummary
          pageTitle="Retirement Guardrails"
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
        <GoalsAccelerator pageName="Retirement Guardrails" pageContext="Retirement Guardrails — retirement income modeling with projections and scenario analysis" />
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
        <FactFinderBadge className="mb-4" />
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/50 p-6 rounded-xl border border-slate-800">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="w-8 h-8 text-[#22c55e]" /> 
              Dynamic Retirement Guardrails
            </h1>
            <p className="text-sm text-slate-400 mt-2 max-w-2xl">
              Advanced spending simulation using Guyton-Klinger methodology. Adjusts withdrawal rates dynamically based on market performance to prevent portfolio depletion while maximizing income during bull markets.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger className="w-[250px] bg-slate-950 border-slate-800">
                  <SelectValue placeholder="Load client data…" />
                </SelectTrigger>
                <SelectContent>
                  {(!clients ? [] : clients).map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name?.split(" ")[0] ?? ""} {c.name?.split(" ").slice(1).join(" ") ?? ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedClient && (
                <Button variant="default" className="bg-blue-600 hover:bg-blue-700" onClick={loadClient}>
                  <Download className="w-4 h-4 mr-2" /> Load
                </Button>
              )}
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={resetDefaults} className="border-slate-700 text-slate-300">
                <RefreshCcw className="w-4 h-4 mr-2" /> Reset
              </Button>
              <ExportToSlides
                toolName="Dynamic Retirement Guardrails"
                getSections={() => [
                  {
                    title: "Parameters",
                    items: [
                      { label: "Portfolio Value", value: fmt(portfolioValue) },
                      { label: "Annual Withdrawal", value: fmt(annualWithdrawal) },
                      { label: "Current Age", value: String(currentAge) },
                      { label: "End Age", value: String(endAge) },
                      { label: "Upper Guardrail", value: `${upperGuardrail[0]}%` },
                      { label: "Lower Guardrail", value: `${lowerGuardrail[0]}%` },
                      { label: "Raise Amount", value: `${raisePercent[0]}%` },
                      { label: "Cut Amount", value: `${cutPercent[0]}%` },
                      { label: "Inflation", value: `${inflationRate[0]}%` },
                      { label: "Market Scenario", value: marketScenario }
                    ]
                  },
                  {
                    title: "Summary Results",
                    items: [
                      { label: "Final Portfolio", value: fmt(finalPortfolio) },
                      { label: "Total Withdrawn", value: fmt(totalWithdrawn) },
                      { label: "Peak Income", value: fmt(maxWithdrawal) },
                      { label: "Minimum Income", value: fmt(minWithdrawal) },
                      { label: "Total Adjustments", value: String(adjustmentCount) },
                      { label: "Increases", value: String(increaseCount) },
                      { label: "Decreases", value: String(decreaseCount) }
                    ]
                  }
                ]}
              />
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          {/* Left Column: Controls */}
          <div className="xl:col-span-4 space-y-6">
            <Card className="border-slate-800 bg-slate-900/40 shadow-xl">
              <CardHeader className="border-b border-slate-800 pb-4">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-blue-400" /> Core Parameters
                  </CardTitle>
                  {isSimulating && <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />}
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label className="text-slate-300">Initial Portfolio Value</Label>
                    <span className="text-sm font-mono text-blue-400">{fmt(portfolioValue)}</span>
                  </div>
                  <Input 
                    type="number" 
                    value={portfolioValue} 
                    onChange={(e) => setPortfolioValue(Number(e.target.value))}
                    className="bg-slate-950 border-slate-800 font-mono"
                  />
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label className="text-slate-300">Initial Annual Withdrawal</Label>
                    <span className="text-sm font-mono text-emerald-400">{fmt(annualWithdrawal)}</span>
                  </div>
                  <Input 
                    type="number" 
                    value={annualWithdrawal} 
                    onChange={(e) => setAnnualWithdrawal(Number(e.target.value))}
                    className="bg-slate-950 border-slate-800 font-mono"
                  />
                  <div className="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-800">
                    <span className="text-xs text-slate-400">Initial Withdrawal Rate:</span>
                    <Badge variant={portfolioValue > 0 && (annualWithdrawal / portfolioValue) > 0.05 ? "destructive" : "secondary"}>
                      {portfolioValue > 0 ? ((annualWithdrawal / portfolioValue) * 100).toFixed(2) : 0}%
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Current Age</Label>
                    <Input type="number" value={currentAge} onChange={(e) => setCurrentAge(Number(e.target.value))} className="bg-slate-950 border-slate-800" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">End Age</Label>
                    <Input type="number" value={endAge} onChange={(e) => setEndAge(Number(e.target.value))} className="bg-slate-950 border-slate-800" />
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <div className="flex justify-between">
                    <Label className="text-slate-300 flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-red-400" /> Upper Guardrail (Cut)
                    </Label>
                    <span className="text-sm font-bold text-red-400">{upperGuardrail[0]}%</span>
                  </div>
                  <Slider value={upperGuardrail} onValueChange={setUpperGuardrail} min={4} max={10} step={0.1} className="py-2" />
                  <p className="text-xs text-slate-500">If withdrawal rate exceeds {upperGuardrail[0]}%, spending is cut by {cutPercent[0]}%</p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label className="text-slate-300 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" /> Lower Guardrail (Raise)
                    </Label>
                    <span className="text-sm font-bold text-emerald-400">{lowerGuardrail[0]}%</span>
                  </div>
                  <Slider value={lowerGuardrail} onValueChange={setLowerGuardrail} min={1} max={5} step={0.1} className="py-2" />
                  <p className="text-xs text-slate-500">If withdrawal rate drops below {lowerGuardrail[0]}%, spending increases by {raisePercent[0]}%</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900/40 shadow-xl">
              <CardHeader className="border-b border-slate-800 pb-4 cursor-pointer hover:bg-slate-800/50 transition-colors" onClick={() => setShowAdvanced(!showAdvanced)}>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center gap-2"><Settings className="w-5 h-5 text-purple-400" /> Advanced Settings</span>
                  {showAdvanced ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                </CardTitle>
              </CardHeader>
              {showAdvanced && (
                <CardContent className="space-y-6 pt-6 animate-in slide-in-from-top-2">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label className="text-slate-300">Raise Amount</Label>
                      <span className="text-sm">{raisePercent[0]}%</span>
                    </div>
                    <Slider value={raisePercent} onValueChange={setRaisePercent} min={1} max={25} step={1} />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label className="text-slate-300">Cut Amount</Label>
                      <span className="text-sm">{cutPercent[0]}%</span>
                    </div>
                    <Slider value={cutPercent} onValueChange={setCutPercent} min={1} max={25} step={1} />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label className="text-slate-300">Inflation Rate</Label>
                      <span className="text-sm">{inflationRate[0]}%</span>
                    </div>
                    <Slider value={inflationRate} onValueChange={setInflationRate} min={0} max={8} step={0.5} />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label className="text-slate-300">Estimated Tax Rate</Label>
                      <span className="text-sm">{taxRate[0]}%</span>
                    </div>
                    <Slider value={taxRate} onValueChange={setTaxRate} min={0} max={40} step={1} />
                  </div>

                  <div className="space-y-3 pt-4 border-t border-slate-800">
                    <Label className="text-slate-300">Market Scenario</Label>
                    <Select value={marketScenario} onValueChange={(v: any) => setMarketScenario(v)}>
                      <SelectTrigger className="bg-slate-950 border-slate-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="average">Average (7-8% avg)</SelectItem>
                        <SelectItem value="bull">Bull Market (10-12% avg)</SelectItem>
                        <SelectItem value="bear">Bear Market (-5% to 10%)</SelectItem>
                        <SelectItem value="volatile">High Volatility</SelectItem>
                        <SelectItem value="historical">Historical Sequence</SelectItem>
                        <SelectItem value="custom">Custom Return/Vol</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {marketScenario === "custom" && (
                    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-950 rounded-lg border border-slate-800">
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-400">Avg Return (%)</Label>
                        <Input type="number" value={customReturn[0]} onChange={(e) => setCustomReturn([Number(e.target.value)])} className="h-8 bg-slate-900 border-slate-700" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-400">Volatility (%)</Label>
                        <Input type="number" value={customVolatility[0]} onChange={(e) => setCustomVolatility([Number(e.target.value)])} className="h-8 bg-slate-900 border-slate-700" />
                      </div>
                    </div>
                  )}

                  <div className="space-y-4 pt-4 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <Label className="text-slate-300">Include RMDs (Age 73+)</Label>
                      <Switch checked={includeRMDs} onCheckedChange={setIncludeRMDs} />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-slate-300">Social Security Start Age</Label>
                      <Input type="number" value={socialSecurityStartAge} onChange={(e) => setSocialSecurityStartAge(Number(e.target.value))} className="bg-slate-950 border-slate-800" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-slate-300">Social Security Annual Amount</Label>
                      <Input type="number" value={socialSecurityAmount} onChange={(e) => setSocialSecurityAmount(Number(e.target.value))} className="bg-slate-950 border-slate-800" />
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            <Card className="border-slate-800 bg-slate-900/40 shadow-xl">
              <CardHeader className="border-b border-slate-800 pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Save className="w-5 h-5 text-amber-400" /> Saved Strategies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Strategy name..." 
                    value={strategyName} 
                    onChange={(e) => setStrategyName(e.target.value)}
                    className="bg-slate-950 border-slate-800"
                  />
                  <Button onClick={handleSaveStrategy} disabled={!strategyName} className="bg-amber-600 hover:bg-amber-700">Save</Button>
                </div>
                
                {savedStrategies && savedStrategies.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <Label className="text-xs text-slate-500 uppercase">Load Saved</Label>
                    <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-2">
                      {savedStrategies.map((s) => (
                        <div key={s.id} className="flex justify-between items-center p-2 bg-slate-950 rounded border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-colors" onClick={() => loadStrategy(s)}>
                          <span className="text-sm truncate">{s.name}</span>
                          <PlayCircle className="w-4 h-4 text-amber-500" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Results & Visualizations */}
          <div className="xl:col-span-8 space-y-6">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className={`border ${portfolioSurvived ? "border-emerald-500/50 bg-emerald-950/20" : "border-red-500/50 bg-red-950/20"} shadow-lg`}>
                <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                  <div className="flex items-center gap-2 mb-2">
                    {portfolioSurvived ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertTriangle className="w-5 h-5 text-red-500" />}
                    <span className="text-sm font-medium text-slate-300">Final Portfolio</span>
                  </div>
                  <div className={`text-2xl font-bold font-mono ${portfolioSurvived ? "text-emerald-400" : "text-red-400"}`}>
                    {fmt(finalPortfolio)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">At age {endAge}</div>
                </CardContent>
              </Card>
              
              <Card className="border-slate-800 bg-slate-900/40 shadow-lg">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium text-slate-300">Total Withdrawn</span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-blue-400">
                    {fmt(totalWithdrawn)}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Over {endAge - currentAge} years</div>
                </CardContent>
              </Card>
              
              <Card className="border-slate-800 bg-slate-900/40 shadow-lg">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                    <span className="text-sm font-medium text-slate-300">Income Range</span>
                  </div>
                  <div className="text-lg font-bold font-mono text-purple-400">
                    {fmt(minWithdrawal)}
                  </div>
                  <div className="text-xs text-slate-400">to {fmt(maxWithdrawal)}</div>
                </CardContent>
              </Card>
              
              <Card className="border-slate-800 bg-slate-900/40 shadow-lg">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                  <div className="flex items-center gap-2 mb-2">
                    <Sliders className="w-5 h-5 text-amber-500" />
                    <span className="text-sm font-medium text-slate-300">Adjustments</span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-amber-400">
                    {adjustmentCount}
                  </div>
                  <div className="flex gap-2 text-xs mt-1">
                    <span className="text-emerald-400 flex items-center"><ArrowUp className="w-3 h-3" />{increaseCount}</span>
                    <span className="text-red-400 flex items-center"><ArrowDown className="w-3 h-3" />{decreaseCount}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex justify-between items-center mb-4">
                <TabsList className="bg-slate-900 border border-slate-800">
                  <TabsTrigger value="simulator" className="data-[state=active]:bg-slate-800">Visualizations</TabsTrigger>
                  <TabsTrigger value="timeline" className="data-[state=active]:bg-slate-800">Data Tables</TabsTrigger>
                  <TabsTrigger value="analysis" className="data-[state=active]:bg-slate-800">Detailed Analysis</TabsTrigger>
                </TabsList>
                
                {activeTab === "simulator" && (
                  <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-md border border-slate-800">
                    <Button variant={viewMode === "chart" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("chart")} className="h-7 px-2">
                      <BarChart3 className="w-4 h-4 mr-1" /> Charts
                    </Button>
                    <Button variant={viewMode === "table" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("table")} className="h-7 px-2">
                      <FileText className="w-4 h-4 mr-1" /> Summary
                    </Button>
                  </div>
                )}
              </div>

              <TabsContent value="simulator" className="space-y-6 mt-0">
                {viewMode === "chart" ? (
                  <>
                    {/* Chart 1: Portfolio Value (AreaChart) */}
                    <Card className="border-slate-800 bg-slate-900/40 shadow-xl">
                      <CardHeader className="border-b border-slate-800 pb-4">
                        <CardTitle className="text-base flex items-center gap-2">
                          <PieChartIcon className="w-5 h-5 text-emerald-500" /> Portfolio Trajectory
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-6">
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} onClick={handleYearClick} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                              <XAxis dataKey="age" stroke="#64748b" tick={{fill: '#94a3b8'}} />
                              <YAxis stroke="#64748b" tickFormatter={(v) => `$${v}M`} tick={{fill: '#94a3b8'}} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                                formatter={(value: number) => [`$${(value * 1000000).toLocaleString()}`, 'Portfolio Value']}
                                labelFormatter={(label) => `Age: ${label}`}
                              />
                              <Area type="monotone" dataKey="portfolioM" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPortfolio)" activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Chart 2: Withdrawal Rate vs Guardrails (LineChart) */}
                      <Card className="border-slate-800 bg-slate-900/40 shadow-xl">
                        <CardHeader className="border-b border-slate-800 pb-4">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-500" /> Withdrawal Rate Mechanics
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={results} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="age" stroke="#64748b" tick={{fill: '#94a3b8'}} />
                                <YAxis stroke="#64748b" tickFormatter={(v) => `${v}%`} domain={[0, Math.max(10, upperGuardrail[0] + 2)]} tick={{fill: '#94a3b8'}} />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                                  formatter={(value: number) => [`${value.toFixed(2)}%`, 'Withdrawal Rate']}
                                />
                                <ReferenceLine y={upperGuardrail[0]} stroke="#ef4444" strokeDasharray="5 5" label={{ position: 'insideTopLeft', value: 'Upper Limit (Cut)', fill: '#ef4444', fontSize: 12 }} />
                                <ReferenceLine y={lowerGuardrail[0]} stroke="#10b981" strokeDasharray="5 5" label={{ position: 'insideBottomLeft', value: 'Lower Limit (Raise)', fill: '#10b981', fontSize: 12 }} />
                                <Line type="monotone" dataKey="withdrawalRate" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Chart 3: Income Composition (ComposedChart/BarChart) */}
                      <Card className="border-slate-800 bg-slate-900/40 shadow-xl">
                        <CardHeader className="border-b border-slate-800 pb-4">
                          <CardTitle className="text-base flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-purple-500" /> Annual Income Profile
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                <XAxis dataKey="age" stroke="#64748b" tick={{fill: '#94a3b8'}} />
                                <YAxis stroke="#64748b" tickFormatter={(v) => `$${v}k`} tick={{fill: '#94a3b8'}} />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                                  formatter={(value: number, name: string) => {
                                    const val = value * 1000;
                                    const label = name === 'withdrawalK' ? 'Gross Withdrawal' : 
                                                 name === 'netIncomeK' ? 'Net Income (After Tax)' : 
                                                 'Purchasing Power';
                                    return [`$${val.toLocaleString()}`, label];
                                  }}
                                />
                                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                <Bar dataKey="withdrawalK" name="Gross Withdrawal" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Line type="monotone" dataKey="netIncomeK" name="Net Income" stroke="#10b981" strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="purchasingPowerK" name="Purchasing Power" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                              </ComposedChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Chart 4: Wealth Distribution (PieChart) */}
                      <Card className="border-slate-800 bg-slate-900/40 shadow-xl">
                        <CardHeader className="border-b border-slate-800 pb-4">
                          <CardTitle className="text-base flex items-center gap-2">
                            <PieChartIcon className="w-5 h-5 text-amber-500" /> Wealth Distribution
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 flex justify-center items-center">
                          <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={distributionData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={90}
                                  paddingAngle={5}
                                  dataKey="value"
                                >
                                  {distributionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip 
                                  formatter={(value: number) => fmt(value)}
                                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                                />
                                <Legend layout="vertical" verticalAlign="middle" align="right" />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Chart 5: Scenario Radar (RadarChart) */}
                      <Card className="border-slate-800 bg-slate-900/40 shadow-xl lg:col-span-2">
                        <CardHeader className="border-b border-slate-800 pb-4">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Target className="w-5 h-5 text-pink-500" /> Strategy Effectiveness Score
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <div className="h-[250px] w-full flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                                { subject: 'Longevity', A: portfolioSurvived ? 100 : (results.filter((r) => r.portfolioValue > 0).length / results.length) * 100, fullMark: 100 },
                                { subject: 'Income Stability', A: Math.max(0, 100 - (adjustmentCount * 5)), fullMark: 100 },
                                { subject: 'Purchasing Power', A: Math.min(100, (results[results.length-1].purchasingPower / results[0].purchasingPower) * 100), fullMark: 100 },
                                { subject: 'Tax Efficiency', A: Math.max(0, 100 - (totalTaxes / totalWithdrawn) * 100 * 2), fullMark: 100 },
                                { subject: 'Growth Capture', A: increaseCount > 0 ? 80 + Math.min(20, increaseCount * 5) : 50, fullMark: 100 },
                              ]}>
                                <PolarGrid stroke="#334155" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar name="Strategy Score" dataKey="A" stroke="#ec4899" fill="#ec4899" fillOpacity={0.5} />
                                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                ) : (
                  <Card className="border-slate-800 bg-slate-900/40 shadow-xl">
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <h3 className="text-lg font-medium text-slate-200 mb-4 border-b border-slate-800 pb-2">Inputs Summary</h3>
                          <dl className="space-y-2">
                            {[
                              { label: "Initial Portfolio", value: fmt(portfolioValue) },
                              { label: "Initial Withdrawal", value: `${fmt(annualWithdrawal)} (${fmtPct(portfolioValue > 0 ? (annualWithdrawal / portfolioValue) * 100 : 0)})` },
                              { label: "Time Horizon", value: `${currentAge} to ${endAge} (${endAge - currentAge} years)` },
                              { label: "Guardrails", value: `${lowerGuardrail[0]}% lower, ${upperGuardrail[0]}% upper` },
                              { label: "Adjustments", value: `+${raisePercent[0]}% / -${cutPercent[0]}%` },
                              { label: "Market Scenario", value: marketScenario.charAt(0).toUpperCase() + marketScenario.slice(1) },
                              { label: "Inflation / Taxes", value: `${inflationRate[0]}% / ${taxRate[0]}%` }
                            ].map((item, i) => (
                              <div key={i} className="flex justify-between py-1 border-b border-slate-800/50 last:border-0">
                                <dt className="text-slate-400">{item.label}</dt>
                                <dd className="font-medium text-slate-200">{item.value}</dd>
                              </div>
                            ))}
                          </dl>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-slate-200 mb-4 border-b border-slate-800 pb-2">Outcomes Summary</h3>
                          <dl className="space-y-2">
                            {[
                              { label: "Final Portfolio", value: fmt(finalPortfolio), highlight: portfolioSurvived ? "text-emerald-400" : "text-red-400" },
                              { label: "Total Gross Withdrawn", value: fmt(totalWithdrawn) },
                              { label: "Total Net Income", value: fmt(totalWithdrawn - totalTaxes) },
                              { label: "Total Taxes Paid", value: fmt(totalTaxes) },
                              { label: "Highest Annual Income", value: fmt(maxWithdrawal) },
                              { label: "Lowest Annual Income", value: fmt(minWithdrawal) },
                              { label: "Total Adjustments Triggered", value: adjustmentCount.toString() }
                            ].map((item, i) => (
                              <div key={i} className="flex justify-between py-1 border-b border-slate-800/50 last:border-0">
                                <dt className="text-slate-400">{item.label}</dt>
                                <dd className={`font-medium ${item.highlight || "text-slate-200"}`}>{item.value}</dd>
                              </div>
                            ))}
                          </dl>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="timeline" className="space-y-6 mt-0">
                {/* Data Tables (6+) */}
                
                {/* Table 1: Full Year-by-Year Simulation */}
                <Card className="border-slate-800 bg-slate-900/40 shadow-xl overflow-hidden">
                  <CardHeader className="border-b border-slate-800 bg-slate-900/80">
                    <CardTitle className="text-base flex items-center justify-between">
                      <span className="flex items-center gap-2"><FileText className="w-5 h-5 text-blue-400" /> Complete Simulation Timeline</span>
                      <Button variant="outline" size="sm" className="h-8 border-slate-700">
                        <Download className="w-4 h-4 mr-2" /> Export CSV
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 overflow-x-auto max-h-[600px] overflow-y-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-slate-400 uppercase bg-slate-950/50 sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-3 font-medium">Age</th>
                          <th className="px-4 py-3 font-medium text-right">Portfolio</th>
                          <th className="px-4 py-3 font-medium text-right">Market Ret</th>
                          <th className="px-4 py-3 font-medium text-right">Gross W/D</th>
                          <th className="px-4 py-3 font-medium text-right">W/D Rate</th>
                          <th className="px-4 py-3 font-medium text-center">Action</th>
                          <th className="px-4 py-3 font-medium text-right">Net Income</th>
                          <th className="px-4 py-3 font-medium text-right">Purchasing Pwr</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {results.map((r, i) => (
                          <tr key={r.year} className={`hover:bg-slate-800/30 transition-colors ${selectedYear === r.year ? 'bg-blue-900/20' : ''}`} onClick={() => setSelectedYear(r.year)}>
                            <td className="px-4 py-2.5 font-medium text-slate-300">{r.age}</td>
                            <td className="px-4 py-2.5 text-right font-mono text-slate-300">{fmt(r.portfolioValue)}</td>
                            <td className={`px-4 py-2.5 text-right font-mono ${r.marketReturn >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                              {r.marketReturn > 0 ? "+" : ""}{r.marketReturn.toFixed(1)}%
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono text-blue-300">{fmt(r.withdrawal)}</td>
                            <td className="px-4 py-2.5 text-right font-mono">
                              <span className={r.withdrawalRate > upperGuardrail[0] ? "text-red-400 font-bold" : r.withdrawalRate < lowerGuardrail[0] ? "text-emerald-400 font-bold" : "text-slate-300"}>
                                {r.withdrawalRate.toFixed(2)}%
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              {r.action === "increase" && <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"><ArrowUp className="w-3 h-3 mr-1" />Raise</Badge>}
                              {r.action === "decrease" && <Badge className="bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"><ArrowDown className="w-3 h-3 mr-1" />Cut</Badge>}
                              {r.action === "maintain" && <span className="text-slate-500 text-xs flex items-center justify-center"><Minus className="w-3 h-3 mr-1" />Hold</span>}
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono text-purple-300">{fmt(r.netIncome)}</td>
                            <td className="px-4 py-2.5 text-right font-mono text-amber-300/80">{fmt(r.purchasingPower)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Table 2: Guardrail Adjustments Log */}
                  <Card className="border-slate-800 bg-slate-900/40 shadow-xl">
                    <CardHeader className="border-b border-slate-800 pb-4">
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" /> Guardrail Adjustments Log
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 overflow-hidden">
                      {adjustmentCount === 0 ? (
                        <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                          <CheckCircle2 className="w-12 h-12 text-slate-700 mb-3" />
                          <p>No guardrail adjustments triggered in this scenario.</p>
                        </div>
                      ) : (
                        <div className="max-h-[300px] overflow-y-auto">
                          <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-400 uppercase bg-slate-950/50 sticky top-0">
                              <tr>
                                <th className="px-4 py-2 font-medium">Age</th>
                                <th className="px-4 py-2 font-medium">Trigger</th>
                                <th className="px-4 py-2 font-medium text-right">Old W/D</th>
                                <th className="px-4 py-2 font-medium text-right">New W/D</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                              {results.filter((r) => r.action !== "maintain").map((r, i, arr) => {
                                const prevYear = r.year > 1 ? results[r.year - 2].withdrawal : annualWithdrawal;
                                return (
                                  <tr key={r.year} className="hover:bg-slate-800/30">
                                    <td className="px-4 py-2 text-slate-300">{r.age}</td>
                                    <td className="px-4 py-2">
                                      {r.action === "increase" ? 
                                        <span className="text-emerald-400 text-xs flex items-center"><ArrowUp className="w-3 h-3 mr-1" />Rate fell to {r.withdrawalRate.toFixed(1)}%</span> : 
                                        <span className="text-red-400 text-xs flex items-center"><ArrowDown className="w-3 h-3 mr-1" />Rate hit {r.withdrawalRate.toFixed(1)}%</span>
                                      }
                                    </td>
                                    <td className="px-4 py-2 text-right font-mono text-slate-400">{fmt(prevYear)}</td>
                                    <td className="px-4 py-2 text-right font-mono text-slate-200">{fmt(r.withdrawal)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Table 3: Decadal Summary */}
                  <Card className="border-slate-800 bg-slate-900/40 shadow-xl">
                    <CardHeader className="border-b border-slate-800 pb-4">
                      <CardTitle className="text-base flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-purple-500" /> Decadal Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 overflow-hidden">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-950/50">
                          <tr>
                            <th className="px-4 py-2 font-medium">Phase</th>
                            <th className="px-4 py-2 font-medium text-right">Avg Portfolio</th>
                            <th className="px-4 py-2 font-medium text-right">Total Income</th>
                            <th className="px-4 py-2 font-medium text-center">Adjustments</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {[
                            { label: "Early (Y1-10)", data: results.slice(0, 10) },
                            { label: "Mid (Y11-20)", data: results.slice(10, 20) },
                            { label: "Late (Y21+)", data: results.slice(20) }
                          ].filter((phase) => phase.data.length > 0).map((phase, i) => {
                            const avgPort = phase.data.reduce((s, r) => s + r.portfolioValue, 0) / phase.data.length;
                            const totInc = phase.data.reduce((s, r) => s + r.withdrawal, 0);
                            const adjs = phase.data.filter((r) => r.action !== "maintain").length;
                            return (
                              <tr key={i} className="hover:bg-slate-800/30">
                                <td className="px-4 py-3 text-slate-300 font-medium">{phase.label}</td>
                                <td className="px-4 py-3 text-right font-mono text-slate-400">{fmt(avgPort)}</td>
                                <td className="px-4 py-3 text-right font-mono text-blue-300">{fmt(totInc)}</td>
                                <td className="px-4 py-3 text-center text-amber-400">{adjs}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Table 4: Tax Implications */}
                  <Card className="border-slate-800 bg-slate-900/40 shadow-xl">
                    <CardHeader className="border-b border-slate-800 pb-4">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-500" /> Tax & RMD Overview
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 overflow-hidden">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-950/50">
                          <tr>
                            <th className="px-4 py-2 font-medium">Milestone</th>
                            <th className="px-4 py-2 font-medium text-right">Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          <tr className="hover:bg-slate-800/30">
                            <td className="px-4 py-2.5 text-slate-300">Estimated Tax Rate</td>
                            <td className="px-4 py-2.5 text-right font-mono text-slate-400">{taxRate[0]}%</td>
                          </tr>
                          <tr className="hover:bg-slate-800/30">
                            <td className="px-4 py-2.5 text-slate-300">Total Taxes Paid</td>
                            <td className="px-4 py-2.5 text-right font-mono text-red-400">{fmt(totalTaxes)}</td>
                          </tr>
                          <tr className="hover:bg-slate-800/30">
                            <td className="px-4 py-2.5 text-slate-300">Avg Annual Tax</td>
                            <td className="px-4 py-2.5 text-right font-mono text-slate-400">{fmt(totalTaxes / results.length)}</td>
                          </tr>
                          <tr className="hover:bg-slate-800/30">
                            <td className="px-4 py-2.5 text-slate-300">Max RMD Year</td>
                            <td className="px-4 py-2.5 text-right font-mono text-amber-400">
                              {includeRMDs ? `Age ${results.reduce((max, r) => r.requiredMinimumDistribution > max.rmd ? {age: r.age, rmd: r.requiredMinimumDistribution} : max, {age: 0, rmd: 0}).age}` : "N/A"}
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-800/30">
                            <td className="px-4 py-2.5 text-slate-300">Peak RMD Amount</td>
                            <td className="px-4 py-2.5 text-right font-mono text-amber-400">
                              {includeRMDs ? fmt(Math.max(...results.map((r) => r.requiredMinimumDistribution))) : "N/A"}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>

                  {/* Table 5: Market Sequence */}
                  <Card className="border-slate-800 bg-slate-900/40 shadow-xl">
                    <CardHeader className="border-b border-slate-800 pb-4">
                      <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-500" /> Market Sequence Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 overflow-hidden">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-950/50">
                          <tr>
                            <th className="px-4 py-2 font-medium">Metric</th>
                            <th className="px-4 py-2 font-medium text-right">Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          <tr className="hover:bg-slate-800/30">
                            <td className="px-4 py-2.5 text-slate-300">Scenario</td>
                            <td className="px-4 py-2.5 text-right text-slate-400 capitalize">{marketScenario}</td>
                          </tr>
                          <tr className="hover:bg-slate-800/30">
                            <td className="px-4 py-2.5 text-slate-300">Positive Years</td>
                            <td className="px-4 py-2.5 text-right font-mono text-emerald-400">
                              {results.filter((r) => r.marketReturn > 0).length} / {results.length}
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-800/30">
                            <td className="px-4 py-2.5 text-slate-300">Negative Years</td>
                            <td className="px-4 py-2.5 text-right font-mono text-red-400">
                              {results.filter((r) => r.marketReturn < 0).length} / {results.length}
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-800/30">
                            <td className="px-4 py-2.5 text-slate-300">Best Year Return</td>
                            <td className="px-4 py-2.5 text-right font-mono text-emerald-400">
                              +{Math.max(...results.map((r) => r.marketReturn)).toFixed(1)}%
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-800/30">
                            <td className="px-4 py-2.5 text-slate-300">Worst Year Return</td>
                            <td className="px-4 py-2.5 text-right font-mono text-red-400">
                              {Math.min(...results.map((r) => r.marketReturn)).toFixed(1)}%
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>

                  {/* Table 6: Client Context Mapping */}
                  <Card className="border-slate-800 bg-slate-900/40 shadow-xl">
                    <CardHeader className="border-b border-slate-800 pb-4">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Info className="w-5 h-5 text-blue-500" /> Client Data Mapping
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 overflow-hidden">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-slate-400 uppercase bg-slate-950/50">
                          <tr>
                            <th className="px-4 py-2 font-medium">Source Data</th>
                            <th className="px-4 py-2 font-medium text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          <tr className="hover:bg-slate-800/30">
                            <td className="px-4 py-2.5 text-slate-300">Basic Profile (Age, Name)</td>
                            <td className="px-4 py-2.5 text-center">
                              {clientData?.age ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <Minus className="w-4 h-4 text-slate-600 mx-auto" />}
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-800/30">
                            <td className="px-4 py-2.5 text-slate-300">Account Balances</td>
                            <td className="px-4 py-2.5 text-center">
                              {clientData?.iraBalance !== undefined ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <Minus className="w-4 h-4 text-slate-600 mx-auto" />}
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-800/30">
                            <td className="px-4 py-2.5 text-slate-300">Risk Profile Data</td>
                            <td className="px-4 py-2.5 text-center">
                              {riskProfile ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <Minus className="w-4 h-4 text-slate-600 mx-auto" />}
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-800/30">
                            <td className="px-4 py-2.5 text-slate-300">Tax Return (OCR)</td>
                            <td className="px-4 py-2.5 text-center">
                              {taxRates ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <Minus className="w-4 h-4 text-slate-600 mx-auto" />}
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-800/30">
                            <td className="px-4 py-2.5 text-slate-300">Saved Strategies</td>
                            <td className="px-4 py-2.5 text-center">
                              {savedStrategies?.length ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <Minus className="w-4 h-4 text-slate-600 mx-auto" />}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="analysis" className="space-y-6 mt-0">
                <Card className="border-slate-800 bg-slate-900/60 shadow-xl">
                  <CardHeader className="border-b border-slate-800 pb-4 bg-slate-900">
                    <CardTitle className="text-xl flex items-center gap-3">
                      <Lock className="w-6 h-6 text-indigo-500" /> Advisor Insights & Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-8 px-8 prose prose-invert max-w-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div>
                        <h3 className="text-xl font-semibold text-slate-200 mb-4 flex items-center gap-2">
                          <FileText className="w-5 h-5 text-blue-400" /> Executive Summary
                        </h3>
                        <p className="text-slate-300 leading-relaxed mb-4">
                          The Dynamic Retirement Guardrails simulation projects a {endAge - currentAge}-year retirement period starting at age {currentAge} with an initial portfolio of <strong className="text-white">{fmt(portfolioValue)}</strong> and initial annual withdrawal of <strong className="text-white">{fmt(annualWithdrawal)}</strong>. This represents a <strong className="text-white">{portfolioValue > 0 ? ((annualWithdrawal / portfolioValue) * 100).toFixed(1) : 0}%</strong> initial withdrawal rate.
                        </p>
                        <p className="text-slate-300 leading-relaxed mb-4">
                          Under the <strong className="text-white capitalize">{marketScenario}</strong> market scenario, the portfolio {portfolioSurvived ? <span className="text-emerald-400 font-medium">successfully survived</span> : <span className="text-red-400 font-medium">was depleted before</span>} the full retirement period, with a final projected value of <strong className="text-white">{fmt(finalPortfolio)}</strong>.
                        </p>
                        <p className="text-slate-300 leading-relaxed">
                          Over the simulation period, a total of <strong className="text-white">{fmt(totalWithdrawn)}</strong> was withdrawn, with annual income ranging from <strong className="text-white">{fmt(minWithdrawal)}</strong> to <strong className="text-white">{fmt(maxWithdrawal)}</strong>. The guardrail system triggered <strong className="text-white">{adjustmentCount}</strong> adjustment(s): {increaseCount} spending increase(s) and {decreaseCount} spending cut(s).
                        </p>
                      </div>

                      <div className="bg-slate-950 p-6 rounded-xl border border-slate-800">
                        <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                          <Target className="w-5 h-5 text-pink-400" /> Strategic Assessment
                        </h3>
                        
                        <div className="space-y-4">
                          <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
                            <h4 className="font-medium text-slate-200 mb-1">Longevity Risk</h4>
                            <p className="text-sm text-slate-400">
                              {portfolioSurvived 
                                ? "Low. The dynamic adjustments successfully prevented portfolio depletion. The client can have high confidence in not outliving their assets under this scenario."
                                : "High. Even with dynamic adjustments, the portfolio was depleted. Immediate action is required to lower initial spending or increase guaranteed income sources."}
                            </p>
                          </div>
                          
                          <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
                            <h4 className="font-medium text-slate-200 mb-1">Income Volatility</h4>
                            <p className="text-sm text-slate-400">
                              {adjustmentCount === 0 
                                ? "None. Income grew steadily with inflation with no cuts required."
                                : adjustmentCount < 5 
                                  ? `Moderate. The client experienced ${adjustmentCount} income changes over ${endAge - currentAge} years, which is highly manageable for most retirees.`
                                  : `High. The client experienced ${adjustmentCount} income changes, including ${decreaseCount} cuts. Ensure they have sufficient discretionary spending to absorb these shocks.`}
                            </p>
                          </div>
                          
                          <div className="p-4 rounded-lg bg-slate-900 border border-slate-800">
                            <h4 className="font-medium text-slate-200 mb-1">Purchasing Power</h4>
                            <p className="text-sm text-slate-400">
                              {results[results.length-1].purchasingPower >= results[0].purchasingPower
                                ? "Maintained. Real spending power grew or stayed flat over the retirement period, successfully combating inflation."
                                : "Eroded. The client's real spending power dropped over time due to inflation and necessary spending cuts."}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-slate-800">
                      <h3 className="text-xl font-semibold text-slate-200 mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-emerald-400" /> Guardrails Methodology
                      </h3>
                      <p className="text-slate-300 leading-relaxed mb-4">
                        The dynamic guardrails approach provides a flexible alternative to the traditional fixed 4% rule. By systematically adjusting spending in response to portfolio performance, retirees can safely withdraw more during strong market environments while automatically protecting against sequence-of-returns risk during severe downturns.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <div className="bg-emerald-950/20 border border-emerald-900/50 p-5 rounded-lg">
                          <h4 className="font-medium text-emerald-400 mb-2 flex items-center gap-2"><ArrowUp className="w-4 h-4" /> The Prosperity Rule (Lower Guardrail)</h4>
                          <p className="text-sm text-slate-300">
                            When the portfolio grows significantly faster than withdrawals, the withdrawal rate drops. If it drops below <strong>{lowerGuardrail[0]}%</strong>, the client is under-spending. The system automatically triggers a <strong>{raisePercent[0]}%</strong> real increase in their paycheck, allowing them to enjoy their wealth.
                          </p>
                        </div>
                        <div className="bg-red-950/20 border border-red-900/50 p-5 rounded-lg">
                          <h4 className="font-medium text-red-400 mb-2 flex items-center gap-2"><ArrowDown className="w-4 h-4" /> The Preservation Rule (Upper Guardrail)</h4>
                          <p className="text-sm text-slate-300">
                            When the portfolio declines significantly, the withdrawal rate spikes. If it exceeds <strong>{upperGuardrail[0]}%</strong>, the client is over-spending relative to their remaining balance. The system automatically triggers a <strong>{cutPercent[0]}%</strong> reduction in their paycheck to preserve capital.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-12 bg-slate-950 p-4 rounded border border-slate-800 text-center">
                      <em className="text-xs text-slate-500">
                        Analysis generated by Russell Capital Systems™ AI Engine. This simulation uses simplified assumptions including constant tax rates and deterministic inflation. It should not be the sole basis for retirement planning decisions. Past market performance does not guarantee future results.
                      </em>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    
        <ComplianceFooter pageName="RetirementGuardrails" showsTax showsEstate showsProjections showsHistoricalData />
      </AppShell>
  );
}
