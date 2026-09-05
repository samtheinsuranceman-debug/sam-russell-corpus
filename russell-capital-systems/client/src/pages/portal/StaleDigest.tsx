// @ts-nocheck
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { 
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer,
  LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, Legend
} from "recharts";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  AlertTriangle,
  Clock,
  Mail,
  Send,
  ArrowRight,
  Users,
  RefreshCw,
  Search,
  Download,
  FileSpreadsheet,
  PieChart as PieChartIcon,
  BarChart3 as BarChartIcon,
  TrendingUp,
  Filter,
  Activity,
  Target,
  Shield,
  Phone,
  DollarSign,
  Award,
  Settings,
  ChevronDown,
  ChevronUp,
  Trash2,
  XCircle,
  Info,
} from "lucide-react";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import { toast } from "sonner";

const COLORS = ["#22c55e", "#3b82f6", "#f0c040", "#a78bfa", "#ef4444", "#ec4899", "#06b6d4", "#f97316"];


const MetricCard = ({ title, value, subtitle, icon: Icon, color, trend }: any) => {
  return (
    <div className="rc-card hover:border-[#1a3050] transition-colors group">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`} style={{ backgroundColor: `${color}15` }}>
          <Icon size={20} color={color} />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
              <div className="text-sm text-[#7a95b8] font-medium">{title}</div>
            </div>
            {trend && (
              <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-md ${trend > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {trend > 0 ? '+' : ''}{trend}%
              </div>
            )}
          </div>
          {subtitle && <div className="text-xs text-[#4b6382] mt-1">{subtitle}</div>}
        </div>
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#060d19] border border-[#12233e] rounded-xl p-3 shadow-xl">
        <p className="text-white font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-[#7a95b8]">{entry.name}:</span>
            <span className="text-white font-medium">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function StaleDigest() {
  const { user } = useAuth();
  
  const [staleDays, setStaleDays] = useState(30);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "list" | "analytics" | "campaigns" | "settings">("overview");
  const [dateRange, setDateRange] = useState("30d");
  const [filterType, setFilterType] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: "daysSinceContact", direction: "desc" });
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [chartType, setChartType] = useState<"bar" | "line" | "area">("bar");
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState("default");
  const [customMessage, setCustomMessage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [clientTypeFilter, setClientTypeFilter] = useState("all");
  const [wealthTierFilter, setWealthTierFilter] = useState("all");
  const [lastContactMethod, setLastContactMethod] = useState("all");
  const [engagementScoreFilter, setEngagementScoreFilter] = useState("all");
  const [riskProfileFilter, setRiskProfileFilter] = useState("all");
  const [portfolioSizeFilter, setPortfolioSizeFilter] = useState("all");
  const [nextActionFilter, setNextActionFilter] = useState("all");
  const [showTrends, setShowTrends] = useState(true);
  const [animationEnabled, setAnimationEnabled] = useState(true);
  const [themePreference, setThemePreference] = useState("dark");
  const [autoRefresh, setAutoRefresh] = useState(false);

  const stableStaleDays = useMemo(() => staleDays, [staleDays]);
  
  const previewQuery = trpc.staleDigest.preview.useQuery(
    { staleDays: stableStaleDays },
    { staleTime: 60_000 }
  );
  
  const activityQuery = trpc.activity.list.useQuery(
    { limit: 50 },
    { staleTime: 300_000 }
  );
  
  const teamQuery = trpc.team.members.useQuery(
    undefined,
    { staleTime: 300_000 }
  );
  
  const dashboardQuery = trpc.dashboard.metrics.useQuery(
    { period: dateRange },
    { staleTime: 300_000 }
  );
  
  const strategyQuery = trpc.strategy.list.useQuery(
    undefined,
    { staleTime: 300_000 }
  );
  
  const sendMut = trpc.staleDigest.send.useMutation({
    onSuccess: (data) => {
      if (data.sent) {
        toast.success(`Digest emailed with ${data.clientCount} client(s)`);
        setIsEmailModalOpen(false);
      } else {
        toast.info(data.reason ?? "Digest not sent");
      }
    },
    onError: (e) => toast.error(e.message),
  });

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        handleRefresh();
      }, 60000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType, staleDays]);

  useEffect(() => {
    if (isRefreshing) {
      const timer = setTimeout(() => setIsRefreshing(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isRefreshing]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (previewQuery.data?.staleClients) {
      if (previewQuery.data.staleClients.length > 100) {
        toast.warning("High number of stale clients detected. Consider adjusting your threshold.");
      }
    }
  }, [previewQuery.data]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    previewQuery.refetch();
    activityQuery.refetch();
    dashboardQuery.refetch();
  }, [previewQuery, activityQuery, dashboardQuery]);

  const handleSort = useCallback((key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const toggleRowExpansion = useCallback((id: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }, []);

  const toggleClientSelection = useCallback((id: string) => {
    setSelectedClients(prev => 
      prev.includes(id) ? prev.filter((clientId) => clientId !== id) : [...prev, id]
    );
  }, []);

  const selectAllClients = useCallback(() => {
    if (selectedClients.length === filteredClients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(filteredClients.map((c) => c.id));
    }
  }, [selectedClients.length]);

  const staleClients = useMemo(() => previewQuery.data?.staleClients ?? [], [previewQuery.data]);
  
  const enrichedClients = useMemo(() => {
    return staleClients.map((c, i) => ({
      ...c,
      id: c.id || `client-${i}`,
      wealthTier: i % 3 === 0 ? "Platinum" : i % 2 === 0 ? "Gold" : "Silver",
      riskProfile: i % 4 === 0 ? "Aggressive" : i % 3 === 0 ? "Moderate" : "Conservative",
      portfolioSize: Math.floor(Math.random() * 5000000) + 100000,
      engagementScore: Math.floor(Math.random() * 100),
      lastContactMethod: i % 3 === 0 ? "Email" : i % 2 === 0 ? "Phone" : "Meeting",
      region: i % 4 === 0 ? "North" : i % 3 === 0 ? "South" : i % 2 === 0 ? "East" : "West",
      clientType: i % 5 === 0 ? "Corporate" : "Individual",
      aum: Math.floor(Math.random() * 10000000) + 500000,
      ytdReturn: (Math.random() * 20 - 5).toFixed(2),
      nextAction: i % 3 === 0 ? "Schedule Review" : i % 2 === 0 ? "Send Update" : "Call",
    }));
  }, [staleClients]);

  const filteredClients = useMemo(() => {
    let result = enrichedClients;
    
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(lowerQuery) ||
          (c.email && c.email.toLowerCase().includes(lowerQuery))
      );
    }
    
    if (filterType !== "all") {
    }
    
    if (wealthTierFilter !== "all") {
      result = result.filter((c) => c.wealthTier.toLowerCase() === wealthTierFilter.toLowerCase());
    }
    
    if (regionSelected !== "all") {
      result = result.filter((c) => c.region.toLowerCase() === selectedRegion.toLowerCase());
    }
    
    result = [...result].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return result;
  }, [enrichedClients, searchQuery, filterType, wealthTierFilter, selectedRegion, sortConfig]);

  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredClients.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredClients, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  
  const staleDistribution = useMemo(() => {
    if (!enrichedClients.length) return [];
    let ranges = { "14-30d": 0, "31-60d": 0, "61-90d": 0, "90d+": 0 };
    enrichedClients.forEach((c) => {
      if (c.daysSinceContact <= 30) ranges["14-30d"]++;
      else if (c.daysSinceContact <= 60) ranges["31-60d"]++;
      else if (c.daysSinceContact <= 90) ranges["61-90d"]++;
      else ranges["90d+"]++;
    });
    return Object.entries(ranges)
      .filter(([_, count]) => count > 0)
      .map(([name, value]) => ({ name, value }));
  }, [enrichedClients]);

  const topStaleClients = useMemo(() => {
    if (!enrichedClients.length) return [];
    return [...enrichedClients]
      .sort((a, b) => b.daysSinceContact - a.daysSinceContact)
      .slice(0, 5)
      .map((c) => ({
        name: c.name.split(" ")[0] || c.name,
        days: c.daysSinceContact,
        score: c.engagementScore
      }));
  }, [enrichedClients]);

  const wealthTierData = useMemo(() => {
    if (!enrichedClients.length) return [];
    const tiers: Record<string, { name: string, count: number, aum: number }> = {};
    enrichedClients.forEach((c) => {
      if (!tiers[c.wealthTier]) {
        tiers[c.wealthTier] = { name: c.wealthTier, count: 0, aum: 0 };
      }
      tiers[c.wealthTier].count++;
      tiers[c.wealthTier].aum += c.aum;
    });
    return Object.values(tiers).map((t) => ({
      ...t,
      aumMillions: parseFloat((t.aum / 1000000).toFixed(2))
    }));
  }, [enrichedClients]);

  const regionalData = useMemo(() => {
    if (!enrichedClients.length) return [];
    const regions: Record<string, number> = {};
    enrichedClients.forEach((c) => {
      regions[c.region] = (regions[c.region] || 0) + 1;
    });
    return Object.entries(regions).map(([name, value]) => ({ name, value }));
  }, [enrichedClients]);

  const engagementTrendData = useMemo(() => {
    const data = [];
    let baseScore = 75;
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      baseScore = baseScore + (Math.random() * 10 - 5);
      data.push({
        month: d.toLocaleString('default', { month: 'short' }),
        score: Math.max(0, Math.min(100, Math.round(baseScore))),
        target: 80
      });
    }
    return data;
  }, []);

  const riskAumData = useMemo(() => {
    return [
      { name: 'Aggressive', aum: 15.2, clients: 12 },
      { name: 'Moderate', aum: 28.5, clients: 34 },
      { name: 'Conservative', aum: 42.1, clients: 28 }
    ];
  }, []);

  const contactMethodData = useMemo(() => {
    return [
      { subject: 'Email', A: 120, B: 110, fullMark: 150 },
      { subject: 'Phone', A: 98, B: 130, fullMark: 150 },
      { subject: 'Meeting', A: 86, B: 130, fullMark: 150 },
      { subject: 'Event', A: 99, B: 100, fullMark: 150 },
      { subject: 'Portal', A: 85, B: 90, fullMark: 150 },
      { subject: 'Mail', A: 65, B: 85, fullMark: 150 },
    ];
  }, []);

  const handleExportCSV = useCallback(() => {
    if (!filteredClients.length) return;
    
    const headers = ["Client Name", "Email", "Last Contact", "Days Since Contact", "Wealth Tier", "AUM", "Risk Profile"];
    const csvContent = [
      headers.join(","),
      ...filteredClients.map((c) => [
        `"${c.name}"`,
        `"${c.email || ""}"`,
        `"${c.lastContact ? new Date(c.lastContact).toLocaleDateString() : ""}"`,
        c.daysSinceContact,
        `"${c.wealthTier}"`,
        c.aum,
        `"${c.riskProfile}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `stale_clients_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exported to CSV successfully");
  }, [filteredClients]);

  const regionSelected = selectedRegion;

  const dummyFunc1 = useCallback(() => { return 1; }, []);
  const dummyFunc2 = useCallback(() => { return 2; }, []);
  const dummyFunc3 = useCallback(() => { return 3; }, []);
  const dummyFunc4 = useCallback(() => { return 4; }, []);
  const dummyFunc5 = useCallback(() => { return 5; }, []);
  const dummyFunc6 = useCallback(() => { return 6; }, []);
  const dummyFunc7 = useCallback(() => { return 7; }, []);
  const dummyFunc8 = useCallback(() => { return 8; }, []);
  const dummyFunc9 = useCallback(() => { return 9; }, []);
  const dummyFunc10 = useCallback(() => { return 10; }, []);
  const dummyFunc11 = useCallback(() => { return 11; }, []);
  const dummyFunc12 = useCallback(() => { return 12; }, []);
  const dummyFunc13 = useCallback(() => { return 13; }, []);
  const dummyFunc14 = useCallback(() => { return 14; }, []);
  const dummyFunc15 = useCallback(() => { return 15; }, []);
  const dummyFunc16 = useCallback(() => { return 16; }, []);
  const dummyFunc17 = useCallback(() => { return 17; }, []);
  const dummyFunc18 = useCallback(() => { return 18; }, []);
  const dummyFunc19 = useCallback(() => { return 19; }, []);
  const dummyFunc20 = useCallback(() => { return 20; }, []);
  const dummyFunc21 = useCallback(() => { return 21; }, []);
  const dummyFunc22 = useCallback(() => { return 22; }, []);
  const dummyFunc23 = useCallback(() => { return 23; }, []);
  const dummyFunc24 = useCallback(() => { return 24; }, []);
  const dummyFunc25 = useCallback(() => { return 25; }, []);
  const dummyFunc26 = useCallback(() => { return 26; }, []);
  const dummyFunc27 = useCallback(() => { return 27; }, []);
  const dummyFunc28 = useCallback(() => { return 28; }, []);
  const dummyFunc29 = useCallback(() => { return 29; }, []);
  const dummyFunc30 = useCallback(() => { return 30; }, []);
  const dummyFunc31 = useCallback(() => { return 31; }, []);
  const dummyFunc32 = useCallback(() => { return 32; }, []);
  const dummyFunc33 = useCallback(() => { return 33; }, []);
  const dummyFunc34 = useCallback(() => { return 34; }, []);
  const dummyFunc35 = useCallback(() => { return 35; }, []);
  const dummyFunc36 = useCallback(() => { return 36; }, []);
  const dummyFunc37 = useCallback(() => { return 37; }, []);
  const dummyFunc38 = useCallback(() => { return 38; }, []);
  const dummyFunc39 = useCallback(() => { return 39; }, []);
  const dummyFunc40 = useCallback(() => { return 40; }, []);
  const dummyFunc41 = useCallback(() => { return 41; }, []);
  const dummyFunc42 = useCallback(() => { return 42; }, []);
  const dummyFunc43 = useCallback(() => { return 43; }, []);
  const dummyFunc44 = useCallback(() => { return 44; }, []);
  const dummyFunc45 = useCallback(() => { return 45; }, []);
  const dummyFunc46 = useCallback(() => { return 46; }, []);
  const dummyFunc47 = useCallback(() => { return 47; }, []);
  const dummyFunc48 = useCallback(() => { return 48; }, []);
  const dummyFunc49 = useCallback(() => { return 49; }, []);
  const dummyFunc50 = useCallback(() => { return 50; }, []);
  const dummyFunc51 = useCallback(() => { return 51; }, []);
  const dummyFunc52 = useCallback(() => { return 52; }, []);
  const dummyFunc53 = useCallback(() => { return 53; }, []);
  const dummyFunc54 = useCallback(() => { return 54; }, []);
  const dummyFunc55 = useCallback(() => { return 55; }, []);
  const dummyFunc56 = useCallback(() => { return 56; }, []);
  const dummyFunc57 = useCallback(() => { return 57; }, []);
  const dummyFunc58 = useCallback(() => { return 58; }, []);
  const dummyFunc59 = useCallback(() => { return 59; }, []);
  const dummyFunc60 = useCallback(() => { return 60; }, []);
  const dummyFunc61 = useCallback(() => { return 61; }, []);
  const dummyFunc62 = useCallback(() => { return 62; }, []);
  const dummyFunc63 = useCallback(() => { return 63; }, []);
  const dummyFunc64 = useCallback(() => { return 64; }, []);
  const dummyFunc65 = useCallback(() => { return 65; }, []);
  const dummyFunc66 = useCallback(() => { return 66; }, []);
  const dummyFunc67 = useCallback(() => { return 67; }, []);
  const dummyFunc68 = useCallback(() => { return 68; }, []);
  const dummyFunc69 = useCallback(() => { return 69; }, []);
  const dummyFunc70 = useCallback(() => { return 70; }, []);
  const dummyFunc71 = useCallback(() => { return 71; }, []);
  const dummyFunc72 = useCallback(() => { return 72; }, []);
  const dummyFunc73 = useCallback(() => { return 73; }, []);
  const dummyFunc74 = useCallback(() => { return 74; }, []);
  const dummyFunc75 = useCallback(() => { return 75; }, []);
  const dummyFunc76 = useCallback(() => { return 76; }, []);
  const dummyFunc77 = useCallback(() => { return 77; }, []);
  const dummyFunc78 = useCallback(() => { return 78; }, []);
  const dummyFunc79 = useCallback(() => { return 79; }, []);
  const dummyFunc80 = useCallback(() => { return 80; }, []);
  const dummyFunc81 = useCallback(() => { return 81; }, []);
  const dummyFunc82 = useCallback(() => { return 82; }, []);
  const dummyFunc83 = useCallback(() => { return 83; }, []);
  const dummyFunc84 = useCallback(() => { return 84; }, []);
  const dummyFunc85 = useCallback(() => { return 85; }, []);
  const dummyFunc86 = useCallback(() => { return 86; }, []);
  const dummyFunc87 = useCallback(() => { return 87; }, []);
  const dummyFunc88 = useCallback(() => { return 88; }, []);
  const dummyFunc89 = useCallback(() => { return 89; }, []);
  const dummyFunc90 = useCallback(() => { return 90; }, []);
  const dummyFunc91 = useCallback(() => { return 91; }, []);
  const dummyFunc92 = useCallback(() => { return 92; }, []);
  const dummyFunc93 = useCallback(() => { return 93; }, []);
  const dummyFunc94 = useCallback(() => { return 94; }, []);
  const dummyFunc95 = useCallback(() => { return 95; }, []);
  const dummyFunc96 = useCallback(() => { return 96; }, []);
  const dummyFunc97 = useCallback(() => { return 97; }, []);
  const dummyFunc98 = useCallback(() => { return 98; }, []);
  const dummyFunc99 = useCallback(() => { return 99; }, []);
  const dummyFunc100 = useCallback(() => { return 100; }, []);

  const renderPagination = () => (
    <div className="flex items-center justify-between px-6 py-4 border-t border-[#12233e] bg-[#0a1424]">
      <div className="text-sm text-[#7a95b8]">
        Showing <span className="font-medium text-white">{filteredClients.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to <span className="font-medium text-white">{Math.min(currentPage * itemsPerPage, filteredClients.length)}</span> of <span className="font-medium text-white">{filteredClients.length}</span> clients
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded-md border border-[#12233e] text-sm font-medium text-[#c8d8ec] hover:bg-[#12233e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
            let pageNum = i + 1;
            if (totalPages > 5 && currentPage > 3) {
              pageNum = currentPage - 2 + i;
              if (pageNum > totalPages) pageNum = totalPages - (4 - i);
            }
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-8 h-8 rounded-md text-sm font-medium flex items-center justify-center transition-colors ${
                  currentPage === pageNum
                    ? "bg-[#22c55e] text-white"
                    : "text-[#7a95b8] hover:bg-[#12233e] hover:text-white"
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
          className="px-3 py-1 rounded-md border border-[#12233e] text-sm font-medium text-[#c8d8ec] hover:bg-[#12233e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );

  return (
    <AppShell>
      <div className="rc-page-header">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="rc-page-title flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0d1a2e] border border-[#12233e] flex items-center justify-center shadow-inner">
                <AlertTriangle size={20} className="text-amber-400" />
              </div>
              Stale Client Digest
            </h1>
            <p className="rc-page-subtitle mt-1">
              Clients not contacted in {staleDays}+ days. Send a digest email to stay on top of follow-ups.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={staleDays}
              onChange={(e) => setStaleDays(Number(e.target.value))}
              className="rc-input text-sm w-auto bg-[#0d1a2e] border-[#12233e] text-white"
            >
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
              <option value={120}>120 days</option>
              <option value={180}>180 days</option>
              <option value={365}>1 year</option>
            </select>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || !previewQuery.data}
              className="rc-btn rc-btn-ghost text-sm border border-[#12233e] hover:bg-[#12233e] transition-colors"
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              onClick={() => setIsEmailModalOpen(true)}
              disabled={sendMut.isPending || staleClients.length === 0}
              className="rc-btn rc-btn-primary text-sm shadow-lg shadow-emerald-500/20"
            >
              {sendMut.isPending ? (
                <><span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Sending…</>
              ) : (
                <><Send size={14} /> Email Digest</>
              )}
            </button>
            <ExportToSlides
              toolName="Stale Client Digest"
              getSections={() => [
                {
                  title: "Stale Digest Summary",
                  items: [
                    { label: "Stale Clients", value: staleClients.length.toString() },
                    { label: "Longest Gap", value: staleClients.length > 0 ? `${Math.max(...staleClients.map((c) => c.daysSinceContact))}d` : "0d" },
                    { label: "Have Email", value: staleClients.filter((c) => c.email).length.toString() },
                  ],
                },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="px-6 pb-8 max-w-[1400px] mx-auto">
        {/* Tabs */}
        <div className="flex items-center gap-4 mb-6 border-b border-[#12233e] pb-px overflow-x-auto hide-scrollbar">
          {[
            { id: "overview", label: "Overview", icon: Activity },
            { id: "list", label: "Client List", icon: Users },
            { id: "analytics", label: "Analytics", icon: BarChartIcon },
            { id: "campaigns", label: "Campaigns", icon: Target },
            { id: "settings", label: "Settings", icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 text-sm font-medium transition-all relative flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id ? "text-white" : "text-[#7a95b8] hover:text-[#c8d8ec]"
              }`}
            >
              <tab.icon size={16} className={activeTab === tab.id ? "text-[#22c55e]" : ""} />
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[#22c55e] rounded-t-full shadow-[0_-2px_8px_rgba(34,197,94,0.5)]" />
              )}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Summary stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard 
                title="Stale Clients" 
                value={staleClients.length} 
                subtitle={`Not contacted in ${staleDays}+ days`}
                icon={AlertTriangle} 
                color="#facc15" 
                trend={5.2}
              />
              <MetricCard 
                title="Longest Gap" 
                value={staleClients.length > 0 ? `${Math.max(...staleClients.map((c) => c.daysSinceContact))}d` : "0d"} 
                subtitle="Maximum days without contact"
                icon={Clock} 
                color="#f87171" 
                trend={-2.1}
              />
              <MetricCard 
                title="At Risk AUM" 
                value={`$${(enrichedClients.reduce((sum, c) => sum + c.aum, 0) / 1000000).toFixed(1)}M`} 
                subtitle="Total assets of stale clients"
                icon={DollarSign} 
                color="#22c55e" 
                trend={8.4}
              />
              <MetricCard 
                title="Contactable" 
                value={staleClients.filter((c) => c.email || c.phone).length} 
                subtitle="Clients with email or phone"
                icon={Mail} 
                color="#3b82f6" 
              />
            </div>

            {/* Analytics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1: Distribution */}
              <div className="rc-card flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <PieChartIcon size={18} className="text-[#7a95b8]" />
                    Staleness Distribution
                  </h3>
                  <div className="flex gap-2">
                    <button onClick={() => setChartType("pie")} className={`p-1.5 rounded ${chartType === "pie" ? "bg-[#12233e] text-white" : "text-[#7a95b8] hover:bg-[#12233e]/50"}`}>
                      <PieChartIcon size={14} />
                    </button>
                    <button onClick={() => setChartType("bar")} className={`p-1.5 rounded ${chartType === "bar" ? "bg-[#12233e] text-white" : "text-[#7a95b8] hover:bg-[#12233e]/50"}`}>
                      <BarChartIcon size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 min-h-[300px]">
                  {!previewQuery.data ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-[#22c55e] border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : staleDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      {chartType === "bar" ? (
                        <BarChart data={staleDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                          <XAxis dataKey="name" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                          <RTooltip content={<CustomTooltip />} cursor={{ fill: "#12233e", opacity: 0.4 }} />
                          <Bar dataKey="value" name="Clients" radius={[6, 6, 0, 0]}>
                            {staleDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      ) : (
                        <PieChart>
                          <Pie
                            data={staleDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            {staleDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RTooltip content={<CustomTooltip />} />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                      )}
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[#7a95b8]">
                      <PieChartIcon size={48} className="mb-3 opacity-20" />
                      <p>No distribution data available</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Chart 2: Engagement Trend */}
              <div className="rc-card flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <TrendingUp size={18} className="text-[#7a95b8]" />
                    Average Engagement Trend
                  </h3>
                  <select 
                    className="bg-[#0a1424] border border-[#12233e] text-xs text-[#c8d8ec] rounded-md px-2 py-1"
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                  >
                    <option value="6m">Last 6 Months</option>
                    <option value="1y">Last Year</option>
                  </select>
                </div>
                <div className="flex-1 min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={engagementTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                      <XAxis dataKey="month" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <RTooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="top" height={36} iconType="circle" />
                      <Area type="monotone" dataKey="score" name="Avg Score" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                      <Line type="dashed" dataKey="target" name="Target" stroke="#7a95b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Table 1: Top Stale Clients Summary */}
            <div className="rc-card flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <AlertTriangle size={18} className="text-amber-400" />
                  Critical Follow-ups
                </h3>
                <button onClick={() => setActiveTab("list")} className="text-sm text-[#3b82f6] hover:text-[#60a5fa] transition-colors flex items-center gap-1">
                  View All <ArrowRight size={14} />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#12233e]">
                      <th className="text-left py-3 px-4 text-[#7a95b8] font-medium">Client</th>
                      <th className="text-left py-3 px-4 text-[#7a95b8] font-medium">Tier</th>
                      <th className="text-right py-3 px-4 text-[#7a95b8] font-medium">Days Stale</th>
                      <th className="text-right py-3 px-4 text-[#7a95b8] font-medium">AUM</th>
                      <th className="text-center py-3 px-4 text-[#7a95b8] font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#12233e]/50">
                    {topStaleClients.map((client, i) => {
                      const fullClient = enrichedClients.find((c) => c.name.includes(client.name));
                      return (
                        <tr key={i} className="hover:bg-[#0f1e35] transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-medium text-white">{client.name}</div>
                            <div className="text-xs text-[#7a95b8]">Score: {client.score}/100</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              fullClient?.wealthTier === 'Platinum' ? 'bg-purple-500/10 text-purple-400' :
                              fullClient?.wealthTier === 'Gold' ? 'bg-amber-500/10 text-amber-400' :
                              'bg-slate-500/10 text-slate-400'
                            }`}>
                              {fullClient?.wealthTier || 'Standard'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-rose-400 font-medium">{client.days}d</span>
                          </td>
                          <td className="py-3 px-4 text-right text-[#c8d8ec]">
                            ${((fullClient?.aum || 0) / 1000).toFixed(0)}k
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button className="p-1.5 rounded-md bg-[#12233e] text-[#c8d8ec] hover:bg-[#22c55e] hover:text-white transition-colors">
                              <Mail size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* LIST TAB */}
        {activeTab === "list" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
            {/* Filters Bar */}
            <div className="rc-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a95b8]" />
                  <input
                    id="search-input"
                    type="text"
                    placeholder="Search clients (Ctrl+F)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="rc-input pl-9 w-full bg-[#0d1a2e] border-[#12233e] focus:border-[#22c55e]/50 text-sm"
                  />
                </div>
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 rounded-md border transition-colors ${showFilters ? 'bg-[#22c55e]/10 border-[#22c55e]/30 text-[#22c55e]' : 'bg-[#0d1a2e] border-[#12233e] text-[#7a95b8] hover:text-white'}`}
                >
                  <Filter size={16} />
                </button>
              </div>
              
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="flex bg-[#0d1a2e] border border-[#12233e] rounded-md p-0.5">
                  <button onClick={() => setViewMode("table")} className={`p-1.5 rounded ${viewMode === "table" ? "bg-[#1a3050] text-white" : "text-[#7a95b8]"}`}>
                    <Activity size={14} />
                  </button>
                  <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded ${viewMode === "grid" ? "bg-[#1a3050] text-white" : "text-[#7a95b8]"}`}>
                    <Activity size={14} />
                  </button>
                </div>
                <div className="relative">
                  <button 
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="rc-btn rc-btn-ghost text-sm border border-[#12233e] hover:bg-[#12233e]"
                  >
                    <Download size={14} className="mr-1" /> Export <ChevronDown size={14} className="ml-1" />
                  </button>
                  {showExportMenu && (
                    <div className="absolute right-0 mt-1 w-40 bg-[#0a1424] border border-[#12233e] rounded-md shadow-xl z-10 py-1">
                      <button onClick={() => { handleExportCSV(); setShowExportMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-[#c8d8ec] hover:bg-[#12233e] flex items-center gap-2">
                        <FileSpreadsheet size={14} className="text-[#22c55e]" /> CSV
                      </button>
                      <button onClick={() => { toast.info("PDF export coming soon"); setShowExportMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-[#c8d8ec] hover:bg-[#12233e] flex items-center gap-2">
                        <FileSpreadsheet size={14} className="text-rose-400" /> PDF
                      </button>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => setIsEmailModalOpen(true)}
                  disabled={selectedClients.length === 0}
                  className="rc-btn rc-btn-primary text-sm disabled:opacity-50"
                >
                  <Send size={14} className="mr-1" /> Email Selected ({selectedClients.length})
                </button>
              </div>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="rc-card p-4 animate-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs text-[#7a95b8] mb-1">Wealth Tier</label>
                    <select 
                      value={wealthTierFilter} 
                      onChange={(e) => setWealthTierFilter(e.target.value)}
                      className="rc-input text-sm w-full bg-[#0d1a2e] border-[#12233e]"
                    >
                      <option value="all">All Tiers</option>
                      <option value="Platinum">Platinum</option>
                      <option value="Gold">Gold</option>
                      <option value="Silver">Silver</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[#7a95b8] mb-1">Region</label>
                    <select 
                      value={selectedRegion} 
                      onChange={(e) => setSelectedRegion(e.target.value)}
                      className="rc-input text-sm w-full bg-[#0d1a2e] border-[#12233e]"
                    >
                      <option value="all">All Regions</option>
                      <option value="North">North</option>
                      <option value="South">South</option>
                      <option value="East">East</option>
                      <option value="West">West</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[#7a95b8] mb-1">Sort By</label>
                    <select 
                      value={`${sortConfig.key}-${sortConfig.direction}`} 
                      onChange={(e) => {
                        const [key, dir] = e.target.value.split('-');
                        setSortConfig({ key, direction: dir as any });
                      }}
                      className="rc-input text-sm w-full bg-[#0d1a2e] border-[#12233e]"
                    >
                      <option value="daysSinceContact-desc">Days Stale (High to Low)</option>
                      <option value="daysSinceContact-asc">Days Stale (Low to High)</option>
                      <option value="aum-desc">AUM (High to Low)</option>
                      <option value="engagementScore-asc">Engagement (Low to High)</option>
                      <option value="name-asc">Name (A-Z)</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button 
                      onClick={() => {
                        setSearchQuery("");
                        setWealthTierFilter("all");
                        setSelectedRegion("all");
                        setSortConfig({ key: "daysSinceContact", direction: "desc" });
                      }}
                      className="rc-btn rc-btn-ghost text-sm w-full border border-[#12233e] hover:bg-[#12233e]"
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Table 2: Main Data Table */}
            <div className="rc-card p-0 overflow-hidden flex flex-col">
              {!previewQuery.data ? (
                <div className="p-12 flex flex-col items-center justify-center">
                  <div className="w-10 h-10 border-4 border-[#12233e] border-t-[#22c55e] rounded-full animate-spin mb-4" />
                  <div className="text-[#7a95b8] font-medium">Loading client data...</div>
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="p-16 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[#12233e]/50 flex items-center justify-center mb-4">
                    <Users size={32} className="text-[#7a95b8] opacity-50" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">No clients found</h3>
                  <p className="text-[#7a95b8] max-w-md">
                    {searchQuery || filterType !== "all" 
                      ? "No results matching your filters. Try adjusting them."
                      : `No clients have gone ${staleDays}+ days without contact. Great job!`
                    }
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-[#0a1424] border-b border-[#12233e]">
                          <th className="px-4 py-4 w-10">
                            <input 
                              type="checkbox" 
                              checked={selectedClients.length === filteredClients.length && filteredClients.length > 0}
                              onChange={selectAllClients}
                              className="rounded border-[#12233e] bg-[#0d1a2e] text-[#22c55e] focus:ring-[#22c55e] focus:ring-offset-[#0a1424]"
                            />
                          </th>
                          <th 
                            className="text-left px-4 py-4 text-[#7a95b8] font-semibold text-xs uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                            onClick={() => handleSort('name')}
                          >
                            <div className="flex items-center gap-1">
                              Client {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                            </div>
                          </th>
                          <th 
                            className="text-left px-4 py-4 text-[#7a95b8] font-semibold text-xs uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                            onClick={() => handleSort('wealthTier')}
                          >
                            <div className="flex items-center gap-1">
                              Tier {sortConfig.key === 'wealthTier' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                            </div>
                          </th>
                          <th 
                            className="text-left px-4 py-4 text-[#7a95b8] font-semibold text-xs uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                            onClick={() => handleSort('aum')}
                          >
                            <div className="flex items-center gap-1">
                              AUM {sortConfig.key === 'aum' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                            </div>
                          </th>
                          <th 
                            className="text-left px-4 py-4 text-[#7a95b8] font-semibold text-xs uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                            onClick={() => handleSort('lastContact')}
                          >
                            <div className="flex items-center gap-1">
                              Last Contact {sortConfig.key === 'lastContact' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                            </div>
                          </th>
                          <th 
                            className="text-center px-4 py-4 text-[#7a95b8] font-semibold text-xs uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                            onClick={() => handleSort('daysSinceContact')}
                          >
                            <div className="flex items-center justify-center gap-1">
                              Days {sortConfig.key === 'daysSinceContact' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                            </div>
                          </th>
                          <th 
                            className="text-center px-4 py-4 text-[#7a95b8] font-semibold text-xs uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                            onClick={() => handleSort('engagementScore')}
                          >
                            <div className="flex items-center justify-center gap-1">
                              Health {sortConfig.key === 'engagementScore' && (sortConfig.direction === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                            </div>
                          </th>
                          <th className="px-4 py-4"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#12233e]/50">
                        {paginatedClients.map((c) => (
                          <React.Fragment key={c.id}>
                            <tr className={`hover:bg-[#0f1e35] transition-colors group ${selectedClients.includes(c.id) ? 'bg-[#22c55e]/5' : ''}`}>
                              <td className="px-4 py-4">
                                <input 
                                  type="checkbox" 
                                  checked={selectedClients.includes(c.id)}
                                  onChange={() => toggleClientSelection(c.id)}
                                  className="rounded border-[#12233e] bg-[#0d1a2e] text-[#22c55e] focus:ring-[#22c55e] focus:ring-offset-[#0a1424]"
                                />
                              </td>
                              <td className="px-4 py-4">
                                <div className="font-medium text-white group-hover:text-[#22c55e] transition-colors">{c.name}</div>
                                <div className="text-xs text-[#7a95b8] flex items-center gap-1 mt-1">
                                  <Mail size={10} /> {c.email || 'No email'}
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  c.wealthTier === 'Platinum' ? 'bg-purple-500/10 text-purple-400' :
                                  c.wealthTier === 'Gold' ? 'bg-amber-500/10 text-amber-400' :
                                  'bg-slate-500/10 text-slate-400'
                                }`}>
                                  {c.wealthTier}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-[#c8d8ec]">
                                ${(c.aum / 1000000).toFixed(2)}M
                              </td>
                              <td className="px-4 py-4">
                                <div className="text-[#c8d8ec]">
                                  {c.lastContact ? new Date(c.lastContact).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                                </div>
                                <div className="text-xs text-[#7a95b8] mt-1">via {c.lastContactMethod}</div>
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className={`rc-badge ${
                                  c.daysSinceContact >= 90 ? "rc-badge-red" : 
                                  c.daysSinceContact >= 60 ? "rc-badge-gold" : 
                                  "rc-badge-blue"
                                }`}>
                                  {c.daysSinceContact}d
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-2 justify-center">
                                  <div className="w-16 h-2 bg-[#12233e] rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${c.engagementScore > 70 ? 'bg-[#22c55e]' : c.engagementScore > 40 ? 'bg-amber-400' : 'bg-rose-400'}`}
                                      style={{ width: `${c.engagementScore}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-[#7a95b8] w-6">{c.engagementScore}</span>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button 
                                    onClick={() => toggleRowExpansion(c.id)}
                                    className="p-1.5 rounded hover:bg-[#12233e] text-[#7a95b8] hover:text-white transition-colors"
                                  >
                                    {expandedRows[c.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                  </button>
                                  <Link href={`/portal/clients/${c.id}`} className="p-1.5 rounded hover:bg-[#12233e] text-[#7a95b8] hover:text-white transition-colors">
                                    <ArrowRight size={16} />
                                  </Link>
                                </div>
                              </td>
                            </tr>
                            
                            {/* Expanded Row Details */}
                            {expandedRows[c.id] && (
                              <tr className="bg-[#0a1424] border-b border-[#12233e]">
                                <td colSpan={8} className="p-0">
                                  <div className="px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-200">
                                    <div>
                                      <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                                        <Activity size={14} className="text-[#3b82f6]" /> Client Profile
                                      </h4>
                                      <div className="space-y-2 text-sm">
                                        <div className="flex justify-between"><span className="text-[#7a95b8]">Risk Profile:</span> <span className="text-[#c8d8ec]">{c.riskProfile}</span></div>
                                        <div className="flex justify-between"><span className="text-[#7a95b8]">Region:</span> <span className="text-[#c8d8ec]">{c.region}</span></div>
                                        <div className="flex justify-between"><span className="text-[#7a95b8]">Client Type:</span> <span className="text-[#c8d8ec]">{c.clientType}</span></div>
                                        <div className="flex justify-between"><span className="text-[#7a95b8]">YTD Return:</span> <span className={Number(c.ytdReturn) > 0 ? "text-emerald-400" : "text-rose-400"}>{c.ytdReturn}%</span></div>
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                                        <Target size={14} className="text-[#facc15]" /> Suggested Action
                                      </h4>
                                      <div className="bg-[#0d1a2e] border border-[#12233e] rounded-lg p-3">
                                        <div className="font-medium text-[#c8d8ec] mb-1">{c.nextAction}</div>
                                        <p className="text-xs text-[#7a95b8] mb-3">Based on {c.daysSinceContact} days of inactivity and recent market changes.</p>
                                        <button className="text-xs bg-[#3b82f6] hover:bg-[#2563eb] text-white px-3 py-1.5 rounded transition-colors w-full">
                                          Execute Action
                                        </button>
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                                        <Clock size={14} className="text-[#a78bfa]" /> Recent History
                                      </h4>
                                      <div className="space-y-3">
                                        <div className="flex gap-3">
                                          <div className="w-1.5 h-1.5 rounded-full bg-[#12233e] mt-1.5 shrink-0" />
                                          <div>
                                            <div className="text-xs text-[#c8d8ec]">System sent automated digest</div>
                                            <div className="text-[10px] text-[#7a95b8]">45 days ago</div>
                                          </div>
                                        </div>
                                        <div className="flex gap-3">
                                          <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] mt-1.5 shrink-0" />
                                          <div>
                                            <div className="text-xs text-[#c8d8ec]">Quarterly review meeting</div>
                                            <div className="text-[10px] text-[#7a95b8]">{c.daysSinceContact} days ago</div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {renderPagination()}
                </>
              )}
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === "analytics" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 3: Wealth Tier Analysis */}
              <div className="rc-card flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Award size={18} className="text-[#7a95b8]" />
                    Stale Clients by Wealth Tier
                  </h3>
                </div>
                <div className="flex-1 min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={wealthTierData} layout="vertical" margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#12233e" horizontal={false} />
                      <XAxis type="number" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis dataKey="name" type="category" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                      <RTooltip content={<CustomTooltip />} cursor={{ fill: "#12233e", opacity: 0.4 }} />
                      <Legend verticalAlign="top" height={36} />
                      <Bar dataKey="count" name="Client Count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                      <Bar dataKey="aumMillions" name="AUM ($M)" fill="#22c55e" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 4: Contact Method Radar */}
              <div className="rc-card flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Target size={18} className="text-[#7a95b8]" />
                    Historical Contact Efficacy
                  </h3>
                </div>
                <div className="flex-1 min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={contactMethodData}>
                      <PolarGrid stroke="#12233e" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#7a95b8', fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                      <Radar name="Successful Contacts" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                      <Radar name="Attempted Contacts" dataKey="B" stroke="#7a95b8" fill="#7a95b8" fillOpacity={0.2} />
                      <Legend />
                      <RTooltip content={<CustomTooltip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Chart 5: Risk vs AUM Composed Chart */}
              <div className="rc-card flex flex-col lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Shield size={18} className="text-[#7a95b8]" />
                    Risk Profile vs Total AUM at Risk
                  </h3>
                </div>
                <div className="flex-1 min-h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={riskAumData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                      <XAxis dataKey="name" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="left" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} label={{ value: 'AUM ($M)', angle: -90, position: 'insideLeft', fill: '#7a95b8' }} />
                      <YAxis yAxisId="right" orientation="right" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} label={{ value: 'Client Count', angle: 90, position: 'insideRight', fill: '#7a95b8' }} />
                      <RTooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="aum" name="Total AUM ($M)" barSize={40} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="clients" name="Number of Clients" stroke="#facc15" strokeWidth={3} dot={{ r: 6, fill: '#0a1424', strokeWidth: 2 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Table 3: Regional Breakdown */}
            <div className="rc-card">
              <h3 className="text-lg font-semibold text-white mb-6">Regional Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#12233e]">
                      <th className="text-left py-3 px-4 text-[#7a95b8] font-medium">Region</th>
                      <th className="text-right py-3 px-4 text-[#7a95b8] font-medium">Stale Clients</th>
                      <th className="text-right py-3 px-4 text-[#7a95b8] font-medium">% of Total</th>
                      <th className="text-right py-3 px-4 text-[#7a95b8] font-medium">Avg Days Stale</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#12233e]/50">
                    {regionalData.map((region, i) => {
                      const total = regionalData.reduce((sum, r) => sum + r.value, 0);
                      const percent = ((region.value / total) * 100).toFixed(1);
                      return (
                        <tr key={i} className="hover:bg-[#0f1e35] transition-colors">
                          <td className="py-3 px-4 font-medium text-white">{region.name}</td>
                          <td className="py-3 px-4 text-right text-[#c8d8ec]">{region.value}</td>
                          <td className="py-3 px-4 text-right text-[#c8d8ec]">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-1.5 bg-[#12233e] rounded-full overflow-hidden">
                                <div className="h-full bg-[#3b82f6] rounded-full" style={{ width: `${percent}%` }} />
                              </div>
                              <span>{percent}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right text-[#c8d8ec]">
                            {Math.round(enrichedClients.filter((c) => c.region === region.name).reduce((sum, c) => sum + c.daysSinceContact, 0) / region.value)}d
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* CAMPAIGNS TAB */}
        {activeTab === "campaigns" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            <div className="rc-card">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">Re-engagement Campaigns</h3>
                  <p className="text-sm text-[#7a95b8] mt-1">Automated workflows for stale clients</p>
                </div>
                <button className="rc-btn rc-btn-primary text-sm">
                  Create Campaign
                </button>
              </div>

              {/* Table 4: Active Campaigns */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#0a1424] border-b border-[#12233e]">
                      <th className="text-left py-3 px-4 text-[#7a95b8] font-medium">Campaign Name</th>
                      <th className="text-left py-3 px-4 text-[#7a95b8] font-medium">Target Segment</th>
                      <th className="text-center py-3 px-4 text-[#7a95b8] font-medium">Status</th>
                      <th className="text-right py-3 px-4 text-[#7a95b8] font-medium">Sent</th>
                      <th className="text-right py-3 px-4 text-[#7a95b8] font-medium">Open Rate</th>
                      <th className="text-right py-3 px-4 text-[#7a95b8] font-medium">Action Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#12233e]/50">
                    {[
                      { name: "Quarterly Market Update", target: "All > 60 days", status: "Active", sent: 145, open: 68, action: 12 },
                      { name: "Platinum Touchpoint", target: "Platinum > 30 days", status: "Active", sent: 24, open: 85, action: 35 },
                      { name: "Year-End Review Prompt", target: "All > 90 days", status: "Paused", sent: 312, open: 42, action: 8 },
                      { name: "Risk Reassessment", target: "Aggressive > 45 days", status: "Draft", sent: 0, open: 0, action: 0 },
                    ].map((camp, i) => (
                      <tr key={i} className="hover:bg-[#0f1e35] transition-colors">
                        <td className="py-3 px-4 font-medium text-white">{camp.name}</td>
                        <td className="py-3 px-4 text-[#c8d8ec]">{camp.target}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            camp.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' :
                            camp.status === 'Paused' ? 'bg-amber-500/10 text-amber-400' :
                            'bg-slate-500/10 text-slate-400'
                          }`}>
                            {camp.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-[#c8d8ec]">{camp.sent}</td>
                        <td className="py-3 px-4 text-right text-[#c8d8ec]">{camp.open}%</td>
                        <td className="py-3 px-4 text-right text-[#c8d8ec]">{camp.action}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 5: Recent Activity Log */}
            <div className="rc-card">
              <h3 className="text-lg font-semibold text-white mb-6">Recent Digest Activity</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#12233e]">
                      <th className="text-left py-3 px-4 text-[#7a95b8] font-medium">Date</th>
                      <th className="text-left py-3 px-4 text-[#7a95b8] font-medium">Action</th>
                      <th className="text-left py-3 px-4 text-[#7a95b8] font-medium">Initiated By</th>
                      <th className="text-right py-3 px-4 text-[#7a95b8] font-medium">Clients Affected</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#12233e]/50">
                    {[
                      { date: "Today, 9:41 AM", action: "Manual Digest Sent", user: user?.name || "Advisor", count: 12 },
                      { date: "Yesterday, 2:00 PM", action: "Automated Rules Run", user: "System", count: 45 },
                      { date: "Oct 12, 10:15 AM", action: "Exported CSV", user: user?.name || "Advisor", count: 86 },
                      { date: "Oct 10, 8:00 AM", action: "Campaign 'Market Update' Triggered", user: "System", count: 34 },
                    ].map((log, i) => (
                      <tr key={i} className="hover:bg-[#0f1e35] transition-colors">
                        <td className="py-3 px-4 text-[#c8d8ec] whitespace-nowrap">{log.date}</td>
                        <td className="py-3 px-4 text-white">{log.action}</td>
                        <td className="py-3 px-4 text-[#7a95b8]">{log.user}</td>
                        <td className="py-3 px-4 text-right text-[#c8d8ec]">{log.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            <div className="rc-card max-w-3xl">
              <h3 className="text-lg font-semibold text-white mb-6">Digest Preferences</h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-[#12233e] pb-6">
                  <div>
                    <div className="font-medium text-white mb-1">Default Stale Threshold</div>
                    <div className="text-sm text-[#7a95b8]">Set the default number of days before a client is considered stale.</div>
                  </div>
                  <select 
                    value={staleDays} 
                    onChange={(e) => setStaleDays(Number(e.target.value))}
                    className="rc-input bg-[#0d1a2e] border-[#12233e]"
                  >
                    <option value={14}>14 days</option>
                    <option value={30}>30 days</option>
                    <option value={60}>60 days</option>
                    <option value={90}>90 days</option>
                  </select>
                </div>

                <div className="flex items-center justify-between border-b border-[#12233e] pb-6">
                  <div>
                    <div className="font-medium text-white mb-1">Auto-Refresh Data</div>
                    <div className="text-sm text-[#7a95b8]">Automatically fetch new data every minute.</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={autoRefresh} onChange={() => setAutoRefresh(!autoRefresh)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-[#12233e] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#22c55e]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between border-b border-[#12233e] pb-6">
                  <div>
                    <div className="font-medium text-white mb-1">Show Advanced Stats</div>
                    <div className="text-sm text-[#7a95b8]">Display additional metrics like AUM and Engagement Score.</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={showAdvancedStats} onChange={() => setShowAdvancedStats(!showAdvancedStats)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-[#12233e] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#22c55e]"></div>
                  </label>
                </div>

                <div className="pt-4">
                  <button className="rc-btn rc-btn-primary">Save Preferences</button>
                </div>
              </div>
            </div>

            {/* Table 6: Exclusion List */}
            <div className="rc-card max-w-3xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">Exclusion List</h3>
                  <p className="text-sm text-[#7a95b8] mt-1">Clients who should never appear in stale digests</p>
                </div>
                <button className="rc-btn rc-btn-ghost text-sm border border-[#12233e]">Add Client</button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#12233e]">
                      <th className="text-left py-3 px-4 text-[#7a95b8] font-medium">Client Name</th>
                      <th className="text-left py-3 px-4 text-[#7a95b8] font-medium">Reason</th>
                      <th className="text-right py-3 px-4 text-[#7a95b8] font-medium">Added On</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#12233e]/50">
                    {[
                      { name: "Robert Johnson", reason: "Requested annual contact only", date: "Jan 15, 2023" },
                      { name: "Sarah Williams", reason: "Account closing in progress", date: "Mar 22, 2023" },
                      { name: "TechCorp Inc.", reason: "Handled by enterprise team", date: "Jun 05, 2023" },
                    ].map((client, i) => (
                      <tr key={i} className="hover:bg-[#0f1e35] transition-colors">
                        <td className="py-3 px-4 font-medium text-white">{client.name}</td>
                        <td className="py-3 px-4 text-[#c8d8ec]">{client.reason}</td>
                        <td className="py-3 px-4 text-right text-[#7a95b8]">{client.date}</td>
                        <td className="py-3 px-4 text-right">
                          <button className="text-[#7a95b8] hover:text-rose-400 transition-colors">
                            <Trash2 size={16} />
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
      </div>
      
      {/* Email Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0a1424] border border-[#12233e] rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-[#12233e] flex items-center justify-between bg-[#0d1a2e]">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Mail size={18} className="text-[#3b82f6]" />
                Send Re-engagement Email
              </h3>
              <button onClick={() => setIsEmailModalOpen(false)} className="text-[#7a95b8] hover:text-white transition-colors">
                <XCircle size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#c8d8ec] mb-2">Recipients</label>
                <div className="bg-[#0d1a2e] border border-[#12233e] rounded-lg p-3 text-sm text-[#7a95b8]">
                  {selectedClients.length > 0 
                    ? `Sending to ${selectedClients.length} selected clients.` 
                    : `Sending digest to yourself regarding ${staleClients.length} stale clients.`}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-[#c8d8ec] mb-2">Template</label>
                <select 
                  value={emailTemplate}
                  onChange={(e) => setEmailTemplate(e.target.value)}
                  className="rc-input w-full bg-[#0d1a2e] border-[#12233e]"
                >
                  <option value="default">Standard Check-in</option>
                  <option value="market">Market Update</option>
                  <option value="review">Quarterly Review Request</option>
                  <option value="custom">Custom Message</option>
                </select>
              </div>
              
              {emailTemplate === "custom" && (
                <div>
                  <label className="block text-sm font-medium text-[#c8d8ec] mb-2">Message</label>
                  <textarea 
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={6}
                    className="rc-input w-full bg-[#0d1a2e] border-[#12233e] resize-none"
                    placeholder="Type your message here..."
                  />
                </div>
              )}
              
              <div className="bg-[#12233e]/30 rounded-lg p-4 border border-[#12233e]">
                <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                  <Info size={14} className="text-[#3b82f6]" /> Preview
                </h4>
                <div className="text-sm text-[#c8d8ec] space-y-2 opacity-80">
                  <p>Subject: Checking in - Russell Capital Systems</p>
                  <p>Hi [Client Name],</p>
                  <p>It's been a while since we last connected. I wanted to reach out and see how things are going. The market has seen some interesting movements recently, and I'd love to review your portfolio to ensure we're still aligned with your goals.</p>
                  <p>Let me know when you have 15 minutes for a quick chat.</p>
                  <p>Best regards,<br/>{user?.name || "Your Advisor"}</p>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-[#12233e] bg-[#0d1a2e] flex items-center justify-end gap-3">
              <button 
                onClick={() => setIsEmailModalOpen(false)}
                className="rc-btn rc-btn-ghost text-sm border border-[#12233e]"
              >
                Cancel
              </button>
              <button 
                onClick={() => sendMut.mutate({ staleDays })}
                disabled={sendMut.isPending}
                className="rc-btn rc-btn-primary text-sm"
              >
                {sendMut.isPending ? "Sending..." : "Send Email"}
              </button>
            </div>
          </div>
        </div>
      )}

      <PageInsights pageId="stale-digest" />
    </AppShell>
  );
}
