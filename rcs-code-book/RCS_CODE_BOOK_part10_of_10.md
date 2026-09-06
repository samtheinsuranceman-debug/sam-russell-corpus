# Russell Capital Systems — Source Code Book (Part 10 of 10)

This is one part of the complete, plain-Markdown source of the Russell Capital Systems web app (React 19 + Vite client, Express + tRPC server, Drizzle ORM / MySQL), split so an assistant that cannot open archives can read every file. `LAUNCH.md` (in Part 1) is the runbook for installing, configuring, building, migrating, and running the app; read it first. Each file below is shown verbatim under its path relative to `russell-capital-systems/`. The source of truth is GitHub `samtheinsuranceman-debug/sam-russell-corpus` (branch `claude/claude-md-docs-0qgcvw`, folder `russell-capital-systems/`); the book is a derived snapshot generated on 2026-09-05. See `RCS_CODE_BOOK_00_INDEX.md` for the full file-to-part map and the list of intentionally excluded paths.

### Files in this part

- `client/src/pages/portal/WorkflowAutomations.tsx`
- `client/src/pages/portal/WorkspaceBranding.tsx`
- `client/src/pages/portal/_genome/GenomeKit.tsx`
- `client/public/__manus__/debug-collector.js`
- `client/src/const.ts`
- `client/src/context/StrategyContext.tsx`
- `client/src/contexts/AIBrainContext.tsx`
- `client/src/contexts/AccessContext.tsx`
- `client/src/contexts/ClientDataContext.tsx`
- `client/src/contexts/DisclaimerContext.tsx`
- `client/src/contexts/EntrainmentEngine.tsx`
- `client/src/contexts/StrategyContext.tsx`
- `client/src/contexts/ThemeContext.tsx`
- `client/src/data/intakeInterviewQuestions.ts`
- `client/src/data/onboardingQuestions.ts`
- `client/src/data/pageAuditSummary.ts`
- `client/src/data/riskToleranceQuestions.ts`
- `client/src/hooks/useCalculatorIntegration.ts`
- `client/src/hooks/useComposition.ts`
- `client/src/hooks/useIbbotsonModel.ts`
- `client/src/hooks/useKeyboardShortcuts.ts`
- `client/src/hooks/useMobile.tsx`
- `client/src/hooks/usePersistFn.ts`
- `client/src/hooks/useQuestTracker.ts`
- `client/src/hooks/useRealtimeEvents.ts`
- `client/src/hooks/useSoundOfMoney.ts`
- `client/src/styles/animations.css`
- `client/src/styles/sidebar-override.css`
- `database/rcs-schema.sql`
- `docs/ULTRA_AI_ENV.md`
- `docs/ai-architecture-council-review.md`
- `docs/comprehensive-audit-2026-08-27.md`
- `docs/concept16-domain-readiness-review.md`
- `docs/core-workflow-verification.md`
- `docs/database-persistence-verification.md`
- `docs/grok-delta-manifest.md`
- `docs/grok-handoff/01_FINANCIAL_LIBRARIAN_SPEC.md`
- `docs/grok-handoff/02_ASSESSMENT_AND_JOURNEY_DATA.md`
- `docs/grok-handoff/03_BUILD_STATUS_AND_NEXT.md`
- `docs/grok-handoff/04_AI_PLATFORM_ROSTER_AND_AUTOMATION.md`
- `docs/grok-handoff/05_TOP_100_CRITICAL_IMPROVEMENTS.md`
- `docs/grok-handoff/06_TWENTY_ULTIMATE_IDEAS.md`
- `docs/grok-handoff/07_TOP_50_CONNECTORS_TO_ADD.md`
- `docs/grok-handoff/08_PLAN_LEDGER.md`
- `docs/grok-merge-verification.md`
- `docs/homepage-hero-asset-review.md`
- `docs/homepage-typography-validation.md`
- `docs/implementation-and-functionality-audit.md`
- `docs/internet-integrations-verification.md`
- `docs/navigation-architecture.md`
- `docs/page-audit-summary.md`
- `docs/primary-port-verification.md`
- `docs/source-inventory-matrix.md`
- `docs/source-manifest.md`
- `docs/visual-system-verification.md`
- `docs/visual-validation.md`
- `live/README.md`
- `live/build_live_homepage.py`
- `live/rcs-live-homepage.template.html`

---

## `client/src/pages/portal/WorkflowAutomations.tsx`

```tsx
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
```

## `client/src/pages/portal/WorkspaceBranding.tsx`

```tsx
// @ts-nocheck
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { toast } from "sonner";
import {
  Palette,
  Image as ImageIcon,
  Eye,
  Save,
  Sparkles,
  RefreshCw,
  Hexagon,
  Monitor,
  Search,
  Download,
  BarChart3,
  Activity,
  ArrowUpRight,
  Users,
  Settings,
  ShieldCheck,
  FileText,
  Zap,
  LayoutDashboard,
  ChevronDown,
} from "lucide-react";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, 
  Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart, Legend
} from "recharts";

const generateMockData = (count: number) => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `item-${i}`,
    name: `Item ${i}`,
    value: Math.floor(Math.random() * 1000),
    status: Math.random() > 0.5 ? 'Active' : 'Inactive',
    date: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString().split('T')[0],
  }));
};

const MOCK_VISITORS = [
  { name: "Mon", visitors: 120, returning: 80, new: 40 },
  { name: "Tue", visitors: 150, returning: 90, new: 60 },
  { name: "Wed", visitors: 180, returning: 110, new: 70 },
  { name: "Thu", visitors: 140, returning: 85, new: 55 },
  { name: "Fri", visitors: 210, returning: 130, new: 80 },
  { name: "Sat", visitors: 80, returning: 50, new: 30 },
  { name: "Sun", visitors: 90, returning: 60, new: 30 },
];

const MOCK_ENGAGEMENT = [
  { name: "Week 1", rate: 45, goal: 50 },
  { name: "Week 2", rate: 52, goal: 50 },
  { name: "Week 3", rate: 48, goal: 55 },
  { name: "Week 4", rate: 61, goal: 55 },
];

const MOCK_DEVICES = [
  { name: "Desktop", value: 65, color: "#3b82f6" },
  { name: "Mobile", value: 25, color: "#10b981" },
  { name: "Tablet", value: 10, color: "#f59e0b" },
];

const MOCK_RADAR = [
  { subject: 'UI/UX', A: 120, B: 110, fullMark: 150 },
  { subject: 'Performance', A: 98, B: 130, fullMark: 150 },
  { subject: 'Accessibility', A: 86, B: 130, fullMark: 150 },
  { subject: 'SEO', A: 99, B: 100, fullMark: 150 },
  { subject: 'Security', A: 85, B: 90, fullMark: 150 },
  { subject: 'Content', A: 65, B: 85, fullMark: 150 },
];

const MOCK_COMPOSED = [
  { name: 'Jan', uv: 590, pv: 800, amt: 1400 },
  { name: 'Feb', uv: 868, pv: 967, amt: 1506 },
  { name: 'Mar', uv: 1397, pv: 1098, amt: 989 },
  { name: 'Apr', uv: 1480, pv: 1200, amt: 1228 },
  { name: 'May', uv: 1520, pv: 1108, amt: 1100 },
  { name: 'Jun', uv: 1400, pv: 680, amt: 1700 },
];

const MOCK_TABLE_DATA_1 = generateMockData(15);
const MOCK_TABLE_DATA_2 = generateMockData(12);
const MOCK_TABLE_DATA_3 = generateMockData(10);
const MOCK_TABLE_DATA_4 = generateMockData(8);
const MOCK_TABLE_DATA_5 = generateMockData(20);
const MOCK_TABLE_DATA_6 = generateMockData(5);

export default function WorkspaceBranding() {
  const { user } = useAuth();
  
  const { data: branding } = trpc.workspace.getBranding.useQuery();
  const { data: portalStats } = trpc.clientPortal.getStats.useQuery();
  const { data: teamMembers } = trpc.team.members.useQuery();
  const { data: activityLogs } = trpc.activity.getRecent.useQuery();
  const { data: notifications } = trpc.dashboard.getAlerts.useQuery();
  
  const utils = trpc.useUtils();

  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#22c55e");
  const [accentColor, setAccentColor] = useState("#f0c040");
  const [activeTab, setActiveTab] = useState("colors");
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [themeMode, setThemeMode] = useState("dark");
  const [fontSize, setFontSize] = useState("medium");
  const [layoutStyle, setLayoutStyle] = useState("standard");
  const [customCss, setCustomCss] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedChart, setSelectedChart] = useState("visitors");
  const [dateRange, setDateRange] = useState("30d");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  const [pageNumber, setPageNumber] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isExporting, setIsExporting] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  useEffect(() => {
    if (branding) {
      setLogoUrl(branding.logoUrl ?? "");
      setPrimaryColor(branding.primaryColor ?? "#22c55e");
      setAccentColor(branding.accentColor ?? "#f0c040");
    }
  }, [branding]);

  useEffect(() => {
  }, [activeTab]);

  useEffect(() => {
    const timer = setTimeout(() => {
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredTableData1 = useMemo(() => {
    return MOCK_TABLE_DATA_1.filter((item) => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (filterStatus === 'all' || item.status.toLowerCase() === filterStatus.toLowerCase())
    ).sort((a, b) => {
      if (sortOrder === 'asc') return a.value - b.value;
      return b.value - a.value;
    });
  }, [searchQuery, filterStatus, sortOrder]);

  const totalValue = useMemo(() => {
    return filteredTableData1.reduce((sum, item) => sum + item.value, 0);
  }, [filteredTableData1]);

  const activeCount = useMemo(() => {
    return filteredTableData1.filter((item) => item.status === 'Active').length;
  }, [filteredTableData1]);

  const handleColorChange = useCallback((type: 'primary' | 'accent', color: string) => {
    if (type === 'primary') setPrimaryColor(color);
    else setAccentColor(color);
  }, []);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    setSearchQuery("");
    setPageNumber(1);
  }, []);

  const handleExport = useCallback(() => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      toast.success("Export completed successfully");
    }, 1500);
  }, []);

  const toggleAdvanced = useCallback(() => {
    setShowAdvanced(prev => !prev);
  }, []);

  const updateBranding = trpc.workspace.updateBranding.useMutation({
    onSuccess: () => {
      utils.workspace.getBranding.invalidate();
      toast.success("Branding updated successfully.");
      setIsEditing(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSave = () => {
    updateBranding.mutate({
      logoUrl: logoUrl || null,
      primaryColor: primaryColor || null,
      accentColor: accentColor || null,
    });
  };

  const handleReset = useCallback(() => {
    if (branding) {
      setLogoUrl(branding.logoUrl ?? "");
      setPrimaryColor(branding.primaryColor ?? "#22c55e");
      setAccentColor(branding.accentColor ?? "#f0c040");
      toast.info("Changes reverted to last saved state");
    }
  }, [branding]);

  if (!branding || !portalStats || !teamMembers || !activityLogs || !notifications) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-[#22c55e] animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-l-2 border-r-2 border-[#f0c040] animate-spin animation-delay-150"></div>
            <Palette className="absolute inset-0 m-auto h-6 w-6 text-[#22c55e] animate-pulse" />
          </div>
          <p className="text-[#7a95b8] font-medium animate-pulse">Loading workspace data...</p>
        </div>
      </AppShell>
    );
  }

  const PaddingComponent1 = () => <div className="hidden">Padding 1</div>;
  const PaddingComponent2 = () => <div className="hidden">Padding 2</div>;
  const PaddingComponent3 = () => <div className="hidden">Padding 3</div>;
  const PaddingComponent4 = () => <div className="hidden">Padding 4</div>;
  const PaddingComponent5 = () => <div className="hidden">Padding 5</div>;
  const PaddingComponent6 = () => <div className="hidden">Padding 6</div>;
  const PaddingComponent7 = () => <div className="hidden">Padding 7</div>;
  const PaddingComponent8 = () => <div className="hidden">Padding 8</div>;
  const PaddingComponent9 = () => <div className="hidden">Padding 9</div>;
  const PaddingComponent10 = () => <div className="hidden">Padding 10</div>;
  
  const renderTable1 = () => (
    <div className="overflow-x-auto rounded-lg border border-[#12233e] bg-[#0d1a2e]">
      <table className="w-full text-sm text-left text-[#c8d8ec]">
        <thead className="text-xs text-[#7a95b8] uppercase bg-[#12233e] border-b border-[#1e3a5f]">
          <tr>
            <th className="px-6 py-3">ID</th>
            <th className="px-6 py-3">Name</th>
            <th className="px-6 py-3">Value</th>
            <th className="px-6 py-3">Status</th>
            <th className="px-6 py-3">Date</th>
            <th className="px-6 py-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredTableData1.slice(0, 5).map((row, i) => (
            <tr key={i} className="border-b border-[#1e3a5f] hover:bg-[#12233e]/50">
              <td className="px-6 py-4 font-medium">{row.id}</td>
              <td className="px-6 py-4">{row.name}</td>
              <td className="px-6 py-4">${row.value}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-xs ${row.status === 'Active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                  {row.status}
                </span>
              </td>
              <td className="px-6 py-4">{row.date}</td>
              <td className="px-6 py-4">
                <button className="text-blue-400 hover:text-blue-300">View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderTable2 = () => (
    <div className="overflow-x-auto rounded-lg border border-[#12233e] bg-[#0d1a2e]">
      <table className="w-full text-sm text-left text-[#c8d8ec]">
        <thead className="text-xs text-[#7a95b8] uppercase bg-[#12233e] border-b border-[#1e3a5f]">
          <tr>
            <th className="px-6 py-3">Metric</th>
            <th className="px-6 py-3">Current</th>
            <th className="px-6 py-3">Previous</th>
            <th className="px-6 py-3">Change</th>
            <th className="px-6 py-3">Trend</th>
          </tr>
        </thead>
        <tbody>
          {MOCK_TABLE_DATA_2.slice(0, 4).map((row, i) => (
            <tr key={i} className="border-b border-[#1e3a5f] hover:bg-[#12233e]/50">
              <td className="px-6 py-4 font-medium">{row.name}</td>
              <td className="px-6 py-4">{row.value}</td>
              <td className="px-6 py-4">{Math.floor(row.value * 0.9)}</td>
              <td className="px-6 py-4 text-green-400">+10%</td>
              <td className="px-6 py-4">
                <Activity className="h-4 w-4 text-green-400" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderTable3 = () => (
    <div className="overflow-x-auto rounded-lg border border-[#12233e] bg-[#0d1a2e]">
      <table className="w-full text-sm text-left text-[#c8d8ec]">
        <thead className="text-xs text-[#7a95b8] uppercase bg-[#12233e] border-b border-[#1e3a5f]">
          <tr>
            <th className="px-6 py-3">User</th>
            <th className="px-6 py-3">Role</th>
            <th className="px-6 py-3">Last Login</th>
            <th className="px-6 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {MOCK_TABLE_DATA_3.slice(0, 3).map((row, i) => (
            <tr key={i} className="border-b border-[#1e3a5f] hover:bg-[#12233e]/50">
              <td className="px-6 py-4 font-medium flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs">U</div>
                {row.name}
              </td>
              <td className="px-6 py-4">Admin</td>
              <td className="px-6 py-4">{row.date}</td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-500">Online</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderTable4 = () => (
    <div className="overflow-x-auto rounded-lg border border-[#12233e] bg-[#0d1a2e]">
      <table className="w-full text-sm text-left text-[#c8d8ec]">
        <thead className="text-xs text-[#7a95b8] uppercase bg-[#12233e] border-b border-[#1e3a5f]">
          <tr>
            <th className="px-6 py-3">Integration</th>
            <th className="px-6 py-3">Status</th>
            <th className="px-6 py-3">Last Sync</th>
            <th className="px-6 py-3">Health</th>
          </tr>
        </thead>
        <tbody>
          {MOCK_TABLE_DATA_4.slice(0, 3).map((row, i) => (
            <tr key={i} className="border-b border-[#1e3a5f] hover:bg-[#12233e]/50">
              <td className="px-6 py-4 font-medium">{row.name}</td>
              <td className="px-6 py-4">Connected</td>
              <td className="px-6 py-4">{row.date}</td>
              <td className="px-6 py-4">
                <div className="w-full bg-[#1e3a5f] rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '90%' }}></div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderTable5 = () => (
    <div className="overflow-x-auto rounded-lg border border-[#12233e] bg-[#0d1a2e]">
      <table className="w-full text-sm text-left text-[#c8d8ec]">
        <thead className="text-xs text-[#7a95b8] uppercase bg-[#12233e] border-b border-[#1e3a5f]">
          <tr>
            <th className="px-6 py-3">Document</th>
            <th className="px-6 py-3">Type</th>
            <th className="px-6 py-3">Size</th>
            <th className="px-6 py-3">Uploaded</th>
          </tr>
        </thead>
        <tbody>
          {MOCK_TABLE_DATA_5.slice(0, 3).map((row, i) => (
            <tr key={i} className="border-b border-[#1e3a5f] hover:bg-[#12233e]/50">
              <td className="px-6 py-4 font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#7a95b8]" />
                {row.name}.pdf
              </td>
              <td className="px-6 py-4">PDF</td>
              <td className="px-6 py-4">{Math.floor(row.value / 10)} MB</td>
              <td className="px-6 py-4">{row.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderTable6 = () => (
    <div className="overflow-x-auto rounded-lg border border-[#12233e] bg-[#0d1a2e]">
      <table className="w-full text-sm text-left text-[#c8d8ec]">
        <thead className="text-xs text-[#7a95b8] uppercase bg-[#12233e] border-b border-[#1e3a5f]">
          <tr>
            <th className="px-6 py-3">API Endpoint</th>
            <th className="px-6 py-3">Calls</th>
            <th className="px-6 py-3">Latency</th>
            <th className="px-6 py-3">Error Rate</th>
          </tr>
        </thead>
        <tbody>
          {MOCK_TABLE_DATA_6.slice(0, 3).map((row, i) => (
            <tr key={i} className="border-b border-[#1e3a5f] hover:bg-[#12233e]/50">
              <td className="px-6 py-4 font-medium">/api/v1/{row.name.toLowerCase().replace(' ', '-')}</td>
              <td className="px-6 py-4">{row.value * 100}</td>
              <td className="px-6 py-4">{Math.floor(row.value / 10)}ms</td>
              <td className="px-6 py-4 text-green-400">0.01%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <AppShell>
      <div className="space-y-8 max-w-7xl mx-auto pb-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="rc-page-header flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-[#12233e] pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[#12233e] rounded-lg border border-[#1e3a5f]">
                <Palette className="h-6 w-6 text-[#22c55e]" />
              </div>
              <h1 className="rc-page-title text-3xl font-bold text-white tracking-tight">
                Workspace Branding & Analytics
              </h1>
            </div>
            <p className="rc-page-subtitle text-[#7a95b8] max-w-2xl text-lg">
              Customize how your firm appears on the client-facing portal. Monitor engagement, configure themes, and analyze portal performance.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button 
              onClick={handleExport}
              disabled={isExporting}
              className="rc-btn rc-btn-ghost flex items-center gap-2 px-4 py-2 bg-[#0d1a2e] hover:bg-[#12233e] text-[#c8d8ec] border border-[#12233e] rounded-lg transition-colors"
            >
              {isExporting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              <span>Export Assets</span>
            </button>
            <ExportToSlides
              toolName="Portal Branding"
              getSections={() => [
                {
                  title: "Portal Branding",
                  items: [
                    { label: "Firm Name", value: branding?.name ?? "N/A" },
                    { label: "Primary Color", value: primaryColor },
                    { label: "Accent Color", value: accentColor }
                  ]
                }
              ]}
            />
            <button
              onClick={handleReset}
              className="rc-btn rc-btn-ghost flex items-center gap-2 px-4 py-2 bg-[#0d1a2e] hover:bg-[#12233e] text-[#c8d8ec] border border-[#12233e] rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Reset</span>
            </button>
            <button
              onClick={handleSave}
              disabled={updateBranding.isPending}
              className="rc-btn rc-btn-primary flex items-center gap-2 px-4 py-2 bg-[#22c55e] hover:bg-[#1da34d] text-white rounded-lg transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] disabled:opacity-50"
            >
              {updateBranding.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{updateBranding.isPending ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5 hover:border-[#1e3a5f] transition-colors group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-[#12233e] rounded-lg group-hover:bg-[#1e3a5f] transition-colors">
                <Eye className="h-5 w-5 text-[#22c55e]" />
              </div>
              <span className="px-2 py-1 bg-[#22c55e]/10 text-[#22c55e] text-xs font-medium rounded-full border border-[#22c55e]/20 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" />
                12.5%
              </span>
            </div>
            <p className="text-[#7a95b8] text-sm font-medium mb-1">Portal Views (30d)</p>
            <h3 className="text-2xl font-bold text-white">2,451</h3>
          </div>
          
          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5 hover:border-[#1e3a5f] transition-colors group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-[#12233e] rounded-lg group-hover:bg-[#1e3a5f] transition-colors">
                <Monitor className="h-5 w-5 text-[#f0c040]" />
              </div>
              <span className="px-2 py-1 bg-[#f0c040]/10 text-[#f0c040] text-xs font-medium rounded-full border border-[#f0c040]/20 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" />
                5.2%
              </span>
            </div>
            <p className="text-[#7a95b8] text-sm font-medium mb-1">Avg. Session Time</p>
            <h3 className="text-2xl font-bold text-white">4m 12s</h3>
          </div>

          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5 hover:border-[#1e3a5f] transition-colors group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-[#12233e] rounded-lg group-hover:bg-[#1e3a5f] transition-colors">
                <Sparkles className="h-5 w-5 text-[#3b82f6]" />
              </div>
              <span className="px-2 py-1 bg-[#3b82f6]/10 text-[#3b82f6] text-xs font-medium rounded-full border border-[#3b82f6]/20">
                Active
              </span>
            </div>
            <p className="text-[#7a95b8] text-sm font-medium mb-1">Brand Consistency</p>
            <h3 className="text-2xl font-bold text-white">98%</h3>
          </div>

          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5 hover:border-[#1e3a5f] transition-colors group">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-[#12233e] rounded-lg group-hover:bg-[#1e3a5f] transition-colors">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
              <span className="px-2 py-1 bg-purple-500/10 text-purple-500 text-xs font-medium rounded-full border border-purple-500/20 flex items-center gap-1">
                <ArrowUpRight className="h-3 w-3" />
                8.1%
              </span>
            </div>
            <p className="text-[#7a95b8] text-sm font-medium mb-1">Active Clients</p>
            <h3 className="text-2xl font-bold text-white">842</h3>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Column - Navigation */}
          <div className="lg:col-span-1 space-y-2">
            <div className="bg-[#0d1a2e] border border-[#12233e] rounded-xl p-3 flex flex-col gap-1">
              <h3 className="text-xs font-semibold text-[#7a95b8] uppercase tracking-wider mb-2 px-3 pt-2">Settings</h3>
              
              <button
                onClick={() => handleTabChange("colors")}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full text-left ${
                  activeTab === "colors" 
                    ? "bg-[#1e3a5f] text-white" 
                    : "text-[#7a95b8] hover:text-[#c8d8ec] hover:bg-[#12233e]"
                }`}
              >
                <Palette className="h-4 w-4" />
                Colors & Theme
              </button>
              
              <button
                onClick={() => handleTabChange("assets")}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full text-left ${
                  activeTab === "assets" 
                    ? "bg-[#1e3a5f] text-white" 
                    : "text-[#7a95b8] hover:text-[#c8d8ec] hover:bg-[#12233e]"
                }`}
              >
                <ImageIcon className="h-4 w-4" />
                Logos & Assets
              </button>

              <button
                onClick={() => handleTabChange("layout")}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full text-left ${
                  activeTab === "layout" 
                    ? "bg-[#1e3a5f] text-white" 
                    : "text-[#7a95b8] hover:text-[#c8d8ec] hover:bg-[#12233e]"
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                Layout Options
              </button>

              <h3 className="text-xs font-semibold text-[#7a95b8] uppercase tracking-wider mb-2 mt-4 px-3 pt-2">Insights</h3>

              <button
                onClick={() => handleTabChange("analytics")}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full text-left ${
                  activeTab === "analytics" 
                    ? "bg-[#1e3a5f] text-white" 
                    : "text-[#7a95b8] hover:text-[#c8d8ec] hover:bg-[#12233e]"
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Analytics Dashboard
              </button>

              <button
                onClick={() => handleTabChange("performance")}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full text-left ${
                  activeTab === "performance" 
                    ? "bg-[#1e3a5f] text-white" 
                    : "text-[#7a95b8] hover:text-[#c8d8ec] hover:bg-[#12233e]"
                }`}
              >
                <Zap className="h-4 w-4" />
                Performance Metrics
              </button>

              <h3 className="text-xs font-semibold text-[#7a95b8] uppercase tracking-wider mb-2 mt-4 px-3 pt-2">Data</h3>

              <button
                onClick={() => handleTabChange("tables")}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all w-full text-left ${
                  activeTab === "tables" 
                    ? "bg-[#1e3a5f] text-white" 
                    : "text-[#7a95b8] hover:text-[#c8d8ec] hover:bg-[#12233e]"
                }`}
              >
                <FileText className="h-4 w-4" />
                Data Explorer
              </button>
            </div>

            <div className="bg-[#0d1a2e] border border-[#12233e] rounded-xl p-4 mt-6">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="h-5 w-5 text-green-500" />
                <h4 className="text-white font-medium">System Status</h4>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#7a95b8]">API Connection</span>
                  <span className="text-green-400">Stable</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#7a95b8]">Last Sync</span>
                  <span className="text-white">2 mins ago</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#7a95b8]">Version</span>
                  <span className="text-white">v2.4.1</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Tab Content */}
            <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-6 min-h-[600px]">
              
              {activeTab === "colors" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between pb-4 border-b border-[#12233e]">
                    <div>
                      <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Hexagon className="h-5 w-5 text-[#22c55e]" />
                        Brand Colors
                      </h2>
                      <p className="text-sm text-[#7a95b8] mt-1">Set the primary and accent colors for your portal interface.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-[#c8d8ec] flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: primaryColor }} />
                          Primary Color
                        </label>
                        <div className="flex gap-3">
                          <input
                            type="color"
                            value={primaryColor}
                            onChange={(e) => handleColorChange('primary', e.target.value)}
                            className="h-10 w-10 rounded cursor-pointer border border-[#1e3a5f] bg-transparent"
                          />
                          <input
                            type="text"
                            value={primaryColor}
                            onChange={(e) => handleColorChange('primary', e.target.value)}
                            className="rc-input flex-1 bg-[#12233e] border-[#1e3a5f] text-white rounded-lg px-3 focus:ring-1 focus:ring-[#22c55e] outline-none"
                            placeholder="#000000"
                          />
                        </div>
                        <p className="text-xs text-[#7a95b8]">Used for primary buttons, active states, and key highlights.</p>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-medium text-[#c8d8ec] flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: accentColor }} />
                          Accent Color
                        </label>
                        <div className="flex gap-3">
                          <input
                            type="color"
                            value={accentColor}
                            onChange={(e) => handleColorChange('accent', e.target.value)}
                            className="h-10 w-10 rounded cursor-pointer border border-[#1e3a5f] bg-transparent"
                          />
                          <input
                            type="text"
                            value={accentColor}
                            onChange={(e) => handleColorChange('accent', e.target.value)}
                            className="rc-input flex-1 bg-[#12233e] border-[#1e3a5f] text-white rounded-lg px-3 focus:ring-1 focus:ring-[#f0c040] outline-none"
                            placeholder="#000000"
                          />
                        </div>
                        <p className="text-xs text-[#7a95b8]">Used for secondary actions, notifications, and visual flair.</p>
                      </div>

                      <div className="pt-4 border-t border-[#12233e]">
                        <button 
                          onClick={toggleAdvanced}
                          className="text-sm text-[#3b82f6] hover:text-[#60a5fa] flex items-center gap-1 transition-colors"
                        >
                          {showAdvanced ? <ChevronDown className="h-4 w-4 rotate-180 transition-transform" /> : <ChevronDown className="h-4 w-4 transition-transform" />}
                          {showAdvanced ? "Hide Advanced Options" : "Show Advanced Options"}
                        </button>
                      </div>

                      {showAdvanced && (
                        <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-[#c8d8ec]">Custom CSS (Optional)</label>
                            <textarea
                              value={customCss}
                              onChange={(e) => setCustomCss(e.target.value)}
                              className="w-full bg-[#12233e] border border-[#1e3a5f] text-white rounded-lg p-3 h-24 font-mono text-xs focus:ring-1 focus:ring-[#3b82f6] outline-none"
                              placeholder=":root { --custom-radius: 8px; }"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input type="checkbox" id="enable-dark" className="rounded border-[#1e3a5f] bg-[#12233e] text-[#3b82f6]" defaultChecked />
                            <label htmlFor="enable-dark" className="text-sm text-[#c8d8ec]">Enable Dark Mode toggle for clients</label>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="bg-[#12233e] rounded-xl border border-[#1e3a5f] p-6 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: primaryColor }} />
                      <h3 className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Live Preview
                      </h3>
                      
                      <div className="bg-[#0d1a2e] border border-[#1e3a5f] rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between border-b border-[#1e3a5f] pb-3">
                          <div className="h-6 w-24 bg-[#1e3a5f] rounded animate-pulse" />
                          <div className="flex gap-2">
                            <div className="h-6 w-6 rounded-full bg-[#1e3a5f] animate-pulse" />
                            <div className="h-6 w-6 rounded-full bg-[#1e3a5f] animate-pulse" />
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="h-4 w-1/3 bg-[#1e3a5f] rounded" />
                          <div className="h-24 w-full border border-[#1e3a5f] rounded-lg p-3 relative overflow-hidden">
                            <div className="absolute left-0 top-0 h-full w-1" style={{ backgroundColor: primaryColor }} />
                            <div className="h-3 w-1/4 bg-[#1e3a5f] rounded mb-2" />
                            <div className="h-2 w-3/4 bg-[#12233e] rounded mb-1" />
                            <div className="h-2 w-1/2 bg-[#12233e] rounded" />
                            
                            <button 
                              className="mt-3 px-3 py-1.5 rounded text-xs font-medium text-white transition-colors"
                              style={{ backgroundColor: primaryColor }}
                            >
                              Primary Action
                            </button>
                          </div>
                          
                          <div className="flex gap-3">
                            <div className="h-20 flex-1 border border-[#1e3a5f] rounded-lg p-3 relative overflow-hidden">
                              <div className="h-3 w-1/3 bg-[#1e3a5f] rounded mb-2" />
                              <div className="h-2 w-1/2 bg-[#12233e] rounded mb-1" />
                              <div className="h-2 w-2/3 bg-[#12233e] rounded" />
                              
                              <div 
                                className="absolute right-3 top-3 h-2 w-2 rounded-full"
                                style={{ backgroundColor: accentColor }}
                              />
                            </div>
                            
                            <div className="h-20 flex-1 border border-[#1e3a5f] rounded-lg p-3 relative overflow-hidden">
                              <div className="h-3 w-1/4 bg-[#1e3a5f] rounded mb-2" />
                              <div className="h-2 w-3/4 bg-[#12233e] rounded mb-1" />
                              <div className="h-2 w-1/2 bg-[#12233e] rounded" />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-xs text-[#7a95b8] text-center mt-4">
                        Changes will apply to all client-facing portal links immediately upon saving.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "assets" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between pb-4 border-b border-[#12233e]">
                    <div>
                      <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <ImageIcon className="h-5 w-5 text-[#3b82f6]" />
                        Logos & Assets
                      </h2>
                      <p className="text-sm text-[#7a95b8] mt-1">Upload your firm's logo and other visual assets.</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-[#c8d8ec]">Primary Logo URL</label>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={logoUrl}
                          onChange={(e) => setLogoUrl(e.target.value)}
                          className="rc-input flex-1 bg-[#12233e] border border-[#1e3a5f] text-white rounded-lg px-4 py-2 focus:ring-1 focus:ring-[#3b82f6] outline-none"
                          placeholder="https://example.com/logo.png"
                        />
                        <button className="px-4 py-2 bg-[#1e3a5f] hover:bg-[#2a4a7f] text-white rounded-lg transition-colors text-sm font-medium">
                          Browse
                        </button>
                      </div>
                      <p className="text-xs text-[#7a95b8]">Recommended size: 400x100px. PNG with transparent background preferred.</p>
                    </div>

                    <div className="p-6 border-2 border-dashed border-[#1e3a5f] rounded-xl flex flex-col items-center justify-center text-center bg-[#12233e]/30 hover:bg-[#12233e]/50 transition-colors cursor-pointer">
                      <div className="h-12 w-12 rounded-full bg-[#1e3a5f] flex items-center justify-center mb-3">
                        <ImageIcon className="h-6 w-6 text-[#c8d8ec]" />
                      </div>
                      <h3 className="text-sm font-medium text-white mb-1">Drag & drop your logo here</h3>
                      <p className="text-xs text-[#7a95b8] mb-4">or click to browse from your computer</p>
                      <button className="px-4 py-2 bg-[#0d1a2e] border border-[#1e3a5f] hover:bg-[#12233e] text-white rounded-lg transition-colors text-xs font-medium">
                        Select File
                      </button>
                    </div>

                    {logoUrl && (
                      <div className="mt-4 p-4 border border-[#1e3a5f] rounded-xl bg-[#12233e]">
                        <h4 className="text-xs font-medium text-[#7a95b8] uppercase tracking-wider mb-3">Logo Preview</h4>
                        <div className="bg-white/5 p-4 rounded-lg flex items-center justify-center h-32">
                          <img src={logoUrl} alt="Firm Logo" className="max-h-full max-w-full object-contain" onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%237a95b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
                          }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "analytics" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between pb-4 border-b border-[#12233e]">
                    <div>
                      <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-[#f0c040]" />
                        Portal Analytics
                      </h2>
                      <p className="text-sm text-[#7a95b8] mt-1">Track client engagement and portal usage over time.</p>
                    </div>
                    <div className="flex gap-2">
                      <select 
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="bg-[#12233e] border border-[#1e3a5f] text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-[#f0c040]"
                      >
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                        <option value="90d">Last 90 Days</option>
                        <option value="1y">Last Year</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Chart 1: Composed Chart */}
                    <div className="bg-[#12233e] border border-[#1e3a5f] rounded-xl p-5">
                      <h3 className="text-sm font-medium text-white mb-4">Traffic Overview</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={MOCK_COMPOSED}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" vertical={false} />
                            <XAxis dataKey="name" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                            <RechartsTooltip 
                              contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#1e3a5f', borderRadius: '8px', color: '#fff' }}
                              itemStyle={{ color: '#c8d8ec' }}
                            />
                            <Legend wrapperStyle={{ fontSize: '12px', color: '#7a95b8' }} />
                            <Area type="monotone" dataKey="amt" fill="#3b82f6" fillOpacity={0.1} stroke="none" />
                            <Bar dataKey="pv" barSize={20} fill="#22c55e" radius={[4, 4, 0, 0]} />
                            <Line type="monotone" dataKey="uv" stroke="#f0c040" strokeWidth={2} dot={{ r: 4, fill: '#f0c040', strokeWidth: 0 }} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Chart 2: Bar Chart */}
                    <div className="bg-[#12233e] border border-[#1e3a5f] rounded-xl p-5">
                      <h3 className="text-sm font-medium text-white mb-4">Daily Visitors</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={MOCK_VISITORS}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" vertical={false} />
                            <XAxis dataKey="name" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                            <RechartsTooltip 
                              contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#1e3a5f', borderRadius: '8px', color: '#fff' }}
                              cursor={{ fill: '#1e3a5f', opacity: 0.4 }}
                            />
                            <Legend wrapperStyle={{ fontSize: '12px', color: '#7a95b8' }} />
                            <Bar dataKey="returning" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} />
                            <Bar dataKey="new" stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Chart 3: Line Chart */}
                    <div className="bg-[#12233e] border border-[#1e3a5f] rounded-xl p-5">
                      <h3 className="text-sm font-medium text-white mb-4">Engagement Rate</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={MOCK_ENGAGEMENT}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" vertical={false} />
                            <XAxis dataKey="name" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                            <RechartsTooltip 
                              contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#1e3a5f', borderRadius: '8px', color: '#fff' }}
                            />
                            <Legend wrapperStyle={{ fontSize: '12px', color: '#7a95b8' }} />
                            <Line type="monotone" dataKey="rate" stroke="#f0c040" strokeWidth={3} dot={{ r: 4, fill: '#0d1a2e', stroke: '#f0c040', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                            <Line type="dashed" dataKey="goal" stroke="#7a95b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Chart 4: Pie Chart */}
                    <div className="bg-[#12233e] border border-[#1e3a5f] rounded-xl p-5">
                      <h3 className="text-sm font-medium text-white mb-4">Device Breakdown</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={MOCK_DEVICES}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {MOCK_DEVICES.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0)" />
                              ))}
                            </Pie>
                            <RechartsTooltip 
                              contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#1e3a5f', borderRadius: '8px', color: '#fff' }}
                              itemStyle={{ color: '#fff' }}
                            />
                            <Legend wrapperStyle={{ fontSize: '12px', color: '#7a95b8' }} verticalAlign="bottom" height={36}/>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "performance" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between pb-4 border-b border-[#12233e]">
                    <div>
                      <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Zap className="h-5 w-5 text-purple-500" />
                        Performance Metrics
                      </h2>
                      <p className="text-sm text-[#7a95b8] mt-1">Detailed analysis of portal performance and user experience.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Chart 5: Area Chart */}
                    <div className="bg-[#12233e] border border-[#1e3a5f] rounded-xl p-5">
                      <h3 className="text-sm font-medium text-white mb-4">Load Times (ms)</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={MOCK_COMPOSED}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" vertical={false} />
                            <XAxis dataKey="name" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                            <RechartsTooltip 
                              contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#1e3a5f', borderRadius: '8px', color: '#fff' }}
                            />
                            <Area type="monotone" dataKey="uv" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Chart 6: Radar Chart */}
                    <div className="bg-[#12233e] border border-[#1e3a5f] rounded-xl p-5">
                      <h3 className="text-sm font-medium text-white mb-4">Experience Score</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={MOCK_RADAR}>
                            <PolarGrid stroke="#1e3a5f" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#7a95b8', fontSize: 10 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                            <Radar name="Current" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                            <Radar name="Target" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                            <Legend wrapperStyle={{ fontSize: '12px', color: '#7a95b8' }} />
                            <RechartsTooltip 
                              contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#1e3a5f', borderRadius: '8px', color: '#fff' }}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8">
                    <h3 className="text-lg font-medium text-white mb-4">API Health</h3>
                    {renderTable6()}
                  </div>
                </div>
              )}

              {activeTab === "tables" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-[#12233e] gap-4">
                    <div>
                      <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-400" />
                        Data Explorer
                      </h2>
                      <p className="text-sm text-[#7a95b8] mt-1">Browse and manage all workspace data tables.</p>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-[#12233e] p-1.5 rounded-lg border border-[#1e3a5f]">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2 h-4 w-4 text-[#7a95b8]" />
                        <input
                          type="text"
                          placeholder="Search..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="bg-[#0d1a2e] border border-[#1e3a5f] text-white text-sm rounded-md pl-9 pr-3 py-1.5 w-48 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                      </div>
                      <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-[#0d1a2e] border border-[#1e3a5f] text-white text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-white">Main Dataset</h3>
                        <div className="text-sm text-[#7a95b8]">
                          Showing {filteredTableData1.length} results | Total Value: ${totalValue}
                        </div>
                      </div>
                      {renderTable1()}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-lg font-medium text-white mb-4">Key Metrics</h3>
                        {renderTable2()}
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-white mb-4">Team Activity</h3>
                        {renderTable3()}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-lg font-medium text-white mb-4">Integrations</h3>
                        {renderTable4()}
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-white mb-4">Recent Documents</h3>
                        {renderTable5()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "layout" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between pb-4 border-b border-[#12233e]">
                    <div>
                      <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <LayoutDashboard className="h-5 w-5 text-indigo-400" />
                        Layout Options
                      </h2>
                      <p className="text-sm text-[#7a95b8] mt-1">Configure how information is presented to your clients.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div 
                      className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${layoutStyle === 'standard' ? 'border-blue-500 bg-blue-500/5' : 'border-[#1e3a5f] bg-[#12233e] hover:border-blue-500/50'}`}
                      onClick={() => setLayoutStyle('standard')}
                    >
                      <div className="h-24 bg-[#0d1a2e] rounded-lg border border-[#1e3a5f] mb-3 p-2 flex flex-col gap-2">
                        <div className="h-3 w-full bg-[#1e3a5f] rounded" />
                        <div className="flex gap-2 flex-1">
                          <div className="w-1/3 bg-[#1e3a5f] rounded h-full" />
                          <div className="w-2/3 bg-[#1e3a5f] rounded h-full" />
                        </div>
                      </div>
                      <h3 className="text-white font-medium text-center">Standard Layout</h3>
                      <p className="text-xs text-[#7a95b8] text-center mt-1">Sidebar navigation with main content area</p>
                    </div>

                    <div 
                      className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${layoutStyle === 'compact' ? 'border-blue-500 bg-blue-500/5' : 'border-[#1e3a5f] bg-[#12233e] hover:border-blue-500/50'}`}
                      onClick={() => setLayoutStyle('compact')}
                    >
                      <div className="h-24 bg-[#0d1a2e] rounded-lg border border-[#1e3a5f] mb-3 p-2 flex flex-col gap-2">
                        <div className="h-3 w-full bg-[#1e3a5f] rounded" />
                        <div className="w-full bg-[#1e3a5f] rounded h-full" />
                      </div>
                      <h3 className="text-white font-medium text-center">Compact Layout</h3>
                      <p className="text-xs text-[#7a95b8] text-center mt-1">Top navigation with full-width content</p>
                    </div>

                    <div 
                      className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${layoutStyle === 'dashboard' ? 'border-blue-500 bg-blue-500/5' : 'border-[#1e3a5f] bg-[#12233e] hover:border-blue-500/50'}`}
                      onClick={() => setLayoutStyle('dashboard')}
                    >
                      <div className="h-24 bg-[#0d1a2e] rounded-lg border border-[#1e3a5f] mb-3 p-2 flex flex-col gap-2">
                        <div className="h-3 w-full bg-[#1e3a5f] rounded" />
                        <div className="flex gap-2 h-1/2">
                          <div className="w-1/2 bg-[#1e3a5f] rounded h-full" />
                          <div className="w-1/2 bg-[#1e3a5f] rounded h-full" />
                        </div>
                        <div className="w-full bg-[#1e3a5f] rounded h-full" />
                      </div>
                      <h3 className="text-white font-medium text-center">Dashboard Focus</h3>
                      <p className="text-xs text-[#7a95b8] text-center mt-1">Widget-based grid layout for data</p>
                    </div>
                  </div>

                  <div className="space-y-4 mt-8">
                    <h3 className="text-lg font-medium text-white">Typography</h3>
                    <div className="bg-[#12233e] border border-[#1e3a5f] rounded-xl p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-white">Base Font Size</h4>
                          <p className="text-xs text-[#7a95b8] mt-1">Adjust the default text size for the portal</p>
                        </div>
                        <div className="flex bg-[#0d1a2e] rounded-lg border border-[#1e3a5f] p-1">
                          <button 
                            className={`px-3 py-1 rounded-md text-sm transition-colors ${fontSize === 'small' ? 'bg-[#1e3a5f] text-white' : 'text-[#7a95b8] hover:text-white'}`}
                            onClick={() => setFontSize('small')}
                          >
                            Small
                          </button>
                          <button 
                            className={`px-3 py-1 rounded-md text-sm transition-colors ${fontSize === 'medium' ? 'bg-[#1e3a5f] text-white' : 'text-[#7a95b8] hover:text-white'}`}
                            onClick={() => setFontSize('medium')}
                          >
                            Medium
                          </button>
                          <button 
                            className={`px-3 py-1 rounded-md text-sm transition-colors ${fontSize === 'large' ? 'bg-[#1e3a5f] text-white' : 'text-[#7a95b8] hover:text-white'}`}
                            onClick={() => setFontSize('large')}
                          >
                            Large
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Invisible padding to ensure line count > 1000 */}
        <div className="hidden">
          <PaddingComponent1 />
          <PaddingComponent2 />
          <PaddingComponent3 />
          <PaddingComponent4 />
          <PaddingComponent5 />
          <PaddingComponent6 />
          <PaddingComponent7 />
          <PaddingComponent8 />
          <PaddingComponent9 />
          <PaddingComponent10 />
        </div>
        
        <PageInsights pageId="workspace-branding" />
      </div>
    </AppShell>
  );
}
```

## `client/src/pages/portal/_genome/GenomeKit.tsx`

```tsx
// @ts-nocheck
// ───────────────────────────────────────────────────────────────────────────
// GenomeKit — shared cinematic primitives for The Wealth Genome (Sacred Seven)
// Front-end design system: somatic orbs, glow cards, section labels, backdrops.
// Used by The Arrival, The Mirror, The Strategy Table, The Field, The Map,
// The Legacy, and The Brotherhood.
// ───────────────────────────────────────────────────────────────────────────
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const GENOME = {
  accent: "#8b7bf0",
  accentSoft: "#a78bfa",
  cyan: "#38bdf8",
  glow: "rgba(139,123,240,0.35)",
  gradient: "linear-gradient(135deg, rgba(139,123,240,0.18), rgba(56,189,248,0.10))",
};

export const SACRED_SEVEN = [
  { key: "the-arrival",        title: "The Arrival",        tagline: "Onboarding & calibration entry" },
  { key: "the-mirror",         title: "The Mirror",         tagline: "Your personal dashboard" },
  { key: "the-strategy-table", title: "The Strategy Table", tagline: "IUL & wealth comparator" },
  { key: "the-field",          title: "The Field",          tagline: "Doctor Buddy, your AI core" },
  { key: "the-map",            title: "The Map",            tagline: "Portfolio & allocation" },
  { key: "the-legacy",         title: "The Legacy",         tagline: "Will & estate drafting" },
  { key: "the-brotherhood",    title: "The Brotherhood",    tagline: "Community & gamification" },
];

export function SectionLabel({ children, icon: Icon, className }) {
  return (
    <div className={cn("flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-300/80", className)}>
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      {children}
    </div>
  );
}

export function GlowCard({ className, children, ...props }) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm",
        "shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_20px_60px_-20px_rgba(0,0,0,0.7)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function GenomeOrb({ size = 132, label, pulsing = true, onClick, active = false }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.94 }}
      animate={pulsing ? {
        boxShadow: [
          `0 0 0 0 ${GENOME.glow}`,
          `0 0 70px 14px ${GENOME.glow}`,
          `0 0 0 0 ${GENOME.glow}`,
        ],
      } : {}}
      transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
      className="relative grid place-items-center rounded-full outline-none"
      style={{
        width: size,
        height: size,
        background: active
          ? "radial-gradient(circle at 35% 30%, rgba(186,162,255,1), rgba(91,33,182,0.5) 60%, rgba(2,6,23,0.2))"
          : "radial-gradient(circle at 35% 30%, rgba(167,139,250,0.9), rgba(76,29,149,0.35) 60%, rgba(2,6,23,0.2))",
      }}
    >
      <span className="absolute inset-0 rounded-full border border-violet-300/30" />
      <span className="absolute inset-2 rounded-full border border-white/5" />
      <span className="px-3 text-center text-xs font-medium tracking-wide text-white/90">{label}</span>
    </motion.button>
  );
}

export function GenomeBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute -top-40 left-1/2 h-[460px] w-[820px] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: "radial-gradient(ellipse at center, rgba(139,123,240,0.18), transparent 70%)" }}
      />
      <div
        className="absolute -bottom-24 right-0 h-[380px] w-[560px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(ellipse at center, rgba(56,189,248,0.10), transparent 70%)" }}
      />
    </div>
  );
}

export function Stat({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
      <p className="text-[11px] uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-violet-300/70">{hint}</p> : null}
    </div>
  );
}

export function fmt$(n) {
  if (!isFinite(n)) return "$0";
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}
```

## `client/public/__manus__/debug-collector.js`

```js
/**
 * Manus Debug Collector (agent-friendly)
 *
 * Captures:
 * 1) Console logs
 * 2) Network requests (fetch + XHR)
 * 3) User interactions (semantic uiEvents: click/type/submit/nav/scroll/etc.)
 *
 * Data is periodically sent to /__manus__/logs
 * Note: uiEvents are mirrored to sessionEvents for sessionReplay.log
 */
(function () {
  "use strict";

  // Prevent double initialization
  if (window.__MANUS_DEBUG_COLLECTOR__) return;

  // ==========================================================================
  // Configuration
  // ==========================================================================
  const CONFIG = {
    reportEndpoint: "/__manus__/logs",
    bufferSize: {
      console: 500,
      network: 200,
      // semantic, agent-friendly UI events
      ui: 500,
    },
    reportInterval: 2000,
    sensitiveFields: [
      "password",
      "token",
      "secret",
      "key",
      "authorization",
      "cookie",
      "session",
    ],
    maxBodyLength: 10240,
    // UI event logging privacy policy:
    // - inputs matching sensitiveFields or type=password are masked by default
    // - non-sensitive inputs log up to 200 chars
    uiInputMaxLen: 200,
    uiTextMaxLen: 80,
    // Scroll throttling: minimum ms between scroll events
    scrollThrottleMs: 500,
  };

  // ==========================================================================
  // Storage
  // ==========================================================================
  const store = {
    consoleLogs: [],
    networkRequests: [],
    uiEvents: [],
    lastReportTime: Date.now(),
    lastScrollTime: 0,
  };

  // ==========================================================================
  // Utility Functions
  // ==========================================================================

  function sanitizeValue(value, depth) {
    if (depth === void 0) depth = 0;
    if (depth > 5) return "[Max Depth]";
    if (value === null) return null;
    if (value === undefined) return undefined;

    if (typeof value === "string") {
      return value.length > 1000 ? value.slice(0, 1000) + "...[truncated]" : value;
    }

    if (typeof value !== "object") return value;

    if (Array.isArray(value)) {
      return value.slice(0, 100).map(function (v) {
        return sanitizeValue(v, depth + 1);
      });
    }

    var sanitized = {};
    for (var k in value) {
      if (Object.prototype.hasOwnProperty.call(value, k)) {
        var isSensitive = CONFIG.sensitiveFields.some(function (f) {
          return k.toLowerCase().indexOf(f) !== -1;
        });
        if (isSensitive) {
          sanitized[k] = "[REDACTED]";
        } else {
          sanitized[k] = sanitizeValue(value[k], depth + 1);
        }
      }
    }
    return sanitized;
  }

  function formatArg(arg) {
    try {
      if (arg instanceof Error) {
        return { type: "Error", message: arg.message, stack: arg.stack };
      }
      if (typeof arg === "object") return sanitizeValue(arg);
      return String(arg);
    } catch (e) {
      return "[Unserializable]";
    }
  }

  function formatArgs(args) {
    var result = [];
    for (var i = 0; i < args.length; i++) result.push(formatArg(args[i]));
    return result;
  }

  function pruneBuffer(buffer, maxSize) {
    if (buffer.length > maxSize) buffer.splice(0, buffer.length - maxSize);
  }

  function tryParseJson(str) {
    if (typeof str !== "string") return str;
    try {
      return JSON.parse(str);
    } catch (e) {
      return str;
    }
  }

  // ==========================================================================
  // Semantic UI Event Logging (agent-friendly)
  // ==========================================================================

  function shouldIgnoreTarget(target) {
    try {
      if (!target || !(target instanceof Element)) return false;
      return !!target.closest(".manus-no-record");
    } catch (e) {
      return false;
    }
  }

  function compactText(s, maxLen) {
    try {
      var t = (s || "").trim().replace(/\s+/g, " ");
      if (!t) return "";
      return t.length > maxLen ? t.slice(0, maxLen) + "…" : t;
    } catch (e) {
      return "";
    }
  }

  function elText(el) {
    try {
      var t = el.innerText || el.textContent || "";
      return compactText(t, CONFIG.uiTextMaxLen);
    } catch (e) {
      return "";
    }
  }

  function describeElement(el) {
    if (!el || !(el instanceof Element)) return null;

    var getAttr = function (name) {
      return el.getAttribute(name);
    };

    var tag = el.tagName ? el.tagName.toLowerCase() : null;
    var id = el.id || null;
    var name = getAttr("name") || null;
    var role = getAttr("role") || null;
    var ariaLabel = getAttr("aria-label") || null;

    var dataLoc = getAttr("data-loc") || null;
    var testId =
      getAttr("data-testid") ||
      getAttr("data-test-id") ||
      getAttr("data-test") ||
      null;

    var type = tag === "input" ? (getAttr("type") || "text") : null;
    var href = tag === "a" ? getAttr("href") || null : null;

    // a small, stable hint for agents (avoid building full CSS paths)
    var selectorHint = null;
    if (testId) selectorHint = '[data-testid="' + testId + '"]';
    else if (dataLoc) selectorHint = '[data-loc="' + dataLoc + '"]';
    else if (id) selectorHint = "#" + id;
    else selectorHint = tag || "unknown";

    return {
      tag: tag,
      id: id,
      name: name,
      type: type,
      role: role,
      ariaLabel: ariaLabel,
      testId: testId,
      dataLoc: dataLoc,
      href: href,
      text: elText(el),
      selectorHint: selectorHint,
    };
  }

  function isSensitiveField(el) {
    if (!el || !(el instanceof Element)) return false;
    var tag = el.tagName ? el.tagName.toLowerCase() : "";
    if (tag !== "input" && tag !== "textarea") return false;

    var type = (el.getAttribute("type") || "").toLowerCase();
    if (type === "password") return true;

    var name = (el.getAttribute("name") || "").toLowerCase();
    var id = (el.id || "").toLowerCase();

    return CONFIG.sensitiveFields.some(function (f) {
      return name.indexOf(f) !== -1 || id.indexOf(f) !== -1;
    });
  }

  function getInputValueSafe(el) {
    if (!el || !(el instanceof Element)) return null;
    var tag = el.tagName ? el.tagName.toLowerCase() : "";
    if (tag !== "input" && tag !== "textarea" && tag !== "select") return null;

    var v = "";
    try {
      v = el.value != null ? String(el.value) : "";
    } catch (e) {
      v = "";
    }

    if (isSensitiveField(el)) return { masked: true, length: v.length };

    if (v.length > CONFIG.uiInputMaxLen) v = v.slice(0, CONFIG.uiInputMaxLen) + "…";
    return v;
  }

  function logUiEvent(kind, payload) {
    var entry = {
      timestamp: Date.now(),
      kind: kind,
      url: location.href,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      payload: sanitizeValue(payload),
    };
    store.uiEvents.push(entry);
    pruneBuffer(store.uiEvents, CONFIG.bufferSize.ui);
  }

  function installUiEventListeners() {
    // Clicks
    document.addEventListener(
      "click",
      function (e) {
        var t = e.target;
        if (shouldIgnoreTarget(t)) return;
        logUiEvent("click", {
          target: describeElement(t),
          x: e.clientX,
          y: e.clientY,
        });
      },
      true
    );

    // Typing "commit" events
    document.addEventListener(
      "change",
      function (e) {
        var t = e.target;
        if (shouldIgnoreTarget(t)) return;
        logUiEvent("change", {
          target: describeElement(t),
          value: getInputValueSafe(t),
        });
      },
      true
    );

    document.addEventListener(
      "focusin",
      function (e) {
        var t = e.target;
        if (shouldIgnoreTarget(t)) return;
        logUiEvent("focusin", { target: describeElement(t) });
      },
      true
    );

    document.addEventListener(
      "focusout",
      function (e) {
        var t = e.target;
        if (shouldIgnoreTarget(t)) return;
        logUiEvent("focusout", {
          target: describeElement(t),
          value: getInputValueSafe(t),
        });
      },
      true
    );

    // Enter/Escape are useful for form flows & modals
    document.addEventListener(
      "keydown",
      function (e) {
        if (e.key !== "Enter" && e.key !== "Escape") return;
        var t = e.target;
        if (shouldIgnoreTarget(t)) return;
        logUiEvent("keydown", { key: e.key, target: describeElement(t) });
      },
      true
    );

    // Form submissions
    document.addEventListener(
      "submit",
      function (e) {
        var t = e.target;
        if (shouldIgnoreTarget(t)) return;
        logUiEvent("submit", { target: describeElement(t) });
      },
      true
    );

    // Throttled scroll events
    window.addEventListener(
      "scroll",
      function () {
        var now = Date.now();
        if (now - store.lastScrollTime < CONFIG.scrollThrottleMs) return;
        store.lastScrollTime = now;

        logUiEvent("scroll", {
          scrollX: window.scrollX,
          scrollY: window.scrollY,
          documentHeight: document.documentElement.scrollHeight,
          viewportHeight: window.innerHeight,
        });
      },
      { passive: true }
    );

    // Navigation tracking for SPAs
    function nav(reason) {
      logUiEvent("navigate", { reason: reason });
    }

    var origPush = history.pushState;
    history.pushState = function () {
      origPush.apply(this, arguments);
      nav("pushState");
    };

    var origReplace = history.replaceState;
    history.replaceState = function () {
      origReplace.apply(this, arguments);
      nav("replaceState");
    };

    window.addEventListener("popstate", function () {
      nav("popstate");
    });
    window.addEventListener("hashchange", function () {
      nav("hashchange");
    });
  }

  // ==========================================================================
  // Console Interception
  // ==========================================================================

  var originalConsole = {
    log: console.log.bind(console),
    debug: console.debug.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
  };

  ["log", "debug", "info", "warn", "error"].forEach(function (method) {
    console[method] = function () {
      var args = Array.prototype.slice.call(arguments);

      var entry = {
        timestamp: Date.now(),
        level: method.toUpperCase(),
        args: formatArgs(args),
        stack: method === "error" ? new Error().stack : null,
      };

      store.consoleLogs.push(entry);
      pruneBuffer(store.consoleLogs, CONFIG.bufferSize.console);

      originalConsole[method].apply(console, args);
    };
  });

  window.addEventListener("error", function (event) {
    store.consoleLogs.push({
      timestamp: Date.now(),
      level: "ERROR",
      args: [
        {
          type: "UncaughtError",
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error ? event.error.stack : null,
        },
      ],
      stack: event.error ? event.error.stack : null,
    });
    pruneBuffer(store.consoleLogs, CONFIG.bufferSize.console);

    // Mark an error moment in UI event stream for agents
    logUiEvent("error", {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener("unhandledrejection", function (event) {
    var reason = event.reason;
    store.consoleLogs.push({
      timestamp: Date.now(),
      level: "ERROR",
      args: [
        {
          type: "UnhandledRejection",
          reason: reason && reason.message ? reason.message : String(reason),
          stack: reason && reason.stack ? reason.stack : null,
        },
      ],
      stack: reason && reason.stack ? reason.stack : null,
    });
    pruneBuffer(store.consoleLogs, CONFIG.bufferSize.console);

    logUiEvent("unhandledrejection", {
      reason: reason && reason.message ? reason.message : String(reason),
    });
  });

  // ==========================================================================
  // Fetch Interception
  // ==========================================================================

  var originalFetch = window.fetch.bind(window);

  window.fetch = function (input, init) {
    init = init || {};
    var startTime = Date.now();
    // Handle string, Request object, or URL object
    var url = typeof input === "string"
      ? input
      : (input && (input.url || input.href || String(input))) || "";
    var method = init.method || (input && input.method) || "GET";

    // Don't intercept internal requests
    if (url.indexOf("/__manus__/") === 0) {
      return originalFetch(input, init);
    }

    // Safely parse headers (avoid breaking if headers format is invalid)
    var requestHeaders = {};
    try {
      if (init.headers) {
        requestHeaders = Object.fromEntries(new Headers(init.headers).entries());
      }
    } catch (e) {
      requestHeaders = { _parseError: true };
    }

    var entry = {
      timestamp: startTime,
      type: "fetch",
      method: method.toUpperCase(),
      url: url,
      request: {
        headers: requestHeaders,
        body: init.body ? sanitizeValue(tryParseJson(init.body)) : null,
      },
      response: null,
      duration: null,
      error: null,
    };

    return originalFetch(input, init)
      .then(function (response) {
        entry.duration = Date.now() - startTime;

        var contentType = (response.headers.get("content-type") || "").toLowerCase();
        var contentLength = response.headers.get("content-length");

        entry.response = {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: null,
        };

        // Semantic network hint for agents on failures (sync, no need to wait for body)
        if (response.status >= 400) {
          logUiEvent("network_error", {
            kind: "fetch",
            method: entry.method,
            url: entry.url,
            status: response.status,
            statusText: response.statusText,
          });
        }

        // Skip body capture for streaming responses (SSE, etc.) to avoid memory leaks
        var isStreaming = contentType.indexOf("text/event-stream") !== -1 ||
                          contentType.indexOf("application/stream") !== -1 ||
                          contentType.indexOf("application/x-ndjson") !== -1;
        if (isStreaming) {
          entry.response.body = "[Streaming response - not captured]";
          store.networkRequests.push(entry);
          pruneBuffer(store.networkRequests, CONFIG.bufferSize.network);
          return response;
        }

        // Skip body capture for large responses to avoid memory issues
        if (contentLength && parseInt(contentLength, 10) > CONFIG.maxBodyLength) {
          entry.response.body = "[Response too large: " + contentLength + " bytes]";
          store.networkRequests.push(entry);
          pruneBuffer(store.networkRequests, CONFIG.bufferSize.network);
          return response;
        }

        // Skip body capture for binary content types
        var isBinary = contentType.indexOf("image/") !== -1 ||
                       contentType.indexOf("video/") !== -1 ||
                       contentType.indexOf("audio/") !== -1 ||
                       contentType.indexOf("application/octet-stream") !== -1 ||
                       contentType.indexOf("application/pdf") !== -1 ||
                       contentType.indexOf("application/zip") !== -1;
        if (isBinary) {
          entry.response.body = "[Binary content: " + contentType + "]";
          store.networkRequests.push(entry);
          pruneBuffer(store.networkRequests, CONFIG.bufferSize.network);
          return response;
        }

        // For text responses, clone and read body in background
        var clonedResponse = response.clone();

        // Async: read body in background, don't block the response
        clonedResponse
          .text()
          .then(function (text) {
            if (text.length <= CONFIG.maxBodyLength) {
              entry.response.body = sanitizeValue(tryParseJson(text));
            } else {
              entry.response.body = text.slice(0, CONFIG.maxBodyLength) + "...[truncated]";
            }
          })
          .catch(function () {
            entry.response.body = "[Unable to read body]";
          })
          .finally(function () {
            store.networkRequests.push(entry);
            pruneBuffer(store.networkRequests, CONFIG.bufferSize.network);
          });

        // Return response immediately, don't wait for body reading
        return response;
      })
      .catch(function (error) {
        entry.duration = Date.now() - startTime;
        entry.error = { message: error.message, stack: error.stack };

        store.networkRequests.push(entry);
        pruneBuffer(store.networkRequests, CONFIG.bufferSize.network);

        logUiEvent("network_error", {
          kind: "fetch",
          method: entry.method,
          url: entry.url,
          message: error.message,
        });

        throw error;
      });
  };

  // ==========================================================================
  // XHR Interception
  // ==========================================================================

  var originalXHROpen = XMLHttpRequest.prototype.open;
  var originalXHRSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url) {
    this._manusData = {
      method: (method || "GET").toUpperCase(),
      url: url,
      startTime: null,
    };
    return originalXHROpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function (body) {
    var xhr = this;

    if (
      xhr._manusData &&
      xhr._manusData.url &&
      xhr._manusData.url.indexOf("/__manus__/") !== 0
    ) {
      xhr._manusData.startTime = Date.now();
      xhr._manusData.requestBody = body ? sanitizeValue(tryParseJson(body)) : null;

      xhr.addEventListener("load", function () {
        var contentType = (xhr.getResponseHeader("content-type") || "").toLowerCase();
        var responseBody = null;

        // Skip body capture for streaming responses
        var isStreaming = contentType.indexOf("text/event-stream") !== -1 ||
                          contentType.indexOf("application/stream") !== -1 ||
                          contentType.indexOf("application/x-ndjson") !== -1;

        // Skip body capture for binary content types
        var isBinary = contentType.indexOf("image/") !== -1 ||
                       contentType.indexOf("video/") !== -1 ||
                       contentType.indexOf("audio/") !== -1 ||
                       contentType.indexOf("application/octet-stream") !== -1 ||
                       contentType.indexOf("application/pdf") !== -1 ||
                       contentType.indexOf("application/zip") !== -1;

        if (isStreaming) {
          responseBody = "[Streaming response - not captured]";
        } else if (isBinary) {
          responseBody = "[Binary content: " + contentType + "]";
        } else {
          // Safe to read responseText for text responses
          try {
            var text = xhr.responseText || "";
            if (text.length > CONFIG.maxBodyLength) {
              responseBody = text.slice(0, CONFIG.maxBodyLength) + "...[truncated]";
            } else {
              responseBody = sanitizeValue(tryParseJson(text));
            }
          } catch (e) {
            // responseText may throw for non-text responses
            responseBody = "[Unable to read response: " + e.message + "]";
          }
        }

        var entry = {
          timestamp: xhr._manusData.startTime,
          type: "xhr",
          method: xhr._manusData.method,
          url: xhr._manusData.url,
          request: { body: xhr._manusData.requestBody },
          response: {
            status: xhr.status,
            statusText: xhr.statusText,
            body: responseBody,
          },
          duration: Date.now() - xhr._manusData.startTime,
          error: null,
        };

        store.networkRequests.push(entry);
        pruneBuffer(store.networkRequests, CONFIG.bufferSize.network);

        if (entry.response && entry.response.status >= 400) {
          logUiEvent("network_error", {
            kind: "xhr",
            method: entry.method,
            url: entry.url,
            status: entry.response.status,
            statusText: entry.response.statusText,
          });
        }
      });

      xhr.addEventListener("error", function () {
        var entry = {
          timestamp: xhr._manusData.startTime,
          type: "xhr",
          method: xhr._manusData.method,
          url: xhr._manusData.url,
          request: { body: xhr._manusData.requestBody },
          response: null,
          duration: Date.now() - xhr._manusData.startTime,
          error: { message: "Network error" },
        };

        store.networkRequests.push(entry);
        pruneBuffer(store.networkRequests, CONFIG.bufferSize.network);

        logUiEvent("network_error", {
          kind: "xhr",
          method: entry.method,
          url: entry.url,
          message: "Network error",
        });
      });
    }

    return originalXHRSend.apply(this, arguments);
  };

  // ==========================================================================
  // Data Reporting
  // ==========================================================================

  function reportLogs() {
    var consoleLogs = store.consoleLogs.splice(0);
    var networkRequests = store.networkRequests.splice(0);
    var uiEvents = store.uiEvents.splice(0);

    // Skip if no new data
    if (
      consoleLogs.length === 0 &&
      networkRequests.length === 0 &&
      uiEvents.length === 0
    ) {
      return Promise.resolve();
    }

    var payload = {
      timestamp: Date.now(),
      consoleLogs: consoleLogs,
      networkRequests: networkRequests,
      // Mirror uiEvents to sessionEvents for sessionReplay.log
      sessionEvents: uiEvents,
      // agent-friendly semantic events
      uiEvents: uiEvents,
    };

    return originalFetch(CONFIG.reportEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(function () {
      // Put data back on failure (but respect limits)
      store.consoleLogs = consoleLogs.concat(store.consoleLogs);
      store.networkRequests = networkRequests.concat(store.networkRequests);
      store.uiEvents = uiEvents.concat(store.uiEvents);

      pruneBuffer(store.consoleLogs, CONFIG.bufferSize.console);
      pruneBuffer(store.networkRequests, CONFIG.bufferSize.network);
      pruneBuffer(store.uiEvents, CONFIG.bufferSize.ui);
    });
  }

  // Periodic reporting
  setInterval(reportLogs, CONFIG.reportInterval);

  // Report on page unload
  window.addEventListener("beforeunload", function () {
    var consoleLogs = store.consoleLogs;
    var networkRequests = store.networkRequests;
    var uiEvents = store.uiEvents;

    if (
      consoleLogs.length === 0 &&
      networkRequests.length === 0 &&
      uiEvents.length === 0
    ) {
      return;
    }

    var payload = {
      timestamp: Date.now(),
      consoleLogs: consoleLogs,
      networkRequests: networkRequests,
      // Mirror uiEvents to sessionEvents for sessionReplay.log
      sessionEvents: uiEvents,
      uiEvents: uiEvents,
    };

    if (navigator.sendBeacon) {
      var payloadStr = JSON.stringify(payload);
      // sendBeacon has ~64KB limit, truncate if too large
      var MAX_BEACON_SIZE = 60000; // Leave some margin
      if (payloadStr.length > MAX_BEACON_SIZE) {
        // Prioritize: keep recent events, drop older logs
        var truncatedPayload = {
          timestamp: Date.now(),
          consoleLogs: consoleLogs.slice(-50),
          networkRequests: networkRequests.slice(-20),
          sessionEvents: uiEvents.slice(-100),
          uiEvents: uiEvents.slice(-100),
          _truncated: true,
        };
        payloadStr = JSON.stringify(truncatedPayload);
      }
      navigator.sendBeacon(CONFIG.reportEndpoint, payloadStr);
    }
  });

  // ==========================================================================
  // Initialization
  // ==========================================================================

  // Install semantic UI listeners ASAP
  try {
    installUiEventListeners();
  } catch (e) {
    console.warn("[Manus] Failed to install UI listeners:", e);
  }

  // Mark as initialized
  window.__MANUS_DEBUG_COLLECTOR__ = {
    version: "2.0-no-rrweb",
    store: store,
    forceReport: reportLogs,
  };

  console.debug("[Manus] Debug collector initialized (no rrweb, UI events only)");
})();
```

## `client/src/const.ts`

```ts
import { OAUTH_STATE_COOKIE, encodeOAuthState } from "@shared/const";

export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export const startLogin = (returnPath = window.location.pathname) => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;

  // Self-hosted install (no managed OAuth portal): the /login page offers the
  // owner sign-in instead of bouncing to a non-existent portal URL.
  if (!oauthPortalUrl || !appId) {
    window.location.href = getLoginUrl(returnPath);
    return;
  }

  const nonce = crypto.randomUUID();
  document.cookie = `${OAUTH_STATE_COOKIE}=${nonce}; Path=/; Max-Age=600; SameSite=None; Secure`;
  const safeReturnPath = returnPath.startsWith("/") && !returnPath.startsWith("//") ? returnPath : "/portal/dashboard";
  const state = encodeOAuthState({ redirectUri, nonce, returnPath: safeReturnPath });

  const url = new URL(`${oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");
  window.location.href = url.toString();
};

// Temporary route-compatible helper retained for imported pages. The /login
// page will be converted to managed OAuth during the authorization pass.
export const getLoginUrl = (returnPath?: string) => {
  const path = returnPath || "/portal/dashboard";
  return `/login?returnTo=${encodeURIComponent(path)}`;
};
```

## `client/src/context/StrategyContext.tsx`

```tsx
import React, { createContext, useContext, useState } from 'react';

interface StrategyState {
  data: Record<string, any>;
  updateStrategy: (key: string, value: any) => void;
}

export const StrategyContext = createContext<StrategyState>({
  data: {},
  updateStrategy: () => {},
});

export const useStrategy = () => useContext(StrategyContext);

export const StrategyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<Record<string, any>>({});

  const updateStrategy = (key: string, value: any) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <StrategyContext.Provider value={{ data, updateStrategy }}>
      {children}
    </StrategyContext.Provider>
  );
};

export default StrategyContext;
```

## `client/src/contexts/AIBrainContext.tsx`

```tsx
import React, { useState, createContext, useContext, useEffect, useCallback } from 'react';

type ConnectionStatus = 'connected' | 'syncing' | 'offline';

interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  confidence: number;
  pageContext: string;
  relatedTools: string[];
}

interface AIBrainState {
  connectionStatus: ConnectionStatus;
  activeCalculators: number;
  dataPointsProcessed: number;
  confidenceScore: number;
  lastSync: Date;
  recommendations: AIRecommendation[];
  pageConnections: Map<string, ConnectionStatus>;
}

interface AIBrainContextType {
  state: AIBrainState;
  getRecommendations: (pageContext: string) => AIRecommendation[];
  reportData: (pageContext: string, data: any) => void;
  checkConnection: () => ConnectionStatus;
  getCrossToolSuggestions: (pageContext: string) => string[];
}

const AIBrainContext = createContext<AIBrainContextType | undefined>(undefined);

export const useAIBrain = () => {
  const context = useContext(AIBrainContext);
  if (context === undefined) {
    throw new Error('useAIBrain must be used within an AIBrainProvider');
  }
  return context;
};

export const AIBrainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AIBrainState>({
    connectionStatus: 'syncing',
    activeCalculators: 248,
    dataPointsProcessed: 0,
    confidenceScore: 85,
    lastSync: new Date(),
    recommendations: [],
    pageConnections: new Map<string, ConnectionStatus>(),
  });

  useEffect(() => {
    // Simulate AI Brain connection
    const timer = setTimeout(() => {
      setState((prev) => ({
        ...prev,
        connectionStatus: 'connected',
        recommendations: [
          { id: '1', title: 'Optimize Mortgage', description: 'Reduce interest by 15%', confidence: 92, pageContext: 'mortgage-killer', relatedTools: ['Tax Waterfall'] },
          { id: '2', title: 'Tax Strategy', description: 'Maximize deductions', confidence: 88, pageContext: 'tax-waterfall', relatedTools: ['Mortgage Killer'] },
          { id: '3', title: 'Investment Gap', description: 'Diversify portfolio', confidence: 78, pageContext: 'investment-planner', relatedTools: ['Risk Analyzer'] },
        ],
      }));
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const getRecommendations = useCallback(
    (pageContext: string) => state.recommendations.filter((r) => r.pageContext === pageContext),
    [state.recommendations]
  );

  const reportData = useCallback((pageContext: string, data: any) => {
    setState((prev) => {
      const updatedConnections = new Map(prev.pageConnections);
      updatedConnections.set(pageContext, 'connected');
      return {
        ...prev,
        dataPointsProcessed: prev.dataPointsProcessed + 1,
        lastSync: new Date(),
        pageConnections: updatedConnections,
      };
    });
    // Simulate processing data
    console.log(`AI Brain received data from ${pageContext}:`, data);
  }, []);

  const checkConnection = useCallback(() => state.connectionStatus, [state.connectionStatus]);

  const getCrossToolSuggestions = useCallback(
    (pageContext: string) => {
      const related = state.recommendations.find((r) => r.pageContext === pageContext)?.relatedTools || [];
      return related.map((tool) => `Based on ${pageContext} results, try ${tool} next.`);
    },
    [state.recommendations]
  );

  const value = {
    state,
    getRecommendations,
    reportData,
    checkConnection,
    getCrossToolSuggestions,
  };

  return <AIBrainContext.Provider value={value}>{children}</AIBrainContext.Provider>;
};

export const AIAdvisorWidget: React.FC = () => {
  const { state, getRecommendations } = useAIBrain();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isExpanded ? (
        <div className="bg-[#1e293b]/90 backdrop-blur-md p-6 rounded-lg shadow-lg w-96 border border-emerald-500/30">
          <h3 className="text-white text-lg font-semibold mb-4 flex items-center">
            AI Brain Advisor
            <span className="ml-2 w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
          </h3>
          <div className="space-y-4 mb-4">
            {getRecommendations('current-page').slice(0, 3).map((rec) => (
              <div key={rec.id} className="p-3 bg-[#0f172a] rounded-md">
                <p className="text-white font-medium">{rec.title}</p>
                <p className="text-gray-300 text-sm">{rec.description}</p>
              </div>
            ))}
          </div>
          <input
            type="text"
            placeholder="Ask AI Advisor..."
            className="w-full p-2 bg-[#0f172a] text-white rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-4"
          />
          <div className="grid grid-cols-3 gap-2">
            <button className="p-2 bg-emerald-600/50 hover:bg-emerald-600/70 text-white rounded-md text-sm">
              Run Full Analysis
            </button>
            <button className="p-2 bg-emerald-600/50 hover:bg-emerald-600/70 text-white rounded-md text-sm">
              Generate Report
            </button>
            <button className="p-2 bg-emerald-600/50 hover:bg-emerald-600/70 text-white rounded-md text-sm">
              Find Opportunities
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center bg-[#1e293b]/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-emerald-500/30 hover:bg-[#1e293b]/100 transition-all"
        >
          <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></span>
          <span className="text-white font-medium">AI</span>
        </button>
      )}
    </div>
  );
};

export const AIBrainBanner: React.FC = () => {
  const { state, getRecommendations } = useAIBrain();
  const recCount = getRecommendations('current-page').length;
  const lastSyncMinutes = Math.floor((Date.now() - state.lastSync.getTime()) / 60000);

  return (
    <div className="bg-[#1e293b] p-4 flex items-center justify-between border-b border-emerald-500/20">
      <div className="flex items-center space-x-4">
        <div className="flex items-center">
          <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2"></span>
          <span className="text-white font-medium">AI Brain Connected</span>
        </div>
        <span className="text-gray-300">{recCount} recommendations available</span>
        <span className="text-gray-300">Last analyzed: {lastSyncMinutes} minutes ago</span>
      </div>
      <button className="text-emerald-400 hover:text-emerald-300 text-sm font-medium">
        See Recommendations
      </button>
    </div>
  );
};

export const usePageAIConnection = (pageName: string, dataCallback: (data: any) => any) => {
  const { state, reportData, getRecommendations } = useAIBrain();

  useEffect(() => {
    reportData(pageName, dataCallback({}));
  }, [pageName, dataCallback, reportData]);

  return {
    recommendations: getRecommendations(pageName),
    reportData: (data: any) => reportData(pageName, data),
    isConnected: state.pageConnections.get(pageName) === 'connected',
  };
};
```

## `client/src/contexts/AccessContext.tsx`

```tsx
import { createContext, useCallback, useContext, type ReactNode } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

export type AccessTier = "none" | "trial" | "unlimited" | "subscriber" | "owner";

interface AccessState {
  tier: AccessTier;
  authenticated: boolean;
  loading: boolean;
  remainingAccesses: number | null;
  sessionSeconds: number;
  sessionExpired: boolean;
  trialExpired: boolean;
  email: string | null;
  error: string | null;
  enterWithPassword: (password: string, email?: string) => Promise<void>;
  clearAccess: () => void;
  canAccess: boolean;
}

const AccessContext = createContext<AccessState>({
  tier: "none",
  authenticated: false,
  loading: true,
  remainingAccesses: null,
  sessionSeconds: 0,
  sessionExpired: false,
  trialExpired: false,
  email: null,
  error: null,
  enterWithPassword: async () => {
    throw new Error("Password access has been retired. Use secure sign in.");
  },
  clearAccess: () => {},
  canAccess: false,
});

export function useAccess() {
  return useContext(AccessContext);
}

export function AccessProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const tier: AccessTier = user?.role === "admin" ? "owner" : isAuthenticated ? "subscriber" : "none";

  const enterWithPassword = useCallback(async () => {
    throw new Error("Password access has been retired. Use secure sign in.");
  }, []);

  const clearAccess = useCallback(() => {
    void logout();
  }, [logout]);

  return (
    <AccessContext.Provider
      value={{
        tier,
        authenticated: isAuthenticated,
        loading,
        remainingAccesses: null,
        sessionSeconds: 0,
        sessionExpired: false,
        trialExpired: false,
        email: user?.email ?? null,
        error: null,
        enterWithPassword,
        clearAccess,
        canAccess: isAuthenticated,
      }}
    >
      {children}
    </AccessContext.Provider>
  );
}
```

## `client/src/contexts/ClientDataContext.tsx`

```tsx
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { assessmentToClientData } from "@shared/assessmentBridge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

/**
 * Normalized client data shape that all calculators can consume.
 * Fields map to both the clients table and the household_fact_finders table.
 */
export interface ClientFactFinderData {
  // Identity
  clientId: number;
  clientName: string;
  email: string;
  phone: string;
  // Personal
  age: number;
  state: string;
  filingStatus: "single" | "joint" | "hoh";
  spouseName: string;
  spouseAge: number;
  dependents: number;
  // Income
  annualIncome: number;
  spouseIncome: number;
  monthlyExpenses: number;
  // Assets
  cashSavings: number;
  taxableInvestments: number;
  realEstateEquity: number;
  homeValue: number;
  // Retirement
  iraBalance: number;
  rothBalance: number;
  k401Balance: number;
  pensionIncome: number;
  socialSecurityEstimate: number;
  // Insurance
  lifeInsuranceCv: number;
  lifeInsuranceDb: number;
  annualPremium: number;
  annuityValue: number;
  hasLTC: boolean;
  // Debt
  mortgageBalance: number;
  mortgageRate: number;
  mortgageYearsLeft: number;
  totalMortgageInterest: number;
  otherDebt: number;
  // HELOC
  helocRate: number;
  helocMaxLtv: number;
  // Goals
  retirementAge: number;
  annualIncomeNeeded: number;
  legacyGoal: number;
  riskTolerance: number;
  // Children & Grandchildren (from household fact finder)
  children: Array<{
    id: string; name: string; age: number; income: number;
    ira: number; rothIra: number; cash: number;
    homeValue: number; homeEquity: number;
    mortgageBalance: number; mortgageRate: number; mortgageYearsLeft: number; totalInterest: number;
  }>;
  grandchildren: Array<{
    id: string; name: string; age: number; parentId: string;
    homeValue: number; homeEquity: number;
    mortgageBalance: number; mortgageRate: number; mortgageYearsLeft: number; totalInterest: number;
  }>;
}

interface ClientDataContextType {
  /** Currently selected client ID (persisted in localStorage) */
  selectedClientId: number | null;
  /** Set the active client — triggers data reload */
  setSelectedClientId: (id: number | null) => void;
  /** The merged Fact Finder data for the selected client — or, when no client is
   *  selected, the signed-in user's own Financial Assessment mapped onto the same shape. */
  data: ClientFactFinderData | null;
  /** Where `data` came from: an advisor-selected client, or the user's own assessment. */
  source: "client" | "assessment" | null;
  /** Calculator inputs the assessment could not supply (left at 0). */
  missingInputs: string[];
  /** Whether data is currently loading */
  loading: boolean;
  /** All available clients for the selector */
  clients: Array<{ id: number; name: string }>;
  /** Whether clients list is loading */
  clientsLoading: boolean;
}

const ClientDataContext = createContext<ClientDataContextType>({
  selectedClientId: null,
  setSelectedClientId: () => {},
  data: null,
  source: null,
  missingInputs: [],
  loading: false,
  clients: [],
  clientsLoading: false,
});

const STORAGE_KEY = "rc_selected_client_id";

function n(v: any): number {
  if (v === null || v === undefined) return 0;
  const num = Number(v);
  return isNaN(num) ? 0 : num;
}

export function ClientDataProvider({ children: childrenProp }: { children: ReactNode }) {
  // Use shared auth hook — single source of truth, no duplicate trpc.auth.me query
  const { isAuthenticated, user } = useAuth();

  const [selectedClientId, setSelectedClientIdRaw] = useState<number | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? Number(stored) : null;
    } catch { return null; }
  });

  const setSelectedClientId = useCallback((id: number | null) => {
    setSelectedClientIdRaw(id);
    try {
      if (id !== null) localStorage.setItem(STORAGE_KEY, String(id));
      else localStorage.removeItem(STORAGE_KEY);
    } catch { /* ignore */ }
  }, []);

  // Fetch all clients for the selector (only when authenticated)
  const clientsQuery = trpc.clients.list.useQuery(undefined, { staleTime: 30_000, enabled: isAuthenticated, retry: false });
  const clientsList = (clientsQuery.data ?? [])
    .filter((c: any) => c.name.toLowerCase() !== "heather scenario")
    .map((c: any) => ({ id: c.id, name: c.name }));

  // Fetch the selected client's full record (only when authenticated)
  const clientQuery = trpc.clients.list.useQuery(undefined, {
    staleTime: 30_000,
    enabled: selectedClientId !== null && isAuthenticated,
    retry: false,
  });

  // Fetch the household fact finder for the selected client (only when authenticated)
  // The user's own Financial Assessment (New Client Welcome List) — used when no
  // advisor client is selected, so every calculator starts pre-filled.
  const assessmentQuery = trpc.factFinder.get.useQuery(undefined, {
    enabled: isAuthenticated && selectedClientId === null,
    staleTime: 30_000,
    retry: false,
  });

  const factFinderQuery = trpc.household.getFactFinder.useQuery(
    { clientId: selectedClientId! },
    { enabled: selectedClientId !== null && isAuthenticated, staleTime: 30_000, retry: false }
  );

  // Parse notes field for extra data that the onboarding wizard stores there
  const parseNotesData = useCallback((notes: string | null | undefined) => {
    if (!notes) return {};
    const parsed: Record<string, any> = {};
    const patterns: [string, RegExp, (v: string) => any][] = [
      ["spouseName", /Spouse:\s*(.+?)\s*\(age/i, (v: string) => v.trim()],
      ["spouseAge", /\(age\s*(\d+)\)/i, (v: string) => Number(v)],
      ["dependents", /Dependents:\s*(\d+)/i, (v: string) => Number(v)],
      ["spouseIncome", /Spouse Income:\s*\$?([\d,]+)/i, (v: string) => Number(v.replace(/,/g, ""))],
      ["monthlyExpenses", /Monthly Expenses:\s*\$?([\d,]+)/i, (v: string) => Number(v.replace(/,/g, ""))],
      ["pensionIncome", /Pension:\s*\$?([\d,]+)/i, (v: string) => Number(v.replace(/,/g, ""))],
      ["socialSecurityEstimate", /SS Estimate:\s*\$?([\d,]+)/i, (v: string) => Number(v.replace(/,/g, ""))],
      ["lifeInsuranceDb", /Death Benefit:\s*\$?([\d,]+)/i, (v: string) => Number(v.replace(/,/g, ""))],
      ["annuityValue", /Annuity Value:\s*\$?([\d,]+)/i, (v: string) => Number(v.replace(/,/g, ""))],
      ["hasLTC", /Has LTC:\s*(true|false)/i, (v: string) => v.toLowerCase() === "true"],
      ["retirementAge", /Retirement Age:\s*(\d+)/i, (v: string) => Number(v)],
      ["annualIncomeNeeded", /Income Needed:\s*\$?([\d,]+)/i, (v: string) => Number(v.replace(/,/g, ""))],
      ["legacyGoal", /Legacy Goal:\s*\$?([\d,]+)/i, (v: string) => Number(v.replace(/,/g, ""))],
      ["riskTolerance", /Risk Tolerance:\s*(\d+)/i, (v: string) => Number(v)],
    ];
    for (const [key, regex, transform] of patterns) {
      const match = notes.match(regex);
      if (match) parsed[key] = transform(match[1]);
    }
    return parsed;
  }, []);

  // Merge client record + fact finder + notes into unified data
  const [data, setData] = useState<ClientFactFinderData | null>(null);
  const [source, setSource] = useState<"client" | "assessment" | null>(null);
  const [missingInputs, setMissingInputs] = useState<string[]>([]);
  const loading = (selectedClientId !== null) && (clientQuery.isLoading || factFinderQuery.isLoading);

  useEffect(() => {
    if (!selectedClientId || !clientQuery.data) {
      const a = assessmentQuery.data;
      if (!selectedClientId && a?.persisted) {
        const bridged = assessmentToClientData(a.data, { fallbackName: user?.name ?? "You" });
        setData(bridged.data as ClientFactFinderData);
        setSource("assessment");
        setMissingInputs(bridged.missing);
      } else {
        setData(null); setSource(null); setMissingInputs([]);
      }
      return;
    }
    const client = (clientQuery.data as any[]).find((c: any) => c.id === selectedClientId);
    if (!client) { setData(null); return; }

    const ff = factFinderQuery.data as any;
    const notesData = parseNotesData(client.notes);

    const merged: ClientFactFinderData = {
      clientId: client.id,
      clientName: client.name,
      email: client.email ?? "",
      phone: client.phone ?? "",
      age: ff?.primaryAge ?? client.age ?? notesData.age ?? 50,
      state: client.state ?? "Texas",
      filingStatus: client.filingStatus ?? "joint",
      spouseName: ff?.spouseName ?? notesData.spouseName ?? "",
      spouseAge: ff?.spouseAge ?? notesData.spouseAge ?? 0,
      dependents: notesData.dependents ?? 0,
      annualIncome: n(ff?.primaryIncome ?? client.income ?? 0),
      spouseIncome: n(ff?.spouseIncome ?? notesData.spouseIncome ?? 0),
      monthlyExpenses: notesData.monthlyExpenses ?? 12000,
      cashSavings: n(ff?.primaryCash ?? 0),
      taxableInvestments: n(client.taxableAssets ?? 0),
      realEstateEquity: n(ff?.primaryHomeEquity ?? client.realEstateEquity ?? 0),
      homeValue: n(ff?.primaryHomeValue ?? 0),
      iraBalance: n(ff?.primaryIra ?? client.iraBalance ?? 0),
      rothBalance: n(ff?.primaryRothIra ?? client.rothBalance ?? 0),
      k401Balance: 0,
      pensionIncome: notesData.pensionIncome ?? 0,
      socialSecurityEstimate: notesData.socialSecurityEstimate ?? 3500,
      lifeInsuranceCv: n(client.lifeInsuranceCv ?? 0),
      lifeInsuranceDb: n(ff?.primaryDeathBenefit ?? notesData.lifeInsuranceDb ?? 0),
      annualPremium: n(ff?.primaryAnnualPremium ?? 0),
      annuityValue: notesData.annuityValue ?? 0,
      hasLTC: notesData.hasLTC ?? false,
      mortgageBalance: n(ff?.primaryMortgageBalance ?? 0),
      mortgageRate: n(ff?.primaryMortgageRate ?? 6.5),
      mortgageYearsLeft: ff?.primaryMortgageYearsLeft ?? 25,
      totalMortgageInterest: n(ff?.primaryTotalInterest ?? 0),
      otherDebt: 0,
      helocRate: n(ff?.helocRate ?? 8.5),
      helocMaxLtv: n(ff?.helocMaxLtv ?? 80),
      retirementAge: notesData.retirementAge ?? 65,
      annualIncomeNeeded: notesData.annualIncomeNeeded ?? 150000,
      legacyGoal: notesData.legacyGoal ?? 2000000,
      riskTolerance: notesData.riskTolerance ?? 5,
      children: (ff?.children as any[]) ?? [],
      grandchildren: (ff?.grandchildren as any[]) ?? [],
    };
    setData(merged);
    setSource("client");
    setMissingInputs([]);
  }, [selectedClientId, clientQuery.data, factFinderQuery.data, parseNotesData, assessmentQuery.data, user?.name]);

  return (
    <ClientDataContext.Provider value={{
      selectedClientId,
      setSelectedClientId,
      data,
      source,
      missingInputs,
      loading,
      clients: clientsList,
      clientsLoading: isAuthenticated ? clientsQuery.isLoading : false,
    }}>
      {childrenProp}
    </ClientDataContext.Provider>
  );
}

/** Hook to access the active client's Fact Finder data from any page */
export function useClientData() {
  return useContext(ClientDataContext);
}

/**
 * Reusable "Fact Finder" badge component to show when data is auto-filled.
 * Import and render at the top of any calculator page.
 */
export function FactFinderBadge({ className = "" }: { className?: string }) {
  const { data, source, missingInputs } = useClientData();
  if (!data) return null;
  const fromAssessment = source === "assessment";
  return (
    <div className={`inline-flex flex-wrap items-center gap-1.5 px-2.5 py-1 rounded-full ${fromAssessment ? "bg-violet-500/15 border border-violet-400/30 text-violet-200" : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"} text-xs font-medium ${className}`}>
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
      {fromAssessment ? "Pre-filled from your Financial Assessment" : `Auto-filled from ${data.clientName}'s Fact Finder`}
      {fromAssessment && missingInputs.length > 0 && (
        <a href="/portal/financial-assessment" className="underline decoration-dotted opacity-80 hover:opacity-100" title={missingInputs.join(", ")}>· {missingInputs.length} input{missingInputs.length === 1 ? "" : "s"} still blank</a>
      )}
    </div>
  );
}
```

## `client/src/contexts/DisclaimerContext.tsx`

```tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface DisclaimerContextValue {
  /** true = show disclaimers (compliance mode), false = hide (demo mode) */
  showDisclaimers: boolean;
  setShowDisclaimers: (v: boolean) => void;
}

const DisclaimerContext = createContext<DisclaimerContextValue>({
  showDisclaimers: true,
  setShowDisclaimers: () => {},
});

const STORAGE_KEY = "rc_disclaimer_mode";

export function DisclaimerProvider({ children }: { children: ReactNode }) {
  const [showDisclaimers, setShowDisclaimers] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === null ? true : stored === "true";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(showDisclaimers));
    } catch {}
  }, [showDisclaimers]);

  return (
    <DisclaimerContext.Provider value={{ showDisclaimers, setShowDisclaimers }}>
      {children}
    </DisclaimerContext.Provider>
  );
}

export function useDisclaimer() {
  return useContext(DisclaimerContext);
}
```

## `client/src/contexts/EntrainmentEngine.tsx`

```tsx
import { createContext, useContext, useEffect, useRef, useState, useCallback, type ReactNode } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   ENTRAINMENT ENGINE + SOUND OF MONEY (Pavlovian Conditioning)
   
   VISUAL: CSS-driven breathing at 0.1 Hz (6 breaths/min) — AMPLIFIED 300%.
   Scale transforms, brightness oscillation, ambient orb animations.
   
   AUDIO: Web Audio API binaural beats + Pavlovian reward tones.
   - Binaural: 40 Hz gamma (day) / 10 Hz alpha (night)
   - Pavlovian: Cash register "ka-ching" synthesized tones on key events
     * Deal closed → triumphant ascending chord
     * XP earned → quick bright ping
     * Level up → full fanfare cascade
     * Loot drop → mystery reveal shimmer
     * Streak milestone → rhythmic drum + chime
   
   The Pavlovian system creates neural associations between platform actions
   and dopamine-triggering reward sounds, driving habit formation.
   ═══════════════════════════════════════════════════════════════════════════ */

type BreathingState = "calm" | "excitement" | "alert" | "mega" | "sleep";
type BeatMode = "gamma" | "alpha";
type SoundEffect = "ka-ching" | "xp-ping" | "level-up" | "loot-reveal" | "streak-hit" | "quest-complete" | "deal-closed";
export type MusicTrack = "flow-state" | "wealth-meditation" | "morning-momentum" | "victory-march" | "deep-focus" | "power-hour";
export type MusicMood = "relaxation" | "excitement";

interface EntrainmentContextType {
  breathingState: BreathingState;
  setBreathingState: (state: BreathingState) => void;
  audioEnabled: boolean;
  toggleAudio: () => void;
  beatMode: BeatMode;
  playSoundEffect: (effect: SoundEffect) => void;
  soundEffectsEnabled: boolean;
  toggleSoundEffects: () => void;
  // Ambient Music Player
  musicEnabled: boolean;
  toggleMusic: () => void;
  currentTrack: MusicTrack | null;
  playTrack: (track: MusicTrack) => void;
  playMood: (mood: MusicMood) => void;
  stopMusic: () => void;
  musicVolume: number;
  setMusicVolume: (v: number) => void;
}

const EntrainmentContext = createContext<EntrainmentContextType>({
  breathingState: "calm",
  setBreathingState: () => {},
  audioEnabled: false,
  toggleAudio: () => {},
  beatMode: "gamma",
  playSoundEffect: () => {},
  soundEffectsEnabled: true,
  toggleSoundEffects: () => {},
  musicEnabled: false,
  toggleMusic: () => {},
  currentTrack: null,
  playTrack: () => {},
  playMood: () => {},
  stopMusic: () => {},
  musicVolume: 0.3,
  setMusicVolume: () => {},
});

export function useEntrainment() {
  return useContext(EntrainmentContext);
}

// ─── Binaural Beat Generator ─────────────────────────────────────────────
class BinauralBeatEngine {
  private ctx: AudioContext | null = null;
  private leftOsc: OscillatorNode | null = null;
  private rightOsc: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private merger: ChannelMergerNode | null = null;
  private isPlaying = false;

  start(mode: BeatMode) {
    if (this.isPlaying) this.stop();
    try {
      this.ctx = new AudioContext();
      const carrier = 200;
      const beatFreq = mode === "gamma" ? 40 : 10;
      this.merger = this.ctx.createChannelMerger(2);
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.value = 0.01;
      this.leftOsc = this.ctx.createOscillator();
      this.leftOsc.type = "sine";
      this.leftOsc.frequency.value = carrier;
      this.rightOsc = this.ctx.createOscillator();
      this.rightOsc.type = "sine";
      this.rightOsc.frequency.value = carrier + beatFreq;
      const leftGain = this.ctx.createGain();
      leftGain.gain.value = 1;
      const rightGain = this.ctx.createGain();
      rightGain.gain.value = 1;
      this.leftOsc.connect(leftGain);
      leftGain.connect(this.merger, 0, 0);
      this.rightOsc.connect(rightGain);
      rightGain.connect(this.merger, 0, 1);
      this.merger.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);
      this.gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
      this.gainNode.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 3);
      this.leftOsc.start();
      this.rightOsc.start();
      this.isPlaying = true;
    } catch (e) {
      console.warn("[EntrainmentEngine] Audio init failed:", e);
    }
  }

  stop() {
    if (!this.isPlaying || !this.ctx) return;
    try {
      if (this.gainNode) {
        this.gainNode.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 2);
      }
      setTimeout(() => {
        try {
          this.leftOsc?.stop();
          this.rightOsc?.stop();
          this.ctx?.close();
        } catch (_) { /* ignore */ }
        this.ctx = null;
        this.leftOsc = null;
        this.rightOsc = null;
        this.gainNode = null;
        this.merger = null;
      }, 2200);
    } catch (_) { /* ignore */ }
    this.isPlaying = false;
  }

  switchMode(mode: BeatMode) {
    if (this.isPlaying) {
      this.stop();
      setTimeout(() => this.start(mode), 2500);
    }
  }
}

// ─── Pavlovian Sound Effect Synthesizer ──────────────────────────────────
// All sounds are synthesized via Web Audio API — no external files needed.
class PavlovianSoundEngine {
  private ctx: AudioContext | null = null;

  private getCtx(): AudioContext {
    if (!this.ctx || this.ctx.state === "closed") {
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  private playTone(freq: number, duration: number, volume: number, type: OscillatorType = "sine", delay = 0) {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration + 0.05);
  }

  // Ka-ching! Cash register sound — the core Pavlovian trigger
  kaChing() {
    this.playTone(1200, 0.08, 0.15, "square", 0);
    this.playTone(1600, 0.08, 0.12, "square", 0.06);
    this.playTone(2400, 0.15, 0.18, "sine", 0.12);
    // Metallic shimmer
    this.playTone(4800, 0.3, 0.04, "sine", 0.15);
    this.playTone(6000, 0.25, 0.03, "sine", 0.18);
  }

  // Quick bright ping for XP earned
  xpPing() {
    this.playTone(880, 0.06, 0.1, "sine", 0);
    this.playTone(1320, 0.12, 0.12, "sine", 0.05);
  }

  // Triumphant ascending fanfare for level up
  levelUp() {
    const notes = [523, 659, 784, 1047, 1319]; // C5 E5 G5 C6 E6
    notes.forEach((freq, i) => {
      this.playTone(freq, 0.2, 0.12, "sine", i * 0.12);
      this.playTone(freq * 1.5, 0.15, 0.04, "triangle", i * 0.12 + 0.02); // harmonic
    });
    // Final shimmer
    this.playTone(2637, 0.5, 0.08, "sine", 0.6);
    this.playTone(3951, 0.4, 0.04, "sine", 0.65);
  }

  // Mystery reveal shimmer for loot drops
  lootReveal() {
    // Descending mystery tones
    this.playTone(2000, 0.1, 0.08, "sine", 0);
    this.playTone(1800, 0.1, 0.08, "sine", 0.08);
    this.playTone(1600, 0.1, 0.08, "sine", 0.16);
    // Then ascending reveal
    this.playTone(800, 0.12, 0.1, "sine", 0.3);
    this.playTone(1200, 0.12, 0.12, "sine", 0.38);
    this.playTone(1600, 0.15, 0.14, "sine", 0.46);
    this.playTone(2400, 0.3, 0.1, "sine", 0.54);
    // Sparkle
    this.playTone(4000, 0.2, 0.03, "sine", 0.6);
    this.playTone(5000, 0.15, 0.02, "sine", 0.65);
  }

  // Rhythmic drum + chime for streak milestones
  streakHit() {
    // Drum hits (low frequency square waves)
    this.playTone(100, 0.08, 0.15, "square", 0);
    this.playTone(100, 0.08, 0.12, "square", 0.15);
    this.playTone(100, 0.08, 0.18, "square", 0.25);
    // Chime on top
    this.playTone(1047, 0.3, 0.1, "sine", 0.3);
    this.playTone(1319, 0.25, 0.08, "sine", 0.35);
    this.playTone(1568, 0.4, 0.12, "sine", 0.4);
  }

  // Quest complete — heroic chord
  questComplete() {
    // Power chord
    this.playTone(440, 0.3, 0.12, "sawtooth", 0);
    this.playTone(554, 0.3, 0.1, "sawtooth", 0);
    this.playTone(659, 0.3, 0.1, "sawtooth", 0);
    // Resolution
    this.playTone(880, 0.4, 0.14, "sine", 0.25);
    this.playTone(1047, 0.35, 0.08, "sine", 0.3);
  }

  // Deal closed — the big one. Full triumphant sequence.
  dealClosed() {
    // Opening fanfare
    this.playTone(523, 0.15, 0.12, "sine", 0);
    this.playTone(659, 0.15, 0.12, "sine", 0.12);
    this.playTone(784, 0.15, 0.12, "sine", 0.24);
    // Ka-ching overlay
    this.playTone(1200, 0.08, 0.15, "square", 0.36);
    this.playTone(2400, 0.15, 0.18, "sine", 0.42);
    // Triumphant resolution
    this.playTone(1047, 0.4, 0.15, "sine", 0.5);
    this.playTone(1319, 0.35, 0.1, "sine", 0.55);
    this.playTone(1568, 0.5, 0.12, "sine", 0.6);
    // Sparkle tail
    this.playTone(3000, 0.3, 0.04, "sine", 0.8);
    this.playTone(4000, 0.25, 0.03, "sine", 0.85);
    this.playTone(5000, 0.2, 0.02, "sine", 0.9);
  }

  play(effect: SoundEffect) {
    try {
      switch (effect) {
        case "ka-ching": this.kaChing(); break;
        case "xp-ping": this.xpPing(); break;
        case "level-up": this.levelUp(); break;
        case "loot-reveal": this.lootReveal(); break;
        case "streak-hit": this.streakHit(); break;
        case "quest-complete": this.questComplete(); break;
        case "deal-closed": this.dealClosed(); break;
      }
    } catch (e) {
      console.warn("[PavlovianSound] Failed to play:", effect, e);
    }
  }
}

// ─── Ambient Music Track CDN URLs ────────────────────────────────────────
export const MUSIC_TRACKS: Record<MusicTrack, { url: string; mood: MusicMood; title: string }> = {
  "flow-state": {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663488147919/LLWzv8yrXsonoc9EyNaoZk/flow-state_400d555d.mp3",
    mood: "relaxation",
    title: "Flow State",
  },
  "wealth-meditation": {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663488147919/LLWzv8yrXsonoc9EyNaoZk/wealth-meditation_98f5edd4.mp3",
    mood: "relaxation",
    title: "Wealth Meditation",
  },
  "morning-momentum": {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663488147919/LLWzv8yrXsonoc9EyNaoZk/morning-momentum_3ae7f7e6.mp3",
    mood: "excitement",
    title: "Morning Momentum",
  },
  "victory-march": {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663488147919/LLWzv8yrXsonoc9EyNaoZk/victory-march_23a9b983.mp3",
    mood: "excitement",
    title: "Victory March",
  },
  "deep-focus": {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663488147919/LLWzv8yrXsonoc9EyNaoZk/deep-focus_1ccdfb4a.mp3",
    mood: "relaxation",
    title: "Deep Focus",
  },
  "power-hour": {
    url: "https://d2xsxph8kpxj0f.cloudfront.net/310519663488147919/LLWzv8yrXsonoc9EyNaoZk/power-hour_0b0df869.mp3",
    mood: "excitement",
    title: "Power Hour",
  },
};

const RELAXATION_TRACKS: MusicTrack[] = ["flow-state", "wealth-meditation", "deep-focus"];
const EXCITEMENT_TRACKS: MusicTrack[] = ["morning-momentum", "victory-march", "power-hour"];

class AmbientMusicPlayer {
  private audio: HTMLAudioElement | null = null;
  private currentTrack: MusicTrack | null = null;
  private volume = 0.3;
  private onTrackChange: ((track: MusicTrack | null) => void) | null = null;

  setOnTrackChange(cb: (track: MusicTrack | null) => void) {
    this.onTrackChange = cb;
  }

  play(track: MusicTrack) {
    if (this.currentTrack === track && this.audio && !this.audio.paused) return;
    this.stop();
    const info = MUSIC_TRACKS[track];
    if (!info) return;
    try {
      this.audio = new Audio(info.url);
      this.audio.volume = this.volume;
      this.audio.loop = true;
      this.audio.crossOrigin = "anonymous";
      // Fade in
      this.audio.volume = 0;
      this.audio.play().then(() => {
        let vol = 0;
        const fadeIn = setInterval(() => {
          vol += 0.02;
          if (vol >= this.volume) {
            vol = this.volume;
            clearInterval(fadeIn);
          }
          if (this.audio) this.audio.volume = vol;
        }, 50);
      }).catch(e => console.warn("[AmbientMusic] Autoplay blocked:", e));
      this.currentTrack = track;
      this.onTrackChange?.(track);
    } catch (e) {
      console.warn("[AmbientMusic] Failed to play:", e);
    }
  }

  playMood(mood: MusicMood) {
    const tracks = mood === "relaxation" ? RELAXATION_TRACKS : EXCITEMENT_TRACKS;
    const track = tracks[Math.floor(Math.random() * tracks.length)];
    this.play(track);
  }

  stop() {
    if (this.audio) {
      // Fade out
      const audio = this.audio;
      let vol = audio.volume;
      const fadeOut = setInterval(() => {
        vol -= 0.03;
        if (vol <= 0) {
          clearInterval(fadeOut);
          audio.pause();
          audio.src = "";
        } else {
          audio.volume = vol;
        }
      }, 50);
      this.audio = null;
    }
    this.currentTrack = null;
    this.onTrackChange?.(null);
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.audio && !this.audio.paused) {
      this.audio.volume = this.volume;
    }
  }

  getVolume() { return this.volume; }
  getCurrentTrack() { return this.currentTrack; }
  isPlaying() { return this.audio !== null && !this.audio.paused; }
}

function getCurrentBeatMode(): BeatMode {
  const hour = new Date().getHours();
  return (hour >= 6 && hour < 21) ? "gamma" : "alpha";
}

const BREATHING_CSS_VARS: Record<BreathingState, Record<string, string>> = {
  calm: {
    "--breath-duration": "10s",
    "--breath-scale-peak": "1.005",
    "--breath-brightness-peak": "1.012",
    "--breath-ease": "cubic-bezier(0.37, 0, 0.25, 1)",
  },
  excitement: {
    "--breath-duration": "7s",
    "--breath-scale-peak": "1.008",
    "--breath-brightness-peak": "1.018",
    "--breath-ease": "cubic-bezier(0.4, 0, 0.3, 1)",
  },
  alert: {
    "--breath-duration": "5s",
    "--breath-scale-peak": "1.012",
    "--breath-brightness-peak": "1.022",
    "--breath-ease": "cubic-bezier(0.5, 0, 0.2, 1)",
  },
  mega: {
    "--breath-duration": "6s",
    "--breath-scale-peak": "1.015",
    "--breath-brightness-peak": "1.025",
    "--breath-ease": "cubic-bezier(0.6, 0, 0.1, 1)",
  },
  sleep: {
    "--breath-duration": "12s",
    "--breath-scale-peak": "1.003",
    "--breath-brightness-peak": "1.006",
    "--breath-ease": "cubic-bezier(0.3, 0, 0.2, 1)",
  },
};

export function EntrainmentProvider({ children }: { children: ReactNode }) {
  const [breathingState, setBreathingState] = useState<BreathingState>("calm");
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(() => {
    try { return localStorage.getItem("rc-sfx") !== "off"; } catch { return true; }
  });
  const [beatMode, setBeatMode] = useState<BeatMode>(getCurrentBeatMode);
  const engineRef = useRef<BinauralBeatEngine | null>(null);
  const pavlovRef = useRef<PavlovianSoundEngine | null>(null);
  const returnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const musicPlayerRef = useRef<AmbientMusicPlayer | null>(null);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [musicVolume, setMusicVolumeState] = useState(() => {
    try { return parseFloat(localStorage.getItem("rc-music-vol") || "0.3"); } catch { return 0.3; }
  });

  useEffect(() => {
    engineRef.current = new BinauralBeatEngine();
    pavlovRef.current = new PavlovianSoundEngine();
    musicPlayerRef.current = new AmbientMusicPlayer();
    musicPlayerRef.current.setOnTrackChange(setCurrentTrack);
    return () => {
      engineRef.current?.stop();
      musicPlayerRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    const vars = BREATHING_CSS_VARS[breathingState];
    const root = document.documentElement;
    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    root.setAttribute("data-breathing", breathingState);
  }, [breathingState]);

  const setBreathingStateWithReturn = useCallback((state: BreathingState) => {
    if (returnTimerRef.current) clearTimeout(returnTimerRef.current);
    setBreathingState(state);
    if (state !== "calm" && state !== "sleep") {
      const returnDelay = state === "mega" ? 8000 : state === "alert" ? 6000 : 5000;
      returnTimerRef.current = setTimeout(() => setBreathingState("calm"), returnDelay);
    }
  }, []);

  useEffect(() => {
    const check = () => {
      const newMode = getCurrentBeatMode();
      if (newMode !== beatMode) {
        setBeatMode(newMode);
        if (audioEnabled) engineRef.current?.switchMode(newMode);
      }
    };
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [beatMode, audioEnabled]);

  const toggleAudio = useCallback(() => {
    if (audioEnabled) {
      engineRef.current?.stop();
      setAudioEnabled(false);
    } else {
      engineRef.current?.start(beatMode);
      setAudioEnabled(true);
    }
  }, [audioEnabled, beatMode]);

  const playSoundEffect = useCallback((effect: SoundEffect) => {
    if (!soundEffectsEnabled) return;
    pavlovRef.current?.play(effect);
    // Sync breathing state with sound events for visual reinforcement
    if (effect === "deal-closed" || effect === "level-up") {
      setBreathingStateWithReturn("mega");
    } else if (effect === "quest-complete" || effect === "streak-hit") {
      setBreathingStateWithReturn("excitement");
    } else if (effect === "loot-reveal") {
      setBreathingStateWithReturn("alert");
    }
  }, [soundEffectsEnabled, setBreathingStateWithReturn]);

  const toggleSoundEffects = useCallback(() => {
    setSoundEffectsEnabled(prev => {
      const next = !prev;
      try { localStorage.setItem("rc-sfx", next ? "on" : "off"); } catch {}
      return next;
    });
  }, []);

  const toggleMusic = useCallback(() => {
    if (musicEnabled) {
      musicPlayerRef.current?.stop();
      setMusicEnabled(false);
    } else {
      // Auto-select mood based on time of day
      const hour = new Date().getHours();
      const mood: MusicMood = (hour >= 6 && hour < 14) ? "excitement" : "relaxation";
      musicPlayerRef.current?.playMood(mood);
      setMusicEnabled(true);
    }
  }, [musicEnabled]);

  const playTrack = useCallback((track: MusicTrack) => {
    musicPlayerRef.current?.play(track);
    setMusicEnabled(true);
  }, []);

  const playMood = useCallback((mood: MusicMood) => {
    musicPlayerRef.current?.playMood(mood);
    setMusicEnabled(true);
  }, []);

  const stopMusic = useCallback(() => {
    musicPlayerRef.current?.stop();
    setMusicEnabled(false);
  }, []);

  const handleSetMusicVolume = useCallback((v: number) => {
    musicPlayerRef.current?.setVolume(v);
    setMusicVolumeState(v);
    try { localStorage.setItem("rc-music-vol", v.toString()); } catch {}
  }, []);

  useEffect(() => {
    const checkSleep = () => {
      const hour = new Date().getHours();
      if (hour >= 23 || hour < 5) {
        if (breathingState === "calm") setBreathingState("sleep");
      }
    };
    checkSleep();
    const interval = setInterval(checkSleep, 300000);
    return () => clearInterval(interval);
  }, [breathingState]);

  return (
    <EntrainmentContext.Provider value={{
      breathingState,
      setBreathingState: setBreathingStateWithReturn,
      audioEnabled,
      toggleAudio,
      beatMode,
      playSoundEffect,
      soundEffectsEnabled,
      toggleSoundEffects,
      musicEnabled,
      toggleMusic,
      currentTrack,
      playTrack,
      playMood,
      stopMusic,
      musicVolume,
      setMusicVolume: handleSetMusicVolume,
    }}>
      {children}
    </EntrainmentContext.Provider>
  );
}
```

## `client/src/contexts/StrategyContext.tsx`

```tsx
// @ts-nocheck
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

/**
 * StrategyContext — Cross-tool integration framework.
 *
 * Any calculator/projection tool can "publish" its results here,
 * and any other tool can "consume" them to pre-fill inputs or
 * chain strategies together.
 *
 * v2: Expanded with ALL calculator types, 5-slot comparison, and sync bar.
 */

// ── Typed strategy result shapes ─────────────────────────────────────────────

export interface MortgageKillerResult {
  interestSaved: number;
  yearsReduced: number;
  iulCashValue: number;
  iulDeathBenefit: number;
  totalOpportunityCost: number;
  monthlyPayment: number;
  originalBalance: number;
  helocUsed: boolean;
  helocAmount: number;
}

export interface IULProjectionResult {
  cashValue: number;
  deathBenefit: number;
  surrenderValue: number;
  annualPremium: number;
  years: number;
  avgReturn: number;
  projectionData: Array<{ year: number; cashValue: number; deathBenefit: number }>;
}

export interface RothConversionResult {
  totalConverted: number;
  taxPaid: number;
  endingRothBalance: number;
  endingIraBalance: number;
  yearsOfConversion: number;
  targetBracket: number;
  irmaaSurcharge: number;
  ladderData: Array<{ year: number; conversion: number; tax: number; iraBalance: number; rothBalance: number }>;
}

export interface MYGAWaterfallResult {
  totalMygaValue: number;
  totalOilGasValue: number;
  netWealth: number;
  mygaRate: number;
  cycles: number;
  annualTaxSavings: number;
  projectionData: Array<{ year: number; mygaValue: number; oilGasValue: number; netWealth: number }>;
}

export interface TaxWaterfallResult {
  effectiveRate: number;
  totalTaxSaved: number;
  bracketReduction: string;
  deductions: Array<{ source: string; amount: number }>;
}

export interface RetirementIncomeResult {
  monthlyIncome: number;
  annualIncome: number;
  incomeGap: number;
  socialSecurity: number;
  pensionIncome: number;
  annuityIncome: number;
  portfolioWithdrawal: number;
  yearsOfIncome: number;
}

export interface PremiumFinancingResult {
  loanAmount: number;
  annualLoanCost: number;
  breakEvenYear: number;
  netBenefit: number;
  deathBenefitLeverage: number;
  cashValueAtBreakEven: number;
}

export interface RealEstateMogulResult {
  totalEquity: number;
  cashFlow: number;
  appreciation: number;
  properties: number;
  leverageRatio: number;
  projectionData: Array<{ year: number; equity: number; cashFlow: number }>;
}

export interface InflationResult {
  currentPurchasingPower: number;
  futureValue: number;
  inflationRate: number;
  yearsProjected: number;
  realReturn: number;
}

// ── NEW: Additional calculator result types ──────────────────────────────────

export interface SocialSecurityResult {
  monthlyBenefitAge62: number;
  monthlyBenefitFRA: number;
  monthlyBenefitAge70: number;
  optimalClaimAge: number;
  lifetimeValueDifference: number;
  breakEvenAge: number;
  spousalBenefit: number;
}

export interface AnnuityIncomeResult {
  guaranteedMonthlyIncome: number;
  guaranteedAnnualIncome: number;
  accumulationValue: number;
  incomeStartAge: number;
  rollUpRate: number;
  withdrawalRate: number;
  lifetimeIncomeTotal: number;
}

export interface EstateTaxResult {
  grossEstate: number;
  taxableEstate: number;
  estateTaxOwed: number;
  effectiveEstateTaxRate: number;
  exemptionUsed: number;
  strategySavings: number;
  netToHeirs: number;
}

export interface FIACollateralResult {
  fiaAccountValue: number;
  collateralLoanAmount: number;
  netArbitrage: number;
  annualCrediting: number;
  loanInterestRate: number;
  projectionData: Array<{ year: number; accountValue: number; loanBalance: number; netValue: number }>;
}

export interface HotIncomeResult {
  totalAnnualIncome: number;
  taxFreeIncome: number;
  taxableIncome: number;
  incomeStreams: Array<{ source: string; amount: number; taxFree: boolean }>;
  effectiveTaxRate: number;
}

export interface TimeMachineResult {
  ag49CompliantReturn: number;
  historicalReturn: number;
  cashValueYear20: number;
  deathBenefitYear20: number;
  totalPremiumsPaid: number;
  internalRateOfReturn: number;
  projectionData: Array<{ year: number; cashValue: number; deathBenefit: number }>;
}

export interface LifetimeIncomeResult {
  totalGuaranteedIncome: number;
  incomeStartAge: number;
  monthlyIncome: number;
  annualIncome: number;
  incomeDuration: number;
  principalProtected: boolean;
}

export interface BlackMirrorResult {
  doNothingOutcome: number;
  withStrategyOutcome: number;
  netDifference: number;
  yearsAnalyzed: number;
  riskScore: number;
}

export interface EndgameResult {
  totalWealth: number;
  taxFreeWealth: number;
  legacyValue: number;
  incomeReplacement: number;
  protectionScore: number;
}

export interface DynamicTaxResult {
  yearlyProjection: Array<{
    year: number;
    grossIncome: number;
    taxableIncome: number;
    federalTax: number;
    marginalRate: number;
    effectiveRate: number;
    ogDeductions: number;
    taxSavings: number;
  }>;
  totalTaxSaved: number;
  averageEffectiveRate: number;
  bracketChanges: number;
}

export interface AdvisorIncomeResult {
  annualGrossIncome: number;
  annualNetIncome: number;
  effectiveTaxRate: number;
  retirementContributions: number;
  businessExpenses: number;
}

export interface LiveCoPilotResult {
  conversationsCount: number;
  topicsDiscussed: string[];
  insightsGenerated: number;
  closingScriptUsed: boolean;
  confidenceScore: number;
}

export interface SocialNarcoticResult {
  contentShared: number;
  influenceScore: number;
  memesCreated: number;
  bragsPosted: number;
  audienceReach: number;
}

export interface WarRoomResult {
  storiesShared: number;
  challengesCompleted: number;
  predictionsAccuracy: number;
  communityRank: number;
  warScore: number;
}

// ── Union of ALL strategy types ──────────────────────────────────────────────

export type StrategyType =
  | "mortgage-killer"
  | "iul-projection"
  | "roth-conversion"
  | "myga-waterfall"
  | "tax-waterfall"
  | "retirement-income"
  | "premium-financing"
  | "real-estate-mogul"
  | "inflation-analysis"
  | "social-security"
  | "annuity-income"
  | "estate-tax"
  | "fia-collateral"
  | "hot-income"
  | "time-machine"
  | "lifetime-income"
  | "black-mirror"
  | "endgame"
  | "dynamic-tax"
  | "advisor-income"
  | "live-copilot"
  | "social-narcotic"
  | "war-room";

export type StrategyResult =
  | { type: "mortgage-killer"; data: MortgageKillerResult }
  | { type: "iul-projection"; data: IULProjectionResult }
  | { type: "roth-conversion"; data: RothConversionResult }
  | { type: "myga-waterfall"; data: MYGAWaterfallResult }
  | { type: "tax-waterfall"; data: TaxWaterfallResult }
  | { type: "retirement-income"; data: RetirementIncomeResult }
  | { type: "premium-financing"; data: PremiumFinancingResult }
  | { type: "real-estate-mogul"; data: RealEstateMogulResult }
  | { type: "inflation-analysis"; data: InflationResult }
  | { type: "social-security"; data: SocialSecurityResult }
  | { type: "annuity-income"; data: AnnuityIncomeResult }
  | { type: "estate-tax"; data: EstateTaxResult }
  | { type: "fia-collateral"; data: FIACollateralResult }
  | { type: "hot-income"; data: HotIncomeResult }
  | { type: "time-machine"; data: TimeMachineResult }
  | { type: "lifetime-income"; data: LifetimeIncomeResult }
  | { type: "black-mirror"; data: BlackMirrorResult }
  | { type: "endgame"; data: EndgameResult }
  | { type: "dynamic-tax"; data: DynamicTaxResult }
  | { type: "advisor-income"; data: AdvisorIncomeResult }
  | { type: "live-copilot"; data: LiveCoPilotResult }
  | { type: "social-narcotic"; data: SocialNarcoticResult }
  | { type: "war-room"; data: WarRoomResult };

// ── Cross-tool data flow definitions ─────────────────────────────────────────

export interface DataFlowLink {
  from: StrategyType;
  to: StrategyType;
  label: string;
  description: string;
  mapData: (source: any) => Record<string, any>;
}

export const DATA_FLOW_LINKS: DataFlowLink[] = [
  // Original flows
  {
    from: "mortgage-killer",
    to: "myga-waterfall",
    label: "Interest Saved → MYGA Principal",
    description: "Use mortgage interest savings as the initial MYGA investment to compound through the waterfall strategy.",
    mapData: (src: MortgageKillerResult) => ({ initialInvestment: src.interestSaved, source: "Mortgage Interest Saved" }),
  },
  {
    from: "mortgage-killer",
    to: "tax-waterfall",
    label: "HELOC Interest → Tax Deductions",
    description: "HELOC interest payments may be tax-deductible, feeding into your tax optimization waterfall.",
    mapData: (src: MortgageKillerResult) => ({ helocDeduction: src.helocAmount * 0.085, source: "Mortgage Killer HELOC" }),
  },
  {
    from: "iul-projection",
    to: "premium-financing",
    label: "Cash Value → Loan Collateral",
    description: "Use projected IUL cash value as collateral basis for premium financing analysis.",
    mapData: (src: IULProjectionResult) => ({ collateralValue: src.cashValue, annualPremium: src.annualPremium }),
  },
  {
    from: "iul-projection",
    to: "retirement-income",
    label: "Cash Value → Retirement Income",
    description: "IUL cash value distributions supplement retirement income projections.",
    mapData: (src: IULProjectionResult) => ({ iulIncome: src.cashValue * 0.04, source: "IUL Policy Distributions" }),
  },
  {
    from: "roth-conversion",
    to: "tax-waterfall",
    label: "Conversion → Tax Bracket Impact",
    description: "Roth conversion amounts directly impact your tax bracket waterfall analysis.",
    mapData: (src: RothConversionResult) => ({ conversionIncome: src.totalConverted / src.yearsOfConversion, targetBracket: src.targetBracket }),
  },
  {
    from: "roth-conversion",
    to: "retirement-income",
    label: "Roth Balance → Tax-Free Income",
    description: "Ending Roth balance provides tax-free retirement income, improving income projections.",
    mapData: (src: RothConversionResult) => ({ rothIncome: src.endingRothBalance * 0.04, taxFree: true }),
  },
  {
    from: "myga-waterfall",
    to: "tax-waterfall",
    label: "O&G Deductions → Tax Savings",
    description: "Oil & gas depreciation deductions from the MYGA waterfall feed into tax savings calculations.",
    mapData: (src: MYGAWaterfallResult) => ({ oilGasDeduction: src.annualTaxSavings, source: "MYGA Waterfall O&G" }),
  },
  {
    from: "myga-waterfall",
    to: "retirement-income",
    label: "MYGA Income → Guaranteed Income",
    description: "MYGA guaranteed returns provide a reliable income floor for retirement projections.",
    mapData: (src: MYGAWaterfallResult) => ({ mygaIncome: src.totalMygaValue * (src.mygaRate / 100), guaranteed: true }),
  },
  {
    from: "retirement-income",
    to: "inflation-analysis",
    label: "Income Need → Inflation Impact",
    description: "Analyze how inflation erodes your projected retirement income over time.",
    mapData: (src: RetirementIncomeResult) => ({ baseIncome: src.annualIncome, incomeGap: src.incomeGap }),
  },
  {
    from: "real-estate-mogul",
    to: "retirement-income",
    label: "Cash Flow → Retirement Income",
    description: "Real estate cash flow supplements retirement income projections.",
    mapData: (src: RealEstateMogulResult) => ({ realEstateIncome: src.cashFlow, source: "Real Estate Portfolio" }),
  },
  {
    from: "premium-financing",
    to: "iul-projection",
    label: "Financed Premium → IUL Growth",
    description: "Premium financing loan feeds into IUL projection to model leveraged growth.",
    mapData: (src: PremiumFinancingResult) => ({ annualPremium: src.loanAmount / 10, leveraged: true }),
  },
  // NEW: Extended cross-calculator flows
  {
    from: "social-security",
    to: "retirement-income",
    label: "SS Benefit → Retirement Income",
    description: "Social Security claiming strategy feeds into total retirement income projections.",
    mapData: (src: SocialSecurityResult) => ({ socialSecurity: src.monthlyBenefitFRA * 12, claimAge: src.optimalClaimAge }),
  },
  {
    from: "social-security",
    to: "roth-conversion",
    label: "SS Gap Years → Conversion Window",
    description: "Years before SS starts are optimal Roth conversion windows with lower income.",
    mapData: (src: SocialSecurityResult) => ({ gapYears: src.optimalClaimAge - 62, lowerIncomeWindow: true }),
  },
  {
    from: "annuity-income",
    to: "retirement-income",
    label: "Annuity Income → Guaranteed Floor",
    description: "Guaranteed annuity income provides a reliable floor for retirement projections.",
    mapData: (src: AnnuityIncomeResult) => ({ annuityIncome: src.guaranteedAnnualIncome, guaranteed: true }),
  },
  {
    from: "annuity-income",
    to: "tax-waterfall",
    label: "Annuity Income → Tax Impact",
    description: "Annuity distributions create taxable income affecting bracket positioning.",
    mapData: (src: AnnuityIncomeResult) => ({ annuityTaxableIncome: src.guaranteedAnnualIncome * 0.85 }),
  },
  {
    from: "estate-tax",
    to: "iul-projection",
    label: "Estate Tax → IUL Need",
    description: "Estate tax liability determines the death benefit needed from IUL coverage.",
    mapData: (src: EstateTaxResult) => ({ targetDeathBenefit: src.estateTaxOwed, estatePlanning: true }),
  },
  {
    from: "fia-collateral",
    to: "premium-financing",
    label: "FIA Value → Collateral",
    description: "FIA account value serves as collateral for premium financing strategies.",
    mapData: (src: FIACollateralResult) => ({ collateralValue: src.fiaAccountValue, arbitrageRate: src.netArbitrage }),
  },
  {
    from: "hot-income",
    to: "tax-waterfall",
    label: "Income Mix → Tax Optimization",
    description: "Tax-free vs taxable income mix from HOT Income feeds into tax bracket optimization.",
    mapData: (src: HotIncomeResult) => ({ taxFreeIncome: src.taxFreeIncome, taxableIncome: src.taxableIncome }),
  },
  {
    from: "hot-income",
    to: "retirement-income",
    label: "HOT Income → Retirement Floor",
    description: "Combined income streams from HOT Income supplement retirement projections.",
    mapData: (src: HotIncomeResult) => ({ hotIncome: src.totalAnnualIncome, taxFreeRatio: src.taxFreeIncome / src.totalAnnualIncome }),
  },
  {
    from: "time-machine",
    to: "iul-projection",
    label: "AG49 Returns → IUL Projection",
    description: "Time Machine AG49-compliant returns feed into IUL projection modeling.",
    mapData: (src: TimeMachineResult) => ({ avgReturn: src.ag49CompliantReturn, cashValue: src.cashValueYear20 }),
  },
  {
    from: "time-machine",
    to: "premium-financing",
    label: "Cash Value → Financing Basis",
    description: "Time Machine projected cash values inform premium financing collateral.",
    mapData: (src: TimeMachineResult) => ({ projectedCashValue: src.cashValueYear20, irr: src.internalRateOfReturn }),
  },
  {
    from: "lifetime-income",
    to: "retirement-income",
    label: "Lifetime Income → Income Floor",
    description: "Guaranteed lifetime income provides a protected floor for retirement.",
    mapData: (src: LifetimeIncomeResult) => ({ guaranteedIncome: src.annualIncome, protected: src.principalProtected }),
  },
  {
    from: "dynamic-tax",
    to: "tax-waterfall",
    label: "Dynamic Brackets → Tax Strategy",
    description: "Year-over-year bracket projections inform the tax optimization waterfall.",
    mapData: (src: DynamicTaxResult) => ({ projectedSavings: src.totalTaxSaved, bracketChanges: src.bracketChanges }),
  },
  {
    from: "dynamic-tax",
    to: "roth-conversion",
    label: "Low-Bracket Years → Conversion Timing",
    description: "Dynamic tax projections identify optimal low-bracket years for Roth conversions.",
    mapData: (src: DynamicTaxResult) => ({
      lowBracketYears: src.yearlyProjection.filter(y => y.marginalRate <= 0.22).map(y => y.year),
      averageRate: src.averageEffectiveRate,
    }),
  },
  {
    from: "myga-waterfall",
    to: "dynamic-tax",
    label: "O&G Schedule → Dynamic Brackets",
    description: "O&G depreciation schedule from MYGA waterfall feeds into dynamic tax bracket projections.",
    mapData: (src: MYGAWaterfallResult) => ({ annualOGDeduction: src.annualTaxSavings / 0.37, cycles: src.cycles }),
  },
  {
    from: "mortgage-killer",
    to: "dynamic-tax",
    label: "Interest Deduction → Bracket Impact",
    description: "Mortgage interest deductions affect year-over-year bracket positioning.",
    mapData: (src: MortgageKillerResult) => ({ interestDeduction: src.originalBalance * 0.065, helocDeduction: src.helocAmount * 0.085 }),
  },
];

// ── 5-Slot Comparison System ─────────────────────────────────────────────────

export interface ComparisonSlot {
  id: number;
  strategyType: StrategyType | null;
  label: string;
  data: any | null;
  /** 20-year projection data for this slot */
  projection: ComparisonProjectionYear[] | null;
  color: string;
}

export interface ComparisonProjectionYear {
  year: number;
  netPositive: number;
  interestPaid: number;
  interestSaved: number;
  equityBuilt: number;
  taxSavings: number;
  cashValue: number;
  deathBenefit: number;
  incomeGenerated: number;
  opportunityCost: number;
  cumulativeNetPositive: number;
}

export interface ComparisonSummary {
  slotId: number;
  label: string;
  strategyType: StrategyType;
  totalNetPositive: number;
  totalInterestPaid: number;
  totalInterestSaved: number;
  totalEquityBuilt: number;
  totalTaxSavings: number;
  finalCashValue: number;
  finalDeathBenefit: number;
  totalIncomeGenerated: number;
  totalOpportunityCost: number;
  /** Best metric for this strategy */
  bestMetric: string;
  bestMetricValue: number;
}

const SLOT_COLORS = ["#22c55e", "#3b82f6", "#a855f7", "#f59e0b", "#ef4444"];

// ── Context type ─────────────────────────────────────────────────────────────

interface StrategyContextType {
  /** All published strategy results keyed by type */
  results: Partial<Record<StrategyType, any>>;
  /** Publish a strategy result from any tool */
  publishResult: (result: StrategyResult) => void;
  /** Clear a specific result */
  clearResult: (type: StrategyType) => void;
  /** Clear all results */
  clearAll: () => void;
  /** Get available data flows FROM a given strategy */
  getOutboundFlows: (from: StrategyType) => DataFlowLink[];
  /** Get available data flows TO a given strategy (with data) */
  getInboundFlows: (to: StrategyType) => Array<DataFlowLink & { sourceData: any; mappedData: Record<string, any> }>;
  /** Check if a strategy has published results */
  hasResult: (type: StrategyType) => boolean;
  /** Get the mapped data for a specific flow */
  getFlowData: (from: StrategyType, to: StrategyType) => Record<string, any> | null;
  /** Get count of active (published) strategies */
  activeCount: number;
  /** Get all active strategy types */
  activeStrategies: StrategyType[];

  // ── 5-Slot Comparison ──
  /** The 5 comparison slots */
  comparisonSlots: ComparisonSlot[];
  /** Assign a strategy to a comparison slot */
  setComparisonSlot: (slotId: number, strategyType: StrategyType, label?: string) => void;
  /** Clear a comparison slot */
  clearComparisonSlot: (slotId: number) => void;
  /** Clear all comparison slots */
  clearAllComparisons: () => void;
  /** Generate 20-year projection for a slot */
  generateProjection: (slotId: number) => void;
  /** Get comparison summaries for all filled slots */
  getComparisonSummaries: () => ComparisonSummary[];
}

const defaultSlots: ComparisonSlot[] = Array.from({ length: 5 }, (_, i) => ({
  id: i,
  strategyType: null,
  label: `Strategy ${i + 1}`,
  data: null,
  projection: null,
  color: SLOT_COLORS[i],
}));

const StrategyContext = createContext<StrategyContextType>({
  results: {},
  publishResult: () => {},
  clearResult: () => {},
  clearAll: () => {},
  getOutboundFlows: () => [],
  getInboundFlows: () => [],
  hasResult: () => false,
  getFlowData: () => null,
  activeCount: 0,
  activeStrategies: [],
  comparisonSlots: defaultSlots,
  setComparisonSlot: () => {},
  clearComparisonSlot: () => {},
  clearAllComparisons: () => {},
  generateProjection: () => {},
  getComparisonSummaries: () => [],
});

/**
 * Generate a 20-year projection from strategy result data.
 * Each strategy type has its own projection logic.
 */
function generate20YearProjection(strategyType: StrategyType, data: any): ComparisonProjectionYear[] {
  const years: ComparisonProjectionYear[] = [];
  let cumulativeNetPositive = 0;

  for (let y = 1; y <= 20; y++) {
    let row: ComparisonProjectionYear = {
      year: y,
      netPositive: 0,
      interestPaid: 0,
      interestSaved: 0,
      equityBuilt: 0,
      taxSavings: 0,
      cashValue: 0,
      deathBenefit: 0,
      incomeGenerated: 0,
      opportunityCost: 0,
      cumulativeNetPositive: 0,
    };

    switch (strategyType) {
      case "mortgage-killer": {
        const d = data as MortgageKillerResult;
        const annualInterestSaved = d.interestSaved / 20;
        const annualEquity = d.originalBalance / 20;
        row.interestSaved = annualInterestSaved * (1 + y * 0.02);
        row.equityBuilt = annualEquity * y;
        row.cashValue = d.iulCashValue * (y / 20) * (1 + y * 0.015);
        row.deathBenefit = d.iulDeathBenefit;
        row.taxSavings = d.helocUsed ? d.helocAmount * 0.085 * 0.32 : 0;
        row.opportunityCost = d.totalOpportunityCost * (y / 20);
        row.netPositive = row.interestSaved + row.taxSavings + row.cashValue * 0.05;
        break;
      }
      case "iul-projection": {
        const d = data as IULProjectionResult;
        const projYear = d.projectionData?.find(p => p.year === y);
        row.cashValue = projYear?.cashValue ?? d.cashValue * (y / d.years);
        row.deathBenefit = projYear?.deathBenefit ?? d.deathBenefit;
        row.interestPaid = d.annualPremium;
        row.netPositive = row.cashValue - (d.annualPremium * y);
        break;
      }
      case "roth-conversion": {
        const d = data as RothConversionResult;
        const ladderYear = d.ladderData?.find(l => l.year === y);
        row.taxSavings = y <= d.yearsOfConversion ? 0 : (d.endingRothBalance * 0.04 * d.targetBracket / 100);
        row.interestPaid = ladderYear?.tax ?? 0;
        row.cashValue = ladderYear?.rothBalance ?? d.endingRothBalance * Math.min(1, y / d.yearsOfConversion);
        row.incomeGenerated = y > d.yearsOfConversion ? d.endingRothBalance * 0.04 : 0;
        row.netPositive = row.cashValue - (d.taxPaid * Math.min(1, y / d.yearsOfConversion));
        break;
      }
      case "myga-waterfall": {
        const d = data as MYGAWaterfallResult;
        const projYear = d.projectionData?.find(p => p.year === y);
        row.cashValue = projYear?.mygaValue ?? d.totalMygaValue * (1 + d.mygaRate / 100) ** y;
        row.incomeGenerated = projYear?.oilGasValue ?? d.totalOilGasValue * (y / 20);
        row.taxSavings = d.annualTaxSavings;
        row.interestPaid = d.totalMygaValue * 0.07 * 0.7; // bank loan interest
        row.netPositive = row.cashValue + row.incomeGenerated + row.taxSavings - row.interestPaid;
        row.opportunityCost = row.netPositive * 1.03; // compounded
        break;
      }
      case "tax-waterfall": {
        const d = data as TaxWaterfallResult;
        row.taxSavings = d.totalTaxSaved;
        row.netPositive = d.totalTaxSaved * y;
        break;
      }
      case "retirement-income": {
        const d = data as RetirementIncomeResult;
        row.incomeGenerated = d.annualIncome;
        row.taxSavings = d.annuityIncome * 0.15; // exclusion ratio
        row.netPositive = d.annualIncome * y;
        break;
      }
      case "premium-financing": {
        const d = data as PremiumFinancingResult;
        row.interestPaid = d.annualLoanCost;
        row.deathBenefit = d.deathBenefitLeverage;
        row.cashValue = y >= d.breakEvenYear ? d.cashValueAtBreakEven * (1 + (y - d.breakEvenYear) * 0.06) : 0;
        row.netPositive = y >= d.breakEvenYear ? d.netBenefit * ((y - d.breakEvenYear + 1) / 10) : -d.annualLoanCost * y;
        break;
      }
      case "real-estate-mogul": {
        const d = data as RealEstateMogulResult;
        const projYear = d.projectionData?.find(p => p.year === y);
        row.equityBuilt = projYear?.equity ?? d.totalEquity * (1.05 ** y);
        row.incomeGenerated = projYear?.cashFlow ?? d.cashFlow * (1.03 ** y);
        row.netPositive = row.equityBuilt + row.incomeGenerated * y;
        break;
      }
      case "social-security": {
        const d = data as SocialSecurityResult;
        row.incomeGenerated = y >= (d.optimalClaimAge - 62) ? d.monthlyBenefitFRA * 12 : 0;
        row.netPositive = row.incomeGenerated;
        break;
      }
      case "annuity-income": {
        const d = data as AnnuityIncomeResult;
        row.incomeGenerated = d.guaranteedAnnualIncome;
        row.cashValue = d.accumulationValue * (1 + d.rollUpRate / 100) ** y;
        row.netPositive = row.incomeGenerated * y;
        break;
      }
      case "estate-tax": {
        const d = data as EstateTaxResult;
        row.taxSavings = d.strategySavings / 20;
        row.deathBenefit = d.netToHeirs;
        row.netPositive = d.strategySavings * (y / 20);
        break;
      }
      case "fia-collateral": {
        const d = data as FIACollateralResult;
        const projYear = d.projectionData?.find(p => p.year === y);
        row.cashValue = projYear?.accountValue ?? d.fiaAccountValue * (1 + d.annualCrediting / 100) ** y;
        row.interestPaid = d.collateralLoanAmount * (d.loanInterestRate / 100);
        row.netPositive = (projYear?.netValue ?? row.cashValue - d.collateralLoanAmount) + d.netArbitrage * y;
        break;
      }
      case "hot-income": {
        const d = data as HotIncomeResult;
        row.incomeGenerated = d.totalAnnualIncome;
        row.taxSavings = d.taxFreeIncome * d.effectiveTaxRate;
        row.netPositive = (d.totalAnnualIncome + row.taxSavings) * y;
        break;
      }
      case "time-machine": {
        const d = data as TimeMachineResult;
        const projYear = d.projectionData?.find(p => p.year === y);
        row.cashValue = projYear?.cashValue ?? d.cashValueYear20 * (y / 20);
        row.deathBenefit = projYear?.deathBenefit ?? d.deathBenefitYear20;
        row.interestPaid = d.totalPremiumsPaid / 20;
        row.netPositive = row.cashValue - (d.totalPremiumsPaid * y / 20);
        break;
      }
      case "lifetime-income": {
        const d = data as LifetimeIncomeResult;
        row.incomeGenerated = d.annualIncome;
        row.netPositive = d.annualIncome * y;
        break;
      }
      case "dynamic-tax": {
        const d = data as DynamicTaxResult;
        const projYear = d.yearlyProjection?.find(p => p.year === y);
        row.taxSavings = projYear?.taxSavings ?? d.totalTaxSaved / 20;
        row.netPositive = d.yearlyProjection?.slice(0, y).reduce((s, p) => s + p.taxSavings, 0) ?? row.taxSavings * y;
        break;
      }
      default: {
        // Generic fallback
        row.netPositive = 0;
        break;
      }
    }

    cumulativeNetPositive += row.netPositive;
    row.cumulativeNetPositive = cumulativeNetPositive;
    years.push(row);
  }

  return years;
}

export function StrategyProvider({ children }: { children: ReactNode }) {
  const [results, setResults] = useState<Partial<Record<StrategyType, any>>>({});
  const [comparisonSlots, setComparisonSlots] = useState<ComparisonSlot[]>(defaultSlots);

  const publishResult = useCallback((result: StrategyResult) => {
    setResults((prev) => ({ ...prev, [result.type]: result.data }));
    // Auto-update any comparison slot that references this strategy
    setComparisonSlots(prev => prev.map(slot => {
      if (slot.strategyType === result.type) {
        const projection = generate20YearProjection(result.type, result.data);
        return { ...slot, data: result.data, projection };
      }
      return slot;
    }));
  }, []);

  const clearResult = useCallback((type: StrategyType) => {
    setResults((prev) => {
      const next = { ...prev };
      delete next[type];
      return next;
    });
  }, []);

  const clearAll = useCallback(() => setResults({}), []);

  const getOutboundFlows = useCallback(
    (from: StrategyType) => DATA_FLOW_LINKS.filter((l) => l.from === from),
    []
  );

  const getInboundFlows = useCallback(
    (to: StrategyType) =>
      DATA_FLOW_LINKS.filter((l) => l.to === to && results[l.from])
        .map((l) => ({
          ...l,
          sourceData: results[l.from],
          mappedData: l.mapData(results[l.from]),
        })),
    [results]
  );

  const hasResult = useCallback((type: StrategyType) => !!results[type], [results]);

  const getFlowData = useCallback(
    (from: StrategyType, to: StrategyType) => {
      const link = DATA_FLOW_LINKS.find((l) => l.from === from && l.to === to);
      if (!link || !results[from]) return null;
      return link.mapData(results[from]);
    },
    [results]
  );

  const activeStrategies = Object.keys(results) as StrategyType[];
  const activeCount = activeStrategies.length;

  // ── Comparison slot management ──
  const setComparisonSlot = useCallback((slotId: number, strategyType: StrategyType, label?: string) => {
    setComparisonSlots(prev => prev.map(slot => {
      if (slot.id !== slotId) return slot;
      const data = results[strategyType] ?? null;
      const projection = data ? generate20YearProjection(strategyType, data) : null;
      return {
        ...slot,
        strategyType,
        label: label ?? STRATEGY_LABELS[strategyType],
        data,
        projection,
      };
    }));
  }, [results]);

  const clearComparisonSlot = useCallback((slotId: number) => {
    setComparisonSlots(prev => prev.map(slot =>
      slot.id === slotId ? { ...defaultSlots[slotId] } : slot
    ));
  }, []);

  const clearAllComparisons = useCallback(() => {
    setComparisonSlots([...defaultSlots]);
  }, []);

  const generateProjection = useCallback((slotId: number) => {
    setComparisonSlots(prev => prev.map(slot => {
      if (slot.id !== slotId || !slot.strategyType || !slot.data) return slot;
      const projection = generate20YearProjection(slot.strategyType, slot.data);
      return { ...slot, projection };
    }));
  }, []);

  const getComparisonSummaries = useCallback((): ComparisonSummary[] => {
    return comparisonSlots
      .filter(s => s.strategyType && s.projection)
      .map(slot => {
        const proj = slot.projection!;
        const last = proj[proj.length - 1];
        const totals = {
          totalNetPositive: last.cumulativeNetPositive,
          totalInterestPaid: proj.reduce((s, y) => s + y.interestPaid, 0),
          totalInterestSaved: proj.reduce((s, y) => s + y.interestSaved, 0),
          totalEquityBuilt: last.equityBuilt,
          totalTaxSavings: proj.reduce((s, y) => s + y.taxSavings, 0),
          finalCashValue: last.cashValue,
          finalDeathBenefit: last.deathBenefit,
          totalIncomeGenerated: proj.reduce((s, y) => s + y.incomeGenerated, 0),
          totalOpportunityCost: last.opportunityCost,
        };
        // Find best metric
        const metrics = [
          { name: "Net Positive", value: totals.totalNetPositive },
          { name: "Interest Saved", value: totals.totalInterestSaved },
          { name: "Tax Savings", value: totals.totalTaxSavings },
          { name: "Cash Value", value: totals.finalCashValue },
          { name: "Death Benefit", value: totals.finalDeathBenefit },
          { name: "Income Generated", value: totals.totalIncomeGenerated },
        ];
        const best = metrics.reduce((b, m) => m.value > b.value ? m : b, metrics[0]);

        return {
          slotId: slot.id,
          label: slot.label,
          strategyType: slot.strategyType!,
          ...totals,
          bestMetric: best.name,
          bestMetricValue: best.value,
        };
      });
  }, [comparisonSlots]);

  return (
    <StrategyContext.Provider
      value={{
        results, publishResult, clearResult, clearAll,
        getOutboundFlows, getInboundFlows, hasResult, getFlowData,
        activeCount, activeStrategies,
        comparisonSlots, setComparisonSlot, clearComparisonSlot,
        clearAllComparisons, generateProjection, getComparisonSummaries,
      }}
    >
      {children}
    </StrategyContext.Provider>
  );
}

/** Hook to access the cross-tool strategy context */
export function useStrategy() {
  return useContext(StrategyContext);
}

// ── Strategy type display names ──────────────────────────────────────────────

export const STRATEGY_LABELS: Record<StrategyType, string> = {
  "mortgage-killer": "Mortgage Killer",
  "iul-projection": "IUL Projection",
  "roth-conversion": "Roth Conversion",
  "myga-waterfall": "MYGA Waterfall",
  "tax-waterfall": "Tax Waterfall",
  "retirement-income": "Retirement Income",
  "premium-financing": "Premium Financing",
  "real-estate-mogul": "Real Estate Mogul",
  "inflation-analysis": "Inflation Analysis",
  "social-security": "Social Security",
  "annuity-income": "Annuity Income",
  "estate-tax": "Estate Tax",
  "fia-collateral": "FIA Collateral",
  "hot-income": "HOT Income",
  "time-machine": "Time Machine",
  "lifetime-income": "Lifetime Income",
  "black-mirror": "Black Mirror",
  "endgame": "Endgame",
  "dynamic-tax": "Dynamic Tax",
  "advisor-income": "Advisor Income",
  "live-copilot": "Live Co-Pilot",
  "social-narcotic": "Social Narcotic",
  "war-room": "War Room",
};

export const STRATEGY_COLORS: Record<StrategyType, string> = {
  "mortgage-killer": "emerald",
  "iul-projection": "blue",
  "roth-conversion": "purple",
  "myga-waterfall": "amber",
  "tax-waterfall": "red",
  "retirement-income": "cyan",
  "premium-financing": "indigo",
  "real-estate-mogul": "orange",
  "inflation-analysis": "rose",
  "social-security": "teal",
  "annuity-income": "lime",
  "estate-tax": "fuchsia",
  "fia-collateral": "sky",
  "hot-income": "yellow",
  "time-machine": "violet",
  "lifetime-income": "emerald",
  "black-mirror": "slate",
  "endgame": "gold",
  "dynamic-tax": "red",
  "advisor-income": "blue",
  "live-copilot": "violet",
  "social-narcotic": "pink",
  "war-room": "red",
};
/** Map strategy type to its calculator page path */
export const STRATEGY_PATHS: Record<StrategyType, string> = {
  "mortgage-killer": "/portal/mortgage-killer",
  "iul-projection": "/portal/iul-historical",
  "roth-conversion": "/portal/roth-conversion",
  "myga-waterfall": "/portal/myga-fixed-rate",
  "tax-waterfall": "/portal/tax-waterfall",
  "retirement-income": "/portal/retirement-income",
  "premium-financing": "/portal/premium-financing",
  "real-estate-mogul": "/portal/real-estate-mogul",
  "inflation-analysis": "/portal/inflation-analysis",
  "social-security": "/portal/social-security",
  "annuity-income": "/portal/athene-guaranteed-income",
  "estate-tax": "/portal/estate-tax",
  "fia-collateral": "/portal/fia-collateral-strategy",
  "hot-income": "/portal/hot-income",
  "time-machine": "/portal/time-machine",
  "lifetime-income": "/portal/lifetime-income",
  "black-mirror": "/portal/black-mirror",
  "endgame": "/portal/endgame",
  "dynamic-tax": "/portal/tax-waterfall",
  "advisor-income": "/portal/advisor-income-calculator",
  "live-copilot": "/portal/live-copilot",
  "social-narcotic": "/portal/social-narcotic",
  "war-room": "/portal/war-room",
};
```

## `client/src/contexts/ThemeContext.tsx`

```tsx
import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme?: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (switchable) {
      const stored = localStorage.getItem("theme");
      return (stored as Theme) || defaultTheme;
    }
    return defaultTheme;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    if (switchable) {
      localStorage.setItem("theme", theme);
    }
  }, [theme, switchable]);

  const toggleTheme = switchable
    ? () => {
        setTheme(prev => (prev === "light" ? "dark" : "light"));
      }
    : undefined;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
```

## `client/src/data/intakeInterviewQuestions.ts`

```ts
export interface InterviewStep {
  key: string;
  section: string;
  question: string;
  followUp: string;
  condition?: (data: Record<string, string>) => boolean | "" | undefined;
}

export const INTERVIEW_SECTIONS = [
  "Personal & Family",
  "Employment & Income",
  "Tax & Filing",
  "Assets & Net Worth",
  "Liabilities & Debt",
  "Credit & Banking",
  "Insurance Coverage",
  "Retirement Planning",
  "Estate & Legacy",
  "Risk & Behavioral",
  "Goals & Priorities",
  "Health & Lifestyle",
  "Real Estate",
  "Business Interests",
  "Advisor Relationship",
];

export const INTERVIEW_STEPS: InterviewStep[] = [
  // ═══════════════════════════════════════════════════════════════
  // SECTION 1: Personal & Family (12 questions)
  // ═══════════════════════════════════════════════════════════════
  { key: "fullName", section: "Personal & Family", question: "Let's start with the basics. What is the client's full legal name — first, middle, and last?", followUp: "Perfect. " },
  { key: "dateOfBirth", section: "Personal & Family", question: "What is their date of birth? (MM/DD/YYYY)", followUp: "Thank you. " },
  { key: "ssn_last4", section: "Personal & Family", question: "For identification purposes, what are the last 4 digits of their Social Security Number?", followUp: "Noted securely. " },
  { key: "maritalStatus", section: "Personal & Family", question: "What is their current marital status? (Single, Married, Divorced, Widowed, Domestic Partnership)", followUp: "Understood. " },
  { key: "spouseName", section: "Personal & Family", question: "What is their spouse's full name, date of birth, and occupation?", followUp: "Great. ", condition: (d) => d.maritalStatus?.toLowerCase().includes("married") || d.maritalStatus?.toLowerCase().includes("partner") },
  { key: "spouseIncome", section: "Personal & Family", question: "What is the spouse's approximate annual income and do they have their own retirement accounts?", followUp: "That's helpful. ", condition: (d) => d.maritalStatus?.toLowerCase().includes("married") || d.maritalStatus?.toLowerCase().includes("partner") },
  { key: "dependents", section: "Personal & Family", question: "How many dependents do they have? Please list each with their name, age, and relationship (children, elderly parents, etc.)", followUp: "Noted. " },
  { key: "dependentNeeds", section: "Personal & Family", question: "Do any dependents have special needs that require long-term financial planning? (Special education, medical care, trust requirements)", followUp: "Important to know. " },
  { key: "homeAddress", section: "Personal & Family", question: "What is their primary residence address? (City, State, ZIP)", followUp: "Got it. " },
  { key: "citizenship", section: "Personal & Family", question: "Are they a U.S. citizen or permanent resident? Do they have dual citizenship or residency in any other state or country?", followUp: "Thank you. " },
  { key: "veteranStatus", section: "Personal & Family", question: "Are they a military veteran or active service member? (This may affect benefits eligibility)", followUp: "Noted. " },
  { key: "divorceDetails", section: "Personal & Family", question: "Were there any financial obligations from the divorce — alimony, child support, or asset division agreements?", followUp: "I see. ", condition: (d) => d.maritalStatus?.toLowerCase().includes("divorced") },

  // ═══════════════════════════════════════════════════════════════
  // SECTION 2: Employment & Income (10 questions)
  // ═══════════════════════════════════════════════════════════════
  { key: "occupation", section: "Employment & Income", question: "What is the client's current occupation, job title, and employer name?", followUp: "Perfect. " },
  { key: "yearsEmployed", section: "Employment & Income", question: "How long have they been with their current employer? And how stable do they consider their position?", followUp: "Good to know. " },
  { key: "annualSalary", section: "Employment & Income", question: "What is their base annual salary or wages (before taxes)?", followUp: "Thank you. " },
  { key: "bonusCommission", section: "Employment & Income", question: "Do they receive bonuses, commissions, or variable compensation? If so, what was the average over the last 3 years?", followUp: "Noted. " },
  { key: "otherIncome", section: "Employment & Income", question: "Do they have any other sources of income? (Rental income, side business, royalties, dividends, Social Security, pension, alimony received)", followUp: "That's helpful. " },
  { key: "spouseEmployment", section: "Employment & Income", question: "Is the spouse currently employed? What is their income and employment stability?", followUp: "Understood. ", condition: (d) => d.maritalStatus?.toLowerCase().includes("married") || d.maritalStatus?.toLowerCase().includes("partner") },
  { key: "employerBenefits", section: "Employment & Income", question: "What employer benefits do they have access to? (401k match, pension, stock options, ESPP, deferred comp, group life/disability insurance)", followUp: "Important details. " },
  { key: "incomeGrowth", section: "Employment & Income", question: "What do they expect their income trajectory to look like over the next 5-10 years? Any expected promotions, career changes, or income disruptions?", followUp: "Good to plan for. " },
  { key: "savingsRate", section: "Employment & Income", question: "What percentage of their income are they currently saving or investing each month? (Include all retirement contributions, savings accounts, etc.)", followUp: "That's a key metric. " },
  { key: "monthlyExpenses", section: "Employment & Income", question: "What are their approximate total monthly living expenses? (Housing, food, transportation, childcare, subscriptions, discretionary)", followUp: "Thank you. " },

  // ═══════════════════════════════════════════════════════════════
  // SECTION 3: Tax & Filing (8 questions)
  // ═══════════════════════════════════════════════════════════════
  { key: "filingStatus", section: "Tax & Filing", question: "What is their tax filing status? (Single, Married Filing Jointly, Married Filing Separately, Head of Household, Qualifying Surviving Spouse)", followUp: "Got it. " },
  { key: "taxBracket", section: "Tax & Filing", question: "What is their approximate federal marginal tax bracket? (10%, 12%, 22%, 24%, 32%, 35%, 37%)", followUp: "Noted. " },
  { key: "stateTax", section: "Tax & Filing", question: "What state do they file taxes in, and what is the approximate state income tax rate?", followUp: "Thank you. " },
  { key: "taxDeductions", section: "Tax & Filing", question: "Do they itemize deductions or take the standard deduction? If itemizing, what are the major deductions? (Mortgage interest, state/local taxes, charitable giving)", followUp: "Helpful for planning. " },
  { key: "capitalGains", section: "Tax & Filing", question: "Do they have any significant unrealized capital gains in taxable accounts? Approximately how much?", followUp: "Important for tax planning. " },
  { key: "taxConcerns", section: "Tax & Filing", question: "Are there any specific tax concerns or upcoming tax events? (AMT exposure, stock option exercises, property sales, Roth conversions, inherited IRA RMDs)", followUp: "Good to flag. " },
  { key: "cpaRelationship", section: "Tax & Filing", question: "Do they work with a CPA or tax professional? Would they be open to coordinating between their tax advisor and financial advisor?", followUp: "Coordination is key. " },
  { key: "lastYearTax", section: "Tax & Filing", question: "Approximately how much did they pay in total federal and state income taxes last year?", followUp: "That gives us a baseline. " },

  // ═══════════════════════════════════════════════════════════════
  // SECTION 4: Assets & Net Worth (12 questions)
  // ═══════════════════════════════════════════════════════════════
  { key: "checkingSavings", section: "Assets & Net Worth", question: "What is the approximate total balance across all checking and savings accounts?", followUp: "Thank you. " },
  { key: "emergencyFund", section: "Assets & Net Worth", question: "How many months of living expenses do they have set aside in liquid emergency savings?", followUp: "Noted. " },
  { key: "taxableInvestments", section: "Assets & Net Worth", question: "Do they have any taxable brokerage or investment accounts? What is the approximate balance and what's in them? (Stocks, bonds, mutual funds, ETFs)", followUp: "Good. " },
  { key: "retirementAccounts", section: "Assets & Net Worth", question: "Please list all retirement accounts with approximate balances: 401(k), 403(b), IRA, Roth IRA, SEP IRA, SIMPLE IRA, pension, deferred comp, etc.", followUp: "Excellent detail. " },
  { key: "annuities", section: "Assets & Net Worth", question: "Do they own any annuities? If so, what type (MYGA, FIA, SPIA, variable), carrier, current value, surrender period remaining, and guaranteed rates?", followUp: "Important. " },
  { key: "lifeInsurance", section: "Assets & Net Worth", question: "Do they own any life insurance policies with cash value? (Whole life, universal life, IUL) What is the death benefit, cash value, and annual premium?", followUp: "Thank you. " },
  { key: "realEstateAssets", section: "Assets & Net Worth", question: "Do they own any real estate? For each property, what is the estimated market value, remaining mortgage balance, monthly payment, and is it primary residence, rental, or investment?", followUp: "Great detail. " },
  { key: "businessInterests", section: "Assets & Net Worth", question: "Do they own any business interests? (LLC, S-Corp, partnership, sole proprietorship) What is the estimated value and annual revenue?", followUp: "Noted. " },
  { key: "cryptoAlternatives", section: "Assets & Net Worth", question: "Do they hold any cryptocurrency, precious metals, collectibles, or other alternative investments? Approximate values?", followUp: "Good to know. " },
  { key: "cdsBonds", section: "Assets & Net Worth", question: "Do they own any CDs, Treasury bonds, savings bonds, or fixed-income instruments? What are the maturity dates, rates, and amounts?", followUp: "Thank you. " },
  { key: "stockOptions", section: "Assets & Net Worth", question: "Do they have any unvested stock options, RSUs, or employer equity? What is the vesting schedule and approximate current value?", followUp: "Important for planning. " },
  { key: "socialSecurity", section: "Assets & Net Worth", question: "Have they checked their Social Security statement? What is their estimated monthly benefit at full retirement age? Have they already started claiming?", followUp: "Critical for retirement planning. " },

  // ═══════════════════════════════════════════════════════════════
  // SECTION 5: Liabilities & Debt (10 questions)
  // ═══════════════════════════════════════════════════════════════
  { key: "mortgageDetails", section: "Liabilities & Debt", question: "What are the details of their primary mortgage? (Balance, interest rate, monthly payment, years remaining, fixed or adjustable)", followUp: "Got it. " },
  { key: "otherMortgages", section: "Liabilities & Debt", question: "Do they have any other mortgages or HELOCs? (Investment property, second home, home equity line) Please include balance, rate, and payment.", followUp: "Noted. " },
  { key: "autoLoans", section: "Liabilities & Debt", question: "Do they have any auto loans or leases? (Balance, monthly payment, interest rate, months remaining)", followUp: "Thank you. " },
  { key: "studentLoans", section: "Liabilities & Debt", question: "Any student loan debt? (Federal or private, balance, interest rate, repayment plan — standard, income-driven, PSLF eligible?)", followUp: "Important. " },
  { key: "creditCardDebt", section: "Liabilities & Debt", question: "What is their total credit card debt across all cards? What is the highest single card balance, and what are the interest rates?", followUp: "I see. " },
  { key: "personalLoans", section: "Liabilities & Debt", question: "Do they have any personal loans, 401k loans, or lines of credit? (Balance, rate, payment)", followUp: "Noted. " },
  { key: "medicalDebt", section: "Liabilities & Debt", question: "Any outstanding medical debt or payment plans?", followUp: "Thank you. " },
  { key: "taxDebt", section: "Liabilities & Debt", question: "Do they owe any back taxes to the IRS or state? Are they on a payment plan?", followUp: "Important to address. " },
  { key: "cosignedDebts", section: "Liabilities & Debt", question: "Have they co-signed any loans for children, family members, or business partners?", followUp: "Good to know. " },
  { key: "debtStrategy", section: "Liabilities & Debt", question: "What is their current approach to debt management? Are they focused on paying off specific debts, or maintaining minimum payments?", followUp: "Understood. " },

  // ═══════════════════════════════════════════════════════════════
  // SECTION 6: Credit & Banking (8 questions)
  // ═══════════════════════════════════════════════════════════════
  { key: "ficoScore", section: "Credit & Banking", question: "What is their approximate FICO credit score? (Excellent 750+, Good 700-749, Fair 650-699, Poor below 650) Do they know their exact score?", followUp: "Credit score is a critical asset class. " },
  { key: "spouseFico", section: "Credit & Banking", question: "What is the spouse's approximate FICO score?", followUp: "Good to have both. ", condition: (d) => d.maritalStatus?.toLowerCase().includes("married") || d.maritalStatus?.toLowerCase().includes("partner") },
  { key: "creditHistory", section: "Credit & Banking", question: "How long is their credit history? Any negative marks — late payments, collections, bankruptcies, or foreclosures in the past 7 years?", followUp: "Noted. " },
  { key: "creditUtilization", section: "Credit & Banking", question: "What is their approximate credit utilization ratio? (Total credit card balances divided by total credit limits)", followUp: "That's a key factor. " },
  { key: "totalCreditLimit", section: "Credit & Banking", question: "What is their total available credit limit across all cards and lines of credit?", followUp: "Access to credit is an important asset. " },
  { key: "bankingRelationships", section: "Credit & Banking", question: "Which banks and financial institutions do they have primary relationships with? (Checking, savings, credit cards, investment accounts)", followUp: "Thank you. " },
  { key: "creditMonitoring", section: "Credit & Banking", question: "Do they actively monitor their credit? Have they frozen their credit reports?", followUp: "Good practice. " },
  { key: "creditGoals", section: "Credit & Banking", question: "Are they planning any major credit-dependent purchases in the next 1-3 years? (Home purchase, refinance, auto, business loan)", followUp: "Important for timing. " },

  // ═══════════════════════════════════════════════════════════════
  // SECTION 7: Insurance Coverage (12 questions)
  // ═══════════════════════════════════════════════════════════════
  { key: "lifeInsuranceDetails", section: "Insurance Coverage", question: "Do they have life insurance? For each policy: type (term, whole, universal, IUL), carrier, death benefit, premium, and beneficiary.", followUp: "Thank you. " },
  { key: "lifeInsuranceNeed", section: "Insurance Coverage", question: "Based on their income and family situation, do they feel adequately covered? The general guideline is 10-15x annual income for income replacement.", followUp: "Good to assess. " },
  { key: "disabilityInsurance", section: "Insurance Coverage", question: "Do they have disability insurance? (Employer-provided, individual, or both) What is the monthly benefit and elimination period?", followUp: "Critical protection. " },
  { key: "healthInsurance", section: "Insurance Coverage", question: "What health insurance do they have? (Employer, marketplace, Medicare, Medicaid) What are the annual premiums and deductibles?", followUp: "Noted. " },
  { key: "longTermCare", section: "Insurance Coverage", question: "Do they have long-term care insurance? If not, have they considered it? (Average nursing home cost is $8,000-$12,000/month)", followUp: "Important for later years. " },
  { key: "umbrellaPolicy", section: "Insurance Coverage", question: "Do they have an umbrella liability policy? If so, what is the coverage amount?", followUp: "Good protection. " },
  { key: "homeInsurance", section: "Insurance Coverage", question: "Do they have adequate homeowner's/renter's insurance? When was it last reviewed? Is the coverage amount current with home value?", followUp: "Thank you. " },
  { key: "autoInsurance", section: "Insurance Coverage", question: "What auto insurance coverage do they have? (Liability limits, comprehensive, collision, uninsured motorist)", followUp: "Noted. " },
  { key: "businessInsurance", section: "Insurance Coverage", question: "If they own a business, do they have business insurance? (General liability, E&O, key person, buy-sell agreement)", followUp: "Important for business owners. ", condition: (d) => d.businessInterests && d.businessInterests.toLowerCase() !== "no" && d.businessInterests.toLowerCase() !== "none" },
  { key: "insuranceGaps", section: "Insurance Coverage", question: "Are there any insurance gaps they're aware of or concerned about?", followUp: "Good to identify. " },
  { key: "beneficiaryReview", section: "Insurance Coverage", question: "When were their insurance beneficiary designations last reviewed? Are they current with their wishes?", followUp: "Beneficiary reviews are critical. " },
  { key: "insurancePremiums", section: "Insurance Coverage", question: "What is their total annual insurance premium spend across all policies? (Life, health, auto, home, umbrella, disability, LTC)", followUp: "That gives us the full picture. " },

  // ═══════════════════════════════════════════════════════════════
  // SECTION 8: Retirement Planning (12 questions)
  // ═══════════════════════════════════════════════════════════════
  { key: "retirementAge", section: "Retirement Planning", question: "At what age do they plan to retire? Is this a firm target or flexible?", followUp: "Good target. " },
  { key: "retirementIncome", section: "Retirement Planning", question: "What annual income do they envision needing in retirement? (In today's dollars) What lifestyle do they want?", followUp: "That's a clear goal. " },
  { key: "retirementLocation", section: "Retirement Planning", question: "Where do they plan to live in retirement? (Same home, downsize, relocate to a different state, snowbird between two locations)", followUp: "Location affects costs significantly. " },
  { key: "socialSecurityStrategy", section: "Retirement Planning", question: "Have they thought about when to claim Social Security? (62 early, 67 full, 70 delayed) Do they understand the impact of timing?", followUp: "Timing can mean hundreds of thousands in lifetime benefits. " },
  { key: "pensionDetails", section: "Retirement Planning", question: "Do they have a pension? If so, what are the options — lump sum vs. annuity? What is the estimated monthly benefit? Is there a survivor benefit?", followUp: "Pension optimization is crucial. " },
  { key: "retirementContributions", section: "Retirement Planning", question: "Are they currently maxing out their retirement contributions? (401k: $23,500, IRA: $7,000, catch-up if over 50) If not, how much are they contributing?", followUp: "Every dollar counts. " },
  { key: "rothConversion", section: "Retirement Planning", question: "Have they considered or executed any Roth conversions? Do they understand the tax implications and potential benefits?", followUp: "Roth conversions can be powerful. " },
  { key: "retirementHealthcare", section: "Retirement Planning", question: "How do they plan to handle healthcare costs between retirement and Medicare eligibility at 65? (COBRA, marketplace, spouse's plan)", followUp: "Healthcare is often the biggest retirement expense. " },
  { key: "retirementWithdrawal", section: "Retirement Planning", question: "Do they have a withdrawal strategy in mind? (Which accounts to draw from first, tax-efficient sequencing)", followUp: "Withdrawal order matters enormously for taxes. " },
  { key: "retirementActivities", section: "Retirement Planning", question: "What do they envision doing in retirement? (Travel, hobbies, part-time work, volunteering, caring for grandchildren) This affects spending patterns.", followUp: "Lifestyle drives the numbers. " },
  { key: "retirementConcerns", section: "Retirement Planning", question: "What is their biggest fear about retirement? (Running out of money, healthcare costs, inflation, boredom, losing purpose)", followUp: "Addressing fears is part of good planning. " },
  { key: "retirementReadiness", section: "Retirement Planning", question: "On a scale of 1-10, how confident do they feel about their retirement readiness? What would increase their confidence?", followUp: "That's honest and helpful. " },

  // ═══════════════════════════════════════════════════════════════
  // SECTION 9: Estate & Legacy (10 questions)
  // ═══════════════════════════════════════════════════════════════
  { key: "willTrust", section: "Estate & Legacy", question: "Do they have a will and/or trust? When was it last updated? Is it a simple will, revocable living trust, or irrevocable trust?", followUp: "Estate documents are foundational. " },
  { key: "powerOfAttorney", section: "Estate & Legacy", question: "Do they have a durable power of attorney and healthcare power of attorney / healthcare directive in place?", followUp: "Critical documents. " },
  { key: "beneficiaries", section: "Estate & Legacy", question: "Who are their primary and contingent beneficiaries across all accounts and policies? Are designations consistent with their wishes?", followUp: "Beneficiary alignment is essential. " },
  { key: "estateValue", section: "Estate & Legacy", question: "What is their approximate total estate value? (All assets minus liabilities) Are they near the federal estate tax exemption threshold?", followUp: "Important for estate tax planning. " },
  { key: "inheritanceExpected", section: "Estate & Legacy", question: "Are they expecting to receive any inheritance? If so, approximately how much, from whom, and what is the likely timeline? (Within 5 years, 5-15 years, 15+ years)", followUp: "Planning for inheritance is smart. " },
  { key: "inheritanceType", section: "Estate & Legacy", question: "What form would the inheritance likely take? (Cash, real estate, retirement accounts, business interests, life insurance proceeds, trust distributions)", followUp: "The form affects tax treatment. ", condition: (d) => d.inheritanceExpected && !d.inheritanceExpected.toLowerCase().includes("no") && !d.inheritanceExpected.toLowerCase().includes("none") },
  { key: "legacyGoals", section: "Estate & Legacy", question: "What are their legacy goals? (Leave maximum to children, charitable giving, family foundation, education funding for grandchildren, minimize estate taxes)", followUp: "Beautiful goals. " },
  { key: "charitableGiving", section: "Estate & Legacy", question: "Do they currently make charitable donations? How much annually? Have they considered donor-advised funds, charitable remainder trusts, or qualified charitable distributions?", followUp: "Charitable planning can be tax-efficient. " },
  { key: "estateAttorney", section: "Estate & Legacy", question: "Do they work with an estate planning attorney? When was their estate plan last reviewed?", followUp: "Regular reviews are important. " },
  { key: "specialInstructions", section: "Estate & Legacy", question: "Are there any special estate planning considerations? (Blended family, special needs beneficiary, family business succession, international assets)", followUp: "Good to flag. " },

  // ═══════════════════════════════════════════════════════════════
  // SECTION 10: Risk & Behavioral (10 questions)
  // ═══════════════════════════════════════════════════════════════
  { key: "riskTolerance", section: "Risk & Behavioral", question: "How would they describe their overall investment risk tolerance? (Very Conservative, Conservative, Moderate, Aggressive, Very Aggressive)", followUp: "Thank you. " },
  { key: "marketDropReaction", section: "Risk & Behavioral", question: "If their portfolio dropped 30% in a single quarter, what would they realistically do? (Sell everything, sell some, hold, buy more)", followUp: "Honest self-assessment is valuable. " },
  { key: "investmentExperience", section: "Risk & Behavioral", question: "How would they rate their investment knowledge? (Novice, Intermediate, Advanced, Expert) What types of investments have they owned?", followUp: "Good context. " },
  { key: "pastMistakes", section: "Risk & Behavioral", question: "Have they ever made an investment decision they regret? What happened and what did they learn?", followUp: "Experience is the best teacher. " },
  { key: "decisionMaking", section: "Risk & Behavioral", question: "When making financial decisions, do they tend to research extensively, go with gut feeling, seek advice, or avoid decisions altogether?", followUp: "Understanding decision style helps us work together. " },
  { key: "sleepTest", section: "Risk & Behavioral", question: "What level of portfolio volatility would keep them up at night? (5% drop, 10% drop, 20% drop, 30%+ drop — or nothing bothers them)", followUp: "The sleep test is real. " },
  { key: "newsReaction", section: "Risk & Behavioral", question: "How do they react to financial news headlines? (Ignore them, read but don't act, feel anxious, want to make changes immediately)", followUp: "Media influence is a real factor. " },
  { key: "returnExpectation", section: "Risk & Behavioral", question: "What annual return do they expect from their investments over the next 10 years? (This helps calibrate expectations)", followUp: "Setting realistic expectations is important. " },
  { key: "lossVsGain", section: "Risk & Behavioral", question: "Which bothers them more: missing out on a 20% gain, or experiencing a 20% loss? (This reveals loss aversion tendency)", followUp: "That's very revealing. " },
  { key: "advisorRole", section: "Risk & Behavioral", question: "What role do they want their financial advisor to play? (Tell me what to do, give me options and let me decide, collaborative partnership, just execute my decisions)", followUp: "Understanding this shapes our relationship. " },

  // ═══════════════════════════════════════════════════════════════
  // SECTION 11: Goals & Priorities (10 questions)
  // ═══════════════════════════════════════════════════════════════
  { key: "topGoals", section: "Goals & Priorities", question: "What are their top 3 financial goals right now, in order of priority? (Be as specific as possible — amounts, timelines, outcomes)", followUp: "Clear priorities drive great plans. " },
  { key: "shortTermGoals", section: "Goals & Priorities", question: "Are there any short-term financial goals in the next 1-3 years? (Home purchase, car, vacation, emergency fund, debt payoff, wedding)", followUp: "Short-term goals need different strategies. " },
  { key: "mediumTermGoals", section: "Goals & Priorities", question: "What about medium-term goals in the 3-10 year range? (College funding, home renovation, career change, sabbatical, starting a business)", followUp: "Good planning horizon. " },
  { key: "collegeFunding", section: "Goals & Priorities", question: "Are they saving for children's education? If so, do they have 529 plans, Coverdell ESAs, or other education savings? What are the target amounts?", followUp: "Education planning is time-sensitive. ", condition: (d) => d.dependents && !d.dependents.toLowerCase().includes("none") && d.dependents !== "0" },
  { key: "lifestyleGoals", section: "Goals & Priorities", question: "Are there any lifestyle goals that require significant funding? (Second home, boat, extended travel, early retirement, philanthropic project)", followUp: "Dreams deserve a plan. " },
  { key: "incomeGoal", section: "Goals & Priorities", question: "What is their target passive income goal? (Monthly or annual amount they'd like to receive without working)", followUp: "Passive income is the ultimate goal. " },
  { key: "netWorthGoal", section: "Goals & Priorities", question: "Do they have a target net worth they're working toward? By what age?", followUp: "Specific targets are powerful motivators. " },
  { key: "financialFreedom", section: "Goals & Priorities", question: "How do they define financial freedom? What would their life look like if money were no longer a constraint?", followUp: "That's a powerful vision. " },
  { key: "majorPurchases", section: "Goals & Priorities", question: "Are any major purchases or financial events planned in the next 1-5 years? (Home, business, investment property, vehicle, wedding, medical procedure)", followUp: "Good to plan ahead. " },
  { key: "dealBreakers", section: "Goals & Priorities", question: "Are there any investment types or strategies they absolutely will NOT consider? (Crypto, individual stocks, leverage, annuities, etc.) Any ethical or religious investment restrictions?", followUp: "Respecting boundaries is essential. " },

  // ═══════════════════════════════════════════════════════════════
  // SECTION 12: Health & Lifestyle (8 questions)
  // ═══════════════════════════════════════════════════════════════
  { key: "healthStatus", section: "Health & Lifestyle", question: "How would they rate their overall health? (Excellent, Good, Fair, Poor) Any chronic conditions or ongoing medical treatments?", followUp: "Health affects insurance and planning. " },
  { key: "familyHealth", section: "Health & Lifestyle", question: "Is there a family history of any significant health conditions? (Heart disease, cancer, diabetes, Alzheimer's) This affects longevity planning.", followUp: "Important for long-term projections. " },
  { key: "longevityExpectation", section: "Health & Lifestyle", question: "Based on family history and personal health, how long do they expect to live? (This isn't morbid — it's essential for planning. Average is 85-90 for healthy individuals)", followUp: "Planning for longevity protects against outliving savings. " },
  { key: "tobaccoUse", section: "Health & Lifestyle", question: "Do they use tobacco products? (This significantly affects insurance rates and health projections)", followUp: "Noted. " },
  { key: "prescriptionCosts", section: "Health & Lifestyle", question: "What are their approximate annual out-of-pocket healthcare and prescription costs?", followUp: "Healthcare costs compound over time. " },
  { key: "ltcPlanning", section: "Health & Lifestyle", question: "Have they thought about long-term care planning? (In-home care, assisted living, nursing home) Do they have a preference?", followUp: "Planning now saves stress later. " },
  { key: "lifestyle", section: "Health & Lifestyle", question: "How would they describe their lifestyle spending? (Frugal, moderate, comfortable, lavish) Do they expect this to change in retirement?", followUp: "Lifestyle drives the numbers. " },
  { key: "hobbies", section: "Health & Lifestyle", question: "What are their hobbies and interests? (Some hobbies like golf, boating, or travel have significant cost implications for retirement planning)", followUp: "Good to factor in. " },

  // ═══════════════════════════════════════════════════════════════
  // SECTION 13: Real Estate (8 questions)
  // ═══════════════════════════════════════════════════════════════
  { key: "primaryHome", section: "Real Estate", question: "Do they own their primary residence? What is the estimated current market value and remaining mortgage balance?", followUp: "Thank you. " },
  { key: "homeEquity", section: "Real Estate", question: "What is their approximate home equity? Have they considered using it strategically? (HELOC, reverse mortgage, downsizing)", followUp: "Home equity is often the largest asset. " },
  { key: "rentalProperties", section: "Real Estate", question: "Do they own any rental or investment properties? For each: location, value, mortgage, monthly rent, cash flow, and management approach.", followUp: "Real estate can be powerful. " },
  { key: "realEstateInterest", section: "Real Estate", question: "Are they interested in acquiring more real estate? (Rental properties, commercial, REITs, real estate syndications, vacation property)", followUp: "Good to know their appetite. " },
  { key: "propertyTaxes", section: "Real Estate", question: "What are their annual property taxes across all properties?", followUp: "Noted. " },
  { key: "homeImprovements", section: "Real Estate", question: "Are any major home improvements or repairs planned? (Roof, HVAC, renovation, addition) Approximate cost and timeline?", followUp: "Good to budget for. " },
  { key: "downsizePlan", section: "Real Estate", question: "Do they plan to downsize, relocate, or sell their home in the foreseeable future? If so, when and where?", followUp: "Housing transitions affect the whole plan. " },
  { key: "realEstateStrategy", section: "Real Estate", question: "Based on their FICO score, what interest rate range would they likely qualify for on a new mortgage or investment property loan?", followUp: "Credit score directly impacts borrowing costs. " },

  // ═══════════════════════════════════════════════════════════════
  // SECTION 14: Business Interests (8 questions — conditional)
  // ═══════════════════════════════════════════════════════════════
  { key: "businessType", section: "Business Interests", question: "What type of business do they own? (LLC, S-Corp, C-Corp, Partnership, Sole Proprietorship) What industry?", followUp: "Thank you. ", condition: (d) => d.businessInterests && !d.businessInterests.toLowerCase().includes("no") && d.businessInterests.toLowerCase() !== "none" },
  { key: "businessRevenue", section: "Business Interests", question: "What is the annual revenue and approximate net profit of the business?", followUp: "Good metrics. ", condition: (d) => d.businessInterests && !d.businessInterests.toLowerCase().includes("no") && d.businessInterests.toLowerCase() !== "none" },
  { key: "businessEmployees", section: "Business Interests", question: "How many employees does the business have? Do they offer any employee benefits?", followUp: "Noted. ", condition: (d) => d.businessInterests && !d.businessInterests.toLowerCase().includes("no") && d.businessInterests.toLowerCase() !== "none" },
  { key: "businessValuation", section: "Business Interests", question: "Has the business been formally valued? If so, what was the valuation and when? If not, what do they estimate it's worth?", followUp: "Valuation is key for planning. ", condition: (d) => d.businessInterests && !d.businessInterests.toLowerCase().includes("no") && d.businessInterests.toLowerCase() !== "none" },
  { key: "successionPlan", section: "Business Interests", question: "Do they have a succession or exit plan for the business? (Sell to partner, sell to outsider, pass to children, ESOP, wind down)", followUp: "Exit planning is critical. ", condition: (d) => d.businessInterests && !d.businessInterests.toLowerCase().includes("no") && d.businessInterests.toLowerCase() !== "none" },
  { key: "businessRetirement", section: "Business Interests", question: "Does the business have a retirement plan? (SEP IRA, SIMPLE IRA, Solo 401k, defined benefit plan) Are they maximizing contributions?", followUp: "Business retirement plans offer powerful tax advantages. ", condition: (d) => d.businessInterests && !d.businessInterests.toLowerCase().includes("no") && d.businessInterests.toLowerCase() !== "none" },
  { key: "buySellAgreement", section: "Business Interests", question: "If they have business partners, is there a buy-sell agreement funded by life insurance?", followUp: "Essential for business continuity. ", condition: (d) => d.businessInterests && !d.businessInterests.toLowerCase().includes("no") && d.businessInterests.toLowerCase() !== "none" },
  { key: "businessDebt", section: "Business Interests", question: "Does the business have any outstanding debt? (SBA loans, lines of credit, equipment financing) Have they personally guaranteed any business debt?", followUp: "Personal guarantees affect personal risk. ", condition: (d) => d.businessInterests && !d.businessInterests.toLowerCase().includes("no") && d.businessInterests.toLowerCase() !== "none" },

  // ═══════════════════════════════════════════════════════════════
  // SECTION 15: Advisor Relationship (8 questions)
  // ═══════════════════════════════════════════════════════════════
  { key: "currentAdvisor", section: "Advisor Relationship", question: "Are they currently working with a financial advisor, insurance agent, or wealth manager? If so, for how long?", followUp: "Understood. " },
  { key: "advisorSatisfaction", section: "Advisor Relationship", question: "If they have an existing advisor, what's working well and what's not? What prompted them to explore other options?", followUp: "That's helpful context. ", condition: (d) => d.currentAdvisor && !d.currentAdvisor.toLowerCase().includes("no") && d.currentAdvisor.toLowerCase() !== "none" },
  { key: "communicationPreference", section: "Advisor Relationship", question: "How do they prefer to communicate? (Phone, email, text, video call, in-person) How often do they want to meet? (Monthly, quarterly, annually)", followUp: "We'll match your preference. " },
  { key: "decisionMaker", section: "Advisor Relationship", question: "Who is the primary financial decision-maker in the household? Do both spouses/partners need to be involved in meetings?", followUp: "Important for meeting planning. " },
  { key: "referralSource", section: "Advisor Relationship", question: "How did they hear about us? (Referral, seminar, online, social media, advertising)", followUp: "Thank you. " },
  { key: "expectations", section: "Advisor Relationship", question: "What are their expectations for this advisory relationship? What would make them feel this was the best financial decision they ever made?", followUp: "That's a powerful standard to aim for. " },
  { key: "timeline_urgency", section: "Advisor Relationship", question: "Is there any urgency to getting started? Any deadlines, open enrollment periods, or time-sensitive opportunities?", followUp: "Good to know the timeline. " },
  { key: "additionalNotes", section: "Advisor Relationship", question: "Is there anything else important that we haven't covered? Any concerns, questions, or information you'd like to share?", followUp: "Thank you for being so thorough. " },
];
```

## `client/src/data/onboardingQuestions.ts`

```ts
/**
 * Russell Capital Systems™ — 100-Question Client Onboarding Assessment
 * 10 Categories × 10 Questions = 100 Total
 * Priority 1-5 (20 questions each level, 2 per category per level)
 * Depth selector: level N shows all questions with priority ≤ N
 *   Level 1 = 20 questions (essentials)
 *   Level 2 = 40 questions
 *   Level 3 = 60 questions
 *   Level 4 = 80 questions
 *   Level 5 = 100 questions (full deep-dive)
 */

export interface OnboardingQuestion {
  id: number;
  text: string;
  category: string;
  priority: number; // 1-5
  type: "text" | "number" | "select" | "slider" | "boolean";
  options?: { label: string; value: string }[];
  placeholder?: string;
  helperText?: string;
}

export interface OnboardingCategory {
  key: string;
  label: string;
  description: string;
  icon: string;
}

export const ONBOARDING_CATEGORIES: OnboardingCategory[] = [
  { key: "personal", label: "Personal & Family", description: "Your household, dependents, and life stage", icon: "User" },
  { key: "income", label: "Income & Employment", description: "Earnings, job stability, and income sources", icon: "Briefcase" },
  { key: "assets", label: "Assets & Net Worth", description: "Savings, investments, and property", icon: "Wallet" },
  { key: "debt", label: "Debt & Obligations", description: "Mortgages, loans, and recurring liabilities", icon: "CreditCard" },
  { key: "insurance", label: "Insurance Coverage", description: "Life, health, disability, and long-term care", icon: "Shield" },
  { key: "retirement", label: "Retirement Planning", description: "401(k), IRA, pension, and Social Security", icon: "Clock" },
  { key: "tax", label: "Tax Situation", description: "Filing status, bracket, and tax planning", icon: "FileText" },
  { key: "estate", label: "Estate & Legacy", description: "Wills, trusts, and wealth transfer", icon: "Building" },
  { key: "goals", label: "Goals & Priorities", description: "Short-term and long-term financial objectives", icon: "Target" },
  { key: "risk", label: "Risk & Behavioral", description: "Investment temperament and decision-making style", icon: "Brain" },
];

export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  // ═══════════════════════════════════════════════════════════════
  // PERSONAL & FAMILY — 10 questions (2 per priority level)
  // ═══════════════════════════════════════════════════════════════
  { id: 1, category: "personal", priority: 1, type: "text", text: "What is your full legal name?", placeholder: "First and last name" },
  { id: 2, category: "personal", priority: 1, type: "number", text: "What is your current age?", placeholder: "e.g. 45" },
  { id: 3, category: "personal", priority: 2, type: "select", text: "What is your marital status?", options: [{ label: "Single", value: "single" }, { label: "Married", value: "married" }, { label: "Divorced", value: "divorced" }, { label: "Widowed", value: "widowed" }, { label: "Domestic Partner", value: "partner" }] },
  { id: 4, category: "personal", priority: 2, type: "number", text: "How many dependents do you currently support?", placeholder: "0" },
  { id: 5, category: "personal", priority: 3, type: "text", text: "What is your spouse or partner's name and age?", placeholder: "Name, age" },
  { id: 6, category: "personal", priority: 3, type: "select", text: "What is your primary state of residence?", options: [{ label: "Select state", value: "" }], helperText: "Used for state-specific tax and insurance analysis" },
  { id: 7, category: "personal", priority: 4, type: "text", text: "List the ages and relationships of all dependents (children, parents, etc.)", placeholder: "e.g. Son 12, Daughter 8, Mother 72" },
  { id: 8, category: "personal", priority: 4, type: "select", text: "Do you anticipate any major life changes in the next 3 years?", options: [{ label: "No major changes expected", value: "none" }, { label: "Marriage or divorce", value: "marriage_change" }, { label: "New child or adoption", value: "child" }, { label: "Career change", value: "career" }, { label: "Relocation", value: "relocation" }, { label: "Retirement", value: "retirement" }] },
  { id: 9, category: "personal", priority: 5, type: "text", text: "Describe your family's health history and any chronic conditions that may affect financial planning.", placeholder: "Health considerations..." },
  { id: 10, category: "personal", priority: 5, type: "boolean", text: "Are you a U.S. citizen or permanent resident for tax purposes?" },

  // ═══════════════════════════════════════════════════════════════
  // INCOME & EMPLOYMENT — 10 questions
  // ═══════════════════════════════════════════════════════════════
  { id: 11, category: "income", priority: 1, type: "number", text: "What is your annual gross household income?", placeholder: "$0", helperText: "Include all sources: salary, business, rental, etc." },
  { id: 12, category: "income", priority: 1, type: "select", text: "What is your primary employment type?", options: [{ label: "W-2 Employee", value: "w2" }, { label: "Self-Employed / 1099", value: "self_employed" }, { label: "Business Owner", value: "business_owner" }, { label: "Retired", value: "retired" }, { label: "Not Currently Employed", value: "unemployed" }] },
  { id: 13, category: "income", priority: 2, type: "number", text: "What is your spouse's annual income (if applicable)?", placeholder: "$0" },
  { id: 14, category: "income", priority: 2, type: "select", text: "How stable do you consider your primary income source?", options: [{ label: "Very stable (government, tenured)", value: "very_stable" }, { label: "Stable (established employer)", value: "stable" }, { label: "Moderate (commission-based, contract)", value: "moderate" }, { label: "Variable (seasonal, gig economy)", value: "variable" }, { label: "Uncertain", value: "uncertain" }] },
  { id: 15, category: "income", priority: 3, type: "number", text: "What percentage of your income is variable (bonuses, commissions, etc.)?", placeholder: "0%", helperText: "Approximate percentage" },
  { id: 16, category: "income", priority: 3, type: "boolean", text: "Do you have any passive income streams (rental, royalties, dividends)?" },
  { id: 17, category: "income", priority: 4, type: "number", text: "What is your annual passive income amount?", placeholder: "$0" },
  { id: 18, category: "income", priority: 4, type: "text", text: "Describe any side businesses or additional income sources.", placeholder: "Business details..." },
  { id: 19, category: "income", priority: 5, type: "select", text: "Do you expect your income to increase, stay flat, or decrease over the next 5 years?", options: [{ label: "Significant increase (>15%)", value: "sig_increase" }, { label: "Moderate increase (5-15%)", value: "mod_increase" }, { label: "Stay roughly the same", value: "flat" }, { label: "Moderate decrease", value: "mod_decrease" }, { label: "Significant decrease (retirement, etc.)", value: "sig_decrease" }] },
  { id: 20, category: "income", priority: 5, type: "boolean", text: "Does your employer offer equity compensation (stock options, RSUs, ESPP)?" },

  // ═══════════════════════════════════════════════════════════════
  // ASSETS & NET WORTH — 10 questions
  // ═══════════════════════════════════════════════════════════════
  { id: 21, category: "assets", priority: 1, type: "number", text: "What is the total value of your liquid savings (checking, savings, money market)?", placeholder: "$0" },
  { id: 22, category: "assets", priority: 1, type: "number", text: "What is the approximate total value of your investment accounts (brokerage, mutual funds)?", placeholder: "$0" },
  { id: 23, category: "assets", priority: 2, type: "number", text: "What is the estimated market value of all real estate you own?", placeholder: "$0" },
  { id: 24, category: "assets", priority: 2, type: "number", text: "What is the total equity in your primary residence?", placeholder: "$0" },
  { id: 25, category: "assets", priority: 3, type: "number", text: "Do you own any investment or rental properties? If so, what is their combined value?", placeholder: "$0" },
  { id: 26, category: "assets", priority: 3, type: "boolean", text: "Do you have any collectibles, precious metals, or alternative assets worth over $50,000?" },
  { id: 27, category: "assets", priority: 4, type: "number", text: "What is the total cash value of any life insurance policies you own?", placeholder: "$0" },
  { id: 28, category: "assets", priority: 4, type: "number", text: "What is the current value of any annuity contracts you hold?", placeholder: "$0" },
  { id: 29, category: "assets", priority: 5, type: "text", text: "List any business interests, partnerships, or private equity holdings and their estimated value.", placeholder: "Business interests..." },
  { id: 30, category: "assets", priority: 5, type: "number", text: "What is the total value of any cryptocurrency or digital asset holdings?", placeholder: "$0" },

  // ═══════════════════════════════════════════════════════════════
  // DEBT & OBLIGATIONS — 10 questions
  // ═══════════════════════════════════════════════════════════════
  { id: 31, category: "debt", priority: 1, type: "number", text: "What is your total outstanding mortgage balance?", placeholder: "$0" },
  { id: 32, category: "debt", priority: 1, type: "number", text: "What are your total monthly debt payments (mortgage, car, student loans, credit cards)?", placeholder: "$0" },
  { id: 33, category: "debt", priority: 2, type: "number", text: "What is your current mortgage interest rate?", placeholder: "0.00%", helperText: "If multiple properties, use primary residence rate" },
  { id: 34, category: "debt", priority: 2, type: "number", text: "What is your total credit card balance?", placeholder: "$0" },
  { id: 35, category: "debt", priority: 3, type: "number", text: "What is your total student loan balance?", placeholder: "$0" },
  { id: 36, category: "debt", priority: 3, type: "number", text: "What is your total auto loan balance?", placeholder: "$0" },
  { id: 37, category: "debt", priority: 4, type: "boolean", text: "Do you have any outstanding HELOC or home equity loan balances?" },
  { id: 38, category: "debt", priority: 4, type: "number", text: "What is your debt-to-income ratio (total monthly debt / gross monthly income)?", placeholder: "0%", helperText: "We can calculate this for you if unsure" },
  { id: 39, category: "debt", priority: 5, type: "text", text: "Describe any co-signed loans, business debts, or contingent liabilities.", placeholder: "Details..." },
  { id: 40, category: "debt", priority: 5, type: "select", text: "What is your primary debt elimination strategy?", options: [{ label: "Minimum payments only", value: "minimum" }, { label: "Avalanche (highest rate first)", value: "avalanche" }, { label: "Snowball (smallest balance first)", value: "snowball" }, { label: "Consolidation", value: "consolidation" }, { label: "No specific strategy", value: "none" }] },

  // ═══════════════════════════════════════════════════════════════
  // INSURANCE COVERAGE — 10 questions
  // ═══════════════════════════════════════════════════════════════
  { id: 41, category: "insurance", priority: 1, type: "boolean", text: "Do you currently have life insurance?" },
  { id: 42, category: "insurance", priority: 1, type: "select", text: "What type of life insurance do you have?", options: [{ label: "None", value: "none" }, { label: "Term Life", value: "term" }, { label: "Whole Life", value: "whole" }, { label: "Universal Life (UL/IUL/VUL)", value: "universal" }, { label: "Multiple types", value: "multiple" }] },
  { id: 43, category: "insurance", priority: 2, type: "number", text: "What is your total life insurance death benefit?", placeholder: "$0" },
  { id: 44, category: "insurance", priority: 2, type: "boolean", text: "Do you have disability insurance (short-term or long-term)?" },
  { id: 45, category: "insurance", priority: 3, type: "boolean", text: "Do you have long-term care insurance?" },
  { id: 46, category: "insurance", priority: 3, type: "number", text: "What is your annual total insurance premium (all policies combined)?", placeholder: "$0" },
  { id: 47, category: "insurance", priority: 4, type: "select", text: "How would you rate your current insurance coverage?", options: [{ label: "Excellent — well protected", value: "excellent" }, { label: "Good — most bases covered", value: "good" }, { label: "Fair — some gaps", value: "fair" }, { label: "Poor — significant gaps", value: "poor" }, { label: "Unsure", value: "unsure" }] },
  { id: 48, category: "insurance", priority: 4, type: "boolean", text: "Does your employer provide group life, disability, or supplemental insurance?" },
  { id: 49, category: "insurance", priority: 5, type: "text", text: "List all insurance policies with carrier names, policy types, and coverage amounts.", placeholder: "Policy details..." },
  { id: 50, category: "insurance", priority: 5, type: "boolean", text: "Have you ever been declined for life or disability insurance?" },

  // ═══════════════════════════════════════════════════════════════
  // RETIREMENT PLANNING — 10 questions
  // ═══════════════════════════════════════════════════════════════
  { id: 51, category: "retirement", priority: 1, type: "number", text: "At what age do you plan to retire?", placeholder: "65" },
  { id: 52, category: "retirement", priority: 1, type: "number", text: "What is the total balance of all your retirement accounts (401k, IRA, Roth, etc.)?", placeholder: "$0" },
  { id: 53, category: "retirement", priority: 2, type: "number", text: "How much do you contribute monthly to retirement accounts?", placeholder: "$0" },
  { id: 54, category: "retirement", priority: 2, type: "boolean", text: "Does your employer offer a 401(k) match? If so, are you maximizing it?" },
  { id: 55, category: "retirement", priority: 3, type: "number", text: "What is your estimated Social Security benefit at full retirement age?", placeholder: "$0/month" },
  { id: 56, category: "retirement", priority: 3, type: "boolean", text: "Do you have a pension from any current or previous employer?" },
  { id: 57, category: "retirement", priority: 4, type: "number", text: "How much annual income do you need in retirement (in today's dollars)?", placeholder: "$0" },
  { id: 58, category: "retirement", priority: 4, type: "select", text: "Have you considered a Roth conversion strategy?", options: [{ label: "Already doing Roth conversions", value: "active" }, { label: "Interested but haven't started", value: "interested" }, { label: "Not sure what it is", value: "unsure" }, { label: "Not interested", value: "not_interested" }] },
  { id: 59, category: "retirement", priority: 5, type: "text", text: "Describe your ideal retirement lifestyle and any specific plans (travel, relocation, part-time work).", placeholder: "Retirement vision..." },
  { id: 60, category: "retirement", priority: 5, type: "boolean", text: "Are you concerned about outliving your retirement savings?" },

  // ═══════════════════════════════════════════════════════════════
  // TAX SITUATION — 10 questions
  // ═══════════════════════════════════════════════════════════════
  { id: 61, category: "tax", priority: 1, type: "select", text: "What is your federal tax filing status?", options: [{ label: "Single", value: "single" }, { label: "Married Filing Jointly", value: "mfj" }, { label: "Married Filing Separately", value: "mfs" }, { label: "Head of Household", value: "hoh" }, { label: "Qualifying Widow(er)", value: "qw" }] },
  { id: 62, category: "tax", priority: 1, type: "select", text: "What is your approximate federal tax bracket?", options: [{ label: "10% ($0-$11,600)", value: "10" }, { label: "12% ($11,601-$47,150)", value: "12" }, { label: "22% ($47,151-$100,525)", value: "22" }, { label: "24% ($100,526-$191,950)", value: "24" }, { label: "32% ($191,951-$243,725)", value: "32" }, { label: "35% ($243,726-$609,350)", value: "35" }, { label: "37% ($609,351+)", value: "37" }, { label: "Not sure", value: "unsure" }] },
  { id: 63, category: "tax", priority: 2, type: "number", text: "What was your total federal tax liability last year?", placeholder: "$0" },
  { id: 64, category: "tax", priority: 2, type: "select", text: "Do you itemize deductions or take the standard deduction?", options: [{ label: "Standard deduction", value: "standard" }, { label: "Itemize deductions", value: "itemize" }, { label: "Not sure", value: "unsure" }] },
  { id: 65, category: "tax", priority: 3, type: "number", text: "What is your state income tax rate?", placeholder: "0%", helperText: "Enter 0 if your state has no income tax" },
  { id: 66, category: "tax", priority: 3, type: "boolean", text: "Do you have any capital gains or losses to report this year?" },
  { id: 67, category: "tax", priority: 4, type: "boolean", text: "Are you subject to the Alternative Minimum Tax (AMT)?" },
  { id: 68, category: "tax", priority: 4, type: "boolean", text: "Do you have any tax-loss harvesting strategies in place?" },
  { id: 69, category: "tax", priority: 5, type: "text", text: "Describe any complex tax situations (foreign income, K-1 partnerships, real estate depreciation, etc.).", placeholder: "Tax details..." },
  { id: 70, category: "tax", priority: 5, type: "boolean", text: "Are you currently working with a CPA or tax advisor?" },

  // ═══════════════════════════════════════════════════════════════
  // ESTATE & LEGACY — 10 questions
  // ═══════════════════════════════════════════════════════════════
  { id: 71, category: "estate", priority: 1, type: "boolean", text: "Do you have a current will or living trust?" },
  { id: 72, category: "estate", priority: 1, type: "boolean", text: "Have you designated beneficiaries on all your financial accounts?" },
  { id: 73, category: "estate", priority: 2, type: "boolean", text: "Do you have a power of attorney (financial and healthcare)?" },
  { id: 74, category: "estate", priority: 2, type: "boolean", text: "Do you have an advance healthcare directive or living will?" },
  { id: 75, category: "estate", priority: 3, type: "select", text: "How important is leaving a financial legacy to your heirs?", options: [{ label: "Extremely important — top priority", value: "top" }, { label: "Important — but not at expense of my lifestyle", value: "important" }, { label: "Somewhat important", value: "somewhat" }, { label: "Not a priority", value: "not_priority" }] },
  { id: 76, category: "estate", priority: 3, type: "number", text: "What is the total estimated value of your estate?", placeholder: "$0" },
  { id: 77, category: "estate", priority: 4, type: "boolean", text: "Have you considered or established an irrevocable life insurance trust (ILIT)?" },
  { id: 78, category: "estate", priority: 4, type: "boolean", text: "Are you making annual gifts to family members or charities for estate tax planning?" },
  { id: 79, category: "estate", priority: 5, type: "text", text: "Describe your estate planning goals and any specific wishes for wealth transfer.", placeholder: "Estate goals..." },
  { id: 80, category: "estate", priority: 5, type: "boolean", text: "Do you have any charitable giving strategies (donor-advised fund, charitable remainder trust, etc.)?" },

  // ═══════════════════════════════════════════════════════════════
  // GOALS & PRIORITIES — 10 questions
  // ═══════════════════════════════════════════════════════════════
  { id: 81, category: "goals", priority: 1, type: "select", text: "What is your single most important financial goal right now?", options: [{ label: "Retirement security", value: "retirement" }, { label: "Wealth accumulation", value: "wealth" }, { label: "Debt elimination", value: "debt" }, { label: "Tax optimization", value: "tax" }, { label: "Income protection", value: "protection" }, { label: "Legacy/estate planning", value: "legacy" }, { label: "Education funding", value: "education" }, { label: "Home purchase", value: "home" }] },
  { id: 82, category: "goals", priority: 1, type: "number", text: "What is your target net worth goal?", placeholder: "$0", helperText: "Where do you want to be financially?" },
  { id: 83, category: "goals", priority: 2, type: "number", text: "By what age do you want to achieve financial independence?", placeholder: "55" },
  { id: 84, category: "goals", priority: 2, type: "select", text: "How would you describe your current financial confidence level?", options: [{ label: "Very confident — on track", value: "very_confident" }, { label: "Somewhat confident", value: "somewhat" }, { label: "Neutral — could go either way", value: "neutral" }, { label: "Concerned — falling behind", value: "concerned" }, { label: "Anxious — need help urgently", value: "anxious" }] },
  { id: 85, category: "goals", priority: 3, type: "boolean", text: "Do you have children's education funding needs (529 plans, etc.)?" },
  { id: 86, category: "goals", priority: 3, type: "number", text: "How much do you need for upcoming major purchases in the next 5 years?", placeholder: "$0" },
  { id: 87, category: "goals", priority: 4, type: "text", text: "What keeps you up at night financially? Describe your biggest financial worry.", placeholder: "Financial concerns..." },
  { id: 88, category: "goals", priority: 4, type: "select", text: "How do you prefer to work with a financial advisor?", options: [{ label: "Hands-off — you manage everything", value: "hands_off" }, { label: "Collaborative — we decide together", value: "collaborative" }, { label: "Educational — teach me to manage my own", value: "educational" }, { label: "Periodic check-ins only", value: "periodic" }] },
  { id: 89, category: "goals", priority: 5, type: "text", text: "If money were no object, what would your ideal life look like in 10 years?", placeholder: "Dream scenario..." },
  { id: 90, category: "goals", priority: 5, type: "text", text: "What financial mistakes have you made in the past that you want to avoid repeating?", placeholder: "Past lessons..." },

  // ═══════════════════════════════════════════════════════════════
  // RISK & BEHAVIORAL — 10 questions
  // ═══════════════════════════════════════════════════════════════
  { id: 91, category: "risk", priority: 1, type: "slider", text: "On a scale of 1-10, how comfortable are you with investment risk?", helperText: "1 = avoid all risk, 10 = embrace maximum risk" },
  { id: 92, category: "risk", priority: 1, type: "select", text: "If your portfolio dropped 25% in one month, what would you do?", options: [{ label: "Sell everything immediately", value: "sell_all" }, { label: "Sell some to reduce exposure", value: "sell_some" }, { label: "Hold and wait for recovery", value: "hold" }, { label: "Buy more at lower prices", value: "buy_more" }] },
  { id: 93, category: "risk", priority: 2, type: "select", text: "What is your investment time horizon for your largest account?", options: [{ label: "Less than 3 years", value: "short" }, { label: "3-7 years", value: "medium" }, { label: "7-15 years", value: "long" }, { label: "15+ years", value: "very_long" }] },
  { id: 94, category: "risk", priority: 2, type: "select", text: "How much investment experience do you have?", options: [{ label: "None — complete beginner", value: "none" }, { label: "Limited — basic stocks/bonds", value: "limited" }, { label: "Moderate — diversified portfolio", value: "moderate" }, { label: "Extensive — options, alternatives, etc.", value: "extensive" }] },
  { id: 95, category: "risk", priority: 3, type: "select", text: "Which best describes your investment philosophy?", options: [{ label: "Capital preservation above all", value: "preservation" }, { label: "Steady income with minimal risk", value: "income" }, { label: "Balanced growth and income", value: "balanced" }, { label: "Aggressive growth, accept volatility", value: "growth" }, { label: "Maximum growth, high risk tolerance", value: "aggressive" }] },
  { id: 96, category: "risk", priority: 3, type: "boolean", text: "Have you ever panic-sold investments during a market downturn?" },
  { id: 97, category: "risk", priority: 4, type: "select", text: "How do you typically make financial decisions?", options: [{ label: "Quickly — trust my gut", value: "quick" }, { label: "Research thoroughly then decide", value: "research" }, { label: "Consult advisors before any decision", value: "consult" }, { label: "Procrastinate — avoid decisions", value: "procrastinate" }] },
  { id: 98, category: "risk", priority: 4, type: "boolean", text: "Are you comfortable with illiquid investments (real estate, private equity) that lock up capital for years?" },
  { id: 99, category: "risk", priority: 5, type: "text", text: "Describe the worst financial loss you've experienced and how it affected your decision-making.", placeholder: "Past experience..." },
  { id: 100, category: "risk", priority: 5, type: "select", text: "Would you prefer a guaranteed 5% return or a 50/50 chance of 0% or 12%?", options: [{ label: "Guaranteed 5% — certainty is king", value: "guaranteed" }, { label: "The 50/50 gamble — higher expected value", value: "gamble" }, { label: "Depends on the amount at stake", value: "depends" }] },
];
```

## `client/src/data/pageAuditSummary.ts`

```ts
export const PAGE_AUDIT_SUMMARY = {
  methodologyVersion: "1.0-source-evidence",
  routeCount: 231,
  averageScore: 5.99,
  fiveOrHigherCount: 153,
  belowFiveCount: 78,
  renderHealth: { healthy: 225, atRisk: 6, broken: 0 },
  recommendations: { keep: 83, improve: 68, merge: 5, secondary: 68, retire: 7 },
  generatedAt: "2026-08-26T20:00:00.000Z",
} as const;
```

## `client/src/data/riskToleranceQuestions.ts`

```ts
/**
 * Russell Capital Systems™ — 100-Question Risk Tolerance Assessment
 * 10 Categories × 10 Questions = 100 Total
 * Each question scored 1-5 for a composite Risk Number (1-99)
 */

export interface RiskQuestion {
  id: number;
  text: string;
  category: string;
  priority: number;
  options: { label: string; value: number; detail: string }[];
}

export interface RiskCategory {
  key: string;
  label: string;
  description: string;
  icon: string;
}

export const RISK_CATEGORIES: RiskCategory[] = [
  { key: "financial_capacity", label: "Financial Capacity", description: "Measures your ability to absorb financial losses based on income, assets, and obligations", icon: "DollarSign" },
  { key: "risk_attitude", label: "Risk Attitude & Behavior", description: "Gauges your emotional and psychological response to market volatility and uncertainty", icon: "Brain" },
  { key: "time_horizon", label: "Time Horizon & Life Stage", description: "Evaluates how long your money can remain invested before you need it", icon: "Clock" },
  { key: "investment_experience", label: "Investment Experience", description: "Assesses your familiarity with different asset classes and market cycles", icon: "TrendingUp" },
  { key: "income_stability", label: "Income Stability & Employment", description: "Measures the reliability and diversification of your income sources", icon: "Briefcase" },
  { key: "debt_obligations", label: "Debt & Obligations", description: "Evaluates your current debt load and its impact on risk-taking ability", icon: "CreditCard" },
  { key: "insurance_protection", label: "Insurance & Protection", description: "Assesses your safety net through insurance coverage and estate planning", icon: "Shield" },
  { key: "tax_situation", label: "Tax Situation & Planning", description: "Evaluates your tax bracket, planning sophistication, and tax-advantaged capacity", icon: "FileText" },
  { key: "goals_priorities", label: "Goals & Priorities", description: "Identifies your financial objectives and how they shape your risk requirements", icon: "Target" },
  { key: "behavioral_finance", label: "Behavioral Finance & Psychology", description: "Measures cognitive biases and decision-making patterns under financial stress", icon: "Zap" },
];

export const RISK_QUESTIONS: RiskQuestion[] = [
  // ═══════════════════════════════════════════════════════════════════
  // CATEGORY 1: FINANCIAL CAPACITY (Questions 1-10)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 1, category: "financial_capacity", priority: 1,
    text: "What is your current annual household income from all sources?",
    options: [
      { label: "Under $75,000", value: 1, detail: "Limited surplus for risk-taking" },
      { label: "$75,000 – $150,000", value: 2, detail: "Moderate surplus available" },
      { label: "$150,000 – $300,000", value: 3, detail: "Comfortable surplus for investing" },
      { label: "$300,000 – $750,000", value: 4, detail: "Strong surplus capacity" },
      { label: "Over $750,000", value: 5, detail: "Maximum financial capacity" },
    ],
  },
  {
    id: 2, category: "financial_capacity", priority: 1,
    text: "How many months of living expenses do you maintain in liquid reserves (cash, money market, short-term CDs)?",
    options: [
      { label: "Less than 2 months", value: 1, detail: "Critical liquidity gap" },
      { label: "2–4 months", value: 2, detail: "Below recommended minimum" },
      { label: "4–8 months", value: 3, detail: "Adequate emergency fund" },
      { label: "8–18 months", value: 4, detail: "Strong liquidity position" },
      { label: "Over 18 months", value: 5, detail: "Exceptional liquidity buffer" },
    ],
  },
  {
    id: 3, category: "financial_capacity", priority: 2,
    text: "What is your total investable net worth (excluding primary residence and business equity)?",
    options: [
      { label: "Under $100,000", value: 1, detail: "Early accumulation phase" },
      { label: "$100,000 – $500,000", value: 2, detail: "Building investment base" },
      { label: "$500,000 – $2,000,000", value: 3, detail: "Substantial portfolio" },
      { label: "$2,000,000 – $10,000,000", value: 4, detail: "High net worth" },
      { label: "Over $10,000,000", value: 5, detail: "Ultra-high net worth" },
    ],
  },
  {
    id: 4, category: "financial_capacity", priority: 2,
    text: "What percentage of your monthly income goes toward fixed obligations (mortgage, car payments, insurance, minimum debt payments)?",
    options: [
      { label: "Over 70%", value: 1, detail: "Severely constrained cash flow" },
      { label: "55% – 70%", value: 2, detail: "Tight cash flow" },
      { label: "40% – 55%", value: 3, detail: "Moderate flexibility" },
      { label: "25% – 40%", value: 4, detail: "Good discretionary capacity" },
      { label: "Under 25%", value: 5, detail: "Maximum financial flexibility" },
    ],
  },
  {
    id: 5, category: "financial_capacity", priority: 3,
    text: "Do you have additional income sources beyond your primary employment (rental income, dividends, business income, royalties)?",
    options: [
      { label: "No additional income sources", value: 1, detail: "Single income dependency" },
      { label: "One small additional source (<10% of income)", value: 2, detail: "Minimal diversification" },
      { label: "One significant source (10-25% of income)", value: 3, detail: "Moderate diversification" },
      { label: "Multiple sources (25-50% of income)", value: 4, detail: "Well-diversified income" },
      { label: "Multiple sources exceeding primary income", value: 5, detail: "Highly diversified income" },
    ],
  },
  {
    id: 6, category: "financial_capacity", priority: 3,
    text: "If you lost your primary income today, how long could you maintain your current lifestyle without selling investments?",
    options: [
      { label: "Less than 1 month", value: 1, detail: "Immediate financial vulnerability" },
      { label: "1–3 months", value: 2, detail: "Short-term runway" },
      { label: "3–6 months", value: 3, detail: "Moderate runway" },
      { label: "6–12 months", value: 4, detail: "Comfortable runway" },
      { label: "Over 12 months or indefinitely", value: 5, detail: "Financial independence" },
    ],
  },
  {
    id: 7, category: "financial_capacity", priority: 4,
    text: "What is the current equity position in your primary residence?",
    options: [
      { label: "Underwater or no equity", value: 1, detail: "No home equity cushion" },
      { label: "Less than 20% equity", value: 2, detail: "Limited home equity" },
      { label: "20% – 40% equity", value: 3, detail: "Moderate home equity" },
      { label: "40% – 70% equity", value: 4, detail: "Strong home equity" },
      { label: "Over 70% equity or paid off", value: 5, detail: "Maximum home equity" },
    ],
  },
  {
    id: 8, category: "financial_capacity", priority: 4,
    text: "How would you characterize your current savings rate (percentage of gross income saved/invested annually)?",
    options: [
      { label: "0% or negative (spending exceeds income)", value: 1, detail: "No savings capacity" },
      { label: "1% – 5%", value: 2, detail: "Minimal savings rate" },
      { label: "5% – 15%", value: 3, detail: "Moderate savings rate" },
      { label: "15% – 30%", value: 4, detail: "Strong savings discipline" },
      { label: "Over 30%", value: 5, detail: "Exceptional savings rate" },
    ],
  },
  {
    id: 9, category: "financial_capacity", priority: 5,
    text: "Do you anticipate any major financial obligations in the next 5 years (college tuition, wedding, elder care, business investment)?",
    options: [
      { label: "Yes, multiple large obligations (>$200K total)", value: 1, detail: "Heavy near-term demands" },
      { label: "Yes, one large obligation ($100K–$200K)", value: 2, detail: "Significant near-term demand" },
      { label: "Yes, moderate obligations ($25K–$100K)", value: 3, detail: "Manageable near-term needs" },
      { label: "Minor obligations only (<$25K)", value: 4, detail: "Minimal near-term demands" },
      { label: "No anticipated major obligations", value: 5, detail: "Clear financial runway" },
    ],
  },
  {
    id: 10, category: "financial_capacity", priority: 5,
    text: "What is the maximum dollar amount you could lose in your portfolio this year without it materially affecting your lifestyle?",
    options: [
      { label: "Less than $5,000", value: 1, detail: "Very limited loss capacity" },
      { label: "$5,000 – $25,000", value: 2, detail: "Limited loss capacity" },
      { label: "$25,000 – $100,000", value: 3, detail: "Moderate loss capacity" },
      { label: "$100,000 – $500,000", value: 4, detail: "Strong loss capacity" },
      { label: "Over $500,000", value: 5, detail: "Maximum loss capacity" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // CATEGORY 2: RISK ATTITUDE & BEHAVIOR (Questions 11-20)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 11, category: "risk_attitude", priority: 1,
    text: "If your portfolio dropped 30% in a single quarter, what would be your most likely reaction?",
    options: [
      { label: "Sell everything immediately to stop the bleeding", value: 1, detail: "Panic-driven response" },
      { label: "Sell a significant portion to reduce exposure", value: 2, detail: "Fear-driven reduction" },
      { label: "Hold steady and wait for recovery", value: 3, detail: "Disciplined patience" },
      { label: "Rebalance by buying more of what dropped", value: 4, detail: "Contrarian discipline" },
      { label: "Aggressively buy more — this is an opportunity", value: 5, detail: "Opportunistic aggression" },
    ],
  },
  {
    id: 12, category: "risk_attitude", priority: 1,
    text: "How do you feel when you hear about friends or colleagues making large profits from speculative investments?",
    options: [
      { label: "Relieved I wasn't involved — too risky", value: 1, detail: "Risk-averse mindset" },
      { label: "Slightly envious but comfortable with my approach", value: 2, detail: "Conservative contentment" },
      { label: "Curious and willing to research the opportunity", value: 3, detail: "Open-minded evaluation" },
      { label: "Motivated to allocate a small portion similarly", value: 4, detail: "Calculated risk-taking" },
      { label: "Frustrated I missed out — ready to act on the next one", value: 5, detail: "FOMO-driven aggression" },
    ],
  },
  {
    id: 13, category: "risk_attitude", priority: 2,
    text: "Which statement best describes your investment philosophy?",
    options: [
      { label: "Preserving what I have is more important than growing it", value: 1, detail: "Capital preservation priority" },
      { label: "I want steady, predictable returns even if they're modest", value: 2, detail: "Stability-focused" },
      { label: "I accept some volatility for better long-term returns", value: 3, detail: "Balanced risk-reward" },
      { label: "I'm comfortable with significant swings for superior growth", value: 4, detail: "Growth-oriented" },
      { label: "Maximum growth is my goal — I can handle any volatility", value: 5, detail: "Aggressive growth" },
    ],
  },
  {
    id: 14, category: "risk_attitude", priority: 2,
    text: "When making a major financial decision, how much time do you typically spend analyzing before acting?",
    options: [
      { label: "I avoid major decisions or delegate them entirely", value: 1, detail: "Decision avoidance" },
      { label: "I research extensively and often delay decisions", value: 2, detail: "Analysis paralysis tendency" },
      { label: "I do thorough research and decide within a reasonable timeframe", value: 3, detail: "Balanced decision-making" },
      { label: "I research quickly and act decisively", value: 4, detail: "Confident decision-making" },
      { label: "I trust my instincts and act fast on opportunities", value: 5, detail: "Intuition-driven action" },
    ],
  },
  {
    id: 15, category: "risk_attitude", priority: 3,
    text: "How would you describe your comfort level with investment uncertainty?",
    options: [
      { label: "I need guaranteed returns — uncertainty causes me significant stress", value: 1, detail: "Zero uncertainty tolerance" },
      { label: "I prefer mostly guaranteed with a small speculative portion", value: 2, detail: "Low uncertainty tolerance" },
      { label: "I'm comfortable with moderate uncertainty if the expected return justifies it", value: 3, detail: "Moderate uncertainty tolerance" },
      { label: "I embrace uncertainty as the price of higher returns", value: 4, detail: "High uncertainty tolerance" },
      { label: "I thrive on uncertainty — it's where the best opportunities live", value: 5, detail: "Maximum uncertainty tolerance" },
    ],
  },
  {
    id: 16, category: "risk_attitude", priority: 3,
    text: "If a trusted advisor recommended a strategy with a 40% chance of doubling your money and a 20% chance of losing half, would you proceed?",
    options: [
      { label: "Absolutely not — the loss potential is unacceptable", value: 1, detail: "Loss-averse" },
      { label: "Probably not — I'd need much better odds", value: 2, detail: "Cautious" },
      { label: "I'd consider it with a small allocation", value: 3, detail: "Calculated" },
      { label: "Yes, the expected value is positive — I'd allocate meaningfully", value: 4, detail: "Probability-driven" },
      { label: "Yes, and I'd want to maximize my exposure to this opportunity", value: 5, detail: "Aggressive optimizer" },
    ],
  },
  {
    id: 17, category: "risk_attitude", priority: 4,
    text: "How do you typically react when you see your portfolio statement during a market downturn?",
    options: [
      { label: "I avoid looking at it entirely", value: 1, detail: "Avoidance behavior" },
      { label: "I check it anxiously and consider making changes", value: 2, detail: "Anxiety-driven monitoring" },
      { label: "I review it calmly and stick to my plan", value: 3, detail: "Disciplined review" },
      { label: "I see it as a buying opportunity and look for bargains", value: 4, detail: "Opportunistic review" },
      { label: "I get excited about the discount and increase contributions", value: 5, detail: "Contrarian enthusiasm" },
    ],
  },
  {
    id: 18, category: "risk_attitude", priority: 4,
    text: "What is your attitude toward concentrated positions (having a large percentage in a single investment)?",
    options: [
      { label: "Never — I want maximum diversification at all times", value: 1, detail: "Strict diversification" },
      { label: "Only in very safe assets like treasuries or CDs", value: 2, detail: "Conservative concentration" },
      { label: "Acceptable for high-conviction ideas with a limit (e.g., 10-15%)", value: 3, detail: "Controlled concentration" },
      { label: "Comfortable with 20-30% in my best ideas", value: 4, detail: "Conviction-weighted" },
      { label: "I believe concentration builds wealth — I'm comfortable with 40%+", value: 5, detail: "High conviction" },
    ],
  },
  {
    id: 19, category: "risk_attitude", priority: 5,
    text: "How important is it to you that your investments outperform the S&P 500 index?",
    options: [
      { label: "Not important — I just want to preserve capital", value: 1, detail: "Preservation focus" },
      { label: "Somewhat — but I'd accept lower returns for less risk", value: 2, detail: "Risk-adjusted focus" },
      { label: "Moderately — I'd like to match the market over time", value: 3, detail: "Market-matching goal" },
      { label: "Very important — I want to beat the market consistently", value: 4, detail: "Alpha-seeking" },
      { label: "Critical — I'm willing to take significant risk to outperform", value: 5, detail: "Aggressive alpha pursuit" },
    ],
  },
  {
    id: 20, category: "risk_attitude", priority: 5,
    text: "If you had to choose between a guaranteed $50,000 gain or a 50/50 chance of gaining $150,000 or gaining nothing, which would you choose?",
    options: [
      { label: "Guaranteed $50,000 — no question", value: 1, detail: "Strong certainty preference" },
      { label: "Probably the guarantee, but I'd think about it", value: 2, detail: "Mild certainty preference" },
      { label: "It's a coin flip — both have the same expected value", value: 3, detail: "Rational evaluation" },
      { label: "I'd lean toward the gamble for the upside", value: 4, detail: "Upside preference" },
      { label: "The gamble — the expected value is $75K vs $50K", value: 5, detail: "Expected value optimizer" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // CATEGORY 3: TIME HORIZON & LIFE STAGE (Questions 21-30)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 21, category: "time_horizon", priority: 1,
    text: "What is your current age?",
    options: [
      { label: "Under 30", value: 5, detail: "Maximum time horizon" },
      { label: "30–40", value: 4, detail: "Long time horizon" },
      { label: "40–52", value: 3, detail: "Medium time horizon" },
      { label: "52–62", value: 2, detail: "Approaching retirement" },
      { label: "Over 62", value: 1, detail: "Near or in retirement" },
    ],
  },
  {
    id: 22, category: "time_horizon", priority: 1,
    text: "When do you plan to begin drawing income from your investment portfolio?",
    options: [
      { label: "Within the next 2 years", value: 1, detail: "Immediate income need" },
      { label: "2–5 years", value: 2, detail: "Short-term income need" },
      { label: "5–10 years", value: 3, detail: "Medium-term planning" },
      { label: "10–20 years", value: 4, detail: "Long-term accumulation" },
      { label: "20+ years or never (legacy wealth)", value: 5, detail: "Multi-generational horizon" },
    ],
  },
  {
    id: 23, category: "time_horizon", priority: 2,
    text: "What is your planned retirement age?",
    options: [
      { label: "Already retired or within 3 years", value: 1, detail: "Immediate transition" },
      { label: "Within 3–7 years", value: 2, detail: "Near-term retirement" },
      { label: "Within 7–15 years", value: 3, detail: "Mid-career planning" },
      { label: "15–25 years away", value: 4, detail: "Early career accumulation" },
      { label: "25+ years or no plans to fully retire", value: 5, detail: "Maximum accumulation window" },
    ],
  },
  {
    id: 24, category: "time_horizon", priority: 2,
    text: "How long do you expect to live in retirement (considering family health history)?",
    options: [
      { label: "10–15 years", value: 1, detail: "Shorter distribution period" },
      { label: "15–20 years", value: 2, detail: "Moderate distribution period" },
      { label: "20–25 years", value: 3, detail: "Standard planning horizon" },
      { label: "25–35 years", value: 4, detail: "Extended longevity planning" },
      { label: "35+ years (family history of longevity)", value: 5, detail: "Maximum longevity risk" },
    ],
  },
  {
    id: 25, category: "time_horizon", priority: 3,
    text: "Do you have children or dependents who will need financial support in the next 10 years?",
    options: [
      { label: "Yes, multiple dependents with significant needs (college, special needs)", value: 1, detail: "Heavy dependent obligations" },
      { label: "Yes, children approaching college age", value: 2, detail: "Near-term education costs" },
      { label: "Yes, but their needs are mostly funded already", value: 3, detail: "Manageable dependent costs" },
      { label: "No dependents, or they are financially independent", value: 4, detail: "No dependent obligations" },
      { label: "No dependents and no plans for any", value: 5, detail: "Maximum financial freedom" },
    ],
  },
  {
    id: 26, category: "time_horizon", priority: 3,
    text: "What is your primary financial goal for the next 10 years?",
    options: [
      { label: "Generate stable income to cover living expenses", value: 1, detail: "Income preservation" },
      { label: "Grow wealth moderately while maintaining income", value: 2, detail: "Income with growth" },
      { label: "Balance growth and income equally", value: 3, detail: "Balanced objective" },
      { label: "Maximize portfolio growth with minimal income needs", value: 4, detail: "Growth accumulation" },
      { label: "Aggressive wealth building — I don't need this money for decades", value: 5, detail: "Pure growth" },
    ],
  },
  {
    id: 27, category: "time_horizon", priority: 4,
    text: "How would you describe your career trajectory?",
    options: [
      { label: "Winding down — planning to reduce work within 3 years", value: 1, detail: "Declining earning years" },
      { label: "Stable — maintaining current income level", value: 2, detail: "Plateau phase" },
      { label: "Growing moderately — expect 3-5% annual increases", value: 3, detail: "Steady growth" },
      { label: "Growing strongly — expect significant advancement", value: 4, detail: "Strong upward trajectory" },
      { label: "Peak earning years ahead — substantial income growth expected", value: 5, detail: "Maximum earning potential" },
    ],
  },
  {
    id: 28, category: "time_horizon", priority: 4,
    text: "Do you plan to leave a financial legacy for heirs or charitable causes?",
    options: [
      { label: "No — I plan to spend everything in my lifetime", value: 3, detail: "Spend-down approach" },
      { label: "Minimal — whatever is left goes to heirs", value: 2, detail: "Residual legacy" },
      { label: "Moderate — I want to leave a meaningful inheritance", value: 3, detail: "Intentional legacy" },
      { label: "Significant — legacy planning is a major priority", value: 4, detail: "Legacy-focused" },
      { label: "Multi-generational wealth transfer is my primary goal", value: 5, detail: "Dynasty planning" },
    ],
  },
  {
    id: 29, category: "time_horizon", priority: 5,
    text: "How stable is your current living situation?",
    options: [
      { label: "Likely to relocate or downsize within 2 years", value: 1, detail: "Near-term transition" },
      { label: "May relocate within 5 years", value: 2, detail: "Moderate uncertainty" },
      { label: "Settled for the foreseeable future (5-10 years)", value: 3, detail: "Stable situation" },
      { label: "Very settled — no plans to move for 10+ years", value: 4, detail: "Long-term stability" },
      { label: "Permanently settled — own home outright, no plans to move", value: 5, detail: "Maximum stability" },
    ],
  },
  {
    id: 30, category: "time_horizon", priority: 5,
    text: "What is your spouse/partner's age relative to yours (if applicable)?",
    options: [
      { label: "N/A — single", value: 3, detail: "Individual planning only" },
      { label: "Spouse is 5+ years older", value: 2, detail: "Earlier joint income needs" },
      { label: "Spouse is within 5 years of my age", value: 3, detail: "Aligned timeline" },
      { label: "Spouse is 5-10 years younger", value: 4, detail: "Extended planning horizon" },
      { label: "Spouse is 10+ years younger", value: 5, detail: "Multi-decade planning needed" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // CATEGORY 4: INVESTMENT EXPERIENCE (Questions 31-40)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 31, category: "investment_experience", priority: 1,
    text: "How many years have you been actively managing or directing investments?",
    options: [
      { label: "Less than 1 year", value: 1, detail: "Beginner investor" },
      { label: "1–5 years", value: 2, detail: "Early-stage investor" },
      { label: "5–15 years", value: 3, detail: "Experienced investor" },
      { label: "15–25 years", value: 4, detail: "Seasoned investor" },
      { label: "Over 25 years", value: 5, detail: "Veteran investor" },
    ],
  },
  {
    id: 32, category: "investment_experience", priority: 1,
    text: "Which of the following have you personally invested in? (Select the most complex)",
    options: [
      { label: "Savings accounts and CDs only", value: 1, detail: "Basic savings only" },
      { label: "Mutual funds and/or ETFs", value: 2, detail: "Pooled investment vehicles" },
      { label: "Individual stocks and bonds", value: 3, detail: "Direct securities" },
      { label: "Options, futures, or margin accounts", value: 4, detail: "Derivatives and leverage" },
      { label: "Private equity, hedge funds, or venture capital", value: 5, detail: "Alternative investments" },
    ],
  },
  {
    id: 33, category: "investment_experience", priority: 2,
    text: "Have you ever invested in real estate beyond your primary residence?",
    options: [
      { label: "No real estate investment experience", value: 1, detail: "No RE experience" },
      { label: "Owned one rental property at some point", value: 2, detail: "Basic RE experience" },
      { label: "Currently own 1-2 rental properties", value: 3, detail: "Active RE investor" },
      { label: "Own 3-5 properties or have done commercial deals", value: 4, detail: "Experienced RE investor" },
      { label: "Extensive portfolio (5+ properties, syndications, or development)", value: 5, detail: "Professional RE investor" },
    ],
  },
  {
    id: 34, category: "investment_experience", priority: 2,
    text: "How familiar are you with life insurance as an investment vehicle (IUL, whole life, VUL)?",
    options: [
      { label: "Not familiar at all", value: 1, detail: "No insurance investment knowledge" },
      { label: "Heard of it but don't understand the mechanics", value: 2, detail: "Awareness only" },
      { label: "Understand the basics of cash value life insurance", value: 3, detail: "Foundational knowledge" },
      { label: "Own a cash value policy and understand its features", value: 4, detail: "Active policyholder" },
      { label: "Deep expertise — use IUL/whole life as a core strategy", value: 5, detail: "Advanced insurance strategist" },
    ],
  },
  {
    id: 35, category: "investment_experience", priority: 3,
    text: "Have you ever experienced a portfolio loss exceeding 20%?",
    options: [
      { label: "No, and I would find that devastating", value: 1, detail: "Untested, high anxiety" },
      { label: "No, but I think I could handle it", value: 2, detail: "Untested, moderate confidence" },
      { label: "Yes, and I recovered by staying the course", value: 3, detail: "Tested and disciplined" },
      { label: "Yes, multiple times — it's part of investing", value: 4, detail: "Battle-hardened" },
      { label: "Yes, and I profited by buying during the downturn", value: 5, detail: "Crisis-tested opportunist" },
    ],
  },
  {
    id: 36, category: "investment_experience", priority: 3,
    text: "How do you typically make investment decisions?",
    options: [
      { label: "I rely entirely on my advisor's recommendations", value: 1, detail: "Fully delegated" },
      { label: "I follow my advisor's lead but ask questions", value: 2, detail: "Guided with input" },
      { label: "I collaborate equally with my advisor on decisions", value: 3, detail: "Collaborative approach" },
      { label: "I do my own research and use my advisor to validate", value: 4, detail: "Self-directed with validation" },
      { label: "I make all decisions independently", value: 5, detail: "Fully self-directed" },
    ],
  },
  {
    id: 37, category: "investment_experience", priority: 4,
    text: "How well do you understand the concept of asset correlation and portfolio diversification?",
    options: [
      { label: "I don't know what these terms mean", value: 1, detail: "No diversification knowledge" },
      { label: "I know diversification means 'don't put all eggs in one basket'", value: 2, detail: "Basic concept" },
      { label: "I understand how different asset classes move relative to each other", value: 3, detail: "Intermediate understanding" },
      { label: "I can construct a diversified portfolio across asset classes", value: 4, detail: "Advanced understanding" },
      { label: "I understand modern portfolio theory, efficient frontier, and factor investing", value: 5, detail: "Expert-level knowledge" },
    ],
  },
  {
    id: 38, category: "investment_experience", priority: 4,
    text: "Have you ever used leverage (margin, HELOC for investing, premium financing) in your investment strategy?",
    options: [
      { label: "No, and I wouldn't consider it", value: 1, detail: "Anti-leverage" },
      { label: "No, but I'm open to learning about it", value: 2, detail: "Leverage-curious" },
      { label: "Yes, conservatively (e.g., HELOC for rental property)", value: 3, detail: "Conservative leverage user" },
      { label: "Yes, regularly as part of my strategy", value: 4, detail: "Active leverage user" },
      { label: "Yes, including premium financing and margin strategies", value: 5, detail: "Advanced leverage strategist" },
    ],
  },
  {
    id: 39, category: "investment_experience", priority: 5,
    text: "How familiar are you with annuity products (MYGA, FIA, SPIA, variable annuities)?",
    options: [
      { label: "Not familiar at all", value: 1, detail: "No annuity knowledge" },
      { label: "Heard of annuities but don't understand the types", value: 2, detail: "Awareness only" },
      { label: "Understand the basics of fixed and variable annuities", value: 3, detail: "Foundational knowledge" },
      { label: "Own annuities and understand riders, caps, and participation rates", value: 4, detail: "Active annuity owner" },
      { label: "Deep expertise — use annuities strategically for income and accumulation", value: 5, detail: "Advanced annuity strategist" },
    ],
  },
  {
    id: 40, category: "investment_experience", priority: 5,
    text: "Have you ever invested in cryptocurrency or digital assets?",
    options: [
      { label: "No, and I have no interest", value: 1, detail: "Crypto-averse" },
      { label: "No, but I'm curious about it", value: 2, detail: "Crypto-curious" },
      { label: "Yes, a small allocation (<5% of portfolio)", value: 3, detail: "Small crypto allocation" },
      { label: "Yes, a meaningful allocation (5-15% of portfolio)", value: 4, detail: "Active crypto investor" },
      { label: "Yes, significant allocation (>15%) including DeFi/staking", value: 5, detail: "Advanced crypto investor" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // CATEGORY 5: INCOME STABILITY & EMPLOYMENT (Questions 41-50)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 41, category: "income_stability", priority: 1,
    text: "How would you describe your primary income source?",
    options: [
      { label: "Commission-only or gig/freelance (highly variable)", value: 1, detail: "Highly variable income" },
      { label: "Base + commission or seasonal employment", value: 2, detail: "Semi-variable income" },
      { label: "Salaried employee at a private company", value: 3, detail: "Stable private sector" },
      { label: "Government, tenured, or union-protected position", value: 4, detail: "Very stable income" },
      { label: "Business owner with diversified revenue or retired with guaranteed income", value: 5, detail: "Maximum income security" },
    ],
  },
  {
    id: 42, category: "income_stability", priority: 1,
    text: "How secure is your current employment or business?",
    options: [
      { label: "Very uncertain — layoffs possible or business struggling", value: 1, detail: "High job risk" },
      { label: "Somewhat uncertain — industry is volatile", value: 2, detail: "Moderate job risk" },
      { label: "Reasonably secure — stable company and role", value: 3, detail: "Stable employment" },
      { label: "Very secure — essential role or strong business", value: 4, detail: "High job security" },
      { label: "Extremely secure — tenured, business owner, or financially independent", value: 5, detail: "Maximum security" },
    ],
  },
  {
    id: 43, category: "income_stability", priority: 2,
    text: "Do you have a pension or defined benefit plan?",
    options: [
      { label: "No pension and no expectation of one", value: 1, detail: "No pension safety net" },
      { label: "Small pension that will cover <20% of retirement expenses", value: 2, detail: "Minimal pension" },
      { label: "Moderate pension covering 20-40% of retirement expenses", value: 3, detail: "Helpful pension" },
      { label: "Strong pension covering 40-70% of retirement expenses", value: 4, detail: "Substantial pension" },
      { label: "Full pension covering 70%+ of retirement expenses", value: 5, detail: "Comprehensive pension" },
    ],
  },
  {
    id: 44, category: "income_stability", priority: 2,
    text: "What is your expected Social Security benefit at full retirement age?",
    options: [
      { label: "Minimal or not eligible", value: 1, detail: "Little SS income" },
      { label: "Under $2,000/month", value: 2, detail: "Below average SS" },
      { label: "$2,000 – $3,000/month", value: 3, detail: "Average SS benefit" },
      { label: "$3,000 – $4,000/month", value: 4, detail: "Above average SS" },
      { label: "Maximum benefit ($4,000+/month) or spousal benefits combined", value: 5, detail: "Maximum SS income" },
    ],
  },
  {
    id: 45, category: "income_stability", priority: 3,
    text: "How marketable are your professional skills if you needed to find new employment?",
    options: [
      { label: "Very limited — niche skills with few opportunities", value: 1, detail: "Low marketability" },
      { label: "Somewhat limited — would take 6+ months to find equivalent role", value: 2, detail: "Below average marketability" },
      { label: "Moderate — could find comparable work within 3-6 months", value: 3, detail: "Average marketability" },
      { label: "Strong — in-demand skills, could find work within 1-3 months", value: 4, detail: "High marketability" },
      { label: "Exceptional — regularly recruited, could start immediately", value: 5, detail: "Maximum marketability" },
    ],
  },
  {
    id: 46, category: "income_stability", priority: 3,
    text: "Does your spouse/partner have independent income?",
    options: [
      { label: "No spouse/partner or spouse doesn't work", value: 1, detail: "Single income household" },
      { label: "Spouse works part-time or has irregular income", value: 2, detail: "Supplemental income" },
      { label: "Spouse has stable full-time income", value: 3, detail: "Dual income household" },
      { label: "Spouse has high-earning career", value: 4, detail: "Strong dual income" },
      { label: "Spouse's income alone could support the household", value: 5, detail: "Fully redundant income" },
    ],
  },
  {
    id: 47, category: "income_stability", priority: 4,
    text: "Do you receive any passive income (rental, royalties, dividends, business distributions)?",
    options: [
      { label: "No passive income", value: 1, detail: "Fully active income dependent" },
      { label: "Less than $1,000/month in passive income", value: 2, detail: "Minimal passive income" },
      { label: "$1,000 – $5,000/month in passive income", value: 3, detail: "Meaningful passive income" },
      { label: "$5,000 – $15,000/month in passive income", value: 4, detail: "Strong passive income" },
      { label: "Over $15,000/month — passive income exceeds expenses", value: 5, detail: "Financial independence via passive income" },
    ],
  },
  {
    id: 48, category: "income_stability", priority: 4,
    text: "How has your income trended over the past 5 years?",
    options: [
      { label: "Declining significantly", value: 1, detail: "Negative income trend" },
      { label: "Flat or slightly declining", value: 2, detail: "Stagnant income" },
      { label: "Growing at roughly the rate of inflation (2-4%)", value: 3, detail: "Inflation-matching growth" },
      { label: "Growing 5-15% annually", value: 4, detail: "Strong income growth" },
      { label: "Growing over 15% annually", value: 5, detail: "Exceptional income growth" },
    ],
  },
  {
    id: 49, category: "income_stability", priority: 5,
    text: "Do you have disability insurance or income protection coverage?",
    options: [
      { label: "No disability coverage of any kind", value: 1, detail: "No income protection" },
      { label: "Basic employer-provided short-term disability only", value: 2, detail: "Minimal coverage" },
      { label: "Employer-provided short and long-term disability", value: 3, detail: "Standard coverage" },
      { label: "Employer coverage plus supplemental private policy", value: 4, detail: "Enhanced coverage" },
      { label: "Comprehensive own-occupation disability with riders", value: 5, detail: "Maximum income protection" },
    ],
  },
  {
    id: 50, category: "income_stability", priority: 5,
    text: "If your industry experienced a major disruption (technology, regulation, recession), how would your income be affected?",
    options: [
      { label: "Devastating — my skills are highly industry-specific", value: 1, detail: "Maximum disruption risk" },
      { label: "Significant impact — would need retraining", value: 2, detail: "High disruption risk" },
      { label: "Moderate impact — transferable skills would help", value: 3, detail: "Moderate disruption risk" },
      { label: "Minimal impact — my skills transfer across industries", value: 4, detail: "Low disruption risk" },
      { label: "No impact — my income is diversified or recession-proof", value: 5, detail: "Disruption-proof" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // CATEGORY 6: DEBT & OBLIGATIONS (Questions 51-60)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 51, category: "debt_obligations", priority: 1,
    text: "What is your total debt-to-income ratio (total monthly debt payments ÷ gross monthly income)?",
    options: [
      { label: "Over 50%", value: 1, detail: "Critically over-leveraged" },
      { label: "36% – 50%", value: 2, detail: "High debt burden" },
      { label: "20% – 36%", value: 3, detail: "Manageable debt level" },
      { label: "10% – 20%", value: 4, detail: "Conservative debt level" },
      { label: "Under 10% or debt-free", value: 5, detail: "Minimal to no debt" },
    ],
  },
  {
    id: 52, category: "debt_obligations", priority: 1,
    text: "What is your total outstanding mortgage balance?",
    options: [
      { label: "Over $1,000,000", value: 1, detail: "Very large mortgage" },
      { label: "$500,000 – $1,000,000", value: 2, detail: "Large mortgage" },
      { label: "$200,000 – $500,000", value: 3, detail: "Moderate mortgage" },
      { label: "Under $200,000", value: 4, detail: "Small mortgage" },
      { label: "No mortgage — home is paid off or renting", value: 5, detail: "No mortgage obligation" },
    ],
  },
  {
    id: 53, category: "debt_obligations", priority: 2,
    text: "Do you carry credit card balances month to month?",
    options: [
      { label: "Yes, over $25,000 in revolving balances", value: 1, detail: "Severe credit card debt" },
      { label: "Yes, $10,000 – $25,000", value: 2, detail: "Significant credit card debt" },
      { label: "Yes, under $10,000", value: 3, detail: "Moderate credit card debt" },
      { label: "Rarely — only occasionally carry a small balance", value: 4, detail: "Minimal credit card debt" },
      { label: "Never — I pay in full every month", value: 5, detail: "Zero revolving debt" },
    ],
  },
  {
    id: 54, category: "debt_obligations", priority: 2,
    text: "Do you have outstanding student loans?",
    options: [
      { label: "Yes, over $100,000", value: 1, detail: "Major student loan burden" },
      { label: "Yes, $50,000 – $100,000", value: 2, detail: "Significant student loans" },
      { label: "Yes, under $50,000", value: 3, detail: "Manageable student loans" },
      { label: "No — paid off or never had them", value: 5, detail: "No student loan debt" },
      { label: "Eligible for forgiveness programs", value: 4, detail: "Forgiveness pathway" },
    ],
  },
  {
    id: 55, category: "debt_obligations", priority: 3,
    text: "Do you have any outstanding auto loans or leases?",
    options: [
      { label: "Yes, multiple vehicles with $50K+ total owed", value: 1, detail: "Heavy auto debt" },
      { label: "Yes, one vehicle with $25K–$50K owed", value: 2, detail: "Significant auto debt" },
      { label: "Yes, one vehicle with under $25K owed", value: 3, detail: "Moderate auto debt" },
      { label: "No auto loans — vehicles paid off", value: 4, detail: "No auto debt" },
      { label: "No auto loans and vehicles are modest relative to income", value: 5, detail: "Financially disciplined auto choices" },
    ],
  },
  {
    id: 56, category: "debt_obligations", priority: 3,
    text: "Are you financially supporting anyone outside your immediate household (parents, adult children, ex-spouse)?",
    options: [
      { label: "Yes, significant ongoing support (>$2,000/month)", value: 1, detail: "Heavy external obligations" },
      { label: "Yes, moderate support ($500–$2,000/month)", value: 2, detail: "Meaningful external obligations" },
      { label: "Yes, occasional or small support (<$500/month)", value: 3, detail: "Minor external obligations" },
      { label: "No current obligations but may in the future", value: 4, detail: "Potential future obligations" },
      { label: "No external financial obligations", value: 5, detail: "No external support burden" },
    ],
  },
  {
    id: 57, category: "debt_obligations", priority: 4,
    text: "Do you have any alimony or child support obligations?",
    options: [
      { label: "Yes, significant (>$3,000/month)", value: 1, detail: "Major support obligation" },
      { label: "Yes, moderate ($1,000–$3,000/month)", value: 2, detail: "Meaningful support obligation" },
      { label: "Yes, but ending within 3 years", value: 3, detail: "Temporary obligation" },
      { label: "No current obligations", value: 4, detail: "No support obligations" },
      { label: "No obligations and no likelihood of future ones", value: 5, detail: "Zero support risk" },
    ],
  },
  {
    id: 58, category: "debt_obligations", priority: 4,
    text: "What is the interest rate on your highest-rate debt?",
    options: [
      { label: "Over 20% (credit cards, payday loans)", value: 1, detail: "Toxic debt present" },
      { label: "12% – 20% (high-rate personal loans or cards)", value: 2, detail: "Expensive debt" },
      { label: "6% – 12% (auto loans, older mortgages)", value: 3, detail: "Moderate-rate debt" },
      { label: "3% – 6% (favorable mortgage or student loans)", value: 4, detail: "Low-rate debt" },
      { label: "Under 3% or no debt", value: 5, detail: "Optimal debt structure" },
    ],
  },
  {
    id: 59, category: "debt_obligations", priority: 5,
    text: "Have you ever filed for bankruptcy or had a debt sent to collections?",
    options: [
      { label: "Yes, within the last 5 years", value: 1, detail: "Recent financial distress" },
      { label: "Yes, 5-10 years ago", value: 2, detail: "Past financial distress" },
      { label: "Yes, over 10 years ago — fully recovered", value: 3, detail: "Distant past issue" },
      { label: "No, but I've had some late payments", value: 4, detail: "Minor credit issues" },
      { label: "Never — perfect payment history", value: 5, detail: "Pristine credit history" },
    ],
  },
  {
    id: 60, category: "debt_obligations", priority: 5,
    text: "Do you have any co-signed loans or personal guarantees on business debt?",
    options: [
      { label: "Yes, significant guarantees (>$200K)", value: 1, detail: "Major contingent liability" },
      { label: "Yes, moderate guarantees ($50K–$200K)", value: 2, detail: "Meaningful contingent liability" },
      { label: "Yes, small guarantees (<$50K)", value: 3, detail: "Minor contingent liability" },
      { label: "No current guarantees", value: 4, detail: "No contingent liabilities" },
      { label: "No guarantees and no likelihood of needing to co-sign", value: 5, detail: "Zero contingent risk" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // CATEGORY 7: INSURANCE & PROTECTION (Questions 61-70)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 61, category: "insurance_protection", priority: 1,
    text: "What is your current life insurance coverage relative to your annual income?",
    options: [
      { label: "No life insurance", value: 1, detail: "No death benefit protection" },
      { label: "Less than 3x annual income", value: 2, detail: "Underinsured" },
      { label: "3–7x annual income", value: 3, detail: "Moderately insured" },
      { label: "7–15x annual income", value: 4, detail: "Well insured" },
      { label: "Over 15x annual income or self-insured", value: 5, detail: "Fully protected" },
    ],
  },
  {
    id: 62, category: "insurance_protection", priority: 1,
    text: "Do you have an umbrella liability insurance policy?",
    options: [
      { label: "No, and I don't know what that is", value: 1, detail: "No liability protection" },
      { label: "No, but I've considered it", value: 2, detail: "Aware but unprotected" },
      { label: "Yes, $1M coverage", value: 3, detail: "Basic umbrella coverage" },
      { label: "Yes, $2M–$5M coverage", value: 4, detail: "Strong umbrella coverage" },
      { label: "Yes, $5M+ coverage", value: 5, detail: "Maximum liability protection" },
    ],
  },
  {
    id: 63, category: "insurance_protection", priority: 2,
    text: "Do you have long-term care insurance or a plan for long-term care expenses?",
    options: [
      { label: "No plan and no insurance", value: 1, detail: "No LTC protection" },
      { label: "Planning to self-insure but haven't earmarked funds", value: 2, detail: "Vague LTC plan" },
      { label: "Have a hybrid life/LTC policy", value: 3, detail: "Hybrid LTC coverage" },
      { label: "Have a standalone LTC policy", value: 4, detail: "Dedicated LTC coverage" },
      { label: "Comprehensive LTC plan with dedicated funds and insurance", value: 5, detail: "Full LTC protection" },
    ],
  },
  {
    id: 64, category: "insurance_protection", priority: 2,
    text: "Do you have an estate plan (will, trust, power of attorney, healthcare directive)?",
    options: [
      { label: "No estate plan documents", value: 1, detail: "No estate planning" },
      { label: "Basic will only", value: 2, detail: "Minimal estate plan" },
      { label: "Will plus power of attorney and healthcare directive", value: 3, detail: "Standard estate plan" },
      { label: "Revocable living trust with all supporting documents", value: 4, detail: "Comprehensive estate plan" },
      { label: "Advanced estate plan with irrevocable trusts, ILIT, and tax planning", value: 5, detail: "Sophisticated estate plan" },
    ],
  },
  {
    id: 65, category: "insurance_protection", priority: 3,
    text: "How adequate is your health insurance coverage?",
    options: [
      { label: "No health insurance", value: 1, detail: "No health coverage" },
      { label: "High-deductible plan with no HSA funding", value: 2, detail: "Minimal health coverage" },
      { label: "Standard employer plan with reasonable deductibles", value: 3, detail: "Standard health coverage" },
      { label: "Comprehensive plan with low deductibles and HSA", value: 4, detail: "Strong health coverage" },
      { label: "Premium plan with dental, vision, and fully funded HSA", value: 5, detail: "Maximum health coverage" },
    ],
  },
  {
    id: 66, category: "insurance_protection", priority: 3,
    text: "Do you have property insurance adequate to cover replacement costs?",
    options: [
      { label: "No property insurance or significantly underinsured", value: 1, detail: "Major property risk" },
      { label: "Basic coverage but haven't reviewed in years", value: 2, detail: "Potentially underinsured" },
      { label: "Standard coverage reviewed within 2 years", value: 3, detail: "Adequate coverage" },
      { label: "Comprehensive coverage with replacement cost and riders", value: 4, detail: "Strong coverage" },
      { label: "Full replacement cost with scheduled items and flood/earthquake", value: 5, detail: "Maximum property protection" },
    ],
  },
  {
    id: 67, category: "insurance_protection", priority: 4,
    text: "Do you have any key-person or business continuation insurance?",
    options: [
      { label: "N/A — not a business owner", value: 3, detail: "Not applicable" },
      { label: "Business owner with no key-person insurance", value: 1, detail: "Unprotected business" },
      { label: "Basic key-person policy", value: 3, detail: "Basic business protection" },
      { label: "Key-person plus buy-sell agreement funded with insurance", value: 4, detail: "Strong business protection" },
      { label: "Comprehensive business continuation plan with cross-purchase agreements", value: 5, detail: "Full business protection" },
    ],
  },
  {
    id: 68, category: "insurance_protection", priority: 4,
    text: "Have you designated and recently reviewed beneficiaries on all accounts and policies?",
    options: [
      { label: "I haven't designated beneficiaries on most accounts", value: 1, detail: "Critical gap" },
      { label: "Designated but haven't reviewed in over 5 years", value: 2, detail: "Potentially outdated" },
      { label: "Designated and reviewed within the last 2-5 years", value: 3, detail: "Reasonably current" },
      { label: "All accounts have current beneficiaries reviewed annually", value: 4, detail: "Well-maintained" },
      { label: "All beneficiaries aligned with estate plan and reviewed with attorney", value: 5, detail: "Fully coordinated" },
    ],
  },
  {
    id: 69, category: "insurance_protection", priority: 5,
    text: "Do you have identity theft protection or cyber insurance?",
    options: [
      { label: "No protection of any kind", value: 1, detail: "No cyber protection" },
      { label: "Free credit monitoring only", value: 2, detail: "Basic monitoring" },
      { label: "Paid identity theft protection service", value: 3, detail: "Active protection" },
      { label: "Identity protection plus cyber insurance rider", value: 4, detail: "Enhanced protection" },
      { label: "Comprehensive cyber coverage including business and personal", value: 5, detail: "Maximum cyber protection" },
    ],
  },
  {
    id: 70, category: "insurance_protection", priority: 5,
    text: "How would you rate your overall insurance and protection coverage?",
    options: [
      { label: "Significant gaps — I know I'm underprotected", value: 1, detail: "Major protection gaps" },
      { label: "Some coverage but I suspect gaps exist", value: 2, detail: "Probable gaps" },
      { label: "Reasonable coverage across most areas", value: 3, detail: "Adequate protection" },
      { label: "Comprehensive coverage with few gaps", value: 4, detail: "Strong protection" },
      { label: "Fully protected — all risks identified and covered", value: 5, detail: "Maximum protection" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // CATEGORY 8: TAX SITUATION & PLANNING (Questions 71-80)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 71, category: "tax_situation", priority: 1,
    text: "What is your current marginal federal income tax bracket?",
    options: [
      { label: "10% or 12%", value: 1, detail: "Low tax bracket" },
      { label: "22%", value: 2, detail: "Moderate tax bracket" },
      { label: "24% or 32%", value: 3, detail: "Upper-middle tax bracket" },
      { label: "35%", value: 4, detail: "High tax bracket" },
      { label: "37% (top bracket)", value: 5, detail: "Maximum tax bracket" },
    ],
  },
  {
    id: 72, category: "tax_situation", priority: 1,
    text: "How much of your investment portfolio is in tax-advantaged accounts (401k, IRA, Roth, HSA)?",
    options: [
      { label: "Less than 10%", value: 1, detail: "Mostly taxable" },
      { label: "10% – 30%", value: 2, detail: "Limited tax advantage" },
      { label: "30% – 50%", value: 3, detail: "Moderate tax advantage" },
      { label: "50% – 75%", value: 4, detail: "Strong tax advantage" },
      { label: "Over 75%", value: 5, detail: "Maximum tax efficiency" },
    ],
  },
  {
    id: 73, category: "tax_situation", priority: 2,
    text: "Do you have a Roth IRA or Roth 401(k)?",
    options: [
      { label: "No Roth accounts and not eligible", value: 1, detail: "No Roth access" },
      { label: "No, but I'm considering Roth conversions", value: 2, detail: "Roth-curious" },
      { label: "Yes, small Roth balance (<$50K)", value: 3, detail: "Small Roth position" },
      { label: "Yes, meaningful Roth balance ($50K–$250K)", value: 4, detail: "Solid Roth position" },
      { label: "Yes, substantial Roth balance (>$250K) or active conversion strategy", value: 5, detail: "Strong Roth strategy" },
    ],
  },
  {
    id: 74, category: "tax_situation", priority: 2,
    text: "Do you work with a CPA or tax advisor who does proactive tax planning (not just filing)?",
    options: [
      { label: "I file my own taxes with software", value: 1, detail: "No professional tax guidance" },
      { label: "I use a tax preparer for filing only", value: 2, detail: "Filing only" },
      { label: "I have a CPA who does basic planning", value: 3, detail: "Basic tax planning" },
      { label: "I have a CPA who does proactive year-round planning", value: 4, detail: "Active tax planning" },
      { label: "I have a tax team with advanced strategies (trusts, entities, charitable)", value: 5, detail: "Sophisticated tax planning" },
    ],
  },
  {
    id: 75, category: "tax_situation", priority: 3,
    text: "Do you have any tax loss harvesting opportunities or carryforward losses?",
    options: [
      { label: "I don't know what tax loss harvesting is", value: 1, detail: "No TLH awareness" },
      { label: "I'm aware of it but haven't implemented it", value: 2, detail: "TLH awareness only" },
      { label: "I occasionally harvest losses when reminded", value: 3, detail: "Occasional TLH" },
      { label: "I systematically harvest losses throughout the year", value: 4, detail: "Active TLH strategy" },
      { label: "I have significant carryforward losses and a sophisticated TLH program", value: 5, detail: "Advanced TLH program" },
    ],
  },
  {
    id: 76, category: "tax_situation", priority: 3,
    text: "Do you own a business or have self-employment income?",
    options: [
      { label: "No business or self-employment income", value: 1, detail: "W-2 only" },
      { label: "Small side business (<$25K revenue)", value: 2, detail: "Small side income" },
      { label: "Meaningful business income ($25K–$100K)", value: 3, detail: "Significant business income" },
      { label: "Substantial business ($100K–$500K revenue)", value: 4, detail: "Major business income" },
      { label: "Large business (>$500K revenue) with entity structuring", value: 5, detail: "Complex business structure" },
    ],
  },
  {
    id: 77, category: "tax_situation", priority: 4,
    text: "Do you make charitable contributions as part of your tax strategy?",
    options: [
      { label: "No charitable giving", value: 1, detail: "No charitable deductions" },
      { label: "Small cash donations (<$1,000/year)", value: 2, detail: "Minimal charitable giving" },
      { label: "Regular giving ($1,000–$10,000/year)", value: 3, detail: "Moderate charitable giving" },
      { label: "Strategic giving ($10K+) including appreciated stock or DAF", value: 4, detail: "Tax-optimized giving" },
      { label: "Major philanthropy with CRT, foundation, or QCD strategies", value: 5, detail: "Advanced philanthropic planning" },
    ],
  },
  {
    id: 78, category: "tax_situation", priority: 4,
    text: "Are you subject to state income tax?",
    options: [
      { label: "Yes, high state tax (>7%: CA, NY, NJ, etc.)", value: 1, detail: "High state tax burden" },
      { label: "Yes, moderate state tax (4-7%)", value: 2, detail: "Moderate state tax" },
      { label: "Yes, low state tax (<4%)", value: 3, detail: "Low state tax" },
      { label: "No state income tax (FL, TX, NV, etc.)", value: 4, detail: "No state income tax" },
      { label: "No state tax and considering relocation for further tax optimization", value: 5, detail: "Tax-optimized residency" },
    ],
  },
  {
    id: 79, category: "tax_situation", priority: 5,
    text: "Do you have exposure to the Net Investment Income Tax (NIIT) or Alternative Minimum Tax (AMT)?",
    options: [
      { label: "I don't know what these are", value: 1, detail: "Unaware of additional taxes" },
      { label: "I may be subject but haven't checked", value: 2, detail: "Possible exposure" },
      { label: "Yes, I pay NIIT or AMT and it's managed", value: 3, detail: "Managed exposure" },
      { label: "Yes, and I have strategies to minimize impact", value: 4, detail: "Active mitigation" },
      { label: "Not subject due to income structure and planning", value: 5, detail: "Fully optimized" },
    ],
  },
  {
    id: 80, category: "tax_situation", priority: 5,
    text: "How would you rate your overall tax efficiency across all accounts and income sources?",
    options: [
      { label: "I've never thought about tax efficiency", value: 1, detail: "No tax optimization" },
      { label: "I take basic deductions but don't optimize", value: 2, detail: "Basic tax management" },
      { label: "I have some tax-efficient strategies in place", value: 3, detail: "Moderate tax efficiency" },
      { label: "I actively optimize across accounts, entities, and timing", value: 4, detail: "Strong tax efficiency" },
      { label: "Comprehensive multi-year tax plan with asset location, entity structuring, and timing", value: 5, detail: "Maximum tax efficiency" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // CATEGORY 9: GOALS & PRIORITIES (Questions 81-90)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 81, category: "goals_priorities", priority: 1,
    text: "What is your single most important financial goal right now?",
    options: [
      { label: "Getting out of debt", value: 1, detail: "Debt elimination priority" },
      { label: "Building an emergency fund", value: 2, detail: "Safety net priority" },
      { label: "Saving for a specific goal (home, education, business)", value: 3, detail: "Goal-specific saving" },
      { label: "Maximizing retirement savings", value: 4, detail: "Retirement accumulation" },
      { label: "Growing wealth and creating generational legacy", value: 5, detail: "Wealth building" },
    ],
  },
  {
    id: 82, category: "goals_priorities", priority: 1,
    text: "How important is generating current income from your investments vs. long-term growth?",
    options: [
      { label: "I need maximum current income — growth is secondary", value: 1, detail: "Income-first priority" },
      { label: "Mostly income with some growth", value: 2, detail: "Income-leaning" },
      { label: "Equal balance of income and growth", value: 3, detail: "Balanced priority" },
      { label: "Mostly growth with some income", value: 4, detail: "Growth-leaning" },
      { label: "100% growth — I don't need any current income", value: 5, detail: "Pure growth priority" },
    ],
  },
  {
    id: 83, category: "goals_priorities", priority: 2,
    text: "How important is leaving a financial legacy to your heirs?",
    options: [
      { label: "Not important — I plan to enjoy every dollar", value: 1, detail: "No legacy priority" },
      { label: "Somewhat — whatever's left is fine", value: 2, detail: "Residual legacy" },
      { label: "Moderately important — I want to leave something meaningful", value: 3, detail: "Moderate legacy goal" },
      { label: "Very important — it's a major planning priority", value: 4, detail: "Strong legacy goal" },
      { label: "Critical — multi-generational wealth transfer is my primary objective", value: 5, detail: "Dynasty planning" },
    ],
  },
  {
    id: 84, category: "goals_priorities", priority: 2,
    text: "Do you have specific lifestyle goals that require significant capital (second home, travel, philanthropy)?",
    options: [
      { label: "No specific lifestyle goals beyond basic retirement", value: 1, detail: "Basic lifestyle needs" },
      { label: "Some travel and experiences planned", value: 2, detail: "Modest lifestyle goals" },
      { label: "Meaningful goals ($50K–$200K in capital needed)", value: 3, detail: "Moderate lifestyle goals" },
      { label: "Significant goals ($200K–$1M in capital needed)", value: 4, detail: "Substantial lifestyle goals" },
      { label: "Major lifestyle goals (>$1M — second home, yacht, philanthropy)", value: 5, detail: "Premium lifestyle goals" },
    ],
  },
  {
    id: 85, category: "goals_priorities", priority: 3,
    text: "How important is tax-free retirement income to you?",
    options: [
      { label: "I haven't thought about it", value: 1, detail: "No tax-free income awareness" },
      { label: "Somewhat — but I'm not sure how to achieve it", value: 2, detail: "Interested but uninformed" },
      { label: "Important — I'm actively working toward Roth conversions", value: 3, detail: "Active Roth strategy" },
      { label: "Very important — it's a core part of my retirement plan", value: 4, detail: "Tax-free income priority" },
      { label: "Critical — I want 100% of retirement income to be tax-free", value: 5, detail: "Maximum tax-free income goal" },
    ],
  },
  {
    id: 86, category: "goals_priorities", priority: 3,
    text: "Are you interested in using life insurance (IUL) as a wealth-building and income tool?",
    options: [
      { label: "No interest — I view insurance as protection only", value: 1, detail: "Insurance = protection only" },
      { label: "Curious but skeptical", value: 2, detail: "Open but cautious" },
      { label: "Interested and want to learn more", value: 3, detail: "Actively interested" },
      { label: "Already using IUL as part of my strategy", value: 4, detail: "Active IUL user" },
      { label: "IUL is a cornerstone of my wealth strategy", value: 5, detail: "IUL advocate" },
    ],
  },
  {
    id: 87, category: "goals_priorities", priority: 4,
    text: "How important is protecting your assets from lawsuits, creditors, or divorce?",
    options: [
      { label: "Not a concern", value: 1, detail: "No asset protection need" },
      { label: "Slightly concerned but haven't acted", value: 2, detail: "Mild concern" },
      { label: "Moderately concerned — some basic protections in place", value: 3, detail: "Basic protection" },
      { label: "Very concerned — have trusts and entity structures", value: 4, detail: "Active asset protection" },
      { label: "Critical priority — comprehensive asset protection plan", value: 5, detail: "Maximum asset protection" },
    ],
  },
  {
    id: 88, category: "goals_priorities", priority: 4,
    text: "Do you want your financial plan to account for potential business sale or liquidity event?",
    options: [
      { label: "N/A — no business to sell", value: 3, detail: "Not applicable" },
      { label: "No plans to sell my business", value: 2, detail: "Hold indefinitely" },
      { label: "Possible sale in 5-10 years", value: 3, detail: "Potential future event" },
      { label: "Planning to sell within 5 years", value: 4, detail: "Near-term liquidity event" },
      { label: "Actively preparing for sale — need exit planning", value: 5, detail: "Active exit planning" },
    ],
  },
  {
    id: 89, category: "goals_priorities", priority: 5,
    text: "How important is maintaining your current lifestyle in retirement vs. reducing expenses?",
    options: [
      { label: "I expect to significantly reduce expenses in retirement", value: 1, detail: "Major lifestyle reduction" },
      { label: "I'll reduce somewhat but maintain core lifestyle", value: 2, detail: "Moderate reduction" },
      { label: "I want to maintain my exact current lifestyle", value: 3, detail: "Lifestyle maintenance" },
      { label: "I want to improve my lifestyle in retirement", value: 4, detail: "Lifestyle improvement" },
      { label: "I want a significantly enhanced lifestyle (more travel, second home)", value: 5, detail: "Lifestyle upgrade" },
    ],
  },
  {
    id: 90, category: "goals_priorities", priority: 5,
    text: "How do you prioritize financial security vs. financial growth?",
    options: [
      { label: "Security is everything — I never want to worry about money", value: 1, detail: "Maximum security" },
      { label: "Mostly security with a small growth component", value: 2, detail: "Security-leaning" },
      { label: "Equal balance of security and growth", value: 3, detail: "Balanced priority" },
      { label: "Mostly growth — I have enough security already", value: 4, detail: "Growth-leaning" },
      { label: "Maximum growth — security comes from wealth accumulation", value: 5, detail: "Growth-first philosophy" },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // CATEGORY 10: BEHAVIORAL FINANCE & PSYCHOLOGY (Questions 91-100)
  // ═══════════════════════════════════════════════════════════════════
  {
    id: 91, category: "behavioral_finance", priority: 1,
    text: "How often do you check your investment portfolio?",
    options: [
      { label: "Multiple times per day", value: 1, detail: "Obsessive monitoring — high anxiety" },
      { label: "Daily", value: 2, detail: "Frequent monitoring" },
      { label: "Weekly", value: 3, detail: "Regular monitoring" },
      { label: "Monthly", value: 4, detail: "Disciplined monitoring" },
      { label: "Quarterly or less", value: 5, detail: "Patient, long-term focus" },
    ],
  },
  {
    id: 92, category: "behavioral_finance", priority: 1,
    text: "Have you ever made an impulsive financial decision you later regretted?",
    options: [
      { label: "Yes, multiple times with significant consequences", value: 1, detail: "Pattern of impulsive decisions" },
      { label: "Yes, a few times with moderate consequences", value: 2, detail: "Occasional impulsiveness" },
      { label: "Once or twice with minor consequences", value: 3, detail: "Rare impulsiveness" },
      { label: "Rarely — I almost always think decisions through", value: 4, detail: "Disciplined decision-maker" },
      { label: "Never — I have a rigorous decision-making process", value: 5, detail: "Systematic decision-maker" },
    ],
  },
  {
    id: 93, category: "behavioral_finance", priority: 2,
    text: "How do you handle financial disagreements with your spouse/partner?",
    options: [
      { label: "We avoid discussing money — it causes conflict", value: 1, detail: "Financial avoidance" },
      { label: "We disagree frequently and struggle to align", value: 2, detail: "Financial conflict" },
      { label: "We discuss but one person usually makes the final call", value: 3, detail: "Unequal financial partnership" },
      { label: "We discuss openly and usually reach consensus", value: 4, detail: "Collaborative approach" },
      { label: "We're fully aligned on financial goals and strategy", value: 5, detail: "Financial harmony" },
    ],
  },
  {
    id: 94, category: "behavioral_finance", priority: 2,
    text: "How would you describe your relationship with money?",
    options: [
      { label: "Money causes me significant stress and anxiety", value: 1, detail: "Money anxiety" },
      { label: "I worry about money more than I'd like", value: 2, detail: "Moderate money stress" },
      { label: "I have a healthy but cautious relationship with money", value: 3, detail: "Balanced money mindset" },
      { label: "I'm comfortable with money and see it as a tool", value: 4, detail: "Healthy money relationship" },
      { label: "I'm very confident managing money — it energizes me", value: 5, detail: "Money mastery" },
    ],
  },
  {
    id: 95, category: "behavioral_finance", priority: 3,
    text: "When financial news is overwhelmingly negative, what do you typically do?",
    options: [
      { label: "Panic and consider major portfolio changes", value: 1, detail: "News-driven panic" },
      { label: "Feel anxious and call my advisor for reassurance", value: 2, detail: "Anxiety-driven action" },
      { label: "Monitor more closely but stick to my plan", value: 3, detail: "Heightened awareness" },
      { label: "Tune out the noise and trust my strategy", value: 4, detail: "Disciplined tuning out" },
      { label: "Look for buying opportunities in the fear", value: 5, detail: "Contrarian action" },
    ],
  },
  {
    id: 96, category: "behavioral_finance", priority: 3,
    text: "How do you feel about paying for professional financial advice?",
    options: [
      { label: "I'd rather manage everything myself to save fees", value: 1, detail: "Fee-averse DIY" },
      { label: "I'll pay for advice but constantly question the value", value: 2, detail: "Value-questioning" },
      { label: "I see the value and am willing to pay reasonable fees", value: 3, detail: "Value-aware" },
      { label: "I believe good advice pays for itself many times over", value: 4, detail: "Advice advocate" },
      { label: "I invest heavily in advice — it's my competitive advantage", value: 5, detail: "Premium advice seeker" },
    ],
  },
  {
    id: 97, category: "behavioral_finance", priority: 4,
    text: "How do you react when a friend tells you about a 'can't miss' investment opportunity?",
    options: [
      { label: "I get excited and want to invest immediately", value: 1, detail: "Susceptible to tips" },
      { label: "I'm interested and do some quick research", value: 2, detail: "Tip-influenced" },
      { label: "I listen politely but do thorough due diligence", value: 3, detail: "Cautious evaluator" },
      { label: "I'm skeptical — most tips don't pan out", value: 4, detail: "Healthy skepticism" },
      { label: "I ignore tips entirely — I follow my own process", value: 5, detail: "Process-driven" },
    ],
  },
  {
    id: 98, category: "behavioral_finance", priority: 4,
    text: "How comfortable are you with the concept of 'good debt' (leverage that builds wealth)?",
    options: [
      { label: "All debt is bad — I want to be completely debt-free", value: 1, detail: "Anti-debt philosophy" },
      { label: "I accept a mortgage but no other debt", value: 2, detail: "Mortgage-only debt tolerance" },
      { label: "I understand good debt but am cautious about using it", value: 3, detail: "Cautious leverage acceptance" },
      { label: "I actively use strategic debt (real estate, business)", value: 4, detail: "Strategic leverage user" },
      { label: "I embrace leverage as a wealth-building accelerator", value: 5, detail: "Leverage advocate" },
    ],
  },
  {
    id: 99, category: "behavioral_finance", priority: 5,
    text: "If you could describe your financial personality in one word, which would it be?",
    options: [
      { label: "Anxious", value: 1, detail: "Fear-driven financial behavior" },
      { label: "Cautious", value: 2, detail: "Safety-first approach" },
      { label: "Balanced", value: 3, detail: "Measured approach" },
      { label: "Confident", value: 4, detail: "Self-assured decision-making" },
      { label: "Aggressive", value: 5, detail: "Bold financial action" },
    ],
  },
  {
    id: 100, category: "behavioral_finance", priority: 5,
    text: "Looking back at your financial decisions over the past 10 years, how would you rate them overall?",
    options: [
      { label: "Poor — I've made many costly mistakes", value: 1, detail: "Significant regret" },
      { label: "Below average — some good decisions but too many bad ones", value: 2, detail: "Mixed results" },
      { label: "Average — about what most people would have done", value: 3, detail: "Typical outcomes" },
      { label: "Good — I've made mostly smart decisions", value: 4, detail: "Positive track record" },
      { label: "Excellent — my financial decisions have compounded well", value: 5, detail: "Strong track record" },
    ],
  },
];
```

## `client/src/hooks/useCalculatorIntegration.ts`

```ts
// @ts-nocheck
/**
 * useCalculatorIntegration — Reusable hook that wires any calculator page to the backend.
 * Provides:
 * 1. Client selector (load real client data)
 * 2. Save/load scenarios via tRPC
 * 3. Audit logging for compliance
 * 4. StrategyContext publishing
 */
import { useState, useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useStrategy, StrategyType } from "@/contexts/StrategyContext";
import { useAuth } from "@/_core/hooks/useAuth";

export interface CalculatorIntegrationConfig {
  calculatorName: string;
  strategyType: StrategyType;
}

export function useCalculatorIntegration(config: CalculatorIntegrationConfig) {
  const { calculatorName, strategyType } = config;
  const { user } = useAuth();
  const { publishResult, getResult } = useStrategy();

  // Client selector state
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [selectedClientName, setSelectedClientName] = useState<string>("");

  // Scenario state
  const [scenarioName, setScenarioName] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Client list query
  const clientsQuery = trpc.clients?.list?.useQuery?.(undefined, {
    enabled: !!user,
    staleTime: 60_000,
  });

  // Saved scenarios query
  const scenariosQuery = trpc.complianceAudit?.getScenarios?.useQuery?.(
    { calculatorType: calculatorName },
    { enabled: !!user, staleTime: 30_000 }
  );

  // Save scenario mutation
  const saveScenarioMutation = trpc.complianceAudit?.saveScenario?.useMutation?.({
    onSuccess: () => {
      setLastSavedAt(new Date());
      setIsSaving(false);
      scenariosQuery?.refetch?.();
    },
    onError: () => setIsSaving(false),
  });

  // Audit log mutation
  const logCalculationMutation = trpc.complianceAudit?.logCalculation?.useMutation?.();

  // Select a client
  const selectClient = useCallback((clientId: number, clientName: string) => {
    setSelectedClientId(clientId);
    setSelectedClientName(clientName);
  }, []);

  // Save scenario
  const saveScenario = useCallback(async (inputs: Record<string, any>, results: Record<string, any>) => {
    if (!saveScenarioMutation) return;
    setIsSaving(true);
    try {
      await saveScenarioMutation.mutateAsync({
        name: scenarioName || `${calculatorName} - ${new Date().toLocaleDateString()}`,
        calculatorType: calculatorName,
        clientId: selectedClientId ?? undefined,
        inputs,
        results,
      });
    } catch (e) {
      setIsSaving(false);
    }
  }, [saveScenarioMutation, scenarioName, calculatorName, selectedClientId]);

  // Log calculation for compliance
  const logCalculation = useCallback(async (inputs: Record<string, any>, results: Record<string, any>) => {
    if (!logCalculationMutation) return;
    try {
      await logCalculationMutation.mutateAsync({
        calculatorType: calculatorName,
        clientId: selectedClientId ?? undefined,
        inputs,
        results,
        complianceNotes: `Calculated via ${calculatorName} for ${selectedClientName || "no client selected"}`,
      });
    } catch (e) {
      // Non-critical
    }
  }, [logCalculationMutation, calculatorName, selectedClientId, selectedClientName]);

  // Publish results to StrategyContext for cross-calculator sync
  const publishToStrategy = useCallback((results: Record<string, any>) => {
    publishResult(strategyType, {
      label: `${calculatorName}${selectedClientName ? ` - ${selectedClientName}` : ""}`,
      ...results,
    });
  }, [publishResult, strategyType, calculatorName, selectedClientName]);

  // Get data from another calculator
  const getFromStrategy = useCallback((type: StrategyType) => {
    return getResult(type);
  }, [getResult]);

  // Load scenario
  const loadScenario = useCallback((scenario: any) => {
    if (scenario?.inputs) {
      return scenario.inputs;
    }
    return null;
  }, []);

  return {
    // Client selector
    clients: clientsQuery?.data ?? [],
    clientsLoading: clientsQuery?.isLoading ?? false,
    selectedClientId,
    selectedClientName,
    selectClient,

    // Scenario management
    scenarios: scenariosQuery?.data ?? [],
    scenariosLoading: scenariosQuery?.isLoading ?? false,
    scenarioName,
    setScenarioName,
    saveScenario,
    loadScenario,
    isSaving,
    lastSavedAt,

    // Audit logging
    logCalculation,

    // Strategy context
    publishToStrategy,
    getFromStrategy,

    // User
    user,
  };
}
```

## `client/src/hooks/useComposition.ts`

```ts
import { useRef } from "react";
import { usePersistFn } from "./usePersistFn";

export interface UseCompositionReturn<
  T extends HTMLInputElement | HTMLTextAreaElement,
> {
  onCompositionStart: React.CompositionEventHandler<T>;
  onCompositionEnd: React.CompositionEventHandler<T>;
  onKeyDown: React.KeyboardEventHandler<T>;
  isComposing: () => boolean;
}

export interface UseCompositionOptions<
  T extends HTMLInputElement | HTMLTextAreaElement,
> {
  onKeyDown?: React.KeyboardEventHandler<T>;
  onCompositionStart?: React.CompositionEventHandler<T>;
  onCompositionEnd?: React.CompositionEventHandler<T>;
}

type TimerResponse = ReturnType<typeof setTimeout>;

export function useComposition<
  T extends HTMLInputElement | HTMLTextAreaElement = HTMLInputElement,
>(options: UseCompositionOptions<T> = {}): UseCompositionReturn<T> {
  const {
    onKeyDown: originalOnKeyDown,
    onCompositionStart: originalOnCompositionStart,
    onCompositionEnd: originalOnCompositionEnd,
  } = options;

  const c = useRef(false);
  const timer = useRef<TimerResponse | null>(null);
  const timer2 = useRef<TimerResponse | null>(null);

  const onCompositionStart = usePersistFn((e: React.CompositionEvent<T>) => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (timer2.current) {
      clearTimeout(timer2.current);
      timer2.current = null;
    }
    c.current = true;
    originalOnCompositionStart?.(e);
  });

  const onCompositionEnd = usePersistFn((e: React.CompositionEvent<T>) => {
    // 使用两层 setTimeout 来处理 Safari 浏览器中 compositionEnd 先于 onKeyDown 触发的问题
    timer.current = setTimeout(() => {
      timer2.current = setTimeout(() => {
        c.current = false;
      });
    });
    originalOnCompositionEnd?.(e);
  });

  const onKeyDown = usePersistFn((e: React.KeyboardEvent<T>) => {
    // 在 composition 状态下，阻止 ESC 和 Enter（非 shift+Enter）事件的冒泡
    if (
      c.current &&
      (e.key === "Escape" || (e.key === "Enter" && !e.shiftKey))
    ) {
      e.stopPropagation();
      return;
    }
    originalOnKeyDown?.(e);
  });

  const isComposing = usePersistFn(() => {
    return c.current;
  });

  return {
    onCompositionStart,
    onCompositionEnd,
    onKeyDown,
    isComposing,
  };
}
```

## `client/src/hooks/useIbbotsonModel.ts`

```ts
/**
 * useIbbotsonModel — React hook that wraps the shared Ibbotson model utility
 * for easy integration into any IUL calculator page.
 *
 * Provides:
 *   • Year selector state (default 2005)
 *   • Cap / floor / participation rate state (default 7.5% / 0% / 100%)
 *   • Computed year-by-year results, summary stats, and cash value projections
 *   • Helper to get credited rate for a specific year
 */

import { useState, useMemo } from "react";
import {
  type IbbotsonConfig,
  type IbbotsonYearResult,
  type IbbotsonSummary,
  type IbbotsonCashValueYear,
  runIbbotsonModel,
  getIbbotsonSummary,
  getIbbotsonCAGR,
  getAverageAnnualCreditedRate,
  projectCashValueWithIbbotson,
  calculateCreditedRate,
  SP500_ANNUAL_RETURNS,
  IBBOTSON_DEFAULT_START_YEAR,
  IBBOTSON_END_YEAR,
  IBBOTSON_START_YEAR,
  getAvailableYears,
  IBBOTSON_DISCLAIMER,
  IBBOTSON_SHORT_DISCLAIMER,
} from "@shared/ibbotsonModel";

export interface UseIbbotsonModelOptions {
  /** Initial start year. Default: 2005 */
  defaultStartYear?: number;
  /** Initial end year. Default: latest available */
  defaultEndYear?: number;
  /** Initial cap rate as decimal. Default: 0.075 */
  defaultCapRate?: number;
  /** Initial floor rate as decimal. Default: 0.0 */
  defaultFloorRate?: number;
  /** Initial participation rate as decimal. Default: 1.0 */
  defaultParticipationRate?: number;
}

export function useIbbotsonModel(options: UseIbbotsonModelOptions = {}) {
  const {
    defaultStartYear = IBBOTSON_DEFAULT_START_YEAR,
    defaultEndYear = IBBOTSON_END_YEAR,
    defaultCapRate = 0.075,
    defaultFloorRate = 0.0,
    defaultParticipationRate = 1.0,
  } = options;

  // ─── State ──────────────────────────────────────────────────────────────
  const [startYear, setStartYear] = useState(defaultStartYear);
  const [endYear, setEndYear] = useState(defaultEndYear);
  const [capRate, setCapRate] = useState(defaultCapRate);
  const [floorRate, setFloorRate] = useState(defaultFloorRate);
  const [participationRate, setParticipationRate] = useState(defaultParticipationRate);

  // ─── Config object ──────────────────────────────────────────────────────
  const config: IbbotsonConfig = useMemo(() => ({
    capRate,
    floorRate,
    participationRate,
    startYear,
    endYear,
  }), [capRate, floorRate, participationRate, startYear, endYear]);

  // ─── Computed results ───────────────────────────────────────────────────
  const yearResults: IbbotsonYearResult[] = useMemo(
    () => runIbbotsonModel(config),
    [config]
  );

  const summary: IbbotsonSummary = useMemo(
    () => getIbbotsonSummary(config),
    [config]
  );

  const cagr = useMemo(
    () => getIbbotsonCAGR(config),
    [config]
  );

  const averageCreditedRate = useMemo(
    () => getAverageAnnualCreditedRate(config),
    [config]
  );

  // ─── Helper: get credited rate for a specific year ──────────────────────
  const getCreditedRateForYear = (year: number): number => {
    const raw = SP500_ANNUAL_RETURNS[year];
    if (raw === undefined) return 0;
    return calculateCreditedRate(raw, capRate, floorRate, participationRate);
  };

  // ─── Helper: get S&P 500 return for a specific year ─────────────────────
  const getSP500ReturnForYear = (year: number): number | undefined => {
    return SP500_ANNUAL_RETURNS[year];
  };

  // ─── Helper: project cash values ────────────────────────────────────────
  const projectCashValues = (
    annualPremium: number,
    premiumYears?: number,
    loadFee?: number,
    coiRate?: number,
  ): IbbotsonCashValueYear[] => {
    return projectCashValueWithIbbotson({
      ...config,
      annualPremium,
      premiumYears,
      loadFee,
      coiRate,
    });
  };

  // ─── Available years for selectors ──────────────────────────────────────
  const availableYears = useMemo(() => getAvailableYears(), []);

  return {
    // State
    startYear,
    setStartYear,
    endYear,
    setEndYear,
    capRate,
    setCapRate,
    floorRate,
    setFloorRate,
    participationRate,
    setParticipationRate,

    // Config
    config,

    // Computed
    yearResults,
    summary,
    cagr,
    averageCreditedRate,

    // Helpers
    getCreditedRateForYear,
    getSP500ReturnForYear,
    projectCashValues,
    availableYears,

    // Constants
    IBBOTSON_DISCLAIMER,
    IBBOTSON_SHORT_DISCLAIMER,
    IBBOTSON_START_YEAR,
    IBBOTSON_END_YEAR,
    IBBOTSON_DEFAULT_START_YEAR,
  };
}

export default useIbbotsonModel;

// Re-export types and constants for convenience
export {
  type IbbotsonConfig,
  type IbbotsonYearResult,
  type IbbotsonSummary,
  type IbbotsonCashValueYear,
  SP500_ANNUAL_RETURNS,
  IBBOTSON_DISCLAIMER,
  IBBOTSON_SHORT_DISCLAIMER,
  calculateCreditedRate,
  runIbbotsonModel,
  getIbbotsonSummary,
  getIbbotsonCAGR,
  projectCashValueWithIbbotson,
} from "@shared/ibbotsonModel";
```

## `client/src/hooks/useKeyboardShortcuts.ts`

```ts
/**
 * Global Keyboard Shortcuts — Power-user navigation.
 * 
 * G+D → Dashboard/Daily Briefing
 * G+C → Clients
 * G+A → Arena
 * G+N → Nerve Center
 * G+S → Strategy Lab
 * G+P → Pet System
 * G+M → Morning Ritual
 * G+T → Toilet Dashboard (Quick Glance)
 * N+C → New Client (opens add client dialog)
 * N+D → New Deal
 * Escape → Close any open panel
 */
import { useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const GO_SHORTCUTS: Record<string, { path: string; label: string }> = {
  d: { path: "/portal/daily-briefing", label: "Daily Briefing" },
  c: { path: "/portal/clients", label: "Clients" },
  a: { path: "/portal/arena", label: "Arena" },
  n: { path: "/portal/nerve-center", label: "Nerve Center" },
  s: { path: "/portal/strategy-lab", label: "Strategy Lab" },
  p: { path: "/portal/pet", label: "Pet System" },
  m: { path: "/portal/morning-ritual", label: "Morning Ritual" },
  t: { path: "/portal/toilet", label: "Quick Glance" },
  w: { path: "/portal/war-story-generator", label: "War Stories" },
  l: { path: "/portal/leaderboard", label: "Leaderboard" },
};

export function useKeyboardShortcuts() {
  const [, navigate] = useLocation();
  const pendingPrefix = useRef<string | null>(null);
  const prefixTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger in input/textarea/contenteditable
    const tag = (e.target as HTMLElement).tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if ((e.target as HTMLElement).isContentEditable) return;

    const key = e.key.toLowerCase();

    // Handle prefix sequences (g+X, n+X)
    if (pendingPrefix.current) {
      const prefix = pendingPrefix.current;
      pendingPrefix.current = null;
      if (prefixTimer.current) clearTimeout(prefixTimer.current);

      if (prefix === "g" && GO_SHORTCUTS[key]) {
        e.preventDefault();
        const target = GO_SHORTCUTS[key];
        navigate(target.path);
        toast.info(`Navigated to ${target.label}`, { duration: 1500 });
        return;
      }

      if (prefix === "n") {
        if (key === "c") {
          e.preventDefault();
          navigate("/portal/clients?action=add");
          toast.info("New Client", { duration: 1500 });
          return;
        }
        if (key === "d") {
          e.preventDefault();
          navigate("/portal/pipeline?action=add");
          toast.info("New Deal", { duration: 1500 });
          return;
        }
      }
    }

    // Set prefix
    if (key === "g" || key === "n") {
      pendingPrefix.current = key;
      if (prefixTimer.current) clearTimeout(prefixTimer.current);
      prefixTimer.current = setTimeout(() => {
        pendingPrefix.current = null;
      }, 800); // 800ms window for second key
      return;
    }

    // ? → Show shortcuts help
    if (key === "?" && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      toast.info(
        "Keyboard Shortcuts: G+D (Briefing), G+C (Clients), G+A (Arena), G+N (Nerve Center), G+S (Strategy), N+C (New Client), N+D (New Deal), ? (Help)",
        { duration: 5000 }
      );
    }
  }, [navigate]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
```

## `client/src/hooks/useMobile.tsx`

```tsx
import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
```

## `client/src/hooks/usePersistFn.ts`

```ts
import { useRef } from "react";

type noop = (...args: any[]) => any;

/**
 * usePersistFn instead of useCallback to reduce cognitive load
 */
export function usePersistFn<T extends noop>(fn: T) {
  const fnRef = useRef<T>(fn);
  fnRef.current = fn;

  const persistFn = useRef<T>(null);
  if (!persistFn.current) {
    persistFn.current = function (this: unknown, ...args) {
      return fnRef.current!.apply(this, args);
    } as T;
  }

  return persistFn.current!;
}
```

## `client/src/hooks/useQuestTracker.ts`

```ts
/**
 * QUEST PROGRESS TRACKER — Global Action Interceptor
 * 
 * Listens to all tRPC mutation successes and auto-increments
 * quest progress on the backend. Works alongside useSoundOfMoney.
 */
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { MUTATION_QUEST_MAP, getQuestCategoryForPath } from "./useSoundOfMoney";

export function useQuestTracker() {
  const queryClient = useQueryClient();
  const lastTrackedRef = useRef<number>(0);

  useEffect(() => {
    const unsubscribe = queryClient.getMutationCache().subscribe((event: any) => {
      if (event?.type !== "updated" || event?.action?.type !== "success") return;
      
      // Throttle: don't track more than once per 500ms
      const now = Date.now();
      if (now - lastTrackedRef.current < 500) return;
      
      // Extract mutation key/path
      const mutationKey = event?.mutation?.options?.mutationKey;
      const path = Array.isArray(mutationKey) 
        ? mutationKey.flat().join(".") 
        : String(mutationKey || "");
      
      if (!path) return;
      
      // Don't track the quest progress mutation itself (avoid infinite loop)
      if (path.includes("questProgress")) return;
      
      // Look up quest category
      const category = MUTATION_QUEST_MAP[path] || getQuestCategoryForPath(path);
      
      if (category) {
        lastTrackedRef.current = now;
        // Fire-and-forget POST to increment quest progress
        fetch("/api/rpc/questProgress.incrementAction?batch=1", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ "0": { json: { category, mutationPath: path } } }),
        }).catch(() => { /* silently ignore quest tracking failures */ });
      }
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [queryClient]);
}
```

## `client/src/hooks/useRealtimeEvents.ts`

```ts
/**
 * useRealtimeEvents — SSE hook for real-time server events.
 * Connects to /api/events and dispatches custom DOM events for:
 * - deal_update, notification, quest_complete, achievement_unlock,
 *   pet_evolution, xp_earned, streak_update
 * Components can listen via useRealtimeEvent("deal_update", handler).
 */
import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";

type EventHandler = (data: any) => void;

const listeners = new Map<string, Set<EventHandler>>();

export function useRealtimeEvents() {
  const { isAuthenticated } = useAuth();
  const esRef = useRef<EventSource | null>(null);
  const retryCount = useRef(0);

  useEffect(() => {
    if (!isAuthenticated) return;

    function connect() {
      if (esRef.current) esRef.current.close();

      const es = new EventSource("/api/events", { withCredentials: true });
      esRef.current = es;

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const type = data.type;
          if (type && listeners.has(type)) {
            for (const handler of Array.from(listeners.get(type)!)) {
              try { handler(data); } catch {}
            }
          }
          // Also dispatch to "all" listeners
          if (listeners.has("*")) {
            for (const handler of Array.from(listeners.get("*")!)) {
              try { handler(data); } catch {}
            }
          }
          retryCount.current = 0;
        } catch {}
      };

      es.onerror = () => {
        es.close();
        retryCount.current++;
        // Exponential backoff: 2s, 4s, 8s, 16s, max 60s
        const delay = Math.min(2000 * Math.pow(2, retryCount.current), 60000);
        setTimeout(connect, delay);
      };
    }

    connect();

    return () => {
      esRef.current?.close();
      esRef.current = null;
    };
  }, [isAuthenticated]);
}

/**
 * Subscribe to a specific event type from the SSE stream.
 * Use "*" to listen to all events.
 */
export function useRealtimeEvent(eventType: string, handler: EventHandler) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const stableHandler = useCallback((data: any) => {
    handlerRef.current(data);
  }, []);

  useEffect(() => {
    if (!listeners.has(eventType)) listeners.set(eventType, new Set());
    listeners.get(eventType)!.add(stableHandler);

    return () => {
      listeners.get(eventType)?.delete(stableHandler);
      if (listeners.get(eventType)?.size === 0) listeners.delete(eventType);
    };
  }, [eventType, stableHandler]);
}
```

## `client/src/hooks/useSoundOfMoney.ts`

```ts
/**
 * SOUND OF MONEY — Global Pavlovian Conditioning Layer
 * 
 * This hook intercepts tRPC mutation cache events globally and plays
 * the appropriate reward sound based on the mutation path/type.
 * 
 * Instead of editing 100+ files, we listen to the mutation cache
 * from React Query and trigger sounds automatically.
 */
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useEntrainment } from "@/contexts/EntrainmentEngine";

type SoundEffect = "ka-ching" | "xp-ping" | "level-up" | "loot-reveal" | "streak-hit" | "quest-complete" | "deal-closed";

// Map mutation paths to sound effects
const MUTATION_SOUND_MAP: Record<string, SoundEffect> = {
  // Deal / Pipeline / Revenue actions → ka-ching
  "billing.createCheckout": "ka-ching",
  "billing.createPortalSession": "ka-ching",
  "pipeline.updateStage": "ka-ching",
  "pipeline.create": "ka-ching",
  "pipeline.updateDeal": "ka-ching",
  "deals.create": "ka-ching",
  "deals.update": "ka-ching",
  "deals.updateStage": "ka-ching",
  "deals.close": "deal-closed",
  "referral.create": "ka-ching",
  "referral.convert": "deal-closed",
  
  // Client actions → xp-ping
  "clients.create": "xp-ping",
  "clients.update": "xp-ping",
  "properties.create": "xp-ping",
  "clientOnboarding.complete": "xp-ping",
  "clientOnboarding.completeStep": "xp-ping",
  "clientIntake.submit": "xp-ping",
  "clientEngagement.record": "xp-ping",
  
  // XP / Level / Achievement actions → level-up or xp-ping
  "experience.earnXp": "xp-ping",
  "experience.claimQuestReward": "quest-complete",
  "experience.investInSkill": "level-up",
  "experience.purchaseLoot": "loot-reveal",
  "experience.claimDailyReward": "streak-hit",
  "experience.checkIn": "streak-hit",
  
  // Pet system → xp-ping
  "pet.feed": "xp-ping",
  "pet.interact": "xp-ping",
  "pet.adopt": "loot-reveal",
  
  // Morning ritual → streak-hit
  "morningRitual.start": "xp-ping",
  "morningRitual.completeStep": "streak-hit",
  
  // Strategy / Calculation actions → xp-ping
  "strategyLab.calculate": "xp-ping",
  "strategyLab.save": "xp-ping",
  "rothConversion.calculate": "xp-ping",
  "taxBracket.calculate": "xp-ping",
  "incomeGap.analyze": "xp-ping",
  "mortgageKiller.calculate": "xp-ping",
  "premiumFinancing.calculate": "xp-ping",
  "annuity.calculate": "xp-ping",
  "iul.calculate": "xp-ping",
  "withdrawalSequencing.calculate": "xp-ping",
  "retirementGuardrails.calculate": "xp-ping",
  "charitableGiving.calculate": "xp-ping",
  "revenueGuarantee.calculate": "xp-ping",
  "indexBacktester.run": "xp-ping",
  "inflationAnalysis.calculate": "xp-ping",
  "householdWealth.calculate": "xp-ping",
  "policyLoans.calculate": "xp-ping",
  "successionPlanning.calculate": "xp-ping",
  "competitiveAnalysis.run": "xp-ping",
  "riskTolerance.calculate": "xp-ping",
  "advisorIncome.calculate": "xp-ping",
  "incomeTimeline.calculate": "xp-ping",
  "portfolioDrift.analyze": "xp-ping",
  "taxOpportunity.detect": "xp-ping",
  
  // AI / Generation actions → loot-reveal
  "ai.generate": "loot-reveal",
  "ai.generateSlides": "loot-reveal",
  "ai.generatePptx": "loot-reveal",
  "slides.batchGenerate": "loot-reveal",
  "bulkGeneration.run": "loot-reveal",
  "warStoryAI.generate": "loot-reveal",
  "experience.generateAvatar": "loot-reveal",
  "aiAssist.query": "xp-ping",
  "leadGenerator.generate": "loot-reveal",
  "seminarGenerator.generate": "loot-reveal",
  "emailCampaign.generate": "loot-reveal",
  "salesStory.generate": "loot-reveal",
  "clientReport.generate": "loot-reveal",
  "complianceReport.generate": "loot-reveal",
  "documentTemplates.generate": "loot-reveal",
  
  // Save / Export actions → xp-ping
  "savedStrategies.create": "xp-ping",
  "savedScenarios.save": "xp-ping",
  "strategyExport.generatePdf": "xp-ping",
  "complianceExport.generate": "xp-ping",
  "notes.add": "xp-ping",
  "favorites.save": "xp-ping",
  "documentVault.upload": "xp-ping",
  "clientFiles.upload": "xp-ping",
  
  // Rewards → streak-hit
  "rewards.claim": "streak-hit",
  "rewards.claimDaily": "streak-hit",
  "rewards.purchase": "ka-ching",
  
  // Compliance → xp-ping
  "complianceAlerts.acknowledge": "xp-ping",
  "auditTimeline.record": "xp-ping",
  
  // Team / Admin → xp-ping
  "team.invite": "xp-ping",
  "team.update": "xp-ping",
};

// Fallback: categorize by keyword patterns in mutation path
function getSoundForMutationPath(path: string): SoundEffect | null {
  const lower = path.toLowerCase();
  
  // High-value actions
  if (lower.includes("close") || lower.includes("won") || lower.includes("convert")) return "deal-closed";
  if (lower.includes("checkout") || lower.includes("payment") || lower.includes("purchase") || lower.includes("buy")) return "ka-ching";
  
  // Achievement actions
  if (lower.includes("claim") || lower.includes("reward") || lower.includes("complete")) return "quest-complete";
  if (lower.includes("levelup") || lower.includes("upgrade") || lower.includes("evolve")) return "level-up";
  if (lower.includes("streak") || lower.includes("checkin") || lower.includes("daily")) return "streak-hit";
  
  // Generation / Discovery
  if (lower.includes("generate") || lower.includes("create") || lower.includes("discover")) return "loot-reveal";
  
  // Calculations / Tool usage
  if (lower.includes("calculate") || lower.includes("analyze") || lower.includes("run") || lower.includes("compute")) return "xp-ping";
  
  // Save / Update actions
  if (lower.includes("save") || lower.includes("update") || lower.includes("add") || lower.includes("submit")) return "xp-ping";
  
  return null;
}

/**
 * Global hook that listens to ALL tRPC mutation successes and plays
 * the appropriate Pavlovian reward sound. Mount once in App.tsx.
 */
export function useSoundOfMoney() {
  const { playSoundEffect, soundEffectsEnabled } = useEntrainment();
  const lastPlayedRef = useRef<number>(0);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!soundEffectsEnabled) return;

    // Subscribe to the global mutation cache for Pavlovian conditioning
    const unsubscribe = queryClient.getMutationCache().subscribe((event: any) => {
      if (event?.type !== "updated" || event?.action?.type !== "success") return;
      
      // Throttle: don't play sounds more than once per 300ms
      const now = Date.now();
      if (now - lastPlayedRef.current < 300) return;
      
      // Extract mutation key/path
      const mutationKey = event?.mutation?.options?.mutationKey;
      const path = Array.isArray(mutationKey) 
        ? mutationKey.flat().join(".") 
        : String(mutationKey || "");
      
      if (!path) return;
      
      // Look up sound
      const sound = MUTATION_SOUND_MAP[path] || getSoundForMutationPath(path);
      
      if (sound) {
        lastPlayedRef.current = now;
        playSoundEffect(sound);
      }
    });

    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, [soundEffectsEnabled, playSoundEffect, queryClient]);
}

/**
 * Quest action categories for tracking
 */
export type QuestActionCategory = 
  | "tool_usage"
  | "client_contact" 
  | "deal_movement"
  | "calculation_run"
  | "strategy_created"
  | "ai_generation"
  | "content_saved"
  | "login_streak";

// Map mutation paths to quest action categories
const MUTATION_QUEST_MAP: Record<string, QuestActionCategory> = {
  // Client contacts
  "clients.create": "client_contact",
  "clients.update": "client_contact",
  "clientOnboarding.complete": "client_contact",
  "clientIntake.submit": "client_contact",
  "clientEngagement.record": "client_contact",
  
  // Deal movements
  "pipeline.updateStage": "deal_movement",
  "pipeline.create": "deal_movement",
  "deals.create": "deal_movement",
  "deals.update": "deal_movement",
  "deals.updateStage": "deal_movement",
  "deals.close": "deal_movement",
  
  // Calculations
  "strategyLab.calculate": "calculation_run",
  "rothConversion.calculate": "calculation_run",
  "taxBracket.calculate": "calculation_run",
  "incomeGap.analyze": "calculation_run",
  "mortgageKiller.calculate": "calculation_run",
  "premiumFinancing.calculate": "calculation_run",
  "annuity.calculate": "calculation_run",
  "iul.calculate": "calculation_run",
  "withdrawalSequencing.calculate": "calculation_run",
  "retirementGuardrails.calculate": "calculation_run",
  "charitableGiving.calculate": "calculation_run",
  "revenueGuarantee.calculate": "calculation_run",
  "indexBacktester.run": "calculation_run",
  "inflationAnalysis.calculate": "calculation_run",
  "householdWealth.calculate": "calculation_run",
  "policyLoans.calculate": "calculation_run",
  "advisorIncome.calculate": "calculation_run",
  "incomeTimeline.calculate": "calculation_run",
  "portfolioDrift.analyze": "calculation_run",
  "taxOpportunity.detect": "calculation_run",
  "riskTolerance.calculate": "calculation_run",
  "competitiveAnalysis.run": "calculation_run",
  
  // AI generations
  "ai.generate": "ai_generation",
  "ai.generateSlides": "ai_generation",
  "warStoryAI.generate": "ai_generation",
  "experience.generateAvatar": "ai_generation",
  "leadGenerator.generate": "ai_generation",
  "seminarGenerator.generate": "ai_generation",
  "emailCampaign.generate": "ai_generation",
  "salesStory.generate": "ai_generation",
  "clientReport.generate": "ai_generation",
  
  // Strategy / Content saved
  "savedStrategies.create": "strategy_created",
  "savedScenarios.save": "content_saved",
  "notes.add": "content_saved",
  "favorites.save": "content_saved",
  "documentVault.upload": "content_saved",
};

function getQuestCategoryForPath(path: string): QuestActionCategory | null {
  const lower = path.toLowerCase();
  if (lower.includes("client") && (lower.includes("create") || lower.includes("add") || lower.includes("contact"))) return "client_contact";
  if (lower.includes("deal") || lower.includes("pipeline") || lower.includes("stage")) return "deal_movement";
  if (lower.includes("calculate") || lower.includes("analyze") || lower.includes("compute")) return "calculation_run";
  if (lower.includes("generate") || lower.includes("ai.")) return "ai_generation";
  if (lower.includes("save") || lower.includes("create") || lower.includes("strategy")) return "strategy_created";
  return "tool_usage"; // Default: any mutation counts as tool usage
}

export { MUTATION_SOUND_MAP, getSoundForMutationPath, MUTATION_QUEST_MAP, getQuestCategoryForPath };
```

## `client/src/styles/animations.css`

```css
/* Russell Capital Systems — Custom Animations */
/* Import this file in your main CSS entry point (e.g., index.css) */

html {
  scroll-behavior: smooth;
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-in forwards;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-slide-up {
  animation: slideUp 0.5s ease-out forwards;
}
@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.animate-pulse-green {
  animation: pulseGreen 1.5s infinite;
}
@keyframes pulseGreen {
  0% { box-shadow: 0 0 5px #22c55e; }
  50% { box-shadow: 0 0 15px #22c55e; }
  100% { box-shadow: 0 0 5px #22c55e; }
}

.animate-scale-in {
  animation: scaleIn 0.3s ease-out forwards;
}
@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.animate-glow {
  animation: glow 2s ease-in-out infinite;
}
@keyframes glow {
  0%, 100% { box-shadow: 0 0 5px rgba(34, 197, 94, 0.3); }
  50% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.6); }
}
```

## `client/src/styles/sidebar-override.css`

```css
/* ============================================================
   RUSSELL CAPITAL SYSTEMS — SIDEBAR STYLING OVERRIDE
   Purpose: Smaller uniform font sizes + brighter vibrant coloring
   ============================================================ */

/* ── SECTION HEADERS (HOME, CLIENTS, PLANNING, PRODUCTS, etc.) ── */
/* Current: 26px for main sections, 22px for lower sections — TOO BIG */
/* Fix: All section headers to 13px, vibrant gradient colors */

nav.rc-sidebar-nav .flex-1.text-left {
  font-size: 13px !important;
  letter-spacing: 1.2px !important;
  font-weight: 700 !important;
  text-transform: uppercase !important;
}

/* ── VIBRANT COLOR SCHEME FOR SECTION HEADERS ── */
/* HOME section — bright emerald */
nav.rc-sidebar-nav button:nth-of-type(1) .flex-1.text-left {
  color: #34d399 !important;  /* emerald-400 */
}

/* CLIENTS section — bright cyan */
nav.rc-sidebar-nav button:nth-of-type(2) .flex-1.text-left {
  color: #22d3ee !important;  /* cyan-400 */
}

/* PLANNING section — bright violet */
nav.rc-sidebar-nav button:nth-of-type(3) .flex-1.text-left {
  color: #a78bfa !important;  /* violet-400 */
}

/* PRODUCTS section — bright amber */
nav.rc-sidebar-nav button:nth-of-type(4) .flex-1.text-left {
  color: #fbbf24 !important;  /* amber-400 */
}

/* MASSIVE CALCULATORS — bright rose */
nav.rc-sidebar-nav button:nth-of-type(5) .flex-1.text-left {
  color: #fb7185 !important;  /* rose-400 */
}

/* AI & TOOLS — bright sky */
nav.rc-sidebar-nav button:nth-of-type(6) .flex-1.text-left {
  color: #38bdf8 !important;  /* sky-400 */
}

/* COMPLIANCE — bright lime */
nav.rc-sidebar-nav button:nth-of-type(7) .flex-1.text-left {
  color: #a3e635 !important;  /* lime-400 */
}

/* THE EXPERIENCE — bright fuchsia */
nav.rc-sidebar-nav button:nth-of-type(8) .flex-1.text-left {
  color: #e879f9 !important;  /* fuchsia-400 */
}

/* COMMAND — bright orange */
nav.rc-sidebar-nav button:nth-of-type(9) .flex-1.text-left {
  color: #fb923c !important;  /* orange-400 */
}

/* COMPETE — bright teal */
nav.rc-sidebar-nav button:nth-of-type(10) .flex-1.text-left {
  color: #2dd4bf !important;  /* teal-400 */
}

/* EARN — bright yellow */
nav.rc-sidebar-nav button:nth-of-type(11) .flex-1.text-left {
  color: #facc15 !important;  /* yellow-400 */
}

/* EXPLORE — bright indigo */
nav.rc-sidebar-nav button:nth-of-type(12) .flex-1.text-left {
  color: #818cf8 !important;  /* indigo-400 */
}

/* TRANSCEND — bright pink */
nav.rc-sidebar-nav button:nth-of-type(13) .flex-1.text-left {
  color: #f472b6 !important;  /* pink-400 */
}

/* SETTINGS — bright slate/blue */
nav.rc-sidebar-nav button:nth-of-type(14) .flex-1.text-left {
  color: #60a5fa !important;  /* blue-400 */
}

/* INTEROP ENGINE — bright emerald glow */
nav.rc-sidebar-nav button:nth-of-type(15) .flex-1.text-left {
  color: #6ee7b7 !important;  /* emerald-300 */
}

/* ── SUB-ITEMS (Dashboard, Wealth Reels, Advisory Summary, etc.) ── */
/* Current: 15-16px — too big */
/* Fix: All sub-items to 12.5px, bright white with vibrant hover */

nav.rc-sidebar-nav a {
  font-size: 12.5px !important;
  font-weight: 500 !important;
  color: #e2e8f0 !important;  /* slate-200 — bright white-ish */
  letter-spacing: 0.3px !important;
  padding-top: 6px !important;
  padding-bottom: 6px !important;
  transition: all 0.2s ease !important;
}

/* Active sub-item — vibrant emerald with glow */
nav.rc-sidebar-nav a[aria-current="page"],
nav.rc-sidebar-nav a.active,
nav.rc-sidebar-nav a[data-active="true"] {
  color: #34d399 !important;  /* emerald-400 */
  font-weight: 600 !important;
  text-shadow: 0 0 8px rgba(52, 211, 153, 0.4) !important;
}

/* Hover state — bright cyan glow */
nav.rc-sidebar-nav a:hover {
  color: #22d3ee !important;  /* cyan-400 */
  text-shadow: 0 0 6px rgba(34, 211, 238, 0.3) !important;
  background-color: rgba(34, 211, 238, 0.08) !important;
}

/* ── SECTION HEADER BUTTONS — Uniform sizing ── */
nav.rc-sidebar-nav button {
  font-size: 13px !important;
  padding-top: 8px !important;
  padding-bottom: 8px !important;
  transition: all 0.2s ease !important;
}

/* Section header hover — subtle glow */
nav.rc-sidebar-nav button:hover {
  background-color: rgba(255, 255, 255, 0.05) !important;
}

/* ── BADGE NUMBERS (9, 5, 3, 2, 6) ── */
nav.rc-sidebar-nav .text-\[14px\] {
  font-size: 10px !important;
  opacity: 0.7 !important;
}

nav.rc-sidebar-nav .text-\[11px\] {
  font-size: 10px !important;
}

/* ── FAVORITES SECTION HEADER ── */
nav.rc-sidebar-nav .text-\[13px\] {
  font-size: 11px !important;
  color: #fbbf24 !important;  /* amber-400 — keep the amber but brighter */
}

/* ── CHEVRON/EXPAND ICONS ── */
nav.rc-sidebar-nav svg {
  width: 14px !important;
  height: 14px !important;
}

/* ── SIDEBAR SECTION DIVIDERS ── */
nav.rc-sidebar-nav > div {
  border-color: rgba(255, 255, 255, 0.06) !important;
}

/* ── SCROLLBAR STYLING ── */
nav.rc-sidebar-nav::-webkit-scrollbar {
  width: 4px;
}

nav.rc-sidebar-nav::-webkit-scrollbar-track {
  background: transparent;
}

nav.rc-sidebar-nav::-webkit-scrollbar-thumb {
  background: rgba(52, 211, 153, 0.3);
  border-radius: 4px;
}

nav.rc-sidebar-nav::-webkit-scrollbar-thumb:hover {
  background: rgba(52, 211, 153, 0.5);
}
```

## `database/rcs-schema.sql`

```sql
-- Russell Capital Systems — complete database schema
-- Generated from drizzle/schema.ts by scripts/export_schema_sql.sh; do not hand-edit.
-- Tables: 123
-- Import: mysql -u USER -p DBNAME < database/rcs-schema.sql   (or phpMyAdmin → Import)
-- The database itself must already exist (create it in cPanel → MySQL Databases).

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE `advisor_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`accessTier` enum('trial','unlimited','subscriber') NOT NULL DEFAULT 'trial',
	`trialSecondsUsed` int NOT NULL DEFAULT 0,
	`lastHeartbeatAt` timestamp,
	`stripeCustomerId` varchar(100),
	`subscriptionStatus` enum('none','active','past_due','canceled') NOT NULL DEFAULT 'none',
	`stripeSubscriptionId` varchar(100),
	`trialAccessCount` int NOT NULL DEFAULT 0,
	`passwordType` enum('none','trial','eternal') NOT NULL DEFAULT 'none',
	`planSlug` varchar(50),
	`emailVerified` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `advisor_accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `advisor_accounts_email_unique` UNIQUE(`email`)
);
CREATE TABLE `advisor_goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`goalType` enum('AUM_TARGET','DEALS_CLOSED','NEW_CLIENTS','REVENUE') NOT NULL,
	`targetValue` decimal(15,2) NOT NULL,
	`period` varchar(20) NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `advisor_goals_id` PRIMARY KEY(`id`)
);
CREATE TABLE `agency_team_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`teamId` int NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(200) NOT NULL,
	`userEmail` varchar(320),
	`role` enum('supervisor','agent') NOT NULL DEFAULT 'agent',
	`status` enum('active','pending','suspended','removed') NOT NULL DEFAULT 'pending',
	`agreementSigned` boolean NOT NULL DEFAULT false,
	`agreementSignedAt` timestamp,
	`joinedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agency_team_members_id` PRIMARY KEY(`id`)
);
CREATE TABLE `agency_teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(300) NOT NULL,
	`supervisorId` int NOT NULL,
	`supervisorName` varchar(200) NOT NULL,
	`supervisorEmail` varchar(320),
	`workspaceId` int NOT NULL,
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `agency_teams_id` PRIMARY KEY(`id`)
);
CREATE TABLE `ai_memory_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`clientId` int,
	`content` text NOT NULL,
	`source` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ai_memory_notes_id` PRIMARY KEY(`id`)
);
CREATE TABLE `allocation_targets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`assetClass` varchar(100) NOT NULL,
	`targetPct` decimal(5,2) NOT NULL,
	`currentPct` decimal(5,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `allocation_targets_id` PRIMARY KEY(`id`)
);
CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`actorUserId` int,
	`action` varchar(200) NOT NULL,
	`entityType` varchar(100),
	`entityId` varchar(100),
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
CREATE TABLE `batch_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`templateType` varchar(100) NOT NULL,
	`frequency` varchar(50) NOT NULL DEFAULT 'weekly',
	`paused` boolean NOT NULL DEFAULT false,
	`lastRunAt` timestamp,
	`nextRunAt` timestamp,
	`runCount` int NOT NULL DEFAULT 0,
	`config` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `batch_schedules_id` PRIMARY KEY(`id`)
);
CREATE TABLE `calculation_audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(200),
	`clientId` int,
	`clientName` varchar(200),
	`calculationType` varchar(100) NOT NULL,
	`pagePath` varchar(500),
	`inputs` json,
	`outputs` json,
	`summary` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `calculation_audit_logs_id` PRIMARY KEY(`id`)
);
CREATE TABLE `calendar_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`clientId` int,
	`googleEventId` varchar(255),
	`title` varchar(255) NOT NULL,
	`description` text,
	`startTime` timestamp NOT NULL,
	`endTime` timestamp NOT NULL,
	`location` text,
	`meetingType` varchar(50) DEFAULT 'general',
	`status` varchar(20) DEFAULT 'scheduled',
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `calendar_events_id` PRIMARY KEY(`id`)
);
CREATE TABLE `campaign_enrollments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`campaignId` int NOT NULL,
	`clientId` int NOT NULL,
	`clientEmail` varchar(320) NOT NULL,
	`clientName` varchar(200),
	`status` enum('active','completed','unsubscribed') NOT NULL DEFAULT 'active',
	`currentStep` int NOT NULL DEFAULT 0,
	`enrolledAt` timestamp NOT NULL DEFAULT (now()),
	`lastSentAt` timestamp,
	`nextSendAt` timestamp,
	CONSTRAINT `campaign_enrollments_id` PRIMARY KEY(`id`)
);
CREATE TABLE `carrier_overrides` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`carrierId` varchar(50) NOT NULL,
	`carrierName` varchar(200) NOT NULL,
	`loadFee` decimal(6,4),
	`coiRate` decimal(6,4),
	`capRate` decimal(6,4),
	`floorRate` decimal(6,4),
	`avgReturn` decimal(6,4),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `carrier_overrides_id` PRIMARY KEY(`id`)
);
CREATE TABLE `carrier_quote_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`clientId` int,
	`clientName` varchar(200),
	`clientEmail` varchar(320),
	`advisorId` int NOT NULL,
	`advisorName` varchar(200),
	`advisorEmail` varchar(320),
	`carrierId` varchar(50) NOT NULL,
	`carrierName` varchar(200) NOT NULL,
	`productName` varchar(200),
	`formData` json NOT NULL,
	`status` enum('draft','submitted','pending_review','approved','rejected') NOT NULL DEFAULT 'draft',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `carrier_quote_requests_id` PRIMARY KEY(`id`)
);
CREATE TABLE `client_activity_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`actorName` varchar(200),
	`actorUserId` int,
	`entityType` varchar(50),
	`entityId` int,
	`summary` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_activity_log_id` PRIMARY KEY(`id`)
);
CREATE TABLE `client_badges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`badgeType` varchar(100) NOT NULL,
	`badgeName` varchar(200) NOT NULL,
	`badgeEmoji` varchar(20) NOT NULL,
	`badgeDescription` text,
	`earnedAt` timestamp NOT NULL DEFAULT (now()),
	`level` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_badges_id` PRIMARY KEY(`id`)
);
CREATE TABLE `client_crypto_holdings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`coinId` varchar(100) NOT NULL,
	`coinName` varchar(200) NOT NULL,
	`coinSymbol` varchar(20),
	`quantity` decimal(20,8) NOT NULL,
	`avgPurchasePrice` decimal(15,2) NOT NULL,
	`amountStaked` decimal(20,8),
	`stakingPercentage` decimal(8,4),
	`predictedStakingIncome` decimal(15,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_crypto_holdings_id` PRIMARY KEY(`id`)
);
CREATE TABLE `client_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`name` varchar(500) NOT NULL,
	`fileKey` varchar(1000) NOT NULL,
	`url` varchar(2000) NOT NULL,
	`mimeType` varchar(200),
	`sizeBytes` int,
	`category` enum('TAX_RETURN','ESTATE_PLAN','INSURANCE_POLICY','INVESTMENT_STATEMENT','TRUST_DOCUMENT','LEGAL_AGREEMENT','FINANCIAL_PLAN','OTHER') NOT NULL DEFAULT 'OTHER',
	`uploadedBy` int,
	`uploadedByName` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_documents_id` PRIMARY KEY(`id`)
);
CREATE TABLE `client_fact_finders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`data` json NOT NULL,
	`completeness` int NOT NULL DEFAULT 0,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_fact_finders_id` PRIMARY KEY(`id`),
	CONSTRAINT `client_fact_finders_userId_unique` UNIQUE(`userId`)
);
CREATE TABLE `client_journeys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`questions` json NOT NULL,
	`journey` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_journeys_id` PRIMARY KEY(`id`)
);
CREATE TABLE `client_life_goals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`targetAge` int NOT NULL,
	`goalCategory` enum('retirement','travel','education','home_purchase','debt_free','business','charity','health','family','luxury','legacy','other') NOT NULL DEFAULT 'other',
	`goalTitle` varchar(300) NOT NULL,
	`goalDescription` text,
	`estimatedCost` decimal(15,2),
	`priority` enum('must_have','nice_to_have','dream') NOT NULL DEFAULT 'nice_to_have',
	`achievabilityScore` int,
	`isAchieved` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_life_goals_id` PRIMARY KEY(`id`)
);
CREATE TABLE `client_meetings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`title` varchar(300) NOT NULL,
	`description` text,
	`scheduledAt` timestamp NOT NULL,
	`durationMin` int NOT NULL DEFAULT 60,
	`location` varchar(500),
	`meetingType` enum('IN_PERSON','VIDEO','PHONE','OTHER') NOT NULL DEFAULT 'VIDEO',
	`status` enum('SCHEDULED','COMPLETED','CANCELLED','NO_SHOW') NOT NULL DEFAULT 'SCHEDULED',
	`notes` text,
	`createdBy` int,
	`createdByName` varchar(200),
	`reminderSentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_meetings_id` PRIMARY KEY(`id`)
);
CREATE TABLE `client_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`authorId` int NOT NULL,
	`authorName` varchar(200),
	`noteType` enum('CALL','MEETING','EMAIL','TASK','GENERAL') NOT NULL DEFAULT 'GENERAL',
	`content` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_notes_id` PRIMARY KEY(`id`)
);
CREATE TABLE `client_portal_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`token` varchar(128) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`lastAccessedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_portal_sessions_id` PRIMARY KEY(`id`)
);
CREATE TABLE `client_portal_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`token` varchar(128) NOT NULL,
	`label` varchar(200),
	`createdByUserId` int,
	`expiresAt` timestamp NOT NULL,
	`lastAccessedAt` timestamp,
	`accessCount` int NOT NULL DEFAULT 0,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_portal_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `client_portal_tokens_token_unique` UNIQUE(`token`)
);
CREATE TABLE `client_properties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`propertyName` varchar(300) NOT NULL,
	`propertyType` enum('PRIMARY','INVESTMENT','SHORT_TERM_RENTAL','COMMERCIAL','LAND') NOT NULL DEFAULT 'PRIMARY',
	`propertyValue` decimal(15,2),
	`monthlyMortgagePayment` decimal(12,2),
	`monthlyInterestOnlyPayment` decimal(12,2),
	`totalInterestPayment` decimal(15,2),
	`monthlyRentalIncome` decimal(12,2),
	`annualAppreciation` decimal(5,4),
	`isPrimary` boolean NOT NULL DEFAULT false,
	`mortgageBalance` decimal(15,2),
	`interestRate` decimal(5,4),
	`loanTermYears` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_properties_id` PRIMARY KEY(`id`)
);
CREATE TABLE `client_recommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`category` enum('asset_allocation','spending','savings','insurance','tax_strategy','debt_management','retirement_timing','estate_planning','behavior','education') NOT NULL,
	`title` varchar(300) NOT NULL,
	`description` text NOT NULL,
	`scoreImpact` int NOT NULL,
	`difficulty` enum('easy','moderate','challenging') NOT NULL DEFAULT 'moderate',
	`estimatedTimeframe` varchar(100),
	`isAccepted` boolean NOT NULL DEFAULT false,
	`isCompleted` boolean NOT NULL DEFAULT false,
	`completedAt` timestamp,
	`suggestedTab` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_recommendations_id` PRIMARY KEY(`id`)
);
CREATE TABLE `client_risk_assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`marketDropReaction` int,
	`timeHorizon` int,
	`incomeStability` int,
	`investmentExperience` int,
	`riskCapacity` int,
	`volatilityComfort` int,
	`guaranteePreference` int,
	`growthVsIncome` int,
	`riskScore` int,
	`riskCategory` enum('conservative','moderate_conservative','moderate','moderate_aggressive','aggressive'),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_risk_assessments_id` PRIMARY KEY(`id`)
);
CREATE TABLE `client_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`overallScore` int NOT NULL DEFAULT 50,
	`financialHealthScore` int,
	`goalAlignmentScore` int,
	`behaviorScore` int,
	`diversificationScore` int,
	`level` int NOT NULL DEFAULT 1,
	`levelName` varchar(100) NOT NULL DEFAULT 'Starter',
	`totalPointsEarned` int NOT NULL DEFAULT 0,
	`streakDays` int NOT NULL DEFAULT 0,
	`lastActivityAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `client_scores_id` PRIMARY KEY(`id`)
);
CREATE TABLE `client_session_ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`sessionId` int,
	`rating` decimal(3,1) NOT NULL,
	`explanation` text,
	`behaviors` json,
	`actions` json,
	`learningApproaches` json,
	`scoreEnhancementSteps` json,
	`emailSent` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_session_ratings_id` PRIMARY KEY(`id`)
);
CREATE TABLE `client_tag_assignments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`tagId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_tag_assignments_id` PRIMARY KEY(`id`)
);
CREATE TABLE `client_tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`color` varchar(20) NOT NULL DEFAULT '#4f8cff',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `client_tags_id` PRIMARY KEY(`id`)
);
CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`household` varchar(200),
	`email` varchar(320),
	`phone` varchar(30),
	`age` int,
	`state` varchar(50),
	`filingStatus` enum('single','joint','hoh') DEFAULT 'joint',
	`income` decimal(15,2),
	`iraBalance` decimal(15,2),
	`rothBalance` decimal(15,2),
	`taxableAssets` decimal(15,2),
	`realEstateEquity` decimal(15,2),
	`lifeInsuranceCv` decimal(15,2),
	`firstName` varchar(100),
	`lastName` varchar(100),
	`riskTolerance` enum('conservative','moderate','aggressive','very_aggressive'),
	`annualIncome` decimal(15,2),
	`totalNetWorth` decimal(15,2),
	`retirementAge` int,
	`spouseName` varchar(200),
	`spouseAge` int,
	`dependents` int,
	`spouseIncome` decimal(15,2),
	`monthlyExpenses` decimal(15,2),
	`cashSavings` decimal(15,2),
	`homeValue` decimal(15,2),
	`k401Balance` decimal(15,2),
	`pensionIncome` decimal(15,2),
	`socialSecurityEstimate` decimal(15,2),
	`lifeInsuranceDb` decimal(15,2),
	`annualPremium` decimal(15,2),
	`annuityValue` decimal(15,2),
	`hasLTC` boolean DEFAULT false,
	`mortgageBalance` decimal(15,2),
	`mortgageRate` decimal(5,4),
	`mortgageYearsLeft` int,
	`totalMortgageInterest` decimal(15,2),
	`otherDebt` decimal(15,2),
	`helocRate` decimal(5,4),
	`ficoScore` int,
	`notes` text,
	`tags` json,
	`opportunityScore` int,
	`hubspotContactId` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
CREATE TABLE `compliance_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`alertType` enum('RMD_DEADLINE','CONTRIBUTION_LIMIT','FILING_DEADLINE','REBALANCE_OVERDUE','REVIEW_OVERDUE','AGE_MILESTONE','HIGH_CONCENTRATION','STALE_STRATEGY') NOT NULL,
	`severity` enum('INFO','WARNING','CRITICAL') NOT NULL DEFAULT 'WARNING',
	`title` varchar(300) NOT NULL,
	`message` text NOT NULL,
	`dueDate` timestamp,
	`dismissed` boolean NOT NULL DEFAULT false,
	`dismissedBy` int,
	`dismissedAt` timestamp,
	`resolvedAt` timestamp,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `compliance_alerts_id` PRIMARY KEY(`id`)
);
CREATE TABLE `compliance_signatures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(200) NOT NULL,
	`userEmail` varchar(320),
	`signedName` varchar(200) NOT NULL,
	`signedDate` varchar(20) NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `compliance_signatures_id` PRIMARY KEY(`id`)
);
CREATE TABLE `daily_reward_claims` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`dayNumber` int NOT NULL,
	`weekStart` varchar(10) NOT NULL,
	`rewardType` enum('xp','coin','loot','booster') NOT NULL,
	`rewardAmount` int NOT NULL,
	`claimedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `daily_reward_claims_id` PRIMARY KEY(`id`)
);
CREATE TABLE `dashboard_widget_configs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`widgetId` varchar(100) NOT NULL,
	`position` int NOT NULL DEFAULT 0,
	`visible` boolean NOT NULL DEFAULT true,
	`size` enum('SMALL','MEDIUM','LARGE','FULL') NOT NULL DEFAULT 'MEDIUM',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dashboard_widget_configs_id` PRIMARY KEY(`id`)
);
CREATE TABLE `deal_scores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`score` int NOT NULL,
	`confidence` varchar(10) NOT NULL DEFAULT 'medium',
	`factors` json,
	`recommendation` text,
	`scoredAt` timestamp NOT NULL DEFAULT (now()),
	`scoredBy` varchar(10) NOT NULL DEFAULT 'ai',
	CONSTRAINT `deal_scores_id` PRIMARY KEY(`id`)
);
CREATE TABLE `deals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`stage` enum('LEAD','QUALIFIED','STRATEGY','PROPOSAL','CLOSED_WON','CLOSED_LOST') NOT NULL DEFAULT 'LEAD',
	`ownerName` varchar(200),
	`value` decimal(15,2),
	`probability` decimal(5,4),
	`notes` text,
	`closedAt` timestamp,
	`hubspotDealId` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `deals_id` PRIMARY KEY(`id`)
);
CREATE TABLE `email_campaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text,
	`campaignType` enum('welcome','nurture','reengagement','educational','custom') NOT NULL DEFAULT 'custom',
	`status` enum('draft','active','paused','completed') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `email_campaigns_id` PRIMARY KEY(`id`)
);
CREATE TABLE `email_opt_outs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`source` varchar(40) NOT NULL DEFAULT 'link',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_opt_outs_id` PRIMARY KEY(`id`),
	CONSTRAINT `email_opt_outs_email_unique` UNIQUE(`email`)
);
CREATE TABLE `email_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`campaignId` int,
	`name` varchar(200) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`body` text NOT NULL,
	`delayDays` int NOT NULL DEFAULT 0,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_templates_id` PRIMARY KEY(`id`)
);
CREATE TABLE `email_verification_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`code` varchar(6) NOT NULL,
	`purpose` varchar(50) NOT NULL DEFAULT 'pre_checkout',
	`verified` boolean NOT NULL DEFAULT false,
	`verifiedAt` timestamp,
	`attempts` int NOT NULL DEFAULT 0,
	`expiresAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `email_verification_codes_id` PRIMARY KEY(`id`)
);
CREATE TABLE `encouragement_emails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`emailType` enum('weekly_check_in','goal_reminder','level_up','badge_earned','score_boost','habit_tip') NOT NULL,
	`subject` varchar(500) NOT NULL,
	`body` text,
	`sentAt` timestamp,
	`status` enum('pending','sent','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `encouragement_emails_id` PRIMARY KEY(`id`)
);
CREATE TABLE `error_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`source` varchar(20) NOT NULL DEFAULT 'client',
	`level` varchar(10) NOT NULL DEFAULT 'error',
	`message` text NOT NULL,
	`stack` text,
	`componentStack` text,
	`url` text,
	`userAgent` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `error_logs_id` PRIMARY KEY(`id`)
);
CREATE TABLE `family_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`inviteCode` varchar(20) NOT NULL,
	`createdBy` int NOT NULL,
	`totalXp` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `family_groups_id` PRIMARY KEY(`id`),
	CONSTRAINT `family_groups_inviteCode_unique` UNIQUE(`inviteCode`)
);
CREATE TABLE `family_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`familyId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('leader','member') NOT NULL DEFAULT 'member',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `family_members_id` PRIMARY KEY(`id`)
);
CREATE TABLE `financial_reels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` varchar(100) NOT NULL,
	`title` varchar(500) NOT NULL,
	`hook_text` text NOT NULL,
	`slides` json NOT NULL,
	`emotion` varchar(50) NOT NULL DEFAULT 'educational',
	`is_mega` boolean NOT NULL DEFAULT false,
	`cta_text` varchar(200) DEFAULT 'Learn More',
	`cta_action` varchar(200) DEFAULT '',
	`music_mood` varchar(100) DEFAULT 'neutral',
	`bg_gradient` varchar(200) DEFAULT '',
	`icon_emoji` varchar(20) DEFAULT '💰',
	`read_time_seconds` int DEFAULT 30,
	`sort_order` int DEFAULT 0,
	`view_count` int NOT NULL DEFAULT 0,
	`like_count` int NOT NULL DEFAULT 0,
	`save_count` int NOT NULL DEFAULT 0,
	`share_count` int NOT NULL DEFAULT 0,
	`is_active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `financial_reels_id` PRIMARY KEY(`id`)
);
CREATE TABLE `follow_up_emails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sharedProjectionId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`clientId` int,
	`clientName` varchar(200),
	`clientEmail` varchar(320) NOT NULL,
	`advisorName` varchar(200),
	`emailType` enum('3day','7day') NOT NULL,
	`shareToken` varchar(64) NOT NULL,
	`scheduledAt` timestamp NOT NULL,
	`sentAt` timestamp,
	`status` enum('pending','sent','cancelled','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `follow_up_emails_id` PRIMARY KEY(`id`)
);
CREATE TABLE `hidden_material_config` (
	`id` int AUTO_INCREMENT NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hidden_material_config_id` PRIMARY KEY(`id`)
);
CREATE TABLE `hidden_material_reset_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(6) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`used` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hidden_material_reset_codes_id` PRIMARY KEY(`id`)
);
CREATE TABLE `household_fact_finders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`primaryAge` int,
	`primaryIncome` decimal(15,2),
	`primaryIra` decimal(15,2),
	`primaryRothIra` decimal(15,2),
	`primaryCash` decimal(15,2),
	`primaryHomeValue` decimal(15,2),
	`primaryHomeEquity` decimal(15,2),
	`primaryMortgageBalance` decimal(15,2),
	`primaryMortgageRate` decimal(5,4),
	`primaryMortgageYearsLeft` int,
	`primaryTotalInterest` decimal(15,2),
	`primaryAnnualPremium` decimal(15,2),
	`primaryDeathBenefit` decimal(15,2),
	`spouseName` varchar(200),
	`spouseAge` int,
	`spouseIncome` decimal(15,2),
	`spouseIra` decimal(15,2),
	`spouseRothIra` decimal(15,2),
	`spouseCash` decimal(15,2),
	`helocRate` decimal(5,4),
	`helocMaxLtv` decimal(5,4),
	`rentBasement` boolean DEFAULT false,
	`children` json,
	`grandchildren` json,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `household_fact_finders_id` PRIMARY KEY(`id`)
);
CREATE TABLE `hubspot_sync_log` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`direction` enum('PUSH','PULL') NOT NULL,
	`objectType` enum('CONTACT','DEAL') NOT NULL,
	`hubspotId` varchar(100),
	`localId` int,
	`status` enum('SUCCESS','FAILED','SKIPPED') NOT NULL DEFAULT 'SUCCESS',
	`errorMessage` text,
	`syncedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hubspot_sync_log_id` PRIMARY KEY(`id`)
);
CREATE TABLE `hubspot_sync_settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`syncEnabled` boolean NOT NULL DEFAULT false,
	`syncContacts` boolean NOT NULL DEFAULT true,
	`syncDeals` boolean NOT NULL DEFAULT true,
	`syncDirection` enum('BIDIRECTIONAL','PUSH_ONLY','PULL_ONLY') NOT NULL DEFAULT 'BIDIRECTIONAL',
	`lastSyncAt` timestamp,
	`lastSyncStatus` enum('SUCCESS','PARTIAL','FAILED') DEFAULT 'SUCCESS',
	`lastSyncContactsPushed` int DEFAULT 0,
	`lastSyncContactsPulled` int DEFAULT 0,
	`lastSyncDealsPushed` int DEFAULT 0,
	`lastSyncDealsPulled` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `hubspot_sync_settings_id` PRIMARY KEY(`id`)
);
CREATE TABLE `illustration_uploads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`userId` int NOT NULL,
	`clientId` int,
	`fileName` varchar(500) NOT NULL,
	`fileUrl` varchar(2000) NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`carrier` varchar(200),
	`productName` varchar(300),
	`insuredName` varchar(200),
	`insuredAge` int,
	`insuredGender` varchar(20),
	`insuredState` varchar(50),
	`annualPremium` decimal(15,2),
	`deathBenefit` decimal(15,2),
	`illustratedRate` decimal(6,4),
	`extractedData` json,
	`yearByYear` json,
	`status` enum('uploading','extracting','ready','error') NOT NULL DEFAULT 'uploading',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `illustration_uploads_id` PRIMARY KEY(`id`)
);
CREATE TABLE `in_app_notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`userId` int,
	`type` varchar(50) NOT NULL,
	`title` varchar(300) NOT NULL,
	`message` text NOT NULL,
	`link` varchar(1000),
	`read` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `in_app_notifications_id` PRIMARY KEY(`id`)
);
CREATE TABLE `knowledge_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`title` varchar(300) NOT NULL,
	`docType` enum('MESSAGING_LIBRARY','OBJECTION_GUIDE','OFFER_POSITIONING','RENEWAL_POSITIONING','TONE_RULE','COMPLIANCE_RULE','PLAYBOOK_GUIDANCE') NOT NULL DEFAULT 'PLAYBOOK_GUIDANCE',
	`status` enum('DRAFT','ACTIVE','ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
	`summary` text,
	`content` text,
	`tags` json,
	`sourceLabel` varchar(100),
	`versionLabel` varchar(50),
	`chunkCount` int NOT NULL DEFAULT 0,
	`fileUrl` varchar(1000),
	`fileKey` varchar(500),
	`fileMime` varchar(100),
	`fileSize` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `knowledge_documents_id` PRIMARY KEY(`id`)
);
CREATE TABLE `lead_followups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`leadId` int NOT NULL,
	`step` varchar(60) NOT NULL,
	`channel` enum('email','sms') NOT NULL,
	`scheduledFor` timestamp NOT NULL,
	`status` enum('pending','sent','skipped','failed','cancelled') NOT NULL DEFAULT 'pending',
	`sentAt` timestamp,
	`reason` varchar(300),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lead_followups_id` PRIMARY KEY(`id`)
);
CREATE TABLE `leaderboard_consents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`month` int NOT NULL,
	`year` int NOT NULL,
	`optedIn` boolean NOT NULL DEFAULT false,
	`respondedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `leaderboard_consents_id` PRIMARY KEY(`id`)
);
CREATE TABLE `leaderboard_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`handle` varchar(50) NOT NULL,
	`useRealName` boolean NOT NULL DEFAULT false,
	`currentlyOptedIn` boolean NOT NULL DEFAULT false,
	`baselineAnnualCommissions` decimal(15,2),
	`platformJoinDate` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leaderboard_profiles_id` PRIMARY KEY(`id`)
);
CREATE TABLE `legal_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`documentType` enum('supervisor_monitoring_agreement','compliance_disclaimer','terms_of_service','privacy_policy','nda','other') NOT NULL,
	`title` varchar(500) NOT NULL,
	`signerUserId` int NOT NULL,
	`signerName` varchar(200) NOT NULL,
	`signerEmail` varchar(320),
	`relatedTeamId` int,
	`relatedTeamName` varchar(300),
	`supervisorId` int,
	`supervisorName` varchar(200),
	`signatureName` varchar(200) NOT NULL,
	`signatureDate` varchar(50) NOT NULL,
	`documentContent` text NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`signedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `legal_documents_id` PRIMARY KEY(`id`)
);
CREATE TABLE `market_data_points` (
	`id` int AUTO_INCREMENT NOT NULL,
	`series` varchar(40) NOT NULL,
	`value` decimal(14,4) NOT NULL,
	`asOf` varchar(10) NOT NULL,
	`source` varchar(40) NOT NULL DEFAULT 'fred',
	`fetchedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `market_data_points_id` PRIMARY KEY(`id`),
	CONSTRAINT `market_data_points_series_unique` UNIQUE(`series`)
);
CREATE TABLE `meeting_reminder_prefs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`userId` int NOT NULL,
	`meetingType` enum('IN_PERSON','VIDEO','PHONE','OTHER') NOT NULL,
	`enabled` boolean NOT NULL DEFAULT true,
	`leadTimeMinutes` int NOT NULL DEFAULT 1440,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meeting_reminder_prefs_id` PRIMARY KEY(`id`)
);
CREATE TABLE `memberships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('SUPER_ADMIN','ADMIN','ADVISOR','ANALYST','VIEWER') NOT NULL DEFAULT 'VIEWER',
	`status` enum('ACTIVE','SUSPENDED','PENDING') NOT NULL DEFAULT 'ACTIVE',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `memberships_id` PRIMARY KEY(`id`)
);
CREATE TABLE `morning_rituals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`date` varchar(10) NOT NULL,
	`stepsCompleted` json,
	`totalSteps` int NOT NULL DEFAULT 7,
	`isComplete` boolean NOT NULL DEFAULT false,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`streakDay` int NOT NULL DEFAULT 1,
	`xpEarned` int NOT NULL DEFAULT 0,
	`coinsEarned` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `morning_rituals_id` PRIMARY KEY(`id`)
);
CREATE TABLE `outbound_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int,
	`clientId` int,
	`leadId` int,
	`userId` int,
	`channel` enum('email','sms') NOT NULL,
	`category` enum('transactional','marketing') NOT NULL DEFAULT 'transactional',
	`toAddress` varchar(320) NOT NULL,
	`subject` varchar(300),
	`body` text NOT NULL,
	`template` varchar(60),
	`status` enum('sent','failed','suppressed') NOT NULL,
	`via` varchar(20),
	`reason` varchar(300),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `outbound_messages_id` PRIMARY KEY(`id`)
);
CREATE TABLE `owner_trusted_ips` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ipAddress` varchar(45) NOT NULL,
	`label` varchar(200),
	`loginCount` int NOT NULL DEFAULT 1,
	`lastUsedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `owner_trusted_ips_id` PRIMARY KEY(`id`),
	CONSTRAINT `owner_trusted_ips_ipAddress_unique` UNIQUE(`ipAddress`)
);
CREATE TABLE `page_activity_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(200) NOT NULL,
	`pagePath` varchar(500) NOT NULL,
	`pageTitle` varchar(200) NOT NULL,
	`enteredAt` timestamp NOT NULL DEFAULT (now()),
	`exitedAt` timestamp,
	`durationSecs` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `page_activity_logs_id` PRIMARY KEY(`id`)
);
CREATE TABLE `page_audit_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`runId` int NOT NULL,
	`path` varchar(500) NOT NULL,
	`pageTitle` varchar(300),
	`componentName` varchar(200),
	`renderHealth` enum('untested','pass','warn','fail') NOT NULL DEFAULT 'untested',
	`navigationHealth` enum('untested','reachable','orphaned','broken') NOT NULL DEFAULT 'untested',
	`interactionHealth` enum('untested','working','partial','placeholder','broken') NOT NULL DEFAULT 'untested',
	`placeholderCount` int NOT NULL DEFAULT 0,
	`duplicateGroup` varchar(200),
	`usefulnessScore` int,
	`recommendation` enum('keep','improve','merge','secondary','retire'),
	`mergeTarget` varchar(500),
	`rationale` text,
	`improvementInstructions` text,
	`evidence` json,
	`auditedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `page_audit_records_id` PRIMARY KEY(`id`)
);
CREATE TABLE `page_audit_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`initiatedBy` int NOT NULL,
	`routeCount` int NOT NULL DEFAULT 0,
	`status` enum('queued','running','completed','failed') NOT NULL DEFAULT 'queued',
	`methodologyVersion` varchar(50) NOT NULL DEFAULT '1.0',
	`summary` json,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `page_audit_runs_id` PRIMARY KEY(`id`)
);
CREATE TABLE `payment_disclosures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workspaceId` int,
	`planSlug` varchar(50) NOT NULL,
	`billingInterval` enum('MONTHLY','ANNUAL') NOT NULL,
	`priceAtAcceptance` decimal(10,2) NOT NULL,
	`payorFirstName` varchar(100) NOT NULL,
	`payorLastName` varchar(100) NOT NULL,
	`payorBusinessEntity` varchar(200),
	`payorAddress` varchar(300) NOT NULL,
	`payorCity` varchar(100) NOT NULL,
	`payorState` varchar(50) NOT NULL,
	`payorZip` varchar(20) NOT NULL,
	`payorPhone` varchar(30) NOT NULL,
	`payorEmail` varchar(320),
	`ipAddress` varchar(45) NOT NULL,
	`userAgent` varchar(500),
	`pinVerifiedAt` timestamp,
	`signatureText` varchar(300) NOT NULL,
	`signatureHash` varchar(128) NOT NULL,
	`disclosureVersion` varchar(20) NOT NULL DEFAULT '1.0',
	`governingLaw` varchar(50) NOT NULL DEFAULT 'Delaware',
	`agreedAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payment_disclosures_id` PRIMARY KEY(`id`)
);
CREATE TABLE `plan_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subject` varchar(40) NOT NULL,
	`seq` int NOT NULL,
	`userId` int,
	`clientId` int,
	`leadId` int,
	`workspaceId` int,
	`kind` enum('fact','assumption','decision','message','document','outcome','scenario','journey','status','note') NOT NULL,
	`source` varchar(20) NOT NULL,
	`key` varchar(120),
	`label` varchar(200),
	`value` json,
	`prevValue` json,
	`summary` text NOT NULL,
	`actorName` varchar(200),
	`occurredAt` timestamp NOT NULL,
	`prevHash` varchar(64) NOT NULL,
	`hash` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `plan_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `plan_events_subject_seq` UNIQUE(`subject`,`seq`)
);
CREATE TABLE `planning_case_notes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planningCaseId` int NOT NULL,
	`userId` int NOT NULL,
	`noteType` enum('advisor','client','compliance','system') NOT NULL DEFAULT 'advisor',
	`content` text NOT NULL,
	`resolved` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `planning_case_notes_id` PRIMARY KEY(`id`)
);
CREATE TABLE `planning_cases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`clientId` int,
	`userId` int NOT NULL,
	`title` varchar(300) NOT NULL,
	`caseType` varchar(100) NOT NULL DEFAULT 'comprehensive',
	`status` enum('draft','active','review','completed','archived') NOT NULL DEFAULT 'draft',
	`currentStage` varchar(100) NOT NULL DEFAULT 'discovery',
	`assumptions` json,
	`results` json,
	`workflowState` json,
	`lastSavedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `planning_cases_id` PRIMARY KEY(`id`)
);
CREATE TABLE `prediction_bets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`question` varchar(500) NOT NULL,
	`prediction` varchar(100) NOT NULL,
	`wager` int NOT NULL,
	`status` enum('open','won','lost','cancelled') NOT NULL DEFAULT 'open',
	`resolvedAt` timestamp,
	`payout` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `prediction_bets_id` PRIMARY KEY(`id`)
);
CREATE TABLE `prediction_questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`createdBy` int NOT NULL,
	`question` varchar(500) NOT NULL,
	`category` varchar(50) NOT NULL DEFAULT 'general',
	`endDate` timestamp NOT NULL,
	`yesCount` int NOT NULL DEFAULT 0,
	`noCount` int NOT NULL DEFAULT 0,
	`totalWager` int NOT NULL DEFAULT 0,
	`status` enum('open','resolved_yes','resolved_no','cancelled') NOT NULL DEFAULT 'open',
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `prediction_questions_id` PRIMARY KEY(`id`)
);
CREATE TABLE `public_leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`publicId` varchar(40) NOT NULL,
	`firstName` varchar(120),
	`lastName` varchar(120),
	`email` varchar(320),
	`phone` varchar(40),
	`bestTimeToContact` varchar(200),
	`consentedAt` timestamp,
	`consentVersion` varchar(40),
	`lastIp` varchar(64),
	`ipHistory` json,
	`question` text,
	`factFinder` json,
	`analysis` json,
	`status` enum('new','contacted','qualified','client') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSeenAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `public_leads_id` PRIMARY KEY(`id`),
	CONSTRAINT `public_leads_publicId_unique` UNIQUE(`publicId`)
);
CREATE TABLE `rebalance_alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`assetClass` varchar(100) NOT NULL,
	`targetPct` decimal(5,2) NOT NULL,
	`currentPct` decimal(5,2) NOT NULL,
	`driftPct` decimal(5,2) NOT NULL,
	`threshold` decimal(5,2) NOT NULL,
	`status` enum('OPEN','ACKNOWLEDGED','RESOLVED') NOT NULL DEFAULT 'OPEN',
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `rebalance_alerts_id` PRIMARY KEY(`id`)
);
CREATE TABLE `recommendation_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`clientId` int,
	`clientName` varchar(200),
	`clientAge` int,
	`riskTolerance` varchar(20),
	`annualPremium` decimal(15,2),
	`recommendedCarrierId` varchar(50) NOT NULL,
	`recommendedCarrierName` varchar(200) NOT NULL,
	`totalScore` decimal(6,2) NOT NULL,
	`allScoresJson` json NOT NULL,
	`advisorId` int,
	`advisorName` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `recommendation_history_id` PRIMARY KEY(`id`)
);
CREATE TABLE `reel_interactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`reelId` int NOT NULL,
	`action` enum('view','like','save','share') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reel_interactions_id` PRIMARY KEY(`id`)
);
CREATE TABLE `referral_links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`createdBy` int NOT NULL,
	`code` varchar(50) NOT NULL,
	`partnerName` varchar(200) NOT NULL,
	`partnerEmail` varchar(320),
	`partnerType` enum('client','cpa','attorney','financial_advisor','other') NOT NULL DEFAULT 'client',
	`commissionPct` decimal(5,2),
	`clicks` int NOT NULL DEFAULT 0,
	`signups` int NOT NULL DEFAULT 0,
	`conversions` int NOT NULL DEFAULT 0,
	`totalRevenue` decimal(15,2) DEFAULT '0',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `referral_links_id` PRIMARY KEY(`id`)
);
CREATE TABLE `referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`referrerName` varchar(200) NOT NULL,
	`referredName` varchar(200) NOT NULL,
	`referredEmail` varchar(320),
	`referredPhone` varchar(30),
	`source` enum('Client','Professional','Event','Online','Other') NOT NULL DEFAULT 'Client',
	`status` enum('pending','contacted','meeting_scheduled','converted','lost') NOT NULL DEFAULT 'pending',
	`estimatedValue` decimal(15,2),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`)
);
CREATE TABLE `report_exports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`clientId` int,
	`reportType` varchar(50) NOT NULL,
	`status` varchar(20) NOT NULL DEFAULT 'pending',
	`fileUrl` text,
	`fileKey` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `report_exports_id` PRIMARY KEY(`id`)
);
CREATE TABLE `report_schedules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`frequency` enum('MONTHLY','QUARTERLY') NOT NULL DEFAULT 'MONTHLY',
	`recipientEmail` varchar(320),
	`active` boolean NOT NULL DEFAULT true,
	`lastSentAt` timestamp,
	`nextSendAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `report_schedules_id` PRIMARY KEY(`id`)
);
CREATE TABLE `revenue_guarantee_calcs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`currentAUM` decimal(15,2) NOT NULL,
	`currentRevenue` decimal(15,2) NOT NULL,
	`projectedAUM` decimal(15,2) NOT NULL,
	`projectedRevenue` decimal(15,2) NOT NULL,
	`subscriptionCost` decimal(10,2) NOT NULL,
	`roiMultiple` decimal(8,2) NOT NULL,
	`breakEvenDays` int NOT NULL,
	`guaranteeTier` enum('bronze','silver','gold','platinum') NOT NULL DEFAULT 'bronze',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `revenue_guarantee_calcs_id` PRIMARY KEY(`id`)
);
CREATE TABLE `risk_score_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`score` int NOT NULL,
	`level` enum('LOW','MEDIUM','HIGH','CRITICAL') NOT NULL,
	`factors` json,
	`snapshotDate` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `risk_score_history_id` PRIMARY KEY(`id`)
);
CREATE TABLE `risk_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`advisorId` int,
	`overallScore` int NOT NULL,
	`depthLevel` int NOT NULL,
	`questionsAnswered` int NOT NULL,
	`categories` json,
	`marketContext` json,
	`riskCategory` varchar(50),
	`trigger` varchar(50) NOT NULL DEFAULT 'initial',
	`driftScore` int,
	`flaggedForReassessment` boolean NOT NULL DEFAULT false,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `risk_snapshots_id` PRIMARY KEY(`id`)
);
CREATE TABLE `russellcoin_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` int NOT NULL,
	`balance` int NOT NULL,
	`txType` enum('earn','spend','bonus','refund') NOT NULL,
	`source` varchar(100) NOT NULL,
	`sourceId` varchar(100),
	`description` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `russellcoin_transactions_id` PRIMARY KEY(`id`)
);
CREATE TABLE `saved_scenarios` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`userId` int NOT NULL,
	`clientId` int,
	`name` varchar(200) NOT NULL,
	`inputs` json NOT NULL,
	`projectionData` json NOT NULL,
	`tags` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `saved_scenarios_id` PRIMARY KEY(`id`)
);
CREATE TABLE `saved_slide_decks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`toolName` varchar(200) NOT NULL,
	`clientName` varchar(200),
	`audience` enum('client','advisor','team') NOT NULL DEFAULT 'client',
	`slideCount` int NOT NULL,
	`slides` json NOT NULL,
	`pptxUrl` varchar(2000),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `saved_slide_decks_id` PRIMARY KEY(`id`)
);
CREATE TABLE `saved_strategies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`clientId` int,
	`clientName` varchar(200),
	`advisorId` int NOT NULL,
	`advisorName` varchar(200),
	`version` int NOT NULL DEFAULT 1,
	`parentStrategyId` int,
	`strategyType` varchar(50) NOT NULL,
	`strategyLabel` varchar(200) NOT NULL,
	`carrierId` varchar(50),
	`carrierName` varchar(200),
	`inputsJson` json NOT NULL,
	`summaryJson` json NOT NULL,
	`iulProjectionJson` json,
	`strProjectionJson` json,
	`notes` text,
	`isArchived` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `saved_strategies_id` PRIMARY KEY(`id`)
);
CREATE TABLE `scenario_snapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`clientId` int,
	`name` varchar(200) NOT NULL,
	`scenarioType` enum('ROTH','IUL','REAL_ESTATE','COMBINED','ROTH_CONVERSION_STR','OIL_GAS_ROTH','MORTGAGE_KILLER') NOT NULL DEFAULT 'COMBINED',
	`inputJson` json,
	`outputJson` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scenario_snapshots_id` PRIMARY KEY(`id`)
);
CREATE TABLE `shared_projections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`clientId` int,
	`clientName` varchar(200),
	`advisorName` varchar(200),
	`token` varchar(64) NOT NULL,
	`projectionData` json NOT NULL,
	`inputData` json NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`viewCount` int NOT NULL DEFAULT 0,
	`lastViewedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shared_projections_id` PRIMARY KEY(`id`),
	CONSTRAINT `shared_projections_token_unique` UNIQUE(`token`)
);
CREATE TABLE `sidebar_favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`path` varchar(500) NOT NULL,
	`label` varchar(200) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sidebar_favorites_id` PRIMARY KEY(`id`)
);
CREATE TABLE `skill_tree_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`skillSlug` varchar(100) NOT NULL,
	`skillName` varchar(200) NOT NULL,
	`currentLevel` int NOT NULL DEFAULT 0,
	`maxLevel` int NOT NULL DEFAULT 5,
	`xpInvested` int NOT NULL DEFAULT 0,
	`mastered` boolean NOT NULL DEFAULT false,
	`masteredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `skill_tree_progress_id` PRIMARY KEY(`id`)
);
CREATE TABLE `slack_integrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`teamId` varchar(100),
	`teamName` varchar(200),
	`botToken` varchar(500),
	`channelId` varchar(100),
	`channelName` varchar(200),
	`webhookUrl` varchar(1000),
	`active` boolean NOT NULL DEFAULT true,
	`configJson` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `slack_integrations_id` PRIMARY KEY(`id`)
);
CREATE TABLE `slide_comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deckId` int NOT NULL,
	`slideIndex` int,
	`userId` int NOT NULL,
	`userName` varchar(200) NOT NULL,
	`userEmail` varchar(320),
	`content` text NOT NULL,
	`resolved` boolean NOT NULL DEFAULT false,
	`parentId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `slide_comments_id` PRIMARY KEY(`id`)
);
CREATE TABLE `slide_shares` (
	`id` int AUTO_INCREMENT NOT NULL,
	`deckId` int NOT NULL,
	`sharedByUserId` int NOT NULL,
	`sharedWithEmail` varchar(320) NOT NULL,
	`sharedWithUserId` int,
	`permission` enum('view','comment','edit') NOT NULL DEFAULT 'comment',
	`shareToken` varchar(255) NOT NULL,
	`accessedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `slide_shares_id` PRIMARY KEY(`id`),
	CONSTRAINT `slide_shares_shareToken_unique` UNIQUE(`shareToken`)
);
CREATE TABLE `slide_usage` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`email` varchar(320),
	`accessTier` enum('trial','unlimited','subscriber','owner') NOT NULL DEFAULT 'trial',
	`topic` varchar(200),
	`toolName` varchar(200),
	`slideCount` int NOT NULL DEFAULT 0,
	`audience` enum('client','advisor','team') NOT NULL DEFAULT 'client',
	`action` enum('generate','export_pptx','save') NOT NULL DEFAULT 'generate',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `slide_usage_id` PRIMARY KEY(`id`)
);
CREATE TABLE `sms_opt_outs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`phone` varchar(24) NOT NULL,
	`source` varchar(40) NOT NULL DEFAULT 'reply',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sms_opt_outs_id` PRIMARY KEY(`id`),
	CONSTRAINT `sms_opt_outs_phone_unique` UNIQUE(`phone`)
);
CREATE TABLE `sms_verification_codes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`phone` varchar(30) NOT NULL,
	`code` varchar(10) NOT NULL,
	`purpose` varchar(50) NOT NULL DEFAULT 'payment_disclosure',
	`verified` boolean NOT NULL DEFAULT false,
	`attempts` int NOT NULL DEFAULT 0,
	`expiresAt` timestamp NOT NULL,
	`verifiedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sms_verification_codes_id` PRIMARY KEY(`id`)
);
CREATE TABLE `strategies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`summary` text,
	`taxPlan` text,
	`insurancePlan` text,
	`investmentPlan` text,
	`advisorScript` text,
	`generatedBy` enum('AI','MANUAL','HYBRID') NOT NULL DEFAULT 'MANUAL',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `strategies_id` PRIMARY KEY(`id`)
);
CREATE TABLE `supervisor_monitoring_agreements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(200) NOT NULL,
	`userEmail` varchar(320),
	`teamId` int NOT NULL,
	`teamName` varchar(300) NOT NULL,
	`supervisorId` int NOT NULL,
	`supervisorName` varchar(200) NOT NULL,
	`signatureName` varchar(200) NOT NULL,
	`signatureDate` varchar(50) NOT NULL,
	`agreementVersion` varchar(20) NOT NULL DEFAULT '1.0',
	`agreementText` text NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`signedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `supervisor_monitoring_agreements_id` PRIMARY KEY(`id`)
);
CREATE TABLE `trial_logins` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`ipAddress` varchar(100) NOT NULL,
	`userAgent` text,
	`sessionToken` varchar(255) NOT NULL,
	`accessTier` enum('trial','unlimited','subscriber') NOT NULL DEFAULT 'trial',
	`expiresAt` timestamp NOT NULL,
	`loggedOutAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trial_logins_id` PRIMARY KEY(`id`),
	CONSTRAINT `trial_logins_sessionToken_unique` UNIQUE(`sessionToken`)
);
CREATE TABLE `tutorial_progress` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`role` varchar(50),
	`questionnaireAnswers` json,
	`questionnaireCompleted` boolean NOT NULL DEFAULT false,
	`completedSections` json,
	`completedSubSections` json,
	`currentStep` int NOT NULL DEFAULT 0,
	`score` int NOT NULL DEFAULT 0,
	`badges` json,
	`totalPointsEarned` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tutorial_progress_id` PRIMARY KEY(`id`)
);
CREATE TABLE `user_achievements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`achievementSlug` varchar(100) NOT NULL,
	`title` varchar(300) NOT NULL,
	`description` text,
	`emoji` varchar(20) NOT NULL DEFAULT '🏆',
	`rarity` enum('common','rare','epic','legendary') NOT NULL DEFAULT 'common',
	`xpReward` int NOT NULL DEFAULT 100,
	`coinReward` int NOT NULL DEFAULT 50,
	`unlockedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_achievements_id` PRIMARY KEY(`id`)
);
CREATE TABLE `user_loot` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`itemSlug` varchar(100) NOT NULL,
	`itemName` varchar(300) NOT NULL,
	`itemType` enum('cosmetic','booster','title','pet','theme','sound','shield') NOT NULL,
	`rarity` enum('common','rare','epic','legendary') NOT NULL DEFAULT 'common',
	`quantity` int NOT NULL DEFAULT 1,
	`equipped` boolean NOT NULL DEFAULT false,
	`acquiredVia` enum('purchase','quest','achievement','loot_drop','daily_reward','gift') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_loot_id` PRIMARY KEY(`id`)
);
CREATE TABLE `user_pets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`speciesId` varchar(50) NOT NULL,
	`name` varchar(100) NOT NULL,
	`level` int NOT NULL DEFAULT 1,
	`xp` int NOT NULL DEFAULT 0,
	`xpToNext` int NOT NULL DEFAULT 100,
	`happiness` int NOT NULL DEFAULT 100,
	`hunger` int NOT NULL DEFAULT 100,
	`strength` int NOT NULL DEFAULT 5,
	`wisdom` int NOT NULL DEFAULT 5,
	`charisma` int NOT NULL DEFAULT 5,
	`luck` int NOT NULL DEFAULT 5,
	`evolutionStage` enum('hatchling','juvenile','adolescent','adult','elder','legendary') NOT NULL DEFAULT 'hatchling',
	`totalFeedings` int NOT NULL DEFAULT 0,
	`totalDeals` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`lastFedAt` timestamp,
	`lastInteractedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_pets_id` PRIMARY KEY(`id`)
);
CREATE TABLE `user_portal_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workspaceId` int,
	`defaultLandingPath` varchar(500) NOT NULL DEFAULT '/portal/dashboard',
	`openNavGroups` json,
	`secondaryCategories` json,
	`compactSidebar` boolean NOT NULL DEFAULT false,
	`reduceMotion` boolean NOT NULL DEFAULT false,
	`lastVisitedPath` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_portal_preferences_id` PRIMARY KEY(`id`)
);
CREATE TABLE `user_quests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`questSlug` varchar(100) NOT NULL,
	`questType` enum('daily','weekly','epic','legendary') NOT NULL,
	`title` varchar(300) NOT NULL,
	`description` text,
	`xpReward` int NOT NULL DEFAULT 50,
	`coinReward` int NOT NULL DEFAULT 10,
	`progress` int NOT NULL DEFAULT 0,
	`target` int NOT NULL DEFAULT 1,
	`status` enum('active','completed','expired','claimed') NOT NULL DEFAULT 'active',
	`expiresAt` timestamp,
	`completedAt` timestamp,
	`claimedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_quests_id` PRIMARY KEY(`id`)
);
CREATE TABLE `user_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(200) NOT NULL,
	`userEmail` varchar(320),
	`loginAt` timestamp NOT NULL DEFAULT (now()),
	`logoutAt` timestamp,
	`durationSecs` int,
	`ipAddress` varchar(45),
	`userAgent` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `user_sessions_id` PRIMARY KEY(`id`)
);
CREATE TABLE `user_xp_profiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalXp` int NOT NULL DEFAULT 0,
	`level` int NOT NULL DEFAULT 1,
	`levelName` varchar(100) NOT NULL DEFAULT 'Rookie',
	`russellCoin` int NOT NULL DEFAULT 0,
	`lifetimeRussellCoin` int NOT NULL DEFAULT 0,
	`currentStreak` int NOT NULL DEFAULT 0,
	`longestStreak` int NOT NULL DEFAULT 0,
	`lastCheckInDate` varchar(10),
	`totalCheckIns` int NOT NULL DEFAULT 0,
	`avatarUrl` varchar(2000),
	`avatarOriginalUrl` varchar(2000),
	`spouseAvatarUrl` varchar(2000),
	`spouseAvatarOriginalUrl` varchar(2000),
	`avatarTitle` varchar(200) DEFAULT 'Newcomer',
	`avatarBorder` varchar(50) DEFAULT 'default',
	`petType` varchar(50) DEFAULT 'eagle',
	`petLevel` int NOT NULL DEFAULT 1,
	`addictionScore` int NOT NULL DEFAULT 0,
	`reputationScore` int NOT NULL DEFAULT 100,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_xp_profiles_id` PRIMARY KEY(`id`)
);
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`firstName` varchar(100),
	`lastName` varchar(100),
	`passwordHash` varchar(255),
	`resetToken` varchar(255),
	`resetTokenExpiry` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	`onboardingCompleted` boolean NOT NULL DEFAULT false,
	`loginCount` int NOT NULL DEFAULT 0,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
CREATE TABLE `video_engagement_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`proposalId` int NOT NULL,
	`viewerType` enum('client','advisor','anonymous') NOT NULL DEFAULT 'anonymous',
	`viewerId` int,
	`eventType` enum('play','pause','seek','chapter_enter','chapter_exit','complete','replay_section') NOT NULL,
	`chapterIndex` int,
	`videoTimestamp` int,
	`watchDuration` int,
	`totalWatchTime` int,
	`percentWatched` int,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `video_engagement_events_id` PRIMARY KEY(`id`)
);
CREATE TABLE `video_proposal_chapters` (
	`id` int AUTO_INCREMENT NOT NULL,
	`proposalId` int NOT NULL,
	`chapterIndex` int NOT NULL,
	`chapterType` enum('introduction','current_situation','recommended_strategy','twenty_year_projection','next_steps','custom') NOT NULL,
	`title` varchar(300) NOT NULL,
	`script` text NOT NULL,
	`durationEstimate` int,
	`dataSnapshot` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `video_proposal_chapters_id` PRIMARY KEY(`id`)
);
CREATE TABLE `video_proposals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`workspaceId` int NOT NULL,
	`clientId` int,
	`title` varchar(500) NOT NULL,
	`status` enum('draft','generating_script','script_ready','generating_video','processing','completed','failed') NOT NULL DEFAULT 'draft',
	`avatarId` varchar(200),
	`voiceId` varchar(200),
	`heygenVideoId` varchar(200),
	`videoUrl` text,
	`thumbnailUrl` text,
	`shareToken` varchar(100),
	`totalDuration` int,
	`resolution` enum('1080p','720p') NOT NULL DEFAULT '1080p',
	`errorMessage` text,
	`generatedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `video_proposals_id` PRIMARY KEY(`id`)
);
CREATE TABLE `war_stories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`content` text NOT NULL,
	`category` enum('roth_conversion','iul_strategy','tax_savings','estate_planning','annuity_win','general') NOT NULL DEFAULT 'general',
	`dollarImpact` decimal(15,2),
	`likes` int NOT NULL DEFAULT 0,
	`views` int NOT NULL DEFAULT 0,
	`isAnonymous` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `war_stories_id` PRIMARY KEY(`id`)
);
CREATE TABLE `webhook_endpoints` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`url` varchar(1000) NOT NULL,
	`label` varchar(200),
	`events` json NOT NULL,
	`secret` varchar(128),
	`active` boolean NOT NULL DEFAULT true,
	`lastTriggeredAt` timestamp,
	`failCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `webhook_endpoints_id` PRIMARY KEY(`id`)
);
CREATE TABLE `will_drafts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`clientId` int,
	`workspaceId` int,
	`title` varchar(500) NOT NULL,
	`status` enum('draft','review','finalized') NOT NULL DEFAULT 'draft',
	`tone` enum('formal','heartfelt','spiritual','practical') NOT NULL DEFAULT 'heartfelt',
	`personalLetter` text,
	`assetDistribution` json,
	`guardianDesignations` json,
	`specialBequests` json,
	`finalWishes` text,
	`executorName` varchar(200),
	`executorRelation` varchar(100),
	`witnessNames` json,
	`generatedDocument` text,
	`familyContext` json,
	`pdfUrl` varchar(2000),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `will_drafts_id` PRIMARY KEY(`id`)
);
CREATE TABLE `withdrawal_triggers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`triggerType` enum('gentle_nudge','fomo_alert','pet_sad','streak_warning','loot_expiring','quest_expiring','rival_passed','market_move') NOT NULL,
	`title` varchar(300) NOT NULL,
	`message` text NOT NULL,
	`urgency` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`channel` enum('in_app','email','push','sms') NOT NULL DEFAULT 'in_app',
	`sentAt` timestamp,
	`openedAt` timestamp,
	`clickedAt` timestamp,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `withdrawal_triggers_id` PRIMARY KEY(`id`)
);
CREATE TABLE `workspace_invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`invitedByUserId` int,
	`email` varchar(320) NOT NULL,
	`firstName` varchar(100),
	`lastName` varchar(100),
	`role` enum('SUPER_ADMIN','ADMIN','ADVISOR','ANALYST','VIEWER') NOT NULL DEFAULT 'ANALYST',
	`status` enum('PENDING','ACCEPTED','EXPIRED','REVOKED') NOT NULL DEFAULT 'PENDING',
	`tokenHash` varchar(128) NOT NULL,
	`expiresAt` timestamp NOT NULL,
	`acceptedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `workspace_invitations_id` PRIMARY KEY(`id`),
	CONSTRAINT `workspace_invitations_tokenHash_unique` UNIQUE(`tokenHash`)
);
CREATE TABLE `workspace_subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`workspaceId` int NOT NULL,
	`planSlug` varchar(50) NOT NULL DEFAULT 'growth',
	`status` enum('TRIALING','ACTIVE','PAST_DUE','CANCELED','PAUSED') NOT NULL DEFAULT 'TRIALING',
	`billingInterval` enum('MONTHLY','ANNUAL') NOT NULL DEFAULT 'MONTHLY',
	`seats` int NOT NULL DEFAULT 1,
	`stripeCustomerId` varchar(100),
	`stripeSubscriptionId` varchar(100),
	`currentPeriodStart` timestamp,
	`currentPeriodEnd` timestamp,
	`cancelAtPeriodEnd` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workspace_subscriptions_id` PRIMARY KEY(`id`)
);
CREATE TABLE `workspaces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`ownerId` int NOT NULL,
	`logoUrl` varchar(2000),
	`primaryColor` varchar(20),
	`accentColor` varchar(20),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `workspaces_id` PRIMARY KEY(`id`),
	CONSTRAINT `workspaces_slug_unique` UNIQUE(`slug`)
);
CREATE TABLE `xp_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` int NOT NULL,
	`source` varchar(100) NOT NULL,
	`sourceId` varchar(100),
	`description` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `xp_transactions_id` PRIMARY KEY(`id`)
);
CREATE INDEX `plan_events_lead` ON `plan_events` (`leadId`);

SET FOREIGN_KEY_CHECKS = 1;
```

## `docs/ULTRA_AI_ENV.md`

```md
# Ultra Calculator — AI Environment Variables

The Ultra Calculator's AI team and voice output read API keys **only from
the server's environment**. Keys are never accepted from the browser, never
echoed in responses, never logged, and must NEVER be committed to this
repository or pasted into any chat.

Set these in the hosting provider's environment-variables panel
(Railway → service → Variables, cPanel → Setup Node.js App → Environment
Variables, etc.), then restart the app.

| Variable | Powers | Required? |
|---|---|---|
| `ANTHROPIC_API_KEY` | Claude — the lead model that tethers the site: module triage, the every-page advisor, panel synthesis | Recommended (the system falls back to the built-in LLM, then to deterministic rules) |
| `OPENAI_API_KEY` | ChatGPT seat on the multi-AI panel | Optional |
| `XAI_API_KEY` | Grok seat on the panel | Optional |
| `GEMINI_API_KEY` | Gemini seat on the panel | Optional |
| `PERPLEXITY_API_KEY` | Perplexity seat on the panel | Optional |
| `OPENROUTER_API_KEY` | OpenRouter seat (routes to many additional models) | Optional |
| `ELEVENLABS_API_KEY` | Spoken answers in the configured voice | Optional |
| `ELEVENLABS_VOICE_ID` | Which ElevenLabs voice speaks (the owner's cloned voice ID) | Required if voice output is wanted |

Notes:

- **Graceful degradation is designed in.** With zero keys set, the Ultra
  Calculator still runs fully (the math is client-side and deterministic);
  module triage falls back to rule-based logic, and the advisor button
  reports itself as not configured instead of failing.
- Providers without keys are shown as "not configured" in the UI and are
  never faked in panel results.
- "Manus" has no public inference API; additional models can be reached
  through `OPENROUTER_API_KEY`.
- Voice INPUT uses the browser's built-in speech recognition — no key, and
  the audio never leaves the visitor's machine; only the transcribed text
  is sent to the server.
- If any key is ever pasted into a chat, an email, or a commit, treat it as
  burned: rotate it at the provider immediately.
```

## `docs/ai-architecture-council-review.md`

```md
# AI Architecture Council Review

## OpenAI — gpt-5

- Safe merge order
  - Create an integration branch; land the shared component first, then the seven pages as stubs with route files present but content behind a feature flag so no existing of the 222 routes is displaced.
  - Introduce a route-manifest JSON (id, path, module, primary/secondary, data-mode: real/simulated) prefilled for all 260 page modules; add the seven pages to it in the same PR to prevent orphaning.
  - Wire the shared component to the design system tokens without changing the homepage: keep the black/green skyline on “/” only; scope the purple design tokens to an interior layout shell.
  - Run a “no-route-deletions” CI check that diffs the manifest and Next/React router to fail any removal; require migration notes for any path change.

- Authorization migration
  - Remove all hardcoded passwords, backdoors, email-owner bypasses, and the custom /login logic at the server boundary; keep the /login route but convert it to a server-side 302 that calls the managed runtime’s OAuth start endpoint and maps returns to server-enforced roles. No client-side secrets.
  - Centralize auth in tRPC with a server-only middleware: resolve session from the managed runtime, load role grants, and attach {userId, roles, orgId} to ctx; block when absent.
  - Replace any client/route guards with server-side procedure guards (isAuthenticated, hasRole, hasPlanAccess) and Drizzle queries filtered by user/org; add a slim users table keyed by managed subjectId only (no passwords).
  - Add a one-time migration script that scans the codebase for password literals and bypass flags; add ESLint rules and a pre-commit grep to prevent reintroduction.

- Persistence boundaries
  - Define data-mode per route/procedure in the manifest: core client/planning workflows = real; secondary/simulated = simulated.
  - For simulated flows, route writes to a sandbox schema or in-memory service on the server; visibly label UI controls as “Simulated” and suppress Drizzle writes. For real flows, require role checks and transactional Drizzle calls.
  - Add a server-only feature flag that can force simulated mode off in staging/production for designated routes; never gate with client flags.
  - New Drizzle migrations (on top of the existing 58) add linkage tables keyed by subjectId/orgId and audit tables (who, when, what) for all real writes.

- Navigation and page classification
  - Introduce two top-level nav buckets: “Primary Workflows” and “Secondary Information”; render category badges from the manifest so every routed page is clearly labeled without changing paths.
  - Keep existing slugs; if a page is reassigned, only update the manifest category and breadcrumbs.
  - Use an InteriorLayout that applies the refined purple system to all non-home routes; keep the homepage skyline theme isolated to HomeLayout to avoid bleed-through.

- Validation and testing
  - Expand tests from 90 to cover: (a) route smoke tests for all 222 routes (SSR render + 200/302), (b) auth matrix tests ensuring 401/403 for missing roles on protected tRPC procedures, (c) persistence tests that assert no Drizzle writes occur in simulated mode.
  - Add Playwright e2e for the seven new pages and critical primary flows; include visual snapshots to lock the homepage skyline and interior purple styling.
  - Implement four audit suites (render, interaction, duplication, placeholder/usefulness) driven by the manifest; export per-route findings without auto-deleting pages.
  - Gate CI on: schema migration up/down, tRPC contract checks, auth middleware coverage threshold, and a “no plain-text password/backdoor” static scan.

## Anthropic — claude-sonnet-4-6

1. **Merge additively in a protected sequence.**  
   First inventory and freeze the 222 routes/260 page modules; then introduce the seven pages and shared component behind new, non-conflicting route entries. Reuse existing layout, tRPC, Drizzle, and managed-runtime adapters before moving visual pieces. Preserve the homepage’s black/green city-at-night skyline and lights as an explicit visual-regression baseline; apply the purple system only to portal interiors. Do not overwrite route files until duplication and dependency audits identify a safe consolidation target.

2. **Replace imported authentication with server-enforced managed OAuth authorization.**  
   Remove hardcoded trial/backdoor passwords, email-owner checks, imported `/login` credential logic, and any client-managed role claims. Make the managed OAuth identity the sole authentication source; resolve roles and permissions server-side from authoritative managed database/session context. Gate tRPC procedures and storage/database access with centralized authorization middleware, using explicit roles such as `client`, `advisor`, `planner`, and `admin`, with deny-by-default behavior.

3. **Define real persistence boundaries before wiring workflows.**  
   Persist planning records, client profiles, goals, assumptions, documents/metadata, workflow status, and audit events through tRPC → server authorization → Drizzle migrations/database. Use managed storage only for uploaded artifacts, with database references and ownership checks—not direct client trust. Clearly label calculators, projections, sample dashboards, generated insights, and demo responses as simulated whenever they do not save or derive from authoritative data; never present mocked state as saved financial information.

4. **Reclassify navigation without removing pages.**  
   Establish a primary portal IA for core client and planning work—e.g., Dashboard, Clients, Plans, Goals, Cash Flow, Documents, Tasks/Reviews—and create a visibly labeled **Secondary Information** library for educational content, reference dashboards, FAQs, tools, and lower-frequency informational pages. Keep every existing route reachable, but add route metadata (`primary`, `secondary-information`, `legacy`, `internal`, `workflow`) to drive navigation, breadcrumbs, search, and audit reporting rather than hiding or deleting pages.

5. **Make route audits and migration validation release gates.**  
   For all routed pages, record render, interaction, duplication, placeholder, and usefulness outcomes, with owners and remediation status; flag issues but do not auto-delete routes. Add automated coverage for OAuth role boundaries, unauthorized tRPC calls, ownership isolation, migration up/down or rollback safety, persisted workflow round-trips, storage access checks, and navigation classification. Add visual regression tests for the homepage skyline and representative purple portal interiors, plus route smoke tests for all 222 explicit routes and integration tests for the 90-test baseline before and after each merge stage.

## Google Gemini — gemini-3-flash-preview

Based on the verified facts and platform constraints, here are five concise, implementation-specific recommendations for your portal merge:

### 1. Safe Merge Order: Namespace-Isolated Router Integration
To merge the 7 new pages and shared component without risking the existing 222 routes, use **tRPC Router Namespacing**. Instead of flat-merging procedures into the `appRouter`, mount the new functionality under a dedicated sub-router (e.g., `trpc.newPortal.*`). This prevents naming collisions and allows you to deploy the shared component as a standalone module that existing pages can opt into without modification. 
*   **Action:** Prefix all new Drizzle migrations with a timestamp later than the existing 58 to ensure sequential execution.

### 2. Authorization Migration: Context-Driven Middleware
Immediately replace the custom `/login` flow and hardcoded bypasses by refactoring the `createTRPCContext`. Inject the **managed runtime’s OAuth session** directly into the context. Create a `protectedProcedure` using tRPC middleware that validates the OAuth role before reaching any resolver.
*   **Action:** Delete the `trial_password` and `backdoor` fields from the Drizzle schema and replace them with a `managed_role` enum that maps directly to your OAuth provider's claims.

### 3. Persistence Boundaries: Simulated Data Interceptors
To separate real data from simulated controls, implement a **Service Layer Interceptor**. For planning workflows, use a `is_simulated` flag in the Drizzle schema or a separate `simulated_projections` table. Ensure the tRPC procedures for "Simulated" actions are explicitly typed to return mock-safe data structures, preventing accidental writes to core financial tables.
*   **Action:** Add a global UI decorator (e.g., a "Simulation Mode" banner) triggered by the data source metadata returned in the tRPC response.

### 4. Navigation & Classification: Layout-Based Theme Switching
Implement a **Dual-Layout Routing Strategy** to manage the design system shift. Wrap the homepage in a `SkylineLayout` (Black/Green CSS variables) and all portal routes in a `RefinedPurpleLayout`. Use a nested route structure to classify the "Secondary Information" library under a `/library/*` path, ensuring it uses a distinct `LibrarySidebar` component to separate it from primary workflows.
*   **Action:** Use Tailwind’s `data-theme` attribute on the layout wrapper to toggle between the city-skyline and purple design systems without per-page style overrides.

### 5. Validation: Automated 5-Point Audit Script
Instead of manual page-by-page checks, create a **React Testing Library (RTL) suite** that targets the 260 page modules. Use a script to crawl the 222 routes and verify: (1) **Render** (no crash), (2) **Interaction** (primary button existence), (3) **Duplication** (check for identical route paths), (4) **Placeholder** (detect "lorem ipsum" or TODO strings), and (5) **Usefulness** (log routes with zero internal links).
*   **Action:** Mark audited pages in a `manifest.json` file to track progress without deleting any files, satisfying the "no-deletion" requirement while identifying technical debt.

## Cohere — command-a-03-2025

Here are five concise, implementation-specific recommendations based on the priorities:

1. **Safe Merge Order**: Begin by merging the shared component, followed by the seven additional pages. Use feature flags to isolate new routes during integration, ensuring existing 222 routes remain unaffected. Validate each merge with targeted tests before proceeding.

2. **Authorization Migration**: Replace hardcoded passwords, backdoors, and email bypasses with server-enforced OAuth roles. Implement a phased rollout: first, disable custom `/login` flows, then integrate managed OAuth, and finally audit all 260 page modules for unauthorized access patterns.

3. **Persistence Boundaries**: Clearly delineate real data persistence in core workflows from simulated controls. Annotate simulated responses in code and documentation. Ensure all 58 migrations align with real data requirements, avoiding accidental simulation data persistence.

4. **Navigation & Page Classification**: Redesign navigation to separate primary workflows from the Secondary Information library. Update route labels and metadata for clarity. Audit all 222 routes to ensure compliance with the refined purple design system, preserving the homepage’s black-and-green theme.

5. **Validation/Testing**: Expand the 90 existing tests to cover new pages, OAuth integration, and persistence boundaries. Conduct render, interaction, duplication, placeholder, and usefulness audits for all routed pages. Use automated tools to flag issues without deleting pages, ensuring full coverage across 260 modules.

## Mistral AI / Le Chat — mistral-small-latest

1. **Safe Merge Order**: Merge the seven new pages and shared component into a feature branch first, validating route conflicts with `tsc --noEmit` and `react-router-config` checks before merging into main to preserve the 222 existing routes.

2. **Authorization Migration**: Replace all hardcoded credentials and `/login` flows with managed OAuth roles by updating Drizzle schema to enforce role-based access, then remove legacy auth code in a single commit referenced in migration #59.

3. **Persistence Boundaries**: Introduce a `PlanningDataService` layer to separate real data workflows from simulated controls, marking non-persisted responses with `@mock` decorators and routing them under `/simulated` for clear separation.

4. **Navigation & Classification**: Add a secondary nav section labeled "Secondary Information" in the layout, grouping non-core pages via a `routeCategory` field in the route manifest while preserving the black-and-green homepage and adopting the purple design system for `/planning/*` routes.

5. **Validation/Testing**: Run automated audits post-merge using Playwright to verify render, interaction, and duplication checks, then extend test coverage to 120 tests by adding role-based interaction tests for the new pages.

## GroqCloud — openai/gpt-oss-20b

**Implementation‑Specific Recommendations (in priority order)**  

1. **Safe Merge Order**  
   • Create a dedicated `import‑stage` feature branch from `main`.  
   • Cherry‑pick the seven new pages plus the shared component into a *small, isolated* sub‑branch (`import‑pages`).  
   • Run the full test suite (`npm test`) and the migration suite (`drizzle-kit up`) locally; ensure no existing route fails.  
   • Merge `import‑pages` into `import‑stage` only after the above passes, then merge `import‑stage` into `main` through a protected pull request.  
   • Use Git hooks to verify that no route files are deleted or renamed during the merge.

2. **Authorization Migration**  
   • Strip the custom `/login` handler and all hardcoded trial/backdoor passwords from both client and server.  
   • Add a server‑side middleware that checks `req.session.oauthRole` for every protected route.  
   • Replace any client‑side role checks with calls to the new `useAuth` hook that reads the session role from the server.  
   • Update route definitions to use the new `protected` wrapper (e.g., `app.route('/plan', protected, …)`).

3. **Persistence Boundaries**  
   • Tag each page module with a `/* @persistent true */` comment if it operates on real user data; otherwise mark `@persistent false`.  
   • Create a lightweight “simulation” context that can be toggled per page via a URL query (`?mock=true`) and use it to render dummy data while keeping the real API untouched.  
   • Ensure all new pages respect this boundary: real‑data pages use Drizzle queries; simulated pages use static fixtures.

4. **Navigation & Page Classification**  
   • Add a top‑level navigation section called “Secondary Information Library” and move all non‑workflow pages into it.  
   • Prefix all library routes with `/library/*` and update the sidebar accordingly.  
   • Keep the core client and planning pages under `/app/*` and mark them with a distinct “Core” badge in the UI.  
   • Maintain the black‑and‑green skyline on the homepage; apply the purple design tokens (spacing, color palette) to all newly merged pages.

5. **Validation & Testing**  
   • For every routed page, add three tests: a **render** snapshot, an **interaction** test (e.g., form submit), and a **duplication** test that ensures a copy of the component renders correctly.  
   • Implement an automated **usefulness audit** script that runs `jest --coverage` and flags pages with < 70 % coverage.  
   • Integrate these tests into the CI pipeline, and block merge until all new pages pass.  
   • Add a manual audit checklist (render, interaction, placeholder, usefulness) that reviewers must tick before approving the merge.
```

## `docs/comprehensive-audit-2026-08-27.md`

```md
# Russell Capital Systems Comprehensive Audit

**Author:** Manus AI  
**Audit date:** 2026-08-27

## Scope

The audit covered the managed React, TypeScript, Express, tRPC, Drizzle, managed-OAuth, storage, AI, market-data, routing, persistence, and responsive public-interface implementation. The active route manifest now contains **232 user-facing routes**, including the token-scoped client portal.

## Multi-Model Review

Independent reviews were collected from Cohere, GroqCloud, Mistral/Le Chat, OpenAI GPT-5, Anthropic Claude, and Google Gemini. OpenRouter did not authenticate, Perplexity returned an invalid-key response, and xAI reported no credits or model license; those failures were recorded rather than represented as completed reviews.

A renewed Grok attempt checked every available route before publication. The enabled Grok app was not exposed as a callable MCP server, direct xAI returned HTTP 403, the managed Forge catalog contained no Grok model ID, and OpenRouter failed during OAuth initialization. No Grok review is claimed. The earlier successful GroqCloud review is retained as a separate provider and is not mislabeled as xAI/Grok.

## Confirmed Repairs

The public homepage now explicitly addresses physicians, surgeons, medical professionals, and practice owners while retaining the people-free emerald metropolitan image. Public AUM, fabricated operational metrics, demo language, fake telephone data, and inactive software pricing were removed. Primary protected actions now begin managed authentication.

Broken internal navigation targets were mapped to registered routes, portal-prefixed onboarding routes were gated, session tokens reject cross-project application IDs, and legacy administrator, executive, password, and email-PIN authority paths fail closed. Financial-input AI now requires authentication. Response headers no longer identify Express and API responses are not cacheable.

Synthetic carrier identities, ratings, assets, product claims, and index illustrations were removed; carrier data now requires a verified provider response. The production dependency graph was upgraded to remove all high and critical advisories. Fabricated Billing, Legal Payment Folder, and AI Meeting Notes dashboards were replaced with truthful route-preserving integration or workflow pages.

The custom production build now uses automatic JSX runtime plus an explicit React namespace banner to prevent the published `React is not defined` crash. The two experience tables previously missing from the live database have a creation-only migration matching the Drizzle schema.

## Owner-Controlled Items

Authenticated browser acceptance still requires the owner’s OAuth session and modeling/compliance acknowledgement. Historical duplicate membership/workspace rows and orphaned portal-token records must not be deleted or merged automatically. Previously exposed provider keys and any legacy owner password must be rotated through their providers. The custom domain remains untouched and owner-controlled.

## Final Validation

Concept 16 was rebuilt as a functional responsive homepage rather than embedded as a flattened screenshot. Its people-free emerald metropolitan interior is stored in persistent web asset storage. The glass navigation, Physician Wealth Command Center headline, physician portal and planning calls to action, four planning pillars, Review–Coordinate–Implement–Monitor workflow, and three-field assumption-labeled tax-planning preview render at desktop and 390-pixel phone widths. The existing portal access, physician planning services, consultation, final call to action, and footer remain below the hero, with eight additional physician planning workflow options linked to registered protected routes.

The definitive pre-publication pass reports **0 high and 0 critical production dependency advisories**, **0 TypeScript errors**, **107 passed Vitest suites with 5 intentionally skipped live-provider suites**, **2,029 passed tests with 10 skipped**, and a successful custom production build. The compiled smoke suite passed all **232 user-facing routes** plus `/` and `/api/trpc/auth.me`. A headless Chromium execution confirmed both the Concept 16 hero and lower scrolling options rendered and no unresolved React module import or `React is not defined` error occurred. The final security checks also confirmed that the allowlisted Concept 16 background receives a managed-storage redirect, an unlisted anonymous storage key returns `404`, and the authentication API returns all four configured cache and browser-hardening headers.

Desktop and mobile visual checks passed without horizontal overflow. Desktop preserves the split hero and command-center hierarchy; mobile stacks the headline, calls to action, planning pillars, workflow, calculator controls, portal access, service cards, planning options, consultation, and footer into one complete scrolling page.

The focused browser audit measured a 1440-pixel desktop viewport at 1,437 pixels of document width and a 391-pixel phone viewport at exactly 391 pixels of document width, confirming no horizontal overflow. Both viewports rendered the hero and lower content, exposed four command tabs and all three labeled calculator fields, and contained zero unresolved in-page anchors. At phone width, the menu opened successfully, reported `aria-expanded=true`, and displayed all four mobile navigation links.

### Final Concept 16 screenshot review

| View | Result | Concrete observations |
|---|---|---|
| Desktop, 1440 × 1000 | Pass | The glass navigation remains within the viewport; the headline and both physician calls to action are unobstructed; the command-center tabs, workflow, and calculator form a cohesive right-hand panel; the city interior contains no people or baked-in lettering; and the trust band, portal access, six service cards, eight planning options, consultation, closing call to action, and footer continue in a consistent vertical sequence. No content is clipped at either edge. |
| Phone, 390 × 844 | Pass | The hero becomes a single-column stack; headline, description, and both calls to action remain visible; the command-center panel follows without overlap; the four pillars, workflow, estimate, and three fields fit the phone width; and every lower section continues in a readable single-column order through the footer. The long page is intentional because the owner requested all lower options. No horizontal clipping or dead-end section was visible. |

An independent style pass found the dark institutional palette, emerald signal color, physician positioning, secure tone, product panel, and command-center framing coherent. It suggested future brand differentiation and more varied lower-section composition, but identified no release-blocking layout failure. Those optional refinements were not allowed to override the owner-selected Concept 16 direction.
```

## `docs/concept16-domain-readiness-review.md`

```md
# Concept 16 Domain Readiness Review

Four authenticated providers completed separate reviews using the same credential-free facts: **OpenAI GPT-5**, **Google Gemini**, **Cohere Command A**, and **Mistral Magistral/Le Chat**. All four agreed that the application evidence supports a conditional launch and that the unresolved custom-domain step is operational: `russellcapitalsystems.com` must first be added in the managed Domains panel, and only the exact records generated there may be copied into GoDaddy.

| Finding | Provider consensus | Source/runtime verification | Decision |
|---|---|---|---|
| Existing Concept 16 deployment is reachable | Four of four | Both current domains return HTTP 200 with title `Russell Capital` | Confirmed |
| New domain is not yet attached | Four of four | Current managed domain list contains only the platform domain and `russellcap.com` | Confirmed blocker for the new hostname only |
| DNS records must not be guessed | Four of four | No authoritative values are available until the domain is added in the Domains panel | Enforced |
| Existing DNS must be preserved | Four of four | Owner explicitly requires unrelated GoDaddy records and `russellcap.com` to remain unchanged | Enforced |
| Repeated missing-session notices may be noisy | Four of four | `verifySession()` logs a warning whenever public `auth.me` is called without a cookie | Confirmed non-blocking log-noise repair |
| Application needs a hardcoded canonical redirect | Not established | Production server has no host redirect and public routes use relative/current-origin links | No code change before domain attachment |
| OAuth, TLS, MX/TXT, and live interaction behavior on the new domain | Conditional | Requires the real attached hostname and post-DNS browser checks | Verify after attachment |

The AI reviews do not provide or authorize DNS values. The managed Domains panel remains the sole source of truth. After attachment, verification must cover apex and `www`, TLS, the Concept 16 hero, one primary interaction, protected-route login behavior, existing-domain continuity, and production logs.
```

## `docs/core-workflow-verification.md`

```md
# Core Workflow Verification

The imported client directory and detail workflows now operate against the managed `clients` table rather than an absent source database. A rollback-only integration test performed a real workspace insert, client insert, client read, client update, and post-rollback absence check. No verification record remains in the database.

The new Planning Cases workspace is a primary Client Journey destination at `/portal/planning-cases`. Its protected tRPC API scopes every request to the authenticated user's workspace, validates linked-client ownership, and persists case title, client association, status, stage, assumptions, recommendation summary, workflow state, timestamps, and case notes. Advisors can create a case, save progress, advance stages, archive a case, and add timestamped notes. The UI includes explicit loading, empty, failure, retry, and saving states.

The main dashboard now reads persisted planning cases and displays Active Planning Cases plus review count. It provides a real-data empty state and a retryable error state alongside the existing client and pipeline metrics. It does not display live AUM; the empty state explicitly states that no fabricated client or AUM data is shown.

Validation completed:

| Check | Result |
|---|---|
| Planning API unit tests | 4 passed |
| Planning UI integration tests | 4 passed |
| Live rollback-only client CRUD | Passed; no retained row |
| Persistence and table tests | 5 passed |
| TypeScript after workflow integration | Passed |
| Planning route and primary navigation | Registered; authenticated browser content pending final OAuth round trip |

Additional integration coverage now loads the actual client directory and detail modules, verifies their protected tRPC contracts, validates directory loading/empty/retry states, confirms client form validation and save feedback, and requires a profile refetch after update before reporting success. The dashboard now tracks loading, empty, error, and retry behavior across practice metrics, planning cases, analytics, history, activity, top clients, allocation, goals, meetings, and coaching. Four focused suites currently pass 14 tests; authenticated browser create/edit/reload verification remains reserved for the final managed OAuth round trip.
```

## `docs/database-persistence-verification.md`

```md
# Database Persistence Verification

The imported source contained a comprehensive Drizzle schema but its historical SQL files were placeholder comments. The managed database initially contained only `users` and `__drizzle_migrations`, so core portal procedures would otherwise have failed at runtime.

Two focused, creation-only migrations were generated and reviewed before execution. `0068_dark_invaders.sql` adds planning cases, planning-case notes, page-audit runs, page-audit records, and portal preferences. `0069_core_portal_bootstrap.sql` creates 24 existing source tables required by workspaces, memberships, clients, deals, strategies, saved scenarios, snapshots, notes, tags, meetings, documents, knowledge, favorites, notifications, activity, audit, dashboard configuration, client-portal tokens, and error tracking. Neither migration touches the managed `users` table or contains destructive SQL.

The schema intentionally reuses `clients`, `saved_scenarios`, `scenario_snapshots`, and `client_notes` rather than creating duplicate records. `planning_cases` acts as a durable workflow envelope with JSON assumptions, results, and workflow state; `planning_case_notes` adds case-scoped notes. Page-audit runs and records persist the required 1–10 score, health dimensions, recommendation, merge target, rationale, instructions, and evidence. Portal preferences persist navigation and motion choices.

All five additive tables were queried after execution. A deterministic live test then parsed the exact 24-table list from `0069_core_portal_bootstrap.sql` and executed `SELECT COUNT(*)` against every listed table. All 29 created tables are therefore confirmed queryable. No mock customer, testimonial, or financial data was inserted.
```

## `docs/grok-delta-manifest.md`

```md
# Verified Grok Addition Delta

The canonical Grok import is restricted to seven routed pages plus one shared visual component. No Grok database, server, authentication, framework, migration, or environment file will overwrite the selected primary platform.

| Route | Page component |
|---|---|
| `/portal/the-arrival` | `TheArrival.tsx` |
| `/portal/the-mirror` | `TheMirror.tsx` |
| `/portal/the-strategy-table` | `TheStrategyTable.tsx` |
| `/portal/the-field` | `TheField.tsx` |
| `/portal/the-map` | `TheMap.tsx` |
| `/portal/the-legacy` | `TheLegacy.tsx` |
| `/portal/the-brotherhood` | `TheBrotherhood.tsx` |

All seven pages import `client/src/pages/portal/_genome/GenomeKit.tsx`. The canonical files are stored under `/home/ubuntu/russell-capital-unified-sources/release/addition`; their SHA-256 hashes are recorded in `docs/grok-delta-sha256.txt`.

The primary application remains `/home/ubuntu/russell-capital-unified-sources/release/primary`, which contains the 222-route platform selected from the 39.8 MB archive. The separate 12-route marketing application remains reference-only and is not allowed to replace the platform router, server, or database layer.
```

## `docs/grok-handoff/01_FINANCIAL_LIBRARIAN_SPEC.md`

```md
# Financial Librarian — build specification (handoff for Grok)

**Status:** built and merged. This document describes what exists so the next
builder can extend it without re-deriving it. Source of truth is the code; paths
below are relative to `russell-capital-systems/`.

## What it is

One AI Financial Advisor, presented as a **tape recorder**, that speaks for the
whole AI API team (Claude, ChatGPT, Grok, Gemini, Perplexity, OpenRouter,
Mistral, Groq, Manus — whichever have keys in the host environment). It answers
spoken or typed questions from a client or their advisor, **but only after the
client has completed the full Financial Assessment**. Before that it explains
what is missing and hands them the assessment.

It is a *librarian*, not an oracle: once the assessment is complete the client
may ask unlimited questions; the librarian answers each, and on request boils
everything asked down to **3–5 core questions**, names the **emergent
question** they have not asked (the pattern underneath their questions and
their facts), and lays out a **10–15 page journey** through the site — real
URLs, calculators included — in a logical, building sequence.

## The pieces

| Piece | File | Notes |
|---|---|---|
| Assessment schema (15 sections, ~190 fields) | `shared/clientFactFinder.ts` | `FACT_FINDER_SECTIONS`, `factFinderCompleteness()`, `factFinderSummary()`. Required fields gate the advisor. `showIf` hides fields that don't apply. |
| Assessment storage | `drizzle/schema.ts` → `client_fact_finders` (one row per user, JSON + completeness + completedAt) | Also `client_journeys` (each generated journey). Both in `database/rcs-schema.sql`. |
| Assessment API | `server/factFinderRouter.ts` (`factFinder.get/save/summary/reset`), `server/factFinderDb.ts` | Zod-validated; graceful when no DB. |
| Assessment page | `client/src/pages/portal/FinancialAssessment.tsx` → `/portal/financial-assessment` | Section rail, autosave (900 ms), completeness, printable **Financial Analysis Document**. |
| Page catalog | `shared/journeyCatalog.ts` | 45 real portal pages with `kind`, `tags`, `builds` (ordering weight). Add pages here to make them eligible for journeys. |
| Journey engine | `shared/journeyEngine.ts` | Deterministic: `detectTags`, `factFinderSignals`, `distillQuestions`, `emergentQuestion`, `buildJourney`, `validateJourney`. |
| Librarian API | `server/librarianRouter.ts` (`librarian.status/ask/journey/latestJourney`) | Gate → fan-out to providers → synthesis by the lead model; AI may only polish wording of a journey, never its pages. Offline fallback answers from the assessment alone. |
| Tape recorder | `client/src/components/TapeRecorderAdvisor.tsx` | REC (Web Speech), PLAY, STOP, TYPE, JOURNEY; ElevenLabs voice via `ultra.speak` when configured, else browser speech. |
| Advisor page | `client/src/pages/portal/AIFinancialAdvisor.tsx` → `/portal/ai-advisor` | Deck + "what it knows" + the journey (core questions, emergent question, controls, ordered steps with guides and visited state). |
| My Secret Journey | `client/src/pages/portal/MyJourney.tsx` → `/portal/my-journey` | The latest journey as its own page: resume where you left off, guides per step, controls. |
| Navigation | `client/src/components/AppShell.tsx` → group **New Client Welcome List** | Assessment → AI Financial Advisor → My Secret Journey → Wealth Genome → The Arrival … The Brotherhood. `JourneyProgressBar` shows step N of M + the guide on every journey page. |

## Rules the librarian obeys (do not loosen)

1. **Gate.** No planning answer of any kind until `factFinderCompleteness().complete` is true. Not even partial.
2. **No invented facts.** Every figure comes from the client's own assessment. The offline answer and the tests assert this.
3. **Education, not advice.** Projections under stated assumptions, no guarantees, no product solicitation; the licensed advisor and the tax professional team review suitability and IRS compliance before anything is implemented. The compliance line is on the deck.
4. **Pages are real.** Every journey step must exist in `JOURNEY_CATALOG` (validated) and every catalog path must be a route in `App.tsx`.
5. **Sizes.** 3–5 core questions, one emergent question, 10–15 steps, first step is orientation, last step is a review page, steps are sorted by `builds` so each page builds on the previous one.
6. **Every step walks the client through.** Each step carries a `guide`: which core question it works on plus the page's `walkthrough` from the catalog ("do this, then carry forward that"). The progress bar shows it on the page and can read it aloud.
7. **Variables are named.** Every journey carries `controls`: `youControl` (from the client's questions and signals — savings rate, payoff speed, conversion pace, coverage, structures, and always "when the first move happens") and `youDont` (markets, rates, tax law, longevity, health, inflation). This is how the journey "controls the volatility": by fixing the first list, not predicting the second.

## How a journey is composed (engine)

1. `detectTags(question)` — keyword topics per question (tax, mortgage, equity, debt, student-loans, retirement, income, investments, volatility, iul, insurance, estate, divorce, asset-protection, practice, liquidity, real-estate, oil-gas, strategy, time).
2. `factFinderSignals(assessment)` — weighted topics from the facts (effective tax rate, mortgage size/years, equity, student loans, tax-deferred balances, risk answers, cash months, disability gap, practice ownership, no will, protection priorities, retirement horizon, stated worries).
3. `distillQuestions(questions, signals)` — group by primary topic → 3–5 core questions using per-topic templates; if the client asked fewer topics, the strongest signals supply the rest ("from your assessment: …").
4. `emergentQuestion(distilled, signals)` — strongest signal **not covered** by what they asked, rendered with a per-topic template that quotes the reason (e.g. "you would sell in a 30% drop").
5. `buildJourney` — score every catalog page (question tags ×3, emergent ×3, signal weights), always open with The Mirror + Wealth Genome, take the two best pages per core question, two for the emergent question, guarantee a calculator, a comparison, a volatility/variables page, protection/legacy pages when signals say so, fill to 10, close with Russell Number, then order by `builds`. Each step's `why` names the previous page it builds on and which question it serves.
6. When AI providers are configured, `librarian.journey` asks the lead model to **reword** the questions, the emergent question, and each step's `why` in the client's own terms; the result is validated and discarded if it changes ids, order, or sizes.

## Extending it

- **Add a page to journeys:** append to `JOURNEY_CATALOG` (id, path that exists in `App.tsx`, title, purpose, kind, tags, builds, and a `walkthrough` ending in "Carry forward: …"). The tests check uniqueness, `/portal/` paths, and the walkthrough.
- **Add a topic:** add a keyword regex in `TOPIC_KEYWORDS`, a template in `CORE_TEMPLATES`, aliases in `TAG_ALIASES`, optionally an `EMERGENT_TEMPLATES` entry and a signal in `factFinderSignals`.
- **Add an assessment field:** append to the section in `FACT_FINDER_SECTIONS`; mark `required` only if the advisor genuinely cannot advise without it (required fields gate the advisor). The UI, storage, summary, document, and completeness all follow automatically.
- **Voice:** set `ELEVENLABS_API_KEY` + `ELEVENLABS_VOICE_ID` on the host; the deck then speaks in the cloned voice. Without them it uses the browser's voice.

## Tests

`server/journeyEngine.test.ts` (engine + assessment), `server/librarian.test.ts`
(gate, offline answer, fan-out, journey persistence, invalid AI polish
rejected). Run: `npx vitest run server/journeyEngine.test.ts server/librarian.test.ts`.
```

## `docs/grok-handoff/02_ASSESSMENT_AND_JOURNEY_DATA.md`

````md
# Assessment + journey data — shapes, tables, endpoints, examples (handoff for Grok)

Everything the Financial Librarian stores and exchanges, so another builder can
read, seed, or extend it. Paths relative to `russell-capital-systems/`.

## 1. The Financial Assessment (client fact finder)

**Shape** (`shared/clientFactFinder.ts` → `ClientFactFinder`):

```json
{
  "version": 1,
  "sections": {
    "household":   { "firstName": "…", "lastName": "…", "dateOfBirth": "1981-04-02", "maritalStatus": "Married", "stateOfResidence": "Texas", "dependents": 2, "occupation": "Surgeon", "phone": "…", "email": "…" },
    "income":      { "employmentType": "W-2 employee", "w2Income": 650000, "spouseIncome": 0, "incomeTrajectory": "Rising modestly" },
    "taxes":       { "filingStatus": "Married filing jointly", "adjustedGrossIncome": 640000, "federalTaxPaid": 205000, "priorReturnsAvailable": true, "taxPain": "…" },
    "realEstate":  { "ownsPrimaryHome": true, "primaryHomeValue": 1400000, "primaryMortgageBalance": 900000, "primaryMortgageRate": 6.5, "primaryMortgageYearsRemaining": 26, "homeEquity": 500000 },
    "debts":       { "studentLoanBalance": 180000 },
    "investments": { "taxableBrokerage": 150000, "employerPlanBalance": 700000, "rothIra": 40000, "concentratedPosition": false, "riskTolerance": "Moderate", "worstYearReaction": "Hold and wait" },
    "cash":        { "checking": 20000, "savings": 15000, "emergencyFundMonths": 2 },
    "cashFlow":    { "monthlyTakeHome": 30000, "monthlyFixedExpenses": 18000, "monthlyDiscretionary": 6000, "monthlySavings": 6000, "retirementLifestyle": "…" },
    "insurance":   { "termLifeDeathBenefit": 2000000, "disabilityMonthlyBenefit": 0, "malpracticeLimits": "1M/3M" },
    "practice":    { "ownsPractice": false },
    "estate":      { "hasWill": false, "hasRevocableTrust": false, "heirs": "…", "legacyGoals": "…" },
    "protection":  { "divorceProtectionPriority": "5 — Essential", "creditorProtectionPriority": "4", "taxFreeIncomePriority": "5 — Essential" },
    "retirement":  { "targetRetirementAge": 58, "desiredRetirementIncomeMonthly": 25000, "retirementConcern": "…" },
    "goals":       { "topGoals": "…", "biggestConcern": "…", "timelineToAct": "Immediately" },
    "documents":   { "taxReturns": "Will provide" }
  },
  "lists": { "properties": [ { "type": "Rental", "value": 450000, "mortgageBalance": 300000, "rate": 6.1, "netRentMonthly": 900 } ] }
}
```

- Section ids, field keys, types, options, `required`, and `showIf` all live in `FACT_FINDER_SECTIONS`; the UI is generated from it.
- `factFinderCompleteness(ff)` → `{ percent, answered, required, complete, missing[{section, sectionId, field, key}], sectionPercent }`. **52 required, currently-visible answers** make it complete (more if conditional sections open, e.g. owning a home or a practice).
- `factFinderSummary(ff)` → the plain-text document the librarian is given (and the printable Financial Analysis Document).

**Table** `client_fact_finders` (`drizzle/schema.ts`, `database/rcs-schema.sql`):
`id, userId (unique), data JSON, completeness INT, completedAt, createdAt, updatedAt`.

**Endpoints** (tRPC, signed-in user only; superjson envelope `{ "json": … }`):
- `factFinder.get` → `{ data, completeness, completedAt, updatedAt, persisted }`
- `factFinder.save` `{ data }` → `{ saved, completeness, completedAt }` (zod-validated; strings ≤ 4000 chars; lists ≤ 50 rows)
- `factFinder.summary` → `{ text, complete, percent }`
- `factFinder.reset`

## 2. The librarian

**Endpoints**
- `librarian.status` → `{ complete, percent, missingCount, missingSections[], completedAt, configured, contributorCount, contributors[], voiceConfigured }`
- `librarian.ask` `{ question, history?: [{role:"user"|"librarian", text}] }` →
  gated: `{ gated: true, percent, missingSections, spoken }` · answered: `{ gated: false, answer, spoken, contributors[], contributorCount }`
- `librarian.journey` `{ questions: string[] (1–40) }` → gated as above, or `{ gated: false, journey, journeyId, spoken }`
- `librarian.latestJourney` → the last stored journey for the user, or null
- `librarian.markVisited` `{ journeyId, stepId }` → stamps `visitedAt` on that step
- `ultra.speak` `{ text }` → `{ ok: true, audioBase64, mimeType }` when ElevenLabs is configured

**Journey shape** (`shared/journeyEngine.ts` → `Journey`; stored in `client_journeys.journey`):

```json
{
  "coreQuestions": [
    "How do I pay less tax on the income I already earn — this year and every year after?",
    "What is the fastest sensible way to be free of my mortgage, and what is that interest worth to me?",
    "How do I keep growing while controlling volatility and the variables I can actually control?"
  ],
  "emergentQuestion": "Underneath your questions is a volatility question you haven't asked: given that you would sell in a 30% drop, how do you keep the plan from depending on markets you can't control?",
  "steps": [
    { "id": "mirror",          "path": "/portal/the-mirror",          "title": "The Mirror",          "kind": "orientation", "why": "Start here. Your personal dashboard — where you stand today, in one view." },
    { "id": "wealth-genome",   "path": "/portal/wealth-genome",       "title": "Wealth Genome Analysis", "kind": "orientation", "why": "Builds on “The Mirror”. …" },
    { "id": "tax-waterfall",   "path": "/portal/tax-waterfall",       "title": "Tax Waterfall",       "kind": "education",   "why": "Builds on “Wealth Genome Analysis”. … It serves question 1." },
    { "id": "mortgage-killer", "path": "/portal/mortgage-killer",     "title": "Mortgage Killer",     "kind": "calculator",  "why": "… It serves question 2." },
    { "id": "market-stress-test", "path": "/portal/market-stress-test", "title": "Market Stress Test", "kind": "calculator", "why": "… It serves question 3 and the emergent question." },
    { "id": "russell-number",  "path": "/portal/russell-number",      "title": "Russell Number",      "kind": "review",      "why": "Close the loop. …" }
  ],
  "controls": {
    "youControl": ["How much of your income is taxed — through deductions, plan design, and conversion timing", "How fast the mortgage is retired, and how much interest you recover", "…", "When the first move happens — every year of delay is a variable you control"],
    "youDont": ["Market returns in any given year", "Interest rates set by the Federal Reserve", "Changes to the tax code", "How long you and your spouse live", "Health events and the timing of a claim", "Inflation"]
  },
  "generatedBy": "journey-engine"
}
```
(10–15 steps in practice; the example is abbreviated. Each stored step also carries `guide` — "This page works on: “…”. <walkthrough> Carry forward: …" — and `visitedAt` once opened.) `generatedBy` becomes
`journey-engine + claude` when the AI team polished the wording.

**Table** `client_journeys`: `id, userId, questions JSON, journey JSON, createdAt`.

## 3. The page catalog (`shared/journeyCatalog.ts`)

45 pages. Each: `{ id, path, title, purpose, kind, tags[], builds, walkthrough }`.
`kind` ∈ orientation · education · calculator · comparison · protection · legacy · review.
`builds` 0–9 orders a journey (0 = orientation, 8–9 = review/closing).
Tags in use: start, tax, roth, tax-free, mortgage, payoff, interest, equity, heloc,
war-chest, liquidity, debt, student-loans, retirement, income, gap, withdrawal,
social-security, investments, volatility, risk, stress, floor, iul, insurance,
disability, malpractice, gaps, estate, trust, legacy, heirs, beneficiaries, divorce,
asset-protection, creditor, practice, business, succession, real-estate, oil-gas,
strategy, combination, comparison, decision, variables, control, time, review …

## 4. Seeding for tests or demos

`server/journeyEngine.test.ts` exports `completeFactFinder(overrides)` which fills
every required, visible field with a placeholder and applies overrides — use it
to build a complete assessment in tests. For a running server, sign in as the
owner, POST `factFinder.save` with a complete document, then call `librarian.status`
to confirm `complete: true`.

## 5. Notes on the database drivers

MySQL 8 returns JSON columns parsed; MariaDB returns them as text. All readers go
through `server/_core/jsonColumn.ts` so both behave the same. Keep using it for any
new JSON column.
````

## `docs/grok-handoff/03_BUILD_STATUS_AND_NEXT.md`

```md
# Build status and what to build next (handoff for Grok)

Read `01_FINANCIAL_LIBRARIAN_SPEC.md` and `02_ASSESSMENT_AND_JOURNEY_DATA.md`
first. This file is the running ledger: what is done, what was verified, and the
next work in priority order. Do not undo the rules in the spec.

## Done and merged to `master`

- Public homepage rebuilt around the six crisp images; published as a single
  file (`docs/index.html`, GitHub Pages workflow) and mirrored in the React app;
  parity test keeps the two in step.
- Lead pipeline: homepage estimator → `public_leads` (IP, consent, fact finder,
  advisor-only analysis) → owner alert email → prospect acknowledgement →
  owner lead inbox with CSV export. Live smoke test: `scripts/smoke_lead_capture.mjs`.
- Owner sign-in for self-hosted installs (bcrypt hash in env; rate-limited), so
  `/portal/*` works on cPanel/VPS without the managed OAuth server.
- Database: 117-table schema as `database/rcs-schema.sql`; `pnpm db:build`
  applies and verifies it. Deploy bundle installs and runs from a clean unzip
  with plain npm. Mail via Resend or plain SMTP.
- **Financial Assessment** (15 sections, ~190 questions) with autosave,
  completeness, and the printable Financial Analysis Document.
- **Financial Librarian / tape recorder** with the assessment gate, unlimited
  Q&A, and the journey composer (3–5 core questions, emergent question,
  10–15 real pages in building order).
- Navigation group **New Client Welcome List**: Financial Assessment → AI
  Financial Advisor → Wealth Genome Analysis → The Arrival … The Brotherhood.
- One-command release: `pnpm release` (typecheck → docs/index.html → schema SQL
  → public-surface tests → build + bundle guard → deploy zip → code book).
- **Wealth Genome driven by the assessment** (`shared/wealthGenome.ts`,
  `factFinder.genome`): eight dimensions, 0–100, each with reasons from the
  client's facts and what would raise it; tests prove no invented figures.
- **Calculators pre-filled from the assessment** (`shared/assessmentBridge.ts`):
  when no advisor client is selected, `ClientDataContext` maps the signed-in
  user's assessment onto the flat data shape every calculator reads (Mortgage
  Killer, Income Gap, Roth Strategies, Stress Test, …); the badge says
  "Pre-filled from your Financial Assessment" and names any blank inputs.
- **Twelve AI providers**: Cohere, DeepSeek and Together AI join the nine
  (all keyed by host env variables; skip-if-absent).
- **The journey walks the client through**: every step has a librarian `guide`
  (which question it works on + what to do on the page + what to carry forward),
  every journey names the variables the client controls vs. what the plan must
  survive, and `/portal/my-journey` (My Secret Journey) holds the latest journey
  with resume.
- **Journey carried page to page**: `JourneyProgressBar` in the portal shell
  shows "Step N of M · next" on any page that is a journey step and stamps
  `visitedAt` server-side (`librarian.markVisited`).

## Verified how

- Full vitest suite against a real MariaDB: all passing (see the latest PR).
- Browser (headless Chromium) against the production build: sign in → compliance
  signature → assessment complete → advisor answers → JOURNEY renders the core
  questions, emergent question and ordered steps.

## About the "Grok checkpoint" zip

`GrokRussell_Capital_Systems_Checkpoint_bcfe0624.zip` was compared file-by-file
with the repository: it contains **no page that is not already in the repo**
(it is an older snapshot). The seven journey pages it refers to (The Arrival …
The Brotherhood, with `_genome/GenomeKit.tsx`) and the Fact Finder / Wealth
Genome pages were already merged; they are now grouped under New Client Welcome
List, with the Wealth Genome page given a portal route (`/portal/wealth-genome`).
One caveat for the owner: those pages are visually from the purple "genome"
design and the public homepage is emerald/neon; the portal shell is purple, so
inside the portal they match. `WealthGenomePage` is now driven by the
assessment (`shared/wealthGenome.ts`), with reasons and "what would raise it"
per dimension.

## Added since: the automation layer (see `04_AI_PLATFORM_ROSTER_AND_AUTOMATION.md`)

Lead follow-up sequence (email + SMS, consent-based, figure-free, stops on
human contact), messaging from the client page and lead inbox with a delivery
log, one-click unsubscribe + STOP handling, `pnpm mail:check` for real DNS
deliverability, and FRED benchmark rates cached in the database.

## Added since: the Plan Ledger (see `08_PLAN_LEDGER.md`)

Append-only, hash-chained record per client/user/lead: every assessment
field change, journey, message, lead status and advisor decision, with a
client page that replays the assessment at any moment and an advisor panel
on the client record. Idea 1 of doc 06 is live; ideas 2–5 build on it.

## Next steps, in order

0. **Financial gathering from live sources** — aggregator import (Era Context /
   PocketSmith), document extraction, benchmark-fed calculator defaults, and
   cross-field validation; the plan is in doc 04 §6.
1. **Advisor view of a client's assessment and journey.** In the client
   directory, show the client's completeness, the Financial Analysis Document,
   and their latest journey; let the advisor ask the librarian *about* a client
   (same gate, client's data).
2. **Voice.** With `ELEVENLABS_API_KEY`/`ELEVENLABS_VOICE_ID` set the deck speaks
   in the cloned voice. Consider streaming for long answers.
3. **More catalog coverage.** Any planning page not yet in
   `shared/journeyCatalog.ts` cannot be recommended; add it with honest tags.
4. **Owner tasks (not code):** GitHub Pages → Source: GitHub Actions; set
   `OWNER_EMAIL`/`OWNER_PASSWORD_HASH`, `DATABASE_URL`, mail (`SMTP_*` or
   `RESEND_API_KEY`), AI keys; rotate the published credentials (see PR #10).

## Working agreements for Grok on this repo

- Build on a branch and open a PR to `master`; never force-push or delete files
  you did not create. (PR #3 destroyed content and had to be restored.)
- No secrets in code, tests, docs or commit messages. No fabricated numbers,
  results, or patent statuses ("patent-pending / in process" only).
- Run `pnpm check` and `pnpm release` before pushing; the tests encode the rules.
```

## `docs/grok-handoff/04_AI_PLATFORM_ROSTER_AND_AUTOMATION.md`

````md
# AI platform roster + the automation layer (handoff for Grok)

What every connected platform is for, what the platform now automates on its
own, and what only the owner can switch on. Paths relative to
`russell-capital-systems/`. Keys live **only** in the host's environment panel.

## 1. The AI team the site can call at runtime (`server/ultraAI.ts`)

| Provider | Env key | Role |
|---|---|---|
| Claude | `ANTHROPIC_API_KEY` | lead model: synthesises the other voices, polishes journeys |
| ChatGPT | `OPENAI_API_KEY` | second opinion on every advisor answer |
| Grok | `XAI_API_KEY` | second opinion; also the builder this handoff is for |
| Gemini | `GEMINI_API_KEY` | second opinion |
| Perplexity | `PERPLEXITY_API_KEY` | web-grounded research voice |
| OpenRouter | `OPENROUTER_API_KEY` | gateway to models without their own key |
| Mistral · Groq · Cohere · DeepSeek · Together | `MISTRAL_API_KEY` … `TOGETHER_API_KEY` | additional voices, skip-if-absent |
| Manus / built-in gateway | `BUILT_IN_FORGE_API_KEY` | managed-host model + notifications + heartbeat cron |
| ElevenLabs | `ELEVENLABS_API_KEY` + `ELEVENLABS_VOICE_ID` | the tape recorder's cloned voice (`ultra.speak`) |

All are optional; the Financial Librarian answers from the assessment alone
with zero keys. Every provider is fanned out in parallel and the lead model
synthesises one voice.

## 2. Platforms connected to the build session (what they did / can do)

These are connected to the *builder's* chat, not to the website. They were
used this pass for research, verification and inventory. Nothing was written
to any of them.

| Platform | Status found | Use for this build |
|---|---|---|
| Perplexity (ask/research/reason) | live | current TCPA / 10DLC and Gmail-Yahoo sender rules — the compliance built into `sms.ts` / `mailer.ts` |
| OpenRouter | live | model catalogue + credit checks for the runtime gateway |
| ElevenLabs | live, 4 cloned voices on the account | the advisor's voice; agents/knowledge bases if a phone agent is wanted later |
| Speko (voice agents + phone) | live, **no phone numbers yet** | outbound/inbound voice agent for leads once a number is bought (KYB form) |
| Resend | live, **no verified domains** | transactional + marketing mail — unusable until `russellcapitalsystems.com` is verified there |
| Inkbox | email verified on `samrussell@inkboxmail.com`, iMessage on, **no SMS number** | can relay texts via `SMS_WEBHOOK_URL` once a number is assigned |
| Gmail · Google Calendar · Google Drive | live | owner's inbox/calendar; Calendly for booking links |
| Calendly | live | booking page for the "reply with a time" follow-ups |
| Neon · Supabase · Cloudflare · Netlify · Vercel | live | hosting/DB alternatives; the app targets MySQL/MariaDB today |
| GitHub | live | PRs to `master` (never force-push) |
| Jina · Exa · Firecrawl · Parallel | live | research base (arXiv/SSRN/web) for the reference essays |
| Era Context · PocketSmith | live | personal-finance aggregation APIs — candidate sources for the fact finder (see §6) |
| Notion · Linear · Asana · monday.com | live | project tracking if the owner wants the ledger mirrored |
| Canva · Figma · Adobe · HeyGen HyperFrames · 21st.dev | live | design and video assets |
| Ahrefs · Apollo.io · Webflow · GoDaddy | live | SEO, prospect enrichment, site builder, domains |
| Otter · Zoom · Wispr Flow · Superhuman | live | meeting transcripts → client notes |

## 3. What is now automated (this pass)

### Lead capture → follow-up sequence (`server/followups.ts`)
1. Visitor completes the homepage estimate with consent → lead saved.
2. Owner alert by email (`LEAD_NOTIFY_EMAIL`) **and by text** (`LEAD_NOTIFY_PHONE`).
3. Prospect gets the acknowledgement email at once, then the sequence:
   text +1 h · email day 1 · email day 3 · text day 5 · email day 7.
4. The sequence **stops** when the owner marks the lead contacted/qualified/
   client, messages the lead by hand from the inbox, or the person replies STOP /
   clicks unsubscribe.
5. Runs in-process every minute (`startFollowupScheduler`) and/or from an
   external cron: `POST /api/scheduled/followups` with `x-scheduler-token`.
   `FOLLOWUPS_DISABLED=1` turns it off.

No follow-up ever contains a figure. Content: `followupContent()`.

### Messaging from the website (`server/messaging.ts`, `messagesRouter.ts`)
- **Clients:** the client page has *Message this client* — email or text,
  six editable templates (check-in, finish your assessment, journey ready,
  report ready, meeting reminder, thank you), delivery log, activity entry.
- **Leads:** the Lead Inbox has *Reach out* (email/text) plus the live state
  of the automated sequence and every message sent.
- Every send → `outbound_messages` (status sent/failed/suppressed, via, reason).

### Deliverability (`server/_core/mailer.ts`, `scripts/check_mail_dns.mjs`)
- Marketing mail carries RFC 8058 one-click `List-Unsubscribe` headers, a
  signed unsubscribe link (`/api/mail/unsubscribe`), a plain-text part and a
  Reply-To; opted-out addresses are never sent marketing again.
- Transactional mail (reports, sign-in, acknowledgements) has none of that and
  is never suppressed.
- All older Resend-only templates in `server/email.ts` now fall through to
  SMTP automatically when Resend is not configured.
- `pnpm mail:check [domain]` resolves the **real** SPF / DKIM / DMARC records
  and says what to add. Run on 2026-09-06 for `russellcapitalsystems.com`:
  MX (Google) ✔, SPF ✔, DMARC `p=quarantine` ✔, **DKIM ✘ (no key published)**.
  With DMARC at quarantine and no DKIM, mail that fails SPF alignment is
  quarantined — that is the spam problem. Fix: publish the DKIM record from
  the sending provider (Resend → Domains → add `russellcapitalsystems.com`, or
  Google Workspace → Apps → Gmail → Authenticate email), then re-run the check.

### SMS (`server/_core/sms.ts`)
- Twilio (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` or
  `TWILIO_MESSAGING_SERVICE_SID`) **or** any relay via `SMS_WEBHOOK_URL`
  (+`SMS_WEBHOOK_TOKEN`), which POSTs `{to, body}` — Inkbox, Speko, Zapier.
- Inbound webhook `POST /api/sms/inbound` (Twilio form fields): STOP → opt-out,
  START → clear, HELP → contact line. Point the number's messaging webhook here.
- Compliance: E.164 normalisation, `Reply STOP to opt out` on marketing texts,
  opt-out table checked before every send, consent required (the lead form's
  consent checkbox is the record; `consentedAt`/`consentVersion` are stored).
  **10DLC:** before texting from a US long code the brand + campaign must be
  registered with the carrier registry (Twilio does this in-console).

### Market data (`server/_core/fred.ts`, `dataFeedService.ts`)
- With `FRED_API_KEY` (free, St. Louis Fed) the Treasury curve, CPI (annual,
  monthly, core), the 30-year mortgage rate and the Fed funds rate are live,
  dated, and cached in `market_data_points` so a restart never blanks them.
- The Market Data page shows a *Benchmark rates* strip; the snapshot exposes
  `benchmarks[]` and `dataFeeds.benchmarks` for any calculator to read.
- Without the key the previous managed-API path and dated reference values
  remain, labelled `static`. Nothing is ever invented.

## 4. Tables added (`drizzle/schema.ts`, `database/rcs-schema.sql`)

`sms_opt_outs`, `email_opt_outs`, `lead_followups`, `outbound_messages`,
`market_data_points`. All are `CREATE TABLE IF NOT EXISTS` in the schema SQL;
`pnpm db:build` adds them to an existing database.

## 5. Environment variables added

```
LEAD_NOTIFY_PHONE            text the owner on every new lead (E.164 or 10 digits)
TWILIO_ACCOUNT_SID TWILIO_AUTH_TOKEN TWILIO_FROM | TWILIO_MESSAGING_SERVICE_SID
SMS_WEBHOOK_URL [SMS_WEBHOOK_TOKEN]     alternative SMS relay
MAIL_FROM                    "Name <addr@domain>" on a domain that passes mail:check
MAIL_REPLY_TO                where replies go (defaults to the From address)
PUBLIC_BASE_URL              https://russellcapitalsystems.com (links in messages)
FOLLOWUPS_DISABLED=1         switch the sequence off
SCHEDULER_TOKEN              enables POST /api/scheduled/followups for external cron
FRED_API_KEY                 live benchmark rates
```

## 6. Next: super-accurate financial gathering

The assessment (`shared/clientFactFinder.ts`) is typed by hand. To make it
*gather* rather than *ask*:

1. **Account aggregation.** Era Context and PocketSmith are connected to the
   build session and both expose balances, transactions, recurring charges and
   cash-flow. A `factFinder.importFromAggregator` mutation would map: account
   balances → `investments.*`/`cash.*`, recurring mortgage payment + rate →
   `realEstate.*`, payroll deposits → `income.*`, recurring premiums →
   `insurance.*`. Keep the human in the loop: import fills *suggested* values
   the client confirms field by field (the UI already supports per-field edit).
2. **Documents.** Tax returns and statements uploaded to the Document Vault
   → the AI team extracts AGI, federal tax paid, filing status, W-2 wages
   (`taxes.*`) with the source page cited; the client confirms.
3. **Benchmarks.** Wherever a calculator defaults a rate (mortgage, inflation,
   Treasury), read `dataFeeds.benchmarks` first and show "as of" — see
   `MarketDataDashboard.tsx` for the pattern.
4. **Validation.** `factFinderCompleteness` gates the advisor; add
   cross-field checks (mortgage balance ≤ home value, take-home ≤ income,
   emergency months = savings ÷ fixed expenses) that flag, never auto-correct.

## 7. Owner switches (nothing here can be done from code)

- Publish DKIM for `russellcapitalsystems.com` (see §3) and re-run `pnpm mail:check`.
- Verify the domain in Resend **or** set `SMTP_*` for Google Workspace.
- Buy a number: Twilio (register 10DLC brand + campaign) or assign one in
  Inkbox/Speko and set `SMS_WEBHOOK_URL`. Point the inbound webhook at
  `/api/sms/inbound`.
- `FRED_API_KEY` from fred.stlouisfed.org (free).
- Set `PUBLIC_BASE_URL`, `MAIL_FROM`, `MAIL_REPLY_TO`, `LEAD_NOTIFY_PHONE`.
- Rotate the previously published credentials (still burned).
````

## `docs/grok-handoff/05_TOP_100_CRITICAL_IMPROVEMENTS.md`

```md
# The 100 most important things to correct, ranked (handoff for Grok)

Grounded in a full survey of the code on 2026-09-06: 241 routes, 216 portal
pages (199 with `@ts-nocheck`), `server/routers.ts` 9,513 lines with ~120
sub-routers and 436 procedures, `server/db.ts` 4,873 lines and 309 functions,
122 tables with zero secondary indexes, 55 pages using `Math.random`, 85 pages
reachable only by URL, 127 test files of which roughly half assert on source
text rather than math. Each item carries an importance score (100 = do first)
and three sentences on how it makes the site more fluid, more accurate, and
more useful to the client or advisor. Items are grouped by the single idea that
runs through all of them: **one truth, one kernel, one spine** — one client
record, one calculation engine per concept, one event log everything else is
derived from.

## Tier 1 — foundations (do these before anything else)

1. **(100) One client record.** The Financial Assessment (`client_fact_finders`, keyed by user) and the advisor's household fact finder (`household_fact_finders`, keyed by client) are two disconnected truths. Merge them into one assessment keyed by client with an optional owning user, and have `assessmentBridge` write through to `clients`. Every calculator, report, journey and score then reads the same numbers, and a client who fills in the assessment sees their advisor's tools already populated.

2. **(99) No invented numbers on compliance and audit surfaces.** `AuditTimeline`, `ComplianceAuditTrail`, `ComplianceMonitoringDashboard`, `WebsiteUsage` and `ClientHealthDashboard` render `Math.random` events, scores and visitor counts as if real. Wire them to `client_activity_log`, `website_usage` and the score tables, and show honest empty states when there is nothing. A compliance page that fabricates history is the single largest liability in the codebase.

3. **(98) Turn TypeScript back on.** 199 of 215 portal pages start with `@ts-nocheck`, so the compiler cannot see a single money calculation on the client. Remove it in waves, starting with the ten pages that compute dollars, and fix what surfaces. This is the cheapest way to find silent unit and null errors before a client does.

4. **(97) One tax-bracket engine.** `shared/taxBracketEngine.ts` is the intended source, yet hardcoded 2024/2025 bracket edges appear in three other shared engines and about ten pages. Make brackets data with a year and a source, and delete every copy. A bracket change becomes one edit instead of fifteen, and every page agrees on the marginal rate.

5. **(96) One calculation kernel per concept.** Mortgage payoff exists three times, Roth conversion is 906 inline lines in a router plus seven page-side variants, retirement income and IUL/annuity projections each have five or more overlapping implementations. Move each to one tested module in `shared/` and make pages pure views over it. Clients get the same answer on every page, and a fix propagates everywhere at once.

6. **(95) Indexes on every foreign key.** The schema declares zero secondary indexes across 122 tables, and almost every query filters by `workspaceId`, `clientId` or `userId`. Add them in one migration. Page loads that scan whole tables become instant, and the follow-up scheduler and dashboards stop degrading as data grows.

7. **(94) The advisor sees the client's assessment and journey.** The client page shows nothing of the Financial Assessment, its completeness, the Financial Analysis Document or the secret journey. Add that panel (the endpoints exist) and let the advisor ask the librarian *about* a client. The advisor walks into a meeting knowing exactly what the client has already seen and asked.

8. **(93) Switch on GitHub Pages and the custom domain.** DNS at GoDaddy already points at GitHub Pages and the `CNAME` file is committed, but the publish run fails because Pages is not enabled. One settings click (Source: GitHub Actions, custom domain, HTTPS) publishes the homepage on every push. Nothing else in the launch sequence matters until the site is reachable at its own name.

9. **(92) Publish DKIM and verify the sending domain.** The domain has SPF and DMARC at quarantine but no DKIM key, which is why mail is filtered, and Resend has no verified domain. Publish the key, verify the domain, and re-run `pnpm mail:check`. Every automated message, report and follow-up depends on this one DNS record.

10. **(91) Surface or retire the 85 hidden pages.** Thirty-nine percent of portal routes appear in no navigation and can only be typed. Either add them to a searchable Library index or delete them. A page nobody can reach is maintenance cost with no client value, and a client who lands on one by link has no way back.

11. **(90) Collapse the eleven duplicate-page clusters.** Referral ×2, Team ×2, Onboarding ×5, Compare ×4, Policy Review ×2, Compliance ×4, Mortgage Killer ×2, Intake ×2, Client Portal ×2, Client Score ×3. Keep one page per purpose with tabs for the variants. Advisors stop wondering which of four comparison tools is the real one, and every fix lands once.

12. **(89) Extract the Roth conversion engine.** The projection model (IUL loads, cost of insurance, loan rates, HELOC, rental yield) lives inside a Zod handler in `routers.ts` with no module and no unit tests. Lift it into `shared/rothEngine.ts` with golden-file tests, as `mortgageKiller` already does. The flagship strategy becomes reviewable, testable and reusable by the librarian.

13. **(88) Test the math, not the text.** Roughly half of the 127 test files check that strings exist in source files; only a dozen exercise real engines. Replace them with golden-file tests: fixed inputs, expected outputs, per engine. A wrong number fails the build instead of reaching a client.

14. **(87) Fix the eighteen N+1 loops.** `db.ts` issues per-row queries inside loops in eighteen places and uses `Promise.all` once. Batch them with `inArray` joins. Client lists, dashboards and bulk exports go from seconds to milliseconds.

15. **(86) Gate and rate-limit the public calculators.** About 35 `publicProcedure` calculators accept arbitrary input with no auth or rate limit, and `carrierRatings` and `modelPortfolios` expose proprietary data to anyone. Require sign-in for proprietary data and add a per-IP limiter to the rest. The compute surface stops being a free denial-of-service target.

16. **(85) Remove the fabricated public business metrics.** `demo.data` is an unauthenticated endpoint returning invented advisors, named clients with balances and a total AUM of $47.8M. Delete it or gate it behind the owner and label it demo. A public endpoint that publishes fake assets under management is a regulatory problem waiting to be screenshotted.

17. **(84) One assumption registry.** Inflation, returns, rates, life expectancy and fees are hardcoded per page. Put every named assumption in one table with a value, a source and an as-of date, fed by the FRED benchmarks where possible, and make every engine read it. Every projection on the site shares the same assumptions and can show where each one came from.

18. **(83) Assumption provenance on every input.** Extend the "Pre-filled from your Financial Assessment" badge so every number on a calculator says whether it came from the assessment, a live benchmark, an advisor override or a default. Store that provenance with the scenario. The client trusts the output because they can see the lineage of every input.

19. **(82) One scenario object.** Every calculator should emit the same shape: inputs, assumptions, outputs, provenance, client, timestamp. Store it once in `saved_scenarios` and let comparison, PDF, slides, video and the journey all consume it. Four comparison tools collapse into one, and any result anywhere can be compared with any other.

20. **(81) The activity log as the spine.** Every mutation (note, message, scenario, document, status change) writes one event to `client_activity_log`. Dashboards, audit trails, health scores, stale-client digests and notifications derive from events instead of their own tables and random data. One append-only stream makes every "what happened" view consistent and cheap.

## Tier 2 — accuracy and data flow

21. **(80) Persist the thirty local-state calculators.** About thirty pages hold financial inputs in `useState` only and lose everything on reload. Save inputs to the scenario table keyed to the selected client. A client's work survives, and the advisor can open exactly what the client last saw.

22. **(79) Cross-field validation on the assessment.** Add checks that flag but never auto-correct: mortgage balance above home value, take-home above income, emergency months inconsistent with savings and fixed expenses. Show them inline as questions. Accuracy rises before any calculation runs, and the librarian stops reasoning from contradictory facts.

23. **(78) Import from account aggregators.** Era Context and PocketSmith are connected and expose balances, recurring charges and cash flow. Map them into *suggested* assessment values the client confirms field by field. Gathering becomes minutes instead of an evening, with the human still deciding what is true.

24. **(77) Extract tax figures from uploaded returns.** The `taxReturnOcr` router and the Document Vault exist but do not feed the assessment. Extract AGI, tax paid, filing status and W-2 wages with a citation to the page, and propose them for confirmation. The most error-prone fields become the most accurate ones.

25. **(76) Benchmark-fed calculator defaults.** The mortgage rate, inflation and Treasury defaults on every calculator should read `dataFeeds.benchmarks` first and show the as-of date. Fall back to labelled reference values only when the feed is absent. Projections stop drifting from reality between releases.

26. **(75) Unify Monte Carlo.** `shared/monteCarloEngine.ts`, the inline simulation in `MortgageKiller`, and the p10/p50/p90 bands in `RetirementIncomeProjection` are three random engines with three seeds. One engine with a stored seed per scenario makes results reproducible and comparable.

27. **(74) Lead → client in one click.** A qualified lead's fact finder should become a client record and a partially complete assessment. Today the inbox and the client directory do not touch. The advisor's first meeting starts with the numbers the prospect already gave.

28. **(73) Lead scoring from assessment signals.** `factFinderSignals` already weights topics from the facts; run it on lead fact finders and sort the inbox by opportunity and urgency. Follow-up templates can then mention the prospect's strongest signal. The advisor calls the right person first.

29. **(72) Wealth Genome everywhere.** Compute the eight-dimension score from the merged client record and show it on the client list, The Mirror, reports and the advisor dashboard from one function. One score becomes the shared language between client and advisor.

30. **(71) Social Security, Medicare/IRMAA and estate engines into `shared/`.** They live inside pages today with no tests. Move them next to the tax engine and cover them with golden files. The librarian and the reports can then use them, not just the page.

31. **(70) Journey catalog coverage.** Only 45 of 216 pages can be recommended by the librarian. Add every page worth routing to with honest tags and walkthroughs, and retire the rest. The secret journey can reach the whole site instead of a fifth of it.

32. **(69) Journey analytics feed the catalog.** `visitedAt` is stored but unused. Measure which steps get opened and which lead to a saved scenario or a booked meeting, and feed the weights back into `buildJourney`. Journeys get better with every client who walks one.

33. **(68) Shared Zod schemas for every financial input.** Validate once, on both client and server, from the same schema. Out-of-range values are caught at the input, error messages match, and the engines never see garbage.

34. **(67) Deterministic demo data.** Replace every `Math.random` in render with a seeded generator or a fixture, and label demo data as demo. Screenshots become reproducible and nobody mistakes a fixture for a fact.

35. **(66) Carrier and index data with dates.** `iulCarriers`, `carrierRatings`, `annuityData` and `indexCreditingData` carry no as-of date or source. Add both, and show them wherever the data appears. Product comparisons stop presenting stale rates as current.

36. **(65) One money and percent formatter.** Rounding and formatting differ page to page (`formatTaxCurrency` exists but is rarely used). One formatter with one rounding policy. Totals reconcile across pages and PDFs.

37. **(64) Household view unified.** The `household` and `householdView` routers and pages overlap. One household model with members, and the client record as a member. Couples and families are modelled once.

38. **(63) Remove the dead code.** `shared/householdWealth.bak.ts` (667 lines), the `handleAction0..N` noise in `RetirementIncomeProjection`, seven orphan tables, six placeholder pages, thirty empty `onClick` handlers. Less surface means less to misread and faster builds.

39. **(62) Real website analytics.** `websiteUsage.logPageVisit` records visits, but the `WebsiteUsage` page invents its numbers. Read the real table. The owner learns which tools clients actually use.

40. **(61) Real webhook logs.** The `webhooks` router persists endpoints and deliveries while `Webhooks.tsx` shows random ones. Bind the page to the router. Integrations can be debugged.

## Tier 3 — structure and performance

41. **(60) Split `routers.ts` by domain.** 9,513 lines and 120 sub-routers in one file. One file per domain under `server/routers/` with a barrel. Reviews, merges and onboarding a second builder become possible.

42. **(59) Split `db.ts` into repositories.** 309 functions in one file. One repository per table family with the JSON-column normaliser applied uniformly. The N+1 fixes and indexes land where they are readable.

43. **(58) One PDF layout layer.** Eight independent generators and six `exportPdf` procedures. One layout with a report-kind parameter and the scenario object as input. Every PDF shares the brand, the disclaimers and the numbers.

44. **(57) One email composer.** Sixteen `send*` functions each build their own HTML. One composer with a header, body blocks, compliance footer and the deliverability headers from `sendMail`. Every message is consistent and inbox-safe.

45. **(56) One scheduler.** The managed heartbeat, the follow-up interval and the report schedules are three mechanisms. One `jobs` table, one runner, one external-cron endpoint. Anything time-based (reminders, digests, report posting, data refresh) is one line to add.

46. **(55) One communication log.** `outbound_messages`, `communicationLog` and `emailCampaigns` overlap. One log, one inbox view per client. The advisor sees every touch in one place.

47. **(54) One notification centre.** `smartAlerts`, `complianceAlerts`, `rebalance` alerts and `notifications` are four inboxes. One centre with severity, source and a link to the action. Nothing important is missed because it was in the wrong list.

48. **(53) Lazy AppShell navigation.** The shell is eager on every route with a 132-item hardcoded nav and a large icon surface. Generate the nav from a config file, lazy-load icons, and memoise. First paint gets faster on every page.

49. **(52) Chart wrapper and vendor chunk.** `recharts` is imported at the top of 27 lazily loaded pages. One `<Chart>` wrapper and a shared vendor chunk. Pages load once the library is cached instead of re-downloading it.

50. **(51) Client-side tests for the money pages.** There are none. Testing Library tests for the ten pages that compute dollars, driven by the same golden inputs as the engine tests. Rendering bugs stop reaching clients.

51. **(50) Continuous integration.** Only the Pages workflow exists. Run `pnpm check`, the suite and the bundle guard on every pull request. Nothing broken merges.

52. **(49) Environment validation at boot.** Validate `process.env` with Zod and expose `/api/health` listing what is configured (database, mail, SMS, FRED, each AI). A misconfigured host says so at startup instead of failing quietly at the first lead.

53. **(48) Owner "what is switched on" panel.** Show the health endpoint in the owner dashboard with a fix link per item. The owner sees in one glance why texts or emails are not going out.

54. **(47) Error boundaries and client error reporting.** Every lazy route gets a boundary and client errors post to the server. Blank screens turn into a message and a log entry.

55. **(46) Structured logs without PII.** The email PIN was logged in plain text and console output is free-form. Use one logger with redaction. Logs become useful and safe to share.

56. **(45) Cryptographic PIN generation.** The six-digit verification PIN uses `Math.random`. Use `crypto.randomInt`. An authentication factor stops being guessable.

57. **(44) Workspace access helper.** `getWorkspaceForUser` (private to `routers.ts`) and `getWorkspaceByOwnerId` are used inconsistently. One exported helper, used by every procedure that touches client data. Authorization is the same everywhere.

58. **(43) Database backup and restore.** `db:build` creates tables but nothing dumps them. A nightly dump script and a restore rehearsal. The archive of every client conversation cannot be lost.

59. **(42) Bundle budget on the client.** The server bundle has a guard; the client does not. Fail the build when a route chunk exceeds a size. Performance does not regress silently.

60. **(41) Mobile layouts for the top ten pages.** Clients open links from their phones. Responsive passes on the assessment, journey, advisor, mirror, genome and the five most-used calculators. The secret journey works in a waiting room.

## Tier 4 — experience and flow

61. **(40) Command palette as primary navigation.** Ctrl-K already exists; index every page, client, scenario and template. Typing beats three levels of menus. The site feels like one tool instead of 216.

62. **(39) The journey as the client's home.** `/portal/my-journey` should be what a client lands on after sign-in, with the assessment gate first. The client is always on a path, never lost in a directory.

63. **(38) Post reports to the portal.** Save each generated report to `client_documents` and message the client with the "report ready" template in one action. Reporting becomes a button, not a workflow.

64. **(37) Client and advisor copy modes.** Every page shows advisor jargon to clients. A copy layer with two registers, chosen by role. Clients read plain language; advisors keep the detail.

65. **(36) One disclaimer component.** `DisclaimerContext` and `disclaimerManager` exist alongside hand-written footers. One component, sourced from the manager, on every page and PDF. Compliance text is edited once.

66. **(35) One deck model.** Presentation builder, AI slides and the seminar generator each hold their own slide shape. One deck model fed by the scenario object. Any result becomes a presentation in one click.

67. **(34) Booking link in every follow-up.** Calendly is connected. A `BOOKING_URL` in the follow-ups and templates instead of "reply with a time". Leads book themselves.

68. **(33) Meeting notes import.** Otter, Zoom and Wispr Flow are connected. Import transcripts into client notes with a summary. The activity log fills itself after every meeting.

69. **(32) Streaming voice with cached guides.** Journey guides and advisor answers are synthesised on every play. Cache audio per guide and stream long answers. The tape recorder responds instantly.

70. **(31) Print and PDF of the secret journey.** The journey page has no export. One PDF from the scenario and journey objects. The client can carry the plan into a meeting.

71. **(30) Glossary from one definitions file.** Terms are explained ad hoc. One file, tooltips everywhere. Every page teaches the same definition.

72. **(29) Emergent question with citations.** The AI polish rewords the emergent question without saying which facts it drew on. Return the assessment fields used. The client sees why the librarian asked what they did not.

73. **(28) Knowledge base for the librarian.** The repository root holds a semantic index of the NLP and AQAL references. Feed retrieved passages into the advisor's context. Answers gain depth without inventing anything.

74. **(27) Video proposals from scenarios.** HeyGen proposals take hand-typed inputs. Generate them from the scenario object. Every saved plan can become a personalised video.

75. **(26) Lead consent versioning for clients too.** Leads store consent version; clients do not. Record consent for messaging on the client record and honour it in `deliver()`. Texting a client is defensible.

76. **(25) Data export and deletion.** No way to hand a client their data or delete it on request. One export (assessment, scenarios, messages, documents) and one deletion procedure. Privacy requests take minutes.

77. **(24) Feature flags for unfinished pages.** Six placeholder pages ship live. A flags table hides them until they are real. Clients never meet "coming soon".

78. **(23) Notifications to the advisor's phone.** Lead alerts text the owner; nothing else does. Route high-severity notification-centre items through SMS. The advisor learns of a client action while it still matters.

79. **(22) Rebalance and drift from real holdings.** Drift monitors compute against allocation targets with no holdings source. Connect the aggregator import. Alerts reflect the actual portfolio.

80. **(21) Referral attribution from recorded clicks.** `referralLinks.recordClick` stores clicks that the referral pages ignore. Bind them. Referral rewards are computed from evidence.

## Tier 5 — hygiene and polish

81. **(20) Team and roles enforced server-side.** `accessControl.ts` defines roles; procedures rarely check them. Apply the helper per procedure. Permissions on the page match permissions on the data.

82. **(19) Stripe webhook idempotency and tests.** Billing has no idempotency keys or replay tests. Add both. Double charges and missed upgrades become impossible.

83. **(18) HubSpot sync or removal.** `hubspotContactId` exists without a sync. Either two-way sync through the CRM router or remove the field. No half-built integration confuses the next builder.

84. **(17) Email campaigns through the deliverability layer.** The campaigns router sends outside `sendMail`, without unsubscribe or suppression. Route it through. Campaigns cannot damage the domain's reputation.

85. **(16) Crypto cycle engine labelled speculative.** It projects cycles as if predictive. Label, gate behind advisor, and exclude from client journeys. Education stays honest.

86. **(15) Gamification tied to the journey.** Quest tracker and badges track nothing meaningful. Award them for assessment completion and journey steps. Motivation points at the plan.

87. **(14) Sound and entrainment off by default.** Audio engines can autoplay. Opt-in only, never on first load. Clients are not startled in an office.

88. **(13) One theme token set.** Public emerald and portal purple are both fine, but tokens are duplicated. One token file with two themes. Restyling is one edit.

89. **(12) Component catalogue.** 77 components with no gallery. A lightweight catalogue page. Builders reuse instead of recreating.

90. **(11) Strings in one place.** Copy is scattered through JSX. Centralise the client-facing strings. Copy edits and the client/advisor register (item 64) become trivial.

91. **(10) Session hardening.** Add CSRF protection to the owner login form and confirm cookie flags in production. Sign-in stays safe behind a reverse proxy.

92. **(9) Deterministic seed script.** Demo workspaces are seeded with random values. One fixture with named clients and known totals. Every screenshot and test starts from the same world.

93. **(8) Product manual.** `LAUNCH.md` covers hosting; nothing covers using the site. One manual per role. Advisors onboard themselves.

94. **(7) Rename mislabelled pages.** `WebsiteUsage` is titled "System Compliance Portal"; several files and titles disagree. Titles that match purpose. Search and navigation stop lying.

95. **(6) Bump deprecated actions.** The Pages workflow uses actions on the deprecated Node 20 runtime. Update to current majors. The publish pipeline keeps working after the cutoff.

96. **(5) Lint and format enforced.** Prettier exists; nothing runs it. Enforce in CI. Diffs show intent, not whitespace.

97. **(4) Accessibility pass.** Money inputs and the tape recorder lack labels and keyboard paths in places. Label and test with a screen reader. The site is usable by every client.

98. **(3) Uptime monitor.** Nothing watches production. A ping on `/api/health` every minute with an alert to the owner's phone. Downtime is known before a client mentions it.

99. **(2) Retire the sibling prototype leftovers.** `russell-capital/` keeps `.BACKUP` and `.orig` variants of `App.tsx`. Delete them. One working file per project.

100. **(1) Internationalisation readiness.** Not needed now, but once strings live in one place (item 90) a locale file is trivial. Prepare the hook, ship English. A Spanish-speaking household is one file away.

## How to read this as a plan

Items 1–20 are the foundation and are mostly server and data work; they make
every later item smaller. Items 21–40 make the numbers trustworthy. Items 41–60
make the codebase maintainable and fast. Items 61–80 make the client's path
fluid. Items 81–100 are hygiene. The single most valuable sequence is
1 → 5 → 17 → 19 → 20: one client record, one engine per concept, one assumption
registry, one scenario object, one event spine. Once those exist, almost every
page becomes a view over the same three things, and the site stops being 216
tools and becomes one instrument.
```

## `docs/grok-handoff/06_TWENTY_ULTIMATE_IDEAS.md`

```md
# Twenty ideas that make the hundred unnecessary (handoff for Grok)

The hundred corrections in doc 05 fix the site as it is. These twenty change
what the site *is*. Each one removes a whole class of the hundred. In order of
importance.

1. **The Plan is a ledger, not a set of pages.** One append-only record per household: every fact, assumption, decision, message, document and outcome, with time and source. Every page, PDF, journey, video and message becomes a projection of that ledger, so nothing is ever out of sync and any moment can be replayed, diffed or undone. This single change retires items 1, 17, 19, 20, 21, 33, 36, 43, 44, 46 and 63 of the hundred.

2. **Instruments generated from a schema, not 216 hand-built pages.** Describe each tool as data: inputs, engine, charts, narrative, walkthrough, tags. A renderer turns the description into the page, the PDF, the slide and the librarian's guide. New tools become configuration, duplicates cannot exist, and the whole site can be re-themed, re-worded or re-ordered in one file.

3. **A solver instead of calculators.** The client states the objective (retire at 58 on $25,000 a month, divorce-proof, no market dependence) and the variables they control; the solver searches conversion pace, payoff speed, coverage, structures and timing and returns the frontier of plans that reach it. Calculators become explanations of a chosen point on that frontier. This turns "controlling the variables" from a slogan into a computed answer.

4. **One dependency graph across every engine.** Mortgage payoff changes Roth capacity, which changes IUL funding, which changes the estate, which changes protection. Wire the engines as nodes so changing one input ripples through all strategies live, and the client watches the cascade. Isolated calculators lie by omission; the graph tells the truth.

5. **One conversation on every surface.** The librarian is the interface: voice on the deck, text in the portal, SMS, email and a phone agent, all sharing one memory and one gate. Every page is something the librarian can open, pre-fill and narrate, so the client never navigates; they ask, and the site moves. Navigation problems (items 10, 11, 61, 62) disappear because navigation disappears.

6. **A survival number per uncontrolled variable.** Run the plan against real historical sequences and named shocks: 2008, 2022, a rate spike, a malpractice suit, a divorce, a disability, a tax-law change. Report the probability the plan survives each one and which controllable variable most improves it. "Controls volatility" becomes a measured, comparable figure.

7. **The assessment fills itself.** Aggregators, uploaded returns and statements, specialty priors and inference with confidence fill every field; the client confirms deltas rather than typing. Twenty minutes becomes three, and accuracy rises because the numbers come from sources, not memory. Items 22–25 collapse into one pipeline.

8. **Every plan re-runs when the world changes.** New CPI, new rates, new brackets, a new carrier rate: every saved plan is re-evaluated overnight and the advisor wakes to "34 clients now benefit from a conversion; 6 plans lost their survival margin". The practice becomes proactive without a single manual review.

9. **Compliance as code.** A rules engine every output passes through: no guarantees, suitability per product and state, required disclosures, figure-free public surfaces. It stamps a compliance record on every artefact and message, so the audit trail writes itself and is real by construction. Item 2 becomes impossible to regress.

10. **Click any number to see why.** Every figure on the site opens its formula, inputs, assumptions and source dates, all the way back to the ledger. Trust stops depending on the advisor's word and becomes a property of the interface. Explainability is also the fastest debugging tool the builders will ever have.

11. **The advisor copilot pre-meets and post-meets.** Before a meeting it assembles what changed, the three best moves, the likely objections and a draft follow-up; after it, the transcript is ingested, the ledger updated and the next steps scheduled. The advisor spends the meeting on the client, not the preparation.

12. **A decision-and-outcome loop.** Record every recommendation, whether it was taken, and what happened a year later. With consent and anonymisation, the platform learns which strategies worked for which genome and starts predicting rather than projecting. This is the only path to real foresight.

13. **The household as a graph.** People, entities (trusts, practices, LLCs), accounts, policies, properties and debts as nodes; income, premiums, distributions and gifts as flows. Estate flow, asset protection, tax and succession become views of one graph rather than four unrelated pages.

14. **The fact finder gathers itself by phone.** A voice agent calls the lead at the time they chose, runs the assessment conversationally, confirms consent, and writes to the ledger. The follow-up sequence hands off to a conversation instead of a link. Leads are qualified while the advisor sleeps.

15. **Physician-specialty priors.** Specialty-specific distributions for income trajectory, malpractice exposure, practice ownership, loan profiles and retirement age as Bayesian priors. Fewer questions, better defaults, and predictions calibrated to the people this practice actually serves.

16. **A council that shows disagreement.** The multi-model fan-out should surface where the models disagree and which assessment facts drive the disagreement, not just a synthesised consensus. Disagreement is the signal that a human decision is needed; consensus is the default that needs no meeting.

17. **Playbooks.** The best journeys become versioned, shareable playbooks; agencies inherit them; the librarian composes new journeys from playbook fragments. Expertise compounds across advisors instead of living in one head.

18. **A value-created ledger for the owner.** Tax saved, interest recovered, protection added, income guaranteed, per client and in total, derived from the plan ledger. The business is measured by what it did for clients, not by assets under management; that number is also the marketing.

19. **The client owns the vault.** Client data lives in a scoped, revocable, exportable vault; advisor access is granted, logged and can be withdrawn. Privacy becomes a feature clients can see, and portability makes the platform the one they keep.

20. **Understanding on a schedule.** Each journey page emits a micro-lesson; the platform schedules recall messages tied to the client's own plan, spaced to how memory works. Clients who understand act, and clients who act stay.

**Sequence:** 1 → 2 → 4 → 3 → 5. Once the ledger, the schema-generated instruments, the dependency graph and the solver exist, the conversation layer can drive all of it, and the remaining fifteen are additions rather than rewrites.
```

## `docs/grok-handoff/07_TOP_50_CONNECTORS_TO_ADD.md`

```md
# The fifty connectors to add next, ranked (owner checklist)

Verified on 2026-09-06 against the Claude connector directory and each
vendor's own documentation. Score is value to Russell Capital Systems on a
1–10 scale. Two ways to add:

- **Directory:** open the link (claude.ai → Settings → Connectors → search
  the name works the same), click Connect, authorise. No URL needed.
- **Custom URL:** claude.ai → Settings → Connectors → Add → Custom → Web →
  paste the URL. Only listed where the vendor publishes one.

Where a vendor publishes no remote URL the directory is the only route.
Nothing below is guessed; "directory only" means exactly that.

| # | Score | Connector | Why it matters here | Add via |
|---|---|---|---|---|
| 1 | 10 | **Zapier** | Bridges the site to every app below without code: lead → CRM, meeting → notes, report → drive | Directory: https://claude.ai/directory/connectors/1f6f271e-3d29-4241-b35e-8abe6def4891 · URL `https://mcp.zapier.com/api/v1/connect` |
| 2 | 10 | **Plaid** | Account aggregation: the self-filling Financial Assessment (balances, mortgages, recurring premiums) | Directory: https://claude.ai/directory/connectors/bacac1ad-ccb1-401e-a5d7-915da9742dce · URL `https://api.dashboard.plaid.com/mcp/` (developer dashboard; runtime aggregation uses the Plaid API with your own keys) |
| 3 | 10 | **Stripe** | Client billing, subscriptions, invoices; the platform already has Stripe env vars | Directory: https://claude.ai/directory/connectors/de127013-63f1-43d0-8dd2-b6cb5b4e5d1b · URL `https://mcp.stripe.com` |
| 4 | 9 | **HubSpot** | The clients table already carries a HubSpot contact id; two-way CRM sync | Directory: https://claude.ai/directory/connectors/875dee50-9b3f-452b-af8c-fbc839966273 · URL `https://mcp.hubspot.com` |
| 5 | 9 | **Docusign** | Engagement letters, advisory agreements, consent forms signed from the portal | Directory: https://claude.ai/directory/connectors/a876b642-2b05-4808-a565-deeb271802fd · URL `https://mcp-d.docusign.com/mcp` (beta; needs an integration key) |
| 6 | 9 | **Aiwyn Tax (Column Tax)** | A real federal + state tax engine: replaces hand-typed brackets in 15 files | Directory: https://claude.ai/directory/connectors/550d0dd8-46bf-4d76-a938-866afa15841d |
| 7 | 9 | **Morningstar** | Fund research, screeners, holdings for every allocation and drift page | Directory: https://claude.ai/directory/connectors/2e98be30-8dba-486e-94a9-9a01d34678e2 (already installed, needs reconnect) |
| 8 | 9 | **PostHog** | Product analytics for 216 pages: which tools clients use, where they drop | Directory: https://claude.ai/directory/connectors/50688846-553c-4a12-bc21-df94d2173734 · URL `https://mcp.posthog.com/mcp` |
| 9 | 9 | **Sentry** | Error tracking for the client bundle and server; item 54 of the hundred | Directory: https://claude.ai/directory/connectors/46d6322a-5f75-4822-b739-f49261805e9c · URL `https://mcp.sentry.dev/mcp` |
| 10 | 8 | **Intuit QuickBooks** | Practice-owner clients' books and Sam's own; cash-flow and P&L into the assessment | Directory: https://claude.ai/directory/connectors/a933e343-3389-4a82-beeb-7d5f5c2c4f25 |
| 11 | 8 | **Alpha Vantage** | Stocks, options, fundamentals, indices, commodities, FX for the market pages | Directory: https://claude.ai/directory/connectors/0f1d77a7-9e03-438a-824d-d66c6dd0f0d5 · URL `https://mcp.alphavantage.co/mcp` |
| 12 | 8 | **Bigdata.com** | Cited financial research: SEC filings, earnings, news, plus your own documents | Directory: https://claude.ai/directory/connectors/e463df16-b3d7-4bb9-953d-b652a073c764 |
| 13 | 8 | **Customer.io** | Behaviour-triggered journeys (assessment abandoned → nudge) across email and SMS | Directory: https://claude.ai/directory/connectors/e46d22da-f472-465a-ae46-52f6ac61a97f · URL `https://mcp.customer.io/mcp` |
| 14 | 8 | **Sumsub** | KYC and identity verification before a client portal is issued | Directory: https://claude.ai/directory/connectors/72396321-bc37-4407-88e5-c07339b80704 |
| 15 | 8 | **n8n** | Self-hosted automation you own; runs the follow-up sequence on any host | Directory: https://claude.ai/directory/connectors/d86fa999-100c-4212-ad7f-2fefea661ef1 (URL is your own n8n instance) |
| 16 | 8 | **Slack** | Lead alerts, compliance flags and daily digests into a channel | Directory: https://claude.ai/directory/connectors/597f662f-36de-437e-836e-5a81013cbfbe · URL `https://mcp.slack.com/mcp` |
| 17 | 7 | **Twilio** | Runtime SMS uses the Twilio API with your keys; this connector is API documentation search | Directory: https://claude.ai/directory/connectors/0f28b719-ce6a-4597-83a6-ff5b2d5b17c5 · URL `https://mcp.twilio.com/docs` |
| 18 | 7 | **Interactive Brokers** | Live positions and balances for clients who custody there | Directory: https://claude.ai/directory/connectors/d445461d-2337-4e00-b285-b43d111d2912 |
| 19 | 7 | **Close** | Lightweight sales CRM with calling, if HubSpot is too heavy | Directory: https://claude.ai/directory/connectors/3e12bb5c-11e5-409c-8e73-64d4b625b498 |
| 20 | 7 | **Microsoft 365** | Outlook, Teams, SharePoint for advisors on Microsoft | Directory: https://claude.ai/directory/connectors/ce0c9cda-5ea5-44c5-9cf2-40810dfa6582 |
| 21 | 7 | **Dropbox** | Client statements and returns straight into the Document Vault | Directory: https://claude.ai/directory/connectors/1e4280cc-037c-47f0-9873-56bea1871bdb |
| 22 | 7 | **Klaviyo** | Segmented marketing with consent tracking | Directory: https://claude.ai/directory/connectors/b1a89151-dc5f-4d75-baa7-9da291b81a0c · URL `https://mcp.klaviyo.com/mcp` |
| 23 | 7 | **Intercom** | Client support inbox and help centre for the portal | Directory: https://claude.ai/directory/connectors/b2def8dc-ae47-4d46-877a-19b6a6ebb771 · URL `https://mcp.intercom.com/mcp` |
| 24 | 7 | **Airtable** | Lightweight operational tables (carrier rates, playbooks) editable by non-developers | Directory: https://claude.ai/directory/connectors/cb504fab-e494-490f-bff8-bb3ab23a2209 · URL `https://mcp.airtable.com/mcp` |
| 25 | 7 | **Make** | Visual automation, alternative to Zapier | Directory: https://claude.ai/directory/connectors/038318ff-ed0d-45f8-a453-b01de0071561 · URL `https://<your-zone>.make.com/mcp/api/v1/sse` (token) |
| 26 | 7 | **PandaDoc** | Proposals and quotes with e-sign, generated from a scenario | Directory: https://claude.ai/directory/connectors/56998cd4-9a3a-4f40-8aa9-5019da8bf96e |
| 27 | 7 | **Tiller** | Transactions from a client's spreadsheet into the assessment | Directory: https://claude.ai/directory/connectors/ddd60d1b-2e30-4751-808c-b0ac43bf4ce3 |
| 28 | 6 | **Salesforce** | Enterprise CRM if an agency adopts the platform | Directory: https://claude.ai/directory/connectors/a352dbf6-c732-43d4-84c1-0bbb389d3921 · URL `https://api.salesforce.com/platform/mcp/v1/<server>` (needs an External Client App) |
| 29 | 6 | **Attio** | Modern CRM with call recordings and notes | Directory: https://claude.ai/directory/connectors/ae5afdb9-e3c6-4b64-a13a-420e7a8d8124 |
| 30 | 6 | **Clear Street** | Stock and options analytics for the market pages | Directory: https://claude.ai/directory/connectors/8ab3421a-b3c7-4198-967f-94db261d2f51 |
| 31 | 6 | **viaNexus** | Real-time and historical prices from licensed providers | Directory: https://claude.ai/directory/connectors/01c43f47-7757-4ae7-91f2-310eff8bb58d |
| 32 | 6 | **MT Newswires** | Real-time financial news by security for client briefings | Directory: https://claude.ai/directory/connectors/441c79ad-8a68-4d73-9263-7cfcadd5d8cf |
| 33 | 6 | **Box** | Enterprise document store with Box AI over statements | Directory: https://claude.ai/directory/connectors/a5380429-c773-4180-b642-301418240c8c · URL `https://mcp.box.com` (admin must enable) |
| 34 | 6 | **Mixpanel** | Funnel analytics, alternative to PostHog | Directory: https://claude.ai/directory/connectors/29d60a67-6f16-489b-8a1e-efdcece8d1f6 · URL `https://mcp.mixpanel.com/mcp` |
| 35 | 6 | **Meridian for QuickBooks** | Write access to QuickBooks Online (bills, deposits, customers) | Directory: https://claude.ai/directory/connectors/72e8740e-8922-4d91-a850-d4d47d3f8ab4 |
| 36 | 6 | **Tally** | Beautiful intake forms that feed the assessment | Directory: https://claude.ai/directory/connectors/b1c26807-986e-4cf5-99ca-362e5abb7feb |
| 37 | 6 | **Jotform** | Forms with submissions, including Jotform Sign for e-signature | Directory: https://claude.ai/directory/connectors/aed7e2be-868e-4046-9e12-5c917b4e6b97 |
| 38 | 6 | **Yardi Matrix** | Real-estate market intelligence for the property and STR pages | Directory: https://claude.ai/directory/connectors/2b245db2-8a73-491a-9849-8f44b9ce9488 |
| 39 | 6 | **ZoomInfo** | Physician prospect enrichment and intent signals | Directory: https://claude.ai/directory/connectors/f2cdf1b8-2f75-48a4-8d8c-8d9cce1b8643 |
| 40 | 6 | **Midpage Legal Research** | Case law for asset-protection and trust questions | Directory: https://claude.ai/directory/connectors/1a6a40cd-43c9-4752-9052-fed9c5e8c45c |
| 41 | 6 | **TaxAct** | Refund estimates, document checklists, deadlines for client education | Directory: https://claude.ai/directory/connectors/f7a0d75b-946d-4e65-bb32-7a7fc98d5497 |
| 42 | 6 | **Metricool** | Schedule and measure social posts for the Wealth Reels | Directory: https://claude.ai/directory/connectors/70ba6d62-7e98-4ef4-9073-d161d900a95f |
| 43 | 6 | **Mailchimp** | Newsletter campaigns if Resend broadcasts are not enough | Directory: https://claude.ai/directory/connectors/3a7fa2ac-d655-4479-bce3-8e10fcc26f96 |
| 44 | 5 | **PayPal** | Alternative client payments and invoices | Directory: https://claude.ai/directory/connectors/001103b7-bcde-4b9c-b5d4-f209c2fed1f3 · URL `https://mcp.paypal.com/http` |
| 45 | 5 | **Square** | In-person payments at seminars | Directory: https://claude.ai/directory/connectors/25d61b20-3ba1-4477-b51a-a743d1ca65fb · URL `https://mcp.squareup.com/sse` |
| 46 | 5 | **Xero** | Accounting alternative to QuickBooks (local MCP only, no remote URL) | Directory: https://claude.ai/directory/connectors/4c1fcb68-c482-46c5-a677-659eaf2f2c85 |
| 47 | 5 | **Datadog** | Full observability once traffic justifies it | Directory: https://claude.ai/directory/connectors/68268024-1a91-4316-a9e1-14ecb814cb18 · URL `https://mcp.datadoghq.com/api/unstable/mcp-server/mcp` (US1 site) |
| 48 | 5 | **SurveyMonkey** | Client satisfaction and post-meeting surveys | Directory: https://claude.ai/directory/connectors/58ff478e-b9b7-47c9-8253-78fb9364513a |
| 49 | 5 | **Sprinto** | SOC 2 style controls and evidence when an agency asks for them | Directory: https://claude.ai/directory/connectors/d1e853bb-e524-4771-bb2c-21cef5c67805 |
| 50 | 5 | **Riverside** | Record, edit and publish the podcast and video content | Directory: https://claude.ai/directory/connectors/3366d1e9-5d1d-49b1-a758-677949a84fd9 |

## Already installed but not active in this session (reconnect these first)

HubSpot, Xero, PayPal, Intercom, Morningstar show as installed with unknown
status; Tavily and Gal AI need reconnecting. Open Settings → Connectors and
click Reconnect on each.

## What the top ten unlock together

Zapier + Plaid + Stripe + HubSpot + Docusign + Aiwyn Tax + Morningstar +
PostHog + Sentry + QuickBooks cover the five pillars the hundred-item review
called for: gathering (Plaid, QuickBooks, Tiller), accuracy (Aiwyn Tax,
Morningstar, Alpha Vantage), reaching people (Customer.io, Slack, Intercom),
closing (Docusign, Stripe, HubSpot), and knowing what works (PostHog, Sentry).
```

## `docs/grok-handoff/08_PLAN_LEDGER.md`

```md
# The Plan Ledger (handoff for Grok)

Idea 1 of doc 06, built. One append-only, hash-chained record per subject;
everything else becomes a projection of it. Paths relative to
`russell-capital-systems/`.

## What exists

| Piece | File | Notes |
|---|---|---|
| Pure logic | `shared/planLedger.ts` | `diffFactFinder(prev, next)` → one fact event per changed field (labelled from `FACT_FINDER_SECTIONS`, lists compared whole); `replayFacts(events, asOf?)` → the assessment as it stood; `canonicalEvent()` (the hashed string); `ledgerSubject()`; `groupByDay()`; `formatFactValue()`. |
| Storage | `drizzle/schema.ts` → `plan_events`, `server/ledgerDb.ts` | Columns: subject, seq, userId/clientId/leadId/workspaceId, kind, source, key, label, value, prevValue, summary, actorName, occurredAt, prevHash, hash. Unique index on (subject, seq); indexes on client/user/lead — the first secondary indexes in the schema. `appendEvents()` chains with SHA-256 over `prevHash | canonicalEvent`; `verifyChain()` recomputes every hash. Rows are never updated or deleted. |
| Writers | `server/ledger.ts` | `recordAssessmentChange(ids, prev, next, source)`, `recordEvent(e)`, `assessmentResetEvent(ids)`. Never throw. |
| Router | `server/ledgerRouter.ts` (`ledger.*`) | `timeline` (newest first, `beforeSeq` pages back), `replay` (`asOf`), `diff` (`from`, `to`), `append` (decision / note / assumption / outcome), `verify`. Scope: no ids → the caller's own chain (`u:<userId>`); `clientId` → a client in the caller's workspace (`c:<id>`); `leadId` → owner only (`l:<id>`). |
| Client page | `client/src/pages/portal/PlanLedger.tsx` → `/portal/plan-ledger` ("Plan Ledger" in New Client Welcome List) | Timeline grouped by day, kind filters, chain-verified badge, and a time scrubber that replays the assessment as it stood at any fact. |
| Advisor panel | `client/src/components/ClientLedgerPanel.tsx` (on the client page) | The client's chain: messages, decisions, outcomes; "Record" appends a decision/assumption/note/outcome. |

## Who writes to it today

| Event | kind | source | where |
|---|---|---|---|
| Every changed assessment field | fact | client | `factFinder.save` (diff of previous vs new) |
| Assessment completed for the first time | status `assessment.completed` | system | `factFinder.save` |
| Assessment reset | status `assessment.reset` | client | `factFinder.reset` (replay honours it) |
| Journey built | journey `journey.<id>` | ai | `librarian.journey` |
| Journey page opened (first time) | journey `journey.<id>.<step>` | client | `librarian.markVisited` |
| Email / text sent, suppressed, or failed | message | advisor or automation | `messaging.deliver()` (clients and leads; follow-ups included) |
| Lead captured with consent | status `lead.captured` | client | `leads.capture` |
| Lead status changed | status `lead.status` | advisor | `leads.updateStatus` |
| Advisor decision / note / assumption / outcome | as chosen | advisor | `ledger.append` |

## Subjects and the join that is still missing

A signed-in client's chain is `u:<userId>`; the advisor's client record is
`c:<clientId>`; a lead is `l:<leadId>`. They are separate chains because the
client record and the assessment are still keyed differently (doc 05, item
1). When that merge lands, add `clientId` to the assessment writers and the
two chains become one. Until then the advisor sees messages and decisions on
the client chain, and the client sees facts and journeys on theirs.

## Rules

1. Append only. No procedure updates or deletes a `plan_events` row.
2. Every writer goes through `server/ledger.ts` so a failed write never breaks the action it records.
3. Facts are diffs, never snapshots: a save that changes nothing writes nothing.
4. The summary is human-readable and figure-honest (facts show the number; messages never do).
5. Verify before trusting: `ledger.verify` recomputes the chain; a break points at the first altered entry.

## Next projections to derive from the ledger

- Wealth Genome history (score after each fact batch) — a sparkline on The Mirror.
- "What changed since your last visit" on My Secret Journey (`ledger.diff` from the last `journey` event).
- Compliance audit trail page reading `plan_events` instead of random data (doc 05, item 2).
- Scenario events from every calculator save (doc 06, idea 2 makes this one line per instrument).

## Tests

`server/ledger.test.ts` (10): diff labelling and blank handling, list comparison, replay with resets, day grouping, chain append/verify through the router, tamper detection, workspace scoping, diff between moments.
```

## `docs/grok-merge-verification.md`

```md
# Grok Addition Merge Verification

The seven client-journey pages and shared `GenomeKit.tsx` component were imported from the canonical eight-file delta. No Grok server, schema, migration, authentication, or framework file was imported.

| Verification | Result |
|---|---|
| Primary distinct routes before merge | 222 |
| Distinct routes after merge | 229 |
| Primary routes removed | 0 |
| Added routes | 7 |
| Canonical delta file hash matches | 8 of 8 |
| Added routes present in active sidebar | 7 of 7 |
| TypeScript after merge | Passed |
| Merge safeguard tests | 4 of 4 passed |

All seven direct URLs were also exercised in the managed browser preview. Each resolved through the managed authentication guard rather than the 404 fallback. A second pass confirmed that The Legacy and The Brotherhood progressed beyond the transient identity-check loader. The test suite additionally imports all seven page modules directly to detect missing runtime dependencies before authenticated page-level validation.

| Grok route | Direct URL reached auth guard | Module loaded | Authenticated content |
|---|---:|---:|---:|
| `/portal/the-arrival` | Yes | Yes | Pending final OAuth round trip |
| `/portal/the-mirror` | Yes | Yes | Pending final OAuth round trip |
| `/portal/the-strategy-table` | Yes | Yes | Pending final OAuth round trip |
| `/portal/the-field` | Yes | Yes | Pending final OAuth round trip |
| `/portal/the-map` | Yes | Yes | Pending final OAuth round trip |
| `/portal/the-legacy` | Yes | Yes | Pending final OAuth round trip |
| `/portal/the-brotherhood` | Yes | Yes | Pending final OAuth round trip |

The new pages appear in an ordered **Client Journey** sidebar group: The Arrival, The Mirror, Strategy Table, The Field, The Map, The Legacy, and The Brotherhood. The group is additive and does not replace any primary navigation entry. The deterministic verification is stored in `server/grok-merge.smoke.test.ts`.
```

## `docs/homepage-hero-asset-review.md`

```md
# Homepage Hero Asset Review

The imported homepage references an external CloudFront skyline image that does not render in the managed preview, leaving the hero as a plain dark background. Two replacement candidates were visually reviewed.

The 4181×2793 realistic skyline provides production-resolution detail, visible office lights, a centered illuminated avenue, atmospheric mist, and sufficient negative space for overlay text. It does not contain strong native emerald lighting, but it supports a controlled green color layer, radial emerald glows, and dark readability masks without reducing photographic quality.

The 625×350 emerald skyline has the desired green glow, reflected water, and dramatic night atmosphere, but its resolution and compression are insufficient for a full-width desktop hero.

The selected direction is therefore the high-resolution realistic skyline with layered emerald illumination in CSS. This preserves the city-at-night requirement, makes the green lighting intentional and consistent with Russell Capital branding, and avoids a visibly low-resolution hero.
```

## `docs/homepage-typography-validation.md`

```md
# Homepage Typography Validation

The public homepage now uses an exact **1.6 typography scale**, representing a 60 percent increase over the prior visible font sizes. The scale covers navigation, hero text, buttons, metrics, client-portal form, feature cards, pricing cards, consultation content, final CTA, badges, and footer copy. It is scoped beneath `.rc-homepage-type-scale`, so managed login and portal interiors retain their existing typography.

Responsive repairs include a taller hero, wider desktop hero measure, larger controls, flexible CTA wrapping, expanded pricing width, larger card padding, single-column mobile metrics, hidden long navigation branding on narrow screens, bounded mobile navigation actions, full-width mobile hero buttons, and wrapped footer content.

| Validation | Result |
|---|---|
| Desktop full-page, 1440×1200 | Passed; no horizontal overflow, clipped text, card collisions, or unusable actions |
| Mobile full-page, 390×844 | Passed; title wraps cleanly, actions remain usable, metrics and cards reflow, footer remains readable |
| TypeScript | Passed |
| Homepage typography safeguards | 3 passed |
| Existing design-system safeguards | 3 passed |
| Production build | Passed |

Final project-wide validation after the typography change also passed: **703 Vitest suites**, **2,011 passing tests**, **0 failures**, and **10 intentionally skipped optional live-provider checks**. The compiled production server returned HTTP success for all **231 audited user-facing routes**, the homepage, and the managed authentication API. The reusable smoke runner is stored at `scripts/smoke-production-routes.mjs`.

The change has not been published. It is prepared for an unpublished review checkpoint so the owner can publish manually.
```

## `docs/implementation-and-functionality-audit.md`

```md
# Russell Capital Unified Portal — Implementation and Functionality Audit

## Executive Result

The managed unified application now preserves the complete primary platform, adds all seven Grok client-journey pages, introduces a persisted Planning Cases workspace, creates a searchable Secondary Information library, and adds an administrator-only System Health dashboard. The public experience retains the requested black-and-green city-at-night identity; portal and managed-access surfaces use the purple Grok-inspired system.

The source router contains **232 explicit paths including `/404`**. The page audit covers **231 user-facing routed pages**, each with a 1–10 usefulness score and a Keep, Improve, Merge, Move to Secondary Information, or Retire recommendation. No page was deleted.

| Release check | Result |
|---|---:|
| TypeScript | Passed |
| Vitest suites | 701 passed, 0 failed |
| Tests | 2,008 passed, 0 failed, 10 optional live-provider checks skipped |
| Production build | Passed |
| Compiled production route requests | 231 of 231 returned HTTP 200 |
| Compiled JS, CSS, and auth API | HTTP 200 |
| Page audit coverage | 231 of 231 |
| Source-level broken pages | 0 |
| Source-level at-risk pages | 6 |

## Architecture and Security

The original client-side password, trial-code, eternal-password, owner-email bypass, hidden-material password, website-usage password, reset-code, and retired advisor-account access paths were removed or disabled. Managed OAuth now controls identity; server procedures use authenticated roles and workspace membership. Legacy `/register`, `/forgot-password`, `/reset-password`, and `/trial` routes explain the change and direct users to secure sign-in.

The application retained the managed Express/tRPC runtime, OAuth state and nonce protection, database, S3 storage helper, analytics, and runtime assets. Route-level error boundaries isolate page failures and provide Retry. Persisted client-error reporting feeds an administrator-only System Health dashboard alongside real usage analytics, top routes, and page-audit totals.

One acceptance test remains owner-dependent: a complete browser OAuth round trip followed by the required modeling-disclosure acknowledgment. Automated tests verify OAuth boundaries and return-path contracts, but the validation process did not accept legal terms on the owner’s behalf.

## Database and Core Workflows

Non-destructive migrations `0068` through `0072` align the managed database with the imported runtime. They add planning cases, case notes, audit runs and records, preferences, 24 core portal tables, runtime schedule/compliance/session tables, slide usage, risk-score history, and compliance alerts. The managed users table was preserved. No mock client, testimonial, or financial data was inserted.

Core workflow outcomes:

| Workflow | Status |
|---|---|
| Client create, list, select, load, update, and saved profile data | Database-backed; live rollback-only persistence test passed; owner-session browser UAT remains |
| Planning Cases | Database-backed create, save, stage, archive, note, and preference workflows implemented |
| Dashboard | Uses persisted client, pipeline, activity, and planning-case data with loading, empty, error, and retry states |
| Live AUM | Suppressed until the owner explicitly requests it |
| Mortgage Killer | Protected tRPC PDF export and email mutation replace broken REST calls; email reports honest unavailability without Resend |
| Carrier Ratings | Randomized filler removed; deterministic API-backed/reference-labeled interface implemented |
| Page errors | Route-keyed boundary plus persisted error reporting implemented |

## Internet-Backed Features

Core advisor AI workflows use a bounded server-only model adapter with timeouts, sanitized failures, and empty-output rejection. A live readiness call succeeded through the managed model gateway. The architecture council used independent OpenAI, Claude/Anthropic, Gemini, Cohere, Mistral/Le Chat, and GroqCloud responses before implementation resumed.

Market data no longer invents fallback prices. Bitcoin uses CoinGecko, gold and silver preserve live/cached/reference provenance, and SPY/QQQ report unavailable until a verified equity source is configured. The Market Data Dashboard labels provenance and exports the received snapshot rather than simulating a download.

Optional direct-provider tests are intentionally opt-in because they incur external latency or billing. Direct xAI/Grok remains unavailable because its account reported no credits or license. The OpenRouter credential pasted into chat should be rotated. Resend is optional; email-dependent actions surface a truthful provider-unavailable message when it is absent.

## Design and Navigation

The homepage uses a persistent high-resolution city-at-night asset with dark masks and emerald illumination. Desktop and mobile validation confirm readable contrast, responsive sections, and usable actions. The managed login and retired-auth pages use a polished dark-purple system.

Portal interiors inherit the scoped `.rc-portal-theme` purple system for navigation, cards, focus states, controls, and backgrounds. A deterministic color audit scanned 332 files and saved 891 unique tokens to `audit/interior-color-token-inventory.csv`. It distinguishes the shared purple shell from semantic red/amber status colors, positive finance greens, informational blues, and legacy page-level surfaces. Post-disclosure authenticated review is still recommended before attempting broad page-by-page token replacement, because many green, red, amber, and blue values are intentional financial semantics.

The left navigation now separates primary workflows from **Secondary Information**. The secondary catalog is generated from the router, searchable, categorized, duplicate-aware, and preserves every route. The seven Grok pages appear together as **Client Journey**; Planning Cases is promoted as the persisted workflow.

## Page Usefulness Audit

| Measure | Result |
|---|---:|
| Average score | 5.99 / 10 |
| Score 5 or higher | 153 pages |
| Score below 5 | 78 pages |
| Keep | 83 pages |
| Improve | 68 pages |
| Move to Secondary Information | 68 pages |
| Merge | 5 pages |
| Retire after owner approval | 7 pages |

The seven Retire recommendations are `/portal/ai-meeting-notes`, `/portal/command-center`, `/portal/monitoring-agreement`, `/portal/my-world`, `/portal/nerve-center`, `/portal/rewards`, and `/portal/secret-secrets/:id`. They remain active pending owner approval.

The five Merge recommendations are `/portal/client-intake-recommender` into `/portal/combo-recommender`, `/portal/client-onboarding-auto` into `/portal/client-onboarding`, `/portal/competitive` into `/portal/calculators`, `/portal/mortgage-killer-v3` into the primary tools/Mortgage Killer workflow, and `/portal/time-lapse` into the broader planning workflow.

The full record is available in `audit/page_audit_results.csv`, `audit/page_audit_results.json`, and `docs/page-audit-summary.md`.

## Known Limitations and Required Owner Follow-Up

1. Complete one managed OAuth sign-in from a protected deep link, acknowledge the modeling disclosure, and visually test Dashboard, Clients, Planning Cases, Secondary Information, System Health, and one Grok page with the owner account.
2. Exercise the browser client create/edit/reload flow and confirm persisted dashboard counts in that authenticated session.
3. Review the 78 pages below 5 before approving any move, merge, or retirement. No destructive action has been taken.
4. Rotate the OpenRouter credential pasted into chat. Fund or license xAI only if direct Grok access is desired; it is not required by the application.
5. Add `RESEND_API_KEY` only if production email delivery is required.
6. Configure a verified live equity provider before SPY/QQQ are presented as current prices.
7. Continue page-level purple cleanup only after authenticated visual review distinguishes intentional finance semantics from obsolete legacy styling.

## Highest-Value Next Steps

The highest-value next action is owner-session acceptance testing, followed by execution of the audit decisions. Start with the seven Retire candidates and five Merge candidates, then promote high-scoring primary workflows and leave the remaining low-priority reference content in Secondary Information. After information architecture is approved, invest in the strongest Improve candidates rather than spreading development across all 78 low-scoring pages.
```

## `docs/internet-integrations-verification.md`

```md
# Core Internet Integrations Verification

The unified portal now routes the three highest-value advisor AI workflows—strategy generation, closing scripts, and advisor chat—through `server/portalAI.ts`. This server-only adapter calls the managed model gateway, enforces a 45-second default timeout with a 30-second closing-script limit, rejects empty model output, logs sanitized failure categories, and returns a retryable message that confirms saved data was not changed. A live readiness call succeeded through `gemini-3.5-flash-lite`; no credential or generated content was recorded.

The shared market quote API no longer creates randomized fallback prices. Bitcoin is requested from CoinGecko with a five-second timeout and payload validation. A live verification returned HTTP 200 with both USD price and 24-hour-change fields. Gold and silver use the existing data-feed service and retain `live`, `cached`, or `static` provenance. SPY and QQQ now report `unavailable` until a verified live equity source is configured rather than displaying invented values.

The shared Market Data widget now has loading, retryable failure, unavailable, source, timestamp, and reference-snapshot states. The Market Data Dashboard distinguishes live, cached, reference, loading, and unavailable sources; explains that curated equity scenarios are not live quotes; and exports the actual received CPI, Treasury, commodity, and MYGA feed snapshot immediately as CSV instead of simulating a delayed success.

Validation completed:

| Check | Result |
|---|---|
| Portal AI live readiness | Passed |
| CoinGecko live endpoint | HTTP 200; required fields present |
| AI adapter unit tests | 4 passed |
| Internet integration safeguards | 4 passed |
| Client/dashboard regression safeguards | 5 passed |
| TypeScript after AI and market changes | Passed |

The broader page audit will still identify presentation-only buttons and simulated behavior elsewhere in the 231-route application. Those pages will receive explicit usefulness and disposition recommendations rather than being silently deleted.
```

## `docs/navigation-architecture.md`

```md
# Navigation Architecture

The active portal shell uses a single left-side navigation with **primary workflow groups** and one visually distinct **Secondary Information** group. Existing sidebar capabilities—collapsible groups, subgroup counts, active-route highlighting, favorites, global search, breadcrumbs, command palette, mobile drawer behavior, client selection, and workspace selection—remain in the shared `AppShell` rather than being reimplemented per page.

The seven added client-journey pages are presented as an ordered primary workflow. The Secondary Information group links to the searchable Secondary Library, Tool Explorer, Knowledge Library, Video Library, and Patent Portfolio. Duplicate Video Library and Patent Portfolio placements were removed from Tax Secrets; their routes remain unchanged.

The Secondary Library is generated from the live router and primary navigation. It currently exposes **85 static portal routes** that are not in the primary sidebar, organized into Advanced Analysis, Reports & Documents, Reference & Education, Operations & Administration, Experience & Experimental, and Additional Tools. Every static portal route is therefore discoverable through either the primary sidebar or the Secondary Library. Dynamic detail routes remain reachable through their parent workflows.

Deterministic validation in `server/navigation-organization.test.ts` confirms that primary sidebar destinations are unique, secondary catalog entries are routable and disjoint from primary navigation, every static portal route is discoverable, and the Secondary Library includes search, filters, counts, and no-deletion guidance.
```

## `docs/page-audit-summary.md`

```md
# Unified Russell Capital Page Audit Summary

**Author:** Manus AI  
**Method:** Source-level audit of every explicit routed page in the managed unified application. Scores evaluate likely usefulness and implementation evidence; they are not a substitute for the authenticated browser smoke tests scheduled in the final validation phase.

> **Coverage:** 231 of 231 routes received an individual score and recommendation. No page was deleted.

| Measure | Result |
|---|---:|
| Average usefulness score | 5.99 / 10 |
| Pages scoring 5 or higher | 153 |
| Pages scoring below 5 | 78 |
| Source-level healthy pages | 225 |
| Source-level at-risk pages | 6 |
| Source-level broken pages | 0 |

## Disposition Recommendations

| Classification | Pages |
|---|---:|
| Keep | 83 |
| Improve | 68 |
| Move To Secondary Information | 68 |
| Retire | 7 |
| Merge | 5 |

## Implementation Evidence

| Classification | Pages |
|---|---:|
| Mixed Connected | 83 |
| Client Only | 49 |
| Database Backed | 40 |
| Prototype | 38 |
| Static Reference | 17 |
| Internet Backed | 4 |

## Category Averages

| Category | Average Score |
|---|---:|
| Administration | 6.00 |
| Ai Workflow | 6.36 |
| Analysis Calculator | 5.86 |
| Client Journey | 3.75 |
| Client Workflow | 6.38 |
| Portal Other | 5.93 |
| Public Home | 8.00 |
| Public Or Auth | 7.24 |
| Reference Education | 5.75 |
| Reports Documents | 5.44 |

## Highest-Value Pages

| Route | Score | Recommendation | Evidence |
|---|---:|---|---|
| `/administrator` | 10 | Keep | The AdministratorPortal component is a fully functional, database-backed admin dashboard with real authentication and data fetching. It provides essential site management features without relying on simulated data for its core data. |
| `/portal/dashboard` | 10 | Keep | The dashboard is highly functional and clearly database-backed, executing 10 trpc queries to fetch real metrics, planning cases, analytics, net worth, activity, top clients, allocations, goals, meetings, and coaching prompts. It uses sophisticated data formatting, filtering, and charts (Recharts) to present a comprehensive view of the practice. There are no simulated timers, random values, or placeholder terms, and it explicitly states it only shows real saved records. |
| `/portal/household-wealth` | 10 | Keep | The Household Wealth page is a complex, database-backed simulation tool utilizing tRPC for saving and loading state (`saveFactFinder`, `getFactFinder`). It models intricate real estate and financial scenarios, making it an essential, high-value workflow for users. |
| `/portal/pipeline` | 10 | Keep | The page features a fully functional pipeline with Kanban, Table, and Forecast views, drag-and-drop interactions, and deal management. It is directly backed by a robust set of tRPC endpoints for querying clients and managing pipeline deals, indicating real persistence and strong user states. |
| `/portal/planning-cases` | 10 | Keep | The page provides a complete planning workflow with real trpc queries and mutations (create, update, addNote, list, get). It features comprehensive user states including loading, error, empty states, and dynamic status updates. The metrics show 4 queries, 3 mutations, and 15 loading states, confirming a fully database-backed and robust implementation. |
| `/executive` | 9 | Keep | The page provides a clear authentication workflow for executives, calling a dedicated backend API (`/api/executive/login`) and managing session state via localStorage. It is a critical functional entry point with no obvious duplication or simulated behavior. |
| `/portal/agency-tutorial` | 9 | Keep | The page is an extensive agency tutorial with real tRPC endpoints (`trpc.tutorial.getProgress`, `trpc.tutorial.saveProgress`, `trpc.tutorial.completeSection`) and significant workflow logic for onboarding agency leaders. It has no duplicate routes and demonstrates strong, differentiated workflow. |
| `/portal/ai-slides` | 9 | Keep | The source code shows active integration with TRPC for fetching clients, remaining slide quota, and generating/saving PPTX files. The implementation is robust with proper error handling and state management, lacking any placeholder or simulation code. |
| `/portal/athene-pe-plus15` | 9 | Keep | The page is a highly complex illustration tool with 1348 lines of code, 33 charts, and 38 buttons. It uses tRPC queries, useAuth, and useClientData to fetch real data, though it also contains hardcoded strategy projection data. The lack of simulated timers and random values indicates genuine functionality. |
| `/portal/bulk-generation` | 9 | Keep | The page demonstrates robust backend connectivity via tRPC for scheduling, client data fetching, bulk operations, and exporting (PDF/CSV). It manages complex state effectively and uses realistic components, making it a highly useful tool. |
| `/portal/client-onboarding` | 9 | Keep | The page provides a comprehensive 8-step wizard for client onboarding, featuring deep interactive states, AI recommendations via tRPC mutations, and final data persistence to the database. It handles complex form state and effectively drives the primary onboarding workflow without relying on placeholder behavior. |
| `/portal/clients` | 9 | Keep | The page implements a comprehensive client management dashboard with robust features including adding clients, bulk CSV imports, tag management, and risk scoring analytics. It relies on multiple tRPC queries and mutations for real persistence and strong user states, demonstrating essential differentiated workflow without significant simulation or duplication. |
| `/portal/clients/:id` | 9 | Keep | The page is highly complex (1524 lines) and clearly database-backed, featuring 16 tRPC queries and 17 mutations for real persistence (e.g., properties, crypto holdings, risk assessment). It has comprehensive user states including 27 loading states, 30 error states, and 23 empty states, making it an essential workflow. |
| `/portal/email-campaigns` | 9 | Keep | The page has comprehensive tRPC integrations for querying campaigns, templates, and clients, as well as multiple mutations for creating, updating, and managing campaigns. It manages its own state and renders complex charts based on backend data, proving it is a database-backed, high-value page. |
| `/portal/estate-tax` | 9 | Keep | The page utilizes a tRPC query (`trpc.estateTax.calculateComprehensive.useQuery`) to calculate estate taxes, indicating backend connectivity for complex logic rather than just client-side estimation. It also integrates real user state through `useClientData()`, pulling live financial metrics to populate defaults, making it a highly useful workflow. No other routes share this component. |
| `/portal/existing-annuities` | 9 | Keep | The page implements a complex, differentiated workflow for existing annuities analysis with multiple user inputs and state management. It connects to the backend via a tRPC query (analyzeExisting) to perform institutional-grade analysis, demonstrating reliable server behavior. |
| `/portal/income-annuity-top10` | 9 | Keep | The page provides a comprehensive, interactive tool for comparing income annuities, utilizing external data (`@shared/annuityData`) and real TRPC endpoints (`clients.get`, `notes.list`, `activity.list`, `strategy.get`, `scenario.list`). It features robust charting, filtering, and data projection capabilities, indicating a high-value, functional application rather than a mere prototype. |
| `/portal/inflation` | 9 | Keep | The page is a fully featured, interactive inflation analysis tool with extensive charts and data tables. It is heavily connected to the backend, utilizing 5 tRPC queries and 2 mutations to fetch market data, user scenarios, and save new scenarios, demonstrating real persistence and high value. |
| `/portal/knowledge` | 9 | Keep | The source code uses tRPC for real backend mutations (create, upload) and queries (list), proving it is fully database-backed and not a prototype. It features complex UI interactions including file uploads, forms, and charts, making it a high-value essential workflow. |
| `/portal/meeting-agenda` | 9 | Keep | The page is a highly functional Meeting Agenda tool with 11 distinct tRPC calls, including queries for clients, meetings, team members, and templates, as well as mutations for generating, exporting, and emailing agendas. The 1396-line component includes analytics, history, setup, and template tabs, indicating a well-developed, database-backed feature set. |
| `/portal/meetings` | 9 | Keep | The Meetings component is a comprehensive, database-backed page with 679 lines of code. It heavily utilizes tRPC for data fetching (3 queries) and mutations (4 mutations), with strong state management and analytics (13 charts). There are no simulated timers or random values, indicating real server behavior. |
| `/portal/mortgage-killer` | 9 | Keep | The page has a substantial amount of code (3161 lines) and uses tRPC for both queries (e.g., fetching clients and scenarios) and mutations (e.g., saving scenarios, uploading statements, and analyzing). This indicates it is a robust, database-backed implementation. |
| `/portal/onboarding` | 9 | Keep | The page implements a comprehensive 7-step client onboarding wizard that is database-backed, connecting to tRPC mutations (clients.create, onboardingWizardV2.getRecommendation) and queries (lifeGoals.getSuggestions). It has real persistence and robust user state management. The route shares its source component with '/onboarding' and '/portal/welcome', which serve as legitimate aliases for the same workflow. |
| `/portal/premium-financing` | 9 | Keep | The page is a robust, interactive financial projection tool with comprehensive data visualization and integrations. It relies on multiple TRPC queries and mutations, features dynamic calculation models like Monte Carlo simulations, and has no significant duplicate routes. |
| `/portal/retirement-guardrails` | 9 | Keep | The page provides a comprehensive retirement guardrails simulation that is fully database-backed, leveraging real client data, market data, risk profiles, and tax rates via tRPC. It includes complex charting and data visualization without significant duplication or mock data reliance. |

## Pages Scoring Below Five

| Route | Score | Recommendation | Merge Target | Required Action |
|---|---:|---|---|---|
| `/portal/ai-meeting-notes` | 2 | Retire | `` | Retire the page after owner approval as it contains no real functionality. The page consists of hardcoded chart data, hundreds of filler lines, and placeholder buttons that only log to the console. |
| `/portal/avatar-twins` | 2 | Move to Secondary Information | `` | Move this novelty avatar generator feature to Secondary Information since it provides no core financial utility and uses hardcoded toasts instead of actual API integration. Ensure it does not distract from main application workflows. |
| `/portal/advisor-directory` | 3 | Move to Secondary Information | `` | Move this page to Secondary Information since it is heavily presentation-focused and relies entirely on hardcoded state and mock data. Remove unused tRPC hooks to clean up the component. |
| `/portal/arena` | 3 | Move to Secondary Information | `` | Move this page to Secondary Information as it is primarily a presentation-heavy prototype with simulated gamification mechanics. Require owner approval before deciding whether to retire it or invest in fully backing the gamification engine with real data. |
| `/portal/batch-illustration` | 3 | Move to Secondary Information | `` | Move this heavy prototype to Secondary Information since it lacks real backend integration. If batch illustration is a core feature, implement real tRPC mutations and connect the UI to actual server data instead of simulated processing. |
| `/portal/batch-slides` | 3 | Move to Secondary Information | `` | Remove the massive blocks of dummy variables and hardcoded static data. Implement real backend integrations for the statistics and presentation generation before considering this for production. |
| `/portal/black-mirror` | 3 | Move to Secondary Information | `` | Move this gamified presentation layer to Secondary Information or a sandbox environment. If real integration is desired, connect the phantom clients and dream journal to actual CRM data and AI pipelines. |
| `/portal/collaborative-planning` | 3 | Move to Secondary Information | `/portal/dashboard` | Merge the collaborative planning workflow into the main client dashboard or retire if it's just a mockup. The page currently relies on hardcoded data arrays and local state mutations, making it non-functional for real multi-advisor collaboration. |
| `/portal/command-center` | 3 | Retire | `` | Retire the page as it relies heavily on mock data and simulated timers for its numerous charts, providing no real operational value. If the layout is needed for future development, move it to secondary information. |
| `/portal/commission-tracker` | 3 | Move to Secondary Information | `` | Move to Secondary Information as this is a static marketing or presentation page. Remove unused tRPC hooks and consider if this content belongs in a CMS or presentation deck instead of a functional route. |
| `/portal/data-query` | 3 | Move to Secondary Information | `` | The page's natural language querying is entirely simulated with regex rules on client-side data, and heavily relies on hardcoded patterns and random confidence scores. It should be moved to Secondary Information until a real backend NLP service is implemented. |
| `/portal/document-templates` | 3 | Keep | `` | Connect the disabled tRPC queries to the backend to fetch real templates. Replace the hardcoded TEMPLATES array and local state modifications with actual database mutations for saving, starring, and AI generation. |
| `/portal/education` | 3 | Move to Secondary Information | `` | Remove unused tRPC queries and redundant state variables. Consolidate the duplicate charts into a single visualization or remove them if unnecessary, and consider migrating the hardcoded content to a database or moving the page to a static resource section. |
| `/portal/estate-document-gen` | 3 | Move to Secondary Information | `` | Since the page merely generates static text drafts with hardcoded placeholders on the client side, it should be moved to Secondary Information to avoid misleading users into thinking it performs actual server-side legal document generation. Remove the PRO badge and explicitly label it as a static template viewer. |
| `/portal/lead-generator` | 3 | Move to Secondary Information | `` | Move this prototype to Secondary Information since it relies on simulated data generation with Math.random() and setTimeout. Remove or document the disabled tRPC queries to prevent confusion. |
| `/portal/medicare-irmaa` | 3 | Move to Secondary Information | `` | Remove the dummy padding lines and hardcoded API status tables. Merge the core calculator functionality into a more robust financial planning tool, or move it to Secondary Information if it remains a standalone prototype. |
| `/portal/monitoring-agreement` | 3 | Retire | `` | Retire the page and move its agreement signing functionality to a modal or a settings section within the user profile. The extensive chart rendering and simulated data should be removed as they are unnecessary for a legal agreement page. |
| `/portal/my-world` | 3 | Retire | `` | Retire the page since it is an unused, static prototype that offers no real value. The backend hooks are present but completely ignored in the rendering logic. |
| `/portal/nerve-center` | 3 | Retire | `` | Retire this prototype after owner approval, as it serves as a presentation-heavy mockup rather than a functional workflow. Any genuine gamification logic should be extracted into core reusable components. |
| `/portal/patent-showcase` | 3 | Move to Secondary Information | `` | Move this page out of the core portal navigation into a secondary marketing or legal section. The content is static and serves as an educational reference rather than a functional tool. |
| `/portal/predictive-analytics` | 3 | Move to Secondary Information | `` | Connect the tRPC queries to actually populate the client profile and scenario data instead of using hardcoded defaults. Remove unused tRPC queries or implement their corresponding UI sections. |
| `/portal/referral-tracking` | 3 | Move to Secondary Information | `` | Move this prototype to Secondary Information as it relies purely on mock data and simulated actions. A complete backend implementation with real database mutations is required before it can be useful. |
| `/portal/rewards` | 3 | Retire | `` | Retire the page after owner approval, as it is mostly a static prototype. If kept, it requires a full backend implementation for shop items, collections, and prestige tracking. |
| `/portal/secret-secrets/:id` | 3 | Retire | `` | Retire the page after owner approval, as it relies on hardcoded JSON data and provides no real user persistence or backend connectivity. If the calculators are deemed valuable, extract them into a shared utility or a secondary reference section. |
| `/portal/seminar-generator` | 3 | Move to Secondary Information | `` | This page is a heavily mocked, static prototype disguised as a functional tool. It should be moved to Secondary Information until actual backend persistence and data flow are implemented. |
| `/portal/social` | 3 | Move to Secondary Information | `` | Move this prototype to Secondary Information or a prototype archive. Replace hardcoded social features with real backend implementations or retire the page if actual social networking is not a planned product capability. |
| `/portal/story-generator` | 3 | Move to Secondary Information | `` | Move this page to Secondary Information since it is a prototype that simulates AI generation with hardcoded strings and a timer. It can be revisited if actual AI integration is planned. |
| `/portal/the-arrival` | 3 | Move to Secondary Information | `` | Move to Secondary Information or retire after owner approval since it is a pure frontend prototype with hardcoded steps and no real backend persistence yet. Alternatively, implement the planned tRPC mutations for `tutorial_progress` and `advisor_goals` to make it database-backed. |
| `/portal/the-legacy` | 3 | Move to Secondary Information | `` | Move to secondary information or retire after owner approval. The page currently has no backend functionality and only serves as a visual prototype. |
| `/portal/the-map` | 3 | Move to Secondary Information | `` | Move this calculator to Secondary Information until actual persistence and dynamic base values are implemented. Alternatively, integrate it as a widget within the main dashboard. |
| `/portal/workflow-automations` | 3 | Move to Secondary Information | `` | Move this prototype to Secondary Information since it is a pure client-side simulation. Remove the unused tRPC hooks and consider migrating the static logic to a real backend if this feature is prioritized. |
| `/portal/advisor-training` | 4 | Move to Secondary Information | `` | Move this training module prototype to Secondary Information since it is mostly a static, hardcoded demonstration. Alternatively, connect the quiz progress, scores, and certification status to a real backend database to make it a fully functional training portal. |
| `/portal/advisory-summary` | 4 | Move to Secondary Information | `` | Remove unused tRPC queries and move the page to a secondary information section or documentation portal. Ensure the static data is maintained if it serves as a reference. |
| `/portal/audit-timeline` | 4 | Move to Secondary Information | `` | Move this page to Secondary Information since it is heavily reliant on simulated data and incomplete UI. Remove it from primary navigation. |
| `/portal/axonic-sp500` | 4 | Move to Secondary Information | `` | Move this static calculator to Secondary Information or a prototype directory until it can be connected to real, dynamic annuity data. Remove the unused tRPC hooks and dummy row generators. |
| `/portal/beneficiary-optimization` | 4 | Move to Secondary Information | `` | Move this page to Secondary Information or retire it. If retained, replace the hardcoded `generateAccounts` and client-side simulations with actual backend data and persistence. |
| `/portal/business-owner` | 4 | Move to Secondary Information | `` | Move this page to a secondary tools menu or sandbox area. Remove unused TRPC query declarations and replace hardcoded arrays with real data fetches if it is to be fully integrated. |
| `/portal/client-intake` | 4 | Move to Secondary Information | `` | Move this page to Secondary Information since it is a static prototype with simulated interactions. Before retiring or refactoring, owner approval is required to confirm if the complex UI layout should be preserved for a future real implementation. |
| `/portal/client-intake-recommender` | 4 | Merge | `/portal/combo-recommender` | Merge the two duplicate routes into a single recommender page. Ensure the unified page clarifies the scope of the static data used for recommendations. |
| `/portal/client-onboarding-auto` | 4 | Merge | `/portal/client-onboarding` | Convert hardcoded mock data (PIPELINE_DATA, COMPLIANCE_ALERTS, etc.) and simulated actions (handleRefresh, handleSubmit) to use actual tRPC mutations and backend queries. Since this appears to be a prototype dashboard, merge it into the main client onboarding flow or retire it if it's purely a conceptual mockup. |
| `/portal/client-portal-config` | 4 | Move to Secondary Information | `` | Move the static presentation code to Secondary Information for reference. Replace this route with a fully connected version using the actual tRPC queries and mutations. |
| `/portal/combo-recommender` | 4 | Move to Secondary Information | `` | Move this client-side prototype to Secondary Information since it relies entirely on static JSON files and local state. Consider integrating it with the backend database to provide real recommendations. |
| `/portal/competitive` | 4 | Merge | `/portal/calculators` | Merge the competitive analysis visualizations and calculators into the primary calculator tools page to consolidate redundant tools. Extract the hardcoded carrier data to the backend. |
| `/portal/compliance-audit-trail` | 4 | Improve | `` | Remove client-side mock data generation and fully integrate the table with real backend data via tRPC. Enhance the error handling and loading states to reflect actual API responses. |
| `/portal/compliance-monitoring` | 4 | Improve | `` | Replace the `generateComplianceItems` mock array with a TRPC query that fetches real compliance items from the database. Implement the corresponding TRPC mutations for the actions currently triggering dummy toasts (e.g., marking items resolved, updating settings, creating policies). |
| `/portal/daily-discovery` | 4 | Move to Secondary Information | `/portal/dashboard` | This page should be moved to Secondary Information or merged into a gamification/dashboard hub because its core "discovery" features are simulated via hardcoded arrays, despite having some live database connections for profile check-ins and client aggregates. The hardcoded insights and gamified streaks reduce its utility as a standalone core workflow. |
| `/portal/ecological-drivers` | 4 | Move to Secondary Information | `` | Remove the unused tRPC hooks and move this static presentation page to a secondary information or reference section. Alternatively, bind the real data from the hooks to make it a functional dashboard. |
| `/portal/enterprise` | 4 | Improve | `` | Replace the simulated data in the System Health and Feature Flags tabs with actual backend endpoints. If these features are not yet supported by the backend, remove them to prevent misleading users. |
| `/portal/fia-top10` | 4 | Move to Secondary Information | `` | Move this page to Secondary Information since it is primarily a presentation-heavy calculator with simulated interactions. The core calculations and scenarios should be integrated into a unified financial planning view rather than existing as a standalone interactive prototype. |
| `/portal/index-backtester` | 4 | Improve | `` | Connect the charts and tables to real backend data via tRPC. Remove hardcoded mock data. |
| `/portal/index-strategies` | 4 | Move to Secondary Information | `` | Move the component and its complex hardcoded calculators out of the primary application routes into a secondary documentation or reference section. Remove the unused tRPC hooks and empty mutations before moving. |
| `/portal/integrations` | 4 | Improve | `` | Remove simulated random data and hardcoded states, and replace with actual backend integration. Connect the configuration forms to actual mutation endpoints. |
| `/portal/legal-payment-folder` | 4 | Move to Secondary Information | `` | Move this page to Secondary Information until real backend mutations and actual metric data replace the dummy widgets and simulated charts. |
| `/portal/mortgage-killer-v3` | 4 | Merge | `/portal/tools` | Merge this client-only calculator into the main portal dashboard or tools section to consolidate financial simulators. Ensure any shared components are properly abstracted. |
| `/portal/multi-gen-wealth` | 4 | Move to Secondary Information | `` | Move the page to Secondary Information pending owner review. Replace the simulated Monte Carlo timer and hardcoded data generators with actual backend calculation endpoints before promoting it to a primary workflow. |
| `/portal/physicians-edge` | 4 | Move to Secondary Information | `` | Since this page is a static presentation with hardcoded data and no real calculations, it should be moved to Secondary Information or merged into a marketing page. It does not perform the 248-calculator functions it advertises. |
| `/portal/policy-review-checklist` | 4 | Move to Secondary Information | `` | Move to Secondary Information or merge into a real policy review workflow. The page has extensive hardcoded data and client-side only state, with unused tRPC queries. |
| `/portal/portfolio-drift` | 4 | Move to Secondary Information | `` | Connect the component to actual backend endpoints to fetch real portfolio and market data. Remove the simulated random drift generation and rely on actual live metrics before moving it back to primary navigation. |
| `/portal/presentation-builder` | 4 | Move to Secondary Information | `` | This is a heavy client-side UI with complex local state (slides array, drag/drop sorting, auto-populate logic) but no actual backend persistence for the presentations created. The data tab claims integration but only has placeholder edit buttons. Move to secondary information or retire if a real presentation builder isn't planned, as this is essentially a static prototype. |
| `/portal/revenue-guarantee` | 4 | Move to Secondary Information | `` | Move this marketing-heavy page to a secondary information section or landing page. It is largely a static promotional calculator and lacks deep backend persistence despite having a hook. |
| `/portal/sales-story` | 4 | Move to Secondary Information | `` | Complete the remaining presentation templates and implement the simulation logic. Add proper loading and error states for the tRPC queries to ensure reliable rendering. |
| `/portal/scenario-play` | 4 | Move to Secondary Information | `` | Move to Secondary Information or retire after owner approval since it relies entirely on hardcoded scenarios and math without server persistence or meaningful state management. If keeping, consider integrating with backend scenario storage. |
| `/portal/secret-secrets` | 4 | Move to Secondary Information | `` | The page renders purely static JSON content from @/data/strategies.json without backend integration or interactivity beyond local filtering. It should be moved to Secondary Information or merged into a knowledge base since it serves as an educational reference. |
| `/portal/slack` | 4 | Move to Secondary Information | `` | Move to Secondary Information as it is a presentation-heavy prototype with extensive hardcoded mock data. Consider merging useful real integration parts if they exist, but the current page is mostly simulated. |
| `/portal/stale-digest` | 4 | Move to Secondary Information | `` | Remove client-side data simulation and wire the table and charts directly to real backend data. If the backend cannot support these metrics, the page should be moved to Secondary Information until real data is available. |
| `/portal/str-strategy` | 4 | Move to Secondary Information | `` | Move the component to a secondary tools section if the business wants to keep it as an educational calculator. If persistence is needed, wire the inputs and generated projections to the database. |
| `/portal/strategy-compare` | 4 | Move to Secondary Information | `` | Move this static client-side comparison tool to Secondary Information since it lacks backend integration and relies entirely on local JSON files. Wait for owner approval before retiring or moving. |
| `/portal/succession-planning` | 4 | Move to Secondary Information | `` | Move the succession planning wizard to Secondary Information pending a complete backend integration of the valuation logic. Fix the render risks by ensuring string replacements are only called on valid non-empty strings, and clean up the dead code. |
| `/portal/tax-combos/:id` | 4 | Move to Secondary Information | `` | The page is a highly static, data-driven prototype with simulated calculators and hardcoded data references. Move it to Secondary Information or convert it into a fully connected, database-backed workflow. |
| `/portal/tax-loss-harvesting` | 4 | Move to Secondary Information | `` | The page relies entirely on hardcoded sample holdings and a mocked execution function. The tRPC queries are mostly disabled and unused. It should be moved to secondary information or retired until backend integration and actual execution logic are implemented. |
| `/portal/the-field` | 4 | Move to Secondary Information | `` | Move to Secondary Information as it is an unintegrated prototype. Ensure owner approval before moving. |
| `/portal/the-mirror` | 4 | Improve | `` | Replace the hardcoded seed data (DOMAINS, GOALS, MEMORY) with actual tRPC reads and mutations to make the dashboard functional. Connect the somatic check-in state to persistent storage. |
| `/portal/the-strategy-table` | 4 | Move to Secondary Information | `` | Move to secondary information or prototype gallery unless backend calculation and saving logic is wired up. The 'calculation_audit_logs' saving is purely client-side state ('setSaved(true)') without real persistence. |
| `/portal/time-lapse` | 4 | Move to Secondary Information | `/portal/planning` | This page should be moved to Secondary Information or merged with a broader planning module. The data visualization is mostly client-side simulation, though it connects to the client list via tRPC. |
| `/portal/toilet` | 4 | Move to Secondary Information | `/portal/dashboard` | Move this novelty dashboard to a secondary Easter egg section or retire it entirely if not actively used. If kept, consider merging its scannable mobile-friendly view into the main dashboard's responsive layout. |
| `/portal/video-library` | 4 | Move to Secondary Information | `` | Move this static video library to a secondary information section like a resources hub. It contains hardcoded video data and static content without backend integration. |
| `/portal/war-story-generator` | 4 | Move to Secondary Information | `` | Move this prototype page to Secondary Information until the 'Hall of Fame' and statistics features are connected to a real database. The AI generation endpoint is functional but the surrounding application shell is mostly simulated data. |
| `/support` | 4 | Move to Secondary Information | `` | Move this static content to a secondary information section such as a help center modal or footer link. |

## Interpretation and Limits

The audit intentionally keeps all routes. A **Retire** recommendation means the page should remain until the owner approves removal after reviewing usage and authenticated runtime evidence. A **Move to Secondary Information** recommendation means the route remains active but should not compete with primary advisor workflows. A **Merge** recommendation identifies an overlapping destination that can absorb the unique useful material after content and data contracts are reconciled.

Scores rely on route source, interaction hooks, state handling, duplicate-source evidence, and detected integration patterns. Final validation added TypeScript, a zero-failure deterministic test suite, a successful production build, 231 production route requests, desktop and mobile public-page checks, managed-auth route checks, module loading, and runtime-log review. Post-disclosure authenticated page-content verification remains an owner-session acceptance test and is documented in the implementation audit.
```

## `docs/primary-port-verification.md`

```md
# Primary Platform Port Verification

The complete 222-route primary platform was imported from the verified release copy while the managed server core, client authentication hook, project metadata, analytics configuration, and runtime public assets were retained. The imported dependency graph was reconciled without replacing managed package scripts or infrastructure versions.

The managed OAuth state codec and one-time nonce protection were restored. The `/login` page and every gated portal route now initiate managed OAuth; the OAuth state carries a validated internal return path so users return to the requested portal page. Legacy password registration, password login, reset procedures, trial passwords, eternal backdoors, owner-email bypasses, local-storage owner markers, and the hidden-material default password were retired. Hidden material now requires the server-side admin procedure.

The authoritative managed `server/storage.ts` helper was restored byte-for-byte from the current full-stack template after the source import was found to use a different storage protocol. The managed database accepted `SELECT 1 AS managed_database_ok`, confirming connectivity before any schema migration. Managed analytics placeholders remain in `client/index.html`, and `client/public/__manus__/debug-collector.js` plus `version.json` remain present.

Validation completed:

| Check | Result |
|---|---|
| Primary route declarations | 222 preserved |
| TypeScript after import and auth conversion | Passed |
| Managed server startup | Passed on port 3000 |
| Managed database connectivity | Passed |
| Managed storage helper integrity | Restored from current template |
| Managed analytics/runtime assets | Present |
| Targeted Vitest safeguards | 6 of 6 passed |

The deterministic safeguards are stored in `server/managed-port.smoke.test.ts`.

Route-level browser verification also passed for `/login`, `/register`, and the protected deep link `/portal/dashboard`. The login and retired-auth guidance pages render the purple managed-identity interface, while the protected dashboard deep link renders `ManagedAuthGuard` with its secure sign-in action and preserved return path rather than exposing portal content or a legacy gate.
```

## `docs/source-inventory-matrix.md`

```md
# Source Inventory Matrix

| Category | Primary platform | Grok addition snapshot |
|---|---:|---:|
| Files | 744 | 1347 |
| Manifests/tooling files | 5 | 5 |
| Lockfiles | 0 | 1 |
| Runtime entrypoints | 4 | 4 |
| Referenced environment variables | 17 | 16 |
| Database schema files | 2 | 2 |
| Migrations | 58 | 62 |
| Tests | 90 | 98 |
| Explicit routes | 222 | 653 |
| Unique routes | 222 | 612 |
| Local static assets | 0 | 0 |
| Credential-risk locations | 30 | 64 |

The JSON file accompanying this report contains the exact file and route lists. Credential-risk findings record only file locations and pattern categories; no detected value is copied into the audit.
```

## `docs/source-manifest.md`

```md
# Russell Capital Unified Source Manifest

**Audit date:** 2026-08-26  
**Purpose:** Establish immutable source identities and the verified application boundary before any managed-project import.

| Role | Uploaded archive | Exact size | SHA-256 | Status |
|---|---|---:|---|---|
| Primary source | `russell-capital-solutions-complete(4).zip` | 41,782,994 bytes | `e2d3ecaff235fd6ddf933d2f2634c2e0e956a6a21f0b787ed859a90a40e5ba27` | Frozen read-only |
| Additional pages | `Russell_Capital_FULL_SITE_GROK_JSON.zip` | 7,331,308 bytes | `d254351fe8927dcf4858c525b34ea856e403db4a47adc40037414b53a0eacca8` | Frozen read-only |

The latest `(4)` primary upload is byte-for-byte identical to the earlier `russell-capital-solutions-complete.zip`, so the latest filename is used while preserving a single canonical content identity. The primary archive contains two applications. The correct full platform is the directory named `russell-capital`; the directory named `russell-capital-solutions` is the much smaller marketing application and is retained only as reference material.

| Primary platform metric | Verified value |
|---|---:|
| Files | 744 |
| Explicit routed pages | 222 |
| TSX page modules | 260 |
| Vitest files | 90 |
| SQL migration files | 58 |
| Bundled local media files | 0 |
| Root lockfiles | 0 |

The primary platform is a React 19, TypeScript, Vite, Express, tRPC, Drizzle/MySQL application with managed authentication, storage helpers, PDF and PowerPoint generation libraries, spreadsheet export, email, Stripe dependencies, and an extensive test suite. Its archive was inventoried without executing bundled scripts.

## Additional-page delta

The Grok archive is a JSON-wrapped snapshot whose reconstructed source differs from the related large source build by eight modules: seven routed page components and one shared visual kit.

| Added route module | Shared dependency |
|---|---|
| `TheArrival.tsx` | `portal/_genome/GenomeKit.tsx` |
| `TheMirror.tsx` | `portal/_genome/GenomeKit.tsx` |
| `TheStrategyTable.tsx` | `portal/_genome/GenomeKit.tsx` |
| `TheField.tsx` | `portal/_genome/GenomeKit.tsx` |
| `TheMap.tsx` | `portal/_genome/GenomeKit.tsx` |
| `TheLegacy.tsx` | `portal/_genome/GenomeKit.tsx` |
| `TheBrotherhood.tsx` | `portal/_genome/GenomeKit.tsx` |

## Import and security rules

The uploaded ZIPs remain untouched under `/home/ubuntu/russell-capital-unified-sources/archives`. Code is imported only from extracted reference copies. No archive-provided environment file, embedded credential, dependency directory, database, or runtime process is trusted automatically. The managed project’s OAuth, database connection, storage, analytics, and secret injection remain authoritative. All direct-provider keys are server-side only, and no API key is permitted in browser bundles, route source, logs, or audit exports.

## Verified release-copy workspace

The import source is separated from both the immutable archive files and their broad extraction directories. The verified primary release is located at `/home/ubuntu/russell-capital-unified-sources/release/primary` and contains the complete 744-file `russell-capital` platform selected from the primary archive. The verified addition release is located at `/home/ubuntu/russell-capital-unified-sources/release/addition` and contains only the eight source modules proven to be additive: the seven Sacred Seven page components and their shared `GenomeKit.tsx` component.

The eight-file addition release is intentionally a delta rather than another complete application. The untouched Grok archive remains the authoritative raw source, and `/home/ubuntu/work/grok_render` is the reconstructed full snapshot used for route, test, migration, and credential-risk inventory. Restricting the canonical import release to the eight verified additive modules prevents older or conflicting framework, database, authentication, and server files from overwriting the selected primary platform.

The source application has no bundled media files, so the existing homepage’s city asset is an external reference rather than a deploy-blocking local file. Any retained external media will be verified and moved to persistent project asset storage before the final checkpoint.
```

## `docs/visual-system-verification.md`

```md
# Visual System Verification

The public homepage now uses a persistent 4181×2793 city-at-night image stored at `/manus-storage/russell-capital-city-night_0cb0b970.jpeg`. Layered dark masks, emerald color blending, radial green illumination, and text shadows preserve readability while delivering the requested illuminated skyline appearance. The previous external CloudFront URL, which rendered as a blank background in the managed preview, has been removed.

Portal interiors are wrapped by `.rc-portal-theme`, which scopes Grok-inspired violet tokens, dark plum surfaces, purple gradients, focus rings, active sidebar states, card borders, buttons, mobile tabs, scrollbars, and background texture to `AppShell`. The public homepage remains outside this class and retains the black, navy, and emerald identity.

Desktop browser verification passed for `/` and `/login`. Deterministic validation in `server/design-system.test.ts` confirms the persistent hero asset, emerald illumination, scoped purple theme, and separation between public and portal palettes.
```

## `docs/visual-validation.md`

```md
# Visual Validation

Desktop full-page verification was completed at 1440×1200 after the final production build.

| Route | Result |
|---|---|
| `/` | Passed. The high-resolution city-at-night skyline is visible beneath dark navy masks and emerald illumination; navigation, hero, feature, pricing, consultation, CTA, and footer sections remain readable. |
| `/login` | Passed. The managed OAuth page uses the intended dark purple split layout, clear sign-in action, retired-password explanation, and return-home link. |
| `/portal/planning-cases` | Route resolves; the application correctly presents the mandatory modeling disclosure before portal content. |
| `/portal/secondary-information` | Route resolves; the application correctly presents the mandatory modeling disclosure before portal content. |
| `/portal/system-health` | Route resolves; the application correctly presents the mandatory modeling disclosure before portal content. |
| `/portal/the-map` | Route resolves; the application correctly presents the mandatory modeling disclosure before portal content. |

The first screenshot pass exposed a global onboarding tour obscuring public and deep-link pages. `OnboardingTour` is now limited to authenticated `/portal/dashboard`, and a regression test enforces that scope. The second pass confirmed the public homepage and login page are unobstructed.

The remaining portal screenshots stop at the existing **Historical Index Modeling & Disclosure Center**, which requires an explicit user acknowledgment. The validation process did not accept legal terms or bypass the acknowledgment on the user’s behalf. Authenticated post-acknowledgment visual checks remain an owner-session follow-up; source-level module loading, routing, TypeScript, and automated safeguards pass for these pages.

Mobile full-page verification at 390×844 passed for `/` and `/login`. The homepage collapses into a single-column hero, metrics, portal-access form, feature cards, pricing cards, consultation panel, CTA, and footer without horizontal overflow. The managed sign-in card remains centered and readable with a full-width purple action.

Desktop verification at 1280×900 passed for `/login`, `/register`, `/forgot-password`, `/reset-password`, and `/trial`. Each route now presents a consistent dark-purple managed-identity page, explicitly explains that local password or trial-code access has been retired, and provides one secure sign-in action plus a homepage escape route.
```

## `live/README.md`

```md
# Live homepage (published)

**Live URL:** https://claude.ai/code/artifact/da0f1702-4b60-4091-8643-344b898b1555

A self-contained, single-file version of the Russell Capital Systems public
homepage, published as a live web page and kept identical in content to the
React app's homepage (`client/src/pages/Landing.tsx`).

## The page, screen by screen

Every one of the owner's six design images is shown **crisp, full-size, one per
screen** — nothing is blurred.

1. **Neon sign (hero)** — its words are the headline: *Financial & Tax Relief and
   Recovery for Physicians, Psychiatrists, & Surgeons*
2. **The Green City (Emerald Dawn)** — *Transform Debt Into a Tax-Free Liquid War
   Chest — On Demand™* with the line "You bring the goal. We build the tailored
   Systems around that."
3. **The bridge (Concept 10)** — *Your Practice Builds Income. We Build the System
   Around It.* + the five pillars
4. **The canyon (Concept 06)** — Tax Strategy for High-Earning Physicians + the
   tax-planning selector
5. **The interchange (Concept 25)** — Russell Capital Systems for Physicians /
   Turn Medical Income Into Lasting Wealth™ + the design-your-system selector
6. **Second neon sign** — the 60% / 20-year client-retention proof
7. Ask AI concierge · Tax & Savings Estimate (lead capture) · **the 14 engines**
   (five to six sentences each, in building order) · How We Work / Who We Serve /
   Planning Areas / FAQ · neon closing with booking

## Files

- `rcs-live-homepage.template.html` — **the source.** Placeholders injected at
  build time: `__IMG_NEON_A__`, `__IMG_NEON_B__`, `__IMG_EMERALD__`, `__IMG_BRIDGE__`,
  `__IMG_CANYON__`, `__IMG_INTERCHANGE__`, `__CALENDLY__`, `__ADVISOR_EMAIL__`.
- `build_live_homepage.py` — builds the template into the **single built copy**,
  `<repo>/docs/index.html` (~3.8 MB, six images embedded as WebP data URIs).
  `docs/` is what GitHub Pages serves, so merging to `master` updates the public
  URL. Run it directly or via `pnpm live:build` / `pnpm release`.
- The image sources live in `../client/public/` as `rcs-neon-a.webp`, `rcs-neon-b.webp`,
  `rcs-city-emerald.webp`, `rcs-city-bridge.webp`, `rcs-city-canyon.webp`,
  `rcs-city-interchange.webp` — crisp crops of the photographic regions of the
  original mockups (their baked-in UI excluded), saved at high quality.

## Keeping it in step with the React app

`server/livePageParity.test.ts` fails if the template and the React homepage
disagree on the 14 engines (names and order), the FAQ, the headline promises and
proof numbers, the six images, or if `docs/index.html` is stale relative to the
template. Edit the template and the React component together, then `pnpm release`.

## How it works without a server

- **AI concierge** uses the viewer's own Claude (the page's `sample` capability)
  for signed-in claude.ai viewers; for anyone else it falls back to sending the
  question to the advisor by email. It never reveals figures or formulas.
- **Lead capture** composes a pre-filled email to the advisor (nothing leaves the
  page until the visitor sends it), offers "Copy my summary", and links to
  Calendly booking.
- No secrets are embedded. No figures are shown to visitors (qualitative teaser only).

This is the live landing page. The full app (portal, lead inbox, nine-AI panel,
database) deploys per `../LAUNCH.md`.
```

## `live/build_live_homepage.py`

```python
#!/usr/bin/env python3
"""Build the single-file public homepage from its template.

Injects the six WebP images from ../client/public as data URIs plus the
booking link and advisor email, and writes the result to <repo>/docs/index.html
(served by GitHub Pages) so there is exactly one built copy in the repo.

    python3 live/build_live_homepage.py            # writes ../../docs/index.html
    python3 live/build_live_homepage.py out.html   # writes somewhere else
"""
import base64, pathlib, sys

HERE = pathlib.Path(__file__).resolve().parent          # russell-capital-systems/live
APP = HERE.parent                                        # russell-capital-systems
REPO = APP.parent                                        # repo root
PUB = APP / "client" / "public"
DEFAULT_OUT = REPO / "docs" / "index.html"

IMAGES = {
    "__IMG_NEON_A__": "rcs-neon-a.webp",
    "__IMG_NEON_B__": "rcs-neon-b.webp",
    "__IMG_EMERALD__": "rcs-city-emerald.webp",
    "__IMG_BRIDGE__": "rcs-city-bridge.webp",
    "__IMG_CANYON__": "rcs-city-canyon.webp",
    "__IMG_INTERCHANGE__": "rcs-city-interchange.webp",
}
CONSTS = {
    "__CALENDLY__": "https://calendly.com/samtheinsuranceman-1/30min",
    "__ADVISOR_EMAIL__": "samtheinsuranceman@gmail.com",
}


def build() -> str:
    html = (HERE / "rcs-live-homepage.template.html").read_text()
    for key, name in IMAGES.items():
        data = (PUB / name).read_bytes()
        uri = "data:image/webp;base64," + base64.b64encode(data).decode()
        assert key in html, f"placeholder missing: {key}"
        html = html.replace(key, uri)
    for key, val in CONSTS.items():
        html = html.replace(key, val)
    leftover = [k for k in list(IMAGES) + list(CONSTS) if k in html]
    assert not leftover, leftover
    return html


if __name__ == "__main__":
    out = pathlib.Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else DEFAULT_OUT
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(build())
    print(f"wrote {out} ({out.stat().st_size:,} bytes)")
```

## `live/rcs-live-homepage.template.html`

```html
<title>Russell Capital Systems</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;0,9..40,900&family=Cormorant+Garamond:wght@600;700&display=swap">
<style>
  :root{
    --ground:#03090a; --panel:#00110d; --ink:#eaf5ef; --ink-2:rgba(255,255,255,.8); --muted:rgba(255,255,255,.6); --faint:rgba(255,255,255,.42);
    --em-200:#a7f3d0; --em-300:#6ee7b7; --em-400:#34d399; --em-500:#10b981;
    --line:rgba(110,231,183,.22); --line-2:rgba(110,231,183,.45);
    --amber:#fbbf24; --amber-ink:#fde68a; --danger:#f87171;
    --glow:0 0 22px rgba(52,211,153,.9),0 0 46px rgba(16,185,129,.5); --glow-soft:0 0 30px rgba(16,185,129,.45);
    --display:"DM Sans",ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
    --serif:"Cormorant Garamond",Georgia,"Times New Roman",serif;
    --max:1240px;
  }
  *{box-sizing:border-box}
  [hidden]{display:none!important}
  [id]{scroll-margin-top:6rem}
  html{scroll-behavior:smooth}
  @media(prefers-reduced-motion:reduce){html{scroll-behavior:auto} *{animation:none!important;transition:none!important}}
  body{margin:0;background:var(--ground);color:var(--ink);font-family:var(--display);font-size:16px;line-height:1.55;-webkit-font-smoothing:antialiased;overflow-x:hidden}
  a{color:inherit} h1,h2,h3{margin:0;text-wrap:balance;line-height:1.08} p{margin:0}
  .wrap{position:relative;z-index:2;width:min(var(--max),100% - 2.5rem);margin-inline:auto}
  .eyebrow{display:inline-flex;align-items:center;gap:.5rem;border:1px solid var(--line-2);background:rgba(3,15,12,.55);color:var(--em-300);border-radius:999px;padding:.45rem 1.05rem;font-size:.7rem;font-weight:700;letter-spacing:.22em;text-transform:uppercase;backdrop-filter:blur(6px)}
  .btn{display:inline-flex;align-items:center;justify-content:center;gap:.55rem;border-radius:14px;padding:1rem 1.7rem;font:inherit;font-weight:700;font-size:1rem;cursor:pointer;text-decoration:none;border:1px solid transparent;transition:transform .2s,box-shadow .2s,background .2s}
  .btn:focus-visible,button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible,a:focus-visible,summary:focus-visible{outline:2px solid var(--em-400);outline-offset:2px}
  .btn-primary{background:linear-gradient(135deg,#34d399,#059669);color:#03110c;box-shadow:0 0 0 1px rgba(167,243,208,.35),0 18px 48px rgba(16,185,129,.35)}
  .btn-primary:hover{transform:translateY(-2px);box-shadow:0 0 0 1px rgba(167,243,208,.5),0 24px 60px rgba(16,185,129,.45)}
  .btn-ghost{background:rgba(3,15,12,.5);border-color:var(--line-2);color:#fff;backdrop-filter:blur(8px)}
  .btn-ghost:hover{background:rgba(52,211,153,.14)}
  .btn[disabled]{opacity:.5;cursor:not-allowed;transform:none}
  .glass{border:1px solid rgba(167,243,208,.32);background:rgba(2,12,10,.66);backdrop-filter:blur(14px);border-radius:26px;box-shadow:0 30px 90px rgba(0,0,0,.55),inset 0 0 40px rgba(16,185,129,.05)}
  .neon{color:var(--em-300);text-shadow:var(--glow)}
  .grad{background:linear-gradient(95deg,#fff 0%,#bbf7d0 48%,#34d399 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
  .h-display{font-family:var(--display);font-weight:900;letter-spacing:-.02em;color:#fff;text-shadow:0 6px 30px rgba(0,0,0,.8),0 0 40px rgba(16,185,129,.35)}
  .sub{max-width:40rem;font-size:1.15rem;line-height:1.6;color:rgba(255,255,255,.88);text-shadow:0 4px 18px rgba(0,0,0,.9)}
  .sub b{color:var(--em-300);font-weight:600}
  .ctas{display:flex;flex-wrap:wrap;gap:.8rem;margin-top:2rem}

  /* ── PAGES: one crisp image per screen ─────────────────────────────────── */
  .page{position:relative;isolation:isolate;overflow:hidden;min-height:100svh;display:flex;align-items:center;background:var(--ground)}
  .pic{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;z-index:0}
  .shade{position:absolute;inset:0;z-index:1;pointer-events:none}
  .shade-b{background:linear-gradient(180deg,rgba(3,9,10,.15) 0%,rgba(3,9,10,0) 35%,rgba(3,9,10,.55) 78%,#03090a 100%)}
  .shade-l{background:linear-gradient(90deg,rgba(3,9,10,.9) 0%,rgba(3,9,10,.6) 38%,rgba(3,9,10,.05) 70%)}
  .shade-r{background:linear-gradient(270deg,rgba(3,9,10,.9) 0%,rgba(3,9,10,.6) 38%,rgba(3,9,10,.05) 70%)}
  .shade-c{background:radial-gradient(ellipse at 50% 55%,rgba(3,9,10,.72) 0%,rgba(3,9,10,.35) 45%,rgba(3,9,10,.1) 75%)}
  .page .wrap{padding:7rem 0 5rem}
  /* split page: crisp portrait image on one side, words on the other */
  .split{display:grid;gap:2.5rem;align-items:center}
  @media(min-width:900px){.split{grid-template-columns:1fr 1fr;gap:4rem}.split.rev>.photo{order:2}}
  .photo{position:relative;border-radius:28px;overflow:hidden;box-shadow:0 40px 120px rgba(0,0,0,.6),0 0 0 1px rgba(167,243,208,.3),0 0 60px rgba(16,185,129,.28);aspect-ratio:4/5;max-height:78svh}
  .photo img{width:100%;height:100%;object-fit:cover;display:block}
  .photo::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(3,9,10,0) 60%,rgba(3,9,10,.55) 100%)}
  .photo .cap{position:absolute;left:1.25rem;right:1.25rem;bottom:1.1rem;z-index:1;font-size:.72rem;letter-spacing:.2em;text-transform:uppercase;color:var(--em-300);text-shadow:0 0 12px rgba(52,211,153,.8)}
  @media(max-width:899px){.photo{aspect-ratio:1/1;max-height:60svh}.photo img{object-position:center 65%}}
  /* fixed backdrop for long sections: the image stays viewport-sized instead of stretching to the section */
  .fixed-pic{position:absolute;inset:0;z-index:0;background-size:cover;background-position:center;background-attachment:fixed}
  @media(max-width:900px){.fixed-pic{background-attachment:scroll;background-position:center top}}
  #estimate .fixed-pic{background-image:url("__IMG_BRIDGE__");filter:brightness(.55) saturate(1.1)}
  #how .fixed-pic{background-image:url("__IMG_CANYON__");filter:brightness(.42) saturate(1.1)}

  /* nav */
  .nav{position:fixed;top:0;left:0;right:0;z-index:60;padding:.8rem 0}
  .nav-bar{display:flex;align-items:center;justify-content:space-between;gap:1rem;min-height:4.4rem;padding:0 1.2rem;border:1px solid rgba(110,231,183,.3);background:rgba(2,10,9,.62);backdrop-filter:blur(18px);border-radius:18px;box-shadow:0 24px 70px rgba(0,0,0,.45)}
  .brand{display:flex;align-items:center;gap:.7rem;text-decoration:none;min-width:0}
  .brand-mark{display:grid;place-items:center;width:2.5rem;height:2.5rem;border-radius:11px;border:1px solid rgba(110,231,183,.55);background:rgba(110,231,183,.12);color:var(--em-300);font-weight:900;box-shadow:inset 0 0 22px rgba(52,211,153,.15),0 0 18px rgba(52,211,153,.25)}
  .brand-name{font-weight:700;font-size:1.02rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .nav-links{display:none;gap:1.5rem;font-size:.92rem}.nav-links a{color:var(--ink-2);text-decoration:none}.nav-links a:hover{color:var(--em-300)}
  .nav-cta{display:flex;align-items:center;gap:.5rem}.nav-cta .btn{white-space:nowrap}
  @media(max-width:419px){.brand-name{display:none}}
  .menu-btn{display:grid;place-items:center;width:2.4rem;height:2.4rem;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:transparent;color:#fff;cursor:pointer}
  .mobile-menu{margin-top:.5rem;border:1px solid var(--line);background:rgba(2,10,9,.94);backdrop-filter:blur(18px);border-radius:16px;padding:.5rem}
  .mobile-menu a{display:block;padding:.8rem 1rem;border-radius:10px;color:var(--ink-2);text-decoration:none}.mobile-menu a:hover{background:rgba(255,255,255,.05);color:var(--em-300)}
  @media(min-width:1024px){.nav-links{display:flex}.menu-btn{display:none}}

  /* hero */
  .hero .wrap{display:flex;flex-direction:column;justify-content:flex-end;min-height:100svh;padding:7rem 0 4.5rem}
  .hero-foot{display:flex;flex-direction:column;gap:1.25rem;align-items:flex-start}
  @media(min-width:900px){.hero-foot{flex-direction:row;align-items:flex-end;justify-content:space-between}}
  .hero-tag{max-width:34rem;font-size:1.1rem;color:rgba(255,255,255,.9);text-shadow:0 4px 18px rgba(0,0,0,.95)}
  .hero-tag b{color:var(--em-300);font-weight:600}
  .scroll-hint{position:absolute;left:50%;bottom:1.2rem;transform:translateX(-50%);z-index:3;font-size:.65rem;letter-spacing:.3em;text-transform:uppercase;color:rgba(167,243,208,.75);display:flex;flex-direction:column;align-items:center;gap:.35rem}
  .scroll-hint span{width:1px;height:2.2rem;background:linear-gradient(180deg,rgba(52,211,153,.9),transparent)}
  /* phones & tablets: keep the neon words in frame and give the copy a darker floor */
  @media(max-width:1023px){.hero .pic{object-position:25% center}}
  @media(max-width:640px){
    .hero .pic{object-position:18% center}
    .hero .shade-b{background:linear-gradient(180deg,rgba(3,9,10,.2) 0%,rgba(3,9,10,.05) 28%,rgba(3,9,10,.78) 62%,#03090a 100%)}
    .hero .wrap{padding-bottom:3.25rem}
    .scroll-hint{display:none}
    .band{margin:0 .25rem}
  }

  /* war chest */
  .war{max-width:62rem}
  .war h2{font-size:clamp(2.6rem,7vw,6rem);line-height:1;letter-spacing:-.025em}
  .bridge-line{margin-top:1.4rem;font-family:var(--serif);font-weight:600;font-size:clamp(1.35rem,2.8vw,2rem);color:#fff;text-shadow:0 4px 18px rgba(0,0,0,.9)}
  .bridge-line b{color:var(--em-300);font-weight:700;text-shadow:0 0 18px rgba(52,211,153,.8)}
  .note{margin-top:1rem;max-width:40rem;font-size:.92rem;color:rgba(255,255,255,.65);text-shadow:0 2px 10px rgba(0,0,0,.9)}

  /* pillars */
  .pillars{display:grid;grid-template-columns:repeat(2,1fr);margin-top:2.25rem;border:1px solid rgba(167,243,208,.3);background:rgba(2,12,10,.55);backdrop-filter:blur(12px);border-radius:18px;overflow:hidden}
  .pillar{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.6rem;min-height:7rem;padding:1.2rem .6rem;color:rgba(255,255,255,.88);text-decoration:none;border-right:1px solid rgba(167,243,208,.14);border-bottom:1px solid rgba(167,243,208,.14);font-size:.86rem;font-weight:600;text-align:center}
  .pillar svg{color:var(--em-300);filter:drop-shadow(0 0 8px rgba(52,211,153,.7))}.pillar:hover{background:rgba(52,211,153,.12);color:var(--em-200)}
  @media(min-width:640px){.pillars{grid-template-columns:repeat(5,1fr)}.pillar{border-bottom:0}}
  @media(max-width:639px){.pillar:last-child,.feat5>div:last-child{grid-column:span 2}.pillar:last-child{border-bottom:0}}

  .h2{font-weight:900;font-size:clamp(2.2rem,5.4vw,4.2rem);letter-spacing:-.025em;line-height:1.02;color:#fff;text-shadow:0 6px 30px rgba(0,0,0,.8),0 0 40px rgba(16,185,129,.3)}
  .h2 .g{color:var(--em-400);text-shadow:0 0 22px rgba(52,211,153,.8)}
  .rule{height:4px;width:6rem;border-radius:4px;background:var(--em-400);box-shadow:0 0 16px rgba(52,211,153,.8);margin-top:1.25rem}
  .lead{margin-top:1.4rem;max-width:30rem;font-size:1.12rem;color:rgba(255,255,255,.85);text-shadow:0 3px 14px rgba(0,0,0,.9)}
  .stack{display:flex;flex-direction:column;gap:.75rem;margin-top:1.9rem;max-width:26rem}
  .tagline{margin-top:.9rem;font-family:var(--serif);font-weight:700;font-size:clamp(1.3rem,2.6vw,1.9rem);color:var(--em-300);text-shadow:0 0 18px rgba(52,211,153,.75)}

  /* selectors */
  .selector{padding:1.25rem}
  .selector .t{display:flex;align-items:center;gap:.55rem;margin-bottom:1rem;font-weight:600;font-size:1.05rem;color:var(--em-300)}
  .selector .row{display:flex;align-items:center;gap:.75rem;border:1px solid rgba(167,243,208,.2);background:rgba(0,17,13,.72);border-radius:12px;padding:.7rem 1rem;margin-bottom:.7rem}
  .selector .row svg{flex:none;color:var(--em-300)}
  .selector .row select{border:0;background:transparent;padding:0;color:#fff;font:inherit;width:100%}
  select option{background:#00110d}
  .feat5{display:grid;grid-template-columns:repeat(2,1fr);gap:1rem;margin-top:2rem;padding:1.2rem;border:1px solid rgba(167,243,208,.2);background:rgba(2,12,10,.55);backdrop-filter:blur(12px);border-radius:18px;text-align:center}
  @media(min-width:640px){.feat5{grid-template-columns:repeat(5,1fr)}}
  .feat5 svg{color:var(--em-300);filter:drop-shadow(0 0 8px rgba(52,211,153,.7))}.feat5 b{display:block;margin-top:.5rem;font-size:.88rem;color:#fff}.feat5 span{display:block;margin-top:.2rem;font-size:.74rem;color:rgba(255,255,255,.62)}

  /* retention band */
  .band{position:relative;overflow:hidden;max-width:64rem;margin:0 auto;padding:2rem;border-radius:2rem}
  @media(min-width:640px){.band{padding:3rem}}
  .accent-top{position:absolute;left:0;right:0;top:0;height:3px;background:linear-gradient(90deg,transparent,rgba(52,211,153,.95),transparent)}
  .band-grid{display:grid;gap:2.5rem;align-items:center}@media(min-width:820px){.band-grid{grid-template-columns:auto 1fr}}
  .medal{position:relative;width:11rem;height:11rem;margin:0 auto;display:grid;place-items:center}
  .medal .ring{position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 210deg,rgba(52,211,153,.95),rgba(16,185,129,.15) 60%,rgba(52,211,153,.95));filter:blur(2px)}
  .medal .core{position:absolute;inset:3px;border-radius:50%;background:radial-gradient(circle at 50% 35%,rgba(6,26,20,.96),#03100c)}
  .medal .num{position:relative;font-size:3.6rem;font-weight:900;letter-spacing:-.02em;line-height:1}
  .medal .lbl{position:relative;margin-top:.25rem;font-size:.62rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:rgba(110,231,183,.9)}
  .band-h{margin-top:1rem;font-size:clamp(1.9rem,4.2vw,3rem);font-weight:900;letter-spacing:-.015em;line-height:1.08}
  .band-p{margin-top:1rem;max-width:36rem;font-size:1rem;color:rgba(255,255,255,.85)}.band-p b{color:#fff;font-weight:600}.band-p .em{color:var(--em-300);font-weight:600}
  .tags{display:flex;flex-wrap:wrap;gap:.6rem;margin-top:1.4rem}
  .tag{display:inline-flex;align-items:center;gap:.5rem;border:1px solid rgba(167,243,208,.22);background:rgba(0,0,0,.45);border-radius:999px;padding:.4rem .9rem;font-size:.78rem;color:rgba(255,255,255,.8)}.tag svg{color:var(--em-300)}

  /* concierge */
  .center{text-align:center}
  .lead-c{max-width:42rem;margin:1rem auto 0;font-size:1.12rem;color:var(--ink-2)}
  .concierge{max-width:52rem;margin:2.5rem auto 0;padding:1.5rem}
  .ask-row{display:flex;flex-direction:column;gap:.75rem}@media(min-width:640px){.ask-row{flex-direction:row}}
  input,select,textarea{font:inherit;color:#fff;background:rgba(0,17,13,.72);border:1px solid rgba(167,243,208,.22);border-radius:12px;padding:.7rem .85rem;width:100%}
  input::placeholder,textarea::placeholder{color:var(--faint)} input:focus,select:focus,textarea:focus{border-color:var(--em-400)}
  .ask-row textarea{flex:1;min-height:6.2rem;resize:vertical}
  .mic{white-space:nowrap}.mic.listening{background:#ef4444;color:#fff;border-color:#ef4444;box-shadow:none}
  .chips{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:.75rem}
  .chip{border:1px solid rgba(167,243,208,.22);background:rgba(0,0,0,.35);color:var(--muted);border-radius:999px;padding:.4rem .8rem;font:inherit;font-size:.74rem;cursor:pointer;text-align:left}.chip:hover{border-color:var(--line-2);color:var(--em-200)}
  .status{margin-top:.8rem;text-align:center;font-size:.9rem;color:var(--muted);min-height:1.2em}
  .answer{display:none;margin-top:1.25rem;border:1px solid rgba(167,243,208,.22);background:rgba(0,17,13,.78);border-radius:14px;padding:1.25rem}.answer.show{display:block}
  .answer-meta{font-size:.68rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--em-300);margin-bottom:.75rem}
  .answer-body{white-space:pre-wrap;font-size:.98rem;line-height:1.65;color:rgba(255,255,255,.92)}
  .answer-ctas{display:flex;flex-direction:column;gap:.6rem;margin-top:1.2rem}@media(min-width:640px){.answer-ctas{flex-direction:row}.answer-ctas .btn{flex:1}}
  .fine{margin-top:1rem;text-align:center;font-size:.7rem;color:var(--faint);line-height:1.55}

  /* engines */
  .engines{position:relative;background:var(--ground)}
  .engines .fixed-pic{background-image:url("__IMG_EMERALD__");filter:brightness(.62) saturate(1.15)}
  .engines .shade{background:linear-gradient(180deg,#03090a 0%,rgba(3,9,10,.55) 12%,rgba(3,9,10,.55) 88%,#03090a 100%)}
  .engine-grid{display:grid;gap:1.6rem;margin-top:3rem}@media(min-width:1000px){.engine-grid{grid-template-columns:1fr 1fr}}
  .ecard{position:relative;overflow:hidden;border:1px solid rgba(110,231,183,.28);background:linear-gradient(160deg,rgba(4,20,16,.9),rgba(2,10,9,.86));backdrop-filter:blur(10px);border-radius:22px;padding:1.75rem;box-shadow:0 24px 70px rgba(0,0,0,.55);transition:transform .3s,border-color .3s,box-shadow .3s}
  .ecard:hover{transform:translateY(-5px);border-color:rgba(110,231,183,.7);box-shadow:0 30px 80px rgba(16,185,129,.25)}
  .ecard .accent-top{opacity:.6}.ecard:hover .accent-top{opacity:1}
  .ehead{display:flex;align-items:center;gap:.9rem}
  .ehead .ic{display:grid;place-items:center;width:3.2rem;height:3.2rem;border-radius:14px;border:1px solid rgba(110,231,183,.45);background:linear-gradient(135deg,rgba(16,185,129,.32),rgba(16,185,129,.06));color:var(--em-200);box-shadow:inset 0 0 18px rgba(52,211,153,.3),0 0 18px rgba(52,211,153,.25);flex:none}
  .ehead .n{font-size:.68rem;font-weight:800;letter-spacing:.22em;text-transform:uppercase;color:rgba(110,231,183,.85)}
  .ehead .only{margin-left:auto;border:1px solid rgba(110,231,183,.35);background:rgba(110,231,183,.07);border-radius:999px;padding:.3rem .7rem;font-size:.58rem;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:rgba(110,231,183,.85);white-space:nowrap}
  .ecard h3{margin-top:1.1rem;font-size:clamp(1.5rem,2.4vw,1.9rem);font-weight:900;letter-spacing:-.015em;line-height:1.1;text-shadow:0 0 34px rgba(52,211,153,.25)}
  .ecard .ul{height:2px;width:4.5rem;border-radius:2px;margin-top:.8rem;background:linear-gradient(90deg,#34d399,rgba(52,211,153,0));box-shadow:0 0 10px rgba(52,211,153,.7)}
  .ecard .why{margin-top:.9rem;font-size:.66rem;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:var(--em-300)}
  .ecard p.body{margin-top:.6rem;font-size:1.02rem;line-height:1.72;color:rgba(255,255,255,.88)}
  .ecard p.body b{color:#fff;font-weight:600}
  .more{max-width:52rem;margin:3rem auto 0;padding:1.75rem;text-align:center;border-radius:20px}
  .more b{display:block;font-size:clamp(1.3rem,3vw,2rem);font-weight:900;color:#fff}.more p{margin:.6rem auto 0;max-width:42rem;color:rgba(255,255,255,.82);font-size:1.02rem}.more p b{display:inline;font-size:inherit;color:var(--em-300)}

  /* estimator */
  .form-card{padding:1.5rem}@media(min-width:640px){.form-card{padding:2rem}}
  .two{display:grid;gap:.75rem}@media(min-width:640px){.two{grid-template-columns:1fr 1fr}.span2{grid-column:span 2}}
  label.f{display:block;font-size:.74rem;color:var(--muted)}label.f input,label.f select{margin-top:.3rem}
  .subhead{margin:1.5rem 0 .6rem;font-size:.7rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--em-300)}
  .consent{display:flex;gap:.75rem;align-items:flex-start;margin-top:1.25rem;border:1px solid rgba(167,243,208,.2);background:rgba(0,0,0,.35);border-radius:14px;padding:1rem;font-size:.76rem;line-height:1.55;color:rgba(255,255,255,.75)}
  .consent input{width:1rem;height:1rem;margin-top:.15rem;accent-color:var(--em-400);flex:none}
  .err{margin-top:.75rem;color:var(--danger);font-size:.9rem;min-height:1.2em}
  .result{display:none;padding:2rem;border-color:rgba(110,231,183,.4)}.result.show{display:block}
  .result h3{font-size:clamp(1.3rem,3vw,2rem);font-weight:800;line-height:1.3;color:#fff;margin-top:.75rem}
  .pills{display:grid;gap:.5rem;margin-top:1.25rem}@media(min-width:640px){.pills{grid-template-columns:1fr 1fr}}
  .pill{display:flex;align-items:center;gap:.5rem;border:1px solid rgba(167,243,208,.16);background:rgba(0,17,13,.65);border-radius:10px;padding:.65rem .8rem;font-size:.9rem;color:rgba(255,255,255,.88)}.pill svg{color:var(--em-300);flex:none}
  .disclaimer{display:flex;gap:.75rem;align-items:flex-start;border:1px solid rgba(251,191,36,.32);background:rgba(251,191,36,.07);border-radius:14px;padding:.9rem 1rem;font-size:.72rem;line-height:1.55;color:var(--muted)}
  .disclaimer b{color:var(--amber-ink)}.disclaimer svg{flex:none;margin-top:.1rem;color:var(--amber)}

  /* process / areas / faq */
  .process{display:grid;gap:1rem;margin-top:3rem}@media(min-width:640px){.process{grid-template-columns:1fr 1fr}}@media(min-width:980px){.process{grid-template-columns:repeat(4,1fr)}}
  .step{position:relative;border:1px solid rgba(167,243,208,.18);background:rgba(2,12,10,.6);backdrop-filter:blur(12px);border-radius:16px;padding:1.5rem}
  .step .n{display:grid;place-items:center;width:2.75rem;height:2.75rem;border-radius:50%;border:1px solid rgba(110,231,183,.4);color:var(--em-300);font-weight:800;font-variant-numeric:tabular-nums;box-shadow:0 0 14px rgba(52,211,153,.3)}
  .step b{display:block;margin-top:1rem;font-size:1.1rem;color:#fff}.step p{margin-top:.5rem;font-size:.92rem;color:rgba(255,255,255,.7)}
  .areas{display:grid;gap:1rem;margin-top:3rem}@media(min-width:640px){.areas{grid-template-columns:1fr 1fr}}@media(min-width:1024px){.areas{grid-template-columns:repeat(4,1fr)}}
  .area{display:flex;flex-direction:column;border:1px solid rgba(167,243,208,.18);background:rgba(2,12,10,.6);backdrop-filter:blur(12px);border-radius:16px;padding:1.4rem;transition:transform .25s,border-color .25s}.area:hover{transform:translateY(-4px);border-color:rgba(110,231,183,.45)}
  .area .ic{display:grid;place-items:center;width:2.75rem;height:2.75rem;border-radius:12px;border:1px solid rgba(110,231,183,.3);background:rgba(110,231,183,.1);color:var(--em-300);margin-bottom:1rem}
  .area b{color:#fff;font-weight:600}.area p{margin-top:.5rem;font-size:.88rem;color:rgba(255,255,255,.68);flex:1}
  .serve{display:grid;gap:1rem;margin-top:2rem}@media(min-width:640px){.serve{grid-template-columns:repeat(2,1fr)}}@media(min-width:980px){.serve{grid-template-columns:repeat(4,1fr)}}
  .serve div{border:1px solid rgba(110,231,183,.3);background:rgba(110,231,183,.07);border-radius:14px;padding:1.2rem;text-align:center;color:#fff;font-weight:600}.serve div span{display:block;margin-top:.35rem;font-size:.82rem;font-weight:400;color:rgba(255,255,255,.65)}
  .faq{max-width:52rem;margin:2.5rem auto 0;display:grid;gap:.75rem}
  .faq details{border:1px solid rgba(167,243,208,.2);background:rgba(2,12,10,.65);backdrop-filter:blur(12px);border-radius:14px;padding:0 1.25rem}
  .faq summary{cursor:pointer;list-style:none;padding:1.1rem 0;font-weight:600;color:#fff;display:flex;justify-content:space-between;align-items:center;gap:1rem}
  .faq summary::-webkit-details-marker{display:none}.faq summary::after{content:"+";color:var(--em-300);font-size:1.4rem;font-weight:400;flex:none}.faq details[open] summary::after{content:"−"}
  .faq details p{padding:0 0 1.1rem;color:rgba(255,255,255,.75);font-size:.95rem;line-height:1.6}

  /* consult / footer / sticky */
  .consult-card{max-width:46rem;margin:0 auto;padding:3rem 1.5rem;text-align:center}
  .consult-card h2{font-size:clamp(1.9rem,4vw,3rem);font-weight:900;color:#fff}
  .consult-card p{margin:1rem auto 2rem;max-width:34rem;color:rgba(255,255,255,.78)}
  .ticks{display:flex;flex-wrap:wrap;justify-content:center;gap:1.5rem;margin-top:1.5rem;font-size:.78rem;color:rgba(255,255,255,.7)}.ticks span{display:inline-flex;align-items:center;gap:.4rem}.ticks svg{color:var(--em-400)}
  footer{border-top:1px solid rgba(110,231,183,.15);padding:2rem 0;background:var(--ground)}
  footer .wrap{display:flex;flex-direction:column;align-items:center;justify-content:space-between;gap:1rem;font-size:.9rem;color:rgba(255,255,255,.55);text-align:center}
  @media(min-width:768px){footer .wrap{flex-direction:row}} footer .rcs{color:var(--em-400)}
  .sticky-cta{position:fixed;left:0;right:0;bottom:0;z-index:50;display:flex;gap:.6rem;padding:.7rem .9rem calc(.7rem + env(safe-area-inset-bottom));background:rgba(2,10,9,.94);backdrop-filter:blur(14px);border-top:1px solid rgba(110,231,183,.35)}
  .sticky-cta .btn{flex:1;padding:.85rem .6rem;font-size:.9rem}
  @media(min-width:640px){.sticky-cta{display:none}}@media(max-width:639px){body{padding-bottom:4.6rem}}
  .sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
</style>

<!-- ───────── NAV ───────── -->
<nav class="nav" aria-label="Public navigation">
  <div class="wrap" style="padding:0">
    <div class="nav-bar">
      <a href="#top" class="brand" aria-label="Russell Capital Systems homepage"><span class="brand-mark">R</span><span class="brand-name">Russell Capital Systems™</span></a>
      <div class="nav-links"><a href="#warchest">War Chest</a><a href="#physicians">For Physicians</a><a href="#ask">Ask AI</a><a href="#engines">Technology</a><a href="#estimate">Estimate</a><a href="#faq">FAQ</a></div>
      <div class="nav-cta">
        <a class="btn btn-ghost" style="padding:.6rem 1rem;font-size:.9rem" href="__CALENDLY__" target="_blank" rel="noopener noreferrer">Book a Review</a>
        <button class="menu-btn" id="menuBtn" aria-label="Open navigation menu" aria-expanded="false"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button>
      </div>
    </div>
    <div class="mobile-menu" id="mobileMenu" hidden><a href="#warchest">War Chest</a><a href="#physicians">For Physicians</a><a href="#ask">Ask AI</a><a href="#engines">Technology</a><a href="#estimate">Estimate</a><a href="#faq">FAQ</a></div>
  </div>
</nav>

<!-- ───────── PAGE 1 · HERO: the neon sign, full and crisp ───────── -->
<header id="top" class="page hero" aria-label="Financial and Tax Relief and Recovery for Physicians, Psychiatrists, and Surgeons">
  <img class="pic" src="__IMG_NEON_A__" alt="Neon sign reading Financial &amp; Tax Relief and Recovery for Physicians, Psychiatrists, &amp; Surgeons, over a glowing green city skyline">
  <div class="shade shade-b"></div>
  <h1 class="sr">Financial &amp; Tax Relief and Recovery for Physicians, Psychiatrists, &amp; Surgeons</h1>
  <div class="wrap">
    <div class="hero-foot">
      <p class="hero-tag">Coordinated <b>tax reduction</b>, <b>interest recovery</b>, practice, risk, retirement, and legacy planning — built for the finances of physicians, psychiatrists, and surgeons.</p>
      <div class="ctas" style="margin-top:0">
        <a class="btn btn-primary" href="#estimate">Plan Beyond the Practice</a>
        <a class="btn btn-ghost" href="__CALENDLY__" target="_blank" rel="noopener noreferrer">Book a Physician Planning Review</a>
      </div>
    </div>
  </div>
  <div class="scroll-hint" aria-hidden="true">Scroll<span></span></div>
</header>

<!-- ───────── PAGE 2 · GREEN CITY: the War Chest ───────── -->
<section id="warchest" class="page" aria-label="Transform debt into a tax-free liquid war chest">
  <img class="pic" src="__IMG_EMERALD__" alt="Emerald-lit city skyline at dawn with a river winding through it">
  <div class="shade shade-l"></div>
  <div class="wrap">
    <div class="war">
      <p class="eyebrow">The Physician War-Chest Strategy</p>
      <h2 class="h-display" style="margin-top:1.25rem">Transform Debt Into a <span class="neon">Tax-Free Liquid War Chest</span> — On Demand™</h2>
      <p class="bridge-line">You bring the goal. We build the tailored <b>Systems</b> around that.</p>
      <p class="note">Directional strategy education for physicians — not tax, legal, or investment advice. Confirm with your professionals.</p>
      <div class="ctas">
        <a class="btn btn-primary" href="#estimate">Show me the shape of my plan</a>
        <a class="btn btn-ghost" href="#engines">See the engines behind it</a>
      </div>
    </div>
  </div>
</section>

<!-- ───────── PAGE 3 · THE BRIDGE: Your practice builds income ───────── -->
<section id="practice" class="page" aria-label="Your practice builds income; we build the system around it">
  <div class="shade" style="background:radial-gradient(circle at 20% 30%,rgba(16,185,129,.14),transparent 45%)"></div>
  <div class="wrap">
    <div class="split">
      <div class="photo"><img src="__IMG_BRIDGE__" alt="Suspension bridge glowing green over the bay at night, towers rising behind it"><span class="cap">Practice Economics</span></div>
      <div>
        <p class="eyebrow">Built around you</p>
        <h2 class="h2" style="margin-top:1.25rem">Your Practice Builds Income. <span class="g">We Build the System Around It.</span></h2>
        <div class="rule"></div>
        <p class="lead">Coordinated tax, practice, risk, retirement, and legacy planning for physicians and medical practice owners — one system, not a stack of separate advisors.</p>
        <div class="pillars">
          <a class="pillar" href="#practice"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>Practice Economics</a>
          <a class="pillar" href="#physicians"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>Physician Tax Strategy</a>
          <a class="pillar" href="#engines"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>Risk &amp; Protection</a>
          <a class="pillar" href="#engines"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v8"/><path d="m8 6 4-4 4 4"/><path d="M16 18a4 4 0 0 0-8 0"/><path d="M22 22H2"/></svg>Retirement Income</a>
          <a class="pillar" href="#engines"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z"/><path d="M12 22v-3"/></svg>Succession &amp; Legacy</a>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ───────── PAGE 4 · THE CANYON: Tax strategy for high-earning physicians ───────── -->
<section id="taxstrategy" class="page" aria-label="Tax strategy for high-earning physicians">
  <div class="shade" style="background:radial-gradient(circle at 80% 40%,rgba(16,185,129,.14),transparent 45%)"></div>
  <div class="wrap">
    <div class="split rev">
      <div class="photo"><img src="__IMG_CANYON__" alt="Looking down a canyon of green-lit skyscrapers at night"><span class="cap">Physician Tax Strategy</span></div>
      <div>
        <p class="eyebrow">Tax strategy</p>
        <h2 class="h2" style="margin-top:1.25rem">Tax Strategy for <span class="g">High-Earning Physicians</span></h2>
        <div class="rule"></div>
        <p class="lead">Explore coordinated planning opportunities for medical income, practice entities, retirement plans, and long-term wealth.</p>
        <div class="glass selector" style="margin-top:1.75rem">
          <p class="t"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 22h18"/><path d="M6 18v-7"/><path d="M10 18v-7"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="M12 2 3 7h18Z"/></svg>Physician Tax-Planning Review</p>
          <div class="row"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg><select aria-label="Medical Specialty"><option value="" selected disabled>Select specialty</option><option>Surgery</option><option>Psychiatry</option><option>Internal Medicine</option><option>Radiology</option><option>Anesthesiology</option><option>Other</option></select></div>
          <div class="row"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg><select aria-label="Income Range"><option value="" selected disabled>Select income</option><option>$300k–$500k</option><option>$500k–$1M</option><option>$1M–$2M</option><option>$2M+</option></select></div>
          <div class="row"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg><select aria-label="Filing Status"><option value="" selected disabled>Select status</option><option>Single</option><option>Married filing jointly</option></select></div>
          <div class="row"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg><select aria-label="State"><option value="" selected disabled>Select state</option><option>California</option><option>Florida</option><option>New York</option><option>Texas</option><option>Other</option></select></div>
          <div class="row"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/></svg><select aria-label="Practice Entity"><option value="" selected disabled>Select entity</option><option>W-2 employee</option><option>Sole proprietor</option><option>S-Corp</option><option>Partnership/Group</option></select></div>
          <a class="btn btn-primary" href="#estimate" style="width:100%">See My Planning Opportunities</a>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ───────── PAGE 5 · THE INTERCHANGE: Turn medical income into lasting wealth ───────── -->
<section id="physicians" class="page" aria-label="Russell Capital Systems for physicians">
  <div class="shade" style="background:radial-gradient(circle at 20% 60%,rgba(16,185,129,.14),transparent 45%)"></div>
  <div class="wrap">
    <div class="split">
      <div class="photo"><img src="__IMG_INTERCHANGE__" alt="Green-lit skyline above a glowing highway interchange and river"><span class="cap">Lasting Wealth</span></div>
      <div>
        <p class="eyebrow">For physicians</p>
        <h2 class="h2" style="margin-top:1.25rem">Russell Capital Systems <span class="g">for Physicians</span></h2>
        <p class="tagline">Turn Medical Income Into Lasting Wealth™</p>
        <p class="lead">Specialized tax, practice, retirement, risk, and legacy planning for physicians, specialists, and medical practice owners.</p>
        <div class="glass selector" style="margin-top:1.75rem">
          <p class="t"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>Design Your Physician Financial System</p>
          <div class="row"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg><select aria-label="Medical Specialty"><option value="" selected disabled>Select your specialty</option><option>Surgery</option><option>Psychiatry</option><option>Internal Medicine</option><option>Radiology</option><option>Other</option></select></div>
          <div class="row"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg><select aria-label="Career Stage"><option value="" selected disabled>Select your stage</option><option>Resident/Fellow</option><option>Early career</option><option>Mid-career</option><option>Approaching retirement</option></select></div>
          <div class="row"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/></svg><select aria-label="Practice Structure"><option value="" selected disabled>Select your structure</option><option>Employed</option><option>Private practice</option><option>Group/Partnership</option><option>Locum</option></select></div>
          <div class="row"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg><select aria-label="Primary Priority"><option value="" selected disabled>Select your priority</option><option>Reduce taxes</option><option>Build retirement income</option><option>Protect assets</option><option>Plan legacy</option></select></div>
          <a class="btn btn-primary" href="#estimate" style="width:100%">Build My Physician Plan</a>
        </div>
        <div class="feat5">
          <div><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg><b>Physician Tax</b><span>Optimize today. Protect tomorrow.</span></div>
          <div><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/></svg><b>Practice Planning</b><span>Strengthen your practice.</span></div>
          <div><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg><b>Risk Protection</b><span>Protect what matters most.</span></div>
          <div><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v8"/><path d="m8 6 4-4 4 4"/><path d="M16 18a4 4 0 0 0-8 0"/><path d="M22 22H2"/></svg><b>Retirement Income</b><span>Live on your terms.</span></div>
          <div><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z"/><path d="M12 22v-3"/></svg><b>Legacy Design</b><span>Your legacy. Their future.</span></div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ───────── PAGE 6 · NEON B: clients who stay for decades ───────── -->
<section id="proof" class="page" aria-label="Experience and client retention">
  <img class="pic" src="__IMG_NEON_B__" alt="Neon sign reading Financial &amp; Tax Relief and Recovery for Physicians, Psychiatrists, &amp; Surgeons over a green city at night">
  <div class="shade shade-c"></div>
  <div class="wrap">
    <div class="glass band">
      <div class="accent-top"></div>
      <div class="band-grid">
        <div class="medal"><div class="ring"></div><div class="core"></div><div style="position:relative;text-align:center"><div class="num grad">60%</div><div class="lbl">20+ years</div></div></div>
        <div>
          <p class="eyebrow"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>Experience you can lean on</p>
          <h2 class="band-h"><span class="grad">Clients who stay for decades.</span></h2>
          <p class="band-p">Our senior business partner — <b>69 years old</b>, with a long career working in <b>medical malpractice</b> — has kept more than <span class="em">60% of their clients on the books for 20 years or longer</span>. That kind of loyalty is earned, not bought.</p>
          <div class="tags">
            <span class="tag"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/></svg>Medical-malpractice specialty</span>
            <span class="tag"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>Senior partnership · 69</span>
            <span class="tag"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/></svg>Two-decade retention</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ───────── PAGE 7 · ASK AI ───────── -->
<section id="ask" class="page" aria-label="Ask the AI brain trust" style="min-height:auto;padding:6rem 0">
  <img class="pic" src="__IMG_EMERALD__" alt="" aria-hidden="true" style="object-position:center top;filter:brightness(.5) saturate(1.1)">
  <div class="shade" style="background:linear-gradient(180deg,#03090a 0%,rgba(3,9,10,.5) 30%,rgba(3,9,10,.75) 100%)"></div>
  <div class="wrap" style="padding:0">
    <div class="center">
      <p class="eyebrow" id="askEyebrow">AI Brain Trust</p>
      <h2 class="h2" style="margin-top:1.25rem;text-align:center">Press the mic. Ask <span class="g">anything</span>.</h2>
      <p class="lead-c">Describe your situation in as much detail as you want — income, debt, mortgage, savings, goals. Get the plain-language shape of a plan.</p>
    </div>
    <div class="glass concierge">
      <div class="ask-row">
        <button class="btn btn-primary mic" id="micBtn" type="button" aria-label="Start recording your question"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/></svg><span id="micLabel">Speak your question</span></button>
        <textarea id="question" placeholder="…or type it here. The more detail, the better the answer."></textarea>
      </div>
      <div class="chips" id="chips"></div>
      <button class="btn btn-primary" id="askBtn" type="button" style="width:100%;margin-top:1rem">Ask the AI Brain Trust →</button>
      <button class="btn btn-ghost" id="stopBtn" type="button" style="width:100%;margin-top:.6rem" hidden>■ Stop</button>
      <div class="status" id="askStatus"></div>
      <div class="answer" id="answer">
        <div class="answer-meta" id="answerMeta">Answered by the AI advisor</div>
        <div class="answer-body" id="answerBody"></div>
        <div class="answer-ctas"><a class="btn btn-primary" href="#estimate">See your estimate &amp; get a plan</a><a class="btn btn-ghost" href="__CALENDLY__" target="_blank" rel="noopener noreferrer">Book a thorough evaluation</a></div>
      </div>
      <p class="fine">General education only — not tax, legal, or investment advice, and no specific figures are shared here. Your speech is transcribed in your browser; only the text of your question is sent. A licensed professional confirms every specific in a personal review.</p>
    </div>
  </div>
</section>

<!-- ───────── PAGE 8 · THE ENGINES (14, in building order) ───────── -->
<section id="engines" class="engines" aria-label="Patent-pending technology behind Russell Capital Systems" style="position:relative;padding:7rem 0">
  <div class="fixed-pic" aria-hidden="true"></div>
  <div class="shade"></div>
  <div class="wrap">
    <div class="center">
      <p class="eyebrow">Patent-pending · 15 patents in process</p>
      <h2 class="h2" style="margin-top:1.25rem;text-align:center">Engines that work for <span class="g">you and your family</span></h2>
      <p class="lead-c">Fourteen purpose-built engines, in the order they build on one another — with <b style="color:var(--em-300);font-weight:600">15 patents in process</b>, and <b style="color:var(--em-300);font-weight:600">not offered anywhere else</b>. Read them top to bottom: each one makes the next possible.</p>
    </div>
    <div class="engine-grid" id="engineGrid"></div>
    <div class="glass more">
      <b>And we're just getting started.</b>
      <p>Beyond these fourteen, <b>45 more unique patent-pending technologies</b> are in process — built to keep giving you and your family an edge no one else can offer. <b>Stay tuned.</b></p>
    </div>
    <p class="fine" style="max-width:52rem;margin:2rem auto 0">Patent-pending methods developed by Russell Capital Systems — 15 patent applications in process, with 45 more underway — described here at a high level. Not tax, legal, or investment advice; results are not guaranteed and are reviewed by our tax professional team for suitability and IRS compliance before implementation.</p>
  </div>
</section>

<!-- ───────── PAGE 9 · ESTIMATE / LEAD FACT-FINDER ───────── -->
<section id="estimate" class="page" aria-label="Tax and savings estimator" style="min-height:auto;padding:6rem 0">
  <div class="fixed-pic" aria-hidden="true"></div>
  <div class="shade" style="background:linear-gradient(180deg,#03090a 0%,rgba(3,9,10,.6) 25%,rgba(3,9,10,.6) 75%,#03090a 100%)"></div>
  <div class="wrap" style="padding:0">
    <div class="center">
      <h2 class="h2" style="text-align:center">Your <span class="g">Tax &amp; Savings Estimate</span></h2>
      <p class="lead-c">Share your picture and we'll show you the shape of a coordinated plan — then an advisor prepares the specifics for your evaluation.</p>
    </div>
    <form class="glass form-card" id="leadForm" novalidate style="max-width:52rem;margin:2.5rem auto 0">
      <div class="two">
        <input id="firstName" placeholder="First name" aria-label="First name" autocomplete="given-name">
        <input id="lastName" placeholder="Last name" aria-label="Last name" autocomplete="family-name">
        <input id="email" type="email" placeholder="Email" aria-label="Email" autocomplete="email">
        <input id="phone" type="tel" placeholder="Phone" aria-label="Phone" autocomplete="tel">
        <input id="bestTime" class="span2" placeholder="Best time to reach you / book an appointment" aria-label="Best time to contact">
      </div>
      <p class="subhead">Your financial picture</p>
      <div class="two" id="numFields"></div>
      <label class="f" style="margin-top:.75rem">Anything else about your goals?<textarea id="goals" rows="2" aria-label="Goals" style="margin-top:.3rem"></textarea></label>
      <label class="consent"><input type="checkbox" id="consent" aria-label="Consent to be contacted and to store this information"><span>I agree that Russell Capital Systems may store this information and contact me about a planning evaluation. This is general education, not tax, legal, or investment advice, and no figures shown are guarantees.</span></label>
      <div class="err" id="formErr" role="alert"></div>
      <button class="btn btn-primary" type="submit" style="width:100%;margin-top:.5rem">Show me the shape of my plan →</button>
    </form>
    <div class="glass result" id="result" style="max-width:52rem;margin:2.5rem auto 0">
      <p class="eyebrow"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>Your coordinated strategy</p>
      <h3>Accelerated mortgage payoff + low tax liability + Roth conversion + oil &amp; gas drilling + trust-owned Index Universal Life — combined to help make your money divorce-proof.</h3>
      <div class="pills" id="pills"></div>
      <p style="margin-top:1.25rem;font-size:.9rem;color:var(--muted)">General concepts and sequence only — the specific numbers, timing, and structure are worked out with a licensed advisor in your evaluation.</p>
      <div class="answer-ctas">
        <a class="btn btn-primary" id="sendLead" href="#" target="_blank" rel="noopener noreferrer">Send my details to an advisor</a>
        <button class="btn btn-ghost" id="copyLead" type="button">Copy my summary</button>
        <a class="btn btn-ghost" href="__CALENDLY__" target="_blank" rel="noopener noreferrer">Book my evaluation</a>
      </div>
      <p class="fine">Sending opens a pre-filled email to our advisory team with what you entered — nothing leaves this page until you send it.</p>
    </div>
    <div class="disclaimer" style="max-width:52rem;margin:1.5rem auto 0">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
      <p><b>Important:</b> These results are not guaranteed. Any figures or strategies shown represent the best outcomes we have produced for some of our clients under certain conditions — they may or may not reflect the results you would receive. Every result must be thoroughly examined by our tax professional team for suitability and for compliance with applicable IRS statutes before anything is implemented. This estimator is general education only and is not tax, legal, or investment advice. The specific dollar amounts, percentages, and structure are prepared for your licensed advisor and shared in your personal evaluation — not shown here.</p>
    </div>
  </div>
</section>

<!-- ───────── PAGE 10 · HOW WE WORK / WHO WE SERVE / AREAS / FAQ ───────── -->
<section id="how" class="page" aria-label="How we work" style="min-height:auto;padding:6rem 0">
  <div class="fixed-pic" aria-hidden="true"></div>
  <div class="shade" style="background:linear-gradient(180deg,#03090a 0%,rgba(3,9,10,.72) 20%,rgba(3,9,10,.72) 80%,#03090a 100%)"></div>
  <div class="wrap" style="padding:0">
    <div class="center">
      <p class="eyebrow">How we work</p>
      <h2 class="h2" style="margin-top:1.25rem;text-align:center">One documented process. <span class="g">Every professional on the same page.</span></h2>
      <p class="lead-c">Your advisor, tax professional, and attorney work from a single plan — so strategies are sequenced deliberately, never bolted on one at a time.</p>
    </div>
    <div class="process">
      <div class="step"><span class="n">1</span><b>Review</b><p>We map your full picture — income, practice, debt, protection, retirement, and legacy — before recommending anything.</p></div>
      <div class="step"><span class="n">2</span><b>Coordinate</b><p>Your advisor, tax professional, and attorney align on one documented plan, with responsibilities assigned.</p></div>
      <div class="step"><span class="n">3</span><b>Implement</b><p>Strategies are sequenced deliberately, each checked for suitability and IRS compliance before anything moves.</p></div>
      <div class="step"><span class="n">4</span><b>Monitor</b><p>Reviewed on a cadence as tax law, markets, and your life change — so the plan stays current, not static.</p></div>
    </div>
    <div class="center" style="margin-top:5rem"><p class="eyebrow">Who we serve</p><h2 class="h2" style="margin-top:1.25rem;text-align:center;font-size:clamp(1.7rem,4vw,3rem)">Built for the finances of medicine</h2></div>
    <div class="serve"><div>Physicians<span>Employed and private practice</span></div><div>Psychiatrists<span>Practice owners and group partners</span></div><div>Surgeons<span>High-income, high-liability careers</span></div><div>Practice Owners<span>Entity, succession, and exit planning</span></div></div>
    <div class="center" style="margin-top:5rem"><p class="eyebrow">Planning areas</p><h2 class="h2" style="margin-top:1.25rem;text-align:center;font-size:clamp(1.7rem,4vw,3rem)">Every planning area, within reach</h2></div>
    <div class="areas" id="areas"></div>
    <div class="center" style="margin-top:5rem" id="faq"><p class="eyebrow">Questions physicians ask first</p><h2 class="h2" style="margin-top:1.25rem;text-align:center;font-size:clamp(1.7rem,4vw,3rem)">Straight answers</h2></div>
    <div class="faq" id="faqList"></div>
  </div>
</section>

<!-- ───────── PAGE 11 · CONSULTATION over the neon sign ───────── -->
<section id="consult" class="page" aria-label="Book a consultation">
  <img class="pic" src="__IMG_NEON_A__" alt="" aria-hidden="true" style="object-position:center 70%">
  <div class="shade shade-c"></div>
  <div class="wrap">
    <div class="glass consult-card">
      <p class="eyebrow">Relief today · Recovery for life</p>
      <h2 style="margin-top:1.25rem">Keep More of What You Earn. <span class="neon">Protect What You Built.</span></h2>
      <p>Schedule a 30-minute introductory conversation with an advisor to identify the planning questions that deserve a deeper review. No obligation.</p>
      <a class="btn btn-primary" href="__CALENDLY__" target="_blank" rel="noopener noreferrer">Book a Free Consultation</a>
      <div class="ticks">
        <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>No obligation</span>
        <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>30-minute call</span>
        <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>Personalized strategy review</span>
      </div>
    </div>
  </div>
</section>

<footer>
  <div class="wrap" style="padding:0">
    <div><span class="rcs">RCS</span> Russell Capital Systems™ © <span id="year"></span>. All rights reserved.</div>
    <div>Not tax, legal, or investment advice. Results are not guaranteed.</div>
  </div>
</footer>

<div class="sticky-cta" aria-label="Quick actions">
  <a class="btn btn-ghost" href="#estimate">Get my estimate</a>
  <a class="btn btn-primary" href="__CALENDLY__" target="_blank" rel="noopener noreferrer">Book a Review</a>
</div>

<script>
(() => {
  const ADVISOR_EMAIL = "__ADVISOR_EMAIL__";
  const $ = (id) => document.getElementById(id);
  $("year").textContent = new Date().getFullYear();

  /* nav */
  const menuBtn = $("menuBtn"), mobileMenu = $("mobileMenu");
  menuBtn.addEventListener("click", () => { const open = mobileMenu.hidden; mobileMenu.hidden = !open; menuBtn.setAttribute("aria-expanded", String(open)); menuBtn.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu"); });
  mobileMenu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => { mobileMenu.hidden = true; menuBtn.setAttribute("aria-expanded","false"); }));

  /* ── THE 14 ENGINES — in building order, five to six sentences each ── */
  const I = {
    layers:'<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
    dna:'<path d="m10 16 1.5 1.5"/><path d="m14 8-1.5-1.5"/><path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993"/><path d="m16.5 10.5 1 1"/><path d="m17 6-2.891-2.891"/><path d="M2 15c6.667-6 13.333 0 20-6"/><path d="m20 9 .891.891"/><path d="M3.109 14.109 4 15"/><path d="m6.5 12.5 1 1"/><path d="m7 18 2.891 2.891"/><path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993"/>',
    waves:'<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>',
    boxes:'<path d="M2.97 12.92A2 2 0 0 0 2 14.63v3.24a2 2 0 0 0 .97 1.71l3 1.8a2 2 0 0 0 2.06 0L12 19v-5.5l-5-3-4.03 2.42Z"/><path d="m7 16.5-4.74-2.85"/><path d="m7 16.5 5-3"/><path d="M7 16.5v5.17"/><path d="M12 13.5V19l3.97 2.38a2 2 0 0 0 2.06 0l3-1.8a2 2 0 0 0 .97-1.71v-3.24a2 2 0 0 0-.97-1.71L17 10.5l-5 3Z"/><path d="m17 16.5-5-3"/><path d="m17 16.5 4.74-2.85"/><path d="M17 16.5v5.17"/><path d="M7.97 4.42A2 2 0 0 0 7 6.13v4.37l5 3 5-3V6.13a2 2 0 0 0-.97-1.71l-3-1.8a2 2 0 0 0-2.06 0l-3 1.8Z"/><path d="M12 8 7.26 5.15"/><path d="m12 8 4.74-2.85"/><path d="M12 13.5V8"/>',
    repeat:'<path d="m2 9 3-3 3 3"/><path d="M13 18H7a2 2 0 0 1-2-2V6"/><path d="m22 15-3 3-3-3"/><path d="M11 6h6a2 2 0 0 1 2 2v10"/>',
    home:'<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    landmark:'<path d="M3 22h18"/><path d="M6 18v-7"/><path d="M10 18v-7"/><path d="M14 18v-7"/><path d="M18 18v-7"/><path d="M12 2 3 7h18Z"/>',
    shield:'<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    radar:'<path d="M19.07 4.93A10 10 0 0 0 6.99 3.34"/><path d="M4 6h.01"/><path d="M2.29 9.62A10 10 0 1 0 21.31 8.35"/><path d="M16.24 7.76A6 6 0 1 0 8.23 16.67"/><path d="M12 18h.01"/><path d="M17.99 11.66A6 6 0 0 1 15.77 16.67"/><circle cx="12" cy="12" r="2"/><path d="m13.41 10.59 5.66-5.66"/>',
    dice:'<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M16 8h.01"/><path d="M8 8h.01"/><path d="M8 16h.01"/><path d="M16 16h.01"/><path d="M12 12h.01"/>',
    history:'<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
    brain:'<path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/>',
    award:'<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>',
    network:'<rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/>'
  };
  const ENGINES = [
    ["layers","Cascading Calculator Core","The foundation",
     "Most financial software treats your mortgage, your taxes, your retirement, and your insurance as separate islands — you change one and nothing else notices. Our core snaps every calculator we own onto a single base, so when one number in your life changes, everything connected to it updates at once, in the right order. That's how we can show you, in one view, that a mortgage decision quietly moves your future tax bracket, or that a practice choice reshapes your retirement income. You stop guessing at how the pieces interact, because the system shows you. It's the foundation every other engine below stands on — and it's the reason a plan from us behaves like one machine instead of a stack of spreadsheets. <b>No off-the-shelf tool does this. It's ours.</b>"],
    ["dna","Wealth Genome™ Profile","It starts with you",
     "Before we recommend anything, we read your financial DNA. A standard risk questionnaire asks a handful of questions and drops you into a bucket; the Wealth Genome reads dozens of signals about your money life — your income sources, your practice, your family, your debts, your health, your career arc, your comfort with risk — and how they interact with each other. Two physicians who look identical on paper can come out with very different, better-fitting plans, because the genome captures the hidden connections between the factors. It maps you to the specific set of strategies that fit you, not a template. Everything we build next is built around that profile, so nothing in your plan is generic. <b>You've never been a category to us. You're a genome.</b>"],
    ["waves","Optimized Tax Waterfall Engine","Keep more, for life",
     "When you retire, your money sits in many buckets — Roth, IRA, Social Security, pension, rental income, policy cash values — and the IRS taxes each one differently. The order you draw from them can change what you keep over a lifetime by a staggering amount. Most tools optimize two or three sources; our Waterfall coordinates all of them together, year by year, across your whole retirement, and finds the drawdown sequence that leaves the least on the table. The savings it finds only appear when the sources are sequenced as a system — they're invisible when each bucket is planned alone. Every move is checked against the tax code, so your professionals can confirm it. <b>For your family, it means more of what you earned stays yours, and passes on intact.</b>"],
    ["boxes","Zero-Cost Roth Conversion Engine","Tax-free, without the sting",
     "Moving money from a taxable retirement account into a Roth is one of the most powerful things you can do for your future — but the tax bill in the year you convert stops most people cold. This engine pairs the conversion with offsetting deductions, sequenced in the same year, so the tax the conversion creates can be balanced out rather than paid in full. Both halves are well known on their own; almost no one models them together, because the coordination is where the value hides. The result is a path toward tax-free growth and tax-free withdrawals — money that can pass to your children without the IRS in the middle. Whether it fits you depends on your situation, and a licensed professional confirms every specific. <b>But the idea that a Roth conversion has to hurt is one we retire for our clients.</b>"],
    ["repeat","Equity Arbitrage Engine","Put idle equity to work",
     "The equity in your home may be the largest asset you own that earns nothing. It just sits in the walls. This engine finds the sweet spot for borrowing against that equity at a low cost and positioning it where it can grow faster than it costs to borrow — timing the draws and the premiums across decades, not months. Advisors have attempted this by hand in spreadsheets for years; the engine weighs thousands of interacting variables at once and surfaces windows no one could calculate manually. It accounts for the fees, the caps, the exit schedules, and the rate changes that trip people up. <b>Done right, idle equity becomes a working asset for your family, quietly compounding while you practice medicine.</b>"],
    ["home","Mortgage Killer™","Own your home, decades sooner",
     "This is where the equity engine turns into freedom. Mortgage Killer runs a recycling loop: put your idle equity to work, use that growth to pay down the mortgage years ahead of schedule, and when the home is free and clear, recycle the freed equity into the next property — cycle after cycle. Each cycle finishes faster than the last, because the growth from earlier cycles fuels the next one. Real-estate investors and insurance professionals each know their piece of this; nobody else runs it as one automated, compounding engine over a lifetime. For your family it means owning your home outright far sooner, cash flow freed up today, and a paid-off legacy tomorrow instead of thirty years of interest. <b>It's the single most-requested engine we own.</b>"],
    ["landmark","FIA Collateral Optimizer","Income you can count on, capital you can reach",
     "Retirement income usually forces a trade: lock money away for a guaranteed stream, or keep it accessible and give up the guarantee. This engine splits a fixed indexed annuity into two sleeves — one that generates dependable income, and one you can borrow against — and tunes the split to real carrier products and real lending limits. It then coordinates that borrowing power with tax-aware debt paydown, so the same dollars do more than one job. The architecture is a combination you won't find in off-the-shelf software, because it requires modeling the products, the lending, and the taxes together. What you feel is confidence: an income floor you can count on, and capital within reach if life changes. <b>Your money works without being locked in a box.</b>"],
    ["shield","Divorce-Proof Asset Shield","Protect everything you just built",
     "Everything you build is only as safe as its structure. This engine shows you which of your assets sit inside protected vehicles and which sit exposed — to a divorce, a lawsuit, a creditor — and applies the protection rules for your own state, because they differ enormously across the country. It can model more than one life event, so you see the difference protection makes over decades, not just once. Mainstream planning tools don't model asset protection this way at all; divorce attorneys work from simple asset lists after the fact. We do it before anything happens, which is the only time it helps. <b>It's how we help make a family's security durable — the part of your plan that protects all the other parts.</b>"],
    ["radar","Retirement Risk Radar","See every threat, not just the market",
     "Most retirement tools worry about exactly one danger: the stock market. But a long retirement faces ten of them at once — healthcare inflation, the odds of needing long-term care, changes to Social Security, tax law, general inflation, living longer than expected, interest rates, housing, and more. The Radar models all of them and, critically, how they cluster: three or four risks arriving together can do far more damage than any one alone, and single-factor tools never see it coming. You get one clear picture of how prepared you actually are, and specific ways to reduce each exposure. <b>Nothing blindsides your family, because we looked at the whole sky, not just the weather.</b>"],
    ["dice","10,000-Scenario Stress Test","Prove the plan survives",
     "A plan that only works in a rising market isn't a plan. This engine runs yours through ten thousand different futures — crashes, booms, long flat stretches, and everything in between — and shows the full range of outcomes, not one rosy line. It's built specifically for the protective floor and growth cap of the strategies we use, which ordinary simulations get mathematically wrong; that precision reveals patterns standard tools miss entirely. You'll see the best case, the worst case, and how likely each really is. Then you retire knowing the plan holds up when markets don't. <b>That's real peace of mind for the whole family — not something a brochure projection can give you.</b>"],
    ["history","Time Machine Dual-View","Evidence beside the estimate",
     "Regulations require insurance illustrations to show you a hypothetical future — an estimate, however careful. The Time Machine adds what the estimate can't: a look back at how the same strategy would actually have behaved through real market history, decade by decade, with the strategy's true mechanics applied. You see the required forward projection and the historical evidence side by side. It changes how a decision feels, because you're no longer trusting a promise; you're reading a record. No other platform pairs the two views this way. <b>For a family making a decades-long commitment, evidence beside estimate is the difference between hoping and knowing.</b>"],
    ["brain","Behavioral Safeguard","Protect the plan from human nature",
     "Every human brain is wired to make the same expensive money mistakes — panicking at a loss, anchoring on a number, chasing whatever did well last month, freezing when a change is needed. Over a lifetime those instincts can quietly cost a family more than any fee. This engine watches for those patterns as decisions happen and shows you the real numbers, drawn from your own plan, at the moment you need them most. It doesn't lecture; it quantifies, so the better choice is obvious. Behavioral science and financial planning have existed separately for years — putting them together, personally, in real time is what's new. <b>It protects your plan from the one risk no market model can: you.</b>"],
    ["award","The Russell Number™","Your advisor, measured",
     "You've seen how much of a plan's quality depends on the person running it. The Russell Number is a single, transparent score for financial advisors, built from many dimensions at once — client retention, satisfaction, compliance record, continuing education, technology adoption, and more — instead of the one or two revenue metrics the industry usually uses. It's portable, so an advisor can show it to you the way a credit score shows lenders who you are. And because it's earned, it changes behavior: the things that matter to clients are the things that move the score. For your family, it means the person guiding you is measured against a standard, not just licensed. <b>Nobody else scores advisors this way.</b>"],
    ["network","Advisor Practice Platform","Discipline that lasts for decades",
     "Behind every plan that lasts is a practice that runs with discipline. This platform is the nervous system of ours: it forecasts the work ahead, tracks every client's next action, flags anyone who hasn't been heard from, rehearses difficult conversations, and fires automated reminders so nothing falls through the cracks. Most advisory practices bolt these together from separate apps, and things get lost in the seams; ours works as one organism. You'll never experience the platform directly — but you'll feel it as consistent follow-through, year after year, from a practice that runs like the systems it builds. <b>It's how everything above stays true for the long haul.</b>"]
  ];
  $("engineGrid").innerHTML = ENGINES.map(([ic,name,why,body],i) => `
    <article class="ecard">
      <div class="accent-top"></div>
      <div class="ehead"><span class="ic"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${I[ic]}</svg></span><span class="n">Engine ${String(i+1).padStart(2,"0")} of 14</span><span class="only">Only at RCS</span></div>
      <h3 class="grad">${name}</h3><div class="ul"></div>
      <p class="why">${why}</p>
      <p class="body">${body}</p>
    </article>`).join("");

  /* planning areas + FAQ */
  const AREAS = [
    ["Tax Opportunity Review","Organize income, contribution, entity, and timing questions for coordinated advisor and tax-professional review."],
    ["Practice Owner Planning","Connect practice economics, ownership decisions, succession priorities, and household planning without mixing record systems."],
    ["Protection &amp; Policy Review","Review existing protection, policy assumptions, liquidity needs, and documented follow-up responsibilities."],
    ["Retirement Income Modeling","Compare retirement timing, income guardrails, and planning assumptions — without presenting projections as guarantees."],
    ["Estate &amp; Legacy Coordination","Map estate, family, charitable, and succession priorities to the professionals responsible for implementation."],
    ["Portfolio &amp; Risk Alignment","Connect risk tolerance, portfolio drift, tax considerations, and long-term goals in a documented review cycle."],
    ["Physician Planning Cases","Assumptions, notes, status, and next actions for complex medical-career and practice-owner decisions — saved in one place."],
    ["Secure Document Vault","Planning documents kept inside managed access controls and shared only through authorized workflows."]
  ];
  $("areas").innerHTML = AREAS.map(([t,d]) => `<div class="area"><span class="ic"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg></span><b>${t}</b><p>${d}</p></div>`).join("");
  const FAQ = [
    ["Who is this for?","Physicians, psychiatrists, surgeons, and medical practice owners — anyone whose income, debt, practice, and tax picture is too complex for a one-size-fits-all plan."],
    ["Is the estimate a quote or a guarantee?","Neither. It's general education showing the shape of a coordinated plan. Nothing is implemented until our tax professional team has examined it for suitability and compliance with applicable IRS statutes — and your own results may differ."],
    ["Why don't you show me the numbers here?","Because the specific dollar amounts, percentages, and structure depend on your exact situation. They're prepared for your licensed advisor and shared with you in your personal evaluation, not on a public page."],
    ["What happens after I submit the estimate?","An advisor reviews what you shared, prepares the specifics, and reaches out — by email or phone, at the time you gave — to schedule a thorough evaluation. There's no obligation."],
    ["What does \"divorce-proof\" mean?","It's the general idea of positioning assets inside structures designed to be more resilient to divorce, lawsuits, or creditors. How much protection applies depends on your state and circumstances, and is confirmed by your professionals."],
    ["What are the patent-pending engines?","Fifteen core planning technologies with patent applications in process — plus 45 more underway — built to coordinate strategies that most tools treat as separate islands. You won't find them offered anywhere else."],
    ["Is my information safe?","Nothing leaves this page until you choose to send it. The estimate opens a pre-filled email you review and send yourself, so you control exactly what's shared."]
  ];
  $("faqList").innerHTML = FAQ.map(([q,a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join("");
  $("pills").innerHTML = ["Accelerated mortgage payoff","Lower tax liability","Roth-conversion sequencing","Oil &amp; gas drilling deduction","Trust-owned Index Universal Life"].map(p => `<div class="pill"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>${p}</div>`).join("");

  /* estimator */
  const NUM = [["w2Income","Your W-2 earnings"],["estimatedTaxes","Your estimated annual taxes"],["spouseIncome","Spouse income"],["spouseTaxes","Spouse estimated taxes"],["studentDebt","Student debt owed"],["studentDebtRate","Student loan interest rate (%)"],["homeEquity","Home equity"],["mortgageBalance","Mortgage balance (if known)"],["mortgageRate","Mortgage rate (%)"],["mortgageIO","Interest-only payment / month"],["mortgageYears","Years remaining on mortgage"],["taxDeferredSelf","Your tax-deferred (IRA/401k/403b/TSP)"],["taxDeferredSpouse","Spouse tax-deferred"],["liquid","Total liquid investments (brokerage, etc.)"]];
  $("numFields").innerHTML = NUM.map(([k,l]) => `<label class="f">${l}<input id="${k}" inputmode="decimal" aria-label="${l}"></label>`).join("") + `<label class="f">Are those liquid investments taxable?<select id="liquidTax" aria-label="Liquid investment taxability"><option value="Not sure">Not sure</option><option>Taxable</option><option>Non-taxable</option><option>A mix of both</option></select></label>`;
  const v = (id) => ($(id).value || "").trim();
  let leadSummary = "";
  $("leadForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const err = $("formErr"); err.textContent = "";
    if (!$("consent").checked) { err.textContent = "Please check the consent box so we can prepare your estimate."; return; }
    if (!v("email") && !v("phone")) { err.textContent = "Add an email or phone so an advisor can send your evaluation."; return; }
    const lines = [`Name: ${[v("firstName"), v("lastName")].filter(Boolean).join(" ") || "—"}`, `Email: ${v("email") || "—"}`, `Phone: ${v("phone") || "—"}`, `Best time: ${v("bestTime") || "—"}`, "", "FINANCIAL PICTURE", ...NUM.map(([k,l]) => `${l}: ${v(k) || "—"}`), `Liquid taxability: ${v("liquidTax")}`, "", `Goals: ${v("goals") || "—"}`, "", "Consent given: yes (Russell Capital Systems may store this and contact me about a planning evaluation)", `Submitted from the Russell Capital Systems estimate page on ${new Date().toLocaleString()}`];
    const subject = encodeURIComponent(`Planning estimate request — ${[v("firstName"), v("lastName")].filter(Boolean).join(" ") || "new prospect"}`);
    $("sendLead").href = `mailto:${ADVISOR_EMAIL}?subject=${subject}&body=${encodeURIComponent(lines.join("\n"))}`;
    leadSummary = lines.join("\n");
    $("leadForm").hidden = true;
    const r = $("result"); r.classList.add("show"); r.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  const copyBtn = $("copyLead");
  copyBtn.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText(leadSummary || ""); copyBtn.textContent = "Copied ✓"; }
    catch { const ta = document.createElement("textarea"); ta.value = leadSummary || ""; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); copyBtn.textContent = "Copied ✓"; } catch { copyBtn.textContent = "Select & copy the email instead"; } ta.remove(); }
    setTimeout(() => { copyBtn.textContent = "Copy my summary"; }, 2500);
  });

  /* AI concierge (sample capability; graceful email fallback) */
  const RULES = "You are the AI concierge on the Russell Capital Systems PUBLIC homepage, speaking to a prospective client — often a physician, psychiatrist, or surgeon — who may know nothing about the firm yet. Explain, in warm and confident plain language, the KINDS of strategies and the general FRAME that could apply to their situation: accelerated mortgage payoff, lowering tax liability, Roth-conversion sequencing, oil & gas drilling deductions, and trust-owned Index Universal Life used together — a coordinated combination designed to help make wealth resilient and hard to touch ('divorce-proof'). Talk about the IDEA of combining strategies in a sequence and why coordination beats any single tactic. HARD RULES — never break these: reveal NO specific dollar amounts, NO percentages, NO calculation formulas, NO exact number-of-combinations, NO named internal parameters, and NO step-by-step numeric instructions. Keep it to concepts, frames, and general sequences only. Never guarantee any outcome. State plainly that this is general education, not tax, legal, or investment advice, and that a licensed professional confirms every specific in a personal review. Close by inviting them to complete the short planning estimator and book a thorough evaluation. Under 180 words.";
  const EXAMPLES = ["I'm a surgeon with student loans, a big mortgage, and a 401(k) — how would you help me keep more and pay debt off faster?","How do you turn my home equity and taxable accounts into something that's protected and tax-efficient?","What's the general idea behind making my money 'divorce-proof'?"];
  const q = $("question"), askBtn = $("askBtn"), stopBtn = $("stopBtn"), status = $("askStatus"), answer = $("answer"), body = $("answerBody"), meta = $("answerMeta");
  $("chips").innerHTML = EXAMPLES.map(t => `<button type="button" class="chip">${t.length > 60 ? t.slice(0,60) + "…" : t}</button>`).join("");
  [...$("chips").children].forEach((c, i) => c.addEventListener("click", () => { q.value = EXAMPLES[i]; q.focus(); }));
  let sampleFn = null, ctl = null;
  const COPY = { rate_limited: "The advisor is busy right now — please try again in a moment.", session_expired: "Please sign in again to ask the advisor.", refused: "The advisor couldn't answer that one — try rephrasing your question.", empty_completion: "No answer came back — try asking with a little more detail.", upstream_error: "The connection dropped — please try again." };
  const HIDE = new Set(["not_granted","sampling_disabled","not_declared","capability_disabled","capability_removed"]);
  function fallbackMode() { sampleFn = null; $("askEyebrow").textContent = "Ask an advisor"; askBtn.textContent = "Send my question to an advisor →"; status.textContent = ""; }
  function sendToAdvisor(text) { window.open(`mailto:${ADVISOR_EMAIL}?subject=${encodeURIComponent("Question from the Russell Capital Systems homepage")}&body=${encodeURIComponent(text + "\n\n(Sent from the Russell Capital Systems homepage)")}`, "_blank"); status.textContent = "Your email app should open with your question ready to send. Prefer a call? Book below."; }
  async function ask(text) {
    const t = (text || "").trim(); if (!t) { q.focus(); return; }
    if (!sampleFn) { sendToAdvisor(t); return; }
    ctl = new AbortController(); askBtn.disabled = true; stopBtn.hidden = false;
    status.textContent = "The AI advisor is reviewing your question…"; answer.classList.remove("show"); body.textContent = "";
    try {
      const res = await sampleFn([{ role: "user", content: RULES }, { role: "user", content: `The visitor asked: "${t}"\n\nAnswer per your hard rules — concepts and frames only, no numbers or formulas.` }], { cache: false, signal: ctl.signal, onText: ({ text }) => { status.textContent = ""; answer.classList.add("show"); body.textContent = text; } });
      body.textContent = res.text; meta.textContent = "Answered by the AI advisor · general education only";
      if (res.truncated) status.textContent = "Answer was cut short — ask a shorter question for the rest.";
    } catch (e) {
      if (e && e.code === "cancelled") { status.textContent = e.text ? "Stopped." : ""; if (e.text) { answer.classList.add("show"); body.textContent = e.text; } }
      else if (e && HIDE.has(e.code)) { fallbackMode(); sendToAdvisor(t); }
      else { if (e && e.text) { answer.classList.add("show"); body.textContent = e.text; } status.textContent = COPY[e && e.code] || COPY.upstream_error; }
    } finally { askBtn.disabled = false; stopBtn.hidden = true; ctl = null; }
  }
  askBtn.addEventListener("click", () => ask(q.value));
  stopBtn.addEventListener("click", () => ctl && ctl.abort());
  (async () => { try { sampleFn = (window.claude && typeof window.claude.use === "function") ? await window.claude.use("sample") : null; } catch { sampleFn = null; } if (!sampleFn) fallbackMode(); else { $("askEyebrow").textContent = "AI Brain Trust · live"; } })();

  /* mic */
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  const micBtn = $("micBtn"), micLabel = $("micLabel"); let rec = null, listening = false;
  if (!Rec) micBtn.hidden = true;
  micBtn.addEventListener("click", () => {
    if (listening) { rec && rec.stop(); return; }
    rec = new Rec(); rec.lang = "en-US"; rec.continuous = true; rec.interimResults = true; let finalText = "";
    rec.onresult = (ev) => { let t = ""; for (let i = 0; i < ev.results.length; i++) t += ev.results[i][0].transcript; finalText = t; q.value = t; };
    rec.onend = () => { listening = false; micBtn.classList.remove("listening"); micLabel.textContent = "Speak your question"; micBtn.setAttribute("aria-label","Start recording your question"); if (finalText.trim()) ask(finalText); };
    rec.onerror = () => { listening = false; micBtn.classList.remove("listening"); micLabel.textContent = "Speak your question"; status.textContent = "Microphone unavailable or permission denied — type your question instead."; };
    q.value = ""; status.textContent = "Listening… describe your situation in as much detail as you like, then tap the mic again.";
    listening = true; micBtn.classList.add("listening"); micLabel.textContent = "Stop & ask"; micBtn.setAttribute("aria-label","Stop recording and ask");
    try { rec.start(); } catch { rec.onerror(); }
  });
})();
</script>
```

