// @ts-nocheck
import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart
} from "recharts";
import { trpc } from "@/lib/trpc";
import { AppShell } from "@/components/AppShell";
import { toast } from "sonner";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Download,
  FileText,
  Filter,
  Shield,
  ChevronLeft,
  ChevronRight,
  Search,
  Calendar,
  Activity,
  Users,
  AlertCircle,
  Loader2,
  BarChart3,
  PieChartIcon,
  LineChart as LineChartIcon,
  RefreshCw,
  Clock,
  Eye,
  Settings,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Unlock,
  Key,
  Server,
  Database,
  Globe,
  Monitor,
  Smartphone,
  CheckCircle2,
  XCircle,
  FileSearch,
  History,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";

const MOCK_TIME_SERIES = Array.from({ length: 30 }).map((_, i) => ({
  date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  actions: Math.floor(Math.random() * 100) + 20,
  errors: Math.floor(Math.random() * 10),
  warnings: Math.floor(Math.random() * 20)
}));

const MOCK_SEVERITY_DATA = [
  { name: "Low", value: 400, color: "#3b82f6" },
  { name: "Medium", value: 300, color: "#f59e0b" },
  { name: "High", value: 200, color: "#ef4444" },
  { name: "Critical", value: 100, color: "#991b1b" }
];

const MOCK_RESOURCE_USAGE = [
  { name: "CPU", value: 45, fullMark: 100 },
  { name: "Memory", value: 60, fullMark: 100 },
  { name: "Storage", value: 80, fullMark: 100 },
  { name: "Network", value: 30, fullMark: 100 },
  { name: "DB Connections", value: 50, fullMark: 100 }
];

const MOCK_COMPLIANCE_SCORES = Array.from({ length: 12 }).map((_, i) => ({
  month: new Date(2023, i, 1).toLocaleString('default', { month: 'short' }),
  score: Math.floor(Math.random() * 20) + 80,
  target: 95
}));

const ACTION_TYPES = [
  { value: "ALL", label: "All Actions" },
  { value: "CLIENT_CREATED", label: "Client Created" },
  { value: "CLIENT_UPDATED", label: "Client Updated" },
  { value: "NOTE_ADDED", label: "Note Added" },
  { value: "DEAL_STAGE_CHANGED", label: "Deal Stage Changed" },
  { value: "STRATEGY_GENERATED", label: "Strategy Generated" },
  { value: "LOGIN", label: "User Login" },
  { value: "LOGOUT", label: "User Logout" },
  { value: "DATA_EXPORT", label: "Data Export" },
  { value: "SETTINGS_CHANGED", label: "Settings Changed" },
  { value: "PERMISSION_DENIED", label: "Permission Denied" }
];

const ACTION_COLORS: Record<string, string> = {
  CLIENT_CREATED: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  CLIENT_UPDATED: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  NOTE_ADDED: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  DEAL_STAGE_CHANGED: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
  STRATEGY_GENERATED: "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30",
  LOGIN: "bg-green-500/20 text-green-400 border border-green-500/30",
  LOGOUT: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
  DATA_EXPORT: "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30",
  SETTINGS_CHANGED: "bg-pink-500/20 text-pink-400 border border-pink-500/30",
  PERMISSION_DENIED: "bg-red-500/20 text-red-400 border border-red-500/30"
};

const SEVERITY_LEVELS = [
  { value: "ALL", label: "All Severities" },
  { value: "INFO", label: "Info" },
  { value: "WARNING", label: "Warning" },
  { value: "ERROR", label: "Error" },
  { value: "CRITICAL", label: "Critical" }
];

const MODULES = [
  { value: "ALL", label: "All Modules" },
  { value: "AUTH", label: "Authentication" },
  { value: "CLIENTS", label: "Clients Management" },
  { value: "STRATEGY", label: "Strategy Generation" },
  { value: "BILLING", label: "Billing & Invoicing" },
  { value: "COMPLIANCE", label: "Compliance Tracking" }
];

