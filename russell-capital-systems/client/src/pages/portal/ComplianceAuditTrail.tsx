// @ts-nocheck
import { useState, useMemo, useEffect, useCallback } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, ComposedChart, ScatterChart, Scatter, ZAxis, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { AppShell } from "@/components/AppShell";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import { toast } from "sonner";
import {
  Shield, Search, Download, FileText, Calendar, User, Mail,
  Phone, CheckCircle2, AlertTriangle, ChevronDown, ChevronRight,
  Sparkles, Filter, BarChart3, PieChart as PieChartIcon,
  Activity, ArrowUpRight, ArrowDownRight, Clock, RefreshCw,
  Settings, MoreVertical, Edit, Trash2, Copy, Share2, Eye,
  MessageSquare, FileCode, Server, Database, Lock, Key, Globe,
  Cpu, Zap, ShieldAlert, ShieldCheck, HelpCircle, Info
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface AuditEntry {
  id: string;
  timestamp: Date;
  type: "meeting" | "email" | "phone" | "document" | "trade" | "disclosure" | "login" | "plan_change" | "system" | "api";
  clientName: string;
  advisorName: string;
  summary: string;
  aiSummary: string;
  details: string;
  complianceFlags: string[];
  status: "clean" | "flagged" | "reviewed" | "pending";
  riskScore: number;
  location: string;
  ipAddress: string;
  device: string;
  duration: number;
  tags: string[];
}

const generateAuditEntries = (): AuditEntry[] => {
  const clients = ["John & Sarah Mitchell", "Robert Chen", "Maria Gonzalez", "David Thompson", "Lisa Park", "James Wilson", "Emily Rodriguez", "Michael Brown", "Acme Corp", "Tech Solutions Inc", "Global Logistics LLC", "Apex Financial", "Summit Wealth", "Pinnacle Partners", "Crestview Capital", "Horizon Trust"];
  const types: AuditEntry["type"][] = ["meeting", "email", "phone", "document", "trade", "disclosure", "login", "plan_change", "system", "api"];
  const entries: AuditEntry[] = [];

  const templates: Record<string, { summary: string; aiSummary: string; details: string; flags: string[] }[]> = {
    meeting: [
      { summary: "Annual review meeting — discussed retirement timeline and IUL strategy", aiSummary: "Client expressed interest in accelerating retirement to age 60. Advisor presented IUL strategy with Ibbotson-backed projections. No suitability concerns. Client requested follow-up illustration.", details: "Duration: 45 min. Topics: Retirement gap analysis, IUL illustration review, beneficiary update. Action items: Send updated IUL quote, schedule 30-day follow-up.", flags: [] },
      { summary: "Initial discovery meeting — fact-finding and risk assessment", aiSummary: "New client onboarding. Comprehensive fact-finder completed. Risk tolerance score: 62 (Moderate). Income $185K, net worth $1.2M. No red flags identified.", details: "Duration: 60 min. Completed: Fact-finder, risk assessment, KYC documentation. Suitability profile established.", flags: [] },
    ],
    email: [
      { summary: "Sent quarterly performance report and market outlook", aiSummary: "Routine quarterly communication. Performance report attached showing 7.2% YTD return. Market outlook included standard disclaimers. No personalized recommendations in email body.", details: "Email with 2 attachments: Q1 Performance Report.pdf, Market Outlook.pdf. Opened by client.", flags: [] },
      { summary: "Client requested information about variable annuity surrender", aiSummary: "Client inquired about surrendering existing variable annuity. Advisor responded with surrender schedule and tax implications. Flagged for suitability review — potential 1035 exchange opportunity.", details: "Email thread: 3 messages. Client initiated. Advisor provided factual information only, no recommendation made pending suitability review.", flags: ["Suitability Review Required"] },
    ],
    phone: [
      { summary: "Client called regarding market volatility concerns", aiSummary: "Inbound call during market correction. Client expressed anxiety about portfolio decline. Advisor reviewed long-term plan and IUL floor protection. Client reassured, no changes requested.", details: "Duration: 18 min. Outcome: Client retained current allocation. Advisor documented behavioral coaching conversation.", flags: [] },
    ],
    trade: [
      { summary: "Rebalanced portfolio — reduced equity overweight by 3%", aiSummary: "Systematic rebalance triggered by drift threshold. Sold $15K US Large Cap, bought $10K International Equity and $5K Bonds. Within IPS guidelines. Tax-loss harvesting applied to offset gains.", details: "Trade details: SELL VTI $15,000 | BUY VXUS $10,000 | BUY BND $5,000. Net tax impact: -$1,200 (harvested loss).", flags: [] },
      { summary: "Executed Roth conversion — $50,000 from Traditional IRA", aiSummary: "Planned Roth conversion as part of multi-year strategy. Amount within current tax bracket ceiling. Client signed conversion authorization. Tax withholding: 0% (paid from external funds).", details: "Conversion: $50,000 from Traditional IRA to Roth IRA. Tax projection reviewed and signed. Part of 5-year conversion ladder.", flags: ["Tax Event Documented"] },
    ],
    disclosure: [
      { summary: "Subscription agreement signed — Professional tier, annual billing", aiSummary: "Client completed full disclosure acceptance flow: legal agreement reviewed, payor identity verified, SMS PIN confirmed, e-signature recorded. Delaware governing law acknowledged. Non-refundable terms accepted.", details: "Disclosure ID: DSC-2026-0042. IP: 192.168.1.x. PIN verified at 2:34 PM. Signature hash recorded.", flags: [] },
    ],
    plan_change: [
      { summary: "Updated retirement age from 65 to 62 — revised projections", aiSummary: "Client requested earlier retirement target. Advisor updated financial plan projections. New analysis shows $180K/yr shortfall at age 62 vs. original plan. Recommended increasing IUL premium by $500/mo. Client to review.", details: "Plan version: v3.2 → v3.3. Key change: Retirement age 65→62. Impact: Additional $180K/yr needed. Proposed solution: Increase IUL premium.", flags: ["Plan Modification"] },
    ],
    document: [
      { summary: "Uploaded signed IUL application — Pacific Life Accumulator", aiSummary: "New IUL application submitted. Face amount: $1M. Annual premium: $24,000. Underwriting class: Preferred. All required signatures obtained. Replacement form N/A — no existing policy.", details: "Carrier: Pacific Life. Product: Accumulator IUL. Premium: $24K/yr. Death benefit: $1M. Riders: Chronic illness, waiver of premium.", flags: [] },
    ],
    login: [
      { summary: "Client portal login from new device", aiSummary: "Client accessed portal from previously unrecognized device (iPhone, Safari). Location: San Francisco, CA. Multi-factor authentication completed successfully. No suspicious activity detected.", details: "Device: iPhone 16 Pro, Safari 19.2. IP: 73.xxx.xxx.xx. MFA: SMS code verified. Session duration: 12 minutes.", flags: [] },
    ],
    system: [
      { summary: "Automated compliance scan completed", aiSummary: "Nightly compliance scan executed across all active accounts. Checked for drift, missing documentation, and upcoming RMDs. 3 accounts flagged for missing annual review.", details: "Scan ID: SYS-SCAN-992. Accounts checked: 450. Issues found: 3 missing annual reviews, 1 drift > 10%. Auto-notifications queued.", flags: ["System Alert"] },
    ],
    api: [
      { summary: "Data sync with custodian via API", aiSummary: "Daily position and transaction sync with Charles Schwab API. Successfully updated 1,250 positions and 45 new transactions. No errors reported.", details: "API Endpoint: /v1/accounts/sync. Data transferred: 4.2MB. Duration: 14s. Status: Success.", flags: [] },
    ],
  };

  const locations = ["New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX", "Phoenix, AZ", "Philadelphia, PA", "San Antonio, TX", "San Diego, CA", "Dallas, TX", "San Jose, CA"];
  const devices = ["iPhone 14 Pro", "MacBook Pro M2", "Windows 11 PC", "iPad Air", "Samsung Galaxy S23", "Google Pixel 8", "Chrome OS Device"];
  const tagsList = ["High Priority", "Review Needed", "Follow-up", "Urgent", "Routine", "Automated", "Manual Entry", "Client Initiated", "Advisor Initiated"];

  for (let i = 0; i < 200; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const client = clients[Math.floor(Math.random() * clients.length)];
    const template = templates[type]?.[Math.floor(Math.random() * (templates[type]?.length ?? 1))] ?? templates.meeting[0];
    const daysAgo = Math.floor(Math.random() * 90);
    const status: AuditEntry["status"] = template.flags.length > 0 ? (Math.random() > 0.5 ? "flagged" : (Math.random() > 0.5 ? "reviewed" : "pending")) : "clean";
    
    const entryTags = [];
    const numTags = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < numTags; j++) {
      const tag = tagsList[Math.floor(Math.random() * tagsList.length)];
      if (!entryTags.includes(tag)) entryTags.push(tag);
    }

    entries.push({
      id: `AUD-${String(2026000 + i).padStart(7, "0")}`,
      timestamp: new Date(Date.now() - daysAgo * 86400000 - Math.random() * 86400000),
      type,
      clientName: client,
      advisorName: "Russell Capital Systems™",
      summary: template.summary,
      aiSummary: template.aiSummary,
      details: template.details,
      complianceFlags: template.flags,
      status,
      riskScore: Math.floor(Math.random() * 100),
      location: locations[Math.floor(Math.random() * locations.length)],
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      device: devices[Math.floor(Math.random() * devices.length)],
      duration: Math.floor(Math.random() * 120),
      tags: entryTags,
    });
  }

  return entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

const typeConfig: Record<string, { label: string; icon: any; color: string }> = {
  meeting: { label: "Meeting", icon: Calendar, color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  email: { label: "Email", icon: Mail, color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
  phone: { label: "Phone", icon: Phone, color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  document: { label: "Document", icon: FileText, color: "bg-violet-500/20 text-violet-400 border-violet-500/30" },
  trade: { label: "Trade", icon: Activity, color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  disclosure: { label: "Disclosure", icon: CheckCircle2, color: "bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30" },
  login: { label: "Login", icon: User, color: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
  plan_change: { label: "Plan Change", icon: Settings, color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
  system: { label: "System", icon: Server, color: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" },
  api: { label: "API", icon: FileCode, color: "bg-rose-500/20 text-rose-400 border-rose-500/30" },
};

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  clean: { label: "Clean", icon: CheckCircle2, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  flagged: { label: "Flagged", icon: AlertTriangle, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  reviewed: { label: "Reviewed", icon: ShieldCheck, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  pending: { label: "Pending", icon: Clock, color: "text-slate-400 bg-slate-500/10 border-slate-500/20" },
};

export default function ComplianceAuditTrail() {
  const { user } = useAuth();
  const [entries] = useState<AuditEntry[]>(() => generateAuditEntries());
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRangeFilter, setDateRangeFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState("list");
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const { data: complianceStats } = trpc.compliance.getStats.useQuery(undefined, { enabled: !!user });
  const { data: recentAlerts } = trpc.complianceAlerts.getRecent.useQuery(undefined, { enabled: !!user });
  const { data: teamActivity } = trpc.team.getActivity.useQuery(undefined, { enabled: !!user });
  const { data: systemHealth } = trpc.dashboard.getSystemHealth.useQuery(undefined, { enabled: !!user });
  const { data: apiUsage } = trpc.api.getUsageStats.useQuery(undefined, { enabled: !!user });
  const { data: aiInsights } = trpc.ai.getComplianceInsights.useQuery(undefined, { enabled: !!user });
  const { data: riskScoringData } = trpc.riskScoring.getDistribution.useQuery(undefined, { enabled: !!user });

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (typeFilter !== "all" && e.type !== typeFilter) return false;
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      
      if (riskFilter !== "all") {
        if (riskFilter === "high" && e.riskScore < 75) return false;
        if (riskFilter === "medium" && (e.riskScore < 40 || e.riskScore >= 75)) return false;
        if (riskFilter === "low" && e.riskScore >= 40) return false;
      }
      
      if (dateRangeFilter !== "all") {
        const now = new Date();
        const entryDate = new Date(e.timestamp);
        const diffDays = (now.getTime() - entryDate.getTime()) / (1000 * 3600 * 24);
        
        if (dateRangeFilter === "today" && diffDays > 1) return false;
        if (dateRangeFilter === "week" && diffDays > 7) return false;
        if (dateRangeFilter === "month" && diffDays > 30) return false;
        if (dateRangeFilter === "quarter" && diffDays > 90) return false;
      }

      if (search) {
        const q = search.toLowerCase();
        return (
          e.clientName.toLowerCase().includes(q) || 
          e.summary.toLowerCase().includes(q) || 
          e.aiSummary.toLowerCase().includes(q) || 
          e.id.toLowerCase().includes(q) ||
          e.tags.some(t => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [entries, search, typeFilter, statusFilter, dateRangeFilter, riskFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter, statusFilter, dateRangeFilter, riskFilter]);

  const flaggedCount = entries.filter((e) => e.status === "flagged").length;
  const totalInteractions = entries.length;
  const avgRiskScore = Math.round(entries.reduce((acc, e) => acc + e.riskScore, 0) / entries.length);
  const highRiskCount = entries.filter((e) => e.riskScore >= 75).length;

  const typeDistribution = useMemo(() => {
    const counts = filtered.reduce((acc, entry) => {
      acc[entry.type] = (acc[entry.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts).map(([name, value]) => ({
      name: typeConfig[name]?.label || name,
      value,
      originalName: name
    })).sort((a, b) => b.value - a.value);
  }, [filtered]);

  const recentActivity = useMemo(() => {
    const days = 14;
    const now = new Date();
    const activity = Array.from({ length: days }).map((_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (days - 1 - i));
      return {
        date: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        count: 0,
        flagged: 0,
        clean: 0,
        reviewed: 0,
        pending: 0
      };
    });

    filtered.forEach((entry) => {
      const entryDate = new Date(entry.timestamp);
      const diffTime = Math.abs(now.getTime() - entryDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= days) {
        const index = days - diffDays;
        if (index >= 0 && index < days) {
          activity[index].count++;
          activity[index][entry.status]++;
        }
      }
    });

    return activity;
  }, [filtered]);

  const riskTrend = useMemo(() => {
    const weeks = 8;
    const now = new Date();
    const trend = Array.from({ length: weeks }).map((_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - ((weeks - 1 - i) * 7));
      return {
        week: `Week ${i+1}`,
        date: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        avgRisk: 0,
        maxRisk: 0,
        count: 0
      };
    });

    const weekBuckets: Record<number, number[]> = {};
    
    filtered.forEach((entry) => {
      const entryDate = new Date(entry.timestamp);
      const diffTime = Math.abs(now.getTime() - entryDate.getTime());
      const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
      
      if (diffWeeks < weeks) {
        const index = weeks - 1 - diffWeeks;
        if (!weekBuckets[index]) weekBuckets[index] = [];
        weekBuckets[index].push(entry.riskScore);
      }
    });

    Object.keys(weekBuckets).forEach((idx) => {
      const index = parseInt(idx);
      const scores = weekBuckets[index];
      if (scores.length > 0) {
        trend[index].avgRisk = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        trend[index].maxRisk = Math.max(...scores);
        trend[index].count = scores.length;
      }
    });

    return trend;
  }, [filtered]);

  const timeOfDayDist = useMemo(() => {
    const hours = Array.from({ length: 24 }).map((_, i) => ({
      hour: `${i.toString().padStart(2, "0")}:00`,
      count: 0,
      highRisk: 0
    }));

    filtered.forEach((entry) => {
      const hour = new Date(entry.timestamp).getHours();
      hours[hour].count++;
      if (entry.riskScore >= 75) {
        hours[hour].highRisk++;
      }
    });

    const buckets = [];
    for (let i = 0; i < 24; i += 3) {
      let count = 0;
      let highRisk = 0;
      for (let j = 0; j < 3; j++) {
        if (i + j < 24) {
          count += hours[i + j].count;
          highRisk += hours[i + j].highRisk;
        }
      }
      buckets.push({
        time: `${i.toString().padStart(2, "0")}:00 - ${(i+2).toString().padStart(2, "0")}:59`,
        count,
        highRisk
      });
    }

    return buckets;
  }, [filtered]);

  const riskDurationScatter = useMemo(() => {
    return filtered.slice(0, 100).map((entry) => ({
      id: entry.id,
      riskScore: entry.riskScore,
      duration: entry.duration,
      type: typeConfig[entry.type]?.label || entry.type,
      z: 1 // size of bubble
    }));
  }, [filtered]);

  const complianceRadar = useMemo(() => {
    return [
      { subject: "Documentation", A: Math.floor(Math.random() * 40) + 60, fullMark: 100 },
      { subject: "Suitability", A: Math.floor(Math.random() * 40) + 60, fullMark: 100 },
      { subject: "Timeliness", A: Math.floor(Math.random() * 40) + 60, fullMark: 100 },
      { subject: "Disclosures", A: Math.floor(Math.random() * 40) + 60, fullMark: 100 },
      { subject: "Supervision", A: Math.floor(Math.random() * 40) + 60, fullMark: 100 },
      { subject: "Training", A: Math.floor(Math.random() * 40) + 60, fullMark: 100 },
    ];
  }, []);

  const COLORS = ["#22c55e", "#3b82f6", "#f0c040", "#a78bfa", "#ef4444", "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#8b5cf6"];

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedEntries);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedEntries(newSelection);
  };

  const selectAll = () => {
    if (selectedEntries.size === paginatedEntries.length) {
      setSelectedEntries(new Set());
    } else {
      setSelectedEntries(new Set(paginatedEntries.map((e) => e.id)));
    }
  };

  const markAsReviewed = () => {
    if (selectedEntries.size === 0) return;
    toast.success(`Marked ${selectedEntries.size} entries as reviewed`);
    setSelectedEntries(new Set());
  };

  const escalateSelected = () => {
    if (selectedEntries.size === 0) return;
    toast.success(`Escalated ${selectedEntries.size} entries to compliance officer`);
    setSelectedEntries(new Set());
  };

  const exportCSV = () => {
    setIsExporting(true);
    setTimeout(() => {
      const headers = ["ID", "Timestamp", "Type", "Client", "Summary", "Smart Summary", "Flags", "Status", "Risk Score", "Location", "Device"];
      const rows = filtered.map((e) => [
        e.id, 
        e.timestamp.toISOString(), 
        e.type, 
        e.clientName, 
        `"${e.summary.replace(/"/g, '""')}"`, 
        `"${e.aiSummary.replace(/"/g, '""')}"`, 
        `"${e.complianceFlags.join("; ")}"`, 
        e.status,
        e.riskScore,
        `"${e.location}"`,
        `"${e.device}"`
      ]);
      
      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; 
      a.download = `compliance-audit-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click(); 
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setIsExporting(false);
      toast.success(`Exported ${filtered.length} records to CSV`);
    }, 500);
  };

  const handleAction = (action: string, entryId: string) => {
    toast.success(`${action} applied to ${entryId}`);
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
        {/* Header */}
        <div className="rc-page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-[#0d1a2e] border border-[#12233e]">
              <Shield className="h-6 w-6 text-[#22c55e]" />
            </div>
            <div>
              <h1 className="rc-page-title text-2xl font-bold text-white">Compliance Audit Trail</h1>
              <p className="rc-page-subtitle text-[#7a95b8] mt-1">Comprehensive monitoring, alerting, and interaction logging</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ExportToSlides
              toolName="Compliance Audit Trail"
              getSections={() => [
                {
                  title: "Audit Summary",
                  items: [
                    { label: "Total Interactions", value: totalInteractions.toString() },
                    { label: "Flagged for Review", value: flaggedCount.toString() },
                    { label: "Average Risk Score", value: avgRiskScore.toString() },
                    { label: "High Risk Events", value: highRiskCount.toString() }
                  ]
                }
              ]}
            />
            <button 
              onClick={exportCSV} 
              disabled={isExporting}
              className="rc-btn rc-btn-ghost flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0d1a2e] border border-[#12233e] text-white hover:bg-[#12233e] transition-colors"
            >
              {isExporting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Export CSV
            </button>
            <button 
              onClick={() => toast.success("Report generation started")} 
              className="rc-btn flex items-center gap-2 px-4 py-2 rounded-lg bg-[#22c55e] text-white hover:bg-[#1ea950] transition-colors"
            >
              <FileText className="h-4 w-4" />
              Generate Report
            </button>
          </div>
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5 flex flex-col justify-center transition-all hover:border-[#3b82f6]/50">
            <div className="flex items-center justify-between mb-2">
              <p className="rc-stat-label text-xs font-medium text-[#7a95b8] uppercase tracking-wider">Total Events</p>
              <div className="p-1.5 rounded-md bg-[#3b82f6]/10 text-[#3b82f6]">
                <Activity className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="rc-stat-value text-3xl font-bold text-white">{totalInteractions}</p>
              <span className="text-xs font-medium text-[#22c55e] flex items-center"><ArrowUpRight className="h-3 w-3 mr-0.5" /> 12%</span>
            </div>
            <p className="text-xs text-[#7a95b8] mt-2">vs previous 30 days</p>
          </div>
          
          <div className={`rc-card rounded-2xl p-5 flex flex-col justify-center transition-all ${flaggedCount > 0 ? "bg-[#f0c040]/5 border-[#f0c040]/30 hover:border-[#f0c040]/50" : "bg-[#0d1a2e] border-[#12233e] hover:border-[#22c55e]/50"}`}>
            <div className="flex items-center justify-between mb-2">
              <p className={`rc-stat-label text-xs font-medium uppercase tracking-wider ${flaggedCount > 0 ? "text-[#f0c040]" : "text-[#7a95b8]"}`}>Flagged / Pending</p>
              <div className={`p-1.5 rounded-md ${flaggedCount > 0 ? "bg-[#f0c040]/10 text-[#f0c040]" : "bg-[#22c55e]/10 text-[#22c55e]"}`}>
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className={`rc-stat-value text-3xl font-bold ${flaggedCount > 0 ? "text-[#f0c040]" : "text-white"}`}>{flaggedCount}</p>
              <span className="text-xs font-medium text-[#ef4444] flex items-center"><ArrowUpRight className="h-3 w-3 mr-0.5" /> 4%</span>
            </div>
            <p className="text-xs text-[#7a95b8] mt-2">Require compliance review</p>
          </div>

          <div className={`rc-card rounded-2xl p-5 flex flex-col justify-center transition-all ${avgRiskScore > 50 ? "bg-[#ef4444]/5 border-[#ef4444]/30 hover:border-[#ef4444]/50" : "bg-[#0d1a2e] border-[#12233e] hover:border-[#a78bfa]/50"}`}>
            <div className="flex items-center justify-between mb-2">
              <p className={`rc-stat-label text-xs font-medium uppercase tracking-wider ${avgRiskScore > 50 ? "text-[#ef4444]" : "text-[#7a95b8]"}`}>Avg Risk Score</p>
              <div className={`p-1.5 rounded-md ${avgRiskScore > 50 ? "bg-[#ef4444]/10 text-[#ef4444]" : "bg-[#a78bfa]/10 text-[#a78bfa]"}`}>
                <ShieldAlert className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className={`rc-stat-value text-3xl font-bold ${avgRiskScore > 50 ? "text-[#ef4444]" : "text-white"}`}>{avgRiskScore}</p>
              <span className="text-xs font-medium text-[#22c55e] flex items-center"><ArrowDownRight className="h-3 w-3 mr-0.5" /> 2%</span>
            </div>
            <div className="w-full bg-[#12233e] h-1.5 rounded-full mt-3 overflow-hidden">
              <div 
                className={`h-full ${avgRiskScore < 30 ? "bg-[#22c55e]" : avgRiskScore < 70 ? "bg-[#f0c040]" : "bg-[#ef4444]"}`}
                style={{ width: `${avgRiskScore}%` }}
              />
            </div>
          </div>

          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5 flex flex-col justify-center transition-all hover:border-[#14b8a6]/50">
            <div className="flex items-center justify-between mb-2">
              <p className="rc-stat-label text-xs font-medium text-[#7a95b8] uppercase tracking-wider">Smart Summaries</p>
              <div className="p-1.5 rounded-md bg-[#14b8a6]/10 text-[#14b8a6]">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="rc-stat-value text-3xl font-bold text-white">{entries.filter((e) => e.aiSummary).length}</p>
              <span className="text-xs font-medium text-[#7a95b8]">/ {totalInteractions}</span>
            </div>
            <p className="text-xs text-[#7a95b8] mt-2">AI-generated compliance insights</p>
          </div>
        </div>

        {/* Main Dashboard Layout */}
        <div className="flex flex-col xl:flex-row gap-6">
          {/* Left Column - Visualizations */}
          <div className="w-full xl:w-[35%] space-y-6">
            {/* Chart 1: Type Distribution */}
            <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-[#7a95b8]" />
                  <h3 className="text-sm font-semibold text-white">Event Distribution</h3>
                </div>
                <button className="text-[#7a95b8] hover:text-white transition-colors">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
              {typeDistribution.length > 0 ? (
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={typeDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {typeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RTooltip 
                        contentStyle={{ background: "#0d1a2e", border: "1px solid #12233e", borderRadius: "8px", color: "#fff", fontSize: "12px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }} 
                        itemStyle={{ color: "#c8d8ec" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[240px] flex flex-col items-center justify-center text-[#7a95b8]">
                  <PieChartIcon className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No data available</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 mt-4">
                {typeDistribution.slice(0, 4).map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-[#c8d8ec] truncate max-w-[80px]">{item.name}</span>
                    </div>
                    <span className="font-medium text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 2: Risk Trend */}
            <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-[#7a95b8]" />
                  <h3 className="text-sm font-semibold text-white">Risk Score Trend (8 Weeks)</h3>
                </div>
              </div>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={riskTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                    <XAxis dataKey="week" stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <RTooltip 
                      contentStyle={{ background: "#0d1a2e", border: "1px solid #12233e", borderRadius: "8px", color: "#fff", fontSize: "12px" }}
                    />
                    <Line type="monotone" dataKey="avgRisk" name="Avg Risk" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: "#3b82f6" }} activeDot={{ r: 5 }} />
                    <Line type="monotone" dataKey="maxRisk" name="Max Risk" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Radar Chart */}
            <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#7a95b8]" />
                  <h3 className="text-sm font-semibold text-white">Compliance Coverage</h3>
                </div>
              </div>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={complianceRadar}>
                    <PolarGrid stroke="#12233e" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#7a95b8", fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#7a95b8", fontSize: 8 }} />
                    <Radar name="Score" dataKey="A" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                    <RTooltip contentStyle={{ background: "#0d1a2e", border: "1px solid #12233e", borderRadius: "8px", color: "#fff", fontSize: "12px" }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Right Column - Main Content */}
          <div className="w-full xl:w-[65%] space-y-6">
            {/* Chart 4: Activity Volume (BarChart) */}
            <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[#7a95b8]" />
                  <h3 className="text-sm font-semibold text-white">Activity Volume & Status (14 Days)</h3>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-[#3b82f6]" /> <span className="text-[#7a95b8]">Clean</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-[#f0c040]" /> <span className="text-[#7a95b8]">Flagged</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-[#22c55e]" /> <span className="text-[#7a95b8]">Reviewed</span></div>
                </div>
              </div>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={recentActivity} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                    <XAxis dataKey="date" stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} />
                    <RTooltip 
                      contentStyle={{ background: "#0d1a2e", border: "1px solid #12233e", borderRadius: "8px", color: "#fff", fontSize: "12px" }}
                      cursor={{ fill: "#12233e", opacity: 0.4 }}
                    />
                    <Bar dataKey="clean" stackId="a" name="Clean" fill="#3b82f6" />
                    <Bar dataKey="reviewed" stackId="a" name="Reviewed" fill="#22c55e" />
                    <Bar dataKey="pending" stackId="a" name="Pending" fill="#a78bfa" />
                    <Bar dataKey="flagged" stackId="a" name="Flagged" fill="#f0c040" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 5: Time of Day (AreaChart) */}
            <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-[#7a95b8]" />
                  <h3 className="text-sm font-semibold text-white">Activity by Time of Day</h3>
                </div>
              </div>
              <div className="h-[160px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeOfDayDist} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                    <XAxis dataKey="time" stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} />
                    <RTooltip contentStyle={{ background: "#0d1a2e", border: "1px solid #12233e", borderRadius: "8px", color: "#fff", fontSize: "12px" }} />
                    <Area type="monotone" dataKey="count" name="Total Events" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorCount)" />
                    <Area type="monotone" dataKey="highRisk" name="High Risk" stroke="#ef4444" fill="none" strokeDasharray="3 3" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Filters & Search */}
            <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7a95b8]" />
                  <input 
                    type="text"
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                    placeholder="Search clients, IDs, summaries, tags..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-[#060d19] border border-[#12233e] rounded-xl text-white placeholder-[#7a95b8] focus:outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-all"
                  />
                  {search && (
                    <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a95b8] hover:text-white">
                      &times;
                    </button>
                  )}
                </div>
                
                <div className="flex flex-wrap lg:flex-nowrap gap-3">
                  <div className="relative min-w-[140px] flex-1 lg:flex-none">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7a95b8]" />
                    <select 
                      value={typeFilter} 
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="w-full pl-10 pr-8 py-2.5 bg-[#060d19] border border-[#12233e] rounded-xl text-white appearance-none focus:outline-none focus:border-[#3b82f6] transition-colors cursor-pointer text-sm"
                    >
                      <option value="all">All Types</option>
                      {Object.entries(typeConfig).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7a95b8] pointer-events-none" />
                  </div>
                  
                  <div className="relative min-w-[140px] flex-1 lg:flex-none">
                    <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7a95b8]" />
                    <select 
                      value={statusFilter} 
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full pl-10 pr-8 py-2.5 bg-[#060d19] border border-[#12233e] rounded-xl text-white appearance-none focus:outline-none focus:border-[#3b82f6] transition-colors cursor-pointer text-sm"
                    >
                      <option value="all">All Status</option>
                      {Object.entries(statusConfig).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7a95b8] pointer-events-none" />
                  </div>
                  
                  <div className="relative min-w-[140px] flex-1 lg:flex-none">
                    <ShieldAlert className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7a95b8]" />
                    <select 
                      value={riskFilter} 
                      onChange={(e) => setRiskFilter(e.target.value)}
                      className="w-full pl-10 pr-8 py-2.5 bg-[#060d19] border border-[#12233e] rounded-xl text-white appearance-none focus:outline-none focus:border-[#3b82f6] transition-colors cursor-pointer text-sm"
                    >
                      <option value="all">All Risk Levels</option>
                      <option value="high">High Risk (75+)</option>
                      <option value="medium">Medium Risk (40-74)</option>
                      <option value="low">Low Risk (0-39)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7a95b8] pointer-events-none" />
                  </div>

                  <div className="relative min-w-[140px] flex-1 lg:flex-none">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7a95b8]" />
                    <select 
                      value={dateRangeFilter} 
                      onChange={(e) => setDateRangeFilter(e.target.value)}
                      className="w-full pl-10 pr-8 py-2.5 bg-[#060d19] border border-[#12233e] rounded-xl text-white appearance-none focus:outline-none focus:border-[#3b82f6] transition-colors cursor-pointer text-sm"
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">Past 7 Days</option>
                      <option value="month">Past 30 Days</option>
                      <option value="quarter">Past 90 Days</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7a95b8] pointer-events-none" />
                  </div>
                </div>
              </div>
              
              {/* Bulk Actions Bar */}
              {selectedEntries.size > 0 && (
                <div className="mt-4 p-3 bg-[#3b82f6]/10 border border-[#3b82f6]/30 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-white">{selectedEntries.size} items selected</span>
                    <div className="h-4 w-px bg-[#12233e]"></div>
                    <button onClick={() => setSelectedEntries(new Set())} className="text-xs text-[#7a95b8] hover:text-white transition-colors">Clear</button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={markAsReviewed} className="rc-btn text-xs px-3 py-1.5 rounded-lg bg-[#22c55e]/20 text-[#22c55e] hover:bg-[#22c55e]/30 border border-[#22c55e]/30 transition-colors flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Mark Reviewed
                    </button>
                    <button onClick={escalateSelected} className="rc-btn text-xs px-3 py-1.5 rounded-lg bg-[#ef4444]/20 text-[#ef4444] hover:bg-[#ef4444]/30 border border-[#ef4444]/30 transition-colors flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" /> Escalate
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* View Tabs */}
            <div className="flex items-center gap-2 border-b border-[#12233e] pb-px">
              <button 
                onClick={() => setActiveTab("list")} 
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "list" ? "border-[#3b82f6] text-[#3b82f6]" : "border-transparent text-[#7a95b8] hover:text-white"}`}
              >
                Detailed List
              </button>
              <button 
                onClick={() => setActiveTab("table")} 
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "table" ? "border-[#3b82f6] text-[#3b82f6]" : "border-transparent text-[#7a95b8] hover:text-white"}`}
              >
                Data Table
              </button>
            </div>

            {/* List View */}
            {activeTab === "list" && (
              <div className="space-y-3">
                {paginatedEntries.length > 0 ? (
                  paginatedEntries.map((entry) => {
                    const config = typeConfig[entry.type] || { label: entry.type, icon: FileText, color: "bg-[#12233e] text-[#7a95b8] border-[#12233e]" };
                    const sConfig = statusConfig[entry.status];
                    const Icon = config.icon;
                    const isExpanded = expandedId === entry.id;
                    const isSelected = selectedEntries.has(entry.id);
                    
                    return (
                      <div 
                        key={entry.id} 
                        className={`rc-card rounded-xl p-0 transition-all border overflow-hidden ${
                          isSelected ? "border-[#3b82f6] bg-[#3b82f6]/5" : 
                          entry.status === "flagged" ? "bg-[#f0c040]/5 border-[#f0c040]/30 hover:border-[#f0c040]/50" : 
                          entry.riskScore >= 75 ? "bg-[#ef4444]/5 border-[#ef4444]/30 hover:border-[#ef4444]/50" :
                          "bg-[#0d1a2e] border-[#12233e] hover:border-[#3b82f6]/50"
                        }`}
                      >
                        <div className="p-4 flex items-start gap-4">
                          <div className="pt-1">
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => toggleSelection(entry.id)}
                              className="w-4 h-4 rounded border-[#12233e] bg-[#060d19] text-[#3b82f6] focus:ring-[#3b82f6] focus:ring-offset-[#0d1a2e]"
                            />
                          </div>
                          <div className={`p-2 rounded-lg ${config.color.split(" ")[0]} shrink-0 mt-0.5 cursor-pointer`} onClick={() => setExpandedId(isExpanded ? null : entry.id)}>
                            <Icon className={`h-4 w-4 ${config.color.split(" ")[1]}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : entry.id)}>
                              <span className={`text-xs px-2 py-0.5 rounded-md border ${config.color}`}>{config.label}</span>
                              <span className="text-sm font-medium text-white">{entry.clientName}</span>
                              <span className="text-xs text-[#7a95b8]">{entry.id}</span>
                              
                              <span className={`text-xs px-2 py-0.5 rounded-md border flex items-center ${sConfig.color}`}>
                                <sConfig.icon className="h-3 w-3 mr-1" /> {sConfig.label}
                              </span>
                              
                              {entry.riskScore >= 75 && (
                                <span className="text-xs px-2 py-0.5 rounded-md border bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30 flex items-center">
                                  <ShieldAlert className="h-3 w-3 mr-1" /> High Risk ({entry.riskScore})
                                </span>
                              )}
                              
                              <span className="text-xs text-[#7a95b8] ml-auto">
                                {entry.timestamp.toLocaleDateString()} {entry.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                              
                              <button className="p-1 hover:bg-[#12233e] rounded transition-colors">
                                {isExpanded ? <ChevronDown className="h-4 w-4 text-[#7a95b8]" /> : <ChevronRight className="h-4 w-4 text-[#7a95b8]" />}
                              </button>
                            </div>
                            
                            <p className="text-sm text-[#c8d8ec] cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : entry.id)}>{entry.summary}</p>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {entry.tags.map((tag, i) => (
                                <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-[#12233e] text-[#7a95b8] border border-[#12233e]/50">
                                  {tag}
                                </span>
                              ))}
                            </div>

                            {isExpanded && (
                              <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                {/* Metadata grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded-xl bg-[#060d19] border border-[#12233e]">
                                  <div>
                                    <p className="text-[10px] text-[#7a95b8] uppercase mb-1">Location</p>
                                    <div className="flex items-center text-xs text-[#c8d8ec]"><Globe className="h-3 w-3 mr-1 text-[#3b82f6]" /> {entry.location}</div>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-[#7a95b8] uppercase mb-1">IP Address</p>
                                    <div className="flex items-center text-xs text-[#c8d8ec]"><Server className="h-3 w-3 mr-1 text-[#8b5cf6]" /> {entry.ipAddress}</div>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-[#7a95b8] uppercase mb-1">Device</p>
                                    <div className="flex items-center text-xs text-[#c8d8ec]"><Cpu className="h-3 w-3 mr-1 text-[#14b8a6]" /> {entry.device}</div>
                                  </div>
                                  <div>
                                    <p className="text-[10px] text-[#7a95b8] uppercase mb-1">Duration</p>
                                    <div className="flex items-center text-xs text-[#c8d8ec]"><Clock className="h-3 w-3 mr-1 text-[#f0c040]" /> {entry.duration} min</div>
                                  </div>
                                </div>

                                {entry.aiSummary && (
                                  <div className="p-4 rounded-xl bg-[#14b8a6]/5 border border-[#14b8a6]/20 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-2 opacity-10">
                                      <Zap className="h-16 w-16 text-[#14b8a6]" />
                                    </div>
                                    <div className="flex items-center gap-2 mb-2 relative z-10">
                                      <Sparkles className="h-4 w-4 text-[#14b8a6]" />
                                      <span className="text-xs font-semibold text-[#14b8a6] uppercase tracking-wider">AI Compliance Summary</span>
                                    </div>
                                    <p className="text-sm text-[#c8d8ec] leading-relaxed relative z-10">{entry.aiSummary}</p>
                                  </div>
                                )}
                                
                                <div className="p-4 rounded-xl bg-[#060d19] border border-[#12233e]">
                                  <p className="text-xs font-semibold text-[#7a95b8] uppercase tracking-wider mb-2">Full Details</p>
                                  <p className="text-sm text-[#c8d8ec] leading-relaxed font-mono text-[13px]">{entry.details}</p>
                                </div>

                                {entry.complianceFlags.length > 0 && (
                                  <div className="p-3 rounded-xl bg-[#f0c040]/5 border border-[#f0c040]/20">
                                    <p className="text-xs font-semibold text-[#f0c040] uppercase tracking-wider mb-2 flex items-center"><AlertTriangle className="h-3.5 w-3.5 mr-1.5" /> Flags Identified</p>
                                    <ul className="list-disc pl-5 space-y-1">
                                      {entry.complianceFlags.map((flag, i) => (
                                        <li key={i} className="text-sm text-[#c8d8ec]">{flag}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Actions Bar */}
                                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#12233e]">
                                  <button onClick={() => handleAction("View Source", entry.id)} className="rc-btn rc-btn-ghost text-xs px-3 py-1.5 rounded-lg border border-[#12233e] text-white hover:bg-[#12233e] transition-colors flex items-center gap-1.5">
                                    <Eye className="h-3.5 w-3.5" /> View Source
                                  </button>
                                  <button onClick={() => handleAction("Copy ID", entry.id)} className="rc-btn rc-btn-ghost text-xs px-3 py-1.5 rounded-lg border border-[#12233e] text-white hover:bg-[#12233e] transition-colors flex items-center gap-1.5">
                                    <Copy className="h-3.5 w-3.5" /> Copy ID
                                  </button>
                                  <button onClick={() => handleAction("Share", entry.id)} className="rc-btn rc-btn-ghost text-xs px-3 py-1.5 rounded-lg border border-[#12233e] text-white hover:bg-[#12233e] transition-colors flex items-center gap-1.5">
                                    <Share2 className="h-3.5 w-3.5" /> Share
                                  </button>
                                  
                                  <div className="flex-1"></div>
                                  
                                  {entry.status !== "reviewed" && entry.status !== "clean" && (
                                    <button onClick={() => handleAction("Mark Reviewed", entry.id)} className="rc-btn text-xs px-3 py-1.5 rounded-lg bg-[#22c55e]/10 text-[#22c55e] hover:bg-[#22c55e]/20 border border-[#22c55e]/30 transition-colors flex items-center gap-1.5">
                                      <CheckCircle2 className="h-3.5 w-3.5" /> Mark Reviewed
                                    </button>
                                  )}
                                  <button onClick={() => handleAction("Add Note", entry.id)} className="rc-btn text-xs px-3 py-1.5 rounded-lg bg-[#3b82f6]/10 text-[#3b82f6] hover:bg-[#3b82f6]/20 border border-[#3b82f6]/30 transition-colors flex items-center gap-1.5">
                                    <MessageSquare className="h-3.5 w-3.5" /> Add Note
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl py-16 flex flex-col items-center justify-center text-center">
                    <Search className="h-10 w-10 text-[#7a95b8] mb-4 opacity-50" />
                    <h3 className="text-lg font-medium text-white mb-1">No entries found</h3>
                    <p className="text-sm text-[#7a95b8]">Try adjusting your search or filter criteria</p>
                    <button 
                      onClick={() => { setSearch(""); setTypeFilter("all"); setStatusFilter("all"); setRiskFilter("all"); setDateRangeFilter("all"); }}
                      className="mt-4 rc-btn rc-btn-ghost px-4 py-2 rounded-lg border border-[#12233e] text-white hover:bg-[#12233e] transition-colors text-sm"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Table View */}
            {activeTab === "table" && (
              <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-[#c8d8ec]">
                    <thead className="text-xs text-[#7a95b8] uppercase bg-[#060d19] border-b border-[#12233e]">
                      <tr>
                        <th className="px-4 py-3 w-10">
                          <input 
                            type="checkbox" 
                            checked={selectedEntries.size === paginatedEntries.length && paginatedEntries.length > 0}
                            onChange={selectAll}
                            className="w-4 h-4 rounded border-[#12233e] bg-[#0d1a2e] text-[#3b82f6] focus:ring-[#3b82f6]"
                          />
                        </th>
                        <th className="px-4 py-3">ID / Date</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Client</th>
                        <th className="px-4 py-3">Summary</th>
                        <th className="px-4 py-3">Risk</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedEntries.map((entry) => {
                        const config = typeConfig[entry.type] || { label: entry.type, icon: FileText, color: "bg-[#12233e] text-[#7a95b8] border-[#12233e]" };
                        const sConfig = statusConfig[entry.status];
                        const Icon = config.icon;
                        const isSelected = selectedEntries.has(entry.id);
                        
                        return (
                          <tr key={entry.id} className={`border-b border-[#12233e]/50 hover:bg-[#12233e]/30 transition-colors ${isSelected ? "bg-[#3b82f6]/5" : ""}`}>
                            <td className="px-4 py-3">
                              <input 
                                type="checkbox" 
                                checked={isSelected}
                                onChange={() => toggleSelection(entry.id)}
                                className="w-4 h-4 rounded border-[#12233e] bg-[#0d1a2e] text-[#3b82f6] focus:ring-[#3b82f6]"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-white">{entry.id}</div>
                              <div className="text-xs text-[#7a95b8]">{entry.timestamp.toLocaleDateString()}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border ${config.color}`}>
                                <Icon className="h-3 w-3" /> {config.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-medium text-white">{entry.clientName}</td>
                            <td className="px-4 py-3">
                              <div className="truncate max-w-[200px] lg:max-w-[300px]" title={entry.summary}>{entry.summary}</div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 text-xs font-medium ${entry.riskScore >= 75 ? "text-[#ef4444]" : entry.riskScore >= 40 ? "text-[#f0c040]" : "text-[#22c55e]"}`}>
                                {entry.riskScore}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md border ${sConfig.color}`}>
                                <sConfig.icon className="h-3 w-3" /> {sConfig.label}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => { setExpandedId(entry.id); setActiveTab("list"); }} className="p-1.5 text-[#7a95b8] hover:text-white hover:bg-[#12233e] rounded transition-colors" title="View Details">
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button className="p-1.5 text-[#7a95b8] hover:text-white hover:bg-[#12233e] rounded transition-colors" title="More Options">
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {paginatedEntries.length === 0 && (
                  <div className="py-12 text-center text-[#7a95b8]">No data to display in table format</div>
                )}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-[#7a95b8]">
                  Showing <span className="font-medium text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-white">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> of <span className="font-medium text-white">{filtered.length}</span> entries
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-[#12233e] bg-[#0d1a2e] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#12233e] transition-colors text-sm"
                  >
                    Previous
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                      let pageNum = currentPage;
                      if (totalPages <= 5) pageNum = i + 1;
                      else if (currentPage <= 3) pageNum = i + 1;
                      else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                      else pageNum = currentPage - 2 + i;
                      
                      return (
                        <button 
                          key={i} 
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center transition-colors ${currentPage === pageNum ? "bg-[#3b82f6] text-white font-medium" : "bg-[#0d1a2e] border border-[#12233e] text-[#7a95b8] hover:bg-[#12233e] hover:text-white"}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-[#12233e] bg-[#0d1a2e] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#12233e] transition-colors text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Quick Actions Footer Panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:border-[#3b82f6]/50 transition-colors group">
            <div className="p-3 rounded-xl bg-[#3b82f6]/10 text-[#3b82f6] group-hover:bg-[#3b82f6] group-hover:text-white transition-colors">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Generate Audit Report</h4>
              <p className="text-xs text-[#7a95b8]">Create PDF summary for regulators</p>
            </div>
          </div>
          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:border-[#f0c040]/50 transition-colors group">
            <div className="p-3 rounded-xl bg-[#f0c040]/10 text-[#f0c040] group-hover:bg-[#f0c040] group-hover:text-white transition-colors">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Configure Alert Rules</h4>
              <p className="text-xs text-[#7a95b8]">Adjust sensitivity and thresholds</p>
            </div>
          </div>
          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-4 flex items-center gap-4 cursor-pointer hover:border-[#14b8a6]/50 transition-colors group">
            <div className="p-3 rounded-xl bg-[#14b8a6]/10 text-[#14b8a6] group-hover:bg-[#14b8a6] group-hover:text-white transition-colors">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Compliance Guide</h4>
              <p className="text-xs text-[#7a95b8]">View policies and procedures</p>
            </div>
          </div>
        </div>

        <PageInsights pageId="compliance-audit-trail" />
      </div>
    </AppShell>
  );
}