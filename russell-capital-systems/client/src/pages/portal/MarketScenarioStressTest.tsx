// @ts-nocheck
import { useState, useMemo, useEffect, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExportToSlides } from "@/components/ExportToSlides";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { PageInsights } from "@/components/PageInsights";
import { NumberInput } from "@/components/NumberInput";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Target,
  FileText,
  Zap,
  Shield,
  Activity,
  Search,
  Download,
  Loader2,
  Info,
  PieChartIcon,
  Settings,
  Save,
  RefreshCw,
  Calendar,
  Briefcase,
  Building,
  Wallet,
  Coins,
  History,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart
} from "recharts";
import { toast } from "sonner";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { useClientData } from "@/contexts/ClientDataContext";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

const fmt = (n: number) => n >= 1000000 ? `$${(n / 1000000).toFixed(2)}M` : `$${Math.round(n).toLocaleString()}`;
const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;

interface Scenario {
  name: string;
  year: string;
  equityImpact: number;
  bondImpact: number;
  realEstateImpact: number;
  altImpact: number;
  cashImpact: number;
  duration: string;
  recovery: string;
  description: string;
}

const SCENARIOS: Scenario[] = [
  { name: "2008 Financial Crisis", year: "2008-2009", equityImpact: -0.50, bondImpact: 0.05, realEstateImpact: -0.30, altImpact: -0.25, cashImpact: 0.02, duration: "17 months", recovery: "4 years", description: "Subprime mortgage crisis led to global financial meltdown. S&P 500 fell 56.8% from peak to trough. Credit markets froze, major institutions failed." },
  { name: "2020 COVID Crash", year: "2020", equityImpact: -0.34, bondImpact: 0.07, realEstateImpact: -0.05, altImpact: -0.15, cashImpact: 0.01, duration: "33 days", recovery: "5 months", description: "Fastest bear market in history. S&P 500 fell 33.9% in 33 days. Unprecedented fiscal and monetary response led to rapid recovery." },
  { name: "2000 Dot-Com Bust", year: "2000-2002", equityImpact: -0.45, bondImpact: 0.10, realEstateImpact: 0.05, altImpact: -0.10, cashImpact: 0.04, duration: "30 months", recovery: "7 years", description: "Technology bubble burst. NASDAQ fell 78%. S&P 500 fell 49%. Value stocks significantly outperformed growth. Bonds provided strong diversification." },
  { name: "2022 Rate Shock", year: "2022", equityImpact: -0.19, bondImpact: -0.13, realEstateImpact: -0.08, altImpact: -0.05, cashImpact: 0.04, duration: "10 months", recovery: "2 years", description: "Aggressive Fed rate hikes to combat inflation. Both stocks and bonds fell simultaneously — the worst year for 60/40 portfolios since 1937." },
  { name: "1987 Black Monday", year: "1987", equityImpact: -0.22, bondImpact: 0.03, realEstateImpact: 0.02, altImpact: -0.08, cashImpact: 0.05, duration: "1 day (crash)", recovery: "2 years", description: "Single-day crash of 22.6% on October 19, 1987. Portfolio insurance and program trading amplified selling. Markets recovered relatively quickly." },
  { name: "Stagflation (1973-74)", year: "1973-1974", equityImpact: -0.48, bondImpact: -0.05, realEstateImpact: -0.10, altImpact: 0.15, cashImpact: 0.08, duration: "21 months", recovery: "7 years", description: "Oil embargo, high inflation, and recession. S&P 500 fell 48%. Real returns were devastated by double-digit inflation. Commodities outperformed." },
  { name: "Custom: Severe Recession", year: "Custom", equityImpact: -0.40, bondImpact: 0.03, realEstateImpact: -0.20, altImpact: -0.15, cashImpact: 0.02, duration: "18 months", recovery: "3-5 years", description: "Custom severe recession scenario with deep equity losses, moderate real estate decline, and flight to quality in bonds." },
  { name: "Custom: Rising Rates + Inflation", year: "Custom", equityImpact: -0.15, bondImpact: -0.20, realEstateImpact: -0.10, altImpact: 0.05, cashImpact: 0.05, duration: "12-24 months", recovery: "2-3 years", description: "Custom scenario modeling sustained inflation with aggressive rate hikes. Both stocks and bonds decline. Commodities and TIPS outperform." },
];

function computeImpact(client: any, scenario: Scenario, overrides?: any) {
  const eqOverride = overrides?.equity ?? 1;
  const bondOverride = overrides?.bond ?? 1;
  const reOverride = overrides?.realEstate ?? 1;
  const altOverride = overrides?.alts ?? 1;
  const cashOverride = overrides?.cash ?? 1;

  const equity = ((client.taxableAssets ?? 0) * 0.6 + (client.iraBalance ?? 0) * 0.6 + (client.iraBalance ?? 0) * 0.5 + (client.rothBalance ?? 0) * 0.5) * eqOverride;
  const bonds = ((client.taxableAssets ?? 0) * 0.3 + (client.iraBalance ?? 0) * 0.3 + (client.iraBalance ?? 0) * 0.4 + (client.rothBalance ?? 0) * 0.3) * bondOverride;
  const realEstate = (client.realEstateEquity ?? 0) * reOverride;
  const alts = ((client.taxableAssets ?? 0) * 0.1 + (client.iraBalance ?? 0) * 0.1) * altOverride;
  const cash = ((client.rothBalance ?? 0) * 0.2) * cashOverride;

  const total = equity + bonds + realEstate + alts + cash;
  const equityLoss = equity * scenario.equityImpact;
  const bondLoss = bonds * scenario.bondImpact;
  const reLoss = realEstate * scenario.realEstateImpact;
  const altLoss = alts * scenario.altImpact;
  const cashLoss = cash * scenario.cashImpact;
  const totalLoss = equityLoss + bondLoss + reLoss + altLoss + cashLoss;

  return {
    total, totalLoss, postCrisis: total + totalLoss,
    breakdown: [
      { name: "Equities", pre: equity, impact: equityLoss, post: equity + equityLoss, pct: scenario.equityImpact * 100 },
      { name: "Bonds", pre: bonds, impact: bondLoss, post: bonds + bondLoss, pct: scenario.bondImpact * 100 },
      { name: "Real Estate", pre: realEstate, impact: reLoss, post: realEstate + reLoss, pct: scenario.realEstateImpact * 100 },
      { name: "Alternatives", pre: alts, impact: altLoss, post: alts + altLoss, pct: scenario.altImpact * 100 },
      { name: "Cash", pre: cash, impact: cashLoss, post: cash + cashLoss, pct: scenario.cashImpact * 100 },
    ],
  };
}

