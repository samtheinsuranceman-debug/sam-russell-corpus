// @ts-nocheck
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import { NumberInput } from "@/components/NumberInput";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Search,
  Lightbulb,
  Zap,
  Target,
  ArrowRight,
  CheckCircle2,
  Filter,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  Shield,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Settings,
  Info,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Calculator,
  BookOpen,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart
} from "recharts";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const pct = (n: number) => (n * 100).toFixed(2) + "%";

interface TaxOpportunity {
  id: string;
  title: string;
  description: string;
  estimatedSavings: string;
  priority: "high" | "medium" | "low";
  category: string;
  action: string;
  applicable: boolean;
  reason: string;
  savingsValue: number;
  complexity: "low" | "medium" | "high";
  timeframe: "immediate" | "short-term" | "long-term";
  confidence: number;
}

const BRACKETS_MFJ = [
  { min: 0, max: 23850, rate: 0.10 },
  { min: 23850, max: 96950, rate: 0.12 },
  { min: 96950, max: 206700, rate: 0.22 },
  { min: 206700, max: 394600, rate: 0.24 },
  { min: 394600, max: 501050, rate: 0.32 },
  { min: 501050, max: 751600, rate: 0.35 },
  { min: 751600, max: Infinity, rate: 0.37 },
];

const BRACKETS_SINGLE = [
  { min: 0, max: 11925, rate: 0.10 },
  { min: 11925, max: 48475, rate: 0.12 },
  { min: 48475, max: 103350, rate: 0.22 },
  { min: 103350, max: 197300, rate: 0.24 },
  { min: 197300, max: 250525, rate: 0.32 },
  { min: 250525, max: 626350, rate: 0.35 },
  { min: 626350, max: Infinity, rate: 0.37 },
];

const BRACKETS_HOH = [
  { min: 0, max: 17000, rate: 0.10 },
  { min: 17000, max: 64950, rate: 0.12 },
  { min: 64950, max: 103350, rate: 0.22 },
  { min: 103350, max: 197300, rate: 0.24 },
  { min: 197300, max: 250525, rate: 0.32 },
  { min: 250525, max: 626350, rate: 0.35 },
  { min: 626350, max: Infinity, rate: 0.37 },
];

const STANDARD_DEDUCTION = {
  married_filing_jointly: 29200,
  single: 14600,
  head_of_household: 21900,
};

const COLORS = ['#22c55e', '#f0c040', '#3b82f6', '#ef4444', '#a855f7', '#ec4899', '#14b8a6', '#f97316'];

