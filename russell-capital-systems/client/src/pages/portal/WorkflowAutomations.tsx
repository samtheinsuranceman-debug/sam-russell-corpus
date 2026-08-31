// @ts-nocheck
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Zap,
  Plus,
  Play,
  Clock,
  Mail,
  Calendar,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Settings,
  ArrowRight,
  Trash2,
  Edit,
  Copy,
  BarChart3,
  PieChartIcon,
  Search,
  Filter,
  Download,
  Activity,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp,
  Target,
  Smartphone,
  Briefcase,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart
} from "recharts";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  triggerDetail: string;
  action: string;
  actionDetail: string;
  enabled: boolean;
  lastTriggered: string | null;
  triggerCount: number;
  category: string;
  roiEstimate: number;
  complexity: string;
  createdAt: string;
  author: string;
}

const PRESET_RULES: AutomationRule[] = [{
    id: "age_59_5", name: "Penalty-Free Withdrawal Alert", trigger: "client_age_reaches", triggerDetail: "59.5",
    action: "notify_advisor", actionDetail: "Alert: Client eligible for penalty-free IRA withdrawals",
    enabled: true, lastTriggered: null, triggerCount: 0, category: "Milestone", roiEstimate: 500, complexity: "Low", createdAt: "2026-01-15", author: "System"
  },
,
  {
    id: "age_62", name: "Social Security Eligibility", trigger: "client_age_reaches", triggerDetail: "62",
    action: "create_task", actionDetail: "Schedule Social Security optimization review meeting",
    enabled: true, lastTriggered: null, triggerCount: 0, category: "Milestone", roiEstimate: 1200, complexity: "Medium", createdAt: "2026-01-15", author: "System"
  },
,
  {
    id: "age_65", name: "Medicare Enrollment Reminder", trigger: "client_age_reaches", triggerDetail: "65",
    action: "send_email", actionDetail: "Send Medicare enrollment guide and IRMAA planning checklist",
    enabled: true, lastTriggered: null, triggerCount: 0, category: "Milestone", roiEstimate: 300, complexity: "Low", createdAt: "2026-01-15", author: "System"
  },
,
  {
    id: "age_73", name: "RMD Requirement Alert", trigger: "client_age_reaches", triggerDetail: "73",
    action: "notify_advisor", actionDetail: "Client must begin Required Minimum Distributions",
    enabled: true, lastTriggered: null, triggerCount: 0, category: "Compliance", roiEstimate: 0, complexity: "High", createdAt: "2026-01-15", author: "System"
  },
,
  {
    id: "no_contact_30", name: "Stale Relationship Follow-Up", trigger: "no_contact_days", triggerDetail: "30",
    action: "create_task", actionDetail: "Create follow-up task: No contact in 30 days",
    enabled: true, lastTriggered: "2026-03-15", triggerCount: 12, category: "Engagement", roiEstimate: 2000, complexity: "Low", createdAt: "2026-01-15", author: "System"
  }
];

const TRIGGER_TYPES = [{ value: "client_age_reaches", label: "Client Reaches Age", icon: Calendar },
,
  { value: "no_contact_days", label: "No Contact For X Days", icon: Clock },
,
  { value: "deal_status_change", label: "Deal Status Changes", icon: TrendingUp },
,
  { value: "client_birthday", label: "Client Birthday", icon: Users },
,
  { value: "policy_anniversary", label: "Policy Anniversary", icon: Calendar }
];

const ACTION_TYPES = [
  { value: "notify_advisor", label: "Notify Advisor (Dashboard Alert)" },
  { value: "send_email", label: "Send Email to Client" },
  { value: "create_task", label: "Create Follow-Up Task" },
  { value: "schedule_meeting", label: "Suggest Meeting" },
  { value: "update_crm", label: "Update CRM Record" },
  { value: "trigger_webhook", label: "Trigger External Webhook" },
  { value: "generate_report", label: "Generate Portfolio Report" },
];

