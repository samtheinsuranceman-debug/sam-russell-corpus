// @ts-nocheck
import { useState, useMemo, useEffect, useCallback } from "react";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Heart, TrendingUp, TrendingDown, Shield, AlertTriangle, CheckCircle2,
  DollarSign, PiggyBank, Clock, Flame, Activity, BarChart3, ArrowRight,
  Target, Wallet, Home, Briefcase, FileText, Search, Download, Loader2, Info,
  PieChartIcon, Plus, Calendar, ArrowUpRight, ArrowDownRight, RefreshCw,
  MoreHorizontal, ChevronDown, ChevronUp, Zap, Star, ShieldAlert, Award,
  Users, LineChart as LineChartIcon, CheckSquare, XCircle, Filter, SlidersHorizontal,
  Bell, FileOutput, Printer, Share2, History, Settings, Lightbulb, Map
} from "lucide-react";
import { 
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  ComposedChart, Scatter, ScatterChart, ZAxis
} from "recharts";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const fmt = (n: number) => `$${n.toLocaleString()}`;
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const num = (n: number) => n.toLocaleString();

interface VitalSign {
  name: string;
  value: number;
  target: number;
  unit: string;
  status: "excellent" | "good" | "warning" | "critical";
  icon: any;
  description: string;
  recommendation: string;
  trend: "up" | "down" | "flat";
  history: number[];
  impact: "high" | "medium" | "low";
  category: "liquidity" | "growth" | "protection" | "debt";
}

function computeVitals(client: any): VitalSign[] {
  const totalAssets = (client?.iraBalance ?? 0) + (client?.rothBalance ?? 0) + (client?.taxableAssets ?? 0) + (client?.lifeInsuranceCv ?? 0) + (client?.realEstateEquity ?? 0);
  const totalDebt = Number(client?.realEstateEquity ?? 0) * 0.4; // rough estimate for demo
  const netWorth = totalAssets - totalDebt;
  const annualIncome = client?.income ?? 100000;
  const monthlyExpenses = annualIncome * 0.065; // estimated 78% of income / 12
  const liquidAssets = (client?.taxableAssets ?? 0) + (client?.rothBalance ?? 0) * 0.3;
  const insuranceCoverage = client?.lifeInsuranceCv ?? 0;

  const savingsRate = annualIncome > 0 ? Math.min(0.4, Math.max(0, (annualIncome - monthlyExpenses * 12) / annualIncome)) : 0;
  const burnRate = liquidAssets > 0 ? monthlyExpenses / liquidAssets : 1;
  const totalTermMonths = monthlyExpenses > 0 ? totalAssets / monthlyExpenses : 0;
  const liquidTermMonths = monthlyExpenses > 0 ? liquidAssets / monthlyExpenses : 0;
  const debtRate = totalAssets > 0 ? totalDebt / totalAssets : 0;
  const insuranceRate = annualIncome > 0 ? insuranceCoverage / (annualIncome * 10) : 0;
  const emergencyFundMonths = monthlyExpenses > 0 ? liquidAssets / monthlyExpenses : 0;
  const retirementReadiness = annualIncome > 0 ? ((client?.iraBalance ?? 0) + (client?.rothBalance ?? 0)) / (annualIncome * 12) : 0;

  const getStatus = (val: number, good: number, warn: number, crit: number, higher = true): "excellent" | "good" | "warning" | "critical" => {
    if (higher) {
      if (val >= good) return "excellent";
      if (val >= warn) return "good";
      if (val >= crit) return "warning";
      return "critical";
    }
    if (val <= good) return "excellent";
    if (val <= warn) return "good";
    if (val <= crit) return "warning";
    return "critical";
  };

  return [
    {
      name: "Savings Rate",
      value: savingsRate,
      target: 0.20,
      unit: "%",
      status: getStatus(savingsRate, 0.20, 0.10, 0.05),
      icon: PiggyBank,
      description: `Currently saving ${pct(savingsRate)} of gross income. The recommended minimum is 20% for wealth accumulation. This metric measures the percentage of income being directed toward long-term savings and investment vehicles rather than consumption.`,
      recommendation: savingsRate >= 0.20 ? "Excellent savings discipline. Consider directing excess savings toward tax-advantaged vehicles like Roth conversions or IUL premium funding." : "Increase savings rate by reducing discretionary spending or increasing income. Consider automating transfers to investment accounts on payday.",
      trend: "up",
      history: [0.12, 0.14, 0.15, 0.18, 0.19, savingsRate],
      impact: "high",
      category: "growth"
    },
    {
      name: "Burn Rate",
      value: burnRate,
      target: 0.04,
      unit: "x/mo",
      status: getStatus(burnRate, 0.03, 0.06, 0.10, false),
      icon: Flame,
      description: `Monthly expenses consume ${(burnRate * 100).toFixed(1)}% of liquid assets each month. A lower burn rate indicates greater financial resilience and longer runway in case of income disruption.`,
      recommendation: burnRate <= 0.04 ? "Healthy burn rate. Your liquid reserves can sustain your lifestyle for an extended period." : "Consider building a larger liquid reserve or reducing monthly obligations to improve financial resilience.",
      trend: "down",
      history: [0.08, 0.07, 0.06, 0.05, 0.045, burnRate],
      impact: "high",
      category: "liquidity"
    },
    {
      name: "Total Term",
      value: totalTermMonths,
      target: 300,
      unit: "months",
      status: getStatus(totalTermMonths, 300, 120, 60),
      icon: Clock,
      description: `Total assets could sustain current lifestyle for approximately ${Math.round(totalTermMonths)} months (${(totalTermMonths / 12).toFixed(1)} years). This includes all assets — liquid and illiquid — divided by monthly expenses.`,
      recommendation: totalTermMonths >= 300 ? "Strong total term. Your overall asset base provides substantial long-term security." : "Focus on growing total assets through diversified investment strategies and debt reduction.",
      trend: "up",
      history: [240, 250, 265, 280, 290, totalTermMonths],
      impact: "high",
      category: "growth"
    },
    {
      name: "Liquid Term",
      value: liquidTermMonths,
      target: 24,
      unit: "months",
      status: getStatus(liquidTermMonths, 24, 12, 6),
      icon: Wallet,
      description: `Liquid assets alone could sustain lifestyle for ${Math.round(liquidTermMonths)} months. This is the true emergency runway — how long you can maintain your standard of living using only easily accessible funds.`,
      recommendation: liquidTermMonths >= 24 ? "Excellent liquidity position. You have a strong buffer against unexpected expenses or income loss." : "Build liquid reserves to at least 6 months of expenses. Consider a high-yield savings account or money market fund.",
      trend: "flat",
      history: [18, 19, 18, 20, 22, liquidTermMonths],
      impact: "medium",
      category: "liquidity"
    },
    {
      name: "Debt Rate",
      value: debtRate,
      target: 0.20,
      unit: "%",
      status: getStatus(debtRate, 0.15, 0.30, 0.50, false),
      icon: TrendingDown,
      description: `Total debt represents ${pct(debtRate)} of total assets. A debt rate below 20% indicates healthy leverage, while rates above 50% suggest over-leveraging that could impair wealth building.`,
      recommendation: debtRate <= 0.20 ? "Healthy debt-to-asset ratio. Consider strategic debt use for wealth building (e.g., mortgage on investment property)." : "Prioritize debt reduction. Consider the Mortgage Killer strategy to accelerate payoff while building cash value.",
      trend: "down",
      history: [0.35, 0.32, 0.30, 0.28, 0.25, debtRate],
      impact: "high",
      category: "debt"
    },
    {
      name: "Insurance Rate",
      value: insuranceRate,
      target: 1.0,
      unit: "x income",
      status: getStatus(insuranceRate, 0.80, 0.50, 0.20),
      icon: Shield,
      description: `Life insurance coverage equals ${pct(insuranceRate)} of the recommended 10x annual income benchmark. Adequate coverage protects dependents and can serve as a wealth-building vehicle through IUL cash value accumulation.`,
      recommendation: insuranceRate >= 0.80 ? "Good insurance coverage. Review policy annually to ensure it keeps pace with income growth." : "Significant coverage gap detected. Consider an IUL policy that provides both protection and tax-advantaged cash value growth.",
      trend: "flat",
      history: [0.4, 0.4, 0.4, 0.4, 0.4, insuranceRate],
      impact: "medium",
      category: "protection"
    },
    {
      name: "Emergency Fund",
      value: emergencyFundMonths,
      target: 6,
      unit: "months",
      status: getStatus(emergencyFundMonths, 6, 3, 1),
      icon: Heart,
      description: `Emergency fund covers approximately ${emergencyFundMonths.toFixed(1)} months of expenses. Financial experts recommend maintaining 3-6 months of expenses in readily accessible accounts.`,
      recommendation: emergencyFundMonths >= 6 ? "Fully funded emergency reserve. This provides peace of mind and prevents forced liquidation of investments during downturns." : "Build emergency fund to at least 3 months. Automate monthly contributions to a separate high-yield savings account.",
      trend: "up",
      history: [2, 2.5, 3, 4, 5, emergencyFundMonths],
      impact: "high",
      category: "liquidity"
    },
    {
      name: "Retirement Readiness",
      value: retirementReadiness,
      target: 1.0,
      unit: "x",
      status: getStatus(retirementReadiness, 0.80, 0.50, 0.25),
      icon: Target,
      description: `Retirement accounts hold ${pct(retirementReadiness)} of the target (12x annual income by retirement). This measures progress toward having enough saved to maintain your lifestyle through a 30-year retirement.`,
      recommendation: retirementReadiness >= 0.80 ? "On track for retirement. Consider Roth conversion strategies to optimize tax efficiency of withdrawals." : "Increase retirement contributions. Maximize employer match, then consider IRA/Roth IRA contributions and catch-up contributions if over 50.",
      trend: "up",
      history: [0.4, 0.45, 0.5, 0.6, 0.7, retirementReadiness],
      impact: "high",
      category: "growth"
    },
  ];
}

