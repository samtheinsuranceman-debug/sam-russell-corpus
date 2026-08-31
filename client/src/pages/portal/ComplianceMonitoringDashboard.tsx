// @ts-nocheck
import React, { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Eye,
  BarChart3,
  Calendar,
  Users,
  Zap,
  XCircle,
  Search,
  Download,
  Filter,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  MoreHorizontal,
  Settings,
  Plus,
  Flag,
  Bookmark,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Server,
  Database,
  Globe,
  ShieldAlert,
  Edit3,
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, 
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart 
} from "recharts";
import { toast } from "sonner";

interface ComplianceItem {
  id: string;
  category: string;
  title: string;
  description: string;
  status: "compliant" | "warning" | "violation" | "pending";
  dueDate: string;
  lastChecked: string;
  regulation: string;
  priority: "high" | "medium" | "low";
  actionRequired: string;
  assignee?: string;
  department?: string;
  impactScore?: number;
  costEstimate?: number;
}

const generateComplianceItems = (): ComplianceItem[] => {
  const items: ComplianceItem[] = [];
  const categories = ["ADV Filing", "Client Agreements", "Advertising", "Cybersecurity", "Books & Records", "AML/KYC", "Suitability", "Privacy", "Custody", "Insurance", "Continuing Ed", "Disclosures"];
  const statuses: ("compliant" | "warning" | "violation" | "pending")[] = ["compliant", "warning", "violation", "pending"];
  const priorities: ("high" | "medium" | "low")[] = ["high", "medium", "low"];
  const departments = ["Legal", "Operations", "IT", "HR", "Executive", "Sales"];
  
  for (let i = 1; i <= 50; i++) {
    const category = categories[i % categories.length];
    const status = statuses[i % statuses.length];
    const priority = priorities[i % priorities.length];
    const dept = departments[i % departments.length];
    
    items.push({
      id: `C-${1000 + i}`,
      category,
      title: `${category} Requirement ${i}`,
      description: `Detailed description for ${category} compliance requirement ${i}. Ensuring adherence to regulatory standards.`,
      status,
      dueDate: new Date(Date.now() + (i * 86400000 * (i % 2 === 0 ? 1 : -1))).toISOString().split('T')[0],
      lastChecked: new Date(Date.now() - (i * 86400000)).toISOString().split('T')[0],
      regulation: `SEC Rule 20${i % 10}-${i % 5}`,
      priority,
      actionRequired: `Action required for item ${i}. Review and update documentation.`,
      assignee: `User ${i % 10}`,
      department: dept,
      impactScore: Math.floor(Math.random() * 100),
      costEstimate: Math.floor(Math.random() * 10000)
    });
  }
  return items;
};

const COMPLIANCE_ITEMS = generateComplianceItems();

const STATUS_STYLES = {
  compliant: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", label: "Compliant", icon: CheckCircle2, badge: "rc-badge-green" },
  warning: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30", label: "Warning", icon: AlertTriangle, badge: "rc-badge-gold" },
  violation: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30", label: "Violation", icon: XCircle, badge: "rc-badge-red" },
  pending: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30", label: "Pending", icon: Clock, badge: "rc-badge-blue" },
};

const PIE_COLORS = ["#22c55e", "#f0c040", "#3b82f6", "#ef4444"];
const CHART_COLORS = ["#22c55e", "#3b82f6", "#f0c040", "#ef4444", "#a855f7", "#ec4899", "#14b8a6", "#f97316"];

