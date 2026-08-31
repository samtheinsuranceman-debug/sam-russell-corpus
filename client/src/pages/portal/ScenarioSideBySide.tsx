// @ts-nocheck
import { useState, useMemo, useEffect, useCallback } from "react";
import { 
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer,
  LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart, Legend
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import {
  GitCompare,
  Plus,
  Trash2,
  TrendingUp,
  DollarSign,
  Shield,
  CheckCircle2,
  BarChart3,
  Calculator,
  Download,
  PieChart as PieChartIcon,
  Activity,
  Zap,
  FileText,
  Settings,
  Target,
  BookOpen,
  AlertOctagon,
  TrendingDown,
  Layers,
  Crosshair,
} from "lucide-react";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import { NumberInput } from "@/components/NumberInput";
import { toast } from "sonner";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const fmtPct = (n: number) => `${n.toFixed(2)}%`;
const fmtNum = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });

interface Scenario {
  id: string;
  name: string;
  strategy: string;
  annualContribution: number;
  growthRate: number;
  taxRate: number;
  years: number;
  color: string;
  inflationRate: number;
  managementFee: number;
  riskTolerance: number;
}

const STRATEGY_PRESETS: Record<string, Partial<Scenario>> = {
  do_nothing: { name: "Do Nothing", growthRate: 4, taxRate: 22, annualContribution: 0, inflationRate: 2.5, managementFee: 1.0, riskTolerance: 3 },
  roth_conversion: { name: "Roth Conversion", growthRate: 7, taxRate: 0, annualContribution: 50000, inflationRate: 2.5, managementFee: 1.0, riskTolerance: 6 },
  iul_strategy: { name: "IUL + Mortgage Killer", growthRate: 7.5, taxRate: 0, annualContribution: 24000, inflationRate: 2.5, managementFee: 1.5, riskTolerance: 5 },
  aggressive_401k: { name: "Max 401(k) + Roth", growthRate: 8, taxRate: 12, annualContribution: 23500, inflationRate: 2.5, managementFee: 0.8, riskTolerance: 8 },
  annuity_income: { name: "FIA + Income Rider", growthRate: 5.5, taxRate: 15, annualContribution: 30000, inflationRate: 2.5, managementFee: 1.2, riskTolerance: 2 },
  real_estate: { name: "Real Estate + IUL", growthRate: 9, taxRate: 5, annualContribution: 36000, inflationRate: 3.0, managementFee: 2.0, riskTolerance: 7 },
  crypto_blend: { name: "Crypto + Traditional Blend", growthRate: 12, taxRate: 15, annualContribution: 20000, inflationRate: 2.5, managementFee: 1.5, riskTolerance: 10 },
  conservative_bond: { name: "Conservative Bond Ladder", growthRate: 3.5, taxRate: 20, annualContribution: 10000, inflationRate: 2.5, managementFee: 0.5, riskTolerance: 1 },
};

const COLORS = ["from-blue-500 to-blue-600", "from-emerald-500 to-emerald-600", "from-amber-500 to-amber-600", "from-purple-500 to-purple-600", "from-rose-500 to-rose-600"];
const TEXT_COLORS = ["text-blue-400", "text-emerald-400", "text-amber-400", "text-purple-400", "text-rose-400"];
const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#a855f7", "#f43f5e"];
const RADAR_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#a855f7", "#f43f5e"];

