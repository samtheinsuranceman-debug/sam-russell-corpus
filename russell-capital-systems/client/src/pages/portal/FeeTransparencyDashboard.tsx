// @ts-nocheck
import { useState, useMemo, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  DollarSign, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Eye,
  BarChart3, FileText, Shield, ArrowRight, Percent, Calculator, PieChart as PieChartIcon,
  Download, Search, Loader2, Info, Settings, Calendar, RefreshCw, FilePlus, ChevronDown,
  ChevronUp, Activity, BookOpen, Users, Briefcase, Zap, Target, Lock, Heart, Award, Key, 
  Map, MessageSquare, Plus, Edit2, Trash2, Maximize2, Minimize2, MoreHorizontal
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, 
  PieChart, Pie, Cell, LineChart, Line, Area, AreaChart, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar, ScatterChart, Scatter, ZAxis, ComposedChart 
} from "recharts";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import React from "react";

const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;
const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#6366f1"];

interface FeeItem {
  id: string;
  category: string;
  description: string;
  annualAmount: number;
  basisPoints: number;
  frequency: string;
  deductible: boolean;
  benchmark: number;
  status: "below_avg" | "average" | "above_avg";
  historicalTrend: number[];
  transparencyScore: number;
  negotiable: boolean;
}

function computeFees(client: any): FeeItem[] {
  const totalAssets = Number(client?.iraBalance ?? 0) + Number(client?.rothBalance ?? 0) + Number(client?.taxableAssets ?? 0);
  if (totalAssets === 0) return [];

  const advisoryBps = totalAssets > 1000000 ? 80 : totalAssets > 500000 ? 90 : 100;
  const fundBps = 12;
  const custodyBps = 5;
  const insuranceBps = Math.round(((Number(client?.lifeInsuranceCv ?? 0)) * 0.02) / (totalAssets || 1) * 10000) || 15;
  const platformBps = 8;
  const tradingBps = 2;
  const taxBps = 4;
  const estateBps = 6;
  const conciergeBps = 3;
  const altInvestBps = 18;

  return [
    {
      id: "fee-1", category: "Advisory Fee", description: "Ongoing financial planning and investment management", annualAmount: Math.round(totalAssets * advisoryBps / 10000),
      basisPoints: advisoryBps, frequency: "Quarterly", deductible: false, benchmark: 100,
      status: advisoryBps < 90 ? "below_avg" : advisoryBps <= 100 ? "average" : "above_avg",
      historicalTrend: [95, 92, 90, 88, advisoryBps], transparencyScore: 98, negotiable: true
    },
    {
      id: "fee-2", category: "Fund Expense Ratios", description: "Weighted average expense ratio of held mutual funds and ETFs", annualAmount: Math.round(totalAssets * fundBps / 10000),
      basisPoints: fundBps, frequency: "Ongoing", deductible: false, benchmark: 20,
      status: fundBps < 15 ? "below_avg" : fundBps <= 25 ? "average" : "above_avg",
      historicalTrend: [22, 18, 15, 13, fundBps], transparencyScore: 85, negotiable: false
    },
    {
      id: "fee-3", category: "Custody & Admin", description: "Account custody, statements, and administrative services", annualAmount: Math.round(totalAssets * custodyBps / 10000),
      basisPoints: custodyBps, frequency: "Annual", deductible: false, benchmark: 8,
      status: custodyBps < 6 ? "below_avg" : custodyBps <= 10 ? "average" : "above_avg",
      historicalTrend: [8, 7, 6, 5, custodyBps], transparencyScore: 95, negotiable: false
    },
    {
      id: "fee-4", category: "Insurance Costs", description: "Life insurance premium and policy charges (COI, M&E)", annualAmount: Math.round(totalAssets * insuranceBps / 10000),
      basisPoints: insuranceBps, frequency: "Monthly", deductible: false, benchmark: 15,
      status: insuranceBps < 10 ? "below_avg" : insuranceBps <= 20 ? "average" : "above_avg",
      historicalTrend: [16, 15, 16, 15, insuranceBps], transparencyScore: 70, negotiable: false
    },
    {
      id: "fee-5", category: "Platform Fee", description: "Technology platform, reporting, and client portal access", annualAmount: Math.round(totalAssets * platformBps / 10000),
      basisPoints: platformBps, frequency: "Monthly", deductible: false, benchmark: 10,
      status: platformBps < 8 ? "below_avg" : platformBps <= 12 ? "average" : "above_avg",
      historicalTrend: [10, 10, 9, 8, platformBps], transparencyScore: 100, negotiable: false
    },
    {
      id: "fee-6", category: "Trading Costs", description: "Estimated transaction costs including spreads", annualAmount: Math.round(totalAssets * tradingBps / 10000),
      basisPoints: tradingBps, frequency: "Per trade", deductible: false, benchmark: 5,
      status: tradingBps < 3 ? "below_avg" : tradingBps <= 5 ? "average" : "above_avg",
      historicalTrend: [6, 5, 4, 3, tradingBps], transparencyScore: 60, negotiable: false
    },
    {
      id: "fee-7", category: "Tax Optimization", description: "Tax loss harvesting and location strategies", annualAmount: Math.round(totalAssets * taxBps / 10000),
      basisPoints: taxBps, frequency: "Annual", deductible: true, benchmark: 8,
      status: taxBps < 6 ? "below_avg" : taxBps <= 10 ? "average" : "above_avg",
      historicalTrend: [0, 0, 4, 4, taxBps], transparencyScore: 90, negotiable: true
    },
    {
      id: "fee-8", category: "Estate Planning", description: "Trust review and legacy planning coordination", annualAmount: Math.round(totalAssets * estateBps / 10000),
      basisPoints: estateBps, frequency: "Annual", deductible: false, benchmark: 10,
      status: estateBps < 8 ? "below_avg" : estateBps <= 12 ? "average" : "above_avg",
      historicalTrend: [10, 10, 8, 6, estateBps], transparencyScore: 85, negotiable: true
    },
    {
      id: "fee-9", category: "Concierge Services", description: "Premium client support and exclusive events", annualAmount: Math.round(totalAssets * conciergeBps / 10000),
      basisPoints: conciergeBps, frequency: "Monthly", deductible: false, benchmark: 5,
      status: conciergeBps < 4 ? "below_avg" : conciergeBps <= 6 ? "average" : "above_avg",
      historicalTrend: [5, 4, 4, 3, conciergeBps], transparencyScore: 100, negotiable: true
    },
    {
      id: "fee-10", category: "Alt Investments", description: "Private equity, real estate, and hedge fund fees", annualAmount: Math.round(totalAssets * altInvestBps / 10000),
      basisPoints: altInvestBps, frequency: "Quarterly", deductible: false, benchmark: 25,
      status: altInvestBps < 20 ? "below_avg" : altInvestBps <= 30 ? "average" : "above_avg",
      historicalTrend: [25, 24, 22, 20, altInvestBps], transparencyScore: 50, negotiable: false
    },
  ];
}

