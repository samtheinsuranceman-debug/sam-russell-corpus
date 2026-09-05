// @ts-nocheck
import { AppShell } from "@/components/AppShell";
import { NumberInput } from "@/components/NumberInput";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useState, useMemo, useEffect } from "react";
import { Upload, FileText, CheckCircle, AlertCircle, Plus, Trash2, Search, Download, BarChart3, Play, RefreshCw, FileSpreadsheet, Settings, PieChartIcon, Activity, ArrowUpRight, Clock, Users, Zap, Shield, Target, Award, Calendar, ChevronDown, Filter, LayoutDashboard, Layers, TrendingUp, HelpCircle, Info, Maximize2, Minimize2, MoreHorizontal, MoreVertical, Edit2, Copy, Eye, Share2, Mail, Bell, MessageSquare, Briefcase, DollarSign, Percent, ArrowRight, ArrowLeft, ArrowDownRight } from "lucide-react";
import { toast } from "sonner";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  ComposedChart, 
  ScatterChart, 
  Scatter, 
  ZAxis, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  Legend
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface BatchRow {
  id: string;
  clientName: string;
  age: number;
  premium: number;
  years: number;
  status: "pending" | "done" | "error";
  productType: string;
  riskTolerance: string;
  targetReturn: number;
  notes: string;
  selected: boolean;
}

const COLORS = {
  pending: "#7a95b8",
  done: "#22c55e",
  error: "#ef4444",
  info: "#3b82f6",
  warning: "#f59e0b",
  purple: "#8b5cf6",
  pink: "#ec4899",
  teal: "#14b8a6",
  orange: "#f97316",
  cyan: "#06b6d4"
};

const CHART_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", 
  "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#84cc16"
];

const generateMockData = (count: number) => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `mock-${i}-${Math.random().toString(36).substr(2, 9)}`,
    clientName: `Client ${i + 1}`,
    age: 30 + Math.floor(Math.random() * 40),
    premium: 10000 + Math.floor(Math.random() * 90000),
    years: 5 + Math.floor(Math.random() * 25),
    status: Math.random() > 0.8 ? (Math.random() > 0.5 ? "error" : "done") : "pending" as any,
    productType: ["IUL", "VUL", "Term", "Whole Life", "Annuity"][Math.floor(Math.random() * 5)],
    riskTolerance: ["Low", "Medium", "High"][Math.floor(Math.random() * 3)],
    targetReturn: 4 + Math.floor(Math.random() * 8),
    notes: `Notes for client ${i + 1}`,
    selected: false
  }));
};

