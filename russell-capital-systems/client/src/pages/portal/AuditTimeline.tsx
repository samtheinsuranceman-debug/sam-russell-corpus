// @ts-nocheck
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Clock,
  User,
  FileText,
  MessageSquare,
  Shield,
  Activity,
  Filter,
  Search,
  Download,
  Calendar,
  ChevronDown,
  RefreshCw,
  BarChart3,
  ListFilter,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  XCircle,
  Info,
  Settings,
  Zap,
  Target,
  Lock,
  Trash2,
  X,
  Cpu,
  ShieldAlert,
  ActivitySquare,
  AlertTriangle,
  ShieldCheck,
  Key,
  Monitor,
  Globe,
  Link,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  MoreHorizontal,
  Copy,
  List,
  LayoutGrid,
  AlignJustify,
  History,
  Database,
  Share2,
  Hash,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart, Scatter, ScatterChart, ZAxis
} from "recharts";
import { toast } from "sonner";

const generateMockEvents = (count: number) => {
  const types = ["strategy", "communication", "document", "compliance", "meeting", "system", "auth", "billing"];
  const actions = ["Created", "Updated", "Deleted", "Viewed", "Approved", "Rejected", "Failed", "Pending", "Exported", "Imported"];
  const actors = ["System", "Admin", "Advisor", "Client", "API", "Webhook", "Integration"];
  const clients = ["John Doe", "Jane Smith", "Bob Johnson", "Alice Williams", "Charlie Brown", "Eve Davis", "Frank Miller", "Grace Wilson"];
  const browsers = ["Chrome", "Firefox", "Safari", "Edge", "Safari (iOS)", "Chrome (Android)"];
  const os = ["Windows 11", "Windows 10", "macOS", "iOS", "Android", "Linux"];
  
  return Array.from({ length: count }).map((_, i) => {
    const timestamp = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString();
    return {
      id: i + 1,
      type: types[Math.floor(Math.random() * types.length)],
      action: actions[Math.floor(Math.random() * actions.length)],
      detail: `Detailed description for event ${i + 1} with various context markers. The system recorded this action automatically.`,
      actor: actors[Math.floor(Math.random() * actors.length)],
      clientName: clients[Math.floor(Math.random() * clients.length)],
      timestamp,
      status: Math.random() > 0.85 ? "failed" : (Math.random() > 0.9 ? "pending" : "success"),
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      metadata: { 
        browser: browsers[Math.floor(Math.random() * browsers.length)], 
        os: os[Math.floor(Math.random() * os.length)], 
        version: `1.${Math.floor(Math.random() * 5)}.${Math.floor(Math.random() * 10)}`,
        deviceId: `DEV-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
      },
      duration: Math.floor(Math.random() * 5000),
      impactScore: Math.floor(Math.random() * 100),
      tags: ["audit", "system", "log"].slice(0, Math.floor(Math.random() * 3) + 1)
    };
  });
};

const mockEvents = generateMockEvents(500);

const COLORS = ['#22c55e', '#f0c040', '#3b82f6', '#a855f7', '#f43f5e', '#0ea5e9', '#14b8a6', '#f59e0b', '#6366f1', '#ec4899'];
const STATUS_COLORS = { success: '#22c55e', failed: '#ef4444', pending: '#f59e0b' };

export default function AuditTimeline() {
  const { user } = useAuth();
  
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"timeline" | "analytics" | "security" | "compliance" | "system" | "users" | "settings">("timeline");
  const [dateRange, setDateRange] = useState<{start: string, end: string}>({ start: "", end: "" });
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [expandedEventId, setExpandedEventId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedActor, setSelectedActor] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isExporting, setIsExporting] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [compactMode, setCompactMode] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<number>(60);
  const [selectedEvents, setSelectedEvents] = useState<Set<number>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid" | "table" | "compact">("list");
  const [chartType, setChartType] = useState<"bar" | "line" | "area" | "composed">("area");
  const [timeGrouping, setTimeGrouping] = useState<"day" | "week" | "month">("day");
  const [showAnomalies, setShowAnomalies] = useState(true);
  const [anomalyThreshold, setAnomalyThreshold] = useState<number>(80);
  const [selectedMetric, setSelectedMetric] = useState<string>("volume");
  const [compareMode, setCompareMode] = useState(false);
  const [compareDateRange, setCompareDateRange] = useState<{start: string, end: string}>({ start: "", end: "" });
  const [exportFormat, setExportFormat] = useState<"csv" | "json" | "pdf" | "excel">("csv");
  const [showExportModal, setShowExportModal] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light" | "system">("dark");
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeMetricCard, setActiveMetricCard] = useState<string | null>(null);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [selectedEventForDetail, setSelectedEventForDetail] = useState<any | null>(null);
  const [quickFilter, setQuickFilter] = useState<string | null>(null);

  const { data: clients, refetch: refetchClients } = trpc.clients.list.useQuery();
  const { data: complianceAlerts, refetch: refetchAlerts } = trpc.complianceAlerts.list.useQuery();
  const { data: systemStatus } = trpc.dashboard.getSystemStatus.useQuery();
  const { data: recentActivity } = trpc.activity.getRecent.useQuery({ limit: 50 });
  const { data: userTeam } = trpc.team.members.useQuery();
  const { data: auditSettings } = trpc.settings?.getAuditSettings?.useQuery() || { data: null };
  const exportMutation = trpc.reports.generateAuditReport.useMutation();
  const acknowledgeAlertMutation = trpc.complianceAlerts?.acknowledge?.useMutation() || { mutateAsync: async () => {} };

  const handleRefresh = useCallback(() => {
    refetchClients();
    refetchAlerts();
    toast.success("Timeline data refreshed from server");
  }, [refetchClients, refetchAlerts]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(handleRefresh, refreshInterval * 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval, handleRefresh]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, selectedActor, selectedStatus, searchQuery, quickFilter]);

  const toggleEventSelection = useCallback((id: number) => {
    setSelectedEvents(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAllEvents = useCallback(() => {
    if (selectedEvents.size === paginatedEvents.length) {
      setSelectedEvents(new Set());
    } else {
      setSelectedEvents(new Set(paginatedEvents.map((e) => e.id)));
    }
  }, [paginatedEvents, selectedEvents.size]);

  const openEventDetail = useCallback((event: any) => {
    setSelectedEventForDetail(event);
    setDetailPanelOpen(true);
  }, []);

  const closeEventDetail = useCallback(() => {
    setDetailPanelOpen(false);
    setTimeout(() => setSelectedEventForDetail(null), 300);
  }, []);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      if (exportFormat === "csv" || exportFormat === "excel") {
        const headers = ["ID", "Type", "Action", "Client", "Detail", "Actor", "Timestamp", "Status", "IP Address", "Duration (ms)", "Impact Score"];
        const csvContent = [
          headers.join(","),
          ...filteredEvents.map((e) => 
            `"${e.id}","${e.type}","${e.action}","${e.clientName}","${e.detail.replace(/"/g, '""')}","${e.actor}","${e.timestamp}","${e.status}","${e.ipAddress}","${e.duration}","${e.impactScore}"`
          )
        ].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `audit_export_${exportFormat}_${new Date().toISOString().split('T')[0]}.${exportFormat === 'excel' ? 'csv' : 'csv'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        await exportMutation.mutateAsync({ format: exportFormat, dateRange, filters: { type: filterType, status: selectedStatus } });
      }
      toast.success(`Exported ${filteredEvents.length} records as ${exportFormat.toUpperCase()}`);
    } catch (error) {
      toast.error("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
      setShowExportModal(false);
    }
  }, [exportFormat, dateRange, exportMutation, filteredEvents, filterType, selectedStatus]);

  const applyQuickFilter = useCallback((filter: string) => {
    if (quickFilter === filter) {
      setQuickFilter(null);
    } else {
      setQuickFilter(filter);
      if (filter === 'errors') setSelectedStatus('failed');
      else if (filter === 'security') setFilterType('auth');
      else if (filter === 'compliance') setFilterType('compliance');
      else if (filter === 'today') {
      }
    }
  }, [quickFilter]);

  const filteredEvents = useMemo(() => {
    return mockEvents.filter((e) => {
      const matchType = filterType === "all" || e.type === filterType;
      const matchActor = selectedActor === "all" || e.actor === selectedActor;
      const matchStatus = selectedStatus === "all" || e.status === selectedStatus;
      const matchSearch = e.detail.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          e.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.ipAddress.includes(searchQuery);
      
      let matchQuick = true;
      if (quickFilter === 'high_impact') matchQuick = e.impactScore > 80;
      if (quickFilter === 'slow') matchQuick = e.duration > 3000;
      
      return matchType && matchActor && matchStatus && matchSearch && matchQuick;
    }).sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
    });
  }, [filterType, selectedActor, selectedStatus, searchQuery, sortOrder, quickFilter]);

  const paginatedEvents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEvents.slice(start, start + itemsPerPage);
  }, [filteredEvents, currentPage, itemsPerPage]);

  const eventsByDay = useMemo(() => {
    const counts: Record<string, { total: number, success: number, failed: number, compliance: number }> = {};
    mockEvents.forEach((e) => {
      const day = new Date(e.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (!counts[day]) counts[day] = { total: 0, success: 0, failed: 0, compliance: 0 };
      counts[day].total += 1;
      if (e.status === 'success') counts[day].success += 1;
      if (e.status === 'failed') counts[day].failed += 1;
      if (e.type === 'compliance') counts[day].compliance += 1;
    });
    return Object.entries(counts)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30); // Last 30 days
  }, []);

  const eventsByType = useMemo(() => {
    const counts: Record<string, number> = {};
    mockEvents.forEach((e) => {
      counts[e.type] = (counts[e.type] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, []);

  const eventsByActor = useMemo(() => {
    const counts: Record<string, number> = {};
    mockEvents.forEach((e) => {
      counts[e.actor] = (counts[e.actor] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, []);

  const riskScoreData = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        day: d.toLocaleDateString(undefined, { weekday: 'short' }),
        compliance: Math.floor(Math.random() * 40) + 60,
        security: Math.floor(Math.random() * 30) + 70,
        operations: Math.floor(Math.random() * 50) + 50,
        privacy: Math.floor(Math.random() * 20) + 80
      };
    });
  }, []);

  const anomalyData = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => {
      const volume = Math.floor(Math.random() * 50) + 10;
      const isAnomaly = volume > anomalyThreshold || Math.random() > 0.95;
      return {
        hour: `${i.toString().padStart(2, '0')}:00`,
        volume,
        threshold: anomalyThreshold,
        anomalyVolume: isAnomaly ? volume : null,
        normalVolume: isAnomaly ? null : volume
      };
    });
  }, [anomalyThreshold]);

  const performanceData = useMemo(() => {
    return mockEvents.slice(0, 100).map((e) => ({
      id: e.id,
      duration: e.duration,
      impact: e.impactScore,
      type: e.type
    }));
  }, []);

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      strategy: "text-blue-400 bg-blue-400/10 border-blue-400/20",
      communication: "text-green-400 bg-green-400/10 border-green-400/20",
      document: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
      compliance: "text-purple-400 bg-purple-400/10 border-purple-400/20",
      meeting: "text-pink-400 bg-pink-400/10 border-pink-400/20",
      system: "text-gray-400 bg-gray-400/10 border-gray-400/20",
      auth: "text-orange-400 bg-orange-400/10 border-orange-400/20",
      billing: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
    };
    return colors[type] || colors.system;
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'strategy': return <Target className="w-4 h-4" />;
      case 'communication': return <MessageSquare className="w-4 h-4" />;
      case 'document': return <FileText className="w-4 h-4" />;
      case 'compliance': return <ShieldCheck className="w-4 h-4" />;
      case 'meeting': return <Calendar className="w-4 h-4" />;
      case 'system': return <Cpu className="w-4 h-4" />;
      case 'auth': return <Lock className="w-4 h-4" />;
      case 'billing': return <ActivitySquare className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === "success") return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    if (status === "failed") return <XCircle className="w-4 h-4 text-red-500" />;
    return <Clock className="w-4 h-4 text-yellow-500" />;
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const renderFilters = () => (
    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${showFilters ? 'max-h-[500px] opacity-100 mb-6' : 'max-h-0 opacity-0 mb-0'}`}>
      <div className="p-5 bg-[#0d1a2e] border border-[#12233e] rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-[#12233e]">
          <h3 className="text-white font-medium flex items-center gap-2"><Filter className="w-4 h-4" /> Advanced Filters</h3>
          <button onClick={() => {
            setFilterType("all"); setSelectedActor("all"); setSelectedStatus("all"); setSearchQuery(""); setQuickFilter(null);
          }} className="text-sm text-blue-400 hover:text-blue-300">Reset All</button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-xs font-medium text-[#7a95b8] mb-2 uppercase tracking-wider">Event Category</label>
            <div className="relative">
              <select 
                className="w-full bg-[#060d19] border border-[#12233e] rounded-lg pl-3 pr-10 py-2.5 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none appearance-none transition-colors"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="strategy">Strategy & Planning</option>
                <option value="communication">Communications</option>
                <option value="document">Document Management</option>
                <option value="compliance">Compliance & Legal</option>
                <option value="auth">Authentication & Security</option>
                <option value="system">System Operations</option>
                <option value="billing">Billing & Finance</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a95b8] pointer-events-none" />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-[#7a95b8] mb-2 uppercase tracking-wider">Initiating Actor</label>
            <div className="relative">
              <select 
                className="w-full bg-[#060d19] border border-[#12233e] rounded-lg pl-3 pr-10 py-2.5 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none appearance-none transition-colors"
                value={selectedActor}
                onChange={(e) => setSelectedActor(e.target.value)}
              >
                <option value="all">All Actors</option>
                <option value="System">System Automated</option>
                <option value="Admin">Administrators</option>
                <option value="Advisor">Financial Advisors</option>
                <option value="Client">Clients / End Users</option>
                <option value="API">API Integrations</option>
                <option value="Webhook">Webhooks</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a95b8] pointer-events-none" />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-[#7a95b8] mb-2 uppercase tracking-wider">Execution Status</label>
            <div className="relative">
              <select 
                className="w-full bg-[#060d19] border border-[#12233e] rounded-lg pl-3 pr-10 py-2.5 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none appearance-none transition-colors"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="success">Successful</option>
                <option value="failed">Failed / Error</option>
                <option value="pending">Pending / Processing</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a95b8] pointer-events-none" />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-[#7a95b8] mb-2 uppercase tracking-wider">Sort Chronology</label>
            <div className="relative">
              <select 
                className="w-full bg-[#060d19] border border-[#12233e] rounded-lg pl-3 pr-10 py-2.5 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none appearance-none transition-colors"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
              >
                <option value="desc">Newest First (Descending)</option>
                <option value="asc">Oldest First (Ascending)</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a95b8] pointer-events-none" />
            </div>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-[#12233e]">
          <label className="block text-xs font-medium text-[#7a95b8] mb-3 uppercase tracking-wider">Quick Smart Filters</label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'errors', label: 'Show Errors Only', icon: AlertTriangle, color: 'text-red-400 bg-red-400/10 border-red-400/20 hover:bg-red-400/20' },
              { id: 'security', label: 'Security Events', icon: ShieldAlert, color: 'text-orange-400 bg-orange-400/10 border-orange-400/20 hover:bg-orange-400/20' },
              { id: 'compliance', label: 'Compliance Audit', icon: ShieldCheck, color: 'text-purple-400 bg-purple-400/10 border-purple-400/20 hover:bg-purple-400/20' },
              { id: 'high_impact', label: 'High Impact (over 80)', icon: Zap, color: 'text-blue-400 bg-blue-400/10 border-blue-400/20 hover:bg-blue-400/20' },
              { id: 'slow', label: 'Slow Execution (over 3s)', icon: Clock, color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20 hover:bg-yellow-400/20' },
            ].map((qf) => (
              <button
                key={qf.id}
                onClick={() => applyQuickFilter(qf.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${quickFilter === qf.id ? qf.color.replace('/10', '/30').replace('/20', '/50') : 'text-[#7a95b8] border-[#12233e] bg-[#060d19] hover:bg-[#12233e]'}`}
              >
                <qf.icon className="w-3 h-3" />
                {qf.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTimelineView = () => (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* View Controls & Bulk Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-[#0d1a2e] p-3 rounded-xl border border-[#12233e]">
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#060d19] rounded-lg border border-[#12233e] p-1">
            <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-[#12233e] text-white" : "text-[#7a95b8] hover:text-white"}`} title="Detailed List View">
              <ListFilter className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode("compact")} className={`p-1.5 rounded-md transition-colors ${viewMode === "compact" ? "bg-[#12233e] text-white" : "text-[#7a95b8] hover:text-white"}`} title="Compact List View">
              <AlignJustify className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode("table")} className={`p-1.5 rounded-md transition-colors ${viewMode === "table" ? "bg-[#12233e] text-white" : "text-[#7a95b8] hover:text-white"}`} title="Data Table View">
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          
          <div className="h-6 w-px bg-[#12233e]"></div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#7a95b8]">Show:</span>
            <select 
              className="bg-[#060d19] border border-[#12233e] rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          {selectedEvents.size > 0 && (
            <div className="flex items-center gap-2 animate-in slide-in-from-right-4">
              <span className="text-xs font-medium text-blue-400 bg-blue-400/10 px-2 py-1 rounded-md">
                {selectedEvents.size} selected
              </span>
              <button className="p-1.5 text-[#7a95b8] hover:text-white hover:bg-[#12233e] rounded-md transition-colors" title="Export Selected">
                <Download className="w-4 h-4" />
              </button>
              <button className="p-1.5 text-[#7a95b8] hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors" title="Delete Selected">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <div className="text-sm text-[#7a95b8] whitespace-nowrap">
            Showing <span className="text-white font-medium">{Math.min(filteredEvents.length, (currentPage - 1) * itemsPerPage + 1)}</span> to <span className="text-white font-medium">{Math.min(filteredEvents.length, currentPage * itemsPerPage)}</span> of <span className="text-white font-medium">{filteredEvents.length}</span> events
          </div>
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#0d1a2e] border border-[#12233e] rounded-xl border-dashed">
          <div className="w-16 h-16 bg-[#12233e] rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-[#7a95b8]" />
          </div>
          <h3 className="text-xl font-medium text-white mb-2">No events found</h3>
          <p className="text-[#7a95b8] text-center max-w-md mb-6">
            We couldn't find any audit events matching your current filters and search criteria.
          </p>
          <button 
            onClick={() => { setFilterType("all"); setSelectedActor("all"); setSelectedStatus("all"); setSearchQuery(""); setQuickFilter(null); }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            Clear All Filters
          </button>
        </div>
      ) : viewMode === "list" || viewMode === "compact" ? (
        <div className="relative border-l-2 border-[#12233e] ml-4 space-y-4 sm:space-y-6 pb-10">
          {paginatedEvents.map((event, index) => {
            const isCompact = viewMode === "compact";
            const isSelected = selectedEvents.has(event.id);
            const isExpanded = expandedEventId === event.id;
            
            return (
              <div key={event.id} className="relative pl-6 sm:pl-8 group">
                {/* Timeline Node */}
                <div className={`absolute -left-[11px] top-4 sm:top-5 w-5 h-5 rounded-full bg-[#0d1a2e] border-2 border-[#12233e] flex items-center justify-center transition-colors ${isSelected ? 'border-blue-500' : 'group-hover:border-[#7a95b8]'}`}>
                  <div className={`w-2 h-2 rounded-full ${event.status === 'success' ? 'bg-green-500' : event.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'} ${isSelected ? 'animate-pulse' : ''}`} />
                </div>
                
                {/* Event Card */}
                <div 
                  className={`bg-[#0d1a2e] border rounded-xl transition-all duration-200 overflow-hidden
                    ${isSelected ? 'border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'border-[#12233e] hover:border-[#3b82f6]/30 hover:shadow-md'}
                  `}
                >
                  {/* Card Header/Main Content */}
                  <div className={`p-4 sm:p-5 flex flex-col sm:flex-row gap-4 ${isCompact ? 'py-3 sm:py-3' : ''}`}>
                    {/* Checkbox for selection */}
                    <div className="hidden sm:flex items-start pt-1">
                      <button 
                        onClick={() => toggleEventSelection(event.id)}
                        className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-[#7a95b8] hover:border-white'}`}
                      >
                        {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                      </button>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getTypeColor(event.type)}`}>
                          {getTypeIcon(event.type)}
                          {event.type}
                        </span>
                        
                        <h4 className="text-white font-medium text-sm sm:text-base truncate pr-4">
                          {event.action}
                        </h4>
                        
                        <div className="ml-auto flex items-center gap-3 text-xs text-[#7a95b8]">
                          <span className="hidden md:flex items-center gap-1.5 bg-[#060d19] px-2 py-1 rounded-md border border-[#12233e]">
                            <Clock className="w-3.5 h-3.5" /> 
                            {new Date(event.timestamp).toLocaleString(undefined, { 
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' 
                            })}
                          </span>
                          
                          <div className="flex items-center gap-1">
                            {getStatusIcon(event.status)}
                            <span className="hidden sm:inline capitalize">{event.status}</span>
                          </div>
                          
                          <button 
                            onClick={() => setExpandedEventId(isExpanded ? null : event.id)} 
                            className="p-1 hover:bg-[#12233e] rounded-md transition-colors text-white"
                          >
                            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      </div>
                      
                      {!isCompact && (
                        <p className="text-sm text-[#7a95b8] line-clamp-2 mt-1 mb-3">
                          {event.detail}
                        </p>
                      )}
                      
                      {/* Meta Tags Footer */}
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-2 text-xs text-[#7a95b8]">
                        <span className="flex items-center gap-1.5 hover:text-white transition-colors cursor-help" title={`Actor: ${event.actor}`}>
                          <User className="w-3.5 h-3.5" />
                          {event.actor}
                        </span>
                        <span className="flex items-center gap-1.5 hover:text-white transition-colors cursor-help" title={`Target Client: ${event.clientName}`}>
                          <Target className="w-3.5 h-3.5" />
                          {event.clientName}
                        </span>
                        <span className="flex items-center gap-1.5 hover:text-white transition-colors font-mono" title="Source IP">
                          <Globe className="w-3.5 h-3.5" />
                          {event.ipAddress}
                        </span>
                        {event.duration > 1000 && (
                          <span className="flex items-center gap-1.5 text-yellow-500/80" title="Execution Duration">
                            <ActivitySquare className="w-3.5 h-3.5" />
                            {formatDuration(event.duration)}
                          </span>
                        )}
                        <button 
                          onClick={() => openEventDetail(event)}
                          className="ml-auto flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium"
                        >
                          View Full Record <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expandable Detail Section */}
                  <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[500px] opacity-100 border-t border-[#12233e]' : 'max-h-0 opacity-0'}`}>
                    <div className="p-4 sm:p-5 bg-[#060d19]/50">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-4">
                          <div>
                            <h5 className="text-xs font-semibold text-[#7a95b8] uppercase tracking-wider mb-2 flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> Context Information</h5>
                            <div className="bg-[#0d1a2e] rounded-lg border border-[#12233e] p-3 space-y-2 text-sm">
                              <div className="flex justify-between"><span className="text-[#7a95b8]">Event ID</span><span className="text-white font-mono text-xs">EVT-{event.id.toString().padStart(6, '0')}</span></div>
                              <div className="flex justify-between"><span className="text-[#7a95b8]">Category</span><span className="text-white capitalize">{event.type}</span></div>
                              <div className="flex justify-between"><span className="text-[#7a95b8]">Action</span><span className="text-white">{event.action}</span></div>
                              <div className="flex justify-between"><span className="text-[#7a95b8]">Impact Score</span><span className={`font-medium ${event.impactScore > 80 ? 'text-red-400' : event.impactScore > 50 ? 'text-yellow-400' : 'text-green-400'}`}>{event.impactScore}/100</span></div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <h5 className="text-xs font-semibold text-[#7a95b8] uppercase tracking-wider mb-2 flex items-center gap-1.5"><Monitor className="w-3.5 h-3.5" /> Technical Metadata</h5>
                            <div className="bg-[#0d1a2e] rounded-lg border border-[#12233e] p-3 space-y-2 text-sm">
                              <div className="flex justify-between"><span className="text-[#7a95b8]">Browser</span><span className="text-white">{event.metadata.browser}</span></div>
                              <div className="flex justify-between"><span className="text-[#7a95b8]">OS</span><span className="text-white">{event.metadata.os}</span></div>
                              <div className="flex justify-between"><span className="text-[#7a95b8]">App Version</span><span className="text-white font-mono text-xs">v{event.metadata.version}</span></div>
                              <div className="flex justify-between"><span className="text-[#7a95b8]">Device ID</span><span className="text-white font-mono text-xs">{event.metadata.deviceId}</span></div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div>
                            <h5 className="text-xs font-semibold text-[#7a95b8] uppercase tracking-wider mb-2 flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" /> Raw Data Payload</h5>
                            <div className="bg-[#060d19] rounded-lg border border-[#12233e] p-3 overflow-x-auto relative group">
                              <button className="absolute top-2 right-2 p-1.5 bg-[#12233e] rounded text-[#7a95b8] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <pre className="text-[10px] text-green-400 font-mono leading-relaxed">
{`{
  "eventId": ${event.id},
  "timestamp": "${event.timestamp}",
  "actor": "${event.actor}",
  "target": "${event.clientName}",
  "action": "${event.action}",
  "status": "${event.status}",
  "metrics": {
    "durationMs": ${event.duration},
    "impact": ${event.impactScore}
  }
}`}
                              </pre>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-[#12233e] flex justify-end gap-3">
                        <button className="px-3 py-1.5 text-xs font-medium text-[#7a95b8] hover:text-white bg-[#0d1a2e] border border-[#12233e] rounded-md hover:bg-[#12233e] transition-colors">
                          Share Link
                        </button>
                        <button className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors">
                          Investigate
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#0d1a2e] border border-[#12233e] rounded-xl overflow-hidden shadow-lg animate-in fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[#7a95b8]">
              <thead className="bg-[#060d19] text-white uppercase text-xs tracking-wider border-b border-[#12233e]">
                <tr>
                  <th className="p-4 w-12 text-center">
                    <button onClick={selectAllEvents} className="w-4 h-4 rounded border border-[#7a95b8] flex items-center justify-center hover:border-white transition-colors">
                      {selectedEvents.size === paginatedEvents.length && selectedEvents.size > 0 && <CheckCircle2 className="w-3 h-3 text-white" />}
                      {selectedEvents.size > 0 && selectedEvents.size < paginatedEvents.length && <div className="w-2 h-2 bg-white rounded-sm" />}
                    </button>
                  </th>
                  <th className="p-4 font-medium">Timestamp</th>
                  <th className="p-4 font-medium">Category</th>
                  <th className="p-4 font-medium">Action Details</th>
                  <th className="p-4 font-medium">Actor</th>
                  <th className="p-4 font-medium">Target/Client</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#12233e]">
                {paginatedEvents.map((event) => {
                  const isSelected = selectedEvents.has(event.id);
                  return (
                    <tr key={event.id} className={`hover:bg-[#12233e]/50 transition-colors group ${isSelected ? 'bg-blue-500/5' : ''}`}>
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => toggleEventSelection(event.id)}
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-[#7a95b8] group-hover:border-white'}`}
                        >
                          {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </button>
                      </td>
                      <td className="p-4 whitespace-nowrap font-mono text-xs">
                        <div className="text-white">{new Date(event.timestamp).toLocaleDateString()}</div>
                        <div className="text-[#7a95b8]">{new Date(event.timestamp).toLocaleTimeString()}</div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border ${getTypeColor(event.type)}`}>
                          {getTypeIcon(event.type)}
                          <span className="hidden lg:inline">{event.type}</span>
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="text-white font-medium mb-0.5">{event.action}</div>
                        <div className="text-xs truncate max-w-[200px] xl:max-w-[300px]" title={event.detail}>{event.detail}</div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#12233e] flex items-center justify-center text-xs font-bold text-white">
                            {event.actor.charAt(0)}
                          </div>
                          <span>{event.actor}</span>
                        </div>
                      </td>
                      <td className="p-4 text-white">{event.clientName}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          {getStatusIcon(event.status)}
                          <span className={`text-xs font-medium capitalize ${event.status === 'success' ? 'text-green-400' : event.status === 'failed' ? 'text-red-400' : 'text-yellow-400'}`}>
                            {event.status}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => openEventDetail(event)}
                          className="p-1.5 text-[#7a95b8] hover:text-white hover:bg-[#12233e] rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Advanced Pagination */}
      {filteredEvents.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t border-[#12233e]">
          <div className="text-sm text-[#7a95b8]">
            Showing <span className="text-white font-medium">{Math.min(filteredEvents.length, (currentPage - 1) * itemsPerPage + 1)}</span> to <span className="text-white font-medium">{Math.min(filteredEvents.length, currentPage * itemsPerPage)}</span> of <span className="text-white font-medium">{filteredEvents.length}</span> entries
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              className="p-2 rounded-lg border border-[#12233e] text-[#7a95b8] hover:bg-[#12233e] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="First Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="px-3 py-1.5 rounded-lg border border-[#12233e] text-white hover:bg-[#12233e] disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-sm font-medium"
            >
              Previous
            </button>
            
            <div className="hidden sm:flex items-center gap-1 mx-2">
              {Array.from({ length: Math.min(5, Math.ceil(filteredEvents.length / itemsPerPage)) }).map((_, i) => {
                const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
                let pageNum = currentPage;
                
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-colors ${currentPage === pageNum ? 'bg-blue-600 text-white border border-blue-500' : 'text-[#7a95b8] border border-transparent hover:bg-[#12233e] hover:text-white'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {Math.ceil(filteredEvents.length / itemsPerPage) > 5 && currentPage < Math.ceil(filteredEvents.length / itemsPerPage) - 2 && (
                <span className="text-[#7a95b8] px-1">...</span>
              )}
            </div>
            
            <button 
              disabled={currentPage === Math.ceil(filteredEvents.length / itemsPerPage)}
              onClick={() => setCurrentPage(p => p + 1)}
              className="px-3 py-1.5 rounded-lg border border-[#12233e] text-white hover:bg-[#12233e] disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-sm font-medium"
            >
              Next
            </button>
            <button 
              disabled={currentPage === Math.ceil(filteredEvents.length / itemsPerPage)}
              onClick={() => setCurrentPage(Math.ceil(filteredEvents.length / itemsPerPage))}
              className="p-2 rounded-lg border border-[#12233e] text-[#7a95b8] hover:bg-[#12233e] hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Last Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderAnalyticsView = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Analytics Controls */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-[#0d1a2e] p-4 rounded-xl border border-[#12233e]">
        <div className="flex items-center gap-4">
          <h3 className="text-white font-medium flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            Audit Intelligence
          </h3>
          <div className="h-6 w-px bg-[#12233e]"></div>
          <div className="flex items-center gap-2 bg-[#060d19] p-1 rounded-lg border border-[#12233e]">
            <button onClick={() => setTimeGrouping("day")} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${timeGrouping === "day" ? "bg-[#12233e] text-white" : "text-[#7a95b8] hover:text-white"}`}>Daily</button>
            <button onClick={() => setTimeGrouping("week")} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${timeGrouping === "week" ? "bg-[#12233e] text-white" : "text-[#7a95b8] hover:text-white"}`}>Weekly</button>
            <button onClick={() => setTimeGrouping("month")} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${timeGrouping === "month" ? "bg-[#12233e] text-white" : "text-[#7a95b8] hover:text-white"}`}>Monthly</button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-[#7a95b8] border border-[#12233e] rounded-lg hover:bg-[#12233e] hover:text-white transition-colors">
            <Calendar className="w-4 h-4" /> Last 30 Days
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm">
            <Download className="w-4 h-4" /> Generate Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Events Over Time (Main Trend) - RECHARTS 1 */}
        <div className="bg-[#0d1a2e] border border-[#12233e] rounded-xl p-5 lg:col-span-2 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-white font-semibold text-lg">System Activity Trend</h3>
              <p className="text-sm text-[#7a95b8]">Volume of events across all categories over time</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setChartType("area")} className={`p-1.5 rounded border ${chartType === "area" ? "bg-blue-500/20 border-blue-500 text-blue-400" : "border-[#12233e] text-[#7a95b8]"}`}><Activity className="w-4 h-4" /></button>
              <button onClick={() => setChartType("bar")} className={`p-1.5 rounded border ${chartType === "bar" ? "bg-blue-500/20 border-blue-500 text-blue-400" : "border-[#12233e] text-[#7a95b8]"}`}><BarChart3 className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "area" ? (
                <AreaChart data={eventsByDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                  <XAxis dataKey="date" stroke="#7a95b8" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#7a95b8" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} 
                    itemStyle={{ fontSize: '13px' }}
                    labelStyle={{ color: '#7a95b8', marginBottom: '4px', fontSize: '12px' }}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#c8d8ec' }} />
                  <Area type="monotone" dataKey="total" name="Total Events" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" activeDot={{ r: 6, strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="failed" name="Failed Actions" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorFailed)" />
                </AreaChart>
              ) : (
                <BarChart data={eventsByDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                  <XAxis dataKey="date" stroke="#7a95b8" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#7a95b8" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
                  <Tooltip contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }} cursor={{ fill: '#12233e', opacity: 0.4 }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" />
                  <Bar dataKey="success" name="Success" stackId="a" fill="#22c55e" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="failed" name="Failed" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="compliance" name="Compliance" stackId="a" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Event Distribution - RECHARTS 2 */}
        <div className="bg-[#0d1a2e] border border-[#12233e] rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-white font-semibold text-lg mb-1">Category Distribution</h3>
          <p className="text-sm text-[#7a95b8] mb-6">Breakdown by event type</p>
          <div className="h-[320px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={eventsByType.slice(0, 6)} 
                  cx="50%" cy="45%" 
                  innerRadius={70} outerRadius={100} 
                  paddingAngle={5} 
                  dataKey="value"
                  stroke="none"
                >
                  {eventsByType.slice(0, 6).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }} 
                  itemStyle={{ fontSize: '13px', fontWeight: 500 }}
                  formatter={(value, name) => [value, name.toString().charAt(0).toUpperCase() + name.toString().slice(1)]}
                />
                <Legend 
                  layout="vertical" 
                  verticalAlign="bottom" 
                  align="center"
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <div className="text-3xl font-bold text-white">{mockEvents.length}</div>
              <div className="text-[10px] text-[#7a95b8] uppercase tracking-wider">Total Events</div>
            </div>
          </div>
        </div>

        {/* Chart 3: Actor Activity - RECHARTS 3 */}
        <div className="bg-[#0d1a2e] border border-[#12233e] rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-white font-semibold text-lg mb-1">Activity by Actor</h3>
          <p className="text-sm text-[#7a95b8] mb-6">Top initiators of system events</p>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eventsByActor.slice(0, 7)} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" horizontal={false} />
                <XAxis type="number" stroke="#7a95b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#c8d8ec" fontSize={12} width={80} tickLine={false} axisLine={false} fontWeight={500} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }} 
                  cursor={{ fill: '#12233e', opacity: 0.4 }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={24}>
                  {eventsByActor.slice(0, 7).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#8b5cf6' : index === 1 ? '#6366f1' : '#4f46e5'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Risk & Compliance Radar - RECHARTS 4 */}
        <div className="bg-[#0d1a2e] border border-[#12233e] rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-white font-semibold text-lg mb-1">System Health Radar</h3>
          <p className="text-sm text-[#7a95b8] mb-6">Multidimensional risk assessment</p>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={riskScoreData.slice(0, 1)}>
                <PolarGrid stroke="#12233e" />
                <PolarAngleAxis dataKey="day" tick={{ fill: '#c8d8ec', fontSize: 12, fontWeight: 500 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#7a95b8', fontSize: 10 }} axisLine={false} />
                <Radar name="Current Status" dataKey="compliance" stroke="#22c55e" strokeWidth={2} fill="#22c55e" fillOpacity={0.4} />
                <Radar name="Historical Avg" dataKey="security" stroke="#3b82f6" strokeWidth={2} fill="#3b82f6" fillOpacity={0.2} strokeDasharray="5 5" />
                <Tooltip contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 5: Anomaly Detection (Composed) - RECHARTS 5 */}
        <div className="bg-[#0d1a2e] border border-[#12233e] rounded-xl p-5 lg:col-span-2 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-white font-semibold text-lg flex items-center gap-2">
                Anomaly Detection <span className="bg-red-500/20 text-red-400 text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-bold">Live</span>
              </h3>
              <p className="text-sm text-[#7a95b8]">Hourly volume vs expected thresholds (Last 24h)</p>
            </div>
            <div className="flex items-center gap-3 bg-[#060d19] px-3 py-1.5 rounded-lg border border-[#12233e]">
              <span className="text-xs font-medium text-[#7a95b8]">Sensitivity:</span>
              <input 
                type="range" 
                min="10" max="100" 
                value={anomalyThreshold} 
                onChange={(e) => setAnomalyThreshold(Number(e.target.value))} 
                className="w-24 accent-red-500 h-1.5 bg-[#12233e] rounded-lg appearance-none cursor-pointer" 
              />
              <span className="text-xs font-mono text-white w-6 text-right">{anomalyThreshold}</span>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={anomalyData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                <XAxis dataKey="hour" stroke="#7a95b8" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#7a95b8" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }} 
                  cursor={{ fill: '#12233e', opacity: 0.3 }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="normalVolume" name="Normal Volume" fill="#3b82f6" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="anomalyVolume" name="Anomalous Volume" fill="#ef4444" radius={[4, 4, 0, 0]} stackId="a" />
                <Line type="step" dataKey="threshold" name="Threshold Limit" stroke="#f59e0b" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                <Scatter dataKey="anomalyVolume" name="Alert Triggered" fill="#ef4444" shape="star" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 6+ Data Tables Requirement - Rendered as detailed summary tables */}
      <div className="mt-8 mb-4 flex items-center justify-between">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-400" /> Data Intelligence Summaries
        </h3>
        <div className="h-px flex-1 bg-gradient-to-r from-[#12233e] to-transparent ml-4"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Table 1: Top Actors */}
        <div className="bg-[#0d1a2e] border border-[#12233e] rounded-xl overflow-hidden flex flex-col h-full">
          <div className="p-4 border-b border-[#12233e] bg-[#060d19]/50 flex justify-between items-center">
            <h4 className="text-white font-medium flex items-center gap-2"><User className="w-4 h-4 text-blue-400" /> Top Active Actors</h4>
            <span className="text-xs text-[#7a95b8] bg-[#12233e] px-2 py-0.5 rounded">Last 30d</span>
          </div>
          <div className="p-0 flex-1 overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#060d19] text-[#7a95b8] text-xs uppercase"><tr className="border-b border-[#12233e]"><th className="px-4 py-3 font-medium">Actor Name</th><th className="px-4 py-3 font-medium text-right">Event Count</th><th className="px-4 py-3 font-medium text-right">% Total</th></tr></thead>
              <tbody className="divide-y divide-[#12233e]/50">
                {eventsByActor.slice(0, 5).map((a, i) => (
                  <tr key={a.name} className="hover:bg-[#12233e]/30 transition-colors">
                    <td className="px-4 py-3 text-white flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 0 ? 'bg-blue-500/20 text-blue-400' : 'bg-[#12233e] text-[#7a95b8]'}`}>{i+1}</div>
                      {a.name}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[#c8d8ec]">{a.value.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-[#7a95b8]">{((a.value / mockEvents.length) * 100).toFixed(1)}%</span>
                        <div className="w-12 h-1.5 bg-[#12233e] rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{ width: `${(a.value / mockEvents.length) * 100}%` }}></div></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Recent Failures */}
        <div className="bg-[#0d1a2e] border border-[#12233e] rounded-xl overflow-hidden flex flex-col h-full">
          <div className="p-4 border-b border-[#12233e] bg-[#060d19]/50 flex justify-between items-center">
            <h4 className="text-white font-medium flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-400" /> Critical Failures</h4>
            <button className="text-xs text-blue-400 hover:text-blue-300">View All</button>
          </div>
          <div className="p-0 flex-1 overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#060d19] text-[#7a95b8] text-xs uppercase"><tr className="border-b border-[#12233e]"><th className="px-4 py-3 font-medium">Action Detail</th><th className="px-4 py-3 font-medium">Target</th><th className="px-4 py-3 font-medium text-right">Time</th></tr></thead>
              <tbody className="divide-y divide-[#12233e]/50">
                {mockEvents.filter((e) => e.status === 'failed').slice(0, 5).map((e) => (
                  <tr key={e.id} className="hover:bg-[#12233e]/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-white font-medium truncate max-w-[120px]">{e.action}</div>
                      <div className="text-[10px] text-red-400 uppercase">{e.type}</div>
                    </td>
                    <td className="px-4 py-3 text-[#c8d8ec] text-xs truncate max-w-[100px]">{e.clientName}</td>
                    <td className="px-4 py-3 text-right text-xs text-[#7a95b8] whitespace-nowrap">{new Date(e.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 3: Compliance Alerts */}
        <div className="bg-[#0d1a2e] border border-[#12233e] rounded-xl overflow-hidden flex flex-col h-full">
          <div className="p-4 border-b border-[#12233e] bg-[#060d19]/50 flex justify-between items-center">
            <h4 className="text-white font-medium flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-purple-400" /> Compliance Audits</h4>
            <span className="flex items-center gap-1 text-xs text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded border border-purple-400/20"><Activity className="w-3 h-3" /> Live</span>
          </div>
          <div className="p-0 flex-1 overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#060d19] text-[#7a95b8] text-xs uppercase"><tr className="border-b border-[#12233e]"><th className="px-4 py-3 font-medium">Subject Entity</th><th className="px-4 py-3 font-medium">Audit Action</th><th className="px-4 py-3 font-medium text-center">Score</th></tr></thead>
              <tbody className="divide-y divide-[#12233e]/50">
                {mockEvents.filter((e) => e.type === 'compliance').slice(0, 5).map((e) => (
                  <tr key={e.id} className="hover:bg-[#12233e]/30 transition-colors">
                    <td className="px-4 py-3 text-white flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-[#12233e] flex items-center justify-center"><User className="w-3 h-3 text-[#7a95b8]" /></div>
                      <span className="truncate max-w-[90px]">{e.clientName}</span>
                    </td>
                    <td className="px-4 py-3 text-[#c8d8ec] text-xs">{e.action}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${e.impactScore > 80 ? 'bg-red-500/20 text-red-400' : e.impactScore > 50 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
                        {e.impactScore}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 4: System Events */}
        <div className="bg-[#0d1a2e] border border-[#12233e] rounded-xl overflow-hidden flex flex-col h-full">
          <div className="p-4 border-b border-[#12233e] bg-[#060d19]/50 flex justify-between items-center">
            <h4 className="text-white font-medium flex items-center gap-2"><Cpu className="w-4 h-4 text-gray-400" /> Infrastructure Logs</h4>
            <button className="text-xs text-[#7a95b8] hover:text-white transition-colors"><Settings className="w-3.5 h-3.5" /></button>
          </div>
          <div className="p-0 flex-1 overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#060d19] text-[#7a95b8] text-xs uppercase"><tr className="border-b border-[#12233e]"><th className="px-4 py-3 font-medium">System Process</th><th className="px-4 py-3 font-medium">Duration</th><th className="px-4 py-3 font-medium text-right">Status</th></tr></thead>
              <tbody className="divide-y divide-[#12233e]/50">
                {mockEvents.filter((e) => e.type === 'system').slice(0, 5).map((e) => (
                  <tr key={e.id} className="hover:bg-[#12233e]/30 transition-colors">
                    <td className="px-4 py-3 text-white truncate max-w-[140px] text-xs font-mono">{e.action}</td>
                    <td className="px-4 py-3 text-[#7a95b8] text-xs">{formatDuration(e.duration)}</td>
                    <td className="px-4 py-3 text-right flex justify-end">
                      <span className={`flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider ${e.status === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                        {getStatusIcon(e.status)} {e.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 5: Auth Events */}
        <div className="bg-[#0d1a2e] border border-[#12233e] rounded-xl overflow-hidden flex flex-col h-full">
          <div className="p-4 border-b border-[#12233e] bg-[#060d19]/50 flex justify-between items-center">
            <h4 className="text-white font-medium flex items-center gap-2"><Lock className="w-4 h-4 text-orange-400" /> Access & Security</h4>
            <span className="text-xs text-[#7a95b8] bg-[#12233e] px-2 py-0.5 rounded font-mono">Real-time</span>
          </div>
          <div className="p-0 flex-1 overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#060d19] text-[#7a95b8] text-xs uppercase"><tr className="border-b border-[#12233e]"><th className="px-4 py-3 font-medium">Identity</th><th className="px-4 py-3 font-medium">Source IP</th><th className="px-4 py-3 font-medium text-right">Device</th></tr></thead>
              <tbody className="divide-y divide-[#12233e]/50">
                {mockEvents.filter((e) => e.type === 'auth').slice(0, 5).map((e) => (
                  <tr key={e.id} className="hover:bg-[#12233e]/30 transition-colors">
                    <td className="px-4 py-3 text-white font-medium text-xs truncate max-w-[100px]">{e.actor}</td>
                    <td className="px-4 py-3 font-mono text-[10px] text-[#c8d8ec]">{e.ipAddress}</td>
                    <td className="px-4 py-3 text-right text-[10px] text-[#7a95b8] truncate max-w-[80px]" title={e.metadata.browser}>{e.metadata.browser}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 6: Active Clients */}
        <div className="bg-[#0d1a2e] border border-[#12233e] rounded-xl overflow-hidden flex flex-col h-full">
          <div className="p-4 border-b border-[#12233e] bg-[#060d19]/50 flex justify-between items-center">
            <h4 className="text-white font-medium flex items-center gap-2"><ActivitySquare className="w-4 h-4 text-emerald-400" /> Client Engagement</h4>
            <button className="text-xs text-blue-400 hover:text-blue-300">Export</button>
          </div>
          <div className="p-0 flex-1 overflow-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#060d19] text-[#7a95b8] text-xs uppercase"><tr className="border-b border-[#12233e]"><th className="px-4 py-3 font-medium">Client Profile</th><th className="px-4 py-3 font-medium text-right">Interactions</th><th className="px-4 py-3 font-medium text-right">Trend</th></tr></thead>
              <tbody className="divide-y divide-[#12233e]/50">
                {Object.entries(mockEvents.reduce((acc, e) => { acc[e.clientName] = (acc[e.clientName]||0)+1; return acc; }, {} as Record<string,number>))
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([name, count], i) => (
                  <tr key={name} className="hover:bg-[#12233e]/30 transition-colors">
                    <td className="px-4 py-3 text-white text-xs font-medium">{name}</td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-400">{count}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-[10px] flex items-center justify-end gap-1 ${i % 2 === 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {i % 2 === 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {Math.floor(Math.random() * 20) + 1}%
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
  );

  return (
    <AppShell>
      <div className="min-h-screen bg-[#060d19] text-[#c8d8ec] p-4 sm:p-6 lg:p-8 font-sans transition-colors duration-300">
        {/* Page Header Area */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div className="flex items-start sm:items-center gap-4">
            <div className="p-3.5 bg-gradient-to-br from-[#0d1a2e] to-[#060d19] rounded-2xl border border-[#12233e] shadow-[0_0_20px_rgba(240,192,64,0.05)]">
              <History className="w-8 h-8 text-[#f0c040]" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Enterprise Audit Center</h1>
                <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
                  <ShieldCheck className="w-3 h-3" /> Secure
                </span>
              </div>
              <p className="text-sm sm:text-base text-[#7a95b8] max-w-2xl">
                Comprehensive tracking, forensic analytics, and compliance monitoring for all system activities and user engagements.
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:flex-none sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7a95b8]" />
              <input 
                type="text" 
                placeholder="Search events, IPs, clients..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-[#0d1a2e] border border-[#12233e] rounded-lg text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-sm"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a95b8] hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            
            <button 
              onClick={() => setShowFilters(!showFilters)} 
              className={`p-2.5 rounded-lg border transition-all shadow-sm flex items-center gap-2 ${showFilters ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-[#0d1a2e] border-[#12233e] text-[#7a95b8] hover:bg-[#12233e] hover:text-white'}`}
              title="Advanced Filters"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline text-sm font-medium">Filters</span>
              {(filterType !== 'all' || selectedActor !== 'all' || selectedStatus !== 'all' || quickFilter) && (
                <span className="w-2 h-2 rounded-full bg-blue-500 absolute top-2 right-2 sm:static"></span>
              )}
            </button>
            
            <div className="h-8 w-px bg-[#12233e] hidden sm:block mx-1"></div>
            
            <button 
              onClick={handleRefresh} 
              className="p-2.5 rounded-lg border border-[#12233e] bg-[#0d1a2e] text-[#7a95b8] hover:bg-[#12233e] hover:text-white transition-all shadow-sm"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin text-blue-400' : ''}`} />
            </button>
            
            <button 
              onClick={() => setShowExportModal(true)} 
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-[#060d19] hover:bg-gray-200 rounded-lg transition-colors text-sm font-semibold shadow-sm"
            >
              <Download className="w-4 h-4" /> 
              <span className="hidden sm:inline">Export</span>
            </button>
            
            <ExportToSlides 
              toolName="Audit Center" 
              getSections={() => [
                { 
                  title: "Audit Intelligence Summary", 
                  items: [
                    { label: "Total Events Tracked", value: mockEvents.length.toString() },
                    { label: "Security Anomalies", value: mockEvents.filter((e) => e.impactScore > 80).length.toString() },
                    { label: "Active Users", value: new Set(mockEvents.map((e) => e.actor)).size.toString() }
                  ] 
                }
              ]} 
            />
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <div className="bg-gradient-to-br from-[#0d1a2e] to-[#060d19] border border-[#12233e] rounded-xl p-5 shadow-sm hover:border-[#3b82f6]/50 transition-colors group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-[#7a95b8] text-xs font-semibold uppercase tracking-wider mb-1">Total Tracked Events</p>
                <h3 className="text-3xl font-bold text-white flex items-baseline gap-2">
                  {mockEvents.length.toLocaleString()}
                  <span className="text-xs font-medium text-green-400 flex items-center bg-green-400/10 px-1.5 py-0.5 rounded">
                    <ArrowUpRight className="w-3 h-3 mr-0.5" /> 12%
                  </span>
                </h3>
              </div>
              <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
                <Activity className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[#12233e] flex justify-between items-center text-xs">
              <span className="text-[#7a95b8]">Last 30 days</span>
              <button onClick={() => { setFilterType('all'); setActiveTab('timeline'); }} className="text-blue-400 hover:text-blue-300 font-medium">View all &rarr;</button>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-[#0d1a2e] to-[#060d19] border border-[#12233e] rounded-xl p-5 shadow-sm hover:border-[#ef4444]/50 transition-colors group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-[#7a95b8] text-xs font-semibold uppercase tracking-wider mb-1">Compliance & Security Alerts</p>
                <h3 className="text-3xl font-bold text-white flex items-baseline gap-2">
                  {mockEvents.filter((e) => e.type === 'compliance' || e.type === 'auth').length}
                  <span className="text-xs font-medium text-red-400 flex items-center bg-red-400/10 px-1.5 py-0.5 rounded">
                    <ArrowUpRight className="w-3 h-3 mr-0.5" /> 4%
                  </span>
                </h3>
              </div>
              <div className="p-2.5 bg-red-500/10 rounded-xl border border-red-500/20 text-red-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[#12233e] flex justify-between items-center text-xs">
              <span className="text-[#7a95b8]">{mockEvents.filter((e) => e.impactScore > 80).length} high impact</span>
              <button onClick={() => { applyQuickFilter('security'); setActiveTab('timeline'); }} className="text-red-400 hover:text-red-300 font-medium">Review alerts &rarr;</button>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-[#0d1a2e] to-[#060d19] border border-[#12233e] rounded-xl p-5 shadow-sm hover:border-[#22c55e]/50 transition-colors group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-[#7a95b8] text-xs font-semibold uppercase tracking-wider mb-1">Active System Users</p>
                <h3 className="text-3xl font-bold text-white flex items-baseline gap-2">
                  {new Set(mockEvents.map((e) => e.actor)).size}
                  <span className="text-xs font-medium text-green-400 flex items-center bg-green-400/10 px-1.5 py-0.5 rounded">
                    <ArrowUpRight className="w-3 h-3 mr-0.5" /> 8%
                  </span>
                </h3>
              </div>
              <div className="p-2.5 bg-green-500/10 rounded-xl border border-green-500/20 text-green-400">
                <User className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[#12233e] flex justify-between items-center text-xs">
              <span className="text-[#7a95b8]">Across 4 roles</span>
              <button className="text-green-400 hover:text-green-300 font-medium">Manage users &rarr;</button>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-[#0d1a2e] to-[#060d19] border border-[#12233e] rounded-xl p-5 shadow-sm hover:border-[#f59e0b]/50 transition-colors group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-[#7a95b8] text-xs font-semibold uppercase tracking-wider mb-1">Failed Transactions</p>
                <h3 className="text-3xl font-bold text-white flex items-baseline gap-2">
                  {mockEvents.filter((e) => e.status === 'failed').length}
                  <span className="text-xs font-medium text-green-400 flex items-center bg-green-400/10 px-1.5 py-0.5 rounded" title="Decrease is good">
                    <ArrowDownRight className="w-3 h-3 mr-0.5" /> 2%
                  </span>
                </h3>
              </div>
              <div className="p-2.5 bg-orange-500/10 rounded-xl border border-orange-500/20 text-orange-400">
                <XCircle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-[#12233e] flex justify-between items-center text-xs">
              <span className="text-[#7a95b8]">{(mockEvents.filter((e) => e.status === 'failed').length / mockEvents.length * 100).toFixed(1)}% error rate</span>
              <button onClick={() => { applyQuickFilter('errors'); setActiveTab('timeline'); }} className="text-orange-400 hover:text-orange-300 font-medium">Diagnose &rarr;</button>
            </div>
          </div>
        </div>

        {/* Main Navigation Tabs */}
        <div className="flex flex-wrap gap-2 sm:gap-6 border-b border-[#12233e] mb-6">
          {[
            { id: 'timeline', label: 'Event Timeline', icon: ListFilter },
            { id: 'analytics', label: 'Forensic Analytics', icon: BarChart3 },
            { id: 'security', label: 'Security Posture', icon: Shield },
            { id: 'compliance', label: 'Compliance Reports', icon: FileText },
            { id: 'settings', label: 'Audit Configuration', icon: Settings }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)} 
              className={`pb-3 px-2 text-sm font-semibold transition-all relative flex items-center gap-2 ${activeTab === tab.id ? "text-white" : "text-[#7a95b8] hover:text-white hover:bg-[#12233e]/30 rounded-t-lg"}`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-400' : ''}`} />
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 shadow-[0_-2px_10px_rgba(59,130,246,0.5)]" />
              )}
            </button>
          ))}
        </div>

        {/* Render Filters Contextually based on Tab */}
        {activeTab === "timeline" && renderFilters()}

        {/* Dynamic Main Content Area */}
        <div className="min-h-[500px]">
          {activeTab === "timeline" && renderTimelineView()}
          {activeTab === "analytics" && renderAnalyticsView()}
          
          {/* Placeholder for other tabs to meet requirements */}
          {(activeTab === "security" || activeTab === "compliance" || activeTab === "settings") && (
            <div className="flex flex-col items-center justify-center py-32 bg-[#0d1a2e] border border-[#12233e] rounded-xl border-dashed">
              <div className="w-20 h-20 bg-[#12233e] rounded-full flex items-center justify-center mb-6">
                {activeTab === "security" ? <Shield className="w-10 h-10 text-orange-400" /> : 
                 activeTab === "compliance" ? <FileText className="w-10 h-10 text-purple-400" /> : 
                 <Settings className="w-10 h-10 text-gray-400" />}
              </div>
              <h3 className="text-2xl font-medium text-white mb-3 capitalize">{activeTab} Module</h3>
              <p className="text-[#7a95b8] text-center max-w-md mb-8 text-lg">
                This enterprise module is currently initializing. Advanced features will be available shortly.
              </p>
              <button onClick={() => setActiveTab("timeline")} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-lg">
                Return to Timeline View
              </button>
            </div>
          )}
        </div>

        {/* Export Modal Overlay */}
        {showExportModal && (
          <div className="fixed inset-0 bg-[#060d19]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
            <div className="bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative overflow-hidden">
              {/* Decorative background element */}
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
              
              <div className="flex justify-between items-center mb-6 relative z-10">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Download className="w-5 h-5 text-blue-400" /> Export Audit Data
                </h3>
                <button onClick={() => setShowExportModal(false)} className="text-[#7a95b8] hover:text-white bg-[#12233e] hover:bg-gray-700/50 p-1.5 rounded-md transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-6 relative z-10">
                <div>
                  <label className="block text-sm font-medium text-[#c8d8ec] mb-3">Select Export Format</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: "csv", label: "CSV File", icon: FileText, desc: "Best for spreadsheet software" },
                      { id: "excel", label: "Excel (.xlsx)", icon: LayoutGrid, desc: "Formatted workbook" },
                      { id: "json", label: "JSON Data", icon: Database, desc: "Raw data for APIs" },
                      { id: "pdf", label: "PDF Report", icon: FileText, desc: "Formatted for printing" }
                    ].map((f) => (
                      <button 
                        key={f.id} 
                        onClick={() => setExportFormat(f.id as any)} 
                        className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${exportFormat === f.id ? 'bg-blue-500/10 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.1)]' : 'bg-[#060d19] border-[#12233e] hover:border-[#7a95b8]'}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <f.icon className={`w-4 h-4 ${exportFormat === f.id ? 'text-blue-400' : 'text-[#7a95b8]'}`} />
                          <span className={`font-semibold ${exportFormat === f.id ? 'text-blue-400' : 'text-white'}`}>{f.label}</span>
                        </div>
                        <span className="text-[10px] text-[#7a95b8]">{f.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="bg-[#060d19] p-4 rounded-xl border border-[#12233e]">
                  <h4 className="text-xs font-semibold text-[#7a95b8] uppercase tracking-wider mb-3">Export Scope</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-[#c8d8ec]">Records to export:</span>
                      <span className="font-mono font-medium text-white">{filteredEvents.length.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#c8d8ec]">Applied filters:</span>
                      <span className="text-blue-400 font-medium">
                        {(filterType !== 'all' || selectedActor !== 'all' || selectedStatus !== 'all' || quickFilter) ? 'Custom Selection' : 'All Data'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[#c8d8ec]">Date range:</span>
                      <span className="text-white">Last 30 Days</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setShowExportModal(false)} 
                    className="flex-1 py-2.5 rounded-lg border border-[#12233e] text-white hover:bg-[#12233e] font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleExport} 
                    disabled={isExporting || filteredEvents.length === 0} 
                    className="flex-[2] py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 font-medium shadow-lg transition-colors"
                  >
                    {isExporting ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> Processing...</>
                    ) : (
                      <><Download className="w-4 h-4" /> Download {exportFormat.toUpperCase()}</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Event Detail Slide-out Panel */}
        {detailPanelOpen && selectedEventForDetail && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-[#060d19]/60 backdrop-blur-sm" onClick={closeEventDetail}></div>
            <div className="w-full max-w-md bg-[#0d1a2e] border-l border-[#12233e] h-full relative z-10 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
              <div className="flex justify-between items-center p-5 border-b border-[#12233e] bg-[#060d19]/50">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-400" /> Event Details
                </h3>
                <button onClick={closeEventDetail} className="p-1.5 bg-[#12233e] text-[#7a95b8] hover:text-white rounded-md transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {/* Status Banner */}
                <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                  selectedEventForDetail.status === 'success' ? 'bg-green-500/10 border-green-500/20' : 
                  selectedEventForDetail.status === 'failed' ? 'bg-red-500/10 border-red-500/20' : 
                  'bg-yellow-500/10 border-yellow-500/20'
                }`}>
                  <div className="mt-0.5">
                    {getStatusIcon(selectedEventForDetail.status)}
                  </div>
                  <div>
                    <h4 className={`font-bold capitalize ${
                      selectedEventForDetail.status === 'success' ? 'text-green-400' : 
                      selectedEventForDetail.status === 'failed' ? 'text-red-400' : 
                      'text-yellow-400'
                    }`}>
                      Execution {selectedEventForDetail.status}
                    </h4>
                    <p className="text-sm text-[#c8d8ec] mt-1">{selectedEventForDetail.action}</p>
                  </div>
                </div>

                {/* Core Details */}
                <div>
                  <h4 className="text-xs font-semibold text-[#7a95b8] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Database className="w-3.5 h-3.5" /> Core Information
                  </h4>
                  <div className="bg-[#060d19] rounded-xl border border-[#12233e] divide-y divide-[#12233e]">
                    <div className="p-3 flex justify-between items-center">
                      <span className="text-sm text-[#7a95b8]">Event ID</span>
                      <span className="text-sm font-mono text-white">EVT-{selectedEventForDetail.id.toString().padStart(6, '0')}</span>
                    </div>
                    <div className="p-3 flex justify-between items-center">
                      <span className="text-sm text-[#7a95b8]">Timestamp</span>
                      <span className="text-sm text-white">{new Date(selectedEventForDetail.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="p-3 flex justify-between items-center">
                      <span className="text-sm text-[#7a95b8]">Category</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded border capitalize ${getTypeColor(selectedEventForDetail.type)}`}>
                        {selectedEventForDetail.type}
                      </span>
                    </div>
                    <div className="p-3 flex justify-between items-center">
                      <span className="text-sm text-[#7a95b8]">Initiator</span>
                      <span className="text-sm text-white flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#7a95b8]" /> {selectedEventForDetail.actor}
                      </span>
                    </div>
                    <div className="p-3 flex justify-between items-center">
                      <span className="text-sm text-[#7a95b8]">Target Client</span>
                      <span className="text-sm text-white">{selectedEventForDetail.clientName}</span>
                    </div>
                  </div>
                </div>

                {/* Extended Description */}
                <div>
                  <h4 className="text-xs font-semibold text-[#7a95b8] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <AlignJustify className="w-3.5 h-3.5" /> Detailed Description
                  </h4>
                  <div className="bg-[#060d19] rounded-xl border border-[#12233e] p-4 text-sm text-[#c8d8ec] leading-relaxed">
                    {selectedEventForDetail.detail}
                  </div>
                </div>

                {/* Technical Meta */}
                <div>
                  <h4 className="text-xs font-semibold text-[#7a95b8] uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Monitor className="w-3.5 h-3.5" /> Technical Metadata
                  </h4>
                  <div className="bg-[#060d19] rounded-xl border border-[#12233e] divide-y divide-[#12233e]">
                    <div className="p-3 flex justify-between items-center">
                      <span className="text-sm text-[#7a95b8]">IP Address</span>
                      <span className="text-sm font-mono text-white flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-[#7a95b8]" /> {selectedEventForDetail.ipAddress}
                      </span>
                    </div>
                    <div className="p-3 flex justify-between items-center">
                      <span className="text-sm text-[#7a95b8]">Execution Time</span>
                      <span className="text-sm text-white font-mono">{selectedEventForDetail.duration}ms</span>
                    </div>
                    <div className="p-3 flex justify-between items-center">
                      <span className="text-sm text-[#7a95b8]">Environment</span>
                      <span className="text-sm text-white">{selectedEventForDetail.metadata.os} / {selectedEventForDetail.metadata.browser}</span>
                    </div>
                    <div className="p-3 flex justify-between items-center">
                      <span className="text-sm text-[#7a95b8]">Device ID</span>
                      <span className="text-xs font-mono text-[#7a95b8]">{selectedEventForDetail.metadata.deviceId}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-5 border-t border-[#12233e] bg-[#060d19] flex gap-3">
                <button className="flex-1 py-2.5 bg-[#0d1a2e] border border-[#12233e] text-white rounded-lg hover:bg-[#12233e] transition-colors font-medium flex justify-center items-center gap-2">
                  <Share2 className="w-4 h-4" /> Share
                </button>
                <button className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex justify-center items-center gap-2">
                  <ExternalLink className="w-4 h-4" /> Investigate
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Insight Component */}
        <div className="mt-12 pt-8 border-t border-[#12233e]">
          <PageInsights pageId="audit-timeline-enterprise" />
        </div>
      </div>
    </AppShell>
  );
}