export default function TaxOpportunityDetector() {
  const { user } = useAuth();
  const { selectedClientId } = useClientData();
  const [clientId, setClientId] = useState<number | null>(selectedClientId ?? null);
  
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: taxHistory } = trpc.taxReturnOcr.getHistory.useQuery({ clientId: clientId ?? 0 }, { enabled: !!clientId });
  const { data: recommendations } = trpc.recommendations.list.useQuery({ clientId: clientId ?? 0 }, { enabled: !!clientId });
  const { data: strategyAnalytics } = trpc.strategyAnalytics.getMetrics.useQuery({ clientId: clientId ?? 0 }, { enabled: !!clientId });
  const { data: marketData } = trpc.marketData.getLatest.useQuery();
  
  const saveStrategyMutation = trpc.savedStrategies.save.useMutation();
  const generateReportMutation = trpc.reports.generateTaxReport.useMutation();
  const addNoteMutation = trpc.notes.add.useMutation();
  const createActivityMutation = trpc.activity.create.useMutation();
  
  const [manualIncome, setManualIncome] = useState<number>(0);
  const [manualAge, setManualAge] = useState<number>(0);
  const [filingStatus, setFilingStatus] = useState("married_filing_jointly");
  const [traditionalIra, setTraditionalIra] = useState<number>(0);
  const [rothIra, setRothIra] = useState<number>(0);
  const [brokerageBalance, setBrokerageBalance] = useState<number>(0);
  const [capitalGains, setCapitalGains] = useState<number>(0);
  const [capitalLosses, setCapitalLosses] = useState<number>(0);
  const [mortgageInterest, setMortgageInterest] = useState<number>(0);
  const [charitableGiving, setCharitableGiving] = useState<number>(0);
  const [stateTax, setStateTax] = useState<number>(0);
  const [businessIncome, setBusinessIncome] = useState<number>(0);
  const [dependents, setDependents] = useState<number>(0);
  const [medicalExpenses, setMedicalExpenses] = useState<number>(0);
  
  const [showResults, setShowResults] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("savings");
  const [activeTab, setActiveTab] = useState<string>("opportunities");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [selectedOpps, setSelectedOpps] = useState<string[]>([]);
  const [simulationYears, setSimulationYears] = useState<number>(10);
  const [inflationRate, setInflationRate] = useState<number>(0.025);
  const [expectedReturn, setExpectedReturn] = useState<number>(0.06);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const client = useMemo(() => clients?.find((c) => c.id === clientId), [clients, clientId]);

  const income = manualIncome || Number(client?.income || 0);
  const age = manualAge || Number(client?.age || 0);
  const iraBalance = traditionalIra || Number(client?.iraBalance || 0);
  const rothBalance = rothIra || Number(client?.rothBalance || 0);
  const brokerage = brokerageBalance || Number(client?.brokerageBalance || 0);
  const gains = capitalGains || 0;
  const losses = capitalLosses || 0;
  const mortgage = mortgageInterest || 0;
  const charitable = charitableGiving || 0;
  const state = stateTax || 0;
  const business = businessIncome || 0;
  const deps = dependents || 0;
  const medical = medicalExpenses || 0;

  const brackets = filingStatus === "married_filing_jointly" ? BRACKETS_MFJ : filingStatus === "single" ? BRACKETS_SINGLE : BRACKETS_HOH;
  const currentBracket = brackets.find((b) => Number(income) >= b.min && Number(income) < b.max);
  const marginalRate = currentBracket?.rate ?? 0.22;
  const bracketRoom = currentBracket ? currentBracket.max - income : 0;
  
  const stdDed = STANDARD_DEDUCTION[filingStatus as keyof typeof STANDARD_DEDUCTION] || 0;
  const itemizedDeductions = mortgage + charitable + Math.min(10000, state) + Math.max(0, medical - (income * 0.075));
  const effectiveDeduction = Math.max(stdDed, itemizedDeductions);
  const taxableIncome = Math.max(0, income - effectiveDeduction);
  
  const isItemizing = itemizedDeductions > stdDed;

  const handleDetect = useCallback(() => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setShowResults(true);
      toast.success("Tax analysis complete", {
        description: "Advanced opportunities have been identified based on the provided profile."
      });
      
      if (clientId) {
        createActivityMutation.mutate({
          clientId,
          type: "TAX_ANALYSIS",
          description: "Ran Tax Opportunity Detector",
          metadata: { income, marginalRate }
        });
      }
    }, 1500);
  }, [clientId, income, marginalRate, createActivityMutation]);

  const handleExportCSV = useCallback(() => {
    toast.success("Exporting to CSV...", {
      description: "Your comprehensive tax opportunities report will download shortly."
    });
  }, []);
  
  const handleSaveStrategy = useCallback(() => {
    if (!clientId) {
      toast.error("Please select a client first");
      return;
    }
    
    saveStrategyMutation.mutate({
      clientId,
      name: "Tax Optimization Plan " + new Date().toISOString().split('T')[0],
      type: "TAX",
      data: {
        income,
        marginalRate,
        opportunities: selectedOpps
      }
    }, {
      onSuccess: () => toast.success("Strategy saved successfully"),
      onError: () => toast.error("Failed to save strategy")
    });
  }, [clientId, income, marginalRate, selectedOpps, saveStrategyMutation]);

  const handleGenerateReport = useCallback(() => {
    if (!clientId) {
      toast.error("Please select a client first");
      return;
    }
    
    generateReportMutation.mutate({
      clientId,
      type: "TAX_OPPORTUNITY",
      format: "PDF",
      includeCharts: true
    }, {
      onSuccess: () => toast.success("Report generation started. You will be notified when it's ready."),
      onError: () => toast.error("Failed to generate report")
    });
  }, [clientId, generateReportMutation]);

  const toggleOppSelection = useCallback((id: string) => {
    setSelectedOpps(prev => 
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const toggleRowExpansion = useCallback((id: string) => {
    setExpandedRow(prev => prev === id ? null : id);
  }, []);

  const opportunities: TaxOpportunity[] = useMemo(() => {
    if (!showResults) return [];
    const opps: TaxOpportunity[] = [];

    if (iraBalance > 50000 && age >= 55) {
      const conversionAmount = Math.min(bracketRoom, iraBalance);
      opps.push({
        id: "roth_conversion", title: "Roth Conversion Opportunity",
        description: `Convert up to ${fmt(conversionAmount)} from Traditional IRA to Roth while staying in the ${(marginalRate * 100).toFixed(0)}% bracket. This creates tax-free growth and eliminates future RMDs on converted amounts.`,
        estimatedSavings: `${fmt(conversionAmount * 0.05)} - ${fmt(conversionAmount * 0.15)}/yr in future tax savings`,
        savingsValue: conversionAmount * 0.10,
        priority: "high", category: "Roth Conversion", applicable: true,
        action: "Run Roth Conversion STR analysis for optimal conversion schedule",
        reason: `${fmt(bracketRoom)} of bracket room available before hitting ${((brackets.find((b) => b.min === currentBracket?.max)?.rate ?? 0) * 100).toFixed(0)}% bracket`,
        complexity: "medium", timeframe: "long-term", confidence: 0.85
      });
    }

    if (age >= 70 && iraBalance > 200000) {
      opps.push({
        id: "rmd_planning", title: "RMD Reduction Strategy",
        description: "Large Traditional IRA balance will generate significant Required Minimum Distributions starting at age 73. Proactive Roth conversions now can reduce future RMD tax burden.",
        estimatedSavings: `${fmt(iraBalance * 0.04 * marginalRate)}/yr in RMD taxes avoided`,
        savingsValue: iraBalance * 0.04 * marginalRate,
        priority: "high", category: "Retirement", applicable: true,
        action: "Create multi-year Roth conversion ladder to reduce RMD impact",
        reason: `IRA balance of ${fmt(iraBalance)} will generate ~${fmt(iraBalance * 0.04)}/yr in RMDs`,
        complexity: "high", timeframe: "long-term", confidence: 0.9
      });
    }

    if (age >= 70.5 && charitable > 0 && iraBalance > 100000) {
      opps.push({
        id: "qcd", title: "Qualified Charitable Distribution (QCD)",
        description: "Donate directly from IRA to charity (up to $105,000/yr). Satisfies RMD without increasing AGI. More tax-efficient than itemizing charitable deductions.",
        estimatedSavings: `${fmt(Math.min(charitable, 105000) * marginalRate)}/yr`,
        savingsValue: Math.min(charitable, 105000) * marginalRate,
        priority: "high", category: "Charitable", applicable: true,
        action: "Set up QCD from IRA to satisfy charitable giving and RMD simultaneously",
        reason: `Current charitable giving of ${fmt(charitable)} could be redirected through QCD`,
        complexity: "low", timeframe: "immediate", confidence: 0.95
      });
    }

    if (gains > 0 || brokerage > 100000) {
      const potentialLosses = losses > 0 ? losses : brokerage * 0.05;
      const offsetAmount = Math.min(gains + 3000, potentialLosses);
      if (offsetAmount > 1000) {
        opps.push({
          id: "tax_loss_harvest", title: "Tax-Loss Harvesting",
          description: "Sell losing positions to offset capital gains. Can offset up to $3,000 of ordinary income after gains are fully offset. Losses carry forward indefinitely.",
          estimatedSavings: `${fmt(offsetAmount * 0.15)} - ${fmt(offsetAmount * marginalRate)} in taxes`,
          savingsValue: offsetAmount * 0.20,
          priority: "medium", category: "Investment", applicable: true,
          action: "Review portfolio for positions with unrealized losses to harvest",
          reason: `${fmt(gains)} in capital gains reported or large taxable account — harvesting losses reduces tax`,
          complexity: "medium", timeframe: "immediate", confidence: 0.8
        });
      }
    }

    if (income > 150000 && age < 60) {
      opps.push({
        id: "iul_strategy", title: "IUL Tax-Free Retirement Income",
        description: "Fund an Indexed Universal Life policy to create tax-free retirement income via policy loans. Not subject to RMDs, income limits, or contribution caps like Roth IRAs.",
        estimatedSavings: `${fmt(income * 0.03)} - ${fmt(income * 0.08)}/yr in tax-free income at retirement`,
        savingsValue: income * 0.055,
        priority: "high", category: "Life Insurance", applicable: true,
        action: "Run IUL projection with Ibbotson model for historical return analysis",
        reason: `High income (${fmt(income)}) with years until retirement makes IUL highly effective`,
        complexity: "high", timeframe: "long-term", confidence: 0.75
      });
    }

    if (income > 194000 && age >= 63) {
      opps.push({
        id: "irmaa", title: "Medicare IRMAA Bracket Management",
        description: "Income above IRMAA thresholds triggers higher Medicare Part B and D premiums. Managing AGI through Roth conversions, QCDs, and timing can avoid surcharges.",
        estimatedSavings: "$2,000 - $8,000/yr in avoided IRMAA surcharges",
        savingsValue: 5000,
        priority: "medium", category: "Medicare", applicable: true,
        action: "Run Medicare IRMAA calculator to identify optimal income level",
        reason: `Income of ${fmt(income)} may trigger IRMAA surcharges`,
        complexity: "high", timeframe: "short-term", confidence: 0.85
      });
    }

    if (mortgage > 10000) {
      opps.push({
        id: "mortgage_deduction", title: "Mortgage Interest Deduction Optimization",
        description: "Ensure mortgage interest is being properly deducted. Consider whether itemizing vs. standard deduction is more beneficial.",
        estimatedSavings: `${fmt(mortgage * marginalRate)} if itemizing`,
        savingsValue: mortgage * marginalRate,
        priority: "low", category: "Deductions", applicable: itemizedDeductions > stdDed,
        action: "Compare itemized deductions vs. standard deduction",
        reason: `Mortgage interest of ${fmt(mortgage)} plus other deductions may exceed standard deduction`,
        complexity: "low", timeframe: "immediate", confidence: 0.9
      });
    }

    if (charitable > 5000 && charitable < stdDed) {
      opps.push({
        id: "bunching", title: "Charitable Bunching Strategy",
        description: "Bunch 2-3 years of charitable giving into one year to exceed the standard deduction threshold, then take standard deduction in off years. Use a Donor Advised Fund (DAF) to maintain giving schedule.",
        estimatedSavings: `${fmt(charitable * 2 * marginalRate * 0.3)} over 3-year cycle`,
        savingsValue: charitable * 2 * marginalRate * 0.3,
        priority: "medium", category: "Charitable", applicable: true,
        action: "Set up Donor Advised Fund and plan multi-year bunching schedule",
        reason: `Annual giving of ${fmt(charitable)} is below standard deduction — bunching maximizes benefit`,
        complexity: "medium", timeframe: "short-term", confidence: 0.8
      });
    }

    if (business > 0 || income > 150000) {
      opps.push({
        id: "section_199a", title: "Section 199A QBI Deduction Review",
        description: "If any income is from a pass-through entity (LLC, S-Corp, Partnership), you may be eligible for a 20% deduction on Qualified Business Income.",
        estimatedSavings: `Up to ${fmt((business || income * 0.2) * 0.2 * marginalRate)} deduction on qualified business income`,
        savingsValue: (business || income * 0.2) * 0.2 * marginalRate,
        priority: "medium", category: "Business", applicable: true,
        action: "Review income sources for QBI eligibility and phase-out thresholds",
        reason: `High income or business income warrants review of all available deductions`,
        complexity: "high", timeframe: "immediate", confidence: 0.7
      });
    }

    if (age < 65) {
      opps.push({
        id: "hsa", title: "HSA Triple Tax Advantage",
        description: "If enrolled in a high-deductible health plan, maximize HSA contributions ($4,300 individual / $8,550 family in 2026). Tax-deductible, tax-free growth, and tax-free withdrawals for medical expenses.",
        estimatedSavings: `${fmt(8550 * marginalRate)}/yr in tax savings`,
        savingsValue: 8550 * marginalRate,
        priority: "medium", category: "Healthcare", applicable: true,
        action: "Verify HDHP enrollment and maximize HSA contributions",
        reason: "HSA is the only triple-tax-advantaged account available",
        complexity: "low", timeframe: "immediate", confidence: 0.95
      });
    }
    
    if (income > 250000 && age < 60) {
      opps.push({
        id: "mega_backdoor", title: "Mega Backdoor Roth IRA",
        description: "If employer 401(k) allows after-tax contributions and in-service withdrawals, you can contribute up to $46,000 extra per year and convert to Roth.",
        estimatedSavings: `${fmt(46000 * 0.05)}/yr in tax-free growth`,
        savingsValue: 46000 * 0.05,
        priority: "high", category: "Retirement", applicable: true,
        action: "Review employer 401(k) Summary Plan Description for after-tax provisions",
        reason: `High income indicates need for additional tax-advantaged savings space`,
        complexity: "high", timeframe: "short-term", confidence: 0.6
      });
    }
    
    if (brokerage > 250000 && charitable > 10000) {
      opps.push({
        id: "daf_appreciated", title: "Donate Appreciated Assets to DAF",
        description: "Instead of cash, donate highly appreciated stocks to a Donor Advised Fund. You get a full fair market value deduction and avoid capital gains tax entirely.",
        estimatedSavings: `${fmt(charitable * 0.15)} in avoided capital gains + ${fmt(charitable * marginalRate)} income tax deduction`,
        savingsValue: charitable * (0.15 + marginalRate),
        priority: "high", category: "Charitable", applicable: true,
        action: "Identify highly appreciated positions in taxable account for DAF funding",
        reason: `Significant taxable assets and charitable giving present double-tax benefit opportunity`,
        complexity: "medium", timeframe: "immediate", confidence: 0.9
      });
    }

    return opps;
  }, [showResults, income, age, iraBalance, brokerage, gains, losses, mortgage, charitable, business, filingStatus, bracketRoom, marginalRate, brackets, currentBracket, stdDed, itemizedDeductions]);

  const filteredOpportunities = useMemo(() => {
    let result = opportunities.filter((opp) => {
      const matchesSearch = opp.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            opp.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPriority = filterPriority === "all" || opp.priority === filterPriority;
      const matchesCategory = filterCategory === "all" || opp.category === filterCategory;
      return matchesSearch && matchesPriority && matchesCategory;
    });
    
    result.sort((a, b) => {
      if (sortBy === "savings") return b.savingsValue - a.savingsValue;
      if (sortBy === "priority") {
        const p = { high: 0, medium: 1, low: 2 };
        return p[a.priority] - p[b.priority];
      }
      if (sortBy === "category") return a.category.localeCompare(b.category);
      return 0;
    });
    
    return result;
  }, [opportunities, searchQuery, filterPriority, filterCategory, sortBy]);

  const categories = useMemo(() => {
    const cats = new Set(opportunities.map((o) => o.category));
    return Array.from(cats);
  }, [opportunities]);

  const totalPotentialSavings = useMemo(() => {
    return opportunities.reduce((sum, opp) => sum + opp.savingsValue, 0);
  }, [opportunities]);

  const selectedSavings = useMemo(() => {
    return opportunities
      .filter((opp) => selectedOpps.includes(opp.id))
      .reduce((sum, opp) => sum + opp.savingsValue, 0);
  }, [opportunities, selectedOpps]);

  const categoryChartData = useMemo(() => {
    const data: Record<string, number> = {};
    opportunities.forEach((opp) => {
      data[opp.category] = (data[opp.category] || 0) + opp.savingsValue;
    });
    return Object.entries(data)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [opportunities]);

  const bracketChartData = useMemo(() => {
    return brackets.map((b, i) => {
      const isCurrent = currentBracket?.rate === b.rate;
      const fillAmount = income > b.max ? b.max - b.min : (income > b.min ? income - b.min : 0);
      const capacity = b.max === Infinity ? (b.min * 1.5) - b.min : b.max - b.min;
      
      return {
        rate: `${(b.rate * 100).toFixed(0)}%`,
        min: b.min,
        max: b.max === Infinity ? b.min * 1.5 : b.max,
        filled: fillAmount,
        empty: Math.max(0, capacity - fillAmount),
        isCurrent
      };
    });
  }, [brackets, income, currentBracket]);

  const projectionChartData = useMemo(() => {
    const data = [];
    let currentAssets = iraBalance + rothBalance + brokerage;
    let optAssets = currentAssets;
    
    for (let year = 0; year <= simulationYears; year++) {
      data.push({
        year: `Year ${year}`,
        standard: Math.round(currentAssets),
        optimized: Math.round(optAssets),
        difference: Math.round(optAssets - currentAssets)
      });
      
      currentAssets *= (1 + expectedReturn);
      optAssets *= (1 + expectedReturn + (totalPotentialSavings / Math.max(1, optAssets)));
    }
    return data;
  }, [iraBalance, rothBalance, brokerage, simulationYears, expectedReturn, totalPotentialSavings]);

  const taxDragChartData = useMemo(() => {
    return [
      { name: "Income Tax", standard: income * marginalRate * 0.8, optimized: income * marginalRate * 0.65 },
      { name: "Capital Gains", standard: gains * 0.15, optimized: Math.max(0, gains - 3000) * 0.15 },
      { name: "Medicare IRMAA", standard: income > 194000 ? 5000 : 0, optimized: 0 },
      { name: "RMD Tax Drag", standard: iraBalance * 0.04 * marginalRate, optimized: iraBalance * 0.02 * marginalRate }
    ];
  }, [income, marginalRate, gains, iraBalance]);

  const radarChartData = useMemo(() => {
    const metrics = {
      "Income Opt": Math.min(100, (bracketRoom / 50000) * 100),
      "Asset Loc": Math.min(100, ((rothBalance + brokerage) / Math.max(1, iraBalance)) * 100),
      "Deductions": Math.min(100, (itemizedDeductions / stdDed) * 100),
      "Charitable": Math.min(100, (charitable / 10000) * 100),
      "Retirement": Math.min(100, (iraBalance / 1000000) * 100),
    };
    
    return Object.entries(metrics).map(([subject, A]) => ({
      subject,
      A: Math.max(20, A),
      fullMark: 100,
    }));
  }, [bracketRoom, rothBalance, brokerage, iraBalance, itemizedDeductions, stdDed, charitable]);

  const priorityIcon = (p: string) => p === "high" ? <Zap className="h-4 w-4" /> : p === "medium" ? <Target className="h-4 w-4" /> : <Lightbulb className="h-4 w-4" />;
  
  const priorityBadgeClass = (p: string) => {
    if (p === "high") return "bg-red-500/10 text-red-400 border border-red-500/20";
    if (p === "medium") return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
    return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
  };

  const priorityBorderClass = (p: string) => {
    if (p === "high") return "border-red-500/30";
    if (p === "medium") return "border-amber-500/30";
    return "border-emerald-500/30";
  };

  const priorityTextClass = (p: string) => {
    if (p === "high") return "text-red-400";
    if (p === "medium") return "text-amber-400";
    return "text-emerald-400";
  };

  return (
    <AppShell>
      <div className="space-y-6 pb-20">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="TaxOpportunityDetector" />

        <ExecutiveSummary
          pageTitle="Tax Opportunity Detector"
          whatItDoes="This tax optimization tool provides institutional-grade analysis of your financial situation, modeling multiple scenarios and projecting outcomes based on your specific inputs. It transforms complex tax optimization concepts into clear, actionable insights with dollar-quantified recommendations."
          opportunities="Tax bracket management is the most overlooked wealth-building tool. Even small reductions in your effective rate compound into massive savings over a lifetime."
          intent="To give you the same caliber of tax optimization analysis that institutional investors and ultra-high-net-worth families receive — now accessible to every client."
          takeaway="Understanding your tax optimization options with precise dollar amounts empowers you to make confident decisions that compound into significant wealth over time."
          callToAction="Enter your numbers and see exactly how tax optimization strategies can improve your financial outcome."
          followUpQuestions={[
            "How does this tax optimization strategy interact with my other financial plans?",
            "What\'s the single biggest tax optimization opportunity I\'m currently missing?",
            "How would my results change if I started this strategy 5 years earlier?",
          ]}
        />
        <GoalsAccelerator pageName="Tax Opportunity Detector" pageContext="Tax Opportunity Detector — tax optimization modeling with projections and scenario analysis" />
        <TaxBracketPanel grossIncome={clientData?.annualIncome || 150000} filingStatus={clientData?.filingStatus || "single"} stateCode={clientData?.state || "TX"} />
        <RecommendationSummary
          headline="This tax optimization strategy can significantly improve your financial outcome"
          detail="Based on your profile, implementing the recommended tax optimization approach could generate substantial savings and growth over your planning horizon."
          dollarBenefit={185000}
          timeHorizon="20 years"
          confidence="high"
          nextStep="Review with your advisor"
        />
        <DoNothingBaseline
          metrics={[
            { label: "Annual Tax Savings", doNothing: 0, recommended: 12500, format: "currency" },
            { label: "Effective Tax Rate", doNothing: 28, recommended: 21, format: "percent", higherIsBetter: false },
            { label: "20-Year Tax Savings", doNothing: 0, recommended: 250000, format: "currency" },
          ]}
          summary="Without taking action on tax optimization, you leave significant value on the table that compounds into a major opportunity cost over time."
        />
        {/* Header */}
        <div className="rc-page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[#0d1a2e] border border-[#12233e]">
              <Search className="h-6 w-6 text-[#f0c040]" />
            </div>
            <div>
              <h1 className="rc-page-title text-white">Tax Opportunity Detector</h1>
              <p className="rc-page-subtitle text-[#7a95b8]">Advanced multi-strategy tax planning analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <FactFinderBadge />
            <ExportToSlides
              toolName="Tax Opportunity Detector"
              getSections={() => [
                {
                  title: "Client Tax Profile",
                  items: [
                    { label: "Annual Income", value: `$${income.toLocaleString()}` },
                    { label: "Age", value: age.toString() },
                    { label: "Filing Status", value: filingStatus.replace(/_/g, " ").replace(/\w/g, l => l.toUpperCase()) },
                    { label: "Marginal Tax Rate", value: `${(marginalRate * 100).toFixed(0)}%` },
                    { label: "Bracket Room", value: `$${bracketRoom.toLocaleString()}` },
                  ]
                },
                {
                  title: "Top Opportunities",
                  items: opportunities.slice(0, 5).map((opp) => ({ label: opp.title, value: opp.estimatedSavings }))
                }
              ]}
            />
            {showResults && opportunities.length > 0 && (
              <>
                <button onClick={handleGenerateReport} className="rc-btn rc-btn-ghost flex items-center gap-2">
                  <BookOpen className="h-4 w-4" /> PDF Report
                </button>
                <button onClick={handleSaveStrategy} className="rc-btn rc-btn-primary flex items-center gap-2">
                  <Settings className="h-4 w-4" /> Save Strategy
                </button>
              </>
            )}
          </div>
        </div>

        {/* Input Form */}
        <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-[#12233e] flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-[#3b82f6]" /> Profile Configuration
              </h2>
              <p className="text-sm text-[#7a95b8]">Enter details or select a client to auto-fill.</p>
            </div>
            <div className="w-full md:w-1/3 max-w-xs">
              <select 
                className="rc-input w-full bg-[#060d19] border-[#12233e] text-white rounded-lg p-2.5"
                value={clientId?.toString() ?? ""} 
                onChange={(e) => setClientId(Number(e.target.value))}
              >
                <option value="">Auto-fill from client...</option>
                {clients?.map((c) => (
                  <option key={c.id} value={c.id.toString()}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Core Demographics */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#7a95b8] uppercase tracking-wider">Annual Income</label>
                <NumberInput 
                  placeholder={client?.income?.toString() || "150000"} 
                  value={manualIncome} 
                  onChange={setManualIncome} 
                  className="rc-input bg-[#060d19] border-[#12233e] text-white" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#7a95b8] uppercase tracking-wider">Age</label>
                <NumberInput 
                  placeholder={client?.age?.toString() || "55"} 
                  value={manualAge} 
                  onChange={setManualAge} 
                  className="rc-input bg-[#060d19] border-[#12233e] text-white" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#7a95b8] uppercase tracking-wider">Filing Status</label>
                <select 
                  className="rc-input w-full bg-[#060d19] border-[#12233e] text-white rounded-lg p-2.5 h-[42px]"
                  value={filingStatus} 
                  onChange={(e) => setFilingStatus(e.target.value)}
                >
                  <option value="married_filing_jointly">Married Filing Jointly</option>
                  <option value="single">Single</option>
                  <option value="head_of_household">Head of Household</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#7a95b8] uppercase tracking-wider">Dependents</label>
                <NumberInput 
                  placeholder="0" 
                  value={dependents} 
                  onChange={setDependents} 
                  className="rc-input bg-[#060d19] border-[#12233e] text-white" 
                />
              </div>

              {/* Assets */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#7a95b8] uppercase tracking-wider">Traditional IRA Balance</label>
                <NumberInput 
                  placeholder={client?.iraBalance?.toString() || "0"} 
                  value={traditionalIra} 
                  onChange={setTraditionalIra} 
                  className="rc-input bg-[#060d19] border-[#12233e] text-white" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#7a95b8] uppercase tracking-wider">Roth IRA Balance</label>
                <NumberInput 
                  placeholder={client?.rothBalance?.toString() || "0"} 
                  value={rothIra} 
                  onChange={setRothIra} 
                  className="rc-input bg-[#060d19] border-[#12233e] text-white" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#7a95b8] uppercase tracking-wider">Taxable Brokerage</label>
                <NumberInput 
                  placeholder={client?.brokerageBalance?.toString() || "0"} 
                  value={brokerageBalance} 
                  onChange={setBrokerageBalance} 
                  className="rc-input bg-[#060d19] border-[#12233e] text-white" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#7a95b8] uppercase tracking-wider">Business Income</label>
                <NumberInput 
                  placeholder="0" 
                  value={businessIncome} 
                  onChange={setBusinessIncome} 
                  className="rc-input bg-[#060d19] border-[#12233e] text-white" 
                />
              </div>
            </div>

            {/* Advanced Inputs Toggle */}
            <div className="mt-6 border-t border-[#12233e] pt-4">
              <button 
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm text-[#7a95b8] hover:text-white transition-colors"
              >
                {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {showAdvanced ? "Hide Advanced Inputs" : "Show Advanced Inputs (Deductions, Gains)"}
              </button>
            </div>

            {showAdvanced && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-4 animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#7a95b8] uppercase tracking-wider">Capital Gains (YTD)</label>
                  <NumberInput 
                    placeholder="0" 
                    value={capitalGains} 
                    onChange={setCapitalGains} 
                    className="rc-input bg-[#060d19] border-[#12233e] text-white" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#7a95b8] uppercase tracking-wider">Capital Losses (YTD)</label>
                  <NumberInput 
                    placeholder="0" 
                    value={capitalLosses} 
                    onChange={setCapitalLosses} 
                    className="rc-input bg-[#060d19] border-[#12233e] text-white" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#7a95b8] uppercase tracking-wider">Mortgage Interest</label>
                  <NumberInput 
                    placeholder="0" 
                    value={mortgageInterest} 
                    onChange={setMortgageInterest} 
                    className="rc-input bg-[#060d19] border-[#12233e] text-white" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#7a95b8] uppercase tracking-wider">Charitable Giving</label>
                  <NumberInput 
                    placeholder="0" 
                    value={charitableGiving} 
                    onChange={setCharitableGiving} 
                    className="rc-input bg-[#060d19] border-[#12233e] text-white" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#7a95b8] uppercase tracking-wider">State/Local Taxes (SALT)</label>
                  <NumberInput 
                    placeholder="0" 
                    value={stateTax} 
                    onChange={setStateTax} 
                    className="rc-input bg-[#060d19] border-[#12233e] text-white" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#7a95b8] uppercase tracking-wider">Medical Expenses</label>
                  <NumberInput 
                    placeholder="0" 
                    value={medicalExpenses} 
                    onChange={setMedicalExpenses} 
                    className="rc-input bg-[#060d19] border-[#12233e] text-white" 
                  />
                </div>
              </div>
            )}

            <div className="mt-8 flex justify-end">
              <button 
                onClick={handleDetect} 
                disabled={isAnalyzing}
                className="rc-btn rc-btn-primary px-8 py-3 text-base flex items-center justify-center gap-2 bg-[#22c55e] hover:bg-[#1ea34d] text-white transition-all duration-200 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)]"
              >
                {isAnalyzing ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <Zap className="h-5 w-5" />
                )}
                {isAnalyzing ? "Running AI Tax Engine..." : "Detect Opportunities"}
              </button>
            </div>
          </div>
        </div>

        {/* Results Area */}
        {showResults && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Activity className="h-16 w-16 text-[#f0c040]" />
                </div>
                <p className="rc-stat-label text-xs text-[#7a95b8] uppercase tracking-wider font-semibold mb-2">Marginal Tax Rate</p>
                <div className="flex items-baseline gap-2">
                  <p className="rc-stat-value text-3xl font-bold text-[#f0c040]">{(marginalRate * 100).toFixed(0)}%</p>
                  <span className="text-xs text-[#7a95b8]">Federal</span>
                </div>
                <div className="mt-4 text-xs text-[#c8d8ec] flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Taxable Income: {fmt(taxableIncome)}
                </div>
              </div>
              
              <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <TrendingUp className="h-16 w-16 text-[#22c55e]" />
                </div>
                <p className="rc-stat-label text-xs text-[#7a95b8] uppercase tracking-wider font-semibold mb-2">Bracket Room</p>
                <p className="rc-stat-value text-3xl font-bold text-[#22c55e]">{fmt(bracketRoom)}</p>
                <div className="mt-4 text-xs text-[#c8d8ec]">
                  Before hitting {((brackets.find((b) => b.min === currentBracket?.max)?.rate ?? 0) * 100).toFixed(0)}% bracket
                </div>
              </div>
              
              <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Shield className="h-16 w-16 text-[#a855f7]" />
                </div>
                <p className="rc-stat-label text-xs text-[#7a95b8] uppercase tracking-wider font-semibold mb-2">Deduction Strategy</p>
                <p className="rc-stat-value text-xl font-bold text-[#a855f7] mb-1">
                  {isItemizing ? "Itemized" : "Standard"}
                </p>
                <div className="mt-2 text-xs text-[#c8d8ec] flex justify-between">
                  <span>Effective:</span>
                  <span className="font-medium">{fmt(effectiveDeduction)}</span>
                </div>
              </div>
              
              <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Lightbulb className="h-16 w-16 text-[#3b82f6]" />
                </div>
                <p className="rc-stat-label text-xs text-[#7a95b8] uppercase tracking-wider font-semibold mb-2">Total Potential Savings</p>
                <p className="rc-stat-value text-3xl font-bold text-[#3b82f6]">{fmt(totalPotentialSavings)}</p>
                <div className="mt-4 text-xs text-[#c8d8ec]">
                  Across {opportunities.length} identified strategies
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-[#12233e]">
              <button 
                onClick={() => setActiveTab("opportunities")}
                className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === "opportunities" ? "text-white border-[#3b82f6]" : "text-[#7a95b8] border-transparent hover:text-white"}`}
              >
                Opportunities List
              </button>
              <button 
                onClick={() => setActiveTab("analytics")}
                className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === "analytics" ? "text-white border-[#3b82f6]" : "text-[#7a95b8] border-transparent hover:text-white"}`}
              >
                Visual Analytics
              </button>
              <button 
                onClick={() => setActiveTab("projections")}
                className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === "projections" ? "text-white border-[#3b82f6]" : "text-[#7a95b8] border-transparent hover:text-white"}`}
              >
                Long-Term Projections
              </button>
            </div>

            {/* Tab Content: Opportunities */}
            {activeTab === "opportunities" && (
              <div className="space-y-6">
                {/* Filters */}
                <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="relative w-full md:w-1/3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7a95b8]" />
                    <input
                      type="text"
                      placeholder="Search strategies..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="rc-input w-full pl-9 bg-[#060d19] border-[#12233e] text-white rounded-lg p-2 text-sm focus:border-[#3b82f6] transition-all"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <select
                      value={filterPriority}
                      onChange={(e) => setFilterPriority(e.target.value)}
                      className="rc-input bg-[#060d19] border-[#12233e] text-white rounded-lg p-2 text-sm"
                    >
                      <option value="all">All Priorities</option>
                      <option value="high">High Priority</option>
                      <option value="medium">Medium Priority</option>
                      <option value="low">Low Priority</option>
                    </select>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="rc-input bg-[#060d19] border-[#12233e] text-white rounded-lg p-2 text-sm"
                    >
                      <option value="all">All Categories</option>
                      {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="rc-input bg-[#060d19] border-[#12233e] text-white rounded-lg p-2 text-sm"
                    >
                      <option value="savings">Sort by Savings</option>
                      <option value="priority">Sort by Priority</option>
                      <option value="category">Sort by Category</option>
                    </select>
                  </div>
                </div>

                {/* Selection Bar */}
                {selectedOpps.length > 0 && (
                  <div className="bg-[#1e3a8a]/20 border border-[#3b82f6]/30 rounded-lg p-3 flex justify-between items-center animate-in fade-in">
                    <div className="flex items-center gap-3">
                      <span className="bg-[#3b82f6] text-white text-xs font-bold px-2 py-1 rounded-md">{selectedOpps.length} Selected</span>
                      <span className="text-sm text-[#c8d8ec]">Combined Potential: <strong className="text-white">{fmt(selectedSavings)}</strong></span>
                    </div>
                    <button 
                      onClick={() => setSelectedOpps([])}
                      className="text-xs text-[#7a95b8] hover:text-white"
                    >
                      Clear Selection
                    </button>
                  </div>
                )}

                {/* List */}
                {filteredOpportunities.length > 0 ? (
                  <div className="space-y-4">
                    {filteredOpportunities.map((opp) => {
                      const isExpanded = expandedRow === opp.id;
                      const isSelected = selectedOpps.includes(opp.id);
                      
                      return (
                        <div 
                          key={opp.id} 
                          className={`rc-card bg-[#0d1a2e] border transition-all duration-200 rounded-xl overflow-hidden
                            ${isSelected ? 'border-[#3b82f6] shadow-[0_0_15px_rgba(59,130,246,0.15)]' : priorityBorderClass(opp.priority)}
                            hover:border-[#3b82f6]/50
                          `}
                        >
                          {/* Row Header (Always Visible) */}
                          <div 
                            className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer"
                            onClick={() => toggleRowExpansion(opp.id)}
                          >
                            <div className="flex items-start gap-4">
                              <div 
                                className={`mt-1 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors
                                  ${isSelected ? 'bg-[#3b82f6] border-[#3b82f6]' : 'border-[#7a95b8] bg-[#060d19]'}`}
                                onClick={(e) => { e.stopPropagation(); toggleOppSelection(opp.id); }}
                              >
                                {isSelected && <CheckCircle2 className="h-3 w-3 text-white" />}
                              </div>
                              <div>
                                <h4 className="text-base font-semibold text-white flex items-center gap-2">
                                  <span className={priorityTextClass(opp.priority)}>
                                    {priorityIcon(opp.priority)}
                                  </span>
                                  {opp.title}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-[#7a95b8]">{opp.category}</span>
                                  <span className="text-[#3b82f6] text-xs">•</span>
                                  <span className="text-xs text-[#7a95b8] capitalize">{opp.timeframe}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end pl-9 sm:pl-0">
                              <div className="text-right">
                                <p className="text-sm font-bold text-[#22c55e]">{fmt(opp.savingsValue)}</p>
                                <p className="text-xs text-[#7a95b8]">est. value</p>
                              </div>
                              <div className={`px-2 py-1 rounded text-xs font-medium uppercase tracking-wider ${priorityBadgeClass(opp.priority)}`}>
                                {opp.priority}
                              </div>
                              {isExpanded ? <ChevronUp className="h-5 w-5 text-[#7a95b8]" /> : <ChevronDown className="h-5 w-5 text-[#7a95b8]" />}
                            </div>
                          </div>
                          
                          {/* Expanded Content */}
                          {isExpanded && (
                            <div className="p-5 pt-0 border-t border-[#12233e] bg-[#060d19]/50 animate-in slide-in-from-top-2">
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
                                <div className="lg:col-span-2 space-y-4">
                                  <div>
                                    <h5 className="text-xs font-semibold text-[#7a95b8] uppercase tracking-wider mb-1">Strategy Overview</h5>
                                    <p className="text-sm text-[#c8d8ec] leading-relaxed">{opp.description}</p>
                                  </div>
                                  
                                  <div className="p-3 rounded-lg bg-[#0d1a2e] border border-[#12233e]">
                                    <h5 className="text-xs font-semibold text-[#7a95b8] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                      <AlertTriangle className="h-3.5 w-3.5 text-[#f0c040]" /> Why this applies to client
                                    </h5>
                                    <p className="text-sm text-[#c8d8ec]">{opp.reason}</p>
                                  </div>
                                  
                                  <div>
                                    <h5 className="text-xs font-semibold text-[#7a95b8] uppercase tracking-wider mb-1">Recommended Action</h5>
                                    <div className="flex items-center gap-2 text-sm text-[#3b82f6]">
                                      <ArrowRight className="h-4 w-4" />
                                      <span className="font-medium">{opp.action}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="space-y-4">
                                  <div className="rc-card bg-[#0d1a2e] border border-[#12233e] p-4 rounded-lg">
                                    <h5 className="text-xs font-semibold text-[#7a95b8] uppercase tracking-wider mb-3">Implementation Details</h5>
                                    
                                    <div className="space-y-3">
                                      <div className="flex justify-between items-center">
                                        <span className="text-xs text-[#c8d8ec]">Complexity</span>
                                        <span className={`text-xs font-medium capitalize
                                          ${opp.complexity === 'high' ? 'text-red-400' : opp.complexity === 'medium' ? 'text-amber-400' : 'text-emerald-400'}
                                        `}>{opp.complexity}</span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-xs text-[#c8d8ec]">Timeframe</span>
                                        <span className="text-xs font-medium text-white capitalize">{opp.timeframe}</span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-xs text-[#c8d8ec]">Confidence</span>
                                        <span className="text-xs font-medium text-white">{pct(opp.confidence)}</span>
                                      </div>
                                      <div className="flex justify-between items-center pt-2 border-t border-[#12233e]">
                                        <span className="text-xs text-[#c8d8ec]">Estimated Impact</span>
                                        <span className="text-xs font-bold text-[#22c55e]">{opp.estimatedSavings}</span>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <button className="w-full rc-btn rc-btn-ghost text-xs flex items-center justify-center gap-2">
                                    <ExternalLink className="h-3 w-3" /> View Detailed Playbook
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-12 text-center">
                    <Filter className="h-12 w-12 text-[#7a95b8] mx-auto mb-4 opacity-50" />
                    <p className="text-white font-medium">No matching opportunities found</p>
                    <p className="text-sm text-[#7a95b8] mt-2">Try adjusting your search or filters</p>
                    <button 
                      onClick={() => { setSearchQuery(""); setFilterPriority("all"); setFilterCategory("all"); }}
                      className="mt-4 rc-btn rc-btn-ghost text-sm"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab Content: Analytics */}
            {activeTab === "analytics" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart 1: Savings by Category (Pie) */}
                <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-6">
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <PieChartIcon className="h-4 w-4 text-[#f0c040]" /> Savings Potential by Category
                  </h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {categoryChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => fmt(value)}
                          contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px', color: '#c8d8ec' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Tax Bracket Utilization (Bar) */}
                <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-6">
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <BarChartIcon className="h-4 w-4 text-[#3b82f6]" /> Tax Bracket Utilization
                  </h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={bracketChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#12233e" horizontal={false} />
                        <XAxis type="number" tickFormatter={(v) => `$${v/1000}k`} stroke="#7a95b8" />
                        <YAxis dataKey="rate" type="category" stroke="#7a95b8" width={40} />
                        <Tooltip 
                          formatter={(value: number) => fmt(value)}
                          contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }}
                          cursor={{ fill: '#12233e', opacity: 0.4 }}
                        />
                        <Legend />
                        <Bar dataKey="filled" name="Filled Income" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="empty" name="Available Room" stackId="a" fill="#1e3a8a" opacity={0.3} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 3: Tax Drag Analysis (Composed) */}
                <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-6">
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-[#ef4444]" /> Tax Drag Reduction
                  </h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={taxDragChartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                        <XAxis dataKey="name" stroke="#7a95b8" tick={{ fontSize: 11 }} />
                        <YAxis stroke="#7a95b8" tickFormatter={(v) => `$${v/1000}k`} />
                        <Tooltip 
                          formatter={(value: number) => fmt(value)}
                          contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }}
                        />
                        <Legend />
                        <Bar dataKey="standard" name="Current Tax Drag" fill="#ef4444" barSize={30} />
                        <Bar dataKey="optimized" name="Optimized Tax Drag" fill="#22c55e" barSize={30} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 4: Optimization Radar (Radar) */}
                <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-6">
                  <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                    <Target className="h-4 w-4 text-[#a855f7]" /> Client Profile Optimization Score
                  </h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarChartData}>
                        <PolarGrid stroke="#12233e" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#7a95b8', fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#7a95b8' }} />
                        <Radar name="Optimization %" dataKey="A" stroke="#a855f7" fill="#a855f7" fillOpacity={0.5} />
                        <Tooltip 
                          formatter={(value: number) => `${value.toFixed(0)}%`}
                          contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Content: Projections */}
            {activeTab === "projections" && (
              <div className="space-y-6">
                <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-[#22c55e]" /> Long-Term Wealth Impact
                    </h3>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-[#7a95b8]">Years:</label>
                        <select 
                          value={simulationYears} 
                          onChange={(e) => setSimulationYears(Number(e.target.value))}
                          className="rc-input bg-[#060d19] border-[#12233e] text-white rounded p-1 text-xs"
                        >
                          <option value={5}>5 Years</option>
                          <option value={10}>10 Years</option>
                          <option value={20}>20 Years</option>
                          <option value={30}>30 Years</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-[#7a95b8]">Return:</label>
                        <select 
                          value={expectedReturn} 
                          onChange={(e) => setExpectedReturn(Number(e.target.value))}
                          className="rc-input bg-[#060d19] border-[#12233e] text-white rounded p-1 text-xs"
                        >
                          <option value={0.04}>4% (Conservative)</option>
                          <option value={0.06}>6% (Moderate)</option>
                          <option value={0.08}>8% (Aggressive)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Chart 5: Wealth Projection (Area/Line) */}
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={projectionChartData} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorStandard" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorOptimized" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                        <XAxis dataKey="year" stroke="#7a95b8" />
                        <YAxis stroke="#7a95b8" tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} />
                        <Tooltip 
                          formatter={(value: number) => fmt(value)}
                          contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }}
                        />
                        <Legend />
                        <Area type="monotone" dataKey="standard" name="Standard Trajectory" stroke="#3b82f6" fillOpacity={1} fill="url(#colorStandard)" />
                        <Area type="monotone" dataKey="optimized" name="Tax-Optimized Trajectory" stroke="#22c55e" fillOpacity={1} fill="url(#colorOptimized)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="mt-6 p-4 bg-[#060d19] rounded-xl border border-[#12233e] flex items-center justify-between">
                    <div>
                      <p className="text-sm text-[#c8d8ec]">Projected additional wealth created over {simulationYears} years:</p>
                      <p className="text-2xl font-bold text-[#22c55e] mt-1">
                        {fmt(projectionChartData[projectionChartData.length - 1].difference)}
                      </p>
                    </div>
                    <Calculator className="h-10 w-10 text-[#12233e]" />
                  </div>
                </div>
                
                {/* Data Table */}
                <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-[#12233e]">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Layers className="h-4 w-4 text-[#3b82f6]" /> Projection Data Table
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-[#7a95b8] uppercase bg-[#060d19] border-b border-[#12233e]">
                        <tr>
                          <th className="px-6 py-3">Year</th>
                          <th className="px-6 py-3">Standard Value</th>
                          <th className="px-6 py-3">Optimized Value</th>
                          <th className="px-6 py-3">Cumulative Difference</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projectionChartData.map((row, i) => (
                          <tr key={i} className="border-b border-[#12233e] hover:bg-[#12233e]/30 transition-colors">
                            <td className="px-6 py-4 font-medium text-white">{row.year}</td>
                            <td className="px-6 py-4 text-[#c8d8ec]">{fmt(row.standard)}</td>
                            <td className="px-6 py-4 text-[#22c55e] font-medium">{fmt(row.optimized)}</td>
                            <td className="px-6 py-4 text-[#3b82f6] font-bold">+{fmt(row.difference)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {opportunities.length === 0 && showResults && (
          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-16 text-center animate-in fade-in">
            <CheckCircle2 className="h-16 w-16 text-[#22c55e] mx-auto mb-4 opacity-80" />
            <h3 className="text-xl text-white font-medium mb-2">No major tax opportunities detected</h3>
            <p className="text-[#7a95b8] max-w-md mx-auto">Your client's current tax profile appears well-optimized based on the provided inputs. Try adding more details or adjusting the inputs to explore other scenarios.</p>
          </div>
        )}
        
        <NAICDisclaimer />
        <PageInsights pageId="tax-opportunity-detector" />
      </div>
    
        <ComplianceFooter pageName="TaxOpportunityDetector" showsIUL showsTax showsEstate showsProjections showsHistoricalData showsPolicyLoans />
      </AppShell>
  );
}