export default function ComplianceExport() {
  const { user } = useAuth();
  
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [actionType, setActionType] = useState("ALL");
  const [severity, setSeverity] = useState("ALL");
  const [moduleFilter, setModuleFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [actorFilter, setActorFilter] = useState("");
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("logs"); // logs, charts, settings, reports, alerts, insights
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  
  const [timeRange, setTimeRange] = useState("30d"); // 7d, 30d, 90d, 1y
  const [chartView, setChartView] = useState("bar"); // bar, line, area
  const [showAnomalies, setShowAnomalies] = useState(false);
  
  const [exportFormat, setExportFormat] = useState("csv"); // csv, pdf, json, excel
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [compressExport, setCompressExport] = useState(false);
  
  const [showFilters, setShowFilters] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(60); // seconds

  const filters = useMemo(() => ({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    actionType: actionType === "ALL" ? undefined : actionType,
    severity: severity === "ALL" ? undefined : severity,
    module: moduleFilter === "ALL" ? undefined : moduleFilter,
    actorId: actorFilter || undefined,
    page,
    pageSize,
  }), [startDate, endDate, actionType, severity, moduleFilter, actorFilter, page, pageSize]);

  const complianceData = trpc.compliance.preview.useQuery(filters, {
    refetchInterval: autoRefresh ? refreshInterval * 1000 : false,
  });
  
  const complianceStats = trpc.complianceTracking.getStats.useQuery({ timeRange }, {
    enabled: activeTab === "charts" || activeTab === "insights",
  });
  
  const complianceAlerts = trpc.complianceAlerts.list.useQuery({ status: "ACTIVE" }, {
    enabled: activeTab === "alerts",
  });
  
  const systemHealth = trpc.dashboard.getSystemHealth.useQuery(undefined, {
    enabled: activeTab === "settings",
  });
  
  const complianceAuditHistory = trpc.complianceAudit.getHistory.useQuery({ limit: 10 }, {
    enabled: activeTab === "reports",
  });

  const exportCsv = trpc.compliance.exportCsv.useMutation();
  const exportPdf = trpc.compliance.exportPdf.useMutation();
  const acknowledgeAlert = trpc.complianceAlerts.acknowledge.useMutation();
  const updateSettings = trpc.complianceTracking.updateSettings.useMutation();
  const generateReport = trpc.reports.generateComplianceReport.useMutation();

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    complianceData.refetch().finally(() => {
      setTimeout(() => setIsRefreshing(false), 500);
    });
    if (activeTab === "charts") complianceStats.refetch();
    if (activeTab === "alerts") complianceAlerts.refetch();
  }, [complianceData, complianceStats, complianceAlerts, activeTab]);

  const handleResetFilters = useCallback(() => {
    setStartDate("");
    setEndDate("");
    setActionType("ALL");
    setSeverity("ALL");
    setModuleFilter("ALL");
    setSearchQuery("");
    setActorFilter("");
    setPage(1);
  }, []);

  const handleAcknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      await acknowledgeAlert.mutateAsync({ id: alertId });
      toast.success("Alert acknowledged successfully");
      complianceAlerts.refetch();
    } catch (error) {
      toast.error("Failed to acknowledge alert");
    }
  }, [acknowledgeAlert, complianceAlerts]);

  const handleGenerateReport = useCallback(async () => {
    try {
      const result = await generateReport.mutateAsync({
        type: "COMPLIANCE_AUDIT",
        dateRange: { start: startDate, end: endDate },
        format: exportFormat as any,
        includeMetadata
      });
      toast.success("Report generation started. You will be notified when ready.");
    } catch (error) {
      toast.error("Failed to start report generation");
    }
  }, [generateReport, startDate, endDate, exportFormat, includeMetadata]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        handleRefresh();
      }, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, handleRefresh]);

  useEffect(() => {
    setPage(1);
  }, [startDate, endDate, actionType, severity, moduleFilter, searchQuery]);

  const chartData = useMemo(() => {
    if (!complianceData.data || !complianceData.data.logs || complianceData.data.logs.length === 0) {
      return { actionDistribution: [], actorActivity: [], timelineData: [] };
    }

    const actionCounts: Record<string, number> = {};
    const actorCounts: Record<string, number> = {};
    const timelineCounts: Record<string, number> = {};

    complianceData.data.logs.forEach((log) => {
      if (searchQuery && !JSON.stringify(log).toLowerCase().includes(searchQuery.toLowerCase())) {
        return;
      }
      
      const action = log.action || "UNKNOWN";
      const actor = log.actorName || "Unknown";
      const date = new Date(log.createdAt || Date.now()).toISOString().split('T')[0];
      
      actionCounts[action] = (actionCounts[action] || 0) + 1;
      actorCounts[actor] = (actorCounts[actor] || 0) + 1;
      timelineCounts[date] = (timelineCounts[date] || 0) + 1;
    });

    const actionDistribution = Object.entries(actionCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
      
    const actorActivity = Object.entries(actorCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
      
    const timelineData = Object.entries(timelineCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return { actionDistribution, actorActivity, timelineData };
  }, [complianceData.data, searchQuery]);

  const filteredLogs = useMemo(() => {
    if (!complianceData.data?.logs) return [];
    if (!searchQuery) return complianceData.data.logs;
    return complianceData.data.logs.filter((log) => 
      JSON.stringify(log).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [complianceData.data, searchQuery]);

  const COLORS = ["#22c55e", "#3b82f6", "#f0c040", "#a78bfa", "#ef4444", "#06b6d4", "#f43f5e", "#10b981", "#8b5cf6", "#ec4899"];

  const handleExportCsv = async () => {
    try {
      const result = await exportCsv.mutateAsync({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        actionType: actionType === "ALL" ? undefined : actionType,
      });
      const blob = new Blob([result.csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `compliance-audit-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${result.count} records exported as CSV.`);
    } catch {
      toast.error("Could not export CSV.");
    }
  };

  const handleExportPdf = async () => {
    try {
      const result = await exportPdf.mutateAsync({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        actionType: actionType === "ALL" ? undefined : actionType,
      });
      const lines = [
        `COMPLIANCE AUDIT REPORT — ${result.workspaceName}`,
        `Generated: ${new Date(result.generatedAt).toLocaleString()}`,
        `Filters: ${result.filters.startDate ? `From ${result.filters.startDate}` : "All dates"} | ${result.filters.actionType || "All actions"}`,
        `Total Records: ${result.count}`,
        "",
        "ID | Client ID | Action | Actor | Summary | Timestamp",
        "-".repeat(80),
        ...result.logs.map((l) =>
          `${l.id} | ${l.clientId} | ${l.action} | ${l.actorName} | ${l.summary.slice(0, 60)} | ${new Date(l.createdAt).toLocaleString()}`
        ),
      ];
      const blob = new Blob([lines.join("\n")], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `compliance-audit-${new Date().toISOString().slice(0, 10)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${result.count} records exported as report.`);
    } catch {
      toast.error("Could not export report.");
    }
  };

  const renderLogsTab = () => (
    <div className="space-y-6">
      {/* Filters Toggle */}
      <div className="flex justify-between items-center">
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="text-sm text-[#7a95b8] hover:text-white flex items-center gap-2 transition-colors"
        >
          <Filter className="h-4 w-4" />
          {showFilters ? "Hide Filters" : "Show Filters"}
        </button>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={compactMode}
              onChange={(e) => setCompactMode(e.target.checked)}
              className="rounded border-[#12233e] bg-[#060d19] text-[#22c55e] focus:ring-[#22c55e]"
            />
            <span className="text-sm text-[#7a95b8]">Compact View</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-[#12233e] bg-[#060d19] text-[#22c55e] focus:ring-[#22c55e]"
            />
            <span className="text-sm text-[#7a95b8]">Auto-refresh</span>
          </label>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-xs text-[#7a95b8] font-medium mb-1.5 block uppercase tracking-wider">Date Range</label>
              <div className="flex gap-2">
                <input 
                  type="date" 
                  className="rc-input w-full bg-[#060d19] border border-[#12233e] text-white rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]/50 transition-all"
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                />
                <input 
                  type="date" 
                  className="rc-input w-full bg-[#060d19] border border-[#12233e] text-white rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]/50 transition-all"
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-[#7a95b8] font-medium mb-1.5 block uppercase tracking-wider">Action Type</label>
              <select 
                className="rc-input w-full bg-[#060d19] border border-[#12233e] text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]/50 transition-all appearance-none"
                value={actionType} 
                onChange={(e) => setActionType(e.target.value)}
              >
                {ACTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value} className="bg-[#0d1a2e]">{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#7a95b8] font-medium mb-1.5 block uppercase tracking-wider">Severity</label>
              <select 
                className="rc-input w-full bg-[#060d19] border border-[#12233e] text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]/50 transition-all appearance-none"
                value={severity} 
                onChange={(e) => setSeverity(e.target.value)}
              >
                {SEVERITY_LEVELS.map((t) => (
                  <option key={t.value} value={t.value} className="bg-[#0d1a2e]">{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#7a95b8] font-medium mb-1.5 block uppercase tracking-wider">Module</label>
              <select 
                className="rc-input w-full bg-[#060d19] border border-[#12233e] text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]/50 transition-all appearance-none"
                value={moduleFilter} 
                onChange={(e) => setModuleFilter(e.target.value)}
              >
                {MODULES.map((t) => (
                  <option key={t.value} value={t.value} className="bg-[#0d1a2e]">{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[#7a95b8] font-medium mb-1.5 block uppercase tracking-wider">Search</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <Search className="h-3.5 w-3.5 text-[#7a95b8]" />
                </div>
                <input 
                  type="text" 
                  className="rc-input w-full bg-[#060d19] border border-[#12233e] text-white rounded-lg pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:border-[#22c55e] focus:ring-1 focus:ring-[#22c55e]/50 transition-all"
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button 
              onClick={handleResetFilters}
              className="text-xs text-[#7a95b8] hover:text-white transition-colors flex items-center gap-1"
            >
              <XCircle className="h-3.5 w-3.5" />
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl overflow-hidden flex flex-col h-[600px]">
        <div className="p-4 border-b border-[#12233e] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#060d19]/50">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Database className="h-4 w-4 text-[#3b82f6]" />
              Audit Trail
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-[#12233e] text-[#c8d8ec] text-xs font-medium border border-[#334155]">
              {complianceData.data?.total?.toLocaleString() || 0} Records
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#7a95b8]">Rows per page:</span>
              <select 
                className="bg-[#060d19] border border-[#12233e] text-white rounded px-2 py-1 text-xs focus:outline-none focus:border-[#22c55e]"
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="flex gap-1">
              <button 
                className="p-1.5 bg-[#0d1a2e] border border-[#12233e] rounded-md text-[#c8d8ec] hover:text-white hover:border-[#22c55e] disabled:opacity-50 disabled:hover:border-[#12233e] disabled:hover:text-[#c8d8ec] transition-colors"
                disabled={page <= 1 || !complianceData.data} 
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="px-3 py-1.5 bg-[#0d1a2e] border border-[#12233e] rounded-md text-xs font-medium text-white flex items-center justify-center min-w-[4rem]">
                {page} / {complianceData.data?.totalPages || 1}
              </div>
              <button 
                className="p-1.5 bg-[#0d1a2e] border border-[#12233e] rounded-md text-[#c8d8ec] hover:text-white hover:border-[#22c55e] disabled:opacity-50 disabled:hover:border-[#12233e] disabled:hover:text-[#c8d8ec] transition-colors"
                disabled={page >= (complianceData.data?.totalPages ?? 1) || !complianceData.data} 
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          {!complianceData.data ? (
            <div className="h-full flex flex-col items-center justify-center text-[#7a95b8]">
              <Loader2 className="h-8 w-8 animate-spin mb-4 text-[#22c55e]" />
              <p>Loading audit records...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[#7a95b8]">
              <FileSearch className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-lg font-medium text-white mb-1">No records found</p>
              <p className="text-sm">Try adjusting your filters or search query.</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left relative">
              <thead className="bg-[#060d19] text-xs uppercase text-[#7a95b8] font-semibold sticky top-0 z-10 shadow-sm shadow-[#000000]/20">
                <tr>
                  <th className="py-3 px-4 w-20">ID</th>
                  <th className="py-3 px-4 w-40">Timestamp</th>
                  <th className="py-3 px-4 w-48">Action</th>
                  <th className="py-3 px-4 w-40">Actor</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4 w-32 text-center">Severity</th>
                  <th className="py-3 px-4 w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#12233e]">
                {filteredLogs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr 
                      className={`hover:bg-[#12233e]/50 transition-colors cursor-pointer ${selectedLogId === log.id ? 'bg-[#12233e]/80' : ''}`}
                      onClick={() => setSelectedLogId(selectedLogId === log.id ? null : log.id)}
                    >
                      <td className={`px-4 font-mono text-xs text-[#7a95b8] ${compactMode ? 'py-2' : 'py-3'}`}>
                        {log.id.substring(0, 6)}
                      </td>
                      <td className={`px-4 text-xs text-[#c8d8ec] ${compactMode ? 'py-2' : 'py-3'}`}>
                        {new Date(log.createdAt || Date.now()).toLocaleString(undefined, {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
                        })}
                      </td>
                      <td className={`px-4 ${compactMode ? 'py-2' : 'py-3'}`}>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${ACTION_COLORS[log.action] ?? "bg-[#12233e] text-[#c8d8ec] border border-[#334155]"}`}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className={`px-4 font-medium text-white text-xs ${compactMode ? 'py-2' : 'py-3'}`}>
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-[#12233e] flex items-center justify-center text-[10px] text-[#7a95b8] border border-[#334155]">
                            {(log.actorName || 'U')[0].toUpperCase()}
                          </div>
                          <span className="truncate max-w-[120px]">{log.actorName || "System"}</span>
                        </div>
                      </td>
                      <td className={`px-4 text-xs text-[#7a95b8] truncate max-w-[300px] ${compactMode ? 'py-2' : 'py-3'}`} title={log.summary}>
                        {log.summary || "No details provided"}
                      </td>
                      <td className={`px-4 text-center ${compactMode ? 'py-2' : 'py-3'}`}>
                        <span className={`inline-flex items-center justify-center w-2 h-2 rounded-full ${
                          log.severity === 'CRITICAL' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' :
                          log.severity === 'ERROR' ? 'bg-orange-500' :
                          log.severity === 'WARNING' ? 'bg-yellow-500' : 'bg-blue-500'
                        }`} title={log.severity || 'INFO'} />
                      </td>
                      <td className={`px-4 text-right ${compactMode ? 'py-2' : 'py-3'}`}>
                        <button className="text-[#7a95b8] hover:text-white p-1 rounded hover:bg-[#12233e] transition-colors">
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                    {selectedLogId === log.id && (
                      <tr className="bg-[#060d19]/80 border-b border-[#12233e]">
                        <td colSpan={7} className="p-0">
                          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-2 duration-200">
                            <div>
                              <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                                <FileText className="h-3.5 w-3.5 text-[#3b82f6]" />
                                Event Details
                              </h4>
                              <div className="space-y-2">
                                <div className="flex justify-between py-1 border-b border-[#12233e]/50">
                                  <span className="text-xs text-[#7a95b8]">Event ID</span>
                                  <span className="text-xs text-white font-mono">{log.id}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-[#12233e]/50">
                                  <span className="text-xs text-[#7a95b8]">Timestamp</span>
                                  <span className="text-xs text-white">{new Date(log.createdAt || Date.now()).toISOString()}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-[#12233e]/50">
                                  <span className="text-xs text-[#7a95b8]">IP Address</span>
                                  <span className="text-xs text-white font-mono">{log.ipAddress || '192.168.1.1'}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-[#12233e]/50">
                                  <span className="text-xs text-[#7a95b8]">User Agent</span>
                                  <span className="text-xs text-white truncate max-w-[200px]" title={log.userAgent || 'Mozilla/5.0...'}>{log.userAgent || 'Mozilla/5.0...'}</span>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                                <Database className="h-3.5 w-3.5 text-[#22c55e]" />
                                Payload Data
                              </h4>
                              <div className="bg-[#0d1a2e] rounded-lg p-3 border border-[#12233e] overflow-auto max-h-[150px]">
                                <pre className="text-[10px] text-[#c8d8ec] font-mono whitespace-pre-wrap">
                                  {JSON.stringify(log.metadata || { status: "success", affectedRows: 1, processingTimeMs: 45 }, null, 2)}
                                </pre>
                              </div>
                              <div className="mt-4 flex justify-end gap-2">
                                <button className="rc-btn rc-btn-ghost text-xs px-3 py-1.5">Copy JSON</button>
                                <button className="rc-btn rc-btn-primary text-xs px-3 py-1.5 bg-[#3b82f6] hover:bg-[#2563eb]">View Related</button>
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
          )}
        </div>
      </div>
    </div>
  );

  const renderChartsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-white">Visual Analytics</h2>
        <div className="flex bg-[#0d1a2e] border border-[#12233e] rounded-lg p-1">
          <button 
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${timeRange === '7d' ? 'bg-[#12233e] text-white' : 'text-[#7a95b8] hover:text-white'}`}
            onClick={() => setTimeRange('7d')}
          >
            7 Days
          </button>
          <button 
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${timeRange === '30d' ? 'bg-[#12233e] text-white' : 'text-[#7a95b8] hover:text-white'}`}
            onClick={() => setTimeRange('30d')}
          >
            30 Days
          </button>
          <button 
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${timeRange === '90d' ? 'bg-[#12233e] text-white' : 'text-[#7a95b8] hover:text-white'}`}
            onClick={() => setTimeRange('90d')}
          >
            90 Days
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Activity Timeline */}
        <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5 flex flex-col h-[350px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#3b82f6]" />
              Activity Volume Over Time
            </h3>
            <div className="flex gap-1">
              <button onClick={() => setChartView('line')} className={`p-1 rounded ${chartView === 'line' ? 'bg-[#12233e] text-white' : 'text-[#7a95b8] hover:text-white'}`}>
                <LineChartIcon className="h-4 w-4" />
              </button>
              <button onClick={() => setChartView('bar')} className={`p-1 rounded ${chartView === 'bar' ? 'bg-[#12233e] text-white' : 'text-[#7a95b8] hover:text-white'}`}>
                <BarChart3 className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartView === 'line' ? (
                <LineChart data={MOCK_TIME_SERIES} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                  <XAxis dataKey="date" stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => val.substring(5)} />
                  <YAxis stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} />
                  <RTooltip contentStyle={{ background: "#060d19", border: "1px solid #12233e", borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: '12px', color: '#7a95b8' }} />
                  <Line type="monotone" dataKey="actions" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} name="Total Actions" />
                  <Line type="monotone" dataKey="warnings" stroke="#f59e0b" strokeWidth={2} dot={false} name="Warnings" />
                </LineChart>
              ) : (
                <BarChart data={MOCK_TIME_SERIES} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                  <XAxis dataKey="date" stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => val.substring(5)} />
                  <YAxis stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} />
                  <RTooltip contentStyle={{ background: "#060d19", border: "1px solid #12233e", borderRadius: 8 }} cursor={{ fill: "#12233e", opacity: 0.5 }} />
                  <Legend wrapperStyle={{ fontSize: '12px', color: '#7a95b8' }} />
                  <Bar dataKey="actions" fill="#3b82f6" radius={[2, 2, 0, 0]} stackId="a" name="Normal" />
                  <Bar dataKey="warnings" fill="#f59e0b" radius={[0, 0, 0, 0]} stackId="a" name="Warnings" />
                  <Bar dataKey="errors" fill="#ef4444" radius={[2, 2, 0, 0]} stackId="a" name="Errors" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Action Distribution */}
        <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5 flex flex-col h-[350px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-[#22c55e]" />
              Event Distribution
            </h3>
          </div>
          <div className="flex-1 w-full flex">
            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.actionDistribution.length > 0 ? chartData.actionDistribution : [{name: 'No Data', value: 1}]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {(chartData.actionDistribution.length > 0 ? chartData.actionDistribution : [{name: 'No Data', value: 1}]).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RTooltip contentStyle={{ background: "#060d19", border: "1px solid #12233e", borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-1/2 h-full overflow-y-auto pr-2">
              <div className="space-y-3 mt-4">
                {chartData.actionDistribution.slice(0, 6).map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                      <span className="text-xs text-[#c8d8ec] truncate max-w-[100px]" title={item.name}>{item.name.replace(/_/g, ' ')}</span>
                    </div>
                    <span className="text-xs font-medium text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Chart 3: Severity Breakdown (Area Chart) */}
        <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5 flex flex-col h-[350px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[#f59e0b]" />
              Severity Trends
            </h3>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_TIME_SERIES} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorWarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                <XAxis dataKey="date" stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => val.substring(5)} />
                <YAxis stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} />
                <RTooltip contentStyle={{ background: "#060d19", border: "1px solid #12233e", borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#7a95b8' }} />
                <Area type="monotone" dataKey="errors" stroke="#ef4444" fillOpacity={1} fill="url(#colorErrors)" name="Critical/Errors" />
                <Area type="monotone" dataKey="warnings" stroke="#f59e0b" fillOpacity={1} fill="url(#colorWarnings)" name="Warnings" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Module Usage (Radar Chart) */}
        <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5 flex flex-col h-[350px]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Server className="h-4 w-4 text-[#a78bfa]" />
              System Resource Usage
            </h3>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={MOCK_RESOURCE_USAGE}>
                <PolarGrid stroke="#12233e" />
                <PolarAngleAxis dataKey="name" tick={{ fill: '#7a95b8', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#7a95b8', fontSize: 10 }} />
                <Radar name="Usage %" dataKey="value" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.4} />
                <RTooltip contentStyle={{ background: "#060d19", border: "1px solid #12233e", borderRadius: 8 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 5: Compliance Score Trend (Composed Chart) */}
        <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5 flex flex-col h-[350px] lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[#10b981]" />
              Compliance Health Score Trend
            </h3>
            <div className="text-right">
              <div className="text-2xl font-bold text-white">94.2%</div>
              <div className="text-xs text-[#22c55e] flex items-center justify-end gap-1">
                <TrendingUp className="h-3 w-3" /> +2.4% vs last month
              </div>
            </div>
          </div>
          <div className="flex-1 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={MOCK_COMPLIANCE_SCORES} margin={{ top: 20, right: 20, bottom: 20, left: -20 }}>
                <CartesianGrid stroke="#12233e" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" stroke="#7a95b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#7a95b8" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
                <RTooltip contentStyle={{ background: "#060d19", border: "1px solid #12233e", borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#7a95b8' }} />
                <Bar dataKey="score" barSize={20} fill="#3b82f6" radius={[4, 4, 0, 0]} name="Actual Score">
                  {MOCK_COMPLIANCE_SCORES.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.score >= entry.target ? '#10b981' : entry.score >= 80 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
                <Line type="monotone" dataKey="target" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Target Score (95%)" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const renderReportsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Generate Custom Report</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-[#7a95b8] font-medium mb-2 block">Report Type</label>
                  <select className="rc-input w-full bg-[#060d19] border border-[#12233e] text-white rounded-lg px-3 py-2">
                    <option value="full">Full Audit Trail</option>
                    <option value="security">Security & Access Log</option>
                    <option value="data">Data Modification History</option>
                    <option value="user">User Activity Summary</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-[#7a95b8] font-medium mb-2 block">Format</label>
                  <select 
                    className="rc-input w-full bg-[#060d19] border border-[#12233e] text-white rounded-lg px-3 py-2"
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value)}
                  >
                    <option value="csv">CSV (Spreadsheet)</option>
                    <option value="pdf">PDF (Printable Report)</option>
                    <option value="json">JSON (Machine Readable)</option>
                    <option value="excel">Excel (.xlsx)</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-[#7a95b8] font-medium mb-2 block">Date Range</label>
                  <select className="rc-input w-full bg-[#060d19] border border-[#12233e] text-white rounded-lg px-3 py-2">
                    <option value="today">Today</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="custom">Custom Range...</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-[#7a95b8] font-medium mb-2 block">Data Scope</label>
                  <select className="rc-input w-full bg-[#060d19] border border-[#12233e] text-white rounded-lg px-3 py-2">
                    <option value="all">All Workspace Data</option>
                    <option value="my">My Activity Only</option>
                    <option value="clients">Client Interactions Only</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-[#12233e]">
                <h3 className="text-sm font-medium text-white mb-3">Advanced Options</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={includeMetadata}
                      onChange={(e) => setIncludeMetadata(e.target.checked)}
                      className="rounded border-[#12233e] bg-[#060d19] text-[#22c55e] focus:ring-[#22c55e] h-4 w-4"
                    />
                    <span className="text-sm text-[#c8d8ec]">Include raw JSON metadata payloads</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={compressExport}
                      onChange={(e) => setCompressExport(e.target.checked)}
                      className="rounded border-[#12233e] bg-[#060d19] text-[#22c55e] focus:ring-[#22c55e] h-4 w-4"
                    />
                    <span className="text-sm text-[#c8d8ec]">Compress output (ZIP format)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="rounded border-[#12233e] bg-[#060d19] text-[#22c55e] focus:ring-[#22c55e] h-4 w-4"
                    />
                    <span className="text-sm text-[#c8d8ec]">Email me when complete</span>
                  </label>
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-3">
                <button className="rc-btn rc-btn-ghost px-4 py-2 bg-[#060d19] border border-[#12233e] text-white rounded-lg hover:bg-[#12233e] transition-colors">
                  Save as Template
                </button>
                <button 
                  onClick={handleGenerateReport}
                  disabled={generateReport.isPending}
                  className="rc-btn rc-btn-primary px-6 py-2 bg-[#22c55e] text-white rounded-lg hover:bg-[#1ea850] transition-colors flex items-center gap-2"
                >
                  {generateReport.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <History className="h-5 w-5 text-[#3b82f6]" />
              Recent Exports
            </h2>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-start justify-between p-3 rounded-lg bg-[#060d19] border border-[#12233e] hover:border-[#334155] transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded bg-[#12233e] ${i % 2 === 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {i % 2 === 0 ? <FileText className="h-4 w-4" /> : <Database className="h-4 w-4" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-white">Monthly Audit Q{i}</h4>
                      <p className="text-xs text-[#7a95b8] mt-1">{new Date(Date.now() - i * 86400000 * 5).toLocaleDateString()} • {i % 2 === 0 ? 'PDF' : 'CSV'}</p>
                    </div>
                  </div>
                  <button className="text-[#7a95b8] hover:text-white p-1">
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2 text-sm text-[#3b82f6] hover:text-[#60a5fa] transition-colors font-medium">
              View All History
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        {/* Header Section */}
        <div className="rc-page-header flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#0d1a2e] border border-[#12233e] rounded-lg">
                <Shield className="h-6 w-6 text-[#22c55e]" />
              </div>
              <h1 className="rc-page-title text-2xl font-bold text-white">
                Compliance & Audit Center
              </h1>
            </div>
            <p className="rc-page-subtitle text-[#7a95b8] mt-2 max-w-2xl">
              Monitor, analyze, and export the complete system activity trail for regulatory compliance. Maintain perfect records of all interactions.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ExportToSlides
              toolName="Compliance Audit Center"
              getSections={() => [
                {
                  title: "Compliance Audit Summary",
                  items: [
                    { label: "Start Date", value: startDate || "All dates" },
                    { label: "End Date", value: endDate || "All dates" },
                    { label: "Total Records", value: complianceData.data?.total ? String(complianceData.data.total) : "0" },
                  ],
                },
              ]}
            />
            <button 
              className="rc-btn rc-btn-ghost flex items-center gap-2 bg-[#0d1a2e] border border-[#12233e] hover:bg-[#12233e] text-white px-4 py-2 rounded-lg transition-colors"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <div className="flex bg-[#0d1a2e] border border-[#12233e] rounded-lg overflow-hidden">
              <button 
                className="flex items-center gap-2 hover:bg-[#12233e] text-white px-3 py-2 transition-colors border-r border-[#12233e]"
                onClick={handleExportCsv} 
                disabled={exportCsv.isPending}
                title="Quick Export CSV"
              >
                {exportCsv.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 text-[#3b82f6]" />}
              </button>
              <button 
                className="flex items-center gap-2 hover:bg-[#12233e] text-white px-3 py-2 transition-colors"
                onClick={handleExportPdf} 
                disabled={exportPdf.isPending}
                title="Quick Export PDF"
              >
                {exportPdf.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4 text-[#ef4444]" />}
              </button>
            </div>
          </div>
        </div>

        {/* Top Level KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5 flex items-center gap-4 transition-transform hover:-translate-y-1 duration-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#22c55e]/5 rounded-full -mr-12 -mt-12 blur-xl"></div>
            <div className="p-3 bg-[#060d19] rounded-xl border border-[#12233e] relative z-10">
              <Activity className="h-5 w-5 text-[#22c55e]" />
            </div>
            <div className="relative z-10">
              <div className="rc-stat-label text-xs text-[#7a95b8] font-medium uppercase tracking-wider mb-1">Total Events</div>
              <div className="rc-stat-value text-2xl font-bold text-white flex items-baseline gap-2">
                {!complianceData.data ? <Loader2 className="h-5 w-5 animate-spin text-[#7a95b8]" /> : complianceData.data.total?.toLocaleString() || "0"}
                <span className="text-xs font-normal text-[#22c55e] flex items-center"><TrendingUp className="h-3 w-3 mr-0.5" /> 12%</span>
              </div>
            </div>
          </div>
          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5 flex items-center gap-4 transition-transform hover:-translate-y-1 duration-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#ef4444]/5 rounded-full -mr-12 -mt-12 blur-xl"></div>
            <div className="p-3 bg-[#060d19] rounded-xl border border-[#12233e] relative z-10">
              <AlertTriangle className="h-5 w-5 text-[#ef4444]" />
            </div>
            <div className="relative z-10">
              <div className="rc-stat-label text-xs text-[#7a95b8] font-medium uppercase tracking-wider mb-1">Anomalies Detected</div>
              <div className="rc-stat-value text-2xl font-bold text-white flex items-baseline gap-2">
                24
                <span className="text-xs font-normal text-[#ef4444] flex items-center"><TrendingUp className="h-3 w-3 mr-0.5" /> 3</span>
              </div>
            </div>
          </div>
          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5 flex items-center gap-4 transition-transform hover:-translate-y-1 duration-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#3b82f6]/5 rounded-full -mr-12 -mt-12 blur-xl"></div>
            <div className="p-3 bg-[#060d19] rounded-xl border border-[#12233e] relative z-10">
              <Users className="h-5 w-5 text-[#3b82f6]" />
            </div>
            <div className="relative z-10">
              <div className="rc-stat-label text-xs text-[#7a95b8] font-medium uppercase tracking-wider mb-1">Active Actors</div>
              <div className="rc-stat-value text-2xl font-bold text-white flex items-baseline gap-2">
                {!complianceData.data ? <Loader2 className="h-5 w-5 animate-spin text-[#7a95b8]" /> : chartData.actorActivity.length}
                <span className="text-xs font-normal text-[#7a95b8] flex items-center"><Minus className="h-3 w-3 mr-0.5" /> 0%</span>
              </div>
            </div>
          </div>
          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5 flex items-center gap-4 transition-transform hover:-translate-y-1 duration-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#a78bfa]/5 rounded-full -mr-12 -mt-12 blur-xl"></div>
            <div className="p-3 bg-[#060d19] rounded-xl border border-[#12233e] relative z-10">
              <ShieldCheck className="h-5 w-5 text-[#a78bfa]" />
            </div>
            <div className="relative z-10">
              <div className="rc-stat-label text-xs text-[#7a95b8] font-medium uppercase tracking-wider mb-1">Compliance Score</div>
              <div className="rc-stat-value text-2xl font-bold text-white flex items-baseline gap-2">
                94.2<span className="text-lg text-[#7a95b8]">/100</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-[#12233e]">
          <nav className="flex space-x-8 overflow-x-auto hide-scrollbar" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("logs")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === "logs"
                  ? "border-[#22c55e] text-[#22c55e]"
                  : "border-transparent text-[#7a95b8] hover:text-[#c8d8ec] hover:border-[#334155]"
              }`}
            >
              <Database className="h-4 w-4" />
              Audit Logs
            </button>
            <button
              onClick={() => setActiveTab("charts")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === "charts"
                  ? "border-[#22c55e] text-[#22c55e]"
                  : "border-transparent text-[#7a95b8] hover:text-[#c8d8ec] hover:border-[#334155]"
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              Visual Analytics
            </button>
            <button
              onClick={() => setActiveTab("reports")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === "reports"
                  ? "border-[#22c55e] text-[#22c55e]"
                  : "border-transparent text-[#7a95b8] hover:text-[#c8d8ec] hover:border-[#334155]"
              }`}
            >
              <FileText className="h-4 w-4" />
              Reports & Exports
            </button>
            <button
              onClick={() => setActiveTab("alerts")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === "alerts"
                  ? "border-[#22c55e] text-[#22c55e]"
                  : "border-transparent text-[#7a95b8] hover:text-[#c8d8ec] hover:border-[#334155]"
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
              Alerts
              <span className="bg-[#ef4444] text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">3</span>
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                activeTab === "settings"
                  ? "border-[#22c55e] text-[#22c55e]"
                  : "border-transparent text-[#7a95b8] hover:text-[#c8d8ec] hover:border-[#334155]"
              }`}
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
          </nav>
        </div>

        {/* Tab Content Area */}
        <div className="pt-2 animate-in fade-in duration-300">
          {activeTab === "logs" && renderLogsTab()}
          {activeTab === "charts" && renderChartsTab()}
          {activeTab === "reports" && renderReportsTab()}
          {activeTab === "alerts" && (
            <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-8 text-center">
              <AlertTriangle className="h-12 w-12 text-[#f59e0b] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Compliance Alerts</h3>
              <p className="text-[#7a95b8] max-w-md mx-auto mb-6">Manage automated alerts for suspicious activity, policy violations, and compliance thresholds.</p>
              <div className="space-y-4 max-w-3xl mx-auto text-left">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/5 flex items-start gap-4">
                    <div className="p-2 bg-[#ef4444]/20 rounded-lg text-[#ef4444] mt-1">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-semibold text-white">Multiple Failed Login Attempts</h4>
                        <span className="text-xs text-[#7a95b8]">10 mins ago</span>
                      </div>
                      <p className="text-sm text-[#c8d8ec] mt-1">User account admin@russell.cap experienced 5 failed login attempts from IP 192.168.1.45.</p>
                      <div className="mt-3 flex gap-2">
                        <button className="text-xs bg-[#ef4444] hover:bg-[#dc2626] text-white px-3 py-1.5 rounded transition-colors">Investigate</button>
                        <button className="text-xs bg-[#060d19] border border-[#12233e] hover:border-[#334155] text-white px-3 py-1.5 rounded transition-colors">Dismiss</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === "settings" && (
            <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <Settings className="h-6 w-6 text-[#7a95b8]" />
                <h2 className="text-xl font-semibold text-white">Audit Configuration</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-white mb-3 border-b border-[#12233e] pb-2">Data Retention Policy</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-[#7a95b8] block mb-1">Standard Logs Retention</label>
                        <select className="rc-input w-full bg-[#060d19] border border-[#12233e] text-white rounded-lg px-3 py-2">
                          <option>90 Days</option>
                          <option>1 Year</option>
                          <option>3 Years</option>
                          <option>7 Years (Regulatory)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-[#7a95b8] block mb-1">Security Logs Retention</label>
                        <select className="rc-input w-full bg-[#060d19] border border-[#12233e] text-white rounded-lg px-3 py-2">
                          <option>1 Year</option>
                          <option>3 Years</option>
                          <option>7 Years</option>
                          <option>Indefinite</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-white mb-3 border-b border-[#12233e] pb-2">Event Tracking Scope</h3>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between p-3 rounded-lg border border-[#12233e] bg-[#060d19]">
                        <div>
                          <div className="text-sm font-medium text-white">Authentication Events</div>
                          <div className="text-xs text-[#7a95b8]">Logins, logouts, password changes</div>
                        </div>
                        <div className="w-10 h-5 bg-[#22c55e] rounded-full relative cursor-pointer">
                          <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                        </div>
                      </label>
                      <label className="flex items-center justify-between p-3 rounded-lg border border-[#12233e] bg-[#060d19]">
                        <div>
                          <div className="text-sm font-medium text-white">Data Access (Read)</div>
                          <div className="text-xs text-[#7a95b8]">Record viewing, list exports</div>
                        </div>
                        <div className="w-10 h-5 bg-[#12233e] rounded-full relative cursor-pointer">
                          <div className="absolute left-1 top-1 w-3 h-3 bg-[#7a95b8] rounded-full"></div>
                        </div>
                      </label>
                      <label className="flex items-center justify-between p-3 rounded-lg border border-[#12233e] bg-[#060d19]">
                        <div>
                          <div className="text-sm font-medium text-white">Data Modification (Write)</div>
                          <div className="text-xs text-[#7a95b8]">Creates, updates, deletes</div>
                        </div>
                        <div className="w-10 h-5 bg-[#22c55e] rounded-full relative cursor-pointer">
                          <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-[#12233e] flex justify-end">
                <button className="rc-btn rc-btn-primary px-6 py-2 bg-[#22c55e] text-white rounded-lg hover:bg-[#1ea850] transition-colors">
                  Save Configuration
                </button>
              </div>
            </div>
          )}
        </div>
        
        <PageInsights pageId="compliance-export" />
      </div>
    </AppShell>
  );
}
