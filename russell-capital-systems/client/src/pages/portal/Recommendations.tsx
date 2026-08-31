// @ts-nocheck
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import { ExportToSlides } from "@/components/ExportToSlides";
import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Trophy, Zap, TrendingUp, Shield, Target, Star, ChevronRight,
  CheckCircle, Lock, Sparkles, ArrowUpRight, DollarSign, Home,
  PiggyBank, Briefcase, Heart, BarChart3, Flame, PieChartIcon, LineChart as LineChartIcon,
  AlertTriangle, Check, Clock, Info, Activity, Calendar, FileText
} from "lucide-react";
import { toast } from "sonner";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

const LEVEL_EMOJIS = ["🌱", "🧭", "🏗️", "♟️", "📈", "🏆", "🛡️", "🏰", "👑", "⭐"];
const LEVEL_NAMES = ["Starter", "Explorer", "Builder", "Strategist", "Optimizer", "Achiever", "Wealth Guardian", "Legacy Builder", "Financial Master", "Legendary"];

function getLevel(score: number): number {
  const thresholds = [0, 20, 30, 40, 50, 60, 70, 80, 90, 95];
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (score >= thresholds[i]) return i + 1;
  }
  return 1;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  scoreBoost: number;
  category: "allocation" | "behavior" | "protection" | "growth" | "tax" | "income";
  icon: any;
  difficulty: "easy" | "medium" | "hard";
  timeframe: string;
  details: string[];
  tabLink?: string;
  tabName?: string;
  impactChart?: "bar" | "pie" | "line" | "area" | "radar";
}