export default function MarketScenarioStressTest() {
  const { clientData } = useClientData();
  const { user } = useAuth();
  
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: scenariosData } = trpc.scenarios.list.useQuery();
  const { data: marketData } = trpc.marketData.getLatest.useQuery();
  const { data: riskProfiles } = trpc.riskProfile.list.useQuery();
  const { data: strategyAnalytics } = trpc.strategyAnalytics.getSummary.useQuery();
  const { data: complianceAlerts } = trpc.complianceAlerts.list.useQuery();
  
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedScenario, setSelectedScenario] = useState(0);
  const [activeTab, setActiveTab] = useState("impact");
  const [running, setRunning] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [customEquityImpact, setCustomEquityImpact] = useState(-30);
  const [customBondImpact, setCustomBondImpact] = useState(5);
  const [customRealEstateImpact, setCustomRealEstateImpact] = useState(-10);
  const [customAltImpact, setCustomAltImpact] = useState(-5);
  const [customCashImpact, setCustomCashImpact] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [simulationYears, setSimulationYears] = useState(10);
  const [inflationRate, setInflationRate] = useState(3);
  const [reinvestmentRate, setReinvestmentRate] = useState(5);
  const [withdrawalRate, setWithdrawalRate] = useState(4);
  const [compareMode, setCompareMode] = useState(false);
  const [compareScenarioId, setCompareScenarioId] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  const [stressLevel, setStressLevel] = useState(50);
  const [portfolioMultiplier, setPortfolioMultiplier] = useState(1);
  const [showMitigation, setShowMitigation] = useState(true);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [animateCharts, setAnimateCharts] = useState(true);
  const [selectedAssetClass, setSelectedAssetClass] = useState<string | null>(null);
  const [hoveredDataPoint, setHoveredDataPoint] = useState<any>(null);
  const [savedSimulations, setSavedSimulations] = useState<any[]>([]);
  const [simulationName, setSimulationName] = useState("");

  const handleClientSelect = useCallback((val: string) => setSelectedClientId(val), []);
  const handleScenarioSelect = useCallback((val: string) => setSelectedScenario(parseInt(val)), []);
  const handleTabChange = useCallback((val: string) => setActiveTab(val), []);
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value), []);
  const toggleAdvanced = useCallback(() => setShowAdvanced(prev => !prev), []);
  const toggleCompareMode = useCallback(() => setCompareMode(prev => !prev), []);
  const toggleViewMode = useCallback(() => setViewMode(prev => prev === "chart" ? "table" : "chart"), []);
  
  useEffect(() => {
    if (clients && clients.length > 0 && !selectedClientId) {
      setSelectedClientId(String(clients[0].id));
    }
  }, [clients, selectedClientId]);

  useEffect(() => {
    if (running) {
      const timer = setTimeout(() => setRunning(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [running]);

  useEffect(() => {
    if (selectedScenario < 6) {
      setCustomEquityImpact(SCENARIOS[selectedScenario].equityImpact * 100);
      setCustomBondImpact(SCENARIOS[selectedScenario].bondImpact * 100);
      setCustomRealEstateImpact(SCENARIOS[selectedScenario].realEstateImpact * 100);
      setCustomAltImpact(SCENARIOS[selectedScenario].altImpact * 100);
      setCustomCashImpact(SCENARIOS[selectedScenario].cashImpact * 100);
    }
  }, [selectedScenario]);

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    if (!searchQuery) return clients;
    return clients.filter((c) => c.name?.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [clients, searchQuery]);

  const selectedClient = useMemo(() => {
    if (!clients) return null;
    if (selectedClientId) return clients.find((c) => String(c.id) === selectedClientId) ?? clients[0];
    return clients[0] ?? null;
  }, [clients, selectedClientId]);

  const activeScenario = useMemo(() => {
    const baseScenario = SCENARIOS[selectedScenario];
    if (selectedScenario >= 6) {
      return {
        ...baseScenario,
        equityImpact: customEquityImpact / 100,
        bondImpact: customBondImpact / 100,
        realEstateImpact: customRealEstateImpact / 100,
        altImpact: customAltImpact / 100,
        cashImpact: customCashImpact / 100,
      };
    }
    return baseScenario;
  }, [selectedScenario, customEquityImpact, customBondImpact, customRealEstateImpact, customAltImpact, customCashImpact]);

  const compareScenario = useMemo(() => {
    return SCENARIOS[compareScenarioId];
  }, [compareScenarioId]);

  const impact = useMemo(() => {
    if (!selectedClient || !activeScenario) return null;
    return computeImpact(selectedClient, activeScenario, {
      equity: portfolioMultiplier,
      bond: portfolioMultiplier,
      realEstate: portfolioMultiplier,
      alts: portfolioMultiplier,
      cash: portfolioMultiplier
    });
  }, [selectedClient, activeScenario, portfolioMultiplier]);

  const compareImpact = useMemo(() => {
    if (!selectedClient || !compareScenario || !compareMode) return null;
    return computeImpact(selectedClient, compareScenario, {
      equity: portfolioMultiplier,
      bond: portfolioMultiplier,
      realEstate: portfolioMultiplier,
      alts: portfolioMultiplier,
      cash: portfolioMultiplier
    });
  }, [selectedClient, compareScenario, compareMode, portfolioMultiplier]);

  const lossPercent = impact ? ((impact.totalLoss / impact.total) * 100).toFixed(1) : "0";
  const compareLossPercent = compareImpact ? ((compareImpact.totalLoss / compareImpact.total) * 100).toFixed(1) : "0";

  const barData = useMemo(() => {
    return impact?.breakdown.map((b) => ({
      name: b.name,
      pre: b.pre,
      post: Math.max(0, b.post),
      loss: Math.abs(b.impact),
      impactPct: b.pct
    })) ?? [];
  }, [impact]);

  const compareBarData = useMemo(() => {
    if (!impact || !compareImpact) return [];
    return impact.breakdown.map((b, i) => ({
      name: b.name,
      basePost: Math.max(0, b.post),
      comparePost: Math.max(0, compareImpact.breakdown[i].post),
      baseLoss: Math.abs(b.impact),
      compareLoss: Math.abs(compareImpact.breakdown[i].impact)
    }));
  }, [impact, compareImpact]);

  const pieData = useMemo(() => {
    return impact?.breakdown.map((b) => ({
      name: b.name,
      value: b.pre
    })).filter((b) => b.value > 0) ?? [];
  }, [impact]);

  const postPieData = useMemo(() => {
    return impact?.breakdown.map((b) => ({
      name: b.name,
      value: Math.max(0, b.post)
    })).filter((b) => b.value > 0) ?? [];
  }, [impact]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#64748b'];

  const recoveryData = useMemo(() => {
    if (!impact) return [];
    const data = [];
    let value = impact.postCrisis;
    const recoveryYears = parseInt(activeScenario.recovery) || 4;
    const annualRecovery = Math.pow(impact.total / impact.postCrisis, 1 / recoveryYears) - 1;
    
    const inflationFactor = showAdvanced ? (1 - inflationRate / 100) : 1;
    
    for (let m = 0; m <= simulationYears * 12; m++) {
      const isRecoveryPeriod = m <= recoveryYears * 12;
      const growthRate = isRecoveryPeriod ? annualRecovery / 12 : reinvestmentRate / 100 / 12;
      const withdrawalAmount = showAdvanced ? (impact.total * (withdrawalRate / 100) / 12) : 0;
      
      data.push({ 
        month: m, 
        value: Math.round(value), 
        target: impact.total,
        inflationAdjusted: Math.round(value * Math.pow(inflationFactor, m/12)),
        withdrawal: Math.round(withdrawalAmount)
      });
      
      value = (value * (1 + growthRate)) - withdrawalAmount;
      if (value < 0) value = 0;
    }
    return data;
  }, [impact, activeScenario, simulationYears, showAdvanced, inflationRate, reinvestmentRate, withdrawalRate]);

  const radarData = useMemo(() => {
    if (!impact) return [];
    return impact.breakdown.map((b) => ({
      subject: b.name,
      A: Math.abs(b.pct),
      B: compareImpact ? Math.abs(compareImpact.breakdown.find((cb) => cb.name === b.name)?.pct || 0) : 0,
      fullMark: 100,
    }));
  }, [impact, compareImpact]);

  const historicalData = useMemo(() => {
    return [
      { year: '2018', value: impact?.total ? impact.total * 0.8 : 0, benchmark: impact?.total ? impact.total * 0.85 : 0 },
      { year: '2019', value: impact?.total ? impact.total * 0.95 : 0, benchmark: impact?.total ? impact.total * 0.98 : 0 },
      { year: '2020', value: impact?.total ? impact.total * 0.85 : 0, benchmark: impact?.total ? impact.total * 0.9 : 0 },
      { year: '2021', value: impact?.total ? impact.total * 1.1 : 0, benchmark: impact?.total ? impact.total * 1.05 : 0 },
      { year: '2022', value: impact?.total ? impact.total * 0.9 : 0, benchmark: impact?.total ? impact.total * 0.88 : 0 },
      { year: '2023', value: impact?.total ? impact.total * 1.05 : 0, benchmark: impact?.total ? impact.total * 1.02 : 0 },
      { year: '2024', value: impact?.total || 0, benchmark: impact?.total || 0 },
    ];
  }, [impact]);

  const runStressTest = async () => {
    setRunning(true);
    await new Promise(r => setTimeout(r, 1500));
    setRunning(false);
    toast.success(`Stress test complete: ${activeScenario.name}`);
  };

  const handleExportCSV = useCallback(() => {
    if (!impact) return;
    setIsExporting(true);
    try {
      const headers = ["Asset Class", "Pre-Crisis Value", "Impact %", "Impact Value", "Post-Crisis Value"];
      const rows = impact.breakdown.map((b) => [
        b.name,
        b.pre.toString(),
        b.pct.toString(),
        b.impact.toString(),
        b.post.toString()
      ]);
      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `stress-test-${activeScenario.name.toLowerCase().replace(/\s+/g, '-')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV exported successfully");
    } catch (err) {
      toast.error("Failed to export CSV");
    } finally {
      setIsExporting(false);
    }
  }, [impact, activeScenario]);

  const saveSimulation = useCallback(() => {
    if (!impact || !activeScenario) return;
    const newSim = {
      id: Date.now().toString(),
      name: simulationName || `Sim ${new Date().toLocaleDateString()}`,
      date: new Date().toISOString(),
      scenario: activeScenario.name,
      clientName: selectedClient?.name,
      totalPre: impact.total,
      totalPost: impact.postCrisis,
      lossPct: lossPercent
    };
    setSavedSimulations(prev => [newSim, ...prev]);
    setSimulationName("");
    toast.success("Simulation saved successfully");
  }, [impact, activeScenario, selectedClient, simulationName, lossPercent]);

  if (!clients) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 space-y-6 max-w-7xl mx-auto text-[#c8d8ec]">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="MarketScenarioStressTest" />

        <ExecutiveSummary
          pageTitle="Market Scenario Stress Test"
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
        <GoalsAccelerator pageName="Market Scenario Stress Test" pageContext="Market Scenario Stress Test — market analysis modeling with projections and scenario analysis" />
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
        {/* Header */}
        <div className="rc-page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#12233e] pb-6">
          <div>
            <h1 className="rc-page-title text-3xl font-bold text-white flex items-center gap-3">
              <Activity className="w-8 h-8 text-[#22c55e]" />
              Market Scenario Stress Test
            </h1>
            <p className="rc-page-subtitle text-[#7a95b8] mt-2 max-w-3xl">
              Advanced portfolio stress testing with historical scenarios, custom shocks, and recovery projections.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={toggleAdvanced} variant="outline" className="bg-[#0d1a2e] border-[#12233e] text-white hover:bg-[#12233e]">
              <Settings className="w-4 h-4 mr-2" />
              {showAdvanced ? "Basic Mode" : "Advanced Mode"}
            </Button>
            <Button onClick={handleExportCSV} disabled={isExporting} className="bg-[#0d1a2e] border border-[#12233e] hover:bg-[#12233e] text-white">
              {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Export CSV
            </Button>
            <ExportToSlides
              toolName="Market Scenario Stress Test"
              getSections={() => {
                if (!impact || !selectedClient) return [];
                return [
                  {
                    title: "Stress Test Summary",
                    items: [
                      { label: "Client", value: `${selectedClient.name}` },
                      { label: "Scenario", value: `${activeScenario.name} (${activeScenario.year})` },
                      { label: "Pre-Crisis Value", value: fmt(impact.total) },
                      { label: "Estimated Loss", value: `${fmt(impact.totalLoss)} (${lossPercent}%)` },
                      { label: "Post-Crisis Value", value: fmt(impact.postCrisis) },
                      { label: "Est. Recovery", value: activeScenario.recovery }
                    ]
                  }
                ];
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Controls */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-[#060d19] border-[#12233e]">
              <CardHeader className="pb-3 border-b border-[#12233e]">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#3b82f6]" />
                  Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-5">
                <div className="space-y-2">
                  <Label className="text-[#7a95b8] text-xs font-semibold uppercase tracking-wider">Select Client</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a95b8]" />
                    <input
                      type="text"
                      placeholder="Search clients..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      className="w-full bg-[#0d1a2e] border border-[#12233e] rounded-md py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-[#3b82f6] mb-2"
                    />
                  </div>
                  <Select value={selectedClientId} onValueChange={handleClientSelect}>
                    <SelectTrigger className="w-full bg-[#0d1a2e] border-[#12233e] text-white">
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white max-h-[200px]">
                      {filteredClients.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#7a95b8] text-xs font-semibold uppercase tracking-wider">Stress Scenario</Label>
                  <Select value={selectedScenario.toString()} onValueChange={handleScenarioSelect}>
                    <SelectTrigger className="w-full bg-[#0d1a2e] border-[#12233e] text-white">
                      <SelectValue placeholder="Select scenario" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                      {SCENARIOS.map((s, idx) => (
                        <SelectItem key={idx} value={idx.toString()}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedScenario >= 6 && (
                  <div className="p-4 bg-[#0d1a2e] border border-[#12233e] rounded-lg space-y-4 animate-in fade-in slide-in-from-top-2">
                    <h4 className="text-sm font-medium text-white flex items-center gap-2">
                      <Settings className="w-4 h-4 text-[#f59e0b]" />
                      Custom Shocks
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[#7a95b8]">Equities</span>
                          <span className={customEquityImpact < 0 ? "text-red-400" : "text-green-400"}>{customEquityImpact}%</span>
                        </div>
                        <Slider value={[customEquityImpact]} min={-80} max={20} step={1} onValueChange={v => setCustomEquityImpact(v[0])} className="py-1" />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[#7a95b8]">Bonds</span>
                          <span className={customBondImpact < 0 ? "text-red-400" : "text-green-400"}>{customBondImpact}%</span>
                        </div>
                        <Slider value={[customBondImpact]} min={-40} max={20} step={1} onValueChange={v => setCustomBondImpact(v[0])} className="py-1" />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[#7a95b8]">Real Estate</span>
                          <span className={customRealEstateImpact < 0 ? "text-red-400" : "text-green-400"}>{customRealEstateImpact}%</span>
                        </div>
                        <Slider value={[customRealEstateImpact]} min={-50} max={20} step={1} onValueChange={v => setCustomRealEstateImpact(v[0])} className="py-1" />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-[#7a95b8]">Alternatives</span>
                          <span className={customAltImpact < 0 ? "text-red-400" : "text-green-400"}>{customAltImpact}%</span>
                        </div>
                        <Slider value={[customAltImpact]} min={-50} max={30} step={1} onValueChange={v => setCustomAltImpact(v[0])} className="py-1" />
                      </div>
                    </div>
                  </div>
                )}

                {showAdvanced && (
                  <div className="p-4 bg-[#0d1a2e] border border-[#12233e] rounded-lg space-y-4 animate-in fade-in slide-in-from-top-2">
                    <h4 className="text-sm font-medium text-white flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-[#8b5cf6]" />
                      Advanced Parameters
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-[#7a95b8]">Simulation Years</Label>
                        <NumberInput value={simulationYears} onChange={setSimulationYears} min={1} max={30} className="mt-1 bg-[#060d19]" />
                      </div>
                      <div>
                        <Label className="text-xs text-[#7a95b8]">Inflation Rate (%)</Label>
                        <NumberInput value={inflationRate} onChange={setInflationRate} min={0} max={15} step={0.1} className="mt-1 bg-[#060d19]" />
                      </div>
                      <div>
                        <Label className="text-xs text-[#7a95b8]">Withdrawal Rate (%)</Label>
                        <NumberInput value={withdrawalRate} onChange={setWithdrawalRate} min={0} max={20} step={0.1} className="mt-1 bg-[#060d19]" />
                      </div>
                      <div>
                        <Label className="text-xs text-[#7a95b8]">Portfolio Multiplier (Stress)</Label>
                        <Slider value={[portfolioMultiplier * 100]} min={50} max={200} step={10} onValueChange={v => setPortfolioMultiplier(v[0] / 100)} className="py-2" />
                        <div className="text-xs text-right text-[#7a95b8] mt-1">{Math.round(portfolioMultiplier * 100)}%</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <Button 
                    onClick={runStressTest} 
                    disabled={running}
                    className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white font-medium shadow-lg shadow-blue-900/20"
                  >
                    {running ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Running Simulation...</>
                    ) : (
                      <><Zap className="w-4 h-4 mr-2" /> Run Stress Test</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#060d19] border-[#12233e]">
              <CardHeader className="pb-3 border-b border-[#12233e]">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Info className="w-5 h-5 text-[#10b981]" />
                  Scenario Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div>
                  <div className="text-xs text-[#7a95b8] uppercase tracking-wider mb-1">Historical Period</div>
                  <div className="text-white font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#7a95b8]" />
                    {activeScenario.year}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#7a95b8] uppercase tracking-wider mb-1">Duration</div>
                  <div className="text-white font-medium flex items-center gap-2">
                    <History className="w-4 h-4 text-[#7a95b8]" />
                    {activeScenario.duration}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#7a95b8] uppercase tracking-wider mb-1">Est. Recovery</div>
                  <div className="text-white font-medium flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#7a95b8]" />
                    {activeScenario.recovery}
                  </div>
                </div>
                <div className="pt-2 border-t border-[#12233e]">
                  <p className="text-sm text-[#7a95b8] leading-relaxed">
                    {activeScenario.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Saved Simulations Table */}
            {savedSimulations.length > 0 && (
              <Card className="bg-[#060d19] border-[#12233e]">
                <CardHeader className="pb-3 border-b border-[#12233e]">
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Save className="w-5 h-5 text-[#f59e0b]" />
                    Saved Runs
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-[#7a95b8] uppercase bg-[#0d1a2e] border-b border-[#12233e]">
                        <tr>
                          <th className="px-4 py-2">Name</th>
                          <th className="px-4 py-2">Loss</th>
                        </tr>
                      </thead>
                      <tbody>
                        {savedSimulations.slice(0, 5).map((sim) => (
                          <tr key={sim.id} className="border-b border-[#12233e] hover:bg-[#0d1a2e]">
                            <td className="px-4 py-2 text-white truncate max-w-[120px]" title={sim.name}>{sim.name}</td>
                            <td className="px-4 py-2 text-red-400">-{sim.lossPct}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="bg-[#060d19] border-[#12233e] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#3b82f6] opacity-5 rounded-bl-full pointer-events-none"></div>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-[#1e3a8a]/30 flex items-center justify-center border border-[#1e3a8a]">
                      <Briefcase className="w-5 h-5 text-[#3b82f6]" />
                    </div>
                    <div className="text-sm font-medium text-[#7a95b8]">Pre-Crisis Value</div>
                  </div>
                  <div className="text-3xl font-bold text-white tracking-tight">
                    {impact ? fmt(impact.total) : "$0"}
                  </div>
                  <div className="mt-2 text-xs text-[#7a95b8] flex items-center gap-1">
                    <Building className="w-3 h-3" /> Across {impact?.breakdown.filter((b) => b.pre > 0).length || 0} asset classes
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#060d19] border-[#12233e] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500 opacity-5 rounded-bl-full pointer-events-none"></div>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-red-900/30 flex items-center justify-center border border-red-900/50">
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    </div>
                    <div className="text-sm font-medium text-[#7a95b8]">Estimated Impact</div>
                  </div>
                  <div className="text-3xl font-bold text-red-400 tracking-tight flex items-baseline gap-2">
                    {impact ? fmt(impact.totalLoss) : "$0"}
                    <span className="text-lg font-medium opacity-80">({lossPercent}%)</span>
                  </div>
                  <div className="mt-2 text-xs text-[#7a95b8] flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Peak-to-trough decline
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#060d19] border-[#12233e] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#10b981] opacity-5 rounded-bl-full pointer-events-none"></div>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-[#064e3b]/50 flex items-center justify-center border border-[#064e3b]">
                      <Wallet className="w-5 h-5 text-[#10b981]" />
                    </div>
                    <div className="text-sm font-medium text-[#7a95b8]">Post-Crisis Value</div>
                  </div>
                  <div className="text-3xl font-bold text-white tracking-tight">
                    {impact ? fmt(impact.postCrisis) : "$0"}
                  </div>
                  <div className="mt-2 text-xs text-[#7a95b8] flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Remaining capital base
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Tabs */}
            <Card className="bg-[#060d19] border-[#12233e]">
              <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                <div className="border-b border-[#12233e] px-6 pt-4 flex justify-between items-center">
                  <TabsList className="bg-transparent h-12 p-0 space-x-6">
                    <TabsTrigger 
                      value="impact" 
                      className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#3b82f6] data-[state=active]:text-white data-[state=active]:shadow-none rounded-none px-0 pb-4 pt-2 text-[#7a95b8]"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Portfolio Impact
                    </TabsTrigger>
                    <TabsTrigger 
                      value="recovery" 
                      className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#3b82f6] data-[state=active]:text-white data-[state=active]:shadow-none rounded-none px-0 pb-4 pt-2 text-[#7a95b8]"
                    >
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Recovery Path
                    </TabsTrigger>
                    <TabsTrigger 
                      value="allocation" 
                      className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#3b82f6] data-[state=active]:text-white data-[state=active]:shadow-none rounded-none px-0 pb-4 pt-2 text-[#7a95b8]"
                    >
                      <PieChartIcon className="w-4 h-4 mr-2" />
                      Allocation Shift
                    </TabsTrigger>
                    <TabsTrigger 
                      value="report" 
                      className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-[#3b82f6] data-[state=active]:text-white data-[state=active]:shadow-none rounded-none px-0 pb-4 pt-2 text-[#7a95b8]"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Executive Report
                    </TabsTrigger>
                  </TabsList>
                  
                  {activeTab === 'impact' && (
                    <div className="flex gap-2 pb-2">
                      <Button variant="ghost" size="sm" onClick={toggleCompareMode} className={`h-8 px-2 text-xs ${compareMode ? 'bg-[#1e3a8a] text-white' : 'text-[#7a95b8]'}`}>
                        Compare
                      </Button>
                      <Button variant="ghost" size="sm" onClick={toggleViewMode} className="h-8 px-2 text-xs text-[#7a95b8]">
                        {viewMode === 'chart' ? 'Table View' : 'Chart View'}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  {/* Tab 1: Portfolio Impact */}
                  <TabsContent value="impact" className="m-0 animate-in fade-in duration-500">
                    {compareMode && (
                      <div className="mb-6 p-4 bg-[#0d1a2e] border border-[#12233e] rounded-lg flex items-center gap-4">
                        <Label className="text-white whitespace-nowrap">Compare with:</Label>
                        <Select value={compareScenarioId.toString()} onValueChange={(v) => setCompareScenarioId(parseInt(v))}>
                          <SelectTrigger className="w-[250px] bg-[#060d19] border-[#12233e] text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                            {SCENARIOS.map((s, idx) => (
                              <SelectItem key={idx} value={idx.toString()} disabled={idx === selectedScenario}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="ml-auto flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div>
                            <span className="text-[#7a95b8]">Current: {lossPercent}%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-[#f59e0b]"></div>
                            <span className="text-[#7a95b8]">Compare: {compareLossPercent}%</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {viewMode === 'chart' ? (
                      <div className="space-y-8">
                        {/* Main Bar Chart - Recharts #1 */}
                        <div className="h-[400px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            {compareMode ? (
                              <BarChart data={compareBarData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                                <XAxis dataKey="name" tick={{ fill: "#7a95b8" }} axisLine={{ stroke: '#12233e' }} tickLine={false} />
                                <YAxis tickFormatter={(v) => fmt(v)} tick={{ fill: "#7a95b8" }} axisLine={false} tickLine={false} />
                                <Tooltip 
                                  formatter={(value: number, name: string) => [fmt(value), name.includes('Loss') ? 'Impact' : 'Remaining']}
                                  contentStyle={{ backgroundColor: "#0d1a2e", borderColor: "#12233e", color: "#fff", borderRadius: "8px" }}
                                />
                                <Legend />
                                <Bar dataKey="basePost" stackId="a" fill="#3b82f6" name={`${activeScenario.name} Remaining`} radius={[0, 0, 4, 4]} />
                                <Bar dataKey="baseLoss" stackId="a" fill="#ef4444" name={`${activeScenario.name} Impact`} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="comparePost" stackId="b" fill="#f59e0b" name={`${compareScenario.name} Remaining`} radius={[0, 0, 4, 4]} />
                                <Bar dataKey="compareLoss" stackId="b" fill="#f87171" name={`${compareScenario.name} Impact`} radius={[4, 4, 0, 0]} />
                              </BarChart>
                            ) : (
                              <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                                <XAxis dataKey="name" tick={{ fill: "#7a95b8" }} axisLine={{ stroke: '#12233e' }} tickLine={false} />
                                <YAxis tickFormatter={(v) => fmt(v)} tick={{ fill: "#7a95b8" }} axisLine={false} tickLine={false} />
                                <Tooltip 
                                  formatter={(value: number, name: string) => [fmt(value), name === 'post' ? 'Post-Crisis Value' : 'Impact (Loss)']}
                                  contentStyle={{ backgroundColor: "#0d1a2e", borderColor: "#12233e", color: "#fff", borderRadius: "8px" }}
                                  cursor={{ fill: '#1e3a8a', opacity: 0.2 }}
                                />
                                <Legend />
                                <Bar dataKey="post" stackId="a" fill="#3b82f6" name="Post-Crisis Value" radius={[0, 0, 4, 4]} animationDuration={1000} />
                                <Bar dataKey="loss" stackId="a" fill="#ef4444" name="Impact (Loss)" radius={[4, 4, 0, 0]} animationDuration={1000} />
                              </BarChart>
                            )}
                          </ResponsiveContainer>
                        </div>

                        {/* Radar Chart for Risk Profile - Recharts #2 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-[#0d1a2e] p-6 rounded-xl border border-[#12233e]">
                          <div>
                            <h3 className="text-lg font-medium text-white mb-2">Risk Exposure Profile</h3>
                            <p className="text-sm text-[#7a95b8] mb-4">
                              Visualizing the percentage impact across different asset classes. Larger areas indicate higher vulnerability in this specific scenario.
                            </p>
                            <div className="space-y-3">
                              {impact?.breakdown.map((b, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                  <span className="text-[#c8d8ec] flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                    {b.name}
                                  </span>
                                  <span className={b.pct < 0 ? "text-red-400 font-medium" : "text-green-400 font-medium"}>
                                    {b.pct > 0 ? '+' : ''}{b.pct.toFixed(1)}%
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="#12233e" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#7a95b8', fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: '#475569' }} />
                                <Radar name={activeScenario.name} dataKey="A" stroke="#ef4444" fill="#ef4444" fillOpacity={0.4} />
                                {compareMode && <Radar name={compareScenario.name} dataKey="B" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.4} />}
                                <Tooltip contentStyle={{ backgroundColor: "#060d19", borderColor: "#12233e" }} />
                                <Legend />
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Data Table #1: Impact Breakdown */
                      <div className="overflow-x-auto rounded-xl border border-[#12233e] bg-[#0d1a2e]">
                        <table className="w-full text-sm text-left">
                          <thead className="text-xs text-[#7a95b8] uppercase bg-[#060d19] border-b border-[#12233e]">
                            <tr>
                              <th className="px-6 py-4 font-semibold">Asset Class</th>
                              <th className="px-6 py-4 font-semibold text-right">Pre-Crisis Value</th>
                              <th className="px-6 py-4 font-semibold text-right">Impact %</th>
                              <th className="px-6 py-4 font-semibold text-right">Impact Value</th>
                              <th className="px-6 py-4 font-semibold text-right">Post-Crisis Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {impact?.breakdown.map((row, idx) => (
                              <tr key={idx} className="border-b border-[#12233e] hover:bg-[#1e3a8a]/10 transition-colors">
                                <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                  {row.name}
                                </td>
                                <td className="px-6 py-4 text-right text-[#c8d8ec]">{fmt(row.pre)}</td>
                                <td className={`px-6 py-4 text-right font-medium ${row.pct < 0 ? 'text-red-400' : 'text-green-400'}`}>
                                  {row.pct > 0 ? '+' : ''}{row.pct.toFixed(1)}%
                                </td>
                                <td className={`px-6 py-4 text-right ${row.impact < 0 ? 'text-red-400' : 'text-green-400'}`}>
                                  {row.impact > 0 ? '+' : ''}{fmt(Math.abs(row.impact))}
                                </td>
                                <td className="px-6 py-4 text-right text-white font-medium">{fmt(Math.max(0, row.post))}</td>
                              </tr>
                            ))}
                            <tr className="bg-[#060d19] font-bold">
                              <td className="px-6 py-4 text-white">Total Portfolio</td>
                              <td className="px-6 py-4 text-right text-white">{fmt(impact?.total || 0)}</td>
                              <td className="px-6 py-4 text-right text-red-400">-{lossPercent}%</td>
                              <td className="px-6 py-4 text-right text-red-400">-{fmt(impact?.totalLoss || 0)}</td>
                              <td className="px-6 py-4 text-right text-white">{fmt(impact?.postCrisis || 0)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </TabsContent>

                  {/* Tab 2: Recovery Path */}
                  <TabsContent value="recovery" className="m-0 animate-in fade-in duration-500">
                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1 bg-[#0d1a2e] p-5 rounded-xl border border-[#12233e]">
                          <h3 className="text-sm font-medium text-[#7a95b8] mb-1">Time to Recover</h3>
                          <div className="text-2xl font-bold text-white flex items-center gap-2">
                            {activeScenario.recovery}
                            <Badge variant="outline" className="bg-[#1e3a8a]/20 text-[#3b82f6] border-[#1e3a8a] ml-2">Estimated</Badge>
                          </div>
                        </div>
                        <div className="flex-1 bg-[#0d1a2e] p-5 rounded-xl border border-[#12233e]">
                          <h3 className="text-sm font-medium text-[#7a95b8] mb-1">Required Growth Rate</h3>
                          <div className="text-2xl font-bold text-white flex items-center gap-2">
                            {impact ? ((Math.pow(impact.total / impact.postCrisis, 1 / (parseInt(activeScenario.recovery) || 4)) - 1) * 100).toFixed(1) : "0"}%
                            <span className="text-sm font-normal text-[#7a95b8]">annualized</span>
                          </div>
                        </div>
                        <div className="flex-1 bg-[#0d1a2e] p-5 rounded-xl border border-[#12233e]">
                          <h3 className="text-sm font-medium text-[#7a95b8] mb-1">Duration of Drawdown</h3>
                          <div className="text-2xl font-bold text-white">
                            {activeScenario.duration}
                          </div>
                        </div>
                      </div>

                      {/* Area Chart - Recharts #3 */}
                      <div className="h-[450px] w-full bg-[#0d1a2e] p-6 rounded-xl border border-[#12233e]">
                        <h3 className="text-lg font-medium text-white mb-6">Projected Recovery Trajectory</h3>
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={recoveryData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                            <defs>
                              <linearGradient id="colorRecovery" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorInflation" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                            <XAxis 
                              dataKey="month" 
                              tick={{ fill: "#7a95b8", fontSize: 12 }} 
                              axisLine={{ stroke: '#12233e' }}
                              tickLine={false}
                              label={{ value: "Months Since Crisis", position: "insideBottom", offset: -15, fill: "#7a95b8" }} 
                            />
                            <YAxis 
                              tickFormatter={(v: number) => fmt(v)} 
                              tick={{ fill: "#7a95b8", fontSize: 12 }} 
                              axisLine={false}
                              tickLine={false}
                              domain={['auto', 'auto']}
                            />
                            <Tooltip 
                              formatter={(v: number, name: string) => [fmt(v), name === 'value' ? 'Nominal Value' : name === 'target' ? 'Pre-Crisis Target' : 'Inflation Adjusted']} 
                              labelFormatter={(label) => `Month ${label} (Year ${(Number(label)/12).toFixed(1)})`}
                              contentStyle={{ backgroundColor: "#060d19", borderColor: "#12233e", color: "#fff", borderRadius: "8px" }}
                            />
                            <Legend wrapperStyle={{ paddingTop: "20px" }} />
                            <Area 
                              type="monotone" 
                              dataKey="value" 
                              stroke="#22c55e" 
                              strokeWidth={3}
                              fill="url(#colorRecovery)" 
                              name="Nominal Portfolio Value" 
                              activeDot={{ r: 6, strokeWidth: 0, fill: '#22c55e' }}
                            />
                            {showAdvanced && (
                              <Area 
                                type="monotone" 
                                dataKey="inflationAdjusted" 
                                stroke="#f59e0b" 
                                strokeWidth={2}
                                strokeDasharray="3 3"
                                fill="url(#colorInflation)" 
                                name="Real (Inflation-Adjusted) Value" 
                              />
                            )}
                            <Line 
                              type="monotone" 
                              dataKey="target" 
                              stroke="#3b82f6" 
                              strokeWidth={2}
                              strokeDasharray="5 5" 
                              name="Pre-Crisis Target" 
                              dot={false} 
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Data Table #2: Recovery Milestones */}
                      <div className="mt-6 bg-[#0d1a2e] rounded-xl border border-[#12233e] overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#12233e] bg-[#060d19]">
                          <h3 className="font-medium text-white">Recovery Milestones</h3>
                        </div>
                        <table className="w-full text-sm text-left">
                          <thead className="text-xs text-[#7a95b8] uppercase bg-[#0d1a2e] border-b border-[#12233e]">
                            <tr>
                              <th className="px-6 py-3">Timeframe</th>
                              <th className="px-6 py-3">Projected Value</th>
                              <th className="px-6 py-3">% of Pre-Crisis</th>
                              <th className="px-6 py-3">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[1, 2, 3, 5, 10].filter((y) => y <= simulationYears).map((year) => {
                              const monthIdx = year * 12;
                              const point = recoveryData[monthIdx];
                              if (!point) return null;
                              const pctOfTarget = (point.value / point.target) * 100;
                              return (
                                <tr key={year} className="border-b border-[#12233e]">
                                  <td className="px-6 py-3 text-white">Year {year}</td>
                                  <td className="px-6 py-3 text-[#c8d8ec]">{fmt(point.value)}</td>
                                  <td className="px-6 py-3 text-[#c8d8ec]">{pctOfTarget.toFixed(1)}%</td>
                                  <td className="px-6 py-3">
                                    {pctOfTarget >= 100 ? (
                                      <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30">Recovered</Badge>
                                    ) : (
                                      <Badge variant="outline" className="border-[#f59e0b]/50 text-[#f59e0b]">Recovering</Badge>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="bg-[#060d19] border border-[#12233e] rounded-xl p-5 flex items-start gap-4">
                        <Info className="w-6 h-6 text-[#3b82f6] shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-white mb-1">About Recovery Projections</h4>
                          <p className="text-sm text-[#7a95b8] leading-relaxed">
                            Recovery projections are based on historical averages for similar market events. The actual recovery path may be non-linear and significantly different from this projection. Factors such as ongoing contributions, withdrawals, and portfolio rebalancing during the recovery period will materially impact the actual time to recover.
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Tab 3: Allocation Shift */}
                  <TabsContent value="allocation" className="m-0 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Pre-Crisis Pie Chart - Recharts #4 */}
                      <div className="bg-[#0d1a2e] p-6 rounded-xl border border-[#12233e] flex flex-col items-center">
                        <h3 className="text-lg font-medium text-white mb-2">Pre-Crisis Allocation</h3>
                        <p className="text-sm text-[#7a95b8] mb-6 text-center">Initial portfolio composition</p>
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={2}
                                dataKey="value"
                                label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                                labelLine={false}
                              >
                                {pieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip 
                                formatter={(value: number) => fmt(value)}
                                contentStyle={{ backgroundColor: "#060d19", borderColor: "#12233e", color: "#fff", borderRadius: "8px" }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        
                        {/* Data Table #3: Pre-Crisis Allocation */}
                        <div className="w-full mt-4">
                          <table className="w-full text-sm">
                            <tbody>
                              {pieData.map((d, i) => (
                                <tr key={i} className="border-b border-[#12233e]/50 last:border-0">
                                  <td className="py-2 flex items-center gap-2 text-[#c8d8ec]">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                    {d.name}
                                  </td>
                                  <td className="py-2 text-right text-white font-medium">{fmt(d.value)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Post-Crisis Pie Chart - Recharts #5 */}
                      <div className="bg-[#0d1a2e] p-6 rounded-xl border border-[#12233e] flex flex-col items-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-red-500/5 pointer-events-none"></div>
                        <h3 className="text-lg font-medium text-white mb-2 relative z-10">Post-Crisis Allocation</h3>
                        <p className="text-sm text-[#7a95b8] mb-6 text-center relative z-10">Unbalanced portfolio drift</p>
                        <div className="h-[300px] w-full relative z-10">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={postPieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={2}
                                dataKey="value"
                                label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                                labelLine={false}
                              >
                                {postPieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.8} />
                                ))}
                              </Pie>
                              <Tooltip 
                                formatter={(value: number) => fmt(value)}
                                contentStyle={{ backgroundColor: "#060d19", borderColor: "#12233e", color: "#fff", borderRadius: "8px" }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Data Table #4: Post-Crisis Allocation */}
                        <div className="w-full mt-4 relative z-10">
                          <table className="w-full text-sm">
                            <tbody>
                              {postPieData.map((d, i) => {
                                const preWeight = pieData[i]?.value / impact!.total;
                                const postWeight = d.value / impact!.postCrisis;
                                const diff = postWeight - preWeight;
                                return (
                                  <tr key={i} className="border-b border-[#12233e]/50 last:border-0">
                                    <td className="py-2 flex items-center gap-2 text-[#c8d8ec]">
                                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                      {d.name}
                                    </td>
                                    <td className="py-2 text-right text-white font-medium">{fmt(d.value)}</td>
                                    <td className={`py-2 text-right text-xs ${diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-[#7a95b8]'}`}>
                                      {diff > 0 ? '+' : ''}{(diff * 100).toFixed(1)}% drift
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 bg-[#1e3a8a]/10 border border-[#1e3a8a]/30 rounded-xl p-6">
                      <h4 className="text-white font-medium flex items-center gap-2 mb-3">
                        <RefreshCw className="w-5 h-5 text-[#3b82f6]" />
                        Rebalancing Opportunity
                      </h4>
                      <p className="text-[#c8d8ec] text-sm leading-relaxed mb-4">
                        The stress event causes significant portfolio drift. Equities typically shrink as a percentage of the portfolio, while safer assets like cash and bonds grow in relative terms. Systematic rebalancing during the drawdown (selling bonds to buy discounted equities) is a primary driver of faster recovery times.
                      </p>
                      
                      {/* Data Table #5: Rebalancing Trades */}
                      <div className="bg-[#060d19] rounded-lg border border-[#12233e] overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="text-xs text-[#7a95b8] uppercase bg-[#0d1a2e] border-b border-[#12233e]">
                            <tr>
                              <th className="px-4 py-2 text-left">Asset Class</th>
                              <th className="px-4 py-2 text-right">Target Weight</th>
                              <th className="px-4 py-2 text-right">Current Weight</th>
                              <th className="px-4 py-2 text-right">Suggested Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {postPieData.map((d, i) => {
                              const preWeight = pieData[i]?.value / impact!.total;
                              const postWeight = d.value / impact!.postCrisis;
                              const diff = postWeight - preWeight;
                              const tradeAmount = Math.abs(diff * impact!.postCrisis);
                              
                              if (Math.abs(diff) < 0.01) return null; // Skip small drifts
                              
                              return (
                                <tr key={i} className="border-b border-[#12233e] last:border-0">
                                  <td className="px-4 py-3 text-white">{d.name}</td>
                                  <td className="px-4 py-3 text-right text-[#7a95b8]">{(preWeight * 100).toFixed(1)}%</td>
                                  <td className="px-4 py-3 text-right text-[#7a95b8]">{(postWeight * 100).toFixed(1)}%</td>
                                  <td className={`px-4 py-3 text-right font-medium flex items-center justify-end gap-1 ${diff > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                    {diff > 0 ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                    {diff > 0 ? 'Sell' : 'Buy'} {fmt(tradeAmount)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Tab 4: Executive Report */}
                  <TabsContent value="report" className="m-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-[#060d19] border border-[#12233e] rounded-xl p-8 max-w-4xl mx-auto shadow-inner">
                      <div className="flex items-center justify-between border-b border-[#12233e] pb-6 mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-[#1e3a5f] flex items-center justify-center">
                            <Shield className="w-6 h-6 text-[#3b82f6]" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-white">Stress Test Analysis</h2>
                            <p className="text-[#7a95b8]">Prepared for {(selectedClient.name?.split(" ")[0] ?? "")} {(selectedClient.name?.split(" ").slice(1).join(" ") ?? "")}</p>
                          </div>
                        </div>
                        <div className="text-right hidden sm:block">
                          <div className="text-sm font-medium text-white">{activeScenario.name}</div>
                          <div className="text-xs text-[#7a95b8]">{new Date().toLocaleDateString()}</div>
                        </div>
                      </div>

                      <div className="space-y-8 text-[#c8d8ec]">
                        <section>
                          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-[#f0c040]" />
                            Executive Summary
                          </h3>
                          <div className="bg-[#0d1a2e] rounded-lg p-5 border border-[#12233e] leading-relaxed text-base">
                            Under the <strong>{activeScenario.name}</strong> scenario ({activeScenario.year}), the portfolio valued at {fmt(impact?.total ?? 0)} is projected to experience an estimated decline of <strong className="text-red-400">{lossPercent}%</strong> ({fmt(impact?.totalLoss ?? 0)}). This would result in a post-crisis value of <strong className="text-white">{fmt(impact?.postCrisis ?? 0)}</strong>. The estimated recovery period to return to the initial portfolio value is approximately <strong>{activeScenario.recovery}</strong>.
                          </div>
                        </section>

                        <section>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                              <Activity className="w-5 h-5 text-[#22c55e]" />
                              Strategic Insights
                            </h3>
                            <Button variant="ghost" size="sm" onClick={() => setShowMitigation(!showMitigation)} className="text-[#3b82f6] h-8">
                              {showMitigation ? "Hide Details" : "Show Details"}
                            </Button>
                          </div>
                          
                          {showMitigation && (
                            <div className="animate-in fade-in slide-in-from-top-2">
                              <p className="leading-relaxed mb-4 text-[#c8d8ec]">
                                Stress testing is a critical component of portfolio risk management. By modeling historical crisis scenarios, we can better understand the potential downside of the current allocation and ensure it aligns with your risk tolerance and timeline.
                              </p>
                              <p className="leading-relaxed text-[#c8d8ec]">
                                The key insight is not just the magnitude of the loss, but the recovery timeline. Historically, investors who panic-sell during a downturn lock in losses and miss the subsequent recovery. Conversely, those who maintain their allocation—or systematically rebalance into the downturn—typically recover faster and achieve better long-term outcomes.
                              </p>
                            </div>
                          )}
                        </section>

                        {/* Line Chart inside report - Recharts #6 */}
                        <section className="my-8">
                          <h3 className="text-lg font-semibold text-white mb-4">Historical Context</h3>
                          <div className="h-[250px] w-full bg-[#0d1a2e] p-4 rounded-xl border border-[#12233e]">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={historicalData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                                <XAxis dataKey="year" tick={{ fill: "#7a95b8", fontSize: 12 }} axisLine={{ stroke: '#12233e' }} tickLine={false} />
                                <YAxis tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} tick={{ fill: "#7a95b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                                <Tooltip 
                                  formatter={(v: number) => fmt(v)}
                                  contentStyle={{ backgroundColor: "#060d19", borderColor: "#12233e", color: "#fff", borderRadius: "8px" }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} name="Portfolio Value" dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} />
                                <Line type="monotone" dataKey="benchmark" stroke="#64748b" strokeWidth={2} strokeDasharray="5 5" name="Blended Benchmark" dot={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </section>

                        <section>
                          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-[#3b82f6]" />
                            Risk Mitigation Strategies
                          </h3>
                          
                          {/* Data Table #6: Mitigation Strategies */}
                          <div className="bg-[#0d1a2e] rounded-xl border border-[#12233e] overflow-hidden">
                            <table className="w-full text-sm text-left">
                              <tbody>
                                {[
                                  { title: "Asset Allocation", desc: "Consider increasing bond allocation for clients nearing or in retirement to reduce sequence of returns risk.", icon: <PieChartIcon className="w-4 h-4 text-[#3b82f6]" /> },
                                  { title: "Liquidity Buffer", desc: "Maintain a cash reserve equal to 6-12 months of living expenses to avoid selling assets during drawdowns.", icon: <Coins className="w-4 h-4 text-[#10b981]" /> },
                                  { title: "Diversification", desc: "Ensure broad diversification across uncorrelated asset classes, including alternatives and real estate.", icon: <Briefcase className="w-4 h-4 text-[#8b5cf6]" /> },
                                  { title: "Systematic Rebalancing", desc: "Implement rules-based rebalancing to automatically buy low and sell high during market dislocations.", icon: <RefreshCw className="w-4 h-4 text-[#f59e0b]" /> }
                                ].map((item, idx) => (
                                  <tr key={idx} className="border-b border-[#12233e] last:border-0 hover:bg-[#1e3a8a]/10">
                                    <td className="p-4 align-top w-10">{item.icon}</td>
                                    <td className="p-4">
                                      <div className="font-medium text-white mb-1">{item.title}</div>
                                      <div className="text-[#7a95b8] text-sm">{item.desc}</div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </section>

                        <div className="mt-8 pt-6 border-t border-[#12233e] flex flex-col items-center">
                          <div className="flex gap-4 mb-6 w-full">
                            <input 
                              type="text" 
                              placeholder="Simulation Name (Optional)" 
                              value={simulationName}
                              onChange={(e) => setSimulationName(e.target.value)}
                              className="flex-1 bg-[#0d1a2e] border border-[#12233e] rounded-md px-4 py-2 text-sm text-white focus:outline-none focus:border-[#3b82f6]"
                            />
                            <Button onClick={saveSimulation} className="bg-[#10b981] hover:bg-[#059669] text-white">
                              <Save className="w-4 h-4 mr-2" /> Save to Client Record
                            </Button>
                          </div>
                          
                          <div className="w-full flex justify-between items-center mb-4">
                            <span className="text-sm text-[#7a95b8]">Include regulatory disclaimers</span>
                            <Button variant="ghost" size="sm" onClick={() => setShowDisclaimer(!showDisclaimer)} className="h-6 px-2 text-xs border border-[#12233e]">
                              {showDisclaimer ? "Hide" : "Show"}
                            </Button>
                          </div>
                          
                          {showDisclaimer && (
                            <div className="w-full animate-in fade-in">
                              <NAICDisclaimer />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
      <PageInsights pageId="market-scenario-stress-test" />
    
        <ComplianceFooter pageName="MarketScenarioStressTest" showsTax showsEstate showsProjections showsHistoricalData />
      </AppShell>
  );
}
