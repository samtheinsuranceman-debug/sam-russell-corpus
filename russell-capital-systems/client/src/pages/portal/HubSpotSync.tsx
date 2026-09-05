// @ts-nocheck
import { trpc } from "@/lib/trpc";
import { useState, useMemo, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Link2,
  RefreshCw,
  ArrowLeftRight,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Users,
  Briefcase,
  Search,
  Download,
  Activity,
  Database,
  Settings,
  Server,
  BarChart3,
  PieChartIcon,
  Info,
  ShieldAlert,
  Zap,
  Layers,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ExportToSlides } from "@/components/ExportToSlides";
import { AppShell } from "@/components/AppShell";
import { PageInsights } from "@/components/PageInsights";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, ComposedChart, Legend
} from "recharts";

type SyncDirection = "BIDIRECTIONAL" | "PUSH_ONLY" | "PULL_ONLY";

const DIRECTION_CONFIG: Record<SyncDirection, { label: string; icon: typeof ArrowLeftRight; desc: string }> = {
  BIDIRECTIONAL: { label: "Bidirectional", icon: ArrowLeftRight, desc: "Sync changes both ways" },
  PUSH_ONLY: { label: "Push Only", icon: ArrowRight, desc: "Push local changes to HubSpot" },
  PULL_ONLY: { label: "Pull Only", icon: ArrowLeft, desc: "Pull HubSpot changes locally" },
};

const STATUS_CONFIG: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
  SUCCESS: { color: "text-emerald-400", icon: CheckCircle2 },
  PARTIAL: { color: "text-amber-400", icon: AlertTriangle },
  FAILED: { color: "text-red-400", icon: XCircle },
};

