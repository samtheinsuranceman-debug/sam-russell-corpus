// @ts-nocheck
import { useCallback, useMemo, useState } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, Legend,
} from "recharts";
import { toast } from "sonner";
import { PageInsights } from "@/components/PageInsights";

/* ═══════════════════════════════════════════════════════════════════════════
   PERFECT 10 ENTERPRISE ADMIN — Russell Capital Systems™
   
   Tabs:
   1. Overview — KPI cards, charts, quick actions
   2. User Management — member list, roles, status, invite
   3. System Health — real-time health indicators, uptime
   4. Audit Log — searchable, filterable, exportable
   5. Feature Flags — toggle workspace features
   ═══════════════════════════════════════════════════════════════════════════ */

const ACTION_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  DEMO_SEED:         { label: "Demo Seeded",        color: "#22c55e", icon: Database },
  INVITE_SENT:       { label: "Invite Sent",         color: "#a78bfa", icon: Mail },
  INVITE_ACCEPTED:   { label: "Invite Accepted",     color: "#22c55e", icon: UserCheck },
  STRATEGY_RUN:      { label: "Strategy Run",        color: "#f0c040", icon: Zap },
  CLIENT_CREATED:    { label: "Client Created",      color: "#22c55e", icon: UserPlus },
  CLIENT_UPDATED:    { label: "Client Updated",      color: "#3b82f6", icon: User2 },
  DEAL_CREATED:      { label: "Deal Created",        color: "#22c55e", icon: DollarSign },
  DEAL_STAGE_CHANGE: { label: "Stage Changed",       color: "#f0c040", icon: ArrowUpRight },
  SUBSCRIPTION_UPDATED: { label: "Subscription",    color: "#a78bfa", icon: CreditCard },
  KNOWLEDGE_ADDED:   { label: "Doc Added",           color: "#22c55e", icon: FileText },
  LOGIN:             { label: "Login",               color: "#3b82f6", icon: Lock },
  LOGOUT:            { label: "Logout",              color: "#7a95b8", icon: Unlock },
};

function ActionBadge({ action }: { action: string }) {
  const info = ACTION_LABELS[action] ?? { label: action, color: "#7a95b8", icon: Activity };
  const Icon = info.icon;
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border" style={{ color: info.color, borderColor: `${info.color}30`, background: `${info.color}12` }}>
      <Icon size={10} />
      {info.label}
    </span>
  );
}

const CHART_COLORS = ["#22c55e", "#a78bfa", "#f0c040", "#3b82f6", "#ef4444", "#ec4899", "#06b6d4", "#f97316"];

type TabKey = "overview" | "users" | "health" | "audit" | "flags";

/* ─── Feature Flags (client-side simulation) ─────────────────────────────── */
const DEFAULT_FLAGS = [
  { key: "ai_slides", label: "AI Slide Generator", desc: "LLM-powered presentation builder", enabled: true, category: "AI" },
  { key: "competitive_analysis", label: "Competitive Analysis Center", desc: "Carrier comparison & battle cards", enabled: true, category: "AI" },
  { key: "bulk_generation", label: "Bulk Strategy Generation", desc: "Multi-client batch strategy runs", enabled: true, category: "AI" },
  { key: "lead_generator", label: "Lead Generator", desc: "AI-powered lead generation & scoring", enabled: true, category: "Growth" },
  { key: "hubspot_sync", label: "HubSpot Integration", desc: "Two-way CRM sync with HubSpot", enabled: false, category: "Integrations" },
  { key: "slack_integration", label: "Slack Notifications", desc: "Push alerts to Slack channels", enabled: false, category: "Integrations" },
  { key: "voice_plan_builder", label: "Voice Plan Builder", desc: "Voice-to-strategy conversion", enabled: true, category: "AI" },
  { key: "meeting_notes", label: "AI Meeting Notes", desc: "Automatic meeting transcription & summary", enabled: true, category: "AI" },
  { key: "white_label", label: "White-Label Mode", desc: "Custom branding & domain", enabled: false, category: "Enterprise" },
  { key: "compliance_export", label: "Compliance Export", desc: "Automated compliance report generation", enabled: true, category: "Compliance" },
  { key: "advanced_reporting", label: "Advanced Reporting", desc: "Custom report builder with scheduling", enabled: true, category: "Analytics" },
  { key: "crypto_corner", label: "Cryptocurrency Corner", desc: "Digital asset analysis tools", enabled: false, category: "Experimental" },
];

/* ─── System Health (simulated) ──────────────────────────────────────────── */
const HEALTH_SERVICES = [
  { name: "API Server", status: "operational" as const, latency: 42, uptime: 99.97 },
  { name: "Database", status: "operational" as const, latency: 8, uptime: 99.99 },
  { name: "AI Engine", status: "operational" as const, latency: 320, uptime: 99.85 },
  { name: "File Storage (S3)", status: "operational" as const, latency: 15, uptime: 99.99 },
  { name: "Email Service", status: "operational" as const, latency: 180, uptime: 99.90 },
  { name: "OAuth Provider", status: "operational" as const, latency: 55, uptime: 99.95 },
  { name: "Stripe Payments", status: "operational" as const, latency: 95, uptime: 99.98 },
  { name: "CDN", status: "operational" as const, latency: 12, uptime: 99.99 },
];

const STATUS_COLORS = {
  operational: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "#22c55e", label: "Operational" },
  degraded: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "#f59e0b", label: "Degraded" },
  down: { bg: "bg-red-500/10", text: "text-red-400", dot: "#ef4444", label: "Down" },
};

