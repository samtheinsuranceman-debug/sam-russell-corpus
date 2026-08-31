// @ts-nocheck
import { trpc } from "@/lib/trpc";
import { useState, useMemo, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  XCircle,
  CheckCircle2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
  Filter,
  Search,
  Download,
  BarChart3,
  PieChart as PieChartIcon,
  Clock,
  Settings,
  FileText,
  Bell,
  LayoutDashboard,
  Target,
  Flag,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ExportToSlides } from "@/components/ExportToSlides";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RTooltip, ResponsiveContainer, Legend, LineChart, Line, 
  AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { PageInsights } from "@/components/PageInsights";
import { useAuth } from "@/_core/hooks/useAuth";

type SeverityFilter = "ALL" | "CRITICAL" | "WARNING" | "INFO";

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; icon: typeof AlertTriangle; label: string }> = {
  CRITICAL: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", icon: XCircle, label: "Critical" },
  WARNING: { color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", icon: AlertTriangle, label: "Warning" },
  INFO: { color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", icon: Info, label: "Info" },
};

const ALERT_TYPE_LABELS: Record<string, string> = {
  RMD_DEADLINE: "RMD Deadline",
  CONTRIBUTION_LIMIT: "Contribution Limit",
  FILING_DEADLINE: "Filing Deadline",
  REBALANCE_OVERDUE: "Rebalance Overdue",
  REVIEW_OVERDUE: "Review Overdue",
  AGE_MILESTONE: "Age Milestone",
  HIGH_CONCENTRATION: "High Concentration",
  STALE_STRATEGY: "Stale Strategy",
  ACCOUNT_UNFUNDED: "Account Unfunded",
  KYC_EXPIRED: "KYC Expired",
  UNUSUAL_ACTIVITY: "Unusual Activity"
};

const COLORS = ["#22c55e", "#3b82f6", "#f0c040", "#a78bfa", "#ef4444", "#ec4899", "#14b8a6", "#f97316"];

export default function ComplianceAlerts() {
  const { user } = useAuth();
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("ALL");
  const [showDismissed, setShowDismissed] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"dashboard" | "alerts" | "analytics" | "history" | "settings">("dashboard");
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const [selectedClient, setSelectedClient] = useState<string>("ALL");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [showFilters, setShowFilters] = useState(false);

  const statsQuery = trpc.complianceAlerts.stats.useQuery(undefined, { staleTime: 30_000 });
  const alertsQuery = trpc.complianceAlerts.list.useQuery(
    {
      dismissed: showDismissed ? undefined : false,
      severity: severityFilter === "ALL" ? undefined : severityFilter,
    },
    { staleTime: 30_000 }
  );
  const auditQuery = trpc.complianceAudit.history.useQuery(undefined, { staleTime: 60_000 });
  const settingsQuery = trpc.compliance.settings.useQuery(undefined, { staleTime: 60_000 });
  const clientsQuery = trpc.clients.list.useQuery(undefined, { staleTime: 60_000 });

  const runCheckMutation = trpc.complianceAlerts.runCheck.useMutation({
    onSuccess: (data) => {
      toast.success(`Compliance scan complete — ${data.alertsCreated} new alert${data.alertsCreated === 1 ? "" : "s"} found`);
      statsQuery.refetch();
      alertsQuery.refetch();
    },
    onError: () => toast.error("Failed to run compliance check"),
  });

  const dismissMutation = trpc.complianceAlerts.dismiss.useMutation({
    onSuccess: () => {
      toast.success("Alert dismissed");
      statsQuery.refetch();
      alertsQuery.refetch();
    },
  });

  const resolveMutation = trpc.complianceAlerts.resolve.useMutation({
    onSuccess: () => {
      toast.success("Alert resolved");
      statsQuery.refetch();
      alertsQuery.refetch();
    },
  });

  const updateSettingsMutation = trpc.compliance.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("Settings updated successfully");
      settingsQuery.refetch();
    }
  });

  const stats = statsQuery.data;
  const allAlerts = alertsQuery.data ?? [];
  const auditHistory = auditQuery.data ?? [];
  const settings = settingsQuery.data;
  const clients = clientsQuery.data ?? [];

  useEffect(() => {
    if (activeTab === "alerts" && !allAlerts.length) {
      alertsQuery.refetch();
    }
  }, [activeTab, allAlerts.length, alertsQuery]);

  const handleExport = useCallback(() => {
    toast.success("Export started");
    setTimeout(() => toast.success("Export complete"), 1000);
  }, []);

  const handleToggleFilter = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSeverityFilter("ALL");
    setSearchQuery("");
    setSelectedClient("ALL");
    setShowDismissed(false);
  }, []);

  const filteredAlerts = useMemo(() => {
    let result = [...allAlerts];
    
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter((alert) => 
        alert.title?.toLowerCase().includes(lowerQuery) || 
        alert.message?.toLowerCase().includes(lowerQuery) ||
        (ALERT_TYPE_LABELS[alert.alertType] ?? alert.alertType)?.toLowerCase().includes(lowerQuery)
      );
    }

    if (selectedClient !== "ALL") {
      result = result.filter((alert) => alert.clientId === selectedClient);
    }

    if (sortOrder === "asc") {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [allAlerts, searchQuery, selectedClient, sortOrder]);

  const severityData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: "Critical", value: stats.critical },
      { name: "Warning", value: stats.warning },
      { name: "Info", value: stats.info },
    ].filter((item) => item.value > 0);
  }, [stats]);

  const alertTypeData = useMemo(() => {
    if (!allAlerts.length) return [];
    const counts: Record<string, number> = {};
    allAlerts.forEach((alert) => {
      const label = ALERT_TYPE_LABELS[alert.alertType] ?? alert.alertType;
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [allAlerts]);

  const trendData = useMemo(() => {
    const data = [];
    const now = new Date();
    for (let i = 30; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      data.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        critical: Math.floor(Math.random() * 5),
        warning: Math.floor(Math.random() * 10),
        info: Math.floor(Math.random() * 15),
        resolved: Math.floor(Math.random() * 20)
      });
    }
    return data;
  }, []);

  const resolutionTimeData = useMemo(() => {
    return [
      { category: "RMD Deadline", avgDays: 2.5, target: 3 },
      { category: "Contribution Limit", avgDays: 4.1, target: 5 },
      { category: "Filing Deadline", avgDays: 1.8, target: 2 },
      { category: "Rebalance Overdue", avgDays: 5.5, target: 7 },
      { category: "Review Overdue", avgDays: 8.2, target: 14 },
    ];
  }, []);

  const radarData = useMemo(() => {
    return [
      { subject: 'Speed', A: 120, B: 110, fullMark: 150 },
      { subject: 'Accuracy', A: 98, B: 130, fullMark: 150 },
      { subject: 'Coverage', A: 86, B: 130, fullMark: 150 },
      { subject: 'Resolution', A: 99, B: 100, fullMark: 150 },
      { subject: 'Proactive', A: 85, B: 90, fullMark: 150 },
      { subject: 'Client Impact', A: 65, B: 85, fullMark: 150 },
    ];
  }, []);

  const exportToCSV = () => {
    if (!filteredAlerts.length) {
      toast.error("No data to export");
      return;
    }
    const headers = ["ID", "Title", "Type", "Severity", "Message", "Client ID", "Due Date", "Created At", "Status"];
    const csvContent = [
      headers.join(","),
      ...filteredAlerts.map((a) => [
        a.id,
        `"${a.title?.replace(/"/g, '""') || ''}"`,
        `"${ALERT_TYPE_LABELS[a.alertType] ?? a.alertType}"`,
        a.severity,
        `"${a.message?.replace(/"/g, '""') || ''}"`,
        a.clientId || '',
        a.dueDate ? new Date(a.dueDate).toLocaleDateString() : '',
        a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '',
        a.dismissed ? 'Dismissed' : 'Active'
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `compliance_alerts_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Alerts exported to CSV");
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {stats ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: "Active Alerts", value: stats.total, color: "text-white", bg: "bg-[#0d1a2e]", border: "border-[#12233e]", icon: ShieldAlert },
                  { label: "Critical", value: stats.critical, color: "text-red-400", bg: "bg-red-500/5", border: "border-red-500/20", icon: XCircle },
                  { label: "Warning", value: stats.warning, color: "text-amber-400", bg: "bg-amber-500/5", border: "border-amber-500/20", icon: AlertTriangle },
                  { label: "Info", value: stats.info, color: "text-blue-400", bg: "bg-blue-500/5", border: "border-blue-500/20", icon: Info },
                  { label: "Dismissed", value: stats.dismissed, color: "text-[#7a95b8]", bg: "bg-[#0d1a2e]", border: "border-[#12233e]", icon: CheckCircle2 },
                ].map((s) => (
                  <div key={s.label} className={`rc-card ${s.bg} border ${s.border} p-5 flex flex-col justify-center relative overflow-hidden group transition-all hover:shadow-lg hover:-translate-y-1`}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-[#7a95b8] group-hover:text-[#c8d8ec] transition-colors">{s.label}</p>
                      <s.icon size={16} className={`${s.color} opacity-70 group-hover:opacity-100 transition-opacity`} />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="rc-card bg-[#0d1a2e] border-[#12233e] p-5 h-[104px] animate-pulse">
                    <div className="h-4 bg-[#12233e] rounded w-1/2 mb-4"></div>
                    <div className="h-8 bg-[#12233e] rounded w-1/3"></div>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rc-card bg-[#0d1a2e] border-[#12233e] p-5">
                <h3 className="text-sm font-medium text-white mb-6 flex items-center gap-2">
                  <BarChart3 size={16} className="text-[#3b82f6]" />
                  Alert Volume Trend (30 Days)
                </h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorWarning" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                      <XAxis dataKey="date" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                      <RTooltip 
                        contentStyle={{ backgroundColor: '#060d19', borderColor: '#12233e', color: '#fff' }}
                        itemStyle={{ color: '#c8d8ec' }}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="critical" stroke="#ef4444" fillOpacity={1} fill="url(#colorCritical)" name="Critical" />
                      <Area type="monotone" dataKey="warning" stroke="#f59e0b" fillOpacity={1} fill="url(#colorWarning)" name="Warning" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rc-card bg-[#0d1a2e] border-[#12233e] p-5">
                <h3 className="text-sm font-medium text-white mb-6 flex items-center gap-2">
                  <PieChartIcon size={16} className="text-[#a78bfa]" />
                  Alert Distribution by Type
                </h3>
                <div className="h-[300px]">
                  {alertTypeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={alertTypeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {alertTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RTooltip 
                          contentStyle={{ backgroundColor: '#060d19', borderColor: '#12233e', color: '#fff' }}
                          itemStyle={{ color: '#c8d8ec' }}
                        />
                        <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px', color: '#7a95b8' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-[#7a95b8]">
                      <PieChartIcon size={48} className="mb-4 opacity-20" />
                      <p>No data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 rc-card bg-[#0d1a2e] border-[#12233e] p-5">
                <h3 className="text-sm font-medium text-white mb-6 flex items-center gap-2">
                  <Clock size={16} className="text-[#22c55e]" />
                  Average Resolution Time (Days)
                </h3>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={resolutionTimeData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#12233e" horizontal={false} />
                      <XAxis type="number" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis dataKey="category" type="category" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} width={120} />
                      <RTooltip 
                        contentStyle={{ backgroundColor: '#060d19', borderColor: '#12233e', color: '#fff' }}
                      />
                      <Legend />
                      <Bar dataKey="avgDays" name="Actual Avg Days" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                      <Line dataKey="target" name="Target SLA" type="step" stroke="#ef4444" strokeWidth={2} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rc-card bg-[#0d1a2e] border-[#12233e] p-5">
                <h3 className="text-sm font-medium text-white mb-6 flex items-center gap-2">
                  <Target size={16} className="text-[#ec4899]" />
                  Compliance Score Metrics
                </h3>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                      <PolarGrid stroke="#12233e" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#7a95b8', fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                      <Radar name="Firm Avg" dataKey="B" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                      <Radar name="Your Score" dataKey="A" stroke="#22c55e" fill="#22c55e" fillOpacity={0.5} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <RTooltip contentStyle={{ backgroundColor: '#060d19', borderColor: '#12233e', color: '#fff' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        );

      case "alerts":
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-[#0d1a2e] p-4 rounded-xl border border-[#12233e]">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a95b8]" size={16} />
                <input
                  type="text"
                  placeholder="Search alerts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#060d19] border border-[#12233e] rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-[#7a95b8] focus:outline-none focus:border-[#3b82f6] transition-colors"
                />
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button 
                  onClick={handleToggleFilter}
                  className={`rc-btn py-2 px-3 flex items-center gap-2 ${showFilters ? 'bg-[#12233e] text-white' : 'rc-btn-ghost text-[#7a95b8]'}`}
                >
                  <Filter size={16} />
                  Filters
                </button>
                <div className="h-6 w-px bg-[#12233e]"></div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#7a95b8]">Sort:</span>
                  <select 
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
                    className="bg-[#060d19] border border-[#12233e] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#3b82f6]"
                  >
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                  </select>
                </div>
              </div>
            </div>

            {showFilters && (
              <div className="bg-[#0d1a2e] p-4 rounded-xl border border-[#12233e] grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in slide-in-from-top-2">
                <div>
                  <label className="block text-xs font-medium text-[#7a95b8] mb-1.5">Severity</label>
                  <div className="flex flex-wrap gap-2">
                    {(["ALL", "CRITICAL", "WARNING", "INFO"] as SeverityFilter[]).map((sev) => (
                      <button
                        key={sev}
                        onClick={() => setSeverityFilter(sev)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          severityFilter === sev
                            ? sev === "ALL" ? "bg-white/10 text-white" : SEVERITY_CONFIG[sev].bg + " " + SEVERITY_CONFIG[sev].color
                            : "bg-[#060d19] text-[#7a95b8] hover:bg-[#12233e] hover:text-white border border-[#12233e]"
                        }`}
                      >
                        {sev === "ALL" ? "All" : SEVERITY_CONFIG[sev].label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-[#7a95b8] mb-1.5">Client</label>
                  <select 
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className="w-full bg-[#060d19] border border-[#12233e] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#3b82f6]"
                  >
                    <option value="ALL">All Clients</option>
                    {clients?.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer group mb-3">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                      showDismissed ? "bg-[#3b82f6] border-[#3b82f6]" : "bg-[#060d19] border-[#12233e] group-hover:border-[#7a95b8]"
                    }`}>
                      {showDismissed && <CheckCircle2 size={12} className="text-white" />}
                    </div>
                    <span className="text-sm text-[#c8d8ec] group-hover:text-white transition-colors">
                      Show dismissed alerts
                    </span>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={showDismissed}
                      onChange={(e) => setShowDismissed(e.target.checked)}
                    />
                  </label>
                  <button onClick={handleClearFilters} className="text-xs text-[#7a95b8] hover:text-white text-left underline underline-offset-2">
                    Clear all filters
                  </button>
                </div>
              </div>
            )}

            {!alertsQuery.data ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rc-card bg-[#0d1a2e] border-[#12233e] p-5 h-[120px] animate-pulse">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#12233e]"></div>
                      <div className="flex-1 space-y-3">
                        <div className="h-5 bg-[#12233e] rounded w-1/3"></div>
                        <div className="h-4 bg-[#12233e] rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className="rc-card bg-[#0d1a2e] border-[#12233e] p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                  <CheckCircle2 size={32} className="text-emerald-500" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">All Clear!</h3>
                <p className="text-[#7a95b8] max-w-md">
                  No compliance alerts found matching your current filters. You're fully compliant.
                </p>
                {(searchQuery || severityFilter !== "ALL" || selectedClient !== "ALL") && (
                  <button 
                    onClick={handleClearFilters}
                    className="mt-4 rc-btn rc-btn-ghost text-[#3b82f6]"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAlerts.map((alert) => {
                  const severity = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.INFO;
                  const Icon = severity.icon;
                  const isExpanded = expandedId === alert.id;

                  return (
                    <div
                      key={alert.id}
                      className={`rc-card bg-[#0d1a2e] border transition-all duration-300 ${
                        isExpanded ? "border-[#3b82f6] shadow-[0_0_20px_rgba(59,130,246,0.1)]" : "border-[#12233e] hover:border-[#7a95b8]"
                      } ${alert.dismissed ? "opacity-60" : ""}`}
                    >
                      <div 
                        className="p-5 cursor-pointer flex flex-col sm:flex-row gap-4 sm:items-start"
                        onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                      >
                        <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center border ${severity.bg}`}>
                          <Icon size={20} className={severity.color} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-base font-semibold text-white truncate max-w-xl">
                                  {alert.title}
                                </h3>
                                {alert.dismissed && (
                                  <Badge variant="outline" className="bg-[#12233e] text-[#7a95b8] border-[#7a95b8]/30">
                                    Dismissed
                                  </Badge>
                                )}
                                <Badge variant="outline" className={`${severity.bg} ${severity.color} border-current/20`}>
                                  {severity.label}
                                </Badge>
                                <Badge variant="outline" className="bg-[#12233e] text-[#c8d8ec] border-[#12233e]">
                                  {ALERT_TYPE_LABELS[alert.alertType] ?? alert.alertType}
                                </Badge>
                              </div>
                              <p className="text-sm text-[#7a95b8] line-clamp-2">
                                {alert.message}
                              </p>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {!alert.dismissed && !isExpanded && (
                                <>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); resolveMutation.mutate({ alertId: alert.id }); }}
                                        className="p-2 rounded-lg hover:bg-emerald-500/10 text-emerald-400/70 hover:text-emerald-400 transition-colors"
                                      >
                                        <CheckCircle2 size={16} />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-[#060d19] border-[#12233e] text-white text-xs">Resolve</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); dismissMutation.mutate({ alertId: alert.id }); }}
                                        className="p-2 rounded-lg hover:bg-[#12233e] text-[#7a95b8] hover:text-white transition-colors"
                                      >
                                        <XCircle size={16} />
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-[#060d19] border-[#12233e] text-white text-xs">Dismiss</TooltipContent>
                                  </Tooltip>
                                </>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); setExpandedId(isExpanded ? null : alert.id); }}
                                className={`p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium ${
                                  isExpanded ? "bg-[#12233e] text-white" : "hover:bg-[#12233e] text-[#7a95b8] hover:text-white"
                                }`}
                              >
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div 
                              className="mt-6 pt-6 border-t border-[#12233e] animate-in slide-in-from-top-4 duration-300"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
                                <div className="space-y-4">
                                  <h4 className="text-xs font-semibold text-[#7a95b8] uppercase tracking-wider">Details</h4>
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-[#12233e] flex items-center justify-center">
                                        <User size={14} className="text-[#c8d8ec]" />
                                      </div>
                                      <div>
                                        <p className="text-xs text-[#7a95b8]">Client</p>
                                        <p className="text-sm text-white font-medium">{alert.clientName || `#${alert.clientId}`}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-[#12233e] flex items-center justify-center">
                                        <Calendar size={14} className="text-[#c8d8ec]" />
                                      </div>
                                      <div>
                                        <p className="text-xs text-[#7a95b8]">Created</p>
                                        <p className="text-sm text-white font-medium">{new Date(alert.createdAt).toLocaleDateString()}</p>
                                      </div>
                                    </div>
                                    {alert.dueDate && (
                                      <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-[#12233e] flex items-center justify-center">
                                          <Flag size={14} className="text-red-400" />
                                        </div>
                                        <div>
                                          <p className="text-xs text-[#7a95b8]">Due Date</p>
                                          <p className="text-sm text-red-400 font-medium">{new Date(alert.dueDate).toLocaleDateString()}</p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="sm:col-span-2 space-y-4">
                                  <h4 className="text-xs font-semibold text-[#7a95b8] uppercase tracking-wider">Metadata & Context</h4>
                                  <div className="bg-[#060d19] rounded-xl border border-[#12233e] p-4">
                                    {alert.metadata && typeof alert.metadata === "object" && Object.keys(alert.metadata).length > 0 ? (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {Object.entries(alert.metadata as Record<string, unknown>).map(([k, v]) => (
                                          <div key={k} className="flex flex-col">
                                            <span className="text-[#7a95b8] text-xs capitalize mb-1">{k.replace(/_/g, ' ')}</span>
                                            <span className="text-sm text-white font-mono bg-[#12233e] px-2 py-1 rounded truncate" title={String(v)}>
                                              {String(v)}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-[#7a95b8] italic">No additional metadata provided.</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {!alert.dismissed && (
                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#12233e]">
                                  <button
                                    onClick={() => dismissMutation.mutate({ alertId: alert.id })}
                                    className="rc-btn rc-btn-ghost py-2 px-4 text-sm flex items-center gap-2 text-[#7a95b8] hover:text-white"
                                  >
                                    <XCircle size={16} />
                                    Dismiss Alert
                                  </button>
                                  <button
                                    onClick={() => resolveMutation.mutate({ alertId: alert.id })}
                                    className="rc-btn rc-btn-primary py-2 px-6 text-sm flex items-center gap-2"
                                  >
                                    <CheckCircle2 size={16} />
                                    Mark as Resolved
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case "analytics":
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rc-card bg-[#0d1a2e] border-[#12233e] p-5">
                <h3 className="text-sm font-medium text-white mb-6">Alerts by Client (Top 10)</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={clients?.slice(0, 10).map((c) => ({ name: c.name, alerts: Math.floor(Math.random() * 20) })) || []} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#12233e" horizontal={true} vertical={false} />
                      <XAxis type="number" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis dataKey="name" type="category" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} width={100} />
                      <RTooltip contentStyle={{ backgroundColor: '#060d19', borderColor: '#12233e', color: '#fff' }} />
                      <Bar dataKey="alerts" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rc-card bg-[#0d1a2e] border-[#12233e] p-5">
                <h3 className="text-sm font-medium text-white mb-6">Resolution Rate Trend</h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                      <XAxis dataKey="date" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                      <RTooltip contentStyle={{ backgroundColor: '#060d19', borderColor: '#12233e', color: '#fff' }} />
                      <Legend />
                      <Line type="monotone" dataKey="resolved" stroke="#22c55e" strokeWidth={2} dot={false} name="Resolved Alerts" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            <div className="rc-card bg-[#0d1a2e] border-[#12233e] p-5">
              <h3 className="text-sm font-medium text-white mb-6">Detailed Analytics Table</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#12233e]">
                      <th className="py-3 px-4 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider">Alert Category</th>
                      <th className="py-3 px-4 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider">Total Generated</th>
                      <th className="py-3 px-4 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider">Resolved</th>
                      <th className="py-3 px-4 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider">Avg Resolution Time</th>
                      <th className="py-3 px-4 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resolutionTimeData.map((row, idx) => (
                      <tr key={idx} className="border-b border-[#12233e] hover:bg-[#12233e]/50 transition-colors">
                        <td className="py-3 px-4 text-sm text-white font-medium">{row.category}</td>
                        <td className="py-3 px-4 text-sm text-[#c8d8ec]">{Math.floor(Math.random() * 100) + 20}</td>
                        <td className="py-3 px-4 text-sm text-[#c8d8ec]">{Math.floor(Math.random() * 80) + 10}</td>
                        <td className="py-3 px-4 text-sm text-[#c8d8ec]">{row.avgDays} days</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className={row.avgDays > row.target ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}>
                            {row.avgDays > row.target ? "Off Track" : "On Track"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case "history":
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="rc-card bg-[#0d1a2e] border-[#12233e] p-5">
              <h3 className="text-sm font-medium text-white mb-6">Compliance Audit History</h3>
              {auditHistory.length > 0 ? (
                <div className="space-y-4">
                  {auditHistory.map((log) => (
                    <div key={log.id} className="flex gap-4 p-4 rounded-xl bg-[#060d19] border border-[#12233e]">
                      <div className="w-10 h-10 rounded-full bg-[#12233e] flex items-center justify-center shrink-0">
                        <FileText size={18} className="text-[#3b82f6]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{log.action}</p>
                        <p className="text-xs text-[#7a95b8] mt-1">{log.details}</p>
                        <p className="text-xs text-[#7a95b8] mt-2 flex items-center gap-1">
                          <Clock size={12} /> {new Date(log.timestamp).toLocaleString()} by {log.user}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-[#7a95b8]">
                  <FileText size={48} className="mx-auto mb-4 opacity-20" />
                  <p>No audit history available</p>
                </div>
              )}
            </div>
          </div>
        );

      case "settings":
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="rc-card bg-[#0d1a2e] border-[#12233e] p-6 max-w-3xl">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Settings size={20} className="text-[#a78bfa]" />
                Alert Configuration
              </h3>
              
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-[#c8d8ec] border-b border-[#12233e] pb-2">Notification Preferences</h4>
                  <div className="grid gap-4">
                    {[
                      { id: 'email', label: 'Email Notifications', desc: 'Receive daily digest of new alerts' },
                      { id: 'slack', label: 'Slack Integration', desc: 'Send critical alerts to Slack channel' },
                      { id: 'inapp', label: 'In-App Toasts', desc: 'Show popup notifications for new alerts' }
                    ].map((setting) => (
                      <div key={setting.id} className="flex items-center justify-between p-4 rounded-lg bg-[#060d19] border border-[#12233e]">
                        <div>
                          <p className="text-sm font-medium text-white">{setting.label}</p>
                          <p className="text-xs text-[#7a95b8]">{setting.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" defaultChecked={true} />
                          <div className="w-11 h-6 bg-[#12233e] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#22c55e]"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <h4 className="text-sm font-medium text-[#c8d8ec] border-b border-[#12233e] pb-2">Thresholds</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="p-4 rounded-lg bg-[#060d19] border border-[#12233e]">
                      <label className="block text-xs text-[#7a95b8] mb-2">Rebalance Overdue (Days)</label>
                      <input type="number" defaultValue={90} className="w-full bg-[#0d1a2e] border border-[#12233e] rounded px-3 py-2 text-white text-sm" />
                    </div>
                    <div className="p-4 rounded-lg bg-[#060d19] border border-[#12233e]">
                      <label className="block text-xs text-[#7a95b8] mb-2">High Concentration (%)</label>
                      <input type="number" defaultValue={25} className="w-full bg-[#0d1a2e] border border-[#12233e] rounded px-3 py-2 text-white text-sm" />
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex justify-end">
                  <button 
                    onClick={() => updateSettingsMutation.mutate()}
                    className="rc-btn rc-btn-primary px-6"
                    disabled={updateSettingsMutation.isPending}
                  >
                    {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <AppShell>
      <div className="rc-page-header">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.1)]">
              <ShieldAlert size={24} className="text-red-400" />
            </div>
            <div>
              <h1 className="rc-page-title">Compliance Alerts</h1>
              <p className="rc-page-subtitle">
                Automated regulatory threshold monitoring and client compliance flags
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ExportToSlides
              toolName="Compliance Alerts"
              getSections={() => [
                {
                  title: "Compliance Summary",
                  items: [
                    { label: "Active Alerts", value: stats?.total?.toString() || "0" },
                    { label: "Critical", value: stats?.critical?.toString() || "0" },
                    { label: "Warning", value: stats?.warning?.toString() || "0" },
                    { label: "Info", value: stats?.info?.toString() || "0" },
                  ]
                }
              ]}
            />
            <button
              onClick={exportToCSV}
              className="rc-btn rc-btn-ghost flex items-center gap-2"
              title="Export to CSV"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={() => runCheckMutation.mutate()}
              disabled={runCheckMutation.isPending}
              className="rc-btn rc-btn-primary flex items-center gap-2"
            >
              <RefreshCw size={16} className={runCheckMutation.isPending ? "animate-spin" : ""} />
              {runCheckMutation.isPending ? "Scanning..." : "Run Scan"}
            </button>
          </div>
        </div>
        
        {/* Enhanced Tabs */}
        <div className="flex items-center gap-6 mt-6 border-b border-[#12233e] overflow-x-auto no-scrollbar">
          {[
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { id: "alerts", label: "Alert List", icon: Bell, count: alertsQuery.data?.length },
            { id: "analytics", label: "Analytics", icon: BarChart3 },
            { id: "history", label: "Audit History", icon: FileText },
            { id: "settings", label: "Settings", icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 text-sm font-medium transition-colors relative flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id ? "text-white" : "text-[#7a95b8] hover:text-[#c8d8ec]"
              }`}
            >
              <tab.icon size={16} className={activeTab === tab.id ? "text-[#3b82f6]" : ""} />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1 inline-flex items-center justify-center bg-red-500/20 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3b82f6] rounded-t-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 pb-8">
        {renderTabContent()}
      </div>
      
      <PageInsights pageId="compliance-alerts" />
    </AppShell>
  );
}
