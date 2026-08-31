// @ts-nocheck
import { useState, useMemo, useEffect, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import { NumberInput } from "@/components/NumberInput";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Settings,
  BarChart3,
  ArrowRight,
  Target,
  Download,
  Search,
  Filter,
  Loader2,
  PieChartIcon,
  Info,
  LineChart as LineChartIcon,
  SlidersHorizontal,
  FileText,
  ShieldAlert,
  DollarSign,
  Briefcase,
  Zap,
  History,
  Bell,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area,
  ComposedChart, Scatter, ScatterChart, ZAxis
} from "recharts";
import { useClientData } from "@/contexts/ClientDataContext";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

interface AssetClass {
  id: string;
  name: string;
  targetPct: number;
  currentPct: number;
  currentValue: number;
  drift: number;
  color: string;
  category: string;
  riskScore: number;
  liquidity: string;
  yield: number;
  expenseRatio: number;
  ytdReturn: number;
  volatility: number;
  sharpeRatio: number;
}

const DEFAULT_PORTFOLIO: AssetClass[] = [
  { id: "us-large", name: "US Large Cap Equity", targetPct: 30, currentPct: 34.2, currentValue: 342000, drift: 4.2, color: "#3b82f6", category: "Equity", riskScore: 7, liquidity: "High", yield: 1.5, expenseRatio: 0.03, ytdReturn: 12.4, volatility: 15.2, sharpeRatio: 0.8 },
  { id: "us-small", name: "US Small Cap Equity", targetPct: 10, currentPct: 11.8, currentValue: 118000, drift: 1.8, color: "#6366f1", category: "Equity", riskScore: 8, liquidity: "High", yield: 1.2, expenseRatio: 0.05, ytdReturn: 8.7, volatility: 20.1, sharpeRatio: 0.6 },
  { id: "intl-eq", name: "International Equity", targetPct: 15, currentPct: 12.1, currentValue: 121000, drift: -2.9, color: "#06b6d4", category: "Equity", riskScore: 7, liquidity: "High", yield: 2.8, expenseRatio: 0.08, ytdReturn: 5.2, volatility: 16.5, sharpeRatio: 0.5 },
  { id: "em-eq", name: "Emerging Markets", targetPct: 5, currentPct: 4.2, currentValue: 42000, drift: -0.8, color: "#14b8a6", category: "Equity", riskScore: 9, liquidity: "Medium", yield: 3.1, expenseRatio: 0.12, ytdReturn: 2.1, volatility: 22.4, sharpeRatio: 0.3 },
  { id: "us-agg", name: "US Aggregate Bonds", targetPct: 20, currentPct: 18.5, currentValue: 185000, drift: -1.5, color: "#10b981", category: "Fixed Income", riskScore: 3, liquidity: "High", yield: 4.5, expenseRatio: 0.04, ytdReturn: 1.2, volatility: 5.4, sharpeRatio: 0.9 },
  { id: "tips", name: "TIPS", targetPct: 5, currentPct: 4.8, currentValue: 48000, drift: -0.2, color: "#22c55e", category: "Fixed Income", riskScore: 2, liquidity: "High", yield: 2.1, expenseRatio: 0.05, ytdReturn: 0.8, volatility: 4.2, sharpeRatio: 0.7 },
  { id: "reit", name: "Real Estate (REITs)", targetPct: 10, currentPct: 9.4, currentValue: 94000, drift: -0.6, color: "#f59e0b", category: "Real Assets", riskScore: 6, liquidity: "Medium", yield: 4.2, expenseRatio: 0.10, ytdReturn: -2.4, volatility: 18.5, sharpeRatio: 0.4 },
  { id: "cash", name: "Cash & Equivalents", targetPct: 5, currentPct: 5.0, currentValue: 50000, drift: 0.0, color: "#94a3b8", category: "Cash", riskScore: 1, liquidity: "Very High", yield: 5.1, expenseRatio: 0.00, ytdReturn: 2.5, volatility: 0.5, sharpeRatio: 1.2 },
];

const HISTORICAL_DRIFT_DATA = Array.from({ length: 12 }, (_, i) => ({
  month: `Month ${i + 1}`,
  drift: Math.random() * 5 + 1,
  rebalanced: i === 3 || i === 8,
  portfolioValue: 900000 + (i * 10000) + (Math.random() * 20000 - 10000),
}));

const TAX_LOTS = [
  { id: "lot1", asset: "US Large Cap Equity", dateAcquired: "2020-05-12", shares: 1500, costBasis: 150000, currentValue: 280000, unrealizedGain: 130000, term: "Long" },
  { id: "lot2", asset: "US Large Cap Equity", dateAcquired: "2023-11-05", shares: 300, costBasis: 55000, currentValue: 62000, unrealizedGain: 7000, term: "Short" },
  { id: "lot3", asset: "US Small Cap Equity", dateAcquired: "2021-02-18", shares: 2200, costBasis: 80000, currentValue: 118000, unrealizedGain: 38000, term: "Long" },
  { id: "lot4", asset: "International Equity", dateAcquired: "2022-08-30", shares: 1800, costBasis: 135000, currentValue: 121000, unrealizedGain: -14000, term: "Long" },
  { id: "lot5", asset: "Emerging Markets", dateAcquired: "2021-11-12", shares: 900, costBasis: 50000, currentValue: 42000, unrealizedGain: -8000, term: "Long" },
];

const REBALANCE_HISTORY = [
  { id: "reb1", date: "2023-12-15", trigger: "Calendar", trades: 12, turnover: 4.5, taxImpact: 1250 },
  { id: "reb2", date: "2023-06-20", trigger: "Drift Threshold", trades: 8, turnover: 3.2, taxImpact: 850 },
  { id: "reb3", date: "2022-12-10", trigger: "Calendar", trades: 15, turnover: 6.1, taxImpact: 2100 },
  { id: "reb4", date: "2022-03-05", trigger: "Cash Flow", trades: 5, turnover: 1.8, taxImpact: 0 },
];