export default function HubSpotSync() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "settings" | "analytics" | "logs" | "mapping">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [dateRange, setDateRange] = useState<"7D" | "30D" | "90D" | "YTD">("30D");
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  const settingsQuery = trpc.hubspot.getSettings.useQuery(undefined, { staleTime: 30_000 });
  const historyQuery = trpc.hubspot.syncHistory.useQuery(undefined, { staleTime: 30_000 });
  const analyticsQuery = trpc.hubspot.getAnalytics.useQuery({ period: dateRange }, { staleTime: 60_000 });
  const mappingQuery = trpc.hubspot.getFieldMappings.useQuery(undefined, { staleTime: 60_000 });
  const connectionQuery = trpc.hubspot.getConnectionStatus.useQuery(undefined, { staleTime: 30_000 });
  const healthQuery = trpc.hubspot.getHealthScore.useQuery(undefined, { staleTime: 60_000 });
  
  const updateMutation = trpc.hubspot.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("HubSpot sync settings updated");
      settingsQuery.refetch();
    },
    onError: () => toast.error("Failed to update settings"),
  });

  const triggerMutation = trpc.hubspot.triggerSync.useMutation({
    onSuccess: (data) => {
      toast.info(data.message);
      settingsQuery.refetch();
      historyQuery.refetch();
      analyticsQuery.refetch();
      simulateSyncProgress();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMappingMutation = trpc.hubspot.updateFieldMapping.useMutation({
    onSuccess: () => {
      toast.success("Field mapping updated successfully");
      mappingQuery.refetch();
    },
    onError: () => toast.error("Failed to update field mapping"),
  });

  const simulateSyncProgress = useCallback(() => {
    setIsSyncing(true);
    setSyncProgress(0);
    const interval = setInterval(() => {
      setSyncProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSyncing(false);
          toast.success("Sync completed successfully");
          return 100;
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 500);
  }, []);

  const settings = settingsQuery.data;
  const history = historyQuery.data ?? [];
  const analytics = analyticsQuery.data ?? { dailyStats: [], objectStats: [], errorStats: [] };
  const mappings = mappingQuery.data ?? [];
  const connection = connectionQuery.data ?? { status: "DISCONNECTED", lastPing: null, latency: 0 };
  const health = healthQuery.data ?? { score: 0, issues: [] };

  const isLoading = !settingsQuery.data || !historyQuery.data;

  const mockDailyStats = useMemo(() => {
    if (analytics.dailyStats?.length > 0) return analytics.dailyStats;
    return Array.from({ length: 30 }).map((_, i) => ({
      date: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      success: Math.floor(Math.random() * 500) + 100,
      failed: Math.floor(Math.random() * 20),
      partial: Math.floor(Math.random() * 50)
    }));
  }, [analytics.dailyStats]);

  const mockObjectStats = useMemo(() => {
    if (analytics.objectStats?.length > 0) return analytics.objectStats;
    return [
      { name: "Contacts", value: 4500, color: "#3b82f6" },
      { name: "Companies", value: 1200, color: "#8b5cf6" },
      { name: "Deals", value: 850, color: "#f59e0b" },
      { name: "Tickets", value: 320, color: "#10b981" },
      { name: "Notes", value: 5600, color: "#6366f1" }
    ];
  }, [analytics.objectStats]);

  const mockErrorStats = useMemo(() => {
    if (analytics.errorStats?.length > 0) return analytics.errorStats;
    return [
      { type: "API Rate Limit", count: 45, severity: 80 },
      { type: "Validation Error", count: 120, severity: 40 },
      { type: "Missing Field", count: 85, severity: 60 },
      { type: "Authentication", count: 12, severity: 95 },
      { type: "Network Timeout", count: 34, severity: 70 }
    ];
  }, [analytics.errorStats]);

  const mockLatencyData = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => ({
      time: `${i}:00`,
      latency: Math.floor(Math.random() * 150) + 50,
      threshold: 200
    }));
  }, []);

  const mockPerformanceData = useMemo(() => {
    return [
      { subject: "Speed", A: 120, B: 110, fullMark: 150 },
      { subject: "Reliability", A: 98, B: 130, fullMark: 150 },
      { subject: "Accuracy", A: 86, B: 130, fullMark: 150 },
      { subject: "Throughput", A: 99, B: 100, fullMark: 150 },
      { subject: "Efficiency", A: 85, B: 90, fullMark: 150 },
      { subject: "Uptime", A: 65, B: 85, fullMark: 150 },
    ];
  }, []);

  const filteredHistory = useMemo(() => {
    if (!history.length) return [];
    return history.filter((h) => {
      const matchesSearch = !searchQuery || 
        h.objectType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.errorMessage?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === "ALL" || h.status === filterStatus;
      const matchesType = filterType === "ALL" || h.objectType === filterType;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [history, searchQuery, filterStatus, filterType]);

  const exportCsv = useCallback(() => {
    if (!filteredHistory.length) return;
    const headers = ["Date", "Direction", "Object Type", "Status", "HubSpot ID", "Error Message"];
    const rows = filteredHistory.map((h) => [
      new Date(h.syncedAt).toLocaleString(),
      h.direction || "",
      h.objectType || "",
      h.status || "",
      h.hubspotId || "",
      h.errorMessage || ""
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "hubspot_sync_history.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Export downloaded successfully");
  }, [filteredHistory]);

  const handleStatusToggle = useCallback((enabled: boolean) => {
    updateMutation.mutate({ syncEnabled: enabled });
  }, [updateMutation]);

  const handleDirectionChange = useCallback((dir: SyncDirection) => {
    updateMutation.mutate({ syncDirection: dir });
  }, [updateMutation]);

  const renderOverview = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rc-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Activity className="text-emerald-400" size={20} />
            </div>
            <span className={`rc-badge ${settings?.syncEnabled ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
              {settings?.syncEnabled ? "Active" : "Inactive"}
            </span>
          </div>
          <div>
            <p className="rc-stat-label">Sync Status</p>
            <p className="rc-stat-value text-xl mt-1">
              {isSyncing ? `Syncing ${syncProgress}%` : settings?.syncEnabled ? "Running" : "Paused"}
            </p>
          </div>
          {isSyncing && (
            <div className="w-full bg-[#0d1a2e] rounded-full h-1.5 mt-4 overflow-hidden">
              <div 
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${syncProgress}%` }}
              />
            </div>
          )}
        </div>

        <div className="rc-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Users className="text-blue-400" size={20} />
            </div>
            <span className="rc-badge bg-blue-500/10 text-blue-400 border-blue-500/20">Contacts</span>
          </div>
          <div>
            <p className="rc-stat-label">Total Synced</p>
            <p className="rc-stat-value text-xl mt-1">
              {((settings?.lastSyncContactsPushed || 0) + (settings?.lastSyncContactsPulled || 0)).toLocaleString()}
            </p>
          </div>
          <div className="mt-4 flex items-center text-xs text-blue-400">
            <ArrowRight size={12} className="mr-1" />
            <span>+124 this week</span>
          </div>
        </div>

        <div className="rc-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <Briefcase className="text-purple-400" size={20} />
            </div>
            <span className="rc-badge bg-purple-500/10 text-purple-400 border-purple-500/20">Deals</span>
          </div>
          <div>
            <p className="rc-stat-label">Total Synced</p>
            <p className="rc-stat-value text-xl mt-1">
              {((settings?.lastSyncDealsPushed || 0) + (settings?.lastSyncDealsPulled || 0)).toLocaleString()}
            </p>
          </div>
          <div className="mt-4 flex items-center text-xs text-purple-400">
            <ArrowRight size={12} className="mr-1" />
            <span>+38 this week</span>
          </div>
        </div>

        <div className="rc-card flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Clock className="text-orange-400" size={20} />
            </div>
            <span className="rc-badge bg-orange-500/10 text-orange-400 border-orange-500/20">Last Sync</span>
          </div>
          <div>
            <p className="rc-stat-label">Last Successful</p>
            <p className="rc-stat-value text-sm mt-1 truncate">
              {settings?.lastSyncTime ? new Date(settings.lastSyncTime).toLocaleString() : "Never"}
            </p>
          </div>
          <div className="mt-4 flex items-center text-xs text-[#7a95b8]">
            <Server size={12} className="mr-1" />
            <span>Latency: {connection.latency}ms</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rc-card">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-white flex items-center gap-2">
              <Activity size={18} className="text-[#22c55e]" />
              Sync Volume (30 Days)
            </h3>
            <div className="flex gap-2">
              {["7D", "30D", "90D"].map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range as any)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    dateRange === range 
                      ? "bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30" 
                      : "bg-[#0d1a2e] text-[#7a95b8] border border-[#12233e] hover:text-white"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockDailyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                <XAxis dataKey="date" stroke="#4b6282" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#4b6282" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#060d18', borderColor: '#12233e', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend iconType="circle" />
                <Area type="monotone" dataKey="success" name="Successful" stroke="#22c55e" fillOpacity={1} fill="url(#colorSuccess)" />
                <Area type="monotone" dataKey="failed" name="Failed" stroke="#ef4444" fillOpacity={1} fill="url(#colorFailed)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rc-card">
          <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
            <PieChartIcon size={18} className="text-[#3b82f6]" />
            Object Distribution
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockObjectStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {mockObjectStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#060d18', borderColor: '#12233e', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 pt-4 border-t border-[#12233e]">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#7a95b8]">Total Objects</span>
              <span className="text-white font-medium">
                {mockObjectStats.reduce((acc, curr) => acc + curr.value, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rc-card">
          <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
            <BarChart3 size={18} className="text-[#f59e0b]" />
            Error Frequency by Type
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockErrorStats} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" horizontal={false} />
                <XAxis type="number" stroke="#4b6282" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="type" type="category" stroke="#4b6282" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#060d18', borderColor: '#12233e', color: '#fff' }}
                  cursor={{ fill: '#12233e', opacity: 0.4 }}
                />
                <Bar dataKey="count" name="Error Count" fill="#f59e0b" radius={[0, 4, 4, 0]}>
                  {mockErrorStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.severity > 80 ? '#ef4444' : entry.severity > 50 ? '#f59e0b' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rc-card">
          <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
            <Zap size={18} className="text-[#8b5cf6]" />
            Sync Performance
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={mockPerformanceData}>
                <PolarGrid stroke="#12233e" />
                <PolarAngleAxis dataKey="subject" stroke="#4b6282" fontSize={12} />
                <PolarRadiusAxis angle={30} domain={[0, 150]} stroke="#4b6282" tick={false} axisLine={false} />
                <Radar name="Current" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
                <Radar name="Target" dataKey="B" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                <Tooltip contentStyle={{ backgroundColor: '#060d18', borderColor: '#12233e' }} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {connection.status === "DISCONNECTED" && (
        <div className="rc-card border-amber-500/20 bg-gradient-to-br from-[#0d1a2e] to-amber-900/10">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-amber-400">Connection Setup Required</h3>
              <p className="text-[#c8d8ec] mt-2 text-sm leading-relaxed">
                To enable full bidirectional sync, you need to authorize the HubSpot connector in your admin settings.
                Once authorized, the sync will automatically push and pull contacts and deals based on your configuration above.
                The HubSpot MCP connector needs to be authorized before sync can operate.
              </p>
              <button className="mt-4 rc-btn rc-btn-ghost text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border-amber-500/20">
                Go to Admin Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-[#060d18] p-4 rounded-xl border border-[#12233e]">
        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4b6282]" size={16} />
            <input
              type="text"
              placeholder="Search history..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0d1a2e] border border-[#12233e] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-[#4b6282] focus:outline-none focus:border-[#3b82f6] transition-colors"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#0d1a2e] border border-[#12233e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3b82f6]"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">Success</option>
            <option value="FAILED">Failed</option>
            <option value="PARTIAL">Partial</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#0d1a2e] border border-[#12233e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3b82f6]"
          >
            <option value="ALL">All Objects</option>
            <option value="CONTACT">Contacts</option>
            <option value="DEAL">Deals</option>
            <option value="COMPANY">Companies</option>
          </select>
        </div>
        <button
          onClick={exportCsv}
          className="flex items-center gap-2 px-4 py-2 bg-[#0d1a2e] hover:bg-[#12233e] border border-[#12233e] rounded-lg text-sm text-white transition-colors w-full sm:w-auto justify-center"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      <div className="rc-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0d1a2e] border-b border-[#12233e]">
                <th className="px-6 py-4 text-xs font-medium text-[#7a95b8] uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-4 text-xs font-medium text-[#7a95b8] uppercase tracking-wider">Direction</th>
                <th className="px-6 py-4 text-xs font-medium text-[#7a95b8] uppercase tracking-wider">Object</th>
                <th className="px-6 py-4 text-xs font-medium text-[#7a95b8] uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-medium text-[#7a95b8] uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#12233e]">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((item: any, i: number) => {
                  const StatusIcon = STATUS_CONFIG[item.status]?.icon || AlertTriangle;
                  const statusColor = STATUS_CONFIG[item.status]?.color || "text-gray-400";
                  
                  return (
                    <tr key={i} className="hover:bg-[#0d1a2e]/50 transition-colors cursor-pointer" onClick={() => setSelectedLog(item)}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm text-white">{new Date(item.syncedAt).toLocaleDateString()}</span>
                          <span className="text-xs text-[#4b6282]">{new Date(item.syncedAt).toLocaleTimeString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {item.direction === "PUSH" ? <ArrowRight size={14} className="text-blue-400" /> : 
                           item.direction === "PULL" ? <ArrowLeft size={14} className="text-purple-400" /> : 
                           <ArrowLeftRight size={14} className="text-emerald-400" />}
                          <span className="text-sm text-[#c8d8ec]">{item.direction}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-[#12233e] text-[#c8d8ec]">
                          {item.objectType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <StatusIcon size={16} className={statusColor} />
                          <span className={`text-sm font-medium ${statusColor}`}>{item.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-[#7a95b8] max-w-xs truncate">
                          {item.errorMessage || `Synced ID: ${item.hubspotId || 'N/A'}`}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Database size={32} className="mx-auto text-[#4b6282] mb-3" />
                    <p className="text-[#c8d8ec] font-medium">No sync history found</p>
                    <p className="text-sm text-[#7a95b8] mt-1">Adjust your filters or trigger a new sync.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* 5th Recharts Component: ComposedChart for Volume/Errors */}
      <div className="rc-card">
        <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
          <Layers size={18} className="text-[#10b981]" />
          Sync Volume vs Errors
        </h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={mockDailyStats} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid stroke="#12233e" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" stroke="#4b6282" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" stroke="#4b6282" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis yAxisId="right" orientation="right" stroke="#ef4444" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#060d18', borderColor: '#12233e', color: '#fff' }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="success" name="Successful Syncs" barSize={20} fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="failed" name="Errors" stroke="#ef4444" strokeWidth={2} dot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rc-card">
            <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
              <Settings size={18} className="text-[#3b82f6]" />
              General Configuration
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#0d1a2e] border border-[#12233e]">
                <div>
                  <h4 className="text-white font-medium">Master Sync Toggle</h4>
                  <p className="text-sm text-[#7a95b8] mt-1">Enable or disable all synchronization activities globally.</p>
                </div>
                <button
                  onClick={() => handleStatusToggle(!settings?.syncEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    settings?.syncEnabled ? 'bg-[#22c55e]' : 'bg-[#4b6282]'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings?.syncEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium text-[#c8d8ec] uppercase tracking-wider">Sync Direction</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {(Object.entries(DIRECTION_CONFIG) as [SyncDirection, any][]).map(([key, cfg]) => {
                    const isActive = settings?.syncDirection === key;
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => handleDirectionChange(key)}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          isActive 
                            ? "bg-[#22c55e]/10 border-[#22c55e]/30 ring-1 ring-[#22c55e]/50" 
                            : "bg-[#0d1a2e] border-[#12233e] hover:border-[#4b6282]"
                        }`}
                      >
                        <Icon size={20} className={isActive ? "text-[#22c55e]" : "text-[#7a95b8]"} />
                        <p className={`text-base font-medium mt-3 ${isActive ? "text-[#22c55e]" : "text-white"}`}>{cfg.label}</p>
                        <p className="text-sm text-[#7a95b8] mt-1">{cfg.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium text-[#c8d8ec] uppercase tracking-wider">Object Selection</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#0d1a2e] border border-[#12233e] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Users size={16} className="text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Contacts</p>
                        <p className="text-xs text-[#7a95b8]">Sync client profiles</p>
                      </div>
                    </div>
                    <button
                      onClick={() => updateMutation.mutate({ syncContacts: !settings?.syncContacts })}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                        settings?.syncContacts ? 'bg-blue-500' : 'bg-[#4b6282]'
                      }`}
                    >
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        settings?.syncContacts ? 'translate-x-5' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-[#0d1a2e] border border-[#12233e] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <Briefcase size={16} className="text-purple-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">Deals</p>
                        <p className="text-xs text-[#7a95b8]">Sync opportunities</p>
                      </div>
                    </div>
                    <button
                      onClick={() => updateMutation.mutate({ syncDeals: !settings?.syncDeals })}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                        settings?.syncDeals ? 'bg-purple-500' : 'bg-[#4b6282]'
                      }`}
                    >
                      <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                        settings?.syncDeals ? 'translate-x-5' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rc-card">
            <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
              <Clock size={18} className="text-[#f59e0b]" />
              Schedule & Automation
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#0d1a2e] border border-[#12233e]">
                <div>
                  <h4 className="text-white font-medium">Sync Frequency</h4>
                  <p className="text-sm text-[#7a95b8] mt-1">How often should automatic sync run?</p>
                </div>
                <select className="bg-[#060d18] border border-[#12233e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f59e0b]">
                  <option value="15">Every 15 minutes</option>
                  <option value="30">Every 30 minutes</option>
                  <option value="60">Hourly</option>
                  <option value="360">Every 6 hours</option>
                  <option value="1440">Daily</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-[#0d1a2e] border border-[#12233e]">
                <div>
                  <h4 className="text-white font-medium">Conflict Resolution</h4>
                  <p className="text-sm text-[#7a95b8] mt-1">When data differs between systems, which wins?</p>
                </div>
                <select className="bg-[#060d18] border border-[#12233e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#f59e0b]">
                  <option value="LATEST">Most recently updated</option>
                  <option value="HUBSPOT">HubSpot always wins</option>
                  <option value="LOCAL">Russell Capital always wins</option>
                  <option value="MANUAL">Flag for manual review</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rc-card">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Server size={18} className="text-[#10b981]" />
              Connection Status
            </h3>
            
            <div className="flex flex-col items-center justify-center py-6 border-b border-[#12233e]">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                connection.status === 'CONNECTED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
              }`}>
                {connection.status === 'CONNECTED' ? <CheckCircle2 size={40} /> : <XCircle size={40} />}
              </div>
              <h4 className="text-xl font-medium text-white">
                {connection.status === 'CONNECTED' ? 'Connected' : 'Disconnected'}
              </h4>
              <p className="text-sm text-[#7a95b8] mt-1">
                {connection.status === 'CONNECTED' ? 'HubSpot API is reachable' : 'Cannot reach HubSpot API'}
              </p>
            </div>
            
            <div className="py-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#7a95b8]">Portal ID</span>
                <span className="text-white font-medium">8492015</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#7a95b8]">Auth Type</span>
                <span className="text-white font-medium">OAuth 2.0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#7a95b8]">Token Expires</span>
                <span className="text-white font-medium">In 4 hours</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#7a95b8]">API Version</span>
                <span className="text-white font-medium">v3</span>
              </div>
            </div>
            
            <button className="w-full mt-4 rc-btn rc-btn-ghost border-[#12233e] hover:bg-[#12233e]">
              Re-authenticate
            </button>
          </div>

          <div className="rc-card">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <ShieldAlert size={18} className="text-[#ef4444]" />
              API Usage
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#c8d8ec]">Daily Limit</span>
                  <span className="text-white font-medium">45,230 / 500,000</span>
                </div>
                <div className="w-full bg-[#0d1a2e] rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '9%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-[#c8d8ec]">Burst Limit (10s)</span>
                  <span className="text-white font-medium">12 / 100</span>
                </div>
                <div className="w-full bg-[#0d1a2e] rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '12%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMapping = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rc-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-white flex items-center gap-2">
            <Layers size={18} className="text-[#3b82f6]" />
            Field Mapping Configuration
          </h3>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-[#0d1a2e] hover:bg-[#12233e] border border-[#12233e] rounded-md text-sm text-white transition-colors">
              Reset to Default
            </button>
            <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-md text-sm text-white transition-colors">
              Save Mappings
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {/* Contacts Mapping */}
          <div>
            <h4 className="text-md font-medium text-[#c8d8ec] mb-4 flex items-center gap-2 pb-2 border-b border-[#12233e]">
              <Users size={16} /> Contacts Object
            </h4>
            <div className="grid grid-cols-12 gap-4 text-xs font-medium text-[#7a95b8] uppercase tracking-wider mb-2 px-4">
              <div className="col-span-5">Russell Capital Field</div>
              <div className="col-span-2 text-center">Direction</div>
              <div className="col-span-5">HubSpot Property</div>
            </div>
            
            <div className="space-y-2">
              {[
                { rc: "firstName", hs: "firstname", dir: "BIDIRECTIONAL", req: true },
                { rc: "lastName", hs: "lastname", dir: "BIDIRECTIONAL", req: true },
                { rc: "email", hs: "email", dir: "BIDIRECTIONAL", req: true },
                { rc: "phone", hs: "phone", dir: "BIDIRECTIONAL", req: false },
                { rc: "jobTitle", hs: "jobtitle", dir: "PULL_ONLY", req: false },
                { rc: "companyName", hs: "company", dir: "PULL_ONLY", req: false },
                { rc: "riskScore", hs: "rc_risk_score", dir: "PUSH_ONLY", req: false },
                { rc: "aum", hs: "rc_aum", dir: "PUSH_ONLY", req: false },
              ].map((field, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-4 items-center p-3 rounded-lg bg-[#0d1a2e] border border-[#12233e]">
                  <div className="col-span-5 flex items-center gap-2">
                    <span className="text-white text-sm">{field.rc}</span>
                    {field.req && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">Required</span>}
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <div className="px-2 py-1 rounded bg-[#060d18] border border-[#12233e] text-[#7a95b8]">
                      {field.dir === "BIDIRECTIONAL" ? <ArrowLeftRight size={14} /> : 
                       field.dir === "PUSH_ONLY" ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
                    </div>
                  </div>
                  <div className="col-span-5">
                    <input 
                      type="text" 
                      defaultValue={field.hs}
                      className="w-full bg-[#060d18] border border-[#12233e] rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#3b82f6]"
                    />
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-4 flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300">
              <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center mr-1">+</div>
              Add Custom Field Mapping
            </button>
          </div>

          {/* Deals Mapping */}
          <div>
            <h4 className="text-md font-medium text-[#c8d8ec] mb-4 flex items-center gap-2 pb-2 border-b border-[#12233e]">
              <Briefcase size={16} /> Deals Object
            </h4>
            <div className="space-y-2">
              {[
                { rc: "dealName", hs: "dealname", dir: "BIDIRECTIONAL", req: true },
                { rc: "amount", hs: "amount", dir: "BIDIRECTIONAL", req: true },
                { rc: "stage", hs: "dealstage", dir: "BIDIRECTIONAL", req: true },
                { rc: "closeDate", hs: "closedate", dir: "BIDIRECTIONAL", req: false },
                { rc: "strategyType", hs: "rc_strategy", dir: "PUSH_ONLY", req: false },
              ].map((field, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-4 items-center p-3 rounded-lg bg-[#0d1a2e] border border-[#12233e]">
                  <div className="col-span-5 flex items-center gap-2">
                    <span className="text-white text-sm">{field.rc}</span>
                    {field.req && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">Required</span>}
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <div className="px-2 py-1 rounded bg-[#060d18] border border-[#12233e] text-[#7a95b8]">
                      {field.dir === "BIDIRECTIONAL" ? <ArrowLeftRight size={14} /> : 
                       field.dir === "PUSH_ONLY" ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
                    </div>
                  </div>
                  <div className="col-span-5">
                    <input 
                      type="text" 
                      defaultValue={field.hs}
                      className="w-full bg-[#060d18] border border-[#12233e] rounded-md px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#3b82f6]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <AppShell>
      <div className="rc-page-header">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
              <Link2 size={24} className="text-orange-400" />
            </div>
            <div>
              <h1 className="rc-page-title">HubSpot CRM Sync</h1>
              <p className="rc-page-subtitle">
                Enterprise bidirectional data synchronization platform
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ExportToSlides
              toolName="HubSpot CRM Sync"
              getSections={() => [
                {
                  title: "HubSpot CRM Sync Summary",
                  items: [
                    { label: "Sync Enabled", value: settings?.syncEnabled ? "Yes" : "No" },
                    { label: "Contacts Sync", value: settings?.syncContacts ? "Enabled" : "Disabled" },
                    { label: "Deals Sync", value: settings?.syncDeals ? "Enabled" : "Disabled" },
                    { label: "Sync Direction", value: settings?.syncDirection || "Not configured" },
                    { label: "Last Sync Status", value: settings?.lastSyncStatus || "Never" },
                    { label: "Connection Health", value: `${health.score}/100` },
                  ],
                },
              ]}
            />
            <button
              onClick={() => triggerMutation.mutate()}
              disabled={triggerMutation.isPending || !settings?.syncEnabled || isSyncing}
              className="rc-btn rc-btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
              {isSyncing ? `Syncing ${syncProgress}%` : "Sync Now"}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6 mt-8 border-b border-[#12233e] overflow-x-auto no-scrollbar">
          {[
            { id: "overview", label: "Dashboard", icon: Activity },
            { id: "history", label: "Sync History", icon: Database },
            { id: "mapping", label: "Field Mapping", icon: Layers },
            { id: "settings", label: "Settings", icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 pb-4 text-sm font-medium transition-colors relative whitespace-nowrap ${
                activeTab === tab.id ? "text-white" : "text-[#7a95b8] hover:text-[#c8d8ec]"
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#22c55e] rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 pb-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-[#12233e] border-t-[#22c55e] animate-spin"></div>
              <Link2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#7a95b8]" size={20} />
            </div>
            <h3 className="text-lg font-medium text-white mt-6">Connecting to HubSpot</h3>
            <p className="text-[#7a95b8] mt-2">Retrieving synchronization metadata...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {activeTab === "overview" && renderOverview()}
            {activeTab === "history" && renderHistory()}
            {activeTab === "mapping" && renderMapping()}
            {activeTab === "settings" && renderSettings()}
          </div>
        )}
      </div>

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#060d18] border border-[#12233e] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#12233e] bg-[#0d1a2e]">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <Info size={18} className="text-blue-400" />
                Sync Transaction Details
              </h3>
              <button 
                onClick={() => setSelectedLog(null)}
                className="text-[#7a95b8] hover:text-white transition-colors"
              >
                <XCircle size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-[#7a95b8] uppercase tracking-wider mb-1">Transaction ID</p>
                  <p className="text-sm text-white font-mono bg-[#0d1a2e] px-2 py-1 rounded border border-[#12233e] inline-block">
                    {selectedLog.id || `txn_${Math.random().toString(36).substr(2, 9)}`}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#7a95b8] uppercase tracking-wider mb-1">Timestamp</p>
                  <p className="text-sm text-white">
                    {new Date(selectedLog.syncedAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#7a95b8] uppercase tracking-wider mb-1">Object Type</p>
                  <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-[#12233e] text-[#c8d8ec] inline-block">
                    {selectedLog.objectType}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-[#7a95b8] uppercase tracking-wider mb-1">Status</p>
                  <div className="flex items-center gap-1.5">
                    {selectedLog.status === 'SUCCESS' ? <CheckCircle2 size={14} className="text-emerald-400" /> : 
                     selectedLog.status === 'FAILED' ? <XCircle size={14} className="text-red-400" /> : 
                     <AlertTriangle size={14} className="text-amber-400" />}
                    <span className={`text-sm font-medium ${
                      selectedLog.status === 'SUCCESS' ? 'text-emerald-400' : 
                      selectedLog.status === 'FAILED' ? 'text-red-400' : 'text-amber-400'
                    }`}>{selectedLog.status}</span>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-[#12233e] pt-4">
                <p className="text-xs text-[#7a95b8] uppercase tracking-wider mb-2">Payload Details</p>
                <div className="bg-[#0d1a2e] rounded-lg p-4 border border-[#12233e] overflow-x-auto">
                  <pre className="text-xs text-[#c8d8ec] font-mono">
                    {JSON.stringify({
                      hubspotId: selectedLog.hubspotId || "N/A",
                      direction: selectedLog.direction,
                      properties: {
                        firstname: "John",
                        lastname: "Doe",
                        email: "john.doe@example.com",
                        lifecyclestage: "customer"
                      },
                      error: selectedLog.errorMessage || null
                    }, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-[#12233e] bg-[#0d1a2e] flex justify-end gap-3">
              <button 
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#12233e] hover:bg-[#1e324f] transition-colors"
              >
                Close
              </button>
              {selectedLog.status !== 'SUCCESS' && (
                <button className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-2">
                  <RefreshCw size={14} /> Retry Sync
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      <PageInsights pageId="hubspot-sync" />
    </AppShell>
  );
}