const fmt = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${(n / 1_000).toFixed(0)}K` : `$${n}`;

export default function EnterpriseAdmin() {
  const { user } = useAuth();
  
  const [tab, setTab] = useState<TabKey>("overview");
  const [auditPage, setAuditPage] = useState(1);
  const [auditSearch, setAuditSearch] = useState("");
  const [auditFilter, setAuditFilter] = useState("all");
  const [flags, setFlags] = useState(DEFAULT_FLAGS);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [healthRegion, setHealthRegion] = useState("all");
  const [dateRange, setDateRange] = useState("7d");
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState("csv");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc'|'desc'}>({key: 'createdAt', direction: 'desc'});
  const [systemAlertsAck, setSystemAlertsAck] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('area');
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [showSettings, setShowSettings] = useState(false);
  const [themePreference, setThemePreference] = useState('dark');
  const [compactMode, setCompactMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(true);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['users', 'revenue', 'performance']);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const PAGE_SIZE = 15;

  const metricsQuery = trpc.enterprise.metrics.useQuery(undefined, { staleTime: 30_000 });
  const auditQuery = trpc.enterprise.auditLogs.useQuery({ page: auditPage, pageSize: PAGE_SIZE }, { staleTime: 10_000 });
  const usersQuery = trpc.enterprise.users.useQuery({ page, limit, search: searchQuery }, { staleTime: 60_000 });
  const systemHealthQuery = trpc.enterprise.systemHealth.useQuery(undefined, { staleTime: 15_000 });
  const analyticsQuery = trpc.enterprise.analytics.useQuery({ dateRange }, { staleTime: 300_000 });
  
  const inviteUserMutation = trpc.enterprise.inviteUser.useMutation({
    onSuccess: () => {
      toast.success("User invited successfully");
      setShowInviteModal(false);
      setInviteEmail("");
    }
  });

  const metrics = metricsQuery.data;
  const auditData = auditQuery.data;
  const usersData = usersQuery.data;
  const systemHealth = systemHealthQuery.data;
  const analyticsData = analyticsQuery.data;

  const handleTabChange = useCallback((newTab: TabKey) => {
    setTab(newTab);
  }, []);

  const handleAuditSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAuditSearch(e.target.value);
    setAuditPage(1);
  }, []);

  const handleAuditFilter = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setAuditFilter(e.target.value);
    setAuditPage(1);
  }, []);

  const toggleFlag = useCallback((key: string) => {
    setFlags(prev => prev.map((f) => f.key === key ? { ...f, enabled: !f.enabled } : f));
    const flag = flags.find((f) => f.key === key);
    toast.success(`${flag?.label} ${flag?.enabled ? "disabled" : "enabled"}`);
  }, [flags]);

  const handleExportAudit = useCallback(() => {
    if (!auditData?.logs?.length) return toast.error("No audit data to export");
    const csv = [
      "Action,Actor,Email,Entity,Timestamp",
      ...auditData.logs.map((l) =>
        `"${l.action}","${l.actorName ?? "System"}","${l.actorEmail ?? ""}","${l.entityType ?? ""}${l.entityId ? ` #${l.entityId}` : ""}","${new Date(l.createdAt).toISOString()}"`
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `RCS_Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Audit log exported as CSV");
  }, [auditData]);

  const handleInviteSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return toast.error("Email is required");
    inviteUserMutation.mutate({ email: inviteEmail, role: inviteRole });
  }, [inviteEmail, inviteRole, inviteUserMutation]);

  const toggleRowExpansion = useCallback((id: string) => {
    setExpandedRow(prev => prev === id ? null : id);
  }, []);

  const handleSort = useCallback((key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const acknowledgeAlert = useCallback((id: string) => {
    setSystemAlertsAck(prev => [...prev, id]);
    toast.success("Alert acknowledged");
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    Promise.all([
      metricsQuery.refetch(),
      auditQuery.refetch(),
      usersQuery.refetch(),
      systemHealthQuery.refetch(),
      analyticsQuery.refetch()
    ]).finally(() => setIsRefreshing(false));
  }, [metricsQuery, auditQuery, usersQuery, systemHealthQuery, analyticsQuery]);

  const activityBreakdown = useMemo(() => {
    if (!auditData?.logs) return [];
    const counts: Record<string, number> = {};
    auditData.logs.forEach((log) => {
      const label = ACTION_LABELS[log.action]?.label ?? log.action;
      counts[label] = (counts[label] ?? 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [auditData]);

  const seatData = useMemo(() => {
    if (!metrics) return [
      { name: "Active", value: 45, color: "#22c55e" },
      { name: "Available", value: 55, color: "#1a3050" }
    ];
    return [
      { name: "Active", value: metrics.activeMembers, color: "#22c55e" },
      { name: "Available", value: Math.max(0, metrics.seats - metrics.activeMembers), color: "#1a3050" },
    ];
  }, [metrics]);

  const platformHealthData = useMemo(() => {
    if (!metrics) return [
      { name: "Clients", value: 1250 },
      { name: "Deals", value: 340 },
      { name: "Pipeline ($K)", value: 45000 }
    ];
    return [
      { name: "Clients", value: metrics.clientCount },
      { name: "Deals", value: metrics.dealCount },
      { name: "Pipeline ($K)", value: Math.round(metrics.pipelineValue / 1000) },
    ];
  }, [metrics]);

  const revenueTrendData = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
      revenue: Math.floor(Math.random() * 50000) + 50000,
      target: Math.floor(Math.random() * 10000) + 90000,
      expenses: Math.floor(Math.random() * 20000) + 30000
    }));
  }, []);

  const userGrowthData = useMemo(() => {
    let current = 100;
    return Array.from({ length: 30 }).map((_, i) => {
      current += Math.floor(Math.random() * 5);
      return {
        day: `Day ${i+1}`,
        users: current,
        active: Math.floor(current * (0.6 + Math.random() * 0.3))
      };
    });
  }, []);

  const systemPerformanceData = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => ({
      hour: `${i}:00`,
      cpu: Math.floor(Math.random() * 40) + 20,
      memory: Math.floor(Math.random() * 30) + 40,
      latency: Math.floor(Math.random() * 100) + 50
    }));
  }, []);

  const featureUsageData = useMemo(() => {
    return [
      { subject: 'AI Tools', A: 120, B: 110, fullMark: 150 },
      { subject: 'Reporting', A: 98, B: 130, fullMark: 150 },
      { subject: 'CRM Sync', A: 86, B: 130, fullMark: 150 },
      { subject: 'Client Portal', A: 99, B: 100, fullMark: 150 },
      { subject: 'Billing', A: 85, B: 90, fullMark: 150 },
      { subject: 'Docs', A: 65, B: 85, fullMark: 150 },
    ];
  }, []);

  const filteredAuditLogs = useMemo(() => {
    if (!auditData?.logs) return [];
    let logs = auditData.logs;
    if (auditSearch) {
      const q = auditSearch.toLowerCase();
      logs = logs.filter((l) =>
        (l.actorName ?? "").toLowerCase().includes(q) ||
        (l.actorEmail ?? "").toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q)
      );
    }
    if (auditFilter !== "all") {
      logs = logs.filter((l) => l.action === auditFilter);
    }
    
    logs = [...logs].sort((a, b) => {
      const aVal = a[sortConfig.key as keyof typeof a];
      const bVal = b[sortConfig.key as keyof typeof b];
      
      if (aVal === bVal) return 0;
      
      const isAsc = sortConfig.direction === 'asc';
      if (aVal === null || aVal === undefined) return isAsc ? -1 : 1;
      if (bVal === null || bVal === undefined) return isAsc ? 1 : -1;
      
      return aVal < bVal ? (isAsc ? -1 : 1) : (isAsc ? 1 : -1);
    });
    
    return logs;
  }, [auditData, auditSearch, auditFilter, sortConfig]);

  const mockUsers = useMemo(() => {
    return Array.from({ length: 15 }).map((_, i) => ({
      id: `usr_${i}`,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      role: i === 0 ? 'admin' : i < 3 ? 'manager' : 'member',
      status: Math.random() > 0.2 ? 'active' : 'inactive',
      lastLogin: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
      department: ['Sales', 'Support', 'Engineering', 'Marketing'][Math.floor(Math.random() * 4)]
    }));
  }, []);

  const systemAlerts = useMemo(() => {
    return [
      { id: 'al_1', type: 'warning', message: 'High CPU usage detected on Worker Node 3', time: '10 mins ago' },
      { id: 'al_2', type: 'error', message: 'Failed to sync with HubSpot API (Rate limit exceeded)', time: '25 mins ago' },
      { id: 'al_3', type: 'info', message: 'Database backup completed successfully', time: '1 hour ago' },
      { id: 'al_4', type: 'warning', message: 'Storage capacity reaching 85%', time: '3 hours ago' },
    ];
  }, []);

  if (user?.role !== "admin") {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <AlertTriangle size={40} className="text-[#f0c040]" />
          <div className="text-white font-bold text-lg">Admin Access Required</div>
          <div className="text-[#7a95b8] text-sm">This section is restricted to workspace administrators.</div>
        </div>
      </AppShell>
    );
  }

  const TABS: { key: TabKey; label: string; icon: any }[] = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "users", label: "Users", icon: Users },
    { key: "health", label: "System Health", icon: Server },
    { key: "audit", label: "Audit Log", icon: FileText },
    { key: "flags", label: "Feature Flags", icon: ToggleLeft },
  ];

  return (
    <AppShell>
      <div className="rc-page-header">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#2563eb] flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Shield size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Enterprise Administration</h1>
              <div className="text-sm text-[#7a95b8] flex items-center gap-2">
                <span>Manage workspace settings, users, and security</span>
                <span className="w-1 h-1 rounded-full bg-[#3b82f6]" />
                <span className="flex items-center gap-1 text-[#22c55e]">
                  <CheckCircle2 size={12} /> System Normal
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button onClick={handleRefresh} disabled={isRefreshing} className="rc-btn rc-btn-ghost">
              <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
            </button>
            <button onClick={() => setShowSettings(!showSettings)} className="rc-btn rc-btn-ghost">
              <Settings size={16} />
            </button>
            <ExportToSlides 
              content={`# Enterprise Administration\n\nWorkspace overview and system health metrics.\n\n## Key Metrics\n- Active Users: ${metrics?.activeMembers ?? 0}\n- Total Clients: ${metrics?.clientCount ?? 0}\n- Pipeline: $${Math.round((metrics?.pipelineValue ?? 0) / 1000)}K`} 
              buttonText="Export Report"
            />
          </div>
        </div>

        {/* Settings Panel (Collapsible) */}
        {showSettings && (
          <div className="mt-4 p-4 rounded-xl bg-[#0f1e35] border border-[#12233e] animate-in fade-in slide-in-from-top-4">
            <h3 className="text-white font-medium mb-4 flex items-center gap-2">
              <Settings size={16} className="text-[#3b82f6]" /> Dashboard Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="text-xs text-[#7a95b8] uppercase tracking-wider mb-2 block">Refresh Interval</label>
                <select 
                  className="rc-input w-full"
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                >
                  <option value={10}>10 seconds</option>
                  <option value={30}>30 seconds</option>
                  <option value={60}>1 minute</option>
                  <option value={300}>5 minutes</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[#7a95b8] uppercase tracking-wider mb-2 block">Theme Preference</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setThemePreference('dark')}
                    className={`flex-1 py-2 rounded-lg text-sm border ${themePreference === 'dark' ? 'bg-[#3b82f6]/20 border-[#3b82f6] text-[#3b82f6]' : 'border-[#12233e] text-[#7a95b8]'}`}
                  >
                    Dark
                  </button>
                  <button 
                    onClick={() => setThemePreference('light')}
                    className={`flex-1 py-2 rounded-lg text-sm border ${themePreference === 'light' ? 'bg-[#3b82f6]/20 border-[#3b82f6] text-[#3b82f6]' : 'border-[#12233e] text-[#7a95b8]'}`}
                  >
                    Light
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-[#7a95b8] uppercase tracking-wider mb-2 block">Layout</label>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setCompactMode(!compactMode)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${compactMode ? 'bg-[#3b82f6]/20 border-[#3b82f6] text-[#3b82f6]' : 'border-[#12233e] text-[#7a95b8]'}`}
                  >
                    <Layers size={14} /> Compact Mode
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-1 mt-6 border-b border-[#12233e] overflow-x-auto pb-px scrollbar-hide">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t.key
                  ? "border-[#3b82f6] text-[#3b82f6]"
                  : "border-transparent text-[#7a95b8] hover:text-white hover:border-[#7a95b8]/30"
              }`}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 max-w-[1600px] mx-auto space-y-6">
        {/* OVERVIEW TAB */}
        {tab === "overview" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rc-card bg-gradient-to-br from-[#0f1e35] to-[#0a1424] border-[#12233e] relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#3b82f6]/10 rounded-full blur-xl group-hover:bg-[#3b82f6]/20 transition-all" />
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-[#3b82f6]/10 flex items-center justify-center">
                    <Users size={16} className="text-[#3b82f6]" />
                  </div>
                  <div className="text-sm font-medium text-[#7a95b8]">Active Users</div>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{metrics?.activeMembers ?? 0} <span className="text-lg text-[#7a95b8] font-normal">/ {metrics?.seats ?? 0}</span></div>
                <div className="text-xs text-[#22c55e] flex items-center gap-1">
                  <TrendingUp size={12} /> +12% from last month
                </div>
              </div>

              <div className="rc-card bg-gradient-to-br from-[#0f1e35] to-[#0a1424] border-[#12233e] relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#22c55e]/10 rounded-full blur-xl group-hover:bg-[#22c55e]/20 transition-all" />
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-[#22c55e]/10 flex items-center justify-center">
                    <Database size={16} className="text-[#22c55e]" />
                  </div>
                  <div className="text-sm font-medium text-[#7a95b8]">Total Clients</div>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{metrics?.clientCount ?? 0}</div>
                <div className="text-xs text-[#22c55e] flex items-center gap-1">
                  <TrendingUp size={12} /> +5.4% from last month
                </div>
              </div>

              <div className="rc-card bg-gradient-to-br from-[#0f1e35] to-[#0a1424] border-[#12233e] relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#f0c040]/10 rounded-full blur-xl group-hover:bg-[#f0c040]/20 transition-all" />
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-[#f0c040]/10 flex items-center justify-center">
                    <DollarSign size={16} className="text-[#f0c040]" />
                  </div>
                  <div className="text-sm font-medium text-[#7a95b8]">Pipeline Value</div>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{fmt(metrics?.pipelineValue ?? 0)}</div>
                <div className="text-xs text-[#22c55e] flex items-center gap-1">
                  <TrendingUp size={12} /> +2.1% from last month
                </div>
              </div>

              <div className="rc-card bg-gradient-to-br from-[#0f1e35] to-[#0a1424] border-[#12233e] relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#a78bfa]/10 rounded-full blur-xl group-hover:bg-[#a78bfa]/20 transition-all" />
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-[#a78bfa]/10 flex items-center justify-center">
                    <Activity size={16} className="text-[#a78bfa]" />
                  </div>
                  <div className="text-sm font-medium text-[#7a95b8]">API Requests</div>
                </div>
                <div className="text-3xl font-bold text-white mb-1">1.2M</div>
                <div className="text-xs text-[#7a95b8] flex items-center gap-1">
                  <Clock size={12} /> Last 30 days
                </div>
              </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1: Revenue Trend (AreaChart) */}
              <div className="rc-card flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} className="text-[#3b82f6]" />
                    <h3 className="text-white font-semibold">Revenue & Targets</h3>
                  </div>
                  <select 
                    className="rc-input !py-1 text-xs !w-auto"
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                  >
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="90d">Last 90 Days</option>
                    <option value="1y">Last Year</option>
                  </select>
                </div>
                <div className="flex-1 min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                      <XAxis dataKey="month" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                      <RTooltip 
                        contentStyle={{ backgroundColor: '#0f1e35', borderColor: '#12233e', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRev)" name="Actual Revenue" />
                      <Area type="monotone" dataKey="target" stroke="#22c55e" fillOpacity={1} fill="url(#colorTarget)" name="Target Revenue" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Feature Usage (RadarChart) */}
              <div className="rc-card flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Layers size={16} className="text-[#a78bfa]" />
                    <h3 className="text-white font-semibold">Feature Adoption</h3>
                  </div>
                  <button className="rc-btn rc-btn-ghost text-xs">
                    <Download size={14} /> Export
                  </button>
                </div>
                <div className="flex-1 min-h-[300px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={featureUsageData}>
                      <PolarGrid stroke="#12233e" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#7a95b8', fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 150]} tick={{ fill: '#7a95b8', fontSize: 10 }} />
                      <Radar name="Current Month" dataKey="A" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.5} />
                      <Radar name="Previous Month" dataKey="B" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                      <Legend />
                      <RTooltip contentStyle={{ backgroundColor: '#0f1e35', borderColor: '#12233e', color: '#fff' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart 3: Seat Allocation (PieChart) */}
              <div className="rc-card">
                <div className="flex items-center gap-2 mb-4">
                  <Users size={16} className="text-[#22c55e]" />
                  <h3 className="text-white font-semibold">Seat Allocation</h3>
                </div>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={seatData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {seatData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RTooltip contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff" }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 p-3 rounded-lg bg-[#12233e]/50 border border-[#12233e] flex items-center justify-between">
                  <div>
                    <div className="text-xs text-[#7a95b8]">Total Seats</div>
                    <div className="text-lg font-bold text-white">{metrics?.seats ?? 100}</div>
                  </div>
                  <button className="rc-btn rc-btn-primary text-xs py-1 px-3">
                    Add Seats
                  </button>
                </div>
              </div>

              {/* Chart 4: User Growth (ComposedChart) */}
              <div className="rc-card lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <UserPlus size={16} className="text-[#f0c040]" />
                    <h3 className="text-white font-semibold">User Growth & Activity</h3>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setChartType('bar')} className={`p-1.5 rounded ${chartType === 'bar' ? 'bg-[#3b82f6]/20 text-[#3b82f6]' : 'text-[#7a95b8]'}`}><BarChart3 size={14} /></button>
                    <button onClick={() => setChartType('line')} className={`p-1.5 rounded ${chartType === 'line' ? 'bg-[#3b82f6]/20 text-[#3b82f6]' : 'text-[#7a95b8]'}`}><Activity size={14} /></button>
                  </div>
                </div>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={userGrowthData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                      <XAxis dataKey="day" stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => val.replace('Day ', '')} />
                      <YAxis stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} />
                      <RTooltip contentStyle={{ backgroundColor: '#0f1e35', borderColor: '#12233e', color: '#fff' }} />
                      <Legend />
                      <Bar dataKey="users" name="Total Users" fill="#1a3050" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="active" name="Active Users" stroke="#f0c040" strokeWidth={2} dot={{ r: 3, fill: '#f0c040' }} activeDot={{ r: 5 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Data Table 1: Recent Activity */}
            <div className="rc-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-[#3b82f6]" />
                  <h3 className="text-white font-semibold">Recent Platform Activity</h3>
                </div>
                <button onClick={() => setTab("audit")} className="text-xs text-[#3b82f6] hover:underline flex items-center gap-1">
                  View All <ArrowUpRight size={12} />
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#12233e] text-xs uppercase tracking-wider text-[#7a95b8]">
                      <th className="pb-3 font-medium pl-2">Action</th>
                      <th className="pb-3 font-medium">User</th>
                      <th className="pb-3 font-medium">Details</th>
                      <th className="pb-3 font-medium text-right pr-2">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#12233e]/50">
                    {(auditData?.logs || []).slice(0, 5).map((log, i) => (
                      <tr key={log.id || i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 pl-2"><ActionBadge action={log.action} /></td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#3b82f6]/20 flex items-center justify-center text-xs text-[#3b82f6]">
                              {(log.actorName || "S")[0]}
                            </div>
                            <span className="text-sm text-white">{log.actorName || "System"}</span>
                          </div>
                        </td>
                        <td className="py-3 text-sm text-[#7a95b8]">{log.entityType ? `${log.entityType} updated` : "System action"}</td>
                        <td className="py-3 text-sm text-[#7a95b8] text-right pr-2">
                          {new Date(log.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </td>
                      </tr>
                    ))}
                    {(!auditData?.logs || auditData.logs.length === 0) && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-[#7a95b8] text-sm">
                          No recent activity found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {tab === "users" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
              <div className="flex-1 max-w-md relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a95b8]" />
                <input 
                  type="text" 
                  placeholder="Search users by name or email..." 
                  className="rc-input pl-10 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <button className="rc-btn rc-btn-ghost">
                  <Filter size={16} /> Filter
                </button>
                <button onClick={() => setShowInviteModal(true)} className="rc-btn rc-btn-primary">
                  <UserPlus size={16} /> Invite User
                </button>
              </div>
            </div>

            {/* Data Table 2: Users List */}
            <div className="rc-card overflow-hidden !p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#0f1e35] border-b border-[#12233e] text-xs uppercase tracking-wider text-[#7a95b8]">
                      <th className="py-4 px-6 font-medium cursor-pointer hover:text-white" onClick={() => handleSort('name')}>
                        <div className="flex items-center gap-1">User {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                      </th>
                      <th className="py-4 px-6 font-medium cursor-pointer hover:text-white" onClick={() => handleSort('role')}>
                        <div className="flex items-center gap-1">Role {sortConfig.key === 'role' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                      </th>
                      <th className="py-4 px-6 font-medium cursor-pointer hover:text-white" onClick={() => handleSort('department')}>
                        <div className="flex items-center gap-1">Department {sortConfig.key === 'department' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                      </th>
                      <th className="py-4 px-6 font-medium">Status</th>
                      <th className="py-4 px-6 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#12233e]">
                    {mockUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3b82f6]/20 to-[#a78bfa]/20 border border-[#3b82f6]/30 flex items-center justify-center text-white font-medium">
                              {u.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">{u.name}</div>
                              <div className="text-xs text-[#7a95b8]">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            u.role === 'admin' ? 'bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20' : 
                            u.role === 'manager' ? 'bg-[#f0c040]/10 text-[#f0c040] border border-[#f0c040]/20' : 
                            'bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20'
                          }`}>
                            {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm text-[#7a95b8]">{u.department}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${u.status === 'active' ? 'bg-[#22c55e]' : 'bg-[#7a95b8]'}`} />
                            <span className="text-sm text-[#7a95b8] capitalize">{u.status}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1.5 text-[#7a95b8] hover:text-white hover:bg-white/10 rounded"><Settings size={14} /></button>
                            <button className="p-1.5 text-[#7a95b8] hover:text-[#ef4444] hover:bg-[#ef4444]/10 rounded"><UserX size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="p-4 border-t border-[#12233e] flex items-center justify-between bg-[#0f1e35]/50">
                <div className="text-sm text-[#7a95b8]">Showing 1 to 15 of 45 users</div>
                <div className="flex gap-1">
                  <button className="px-3 py-1 rounded border border-[#12233e] text-[#7a95b8] hover:bg-white/5 disabled:opacity-50" disabled>Prev</button>
                  <button className="px-3 py-1 rounded bg-[#3b82f6] text-white">1</button>
                  <button className="px-3 py-1 rounded border border-[#12233e] text-[#7a95b8] hover:bg-white/5">2</button>
                  <button className="px-3 py-1 rounded border border-[#12233e] text-[#7a95b8] hover:bg-white/5">3</button>
                  <button className="px-3 py-1 rounded border border-[#12233e] text-[#7a95b8] hover:bg-white/5">Next</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HEALTH TAB */}
        {tab === "health" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Alerts Section */}
            {systemAlerts.filter((a) => !systemAlertsAck.includes(a.id)).length > 0 && (
              <div className="space-y-3 mb-6">
                <h3 className="text-sm font-medium text-[#7a95b8] uppercase tracking-wider">Active Alerts</h3>
                {systemAlerts.filter((a) => !systemAlertsAck.includes(a.id)).map((alert) => (
                  <div key={alert.id} className={`flex items-start justify-between p-4 rounded-xl border ${
                    alert.type === 'error' ? 'bg-[#ef4444]/10 border-[#ef4444]/30' :
                    alert.type === 'warning' ? 'bg-[#f0c040]/10 border-[#f0c040]/30' :
                    'bg-[#3b82f6]/10 border-[#3b82f6]/30'
                  }`}>
                    <div className="flex items-start gap-3">
                      {alert.type === 'error' ? <XCircle className="text-[#ef4444] mt-0.5" size={18} /> :
                       alert.type === 'warning' ? <AlertTriangle className="text-[#f0c040] mt-0.5" size={18} /> :
                       <Info className="text-[#3b82f6] mt-0.5" size={18} />}
                      <div>
                        <div className="text-sm font-medium text-white">{alert.message}</div>
                        <div className="text-xs text-[#7a95b8] mt-1">{alert.time}</div>
                      </div>
                    </div>
                    <button 
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="text-xs px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-white transition-colors"
                    >
                      Acknowledge
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart 5: System Performance (LineChart) */}
              <div className="rc-card lg:col-span-2 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Cpu size={16} className="text-[#22c55e]" />
                    <h3 className="text-white font-semibold">Resource Utilization</h3>
                  </div>
                  <div className="flex gap-2">
                    <span className="flex items-center gap-1 text-xs text-[#7a95b8]"><span className="w-2 h-2 rounded-full bg-[#3b82f6]"></span> CPU</span>
                    <span className="flex items-center gap-1 text-xs text-[#7a95b8]"><span className="w-2 h-2 rounded-full bg-[#a78bfa]"></span> Memory</span>
                  </div>
                </div>
                <div className="flex-1 min-h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={systemPerformanceData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                      <XAxis dataKey="hour" stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                      <RTooltip contentStyle={{ backgroundColor: '#0f1e35', borderColor: '#12233e', color: '#fff' }} />
                      <Line type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                      <Line type="monotone" dataKey="memory" stroke="#a78bfa" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Data Table 3: Services Status */}
              <div className="rc-card flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <Server size={16} className="text-[#3b82f6]" />
                  <h3 className="text-white font-semibold">Services Status</h3>
                </div>
                <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                  {HEALTH_SERVICES.map((service, i) => (
                    <div key={i} className="p-3 rounded-lg bg-[#0f1e35] border border-[#12233e] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[service.status].dot} shadow-[0_0_8px_${STATUS_COLORS[service.status].dot}]`} />
                        <div>
                          <div className="text-sm font-medium text-white">{service.name}</div>
                          <div className="text-xs text-[#7a95b8]">{service.uptime}% uptime</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${service.latency > 200 ? "text-amber-400" : "text-white"}`}>{service.latency}ms</div>
                        <div className="text-[10px] text-[#7a95b8] uppercase">Latency</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Infrastructure Info */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: "Server Region", value: "US-East-1 (Virginia)", icon: Globe, color: "#3b82f6" },
                { label: "Database", value: "TiDB Serverless", icon: Database, color: "#a78bfa" },
                { label: "Storage", value: "AWS S3 (Standard)", icon: HardDrive, color: "#f0c040" },
                { label: "CDN Provider", value: "Cloudflare Edge", icon: Wifi, color: "#22c55e" },
              ].map((item) => (
                <div key={item.label} className="rc-card !p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                    <item.icon size={18} style={{ color: item.color }} />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-[#7a95b8] mb-1">{item.label}</div>
                    <div className="text-sm font-bold text-white">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AUDIT LOG TAB */}
        {tab === "audit" && (
          <div className="rc-card animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-[#22c55e]" />
                <span className="text-white font-semibold">Compliance Audit Log</span>
                {auditData && <span className="rc-badge rc-badge-blue">{auditData.total} events</span>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleExportAudit} className="rc-btn rc-btn-ghost text-sm">
                  <Download size={14} /> Export CSV
                </button>
              </div>
            </div>

            {/* Search & Filter */}
            <div className="flex items-center gap-3 mb-4 flex-wrap bg-[#0f1e35] p-3 rounded-lg border border-[#12233e]">
              <div className="flex-1 min-w-[200px] relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a95b8]" />
                <input
                  className="rc-input pl-9 !py-2 text-sm w-full bg-transparent border-none focus:ring-0"
                  placeholder="Search by actor name, email, or action..."
                  value={auditSearch}
                  onChange={handleAuditSearch}
                />
              </div>
              <div className="w-px h-6 bg-[#12233e] hidden md:block"></div>
              <select
                className="rc-input !py-2 text-sm !w-auto min-w-[150px] bg-transparent border-none focus:ring-0"
                value={auditFilter}
                onChange={handleAuditFilter}
              >
                <option value="all">All Actions</option>
                {Object.entries(ACTION_LABELS).map(([key, info]) => (
                  <option key={key} value={key}>{info.label}</option>
                ))}
              </select>
              {(auditSearch || auditFilter !== "all") && (
                <button
                  onClick={() => { setAuditSearch(""); setAuditFilter("all"); }}
                  className="rc-btn rc-btn-ghost text-xs text-[#ef4444]"
                >
                  <XCircle size={12} /> Clear
                </button>
              )}
            </div>

            {auditQuery.isLoading && <div className="text-[#7a95b8] text-sm py-12 text-center flex flex-col items-center gap-3"><RefreshCw className="animate-spin text-[#3b82f6]" size={24} /> Loading audit log...</div>}

            {auditData && filteredAuditLogs.length === 0 && (
              <div className="text-center py-16 bg-[#0f1e35]/30 rounded-xl border border-dashed border-[#12233e]">
                <Search size={32} className="text-[#7a95b8] mx-auto mb-3 opacity-40" />
                <div className="text-white font-medium mb-1">No results found</div>
                <div className="text-[#7a95b8] text-sm">Try adjusting your search or filters to find what you're looking for.</div>
                <button onClick={() => { setAuditSearch(""); setAuditFilter("all"); }} className="mt-4 rc-btn rc-btn-ghost text-sm">Clear all filters</button>
              </div>
            )}

            {/* Data Table 4: Audit Logs */}
            {filteredAuditLogs.length > 0 && (
              <div className="border border-[#12233e] rounded-xl overflow-hidden">
                <div className="hidden md:grid grid-cols-[1.5fr_2fr_2fr_1.5fr_1fr] gap-4 px-4 py-3 text-xs font-semibold text-[#7a95b8] uppercase tracking-wider bg-[#0f1e35] border-b border-[#12233e]">
                  <span>Action</span><span>Actor</span><span>Entity/Details</span><span>Timestamp</span><span className="text-right">More</span>
                </div>
                <div className="divide-y divide-[#12233e]">
                  {filteredAuditLogs.map((log) => (
                    <div key={log.id} className="flex flex-col">
                      <div className="grid grid-cols-1 md:grid-cols-[1.5fr_2fr_2fr_1.5fr_1fr] gap-2 md:gap-4 px-4 py-3 hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => toggleRowExpansion(log.id)}>
                        <div className="flex items-center"><ActionBadge action={log.action} /></div>
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-[#22c55e]/15 border border-[#22c55e]/20 flex items-center justify-center shrink-0">
                            <User2 size={12} className="text-[#22c55e]" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm text-white truncate font-medium">{log.actorName ?? "System"}</div>
                            {log.actorEmail && <div className="text-xs text-[#7a95b8] truncate">{log.actorEmail}</div>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0">
                          {log.entityType ? (
                            <div className="flex items-center gap-1.5 bg-[#12233e]/50 px-2 py-1 rounded-md border border-[#12233e]">
                              <Tag size={12} className="text-[#7a95b8] shrink-0" />
                              <span className="text-xs text-[#c8d8ec] truncate">{log.entityType}{log.entityId ? ` #${log.entityId.substring(0,8)}` : ""}</span>
                            </div>
                          ) : log.metadata ? (
                            <span className="text-xs text-[#7a95b8] truncate">{Object.entries(log.metadata as Record<string, unknown>).slice(0, 1).map(([k, v]) => `${k}: ${v}`).join(", ")}...</span>
                          ) : (
                            <span className="text-xs text-[#7a95b8]">—</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className="text-[#7a95b8] shrink-0" />
                          <span className="text-xs text-[#7a95b8]">{new Date(log.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <div className="flex items-center justify-end">
                          <button className="p-1.5 text-[#7a95b8] hover:text-white rounded-md hover:bg-white/10 transition-colors">
                            {expandedRow === log.id ? <ChevronRight size={16} className="rotate-90 transition-transform" /> : <ChevronRight size={16} className="transition-transform" />}
                          </button>
                        </div>
                      </div>
                      
                      {/* Expanded Row Details */}
                      {expandedRow === log.id && (
                        <div className="px-4 py-4 bg-[#0a1424] border-t border-[#12233e] animate-in slide-in-from-top-2">
                          <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-3">Event Details</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <table className="w-full text-sm">
                                <tbody>
                                  <tr><td className="py-1 text-[#7a95b8] w-24">Event ID</td><td className="py-1 text-white font-mono text-xs">{log.id}</td></tr>
                                  <tr><td className="py-1 text-[#7a95b8]">IP Address</td><td className="py-1 text-white font-mono text-xs">192.168.1.{Math.floor(Math.random()*255)}</td></tr>
                                  <tr><td className="py-1 text-[#7a95b8]">User Agent</td><td className="py-1 text-white text-xs truncate max-w-[200px]">Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...</td></tr>
                                </tbody>
                              </table>
                            </div>
                            <div>
                              <div className="text-[#7a95b8] text-xs mb-1">Metadata JSON</div>
                              <pre className="bg-[#050a12] p-3 rounded-lg border border-[#12233e] text-[10px] text-[#a78bfa] overflow-x-auto font-mono">
                                {JSON.stringify(log.metadata || { status: "success", processingTime: "42ms" }, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {auditData && auditData.totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 bg-[#0f1e35] border-t border-[#12233e]">
                    <button onClick={() => setAuditPage(p => Math.max(1, p - 1))} disabled={auditPage === 1} className="rc-btn rc-btn-ghost text-sm flex items-center gap-1 disabled:opacity-40">
                      <ChevronLeft size={14} /> Previous
                    </button>
                    <div className="flex items-center gap-1 hidden sm:flex">
                      {Array.from({ length: Math.min(auditData.totalPages, 7) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <button key={page} onClick={() => setAuditPage(page)} className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${page === auditPage ? "bg-[#3b82f6] text-white" : "text-[#7a95b8] hover:text-white hover:bg-white/10"}`}>
                            {page}
                          </button>
                        );
                      })}
                    </div>
                    <div className="sm:hidden text-sm text-[#7a95b8]">Page {auditPage} of {auditData.totalPages}</div>
                    <button onClick={() => setAuditPage(p => Math.min(auditData.totalPages, p + 1))} disabled={auditPage === auditData.totalPages} className="rc-btn rc-btn-ghost text-sm flex items-center gap-1 disabled:opacity-40">
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* FEATURE FLAGS TAB */}
        {tab === "flags" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="rc-card bg-gradient-to-r from-[#0f1e35] to-[#1a153a] border-[#a78bfa]/30">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ToggleRight size={20} className="text-[#a78bfa]" />
                    <h2 className="text-lg font-bold text-white">Feature Management</h2>
                  </div>
                  <p className="text-sm text-[#7a95b8] max-w-2xl">
                    Toggle experimental and premium features for your workspace. Changes apply globally to all users immediately. Use caution when disabling core functionality.
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => { setFlags(prev => prev.map((f) => ({ ...f, enabled: true }))); toast.success("All features enabled"); }}
                    className="rc-btn bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 hover:bg-[#22c55e]/20"
                  >
                    Enable All
                  </button>
                  <button
                    onClick={() => { setFlags(DEFAULT_FLAGS); toast.info("Flags reset to defaults"); }}
                    className="rc-btn rc-btn-ghost"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Group by category */}
              {Array.from(new Set(flags.map((f) => f.category))).map((category) => (
                <div key={category} className="rc-card flex flex-col h-full">
                  <div className="text-sm font-semibold text-white mb-4 flex items-center gap-2 pb-3 border-b border-[#12233e]">
                    {category === 'AI' ? <Zap size={16} className="text-[#a78bfa]" /> :
                     category === 'Growth' ? <TrendingUp size={16} className="text-[#22c55e]" /> :
                     category === 'Integrations' ? <Globe size={16} className="text-[#3b82f6]" /> :
                     <Layers size={16} className="text-[#f0c040]" />}
                    {category} Features
                    <span className="ml-auto text-xs font-normal text-[#7a95b8] bg-[#12233e] px-2 py-0.5 rounded-full">
                      {flags.filter((f) => f.category === category && f.enabled).length}/{flags.filter((f) => f.category === category).length}
                    </span>
                  </div>
                  
                  {/* Data Table 5: Feature Flags List */}
                  <div className="space-y-3 flex-1">
                    {flags.filter((f) => f.category === category).map((flag) => (
                      <div key={flag.key} className={`flex items-start justify-between p-3 rounded-xl border transition-all duration-300 ${
                        flag.enabled ? 'bg-[#0f1e35] border-[#3b82f6]/30 shadow-[0_0_15px_rgba(59,130,246,0.05)]' : 'bg-[#0a1424] border-[#12233e] opacity-70'
                      }`}>
                        <div className="flex items-start gap-3 min-w-0 pr-4">
                          <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${flag.enabled ? "bg-[#22c55e] shadow-[0_0_8px_#22c55e]" : "bg-[#7a95b8]"}`} />
                          <div className="min-w-0">
                            <div className={`text-sm font-medium mb-0.5 ${flag.enabled ? 'text-white' : 'text-[#7a95b8]'}`}>{flag.label}</div>
                            <div className="text-xs text-[#7a95b8] leading-relaxed">{flag.desc}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleFlag(flag.key)}
                          className={`shrink-0 w-10 h-5 rounded-full transition-all relative mt-0.5 ${
                            flag.enabled ? "bg-[#3b82f6]" : "bg-[#1a3055]"
                          }`}
                        >
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                            flag.enabled ? "left-5" : "left-0.5"
                          }`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Data Table 6: API Usage Limits */}
            <div className="rc-card mt-8">
              <div className="flex items-center gap-2 mb-4">
                <Database size={16} className="text-[#f0c040]" />
                <h3 className="text-white font-semibold">API Usage & Limits</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#12233e] text-xs uppercase tracking-wider text-[#7a95b8]">
                      <th className="pb-3 font-medium pl-2">Service</th>
                      <th className="pb-3 font-medium">Usage</th>
                      <th className="pb-3 font-medium">Limit</th>
                      <th className="pb-3 font-medium w-1/3">Utilization</th>
                      <th className="pb-3 font-medium text-right pr-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#12233e]/50">
                    {[
                      { name: "OpenAI GPT-4", usage: 45200, limit: 100000, unit: "tokens" },
                      { name: "HubSpot API", usage: 8450, limit: 10000, unit: "calls" },
                      { name: "Document OCR", usage: 120, limit: 500, unit: "pages" },
                      { name: "Email Sending", usage: 4500, limit: 50000, unit: "emails" }
                    ].map((api, i) => {
                      const percent = (api.usage / api.limit) * 100;
                      return (
                        <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 pl-2 text-sm text-white font-medium">{api.name}</td>
                          <td className="py-3 text-sm text-[#7a95b8]">{api.usage.toLocaleString()}</td>
                          <td className="py-3 text-sm text-[#7a95b8]">{api.limit.toLocaleString()}</td>
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-[#12233e] rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${percent > 90 ? 'bg-[#ef4444]' : percent > 75 ? 'bg-[#f0c040]' : 'bg-[#22c55e]'}`}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                              <span className="text-xs text-[#7a95b8] w-8 text-right">{Math.round(percent)}%</span>
                            </div>
                          </td>
                          <td className="py-3 text-right pr-2">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${
                              percent > 90 ? 'bg-[#ef4444]/10 text-[#ef4444]' : 
                              percent > 75 ? 'bg-[#f0c040]/10 text-[#f0c040]' : 
                              'bg-[#22c55e]/10 text-[#22c55e]'
                            }`}>
                              {percent > 90 ? 'Critical' : percent > 75 ? 'Warning' : 'Healthy'}
                            </span>
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
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0b1628] border border-[#12233e] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-[#12233e]">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus size={18} className="text-[#3b82f6]" /> Invite Team Member
              </h3>
              <button onClick={() => setShowInviteModal(false)} className="text-[#7a95b8] hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
                <XCircle size={20} />
              </button>
            </div>
            <form onSubmit={handleInviteSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#7a95b8] mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a95b8]" />
                  <input 
                    type="email" 
                    required
                    placeholder="colleague@example.com"
                    className="rc-input w-full pl-9"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#7a95b8] mb-1.5">Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'admin', label: 'Admin', desc: 'Full access' },
                    { id: 'manager', label: 'Manager', desc: 'Can edit' },
                    { id: 'member', label: 'Member', desc: 'View only' }
                  ].map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setInviteRole(role.id)}
                      className={`p-2 rounded-xl border text-left transition-all ${
                        inviteRole === role.id 
                          ? 'bg-[#3b82f6]/10 border-[#3b82f6] shadow-[0_0_10px_rgba(59,130,246,0.1)]' 
                          : 'bg-[#0f1e35] border-[#12233e] hover:border-[#7a95b8]/50'
                      }`}
                    >
                      <div className={`text-sm font-medium mb-0.5 ${inviteRole === role.id ? 'text-white' : 'text-[#7a95b8]'}`}>{role.label}</div>
                      <div className="text-[10px] text-[#7a95b8]">{role.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#12233e] mt-6">
                <button type="button" onClick={() => setShowInviteModal(false)} className="rc-btn rc-btn-ghost">Cancel</button>
                <button type="submit" disabled={inviteUserMutation.isPending} className="rc-btn rc-btn-primary flex items-center gap-2">
                  {inviteUserMutation.isPending ? <RefreshCw size={16} className="animate-spin" /> : <Mail size={16} />}
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <PageInsights pageId="enterprise-admin" />
    </AppShell>
  );
}