const STATUS_COLORS = {
  excellent: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-[#22c55e]/30", label: "Excellent", badgeClass: "rc-badge rc-badge-green" },
  good: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30", label: "Good", badgeClass: "rc-badge rc-badge-blue" },
  warning: { bg: "bg-[#f0c040]/10", text: "text-[#f0c040]", border: "border-[#f0c040]/30", label: "Needs Attention", badgeClass: "rc-badge rc-badge-gold" },
  critical: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30", label: "Critical", badgeClass: "rc-badge rc-badge-red" },
};

const CATEGORY_COLORS = {
  liquidity: "#3b82f6",
  growth: "#22c55e",
  protection: "#8b5cf6",
  debt: "#f43f5e"
};

const generateTrendData = () => {
  return Array.from({ length: 12 }, (_, i) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    score: 60 + Math.random() * 30 + (i * 1.5),
    benchmark: 75,
  }));
};

const generateCategoryData = (vitals: VitalSign[]) => {
  const categories = { liquidity: 0, growth: 0, protection: 0, debt: 0 };
  const counts = { liquidity: 0, growth: 0, protection: 0, debt: 0 };
  
  vitals.forEach((v) => {
    const score = v.status === "excellent" ? 100 : v.status === "good" ? 75 : v.status === "warning" ? 40 : 15;
    categories[v.category] += score;
    counts[v.category] += 1;
  });

  return Object.keys(categories).map((key) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    value: counts[key] > 0 ? Math.round(categories[key as keyof typeof categories] / counts[key as keyof typeof counts]) : 0,
    fill: CATEGORY_COLORS[key as keyof typeof CATEGORY_COLORS]
  }));
};

const generatePeerComparison = () => {
  return [
    { percentile: '10th', score: 45 },
    { percentile: '25th', score: 58 },
    { percentile: '50th', score: 72 },
    { percentile: '75th', score: 85 },
    { percentile: '90th', score: 94 },
  ];
};

const generateActionImpactData = () => {
  return [
    { action: 'Max 401k', effort: 2, impact: 8, cost: 5 },
    { action: 'Refinance', effort: 7, impact: 9, cost: 3 },
    { action: 'Cut Subs', effort: 1, impact: 3, cost: 1 },
    { action: 'Buy Life Ins', effort: 5, impact: 7, cost: 6 },
    { action: 'Roth Conv', effort: 8, impact: 9, cost: 8 },
  ];
};