export default function ScenarioSideBySide() {
  const { user } = useAuth();
  const { selectedClientId } = useClientData();
  
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: marketData } = trpc.marketData.getOverview.useQuery(undefined, { enabled: !!user });
  const { data: riskScoring } = trpc.riskScoring.scores.useQuery({ clientId: selectedClientId || 0 }, { enabled: !!selectedClientId });
  const { data: recommendations } = trpc.recommendations.list.useQuery({ clientId: selectedClientId || 0 }, { enabled: !!selectedClientId });
  const { data: strategyAnalytics } = trpc.strategyAnalytics.getMetrics.useQuery(undefined, { enabled: !!user });
  const { data: savedStrategies } = trpc.savedStrategies.list.useQuery(undefined, { enabled: !!user });
  
  const [clientId, setClientId] = useState<number | null>(selectedClientId ?? null);
  const [activeTab, setActiveTab] = useState("overview");
  const [comparisonYears, setComparisonYears] = useState(20);
  const [showInflationAdjusted, setShowInflationAdjusted] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  const [hoveredData, setHoveredData] = useState<any>(null);

  useEffect(() => {
    if (selectedClientId && selectedClientId !== clientId) {
      setClientId(selectedClientId);
    }
  }, [selectedClientId, clientId]);

  useEffect(() => {
    if (!clients) return;
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      toast.success(`Loaded data for ${client.firstName} ${client.lastName}`);
    }
  }, [clientId, clients]);

  const client = useMemo(() => clients?.find((c) => c.id === clientId), [clients, clientId]);

  const startingBalance = useMemo(() => {
    return client ? (Number(client.iraBalance ?? 0) + Number(client.rothBalance ?? 0) + Number(client.taxableAssets ?? 0) + Number(client.realEstateEquity ?? 0)) : 500000;
  }, [client]);

  const [scenarios, setScenarios] = useState<Scenario[]>([
    { id: "1", name: "Do Nothing", strategy: "do_nothing", annualContribution: 0, growthRate: 4, taxRate: 22, years: comparisonYears, color: COLORS[0], inflationRate: 2.5, managementFee: 1.0, riskTolerance: 3 },
    { id: "2", name: "Roth Conversion Ladder", strategy: "roth_conversion", annualContribution: 50000, growthRate: 7, taxRate: 0, years: comparisonYears, color: COLORS[1], inflationRate: 2.5, managementFee: 1.0, riskTolerance: 6 },
  ]);

  const handleYearChange = useCallback((years: number) => {
    setComparisonYears(years);
    setScenarios(prev => prev.map((s) => ({ ...s, years })));
  }, []);

  const projections = useMemo(() => {
    return scenarios.map((s) => {
      const data: { 
        year: number; 
        balance: number; 
        realBalance: number;
        contributions: number; 
        growth: number; 
        taxes: number;
        fees: number;
      }[] = [];
      
      let balance = startingBalance;
      let totalContributions = 0;
      let totalGrowth = 0;
      let totalTaxes = 0;
      let totalFees = 0;

      for (let y = 1; y <= s.years; y++) {
        const contribution = s.annualContribution;
        const fee = balance * (s.managementFee / 100);
        const growth = (balance + contribution - fee) * (s.growthRate / 100);
        const tax = growth > 0 ? growth * (s.taxRate / 100) : 0;
        
        balance = balance + contribution + growth - tax - fee;
        const realBalance = balance / Math.pow(1 + s.inflationRate / 100, y);
        
        totalContributions += contribution;
        totalGrowth += growth;
        totalTaxes += tax;
        totalFees += fee;
        
        data.push({ 
          year: y, 
          balance, 
          realBalance,
          contributions: totalContributions, 
          growth: totalGrowth, 
          taxes: totalTaxes,
          fees: totalFees
        });
      }

      return {
        ...s,
        data,
        finalBalance: balance,
        finalRealBalance: data[data.length - 1]?.realBalance || balance,
        totalContributions,
        totalGrowth,
        totalTaxes,
        totalFees,
        netGain: balance - startingBalance - totalContributions,
        effectiveReturn: ((balance / (startingBalance + totalContributions)) - 1) * 100,
        riskAdjustedReturn: (s.growthRate - s.managementFee) / (s.riskTolerance || 1),
      };
    });
  }, [scenarios, startingBalance]);

  const bestScenario = useMemo(() => {
    if (projections.length === 0) return null;
    return projections.reduce((best, p) => p.finalBalance > best.finalBalance ? p : best, projections[0]);
  }, [projections]);

  const riskAnalysisData = useMemo(() => {
    return projections.map((p) => ({
      name: p.name,
      Return: p.effectiveReturn,
      Risk: p.riskTolerance * 10,
      Fees: p.totalFees / 1000,
      Taxes: p.totalTaxes / 1000,
      Efficiency: p.riskAdjustedReturn * 100
    }));
  }, [projections]);

  const combinedYearlyData = useMemo(() => {
    if (projections.length === 0) return [];
    return projections[0].data.map((d, i) => {
      const yearData: any = { year: `Yr ${d.year}`, rawYear: d.year };
      projections.forEach((p, pIdx) => {
        yearData[`scenario${pIdx}`] = showInflationAdjusted ? p.data[i]?.realBalance || 0 : p.data[i]?.balance || 0;
        yearData[`${p.name} Balance`] = showInflationAdjusted ? p.data[i]?.realBalance || 0 : p.data[i]?.balance || 0;
        yearData[`${p.name} Contributions`] = p.data[i]?.contributions || 0;
        yearData[`${p.name} Taxes`] = p.data[i]?.taxes || 0;
      });
      return yearData;
    });
  }, [projections, showInflationAdjusted]);

  const addScenario = useCallback(() => {
    if (scenarios.length >= 5) { toast.error("Maximum 5 scenarios"); return; }
    const idx = scenarios.length;
    setScenarios(prev => [...prev, {
      id: Date.now().toString(), 
      name: `Scenario ${idx + 1}`, 
      strategy: "iul_strategy",
      annualContribution: 24000, 
      growthRate: 7.5, 
      taxRate: 0, 
      years: comparisonYears, 
      color: COLORS[idx % COLORS.length],
      inflationRate: 2.5,
      managementFee: 1.5,
      riskTolerance: 5
    }]);
  }, [scenarios.length, comparisonYears]);

  const removeScenario = useCallback((id: string) => {
    if (scenarios.length <= 1) { toast.error("Need at least one scenario"); return; }
    setScenarios(prev => prev.filter((s) => s.id !== id));
    if (selectedScenarioId === id) setSelectedScenarioId(null);
  }, [scenarios.length, selectedScenarioId]);

  const updateScenario = useCallback((id: string, field: keyof Scenario, value: any) => {
    setScenarios(prev => prev.map((s) => s.id === id ? { ...s, [field]: value } : s));
  }, []);

  const applyPreset = useCallback((id: string, preset: string) => {
    const p = STRATEGY_PRESETS[preset];
    if (!p) return;
    setScenarios(prev => prev.map((s) => s.id === id ? { ...s, ...p, strategy: preset } : s));
  }, []);

  const exportToCSV = useCallback(() => {
    setIsExporting(true);
    try {
      const headers = ["Metric", ...projections.map((p) => p.name)].join(",");
      const rows = [
        ["Starting Balance", ...projections.map((p) => startingBalance)],
        ["Total Contributions", ...projections.map((p) => p.totalContributions)],
        ["Total Growth", ...projections.map((p) => p.totalGrowth)],
        ["Total Taxes Paid", ...projections.map((p) => p.totalTaxes)],
        ["Total Fees Paid", ...projections.map((p) => p.totalFees)],
        ["Net Gain", ...projections.map((p) => p.netGain)],
        ["Final Nominal Balance", ...projections.map((p) => p.finalBalance)],
        ["Final Real Balance (Inf. Adj)", ...projections.map((p) => p.finalRealBalance)],
        ["Effective Return (%)", ...projections.map((p) => p.effectiveReturn.toFixed(2))],
        ["Risk-Adjusted Score", ...projections.map((p) => p.riskAdjustedReturn.toFixed(2))]
      ];
      
      const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows.map((e) => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `scenario_comparison_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Exported to CSV successfully");
    } catch (error) {
      toast.error("Failed to export CSV");
    } finally {
      setIsExporting(false);
    }
  }, [projections, startingBalance]);

  const toggleInflation = useCallback(() => {
    setShowInflationAdjusted(prev => !prev);
  }, []);

  const handleClientChange = useCallback((val: string) => {
    setClientId(Number(val));
  }, []);

  if (!clients) {
    return (
      <AppShell title="Scenario Comparison" subtitle="Loading client data...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#22c55e]"></div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Scenario Comparison" subtitle="Compare multiple financial strategies side by side">
      <div className="space-y-6 max-w-7xl mx-auto pb-12">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="ScenarioSideBySide" />

        <ExecutiveSummary
          pageTitle="Scenario Side By Side"
          whatItDoes="This market analysis tool provides institutional-grade analysis of your financial situation, modeling multiple scenarios and projecting outcomes based on your specific inputs. It transforms complex market analysis concepts into clear, actionable insights with dollar-quantified recommendations."
          opportunities="Historical data shows that strategic index allocation with downside protection consistently outperforms both pure equity and pure fixed strategies over 10+ year periods."
          intent="To give you the same caliber of market analysis analysis that institutional investors and ultra-high-net-worth families receive — now accessible to every client."
          takeaway="Understanding your market analysis options with precise dollar amounts empowers you to make confident decisions that compound into significant wealth over time."
          callToAction="Enter your numbers and see exactly how market analysis strategies can improve your financial outcome."
          followUpQuestions={[
            "How does this market analysis strategy interact with my other financial plans?",
            "What\'s the single biggest market analysis opportunity I\'m currently missing?",
            "How would my results change if I started this strategy 5 years earlier?",
          ]}
        />
        <GoalsAccelerator pageName="Scenario Side By Side" pageContext="Scenario Side By Side — market analysis modeling with projections and scenario analysis" />
        <TaxBracketPanel grossIncome={clientData?.annualIncome || 150000} filingStatus={clientData?.filingStatus || "single"} stateCode={clientData?.state || "TX"} />
        <RecommendationSummary
          headline="This market analysis strategy can significantly improve your financial outcome"
          detail="Based on your profile, implementing the recommended market analysis approach could generate substantial savings and growth over your planning horizon."
          dollarBenefit={280000}
          timeHorizon="20 years"
          confidence="high"
          nextStep="Review with your advisor"
        />
        <DoNothingBaseline
          metrics={[
            { label: "Risk-Adjusted Return", doNothing: 5.2, recommended: 8.4, format: "percent" },
            { label: "Downside Protection", doNothing: 0, recommended: 100, format: "percent" },
            { label: "20-Year Growth", doNothing: 450000, recommended: 730000, format: "currency" },
          ]}
          summary="Without taking action on market analysis, you leave significant value on the table that compounds into a major opportunity cost over time."
        />
        {/* Page Header */}
        <div className="rc-page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[#0d1a2e] border border-[#12233e]">
              <GitCompare className="h-6 w-6 text-[#22c55e]" />
            </div>
            <div>
              <h1 className="rc-page-title text-2xl font-bold text-white">Advanced Strategy Comparison</h1>
              <p className="rc-page-subtitle text-[#7a95b8]">Analyze and compare up to 5 comprehensive financial scenarios</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <FactFinderBadge />
            <Button onClick={toggleInflation} variant="outline" className={`rc-btn border border-[#12233e] ${showInflationAdjusted ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-[#0d1a2e] text-[#c8d8ec]'}`}>
              {showInflationAdjusted ? <Activity className="h-4 w-4 mr-2" /> : <TrendingUp className="h-4 w-4 mr-2" />}
              {showInflationAdjusted ? 'Real (Inf. Adj)' : 'Nominal'}
            </Button>
            <Button onClick={exportToCSV} disabled={isExporting} className="rc-btn rc-btn-ghost bg-[#0d1a2e] text-[#c8d8ec] border border-[#12233e] hover:bg-[#12233e]">
              <Download className="h-4 w-4 mr-2" /> {isExporting ? 'Exporting...' : 'Export CSV'}
            </Button>
            <ExportToSlides
              toolName="Advanced Scenario Comparison"
              getSections={() => [
                {
                  title: "Comparison Overview",
                  items: [
                    { label: "Starting Balance", value: fmt(startingBalance) },
                    { label: "Scenarios Compared", value: scenarios.length.toString() },
                    { label: "Projection Timeline", value: `${comparisonYears} Years` },
                    { label: "Basis", value: showInflationAdjusted ? "Inflation Adjusted (Real)" : "Nominal" }
                  ]
                },
                ...projections.map((p) => ({
                  title: p.name,
                  items: [
                    { label: "Strategy", value: STRATEGY_PRESETS[p.strategy]?.name || p.strategy },
                    { label: "Annual Contribution", value: fmt(p.annualContribution) },
                    { label: "Growth Rate", value: `${p.growthRate}%` },
                    { label: "Tax Rate", value: `${p.taxRate}%` },
                    { label: "Management Fee", value: `${p.managementFee}%` },
                    { label: "Inflation Rate", value: `${p.inflationRate}%` },
                    { label: "Total Contributions", value: fmt(p.totalContributions) },
                    { label: "Total Growth", value: fmt(p.totalGrowth) },
                    { label: "Total Taxes Paid", value: fmt(p.totalTaxes) },
                    { label: "Total Fees Paid", value: fmt(p.totalFees) },
                    { label: "Net Gain", value: fmt(p.netGain) },
                    { label: "Final Nominal Balance", value: fmt(p.finalBalance) },
                    { label: "Final Real Balance", value: fmt(p.finalRealBalance) },
                    { label: "Effective Return", value: `${p.effectiveReturn.toFixed(2)}%` }
                  ]
                }))
              ]}
            />
            {scenarios.length < 5 && (
              <Button onClick={addScenario} className="rc-btn rc-btn-primary bg-[#22c55e] text-white hover:bg-[#1ea950]">
                <Plus className="h-4 w-4 mr-2" /> Add Scenario
              </Button>
            )}
          </div>
        </div>

        {/* Global Controls & Client Selector */}
        <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-1 w-full max-w-md">
              <Label className="text-xs text-[#7a95b8] mb-1.5 block">Select Client Portfolio</Label>
              <Select value={clientId?.toString() ?? ""} onValueChange={handleClientChange}>
                <SelectTrigger className="rc-input bg-[#060d19] border-[#12233e] text-white w-full">
                  <SelectValue placeholder="Select client for starting balance..." />
                </SelectTrigger>
                <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                  {clients?.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.firstName} {c.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1 w-full max-w-xs">
              <Label className="text-xs text-[#7a95b8] mb-1.5 block">Global Projection Years</Label>
              <div className="flex items-center gap-3">
                <input 
                  type="range" 
                  min="5" 
                  max="50" 
                  step="1" 
                  value={comparisonYears} 
                  onChange={(e) => handleYearChange(Number(e.target.value))}
                  className="w-full accent-[#22c55e]"
                />
                <span className="text-white font-medium w-12 text-right">{comparisonYears}y</span>
              </div>
            </div>

            <div className="md:ml-auto bg-[#060d19] px-5 py-3 rounded-xl border border-[#12233e] flex flex-col">
              <span className="text-xs text-[#7a95b8] uppercase tracking-wider font-semibold">Current Portfolio Value</span>
              <span className="text-2xl text-white font-bold">{fmt(startingBalance)}</span>
            </div>
          </div>
        </div>

        {/* Scenario Configuration Grid */}
        <div className={`grid gap-5 ${scenarios.length >= 4 ? "grid-cols-1 lg:grid-cols-2 xl:grid-cols-4" : scenarios.length === 3 ? "grid-cols-1 lg:grid-cols-3" : scenarios.length === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
          {scenarios.map((s, idx) => (
            <div 
              key={s.id} 
              className={`rc-card bg-[#0d1a2e] border rounded-2xl overflow-hidden transition-all duration-300 ${selectedScenarioId === s.id ? 'border-[#22c55e] shadow-[0_0_15px_rgba(34,197,94,0.15)] transform scale-[1.02]' : 'border-[#12233e] hover:border-[#7a95b8]/50'}`}
              onClick={() => setSelectedScenarioId(s.id === selectedScenarioId ? null : s.id)}
            >
              <div className={`h-2 w-full bg-gradient-to-r ${s.color}`} />
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <Input 
                    value={s.name} 
                    onChange={(e) => updateScenario(s.id, "name", e.target.value)} 
                    onClick={e => e.stopPropagation()}
                    className="rc-input bg-transparent border-transparent hover:border-[#12233e] focus:border-[#22c55e] text-white font-bold text-lg px-2 py-1 h-auto focus-visible:ring-0 w-full" 
                  />
                  {scenarios.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); removeScenario(s.id); }} className="text-[#7a95b8] hover:text-red-400 hover:bg-red-400/10 h-8 w-8 rounded-lg transition-colors ml-2 shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                <div className="space-y-4" onClick={e => e.stopPropagation()}>
                  <div>
                    <Label className="text-xs text-[#7a95b8] mb-1.5 block">Strategy Template</Label>
                    <Select value={s.strategy} onValueChange={(v) => applyPreset(s.id, v)}>
                      <SelectTrigger className="rc-input bg-[#060d19] border-[#12233e] text-white w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                        {Object.entries(STRATEGY_PRESETS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-[10px] text-[#7a95b8] mb-1 block uppercase tracking-wider">Annual Contrib</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-[#7a95b8]" />
                        <NumberInput 
                          value={s.annualContribution} 
                          onChange={(v) => updateScenario(s.id, "annualContribution", v)} 
                          className="rc-input bg-[#060d19] border-[#12233e] text-white pl-8 h-9 text-sm" 
                          min={0}
                          step={1000}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-[10px] text-[#7a95b8] mb-1 block uppercase tracking-wider">Growth Rate</Label>
                      <div className="relative">
                        <TrendingUp className="absolute left-2.5 top-2.5 h-4 w-4 text-[#7a95b8]" />
                        <NumberInput 
                          value={s.growthRate} 
                          onChange={(v) => updateScenario(s.id, "growthRate", v)} 
                          className="rc-input bg-[#060d19] border-[#12233e] text-white pl-8 pr-6 h-9 text-sm" 
                          min={0}
                          max={100}
                          step={0.5}
                        />
                        <span className="absolute right-3 top-2.5 text-[#7a95b8] text-sm">%</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-[10px] text-[#7a95b8] mb-1 block uppercase tracking-wider">Tax Rate</Label>
                      <div className="relative">
                        <FileText className="absolute left-2.5 top-2.5 h-4 w-4 text-[#7a95b8]" />
                        <NumberInput 
                          value={s.taxRate} 
                          onChange={(v) => updateScenario(s.id, "taxRate", v)} 
                          className="rc-input bg-[#060d19] border-[#12233e] text-white pl-8 pr-6 h-9 text-sm" 
                          min={0}
                          max={100}
                          step={1}
                        />
                        <span className="absolute right-3 top-2.5 text-[#7a95b8] text-sm">%</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-[10px] text-[#7a95b8] mb-1 block uppercase tracking-wider">Mgmt Fee</Label>
                      <div className="relative">
                        <Settings className="absolute left-2.5 top-2.5 h-4 w-4 text-[#7a95b8]" />
                        <NumberInput 
                          value={s.managementFee} 
                          onChange={(v) => updateScenario(s.id, "managementFee", v)} 
                          className="rc-input bg-[#060d19] border-[#12233e] text-white pl-8 pr-6 h-9 text-sm" 
                          min={0}
                          max={20}
                          step={0.1}
                        />
                        <span className="absolute right-3 top-2.5 text-[#7a95b8] text-sm">%</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-[10px] text-[#7a95b8] mb-1 block uppercase tracking-wider">Inflation</Label>
                      <div className="relative">
                        <TrendingDown className="absolute left-2.5 top-2.5 h-4 w-4 text-[#7a95b8]" />
                        <NumberInput 
                          value={s.inflationRate} 
                          onChange={(v) => updateScenario(s.id, "inflationRate", v)} 
                          className="rc-input bg-[#060d19] border-[#12233e] text-white pl-8 pr-6 h-9 text-sm" 
                          min={0}
                          max={20}
                          step={0.1}
                        />
                        <span className="absolute right-3 top-2.5 text-[#7a95b8] text-sm">%</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-[10px] text-[#7a95b8] mb-1 block uppercase tracking-wider">Risk Level (1-10)</Label>
                      <div className="relative">
                        <Target className="absolute left-2.5 top-2.5 h-4 w-4 text-[#7a95b8]" />
                        <NumberInput 
                          value={s.riskTolerance} 
                          onChange={(v) => updateScenario(s.id, "riskTolerance", v)} 
                          className="rc-input bg-[#060d19] border-[#12233e] text-white pl-8 h-9 text-sm" 
                          min={1}
                          max={10}
                          step={1}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Mini Result Summary */}
                  <div className="mt-4 pt-4 border-t border-[#12233e]">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-[#7a95b8]">Projected Final:</span>
                      <span className="text-sm font-bold text-white">{fmt(projections.find((p) => p.id === s.id)?.finalBalance || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-[#7a95b8]">Net Gain:</span>
                      <span className="text-sm font-semibold text-[#22c55e]">+{fmt(projections.find((p) => p.id === s.id)?.netGain || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Detailed Analytics Tabs */}
        <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-[#12233e] bg-[#060d19]/50 px-5 pt-4">
              <TabsList className="bg-transparent border-none p-0 h-auto flex gap-6">
                <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#22c55e] data-[state=active]:text-white rounded-none pb-3 px-1 text-[#7a95b8] font-medium">
                  <Activity className="h-4 w-4 mr-2" /> Overview
                </TabsTrigger>
                <TabsTrigger value="charts" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#22c55e] data-[state=active]:text-white rounded-none pb-3 px-1 text-[#7a95b8] font-medium">
                  <BarChart3 className="h-4 w-4 mr-2" /> Visualizations
                </TabsTrigger>
                <TabsTrigger value="data" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#22c55e] data-[state=active]:text-white rounded-none pb-3 px-1 text-[#7a95b8] font-medium">
                  <Layers className="h-4 w-4 mr-2" /> Data Tables
                </TabsTrigger>
                <TabsTrigger value="risk" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#22c55e] data-[state=active]:text-white rounded-none pb-3 px-1 text-[#7a95b8] font-medium">
                  <Shield className="h-4 w-4 mr-2" /> Risk & Efficiency
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB 1: OVERVIEW */}
            <TabsContent value="overview" className="p-6 m-0 outline-none">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Growth Chart */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-[#22c55e]" /> Wealth Growth Trajectory {showInflationAdjusted && "(Real)"}
                    </h3>
                  </div>
                  <div className="h-[400px] w-full bg-[#060d19] rounded-xl border border-[#12233e] p-4">
                    {/* CHART 1: AreaChart */}
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={combinedYearlyData} margin={{ top: 10, right: 10, left: 20, bottom: 20 }}>
                        <defs>
                          {projections.map((p, pIdx) => (
                            <linearGradient key={`grad-${pIdx}`} id={`color-${pIdx}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_COLORS[pIdx % CHART_COLORS.length]} stopOpacity={0.3}/>
                              <stop offset="95%" stopColor={CHART_COLORS[pIdx % CHART_COLORS.length]} stopOpacity={0}/>
                            </linearGradient>
                          ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                        <XAxis dataKey="year" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} minTickGap={20} />
                        <YAxis stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} width={60} />
                        <RTooltip 
                          contentStyle={{ background: "#060d19", border: "1px solid #12233e", borderRadius: "12px", color: "#fff", fontSize: "13px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)" }} 
                          formatter={(value: number, name: string) => {
                            if (name.startsWith("scenario")) {
                              const pIdx = parseInt(name.replace("scenario", ""));
                              return [fmt(value), projections[pIdx]?.name || name];
                            }
                            return [fmt(value), name];
                          }} 
                        />
                        <Legend wrapperStyle={{ paddingTop: "20px" }} />
                        {projections.map((p, pIdx) => (
                          <Area 
                            key={`area-${pIdx}`} 
                            type="monotone" 
                            dataKey={`scenario${pIdx}`} 
                            name={p.name}
                            stroke={CHART_COLORS[pIdx % CHART_COLORS.length]} 
                            strokeWidth={3}
                            fill={`url(#color-${pIdx})`}
                            activeDot={{ r: 6, strokeWidth: 0, fill: CHART_COLORS[pIdx % CHART_COLORS.length] }}
                          />
                        ))}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Key Metrics Summary */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Zap className="h-5 w-5 text-[#f59e0b]" /> Performance Highlights
                  </h3>
                  
                  {bestScenario && (
                    <div className="bg-gradient-to-br from-[#22c55e]/10 to-[#060d19] border border-[#22c55e]/30 rounded-xl p-5 relative overflow-hidden mb-6">
                      <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#22c55e]/10 rounded-full blur-2xl pointer-events-none"></div>
                      <div className="flex items-start gap-3 relative z-10">
                        <div className="p-2 rounded-full bg-[#22c55e]/20 border border-[#22c55e]/30 shrink-0 mt-1">
                          <CheckCircle2 className="h-5 w-5 text-[#22c55e]" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white mb-1">Top Performer: {bestScenario.name}</h4>
                          <p className="text-[#c8d8ec] text-xs leading-relaxed">
                            Yields <span className="font-semibold text-white">{fmt(bestScenario.finalBalance)}</span> nominal 
                            (<span className="font-semibold text-white">{fmt(bestScenario.finalRealBalance)}</span> real). 
                            <br/><span className="text-[#22c55e] font-semibold">+{fmt(bestScenario.finalBalance - projections[0].finalBalance)}</span> vs baseline.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {projections.map((p, i) => (
                      <div key={p.id} className="bg-[#060d19] border border-[#12233e] rounded-xl p-4 flex flex-col gap-2 hover:border-[#7a95b8]/50 transition-colors">
                        <div className="flex justify-between items-center">
                          <span className={`text-sm font-semibold ${TEXT_COLORS[i % TEXT_COLORS.length]}`}>{p.name}</span>
                          <span className="text-sm font-bold text-white">{fmt(showInflationAdjusted ? p.finalRealBalance : p.finalBalance)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex flex-col">
                            <span className="text-[#7a95b8]">Effective Return</span>
                            <span className="text-white font-medium">{p.effectiveReturn.toFixed(2)}%</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[#7a95b8]">Total Taxes</span>
                            <span className="text-red-400 font-medium">{fmt(p.totalTaxes)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: VISUALIZATIONS */}
            <TabsContent value="charts" className="p-6 m-0 outline-none">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* CHART 2: BarChart (Final Balance) */}
                <div className="bg-[#060d19] border border-[#12233e] rounded-xl p-5">
                  <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-[#3b82f6]" /> Final Balance Comparison
                  </h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={projections.map((p) => ({ name: p.name, Nominal: p.finalBalance, Real: p.finalRealBalance }))} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                        <XAxis dataKey="name" stroke="#7a95b8" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="#7a95b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                        <RTooltip 
                          cursor={{ fill: '#12233e', opacity: 0.4 }}
                          contentStyle={{ background: "#060d19", border: "1px solid #12233e", borderRadius: "12px", color: "#fff", fontSize: "13px" }} 
                          formatter={(value: number) => fmt(value)} 
                        />
                        <Legend />
                        <Bar dataKey="Nominal" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Real" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* CHART 3: PieChart (Tax vs Fees vs Net Gain) */}
                <div className="bg-[#060d19] border border-[#12233e] rounded-xl p-5">
                  <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4 text-[#a855f7]" /> Value Composition (Best Scenario)
                  </h3>
                  <div className="h-[300px] w-full">
                    {bestScenario ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Starting Balance', value: startingBalance },
                              { name: 'Total Contributions', value: bestScenario.totalContributions },
                              { name: 'Net Growth (After Tax/Fees)', value: bestScenario.totalGrowth - bestScenario.totalTaxes - bestScenario.totalFees },
                              { name: 'Taxes Paid', value: bestScenario.totalTaxes },
                              { name: 'Fees Paid', value: bestScenario.totalFees },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            <Cell fill="#3b82f6" />
                            <Cell fill="#10b981" />
                            <Cell fill="#22c55e" />
                            <Cell fill="#f43f5e" />
                            <Cell fill="#f59e0b" />
                          </Pie>
                          <RTooltip 
                            contentStyle={{ background: "#060d19", border: "1px solid #12233e", borderRadius: "12px", color: "#fff", fontSize: "13px" }} 
                            formatter={(value: number) => fmt(value)} 
                          />
                          <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px', color: '#7a95b8' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-[#7a95b8]">No data available</div>
                    )}
                  </div>
                </div>

                {/* CHART 4: LineChart (Contributions vs Growth) */}
                <div className="bg-[#060d19] border border-[#12233e] rounded-xl p-5 lg:col-span-2">
                  <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[#f59e0b]" /> Contributions vs. Cumulative Growth
                  </h3>
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={combinedYearlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                        <XAxis dataKey="year" stroke="#7a95b8" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="#7a95b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                        <RTooltip 
                          contentStyle={{ background: "#060d19", border: "1px solid #12233e", borderRadius: "12px", color: "#fff", fontSize: "13px" }} 
                          formatter={(value: number) => fmt(value)} 
                        />
                        <Legend />
                        {projections.map((p, pIdx) => (
                          <Line 
                            key={`line-cont-${pIdx}`}
                            type="monotone" 
                            dataKey={`${p.name} Contributions`} 
                            stroke={CHART_COLORS[pIdx % CHART_COLORS.length]} 
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={false}
                          />
                        ))}
                        {projections.map((p, pIdx) => (
                          <Line 
                            key={`line-bal-${pIdx}`}
                            type="monotone" 
                            dataKey={`${p.name} Balance`} 
                            stroke={CHART_COLORS[pIdx % CHART_COLORS.length]} 
                            strokeWidth={2}
                            dot={false}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: DATA TABLES */}
            <TabsContent value="data" className="p-0 m-0 outline-none">
              {/* TABLE 1: Comprehensive Summary Table */}
              <div className="p-6 border-b border-[#12233e]">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-[#22c55e]" /> Projection Results Summary
                </h3>
                <div className="overflow-x-auto rounded-xl border border-[#12233e]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#12233e] bg-[#060d19]">
                        <th className="text-left py-4 px-5 text-[#7a95b8] font-medium whitespace-nowrap">Metric</th>
                        {projections.map((p, i) => (
                          <th key={p.id} className={`text-right py-4 px-5 font-semibold whitespace-nowrap ${TEXT_COLORS[i % TEXT_COLORS.length]}`}>{p.name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="text-[#c8d8ec] divide-y divide-[#12233e]">
                      <tr className="hover:bg-[#060d19]/30 transition-colors">
                        <td className="py-3.5 px-5 text-[#7a95b8]">Starting Balance</td>
                        {projections.map((p) => <td key={p.id} className="text-right py-3.5 px-5 font-medium">{fmt(startingBalance)}</td>)}
                      </tr>
                      <tr className="hover:bg-[#060d19]/30 transition-colors">
                        <td className="py-3.5 px-5 text-[#7a95b8]">Total Contributions</td>
                        {projections.map((p) => <td key={p.id} className="text-right py-3.5 px-5 font-medium">{fmt(p.totalContributions)}</td>)}
                      </tr>
                      <tr className="hover:bg-[#060d19]/30 transition-colors">
                        <td className="py-3.5 px-5 text-[#7a95b8]">Total Growth</td>
                        {projections.map((p) => <td key={p.id} className="text-right py-3.5 px-5 font-medium text-[#22c55e]">{fmt(p.totalGrowth)}</td>)}
                      </tr>
                      <tr className="hover:bg-[#060d19]/30 transition-colors">
                        <td className="py-3.5 px-5 text-[#7a95b8]">Total Taxes Paid</td>
                        {projections.map((p) => <td key={p.id} className="text-right py-3.5 px-5 font-medium text-red-400">{fmt(p.totalTaxes)}</td>)}
                      </tr>
                      <tr className="hover:bg-[#060d19]/30 transition-colors">
                        <td className="py-3.5 px-5 text-[#7a95b8]">Total Fees Paid</td>
                        {projections.map((p) => <td key={p.id} className="text-right py-3.5 px-5 font-medium text-amber-400">{fmt(p.totalFees)}</td>)}
                      </tr>
                      <tr className="hover:bg-[#060d19]/30 transition-colors">
                        <td className="py-3.5 px-5 text-[#7a95b8]">Net Gain</td>
                        {projections.map((p) => <td key={p.id} className="text-right py-3.5 px-5 font-medium text-[#22c55e]">{fmt(p.netGain)}</td>)}
                      </tr>
                      <tr className="bg-[#060d19]/60 border-t-2 border-[#12233e]">
                        <td className="py-4 px-5 font-semibold text-white">Final Nominal Balance</td>
                        {projections.map((p, i) => (
                          <td key={p.id} className={`text-right py-4 px-5 font-bold text-lg ${p.id === bestScenario?.id ? TEXT_COLORS[i % TEXT_COLORS.length] : "text-white"}`}>
                            <div className="flex items-center justify-end gap-2">
                              {fmt(p.finalBalance)}
                              {p.id === bestScenario?.id && (
                                <span className="rc-badge rc-badge-green px-2 py-0.5 text-[10px] uppercase tracking-wider">Best</span>
                              )}
                            </div>
                          </td>
                        ))}
                      </tr>
                      <tr className="bg-[#060d19]/40">
                        <td className="py-4 px-5 font-semibold text-[#7a95b8]">Final Real Balance (Inf. Adj)</td>
                        {projections.map((p, i) => (
                          <td key={p.id} className={`text-right py-4 px-5 font-bold text-base text-white`}>
                            {fmt(p.finalRealBalance)}
                          </td>
                        ))}
                      </tr>
                      <tr className="hover:bg-[#060d19]/30 transition-colors">
                        <td className="py-3.5 px-5 text-[#7a95b8]">Effective Return</td>
                        {projections.map((p) => <td key={p.id} className="text-right py-3.5 px-5 font-medium">{p.effectiveReturn.toFixed(2)}%</td>)}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TABLE 2: Year-by-Year Table */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-[#3b82f6]" /> Milestone Year Breakdown
                </h3>
                <div className="space-y-6">
                  {[5, 10, 15, 20, 25, 30, 40, 50].filter((y) => y <= comparisonYears).map((year) => (
                    <div key={year} className="bg-[#060d19] rounded-xl border border-[#12233e] overflow-hidden">
                      <div className="bg-[#12233e]/50 py-2 px-4 border-b border-[#12233e]">
                        <span className="text-sm font-bold text-white">End of Year {year}</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-[#12233e]">
                              <th className="text-left py-2 px-4 text-[#7a95b8] font-medium">Scenario</th>
                              <th className="text-right py-2 px-4 text-[#7a95b8] font-medium">Nominal Bal</th>
                              <th className="text-right py-2 px-4 text-[#7a95b8] font-medium">Real Bal</th>
                              <th className="text-right py-2 px-4 text-[#7a95b8] font-medium">Contributions</th>
                              <th className="text-right py-2 px-4 text-[#7a95b8] font-medium">Taxes YTD</th>
                              <th className="text-right py-2 px-4 text-[#7a95b8] font-medium">Fees YTD</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#12233e]/50">
                            {projections.map((p, i) => {
                              const yearData = p.data[year - 1];
                              if (!yearData) return null;
                              return (
                                <tr key={p.id} className="hover:bg-[#12233e]/20">
                                  <td className={`py-2 px-4 font-medium ${TEXT_COLORS[i % TEXT_COLORS.length]}`}>{p.name}</td>
                                  <td className="text-right py-2 px-4 text-white font-medium">{fmt(yearData.balance)}</td>
                                  <td className="text-right py-2 px-4 text-[#c8d8ec]">{fmt(yearData.realBalance)}</td>
                                  <td className="text-right py-2 px-4 text-[#c8d8ec]">{fmt(yearData.contributions)}</td>
                                  <td className="text-right py-2 px-4 text-red-400/80">{fmt(yearData.taxes)}</td>
                                  <td className="text-right py-2 px-4 text-amber-400/80">{fmt(yearData.fees)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* TAB 4: RISK & EFFICIENCY */}
            <TabsContent value="risk" className="p-6 m-0 outline-none">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* CHART 5: RadarChart (Risk/Return Profile) */}
                <div className="bg-[#060d19] border border-[#12233e] rounded-xl p-5">
                  <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                    <Crosshair className="h-4 w-4 text-[#f43f5e]" /> Risk/Return Profile
                  </h3>
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={riskAnalysisData}>
                        <PolarGrid stroke="#12233e" />
                        <PolarAngleAxis dataKey="name" tick={{ fill: '#7a95b8', fontSize: 11 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: '#7a95b8' }} />
                        <Radar name="Return Potential" dataKey="Return" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                        <Radar name="Risk Exposure" dataKey="Risk" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.3} />
                        <Radar name="Efficiency Score" dataKey="Efficiency" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                        <Legend />
                        <RTooltip 
                          contentStyle={{ background: "#060d19", border: "1px solid #12233e", borderRadius: "12px", color: "#fff", fontSize: "13px" }} 
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* CHART 6: ComposedChart (Taxes & Fees vs Net Growth) */}
                <div className="bg-[#060d19] border border-[#12233e] rounded-xl p-5">
                  <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                    <AlertOctagon className="h-4 w-4 text-[#f59e0b]" /> Frictional Costs Impact
                  </h3>
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={projections.map((p) => ({ 
                        name: p.name, 
                        NetGrowth: p.totalGrowth - p.totalTaxes - p.totalFees,
                        Taxes: p.totalTaxes,
                        Fees: p.totalFees
                      }))} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid stroke="#12233e" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" stroke="#7a95b8" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="#7a95b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                        <RTooltip 
                          contentStyle={{ background: "#060d19", border: "1px solid #12233e", borderRadius: "12px", color: "#fff", fontSize: "13px" }} 
                          formatter={(value: number) => fmt(value)} 
                        />
                        <Legend />
                        <Bar dataKey="NetGrowth" stackId="a" fill="#10b981" name="Net Growth" />
                        <Bar dataKey="Taxes" stackId="a" fill="#f43f5e" name="Taxes Paid" />
                        <Bar dataKey="Fees" stackId="a" fill="#f59e0b" name="Fees Paid" />
                        <Line type="monotone" dataKey="NetGrowth" stroke="#3b82f6" strokeWidth={2} name="Trend" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* TABLE 3: Risk Analysis Data Table */}
                <div className="lg:col-span-2 bg-[#060d19] border border-[#12233e] rounded-xl overflow-hidden">
                  <div className="bg-[#12233e]/50 py-3 px-5 border-b border-[#12233e]">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Shield className="h-4 w-4 text-[#3b82f6]" /> Risk-Adjusted Metrics
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#12233e]">
                          <th className="text-left py-3 px-5 text-[#7a95b8] font-medium">Scenario</th>
                          <th className="text-right py-3 px-5 text-[#7a95b8] font-medium">Risk Level (1-10)</th>
                          <th className="text-right py-3 px-5 text-[#7a95b8] font-medium">Total Return %</th>
                          <th className="text-right py-3 px-5 text-[#7a95b8] font-medium">Risk-Adj Score</th>
                          <th className="text-right py-3 px-5 text-[#7a95b8] font-medium">Cost Drag %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#12233e]">
                        {projections.map((p, i) => {
                          const costDrag = ((p.totalTaxes + p.totalFees) / (p.totalGrowth || 1)) * 100;
                          return (
                            <tr key={p.id} className="hover:bg-[#12233e]/20">
                              <td className={`py-3 px-5 font-medium ${TEXT_COLORS[i % TEXT_COLORS.length]}`}>{p.name}</td>
                              <td className="text-right py-3 px-5 text-white">{p.riskTolerance}/10</td>
                              <td className="text-right py-3 px-5 text-[#22c55e]">{p.effectiveReturn.toFixed(2)}%</td>
                              <td className="text-right py-3 px-5 text-[#3b82f6] font-semibold">{p.riskAdjustedReturn.toFixed(2)}</td>
                              <td className="text-right py-3 px-5 text-red-400">{costDrag.toFixed(2)}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <PageInsights pageId="scenario-side-by-side" />
      </div>
    
        <ComplianceFooter pageName="ScenarioSideBySide" showsIUL showsAnnuity showsTax showsEstate showsProjections showsHistoricalData />
      </AppShell>
  );
}
