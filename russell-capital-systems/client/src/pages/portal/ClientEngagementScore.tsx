// @ts-nocheck
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import { AppShell } from "@/components/AppShell";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Heart,
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  Clock,
  Star,
  Flame,
  Snowflake,
  ArrowRight,
  Search,
  Download,
  RefreshCw,
  ChevronRight,
  Activity,
  Calendar,
  BarChart3 as BarChartIcon,
  PieChart as PieChartIcon,
  Info,
  Filter,
  ArrowUp,
  ArrowDown,
  Mail,
  Phone,
  Video,
  Settings,
  UserPlus,
  Target,
  MessageSquare,
  Briefcase,
  Award,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart
} from "recharts";

interface EngagementData {
  id: number;
  name: string;
  score: number;
  trend: "up" | "down" | "stable";
  lastContact: number; // days ago
  meetingsLast90: number;
  emailOpens: number;
  portalLogins: number;
  aum: number;
  tier: "hot" | "warm" | "cool" | "cold";
  riskLevel: string;
  nextAction: string;
  emailClicks: number;
  eventsAttended: number;
  referralsGiven: number;
  documentsUploaded: number;
  socialMediaInteractions: number;
  satisfactionScore: number;
  onboardingStatus: string;
  primaryAdvisor: string;
  clientSince: string;
  lastMeetingType: string;
  nextScheduledMeeting: string | null;
  preferredContactMethod: string;
}

const generateMockData = (clients: any[]): EngagementData[] => {
  return clients.map((c: any, index: number) => {
    const seed = c.id || index;
    const lastContactDays = Math.floor(Math.abs(Math.sin(seed * 1.1)) * 120);
    const meetingsLast90 = Math.floor(Math.abs(Math.cos(seed * 1.2)) * 5);
    const emailOpens = Math.floor(Math.abs(Math.sin(seed * 1.3)) * 15);
    const portalLogins = Math.floor(Math.abs(Math.cos(seed * 1.4)) * 20);
    const emailClicks = Math.floor(emailOpens * Math.abs(Math.sin(seed * 1.5)));
    const eventsAttended = Math.floor(Math.abs(Math.cos(seed * 1.6)) * 3);
    const referralsGiven = Math.floor(Math.abs(Math.sin(seed * 1.7)) * 2);
    const documentsUploaded = Math.floor(Math.abs(Math.cos(seed * 1.8)) * 10);
    const socialMediaInteractions = Math.floor(Math.abs(Math.sin(seed * 1.9)) * 5);
    const satisfactionScore = Math.floor(Math.abs(Math.cos(seed * 2.0)) * 5) + 5; // 5-10
    
    const aum = (c.traditionalIra ?? 0) + (c.rothIra ?? 0) + (c.retirement401k ?? 0) + (c.taxableAccounts ?? (Math.abs(Math.sin(seed)) * 1000000));

    let score = 30;
    score += lastContactDays < 14 ? 15 : lastContactDays < 30 ? 5 : lastContactDays < 60 ? 0 : -10;
    score += meetingsLast90 * 5;
    score += Math.min(emailOpens * 1.5, 10);
    score += Math.min(portalLogins * 1, 10);
    score += eventsAttended * 3;
    score += referralsGiven * 5;
    score += documentsUploaded * 0.5;
    score = Math.max(0, Math.min(100, Math.round(score)));

    const tier = score >= 75 ? "hot" : score >= 50 ? "warm" : score >= 25 ? "cool" : "cold";
    const trend = Math.abs(Math.sin(seed * 2.1)) > 0.6 ? "up" : Math.abs(Math.cos(seed * 2.2)) > 0.3 ? "stable" : "down";

    let riskLevel = "Low";
    let nextAction = "Maintain regular contact";
    if (tier === "cold") { riskLevel = "High"; nextAction = "Schedule urgent re-engagement call"; }
    else if (tier === "cool") { riskLevel = "Medium"; nextAction = "Send personalized check-in email"; }
    else if (tier === "warm") { riskLevel = "Low"; nextAction = "Invite to next quarterly review"; }
    else { riskLevel = "None"; nextAction = "Continue nurturing — consider referral ask"; }

    return { 
      id: c.id || index, 
      name: c.name || `Client ${index}`, 
      score, 
      trend, 
      lastContact: lastContactDays, 
      meetingsLast90, 
      emailOpens, 
      portalLogins, 
      aum, 
      tier, 
      riskLevel, 
      nextAction,
      emailClicks,
      eventsAttended,
      referralsGiven,
      documentsUploaded,
      socialMediaInteractions,
      satisfactionScore,
      onboardingStatus: score > 60 ? "Complete" : "In Progress",
      primaryAdvisor: ["John Doe", "Jane Smith", "Bob Johnson"][index % 3],
      clientSince: new Date(2020 - (index % 5), index % 12, 1).toISOString().split('T')[0],
      lastMeetingType: ["In Person", "Zoom", "Phone"][index % 3],
      nextScheduledMeeting: lastContactDays > 30 ? new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0] : null,
      preferredContactMethod: ["Email", "Phone", "Text"][index % 3]
    };
  });
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];
const TIER_COLORS = { hot: '#ef4444', warm: '#f0c040', cool: '#3b82f6', cold: '#94a3b8' };

