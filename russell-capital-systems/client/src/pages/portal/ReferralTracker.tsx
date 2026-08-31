// @ts-nocheck
import { useState, useMemo, useEffect, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  Users,
  Plus,
  Loader2,
  Trash2,
  Edit,
  Phone,
  Mail,
  BarChart3 as BarChartIcon,
  PieChart as PieChartIcon,
  Search,
  Download,
  MoreHorizontal,
  ArrowUpRight,
  Activity,
  Target,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Briefcase,
  TrendingUp,
  Link as LinkIcon,
  Copy,
  FileText,
  UserPlus,
  Zap,
  MessageSquare,
  DollarSign,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, LineChart, Line, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart, Legend } from "recharts";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import { NumberInput } from "@/components/NumberInput";
import { useAuth } from "@/_core/hooks/useAuth";

const STATUS_COLORS: Record<string, string> = {
  pending: "rc-badge-blue",
  contacted: "rc-badge-gold",
  meeting_scheduled: "rc-badge-gold",
  converted: "rc-badge-green",
  lost: "rc-badge-red",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  contacted: "Contacted",
  meeting_scheduled: "Meeting Scheduled",
  converted: "Converted",
  lost: "Lost",
};

const CHART_COLORS = ["#7a95b8", "#3b82f6", "#f0c040", "#22c55e", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];
const SOURCES = ["Client", "Professional", "Event", "Online", "Partner", "Social Media", "Other"] as const;

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export default function ReferralTracker() {
  const { user } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [dateRangeFilter, setDateRangeFilter] = useState<string>("all_time");
  const [activeTab, setActiveTab] = useState("overview");
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'createdAt', direction: 'desc' });
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [form, setForm] = useState({
    referrerName: "",
    referredName: "",
    referredEmail: "",
    referredPhone: "",
    source: "Client" as typeof SOURCES[number],
    estimatedValue: "",
    notes: "",
    campaign: "",
    priority: "medium",
  });

  const { data: referrals = [], refetch: refetchReferrals } = trpc.referral.list.useQuery();
  const { data: userStats } = trpc.dashboard.stats.useQuery();
  const { data: referralLinks = [] } = trpc.referralLinks.list.useQuery();
  const { data: gamificationData } = trpc.gamification.status.useQuery();
  const { data: campaigns = [] } = trpc.emailCampaigns.list.useQuery();
  
  const utils = trpc.useUtils();

  const createMut = trpc.referral.create.useMutation({
    onSuccess: () => {
      utils.referral.list.invalidate();
      setShowAdd(false);
      resetForm();
      toast.success("Referral added successfully");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMut = trpc.referral.update.useMutation({
    onSuccess: () => {
      utils.referral.list.invalidate();
      setEditId(null);
      resetForm();
      toast.success("Referral updated successfully");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMut = trpc.referral.delete.useMutation({
    onSuccess: () => {
      utils.referral.list.invalidate();
      toast.success("Referral deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const generateLinkMut = trpc.referralLinks.generate.useMutation({
    onSuccess: () => {
      utils.referralLinks.list.invalidate();
      toast.success("New referral link generated");
    },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = useCallback(() => {
    setForm({ 
      referrerName: "", 
      referredName: "", 
      referredEmail: "", 
      referredPhone: "", 
      source: "Client", 
      estimatedValue: "", 
      notes: "",
      campaign: "",
      priority: "medium"
    });
  }, []);

  const handleSubmit = useCallback(() => {
    if (!form.referrerName || !form.referredName) {
      toast.error("Referrer name and referred name are required");
      return;
    }
    if (editId) {
      updateMut.mutate({ 
        id: editId, 
        ...form, 
        referredEmail: form.referredEmail || undefined, 
        referredPhone: form.referredPhone || undefined, 
        estimatedValue: form.estimatedValue || undefined, 
        notes: form.notes || undefined 
      });
    } else {
      createMut.mutate({ 
        ...form, 
        referredEmail: form.referredEmail || undefined, 
        referredPhone: form.referredPhone || undefined, 
        estimatedValue: form.estimatedValue || undefined, 
        notes: form.notes || undefined 
      });
    }
  }, [form, editId, createMut, updateMut]);

  const openEdit = useCallback((r: any) => {
    setEditId(r.id);
    setForm({
      referrerName: r.referrerName || "",
      referredName: r.referredName || "",
      referredEmail: r.referredEmail || "",
      referredPhone: r.referredPhone || "",
      source: r.source || "Client",
      estimatedValue: r.estimatedValue || "",
      notes: r.notes || "",
      campaign: r.campaign || "",
      priority: r.priority || "medium",
    });
    setShowAdd(true);
  }, []);

  const handleStatusChange = useCallback((id: number, status: string) => {
    updateMut.mutate({ id, status: status as any });
  }, [updateMut]);

  const handleSort = useCallback((key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetchReferrals();
    setTimeout(() => setIsRefreshing(false), 500);
    toast.success("Data refreshed");
  }, [refetchReferrals]);

  const handleCopyLink = useCallback((link: string) => {
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard");
  }, []);

  const handleGenerateLink = useCallback(() => {
    generateLinkMut.mutate({ source: "custom", campaign: "Spring Drive" });
  }, [generateLinkMut]);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setStatusFilter("all");
    setSourceFilter("all");
    setDateRangeFilter("all_time");
  }, []);

  const filteredReferrals = useMemo(() => {
    let result = [...referrals];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((r) => 
        (r.referrerName && r.referrerName.toLowerCase().includes(q)) ||
        (r.referredName && r.referredName.toLowerCase().includes(q)) ||
        (r.source && r.source.toLowerCase().includes(q)) ||
        (r.referredEmail && r.referredEmail.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((r) => r.status === statusFilter);
    }

    if (sourceFilter !== "all") {
      result = result.filter((r) => r.source === sourceFilter);
    }

    if (dateRangeFilter !== "all_time") {
      const now = new Date();
      const cutoff = new Date();
      if (dateRangeFilter === "30d") cutoff.setDate(now.getDate() - 30);
      else if (dateRangeFilter === "90d") cutoff.setDate(now.getDate() - 90);
      else if (dateRangeFilter === "1y") cutoff.setFullYear(now.getFullYear() - 1);
      
      result = result.filter((r) => new Date(r.createdAt) >= cutoff);
    }

    result.sort((a, b) => {
      const { key, direction } = sortConfig;
      let valA = a[key];
      let valB = b[key];

      if (key === 'estimatedValue') {
        valA = parseFloat(valA) || 0;
        valB = parseFloat(valB) || 0;
      } else if (key === 'createdAt') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
      }

      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [referrals, searchQuery, statusFilter, sourceFilter, dateRangeFilter, sortConfig]);

  const stats = useMemo(() => {
    const total = referrals.length;
    const converted = referrals.filter((r) => r.status === "converted").length;
    const pending = referrals.filter((r) => ["pending", "contacted", "meeting_scheduled"].includes(r.status)).length;
    const lost = referrals.filter((r) => r.status === "lost").length;
    const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;
    const totalValue = referrals.filter((r) => r.status === "converted").reduce((sum: number, r: any) => sum + (parseFloat(r.estimatedValue) || 0), 0);
    const pipelineValue = referrals.filter((r) => ["pending", "contacted", "meeting_scheduled"].includes(r.status)).reduce((sum: number, r: any) => sum + (parseFloat(r.estimatedValue) || 0), 0);
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const thisMonth = referrals.filter((r) => new Date(r.createdAt) >= thirtyDaysAgo).length;
    const lastMonth = referrals.filter((r) => {
      const date = new Date(r.createdAt);
      return date >= sixtyDaysAgo && date < thirtyDaysAgo;
    }).length;

    const growth = lastMonth === 0 ? 100 : Math.round(((thisMonth - lastMonth) / lastMonth) * 100);

    return { total, converted, pending, lost, conversionRate, totalValue, pipelineValue, thisMonth, growth };
  }, [referrals]);

  const statusData = useMemo(() => {
    return [
      { name: "Pending", value: referrals.filter((r) => r.status === "pending").length },
      { name: "Contacted", value: referrals.filter((r) => r.status === "contacted").length },
      { name: "Meeting", value: referrals.filter((r) => r.status === "meeting_scheduled").length },
      { name: "Converted", value: referrals.filter((r) => r.status === "converted").length },
      { name: "Lost", value: referrals.filter((r) => r.status === "lost").length },
    ].filter((d) => d.value > 0);
  }, [referrals]);

  const sourceData = useMemo(() => {
    return SOURCES.map((s) => ({
      source: s,
      count: referrals.filter((r) => r.source === s).length,
      value: referrals.filter((r) => r.source === s).reduce((sum: number, r: any) => sum + (parseFloat(r.estimatedValue) || 0), 0),
    })).filter((d) => d.count > 0).sort((a, b) => b.count - a.count);
  }, [referrals]);

  const trendData = useMemo(() => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthStr = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      
      const monthReferrals = referrals.filter((r) => {
        const rDate = new Date(r.createdAt);
        return rDate.getMonth() === d.getMonth() && rDate.getFullYear() === d.getFullYear();
      });

      data.push({
        name: monthStr,
        total: monthReferrals.length,
        converted: monthReferrals.filter((r) => r.status === 'converted').length,
        value: monthReferrals.filter((r) => r.status === 'converted').reduce((sum: number, r: any) => sum + (parseFloat(r.estimatedValue) || 0), 0)
      });
    }
    return data;
  }, [referrals]);

  const conversionFunnelData = useMemo(() => {
    const total = referrals.length;
    const contacted = referrals.filter((r) => ["contacted", "meeting_scheduled", "converted"].includes(r.status)).length;
    const meeting = referrals.filter((r) => ["meeting_scheduled", "converted"].includes(r.status)).length;
    const converted = referrals.filter((r) => r.status === "converted").length;

    return [
      { stage: "Total Referrals", count: total, fill: "#3b82f6" },
      { stage: "Contacted", count: contacted, fill: "#8b5cf6" },
      { stage: "Meetings", count: meeting, fill: "#f0c040" },
      { stage: "Converted", count: converted, fill: "#22c55e" }
    ];
  }, [referrals]);

  const topReferrersData = useMemo(() => {
    const referrers: Record<string, { count: number, value: number }> = {};
    referrals.forEach((r) => {
      if (r.referrerName) {
        if (!referrers[r.referrerName]) {
          referrers[r.referrerName] = { count: 0, value: 0 };
        }
        referrers[r.referrerName].count += 1;
        if (r.status === 'converted') {
          referrers[r.referrerName].value += (parseFloat(r.estimatedValue) || 0);
        }
      }
    });

    return Object.entries(referrers)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [referrals]);

  const handleExportCSV = useCallback(() => {
    if (filteredReferrals.length === 0) {
      toast.error("No data to export");
      return;
    }
    const headers = ["Referred By", "Prospect", "Email", "Phone", "Source", "Status", "Est. Value", "Date", "Notes"];
    const csvData = filteredReferrals.map((r) => [
      r.referrerName || "",
      r.referredName || "",
      r.referredEmail || "",
      r.referredPhone || "",
      r.source || "",
      STATUS_LABELS[r.status] || r.status || "",
      r.estimatedValue || "0",
      new Date(r.createdAt).toLocaleDateString(),
      (r.notes || "").replace(/,/g, ";") // Sanitize commas in notes
    ]);
    
    const csvContent = [headers.join(","), ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `referrals_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Exported successfully");
  }, [filteredReferrals]);

  const mockCampaigns = [
    { id: 1, name: "Spring Client Appreciation", type: "Event", sent: 150, clicks: 45, referrals: 12, roi: "$25,000" },
    { id: 2, name: "Q1 Newsletter", type: "Email", sent: 850, clicks: 120, referrals: 8, roi: "$15,000" },
    { id: 3, name: "Tax Season Prep", type: "Direct Mail", sent: 300, clicks: 0, referrals: 15, roi: "$45,000" },
    { id: 4, name: "LinkedIn Professional Outreach", type: "Social", sent: 500, clicks: 85, referrals: 5, roi: "$10,000" },
  ];

  const mockLeaderboard = [
    { rank: 1, name: "Sarah Jenkins", role: "Senior Advisor", referrals: 45, converted: 28, volume: "$2.5M" },
    { rank: 2, name: "Michael Chen", role: "Wealth Manager", referrals: 38, converted: 22, volume: "$1.8M" },
    { rank: 3, name: "David Rodriguez", role: "Advisor", referrals: 32, converted: 18, volume: "$1.2M" },
    { rank: 4, name: "Emily Thorne", role: "Associate", referrals: 25, converted: 12, volume: "$850K" },
    { rank: 5, name: "James Wilson", role: "Senior Advisor", referrals: 20, converted: 15, volume: "$1.5M" },
  ];

  const mockActivityLog = [
    { id: 1, action: "Referral Converted", details: "John Smith converted to client", time: "2 hours ago", user: "Sarah Jenkins" },
    { id: 2, action: "Meeting Scheduled", details: "Initial consultation with Emma Davis", time: "4 hours ago", user: "Michael Chen" },
    { id: 3, action: "New Referral", details: "Robert Taylor referred by Alice Brown", time: "1 day ago", user: "System" },
    { id: 4, action: "Status Updated", details: "Mark Johnson marked as Contacted", time: "1 day ago", user: "David Rodriguez" },
    { id: 5, action: "Email Sent", details: "Welcome packet sent to Sarah Connor", time: "2 days ago", user: "System" },
  ];

  const formDialog = (
    <DialogContent className="bg-[#0d1a2e] border border-[#12233e] text-white max-w-2xl">
      <DialogHeader>
        <DialogTitle className="text-xl font-semibold flex items-center gap-2">
          {editId ? <Edit className="w-5 h-5 text-[#3b82f6]" /> : <UserPlus className="w-5 h-5 text-[#22c55e]" />}
          {editId ? "Edit Referral Details" : "Add New Referral"}
        </DialogTitle>
      </DialogHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-[#7a95b8] uppercase tracking-wider border-b border-[#12233e] pb-2">Referrer Information</h4>
          <div>
            <label className="block text-sm font-medium text-[#c8d8ec] mb-1">Referrer Name <span className="text-red-500">*</span></label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a95b8]" />
              <input 
                className="rc-input w-full pl-9" 
                value={form.referrerName} 
                onChange={(e) => setForm(f => ({ ...f, referrerName: e.target.value }))} 
                placeholder="Who referred them?" 
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#c8d8ec] mb-1">Source Channel</label>
            <Select value={form.source} onValueChange={v => setForm(f => ({ ...f, source: v as any }))}>
              <SelectTrigger className="rc-input w-full h-10"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                {SOURCES.map((s) => <SelectItem key={s} value={s} className="hover:bg-[#12233e] focus:bg-[#12233e] focus:text-white cursor-pointer">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#c8d8ec] mb-1">Associated Campaign (Optional)</label>
            <div className="relative">
              <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a95b8]" />
              <input 
                className="rc-input w-full pl-9" 
                value={form.campaign} 
                onChange={(e) => setForm(f => ({ ...f, campaign: e.target.value }))} 
                placeholder="e.g. Spring Drive 2024" 
              />
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-[#7a95b8] uppercase tracking-wider border-b border-[#12233e] pb-2">Prospect Information</h4>
          <div>
            <label className="block text-sm font-medium text-[#c8d8ec] mb-1">Prospect Name <span className="text-red-500">*</span></label>
            <div className="relative">
              <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a95b8]" />
              <input 
                className="rc-input w-full pl-9" 
                value={form.referredName} 
                onChange={(e) => setForm(f => ({ ...f, referredName: e.target.value }))} 
                placeholder="Prospect's full name" 
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#c8d8ec] mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a95b8]" />
                <input 
                  type="email" 
                  className="rc-input w-full pl-9" 
                  value={form.referredEmail} 
                  onChange={(e) => setForm(f => ({ ...f, referredEmail: e.target.value }))} 
                  placeholder="email@example.com" 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#c8d8ec] mb-1">Phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a95b8]" />
                <input 
                  className="rc-input w-full pl-9" 
                  value={form.referredPhone} 
                  onChange={(e) => setForm(f => ({ ...f, referredPhone: e.target.value }))} 
                  placeholder="(555) 123-4567" 
                />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#c8d8ec] mb-1">Estimated Value</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a95b8] z-10" />
                <NumberInput 
                  className="rc-input w-full pl-9" 
                  value={parseFloat(form.estimatedValue) || 0} 
                  onChange={(v) => setForm(f => ({ ...f, estimatedValue: v ? v.toString() : "" }))} 
                  placeholder="50,000" 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#c8d8ec] mb-1">Priority</label>
              <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                <SelectTrigger className="rc-input w-full h-10"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                  <SelectItem value="low" className="hover:bg-[#12233e] cursor-pointer">Low</SelectItem>
                  <SelectItem value="medium" className="hover:bg-[#12233e] cursor-pointer">Medium</SelectItem>
                  <SelectItem value="high" className="hover:bg-[#12233e] cursor-pointer">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-2">
        <label className="block text-sm font-medium text-[#c8d8ec] mb-1">Additional Notes</label>
        <textarea 
          className="rc-input w-full min-h-[80px] py-2" 
          value={form.notes} 
          onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} 
          placeholder="Background context, interests, or specific needs..." 
          rows={3} 
        />
      </div>
      
      <DialogFooter className="mt-6 border-t border-[#12233e] pt-4">
        <Button variant="outline" className="bg-transparent border-[#12233e] text-white hover:bg-[#12233e]" onClick={() => setShowAdd(false)}>
          Cancel
        </Button>
        <Button 
          className="bg-[#3b82f6] hover:bg-[#2563eb] text-white" 
          onClick={handleSubmit} 
          disabled={createMut.isPending || updateMut.isPending}
        >
          {(createMut.isPending || updateMut.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {editId ? "Update Referral" : "Save Referral"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );

  return (
    <AppShell>
      <div className="space-y-6 pb-12">
        {/* Header Section */}
        <div className="rc-page-header flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#0d1a2e] to-[#060d19] p-6 rounded-xl border border-[#12233e] shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-[#3b82f6]/20 to-[#22c55e]/20 border border-[#3b82f6]/30 rounded-2xl shadow-inner">
              <Users className="w-8 h-8 text-[#3b82f6]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Referral Tracker</h1>
              <p className="text-[#7a95b8] mt-1 flex items-center gap-2">
                <Target className="w-4 h-4" /> 
                Track, analyze, and convert your professional and client referrals.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ExportToSlides
              toolName="Referral Tracker Analytics"
              getSections={() => [
                {
                  title: "Referral Pipeline Overview",
                  items: [
                    { label: "Total Referrals", value: stats.total.toString() },
                    { label: "Converted", value: stats.converted.toString() },
                    { label: "In Pipeline", value: stats.pending.toString() },
                    { label: "Conversion Rate", value: `${stats.conversionRate}%` },
                    { label: "Total Value Generated", value: `$${(stats.totalValue / 1000).toFixed(1)}K` }
                  ]
                }
              ]}
            />
            <Button variant="outline" className="bg-[#0d1a2e] border-[#12233e] text-white hover:bg-[#12233e]" onClick={handleRefresh} disabled={isRefreshing}>
              <Activity className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button variant="outline" className="bg-[#0d1a2e] border-[#12233e] text-white hover:bg-[#12233e]" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
            <Dialog open={showAdd} onOpenChange={(o) => { setShowAdd(o); if (!o) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white shadow-lg shadow-[#3b82f6]/20">
                  <Plus className="w-4 h-4 mr-2" /> New Referral
                </Button>
              </DialogTrigger>
              {formDialog}
            </Dialog>
          </div>
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-[#0d1a2e] to-[#0a1424] border-[#12233e] shadow-md hover:border-[#3b82f6]/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-[#7a95b8] mb-1">Total Pipeline</p>
                  <h3 className="text-3xl font-bold text-white">{stats.total}</h3>
                </div>
                <div className="p-3 bg-[#3b82f6]/10 rounded-lg">
                  <Users className="w-5 h-5 text-[#3b82f6]" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <TrendingUp className="w-4 h-4 text-[#22c55e] mr-1" />
                <span className="text-[#22c55e] font-medium">+{stats.thisMonth}</span>
                <span className="text-[#7a95b8] ml-2">this month ({stats.growth}%)</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-[#0d1a2e] to-[#0a1424] border-[#12233e] shadow-md hover:border-[#22c55e]/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-[#7a95b8] mb-1">Converted</p>
                  <h3 className="text-3xl font-bold text-white">{stats.converted}</h3>
                </div>
                <div className="p-3 bg-[#22c55e]/10 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-[#22c55e]" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <Target className="w-4 h-4 text-[#f0c040] mr-1" />
                <span className="text-[#f0c040] font-medium">{stats.conversionRate}%</span>
                <span className="text-[#7a95b8] ml-2">win rate</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-[#0d1a2e] to-[#0a1424] border-[#12233e] shadow-md hover:border-[#f0c040]/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-[#7a95b8] mb-1">Active Pipeline</p>
                  <h3 className="text-3xl font-bold text-white">{stats.pending}</h3>
                </div>
                <div className="p-3 bg-[#f0c040]/10 rounded-lg">
                  <Clock className="w-5 h-5 text-[#f0c040]" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <DollarSign className="w-4 h-4 text-[#3b82f6] mr-1" />
                <span className="text-white font-medium">{formatCurrency(stats.pipelineValue)}</span>
                <span className="text-[#7a95b8] ml-2">est. value</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-[#0d1a2e] to-[#0a1424] border-[#12233e] shadow-md hover:border-[#8b5cf6]/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-[#7a95b8] mb-1">Total Value Won</p>
                  <h3 className="text-3xl font-bold text-white">${(stats.totalValue / 1000).toFixed(1)}K</h3>
                </div>
                <div className="p-3 bg-[#8b5cf6]/10 rounded-lg">
                  <Award className="w-5 h-5 text-[#8b5cf6]" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <Briefcase className="w-4 h-4 text-[#7a95b8] mr-1" />
                <span className="text-[#7a95b8]">From {stats.converted} clients</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-[#0d1a2e] border border-[#12233e] p-1 h-12 w-full justify-start overflow-x-auto flex-nowrap">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#1a2c47] data-[state=active]:text-white text-[#7a95b8] rounded-md px-6">
              <Activity className="w-4 h-4 mr-2" /> Overview
            </TabsTrigger>
            <TabsTrigger value="list" className="data-[state=active]:bg-[#1a2c47] data-[state=active]:text-white text-[#7a95b8] rounded-md px-6">
              <FileText className="w-4 h-4 mr-2" /> Directory
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-[#1a2c47] data-[state=active]:text-white text-[#7a95b8] rounded-md px-6">
              <BarChartIcon className="w-4 h-4 mr-2" /> Analytics
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="data-[state=active]:bg-[#1a2c47] data-[state=active]:text-white text-[#7a95b8] rounded-md px-6">
              <Zap className="w-4 h-4 mr-2" /> Campaigns
            </TabsTrigger>
            <TabsTrigger value="team" className="data-[state=active]:bg-[#1a2c47] data-[state=active]:text-white text-[#7a95b8] rounded-md px-6">
              <Award className="w-4 h-4 mr-2" /> Leaderboard
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: OVERVIEW */}
          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Charts */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-[#0d1a2e] border-[#12233e]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-[#3b82f6]" /> 
                      Referral Volume Trend (6 Months)
                    </CardTitle>
                    <CardDescription className="text-[#7a95b8]">New referrals and conversions over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full mt-4">
                      {trendData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                            <XAxis dataKey="name" stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <YAxis stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#0a1424', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }}
                              itemStyle={{ color: '#c8d8ec' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '10px' }} />
                            <Area type="monotone" dataKey="total" name="Total Referrals" fillOpacity={1} fill="url(#colorTotal)" stroke="#3b82f6" strokeWidth={2} />
                            <Bar dataKey="converted" name="Converted" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={20} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-[#7a95b8]">Not enough data to display trend</div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-[#0d1a2e] border-[#12233e]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                        <PieChartIcon className="w-5 h-5 text-[#8b5cf6]" /> 
                        Status Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[250px] w-full">
                        {statusData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsPieChart>
                              <Pie 
                                data={statusData} 
                                cx="50%" 
                                cy="50%" 
                                innerRadius={60} 
                                outerRadius={80} 
                                paddingAngle={5}
                                dataKey="value" 
                                nameKey="name"
                              >
                                {statusData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#0a1424', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }}
                                itemStyle={{ color: '#c8d8ec' }}
                              />
                              <Legend layout="vertical" verticalAlign="middle" align="right" />
                            </RechartsPieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-[#7a95b8]">No data available</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#0d1a2e] border-[#12233e]">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                        <BarChartIcon className="w-5 h-5 text-[#f0c040]" /> 
                        Conversion Funnel
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[250px] w-full">
                        {conversionFunnelData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={conversionFunnelData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#12233e" horizontal={false} />
                              <XAxis type="number" stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                              <YAxis dataKey="stage" type="category" stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                              <Tooltip 
                                cursor={{fill: '#12233e', opacity: 0.4}}
                                contentStyle={{ backgroundColor: '#0a1424', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }}
                              />
                              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                                {conversionFunnelData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-[#7a95b8]">No data available</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Right Column: Activity & Quick Actions */}
              <div className="space-y-6">
                <Card className="bg-[#0d1a2e] border-[#12233e]">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                      <LinkIcon className="w-5 h-5 text-[#3b82f6]" /> 
                      Your Referral Links
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 bg-[#12233e] rounded-lg border border-[#1a2c47]">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-white">General Link</span>
                        <Badge variant="outline" className="bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20">Active</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input readOnly value="https://rc.app/ref/general-xyz" className="h-8 bg-[#0a1424] border-[#1a2c47] text-[#7a95b8] text-xs" />
                        <Button size="sm" variant="secondary" className="h-8 px-2 bg-[#1a2c47] hover:bg-[#253858] text-white" onClick={() => handleCopyLink("https://rc.app/ref/general-xyz")}>
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-[#12233e] rounded-lg border border-[#1a2c47]">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-white">Spring Campaign</span>
                        <Badge variant="outline" className="bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20">Campaign</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input readOnly value="https://rc.app/ref/spring-24" className="h-8 bg-[#0a1424] border-[#1a2c47] text-[#7a95b8] text-xs" />
                        <Button size="sm" variant="secondary" className="h-8 px-2 bg-[#1a2c47] hover:bg-[#253858] text-white" onClick={() => handleCopyLink("https://rc.app/ref/spring-24")}>
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    
                    <Button className="w-full bg-transparent border border-dashed border-[#3b82f6]/50 text-[#3b82f6] hover:bg-[#3b82f6]/10" onClick={handleGenerateLink}>
                      <Plus className="w-4 h-4 mr-2" /> Generate New Link
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-[#0d1a2e] border-[#12233e]">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                      <Clock className="w-5 h-5 text-[#7a95b8]" /> 
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockActivityLog.map((activity) => (
                        <div key={activity.id} className="flex gap-3">
                          <div className="mt-0.5">
                            <div className="w-2 h-2 rounded-full bg-[#3b82f6] mt-1.5"></div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{activity.action}</p>
                            <p className="text-xs text-[#7a95b8]">{activity.details}</p>
                            <p className="text-xs text-[#4b6382] mt-0.5">{activity.time} • {activity.user}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button variant="ghost" className="w-full text-sm text-[#3b82f6] hover:text-[#60a5fa] hover:bg-transparent">
                      View All Activity <ArrowUpRight className="w-3 h-3 ml-1" />
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: DIRECTORY / LIST */}
          <TabsContent value="list" className="mt-6 space-y-4">
            <Card className="bg-[#0d1a2e] border-[#12233e]">
              <CardHeader className="pb-4 border-b border-[#12233e]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <CardTitle className="text-lg font-semibold text-white">Referral Directory</CardTitle>
                  
                  {/* Advanced Filters */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative w-full md:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a95b8]" />
                      <Input 
                        placeholder="Search names, emails..." 
                        className="pl-9 bg-[#0a1424] border-[#1a2c47] text-white"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[140px] bg-[#0a1424] border-[#1a2c47] text-white">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                        <SelectItem value="all">All Statuses</SelectItem>
                        {Object.entries(STATUS_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select value={sourceFilter} onValueChange={setSourceFilter}>
                      <SelectTrigger className="w-[140px] bg-[#0a1424] border-[#1a2c47] text-white">
                        <SelectValue placeholder="Source" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                        <SelectItem value="all">All Sources</SelectItem>
                        {SOURCES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                      <SelectTrigger className="w-[140px] bg-[#0a1424] border-[#1a2c47] text-white">
                        <SelectValue placeholder="Timeframe" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                        <SelectItem value="all_time">All Time</SelectItem>
                        <SelectItem value="30d">Last 30 Days</SelectItem>
                        <SelectItem value="90d">Last 90 Days</SelectItem>
                        <SelectItem value="1y">Last Year</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {(searchQuery || statusFilter !== 'all' || sourceFilter !== 'all' || dateRangeFilter !== 'all_time') && (
                      <Button variant="ghost" size="icon" onClick={clearFilters} className="text-[#ef4444] hover:bg-[#ef4444]/10 hover:text-[#ef4444]" title="Clear Filters">
                        <XCircle className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  {!referrals ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <Loader2 className="w-8 h-8 animate-spin text-[#3b82f6] mb-4" />
                      <span className="text-[#7a95b8]">Loading referrals data...</span>
                    </div>
                  ) : filteredReferrals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-16 h-16 rounded-full bg-[#12233e] flex items-center justify-center mb-4">
                        <Users className="w-8 h-8 text-[#7a95b8]" />
                      </div>
                      <h4 className="text-lg font-medium text-white mb-2">No referrals found</h4>
                      <p className="text-[#7a95b8] max-w-sm mb-6">
                        {searchQuery || statusFilter !== 'all' ? "No referrals match your search criteria. Try adjusting your filters." : "You haven't added any referrals yet. Track your referral pipeline to measure growth."}
                      </p>
                      {!searchQuery && statusFilter === 'all' && (
                        <Button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white" onClick={() => { resetForm(); setShowAdd(true); }}>
                          <Plus className="w-4 h-4 mr-2" /> Add First Referral
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader className="bg-[#060d19]/50">
                        <TableRow className="border-[#12233e] hover:bg-transparent">
                          <TableHead className="text-[#7a95b8] font-medium cursor-pointer" onClick={() => handleSort('referredName')}>
                            Prospect {sortConfig.key === 'referredName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                          </TableHead>
                          <TableHead className="text-[#7a95b8] font-medium cursor-pointer" onClick={() => handleSort('referrerName')}>
                            Referred By {sortConfig.key === 'referrerName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                          </TableHead>
                          <TableHead className="text-[#7a95b8] font-medium">Contact Info</TableHead>
                          <TableHead className="text-[#7a95b8] font-medium cursor-pointer" onClick={() => handleSort('source')}>
                            Source {sortConfig.key === 'source' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                          </TableHead>
                          <TableHead className="text-[#7a95b8] font-medium cursor-pointer" onClick={() => handleSort('status')}>
                            Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                          </TableHead>
                          <TableHead className="text-[#7a95b8] font-medium text-right cursor-pointer" onClick={() => handleSort('estimatedValue')}>
                            Est. Value {sortConfig.key === 'estimatedValue' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                          </TableHead>
                          <TableHead className="text-[#7a95b8] font-medium cursor-pointer" onClick={() => handleSort('createdAt')}>
                            Date {sortConfig.key === 'createdAt' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                          </TableHead>
                          <TableHead className="text-[#7a95b8] font-medium text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredReferrals.map((r) => (
                          <TableRow key={r.id} className="border-[#12233e] hover:bg-[#12233e]/30 transition-colors">
                            <TableCell className="font-medium text-white">
                              <div>{r.referredName}</div>
                              {r.priority === 'high' && <Badge variant="outline" className="mt-1 bg-red-500/10 text-red-500 border-red-500/20 text-[10px] px-1.5 py-0">High Priority</Badge>}
                            </TableCell>
                            <TableCell className="text-[#c8d8ec]">{r.referrerName}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3 text-[#7a95b8]">
                                {r.referredEmail ? (
                                  <a href={`mailto:${r.referredEmail}`} className="hover:text-[#3b82f6] transition-colors" title={r.referredEmail}>
                                    <Mail className="w-4 h-4" />
                                  </a>
                                ) : <Mail className="w-4 h-4 opacity-30" />}
                                {r.referredPhone ? (
                                  <a href={`tel:${r.referredPhone}`} className="hover:text-[#3b82f6] transition-colors" title={r.referredPhone}>
                                    <Phone className="w-4 h-4" />
                                  </a>
                                ) : <Phone className="w-4 h-4 opacity-30" />}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-[#12233e] text-[#c8d8ec] border-[#1a2c47] font-normal">
                                {r.source || "—"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Select value={r.status} onValueChange={(v) => handleStatusChange(r.id, v)}>
                                <SelectTrigger className="h-8 w-[140px] bg-transparent border-none p-0 focus:ring-0 shadow-none">
                                  <span className={`rc-badge ${STATUS_COLORS[r.status] || "rc-badge-blue"}`}>
                                    {STATUS_LABELS[r.status] || r.status}
                                  </span>
                                </SelectTrigger>
                                <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                                  {Object.entries(STATUS_LABELS).map(([k, v]) => (
                                    <SelectItem key={k} value={k} className="hover:bg-[#12233e] focus:bg-[#12233e] focus:text-white cursor-pointer">{v}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-right text-[#c8d8ec] font-medium">
                              {r.estimatedValue ? formatCurrency(parseFloat(r.estimatedValue)) : "—"}
                            </TableCell>
                            <TableCell className="text-[#7a95b8] text-sm">
                              {formatDate(r.createdAt)}
                            </TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0 text-[#7a95b8] hover:text-white hover:bg-[#12233e]">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-[#0d1a2e] border-[#12233e] text-white">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuItem className="hover:bg-[#12233e] cursor-pointer" onClick={() => openEdit(r)}>
                                    <Edit className="mr-2 h-4 w-4" /> Edit details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="hover:bg-[#12233e] cursor-pointer">
                                    <MessageSquare className="mr-2 h-4 w-4" /> Log interaction
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-[#12233e]" />
                                  <DropdownMenuItem 
                                    className="text-red-500 hover:bg-red-500/10 hover:text-red-500 cursor-pointer"
                                    onClick={() => {
                                      if (confirm(`Delete referral for "${r.referredName}"?`)) {
                                        deleteMut.mutate({ id: r.id });
                                      }
                                    }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: DEEP ANALYTICS */}
          <TabsContent value="analytics" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-[#0d1a2e] border-[#12233e]">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                    <BarChartIcon className="w-5 h-5 text-[#3b82f6]" /> 
                    Referrals by Source
                  </CardTitle>
                  <CardDescription className="text-[#7a95b8]">Volume and estimated value by origin</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    {sourceData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sourceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                          <XAxis dataKey="source" stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                          <YAxis yAxisId="left" orientation="left" stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                          <YAxis yAxisId="right" orientation="right" stroke="#22c55e" tick={{ fill: '#22c55e', fontSize: 12 }} axisLine={false} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0a1424', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }}
                            cursor={{ fill: '#12233e', opacity: 0.4 }}
                          />
                          <Legend />
                          <Bar yAxisId="left" dataKey="count" name="Count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          <Line yAxisId="right" type="monotone" dataKey="value" name="Value ($)" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-[#7a95b8]">No data available</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#0d1a2e] border-[#12233e]">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-[#f0c040]" /> 
                    Top Referrers
                  </CardTitle>
                  <CardDescription className="text-[#7a95b8]">Your most valuable network connections</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    {topReferrersData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={topReferrersData}>
                          <PolarGrid stroke="#12233e" />
                          <PolarAngleAxis dataKey="name" tick={{ fill: '#c8d8ec', fontSize: 11 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: '#7a95b8' }} />
                          <Radar name="Referral Count" dataKey="count" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0a1424', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-[#7a95b8]">No data available</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card className="bg-[#0d1a2e] border-[#12233e]">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white">Top Advocates Directory</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader className="bg-[#060d19]/50">
                    <TableRow className="border-[#12233e] hover:bg-transparent">
                      <TableHead className="text-[#7a95b8] font-medium">Name</TableHead>
                      <TableHead className="text-[#7a95b8] font-medium text-center">Total Referrals</TableHead>
                      <TableHead className="text-[#7a95b8] font-medium text-center">Converted</TableHead>
                      <TableHead className="text-[#7a95b8] font-medium text-right">Value Generated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topReferrersData.map((referrer, idx) => (
                      <TableRow key={idx} className="border-[#12233e] hover:bg-[#12233e]/30">
                        <TableCell className="font-medium text-white flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#1a2c47] flex items-center justify-center text-[#3b82f6] font-bold">
                            {referrer.name.charAt(0)}
                          </div>
                          {referrer.name}
                        </TableCell>
                        <TableCell className="text-center text-[#c8d8ec]">{referrer.count}</TableCell>
                        <TableCell className="text-center text-[#22c55e]">
                          {referrals.filter((r) => r.referrerName === referrer.name && r.status === 'converted').length}
                        </TableCell>
                        <TableCell className="text-right text-[#c8d8ec] font-medium">
                          {formatCurrency(referrer.value)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {topReferrersData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-[#7a95b8]">No referrer data available</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: CAMPAIGNS */}
          <TabsContent value="campaigns" className="mt-6 space-y-6">
            <Card className="bg-[#0d1a2e] border-[#12233e]">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-white">Referral Campaigns</CardTitle>
                  <CardDescription className="text-[#7a95b8]">Track performance of specific outreach efforts</CardDescription>
                </div>
                <Button className="bg-[#1a2c47] hover:bg-[#253858] text-white border border-[#3b82f6]/30">
                  <Plus className="w-4 h-4 mr-2" /> New Campaign
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader className="bg-[#060d19]/50">
                    <TableRow className="border-[#12233e] hover:bg-transparent">
                      <TableHead className="text-[#7a95b8] font-medium">Campaign Name</TableHead>
                      <TableHead className="text-[#7a95b8] font-medium">Type</TableHead>
                      <TableHead className="text-[#7a95b8] font-medium text-center">Sent / Reached</TableHead>
                      <TableHead className="text-[#7a95b8] font-medium text-center">Referrals</TableHead>
                      <TableHead className="text-[#7a95b8] font-medium text-center">Conversion</TableHead>
                      <TableHead className="text-[#7a95b8] font-medium text-right">Est. ROI</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockCampaigns.map((campaign) => (
                      <TableRow key={campaign.id} className="border-[#12233e] hover:bg-[#12233e]/30">
                        <TableCell className="font-medium text-white">{campaign.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-[#1a2c47] text-[#c8d8ec] border-[#12233e]">
                            {campaign.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-[#c8d8ec]">{campaign.sent}</TableCell>
                        <TableCell className="text-center text-[#3b82f6] font-medium">{campaign.referrals}</TableCell>
                        <TableCell className="text-center text-[#c8d8ec]">
                          {((campaign.referrals / campaign.sent) * 100).toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right text-[#22c55e] font-medium">{campaign.roi}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 5: LEADERBOARD */}
          <TabsContent value="team" className="mt-6 space-y-6">
            <Card className="bg-[#0d1a2e] border-[#12233e]">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#f0c040]" /> 
                  Team Leaderboard
                </CardTitle>
                <CardDescription className="text-[#7a95b8]">Top performing advisors by referral volume</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {/* Top 3 Podiums */}
                  {mockLeaderboard.slice(0, 3).map((person, idx) => (
                    <div key={person.rank} className={`relative p-6 rounded-xl border flex flex-col items-center text-center ${
                      idx === 0 ? 'bg-gradient-to-b from-[#f0c040]/20 to-[#0d1a2e] border-[#f0c040]/50 transform md:-translate-y-4' : 
                      idx === 1 ? 'bg-gradient-to-b from-[#c0c0c0]/20 to-[#0d1a2e] border-[#c0c0c0]/50' : 
                      'bg-gradient-to-b from-[#cd7f32]/20 to-[#0d1a2e] border-[#cd7f32]/50'
                    }`}>
                      <div className={`absolute -top-4 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-lg ${
                        idx === 0 ? 'bg-[#f0c040]' : idx === 1 ? 'bg-[#c0c0c0]' : 'bg-[#cd7f32]'
                      }`}>
                        {person.rank}
                      </div>
                      <div className="w-16 h-16 rounded-full bg-[#1a2c47] mb-3 flex items-center justify-center text-xl font-bold text-white border-2 border-transparent">
                        {person.name.charAt(0)}
                      </div>
                      <h4 className="text-lg font-bold text-white">{person.name}</h4>
                      <p className="text-sm text-[#7a95b8] mb-4">{person.role}</p>
                      
                      <div className="w-full grid grid-cols-2 gap-2 border-t border-[#12233e] pt-4 mt-auto">
                        <div>
                          <p className="text-xs text-[#7a95b8]">Referrals</p>
                          <p className="text-lg font-bold text-[#3b82f6]">{person.referrals}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[#7a95b8]">Volume</p>
                          <p className="text-lg font-bold text-[#22c55e]">{person.volume}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Table>
                  <TableHeader className="bg-[#060d19]/50">
                    <TableRow className="border-[#12233e] hover:bg-transparent">
                      <TableHead className="text-[#7a95b8] font-medium w-16 text-center">Rank</TableHead>
                      <TableHead className="text-[#7a95b8] font-medium">Advisor</TableHead>
                      <TableHead className="text-[#7a95b8] font-medium text-center">Referrals</TableHead>
                      <TableHead className="text-[#7a95b8] font-medium text-center">Converted</TableHead>
                      <TableHead className="text-[#7a95b8] font-medium text-right">Volume</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockLeaderboard.slice(3).map((person) => (
                      <TableRow key={person.rank} className="border-[#12233e] hover:bg-[#12233e]/30">
                        <TableCell className="text-center font-medium text-[#7a95b8]">{person.rank}</TableCell>
                        <TableCell>
                          <div className="font-medium text-white">{person.name}</div>
                          <div className="text-xs text-[#7a95b8]">{person.role}</div>
                        </TableCell>
                        <TableCell className="text-center text-[#c8d8ec]">{person.referrals}</TableCell>
                        <TableCell className="text-center text-[#22c55e]">{person.converted}</TableCell>
                        <TableCell className="text-right text-[#c8d8ec] font-medium">{person.volume}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <PageInsights pageId="referral-tracker" />
    </AppShell>
  );
}