const CHART_COLORS = ['#22c55e', '#f0c040', '#3b82f6', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316', '#64748b'];

export default function WorkflowAutomations() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTrigger, setNewTrigger] = useState("");
  const [newTriggerDetail, setNewTriggerDetail] = useState("");
  const [newAction, setNewAction] = useState("");
  const [newActionDetail, setNewActionDetail] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("rules");
  const [sortField, setSortField] = useState<keyof AutomationRule>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedRules, setSelectedRules] = useState<string[]>([]);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState("");
  const [expandedRule, setExpandedRule] = useState<string | null>(null);

  const { data: clientsData } = trpc.clients.list.useQuery();
  const { data: activityData } = trpc.activity.getRecent.useQuery();
  const { data: teamData } = trpc.team.members.useQuery();
  const { data: dashboardData } = trpc.dashboard.getMetrics.useQuery();
  const { data: reportsData } = trpc.reports.getAutomationStats.useQuery();

  useEffect(() => {
    const timer = setTimeout(() => {
      setRules(PRESET_RULES);
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const categories = useMemo(() => Array.from(new Set(rules.map((r) => r.category))), [rules]);
  
  const filteredAndSorted = useMemo(() => {
    let result = rules.filter((r) => {
      const matchesCategory = filterCategory === "all" || r.category === filterCategory;
      const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            r.actionDetail.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (aVal === null) return sortDirection === "asc" ? 1 : -1;
      if (bVal === null) return sortDirection === "asc" ? -1 : 1;
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [rules, filterCategory, searchQuery, sortField, sortDirection]);

  const enabledCount = rules.filter((r) => r.enabled).length;
  const totalTriggers = rules.reduce((s, r) => s + r.triggerCount, 0);
  const totalROI = rules.reduce((s, r) => s + r.roiEstimate, 0);

  const categoryData = useMemo(() => {
    const data: Record<string, number> = {};
    rules.forEach((rule) => {
      data[rule.category] = (data[rule.category] || 0) + 1;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [rules]);

  const triggerStatsData = useMemo(() => {
    return rules
      .filter((r) => r.triggerCount > 0)
      .sort((a, b) => b.triggerCount - a.triggerCount)
      .slice(0, 5)
      .map((r) => ({ name: r.name, triggers: r.triggerCount, roi: r.roiEstimate }));
  }, [rules]);

  const trendData = useMemo(() => {
    return [
      { month: 'Jan', triggers: 120, conversions: 15 },
      { month: 'Feb', triggers: 150, conversions: 20 },
      { month: 'Mar', triggers: 180, conversions: 25 },
      { month: 'Apr', triggers: 220, conversions: 35 },
      { month: 'May', triggers: 260, conversions: 45 },
      { month: 'Jun', triggers: 310, conversions: 60 },
    ];
  }, []);

  const radarData = useMemo(() => {
    return [
      { subject: 'Engagement', A: 120, B: 110, fullMark: 150 },
      { subject: 'Sales', A: 98, B: 130, fullMark: 150 },
      { subject: 'Service', A: 86, B: 130, fullMark: 150 },
      { subject: 'Compliance', A: 99, B: 100, fullMark: 150 },
      { subject: 'Milestone', A: 85, B: 90, fullMark: 150 },
      { subject: 'Market', A: 65, B: 85, fullMark: 150 },
    ];
  }, []);

  const toggleRule = useCallback((id: string) => {
    setRules(prev => prev.map((r) => r.id === id ? { ...r, enabled: !r.enabled } : r));
    const rule = rules.find((r) => r.id === id);
    toast.success(`${rule?.name} ${rule?.enabled ? "disabled" : "enabled"}`);
  }, [rules]);

  const deleteRule = useCallback((id: string) => {
    setRules(prev => prev.filter((r) => r.id !== id));
    toast.success("Automation rule deleted");
  }, []);

  const duplicateRule = useCallback((id: string) => {
    const rule = rules.find((r) => r.id === id);
    if (rule) {
      const newRule = { ...rule, id: `custom_${Date.now()}`, name: `${rule.name} (Copy)`, triggerCount: 0, lastTriggered: null };
      setRules(prev => [newRule, ...prev]);
      toast.success("Rule duplicated");
    }
  }, [rules]);

  const createRule = useCallback(() => {
    if (!newName || !newTrigger || !newAction) {
      toast.error("Please fill in all required fields");
      return;
    }
    const rule: AutomationRule = {
      id: `custom_${Date.now()}`, name: newName, trigger: newTrigger, triggerDetail: newTriggerDetail,
      action: newAction, actionDetail: newActionDetail, enabled: true, lastTriggered: null,
      triggerCount: 0, category: "Custom", roiEstimate: 0, complexity: "Low", createdAt: new Date().toISOString().split('T')[0], author: user?.name || "User"
    };
    setRules(prev => [rule, ...prev]);
    setShowCreateDialog(false);
    setNewName(""); setNewTrigger(""); setNewTriggerDetail(""); setNewAction(""); setNewActionDetail("");
    toast.success("Automation rule created!");
  }, [newName, newTrigger, newTriggerDetail, newAction, newActionDetail, user]);

  const handleSort = useCallback((field: keyof AutomationRule) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }, [sortField]);

  const toggleSelectRule = useCallback((id: string) => {
    setSelectedRules(prev => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]);
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedRules.length === filteredAndSorted.length) {
      setSelectedRules([]);
    } else {
      setSelectedRules(filteredAndSorted.map((r) => r.id));
    }
  }, [filteredAndSorted, selectedRules]);

  const handleBulkAction = useCallback(() => {
    if (!bulkAction) return;
    if (bulkAction === "enable") {
      setRules(prev => prev.map((r) => selectedRules.includes(r.id) ? { ...r, enabled: true } : r));
      toast.success(`Enabled ${selectedRules.length} rules`);
    } else if (bulkAction === "disable") {
      setRules(prev => prev.map((r) => selectedRules.includes(r.id) ? { ...r, enabled: false } : r));
      toast.success(`Disabled ${selectedRules.length} rules`);
    } else if (bulkAction === "delete") {
      setRules(prev => prev.filter((r) => !selectedRules.includes(r.id)));
      toast.success(`Deleted ${selectedRules.length} rules`);
    }
    setSelectedRules([]);
    setIsBulkEditOpen(false);
    setBulkAction("");
  }, [bulkAction, selectedRules]);

  const exportToCSV = useCallback(() => {
    const headers = ["Rule Name", "Category", "Trigger", "Trigger Detail", "Action", "Action Detail", "Status", "Trigger Count", "Last Triggered", "ROI Estimate"];
    const csvContent = [
      headers.join(","),
      ...rules.map((r) => [
        `"${r.name}"`, 
        `"${r.category}"`, 
        `"${triggerLabel(r.trigger)}"`, 
        `"${r.triggerDetail}"`, 
        `"${actionLabel(r.action)}"`, 
        `"${r.actionDetail}"`, 
        r.enabled ? "Active" : "Paused", 
        r.triggerCount, 
        r.lastTriggered || "Never",
        r.roiEstimate
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `workflow_automations_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exported to CSV");
  }, [rules]);

  const triggerLabel = (t: string) => TRIGGER_TYPES.find((tt) => tt.value === t)?.label ?? t;
  const actionLabel = (a: string) => ACTION_TYPES.find((at) => at.value === a)?.label ?? a;
  
  const catBadgeColor = (c: string) => {
    const colors: Record<string, string> = {
      Milestone: "rc-badge-blue",
      Engagement: "rc-badge-gold",
      Sales: "rc-badge-green",
      Compliance: "rc-badge-red",
      Service: "rc-badge-blue",
      Opportunity: "rc-badge-green",
      Market: "rc-badge-gold",
      Custom: "rc-badge-blue",
    };
    return colors[c] ? `rc-badge ${colors[c]}` : "rc-badge rc-badge-blue";
  };


  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="rc-page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-[#0d1a2e] border border-[#12233e]">
              <Zap className="h-6 w-6 text-[#22c55e]" />
            </div>
            <div>
              <h1 className="rc-page-title">Workflow Automations</h1>
              <p className="rc-page-subtitle">Rule-based triggers and actions for client lifecycle events</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rc-btn rc-btn-ghost" onClick={exportToCSV}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <ExportToSlides
              toolName="Workflow Automations"
              getSections={() => [
                {
                  title: "Workflow Automations Summary",
                  items: [
                    { label: "Total Rules", value: rules.length.toString() },
                    { label: "Active Rules", value: enabledCount.toString() },
                    { label: "Paused Rules", value: (rules.length - enabledCount).toString() },
                    { label: "Total Triggers", value: totalTriggers.toString() }
                  ]
                }
              ]}
            />
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="rc-btn rc-btn-primary">
                  <Plus className="h-4 w-4 mr-2" /> New Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#0d1a2e] border-[#12233e] text-white max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-semibold">Create Automation Rule</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <Label className="text-[#c8d8ec]">Rule Name</Label>
                    <Input 
                      value={newName} 
                      onChange={(e) => setNewName(e.target.value)} 
                      placeholder="e.g., Annual Review Reminder" 
                      className="rc-input" 
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4 border p-4 rounded-xl border-[#12233e] bg-[#0d1a2e]/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-5 w-5 text-[#f0c040]" />
                        <h3 className="font-medium text-white">Trigger (When)</h3>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[#c8d8ec]">Select Event</Label>
                        <Select value={newTrigger} onValueChange={setNewTrigger}>
                          <SelectTrigger className="rc-input"><SelectValue placeholder="Select trigger..." /></SelectTrigger>
                          <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                            {TRIGGER_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[#c8d8ec]">Trigger Conditions</Label>
                        <Input 
                          value={newTriggerDetail} 
                          onChange={(e) => setNewTriggerDetail(e.target.value)} 
                          placeholder="e.g., 65 (age), 30 (days)" 
                          className="rc-input" 
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4 border p-4 rounded-xl border-[#12233e] bg-[#0d1a2e]/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Play className="h-5 w-5 text-[#22c55e]" />
                        <h3 className="font-medium text-white">Action (Then)</h3>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[#c8d8ec]">Select Action</Label>
                        <Select value={newAction} onValueChange={setNewAction}>
                          <SelectTrigger className="rc-input"><SelectValue placeholder="Select action..." /></SelectTrigger>
                          <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                            {ACTION_TYPES.map((a) => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[#c8d8ec]">Action Details</Label>
                        <Input 
                          value={newActionDetail} 
                          onChange={(e) => setNewActionDetail(e.target.value)} 
                          placeholder="e.g., Send annual review scheduling email" 
                          className="rc-input" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild><Button variant="outline" className="rc-btn rc-btn-ghost">Cancel</Button></DialogClose>
                  <Button onClick={createRule} className="rc-btn rc-btn-primary">Create Rule</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rc-card">
            <CardContent className="p-0 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[#12233e]">
                <Settings className="h-5 w-5 text-[#c8d8ec]" />
              </div>
              <div>
                <p className="rc-stat-label">Total Rules</p>
                <p className="rc-stat-value">{loading ? "-" : rules.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rc-card">
            <CardContent className="p-0 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[#22c55e]/10">
                <Play className="h-5 w-5 text-[#22c55e]" />
              </div>
              <div>
                <p className="rc-stat-label">Active</p>
                <p className="rc-stat-value text-[#22c55e]">{loading ? "-" : enabledCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rc-card">
            <CardContent className="p-0 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[#3b82f6]/10">
                <Activity className="h-5 w-5 text-[#3b82f6]" />
              </div>
              <div>
                <p className="rc-stat-label">Total Triggers</p>
                <p className="rc-stat-value text-[#3b82f6]">{loading ? "-" : totalTriggers}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rc-card">
            <CardContent className="p-0 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[#f0c040]/10">
                <TrendingUp className="h-5 w-5 text-[#f0c040]" />
              </div>
              <div>
                <p className="rc-stat-label">Est. Value (ROI)</p>
                <p className="rc-stat-value text-[#f0c040]">{loading ? "-" : `$${totalROI.toLocaleString()}`}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 border-b border-[#12233e] mb-6">
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "rules"
                ? "border-[#22c55e] text-[#22c55e]"
                : "border-transparent text-[#7a95b8] hover:text-[#c8d8ec]"
            }`}
            onClick={() => setActiveTab("rules")}
          >
            Rules Management
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "analytics"
                ? "border-[#22c55e] text-[#22c55e]"
                : "border-transparent text-[#7a95b8] hover:text-[#c8d8ec]"
            }`}
            onClick={() => setActiveTab("analytics")}
          >
            Analytics & ROI
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "history"
                ? "border-[#22c55e] text-[#22c55e]"
                : "border-transparent text-[#7a95b8] hover:text-[#c8d8ec]"
            }`}
            onClick={() => setActiveTab("history")}
          >
            Execution History
          </button>
        </div>

        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1: PieChart */}
              <Card className="rc-card">
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="text-lg font-medium text-white">Rules by Category</CardTitle>
                </CardHeader>
                <CardContent className="p-0 h-[300px]">
                  {loading ? (
                    <div className="h-full flex items-center justify-center">
                      <RefreshCw className="h-8 w-8 text-[#7a95b8] animate-spin" />
                    </div>
                  ) : categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff' }}
                          itemStyle={{ color: '#c8d8ec' }}
                        />
                        <Legend wrapperStyle={{ color: '#c8d8ec' }} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-[#7a95b8]">
                      <PieChartIcon className="h-12 w-12 mb-2 opacity-20" />
                      <p>No data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Chart 2: BarChart */}
              <Card className="rc-card">
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="text-lg font-medium text-white">Top Triggered Rules</CardTitle>
                </CardHeader>
                <CardContent className="p-0 h-[300px]">
                  {loading ? (
                    <div className="h-full flex items-center justify-center">
                      <RefreshCw className="h-8 w-8 text-[#7a95b8] animate-spin" />
                    </div>
                  ) : triggerStatsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={triggerStatsData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#12233e" horizontal={true} vertical={false} />
                        <XAxis type="number" stroke="#7a95b8" />
                        <YAxis dataKey="name" type="category" stroke="#7a95b8" width={150} tick={{ fontSize: 12 }} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff' }}
                          cursor={{ fill: '#12233e' }}
                        />
                        <Bar dataKey="triggers" fill="#22c55e" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-[#7a95b8]">
                      <BarChart3 className="h-12 w-12 mb-2 opacity-20" />
                      <p>No trigger data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 3: AreaChart */}
              <Card className="rc-card">
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="text-lg font-medium text-white">Automation Trends (6 Months)</CardTitle>
                </CardHeader>
                <CardContent className="p-0 h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTriggers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" stroke="#7a95b8" />
                      <YAxis stroke="#7a95b8" />
                      <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                      <RechartsTooltip contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff' }} />
                      <Area type="monotone" dataKey="triggers" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTriggers)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Chart 4: RadarChart */}
              <Card className="rc-card">
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="text-lg font-medium text-white">Category Performance vs Target</CardTitle>
                </CardHeader>
                <CardContent className="p-0 h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="#12233e" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#7a95b8', fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 150]} stroke="#7a95b8" />
                      <Radar name="Actual" dataKey="A" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
                      <Radar name="Target" dataKey="B" stroke="#f0c040" fill="#f0c040" fillOpacity={0.3} />
                      <Legend wrapperStyle={{ color: '#c8d8ec' }} />
                      <RechartsTooltip contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Chart 5: ComposedChart */}
            <Card className="rc-card">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-lg font-medium text-white">ROI vs Execution Volume</CardTitle>
              </CardHeader>
              <CardContent className="p-0 h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trendData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid stroke="#12233e" strokeDasharray="3 3" />
                    <XAxis dataKey="month" stroke="#7a95b8" />
                    <YAxis yAxisId="left" stroke="#3b82f6" />
                    <YAxis yAxisId="right" orientation="right" stroke="#f0c040" />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff' }} />
                    <Legend wrapperStyle={{ color: '#c8d8ec' }} />
                    <Bar yAxisId="left" dataKey="triggers" barSize={20} fill="#3b82f6" />
                    <Line yAxisId="right" type="monotone" dataKey="conversions" stroke="#f0c040" strokeWidth={3} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Data Table 1: Performance Table */}
            <Card className="rc-card">
              <CardHeader className="p-0 mb-4">
                <CardTitle className="text-lg font-medium text-white">Rule Performance Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-[#7a95b8] uppercase bg-[#12233e]/50 border-b border-[#12233e]">
                    <tr>
                      <th className="px-4 py-3 font-medium">Rule Name</th>
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 font-medium">Triggers</th>
                      <th className="px-4 py-3 font-medium">Est. ROI</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.slice(0, 5).map((r) => (
                      <tr key={r.id} className="border-b border-[#12233e] hover:bg-[#12233e]/30">
                        <td className="px-4 py-3 font-medium text-white">{r.name}</td>
                        <td className="px-4 py-3"><span className={catBadgeColor(r.category)}>{r.category}</span></td>
                        <td className="px-4 py-3 text-[#c8d8ec]">{r.triggerCount}</td>
                        <td className="px-4 py-3 text-[#22c55e]">${(r.roiEstimate || 0).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={r.enabled ? "text-[#22c55e] border-[#22c55e]" : "text-[#7a95b8] border-[#7a95b8]"}>
                            {r.enabled ? "Active" : "Paused"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-white">Recent Executions</h2>
              <Button variant="outline" className="rc-btn rc-btn-ghost">
                <Filter className="h-4 w-4 mr-2" /> Filter Logs
              </Button>
            </div>
            
            {/* Data Table 2: Execution History */}
            <Card className="rc-card">
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-[#7a95b8] uppercase bg-[#12233e]/50 border-b border-[#12233e]">
                    <tr>
                      <th className="px-4 py-3 font-medium">Date & Time</th>
                      <th className="px-4 py-3 font-medium">Rule Executed</th>
                      <th className="px-4 py-3 font-medium">Target Entity</th>
                      <th className="px-4 py-3 font-medium">Action Taken</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <tr key={i} className="border-b border-[#12233e] hover:bg-[#12233e]/30">
                        <td className="px-4 py-3 text-[#c8d8ec]">2026-04-12 14:3{i}:00</td>
                        <td className="px-4 py-3 font-medium text-white">Penalty-Free Withdrawal Alert</td>
                        <td className="px-4 py-3 text-[#7a95b8]">Client ID: 884{i}2</td>
                        <td className="px-4 py-3 text-[#c8d8ec]">Sent Email Notification</td>
                        <td className="px-4 py-3">
                          <span className="flex items-center text-[#22c55e] text-xs font-medium">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Success
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Data Table 3: Error Logs */}
              <Card className="rc-card border-red-900/30">
                <CardHeader className="p-4 border-b border-[#12233e]">
                  <CardTitle className="text-md font-medium text-red-400 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" /> Recent Errors
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-sm text-left">
                    <tbody>
                      <tr className="border-b border-[#12233e]">
                        <td className="px-4 py-3 text-[#c8d8ec]">2026-04-11</td>
                        <td className="px-4 py-3 text-white">Webhook Timeout</td>
                        <td className="px-4 py-3 text-red-400 text-xs">Rule: Sync CRM</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-[#c8d8ec]">2026-04-10</td>
                        <td className="px-4 py-3 text-white">Invalid Email Address</td>
                        <td className="px-4 py-3 text-red-400 text-xs">Rule: Birthday</td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>
              
              {/* Data Table 4: User Activity */}
              <Card className="rc-card">
                <CardHeader className="p-4 border-b border-[#12233e]">
                  <CardTitle className="text-md font-medium text-white flex items-center">
                    <Users className="h-4 w-4 mr-2 text-[#3b82f6]" /> Rule Editors
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <table className="w-full text-sm text-left">
                    <tbody>
                      <tr className="border-b border-[#12233e]">
                        <td className="px-4 py-3 text-white">Sarah Jenkins</td>
                        <td className="px-4 py-3 text-[#7a95b8]">Created 3 rules</td>
                        <td className="px-4 py-3 text-[#c8d8ec] text-right">2 hrs ago</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-white">Mike Ross</td>
                        <td className="px-4 py-3 text-[#7a95b8]">Disabled 1 rule</td>
                        <td className="px-4 py-3 text-[#c8d8ec] text-right">1 day ago</td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "rules" && (
          <>
            {/* Filter & Search */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setFilterCategory("all")} 
                  className={filterCategory === "all" ? "bg-[#22c55e] text-white hover:bg-[#16a34a] border-transparent" : "rc-btn-ghost"}
                >
                  All
                </Button>
                {categories.map((c) => (
                  <Button 
                    key={c} 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setFilterCategory(c)} 
                    className={filterCategory === c ? "bg-[#22c55e] text-white hover:bg-[#16a34a] border-transparent" : "rc-btn-ghost"}
                  >
                    {c}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-3 w-full lg:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7a95b8]" />
                  <Input
                    placeholder="Search rules..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="rc-input pl-9 w-full"
                  />
                </div>
                <Select value={sortField as string} onValueChange={(v) => handleSort(v as keyof AutomationRule)}>
                  <SelectTrigger className="rc-input w-[140px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                    <SelectItem value="triggerCount">Triggers</SelectItem>
                    <SelectItem value="enabled">Status</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  className="rc-btn rc-btn-ghost px-2"
                  onClick={() => setSortDirection(prev => prev === "asc" ? "desc" : "asc")}
                >
                  {sortDirection === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedRules.length > 0 && (
              <div className="bg-[#3b82f6]/10 border border-[#3b82f6]/30 rounded-xl p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-4">
                <div className="flex items-center gap-2">
                  <Badge className="bg-[#3b82f6] text-white hover:bg-[#2563eb]">{selectedRules.length} Selected</Badge>
                  <span className="text-sm text-[#c8d8ec]">rules ready for bulk action</span>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={bulkAction} onValueChange={setBulkAction}>
                    <SelectTrigger className="rc-input h-8 text-xs w-[130px]">
                      <SelectValue placeholder="Select Action" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                      <SelectItem value="enable">Enable All</SelectItem>
                      <SelectItem value="disable">Disable All</SelectItem>
                      <SelectItem value="delete" className="text-red-400">Delete All</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="sm" className="rc-btn rc-btn-primary h-8 text-xs" onClick={handleBulkAction} disabled={!bulkAction}>
                    Apply
                  </Button>
                  <Button size="sm" variant="ghost" className="text-[#7a95b8] hover:text-white h-8 w-8 p-0" onClick={() => setSelectedRules([])}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Rules List / Data Table 5 */}
            <div className="space-y-4">
              {/* Header row for list */}
              <div className="hidden md:flex items-center px-5 py-2 text-xs font-medium text-[#7a95b8] uppercase tracking-wider">
                <div className="w-8">
                  <input 
                    type="checkbox" 
                    className="rounded border-[#12233e] bg-[#0d1a2e] text-[#22c55e] focus:ring-[#22c55e]"
                    checked={selectedRules.length === filteredAndSorted.length && filteredAndSorted.length > 0}
                    onChange={toggleSelectAll}
                  />
                </div>
                <div className="flex-1">Rule Details</div>
                <div className="w-32 text-center">Status</div>
                <div className="w-32 text-right">Performance</div>
                <div className="w-16"></div>
              </div>

              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i} className="rc-card animate-pulse">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-6 bg-[#12233e] rounded-full"></div>
                        <div className="space-y-2 flex-1">
                          <div className="h-5 bg-[#12233e] rounded w-1/3"></div>
                          <div className="h-4 bg-[#12233e] rounded w-2/3"></div>
                        </div>
                      </div>
                      <div className="w-20 h-8 bg-[#12233e] rounded"></div>
                    </CardContent>
                  </Card>
                ))
              ) : filteredAndSorted.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-[#12233e] rounded-2xl bg-[#0d1a2e]/50">
                  <Filter className="h-12 w-12 text-[#7a95b8] mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-white mb-1">No rules found</h3>
                  <p className="text-[#7a95b8]">Try adjusting your search or filters.</p>
                  <Button 
                    variant="link" 
                    onClick={() => { setSearchQuery(""); setFilterCategory("all"); }}
                    className="text-[#22c55e] hover:text-[#16a34a] mt-2"
                  >
                    Clear all filters
                  </Button>
                </div>
              ) : (
                filteredAndSorted.map((rule) => (
                  <Card 
                    key={rule.id} 
                    className={`rc-card transition-all duration-200 hover:border-[#22c55e]/50 ${
                      rule.enabled ? "" : "opacity-70 grayscale-[0.2]"
                    } ${selectedRules.includes(rule.id) ? "border-[#3b82f6] bg-[#3b82f6]/5" : ""}`}
                  >
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row md:items-center p-5 gap-4">
                        <div className="hidden md:block w-8 pt-1">
                          <input 
                            type="checkbox" 
                            className="rounded border-[#12233e] bg-[#0d1a2e] text-[#22c55e] focus:ring-[#22c55e]"
                            checked={selectedRules.includes(rule.id)}
                            onChange={() => toggleSelectRule(rule.id)}
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpandedRule(expandedRule === rule.id ? null : rule.id)}>
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-base font-semibold text-white truncate hover:text-[#22c55e] transition-colors">{rule.name}</h4>
                            <span className={catBadgeColor(rule.category)}>{rule.category}</span>
                            {rule.roiEstimate > 1000 && <Badge className="bg-[#f0c040]/20 text-[#f0c040] border-[#f0c040]/30 text-[10px] px-1.5 py-0 h-5">High Value</Badge>}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-[#c8d8ec]">
                            <span className="font-medium text-[#f0c040] flex items-center gap-1">
                              <Zap className="h-3 w-3" /> WHEN
                            </span> 
                            <span className="text-white">{triggerLabel(rule.trigger)}:</span> 
                            <span className="text-[#7a95b8]">{rule.triggerDetail}</span>
                            <ArrowRight className="h-4 w-4 mx-1 text-[#7a95b8]" />
                            <span className="font-medium text-[#22c55e]">THEN</span> 
                            <span className="text-white">{actionLabel(rule.action)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6 md:ml-4 border-t md:border-t-0 border-[#12233e] pt-4 md:pt-0 w-full md:w-auto justify-between md:justify-end">
                          <div className="w-32 flex justify-center">
                            <div className="flex items-center gap-2">
                              <Switch 
                                checked={rule.enabled} 
                                onCheckedChange={() => toggleRule(rule.id)}
                              />
                              <span className="text-xs text-[#7a95b8] w-10">{rule.enabled ? "Active" : "Paused"}</span>
                            </div>
                          </div>
                          
                          <div className="w-32 text-right">
                            <p className="text-sm font-medium text-white">{rule.triggerCount} <span className="text-[#7a95b8] font-normal text-xs">triggers</span></p>
                            {rule.lastTriggered ? (
                              <p className="text-xs text-[#7a95b8]">Last: {rule.lastTriggered}</p>
                            ) : (
                              <p className="text-xs text-[#7a95b8]">Never run</p>
                            )}
                          </div>
                          
                          <div className="flex items-center">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={(e) => { e.stopPropagation(); duplicateRule(rule.id); }} 
                              className="text-[#7a95b8] hover:text-white hover:bg-[#12233e] h-8 w-8 rounded-lg"
                              title="Duplicate"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={(e) => { e.stopPropagation(); deleteRule(rule.id); }} 
                              className="text-[#7a95b8] hover:text-red-400 hover:bg-red-400/10 h-8 w-8 rounded-lg"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {/* Expanded View */}
                      {expandedRule === rule.id && (
                        <div className="border-t border-[#12233e] p-5 bg-[#0d1a2e]/30 animate-in slide-in-from-top-2">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                              <h5 className="text-xs font-medium text-[#7a95b8] uppercase mb-3">Rule Configuration</h5>
                              <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-[#c8d8ec]">Created</span>
                                  <span className="text-white">{rule.createdAt}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-[#c8d8ec]">Author</span>
                                  <span className="text-white">{rule.author}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-[#c8d8ec]">Complexity</span>
                                  <span className="text-white">{rule.complexity}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h5 className="text-xs font-medium text-[#7a95b8] uppercase mb-3">Action Payload</h5>
                              <pre className="bg-[#0d1a2e] p-3 rounded-lg border border-[#12233e] text-xs font-mono text-[#22c55e] overflow-x-auto whitespace-pre-wrap">
{JSON.stringify({ action: rule.action, payload: { message: rule.actionDetail, priority: "high", requireAck: true } }, null, 2)}
                              </pre>
                            </div>
                            
                            <div>
                              <h5 className="text-xs font-medium text-[#7a95b8] uppercase mb-3">Performance metrics</h5>
                              <div className="space-y-3 text-sm">
                                <div className="flex justify-between items-center">
                                  <span className="text-[#c8d8ec]">Success Rate</span>
                                  <div className="flex items-center gap-2">
                                    <div className="w-16 h-1.5 bg-[#12233e] rounded-full overflow-hidden">
                                      <div className="h-full bg-[#22c55e] w-[98%]"></div>
                                    </div>
                                    <span className="text-white">98%</span>
                                  </div>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-[#c8d8ec]">Est. Value Generated</span>
                                  <span className="text-[#f0c040] font-medium">${(rule.roiEstimate).toLocaleString()}</span>
                                </div>
                                <div className="pt-2">
                                  <Button size="sm" variant="outline" className="w-full rc-btn-ghost text-xs">
                                    <Edit className="h-3 w-3 mr-2" /> Edit Configuration
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
            
            {/* Data Table 6: System integrations */}
            <div className="mt-12">
              <h3 className="text-lg font-medium text-white mb-4">Active Integrations</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="rc-card bg-[#0d1a2e]/50">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-[#12233e]">
                      <Mail className="h-5 w-5 text-[#c8d8ec]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Email Provider</p>
                      <p className="text-xs text-[#22c55e] flex items-center mt-1"><CheckCircle2 className="h-3 w-3 mr-1" /> Connected</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="rc-card bg-[#0d1a2e]/50">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-[#12233e]">
                      <Briefcase className="h-5 w-5 text-[#c8d8ec]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">CRM System</p>
                      <p className="text-xs text-[#22c55e] flex items-center mt-1"><CheckCircle2 className="h-3 w-3 mr-1" /> Connected</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="rc-card bg-[#0d1a2e]/50">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-[#12233e]">
                      <Smartphone className="h-5 w-5 text-[#c8d8ec]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">SMS Gateway</p>
                      <p className="text-xs text-[#7a95b8] flex items-center mt-1">Not configured</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
      <PageInsights pageId="workflow-automations" />
    </AppShell>
  );
}
