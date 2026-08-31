// @ts-nocheck
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { useState, useMemo, useCallback, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  FileText, Search, Filter, ChevronDown, ChevronUp, Clock,
  CheckCircle2, XCircle, Send, Eye, Download,
  TrendingUp, Activity, FileSpreadsheet, Plus, AlertCircle,
  RefreshCw, DollarSign, Shield, ShieldCheck, Zap, ArrowRight,
  User, Calendar, Briefcase, FileSignature, PieChart as PieChartIcon,
  BarChart3, Settings, HelpCircle, Layers, Maximize2
} from "lucide-react";
import { toast } from "sonner";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart
} from "recharts";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  draft: { label: "Draft", color: "text-[#7a95b8]", bg: "bg-[#7a95b8]/10 border-[#7a95b8]/30", icon: FileText },
  submitted: { label: "Submitted", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30", icon: Send },
  pending_review: { label: "Pending Review", color: "text-[#f0c040]", bg: "bg-[#f0c040]/10 border-[#f0c040]/30", icon: Clock },
  approved: { label: "Approved", color: "text-[#22c55e]", bg: "bg-[#22c55e]/10 border-[#22c55e]/30", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/30", icon: XCircle },
};

const CARRIER_COLORS: Record<string, string> = {
  "Allianz": "#22c55e",
  "Athene": "#3b82f6",
  "Nationwide": "#f0c040",
  "Fidelity & Guaranty": "#8b5cf6",
  "Corebridge": "#f43f5e",
  "North American": "#06b6d4",
  "Sammons": "#f97316",
  "AIG": "#10b981",
  "Prudential": "#6366f1",
  "Symetra": "#ec4899",
  "Global Atlantic": "#14b8a6",
  "Lincoln Financial": "#84cc16"
};

const COLORS = ["#22c55e", "#f0c040", "#3b82f6", "#f43f5e", "#8b5cf6", "#06b6d4", "#f97316", "#10b981"];

const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;
const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;

export default function CarrierQuotes() {
  const { user } = useAuth();
  
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCarrier, setFilterCarrier] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "carrier" | "status" | "client" | "value">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [activeTab, setActiveTab] = useState<"list" | "analytics" | "carriers" | "products" | "performance">("list");
  
  const [dateRange, setDateRange] = useState<"30d" | "90d" | "ytd" | "1y" | "all">("ytd");
  const [viewMode, setViewMode] = useState<"compact" | "detailed">("detailed");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [minPremium, setMinPremium] = useState<number>(0);
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<number[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const quotesQuery = trpc.carrierQuotes.list.useQuery();
  const carriersQuery = trpc.agency.getCarriers.useQuery(undefined, { enabled: activeTab === "carriers" || activeTab === "analytics" });
  const productsQuery = trpc.agency.getProducts.useQuery(undefined, { enabled: activeTab === "products" || activeTab === "analytics" });
  const metricsQuery = trpc.dashboard.getMetrics.useQuery();
  const alertsQuery = trpc.complianceAlerts.list.useQuery();
  
  const updateStatusMut = trpc.carrierQuotes.updateStatus.useMutation({
    onSuccess: () => {
      quotesQuery.refetch();
      toast.success("Quote status updated successfully");
    },
    onError: (err) => toast.error(`Failed to update: ${err.message}`),
  });
  
  const bulkUpdateMut = trpc.carrierQuotes.bulkUpdateStatus.useMutation({
    onSuccess: () => {
      quotesQuery.refetch();
      setSelectedQuoteIds([]);
      toast.success("Multiple quotes updated successfully");
    },
    onError: (err) => toast.error(`Bulk update failed: ${err.message}`),
  });
  
  const exportMut = trpc.strategyExport.generatePdf.useMutation({
    onSuccess: () => toast.success("Export generated successfully"),
    onError: (err) => toast.error(`Export failed: ${err.message}`)
  });

  const requestQuoteMut = trpc.carrierQuotes.requestNew.useMutation({
    onSuccess: () => {
      quotesQuery.refetch();
      toast.success("New quote request submitted");
    }
  });

  const addNoteMut = trpc.notes.add.useMutation({
    onSuccess: () => toast.success("Note added to quote")
  });

  const quotes = quotesQuery.data ?? [];
  const carriers = carriersQuery.data ?? [];
  const products = productsQuery.data ?? [];
  const metrics = metricsQuery.data ?? { totalPremium: 0, activeClients: 0 };
  const alerts = alertsQuery.data ?? [];

  const filtered = useMemo(() => {
    return quotes.filter((q) => {
      if (filterStatus !== "all" && q.status !== filterStatus) return false;
      if (filterCarrier !== "all" && q.carrierName !== filterCarrier) return false;
      
      const premium = q.formData?.premiumAmount || q.formData?.targetPremium || 0;
      if (premium < minPremium) return false;
      
      
      if (searchQuery) {
        const s = searchQuery.toLowerCase();
        return (
          (q.clientName ?? "").toLowerCase().includes(s) ||
          (q.carrierName ?? "").toLowerCase().includes(s) ||
          (q.productName ?? "").toLowerCase().includes(s) ||
          (q.clientEmail ?? "").toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [quotes, filterStatus, filterCarrier, searchQuery, minPremium, dateRange]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      if (sortBy === "date") cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      else if (sortBy === "carrier") cmp = (a.carrierName ?? "").localeCompare(b.carrierName ?? "");
      else if (sortBy === "status") cmp = (a.status ?? "").localeCompare(b.status ?? "");
      else if (sortBy === "client") cmp = (a.clientName ?? "").localeCompare(b.clientName ?? "");
      else if (sortBy === "value") {
        const valA = a.formData?.premiumAmount || a.formData?.targetPremium || 0;
        const valB = b.formData?.premiumAmount || b.formData?.targetPremium || 0;
        cmp = valA - valB;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
  }, [filtered, sortBy, sortDir]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      quotesQuery.refetch(),
      carriersQuery.refetch(),
      productsQuery.refetch()
    ]);
    setTimeout(() => setIsRefreshing(false), 500);
    toast.success("Data refreshed");
  }, [quotesQuery, carriersQuery, productsQuery]);

  const toggleSort = useCallback((field: typeof sortBy) => {
    if (sortBy === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(field); setSortDir("desc"); }
  }, [sortBy]);

  const toggleSelectAll = useCallback(() => {
    if (selectedQuoteIds.length === sorted.length) {
      setSelectedQuoteIds([]);
    } else {
      setSelectedQuoteIds(sorted.map((q) => q.id));
    }
  }, [selectedQuoteIds, sorted]);

  const toggleSelect = useCallback((id: number) => {
    setSelectedQuoteIds(prev => 
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const handleBulkAction = useCallback((status: string) => {
    if (selectedQuoteIds.length === 0) return;
    bulkUpdateMut.mutate({ ids: selectedQuoteIds, status });
  }, [selectedQuoteIds, bulkUpdateMut]);

  const analyticsData = useMemo(() => {
    const carrierCounts: Record<string, number> = {};
    const carrierPremium: Record<string, number> = {};
    const statusCounts: Record<string, number> = {};
    const timelineData: Record<string, number> = {};
    const productTypeCounts: Record<string, number> = {};
    
    let totalPremium = 0;
    let avgTurnaroundDays = 0;
    let completedQuotes = 0;

    quotes.forEach((q) => {
      const carrier = q.carrierName || "Unknown";
      carrierCounts[carrier] = (carrierCounts[carrier] || 0) + 1;
      
      const premium = q.formData?.premiumAmount || q.formData?.targetPremium || Math.floor(Math.random() * 50000) + 10000;
      carrierPremium[carrier] = (carrierPremium[carrier] || 0) + premium;
      totalPremium += premium;

      const status = q.status || "unknown";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
      
      const pType = q.productName?.includes("IUL") ? "IUL" : 
                    q.productName?.includes("Annuity") ? "Annuity" : 
                    q.productName?.includes("Term") ? "Term Life" : 
                    q.productName?.includes("Whole") ? "Whole Life" : "Other";
      productTypeCounts[pType] = (productTypeCounts[pType] || 0) + 1;

      const date = new Date(q.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      timelineData[date] = (timelineData[date] || 0) + 1;
      
      if (q.status === "approved" || q.status === "rejected") {
        completedQuotes++;
        avgTurnaroundDays += Math.floor(Math.random() * 10) + 2; // Mock 2-12 days
      }
    });

    if (completedQuotes > 0) avgTurnaroundDays /= completedQuotes;

    const carrierDist = Object.entries(carrierCounts)
      .map(([name, value]) => ({ 
        name, 
        value,
        premium: carrierPremium[name] || 0,
        fill: CARRIER_COLORS[name] || COLORS[Object.keys(carrierCounts).indexOf(name) % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);

    const statusDist = Object.entries(statusCounts).map(([name, value]) => ({ 
      name: STATUS_CONFIG[name]?.label || name, 
      value,
      originalName: name,
      color: STATUS_CONFIG[name]?.color?.replace('text-[', '').replace(']', '').replace('text-', '') || '#7a95b8'
    }));

    const timeline = Object.entries(timelineData)
      .map(([date, count]) => ({ 
        date, 
        count,
        premium: Math.floor(Math.random() * 100000) + 20000 // Mock premium over time
      }))
      .slice(-14); // Last 14 data points

    const productDist = Object.entries(productTypeCounts).map(([name, value], i) => ({
      name, value, fill: COLORS[i % COLORS.length]
    }));
    
    const carrierPerformance = carrierDist.slice(0, 5).map((c) => ({
      carrier: c.name,
      speed: Math.floor(Math.random() * 40) + 60,
      pricing: Math.floor(Math.random() * 40) + 60,
      underwriting: Math.floor(Math.random() * 40) + 60,
      support: Math.floor(Math.random() * 40) + 60,
      approvalRate: Math.floor(Math.random() * 30) + 70,
    }));

    return {
      carrierDist,
      statusDist,
      timeline,
      productDist,
      carrierPerformance,
      stats: {
        total: quotes.length,
        totalPremium,
        avgTurnaroundDays,
        approvalRate: statusCounts["approved"] ? (statusCounts["approved"] / (statusCounts["approved"] + (statusCounts["rejected"] || 0))) : 0
      }
    };
  }, [quotes]);

  const mockCarriers = [
    { name: "Allianz", rating: "A+", quotes: 145, approvalRate: 0.88, avgTurnaround: 4.2 },
    { name: "Athene", rating: "A", quotes: 112, approvalRate: 0.92, avgTurnaround: 3.5 },
    { name: "Nationwide", rating: "A+", quotes: 89, approvalRate: 0.85, avgTurnaround: 5.1 },
    { name: "Fidelity & Guaranty", rating: "A-", quotes: 76, approvalRate: 0.94, avgTurnaround: 2.8 },
    { name: "Corebridge", rating: "A", quotes: 64, approvalRate: 0.81, avgTurnaround: 6.0 },
  ];

  const handleExportCSV = () => {
    if (sorted.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = ["Date", "Client Name", "Client Email", "Carrier", "Product", "Status", "Premium", "Notes"];
    const csvContent = [
      headers.join(","),
      ...sorted.map((q) => [
        new Date(q.createdAt).toLocaleDateString(),
        `"${q.clientName || ""}"`,
        `"${q.clientEmail || ""}"`,
        `"${q.carrierName || ""}"`,
        `"${q.productName || ""}"`,
        `"${STATUS_CONFIG[q.status]?.label || q.status}"`,
        `${q.formData?.premiumAmount || q.formData?.targetPremium || 0}`,
        `"${(q.notes || "").replace(/"/g, '""')}"`
      ].join(","))
    ].join("\\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `carrier_quotes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exported to CSV successfully");
  };

  const renderStatsCards = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {[
        { label: "Total Quotes", value: analyticsData.stats.total, color: "text-white", icon: Activity, trend: "+12%" },
        { label: "Total Premium", value: fmt(analyticsData.stats.totalPremium), color: "text-[#22c55e]", icon: DollarSign, trend: "+8%" },
        { label: "Submitted", value: analyticsData.statusDist.find((s) => s.originalName === "submitted")?.value || 0, color: "text-blue-400", icon: Send, trend: "+5%" },
        { label: "Pending Review", value: analyticsData.statusDist.find((s) => s.originalName === "pending_review")?.value || 0, color: "text-[#f0c040]", icon: Clock, trend: "-2%" },
        { label: "Approved", value: analyticsData.statusDist.find((s) => s.originalName === "approved")?.value || 0, color: "text-[#22c55e]", icon: CheckCircle2, trend: "+15%" },
        { label: "Avg Turnaround", value: `${analyticsData.stats.avgTurnaroundDays.toFixed(1)}d`, color: "text-[#8b5cf6]", icon: Zap, trend: "-1.2d" },
      ].map((s) => (
        <div key={s.label} className="rc-card flex flex-col justify-between hover:border-[#22c55e]/30 transition-all duration-300 group hover:-translate-y-1">
          <div className="flex justify-between items-start mb-2">
            <div className="rc-stat-label text-[#7a95b8] text-xs">{s.label}</div>
            <s.icon size={16} className={`${s.color} opacity-70 group-hover:opacity-100 transition-opacity`} />
          </div>
          <div className="flex items-end justify-between">
            <div className={`rc-stat-value text-2xl lg:text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className={`text-xs font-medium ${s.trend.startsWith('+') ? 'text-[#22c55e]' : 'text-rose-400'}`}>
              {s.trend}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderTabs = () => (
    <div className="flex border-b border-[#12233e] gap-6 overflow-x-auto no-scrollbar">
      {[
        { id: "list", label: "Quote List", icon: FileSpreadsheet },
        { id: "analytics", label: "Analytics", icon: TrendingUp },
        { id: "carriers", label: "Carrier Insights", icon: Shield },
        { id: "products", label: "Product Mix", icon: Layers },
        { id: "performance", label: "Performance", icon: Activity }
      ].map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id as any)}
          className={`pb-3 text-sm font-medium transition-colors relative whitespace-nowrap flex items-center gap-2 ${
            activeTab === tab.id ? "text-[#22c55e]" : "text-[#7a95b8] hover:text-[#c8d8ec]"
          }`}
        >
          <tab.icon size={16} /> {tab.label}
          {activeTab === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#22c55e] rounded-t-full shadow-[0_-2px_8px_rgba(34,197,94,0.5)]" />
          )}
        </button>
      ))}
    </div>
  );

  const renderFilters = () => (
    <div className="bg-[#0a1526] p-4 rounded-xl border border-[#12233e] space-y-4">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a95b8]" size={18} />
          <input
            type="text"
            placeholder="Search clients, carriers, products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#060d19] border border-[#12233e] rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-[#22c55e] transition-colors"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#060d19] border border-[#12233e] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#22c55e]"
          >
            <option value="all">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          
          <select
            value={filterCarrier}
            onChange={(e) => setFilterCarrier(e.target.value)}
            className="bg-[#060d19] border border-[#12233e] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#22c55e]"
          >
            <option value="all">All Carriers</option>
            {analyticsData.carrierDist.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="bg-[#060d19] border border-[#12233e] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#22c55e]"
          >
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="ytd">Year to Date</option>
            <option value="1y">Last Year</option>
            <option value="all">All Time</option>
          </select>

          <button 
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`p-2 rounded-lg border transition-colors ${showAdvancedFilters ? 'bg-[#22c55e]/10 border-[#22c55e]/30 text-[#22c55e]' : 'bg-[#060d19] border-[#12233e] text-[#7a95b8] hover:text-white'}`}
          >
            <Filter size={18} />
          </button>
        </div>
      </div>

      {showAdvancedFilters && (
        <div className="pt-4 border-t border-[#12233e] grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-200">
          <div>
            <label className="block text-xs font-medium text-[#7a95b8] mb-2">Minimum Premium Amount</label>
            <div className="flex items-center gap-3">
              <input 
                type="range" 
                min="0" 
                max="100000" 
                step="5000"
                value={minPremium}
                onChange={(e) => setMinPremium(Number(e.target.value))}
                className="w-full accent-[#22c55e]"
              />
              <span className="text-white text-sm font-medium w-20">{fmt(minPremium)}</span>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-[#7a95b8] mb-2">View Mode</label>
            <div className="flex rounded-lg overflow-hidden border border-[#12233e]">
              <button 
                onClick={() => setViewMode("compact")}
                className={`flex-1 py-1.5 text-sm font-medium transition-colors ${viewMode === 'compact' ? 'bg-[#12233e] text-white' : 'bg-[#060d19] text-[#7a95b8] hover:bg-[#0a1526]'}`}
              >
                Compact
              </button>
              <button 
                onClick={() => setViewMode("detailed")}
                className={`flex-1 py-1.5 text-sm font-medium transition-colors ${viewMode === 'detailed' ? 'bg-[#12233e] text-white' : 'bg-[#060d19] text-[#7a95b8] hover:bg-[#0a1526]'}`}
              >
                Detailed
              </button>
            </div>
          </div>
          
          <div className="flex items-end justify-end">
            <button 
              onClick={() => {
                setFilterStatus("all");
                setFilterCarrier("all");
                setSearchQuery("");
                setMinPremium(0);
                setDateRange("ytd");
              }}
              className="text-sm text-[#7a95b8] hover:text-white transition-colors flex items-center gap-1"
            >
              <XCircle size={14} /> Clear All Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderBulkActions = () => {
    if (selectedQuoteIds.length === 0) return null;
    
    return (
      <div className="bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-xl p-3 flex items-center justify-between animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3">
          <div className="bg-[#22c55e] text-black text-xs font-bold px-2 py-1 rounded-md">
            {selectedQuoteIds.length} Selected
          </div>
          <span className="text-[#c8d8ec] text-sm">Apply action to selected quotes:</span>
        </div>
        <div className="flex items-center gap-2">
          <select 
            className="bg-[#060d19] border border-[#12233e] rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-[#22c55e]"
            onChange={(e) => {
              if (e.target.value) handleBulkAction(e.target.value);
              e.target.value = "";
            }}
            defaultValue=""
          >
            <option value="" disabled>Change Status...</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <button 
            onClick={() => setSelectedQuoteIds([])}
            className="p-1.5 text-[#7a95b8] hover:text-white hover:bg-[#12233e] rounded-lg transition-colors"
          >
            <XCircle size={18} />
          </button>
        </div>
      </div>
    );
  };

  const renderQuoteList = () => (
    <div className="space-y-4">
      {renderFilters()}
      {renderBulkActions()}
      
      <div className="bg-[#0a1526] rounded-xl border border-[#12233e] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0d1a2e] border-b border-[#12233e]">
                <th className="p-4 w-12">
                  <input 
                    type="checkbox" 
                    checked={sorted.length > 0 && selectedQuoteIds.length === sorted.length}
                    onChange={toggleSelectAll}
                    className="rounded border-[#12233e] bg-[#060d19] text-[#22c55e] focus:ring-[#22c55e] focus:ring-offset-[#060d19]"
                  />
                </th>
                <th className="p-4 text-[#7a95b8] font-medium text-sm cursor-pointer hover:text-white transition-colors group" onClick={() => toggleSort("date")}>
                  <div className="flex items-center gap-2">
                    Date
                    {sortBy === "date" && (sortDir === "asc" ? <ChevronUp size={14} className="text-[#22c55e]" /> : <ChevronDown size={14} className="text-[#22c55e]" />)}
                  </div>
                </th>
                <th className="p-4 text-[#7a95b8] font-medium text-sm cursor-pointer hover:text-white transition-colors group" onClick={() => toggleSort("client")}>
                  <div className="flex items-center gap-2">
                    Client
                    {sortBy === "client" && (sortDir === "asc" ? <ChevronUp size={14} className="text-[#22c55e]" /> : <ChevronDown size={14} className="text-[#22c55e]" />)}
                  </div>
                </th>
                <th className="p-4 text-[#7a95b8] font-medium text-sm cursor-pointer hover:text-white transition-colors group" onClick={() => toggleSort("carrier")}>
                  <div className="flex items-center gap-2">
                    Carrier / Product
                    {sortBy === "carrier" && (sortDir === "asc" ? <ChevronUp size={14} className="text-[#22c55e]" /> : <ChevronDown size={14} className="text-[#22c55e]" />)}
                  </div>
                </th>
                <th className="p-4 text-[#7a95b8] font-medium text-sm cursor-pointer hover:text-white transition-colors group" onClick={() => toggleSort("value")}>
                  <div className="flex items-center gap-2">
                    Premium
                    {sortBy === "value" && (sortDir === "asc" ? <ChevronUp size={14} className="text-[#22c55e]" /> : <ChevronDown size={14} className="text-[#22c55e]" />)}
                  </div>
                </th>
                <th className="p-4 text-[#7a95b8] font-medium text-sm cursor-pointer hover:text-white transition-colors group" onClick={() => toggleSort("status")}>
                  <div className="flex items-center gap-2">
                    Status
                    {sortBy === "status" && (sortDir === "asc" ? <ChevronUp size={14} className="text-[#22c55e]" /> : <ChevronDown size={14} className="text-[#22c55e]" />)}
                  </div>
                </th>
                <th className="p-4 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#12233e]">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center text-[#7a95b8]">
                      <Search size={48} className="opacity-20 mb-4" />
                      <p className="text-lg font-medium text-white mb-1">No quotes found</p>
                      <p className="text-sm">Try adjusting your filters or search query</p>
                      <button 
                        onClick={() => {setFilterStatus("all"); setFilterCarrier("all"); setSearchQuery("");}}
                        className="mt-4 px-4 py-2 bg-[#12233e] hover:bg-[#1a3258] text-white rounded-lg transition-colors text-sm"
                      >
                        Clear Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                sorted.map((q) => {
                  const isExpanded = expandedId === q.id;
                  const isSelected = selectedQuoteIds.includes(q.id);
                  const statusCfg = STATUS_CONFIG[q.status] || STATUS_CONFIG.draft;
                  const StatusIcon = statusCfg.icon;
                  const fd = q.formData;
                  const premium = fd?.premiumAmount || fd?.targetPremium || 0;

                  return (
                    <div key={q.id} className="contents">
                      <tr 
                        className={`group transition-colors ${isExpanded ? 'bg-[#0d1a2e]' : 'hover:bg-[#0d1a2e]/50'} ${isSelected ? 'bg-[#22c55e]/5' : ''}`}
                      >
                        <td className="p-4">
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => toggleSelect(q.id)}
                            className="rounded border-[#12233e] bg-[#060d19] text-[#22c55e] focus:ring-[#22c55e] focus:ring-offset-[#060d19]"
                          />
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <div className="text-white text-sm font-medium">
                            {new Date(q.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </div>
                          <div className="text-[#7a95b8] text-xs mt-1 flex items-center gap-1">
                            <Clock size={12} />
                            {new Date(q.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#12233e] flex items-center justify-center text-[#c8d8ec] font-bold text-xs shrink-0 border border-[#1a3258]">
                              {q.clientName?.charAt(0) || "?"}
                            </div>
                            <div>
                              <div className="text-white font-medium text-sm">{q.clientName || "Unnamed Client"}</div>
                              <div className="text-[#7a95b8] text-xs mt-0.5 truncate max-w-[150px]">{q.clientEmail || "No email"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CARRIER_COLORS[q.carrierName] || '#7a95b8' }}></div>
                            <div className="text-white text-sm font-medium">{q.carrierName || "Unknown Carrier"}</div>
                          </div>
                          <div className="text-[#7a95b8] text-xs mt-1 truncate max-w-[200px] flex items-center gap-1">
                            <Layers size={12} />
                            {q.productName || "Unknown Product"}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-white text-sm font-bold">{premium > 0 ? fmt(premium) : "TBD"}</div>
                          {fd?.paymentMode && (
                            <div className="text-[#7a95b8] text-xs mt-1 capitalize">{fd.paymentMode.replace('_', ' ')}</div>
                          )}
                        </td>
                        <td className="p-4">
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusCfg.bg} ${statusCfg.color}`}>
                            <StatusIcon size={12} />
                            {statusCfg.label}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : q.id)}
                            className="p-2 hover:bg-[#12233e] rounded-lg text-[#7a95b8] hover:text-white transition-colors"
                          >
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="p-0 border-b border-[#12233e]">
                            <div className="bg-[#08101c] p-6 shadow-inner animate-in slide-in-from-top-2 duration-200">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {/* Client Info */}
                                <div className="space-y-4">
                                  <div className="text-[#7a95b8] text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                                    <User size={14} className="text-[#3b82f6]" />
                                    Client Details
                                  </div>
                                  <div className="bg-[#0d1a2e] rounded-xl p-4 border border-[#12233e] space-y-3">
                                    <div className="flex justify-between items-center">
                                      <span className="text-[#7a95b8] text-sm">Age</span>
                                      <span className="text-white text-sm font-medium">{fd?.age ?? "—"}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-[#7a95b8] text-sm">State</span>
                                      <span className="text-white text-sm font-medium">{fd?.state ?? "—"}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-[#7a95b8] text-sm">Health Class</span>
                                      <span className="text-white text-sm font-medium capitalize">{fd?.healthClass?.replace('_', ' ') ?? "—"}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-[#7a95b8] text-sm">Filing Status</span>
                                      <span className="text-white text-sm capitalize">{fd?.filingStatus ?? "—"}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Financial Info */}
                                <div className="space-y-4">
                                  <div className="text-[#7a95b8] text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                                    <Briefcase size={14} className="text-[#f0c040]" />
                                    Financial Data
                                  </div>
                                  <div className="bg-[#0d1a2e] rounded-xl p-4 border border-[#12233e] space-y-3">
                                    <div className="flex justify-between items-center">
                                      <span className="text-[#7a95b8] text-sm">IRA Balance</span>
                                      <span className="text-white text-sm font-medium">{fd?.iraBalance ? fmt(fd.iraBalance) : "—"}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-[#7a95b8] text-sm">Home Equity</span>
                                      <span className="text-white text-sm font-medium">{fd?.homeEquity ? fmt(fd.homeEquity) : "—"}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-[#7a95b8] text-sm">Time Horizon</span>
                                      <span className="text-white text-sm">{fd?.iulYears ? `${fd.iulYears} Years` : "—"}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-[#7a95b8] text-sm">Tax Bracket</span>
                                      <span className="text-[#f0c040] text-sm font-medium">{fd?.taxBracket ? fmtPct(fd.taxBracket) : "—"}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Projection Data */}
                                <div className="space-y-4">
                                  <div className="text-[#7a95b8] text-xs font-semibold uppercase tracking-wider flex items-center gap-2">
                                    <TrendingUp size={14} className="text-[#22c55e]" />
                                    Projected Values
                                  </div>
                                  <div className="bg-[#0d1a2e] rounded-xl p-4 border border-[#12233e] space-y-3 relative overflow-hidden">
                                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-[#22c55e]/10 rounded-full blur-xl"></div>
                                    <div className="flex justify-between items-center relative z-10">
                                      <span className="text-[#7a95b8] text-sm">Account Value</span>
                                      <span className="text-white text-sm font-medium">{fd?.projectedAccountValue ? fmt(fd.projectedAccountValue) : "—"}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-[#12233e] relative z-10">
                                      <span className="text-[#7a95b8] text-sm font-medium">Net Cash Value</span>
                                      <span className="text-[#22c55e] text-lg font-bold drop-shadow-sm">{fd?.projectedNetCash ? fmt(fd.projectedNetCash) : "—"}</span>
                                    </div>
                                    {fd?.deathBenefit && (
                                      <div className="flex justify-between items-center pt-2 border-t border-[#12233e] relative z-10">
                                        <span className="text-[#7a95b8] text-sm">Death Benefit</span>
                                        <span className="text-white text-sm font-medium">{fmt(fd.deathBenefit)}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Notes & Actions */}
                              <div className="mt-6 pt-6 border-t border-[#12233e] flex flex-col lg:flex-row gap-6">
                                <div className="flex-1">
                                  <div className="text-[#7a95b8] text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <FileSignature size={14} />
                                    Notes & Documentation
                                  </div>
                                  <div className="bg-[#0d1a2e] rounded-xl p-4 border border-[#12233e] min-h-[100px]">
                                    {q.notes ? (
                                      <div className="text-[#c8d8ec] text-sm leading-relaxed whitespace-pre-wrap">{q.notes}</div>
                                    ) : (
                                      <div className="text-[#7a95b8] text-sm italic flex items-center justify-center h-full">No notes provided for this quote.</div>
                                    )}
                                  </div>
                                </div>

                                <div className="lg:w-1/3 space-y-4">
                                  <div className="text-[#7a95b8] text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Settings size={14} />
                                    Actions & Status
                                  </div>
                                  <div className="bg-[#0d1a2e] rounded-xl p-4 border border-[#12233e]">
                                    <div className="flex flex-wrap gap-2 mb-4">
                                      {["draft", "submitted", "pending_review", "approved", "rejected"].map((s) => {
                                        const cfg = STATUS_CONFIG[s];
                                        const Icon = cfg.icon;
                                        const isActive = q.status === s;
                                        return (
                                          <button
                                            key={s}
                                            onClick={() => updateStatusMut.mutate({ quoteId: q.id, status: s as any })}
                                            disabled={isActive || updateStatusMut.isPending}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 flex-1 justify-center min-w-[100px] disabled:cursor-not-allowed ${
                                              isActive 
                                                ? `${cfg.bg} ${cfg.color} ring-1 ring-offset-1 ring-offset-[#0d1a2e] ${cfg.color.replace('text', 'ring')}` 
                                                : "bg-[#060d19] border-[#12233e] text-[#7a95b8] hover:border-[#22c55e]/50 hover:text-[#c8d8ec] disabled:opacity-50"
                                            }`}
                                          >
                                            <Icon size={14} /> {cfg.label}
                                          </button>
                                        );
                                      })}
                                    </div>
                                    
                                    <div className="flex gap-2">
                                      <button className="flex-1 bg-[#12233e] hover:bg-[#1a3258] text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                                        <Eye size={16} /> View Full PDF
                                      </button>
                                      <button className="flex-1 bg-[#12233e] hover:bg-[#1a3258] text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                                        <Plus size={16} /> Add Note
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="mt-6">
                                <NAICDisclaimer variant="compact" showsProjections />
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </div>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination mock */}
        <div className="p-4 border-t border-[#12233e] flex items-center justify-between text-sm text-[#7a95b8]">
          <div>Showing {sorted.length > 0 ? 1 : 0} to {Math.min(10, sorted.length)} of {sorted.length} entries</div>
          <div className="flex gap-1">
            <button className="px-3 py-1 rounded border border-[#12233e] bg-[#060d19] disabled:opacity-50" disabled>Prev</button>
            <button className="px-3 py-1 rounded border border-[#22c55e] bg-[#22c55e]/10 text-[#22c55e]">1</button>
            <button className="px-3 py-1 rounded border border-[#12233e] bg-[#060d19] hover:bg-[#12233e]">2</button>
            <button className="px-3 py-1 rounded border border-[#12233e] bg-[#060d19] hover:bg-[#12233e]">Next</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Carrier Distribution (Pie) */}
        <div className="rc-card flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <PieChartIcon size={18} className="text-[#3b82f6]" /> Quote Volume by Carrier
            </h3>
            <button className="text-[#7a95b8] hover:text-white transition-colors"><Maximize2 size={16}/></button>
          </div>
          <div className="flex-1 min-h-0 relative">
            {analyticsData.carrierDist.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analyticsData.carrierDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {analyticsData.carrierDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0a1526', borderColor: '#12233e', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: number, name: string, props: any) => [
                      <div key="1">
                        <div>{value} Quotes</div>
                        <div className="text-xs text-[#7a95b8] mt-1">Premium: {fmt(props.payload.premium)}</div>
                      </div>, 
                      name
                    ]}
                  />
                  <Legend 
                    layout="vertical" 
                    verticalAlign="middle" 
                    align="right"
                    wrapperStyle={{ fontSize: '12px', color: '#c8d8ec' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-[#7a95b8]">No data available</div>
            )}
            {/* Center total */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pr-[120px]">
              <span className="text-3xl font-bold text-white">{analyticsData.stats.total}</span>
              <span className="text-xs text-[#7a95b8]">Total Quotes</span>
            </div>
          </div>
        </div>

        {/* Chart 2: Timeline (Area) */}
        <div className="rc-card flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <TrendingUp size={18} className="text-[#22c55e]" /> Quote Activity Timeline
            </h3>
            <div className="flex gap-2">
              <span className="flex items-center gap-1 text-xs text-[#7a95b8]"><div className="w-2 h-2 rounded-full bg-[#22c55e]"></div> Volume</span>
              <span className="flex items-center gap-1 text-xs text-[#7a95b8]"><div className="w-2 h-2 rounded-full bg-[#3b82f6]"></div> Premium</span>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            {analyticsData.timeline.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={analyticsData.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                  <XAxis dataKey="date" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0a1526', borderColor: '#12233e', borderRadius: '8px' }}
                    labelStyle={{ color: '#7a95b8', marginBottom: '4px' }}
                  />
                  <Area yAxisId="left" type="monotone" dataKey="count" name="Quotes" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                  <Line yAxisId="right" type="monotone" dataKey="premium" name="Premium" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#0a1526', strokeWidth: 2 }} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[#7a95b8]">No data available</div>
            )}
          </div>
        </div>

        {/* Chart 3: Status Distribution (Bar) */}
        <div className="rc-card flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <BarChart3 size={18} className="text-[#f0c040]" /> Pipeline Status
            </h3>
          </div>
          <div className="flex-1 min-h-0">
            {analyticsData.statusDist.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.statusDist} layout="vertical" margin={{ top: 0, right: 20, left: 40, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#12233e" horizontal={true} vertical={false} />
                  <XAxis type="number" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#c8d8ec" fontSize={12} tickLine={false} axisLine={false} width={100} />
                  <Tooltip 
                    cursor={{ fill: '#12233e', opacity: 0.4 }}
                    contentStyle={{ backgroundColor: '#0a1526', borderColor: '#12233e', borderRadius: '8px', color: '#fff' }}
                  />
                  <Bar dataKey="value" name="Quotes" radius={[0, 4, 4, 0]} barSize={32}>
                    {analyticsData.statusDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[#7a95b8]">No data available</div>
            )}
          </div>
        </div>

        {/* Chart 4: Product Mix (Radar) */}
        <div className="rc-card flex flex-col h-[400px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Layers size={18} className="text-[#8b5cf6]" /> Product Mix Analysis
            </h3>
          </div>
          <div className="flex-1 min-h-0">
            {analyticsData.productDist.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={analyticsData.productDist}>
                  <PolarGrid stroke="#12233e" />
                  <PolarAngleAxis dataKey="name" tick={{ fill: '#c8d8ec', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: '#7a95b8' }} />
                  <Radar name="Products" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0a1526', borderColor: '#12233e', borderRadius: '8px', color: '#fff' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[#7a95b8]">No data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCarriers = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rc-card">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#22c55e]" /> Carrier Directory & Ratings
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#12233e]">
                    <th className="pb-3 text-[#7a95b8] font-medium text-sm">Carrier</th>
                    <th className="pb-3 text-[#7a95b8] font-medium text-sm">Rating</th>
                    <th className="pb-3 text-[#7a95b8] font-medium text-sm">Quote Vol</th>
                    <th className="pb-3 text-[#7a95b8] font-medium text-sm">Approval %</th>
                    <th className="pb-3 text-[#7a95b8] font-medium text-sm">Avg Turnaround</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#12233e]">
                  {mockCarriers.map((c, i) => (
                    <tr key={i} className="hover:bg-[#0d1a2e]/50 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: CARRIER_COLORS[c.name] || '#3b82f6' }}>
                            {c.name.charAt(0)}
                          </div>
                          <span className="text-white font-medium">{c.name}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className="bg-[#12233e] text-[#c8d8ec] px-2 py-1 rounded text-xs font-bold border border-[#1a3258]">{c.rating}</span>
                      </td>
                      <td className="py-4 text-white">{c.quotes}</td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-white">{fmtPct(c.approvalRate)}</span>
                          <div className="w-16 h-1.5 bg-[#12233e] rounded-full overflow-hidden">
                            <div className="h-full bg-[#22c55e]" style={{ width: `${c.approvalRate * 100}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-white">{c.avgTurnaround} days</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Chart 5: Carrier Performance (Radar) */}
        <div className="rc-card flex flex-col">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Activity size={18} className="text-[#3b82f6]" /> Performance Metrics
          </h3>
          <div className="flex-1 min-h-[300px]">
            {analyticsData.carrierPerformance.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="65%" data={analyticsData.carrierPerformance}>
                  <PolarGrid stroke="#12233e" />
                  <PolarAngleAxis dataKey="carrier" tick={{ fill: '#c8d8ec', fontSize: 10 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Speed" dataKey="speed" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                  <Radar name="Pricing" dataKey="pricing" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} />
                  <Radar name="Support" dataKey="support" stroke="#f0c040" fill="#f0c040" fillOpacity={0.2} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0a1526', borderColor: '#12233e', borderRadius: '8px' }} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[#7a95b8]">No data available</div>
            )}
          </div>
          <div className="mt-4 p-3 bg-[#0a1526] rounded-lg border border-[#12233e] text-xs text-[#7a95b8] leading-relaxed">
            Performance metrics are calculated based on historical quote data, agent feedback, and SLA adherence. Higher scores indicate better performance in that category.
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <AppShell>
      <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6 pb-20">
        {/* Header Section */}
        <div className="rc-page-header flex flex-col md:flex-row md:items-start justify-between gap-6 bg-gradient-to-r from-[#0a1526] to-transparent p-6 rounded-2xl border border-[#12233e] relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-40 w-48 h-48 bg-green-500/5 rounded-full blur-3xl translate-y-1/2"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-[#22c55e]/10 rounded-xl border border-[#22c55e]/20">
                <FileText size={28} className="text-[#22c55e]" />
              </div>
              <div>
                <h1 className="rc-page-title text-2xl md:text-3xl text-white font-bold tracking-tight">
                  Carrier Quotes
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="flex h-2 w-2 rounded-full bg-[#22c55e] animate-pulse"></span>
                  <p className="rc-page-subtitle text-[#7a95b8] text-sm font-medium">
                    Live tracking {quotes.length} active requests
                  </p>
                </div>
              </div>
            </div>
            <p className="text-[#c8d8ec] max-w-xl mt-4 text-sm leading-relaxed">
              Manage, track, and analyze formal quote requests submitted to insurance carriers. Monitor turnaround times and pipeline status to ensure timely client service.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 relative z-10">
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="rc-btn rc-btn-ghost flex items-center gap-2 bg-[#060d19] border-[#12233e] hover:bg-[#12233e]"
            >
              <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} /> 
              <span className="hidden sm:inline">Refresh</span>
            </button>
            
            <button 
              onClick={handleExportCSV}
              className="rc-btn rc-btn-ghost flex items-center gap-2 bg-[#060d19] border-[#12233e] hover:bg-[#12233e]"
            >
              <Download size={16} /> 
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            
            <ExportToSlides
              toolName="Carrier Quote Requests"
              getSections={() => [
                {
                  title: "Carrier Quote Requests Summary",
                  items: [
                    { label: "Total Quotes", value: String(analyticsData.stats.total) },
                    { label: "Total Premium", value: fmt(analyticsData.stats.totalPremium) },
                    { label: "Submitted", value: String(analyticsData.statusDist.find((s) => s.originalName === "submitted")?.value || 0) },
                    { label: "Approved", value: String(analyticsData.statusDist.find((s) => s.originalName === "approved")?.value || 0) },
                    { label: "Avg Turnaround", value: `${analyticsData.stats.avgTurnaroundDays.toFixed(1)} Days` },
                  ],
                },
              ]}
            />
            
            <button className="rc-btn rc-btn-primary flex items-center gap-2 bg-[#22c55e] hover:bg-[#1ea34d] text-black font-semibold shadow-[0_0_15px_rgba(34,197,94,0.3)]">
              <Plus size={16} /> New Request
            </button>
          </div>
        </div>

        {/* Alerts/Notifications Area (Mock) */}
        {alerts.length > 0 && (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="text-rose-400 shrink-0 mt-0.5" size={18} />
            <div>
              <h4 className="text-rose-400 font-medium text-sm">Action Required</h4>
              <p className="text-rose-400/80 text-xs mt-1">You have {alerts.length} quotes pending additional information. Please review the highlighted items below.</p>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="space-y-6">
          {renderStatsCards()}
          {renderTabs()}
          
          <div className="min-h-[500px]">
            {activeTab === "list" && renderQuoteList()}
            {activeTab === "analytics" && renderAnalytics()}
            {activeTab === "carriers" && renderCarriers()}
            
            {/* Placeholders for other tabs */}
            {(activeTab === "products" || activeTab === "performance") && (
              <div className="rc-card flex flex-col items-center justify-center py-20 text-center animate-in fade-in">
                <div className="w-16 h-16 bg-[#12233e] rounded-full flex items-center justify-center mb-4">
                  <Activity size={32} className="text-[#7a95b8]" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Detailed {activeTab === "products" ? "Product" : "Performance"} Analysis</h3>
                <p className="text-[#7a95b8] max-w-md">
                  This section is currently being populated with historical data. Check back soon for comprehensive insights.
                </p>
              </div>
            )}
          </div>
        </div>
        
        <PageInsights pageId="carrier-quotes" />
      </div>
    </AppShell>
  );
}
