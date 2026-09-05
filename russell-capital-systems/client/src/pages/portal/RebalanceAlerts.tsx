// @ts-nocheck
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { NumberInput } from "@/components/NumberInput";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Eye,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Upload,
  Search,
  FileSpreadsheet,
  PieChart as PieChartIcon,
  BarChart3,
  Filter,
  Activity,
  Calendar,
  Clock,
  Settings,
  User,
  Shield,
  Percent,
  ChevronDown,
  ChevronUp,
  X,
  FileText,
  MessageSquare,
  Zap,
  ArrowRight,
  ArrowLeft,
  List,
  Grid,
  Layers,
  Save,
  Plus,
  Minus,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
  Legend
} from "recharts";

const STATUS_STYLES: Record<string, { bg: string; label: string; text: string }> = {
  OPEN: { bg: "bg-red-500/20", text: "text-red-400", label: "Open" },
  ACKNOWLEDGED: { bg: "bg-amber-500/20", text: "text-amber-400", label: "Acknowledged" },
  RESOLVED: { bg: "bg-emerald-500/20", text: "text-emerald-400", label: "Resolved" },
};

const COLORS = ["#f87171", "#fbbf24", "#34d399", "#60a5fa", "#a78bfa", "#f472b6", "#38bdf8", "#4ade80", "#facc15", "#f87171"];

const generateTrendData = () => {
  return Array.from({ length: 12 }).map((_, i) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    alerts: Math.floor(Math.random() * 50) + 10,
    resolved: Math.floor(Math.random() * 40) + 5,
    drift: (Math.random() * 5 + 1).toFixed(2)
  }));
};

const generateRiskData = () => {
  return [
    { subject: 'Equities', A: 120, B: 110, fullMark: 150 },
    { subject: 'Fixed Income', A: 98, B: 130, fullMark: 150 },
    { subject: 'Alternatives', A: 86, B: 130, fullMark: 150 },
    { subject: 'Cash', A: 99, B: 100, fullMark: 150 },
    { subject: 'Real Estate', A: 85, B: 90, fullMark: 150 },
    { subject: 'Commodities', A: 65, B: 85, fullMark: 150 },
  ];
};

const generateDriftDistribution = () => {
  return [
    { range: '0-2%', count: 45 },
    { range: '2-5%', count: 30 },
    { range: '5-10%', count: 15 },
    { range: '10-15%', count: 8 },
    { range: '>15%', count: 2 },
  ];
};

const generateClientImpact = () => {
  return Array.from({ length: 7 }).map((_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    high: Math.floor(Math.random() * 20),
    medium: Math.floor(Math.random() * 30),
    low: Math.floor(Math.random() * 50),
  }));
};