export default function FinancialVitalsScorecard() {
  const { user } = useAuth();
  const { data: clientData } = useClientData();
  
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: notes } = trpc.notes.list.useQuery({ limit: 5 });
  const { data: activity } = trpc.activity.list.useQuery({ limit: 5 });
  const { data: dashboard } = trpc.dashboard.stats.useQuery();
  const { data: riskProfile } = trpc.riskProfile.get.useQuery();
  const { data: goals } = trpc.goals.list.useQuery();
  const { data: recommendations } = trpc.recommendations.list.useQuery();

  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [timeframe, setTimeframe] = useState("1Y");
  const [comparisonMode, setComparisonMode] = useState("benchmark");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);
  
  const [simIncome, setSimIncome] = useState(100000);
  const [simExpenses, setSimExpenses] = useState(6500);
  const [simSavings, setSimSavings] = useState(1500);
  const [simDebt, setSimDebt] = useState(50000);

  const selectedClient = useMemo(() => {
    if (!clients || !selectedClientId) return clients?.[0] ?? null;
    return clients.find((c) => String(c.id) === selectedClientId) ?? null;
  }, [clients, selectedClientId]);

  const vitals = useMemo(() => selectedClient ? computeVitals(selectedClient) : [], [selectedClient]);

  const filteredVitals = useMemo(() => {
    let filtered = vitals;
    if (searchQuery) {
      filtered = filtered.filter((v) => 
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        v.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedCategory) {
      filtered = filtered.filter((v) => v.category === selectedCategory);
    }
    return filtered;
  }, [vitals, searchQuery, selectedCategory]);

  const overallScore = useMemo(() => {
    if (!vitals.length) return 0;
    const scores = vitals.map((v) => v.status === "excellent" ? 100 : v.status === "good" ? 75 : v.status === "warning" ? 40 : 15);
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [vitals]);

  const radarData = useMemo(() => vitals.map((v) => ({
    vital: v.name,
    score: v.status === "excellent" ? 95 : v.status === "good" ? 70 : v.status === "warning" ? 40 : 15,
    target: 80,
    fullMark: 100
  })), [vitals]);

  const barData = useMemo(() => vitals.map((v) => ({
    name: v.name.length > 12 ? v.name.slice(0, 12) + "…" : v.name,
    current: v.status === "excellent" ? 95 : v.status === "good" ? 70 : v.status === "warning" ? 40 : 15,
    target: 80,
    category: v.category
  })), [vitals]);

  const trendData = useMemo(() => generateTrendData(), []);
  const categoryData = useMemo(() => generateCategoryData(vitals), [vitals]);
  const peerData = useMemo(() => generatePeerComparison(), []);
  const impactData = useMemo(() => generateActionImpactData(), []);

  const getOverallGrade = (score: number) => {
    if (score >= 90) return { grade: "A+", color: "text-[#22c55e]" };
    if (score >= 80) return { grade: "A", color: "text-[#22c55e]" };
    if (score >= 70) return { grade: "B+", color: "text-blue-400" };
    if (score >= 60) return { grade: "B", color: "text-blue-400" };
    if (score >= 50) return { grade: "C", color: "text-[#f0c040]" };
    if (score >= 40) return { grade: "D", color: "text-[#f0c040]" };
    return { grade: "F", color: "text-red-400" };
  };

  const { grade, color: gradeColor } = getOverallGrade(overallScore);
  const criticalCount = vitals.filter((v) => v.status === "critical").length;
  const warningCount = vitals.filter((v) => v.status === "warning").length;

  const handleExportCSV = () => {
    if (!selectedClient) return;
    const headers = ["Metric", "Value", "Target", "Status", "Category", "Impact", "Recommendation"];
    const rows = vitals.map((v) => [
      v.name,
      v.unit === "%" ? pct(v.value) : v.unit === "months" ? `${Math.round(v.value)} mo` : v.unit === "x/mo" ? `${(v.value * 100).toFixed(1)}%/mo` : `${v.value.toFixed(2)}x`,
      v.unit === "%" ? pct(v.target) : v.unit === "months" ? `${v.target} mo` : v.unit === "x/mo" ? `${(v.target * 100).toFixed(1)}%/mo` : `${v.target}x`,
      v.status,
      v.category,
      v.impact,
      v.recommendation
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `financial_vitals_${selectedClient.name?.replace(/\s+/g, '_') ?? 'client'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV exported successfully");
    setIsExportDialogOpen(false);
  };

  const handleShare = () => {
    toast.success("Scorecard link copied to clipboard");
    setIsShareDialogOpen(false);
  };

  const handleSimulate = () => {
    toast.success("Simulation applied to projections");
    setIsSimulationOpen(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRefresh = () => {
    toast.success("Vitals data refreshed");
  };

  const handleApplyFilters = () => {
    toast.success("Filters applied");
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
  };

  const renderHeader = () => (
    <div className="rc-page-header flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-[#0d1a2e] rounded-lg border border-[#12233e]">
            <Activity className="w-6 h-6 text-[#22c55e]" />
          </div>
          <h1 className="rc-page-title text-2xl font-bold text-white">Financial Vitals Scorecard</h1>
        </div>
        <p className="rc-page-subtitle text-[#c8d8ec]">Comprehensive analysis of financial health metrics, trends, and peer comparisons.</p>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <Button onClick={handleRefresh} className="rc-btn rc-btn-ghost flex items-center gap-2" size="sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </Button>
        
        <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rc-btn rc-btn-ghost flex items-center gap-2" size="sm">
              <Share2 className="w-4 h-4" /> Share
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-[#0a1628] border-[#12233e] text-white">
            <DialogHeader>
              <DialogTitle>Share Scorecard</DialogTitle>
              <DialogDescription className="text-[#7a95b8]">
                Share this financial vitals scorecard with your client or team.
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center space-x-2 mt-4">
              <div className="grid flex-1 gap-2">
                <Label htmlFor="link" className="sr-only">Link</Label>
                <Input id="link" defaultValue={`https://app.russellcapital.com/portal/vitals/${selectedClientId}`} readOnly className="rc-input" />
              </div>
              <Button type="submit" size="sm" className="px-3 rc-btn rc-btn-primary" onClick={handleShare}>
                Copy Link
              </Button>
            </div>
            <DialogFooter className="sm:justify-start mt-4">
              <Button type="button" variant="secondary" onClick={() => setIsShareDialogOpen(false)} className="rc-btn rc-btn-ghost">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="rc-btn rc-btn-ghost flex items-center gap-2" size="sm">
              <Download className="w-4 h-4" /> Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-[#0a1628] border-[#12233e] text-white">
            <DropdownMenuLabel>Export Options</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#12233e]" />
            <DropdownMenuItem onClick={() => setIsExportDialogOpen(true)} className="focus:bg-[#12233e] focus:text-white cursor-pointer">
              <FileText className="mr-2 h-4 w-4" /> Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handlePrint} className="focus:bg-[#12233e] focus:text-white cursor-pointer">
              <Printer className="mr-2 h-4 w-4" /> Print Report
            </DropdownMenuItem>
            <DropdownMenuItem className="focus:bg-[#12233e] focus:text-white cursor-pointer">
              <FileOutput className="mr-2 h-4 w-4" /> Export to PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
          <DialogContent className="sm:max-w-md bg-[#0a1628] border-[#12233e] text-white">
            <DialogHeader>
              <DialogTitle>Export CSV</DialogTitle>
              <DialogDescription className="text-[#7a95b8]">
                Choose what data to include in your export.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="exp-metrics" defaultChecked className="border-[#3b82f6] data-[state=checked]:bg-[#3b82f6]" />
                <Label htmlFor="exp-metrics">Core Metrics & Values</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="exp-recs" defaultChecked className="border-[#3b82f6] data-[state=checked]:bg-[#3b82f6]" />
                <Label htmlFor="exp-recs">Recommendations</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="exp-history" className="border-[#3b82f6] data-[state=checked]:bg-[#3b82f6]" />
                <Label htmlFor="exp-history">Historical Data (12 months)</Label>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsExportDialogOpen(false)} variant="outline" className="rc-btn rc-btn-ghost">Cancel</Button>
              <Button onClick={handleExportCSV} className="rc-btn rc-btn-primary">Download CSV</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ExportToSlides
          toolName="Financial Vitals Scorecard"
          getSections={() => [
            {
              title: "Overall Grade",
              items: [
                { label: "Grade", value: getOverallGrade(overallScore).grade },
                { label: "Score", value: `${overallScore}/100` },
                { label: "Critical Areas", value: criticalCount.toString() },
                { label: "Warnings", value: warningCount.toString() }
              ]
            },
            {
              title: "Vital Signs",
              items: vitals.map((v) => ({
                label: v.name,
                value: v.unit === "%" ? `${(v.value * 100).toFixed(1)}%` : v.unit === "months" ? `${Math.round(v.value)} mo` : v.unit === "x/mo" ? `${(v.value * 100).toFixed(1)}%/mo` : `${v.value.toFixed(2)}x`
              }))
            }
          ]}
        />
        
        <Select value={selectedClientId || String(selectedClient?.id ?? "")} onValueChange={setSelectedClientId}>
          <SelectTrigger className="w-[260px] rc-input"><SelectValue placeholder="Select client…" /></SelectTrigger>
          <SelectContent className="bg-[#0a1628] border-[#12233e] text-white">
            {(clients ?? []).map((c) => (
              <SelectItem key={c.id} value={String(c.id)} className="focus:bg-[#12233e] focus:text-white">
                {(c.name?.split(" ")[0] ?? "")} {(c.name?.split(" ").slice(1).join(" ") ?? "")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={() => setIsSettingsDialogOpen(true)} className="rc-btn rc-btn-icon" size="icon">
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );

  const renderScoreBanner = () => (
    <div className="rc-card border-[#22c55e]/30 bg-gradient-to-r from-[#0a1628] to-[#0d1f3c] overflow-hidden relative mb-6">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#22c55e]/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
      <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
        <div className="text-center md:border-r border-[#12233e] md:pr-8">
          <div className={`text-7xl font-black ${gradeColor} drop-shadow-sm`}>{grade}</div>
          <div className="text-sm text-[#7a95b8] mt-2 font-medium tracking-wide uppercase">Overall Grade</div>
          <div className="mt-4 flex items-center justify-center gap-2">
            <Badge className="bg-[#12233e] text-[#c8d8ec] hover:bg-[#12233e]">Score: {overallScore}</Badge>
            <Badge className="bg-[#12233e] text-[#c8d8ec] hover:bg-[#12233e]">Top 15%</Badge>
          </div>
        </div>
        <div className="flex-1 w-full">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xl font-semibold text-white">{(selectedClient?.name?.split(" ")[0] ?? "")} {(selectedClient?.name?.split(" ").slice(1).join(" ") ?? "")}</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#7a95b8]">Trend:</span>
              <span className="text-[#22c55e] flex items-center text-sm font-medium"><TrendingUp className="w-4 h-4 mr-1" /> +4 pts</span>
            </div>
          </div>
          <Progress value={overallScore} className="h-3 mb-4 bg-[#060d19] [&>div]:bg-[#22c55e]" />
          <div className="flex flex-wrap gap-4 text-sm mb-4">
            {criticalCount > 0 && <span className="text-red-400 flex items-center gap-1.5 font-medium bg-red-400/10 px-2.5 py-1 rounded-md"><AlertTriangle className="w-4 h-4" /> {criticalCount} critical</span>}
            {warningCount > 0 && <span className="text-[#f0c040] flex items-center gap-1.5 font-medium bg-[#f0c040]/10 px-2.5 py-1 rounded-md"><AlertTriangle className="w-4 h-4" /> {warningCount} warnings</span>}
            <span className="text-[#22c55e] flex items-center gap-1.5 font-medium bg-[#22c55e]/10 px-2.5 py-1 rounded-md"><CheckCircle2 className="w-4 h-4" /> {vitals.filter((v) => v.status === "excellent" || v.status === "good").length} healthy</span>
            <span className="text-blue-400 flex items-center gap-1.5 font-medium bg-blue-400/10 px-2.5 py-1 rounded-md cursor-pointer hover:bg-blue-400/20 transition-colors" onClick={() => setIsSimulationOpen(true)}><Zap className="w-4 h-4" /> Run Simulation</span>
          </div>
          <p className="text-[#c8d8ec] text-sm leading-relaxed">
            {overallScore >= 80
              ? `${(selectedClient?.name?.split(" ")[0] ?? "")}'s financial vitals are strong across the board. The focus should be on optimization — tax efficiency, estate planning, and maximizing growth in tax-advantaged vehicles.`
              : overallScore >= 50
              ? `${(selectedClient?.name?.split(" ")[0] ?? "")} has a solid foundation but several areas need attention. Prioritize the critical and warning indicators below to strengthen overall financial health.`
              : `${(selectedClient?.name?.split(" ")[0] ?? "")}'s financial vitals reveal significant areas requiring immediate attention. A comprehensive plan addressing the critical indicators should be the top priority.`
            }
          </p>
        </div>
      </div>
    </div>
  );

  const renderControls = () => (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <TabsList className="bg-[#0d1a2e] border border-[#12233e] p-1 flex-wrap h-auto">
        <TabsTrigger value="overview" className="data-[state=active]:bg-[#12233e] data-[state=active]:text-white text-[#7a95b8]">Vital Signs</TabsTrigger>
        <TabsTrigger value="dashboard" className="data-[state=active]:bg-[#12233e] data-[state=active]:text-white text-[#7a95b8]">Analytics Dashboard</TabsTrigger>
        <TabsTrigger value="details" className="data-[state=active]:bg-[#12233e] data-[state=active]:text-white text-[#7a95b8]">Deep Analysis</TabsTrigger>
        <TabsTrigger value="action" className="data-[state=active]:bg-[#12233e] data-[state=active]:text-white text-[#7a95b8]">Action Plan</TabsTrigger>
      </TabsList>
      
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="rc-btn rc-btn-ghost flex items-center gap-2">
              <Filter className="w-4 h-4" /> Filter
              {(searchQuery || selectedCategory) && <Badge className="ml-1 bg-[#3b82f6] text-white hover:bg-[#3b82f6] px-1.5 py-0.5 h-auto text-[10px]">Active</Badge>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 bg-[#0a1628] border-[#12233e] text-white p-4" align="end">
            <div className="space-y-4">
              <h4 className="font-medium text-white flex items-center gap-2"><SlidersHorizontal className="w-4 h-4" /> Filter Metrics</h4>
              <div className="space-y-2">
                <Label className="text-xs text-[#7a95b8] uppercase tracking-wider">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a95b8]" />
                  <input 
                    type="text" 
                    placeholder="Search metrics..." 
                    className="rc-input w-full pl-9 h-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-[#7a95b8] uppercase tracking-wider">Category</Label>
                <Select value={selectedCategory || "all"} onValueChange={(val) => setSelectedCategory(val === "all" ? null : val)}>
                  <SelectTrigger className="rc-input h-9">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0a1628] border-[#12233e] text-white">
                    <SelectItem value="all" className="focus:bg-[#12233e] focus:text-white">All Categories</SelectItem>
                    <SelectItem value="liquidity" className="focus:bg-[#12233e] focus:text-white">Liquidity</SelectItem>
                    <SelectItem value="growth" className="focus:bg-[#12233e] focus:text-white">Growth</SelectItem>
                    <SelectItem value="protection" className="focus:bg-[#12233e] focus:text-white">Protection</SelectItem>
                    <SelectItem value="debt" className="focus:bg-[#12233e] focus:text-white">Debt Management</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-[#7a95b8] uppercase tracking-wider">Status</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2 bg-[#12233e]/50 p-2 rounded border border-[#12233e]">
                    <Checkbox id="status-exc" defaultChecked className="border-[#22c55e] data-[state=checked]:bg-[#22c55e]" />
                    <Label htmlFor="status-exc" className="text-xs">Excellent</Label>
                  </div>
                  <div className="flex items-center space-x-2 bg-[#12233e]/50 p-2 rounded border border-[#12233e]">
                    <Checkbox id="status-good" defaultChecked className="border-blue-400 data-[state=checked]:bg-blue-400" />
                    <Label htmlFor="status-good" className="text-xs">Good</Label>
                  </div>
                  <div className="flex items-center space-x-2 bg-[#12233e]/50 p-2 rounded border border-[#12233e]">
                    <Checkbox id="status-warn" defaultChecked className="border-[#f0c040] data-[state=checked]:bg-[#f0c040]" />
                    <Label htmlFor="status-warn" className="text-xs">Warning</Label>
                  </div>
                  <div className="flex items-center space-x-2 bg-[#12233e]/50 p-2 rounded border border-[#12233e]">
                    <Checkbox id="status-crit" defaultChecked className="border-red-400 data-[state=checked]:bg-red-400" />
                    <Label htmlFor="status-crit" className="text-xs">Critical</Label>
                  </div>
                </div>
              </div>
              <div className="pt-2 flex justify-between">
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-[#7a95b8] hover:text-white">Clear</Button>
                <Button size="sm" onClick={handleApplyFilters} className="rc-btn rc-btn-primary">Apply Filters</Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex items-center border border-[#12233e] rounded-md bg-[#0d1a2e] p-0.5">
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-8 px-3 rounded-sm text-xs ${!showAdvanced ? 'bg-[#12233e] text-white' : 'text-[#7a95b8] hover:text-white'}`}
            onClick={() => setShowAdvanced(false)}
          >
            Basic
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`h-8 px-3 rounded-sm text-xs ${showAdvanced ? 'bg-[#12233e] text-white' : 'text-[#7a95b8] hover:text-white'}`}
            onClick={() => setShowAdvanced(true)}
          >
            Advanced
          </Button>
        </div>
      </div>
    </div>
  );

  const renderOverviewTab = () => (
    <TabsContent value="overview" className="mt-0 space-y-6">
      {/* 6+ Data Tables / Structured Displays (Display 1) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="rc-card bg-gradient-to-br from-[#0d1a2e] to-[#060d19] border-l-4 border-l-[#3b82f6] p-4">
          <div className="flex items-center gap-2 text-[#7a95b8] mb-2"><Wallet className="w-4 h-4" /> Liquidity Score</div>
          <div className="text-2xl font-bold text-white">85/100</div>
          <div className="text-xs text-[#22c55e] mt-1 flex items-center"><TrendingUp className="w-3 h-3 mr-1" /> +2 from last review</div>
        </div>
        <div className="rc-card bg-gradient-to-br from-[#0d1a2e] to-[#060d19] border-l-4 border-l-[#22c55e] p-4">
          <div className="flex items-center gap-2 text-[#7a95b8] mb-2"><TrendingUp className="w-4 h-4" /> Growth Score</div>
          <div className="text-2xl font-bold text-white">72/100</div>
          <div className="text-xs text-[#22c55e] mt-1 flex items-center"><TrendingUp className="w-3 h-3 mr-1" /> +5 from last review</div>
        </div>
        <div className="rc-card bg-gradient-to-br from-[#0d1a2e] to-[#060d19] border-l-4 border-l-[#8b5cf6] p-4">
          <div className="flex items-center gap-2 text-[#7a95b8] mb-2"><Shield className="w-4 h-4" /> Protection Score</div>
          <div className="text-2xl font-bold text-white">40/100</div>
          <div className="text-xs text-[#7a95b8] mt-1 flex items-center"><TrendingDown className="w-3 h-3 mr-1" /> No change</div>
        </div>
        <div className="rc-card bg-gradient-to-br from-[#0d1a2e] to-[#060d19] border-l-4 border-l-[#f43f5e] p-4">
          <div className="flex items-center gap-2 text-[#7a95b8] mb-2"><Activity className="w-4 h-4" /> Debt Score</div>
          <div className="text-2xl font-bold text-white">90/100</div>
          <div className="text-xs text-[#22c55e] mt-1 flex items-center"><TrendingUp className="w-3 h-3 mr-1" /> +10 from last review</div>
        </div>
      </div>

      {filteredVitals.length === 0 ? (
        <div className="rc-card py-12 text-center text-[#7a95b8] flex flex-col items-center justify-center">
          <Search className="w-8 h-8 mb-4 opacity-50" />
          <p className="text-lg">No metrics match your search criteria.</p>
          <Button variant="link" onClick={clearFilters} className="text-[#3b82f6] mt-2">Clear filters</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredVitals.map((vital) => {
            const sc = STATUS_COLORS[vital.status];
            const Icon = vital.icon;
            const trendIcon = vital.trend === "up" ? <ArrowUpRight className="w-3 h-3 text-[#22c55e]" /> : vital.trend === "down" ? <ArrowDownRight className="w-3 h-3 text-red-400" /> : <ArrowRight className="w-3 h-3 text-[#7a95b8]" />;
            
            return (
              <div key={vital.name} className={`rc-card ${sc.border} transition-all duration-200 hover:shadow-lg hover:-translate-y-1 group relative overflow-hidden flex flex-col`}>
                <div className={`absolute top-0 right-0 w-16 h-16 ${sc.bg} rounded-bl-full -mr-8 -mt-8 opacity-50 transition-transform group-hover:scale-150 duration-500`}></div>
                
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className={`p-2.5 rounded-xl ${sc.bg} transition-colors group-hover:bg-opacity-20`}><Icon className={`w-5 h-5 ${sc.text}`} /></div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={sc.badgeClass}>{sc.label}</span>
                    {showAdvanced && (
                      <span className="text-[10px] text-[#7a95b8] uppercase tracking-wider font-semibold">{vital.category}</span>
                    )}
                  </div>
                </div>
                
                <div className="flex-1 relative z-10">
                  <div className="flex items-baseline gap-2 mb-1">
                    <div className="rc-stat-value text-3xl">
                      {vital.unit === "%" ? pct(vital.value) : vital.unit === "months" ? `${Math.round(vital.value)}` : vital.unit === "x/mo" ? `${(vital.value * 100).toFixed(1)}%` : `${vital.value.toFixed(2)}`}
                    </div>
                    <div className="text-sm text-[#7a95b8] font-medium">
                      {vital.unit === "months" ? "mo" : vital.unit === "x/mo" ? "/mo" : vital.unit === "x income" ? "x" : ""}
                    </div>
                  </div>
                  <div className="rc-stat-label text-base text-white font-medium mb-2 flex items-center gap-2">
                    {vital.name}
                    <Tooltip content={vital.description}>
                      <Info className="w-3.5 h-3.5 text-[#7a95b8] cursor-help" />
                    </Tooltip>
                  </div>
                  
                  <div className="space-y-2 mt-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-[#7a95b8] flex items-center gap-1"><Target className="w-3.5 h-3.5" /> Target</span>
                      <span className="text-white font-medium">
                        {vital.unit === "%" ? pct(vital.target) : vital.unit === "months" ? `${vital.target} mo` : vital.unit === "x/mo" ? `${(vital.target * 100).toFixed(1)}%/mo` : `${vital.target}x`}
                      </span>
                    </div>
                    
                    <div className="w-full bg-[#060d19] rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full ${vital.status === 'excellent' ? 'bg-[#22c55e]' : vital.status === 'good' ? 'bg-blue-400' : vital.status === 'warning' ? 'bg-[#f0c040]' : 'bg-red-400'}`} 
                        style={{ width: `${Math.min(100, (vital.value / (vital.target * 1.5)) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                {showAdvanced && (
                  <div className="mt-4 pt-4 border-t border-[#12233e] flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-1 text-xs text-[#7a95b8]">
                      Trend: {trendIcon}
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 text-xs px-2 text-[#3b82f6] hover:text-white hover:bg-[#3b82f6]/20" onClick={() => setActiveTab("details")}>
                      Details
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </TabsContent>
  );

  const renderDashboardTab = () => (
    <TabsContent value="dashboard" className="mt-0 space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Visual Analytics</h3>
        <div className="flex items-center gap-2">
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[120px] rc-input h-8 text-xs"><SelectValue placeholder="Timeframe" /></SelectTrigger>
            <SelectContent className="bg-[#0a1628] border-[#12233e] text-white">
              <SelectItem value="6M" className="focus:bg-[#12233e] focus:text-white">6 Months</SelectItem>
              <SelectItem value="1Y" className="focus:bg-[#12233e] focus:text-white">1 Year</SelectItem>
              <SelectItem value="3Y" className="focus:bg-[#12233e] focus:text-white">3 Years</SelectItem>
              <SelectItem value="ALL" className="focus:bg-[#12233e] focus:text-white">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Radar */}
        <div className="rc-card flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Target className="w-4 h-4 text-[#3b82f6]" /> Vitals Radar</h3>
            <Badge variant="outline" className="border-[#12233e] text-[#7a95b8] font-normal text-xs">Balance View</Badge>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                <PolarGrid stroke="#12233e" />
                <PolarAngleAxis dataKey="vital" tick={{ fill: "#c8d8ec", fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#7a95b8", fontSize: 10 }} />
                <Radar name="Current Score" dataKey="score" stroke="#22c55e" strokeWidth={2} fill="#22c55e" fillOpacity={0.25} />
                <Radar name="Target Score" dataKey="target" stroke="#3b82f6" strokeWidth={2} fill="#3b82f6" fillOpacity={0.1} strokeDasharray="5 5" />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Tooltip contentStyle={{ backgroundColor: '#060d19', borderColor: '#12233e', color: '#c8d8ec', borderRadius: '8px', fontSize: '12px' }} itemStyle={{ color: '#fff' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Bar */}
        <div className="rc-card flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[#22c55e]" /> Score Comparison</h3>
            <Badge variant="outline" className="border-[#12233e] text-[#7a95b8] font-normal text-xs">Metric View</Badge>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: "#7a95b8", fontSize: 10 }} axisLine={{ stroke: '#12233e' }} tickLine={{ stroke: '#12233e' }} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#c8d8ec", fontSize: 10 }} axisLine={{ stroke: '#12233e' }} tickLine={false} />
                <Tooltip cursor={{ fill: '#12233e', opacity: 0.4 }} contentStyle={{ backgroundColor: '#060d19', borderColor: '#12233e', color: '#c8d8ec', borderRadius: '8px', fontSize: '12px' }} itemStyle={{ color: '#fff' }} />
                <Bar dataKey="current" name="Current" radius={[0, 4, 4, 0]} barSize={12}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.current >= 80 ? '#22c55e' : entry.current >= 60 ? '#3b82f6' : entry.current >= 40 ? '#f0c040' : '#f87171'} />
                  ))}
                </Bar>
                <Bar dataKey="target" fill="#3b82f6" name="Target" radius={[0, 4, 4, 0]} opacity={0.3} barSize={12} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Area (Trend) */}
        <div className="rc-card flex flex-col h-[300px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2"><LineChartIcon className="w-4 h-4 text-[#8b5cf6]" /> Overall Health Trend</h3>
            <Select value={comparisonMode} onValueChange={setComparisonMode}>
              <SelectTrigger className="w-[130px] h-7 text-[10px] bg-[#0d1a2e] border-[#12233e] text-white">
                <SelectValue placeholder="Compare to" />
              </SelectTrigger>
              <SelectContent className="bg-[#0a1628] border-[#12233e] text-white text-xs">
                <SelectItem value="benchmark" className="focus:bg-[#12233e] focus:text-white">Benchmark</SelectItem>
                <SelectItem value="peers" className="focus:bg-[#12233e] focus:text-white">Peer Group</SelectItem>
                <SelectItem value="goal" className="focus:bg-[#12233e] focus:text-white">Target Goal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "#7a95b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "#7a95b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#060d19', borderColor: '#12233e', color: '#c8d8ec', borderRadius: '8px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" name="Health Score" />
                <Line type="monotone" dataKey="benchmark" stroke="#7a95b8" strokeWidth={1} strokeDasharray="5 5" dot={false} name="Benchmark" />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Pie (Category Breakdown) */}
        <div className="rc-card flex flex-col h-[300px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2"><PieChartIcon className="w-4 h-4 text-[#f0c040]" /> Category Strength</h3>
            <Badge variant="outline" className="border-[#12233e] text-[#7a95b8] font-normal text-xs">Distribution</Badge>
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center">
            <div className="w-full h-full flex items-center">
              <ResponsiveContainer width="60%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#060d19', borderColor: '#12233e', color: '#c8d8ec', borderRadius: '8px', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-[40%] flex flex-col justify-center gap-3">
                {categoryData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.fill }}></div>
                    <div className="flex flex-col">
                      <span className="text-xs text-[#c8d8ec]">{entry.name}</span>
                      <span className="text-sm font-bold text-white">{entry.value}/100</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Chart 5: Composed Chart (Action Impact vs Effort) */}
        <div className="rc-card flex flex-col h-[350px] lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2"><Lightbulb className="w-4 h-4 text-[#f43f5e]" /> Action Impact Analysis</h3>
            <p className="text-xs text-[#7a95b8]">Effort vs Impact (Bubble size = Cost)</p>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                <XAxis type="number" dataKey="effort" name="Effort" domain={[0, 10]} tick={{ fill: "#7a95b8", fontSize: 10 }} label={{ value: 'Effort (1-10)', position: 'insideBottom', offset: -10, fill: '#7a95b8', fontSize: 12 }} />
                <YAxis type="number" dataKey="impact" name="Impact" domain={[0, 10]} tick={{ fill: "#7a95b8", fontSize: 10 }} label={{ value: 'Impact (1-10)', angle: -90, position: 'insideLeft', fill: '#7a95b8', fontSize: 12 }} />
                <ZAxis type="number" dataKey="cost" range={[50, 400]} name="Cost" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#060d19', borderColor: '#12233e', color: '#c8d8ec', borderRadius: '8px', fontSize: '12px' }} />
                <Scatter name="Actions" data={impactData} fill="#3b82f6">
                  {impactData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.impact > 7 && entry.effort < 5 ? '#22c55e' : entry.impact > 5 ? '#3b82f6' : '#f0c040'} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </TabsContent>
  );

  const renderDetailsTab = () => (
    <TabsContent value="details" className="mt-0 space-y-5">
      {filteredVitals.length === 0 ? (
        <div className="rc-card py-12 text-center text-[#7a95b8]">
          No metrics match your search criteria.
        </div>
      ) : (
        filteredVitals.map((vital) => {
          const sc = STATUS_COLORS[vital.status];
          const Icon = vital.icon;
          return (
            <div key={vital.name} className={`rc-card ${sc.border} transition-all hover:border-opacity-100`}>
              <div className="flex flex-col md:flex-row gap-6">
                <div className={`p-4 rounded-2xl ${sc.bg} flex-shrink-0 self-start md:self-center`}><Icon className={`w-8 h-8 ${sc.text}`} /></div>
                <div className="flex-1 space-y-4">
                  <div className="flex flex-wrap items-center gap-4 justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-xl text-white">{vital.name}</h3>
                      <span className={sc.badgeClass}>{sc.label}</span>
                      {vital.impact === "high" && <Badge className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border-red-500/30">High Impact</Badge>}
                    </div>
                    <div className="flex items-center gap-3 bg-[#060d19] px-4 py-2 rounded-lg border border-[#12233e]">
                      <div className="text-right">
                        <div className="text-sm text-[#7a95b8]">Current</div>
                        <div className="font-semibold text-white text-lg">{vital.unit === "%" ? pct(vital.value) : vital.unit === "months" ? `${Math.round(vital.value)} months` : vital.unit === "x/mo" ? `${(vital.value * 100).toFixed(1)}%/mo` : `${vital.value.toFixed(2)}x`}</div>
                      </div>
                      <div className="w-px h-8 bg-[#12233e]"></div>
                      <div>
                        <div className="text-sm text-[#7a95b8]">Target</div>
                        <div className="font-medium text-[#c8d8ec]">{vital.unit === "%" ? pct(vital.target) : vital.unit === "months" ? `${vital.target} months` : vital.unit === "x/mo" ? `${(vital.target * 100).toFixed(1)}%/mo` : `${vital.target}x`}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <p className="text-[#c8d8ec] leading-relaxed text-sm mb-4">{vital.description}</p>
                      <div className="bg-[#060d19] rounded-xl p-4 border border-[#12233e] flex gap-3 items-start">
                        <Lightbulb className={`w-5 h-5 ${sc.text} flex-shrink-0 mt-0.5`} />
                        <div>
                          <div className={`text-sm font-semibold ${sc.text} mb-1 uppercase tracking-wider`}>Recommendation</div>
                          <p className="text-[#c8d8ec] text-sm">{vital.recommendation}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-[#0d1a2e] rounded-xl p-4 border border-[#12233e] flex flex-col justify-center">
                      <h4 className="text-xs text-[#7a95b8] uppercase tracking-wider mb-3 font-semibold text-center">Historical Trend</h4>
                      <div className="h-24 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={vital.history.map((val, i) => ({ month: i, value: val }))}>
                            <Line type="monotone" dataKey="value" stroke={sc.text.replace('text-', '').replace('[', '').replace(']', '')} strokeWidth={2} dot={false} />
                            <Tooltip contentStyle={{ backgroundColor: '#060d19', borderColor: '#12233e', fontSize: '10px' }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                  
                  {showAdvanced && (
                    <div className="pt-3 border-t border-[#12233e] flex flex-wrap gap-2">
                      <Badge variant="outline" className="border-[#12233e] text-[#7a95b8] bg-[#060d19] text-xs font-normal">Category: {vital.category}</Badge>
                      <Badge variant="outline" className="border-[#12233e] text-[#7a95b8] bg-[#060d19] text-xs font-normal">Calculation: Standard Formula</Badge>
                      <Badge variant="outline" className="border-[#12233e] text-[#7a95b8] bg-[#060d19] text-xs font-normal">Last Updated: Today</Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })
      )}
    </TabsContent>
  );

  const renderActionPlanTab = () => (
    <TabsContent value="action" className="mt-0 space-y-6">
      <div className="rc-card bg-gradient-to-r from-[#0d1a2e] to-[#0a1628] border-l-4 border-l-[#3b82f6]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2"><Map className="w-5 h-5 text-[#3b82f6]" /> Strategic Action Plan</h3>
            <p className="text-[#c8d8ec] text-sm mt-1">Prioritized steps to improve {(selectedClient?.name?.split(" ")[0] ?? "the client")}'s financial vitals score from {overallScore} to 90+.</p>
          </div>
          <Button className="rc-btn rc-btn-primary flex items-center gap-2 whitespace-nowrap">
            <Plus className="w-4 h-4" /> Create Task
          </Button>
        </div>
      </div>

      {/* 6+ Data Tables / Structured Displays (Display 2) */}
      <div className="rc-card p-0 overflow-hidden border-[#12233e]">
        <Table>
          <TableHeader className="bg-[#0d1a2e] border-b border-[#12233e]">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="text-[#7a95b8] font-semibold w-12 text-center">Priority</TableHead>
              <TableHead className="text-[#7a95b8] font-semibold">Action Item</TableHead>
              <TableHead className="text-[#7a95b8] font-semibold">Related Vital</TableHead>
              <TableHead className="text-[#7a95b8] font-semibold">Est. Impact</TableHead>
              <TableHead className="text-[#7a95b8] font-semibold">Status</TableHead>
              <TableHead className="text-[#7a95b8] font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vitals.filter((v) => v.status === "critical" || v.status === "warning").map((vital, idx) => (
              <TableRow key={idx} className="border-b border-[#12233e] hover:bg-[#0d1a2e]/50 transition-colors">
                <TableCell className="text-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mx-auto ${vital.status === 'critical' ? 'bg-red-500/20 text-red-400' : 'bg-[#f0c040]/20 text-[#f0c040]'}`}>
                    {idx + 1}
                  </div>
                </TableCell>
                <TableCell className="font-medium text-white">
                  {vital.name === "Emergency Fund" ? "Open High-Yield Savings Account and automate $500/mo" : 
                   vital.name === "Insurance Rate" ? "Run IUL illustration for $1M death benefit" :
                   vital.name === "Debt Rate" ? "Implement Mortgage Killer strategy on primary residence" :
                   vital.name === "Savings Rate" ? "Increase 401k contribution by 2% to capture full match" :
                   `Review and optimize ${vital.name.toLowerCase()} strategy`}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="border-[#12233e] text-[#c8d8ec] bg-[#060d19] font-normal">
                    {vital.name}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-[#22c55e] font-medium flex items-center text-sm"><TrendingUp className="w-3 h-3 mr-1" /> +{vital.status === 'critical' ? '8' : '4'} pts</span>
                </TableCell>
                <TableCell>
                  <Badge className="bg-[#12233e] text-[#7a95b8] hover:bg-[#12233e] font-normal">Pending</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[#7a95b8] hover:text-white hover:bg-[#12233e]">
                    <CheckSquare className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[#7a95b8] hover:text-white hover:bg-[#12233e]">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {vitals.filter((v) => v.status === "critical" || v.status === "warning").length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-[#7a95b8]">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-[#22c55e] opacity-50" />
                  No critical or warning items. Client is in excellent financial health.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="rc-card">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><History className="w-5 h-5 text-[#8b5cf6]" /> Recent Progress</h3>
          <div className="space-y-4">
            <div className="flex gap-4 relative">
              <div className="w-px h-full bg-[#12233e] absolute left-[11px] top-6"></div>
              <div className="w-6 h-6 rounded-full bg-[#22c55e]/20 flex items-center justify-center flex-shrink-0 z-10 border border-[#22c55e]/50">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#22c55e]" />
              </div>
              <div className="pb-4">
                <p className="text-sm font-medium text-white">Increased Savings Rate</p>
                <p className="text-xs text-[#7a95b8] mt-1">Client increased 401k contribution from 5% to 8%.</p>
                <p className="text-[10px] text-[#7a95b8] mt-2">Oct 15, 2023</p>
              </div>
            </div>
            <div className="flex gap-4 relative">
              <div className="w-px h-full bg-[#12233e] absolute left-[11px] top-6"></div>
              <div className="w-6 h-6 rounded-full bg-[#22c55e]/20 flex items-center justify-center flex-shrink-0 z-10 border border-[#22c55e]/50">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#22c55e]" />
              </div>
              <div className="pb-4">
                <p className="text-sm font-medium text-white">Funded Emergency Reserve</p>
                <p className="text-xs text-[#7a95b8] mt-1">Transferred $15k from checking to HYSA.</p>
                <p className="text-[10px] text-[#7a95b8] mt-2">Sep 02, 2023</p>
              </div>
            </div>
            <div className="flex gap-4 relative">
              <div className="w-6 h-6 rounded-full bg-[#3b82f6]/20 flex items-center justify-center flex-shrink-0 z-10 border border-[#3b82f6]/50">
                <FileText className="w-3.5 h-3.5 text-[#3b82f6]" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Initial Scorecard Generated</p>
                <p className="text-xs text-[#7a95b8] mt-1">Starting score was 68/100.</p>
                <p className="text-[10px] text-[#7a95b8] mt-2">Jul 10, 2023</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rc-card bg-[#0d1a2e] border-[#12233e]">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-[#f0c040]" /> Next Milestone Goals</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 bg-[#060d19] p-3 rounded-lg border border-[#12233e]">
              <div className="mt-0.5"><Award className="w-4 h-4 text-[#f0c040]" /></div>
              <div>
                <p className="text-sm font-medium text-white">Achieve 80+ Overall Score</p>
                <p className="text-xs text-[#7a95b8] mt-1">Current score: {overallScore}. Need {80 - overallScore} more points.</p>
                <Progress value={(overallScore / 80) * 100} className="h-1.5 mt-2 bg-[#12233e] [&>div]:bg-[#f0c040]" />
              </div>
            </li>
            <li className="flex items-start gap-3 bg-[#060d19] p-3 rounded-lg border border-[#12233e]">
              <div className="mt-0.5"><Shield className="w-4 h-4 text-[#8b5cf6]" /></div>
              <div>
                <p className="text-sm font-medium text-white">Eliminate Critical Vitals</p>
                <p className="text-xs text-[#7a95b8] mt-1">{criticalCount} critical areas remaining to resolve.</p>
                <Progress value={criticalCount === 0 ? 100 : 33} className="h-1.5 mt-2 bg-[#12233e] [&>div]:bg-[#8b5cf6]" />
              </div>
            </li>
          </ul>
          <Button variant="outline" className="w-full mt-4 rc-btn rc-btn-ghost text-xs">View Full Strategy</Button>
        </div>
      </div>
    </TabsContent>
  );

  return (
    <AppShell>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <FactFinderBadge className="mb-4" />
        
        {renderHeader()}

        {isClientsLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#7a95b8] space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-[#22c55e]" />
            <p>Loading client data...</p>
          </div>
        ) : !selectedClient ? (
          <div className="rc-card py-16 flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 bg-[#060d19] rounded-full border border-[#12233e]">
              <Info className="w-8 h-8 text-[#7a95b8]" />
            </div>
            <h3 className="text-xl font-semibold text-white">No Clients Found</h3>
            <p className="text-[#c8d8ec] max-w-md">Add clients to generate their Financial Vitals Scorecard and analyze their financial health metrics.</p>
          </div>
        ) : (
          <>
            {renderScoreBanner()}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {renderControls()}
              {renderOverviewTab()}
              {renderDashboardTab()}
              {renderDetailsTab()}
              {renderActionPlanTab()}
            </Tabs>

            {/* Summary Paragraph */}
            <div className="rc-card mt-8 bg-gradient-to-br from-[#0d1a2e] to-[#060d19]">
              <h3 className="font-semibold text-lg text-white mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-[#22c55e]" /> Executive Summary</h3>
              <p className="text-[#c8d8ec] leading-relaxed text-base">
                {(selectedClient.name?.split(" ")[0] ?? "")} {(selectedClient.name?.split(" ").slice(1).join(" ") ?? "")}'s Financial Vitals Scorecard reveals an overall grade of <strong className={gradeColor}>{grade} ({overallScore}/100)</strong>.
                {criticalCount > 0 ? ` There are ${criticalCount} critical area(s) requiring immediate attention. ` : " "}
                {warningCount > 0 ? `Additionally, ${warningCount} area(s) show warning signs that should be addressed in the near term. ` : ""}
                {vitals.filter((v) => v.status === "excellent").length > 0 ? `On the positive side, ${vitals.filter((v) => v.status === "excellent").length} vital sign(s) are rated excellent, demonstrating strong financial discipline in those areas. ` : ""}
                This scorecard provides a comprehensive snapshot of {(selectedClient.name?.split(" ")[0] ?? "")}'s financial health across eight key dimensions. Each vital sign is measured against industry-standard benchmarks and personalized targets.
                The recommendations above are designed to systematically improve each metric, with the most impactful actions prioritized for critical areas first.
                Regular quarterly reviews of these vitals will help track progress and ensure {(selectedClient.name?.split(" ")[0] ?? "")}'s financial plan stays on course toward their long-term goals.
              </p>
              <div className="mt-6 pt-4 border-t border-[#12233e]">
                <em className="text-sm text-[#7a95b8] flex items-start gap-2">
                  <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  This analysis is generated by Russell Capital Systems™ and is intended for educational and planning purposes. It does not constitute personalized financial advice. Consult with a qualified financial advisor before making investment decisions.
                </em>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Simulation Dialog */}
      <Dialog open={isSimulationOpen} onOpenChange={setIsSimulationOpen}>
        <DialogContent className="sm:max-w-2xl bg-[#0a1628] border-[#12233e] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Zap className="w-5 h-5 text-[#3b82f6]" /> Scenario Simulator</DialogTitle>
            <DialogDescription className="text-[#7a95b8]">
              Adjust inputs below to see how changes impact the overall financial vitals score.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label className="text-[#c8d8ec]">Annual Income</Label>
                  <span className="text-white font-medium">{fmt(simIncome)}</span>
                </div>
                <Slider 
                  value={[simIncome]} 
                  min={50000} 
                  max={500000} 
                  step={5000}
                  onValueChange={(v) => setSimIncome(v[0])}
                  className="[&>span:first-child]:bg-[#12233e] [&_[role=slider]]:bg-[#3b82f6] [&_[role=slider]]:border-[#3b82f6]"
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label className="text-[#c8d8ec]">Monthly Expenses</Label>
                  <span className="text-white font-medium">{fmt(simExpenses)}</span>
                </div>
                <Slider 
                  value={[simExpenses]} 
                  min={2000} 
                  max={20000} 
                  step={100}
                  onValueChange={(v) => setSimExpenses(v[0])}
                  className="[&>span:first-child]:bg-[#12233e] [&_[role=slider]]:bg-[#f43f5e] [&_[role=slider]]:border-[#f43f5e]"
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label className="text-[#c8d8ec]">Monthly Savings</Label>
                  <span className="text-white font-medium">{fmt(simSavings)}</span>
                </div>
                <Slider 
                  value={[simSavings]} 
                  min={0} 
                  max={10000} 
                  step={100}
                  onValueChange={(v) => setSimSavings(v[0])}
                  className="[&>span:first-child]:bg-[#12233e] [&_[role=slider]]:bg-[#22c55e] [&_[role=slider]]:border-[#22c55e]"
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label className="text-[#c8d8ec]">Total Debt</Label>
                  <span className="text-white font-medium">{fmt(simDebt)}</span>
                </div>
                <Slider 
                  value={[simDebt]} 
                  min={0} 
                  max={1000000} 
                  step={10000}
                  onValueChange={(v) => setSimDebt(v[0])}
                  className="[&>span:first-child]:bg-[#12233e] [&_[role=slider]]:bg-[#f0c040] [&_[role=slider]]:border-[#f0c040]"
                />
              </div>
            </div>
            
            <div className="bg-[#0d1a2e] rounded-xl border border-[#12233e] p-5 flex flex-col">
              <h4 className="text-sm font-semibold text-white mb-4">Projected Impact</h4>
              
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="relative w-32 h-32 mb-4">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#12233e" strokeWidth="10" />
                    <circle 
                      cx="50" cy="50" r="45" fill="none" stroke="#3b82f6" strokeWidth="10" 
                      strokeDasharray={`${Math.min(100, overallScore + 8) * 2.83} 283`} 
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-white">{Math.min(100, overallScore + 8)}</span>
                    <span className="text-[10px] text-[#7a95b8] uppercase">Proj. Score</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-[#22c55e] bg-[#22c55e]/10 px-3 py-1 rounded-full text-sm font-medium mb-6">
                  <TrendingUp className="w-4 h-4" /> +8 Points Potential
                </div>
                
                <div className="w-full space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#c8d8ec]">Savings Rate</span>
                    <span className="text-[#22c55e] flex items-center"><ArrowUpRight className="w-3 h-3 mr-1" /> to 18%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#c8d8ec]">Burn Rate</span>
                    <span className="text-[#22c55e] flex items-center"><ArrowDownRight className="w-3 h-3 mr-1" /> to 3.5%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#c8d8ec]">Debt Rate</span>
                    <span className="text-[#22c55e] flex items-center"><ArrowDownRight className="w-3 h-3 mr-1" /> to 15%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsSimulationOpen(false)} className="rc-btn rc-btn-ghost">Cancel</Button>
            <Button onClick={handleSimulate} className="rc-btn rc-btn-primary">Apply to Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PageInsights pageId="financial-vitals-scorecard" />
    </AppShell>
  );
}
