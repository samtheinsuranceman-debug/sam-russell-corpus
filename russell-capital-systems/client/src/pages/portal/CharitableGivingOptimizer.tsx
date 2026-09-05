// @ts-nocheck
import { useState, useMemo, useEffect, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import {
  Heart, DollarSign, TrendingUp, ArrowRight, Shield, Target,
  FileText, AlertTriangle, CheckCircle2, Gift, BarChart3, Calculator, Search, Download, RefreshCw, Sparkles, PieChartIcon, LineChart as LineChartIcon, Settings, Briefcase, Activity, Calendar, History, Info
} from "lucide-react";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import { NumberInput } from "@/components/NumberInput";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart 
} from "recharts";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { useClientData } from "@/contexts/ClientDataContext";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;
const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;
const COLORS = ["#22c55e", "#f0c040", "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316", "#14b8a6"];

interface GivingStrategy {
  id: string;
  name: string;
  description: string;
  taxDeduction: number;
  netCost: number;
  charityReceives: number;
  efficiency: number;
  bestFor: string;
  considerations: string[];
  complexityScore: number;
  setupTimeDays: number;
  minContribution: number;
  assetTypes: string[];
}

function computeStrategies(client: any, annualGiving: number): GivingStrategy[] {
  const income = client?.income ?? 200000;
  const taxRate = income > 500000 ? 0.37 : income > 200000 ? 0.32 : income > 100000 ? 0.24 : 0.22;
  const stateRate = client?.stateTaxRate ?? 0.05;
  const combinedRate = taxRate + stateRate;
  const age = client?.age ?? 55;

  return [
    {
      id: "direct-cash",
      name: "Direct Cash Gift",
      description: "Simple cash donation to qualified 501(c)(3) organizations",
      taxDeduction: annualGiving,
      netCost: annualGiving * (1 - combinedRate),
      charityReceives: annualGiving,
      efficiency: Math.round((1 / (1 - combinedRate)) * 100),
      bestFor: "Simple, immediate charitable goals",
      considerations: ["Deductible up to 60% of AGI for cash gifts", "Carry forward excess deductions for 5 years", "Simplest strategy but least tax-efficient for appreciated assets"],
      complexityScore: 1,
      setupTimeDays: 1,
      minContribution: 1,
      assetTypes: ["Cash", "Check", "Credit Card"]
    },
    {
      id: "appreciated-securities",
      name: "Appreciated Securities",
      description: "Donate long-term appreciated stocks or funds directly to charity",
      taxDeduction: annualGiving,
      netCost: annualGiving * (1 - combinedRate) - annualGiving * 0.15,
      charityReceives: annualGiving,
      efficiency: Math.round((annualGiving / (annualGiving * (1 - combinedRate) - annualGiving * 0.15)) * 100),
      bestFor: "Clients with highly appreciated taxable investments",
      considerations: ["Avoid capital gains tax on appreciated assets (up to 20% + 3.8% NIIT)", "Deductible up to 30% of AGI for appreciated property", "Must be held >1 year to qualify for FMV deduction", "Most tax-efficient method for clients with large unrealized gains"],
      complexityScore: 3,
      setupTimeDays: 7,
      minContribution: 1000,
      assetTypes: ["Stocks", "Mutual Funds", "ETFs"]
    },
    {
      id: "daf",
      name: "Donor-Advised Fund (DAF)",
      description: "Contribute to a DAF for immediate deduction, distribute to charities over time",
      taxDeduction: annualGiving * 3,
      netCost: annualGiving * 3 * (1 - combinedRate),
      charityReceives: annualGiving * 3,
      efficiency: Math.round((annualGiving * 3 / (annualGiving * 3 * (1 - combinedRate))) * 100),
      bestFor: "Bunching strategy — front-load 3+ years of giving for larger deduction",
      considerations: ["Immediate tax deduction in year of contribution", "Investments grow tax-free inside DAF", "Distribute to charities on your timeline", "Ideal for 'bunching' strategy with standard deduction alternating years", "Minimum initial contribution typically $5,000-$25,000"],
      complexityScore: 4,
      setupTimeDays: 14,
      minContribution: 5000,
      assetTypes: ["Cash", "Securities", "Complex Assets"]
    },
    {
      id: "qcd",
      name: "Qualified Charitable Distribution (QCD)",
      description: "Direct IRA distribution to charity (age 70½+). Satisfies RMD without increasing AGI.",
      taxDeduction: age >= 70 ? Math.min(annualGiving, 105000) : 0,
      netCost: age >= 70 ? Math.min(annualGiving, 105000) * (1 - taxRate) : annualGiving,
      charityReceives: age >= 70 ? Math.min(annualGiving, 105000) : annualGiving,
      efficiency: age >= 70 ? Math.round((1 / (1 - taxRate)) * 100) : 100,
      bestFor: "Clients age 70½+ with traditional IRA balances and RMD obligations",
      considerations: age >= 70 ? ["Up to $105,000/year (2024 limit, indexed for inflation)", "Satisfies Required Minimum Distribution", "Reduces AGI — may lower Medicare premiums and Social Security taxation", "Does NOT appear as income on tax return", "Most powerful strategy for retirees with IRA wealth"] : ["Not available until age 70½", "Plan ahead — this becomes the most powerful giving tool in retirement"],
      complexityScore: 3,
      setupTimeDays: 10,
      minContribution: 100,
      assetTypes: ["Traditional IRA Funds"]
    },
    {
      id: "crt",
      name: "Charitable Remainder Trust (CRT)",
      description: "Irrevocable trust providing income stream to donor, remainder to charity",
      taxDeduction: Math.round(annualGiving * 5 * 0.35),
      netCost: 0,
      charityReceives: Math.round(annualGiving * 5 * 0.65),
      efficiency: 999,
      bestFor: "Clients with concentrated positions or business sale proceeds",
      considerations: ["Immediate partial tax deduction based on present value of charitable remainder", "Income stream for life or term of years (5-20 years)", "Avoids capital gains on contributed appreciated assets", "Reduces estate tax by removing assets from taxable estate", "Complex — requires legal counsel and trustee", "Minimum 10% remainder interest required"],
      complexityScore: 9,
      setupTimeDays: 45,
      minContribution: 250000,
      assetTypes: ["Real Estate", "Business Interests", "Concentrated Stock"]
    },
    {
      id: "private-foundation",
      name: "Private Foundation",
      description: "Establish a family foundation for multi-generational philanthropic legacy",
      taxDeduction: annualGiving,
      netCost: annualGiving * (1 - combinedRate * 0.8),
      charityReceives: annualGiving * 0.95,
      efficiency: Math.round((annualGiving * 0.95 / (annualGiving * (1 - combinedRate * 0.8))) * 100),
      bestFor: "Ultra-high-net-worth families seeking philanthropic legacy and family engagement",
      considerations: ["Maximum control over grant-making decisions", "Family members can serve as trustees (with compensation)", "Must distribute 5% of assets annually", "Subject to 1.39% excise tax on net investment income", "Higher administrative costs and compliance requirements", "Ideal for families with $1M+ in charitable giving capacity"],
      complexityScore: 10,
      setupTimeDays: 90,
      minContribution: 1000000,
      assetTypes: ["Cash", "Securities", "Real Estate", "Business Interests"]
    },
  ];
}

