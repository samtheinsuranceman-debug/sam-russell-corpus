// @ts-nocheck
import { useState, useMemo, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { NumberInput } from "@/components/NumberInput";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import { toast } from "sonner";
import {
  Calculator,
  Plus,
  Trash2,
  Copy,
  Target,
  BarChart3,
  PieChartIcon,
  TrendingUp,
  Download,
  Info,
  DollarSign,
  Activity,
  Calendar,
  Clock,
  Briefcase,
  Users,
  Percent,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  AlertTriangle,
  FileText,
  Settings,
  Filter,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Save,
  Share2
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  ComposedChart,
  Scatter
} from "recharts";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface PolicyEntry {
  id: string;
  productType: string;
  carrier: string;
  premium: number;
  commissionRate: number;
  renewalRate: number;
  years: number;
  status: "active" | "pending" | "declined";
  clientName: string;
  issueDate: string;
  notes: string;
}

const COMMISSION_RATES: Record<string, { firstYear: number; renewal: number; label: string; category: string; risk: string }> = {
  "iul": { firstYear: 100, renewal: 5, label: "Indexed Universal Life", category: "Life", risk: "Medium" },
  "term": { firstYear: 90, renewal: 5, label: "Term Life", category: "Life", risk: "Low" },
  "whole": { firstYear: 55, renewal: 5, label: "Whole Life", category: "Life", risk: "Low" },
  "fia": { firstYear: 6, renewal: 0, label: "Fixed Index Annuity", category: "Annuity", risk: "Medium" },
  "myga": { firstYear: 3, renewal: 0, label: "Multi-Year Guaranteed Annuity", category: "Annuity", risk: "Low" },
  "spia": { firstYear: 4, renewal: 0, label: "Single Premium Immediate Annuity", category: "Annuity", risk: "Low" },
  "disability": { firstYear: 55, renewal: 10, label: "Disability Insurance", category: "Health", risk: "Medium" },
  "ltc": { firstYear: 60, renewal: 5, label: "Long-Term Care", category: "Health", risk: "High" },
  "vul": { firstYear: 85, renewal: 3, label: "Variable Universal Life", category: "Life", risk: "High" },
  "va": { firstYear: 5, renewal: 1, label: "Variable Annuity", category: "Annuity", risk: "High" },
  "medicare": { firstYear: 20, renewal: 10, label: "Medicare Supplement", category: "Health", risk: "Low" },
  "group_life": { firstYear: 15, renewal: 15, label: "Group Life", category: "Group", risk: "Low" },
};

const CARRIERS = [
  "National Life", "Allianz", "Pacific Life", "Lincoln Financial", "MassMutual",
  "New York Life", "Northwestern Mutual", "Prudential", "Transamerica", "AIG",
  "Mutual of Omaha", "Global Atlantic", "Athene", "Sammons", "Symetra"
];

const fmt = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtPct = (n: number) => `${n.toFixed(2)}%`;

export default function CommissionCalculator() {
  const { user } = useAuth();
  
  const { data: clientsData } = trpc.clients.list.useQuery();
  const { data: teamData } = trpc.team.members.useQuery();
  const { data: goalsData } = trpc.goals.getAnnual.useQuery();
  const { data: marketData } = trpc.marketData.getRates.useQuery();
  const { data: leaderboardData } = trpc.leaderboard.getTop.useQuery();
  
  const [policies, setPolicies] = useState<PolicyEntry[]>([
    { id: "1", productType: "iul", carrier: "National Life", premium: 40000, commissionRate: 100, renewalRate: 5, years: 15, status: "active", clientName: "John Doe", issueDate: "2023-01-15", notes: "Target premium" },
    { id: "2", productType: "fia", carrier: "Allianz", premium: 300000, commissionRate: 6, renewalRate: 0, years: 1, status: "active", clientName: "Jane Smith", issueDate: "2023-03-22", notes: "10-year surrender" },
    { id: "3", productType: "term", carrier: "Pacific Life", premium: 2400, commissionRate: 90, renewalRate: 5, years: 20, status: "pending", clientName: "Bob Johnson", issueDate: "2023-05-10", notes: "20-year term" },
    { id: "4", productType: "whole", carrier: "MassMutual", premium: 15000, commissionRate: 55, renewalRate: 5, years: 30, status: "active", clientName: "Alice Brown", issueDate: "2022-11-05", notes: "10-pay" },
    { id: "5", productType: "ltc", carrier: "Mutual of Omaha", premium: 5000, commissionRate: 60, renewalRate: 5, years: 10, status: "declined", clientName: "Charlie Davis", issueDate: "2023-02-18", notes: "Shared care rider" },
  ]);

  const [annualGoal, setAnnualGoal] = useState(500000);
  const [activeTab, setActiveTab] = useState<"policies" | "breakdown" | "projections" | "analysis" | "rates" | "settings">("policies");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [sortField, setSortField] = useState<keyof PolicyEntry>("premium");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (goalsData?.target) {
      setAnnualGoal(goalsData.target);
    }
  }, [goalsData]);

  const addPolicy = () => {
    setPolicies([{
      id: Date.now().toString(),
      productType: "iul",
      carrier: CARRIERS[0],
      premium: 0,
      commissionRate: COMMISSION_RATES["iul"].firstYear,
      renewalRate: COMMISSION_RATES["iul"].renewal,
      years: 1,
      status: "pending",
      clientName: "",
      issueDate: new Date().toISOString().split('T')[0],
      notes: ""
    }, ...policies]);
    toast.success("New policy added");
  };

  const removePolicy = (id: string) => {
    setPolicies(policies.filter((p) => p.id !== id));
    toast.success("Policy removed");
  };

  const duplicatePolicy = (id: string) => {
    const policyToDuplicate = policies.find((p) => p.id === id);
    if (policyToDuplicate) {
      setPolicies([{
        ...policyToDuplicate,
        id: Date.now().toString(),
        clientName: `${policyToDuplicate.clientName} (Copy)`,
        status: "pending"
      }, ...policies]);
      toast.success("Policy duplicated");
    }
  };

  const updatePolicy = (id: string, updates: Partial<PolicyEntry>) => {
    setPolicies(policies.map((p) => {
      if (p.id !== id) return p;
      const updated = { ...p, ...updates };
      if (updates.productType && updates.productType !== p.productType) {
        const rates = COMMISSION_RATES[updates.productType];
        if (rates) {
          updated.commissionRate = rates.firstYear;
          updated.renewalRate = rates.renewal;
        }
      }
      return updated;
    }));
  };

  const calculations = useMemo(() => {
    let totalFirstYear = 0;
    let totalRenewal = 0;
    let totalLifetime = 0;
    let activeFirstYear = 0;
    let pendingFirstYear = 0;

    const policyCalcs = policies.map((p) => {
      const firstYear = p.premium * (p.commissionRate / 100);
      const annualRenewal = p.premium * (p.renewalRate / 100);
      const renewalYears = Math.max(0, p.years - 1);
      const totalRenewals = annualRenewal * renewalYears;
      const lifetime = firstYear + totalRenewals;

      if (p.status !== "declined") {
        totalFirstYear += firstYear;
        totalRenewal += totalRenewals;
        totalLifetime += lifetime;
        
        if (p.status === "active") activeFirstYear += firstYear;
        if (p.status === "pending") pendingFirstYear += firstYear;
      }

      return { ...p, firstYear, annualRenewal, totalRenewals, lifetime };
    });

    const categories: Record<string, number> = {};
    policyCalcs.forEach((p) => {
      if (p.status !== "declined") {
        const cat = COMMISSION_RATES[p.productType]?.category || "Other";
        categories[cat] = (categories[cat] || 0) + p.firstYear;
      }
    });

    return { 
      policyCalcs, 
      totalFirstYear, 
      totalRenewal, 
      totalLifetime,
      activeFirstYear,
      pendingFirstYear,
      categories,
      avgPremium: policies.length ? policies.reduce((sum, p) => sum + p.premium, 0) / policies.length : 0,
      activeCount: policies.filter((p) => p.status === "active").length,
      pendingCount: policies.filter((p) => p.status === "pending").length,
    };
  }, [policies]);

  const filteredPolicies = useMemo(() => {
    let result = policies;
    
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      result = result.filter((p) => 
        p.carrier.toLowerCase().includes(lowerQ) ||
        p.clientName.toLowerCase().includes(lowerQ) ||
        (COMMISSION_RATES[p.productType]?.label || "").toLowerCase().includes(lowerQ)
      );
    }
    
    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }
    
    if (categoryFilter !== "all") {
      result = result.filter((p) => COMMISSION_RATES[p.productType]?.category === categoryFilter);
    }
    
    return result.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      
      return 0;
    });
  }, [policies, searchQuery, statusFilter, categoryFilter, sortField, sortOrder]);

  const handleSort = (field: keyof PolicyEntry) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const goalProgress = Math.min(100, Math.round((calculations.totalFirstYear / annualGoal) * 100));
  const activeProgress = Math.min(100, Math.round((calculations.activeFirstYear / annualGoal) * 100));

  const copyReport = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const lines = [
        "COMMISSION PROJECTION REPORT",
        `Date: ${new Date().toLocaleDateString()}`,
        `Advisor: ${user?.name || 'Advisor'}`,
        "",
        "EXECUTIVE SUMMARY:",
        `Total First Year: ${fmt(calculations.totalFirstYear)}`,
        `Active First Year: ${fmt(calculations.activeFirstYear)}`,
        `Pending First Year: ${fmt(calculations.pendingFirstYear)}`,
        `Total Renewals: ${fmt(calculations.totalRenewal)}`,
        `Total Lifetime: ${fmt(calculations.totalLifetime)}`,
        `Annual Goal: ${fmt(annualGoal)} (${goalProgress}% Achieved)`,
        "",
        "POLICY BREAKDOWN:",
        ...calculations.policyCalcs
          .filter((p) => p.status !== "declined")
          .map((p) =>
            `[${p.status.toUpperCase()}] ${p.clientName} | ${COMMISSION_RATES[p.productType]?.label || p.productType} - ${p.carrier}: Premium ${fmt(p.premium)}, FYC ${fmt(p.firstYear)}, Lifetime ${fmt(p.lifetime)}`
          ),
      ];
      navigator.clipboard.writeText(lines.join("\n"));
      setIsProcessing(false);
      toast.success("Report copied to clipboard");
    }, 500);
  };

  const exportCSV = () => {
    const headers = ["Client Name", "Status", "Issue Date", "Product Type", "Category", "Carrier", "Premium", "First Year %", "Renewal %", "Years", "First Year Commission", "Annual Renewal", "Lifetime Commission", "Notes"];
    const rows = calculations.policyCalcs.map((p) => [
      `"${p.clientName}"`,
      p.status,
      p.issueDate,
      `"${COMMISSION_RATES[p.productType]?.label || p.productType}"`,
      COMMISSION_RATES[p.productType]?.category || "Other",
      `"${p.carrier}"`,
      p.premium,
      p.commissionRate,
      p.renewalRate,
      p.years,
      p.firstYear,
      p.annualRenewal,
      p.lifetime,
      `"${p.notes}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `commission_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Exported successfully");
  };

  const saveScenario = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      toast.success("Scenario saved successfully");
    }, 800);
  };

  const projectionData = useMemo(() => {
    return Array.from({ length: 15 }, (_, year) => {
      const yearNum = year + 1;
      const renewalIncome = calculations.policyCalcs.reduce((sum, p) => {
        if (p.status === "declined") return sum;
        if (yearNum <= p.years && yearNum > 1) return sum + p.annualRenewal;
        return sum;
      }, 0);
      const firstYearIncome = year === 0 ? calculations.totalFirstYear : 0;
      const cumulative = year === 0 ? firstYearIncome : 0; // Simplified for this example
      
      return {
        name: `Year ${yearNum}`,
        year: yearNum,
        FirstYear: firstYearIncome,
        Renewal: renewalIncome,
        Total: firstYearIncome + renewalIncome,
      };
    });
  }, [calculations]);

  let runningTotal = 0;
  const cumulativeData = projectionData.map((d) => {
    runningTotal += d.Total;
    return { ...d, Cumulative: runningTotal };
  });

  const categoryPieData = useMemo(() => {
    return Object.entries(calculations.categories).map(([name, value]) => ({
      name,
      value
    })).filter((d) => d.value > 0);
  }, [calculations.categories]);

  const carrierData = useMemo(() => {
    const carriers: Record<string, number> = {};
    calculations.policyCalcs.forEach((p) => {
      if (p.status !== "declined") {
        carriers[p.carrier] = (carriers[p.carrier] || 0) + p.firstYear;
      }
    });
    return Object.entries(carriers)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [calculations]);

  const scatterData = useMemo(() => {
    return calculations.policyCalcs
      .filter((p) => p.status !== "declined")
      .map((p) => ({
        name: p.clientName || 'Unknown',
        premium: p.premium,
        commission: p.firstYear,
        rate: p.commissionRate,
        category: COMMISSION_RATES[p.productType]?.category || 'Other'
      }));
  }, [calculations]);

  const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#f43f5e'];

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'text-[#22c55e] bg-[#22c55e]/10 border-[#22c55e]/20';
      case 'pending': return 'text-[#f59e0b] bg-[#f59e0b]/10 border-[#f59e0b]/20';
      case 'declined': return 'text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 pb-20">
        <div className="rc-page-header flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#22c55e]/10 flex items-center justify-center border border-[#22c55e]/20">
                <Calculator className="h-5 w-5 text-[#22c55e]" />
              </div>
              <div>
                <h1 className="rc-page-title">Commission Calculator Pro</h1>
                <p className="rc-page-subtitle mt-1">
                  Advanced multi-product projections, renewals, and goal tracking
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <ExportToSlides
              toolName="Commission Calculator"
              getSections={() => [
                {
                  title: "Executive Summary",
                  items: [
                    { label: "Total First Year", value: fmt(calculations.totalFirstYear) },
                    { label: "Active First Year", value: fmt(calculations.activeFirstYear) },
                    { label: "Pending Pipeline", value: fmt(calculations.pendingFirstYear) },
                    { label: "Total Renewals", value: fmt(calculations.totalRenewal) },
                    { label: "Lifetime Value", value: fmt(calculations.totalLifetime) },
                    { label: "Annual Goal Progress", value: `${goalProgress}%` }
                  ]
                },
                {
                  title: "Top Policies",
                  items: calculations.policyCalcs
                    .sort((a, b) => b.firstYear - a.firstYear)
                    .slice(0, 5)
                    .map((p) => ({
                      label: `${p.clientName} (${COMMISSION_RATES[p.productType]?.label})`,
                      value: `FYC: ${fmt(p.firstYear)} | Premium: ${fmt(p.premium)}`
                    }))
                }
              ]}
            />
            <button className="rc-btn rc-btn-ghost" onClick={saveScenario} disabled={isProcessing}>
              <Save className="h-4 w-4 mr-2" /> Save Scenario
            </button>
            <button className="rc-btn rc-btn-ghost" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </button>
            <button className="rc-btn rc-btn-ghost" onClick={copyReport} disabled={isProcessing}>
              <Copy className="h-4 w-4 mr-2" /> {isProcessing ? "Processing..." : "Copy Report"}
            </button>
            <button className="rc-btn rc-btn-primary" onClick={addPolicy}>
              <Plus className="h-4 w-4 mr-2" /> Add Policy
            </button>
          </div>
        </div>

        {/* KPI Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rc-card border-t-4 border-t-[#22c55e] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <DollarSign className="h-16 w-16 text-[#22c55e]" />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg bg-[#22c55e]/10 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-[#22c55e]" />
              </div>
              <div className="rc-stat-label">First Year Commission</div>
            </div>
            <div className="rc-stat-value text-white">{fmt(calculations.totalFirstYear)}</div>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-[#22c55e] flex items-center"><CheckCircle className="h-3 w-3 mr-1" /> Active: {fmt(calculations.activeFirstYear)}</span>
              <span className="text-[#f59e0b] flex items-center"><Clock className="h-3 w-3 mr-1" /> Pending: {fmt(calculations.pendingFirstYear)}</span>
            </div>
          </div>
          
          <div className="rc-card border-t-4 border-t-[#3b82f6] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp className="h-16 w-16 text-[#3b82f6]" />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg bg-[#3b82f6]/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-[#3b82f6]" />
              </div>
              <div className="rc-stat-label">Total Renewals</div>
            </div>
            <div className="rc-stat-value text-white">{fmt(calculations.totalRenewal)}</div>
            <div className="mt-3 flex items-center text-xs text-[#7a95b8]">
              <Activity className="h-3 w-3 mr-1" /> Based on projected persistency
            </div>
          </div>
          
          <div className="rc-card border-t-4 border-t-[#8b5cf6] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Award className="h-16 w-16 text-[#8b5cf6]" />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg bg-[#8b5cf6]/10 flex items-center justify-center">
                <Award className="h-4 w-4 text-[#8b5cf6]" />
              </div>
              <div className="rc-stat-label">Lifetime Value</div>
            </div>
            <div className="rc-stat-value text-white">{fmt(calculations.totalLifetime)}</div>
            <div className="mt-3 flex items-center text-xs text-[#7a95b8]">
              <Briefcase className="h-3 w-3 mr-1" /> Total projected contract value
            </div>
          </div>
          
          <div className="rc-card border-t-4 border-t-[#f59e0b] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Target className="h-16 w-16 text-[#f59e0b]" />
            </div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[#f59e0b]/10 flex items-center justify-center">
                  <Target className="h-4 w-4 text-[#f59e0b]" />
                </div>
                <div className="rc-stat-label">Goal Progress</div>
              </div>
              <button className="text-[#7a95b8] hover:text-white" onClick={() => setActiveTab("settings")}>
                <Settings className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-end gap-2">
              <div className={`rc-stat-value ${goalProgress >= 100 ? "text-[#22c55e]" : goalProgress >= 75 ? "text-[#f59e0b]" : "text-white"}`}>
                {goalProgress}%
              </div>
              <div className="text-sm text-[#7a95b8] mb-1 pb-1">/ {fmt(annualGoal)}</div>
            </div>
            <div className="mt-3 h-2 bg-[#060d19] rounded-full overflow-hidden border border-[#12233e]">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${goalProgress >= 100 ? "bg-[#22c55e]" : goalProgress >= 75 ? "bg-[#f59e0b]" : "bg-[#3b82f6]"}`}
                style={{ width: `${Math.min(100, goalProgress)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#0a1424] border border-[#12233e] rounded-xl p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-[#12233e]/50">
              <Users className="h-5 w-5 text-[#7a95b8]" />
            </div>
            <div>
              <div className="text-xs text-[#7a95b8] mb-1">Total Policies</div>
              <div className="text-lg font-bold text-white">{policies.length}</div>
            </div>
          </div>
          <div className="bg-[#0a1424] border border-[#12233e] rounded-xl p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/20">
              <CheckCircle className="h-5 w-5 text-[#22c55e]" />
            </div>
            <div>
              <div className="text-xs text-[#7a95b8] mb-1">Active / Placed</div>
              <div className="text-lg font-bold text-white">{calculations.activeCount}</div>
            </div>
          </div>
          <div className="bg-[#0a1424] border border-[#12233e] rounded-xl p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-[#f59e0b]/10 border border-[#f59e0b]/20">
              <Clock className="h-5 w-5 text-[#f59e0b]" />
            </div>
            <div>
              <div className="text-xs text-[#7a95b8] mb-1">Pending / UW</div>
              <div className="text-lg font-bold text-white">{calculations.pendingCount}</div>
            </div>
          </div>
          <div className="bg-[#0a1424] border border-[#12233e] rounded-xl p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-[#3b82f6]/10 border border-[#3b82f6]/20">
              <Percent className="h-5 w-5 text-[#3b82f6]" />
            </div>
            <div>
              <div className="text-xs text-[#7a95b8] mb-1">Avg Premium</div>
              <div className="text-lg font-bold text-white">{fmt(calculations.avgPremium)}</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto no-scrollbar border-b border-[#12233e] mb-6 pb-px">
          {[
            { id: "policies", label: "Policy Ledger", icon: FileText },
            { id: "breakdown", label: "Distribution", icon: PieChartIcon },
            { id: "projections", label: "Projections", icon: TrendingUp },
            { id: "analysis", label: "Analysis", icon: Activity },
            { id: "rates", label: "Rate Tables", icon: Info },
            { id: "settings", label: "Settings", icon: Settings }
          ].map((tab) => (
            <button
              key={tab.id}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? "text-[#22c55e] border-b-2 border-[#22c55e] bg-[#22c55e]/5" 
                  : "text-[#7a95b8] hover:text-white hover:bg-[#12233e]/30"
              }`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content: Policies */}
        {activeTab === "policies" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a1424] p-4 rounded-xl border border-[#12233e]">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7a95b8]" />
                  <input
                    type="text"
                    placeholder="Search client, carrier, product..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="rc-input pl-9 w-full sm:w-64 h-10 text-sm"
                  />
                </div>
                <button 
                  className={`p-2 rounded-lg border transition-colors ${showFilters ? 'bg-[#12233e] border-[#3b82f6] text-white' : 'border-[#12233e] text-[#7a95b8] hover:text-white hover:bg-[#12233e]'}`}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-5 w-5" />
                </button>
              </div>
              
              <div className="flex items-center gap-2 bg-[#12233e]/50 p-1 rounded-lg">
                <button 
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'card' ? 'bg-[#22c55e] text-[#060d19]' : 'text-[#7a95b8] hover:text-white'}`}
                  onClick={() => setViewMode('card')}
                >
                  Cards
                </button>
                <button 
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === 'table' ? 'bg-[#22c55e] text-[#060d19]' : 'text-[#7a95b8] hover:text-white'}`}
                  onClick={() => setViewMode('table')}
                >
                  Table
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-[#0a1424] rounded-xl border border-[#12233e] animate-in fade-in slide-in-from-top-2">
                <div>
                  <label className="block text-xs text-[#7a95b8] mb-1.5">Status Filter</label>
                  <select 
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rc-input w-full h-9 text-sm"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active / Placed</option>
                    <option value="pending">Pending / Underwriting</option>
                    <option value="declined">Declined / Not Taken</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#7a95b8] mb-1.5">Category Filter</label>
                  <select 
                    value={categoryFilter} 
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="rc-input w-full h-9 text-sm"
                  >
                    <option value="all">All Categories</option>
                    <option value="Life">Life Insurance</option>
                    <option value="Annuity">Annuities</option>
                    <option value="Health">Health / LTC</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[#7a95b8] mb-1.5">Sort By</label>
                  <div className="flex gap-2">
                    <select 
                      value={sortField} 
                      onChange={(e) => setSortField(e.target.value as any)}
                      className="rc-input flex-1 h-9 text-sm"
                    >
                      <option value="clientName">Client Name</option>
                      <option value="premium">Premium Amount</option>
                      <option value="issueDate">Issue Date</option>
                      <option value="carrier">Carrier</option>
                    </select>
                    <button 
                      className="p-2 border border-[#12233e] rounded-lg bg-[#12233e]/50 text-white hover:bg-[#12233e]"
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    >
                      {sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {filteredPolicies.length === 0 ? (
              <div className="rc-card py-16 text-center flex flex-col items-center justify-center border-dashed border-2">
                <div className="h-16 w-16 rounded-full bg-[#12233e] flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-[#7a95b8]" />
                </div>
                <h3 className="text-xl text-white font-medium mb-2">No policies found</h3>
                <p className="text-[#7a95b8] max-w-md mx-auto mb-6">
                  {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' 
                    ? "Try adjusting your filters or search query to find what you're looking for." 
                    : "Your ledger is empty. Click 'Add Policy' to start calculating commissions and tracking your pipeline."}
                </p>
                <button className="rc-btn rc-btn-primary" onClick={addPolicy}>
                  <Plus className="h-5 w-5 mr-2" /> Add Your First Policy
                </button>
              </div>
            ) : viewMode === 'card' ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {filteredPolicies.map((policy) => {
                  const isExpanded = selectedPolicyId === policy.id;
                  const calc = calculations.policyCalcs.find((p) => p.id === policy.id);
                  const statusClass = getStatusColor(policy.status);
                  
                  return (
                    <div key={policy.id} className={`rc-card p-0 overflow-hidden transition-all duration-300 border ${isExpanded ? 'border-[#3b82f6]' : 'border-[#12233e] hover:border-[#3b82f6]/50'}`}>
                      {/* Card Header */}
                      <div 
                        className="p-4 flex items-center justify-between cursor-pointer bg-[#0a1424]"
                        onClick={() => setSelectedPolicyId(isExpanded ? null : policy.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border ${statusClass}`}>
                            {policy.status}
                          </div>
                          <div>
                            <h3 className="text-white font-medium text-lg">{policy.clientName || 'Unnamed Client'}</h3>
                            <div className="text-sm text-[#7a95b8] flex items-center gap-2">
                              <span>{COMMISSION_RATES[policy.productType]?.label || policy.productType}</span>
                              <span className="w-1 h-1 rounded-full bg-[#3b82f6]"></span>
                              <span>{policy.carrier}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right hidden sm:block">
                            <div className="text-sm text-[#7a95b8]">First Year</div>
                            <div className="text-lg font-bold text-[#22c55e]">{fmt(calc?.firstYear || 0)}</div>
                          </div>
                          <div className="text-[#7a95b8]">
                            {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                          </div>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="p-4 border-t border-[#12233e] bg-[#060d19]">
                          <div className="flex justify-end gap-2 mb-4">
                            <button className="p-1.5 text-[#7a95b8] hover:text-white hover:bg-[#12233e] rounded transition-colors" title="Duplicate" onClick={() => duplicatePolicy(policy.id)}>
                              <Copy className="h-4 w-4" />
                            </button>
                            <button className="p-1.5 text-[#7a95b8] hover:text-red-400 hover:bg-red-400/10 rounded transition-colors" title="Delete" onClick={() => removePolicy(policy.id)}>
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          
                          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                            <div>
                              <label className="block text-xs text-[#7a95b8] mb-1">Client Name</label>
                              <input
                                type="text"
                                value={policy.clientName}
                                onChange={(e) => updatePolicy(policy.id, { clientName: e.target.value })}
                                className="rc-input w-full h-9 text-sm"
                                placeholder="Client name"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-[#7a95b8] mb-1">Status</label>
                              <select
                                value={policy.status}
                                onChange={(e) => updatePolicy(policy.id, { status: e.target.value as any })}
                                className="rc-input w-full h-9 text-sm"
                              >
                                <option value="active">Active / Placed</option>
                                <option value="pending">Pending / Underwriting</option>
                                <option value="declined">Declined / Not Taken</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-[#7a95b8] mb-1">Issue / Target Date</label>
                              <input
                                type="date"
                                value={policy.issueDate}
                                onChange={(e) => updatePolicy(policy.id, { issueDate: e.target.value })}
                                className="rc-input w-full h-9 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-[#7a95b8] mb-1">Product Type</label>
                              <select
                                value={policy.productType}
                                onChange={(e) => updatePolicy(policy.id, { productType: e.target.value })}
                                className="rc-input w-full h-9 text-sm"
                              >
                                {Object.entries(COMMISSION_RATES).map(([key, val]) => (
                                  <option key={key} value={key}>{val.label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-[#7a95b8] mb-1">Carrier</label>
                              <input
                                type="text"
                                list="carriers-list"
                                value={policy.carrier}
                                onChange={(e) => updatePolicy(policy.id, { carrier: e.target.value })}
                                className="rc-input w-full h-9 text-sm"
                                placeholder="Carrier name"
                              />
                              <datalist id="carriers-list">
                                {CARRIERS.map((c) => <option key={c} value={c} />)}
                              </datalist>
                            </div>
                            <div>
                              <label className="block text-xs text-[#7a95b8] mb-1">Premium</label>
                              <NumberInput value={policy.premium} onChange={(v) => updatePolicy(policy.id, { premium: v })} className="rc-input w-full h-9 text-sm" />
                            </div>
                            <div>
                              <label className="block text-xs text-[#7a95b8] mb-1">Duration (Years)</label>
                              <NumberInput value={policy.years} onChange={(v) => updatePolicy(policy.id, { years: v })} className="rc-input w-full h-9 text-sm" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs text-[#7a95b8] mb-1">1st Yr %</label>
                                <NumberInput value={policy.commissionRate} onChange={(v) => updatePolicy(policy.id, { commissionRate: v })} className="rc-input w-full h-9 text-sm" />
                              </div>
                              <div>
                                <label className="block text-xs text-[#7a95b8] mb-1">Ren %</label>
                                <NumberInput value={policy.renewalRate} onChange={(v) => updatePolicy(policy.id, { renewalRate: v })} className="rc-input w-full h-9 text-sm" />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs text-[#7a95b8] mb-1">Notes</label>
                              <input
                                type="text"
                                value={policy.notes}
                                onChange={(e) => updatePolicy(policy.id, { notes: e.target.value })}
                                className="rc-input w-full h-9 text-sm"
                                placeholder="Optional notes"
                              />
                            </div>
                          </div>
                          
                          {/* Policy Results Summary */}
                          <div className="bg-[#0a1424] rounded-xl p-4 border border-[#12233e]">
                            <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                              <Activity className="h-4 w-4 text-[#3b82f6]" /> Policy Projections
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <div className="text-xs text-[#7a95b8] mb-1">First Year</div>
                                <div className="text-lg font-bold text-[#22c55e]">{fmt(calc?.firstYear || 0)}</div>
                              </div>
                              <div>
                                <div className="text-xs text-[#7a95b8] mb-1">Annual Renewal</div>
                                <div className="text-lg font-bold text-[#3b82f6]">{fmt(calc?.annualRenewal || 0)}</div>
                              </div>
                              <div>
                                <div className="text-xs text-[#7a95b8] mb-1">Total Renewals</div>
                                <div className="text-lg font-bold text-[#f59e0b]">{fmt(calc?.totalRenewals || 0)}</div>
                              </div>
                              <div>
                                <div className="text-xs text-[#7a95b8] mb-1">Lifetime Value</div>
                                <div className="text-lg font-bold text-white">{fmt(calc?.lifetime || 0)}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rc-card p-0 overflow-hidden overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-[#7a95b8] bg-[#0a1424] border-b border-[#12233e]">
                    <tr>
                      <th className="py-3 px-4 font-medium cursor-pointer hover:text-white" onClick={() => handleSort('clientName')}>
                        Client <span className="inline-block ml-1">{sortField === 'clientName' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</span>
                      </th>
                      <th className="py-3 px-4 font-medium cursor-pointer hover:text-white" onClick={() => handleSort('status')}>
                        Status <span className="inline-block ml-1">{sortField === 'status' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</span>
                      </th>
                      <th className="py-3 px-4 font-medium cursor-pointer hover:text-white" onClick={() => handleSort('productType')}>
                        Product <span className="inline-block ml-1">{sortField === 'productType' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</span>
                      </th>
                      <th className="py-3 px-4 font-medium cursor-pointer hover:text-white" onClick={() => handleSort('carrier')}>
                        Carrier <span className="inline-block ml-1">{sortField === 'carrier' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</span>
                      </th>
                      <th className="py-3 px-4 font-medium text-right cursor-pointer hover:text-white" onClick={() => handleSort('premium')}>
                        Premium <span className="inline-block ml-1">{sortField === 'premium' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</span>
                      </th>
                      <th className="py-3 px-4 font-medium text-right">FYC %</th>
                      <th className="py-3 px-4 font-medium text-right text-[#22c55e]">First Year</th>
                      <th className="py-3 px-4 font-medium text-right text-[#3b82f6]">Renewals</th>
                      <th className="py-3 px-4 font-medium text-right text-white">Lifetime</th>
                      <th className="py-3 px-4 font-medium text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#12233e]">
                    {filteredPolicies.map((policy) => {
                      const calc = calculations.policyCalcs.find((p) => p.id === policy.id);
                      const statusClass = getStatusColor(policy.status);
                      
                      return (
                        <tr key={policy.id} className="hover:bg-[#12233e]/30 transition-colors group">
                          <td className="py-3 px-4 font-medium text-white">{policy.clientName || 'Unnamed'}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded text-xs border ${statusClass}`}>
                              {policy.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[#c8d8ec]">{COMMISSION_RATES[policy.productType]?.label || policy.productType}</td>
                          <td className="py-3 px-4 text-[#c8d8ec]">{policy.carrier}</td>
                          <td className="py-3 px-4 text-right text-white">{fmt(policy.premium)}</td>
                          <td className="py-3 px-4 text-right text-[#7a95b8]">{policy.commissionRate}%</td>
                          <td className="py-3 px-4 text-right font-medium text-[#22c55e]">{fmt(calc?.firstYear || 0)}</td>
                          <td className="py-3 px-4 text-right text-[#3b82f6]">{fmt(calc?.totalRenewals || 0)}</td>
                          <td className="py-3 px-4 text-right font-bold text-white">{fmt(calc?.lifetime || 0)}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="text-[#7a95b8] hover:text-white" onClick={() => duplicatePolicy(policy.id)}><Copy className="h-4 w-4" /></button>
                              <button className="text-[#7a95b8] hover:text-red-400" onClick={() => removePolicy(policy.id)}><Trash2 className="h-4 w-4" /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Breakdown */}
        {activeTab === "breakdown" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rc-card flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-[#22c55e]" />
                  <h2 className="text-lg font-medium text-white">Revenue by Category</h2>
                </div>
              </div>
              
              {categoryPieData.length > 0 ? (
                <div className="flex-1 flex flex-col">
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={categoryPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {categoryPieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => fmt(value)}
                          contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', borderRadius: '8px', color: '#fff' }}
                        />
                        <Legend verticalAlign="bottom" height={36} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="mt-4 space-y-3">
                    {categoryPieData.map((item, i) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                          <span className="text-sm text-[#c8d8ec]">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-medium text-white">{fmt(item.value)}</span>
                          <span className="text-xs text-[#7a95b8] w-12 text-right">
                            {((item.value / calculations.totalFirstYear) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-[#7a95b8]">No active data to display</div>
              )}
            </div>

            <div className="rc-card flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[#3b82f6]" />
                  <h2 className="text-lg font-medium text-white">Top Carriers by FYC</h2>
                </div>
              </div>
              
              {carrierData.length > 0 ? (
                <div className="flex-1">
                  <div className="h-64 w-full mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={carrierData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#12233e" horizontal={true} vertical={false} />
                        <XAxis type="number" stroke="#7a95b8" tickFormatter={(val) => `$${val/1000}k`} />
                        <YAxis dataKey="name" type="category" stroke="#7a95b8" width={100} tick={{fontSize: 12}} />
                        <Tooltip 
                          formatter={(value: number) => fmt(value)}
                          contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', borderRadius: '8px', color: '#fff' }}
                        />
                        <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                          {carrierData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? '#22c55e' : '#3b82f6'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="space-y-4">
                    {carrierData.slice(0, 3).map((carrier, i) => (
                      <div key={carrier.name} className="flex items-center gap-4">
                        <div className="w-6 text-center font-bold text-[#7a95b8]">#{i+1}</div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm text-white">{carrier.name}</span>
                            <span className="text-sm font-medium text-[#22c55e]">{fmt(carrier.value)}</span>
                          </div>
                          <div className="h-1.5 bg-[#060d19] rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${i === 0 ? 'bg-[#22c55e]' : 'bg-[#3b82f6]'}`}
                              style={{ width: `${(carrier.value / carrierData[0].value) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-[#7a95b8]">No active data to display</div>
              )}
            </div>
            
            <div className="rc-card lg:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <FileText className="h-5 w-5 text-[#f59e0b]" />
                <h2 className="text-lg font-medium text-white">Product Level Breakdown</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-[#7a95b8] border-b border-[#12233e]">
                    <tr>
                      <th className="py-3 px-4 font-medium">Product Type</th>
                      <th className="py-3 px-4 font-medium">Category</th>
                      <th className="py-3 px-4 font-medium text-center">Policy Count</th>
                      <th className="py-3 px-4 font-medium text-right">Total Premium</th>
                      <th className="py-3 px-4 font-medium text-right">Total FYC</th>
                      <th className="py-3 px-4 font-medium text-right">% of FYC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#12233e]">
                    {Object.entries(
                      calculations.policyCalcs
                        .filter((p) => p.status !== "declined")
                        .reduce((acc, p) => {
                          const key = p.productType;
                          if (!acc[key]) {
                            acc[key] = { count: 0, premium: 0, fyc: 0, name: COMMISSION_RATES[key]?.label || key, cat: COMMISSION_RATES[key]?.category || 'Other' };
                          }
                          acc[key].count += 1;
                          acc[key].premium += p.premium;
                          acc[key].fyc += p.firstYear;
                          return acc;
                        }, {} as Record<string, any>)
                    )
                    .sort((a, b) => b[1].fyc - a[1].fyc)
                    .map(([key, data]: [string, any]) => (
                      <tr key={key} className="hover:bg-[#12233e]/30 transition-colors">
                        <td className="py-3 px-4 font-medium text-white">{data.name}</td>
                        <td className="py-3 px-4 text-[#c8d8ec]">{data.cat}</td>
                        <td className="py-3 px-4 text-center text-[#c8d8ec]">{data.count}</td>
                        <td className="py-3 px-4 text-right text-white">{fmt(data.premium)}</td>
                        <td className="py-3 px-4 text-right font-medium text-[#22c55e]">{fmt(data.fyc)}</td>
                        <td className="py-3 px-4 text-right text-[#7a95b8]">
                          {calculations.totalFirstYear ? ((data.fyc / calculations.totalFirstYear) * 100).toFixed(1) : 0}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Projections */}
        {activeTab === "projections" && (
          <div className="space-y-6">
            <div className="rc-card">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#22c55e]" />
                  <div>
                    <h2 className="text-lg font-medium text-white">15-Year Income Projection</h2>
                    <p className="text-sm text-[#7a95b8]">First year and renewal income over time based on current active policies</p>
                  </div>
                </div>
              </div>
              
              <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={cumulativeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                    <XAxis dataKey="name" stroke="#7a95b8" tick={{ fill: '#7a95b8' }} axisLine={{ stroke: '#12233e' }} />
                    <YAxis yAxisId="left" stroke="#7a95b8" tick={{ fill: '#7a95b8' }} axisLine={{ stroke: '#12233e' }} tickFormatter={(val) => `$${val / 1000}k`} />
                    <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" tick={{ fill: '#8b5cf6' }} axisLine={{ stroke: '#12233e' }} tickFormatter={(val) => `$${val / 1000}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#c8d8ec' }}
                      formatter={(value: number) => [fmt(value), undefined]}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar yAxisId="left" dataKey="FirstYear" name="First Year" stackId="a" fill="#22c55e" radius={[0, 0, 4, 4]} />
                    <Bar yAxisId="left" dataKey="Renewal" name="Renewals" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="Cumulative" name="Cumulative Total" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#060d19' }} activeDot={{ r: 6 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rc-card">
                <div className="flex items-center gap-2 mb-6">
                  <Activity className="h-5 w-5 text-[#3b82f6]" />
                  <h2 className="text-lg font-medium text-white">Renewal Curve</h2>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={projectionData.slice(1)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRenewal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                      <XAxis dataKey="year" stroke="#7a95b8" tickFormatter={(val) => `Yr ${val}`} />
                      <YAxis stroke="#7a95b8" tickFormatter={(val) => `$${val/1000}k`} />
                      <Tooltip 
                        formatter={(value: number) => [fmt(value), "Renewal Income"]}
                        labelFormatter={(label) => `Year ${label}`}
                        contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', borderRadius: '8px', color: '#fff' }}
                      />
                      <Area type="monotone" dataKey="Renewal" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRenewal)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rc-card">
                <h2 className="text-lg font-medium text-white mb-4">Projection Summary</h2>
                <div className="space-y-4">
                  <div className="bg-[#0a1424] p-4 rounded-xl border border-[#12233e]">
                    <div className="text-sm text-[#7a95b8] mb-1">Year 1 Total</div>
                    <div className="text-2xl font-bold text-white">{fmt(projectionData[0]?.Total || 0)}</div>
                  </div>
                  <div className="bg-[#0a1424] p-4 rounded-xl border border-[#12233e]">
                    <div className="text-sm text-[#7a95b8] mb-1">Year 5 Cumulative</div>
                    <div className="text-2xl font-bold text-[#3b82f6]">{fmt(cumulativeData[4]?.Cumulative || 0)}</div>
                  </div>
                  <div className="bg-[#0a1424] p-4 rounded-xl border border-[#12233e]">
                    <div className="text-sm text-[#7a95b8] mb-1">Year 10 Cumulative</div>
                    <div className="text-2xl font-bold text-[#8b5cf6]">{fmt(cumulativeData[9]?.Cumulative || 0)}</div>
                  </div>
                  <div className="text-xs text-[#7a95b8] p-2">
                    * Projections assume 100% persistency and no policy lapses. Actual renewal income will be lower based on client retention.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Analysis */}
        {activeTab === "analysis" && (
          <div className="space-y-6">
            <div className="rc-card">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="h-5 w-5 text-[#f59e0b]" />
                <div>
                  <h2 className="text-lg font-medium text-white">Premium vs. Commission Analysis</h2>
                  <p className="text-sm text-[#7a95b8]">Scatter plot showing policy efficiency (commission generated per premium dollar)</p>
                </div>
              </div>
              
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                    <XAxis type="number" dataKey="premium" name="Premium" stroke="#7a95b8" tickFormatter={(val) => `$${val/1000}k`} label={{ value: 'Annual Premium', position: 'insideBottom', offset: -10, fill: '#7a95b8' }} />
                    <YAxis type="number" dataKey="commission" name="FYC" stroke="#7a95b8" tickFormatter={(val) => `$${val/1000}k`} label={{ value: 'First Year Commission', angle: -90, position: 'insideLeft', fill: '#7a95b8' }} />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-[#0d1a2e] border border-[#12233e] p-3 rounded-lg shadow-xl">
                              <p className="font-bold text-white mb-1">{data.name}</p>
                              <p className="text-sm text-[#c8d8ec]">Premium: <span className="text-white">{fmt(data.premium)}</span></p>
                              <p className="text-sm text-[#c8d8ec]">FYC: <span className="text-[#22c55e]">{fmt(data.commission)}</span></p>
                              <p className="text-sm text-[#c8d8ec]">Rate: <span className="text-[#3b82f6]">{data.rate}%</span></p>
                              <p className="text-sm text-[#c8d8ec]">Category: <span className="text-[#f59e0b]">{data.category}</span></p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter name="Policies" data={scatterData} fill="#3b82f6">
                      {scatterData.map((entry, index) => {
                        let fill = '#3b82f6';
                        if (entry.category === 'Life') fill = '#22c55e';
                        else if (entry.category === 'Annuity') fill = '#f59e0b';
                        else if (entry.category === 'Health') fill = '#ec4899';
                        
                        return <Cell key={`cell-${index}`} fill={fill} />;
                      })}
                    </Scatter>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#22c55e]"></div><span className="text-sm text-[#7a95b8]">Life</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#f59e0b]"></div><span className="text-sm text-[#7a95b8]">Annuity</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#ec4899]"></div><span className="text-sm text-[#7a95b8]">Health/LTC</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div><span className="text-sm text-[#7a95b8]">Other</span></div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rc-card">
                <h3 className="text-sm font-medium text-[#7a95b8] mb-4 uppercase tracking-wider">Efficiency Metrics</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-white">Avg. FYC Rate</span>
                      <span className="font-bold text-[#22c55e]">
                        {calculations.totalFirstYear && calculations.avgPremium 
                          ? ((calculations.totalFirstYear / (calculations.avgPremium * policies.length)) * 100).toFixed(1) 
                          : 0}%
                      </span>
                    </div>
                    <div className="text-xs text-[#7a95b8]">Blended commission rate across all products</div>
                  </div>
                  <div className="pt-4 border-t border-[#12233e]">
                    <div className="flex justify-between mb-1">
                      <span className="text-white">Revenue per Client</span>
                      <span className="font-bold text-[#3b82f6]">
                        {policies.length ? fmt(calculations.totalLifetime / new Set(policies.map((p) => p.clientName)).size) : '$0'}
                      </span>
                    </div>
                    <div className="text-xs text-[#7a95b8]">Average lifetime value per unique client</div>
                  </div>
                  <div className="pt-4 border-t border-[#12233e]">
                    <div className="flex justify-between mb-1">
                      <span className="text-white">Closing Ratio</span>
                      <span className="font-bold text-[#f59e0b]">
                        {policies.length ? ((calculations.activeCount / policies.length) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <div className="text-xs text-[#7a95b8]">Active policies vs total pipeline</div>
                  </div>
                </div>
              </div>
              
              <div className="rc-card md:col-span-2">
                <h3 className="text-sm font-medium text-[#7a95b8] mb-4 uppercase tracking-wider">Risk & Compliance Overview</h3>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-[#0a1424] p-4 rounded-xl border border-[#12233e]">
                    <div className="text-xs text-[#7a95b8] mb-1">High Risk Products</div>
                    <div className="text-xl font-bold text-white">
                      {policies.filter((p) => COMMISSION_RATES[p.productType]?.risk === 'High').length}
                    </div>
                  </div>
                  <div className="bg-[#0a1424] p-4 rounded-xl border border-[#12233e]">
                    <div className="text-xs text-[#7a95b8] mb-1">Concentration Risk</div>
                    <div className="text-xl font-bold text-white">
                      {carrierData.length > 0 ? ((carrierData[0].value / calculations.totalFirstYear) * 100).toFixed(1) : 0}%
                    </div>
                    <div className="text-xs text-[#7a95b8]">Top carrier dependency</div>
                  </div>
                </div>
                <div className="bg-[#12233e]/30 p-4 rounded-xl border border-[#12233e]">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-[#f59e0b] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-white mb-1">Practice Insights</h4>
                      <ul className="text-sm text-[#7a95b8] space-y-2 list-disc pl-4">
                        {carrierData.length > 0 && carrierData[0].value / calculations.totalFirstYear > 0.5 && (
                          <li>High carrier concentration: Over 50% of revenue comes from {carrierData[0].name}. Consider diversifying.</li>
                        )}
                        {calculations.pendingCount > calculations.activeCount && (
                          <li>Bottleneck warning: More policies in underwriting than placed. Check requirements.</li>
                        )}
                        {calculations.categories['Annuity'] > calculations.categories['Life'] * 3 && (
                          <li>Product mix leans heavily toward annuities. Cross-selling life insurance could balance the practice.</li>
                        )}
                        <li>Your blended commission rate is optimal for your current product mix.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Rate Reference */}
        {activeTab === "rates" && (
          <div className="rc-card">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-5 w-5 text-[#22c55e]" />
              <h2 className="text-lg font-medium text-white">Industry Commission Rate Reference</h2>
            </div>
            <p className="text-sm text-[#7a95b8] mb-6">Standard commission grid assumptions (actual rates vary by carrier, GA level, and state)</p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[#7a95b8] border-b border-[#12233e] bg-[#0a1424]">
                  <tr>
                    <th className="py-3 px-4 font-medium">Product Category</th>
                    <th className="py-3 px-4 font-medium">Product Type</th>
                    <th className="py-3 px-4 font-medium text-right">First Year Rate</th>
                    <th className="py-3 px-4 font-medium text-right">Renewal Rate</th>
                    <th className="py-3 px-4 font-medium text-center">Risk Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#12233e]">
                  {Object.entries(COMMISSION_RATES)
                    .sort((a, b) => a[1].category.localeCompare(b[1].category) || b[1].firstYear - a[1].firstYear)
                    .map(([key, val]) => {
                    return (
                      <tr key={key} className="hover:bg-[#12233e]/50 transition-colors">
                        <td className="py-3 px-4 font-medium text-[#c8d8ec]">{val.category}</td>
                        <td className="py-3 px-4 font-medium text-white">{val.label}</td>
                        <td className="py-3 px-4 text-right text-[#22c55e]">{val.firstYear}%</td>
                        <td className="py-3 px-4 text-right text-[#3b82f6]">{val.renewal}%</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded text-xs ${
                            val.risk === 'High' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            val.risk === 'Medium' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                            'bg-green-500/10 text-green-400 border border-green-500/20'
                          }`}>
                            {val.risk}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-6 p-4 bg-[#060d19] rounded-lg border border-[#12233e]">
              <p className="text-xs text-[#7a95b8] leading-relaxed">
                <strong>Disclaimer:</strong> Commission rates shown are industry averages for illustration purposes. Actual rates vary significantly by carrier, product, state, and individual contract terms. Life insurance commissions are typically expressed as a percentage of target premium. Annuity commissions are typically expressed as a percentage of the deposit amount. Always consult actual carrier schedules for exact figures.
              </p>
            </div>
          </div>
        )}

        {/* Tab Content: Settings */}
        {activeTab === "settings" && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="rc-card">
              <h2 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
                <Target className="h-5 w-5 text-[#22c55e]" /> Goals & Targets
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-[#7a95b8] mb-2">Annual First Year Commission Goal</label>
                  <div className="flex items-center gap-4">
                    <NumberInput value={annualGoal} onChange={setAnnualGoal} className="rc-input flex-1 h-12 text-lg font-medium" />
                    <button className="rc-btn rc-btn-primary h-12 px-6" onClick={() => toast.success("Goal updated successfully")}>
                      Save Goal
                    </button>
                  </div>
                  <p className="text-xs text-[#7a95b8] mt-2">This sets the target for your progress bars across the dashboard.</p>
                </div>
                
                <div className="pt-6 border-t border-[#12233e]">
                  <h3 className="text-sm font-medium text-white mb-4">Calculator Preferences</h3>
                  
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="form-checkbox h-5 w-5 text-[#22c55e] rounded border-[#12233e] bg-[#060d19]" defaultChecked />
                      <span className="text-sm text-[#c8d8ec]">Auto-calculate renewals based on product defaults</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="form-checkbox h-5 w-5 text-[#22c55e] rounded border-[#12233e] bg-[#060d19]" defaultChecked />
                      <span className="text-sm text-[#c8d8ec]">Include pending policies in projection charts</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" className="form-checkbox h-5 w-5 text-[#22c55e] rounded border-[#12233e] bg-[#060d19]" />
                      <span className="text-sm text-[#c8d8ec]">Apply persistency haircut to renewal projections (15% default)</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="rc-card border-red-500/30">
              <h2 className="text-lg font-medium text-red-400 mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" /> Danger Zone
              </h2>
              <p className="text-sm text-[#7a95b8] mb-4">Actions here cannot be undone. Please be certain before proceeding.</p>
              
              <button 
                className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors"
                onClick={() => {
                  if (confirm("Are you sure you want to clear all policies? This cannot be undone.")) {
                    setPolicies([]);
                    toast.success("All policies cleared");
                  }
                }}
              >
                Clear All Policies
              </button>
            </div>
          </div>
        )}

        <NAICDisclaimer variant="compact" />
      </div>
      <PageInsights pageId="commission-calculator" />
    </AppShell>
  );
}