export default function RebalanceAlerts() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  
  const [statusFilter, setStatusFilter] = useState("OPEN");
  const [searchQuery, setSearchQuery] = useState("");
  const [threshold, setThreshold] = useState<number>(5);
  const [csvText, setCsvText] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [timeRange, setTimeRange] = useState("30d");
  const [sortBy, setSortBy] = useState("driftPct");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [activeTab, setActiveTab] = useState("overview");
  const [showFilters, setShowFilters] = useState(false);
  const [assetClassFilter, setAssetClassFilter] = useState("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [chartType, setChartType] = useState<"bar" | "line" | "area">("area");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [selectedRows, setSelectedRows] = useState<Record<string, boolean>>({});
  const [bulkAction, setBulkAction] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [notesText, setNotesText] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [theme, setTheme] = useState("dark");
  const [layout, setLayout] = useState("default");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { data: alerts } = trpc.rebalance.alerts.useQuery(
    statusFilter === "ALL" ? {} : { status: statusFilter as any }
  );
  
  const { data: dashboardStats } = trpc.dashboard.stats.useQuery();
  const { data: clientData } = trpc.clients.list.useQuery();
  const { data: marketData } = trpc.marketData.overview.useQuery();
  const { data: teamMembers } = trpc.team.members.useQuery();
  
  const runCheck = trpc.rebalance.runCheck.useMutation({
    onSuccess: (result) => {
      utils.rebalance.alerts.invalidate();
      toast.success(`Checked ${result.clientsChecked} clients. ${result.alertsCreated} new alert(s) created.`);
    },
    onError: () => toast.error("Failed to run drift check."),
  });

  const bulkUpload = trpc.rebalance.bulkUploadCsv.useMutation({
    onSuccess: (result) => {
      utils.rebalance.alerts.invalidate();
      toast.success(`Parsed ${result.rowsParsed} rows, updated ${result.updated} allocations, ${result.alertsCreated} new alert(s).`);
      if (result.errors.length > 0) toast.warning(`${result.errors.length} row(s) had errors. Check results.`);
      setCsvText("");
      setShowUpload(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const acknowledge = trpc.rebalance.acknowledgeAlert.useMutation({
    onSuccess: () => { utils.rebalance.alerts.invalidate(); toast.success("Alert acknowledged."); },
  });

  const resolve = trpc.rebalance.resolveAlert.useMutation({
    onSuccess: () => { utils.rebalance.alerts.invalidate(); toast.success("Alert resolved."); },
  });
  
  const addNote = trpc.notes.add.useMutation({
    onSuccess: () => { toast.success("Note added successfully"); setNotesText(""); setShowNotes(false); }
  });

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        utils.rebalance.alerts.invalidate();
      }, 60000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh, utils]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    utils.rebalance.alerts.invalidate().then(() => {
      setTimeout(() => setIsRefreshing(false), 500);
      toast.success("Data refreshed");
    });
  }, [utils]);

  const toggleRowExpansion = useCallback((id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const toggleRowSelection = useCallback((id: string) => {
    setSelectedRows(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const selectAllRows = useCallback(() => {
    if (!alerts) return;
    const allSelected = alerts.every((a: any) => selectedRows[a.id]);
    const newSelection: Record<string, boolean> = {};
    if (!allSelected) {
      alerts.forEach((a) => { newSelection[a.id] = true; });
    }
    setSelectedRows(newSelection);
  }, [alerts, selectedRows]);

  const handleBulkAction = useCallback(() => {
    const selectedIds = Object.keys(selectedRows).filter((id) => selectedRows[id]);
    if (selectedIds.length === 0) {
      toast.warning("No alerts selected");
      return;
    }
    
    if (bulkAction === "acknowledge") {
      selectedIds.forEach((id) => acknowledge.mutate({ alertId: id }));
      toast.success(`Acknowledged ${selectedIds.length} alerts`);
    } else if (bulkAction === "resolve") {
      selectedIds.forEach((id) => resolve.mutate({ alertId: id }));
      toast.success(`Resolved ${selectedIds.length} alerts`);
    }
    setSelectedRows({});
    setBulkAction("");
  }, [selectedRows, bulkAction, acknowledge, resolve]);

  const handleExportCSV = useCallback(() => {
    setIsExporting(true);
    setTimeout(() => {
      if (!filteredAlerts.length) {
        setIsExporting(false);
        return;
      }
      const headers = ["Client ID", "Asset Class", "Target %", "Current %", "Drift %", "Status", "Created Date"];
      const rows = filteredAlerts.map((a) => [
        a.clientId,
        a.assetClass,
        parseFloat(String(a.targetPct)).toFixed(2),
        parseFloat(String(a.currentPct)).toFixed(2),
        parseFloat(String(a.driftPct)).toFixed(2),
        a.status,
        new Date(a.createdAt).toLocaleDateString()
      ]);
      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `rebalance_alerts_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      setIsExporting(false);
      toast.success("Export complete");
    }, 800);
  }, [filteredAlerts]);

  const handleNotesSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!notesText.trim() || !selectedAlert) return;
    addNote.mutate({ targetId: selectedAlert.id, targetType: "ALERT", content: notesText });
  }, [notesText, selectedAlert, addNote]);

  const openCount = useMemo(() => (alerts ?? []).filter((a) => a.status === "OPEN").length, [alerts]);
  const ackCount = useMemo(() => (alerts ?? []).filter((a) => a.status === "ACKNOWLEDGED").length, [alerts]);
  const resCount = useMemo(() => (alerts ?? []).filter((a) => a.status === "RESOLVED").length, [alerts]);
  const totalDrift = useMemo(() => (alerts ?? []).reduce((acc: number, a: any) => acc + Math.abs(parseFloat(String(a.driftPct || 0))), 0), [alerts]);
  const avgDrift = useMemo(() => alerts?.length ? totalDrift / alerts.length : 0, [alerts, totalDrift]);

  const filteredAlerts = useMemo(() => {
    if (!alerts) return [];
    let filtered = alerts;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((a) => 
        a.clientId?.toLowerCase().includes(q) || 
        a.assetClass?.toLowerCase().includes(q)
      );
    }
    if (assetClassFilter !== "ALL") {
      filtered = filtered.filter((a) => a.assetClass === assetClassFilter);
    }
    
    filtered = [...filtered].sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      
      if (sortBy === "driftPct" || sortBy === "currentPct" || sortBy === "targetPct") {
        valA = parseFloat(String(valA || 0));
        valB = parseFloat(String(valB || 0));
      }
      
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    
    return filtered;
  }, [alerts, searchQuery, assetClassFilter, sortBy, sortOrder]);

  const paginatedAlerts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredAlerts.slice(startIndex, startIndex + pageSize);
  }, [filteredAlerts, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredAlerts.length / pageSize);

  const assetClassData = useMemo(() => {
    if (!alerts) return [];
    const counts: Record<string, number> = {};
    alerts.forEach((a) => {
      if (a.status === "OPEN") {
        counts[a.assetClass] = (counts[a.assetClass] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [alerts]);

  const uniqueAssetClasses = useMemo(() => {
    if (!alerts) return [];
    const classes = new Set(alerts.map((a) => a.assetClass));
    return Array.from(classes);
  }, [alerts]);

  const trendData = useMemo(() => generateTrendData(), []);
  const riskData = useMemo(() => generateRiskData(), []);
  const distributionData = useMemo(() => generateDriftDistribution(), []);
  const impactData = useMemo(() => generateClientImpact(), []);

  const isLoading = !alerts;
  const isSelectedAll = alerts?.length > 0 && alerts.every((a: any) => selectedRows[a.id]);
  const selectedCount = Object.values(selectedRows).filter(Boolean).length;

  return (
    <AppShell>
      <div className={`space-y-6 animate-in fade-in duration-500 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        {/* Header Section */}
        <div className="rc-page-header bg-[#0a1526] p-6 rounded-xl border border-[#12233e] shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <AlertTriangle className="h-6 w-6 text-amber-400" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">Rebalance Alerts</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  v2.0
                </span>
              </div>
              <p className="text-[#7a95b8] max-w-2xl">
                Monitor portfolio drift, manage rebalancing alerts, and execute bulk actions across all client accounts in real-time.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex flex-col bg-[#060d19] px-3 py-1.5 rounded-lg border border-[#12233e]">
                <label className="text-[10px] text-[#7a95b8] font-medium uppercase tracking-wider">Drift Threshold</label>
                <div className="flex items-center gap-2">
                  <Percent className="h-3 w-3 text-blue-400" />
                  <NumberInput 
                    value={threshold} 
                    onChange={setThreshold} 
                    className="w-16 bg-transparent border-none text-sm font-bold focus:ring-0 p-0 h-6" 
                    min={0.1} 
                    max={100} 
                    step={0.5} 
                    placeholder="5.0"
                    fallback={5}
                  />
                </div>
              </div>
              
              <button
                onClick={() => runCheck.mutate({ threshold: threshold || 5 })}
                disabled={runCheck.isPending}
                className="rc-btn bg-blue-600 hover:bg-blue-700 text-white border-none shadow-md shadow-blue-900/20 flex items-center transition-all px-4 py-2 rounded-lg font-medium"
              >
                <Activity className={`h-4 w-4 mr-2 ${runCheck.isPending ? "animate-pulse" : ""}`} />
                {runCheck.isPending ? "Analyzing..." : "Run Analysis"}
              </button>
              
              <button
                onClick={handleRefresh}
                className="rc-btn bg-[#12233e] hover:bg-[#1a3158] text-white border border-[#2a4365] p-2 rounded-lg transition-colors"
                title="Refresh Data"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-blue-400" : ""}`} />
              </button>
              
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`rc-btn p-2 rounded-lg transition-colors border ${showSettings ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-[#12233e] hover:bg-[#1a3158] border-[#2a4365] text-white'}`}
                title="Settings"
              >
                <Settings className="h-4 w-4" />
              </button>
              
              <ExportToSlides
                toolName="Rebalance Alerts Dashboard"
                getSections={() => [
                  {
                    title: "Executive Summary",
                    items: [
                      { label: "Drift Threshold", value: `${threshold}%` },
                      { label: "Total Open Alerts", value: String(openCount) },
                      { label: "Average Drift", value: `${avgDrift.toFixed(2)}%` },
                      { label: "Resolved Today", value: String(resCount) },
                    ]
                  },
                  {
                    title: "Top Asset Class Drift",
                    items: assetClassData.map((d) => ({ label: d.name, value: String(d.value) }))
                  }
                ]}
              />
            </div>
          </div>
          
          {/* Settings Panel Expansion */}
          {showSettings && (
            <div className="mt-4 pt-4 border-t border-[#12233e] grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2">
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#7a95b8] flex items-center gap-1"><Clock className="h-3 w-3" /> Auto-Refresh</label>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${autoRefresh ? 'bg-blue-500' : 'bg-[#12233e]'}`}
                  >
                    <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-transform ${autoRefresh ? 'left-6' : 'left-1'}`} />
                  </button>
                  <span className="text-sm">{autoRefresh ? 'On (60s)' : 'Off'}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#7a95b8] flex items-center gap-1"><Grid className="h-3 w-3" /> Default Layout</label>
                <select 
                  value={layout} 
                  onChange={(e) => setLayout(e.target.value)}
                  className="w-full bg-[#060d19] border border-[#12233e] rounded-md px-2 py-1 text-sm focus:border-blue-500 outline-none"
                >
                  <option value="default">Standard Dashboard</option>
                  <option value="compact">Compact View</option>
                  <option value="analytics">Analytics Heavy</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#7a95b8] flex items-center gap-1"><Zap className="h-3 w-3" /> Notification Priority</label>
                <select className="w-full bg-[#060d19] border border-[#12233e] rounded-md px-2 py-1 text-sm focus:border-blue-500 outline-none">
                  <option value="all">All Alerts</option>
                  <option value="high">High Drift (over 10%)</option>
                  <option value="critical">Critical Only</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#7a95b8] flex items-center gap-1"><Shield className="h-3 w-3" /> Compliance Mode</label>
                <div className="flex items-center gap-2">
                  <button className="w-10 h-5 rounded-full relative bg-[#12233e] transition-colors">
                    <div className="w-3 h-3 bg-white rounded-full absolute top-1 left-1 transition-transform" />
                  </button>
                  <span className="text-sm text-[#7a95b8]">Strict</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#12233e] overflow-x-auto hide-scrollbar">
          {[
            { id: "overview", label: "Dashboard Overview", icon: Activity },
            { id: "alerts", label: "Alert Management", icon: AlertTriangle },
            { id: "analytics", label: "Drift Analytics", icon: BarChart3 },
            { id: "bulk", label: "Bulk Operations", icon: Layers },
            { id: "history", label: "Audit History", icon: Clock },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id 
                  ? "border-blue-500 text-blue-400 bg-blue-500/5" 
                  : "border-transparent text-[#7a95b8] hover:text-[#c8d8ec] hover:bg-white/5"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.id === "alerts" && openCount > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {openCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content: Overview */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#0a1526] p-5 rounded-xl border border-[#12233e] relative overflow-hidden group hover:border-red-500/50 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-red-500/10 rounded-lg border border-red-500/20 text-red-400">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <span className="flex items-center text-xs font-medium text-red-400 bg-red-500/10 px-2 py-1 rounded-md">
                    <TrendingUp className="h-3 w-3 mr-1" /> +12%
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">{openCount}</h3>
                <p className="text-sm text-[#7a95b8] font-medium">Open Alerts</p>
                <div className="mt-4 w-full bg-[#12233e] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-red-500 h-full rounded-full" style={{ width: '65%' }}></div>
                </div>
              </div>
              
              <div className="bg-[#0a1526] p-5 rounded-xl border border-[#12233e] relative overflow-hidden group hover:border-amber-500/50 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-400">
                    <Eye className="h-5 w-5" />
                  </div>
                  <span className="flex items-center text-xs font-medium text-[#7a95b8] bg-[#12233e] px-2 py-1 rounded-md">
                    <Minus className="h-3 w-3 mr-1" /> 0%
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">{ackCount}</h3>
                <p className="text-sm text-[#7a95b8] font-medium">Acknowledged</p>
                <div className="mt-4 w-full bg-[#12233e] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '25%' }}></div>
                </div>
              </div>
              
              <div className="bg-[#0a1526] p-5 rounded-xl border border-[#12233e] relative overflow-hidden group hover:border-emerald-500/50 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <span className="flex items-center text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">
                    <TrendingUp className="h-3 w-3 mr-1" /> +24%
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">{resCount}</h3>
                <p className="text-sm text-[#7a95b8] font-medium">Resolved (30d)</p>
                <div className="mt-4 w-full bg-[#12233e] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
              
              <div className="bg-[#0a1526] p-5 rounded-xl border border-[#12233e] relative overflow-hidden group hover:border-blue-500/50 transition-all">
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-blue-500/10 rounded-lg border border-blue-500/20 text-blue-400">
                    <Activity className="h-5 w-5" />
                  </div>
                  <span className="flex items-center text-xs font-medium text-red-400 bg-red-500/10 px-2 py-1 rounded-md">
                    <TrendingUp className="h-3 w-3 mr-1" /> +1.2%
                  </span>
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">{avgDrift.toFixed(2)}%</h3>
                <p className="text-sm text-[#7a95b8] font-medium">Avg Portfolio Drift</p>
                <div className="mt-4 w-full bg-[#12233e] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min(avgDrift * 10, 100)}%` }}></div>
                </div>
              </div>
            </div>

            {/* Main Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart 1: Trend Analysis */}
              <div className="lg:col-span-2 bg-[#0a1526] p-5 rounded-xl border border-[#12233e] flex flex-col h-[400px]">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <LineChart className="h-5 w-5 text-blue-400" />
                      Alert Resolution Trend
                    </h3>
                    <p className="text-xs text-[#7a95b8] mt-1">Historical view of generated vs resolved alerts</p>
                  </div>
                  <div className="flex bg-[#060d19] rounded-lg border border-[#12233e] p-1">
                    {(["bar", "line", "area"] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setChartType(type)}
                        className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                          chartType === type ? "bg-[#12233e] text-white" : "text-[#7a95b8] hover:text-white"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === "bar" ? (
                      <BarChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                        <XAxis dataKey="month" stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#0a1526', borderColor: '#12233e', color: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                          cursor={{ fill: '#12233e', opacity: 0.4 }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                        <Bar dataKey="alerts" name="New Alerts" fill="#f87171" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="resolved" name="Resolved" fill="#34d399" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    ) : chartType === "line" ? (
                      <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                        <XAxis dataKey="month" stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#0a1526', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                        <Line type="monotone" dataKey="alerts" name="New Alerts" stroke="#f87171" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#34d399" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    ) : (
                      <AreaChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <defs>
                          <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f87171" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                        <XAxis dataKey="month" stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#0a1526', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                        <Area type="monotone" dataKey="alerts" name="New Alerts" stroke="#f87171" fillOpacity={1} fill="url(#colorAlerts)" strokeWidth={2} />
                        <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#34d399" fillOpacity={1} fill="url(#colorResolved)" strokeWidth={2} />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Asset Class Distribution */}
              <div className="bg-[#0a1526] p-5 rounded-xl border border-[#12233e] flex flex-col h-[400px]">
                <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-purple-400" />
                  Drift by Asset Class
                </h3>
                <p className="text-xs text-[#7a95b8] mb-4">Distribution of open alerts</p>
                
                <div className="flex-1 relative">
                  {assetClassData.length > 0 ? (
                    <>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={assetClassData}
                            cx="50%"
                            cy="50%"
                            innerRadius={70}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {assetClassData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                            contentStyle={{ backgroundColor: '#0a1526', borderColor: '#12233e', color: '#fff', borderRadius: '8px', border: '1px solid #12233e' }}
                            itemStyle={{ color: '#c8d8ec', fontSize: '13px' }}
                            formatter={(value: number) => [`${value} Alerts`, 'Count']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-3xl font-bold text-white">{openCount}</span>
                        <span className="text-xs text-[#7a95b8]">Total</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-[#7a95b8]">
                      <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#2a4365] flex items-center justify-center mb-3">
                        <CheckCircle2 className="h-8 w-8 text-emerald-500/50" />
                      </div>
                      <p className="text-sm font-medium">No open alerts</p>
                      <p className="text-xs mt-1">All portfolios are balanced</p>
                    </div>
                  )}
                </div>
                
                {assetClassData.length > 0 && (
                  <div className="mt-4 space-y-2.5 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                    {assetClassData.map((entry, index) => (
                      <div key={entry.name} className="flex items-center justify-between text-sm group cursor-pointer hover:bg-[#12233e]/50 p-1.5 rounded-md transition-colors" onClick={() => { setAssetClassFilter(entry.name); setActiveTab("alerts"); }}>
                        <div className="flex items-center gap-2.5">
                          <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                          <span className="text-[#c8d8ec] truncate max-w-[140px] group-hover:text-white transition-colors">{entry.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-white font-medium">{entry.value}</span>
                          <span className="text-xs text-[#7a95b8] w-8 text-right">{Math.round((entry.value / openCount) * 100)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 3: Risk Exposure Radar */}
              <div className="bg-[#0a1526] p-5 rounded-xl border border-[#12233e] h-[350px] flex flex-col">
                <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-emerald-400" />
                  Risk Exposure Analysis
                </h3>
                <p className="text-xs text-[#7a95b8] mb-4">Target vs Current allocation variance</p>
                <div className="flex-1 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={riskData}>
                      <PolarGrid stroke="#12233e" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#7a95b8', fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                      <Radar name="Target Model" dataKey="B" stroke="#34d399" fill="#34d399" fillOpacity={0.3} />
                      <Radar name="Current Actual" dataKey="A" stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.4} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <RechartsTooltip contentStyle={{ backgroundColor: '#0a1526', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 4: Drift Magnitude Distribution */}
              <div className="bg-[#0a1526] p-5 rounded-xl border border-[#12233e] h-[350px] flex flex-col">
                <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-amber-400" />
                  Drift Magnitude
                </h3>
                <p className="text-xs text-[#7a95b8] mb-4">Distribution of alerts by drift severity</p>
                <div className="flex-1 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={distributionData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                      <CartesianGrid stroke="#12233e" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="range" stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <RechartsTooltip 
                        cursor={{ fill: '#12233e', opacity: 0.4 }}
                        contentStyle={{ backgroundColor: '#0a1526', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }}
                      />
                      <Bar dataKey="count" name="Number of Accounts" fill="#fbbf24" radius={[4, 4, 0, 0]}>
                        {distributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={
                            index === 0 ? '#34d399' : 
                            index === 1 ? '#60a5fa' : 
                            index === 2 ? '#fbbf24' : 
                            index === 3 ? '#f97316' : '#ef4444'
                          } />
                        ))}
                      </Bar>
                      <Line type="monotone" dataKey="count" stroke="#ffffff" strokeWidth={2} dot={{ r: 4, fill: '#fff' }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            {/* Chart 5: Daily Impact Activity */}
            <div className="bg-[#0a1526] p-5 rounded-xl border border-[#12233e] h-[350px] flex flex-col">
              <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-pink-400" />
                7-Day Alert Activity
              </h3>
              <p className="text-xs text-[#7a95b8] mb-4">Alert generation by severity over the past week</p>
              <div className="flex-1 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={impactData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                    <XAxis dataKey="day" stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#0a1526', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }}
                      cursor={{ fill: '#12233e', opacity: 0.4 }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    <Bar dataKey="high" name="High Priority (over 10%)" stackId="a" fill="#ef4444" />
                    <Bar dataKey="medium" name="Medium Priority (5-10%)" stackId="a" fill="#f59e0b" />
                    <Bar dataKey="low" name="Low Priority (<5%)" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Alerts Management */}
        {activeTab === "alerts" && (
          <div className="bg-[#0a1526] rounded-xl border border-[#12233e] flex flex-col h-full min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Toolbar */}
            <div className="p-4 border-b border-[#12233e] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#060d19] rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7a95b8]" />
                  <input
                    type="text"
                    placeholder="Search client, asset..."
                    className="bg-[#0a1526] border border-[#12233e] text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-64 pl-9 p-2 transition-all placeholder:text-[#4b6382]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a95b8] hover:text-white">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${showFilters ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-[#0a1526] border-[#12233e] text-[#c8d8ec] hover:bg-[#12233e]'}`}
                >
                  <Filter className="h-4 w-4" />
                  Filters
                  {(statusFilter !== "OPEN" || assetClassFilter !== "ALL") && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 ml-1"></span>
                  )}
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                {selectedCount > 0 && (
                  <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-1.5 animate-in fade-in">
                    <span className="text-xs font-medium text-blue-400">{selectedCount} selected</span>
                    <div className="h-4 w-px bg-blue-500/30 mx-1"></div>
                    <select
                      className="bg-transparent text-sm text-white outline-none cursor-pointer"
                      value={bulkAction}
                      onChange={(e) => setBulkAction(e.target.value)}
                    >
                      <option value="" disabled>Bulk Action...</option>
                      <option value="acknowledge">Acknowledge All</option>
                      <option value="resolve">Resolve All</option>
                      <option value="export">Export Selected</option>
                    </select>
                    <button 
                      onClick={handleBulkAction}
                      disabled={!bulkAction}
                      className="ml-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs px-2 py-1 rounded transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                )}
                
                <div className="flex bg-[#0a1526] rounded-lg border border-[#12233e] p-1">
                  <button onClick={() => setViewMode("table")} className={`p-1.5 rounded-md transition-colors ${viewMode === "table" ? "bg-[#12233e] text-white" : "text-[#7a95b8] hover:text-white"}`}>
                    <List className="h-4 w-4" />
                  </button>
                  <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-[#12233e] text-white" : "text-[#7a95b8] hover:text-white"}`}>
                    <Grid className="h-4 w-4" />
                  </button>
                </div>
                
                <button 
                  onClick={handleExportCSV}
                  className="rc-btn bg-[#0a1526] hover:bg-[#12233e] border border-[#12233e] text-[#c8d8ec] flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  disabled={filteredAlerts.length === 0 || isExporting}
                >
                  {isExporting ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                  Export CSV
                </button>
              </div>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="p-4 border-b border-[#12233e] bg-[#08101d] grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#7a95b8]">Status</label>
                  <select
                    className="w-full bg-[#0a1526] border border-[#12233e] text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 outline-none"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="OPEN">Open Only</option>
                    <option value="ACKNOWLEDGED">Acknowledged</option>
                    <option value="RESOLVED">Resolved</option>
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#7a95b8]">Asset Class</label>
                  <select
                    className="w-full bg-[#0a1526] border border-[#12233e] text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 outline-none"
                    value={assetClassFilter}
                    onChange={(e) => setAssetClassFilter(e.target.value)}
                  >
                    <option value="ALL">All Asset Classes</option>
                    {uniqueAssetClasses.map((ac) => (
                      <option key={ac} value={ac}>{ac}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#7a95b8]">Sort By</label>
                  <div className="flex gap-2">
                    <select
                      className="flex-1 bg-[#0a1526] border border-[#12233e] text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 p-2 outline-none"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <option value="driftPct">Drift %</option>
                      <option value="clientId">Client ID</option>
                      <option value="assetClass">Asset Class</option>
                      <option value="createdAt">Date Created</option>
                    </select>
                    <button 
                      onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                      className="bg-[#0a1526] border border-[#12233e] text-[#c8d8ec] hover:bg-[#12233e] p-2 rounded-lg transition-colors"
                    >
                      {sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                
                <div className="flex items-end">
                  <button 
                    onClick={() => {
                      setStatusFilter("OPEN");
                      setAssetClassFilter("ALL");
                      setSearchQuery("");
                      setSortBy("driftPct");
                      setSortOrder("desc");
                    }}
                    className="text-sm text-blue-400 hover:text-blue-300 font-medium p-2"
                  >
                    Reset Filters
                  </button>
                </div>
              </div>
            )}

            {/* Data Display */}
            <div className="flex-1 overflow-hidden flex flex-col relative">
              {isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                  <div className="relative">
                    <div className="h-12 w-12 rounded-full border-4 border-[#12233e] border-t-blue-500 animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-4 w-4 rounded-full bg-blue-500/20"></div>
                    </div>
                  </div>
                  <p className="text-[#7a95b8] font-medium animate-pulse">Analyzing portfolio data...</p>
                </div>
              ) : filteredAlerts.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-20 h-20 rounded-full bg-[#060d19] border-2 border-dashed border-[#1a3158] flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500/50" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">No alerts found</h3>
                  <p className="text-[#7a95b8] max-w-md mx-auto mb-6">
                    {searchQuery || statusFilter !== "ALL" || assetClassFilter !== "ALL" 
                      ? "Try adjusting your filters or search query to find what you're looking for." 
                      : "All client portfolios are currently within acceptable drift thresholds."}
                  </p>
                  {(searchQuery || statusFilter !== "ALL" || assetClassFilter !== "ALL") && (
                    <button 
                      onClick={() => { setStatusFilter("ALL"); setAssetClassFilter("ALL"); setSearchQuery(""); }}
                      className="rc-btn bg-[#12233e] hover:bg-[#1a3158] text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : viewMode === "table" ? (
                <div className="flex-1 overflow-auto custom-scrollbar">
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="bg-[#060d19] text-[#7a95b8] uppercase text-xs font-semibold sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="py-3 px-4 w-12 border-b border-[#12233e]">
                          <input 
                            type="checkbox" 
                            className="rounded border-[#2a4365] bg-[#0a1526] text-blue-500 focus:ring-blue-500 focus:ring-offset-[#0a1526] cursor-pointer"
                            checked={isSelectedAll}
                            onChange={selectAllRows}
                          />
                        </th>
                        <th className="py-3 px-4 border-b border-[#12233e] cursor-pointer hover:text-white transition-colors" onClick={() => { setSortBy("clientId"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }}>
                          <div className="flex items-center gap-1">Client ID {sortBy === "clientId" && (sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}</div>
                        </th>
                        <th className="py-3 px-4 border-b border-[#12233e] cursor-pointer hover:text-white transition-colors" onClick={() => { setSortBy("assetClass"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }}>
                          <div className="flex items-center gap-1">Asset Class {sortBy === "assetClass" && (sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}</div>
                        </th>
                        <th className="py-3 px-4 border-b border-[#12233e] text-right">Target %</th>
                        <th className="py-3 px-4 border-b border-[#12233e] text-right">Current %</th>
                        <th className="py-3 px-4 border-b border-[#12233e] text-right cursor-pointer hover:text-white transition-colors" onClick={() => { setSortBy("driftPct"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }}>
                          <div className="flex items-center justify-end gap-1">Drift {sortBy === "driftPct" && (sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}</div>
                        </th>
                        <th className="py-3 px-4 border-b border-[#12233e]">Status</th>
                        <th className="py-3 px-4 border-b border-[#12233e] text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#12233e]">
                      {paginatedAlerts.map((alert) => {
                        const drift = parseFloat(String(alert.driftPct));
                        const current = parseFloat(String(alert.currentPct));
                        const target = parseFloat(String(alert.targetPct));
                        const isOver = current > target;
                        const statusStyle = STATUS_STYLES[alert.status] || { bg: "bg-[#12233e]", text: "text-[#c8d8ec]", label: alert.status };
                        const isExpanded = expandedRows[alert.id];
                        const isSelected = selectedRows[alert.id];
                        
                        return (
                          <React.Fragment key={alert.id}>
                            <tr className={`hover:bg-[#12233e]/40 transition-colors group ${isSelected ? 'bg-blue-500/5' : ''}`}>
                              <td className="py-3 px-4">
                                <input 
                                  type="checkbox" 
                                  className="rounded border-[#2a4365] bg-[#0a1526] text-blue-500 focus:ring-blue-500 focus:ring-offset-[#0a1526] cursor-pointer"
                                  checked={!!isSelected}
                                  onChange={() => toggleRowSelection(alert.id)}
                                />
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => toggleRowExpansion(alert.id)}
                                    className="p-1 rounded hover:bg-[#1a3158] text-[#7a95b8] transition-colors"
                                  >
                                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                  </button>
                                  <span className="font-mono text-xs text-[#c8d8ec] font-medium">{alert.clientId}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[uniqueAssetClasses.indexOf(alert.assetClass) % COLORS.length] }}></div>
                                  <span className="font-medium text-white">{alert.assetClass}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right text-[#7a95b8]">{target.toFixed(2)}%</td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5 text-white">
                                  {isOver ? <TrendingUp className="h-3 w-3 text-red-400" /> : <TrendingDown className="h-3 w-3 text-blue-400" />}
                                  {current.toFixed(2)}%
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className={`font-bold px-2 py-1 rounded-md bg-opacity-10 ${
                                  drift >= 10 ? "text-red-400 bg-red-500/10" : 
                                  drift >= 5 ? "text-amber-400 bg-amber-500/10" : 
                                  "text-emerald-400 bg-emerald-500/10"
                                }`}>
                                  {isOver ? '+' : '-'}{drift.toFixed(2)}%
                                </span>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusStyle.bg} ${statusStyle.text} border border-current border-opacity-20`}>
                                  {statusStyle.label}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                  {alert.status === "OPEN" && (
                                    <button
                                      className="p-1.5 rounded-md bg-[#12233e] hover:bg-amber-500/20 text-[#7a95b8] hover:text-amber-400 transition-colors"
                                      onClick={() => acknowledge.mutate({ alertId: alert.id })}
                                      title="Acknowledge"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </button>
                                  )}
                                  {(alert.status === "OPEN" || alert.status === "ACKNOWLEDGED") && (
                                    <button
                                      className="p-1.5 rounded-md bg-[#12233e] hover:bg-emerald-500/20 text-[#7a95b8] hover:text-emerald-400 transition-colors"
                                      onClick={() => resolve.mutate({ alertId: alert.id })}
                                      title="Resolve"
                                    >
                                      <CheckCircle2 className="h-4 w-4" />
                                    </button>
                                  )}
                                  <button
                                    className="p-1.5 rounded-md bg-[#12233e] hover:bg-blue-500/20 text-[#7a95b8] hover:text-blue-400 transition-colors"
                                    onClick={() => { setSelectedAlert(alert); setShowNotes(true); }}
                                    title="Add Note"
                                  >
                                    <MessageSquare className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                            
                            {/* Expanded Row Content */}
                            {isExpanded && (
                              <tr className="bg-[#060d19]/50 border-b border-[#12233e]">
                                <td colSpan={8} className="p-0">
                                  <div className="p-4 pl-14 animate-in slide-in-from-top-2 duration-200">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                      <div className="space-y-3">
                                        <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                                          <User className="h-3 w-3 text-blue-400" /> Client Details
                                        </h4>
                                        <div className="bg-[#0a1526] p-3 rounded-lg border border-[#12233e] space-y-2">
                                          <div className="flex justify-between text-sm">
                                            <span className="text-[#7a95b8]">Account ID:</span>
                                            <span className="font-mono text-white">{alert.clientId}</span>
                                          </div>
                                          <div className="flex justify-between text-sm">
                                            <span className="text-[#7a95b8]">Account Type:</span>
                                            <span className="text-white">Taxable Brokerage</span>
                                          </div>
                                          <div className="flex justify-between text-sm">
                                            <span className="text-[#7a95b8]">Model:</span>
                                            <span className="text-white">Growth 80/20</span>
                                          </div>
                                          <div className="flex justify-between text-sm">
                                            <span className="text-[#7a95b8]">AUM:</span>
                                            <span className="text-white font-medium">$1,245,000</span>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="space-y-3">
                                        <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                                          <Activity className="h-3 w-3 text-amber-400" /> Drift Analysis
                                        </h4>
                                        <div className="bg-[#0a1526] p-3 rounded-lg border border-[#12233e]">
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs text-[#7a95b8]">Target ({target}%)</span>
                                            <span className="text-xs text-[#7a95b8]">Current ({current}%)</span>
                                          </div>
                                          <div className="relative h-2 bg-[#12233e] rounded-full overflow-hidden mb-4">
                                            <div 
                                              className="absolute top-0 bottom-0 bg-[#34d399] opacity-50" 
                                              style={{ left: 0, width: `${target}%` }}
                                            ></div>
                                            <div 
                                              className={`absolute top-0 bottom-0 ${isOver ? 'bg-red-500' : 'bg-blue-500'}`} 
                                              style={{ left: 0, width: `${current}%` }}
                                            ></div>
                                            <div 
                                              className="absolute top-0 bottom-0 w-0.5 bg-white z-10" 
                                              style={{ left: `${target}%` }}
                                            ></div>
                                          </div>
                                          <div className="flex justify-between text-sm">
                                            <span className="text-[#7a95b8]">Required Action:</span>
                                            <span className={`font-medium ${isOver ? 'text-red-400' : 'text-blue-400'}`}>
                                              {isOver ? 'SELL' : 'BUY'} ~${((drift / 100) * 1245000).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="space-y-3">
                                        <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                                          <Clock className="h-3 w-3 text-purple-400" /> Timeline
                                        </h4>
                                        <div className="bg-[#0a1526] p-3 rounded-lg border border-[#12233e] space-y-3 relative">
                                          <div className="absolute left-[21px] top-4 bottom-4 w-px bg-[#12233e]"></div>
                                          
                                          <div className="flex gap-3 relative z-10">
                                            <div className="w-5 h-5 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center shrink-0 mt-0.5">
                                              <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
                                            </div>
                                            <div>
                                              <p className="text-xs font-medium text-white">Alert Triggered</p>
                                              <p className="text-[10px] text-[#7a95b8]">{new Date(alert.createdAt).toLocaleString()}</p>
                                            </div>
                                          </div>
                                          
                                          {alert.status !== "OPEN" && (
                                            <div className="flex gap-3 relative z-10">
                                              <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center shrink-0 mt-0.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                                              </div>
                                              <div>
                                                <p className="text-xs font-medium text-white">Acknowledged</p>
                                                <p className="text-[10px] text-[#7a95b8]">System User</p>
                                              </div>
                                            </div>
                                          )}
                                          
                                          {alert.status === "RESOLVED" && (
                                            <div className="flex gap-3 relative z-10">
                                              <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center shrink-0 mt-0.5">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                              </div>
                                              <div>
                                                <p className="text-xs font-medium text-white">Resolved</p>
                                                <p className="text-[10px] text-[#7a95b8]">Rebalance Executed</p>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="mt-4 pt-4 border-t border-[#12233e] flex justify-end gap-3">
                                      <button className="rc-btn bg-transparent hover:bg-[#12233e] text-[#c8d8ec] border border-[#2a4365] text-xs px-3 py-1.5 rounded transition-colors flex items-center">
                                        <FileText className="h-3 w-3 mr-1.5" /> View Full Profile
                                      </button>
                                      <button className="rc-btn bg-blue-600 hover:bg-blue-700 text-white border-none shadow-md text-xs px-3 py-1.5 rounded transition-colors flex items-center">
                                        <Zap className="h-3 w-3 mr-1.5" /> Generate Trade Ticket
                                      </button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex-1 overflow-auto custom-scrollbar p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {paginatedAlerts.map((alert) => {
                      const drift = parseFloat(String(alert.driftPct));
                      const current = parseFloat(String(alert.currentPct));
                      const target = parseFloat(String(alert.targetPct));
                      const isOver = current > target;
                      const statusStyle = STATUS_STYLES[alert.status] || { bg: "bg-[#12233e]", text: "text-[#c8d8ec]", label: alert.status };
                      const isSelected = selectedRows[alert.id];
                      
                      return (
                        <div key={alert.id} className={`bg-[#0a1526] rounded-xl border transition-all ${isSelected ? 'border-blue-500 ring-1 ring-blue-500/50' : 'border-[#12233e] hover:border-[#2a4365]'} p-4 relative group flex flex-col`}>
                          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <input 
                              type="checkbox" 
                              className="rounded border-[#2a4365] bg-[#0a1526] text-blue-500 focus:ring-blue-500 focus:ring-offset-[#0a1526] cursor-pointer"
                              checked={!!isSelected}
                              onChange={() => toggleRowSelection(alert.id)}
                            />
                          </div>
                          
                          <div className="flex justify-between items-start mb-4 pr-6">
                            <div>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-2 ${statusStyle.bg} ${statusStyle.text}`}>
                                {statusStyle.label}
                              </span>
                              <h4 className="font-mono text-sm font-bold text-white">{alert.clientId}</h4>
                              <p className="text-xs text-[#7a95b8] flex items-center gap-1 mt-1">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[uniqueAssetClasses.indexOf(alert.assetClass) % COLORS.length] }}></div>
                                {alert.assetClass}
                              </p>
                            </div>
                            
                            <div className={`flex flex-col items-end p-2 rounded-lg ${drift >= 10 ? 'bg-red-500/10' : drift >= 5 ? 'bg-amber-500/10' : 'bg-[#12233e]'}`}>
                              <span className="text-[10px] text-[#7a95b8] uppercase font-bold">Drift</span>
                              <span className={`text-lg font-bold ${drift >= 10 ? 'text-red-400' : drift >= 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                {isOver ? '+' : '-'}{drift.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-3 mb-4 flex-1">
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-[#7a95b8]">Target Allocation</span>
                                <span className="text-white font-medium">{target.toFixed(1)}%</span>
                              </div>
                              <div className="w-full bg-[#12233e] h-1.5 rounded-full overflow-hidden">
                                <div className="bg-[#34d399] h-full rounded-full" style={{ width: `${Math.min(target, 100)}%` }}></div>
                              </div>
                            </div>
                            
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-[#7a95b8]">Current Actual</span>
                                <span className={`font-medium flex items-center gap-1 ${isOver ? 'text-red-400' : 'text-blue-400'}`}>
                                  {isOver ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                  {current.toFixed(1)}%
                                </span>
                              </div>
                              <div className="w-full bg-[#12233e] h-1.5 rounded-full overflow-hidden relative">
                                <div className={`h-full rounded-full ${isOver ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(current, 100)}%` }}></div>
                                <div className="absolute top-0 bottom-0 w-0.5 bg-white z-10" style={{ left: `${Math.min(target, 100)}%` }}></div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="pt-3 border-t border-[#12233e] flex justify-between items-center mt-auto">
                            <span className="text-[10px] text-[#7a95b8] flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {new Date(alert.createdAt).toLocaleDateString()}
                            </span>
                            
                            <div className="flex gap-1">
                              {alert.status === "OPEN" && (
                                <button
                                  className="p-1.5 rounded bg-[#12233e] hover:bg-amber-500/20 text-[#7a95b8] hover:text-amber-400 transition-colors"
                                  onClick={() => acknowledge.mutate({ alertId: alert.id })}
                                  title="Acknowledge"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {(alert.status === "OPEN" || alert.status === "ACKNOWLEDGED") && (
                                <button
                                  className="p-1.5 rounded bg-[#12233e] hover:bg-emerald-500/20 text-[#7a95b8] hover:text-emerald-400 transition-colors"
                                  onClick={() => resolve.mutate({ alertId: alert.id })}
                                  title="Resolve"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                className="p-1.5 rounded bg-[#12233e] hover:bg-blue-500/20 text-[#7a95b8] hover:text-blue-400 transition-colors"
                                onClick={() => { setSelectedAlert(alert); setShowNotes(true); }}
                                title="Add Note"
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Pagination */}
              {filteredAlerts.length > 0 && (
                <div className="p-4 border-t border-[#12233e] bg-[#060d19] flex flex-col sm:flex-row justify-between items-center gap-4 rounded-b-xl">
                  <div className="text-sm text-[#7a95b8]">
                    Showing <span className="font-medium text-white">{(currentPage - 1) * pageSize + 1}</span> to <span className="font-medium text-white">{Math.min(currentPage * pageSize, filteredAlerts.length)}</span> of <span className="font-medium text-white">{filteredAlerts.length}</span> entries
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <select
                      className="bg-[#0a1526] border border-[#12233e] text-[#c8d8ec] text-sm rounded-lg p-1.5 outline-none"
                      value={pageSize}
                      onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                    >
                      <option value={10}>10 / page</option>
                      <option value={25}>25 / page</option>
                      <option value={50}>50 / page</option>
                      <option value={100}>100 / page</option>
                    </select>
                    
                    <div className="flex items-center bg-[#0a1526] rounded-lg border border-[#12233e] overflow-hidden">
                      <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-1.5 text-[#7a95b8] hover:text-white hover:bg-[#12233e] disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </button>
                      
                      <div className="px-3 text-sm font-medium text-white border-x border-[#12233e]">
                        {currentPage} / {totalPages || 1}
                      </div>
                      
                      <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="p-1.5 text-[#7a95b8] hover:text-white hover:bg-[#12233e] disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Content: Bulk Operations */}
        {activeTab === "bulk" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-[#0a1526] p-6 rounded-xl border border-[#12233e] shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Upload className="h-5 w-5 text-blue-400" /> 
                    Bulk Allocation Update
                  </h3>
                  <p className="text-sm text-[#7a95b8] mt-1">Upload CSV to update current allocations and run drift check.</p>
                </div>
                <button 
                  className="rc-btn bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  onClick={() => {
                    const csv = "clientName,assetClass,currentPct\nJohn Smith,US Equities,42.5\nJohn Smith,Fixed Income,28.0\nJane Doe,US Equities,38.0\nJane Doe,International,22.0";
                    const blob = new Blob([csv], { type: "text/csv" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a"); a.href = url; a.download = "allocation_template.csv"; a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="h-4 w-4" /> Template
                </button>
              </div>
              
              <div className="space-y-6">
                <div 
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${csvText ? 'border-blue-500/50 bg-blue-500/5' : 'border-[#2a4365] bg-[#060d19] hover:border-[#4b6382]'}`}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) { const r = new FileReader(); r.onload = () => setCsvText(r.result as string); r.readAsText(file); }
                  }}
                >
                  <FileSpreadsheet className={`h-12 w-12 mx-auto mb-4 ${csvText ? 'text-blue-400' : 'text-[#4b6382]'}`} />
                  <h4 className="text-white font-medium mb-1">Drag and drop your CSV file here</h4>
                  <p className="text-xs text-[#7a95b8] mb-4">or click to browse from your computer</p>
                  
                  <div className="relative inline-block">
                    <button className="rc-btn bg-[#12233e] hover:bg-[#1a3158] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                      Browse Files
                    </button>
                    <input 
                      type="file" 
                      accept=".csv,.txt" 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) { const r = new FileReader(); r.onload = () => setCsvText(r.result as string); r.readAsText(file); }
                      }} 
                    />
                  </div>
                </div>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#12233e]"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-[#0a1526] px-2 text-[#7a95b8]">OR PASTE DATA</span>
                  </div>
                </div>
                
                <div className="bg-[#060d19] rounded-xl border border-[#12233e] overflow-hidden focus-within:border-blue-500 transition-colors">
                  <div className="bg-[#12233e] px-4 py-2 flex justify-between items-center border-b border-[#1a3158]">
                    <span className="text-xs font-mono text-[#7a95b8]">clientName,assetClass,currentPct</span>
                    {csvText && (
                      <button onClick={() => setCsvText("")} className="text-xs text-red-400 hover:text-red-300">Clear</button>
                    )}
                  </div>
                  <textarea
                    className="w-full h-40 bg-transparent border-none text-[#c8d8ec] text-sm font-mono resize-y p-4 focus:outline-none focus:ring-0"
                    placeholder={"John Smith,US Equities,42.5\nJohn Smith,Fixed Income,28.0\nJane Doe,US Equities,38.0"}
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                  />
                </div>
                
                <button
                  onClick={() => bulkUpload.mutate({ csvText, threshold: threshold || 5 })}
                  disabled={!csvText.trim() || bulkUpload.isPending}
                  className="w-full rc-btn bg-blue-600 hover:bg-blue-700 disabled:bg-[#12233e] disabled:text-[#7a95b8] text-white border-none shadow-lg py-3 rounded-xl font-bold text-base transition-all flex justify-center items-center"
                >
                  {bulkUpload.isPending ? (
                    <><RefreshCw className="h-5 w-5 mr-2 animate-spin" /> Processing Data...</>
                  ) : (
                    <><Activity className="h-5 w-5 mr-2" /> Upload & Run Analysis</>
                  )}
                </button>
                
                {bulkUpload.data && (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 animate-in slide-in-from-top-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-emerald-400 font-bold mb-1">Processing Complete</h4>
                        <p className="text-sm text-[#c8d8ec]">
                          Successfully parsed <span className="font-bold text-white">{bulkUpload.data.rowsParsed}</span> rows, 
                          updated <span className="font-bold text-white">{bulkUpload.data.updated}</span> allocations, and 
                          generated <span className="font-bold text-white">{bulkUpload.data.alertsCreated}</span> new alerts.
                        </p>
                        
                        {bulkUpload.data.errors.length > 0 && (
                          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                            <p className="text-xs font-bold text-red-400 mb-2 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> Encountered Errors:
                            </p>
                            <ul className="list-disc pl-4 space-y-1 text-xs text-red-300 max-h-24 overflow-y-auto">
                              {bulkUpload.data.errors.map((err: string, i: number) => <li key={i}>{err}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-[#0a1526] p-6 rounded-xl border border-[#12233e] shadow-lg">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-purple-400" /> 
                  Automated Rebalancing Rules
                </h3>
                <div className="space-y-4">
                  {[
                    { title: "Cash Drag Prevention", desc: "Alert when cash exceeds 5% of portfolio", active: true },
                    { title: "Tax-Loss Harvesting", desc: "Identify positions down >10% for harvesting", active: false },
                    { title: "Wash Sale Avoidance", desc: "Block trades that trigger wash sales (30 days)", active: true },
                    { title: "Concentration Limits", desc: "Alert when single position exceeds 15%", active: true }
                  ].map((rule, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-[#060d19] rounded-lg border border-[#12233e]">
                      <div>
                        <h4 className="text-sm font-medium text-white">{rule.title}</h4>
                        <p className="text-xs text-[#7a95b8]">{rule.desc}</p>
                      </div>
                      <button className={`w-10 h-5 rounded-full relative transition-colors ${rule.active ? 'bg-emerald-500' : 'bg-[#12233e]'}`}>
                        <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-transform ${rule.active ? 'left-6' : 'left-1'}`} />
                      </button>
                    </div>
                  ))}
                  <button className="w-full py-2 border border-dashed border-[#2a4365] rounded-lg text-sm text-blue-400 hover:bg-blue-500/5 transition-colors flex items-center justify-center gap-2">
                    <Plus className="h-4 w-4" /> Add Custom Rule
                  </button>
                </div>
              </div>
              
              <div className="bg-[#0a1526] p-6 rounded-xl border border-[#12233e] shadow-lg">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-400" /> 
                  System Status
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-[#060d19] rounded-lg border border-[#12233e]">
                    <div className="text-xs text-[#7a95b8] mb-1">Last Data Sync</div>
                    <div className="text-sm font-medium text-white flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Today, 08:30 AM
                    </div>
                  </div>
                  <div className="p-4 bg-[#060d19] rounded-lg border border-[#12233e]">
                    <div className="text-xs text-[#7a95b8] mb-1">Pricing Engine</div>
                    <div className="text-sm font-medium text-white flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Real-time Active
                    </div>
                  </div>
                  <div className="p-4 bg-[#060d19] rounded-lg border border-[#12233e]">
                    <div className="text-xs text-[#7a95b8] mb-1">Accounts Monitored</div>
                    <div className="text-xl font-bold text-white">1,248</div>
                  </div>
                  <div className="p-4 bg-[#060d19] rounded-lg border border-[#12233e]">
                    <div className="text-xs text-[#7a95b8] mb-1">Total AUM</div>
                    <div className="text-xl font-bold text-white">$482.5M</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notes Modal */}
        {showNotes && selectedAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#0a1526] border border-[#12233e] rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-5 py-4 border-b border-[#12233e] flex justify-between items-center bg-[#060d19]">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-blue-400" />
                  Add Note to Alert
                </h3>
                <button onClick={() => setShowNotes(false)} className="text-[#7a95b8] hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-5 space-y-4">
                <div className="bg-[#12233e]/50 p-3 rounded-lg border border-[#1a3158]">
                  <p className="text-xs text-[#7a95b8] mb-1">Alert Context:</p>
                  <p className="text-sm text-white font-medium">{selectedAlert.clientId} - {selectedAlert.assetClass}</p>
                  <p className="text-xs text-red-400 mt-1">Drift: {parseFloat(String(selectedAlert.driftPct)).toFixed(2)}%</p>
                </div>
                
                <form onSubmit={handleNotesSubmit}>
                  <label className="block text-sm font-medium text-[#c8d8ec] mb-2">Note Content</label>
                  <textarea
                    className="w-full bg-[#060d19] border border-[#12233e] rounded-lg p-3 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none min-h-[120px] resize-none"
                    placeholder="E.g., Client requested holding off on rebalancing until next month due to tax considerations..."
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    autoFocus
                  />
                  
                  <div className="mt-5 flex justify-end gap-3">
                    <button 
                      type="button" 
                      onClick={() => setShowNotes(false)}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-[#c8d8ec] hover:bg-[#12233e] transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={!notesText.trim() || addNote.isPending}
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                    >
                      {addNote.isPending ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Save Note
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
      <PageInsights pageId="rebalance-alerts" />
    </AppShell>
  );
}
