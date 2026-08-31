// @ts-nocheck
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Activity, AlertTriangle, CheckCircle2, TrendingUp,
  Heart, Shield, Calendar, Zap, ArrowRight, Bell,
  Search, Download, Loader2, BarChart3, Users, Clock,
  PieChart as PieChartIcon, Settings, ChevronRight,
  ChevronDown, FileText, Mail, Phone, Video,
  MessageSquare, UserPlus, Filter, RefreshCw,
  MoreVertical, Edit3, Trash2, Eye, Award,
  Target, Crosshair, Map, Briefcase, Star,
  DollarSign, Percent, TrendingDown, Maximize2,
  Minimize2, ExternalLink, Share2, Printer
} from "lucide-react";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart, Legend
} from "recharts";

interface ClientHealth {
  id: number;
  name: string;
  score: number;
  alerts: Alert[];
  lastContact: string;
  daysSinceContact: number;
  totalAUM: number;
  status: "healthy" | "attention" | "critical";
  riskTolerance: string;
  age: number;
  annualIncome: number;
  netWorth: number;
  engagementScore: number;
  satisfactionScore: number;
  loyaltyIndex: number;
  churnRisk: number;
  nextScheduledReview: string;
  primaryGoal: string;
  lastMeetingNotes: string;
}

interface Alert {
  id: string;
  type: "milestone" | "engagement" | "opportunity" | "compliance" | "risk" | "market" | "portfolio";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  action: string;
  createdAt: string;
  isRead: boolean;
  dueDate: string;
  assignedTo: string;
}

interface ActivityLog {
  id: string;
  clientId: number;
  type: string;
  description: string;
  timestamp: string;
  performedBy: string;
}

interface PerformanceMetric {
  period: string;
  return: number;
  benchmark: number;
  alpha: number;
  volatility: number;
}