function generateRecommendations(data: any): Recommendation[] {
  const recs: Recommendation[] = [];
  const income = data?.annualIncome ?? 250000;
  const iraBalance = data?.iraBalance ?? 0;
  const rothBalance = data?.rothBalance ?? 0;
  const realEstateEquity = data?.realEstateEquity ?? 0;
  const mortgageBalance = data?.mortgageBalance ?? 0;
  const cashSavings = data?.cashSavings ?? 0;
  const taxableInvestments = data?.taxableInvestments ?? 0;
  const lifeInsuranceCv = data?.lifeInsuranceCv ?? 0;
  const monthlyExpenses = data?.monthlyExpenses ?? 12000;
  const age = data?.age ?? 50;

  if (iraBalance > 100000 || true) {
    recs.push({
      id: "roth-conversion",
      title: "Start a Roth Conversion Ladder",
      description: `Convert $${Math.min(Math.round((iraBalance || 200000) * 0.1), 100000).toLocaleString()}/yr from your IRA to Roth for tax-free growth`,
      scoreBoost: 7,
      category: "tax",
      icon: TrendingUp,
      difficulty: "medium",
      timeframe: "5-10 years",
      details: [
        "Reduces future Required Minimum Distributions (RMDs)",
        "Creates tax-free income in retirement",
        "Protects against future tax rate increases",
        "Best done before age 72 when RMDs begin"
      ],
      tabLink: "/portal/roth-conversion",
      tabName: "Roth Conversion STR",
      impactChart: "area"
    });
  }

  if (lifeInsuranceCv === 0 || true) {
    recs.push({
      id: "iul-policy",
      title: "Open an Indexed Universal Life (IUL) Policy",
      description: "Tax-free retirement income + death benefit protection in one vehicle",
      scoreBoost: 8,
      category: "protection",
      icon: Shield,
      difficulty: "medium",
      timeframe: "Start now, benefits in 10+ years",
      details: [
        "Tax-free policy loans for retirement income",
        "Death benefit protects your family",
        "Cash value grows with market upside, protected from downside",
        "Can fund with Roth conversion tax savings"
      ],
      tabLink: "/portal/strategy",
      tabName: "Strategy Lab",
      impactChart: "bar"
    });
  }

  if (cashSavings < monthlyExpenses * 6 || true) {
    recs.push({
      id: "emergency-fund",
      title: "Build a 6-Month Emergency Fund",
      description: `Target: $${((monthlyExpenses || 10000) * 6).toLocaleString()} in liquid savings (currently $${(cashSavings || 5000).toLocaleString()})`,
      scoreBoost: 5,
      category: "behavior",
      icon: PiggyBank,
      difficulty: "easy",
      timeframe: "6-12 months",
      details: [
        "Prevents forced selling of investments during emergencies",
        "Reduces financial stress and improves decision-making",
        "Keep in high-yield savings account (4-5% APY)",
        "Automate monthly transfers to build consistently"
      ],
      impactChart: "pie"
    });
  }

  if (mortgageBalance > 0 || true) {
    recs.push({
      id: "mortgage-killer",
      title: "Deploy the Mortgage Killer Strategy",
      description: "Use IUL policy loans to eliminate your mortgage while building tax-free wealth",
      scoreBoost: 7,
      category: "growth",
      icon: Home,
      difficulty: "hard",
      timeframe: "15-20 years",
      details: [
        "Redirect mortgage payments into IUL after payoff",
        "Tax-free policy loans can pay off mortgage early",
        "Builds wealth simultaneously while eliminating debt",
        "Net result: mortgage-free + substantial cash value"
      ],
      tabLink: "/portal/mortgage-killer",
      tabName: "Mortgage Killer",
      impactChart: "line"
    });
  }

  if ((taxableInvestments > 0 && realEstateEquity === 0) || true) {
    recs.push({
      id: "real-estate",
      title: "Add Real Estate to Your Portfolio",
      description: "Diversify beyond stocks with rental income and appreciation",
      scoreBoost: 6,
      category: "allocation",
      icon: Home,
      difficulty: "hard",
      timeframe: "1-3 months to acquire",
      details: [
        "Rental income provides passive cash flow",
        "Real estate appreciates 3-5% annually on average",
        "Tax benefits: depreciation, 1031 exchanges",
        "Hedge against inflation"
      ],
      tabLink: "/portal/real-estate-mogul",
      tabName: "Real Estate Mogul",
      impactChart: "radar"
    });
  }

  const savingsRate = ((income - monthlyExpenses * 12) / income) * 100;
  if (savingsRate < 20 || true) {
    recs.push({
      id: "savings-rate",
      title: "Increase Your Savings Rate to 20%+",
      description: `Currently saving ~${Math.round(savingsRate || 10)}% of income. Target 20% for faster wealth building.`,
      scoreBoost: 6,
      category: "behavior",
      icon: BarChart3,
      difficulty: "medium",
      timeframe: "Immediate",
      details: [
        "Automate savings on payday (pay yourself first)",
        "Review subscriptions and recurring expenses",
        "Negotiate bills (insurance, phone, utilities)",
        "Each 1% increase compounds significantly over decades"
      ],
      impactChart: "line"
    });
  }

  if (taxableInvestments > 50000 || true) {
    recs.push({
      id: "tax-harvesting",
      title: "Implement Tax-Loss Harvesting",
      description: "Offset capital gains with strategic loss realization in your taxable accounts",
      scoreBoost: 5,
      category: "tax",
      icon: DollarSign,
      difficulty: "easy",
      timeframe: "Ongoing",
      details: [
        "Sell losing positions to offset gains",
        "Up to $3,000/year in ordinary income offset",
        "Reinvest in similar (not identical) assets",
        "Can save $1,000-$10,000+ annually in taxes"
      ],
      impactChart: "bar"
    });
  }

  if (income > 200000 || true) {
    recs.push({
      id: "oil-gas",
      title: "Explore Oil & Gas Tax Sheltering",
      description: "15% annual returns + significant tax deductions from intangible drilling costs",
      scoreBoost: 6,
      category: "tax",
      icon: Flame,
      difficulty: "hard",
      timeframe: "10-12 year commitment",
      details: [
        "85% of investment deductible as IDC in year 1",
        "15% annual returns on invested capital",
        "Can offset earned income tax liability significantly",
        "Principal returned after 10-year lockup period"
      ],
      tabLink: "/portal/hot-income",
      tabName: "Hot Income",
      impactChart: "area"
    });
  }

  if (age > 45 || true) {
    recs.push({
      id: "annuity-income",
      title: "Lock in Guaranteed Lifetime Income",
      description: "Fixed index annuity with income rider for pension-like retirement income",
      scoreBoost: 5,
      category: "income",
      icon: Briefcase,
      difficulty: "medium",
      timeframe: "5-10 year deferral period",
      details: [
        "Guaranteed income you can't outlive",
        "Protected from market downturns",
        "Income riders provide 5-8% annual roll-up",
        "Compare top 10 products for best rates"
      ],
      tabLink: "/portal/income-annuity-top10",
      tabName: "Income Annuity Top 10",
      impactChart: "line"
    });
  }

  recs.push({
    id: "estate-plan",
    title: "Review & Update Your Estate Plan",
    description: "Ensure your wealth transfers efficiently to your beneficiaries",
    scoreBoost: 5,
    category: "protection",
    icon: Heart,
    difficulty: "medium",
    timeframe: "1-2 months",
    details: [
      "Update beneficiary designations on all accounts",
      "Consider a revocable living trust to avoid probate",
      "Review power of attorney and healthcare directives",
      "IUL death benefit passes tax-free to beneficiaries"
    ],
    impactChart: "pie"
  });

  recs.push({
    id: "max-contributions",
    title: "Maximize Retirement Account Contributions",
    description: `Contribute the max to your 401(k) ($${age >= 50 ? "30,500" : "23,500"}/yr) and IRA ($${age >= 50 ? "8,000" : "7,000"}/yr)`,
    scoreBoost: 5,
    category: "growth",
    icon: TrendingUp,
    difficulty: "easy",
    timeframe: "This tax year",
    details: [
      "Reduces current taxable income",
      "Employer match is free money — never leave it on the table",
      "Catch-up contributions available at age 50+",
      "Compound growth over decades is powerful"
    ],
    impactChart: "bar"
  });

  return recs;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  allocation: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  behavior: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
  protection: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  growth: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  tax: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/20" },
  income: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20" },
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-emerald-500/20 text-emerald-400",
  medium: "bg-amber-500/20 text-amber-400",
  hard: "bg-red-500/20 text-red-400",
};

const mockAreaChartData = [
  { year: "Year 1", current: 100000, projected: 105000 },
  { year: "Year 5", current: 150000, projected: 180000 },
  { year: "Year 10", current: 220000, projected: 310000 },
  { year: "Year 15", current: 300000, projected: 520000 },
  { year: "Year 20", current: 400000, projected: 850000 },
];

const mockBarChartData = [
  { name: "Current", value: 45000 },
  { name: "Optimized", value: 72000 },
  { name: "Maximized", value: 110000 },
];

const mockPieChartData = [
  { name: "Stocks", value: 60, color: "#3b82f6" },
  { name: "Bonds", value: 20, color: "#10b981" },
  { name: "Real Estate", value: 15, color: "#f59e0b" },
  { name: "Cash", value: 5, color: "#6366f1" },
];

const mockLineChartData = [
  { age: 50, wealth: 1.2 },
  { age: 55, wealth: 1.8 },
  { age: 60, wealth: 2.7 },
  { age: 65, wealth: 4.1 },
  { age: 70, wealth: 6.0 },
];

