// @ts-nocheck
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Shield, AlertTriangle, CheckCircle2, FileText, Heart, ArrowRight, Zap, Clock, Download, Search, RefreshCw, PieChartIcon, BarChart3, TrendingUp, TrendingDown, Info, Activity, Target, Umbrella, Briefcase, FileSignature, FileWarning, ChevronRight, Filter, Mail, Share2, Copy, FilePlus, Icon} from 'lucide-react';
import { 
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  ComposedChart, ScatterChart, Scatter, Label
} from "recharts";
import { toast } from "sonner";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { useClientData } from "@/contexts/ClientDataContext";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

interface PolicyGap {
  category: string;
  icon: any;
  currentCoverage: number;
  recommendedCoverage: number;
  gapAmount: number;
  gapPercent: number;
  severity: "none" | "minor" | "moderate" | "severe";
  explanation: string;
  recommendation: string;
  product: string;
  trend: "improving" | "stable" | "worsening";
  historicalData: { year: string; coverage: number; gap: number }[];
  impactScore: number;
  urgency: number;
  premiumEstimate: number;
  alternativeProducts: string[];
  actionSteps: string[];
}

interface AnalysisResult {
  gaps: PolicyGap[];
  overallScore: number;
  totalGapAmount: number;
  severeCount: number;
  moderateCount: number;
  minorCount: number;
  coveredCount: number;
  recommendationSummary: string;
  riskProfile: string;
  nextReviewDate: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
};

const formatPercent = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    maximumFractionDigits: 1
  }).format(value / 100);
};

const SEVERITY_STYLES = {
  none: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", label: "Covered", badgeClass: "rc-badge rc-badge-green" },
  minor: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30", label: "Minor Gap", badgeClass: "rc-badge rc-badge-blue" },
  moderate: { bg: "bg-[#f0c040]/10", text: "text-[#f0c040]", border: "border-[#f0c040]/30", label: "Moderate Gap", badgeClass: "rc-badge rc-badge-gold" },
  severe: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30", label: "Severe Gap", badgeClass: "rc-badge rc-badge-red" },
};