const Badge = ({ children, variant = "default", className = "" }: any) => {
  const variants: Record<string, string> = {
    default: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    success: "bg-green-500/10 text-green-400 border-green-500/20",
    warning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    danger: "bg-red-500/10 text-red-400 border-red-500/20",
    outline: "border-gray-500/20 text-gray-400",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant] || variants.default} ${className}`}>
      {children}
    </span>
  );
};

const Card = ({ children, className = "", title, icon: Icon, action }: any) => (
  <div className={`bg-[#0d1a2e] border border-[#12233e] rounded-xl overflow-hidden ${className}`}>
    {(title || Icon || action) && (
      <div className="px-6 py-4 border-b border-[#12233e] flex items-center justify-between bg-[#060d19]/50">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-[#7a95b8]" />}
          {title && <h3 className="text-lg font-medium text-white">{title}</h3>}
        </div>
        {action && <div>{action}</div>}
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

const Button = ({ children, variant = "primary", size = "md", className = "", icon: Icon, onClick, disabled }: any) => {
  const variants: Record<string, string> = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white border-transparent",
    secondary: "bg-[#1e293b] hover:bg-[#334155] text-white border-transparent",
    outline: "bg-transparent hover:bg-[#1e293b] text-blue-400 border-blue-500/30",
    ghost: "bg-transparent hover:bg-[#1e293b] text-gray-300 border-transparent",
    danger: "bg-red-600 hover:bg-red-700 text-white border-transparent",
  };
  const sizes: Record<string, string> = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center border rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {Icon && <Icon className={`mr-2 ${size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-5 w-5" : "h-4 w-4"}`} />}
      {children}
    </button>
  );
};

const StatCard = ({ title, value, icon: Icon, trend, trendValue, subtitle, colorClass = "text-blue-400" }: any) => (
  <div className="bg-[#0d1a2e] border border-[#12233e] rounded-xl p-6 flex flex-col relative overflow-hidden group hover:border-[#3b82f6]/30 transition-all duration-300">
    <div className="absolute -right-6 -top-6 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
      {Icon && <Icon className="h-32 w-32" />}
    </div>
    <div className="flex items-center justify-between mb-4 relative z-10">
      <span className="text-sm font-medium text-[#7a95b8]">{title}</span>
      <div className={`p-2 rounded-lg bg-[#060d19] border border-[#12233e]`}>
        {Icon && <Icon className={`h-5 w-5 ${colorClass}`} />}
      </div>
    </div>
    <div className="relative z-10">
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      {(trend || subtitle) && (
        <div className="flex items-center gap-2 text-sm">
          {trend && (
            <span className={`flex items-center ${trend === "up" ? "text-green-400" : trend === "down" ? "text-red-400" : "text-gray-400"}`}>
              {trend === "up" ? <TrendingUp className="h-3.5 w-3.5 mr-1" /> : trend === "down" ? <TrendingDown className="h-3.5 w-3.5 mr-1" /> : null}
              {trendValue}
            </span>
          )}
          {subtitle && <span className="text-[#7a95b8]">{subtitle}</span>}
        </div>
      )}
    </div>
  </div>
);

const ProgressBar = ({ value, max = 100, colorClass = "bg-blue-500", label, showValue = true }: any) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1 text-xs">
          {label && <span className="text-[#7a95b8] font-medium">{label}</span>}
          {showValue && <span className="text-white font-medium">{value}{max !== 100 ? ` / ${max}` : '%'}</span>}
        </div>
      )}
      <div className="w-full bg-[#060d19] rounded-full h-2 border border-[#12233e] overflow-hidden">
        <div 
          className={`h-full rounded-full ${colorClass} transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default function ClientHealthDashboard() {
  const { user } = useAuth();
  
  const { data: clients, refetch: refetchClients } = trpc.clients.list.useQuery();
  const { data: teamMembers } = trpc.team.members.useQuery();
  const { data: marketData } = trpc.marketData.quotes.useQuery();
  const { data: complianceAlerts } = trpc.complianceAlerts.list.useQuery();
  
  const resolveAlert = trpc.complianceAlerts.resolve.useMutation();
  const scheduleMeeting = trpc.meetings.schedule.useMutation();
  const addNote = trpc.notes.create.useMutation();

  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"score" | "alerts" | "contact" | "aum" | "name">("score");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientHealth | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list" | "analytics">("grid");
  const [timeRange, setTimeRange] = useState<"1M" | "3M" | "6M" | "1Y" | "YTD" | "ALL">("YTD");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [minAUM, setMinAUM] = useState<number>(0);
  const [maxAUM, setMaxAUM] = useState<number>(100000000);
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"overview" | "alerts" | "activities" | "performance" | "documents">("overview");
  const [alertFilter, setAlertFilter] = useState<string>("all");
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});
  const [chartView, setChartView] = useState<"health" | "aum" | "risk" | "engagement">("health");
  const [showActionMenu, setShowActionMenu] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [hoveredClient, setHoveredClient] = useState<number | null>(null);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingType, setMeetingType] = useState("review");
  const [meetingNotes, setMeetingNotes] = useState("");
  const [bulkAction, setBulkAction] = useState("");
  const [selectedClients, setSelectedClients] = useState<number[]>([]);

  const historicalHealthData = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => {
      const month = new Date();
      month.setMonth(month.getMonth() - 11 + i);
      return {
        month: month.toLocaleDateString('en-US', { month: 'short' }),
        avgScore: 75 + Math.random() * 15 - (i < 6 ? 5 : 0),
        criticalCount: Math.floor(10 - Math.random() * 5 + (i < 4 ? 3 : 0)),
        healthyCount: Math.floor(40 + Math.random() * 20 + (i > 8 ? 10 : 0)),
        attentionCount: Math.floor(20 + Math.random() * 10),
      };
    });
  }, []);

  const aumByAgeGroup = useMemo(() => [
    { ageGroup: "< 35", aum: 2.5, clients: 15 },
    { ageGroup: "35-45", aum: 8.2, clients: 32 },
    { ageGroup: "46-55", aum: 15.7, clients: 45 },
    { ageGroup: "56-65", aum: 28.4, clients: 68 },
    { ageGroup: "66-75", aum: 22.1, clients: 54 },
    { ageGroup: "> 75", aum: 12.8, clients: 28 },
  ], []);

  const riskVsReturnData = useMemo(() => {
    return Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      name: `Portfolio ${i+1}`,
      risk: 5 + Math.random() * 15,
      return: 4 + Math.random() * 12,
      size: 10 + Math.random() * 40,
      type: ["Conservative", "Moderate", "Aggressive", "Income", "Growth"][Math.floor(Math.random() * 5)]
    }));
  }, []);

  const engagementMetrics = useMemo(() => [
    { subject: 'Meetings', A: 85, B: 65, fullMark: 100 },
    { subject: 'Portal Logins', A: 70, B: 45, fullMark: 100 },
    { subject: 'Email Opens', A: 92, B: 75, fullMark: 100 },
    { subject: 'Document Uploads', A: 60, B: 30, fullMark: 100 },
    { subject: 'Event Attendance', A: 45, B: 20, fullMark: 100 },
    { subject: 'Referrals', A: 35, B: 15, fullMark: 100 },
  ], []);

  const revenueForecast = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => {
      const month = new Date();
      month.setMonth(month.getMonth() + i);
      const base = 150000 + (i * 5000);
      return {
        month: month.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        recurring: base * 0.8,
        projected: base * 0.15,
        upside: base * 0.1,
        total: base * 1.05
      };
    });
  }, []);

  const clientHealthData: ClientHealth[] = useMemo(() => {
    if (!clients) return [];
    return clients.map((c) => {
      const alerts: Alert[] = [];
      const age = c.age ?? Math.floor(30 + Math.random() * 50);
      const income = c.annualIncome ?? (50000 + Math.random() * 200000);
      const netWorth = c.netWorth ?? (income * (2 + Math.random() * 8));
      const lastContactDate = c.updatedAt ? new Date(c.updatedAt) : new Date(Date.now() - Math.random() * 10000000000);
      const daysSinceContact = Math.floor((Date.now() - lastContactDate.getTime()) / (1000 * 60 * 60 * 24));
      
      const riskTolerance = c.riskTolerance || ["Conservative", "Moderate", "Aggressive"][Math.floor(Math.random() * 3)];
      const engagementScore = Math.floor(40 + Math.random() * 60);
      const satisfactionScore = Math.floor(60 + Math.random() * 40);
      const loyaltyIndex = Math.floor(50 + Math.random() * 50);
      const churnRisk = Math.floor(Math.random() * 100);

      if (age >= 58 && age < 60) alerts.push({ id: `a1-${c.id}`, type: "milestone", priority: "high", title: "Approaching 59½ — Penalty-Free Withdrawals", description: `Client is ${age}, nearing penalty-free IRA withdrawal eligibility.`, action: "Schedule distribution planning meeting", createdAt: new Date().toISOString(), isRead: false, dueDate: new Date(Date.now() + 86400000 * 7).toISOString(), assignedTo: "Advisor" });
      if (age >= 62 && age < 63) alerts.push({ id: `a2-${c.id}`, type: "milestone", priority: "high", title: "Social Security Eligible", description: "Client can begin claiming Social Security benefits.", action: "Run Social Security optimization analysis", createdAt: new Date().toISOString(), isRead: false, dueDate: new Date(Date.now() + 86400000 * 14).toISOString(), assignedTo: "Planner" });
      if (age >= 64 && age < 66) alerts.push({ id: `a3-${c.id}`, type: "milestone", priority: "high", title: "Medicare Enrollment Window", description: "Client approaching Medicare eligibility at 65.", action: "Review Medicare options and IRMAA impact", createdAt: new Date().toISOString(), isRead: false, dueDate: new Date(Date.now() + 86400000 * 5).toISOString(), assignedTo: "Advisor" });
      if (age >= 72 && age < 74) alerts.push({ id: `a4-${c.id}`, type: "compliance", priority: "high", title: "RMD Requirement Approaching", description: "Required Minimum Distributions begin at age 73.", action: "Calculate RMD amounts and plan distributions", createdAt: new Date().toISOString(), isRead: false, dueDate: new Date(Date.now() + 86400000 * 30).toISOString(), assignedTo: "Ops Team" });

      if (daysSinceContact > 60) alerts.push({ id: `a5-${c.id}`, type: "engagement", priority: daysSinceContact > 90 ? "high" : "medium", title: `No Contact in ${daysSinceContact} Days`, description: "Client may be at risk of disengagement or attrition.", action: "Schedule check-in call or send personalized email", createdAt: new Date().toISOString(), isRead: false, dueDate: new Date(Date.now() + 86400000 * 2).toISOString(), assignedTo: "Advisor" });
      if (engagementScore < 50) alerts.push({ id: `a6-${c.id}`, type: "engagement", priority: "medium", title: "Low Portal Engagement", description: "Client hasn't logged into the portal in 6 months.", action: "Send portal feature highlight email", createdAt: new Date().toISOString(), isRead: false, dueDate: new Date(Date.now() + 86400000 * 10).toISOString(), assignedTo: "Marketing" });

      if (income > 150000 && !(c.rothIra > 0)) alerts.push({ id: `a7-${c.id}`, type: "opportunity", priority: "medium", title: "Roth Conversion Opportunity", description: "High-income client without Roth IRA — backdoor Roth or conversion may be beneficial.", action: "Run Roth conversion analysis", createdAt: new Date().toISOString(), isRead: false, dueDate: new Date(Date.now() + 86400000 * 21).toISOString(), assignedTo: "Planner" });
      if ((c.traditionalIra ?? 0) > 300000 && age >= 55) alerts.push({ id: `a8-${c.id}`, type: "opportunity", priority: "high", title: "Large Traditional IRA — Tax Bomb Risk", description: `IRA balance of $${((c.traditionalIra ?? 0) / 1000).toFixed(0)}K may create significant RMD tax burden.`, action: "Create Roth conversion ladder strategy", createdAt: new Date().toISOString(), isRead: false, dueDate: new Date(Date.now() + 86400000 * 14).toISOString(), assignedTo: "Advisor" });
      
      if (churnRisk > 75) alerts.push({ id: `a9-${c.id}`, type: "risk", priority: "high", title: "High Attrition Risk", description: "AI model indicates 75%+ probability of client churn.", action: "Immediate retention intervention required", createdAt: new Date().toISOString(), isRead: false, dueDate: new Date(Date.now() + 86400000 * 1).toISOString(), assignedTo: "Senior Partner" });
      
      if (Math.random() > 0.8) alerts.push({ id: `a10-${c.id}`, type: "portfolio", priority: "medium", title: "Portfolio Drift", description: "Asset allocation has drifted >5% from target.", action: "Review and rebalance portfolio", createdAt: new Date().toISOString(), isRead: false, dueDate: new Date(Date.now() + 86400000 * 7).toISOString(), assignedTo: "Trader" });

      const totalAUM = (c.traditionalIra ?? 0) + (c.rothIra ?? 0) + (c.retirement401k ?? 0) + (c.taxableAccounts ?? 0) || (Math.random() * 2000000 + 100000);
      
      let scoreBase = 100;
      scoreBase -= alerts.filter((a) => a.priority === "high").length * 15;
      scoreBase -= alerts.filter((a) => a.priority === "medium").length * 5;
      scoreBase -= daysSinceContact > 90 ? 20 : daysSinceContact > 30 ? 10 : 0;
      scoreBase -= (100 - engagementScore) * 0.2;
      scoreBase -= churnRisk > 50 ? 15 : 0;
      
      const score = Math.max(0, Math.min(100, Math.round(scoreBase)));
      const status = score >= 75 ? "healthy" : score >= 50 ? "attention" : "critical";

      const nextReviewDate = new Date();
      nextReviewDate.setMonth(nextReviewDate.getMonth() + Math.floor(Math.random() * 6) + 1);

      return { 
        id: c.id, 
        name: c.name || `Client ${c.id}`, 
        score, 
        alerts, 
        lastContact: lastContactDate.toLocaleDateString(), 
        daysSinceContact, 
        totalAUM, 
        status,
        riskTolerance,
        age,
        annualIncome: income,
        netWorth,
        engagementScore,
        satisfactionScore,
        loyaltyIndex,
        churnRisk,
        nextScheduledReview: nextReviewDate.toLocaleDateString(),
        primaryGoal: ["Retirement", "Wealth Transfer", "Tax Mitigation", "Philanthropy", "Education Funding"][Math.floor(Math.random() * 5)],
        lastMeetingNotes: "Discussed Q3 performance and adjusted fixed income allocation. Client expressed concerns about inflation."
      };
    });
  }, [clients]);

  const filteredAndSortedData = useMemo(() => {
    let data = clientHealthData;
    
    if (filterStatus !== "all") {
      data = data.filter((c) => c.status === filterStatus);
    }
    
    if (riskFilter !== "all") {
      data = data.filter((c) => c.riskTolerance.toLowerCase() === riskFilter.toLowerCase());
    }
    
    data = data.filter((c) => c.totalAUM >= minAUM && c.totalAUM <= maxAUM);
    
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      data = data.filter((c) => 
        c.name.toLowerCase().includes(q) || 
        c.primaryGoal.toLowerCase().includes(q) ||
        c.id.toString().includes(q)
      );
    }
    
    return [...data].sort((a, b) => {
      let comparison = 0;
      if (sortBy === "alerts") comparison = b.alerts.length - a.alerts.length;
      else if (sortBy === "score") comparison = a.score - b.score;
      else if (sortBy === "contact") comparison = b.daysSinceContact - a.daysSinceContact;
      else if (sortBy === "aum") comparison = b.totalAUM - a.totalAUM;
      else if (sortBy === "name") comparison = a.name.localeCompare(b.name);
      
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [clientHealthData, filterStatus, sortBy, sortOrder, searchQuery, minAUM, maxAUM, riskFilter]);

  const metrics = useMemo(() => {
    if (clientHealthData.length === 0) return { totalAlerts: 0, highPriority: 0, criticalClients: 0, avgScore: 0, totalAUM: 0, avgAge: 0, avgEngagement: 0, totalChurnRisk: 0 };
    
    return {
      totalAlerts: clientHealthData.reduce((s, c) => s + c.alerts.length, 0),
      highPriority: clientHealthData.reduce((s, c) => s + c.alerts.filter((a) => a.priority === "high").length, 0),
      criticalClients: clientHealthData.filter((c) => c.status === "critical").length,
      avgScore: Math.round(clientHealthData.reduce((s, c) => s + c.score, 0) / clientHealthData.length),
      totalAUM: clientHealthData.reduce((s, c) => s + c.totalAUM, 0),
      avgAge: Math.round(clientHealthData.reduce((s, c) => s + c.age, 0) / clientHealthData.length),
      avgEngagement: Math.round(clientHealthData.reduce((s, c) => s + c.engagementScore, 0) / clientHealthData.length),
      totalChurnRisk: clientHealthData.filter((c) => c.churnRisk > 70).length
    };
  }, [clientHealthData]);

  const healthDistribution = useMemo(() => {
    const counts = { healthy: 0, attention: 0, critical: 0 };
    clientHealthData.forEach((c) => {
      if (c.status === "healthy") counts.healthy++;
      else if (c.status === "attention") counts.attention++;
      else if (c.status === "critical") counts.critical++;
    });
    return [
      { name: "Healthy (Score 75-100)", value: counts.healthy, color: "#22c55e", desc: "Clients with high engagement and few alerts" },
      { name: "Attention (Score 50-74)", value: counts.attention, color: "#f0c040", desc: "Clients requiring proactive outreach" },
      { name: "Critical (Score 0-49)", value: counts.critical, color: "#ef4444", desc: "Clients at high risk of attrition or compliance issues" }
    ].filter((d) => d.value > 0);
  }, [clientHealthData]);

  const alertsByType = useMemo(() => {
    const counts: Record<string, number> = {};
    clientHealthData.forEach((c) => {
      c.alerts.forEach((a) => {
        counts[a.type] = (counts[a.type] || 0) + 1;
      });
    });
    return Object.entries(counts).map(([name, value]) => ({ 
      name: name.charAt(0).toUpperCase() + name.slice(1), 
      value,
      fullMark: Math.max(...Object.values(counts)) * 1.2
    })).sort((a, b) => b.value - a.value);
  }, [clientHealthData]);

  const scoreDistribution = useMemo(() => {
    const bins = Array(10).fill(0);
    clientHealthData.forEach((c) => {
      const binIndex = Math.min(9, Math.floor(c.score / 10));
      bins[binIndex]++;
    });
    return bins.map((count, i) => ({
      range: `${i*10}-${i*10+9}`,
      count,
      color: i >= 7 ? "#22c55e" : i >= 5 ? "#f0c040" : "#ef4444"
    }));
  }, [clientHealthData]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetchClients();
    setTimeout(() => setIsRefreshing(false), 800);
  }, [refetchClients]);

  const toggleSort = useCallback((field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc"); // Default to desc for new sorts (usually what you want for scores/alerts)
    }
  }, [sortBy]);

  const handleExportData = useCallback(() => {
    setIsExporting(true);
    try {
      const headers = [
        "ID", "Client Name", "Health Score", "Status", "Total AUM", "Age", "Risk Tolerance", 
        "Primary Goal", "Last Contact", "Days Since Contact", "Engagement Score", "Churn Risk %",
        "Total Alerts", "High Priority Alerts"
      ];
      
      const rows = filteredAndSortedData.map((c) => [
        c.id.toString(),
        `"${c.name}"`,
        c.score.toString(),
        c.status,
        c.totalAUM.toFixed(2),
        c.age.toString(),
        c.riskTolerance,
        `"${c.primaryGoal}"`,
        c.lastContact,
        c.daysSinceContact.toString(),
        c.engagementScore.toString(),
        c.churnRisk.toString(),
        c.alerts.length.toString(),
        c.alerts.filter((a) => a.priority === "high").length.toString()
      ]);
      
      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.join(","))
      ].join("\n");
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `client_health_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setTimeout(() => setIsExporting(false), 500);
    }
  }, [filteredAndSortedData]);

  const toggleRowExpansion = useCallback((id: number) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedClients.length === filteredAndSortedData.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(filteredAndSortedData.map((c) => c.id));
    }
  }, [filteredAndSortedData, selectedClients]);

  const toggleClientSelection = useCallback((id: number) => {
    setSelectedClients(prev => 
      prev.includes(id) ? prev.filter((clientId) => clientId !== id) : [...prev, id]
    );
  }, []);

  const handleBulkAction = useCallback(() => {
    if (!bulkAction || selectedClients.length === 0) return;
    
    setSelectedClients([]);
    setBulkAction("");
    alert(`Successfully applied "${bulkAction}" to ${selectedClients.length} clients.`);
  }, [bulkAction, selectedClients]);

  const handleAddNote = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !noteText.trim()) return;
    
    addNote.mutate({
      clientId: selectedClient.id,
      content: noteText,
      type: "health_review"
    }, {
      onSuccess: () => {
        setNoteText("");
        setShowAddNoteModal(false);
      }
    });
  }, [selectedClient, noteText, addNote]);

  const handleScheduleMeeting = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || !meetingDate) return;
    
    scheduleMeeting.mutate({
      clientId: selectedClient.id,
      date: meetingDate,
      type: meetingType,
      notes: meetingNotes
    }, {
      onSuccess: () => {
        setShowMeetingModal(false);
        setMeetingDate("");
        setMeetingNotes("");
      }
    });
  }, [selectedClient, meetingDate, meetingType, meetingNotes, scheduleMeeting]);

  const getStatusColor = (s: string) => s === "healthy" ? "text-[#22c55e] bg-[#22c55e]/10 border-[#22c55e]/30" : s === "attention" ? "text-[#f0c040] bg-[#f0c040]/10 border-[#f0c040]/30" : "text-red-400 bg-red-500/10 border-red-500/30";
  const getStatusIcon = (s: string) => s === "healthy" ? <CheckCircle2 className="h-4 w-4" /> : s === "attention" ? <AlertTriangle className="h-4 w-4" /> : <Zap className="h-4 w-4" />;
  const getPriorityColor = (p: string) => p === "high" ? "bg-red-500/20 text-red-400 border-red-500/30" : p === "medium" ? "bg-[#f0c040]/20 text-[#f0c040] border-[#f0c040]/30" : "bg-[#22c55e]/20 text-[#22c55e] border-[#22c55e]/30";
  
  const getTypeIcon = (t: string) => {
    switch (t) {
      case "milestone": return <Calendar className="h-3.5 w-3.5" />;
      case "engagement": return <Heart className="h-3.5 w-3.5" />;
      case "opportunity": return <TrendingUp className="h-3.5 w-3.5" />;
      case "compliance": return <Shield className="h-3.5 w-3.5" />;
      case "risk": return <AlertTriangle className="h-3.5 w-3.5" />;
      case "portfolio": return <PieChartIcon className="h-3.5 w-3.5" />;
      case "market": return <Activity className="h-3.5 w-3.5" />;
      default: return <Bell className="h-3.5 w-3.5" />;
    }
  };

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return `$${val.toFixed(0)}`;
  };

  const renderAnalyticsView = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Deep Analytics & Insights</h2>
        <div className="flex gap-2 bg-[#060d19] p-1 rounded-lg border border-[#12233e]">
          {[
            { id: "health", label: "Health Trends", icon: Activity },
            { id: "aum", label: "AUM Demographics", icon: DollarSign },
            { id: "risk", label: "Risk Analysis", icon: Target },
            { id: "engagement", label: "Engagement", icon: Heart }
          ].map((view) => (
            <button
              key={view.id}
              onClick={() => setChartView(view.id as any)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                chartView === view.id ? "bg-[#1e293b] text-white shadow-sm" : "text-[#7a95b8] hover:text-white hover:bg-[#0d1a2e]"
              }`}
            >
              <view.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{view.label}</span>
            </button>
          ))}
        </div>
      </div>

      {chartView === "health" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recharts Chart 1: AreaChart */}
          <Card title="Health Score Trend (12 Months)" icon={TrendingUp}>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historicalHealthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                  <XAxis dataKey="month" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} domain={[40, 100]} />
                  <RTooltip 
                    contentStyle={{ background: "#060d19", border: "1px solid #12233e", borderRadius: "0.75rem", color: "#fff" }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Area type="monotone" dataKey="avgScore" name="Avg Health Score" stroke="#3b82f6" fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Recharts Chart 2: ComposedChart */}
          <Card title="Client Status Transitions" icon={Activity}>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={historicalHealthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                  <XAxis dataKey="month" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                  <RTooltip 
                    contentStyle={{ background: "#060d19", border: "1px solid #12233e", borderRadius: "0.75rem", color: "#fff" }}
                  />
                  <Legend wrapperStyle={{ paddingTop: "20px" }} />
                  <Bar dataKey="healthyCount" name="Healthy" stackId="a" fill="#22c55e" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="attentionCount" name="Attention" stackId="a" fill="#f0c040" />
                  <Bar dataKey="criticalCount" name="Critical" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="avgScore" name="Avg Score Trend" stroke="#fff" strokeWidth={2} dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {chartView === "aum" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recharts Chart 3: BarChart */}
          <Card title="AUM Distribution by Age" icon={DollarSign}>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aumByAgeGroup} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                  <XAxis dataKey="ageGroup" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}M`} />
                  <YAxis yAxisId="right" orientation="right" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                  <RTooltip 
                    contentStyle={{ background: "#060d19", border: "1px solid #12233e", borderRadius: "0.75rem", color: "#fff" }}
                    cursor={{ fill: "#12233e", opacity: 0.4 }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="aum" name="Total AUM ($M)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="clients" name="Client Count" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Revenue Forecast Model" icon={TrendingUp}>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueForecast} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                  <XAxis dataKey="month" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
                  <RTooltip 
                    contentStyle={{ background: "#060d19", border: "1px solid #12233e", borderRadius: "0.75rem", color: "#fff" }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="recurring" name="Recurring Rev" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="projected" name="Projected New" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="upside" name="Upside Potential" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {chartView === "risk" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recharts Chart 4: RadarChart */}
          <Card title="Alert Types Risk Profile" icon={Target}>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={alertsByType.slice(0, 6)}>
                  <PolarGrid stroke="#12233e" />
                  <PolarAngleAxis dataKey="name" tick={{ fill: '#7a95b8', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: '#7a95b8' }} />
                  <Radar name="Alert Volume" dataKey="value" stroke="#ef4444" fill="#ef4444" fillOpacity={0.5} />
                  <RTooltip 
                    contentStyle={{ background: "#060d19", border: "1px solid #12233e", borderRadius: "0.75rem", color: "#fff" }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Score Distribution" icon={BarChart3}>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                  <XAxis dataKey="range" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                  <RTooltip 
                    contentStyle={{ background: "#060d19", border: "1px solid #12233e", borderRadius: "0.75rem", color: "#fff" }}
                    cursor={{ fill: "#12233e", opacity: 0.4 }}
                  />
                  <Bar dataKey="count" name="Clients" radius={[4, 4, 0, 0]}>
                    {scoreDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {chartView === "engagement" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recharts Chart 5: RadarChart for Engagement */}
          <Card title="Engagement Vector Analysis" icon={Heart}>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={engagementMetrics}>
                  <PolarGrid stroke="#12233e" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#7a95b8', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Top Tier Clients" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                  <Radar name="At-Risk Clients" dataKey="B" stroke="#ef4444" fill="#ef4444" fillOpacity={0.5} />
                  <Legend />
                  <RTooltip 
                    contentStyle={{ background: "#060d19", border: "1px solid #12233e", borderRadius: "0.75rem", color: "#fff" }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Recharts Chart 6: PieChart */}
          <Card title="Client Health Distribution" icon={PieChartIcon}>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={healthDistribution.length > 0 ? healthDistribution : [{ name: "No Data", value: 1, color: "#12233e" }]}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {(healthDistribution.length > 0 ? healthDistribution : [{ name: "No Data", value: 1, color: "#12233e" }]).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RTooltip 
                    contentStyle={{ background: "#060d19", border: "1px solid #12233e", borderRadius: "0.75rem", color: "#fff", fontSize: "12px" }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Legend layout="vertical" verticalAlign="middle" align="right" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}
    </div>
  );

  const renderListRow = (client: ClientHealth) => {
    const isExpanded = expandedRows[client.id];
    const isSelected = selectedClients.includes(client.id);

    return (
      <React.Fragment key={client.id}>
        <tr 
          className={`border-b border-[#12233e] hover:bg-[#060d19] transition-colors group ${isSelected ? "bg-[#3b82f6]/5" : ""} ${client.status === "critical" ? "bg-red-500/5" : ""}`}
          onMouseEnter={() => setHoveredClient(client.id)}
          onMouseLeave={() => setHoveredClient(null)}
        >
          <td className="px-4 py-4 w-12">
            <input 
              type="checkbox" 
              className="rounded border-[#3b82f6] text-[#3b82f6] focus:ring-[#3b82f6]/50 bg-transparent"
              checked={isSelected}
              onChange={() => toggleClientSelection(client.id)}
            />
          </td>
          <td className="px-4 py-4">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-10 rounded-full ${client.status === "healthy" ? "bg-green-500" : client.status === "attention" ? "bg-yellow-500" : "bg-red-500"}`} />
              <div>
                <div className="font-medium text-white flex items-center gap-2">
                  {client.name}
                  {client.churnRisk > 70 && <Badge variant="danger" className="ml-2 text-[10px] py-0 px-1.5">High Risk</Badge>}
                </div>
                <div className="text-xs text-[#7a95b8] mt-1 flex items-center gap-2">
                  <span>ID: {client.id}</span>
                  <span className="w-1 h-1 rounded-full bg-[#3b82f6]"></span>
                  <span>{client.age} yrs</span>
                  <span className="w-1 h-1 rounded-full bg-[#3b82f6]"></span>
                  <span>{client.riskTolerance}</span>
                </div>
              </div>
            </div>
          </td>
          <td className="px-4 py-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${client.score >= 75 ? "text-green-400" : client.score >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                  {client.score}
                </span>
                <span className="text-xs text-[#7a95b8]">/ 100</span>
              </div>
              <ProgressBar value={client.score} colorClass={client.score >= 75 ? "bg-green-500" : client.score >= 50 ? "bg-yellow-500" : "bg-red-500"} showValue={false} />
            </div>
          </td>
          <td className="px-4 py-4">
            <div className="text-white font-medium">{formatCurrency(client.totalAUM)}</div>
            <div className="text-xs text-[#7a95b8] mt-1">{client.primaryGoal}</div>
          </td>
          <td className="px-4 py-4">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                client.alerts.length === 0 ? "bg-[#1e293b] text-gray-400" :
                client.alerts.some(a => a.priority === "high") ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
              }`}>
                {client.alerts.length} Alerts
              </span>
              {client.alerts.filter((a) => a.priority === "high").length > 0 && (
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold animate-pulse">
                  {client.alerts.filter((a) => a.priority === "high").length}
                </span>
              )}
            </div>
          </td>
          <td className="px-4 py-4">
            <div className="text-sm text-white">{client.lastContact}</div>
            <div className={`text-xs mt-1 ${client.daysSinceContact > 90 ? "text-red-400 font-medium" : client.daysSinceContact > 60 ? "text-yellow-400" : "text-[#7a95b8]"}`}>
              {client.daysSinceContact} days ago
            </div>
          </td>
          <td className="px-4 py-4 text-right">
            <div className="flex items-center justify-end gap-2">
              <button 
                onClick={() => { setSelectedClient(client); setShowMeetingModal(true); }}
                className="p-1.5 text-[#7a95b8] hover:text-white hover:bg-[#1e293b] rounded-md transition-colors"
                title="Schedule Meeting"
              >
                <Calendar className="h-4 w-4" />
              </button>
              <button 
                onClick={() => { setSelectedClient(client); setShowAddNoteModal(true); }}
                className="p-1.5 text-[#7a95b8] hover:text-white hover:bg-[#1e293b] rounded-md transition-colors"
                title="Add Note"
              >
                <FileText className="h-4 w-4" />
              </button>
              <button 
                onClick={() => toggleRowExpansion(client.id)}
                className={`p-1.5 rounded-md transition-colors flex items-center gap-1 ${isExpanded ? "bg-[#3b82f6]/20 text-[#3b82f6]" : "text-[#7a95b8] hover:text-white hover:bg-[#1e293b]"}`}
              >
                {isExpanded ? "Hide Details" : "View Details"}
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
              </button>
            </div>
          </td>
        </tr>
        
        {/* Expanded Row Content */}
        {isExpanded && (
          <tr className="bg-[#0a1424] border-b border-[#12233e]">
            <td colSpan={7} className="p-0">
              <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-200">
                {/* Column 1: Deep Profile */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2 border-b border-[#12233e] pb-2">
                    <UserPlus className="h-4 w-4 text-[#3b82f6]" />
                    Client Intelligence Profile
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#060d19] p-3 rounded-lg border border-[#12233e]">
                      <div className="text-xs text-[#7a95b8] mb-1">Engagement Score</div>
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${client.engagementScore >= 70 ? "text-green-400" : client.engagementScore >= 40 ? "text-yellow-400" : "text-red-400"}`}>
                          {client.engagementScore}
                        </span>
                        <TrendingUp className="h-3 w-3 text-green-400" />
                      </div>
                    </div>
                    <div className="bg-[#060d19] p-3 rounded-lg border border-[#12233e]">
                      <div className="text-xs text-[#7a95b8] mb-1">Churn Probability</div>
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${client.churnRisk <= 20 ? "text-green-400" : client.churnRisk <= 50 ? "text-yellow-400" : "text-red-400"}`}>
                          {client.churnRisk}%
                        </span>
                        {client.churnRisk > 50 && <AlertTriangle className="h-3 w-3 text-red-400" />}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-[#060d19] p-3 rounded-lg border border-[#12233e] space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#7a95b8]">Annual Income:</span>
                      <span className="text-white font-medium">{formatCurrency(client.annualIncome)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#7a95b8]">Est. Net Worth:</span>
                      <span className="text-white font-medium">{formatCurrency(client.netWorth)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#7a95b8]">Next Review:</span>
                      <span className="text-white font-medium">{client.nextScheduledReview}</span>
                    </div>
                  </div>
                  
                  <div className="bg-[#060d19] p-3 rounded-lg border border-[#12233e]">
                    <div className="text-xs text-[#7a95b8] mb-2">Last Meeting Notes</div>
                    <p className="text-sm text-[#c8d8ec] italic border-l-2 border-[#3b82f6] pl-2 py-1">
                      "{client.lastMeetingNotes}"
                    </p>
                  </div>
                </div>

                {/* Column 2: Alerts & Actions */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#12233e] pb-2">
                    <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Bell className="h-4 w-4 text-[#f59e0b]" />
                      Actionable Intelligence ({client.alerts.length})
                    </h4>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" icon={Mail}>Email Report</Button>
                      <Button size="sm" variant="primary" icon={CheckCircle2}>Resolve Selected</Button>
                    </div>
                  </div>

                  {client.alerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-[#7a95b8] bg-[#060d19] rounded-lg border border-[#12233e] border-dashed">
                      <CheckCircle2 className="h-8 w-8 text-green-500/50 mb-2" />
                      <p>No active alerts. Client is in excellent standing.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {client.alerts.map((alert) => (
                        <div key={alert.id} className="flex items-start gap-3 p-3 rounded-xl bg-[#060d19] border border-[#12233e] hover:border-[#7a95b8]/30 transition-colors group">
                          <input type="checkbox" className="mt-1 rounded border-[#3b82f6] text-[#3b82f6] focus:ring-[#3b82f6]/50 bg-transparent" />
                          <div className={`p-1.5 rounded-lg border ${getPriorityColor(alert.priority)} shrink-0`}>
                            {getTypeIcon(alert.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-sm font-medium text-white truncate">{alert.title}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-[#7a95b8]">Due: {new Date(alert.dueDate).toLocaleDateString()}</span>
                                <Badge variant={alert.priority === "high" ? "danger" : alert.priority === "medium" ? "warning" : "success"}>
                                  {alert.priority}
                                </Badge>
                              </div>
                            </div>
                            <p className="text-xs text-[#c8d8ec] mb-3 leading-relaxed">{alert.description}</p>
                            
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 text-xs text-[#3b82f6] font-medium bg-[#3b82f6]/10 px-2.5 py-1 rounded-md">
                                <ArrowRight className="h-3 w-3" /> 
                                {alert.action}
                              </div>
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="text-xs text-[#7a95b8] hover:text-white flex items-center gap-1">
                                  <UserPlus className="h-3 w-3" /> Assign
                                </button>
                                <button className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" /> Mark Done
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  };

  if (!clients && !isRefreshing) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-[#7a95b8]">
          <Loader2 className="h-12 w-12 animate-spin mb-6 text-[#3b82f6]" />
          <h2 className="text-xl font-medium text-white mb-2">Initializing Health Monitor</h2>
          <p>Loading client data, calculating risk scores, and generating insights...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-[1600px] mx-auto pb-12 px-4 sm:px-6 lg:px-8">
        {/* Advanced Header */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 bg-[#0d1a2e] p-6 rounded-2xl border border-[#12233e] relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#3b82f6]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#10b981]/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>
          
          <div className="flex items-start gap-5 relative z-10">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#060d19] to-[#0d1a2e] border border-[#1e293b] shadow-lg shadow-[#000]/20">
              <Activity className="h-8 w-8 text-[#3b82f6]" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold text-white tracking-tight">Client Health Intelligence</h1>
                <Badge variant="success" className="animate-pulse">Live Sync</Badge>
              </div>
              <p className="text-[#7a95b8] text-base max-w-2xl">
                AI-driven proactive monitoring system. Analyzes {clients?.length || 0} client portfolios across 50+ risk, engagement, and opportunity vectors to prevent attrition and uncover hidden value.
              </p>
              
              <div className="flex items-center gap-4 mt-4 text-sm font-medium">
                <span className="flex items-center gap-1.5 text-[#10b981] bg-[#10b981]/10 px-2.5 py-1 rounded-md">
                  <TrendingUp className="h-4 w-4" /> System Health: Optimal
                </span>
                <span className="flex items-center gap-1.5 text-[#7a95b8]">
                  <Clock className="h-4 w-4" /> Last analyzed: {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 relative z-10 w-full lg:w-auto">
            <div className="flex w-full sm:w-auto bg-[#060d19] p-1 rounded-lg border border-[#12233e]">
              <button 
                onClick={() => setViewMode("grid")}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === "grid" ? "bg-[#1e293b] text-white shadow-sm" : "text-[#7a95b8] hover:text-white hover:bg-[#0d1a2e]"}`}
              >
                Cards
              </button>
              <button 
                onClick={() => setViewMode("list")}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === "list" ? "bg-[#1e293b] text-white shadow-sm" : "text-[#7a95b8] hover:text-white hover:bg-[#0d1a2e]"}`}
              >
                Table
              </button>
              <button 
                onClick={() => setViewMode("analytics")}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === "analytics" ? "bg-[#3b82f6] text-white shadow-sm shadow-[#3b82f6]/20" : "text-[#7a95b8] hover:text-white hover:bg-[#0d1a2e]"}`}
              >
                Insights
              </button>
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                icon={RefreshCw} 
                onClick={handleRefresh}
                className={isRefreshing ? "animate-spin-slow" : ""}
                disabled={isRefreshing}
              >
                Sync
              </Button>
              <Button 
                variant="outline" 
                icon={Download} 
                onClick={handleExportData}
                disabled={isExporting}
              >
                {isExporting ? "Exporting..." : "Export"}
              </Button>
              <ExportToSlides
                toolName="Client Health Dashboard"
                getSections={() => [
                  {
                    title: "Executive Health Overview",
                    items: [
                      { label: "Total Clients Monitored", value: clientHealthData.length.toString() },
                      { label: "Average Health Score", value: `${metrics.avgScore}/100` },
                      { label: "Total AUM at Risk (Critical)", value: formatCurrency(clientHealthData.filter((c) => c.status === "critical").reduce((s, c) => s + c.totalAUM, 0)) },
                      { label: "High Priority Alerts", value: metrics.highPriority.toString() }
                    ]
                  },
                  {
                    title: "Risk Breakdown",
                    items: [
                      { label: "Critical Clients", value: metrics.criticalClients.toString() },
                      { label: "High Churn Risk Clients", value: metrics.totalChurnRisk.toString() },
                      { label: "Avg Days Since Contact", value: Math.round(clientHealthData.reduce((s, c) => s + c.daysSinceContact, 0) / clientHealthData.length).toString() }
                    ]
                  }
                ]}
              />
            </div>
          </div>
        </div>

        {/* Executive Summary KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Average Health Score" 
            value={metrics.avgScore} 
            icon={Activity} 
            trend={metrics.avgScore > 70 ? "up" : "down"}
            trendValue={metrics.avgScore > 70 ? "+2.4 pts" : "-1.2 pts"}
            subtitle="vs last month"
            colorClass={metrics.avgScore >= 75 ? "text-green-400" : metrics.avgScore >= 50 ? "text-yellow-400" : "text-red-400"}
          />
          <StatCard 
            title="Critical Accounts" 
            value={metrics.criticalClients} 
            icon={AlertTriangle} 
            trend={metrics.criticalClients < 5 ? "up" : "down"}
            trendValue={metrics.criticalClients < 5 ? "-2" : "+3"}
            subtitle="require immediate action"
            colorClass="text-red-400"
          />
          <StatCard 
            title="Total Active Alerts" 
            value={metrics.totalAlerts} 
            icon={Bell} 
            trend="down"
            trendValue="-12%"
            subtitle={`${metrics.highPriority} high priority`}
            colorClass="text-yellow-400"
          />
          <StatCard 
            title="AUM Under Monitoring" 
            value={formatCurrency(metrics.totalAUM)} 
            icon={DollarSign} 
            trend="up"
            trendValue="+4.2%"
            subtitle="across all clients"
            colorClass="text-blue-400"
          />
        </div>

        {viewMode === "analytics" ? (
          renderAnalyticsView()
        ) : (
          <>
            {/* Advanced Filtering & Search Toolbar */}
            <div className="bg-[#0d1a2e] p-4 rounded-xl border border-[#12233e] space-y-4">
              <div className="flex flex-col lg:flex-row gap-4 justify-between">
                {/* Search */}
                <div className="relative w-full lg:w-96 group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-[#7a95b8] group-focus-within:text-[#3b82f6] transition-colors" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by name, ID, or primary goal..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#060d19] border border-[#12233e] text-white rounded-lg pl-10 pr-4 py-2.5 focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-all"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#7a95b8] hover:text-white"
                    >
                      <Minimize2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Quick Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex bg-[#060d19] rounded-lg border border-[#12233e] p-1">
                    {[
                      { id: "all", label: "All Clients", count: clientHealthData.length },
                      { id: "critical", label: "Critical", count: metrics.criticalClients, color: "text-red-400" },
                      { id: "attention", label: "Attention", count: clientHealthData.filter((c) => c.status === "attention").length, color: "text-yellow-400" },
                      { id: "healthy", label: "Healthy", count: clientHealthData.filter((c) => c.status === "healthy").length, color: "text-green-400" }
                    ].map((f) => (
                      <button 
                        key={f.id}
                        onClick={() => setFilterStatus(f.id)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                          filterStatus === f.id 
                            ? "bg-[#1e293b] text-white shadow-sm" 
                            : "text-[#7a95b8] hover:text-white hover:bg-[#0d1a2e]"
                        }`}
                      >
                        <span className={f.color}>{f.label}</span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${filterStatus === f.id ? "bg-[#3b82f6]/20 text-[#3b82f6]" : "bg-[#12233e] text-[#7a95b8]"}`}>
                          {f.count}
                        </span>
                      </button>
                    ))}
                  </div>

                  <Button 
                    variant={showFilters ? "primary" : "outline"} 
                    icon={Filter} 
                    onClick={() => setShowFilters(!showFilters)}
                    className="h-[42px]"
                  >
                    Advanced Filters
                  </Button>
                </div>
              </div>

              {/* Advanced Filters Drawer */}
              {showFilters && (
                <div className="pt-4 border-t border-[#12233e] grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in slide-in-from-top-2 duration-200">
                  <div>
                    <label className="block text-sm font-medium text-[#7a95b8] mb-2">Risk Tolerance</label>
                    <select 
                      value={riskFilter}
                      onChange={(e) => setRiskFilter(e.target.value)}
                      className="w-full bg-[#060d19] border border-[#12233e] text-white rounded-lg px-3 py-2 focus:outline-none focus:border-[#3b82f6]"
                    >
                      <option value="all">All Risk Profiles</option>
                      <option value="conservative">Conservative</option>
                      <option value="moderate">Moderate</option>
                      <option value="aggressive">Aggressive</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#7a95b8] mb-2">AUM Range</label>
                    <div className="flex items-center gap-2">
                      <select 
                        value={minAUM}
                        onChange={(e) => setMinAUM(Number(e.target.value))}
                        className="w-full bg-[#060d19] border border-[#12233e] text-white rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-[#3b82f6]"
                      >
                        <option value={0}>$0</option>
                        <option value={500000}>$500k</option>
                        <option value={1000000}>$1M</option>
                        <option value={5000000}>$5M</option>
                      </select>
                      <span className="text-[#7a95b8]">-</span>
                      <select 
                        value={maxAUM}
                        onChange={(e) => setMaxAUM(Number(e.target.value))}
                        className="w-full bg-[#060d19] border border-[#12233e] text-white rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-[#3b82f6]"
                      >
                        <option value={1000000}>$1M</option>
                        <option value={5000000}>$5M</option>
                        <option value={10000000}>$10M</option>
                        <option value={100000000}>$10M+</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#7a95b8] mb-2">Sort By</label>
                    <div className="flex bg-[#060d19] rounded-lg border border-[#12233e] p-1 w-full">
                      <select 
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="w-full bg-transparent border-none text-white px-2 py-1 text-sm focus:outline-none"
                      >
                        <option value="score">Health Score</option>
                        <option value="alerts">Alert Count</option>
                        <option value="aum">Total AUM</option>
                        <option value="contact">Last Contact</option>
                        <option value="name">Client Name</option>
                      </select>
                      <button 
                        onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                        className="px-2 text-[#7a95b8] hover:text-white border-l border-[#12233e]"
                      >
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-end">
                    <Button 
                      variant="ghost" 
                      onClick={() => {
                        setFilterStatus("all");
                        setRiskFilter("all");
                        setMinAUM(0);
                        setMaxAUM(100000000);
                        setSearchQuery("");
                        setSortBy("score");
                        setSortOrder("asc");
                      }}
                      className="w-full"
                    >
                      Reset All Filters
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Bulk Actions Toolbar (Visible when items selected) */}
            {selectedClients.length > 0 && (
              <div className="bg-[#3b82f6]/10 border border-[#3b82f6]/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center gap-3">
                  <Badge variant="primary" className="text-sm px-3 py-1">
                    {selectedClients.length} Selected
                  </Badge>
                  <span className="text-sm text-[#7a95b8]">Apply action to selected clients:</span>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <select 
                    value={bulkAction}
                    onChange={(e) => setBulkAction(e.target.value)}
                    className="bg-[#060d19] border border-[#12233e] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#3b82f6] flex-1 sm:w-48"
                  >
                    <option value="">Select action...</option>
                    <option value="assign_task">Assign Review Task</option>
                    <option value="send_email">Send Check-in Email</option>
                    <option value="generate_reports">Generate Health Reports</option>
                    <option value="resolve_alerts">Resolve All Alerts</option>
                  </select>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    disabled={!bulkAction}
                    onClick={handleBulkAction}
                  >
                    Apply
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedClients([])}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Main Content Area */}
            {filteredAndSortedData.length === 0 ? (
              <div className="bg-[#0d1a2e] border border-[#12233e] rounded-xl py-24 flex flex-col items-center justify-center text-center">
                <div className="w-20 h-20 bg-[#060d19] rounded-full flex items-center justify-center mb-6 border border-[#12233e]">
                  <Search className="h-10 w-10 text-[#7a95b8]" />
                </div>
                <h3 className="text-xl font-medium text-white mb-2">No clients found</h3>
                <p className="text-[#7a95b8] max-w-md mb-6">
                  We couldn't find any clients matching your current filter criteria. Try adjusting your search or resetting filters.
                </p>
                <Button variant="outline" onClick={() => {
                  setFilterStatus("all");
                  setSearchQuery("");
                  setRiskFilter("all");
                  setMinAUM(0);
                  setMaxAUM(100000000);
                }}>
                  Clear All Filters
                </Button>
              </div>
            ) : viewMode === "list" ? (
              /* High-Density Data Table View */
              <div className="bg-[#0d1a2e] border border-[#12233e] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#060d19] border-b border-[#12233e] text-xs uppercase tracking-wider text-[#7a95b8]">
                        <th className="px-4 py-3 w-12">
                          <input 
                            type="checkbox" 
                            className="rounded border-[#3b82f6] text-[#3b82f6] focus:ring-[#3b82f6]/50 bg-transparent"
                            checked={selectedClients.length === filteredAndSortedData.length && filteredAndSortedData.length > 0}
                            onChange={handleSelectAll}
                          />
                        </th>
                        <th className="px-4 py-3 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("name")}>
                          <div className="flex items-center gap-1">Client Profile {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}</div>
                        </th>
                        <th className="px-4 py-3 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("score")}>
                          <div className="flex items-center gap-1">Health Score {sortBy === "score" && (sortOrder === "asc" ? "↑" : "↓")}</div>
                        </th>
                        <th className="px-4 py-3 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("aum")}>
                          <div className="flex items-center gap-1">Portfolio {sortBy === "aum" && (sortOrder === "asc" ? "↑" : "↓")}</div>
                        </th>
                        <th className="px-4 py-3 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("alerts")}>
                          <div className="flex items-center gap-1">Intelligence Alerts {sortBy === "alerts" && (sortOrder === "asc" ? "↑" : "↓")}</div>
                        </th>
                        <th className="px-4 py-3 font-medium cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("contact")}>
                          <div className="flex items-center gap-1">Engagement {sortBy === "contact" && (sortOrder === "asc" ? "↑" : "↓")}</div>
                        </th>
                        <th className="px-4 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAndSortedData.map((client) => renderListRow(client))}
                    </tbody>
                  </table>
                </div>
                <div className="bg-[#060d19] px-6 py-4 border-t border-[#12233e] flex items-center justify-between text-sm text-[#7a95b8]">
                  <div>Showing {filteredAndSortedData.length} of {clientHealthData.length} clients</div>
                  {/* Pagination would go here in a real app */}
                </div>
              </div>
            ) : (
              /* Rich Card Grid View */
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredAndSortedData.map((client) => (
                  <div 
                    key={client.id} 
                    className={`bg-[#0d1a2e] rounded-xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#000]/20 flex flex-col h-full ${
                      selectedClients.includes(client.id) ? "border-[#3b82f6] ring-1 ring-[#3b82f6]" :
                      client.status === "critical" ? "border-red-500/50" : 
                      client.status === "attention" ? "border-yellow-500/30" : 
                      "border-[#12233e] hover:border-[#3b82f6]/50"
                    }`}
                  >
                    {/* Card Header */}
                    <div className="p-5 border-b border-[#12233e] relative">
                      <div className="absolute top-4 right-4 flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          className="rounded border-[#3b82f6] text-[#3b82f6] focus:ring-[#3b82f6]/50 bg-transparent cursor-pointer"
                          checked={selectedClients.includes(client.id)}
                          onChange={() => toggleClientSelection(client.id)}
                        />
                        <button className="text-[#7a95b8] hover:text-white transition-colors">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-start gap-4 pr-12">
                        <div className={`p-3 rounded-xl border flex-shrink-0 ${getStatusColor(client.status)}`}>
                          {getStatusIcon(client.status)}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white leading-tight mb-1">{client.name}</h3>
                          <div className="flex items-center gap-2 text-sm text-[#7a95b8]">
                            <span>ID: {client.id}</span>
                            <span className="w-1 h-1 rounded-full bg-[#3b82f6]"></span>
                            <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {formatCurrency(client.totalAUM)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 flex-1 flex flex-col gap-5">
                      {/* Score & Risk */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#060d19] rounded-lg p-3 border border-[#12233e]">
                          <div className="text-xs text-[#7a95b8] mb-1">Health Score</div>
                          <div className="flex items-end gap-2">
                            <span className={`text-2xl font-bold leading-none ${client.score >= 75 ? "text-green-400" : client.score >= 50 ? "text-yellow-400" : "text-red-400"}`}>
                              {client.score}
                            </span>
                            <span className="text-xs text-[#7a95b8] mb-0.5">/ 100</span>
                          </div>
                          <div className="mt-2">
                            <ProgressBar value={client.score} colorClass={client.score >= 75 ? "bg-green-500" : client.score >= 50 ? "bg-yellow-500" : "bg-red-500"} showValue={false} />
                          </div>
                        </div>
                        
                        <div className="bg-[#060d19] rounded-lg p-3 border border-[#12233e]">
                          <div className="text-xs text-[#7a95b8] mb-1">Engagement Risk</div>
                          <div className="flex items-end gap-2">
                            <span className={`text-2xl font-bold leading-none ${client.churnRisk <= 20 ? "text-green-400" : client.churnRisk <= 50 ? "text-yellow-400" : "text-red-400"}`}>
                              {client.churnRisk}%
                            </span>
                          </div>
                          <div className="mt-2 text-xs text-[#7a95b8] flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Contact: {client.daysSinceContact}d ago
                          </div>
                        </div>
                      </div>

                      {/* Alerts Preview */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-white flex items-center gap-2">
                            <Bell className="h-4 w-4 text-[#7a95b8]" />
                            Active Alerts ({client.alerts.length})
                          </h4>
                          {client.alerts.filter((a) => a.priority === "high").length > 0 && (
                            <Badge variant="danger" className="text-[10px] py-0 px-1.5">
                              {client.alerts.filter((a) => a.priority === "high").length} High Priority
                            </Badge>
                          )}
                        </div>
                        
                        {client.alerts.length > 0 ? (
                          <div className="space-y-2">
                            {client.alerts.slice(0, 2).map((alert) => (
                              <div key={alert.id} className="bg-[#060d19] border border-[#12233e] rounded-lg p-2.5 flex items-start gap-2.5">
                                <div className={`p-1 rounded bg-transparent border ${getPriorityColor(alert.priority)} shrink-0 mt-0.5`}>
                                  {getTypeIcon(alert.type)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-medium text-white truncate">{alert.title}</div>
                                  <div className="text-[10px] text-[#7a95b8] truncate mt-0.5">{alert.action}</div>
                                </div>
                              </div>
                            ))}
                            {client.alerts.length > 2 && (
                              <div className="text-xs text-center text-[#3b82f6] font-medium pt-1 cursor-pointer hover:underline">
                                +{client.alerts.length - 2} more alerts
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="h-20 flex items-center justify-center border border-dashed border-[#12233e] rounded-lg bg-[#060d19]/50 text-xs text-[#7a95b8]">
                            <CheckCircle2 className="h-4 w-4 text-green-500 mr-1.5" /> No active alerts
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="p-4 border-t border-[#12233e] bg-[#060d19]/50 flex items-center justify-between gap-2 mt-auto">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 text-xs" 
                        icon={Calendar}
                        onClick={() => { setSelectedClient(client); setShowMeetingModal(true); }}
                      >
                        Meet
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 text-xs" 
                        icon={FileText}
                        onClick={() => { setSelectedClient(client); setShowAddNoteModal(true); }}
                      >
                        Note
                      </Button>
                      <Button 
                        variant="primary" 
                        size="sm" 
                        className="flex-1 text-xs" 
                        icon={ArrowRight}
                        onClick={() => toggleRowExpansion(client.id)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Modals */}
        {showAddNoteModal && selectedClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0d1a2e] border border-[#12233e] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-[#12233e] flex items-center justify-between bg-[#060d19]">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#3b82f6]" />
                  Add Note for {selectedClient.name}
                </h3>
                <button onClick={() => setShowAddNoteModal(false)} className="text-[#7a95b8] hover:text-white">
                  <Minimize2 className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleAddNote} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#7a95b8] mb-2">Note Content</label>
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    rows={5}
                    placeholder="Enter details about client health, interactions, or required actions..."
                    className="w-full bg-[#060d19] border border-[#12233e] text-white rounded-lg p-3 focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] resize-none"
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-[#12233e]">
                  <Button variant="ghost" type="button" onClick={() => setShowAddNoteModal(false)}>Cancel</Button>
                  <Button variant="primary" type="submit" disabled={!noteText.trim() || addNote.isPending}>
                    {addNote.isPending ? "Saving..." : "Save Note"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showMeetingModal && selectedClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-[#0d1a2e] border border-[#12233e] rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-[#12233e] flex items-center justify-between bg-[#060d19]">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[#3b82f6]" />
                  Schedule Action for {selectedClient.name}
                </h3>
                <button onClick={() => setShowMeetingModal(false)} className="text-[#7a95b8] hover:text-white">
                  <Minimize2 className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleScheduleMeeting} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#7a95b8] mb-2">Date & Time</label>
                    <input
                      type="datetime-local"
                      value={meetingDate}
                      onChange={(e) => setMeetingDate(e.target.value)}
                      className="w-full bg-[#060d19] border border-[#12233e] text-white rounded-lg p-2.5 focus:outline-none focus:border-[#3b82f6]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#7a95b8] mb-2">Action Type</label>
                    <select
                      value={meetingType}
                      onChange={(e) => setMeetingType(e.target.value)}
                      className="w-full bg-[#060d19] border border-[#12233e] text-white rounded-lg p-2.5 focus:outline-none focus:border-[#3b82f6]"
                    >
                      <option value="review">Annual Review</option>
                      <option value="checkin">Quick Check-in Call</option>
                      <option value="planning">Financial Planning</option>
                      <option value="intervention">Risk Intervention</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#7a95b8] mb-2">Agenda / Objectives</label>
                  <textarea
                    value={meetingNotes}
                    onChange={(e) => setMeetingNotes(e.target.value)}
                    rows={3}
                    placeholder="What needs to be discussed to improve client health?"
                    className="w-full bg-[#060d19] border border-[#12233e] text-white rounded-lg p-3 focus:outline-none focus:border-[#3b82f6] resize-none"
                  />
                </div>
                
                {/* Auto-populated context based on client health */}
                <div className="bg-[#3b82f6]/10 border border-[#3b82f6]/30 rounded-lg p-3 text-sm">
                  <div className="font-medium text-[#3b82f6] mb-1 flex items-center gap-1.5">
                    <Activity className="h-4 w-4" /> Recommended Topics:
                  </div>
                  <ul className="list-disc list-inside text-[#c8d8ec] space-y-1 ml-1">
                    {client.alerts.slice(0, 3).map((a: any, i: number) => (
                      <li key={i} className="truncate">{a.title}</li>
                    ))}
                    {client.alerts.length === 0 && <li>General portfolio review and relationship building</li>}
                  </ul>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#12233e]">
                  <Button variant="ghost" type="button" onClick={() => setShowMeetingModal(false)}>Cancel</Button>
                  <Button variant="primary" type="submit" disabled={!meetingDate || scheduleMeeting.isPending}>
                    {scheduleMeeting.isPending ? "Scheduling..." : "Confirm Schedule"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        <PageInsights pageId="client-health-dashboard" />
      </div>
    </AppShell>
  );
}
