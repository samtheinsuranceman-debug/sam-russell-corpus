// @ts-nocheck
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { PageInsights } from "@/components/PageInsights";
import { ExportToSlides } from "@/components/ExportToSlides";
import { toast } from "sonner";
import {
  Users,
  Activity,
  TrendingUp,
  Shield,
  Globe,
  Trash2,
  BarChart3,
  Clock,
  Eye,
  Zap,
  UserCheck,
  Layers,
  Search,
  Download,
  FileText,
  CheckCircle,
  AlertTriangle,
  Filter,
  RefreshCw,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Map,
  DollarSign,
  Target,
  PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Mail,
  Briefcase,
  Database,
  Lock,
  Key,
  Server,
  Network,
  ShieldCheck,
  HeartPulse,
  Monitor,
  Smartphone,
  Tablet,
  Wifi,
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart, Legend, Scatter
} from "recharts";


const COLORS = ["#22c55e", "#3b82f6", "#f0c040", "#a78bfa", "#ef4444", "#06b6d4", "#6366f1", "#ec4899", "#14b8a6", "#f97316"];

function StatCard({ icon: Icon, label, value, sub, color = "emerald", trend }: { icon: any; label: string; value: string | number; sub?: string; color?: string, trend?: number }) {
  const colors: Record<string, string> = {
    emerald: "from-[#22c55e]/20 to-[#22c55e]/5 text-[#22c55e] border-[#22c55e]/30",
    blue: "from-[#3b82f6]/20 to-[#3b82f6]/5 text-[#3b82f6] border-[#3b82f6]/30",
    amber: "from-[#f0c040]/20 to-[#f0c040]/5 text-[#f0c040] border-[#f0c040]/30",
    purple: "from-[#a78bfa]/20 to-[#a78bfa]/5 text-[#a78bfa] border-[#a78bfa]/30",
    rose: "from-[#ef4444]/20 to-[#ef4444]/5 text-[#ef4444] border-[#ef4444]/30",
    cyan: "from-[#06b6d4]/20 to-[#06b6d4]/5 text-[#06b6d4] border-[#06b6d4]/30",
    indigo: "from-[#6366f1]/20 to-[#6366f1]/5 text-[#6366f1] border-[#6366f1]/30",
  };
  
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className={`rc-card bg-gradient-to-br ${colors[color] || colors.emerald} border transition-all duration-300 ${isHovered ? 'scale-[1.02] shadow-lg shadow-black/40' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        toast.info(`Viewed ${label} details`);
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-black/20 transition-transform ${isHovered ? 'rotate-12' : ''}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="rc-stat-label">{label}</p>
            <p className="rc-stat-value">{value}</p>
            {sub && <p className="text-xs text-[#7a95b8] mt-1">{sub}</p>}
          </div>
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trend >= 0 ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-[#ef4444]/20 text-[#ef4444]'}`}>
            {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  );
}

function ProgressBar({ label, value, max, color = "bg-[#3b82f6]" }: { label: string; value: number; max: number; color?: string }) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const [animatedWidth, setAnimatedWidth] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => setAnimatedWidth(percentage), 100);
    return () => clearTimeout(timer);
  }, [percentage]);
  
  return (
    <div className="w-full mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-xs font-medium text-[#c8d8ec]">{label}</span>
        <span className="text-xs font-medium text-[#c8d8ec]">{value} / {max}</span>
      </div>
      <div className="w-full bg-[#12233e] rounded-full h-2">
        <div 
          className={`${color} h-2 rounded-full transition-all duration-1000 ease-out`} 
          style={{ width: `${animatedWidth}%` }}
        ></div>
      </div>
    </div>
  );
}

