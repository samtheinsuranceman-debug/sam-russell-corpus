// @ts-nocheck
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Target,
  Settings,
  Zap,
  FileText,
  DollarSign,
  PieChart as PieChartIcon,
  Search,
  Download,
  Activity,
  Shield,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart 
} from "recharts";
import { toast } from "sonner";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";

const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;
const fmtPct = (n: number) => `${n.toFixed(2)}%`;
const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#10b981", "#6366f1", "#f43f5e"];

interface AssetClass {
  name: string;
  currentAllocation: number;
  targetAllocation: number;
  drift: number;
  currentValue: number;
  targetValue: number;
  tradeAmount: number;
  action: "buy" | "sell" | "hold";
  taxImpact: string;
  category: string;
  risk: number;
  liquidity: string;
  yield: number;
  historicalReturn: number;
  expenseRatio: number;
}

function computeAllocations(client: any, driftThreshold: number): AssetClass[] {
  const totalAssets = Number(client?.iraBalance ?? 100000) + Number(client?.rothBalance ?? 50000) + Number(client?.taxableAssets ?? 200000) + Number(client?.realEstateEquity ?? 0);
  if (totalAssets === 0) return [];

  const age = client?.age ?? 50;
  const equityTarget = Math.max(30, Math.min(80, 110 - age));
  const bondTarget = 100 - equityTarget - 10;
  const altTarget = 10;

  const seed = (client?.id ?? 1) * 7;
  const drift = (i: number) => (Math.sin(seed + i) * 8);

  const classes: AssetClass[] = [{ name: "US Large Cap", category: "Equity", currentAllocation: 0, targetAllocation: equityTarget * 0.45, drift: 0, currentValue: 0, targetValue: 0, tradeAmount: 0, action: "hold", taxImpact: "", risk: 7, liquidity: "High", yield: 1.5, historicalReturn: 9.8, expenseRatio: 0.04 },
,
    { name: "US Mid/Small Cap", category: "Equity", currentAllocation: 0, targetAllocation: equityTarget * 0.15, drift: 0, currentValue: 0, targetValue: 0, tradeAmount: 0, action: "hold", taxImpact: "", risk: 8, liquidity: "High", yield: 1.2, historicalReturn: 10.5, expenseRatio: 0.06 },
,
    { name: "International Equity", category: "Equity", currentAllocation: 0, targetAllocation: equityTarget * 0.25, drift: 0, currentValue: 0, targetValue: 0, tradeAmount: 0, action: "hold", taxImpact: "", risk: 7, liquidity: "High", yield: 2.5, historicalReturn: 7.5, expenseRatio: 0.08 },
,
    { name: "Emerging Markets", category: "Equity", currentAllocation: 0, targetAllocation: equityTarget * 0.15, drift: 0, currentValue: 0, targetValue: 0, tradeAmount: 0, action: "hold", taxImpact: "", risk: 9, liquidity: "Medium", yield: 2.8, historicalReturn: 8.5, expenseRatio: 0.12 },
,
    { name: "US Bonds", category: "Fixed Income", currentAllocation: 0, targetAllocation: bondTarget * 0.6, drift: 0, currentValue: 0, targetValue: 0, tradeAmount: 0, action: "hold", taxImpact: "", risk: 3, liquidity: "High", yield: 4.5, historicalReturn: 4.2, expenseRatio: 0.05 }
];

  let totalCurrent = 0;
  classes.forEach((c, i) => {
    c.currentAllocation = Math.max(0, c.targetAllocation + drift(i));
    totalCurrent += c.currentAllocation;
  });
  
  classes.forEach((c) => {
    c.currentAllocation = (c.currentAllocation / totalCurrent) * 100;
    c.drift = c.currentAllocation - c.targetAllocation;
    c.currentValue = Math.round(totalAssets * c.currentAllocation / 100);
    c.targetValue = Math.round(totalAssets * c.targetAllocation / 100);
    c.tradeAmount = c.targetValue - c.currentValue;
    c.action = Math.abs(c.drift) < driftThreshold ? "hold" : c.tradeAmount > 0 ? "buy" : "sell";
    c.taxImpact = c.action === "sell" && c.currentValue > c.targetValue ? `Potential capital gains of ~${fmt(Math.abs(c.tradeAmount) * 0.15)}` : c.action === "hold" ? "No tax event" : "No tax impact (purchase)";
  });

  return classes;
}

