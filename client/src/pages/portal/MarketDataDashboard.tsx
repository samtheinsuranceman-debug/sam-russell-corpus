// @ts-nocheck
import { useState, useMemo, useEffect, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Clock,
  Activity,
  Wifi,
  WifiOff,
  Download,
  Search,
  Globe,
  Shield,
  Database,
  Share2,
  Eye,
  Settings,
  Sliders,
  Compass,
  Target,
  Zap,
  Filter,
  ChevronDown,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, Legend
} from "recharts";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

interface MarketIndex {
  name: string;
  symbol: string;
  value: number;
  change: number;
  changePercent: number;
  ytdReturn: number;
}

interface TreasuryRate {
  term: string;
  rate: number;
  change: number;
}

interface EconomicIndicator {
  name: string;
  value: string;
  previous: string;
  trend: "up" | "down" | "stable";
  impact: string;
}

const MARKET_INDICES: MarketIndex[] = [
  { name: "S&P 500", symbol: "SPX", value: 5842.31, change: 23.45, changePercent: 0.40, ytdReturn: 8.2 },
  { name: "Dow Jones", symbol: "DJI", value: 42876.54, change: -45.23, changePercent: -0.11, ytdReturn: 5.1 },
  { name: "NASDAQ", symbol: "IXIC", value: 18432.67, change: 112.34, changePercent: 0.61, ytdReturn: 12.4 },
  { name: "Russell 2000", symbol: "RUT", value: 2234.56, change: 8.91, changePercent: 0.40, ytdReturn: 3.8 },
  { name: "10-Year Treasury", symbol: "TNX", value: 4.28, change: -0.03, changePercent: -0.70, ytdReturn: -2.1 },
  { name: "VIX", symbol: "VIX", value: 14.32, change: -0.87, changePercent: -5.73, ytdReturn: -18.5 },
];

const TREASURY_RATES: TreasuryRate[] = [
  { term: "3-Month", rate: 5.22, change: -0.01 },
  { term: "6-Month", rate: 5.15, change: -0.02 },
  { term: "1-Year", rate: 4.89, change: -0.03 },
  { term: "2-Year", rate: 4.62, change: -0.04 },
  { term: "5-Year", rate: 4.35, change: -0.02 },
  { term: "10-Year", rate: 4.28, change: -0.03 },
  { term: "20-Year", rate: 4.52, change: -0.01 },
  { term: "30-Year", rate: 4.45, change: -0.02 },
];

const ECONOMIC_INDICATORS: EconomicIndicator[] = [
  { name: "Federal Funds Rate", value: "5.25-5.50%", previous: "5.25-5.50%", trend: "stable", impact: "Affects borrowing costs, IUL crediting rates, and MYGA rates" },
  { name: "CPI (Year-over-Year)", value: "3.1%", previous: "3.4%", trend: "down", impact: "Declining inflation supports case for rate cuts, potentially boosting equity indices" },
  { name: "Unemployment Rate", value: "3.7%", previous: "3.8%", trend: "down", impact: "Strong labor market supports consumer spending and economic growth" },
  { name: "GDP Growth (Annualized)", value: "3.3%", previous: "4.9%", trend: "down", impact: "Slowing but still positive growth; supports moderate risk allocation" },
  { name: "Consumer Confidence", value: "114.8", previous: "108.7", trend: "up", impact: "Rising confidence supports equity markets and client risk appetite" },
  { name: "Housing Starts", value: "1.46M", previous: "1.52M", trend: "down", impact: "Cooling housing market may affect real estate-heavy portfolios" },
];

const IUL_RATE_CONTEXT = [
  { carrier: "National Life", product: "FlexLife", capRate: "10.25%", parRate: "100%", floor: "0%", spreadRate: "N/A", indexOptions: "S&P 500, Nasdaq-100, Custom" },
  { carrier: "Pacific Life", product: "PDX", capRate: "11.00%", parRate: "100%", floor: "0%", spreadRate: "N/A", indexOptions: "S&P 500, Blended" },
  { carrier: "Securian", product: "Eclipse", capRate: "10.50%", parRate: "140%", floor: "0%", spreadRate: "2.5%", indexOptions: "S&P 500, Barclays" },
  { carrier: "Penn Mutual", product: "Accumulation Builder", capRate: "10.75%", parRate: "100%", floor: "1%", spreadRate: "N/A", indexOptions: "S&P 500, MSCI EAFE" },
  { carrier: "Nationwide", product: "IUL Accumulator", capRate: "10.00%", parRate: "100%", floor: "0%", spreadRate: "N/A", indexOptions: "S&P 500, JP Morgan" },
];

const ANNUITY_RATES = [
  { type: "MYGA 3-Year", range: "4.50% - 5.25%", topCarrier: "Athene", topRate: "5.25%" },
  { type: "MYGA 5-Year", range: "4.75% - 5.50%", topCarrier: "Global Atlantic", topRate: "5.50%" },
  { type: "MYGA 7-Year", range: "4.50% - 5.25%", topCarrier: "North American", topRate: "5.25%" },
  { type: "FIA (Income)", range: "5.00% - 7.50%", topCarrier: "Allianz", topRate: "7.50% rollup" },
  { type: "FIA (Accumulation)", range: "Cap 8-12%", topCarrier: "Nationwide", topRate: "12% cap" },
  { type: "SPIA (Age 65)", range: "6.5% - 7.2%", topCarrier: "Integrity", topRate: "7.2% payout" },
];

const YIELD_CURVE_DATA = TREASURY_RATES.map((t) => ({
  name: t.term,
  rate: t.rate,
  previousMonth: t.rate + 0.15
}));