export default function BatchIllustration() {
  const { user } = useAuth();
  
  const { data: batchScheduleData } = trpc.batchSchedule.getSchedule.useQuery(undefined, { enabled: !!user });
  const { data: clientsData } = trpc.clients.list.useQuery(undefined, { enabled: !!user });
  const { data: carriersData } = trpc.carrierQuotes.list.useQuery(undefined, { enabled: !!user });
  const { data: riskData } = trpc.riskProfile.getProfile.useQuery(undefined, { enabled: !!user });
  const { data: analyticsData } = trpc.strategyAnalytics.getMetrics.useQuery(undefined, { enabled: !!user });
  const { data: leaderboardData } = trpc.leaderboard.getRankings.useQuery(undefined, { enabled: !!user });
  const { data: complianceData } = trpc.complianceTracking.getStatus.useQuery(undefined, { enabled: !!user });
  const { data: notificationsData } = trpc.activity.list.useQuery(undefined, { enabled: !!user });

  const [rows, setRows] = useState<BatchRow[]>([
    { id: "1", clientName: "John Smith", age: 45, premium: 50000, years: 5, status: "pending", productType: "IUL", riskTolerance: "Medium", targetReturn: 6, notes: "Needs review", selected: false },
    { id: "2", clientName: "Jane Doe", age: 52, premium: 75000, years: 7, status: "pending", productType: "VUL", riskTolerance: "High", targetReturn: 8, notes: "", selected: false },
    { id: "3", clientName: "Robert Johnson", age: 38, premium: 25000, years: 10, status: "pending", productType: "Term", riskTolerance: "Low", targetReturn: 4, notes: "Urgent", selected: false },
    { id: "4", clientName: "Emily Davis", age: 60, premium: 100000, years: 5, status: "done", productType: "Annuity", riskTolerance: "Low", targetReturn: 5, notes: "Completed yesterday", selected: false },
    { id: "5", clientName: "Michael Wilson", age: 41, premium: 35000, years: 15, status: "error", productType: "Whole Life", riskTolerance: "Medium", targetReturn: 5.5, notes: "Missing signature", selected: false },
    ...generateMockData(15)
  ]);
  
  const [processing, setProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "done" | "error">("all");
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  
  const [viewMode, setViewMode] = useState<"table" | "grid" | "compact">("table");
  const [sortBy, setSortBy] = useState<keyof BatchRow>("clientName");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [minPremium, setMinPremium] = useState<number>(0);
  const [maxPremium, setMaxPremium] = useState<number>(500000);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [chartTimeframe, setChartTimeframe] = useState("1M");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [compactMode, setCompactMode] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [exportFormat, setExportFormat] = useState("csv");
  const [simulationSpeed, setSimulationSpeed] = useState([1]);
  const [notificationVolume, setNotificationVolume] = useState([50]);
  const [activeMetric, setActiveMetric] = useState("premium");
  const [isEditing, setIsEditing] = useState(false);
  const [newRowData, setNewRowData] = useState<Partial<BatchRow>>({});
  const [chartType, setChartType] = useState("bar");
  const [dashboardLayout, setDashboardLayout] = useState("standard");
  const [pinStats, setPinStats] = useState(true);
  const [showTooltips, setShowTooltips] = useState(true);
  const [dataDensity, setDataDensity] = useState("normal");
  const [autoSave, setAutoSave] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const toggleRowSelection = (id: string) => {
    setRows(r => r.map((row) => row.id === id ? { ...row, selected: !row.selected } : row));
  };

  const selectAllRows = (selected: boolean) => {
    setRows(r => r.map((row) => ({ ...row, selected })));
  };

  const toggleRowExpansion = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const addRow = () => {
    setRows(r => [{ 
      id: Math.random().toString(36).substring(7),
      clientName: newRowData.clientName || "New Client", 
      age: newRowData.age || 45, 
      premium: newRowData.premium || 50000, 
      years: newRowData.years || 10, 
      status: "pending",
      productType: newRowData.productType || "IUL",
      riskTolerance: newRowData.riskTolerance || "Medium",
      targetReturn: newRowData.targetReturn || 6,
      notes: newRowData.notes || "",
      selected: false
    }, ...r]);
    toast.success("New row added");
    setNewRowData({});
  };

  const removeRow = (id: string) => {
    setRows(r => r.filter((row) => row.id !== id));
    toast.info("Row removed");
  };

  const duplicateRow = (id: string) => {
    const rowToDuplicate = rows.find((r) => r.id === id);
    if (rowToDuplicate) {
      setRows(r => [{ ...rowToDuplicate, id: Math.random().toString(36).substring(7), clientName: `${rowToDuplicate.clientName} (Copy)` }, ...r]);
      toast.success("Row duplicated");
    }
  };

  const updateRow = (id: string, field: keyof BatchRow, value: any) => {
    setRows(r => r.map((row) => row.id === id ? { ...row, [field]: value } : row));
  };

  const handleBulkAction = () => {
    const selectedCount = rows.filter((r) => r.selected).length;
    if (selectedCount === 0) {
      toast.error("No rows selected");
      return;
    }

    if (bulkAction === "delete") {
      setRows(r => r.filter((row) => !row.selected));
      toast.success(`Deleted ${selectedCount} rows`);
    } else if (bulkAction === "mark_done") {
      setRows(r => r.map((row) => row.selected ? { ...row, status: "done" } : row));
      toast.success(`Marked ${selectedCount} rows as done`);
    } else if (bulkAction === "mark_pending") {
      setRows(r => r.map((row) => row.selected ? { ...row, status: "pending" } : row));
      toast.success(`Marked ${selectedCount} rows as pending`);
    }
    
    selectAllRows(false);
    setBulkAction("");
  };

  const runBatch = async () => {
    setProcessing(true);
    toast.loading("Processing illustrations...");
    
    const pendingRows = rows.filter((r) => r.status === "pending");
    
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].status !== "pending") continue;
      
      await new Promise(r => setTimeout(r, 300 / simulationSpeed[0]));
      
      const isError = Math.random() > 0.9;
      setRows(r => r.map((row, idx) => idx === i ? { ...row, status: isError ? "error" : "done" } : row));
    }
    
    setProcessing(false);
    toast.dismiss();
    toast.success(`Batch processing completed`);
  };

  const exportData = async () => {
    setIsExporting(true);
    await new Promise(r => setTimeout(r, 800));
    
    if (exportFormat === "csv") {
      const headers = ["Client Name", "Age", "Premium", "Years", "Product", "Risk", "Status"];
      const csvContent = [
        headers.join(","),
        ...rows.map((r) => `"${r.clientName}",${r.age},${r.premium},${r.years},"${r.productType}","${r.riskTolerance}",${r.status}`)
      ].join("\n");
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `batch_illustrations_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      toast.success(`Exported as ${exportFormat.toUpperCase()}`);
    }
    
    setIsExporting(false);
    toast.success("Data exported successfully");
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSelectedProduct("all");
    setMinPremium(0);
    setMaxPremium(500000);
  };

  const filteredRows = useMemo(() => {
    let result = rows.filter((row) => {
      const matchesSearch = row.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            row.notes.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || row.status === statusFilter;
      const matchesProduct = selectedProduct === "all" || row.productType === selectedProduct;
      const matchesPremium = row.premium >= minPremium && row.premium <= maxPremium;
      
      return matchesSearch && matchesStatus && matchesProduct && matchesPremium;
    });

    result.sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

    return result;
  }, [rows, searchQuery, statusFilter, selectedProduct, minPremium, maxPremium, sortBy, sortOrder]);

  const stats = useMemo(() => {
    const total = rows.length;
    const done = rows.filter((r) => r.status === "done").length;
    const pending = rows.filter((r) => r.status === "pending").length;
    const error = rows.filter((r) => r.status === "error").length;
    const totalPremium = rows.reduce((sum, r) => sum + (r.premium || 0), 0);
    const avgAge = total > 0 ? Math.round(rows.reduce((sum, r) => sum + (r.age || 0), 0) / total) : 0;
    const avgPremium = total > 0 ? Math.round(totalPremium / total) : 0;
    const successRate = total > 0 ? Math.round((done / total) * 100) : 0;
    const selectedCount = rows.filter((r) => r.selected).length;
    
    return { total, done, pending, error, totalPremium, avgAge, avgPremium, successRate, selectedCount };
  }, [rows]);

  const pieData = useMemo(() => [
    { name: 'Completed', value: stats.done, color: COLORS.done },
    { name: 'Pending', value: stats.pending, color: COLORS.pending },
    { name: 'Error', value: stats.error, color: COLORS.error },
  ].filter((d) => d.value > 0), [stats]);

  const premiumData = useMemo(() => {
    return rows.map((r) => ({
      name: r.clientName.split(' ')[0] || 'Unnamed',
      premium: r.premium,
      status: r.status,
      target: r.premium * (1 + r.targetReturn/100)
    })).sort((a, b) => b.premium - a.premium).slice(0, 15);
  }, [rows]);

  const productDistributionData = useMemo(() => {
    const dist: Record<string, number> = {};
    rows.forEach((r) => {
      dist[r.productType] = (dist[r.productType] || 0) + 1;
    });
    return Object.entries(dist).map(([name, value], i) => ({
      name,
      value,
      color: CHART_COLORS[i % CHART_COLORS.length]
    }));
  }, [rows]);

  const agePremiumScatterData = useMemo(() => {
    return rows.map((r) => ({
      x: r.age,
      y: r.premium,
      z: r.years,
      name: r.clientName,
      type: r.productType
    }));
  }, [rows]);

  const riskRadarData = useMemo(() => {
    const riskCounts = { Low: 0, Medium: 0, High: 0 };
    let totalPremium = { Low: 0, Medium: 0, High: 0 };
    
    rows.forEach((r) => {
      if (r.riskTolerance in riskCounts) {
        riskCounts[r.riskTolerance as keyof typeof riskCounts]++;
        totalPremium[r.riskTolerance as keyof typeof totalPremium] += r.premium;
      }
    });
    
    return [
      { subject: 'Conservative', A: riskCounts.Low * 10, B: totalPremium.Low / 10000, fullMark: 150 },
      { subject: 'Moderate', A: riskCounts.Medium * 10, B: totalPremium.Medium / 10000, fullMark: 150 },
      { subject: 'Aggressive', A: riskCounts.High * 10, B: totalPremium.High / 10000, fullMark: 150 },
      { subject: 'Growth', A: (riskCounts.Medium + riskCounts.High) * 5, B: (totalPremium.Medium + totalPremium.High) / 20000, fullMark: 150 },
      { subject: 'Income', A: (riskCounts.Low + riskCounts.Medium) * 5, B: (totalPremium.Low + totalPremium.Medium) / 20000, fullMark: 150 },
    ];
  }, [rows]);

  const timeSeriesData = useMemo(() => {
    const data = [];
    let currentPending = stats.total;
    let currentDone = 0;
    let currentError = 0;
    
    for (let i = 0; i <= 10; i++) {
      data.push({
        time: `T+${i}`,
        pending: Math.max(0, currentPending - i * (stats.total / 10)),
        completed: Math.min(stats.total, currentDone + i * (stats.done / 10)),
        errors: Math.min(stats.total, currentError + i * (stats.error / 10)),
        efficiency: 50 + Math.random() * 40 + i * 2
      });
    }
    return data;
  }, [stats]);

  const renderTableHeaders = () => (
    <TableRow className="hover:bg-transparent border-[#12233e]">
      <TableHead className="w-[50px]">
        <Checkbox 
          checked={stats.selectedCount === filteredRows.length && filteredRows.length > 0}
          onCheckedChange={(checked) => selectAllRows(!!checked)}
          className="border-[#7a95b8] data-[state=checked]:bg-blue-500"
        />
      </TableHead>
      <TableHead className="cursor-pointer text-[#7a95b8] hover:text-white transition-colors" onClick={() => { setSortBy("clientName"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }}>
        <div className="flex items-center gap-1">Client Name {sortBy === "clientName" && (sortOrder === "asc" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />)}</div>
      </TableHead>
      <TableHead className="cursor-pointer text-[#7a95b8] hover:text-white transition-colors" onClick={() => { setSortBy("age"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }}>
        <div className="flex items-center gap-1">Age {sortBy === "age" && (sortOrder === "asc" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />)}</div>
      </TableHead>
      <TableHead className="cursor-pointer text-[#7a95b8] hover:text-white transition-colors" onClick={() => { setSortBy("premium"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }}>
        <div className="flex items-center gap-1">Premium {sortBy === "premium" && (sortOrder === "asc" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />)}</div>
      </TableHead>
      <TableHead className="cursor-pointer text-[#7a95b8] hover:text-white transition-colors" onClick={() => { setSortBy("productType"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }}>
        <div className="flex items-center gap-1">Product {sortBy === "productType" && (sortOrder === "asc" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />)}</div>
      </TableHead>
      <TableHead className="cursor-pointer text-[#7a95b8] hover:text-white transition-colors" onClick={() => { setSortBy("status"); setSortOrder(sortOrder === "asc" ? "desc" : "asc"); }}>
        <div className="flex items-center gap-1">Status {sortBy === "status" && (sortOrder === "asc" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />)}</div>
      </TableHead>
      <TableHead className="text-right text-[#7a95b8]">Actions</TableHead>
    </TableRow>
  );

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6 animate-pulse p-6">
          <Skeleton className="h-12 w-1/3 bg-[#12233e]" />
          <div className="grid grid-cols-4 gap-4">
            <Skeleton className="h-32 bg-[#12233e]" />
            <Skeleton className="h-32 bg-[#12233e]" />
            <Skeleton className="h-32 bg-[#12233e]" />
            <Skeleton className="h-32 bg-[#12233e]" />
          </div>
          <Skeleton className="h-[500px] bg-[#12233e]" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 pb-20 p-2 md:p-6 bg-[#030712] min-h-screen text-slate-200">
        
        {/* Top Header Navigation */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 rc-page-header bg-[#060d19] p-4 rounded-xl border border-[#12233e] shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-800 rounded-xl shadow-inner">
              <Layers className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                Enterprise Batch Processing
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">v2.4</Badge>
              </h1>
              <p className="text-[#7a95b8] text-sm mt-1 flex items-center gap-2">
                <Clock className="w-3 h-3" /> Last run: {new Date().toLocaleTimeString()}
                <span className="text-[#12233e]">|</span>
                <Users className="w-3 h-3" /> {stats.total} Active Clients
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={() => setAutoRefresh(!autoRefresh)} className={`border-[#12233e] ${autoRefresh ? 'bg-blue-500/20 text-blue-400' : 'bg-transparent text-[#7a95b8] hover:text-white'}`}>
                    <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Auto-refresh {autoRefresh ? 'On' : 'Off'}</p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="border-[#12233e] bg-transparent text-[#7a95b8] hover:text-white relative">
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 bg-[#060d19] border-[#12233e] text-slate-200">
                <div className="space-y-4">
                  <h4 className="font-medium text-white flex items-center gap-2"><Bell className="w-4 h-4" /> Notifications</h4>
                  <div className="space-y-2">
                    <div className="p-2 bg-[#12233e]/50 rounded text-sm">
                      <p className="font-medium text-blue-400">Batch Completed</p>
                      <p className="text-xs text-[#7a95b8]">Yesterday's batch finished with 98% success rate.</p>
                    </div>
                    <div className="p-2 bg-[#12233e]/50 rounded text-sm">
                      <p className="font-medium text-amber-400">Compliance Alert</p>
                      <p className="text-xs text-[#7a95b8]">3 illustrations require manual review.</p>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="border-[#12233e] bg-transparent text-[#7a95b8] hover:text-white">
                  <Settings className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#060d19] border-[#12233e] text-slate-200 sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="text-white">Batch Settings</DialogTitle>
                  <DialogDescription className="text-[#7a95b8]">Configure processing parameters and UI preferences.</DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <Label className="text-white">Simulation Speed</Label>
                    <Slider value={simulationSpeed} onValueChange={setSimulationSpeed} max={10} min={0.5} step={0.5} className="py-4" />
                    <p className="text-xs text-[#7a95b8] text-right">{simulationSpeed}x</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Auto-Save Configuration</Label>
                    <Switch checked={autoSave} onCheckedChange={setAutoSave} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Compact Mode</Label>
                    <Switch checked={compactMode} onCheckedChange={setCompactMode} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Default Export Format</Label>
                    <Select value={exportFormat} onValueChange={setExportFormat}>
                      <SelectTrigger className="bg-[#0d1a2e] border-[#12233e]">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                        <SelectItem value="csv">CSV (Spreadsheet)</SelectItem>
                        <SelectItem value="json">JSON (Data)</SelectItem>
                        <SelectItem value="pdf">PDF (Report)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => setIsSettingsOpen(false)} className="bg-blue-600 hover:bg-blue-700 text-white">Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="border-[#12233e] bg-transparent text-[#c8d8ec] hover:bg-[#12233e] hover:text-white">
                  <Download className="w-4 h-4 mr-2" /> Export
                  <ChevronDown className="w-3 h-3 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#060d19] border-[#12233e] text-slate-200">
                <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#12233e]" />
                <DropdownMenuItem onClick={() => { setExportFormat("csv"); exportData(); }} className="hover:bg-[#12233e] cursor-pointer"><FileSpreadsheet className="w-4 h-4 mr-2" /> Download CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setExportFormat("pdf"); exportData(); }} className="hover:bg-[#12233e] cursor-pointer"><FileText className="w-4 h-4 mr-2" /> Generate PDF Report</DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setExportFormat("json"); exportData(); }} className="hover:bg-[#12233e] cursor-pointer"><Activity className="w-4 h-4 mr-2" /> Raw JSON Data</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <ExportToSlides
              toolName="Enterprise Batch Illustration"
              getSections={() => [
                {
                  title: "Batch Processing Executive Summary",
                  items: [
                    { label: "Total Client Records", value: stats.total.toString() },
                    { label: "Successfully Processed", value: stats.done.toString() },
                    { label: "Pending Processing", value: stats.pending.toString() },
                    { label: "Total Premium Volume", value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.totalPremium) },
                    { label: "Average Client Age", value: stats.avgAge.toString() },
                    { label: "Success Rate", value: `${stats.successRate}%` }
                  ]
                }
              ]}
            />
            
            <Button 
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-900/20 border-0"
              onClick={runBatch}
              disabled={processing || stats.pending === 0}
            >
              {processing ? (
                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Processing {stats.pending}...</>
              ) : (
                <><Play className="w-4 h-4 mr-2" /> Execute Batch</>
              )}
            </Button>
          </div>
        </div>

        {/* Dynamic Metrics Dashboard */}
        {pinStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="bg-[#060d19] border-[#12233e] hover:border-blue-500/50 transition-all cursor-pointer overflow-hidden group" onClick={() => setActiveMetric("total")}>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardContent className="p-5 relative z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-medium text-[#7a95b8] uppercase tracking-wider mb-1">Total Volume</p>
                    <h3 className="text-3xl font-bold text-white">{stats.total}</h3>
                    <p className="text-xs text-emerald-400 flex items-center mt-2"><TrendingUp className="w-3 h-3 mr-1" /> +12% vs last week</p>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                    <Users className="w-5 h-5 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-[#060d19] border-[#12233e] hover:border-emerald-500/50 transition-all cursor-pointer overflow-hidden group" onClick={() => setActiveMetric("premium")}>
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardContent className="p-5 relative z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-medium text-[#7a95b8] uppercase tracking-wider mb-1">Total Premium</p>
                    <h3 className="text-3xl font-bold text-white">
                      ${(stats.totalPremium / 1000000).toFixed(2)}M
                    </h3>
                    <p className="text-xs text-emerald-400 flex items-center mt-2"><TrendingUp className="w-3 h-3 mr-1" /> +$450k new</p>
                  </div>
                  <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#060d19] border-[#12233e] hover:border-indigo-500/50 transition-all cursor-pointer overflow-hidden group" onClick={() => setActiveMetric("success")}>
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardContent className="p-5 relative z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-medium text-[#7a95b8] uppercase tracking-wider mb-1">Success Rate</p>
                    <h3 className="text-3xl font-bold text-white">{stats.successRate}%</h3>
                    <Progress value={stats.successRate} className="h-1 mt-3 bg-[#12233e] bg-indigo-500" />
                  </div>
                  <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                    <Target className="w-5 h-5 text-indigo-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-[#060d19] border-[#12233e] hover:border-amber-500/50 transition-all cursor-pointer overflow-hidden group" onClick={() => setStatusFilter("pending")}>
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardContent className="p-5 relative z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-medium text-[#7a95b8] uppercase tracking-wider mb-1">Pending Queue</p>
                    <h3 className="text-3xl font-bold text-white">{stats.pending}</h3>
                    <p className="text-xs text-[#7a95b8] mt-2">Est. time: {Math.ceil(stats.pending * 0.5)} mins</p>
                  </div>
                  <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                    <Clock className="w-5 h-5 text-amber-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-[#060d19] border-[#12233e] hover:border-red-500/50 transition-all cursor-pointer overflow-hidden group" onClick={() => setStatusFilter("error")}>
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardContent className="p-5 relative z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-medium text-[#7a95b8] uppercase tracking-wider mb-1">Failed Runs</p>
                    <h3 className="text-3xl font-bold text-white">{stats.error}</h3>
                    <p className="text-xs text-red-400 flex items-center mt-2">Requires attention</p>
                  </div>
                  <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Workspace Area */}
        <div className="bg-[#060d19] border border-[#12233e] rounded-xl overflow-hidden shadow-2xl">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="bg-[#030712] border-b border-[#12233e] p-2 flex justify-between items-center">
              <TabsList className="bg-[#060d19] border border-[#12233e] p-1 rounded-lg">
                <TabsTrigger value="dashboard" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400 text-[#7a95b8]">
                  <LayoutDashboard className="w-4 h-4 mr-2" /> Analytics Dashboard
                </TabsTrigger>
                <TabsTrigger value="list" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400 text-[#7a95b8]">
                  <FileText className="w-4 h-4 mr-2" /> Data Manager
                </TabsTrigger>
                <TabsTrigger value="advanced" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-400 text-[#7a95b8]">
                  <Activity className="w-4 h-4 mr-2" /> Advanced Modeling
                </TabsTrigger>
              </TabsList>
              
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setPinStats(!pinStats)} className="text-[#7a95b8] hover:text-white">
                  {pinStats ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            
            {/* TAB 1: Analytics Dashboard (Contains 5+ Recharts) */}
            <TabsContent value="dashboard" className="m-0 p-6 outline-none bg-[#060d19]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  Batch Performance Analytics
                </h2>
                <div className="flex gap-2">
                  <Select value={chartTimeframe} onValueChange={setChartTimeframe}>
                    <SelectTrigger className="w-[120px] bg-[#0d1a2e] border-[#12233e] h-8 text-xs">
                      <SelectValue placeholder="Timeframe" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                      <SelectItem value="1W">Last Week</SelectItem>
                      <SelectItem value="1M">Last Month</SelectItem>
                      <SelectItem value="1Q">Last Quarter</SelectItem>
                      <SelectItem value="1Y">Last Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                
                {/* Chart 1: Processing Status (Pie) */}
                <Card className="bg-[#030712] border-[#12233e] shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-white flex justify-between">
                      Processing Distribution
                      <HoverCard>
                        <HoverCardTrigger><Info className="w-4 h-4 text-[#7a95b8] cursor-help" /></HoverCardTrigger>
                        <HoverCardContent className="bg-[#0d1a2e] border-[#12233e] text-sm text-slate-200">
                          Current status of all illustrations in the active batch.
                        </HoverCardContent>
                      </HoverCard>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px] w-full">
                      {stats.total > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={90}
                              paddingAngle={5}
                              dataKey="value"
                              stroke="none"
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#060d19', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }}
                              itemStyle={{ color: '#c8d8ec' }}
                            />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-[#7a95b8]">No data available</div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Chart 2: Premium Distribution (Bar) */}
                <Card className="bg-[#030712] border-[#12233e] shadow-md col-span-1 xl:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-white flex justify-between">
                      Top Client Premiums vs Targets
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setChartType(chartType === 'bar' ? 'composed' : 'bar')}>
                          Toggle View
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px] w-full">
                      {premiumData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          {chartType === 'bar' ? (
                            <RechartsBarChart data={premiumData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                              <XAxis dataKey="name" stroke="#7a95b8" tick={{ fontSize: 11 }} />
                              <YAxis stroke="#7a95b8" tickFormatter={(val) => `$${val/1000}k`} tick={{ fontSize: 11 }} />
                              <Tooltip 
                                formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name.charAt(0).toUpperCase() + name.slice(1)]}
                                contentStyle={{ backgroundColor: '#060d19', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }}
                              />
                              <Legend iconType="circle" />
                              <Bar dataKey="premium" name="Current Premium" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                              <Bar dataKey="target" name="Target Premium" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            </RechartsBarChart>
                          ) : (
                            <ComposedChart data={premiumData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                              <XAxis dataKey="name" stroke="#7a95b8" tick={{ fontSize: 11 }} />
                              <YAxis stroke="#7a95b8" tickFormatter={(val) => `$${val/1000}k`} tick={{ fontSize: 11 }} />
                              <Tooltip contentStyle={{ backgroundColor: '#060d19', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }} />
                              <Legend />
                              <Bar dataKey="premium" name="Premium" fill="#3b82f6" barSize={20} radius={[4, 4, 0, 0]} />
                              <Line type="monotone" dataKey="target" name="Target" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                            </ComposedChart>
                          )}
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-[#7a95b8]">No data available</div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Chart 3: Product Mix (Area) */}
                <Card className="bg-[#030712] border-[#12233e] shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-white">Product Mix Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#7a95b8" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#7a95b8" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                          <XAxis dataKey="time" stroke="#7a95b8" tick={{ fontSize: 10 }} />
                          <YAxis stroke="#7a95b8" tick={{ fontSize: 10 }} />
                          <Tooltip contentStyle={{ backgroundColor: '#060d19', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }} />
                          <Area type="monotone" dataKey="completed" stroke="#10b981" fillOpacity={1} fill="url(#colorCompleted)" />
                          <Area type="monotone" dataKey="pending" stroke="#7a95b8" fillOpacity={1} fill="url(#colorPending)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Chart 4: Risk Profile (Radar) */}
                <Card className="bg-[#030712] border-[#12233e] shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-white">Client Risk Profiling</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={riskRadarData}>
                          <PolarGrid stroke="#12233e" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#7a95b8', fontSize: 10 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                          <Radar name="Client Count" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                          <Radar name="Premium Vol" dataKey="B" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                          <Tooltip contentStyle={{ backgroundColor: '#060d19', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Chart 5: Age vs Premium Scatter */}
                <Card className="bg-[#030712] border-[#12233e] shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-white">Demographic Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                          <XAxis type="number" dataKey="x" name="Age" unit=" yrs" stroke="#7a95b8" domain={['dataMin - 5', 'dataMax + 5']} />
                          <YAxis type="number" dataKey="y" name="Premium" unit="$" stroke="#7a95b8" tickFormatter={(val) => `${val/1000}k`} />
                          <ZAxis type="number" dataKey="z" range={[50, 400]} name="Duration" unit=" yrs" />
                          <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#060d19', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }} />
                          <Scatter name="Clients" data={agePremiumScatterData} fill="#ec4899">
                            {agePremiumScatterData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Scatter>
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

              </div>
              
              {/* Data Tables / Structured Displays (6+) */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Table 1: Recent Activity */}
                <Card className="bg-[#030712] border-[#12233e]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-white flex items-center gap-2"><Activity className="w-4 h-4" /> Recent Processing Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-[#12233e] hover:bg-transparent">
                          <TableHead className="text-[#7a95b8] text-xs">Time</TableHead>
                          <TableHead className="text-[#7a95b8] text-xs">Event</TableHead>
                          <TableHead className="text-[#7a95b8] text-xs">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[1,2,3,4,5].map((i) => (
                          <TableRow key={i} className="border-[#12233e] hover:bg-[#12233e]/30">
                            <TableCell className="text-xs text-[#7a95b8]">10:{40+i} AM</TableCell>
                            <TableCell className="text-xs text-slate-300">Processed Client #{100+i}</TableCell>
                            <TableCell><Badge variant="outline" className="text-[10px] h-5 border-emerald-500/30 text-emerald-400">Success</Badge></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Table 2: Product Summary */}
                <Card className="bg-[#030712] border-[#12233e]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-white flex items-center gap-2"><Layers className="w-4 h-4" /> Product Mix Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-[#12233e] hover:bg-transparent">
                          <TableHead className="text-[#7a95b8] text-xs">Product</TableHead>
                          <TableHead className="text-[#7a95b8] text-xs text-right">Count</TableHead>
                          <TableHead className="text-[#7a95b8] text-xs text-right">% of Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {productDistributionData.map((prod, i) => (
                          <TableRow key={i} className="border-[#12233e] hover:bg-[#12233e]/30">
                            <TableCell className="text-xs text-slate-300 flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: prod.color }}></div>
                              {prod.name}
                            </TableCell>
                            <TableCell className="text-xs text-slate-300 text-right">{prod.value}</TableCell>
                            <TableCell className="text-xs text-slate-300 text-right">{Math.round((prod.value/stats.total)*100)}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Table 3: Carrier Performance */}
                <Card className="bg-[#030712] border-[#12233e]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-white flex items-center gap-2"><Shield className="w-4 h-4" /> Carrier Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-[#12233e] hover:bg-transparent">
                          <TableHead className="text-[#7a95b8] text-xs">Carrier</TableHead>
                          <TableHead className="text-[#7a95b8] text-xs">Avg Response</TableHead>
                          <TableHead className="text-[#7a95b8] text-xs">Success Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {['Pacific Life', 'Nationwide', 'Lincoln', 'Allianz'].map((carrier, i) => (
                          <TableRow key={i} className="border-[#12233e] hover:bg-[#12233e]/30">
                            <TableCell className="text-xs text-slate-300 font-medium">{carrier}</TableCell>
                            <TableCell className="text-xs text-slate-300">{1.2 + i*0.4}s</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={98 - i*3} className={i===0 ? "bg-emerald-500" : "bg-blue-500"} />
                                <span className="text-[10px] text-[#7a95b8]">{98 - i*3}%</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Table 4: Error Log */}
                <Card className="bg-[#030712] border-[#12233e]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-white flex items-center gap-2"><AlertCircle className="w-4 h-4 text-red-400" /> System Error Log</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-[#12233e] hover:bg-transparent">
                          <TableHead className="text-[#7a95b8] text-xs">Client ID</TableHead>
                          <TableHead className="text-[#7a95b8] text-xs">Error Code</TableHead>
                          <TableHead className="text-[#7a95b8] text-xs">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.filter((r) => r.status === 'error').slice(0, 4).map((err, i) => (
                          <TableRow key={i} className="border-[#12233e] hover:bg-[#12233e]/30">
                            <TableCell className="text-xs text-slate-300">{err.clientName}</TableCell>
                            <TableCell className="text-xs text-red-400 font-mono">ERR_TIMEOUT</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" className="h-6 text-[10px] text-blue-400 hover:text-blue-300 px-2">Retry</Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {stats.error === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-xs text-[#7a95b8] py-4">No errors logged.</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            {/* TAB 2: Data Manager (Interactive Data Table) */}
            <TabsContent value="list" className="m-0 outline-none">
              <div className="p-4 border-b border-[#12233e] bg-[#030712]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="relative w-64">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#7a95b8]" />
                      <Input
                        placeholder="Search clients, notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9 bg-[#0d1a2e] border-[#12233e] text-slate-200 focus-visible:ring-blue-500"
                      />
                    </div>
                    <Button variant="outline" size="icon" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className={`h-9 w-9 border-[#12233e] ${showAdvancedFilters ? 'bg-blue-600/20 text-blue-400' : 'bg-[#0d1a2e] text-[#7a95b8]'}`}>
                      <Filter className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto">
                    {stats.selectedCount > 0 && (
                      <div className="flex items-center gap-2 mr-2 animate-in fade-in slide-in-from-right-4">
                        <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-0">{stats.selectedCount} selected</Badge>
                        <Select value={bulkAction} onValueChange={setBulkAction}>
                          <SelectTrigger className="h-8 w-[130px] bg-[#0d1a2e] border-[#12233e] text-xs">
                            <SelectValue placeholder="Bulk Actions" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                            <SelectItem value="mark_done">Mark as Done</SelectItem>
                            <SelectItem value="mark_pending">Mark as Pending</SelectItem>
                            <SelectItem value="delete" className="text-red-400 focus:text-red-400">Delete Selected</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button size="sm" onClick={handleBulkAction} disabled={!bulkAction} className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs">Apply</Button>
                      </div>
                    )}
                    
                    <div className="flex rounded-md border border-[#12233e] overflow-hidden bg-[#0d1a2e]">
                      {(['all', 'pending', 'done', 'error'] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => setStatusFilter(status)}
                          className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                            statusFilter === status 
                              ? 'bg-blue-600/20 text-blue-400 border-b-2 border-blue-500' 
                              : 'text-[#7a95b8] hover:text-white hover:bg-[#12233e]'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white h-8 whitespace-nowrap">
                          <Plus className="w-4 h-4 mr-1" /> Add Record
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-[#060d19] border-[#12233e] text-slate-200 sm:max-w-[600px]">
                        <DialogHeader>
                          <DialogTitle className="text-white">Add New Illustration Record</DialogTitle>
                          <DialogDescription className="text-[#7a95b8]">Enter the client details for the batch run.</DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4 py-4">
                          <div className="space-y-2">
                            <Label>Client Name</Label>
                            <Input value={newRowData.clientName || ''} onChange={(e) => setNewRowData({...newRowData, clientName: e.target.value})} className="bg-[#0d1a2e] border-[#12233e]" />
                          </div>
                          <div className="space-y-2">
                            <Label>Age</Label>
                            <NumberInput value={newRowData.age || 45} onChange={(e) => setNewRowData({...newRowData, age: v})} className="bg-[#0d1a2e] border-[#12233e]" />
                          </div>
                          <div className="space-y-2">
                            <Label>Premium ($)</Label>
                            <NumberInput value={newRowData.premium || 50000} onChange={(e) => setNewRowData({...newRowData, premium: v})} className="bg-[#0d1a2e] border-[#12233e]" />
                          </div>
                          <div className="space-y-2">
                            <Label>Duration (Years)</Label>
                            <NumberInput value={newRowData.years || 10} onChange={(e) => setNewRowData({...newRowData, years: v})} className="bg-[#0d1a2e] border-[#12233e]" />
                          </div>
                          <div className="space-y-2">
                            <Label>Product Type</Label>
                            <Select value={newRowData.productType || 'IUL'} onValueChange={v => setNewRowData({...newRowData, productType: v})}>
                              <SelectTrigger className="bg-[#0d1a2e] border-[#12233e]"><SelectValue /></SelectTrigger>
                              <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                                <SelectItem value="IUL">Indexed Universal Life</SelectItem>
                                <SelectItem value="VUL">Variable Universal Life</SelectItem>
                                <SelectItem value="Term">Term Life</SelectItem>
                                <SelectItem value="Whole Life">Whole Life</SelectItem>
                                <SelectItem value="Annuity">Annuity</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Risk Tolerance</Label>
                            <Select value={newRowData.riskTolerance || 'Medium'} onValueChange={v => setNewRowData({...newRowData, riskTolerance: v})}>
                              <SelectTrigger className="bg-[#0d1a2e] border-[#12233e]"><SelectValue /></SelectTrigger>
                              <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                                <SelectItem value="Low">Conservative (Low)</SelectItem>
                                <SelectItem value="Medium">Moderate (Medium)</SelectItem>
                                <SelectItem value="High">Aggressive (High)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={addRow} className="bg-blue-600 hover:bg-blue-700 text-white">Save Record</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* Advanced Filters Panel */}
                {showAdvancedFilters && (
                  <div className="p-4 bg-[#0d1a2e] border border-[#12233e] rounded-lg mb-4 animate-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-medium text-white flex items-center gap-2"><Filter className="w-4 h-4" /> Advanced Filters</h4>
                      <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-xs text-[#7a95b8] hover:text-white">Clear All</Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <Label className="text-xs text-[#7a95b8]">Product Type</Label>
                        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                          <SelectTrigger className="bg-[#060d19] border-[#12233e] h-8 text-xs">
                            <SelectValue placeholder="All Products" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#060d19] border-[#12233e] text-white">
                            <SelectItem value="all">All Products</SelectItem>
                            <SelectItem value="IUL">IUL</SelectItem>
                            <SelectItem value="VUL">VUL</SelectItem>
                            <SelectItem value="Term">Term</SelectItem>
                            <SelectItem value="Whole Life">Whole Life</SelectItem>
                            <SelectItem value="Annuity">Annuity</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-3 col-span-2">
                        <div className="flex justify-between">
                          <Label className="text-xs text-[#7a95b8]">Premium Range: ${minPremium.toLocaleString()} - ${maxPremium.toLocaleString()}</Label>
                        </div>
                        <div className="flex items-center gap-4">
                          <Slider 
                            defaultValue={[0, 500000]} 
                            max={1000000} 
                            step={10000} 
                            onValueChange={(vals) => { setMinPremium(vals[0]); setMaxPremium(vals[1] || 1000000); }}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Table 5: Main Data Table */}
              <div className="overflow-x-auto">
                {filteredRows.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 bg-[#0d1a2e] rounded-full flex items-center justify-center mb-4 border border-[#12233e]">
                      <Search className="w-8 h-8 text-[#7a95b8]" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-1">No records found</h3>
                    <p className="text-[#7a95b8] max-w-sm mb-4 text-sm">
                      Try adjusting your filters or search query to find what you're looking for.
                    </p>
                    <Button variant="outline" onClick={clearFilters} className="border-[#12233e] text-slate-300 hover:text-white">
                      Clear Filters
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader className="bg-[#030712] sticky top-0 z-10">
                      {renderTableHeaders()}
                    </TableHeader>
                    <TableBody>
                      {filteredRows.map((row) => (
                        <TableRow 
                          key={row.id} 
                          className={`border-[#12233e] transition-colors group ${row.selected ? 'bg-blue-500/5' : 'hover:bg-[#12233e]/30'}`}
                        >
                          <TableCell>
                            <Checkbox 
                              checked={row.selected} 
                              onCheckedChange={() => toggleRowSelection(row.id)}
                              className="border-[#7a95b8] data-[state=checked]:bg-blue-500"
                            />
                          </TableCell>
                          <TableCell className="font-medium text-slate-200">
                            <div className="flex items-center gap-2">
                              {row.clientName}
                              {row.notes && (
                                <TooltipProvider>
                                  <UITooltip>
                                    <TooltipTrigger><MessageSquare className="w-3 h-3 text-[#7a95b8]" /></TooltipTrigger>
                                    <TooltipContent className="bg-[#0d1a2e] border-[#12233e] text-xs max-w-xs">{row.notes}</TooltipContent>
                                  </UITooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-300">{row.age}</TableCell>
                          <TableCell className="text-slate-300">${row.premium.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-[#0d1a2e] text-[#7a95b8] border-[#12233e] font-normal">
                              {row.productType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {row.status === "done" && <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-normal"><CheckCircle className="w-3 h-3 mr-1" /> Done</Badge>}
                            {row.status === "error" && <Badge className="bg-red-500/10 text-red-400 border-red-500/20 font-normal"><AlertCircle className="w-3 h-3 mr-1" /> Error</Badge>}
                            {row.status === "pending" && <Badge className="bg-[#12233e] text-[#7a95b8] border-[#1a2e4c] font-normal"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#7a95b8] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-[#060d19] border-[#12233e] text-slate-200 w-40">
                                <DropdownMenuItem className="hover:bg-[#12233e] cursor-pointer" onClick={() => updateRow(row.id, "status", row.status === "pending" ? "done" : "pending")}>
                                  <RefreshCw className="w-4 h-4 mr-2" /> Toggle Status
                                </DropdownMenuItem>
                                <DropdownMenuItem className="hover:bg-[#12233e] cursor-pointer" onClick={() => duplicateRow(row.id)}>
                                  <Copy className="w-4 h-4 mr-2" /> Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-[#12233e]" />
                                <DropdownMenuItem className="hover:bg-red-500/20 text-red-400 cursor-pointer focus:text-red-400 focus:bg-red-500/20" onClick={() => removeRow(row.id)}>
                                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                <div className="p-4 border-t border-[#12233e] bg-[#030712] text-xs text-[#7a95b8] flex justify-between items-center">
                  <span>Showing {filteredRows.length} of {rows.length} records</span>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" disabled className="h-7 border-[#12233e] bg-transparent text-[#7a95b8]">Previous</Button>
                    <Button variant="outline" size="sm" disabled className="h-7 border-[#12233e] bg-transparent text-[#7a95b8]">Next</Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: Advanced Modeling */}
            <TabsContent value="advanced" className="m-0 p-6 outline-none bg-[#060d19]">
              <div className="max-w-4xl mx-auto space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">Scenario Modeling Parameters</h2>
                  <p className="text-[#7a95b8] text-sm">Configure global assumptions applied across the entire batch run.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-[#030712] border-[#12233e]">
                    <CardHeader>
                      <CardTitle className="text-base text-white">Economic Assumptions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label className="text-[#7a95b8]">Base Interest Rate</Label>
                          <span className="text-slate-300 text-sm">4.5%</span>
                        </div>
                        <Slider defaultValue={[4.5]} max={10} step={0.1} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label className="text-[#7a95b8]">Inflation Assumption</Label>
                          <span className="text-slate-300 text-sm">2.5%</span>
                        </div>
                        <Slider defaultValue={[2.5]} max={8} step={0.1} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label className="text-[#7a95b8]">Market Volatility Index</Label>
                          <span className="text-slate-300 text-sm">15.0</span>
                        </div>
                        <Slider defaultValue={[15]} max={40} step={1} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#030712] border-[#12233e]">
                    <CardHeader>
                      <CardTitle className="text-base text-white">Compliance & Rules</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-[#0d1a2e] rounded-lg border border-[#12233e]">
                        <div className="space-y-0.5">
                          <Label className="text-slate-200">AG49-A Restrictions</Label>
                          <p className="text-xs text-[#7a95b8]">Apply strict index caps</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-[#0d1a2e] rounded-lg border border-[#12233e]">
                        <div className="space-y-0.5">
                          <Label className="text-slate-200">7-Pay MEC Testing</Label>
                          <p className="text-xs text-[#7a95b8]">Auto-adjust to avoid MEC</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-[#0d1a2e] rounded-lg border border-[#12233e]">
                        <div className="space-y-0.5">
                          <Label className="text-slate-200">Target Premium Optimization</Label>
                          <p className="text-xs text-[#7a95b8]">Maximize comp within rules</p>
                        </div>
                        <Switch />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Table 6: Model Validation Matrix */}
                <Card className="bg-[#030712] border-[#12233e]">
                  <CardHeader>
                    <CardTitle className="text-base text-white">Model Validation Matrix</CardTitle>
                    <CardDescription className="text-[#7a95b8]">Pre-run validation checks across product lines</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-[#12233e] hover:bg-transparent">
                          <TableHead className="text-[#7a95b8] text-xs">Rule Set</TableHead>
                          <TableHead className="text-[#7a95b8] text-xs">IUL</TableHead>
                          <TableHead className="text-[#7a95b8] text-xs">VUL</TableHead>
                          <TableHead className="text-[#7a95b8] text-xs">Term</TableHead>
                          <TableHead className="text-[#7a95b8] text-xs">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow className="border-[#12233e]">
                          <TableCell className="text-sm text-slate-300 font-medium">Illustration Regs</TableCell>
                          <TableCell><CheckCircle className="w-4 h-4 text-emerald-500" /></TableCell>
                          <TableCell><CheckCircle className="w-4 h-4 text-emerald-500" /></TableCell>
                          <TableCell><CheckCircle className="w-4 h-4 text-emerald-500" /></TableCell>
                          <TableCell><Badge variant="outline" className="text-emerald-400 border-emerald-500/30 text-[10px]">PASS</Badge></TableCell>
                        </TableRow>
                        <TableRow className="border-[#12233e]">
                          <TableCell className="text-sm text-slate-300 font-medium">Tax Code 7702</TableCell>
                          <TableCell><CheckCircle className="w-4 h-4 text-emerald-500" /></TableCell>
                          <TableCell><CheckCircle className="w-4 h-4 text-emerald-500" /></TableCell>
                          <TableCell><span className="text-[#7a95b8] text-xs">N/A</span></TableCell>
                          <TableCell><Badge variant="outline" className="text-emerald-400 border-emerald-500/30 text-[10px]">PASS</Badge></TableCell>
                        </TableRow>
                        <TableRow className="border-[#12233e]">
                          <TableCell className="text-sm text-slate-300 font-medium">Carrier Limits</TableCell>
                          <TableCell><AlertCircle className="w-4 h-4 text-amber-500" /></TableCell>
                          <TableCell><CheckCircle className="w-4 h-4 text-emerald-500" /></TableCell>
                          <TableCell><CheckCircle className="w-4 h-4 text-emerald-500" /></TableCell>
                          <TableCell><Badge variant="outline" className="text-amber-400 border-amber-500/30 text-[10px]">WARN</Badge></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
                
                <div className="flex justify-end gap-4 pt-4 border-t border-[#12233e]">
                  <Button variant="outline" className="border-[#12233e] text-slate-300 hover:text-white">Reset to Defaults</Button>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">Save Configuration</Button>
                </div>
              </div>
            </TabsContent>

          </Tabs>
        </div>

        <NAICDisclaimer variant="compact" showsProjections showsCashValues />
        
        <div className="mt-8">
          <PageInsights pageId="batch-illustration" />
        </div>
      </div>
    </AppShell>
  );
}