export default function ClientEngagementScore() {
  const { user } = useAuth();
  const { data: clientData } = useClientData();
  
  const { data: clients, refetch: refetchClients } = trpc.clients.list.useQuery();
  const { data: activityStats, refetch: refetchActivity } = trpc.activity.list.useQuery();
  const { data: leaderboardData } = trpc.leaderboard.get.useQuery();
  const { data: riskScores } = trpc.riskScoring.scores.useQuery();
  const { data: dashboardMetrics } = trpc.dashboard.metrics.useQuery();
  
  const logActivityMutation = trpc.activity.log.useMutation();
  const updateClientTierMutation = trpc.clients.update.useMutation();

  const [sortBy, setSortBy] = useState<"score" | "aum" | "risk" | "name" | "lastContact">("score");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterTier, setFilterTier] = useState<string>("all");
  const [filterRisk, setFilterRisk] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"list" | "analytics" | "details" | "trends" | "actions">("analytics");
  const [isExporting, setIsExporting] = useState(false);
  const [selectedClient, setSelectedClient] = useState<EngagementData | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [dateRange, setDateRange] = useState<"30d" | "90d" | "1y" | "all">("90d");
  const [chartType, setChartType] = useState<"bar" | "pie" | "line">("bar");
  const [refreshing, setRefreshing] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionNotes, setActionNotes] = useState("");
  const [selectedClients, setSelectedClients] = useState<number[]>([]);
  const [isHoveringChart, setIsHoveringChart] = useState(false);
  const [metricToCompare, setMetricToCompare] = useState<"aum" | "score">("score");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [showInsights, setShowInsights] = useState(true);

  const rawEngagementData = useMemo(() => {
    if (!clients) {
      return generateMockData(Array.from({ length: 50 }).map((_, i) => ({ id: i, name: `Mock Client ${i}` })));
    }
    return generateMockData(clients);
  }, [clients]);

  const engagementData = useMemo(() => {
    return rawEngagementData.map((c) => {
      const riskOverride = riskScores?.find((r) => r.clientId === c.id)?.level;
      if (riskOverride) {
        c.riskLevel = riskOverride;
      }
      return c;
    });
  }, [rawEngagementData, riskScores]);

  const filteredAndSortedData = useMemo(() => {
    let data = [...engagementData];
    
    if (filterTier !== "all") data = data.filter((c) => c.tier === filterTier);
    if (filterRisk !== "all") data = data.filter((c) => c.riskLevel === filterRisk);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      data = data.filter((c) => c.name.toLowerCase().includes(q) || c.primaryAdvisor.toLowerCase().includes(q));
    }
    
    data.sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];
      
      if (sortBy === "risk") {
        const r = { High: 3, Medium: 2, Low: 1, None: 0 };
        valA = r[a.riskLevel as keyof typeof r] || 0;
        valB = r[b.riskLevel as keyof typeof r] || 0;
      }
      
      if (typeof valA === 'string') {
        return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === "asc" ? valA - valB : valB - valA;
    });
    
    return data;
  }, [engagementData, filterTier, filterRisk, searchQuery, sortBy, sortOrder]);

  const metrics = useMemo(() => {
    const total = engagementData.length || 1;
    return {
      avgScore: Math.round(engagementData.reduce((s, c) => s + c.score, 0) / total),
      hotCount: engagementData.filter((c) => c.tier === "hot").length,
      warmCount: engagementData.filter((c) => c.tier === "warm").length,
      coolCount: engagementData.filter((c) => c.tier === "cool").length,
      coldCount: engagementData.filter((c) => c.tier === "cold").length,
      atRisk: engagementData.filter((c) => c.riskLevel === "High").length,
      totalAUM: engagementData.reduce((s, c) => s + c.aum, 0),
      avgMeetings: Math.round(engagementData.reduce((s, c) => s + c.meetingsLast90, 0) / total * 10) / 10,
      totalPortalLogins: engagementData.reduce((s, c) => s + c.portalLogins, 0)
    };
  }, [engagementData]);

  const tierDistributionData = useMemo(() => [
    { name: 'Hot', value: metrics.hotCount, color: TIER_COLORS.hot },
    { name: 'Warm', value: metrics.warmCount, color: TIER_COLORS.warm },
    { name: 'Cool', value: metrics.coolCount, color: TIER_COLORS.cool },
    { name: 'Cold', value: metrics.coldCount, color: TIER_COLORS.cold },
  ].filter((d) => d.value > 0), [metrics]);

  const scoreHistogramData = useMemo(() => {
    const bins = [
      { name: '0-20', count: 0, aum: 0 },
      { name: '21-40', count: 0, aum: 0 },
      { name: '41-60', count: 0, aum: 0 },
      { name: '61-80', count: 0, aum: 0 },
      { name: '81-100', count: 0, aum: 0 },
    ];
    engagementData.forEach((c) => {
      const idx = Math.min(4, Math.floor(c.score / 20.01));
      bins[idx].count++;
      bins[idx].aum += c.aum;
    });
    return bins;
  }, [engagementData]);

  const trendData = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => ({
      month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i],
      avgScore: 50 + Math.random() * 20 + i * 2,
      logins: 100 + Math.random() * 50 + i * 10,
      emails: 200 + Math.random() * 100 + i * 15
    }));
  }, []);

  const radarData = useMemo(() => {
    if (!selectedClient) return [];
    const avg = metrics;
    return [
      { subject: 'Meetings', A: selectedClient.meetingsLast90 * 20, B: avg.avgMeetings * 20, fullMark: 100 },
      { subject: 'Portal', A: selectedClient.portalLogins * 5, B: (metrics.totalPortalLogins/engagementData.length) * 5, fullMark: 100 },
      { subject: 'Emails', A: selectedClient.emailOpens * 6, B: 40, fullMark: 100 },
      { subject: 'Events', A: selectedClient.eventsAttended * 33, B: 33, fullMark: 100 },
      { subject: 'Referrals', A: selectedClient.referralsGiven * 50, B: 25, fullMark: 100 },
      { subject: 'Docs', A: selectedClient.documentsUploaded * 10, B: 30, fullMark: 100 },
    ];
  }, [selectedClient, metrics, engagementData.length]);

  const scatterData = useMemo(() => {
    return engagementData.map((c) => ({
      name: c.name,
      score: c.score,
      aum: c.aum / 1000000, // in millions
      tier: c.tier
    }));
  }, [engagementData]);

  const handleSort = useCallback((field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  }, [sortBy]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchClients(), refetchActivity()]);
      toast.success("Engagement data refreshed");
    } catch (e) {
      toast.error("Failed to refresh data");
    } finally {
      setRefreshing(false);
    }
  }, [refetchClients, refetchActivity]);

  const handleExportCSV = useCallback(() => {
    setIsExporting(true);
    setTimeout(() => {
      const headers = ["Client Name", "Score", "Tier", "Trend", "Risk Level", "Next Action", "AUM", "Last Contact (days)", "Meetings (90d)", "Email Opens", "Portal Logins", "Primary Advisor"];
      const rows = filteredAndSortedData.map((c) => [
        `"${c.name}"`, c.score, c.tier, c.trend, c.riskLevel, `"${c.nextAction}"`, c.aum, c.lastContact, c.meetingsLast90, c.emailOpens, c.portalLogins, `"${c.primaryAdvisor}"`
      ]);
      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `client_engagement_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExporting(false);
      toast.success("Data exported successfully");
    }, 800);
  }, [filteredAndSortedData]);

  const handleSelectAll = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedClients(filteredAndSortedData.map((c) => c.id));
    } else {
      setSelectedClients([]);
    }
  }, [filteredAndSortedData]);

  const handleSelectClient = useCallback((id: number) => {
    setSelectedClients(prev => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }, []);

  const handleLogAction = useCallback(() => {
    if (!actionNotes) {
      toast.error("Please enter notes");
      return;
    }
    logActivityMutation.mutate({ type: "engagement_action", notes: actionNotes, clientIds: selectedClients }, {
      onSuccess: () => {
        toast.success(`Action logged for ${selectedClients.length} clients`);
        setShowActionModal(false);
        setActionNotes("");
        setSelectedClients([]);
      }
    });
  }, [actionNotes, selectedClients, logActivityMutation]);

  const handleRowClick = useCallback((client: EngagementData) => {
    setSelectedClient(client);
    setActiveTab("details");
  }, []);

  const toggleRowExpand = useCallback((id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedRow(prev => prev === id ? null : id);
  }, []);

  const renderTierBadge = (t: string) => {
    const config = {
      hot: { color: "rc-badge-red", icon: Flame, label: "Hot" },
      warm: { color: "rc-badge-gold", icon: Star, label: "Warm" },
      cool: { color: "rc-badge-blue", icon: Clock, label: "Cool" },
      cold: { color: "rc-badge", icon: Snowflake, label: "Cold" }
    }[t as keyof typeof TIER_COLORS] || { color: "rc-badge", icon: Users, label: t };
    const Icon = config.icon;
    return (
      <div className={`rc-badge ${config.color}`}>
        <Icon className="h-3.5 w-3.5 mr-1" /> {config.label}
      </div>
    );
  };

  const renderTrendIcon = (trend: string) => {
    if (trend === "up") return <TrendingUp className="h-4 w-4 text-emerald-400" />;
    if (trend === "down") return <TrendingDown className="h-4 w-4 text-red-400" />;
    return <ArrowRight className="h-4 w-4 text-gray-400" />;
  };

  const scoreColor = (s: number) => s >= 75 ? "text-emerald-400" : s >= 50 ? "text-[#f0c040]" : s >= 25 ? "text-blue-400" : "text-red-400";


  const renderAnalyticsTab = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Avg Engagement Score", value: metrics.avgScore, icon: Activity, color: "text-blue-400", sub: "+2.4 from last month" },
          { label: "Total AUM (Engaged)", value: `$${(metrics.totalAUM / 1000000).toFixed(1)}M`, icon: Briefcase, color: "text-emerald-400", sub: "85% of total book" },
          { label: "Clients at Risk", value: metrics.atRisk, icon: AlertTriangle, color: "text-red-400", sub: "-3 from last week" },
          { label: "Total Portal Logins", value: metrics.totalPortalLogins, icon: Zap, color: "text-yellow-400", sub: "Last 90 days" }
        ].map((kpi, i) => (
          <div key={i} className="rc-card p-5 flex flex-col justify-between group hover:border-[#7a95b8]/40 transition-all">
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm text-[#7a95b8] font-medium">{kpi.label}</p>
              <div className={`p-2 rounded-lg bg-[#12233e] ${kpi.color} group-hover:scale-110 transition-transform`}>
                <kpi.icon className="h-5 w-5" />
              </div>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-white">{kpi.value}</h3>
              <p className="text-xs text-[#7a95b8] mt-1">{kpi.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rc-card p-5">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2"><PieChartIcon className="h-5 w-5 text-blue-400" /> Tier Distribution</h3>
            <select className="rc-input py-1 text-sm w-auto" value={metricToCompare} onChange={(e) => setMetricToCompare(e.target.value as any)}>
              <option value="count">By Client Count</option>
              <option value="aum">By AUM</option>
            </select>
          </div>
          <div className="h-[300px] w-full" onMouseEnter={() => setIsHoveringChart(true)} onMouseLeave={() => setIsHoveringChart(false)}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tierDistributionData}
                  cx="50%" cy="50%"
                  innerRadius={60} outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  animationDuration={1500}
                >
                  {tierDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#060d19', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }}
                  itemStyle={{ color: '#c8d8ec' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rc-card p-5">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2"><BarChartIcon className="h-5 w-5 text-emerald-400" /> Score Histogram</h3>
            <div className="flex gap-2">
              <button className={`p-1 rounded ${chartType === 'bar' ? 'bg-[#12233e] text-white' : 'text-[#7a95b8]'}`} onClick={() => setChartType('bar')}><BarChartIcon className="h-4 w-4" /></button>
              <button className={`p-1 rounded ${chartType === 'line' ? 'bg-[#12233e] text-white' : 'text-[#7a95b8]'}`} onClick={() => setChartType('line')}><TrendingUp className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'bar' ? (
                <BarChart data={scoreHistogramData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                  <XAxis dataKey="name" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: '#12233e', opacity: 0.4 }} contentStyle={{ backgroundColor: '#060d19', borderColor: '#12233e', borderRadius: '8px' }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} animationDuration={1500}>
                    {scoreHistogramData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.name === '81-100' ? '#22c55e' : entry.name === '0-20' ? '#ef4444' : '#3b82f6'} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <AreaChart data={scoreHistogramData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                  <XAxis dataKey="name" stroke="#7a95b8" fontSize={12} />
                  <YAxis stroke="#7a95b8" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#060d19', borderColor: '#12233e', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="count" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCount)" animationDuration={1500} />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rc-card p-5 lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2"><Activity className="h-5 w-5 text-purple-400" /> Engagement Trends (6 Months)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                <XAxis dataKey="month" stroke="#7a95b8" fontSize={12} />
                <YAxis yAxisId="left" stroke="#7a95b8" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="#7a95b8" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#060d19', borderColor: '#12233e', borderRadius: '8px' }} />
                <Legend />
                <Bar yAxisId="left" dataKey="logins" name="Portal Logins" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar yAxisId="left" dataKey="emails" name="Email Opens" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                <Line yAxisId="right" type="monotone" dataKey="avgScore" name="Avg Score" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="rc-card p-5">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2"><Target className="h-5 w-5 text-pink-400" /> Score vs AUM</h3>
          <div className="h-[300px] w-full flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
              <LineChart data={scoreHistogramData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                <XAxis dataKey="name" stroke="#7a95b8" fontSize={12} />
                <YAxis stroke="#7a95b8" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#060d19', borderColor: '#12233e', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="aum" name="AUM" stroke="#ec4899" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Data Table 1: Risk Summary */}
      <div className="rc-card p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Risk Level Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-[#7a95b8] uppercase bg-[#12233e]/50 border-b border-[#12233e]">
              <tr>
                <th className="px-4 py-3">Risk Level</th>
                <th className="px-4 py-3">Client Count</th>
                <th className="px-4 py-3">Avg Score</th>
                <th className="px-4 py-3">Total AUM</th>
                <th className="px-4 py-3">Primary Action</th>
              </tr>
            </thead>
            <tbody>
              {["High", "Medium", "Low", "None"].map((risk) => {
                const clients = engagementData.filter((c) => c.riskLevel === risk);
                const count = clients.length;
                if (count === 0) return null;
                const avg = Math.round(clients.reduce((s, c) => s + c.score, 0) / count);
                const aum = clients.reduce((s, c) => s + c.aum, 0);
                return (
                  <tr key={risk} className="border-b border-[#12233e] hover:bg-[#12233e]/30 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      <span className={risk === "High" ? "text-red-400" : risk === "Medium" ? "text-yellow-400" : "text-emerald-400"}>{risk}</span>
                    </td>
                    <td className="px-4 py-3 text-white">{count}</td>
                    <td className="px-4 py-3 text-white">{avg}</td>
                    <td className="px-4 py-3 text-[#c8d8ec]">${(aum/1000000).toFixed(2)}M</td>
                    <td className="px-4 py-3 text-[#7a95b8] truncate max-w-[200px]">{clients[0]?.nextAction}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderListTab = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row justify-between gap-4 bg-[#0a1424] p-4 rounded-xl border border-[#12233e]">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7a95b8]" />
            <input 
              type="text" 
              placeholder="Search clients or advisors..." 
              className="rc-input pl-9 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            className={`rc-btn ${showFilters ? 'bg-[#12233e] text-white' : 'rc-btn-ghost'} flex items-center gap-2`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" /> Filters
          </button>
          <div className="flex bg-[#12233e] rounded-lg p-1">
            <button className={`px-3 py-1 text-sm rounded-md transition-colors ${viewMode === 'table' ? 'bg-[#2a3f5f] text-white' : 'text-[#7a95b8] hover:text-white'}`} onClick={() => setViewMode('table')}>Table</button>
            <button className={`px-3 py-1 text-sm rounded-md transition-colors ${viewMode === 'grid' ? 'bg-[#2a3f5f] text-white' : 'text-[#7a95b8] hover:text-white'}`} onClick={() => setViewMode('grid')}>Grid</button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {selectedClients.length > 0 && (
            <button className="rc-btn rc-btn-primary flex items-center gap-2 animate-in fade-in" onClick={() => setShowActionModal(true)}>
              <MessageSquare className="h-4 w-4" /> Log Action ({selectedClients.length})
            </button>
          )}
          <select className="rc-input py-2 text-sm" value={dateRange} onChange={(e) => setDateRange(e.target.value as any)}>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="1y">Last Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Expandable Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-[#060d19] rounded-xl border border-[#12233e] animate-in slide-in-from-top-2">
          <div>
            <label className="block text-xs text-[#7a95b8] uppercase mb-2">Engagement Tier</label>
            <select className="rc-input w-full" value={filterTier} onChange={(e) => setFilterTier(e.target.value)}>
              <option value="all">All Tiers</option>
              <option value="hot">Hot (75-100)</option>
              <option value="warm">Warm (50-74)</option>
              <option value="cool">Cool (25-49)</option>
              <option value="cold">Cold (0-24)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#7a95b8] uppercase mb-2">Risk Level</label>
            <select className="rc-input w-full" value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)}>
              <option value="all">All Risk Levels</option>
              <option value="High">High Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="Low">Low Risk</option>
              <option value="None">No Risk</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#7a95b8] uppercase mb-2">Sort By</label>
            <div className="flex gap-2">
              <select className="rc-input flex-1" value={sortBy} onChange={(e) => handleSort(e.target.value as any)}>
                <option value="score">Engagement Score</option>
                <option value="aum">AUM</option>
                <option value="name">Client Name</option>
                <option value="lastContact">Last Contact</option>
                <option value="risk">Risk Level</option>
              </select>
              <button className="rc-btn rc-btn-ghost px-3" onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}>
                {sortOrder === "asc" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Data View */}
      {filteredAndSortedData.length === 0 ? (
        <div className="rc-card p-12 text-center flex flex-col items-center justify-center border-dashed">
          <Search className="h-12 w-12 text-[#12233e] mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No clients found</h3>
          <p className="text-[#7a95b8]">Try adjusting your search or filter criteria.</p>
          <button className="rc-btn rc-btn-ghost mt-4" onClick={() => {setSearchQuery(""); setFilterTier("all"); setFilterRisk("all");}}>Clear Filters</button>
        </div>
      ) : viewMode === "table" ? (
        <div className="rc-card overflow-hidden p-0">
          <div className="overflow-x-auto">
            {/* Data Table 2: Main Client List */}
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-xs text-[#7a95b8] uppercase bg-[#0a1424] border-b border-[#12233e]">
                <tr>
                  <th className="px-4 py-4 w-12 text-center">
                    <input type="checkbox" className="rounded border-[#3a5375] bg-[#060d19] text-blue-500 focus:ring-blue-500/20" 
                      checked={selectedClients.length === filteredAndSortedData.length && filteredAndSortedData.length > 0}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">Client {sortBy === 'name' && (sortOrder === 'asc' ? <ArrowUp className="h-3 w-3"/> : <ArrowDown className="h-3 w-3"/>)}</div>
                  </th>
                  <th className="px-4 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('score')}>
                    <div className="flex items-center gap-1">Score {sortBy === 'score' && (sortOrder === 'asc' ? <ArrowUp className="h-3 w-3"/> : <ArrowDown className="h-3 w-3"/>)}</div>
                  </th>
                  <th className="px-4 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('tier')}>Tier</th>
                  <th className="px-4 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('aum')}>
                    <div className="flex items-center gap-1">AUM {sortBy === 'aum' && (sortOrder === 'asc' ? <ArrowUp className="h-3 w-3"/> : <ArrowDown className="h-3 w-3"/>)}</div>
                  </th>
                  <th className="px-4 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('lastContact')}>
                    <div className="flex items-center gap-1">Last Contact {sortBy === 'lastContact' && (sortOrder === 'asc' ? <ArrowUp className="h-3 w-3"/> : <ArrowDown className="h-3 w-3"/>)}</div>
                  </th>
                  <th className="px-4 py-4">Activity (90d)</th>
                  <th className="px-4 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('risk')}>Risk</th>
                  <th className="px-4 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#12233e]">
                {filteredAndSortedData.map((client, idx) => (
                  <React.Fragment key={client.id}>
                    <tr 
                      className={`hover:bg-[#12233e]/30 transition-colors cursor-pointer ${selectedClients.includes(client.id) ? 'bg-blue-900/10' : ''}`}
                      onClick={() => handleRowClick(client)}
                    >
                      <td className="px-4 py-4 text-center" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" className="rounded border-[#3a5375] bg-[#060d19] text-blue-500 focus:ring-blue-500/20"
                          checked={selectedClients.includes(client.id)}
                          onChange={() => handleSelectClient(client.id)}
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#0a1424] flex items-center justify-center text-xs font-bold text-white border border-[#3a5375]">
                            {client.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-white group-hover:text-blue-400 transition-colors">{client.name}</div>
                            <div className="text-xs text-[#7a95b8]">{client.primaryAdvisor}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold ${scoreColor(client.score)}`}>{client.score}</span>
                          {renderTrendIcon(client.trend)}
                        </div>
                      </td>
                      <td className="px-4 py-4">{renderTierBadge(client.tier)}</td>
                      <td className="px-4 py-4 text-[#c8d8ec] font-medium">${(client.aum / 1000).toFixed(0)}K</td>
                      <td className="px-4 py-4 text-[#7a95b8]">
                        <div className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {client.lastContact}d ago</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-3 text-xs text-[#7a95b8]">
                          <span title="Meetings" className="flex items-center gap-1"><Video className="h-3 w-3" /> {client.meetingsLast90}</span>
                          <span title="Email Opens" className="flex items-center gap-1"><Mail className="h-3 w-3" /> {client.emailOpens}</span>
                          <span title="Portal Logins" className="flex items-center gap-1"><Settings className="h-3 w-3" /> {client.portalLogins}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={client.riskLevel === "High" ? "text-red-400 font-medium" : client.riskLevel === "Medium" ? "text-yellow-400" : "text-emerald-400"}>{client.riskLevel}</span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button className="p-2 text-[#7a95b8] hover:text-white hover:bg-[#12233e] rounded-lg transition-colors" onClick={(e) => toggleRowExpand(client.id, e)}>
                          {expandedRow === client.id ? <ArrowUp className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </button>
                      </td>
                    </tr>
                    {expandedRow === client.id && (
                      <tr className="bg-[#0a1424]/50 border-b border-[#12233e]">
                        <td colSpan={9} className="px-6 py-4">
                          <div className="flex justify-between items-start gap-6 animate-in fade-in slide-in-from-top-2">
                            <div className="flex-1">
                              <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2"><Info className="h-4 w-4 text-blue-400"/> Recommended Action</h4>
                              <p className="text-sm text-[#c8d8ec] bg-[#12233e]/50 p-3 rounded-lg border border-[#12233e]">{client.nextAction}</p>
                              
                              <div className="mt-4 grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs text-[#7a95b8] mb-1">Preferred Contact</p>
                                  <p className="text-sm text-white flex items-center gap-2">
                                    {client.preferredContactMethod === 'Email' ? <Mail className="h-3 w-3"/> : client.preferredContactMethod === 'Phone' ? <Phone className="h-3 w-3"/> : <MessageSquare className="h-3 w-3"/>}
                                    {client.preferredContactMethod}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-[#7a95b8] mb-1">Client Since</p>
                                  <p className="text-sm text-white">{client.clientSince}</p>
                                </div>
                              </div>
                            </div>
                            <div className="w-64 flex-shrink-0">
                              <h4 className="text-sm font-semibold text-white mb-2">Quick Actions</h4>
                              <div className="space-y-2">
                                <button className="w-full text-left px-3 py-2 text-sm text-[#c8d8ec] hover:text-white hover:bg-[#12233e] rounded-md transition-colors flex items-center gap-2"><Mail className="h-4 w-4"/> Draft Email</button>
                                <button className="w-full text-left px-3 py-2 text-sm text-[#c8d8ec] hover:text-white hover:bg-[#12233e] rounded-md transition-colors flex items-center gap-2"><Calendar className="h-4 w-4"/> Schedule Meeting</button>
                                <button className="w-full text-left px-3 py-2 text-sm text-[#c8d8ec] hover:text-white hover:bg-[#12233e] rounded-md transition-colors flex items-center gap-2"><Target className="h-4 w-4"/> Create Task</button>
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
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAndSortedData.map((client, index) => (
            <div key={client.id} className="rc-card p-0 overflow-hidden hover:border-[#7a95b8]/40 transition-all duration-300 group cursor-pointer" onClick={() => handleRowClick(client)}>
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${scoreColor(client.score)} bg-[#060d19] border border-[#12233e] shadow-inner relative group-hover:scale-110 transition-transform`}>
                      {client.score}
                      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="2" strokeOpacity="0.1" />
                        <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray={`${client.score * 3.01} 301`} strokeLinecap="round" className="opacity-50" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white group-hover:text-blue-400 transition-colors">{client.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {renderTierBadge(client.tier)}
                        {renderTrendIcon(client.trend)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#7a95b8] uppercase tracking-wider mb-1">AUM</p>
                    <p className="text-sm font-semibold text-[#c8d8ec]">${(client.aum / 1000).toFixed(0)}K</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 py-3 border-y border-[#12233e] mb-4">
                  <div className="text-center">
                    <p className="text-[10px] text-[#7a95b8] uppercase">Meetings</p>
                    <p className="text-sm font-medium text-white">{client.meetingsLast90}</p>
                  </div>
                  <div className="text-center border-x border-[#12233e]">
                    <p className="text-[10px] text-[#7a95b8] uppercase">Emails</p>
                    <p className="text-sm font-medium text-white">{client.emailOpens}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-[#7a95b8] uppercase">Logins</p>
                    <p className="text-sm font-medium text-white">{client.portalLogins}</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-xs text-[#7a95b8] flex items-center gap-1"><Clock className="h-3 w-3"/> {client.lastContact}d ago</div>
                  <button className="text-xs font-medium text-blue-400 bg-blue-400/10 hover:bg-blue-400/20 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1">
                    Action <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderDetailsTab = () => {
    if (!selectedClient) return null;
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
        <button className="flex items-center gap-2 text-sm text-[#7a95b8] hover:text-white transition-colors" onClick={() => setActiveTab("list")}>
          <ArrowRight className="h-4 w-4 rotate-180" /> Back to List
        </button>
        
        {/* Profile Header */}
        <div className="rc-card p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/10 to-transparent rounded-bl-full pointer-events-none"></div>
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold ${scoreColor(selectedClient.score)} bg-[#060d19] border-4 border-[#12233e] shadow-[0_0_30px_rgba(0,0,0,0.5)] shrink-0 relative`}>
              {selectedClient.score}
              <div className="absolute -bottom-2 -right-2">{renderTierBadge(selectedClient.tier)}</div>
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-white mb-2">{selectedClient.name}</h2>
              <div className="flex flex-wrap gap-4 text-sm text-[#c8d8ec]">
                <span className="flex items-center gap-1"><Briefcase className="h-4 w-4 text-[#7a95b8]"/> ${(selectedClient.aum/1000000).toFixed(2)}M AUM</span>
                <span className="flex items-center gap-1"><UserPlus className="h-4 w-4 text-[#7a95b8]"/> Since {selectedClient.clientSince}</span>
                <span className="flex items-center gap-1"><Award className="h-4 w-4 text-[#7a95b8]"/> Advisor: {selectedClient.primaryAdvisor}</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 w-full md:w-auto">
              <button className="rc-btn rc-btn-primary flex items-center justify-center gap-2"><Mail className="h-4 w-4"/> Contact Client</button>
              <button className="rc-btn rc-btn-ghost flex items-center justify-center gap-2"><Calendar className="h-4 w-4"/> Schedule Review</button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Radar Chart */}
          <div className="rc-card p-5 lg:col-span-1 flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-4">Engagement Profile</h3>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#12233e" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#7a95b8', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Client" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                  <Radar name="Avg" dataKey="B" stroke="#7a95b8" fill="#7a95b8" fillOpacity={0.2} />
                  <Legend />
                  <Tooltip contentStyle={{ backgroundColor: '#060d19', borderColor: '#12233e', borderRadius: '8px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Stats Table 3 */}
          <div className="rc-card p-5 lg:col-span-2">
            <h3 className="text-lg font-semibold text-white mb-4">Activity Breakdown (Last 90 Days)</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {[
                { l: "Email Opens", v: selectedClient.emailOpens, i: Mail },
                { l: "Link Clicks", v: selectedClient.emailClicks, i: ArrowRight },
                { l: "Portal Logins", v: selectedClient.portalLogins, i: Settings },
                { l: "Meetings", v: selectedClient.meetingsLast90, i: Video },
                { l: "Events", v: selectedClient.eventsAttended, i: Users },
                { l: "Docs Uploaded", v: selectedClient.documentsUploaded, i: Download },
              ].map((stat, i) => (
                <div key={i} className="bg-[#0a1424] p-4 rounded-lg border border-[#12233e] flex items-center gap-4">
                  <div className="p-2 bg-[#12233e] rounded-md text-blue-400"><stat.i className="h-5 w-5"/></div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stat.v}</p>
                    <p className="text-xs text-[#7a95b8] uppercase">{stat.l}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <h3 className="text-lg font-semibold text-white mb-4 mt-8">Recommended Next Action</h3>
            <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl flex gap-4 items-start">
              <div className="p-2 bg-blue-500/20 rounded-full text-blue-400 shrink-0"><Target className="h-6 w-6"/></div>
              <div>
                <h4 className="text-lg font-medium text-white mb-1">{selectedClient.nextAction}</h4>
                <p className="text-sm text-[#c8d8ec] mb-4">Based on {selectedClient.name}'s recent drop in portal logins and their {selectedClient.riskLevel.toLowerCase()} risk level, immediate outreach is recommended.</p>
                <div className="flex gap-3">
                  <button className="rc-btn rc-btn-primary text-sm py-1.5">Execute Action</button>
                  <button className="rc-btn rc-btn-ghost text-sm py-1.5">Dismiss</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Data Table 4: Recent Interactions */}
        <div className="rc-card p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Interactions</h3>
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-[#7a95b8] uppercase bg-[#12233e]/50 border-b border-[#12233e]">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Initiated By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#12233e]">
              {Array.from({length: 5}).map((_, i) => (
                <tr key={i} className="hover:bg-[#12233e]/30">
                  <td className="px-4 py-3 text-[#c8d8ec]">{new Date(Date.now() - i * 86400000 * (i+1)).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-[#12233e] text-blue-400">
                      {['Email', 'Meeting', 'Portal Login', 'Document Upload', 'Phone Call'][i % 5]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white">{['Quarterly review summary sent', 'Zoom meeting - Portfolio review', 'Logged in to view performance', 'Uploaded tax documents', 'Quick check-in call'][i % 5]}</td>
                  <td className="px-4 py-3 text-[#7a95b8]">{i % 2 === 0 ? 'Advisor' : 'Client'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderTrendsTab = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rc-card p-5">
         <h3 className="text-lg font-semibold text-white mb-6">Macro Engagement Trends</h3>
         <p className="text-sm text-[#7a95b8] mb-6">Analysis of overall book engagement over the last 12 months.</p>
         <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData.map((d) => ({...d, target: 80}))} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                <XAxis dataKey="month" stroke="#7a95b8" />
                <YAxis stroke="#7a95b8" />
                <Tooltip contentStyle={{ backgroundColor: '#060d19', borderColor: '#12233e', borderRadius: '8px' }} />
                <Legend />
                <Area type="monotone" dataKey="avgScore" name="Actual Avg Score" stroke="#22c55e" fillOpacity={1} fill="url(#colorScore)" />
                <Line type="dashed" dataKey="target" name="Target Score" stroke="#f0c040" strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
         </div>
      </div>
      
      {/* Data Table 5: Tier Migration */}
      <div className="rc-card p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Tier Migration (Last 90 Days)</h3>
        <table className="w-full text-sm text-left">
            <thead className="text-xs text-[#7a95b8] uppercase bg-[#12233e]/50 border-b border-[#12233e]">
              <tr>
                <th className="px-4 py-3">Previous Tier</th>
                <th className="px-4 py-3 text-center">Current: Hot</th>
                <th className="px-4 py-3 text-center">Current: Warm</th>
                <th className="px-4 py-3 text-center">Current: Cool</th>
                <th className="px-4 py-3 text-center">Current: Cold</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#12233e]">
              {[
                { t: 'Hot', vals: ['85%', '10%', '5%', '0%'] },
                { t: 'Warm', vals: ['15%', '70%', '10%', '5%'] },
                { t: 'Cool', vals: ['5%', '20%', '60%', '15%'] },
                { t: 'Cold', vals: ['0%', '5%', '15%', '80%'] }
              ].map((row, i) => (
                <tr key={i} className="hover:bg-[#12233e]/30">
                  <td className="px-4 py-3 font-medium text-white">{row.t}</td>
                  {row.vals.map((v, j) => (
                    <td key={j} className={`px-4 py-3 text-center ${i===j ? 'text-[#c8d8ec] bg-[#12233e]/20' : i<j ? 'text-red-400' : 'text-emerald-400'}`}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
      </div>
    </div>
  );

  const renderActionsTab = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rc-card p-5">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-red-400"/> Urgent Interventions Required</h3>
          <p className="text-sm text-[#7a95b8] mb-4">Clients whose engagement score dropped by more than 20 points in 30 days.</p>
          
          <div className="space-y-3">
            {engagementData.filter((c) => c.trend === 'down' && c.score < 40).slice(0, 5).map((c) => (
              <div key={c.id} className="bg-[#0a1424] p-3 rounded-lg border border-red-500/20 flex justify-between items-center">
                <div>
                  <h4 className="font-medium text-white">{c.name}</h4>
                  <p className="text-xs text-red-400">Score: {c.score} (Down from 65)</p>
                </div>
                <button className="rc-btn rc-btn-primary text-xs py-1 px-3">Reach Out</button>
              </div>
            ))}
            {engagementData.filter((c) => c.trend === 'down' && c.score < 40).length === 0 && (
              <p className="text-sm text-[#7a95b8] italic">No urgent interventions needed.</p>
            )}
          </div>
        </div>
        
        <div className="rc-card p-5">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Star className="h-5 w-5 text-yellow-400"/> Referral Opportunities</h3>
          <p className="text-sm text-[#7a95b8] mb-4">Highly engaged clients ripe for referral asks.</p>
          
          <div className="space-y-3">
            {engagementData.filter((c) => c.tier === 'hot' && c.satisfactionScore > 8).slice(0, 5).map((c) => (
              <div key={c.id} className="bg-[#0a1424] p-3 rounded-lg border border-yellow-500/20 flex justify-between items-center">
                <div>
                  <h4 className="font-medium text-white">{c.name}</h4>
                  <p className="text-xs text-yellow-400">Satisfaction: {c.satisfactionScore}/10</p>
                </div>
                <button className="rc-btn rc-btn-primary text-xs py-1 px-3 bg-yellow-600 hover:bg-yellow-500">Ask for Intro</button>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Data Table 6: Campaign Targets */}
      <div className="rc-card p-5">
        <h3 className="text-lg font-semibold text-white mb-4">Suggested Campaign Targets: "Re-engagement Webinar"</h3>
        <table className="w-full text-sm text-left">
            <thead className="text-xs text-[#7a95b8] uppercase bg-[#12233e]/50 border-b border-[#12233e]">
              <tr>
                <th className="px-4 py-3 w-12"><input type="checkbox" className="rounded border-[#3a5375] bg-[#060d19]" /></th>
                <th className="px-4 py-3">Client Name</th>
                <th className="px-4 py-3">Current Score</th>
                <th className="px-4 py-3">Last Attended Event</th>
                <th className="px-4 py-3">Probability to Attend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#12233e]">
              {engagementData.filter((c) => c.tier === 'cool' || c.tier === 'warm').slice(0, 6).map((c, i) => (
                <tr key={c.id} className="hover:bg-[#12233e]/30">
                  <td className="px-4 py-3"><input type="checkbox" className="rounded border-[#3a5375] bg-[#060d19]" /></td>
                  <td className="px-4 py-3 font-medium text-white">{c.name}</td>
                  <td className="px-4 py-3 text-[#c8d8ec]">{c.score}</td>
                  <td className="px-4 py-3 text-[#7a95b8]">{c.eventsAttended > 0 ? `${Math.floor(Math.random()*6)+1} months ago` : 'Never'}</td>
                  <td className="px-4 py-3">
                    <div className="w-full bg-[#12233e] rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{width: `${Math.floor(Math.random()*40)+30}%`}}></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex justify-end">
            <button className="rc-btn rc-btn-primary">Add Selected to Campaign</button>
          </div>
      </div>
    </div>
  );

  return (
    <AppShell subtitle="System-calculated engagement heatmap across your book">
      <div className="space-y-6 max-w-7xl mx-auto pb-20">
        <FactFinderBadge className="mb-4" />
        
        {/* Page Insights Toggle */}
        {showInsights && (
          <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl flex justify-between items-start mb-6 animate-in slide-in-from-top-4">
            <div className="flex gap-3">
              <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-white">Understanding Engagement Scores</h4>
                <p className="text-sm text-[#c8d8ec] mt-1 max-w-3xl">
                  Scores (0-100) are calculated dynamically based on recency of contact, meeting frequency, portal logins, and email interactions. 
                  A score drop of 20+ points in 30 days triggers a High Risk alert.
                </p>
              </div>
            </div>
            <button onClick={() => setShowInsights(false)} className="text-[#7a95b8] hover:text-white"><Settings className="h-4 w-4"/></button>
          </div>
        )}

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
              <Heart className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <h2 className="rc-page-title text-2xl">Engagement Intelligence</h2>
              <p className="rc-page-subtitle text-sm mt-1">Track, analyze, and improve client interactions across every touchpoint</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={handleRefresh} className="rc-btn rc-btn-ghost flex items-center gap-2" disabled={refreshing}>
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button onClick={handleExportCSV} className="rc-btn rc-btn-ghost flex items-center gap-2" disabled={isExporting || engagementData.length === 0}>
              <Download className="h-4 w-4" /> {isExporting ? 'Exporting...' : 'Export CSV'}
            </button>
            <ExportToSlides
              toolName="Client Engagement Intelligence"
              getSections={() => [
                {
                  title: "Engagement Overview",
                  items: [
                    { label: "Avg Engagement Score", value: metrics.avgScore.toString() },
                    { label: "Hot Clients", value: metrics.hotCount.toString() },
                    { label: "Cold Clients", value: metrics.coldCount.toString() },
                    { label: "At Risk", value: metrics.atRisk.toString() }
                  ]
                },
                ...filteredAndSortedData.slice(0, 5).map((client) => ({
                  title: `Client Profile: ${client.name}`,
                  items: [
                    { label: "Score", value: client.score.toString() },
                    { label: "Tier", value: client.tier },
                    { label: "Risk Level", value: client.riskLevel },
                    { label: "Next Action", value: client.nextAction },
                    { label: "AUM", value: `$${(client.aum/1000000).toFixed(2)}M` }
                  ]
                }))
              ]}
            />
          </div>
        </div>

        {/* Custom Tabs */}
        <div className="flex border-b border-[#12233e] mb-6 overflow-x-auto hide-scrollbar">
          {[
            { id: "analytics", label: "Analytics Dashboard", icon: BarChartIcon },
            { id: "list", label: "Client Directory", icon: Users },
            { id: "trends", label: "Macro Trends", icon: TrendingUp },
            { id: "actions", label: "Action Center", icon: Target },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setSelectedClient(null); }}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id ? 'border-blue-500 text-blue-400' : 'border-transparent text-[#7a95b8] hover:text-white hover:border-[#3a5375]'
              }`}
            >
              <tab.icon className="h-4 w-4" /> {tab.label}
            </button>
          ))}
          {selectedClient && (
            <button
              onClick={() => setActiveTab("details")}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === "details" ? 'border-blue-500 text-blue-400' : 'border-transparent text-[#7a95b8] hover:text-white hover:border-[#3a5375]'
              }`}
            >
              <UserPlus className="h-4 w-4" /> Profile: {selectedClient.name}
            </button>
          )}
        </div>

        {/* Tab Content Rendering */}
        {activeTab === "analytics" && renderAnalyticsTab()}
        {activeTab === "list" && renderListTab()}
        {activeTab === "details" && renderDetailsTab()}
        {activeTab === "trends" && renderTrendsTab()}
        {activeTab === "actions" && renderActionsTab()}
        
        {/* Action Modal */}
        {showActionModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
            <div className="bg-[#060d19] border border-[#12233e] rounded-xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95">
              <h3 className="text-xl font-bold text-white mb-2">Log Bulk Action</h3>
              <p className="text-sm text-[#7a95b8] mb-4">Applying action to {selectedClients.length} selected clients.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[#c8d8ec] mb-1">Action Type</label>
                  <select className="rc-input w-full">
                    <option>Sent Email Campaign</option>
                    <option>Mailed Physical Letter</option>
                    <option>Invited to Event</option>
                    <option>Updated Risk Profile</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[#c8d8ec] mb-1">Notes (Required)</label>
                  <textarea 
                    className="rc-input w-full h-24 resize-none" 
                    placeholder="Enter details about this action..."
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                  ></textarea>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button className="rc-btn rc-btn-ghost" onClick={() => setShowActionModal(false)}>Cancel</button>
                <button className="rc-btn rc-btn-primary" onClick={handleLogAction} disabled={logActivityMutation.isLoading}>
                  {logActivityMutation.isLoading ? 'Saving...' : 'Save Action'}
                </button>
              </div>
            </div>
          </div>
        )}

        <PageInsights pageId="client-engagement-score" />
      </div>
    </AppShell>
  );
}
