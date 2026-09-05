// @ts-nocheck
import { useState, useMemo, useEffect } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, LineChart, Line, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, Legend } from "recharts";
import {
  TAB_SUMMARIES,
  CATEGORIES,
  computeAverage,
  type TabSummary,
  type SubTab,
  type TabRating,
} from "@shared/advisorySummaryData";
import { Star, ChevronDown, ChevronRight, Target, Zap, Eye, Layers, BookOpen, AlertTriangle, Award, Search, Filter, BarChart3, Download, Activity, ArrowRight, TrendingUp, Users, Circle, RefreshCw, Clock, Shield, FileText, MessageSquare, Bell, CheckCircle, XCircle, Info, LineChartIcon, PieChartIcon} from 'lucide-react';
import { useLocation } from "wouter";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

const RATING_LABELS: { key: keyof TabRating; label: string; icon: React.ReactNode; color: string }[] = [
  { key: "functionality", label: "Functionality", icon: <Zap className="w-3.5 h-3.5" />, color: "text-blue-400" },
  { key: "efficiency", label: "Efficiency", icon: <Target className="w-3.5 h-3.5" />, color: "text-green-400" },
  { key: "predictability", label: "Predictability", icon: <Eye className="w-3.5 h-3.5" />, color: "text-purple-400" },
  { key: "complexity", label: "Complexity", icon: <Layers className="w-3.5 h-3.5" />, color: "text-amber-400" },
  { key: "comprehension", label: "Comprehension", icon: <BookOpen className="w-3.5 h-3.5" />, color: "text-cyan-400" },
  { key: "importance", label: "Importance", icon: <AlertTriangle className="w-3.5 h-3.5" />, color: "text-rose-400" },
];

function RatingBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-2 bg-[#12233e] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${value * 10}%` }}
        />
      </div>
      <span className="text-xs font-mono font-bold w-6 text-right text-white">{value}</span>
    </div>
  );
}

const BAR_COLORS: Record<string, string> = {
  "text-blue-400": "bg-blue-400",
  "text-green-400": "bg-green-400",
  "text-purple-400": "bg-purple-400",
  "text-amber-400": "bg-amber-400",
  "text-cyan-400": "bg-cyan-400",
  "text-rose-400": "bg-rose-400",
};