export default function PortfolioDriftMonitor() {
  const { clientData } = useClientData();
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState<AssetClass[]>(DEFAULT_PORTFOLIO);
  const [driftThreshold, setDriftThreshold] = useState(3);
  const [totalValue, setTotalValue] = useState(1000000);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "trades" | "history" | "tax" | "analytics" | "settings">("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  const [taxMethodology, setTaxMethodology] = useState<"HIFO" | "FIFO" | "LIFO" | "MinTax">("MinTax");
  const [rebalanceMethod, setRebalanceMethod] = useState<"Full" | "Partial" | "TaxAware">("TaxAware");
  const [isSimulating, setIsSimulating] = useState(false);
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);
  const [cashBuffer, setCashBuffer] = useState(2);
  const [tradeMinAmount, setTradeMinAmount] = useState(500);
  const [capitalGainsBudget, setCapitalGainsBudget] = useState(5000);

  const { data: clientApiData } = trpc.clients.list.useQuery();
  const { data: strategyData } = trpc.strategy.list.useQuery();
  const { data: marketData } = trpc.marketData.getLatest.useQuery();
  const { data: riskProfile } = trpc.riskProfile.get.useQuery({ id: "default" });
  const { data: complianceData } = trpc.compliance.check.useQuery();
  const { mutateAsync: logActivity } = trpc.activity.log.useMutation();
  const { mutateAsync: saveStrategy } = trpc.savedStrategies.save.useMutation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      logActivity({ action: "Viewed Portfolio Drift Monitor", details: "Initial load" }).catch(console.error);
    }, 800);
    return () => clearTimeout(timer);
  }, [logActivity]);

  const categories = useMemo(() => ["All", ...Array.from(new Set(portfolio.map((a) => a.category)))], [portfolio]);

  const filteredPortfolio = useMemo(() => {
    return portfolio.filter((a) => {
      const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "All" || a.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [portfolio, searchQuery, selectedCategory]);

  const driftAlerts = useMemo(() => portfolio.filter((a) => Math.abs(a.drift) >= driftThreshold), [portfolio, driftThreshold]);
  const maxDrift = useMemo(() => Math.max(...portfolio.map((a) => Math.abs(a.drift))), [portfolio]);
  const avgDrift = useMemo(() => portfolio.reduce((s, a) => s + Math.abs(a.drift), 0) / portfolio.length, [portfolio]);
  const needsRebalance = driftAlerts.length > 0;

  const rebalanceTrades = useMemo(() => {
    return portfolio.map((a) => {
      let targetValue = totalValue * (a.targetPct / 100);
      
      if (a.category === "Cash") {
        targetValue = Math.max(targetValue, totalValue * (cashBuffer / 100));
      }
      
      const tradeAmount = targetValue - a.currentValue;
      return { ...a, targetValue, tradeAmount };
    }).filter((a) => Math.abs(a.tradeAmount) > tradeMinAmount);
  }, [portfolio, totalValue, cashBuffer, tradeMinAmount]);

  const taxImpact = useMemo(() => {
    const sells = rebalanceTrades.filter((t) => t.tradeAmount < 0);
    const totalSells = sells.reduce((s, t) => s + Math.abs(t.tradeAmount), 0);
    
    let taxMultiplier = 0.15; // Default 15%
    if (taxMethodology === "HIFO") taxMultiplier = 0.10;
    if (taxMethodology === "LIFO") taxMultiplier = 0.12;
    if (taxMethodology === "FIFO") taxMultiplier = 0.18;
    if (taxMethodology === "MinTax") taxMultiplier = 0.08;
    
    const estimatedGains = totalSells * taxMultiplier;
    const estimatedTax = estimatedGains * 0.15; // 15% LTCG rate
    
    return { totalSells, estimatedGains, estimatedTax };
  }, [rebalanceTrades, taxMethodology]);

  const simulateDrift = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setPortfolio(prev => prev.map((a) => {
        const randomDrift = (Math.random() - 0.5) * (a.volatility / 2);
        const newPct = Math.max(0, a.targetPct + randomDrift);
        return { 
          ...a, 
          currentPct: Number(newPct.toFixed(1)), 
          drift: Number((newPct - a.targetPct).toFixed(1)), 
          currentValue: Math.round(totalValue * newPct / 100) 
        };
      }));
      setIsSimulating(false);
      toast.info("Portfolio drift simulated based on asset volatility");
      logActivity({ action: "Simulated Portfolio Drift", details: "Random market movements applied" }).catch(console.error);
    }, 600);
  };

  const resetToTarget = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setPortfolio(prev => prev.map((a) => ({ 
        ...a, 
        currentPct: a.targetPct, 
        drift: 0, 
        currentValue: Math.round(totalValue * a.targetPct / 100) 
      })));
      setIsSimulating(false);
      toast.success(`Portfolio rebalanced using ${rebalanceMethod} methodology`);
      logActivity({ action: "Rebalanced Portfolio", details: `Method: ${rebalanceMethod}` }).catch(console.error);
    }, 800);
  };

  const handleExportCSV = () => {
    const headers = ["Asset Class", "Category", "Current Value", "Target Value", "Trade Amount", "Action", "Est. Tax Impact"];
    const rows = rebalanceTrades.map((t) => [
      t.name,
      t.category,
      t.currentValue.toString(),
      t.targetValue.toString(),
      t.tradeAmount.toString(),
      t.tradeAmount > 0 ? "Buy" : "Sell",
      t.tradeAmount < 0 ? (Math.abs(t.tradeAmount) * 0.15 * 0.15).toFixed(2) : "0"
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `rebalance_trades_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Trades exported to CSV");
  };

  const saveCurrentStrategy = async () => {
    try {
      await saveStrategy({
        name: `Drift Snapshot ${new Date().toLocaleDateString()}`,
        description: `Max Drift: ${maxDrift.toFixed(1)}%, Est Tax: $${taxImpact.estimatedTax.toFixed(0)}`,
        data: JSON.stringify({ portfolio, settings: { driftThreshold, taxMethodology, rebalanceMethod } })
      });
      toast.success("Strategy snapshot saved successfully");
    } catch (error) {
      toast.error("Failed to save strategy snapshot");
    }
  };

  const pieData = filteredPortfolio.map((a) => ({
    name: a.name,
    value: a.currentValue,
    color: a.color
  }));

  const barData = filteredPortfolio.map((a) => ({
    name: a.name,
    Current: a.currentPct,
    Target: a.targetPct,
    Drift: a.drift,
    color: a.color
  }));

  const scatterData = filteredPortfolio.map((a) => ({
    name: a.name,
    risk: a.volatility,
    return: a.ytdReturn,
    size: a.currentValue / 1000,
    color: a.color
  }));

  const categoryData = useMemo(() => {
    const catMap = new Map<string, { name: string, current: number, target: number }>();
    portfolio.forEach((a) => {
      if (!catMap.has(a.category)) {
        catMap.set(a.category, { name: a.category, current: 0, target: 0 });
      }
      const cat = catMap.get(a.category)!;
      cat.current += a.currentPct;
      cat.target += a.targetPct;
    });
    return Array.from(catMap.values()).map((c) => ({
      ...c,
      current: Number(c.current.toFixed(1)),
      target: Number(c.target.toFixed(1)),
      drift: Number((c.current - c.target).toFixed(1))
    }));
  }, [portfolio]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0d1a2e] border border-[#12233e] p-3 rounded-lg shadow-xl z-50">
          <p className="text-white font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm flex items-center gap-2" style={{ color: entry.color || entry.payload.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.payload.color }}></span>
              {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}{entry.name.includes('Value') ? '' : '%'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="p-4 bg-[#12233e] rounded-full mb-4">
        <Info className="h-8 w-8 text-[#7a95b8]" />
      </div>
      <h3 className="text-xl font-medium text-white mb-2">No Data Available</h3>
      <p className="text-[#7a95b8] max-w-md">There is no data matching your current filters. Try adjusting your search or category selection.</p>
    </div>
  );

  const renderMetricCard = (title: string, value: string | number, icon: React.ReactNode, trend?: { value: number, label: string }, colorClass: string = "text-white") => (
    <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5 hover:border-[#3b82f6]/30 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <p className="rc-stat-label text-sm text-[#7a95b8] font-medium">{title}</p>
        <div className="p-2 rounded-lg bg-[#060d19]">
          {icon}
        </div>
      </div>
      <p className={`rc-stat-value text-2xl font-bold ${colorClass}`}>{value}</p>
      {trend && (
        <div className="flex items-center gap-1 mt-2">
          {trend.value > 0 ? (
            <TrendingUp className="h-3 w-3 text-[#22c55e]" />
          ) : trend.value < 0 ? (
            <TrendingDown className="h-3 w-3 text-[#ef4444]" />
          ) : (
            <Activity className="h-3 w-3 text-[#7a95b8]" />
          )}
          <span className={`text-xs font-medium ${trend.value > 0 ? 'text-[#22c55e]' : trend.value < 0 ? 'text-[#ef4444]' : 'text-[#7a95b8]'}`}>
            {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-[#7a95b8] ml-1">{trend.label}</span>
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 text-[#3b82f6] animate-spin mb-4" />
          <h2 className="text-xl font-medium text-white mb-2">Loading Portfolio Data</h2>
          <p className="text-[#7a95b8]">Analyzing drift and calculating tax impacts...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-[1600px] mx-auto pb-12 px-4 sm:px-6 lg:px-8">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="PortfolioDriftMonitor" />

        <ExecutiveSummary
          pageTitle="Portfolio Drift Monitor"
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
        <GoalsAccelerator pageName="Portfolio Drift Monitor" pageContext="Portfolio Drift Monitor — market analysis modeling with projections and scenario analysis" />
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
        {/* Header Section */}
        <div className="rc-page-header flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-[#0d1a2e] p-6 rounded-2xl border border-[#12233e] shadow-lg">
          <div className="flex items-center gap-5">
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] shadow-inner">
              <Activity className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="rc-page-title text-3xl font-bold text-white tracking-tight">Portfolio Drift Monitor</h1>
              <p className="rc-page-subtitle text-[#7a95b8] mt-1 text-sm sm:text-base">
                Track allocation drift, analyze tax impact, and execute automated rebalancing
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <ExportToSlides
              toolName="Portfolio Drift Monitor"
              getSections={() => [
                {
                  title: "Portfolio Summary",
                  items: [
                    { label: "Total Value", value: `$${(totalValue / 1000000).toFixed(2)}M` },
                    { label: "Drift Alerts", value: driftAlerts.length.toString() },
                    { label: "Max Drift", value: `${maxDrift.toFixed(1)}%` },
                    { label: "Avg Drift", value: `${avgDrift.toFixed(1)}%` },
                    { label: "Drift Threshold", value: `${driftThreshold}%` }
                  ]
                },
                {
                  title: "Current Allocation vs Target",
                  items: portfolio.map((a) => ({
                    label: a.name,
                    value: `Target: ${a.targetPct}% | Current: ${a.currentPct}% | Drift: ${a.drift > 0 ? "+" : ""}${a.drift.toFixed(1)}%`
                  }))
                },
                ...(needsRebalance ? [{
                  title: "Suggested Rebalance Trades",
                  items: rebalanceTrades.map((t) => ({
                    label: t.name,
                    value: `${t.tradeAmount > 0 ? "Buy" : "Sell"} $${(Math.abs(t.tradeAmount) / 1000).toFixed(1)}K`
                  }))
                }, {
                  title: "Estimated Tax Impact",
                  items: [
                    { label: "Total Sells", value: `$${(taxImpact.totalSells / 1000).toFixed(1)}K` },
                    { label: "Est. Realized Gains", value: `$${(taxImpact.estimatedGains / 1000).toFixed(1)}K` },
                    { label: "Est. Tax", value: `$${(taxImpact.estimatedTax / 1000).toFixed(1)}K` }
                  ]
                }] : [])
              ]}
            />
            
            <button 
              onClick={saveCurrentStrategy}
              className="rc-btn rc-btn-ghost flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#12233e] text-white hover:bg-[#12233e] transition-all shadow-sm"
            >
              <FileText className="h-4 w-4" /> 
              <span className="hidden sm:inline">Save Snapshot</span>
            </button>
            
            <button 
              onClick={simulateDrift} 
              disabled={isSimulating}
              className="rc-btn rc-btn-ghost flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#12233e] text-white hover:bg-[#12233e] transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isSimulating ? 'animate-spin' : ''}`} /> 
              <span className="hidden sm:inline">Simulate Market</span>
            </button>
            
            <button 
              onClick={resetToTarget} 
              disabled={isSimulating || !needsRebalance}
              className={`rc-btn rc-btn-primary flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all shadow-md ${
                needsRebalance 
                  ? 'bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white hover:shadow-lg hover:shadow-[#22c55e]/20' 
                  : 'bg-[#12233e] text-[#7a95b8] cursor-not-allowed'
              }`}
            >
              <Target className="h-4 w-4" /> 
              <span>Execute Rebalance</span>
            </button>
          </div>
        </div>

        {/* Top Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {renderMetricCard(
            "Total Portfolio Value", 
            `$${(totalValue / 1000000).toFixed(2)}M`, 
            <DollarSign className="h-5 w-5 text-[#3b82f6]" />,
            { value: 4.2, label: "YTD Return" },
            "text-white"
          )}
          
          {renderMetricCard(
            "Maximum Drift", 
            `${maxDrift.toFixed(1)}%`, 
            <AlertTriangle className={`h-5 w-5 ${maxDrift >= driftThreshold ? 'text-[#ef4444]' : 'text-[#f59e0b]'}`} />,
            { value: maxDrift - 2.5, label: "vs last month" },
            maxDrift >= driftThreshold ? "text-[#ef4444]" : "text-white"
          )}
          
          {renderMetricCard(
            "Assets Out of Tolerance", 
            driftAlerts.length, 
            <Target className="h-5 w-5 text-[#8b5cf6]" />,
            undefined,
            driftAlerts.length > 0 ? "text-[#f59e0b]" : "text-[#22c55e]"
          )}
          
          {renderMetricCard(
            "Est. Rebalance Tax", 
            `$${(taxImpact.estimatedTax / 1000).toFixed(1)}K`, 
            <FileText className="h-5 w-5 text-[#ec4899]" />,
            { value: -12.5, label: "vs naive rebalance" }
          )}
          
          {renderMetricCard(
            "Portfolio Risk Score", 
            "68/100", 
            <ShieldAlert className="h-5 w-5 text-[#06b6d4]" />,
            { value: 2.1, label: "drifted higher" }
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Sidebar - Controls */}
          <div className="w-full lg:w-64 flex-shrink-0 space-y-4">
            <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5">
              <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-[#3b82f6]" />
                Controls & Filters
              </h3>
              
              <div className="space-y-5">
                <div>
                  <label className="text-xs text-[#7a95b8] uppercase font-semibold tracking-wider mb-2 block">Search Assets</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7a95b8]" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#060d19] border border-[#12233e] rounded-lg py-2 pl-9 pr-3 text-white text-sm focus:outline-none focus:border-[#3b82f6] transition-colors"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-xs text-[#7a95b8] uppercase font-semibold tracking-wider mb-2 block">Category Filter</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-[#060d19] border border-[#12233e] rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-[#3b82f6] transition-colors appearance-none"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div className="pt-4 border-t border-[#12233e]">
                  <label className="text-xs text-[#7a95b8] uppercase font-semibold tracking-wider mb-3 flex justify-between items-center">
                    Drift Threshold
                    <span className="text-[#3b82f6] bg-[#3b82f6]/10 px-2 py-0.5 rounded text-[10px]">{driftThreshold}%</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.5"
                    value={driftThreshold}
                    onChange={(e) => setDriftThreshold(parseFloat(e.target.value))}
                    className="w-full accent-[#3b82f6]"
                  />
                  <div className="flex justify-between text-xs text-[#7a95b8] mt-1">
                    <span>1% (Strict)</span>
                    <span>10% (Loose)</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-[#12233e]">
                  <label className="text-xs text-[#7a95b8] uppercase font-semibold tracking-wider mb-3 block">Tax Methodology</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["MinTax", "HIFO", "FIFO", "LIFO"].map((method) => (
                      <button
                        key={method}
                        onClick={() => setTaxMethodology(method as any)}
                        className={`py-1.5 text-xs rounded-md border transition-colors ${
                          taxMethodology === method 
                            ? 'bg-[#3b82f6]/20 border-[#3b82f6] text-[#3b82f6]' 
                            : 'bg-[#060d19] border-[#12233e] text-[#7a95b8] hover:border-[#7a95b8]/50'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="rc-card bg-gradient-to-b from-[#1e3a8a]/20 to-[#0d1a2e] border border-[#1e3a8a]/30 rounded-2xl p-5">
              <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#f59e0b]" />
                Smart Actions
              </h3>
              <div className="space-y-2">
                <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#12233e] text-sm text-[#cbd5e1] transition-colors flex items-center justify-between group">
                  <span>Generate Proposal</span>
                  <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#3b82f6]" />
                </button>
                <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#12233e] text-sm text-[#cbd5e1] transition-colors flex items-center justify-between group">
                  <span>Send to Client Portal</span>
                  <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#3b82f6]" />
                </button>
                <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#12233e] text-sm text-[#cbd5e1] transition-colors flex items-center justify-between group">
                  <span>Schedule Review Meeting</span>
                  <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#3b82f6]" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 space-y-6 min-w-0">
            {/* Tabs */}
            <div className="flex flex-wrap gap-2 p-1 bg-[#0d1a2e] border border-[#12233e] rounded-xl w-fit">
              {[
                { id: "overview", label: "Overview", icon: <PieChartIcon className="h-4 w-4" /> },
                { id: "trades", label: "Trade List", icon: <ArrowRight className="h-4 w-4" /> },
                { id: "tax", label: "Tax Impact", icon: <FileText className="h-4 w-4" /> },
                { id: "analytics", label: "Analytics", icon: <BarChart3 className="h-4 w-4" /> },
                { id: "history", label: "History", icon: <History className="h-4 w-4" /> },
                { id: "settings", label: "Settings", icon: <Settings className="h-4 w-4" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-[#1e3a8a] text-white shadow-md"
                      : "text-[#7a95b8] hover:text-white hover:bg-[#12233e]"
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content: Overview */}
            {activeTab === "overview" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Allocation Chart */}
                  <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5 flex flex-col h-[400px]">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <PieChartIcon className="h-5 w-5 text-[#3b82f6]" /> Current Allocation
                      </h2>
                      <div className="flex gap-1">
                        <button onClick={() => setViewMode("chart")} className={`p-1.5 rounded ${viewMode === "chart" ? "bg-[#1e3a8a] text-white" : "text-[#7a95b8] hover:bg-[#12233e]"}`}>
                          <PieChartIcon className="h-4 w-4" />
                        </button>
                        <button onClick={() => setViewMode("table")} className={`p-1.5 rounded ${viewMode === "table" ? "bg-[#1e3a8a] text-white" : "text-[#7a95b8] hover:bg-[#12233e]"}`}>
                          <BarChart3 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex-1 min-h-0 relative">
                      {filteredPortfolio.length === 0 ? renderEmptyState() : (
                        viewMode === "chart" ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={120}
                                paddingAngle={2}
                                dataKey="value"
                                stroke="none"
                              >
                                {pieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <RechartsTooltip content={<CustomTooltip />} />
                              <Legend 
                                layout="vertical" 
                                verticalAlign="middle" 
                                align="right"
                                wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#12233e" horizontal={false} />
                              <XAxis type="number" tick={{ fill: '#7a95b8', fontSize: 12 }} />
                              <YAxis dataKey="name" type="category" tick={{ fill: '#7a95b8', fontSize: 12 }} width={100} />
                              <RechartsTooltip content={<CustomTooltip />} />
                              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                              <Bar dataKey="current" name="Current %" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                              <Bar dataKey="target" name="Target %" fill="#10b981" radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        )
                      )}
                      
                      {viewMode === "chart" && filteredPortfolio.length > 0 && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none pr-[120px]">
                          <div className="text-center">
                            <p className="text-xs text-[#7a95b8] font-medium uppercase tracking-wider">Total Value</p>
                            <p className="text-2xl font-bold text-white">${(totalValue / 1000).toFixed(0)}K</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Drift Chart */}
                  <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5 flex flex-col h-[400px]">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Activity className="h-5 w-5 text-[#f59e0b]" /> Asset Class Drift
                      </h2>
                      <div className="text-xs px-2 py-1 bg-[#f59e0b]/10 text-[#f59e0b] rounded-md border border-[#f59e0b]/20 font-medium">
                        Threshold: ±{driftThreshold}%
                      </div>
                    </div>
                    
                    <div className="flex-1 min-h-0">
                      {filteredPortfolio.length === 0 ? renderEmptyState() : (
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={barData} margin={{ top: 20, right: 20, bottom: 60, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                            <XAxis 
                              dataKey="name" 
                              tick={{ fill: '#7a95b8', fontSize: 11 }} 
                              angle={-45} 
                              textAnchor="end" 
                              height={80}
                              interval={0}
                            />
                            <YAxis 
                              tick={{ fill: '#7a95b8', fontSize: 12 }} 
                              domain={['dataMin - 2', 'dataMax + 2']}
                              tickFormatter={(val) => `${val}%`}
                            />
                            <RechartsTooltip content={<CustomTooltip />} />
                            
                            {/* Threshold Lines */}
                            <Line type="step" dataKey={() => driftThreshold} stroke="#ef4444" strokeDasharray="5 5" strokeWidth={1} dot={false} activeDot={false} isAnimationActive={false} />
                            <Line type="step" dataKey={() => -driftThreshold} stroke="#ef4444" strokeDasharray="5 5" strokeWidth={1} dot={false} activeDot={false} isAnimationActive={false} />
                            
                            <Bar 
                              dataKey="Drift" 
                              radius={[4, 4, 4, 4]}
                              maxBarSize={40}
                            >
                              {barData.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={Math.abs(entry.Drift) >= driftThreshold ? '#ef4444' : entry.Drift > 0 ? '#10b981' : '#f59e0b'} 
                                />
                              ))}
                            </Bar>
                          </ComposedChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                </div>

                {/* Detailed Table */}
                <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl overflow-hidden">
                  <div className="p-5 border-b border-[#12233e] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Target className="h-5 w-5 text-[#10b981]" /> Detailed Allocation
                    </h2>
                    <div className="flex items-center gap-3">
                      <button className="text-sm text-[#3b82f6] hover:text-[#60a5fa] transition-colors font-medium">
                        Download Report
                      </button>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#060d19] border-b border-[#12233e]">
                          <th className="py-4 px-5 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider">Asset Class</th>
                          <th className="py-4 px-5 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider">Category</th>
                          <th className="py-4 px-5 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider text-right">Target</th>
                          <th className="py-4 px-5 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider text-right">Current</th>
                          <th className="py-4 px-5 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider text-right">Value</th>
                          <th className="py-4 px-5 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider text-right">Drift</th>
                          <th className="py-4 px-5 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#12233e]">
                        {filteredPortfolio.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-8 text-center text-[#7a95b8]">No assets match your current filters</td>
                          </tr>
                        ) : (
                          filteredPortfolio.map((asset) => {
                            const isAlert = Math.abs(asset.drift) >= driftThreshold;
                            return (
                              <tr key={asset.id} className="hover:bg-[#12233e]/50 transition-colors group">
                                <td className="py-4 px-5">
                                  <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: asset.color }}></div>
                                    <span className="font-medium text-white group-hover:text-[#3b82f6] transition-colors">{asset.name}</span>
                                  </div>
                                </td>
                                <td className="py-4 px-5 text-sm text-[#cbd5e1]">{asset.category}</td>
                                <td className="py-4 px-5 text-sm text-[#cbd5e1] text-right font-mono">{asset.targetPct.toFixed(1)}%</td>
                                <td className="py-4 px-5 text-sm text-white text-right font-mono font-medium">{asset.currentPct.toFixed(1)}%</td>
                                <td className="py-4 px-5 text-sm text-[#cbd5e1] text-right font-mono">${asset.currentValue.toLocaleString()}</td>
                                <td className="py-4 px-5 text-right">
                                  <span className={`inline-flex items-center gap-1 font-mono text-sm font-medium ${
                                    isAlert ? 'text-[#ef4444]' : asset.drift > 0 ? 'text-[#10b981]' : asset.drift < 0 ? 'text-[#f59e0b]' : 'text-[#cbd5e1]'
                                  }`}>
                                    {asset.drift > 0 ? '+' : ''}{asset.drift.toFixed(1)}%
                                    {asset.drift > 0 ? <TrendingUp className="h-3 w-3" /> : asset.drift < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                                  </span>
                                </td>
                                <td className="py-4 px-5 text-center">
                                  {isAlert ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20">
                                      <AlertTriangle className="h-3 w-3" /> Action Required
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20">
                                      <CheckCircle2 className="h-3 w-3" /> In Tolerance
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Content: Trade List */}
            {activeTab === "trades" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Trades Table */}
                  <div className="lg:col-span-2 rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-[#12233e] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#060d19]/50">
                      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <ArrowRight className="h-5 w-5 text-[#3b82f6]" /> Suggested Trades
                      </h2>
                      <button 
                        onClick={handleExportCSV}
                        className="rc-btn rc-btn-ghost flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#12233e] text-sm text-[#cbd5e1] hover:bg-[#12233e] transition-colors"
                      >
                        <Download className="h-4 w-4" /> Export CSV
                      </button>
                    </div>
                    
                    <div className="overflow-x-auto flex-1">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#060d19] border-b border-[#12233e]">
                            <th className="py-3 px-4 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider">Asset Class</th>
                            <th className="py-3 px-4 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider text-right">Current</th>
                            <th className="py-3 px-4 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider text-right">Target</th>
                            <th className="py-3 px-4 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider text-right">Trade Amount</th>
                            <th className="py-3 px-4 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#12233e]">
                          {rebalanceTrades.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-12 text-center">
                                <CheckCircle2 className="h-10 w-10 text-[#10b981] mx-auto mb-3 opacity-50" />
                                <p className="text-white font-medium">Portfolio is aligned with targets</p>
                                <p className="text-[#7a95b8] text-sm mt-1">No trades are required at this time.</p>
                              </td>
                            </tr>
                          ) : (
                            rebalanceTrades.map((t, i) => (
                              <tr key={i} className="hover:bg-[#12233e]/30 transition-colors">
                                <td className="py-3 px-4 font-medium text-white text-sm">{t.name}</td>
                                <td className="py-3 px-4 text-right text-sm text-[#cbd5e1] font-mono">${t.currentValue.toLocaleString()}</td>
                                <td className="py-3 px-4 text-right text-sm text-[#cbd5e1] font-mono">${Math.round(t.targetValue).toLocaleString()}</td>
                                <td className="py-3 px-4 text-right font-mono font-medium text-sm">
                                  <span className={t.tradeAmount > 0 ? "text-[#10b981]" : "text-[#ef4444]"}>
                                    {t.tradeAmount > 0 ? "+" : "-"}${Math.abs(Math.round(t.tradeAmount)).toLocaleString()}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded text-xs font-bold w-16 ${
                                    t.tradeAmount > 0 
                                      ? "bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30" 
                                      : "bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30"
                                  }`}>
                                    {t.tradeAmount > 0 ? "BUY" : "SELL"}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Execution Summary */}
                  <div className="space-y-6">
                    <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5">
                      <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
                        <Target className="h-5 w-5 text-[#f0c040]" /> Execution Summary
                      </h2>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-[#12233e]">
                          <span className="text-[#7a95b8] text-sm">Total Buys</span>
                          <span className="text-white font-mono font-medium">${(rebalanceTrades.filter((t) => t.tradeAmount > 0).reduce((s, t) => s + t.tradeAmount, 0) / 1000).toFixed(1)}K</span>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-[#12233e]">
                          <span className="text-[#7a95b8] text-sm">Total Sells</span>
                          <span className="text-white font-mono font-medium">${(taxImpact.totalSells / 1000).toFixed(1)}K</span>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-[#12233e]">
                          <span className="text-[#7a95b8] text-sm">Trades Count</span>
                          <span className="text-white font-medium">{rebalanceTrades.length}</span>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-[#12233e]">
                          <span className="text-[#7a95b8] text-sm">Est. Turnover</span>
                          <span className="text-white font-medium">{((taxImpact.totalSells / totalValue) * 100).toFixed(1)}%</span>
                        </div>
                        
                        <div className="pt-2">
                          <label className="text-xs text-[#7a95b8] uppercase font-semibold tracking-wider mb-2 block">Rebalance Method</label>
                          <select
                            value={rebalanceMethod}
                            onChange={(e) => setRebalanceMethod(e.target.value as any)}
                            className="w-full bg-[#060d19] border border-[#12233e] rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:border-[#3b82f6] transition-colors"
                          >
                            <option value="Full">Full Rebalance (To Target)</option>
                            <option value="Partial">Partial (To Tolerance Band)</option>
                            <option value="TaxAware">Tax-Aware (Minimizes Gains)</option>
                          </select>
                        </div>
                        
                        <button 
                          onClick={resetToTarget} 
                          disabled={rebalanceTrades.length === 0}
                          className="w-full rc-btn rc-btn-primary py-3 rounded-lg bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-white font-bold hover:shadow-lg hover:shadow-[#22c55e]/20 transition-all flex justify-center items-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Review & Execute <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Content: Tax Impact */}
            {activeTab === "tax" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Tax Summary Cards */}
                  <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5 relative overflow-hidden">
                      <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#ef4444]/5 rounded-full blur-xl"></div>
                      <h3 className="text-[#7a95b8] text-sm font-medium mb-1">Est. Realized Gains</h3>
                      <p className="text-3xl font-bold text-white">${(taxImpact.estimatedGains).toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                      <div className="mt-3 text-xs text-[#7a95b8] flex items-center gap-1">
                        <Info className="h-3 w-3" /> Based on {taxMethodology} methodology
                      </div>
                    </div>
                    
                    <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5 relative overflow-hidden">
                      <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#f59e0b]/5 rounded-full blur-xl"></div>
                      <h3 className="text-[#7a95b8] text-sm font-medium mb-1">Capital Gains Budget</h3>
                      <p className="text-3xl font-bold text-white">${capitalGainsBudget.toLocaleString()}</p>
                      <div className="mt-3 w-full bg-[#12233e] rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full ${taxImpact.estimatedGains > capitalGainsBudget ? 'bg-[#ef4444]' : 'bg-[#10b981]'}`}
                          style={{ width: `${Math.min(100, (taxImpact.estimatedGains / capitalGainsBudget) * 100)}%` }}
                        ></div>
                      </div>
                      <div className="mt-1 text-xs text-right text-[#7a95b8]">
                        {((taxImpact.estimatedGains / capitalGainsBudget) * 100).toFixed(0)}% utilized
                      </div>
                    </div>
                    
                    <div className="rc-card bg-gradient-to-br from-[#ef4444]/10 to-[#0d1a2e] border border-[#ef4444]/20 rounded-2xl p-5 relative overflow-hidden">
                      <h3 className="text-amber-400 text-sm font-medium mb-1 flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4" /> Estimated Tax Liability
                      </h3>
                      <p className="text-3xl font-bold text-[#ef4444]">${(taxImpact.estimatedTax).toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                      <div className="mt-3 text-xs text-[#7a95b8]">
                        Assuming 15% Long-Term Capital Gains rate
                      </div>
                    </div>
                  </div>

                  {/* Tax Lots Table */}
                  <div className="lg:col-span-3 rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl overflow-hidden">
                    <div className="p-5 border-b border-[#12233e] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-[#3b82f6]" /> Available Tax Lots (Sells Only)
                      </h2>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-[#7a95b8]">Sort by:</span>
                        <select className="bg-[#060d19] border border-[#12233e] rounded px-2 py-1 text-white focus:outline-none focus:border-[#3b82f6]">
                          <option>Highest Cost Basis</option>
                          <option>Lowest Cost Basis</option>
                          <option>Long Term First</option>
                          <option>Short Term First</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#060d19] border-b border-[#12233e]">
                            <th className="py-3 px-4 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider">Asset</th>
                            <th className="py-3 px-4 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider">Acquired</th>
                            <th className="py-3 px-4 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider text-right">Shares</th>
                            <th className="py-3 px-4 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider text-right">Cost Basis</th>
                            <th className="py-3 px-4 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider text-right">Current Value</th>
                            <th className="py-3 px-4 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider text-right">Unrealized G/L</th>
                            <th className="py-3 px-4 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider text-center">Term</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#12233e]">
                          {TAX_LOTS.map((lot) => (
                            <tr key={lot.id} className="hover:bg-[#12233e]/30 transition-colors">
                              <td className="py-3 px-4 font-medium text-white text-sm">{lot.asset}</td>
                              <td className="py-3 px-4 text-sm text-[#cbd5e1]">{lot.dateAcquired}</td>
                              <td className="py-3 px-4 text-right text-sm text-[#cbd5e1] font-mono">{lot.shares}</td>
                              <td className="py-3 px-4 text-right text-sm text-[#cbd5e1] font-mono">${lot.costBasis.toLocaleString()}</td>
                              <td className="py-3 px-4 text-right text-sm text-white font-mono font-medium">${lot.currentValue.toLocaleString()}</td>
                              <td className="py-3 px-4 text-right font-mono font-medium text-sm">
                                <span className={lot.unrealizedGain > 0 ? "text-[#10b981]" : "text-[#ef4444]"}>
                                  {lot.unrealizedGain > 0 ? "+" : ""}${lot.unrealizedGain.toLocaleString()}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-medium ${
                                  lot.term === "Long" 
                                    ? "bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/30" 
                                    : "bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30"
                                }`}>
                                  {lot.term}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Content: Analytics */}
            {activeTab === "analytics" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Risk vs Return Scatter Plot */}
                  <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5 flex flex-col h-[400px]">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-[#3b82f6]" /> Risk vs. Return Profile
                    </h2>
                    <div className="flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                          <XAxis type="number" dataKey="risk" name="Volatility (Risk)" unit="%" tick={{ fill: '#7a95b8', fontSize: 12 }} />
                          <YAxis type="number" dataKey="return" name="YTD Return" unit="%" tick={{ fill: '#7a95b8', fontSize: 12 }} />
                          <ZAxis type="number" dataKey="size" range={[50, 400]} name="Value ($k)" />
                          <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} content={<CustomTooltip />} />
                          <Scatter name="Assets" data={scatterData}>
                            {scatterData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                            ))}
                          </Scatter>
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-[#7a95b8] text-center mt-2">Bubble size represents current position value</p>
                  </div>

                  {/* Historical Drift Trend */}
                  <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5 flex flex-col h-[400px]">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <LineChartIcon className="h-5 w-5 text-[#8b5cf6]" /> Historical Drift Trend
                    </h2>
                    <div className="flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={HISTORICAL_DRIFT_DATA} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                          <XAxis dataKey="month" tick={{ fill: '#7a95b8', fontSize: 12 }} />
                          <YAxis yAxisId="left" tick={{ fill: '#7a95b8', fontSize: 12 }} unit="%" domain={[0, 'dataMax + 2']} />
                          <YAxis yAxisId="right" orientation="right" tick={{ fill: '#7a95b8', fontSize: 12 }} domain={['auto', 'auto']} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                          <RechartsTooltip content={<CustomTooltip />} />
                          
                          {/* Threshold Line */}
                          <Line yAxisId="left" type="step" dataKey={() => driftThreshold} stroke="#ef4444" strokeDasharray="5 5" strokeWidth={1} dot={false} activeDot={false} name="Threshold" />
                          
                          <Area yAxisId="right" type="monotone" dataKey="portfolioValue" fill="#3b82f6" fillOpacity={0.1} stroke="none" name="Portfolio Value" />
                          <Line yAxisId="left" type="monotone" dataKey="drift" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#0d1a2e' }} activeDot={{ r: 6 }} name="Max Drift %" />
                          
                          {/* Rebalance Events */}
                          <Scatter yAxisId="left" data={HISTORICAL_DRIFT_DATA.filter((d) => d.rebalanced)} dataKey="drift" fill="#10b981" shape="star" name="Rebalance Event" />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                
                {/* Analytics Data Table */}
                <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl overflow-hidden">
                  <div className="p-5 border-b border-[#12233e]">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Activity className="h-5 w-5 text-[#10b981]" /> Advanced Metrics
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#060d19] border-b border-[#12233e]">
                          <th className="py-3 px-4 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider">Asset Class</th>
                          <th className="py-3 px-4 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider text-right">Yield</th>
                          <th className="py-3 px-4 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider text-right">Expense Ratio</th>
                          <th className="py-3 px-4 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider text-right">Volatility</th>
                          <th className="py-3 px-4 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider text-right">Sharpe Ratio</th>
                          <th className="py-3 px-4 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider text-center">Liquidity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#12233e]">
                        {filteredPortfolio.map((asset) => (
                          <tr key={asset.id} className="hover:bg-[#12233e]/30 transition-colors">
                            <td className="py-3 px-4 font-medium text-white text-sm">{asset.name}</td>
                            <td className="py-3 px-4 text-right text-sm text-[#cbd5e1] font-mono">{asset.yield.toFixed(2)}%</td>
                            <td className="py-3 px-4 text-right text-sm text-[#cbd5e1] font-mono">{asset.expenseRatio.toFixed(2)}%</td>
                            <td className="py-3 px-4 text-right text-sm text-[#cbd5e1] font-mono">{asset.volatility.toFixed(1)}%</td>
                            <td className="py-3 px-4 text-right text-sm text-white font-mono">{asset.sharpeRatio.toFixed(2)}</td>
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-medium ${
                                asset.liquidity === "High" || asset.liquidity === "Very High"
                                  ? "bg-[#10b981]/20 text-[#10b981] border border-[#10b981]/30" 
                                  : asset.liquidity === "Medium"
                                    ? "bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30"
                                    : "bg-[#ef4444]/20 text-[#ef4444] border border-[#ef4444]/30"
                              }`}>
                                {asset.liquidity}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Content: History */}
            {activeTab === "history" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl overflow-hidden">
                  <div className="p-5 border-b border-[#12233e] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                      <History className="h-5 w-5 text-[#3b82f6]" /> Rebalance History
                    </h2>
                    <div className="flex items-center gap-3">
                      <button className="text-sm text-[#7a95b8] hover:text-white transition-colors flex items-center gap-1">
                        <Filter className="h-4 w-4" /> Filter
                      </button>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#060d19] border-b border-[#12233e]">
                          <th className="py-4 px-5 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider">Date</th>
                          <th className="py-4 px-5 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider">Trigger</th>
                          <th className="py-4 px-5 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider text-right">Trades</th>
                          <th className="py-4 px-5 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider text-right">Turnover</th>
                          <th className="py-4 px-5 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider text-right">Tax Impact</th>
                          <th className="py-4 px-5 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider text-center">Report</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#12233e]">
                        {REBALANCE_HISTORY.map((record) => (
                          <tr key={record.id} className="hover:bg-[#12233e]/30 transition-colors">
                            <td className="py-4 px-5 text-sm text-white font-medium">{record.date}</td>
                            <td className="py-4 px-5">
                              <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                record.trigger === "Calendar" 
                                  ? "bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20" 
                                  : record.trigger === "Drift Threshold"
                                    ? "bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20"
                                    : "bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20"
                              }`}>
                                {record.trigger}
                              </span>
                            </td>
                            <td className="py-4 px-5 text-right text-sm text-[#cbd5e1] font-mono">{record.trades}</td>
                            <td className="py-4 px-5 text-right text-sm text-[#cbd5e1] font-mono">{record.turnover.toFixed(1)}%</td>
                            <td className="py-4 px-5 text-right text-sm text-white font-mono font-medium">${record.taxImpact.toLocaleString()}</td>
                            <td className="py-4 px-5 text-center">
                              <button className="p-1.5 text-[#7a95b8] hover:text-[#3b82f6] hover:bg-[#3b82f6]/10 rounded transition-colors inline-flex">
                                <FileText className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Content: Settings */}
            {activeTab === "settings" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* General Settings */}
                  <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                      <Settings className="h-5 w-5 text-[#3b82f6]" /> Rebalance Parameters
                    </h2>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="text-sm text-white font-medium block mb-2">Target Cash Buffer (%)</label>
                        <p className="text-xs text-[#7a95b8] mb-3">Minimum cash percentage to maintain after rebalancing</p>
                        <NumberInput
                          value={cashBuffer}
                          onChange={(val) => setCashBuffer(val || 0)}
                          min={0}
                          max={20}
                          className="w-full bg-[#060d19] border border-[#12233e] rounded-lg"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm text-white font-medium block mb-2">Minimum Trade Amount ($)</label>
                        <p className="text-xs text-[#7a95b8] mb-3">Ignore trades smaller than this amount to reduce transaction costs</p>
                        <NumberInput
                          value={tradeMinAmount}
                          onChange={(val) => setTradeMinAmount(val || 0)}
                          min={0}
                          step={100}
                          className="w-full bg-[#060d19] border border-[#12233e] rounded-lg"
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm text-white font-medium block mb-2">Capital Gains Budget ($)</label>
                        <p className="text-xs text-[#7a95b8] mb-3">Maximum acceptable realized gains for a single rebalance event</p>
                        <NumberInput
                          value={capitalGainsBudget}
                          onChange={(val) => setCapitalGainsBudget(val || 0)}
                          min={0}
                          step={1000}
                          className="w-full bg-[#060d19] border border-[#12233e] rounded-lg"
                        />
                      </div>
                      
                      <div className="pt-4 border-t border-[#12233e] flex justify-end">
                        <button className="rc-btn rc-btn-primary px-4 py-2 rounded-lg bg-[#3b82f6] text-white hover:bg-[#2563eb] transition-colors">
                          Save Parameters
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Automation Settings */}
                  <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-6">
                    <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                      <Bell className="h-5 w-5 text-[#f59e0b]" /> Alerts & Automation
                    </h2>
                    
                    <div className="space-y-5">
                      <div className="flex items-center justify-between p-4 bg-[#060d19] rounded-xl border border-[#12233e]">
                        <div>
                          <h4 className="text-white font-medium text-sm">Drift Alerts</h4>
                          <p className="text-xs text-[#7a95b8] mt-1">Notify when any asset exceeds threshold</p>
                        </div>
                        <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                          <input type="checkbox" name="toggle" id="toggle1" defaultChecked className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" style={{ right: 0, borderColor: '#10b981' }} />
                          <label htmlFor="toggle1" className="toggle-label block overflow-hidden h-6 rounded-full bg-[#10b981] cursor-pointer"></label>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-[#060d19] rounded-xl border border-[#12233e]">
                        <div>
                          <h4 className="text-white font-medium text-sm">Auto-Rebalance</h4>
                          <p className="text-xs text-[#7a95b8] mt-1">Automatically execute trades when threshold breached</p>
                        </div>
                        <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                          <input type="checkbox" name="toggle" id="toggle2" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" style={{ right: '24px', borderColor: '#374151' }} />
                          <label htmlFor="toggle2" className="toggle-label block overflow-hidden h-6 rounded-full bg-[#374151] cursor-pointer"></label>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-[#060d19] rounded-xl border border-[#12233e]">
                        <div>
                          <h4 className="text-white font-medium text-sm">Tax Loss Harvesting</h4>
                          <p className="text-xs text-[#7a95b8] mt-1">Scan for opportunities monthly</p>
                        </div>
                        <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                          <input type="checkbox" name="toggle" id="toggle3" defaultChecked className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" style={{ right: 0, borderColor: '#10b981' }} />
                          <label htmlFor="toggle3" className="toggle-label block overflow-hidden h-6 rounded-full bg-[#10b981] cursor-pointer"></label>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-[#060d19] rounded-xl border border-[#12233e]">
                        <div>
                          <h4 className="text-white font-medium text-sm">Client Notifications</h4>
                          <p className="text-xs text-[#7a95b8] mt-1">Send summary to client after rebalance</p>
                        </div>
                        <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                          <input type="checkbox" name="toggle" id="toggle4" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" style={{ right: '24px', borderColor: '#374151' }} />
                          <label htmlFor="toggle4" className="toggle-label block overflow-hidden h-6 rounded-full bg-[#374151] cursor-pointer"></label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <NAICDisclaimer />
        <PageInsights pageId="portfolio-drift-monitor" />
      </div>
    
        <ComplianceFooter pageName="PortfolioDriftMonitor" showsTax showsEstate showsProjections showsHistoricalData />
      </AppShell>
  );
}