export default function ComplianceMonitoringDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState<string>("All");
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc'|'desc'} | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [timeRange, setTimeRange] = useState<'1m'|'3m'|'6m'|'1y'>('6m');
  const [numberInputVal, setNumberInputVal] = useState<number>(100);

  const alertsStatsQuery = trpc.complianceAlerts.stats.useQuery(undefined, { staleTime: 30_000 });
  const alertsListQuery = trpc.complianceAlerts.list.useQuery({ severity: undefined, dismissed: false }, { staleTime: 30_000 });
  const complianceAuditQuery = trpc.complianceAudit.list.useQuery({ limit: 10 });
  const complianceTrackingQuery = trpc.complianceTracking.summary.useQuery();
  const riskScoringQuery = trpc.riskScoring.latest.useQuery();
  const teamQuery = trpc.team.members.useQuery();

  const liveAlerts = alertsListQuery.data ?? [];
  const liveStats = alertsStatsQuery.data;
  
  const handleRefresh = () => {
    setIsRefreshing(true);
    alertsStatsQuery.refetch();
    alertsListQuery.refetch();
    complianceAuditQuery.refetch();
    complianceTrackingQuery.refetch();
    riskScoringQuery.refetch();
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Dashboard data refreshed");
    }, 1000);
  };

  const handleExportCSV = () => {
    try {
      const headers = ["ID", "Category", "Title", "Status", "Due Date", "Last Checked", "Regulation", "Priority", "Action Required"];
      const rows = COMPLIANCE_ITEMS.map((item) => [
        item.id,
        `"${item.category}"`,
        `"${item.title}"`,
        item.status,
        item.dueDate,
        item.lastChecked,
        `"${item.regulation}"`,
        item.priority,
        `"${item.actionRequired}"`
      ]);
      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `compliance_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Compliance report exported successfully");
    } catch (error) {
      toast.error("Failed to export compliance report");
    }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filtered = useMemo(() => {
    let result = COMPLIANCE_ITEMS.filter((item) => {
      const matchesStatus = filterStatus === "all" || item.status === filterStatus;
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.regulation.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDept = selectedDept === "All" || item.department === selectedDept;
      return matchesStatus && matchesSearch && matchesDept;
    });

    if (sortConfig) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [filterStatus, searchQuery, selectedDept, sortConfig]);

  const departments = ["All", ...Array.from(new Set(COMPLIANCE_ITEMS.map((i) => i.department).filter(Boolean)))];

  const compliantCount = COMPLIANCE_ITEMS.filter((i) => i.status === "compliant").length;
  const warningCount = COMPLIANCE_ITEMS.filter((i) => i.status === "warning").length + (liveStats?.warning ?? 0);
  const pendingCount = COMPLIANCE_ITEMS.filter((i) => i.status === "pending").length;
  const violationCount = COMPLIANCE_ITEMS.filter((i) => i.status === "violation").length + (liveStats?.critical ?? 0);
  const totalItems = COMPLIANCE_ITEMS.length + (liveStats?.total ?? 0);
  const complianceScore = Math.round((compliantCount / Math.max(totalItems, 1)) * 100);

  const categoryData = useMemo(() => {
    const cats: Record<string, { compliant: number; warning: number; pending: number; violation: number }> = {};
    COMPLIANCE_ITEMS.forEach((item) => {
      if (!cats[item.category]) cats[item.category] = { compliant: 0, warning: 0, pending: 0, violation: 0 };
      cats[item.category][item.status]++;
    });
    return Object.entries(cats).map(([name, counts]) => ({ name: name.length > 14 ? name.slice(0, 14) + "…" : name, ...counts }));
  }, []);

  const pieData = [
    { name: "Compliant", value: compliantCount },
    { name: "Warning", value: warningCount },
    { name: "Pending", value: pendingCount },
    { name: "Violation", value: violationCount },
  ].filter((d) => d.value > 0);

  const trendData = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      month: `Month ${i+1}`,
      score: 70 + Math.random() * 25,
      violations: Math.floor(Math.random() * 10),
      warnings: Math.floor(Math.random() * 20)
    }));
  }, []);

  const radarData = useMemo(() => {
    return [
      { subject: 'Cybersecurity', A: 120, B: 110, fullMark: 150 },
      { subject: 'AML/KYC', A: 98, B: 130, fullMark: 150 },
      { subject: 'Suitability', A: 86, B: 130, fullMark: 150 },
      { subject: 'Privacy', A: 99, B: 100, fullMark: 150 },
      { subject: 'Advertising', A: 85, B: 90, fullMark: 150 },
      { subject: 'Books & Records', A: 65, B: 85, fullMark: 150 },
    ];
  }, []);

  const composedData = useMemo(() => {
    return Array.from({ length: 10 }).map((_, i) => ({
      name: `Dept ${i+1}`,
      uv: Math.floor(Math.random() * 1000),
      pv: Math.floor(Math.random() * 800),
      amt: Math.floor(Math.random() * 500)
    }));
  }, []);

  const areaData = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => ({
      day: i + 1,
      checks: Math.floor(Math.random() * 50) + 10,
      passed: Math.floor(Math.random() * 40) + 5
    }));
  }, []);

  const renderItemsTable = () => (
    <div className="overflow-x-auto rounded-xl border border-[#12233e] bg-[#060d19]">
      <table className="w-full text-left text-sm text-[#c8d8ec]">
        <thead className="bg-[#0d1a2e] text-xs uppercase text-[#7a95b8] border-b border-[#12233e]">
          <tr>
            <th className="px-4 py-3 cursor-pointer hover:text-white" onClick={() => handleSort('id')}>ID</th>
            <th className="px-4 py-3 cursor-pointer hover:text-white" onClick={() => handleSort('title')}>Title</th>
            <th className="px-4 py-3 cursor-pointer hover:text-white" onClick={() => handleSort('category')}>Category</th>
            <th className="px-4 py-3 cursor-pointer hover:text-white" onClick={() => handleSort('status')}>Status</th>
            <th className="px-4 py-3 cursor-pointer hover:text-white" onClick={() => handleSort('dueDate')}>Due Date</th>
            <th className="px-4 py-3 cursor-pointer hover:text-white" onClick={() => handleSort('priority')}>Priority</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.slice(0, 10).map((item) => {
            const style = STATUS_STYLES[item.status];
            return (
              <tr key={item.id} className="border-b border-[#12233e] hover:bg-[#0d1a2e]/50 transition-colors">
                <td className="px-4 py-3 font-medium text-white">{item.id}</td>
                <td className="px-4 py-3 max-w-[200px] truncate" title={item.title}>{item.title}</td>
                <td className="px-4 py-3">{item.category}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${style.bg} ${style.text} border ${style.border}`}>
                    <style.icon className="w-3 h-3" />
                    {style.label}
                  </span>
                </td>
                <td className="px-4 py-3">{item.dueDate}</td>
                <td className="px-4 py-3">
                  <span className={`rc-badge ${item.priority === "high" ? "rc-badge-red" : item.priority === "medium" ? "rc-badge-gold" : "rc-badge-blue"}`}>
                    {item.priority}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-1 text-[#7a95b8] hover:text-white hover:bg-[#12233e] rounded transition-colors" onClick={() => toast.info(`Viewing ${item.id}`)}>
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-[#7a95b8] hover:text-[#3b82f6] hover:bg-[#12233e] rounded transition-colors" onClick={() => toast.info(`Editing ${item.id}`)}>
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderAuditTable = () => (
    <div className="overflow-x-auto rounded-xl border border-[#12233e] bg-[#060d19]">
      <table className="w-full text-left text-sm text-[#c8d8ec]">
        <thead className="bg-[#0d1a2e] text-xs uppercase text-[#7a95b8] border-b border-[#12233e]">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Action</th>
            <th className="px-4 py-3">User</th>
            <th className="px-4 py-3">IP Address</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({length: 5}).map((_, i) => (
            <tr key={i} className="border-b border-[#12233e] hover:bg-[#0d1a2e]/50">
              <td className="px-4 py-3">{new Date(Date.now() - i * 3600000).toLocaleString()}</td>
              <td className="px-4 py-3">Updated Compliance Item C-{1000+i}</td>
              <td className="px-4 py-3">Admin User</td>
              <td className="px-4 py-3">192.168.1.{100+i}</td>
              <td className="px-4 py-3"><span className="rc-badge rc-badge-green">Success</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderTeamTable = () => (
    <div className="overflow-x-auto rounded-xl border border-[#12233e] bg-[#060d19]">
      <table className="w-full text-left text-sm text-[#c8d8ec]">
        <thead className="bg-[#0d1a2e] text-xs uppercase text-[#7a95b8] border-b border-[#12233e]">
          <tr>
            <th className="px-4 py-3">Member</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Assigned Items</th>
            <th className="px-4 py-3">Completion Rate</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({length: 5}).map((_, i) => (
            <tr key={i} className="border-b border-[#12233e] hover:bg-[#0d1a2e]/50">
              <td className="px-4 py-3 font-medium text-white">Team Member {i+1}</td>
              <td className="px-4 py-3">Compliance Officer</td>
              <td className="px-4 py-3">{10 + i * 2}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-[#12233e] rounded-full overflow-hidden">
                    <div className="h-full bg-[#22c55e]" style={{width: `${80 + i * 4}%`}}></div>
                  </div>
                  <span className="text-xs">{80 + i * 4}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderDeptTable = () => (
    <div className="overflow-x-auto rounded-xl border border-[#12233e] bg-[#060d19]">
      <table className="w-full text-left text-sm text-[#c8d8ec]">
        <thead className="bg-[#0d1a2e] text-xs uppercase text-[#7a95b8] border-b border-[#12233e]">
          <tr>
            <th className="px-4 py-3">Department</th>
            <th className="px-4 py-3">Total Items</th>
            <th className="px-4 py-3">Compliant</th>
            <th className="px-4 py-3">Violations</th>
            <th className="px-4 py-3">Score</th>
          </tr>
        </thead>
        <tbody>
          {departments.filter((d) => d !== "All").map((dept, i) => {
            const deptItems = COMPLIANCE_ITEMS.filter((item) => item.department === dept);
            const comp = deptItems.filter((item) => item.status === 'compliant').length;
            const viol = deptItems.filter((item) => item.status === 'violation').length;
            const score = Math.round((comp / Math.max(deptItems.length, 1)) * 100);
            return (
              <tr key={dept} className="border-b border-[#12233e] hover:bg-[#0d1a2e]/50">
                <td className="px-4 py-3 font-medium text-white">{dept}</td>
                <td className="px-4 py-3">{deptItems.length}</td>
                <td className="px-4 py-3 text-[#22c55e]">{comp}</td>
                <td className="px-4 py-3 text-[#ef4444]">{viol}</td>
                <td className="px-4 py-3">
                  <span className={`rc-badge ${score > 80 ? 'rc-badge-green' : score > 60 ? 'rc-badge-gold' : 'rc-badge-red'}`}>
                    {score}%
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderRegulationsTable = () => (
    <div className="overflow-x-auto rounded-xl border border-[#12233e] bg-[#060d19]">
      <table className="w-full text-left text-sm text-[#c8d8ec]">
        <thead className="bg-[#0d1a2e] text-xs uppercase text-[#7a95b8] border-b border-[#12233e]">
          <tr>
            <th className="px-4 py-3">Regulation ID</th>
            <th className="px-4 py-3">Authority</th>
            <th className="px-4 py-3">Last Updated</th>
            <th className="px-4 py-3">Impact Level</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({length: 5}).map((_, i) => (
            <tr key={i} className="border-b border-[#12233e] hover:bg-[#0d1a2e]/50">
              <td className="px-4 py-3 font-medium text-white">SEC Rule 20{i}-{i%3}</td>
              <td className="px-4 py-3">SEC</td>
              <td className="px-4 py-3">2025-10-{10+i}</td>
              <td className="px-4 py-3"><span className="rc-badge rc-badge-red">High</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderRisksTable = () => (
    <div className="overflow-x-auto rounded-xl border border-[#12233e] bg-[#060d19]">
      <table className="w-full text-left text-sm text-[#c8d8ec]">
        <thead className="bg-[#0d1a2e] text-xs uppercase text-[#7a95b8] border-b border-[#12233e]">
          <tr>
            <th className="px-4 py-3">Risk Area</th>
            <th className="px-4 py-3">Probability</th>
            <th className="px-4 py-3">Impact</th>
            <th className="px-4 py-3">Risk Score</th>
            <th className="px-4 py-3">Trend</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({length: 5}).map((_, i) => {
            const score = Math.floor(Math.random() * 100);
            return (
              <tr key={i} className="border-b border-[#12233e] hover:bg-[#0d1a2e]/50">
                <td className="px-4 py-3 font-medium text-white">Risk Category {i+1}</td>
                <td className="px-4 py-3">{Math.floor(Math.random() * 100)}%</td>
                <td className="px-4 py-3">{Math.floor(Math.random() * 100)}%</td>
                <td className="px-4 py-3">
                  <span className={`rc-badge ${score > 70 ? 'rc-badge-red' : score > 40 ? 'rc-badge-gold' : 'rc-badge-green'}`}>
                    {score}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {i % 2 === 0 ? <ArrowUpRight className="w-4 h-4 text-red-500" /> : <ArrowDownRight className="w-4 h-4 text-emerald-500" />}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <AppShell>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="rc-page-header flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#0d1a2e] border border-[#12233e] rounded-xl">
                <Shield className="w-6 h-6 text-[#22c55e]" />
              </div>
              <div>
                <h1 className="rc-page-title text-white text-2xl font-bold">Compliance Monitoring Dashboard</h1>
                <p className="rc-page-subtitle text-[#7a95b8] mt-1">Real-time regulatory compliance tracking across SEC, FINRA, and state requirements.</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button 
              onClick={handleRefresh} 
              className="rc-btn rc-btn-ghost flex items-center gap-2"
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button onClick={handleExportCSV} className="rc-btn rc-btn-ghost flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <ExportToSlides
              toolName="Compliance Monitoring Dashboard"
              getSections={() => [
                {
                  title: "Compliance Overview",
                  items: [
                    { label: "Compliance Score", value: `${complianceScore}%` },
                    { label: "Total Items", value: totalItems.toString() },
                    { label: "Compliant", value: compliantCount.toString() },
                    { label: "Warnings", value: warningCount.toString() },
                    { label: "Pending", value: pendingCount.toString() },
                    { label: "Violations", value: violationCount.toString() }
                  ]
                },
                ...COMPLIANCE_ITEMS.slice(0, 10).map((item) => ({
                  title: item.title,
                  items: [
                    { label: "Category", value: item.category },
                    { label: "Status", value: item.status },
                    { label: "Due Date", value: item.dueDate },
                    { label: "Regulation", value: item.regulation },
                    { label: "Priority", value: item.priority },
                    { label: "Action Required", value: item.actionRequired }
                  ]
                }))
              ]}
            />
          </div>
        </div>

        {/* Interactive Controls Row */}
        <div className="flex flex-wrap gap-4 items-center bg-[#0d1a2e] p-4 rounded-xl border border-[#12233e]">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#7a95b8]">Target Score:</span>
            <input 
              type="number" 
              value={numberInputVal}
              onChange={(e) => setNumberInputVal(Number(e.target.value))}
              className="rc-input w-24 h-8 text-sm"
              min={0} max={100}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#7a95b8]">Time Range:</span>
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="rc-input h-8 text-sm py-0"
            >
              <option value="1m">Last Month</option>
              <option value="3m">Last 3 Months</option>
              <option value="6m">Last 6 Months</option>
              <option value="1y">Last Year</option>
            </select>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button className="rc-btn rc-btn-primary h-8 text-sm py-0 flex items-center gap-1" onClick={() => toast.success("New policy created")}>
              <Plus className="w-4 h-4" /> Add Policy
            </button>
            <button className="rc-btn rc-btn-ghost h-8 w-8 p-0 flex items-center justify-center" onClick={() => toast.info("Settings opened")}>
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Score Banner */}
        <div className="rc-card bg-gradient-to-r from-[#0a1628] to-[#0d1f3c] border-[#22c55e]/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Shield className="w-32 h-32 text-white" />
          </div>
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="text-center md:text-left">
              <div className={`text-6xl font-black tracking-tight ${complianceScore >= 80 ? "text-[#22c55e]" : complianceScore >= 60 ? "text-[#f0c040]" : "text-red-400"}`}>
                {complianceScore}%
              </div>
              <div className="text-sm text-[#7a95b8] mt-2 font-medium uppercase tracking-wider">Overall Compliance Score</div>
            </div>
            <div className="flex-1 w-full">
              <div className="flex justify-between text-xs text-[#7a95b8] mb-1">
                <span>0%</span>
                <span>Target: {numberInputVal}%</span>
                <span>100%</span>
              </div>
              <div className="h-4 bg-[#060d19] rounded-full overflow-hidden border border-[#12233e] mb-4 relative">
                <div 
                  className={`h-full transition-all duration-1000 ease-out ${complianceScore >= 80 ? "bg-[#22c55e]" : complianceScore >= 60 ? "bg-[#f0c040]" : "bg-red-500"}`}
                  style={{ width: `${complianceScore}%` }}
                />
                <div className="absolute top-0 bottom-0 w-1 bg-white z-10" style={{ left: `${numberInputVal}%` }}></div>
              </div>
              <div className="flex gap-4 text-sm flex-wrap">
                <button onClick={() => {setFilterStatus("compliant"); setActiveTab("overview");}} className="flex items-center gap-2 bg-[#060d19]/50 px-3 py-1.5 rounded-lg border border-[#12233e] hover:border-[#22c55e] transition-colors cursor-pointer">
                  <CheckCircle2 className="w-4 h-4 text-[#22c55e]" /> 
                  <span className="text-white font-medium">{compliantCount}</span>
                  <span className="text-[#7a95b8]">compliant</span>
                </button>
                <button onClick={() => {setFilterStatus("warning"); setActiveTab("overview");}} className="flex items-center gap-2 bg-[#060d19]/50 px-3 py-1.5 rounded-lg border border-[#12233e] hover:border-[#f0c040] transition-colors cursor-pointer">
                  <AlertTriangle className="w-4 h-4 text-[#f0c040]" /> 
                  <span className="text-white font-medium">{warningCount}</span>
                  <span className="text-[#7a95b8]">warnings</span>
                </button>
                <button onClick={() => {setFilterStatus("pending"); setActiveTab("overview");}} className="flex items-center gap-2 bg-[#060d19]/50 px-3 py-1.5 rounded-lg border border-[#12233e] hover:border-blue-400 transition-colors cursor-pointer">
                  <Clock className="w-4 h-4 text-blue-400" /> 
                  <span className="text-white font-medium">{pendingCount}</span>
                  <span className="text-[#7a95b8]">pending</span>
                </button>
                <button onClick={() => {setFilterStatus("violation"); setActiveTab("overview");}} className="flex items-center gap-2 bg-[#060d19]/50 px-3 py-1.5 rounded-lg border border-[#12233e] hover:border-red-400 transition-colors cursor-pointer">
                  <XCircle className="w-4 h-4 text-red-400" /> 
                  <span className="text-white font-medium">{violationCount}</span>
                  <span className="text-[#7a95b8]">violations</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <div className="space-y-6">
          <div className="flex border-b border-[#12233e] overflow-x-auto no-scrollbar">
            {[
              { id: "overview", label: "Item Tracker", icon: FileText },
              { id: "charts", label: "Analytics & Charts", icon: BarChart3 },
              { id: "tables", label: "Data Tables", icon: Database },
              { id: "calendar", label: "Calendar", icon: Calendar },
              { id: "settings", label: "Settings", icon: Settings }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id 
                    ? "border-[#22c55e] text-[#22c55e] bg-[#22c55e]/5" 
                    : "border-transparent text-[#7a95b8] hover:text-white hover:bg-[#0d1a2e]"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-[#0d1a2e] p-4 rounded-xl border border-[#12233e]">
                <div className="flex gap-2 flex-wrap">
                  {["all", "compliant", "warning", "pending", "violation"].map((s) => (
                    <button 
                      key={s} 
                      onClick={() => setFilterStatus(s)} 
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        filterStatus === s 
                          ? "bg-[#22c55e] text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]" 
                          : "bg-[#060d19] text-[#7a95b8] border border-[#12233e] hover:border-[#22c55e]/50 hover:text-white"
                      }`}
                    >
                      {s === "all" ? "All Items" : s.charAt(0).toUpperCase() + s.slice(1)} 
                      <span className="ml-2 opacity-70">
                        ({s === "all" ? COMPLIANCE_ITEMS.length : COMPLIANCE_ITEMS.filter((i) => i.status === s).length})
                      </span>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3 w-full lg:w-auto">
                  <div className="relative w-full lg:w-48">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a95b8]" />
                    <select 
                      value={selectedDept}
                      onChange={(e) => setSelectedDept(e.target.value)}
                      className="rc-input pl-9 w-full appearance-none"
                    >
                      {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="relative w-full lg:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a95b8]" />
                    <input 
                      type="text" 
                      placeholder="Search items..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="rc-input pl-9 w-full"
                    />
                  </div>
                  <div className="flex bg-[#060d19] border border-[#12233e] rounded-lg overflow-hidden">
                    <button 
                      onClick={() => setViewMode('list')}
                      className={`p-2 ${viewMode === 'list' ? 'bg-[#12233e] text-white' : 'text-[#7a95b8] hover:bg-[#0d1a2e]'}`}
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setViewMode('grid')}
                      className={`p-2 ${viewMode === 'grid' ? 'bg-[#12233e] text-white' : 'text-[#7a95b8] hover:bg-[#0d1a2e]'}`}
                    >
                      <Database className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {filtered.length === 0 ? (
                <div className="rc-card flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 bg-[#060d19] rounded-full flex items-center justify-center mb-4 border border-[#12233e]">
                    <Search className="w-8 h-8 text-[#7a95b8]" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-1">No items found</h3>
                  <p className="text-[#7a95b8]">Try adjusting your search or filters to find what you're looking for.</p>
                  <button 
                    onClick={() => { setFilterStatus("all"); setSearchQuery(""); setSelectedDept("All"); }}
                    className="mt-4 rc-btn rc-btn-ghost"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : viewMode === 'list' ? (
                <div className="grid grid-cols-1 gap-4">
                  {filtered.slice(0, 20).map((item) => {
                    const style = STATUS_STYLES[item.status];
                    const Icon = style.icon;
                    const isExpanded = expandedItem === item.id;
                    return (
                      <div key={item.id} className={`rc-card ${style.border} transition-all hover:shadow-lg ${isExpanded ? 'ring-1 ring-[#22c55e]/50' : ''}`}>
                        <div className="flex flex-col md:flex-row items-start gap-5">
                          <div className={`p-3 rounded-xl ${style.bg} flex-shrink-0 border ${style.border}`}>
                            <Icon className={`w-6 h-6 ${style.text}`} />
                          </div>
                          <div className="flex-1 space-y-3 w-full">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                              <div className="flex items-center gap-3 flex-wrap">
                                <h3 className="text-lg font-semibold text-white cursor-pointer hover:text-[#22c55e] transition-colors" onClick={() => setExpandedItem(isExpanded ? null : item.id)}>
                                  {item.title}
                                </h3>
                                <div className={`rc-badge ${style.badge}`}>{style.label}</div>
                                <div className="rc-badge bg-[#060d19] text-[#c8d8ec] border-[#12233e]">{item.category}</div>
                                <div className={`rc-badge ${item.priority === "high" ? "rc-badge-red" : item.priority === "medium" ? "rc-badge-gold" : "rc-badge-blue"}`}>
                                  {item.priority} priority
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button className="p-1.5 text-[#7a95b8] hover:text-white hover:bg-[#12233e] rounded-md transition-colors" onClick={() => toast.info(`Flagged ${item.id}`)}>
                                  <Flag className="w-4 h-4" />
                                </button>
                                <button className="p-1.5 text-[#7a95b8] hover:text-white hover:bg-[#12233e] rounded-md transition-colors" onClick={() => toast.info(`Bookmarked ${item.id}`)}>
                                  <Bookmark className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                                  className="p-1.5 text-[#7a95b8] hover:text-white hover:bg-[#12233e] rounded-md transition-colors"
                                >
                                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                            
                            <p className="text-[#c8d8ec] leading-relaxed">{item.description}</p>
                            
                            {isExpanded && (
                              <div className="animate-in slide-in-from-top-2 duration-200 mt-4 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#060d19] rounded-xl p-4 border border-[#12233e]">
                                  <div>
                                    <div className="text-xs text-[#7a95b8] mb-1 uppercase tracking-wider font-medium">Regulation</div>
                                    <div className="text-sm text-white font-medium">{item.regulation}</div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-[#7a95b8] mb-1 uppercase tracking-wider font-medium">Due Date</div>
                                    <div className="text-sm text-white font-medium">{item.dueDate}</div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-[#7a95b8] mb-1 uppercase tracking-wider font-medium">Last Checked</div>
                                    <div className="text-sm text-white font-medium">{item.lastChecked}</div>
                                  </div>
                                  <div>
                                    <div className="text-xs text-[#7a95b8] mb-1 uppercase tracking-wider font-medium">Assignee</div>
                                    <div className="text-sm text-white font-medium">{item.assignee}</div>
                                  </div>
                                </div>
                                
                                <div className="bg-[#060d19]/50 rounded-xl p-4 border border-[#12233e] relative overflow-hidden group">
                                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#22c55e]"></div>
                                  <div className="text-sm font-semibold text-[#22c55e] mb-1.5 flex items-center gap-1.5">
                                    <Zap className="w-4 h-4" /> Action Required
                                  </div>
                                  <p className="text-sm text-[#c8d8ec] ml-5">{item.actionRequired}</p>
                                  <div className="mt-3 ml-5 flex gap-2">
                                    <button className="rc-btn rc-btn-primary text-xs py-1 px-3" onClick={() => toast.success("Marked as resolved")}>Mark Resolved</button>
                                    <button className="rc-btn rc-btn-ghost text-xs py-1 px-3" onClick={() => toast.info("Reassigned")}>Reassign</button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {filtered.length > 20 && (
                    <div className="text-center py-4">
                      <button className="rc-btn rc-btn-ghost" onClick={() => toast.info("Loading more items...")}>Load More Items</button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filtered.slice(0, 18).map((item) => {
                    const style = STATUS_STYLES[item.status];
                    const Icon = style.icon;
                    return (
                      <div key={item.id} className={`rc-card flex flex-col h-full ${style.border} hover:shadow-lg transition-all`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className={`p-2 rounded-lg ${style.bg} border ${style.border}`}>
                            <Icon className={`w-5 h-5 ${style.text}`} />
                          </div>
                          <div className={`rc-badge ${style.badge}`}>{style.label}</div>
                        </div>
                        <h3 className="text-base font-semibold text-white mb-2 line-clamp-2">{item.title}</h3>
                        <p className="text-sm text-[#7a95b8] mb-4 line-clamp-2 flex-grow">{item.description}</p>
                        <div className="mt-auto pt-4 border-t border-[#12233e] flex items-center justify-between text-xs text-[#7a95b8]">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {item.dueDate}</span>
                          <span className="flex items-center gap-1"><Users className="w-3 h-3"/> {item.department}</span>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button className="flex-1 rc-btn rc-btn-ghost text-xs py-1.5" onClick={() => toast.info(`Viewing ${item.id}`)}>View</button>
                          <button className="flex-1 rc-btn rc-btn-primary text-xs py-1.5" onClick={() => toast.success(`Action taken on ${item.id}`)}>Action</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Charts Tab (5+ Recharts) */}
          {activeTab === "charts" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart 1: PieChart */}
                <div className="rc-card">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-white">Status Distribution</h3>
                    <button className="p-1 text-[#7a95b8] hover:text-white transition-colors"><MoreHorizontal className="w-4 h-4"/></button>
                  </div>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={pieData} 
                          dataKey="value" 
                          nameKey="name" 
                          cx="50%" 
                          cy="50%" 
                          innerRadius={80}
                          outerRadius={110} 
                          paddingAngle={5}
                          label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} stroke="rgba(0,0,0,0)" />)}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ background: "#0d1a2e", border: "1px solid #12233e", borderRadius: "8px", color: "#fff" }} 
                          itemStyle={{ color: "#fff" }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Chart 2: BarChart */}
                <div className="rc-card">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-white">Items by Category</h3>
                    <button className="p-1 text-[#7a95b8] hover:text-white transition-colors"><MoreHorizontal className="w-4 h-4"/></button>
                  </div>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryData.slice(0, 6)} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: "#7a95b8", fontSize: 11 }} axisLine={{ stroke: '#12233e' }} tickLine={false} />
                        <YAxis tick={{ fill: "#7a95b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ background: "#0d1a2e", border: "1px solid #12233e", borderRadius: "8px", color: "#fff" }}
                          cursor={{ fill: '#12233e', opacity: 0.4 }}
                        />
                        <Bar dataKey="compliant" stackId="a" fill="#22c55e" name="Compliant" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="warning" stackId="a" fill="#f0c040" name="Warning" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="pending" stackId="a" fill="#3b82f6" name="Pending" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="violation" stackId="a" fill="#ef4444" name="Violation" radius={[4, 4, 0, 0]} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 3: LineChart */}
                <div className="rc-card">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-white">Compliance Trend (12 Months)</h3>
                    <button className="p-1 text-[#7a95b8] hover:text-white transition-colors"><MoreHorizontal className="w-4 h-4"/></button>
                  </div>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                        <XAxis dataKey="month" tick={{ fill: "#7a95b8", fontSize: 11 }} axisLine={{ stroke: '#12233e' }} tickLine={false} />
                        <YAxis yAxisId="left" tick={{ fill: "#7a95b8", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fill: "#7a95b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ background: "#0d1a2e", border: "1px solid #12233e", borderRadius: "8px", color: "#fff" }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                        <Line yAxisId="left" type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={3} dot={{ r: 4, fill: "#22c55e", strokeWidth: 0 }} activeDot={{ r: 6 }} name="Score %" />
                        <Line yAxisId="right" type="monotone" dataKey="violations" stroke="#ef4444" strokeWidth={2} dot={false} name="Violations" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 4: AreaChart */}
                <div className="rc-card">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-white">Daily Automated Checks (30 Days)</h3>
                    <button className="p-1 text-[#7a95b8] hover:text-white transition-colors"><MoreHorizontal className="w-4 h-4"/></button>
                  </div>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={areaData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorChecks" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorPassed" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                        <XAxis dataKey="day" tick={{ fill: "#7a95b8", fontSize: 11 }} axisLine={{ stroke: '#12233e' }} tickLine={false} />
                        <YAxis tick={{ fill: "#7a95b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: "#0d1a2e", border: "1px solid #12233e", borderRadius: "8px", color: "#fff" }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                        <Area type="monotone" dataKey="checks" stroke="#3b82f6" fillOpacity={1} fill="url(#colorChecks)" name="Total Checks" />
                        <Area type="monotone" dataKey="passed" stroke="#22c55e" fillOpacity={1} fill="url(#colorPassed)" name="Passed Checks" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 5: RadarChart */}
                <div className="rc-card">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-white">Risk Profile by Category</h3>
                    <button className="p-1 text-[#7a95b8] hover:text-white transition-colors"><MoreHorizontal className="w-4 h-4"/></button>
                  </div>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                        <PolarGrid stroke="#12233e" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: "#7a95b8", fontSize: 11 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 150]} tick={{ fill: "#7a95b8", fontSize: 10 }} />
                        <Radar name="Current Risk" dataKey="A" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                        <Radar name="Industry Avg" dataKey="B" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                        <Tooltip contentStyle={{ background: "#0d1a2e", border: "1px solid #12233e", borderRadius: "8px", color: "#fff" }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 6: ComposedChart */}
                <div className="rc-card">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold text-white">Department Performance Metrics</h3>
                    <button className="p-1 text-[#7a95b8] hover:text-white transition-colors"><MoreHorizontal className="w-4 h-4"/></button>
                  </div>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={composedData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid stroke="#12233e" strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: "#7a95b8", fontSize: 11 }} axisLine={{ stroke: '#12233e' }} tickLine={false} />
                        <YAxis tick={{ fill: "#7a95b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: "#0d1a2e", border: "1px solid #12233e", borderRadius: "8px", color: "#fff" }} />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                        <Bar dataKey="pv" barSize={20} fill="#3b82f6" name="Items Processed" radius={[4, 4, 0, 0]} />
                        <Line type="monotone" dataKey="uv" stroke="#f0c040" strokeWidth={2} name="Target Metric" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tables Tab (6+ Data Tables) */}
          {activeTab === "tables" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Table 1 */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2"><FileText className="w-5 h-5 text-[#3b82f6]"/> Detailed Compliance Items</h3>
                  <button className="rc-btn rc-btn-ghost text-xs" onClick={() => toast.info("Viewing all items")}>View All</button>
                </div>
                {renderItemsTable()}
              </div>

              {/* Table 2 */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Activity className="w-5 h-5 text-[#22c55e]"/> System Audit Log</h3>
                  <button className="rc-btn rc-btn-ghost text-xs" onClick={() => toast.info("Exporting audit log")}>Export Log</button>
                </div>
                {renderAuditTable()}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Table 3 */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Users className="w-5 h-5 text-[#a855f7]"/> Team Performance</h3>
                  </div>
                  {renderTeamTable()}
                </div>

                {/* Table 4 */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Server className="w-5 h-5 text-[#f97316]"/> Department Overview</h3>
                  </div>
                  {renderDeptTable()}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Table 5 */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Globe className="w-5 h-5 text-[#14b8a6]"/> Regulatory Frameworks</h3>
                  </div>
                  {renderRegulationsTable()}
                </div>

                {/* Table 6 */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-[#ef4444]"/> Risk Assessment Matrix</h3>
                  </div>
                  {renderRisksTable()}
                </div>
              </div>
            </div>
          )}

          {/* Calendar Tab */}
          {activeTab === "calendar" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
              <div className="lg:col-span-2 rc-card">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#060d19] rounded-lg border border-[#12233e]">
                      <Calendar className="w-5 h-5 text-[#22c55e]" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Upcoming Deadlines</h3>
                  </div>
                  <div className="flex gap-2">
                    <button className="rc-btn rc-btn-ghost p-2" onClick={() => toast.info("Previous month")}><ChevronDown className="w-4 h-4 rotate-90" /></button>
                    <button className="rc-btn rc-btn-ghost p-2" onClick={() => toast.info("Next month")}><ChevronDown className="w-4 h-4 -rotate-90" /></button>
                  </div>
                </div>
                <div className="space-y-4">
                  {COMPLIANCE_ITEMS.filter((i) => i.dueDate !== "Ongoing")
                    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                    .slice(0, 15)
                    .map((item) => {
                      const style = STATUS_STYLES[item.status];
                      const date = new Date(item.dueDate);
                      const isPast = date < new Date();
                      
                      return (
                        <div key={item.id} className="flex items-center gap-5 p-4 bg-[#060d19] rounded-xl border border-[#12233e] transition-colors hover:border-[#22c55e]/30 group">
                          <div className={`flex flex-col items-center justify-center min-w-[70px] h-[70px] rounded-lg border ${isPast ? 'bg-red-500/10 border-red-500/30' : 'bg-[#0d1a2e] border-[#12233e]'}`}>
                            <div className={`text-sm font-medium uppercase ${isPast ? 'text-red-400' : 'text-[#7a95b8]'}`}>
                              {date.toLocaleDateString("en-US", { month: "short" })}
                            </div>
                            <div className={`text-2xl font-bold ${isPast ? 'text-red-500' : 'text-white'}`}>
                              {date.getDate()}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-white text-base group-hover:text-[#22c55e] transition-colors truncate cursor-pointer" onClick={() => toast.info(`Viewing ${item.title}`)}>{item.title}</h4>
                            <div className="flex items-center gap-2 mt-1 text-sm text-[#7a95b8] truncate">
                              <span>{item.regulation}</span>
                              <span>•</span>
                              <span>{item.category}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1"><Users className="w-3 h-3"/> {item.assignee}</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            <div className={`rc-badge ${style.badge} hidden sm:flex`}>{style.label}</div>
                            <button className="text-xs text-[#3b82f6] hover:underline" onClick={() => toast.success("Reminder set")}>Set Reminder</button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="rc-card">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#22c55e]" /> Compliance Overview
                  </h3>
                  <p className="text-[#c8d8ec] text-sm leading-relaxed">
                    The Compliance Monitoring Dashboard tracks <strong className="text-white">{COMPLIANCE_ITEMS.length}</strong> regulatory requirements across SEC, FINRA, state, and industry standards.
                  </p>
                  <div className="my-4 h-[1px] bg-[#12233e]" />
                  <p className="text-[#c8d8ec] text-sm leading-relaxed mb-4">
                    Maintaining a high compliance score is essential for protecting the firm, its clients, and its reputation. Regular monitoring and proactive remediation of compliance items reduces regulatory risk and demonstrates a culture of compliance to examiners.
                  </p>
                  <button className="w-full rc-btn rc-btn-primary" onClick={() => toast.info("Generating full report...")}>Generate Full Report</button>
                </div>
                
                <div className="rc-card bg-[#060d19] border-[#12233e]">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-white text-sm uppercase tracking-wider text-[#7a95b8]">Ongoing Requirements</h3>
                    <span className="rc-badge rc-badge-blue">{COMPLIANCE_ITEMS.filter((i) => i.dueDate === "Ongoing").length} Active</span>
                  </div>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {COMPLIANCE_ITEMS.filter((i) => i.dueDate === "Ongoing").map((item) => (
                      <div key={item.id} className="flex items-start gap-3 p-2 hover:bg-[#0d1a2e] rounded-lg transition-colors cursor-pointer" onClick={() => toast.info(`Viewing ${item.title}`)}>
                        <CheckCircle2 className="w-4 h-4 text-[#22c55e] mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-white line-clamp-1">{item.title}</div>
                          <div className="text-xs text-[#7a95b8]">{item.category}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="animate-in fade-in duration-300 space-y-6">
              <div className="rc-card">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2"><Settings className="w-5 h-5 text-[#3b82f6]"/> Dashboard Configuration</h3>
                <div className="space-y-6 max-w-2xl">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Alert Threshold (Score)</label>
                    <input type="range" min="0" max="100" defaultValue="80" className="w-full accent-[#22c55e]" onChange={(e) => toast.info(`Threshold set to ${e.target.value}%`)} />
                    <div className="flex justify-between text-xs text-[#7a95b8]"><span>0</span><span>100</span></div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Default View Mode</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-[#c8d8ec] cursor-pointer"><input type="radio" name="view" defaultChecked className="accent-[#22c55e]" /> List View</label>
                      <label className="flex items-center gap-2 text-[#c8d8ec] cursor-pointer"><input type="radio" name="view" className="accent-[#22c55e]" /> Grid View</label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Notification Preferences</label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-[#c8d8ec] cursor-pointer"><input type="checkbox" defaultChecked className="accent-[#22c55e] rounded" /> Email alerts for critical violations</label>
                      <label className="flex items-center gap-2 text-[#c8d8ec] cursor-pointer"><input type="checkbox" defaultChecked className="accent-[#22c55e] rounded" /> Daily summary report</label>
                      <label className="flex items-center gap-2 text-[#c8d8ec] cursor-pointer"><input type="checkbox" className="accent-[#22c55e] rounded" /> Slack integration notifications</label>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-[#12233e] flex gap-3">
                    <button className="rc-btn rc-btn-primary" onClick={() => toast.success("Settings saved")}>Save Configuration</button>
                    <button className="rc-btn rc-btn-ghost" onClick={() => toast.info("Settings reset")}>Reset to Defaults</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <PageInsights pageId="compliance-monitoring-dashboard" />
    </AppShell>
  );
}