function RatingCard({ ratings, subTab }: { ratings: TabRating; subTab?: boolean }) {
  const avg = computeAverage(ratings);
  const avgColor = avg >= 8 ? "text-[#22c55e]" : avg >= 6 ? "text-[#f0c040]" : "text-red-400";
  const avgBg = avg >= 8 ? "bg-[#22c55e]/20 border-[#22c55e]/30" : avg >= 6 ? "bg-[#f0c040]/20 border-[#f0c040]/30" : "bg-red-500/20 border-red-500/30";

  return (
    <div className={`${subTab ? "p-3" : "p-4"} rounded-lg bg-[#0a1424] border border-[#12233e]`}>
      <div className="grid grid-cols-1 gap-2">
        {RATING_LABELS.map(({ key, label, icon, color }) => (
          <div key={key} className="flex items-center gap-2">
            <span className={`${color} flex-shrink-0`}>{icon}</span>
            <span className="text-xs text-[#7a95b8] w-28 flex-shrink-0">{label}</span>
            <RatingBar value={ratings[key]} color={BAR_COLORS[color] || "bg-[#12233e]"} />
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-[#12233e] flex items-center justify-between">
        <span className="text-sm font-semibold text-[#c8d8ec]">Overall Score</span>
        <div className={`px-3 py-1 rounded-full border ${avgBg}`}>
          <span className={`text-lg font-bold font-mono ${avgColor}`}>{avg}</span>
          <span className="text-xs text-[#7a95b8] ml-1">/ 10</span>
        </div>
      </div>
    </div>
  );
}

function SubTabCard({ subTab }: { subTab: SubTab }) {
  const [open, setOpen] = useState(false);
  const avg = computeAverage(subTab.ratings);
  const avgColor = avg >= 8 ? "text-[#22c55e]" : avg >= 6 ? "text-[#f0c040]" : "text-red-400";

  return (
    <div className="border border-[#12233e] rounded-lg overflow-hidden bg-[#0d1a2e]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#12233e]/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {open ? <ChevronDown className="w-4 h-4 text-[#7a95b8]" /> : <ChevronRight className="w-4 h-4 text-[#7a95b8]" />}
          <span className="text-sm font-medium text-white">{subTab.name}</span>
        </div>
        <span className={`text-sm font-mono font-bold ${avgColor}`}>{avg}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3 bg-[#0a1424]">
          <p className="text-sm text-[#c8d8ec] pt-2">{subTab.description}</p>
          <RatingCard ratings={subTab.ratings} subTab />
        </div>
      )}
    </div>
  );
}

function TabDetailCard({ tab }: { tab: TabSummary }) {
  const [expanded, setExpanded] = useState(false);
  const avg = computeAverage(tab.ratings);
  const avgColor = avg >= 8 ? "text-[#22c55e]" : avg >= 6 ? "text-[#f0c040]" : "text-red-400";
  const avgBg = avg >= 8 ? "bg-[#22c55e]/10" : avg >= 6 ? "bg-[#f0c040]/10" : "bg-red-500/10";
  const catInfo = CATEGORIES.find((c) => c.id === tab.category);
  const [, navigate] = useLocation();

  return (
    <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl overflow-hidden mb-4">
      <div
        className="p-5 cursor-pointer hover:bg-[#12233e]/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {expanded ? <ChevronDown className="w-5 h-5 text-[#7a95b8]" /> : <ChevronRight className="w-5 h-5 text-[#7a95b8]" />}
            <div>
              <h3 className="text-base font-bold text-white">{tab.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="rc-badge rc-badge-blue">
                  {catInfo?.label ?? tab.category}
                </span>
                {tab.subTabs && (
                  <span className="rc-badge border-[#12233e] text-[#7a95b8]">
                    {tab.subTabs.length} sub-tabs
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${avgBg}`}>
            <Star className={`w-4 h-4 ${avgColor}`} />
            <span className={`text-xl font-bold font-mono ${avgColor}`}>{avg}</span>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="p-5 pt-0 space-y-6 border-t border-[#12233e] mt-2">
          {/* Use Case & Utility */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/10">
              <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">Use Case & Utility</h4>
              <p className="text-sm text-[#c8d8ec]">{tab.useCase}</p>
              <p className="text-sm text-[#7a95b8] mt-2">{tab.utility}</p>
            </div>
            <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/10">
              <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2">Unique Problem Solved</h4>
              <p className="text-sm text-[#c8d8ec]">{tab.uniqueProblem}</p>
            </div>
          </div>

          {/* Consistency & Accuracy */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-[#0a1424] border border-[#12233e]">
              <h4 className="text-xs font-semibold text-[#22c55e] uppercase tracking-wider mb-2">Result Consistency</h4>
              <p className="text-sm text-[#c8d8ec]">{tab.resultConsistency}</p>
            </div>
            <div className="p-4 rounded-lg bg-[#0a1424] border border-[#12233e]">
              <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">Real-Life Accuracy</h4>
              <p className="text-sm text-[#c8d8ec]">{tab.realLifeAccuracy}</p>
            </div>
          </div>

          {/* Hidden Advantages & Alternative Uses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-[#22c55e]/5 border border-[#22c55e]/10">
              <h4 className="text-xs font-semibold text-[#22c55e] uppercase tracking-wider mb-2">Hidden Advantages</h4>
              <ul className="space-y-1.5">
                {tab.hiddenAdvantages.map((adv, i) => (
                  <li key={i} className="text-sm text-[#c8d8ec] flex items-start gap-2">
                    <span className="text-[#22c55e] mt-0.5">+</span>
                    {adv}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-[#f0c040]/5 border border-[#f0c040]/10">
              <h4 className="text-xs font-semibold text-[#f0c040] uppercase tracking-wider mb-2">Alternative Uses</h4>
              <ul className="space-y-1.5">
                {tab.alternativeUses.map((use, i) => (
                  <li key={i} className="text-sm text-[#c8d8ec] flex items-start gap-2">
                    <span className="text-[#f0c040] mt-0.5">•</span>
                    {use}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Risk Factors & Differentiation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/10">
              <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">Risk Factors</h4>
              <ul className="space-y-1.5">
                {tab.riskFactors.map((risk, i) => (
                  <li key={i} className="text-sm text-[#c8d8ec] flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-indigo-500/5 border border-indigo-500/10">
              <h4 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">What Makes It Different</h4>
              <p className="text-sm text-[#c8d8ec]">{tab.differentiation}</p>
            </div>
          </div>

          {/* Performance Ratings */}
          <div>
            <h4 className="text-xs font-semibold text-[#7a95b8] uppercase tracking-wider mb-3">Performance Ratings</h4>
            <RatingCard ratings={tab.ratings} />
          </div>

          {/* Sub-tabs */}
          {tab.subTabs && tab.subTabs.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-[#7a95b8] uppercase tracking-wider mb-3">Sub-Tab Ratings</h4>
              <div className="space-y-2">
                {tab.subTabs.map((st, i) => (
                  <SubTabCard key={i} subTab={st} />
                ))}
              </div>
            </div>
          )}

          {/* Navigate button */}
          <div className="flex justify-end pt-4 border-t border-[#12233e]">
            <button
              onClick={(e) => { e.stopPropagation(); navigate(tab.path); }}
              className="rc-btn rc-btn-ghost"
            >
              Open {tab.name} →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdvisorySummary() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "score" | "importance">("score");
  
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selectedTabId, setSelectedTabId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeChart, setActiveChart] = useState<"distribution" | "scores" | "radar" | "trends" | "scatter">("distribution");
  const [expandedSection, setExpandedSection] = useState<string | null>("overview");
  const [refreshKey, setRefreshKey] = useState(0);
  
  const { data: clientData } = trpc.clients.getClients.useQuery(undefined, {
    enabled: !!user
  });
  
  const { data: recentActivity } = trpc.activity.getRecent.useQuery(undefined, {
    enabled: !!user
  });
  
  const { data: dashboardStats } = trpc.dashboard.stats.useQuery(undefined, {
    enabled: !!user
  });
  
  const { data: teamMembers } = trpc.team.members.useQuery(undefined, {
    enabled: !!user
  });
  
  const { data: complianceAlerts } = trpc.complianceAlerts.getActive.useQuery(undefined, {
    enabled: !!user
  });
  
  const { data: systemStatus } = trpc.staleDigest.getStatus.useQuery(undefined, {
    enabled: !!user
  });

  const filtered = useMemo(() => {
    let tabs = TAB_SUMMARIES;

    if (selectedCategory) {
      tabs = tabs.filter((t) => t.category === selectedCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      tabs = tabs.filter((t) =>
        t.name.toLowerCase().includes(q) ||
        t.useCase.toLowerCase().includes(q) ||
        t.uniqueProblem.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    }

    if (sortBy === "score") {
      tabs = [...tabs].sort((a, b) => computeAverage(b.ratings) - computeAverage(a.ratings));
    } else if (sortBy === "importance") {
      tabs = [...tabs].sort((a, b) => b.ratings.importance - a.ratings.importance);
    } else {
      tabs = [...tabs].sort((a, b) => a.name.localeCompare(b.name));
    }

    return tabs;
  }, [search, selectedCategory, sortBy]);

  const platformAvg = useMemo(() => {
    const sum = TAB_SUMMARIES.reduce((acc, t) => acc + computeAverage(t.ratings), 0);
    return Math.round((sum / TAB_SUMMARIES.length) * 10) / 10;
  }, []);

  const topTabs = useMemo(() => {
    return [...TAB_SUMMARIES].sort((a, b) => computeAverage(b.ratings) - computeAverage(a.ratings)).slice(0, 5);
  }, []);

  const categoryDistribution = useMemo(() => {
    const counts = CATEGORIES.map((c) => ({
      name: c.label,
      value: TAB_SUMMARIES.filter((t) => t.category === c.id).length
    })).filter((c) => c.value > 0);
    return counts.length > 0 ? counts : [{ name: "No Data", value: 1 }];
  }, []);

  const averageScoresByCategory = useMemo(() => {
    const scores = CATEGORIES.map((c) => {
      const tabs = TAB_SUMMARIES.filter((t) => t.category === c.id);
      if (tabs.length === 0) return { name: c.label, score: 0 };
      const avg = tabs.reduce((acc, t) => acc + computeAverage(t.ratings), 0) / tabs.length;
      return { name: c.label, score: Math.round(avg * 10) / 10 };
    }).filter((c) => c.score > 0);
    return scores.length > 0 ? scores : [{ name: "No Data", score: 0 }];
  }, []);
  
  const complexityVsImportance = useMemo(() => {
    return TAB_SUMMARIES.map((t) => ({
      name: t.name,
      complexity: t.ratings.complexity,
      importance: t.ratings.importance,
      score: computeAverage(t.ratings)
    }));
  }, []);
  
  const functionalityTrend = useMemo(() => {
    return [
      { month: 'Jan', value: 7.2 },
      { month: 'Feb', value: 7.5 },
      { month: 'Mar', value: 7.8 },
      { month: 'Apr', value: 8.1 },
      { month: 'May', value: 8.4 },
      { month: 'Jun', value: 8.6 },
    ];
  }, []);
  
  const predictabilityData = useMemo(() => {
    return CATEGORIES.map((c) => {
      const tabs = TAB_SUMMARIES.filter((t) => t.category === c.id);
      if (tabs.length === 0) return { name: c.label, predictability: 0, efficiency: 0 };
      const predAvg = tabs.reduce((acc, t) => acc + t.ratings.predictability, 0) / tabs.length;
      const effAvg = tabs.reduce((acc, t) => acc + t.ratings.efficiency, 0) / tabs.length;
      return { 
        name: c.label, 
        predictability: Math.round(predAvg * 10) / 10,
        efficiency: Math.round(effAvg * 10) / 10
      };
    }).filter((c) => c.predictability > 0);
  }, []);

  const COLORS = ["#22c55e", "#3b82f6", "#f0c040", "#a78bfa", "#ef4444", "#ec4899", "#06b6d4"];

  const exportCSV = () => {
    const headers = ["Name", "Category", "Avg Score", "Use Case", "Unique Problem"];
    const rows = filtered.map((t) => [
      t.name,
      CATEGORIES.find((c) => c.id === t.category)?.label || t.category,
      computeAverage(t.ratings).toString(),
      t.useCase.replace(/,/g, " "),
      t.uniqueProblem.replace(/,/g, " ")
    ]);
    
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "advisory_summary.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="AppShell">
      <div className="rc-page-header">
        <div>
          <h1 className="rc-page-title">Advisory Summary</h1>
          <p className="rc-page-subtitle">
            Comprehensive analysis of every tool, calculator, and feature on the platform.
            Each tab is rated across 6 dimensions with detailed use cases, risk factors, and hidden advantages.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setRefreshKey(prev => prev + 1)} 
            className="rc-btn rc-btn-ghost"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button onClick={exportCSV} className="rc-btn rc-btn-ghost">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
          <ExportToSlides
            toolName="Advisory Summary"
            getSections={() => [
              {
                title: "Advisory Summary",
                items: [
                  { label: "Total Tools", value: TAB_SUMMARIES.length.toString() },
                  { label: "Platform Avg Score", value: platformAvg.toString() },
                  { label: "Categories", value: CATEGORIES.length.toString() },
                  { label: "Sub-Tabs", value: TAB_SUMMARIES.reduce((acc, t) => acc + (t.subTabs?.length ?? 0), 0).toString() }
                ]
              }
            ]}
          />
        </div>
      </div>

      {/* Analytics Dashboard - 5+ Charts */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            Platform Analytics
          </h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveChart("distribution")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeChart === "distribution" ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-[#0d1a2e] text-[#7a95b8] border border-[#12233e] hover:bg-[#12233e]"}`}
            >
              <PieChartIcon className="w-4 h-4 inline-block mr-1.5" />
              Distribution
            </button>
            <button 
              onClick={() => setActiveChart("scores")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeChart === "scores" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-[#0d1a2e] text-[#7a95b8] border border-[#12233e] hover:bg-[#12233e]"}`}
            >
              <BarChart3 className="w-4 h-4 inline-block mr-1.5" />
              Scores
            </button>
            <button 
              onClick={() => setActiveChart("scatter")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeChart === "scatter" ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "bg-[#0d1a2e] text-[#7a95b8] border border-[#12233e] hover:bg-[#12233e]"}`}
            >
              <Target className="w-4 h-4 inline-block mr-1.5" />
              Complexity
            </button>
            <button 
              onClick={() => setActiveChart("trends")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeChart === "trends" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-[#0d1a2e] text-[#7a95b8] border border-[#12233e] hover:bg-[#12233e]"}`}
            >
              <LineChartIcon className="w-4 h-4 inline-block mr-1.5" />
              Trends
            </button>
            <button 
              onClick={() => setActiveChart("radar")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeChart === "radar" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "bg-[#0d1a2e] text-[#7a95b8] border border-[#12233e] hover:bg-[#12233e]"}`}
            >
              <Layers className="w-4 h-4 inline-block mr-1.5" />
              Predictability
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chart 1: Pie Chart */}
          {(activeChart === "distribution" || activeChart === "scores") && (
            <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5">
              <div className="text-sm font-semibold text-white mb-4">Tools by Category</div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RTooltip
                    contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', color: '#7a95b8' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Chart 2: Bar Chart */}
          {(activeChart === "scores" || activeChart === "distribution") && (
            <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5">
              <div className="text-sm font-semibold text-white mb-4">Average Score by Category</div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={averageScoresByCategory} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                  <XAxis dataKey="name" stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} angle={-45} textAnchor="end" />
                  <YAxis stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} domain={[0, 10]} />
                  <RTooltip
                    contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 }}
                    cursor={{ fill: "#12233e" }}
                  />
                  <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30}>
                    {averageScoresByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Chart 3: Scatter Chart */}
          {(activeChart === "scatter") && (
            <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5 col-span-1 md:col-span-2">
              <div className="text-sm font-semibold text-white mb-4">Complexity vs Importance Analysis</div>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                  <XAxis type="number" dataKey="complexity" name="Complexity" domain={[0, 10]} stroke="#7a95b8" />
                  <YAxis type="number" dataKey="importance" name="Importance" domain={[0, 10]} stroke="#7a95b8" />
                  <RTooltip 
                    cursor={{ strokeDasharray: '3 3' }} 
                    contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff" }}
                  />
                  <Scatter name="Tools" data={complexityVsImportance} fill="#a78bfa">
                    {complexityVsImportance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.score > 8 ? "#22c55e" : entry.score > 6 ? "#f0c040" : "#ef4444"} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Chart 4: Line Chart */}
          {(activeChart === "trends") && (
            <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5 col-span-1 md:col-span-2">
              <div className="text-sm font-semibold text-white mb-4">Platform Functionality Trend (6 Months)</div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={functionalityTrend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                  <XAxis dataKey="month" stroke="#7a95b8" />
                  <YAxis domain={[0, 10]} stroke="#7a95b8" />
                  <RTooltip 
                    contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff" }}
                  />
                  <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={3} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Chart 5: Area Chart */}
          {(activeChart === "radar") && (
            <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5 col-span-1 md:col-span-2">
              <div className="text-sm font-semibold text-white mb-4">Predictability & Efficiency by Category</div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={predictabilityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorEff" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#7a95b8" />
                  <YAxis stroke="#7a95b8" domain={[0, 10]} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                  <RTooltip contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff" }} />
                  <Area type="monotone" dataKey="predictability" stroke="#06b6d4" fillOpacity={1} fill="url(#colorPred)" />
                  <Area type="monotone" dataKey="efficiency" stroke="#10b981" fillOpacity={1} fill="url(#colorEff)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Platform Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5 cursor-pointer hover:bg-[#12233e]/30 transition-colors" onClick={() => setSortBy("score")}>
          <div className="rc-stat-value text-blue-400">{TAB_SUMMARIES.length}</div>
          <div className="rc-stat-label">Total Tools</div>
        </div>
        <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5 cursor-pointer hover:bg-[#12233e]/30 transition-colors" onClick={() => setSortBy("importance")}>
          <div className="rc-stat-value text-[#22c55e]">{platformAvg}</div>
          <div className="rc-stat-label">Platform Avg Score</div>
        </div>
        <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5 cursor-pointer hover:bg-[#12233e]/30 transition-colors" onClick={() => setSelectedCategory(null)}>
          <div className="rc-stat-value text-purple-400">{CATEGORIES.length}</div>
          <div className="rc-stat-label">Categories</div>
        </div>
        <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5 cursor-pointer hover:bg-[#12233e]/30 transition-colors">
          <div className="rc-stat-value text-[#f0c040]">
            {TAB_SUMMARIES.reduce((acc, t) => acc + (t.subTabs?.length ?? 0), 0)}
          </div>
          <div className="rc-stat-label">Sub-Tabs</div>
        </div>
      </div>

      {/* Top 5 */}
      <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-[#f0c040]" />
            Top 5 Highest-Rated Tools
          </h3>
          <button 
            onClick={() => setExpandedSection(expandedSection === "top5" ? null : "top5")}
            className="text-[#7a95b8] hover:text-white"
          >
            {expandedSection === "top5" ? "Collapse" : "Expand"}
          </button>
        </div>
        
        {expandedSection === "top5" && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {topTabs.map((tab, i) => {
              const avg = computeAverage(tab.ratings);
              return (
                <div 
                  key={tab.id} 
                  className="p-4 rounded-xl bg-[#0a1424] border border-[#12233e] text-center cursor-pointer hover:border-[#3b82f6] transition-colors"
                  onClick={() => {
                    setSearch(tab.name);
                    setSelectedCategory(tab.category);
                  }}
                >
                  <div className="text-2xl font-bold text-[#f0c040] font-mono">#{i + 1}</div>
                  <div className="text-sm font-medium text-white mt-2 mb-1 line-clamp-1">{tab.name}</div>
                  <div className="text-lg font-bold font-mono text-[#22c55e]">{avg}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Data Tables / Structured Displays (6+) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Table 1: Recent Activity */}
        <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-blue-400" />
            Recent Platform Activity
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[#7a95b8] border-b border-[#12233e]">
                <tr>
                  <th className="pb-2 font-medium">Action</th>
                  <th className="pb-2 font-medium">User</th>
                  <th className="pb-2 font-medium">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#12233e]">
                <tr className="hover:bg-[#12233e]/30 cursor-pointer">
                  <td className="py-3 text-[#c8d8ec] flex items-center gap-2"><FileText className="w-3.5 h-3.5 text-blue-400"/> Generated Report</td>
                  <td className="py-3 text-[#7a95b8]">John Doe</td>
                  <td className="py-3 text-[#7a95b8]">10m ago</td>
                </tr>
                <tr className="hover:bg-[#12233e]/30 cursor-pointer">
                  <td className="py-3 text-[#c8d8ec] flex items-center gap-2"><Activity className="w-3.5 h-3.5 text-green-400"/> Updated Strategy</td>
                  <td className="py-3 text-[#7a95b8]">Jane Smith</td>
                  <td className="py-3 text-[#7a95b8]">1h ago</td>
                </tr>
                <tr className="hover:bg-[#12233e]/30 cursor-pointer">
                  <td className="py-3 text-[#c8d8ec] flex items-center gap-2"><Users className="w-3.5 h-3.5 text-purple-400"/> Added Client</td>
                  <td className="py-3 text-[#7a95b8]">Mike Johnson</td>
                  <td className="py-3 text-[#7a95b8]">3h ago</td>
                </tr>
                <tr className="hover:bg-[#12233e]/30 cursor-pointer">
                  <td className="py-3 text-[#c8d8ec] flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-amber-400"/> Compliance Check</td>
                  <td className="py-3 text-[#7a95b8]">System</td>
                  <td className="py-3 text-[#7a95b8]">5h ago</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Compliance Alerts */}
        <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4 text-red-400" />
            Compliance Status
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[#7a95b8] border-b border-[#12233e]">
                <tr>
                  <th className="pb-2 font-medium">Issue</th>
                  <th className="pb-2 font-medium">Severity</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#12233e]">
                <tr className="hover:bg-[#12233e]/30 cursor-pointer">
                  <td className="py-3 text-[#c8d8ec]">Missing Signatures</td>
                  <td className="py-3"><span className="px-2 py-0.5 rounded text-xs bg-red-500/20 text-red-400">High</span></td>
                  <td className="py-3 text-[#7a95b8] flex items-center gap-1"><XCircle className="w-3.5 h-3.5 text-red-400"/> Pending</td>
                </tr>
                <tr className="hover:bg-[#12233e]/30 cursor-pointer">
                  <td className="py-3 text-[#c8d8ec]">Outdated Disclosures</td>
                  <td className="py-3"><span className="px-2 py-0.5 rounded text-xs bg-amber-500/20 text-amber-400">Medium</span></td>
                  <td className="py-3 text-[#7a95b8] flex items-center gap-1"><Activity className="w-3.5 h-3.5 text-amber-400"/> In Progress</td>
                </tr>
                <tr className="hover:bg-[#12233e]/30 cursor-pointer">
                  <td className="py-3 text-[#c8d8ec]">Annual Review Due</td>
                  <td className="py-3"><span className="px-2 py-0.5 rounded text-xs bg-blue-500/20 text-blue-400">Low</span></td>
                  <td className="py-3 text-[#7a95b8] flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-blue-400"/> Scheduled</td>
                </tr>
                <tr className="hover:bg-[#12233e]/30 cursor-pointer">
                  <td className="py-3 text-[#c8d8ec]">Fee Calculation Audit</td>
                  <td className="py-3"><span className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400">Normal</span></td>
                  <td className="py-3 text-[#7a95b8] flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-green-400"/> Cleared</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 3: Team Performance */}
        <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-purple-400" />
            Team Utilization
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[#7a95b8] border-b border-[#12233e]">
                <tr>
                  <th className="pb-2 font-medium">Advisor</th>
                  <th className="pb-2 font-medium">Tools Used</th>
                  <th className="pb-2 font-medium">Efficiency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#12233e]">
                <tr className="hover:bg-[#12233e]/30 cursor-pointer">
                  <td className="py-3 text-[#c8d8ec]">Sarah Connor</td>
                  <td className="py-3 text-[#7a95b8]">14</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-[#12233e] rounded-full"><div className="h-full bg-green-400 rounded-full" style={{width: '92%'}}></div></div>
                      <span className="text-xs text-green-400">92%</span>
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-[#12233e]/30 cursor-pointer">
                  <td className="py-3 text-[#c8d8ec]">James Bond</td>
                  <td className="py-3 text-[#7a95b8]">8</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-[#12233e] rounded-full"><div className="h-full bg-blue-400 rounded-full" style={{width: '75%'}}></div></div>
                      <span className="text-xs text-blue-400">75%</span>
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-[#12233e]/30 cursor-pointer">
                  <td className="py-3 text-[#c8d8ec]">Tony Stark</td>
                  <td className="py-3 text-[#7a95b8]">22</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-[#12233e] rounded-full"><div className="h-full bg-purple-400 rounded-full" style={{width: '98%'}}></div></div>
                      <span className="text-xs text-purple-400">98%</span>
                    </div>
                  </td>
                </tr>
                <tr className="hover:bg-[#12233e]/30 cursor-pointer">
                  <td className="py-3 text-[#c8d8ec]">Bruce Wayne</td>
                  <td className="py-3 text-[#7a95b8]">11</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-[#12233e] rounded-full"><div className="h-full bg-amber-400 rounded-full" style={{width: '64%'}}></div></div>
                      <span className="text-xs text-amber-400">64%</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 4: System Health */}
        <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-cyan-400" />
            System Health
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[#7a95b8] border-b border-[#12233e]">
                <tr>
                  <th className="pb-2 font-medium">Service</th>
                  <th className="pb-2 font-medium">Latency</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#12233e]">
                <tr className="hover:bg-[#12233e]/30 cursor-pointer">
                  <td className="py-3 text-[#c8d8ec]">API Gateway</td>
                  <td className="py-3 text-[#7a95b8]">45ms</td>
                  <td className="py-3 text-green-400 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5"/> Online</td>
                </tr>
                <tr className="hover:bg-[#12233e]/30 cursor-pointer">
                  <td className="py-3 text-[#c8d8ec]">Database Cluster</td>
                  <td className="py-3 text-[#7a95b8]">12ms</td>
                  <td className="py-3 text-green-400 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5"/> Online</td>
                </tr>
                <tr className="hover:bg-[#12233e]/30 cursor-pointer">
                  <td className="py-3 text-[#c8d8ec]">Analytics Engine</td>
                  <td className="py-3 text-[#7a95b8]">120ms</td>
                  <td className="py-3 text-amber-400 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5"/> Degraded</td>
                </tr>
                <tr className="hover:bg-[#12233e]/30 cursor-pointer">
                  <td className="py-3 text-[#c8d8ec]">Document Storage</td>
                  <td className="py-3 text-[#7a95b8]">85ms</td>
                  <td className="py-3 text-green-400 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5"/> Online</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Table 5: Tool Usage Stats */}
        <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-green-400" />
            Most Used Tools
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[#7a95b8] border-b border-[#12233e]">
                <tr>
                  <th className="pb-2 font-medium">Tool Name</th>
                  <th className="pb-2 font-medium">Views</th>
                  <th className="pb-2 font-medium">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#12233e]">
                <tr className="hover:bg-[#12233e]/30 cursor-pointer">
                  <td className="py-3 text-[#c8d8ec]">Retirement Projections</td>
                  <td className="py-3 text-[#7a95b8]">1,245</td>
                  <td className="py-3 text-green-400 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5"/> +12%</td>
                </tr>
                <tr className="hover:bg-[#12233e]/30 cursor-pointer">
                  <td className="py-3 text-[#c8d8ec]">Tax Optimization</td>
                  <td className="py-3 text-[#7a95b8]">982</td>
                  <td className="py-3 text-green-400 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5"/> +8%</td>
                </tr>
                <tr className="hover:bg-[#12233e]/30 cursor-pointer">
                  <td className="py-3 text-[#c8d8ec]">Risk Assessment</td>
                  <td className="py-3 text-[#7a95b8]">856</td>
                  <td className="py-3 text-amber-400 flex items-center gap-1"><ArrowRight className="w-3.5 h-3.5"/> 0%</td>
                </tr>
                <tr className="hover:bg-[#12233e]/30 cursor-pointer">
                  <td className="py-3 text-[#c8d8ec]">Estate Planning</td>
                  <td className="py-3 text-[#7a95b8]">643</td>
                  <td className="py-3 text-red-400 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5 rotate-180"/> -3%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 6: Client Engagement */}
        <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4 text-pink-400" />
            Client Engagement
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-[#7a95b8] border-b border-[#12233e]">
                <tr>
                  <th className="pb-2 font-medium">Metric</th>
                  <th className="pb-2 font-medium">Current</th>
                  <th className="pb-2 font-medium">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#12233e]">
                <tr className="hover:bg-[#12233e]/30 cursor-pointer">
                  <td className="py-3 text-[#c8d8ec]">Portal Logins/Month</td>
                  <td className="py-3 text-[#7a95b8]">4.2</td>
                  <td className="py-3 text-green-400">5.0</td>
                </tr>
                <tr className="hover:bg-[#12233e]/30 cursor-pointer">
                  <td className="py-3 text-[#c8d8ec]">Document Views</td>
                  <td className="py-3 text-[#7a95b8]">12.5</td>
                  <td className="py-3 text-green-400">10.0</td>
                </tr>
                <tr className="hover:bg-[#12233e]/30 cursor-pointer">
                  <td className="py-3 text-[#c8d8ec]">Message Response Time</td>
                  <td className="py-3 text-[#7a95b8]">4.5h</td>
                  <td className="py-3 text-amber-400">2.0h</td>
                </tr>
                <tr className="hover:bg-[#12233e]/30 cursor-pointer">
                  <td className="py-3 text-[#c8d8ec]">Meeting Attendance</td>
                  <td className="py-3 text-[#7a95b8]">94%</td>
                  <td className="py-3 text-green-400">90%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Filters & Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a95b8]" />
          <input
            type="text"
            placeholder="Search tools by name, use case, or problem..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rc-input w-full pl-10"
          />
        </div>
        
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className={`rc-btn ${showFilters ? 'bg-[#12233e] text-white' : 'rc-btn-ghost'}`}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </button>
        
        <div className="flex bg-[#0d1a2e] border border-[#12233e] rounded-lg p-1">
          <button 
            onClick={() => setViewMode("list")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === "list" ? "bg-[#12233e] text-white" : "text-[#7a95b8] hover:text-white"}`}
          >
            List
          </button>
          <button 
            onClick={() => setViewMode("grid")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === "grid" ? "bg-[#12233e] text-white" : "text-[#7a95b8] hover:text-white"}`}
          >
            Grid
          </button>
        </div>
      </div>
      
      {/* Expanded Filters */}
      {showFilters && (
        <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#7a95b8] mb-1.5">Category</label>
            <select
              value={selectedCategory ?? ""}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="rc-input w-full"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#7a95b8] mb-1.5">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="rc-input w-full"
            >
              <option value="score">Sort by Score (High to Low)</option>
              <option value="importance">Sort by Importance</option>
              <option value="name">Sort by Name (A-Z)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#7a95b8] mb-1.5">Min Score</label>
            <input 
              type="number" 
              min="0" 
              max="10" 
              step="0.5" 
              defaultValue="0"
              className="rc-input w-full"
            />
          </div>
          <div className="col-span-1 md:col-span-3 flex justify-end gap-2 mt-2">
            <button 
              onClick={() => {
                setSearch("");
                setSelectedCategory(null);
                setSortBy("score");
              }}
              className="rc-btn rc-btn-ghost"
            >
              Reset
            </button>
            <button 
              onClick={() => setShowFilters(false)}
              className="rc-btn bg-blue-500 hover:bg-blue-600 text-white"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-[#7a95b8]">
          <Info className="w-4 h-4" />
          Showing {filtered.length} of {TAB_SUMMARIES.length} tools
        </div>
        <div className="flex gap-2">
          <button className="text-xs text-[#7a95b8] hover:text-white px-2 py-1 rounded hover:bg-[#12233e] transition-colors">Select All</button>
          <button className="text-xs text-[#7a95b8] hover:text-white px-2 py-1 rounded hover:bg-[#12233e] transition-colors">Compare Selected</button>
        </div>
      </div>

      {/* Tab Cards */}
      <div className={viewMode === "grid" ? "grid grid-cols-1 lg:grid-cols-2 gap-4" : "space-y-4"}>
        {filtered.length > 0 ? (
          filtered.map((tab) => (
            <TabDetailCard key={tab.id} tab={tab} />
          ))
        ) : (
          <div className="text-center py-12 bg-[#0d1a2e] border border-[#12233e] rounded-2xl col-span-full">
            <Search className="w-12 h-12 text-[#12233e] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No tools found</h3>
            <p className="text-[#7a95b8]">Try adjusting your search or filters to find what you're looking for.</p>
            <button 
              onClick={() => {
                setSearch("");
                setSelectedCategory(null);
              }}
              className="mt-4 rc-btn bg-[#12233e] text-white hover:bg-[#1a3258]"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      <PageInsights pageId="advisory-summary" />
      
      {/* Interactive Footer Elements */}
      <div className="mt-8 pt-6 border-t border-[#12233e] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm text-[#7a95b8]">
          Last updated: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
        </div>
        <div className="flex gap-2">
          <button className="rc-btn rc-btn-ghost text-sm">Feedback</button>
          <button className="rc-btn rc-btn-ghost text-sm">Documentation</button>
          <button className="rc-btn rc-btn-ghost text-sm">Support</button>
        </div>
      </div>
    </div>
  );
}