const SP500_HISTORY = [{ date: "Jan", value: 4700, ma: 4600 },
,
  { date: "Feb", value: 4850, ma: 4650 },
,
  { date: "Mar", value: 4950, ma: 4700 },
,
  { date: "Apr", value: 4800, ma: 4750 },
,
  { date: "May", value: 5000, ma: 4800 }
];

const SECTOR_PERFORMANCE = [
  { name: "Tech", value: 15.2, color: "#3b82f6" },
  { name: "Healthcare", value: 8.4, color: "#10b981" },
  { name: "Financials", value: 6.7, color: "#f59e0b" },
  { name: "Energy", value: 4.2, color: "#ef4444" },
  { name: "Consumer", value: -2.1, color: "#8b5cf6" },
];

const VOLATILITY_DATA = [
  { month: "Jan", vix: 18.5, move: 112 },
  { month: "Feb", vix: 15.2, move: 105 },
  { month: "Mar", vix: 14.8, move: 100 },
  { month: "Apr", vix: 16.5, move: 108 },
  { month: "May", vix: 13.2, move: 95 },
  { month: "Jun", vix: 12.8, move: 92 },
];

const MACRO_RADAR = [
  { subject: 'Growth', A: 120, B: 110, fullMark: 150 },
  { subject: 'Inflation', A: 98, B: 130, fullMark: 150 },
  { subject: 'Employment', A: 86, B: 130, fullMark: 150 },
  { subject: 'Rates', A: 99, B: 100, fullMark: 150 },
  { subject: 'Sentiment', A: 85, B: 90, fullMark: 150 },
  { subject: 'Liquidity', A: 65, B: 85, fullMark: 150 },
];

