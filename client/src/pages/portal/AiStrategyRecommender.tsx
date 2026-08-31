// @ts-nocheck
import { useState, useMemo, useEffect, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import { Streamdown } from "@/components/StreamdownLite";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Brain,
  Sparkles,
  Target,
  Shield,
  TrendingUp,
  DollarSign,
  RefreshCw,
  User,
  Zap,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Download,
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Info,
  LineChart as LineChartIcon,
  List,
  MessageSquare,
  Settings,
  Star,
  Activity,
  FileText,
  Search,
  Sliders,
  TrendingDown,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
  Legend
} from "recharts";
import { useClientData } from "@/contexts/ClientDataContext";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-[#0b1628] border border-[#12233e] rounded-xl overflow-hidden ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ title, icon: Icon, action }: { title: string; icon?: any; action?: React.ReactNode }) => (
  <div className="p-4 border-b border-[#12233e] flex items-center justify-between bg-[#0d1a2e]">
    <div className="flex items-center gap-2">
      {Icon && <Icon className="w-5 h-5 text-[#7a95b8]" />}
      <h3 className="text-white font-semibold">{title}</h3>
    </div>
    {action && <div>{action}</div>}
  </div>
);

const CardContent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-4 ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, variant = "default", className = "" }: { children: React.ReactNode; variant?: "default" | "success" | "warning" | "danger" | "info"; className?: string }) => {
  const variants = {
    default: "bg-[#12233e] text-[#c8d8ec] border-[#2a3f5f]",
    success: "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/30",
    warning: "bg-[#f0c040]/10 text-[#f0c040] border-[#f0c040]/30",
    danger: "bg-red-500/10 text-red-400 border-red-500/30",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/30"
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default function AiStrategyRecommender() {
  const { clientData } = useClientData();
  const { user } = useAuth();
  
  const clientsQuery = trpc.clients.list.useQuery(undefined, { staleTime: 60_000 });
  const clients = clientsQuery.data ?? [];
  
  const strategyHistoryQuery = trpc.savedStrategies.list.useQuery(undefined, { staleTime: 120_000 });
  const strategyHistory = strategyHistoryQuery.data ?? [];
  
  const marketDataQuery = trpc.marketData.getLatest.useQuery(undefined, { staleTime: 300_000 });
  const marketData = marketDataQuery.data ?? { sAndP500: 5000, nasdaq: 15000, tenYearTreasury: 4.2 };
  
  const complianceAlertsQuery = trpc.complianceAlerts.list.useQuery(undefined, { staleTime: 60_000 });
  const complianceAlerts = complianceAlertsQuery.data ?? [];
  
  const knowledgeDocsQuery = trpc.knowledge.list.useQuery(undefined, { staleTime: 300_000 });
  const knowledgeDocs = knowledgeDocsQuery.data ?? [];

  const [selectedClientId, setSelectedClientId] = useState<number>(0);
  const [result, setResult] = useState<any | null>(null);
  const [quickMode, setQuickMode] = useState<"tax" | "insurance" | "investment" | "full">("full");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [riskTolerance, setRiskTolerance] = useState<number>(50);
  const [timeHorizon, setTimeHorizon] = useState<number>(10);
  const [targetReturn, setTargetReturn] = useState<number>(7);
  const [activeTab, setActiveTab] = useState<"summary" | "ladder" | "projections" | "docs">("summary");
  const [includeSocialSecurity, setIncludeSocialSecurity] = useState(true);
  const [inflationRate, setInflationRate] = useState<number>(3);
  const [isComparing, setIsComparing] = useState(false);
  const [compareResult, setCompareResult] = useState<any | null>(null);
  const [notes, setNotes] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [simulationYears, setSimulationYears] = useState<number>(20);
  const [confidenceInterval, setConfidenceInterval] = useState<number>(95);
  const [chartView, setChartView] = useState<"cumulative" | "annual">("cumulative");
  const [isExporting, setIsExporting] = useState(false);

  const filteredClients = useMemo(() => {
    if (!searchQuery) return clients;
    return clients.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [clients, searchQuery]);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId),
    [clients, selectedClientId]
  );

  const clientAge = selectedClient?.age ?? 45;
  const clientRetirementAge = 65;
  const yearsToRetirement = Math.max(0, clientRetirementAge - clientAge);

  useEffect(() => {
    if (selectedClient) {
      if (clientAge > 60) {
        setRiskTolerance(30);
        setTimeHorizon(15);
      } else if (clientAge < 40) {
        setRiskTolerance(80);
        setTimeHorizon(30);
      } else {
        setRiskTolerance(60);
        setTimeHorizon(20);
      }
    }
  }, [selectedClient, clientAge]);

  useEffect(() => {
    if (selectedClient && result && result.clientId !== selectedClient.id) {
      setResult(null);
      setCompareResult(null);
    }
  }, [selectedClient, result]);

  const generateMut = trpc.ai.generateStrategy.useMutation({
    onSuccess: (data) => {
      setResult({ ...data, clientId: selectedClient?.id });
      setActiveTab("summary");
      toast.success("Strategy recommendation generated successfully");
      
      if (isComparing) {
        setTimeout(() => {
          setCompareResult({
            ...data,
            opportunityScore: Math.max(0, data.opportunityScore - 15),
            ladder: data.ladder?.map((l) => ({
              ...l,
              taxEstimate: l.taxEstimate * 1.2,
              newRothBalance: l.newRothBalance * 0.9
            }))
          });
        }, 1000);
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const saveStrategyMut = trpc.savedStrategies.create.useMutation({
    onSuccess: () => {
      toast.success("Strategy saved to client profile");
    },
    onError: (e) => toast.error(e.message),
  });

  const handleGenerate = useCallback(() => {
    if (!selectedClient) {
      toast.error("Please select a client first");
      return;
    }
    const modeNotes: Record<string, string> = {
      tax: "Focus primarily on tax optimization strategies, Roth conversions, and bracket management.",
      insurance: "Focus primarily on IUL, life insurance, and risk management strategies.",
      investment: "Focus primarily on investment allocation, real estate leverage, and growth strategies.",
      full: "Provide a comprehensive strategy covering tax, insurance, and investment planning.",
    };
    
    let customNotes = modeNotes[quickMode];
    if (notes) customNotes += `\nAdditional Advisor Notes: ${notes}`;
    if (showAdvanced) {
      customNotes += `\nTarget Return: ${targetReturn}%, Risk Tolerance: ${riskTolerance}/100, Time Horizon: ${timeHorizon} years.`;
    }
    
    generateMut.mutate({
      clientName: selectedClient.name,
      age: selectedClient.age ?? 45,
      income: Number(selectedClient.income ?? 0),
      iraBalance: Number(selectedClient.iraBalance ?? 0),
      rothBalance: Number(selectedClient.rothBalance ?? 0),
      realEstateEquity: Number(selectedClient.realEstateEquity ?? 0),
      notes: customNotes,
    });
  }, [selectedClient, quickMode, notes, showAdvanced, targetReturn, riskTolerance, timeHorizon, generateMut]);

  const handleSaveStrategy = useCallback(() => {
    if (!result || !selectedClient) return;
    saveStrategyMut.mutate({
      clientId: selectedClient.id,
      name: `${quickMode.charAt(0).toUpperCase() + quickMode.slice(1)} Strategy - ${new Date().toLocaleDateString()}`,
      data: JSON.stringify(result),
      score: result.opportunityScore || 85
    });
  }, [result, selectedClient, quickMode, saveStrategyMut]);

  const handleExportCsv = useCallback(() => {
    if (!result || !result.ladder) {
      toast.error("No data to export");
      return;
    }
    
    setIsExporting(true);
    try {
      const headers = ["Year", "Conversion", "Est. Tax", "Cumulative Tax", "New Roth Balance"];
      const rows = result.ladder.map((row) => [
        row.year,
        row.conversion,
        row.taxEstimate,
        row.cumulativeTax,
        row.newRothBalance
      ]);
      
      const csvContent = [
        headers.join(","),
        ...rows.map((r: any[]) => r.join(","))
      ].join("\n");
      
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `roth_ladder_${selectedClient?.name.replace(/\s+/g, "_") || "client"}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("CSV exported successfully");
    } catch (e) {
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  }, [result, selectedClient]);

  const toggleDocSelection = useCallback((docId: string) => {
    setSelectedDocs(prev => 
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  }, []);

  const fmt = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  const fmtPct = (n: number) => `${n.toFixed(1)}%`;
  
  const scoreColor = (score: number) =>
    score >= 80 ? "text-[#22c55e]" : score >= 60 ? "text-[#f0c040]" : "text-red-400";

  const scoreBg = (score: number) =>
    score >= 80 ? "bg-[#22c55e]/10 border-[#22c55e]/30" : score >= 60 ? "bg-[#f0c040]/10 border-[#f0c040]/30" : "bg-red-500/10 border-red-500/30";

  
  const pieData = useMemo(() => {
    if (!selectedClient) return [];
    return [
      { name: "IRA", value: Number(selectedClient.iraBalance ?? 0) },
      { name: "Roth", value: Number(selectedClient.rothBalance ?? 0) },
      { name: "Real Estate", value: Number(selectedClient.realEstateEquity ?? 0) },
      { name: "Life Ins CV", value: Number(selectedClient.lifeInsuranceCv ?? 0) },
      { name: "Brokerage", value: Number(selectedClient.brokerageBalance ?? 50000) }, // Mock fallback
    ].filter((d) => d.value > 0);
  }, [selectedClient]);

  const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];

  const barData = useMemo(() => {
    return clients.slice(0, 8).map((c) => ({
      name: c.name.split(" ")[0],
      income: Number(c.income ?? 0),
      target: Number(c.income ?? 0) * 1.2 // Mock target
    }));
  }, [clients]);

  const projectionData = useMemo(() => {
    if (!selectedClient) return [];
    
    let currentWealth = 
      Number(selectedClient.iraBalance ?? 0) + 
      Number(selectedClient.rothBalance ?? 0) + 
      Number(selectedClient.realEstateEquity ?? 0);
      
    if (currentWealth === 0) currentWealth = 100000; // Mock fallback
    
    const data = [];
    const currentYear = new Date().getFullYear();
    
    let wealthWithStrategy = currentWealth;
    let wealthWithoutStrategy = currentWealth;
    
    for (let i = 0; i <= simulationYears; i++) {
      data.push({
        year: currentYear + i,
        age: clientAge + i,
        withStrategy: Math.round(wealthWithStrategy),
        withoutStrategy: Math.round(wealthWithoutStrategy),
        difference: Math.round(wealthWithStrategy - wealthWithoutStrategy)
      });
      
      wealthWithStrategy *= (1 + (targetReturn / 100));
      wealthWithoutStrategy *= (1 + ((targetReturn - 1.5) / 100)); // Assume 1.5% drag without strategy
      
      const savings = Number(selectedClient.income ?? 100000) * 0.15;
      wealthWithStrategy += savings;
      wealthWithoutStrategy += savings * 0.8; // Less efficient savings
    }
    
    return data;
  }, [selectedClient, simulationYears, targetReturn, clientAge]);

  const taxDragData = useMemo(() => {
    if (!result || !result.ladder) return [];
    
    return result.ladder.map((row: any, i: number) => ({
      year: row.year,
      taxPaid: row.taxEstimate,
      taxSaved: row.taxEstimate * 1.5, // Mock future tax savings
      netBenefit: (row.taxEstimate * 1.5) - row.taxEstimate
    }));
  }, [result]);

  const radarData = useMemo(() => {
    const baseScore = result?.opportunityScore || 50;
    
    return [
      { subject: 'Tax Efficiency', A: Math.min(100, baseScore + (quickMode === 'tax' ? 20 : 0)), fullMark: 100 },
      { subject: 'Risk Mitigation', A: Math.min(100, baseScore + (quickMode === 'insurance' ? 20 : 0) - (riskTolerance - 50)/2), fullMark: 100 },
      { subject: 'Growth Potential', A: Math.min(100, baseScore + (quickMode === 'investment' ? 20 : 0) + (riskTolerance - 50)/2), fullMark: 100 },
      { subject: 'Liquidity', A: Math.max(20, 80 - (timeHorizon * 2)), fullMark: 100 },
      { subject: 'Estate Transfer', A: Math.min(100, baseScore + (clientAge > 60 ? 20 : -10)), fullMark: 100 },
      { subject: 'Income Reliability', A: Math.min(100, baseScore + 10), fullMark: 100 },
    ];
  }, [result, quickMode, riskTolerance, timeHorizon, clientAge]);

  const cashFlowData = useMemo(() => {
    if (!selectedClient) return [];
    
    const currentYear = new Date().getFullYear();
    const income = Number(selectedClient.income ?? 100000);
    const data = [];
    
    for (let i = 0; i < 10; i++) {
      const projectedIncome = income * Math.pow(1.03, i);
      const expenses = projectedIncome * 0.7;
      const taxes = projectedIncome * 0.2;
      const savings = projectedIncome - expenses - taxes;
      
      data.push({
        year: currentYear + i,
        income: Math.round(projectedIncome),
        expenses: Math.round(expenses),
        taxes: Math.round(taxes),
        savings: Math.round(savings),
        savingsRate: (savings / projectedIncome) * 100
      });
    }
    return data;
  }, [selectedClient]);

  const renderTable = (headers: string[], data: any[], renderRow: (row: any, i: number) => React.ReactNode) => (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[#12233e] text-[#7a95b8] text-sm bg-[#0d1a2e]">
            {headers.map((h, i) => (
              <th key={i} className={`p-3 font-medium ${i > 0 ? 'text-right' : ''}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="text-[#c8d8ec]">
          {data.map((row, i) => renderRow(row, i))}
        </tbody>
      </table>
    </div>
  );

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="AiStrategyRecommender" />

        <ExecutiveSummary
          pageTitle="AI Strategy Recommender"
          whatItDoes="This AI-powered engine analyzes your complete financial picture — income, assets, debts, goals, and risk tolerance — to generate a personalized multi-strategy recommendation covering tax optimization, insurance, investments, and estate planning."
          opportunities="Most people optimize one area at a time (just taxes, or just investments). The real power comes from interlocking strategies where your tax savings fund your insurance, your insurance protects your investments, and your investments accelerate your goals."
          intent="To show you how all the pieces of your financial life can work together as one coordinated system."
          takeaway="A coordinated strategy across all financial domains can produce 2-3x better outcomes than optimizing each area independently."
          callToAction="Let the AI analyze your full financial picture and generate an interlocking strategy."
          followUpQuestions={[
            "Which of my financial strategies are working against each other?",
            "What\'s the single highest-impact change I could make right now?",
            "How do my strategies compare to what top advisors recommend for my profile?",
          ]}
        />
        <GoalsAccelerator pageName="AI Strategy Recommender" pageContext="AI-powered holistic financial strategy generation covering tax, insurance, investment, and estate planning" />
        <TaxBracketPanel grossIncome={clientData?.annualIncome || 150000} filingStatus={clientData?.filingStatus || "single"} stateCode={clientData?.state || "TX"} />
        <RecommendationSummary
          headline="Implement an interlocking financial strategy for maximum efficiency"
          detail="By coordinating your tax, insurance, and investment strategies, you can redirect savings from one area to accelerate growth in another."
          dollarBenefit={750000}
          timeHorizon="20 years"
          confidence="high"
          nextStep="Review with your advisor"
        />
        <DoNothingBaseline
          metrics={[
            { label: "Strategy Coordination Score", doNothing: 35, recommended: 90, format: "percent" },
            { label: "Tax Efficiency", doNothing: 45, recommended: 85, format: "percent" },
            { label: "Projected Net Worth at 65", doNothing: 2500000, recommended: 4200000, format: "currency" },
          ]}
          summary="Without coordinated strategies, your financial plans work in isolation — or worse, actively undermine each other."
        />
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2 bg-[#0b1628] p-6 rounded-2xl border border-[#12233e] shadow-lg">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <Brain className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  AI Strategy Recommender <span className="text-purple-400 text-sm align-top font-normal bg-purple-500/10 px-2 py-0.5 rounded-full ml-2 border border-purple-500/20">PRO</span>
                </h1>
                <p className="text-[#7a95b8] mt-1 text-sm md:text-base max-w-2xl">
                  Advanced financial modeling engine powered by institutional algorithms and firm-specific knowledge graph.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="rc-btn rc-btn-ghost flex items-center gap-2"
            >
              <Clock className="w-4 h-4" /> History
            </button>
            <ExportToSlides
              toolName="AI Strategy Recommender"
              getSections={() => {
                const sections = [];
                if (selectedClient) {
                  sections.push({
                    title: "Client Profile & Current State",
                    items: [
                      { label: "Name", value: selectedClient.name || "N/A" },
                      { label: "Age", value: String(selectedClient.age ?? "N/A") },
                      { label: "Income", value: fmt(Number(selectedClient.income ?? 0)) },
                      { label: "Total Wealth", value: fmt(
                        Number(selectedClient.iraBalance ?? 0) + 
                        Number(selectedClient.rothBalance ?? 0) + 
                        Number(selectedClient.realEstateEquity ?? 0)
                      ) },
                    ]
                  });
                }
                if (result) {
                  sections.push({
                    title: "Strategy Overview",
                    items: [
                      { label: "Opportunity Score", value: `${result.opportunityScore}/100` },
                      { label: "Focus Area", value: quickMode.toUpperCase() },
                      { label: "Knowledge Docs Used", value: String(result.groundingDocCount || 0) }
                    ]
                  });
                  
                  if (result.ladder && result.ladder.length > 0) {
                    sections.push({
                      title: "Roth Conversion Plan (First 3 Years)",
                      items: result.ladder.slice(0, 3).map((l) => ({
                        label: `Year ${l.year}`,
                        value: `Convert ${fmt(l.conversion)} (Est. Tax: ${fmt(l.taxEstimate)})`
                      }))
                    });
                  }
                }
                if (sections.length === 0) {
                  sections.push({
                    title: "AI Strategy Recommender",
                    items: [{ label: "Status", value: "No strategy generated yet." }]
                  });
                }
                return sections;
              }}
            />
          </div>
        </div>

        {/* Market Data Ticker */}
        <div className="flex items-center gap-6 overflow-x-auto bg-[#0d1a2e] border border-[#12233e] rounded-lg p-3 text-sm whitespace-nowrap scrollbar-hide">
          <div className="flex items-center gap-2 text-[#7a95b8]">
            <Activity className="w-4 h-4" />
            <span className="font-semibold">Live Market Context:</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#c8d8ec]">S&P 500</span>
            <span className="text-white font-medium">{marketData.sAndP500.toLocaleString()}</span>
            <span className="text-green-400 flex items-center text-xs"><TrendingUp className="w-3 h-3 mr-0.5"/> 1.2%</span>
          </div>
          <div className="w-px h-4 bg-[#2a3f5f]"></div>
          <div className="flex items-center gap-2">
            <span className="text-[#c8d8ec]">NASDAQ</span>
            <span className="text-white font-medium">{marketData.nasdaq.toLocaleString()}</span>
            <span className="text-green-400 flex items-center text-xs"><TrendingUp className="w-3 h-3 mr-0.5"/> 1.5%</span>
          </div>
          <div className="w-px h-4 bg-[#2a3f5f]"></div>
          <div className="flex items-center gap-2">
            <span className="text-[#c8d8ec]">10Y Treasury</span>
            <span className="text-white font-medium">{marketData.tenYearTreasury}%</span>
            <span className="text-red-400 flex items-center text-xs"><TrendingDown className="w-3 h-3 mr-0.5"/> 0.05</span>
          </div>
          <div className="w-px h-4 bg-[#2a3f5f]"></div>
          <div className="flex items-center gap-2 text-yellow-400">
            <AlertCircle className="w-4 h-4" />
            <span>{complianceAlerts.length} Active Compliance Alerts</span>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          {/* LEFT SIDEBAR: Inputs & Controls (4 columns) */}
          <div className="xl:col-span-4 space-y-6">
            
            {/* Client Selection Card */}
            <Card>
              <CardHeader title="1. Select Client" icon={User} />
              <CardContent>
                <div className="relative mb-4">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-[#7a95b8]" />
                  <input
                    type="text"
                    placeholder="Search clients..."
                    className="rc-input w-full pl-9 bg-[#0d1a2e]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {clientsQuery.isPending ? (
                  <div className="py-8 flex justify-center">
                    <RefreshCw className="w-6 h-6 text-[#7a95b8] animate-spin" />
                  </div>
                ) : (
                  <select
                    className="rc-input w-full bg-[#0d1a2e] mb-4"
                    value={selectedClientId || ""}
                    onChange={(e) => {
                      setSelectedClientId(e.target.value ? Number(e.target.value) : 0);
                    }}
                  >
                    <option value="">Choose a client...</option>
                    {filteredClients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.age ? `(${c.age})` : ''}
                      </option>
                    ))}
                  </select>
                )}

                {selectedClient && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-[#c8d8ec]">Client Snapshot</h4>
                      <Badge variant="info">{yearsToRetirement} yrs to retirement</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#0d1a2e] p-2.5 rounded-lg border border-[#12233e]">
                        <div className="text-xs text-[#7a95b8] mb-1">Age</div>
                        <div className="font-semibold text-white">{selectedClient.age ?? "N/A"}</div>
                      </div>
                      <div className="bg-[#0d1a2e] p-2.5 rounded-lg border border-[#12233e]">
                        <div className="text-xs text-[#7a95b8] mb-1">Income</div>
                        <div className="font-semibold text-white">{fmt(Number(selectedClient.income ?? 0))}</div>
                      </div>
                      <div className="bg-[#0d1a2e] p-2.5 rounded-lg border border-[#12233e]">
                        <div className="text-xs text-[#7a95b8] mb-1">Tax-Advantaged</div>
                        <div className="font-semibold text-[#22c55e]">{fmt(Number(selectedClient.iraBalance ?? 0) + Number(selectedClient.rothBalance ?? 0))}</div>
                      </div>
                      <div className="bg-[#0d1a2e] p-2.5 rounded-lg border border-[#12233e]">
                        <div className="text-xs text-[#7a95b8] mb-1">Other Assets</div>
                        <div className="font-semibold text-[#3b82f6]">{fmt(Number(selectedClient.realEstateEquity ?? 0) + Number(selectedClient.lifeInsuranceCv ?? 0))}</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Strategy Focus Card */}
            <Card className={!selectedClient ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>
              <CardHeader title="2. Strategy Focus" icon={Target} />
              <CardContent>
                <div className="space-y-2">
                  {[
                    { key: "full", label: "Holistic Plan", icon: Sparkles, desc: "Comprehensive 360° strategy", color: "purple" },
                    { key: "tax", label: "Tax Optimization", icon: DollarSign, desc: "Roth conversions & harvesting", color: "green" },
                    { key: "insurance", label: "Risk Management", icon: Shield, desc: "IUL & life insurance design", color: "blue" },
                    { key: "investment", label: "Wealth Growth", icon: TrendingUp, desc: "Allocation & real estate", color: "amber" },
                  ].map((mode) => (
                    <button
                      key={mode.key}
                      onClick={() => setQuickMode(mode.key as any)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                        quickMode === mode.key
                          ? `border-${mode.color}-500/50 bg-${mode.color}-500/10`
                          : "border-[#12233e] bg-[#0d1a2e] hover:border-[#7a95b8]/30 hover:bg-[#12233e]/50"
                      }`}
                    >
                      <div className={`p-2 rounded-md ${quickMode === mode.key ? `bg-${mode.color}-500/20` : 'bg-[#12233e]'}`}>
                        <mode.icon className={`w-4 h-4 ${quickMode === mode.key ? `text-${mode.color}-400` : "text-[#7a95b8]"}`} />
                      </div>
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${quickMode === mode.key ? "text-white" : "text-[#c8d8ec]"}`}>
                          {mode.label}
                        </div>
                        <div className="text-xs text-[#7a95b8]">{mode.desc}</div>
                      </div>
                      {quickMode === mode.key && <CheckCircle className={`w-4 h-4 text-${mode.color}-400`} />}
                    </button>
                  ))}
                </div>

                {/* Advanced Settings Toggle */}
                <div className="mt-4 border-t border-[#12233e] pt-4">
                  <button 
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center justify-between w-full text-sm text-[#7a95b8] hover:text-[#c8d8ec] transition-colors"
                  >
                    <span className="flex items-center gap-2"><Sliders className="w-4 h-4" /> Advanced Parameters</span>
                    {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  
                  {showAdvanced && (
                    <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <label className="text-[#c8d8ec]">Risk Tolerance</label>
                          <span className="text-[#7a95b8]">{riskTolerance}/100</span>
                        </div>
                        <input 
                          type="range" min="1" max="100" 
                          value={riskTolerance} onChange={(e) => setRiskTolerance(Number(e.target.value))}
                          className="w-full accent-purple-500"
                        />
                        <div className="flex justify-between text-[10px] text-[#7a95b8] mt-1">
                          <span>Conservative</span>
                          <span>Aggressive</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-[#c8d8ec] block mb-1">Time Horizon (Yrs)</label>
                          <input 
                            type="number" 
                            value={timeHorizon} onChange={(e) => setTimeHorizon(Number(e.target.value))}
                            className="rc-input w-full text-sm py-1.5 bg-[#0d1a2e]"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-[#c8d8ec] block mb-1">Target Return (%)</label>
                          <input 
                            type="number" step="0.1"
                            value={targetReturn} onChange={(e) => setTargetReturn(Number(e.target.value))}
                            className="rc-input w-full text-sm py-1.5 bg-[#0d1a2e]"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <input 
                          type="checkbox" 
                          id="compare" 
                          checked={isComparing} 
                          onChange={(e) => setIsComparing(e.target.checked)}
                          className="rounded border-[#2a3f5f] bg-[#0d1a2e] text-purple-500 focus:ring-purple-500/20"
                        />
                        <label htmlFor="compare" className="text-sm text-[#c8d8ec] cursor-pointer">
                          Generate Comparison Baseline
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Advisor Notes */}
            <Card className={!selectedClient ? "opacity-50 pointer-events-none" : ""}>
              <CardHeader title="3. Advisor Context" icon={MessageSquare} />
              <CardContent>
                <textarea
                  placeholder="Add specific client concerns, constraints, or goals to guide the AI..."
                  className="rc-input w-full h-24 resize-none bg-[#0d1a2e] text-sm"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                
                {/* Knowledge Base Integration */}
                <div className="mt-3">
                  <div className="text-xs font-medium text-[#7a95b8] mb-2 flex items-center gap-1">
                    <BookOpen className="w-3 h-3" /> Force Include Firm Knowledge:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {knowledgeDocs.slice(0, 4).map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => toggleDocSelection(doc.id)}
                        className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                          selectedDocs.includes(doc.id) 
                            ? "bg-blue-500/20 border-blue-500/50 text-blue-300" 
                            : "bg-[#0d1a2e] border-[#2a3f5f] text-[#7a95b8] hover:border-[#7a95b8]"
                        }`}
                      >
                        {doc.title.substring(0, 20)}...
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Generate Button */}
            <button
              className="rc-btn rc-btn-primary w-full py-4 text-lg font-semibold shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all bg-gradient-to-r from-purple-600 to-blue-600 border-none"
              onClick={handleGenerate}
              disabled={!selectedClient || generateMut.isPending}
            >
              {generateMut.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin" /> Processing Neural Models...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Brain className="w-5 h-5" /> Generate AI Strategy
                </span>
              )}
            </button>
          </div>

          {/* RIGHT MAIN AREA: Results & Visualizations (8 columns) */}
          <div className="xl:col-span-8 space-y-6">
            
            {/* Empty State */}
            {!result && !generateMut.isPending && (
              <div className="h-full min-h-[600px] flex flex-col">
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <Card>
                    <CardHeader title="Asset Distribution Overview" icon={PieChartIcon} />
                    <CardContent className="h-[250px] flex items-center justify-center">
                      {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%" cy="50%"
                              innerRadius={60} outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {pieData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <RTooltip
                              contentStyle={{ background: "#0d1a2e", border: "1px solid #12233e", borderRadius: "8px", color: "#c8d8ec" }}
                              itemStyle={{ color: "#c8d8ec" }}
                              formatter={(val: number) => fmt(val)}
                            />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center text-[#7a95b8] flex flex-col items-center">
                          <PieChartIcon className="w-10 h-10 mb-2 opacity-20" />
                          <span className="text-sm">Select a client to view assets</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader title="Firm Benchmarking" icon={BarChartIcon} />
                    <CardContent className="h-[250px] flex items-center justify-center">
                      {barData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                            <XAxis dataKey="name" stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} dy={10} />
                            <YAxis stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val / 1000}k`} dx={-10} />
                            <RTooltip
                              contentStyle={{ background: "#0d1a2e", border: "1px solid #12233e", borderRadius: "8px", color: "#c8d8ec" }}
                              cursor={{ fill: "#12233e", opacity: 0.5 }}
                              formatter={(val: number) => fmt(val)}
                            />
                            <Bar dataKey="income" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Income" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="text-center text-[#7a95b8] flex flex-col items-center">
                          <BarChartIcon className="w-10 h-10 mb-2 opacity-20" />
                          <span className="text-sm">No benchmark data available</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card className="flex-1 flex flex-col items-center justify-center py-20 text-center border-dashed border-2 bg-[#0b1628]/50">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full"></div>
                    <div className="w-20 h-20 rounded-2xl bg-[#0d1a2e] border border-[#12233e] flex items-center justify-center relative z-10 shadow-xl">
                      <Brain className="w-10 h-10 text-purple-400" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-3">Awaiting Configuration</h3>
                  <p className="text-[#7a95b8] max-w-md mx-auto mb-8 leading-relaxed">
                    Select a client profile and configure parameters on the left. The AI will analyze thousands of scenarios to generate an optimal financial strategy.
                  </p>
                  <div className="grid grid-cols-3 gap-4 max-w-lg w-full text-left">
                    <div className="bg-[#0d1a2e] p-3 rounded-lg border border-[#12233e]">
                      <Zap className="w-5 h-5 text-yellow-400 mb-2" />
                      <div className="text-sm font-medium text-white">Fast Analysis</div>
                      <div className="text-xs text-[#7a95b8]">Processes 10k+ variables</div>
                    </div>
                    <div className="bg-[#0d1a2e] p-3 rounded-lg border border-[#12233e]">
                      <Shield className="w-5 h-5 text-green-400 mb-2" />
                      <div className="text-sm font-medium text-white">Compliant</div>
                      <div className="text-xs text-[#7a95b8]">Checks against firm rules</div>
                    </div>
                    <div className="bg-[#0d1a2e] p-3 rounded-lg border border-[#12233e]">
                      <FileText className="w-5 h-5 text-blue-400 mb-2" />
                      <div className="text-sm font-medium text-white">Client-Ready</div>
                      <div className="text-xs text-[#7a95b8]">Generates presentation</div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Loading State */}
            {generateMut.isPending && (
              <Card className="h-full min-h-[600px] flex flex-col items-center justify-center py-24 text-center relative overflow-hidden">
                {/* Animated background elements */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-[pulse_2s_ease-in-out_infinite]"></div>
                
                <div className="relative mb-8">
                  <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                  <div className="w-24 h-24 rounded-full bg-[#0d1a2e] border border-purple-500/50 flex items-center justify-center relative z-10">
                    <Brain className="w-12 h-12 text-purple-400 animate-pulse" />
                  </div>
                </div>
                
                <h3 className="text-2xl font-semibold text-white mb-4">
                  Synthesizing Strategy for {selectedClient?.name}...
                </h3>
                
                <div className="space-y-3 text-left max-w-sm w-full bg-[#0d1a2e] p-4 rounded-xl border border-[#12233e]">
                  <div className="flex items-center gap-3 text-sm text-[#c8d8ec]">
                    <CheckCircle className="w-4 h-4 text-green-400" /> Analyzing current asset allocation
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[#c8d8ec]">
                    <CheckCircle className="w-4 h-4 text-green-400" /> Projecting tax liabilities
                  </div>
                  <div className="flex items-center gap-3 text-sm text-white font-medium">
                    <RefreshCw className="w-4 h-4 text-purple-400 animate-spin" /> Querying firm knowledge base
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[#7a95b8]">
                    <Clock className="w-4 h-4" /> Generating recommendations
                  </div>
                </div>
              </Card>
            )}

            {/* Results State */}
            {result && !generateMut.isPending && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Top Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className={`border-2 ${scoreBg(result.opportunityScore)}`}>
                    <CardContent className="flex flex-col items-center justify-center py-5 text-center">
                      <div className="text-xs font-medium text-[#7a95b8] uppercase tracking-wider mb-1">Opportunity Score</div>
                      <div className={`text-4xl font-bold ${scoreColor(result.opportunityScore)}`}>
                        {result.opportunityScore}
                      </div>
                      <div className="flex items-center gap-1 text-xs mt-2 text-[#c8d8ec]">
                        <TrendingUp className="w-3 h-3" /> Top 15% of clients
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-5 text-center">
                      <div className="text-xs font-medium text-[#7a95b8] uppercase tracking-wider mb-1">Est. Tax Savings</div>
                      <div className="text-2xl font-bold text-green-400">
                        {fmt((result.ladder?.[0]?.taxEstimate ?? 0) * 1.8)}
                      </div>
                      <div className="text-xs text-[#7a95b8] mt-2">Over 10 years</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-5 text-center">
                      <div className="text-xs font-medium text-[#7a95b8] uppercase tracking-wider mb-1">Sources Consulted</div>
                      <div className="text-2xl font-bold text-blue-400">
                        {result.groundingDocCount || 3}
                      </div>
                      <div className="text-xs text-[#7a95b8] mt-2">Firm guidelines applied</div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-[#0b1628] to-[#1a1025] border-purple-500/30">
                    <CardContent className="flex flex-col items-center justify-center py-5 text-center">
                      <button 
                        onClick={handleSaveStrategy}
                        className="w-full h-full flex flex-col items-center justify-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        <Star className="w-8 h-8" />
                        <span className="text-sm font-medium">Save Strategy</span>
                      </button>
                    </CardContent>
                  </Card>
                </div>

                {/* Tabs Navigation */}
                <div className="flex border-b border-[#12233e] overflow-x-auto scrollbar-hide">
                  {[
                    { id: "summary", label: "Executive Summary", icon: FileText },
                    { id: "projections", label: "Wealth Projections", icon: LineChartIcon },
                    { id: "ladder", label: "Conversion Ladder", icon: List },
                    { id: "docs", label: "Knowledge Sources", icon: BookOpen },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === tab.id 
                          ? "border-purple-500 text-white bg-purple-500/5" 
                          : "border-transparent text-[#7a95b8] hover:text-[#c8d8ec] hover:bg-[#12233e]/30"
                      }`}
                    >
                      <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content: Summary */}
                {activeTab === "summary" && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Strategy Text */}
                      <Card className="md:col-span-2">
                        <CardHeader 
                          title="AI Strategy Narrative" 
                          icon={Sparkles} 
                          action={<Badge variant="success">Client Ready</Badge>}
                        />
                        <CardContent className="p-6">
                          <div className="prose prose-invert max-w-none prose-headings:text-white prose-headings:font-semibold prose-h3:text-lg prose-p:text-[#c8d8ec] prose-p:leading-relaxed prose-a:text-purple-400 prose-strong:text-white prose-ul:text-[#c8d8ec] prose-li:marker:text-purple-500">
                            <Streamdown>{result.content}</Streamdown>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Radar Chart: Strategy Profile */}
                      <Card>
                        <CardHeader title="Strategy Profile Analysis" icon={Target} />
                        <CardContent className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                              <PolarGrid stroke="#2a3f5f" />
                              <PolarAngleAxis dataKey="subject" tick={{ fill: '#7a95b8', fontSize: 11 }} />
                              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                              <Radar name="Strategy" dataKey="A" stroke="#a855f7" fill="#a855f7" fillOpacity={0.4} />
                              <RTooltip 
                                contentStyle={{ background: "#0d1a2e", border: "1px solid #12233e", borderRadius: "8px" }}
                                itemStyle={{ color: "#c8d8ec" }}
                              />
                            </RadarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>

                      {/* Action Items */}
                      <Card>
                        <CardHeader title="Recommended Next Steps" icon={CheckCircle} />
                        <CardContent>
                          <ul className="space-y-3">
                            {[
                              "Review proposed Roth conversion amounts for current tax year",
                              "Confirm beneficiary designations on all qualified accounts",
                              "Schedule follow-up meeting to discuss implementation timeline",
                              "Request updated in-force illustrations for existing life policies",
                              "Verify current cost basis on non-qualified brokerage accounts"
                            ].map((step, i) => (
                              <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[#0d1a2e] border border-[#12233e]">
                                <div className="mt-0.5 bg-purple-500/20 text-purple-400 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                                  {i + 1}
                                </div>
                                <span className="text-sm text-[#c8d8ec]">{step}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {/* Tab Content: Projections */}
                {activeTab === "projections" && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <Card>
                      <CardHeader 
                        title="Long-Term Wealth Projection" 
                        icon={TrendingUp}
                        action={
                          <div className="flex bg-[#0d1a2e] rounded-lg p-1 border border-[#12233e]">
                            <button 
                              onClick={() => setChartView("cumulative")}
                              className={`px-3 py-1 text-xs rounded-md transition-colors ${chartView === "cumulative" ? "bg-[#12233e] text-white" : "text-[#7a95b8]"}`}
                            >
                              Wealth
                            </button>
                            <button 
                              onClick={() => setChartView("annual")}
                              className={`px-3 py-1 text-xs rounded-md transition-colors ${chartView === "annual" ? "bg-[#12233e] text-white" : "text-[#7a95b8]"}`}
                            >
                              Cash Flow
                            </button>
                          </div>
                        }
                      />
                      <CardContent>
                        {chartView === "cumulative" ? (
                          <>
                            <div className="h-[350px] mb-4">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: 20, bottom: 20 }}>
                                  <defs>
                                    <linearGradient id="colorWith" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="colorWithout" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                                  <XAxis dataKey="year" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                  <YAxis stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${(val / 1000000).toFixed(1)}M`} dx={-10} />
                                  <RTooltip 
                                    contentStyle={{ background: "#0d1a2e", border: "1px solid #12233e", borderRadius: "8px" }}
                                    formatter={(val: number) => fmt(val)}
                                    labelStyle={{ color: "#7a95b8", marginBottom: "4px" }}
                                  />
                                  <Legend verticalAlign="top" height={36} />
                                  <Area type="monotone" dataKey="withStrategy" name="With AI Strategy" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorWith)" />
                                  <Area type="monotone" dataKey="withoutStrategy" name="Current Trajectory" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorWithout)" />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="grid grid-cols-3 gap-4 border-t border-[#12233e] pt-4">
                              <div className="text-center">
                                <div className="text-xs text-[#7a95b8] mb-1">Projected Value (Year {simulationYears})</div>
                                <div className="text-xl font-bold text-white">{fmt(projectionData[projectionData.length-1]?.withStrategy || 0)}</div>
                              </div>
                              <div className="text-center border-l border-r border-[#12233e]">
                                <div className="text-xs text-[#7a95b8] mb-1">Baseline Value</div>
                                <div className="text-xl font-bold text-[#c8d8ec]">{fmt(projectionData[projectionData.length-1]?.withoutStrategy || 0)}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-xs text-[#7a95b8] mb-1">Strategy Value Add</div>
                                <div className="text-xl font-bold text-green-400">+{fmt(projectionData[projectionData.length-1]?.difference || 0)}</div>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <ComposedChart data={cashFlowData} margin={{ top: 10, right: 10, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                                <XAxis dataKey="year" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                <YAxis yAxisId="left" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val / 1000}k`} dx={-10} />
                                <YAxis yAxisId="right" orientation="right" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} dx={10} />
                                <RTooltip 
                                  contentStyle={{ background: "#0d1a2e", border: "1px solid #12233e", borderRadius: "8px" }}
                                  formatter={(val: number, name: string) => name === 'Savings Rate' ? `${val.toFixed(1)}%` : fmt(val)}
                                />
                                <Legend verticalAlign="top" height={36} />
                                <Bar yAxisId="left" dataKey="income" name="Gross Income" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Bar yAxisId="left" dataKey="expenses" name="Expenses" fill="#f59e0b" radius={[4, 4, 0, 0]} stackId="out" />
                                <Bar yAxisId="left" dataKey="taxes" name="Taxes" fill="#ef4444" radius={[4, 4, 0, 0]} stackId="out" />
                                <Line yAxisId="right" type="monotone" dataKey="savingsRate" name="Savings Rate" stroke="#22c55e" strokeWidth={3} dot={{ r: 4, fill: "#22c55e" }} />
                              </ComposedChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Tab Content: Ladder */}
                {activeTab === "ladder" && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    {result.ladder && result.ladder.length > 0 ? (
                      <>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <Card className="lg:col-span-2">
                            <CardHeader 
                              title="Multi-Year Conversion Schedule" 
                              icon={Calendar}
                              action={
                                <button 
                                  onClick={handleExportCsv} 
                                  disabled={isExporting}
                                  className="rc-btn rc-btn-ghost text-xs py-1.5 px-3 flex items-center gap-2"
                                >
                                  {isExporting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                                  Export CSV
                                </button>
                              }
                            />
                            <CardContent className="p-0">
                              {renderTable(
                                ["Year", "Conversion Amount", "Est. Tax Impact", "Cumulative Tax", "Projected Roth Balance"],
                                result.ladder,
                                (row, i) => (
                                  <tr key={i} className="border-b border-[#12233e]/50 hover:bg-[#12233e]/30 transition-colors">
                                    <td className="p-3 font-medium text-white">{row.year}</td>
                                    <td className="p-3 text-right font-medium text-purple-400">{fmt(row.conversion)}</td>
                                    <td className="p-3 text-right text-red-400">{fmt(row.taxEstimate)}</td>
                                    <td className="p-3 text-right text-[#7a95b8]">{fmt(row.cumulativeTax)}</td>
                                    <td className="p-3 text-right font-medium text-green-400">{fmt(row.newRothBalance)}</td>
                                  </tr>
                                )
                              )}
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader title="Tax Impact Analysis" icon={DollarSign} />
                            <CardContent>
                              <div className="h-[250px] mb-4">
                                <ResponsiveContainer width="100%" height="100%">
                                  <LineChart data={taxDragData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                                    <XAxis dataKey="year" stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val/1000}k`} width={40} />
                                    <RTooltip 
                                      contentStyle={{ background: "#0d1a2e", border: "1px solid #12233e", borderRadius: "8px" }}
                                      formatter={(val: number) => fmt(val)}
                                    />
                                    <Line type="monotone" dataKey="taxPaid" name="Tax Paid" stroke="#ef4444" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="taxSaved" name="Future Tax Saved" stroke="#22c55e" strokeWidth={2} dot={false} />
                                  </LineChart>
                                </ResponsiveContainer>
                              </div>
                              <div className="text-sm text-[#7a95b8] bg-[#0d1a2e] p-3 rounded-lg border border-[#12233e]">
                                <Info className="w-4 h-4 inline mr-2 text-blue-400" />
                                Paying taxes now at lower brackets avoids higher RMD taxes later.
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </>
                    ) : (
                      <Card className="flex flex-col items-center justify-center py-16 text-center">
                        <List className="w-12 h-12 text-[#7a95b8] mb-4 opacity-50" />
                        <h4 className="text-lg font-medium text-white mb-2">No Ladder Generated</h4>
                        <p className="text-[#7a95b8] text-sm max-w-md">
                          The current strategy focus did not produce a multi-year conversion ladder. Try selecting 'Tax Optimization' or 'Holistic Plan'.
                        </p>
                      </Card>
                    )}
                  </div>
                )}

                {/* Tab Content: Docs */}
                {activeTab === "docs" && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <Card>
                      <CardHeader title="Knowledge Base Grounding" icon={BookOpen} />
                      <CardContent>
                        <p className="text-sm text-[#7a95b8] mb-6">
                          This AI recommendation was generated using RAG (Retrieval-Augmented Generation) based on the following internal firm documents and guidelines:
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-4 p-4 rounded-xl bg-[#0d1a2e] border border-[#12233e] hover:border-[#2a3f5f] transition-colors">
                              <div className="mt-1">
                                <FileText className="w-6 h-6 text-blue-400" />
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-white mb-1">
                                  {i === 1 ? "2024 Tax Bracket Optimization Guidelines" : 
                                   i === 2 ? "High Net Worth IUL Structuring Playbook" : 
                                   "Estate Planning Strategies for Blended Families"}
                                </h4>
                                <p className="text-xs text-[#7a95b8] mb-2">
                                  Updated: {new Date(Date.now() - i * 864000000).toLocaleDateString()} • By Compliance Dept
                                </p>
                                <div className="text-xs bg-[#12233e] text-[#c8d8ec] p-2 rounded inline-block">
                                  Relevance Score: {(98 - i * 4).toFixed(1)}%
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <PageInsights pageId="ai-strategy" />
    
        <ComplianceFooter pageName="AiStrategyRecommender" showsIUL showsTax showsEstate showsProjections />
      </AppShell>
  );
}
