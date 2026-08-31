// @ts-nocheck
import { useState, useMemo, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Users,
  Scale,
  Download,
  RefreshCw,
  BarChart3,
  AlertCircle,
  Info,
  Loader2,
  TrendingUp,
  PieChartIcon,
  Activity,
  FileText,
  Briefcase,
  DollarSign,
  ChevronDown,
  Settings,
  Printer,
  Search,
  Plus,
  X,
  Target,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ComposedChart, Scatter, ScatterChart, ZAxis } from "recharts";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

const fmt = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : n >= 1_000 ? `$${(n / 1_000).toFixed(0)}K` : `$${n.toFixed(0)}`;
const fmtPct = (n: number) => `${n.toFixed(1)}%`;

const COLORS = ["#22c55e", "#3b82f6", "#f0c040", "#ef4444", "#a855f7", "#ec4899", "#14b8a6", "#f97316"];
const PIE_COLORS = ["#3b82f6", "#8b5cf6", "#22c55e", "#f0c040", "#ef4444", "#06b6d4", "#f43f5e", "#84cc16"];

function ComparisonMetric({ label, values, format = "currency", description, highlightMax = false, highlightMin = false }: { label: string; values: (number | string)[]; format?: "currency" | "number" | "text" | "percentage"; description?: string; highlightMax?: boolean; highlightMin?: boolean }) {
  const numericValues = values.filter((v) => typeof v === 'number') as number[];
  const maxVal = numericValues.length > 0 ? Math.max(...numericValues) : null;
  const minVal = numericValues.length > 0 ? Math.min(...numericValues) : null;

  return (
    <tr className="border-b border-[#12233e] hover:bg-[#12233e]/30 transition-colors">
      <td className="py-4 px-4 text-sm text-[#7a95b8] font-medium">
        <div className="flex items-center gap-2">
          {label}
          {description && (
            <div className="group relative">
              <Info className="w-4 h-4 text-[#4a6a8e] cursor-help" />
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-[#060d19] border border-[#1a3055] rounded-lg text-xs text-[#c8d8ec] z-10 shadow-xl">
                {description}
              </div>
            </div>
          )}
        </div>
      </td>
      {values.map((v, i) => {
        const isMax = typeof v === 'number' && v === maxVal && highlightMax && maxVal !== minVal;
        const isMin = typeof v === 'number' && v === minVal && highlightMin && maxVal !== minVal;
        
        return (
          <td key={i} className={`py-4 px-4 text-sm text-right font-semibold ${isMax ? 'text-green-400' : isMin ? 'text-red-400' : 'text-white'}`}>
            {format === "currency" && typeof v === "number" ? fmt(v) : format === "number" && typeof v === "number" ? v.toLocaleString() : format === "percentage" && typeof v === "number" ? `${v.toFixed(1)}%` : String(v)}
            {isMax && <TrendingUp className="w-3 h-3 inline ml-1 text-green-400" />}
          </td>
        );
      })}
    </tr>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0b1628] border border-[#1a3055] p-3 rounded-lg shadow-xl">
        <p className="text-white font-medium mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 mb-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-[#c8d8ec] text-sm">{entry.name}:</span>
            </div>
            <span className="text-white font-semibold text-sm">
              {entry.name.includes('Rate') || entry.name.includes('Percent') || entry.name.includes('Yield') 
                ? `${Number(entry.value).toFixed(2)}%` 
                : typeof entry.value === 'number' && entry.value > 1000 ? fmt(entry.value) : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function ClientComparison() {
  const { user } = useAuth();
  
  const { data: clients, isError, refetch } = trpc.clients.list.useQuery();
  const { data: marketData } = trpc.marketData.getLatest.useQuery();
  const { data: modelPortfolios } = trpc.strategy.listModels.useQuery();
  const { data: riskProfiles } = trpc.riskProfile.list.useQuery();
  const { data: recommendations } = trpc.recommendations.list.useQuery();
  const { data: goals } = trpc.goals.list.useQuery();
  const { data: activities } = trpc.activity.list.useQuery();
  const { data: notes } = trpc.notes.list.useQuery({ clientId: 0 });

  const [selectedIds, setSelectedIds] = useState<string[]>(["", "", ""]);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [comparisonMode, setComparisonMode] = useState<"absolute" | "relative">("absolute");
  const [showProjections, setShowProjections] = useState(false);
  const [projectionYears, setProjectionYears] = useState(10);
  const [assumedReturn, setAssumedReturn] = useState(6.5);
  const [inflationRate, setInflationRate] = useState(2.5);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    assets: true,
    liabilities: true,
    income: true,
    insurance: true,
    risk: true,
    goals: true
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const selectedClients = useMemo(() => {
    if (!clients) return [];
    return selectedIds
      .filter((id) => id)
      .map((id) => clients.find((c) => String(c.id) === id))
      .filter(Boolean) as any[];
  }, [clients, selectedIds]);

  const handleSelect = (index: number, value: string) => {
    const next = [...selectedIds];
    next[index] = value;
    setSelectedIds(next);
  };

  const handleClear = () => {
    setSelectedIds(["", "", ""]);
    toast.success("Comparison cleared");
  };
  
  const handleAddSlot = () => {
    if (selectedIds.length < 5) {
      setSelectedIds([...selectedIds, ""]);
    } else {
      toast.error("Maximum 5 clients can be compared at once");
    }
  };
  
  const handleRemoveSlot = (index: number) => {
    if (selectedIds.length > 2) {
      const next = [...selectedIds];
      next.splice(index, 1);
      setSelectedIds(next);
    } else {
      toast.error("Minimum 2 slots required for comparison");
    }
  };

  const handleExportCSV = () => {
    if (selectedClients.length === 0) {
      toast.error("Please select at least one client to export");
      return;
    }
    
    setIsExporting(true);
    try {
      const headers = ["Metric", ...selectedClients.map((c) => c.name || "Unknown")];
      const rows = [
        ["Age", ...selectedClients.map((c) => c.age || "N/A")],
        ["Annual Income", ...selectedClients.map((c) => c.income || 0)],
        ["IRA Balance", ...selectedClients.map((c) => c.iraBalance || 0)],
        ["Roth Balance", ...selectedClients.map((c) => c.rothBalance || 0)],
        ["Taxable Assets", ...selectedClients.map((c) => c.taxableAssets || 0)],
        ["Real Estate Equity", ...selectedClients.map((c) => c.realEstateEquity || 0)],
        ["Total Net Worth", ...selectedClients.map((c) => 
          Number(c.iraBalance || 0) + Number(c.rothBalance || 0) + Number(c.taxableAssets || 0) + Number(c.realEstateEquity || 0)
        )],
        ["Filing Status", ...selectedClients.map((c) => c.filingStatus || "N/A")],
        ["Annual Premium", ...selectedClients.map((c) => c.annualPremium || 0)],
      ];

      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "client_comparison_advanced.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Exported comparison to CSV");
    } catch (error) {
      toast.error("Failed to export CSV");
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const radarData = useMemo(() => {
    if (selectedClients.length === 0) return [];
    const metrics = [
      { key: "Income", accessor: (c: any) => Math.min(100, (Number(c.income ?? 0) / 500000) * 100) },
      { key: "Liquidity", accessor: (c: any) => Math.min(100, (Number(c.taxableAssets ?? 0) / 1000000) * 100) },
      { key: "Retirement", accessor: (c: any) => Math.min(100, ((Number(c.iraBalance ?? 0) + Number(c.rothBalance ?? 0)) / 3000000) * 100) },
      { key: "Real Estate", accessor: (c: any) => Math.min(100, (Number(c.realEstateEquity ?? 0) / 2000000) * 100) },
      { key: "Protection", accessor: (c: any) => Math.min(100, (Number(c.annualPremium ?? 0) / 50000) * 100) },
      { key: "Risk Tolerance", accessor: (c: any) => Math.min(100, (Number(c.riskScore ?? 50) / 100) * 100) },
    ];
    return metrics.map((m) => {
      const row: any = { metric: m.key };
      selectedClients.forEach((c, i) => {
        row[c.name ?? `Client ${i + 1}`] = Math.round(m.accessor(c));
      });
      return row;
    });
  }, [selectedClients]);

  const barData = useMemo(() => {
    return selectedClients.map((c) => ({
      name: (c.name ?? "Unknown").split(" ")[0],
      "Net Worth": Number(c.iraBalance ?? 0) + Number(c.rothBalance ?? 0) + Number(c.taxableAssets ?? 0) + Number(c.realEstateEquity ?? 0),
      Income: Number(c.income ?? 0),
      Liabilities: Number(c.mortgageBalance ?? 0) + Number(c.otherDebt ?? 0),
    }));
  }, [selectedClients]);

  const assetAllocationData = useMemo(() => {
    if (selectedClients.length === 0) return [];
    
    return selectedClients.map((c) => {
      const total = Number(c.iraBalance || 0) + Number(c.rothBalance || 0) + Number(c.taxableAssets || 0) + Number(c.realEstateEquity || 0);
      if (total === 0) return { name: c.name || "Unknown", IRA: 0, Roth: 0, Taxable: 0, RealEstate: 0 };
      
      return {
        name: (c.name || "Unknown").split(" ")[0],
        IRA: comparisonMode === "relative" ? (Number(c.iraBalance || 0) / total) * 100 : Number(c.iraBalance || 0),
        Roth: comparisonMode === "relative" ? (Number(c.rothBalance || 0) / total) * 100 : Number(c.rothBalance || 0),
        Taxable: comparisonMode === "relative" ? (Number(c.taxableAssets || 0) / total) * 100 : Number(c.taxableAssets || 0),
        RealEstate: comparisonMode === "relative" ? (Number(c.realEstateEquity || 0) / total) * 100 : Number(c.realEstateEquity || 0),
      };
    });
  }, [selectedClients, comparisonMode]);

  const projectionData = useMemo(() => {
    if (selectedClients.length === 0 || !showProjections) return [];
    
    const data = [];
    const currentYear = new Date().getFullYear();
    
    for (let year = 0; year <= projectionYears; year++) {
      const dataPoint: any = { year: currentYear + year };
      
      selectedClients.forEach((c, i) => {
        const initialNW = Number(c.iraBalance ?? 0) + Number(c.rothBalance ?? 0) + Number(c.taxableAssets ?? 0) + Number(c.realEstateEquity ?? 0);
        const annualSavings = Number(c.income ?? 0) * 0.15; // Assume 15% savings rate
        
        const r = (assumedReturn - inflationRate) / 100;
        const projectedNW = initialNW * Math.pow(1 + r, year) + annualSavings * ((Math.pow(1 + r, year) - 1) / r);
        
        dataPoint[c.name ?? `Client ${i + 1}`] = Math.max(0, projectedNW);
      });
      
      data.push(dataPoint);
    }
    
    return data;
  }, [selectedClients, showProjections, projectionYears, assumedReturn, inflationRate]);

  const taxEfficiencyData = useMemo(() => {
    return selectedClients.map((c) => {
      const totalAssets = Number(c.iraBalance ?? 0) + Number(c.rothBalance ?? 0) + Number(c.taxableAssets ?? 0);
      if (totalAssets === 0) return { name: (c.name ?? "Unknown").split(" ")[0], "Tax-Free": 0, "Tax-Deferred": 0, "Taxable": 0 };
      
      return {
        name: (c.name ?? "Unknown").split(" ")[0],
        "Tax-Free": (Number(c.rothBalance ?? 0) / totalAssets) * 100,
        "Tax-Deferred": (Number(c.iraBalance ?? 0) / totalAssets) * 100,
        "Taxable": (Number(c.taxableAssets ?? 0) / totalAssets) * 100,
      };
    });
  }, [selectedClients]);

  const riskVsReturnData = useMemo(() => {
    return selectedClients.map((c, i) => {
      const riskScore = Number(c.riskScore ?? 50 + (i * 10));
      const expectedReturn = 3 + (riskScore / 100) * 7;
      const netWorth = Number(c.iraBalance ?? 0) + Number(c.rothBalance ?? 0) + Number(c.taxableAssets ?? 0) + Number(c.realEstateEquity ?? 0);
      
      return {
        name: c.name ?? `Client ${i + 1}`,
        risk: riskScore,
        return: expectedReturn,
        size: Math.max(100, netWorth / 10000), // Bubble size based on net worth
        fill: COLORS[i % COLORS.length]
      };
    });
  }, [selectedClients]);

  const getTotals = (client: any) => {
    const liquidAssets = Number(client?.taxableAssets ?? 0) + Number(client?.rothBalance ?? 0);
    const illiquidAssets = Number(client?.iraBalance ?? 0) + Number(client?.realEstateEquity ?? 0);
    const totalAssets = liquidAssets + illiquidAssets;
    const totalLiabilities = Number(client?.mortgageBalance ?? 0) + Number(client?.otherDebt ?? 0);
    const netWorth = totalAssets - totalLiabilities;
    const income = Number(client?.income ?? 0);
    const debtToIncome = income > 0 ? totalLiabilities / income : 0;
    const liquidityRatio = liquidAssets > 0 ? liquidAssets / (income / 12) : 0; // Months of expenses (assuming income = expenses for simplicity)
    
    return {
      liquidAssets,
      illiquidAssets,
      totalAssets,
      totalLiabilities,
      netWorth,
      debtToIncome,
      liquidityRatio
    };
  };

  return (
    <AppShell>
      <div className="p-6 max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <div className="rc-page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#3b82f6]/10 border border-[#3b82f6]/20 flex items-center justify-center shadow-lg shadow-[#3b82f6]/5">
              <Scale className="w-6 h-6 text-[#3b82f6]" />
            </div>
            <div>
              <h1 className="rc-page-title text-2xl font-bold text-white tracking-tight">Advanced Client Comparison</h1>
              <p className="rc-page-subtitle text-[#7a95b8] mt-1">Multi-dimensional analysis of financial profiles</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={selectedClients.length === 0}
              className="bg-transparent border-[#1a3055] text-[#7a95b8] hover:text-white hover:bg-[#12233e]"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Clear All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              disabled={selectedClients.length === 0}
              className="bg-transparent border-[#1a3055] text-[#7a95b8] hover:text-white hover:bg-[#12233e]"
            >
              <Printer className="w-4 h-4 mr-2" />
              Print Report
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={selectedClients.length === 0 || isExporting}
              className="bg-[#12233e] border-[#1a3055] text-white hover:bg-[#1a3055]"
            >
              {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Export CSV
            </Button>
            <ExportToSlides
              toolName="Client Comparison"
              getSections={() => {
                if (selectedClients.length === 0) {
                  return [{ title: "Client Comparison", items: [{ label: "Status", value: "No clients selected" }] }];
                }
                
                return selectedClients.map((c, i) => {
                  const totals = getTotals(c);
                  return {
                    title: c.name ?? `Client ${i + 1}`,
                    items: [
                      { label: "Age", value: String(c.age ?? "N/A") },
                      { label: "Annual Income", value: `$${Number(c.income ?? 0).toLocaleString()}` },
                      { label: "Liquid Assets", value: `$${totals.liquidAssets.toLocaleString()}` },
                      { label: "Total Assets", value: `$${totals.totalAssets.toLocaleString()}` },
                      { label: "Total Liabilities", value: `$${totals.totalLiabilities.toLocaleString()}` },
                      { label: "Net Worth", value: `$${totals.netWorth.toLocaleString()}` },
                      { label: "Debt-to-Income", value: `${(totals.debtToIncome * 100).toFixed(1)}%` },
                      { label: "Filing Status", value: String(c.filingStatus ?? "N/A") },
                    ]
                  };
                });
              }}
            />
          </div>
        </div>

        {/* Error State */}
        {isError && (
          <div className="rc-card border-red-900/50 bg-red-900/10 p-6 flex flex-col items-center justify-center text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Failed to load client database</h3>
            <p className="text-[#7a95b8] mb-4">There was an error connecting to the database. Please check your connection and try again.</p>
            <Button onClick={() => refetch()} className="bg-red-600 hover:bg-red-700 text-white">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Connection
            </Button>
          </div>
        )}

        {/* Main Content */}
        {!isError && (
          <div className="space-y-6">
            {/* Control Panel */}
            <div className="rc-card p-4 bg-[#060d19]/80 backdrop-blur-sm border-[#1a3055] flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 z-20 shadow-xl">
              <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                <div className="flex items-center gap-2 text-sm text-[#7a95b8] whitespace-nowrap">
                  <Settings className="w-4 h-4" />
                  <span className="font-medium">Controls:</span>
                </div>
                
                <div className="flex items-center gap-2 bg-[#12233e] p-1 rounded-lg">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setViewMode("table")}
                    className={`h-8 px-3 ${viewMode === "table" ? "bg-[#3b82f6] text-white" : "text-[#7a95b8] hover:text-white"}`}
                  >
                    <FileText className="w-4 h-4 mr-1.5" />
                    Table View
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setViewMode("cards")}
                    className={`h-8 px-3 ${viewMode === "cards" ? "bg-[#3b82f6] text-white" : "text-[#7a95b8] hover:text-white"}`}
                  >
                    <Briefcase className="w-4 h-4 mr-1.5" />
                    Card View
                  </Button>
                </div>

                <div className="h-6 w-px bg-[#1a3055] mx-2 hidden md:block"></div>

                <div className="flex items-center gap-2 bg-[#12233e] p-1 rounded-lg">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setComparisonMode("absolute")}
                    className={`h-8 px-3 ${comparisonMode === "absolute" ? "bg-[#8b5cf6] text-white" : "text-[#7a95b8] hover:text-white"}`}
                  >
                    <DollarSign className="w-4 h-4 mr-1.5" />
                    Absolute ($)
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setComparisonMode("relative")}
                    className={`h-8 px-3 ${comparisonMode === "relative" ? "bg-[#8b5cf6] text-white" : "text-[#7a95b8] hover:text-white"}`}
                  >
                    <PieChartIcon className="w-4 h-4 mr-1.5" />
                    Relative (%)
                  </Button>
                </div>
                
                <div className="h-6 w-px bg-[#1a3055] mx-2 hidden md:block"></div>
                
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={showAdvancedMetrics} 
                    onCheckedChange={setShowAdvancedMetrics} 
                    id="advanced-metrics"
                  />
                  <label htmlFor="advanced-metrics" className="text-sm text-[#c8d8ec] cursor-pointer whitespace-nowrap">
                    Advanced Metrics
                  </label>
                </div>
              </div>
              
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#4a6a8e]" />
                  <Input 
                    placeholder="Search metrics..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 bg-[#0b1628] border-[#1a3055] text-white h-9 text-sm focus-visible:ring-[#3b82f6]"
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleAddSlot}
                  disabled={selectedIds.length >= 5}
                  className="h-9 w-9 bg-[#12233e] border-[#1a3055] text-white hover:bg-[#1a3055] shrink-0"
                  title="Add Comparison Slot"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Client selectors */}
            <div className={`grid gap-4 ${
              selectedIds.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 
              selectedIds.length === 3 ? 'grid-cols-1 md:grid-cols-3' : 
              selectedIds.length === 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' : 
              'grid-cols-1 md:grid-cols-3 lg:grid-cols-5'
            }`}>
              {selectedIds.map((selectedId, i) => (
                <div key={i} className={`rc-card relative overflow-hidden group transition-all duration-300 ${selectedClients[i] ? 'border-[#1a3055]' : 'border-dashed border-[#1a3055] bg-[#060d19]/30'}`}>
                  {selectedClients[i] && (
                    <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  )}
                  
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-xs text-[#7a95b8] font-medium uppercase tracking-wider flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedClients[i] ? COLORS[i % COLORS.length] : '#4a6a8e' }} />
                        Client {i + 1} {i < 2 ? <span className="text-red-400">*</span> : null}
                      </label>
                      
                      {i >= 2 && (
                        <button 
                          onClick={() => handleRemoveSlot(i)}
                          className="text-[#4a6a8e] hover:text-red-400 transition-colors p-1 rounded-md hover:bg-red-400/10"
                          title="Remove Slot"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    
                    <Select value={selectedId} onValueChange={(v) => handleSelect(i, v)}>
                      <SelectTrigger className="w-full bg-[#0b1628] border-[#1a3055] hover:border-[#3b82f6]/50 transition-colors h-11">
                        <SelectValue placeholder="Select client..." />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0d1a2e] border-[#1a3055] text-white max-h-[300px]">
                        {(clients ?? []).map((c) => {
                          const isSelected = selectedIds.includes(String(c.id)) && selectedId !== String(c.id);
                          return (
                            <SelectItem 
                              key={c.id} 
                              value={String(c.id)} 
                              disabled={isSelected}
                              className={`hover:bg-[#1a3055] focus:bg-[#1a3055] cursor-pointer ${isSelected ? 'opacity-50' : ''}`}
                            >
                              <div className="flex items-center justify-between w-full gap-4">
                                <span className="font-medium">{c.name ?? "Unknown"}</span>
                                <span className="text-xs text-[#7a95b8] bg-[#060d19] px-2 py-0.5 rounded">
                                  {c.iraBalance ? `$${(Number(c.iraBalance)/1000).toFixed(0)}k` : ''}
                                </span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    
                    {/* Selected Client Summary Mini-Card */}
                    <div className={`mt-4 pt-4 border-t border-[#1a3055] transition-all duration-500 ${selectedClients[i] ? 'opacity-100 max-h-[200px]' : 'opacity-0 max-h-0 overflow-hidden pt-0 mt-0 border-t-0'}`}>
                      {selectedClients[i] && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-[#7a95b8]">Net Worth</span>
                            <span className="text-sm font-bold text-white">
                              {fmt(getTotals(selectedClients[i]).netWorth)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-[#7a95b8]">Income</span>
                            <span className="text-sm font-semibold text-[#c8d8ec]">
                              {fmt(Number(selectedClients[i].income || 0))}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-[#7a95b8]">Risk Score</span>
                            <Badge variant="outline" className="bg-[#12233e] text-[#c8d8ec] border-[#1a3055] text-[10px] px-1.5 py-0">
                              {selectedClients[i].riskScore || 50}/100
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedClients.length > 0 ? (
              <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                <TabsList className="bg-[#0b1628] border border-[#1a3055] p-1 h-auto w-full flex flex-wrap justify-start gap-1 rounded-xl">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-[#3b82f6] data-[state=active]:text-white text-[#7a95b8] px-4 py-2 rounded-lg transition-all">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="assets" className="data-[state=active]:bg-[#3b82f6] data-[state=active]:text-white text-[#7a95b8] px-4 py-2 rounded-lg transition-all">
                    <PieChartIcon className="w-4 h-4 mr-2" />
                    Assets & Allocation
                  </TabsTrigger>
                  <TabsTrigger value="projections" className="data-[state=active]:bg-[#3b82f6] data-[state=active]:text-white text-[#7a95b8] px-4 py-2 rounded-lg transition-all">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Projections
                  </TabsTrigger>
                  <TabsTrigger value="risk" className="data-[state=active]:bg-[#3b82f6] data-[state=active]:text-white text-[#7a95b8] px-4 py-2 rounded-lg transition-all">
                    <Target className="w-4 h-4 mr-2" />
                    Risk & Return
                  </TabsTrigger>
                  <TabsTrigger value="details" className="data-[state=active]:bg-[#3b82f6] data-[state=active]:text-white text-[#7a95b8] px-4 py-2 rounded-lg transition-all">
                    <FileText className="w-4 h-4 mr-2" />
                    Detailed Table
                  </TabsTrigger>
                </TabsList>

                <div className="mt-6">
                  <TabsContent value="overview" className="space-y-6 mt-0 outline-none">
                    {/* Key Metrics Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card className="bg-[#0b1628] border-[#1a3055]">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-[#7a95b8] flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-[#22c55e]" />
                            Average Net Worth
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-white">
                            {fmt(selectedClients.reduce((acc, c) => acc + getTotals(c).netWorth, 0) / selectedClients.length)}
                          </div>
                          <p className="text-xs text-[#4a6a8e] mt-1">Across {selectedClients.length} selected clients</p>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-[#0b1628] border-[#1a3055]">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-[#7a95b8] flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-[#3b82f6]" />
                            Total Assets Under Management
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-white">
                            {fmt(selectedClients.reduce((acc, c) => acc + getTotals(c).totalAssets, 0))}
                          </div>
                          <p className="text-xs text-[#4a6a8e] mt-1">Combined total assets</p>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-[#0b1628] border-[#1a3055]">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-[#7a95b8] flex items-center gap-2">
                            <Activity className="w-4 h-4 text-[#f0c040]" />
                            Avg Risk Score
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-white">
                            {(selectedClients.reduce((acc, c) => acc + Number(c.riskScore || 50), 0) / selectedClients.length).toFixed(1)}
                          </div>
                          <p className="text-xs text-[#4a6a8e] mt-1">Scale of 1-100</p>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-[#0b1628] border-[#1a3055]">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-[#7a95b8] flex items-center gap-2">
                            <PieChartIcon className="w-4 h-4 text-[#8b5cf6]" />
                            Avg Liquidity Ratio
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-white">
                            {(selectedClients.reduce((acc, c) => acc + getTotals(c).liquidityRatio, 0) / selectedClients.length).toFixed(1)}x
                          </div>
                          <p className="text-xs text-[#4a6a8e] mt-1">Months of income in liquid assets</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Charts Grid 1 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Chart 1: Bar chart */}
                      <div className="rc-card p-6 flex flex-col h-[400px]">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-[#22c55e]" />
                            Wealth & Income Overview
                          </h3>
                        </div>
                        <div className="flex-1 min-h-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1a3055" vertical={false} />
                              <XAxis dataKey="name" tick={{ fill: "#7a95b8", fontSize: 12 }} axisLine={{ stroke: '#1a3055' }} tickLine={false} dy={10} />
                              <YAxis 
                                tick={{ fill: "#7a95b8", fontSize: 11 }} 
                                axisLine={false} 
                                tickLine={false}
                                tickFormatter={(v) => v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : `$${(v / 1e3).toFixed(0)}K`} 
                                dx={-10}
                              />
                              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#12233e', opacity: 0.4 }} />
                              <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="circle" />
                              <Bar dataKey="Net Worth" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={60} />
                              <Bar dataKey="Income" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={60} />
                              {showAdvancedMetrics && (
                                <Bar dataKey="Liabilities" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={60} />
                              )}
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Chart 2: Radar chart */}
                      <div className="rc-card p-6 flex flex-col h-[400px]">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Scale className="w-5 h-5 text-[#f0c040]" />
                            Financial Profile Footprint
                          </h3>
                        </div>
                        <p className="text-xs text-[#7a95b8] mb-4">Relative scoring across key financial dimensions (0-100 scale)</p>
                        <div className="flex-1 min-h-0 relative">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={radarData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                              <PolarGrid stroke="#1a3055" />
                              <PolarAngleAxis dataKey="metric" tick={{ fill: "#c8d8ec", fontSize: 11, fontWeight: 500 }} />
                              <PolarRadiusAxis tick={false} domain={[0, 100]} axisLine={false} />
                              <Tooltip content={<CustomTooltip />} />
                              {selectedClients.map((c, i) => (
                                <Radar
                                  key={c.id || i}
                                  name={c.name ?? `Client ${i + 1}`}
                                  dataKey={c.name ?? `Client ${i + 1}`}
                                  stroke={COLORS[i % COLORS.length]}
                                  strokeWidth={2}
                                  fill={COLORS[i % COLORS.length]}
                                  fillOpacity={0.2}
                                />
                              ))}
                              <Legend wrapperStyle={{ fontSize: "12px", color: "#7a95b8", paddingTop: "10px" }} iconType="circle" />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="assets" className="space-y-6 mt-0 outline-none">
                    {/* Chart 3: Asset Allocation Stacked Bar */}
                    <div className="rc-card p-6 flex flex-col h-[400px]">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          <PieChartIcon className="w-5 h-5 text-[#8b5cf6]" />
                          Asset Allocation Breakdown
                        </h3>
                        <Badge variant="outline" className="bg-[#12233e] border-[#1a3055] text-[#c8d8ec]">
                          {comparisonMode === "absolute" ? "Absolute Values ($)" : "Relative Percentages (%)"}
                        </Badge>
                      </div>
                      <p className="text-xs text-[#7a95b8] mb-6">Distribution of total net worth across asset classes</p>
                      <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={assetAllocationData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1a3055" horizontal={false} />
                            <XAxis 
                              type="number" 
                              tick={{ fill: "#7a95b8", fontSize: 11 }} 
                              axisLine={{ stroke: '#1a3055' }} 
                              tickFormatter={(v) => comparisonMode === "relative" ? `${v}%` : v >= 1e6 ? `$${(v/1e6).toFixed(1)}M` : `$${(v/1e3).toFixed(0)}K`} 
                              domain={comparisonMode === "relative" ? [0, 100] : ['auto', 'auto']} 
                            />
                            <YAxis dataKey="name" type="category" tick={{ fill: "#c8d8ec", fontSize: 12 }} axisLine={{ stroke: '#1a3055' }} tickLine={false} />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#12233e', opacity: 0.4 }} />
                            <Legend wrapperStyle={{ paddingTop: "10px" }} iconType="circle" />
                            <Bar dataKey="IRA" stackId="a" fill="#3b82f6" name="IRA (Tax-Deferred)" />
                            <Bar dataKey="Roth" stackId="a" fill="#8b5cf6" name="Roth (Tax-Free)" />
                            <Bar dataKey="Taxable" stackId="a" fill="#22c55e" name="Taxable Accounts" />
                            <Bar dataKey="RealEstate" stackId="a" fill="#f0c040" name="Real Estate Equity" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Chart 4: Tax Efficiency Breakdown */}
                    <div className="rc-card p-6 flex flex-col h-[400px]">
                      <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#06b6d4]" />
                        Tax Efficiency Profiling
                      </h3>
                      <p className="text-xs text-[#7a95b8] mb-6">Percentage of investable assets by tax treatment</p>
                      <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={taxEfficiencyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1a3055" vertical={false} />
                            <XAxis dataKey="name" tick={{ fill: "#7a95b8", fontSize: 12 }} axisLine={{ stroke: '#1a3055' }} tickLine={false} dy={10} />
                            <YAxis 
                              tick={{ fill: "#7a95b8", fontSize: 11 }} 
                              axisLine={false} 
                              tickLine={false}
                              tickFormatter={(v) => `${v}%`} 
                              domain={[0, 100]}
                              dx={-10}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#12233e', opacity: 0.4 }} />
                            <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="circle" />
                            <Bar dataKey="Tax-Free" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={60} />
                            <Bar dataKey="Tax-Deferred" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={60} />
                            <Bar dataKey="Taxable" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={60} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="projections" className="space-y-6 mt-0 outline-none">
                    <div className="rc-card p-6 bg-[#0b1628] border-[#1a3055]">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-[#ec4899]" />
                            Net Worth Growth Projections
                          </h3>
                          <p className="text-sm text-[#7a95b8] mt-1">Estimated future wealth based on current assets and assumptions</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={showProjections} 
                            onCheckedChange={setShowProjections} 
                            id="enable-projections"
                          />
                          <label htmlFor="enable-projections" className="text-sm font-medium text-white cursor-pointer">
                            Enable Projections
                          </label>
                        </div>
                      </div>

                      {showProjections ? (
                        <div className="space-y-6">
                          {/* Projection Controls */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-[#060d19] rounded-xl border border-[#1a3055]">
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <label className="text-sm text-[#c8d8ec]">Time Horizon (Years)</label>
                                <span className="text-sm font-bold text-white">{projectionYears}</span>
                              </div>
                              <Slider 
                                value={[projectionYears]} 
                                onValueChange={(v) => setProjectionYears(v[0])} 
                                max={30} 
                                min={5} 
                                step={1}
                                className="py-2"
                              />
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <label className="text-sm text-[#c8d8ec]">Assumed Return (%)</label>
                                <span className="text-sm font-bold text-white">{assumedReturn.toFixed(1)}%</span>
                              </div>
                              <Slider 
                                value={[assumedReturn]} 
                                onValueChange={(v) => setAssumedReturn(v[0])} 
                                max={12} 
                                min={2} 
                                step={0.5}
                                className="py-2"
                              />
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <label className="text-sm text-[#c8d8ec]">Inflation Rate (%)</label>
                                <span className="text-sm font-bold text-white">{inflationRate.toFixed(1)}%</span>
                              </div>
                              <Slider 
                                value={[inflationRate]} 
                                onValueChange={(v) => setInflationRate(v[0])} 
                                max={8} 
                                min={0} 
                                step={0.5}
                                className="py-2"
                              />
                            </div>
                          </div>

                          {/* Chart 5: Area Chart for Projections */}
                          <div className="h-[400px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                                <defs>
                                  {selectedClients.map((c, i) => (
                                    <linearGradient key={c.id || i} id={`color${i}`} x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0}/>
                                    </linearGradient>
                                  ))}
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1a3055" vertical={false} />
                                <XAxis dataKey="year" tick={{ fill: "#7a95b8", fontSize: 12 }} axisLine={{ stroke: '#1a3055' }} tickLine={false} dy={10} />
                                <YAxis 
                                  tick={{ fill: "#7a95b8", fontSize: 11 }} 
                                  axisLine={false} 
                                  tickLine={false}
                                  tickFormatter={(v) => v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : `$${(v / 1e3).toFixed(0)}K`} 
                                  dx={-10}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="circle" />
                                {selectedClients.map((c, i) => (
                                  <Area 
                                    key={c.id || i}
                                    type="monotone" 
                                    dataKey={c.name ?? `Client ${i + 1}`} 
                                    stroke={COLORS[i % COLORS.length]} 
                                    strokeWidth={3}
                                    fillOpacity={1} 
                                    fill={`url(#color${i})`} 
                                  />
                                ))}
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      ) : (
                        <div className="h-[300px] flex flex-col items-center justify-center border-2 border-dashed border-[#1a3055] rounded-xl bg-[#060d19]/50">
                          <TrendingUp className="w-12 h-12 text-[#4a6a8e] mb-4" />
                          <h4 className="text-lg font-medium text-white mb-2">Projections Disabled</h4>
                          <p className="text-[#7a95b8] text-center max-w-md mb-6">
                            Enable projections to see estimated wealth growth based on customizable assumptions for returns and inflation.
                          </p>
                          <Button onClick={() => setShowProjections(true)} className="bg-[#3b82f6] hover:bg-[#2563eb] text-white">
                            Enable Projections
                          </Button>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="risk" className="space-y-6 mt-0 outline-none">
                    {/* Chart 6: Scatter Plot for Risk vs Return */}
                    <div className="rc-card p-6 flex flex-col h-[500px]">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          <Target className="w-5 h-5 text-[#f97316]" />
                          Risk vs. Expected Return Profile
                        </h3>
                      </div>
                      <p className="text-xs text-[#7a95b8] mb-6">Bubble size represents total net worth. Position indicates risk tolerance vs expected return.</p>
                      <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1a3055" />
                            <XAxis 
                              type="number" 
                              dataKey="risk" 
                              name="Risk Score" 
                              tick={{ fill: "#7a95b8", fontSize: 12 }} 
                              axisLine={{ stroke: '#1a3055' }}
                              domain={[0, 100]}
                              label={{ value: 'Risk Tolerance Score (0-100)', position: 'insideBottom', offset: -10, fill: '#7a95b8', fontSize: 12 }}
                            />
                            <YAxis 
                              type="number" 
                              dataKey="return" 
                              name="Expected Return" 
                              tick={{ fill: "#7a95b8", fontSize: 12 }} 
                              axisLine={{ stroke: '#1a3055' }}
                              tickFormatter={(v) => `${v}%`}
                              domain={[0, 12]}
                              label={{ value: 'Expected Annual Return (%)', angle: -90, position: 'insideLeft', fill: '#7a95b8', fontSize: 12 }}
                            />
                            <ZAxis type="number" dataKey="size" range={[100, 1000]} name="Net Worth Scale" />
                            <Tooltip 
                              cursor={{ strokeDasharray: '3 3' }}
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className="bg-[#0b1628] border border-[#1a3055] p-3 rounded-lg shadow-xl">
                                      <p className="text-white font-bold mb-2">{data.name}</p>
                                      <div className="space-y-1 text-sm">
                                        <div className="flex justify-between gap-4">
                                          <span className="text-[#7a95b8]">Risk Score:</span>
                                          <span className="text-white font-medium">{data.risk}</span>
                                        </div>
                                        <div className="flex justify-between gap-4">
                                          <span className="text-[#7a95b8]">Expected Return:</span>
                                          <span className="text-white font-medium">{data.return.toFixed(1)}%</span>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Legend wrapperStyle={{ paddingTop: "20px" }} />
                            {riskVsReturnData.map((entry, index) => (
                              <Scatter 
                                key={`scatter-${index}`} 
                                name={entry.name} 
                                data={[entry]} 
                                fill={entry.fill} 
                                shape="circle"
                              />
                            ))}
                          </ScatterChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="details" className="mt-0 outline-none">
                    {/* Detailed Comparison Table */}
                    <div className="rc-card overflow-hidden">
                      <div className="px-6 py-5 border-b border-[#1a3055] bg-[#0b1628]/50 flex items-center justify-between sticky top-0 z-10">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                          <FileText className="w-5 h-5 text-[#3b82f6]" />
                          Comprehensive Financial Matrix
                        </h3>
                        <div className="flex gap-4 overflow-x-auto pb-1 max-w-[50%]">
                          {selectedClients.map((c, i) => (
                            <div key={i} className="flex items-center gap-2 shrink-0">
                              <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                              <span className="text-sm text-[#c8d8ec] font-medium">{c.name?.split(' ')[0]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px]">
                          <thead>
                            <tr className="bg-[#060d19]/80 border-b border-[#1a3055] sticky top-0 z-10 backdrop-blur-sm">
                              <th className="py-4 px-6 text-left text-xs text-[#7a95b8] font-medium uppercase tracking-wider w-1/4">Metric</th>
                              {selectedClients.map((c, i) => (
                                <th key={i} className="py-4 px-6 text-right text-xs font-bold uppercase tracking-wider" style={{ color: COLORS[i % COLORS.length] }}>
                                  {c.name ?? `Client ${i + 1}`}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {/* Personal Details */}
                            <tr className="bg-[#060d19]/30 border-b border-[#12233e]">
                              <td colSpan={selectedClients.length + 1} className="py-2 px-6">
                                <button 
                                  onClick={() => toggleSection('personal')}
                                  className="flex items-center gap-2 text-xs font-semibold text-[#4a6a8e] uppercase tracking-wider hover:text-[#7a95b8] transition-colors w-full text-left"
                                >
                                  {expandedSections['personal'] !== false ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                  Personal Details
                                </button>
                              </td>
                            </tr>
                            {expandedSections['personal'] !== false && (
                              <>
                                <ComparisonMetric label="Age" values={selectedClients.map((c) => c.age ?? "N/A")} format="text" />
                                <ComparisonMetric label="Filing Status" values={selectedClients.map((c) => c.filingStatus ?? "N/A")} format="text" />
                                <ComparisonMetric label="Dependents" values={selectedClients.map((c) => c.dependents ?? 0)} format="number" />
                                <ComparisonMetric label="Risk Tolerance Score" values={selectedClients.map((c) => c.riskScore ?? 50)} format="number" description="1-100 scale based on risk questionnaire" highlightMax />
                              </>
                            )}
                            
                            {/* Income & Cash Flow */}
                            <tr className="bg-[#060d19]/30 border-b border-[#12233e]">
                              <td colSpan={selectedClients.length + 1} className="py-2 px-6">
                                <button 
                                  onClick={() => toggleSection('income')}
                                  className="flex items-center gap-2 text-xs font-semibold text-[#4a6a8e] uppercase tracking-wider hover:text-[#7a95b8] transition-colors w-full text-left"
                                >
                                  {expandedSections['income'] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                  Income & Cash Flow
                                </button>
                              </td>
                            </tr>
                            {expandedSections['income'] && (
                              <>
                                <ComparisonMetric label="Annual Income" values={selectedClients.map((c) => Number(c.income ?? 0))} description="Total household income before taxes" highlightMax />
                                {showAdvancedMetrics && (
                                  <>
                                    <ComparisonMetric label="Est. Annual Expenses" values={selectedClients.map((c) => Number(c.expenses ?? (Number(c.income ?? 0) * 0.7)))} description="Estimated based on income and typical spending patterns" />
                                    <ComparisonMetric label="Savings Rate" values={selectedClients.map((c) => {
                                      const inc = Number(c.income ?? 0);
                                      const exp = Number(c.expenses ?? (inc * 0.7));
                                      return inc > 0 ? ((inc - exp) / inc) * 100 : 0;
                                    })} format="percentage" highlightMax />
                                  </>
                                )}
                              </>
                            )}
                            
                            {/* Assets Section */}
                            <tr className="bg-[#060d19]/30 border-b border-[#12233e]">
                              <td colSpan={selectedClients.length + 1} className="py-2 px-6">
                                <button 
                                  onClick={() => toggleSection('assets')}
                                  className="flex items-center gap-2 text-xs font-semibold text-[#4a6a8e] uppercase tracking-wider hover:text-[#7a95b8] transition-colors w-full text-left"
                                >
                                  {expandedSections['assets'] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                  Assets Breakdown
                                </button>
                              </td>
                            </tr>
                            {expandedSections['assets'] && (
                              <>
                                <ComparisonMetric label="IRA Balance (Tax-Deferred)" values={selectedClients.map((c) => Number(c.iraBalance ?? 0))} highlightMax />
                                <ComparisonMetric label="Roth Balance (Tax-Free)" values={selectedClients.map((c) => Number(c.rothBalance ?? 0))} highlightMax />
                                <ComparisonMetric label="Taxable Assets" values={selectedClients.map((c) => Number(c.taxableAssets ?? 0))} highlightMax />
                                <ComparisonMetric label="Real Estate Equity" values={selectedClients.map((c) => Number(c.realEstateEquity ?? 0))} highlightMax />
                                {showAdvancedMetrics && (
                                  <>
                                    <ComparisonMetric label="Business Interests" values={selectedClients.map((c) => Number(c.businessValue ?? 0))} />
                                    <ComparisonMetric label="Cash Equivalents" values={selectedClients.map((c) => Number(c.cashBalance ?? 0))} />
                                  </>
                                )}
                                <ComparisonMetric 
                                  label="Total Assets" 
                                  values={selectedClients.map((c) => getTotals(c).totalAssets)} 
                                  highlightMax 
                                />
                              </>
                            )}
                            
                            {/* Liabilities Section */}
                            {showAdvancedMetrics && (
                              <>
                                <tr className="bg-[#060d19]/30 border-b border-[#12233e]">
                                  <td colSpan={selectedClients.length + 1} className="py-2 px-6">
                                    <button 
                                      onClick={() => toggleSection('liabilities')}
                                      className="flex items-center gap-2 text-xs font-semibold text-[#4a6a8e] uppercase tracking-wider hover:text-[#7a95b8] transition-colors w-full text-left"
                                    >
                                      {expandedSections['liabilities'] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                      Liabilities
                                    </button>
                                  </td>
                                </tr>
                                {expandedSections['liabilities'] && (
                                  <>
                                    <ComparisonMetric label="Mortgage Balance" values={selectedClients.map((c) => Number(c.mortgageBalance ?? 0))} highlightMin />
                                    <ComparisonMetric label="Other Debt" values={selectedClients.map((c) => Number(c.otherDebt ?? 0))} highlightMin />
                                    <ComparisonMetric 
                                      label="Total Liabilities" 
                                      values={selectedClients.map((c) => getTotals(c).totalLiabilities)} 
                                      highlightMin 
                                    />
                                  </>
                                )}
                              </>
                            )}
                            
                            {/* Insurance Section */}
                            <tr className="bg-[#060d19]/30 border-b border-[#12233e]">
                              <td colSpan={selectedClients.length + 1} className="py-2 px-6">
                                <button 
                                  onClick={() => toggleSection('insurance')}
                                  className="flex items-center gap-2 text-xs font-semibold text-[#4a6a8e] uppercase tracking-wider hover:text-[#7a95b8] transition-colors w-full text-left"
                                >
                                  {expandedSections['insurance'] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                  Insurance Coverage
                                </button>
                              </td>
                            </tr>
                            {expandedSections['insurance'] && (
                              <>
                                <ComparisonMetric label="Life Insurance Benefit" values={selectedClients.map((c) => Number(c.lifeInsuranceBenefit ?? 0))} highlightMax />
                                <ComparisonMetric label="Annual Premium" values={selectedClients.map((c) => Number(c.annualPremium ?? 0))} description="Total insurance premiums paid annually" />
                              </>
                            )}
                            
                            {/* Summary Totals */}
                            <tr className="bg-[#12233e]/50 border-b-2 border-[#3b82f6]/30">
                              <td colSpan={selectedClients.length + 1} className="py-3 px-6 text-sm font-bold text-white uppercase tracking-wider">
                                Bottom Line Summary
                              </td>
                            </tr>
                            <ComparisonMetric
                              label="Total Net Worth"
                              values={selectedClients.map((c) => getTotals(c).netWorth)}
                              description="Total Assets minus Total Liabilities"
                              highlightMax
                            />
                            {showAdvancedMetrics && (
                              <>
                                <ComparisonMetric
                                  label="Debt-to-Income Ratio"
                                  values={selectedClients.map((c) => getTotals(c).debtToIncome * 100)}
                                  format="percentage"
                                  description="Total liabilities divided by annual income"
                                  highlightMin
                                />
                                <ComparisonMetric
                                  label="Liquidity Ratio"
                                  values={selectedClients.map((c) => getTotals(c).liquidityRatio)}
                                  format="number"
                                  description="Months of expenses covered by liquid assets"
                                  highlightMax
                                />
                              </>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            ) : (
              <div className="rc-card text-center py-24 flex flex-col items-center justify-center border-dashed border-2 border-[#1a3055] bg-[#060d19]/50">
                <div className="w-24 h-24 rounded-full bg-[#12233e] flex items-center justify-center mb-6 shadow-inner relative">
                  <Users className="w-12 h-12 text-[#4a6a8e]" />
                  <div className="absolute -bottom-2 -right-2 bg-[#3b82f6] text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                    VS
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Compare Financial Profiles</h3>
                <p className="text-[#7a95b8] max-w-lg mx-auto mb-8 text-lg">
                  Select between 2 and 5 clients from the dropdown menus above to view a detailed side-by-side multi-dimensional financial comparison.
                </p>
                <div className="flex gap-4 opacity-50 justify-center">
                  {[...Array(selectedIds.length)].map((_, i) => (
                    <div key={i} className={`w-16 h-16 rounded-lg bg-[#12233e] border border-[#1a3055] animate-pulse`} style={{ animationDelay: `${i * 150}ms` }}></div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <PageInsights pageId="client-comparison" />
    </AppShell>
  );
}

function ChevronRight(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