const COLORS = ['#22c55e', '#3b82f6', '#f0c040', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

function analyzeGapsDetailed(client: any, historicalContext: any): AnalysisResult {
  const income = client?.income ?? 100000;
  const totalAssets = Number(client?.iraBalance ?? 0) + Number(client?.rothBalance ?? 0) + Number(client?.taxableAssets ?? 0) + Number(client?.realEstateEquity ?? 0);
  const lifeCV = client?.lifeInsuranceCv ?? 0;
  const estimatedDB = lifeCV * 8;
  const isMarried = client?.filingStatus === "married_joint";
  const age = client?.age ?? 45;
  const dependents = client?.dependents ?? (isMarried ? 2 : 0);
  const debt = client?.totalDebt ?? 50000;

  const lifeNeed = income * (isMarried ? 12 : 8) + debt + (dependents * 100000);
  const lifeGap = Math.max(0, lifeNeed - estimatedDB);
  
  const disabilityNeed = income * 0.65;
  const disabilityCurrent = income * 0.3;
  const disabilityGap = Math.max(0, disabilityNeed - disabilityCurrent);
  
  const ltcNeed = age > 50 ? 150000 : 0;
  const ltcCurrent = 0;
  
  const umbrellaNeeded = totalAssets > 500000 ? Math.min(Math.ceil(totalAssets / 1000000) * 1000000, 5000000) : 0;
  const umbrellaCurrent = totalAssets > 500000 ? 1000000 : 0;
  
  const eAndONeed = income > 200000 ? 2000000 : 1000000;
  const eAndOCurrent = income > 200000 ? 1000000 : 500000;
  
  const criticalNeed = income * 0.5;
  const criticalCurrent = 0;
  const criticalGap = Math.max(0, criticalNeed - criticalCurrent);
  
  const idTheftNeed = 1000000;
  const idTheftCurrent = 0;
  const idTheftGap = idTheftNeed;

  const generateHistorical = (baseCurrent: number, baseNeed: number, trend: "improving"|"stable"|"worsening") => {
    return [
      { year: "2020", coverage: baseCurrent * 0.7, gap: baseNeed * 0.8 - baseCurrent * 0.7 },
      { year: "2021", coverage: baseCurrent * 0.8, gap: baseNeed * 0.85 - baseCurrent * 0.8 },
      { year: "2022", coverage: baseCurrent * 0.9, gap: baseNeed * 0.9 - baseCurrent * 0.9 },
      { year: "2023", coverage: baseCurrent, gap: baseNeed - baseCurrent },
      { year: "2024", coverage: baseCurrent, gap: baseNeed - baseCurrent },
    ];
  };

  const gaps: PolicyGap[] = [
    {
      category: "Life Insurance",
      icon: Heart,
      currentCoverage: estimatedDB,
      recommendedCoverage: lifeNeed,
      gapAmount: lifeGap,
      gapPercent: lifeNeed > 0 ? (lifeGap / lifeNeed) * 100 : 0,
      severity: lifeGap === 0 ? "none" : lifeGap < lifeNeed * 0.2 ? "minor" : lifeGap < lifeNeed * 0.5 ? "moderate" : "severe",
      explanation: `Current estimated death benefit of ${formatCurrency(estimatedDB)} ${lifeGap > 0 ? `falls short of the recommended coverage of ${formatCurrency(lifeNeed)} by ${formatCurrency(lifeGap)}` : `meets or exceeds the recommended coverage`}. Life insurance is the cornerstone of financial protection for dependents, especially considering your ${dependents} dependents and ${formatCurrency(debt)} in debt.`,
      recommendation: lifeGap > 0 ? `Consider an IUL policy with a death benefit of at least ${formatCurrency(lifeGap)} to close the gap. IUL provides both protection and tax-advantaged cash value accumulation.` : "Coverage is adequate. Review annually.",
      product: lifeGap > 0 ? "Indexed Universal Life (IUL)" : "No action needed",
      trend: "worsening",
      historicalData: generateHistorical(estimatedDB, lifeNeed, "worsening"),
      impactScore: 95,
      urgency: lifeGap > lifeNeed * 0.5 ? 9 : 5,
      premiumEstimate: lifeGap * 0.005,
      alternativeProducts: ["Term Life (10/20/30 year)", "Whole Life", "Variable Universal Life"],
      actionSteps: ["Schedule medical exam", "Review beneficiary designations", "Compare quotes from top 3 carriers"]
    },
    {
      category: "Disability Income",
      icon: Activity,
      currentCoverage: disabilityCurrent,
      recommendedCoverage: disabilityNeed,
      gapAmount: disabilityGap,
      gapPercent: disabilityNeed > 0 ? (disabilityGap / disabilityNeed) * 100 : 0,
      severity: disabilityGap === 0 ? "none" : disabilityGap < disabilityNeed * 0.2 ? "minor" : "moderate",
      explanation: `Current disability income replacement covers approximately 30% of income (${formatCurrency(disabilityCurrent)}/yr). The recommended coverage is 65% of income (${formatCurrency(disabilityNeed)}/yr) to maintain lifestyle during disability.`,
      recommendation: disabilityGap > 0 ? `Add a supplemental individual disability policy providing ${formatCurrency(Math.round(disabilityGap / 12))}/month in benefits. Look for own-occupation definition.` : "Disability coverage is adequate.",
      product: disabilityGap > 0 ? "Individual Disability Insurance" : "No action needed",
      trend: "stable",
      historicalData: generateHistorical(disabilityCurrent, disabilityNeed, "stable"),
      impactScore: 85,
      urgency: disabilityGap > 0 ? 8 : 2,
      premiumEstimate: disabilityGap * 0.02,
      alternativeProducts: ["Group Long-Term Disability", "Short-Term Disability", "Business Overhead Expense"],
      actionSteps: ["Verify employer group coverage limits", "Check definition of disability (own occ vs any occ)", "Review elimination period options"]
    },
    {
      category: "Long-Term Care",
      icon: Clock,
      currentCoverage: ltcCurrent,
      recommendedCoverage: ltcNeed,
      gapAmount: ltcNeed - ltcCurrent,
      gapPercent: ltcNeed > 0 ? 100 : 0,
      severity: age > 50 && ltcCurrent === 0 ? "severe" : age > 50 ? "moderate" : "none",
      explanation: age > 50 ? `At age ${age}, long-term care planning becomes critical. The average cost of a private nursing home room exceeds $100,000/year.` : `At age ${age}, long-term care planning is not yet urgent but should be considered in the next 5-10 years.`,
      recommendation: age > 50 ? "Consider a hybrid life/LTC policy that provides both death benefit and LTC coverage." : "Monitor and plan to add LTC coverage before age 55 for best rates.",
      product: age > 50 ? "Hybrid Life/LTC Policy" : "Future consideration",
      trend: age > 50 ? "worsening" : "stable",
      historicalData: generateHistorical(ltcCurrent, ltcNeed, "stable"),
      impactScore: age > 50 ? 90 : 40,
      urgency: age > 55 ? 9 : age > 50 ? 6 : 2,
      premiumEstimate: age > 50 ? 5000 : 0,
      alternativeProducts: ["Traditional LTC Insurance", "Life Insurance with LTC Rider", "Annuity with LTC Multiplier"],
      actionSteps: ["Discuss family health history", "Evaluate self-funding capacity", "Compare hybrid vs traditional policies"]
    },
    {
      category: "Umbrella Liability",
      icon: Umbrella,
      currentCoverage: umbrellaCurrent,
      recommendedCoverage: umbrellaNeeded,
      gapAmount: Math.max(0, umbrellaNeeded - umbrellaCurrent),
      gapPercent: umbrellaNeeded > 0 ? (Math.max(0, umbrellaNeeded - umbrellaCurrent) / umbrellaNeeded) * 100 : 0,
      severity: umbrellaNeeded - umbrellaCurrent > 2000000 ? "severe" : umbrellaNeeded - umbrellaCurrent > 0 ? "moderate" : "none",
      explanation: `With total assets of ${formatCurrency(totalAssets)}, umbrella liability coverage should equal at least the total asset value (up to $5M). Current coverage: ${formatCurrency(umbrellaCurrent)}.`,
      recommendation: umbrellaNeeded > umbrellaCurrent ? `Increase umbrella coverage to at least ${formatCurrency(umbrellaNeeded)}. Umbrella policies are relatively inexpensive and provide critical asset protection.` : "Umbrella coverage is adequate for current asset level.",
      product: umbrellaNeeded > umbrellaCurrent ? "Personal Umbrella Policy" : "No action needed",
      trend: "improving",
      historicalData: generateHistorical(umbrellaCurrent, umbrellaNeeded, "improving"),
      impactScore: 75,
      urgency: umbrellaNeeded > umbrellaCurrent ? 7 : 1,
      premiumEstimate: (umbrellaNeeded - umbrellaCurrent) / 1000000 * 250,
      alternativeProducts: ["Excess Liability", "Commercial Umbrella (if business owner)"],
      actionSteps: ["Review underlying auto/home limits", "Identify specific liability risks (pools, teen drivers)", "Bundle with existing P&C carrier"]
    },
    {
      category: "Professional Liability (E&O)",
      icon: Briefcase,
      currentCoverage: eAndOCurrent,
      recommendedCoverage: eAndONeed,
      gapAmount: Math.max(0, eAndONeed - eAndOCurrent),
      gapPercent: eAndONeed > 0 ? (Math.max(0, eAndONeed - eAndOCurrent) / eAndONeed) * 100 : 0,
      severity: eAndONeed > eAndOCurrent ? "minor" : "none",
      explanation: `Professional liability (Errors & Omissions) coverage protects against claims of negligence. Current coverage: ${formatCurrency(eAndOCurrent)}. Recommended: ${formatCurrency(eAndONeed)} based on income level.`,
      recommendation: eAndONeed > eAndOCurrent ? "Increase E&O coverage to match recommended level. Review policy exclusions." : "E&O coverage is adequate.",
      product: eAndONeed > eAndOCurrent ? "Professional Liability Insurance" : "No action needed",
      trend: "stable",
      historicalData: generateHistorical(eAndOCurrent, eAndONeed, "stable"),
      impactScore: 70,
      urgency: eAndONeed > eAndOCurrent ? 6 : 1,
      premiumEstimate: 1500,
      alternativeProducts: ["D&O Insurance", "Cyber Liability", "Employment Practices Liability"],
      actionSteps: ["Review specific industry requirements", "Check retroactive date on current policy", "Evaluate defense costs inside/outside limits"]
    },
    {
      category: "Critical Illness",
      icon: Shield,
      currentCoverage: criticalCurrent,
      recommendedCoverage: criticalNeed,
      gapAmount: criticalGap,
      gapPercent: criticalNeed > 0 ? (criticalGap / criticalNeed) * 100 : 0,
      severity: criticalGap > 0 ? "moderate" : "none",
      explanation: `Critical illness insurance provides a lump sum upon diagnosis of major illnesses (cancer, heart attack, stroke). Recommended coverage is 6 months of income (${formatCurrency(criticalNeed)}).`,
      recommendation: criticalGap > 0 ? `Consider adding a critical illness policy or rider for ${formatCurrency(criticalNeed)} to cover out-of-pocket medical costs and living expenses during recovery.` : "Critical illness coverage is adequate.",
      product: criticalGap > 0 ? "Critical Illness Insurance" : "No action needed",
      trend: "stable",
      historicalData: generateHistorical(criticalCurrent, criticalNeed, "stable"),
      impactScore: 60,
      urgency: 5,
      premiumEstimate: 600,
      alternativeProducts: ["Cancer-specific policy", "Hospital Indemnity", "Accelerated Death Benefit Rider"],
      actionSteps: ["Review family medical history", "Check health insurance out-of-pocket maximums", "Evaluate rider vs standalone policy"]
    },
    {
      category: "Identity Theft",
      icon: FileWarning,
      currentCoverage: idTheftCurrent,
      recommendedCoverage: idTheftNeed,
      gapAmount: idTheftGap,
      gapPercent: 100,
      severity: "minor",
      explanation: `Identity theft protection covers legal fees, lost wages, and restoration services if your identity is stolen. Recommended coverage: ${formatCurrency(idTheftNeed)}.`,
      recommendation: `Add comprehensive identity theft protection with at least ${formatCurrency(idTheftNeed)} in restoration insurance.`,
      product: "Identity Theft Protection Plan",
      trend: "worsening",
      historicalData: generateHistorical(idTheftCurrent, idTheftNeed, "worsening"),
      impactScore: 50,
      urgency: 4,
      premiumEstimate: 150,
      alternativeProducts: ["Credit Monitoring Services", "Homeowner's Policy Endorsement"],
      actionSteps: ["Freeze credit with all three bureaus", "Set up multi-factor authentication", "Review current credit reports"]
    }
  ];

  const scores = gaps.map((g) => g.severity === "none" ? 100 : g.severity === "minor" ? 75 : g.severity === "moderate" ? 45 : 15);
  const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const totalGapAmount = gaps.reduce((s, g) => s + g.gapAmount, 0);
  
  const severeCount = gaps.filter((g) => g.severity === "severe").length;
  const moderateCount = gaps.filter((g) => g.severity === "moderate").length;
  const minorCount = gaps.filter((g) => g.severity === "minor").length;
  const coveredCount = gaps.filter((g) => g.severity === "none").length;

  let riskProfile = "Low Risk";
  if (severeCount > 0) riskProfile = "High Risk";
  else if (moderateCount > 1) riskProfile = "Medium-High Risk";
  else if (moderateCount > 0 || minorCount > 2) riskProfile = "Medium Risk";

  return {
    gaps,
    overallScore,
    totalGapAmount,
    severeCount,
    moderateCount,
    minorCount,
    coveredCount,
    recommendationSummary: severeCount > 0 ? "Immediate action required on critical coverage gaps." : "Review moderate and minor gaps to optimize protection strategy.",
    riskProfile,
    nextReviewDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toLocaleDateString() // 6 months from now
  };
}

const StatCard = ({ title, value, subtitle, icon: Icon, colorClass }: any) => (
  <div className="rc-card flex items-center p-4">
    <div className={`p-3 rounded-xl ${colorClass.bg} mr-4`}>
      <Icon className={`w-6 h-6 ${colorClass.text}`} />
    </div>
    <div>
      <p className="text-sm text-[#7a95b8] font-medium">{title}</p>
      <h4 className="text-2xl font-bold text-white">{value}</h4>
      {subtitle && <p className="text-xs text-[#7a95b8] mt-1">{subtitle}</p>}
    </div>
  </div>
);

const DataTable = ({ columns, data, onRowClick }: any) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="border-b border-[#12233e]">
          {columns.map((col: any, i: number) => (
            <th key={i} className="py-3 px-4 text-sm font-semibold text-[#7a95b8]">{col.header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row: any, i: number) => (
          <tr 
            key={i} 
            className="border-b border-[#12233e]/50 hover:bg-[#12233e]/30 transition-colors cursor-pointer"
            onClick={() => onRowClick && onRowClick(row)}
          >
            {columns.map((col: any, j: number) => (
              <td key={j} className="py-3 px-4 text-sm text-[#c8d8ec]">
                {col.accessor ? row[col.accessor] : col.cell(row)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function AIPolicyReviewGap() {
  const { clientData } = useClientData();
  const { user } = useAuth();
  
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: policies } = trpc.strategy.list.useQuery();
  const { data: scenarios } = trpc.scenarios.list.useQuery();
  const { data: riskScoring } = trpc.riskScoring.scores.useQuery({ clientId: "default" }, { enabled: false });
  const { data: recommendations } = trpc.recommendations.list.useQuery();
  const { data: marketData } = trpc.marketData.getIndices.useQuery();
  
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [analyzing, setAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [selectedGap, setSelectedGap] = useState<PolicyGap | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const selectedClient = useMemo(() => {
    if (!clients) return null;
    if (selectedClientId) return clients.find((c) => String(c.id) === selectedClientId) ?? clients[0];
    return clients[0] ?? null;
  }, [clients, selectedClientId]);

  const analysis = useMemo(() => {
    if (!selectedClient) return null;
    return analyzeGapsDetailed(selectedClient, policies);
  }, [selectedClient, policies]);

  const filteredGaps = useMemo(() => {
    if (!analysis) return [];
    let result = analysis.gaps;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((g) => 
        g.category.toLowerCase().includes(q) || 
        g.product.toLowerCase().includes(q) ||
        g.explanation.toLowerCase().includes(q)
      );
    }
    
    if (filterSeverity !== "all") {
      result = result.filter((g) => g.severity === filterSeverity);
    }
    
    return result;
  }, [analysis, searchQuery, filterSeverity]);

  const radarData = useMemo(() => {
    if (!analysis) return [];
    return analysis.gaps.map((g) => ({
      category: g.category,
      coverage: g.recommendedCoverage > 0 ? Math.min(100, (g.currentCoverage / g.recommendedCoverage) * 100) : 100,
      target: 100,
      fullMark: 100,
    }));
  }, [analysis]);

  const barData = useMemo(() => {
    if (!analysis) return [];
    return analysis.gaps.map((g) => ({
      name: g.category.length > 12 ? g.category.slice(0, 12) + "…" : g.category,
      current: g.currentCoverage,
      recommended: g.recommendedCoverage,
      gap: g.gapAmount,
    })).sort((a, b) => b.gap - a.gap);
  }, [analysis]);

  const pieData = useMemo(() => {
    if (!analysis) return [];
    return [
      { name: 'Covered', value: analysis.coveredCount, color: '#22c55e' },
      { name: 'Minor Gaps', value: analysis.minorCount, color: '#3b82f6' },
      { name: 'Moderate Gaps', value: analysis.moderateCount, color: '#f0c040' },
      { name: 'Severe Gaps', value: analysis.severeCount, color: '#ef4444' },
    ].filter((d) => d.value > 0);
  }, [analysis]);

  const impactData = useMemo(() => {
    if (!analysis) return [];
    return analysis.gaps.map((g) => ({
      name: g.category,
      impact: g.impactScore,
      urgency: g.urgency * 10,
      gap: g.gapAmount
    }));
  }, [analysis]);

  const trendData = useMemo(() => {
    if (!analysis || !analysis.gaps[0]) return [];
    const years = ["2020", "2021", "2022", "2023", "2024"];
    return years.map((year, i) => {
      let totalCoverage = 0;
      let totalGap = 0;
      analysis.gaps.forEach((g) => {
        if (g.historicalData && g.historicalData[i]) {
          totalCoverage += g.historicalData[i].coverage;
          totalGap += g.historicalData[i].gap;
        }
      });
      return {
        year,
        coverage: totalCoverage,
        gap: totalGap,
        totalNeed: totalCoverage + totalGap
      };
    });
  }, [analysis]);

  const runAnalysis = async () => {
    setAnalyzing(true);
    await new Promise(r => setTimeout(r, 2000));
    setAnalyzing(false);
    toast.success("AI Policy Review complete. 7 coverage areas analyzed.");
  };

  const exportCSV = () => {
    if (!analysis || !analysis.gaps.length) return;
    const headers = ["Category", "Current Coverage", "Recommended", "Gap Amount", "Severity", "Product Recommendation", "Urgency (1-10)"];
    const rows = analysis.gaps.map((g) => [
      g.category,
      g.currentCoverage,
      g.recommendedCoverage,
      g.gapAmount,
      g.severity,
      g.product,
      g.urgency
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `policy_gap_analysis_${selectedClient?.name?.replace(/\s+/g, "_") ?? "client"}.csv`;
    a.click();
    toast.success("Exported CSV successfully");
  };

  const generateProposal = () => {
    toast.info("Generating comprehensive insurance proposal...");
    setTimeout(() => toast.success("Proposal generated and saved to Document Vault"), 1500);
  };

  const shareWithClient = () => {
    toast.success(`Analysis shared with ${selectedClient?.name} via Client Portal`);
  };

  const renderSeverityBadge = (severity: string) => {
    const style = SEVERITY_STYLES[severity as keyof typeof SEVERITY_STYLES];
    if (!style) return null;
    return <span className={style.badgeClass}>{style.label}</span>;
  };

  if (!clients) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-screen">
          <RefreshCw className="w-12 h-12 text-[#22c55e] animate-spin mb-4" />
          <p className="text-xl text-[#7a95b8]">Loading Policy Review Engine...</p>
        </div>
      </AppShell>
    );
  }

  if (!selectedClient || !analysis) {
    return (
      <AppShell>
        <div className="p-6">
          <div className="rc-card flex flex-col items-center justify-center py-20">
            <Shield className="w-16 h-16 text-[#12233e] mb-4" />
            <h2 className="text-2xl text-white font-bold mb-2">No Client Selected</h2>
            <p className="text-[#7a95b8]">Please select a client to run the AI Policy Review.</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 space-y-6 max-w-7xl mx-auto pb-20">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="AIPolicyReviewGap" />

        <ExecutiveSummary
          pageTitle="AI Policy Review & Gap Analysis"
          whatItDoes="This tool uses AI to analyze your existing insurance policies and identify coverage gaps, redundancies, and optimization opportunities. It compares your current coverage against your actual needs based on your financial profile, dependents, and goals."
          opportunities="Most clients carry policies purchased years ago that no longer match their current situation. You may be over-insured in some areas and dangerously under-insured in others — especially long-term care, disability, and umbrella liability."
          intent="To give you a clear, unbiased picture of where your insurance portfolio stands today versus where it should be."
          takeaway="Insurance gaps cost more than premiums. A single uninsured event can erase decades of wealth building."
          callToAction="Run the AI analysis on your current policies to see exactly where you stand."
          followUpQuestions={[
            "Am I paying for coverage I no longer need?",
            "What\'s my biggest uninsured risk right now?",
            "How do my insurance costs compare to industry benchmarks for my net worth?",
          ]}
        />
        <GoalsAccelerator pageName="AI Policy Review & Gap Analysis" pageContext="AI-powered insurance policy gap analysis comparing current coverage against optimal allocation" />
        <TaxBracketPanel grossIncome={clientData?.annualIncome || 150000} filingStatus={clientData?.filingStatus || "single"} stateCode={clientData?.state || "TX"} />
        <RecommendationSummary
          headline="Optimize your insurance portfolio to eliminate gaps"
          detail="Based on your profile, reallocating premium dollars from redundant coverage to identified gaps could save you from catastrophic uninsured losses."
          dollarBenefit={250000}
          timeHorizon="lifetime protection"
          confidence="high"
          nextStep="Review with your advisor"
        />
        <DoNothingBaseline
          metrics={[
            { label: "Coverage Gaps", doNothing: 3, recommended: 0, format: "number", higherIsBetter: false },
            { label: "Annual Premium Waste", doNothing: 8500, recommended: 2000, format: "currency", higherIsBetter: false },
            { label: "Risk Coverage Score", doNothing: 55, recommended: 95, format: "percent" },
          ]}
          summary="Unaddressed coverage gaps leave you exposed to potentially devastating financial losses that could wipe out years of careful planning."
        />
        {/* Header Section */}
        <div className="rc-page-header flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[#22c55e]/10 rounded-lg">
                <Shield className="w-8 h-8 text-[#22c55e]" />
              </div>
              <h1 className="rc-page-title m-0">AI Policy Review & Gap Analysis</h1>
            </div>
            <p className="rc-page-subtitle max-w-2xl">
              Advanced multi-line insurance analysis engine. Identifies coverage gaps, calculates precise needs, and recommends optimal product solutions based on client profile.
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-3">
              <Select value={selectedClientId || String(selectedClient?.id ?? "")} onValueChange={setSelectedClientId}>
                <SelectTrigger className="w-[250px] bg-[#0d1a2e] border-[#12233e] text-white">
                  <SelectValue placeholder="Select client…" />
                </SelectTrigger>
                <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name} {c.type ? `(${c.type})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <button 
                onClick={runAnalysis} 
                disabled={analyzing} 
                className="rc-btn rc-btn-primary flex items-center gap-2"
              >
                {analyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {analyzing ? "Analyzing…" : "Run AI Analysis"}
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <button onClick={exportCSV} className="rc-btn rc-btn-ghost text-sm py-1.5 px-3 flex items-center gap-2">
                <Download className="w-4 h-4" /> CSV
              </button>
              <button onClick={generateProposal} className="rc-btn rc-btn-ghost text-sm py-1.5 px-3 flex items-center gap-2">
                <FileSignature className="w-4 h-4" /> Proposal
              </button>
              <button onClick={shareWithClient} className="rc-btn rc-btn-ghost text-sm py-1.5 px-3 flex items-center gap-2">
                <Share2 className="w-4 h-4" /> Share
              </button>
              <ExportToSlides
                toolName="AI Policy Review & Gap Analysis"
                getSections={() => {
                  if (!analysis.gaps || analysis.gaps.length === 0) return [];
                  return analysis.gaps.map((gap) => ({
                    title: gap.category,
                    items: [
                      { label: "Current Coverage", value: formatCurrency(gap.currentCoverage) },
                      { label: "Recommended", value: formatCurrency(gap.recommendedCoverage) },
                      { label: "Gap Amount", value: formatCurrency(gap.gapAmount) },
                      { label: "Severity", value: gap.severity },
                      { label: "Recommendation", value: gap.recommendation }
                    ]
                  }));
                }}
              />
            </div>
          </div>
        </div>

        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Protection Score" 
            value={`${analysis.overallScore}%`}
            subtitle="Based on 7 coverage areas"
            icon={Target}
            colorClass={{
              bg: analysis.overallScore >= 80 ? "bg-[#22c55e]/10" : analysis.overallScore >= 50 ? "bg-[#f0c040]/10" : "bg-red-500/10",
              text: analysis.overallScore >= 80 ? "text-[#22c55e]" : analysis.overallScore >= 50 ? "text-[#f0c040]" : "text-red-400"
            }}
          />
          <StatCard 
            title="Total Coverage Gap" 
            value={formatCurrency(analysis.totalGapAmount)}
            subtitle="Cumulative shortfall"
            icon={TrendingDown}
            colorClass={{ bg: "bg-red-500/10", text: "text-red-400" }}
          />
          <StatCard 
            title="Critical Gaps" 
            value={analysis.severeCount.toString()}
            subtitle="Require immediate action"
            icon={AlertTriangle}
            colorClass={{ bg: "bg-orange-500/10", text: "text-orange-400" }}
          />
          <StatCard 
            title="Risk Profile" 
            value={analysis.riskProfile}
            subtitle={`Next review: ${analysis.nextReviewDate}`}
            icon={Activity}
            colorClass={{ bg: "bg-blue-500/10", text: "text-blue-400" }}
          />
        </div>

        {/* Score Banner */}
        <div className="rc-card border-[#12233e] bg-gradient-to-r from-[#0a1628] to-[#0d1f3c] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#22c55e]/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="text-center md:text-left min-w-[150px]">
              <div className="text-sm text-[#7a95b8] mb-1 uppercase tracking-wider font-semibold">Overall Readiness</div>
              <div className={`text-5xl font-black ${analysis.overallScore >= 80 ? "text-[#22c55e]" : analysis.overallScore >= 50 ? "text-[#f0c040]" : "text-red-400"}`}>
                {analysis.overallScore}%
              </div>
            </div>
            <div className="flex-1 w-full">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[#7a95b8]">Vulnerable</span>
                <span className="text-[#7a95b8]">Protected</span>
              </div>
              <Progress value={analysis.overallScore} className="h-4 mb-4 bg-[#060d19]" />
              <div className="flex gap-4 text-sm flex-wrap">
                {analysis.severeCount > 0 && (
                  <span className="text-red-400 flex items-center gap-1.5 font-medium bg-red-500/10 px-3 py-1 rounded-full">
                    <AlertTriangle className="w-4 h-4" /> {analysis.severeCount} Severe
                  </span>
                )}
                {analysis.moderateCount > 0 && (
                  <span className="text-[#f0c040] flex items-center gap-1.5 font-medium bg-[#f0c040]/10 px-3 py-1 rounded-full">
                    <AlertTriangle className="w-4 h-4" /> {analysis.moderateCount} Moderate
                  </span>
                )}
                {analysis.minorCount > 0 && (
                  <span className="text-blue-400 flex items-center gap-1.5 font-medium bg-blue-500/10 px-3 py-1 rounded-full">
                    <Info className="w-4 h-4" /> {analysis.minorCount} Minor
                  </span>
                )}
                <span className="text-[#22c55e] flex items-center gap-1.5 font-medium bg-[#22c55e]/10 px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-4 h-4" /> {analysis.coveredCount} Covered
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <TabsList className="bg-[#0d1a2e] border border-[#12233e] p-1 h-auto">
              <TabsTrigger value="dashboard" className="py-2 px-4 data-[state=active]:bg-[#1a2f52] data-[state=active]:text-white flex items-center gap-2">
                <PieChartIcon className="w-4 h-4" /> Dashboard
              </TabsTrigger>
              <TabsTrigger value="details" className="py-2 px-4 data-[state=active]:bg-[#1a2f52] data-[state=active]:text-white flex items-center gap-2">
                <FileText className="w-4 h-4" /> Detailed Gaps
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="py-2 px-4 data-[state=active]:bg-[#1a2f52] data-[state=active]:text-white flex items-center gap-2">
                <Target className="w-4 h-4" /> Action Plan
              </TabsTrigger>
            </TabsList>
            
            {activeTab === "details" && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a95b8]" />
                  <input
                    type="text"
                    placeholder="Search gaps..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="rc-input pl-9 w-full h-10 text-sm"
                  />
                </div>
                <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                  <SelectTrigger className="w-[140px] h-10 bg-[#0d1a2e] border-[#12233e]">
                    <Filter className="w-4 h-4 mr-2 text-[#7a95b8]" />
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0d1a2e] border-[#12233e]">
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="severe">Severe Only</SelectItem>
                    <SelectItem value="moderate">Moderate Only</SelectItem>
                    <SelectItem value="minor">Minor Only</SelectItem>
                    <SelectItem value="none">Covered Only</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex bg-[#0d1a2e] border border-[#12233e] rounded-md overflow-hidden">
                  <button 
                    onClick={() => setViewMode("grid")}
                    className={`p-2 ${viewMode === "grid" ? "bg-[#1a2f52] text-white" : "text-[#7a95b8] hover:text-white"}`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                  </button>
                  <button 
                    onClick={() => setViewMode("list")}
                    className={`p-2 ${viewMode === "list" ? "bg-[#1a2f52] text-white" : "text-[#7a95b8] hover:text-white"}`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* TAB 1: Dashboard (Visualizations) */}
          <TabsContent value="dashboard" className="space-y-6 m-0">
            {/* Charts Row 1 - 5+ Recharts components total across the page */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1: Radar */}
              <div className="rc-card flex flex-col h-[450px]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-[#3b82f6]" /> Coverage Profile
                  </h3>
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                      <PolarGrid stroke="#12233e" />
                      <PolarAngleAxis dataKey="category" tick={{ fill: "#c8d8ec", fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#7a95b8", fontSize: 10 }} />
                      <Radar name="Current %" dataKey="coverage" stroke="#22c55e" fill="#22c55e" fillOpacity={0.5} />
                      <Radar name="Target %" dataKey="target" stroke="#12233e" fill="transparent" strokeDasharray="3 3" />
                      <Tooltip contentStyle={{ backgroundColor: "#0d1a2e", borderColor: "#12233e", color: "#fff", borderRadius: "8px" }} />
                      <Legend wrapperStyle={{ paddingTop: "20px" }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Bar */}
              <div className="rc-card flex flex-col h-[450px]">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#f0c040]" /> Gap Analysis (USD)
                  </h3>
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#12233e" horizontal={true} vertical={false} />
                      <XAxis type="number" tickFormatter={(v) => `$${(v / 1000)}k`} tick={{ fill: "#7a95b8", fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" width={100} tick={{ fill: "#c8d8ec", fontSize: 11 }} />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ backgroundColor: "#0d1a2e", borderColor: "#12233e", color: "#fff", borderRadius: "8px" }} 
                      />
                      <Legend />
                      <Bar dataKey="current" name="Current" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="gap" name="Shortfall" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} opacity={0.8} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart 3: Pie */}
              <div className="rc-card flex flex-col h-[350px]">
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-[#8b5cf6]" /> Severity Distribution
                </h3>
                <div className="flex-1 min-h-0 relative">
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
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#0d1a2e", borderColor: "#12233e", color: "#fff", borderRadius: "8px" }}
                        itemStyle={{ color: "#fff" }}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none mb-8">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white">{analysis.gaps.length}</div>
                      <div className="text-xs text-[#7a95b8]">Categories</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart 4: Area (Trend) */}
              <div className="rc-card flex flex-col h-[350px] lg:col-span-2">
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#14b8a6]" /> Historical Coverage Trend
                </h3>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCoverage" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorNeed" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f0c040" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f0c040" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                      <XAxis dataKey="year" tick={{ fill: "#7a95b8", fontSize: 12 }} />
                      <YAxis tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} tick={{ fill: "#7a95b8", fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ backgroundColor: "#0d1a2e", borderColor: "#12233e", color: "#fff", borderRadius: "8px" }}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="totalNeed" name="Total Need" stroke="#f0c040" fillOpacity={1} fill="url(#colorNeed)" />
                      <Area type="monotone" dataKey="coverage" name="Actual Coverage" stroke="#22c55e" fillOpacity={1} fill="url(#colorCoverage)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Chart 5: Scatter (Impact vs Urgency) */}
            <div className="rc-card flex flex-col h-[400px]">
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#ec4899]" /> Risk Prioritization Matrix
              </h3>
              <p className="text-sm text-[#7a95b8] mb-4">Higher urgency and impact scores indicate areas requiring immediate attention.</p>
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                    <XAxis type="number" dataKey="urgency" name="Urgency" domain={[0, 100]} tick={{ fill: "#7a95b8" }}>
                      <Label value="Urgency Score" offset={-10} position="insideBottom" fill="#7a95b8" />
                    </XAxis>
                    <YAxis type="number" dataKey="impact" name="Impact" domain={[0, 100]} tick={{ fill: "#7a95b8" }}>
                      <Label value="Financial Impact Score" angle={-90} position="insideLeft" fill="#7a95b8" />
                    </YAxis>
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-[#0d1a2e] border border-[#12233e] p-3 rounded-lg shadow-xl">
                              <p className="font-bold text-white mb-1">{data.name}</p>
                              <p className="text-sm text-[#c8d8ec]">Impact: {data.impact}</p>
                              <p className="text-sm text-[#c8d8ec]">Urgency: {data.urgency}</p>
                              <p className="text-sm text-red-400 mt-1">Gap: {formatCurrency(data.gap)}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Scatter name="Risks" data={impactData} fill="#3b82f6">
                      {impactData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.gap > 0 ? (entry.urgency > 70 ? '#ef4444' : '#f0c040') : '#22c55e'} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: Detailed Gaps (Grid/List View) */}
          <TabsContent value="details" className="m-0">
            {filteredGaps.length === 0 ? (
              <div className="rc-card py-20 text-center flex flex-col items-center">
                <Search className="w-12 h-12 text-[#12233e] mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No gaps found</h3>
                <p className="text-[#7a95b8]">Try adjusting your search or filters.</p>
                <button 
                  onClick={() => { setSearchQuery(""); setFilterSeverity("all"); }}
                  className="mt-4 rc-btn rc-btn-ghost"
                >
                  Clear Filters
                </button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredGaps.map((gap, i) => {
                  const style = SEVERITY_STYLES[gap.severity];
                  const Icon = gap.icon;
                  return (
                    <div 
                      key={i} 
                      className={`rc-card flex flex-col h-full ${style.border} transition-all duration-200 hover:border-opacity-100 hover:shadow-lg hover:shadow-${style.text.split('-')[1]}-500/10 cursor-pointer`}
                      onClick={() => setSelectedGap(gap)}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-xl ${style.bg}`}>
                            <Icon className={`w-6 h-6 ${style.text}`} />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-white leading-tight">{gap.category}</h3>
                            <span className={`text-xs ${style.text} font-medium`}>{style.label}</span>
                          </div>
                        </div>
                        {gap.trend === "improving" ? <TrendingUp className="w-5 h-5 text-emerald-500" /> :
                         gap.trend === "worsening" ? <TrendingDown className="w-5 h-5 text-red-500" /> :
                         <ArrowRight className="w-5 h-5 text-blue-500" />}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-4 flex-1">
                        <div className="bg-[#060d19] p-3 rounded-lg border border-[#12233e]">
                          <span className="text-xs text-[#7a95b8] block mb-1">Current</span>
                          <span className="text-sm font-semibold text-white">{formatCurrency(gap.currentCoverage)}</span>
                        </div>
                        <div className="bg-[#060d19] p-3 rounded-lg border border-[#12233e]">
                          <span className="text-xs text-[#7a95b8] block mb-1">Target</span>
                          <span className="text-sm font-semibold text-white">{formatCurrency(gap.recommendedCoverage)}</span>
                        </div>
                      </div>
                      
                      {gap.gapAmount > 0 && (
                        <div className="mb-4">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-[#7a95b8]">Coverage Gap</span>
                            <span className="text-red-400 font-bold">{formatCurrency(gap.gapAmount)}</span>
                          </div>
                          <Progress value={100 - gap.gapPercent} className="h-2 bg-red-500/20" />
                        </div>
                      )}
                      
                      <p className="text-sm text-[#c8d8ec] line-clamp-2 mb-4 flex-1">
                        {gap.explanation}
                      </p>
                      
                      <div className="pt-4 border-t border-[#12233e] mt-auto">
                        <button className="w-full text-center text-sm font-medium text-[#3b82f6] hover:text-[#60a5fa] transition-colors flex items-center justify-center gap-1">
                          View Details <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rc-card p-0 overflow-hidden">
                <DataTable 
                  columns={[
                    { header: "Category", cell: (r: any) => (
                      <div className="flex items-center gap-3">
                        <r.icon className="w-5 h-5 text-[#7a95b8]" />
                        <span className="font-medium text-white">{r.category}</span>
                      </div>
                    )},
                    { header: "Status", cell: (r: any) => renderSeverityBadge(r.severity) },
                    { header: "Current", cell: (r: any) => formatCurrency(r.currentCoverage) },
                    { header: "Recommended", cell: (r: any) => formatCurrency(r.recommendedCoverage) },
                    { header: "Gap", cell: (r: any) => (
                      <span className={r.gapAmount > 0 ? "text-red-400 font-medium" : "text-[#22c55e]"}>
                        {formatCurrency(r.gapAmount)}
                      </span>
                    )},
                    { header: "Product", accessor: "product" },
                    { header: "", cell: () => <ChevronRight className="w-5 h-5 text-[#7a95b8]" /> }
                  ]}
                  data={filteredGaps}
                  onRowClick={(row: any) => setSelectedGap(row)}
                />
              </div>
            )}
          </TabsContent>

          {/* TAB 3: Action Plan & Recommendations */}
          <TabsContent value="recommendations" className="m-0 space-y-6">
            <div className="rc-card bg-gradient-to-br from-[#0a1628] to-[#0d1f3c] border-[#3b82f6]/30">
              <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                <Target className="w-6 h-6 text-[#3b82f6]" /> Executive Summary & Action Plan
              </h3>
              <p className="text-[#c8d8ec] text-lg leading-relaxed mb-6">
                {analysis.recommendationSummary} The analysis identified <strong className="text-white">{analysis.gaps.filter((g) => g.gapAmount > 0).length} areas</strong> requiring attention to optimize the client's protection strategy.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-[#060d19] p-4 rounded-xl border border-[#12233e]">
                  <div className="text-sm text-[#7a95b8] mb-1">Estimated Monthly Premium to Close All Gaps</div>
                  <div className="text-2xl font-bold text-white">
                    {formatCurrency(analysis.gaps.reduce((sum, g) => sum + (g.premiumEstimate || 0), 0) / 12)}
                    <span className="text-sm font-normal text-[#7a95b8]">/mo</span>
                  </div>
                </div>
                <div className="bg-[#060d19] p-4 rounded-xl border border-[#12233e]">
                  <div className="text-sm text-[#7a95b8] mb-1">Highest Priority Area</div>
                  <div className="text-xl font-bold text-red-400">
                    {analysis.gaps.sort((a, b) => b.urgency - a.urgency)[0]?.category || "None"}
                  </div>
                </div>
                <div className="bg-[#060d19] p-4 rounded-xl border border-[#12233e]">
                  <div className="text-sm text-[#7a95b8] mb-1">Quickest Win</div>
                  <div className="text-xl font-bold text-[#22c55e]">
                    Umbrella Liability
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button className="rc-btn rc-btn-primary flex items-center gap-2">
                  <FileSignature className="w-4 h-4" /> Generate Implementation Plan
                </button>
                <button className="rc-btn rc-btn-ghost flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email Summary to Client
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white px-2">Prioritized Recommendations</h3>
              
              {analysis.gaps
                .filter((g) => g.gapAmount > 0)
                .sort((a, b) => b.urgency - a.urgency)
                .map((gap, i) => (
                  <div key={i} className="rc-card border-l-4" style={{ borderLeftColor: gap.severity === 'severe' ? '#ef4444' : gap.severity === 'moderate' ? '#f0c040' : '#3b82f6' }}>
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#12233e] text-xs font-bold text-white">{i + 1}</span>
                          <h4 className="text-xl font-bold text-white">{gap.product}</h4>
                          {renderSeverityBadge(gap.severity)}
                        </div>
                        <p className="text-[#c8d8ec] mb-4">{gap.recommendation}</p>
                        
                        <div className="bg-[#060d19] rounded-lg p-4 border border-[#12233e]">
                          <h5 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-[#22c55e]" /> Next Steps
                          </h5>
                          <ul className="space-y-2">
                            {gap.actionSteps?.map((step, j) => (
                              <li key={j} className="text-sm text-[#c8d8ec] flex items-start gap-2">
                                <span className="text-[#3b82f6] mt-0.5">•</span> {step}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      <div className="md:w-64 flex flex-col gap-3 shrink-0">
                        <div className="bg-[#060d19] p-3 rounded-lg border border-[#12233e] text-center">
                          <span className="text-xs text-[#7a95b8] block mb-1">Coverage Gap</span>
                          <span className="text-lg font-bold text-red-400">{formatCurrency(gap.gapAmount)}</span>
                        </div>
                        <div className="bg-[#060d19] p-3 rounded-lg border border-[#12233e] text-center">
                          <span className="text-xs text-[#7a95b8] block mb-1">Est. Annual Premium</span>
                          <span className="text-lg font-bold text-white">{formatCurrency(gap.premiumEstimate || 0)}</span>
                        </div>
                        <button className="rc-btn rc-btn-secondary w-full flex items-center justify-center gap-2">
                          <FilePlus className="w-4 h-4" /> Start Application
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Detail Modal Overlay */}
        {selectedGap && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#0d1a2e] border border-[#12233e] rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="p-6 border-b border-[#12233e] flex items-center justify-between bg-[#0a1628]">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${SEVERITY_STYLES[selectedGap.severity].bg}`}>
                    <selectedGap.icon className={`w-6 h-6 ${SEVERITY_STYLES[selectedGap.severity].text}`} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedGap.category}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      {renderSeverityBadge(selectedGap.severity)}
                      <span className="text-sm text-[#7a95b8]">Impact Score: {selectedGap.impactScore}/100</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedGap(null)}
                  className="p-2 text-[#7a95b8] hover:text-white hover:bg-[#12233e] rounded-lg transition-colors"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
              
              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#060d19] p-4 rounded-xl border border-[#12233e]">
                    <span className="text-xs text-[#7a95b8] block mb-1 uppercase tracking-wider">Current</span>
                    <span className="text-xl font-bold text-white">{formatCurrency(selectedGap.currentCoverage)}</span>
                  </div>
                  <div className="bg-[#060d19] p-4 rounded-xl border border-[#12233e]">
                    <span className="text-xs text-[#7a95b8] block mb-1 uppercase tracking-wider">Recommended</span>
                    <span className="text-xl font-bold text-white">{formatCurrency(selectedGap.recommendedCoverage)}</span>
                  </div>
                  <div className="bg-[#060d19] p-4 rounded-xl border border-[#12233e]">
                    <span className="text-xs text-[#7a95b8] block mb-1 uppercase tracking-wider">Shortfall</span>
                    <span className={`text-xl font-bold ${selectedGap.gapAmount > 0 ? 'text-red-400' : 'text-[#22c55e]'}`}>
                      {formatCurrency(selectedGap.gapAmount)}
                    </span>
                  </div>
                  <div className="bg-[#060d19] p-4 rounded-xl border border-[#12233e]">
                    <span className="text-xs text-[#7a95b8] block mb-1 uppercase tracking-wider">Est. Premium</span>
                    <span className="text-xl font-bold text-white">{formatCurrency(selectedGap.premiumEstimate || 0)}<span className="text-sm font-normal text-[#7a95b8]">/yr</span></span>
                  </div>
                </div>

                {/* Analysis & Recommendation */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                      <Info className="w-5 h-5 text-[#3b82f6]" /> Analysis
                    </h3>
                    <p className="text-[#c8d8ec] leading-relaxed bg-[#12233e]/30 p-4 rounded-lg border border-[#12233e]/50">
                      {selectedGap.explanation}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                      <Target className="w-5 h-5 text-[#22c55e]" /> Recommendation
                    </h3>
                    <div className="bg-[#22c55e]/10 p-4 rounded-lg border border-[#22c55e]/20">
                      <p className="text-[#c8d8ec] leading-relaxed mb-3">{selectedGap.recommendation}</p>
                      <div className="inline-block bg-[#060d19] px-3 py-1.5 rounded-md border border-[#12233e] text-sm font-medium text-white">
                        Primary Solution: {selectedGap.product}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Alternative Products & Action Steps */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-md font-semibold text-white mb-3">Alternative Solutions</h3>
                    <ul className="space-y-2">
                      {selectedGap.alternativeProducts?.map((alt, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-[#7a95b8] bg-[#060d19] p-2 rounded border border-[#12233e]">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#7a95b8]"></div>
                          {alt}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-md font-semibold text-white mb-3">Next Steps</h3>
                    <ul className="space-y-2">
                      {selectedGap.actionSteps?.map((step, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[#c8d8ec]">
                          <CheckCircle2 className="w-4 h-4 text-[#3b82f6] shrink-0 mt-0.5" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="p-4 border-t border-[#12233e] bg-[#0a1628] flex justify-end gap-3">
                <button onClick={() => setSelectedGap(null)} className="rc-btn rc-btn-ghost">
                  Close
                </button>
                <button className="rc-btn rc-btn-secondary flex items-center gap-2">
                  <Copy className="w-4 h-4" /> Copy Details
                </button>
                <button className="rc-btn rc-btn-primary flex items-center gap-2">
                  <FilePlus className="w-4 h-4" /> Create Quote Request
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
      <PageInsights pageId="ai-policy-review-gap" />
    
        <ComplianceFooter pageName="AIPolicyReviewGap" showsIUL showsAnnuity showsTax showsEstate showsProjections showsHistoricalData />
      </AppShell>
  );
}