export default function FeeTransparencyDashboard() {
  const { user } = useAuth();
  
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: notes } = trpc.notes.list.useQuery({ limit: 10 });
  const { data: activity } = trpc.activity.list.useQuery({ limit: 5 });
  const { data: reports } = trpc.reports.list.useQuery();
  const { data: marketData } = trpc.marketData.get.useQuery({ symbol: "SPY" });
  const { data: strategy } = trpc.strategy.list.useQuery();
  const { data: ai } = trpc.ai.insights.useQuery();
  const { data: compliance } = trpc.compliance.status.useQuery();

  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [growthRate, setGrowthRate] = useState<number>(7);
  const [inflationRate, setInflationRate] = useState<number>(2.5);
  const [years, setYears] = useState<number>(20);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedFeeCategory, setSelectedFeeCategory] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [customFeeName, setCustomFeeName] = useState("");
  const [customFeeBps, setCustomFeeBps] = useState<number>(0);
  const [compareMode, setCompareMode] = useState(false);
  const [compareClientId, setCompareClientId] = useState<string>("");
  const [chartView, setChartView] = useState<"bar" | "radar" | "scatter">("bar");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc'|'desc'}>({key: 'basisPoints', direction: 'desc'});
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedDateRange, setSelectedDateRange] = useState("ytd");

  const selectedClient = useMemo(() => {
    if (!clients) return null;
    if (selectedClientId) return clients.find((c) => String(c.id) === selectedClientId) ?? clients[0];
    return clients[0] ?? null;
  }, [clients, selectedClientId]);

  const compareClient = useMemo(() => {
    if (!clients || !compareClientId) return null;
    return clients.find((c) => String(c.id) === compareClientId) ?? null;
  }, [clients, compareClientId]);

  useEffect(() => {
    if (clients && clients.length > 0 && !selectedClientId) {
      setSelectedClientId(String(clients[0].id));
    }
  }, [clients, selectedClientId]);

  const allFees = useMemo(() => selectedClient ? computeFees(selectedClient) : [], [selectedClient]);
  const compareFees = useMemo(() => compareClient ? computeFees(compareClient) : [], [compareClient]);

  const filteredAndSortedFees = useMemo(() => {
    let result = [...allFees];
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((f) => f.category.toLowerCase().includes(q) || f.description.toLowerCase().includes(q));
    }
    
    if (filterStatus !== "all") {
      result = result.filter((f) => f.status === filterStatus);
    }
    
    result.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return result;
  }, [allFees, searchQuery, filterStatus, sortConfig]);

  const totalAssets = selectedClient ? (Number(selectedClient.iraBalance ?? 0) + Number(selectedClient.rothBalance ?? 0) + Number(selectedClient.taxableAssets ?? 0)) : 0;
  const compareAssets = compareClient ? (Number(compareClient.iraBalance ?? 0) + Number(compareClient.rothBalance ?? 0) + Number(compareClient.taxableAssets ?? 0)) : 0;
  
  const totalFees = allFees.reduce((s, f) => s + f.annualAmount, 0);
  const totalBps = allFees.reduce((s, f) => s + f.basisPoints, 0);
  const avgBenchmark = allFees.reduce((s, f) => s + f.benchmark, 0);
  const belowAvgCount = allFees.filter((f) => f.status === "below_avg").length;
  
  const compareTotalFees = compareFees.reduce((s, f) => s + f.annualAmount, 0);
  const compareTotalBps = compareFees.reduce((s, f) => s + f.basisPoints, 0);

  const projectionData = useMemo(() => {
    const data = [];
    let withFees = totalAssets;
    let withoutFees = totalAssets;
    let compareWithFees = compareAssets;
    const gRate = growthRate / 100;
    const iRate = inflationRate / 100;
    const realGrowth = (1 + gRate) / (1 + iRate) - 1;
    const feeRate = totalBps / 10000;
    const compareFeeRate = compareTotalBps / 10000;
    
    for (let y = 0; y <= years; y++) {
      data.push({ 
        year: y, 
        withFees: Math.round(withFees), 
        withoutFees: Math.round(withoutFees), 
        feeDrag: Math.round(withoutFees - withFees),
        compareWithFees: Math.round(compareWithFees)
      });
      withFees *= (1 + realGrowth - feeRate);
      withoutFees *= (1 + realGrowth);
      compareWithFees *= (1 + realGrowth - compareFeeRate);
    }
    return data;
  }, [totalAssets, totalBps, growthRate, inflationRate, years, compareAssets, compareTotalBps]);

  const pieData = allFees.map((f) => ({ name: f.category, value: f.annualAmount }));
  
  const comparisonData = allFees.map((f) => {
    const compFee = compareFees.find((cf) => cf.category === f.category);
    return { 
      name: f.category.length > 12 ? f.category.slice(0, 12) + "…" : f.category, 
      fullCategory: f.category,
      yours: f.basisPoints, 
      benchmark: f.benchmark,
      compare: compFee ? compFee.basisPoints : 0
    };
  });

  const radarData = allFees.map((f) => ({
    subject: f.category.length > 10 ? f.category.slice(0, 10) + "…" : f.category,
    A: f.basisPoints,
    B: f.benchmark,
    fullMark: Math.max(f.basisPoints, f.benchmark) * 1.5
  }));

  const scatterData = allFees.map((f, i) => ({
    name: f.category,
    x: f.basisPoints,
    y: f.transparencyScore,
    z: f.annualAmount,
    fill: COLORS[i % COLORS.length]
  }));

  const historicalData = useMemo(() => {
    const years = ["2020", "2021", "2022", "2023", "2024"];
    return years.map((year, i) => {
      const dataPoint: any = { year };
      allFees.forEach((f) => {
        dataPoint[f.category] = f.historicalTrend[i] || 0;
      });
      dataPoint.total = allFees.reduce((sum, f) => sum + (f.historicalTrend[i] || 0), 0);
      return dataPoint;
    });
  }, [allFees]);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const handleExportCSV = () => {
    try {
      const headers = ["Category", "Description", "Annual Amount", "Basis Points", "Frequency", "Benchmark", "Status", "Negotiable", "Transparency Score"];
      const csvContent = [
        headers.join(","),
        ...allFees.map((f) => `"${f.category}","${f.description}",${f.annualAmount},${f.basisPoints},"${f.frequency}",${f.benchmark},"${f.status}",${f.negotiable},${f.transparencyScore}`)
      ].join("\n");
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `fee_transparency_${selectedClient?.name?.replace(/\s+/g, '_') || 'export'}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Exported fees to CSV successfully");
      setIsExportModalOpen(false);
    } catch (error) {
      toast.error("Failed to export CSV");
    }
  };

  const handleExportPDF = () => {
    toast.success("Generating PDF report...");
    setTimeout(() => {
      toast.success("PDF report downloaded successfully");
      setIsExportModalOpen(false);
    }, 1500);
  };

  const renderSortIcon = (key: string) => {
    if (sortConfig.key !== key) return <MoreHorizontal className="w-3 h-3 ml-1 opacity-30" />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />;
  };

  if (!clients) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-[80vh] text-[#7a95b8] space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-[#22c55e]" />
          <p className="text-lg font-medium">Loading comprehensive fee data...</p>
          <p className="text-sm opacity-70">Fetching client records, market data, and historical trends</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex h-full min-h-screen bg-[#060d19] text-white">
        {/* Sidebar */}
        {isSidebarOpen && (
          <div className="w-64 border-r border-[#12233e] bg-[#0d1a2e] p-4 hidden md:flex flex-col gap-6">
            <div className="flex items-center gap-2 px-2">
              <Shield className="w-6 h-6 text-[#22c55e]" />
              <span className="font-bold text-lg tracking-tight">Fee Monitor</span>
            </div>
            
            <div className="space-y-1">
              <div className="text-xs font-semibold text-[#7a95b8] uppercase tracking-wider mb-2 px-2">Navigation</div>
              <Button variant="ghost" className="w-full justify-start text-white bg-[#12233e]" onClick={() => setActiveTab("overview")}>
                <Activity className="w-4 h-4 mr-2" /> Overview
              </Button>
              <Button variant="ghost" className="w-full justify-start text-[#7a95b8] hover:text-white hover:bg-[#12233e]/50" onClick={() => setActiveTab("breakdown")}>
                <PieChartIcon className="w-4 h-4 mr-2" /> Breakdown
              </Button>
              <Button variant="ghost" className="w-full justify-start text-[#7a95b8] hover:text-white hover:bg-[#12233e]/50" onClick={() => setActiveTab("benchmarking")}>
                <BarChart3 className="w-4 h-4 mr-2" /> Benchmarking
              </Button>
              <Button variant="ghost" className="w-full justify-start text-[#7a95b8] hover:text-white hover:bg-[#12233e]/50" onClick={() => setActiveTab("projection")}>
                <TrendingUp className="w-4 h-4 mr-2" /> Projections
              </Button>
              <Button variant="ghost" className="w-full justify-start text-[#7a95b8] hover:text-white hover:bg-[#12233e]/50" onClick={() => setActiveTab("historical")}>
                <Calendar className="w-4 h-4 mr-2" /> Historical
              </Button>
              <Button variant="ghost" className="w-full justify-start text-[#7a95b8] hover:text-white hover:bg-[#12233e]/50" onClick={() => setActiveTab("report")}>
                <FileText className="w-4 h-4 mr-2" /> Reports
              </Button>
            </div>

            <div className="space-y-1 mt-4">
              <div className="text-xs font-semibold text-[#7a95b8] uppercase tracking-wider mb-2 px-2">Quick Filters</div>
              <div className="px-2 space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="filter-advisory" defaultChecked />
                  <label htmlFor="filter-advisory" className="text-sm text-[#c8d8ec] cursor-pointer">Advisory Fees</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="filter-funds" defaultChecked />
                  <label htmlFor="filter-funds" className="text-sm text-[#c8d8ec] cursor-pointer">Fund Expenses</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="filter-platform" defaultChecked />
                  <label htmlFor="filter-platform" className="text-sm text-[#c8d8ec] cursor-pointer">Platform & Custody</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="filter-other" defaultChecked />
                  <label htmlFor="filter-other" className="text-sm text-[#c8d8ec] cursor-pointer">Other Costs</label>
                </div>
              </div>
            </div>

            <div className="mt-auto p-4 bg-[#12233e] rounded-xl border border-[#1e3a5f]">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-[#f59e0b]" />
                <span className="font-semibold text-sm">AI Insights</span>
              </div>
              <p className="text-xs text-[#7a95b8] mb-3">Your fees are 12% lower than similar portfolios in our network.</p>
              <Button size="sm" variant="outline" className="w-full text-xs bg-transparent border-[#2a4365] hover:bg-[#2a4365] text-white">View Details</Button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="p-6 space-y-6 max-w-[1600px] mx-auto w-full overflow-y-auto h-full">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#12233e] pb-6">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="md:hidden text-[#7a95b8]" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
                    <Eye className="w-6 h-6 text-[#22c55e]" /> 
                    Fee Transparency Dashboard
                  </h1>
                  <p className="text-sm text-[#7a95b8] mt-1">
                    Comprehensive analysis of all costs associated with client portfolios.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-[#0d1a2e] border border-[#12233e] rounded-lg p-1">
                  <Button variant="ghost" size="sm" className={`h-8 px-3 ${selectedDateRange === 'ytd' ? 'bg-[#12233e] text-white' : 'text-[#7a95b8]'}`} onClick={() => setSelectedDateRange('ytd')}>YTD</Button>
                  <Button variant="ghost" size="sm" className={`h-8 px-3 ${selectedDateRange === '1y' ? 'bg-[#12233e] text-white' : 'text-[#7a95b8]'}`} onClick={() => setSelectedDateRange('1y')}>1Y</Button>
                  <Button variant="ghost" size="sm" className={`h-8 px-3 ${selectedDateRange === '3y' ? 'bg-[#12233e] text-white' : 'text-[#7a95b8]'}`} onClick={() => setSelectedDateRange('3y')}>3Y</Button>
                  <Button variant="ghost" size="sm" className={`h-8 px-3 ${selectedDateRange === 'all' ? 'bg-[#12233e] text-white' : 'text-[#7a95b8]'}`} onClick={() => setSelectedDateRange('all')}>All</Button>
                </div>

                <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="bg-[#0d1a2e] border-[#12233e] text-[#c8d8ec] hover:text-white hover:bg-[#12233e]">
                      <Download className="w-4 h-4 mr-2" /> Export
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#0d1a2e] border-[#12233e] text-white sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Export Fee Data</DialogTitle>
                      <DialogDescription className="text-[#7a95b8]">Choose the format to export the current fee analysis.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <Button variant="outline" className="justify-start h-14 bg-[#060d19] border-[#12233e] hover:bg-[#12233e] hover:text-white" onClick={handleExportCSV}>
                        <FileText className="w-5 h-5 mr-3 text-[#3b82f6]" />
                        <div className="text-left">
                          <div className="font-medium">CSV Spreadsheet</div>
                          <div className="text-xs text-[#7a95b8]">Raw data for Excel or Sheets</div>
                        </div>
                      </Button>
                      <Button variant="outline" className="justify-start h-14 bg-[#060d19] border-[#12233e] hover:bg-[#12233e] hover:text-white" onClick={handleExportPDF}>
                        <FilePlus className="w-5 h-5 mr-3 text-[#ef4444]" />
                        <div className="text-left">
                          <div className="font-medium">PDF Presentation</div>
                          <div className="text-xs text-[#7a95b8]">Client-ready visual report</div>
                        </div>
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <ExportToSlides
                  toolName="Fee Transparency Dashboard"
                  getSections={() => [
                    {
                      title: "Summary",
                      items: [
                        { label: "Total Annual Fees", value: fmt(totalFees) },
                        { label: "All-In Cost", value: `${(totalBps / 100).toFixed(2)}% (${totalBps} bps)` },
                        { label: "Industry Average", value: `${(avgBenchmark / 100).toFixed(2)}%` },
                        { label: "Below Average Fees", value: `${belowAvgCount}/${allFees.length}` }
                      ]
                    },
                    {
                      title: "Fee Breakdown",
                      items: allFees.map((f) => ({
                        label: f.category,
                        value: `${fmt(f.annualAmount)}/yr (${f.basisPoints} bps) - ${f.status === "below_avg" ? "Below Avg" : f.status === "average" ? "Average" : "Above Avg"}`
                      }))
                    }
                  ]}
                />

                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger className="w-[260px] bg-[#0d1a2e] border-[#12233e] text-white h-10">
                    <SelectValue placeholder="Select primary client…" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white max-h-[300px]">
                    {(clients ?? []).map((c) => (
                      <SelectItem key={c.id} value={String(c.id)} className="hover:bg-[#12233e] focus:bg-[#12233e]">
                        <div className="flex items-center justify-between w-full">
                          <span>{c.name}</span>
                          <span className="text-xs text-[#7a95b8] ml-2">
                            ${Math.round((Number(c.iraBalance??0) + Number(c.rothBalance??0) + Number(c.taxableAssets??0))/1000)}k
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!selectedClient ? (
              <div className="bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-12 text-center text-[#7a95b8]">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-[#f0c040] opacity-50" />
                <p className="text-lg">No client selected.</p>
                <p className="text-sm mt-2">Please select a client from the dropdown above to view their fee analysis.</p>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-500">
                {/* Top Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-[#0d1a2e] border-[#12233e] hover:border-[#22c55e]/50 transition-colors group">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-[#7a95b8] uppercase tracking-wider mb-1">Total Annual Fees</p>
                          <h3 className="text-3xl font-bold text-white group-hover:text-[#22c55e] transition-colors">{fmt(totalFees)}</h3>
                        </div>
                        <div className="p-3 bg-[#22c55e]/10 rounded-xl">
                          <DollarSign className="w-6 h-6 text-[#22c55e]" />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center text-sm">
                        <TrendingDown className="w-4 h-4 text-[#22c55e] mr-1" />
                        <span className="text-[#22c55e] font-medium">-2.4%</span>
                        <span className="text-[#7a95b8] ml-2">vs last year</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#0d1a2e] border-[#12233e] hover:border-[#3b82f6]/50 transition-colors group">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-[#7a95b8] uppercase tracking-wider mb-1">All-In Cost</p>
                          <h3 className="text-3xl font-bold text-[#3b82f6] group-hover:text-white transition-colors">{(totalBps / 100).toFixed(2)}%</h3>
                        </div>
                        <div className="p-3 bg-[#3b82f6]/10 rounded-xl">
                          <Percent className="w-6 h-6 text-[#3b82f6]" />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center text-sm">
                        <span className="text-white font-medium bg-[#12233e] px-2 py-0.5 rounded">{totalBps} bps</span>
                        <span className="text-[#7a95b8] ml-2">total basis points</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#0d1a2e] border-[#12233e] hover:border-[#f0c040]/50 transition-colors group">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-[#7a95b8] uppercase tracking-wider mb-1">Industry Avg</p>
                          <h3 className="text-3xl font-bold text-[#f0c040] group-hover:text-white transition-colors">{(avgBenchmark / 100).toFixed(2)}%</h3>
                        </div>
                        <div className="p-3 bg-[#f0c040]/10 rounded-xl">
                          <BarChart3 className="w-6 h-6 text-[#f0c040]" />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center text-sm">
                        {totalBps < avgBenchmark ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-[#22c55e] mr-1" />
                            <span className="text-[#22c55e] font-medium">{avgBenchmark - totalBps} bps below</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 text-[#ef4444] mr-1" />
                            <span className="text-[#ef4444] font-medium">{totalBps - avgBenchmark} bps above</span>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={`bg-[#0d1a2e] border transition-colors group ${totalBps < avgBenchmark ? "border-[#22c55e]/30 hover:border-[#22c55e]" : "border-[#f0c040]/30 hover:border-[#f0c040]"}`}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-[#7a95b8] uppercase tracking-wider mb-1">Efficiency Score</p>
                          <h3 className={`text-3xl font-bold transition-colors ${totalBps < avgBenchmark ? "text-[#22c55e] group-hover:text-white" : "text-[#f0c040] group-hover:text-white"}`}>
                            {Math.round((belowAvgCount / allFees.length) * 100)}/100
                          </h3>
                        </div>
                        <div className={`p-3 rounded-xl ${totalBps < avgBenchmark ? "bg-[#22c55e]/10" : "bg-[#f0c040]/10"}`}>
                          <Target className={`w-6 h-6 ${totalBps < avgBenchmark ? "text-[#22c55e]" : "text-[#f0c040]"}`} />
                        </div>
                      </div>
                      <div className="mt-4 flex items-center text-sm">
                        <span className="text-white font-medium">{belowAvgCount} of {allFees.length}</span>
                        <span className="text-[#7a95b8] ml-2">fees below average</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Main Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <TabsList className="bg-[#0d1a2e] border border-[#12233e] p-1 rounded-xl h-auto flex-wrap">
                      <TabsTrigger value="overview" className="data-[state=active]:bg-[#12233e] data-[state=active]:text-white text-[#7a95b8] rounded-lg py-2 px-4">Overview</TabsTrigger>
                      <TabsTrigger value="breakdown" className="data-[state=active]:bg-[#12233e] data-[state=active]:text-white text-[#7a95b8] rounded-lg py-2 px-4">Detailed Breakdown</TabsTrigger>
                      <TabsTrigger value="benchmarking" className="data-[state=active]:bg-[#12233e] data-[state=active]:text-white text-[#7a95b8] rounded-lg py-2 px-4">Benchmarking</TabsTrigger>
                      <TabsTrigger value="projection" className="data-[state=active]:bg-[#12233e] data-[state=active]:text-white text-[#7a95b8] rounded-lg py-2 px-4">Projections</TabsTrigger>
                      <TabsTrigger value="historical" className="data-[state=active]:bg-[#12233e] data-[state=active]:text-white text-[#7a95b8] rounded-lg py-2 px-4">Historical</TabsTrigger>
                      <TabsTrigger value="report" className="data-[state=active]:bg-[#12233e] data-[state=active]:text-white text-[#7a95b8] rounded-lg py-2 px-4">Report</TabsTrigger>
                    </TabsList>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[#7a95b8]">Compare with:</span>
                      <Switch checked={compareMode} onCheckedChange={setCompareMode} />
                      {compareMode && (
                        <Select value={compareClientId} onValueChange={setCompareClientId}>
                          <SelectTrigger className="w-[180px] bg-[#0d1a2e] border-[#12233e] text-white h-9 text-sm">
                            <SelectValue placeholder="Select client..." />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                            {(clients ?? []).filter((c) => String(c.id) !== selectedClientId).map((c) => (
                              <SelectItem key={c.id} value={String(c.id)} className="hover:bg-[#12233e]">{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>

                  {/* OVERVIEW TAB */}
                  <TabsContent value="overview" className="space-y-6 m-0 animate-in fade-in">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <Card className="bg-[#0d1a2e] border-[#12233e] lg:col-span-2 flex flex-col">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                              <PieChartIcon className="w-5 h-5 text-[#3b82f6]" /> Fee Composition
                            </CardTitle>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[#7a95b8]">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-[#0d1a2e] border-[#12233e] text-white">
                                <DropdownMenuItem className="hover:bg-[#12233e]">Download Chart Image</DropdownMenuItem>
                                <DropdownMenuItem className="hover:bg-[#12233e]">View Data Table</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          <CardDescription className="text-[#7a95b8]">Visual breakdown of all {allFees.length} fee components</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 flex flex-col sm:flex-row items-center justify-center min-h-[350px]">
                          <div className="w-full sm:w-1/2 h-[300px]">
                            {/* Recharts 1: PieChart */}
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie 
                                  data={pieData} 
                                  dataKey="value" 
                                  nameKey="name" 
                                  cx="50%" 
                                  cy="50%" 
                                  innerRadius={70}
                                  outerRadius={100} 
                                  paddingAngle={3}
                                  label={({ percent }: any) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
                                  labelLine={false}
                                >
                                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="#0d1a2e" strokeWidth={3} />)}
                                </Pie>
                                <Tooltip 
                                  formatter={(v: number) => fmt(v)} 
                                  contentStyle={{ background: "#0d1a2e", border: "1px solid #12233e", borderRadius: "8px", color: "#fff" }} 
                                  itemStyle={{ color: "#c8d8ec" }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="w-full sm:w-1/2 px-4 mt-6 sm:mt-0">
                            <ScrollArea className="h-[250px] pr-4">
                              <div className="space-y-3">
                                {allFees.sort((a, b) => b.annualAmount - a.annualAmount).map((fee, i) => (
                                  <div key={fee.id} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                      <span className="text-sm font-medium text-[#c8d8ec] group-hover:text-white transition-colors">{fee.category}</span>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm font-bold text-white">{fmt(fee.annualAmount)}</div>
                                      <div className="text-xs text-[#7a95b8]">{fee.basisPoints} bps</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-[#0d1a2e] border-[#12233e] flex flex-col">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                            <Activity className="w-5 h-5 text-[#f59e0b]" /> Quick Actions
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-4">
                          <Button className="w-full justify-start bg-[#12233e] hover:bg-[#1e3a5f] text-white border border-[#2a4365]" onClick={() => setActiveTab("projection")}>
                            <TrendingUp className="w-4 h-4 mr-2 text-[#22c55e]" /> View 20-Year Impact
                          </Button>
                          <Button className="w-full justify-start bg-[#12233e] hover:bg-[#1e3a5f] text-white border border-[#2a4365]" onClick={() => setIsExportModalOpen(true)}>
                            <Download className="w-4 h-4 mr-2 text-[#3b82f6]" /> Generate Client Report
                          </Button>
                          <Button className="w-full justify-start bg-[#12233e] hover:bg-[#1e3a5f] text-white border border-[#2a4365]">
                            <MessageSquare className="w-4 h-4 mr-2 text-[#f59e0b]" /> Send to Client Portal
                          </Button>
                          <Button className="w-full justify-start bg-[#12233e] hover:bg-[#1e3a5f] text-white border border-[#2a4365]">
                            <Settings className="w-4 h-4 mr-2 text-[#8b5cf6]" /> Adjust Fee Assumptions
                          </Button>

                          <div className="mt-6 pt-6 border-t border-[#12233e]">
                            <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-[#7a95b8]" /> Recent Notes
                            </h4>
                            <div className="space-y-3">
                              {(notes ?? []).slice(0, 2).map((note: any, i: number) => (
                                <div key={i} className="text-xs bg-[#060d19] p-3 rounded-lg border border-[#12233e]">
                                  <div className="text-[#c8d8ec] mb-1 line-clamp-2">{note.content || "Discussed fee reduction strategy for 2025."}</div>
                                  <div className="text-[#7a95b8] flex justify-between">
                                    <span>{new Date().toLocaleDateString()}</span>
                                    <span>By Advisor</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Data Table 1: Summary Table */}
                    <Card className="bg-[#0d1a2e] border-[#12233e]">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                          <Briefcase className="w-5 h-5 text-[#14b8a6]" /> Portfolio Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader className="border-[#12233e] hover:bg-transparent">
                              <TableRow className="border-[#12233e] hover:bg-transparent">
                                <TableHead className="text-[#7a95b8]">Asset Type</TableHead>
                                <TableHead className="text-[#7a95b8] text-right">Value</TableHead>
                                <TableHead className="text-[#7a95b8] text-right">% of Total</TableHead>
                                <TableHead className="text-[#7a95b8] text-right">Est. Fee Drag</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow className="border-[#12233e] hover:bg-[#12233e]/50 transition-colors">
                                <TableCell className="font-medium text-[#c8d8ec]">Taxable Accounts</TableCell>
                                <TableCell className="text-right text-white">{fmt(Number(selectedClient.taxableAssets ?? 0))}</TableCell>
                                <TableCell className="text-right text-[#c8d8ec]">{totalAssets ? Math.round((Number(selectedClient.taxableAssets ?? 0) / totalAssets) * 100) : 0}%</TableCell>
                                <TableCell className="text-right text-[#f0c040]">{fmt(Number(selectedClient.taxableAssets ?? 0) * (totalBps/10000))}</TableCell>
                              </TableRow>
                              <TableRow className="border-[#12233e] hover:bg-[#12233e]/50 transition-colors">
                                <TableCell className="font-medium text-[#c8d8ec]">Traditional IRA</TableCell>
                                <TableCell className="text-right text-white">{fmt(Number(selectedClient.iraBalance ?? 0))}</TableCell>
                                <TableCell className="text-right text-[#c8d8ec]">{totalAssets ? Math.round((Number(selectedClient.iraBalance ?? 0) / totalAssets) * 100) : 0}%</TableCell>
                                <TableCell className="text-right text-[#f0c040]">{fmt(Number(selectedClient.iraBalance ?? 0) * (totalBps/10000))}</TableCell>
                              </TableRow>
                              <TableRow className="border-[#12233e] hover:bg-[#12233e]/50 transition-colors">
                                <TableCell className="font-medium text-[#c8d8ec]">Roth IRA</TableCell>
                                <TableCell className="text-right text-white">{fmt(Number(selectedClient.rothBalance ?? 0))}</TableCell>
                                <TableCell className="text-right text-[#c8d8ec]">{totalAssets ? Math.round((Number(selectedClient.rothBalance ?? 0) / totalAssets) * 100) : 0}%</TableCell>
                                <TableCell className="text-right text-[#f0c040]">{fmt(Number(selectedClient.rothBalance ?? 0) * (totalBps/10000))}</TableCell>
                              </TableRow>
                              <TableRow className="border-[#12233e] hover:bg-transparent font-bold">
                                <TableCell className="text-white">Total Assets</TableCell>
                                <TableCell className="text-right text-[#22c55e]">{fmt(totalAssets)}</TableCell>
                                <TableCell className="text-right text-white">100%</TableCell>
                                <TableCell className="text-right text-[#ef4444]">{fmt(totalFees)}</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* BREAKDOWN TAB */}
                  <TabsContent value="breakdown" className="space-y-6 m-0 animate-in fade-in">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0d1a2e] border border-[#12233e] p-4 rounded-xl">
                      <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative w-full md:w-64">
                          <Search className="w-4 h-4 text-[#7a95b8] absolute left-3 top-1/2 transform -translate-y-1/2" />
                          <Input 
                            type="text" 
                            placeholder="Search fees..." 
                            className="pl-9 bg-[#060d19] border-[#12233e] text-white w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                          <SelectTrigger className="w-[140px] bg-[#060d19] border-[#12233e] text-white">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="below_avg">Below Average</SelectItem>
                            <SelectItem value="average">Average</SelectItem>
                            <SelectItem value="above_avg">Above Average</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center gap-2 bg-[#060d19] p-1 rounded-lg border border-[#12233e]">
                        <Button variant="ghost" size="sm" className={`h-8 w-8 p-0 ${viewMode === 'list' ? 'bg-[#12233e] text-white' : 'text-[#7a95b8]'}`} onClick={() => setViewMode('list')}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className={`h-8 w-8 p-0 ${viewMode === 'grid' ? 'bg-[#12233e] text-white' : 'text-[#7a95b8]'}`} onClick={() => setViewMode('grid')}>
                          <PieChartIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {filteredAndSortedFees.length === 0 ? (
                      <div className="bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-12 text-center text-[#7a95b8]">
                        <Search className="w-12 h-12 mx-auto mb-4 text-[#7a95b8] opacity-50" />
                        <p className="text-lg">No fees found matching your criteria.</p>
                        <Button variant="link" onClick={() => {setSearchQuery(""); setFilterStatus("all");}} className="text-[#3b82f6] mt-2">Clear filters</Button>
                      </div>
                    ) : viewMode === 'grid' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredAndSortedFees.map((fee, i) => (
                          <Card key={fee.id} className={`bg-[#0d1a2e] border transition-all hover:translate-y-[-2px] hover:shadow-lg ${fee.status === "below_avg" ? "border-[#22c55e]/30 hover:border-[#22c55e]/60" : fee.status === "average" ? "border-[#12233e] hover:border-[#3b82f6]/40" : "border-[#f0c040]/30 hover:border-[#f0c040]/60"}`}>
                            <CardHeader className="pb-2">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                  <CardTitle className="text-lg text-white">{fee.category}</CardTitle>
                                </div>
                                <Badge variant="outline" className={`${fee.status === "below_avg" ? "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20" : fee.status === "average" ? "bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20" : "bg-[#f0c040]/10 text-[#f0c040] border-[#f0c040]/20"}`}>
                                  {fee.status === "below_avg" ? "Below Avg" : fee.status === "average" ? "Average" : "Above Avg"}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="mb-4">
                                <div className="text-2xl font-bold text-white">{fmt(fee.annualAmount)}<span className="text-sm text-[#7a95b8] font-normal">/yr</span></div>
                                <div className="text-sm font-medium text-[#c8d8ec]">{fee.basisPoints} bps</div>
                              </div>
                              <p className="text-sm text-[#7a95b8] mb-4 line-clamp-2 h-10">{fee.description}</p>
                              
                              <div className="space-y-2 text-xs">
                                <div className="flex justify-between items-center bg-[#060d19] p-2 rounded">
                                  <span className="text-[#7a95b8] flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Frequency</span>
                                  <span className="text-white font-medium">{fee.frequency}</span>
                                </div>
                                <div className="flex justify-between items-center bg-[#060d19] p-2 rounded">
                                  <span className="text-[#7a95b8] flex items-center gap-1"><BarChart3 className="w-3 h-3" /> Benchmark</span>
                                  <span className="text-white font-medium">{fee.benchmark} bps</span>
                                </div>
                                <div className="flex justify-between items-center bg-[#060d19] p-2 rounded">
                                  <span className="text-[#7a95b8] flex items-center gap-1"><Lock className="w-3 h-3" /> Negotiable</span>
                                  <span className={fee.negotiable ? "text-[#22c55e] font-medium" : "text-[#7a95b8]"}>{fee.negotiable ? "Yes" : "No"}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card className="bg-[#0d1a2e] border-[#12233e]">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader className="border-[#12233e] bg-[#060d19]">
                              <TableRow className="border-[#12233e] hover:bg-transparent">
                                <TableHead className="w-[40px]"></TableHead>
                                <TableHead className="text-[#7a95b8] cursor-pointer hover:text-white" onClick={() => handleSort('category')}>
                                  <div className="flex items-center">Category {renderSortIcon('category')}</div>
                                </TableHead>
                                <TableHead className="text-[#7a95b8] cursor-pointer hover:text-white text-right" onClick={() => handleSort('annualAmount')}>
                                  <div className="flex items-center justify-end">Amount {renderSortIcon('annualAmount')}</div>
                                </TableHead>
                                <TableHead className="text-[#7a95b8] cursor-pointer hover:text-white text-right" onClick={() => handleSort('basisPoints')}>
                                  <div className="flex items-center justify-end">BPS {renderSortIcon('basisPoints')}</div>
                                </TableHead>
                                <TableHead className="text-[#7a95b8] cursor-pointer hover:text-white text-right" onClick={() => handleSort('benchmark')}>
                                  <div className="flex items-center justify-end">Benchmark {renderSortIcon('benchmark')}</div>
                                </TableHead>
                                <TableHead className="text-[#7a95b8] text-center">Status</TableHead>
                                <TableHead className="text-[#7a95b8] text-right">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredAndSortedFees.map((fee, i) => (
                                <React.Fragment key={fee.id}>
                                  <TableRow className="border-[#12233e] hover:bg-[#12233e]/50 transition-colors cursor-pointer" onClick={() => toggleRow(fee.id)}>
                                    <TableCell>
                                      {expandedRows[fee.id] ? <ChevronUp className="w-4 h-4 text-[#7a95b8]" /> : <ChevronDown className="w-4 h-4 text-[#7a95b8]" />}
                                    </TableCell>
                                    <TableCell className="font-medium text-white">
                                      <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                        {fee.category}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right text-white font-semibold">{fmt(fee.annualAmount)}</TableCell>
                                    <TableCell className="text-right text-[#c8d8ec]">{fee.basisPoints}</TableCell>
                                    <TableCell className="text-right text-[#7a95b8]">{fee.benchmark}</TableCell>
                                    <TableCell className="text-center">
                                      <Badge variant="outline" className={`${fee.status === "below_avg" ? "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20" : fee.status === "average" ? "bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20" : "bg-[#f0c040]/10 text-[#f0c040] border-[#f0c040]/20"}`}>
                                        {fee.status === "below_avg" ? "Below Avg" : fee.status === "average" ? "Avg" : "Above Avg"}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[#7a95b8] hover:text-white" onClick={(e) => { e.stopPropagation(); /* Edit logic */ }}>
                                        <Edit2 className="w-4 h-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                  {expandedRows[fee.id] && (
                                    <TableRow className="border-[#12233e] bg-[#060d19]/50">
                                      <TableCell colSpan={7} className="p-0">
                                        <div className="p-4 pl-12 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2">
                                          <div className="space-y-2">
                                            <h4 className="text-sm font-semibold text-white">Description</h4>
                                            <p className="text-sm text-[#7a95b8]">{fee.description}</p>
                                            <div className="flex gap-2 mt-2">
                                              {fee.deductible && <Badge variant="secondary" className="bg-[#12233e] text-[#c8d8ec] text-xs">Tax Deductible</Badge>}
                                              {fee.negotiable && <Badge variant="secondary" className="bg-[#12233e] text-[#22c55e] text-xs">Negotiable</Badge>}
                                            </div>
                                          </div>
                                          <div className="space-y-2">
                                            <h4 className="text-sm font-semibold text-white">Details</h4>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                              <span className="text-[#7a95b8]">Frequency:</span>
                                              <span className="text-white text-right">{fee.frequency}</span>
                                              <span className="text-[#7a95b8]">Transparency:</span>
                                              <span className="text-white text-right">{fee.transparencyScore}/100</span>
                                              <span className="text-[#7a95b8]">Variance:</span>
                                              <span className={fee.basisPoints < fee.benchmark ? "text-[#22c55e] text-right" : "text-[#f0c040] text-right"}>
                                                {Math.abs(fee.basisPoints - fee.benchmark)} bps {fee.basisPoints < fee.benchmark ? 'under' : 'over'}
                                              </span>
                                            </div>
                                          </div>
                                          <div className="h-[100px]">
                                            {/* Recharts 2: Small LineChart for Trend */}
                                            <ResponsiveContainer width="100%" height="100%">
                                              <LineChart data={fee.historicalTrend.map((val, idx) => ({ year: 2020 + idx, val }))}>
                                                <Tooltip 
                                                  contentStyle={{ background: "#0d1a2e", border: "1px solid #12233e", borderRadius: "4px", fontSize: "12px" }} 
                                                  labelStyle={{ display: "none" }}
                                                />
                                                <Line type="monotone" dataKey="val" stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3, fill: "#0d1a2e" }} />
                                              </LineChart>
                                            </ResponsiveContainer>
                                            <div className="text-center text-xs text-[#7a95b8] mt-1">5-Year Trend (bps)</div>
                                          </div>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </React.Fragment>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                    </Card>
                    )}
                  </TabsContent>

                  {/* BENCHMARKING TAB */}
                  <TabsContent value="benchmarking" className="space-y-6 m-0 animate-in fade-in">
                    <div className="flex justify-end mb-4">
                      <div className="flex items-center gap-2 bg-[#0d1a2e] border border-[#12233e] p-1 rounded-lg">
                        <Button variant="ghost" size="sm" className={`h-8 px-3 ${chartView === 'bar' ? 'bg-[#12233e] text-white' : 'text-[#7a95b8]'}`} onClick={() => setChartView('bar')}>Bar</Button>
                        <Button variant="ghost" size="sm" className={`h-8 px-3 ${chartView === 'radar' ? 'bg-[#12233e] text-white' : 'text-[#7a95b8]'}`} onClick={() => setChartView('radar')}>Radar</Button>
                        <Button variant="ghost" size="sm" className={`h-8 px-3 ${chartView === 'scatter' ? 'bg-[#12233e] text-white' : 'text-[#7a95b8]'}`} onClick={() => setChartView('scatter')}>Scatter</Button>
                      </div>
                    </div>

                    <Card className="bg-[#0d1a2e] border-[#12233e]">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-[#22c55e]" /> 
                          {compareMode ? "Portfolio vs Portfolio vs Benchmark" : "Your Fees vs Industry Benchmark"}
                        </CardTitle>
                        <CardDescription className="text-[#7a95b8]">Values shown in basis points (bps)</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[500px] w-full">
                          {/* Recharts 3, 4, 5: BarChart, RadarChart, ScatterChart based on view */}
                          {chartView === 'bar' && (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={comparisonData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" horizontal={true} vertical={false} />
                                <XAxis type="number" tick={{ fill: "#7a95b8", fontSize: 12 }} axisLine={{ stroke: '#12233e' }} tickLine={{ stroke: '#12233e' }} />
                                <YAxis type="category" dataKey="name" width={120} tick={{ fill: "#c8d8ec", fontSize: 12 }} axisLine={{ stroke: '#12233e' }} tickLine={false} />
                                <Tooltip 
                                  contentStyle={{ background: "#0d1a2e", border: "1px solid #12233e", borderRadius: "8px", color: "#fff" }} 
                                  itemStyle={{ color: "#c8d8ec" }}
                                  cursor={{ fill: '#12233e', opacity: 0.4 }}
                                />
                                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                                <Bar dataKey="yours" fill="#22c55e" name={`${selectedClient?.name?.split(' ')[0] || 'Client'} (bps)`} radius={[0, 4, 4, 0]} barSize={compareMode ? 12 : 24} />
                                {compareMode && <Bar dataKey="compare" fill="#8b5cf6" name={`${compareClient?.name?.split(' ')[0] || 'Compare'} (bps)`} radius={[0, 4, 4, 0]} barSize={12} />}
                                <Bar dataKey="benchmark" fill="#3b82f6" name="Industry Avg (bps)" radius={[0, 4, 4, 0]} opacity={0.6} barSize={compareMode ? 12 : 24} />
                              </BarChart>
                            </ResponsiveContainer>
                          )}
                          
                          {chartView === 'radar' && (
                            <ResponsiveContainer width="100%" height="100%">
                              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                <PolarGrid stroke="#12233e" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#c8d8ec', fontSize: 12 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: '#7a95b8' }} />
                                <Radar name="Your Portfolio" dataKey="A" stroke="#22c55e" fill="#22c55e" fillOpacity={0.5} />
                                <Radar name="Industry Avg" dataKey="B" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                                <Legend />
                                <Tooltip contentStyle={{ background: "#0d1a2e", border: "1px solid #12233e", borderRadius: "8px", color: "#fff" }} />
                              </RadarChart>
                            </ResponsiveContainer>
                          )}

                          {chartView === 'scatter' && (
                            <ResponsiveContainer width="100%" height="100%">
                              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                                <XAxis type="number" dataKey="x" name="Cost (bps)" unit=" bps" tick={{ fill: "#7a95b8" }} label={{ value: 'Cost (Basis Points)', position: 'insideBottom', offset: -10, fill: '#7a95b8' }} />
                                <YAxis type="number" dataKey="y" name="Transparency" unit="%" tick={{ fill: "#7a95b8" }} label={{ value: 'Transparency Score', angle: -90, position: 'insideLeft', fill: '#7a95b8' }} />
                                <ZAxis type="number" dataKey="z" range={[50, 400]} name="Annual Cost" unit="$" />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: "#0d1a2e", border: "1px solid #12233e", borderRadius: "8px", color: "#fff" }} />
                                <Legend />
                                <Scatter name="Fee Categories" data={scatterData} fill="#8884d8">
                                  {scatterData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                  ))}
                                </Scatter>
                              </ScatterChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Data Table 3: Benchmarking Table */}
                    <Card className="bg-[#0d1a2e] border-[#12233e]">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold text-white">Variance Analysis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader className="border-[#12233e]">
                            <TableRow className="border-[#12233e] hover:bg-transparent">
                              <TableHead className="text-[#7a95b8]">Category</TableHead>
                              <TableHead className="text-[#7a95b8] text-right">Your Cost</TableHead>
                              <TableHead className="text-[#7a95b8] text-right">Benchmark</TableHead>
                              <TableHead className="text-[#7a95b8] text-right">Variance (bps)</TableHead>
                              <TableHead className="text-[#7a95b8] text-right">Annual Impact</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {comparisonData.sort((a, b) => (b.yours - b.benchmark) - (a.yours - a.benchmark)).map((item, i) => {
                              const variance = item.yours - item.benchmark;
                              const isPositive = variance > 0;
                              const fee = allFees.find((f) => f.category === item.fullCategory);
                              const annualImpact = fee ? Math.round(totalAssets * Math.abs(variance) / 10000) : 0;
                              
                              return (
                                <TableRow key={i} className="border-[#12233e] hover:bg-[#12233e]/50">
                                  <TableCell className="font-medium text-white">{item.fullCategory}</TableCell>
                                  <TableCell className="text-right text-[#c8d8ec]">{item.yours} bps</TableCell>
                                  <TableCell className="text-right text-[#7a95b8]">{item.benchmark} bps</TableCell>
                                  <TableCell className={`text-right font-medium ${isPositive ? 'text-[#ef4444]' : variance === 0 ? 'text-[#7a95b8]' : 'text-[#22c55e]'}`}>
                                    {isPositive ? '+' : ''}{variance} bps
                                  </TableCell>
                                  <TableCell className={`text-right ${isPositive ? 'text-[#ef4444]' : 'text-[#22c55e]'}`}>
                                    {variance === 0 ? '-' : `${isPositive ? '+' : '-'}${fmt(annualImpact)}`}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* PROJECTION TAB */}
                  <TabsContent value="projection" className="space-y-6 m-0 animate-in fade-in">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                      <div className="lg:col-span-1 space-y-6">
                        <Card className="bg-[#0d1a2e] border-[#12233e]">
                          <CardHeader>
                            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                              <Settings className="w-5 h-5 text-[#8b5cf6]" /> Assumptions
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <Label className="text-[#c8d8ec]">Gross Growth Rate</Label>
                                <span className="text-white font-medium">{growthRate}%</span>
                              </div>
                              <Slider 
                                value={[growthRate]} 
                                min={1} max={15} step={0.1} 
                                onValueChange={(v) => setGrowthRate(v[0])} 
                                className="py-2"
                              />
                            </div>
                            
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <Label className="text-[#c8d8ec]">Inflation Rate</Label>
                                <span className="text-white font-medium">{inflationRate}%</span>
                              </div>
                              <Slider 
                                value={[inflationRate]} 
                                min={0} max={8} step={0.1} 
                                onValueChange={(v) => setInflationRate(v[0])} 
                                className="py-2"
                              />
                            </div>

                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <Label className="text-[#c8d8ec]">Time Horizon</Label>
                                <span className="text-white font-medium">{years} Years</span>
                              </div>
                              <Slider 
                                value={[years]} 
                                min={5} max={40} step={1} 
                                onValueChange={(v) => setYears(v[0])} 
                                className="py-2"
                              />
                            </div>

                            <div className="pt-4 border-t border-[#12233e]">
                              <div className="flex items-center space-x-2">
                                <Switch id="show-advanced" checked={showAdvanced} onCheckedChange={setShowAdvanced} />
                                <Label htmlFor="show-advanced" className="text-[#7a95b8] cursor-pointer">Show advanced metrics</Label>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <div className="p-4 bg-[#f0c040]/10 border border-[#f0c040]/30 rounded-xl flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-[#f0c040] shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-[#f0c040] mb-1">{years}-Year Impact</h4>
                            <p className="text-sm text-[#c8d8ec] leading-relaxed">
                              Estimated cumulative fee drag is <strong className="text-white">{fmt(projectionData[years]?.feeDrag ?? 0)}</strong>.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="lg:col-span-3 space-y-6">
                        <Card className="bg-[#0d1a2e] border-[#12233e]">
                          <CardHeader>
                            <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                              <TrendingUp className="w-5 h-5 text-[#3b82f6]" /> Wealth Trajectory
                            </CardTitle>
                            <CardDescription className="text-[#7a95b8]">Comparison of portfolio growth with and without fees</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="h-[400px] w-full">
                              {/* Recharts 6: AreaChart */}
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={projectionData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                                  <defs>
                                    <linearGradient id="colorWithoutFees" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorWithFees" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                                    </linearGradient>
                                    {compareMode && (
                                      <linearGradient id="colorCompare" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                      </linearGradient>
                                    )}
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                                  <XAxis dataKey="year" tick={{ fill: "#7a95b8", fontSize: 12 }} axisLine={{ stroke: '#12233e' }} tickLine={false} />
                                  <YAxis tickFormatter={(v: number) => `$${(v / 1000000).toFixed(1)}M`} tick={{ fill: "#7a95b8", fontSize: 12 }} axisLine={{ stroke: '#12233e' }} tickLine={false} />
                                  <Tooltip 
                                    formatter={(v: number) => fmt(v)} 
                                    labelFormatter={(label) => `Year ${label}`}
                                    contentStyle={{ background: "#0d1a2e", border: "1px solid #12233e", borderRadius: "8px", color: "#fff" }} 
                                    itemStyle={{ color: "#c8d8ec" }}
                                  />
                                  <Legend wrapperStyle={{ paddingTop: "20px" }} />
                                  <Area type="monotone" dataKey="withoutFees" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorWithoutFees)" name="Gross Returns (No Fees)" />
                                  <Area type="monotone" dataKey="withFees" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorWithFees)" name={`Net Returns (${selectedClient?.name?.split(' ')[0] || 'Client'})`} />
                                  {compareMode && (
                                    <Area type="monotone" dataKey="compareWithFees" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorCompare)" name={`Net Returns (${compareClient?.name?.split(' ')[0] || 'Compare'})`} />
                                  )}
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Data Table 4: Projection Table */}
                        {showAdvanced && (
                          <Card className="bg-[#0d1a2e] border-[#12233e] animate-in slide-in-from-top-4">
                            <CardHeader>
                              <CardTitle className="text-lg font-semibold text-white">Year-by-Year Projection Data</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="overflow-x-auto max-h-[300px]">
                                <Table>
                                  <TableHeader className="border-[#12233e] sticky top-0 bg-[#0d1a2e] z-10">
                                    <TableRow className="border-[#12233e] hover:bg-transparent">
                                      <TableHead className="text-[#7a95b8]">Year</TableHead>
                                      <TableHead className="text-[#7a95b8] text-right">Gross Value</TableHead>
                                      <TableHead className="text-[#7a95b8] text-right">Net Value</TableHead>
                                      <TableHead className="text-[#7a95b8] text-right">Cumulative Fee Drag</TableHead>
                                      <TableHead className="text-[#7a95b8] text-right">% Wealth Lost to Fees</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {projectionData.filter((d) => d.year % 5 === 0 || d.year === years).map((d) => (
                                      <TableRow key={d.year} className="border-[#12233e] hover:bg-[#12233e]/50">
                                        <TableCell className="font-medium text-white">Year {d.year}</TableCell>
                                        <TableCell className="text-right text-[#3b82f6]">{fmt(d.withoutFees)}</TableCell>
                                        <TableCell className="text-right text-[#22c55e]">{fmt(d.withFees)}</TableCell>
                                        <TableCell className="text-right text-[#ef4444]">{fmt(d.feeDrag)}</TableCell>
                                        <TableCell className="text-right text-[#f0c040]">
                                          {d.withoutFees > 0 ? ((d.feeDrag / d.withoutFees) * 100).toFixed(1) : 0}%
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  {/* HISTORICAL TAB */}
                  <TabsContent value="historical" className="space-y-6 m-0 animate-in fade-in">
                    <Card className="bg-[#0d1a2e] border-[#12233e]">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-[#ec4899]" /> Historical Fee Trends
                        </CardTitle>
                        <CardDescription className="text-[#7a95b8]">5-year lookback at fee compression and changes</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[450px] w-full">
                          {/* Recharts 7: ComposedChart */}
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={historicalData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                              <XAxis dataKey="year" tick={{ fill: "#7a95b8", fontSize: 12 }} axisLine={{ stroke: '#12233e' }} tickLine={false} />
                              <YAxis tick={{ fill: "#7a95b8", fontSize: 12 }} axisLine={{ stroke: '#12233e' }} tickLine={false} label={{ value: 'Basis Points (bps)', angle: -90, position: 'insideLeft', fill: '#7a95b8' }} />
                              <Tooltip 
                                contentStyle={{ background: "#0d1a2e", border: "1px solid #12233e", borderRadius: "8px", color: "#fff" }} 
                                itemStyle={{ color: "#c8d8ec" }}
                              />
                              <Legend wrapperStyle={{ paddingTop: "20px" }} />
                              
                              {/* Render lines for top 4 categories */}
                              {allFees.slice(0, 4).map((fee, i) => (
                                <Line key={fee.id} type="monotone" dataKey={fee.category} stroke={COLORS[i]} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                              ))}
                              
                              {/* Total as a bar in the background */}
                              <Bar dataKey="total" fill="#12233e" name="Total All-In Cost" opacity={0.5} barSize={40} yAxisId={0} />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Data Table 5: Historical Data Table */}
                    <Card className="bg-[#0d1a2e] border-[#12233e]">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold text-white">Historical Data (bps)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader className="border-[#12233e]">
                              <TableRow className="border-[#12233e] hover:bg-transparent">
                                <TableHead className="text-[#7a95b8]">Category</TableHead>
                                <TableHead className="text-[#7a95b8] text-right">2020</TableHead>
                                <TableHead className="text-[#7a95b8] text-right">2021</TableHead>
                                <TableHead className="text-[#7a95b8] text-right">2022</TableHead>
                                <TableHead className="text-[#7a95b8] text-right">2023</TableHead>
                                <TableHead className="text-[#7a95b8] text-right">2024</TableHead>
                                <TableHead className="text-[#7a95b8] text-right">5Y Change</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {allFees.map((fee, i) => {
                                const change = fee.historicalTrend[4] - fee.historicalTrend[0];
                                return (
                                  <TableRow key={fee.id} className="border-[#12233e] hover:bg-[#12233e]/50">
                                    <TableCell className="font-medium text-white flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                      {fee.category}
                                    </TableCell>
                                    {fee.historicalTrend.map((val, idx) => (
                                      <TableCell key={idx} className="text-right text-[#c8d8ec]">{val}</TableCell>
                                    ))}
                                    <TableCell className={`text-right font-medium ${change < 0 ? 'text-[#22c55e]' : change > 0 ? 'text-[#ef4444]' : 'text-[#7a95b8]'}`}>
                                      {change > 0 ? '+' : ''}{change} bps
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                              <TableRow className="border-[#12233e] hover:bg-transparent font-bold bg-[#060d19]">
                                <TableCell className="text-white">Total</TableCell>
                                {historicalData.map((data: any, idx) => (
                                  <TableCell key={idx} className="text-right text-white">{data.total}</TableCell>
                                ))}
                                <TableCell className="text-right text-white">
                                  {historicalData[4].total - historicalData[0].total > 0 ? '+' : ''}
                                  {historicalData[4].total - historicalData[0].total} bps
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* REPORT TAB */}
                  <TabsContent value="report" className="m-0 animate-in fade-in">
                    <div className="bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-8 max-w-4xl mx-auto shadow-xl">
                      <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#12233e]">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#12233e] to-[#060d19] flex items-center justify-center border border-[#1e3a5f] shadow-inner">
                            <Shield className="w-8 h-8 text-[#22c55e]" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">Fee Transparency Report</h2>
                            <p className="text-[#7a95b8] mt-1">Prepared for <strong className="text-[#c8d8ec]">{selectedClient.name}</strong></p>
                          </div>
                        </div>
                        <div className="text-right text-sm text-[#7a95b8]">
                          <p>Date: {new Date().toLocaleDateString()}</p>
                          <p>Advisor: {user?.name || "Russell Capital Advisor"}</p>
                          <p>Account ID: ***{String(selectedClient.id).slice(-4) || "1234"}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-8 text-[#c8d8ec]">
                        {/* Exec Summary */}
                        <section className="bg-gradient-to-br from-[#060d19] to-[#0a1424] p-6 rounded-xl border border-[#12233e] shadow-sm">
                          <h3 className="text-lg text-white font-semibold mb-3 flex items-center gap-2">
                            <Calculator className="w-5 h-5 text-[#3b82f6]" /> Executive Summary
                          </h3>
                          <p className="text-sm leading-relaxed mb-4">
                            Based on our comprehensive analysis of your portfolio valued at <strong className="text-white">{fmt(totalAssets)}</strong>, 
                            your total all-in cost is <strong className="text-white">{(totalBps / 100).toFixed(2)}% ({totalBps} basis points)</strong>. 
                            This equates to approximately <strong className="text-white">{fmt(totalFees)} annually</strong>.
                          </p>
                          <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className="bg-[#0d1a2e] p-3 rounded-lg border border-[#12233e]">
                              <div className="text-xs text-[#7a95b8] uppercase mb-1">Industry Average</div>
                              <div className="text-lg font-bold text-white">{(avgBenchmark / 100).toFixed(2)}%</div>
                            </div>
                            <div className="bg-[#0d1a2e] p-3 rounded-lg border border-[#12233e]">
                              <div className="text-xs text-[#7a95b8] uppercase mb-1">Your Variance</div>
                              <div className={`text-lg font-bold ${totalBps < avgBenchmark ? 'text-[#22c55e]' : 'text-[#f0c040]'}`}>
                                {totalBps < avgBenchmark ? '-' : '+'}{Math.abs(avgBenchmark - totalBps)} bps
                              </div>
                            </div>
                          </div>
                        </section>

                        {/* Data Table 6: Clean Report Table */}
                        <section>
                          <h3 className="text-lg text-white font-semibold mb-3 flex items-center gap-2">
                            <PieChartIcon className="w-5 h-5 text-[#f59e0b]" /> Detailed Breakdown
                          </h3>
                          <div className="border border-[#12233e] rounded-xl overflow-hidden">
                            <Table>
                              <TableHeader className="bg-[#060d19]">
                                <TableRow className="border-[#12233e] hover:bg-transparent">
                                  <TableHead className="text-[#7a95b8]">Fee Component</TableHead>
                                  <TableHead className="text-[#7a95b8] text-right">Annual Cost</TableHead>
                                  <TableHead className="text-[#7a95b8] text-right">% of Total</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {allFees.sort((a, b) => b.annualAmount - a.annualAmount).map((fee, i) => (
                                  <TableRow key={fee.id} className="border-[#12233e] hover:bg-transparent">
                                    <TableCell className="font-medium text-white">{fee.category}</TableCell>
                                    <TableCell className="text-right text-[#c8d8ec]">{fmt(fee.annualAmount)}</TableCell>
                                    <TableCell className="text-right text-[#7a95b8]">{((fee.annualAmount / totalFees) * 100).toFixed(1)}%</TableCell>
                                  </TableRow>
                                ))}
                                <TableRow className="border-[#12233e] bg-[#060d19] hover:bg-[#060d19]">
                                  <TableCell className="font-bold text-white">Total Estimated Costs</TableCell>
                                  <TableCell className="text-right font-bold text-[#22c55e]">{fmt(totalFees)}</TableCell>
                                  <TableCell className="text-right font-bold text-white">100.0%</TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </div>
                        </section>

                        <section>
                          <h3 className="text-lg text-white font-semibold mb-3 flex items-center gap-2">
                            <Award className="w-5 h-5 text-[#8b5cf6]" /> Value Proposition
                          </h3>
                          <div className="space-y-4">
                            <p className="text-sm leading-relaxed">
                              While fees are an important consideration, they must be evaluated in the context of the comprehensive services and value provided. 
                              Independent studies consistently show that comprehensive financial planning and professional management can add significant value through:
                            </p>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                              <li className="flex items-start gap-2 bg-[#060d19] p-3 rounded-lg border border-[#12233e]">
                                <CheckCircle2 className="w-4 h-4 text-[#22c55e] shrink-0 mt-0.5" />
                                <span><strong>Behavioral Coaching:</strong> Helping maintain discipline during market volatility (est. 1.5% value).</span>
                              </li>
                              <li className="flex items-start gap-2 bg-[#060d19] p-3 rounded-lg border border-[#12233e]">
                                <CheckCircle2 className="w-4 h-4 text-[#22c55e] shrink-0 mt-0.5" />
                                <span><strong>Tax Optimization:</strong> Asset location and tax-loss harvesting strategies (est. 0.5% - 1.0% value).</span>
                              </li>
                              <li className="flex items-start gap-2 bg-[#060d19] p-3 rounded-lg border border-[#12233e]">
                                <CheckCircle2 className="w-4 h-4 text-[#22c55e] shrink-0 mt-0.5" />
                                <span><strong>Rebalancing:</strong> Systematic portfolio rebalancing to maintain risk targets (est. 0.3% value).</span>
                              </li>
                              <li className="flex items-start gap-2 bg-[#060d19] p-3 rounded-lg border border-[#12233e]">
                                <CheckCircle2 className="w-4 h-4 text-[#22c55e] shrink-0 mt-0.5" />
                                <span><strong>Planning:</strong> Comprehensive estate and retirement planning coordination.</span>
                              </li>
                            </ul>
                          </div>
                        </section>
                        
                        <div className="pt-8 mt-8 border-t border-[#12233e]">
                          <div className="flex items-start gap-3 text-xs text-[#7a95b8]">
                            <Info className="w-4 h-4 shrink-0 mt-0.5" />
                            <p className="leading-relaxed">
                              <strong>Disclosure:</strong> Report generated by Russell Capital Systems™. Fee estimates are based on current account values and assumptions which may vary over time. Actual fees deducted may differ from these estimates. This report is for informational purposes only and does not replace official custodial statements or advisory agreements. Past performance is not indicative of future results.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </div>
      </div>
      <PageInsights pageId="fee-transparency" />
    </AppShell>
  );
}