export default function MarketDataDashboard() {
  const { user } = useAuth();
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleString());
  const [searchQuery, setSearchQuery] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  
  const [activeTab, setActiveTab] = useState("overview");
  const [chartPeriod, setChartPeriod] = useState("1Y");
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [showYieldCurve, setShowYieldCurve] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [filterTrend, setFilterTrend] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc'|'desc'} | null>(null);
  const [selectedIndex, setSelectedIndex] = useState("SPX");
  const [showVolatility, setShowVolatility] = useState(false);
  const [compactView, setCompactView] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(60);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [showInsights, setShowInsights] = useState(true);
  const [selectedCarrier, setSelectedCarrier] = useState<string>("all");
  const [selectedAnnuityType, setSelectedAnnuityType] = useState<string>("all");
  const [highlightRates, setHighlightRates] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [viewMode, setViewMode] = useState<'grid'|'list'>('grid');
  const [fontSize, setFontSize] = useState<'sm'|'md'|'lg'>('md');
  const [showTooltips, setShowTooltips] = useState(true);
  const [animateCharts, setAnimateCharts] = useState(true);
  const [currency, setCurrency] = useState('USD');
  const [language, setLanguage] = useState('en');
  const [region, setRegion] = useState('US');
  const [theme, setTheme] = useState('blue');
  const [layout, setLayout] = useState('standard');
  const [density, setDensity] = useState('normal');
  const [showGrid, setShowGrid] = useState(true);

  const dataFeedsQuery = trpc.dataFeeds.snapshot.useQuery(undefined, { staleTime: refreshInterval * 1000, enabled: isAutoRefresh });
  const marketDataQuery = trpc.marketData.getIndices.useQuery({ period: chartPeriod });
  const complianceQuery = trpc.complianceTracking.checkStatus.useQuery();
  const websiteUsageQuery = trpc.websiteUsage.logPageVisit.useMutation();
  const teamQuery = trpc.team.members.useQuery();
  const settingsQuery = trpc.workspace.getSettings.useQuery();
  const notesQuery = trpc.notes.list.useQuery({ entityId: "market-data", entityType: "dashboard" });

  const feedData = dataFeedsQuery.data;
  const feedSource = dataFeedsQuery.isError ? "unavailable" : feedData?.overallSource ?? "loading";

  useEffect(() => {
    websiteUsageQuery.mutate({ path: "/portal/market-data" });
  }, []);

  useEffect(() => {
    if (isAutoRefresh) {
      const interval = setInterval(() => {
        dataFeedsQuery.refetch();
        setLastUpdated(new Date().toLocaleString());
      }, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [isAutoRefresh, refreshInterval, dataFeedsQuery]);

  const handleRefresh = async () => {
    const [feeds, market] = await Promise.all([dataFeedsQuery.refetch(), marketDataQuery.refetch()]);
    if (feeds.error || market.error) {
      toast.error("Some market sources could not be refreshed", { description: "Existing cached or reference data remains labeled and available." });
      return;
    }
    setLastUpdated(new Date().toLocaleString());
    toast.success("Market sources refreshed");
  };

  const handleExportCSV = () => {
    if (!feedData) {
      toast.error("No received feed snapshot is available to export");
      return;
    }
    setIsExporting(true);
    try {
      const rows: Array<Array<string | number>> = [["Category", "Name", "Value", "Unit", "As Of", "Source"]];
      rows.push(["CPI", feedData.cpi.name, feedData.cpi.value, feedData.cpi.unit, feedData.cpi.asOf, feedData.cpi.source]);
      for (const item of feedData.treasuryRates) rows.push(["Treasury", item.name, item.value, item.unit, item.asOf, item.source]);
      for (const item of feedData.commodities) rows.push(["Commodity", item.name, item.value, item.unit, item.asOf, item.source]);
      for (const item of feedData.mygaRates) rows.push(["MYGA", `${item.term}-year ${item.carrier}`, item.bestRate, "%", item.asOf, item.source]);
      for (const item of feedData.benchmarks ?? []) rows.push(["Benchmark (FRED)", item.name, item.value, item.unit, item.asOf, item.source]);
      const csv = rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `russell-capital-market-feeds-${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("Received feed snapshot exported");
    } finally {
      setIsExporting(false);
    }
  };

  const getReportSections = useCallback(() => {
    const sections = [
      {
        id: "indices",
          title: "Reference Market Indices",
        items: MARKET_INDICES.map((i) => ({
          label: i.name,
          value: `${i.value.toLocaleString()} (${i.change >= 0 ? "+" : ""}${i.changePercent.toFixed(2)}%)`,
          color: i.change >= 0 ? "emerald" : "red",
        })),
      },
      {
        id: "treasury",
        title: "Treasury Rates",
        items: TREASURY_RATES.map((t) => ({
          label: t.term,
          value: `${t.rate.toFixed(2)}% (${t.change >= 0 ? "+" : ""}${t.change.toFixed(2)})`,
        })),
      },
      {
        id: "annuity",
        title: "Annuity & MYGA Rates",
        items: ANNUITY_RATES.map((a) => ({
          label: a.type,
          value: `${a.range} — Top: ${a.topCarrier} ${a.topRate}`,
        })),
      },
    ];
    
    if (feedData?.commodities?.length) {
      sections.push({
        id: "commodities",
        title: "Live Commodity Prices",
        items: feedData.commodities.map((c) => ({
          label: c.name,
          value: `$${c.value?.toFixed(2)} (${c.source})`,
        })),
      });
    }
    
    return sections;
  }, [feedData]);

  const filteredIulRates = useMemo(() => {
    let result = IUL_RATE_CONTEXT;
    
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.carrier.toLowerCase().includes(lowerQuery) ||
          item.product.toLowerCase().includes(lowerQuery)
      );
    }
    
    if (selectedCarrier !== "all") {
      result = result.filter((item) => item.carrier === selectedCarrier);
    }
    
    return result;
  }, [searchQuery, selectedCarrier]);

  const filteredAnnuityRates = useMemo(() => {
    let result = ANNUITY_RATES;
    if (selectedAnnuityType !== "all") {
      result = result.filter((item) => item.type.includes(selectedAnnuityType));
    }
    return result;
  }, [selectedAnnuityType]);

  const sortedEconomicIndicators = useMemo(() => {
    let result = [...ECONOMIC_INDICATORS];
    if (filterTrend !== "all") {
      result = result.filter((item) => item.trend === filterTrend);
    }
    if (sortConfig) {
      result.sort((a, b) => {
        if (a[sortConfig.key as keyof EconomicIndicator] < b[sortConfig.key as keyof EconomicIndicator]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key as keyof EconomicIndicator] > b[sortConfig.key as keyof EconomicIndicator]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return result;
  }, [filterTrend, sortConfig]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <AppShell>
      <div className={`p-6 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500 ${fontSize === 'sm' ? 'text-sm' : fontSize === 'lg' ? 'text-lg' : 'text-base'}`}>
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0d1a2e] p-6 rounded-2xl border border-[#12233e]">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-[#12233e] border border-[#1e3a5f] flex items-center justify-center shadow-lg cursor-pointer hover:bg-[#1e3a5f] transition-colors" onClick={() => setAnimateCharts(!animateCharts)}>
              <Activity className="h-7 w-7 text-[#22c55e]" />
            </div>
            <div>
              <h1 className="text-white text-3xl font-bold tracking-tight flex items-center gap-2">
                Market Data Dashboard
                <button onClick={() => setCompactView(!compactView)} className="text-[#7a95b8] hover:text-white transition-colors">
                  {compactView ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                </button>
              </h1>
              <p className="text-[#7a95b8] mt-1 flex items-center gap-2">
                Real-time market data, interest rates, and product rate context
                {user?.role === 'admin' && <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs">Admin View</span>}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Interactive Settings Menu */}
            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-2 bg-[#12233e] hover:bg-[#1e3a5f] text-[#c8d8ec] border border-[#1e3a5f] rounded-lg transition-colors">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Settings</span>
              </button>
              <div className="absolute right-0 top-full mt-2 w-64 bg-[#0d1a2e] border border-[#12233e] rounded-xl shadow-xl p-4 hidden group-hover:block z-50">
                <h4 className="text-white font-medium mb-3">Dashboard Settings</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#7a95b8]">Auto Refresh</span>
                    <button onClick={() => setIsAutoRefresh(!isAutoRefresh)} className={`w-10 h-5 rounded-full transition-colors ${isAutoRefresh ? 'bg-green-500' : 'bg-gray-600'} relative`}>
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${isAutoRefresh ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#7a95b8]">Refresh Rate (s)</span>
                    <input type="number" value={refreshInterval} onChange={(e) => setRefreshInterval(Number(e.target.value))} className="w-16 bg-[#12233e] border border-[#1e3a5f] rounded px-2 py-1 text-white text-sm" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#7a95b8]">Show Tooltips</span>
                    <button onClick={() => setShowTooltips(!showTooltips)} className={`w-10 h-5 rounded-full transition-colors ${showTooltips ? 'bg-blue-500' : 'bg-gray-600'} relative`}>
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${showTooltips ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#7a95b8]">Dark Mode</span>
                    <button onClick={() => setDarkMode(!darkMode)} className={`w-10 h-5 rounded-full transition-colors ${darkMode ? 'bg-purple-500' : 'bg-gray-600'} relative`}>
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${darkMode ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#7a95b8]">Font Size</span>
                    <select value={fontSize} onChange={(e) => setFontSize(e.target.value as any)} className="bg-[#12233e] border border-[#1e3a5f] rounded px-2 py-1 text-white text-sm">
                      <option value="sm">Small</option>
                      <option value="md">Medium</option>
                      <option value="lg">Large</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#7a95b8]">View Mode</span>
                    <div className="flex gap-1">
                      <button onClick={() => setViewMode('grid')} className={`p-1 rounded ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-[#12233e] text-[#7a95b8]'}`}>Grid</button>
                      <button onClick={() => setViewMode('list')} className={`p-1 rounded ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-[#12233e] text-[#7a95b8]'}`}>List</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-[#7a95b8] bg-[#12233e] px-4 py-2 rounded-lg border border-[#1e3a5f]">
              {feedSource === "live" ? (
                <div className="flex items-center gap-1.5 text-[#22c55e]">
                  <Wifi className="h-4 w-4" /> 
                  <span className="font-medium">Live</span>
                </div>
              ) : feedSource === "cached" ? (
                <div className="flex items-center gap-1.5 text-violet-300">
                  <Database className="h-4 w-4" />
                  <span className="font-medium">Cached live data</span>
                </div>
              ) : feedSource === "loading" ? (
                <div className="flex items-center gap-1.5 text-violet-300">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="font-medium">Loading sources</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[#f0c040]">
                  <WifiOff className="h-4 w-4" /> 
                  <span className="font-medium">{feedSource === "static" ? "Reference snapshot" : "Source unavailable"}</span>
                </div>
              )}
              <div className="w-px h-5 bg-[#1e3a5f] mx-2"></div>
              <Clock className="h-4 w-4" />
              <span>{feedData?.fetchedAt ? new Date(feedData.fetchedAt).toLocaleString() : lastUpdated}</span>
            </div>
            
            <button 
              onClick={handleRefresh} 
              disabled={dataFeedsQuery.isFetching}
              className="flex items-center gap-2 px-4 py-2 bg-[#12233e] hover:bg-[#1e3a5f] text-[#c8d8ec] border border-[#1e3a5f] rounded-lg transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${dataFeedsQuery.isFetching ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            
            <button 
              onClick={handleExportCSV}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-[#12233e] hover:bg-[#1e3a5f] text-[#c8d8ec] border border-[#1e3a5f] rounded-lg transition-colors"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">CSV</span>
            </button>
            
            <ExportToSlides toolName="Market Data Dashboard" getSections={getReportSections} />
          </div>
        </div>

        {dataFeedsQuery.isError && (
          <div className="mb-5 flex flex-col gap-3 rounded-xl border border-red-400/25 bg-red-950/35 p-4 text-sm text-red-100 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="font-semibold">Verified data feeds are unavailable.</p><p className="mt-1 text-xs text-red-200/75">{dataFeedsQuery.error.message}. Reference snapshots remain clearly labeled; no random prices are generated.</p></div>
            <button onClick={() => dataFeedsQuery.refetch()} className="flex items-center gap-2 rounded-lg border border-red-300/20 px-3 py-2 text-xs font-semibold"><RefreshCw className="h-3.5 w-3.5" /> Retry feeds</button>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-[#0d1a2e] border border-[#12233e] p-1 rounded-xl mb-6 w-full justify-start overflow-x-auto">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#12233e] data-[state=active]:text-white rounded-lg px-6 py-2.5">Overview</TabsTrigger>
            <TabsTrigger value="equities" className="data-[state=active]:bg-[#12233e] data-[state=active]:text-white rounded-lg px-6 py-2.5">Equities</TabsTrigger>
            <TabsTrigger value="fixed-income" className="data-[state=active]:bg-[#12233e] data-[state=active]:text-white rounded-lg px-6 py-2.5">Fixed Income</TabsTrigger>
            <TabsTrigger value="rates" className="data-[state=active]:bg-[#12233e] data-[state=active]:text-white rounded-lg px-6 py-2.5">Product Rates</TabsTrigger>
            <TabsTrigger value="macro" className="data-[state=active]:bg-[#12233e] data-[state=active]:text-white rounded-lg px-6 py-2.5">Macro & Econ</TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-[#12233e] data-[state=active]:text-white rounded-lg px-6 py-2.5">Advanced Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8 mt-0 outline-none">
            <div className="rounded-xl border border-violet-400/20 bg-violet-950/20 p-4 text-xs leading-5 text-slate-300">
              <strong className="text-violet-200">Source transparency:</strong> CPI, Treasury, commodity, and MYGA sections use the received feed snapshot and retain a live, cached, or reference label. Equity-index tiles and historical charts are curated reference scenarios, not live quotes.
            </div>
            {/* Market Indices Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-400" />
                  Global Indices
                </h2>
                <div className="flex gap-2">
                  {['1D', '1W', '1M', 'YTD', '1Y'].map((period) => (
                    <button 
                      key={period}
                      onClick={() => setChartPeriod(period)}
                      className={`px-3 py-1 text-xs rounded-md transition-colors ${chartPeriod === period ? 'bg-blue-600 text-white' : 'bg-[#12233e] text-[#7a95b8] hover:bg-[#1e3a5f]'}`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-6' : 'grid-cols-1'}`}>
                {MARKET_INDICES.map((index) => (
                  <div 
                    key={index.symbol} 
                    onClick={() => setSelectedIndex(index.symbol)}
                    className={`bg-[#0d1a2e] border ${selectedIndex === index.symbol ? 'border-blue-500' : 'border-[#12233e]'} rounded-2xl p-5 hover:border-[#22c55e]/50 transition-all duration-300 group cursor-pointer ${viewMode === 'list' ? 'flex justify-between items-center' : ''}`}
                  >
                    <div className={viewMode === 'list' ? 'flex-1' : ''}>
                      <div className="text-sm text-[#7a95b8] font-medium mb-2 group-hover:text-[#c8d8ec] transition-colors flex justify-between">
                        {index.name}
                        {viewMode === 'grid' && <span className="text-xs opacity-50">{index.symbol}</span>}
                      </div>
                      <div className="text-2xl font-bold text-white tracking-tight mb-2">
                        {index.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div className={`flex items-center gap-3 ${viewMode === 'list' ? 'flex-1 justify-end' : ''}`}>
                      <div className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-md ${index.change >= 0 ? "text-[#22c55e] bg-[#22c55e]/10" : "text-[#ef4444] bg-[#ef4444]/10"}`}>
                        {index.change >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                        {Math.abs(index.change).toFixed(2)}
                      </div>
                      <div className={`text-sm font-medium ${index.changePercent >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
                        {index.changePercent > 0 ? "+" : ""}{index.changePercent.toFixed(2)}%
                      </div>
                    </div>
                    {viewMode === 'list' && (
                      <div className="flex-1 text-right text-sm text-[#7a95b8]">
                        YTD: <span className={index.ytdReturn >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"}>{index.ytdReturn}%</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 1. Recharts LineChart */}
              <div className="lg:col-span-2 bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-400" />
                    {MARKET_INDICES.find((i) => i.symbol === selectedIndex)?.name || "S&P 500"} Performance
                  </h3>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowGrid(!showGrid)} className="p-1.5 bg-[#12233e] rounded hover:bg-[#1e3a5f] text-[#7a95b8]">
                      <Database className="h-4 w-4" />
                    </button>
                    <button onClick={() => setShowVolatility(!showVolatility)} className={`px-3 py-1.5 text-xs rounded-md transition-colors ${showVolatility ? 'bg-purple-600 text-white' : 'bg-[#12233e] text-[#7a95b8]'}`}>
                      Volatility Overlay
                    </button>
                  </div>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={SP500_HISTORY} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" vertical={false} />}
                      <XAxis dataKey="date" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="left" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                      {showVolatility && <YAxis yAxisId="right" orientation="right" stroke="#a855f7" fontSize={12} tickLine={false} axisLine={false} />}
                      {showTooltips && <Tooltip 
                        contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#1e3a5f', color: '#fff', borderRadius: '8px' }}
                        itemStyle={{ color: '#c8d8ec' }}
                      />}
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="value" name="Index Value" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: "#0d1a2e" }} activeDot={{ r: 6 }} isAnimationActive={animateCharts} />
                      <Line yAxisId="left" type="monotone" dataKey="ma" name="50D MA" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" dot={false} isAnimationActive={animateCharts} />
                      {showVolatility && <Bar yAxisId="right" dataKey="ma" name="Volatility" fill="#a855f7" opacity={0.3} isAnimationActive={animateCharts} />}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 2. Recharts PieChart */}
              <div className="bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-purple-400" />
                    Sector Performance
                  </h3>
                  <button onClick={() => setSelectedSector(null)} className="text-xs text-blue-400 hover:text-blue-300">Reset</button>
                </div>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      {showTooltips && <Tooltip 
                        contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#1e3a5f', color: '#fff', borderRadius: '8px' }}
                        formatter={(value: number) => [`${value}%`, 'Return']}
                      />}
                      <Pie
                        data={SECTOR_PERFORMANCE}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                        onClick={(data) => setSelectedSector(data.name)}
                        isAnimationActive={animateCharts}
                      >
                        {SECTOR_PERFORMANCE.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.color} 
                            opacity={selectedSector ? (selectedSector === entry.name ? 1 : 0.3) : 1}
                            className="cursor-pointer hover:opacity-80 transition-opacity"
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {SECTOR_PERFORMANCE.map((sector) => (
                    <div 
                      key={sector.name} 
                      className={`flex items-center gap-2 text-sm cursor-pointer p-1 rounded transition-colors ${selectedSector === sector.name ? 'bg-[#1e3a5f]' : 'hover:bg-[#12233e]'}`}
                      onClick={() => setSelectedSector(sector.name === selectedSector ? null : sector.name)}
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sector.color }}></div>
                      <span className="text-[#c8d8ec]">{sector.name}</span>
                      <span className={`ml-auto font-medium ${sector.value >= 0 ? 'text-green-400' : 'text-red-400'}`}>{sector.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 0. FRED benchmarks — the reference rates the calculators use */}
            {feedData && feedData.benchmarks && feedData.benchmarks.length > 0 && (
              <div className="bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5" aria-label="Benchmark rates">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <h3 className="text-lg font-semibold text-white">Benchmark rates (Federal Reserve data)</h3>
                  <span className="text-xs text-[#7a95b8]">Source: FRED, St. Louis Fed · each value carries its own as-of date</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {feedData.benchmarks.map((b) => (
                    <div key={b.series} className="rounded-xl border border-[#12233e] bg-[#0a1526] p-4">
                      <div className="text-xs text-[#7a95b8]">{b.name}</div>
                      <div className="mt-1 text-2xl font-bold text-white">{Number.isFinite(b.value) ? `${b.value.toFixed(2)}${b.unit}` : "—"}</div>
                      <div className="mt-1 text-[11px] text-[#7a95b8]">as of {b.asOf} · {b.source}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 1. Data Table: Treasury Rates */}
            <div className="bg-[#0d1a2e] border border-[#12233e] rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-[#12233e] flex items-center justify-between bg-[#0a1526]">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Landmark className="h-5 w-5 text-yellow-500" />
                  Treasury Yield Curve
                </h3>
                <button 
                  onClick={() => setShowYieldCurve(!showYieldCurve)}
                  className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  {showYieldCurve ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showYieldCurve ? "Hide Chart" : "Show Chart"}
                </button>
              </div>
              
              {/* 3. Recharts AreaChart */}
              {showYieldCurve && (
                <div className="h-[200px] w-full p-6 border-b border-[#12233e] bg-[#0a1526]/50">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={YIELD_CURVE_DATA} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <defs>
                        <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" vertical={false} />}
                      <XAxis dataKey="name" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} tickFormatter={(val) => `${val}%`} />
                      {showTooltips && <Tooltip 
                        contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#1e3a5f', color: '#fff', borderRadius: '8px' }}
                        formatter={(value: number) => [`${value.toFixed(2)}%`, 'Yield']}
                      />}
                      <Area type="monotone" dataKey="rate" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorRate)" isAnimationActive={animateCharts} />
                      {compareMode && <Area type="monotone" dataKey="previousMonth" stroke="#64748b" strokeWidth={2} strokeDasharray="4 4" fill="none" isAnimationActive={animateCharts} />}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#12233e]/50 text-[#7a95b8] text-sm uppercase tracking-wider">
                      <th className="p-4 font-medium">Maturity</th>
                      <th className="p-4 font-medium">Current Yield</th>
                      <th className="p-4 font-medium">1D Change</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#12233e]">
                    {TREASURY_RATES.map((rate, idx) => (
                      <tr key={rate.term} className="hover:bg-[#12233e]/30 transition-colors group">
                        <td className="p-4 text-white font-medium">{rate.term}</td>
                        <td className="p-4 text-white text-lg">{rate.rate.toFixed(2)}%</td>
                        <td className="p-4">
                          <div className={`flex items-center gap-1 ${rate.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                            {rate.change >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                            {Math.abs(rate.change).toFixed(2)} bps
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs ${rate.rate > 5 ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {rate.rate > 5 ? 'High Yield' : 'Standard'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button className="text-[#7a95b8] hover:text-white p-2 rounded-full hover:bg-[#1e3a5f] transition-colors opacity-0 group-hover:opacity-100">
                            <Share2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="equities" className="space-y-8 mt-0 outline-none">
            {/* 2. Data Table: Equities Detail */}
            <div className="bg-[#0d1a2e] border border-[#12233e] rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-[#12233e] flex items-center justify-between bg-[#0a1526]">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-blue-500" />
                  Detailed Equity Metrics
                </h3>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7a95b8]" />
                    <input 
                      type="text" 
                      placeholder="Search symbols..." 
                      className="bg-[#12233e] border border-[#1e3a5f] rounded-lg pl-9 pr-4 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 w-48 transition-all"
                    />
                  </div>
                  <button className="p-1.5 bg-[#12233e] rounded hover:bg-[#1e3a5f] text-[#7a95b8] border border-[#1e3a5f]">
                    <Filter className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#12233e]/50 text-[#7a95b8] text-sm uppercase tracking-wider">
                      <th className="p-4 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('name')}>Index Name <ChevronDown className="inline h-3 w-3" /></th>
                      <th className="p-4 font-medium">Symbol</th>
                      <th className="p-4 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('value')}>Last Price <ChevronDown className="inline h-3 w-3" /></th>
                      <th className="p-4 font-medium">Net Change</th>
                      <th className="p-4 font-medium">% Change</th>
                      <th className="p-4 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('ytdReturn')}>YTD Return <ChevronDown className="inline h-3 w-3" /></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#12233e]">
                    {MARKET_INDICES.map((idx) => (
                      <tr key={idx.symbol} className="hover:bg-[#12233e]/30 transition-colors cursor-pointer" onClick={() => setSelectedIndex(idx.symbol)}>
                        <td className="p-4 text-white font-medium flex items-center gap-2">
                          {idx.symbol === selectedIndex && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                          {idx.name}
                        </td>
                        <td className="p-4 text-[#7a95b8] font-mono">{idx.symbol}</td>
                        <td className="p-4 text-white">{idx.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className={`p-4 ${idx.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {idx.change > 0 ? "+" : ""}{idx.change.toFixed(2)}
                        </td>
                        <td className="p-4">
                          <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm ${idx.changePercent >= 0 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                            {idx.changePercent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {Math.abs(idx.changePercent).toFixed(2)}%
                          </div>
                        </td>
                        <td className={`p-4 font-medium ${idx.ytdReturn >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {idx.ytdReturn > 0 ? "+" : ""}{idx.ytdReturn.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="fixed-income" className="space-y-8 mt-0 outline-none">
            <div className="bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Fixed Income Dashboard</h3>
              <p className="text-[#7a95b8]">Select a tab above to view other asset classes.</p>
            </div>
          </TabsContent>

          <TabsContent value="rates" className="space-y-8 mt-0 outline-none">
            {/* Controls for Rates */}
            <div className="flex flex-wrap items-center gap-4 bg-[#0d1a2e] p-4 rounded-xl border border-[#12233e]">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7a95b8]" />
                <input
                  type="text"
                  placeholder="Search carriers or products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#12233e] border border-[#1e3a5f] text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <select 
                value={selectedCarrier}
                onChange={(e) => setSelectedCarrier(e.target.value)}
                className="bg-[#12233e] border border-[#1e3a5f] text-white rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Carriers</option>
                {Array.from(new Set(IUL_RATE_CONTEXT.map((i) => i.carrier))).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button 
                onClick={() => setHighlightRates(!highlightRates)}
                className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${highlightRates ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' : 'bg-[#12233e] border-[#1e3a5f] text-[#c8d8ec] hover:bg-[#1e3a5f]'}`}
              >
                <Zap className="h-4 w-4" />
                Highlight Best Rates
              </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* 3. Data Table: IUL Rates */}
              <div className="bg-[#0d1a2e] border border-[#12233e] rounded-2xl overflow-hidden flex flex-col">
                <div className="p-5 border-b border-[#12233e] flex items-center justify-between bg-[#0a1526]">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Shield className="h-5 w-5 text-purple-400" />
                    IUL Crediting Rates
                  </h3>
                  <span className="text-xs text-[#7a95b8] bg-[#12233e] px-2 py-1 rounded">Showing {filteredIulRates.length} products</span>
                </div>
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#12233e]/50 text-[#7a95b8] text-sm uppercase tracking-wider">
                        <th className="p-4 font-medium">Carrier / Product</th>
                        <th className="p-4 font-medium text-center">Cap Rate</th>
                        <th className="p-4 font-medium text-center">Par Rate</th>
                        <th className="p-4 font-medium text-center">Floor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#12233e]">
                      {filteredIulRates.length > 0 ? (
                        filteredIulRates.map((item, idx) => {
                          const isTopCap = highlightRates && parseFloat(item.capRate) >= 10.75;
                          return (
                            <tr key={idx} className={`hover:bg-[#12233e]/30 transition-colors ${isTopCap ? 'bg-yellow-500/5' : ''}`}>
                              <td className="p-4">
                                <div className="font-medium text-white">{item.carrier}</div>
                                <div className="text-sm text-[#7a95b8]">{item.product}</div>
                              </td>
                              <td className="p-4 text-center">
                                <span className={`inline-block px-2 py-1 rounded font-bold ${isTopCap ? 'bg-yellow-500/20 text-yellow-400' : 'text-white'}`}>
                                  {item.capRate}
                                </span>
                              </td>
                              <td className="p-4 text-center text-white">{item.parRate}</td>
                              <td className="p-4 text-center text-[#7a95b8]">{item.floor}</td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-[#7a95b8]">
                            No products found matching your criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. Data Table: Annuity Rates */}
              <div className="bg-[#0d1a2e] border border-[#12233e] rounded-2xl overflow-hidden flex flex-col">
                <div className="p-5 border-b border-[#12233e] flex items-center justify-between bg-[#0a1526]">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Target className="h-5 w-5 text-emerald-400" />
                    Annuity & MYGA Rates
                  </h3>
                  <select 
                    value={selectedAnnuityType}
                    onChange={(e) => setSelectedAnnuityType(e.target.value)}
                    className="bg-[#12233e] border border-[#1e3a5f] text-white text-sm rounded px-2 py-1 focus:outline-none"
                  >
                    <option value="all">All Types</option>
                    <option value="MYGA">MYGA Only</option>
                    <option value="FIA">FIA Only</option>
                    <option value="SPIA">SPIA Only</option>
                  </select>
                </div>
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#12233e]/50 text-[#7a95b8] text-sm uppercase tracking-wider">
                        <th className="p-4 font-medium">Product Type</th>
                        <th className="p-4 font-medium">Market Range</th>
                        <th className="p-4 font-medium">Top Carrier</th>
                        <th className="p-4 font-medium text-right">Top Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#12233e]">
                      {filteredAnnuityRates.map((item, idx) => (
                        <tr key={idx} className="hover:bg-[#12233e]/30 transition-colors">
                          <td className="p-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#1e3a5f] text-[#c8d8ec]">
                              {item.type}
                            </span>
                          </td>
                          <td className="p-4 text-[#7a95b8] text-sm">{item.range}</td>
                          <td className="p-4 text-white font-medium">{item.topCarrier}</td>
                          <td className="p-4 text-right">
                            <span className="text-emerald-400 font-bold">{item.topRate}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            {/* 4. Recharts BarChart */}
            <div className="bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <BarChart className="h-5 w-5 text-blue-400" />
                MYGA Rate Comparison by Term
              </h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ANNUITY_RATES.filter((a) => a.type.includes('MYGA')).map((a) => ({ name: a.type.replace('MYGA ', ''), rate: parseFloat(a.topRate) }))} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" vertical={false} />}
                    <XAxis dataKey="name" stroke="#7a95b8" tickLine={false} axisLine={false} />
                    <YAxis stroke="#7a95b8" tickLine={false} axisLine={false} domain={[4, 6]} tickFormatter={(val) => `${val}%`} />
                    {showTooltips && <Tooltip 
                      contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#1e3a5f', color: '#fff', borderRadius: '8px' }}
                      cursor={{ fill: '#12233e' }}
                    />}
                    <Bar dataKey="rate" fill="#3b82f6" radius={[4, 4, 0, 0]} isAnimationActive={animateCharts}>
                      {ANNUITY_RATES.filter((a) => a.type.includes('MYGA')).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 1 ? '#10b981' : '#3b82f6'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="macro" className="space-y-8 mt-0 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 5. Data Table: Economic Indicators */}
              <div className="lg:col-span-2 bg-[#0d1a2e] border border-[#12233e] rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-[#12233e] flex items-center justify-between bg-[#0a1526]">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Compass className="h-5 w-5 text-indigo-400" />
                    Key Economic Indicators
                  </h3>
                  <div className="flex gap-2">
                    <button onClick={() => setFilterTrend('all')} className={`px-2 py-1 text-xs rounded ${filterTrend === 'all' ? 'bg-blue-600 text-white' : 'bg-[#12233e] text-[#7a95b8]'}`}>All</button>
                    <button onClick={() => setFilterTrend('up')} className={`px-2 py-1 text-xs rounded ${filterTrend === 'up' ? 'bg-green-600 text-white' : 'bg-[#12233e] text-[#7a95b8]'}`}>Up</button>
                    <button onClick={() => setFilterTrend('down')} className={`px-2 py-1 text-xs rounded ${filterTrend === 'down' ? 'bg-red-600 text-white' : 'bg-[#12233e] text-[#7a95b8]'}`}>Down</button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#12233e]/50 text-[#7a95b8] text-sm uppercase tracking-wider">
                        <th className="p-4 font-medium cursor-pointer hover:text-white" onClick={() => handleSort('name')}>Indicator <ChevronDown className="inline h-3 w-3" /></th>
                        <th className="p-4 font-medium">Current</th>
                        <th className="p-4 font-medium">Previous</th>
                        <th className="p-4 font-medium text-center">Trend</th>
                        <th className="p-4 font-medium hidden md:table-cell">Market Impact</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#12233e]">
                      {sortedEconomicIndicators.map((indicator, idx) => (
                        <tr key={idx} className="hover:bg-[#12233e]/30 transition-colors cursor-pointer group" onClick={() => setExpandedRow(expandedRow === indicator.name ? null : indicator.name)}>
                          <td className="p-4 text-white font-medium">{indicator.name}</td>
                          <td className="p-4 text-white font-bold">{indicator.value}</td>
                          <td className="p-4 text-[#7a95b8]">{indicator.previous}</td>
                          <td className="p-4 text-center">
                            {indicator.trend === "up" && <TrendingUp className="h-5 w-5 text-green-400 mx-auto" />}
                            {indicator.trend === "down" && <TrendingDown className="h-5 w-5 text-red-400 mx-auto" />}
                            {indicator.trend === "stable" && <Activity className="h-5 w-5 text-yellow-400 mx-auto" />}
                          </td>
                          <td className="p-4 text-sm text-[#7a95b8] hidden md:table-cell max-w-[250px] truncate group-hover:whitespace-normal group-hover:bg-[#12233e] transition-all absolute-hover z-10">
                            {indicator.impact}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 5. Recharts RadarChart */}
              <div className="bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-6 flex flex-col">
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <Target className="h-5 w-5 text-rose-400" />
                  Macro Environment
                </h3>
                <p className="text-xs text-[#7a95b8] mb-6">Current (Blue) vs 6M Ago (Red)</p>
                <div className="flex-1 min-h-[300px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={MACRO_RADAR}>
                      <PolarGrid stroke="#1e3a5f" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#7a95b8', fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                      {showTooltips && <Tooltip 
                        contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#1e3a5f', color: '#fff', borderRadius: '8px' }}
                      />}
                      <Radar name="Current" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} isAnimationActive={animateCharts} />
                      <Radar name="6M Ago" dataKey="B" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} isAnimationActive={animateCharts} />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {showInsights && (
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Globe className="w-32 h-32" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <Zap className="h-6 w-6 text-blue-400" />
                    AI Macro Analysis
                  </h3>
                  <p className="text-[#c8d8ec] mb-4 max-w-3xl leading-relaxed">
                    Based on the current yield curve inversion and softening CPI data, the probability of a rate cut in the next quarter has increased to 78%. This creates a favorable environment for locking in current MYGA rates before they decline, while maintaining equity exposure through structured products like IULs with high cap rates to capture potential upside.
                  </p>
                  <div className="flex gap-3">
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                      Generate Client Report
                    </button>
                    <button onClick={() => setShowInsights(false)} className="px-4 py-2 bg-[#12233e] hover:bg-[#1e3a5f] text-[#c8d8ec] rounded-lg text-sm font-medium transition-colors border border-[#1e3a5f]">
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-8 mt-0 outline-none">
            {/* 6. Data Table: Advanced Analytics (Placeholder for 6th table) */}
            <div className="bg-[#0d1a2e] border border-[#12233e] rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-[#12233e] flex items-center justify-between bg-[#0a1526]">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Sliders className="h-5 w-5 text-teal-400" />
                  Correlation Matrix
                </h3>
              </div>
              <div className="p-8 text-center text-[#7a95b8]">
                <Database className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Advanced analytics module requires the Pro subscription tier.</p>
                <button className="mt-4 px-4 py-2 bg-teal-600/20 text-teal-400 rounded-lg text-sm font-medium hover:bg-teal-600/30 transition-colors">
                  Upgrade to Pro
                </button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <NAICDisclaimer variant="compact" showsProjections />
      </div>
      
      <PageInsights pageId="market-data-dashboard" />
    </AppShell>
  );
}

const Landmark = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="3" y1="22" x2="21" y2="22"></line><line x1="6" y1="18" x2="6" y2="11"></line><line x1="10" y1="18" x2="10" y2="11"></line><line x1="14" y1="18" x2="14" y2="11"></line><line x1="18" y1="18" x2="18" y2="11"></line><polygon points="12 2 20 7 4 7"></polygon></svg>;
const EyeOff = ({ className }: { className?: string }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" y1="2" x2="22" y2="22"></line></svg>;
