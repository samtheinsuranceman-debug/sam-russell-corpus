// @ts-nocheck
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import {
  Activity, AlertTriangle, BarChart3, Bug, Clock, Eye, Hash, Gauge,
  RefreshCcw, Shield, TrendingUp, Users, Wrench, ChevronDown,
  ChevronUp, Search, Zap, Timer
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

function StatCard({ icon: Icon, label, value, subValue, color = "emerald" }: {
  icon: any; label: string; value: string | number; subValue?: string; color?: string;
}) {
  const colorMap: Record<string, string> = {
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    red: "text-red-400 bg-red-500/10 border-red-500/20",
    purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  };
  const c = colorMap[color] || colorMap.emerald;
  const [textColor, bgColor, borderColor] = c.split(" ");
  return (
    <div className={`rounded-xl border ${borderColor} ${bgColor} p-4 flex flex-col gap-2`}>
      <div className="flex items-center gap-2">
        <Icon size={16} className={textColor} />
        <span className="text-xs text-[#7a95b8] uppercase tracking-wider font-medium">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${textColor}`}>{value}</div>
      {subValue && <span className="text-xs text-[#7a95b8]">{subValue}</span>}
    </div>
  );
}

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon size={16} className="text-emerald-400" />
      <h3 className="text-sm font-semibold text-white uppercase tracking-wider">{title}</h3>
    </div>
  );
}

export default function AdminHealthDashboard() {
  const [errorFilter, setErrorFilter] = useState("");
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "errors" | "tools" | "performance">("overview");
  const [perfMetric, setPerfMetric] = useState("LCP");
  const [perfDays, setPerfDays] = useState(7);

  const { data: summary, refetch: refetchSummary } = trpc.healthDashboard.summary.useQuery();
  const { data: errorsByPage } = trpc.healthDashboard.errorsByPage.useQuery();
  const { data: dailyTrend, isLoading: loadingTrend } = trpc.healthDashboard.dailyUsageTrend.useQuery({ days: 14 });
  const { data: recentErrors } = trpc.healthDashboard.recentErrors.useQuery({ limit: 50 });
  const { data: popularTools } = trpc.toolAnalytics.popular.useQuery({ limit: 30 });
  const { data: trendingTools } = trpc.toolAnalytics.trending.useQuery({ limit: 15 });

  const { data: perfSummary } = trpc.healthDashboard.performanceSummary.useQuery({ days: perfDays });
  const { data: slowestPages } = trpc.healthDashboard.slowestPages.useQuery({ metricName: perfMetric, days: perfDays, limit: 20 });
  const { data: perfTrend } = trpc.healthDashboard.performanceTrend.useQuery({ metricName: perfMetric, days: 14 });

  const filteredErrors = useMemo(() => {
    if (!errorsByPage) return [];
    const filtered = errorFilter
      ? errorsByPage.filter(e =>
          e.pagePath?.toLowerCase().includes(errorFilter.toLowerCase()) ||
          e.message?.toLowerCase().includes(errorFilter.toLowerCase()))
      : errorsByPage;
    return showAllErrors ? filtered : filtered.slice(0, 10);
  }, [errorsByPage, errorFilter, showAllErrors]);

  const filteredRecentErrors = useMemo(() => {
    if (!recentErrors) return [];
    return recentErrors.slice(0, 20);
  }, [recentErrors]);

  const trendData = useMemo(() => {
    if (!dailyTrend) return [];
    return dailyTrend.map(d => ({
      day: new Date(d.day).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      visits: Number(d.visits),
      users: Number(d.uniqueUsers),
    }));
  }, [dailyTrend]);

  const metricThresholds: Record<string, { good: number; poor: number; unit: string; label: string }> = {
    LCP: { good: 2500, poor: 4000, unit: "ms", label: "Largest Contentful Paint" },
    FCP: { good: 1800, poor: 3000, unit: "ms", label: "First Contentful Paint" },
    CLS: { good: 0.1, poor: 0.25, unit: "", label: "Cumulative Layout Shift" },
    TTFB: { good: 800, poor: 1800, unit: "ms", label: "Time to First Byte" },
    INP: { good: 200, poor: 500, unit: "ms", label: "Interaction to Next Paint" },
  };
  const getRatingColor = (rating: string) => rating === "good" ? "text-emerald-400" : rating === "needs-improvement" ? "text-amber-400" : "text-red-400";
  const getValueRating = (metric: string, value: number) => {
    const t = metricThresholds[metric]; if (!t) return "unknown";
    return value <= t.good ? "good" : value <= t.poor ? "needs-improvement" : "poor";
  };
  const perfTrendData = useMemo(() => {
    if (!perfTrend) return [];
    return perfTrend.map(d => ({ day: new Date(d.day).toLocaleDateString("en-US", { month: "short", day: "numeric" }), avg: Number(d.avgValue), p95: Number(d.p95Value), samples: Number(d.sampleCount) }));
  }, [perfTrend]);

  const tabs = [
    { id: "overview", label: "Overview", icon: Activity },
    { id: "performance", label: "Performance", icon: Gauge },
    { id: "errors", label: "Error Log", icon: Bug },
    { id: "tools", label: "Tool Analytics", icon: Wrench },
  ] as const;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Shield size={20} className="text-emerald-400" />
            Platform Health Dashboard
          </h1>
          <p className="text-sm text-[#7a95b8] mt-1">Monitor tool usage, error rates, and platform performance</p>
        </div>
        <button onClick={() => refetchSummary()} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#1e3a5f] text-[#7a95b8] hover:text-white hover:border-emerald-500/50 transition-colors text-xs">
          <RefreshCcw size={13} /> Refresh
        </button>
      </div>

      <div className="flex gap-1 p-1 rounded-lg bg-[#0d1526] border border-[#1e3a5f]/30 w-fit">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${activeTab === tab.id ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30" : "text-[#7a95b8] hover:text-white"}`}>
            <tab.icon size={13} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard icon={Eye} label="Total Visits" value={summary?.usageSummary?.totalVisits?.toLocaleString() ?? "—"} subValue="All time" color="emerald" />
            <StatCard icon={Wrench} label="Tools Used" value={summary?.usageSummary?.uniqueTools ?? "—"} subValue="Unique tools" color="blue" />
            <StatCard icon={Users} label="Active Users" value={summary?.usageSummary?.uniqueUsers ?? "—"} subValue="Unique users" color="cyan" />
            <StatCard icon={TrendingUp} label="Avg Visits/User" value={summary?.usageSummary?.avgVisitsPerUser ?? "—"} subValue="Engagement" color="purple" />
            <StatCard icon={Bug} label="Errors (24h)" value={summary?.errorStats?.last24h ?? 0} subValue={`${summary?.errorStats?.last7d ?? 0} this week`} color={summary?.errorStats?.last24h > 0 ? "red" : "emerald"} />
            <StatCard icon={AlertTriangle} label="Total Errors" value={summary?.errorStats?.total ?? 0} subValue="All time" color="amber" />
          </div>

          <div className="rounded-xl border border-[#1e3a5f]/30 bg-[#0d1526] p-4">
            <SectionHeader icon={BarChart3} title="Daily Usage Trend (14 Days)" />
            {loadingTrend ? (
              <div className="h-48 flex items-center justify-center text-[#7a95b8] text-sm">Loading trend data...</div>
            ) : trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="visitGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" opacity={0.3} />
                  <XAxis dataKey="day" tick={{ fill: "#7a95b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#7a95b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#0d1526", border: "1px solid #1e3a5f", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#fff" }} />
                  <Area type="monotone" dataKey="visits" stroke="#22c55e" fill="url(#visitGrad)" strokeWidth={2} name="Visits" />
                  <Area type="monotone" dataKey="users" stroke="#3b82f6" fill="url(#userGrad)" strokeWidth={2} name="Unique Users" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-[#7a95b8] text-sm">No usage data yet</div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-[#1e3a5f]/30 bg-[#0d1526] p-4">
              <SectionHeader icon={TrendingUp} title="Top 10 Most-Used Tools" />
              <div className="space-y-1.5 max-h-80 overflow-y-auto">
                {popularTools?.slice(0, 10).map((tool, i) => (
                  <div key={tool.toolPath} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#1e3a5f]/20 transition-colors">
                    <span className={`text-xs font-bold w-5 text-center ${i < 3 ? "text-emerald-400" : "text-[#7a95b8]"}`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{tool.toolLabel}</p>
                      <p className="text-xs text-[#7a95b8] truncate">{tool.toolPath}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-emerald-400">{Number(tool.visitCount).toLocaleString()}</p>
                      <p className="text-xs text-[#7a95b8]">{Number(tool.uniqueUsers)} users</p>
                    </div>
                  </div>
                )) ?? <p className="text-sm text-[#7a95b8] text-center py-4">No usage data yet</p>}
              </div>
            </div>
            <div className="rounded-xl border border-[#1e3a5f]/30 bg-[#0d1526] p-4">
              <SectionHeader icon={AlertTriangle} title="Error Hotspots (30 Days)" />
              <div className="space-y-1.5 max-h-80 overflow-y-auto">
                {errorsByPage && errorsByPage.length > 0 ? errorsByPage.slice(0, 10).map((err, i) => (
                  <div key={`${err.pagePath}-${i}`} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-500/5 transition-colors">
                    <div className={`w-2 h-2 rounded-full ${Number(err.errorCount) > 5 ? "bg-red-400" : "bg-amber-400"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{err.pagePath || "Unknown"}</p>
                      <p className="text-xs text-[#7a95b8] truncate">{err.message}</p>
                    </div>
                    <p className={`text-sm font-semibold ${Number(err.errorCount) > 5 ? "text-red-400" : "text-amber-400"}`}>{Number(err.errorCount)}x</p>
                  </div>
                )) : (
                  <div className="flex flex-col items-center py-8 text-center">
                    <Shield size={32} className="text-emerald-400/50 mb-2" />
                    <p className="text-sm text-emerald-400">No errors in the last 30 days</p>
                    <p className="text-xs text-[#7a95b8]">All systems running smoothly</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {trendingTools && trendingTools.length > 0 && (
            <div className="rounded-xl border border-[#1e3a5f]/30 bg-[#0d1526] p-4">
              <SectionHeader icon={TrendingUp} title="Trending Tools (Growing This Week)" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {trendingTools.slice(0, 9).map((tool) => {
                  const growth = Number(tool.recentVisits) - Number(tool.priorVisits);
                  return (
                    <div key={tool.toolPath} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-[#1e3a5f]/20 hover:border-emerald-500/30 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{tool.toolLabel}</p>
                        <p className="text-xs text-[#7a95b8]">{Number(tool.recentVisits)} visits this week</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${growth > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-[#1e3a5f]/30 text-[#7a95b8]"}`}>
                        {growth > 0 ? `+${growth}` : growth}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === "errors" && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <StatCard icon={Bug} label="Last 24 Hours" value={summary?.errorStats?.last24h ?? 0} color={summary?.errorStats?.last24h > 0 ? "red" : "emerald"} />
            <StatCard icon={AlertTriangle} label="Last 7 Days" value={summary?.errorStats?.last7d ?? 0} color={summary?.errorStats?.last7d > 5 ? "amber" : "emerald"} />
            <StatCard icon={Shield} label="Total All-Time" value={summary?.errorStats?.total ?? 0} color="blue" />
          </div>
          <div className="relative max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a95b8]" />
            <input type="text" placeholder="Filter errors by page or message..." value={errorFilter} onChange={e => setErrorFilter(e.target.value)} className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#0d1526] border border-[#1e3a5f]/30 text-white text-sm placeholder:text-[#7a95b8]/50 focus:outline-none focus:border-emerald-500/50" />
          </div>
          <div className="rounded-xl border border-[#1e3a5f]/30 bg-[#0d1526] p-4">
            <SectionHeader icon={AlertTriangle} title="Errors Grouped by Page" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-[#1e3a5f]/30">
                  <th className="text-left py-2 px-3 text-[#7a95b8] font-medium text-xs">Page</th>
                  <th className="text-left py-2 px-3 text-[#7a95b8] font-medium text-xs">Error Message</th>
                  <th className="text-right py-2 px-3 text-[#7a95b8] font-medium text-xs">Count</th>
                  <th className="text-right py-2 px-3 text-[#7a95b8] font-medium text-xs">Last Seen</th>
                </tr></thead>
                <tbody>
                  {filteredErrors.length > 0 ? filteredErrors.map((err, i) => (
                    <tr key={`${err.pagePath}-${i}`} className="border-b border-[#1e3a5f]/10 hover:bg-[#1e3a5f]/10">
                      <td className="py-2 px-3 text-white max-w-[200px] truncate">{err.pagePath || "—"}</td>
                      <td className="py-2 px-3 text-red-300/80 max-w-[300px] truncate font-mono text-xs">{err.message}</td>
                      <td className="py-2 px-3 text-right"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${Number(err.errorCount) > 5 ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"}`}>{Number(err.errorCount)}</span></td>
                      <td className="py-2 px-3 text-right text-[#7a95b8] text-xs">{err.lastOccurrence ? new Date(err.lastOccurrence).toLocaleDateString() : "—"}</td>
                    </tr>
                  )) : <tr><td colSpan={4} className="py-8 text-center text-[#7a95b8]">{errorFilter ? "No errors matching filter" : "No errors recorded"}</td></tr>}
                </tbody>
              </table>
            </div>
            {errorsByPage && errorsByPage.length > 10 && (
              <button onClick={() => setShowAllErrors(!showAllErrors)} className="flex items-center gap-1 mt-3 text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                {showAllErrors ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {showAllErrors ? "Show fewer" : `Show all ${errorsByPage.length} error groups`}
              </button>
            )}
          </div>
          <div className="rounded-xl border border-[#1e3a5f]/30 bg-[#0d1526] p-4">
            <SectionHeader icon={Clock} title="Recent Error Events" />
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredRecentErrors.length > 0 ? filteredRecentErrors.map((err, i) => (
                <div key={err.id || i} className="flex items-start gap-3 px-3 py-2 rounded-lg border border-[#1e3a5f]/10 hover:border-red-500/20 transition-colors">
                  <Bug size={14} className="text-red-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{err.message}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-[#7a95b8]">{err.url || "—"}</span>
                      <span className="text-xs text-[#7a95b8]">{err.createdAt ? new Date(err.createdAt).toLocaleString() : "—"}</span>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${err.source === "portal_page" ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400"}`}>{err.source || "client"}</span>
                </div>
              )) : <p className="text-sm text-[#7a95b8] text-center py-4">No recent errors</p>}
            </div>
          </div>
        </>
      )}

      {activeTab === "tools" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={Eye} label="Total Visits" value={summary?.usageSummary?.totalVisits?.toLocaleString() ?? "—"} color="emerald" />
            <StatCard icon={Wrench} label="Tools Used" value={summary?.usageSummary?.uniqueTools ?? "—"} color="blue" />
            <StatCard icon={Users} label="Active Users" value={summary?.usageSummary?.uniqueUsers ?? "—"} color="cyan" />
            <StatCard icon={TrendingUp} label="Avg/User" value={summary?.usageSummary?.avgVisitsPerUser ?? "—"} color="purple" />
          </div>
          <div className="rounded-xl border border-[#1e3a5f]/30 bg-[#0d1526] p-4">
            <SectionHeader icon={BarChart3} title="Top 15 Tools by Visit Count" />
            {popularTools && popularTools.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={popularTools.slice(0, 15).map(t => ({ name: t.toolLabel.length > 25 ? t.toolLabel.slice(0, 22) + "..." : t.toolLabel, visits: Number(t.visitCount), users: Number(t.uniqueUsers) }))} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" opacity={0.3} />
                  <XAxis type="number" tick={{ fill: "#7a95b8", fontSize: 11 }} axisLine={false} />
                  <YAxis type="category" dataKey="name" width={180} tick={{ fill: "#7a95b8", fontSize: 10 }} axisLine={false} />
                  <Tooltip contentStyle={{ background: "#0d1526", border: "1px solid #1e3a5f", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#fff" }} />
                  <Bar dataKey="visits" fill="#22c55e" radius={[0, 4, 4, 0]} name="Visits" />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-48 flex items-center justify-center text-[#7a95b8] text-sm">No tool usage data yet</div>}
          </div>
          <div className="rounded-xl border border-[#1e3a5f]/30 bg-[#0d1526] p-4">
            <SectionHeader icon={Hash} title="All Tracked Tools" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-[#1e3a5f]/30">
                  <th className="text-left py-2 px-3 text-[#7a95b8] font-medium text-xs">#</th>
                  <th className="text-left py-2 px-3 text-[#7a95b8] font-medium text-xs">Tool Name</th>
                  <th className="text-left py-2 px-3 text-[#7a95b8] font-medium text-xs">Path</th>
                  <th className="text-right py-2 px-3 text-[#7a95b8] font-medium text-xs">Visits</th>
                  <th className="text-right py-2 px-3 text-[#7a95b8] font-medium text-xs">Users</th>
                </tr></thead>
                <tbody>
                  {popularTools?.map((tool, i) => (
                    <tr key={tool.toolPath} className="border-b border-[#1e3a5f]/10 hover:bg-[#1e3a5f]/10">
                      <td className="py-2 px-3 text-[#7a95b8]">{i + 1}</td>
                      <td className="py-2 px-3 text-white">{tool.toolLabel}</td>
                      <td className="py-2 px-3 text-[#7a95b8] font-mono text-xs">{tool.toolPath}</td>
                      <td className="py-2 px-3 text-right text-emerald-400 font-semibold">{Number(tool.visitCount).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right text-blue-400">{Number(tool.uniqueUsers)}</td>
                    </tr>
                  )) ?? <tr><td colSpan={5} className="py-4 text-center text-[#7a95b8]">No data</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === "performance" && (
        <>
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex gap-1 p-1 rounded-lg bg-[#0d1526] border border-[#1e3a5f]/30">
              {Object.keys(metricThresholds).map(m => (
                <button key={m} onClick={() => setPerfMetric(m)} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${perfMetric === m ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/30" : "text-[#7a95b8] hover:text-white"}`}>{m}</button>
              ))}
            </div>
            <div className="flex gap-1 p-1 rounded-lg bg-[#0d1526] border border-[#1e3a5f]/30">
              {[7, 14, 30].map(d => (
                <button key={d} onClick={() => setPerfDays(d)} className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${perfDays === d ? "bg-blue-600/20 text-blue-400 border border-blue-500/30" : "text-[#7a95b8] hover:text-white"}`}>{d}d</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {perfSummary?.length ? perfSummary.map(metric => {
              const t = metricThresholds[metric.metricName]; if (!t) return null;
              const rating = getValueRating(metric.metricName, Number(metric.avgValue));
              const total = Number(metric.goodCount) + Number(metric.needsImprovementCount) + Number(metric.poorCount);
              const goodPct = total > 0 ? Math.round((Number(metric.goodCount) / total) * 100) : 0;
              return (
                <div key={metric.metricName} className={`rounded-xl border p-4 flex flex-col gap-2 ${rating === "good" ? "border-emerald-500/20 bg-emerald-500/5" : rating === "needs-improvement" ? "border-amber-500/20 bg-amber-500/5" : "border-red-500/20 bg-red-500/5"}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#7a95b8] uppercase tracking-wider font-medium">{metric.metricName}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${rating === "good" ? "bg-emerald-500/20 text-emerald-400" : rating === "needs-improvement" ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"}`}>{rating === "needs-improvement" ? "NEEDS WORK" : rating.toUpperCase()}</span>
                  </div>
                  <div className={`text-2xl font-bold ${getRatingColor(rating)}`}>{Number(metric.avgValue).toLocaleString()}{t.unit && <span className="text-sm font-normal ml-0.5">{t.unit}</span>}</div>
                  <div className="text-[10px] text-[#7a95b8]">{t.label}</div>
                  <div className="flex items-center gap-2 mt-1"><div className="flex-1 h-1.5 rounded-full bg-[#1e3a5f]/30 overflow-hidden"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${goodPct}%` }} /></div><span className="text-[10px] text-emerald-400 font-medium">{goodPct}% good</span></div>
                  <div className="text-[10px] text-[#7a95b8]">{Number(metric.sampleCount)} samples</div>
                </div>
              );
            }) : <div className="col-span-5 text-center text-[#7a95b8] py-8">No performance data yet. Metrics will appear as users browse the platform.</div>}
          </div>

          <div className="rounded-xl border border-[#1e3a5f]/30 bg-[#0d1526]/50 p-4">
            <SectionHeader icon={TrendingUp} title={`${perfMetric} Trend (14 days)`} />
            {perfTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={perfTrendData}>
                  <defs>
                    <linearGradient id="perfAvgGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                    <linearGradient id="perfP95Grad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f30" />
                  <XAxis dataKey="day" tick={{ fill: "#7a95b8", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#7a95b8", fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: "#0d1526", border: "1px solid #1e3a5f", borderRadius: 8, fontSize: 12 }} />
                  <Legend />
                  <Area type="monotone" dataKey="avg" name="Avg" stroke="#10b981" fill="url(#perfAvgGrad)" strokeWidth={2} />
                  <Area type="monotone" dataKey="p95" name="P95 (worst)" stroke="#f59e0b" fill="url(#perfP95Grad)" strokeWidth={1.5} strokeDasharray="4 2" />
                </AreaChart>
              </ResponsiveContainer>
            ) : <div className="text-center text-[#7a95b8] py-12">No trend data available yet</div>}
          </div>

          <div className="rounded-xl border border-[#1e3a5f]/30 bg-[#0d1526]/50 p-4">
            <SectionHeader icon={Timer} title={`Slowest Pages by ${perfMetric}`} />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-[#1e3a5f]/30">
                  <th className="text-left py-2 px-3 text-[#7a95b8] font-medium text-xs">#</th>
                  <th className="text-left py-2 px-3 text-[#7a95b8] font-medium text-xs">Page</th>
                  <th className="text-right py-2 px-3 text-[#7a95b8] font-medium text-xs">Avg {metricThresholds[perfMetric]?.unit || ""}</th>
                  <th className="text-right py-2 px-3 text-[#7a95b8] font-medium text-xs">Max {metricThresholds[perfMetric]?.unit || ""}</th>
                  <th className="text-right py-2 px-3 text-[#7a95b8] font-medium text-xs">Samples</th>
                  <th className="text-right py-2 px-3 text-[#7a95b8] font-medium text-xs">Poor</th>
                  <th className="text-center py-2 px-3 text-[#7a95b8] font-medium text-xs">Rating</th>
                </tr></thead>
                <tbody>
                  {slowestPages?.length ? slowestPages.map((page, i) => {
                    const rating = getValueRating(perfMetric, Number(page.avgValue));
                    return (
                      <tr key={page.pagePath} className="border-b border-[#1e3a5f]/10 hover:bg-[#1e3a5f]/10">
                        <td className="py-2 px-3 text-[#7a95b8]">{i + 1}</td>
                        <td className="py-2 px-3"><div className="text-white text-xs">{page.pageLabel || page.pagePath.split("/").pop()}</div><div className="text-[#7a95b8] font-mono text-[10px]">{page.pagePath}</div></td>
                        <td className={`py-2 px-3 text-right font-semibold ${getRatingColor(rating)}`}>{Number(page.avgValue).toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-[#7a95b8]">{Number(page.maxValue).toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-blue-400">{Number(page.sampleCount)}</td>
                        <td className="py-2 px-3 text-right text-red-400">{Number(page.poorCount)}</td>
                        <td className="py-2 px-3 text-center"><span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${rating === "good" ? "bg-emerald-500/20 text-emerald-400" : rating === "needs-improvement" ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"}`}>{rating === "needs-improvement" ? "NEEDS WORK" : rating.toUpperCase()}</span></td>
                      </tr>
                    );
                  }) : <tr><td colSpan={7} className="py-8 text-center text-[#7a95b8]">No performance data yet. Metrics will appear as users browse the platform.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-[#1e3a5f]/30 bg-[#0d1526]/50 p-4">
            <SectionHeader icon={Zap} title="Web Vitals Reference" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {Object.entries(metricThresholds).map(([key, t]) => (
                <div key={key} className="rounded-lg border border-[#1e3a5f]/20 p-3">
                  <div className="text-xs font-bold text-white mb-1">{key}</div>
                  <div className="text-[10px] text-[#7a95b8] mb-2">{t.label}</div>
                  <div className="space-y-1 text-[10px]">
                    <div className="flex justify-between"><span className="text-emerald-400">Good</span><span className="text-[#7a95b8]">&le; {t.good}{t.unit}</span></div>
                    <div className="flex justify-between"><span className="text-amber-400">Needs Work</span><span className="text-[#7a95b8]">&le; {t.poor}{t.unit}</span></div>
                    <div className="flex justify-between"><span className="text-red-400">Poor</span><span className="text-[#7a95b8]">&gt; {t.poor}{t.unit}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