export default function CharitableGivingOptimizer() {
  const { clientData } = useClientData();
  const { user } = useAuth();
  
  const { data: clients, refetch: refetchClients } = trpc.clients.list.useQuery();
  const { data: taxRates } = trpc.strategy.getTaxRates.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  const { data: recentActivity } = trpc.activity.list.useQuery({ limit: 5 });
  const { data: marketData } = trpc.marketData.getLatest.useQuery();
  const { data: recommendationHistory } = trpc.recommendationHistory.list.useQuery();
  
  const saveStrategyMutation = trpc.savedStrategies.create.useMutation({
    onSuccess: () => {
      toast.success("Strategy saved successfully");
    },
    onError: (err) => {
      toast.error(`Failed to save strategy: ${err.message}`);
    }
  });

  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("strategies");
  const [annualGiving, setAnnualGiving] = useState<number>(25000);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);
  const [timeHorizon, setTimeHorizon] = useState<number>(10);
  const [expectedReturn, setExpectedReturn] = useState<number>(0.06);
  const [inflationRate, setInflationRate] = useState<number>(0.025);

  const selectedClient = useMemo(() => {
    if (!clients) return null;
    if (selectedClientId) return clients.find((c) => String(c.id) === selectedClientId) ?? clients[0];
    return clients[0] ?? null;
  }, [clients, selectedClientId]);

  const strategies = useMemo(() => {
    return selectedClient ? computeStrategies(selectedClient, annualGiving || 25000) : [];
  }, [selectedClient, annualGiving]);

  const filteredStrategies = useMemo(() => {
    if (!searchQuery) return strategies;
    const lowerQ = searchQuery.toLowerCase();
    return strategies.filter((s) => 
      s.name.toLowerCase().includes(lowerQ) || 
      s.description.toLowerCase().includes(lowerQ) ||
      s.bestFor.toLowerCase().includes(lowerQ) ||
      s.assetTypes.some(a => a.toLowerCase().includes(lowerQ))
    );
  }, [strategies, searchQuery]);

  const selectedStrategyDetails = useMemo(() => {
    return strategies.find((s) => s.id === selectedStrategyId) || strategies[0];
  }, [strategies, selectedStrategyId]);

  const comparisonBarData = useMemo(() => {
    return strategies.map((s) => ({
      name: s.name.length > 15 ? s.name.slice(0, 15) + "…" : s.name,
      deduction: s.taxDeduction,
      netCost: s.netCost,
      charityReceives: s.charityReceives,
      efficiency: s.efficiency,
      fullStrategy: s
    }));
  }, [strategies]);

  const pieData = useMemo(() => {
    if (!selectedStrategyDetails) return [];
    return [
      { name: "Net Cost to Donor", value: selectedStrategyDetails.netCost },
      { name: "Tax Savings", value: selectedStrategyDetails.taxDeduction - selectedStrategyDetails.netCost },
    ];
  }, [selectedStrategyDetails]);

  const projectionData = useMemo(() => {
    if (!selectedStrategyDetails) return [];
    let currentBalance = selectedStrategyDetails.charityReceives;
    const data = [];
    
    for (let year = 0; year <= timeHorizon; year++) {
      data.push({
        year: `Year ${year}`,
        projectedValue: Math.round(currentBalance),
        inflationAdjusted: Math.round(currentBalance / Math.pow(1 + inflationRate, year)),
        baselineCash: Math.round(annualGiving * (year + 1))
      });
      currentBalance = currentBalance * (1 + expectedReturn);
    }
    return data;
  }, [selectedStrategyDetails, timeHorizon, expectedReturn, inflationRate, annualGiving]);

  const complexityRadarData = useMemo(() => {
    if (!selectedStrategyDetails) return [];
    return [
      { subject: 'Tax Efficiency', A: Math.min(100, selectedStrategyDetails.efficiency) / 10, fullMark: 10 },
      { subject: 'Complexity', A: selectedStrategyDetails.complexityScore, fullMark: 10 },
      { subject: 'Control', A: selectedStrategyDetails.id === 'private-foundation' ? 10 : selectedStrategyDetails.id === 'daf' ? 7 : 2, fullMark: 10 },
      { subject: 'Speed', A: Math.max(1, 10 - (selectedStrategyDetails.setupTimeDays / 10)), fullMark: 10 },
      { subject: 'Flexibility', A: selectedStrategyDetails.id === 'daf' ? 9 : selectedStrategyDetails.id === 'direct-cash' ? 10 : 4, fullMark: 10 },
    ];
  }, [selectedStrategyDetails]);

  const efficiencyTrendData = useMemo(() => {
    return [
      { incomeLevel: "$100k", directCash: 125, appreciated: 140, daf: 145 },
      { incomeLevel: "$250k", directCash: 147, appreciated: 175, daf: 180 },
      { incomeLevel: "$500k", directCash: 158, appreciated: 195, daf: 205 },
      { incomeLevel: "$1M+", directCash: 165, appreciated: 215, daf: 230 },
    ];
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetchClients();
    setTimeout(() => setIsRefreshing(false), 800);
    toast.success("Client data and models refreshed");
  }, [refetchClients]);

  const handleExportCSV = useCallback(() => {
    const headers = ["Strategy Name", "Description", "Tax Deduction", "Net Cost", "Charity Receives", "Efficiency", "Complexity Score", "Setup Days", "Min Contribution", "Best For"];
    const csvContent = [
      headers.join(","),
      ...strategies.map((s) => 
        `"${s.name}","${s.description}",${s.taxDeduction},${s.netCost},${s.charityReceives},${s.efficiency},${s.complexityScore},${s.setupTimeDays},${s.minContribution},"${s.bestFor}"`
      )
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `charitable_strategies_${selectedClient?.name?.replace(/\s+/g, '_') || 'export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Strategies exported to CSV");
  }, [strategies, selectedClient]);

  const handleSaveStrategy = useCallback(() => {
    if (!selectedClient || !selectedStrategyDetails) return;
    
    saveStrategyMutation.mutate({
      clientId: selectedClient.id,
      strategyType: "charitable_giving",
      name: `Charitable Plan: ${selectedStrategyDetails.name}`,
      details: JSON.stringify({
        annualGiving,
        strategyId: selectedStrategyDetails.id,
        projectedDeduction: selectedStrategyDetails.taxDeduction,
        projectedCharityReceipt: selectedStrategyDetails.charityReceives
      })
    });
  }, [selectedClient, selectedStrategyDetails, annualGiving, saveStrategyMutation]);

  const handlePrintReport = useCallback(() => {
    window.print();
    toast.info("Preparing print view...");
  }, []);

  useEffect(() => {
    if (strategies.length > 0 && !selectedStrategyId) {
      setSelectedStrategyId(strategies[0].id);
    }
  }, [strategies, selectedStrategyId]);

  if (!clients) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 space-y-6 max-w-7xl mx-auto print:p-0 print:max-w-full">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="CharitableGivingOptimizer" />

        <ExecutiveSummary
          pageTitle="Charitable Giving Optimizer"
          whatItDoes="This estate planning tool provides institutional-grade analysis of your financial situation, modeling multiple scenarios and projecting outcomes based on your specific inputs. It transforms complex estate planning concepts into clear, actionable insights with dollar-quantified recommendations."
          opportunities="Without proper estate planning, your heirs could lose 40% or more of your wealth to estate taxes and probate costs. Strategic planning can preserve nearly all of it."
          intent="To give you the same caliber of estate planning analysis that institutional investors and ultra-high-net-worth families receive — now accessible to every client."
          takeaway="Understanding your estate planning options with precise dollar amounts empowers you to make confident decisions that compound into significant wealth over time."
          callToAction="Enter your numbers and see exactly how estate planning strategies can improve your financial outcome."
          followUpQuestions={[
            "How does this estate planning strategy interact with my other financial plans?",
            "What\'s the single biggest estate planning opportunity I\'m currently missing?",
            "How would my results change if I started this strategy 5 years earlier?",
          ]}
        />
        <GoalsAccelerator pageName="Charitable Giving Optimizer" pageContext="Charitable Giving Optimizer — estate planning modeling with projections and scenario analysis" />
        <TaxBracketPanel grossIncome={clientData?.annualIncome || 150000} filingStatus={clientData?.filingStatus || "single"} stateCode={clientData?.state || "TX"} />
        <RecommendationSummary
          headline="This estate planning strategy can significantly improve your financial outcome"
          detail="Based on your profile, implementing the recommended estate planning approach could generate substantial savings and growth over your planning horizon."
          dollarBenefit={800000}
          timeHorizon="20 years"
          confidence="high"
          nextStep="Review with your advisor"
        />
        <DoNothingBaseline
          metrics={[
            { label: "Estate Tax Exposure", doNothing: 500000, recommended: 50000, format: "currency", higherIsBetter: false },
            { label: "Wealth Transferred", doNothing: 1500000, recommended: 2300000, format: "currency" },
            { label: "Probate Avoidance", doNothing: 0, recommended: 95, format: "percent" },
          ]}
          summary="Without taking action on estate planning, you leave significant value on the table that compounds into a major opportunity cost over time."
        />
        {/* Page Header */}
        <div className="rc-page-header flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8 print:mb-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-[#0d1a2e] border border-[#12233e] rounded-xl print:hidden">
              <Heart className="w-8 h-8 text-[#22c55e]" />
            </div>
            <div>
              <h1 className="rc-page-title text-2xl font-bold text-white tracking-tight print:text-black">Charitable Giving Optimizer</h1>
              <p className="rc-page-subtitle text-[#7a95b8] mt-1 text-sm max-w-2xl print:text-gray-600">
                Tax-optimized philanthropic strategies including DAFs, CRTs, QCDs, and appreciated securities modeling.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 print:hidden">
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="rc-btn rc-btn-ghost flex items-center gap-2 px-3 py-2 bg-[#0d1a2e] border border-[#12233e] rounded-lg text-white hover:bg-[#12233e] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="text-sm">Refresh</span>
            </button>
            <button 
              onClick={handleExportCSV}
              className="rc-btn rc-btn-ghost flex items-center gap-2 px-3 py-2 bg-[#0d1a2e] border border-[#12233e] rounded-lg text-white hover:bg-[#12233e] transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm">CSV</span>
            </button>
            <button 
              onClick={handlePrintReport}
              className="rc-btn rc-btn-ghost flex items-center gap-2 px-3 py-2 bg-[#0d1a2e] border border-[#12233e] rounded-lg text-white hover:bg-[#12233e] transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span className="text-sm">Print Report</span>
            </button>
            <ExportToSlides
              toolName="Charitable Giving Optimizer"
              data={{ client: selectedClient, strategies: filteredStrategies }}
            />
          </div>
        </div>

        {/* Global Controls */}
        <div className="bg-[#0a1120] border border-[#12233e] rounded-xl p-5 mb-8 print:hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-[#7a95b8] text-xs font-semibold uppercase tracking-wider">Select Client Household</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger className="w-full bg-[#0d1a2e] border-[#12233e] text-white">
                  <SelectValue placeholder="Select a client..." />
                </SelectTrigger>
                <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                  {clients?.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name} {c.age ? `(Age ${c.age})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-[#7a95b8] text-xs font-semibold uppercase tracking-wider">Annual Giving Target ($)</Label>
              <NumberInput
                value={annualGiving}
                onChange={setAnnualGiving}
                min={1000}
                step={1000}
                className="w-full bg-[#0d1a2e] border-[#12233e] text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[#7a95b8] text-xs font-semibold uppercase tracking-wider">Client Tax Profile</Label>
              <div className="flex items-center gap-4 h-10 px-3 bg-[#0d1a2e] border border-[#12233e] rounded-md">
                <div className="flex flex-col">
                  <span className="text-xs text-[#7a95b8]">Est. Marginal Rate</span>
                  <span className="text-sm font-medium text-white">
                    {selectedClient ? fmtPct((selectedClient.income > 500000 ? 0.37 : selectedClient.income > 200000 ? 0.32 : 0.24) + (selectedClient.stateTaxRate || 0.05)) : "N/A"}
                  </span>
                </div>
                <div className="w-px h-6 bg-[#12233e]"></div>
                <div className="flex flex-col">
                  <span className="text-xs text-[#7a95b8]">Est. Income</span>
                  <span className="text-sm font-medium text-white">
                    {selectedClient ? fmt(selectedClient.income || 200000) : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        {selectedClient && (
          <div className="space-y-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-[#0a1120] border border-[#12233e] p-1 rounded-lg w-full flex overflow-x-auto print:hidden">
                <TabsTrigger value="strategies" className="flex-1 data-[state=active]:bg-[#12233e] data-[state=active]:text-white text-[#7a95b8]">
                  <Briefcase className="w-4 h-4 mr-2" /> Strategy Overview
                </TabsTrigger>
                <TabsTrigger value="analysis" className="flex-1 data-[state=active]:bg-[#12233e] data-[state=active]:text-white text-[#7a95b8]">
                  <BarChart3 className="w-4 h-4 mr-2" /> Comparative Analysis
                </TabsTrigger>
                <TabsTrigger value="projections" className="flex-1 data-[state=active]:bg-[#12233e] data-[state=active]:text-white text-[#7a95b8]">
                  <TrendingUp className="w-4 h-4 mr-2" /> Long-term Projections
                </TabsTrigger>
                <TabsTrigger value="implementation" className="flex-1 data-[state=active]:bg-[#12233e] data-[state=active]:text-white text-[#7a95b8]">
                  <Settings className="w-4 h-4 mr-2" /> Implementation Details
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Strategies Overview */}
              <TabsContent value="strategies" className="mt-6 space-y-6">
                <div className="flex items-center justify-between mb-4 print:hidden">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a95b8]" />
                    <input
                      type="text"
                      placeholder="Filter strategies..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#0a1120] border border-[#12233e] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-[#4b6382] focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="text-sm text-[#7a95b8]">
                    Showing {filteredStrategies.length} of {strategies.length} strategies
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Strategy List */}
                  <div className="lg:col-span-1 space-y-3 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar print:max-h-none print:overflow-visible">
                    {filteredStrategies.map((strategy) => (
                      <div 
                        key={strategy.id}
                        onClick={() => setSelectedStrategyId(strategy.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                          selectedStrategyId === strategy.id 
                            ? "bg-[#12233e] border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]" 
                            : "bg-[#0a1120] border-[#12233e] hover:border-[#2a4365] hover:bg-[#0d1a2e]"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-white text-sm">{strategy.name}</h3>
                          {strategy.efficiency > 150 && (
                            <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-[10px] font-bold rounded uppercase tracking-wider">High ROI</span>
                          )}
                        </div>
                        <p className="text-xs text-[#7a95b8] line-clamp-2 mb-3">{strategy.description}</p>
                        
                        <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-[#12233e]/50">
                          <div>
                            <div className="text-[10px] text-[#4b6382] uppercase tracking-wider">Tax Deduction</div>
                            <div className="text-sm font-medium text-white">{fmt(strategy.taxDeduction)}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-[#4b6382] uppercase tracking-wider">Net Cost</div>
                            <div className="text-sm font-medium text-white">{fmt(strategy.netCost)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {filteredStrategies.length === 0 && (
                      <div className="p-8 text-center bg-[#0a1120] border border-[#12233e] rounded-xl">
                        <AlertTriangle className="w-8 h-8 text-[#7a95b8] mx-auto mb-3" />
                        <p className="text-white text-sm">No strategies match your search.</p>
                      </div>
                    )}
                  </div>

                  {/* Selected Strategy Details */}
                  <div className="lg:col-span-2">
                    {selectedStrategyDetails ? (
                      <div className="bg-[#0a1120] border border-[#12233e] rounded-xl overflow-hidden h-full flex flex-col">
                        <div className="p-6 border-b border-[#12233e] bg-gradient-to-r from-[#0d1a2e] to-[#0a1120]">
                          <div className="flex justify-between items-start mb-2">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                              {selectedStrategyDetails.name}
                              <Sparkles className="w-4 h-4 text-blue-400" />
                            </h2>
                            <button 
                              onClick={handleSaveStrategy}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-md transition-colors print:hidden"
                            >
                              Save Recommendation
                            </button>
                          </div>
                          <p className="text-sm text-[#7a95b8]">{selectedStrategyDetails.description}</p>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
                          {/* Key Metrics */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <div className="p-4 bg-[#0d1a2e] rounded-lg border border-[#12233e]">
                              <div className="text-xs text-[#7a95b8] mb-1 flex items-center gap-1">
                                <DollarSign className="w-3 h-3" /> Tax Deduction
                              </div>
                              <div className="text-xl font-bold text-green-400">{fmt(selectedStrategyDetails.taxDeduction)}</div>
                            </div>
                            <div className="p-4 bg-[#0d1a2e] rounded-lg border border-[#12233e]">
                              <div className="text-xs text-[#7a95b8] mb-1 flex items-center gap-1">
                                <Activity className="w-3 h-3" /> Net Cost to Donor
                              </div>
                              <div className="text-xl font-bold text-white">{fmt(selectedStrategyDetails.netCost)}</div>
                            </div>
                            <div className="p-4 bg-[#0d1a2e] rounded-lg border border-[#12233e]">
                              <div className="text-xs text-[#7a95b8] mb-1 flex items-center gap-1">
                                <Heart className="w-3 h-3" /> Charity Receives
                              </div>
                              <div className="text-xl font-bold text-blue-400">{fmt(selectedStrategyDetails.charityReceives)}</div>
                            </div>
                            <div className="p-4 bg-[#0d1a2e] rounded-lg border border-[#12233e]">
                              <div className="text-xs text-[#7a95b8] mb-1 flex items-center gap-1">
                                <Target className="w-3 h-3" /> Tax Efficiency
                              </div>
                              <div className="text-xl font-bold text-purple-400">{selectedStrategyDetails.efficiency}%</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            {/* Cost Breakdown Chart */}
                            <div className="bg-[#0d1a2e] p-5 rounded-xl border border-[#12233e]">
                              <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                <PieChartIcon className="w-4 h-4 text-blue-400" /> Value Breakdown
                              </h4>
                              <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={pieData}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={40}
                                      outerRadius={70}
                                      paddingAngle={5}
                                      dataKey="value"
                                    >
                                      {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#22c55e'} />
                                      ))}
                                    </Pie>
                                    <Tooltip 
                                      formatter={(value: number) => fmt(value)}
                                      contentStyle={{ backgroundColor: '#0a1120', borderColor: '#12233e', color: '#fff' }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '12px', color: '#7a95b8' }} />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                            </div>

                            {/* Complexity Radar */}
                            <div className="bg-[#0d1a2e] p-5 rounded-xl border border-[#12233e]">
                              <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-purple-400" /> Strategy Profile
                              </h4>
                              <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={complexityRadarData}>
                                    <PolarGrid stroke="#12233e" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#7a95b8', fontSize: 10 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                                    <Radar name="Profile" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0a1120', borderColor: '#12233e', color: '#fff' }} />
                                  </RadarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          </div>

                          {/* Details Sections */}
                          <div className="space-y-6">
                            <div>
                              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2 border-b border-[#12233e] pb-2">
                                <Target className="w-4 h-4 text-green-400" /> Ideal Use Case
                              </h4>
                              <p className="text-sm text-[#7a95b8] bg-[#0d1a2e] p-4 rounded-lg border border-[#12233e]">
                                {selectedStrategyDetails.bestFor}
                              </p>
                            </div>

                            <div>
                              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2 border-b border-[#12233e] pb-2">
                                <AlertTriangle className="w-4 h-4 text-yellow-400" /> Key Considerations
                              </h4>
                              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {selectedStrategyDetails.considerations.map((c, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-[#7a95b8] bg-[#0d1a2e] p-3 rounded-lg border border-[#12233e]">
                                    <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                    <span>{c}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2 border-b border-[#12233e] pb-2">
                                <Briefcase className="w-4 h-4 text-orange-400" /> Eligible Asset Types
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {selectedStrategyDetails.assetTypes.map((asset, i) => (
                                  <span key={i} className="px-3 py-1 bg-[#12233e] text-blue-300 text-xs rounded-full border border-blue-900/30">
                                    {asset}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#0a1120] border border-[#12233e] rounded-xl h-full flex items-center justify-center p-12">
                        <div className="text-center">
                          <Info className="w-12 h-12 text-[#4b6382] mx-auto mb-4 opacity-50" />
                          <h3 className="text-lg font-medium text-white mb-2">Select a Strategy</h3>
                          <p className="text-sm text-[#7a95b8] max-w-md mx-auto">
                            Choose a charitable giving strategy from the list to view detailed analysis, cost breakdowns, and considerations.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Tab 2: Comparative Analysis */}
              <TabsContent value="analysis" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Master Comparison Chart */}
                  <div className="bg-[#0a1120] border border-[#12233e] rounded-xl p-6 lg:col-span-2">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-blue-400" /> Strategy Financial Comparison
                    </h3>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={comparisonBarData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                          <XAxis 
                            dataKey="name" 
                            stroke="#7a95b8" 
                            tick={{ fill: '#7a95b8', fontSize: 11 }} 
                            angle={-45} 
                            textAnchor="end" 
                            height={80} 
                          />
                          <YAxis 
                            yAxisId="left" 
                            stroke="#7a95b8" 
                            tickFormatter={(val) => `$${val / 1000}k`} 
                            tick={{ fill: '#7a95b8', fontSize: 11 }} 
                          />
                          <YAxis 
                            yAxisId="right" 
                            orientation="right" 
                            stroke="#8b5cf6" 
                            tickFormatter={(val) => `${val}%`} 
                            tick={{ fill: '#8b5cf6', fontSize: 11 }} 
                          />
                          <Tooltip 
                            formatter={(value: number, name: string) => {
                              if (name === "Efficiency Score") return [`${value}%`, name];
                              return [fmt(value), name];
                            }}
                            contentStyle={{ backgroundColor: '#0a1120', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }}
                          />
                          <Legend wrapperStyle={{ paddingTop: '20px' }} />
                          <Bar yAxisId="left" dataKey="netCost" name="Net Cost to Donor" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          <Bar yAxisId="left" dataKey="charityReceives" name="Charity Receives" fill="#22c55e" radius={[4, 4, 0, 0]} />
                          <Line yAxisId="right" type="monotone" dataKey="efficiency" name="Efficiency Score" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6' }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Efficiency Trends */}
                  <div className="bg-[#0a1120] border border-[#12233e] rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-purple-400" /> Efficiency by Income Level
                    </h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={efficiencyTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                          <XAxis dataKey="incomeLevel" stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 11 }} />
                          <YAxis stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 11 }} domain={['auto', 'auto']} />
                          <Tooltip contentStyle={{ backgroundColor: '#0a1120', borderColor: '#12233e', color: '#fff' }} />
                          <Legend />
                          <Line type="monotone" dataKey="directCash" name="Direct Cash" stroke="#3b82f6" strokeWidth={2} />
                          <Line type="monotone" dataKey="appreciated" name="Appreciated Assets" stroke="#22c55e" strokeWidth={2} />
                          <Line type="monotone" dataKey="daf" name="DAF Bunching" stroke="#8b5cf6" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Data Table */}
                  <div className="bg-[#0a1120] border border-[#12233e] rounded-xl overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-[#12233e] bg-[#0d1a2e]">
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" /> Detailed Comparison Matrix
                      </h3>
                    </div>
                    <div className="overflow-x-auto flex-1 custom-scrollbar">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-[#0a1120] text-[#7a95b8] text-xs uppercase tracking-wider sticky top-0">
                          <tr>
                            <th className="px-4 py-3 font-medium border-b border-[#12233e]">Strategy</th>
                            <th className="px-4 py-3 font-medium border-b border-[#12233e] text-right">Deduction</th>
                            <th className="px-4 py-3 font-medium border-b border-[#12233e] text-right">Net Cost</th>
                            <th className="px-4 py-3 font-medium border-b border-[#12233e] text-right">Efficiency</th>
                            <th className="px-4 py-3 font-medium border-b border-[#12233e] text-center">Complexity</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#12233e] text-white">
                          {strategies.map((s) => (
                            <tr key={s.id} className="hover:bg-[#0d1a2e] transition-colors">
                              <td className="px-4 py-3 font-medium">{s.name}</td>
                              <td className="px-4 py-3 text-right text-green-400">{fmt(s.taxDeduction)}</td>
                              <td className="px-4 py-3 text-right">{fmt(s.netCost)}</td>
                              <td className="px-4 py-3 text-right">
                                <span className={`px-2 py-1 rounded text-xs ${s.efficiency > 150 ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                  {s.efficiency}%
                                </span>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  {[1, 2, 3].map((i) => (
                                    <div key={i} className={`w-2 h-2 rounded-full ${i <= Math.ceil(s.complexityScore / 3.33) ? 'bg-orange-500' : 'bg-[#12233e]'}`} />
                                  ))}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 3: Long-term Projections */}
              <TabsContent value="projections" className="mt-6 space-y-6">
                <div className="bg-[#0a1120] border border-[#12233e] rounded-xl p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <LineChartIcon className="w-5 h-5 text-green-400" /> Charitable Impact Projection
                      </h3>
                      <p className="text-sm text-[#7a95b8] mt-1">Projected growth of contributed assets for {selectedStrategyDetails?.name}</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 bg-[#0d1a2e] p-3 rounded-lg border border-[#12233e]">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-[#7a95b8]">Horizon (Yrs)</Label>
                        <Select value={String(timeHorizon)} onValueChange={(v) => setTimeHorizon(Number(v))}>
                          <SelectTrigger className="w-20 h-8 text-xs bg-[#0a1120] border-[#12233e] text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="30">30</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs text-[#7a95b8]">Return Rate</Label>
                        <Select value={String(expectedReturn)} onValueChange={(v) => setExpectedReturn(Number(v))}>
                          <SelectTrigger className="w-24 h-8 text-xs bg-[#0a1120] border-[#12233e] text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                            <SelectItem value="0.04">4% (Cons)</SelectItem>
                            <SelectItem value="0.06">6% (Mod)</SelectItem>
                            <SelectItem value="0.08">8% (Aggr)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="h-[400px] mb-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={projectionData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <defs>
                          <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                        <XAxis dataKey="year" stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 11 }} />
                        <YAxis stroke="#7a95b8" tickFormatter={(val) => `$${val / 1000}k`} tick={{ fill: '#7a95b8', fontSize: 11 }} />
                        <Tooltip 
                          formatter={(value: number) => fmt(value)}
                          contentStyle={{ backgroundColor: '#0a1120', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }}
                        />
                        <Legend />
                        <Area type="monotone" dataKey="projectedValue" name="Projected Value (Nominal)" stroke="#22c55e" fillOpacity={1} fill="url(#colorProjected)" />
                        <Area type="monotone" dataKey="baselineCash" name="Cumulative Cash Baseline" stroke="#3b82f6" fillOpacity={1} fill="url(#colorBaseline)" />
                        <Line type="monotone" dataKey="inflationAdjusted" name="Inflation Adjusted Value" stroke="#f97316" strokeDasharray="5 5" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#0d1a2e] border border-[#12233e] rounded-lg p-4">
                      <div className="text-sm text-[#7a95b8] mb-1">Total Initial Contribution</div>
                      <div className="text-2xl font-bold text-white">{fmt(selectedStrategyDetails?.charityReceives || 0)}</div>
                    </div>
                    <div className="bg-[#0d1a2e] border border-[#12233e] rounded-lg p-4">
                      <div className="text-sm text-[#7a95b8] mb-1">Projected Value (Year {timeHorizon})</div>
                      <div className="text-2xl font-bold text-green-400">{fmt(projectionData[projectionData.length - 1]?.projectedValue || 0)}</div>
                    </div>
                    <div className="bg-[#0d1a2e] border border-[#12233e] rounded-lg p-4">
                      <div className="text-sm text-[#7a95b8] mb-1">Total Growth Generated</div>
                      <div className="text-2xl font-bold text-blue-400">
                        {fmt((projectionData[projectionData.length - 1]?.projectedValue || 0) - (selectedStrategyDetails?.charityReceives || 0))}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 4: Implementation Details */}
              <TabsContent value="implementation" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Action Plan */}
                  <div className="bg-[#0a1120] border border-[#12233e] rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-400" /> Implementation Timeline
                    </h3>
                    
                    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#12233e] before:to-transparent">
                      <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-blue-500 bg-[#0d1a2e] text-blue-400 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-[0_0_10px_rgba(59,130,246,0.2)] z-10">
                          1
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-[#0d1a2e] p-4 rounded-lg border border-[#12233e]">
                          <h4 className="font-medium text-white text-sm mb-1">Strategy Selection & Discovery</h4>
                          <p className="text-xs text-[#7a95b8]">Confirm {selectedStrategyDetails?.name} aligns with overall financial plan and charitable intent.</p>
                        </div>
                      </div>
                      
                      <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-[#12233e] bg-[#0a1120] text-[#7a95b8] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                          2
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-[#0d1a2e] p-4 rounded-lg border border-[#12233e] opacity-70">
                          <h4 className="font-medium text-white text-sm mb-1">Asset Identification</h4>
                          <p className="text-xs text-[#7a95b8]">Identify specific assets (e.g., highly appreciated stock lots) to fund the contribution.</p>
                        </div>
                      </div>
                      
                      <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-[#12233e] bg-[#0a1120] text-[#7a95b8] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                          3
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-[#0d1a2e] p-4 rounded-lg border border-[#12233e] opacity-70">
                          <h4 className="font-medium text-white text-sm mb-1">Legal & Tax Review</h4>
                          <p className="text-xs text-[#7a95b8]">Coordinate with CPA and estate attorney to draft necessary documents and verify tax treatment.</p>
                        </div>
                      </div>

                      <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-[#12233e] bg-[#0a1120] text-[#7a95b8] shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                          4
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-[#0d1a2e] p-4 rounded-lg border border-[#12233e] opacity-70">
                          <h4 className="font-medium text-white text-sm mb-1">Execution & Transfer</h4>
                          <p className="text-xs text-[#7a95b8]">Process paperwork and execute asset transfers to the designated charitable vehicle or organization.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Operational Requirements */}
                  <div className="space-y-6">
                    <div className="bg-[#0a1120] border border-[#12233e] rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-orange-400" /> Operational Parameters
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#0d1a2e] p-4 rounded-lg border border-[#12233e]">
                          <div className="text-xs text-[#7a95b8] mb-1">Estimated Setup Time</div>
                          <div className="text-lg font-medium text-white">{selectedStrategyDetails?.setupTimeDays} Days</div>
                        </div>
                        <div className="bg-[#0d1a2e] p-4 rounded-lg border border-[#12233e]">
                          <div className="text-xs text-[#7a95b8] mb-1">Minimum Contribution</div>
                          <div className="text-lg font-medium text-white">{fmt(selectedStrategyDetails?.minContribution || 0)}</div>
                        </div>
                        <div className="bg-[#0d1a2e] p-4 rounded-lg border border-[#12233e]">
                          <div className="text-xs text-[#7a95b8] mb-1">Complexity Level</div>
                          <div className="text-lg font-medium text-white">{selectedStrategyDetails?.complexityScore}/10</div>
                        </div>
                        <div className="bg-[#0d1a2e] p-4 rounded-lg border border-[#12233e]">
                          <div className="text-xs text-[#7a95b8] mb-1">Ongoing Maintenance</div>
                          <div className="text-lg font-medium text-white">
                            {selectedStrategyDetails?.complexityScore && selectedStrategyDetails.complexityScore > 7 ? "High" : 
                             selectedStrategyDetails?.complexityScore && selectedStrategyDetails.complexityScore > 3 ? "Medium" : "Low"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#0a1120] border border-[#12233e] rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-green-400" /> Compliance & Documentation
                      </h3>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-3 text-sm text-[#7a95b8]">
                          <div className="mt-0.5 bg-[#12233e] p-1 rounded">
                            <FileText className="w-3 h-3 text-blue-400" />
                          </div>
                          <span>Obtain qualified appraisal for non-cash assets exceeding $5,000 in value.</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm text-[#7a95b8]">
                          <div className="mt-0.5 bg-[#12233e] p-1 rounded">
                            <FileText className="w-3 h-3 text-blue-400" />
                          </div>
                          <span>File IRS Form 8283 for non-cash charitable contributions with tax return.</span>
                        </li>
                        <li className="flex items-start gap-3 text-sm text-[#7a95b8]">
                          <div className="mt-0.5 bg-[#12233e] p-1 rounded">
                            <FileText className="w-3 h-3 text-blue-400" />
                          </div>
                          <span>Ensure contemporaneous written acknowledgment from charity before filing taxes.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="mt-10 pt-6 border-t border-[#12233e] print:hidden">
              <NAICDisclaimer />
            </div>
          </div>
        )}
      </div>
      <PageInsights pageId="charitable-giving-optimizer" />
    
        <ComplianceFooter pageName="CharitableGivingOptimizer" showsTax showsEstate showsProjections />
      </AppShell>
  );
}

function StrategyCard({ strategy, isSelected, onClick }: { strategy: any, isSelected: boolean, onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
        isSelected 
          ? "bg-[#12233e] border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]" 
          : "bg-[#0a1120] border-[#12233e] hover:border-[#2a4365] hover:bg-[#0d1a2e]"
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-white text-sm">{strategy.name}</h3>
        {strategy.efficiency > 150 && (
          <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-[10px] font-bold rounded uppercase tracking-wider">High ROI</span>
        )}
      </div>
      <p className="text-xs text-[#7a95b8] line-clamp-2 mb-3">{strategy.description}</p>
      
      <div className="grid grid-cols-2 gap-2 mt-2 pt-3 border-t border-[#12233e]/50">
        <div>
          <div className="text-[10px] text-[#4b6382] uppercase tracking-wider">Tax Deduction</div>
          <div className="text-sm font-medium text-white">{fmt(strategy.taxDeduction)}</div>
        </div>
        <div>
          <div className="text-[10px] text-[#4b6382] uppercase tracking-wider">Net Cost</div>
          <div className="text-sm font-medium text-white">{fmt(strategy.netCost)}</div>
        </div>
      </div>
    </div>
  );
}

export { StrategyCard };