const mockRadarChartData = [
  { subject: "Growth", A: 120, B: 110, fullMark: 150 },
  { subject: "Protection", A: 98, B: 130, fullMark: 150 },
  { subject: "Tax", A: 86, B: 130, fullMark: 150 },
  { subject: "Liquidity", A: 99, B: 100, fullMark: 150 },
  { subject: "Income", A: 85, B: 90, fullMark: 150 },
  { subject: "Legacy", A: 65, B: 85, fullMark: 150 },
];

const implementationSteps = [
  { step: 1, action: "Review current asset allocation", status: "Completed", date: "2023-10-15" },
  { step: 2, action: "Open Roth IRA account", status: "In Progress", date: "2023-11-01" },
  { step: 3, action: "Transfer initial funds", status: "Pending", date: "2023-11-15" },
  { step: 4, action: "Set up automatic contributions", status: "Pending", date: "2023-12-01" },
  { step: 5, action: "Quarterly review", status: "Scheduled", date: "2024-03-01" },
];

const riskMetrics = [
  { metric: "Portfolio Volatility", current: "12.5%", target: "< 10.0%", status: "Needs Attention" },
  { metric: "Max Drawdown", current: "-18.2%", target: "> -15.0%", status: "Needs Attention" },
  { metric: "Sharpe Ratio", current: "0.85", target: "> 1.0", status: "Fair" },
  { metric: "Beta (vs S&P 500)", current: "1.1", target: "0.8 - 0.9", status: "High" },
  { metric: "Yield", current: "1.8%", target: "3.0%+", status: "Low" },
];

