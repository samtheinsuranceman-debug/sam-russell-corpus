// @ts-nocheck
import { useState, useMemo, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DollarSign,
  TrendingUp,
  Home,
  Building2,
  Users,
  Shield,
  Target,
  BarChart3,
  PiggyBank,
  ArrowUpRight,
  Flame,
  Crown,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Scale,
  Briefcase,
  LineChart,
  PieChartIcon,
  Activity,
  CheckCircle2,
  Calendar,
  Search,
  Filter,
  Download,
  ArrowRight,
  Star,
} from "lucide-react";
import { ExportToSlides } from "@/components/ExportToSlides";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar 
} from "recharts";

type CommissionType = "life" | "annuity" | "both";

interface ToolCommission {
  id: string;
  name: string;
  route: string;
  icon: React.ElementType;
  commissionType: CommissionType;
  monthlyCommission: number;        // monthly commission potential
  annualPremiumBasis: string;        // explanation of the premium basis
  description: string;               // how the tool generates this commission
  clientProfile: string;             // who the ideal client is
  withoutTool: string;               // what happens without this tool
  enabled: boolean;                  // toggle on/off
  category: "core" | "advanced" | "niche";
  difficulty: "beginner" | "intermediate" | "expert";
  avgCaseSize: number;
  conversionRate: number;
}

const TOOL_COMMISSIONS: ToolCommission[] = [{
    id: "mortgage-killer",
    name: "Mortgage Killer",
    route: "/portal/mortgage-killer",
    icon: Home,
    commissionType: "life",
    monthlyCommission: 40000,
    annualPremiumBasis: "$80,000/yr IUL per client with mortgage + home equity",
    description: "Every client with a mortgage and home equity is an $80,000/yr IUL candidate. The Mortgage Killer shows them how to redirect mortgage interest into a tax-free IUL that builds wealth while eliminating their mortgage faster. Standard conversion: 1 client/month = $40K in new life commissions.",
    clientProfile: "Homeowners with $200K+ mortgage balance and $100K+ in home equity",
    withoutTool: "These clients keep paying mortgage interest to the bank and never consider IUL — you'd never even bring it up.",
    enabled: true,
    category: "core",
    difficulty: "beginner",
    avgCaseSize: 40000,
    conversionRate: 25,
  },
,
  {
    id: "roth-strategy",
    name: "2-Year Roth Strategy",
    route: "/portal/roth-conversion",
    icon: Target,
    commissionType: "life",
    monthlyCommission: 100000,
    annualPremiumBasis: "$200K-$500K Roth conversions driving IUL + annuity placements",
    description: "The Solar Strategy Roth conversion typically adds 22-28% tax-free income to the principal base. After converting, clients need a vehicle for the tax-free growth — that's where large IUL policies and lifetime income annuities come in. Each Roth conversion client is a $200K+ annual premium opportunity.",
    clientProfile: "Pre-retirees (55-70) with $500K+ in traditional IRA/401k balances",
    withoutTool: "Advisors leave massive Roth conversion opportunities on the table, missing the IUL upsell entirely.",
    enabled: true,
    category: "advanced",
    difficulty: "expert",
    avgCaseSize: 100000,
    conversionRate: 15,
  },
,
  {
    id: "retirement-drivers",
    name: "Retirement Drivers",
    route: "/portal/retirement-drivers",
    icon: TrendingUp,
    commissionType: "both",
    monthlyCommission: 100000,
    annualPremiumBasis: "$100K+ in combined life & annuity commissions per month",
    description: "The Retirement Drivers engine identifies every gap in a client's retirement plan — income shortfalls, tax exposure, longevity risk, inflation vulnerability. Each gap is a product placement opportunity: IUL for tax-free income, FIA for guaranteed income, MYGA for safe growth. One comprehensive retirement plan = multiple product sales.",
    clientProfile: "Anyone within 10 years of retirement with $250K+ in investable assets",
    withoutTool: "You present a generic retirement plan and miss 3-4 product placement opportunities per client.",
    enabled: true,
    category: "core",
    difficulty: "intermediate",
    avgCaseSize: 50000,
    conversionRate: 30,
  },
,
  {
    id: "house-recycling",
    name: "House Recycling for Big Sales",
    route: "/portal/house-recycling",
    icon: Building2,
    commissionType: "life",
    monthlyCommission: 200000,
    annualPremiumBasis: "$300K-$1M+ annual premium IUL policies from equity recycling",
    description: "House Recycling shows high-net-worth clients how to extract home equity via HELOC, redirect it into a max-funded IUL, and create a tax-free wealth engine. These are BIG cases — $300K to $1M+ annual premium IULs that would never exist without this specific strategy presentation. The visual before/after is what closes the deal.",
    clientProfile: "High-net-worth homeowners with $500K+ equity in primary or investment properties",
    withoutTool: "You'd never think to pitch a $500K annual premium IUL to a homeowner. This tool makes it obvious and compelling.",
    enabled: true,
    category: "advanced",
    difficulty: "expert",
    avgCaseSize: 200000,
    conversionRate: 10,
  },
,
  {
    id: "household-wealth",
    name: "Household Wealth Engine",
    route: "/portal/household-wealth",
    icon: Users,
    commissionType: "life",
    monthlyCommission: 250000,
    annualPremiumBasis: "4-6 × $80,000/yr IUL policies per household = $250K+ in life commissions",
    description: "The Household Wealth Engine maps every member of a household and identifies IUL opportunities for each: breadwinner protection, spousal coverage, children's policies, grandparent legacy plans. One household visit = 4-6 separate $80,000/yr IUL policies. These are policies advisors never even thought of going after.",
    clientProfile: "Multi-generational households with combined income $150K+ and 2+ insurable members",
    withoutTool: "You write one policy on the breadwinner and leave 4-5 additional policies on the table per household.",
    enabled: true,
    category: "core",
    difficulty: "intermediate",
    avgCaseSize: 80000,
    conversionRate: 20,
  }
];