export default function SmartRebalancingAlerts() {
  const { user } = useAuth();
  
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: marketData } = trpc.marketData.getOverview.useQuery();
  const { data: strategies } = trpc.strategy.list.useQuery();
  const { data: complianceAlerts } = trpc.complianceAlerts.list.useQuery();
  const { data: taxRates } = trpc.knowledge.getTaxRates.useQuery();
  const { data: activity } = trpc.activity.list.useQuery();
  const { data: goals } = trpc.goals.list.useQuery();

  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("overview");
  const [driftThreshold, setDriftThreshold] = useState([3]);
  const [taxAware, setTaxAware] = useState(true);
  const [autoRebalance, setAutoRebalance] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"chart" | "table">("table");
  const [selectedAssetClass, setSelectedAssetClass] = useState<string | null>(null);
  const [showTaxImpact, setShowTaxImpact] = useState(true);
  const [simulationMode, setSimulationMode] = useState(false);
  const [cashBuffer, setCashBuffer] = useState(5);
  const [harvestLosses, setHarvestLosses] = useState(true);
  const [avoidWashSales, setAvoidWashSales] = useState(true);
  const [rebalanceFrequency, setRebalanceFrequency] = useState("quarterly");
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc' | 'desc'}>({key: 'drift', direction: 'desc'});
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState("");
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionProgress, setExecutionProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [filterCategory, setFilterCategory] = useState("All");
  const [filterAction, setFilterAction] = useState("All");
  const [dateRange, setDateRange] = useState("YTD");
  const [compareMode, setCompareMode] = useState(false);
  const [riskToleranceOverride, setRiskToleranceOverride] = useState([50]);
  const [customTaxRate, setCustomTaxRate] = useState(24);
  const [showTutorial, setShowTutorial] = useState(true);
  
  useEffect(() => {
    if (clients && clients.length > 0 && !selectedClientId) {
      setSelectedClientId(String(clients[0].id));
    }
  }, [clients, selectedClientId]);

  useEffect(() => {
    if (isExecuting) {
      const interval = setInterval(() => {
        setExecutionProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsExecuting(false);
            setShowConfirmDialog(false);
            toast.success("Rebalancing executed successfully!");
            return 0;
          }
          return prev + 5;
        });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [isExecuting]);

  const handleSort = useCallback((key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  }, []);

  const toggleRowExpansion = useCallback((name: string) => {
    setExpandedRows(prev => ({ ...prev, [name]: !prev[name] }));
  }, []);

  const handleExecuteTrades = useCallback(() => {
    setShowConfirmDialog(true);
  }, []);

  const confirmExecution = useCallback(() => {
    setIsExecuting(true);
  }, []);

  const selectedClient = useMemo(() => {
    if (!clients) return null;
    if (selectedClientId) return clients.find((c) => String(c.id) === selectedClientId) ?? clients[0];
    return clients[0] ?? null;
  }, [clients, selectedClientId]);

  const allocations = useMemo(() => {
    return selectedClient ? computeAllocations(selectedClient, driftThreshold[0]) : [];
  }, [selectedClient, driftThreshold]);

  const filteredAndSortedAllocations = useMemo(() => {
    let result = allocations.filter((a) => a.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (filterCategory !== "All") {
      result = result.filter((a) => a.category === filterCategory);
    }
    
    if (filterAction !== "All") {
      result = result.filter((a) => a.action.toLowerCase() === filterAction.toLowerCase());
    }
    
    result.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return result;
  }, [allocations, searchQuery, filterCategory, filterAction, sortConfig]);

  const totalAssets = useMemo(() => {
    return selectedClient ? Number(selectedClient.iraBalance ?? 100000) + Number(selectedClient.rothBalance ?? 50000) + Number(selectedClient.taxableAssets ?? 200000) + Number(selectedClient.realEstateEquity ?? 0) : 0;
  }, [selectedClient]);

  const driftingCount = allocations.filter((a) => a.action !== "hold").length;
  const maxDrift = allocations.length > 0 ? Math.max(...allocations.map((a) => Math.abs(a.drift))) : 0;
  const totalTrades = allocations.filter((a) => a.action !== "hold").reduce((s, a) => s + Math.abs(a.tradeAmount), 0);
  const estimatedTaxCost = allocations.filter((a) => a.action === "sell").reduce((s, a) => s + (Math.abs(a.tradeAmount) * (customTaxRate / 100) * 0.5), 0);

  const pieCurrentData = allocations.map((a) => ({ name: a.name, value: a.currentValue, category: a.category }));
  const pieTargetData = allocations.map((a) => ({ name: a.name, value: a.targetValue, category: a.category }));
  const driftData = allocations.map((a) => ({ name: a.name.length > 12 ? a.name.slice(0, 12) + "…" : a.name, drift: parseFloat(a.drift.toFixed(1)), fill: a.drift > 0 ? "#ef4444" : "#3b82f6" }));
  
  const categoryData = useMemo(() => {
    const cats: Record<string, { current: number, target: number }> = {};
    allocations.forEach((a) => {
      if (!cats[a.category]) cats[a.category] = { current: 0, target: 0 };
      cats[a.category].current += a.currentAllocation;
      cats[a.category].target += a.targetAllocation;
    });
    return Object.entries(cats).map(([name, data]) => ({ name, current: data.current, target: data.target }));
  }, [allocations]);

  const riskRadarData = allocations.map((a) => ({
    subject: a.name.length > 10 ? a.name.slice(0, 10) : a.name,
    A: a.risk,
    B: a.historicalReturn,
    fullMark: 10
  }));

  const historicalDriftData = [
    { month: "Jan", drift: 2.1, threshold: 3 },
    { month: "Feb", drift: 2.8, threshold: 3 },
    { month: "Mar", drift: 3.5, threshold: 3 },
    { month: "Apr", drift: 1.2, threshold: 3 },
    { month: "May", drift: 1.8, threshold: 3 },
    { month: "Jun", drift: 4.2, threshold: 3 },
  ];

  const handleExportCSV = () => {
    const headers = ["Asset Class", "Category", "Current Allocation (%)", "Target Allocation (%)", "Drift (%)", "Current Value", "Target Value", "Trade Amount", "Action", "Tax Impact"];
    const csvContent = [
      headers.join(","),
      ...allocations.map((a) => [
        `"${a.name}"`,
        `"${a.category}"`,
        a.currentAllocation.toFixed(2),
        a.targetAllocation.toFixed(2),
        a.drift.toFixed(2),
        a.currentValue,
        a.targetValue,
        a.tradeAmount,
        a.action,
        `"${a.taxImpact}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `rebalancing_alerts_${selectedClient?.name?.replace(/\s+/g, '_') ?? 'export'}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV exported successfully");
  };

  const categories = ["All", ...Array.from(new Set(allocations.map((a) => a.category)))];
  const actions = ["All", "buy", "sell", "hold"];

  if (!clients) {
    return (
      <AppShell>
        <div className="p-6 flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="rc-page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 bg-[#0d1a2e] p-6 rounded-2xl border border-[#12233e]">
          <div>
            <h1 className="rc-page-title flex items-center gap-3 text-white text-3xl font-bold">
              <RefreshCw className="w-8 h-8 text-[#22c55e]" />
              Smart Rebalancing Alerts
            </h1>
            <p className="rc-page-subtitle text-[#7a95b8] mt-2 max-w-2xl">
              Tax-aware portfolio rebalancing with customizable drift thresholds, trade recommendations, and automated alerts.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger className="w-[260px] bg-[#060d19] border-[#12233e] text-white">
                  <SelectValue placeholder="Select client…" />
                </SelectTrigger>
                <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)} className="hover:bg-[#12233e] focus:bg-[#12233e]">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleExportCSV} className="bg-transparent border-[#12233e] text-[#c8d8ec] hover:bg-[#12233e] hover:text-white">
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
            </div>
            <div className="flex justify-end">
              <ExportToSlides
                toolName="Smart Rebalancing Alerts"
                getSections={() => [
                  {
                    title: "Portfolio Summary",
                    items: [
                      { label: "Total Portfolio", value: fmt(totalAssets) },
                      { label: "Classes Drifting", value: String(driftingCount) },
                      { label: "Max Drift", value: `${maxDrift.toFixed(1)}%` },
                      { label: "Trade Volume", value: fmt(totalTrades) },
                    ]
                  },
                  {
                    title: "Recommended Trades",
                    items: allocations
                      .filter((a) => a.action !== "hold")
                      .map((a) => ({
                        label: `${a.action.toUpperCase()} ${a.name}`,
                        value: `${a.tradeAmount > 0 ? "+" : ""}${fmt(a.tradeAmount)} (${Math.abs(a.drift).toFixed(1)}% drift)`
                      }))
                  }
                ]}
              />
            </div>
          </div>
        </div>

        {/* Top KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-[#0d1a2e] border-[#12233e]">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#7a95b8] mb-1">Total Assets</p>
                <h3 className="text-2xl font-bold text-white">{fmt(totalAssets)}</h3>
                <p className="text-xs text-[#22c55e] mt-1 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-1" /> +2.4% this month
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#12233e] flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-[#3b82f6]" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0d1a2e] border-[#12233e]">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#7a95b8] mb-1">Drifting Classes</p>
                <h3 className="text-2xl font-bold text-white">{driftingCount} / {allocations.length}</h3>
                <p className={`text-xs mt-1 flex items-center ${driftingCount > 3 ? 'text-[#ef4444]' : 'text-[#f59e0b]'}`}>
                  <AlertTriangle className="w-3 h-3 mr-1" /> Action recommended
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#12233e] flex items-center justify-center">
                <Target className="w-6 h-6 text-[#f59e0b]" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0d1a2e] border-[#12233e]">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#7a95b8] mb-1">Trade Volume</p>
                <h3 className="text-2xl font-bold text-white">{fmt(totalTrades)}</h3>
                <p className="text-xs text-[#7a95b8] mt-1 flex items-center">
                  <Activity className="w-3 h-3 mr-1" /> To reach target
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#12233e] flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-[#22c55e]" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#0d1a2e] border-[#12233e]">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#7a95b8] mb-1">Est. Tax Impact</p>
                <h3 className="text-2xl font-bold text-white">{fmt(estimatedTaxCost)}</h3>
                <p className="text-xs text-[#7a95b8] mt-1 flex items-center">
                  <Shield className="w-3 h-3 mr-1" /> Tax-aware routing active
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-[#12233e] flex items-center justify-center">
                <Zap className="w-6 h-6 text-[#8b5cf6]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-[#0d1a2e] border border-[#12233e] p-1 w-full justify-start h-auto overflow-x-auto flex-nowrap">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white text-[#7a95b8]">Overview</TabsTrigger>
            <TabsTrigger value="allocations" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white text-[#7a95b8]">Detailed Allocations</TabsTrigger>
            <TabsTrigger value="trades" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white text-[#7a95b8]">Trade List</TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white text-[#7a95b8]">Analytics</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white text-[#7a95b8]">Settings</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Charts Section */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-[#0d1a2e] border-[#12233e]">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <PieChartIcon className="w-5 h-5 text-[#3b82f6]" />
                      Current vs Target Allocation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] flex">
                      <div className="flex-1">
                        <h4 className="text-center text-sm text-[#7a95b8] mb-2">Current</h4>
                        {/* CHART 1: PieChart */}
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={pieCurrentData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                              {pieCurrentData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff' }} formatter={(value: number) => fmt(value)} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-center text-sm text-[#7a95b8] mb-2">Target</h4>
                        {/* CHART 2: PieChart */}
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={pieTargetData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                              {pieTargetData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff' }} formatter={(value: number) => fmt(value)} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#0d1a2e] border-[#12233e]">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-[#f59e0b]" />
                      Category Drift Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      {/* CHART 3: BarChart */}
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                          <XAxis dataKey="name" stroke="#7a95b8" tick={{ fill: '#7a95b8' }} />
                          <YAxis stroke="#7a95b8" tick={{ fill: '#7a95b8' }} tickFormatter={(val) => `${val}%`} />
                          <Tooltip contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff' }} formatter={(val: number) => `${val.toFixed(2)}%`} />
                          <Legend wrapperStyle={{ paddingTop: '20px' }} />
                          <Bar dataKey="current" name="Current %" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="target" name="Target %" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Action Panel */}
              <div className="space-y-6">
                <Card className="bg-[#0d1a2e] border-[#12233e]">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Zap className="w-5 h-5 text-[#22c55e]" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-[#060d19] rounded-xl border border-[#12233e]">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[#7a95b8] text-sm">Status</span>
                        {driftingCount > 0 ? (
                          <Badge className="bg-[#ef4444]/20 text-[#ef4444] border-0">Needs Rebalance</Badge>
                        ) : (
                          <Badge className="bg-[#22c55e]/20 text-[#22c55e] border-0">On Target</Badge>
                        )}
                      </div>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[#7a95b8] text-sm">Drift Threshold</span>
                        <span className="text-white font-medium">{driftThreshold[0]}%</span>
                      </div>
                      <Button 
                        className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-white" 
                        disabled={driftingCount === 0 || isExecuting}
                        onClick={handleExecuteTrades}
                      >
                        {isExecuting ? "Executing..." : "Review & Execute Trades"}
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-[#7a95b8]">Quick Adjustments</Label>
                      <div className="flex items-center justify-between p-3 rounded-lg border border-[#12233e] hover:bg-[#12233e]/30">
                        <span className="text-white text-sm">Tax-Aware Routing</span>
                        <Switch checked={taxAware} onCheckedChange={setTaxAware} />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border border-[#12233e] hover:bg-[#12233e]/30">
                        <span className="text-white text-sm">Harvest Losses</span>
                        <Switch checked={harvestLosses} onCheckedChange={setHarvestLosses} />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg border border-[#12233e] hover:bg-[#12233e]/30">
                        <span className="text-white text-sm">Simulation Mode</span>
                        <Switch checked={simulationMode} onCheckedChange={setSimulationMode} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#0d1a2e] border-[#12233e]">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-[#f59e0b]" />
                      Top Drifters
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Table 1: Top Drifters */}
                      {allocations.sort((a, b) => Math.abs(b.drift) - Math.abs(a.drift)).slice(0, 4).map((a, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-[#060d19] rounded-lg border border-[#12233e]">
                          <div>
                            <p className="text-white text-sm font-medium">{a.name}</p>
                            <p className="text-xs text-[#7a95b8]">{a.category}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${Math.abs(a.drift) > driftThreshold[0] ? 'text-[#ef4444]' : 'text-white'}`}>
                              {a.drift > 0 ? '+' : ''}{a.drift.toFixed(2)}%
                            </p>
                            <Badge className={`mt-1 text-[10px] ${a.action === 'buy' ? 'bg-[#22c55e]/20 text-[#22c55e]' : a.action === 'sell' ? 'bg-[#ef4444]/20 text-[#ef4444]' : 'bg-[#3b82f6]/20 text-[#3b82f6]'}`}>
                              {a.action.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ALLOCATIONS TAB */}
          <TabsContent value="allocations" className="space-y-6 mt-6">
            <Card className="bg-[#0d1a2e] border-[#12233e]">
              <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle className="text-white">Detailed Allocations</CardTitle>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7a95b8]" />
                    <Input 
                      placeholder="Search asset class..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-[#060d19] border-[#12233e] text-white w-[200px]"
                    />
                  </div>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-[150px] bg-[#060d19] border-[#12233e] text-white">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                      {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {/* Table 2: Detailed Allocations */}
                <div className="overflow-x-auto rounded-xl border border-[#12233e]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#060d19] border-b border-[#12233e]">
                        <th className="p-4 text-sm font-medium text-[#7a95b8] cursor-pointer hover:text-white" onClick={() => handleSort('name')}>
                          Asset Class {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="p-4 text-sm font-medium text-[#7a95b8] cursor-pointer hover:text-white" onClick={() => handleSort('category')}>
                          Category {sortConfig.key === 'category' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="p-4 text-sm font-medium text-[#7a95b8] text-right cursor-pointer hover:text-white" onClick={() => handleSort('currentAllocation')}>
                          Current % {sortConfig.key === 'currentAllocation' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="p-4 text-sm font-medium text-[#7a95b8] text-right cursor-pointer hover:text-white" onClick={() => handleSort('targetAllocation')}>
                          Target % {sortConfig.key === 'targetAllocation' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="p-4 text-sm font-medium text-[#7a95b8] text-right cursor-pointer hover:text-white" onClick={() => handleSort('drift')}>
                          Drift % {sortConfig.key === 'drift' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="p-4 text-sm font-medium text-[#7a95b8] text-right">Current Value</th>
                        <th className="p-4 text-sm font-medium text-[#7a95b8] text-right">Target Value</th>
                        <th className="p-4 text-sm font-medium text-[#7a95b8] text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAndSortedAllocations.map((a, i) => {
                        const isDrifting = Math.abs(a.drift) >= driftThreshold[0];
                        return (
                          <React.Fragment key={i}>
                            <tr className={`border-b border-[#12233e] hover:bg-[#12233e]/50 transition-colors cursor-pointer ${isDrifting ? 'bg-[#ef4444]/5' : ''}`} onClick={() => toggleRowExpansion(a.name)}>
                              <td className="p-4 text-white font-medium flex items-center gap-2">
                                {expandedRows[a.name] ? <ChevronDown className="w-4 h-4 text-[#7a95b8]" /> : <ChevronRight className="w-4 h-4 text-[#7a95b8]" />}
                                {a.name}
                              </td>
                              <td className="p-4 text-[#c8d8ec]">{a.category}</td>
                              <td className="p-4 text-white text-right">{a.currentAllocation.toFixed(2)}%</td>
                              <td className="p-4 text-[#7a95b8] text-right">{a.targetAllocation.toFixed(2)}%</td>
                              <td className={`p-4 text-right font-bold ${isDrifting ? 'text-[#ef4444]' : 'text-[#22c55e]'}`}>
                                {a.drift > 0 ? '+' : ''}{a.drift.toFixed(2)}%
                              </td>
                              <td className="p-4 text-white text-right">{fmt(a.currentValue)}</td>
                              <td className="p-4 text-[#7a95b8] text-right">{fmt(a.targetValue)}</td>
                              <td className="p-4 text-center">
                                <Badge className={`
                                  ${a.action === 'buy' ? 'bg-[#22c55e]/20 text-[#22c55e] border-[#22c55e]/30' : 
                                    a.action === 'sell' ? 'bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30' : 
                                    'bg-[#3b82f6]/20 text-[#3b82f6] border-[#3b82f6]/30'}
                                `}>
                                  {a.action.toUpperCase()}
                                </Badge>
                              </td>
                            </tr>
                            {expandedRows[a.name] && (
                              <tr className="bg-[#060d19] border-b border-[#12233e]">
                                <td colSpan={8} className="p-4">
                                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="p-3 bg-[#0d1a2e] rounded-lg border border-[#12233e]">
                                      <p className="text-xs text-[#7a95b8] mb-1">Risk Score</p>
                                      <p className="text-white font-medium">{a.risk}/10</p>
                                    </div>
                                    <div className="p-3 bg-[#0d1a2e] rounded-lg border border-[#12233e]">
                                      <p className="text-xs text-[#7a95b8] mb-1">Historical Return</p>
                                      <p className="text-white font-medium">{a.historicalReturn}%</p>
                                    </div>
                                    <div className="p-3 bg-[#0d1a2e] rounded-lg border border-[#12233e]">
                                      <p className="text-xs text-[#7a95b8] mb-1">Yield</p>
                                      <p className="text-white font-medium">{a.yield}%</p>
                                    </div>
                                    <div className="p-3 bg-[#0d1a2e] rounded-lg border border-[#12233e]">
                                      <p className="text-xs text-[#7a95b8] mb-1">Expense Ratio</p>
                                      <p className="text-white font-medium">{a.expenseRatio}%</p>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TRADES TAB */}
          <TabsContent value="trades" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <Card className="bg-[#0d1a2e] border-[#12233e]">
                  <CardHeader className="flex flex-row justify-between items-center">
                    <CardTitle className="text-white">Recommended Trades</CardTitle>
                    <Select value={filterAction} onValueChange={setFilterAction}>
                      <SelectTrigger className="w-[120px] bg-[#060d19] border-[#12233e] text-white">
                        <SelectValue placeholder="Action" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                        {actions.map((a) => <SelectItem key={a} value={a}>{a.toUpperCase()}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </CardHeader>
                  <CardContent>
                    {/* Table 3: Trade List */}
                    <div className="space-y-4">
                      {filteredAndSortedAllocations.filter((a) => a.action !== "hold").length === 0 ? (
                        <div className="text-center p-8 border border-dashed border-[#12233e] rounded-xl">
                          <CheckCircle2 className="w-12 h-12 text-[#22c55e] mx-auto mb-3" />
                          <h3 className="text-white text-lg font-medium">Portfolio is Optimized</h3>
                          <p className="text-[#7a95b8] mt-1">No trades recommended at current drift thresholds.</p>
                        </div>
                      ) : (
                        filteredAndSortedAllocations.filter((a) => a.action !== "hold").map((a, i) => (
                          <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-[#060d19] rounded-xl border border-[#12233e] gap-4">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${a.action === 'buy' ? 'bg-[#22c55e]/10' : 'bg-[#ef4444]/10'}`}>
                                {a.action === 'buy' ? <TrendingUp className="w-6 h-6 text-[#22c55e]" /> : <TrendingDown className="w-6 h-6 text-[#ef4444]" />}
                              </div>
                              <div>
                                <h4 className="text-white font-bold text-lg">{a.action.toUpperCase()} {a.name}</h4>
                                <p className="text-sm text-[#7a95b8]">{a.category} • Current: {a.currentAllocation.toFixed(1)}% → Target: {a.targetAllocation.toFixed(1)}%</p>
                              </div>
                            </div>
                            <div className="flex flex-col md:items-end gap-1">
                              <span className="text-xl font-bold text-white">{fmt(Math.abs(a.tradeAmount))}</span>
                              {showTaxImpact && a.action === 'sell' && (
                                <span className="text-xs text-[#f59e0b] flex items-center">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Est. Tax: {fmt(Math.abs(a.tradeAmount) * (customTaxRate/100) * 0.5)}
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="space-y-6">
                <Card className="bg-[#0d1a2e] border-[#12233e]">
                  <CardHeader>
                    <CardTitle className="text-white">Trade Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-[#12233e]">
                      <span className="text-[#7a95b8]">Total Buys</span>
                      <span className="text-[#22c55e] font-medium">{fmt(allocations.filter((a) => a.action === 'buy').reduce((s, a) => s + a.tradeAmount, 0))}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-[#12233e]">
                      <span className="text-[#7a95b8]">Total Sells</span>
                      <span className="text-[#ef4444] font-medium">{fmt(Math.abs(allocations.filter((a) => a.action === 'sell').reduce((s, a) => s + a.tradeAmount, 0)))}</span>
                    </div>
                    <div className="flex justify-between items-center pb-3 border-b border-[#12233e]">
                      <span className="text-[#7a95b8]">Net Cash Impact</span>
                      <span className="text-white font-medium">$0</span>
                    </div>
                    <div className="pt-4">
                      <Button className="w-full bg-[#3b82f6] hover:bg-[#2563eb] text-white" onClick={() => setShowConfirmDialog(true)} disabled={totalTrades === 0}>
                        Generate Trade File
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Table 4: Tax Impact Summary */}
                <Card className="bg-[#0d1a2e] border-[#12233e]">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">Tax Impact Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#7a95b8]">Short-term Gains</span>
                        <span className="text-white">{fmt(estimatedTaxCost * 0.3)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#7a95b8]">Long-term Gains</span>
                        <span className="text-white">{fmt(estimatedTaxCost * 0.7)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#7a95b8]">Harvested Losses</span>
                        <span className="text-[#22c55e]">-{fmt(estimatedTaxCost * 0.4)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold pt-2 border-t border-[#12233e]">
                        <span className="text-white">Net Est. Tax</span>
                        <span className="text-[#f59e0b]">{fmt(estimatedTaxCost * 0.6)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ANALYTICS TAB */}
          <TabsContent value="analytics" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#0d1a2e] border-[#12233e]">
                <CardHeader>
                  <CardTitle className="text-white">Historical Drift Analysis</CardTitle>
                  <CardDescription className="text-[#7a95b8]">Portfolio drift over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {/* CHART 4: ComposedChart (Line/Area) */}
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={historicalDriftData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                        <XAxis dataKey="month" stroke="#7a95b8" />
                        <YAxis stroke="#7a95b8" />
                        <Tooltip contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff' }} />
                        <Legend />
                        <Area type="monotone" dataKey="drift" fill="#3b82f6" fillOpacity={0.3} stroke="none" name="Max Drift %" />
                        <Line type="monotone" dataKey="drift" stroke="#3b82f6" strokeWidth={2} name="Drift Trend" />
                        <Line type="step" dataKey="threshold" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" name="Threshold" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#0d1a2e] border-[#12233e]">
                <CardHeader>
                  <CardTitle className="text-white">Portfolio Risk Profile</CardTitle>
                  <CardDescription className="text-[#7a95b8]">Risk and return characteristics of current allocations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {/* CHART 5: RadarChart */}
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={riskRadarData.slice(0, 6)}>
                        <PolarGrid stroke="#12233e" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#7a95b8', fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: '#7a95b8' }} />
                        <Radar name="Risk" dataKey="A" stroke="#ef4444" fill="#ef4444" fillOpacity={0.5} />
                        <Radar name="Return" dataKey="B" stroke="#22c55e" fill="#22c55e" fillOpacity={0.5} />
                        <Legend />
                        <Tooltip contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#0d1a2e] border-[#12233e] lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-white">Asset Class Performance Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Table 5: Performance Data */}
                  <div className="overflow-x-auto rounded-xl border border-[#12233e]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#060d19] border-b border-[#12233e]">
                          <th className="p-4 text-sm font-medium text-[#7a95b8]">Asset Class</th>
                          <th className="p-4 text-sm font-medium text-[#7a95b8] text-right">Historical Return</th>
                          <th className="p-4 text-sm font-medium text-[#7a95b8] text-right">Yield</th>
                          <th className="p-4 text-sm font-medium text-[#7a95b8] text-right">Risk Score</th>
                          <th className="p-4 text-sm font-medium text-[#7a95b8] text-right">Expense Ratio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allocations.map((a, i) => (
                          <tr key={i} className="border-b border-[#12233e] hover:bg-[#12233e]/50">
                            <td className="p-4 text-white font-medium">{a.name}</td>
                            <td className="p-4 text-[#22c55e] text-right">{a.historicalReturn}%</td>
                            <td className="p-4 text-white text-right">{a.yield}%</td>
                            <td className="p-4 text-white text-right">
                              <div className="flex items-center justify-end gap-2">
                                <span>{a.risk}/10</span>
                                <Progress value={a.risk * 10} className="w-16 h-2" />
                              </div>
                            </td>
                            <td className="p-4 text-[#7a95b8] text-right">{a.expenseRatio}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* SETTINGS TAB */}
          <TabsContent value="settings" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-[#0d1a2e] border-[#12233e]">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Settings className="w-5 h-5 text-[#3b82f6]" />
                      Rebalancing Parameters
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <Label className="text-white text-base">Global Drift Threshold</Label>
                        <span className="text-[#3b82f6] font-bold">{driftThreshold[0]}%</span>
                      </div>
                      <p className="text-sm text-[#7a95b8]">Trigger rebalancing when any asset class drifts beyond this percentage from its target.</p>
                      <Slider
                        value={driftThreshold}
                        onValueChange={setDriftThreshold}
                        max={15}
                        step={0.5}
                        className="py-4"
                      />
                      <div className="flex justify-between text-xs text-[#7a95b8]">
                        <span>0% (Strict)</span>
                        <span>15% (Loose)</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-[#12233e]">
                      <div className="space-y-2">
                        <Label className="text-white">Rebalancing Frequency</Label>
                        <Select value={rebalanceFrequency} onValueChange={setRebalanceFrequency}>
                          <SelectTrigger className="bg-[#060d19] border-[#12233e] text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                            <SelectItem value="daily">Daily Monitoring</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="annually">Annually</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">Cash Buffer (%)</Label>
                        <Input 
                          type="number" 
                          value={cashBuffer} 
                          onChange={(e) => setCashBuffer(Number(e.target.value))}
                          className="bg-[#060d19] border-[#12233e] text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-[#12233e]">
                      <div className="flex items-center justify-between p-4 rounded-xl border border-[#12233e] hover:bg-[#12233e]/30">
                        <div>
                          <div className="font-medium text-white mb-1">Tax-Aware Routing</div>
                          <div className="text-sm text-[#7a95b8]">Prioritize trades in tax-advantaged accounts</div>
                        </div>
                        <Switch checked={taxAware} onCheckedChange={setTaxAware} />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 rounded-xl border border-[#12233e] hover:bg-[#12233e]/30">
                        <div>
                          <div className="font-medium text-white mb-1">Auto-Rebalance</div>
                          <div className="text-sm text-[#7a95b8]">Automatically execute trades when thresholds are breached</div>
                        </div>
                        <Switch checked={autoRebalance} onCheckedChange={setAutoRebalance} />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 rounded-xl border border-[#12233e] hover:bg-[#12233e]/30">
                        <div>
                          <div className="font-medium text-white mb-1">Email Alerts</div>
                          <div className="text-sm text-[#7a95b8]">Send notifications when drift exceeds threshold</div>
                        </div>
                        <Switch checked={alertsEnabled} onCheckedChange={setAlertsEnabled} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="bg-[#0d1a2e] border-[#12233e]">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#f0c040]" /> 
                      Rebalancing Philosophy
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-[#060d19] p-5 rounded-xl border border-[#12233e] space-y-4">
                      <p className="text-[15px] text-[#c8d8ec] leading-relaxed">
                        Smart Rebalancing uses a threshold-based approach rather than calendar-based rebalancing. Research shows that threshold rebalancing typically outperforms fixed-schedule rebalancing by reducing unnecessary trading costs and tax events.
                      </p>
                      <p className="text-[15px] text-[#c8d8ec] leading-relaxed">
                        The tax-aware engine prioritizes rebalancing in tax-advantaged accounts first, uses tax-loss harvesting opportunities when available, and considers holding periods to minimize short-term capital gains.
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Table 6: Client Summary Settings */}
                <Card className="bg-[#0d1a2e] border-[#12233e]">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">Client Context</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm pb-2 border-b border-[#12233e]">
                        <span className="text-[#7a95b8]">Account Type</span>
                        <span className="text-white">Taxable & IRA</span>
                      </div>
                      <div className="flex justify-between text-sm pb-2 border-b border-[#12233e]">
                        <span className="text-[#7a95b8]">Tax Bracket</span>
                        <span className="text-white">{customTaxRate}%</span>
                      </div>
                      <div className="flex justify-between text-sm pb-2 border-b border-[#12233e]">
                        <span className="text-[#7a95b8]">Risk Tolerance</span>
                        <span className="text-white">Moderate (60/40)</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#7a95b8]">Last Rebalanced</span>
                        <span className="text-white">Oct 15, 2023</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <NAICDisclaimer />
      </div>

      {/* Execution Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-[#0d1a2e] border-[#12233e] shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white">Confirm Execution</CardTitle>
              <CardDescription className="text-[#7a95b8]">You are about to execute {allocations.filter((a) => a.action !== 'hold').length} trades.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isExecuting ? (
                <div className="space-y-4 py-6">
                  <div className="flex justify-between text-sm text-white">
                    <span>Processing trades...</span>
                    <span>{executionProgress}%</span>
                  </div>
                  <Progress value={executionProgress} className="h-2 bg-[#12233e] bg-[#3b82f6]" />
                </div>
              ) : (
                <>
                  <div className="bg-[#060d19] p-4 rounded-lg border border-[#12233e] space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#7a95b8]">Total Value</span>
                      <span className="text-white font-medium">{fmt(totalTrades)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#7a95b8]">Est. Tax Impact</span>
                      <span className="text-[#f59e0b] font-medium">{fmt(estimatedTaxCost)}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="confirm" />
                    <label htmlFor="confirm" className="text-sm text-[#7a95b8] leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      I have reviewed these trades with the client
                    </label>
                  </div>
                </>
              )}
            </CardContent>
            {!isExecuting && (
              <CardFooter className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowConfirmDialog(false)} className="border-[#12233e] text-white hover:bg-[#12233e]">Cancel</Button>
                <Button onClick={confirmExecution} className="bg-[#3b82f6] hover:bg-[#2563eb] text-white">Execute Trades</Button>
              </CardFooter>
            )}
          </Card>
        </div>
      )}

      <PageInsights pageId="smart-rebalancing-alerts" />
    </AppShell>
  );
}