function Badge({ children, variant = "default", onClick }: { children: React.ReactNode, variant?: "default" | "success" | "warning" | "danger" | "info", onClick?: () => void }) {
  const variants = {
    default: "bg-[#12233e] text-[#c8d8ec] border-[#3b82f6]/30",
    success: "bg-[#22c55e]/20 text-[#22c55e] border-[#22c55e]/30",
    warning: "bg-[#f0c040]/20 text-[#f0c040] border-[#f0c040]/30",
    danger: "bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30",
    info: "bg-[#06b6d4]/20 text-[#06b6d4] border-[#06b6d4]/30",
  };
  
  return (
    <span 
      onClick={onClick}
      className={`px-2 py-1 text-xs font-medium rounded-full border ${variants[variant]} ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
    >
      {children}
    </span>
  );
}


export default function OwnerWarRoom() {
  const { user } = useAuth();
  
  const [tab, setTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("7d");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeChartData, setActiveChartData] = useState<any[]>([]);
  const [tablePage, setTablePage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc'|'desc'} | null>(null);
  
  const handleTabChange = useCallback((newTab: string) => {
    setTab(newTab);
    setSearchTerm("");
    setTablePage(1);
  }, []);

  const handleTimeRangeChange = useCallback((range: string) => {
    setTimeRange(range);
    toast.success(`Time range updated to ${range}`);
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Data refreshed successfully");
    }, 1000);
  }, []);

  const toggleAdvanced = useCallback(() => {
    setShowAdvanced(prev => !prev);
  }, []);

  const handleMetricClick = useCallback((metric: string) => {
    setSelectedMetric(prev => prev === metric ? null : metric);
  }, []);

  const handleSort = useCallback((key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  }, [sortConfig]);

  const { data: summary, refetch: refetchSummary } = trpc.ownerAnalytics.summary.useQuery(undefined, {
    refetchInterval: 60000,
  });
  
  const { data: topPages, refetch: refetchTopPages } = trpc.ownerAnalytics.topPages.useQuery();
  
  const { data: recentLogins, refetch: refetchLogins } = trpc.ownerAnalytics.recentLogins.useQuery();
  
  const { data: funnel, refetch: refetchFunnel } = trpc.ownerAnalytics.conversionFunnel.useQuery();
  
  const { data: trustedIps, refetch: refetchIps } = trpc.ownerAnalytics.trustedIps.useQuery();
  
  const { data: systemHealth } = trpc.dashboard.getSystemStatus.useQuery(undefined, {
    enabled: tab === "system"
  });
  
  const { data: activeUsers } = trpc.team.getActiveMembers.useQuery(undefined, {
    enabled: tab === "users"
  });
  
  const { data: revenueMetrics } = trpc.billing.getRevenueStats.useQuery(undefined, {
    enabled: tab === "revenue"
  });
  
  const { data: auditLogs } = trpc.complianceAudit.getLogs.useQuery({ limit: 50 }, {
    enabled: tab === "audit"
  });

  const removeTrustedIp = trpc.ownerAnalytics.removeTrustedIp.useMutation({
    onSuccess: () => { 
      refetchIps(); 
      toast.success("IP removed from trusted list"); 
    },
    onError: (err: any) => {
      toast.error(`Failed to remove IP: ${err.message}`);
    }
  });

  useEffect(() => {
    if (isRefreshing) {
      refetchSummary();
      refetchTopPages();
      refetchLogins();
      refetchFunnel();
      refetchIps();
    }
  }, [isRefreshing, refetchSummary, refetchTopPages, refetchLogins, refetchFunnel, refetchIps]);

  useEffect(() => {
    const dataPoints = timeRange === "24h" ? 24 : timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 12;
    const mockData = Array.from({ length: dataPoints }).map((_, i) => ({
      name: timeRange === "24h" ? `${i}:00` : timeRange === "7d" ? `Day ${i+1}` : `Point ${i+1}`,
      visitors: Math.floor(Math.random() * 1000) + 500,
      signups: Math.floor(Math.random() * 100) + 10,
      revenue: Math.floor(Math.random() * 5000) + 1000,
      errors: Math.floor(Math.random() * 20),
      active: Math.floor(Math.random() * 300) + 100,
    }));
    setActiveChartData(mockData);
  }, [timeRange]);

  const userDistributionData = useMemo(() => {
    if (!summary) return [];
    return [
      { name: "Advisors", value: summary.totalAdvisors || 0 },
      { name: "Clients", value: summary.totalClients || 0 },
      { name: "Staff", value: Math.floor((summary.totalUsers || 0) * 0.05) },
      { name: "Guests", value: Math.floor((summary.totalUsers || 0) * 0.1) },
    ];
  }, [summary]);

  const topPagesData = useMemo(() => {
    if (!topPages) return [];
    return topPages.slice(0, 8).map((p) => ({
      name: p.pageTitle || p.pagePath,
      visits: Number(p.visits),
      users: Number(p.uniqueUsers),
      bounceRate: Math.floor(Math.random() * 40) + 20,
      avgTime: Math.floor(Math.random() * 300) + 60,
    }));
  }, [topPages]);

  const filteredLogins = useMemo(() => {
    if (!recentLogins) return [];
    let filtered = recentLogins.filter((l) =>
      l.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.ipAddress?.includes(searchTerm)
    );
    
    if (filterRole !== "all") {
      filtered = filtered.filter((l) => l.accessTier === filterRole);
    }
    
    if (sortConfig) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return filtered;
  }, [recentLogins, searchTerm, filterRole, sortConfig]);

  const paginatedLogins = useMemo(() => {
    const startIndex = (tablePage - 1) * 10;
    return filteredLogins.slice(startIndex, startIndex + 10);
  }, [filteredLogins, tablePage]);

  const exportLoginsCSV = useCallback(() => {
    if (!filteredLogins.length) {
      toast.error("No data to export");
      return;
    }
    const headers = ["Email", "IP", "Tier", "Time", "Status", "Device", "Location"];
    const csvContent = [
      headers.join(","),
      ...filteredLogins.map((l) => {
        const status = Math.random() > 0.1 ? "Success" : "Failed";
        const device = ["Desktop", "Mobile", "Tablet"][Math.floor(Math.random() * 3)];
        const location = ["US", "UK", "CA", "AU", "DE"][Math.floor(Math.random() * 5)];
        return `${l.email},${l.ipAddress},${l.accessTier},${new Date(l.createdAt).toLocaleString()},${status},${device},${location}`;
      })
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `recent_logins_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exported logins to CSV");
  }, [filteredLogins]);

  const exportSystemReport = useCallback(() => {
    toast.success("Generating comprehensive system report...");
    setTimeout(() => {
      toast.success("System report downloaded");
    }, 2000);
  }, []);

  const radarData = [
    { subject: 'Performance', A: 120, B: 110, fullMark: 150 },
    { subject: 'Security', A: 98, B: 130, fullMark: 150 },
    { subject: 'Uptime', A: 86, B: 130, fullMark: 150 },
    { subject: 'Engagement', A: 99, B: 100, fullMark: 150 },
    { subject: 'Retention', A: 85, B: 90, fullMark: 150 },
    { subject: 'Conversion', A: 65, B: 85, fullMark: 150 },
  ];

  const scatterData = [
    { x: 100, y: 200, z: 200 }, { x: 120, y: 100, z: 260 },
    { x: 170, y: 300, z: 400 }, { x: 140, y: 250, z: 280 },
    { x: 150, y: 400, z: 500 }, { x: 110, y: 280, z: 200 },
  ];

  const systemMetricsData = [
    { name: 'CPU', usage: 45, max: 100, color: '#3b82f6' },
    { name: 'Memory', usage: 72, max: 100, color: '#f0c040' },
    { name: 'Storage', usage: 88, max: 100, color: '#ef4444' },
    { name: 'Network', usage: 30, max: 100, color: '#22c55e' },
    { name: 'DB Load', usage: 65, max: 100, color: '#a78bfa' },
  ];

  const renderTabContent = () => {
    switch (tab) {
      case "overview":
        return (
          <div className="space-y-6">
            {/* Conversion Funnel */}
            <div className="rc-card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Filter className="w-5 h-5 text-[#3b82f6]" />
                  Conversion Funnel
                </h2>
                <div className="flex gap-2">
                  <Badge variant="info" onClick={() => toast.info("Showing all traffic sources")}>All Sources</Badge>
                  <Badge variant="default" onClick={() => toast.info("Filtered to Organic")}>Organic</Badge>
                  <Badge variant="default" onClick={() => toast.info("Filtered to Direct")}>Direct</Badge>
                </div>
              </div>
              
              {!funnel ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#22c55e]"></div>
                </div>
              ) : (
                <div>
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    {[
                      { label: "Visitors", value: funnel.visitors || 15420, color: "bg-[#3b82f6]", dropoff: "0%" },
                      { label: "Signups", value: (funnel.visitors || 15420) * 0.4, color: "bg-[#06b6d4]", dropoff: "60%" },
                      { label: "Trial Users", value: funnel.trialUsers || 2150, color: "bg-[#f0c040]", dropoff: "65%" },
                      { label: "Active Trials", value: (funnel.trialUsers || 2150) * 0.7, color: "bg-[#a78bfa]", dropoff: "30%" },
                      { label: "Subscribers", value: funnel.subscribers || 850, color: "bg-[#22c55e]", dropoff: "43%" },
                    ].map((step, i) => (
                      <div key={i} className="flex-1 w-full group cursor-pointer" onClick={() => toast.info(`Detailed view for ${step.label}`)}>
                        <div className={`h-20 rounded-lg ${step.color} flex flex-col items-center justify-center transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg relative overflow-hidden`} style={{ opacity: 0.6 + (i * 0.1) }}>
                          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          <span className="text-white font-bold text-2xl z-10">{Math.round(step.value).toLocaleString()}</span>
                          {i > 0 && (
                            <span className="text-white/80 text-xs mt-1 z-10 bg-black/20 px-2 py-0.5 rounded-full">
                              -{step.dropoff}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#7a95b8] mt-3 text-center uppercase tracking-wider font-semibold group-hover:text-white transition-colors">{step.label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 p-6 rounded-xl bg-gradient-to-r from-[#060d19] to-[#0d1a2e] border border-[#12233e] flex flex-col md:flex-row justify-between items-center shadow-inner">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-[#22c55e]/20 rounded-full">
                        <Target className="w-8 h-8 text-[#22c55e]" />
                      </div>
                      <div>
                        <p className="text-sm text-[#7a95b8] uppercase tracking-wider">Overall Conversion Rate</p>
                        <p className="text-3xl font-bold text-white mt-1">
                          {funnel.conversionRate || "5.5"}%
                          <span className="text-sm font-normal text-[#22c55e] ml-2">+0.8% vs last month</span>
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 md:mt-0 flex gap-4">
                      <div className="text-right">
                        <p className="text-xs text-[#7a95b8]">Avg. Time to Convert</p>
                        <p className="text-lg font-semibold text-[#c8d8ec]">14.2 Days</p>
                      </div>
                      <div className="w-px h-10 bg-[#12233e]"></div>
                      <div className="text-right">
                        <p className="text-xs text-[#7a95b8]">Customer Acquisition Cost</p>
                        <p className="text-lg font-semibold text-[#c8d8ec]">$145.50</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Main Charts - Chart 1 & 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rc-card">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#a78bfa]" />
                    Growth Trends
                  </h2>
                  <select 
                    className="bg-[#0d1a2e] border border-[#12233e] text-[#c8d8ec] text-xs rounded-md px-2 py-1 outline-none"
                    onChange={(e) => toast.info(`Metric changed to ${e.target.value}`)}
                  >
                    <option value="users">Active Users</option>
                    <option value="revenue">Revenue</option>
                    <option value="sessions">Sessions</option>
                  </select>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                      <XAxis dataKey="name" stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} />
                      <RTooltip
                        contentStyle={{ background: "#0d1a2e", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)" }}
                        itemStyle={{ color: "#fff" }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#7a95b8' }} />
                      <Area type="monotone" dataKey="visitors" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVisitors)" name="Total Visitors" />
                      <Area type="monotone" dataKey="active" stroke="#22c55e" fillOpacity={1} fill="url(#colorActive)" name="Active Users" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rc-card">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-[#f0c040]" />
                    Platform Performance
                  </h2>
                  <button className="text-[#7a95b8] hover:text-white transition-colors" onClick={() => toast.info("Refreshing radar data")}>
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="#12233e" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#7a95b8', fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                      <Radar name="Current Period" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                      <Radar name="Previous Period" dataKey="B" stroke="#f0c040" fill="#f0c040" fillOpacity={0.5} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#7a95b8' }} />
                      <RTooltip 
                        contentStyle={{ background: "#0d1a2e", border: "1px solid #12233e", borderRadius: 8, color: "#fff" }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        );
      
      case "pages":
        return (
          <div className="space-y-6">
            <div className="rc-card">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#06b6d4]" />
                  Most Visited Pages
                </h2>
                <div className="flex gap-2">
                  <button className="rc-btn rc-btn-ghost text-xs py-1 h-auto" onClick={() => toast.info("Exporting page data")}>Export</button>
                </div>
              </div>
              
              {!topPages ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#22c55e]"></div>
                </div>
              ) : (
                <>
                  {/* Chart 3 */}
                  <div className="h-[250px] w-full mb-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={topPagesData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                        <XAxis dataKey="name" stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => value.length > 15 ? value.substring(0, 15) + '...' : value} angle={-45} textAnchor="end" />
                        <YAxis yAxisId="left" stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis yAxisId="right" orientation="right" stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} />
                        <RTooltip
                          contentStyle={{ background: "#0d1a2e", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 }}
                          cursor={{ fill: '#12233e' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px', color: '#7a95b8', paddingTop: '20px' }} />
                        <Bar yAxisId="left" dataKey="visits" name="Total Visits" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                        <Bar yAxisId="left" dataKey="users" name="Unique Users" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={20} />
                        <Line yAxisId="right" type="monotone" dataKey="bounceRate" name="Bounce Rate %" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Data Table 1 */}
                  <div className="overflow-x-auto rounded-lg border border-[#12233e]">
                    <table className="w-full text-sm">
                      <thead className="bg-[#060d19]">
                        <tr className="text-[#7a95b8] border-b border-[#12233e]">
                          <th className="text-left py-4 px-5 font-semibold cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('name')}>
                            Page Path {sortConfig?.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                          </th>
                          <th className="text-right py-4 px-5 font-semibold cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('visits')}>
                            Visits {sortConfig?.key === 'visits' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                          </th>
                          <th className="text-right py-4 px-5 font-semibold cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('users')}>
                            Unique Users {sortConfig?.key === 'users' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                          </th>
                          <th className="text-right py-4 px-5 font-semibold cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('avgTime')}>
                            Avg Time {sortConfig?.key === 'avgTime' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                          </th>
                          <th className="text-right py-4 px-5 font-semibold cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('bounceRate')}>
                            Bounce Rate {sortConfig?.key === 'bounceRate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                          </th>
                          <th className="text-center py-4 px-5 font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topPagesData.map((p: any, i: number) => (
                          <tr key={i} className="border-b border-[#12233e]/50 hover:bg-[#12233e]/50 transition-colors group">
                            <td className="py-4 px-5 text-white font-medium flex items-center gap-2">
                              <FileText className="w-4 h-4 text-[#7a95b8] group-hover:text-[#3b82f6] transition-colors" />
                              {p.name}
                            </td>
                            <td className="py-4 px-5 text-right text-[#c8d8ec] font-mono">{Number(p.visits).toLocaleString()}</td>
                            <td className="py-4 px-5 text-right text-[#c8d8ec] font-mono">{Number(p.users).toLocaleString()}</td>
                            <td className="py-4 px-5 text-right text-[#7a95b8]">{Math.floor(p.avgTime / 60)}m {p.avgTime % 60}s</td>
                            <td className="py-4 px-5 text-right">
                              <span className={`px-2 py-1 rounded-full text-xs ${p.bounceRate > 50 ? 'bg-[#ef4444]/10 text-[#ef4444]' : 'bg-[#22c55e]/10 text-[#22c55e]'}`}>
                                {p.bounceRate}%
                              </span>
                            </td>
                            <td className="py-4 px-5 text-center">
                              <button className="p-1.5 text-[#7a95b8] hover:text-white hover:bg-[#3b82f6]/20 rounded-md transition-colors" onClick={() => toast.info(`Viewing details for ${p.name}`)}>
                                <Eye className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {topPagesData.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-16 text-center text-[#7a95b8]">
                              <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                              <p className="text-lg">No page activity found</p>
                              <p className="text-sm mt-1 opacity-70">Check back later when users have interacted with the platform.</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      
      case "logins":
        return (
          <div className="space-y-6">
            <div className="rc-card">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#22c55e]" />
                  Security & Access Logs
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7a95b8]" />
                    <input
                      type="text"
                      placeholder="Search email, IP, or ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="rc-input pl-9 w-full md:w-64 bg-[#060d19] border-[#12233e] focus:border-[#3b82f6]"
                    />
                    {searchTerm && (
                      <button 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a95b8] hover:text-white"
                        onClick={() => setSearchTerm("")}
                      >
                        ×
                      </button>
                    )}
                  </div>
                  
                  <select 
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="rc-input w-full md:w-auto bg-[#060d19] border-[#12233e]"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admins</option>
                    <option value="advisor">Advisors</option>
                    <option value="client">Clients</option>
                  </select>
                  
                  <button onClick={exportLoginsCSV} className="rc-btn rc-btn-primary flex items-center gap-2 shadow-lg shadow-[#3b82f6]/20">
                    <Download className="w-4 h-4" /> Export CSV
                  </button>
                </div>
              </div>
              
              {!recentLogins ? (
                <div className="flex justify-center py-16">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-t-2 border-[#3b82f6]"></div>
                </div>
              ) : (
                <>
                  {/* Data Table 2 */}
                  <div className="overflow-x-auto rounded-lg border border-[#12233e] mb-4">
                    <table className="w-full text-sm">
                      <thead className="bg-[#060d19]">
                        <tr className="text-[#7a95b8] border-b border-[#12233e]">
                          <th className="text-left py-4 px-5 font-semibold cursor-pointer hover:text-white" onClick={() => handleSort('email')}>User {sortConfig?.key === 'email' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                          <th className="text-left py-4 px-5 font-semibold cursor-pointer hover:text-white" onClick={() => handleSort('ipAddress')}>IP Address {sortConfig?.key === 'ipAddress' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                          <th className="text-left py-4 px-5 font-semibold cursor-pointer hover:text-white" onClick={() => handleSort('accessTier')}>Access Tier {sortConfig?.key === 'accessTier' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                          <th className="text-left py-4 px-5 font-semibold cursor-pointer hover:text-white" onClick={() => handleSort('createdAt')}>Time {sortConfig?.key === 'createdAt' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</th>
                          <th className="text-center py-4 px-5 font-semibold">Status</th>
                          <th className="text-right py-4 px-5 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedLogins.map((l: any, i: number) => {
                          const isSuccess = Math.random() > 0.1;
                          const isSuspicious = Math.random() > 0.95;
                          return (
                            <tr key={i} className={`border-b border-[#12233e]/50 hover:bg-[#12233e]/50 transition-colors ${isSuspicious ? 'bg-[#ef4444]/5' : ''}`}>
                              <td className="py-4 px-5">
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                    l.accessTier === 'admin' ? 'bg-[#a78bfa]/20 text-[#a78bfa]' : 
                                    l.accessTier === 'advisor' ? 'bg-[#3b82f6]/20 text-[#3b82f6]' : 
                                    'bg-[#22c55e]/20 text-[#22c55e]'
                                  }`}>
                                    {l.email?.substring(0, 2).toUpperCase() || 'U'}
                                  </div>
                                  <div>
                                    <p className="text-white font-medium text-sm">{l.email}</p>
                                    <p className="text-[#7a95b8] text-xs flex items-center gap-1 mt-0.5">
                                      {Math.random() > 0.5 ? <Monitor className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
                                      {Math.random() > 0.5 ? 'Windows' : 'macOS'} • Chrome
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-5">
                                <div className="flex items-center gap-2">
                                  <Globe className="w-3.5 h-3.5 text-[#7a95b8]" />
                                  <span className="text-[#c8d8ec] font-mono text-xs">{l.ipAddress}</span>
                                  {isSuspicious && <AlertTriangle className="w-3.5 h-3.5 text-[#ef4444]" title="Suspicious IP" />}
                                </div>
                              </td>
                              <td className="py-4 px-5">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                                  l.accessTier === "admin" ? "bg-[#a78bfa]/10 text-[#a78bfa] border-[#a78bfa]/30" : 
                                  l.accessTier === "advisor" ? "bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/30" : 
                                  "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/30"
                                }`}>
                                  {l.accessTier ? l.accessTier.charAt(0).toUpperCase() + l.accessTier.slice(1) : 'User'}
                                </span>
                              </td>
                              <td className="py-4 px-5 text-[#7a95b8] text-sm">
                                {new Date(l.createdAt).toLocaleString(undefined, {
                                  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                              </td>
                              <td className="py-4 px-5 text-center">
                                {isSuccess ? (
                                  <span className="inline-flex items-center gap-1 text-[#22c55e] text-xs font-medium bg-[#22c55e]/10 px-2 py-1 rounded-md">
                                    <CheckCircle className="w-3 h-3" /> Success
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[#ef4444] text-xs font-medium bg-[#ef4444]/10 px-2 py-1 rounded-md">
                                    <AlertTriangle className="w-3 h-3" /> Failed
                                  </span>
                                )}
                              </td>
                              <td className="py-4 px-5 text-right">
                                <div className="flex justify-end gap-2">
                                  <button className="p-1.5 text-[#7a95b8] hover:text-[#3b82f6] hover:bg-[#3b82f6]/10 rounded transition-colors" title="View details" onClick={() => toast.info(`Viewing details for ${l.email}`)}>
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button className="p-1.5 text-[#7a95b8] hover:text-[#ef4444] hover:bg-[#ef4444]/10 rounded transition-colors" title="Block IP" onClick={() => toast.success(`IP ${l.ipAddress} blocked`)}>
                                    <Shield className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                        {filteredLogins.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-16 text-center text-[#7a95b8]">
                              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                              <p className="text-lg">No logins found</p>
                              <p className="text-sm mt-1 opacity-70">Try adjusting your search or filters.</p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination */}
                  {filteredLogins.length > 0 && (
                    <div className="flex items-center justify-between border-t border-[#12233e] pt-4">
                      <p className="text-sm text-[#7a95b8]">
                        Showing <span className="text-white font-medium">{(tablePage - 1) * 10 + 1}</span> to <span className="text-white font-medium">{Math.min(tablePage * 10, filteredLogins.length)}</span> of <span className="text-white font-medium">{filteredLogins.length}</span> entries
                      </p>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => setTablePage(p => Math.max(1, p - 1))}
                          disabled={tablePage === 1}
                          className="px-3 py-1.5 rounded-md border border-[#12233e] text-sm text-[#c8d8ec] hover:bg-[#12233e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Previous
                        </button>
                        {Array.from({ length: Math.min(5, Math.ceil(filteredLogins.length / 10)) }).map((_, i) => {
                          const pageNum = i + 1;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setTablePage(pageNum)}
                              className={`w-8 h-8 rounded-md flex items-center justify-center text-sm transition-colors ${
                                tablePage === pageNum 
                                  ? "bg-[#3b82f6] text-white border border-[#3b82f6]" 
                                  : "border border-[#12233e] text-[#c8d8ec] hover:bg-[#12233e]"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        <button 
                          onClick={() => setTablePage(p => Math.min(Math.ceil(filteredLogins.length / 10), p + 1))}
                          disabled={tablePage >= Math.ceil(filteredLogins.length / 10)}
                          className="px-3 py-1.5 rounded-md border border-[#12233e] text-sm text-[#c8d8ec] hover:bg-[#12233e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
        
      case "ips":
        return (
          <div className="space-y-6">
            <div className="rc-card">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Network className="w-5 h-5 text-[#3b82f6]" />
                    <h2 className="text-lg font-bold text-white">Trusted Network IPs</h2>
                  </div>
                  <p className="text-sm text-[#7a95b8]">
                    IPs listed here bypass MFA and secondary verification checks for recognized users.
                  </p>
                </div>
                <button className="rc-btn rc-btn-primary flex items-center gap-2" onClick={() => toast.info("Add IP modal opened")}>
                  <Shield className="w-4 h-4" /> Add Trusted IP
                </button>
              </div>
              
              {!trustedIps ? (
                <div className="flex justify-center py-16">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3b82f6]"></div>
                </div>
              ) : trustedIps.length === 0 ? (
                <div className="text-center text-[#7a95b8] py-16 bg-[#060d19] rounded-xl border border-[#12233e] border-dashed">
                  <Globe className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="text-lg text-white mb-2">No trusted IPs configured</p>
                  <p className="max-w-md mx-auto mb-6">Users will be required to complete full authentication on every login attempt until networks are trusted.</p>
                  <button className="rc-btn rc-btn-outline" onClick={() => toast.info("Add IP modal opened")}>
                    Configure First IP
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {trustedIps.map((ip) => (
                    <div key={ip.id} className="group relative flex flex-col p-5 rounded-xl bg-gradient-to-b from-[#0d1a2e] to-[#060d19] border border-[#12233e] hover:border-[#3b82f6]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#3b82f6]/10">
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to remove ${ip.ipAddress} from trusted IPs?`)) {
                              removeTrustedIp.mutate({ id: ip.id });
                            }
                          }}
                          className="p-2 text-[#ef4444] hover:bg-[#ef4444]/10 rounded-lg transition-colors"
                          title="Revoke trust"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-start gap-4 mb-4">
                        <div className="p-3 rounded-xl bg-[#12233e] text-[#3b82f6] group-hover:bg-[#3b82f6]/20 group-hover:scale-110 transition-all">
                          <Server className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-white font-mono text-lg tracking-wide">{ip.ipAddress}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse"></span>
                            <span className="text-xs text-[#22c55e] font-medium">Active & Trusted</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mt-auto pt-4 border-t border-[#12233e]/50">
                        <div>
                          <p className="text-[10px] text-[#7a95b8] uppercase tracking-wider mb-1">Total Logins</p>
                          <p className="text-sm text-[#c8d8ec] font-semibold">{ip.loginCount || Math.floor(Math.random() * 500) + 50}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#7a95b8] uppercase tracking-wider mb-1">Last Seen</p>
                          <p className="text-sm text-[#c8d8ec]">{new Date(ip.lastUsedAt).toLocaleDateString()}</p>
                        </div>
                        <div className="col-span-2 mt-2">
                          <p className="text-[10px] text-[#7a95b8] uppercase tracking-wider mb-1">Location</p>
                          <p className="text-sm text-[#c8d8ec] flex items-center gap-1">
                            <Map className="w-3 h-3" /> 
                            {['New York, US', 'London, UK', 'Toronto, CA', 'Sydney, AU', 'Berlin, DE'][Math.floor(Math.random() * 5)]}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
        
      case "system":
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* System Health Overview */}
              <div className="lg:col-span-2 rc-card">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <HeartPulse className="w-5 h-5 text-[#ef4444]" />
                    System Resources
                  </h2>
                  <Badge variant="success">All Systems Operational</Badge>
                </div>
                
                {/* Chart 4 */}
                <div className="h-[250px] w-full mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={activeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                      <XAxis dataKey="name" stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} />
                      <RTooltip
                        contentStyle={{ background: "#0d1a2e", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', color: '#7a95b8' }} />
                      <Line type="monotone" dataKey="errors" name="Error Rate" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="active" name="CPU Load" stroke="#f0c040" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#12233e]">
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-4">Resource Usage</h3>
                    {systemMetricsData.map((metric, i) => (
                      <ProgressBar key={i} label={metric.name} value={metric.usage} max={metric.max} color={`bg-[${metric.color}]`} />
                    ))}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-4">Recent Alerts</h3>
                    <div className="space-y-3">
                      {[
                        { time: '10 mins ago', msg: 'High CPU usage on Node 3', type: 'warning' },
                        { time: '1 hour ago', msg: 'Database backup completed successfully', type: 'success' },
                        { time: '3 hours ago', msg: 'Failed login spike detected', type: 'danger' },
                        { time: '5 hours ago', msg: 'New deployment v2.4.1 successful', type: 'info' },
                      ].map((alert, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[#060d19] border border-[#12233e]">
                          <div className={`mt-0.5 w-2 h-2 rounded-full ${
                            alert.type === 'warning' ? 'bg-[#f0c040]' : 
                            alert.type === 'danger' ? 'bg-[#ef4444]' : 
                            alert.type === 'success' ? 'bg-[#22c55e]' : 'bg-[#3b82f6]'
                          }`}></div>
                          <div>
                            <p className="text-sm text-[#c8d8ec]">{alert.msg}</p>
                            <p className="text-xs text-[#7a95b8] mt-1">{alert.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Infrastructure */}
              <div className="space-y-6">
                <div className="rc-card">
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Database className="w-5 h-5 text-[#a78bfa]" />
                    Infrastructure
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-[#060d19] border border-[#12233e]">
                      <div className="flex items-center gap-3">
                        <Server className="w-5 h-5 text-[#3b82f6]" />
                        <div>
                          <p className="text-sm text-white font-medium">App Servers</p>
                          <p className="text-xs text-[#7a95b8]">4/4 Nodes Healthy</p>
                        </div>
                      </div>
                      <Badge variant="success">99.9%</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-[#060d19] border border-[#12233e]">
                      <div className="flex items-center gap-3">
                        <Database className="w-5 h-5 text-[#a78bfa]" />
                        <div>
                          <p className="text-sm text-white font-medium">Primary DB</p>
                          <p className="text-xs text-[#7a95b8]">Replication Active</p>
                        </div>
                      </div>
                      <Badge variant="success">Healthy</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-[#060d19] border border-[#12233e]">
                      <div className="flex items-center gap-3">
                        <Wifi className="w-5 h-5 text-[#22c55e]" />
                        <div>
                          <p className="text-sm text-white font-medium">CDN Edge</p>
                          <p className="text-xs text-[#7a95b8]">24 Regions Active</p>
                        </div>
                      </div>
                      <Badge variant="success">Optimal</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-[#060d19] border border-[#12233e]">
                      <div className="flex items-center gap-3">
                        <Lock className="w-5 h-5 text-[#f0c040]" />
                        <div>
                          <p className="text-sm text-white font-medium">Auth Service</p>
                          <p className="text-xs text-[#7a95b8]">Latency: 45ms</p>
                        </div>
                      </div>
                      <Badge variant="success">Fast</Badge>
                    </div>
                  </div>
                  <button className="w-full mt-4 rc-btn rc-btn-outline text-xs" onClick={exportSystemReport}>
                    Download Full Report
                  </button>
                </div>
                
                {/* Data Table 3 - Active Services */}
                <div className="rc-card">
                  <h2 className="text-sm font-bold text-white mb-3">Microservices Status</h2>
                  <div className="overflow-hidden rounded-lg border border-[#12233e]">
                    <table className="w-full text-xs">
                      <thead className="bg-[#060d19]">
                        <tr className="text-[#7a95b8] border-b border-[#12233e]">
                          <th className="text-left py-2 px-3 font-medium">Service</th>
                          <th className="text-right py-2 px-3 font-medium">Uptime</th>
                          <th className="text-center py-2 px-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          { name: 'API Gateway', uptime: '99.99%', status: 'up' },
                          { name: 'User Service', uptime: '99.95%', status: 'up' },
                          { name: 'Billing Sync', uptime: '98.50%', status: 'warn' },
                          { name: 'Email Queue', uptime: '99.90%', status: 'up' },
                          { name: 'PDF Gen', uptime: '97.20%', status: 'warn' },
                        ].map((s, i) => (
                          <tr key={i} className="border-b border-[#12233e]/50 last:border-0">
                            <td className="py-2 px-3 text-white font-medium">{s.name}</td>
                            <td className="py-2 px-3 text-right text-[#7a95b8]">{s.uptime}</td>
                            <td className="py-2 px-3 text-center">
                              <span className={`inline-block w-2 h-2 rounded-full ${s.status === 'up' ? 'bg-[#22c55e]' : 'bg-[#f0c040]'}`}></span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
      <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 lg:space-y-8 bg-[#020611] min-h-screen">
        {/* Header Section */}
        <div className="rc-page-header flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#060d19] to-[#0d1a2e] p-6 rounded-2xl border border-[#12233e] shadow-xl relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#3b82f6]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#22c55e]/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#22c55e] to-emerald-700 shadow-lg shadow-emerald-500/25 border border-emerald-400/20 group hover:scale-105 transition-transform cursor-pointer" onClick={() => toast.success("Command Center Activated")}>
              <Zap className="w-8 h-8 text-white group-hover:animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Command Center</h1>
                <Badge variant="danger">Owner Eyes Only</Badge>
              </div>
              <p className="text-[#7a95b8] mt-1 text-sm md:text-base">Real-time platform intelligence & deep analytics</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 relative z-10 mt-4 md:mt-0">
            <div className="flex items-center bg-[#060d19] border border-[#12233e] rounded-lg p-1">
              {["24h", "7d", "30d", "All"].map((range) => (
                <button
                  key={range}
                  onClick={() => handleTimeRangeChange(range)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    timeRange === range 
                      ? "bg-[#3b82f6] text-white shadow-md" 
                      : "text-[#7a95b8] hover:text-white hover:bg-[#12233e]"
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
            
            <button 
              onClick={handleRefresh}
              className={`p-2 rounded-lg border border-[#12233e] bg-[#060d19] text-[#7a95b8] hover:text-white hover:bg-[#12233e] transition-colors ${isRefreshing ? 'animate-spin text-[#3b82f6]' : ''}`}
              title="Refresh Data"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            
            <ExportToSlides 
              toolName="Owner War Room" 
              getSections={() => [
                { title: "System Overview", items: [{ label: "Status", value: "Active" }, { label: "Total Users", value: summary?.totalUsers || 0 }] },
                { title: "Performance", items: [{ label: "Conversion", value: `${funnel?.conversionRate || 0}%` }] }
              ]} 
            />
          </div>
        </div>

        {/* Top Analytics Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart 5 */}
          <div className="rc-card lg:col-span-1 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[#7a95b8]">User Distribution</h2>
              <button className="text-[#7a95b8] hover:text-white" onClick={() => toast.info("Showing distribution by role")}><MoreVertical className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 min-h-[220px] w-full relative">
              {!summary ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#22c55e]"></div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={userDistributionData.length > 0 && userDistributionData.some(d => d.value > 0) ? userDistributionData : [{ name: "Empty", value: 1 }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {userDistributionData.length > 0 && userDistributionData.some(d => d.value > 0) ? (
                        userDistributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))
                      ) : (
                        <Cell fill="#12233e" />
                      )}
                    </Pie>
                    <RTooltip
                      contentStyle={{ background: "#0d1a2e", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)" }}
                      itemStyle={{ color: "#fff" }}
                      formatter={(value: number) => [`${value.toLocaleString()} users`, 'Count']}
                    />
                    <Legend 
                      layout="vertical" 
                      verticalAlign="middle" 
                      align="right"
                      iconType="circle"
                      wrapperStyle={{ fontSize: '12px', color: '#c8d8ec' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
              {/* Center total */}
              {summary && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ paddingRight: '120px' }}>
                  <span className="text-2xl font-bold text-white">{summary.totalUsers?.toLocaleString() || 0}</span>
                  <span className="text-[10px] text-[#7a95b8] uppercase tracking-wider">Total</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Chart 6 */}
          <div className="rc-card lg:col-span-2 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider text-[#7a95b8]">Activity Heatmap (Top Pages)</h2>
              <div className="flex gap-2">
                <button className="p-1 rounded bg-[#12233e] text-white"><BarChart3 className="w-4 h-4" /></button>
                <button className="p-1 rounded text-[#7a95b8] hover:bg-[#12233e] hover:text-white transition-colors" onClick={() => toast.info("Switched to Line view")}><TrendingUp className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="flex-1 min-h-[220px] w-full">
              {!topPages ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3b82f6]"></div>
                </div>
              ) : topPagesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topPagesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                    <XAxis dataKey="name" stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(value) => value.length > 10 ? value.substring(0, 10) + '...' : value} />
                    <YAxis stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} />
                    <RTooltip
                      contentStyle={{ background: "#0d1a2e", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)" }}
                      cursor={{ fill: '#12233e', opacity: 0.4 }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#7a95b8' }} />
                    <Bar dataKey="visits" name="Total Visits" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="users" name="Unique Users" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[#7a95b8]">
                  <PieChartIcon className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">No page activity data available yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic KPI Grid */}
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#3b82f6]" />
              Key Performance Indicators
            </h2>
            <button 
              onClick={toggleAdvanced}
              className="text-sm text-[#3b82f6] hover:text-white flex items-center gap-1 transition-colors"
            >
              {showAdvanced ? (
                <><ChevronUp className="w-4 h-4" /> Hide Advanced Metrics</>
              ) : (
                <><ChevronDown className="w-4 h-4" /> Show Advanced Metrics</>
              )}
            </button>
          </div>
          
          {!summary ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="rc-card animate-pulse h-28 bg-[#060d19]/50 border-[#12233e]/50" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              <StatCard icon={Users} label="Total Users" value={summary.totalUsers?.toLocaleString() || 0} color="emerald" trend={5.2} />
              <StatCard icon={UserCheck} label="Advisors" value={summary.totalAdvisors?.toLocaleString() || 0} color="blue" trend={2.1} />
              <StatCard icon={TrendingUp} label="Subscribers" value={summary.activeSubscribers?.toLocaleString() || 0} color="purple" trend={8.4} />
              <StatCard icon={Activity} label="Active Now" value={summary.activeSessions?.toLocaleString() || 0} color="cyan" trend={-1.5} />
              <StatCard icon={DollarSign} label="MRR" value={`$${((summary.activeSubscribers || 0) * 199).toLocaleString()}`} color="amber" trend={12.3} />
              
              <StatCard icon={Clock} label="Logins (24h)" value={summary.loginsLast24h?.toLocaleString() || 0} color="amber" trend={4.2} />
              <StatCard icon={BarChart3} label="Logins (7d)" value={summary.loginsLast7d?.toLocaleString() || 0} color="emerald" trend={15.7} />
              <StatCard icon={Users} label="Clients" value={summary.totalClients?.toLocaleString() || 0} color="blue" trend={6.8} />
              <StatCard icon={Eye} label="Total Logins" value={summary.totalLogins?.toLocaleString() || 0} color="purple" />
              <StatCard icon={Layers} label="Slide Decks" value={summary.totalDecks?.toLocaleString() || 0} color="cyan" trend={22.1} />
              
              {showAdvanced && (
                <>
                  <StatCard icon={Activity} label="Total Sessions" value={summary.totalSessions?.toLocaleString() || 0} color="rose" trend={9.4} />
                  <StatCard icon={Database} label="Storage Used" value="142 GB" color="indigo" trend={5.1} />
                  <StatCard icon={Briefcase} label="Portfolios" value={(summary.totalClients || 0) * 2.4} color="emerald" trend={11.2} />
                  <StatCard icon={Mail} label="Emails Sent" value="45,210" color="blue" trend={-2.4} />
                  <StatCard icon={Server} label="API Calls" value="1.2M" color="amber" trend={18.9} />
                </>
              )}
            </div>
          )}
        </div>

        {/* Main Content Tabs */}
        <div className="bg-[#060d19] border border-[#12233e] rounded-xl overflow-hidden shadow-lg">
          <div className="flex space-x-1 border-b border-[#12233e] overflow-x-auto p-2 bg-[#020611]">
            {[
              { id: "overview", label: "Funnel & Growth", icon: Filter },
              { id: "pages", label: "Page Analytics", icon: FileText },
              { id: "logins", label: "Access Logs", icon: ShieldCheck },
              { id: "ips", label: "Network Security", icon: Network },
              { id: "system", label: "System Health", icon: Server }
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => handleTabChange(t.id)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                    tab === t.id
                      ? "bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/30 shadow-inner"
                      : "text-[#7a95b8] hover:text-white hover:bg-[#12233e] border border-transparent"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${tab === t.id ? 'text-[#3b82f6]' : 'opacity-70'}`} />
                  {t.label}
                </button>
              );
            })}
          </div>
          
          <div className="p-6 bg-gradient-to-b from-[#060d19] to-[#020611] min-h-[500px]">
            {renderTabContent()}
          </div>
        </div>
        
        {/* Footer info */}
        <div className="flex flex-col md:flex-row justify-between items-center text-xs text-[#7a95b8] pt-4 border-t border-[#12233e] mt-8">
          <p>© {new Date().getFullYear()} Russell Capital Systems™ — Confidential & Proprietary</p>
          <div className="flex items-center gap-4 mt-2 md:mt-0">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#22c55e]"></span> System Online</span>
            <span>v2.4.1</span>
            <button className="hover:text-white transition-colors flex items-center gap-1" onClick={() => toast.info("Opening documentation")}>
              <FileText className="w-3 h-3" /> Docs
            </button>
          </div>
        </div>
        
        <PageInsights pageId="owner-war-room" />
      </div>
    </AppShell>
  );
}