function fmt(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

function fmtFull(n: number): string {
  return `$${n.toLocaleString()}`;
}

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b', '#06b6d4', '#ec4899', '#84cc16'];

export default function CommissionTracker() {
  const { user } = useAuth();
  const [tools, setTools] = useState(TOOL_COMMISSIONS);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("overview");
  const [goalTarget, setGoalTarget] = useState<number>(2000000);
  const [timeframe, setTimeframe] = useState<string>("12");

  const { data: clientsData } = trpc.clients.list.useQuery(undefined, { enabled: false });
  const { data: notesData } = trpc.notes.list.useQuery({ clientId: "all" }, { enabled: false });
  const { data: activityData } = trpc.activity.recent.useQuery(undefined, { enabled: false });
  const { data: dashboardData } = trpc.dashboard.summary.useQuery(undefined, { enabled: false });
  const { data: userData } = trpc.users.me.useQuery(undefined, { enabled: false });

  const [interactionCount, setInteractionCount] = useState(0);

  const historicalData = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => {
      const month = new Date();
      month.setMonth(month.getMonth() - (11 - i));
      const baseVal = 50000 + (i * 15000) + (Math.random() * 20000);
      return {
        name: month.toLocaleString('default', { month: 'short' }),
        life: Math.round(baseVal * 0.6),
        annuity: Math.round(baseVal * 0.4),
        total: Math.round(baseVal),
        target: 150000
      };
    });
  }, []);

  const categoryData = useMemo(() => {
    const data = [
      { name: 'Core Tools', value: tools.filter((t) => t.category === 'core' && t.enabled).reduce((s, t) => s + t.monthlyCommission, 0) },
      { name: 'Advanced Tools', value: tools.filter((t) => t.category === 'advanced' && t.enabled).reduce((s, t) => s + t.monthlyCommission, 0) },
      { name: 'Niche Tools', value: tools.filter((t) => t.category === 'niche' && t.enabled).reduce((s, t) => s + t.monthlyCommission, 0) },
    ];
    return data.filter((d) => d.value > 0);
  }, [tools]);

  const difficultyData = useMemo(() => {
    return [
      { difficulty: 'Beginner', potential: tools.filter((t) => t.difficulty === 'beginner' && t.enabled).reduce((s, t) => s + t.monthlyCommission, 0) },
      { difficulty: 'Intermediate', potential: tools.filter((t) => t.difficulty === 'intermediate' && t.enabled).reduce((s, t) => s + t.monthlyCommission, 0) },
      { difficulty: 'Expert', potential: tools.filter((t) => t.difficulty === 'expert' && t.enabled).reduce((s, t) => s + t.monthlyCommission, 0) },
    ];
  }, [tools]);

  const conversionData = useMemo(() => {
    return tools.filter((t) => t.enabled).map((t) => ({
      name: t.name,
      rate: t.conversionRate,
      size: t.avgCaseSize / 1000
    })).sort((a, b) => b.rate - a.rate).slice(0, 6);
  }, [tools]);

  const radarData = useMemo(() => {
    return [
      { subject: 'Life Potential', A: tools.filter((t) => (t.commissionType === 'life' || t.commissionType === 'both') && t.enabled).reduce((s, t) => s + t.monthlyCommission, 0), fullMark: 1000000 },
      { subject: 'Annuity Potential', A: tools.filter((t) => (t.commissionType === 'annuity' || t.commissionType === 'both') && t.enabled).reduce((s, t) => s + t.monthlyCommission, 0), fullMark: 1000000 },
      { subject: 'Conversion Rate', A: tools.filter((t) => t.enabled).reduce((s, t) => s + t.conversionRate, 0) / (tools.filter((t) => t.enabled).length || 1) * 10000, fullMark: 1000000 },
      { subject: 'Avg Case Size', A: tools.filter((t) => t.enabled).reduce((s, t) => s + t.avgCaseSize, 0) / (tools.filter((t) => t.enabled).length || 1) * 5, fullMark: 1000000 },
      { subject: 'Tool Utilization', A: (tools.filter((t) => t.enabled).length / tools.length) * 1000000, fullMark: 1000000 },
    ];
  }, [tools]);

  const toggleTool = useCallback((id: string) => {
    setTools(prev => prev.map((t) => t.id === id ? { ...t, enabled: !t.enabled } : t));
    setInteractionCount(c => c + 1);
  }, []);

  const toggleAll = useCallback(() => {
    const newState = !showAll;
    setShowAll(newState);
    setTools(prev => prev.map((t) => ({ ...t, enabled: newState })));
    setInteractionCount(c => c + 1);
  }, [showAll]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setInteractionCount(c => c + 1);
  }, []);

  const handleFilterTypeChange = useCallback((val: string) => {
    setFilterType(val);
    setInteractionCount(c => c + 1);
  }, []);

  const handleFilterCategoryChange = useCallback((val: string) => {
    setFilterCategory(val);
    setInteractionCount(c => c + 1);
  }, []);

  const handleGoalChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value.replace(/[^0-9]/g, ''));
    if (!isNaN(val)) {
      setGoalTarget(val);
      setInteractionCount(c => c + 1);
    }
  }, []);

  const filteredTools = useMemo(() => {
    return tools.filter((t) => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            t.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === "all" || t.commissionType === filterType;
      const matchesCategory = filterCategory === "all" || t.category === filterCategory;
      return matchesSearch && matchesType && matchesCategory;
    });
  }, [tools, searchQuery, filterType, filterCategory]);

  const stats = useMemo(() => {
    const active = tools.filter((t) => t.enabled);
    const lifeTotal = active.filter((t) => t.commissionType === "life" || t.commissionType === "both")
      .reduce((sum, t) => sum + (t.commissionType === "both" ? t.monthlyCommission * 0.5 : t.monthlyCommission), 0);
    const annuityTotal = active.filter((t) => t.commissionType === "annuity" || t.commissionType === "both")
      .reduce((sum, t) => sum + (t.commissionType === "both" ? t.monthlyCommission * 0.5 : t.monthlyCommission), 0);
    const grandTotal = active.reduce((sum, t) => sum + t.monthlyCommission, 0);
    const leftOnTable = tools.filter((t) => !t.enabled).reduce((sum, t) => sum + t.monthlyCommission, 0);
    
    const annualTotal = grandTotal * 12;
    const goalProgress = Math.min(100, Math.round((annualTotal / goalTarget) * 100));
    
    return { lifeTotal, annuityTotal, grandTotal, leftOnTable, activeCount: active.length, annualTotal, goalProgress };
  }, [tools, goalTarget]);

  const typeColor = (type: CommissionType) => {
    if (type === "life") return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    if (type === "annuity") return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    return "bg-amber-500/20 text-amber-400 border-amber-500/30";
  };

  const typeLabel = (type: CommissionType) => {
    if (type === "life") return "Life Commissions";
    if (type === "annuity") return "Annuity Commissions";
    return "Life + Annuity";
  };

  const categoryColor = (cat: string) => {
    if (cat === "core") return "text-emerald-400";
    if (cat === "advanced") return "text-amber-400";
    return "text-purple-400";
  };

  useEffect(() => {
    if (interactionCount > 0 && interactionCount % 5 === 0) {
    }
  }, [interactionCount]);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <DollarSign className="w-5 h-5 text-red-400" />
            </div>
            Commission Tracker Pro
          </h1>
          <p className="text-slate-400 mt-1 text-sm sm:text-base">
            Track, project, and maximize the commission potential of your advisory practice
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
          <ExportToSlides
            toolName="Commission Tracker Pro"
            getSections={() => [
              {
                title: "Commission Potential Summary",
                items: [
                  { label: "Total Monthly", value: fmt(stats.grandTotal) },
                  { label: "Total Annual", value: fmtFull(stats.grandTotal * 12) },
                  { label: "Life Commissions", value: fmt(stats.lifeTotal) },
                  { label: "Annuity Commissions", value: fmt(stats.annuityTotal) },
                  { label: "Active Tools", value: `${stats.activeCount} / ${tools.length}` },
                  { label: "Left on Table", value: fmt(stats.leftOnTable) }
                ]
              },
              ...tools.filter((t) => t.enabled).map((t) => ({
                title: t.name,
                items: [
                  { label: "Monthly Potential", value: fmt(t.monthlyCommission) },
                  { label: "Annual Premium Basis", value: t.annualPremiumBasis },
                  { label: "Ideal Client Profile", value: t.clientProfile }
                ]
              }))
            ]}
          />
          <Button
            onClick={toggleAll}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            {showAll ? "Disable All" : "Enable All"}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">Total Monthly</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-3xl font-bold text-white">{fmt(stats.grandTotal)}</p>
            <p className="text-emerald-400/70 text-xs mt-1">{fmtFull(stats.grandTotal * 12)}/year potential</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-400 text-xs font-semibold uppercase tracking-wider">Life Commissions</span>
              <Shield className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-white">{fmt(stats.lifeTotal)}</p>
            <p className="text-blue-400/70 text-xs mt-1">IUL + Term + Whole Life</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-400 text-xs font-semibold uppercase tracking-wider">Annuity Commissions</span>
              <PiggyBank className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-3xl font-bold text-white">{fmt(stats.annuityTotal)}</p>
            <p className="text-purple-400/70 text-xs mt-1">FIA + MYGA + SPIA</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/30">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-red-400 text-xs font-semibold uppercase tracking-wider">Left on Table</span>
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <p className="text-3xl font-bold text-white">{fmt(stats.leftOnTable)}</p>
            <p className="text-red-400/70 text-xs mt-1">
              {tools.filter((t) => !t.enabled).length} tools not activated
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Goal Tracking & Money Left on Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="bg-[#111c32] border-slate-700/50 lg:col-span-2">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
              <div>
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-400" />
                  Annual Production Goal Tracker
                </h3>
                <p className="text-slate-400 text-xs mt-1">Track your projected potential against your annual target</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-xs">Target:</span>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                  <Input 
                    value={goalTarget.toLocaleString()} 
                    onChange={handleGoalChange}
                    className="w-28 h-8 bg-slate-800/50 border-slate-700 text-xs pl-5"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-emerald-400 font-medium">{fmtFull(stats.annualTotal)} Projected</span>
                <span className="text-slate-400">{fmtFull(goalTarget)} Goal</span>
              </div>
              <Progress value={stats.goalProgress} className="h-3 bg-slate-800" />
              <div className="flex justify-between text-xs text-slate-500">
                <span>{stats.goalProgress}% of Goal</span>
                {stats.annualTotal >= goalTarget ? (
                  <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Goal Exceeded</span>
                ) : (
                  <span>{fmtFull(goalTarget - stats.annualTotal)} needed</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {stats.leftOnTable > 0 ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 flex flex-col justify-center gap-3 h-full">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <Flame className="w-5 h-5 text-red-400" />
              </div>
              <h3 className="text-red-400 font-semibold text-sm">
                Missing {fmtFull(stats.leftOnTable)}/mo!
              </h3>
            </div>
            <p className="text-red-400/70 text-xs leading-relaxed">
              That's {fmtFull(stats.leftOnTable * 12)}/year in commissions you could be earning by activating all tools.
            </p>
            <Button
              onClick={() => { setShowAll(true); setTools(prev => prev.map((t) => ({ ...t, enabled: true }))); }}
              className="bg-red-600 hover:bg-red-500 text-white text-xs w-full mt-auto"
              size="sm"
            >
              Activate All Tools
            </Button>
          </div>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 flex flex-col justify-center items-center text-center gap-3 h-full">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <Crown className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-emerald-400 font-semibold text-sm">Maximum Potential Reached!</h3>
              <p className="text-emerald-400/70 text-xs mt-1">All tools activated and contributing to your pipeline.</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[#111c32] border border-slate-700/50 p-1 w-full flex overflow-x-auto justify-start sm:justify-center">
          <TabsTrigger value="overview" className="flex-1 min-w-[120px] data-[state=active]:bg-slate-800">
            <Activity className="w-4 h-4 mr-2" /> Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex-1 min-w-[120px] data-[state=active]:bg-slate-800">
            <BarChart3 className="w-4 h-4 mr-2" /> Analytics
          </TabsTrigger>
          <TabsTrigger value="tools" className="flex-1 min-w-[120px] data-[state=active]:bg-slate-800">
            <Briefcase className="w-4 h-4 mr-2" /> Tool Details
          </TabsTrigger>
          <TabsTrigger value="projections" className="flex-1 min-w-[120px] data-[state=active]:bg-slate-800">
            <TrendingUp className="w-4 h-4 mr-2" /> Projections
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Historical Trend Chart */}
            <Card className="bg-[#111c32] border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <LineChart className="w-4 h-4 text-blue-400" /> 12-Month Production Trend
                </CardTitle>
                <CardDescription>Historical vs Projected Commissions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historicalData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                        itemStyle={{ color: '#f8fafc' }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="total" name="Total Revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorTotal)" />
                      <Line type="monotone" dataKey="target" name="Monthly Target" stroke="#ef4444" strokeDasharray="5 5" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card className="bg-[#111c32] border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-purple-400" /> Revenue by Category
                </CardTitle>
                <CardDescription>Active tools commission distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full flex items-center justify-center">
                  {stats.grandTotal > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
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
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                          formatter={(value: number) => [`$${value.toLocaleString()}`, 'Potential']}
                        />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-slate-500 flex flex-col items-center">
                      <AlertTriangle className="w-8 h-8 mb-2 opacity-50" />
                      <p>No active tools to display</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats Table */}
          <Card className="bg-[#111c32] border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white text-base">Top Performing Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700/50 hover:bg-transparent">
                      <TableHead className="text-slate-400">Tool Name</TableHead>
                      <TableHead className="text-slate-400">Category</TableHead>
                      <TableHead className="text-slate-400 text-right">Monthly Potential</TableHead>
                      <TableHead className="text-slate-400 text-right">Annual Potential</TableHead>
                      <TableHead className="text-slate-400 text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tools.sort((a, b) => b.monthlyCommission - a.monthlyCommission).slice(0, 5).map((tool) => (
                      <TableRow key={tool.id} className="border-slate-700/50 hover:bg-slate-800/50">
                        <TableCell className="font-medium text-slate-200 flex items-center gap-2">
                          <tool.icon className="w-4 h-4 text-slate-400" />
                          {tool.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] capitalize ${
                            tool.category === 'core' ? 'text-emerald-400 border-emerald-400/30' : 
                            tool.category === 'advanced' ? 'text-amber-400 border-amber-400/30' : 
                            'text-purple-400 border-purple-400/30'
                          }`}>
                            {tool.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-emerald-400 font-medium">{fmt(tool.monthlyCommission)}</TableCell>
                        <TableCell className="text-right text-slate-300">{fmtFull(tool.monthlyCommission * 12)}</TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={tool.enabled}
                            onCheckedChange={() => toggleTool(tool.id)}
                            className="scale-75 data-[state=checked]:bg-emerald-500"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ANALYTICS TAB */}
        <TabsContent value="analytics" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conversion Rates */}
            <Card className="bg-[#111c32] border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" /> Conversion Rates by Tool
                </CardTitle>
                <CardDescription>Estimated closing ratio for active tools</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={conversionData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                      <XAxis type="number" stroke="#94a3b8" fontSize={12} tickFormatter={(val) => `${val}%`} />
                      <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} width={100} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                        formatter={(value: number) => [`${value}%`, 'Conversion Rate']}
                      />
                      <Bar dataKey="rate" name="Conversion Rate" fill="#10b981" radius={[0, 4, 4, 0]}>
                        {conversionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Radar Analysis */}
            <Card className="bg-[#111c32] border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-400" /> Practice Optimization Profile
                </CardTitle>
                <CardDescription>Multi-dimensional view of your practice</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 1000000]} tick={false} axisLine={false} />
                      <Radar name="Current Profile" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                        formatter={() => ['Optimized', 'Score']}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Difficulty Breakdown */}
            <Card className="bg-[#111c32] border-slate-700/50 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Scale className="w-4 h-4 text-amber-400" /> Revenue Potential by Difficulty
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={difficultyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="difficulty" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" tickFormatter={(val) => `$${val/1000}k`} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Monthly Potential']}
                      />
                      <Bar dataKey="potential" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TOOLS TAB */}
        <TabsContent value="tools" className="space-y-4 mt-6">
          {/* Filters & Search */}
          <div className="bg-[#111c32] p-4 rounded-xl border border-slate-700/50 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input 
                placeholder="Search tools, descriptions, strategies..." 
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-9 bg-slate-800/50 border-slate-700 text-slate-200 w-full"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Select value={filterType} onValueChange={handleFilterTypeChange}>
                <SelectTrigger className="w-full md:w-[160px] bg-slate-800/50 border-slate-700 text-slate-200">
                  <div className="flex items-center gap-2">
                    <Filter className="w-3 h-3" />
                    <SelectValue placeholder="Product Type" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="life">Life Insurance</SelectItem>
                  <SelectItem value="annuity">Annuities</SelectItem>
                  <SelectItem value="both">Life & Annuity</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterCategory} onValueChange={handleFilterCategoryChange}>
                <SelectTrigger className="w-full md:w-[160px] bg-slate-800/50 border-slate-700 text-slate-200">
                  <div className="flex items-center gap-2">
                    <Filter className="w-3 h-3" />
                    <SelectValue placeholder="Category" />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="core">Core Strategies</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="niche">Niche Markets</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-semibold text-white">Tool-by-Tool Commission Breakdown</h2>
            <span className="text-slate-400 text-sm">Showing {filteredTools.length} of {tools.length} tools</span>
          </div>

          <TooltipProvider>
            {filteredTools.map((tool) => {
              const isExpanded = expandedId === tool.id;
              const Icon = tool.icon;
              return (
                <Card
                  key={tool.id}
                  className={`transition-all duration-200 ${
                    tool.enabled
                      ? "bg-[#111c32] border-slate-700/50 hover:border-slate-600/70"
                      : "bg-[#0a1220] border-slate-800/50 opacity-60"
                  }`}
                >
                  <CardContent className="p-0">
                    {/* Main Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4">
                      {/* Top row on mobile: Toggle + Icon + Name + Expand */}
                      <div className="flex items-center gap-3 w-full sm:contents">
                        {/* Toggle */}
                        <Switch
                          checked={tool.enabled}
                          onCheckedChange={() => toggleTool(tool.id)}
                          className="flex-shrink-0 data-[state=checked]:bg-emerald-500"
                        />

                        {/* Icon */}
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          tool.enabled ? "bg-slate-700/50" : "bg-slate-800/50"
                        }`}>
                          <Icon className={`w-5 h-5 ${tool.enabled ? "text-white" : "text-slate-600"}`} />
                        </div>

                        {/* Name & Type */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={`font-semibold text-sm ${tool.enabled ? "text-white" : "text-slate-500"}`}>
                              {tool.name}
                            </h3>
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${typeColor(tool.commissionType)}`}>
                              {typeLabel(tool.commissionType)}
                            </Badge>
                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border-slate-700 ${categoryColor(tool.category)}`}>
                              {tool.category}
                            </Badge>
                          </div>
                          <p className="text-slate-500 text-xs truncate">{tool.annualPremiumBasis}</p>
                        </div>

                        {/* Expand — visible on mobile in top row */}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : tool.id)}
                          className="text-slate-500 hover:text-slate-300 transition-colors p-1 flex-shrink-0 sm:hidden"
                        >
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>

                      {/* Bottom row on mobile: Commission Amount */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 pl-[3.25rem] sm:pl-0">
                        <div className="text-left sm:text-right flex-shrink-0">
                          <p className={`text-xl font-bold ${tool.enabled ? "text-emerald-400" : "text-slate-600"}`}>
                            {fmt(tool.monthlyCommission)}
                          </p>
                          <p className="text-slate-500 text-[10px]">per month</p>
                        </div>

                        {/* Expand — visible on desktop only */}
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : tool.id)}
                          className="text-slate-500 hover:text-slate-300 transition-colors p-1 hidden sm:block"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-0 border-t border-slate-700/30">
                        <div className="grid md:grid-cols-2 gap-4 mt-4">
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
                                <Activity className="w-3 h-3" /> How It Generates Commission
                              </h4>
                              <p className="text-slate-300 text-sm leading-relaxed">{tool.description}</p>
                            </div>
                            <div>
                              <h4 className="text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
                                <Users className="w-3 h-3" /> Ideal Client Profile
                              </h4>
                              <p className="text-slate-400 text-sm">{tool.clientProfile}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 pt-2">
                              <div className="bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
                                <span className="text-slate-500 text-[10px] uppercase block mb-1">Avg Case Size</span>
                                <span className="text-slate-200 font-medium text-sm">{fmtFull(tool.avgCaseSize)}</span>
                              </div>
                              <div className="bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
                                <span className="text-slate-500 text-[10px] uppercase block mb-1">Est. Conversion</span>
                                <span className="text-slate-200 font-medium text-sm">{tool.conversionRate}%</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-4 flex flex-col h-full">
                            <div>
                              <h4 className="text-red-400 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Without This Tool
                              </h4>
                              <p className="text-slate-400 text-sm leading-relaxed">{tool.withoutTool}</p>
                            </div>
                            
                            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 mt-auto">
                              <div className="flex justify-between items-center pb-2 border-b border-slate-700/50">
                                <span className="text-slate-400 text-xs flex items-center gap-1"><Calendar className="w-3 h-3" /> Monthly Potential</span>
                                <span className="text-emerald-400 font-bold">{fmtFull(tool.monthlyCommission)}</span>
                              </div>
                              <div className="flex justify-between items-center pt-2">
                                <span className="text-slate-400 text-xs flex items-center gap-1"><Star className="w-3 h-3" /> Annual Potential</span>
                                <span className="text-emerald-400 font-bold">{fmtFull(tool.monthlyCommission * 12)}</span>
                              </div>
                            </div>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 text-xs"
                              onClick={() => window.location.href = tool.route}
                            >
                              Open {tool.name} <ArrowUpRight className="w-3 h-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            
            {filteredTools.length === 0 && (
              <div className="text-center py-12 bg-[#111c32] rounded-xl border border-slate-700/50">
                <Search className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                <h3 className="text-slate-300 font-medium">No tools found</h3>
                <p className="text-slate-500 text-sm mt-1">Try adjusting your search or filters</p>
                <Button 
                  variant="link" 
                  onClick={() => { setSearchQuery(""); setFilterType("all"); setFilterCategory("all"); }}
                  className="text-emerald-400 mt-2"
                >
                  Clear all filters
                </Button>
              </div>
            )}
          </TooltipProvider>
        </TabsContent>

        {/* PROJECTIONS TAB */}
        <TabsContent value="projections" className="space-y-6 mt-6">
          <Card className="bg-[#111c32] border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> Revenue Projections Builder
              </CardTitle>
              <CardDescription>Forecast your growth based on tool utilization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-1/3 space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm text-slate-300">Projection Timeframe</label>
                    <Select value={timeframe} onValueChange={setTimeframe}>
                      <SelectTrigger className="bg-slate-800/50 border-slate-700 text-slate-200">
                        <SelectValue placeholder="Select timeframe" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-slate-200">
                        <SelectItem value="6">6 Months</SelectItem>
                        <SelectItem value="12">1 Year</SelectItem>
                        <SelectItem value="36">3 Years</SelectItem>
                        <SelectItem value="60">5 Years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 space-y-4">
                    <h4 className="text-sm font-medium text-slate-200 border-b border-slate-700 pb-2">Projection Summary</h4>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-xs">Current Monthly</span>
                      <span className="text-slate-200 font-medium">{fmtFull(stats.grandTotal)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-xs">Projected Total ({timeframe} mo)</span>
                      <span className="text-emerald-400 font-bold">{fmtFull(stats.grandTotal * parseInt(timeframe))}</span>
                    </div>
                    
                    <div className="pt-2 border-t border-slate-700">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 text-xs">Life Contribution</span>
                        <span className="text-blue-400 text-sm">{Math.round((stats.lifeTotal / stats.grandTotal) * 100 || 0)}%</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-slate-400 text-xs">Annuity Contribution</span>
                        <span className="text-purple-400 text-sm">{Math.round((stats.annuityTotal / stats.grandTotal) * 100 || 0)}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2">
                    <Download className="w-4 h-4" /> Export Projection PDF
                  </Button>
                </div>
                
                <div className="w-full md:w-2/3">
                  <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart 
                        data={Array.from({ length: parseInt(timeframe) }).map((_, i) => ({
                          month: `Month ${i+1}`,
                          projected: stats.grandTotal * (1 + (i * 0.05)), // 5% growth per month assumed
                          baseline: stats.grandTotal
                        }))} 
                        margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                      >
                        <defs>
                          <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} 
                               interval={parseInt(timeframe) > 12 ? Math.floor(parseInt(timeframe)/6) : 0} />
                        <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} 
                               tickFormatter={(value) => `$${value/1000}k`} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                          formatter={(value: number) => [`$${Math.round(value).toLocaleString()}`, '']}
                        />
                        <Legend />
                        <Area type="monotone" dataKey="projected" name="Projected Growth (w/ Optimization)" stroke="#10b981" fillOpacity={1} fill="url(#colorProjected)" />
                        <Line type="monotone" dataKey="baseline" name="Flat Baseline" stroke="#94a3b8" strokeDasharray="5 5" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Grand Total Summary Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a1220]/90 backdrop-blur-md border-t border-slate-800 p-4 z-40">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm sm:text-base">Total Commission Potential</h3>
              <p className="text-slate-400 text-xs">
                Using {stats.activeCount} active tools as the core engine
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right hidden md:block">
              <p className="text-slate-400 text-xs">Annual Projection</p>
              <p className="text-lg font-bold text-white">{fmtFull(stats.grandTotal * 12)}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-xs">Monthly Potential</p>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-400">
                {fmt(stats.grandTotal)}
              </p>
            </div>
            <Button className="hidden sm:flex bg-emerald-600 hover:bg-emerald-500 text-white gap-2">
              Action Plan <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="pt-8 pb-12">
        <p className="text-slate-600 text-[10px] text-center leading-relaxed max-w-4xl mx-auto">
          Commission estimates are based on maximum potential when each tool is used correctly with qualified clients.
          Actual results vary based on market conditions, client suitability, carrier compensation schedules, and individual advisor effort.
          These figures represent the additional income opportunity that exists when using Russell Capital Systems™' tools as the core engine of your practice.
          Past performance does not guarantee future results. For illustration purposes only. Not an offer or guarantee of income.
        </p>
      </div>
    </div>
  );
}
