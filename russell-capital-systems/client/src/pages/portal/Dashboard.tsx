// @ts-nocheck
import { useState, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ComposedChart, Line, RadialBarChart, RadialBar,
} from "recharts";
import {
  Activity,
  Users,
  DollarSign,
  TrendingUp,
  Briefcase,
  ArrowUpRight,
  ArrowRight,
  Plus,
  FileText,
  Target,
  ChevronRight,
  BarChart3,
  PieChart as PieChartIcon,
  Zap,
  Shield,
  Calendar,
  Video,
  Phone,
  MapPin,
  Flame,
  Star,
  ClipboardList,
  CircleAlert,
} from "lucide-react";
import { Link } from "wouter";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import { ExportToSlides } from "@/components/ExportToSlides";

/* ─── Formatters ─────────────────────────────────────────────────────────── */
function fmt$(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}
function fmtPct(n: number): string { return `${(n * 100).toFixed(1)}%`; }
function timeAgo(d: Date | string): string {
  const ms = Date.now() - new Date(d).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
function formatDate(d: Date | string): string {
  const date = new Date(d);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 7) return date.toLocaleDateString("en-US", { weekday: "short" });
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function formatTime(d: Date | string): string {
  return new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/* ─── Action icon map ────────────────────────────────────────────────────── */
function actionIcon(action: string) {
  if (action.includes("CREATED")) return <Plus className="h-3.5 w-3.5 text-emerald-400" />;
  if (action.includes("UPDATED")) return <ArrowUpRight className="h-3.5 w-3.5 text-blue-400" />;
  if (action.includes("NOTE")) return <FileText className="h-3.5 w-3.5 text-violet-400" />;
  if (action.includes("DEAL") || action.includes("STAGE")) return <Briefcase className="h-3.5 w-3.5 text-amber-400" />;
  if (action.includes("STRATEGY")) return <Target className="h-3.5 w-3.5 text-emerald-400" />;
  if (action.includes("MEETING")) return <Calendar className="h-3.5 w-3.5 text-blue-400" />;
  return <Activity className="h-3.5 w-3.5 text-slate-400" />;
}

function meetingIcon(type?: string) {
  if (type === "VIDEO") return <Video className="h-3.5 w-3.5 text-blue-400" />;
  if (type === "PHONE") return <Phone className="h-3.5 w-3.5 text-emerald-400" />;
  if (type === "IN_PERSON") return <MapPin className="h-3.5 w-3.5 text-amber-400" />;
  return <Calendar className="h-3.5 w-3.5 text-slate-400" />;
}

/* ─── Chart colors ───────────────────────────────────────────────────────── */
const ALLOC_COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];
const ALLOC_LABELS: Record<string, string> = {
  ira: "Traditional IRA",
  roth: "Roth IRA",
  taxable: "Taxable",
  realEstate: "Real Estate",
  lifeInsurance: "Life Insurance",
};

const FUNNEL_COLORS: Record<string, string> = {
  LEAD: "#64748b",
  QUALIFIED: "#3b82f6",
  STRATEGY: "#8b5cf6",
  PROPOSAL: "#f59e0b",
  CLOSED_WON: "#22c55e",
  CLOSED_LOST: "#ef4444",
};

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const { data: clientData } = useClientData();
  const statsQuery = trpc.dashboard.stats.useQuery();
  const { data: stats, isLoading: statsLoading, error: statsError } = statsQuery;
  const planningCasesQuery = trpc.planningCases.list.useQuery();
  const analyticsQuery = trpc.dashboard.analytics.useQuery();
  const netWorthQuery = trpc.dashboard.netWorthHistory.useQuery();
  const activityQuery = trpc.dashboard.recentActivity.useQuery();
  const topClientsQuery = trpc.dashboard.topClients.useQuery();
  const allocationQuery = trpc.dashboard.assetAllocation.useQuery();
  const goalsQuery = trpc.goals.progress.useQuery();
  const meetingsQuery = trpc.meetings.listUpcoming.useQuery({ limit: 5 });
  const coachingQuery = trpc.dashboard.coachingPrompts.useQuery();
  const analytics = analyticsQuery.data;
  const netWorth = netWorthQuery.data;
  const recentActivity = activityQuery.data;
  const topClients = topClientsQuery.data;
  const allocation = allocationQuery.data;
  const goals = goalsQuery.data;
  const upcomingMeetings = meetingsQuery.data;
  const coaching = coachingQuery.data;

  const [activityFilter, setActivityFilter] = useState<"all" | "clients" | "deals" | "strategies">("all");

  const dashboardSources = [
    { name: "practice metrics", query: statsQuery },
    { name: "planning cases", query: planningCasesQuery },
    { name: "analytics", query: analyticsQuery },
    { name: "net-worth history", query: netWorthQuery },
    { name: "recent activity", query: activityQuery },
    { name: "top clients", query: topClientsQuery },
    { name: "allocation", query: allocationQuery },
    { name: "goals", query: goalsQuery },
    { name: "meetings", query: meetingsQuery },
    { name: "coaching", query: coachingQuery },
  ];
  const failedSources = dashboardSources.filter(source => source.query.error);
  const loadingSources = dashboardSources.filter(source => source.query.isLoading);
  const emptySources = [
    !analytics?.strategyTrend?.length && "analytics",
    !recentActivity?.length && "recent activity",
    !topClients?.length && "top clients",
    !Object.values(allocation ?? {}).some(value => Number(value) > 0) && "allocation",
    !(goals as any[] | undefined)?.length && "goals",
    !upcomingMeetings?.length && "meetings",
    !coaching?.length && "coaching",
    !(planningCasesQuery.data ?? []).length && "planning cases",
  ].filter(Boolean) as string[];

  const retryDashboardSources = () => {
    for (const source of dashboardSources) void source.query.refetch();
  };

  /* ── Derived data ──────────────────────────────────────────────────────── */
  const allocData = useMemo(() => {
    if (!allocation) return [];
    return Object.entries(allocation)
      .filter(([_, v]) => Number(v) > 0)
      .map(([k, v]) => ({ name: ALLOC_LABELS[k] ?? k, value: Number(v) }));
  }, [allocation]);

  const totalAlloc = allocData.reduce((s, d) => s + d.value, 0);

  const funnelData = useMemo(() => {
    if (!analytics?.dealFunnel) return [];
    return analytics.dealFunnel.filter((d) => d.count > 0);
  }, [analytics]);

  const filteredActivity = useMemo(() => {
    if (!recentActivity) return [];
    if (activityFilter === "all") return recentActivity;
    if (activityFilter === "clients") return recentActivity.filter((a) => a.action.includes("CLIENT"));
    if (activityFilter === "deals") return recentActivity.filter((a) => a.action.includes("DEAL") || a.action.includes("STAGE"));
    if (activityFilter === "strategies") return recentActivity.filter((a) => a.action.includes("STRATEGY"));
    return recentActivity;
  }, [recentActivity, activityFilter]);

  const conversionRate = useMemo(() => {
    if (!funnelData.length) return 0;
    const totalDeals = funnelData.reduce((s, d) => s + d.count, 0);
    const wonDeals = funnelData.find((d) => d.stage === "CLOSED_WON")?.count ?? 0;
    return totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0;
  }, [funnelData]);

  const goalCompletionRate = useMemo(() => {
    if (!goals || !Array.isArray(goals) || goals.length === 0) return 0;
    const completed = goals.filter((g) => g.currentValue >= g.targetValue).length;
    return (completed / goals.length) * 100;
  }, [goals]);

  /* ── Stat cards ────────────────────────────────────────────────────────── */
  const statCards = [
    {
      label: "Goal Progress",
      value: `${(stats as any)?.goalProgress ?? 0}%`,
      icon: Target,
      change: `${goalCompletionRate.toFixed(0)}% goals completed`,
      changePositive: true,
      color: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
      iconColor: "text-emerald-400",
      href: "/portal/goals-planning",
    },
    {
      label: "Active Clients",
      value: String(stats?.clientCount ?? 0),
      icon: Users,
      change: `${stats?.clientCount ?? 0} households`,
      changePositive: true,
      color: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
      iconColor: "text-blue-400",
      href: "/portal/clients",
    },
    {
      label: "Pipeline Value",
      value: fmt$(stats?.pipelineValue ?? 0),
      icon: Briefcase,
      change: `${stats?.dealCount ?? 0} active deals · ${conversionRate.toFixed(0)}% win rate`,
      changePositive: true,
      color: "from-violet-500/20 to-violet-600/10 border-violet-500/30",
      iconColor: "text-violet-400",
      href: "/portal/pipeline",
    },
    {
      label: "Active Planning Cases",
      value: String((planningCasesQuery.data ?? []).filter(item => item.status !== "archived" && item.status !== "completed").length),
      icon: ClipboardList,
      change: `${(planningCasesQuery.data ?? []).filter(item => item.status === "review").length} awaiting review`,
      changePositive: true,
      color: "from-fuchsia-500/20 to-violet-600/10 border-violet-500/30",
      iconColor: "text-violet-300",
      href: "/portal/planning-cases",
    },
  ];

  return (
    <AppShell title="Command Center" subtitle="Real-time practice intelligence at a glance">
      <div className="space-y-6">
        <FactFinderBadge className="mb-2" />

        {failedSources.length > 0 && (
          <div className="flex flex-col gap-3 rounded-2xl border border-red-400/25 bg-red-950/35 p-4 text-sm text-red-100 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
              <div>
                <p className="font-semibold">Some dashboard data could not be loaded.</p>
                <p className="mt-1 text-xs text-red-200/75">Failed sources: {failedSources.map(source => source.name).join(", ")}. Saved records remain intact.</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={retryDashboardSources}>Retry all</Button>
          </div>
        )}

        {loadingSources.length > 0 && failedSources.length === 0 && (
          <div className="rounded-xl border border-violet-400/15 bg-violet-950/20 px-4 py-3 text-xs text-violet-100">
            Loading {loadingSources.map(source => source.name).join(", ")}…
          </div>
        )}

        {loadingSources.length === 0 && failedSources.length === 0 && emptySources.length > 0 && (
          <div className="rounded-xl border border-slate-700/60 bg-slate-950/40 px-4 py-3 text-xs text-slate-400">
            No saved data yet for: {emptySources.join(", ")}. These panels will populate from real workspace activity.
          </div>
        )}

        {!statsLoading && !planningCasesQuery.isLoading && !statsError && !planningCasesQuery.error && (stats?.clientCount ?? 0) === 0 && (planningCasesQuery.data ?? []).length === 0 && (
          <div className="rounded-2xl border border-violet-400/20 bg-violet-950/25 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-white">Start with a client or planning case</p>
                <p className="mt-1 text-sm text-slate-400">This dashboard intentionally shows real saved records only—no fabricated client or AUM data.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/portal/clients"><Button variant="outline" size="sm"><Users className="mr-2 h-4 w-4" />Add a client</Button></Link>
                <Link href="/portal/planning-cases"><Button size="sm"><ClipboardList className="mr-2 h-4 w-4" />Create a planning case</Button></Link>
              </div>
            </div>
          </div>
        )}

        {/* ── Header row ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30">
              <BarChart3 className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{stats?.workspaceName ?? "Dashboard"}</h2>
              <p className="text-sm text-slate-400">Practice overview &middot; Updated in real time</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/portal/advisor-chat">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                <Zap className="h-3.5 w-3.5" /> AI Advisor
              </Button>
            </Link>
            <ExportToSlides
              toolName="Dashboard"
              getSections={() => [
                {
                  title: "Practice Metrics",
                  items: statCards.map((s) => ({ label: s.label, value: s.value })),
                },
              ]}
            />
          </div>
        </div>

        {/* ── Stat cards (clickable) ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <Link key={s.label} href={s.href}>
              <Card className={`bg-gradient-to-br ${s.color} backdrop-blur-sm cursor-pointer hover:scale-[1.02] transition-transform`}>
                <CardContent className="pt-4 pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">{s.label}</span>
                    <s.icon className={`h-4 w-4 ${s.iconColor}`} />
                  </div>
                  <p className="text-2xl font-bold text-white">{statsLoading || (s.label === "Active Planning Cases" && planningCasesQuery.isLoading) ? "—" : s.value}</p>
                  <p className={`text-xs mt-1 ${s.changePositive ? "text-emerald-400" : "text-red-400"}`}>
                    {s.change}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* ── Row 1: Strategy Trend + Upcoming Meetings ──────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Strategy Trend — 2 cols */}
          <Card className="lg:col-span-2 bg-slate-800/40 border-slate-700/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" /> Strategy Activity Trend
                </CardTitle>
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-xs">
                  {analytics?.strategyTrend?.length ? `${analytics.strategyTrend[analytics.strategyTrend.length - 1].total} total` : "0 total"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {analytics?.strategyTrend && analytics.strategyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <ComposedChart data={analytics.strategyTrend}>
                    <defs>
                      <linearGradient id="stratGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#fff" }}
                      formatter={(v: number, name: string) => [v, name === "total" ? "Total Strategies" : "New This Period"]}
                    />
                    <Area type="monotone" dataKey="total" stroke="#22c55e" fill="url(#stratGrad)" strokeWidth={2} />
                    <Bar dataKey="added" fill="#22c55e" opacity={0.4} radius={[2, 2, 0, 0]} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm">
                  Run strategies to see trends
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Meetings — 1 col */}
          <Card className="bg-slate-800/40 border-slate-700/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-400" /> Upcoming Meetings
                </CardTitle>
                <Link href="/portal/meetings">
                  <Button variant="ghost" size="sm" className="text-xs text-slate-400 hover:text-white gap-1 h-7">
                    All <ChevronRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {upcomingMeetings && upcomingMeetings.length > 0 ? (
                <div className="space-y-2">
                  {upcomingMeetings.slice(0, 4).map((m) => (
                    <div key={m.id} className="flex items-start gap-2.5 py-2 border-b border-slate-800/40 last:border-0">
                      <div className="mt-0.5 p-1.5 rounded-lg bg-slate-700/50">
                        {meetingIcon(m.meetingType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white font-medium truncate">{m.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {m.clientName && <span className="text-blue-400">{m.clientName}</span>}
                          {m.clientName && " · "}
                          {formatDate(m.scheduledAt)} at {formatTime(m.scheduledAt)}
                        </p>
                        {m.location && (
                          <p className="text-[10px] text-slate-500 mt-0.5 truncate">{m.location}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-blue-500/30 text-blue-400 shrink-0">
                        {formatDate(m.scheduledAt)}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Calendar className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm mb-2">No upcoming meetings</p>
                  <Link href="/portal/meetings">
                    <Button size="sm" variant="outline" className="border-slate-600 text-xs gap-1">
                      <Plus className="h-3 w-3" /> Schedule Meeting
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Row 2: Deal Pipeline + Asset Allocation + Coaching ──────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Deal Pipeline Funnel */}
          <Card className="bg-slate-800/40 border-slate-700/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-amber-400" /> Deal Pipeline
                </CardTitle>
                <Link href="/portal/pipeline">
                  <Button variant="ghost" size="sm" className="text-xs text-slate-400 hover:text-white gap-1 h-7">
                    View All <ChevronRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {funnelData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={funnelData} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <YAxis
                      type="category" dataKey="stage" width={85}
                      tick={{ fill: "#94a3b8", fontSize: 10 }}
                      tickFormatter={(v: string) => v.replace("_", " ")}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#fff" }}
                      formatter={(v: number, name: string) => [name === "value" ? fmt$(v) : v, name === "value" ? "Value" : "Count"]}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {funnelData.map((d) => (
                        <Cell key={d.stage} fill={FUNNEL_COLORS[d.stage] ?? "#64748b"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">
                  No deals in pipeline yet
                </div>
              )}
              {conversionRate > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-700/50 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Win Rate</span>
                  <span className="text-xs font-medium text-emerald-400">{conversionRate.toFixed(1)}%</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Asset Allocation Donut */}
          <Card className="bg-slate-800/40 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                <PieChartIcon className="h-4 w-4 text-violet-400" /> Asset Allocation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allocData.length > 0 ? (
                <div className="flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie
                        data={allocData}
                        cx="50%" cy="50%"
                        innerRadius={45} outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {allocData.map((_, i) => (
                          <Cell key={i} fill={ALLOC_COLORS[i % ALLOC_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#fff" }}
                        formatter={(v: number) => [fmt$(v), ""]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1 w-full">
                    {allocData.map((d, i) => (
                      <div key={d.name} className="flex items-center gap-1.5 text-xs">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ALLOC_COLORS[i % ALLOC_COLORS.length] }} />
                        <span className="text-slate-400 truncate">{d.name}</span>
                        <span className="text-white ml-auto font-medium">{totalAlloc > 0 ? `${((d.value / totalAlloc) * 100).toFixed(0)}%` : "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-slate-500 text-sm">
                  No allocation data yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Coaching Prompts */}
          <Card className="bg-slate-800/40 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-400" /> Coaching Playbook
              </CardTitle>
            </CardHeader>
            <CardContent>
              {coaching && coaching.length > 0 ? (
                <div className="space-y-2">
                  {coaching.slice(0, 4).map((c) => (
                    <div key={c.id} className="p-2.5 rounded-lg bg-slate-700/30 border border-slate-700/50 hover:border-amber-500/30 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-amber-500/30 text-amber-400">
                          {c.tag}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">{c.prompt}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500 text-sm">
                  No coaching prompts available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Row 3: Net Worth Projection + Goals Progress ──────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Net Worth Projection */}
          <Card className="bg-slate-800/40 border-slate-700/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-400" /> Aggregate Net Worth Projection
              </CardTitle>
            </CardHeader>
            <CardContent>
              {netWorth && netWorth.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={netWorth}>
                    <defs>
                      <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v: number) => fmt$(v)} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: 8, color: "#fff" }}
                      formatter={(v: number) => [fmt$(v), "Net Worth"]}
                    />
                    <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="url(#nwGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">
                  Add clients to see projections
                </div>
              )}
            </CardContent>
          </Card>

          {/* Goals Progress — Enhanced with radial chart */}
          <Card className="bg-slate-800/40 border-slate-700/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                  <Target className="h-4 w-4 text-amber-400" /> Goal Progress
                </CardTitle>
                <Link href="/portal/goals-planning">
                  <Button variant="ghost" size="sm" className="text-xs text-slate-400 hover:text-white gap-1 h-7">
                    Manage <ChevronRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {goals && Array.isArray(goals) && goals.length > 0 ? (
                <div className="space-y-3">
                  {/* Overall completion */}
                  <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-700/30 border border-slate-700/50 mb-3">
                    <div className="relative w-12 h-12">
                      <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#334155" strokeWidth="3" />
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#22c55e" strokeWidth="3" strokeDasharray={`${goalCompletionRate}, 100`} strokeLinecap="round" />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">{goalCompletionRate.toFixed(0)}%</span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white">Overall Completion</p>
                      <p className="text-[10px] text-slate-400">{goals.filter((g) => g.currentValue >= g.targetValue).length} of {goals.length} goals achieved</p>
                    </div>
                  </div>
                  {/* Individual goals */}
                  {goals.slice(0, 4).map((g) => {
                    const pct = g.targetValue > 0 ? Math.min(100, (g.currentValue / g.targetValue) * 100) : 0;
                    const goalLabel = (g.goalType ?? "").replace(/_/g, " ");
                    return (
                      <div key={g.id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-300 capitalize">{goalLabel}</span>
                          <span className="text-xs text-slate-400">{pct.toFixed(0)}%</span>
                        </div>
                        <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-emerald-500" : pct >= 60 ? "bg-blue-500" : "bg-amber-500"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center">
                  <p className="text-slate-500 text-sm mb-2">No goals set yet</p>
                  <Link href="/portal/goals-planning">
                    <Button size="sm" variant="outline" className="border-slate-600 text-xs gap-1">
                      <Plus className="h-3 w-3" /> Set a Goal
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Row 4: Top Clients + Filterable Activity Feed ─────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Top Clients — 3 cols */}
          <Card className="lg:col-span-3 bg-slate-800/40 border-slate-700/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-400" /> Top Clients
                </CardTitle>
                <Link href="/portal/clients">
                  <Button variant="ghost" size="sm" className="text-xs text-slate-400 hover:text-white gap-1 h-7">
                    View All <ChevronRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {topClients && topClients.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700/50">
                        <th className="text-left py-2 text-xs text-slate-400 font-medium">Client</th>
                        <th className="text-right py-2 text-xs text-slate-400 font-medium">Strategies</th>
                        <th className="text-right py-2 text-xs text-slate-400 font-medium hidden sm:table-cell">Score</th>
                        <th className="text-right py-2 text-xs text-slate-400 font-medium hidden md:table-cell">State</th>
                        <th className="text-right py-2 text-xs text-slate-400 font-medium"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {topClients.map((c) => (
                        <tr key={c.id} className="border-b border-slate-800/50 hover:bg-slate-700/20 transition-colors">
                          <td className="py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-500/30 to-blue-500/30 border border-emerald-500/30 flex items-center justify-center text-xs font-bold text-white">
                                {c.name?.charAt(0) ?? "?"}
                              </div>
                              <div>
                                <p className="text-white font-medium text-xs">{c.name}</p>
                                <p className="text-slate-500 text-[10px]">Age {c.age ?? "—"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="text-right text-white font-medium text-xs">{c.strategyCount ?? 0}</td>
                          <td className="text-right hidden sm:table-cell">
                            <Badge className={`text-[10px] px-1.5 py-0 ${(c.opportunityScore ?? 0) >= 80 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : (c.opportunityScore ?? 0) >= 50 ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-slate-500/20 text-slate-400 border-slate-500/30"}`}>
                              {c.opportunityScore ?? "—"}
                            </Badge>
                          </td>
                          <td className="text-right text-slate-400 text-xs hidden md:table-cell">{c.state ?? "—"}</td>
                          <td className="text-right">
                            <Link href={`/portal/clients/${c.id}`}>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400 hover:text-white">
                                <ArrowRight className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500 text-sm">No clients yet</div>
              )}
            </CardContent>
          </Card>

          {/* Filterable Activity Feed — 2 cols */}
          <Card className="lg:col-span-2 bg-slate-800/40 border-slate-700/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
                  <Activity className="h-4 w-4 text-violet-400" /> Activity Feed
                </CardTitle>
                <div className="flex gap-1">
                  {(["all", "clients", "deals", "strategies"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setActivityFilter(f)}
                      className={`text-[9px] px-2 py-0.5 rounded-full transition-colors ${
                        activityFilter === f
                          ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredActivity.length > 0 ? (
                <div className="space-y-1 max-h-[280px] overflow-y-auto pr-1">
                  {filteredActivity.map((a) => (
                    <div key={a.id} className="flex items-start gap-2.5 py-2 border-b border-slate-800/40 last:border-0">
                      <div className="mt-0.5 p-1 rounded bg-slate-700/50">
                        {actionIcon(a.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white leading-snug">
                          <span className="font-medium">{a.clientName ?? "System"}</span>
                          <span className="text-slate-400"> — {a.action.replace(/_/g, " ").toLowerCase()}</span>
                        </p>
                        {a.summary && <p className="text-[10px] text-slate-500 mt-0.5 truncate">{a.summary}</p>}
                        <p className="text-[10px] text-slate-600 mt-0.5">{timeAgo(a.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500 text-sm">
                  {activityFilter === "all" ? "No recent activity" : `No ${activityFilter} activity`}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Row 5: Quick Actions ──────────────────────────────────────── */}
        <Card className="bg-slate-800/40 border-slate-700/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-400" /> Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              <Link href="/portal/clients">
                <Button variant="outline" className="w-full justify-start gap-2 border-slate-700 hover:border-blue-500/50 hover:bg-blue-500/5 text-sm h-10">
                  <Users className="h-4 w-4 text-blue-400" /> Clients
                </Button>
              </Link>
              <Link href="/portal/pipeline">
                <Button variant="outline" className="w-full justify-start gap-2 border-slate-700 hover:border-amber-500/50 hover:bg-amber-500/5 text-sm h-10">
                  <Briefcase className="h-4 w-4 text-amber-400" /> Pipeline
                </Button>
              </Link>
              <Link href="/portal/roth-conversion">
                <Button variant="outline" className="w-full justify-start gap-2 border-slate-700 hover:border-violet-500/50 hover:bg-violet-500/5 text-sm h-10">
                  <Shield className="h-4 w-4 text-violet-400" /> Roth Ladder
                </Button>
              </Link>
              <Link href="/portal/iul-vs-roth">
                <Button variant="outline" className="w-full justify-start gap-2 border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-sm h-10">
                  <TrendingUp className="h-4 w-4 text-emerald-400" /> IUL Engine
                </Button>
              </Link>
              <Link href="/portal/mortgage-killer">
                <Button variant="outline" className="w-full justify-start gap-2 border-slate-700 hover:border-rose-500/50 hover:bg-rose-500/5 text-sm h-10">
                  <DollarSign className="h-4 w-4 text-rose-400" /> Mortgage Killer
                </Button>
              </Link>
              <Link href="/portal/advisor-chat">
                <Button variant="outline" className="w-full justify-start gap-2 border-slate-700 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-sm h-10">
                  <Zap className="h-4 w-4 text-emerald-400" /> AI Advisor
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