export default function Recommendations() {
  const { data: clientData } = useClientData();
  const { user } = useAuth();
  const [acceptedRecs, setAcceptedRecs] = useState<Set<string>>(new Set());
  const [expandedRec, setExpandedRec] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("recommendations");
  const [simulationYears, setSimulationYears] = useState<number>(10);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [selectedMetric, setSelectedMetric] = useState<string>("netWorth");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"boost" | "difficulty" | "category">("boost");
  
  const { data: clientsData, isLoading: clientsLoading } = trpc.clients?.list?.useQuery(undefined, { enabled: false }) || { data: null, isLoading: false };
  const { data: notesData, isLoading: notesLoading } = trpc.notes?.list?.useQuery(undefined, { enabled: false }) || { data: null, isLoading: false };
  const { data: activityData, isLoading: activityLoading } = trpc.activity?.recent?.useQuery(undefined, { enabled: false }) || { data: null, isLoading: false };
  const { data: dashboardData, isLoading: dashboardLoading } = trpc.dashboard?.summary?.useQuery(undefined, { enabled: false }) || { data: null, isLoading: false };
  const { data: marketData, isLoading: marketLoading } = trpc.market?.overview?.useQuery(undefined, { enabled: false }) || { data: null, isLoading: false };
  
  const saveRecsMutation = trpc.recommendations?.save?.useMutation() || { mutate: () => {}, isLoading: false };
  const updateStatusMutation = trpc.recommendations?.updateStatus?.useMutation() || { mutate: () => {}, isLoading: false };

  const allRecommendations = useMemo(() => generateRecommendations(clientData), [clientData]);

  const recommendations = useMemo(() => {
    let result = [...allRecommendations];
    
    if (filter !== "all") {
      result = result.filter((r) => r.category === filter);
    }
    
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter((r) => 
        r.title.toLowerCase().includes(lowerQuery) || 
        r.description.toLowerCase().includes(lowerQuery)
      );
    }
    
    result.sort((a, b) => {
      if (sortOrder === "boost") return b.scoreBoost - a.scoreBoost;
      if (sortOrder === "difficulty") {
        const diffScore = { easy: 1, medium: 2, hard: 3 };
        return diffScore[a.difficulty] - diffScore[b.difficulty];
      }
      if (sortOrder === "category") return a.category.localeCompare(b.category);
      return 0;
    });
    
    return result;
  }, [allRecommendations, filter, searchQuery, sortOrder]);

  const baseScore = useMemo(() => {
    if (!clientData) return 45;
    const totalAssets = (clientData.cashSavings ?? 0) + (clientData.taxableInvestments ?? 0) +
      (clientData.realEstateEquity ?? 0) + (clientData.iraBalance ?? 0) +
      (clientData.rothBalance ?? 0) + (clientData.lifeInsuranceCv ?? 0);
    const totalDebt = (clientData.mortgageBalance ?? 0);
    const netWorth = totalAssets - totalDebt;
    const income = clientData.annualIncome ?? 250000;
    const ratio = netWorth / Math.max(income, 1);
    return Math.min(100, Math.max(15, Math.round(ratio * 12 + 25)));
  }, [clientData]);

  const boostedScore = useMemo(() => {
    const boost = allRecommendations
      .filter((r) => acceptedRecs.has(r.id))
      .reduce((sum, r) => sum + r.scoreBoost, 0);
    return Math.min(100, baseScore + boost);
  }, [baseScore, acceptedRecs, allRecommendations]);

  const currentLevel = getLevel(baseScore);
  const boostedLevel = getLevel(boostedScore);

  const totalPossibleBoost = allRecommendations.reduce((sum, r) => sum + r.scoreBoost, 0);

  const toggleRec = useCallback((id: string) => {
    setAcceptedRecs(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast("Recommendation removed from your plan");
      } else {
        next.add(id);
        const rec = allRecommendations.find((r) => r.id === id);
        toast.success(`+${rec?.scoreBoost} points! ${rec?.title} added to your plan! 🎯`);
      }
      return next;
    });
  }, [allRecommendations]);
  
  const acceptAllRecs = useCallback(() => {
    const newAccepted = new Set<string>();
    recommendations.forEach((r) => newAccepted.add(r.id));
    setAcceptedRecs(newAccepted);
    toast.success(`Accepted all ${recommendations.length} recommendations!`);
  }, [recommendations]);
  
  const clearAllRecs = useCallback(() => {
    setAcceptedRecs(new Set());
    toast("Cleared all accepted recommendations");
  }, []);

  useEffect(() => {
    if (acceptedRecs.size > 0 && acceptedRecs.size === allRecommendations.length) {
      toast.success("Incredible! You've accepted all available recommendations!", {
        icon: "🌟",
        duration: 5000
      });
    }
  }, [acceptedRecs.size, allRecommendations.length]);

  useEffect(() => {
    const timer = setTimeout(() => {
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleSavePlan = () => {
    if (saveRecsMutation.mutate) {
      saveRecsMutation.mutate({
        clientId: clientData?.id || "unknown",
        acceptedRecs: Array.from(acceptedRecs),
        projectedScore: boostedScore
      });
    }
    toast.success("Financial plan saved successfully!");
  };

  const renderImpactChart = (type: string | undefined) => {
    if (!type) return null;
    
    switch (type) {
      case "area":
        return (
          <div className="h-48 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockAreaChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#64748b" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#64748b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} />
                <Legend />
                <Area type="monotone" dataKey="projected" name="With Strategy" stroke="#10b981" fillOpacity={1} fill="url(#colorProjected)" />
                <Area type="monotone" dataKey="current" name="Current Path" stroke="#64748b" fillOpacity={1} fill="url(#colorCurrent)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );
      case "bar":
        return (
          <div className="h-48 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockBarChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} cursor={{fill: '#334155', opacity: 0.4}} />
                <Bar dataKey="value" name="Value" radius={[4, 4, 0, 0]}>
                  {mockBarChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#64748b' : index === 1 ? '#3b82f6' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      case "pie":
        return (
          <div className="h-48 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockPieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {mockPieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );
      case "line":
        return (
          <div className="h-48 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockLineChartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <XAxis dataKey="age" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `Age ${val}`} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}M`} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} />
                <Legend />
                <Line type="monotone" dataKey="wealth" name="Projected Wealth" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      case "radar":
        return (
          <div className="h-48 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={mockRadarChartData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#888888', fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                <Radar name="Current" dataKey="A" stroke="#64748b" fill="#64748b" fillOpacity={0.3} />
                <Radar name="Optimized" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.5} />
                <Legend />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto pb-20">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="Recommendations" />

        <ExecutiveSummary
          pageTitle="Recommendations"
          whatItDoes="This strategic planning tool provides institutional-grade analysis of your financial situation, modeling multiple scenarios and projecting outcomes based on your specific inputs. It transforms complex strategic planning concepts into clear, actionable insights with dollar-quantified recommendations."
          opportunities="A coordinated strategy that interlocks your tax, insurance, investment, and estate plans can produce 2-3x better outcomes than optimizing each area independently."
          intent="To give you the same caliber of strategic planning analysis that institutional investors and ultra-high-net-worth families receive — now accessible to every client."
          takeaway="Understanding your strategic planning options with precise dollar amounts empowers you to make confident decisions that compound into significant wealth over time."
          callToAction="Enter your numbers and see exactly how strategic planning strategies can improve your financial outcome."
          followUpQuestions={[
            "How does this strategic planning strategy interact with my other financial plans?",
            "What\'s the single biggest strategic planning opportunity I\'m currently missing?",
            "How would my results change if I started this strategy 5 years earlier?",
          ]}
        />
        <GoalsAccelerator pageName="Recommendations" pageContext="Recommendations — strategic planning modeling with projections and scenario analysis" />
        <TaxBracketPanel grossIncome={clientData?.annualIncome || 150000} filingStatus={clientData?.filingStatus || "single"} stateCode={clientData?.state || "TX"} />
        <RecommendationSummary
          headline="This strategic planning strategy can significantly improve your financial outcome"
          detail="Based on your profile, implementing the recommended strategic planning approach could generate substantial savings and growth over your planning horizon."
          dollarBenefit={600000}
          timeHorizon="20 years"
          confidence="high"
          nextStep="Review with your advisor"
        />
        <DoNothingBaseline
          metrics={[
            { label: "Strategy Coordination", doNothing: 30, recommended: 90, format: "percent" },
            { label: "Goal Achievement Speed", doNothing: 25, recommended: 15, format: "years", higherIsBetter: false },
            { label: "Lifetime Wealth Impact", doNothing: 0, recommended: 600000, format: "currency" },
          ]}
          summary="Without taking action on strategic planning, you leave significant value on the table that compounds into a major opportunity cost over time."
        />
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-amber-400" /> Strategic Recommendations
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">Accept recommendations to level up your financial future and build lasting wealth.</p>
          </div>
          <div className="flex items-center gap-3">
            <FactFinderBadge />
            <Button variant="outline" onClick={handleSavePlan} className="gap-2">
              <Check className="w-4 h-4" /> Save Plan
            </Button>
            <ExportToSlides
              toolName="Recommendations"
              getSections={() => [
                {
                  title: "Current Status",
                  items: [
                    { label: "Current Score", value: baseScore.toString() },
                    { label: "Current Level", value: LEVEL_NAMES[currentLevel - 1] },
                    { label: "Projected Score", value: boostedScore.toString() },
                    { label: "Projected Level", value: LEVEL_NAMES[boostedLevel - 1] }
                  ]
                },
                {
                  title: "Recommendations Progress",
                  items: [
                    { label: "Accepted", value: acceptedRecs.size.toString() },
                    { label: "Total Available", value: allRecommendations.length.toString() }
                  ]
                }
              ]}
            />
          </div>
        </div>

        {/* Top Navigation Tabs */}
        <div className="flex border-b border-border mb-6">
          <button 
            className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'dashboard' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard & Score
          </button>
          <button 
            className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'recommendations' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('recommendations')}
          >
            Action Plan
          </button>
          <button 
            className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'analysis' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('analysis')}
          >
            Deep Analysis
          </button>
          <button 
            className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'implementation' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => setActiveTab('implementation')}
          >
            Implementation
          </button>
        </div>

        {activeTab === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Score Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Current Score */}
              <Card className="border-muted/30 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="pt-8 text-center">
                  <div className="mx-auto w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mb-4">
                    <Activity className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2 font-semibold">Current Score</p>
                  <div className="text-6xl font-black text-muted-foreground my-4">{baseScore}</div>
                  <p className="text-xl font-medium mt-2">{LEVEL_EMOJIS[currentLevel - 1]} {LEVEL_NAMES[currentLevel - 1]}</p>
                  <Badge variant="outline" className="mt-3 bg-muted/10">Level {currentLevel}</Badge>
                </CardContent>
              </Card>

              {/* Boosted Score */}
              <Card className={`border-2 shadow-lg transition-all transform hover:-translate-y-1 ${boostedScore > baseScore ? "border-emerald-500/50 bg-emerald-500/5" : "border-muted/30"}`}>
                <CardContent className="pt-8 text-center relative overflow-hidden">
                  {boostedScore > baseScore && (
                    <div className="absolute top-0 right-0 p-4">
                      <Sparkles className="w-6 h-6 text-emerald-400 animate-pulse" />
                    </div>
                  )}
                  <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${boostedScore > baseScore ? "bg-emerald-500/20" : "bg-muted/20"}`}>
                    <Target className={`w-8 h-8 ${boostedScore > baseScore ? "text-emerald-400" : "text-muted-foreground"}`} />
                  </div>
                  <p className={`text-sm uppercase tracking-wider mb-2 font-semibold ${boostedScore > baseScore ? "text-emerald-400" : "text-muted-foreground"}`}>
                    {acceptedRecs.size > 0 ? "Projected Score" : "Potential Score"}
                  </p>
                  <div className={`text-6xl font-black my-4 ${boostedScore > baseScore ? "text-emerald-400" : "text-muted-foreground"}`}>{boostedScore}</div>
                  <p className="text-xl font-medium mt-2">{LEVEL_EMOJIS[boostedLevel - 1]} {LEVEL_NAMES[boostedLevel - 1]}</p>
                  {boostedLevel > currentLevel && (
                    <Badge className="mt-3 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-sm py-1 px-3">
                      Level Up! +{boostedLevel - currentLevel}
                    </Badge>
                  )}
                </CardContent>
              </Card>

              {/* Progress */}
              <Card className="border-muted/30 shadow-md">
                <CardContent className="pt-6 space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Accepted</p>
                      <Badge variant="outline">{Math.round((acceptedRecs.size / allRecommendations.length) * 100)}%</Badge>
                    </div>
                    <div className="flex items-end gap-2">
                      <p className="text-4xl font-bold">{acceptedRecs.size}</p>
                      <p className="text-lg text-muted-foreground mb-1">/ {allRecommendations.length}</p>
                    </div>
                    <Progress value={(acceptedRecs.size / allRecommendations.length) * 100} className="h-2 mt-3" />
                  </div>
                  
                  <div className="pt-2 border-t border-border">
                    <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2 font-semibold">Score Boost</p>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-2xl font-bold text-emerald-400">+{boostedScore - baseScore}</span>
                      <span className="text-sm text-muted-foreground">of {totalPossibleBoost} possible</span>
                    </div>
                    <Progress value={(boostedScore - baseScore) / totalPossibleBoost * 100} className="h-2 [&>div]:bg-emerald-500" />
                  </div>
                  
                  <div className="pt-2 border-t border-border bg-muted/10 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1 font-medium">Next Milestone</p>
                    <p className="text-sm font-medium flex items-center gap-2">
                      {boostedLevel < 10 ? (
                        <>
                          <span className="text-lg">{LEVEL_EMOJIS[boostedLevel]}</span> 
                          <span>{LEVEL_NAMES[boostedLevel]} ({boostedLevel * 10 + 5} pts)</span>
                        </>
                      ) : (
                        "🌟 You've reached the pinnacle!"
                      )}
                    </p>
                    {boostedLevel < 10 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Need {boostedLevel * 10 + 5 - boostedScore} more points
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Level Progress Bar */}
            <Card className="border-amber-500/20 bg-gradient-to-r from-amber-500/5 via-transparent to-emerald-500/5 shadow-md">
              <CardContent className="py-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-amber-400" />
                    <h3 className="text-lg font-bold">Wealth Building Journey</h3>
                  </div>
                  <Badge variant="outline" className="bg-background">Current Tier: {LEVEL_NAMES[currentLevel - 1]}</Badge>
                </div>
                
                <div className="relative pt-8 pb-4">
                  {/* Background track */}
                  <div className="absolute top-10 left-0 right-0 h-1.5 bg-muted rounded-full" />
                  
                  {/* Active track */}
                  <div 
                    className="absolute top-10 left-0 h-1.5 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-1000"
                    style={{ width: `${(boostedLevel / 10) * 100}%` }}
                  />
                  
                  <div className="flex justify-between relative z-10">
                    {LEVEL_EMOJIS.map((emoji, i) => {
                      const levelNum = i + 1;
                      const isCurrentOrBelow = levelNum <= boostedLevel;
                      const isCurrentLevel = levelNum === currentLevel;
                      const isProjectedLevel = levelNum === boostedLevel && boostedLevel > currentLevel;
                      
                      return (
                        <div key={i} className="flex flex-col items-center relative group">
                          <div 
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all duration-300 ${
                              isCurrentLevel ? "bg-amber-500/20 ring-2 ring-amber-500 scale-125 z-20" : 
                              isProjectedLevel ? "bg-emerald-500/20 ring-2 ring-emerald-500 scale-125 z-20 animate-pulse" :
                              isCurrentOrBelow ? "bg-primary/20" : "bg-muted opacity-50 grayscale"
                            }`}
                          >
                            {emoji}
                          </div>
                          
                          <div className={`mt-3 text-center transition-all ${isCurrentLevel || isProjectedLevel ? "opacity-100 font-bold" : "opacity-70"}`}>
                            <p className={`text-[11px] whitespace-nowrap ${isCurrentOrBelow ? "text-foreground" : "text-muted-foreground"}`}>
                              {LEVEL_NAMES[i].split(" ")[0]}
                            </p>
                            <p className="text-[9px] text-muted-foreground mt-0.5">{i * 10 + 15}</p>
                          </div>
                          
                          {/* Tooltip on hover */}
                          <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-popover text-popover-foreground text-xs p-2 rounded shadow-lg pointer-events-none whitespace-nowrap z-30 border border-border">
                            <p className="font-bold">{LEVEL_NAMES[i]}</p>
                            <p className="text-muted-foreground">Score: {i * 10 + 15}-{i * 10 + 24}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Radar Chart Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" /> Strategy Balance
                  </CardTitle>
                  <CardDescription>How your recommendations impact different financial areas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={mockRadarChartData}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#888888', fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                        <Radar name="Current Profile" dataKey="A" stroke="#64748b" fill="#64748b" fillOpacity={0.3} />
                        <Radar name="Optimized Profile" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.5} />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" /> Projected Wealth Trajectory
                  </CardTitle>
                  <CardDescription>Impact of implementing all recommendations over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={mockAreaChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorProjectedMain" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                          </linearGradient>
                          <linearGradient id="colorCurrentMain" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#64748b" stopOpacity={0.5}/>
                            <stop offset="95%" stopColor="#64748b" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="year" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                          formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                        <Area type="monotone" dataKey="projected" name="Optimized Plan" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorProjectedMain)" />
                        <Area type="monotone" dataKey="current" name="Current Trajectory" stroke="#64748b" strokeWidth={2} fillOpacity={1} fill="url(#colorCurrentMain)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Controls */}
            <Card className="border-muted/30 shadow-sm">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                  <div className="w-full md:w-1/3">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Search recommendations..."
                        className="block w-full pl-10 pr-3 py-2 border border-input rounded-md leading-5 bg-background placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
                    <span className="text-sm text-muted-foreground whitespace-nowrap mr-2">Sort by:</span>
                    <select 
                      className="bg-background border border-input text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as any)}
                    >
                      <option value="boost">Impact Score (High to Low)</option>
                      <option value="difficulty">Difficulty (Easy to Hard)</option>
                      <option value="category">Category (A-Z)</option>
                    </select>
                    
                    <div className="h-6 w-px bg-border mx-2"></div>
                    
                    <Button variant="outline" size="sm" onClick={acceptAllRecs} className="whitespace-nowrap">
                      Accept All
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearAllRecs} className="whitespace-nowrap text-muted-foreground hover:text-destructive">
                      Clear
                    </Button>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                  {[
                    { value: "all", label: "All", count: allRecommendations.length },
                    { value: "tax", label: "Tax", count: allRecommendations.filter((r) => r.category === "tax").length },
                    { value: "growth", label: "Growth", count: allRecommendations.filter((r) => r.category === "growth").length },
                    { value: "protection", label: "Protection", count: allRecommendations.filter((r) => r.category === "protection").length },
                    { value: "behavior", label: "Behavior", count: allRecommendations.filter((r) => r.category === "behavior").length },
                    { value: "allocation", label: "Allocation", count: allRecommendations.filter((r) => r.category === "allocation").length },
                    { value: "income", label: "Income", count: allRecommendations.filter((r) => r.category === "income").length },
                  ].filter((f) => f.count > 0).map((f) => (
                    <Button
                      key={f.value}
                      variant={filter === f.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilter(f.value)}
                      className={filter === f.value ? "" : "bg-muted/30"}
                    >
                      {f.label} <Badge variant="secondary" className="ml-2 px-1.5 py-0 text-[10px] bg-background/50">{f.count}</Badge>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recommendations List */}
            <div className="space-y-4">
              {recommendations.length === 0 ? (
                <div className="text-center py-12 bg-muted/10 rounded-lg border border-dashed border-border">
                  <Info className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium">No recommendations found</h3>
                  <p className="text-muted-foreground mt-1">Try adjusting your filters or search query.</p>
                  <Button variant="link" onClick={() => { setFilter("all"); setSearchQuery(""); }} className="mt-4">
                    Clear all filters
                  </Button>
                </div>
              ) : (
                recommendations.map((rec) => {
                  const Icon = rec.icon;
                  const isAccepted = acceptedRecs.has(rec.id);
                  const isExpanded = expandedRec === rec.id;
                  const colors = CATEGORY_COLORS[rec.category];

                  return (
                    <Card
                      key={rec.id}
                      className={`transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer overflow-hidden ${
                        isAccepted ? "border-emerald-500/50 bg-emerald-500/5" : "border-muted/30 hover:border-muted/50"
                      }`}
                      onClick={() => setExpandedRec(isExpanded ? null : rec.id)}
                    >
                      <CardContent className="p-0">
                        <div className="p-5">
                          <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div className={`w-14 h-14 rounded-2xl ${colors.bg} flex items-center justify-center flex-shrink-0 shadow-inner border ${colors.border}`}>
                              <Icon className={`w-7 h-7 ${colors.text}`} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                <div>
                                  <h3 className="font-bold text-lg flex items-center gap-2">
                                    {isAccepted && <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
                                    {rec.title}
                                  </h3>
                                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{rec.description}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0 sm:mt-0 mt-2">
                                  <div className="flex flex-col items-end">
                                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-bold text-sm px-3 py-1">
                                      +{rec.scoreBoost} pts
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-semibold">Impact Score</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 mt-4 flex-wrap">
                                <Badge variant="outline" className={`text-xs px-2.5 py-0.5 ${colors.text} ${colors.border} bg-background`}>
                                  {rec.category.charAt(0).toUpperCase() + rec.category.slice(1)}
                                </Badge>
                                <Badge variant="outline" className={`text-xs px-2.5 py-0.5 bg-background ${DIFFICULTY_COLORS[rec.difficulty]}`}>
                                  {rec.difficulty.charAt(0).toUpperCase() + rec.difficulty.slice(1)} Effort
                                </Badge>
                                <div className="flex items-center text-xs text-muted-foreground bg-muted/30 px-2.5 py-1 rounded-full">
                                  <Clock className="w-3.5 h-3.5 mr-1.5" /> {rec.timeframe}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-center h-14 w-8 flex-shrink-0">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-muted/20 transition-transform duration-300 ${isExpanded ? "rotate-180 bg-primary/10 text-primary" : "text-muted-foreground"}`}>
                                <ChevronRight className="w-5 h-5" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Expanded Details - Using height animation for smooth expansion */}
                        <div className={`grid transition-all duration-300 ease-in-out ${isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                          <div className="overflow-hidden">
                            <div className="p-5 pt-0 border-t border-border/50 bg-muted/5" onClick={e => e.stopPropagation()}>
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                                {/* Left Column: Details */}
                                <div>
                                  <h4 className="text-sm font-bold mb-3 flex items-center gap-2 text-foreground">
                                    <Target className="w-4 h-4 text-primary" /> Strategic Advantages
                                  </h4>
                                  <ul className="space-y-2.5">
                                    {rec.details.map((d, i) => (
                                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-3 bg-background p-2.5 rounded-md border border-border/50 shadow-sm">
                                        <div className="mt-0.5 bg-primary/10 p-1 rounded-full flex-shrink-0">
                                          <Star className="w-3.5 h-3.5 text-primary" />
                                        </div>
                                        <span className="leading-snug">{d}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                
                                {/* Right Column: Chart & Actions */}
                                <div className="flex flex-col">
                                  <h4 className="text-sm font-bold mb-3 flex items-center gap-2 text-foreground">
                                    <LineChartIcon className="w-4 h-4 text-primary" /> Projected Impact
                                  </h4>
                                  
                                  <div className="bg-background rounded-md border border-border/50 p-3 shadow-sm flex-1 flex flex-col justify-center mb-4">
                                    {renderImpactChart(rec.impactChart)}
                                  </div>
                                  
                                  <div className="flex items-center gap-3 mt-auto pt-2">
                                    <Button
                                      className={`flex-1 shadow-sm transition-all ${isAccepted ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/30" : "bg-primary hover:bg-primary/90"}`}
                                      variant={isAccepted ? "outline" : "default"}
                                      size="lg"
                                      onClick={(e) => { e.stopPropagation(); toggleRec(rec.id); }}
                                    >
                                      {isAccepted ? (
                                        <><CheckCircle className="w-5 h-5 mr-2" /> Added to Plan</>
                                      ) : (
                                        <><Zap className="w-5 h-5 mr-2" /> Accept Strategy (+{rec.scoreBoost} pts)</>
                                      )}
                                    </Button>
                                    
                                    {rec.tabLink && (
                                      <Button
                                        size="lg"
                                        variant="outline"
                                        className="shadow-sm hover:bg-muted/50"
                                        onClick={(e) => { e.stopPropagation(); window.location.href = rec.tabLink!; }}
                                      >
                                        <ArrowUpRight className="w-5 h-5 mr-2" /> Explore {rec.tabName}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>

            {/* Summary CTA */}
            {acceptedRecs.size > 0 && (
              <Card className="border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-amber-500/10 shadow-lg mt-8 transform transition-all hover:scale-[1.01]">
                <CardContent className="py-8 text-center space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
                  <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl"></div>
                  
                  <div className="text-6xl animate-bounce-slow relative z-10">{LEVEL_EMOJIS[boostedLevel - 1]}</div>
                  
                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-2">
                      Great progress! You've accepted {acceptedRecs.size} strategy{acceptedRecs.size > 1 ? "s" : ""}
                    </h3>
                    <div className="inline-block bg-background/80 backdrop-blur-sm px-6 py-3 rounded-xl border border-border/50 shadow-sm mt-2 mb-4">
                      <p className="text-base text-foreground">
                        Projected Financial Score: <span className="text-emerald-400 font-black text-xl ml-1">{boostedScore}/100</span>
                      </p>
                      <p className="text-sm font-medium mt-1">
                        New Tier: <span className="text-primary">{LEVEL_NAMES[boostedLevel - 1]}</span>
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                      Your strategic plan is taking shape. The next step is execution. Visit the Implementation tab or explore individual strategy labs to put these plans into action.
                    </p>
                    
                    <div className="mt-6 flex justify-center gap-4">
                      <Button onClick={handleSavePlan} className="gap-2 px-6" size="lg">
                        <Check className="w-5 h-5" /> Finalize Plan
                      </Button>
                      <Button variant="outline" onClick={() => setActiveTab('implementation')} className="gap-2 px-6" size="lg">
                        <FileText className="w-5 h-5" /> View Implementation Steps
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Deep Financial Analysis</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Projection Timeline:</span>
                <select 
                  className="bg-background border border-input text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  value={simulationYears}
                  onChange={(e) => setSimulationYears(Number(e.target.value))}
                >
                  <option value={5}>5 Years</option>
                  <option value={10}>10 Years</option>
                  <option value={20}>20 Years</option>
                  <option value={30}>30 Years</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Asset Allocation Breakdown */}
              <Card className="lg:col-span-1 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 text-primary" /> Target Allocation
                  </CardTitle>
                  <CardDescription>Optimal portfolio distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={mockPieChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                          label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {mockPieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                          formatter={(value: number) => [`${value}%`, 'Allocation']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="mt-4 space-y-3">
                    {mockPieChartData.map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                          <span>{item.name}</span>
                        </div>
                        <span className="font-medium">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Tax Savings Analysis */}
              <Card className="lg:col-span-2 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-emerald-500" /> Projected Tax Savings
                    </CardTitle>
                    <CardDescription>Cumulative savings from recommended tax strategies</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                    High Impact Area
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mockAreaChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                        <XAxis dataKey="year" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px' }}
                          cursor={{fill: '#334155', opacity: 0.2}}
                        />
                        <Legend />
                        <Bar dataKey="current" name="Standard Taxes" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="projected" name="Optimized Taxes" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Risk Metrics Table */}
            <Card className="shadow-md overflow-hidden">
              <CardHeader className="bg-muted/10 border-b border-border">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" /> Risk & Performance Metrics
                </CardTitle>
                <CardDescription>Comparison of current portfolio vs optimized portfolio</CardDescription>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/20">
                    <tr>
                      <th scope="col" className="px-6 py-4 font-medium">Metric</th>
                      <th scope="col" className="px-6 py-4 font-medium">Current Profile</th>
                      <th scope="col" className="px-6 py-4 font-medium">Target / Optimized</th>
                      <th scope="col" className="px-6 py-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riskMetrics.map((row, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/5 transition-colors">
                        <td className="px-6 py-4 font-medium text-foreground">{row.metric}</td>
                        <td className="px-6 py-4 text-muted-foreground">{row.current}</td>
                        <td className="px-6 py-4 font-medium text-primary">{row.target}</td>
                        <td className="px-6 py-4">
                          <Badge 
                            variant="outline" 
                            className={
                              row.status === "Needs Attention" ? "bg-red-500/10 text-red-500 border-red-500/20" :
                              row.status === "High" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                              row.status === "Low" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                              "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                            }
                          >
                            {row.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'implementation' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="shadow-md border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h2 className="text-2xl font-bold mb-2">Your 90-Day Action Plan</h2>
                    <p className="text-muted-foreground">
                      We've organized your accepted recommendations into a clear step-by-step implementation timeline. 
                      Complete these steps to reach your target score of {boostedScore}.
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <Button size="lg" className="w-full md:w-auto shadow-md">
                      Schedule Advisor Review
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="shadow-md h-full">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-primary" /> Implementation Checklist
                    </CardTitle>
                    <CardDescription>Track your progress on strategic initiatives</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                      {implementationSteps.map((step, i) => (
                        <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-muted/20 text-muted-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors">
                            {step.status === "Completed" ? (
                              <Check className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <span className="text-xs font-bold">{step.step}</span>
                            )}
                          </div>
                          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border bg-background shadow-sm">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-primary uppercase tracking-wider">{step.date}</span>
                              <Badge 
                                variant="outline" 
                                className={`text-[10px] ${
                                  step.status === "Completed" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                                  step.status === "In Progress" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                                  "bg-muted/30 text-muted-foreground"
                                }`}
                              >
                                {step.status}
                              </Badge>
                            </div>
                            <h4 className="font-bold text-sm text-foreground">{step.action}</h4>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="shadow-md">
                  <CardHeader className="bg-muted/10 pb-4 border-b border-border">
                    <CardTitle className="text-lg">Resource Center</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 p-0">
                    <div className="divide-y divide-border">
                      <a href="#" className="flex items-center gap-3 p-4 hover:bg-muted/5 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Estate Planning Guide</p>
                          <p className="text-xs text-muted-foreground">PDF • 2.4 MB</p>
                        </div>
                      </a>
                      <a href="#" className="flex items-center gap-3 p-4 hover:bg-muted/5 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                          <Shield className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">IUL Strategy Overview</p>
                          <p className="text-xs text-muted-foreground">Video • 12 mins</p>
                        </div>
                      </a>
                      <a href="#" className="flex items-center gap-3 p-4 hover:bg-muted/5 transition-colors">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Tax-Loss Harvesting 101</p>
                          <p className="text-xs text-muted-foreground">Article • 5 min read</p>
                        </div>
                      </a>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md bg-gradient-to-br from-muted/30 to-background border-muted">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Lock className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg mb-2">Need Assistance?</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Your dedicated advisory team is ready to help implement these strategies.
                    </p>
                    <Button variant="outline" className="w-full">Contact Advisor</Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>

      <NAICDisclaimer variant="compact" showsProjections />
    
        <ComplianceFooter pageName="Recommendations" showsIUL showsAnnuity showsTax showsEstate showsProjections showsPolicyLoans />
      </AppShell>
  );
}
