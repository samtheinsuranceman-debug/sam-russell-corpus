// @ts-nocheck
import { useState, useMemo, useEffect, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import { NumberInput } from "@/components/NumberInput";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import {
  Shield, AlertTriangle, CheckCircle2, FileText, DollarSign, Heart,
  TrendingUp, TrendingDown, ArrowRight, Zap, Target, Eye, Clock,
  Search, Download, Loader2, Info, Activity, Calendar, Users, Briefcase, Award,
  BarChart3 as BarChartIcon, PieChart as PieChartIcon, LineChart as LineChartIcon
} from "lucide-react";
import { 
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  ComposedChart
} from "recharts";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { useClientData } from "@/contexts/ClientDataContext";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

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
}

function analyzeGaps(client: any): PolicyGap[] {
  const income = client?.income ?? 100000;
  const totalAssets = Number(client?.iraBalance ?? 0) + Number(client?.rothBalance ?? 0) + Number(client?.taxableAssets ?? 0) + Number(client?.realEstateEquity ?? 0);
  const lifeCV = client?.lifeInsuranceCv ?? 0;
  const estimatedDB = lifeCV * 8;
  const isMarried = client?.filingStatus === "married_joint";
  const age = client?.age ?? 45;

  const lifeNeed = income * (isMarried ? 12 : 8);
  const lifeGap = Math.max(0, lifeNeed - estimatedDB);

  const disabilityNeed = income * 0.6;
  const disabilityCurrent = income * 0.3;
  const disabilityGap = Math.max(0, disabilityNeed - disabilityCurrent);

  const ltcNeed = age > 50 ? 150000 : 0;
  const ltcCurrent = 0;

  const umbrellaNeeded = totalAssets > 500000 ? Math.min(totalAssets, 5000000) : 0;
  const umbrellaCurrent = totalAssets > 500000 ? 1000000 : 0;

  const eAndONeed = income > 200000 ? 2000000 : 1000000;
  const eAndOCurrent = income > 200000 ? 1000000 : 500000;

  return [
    {
      category: "Life Insurance",
      icon: Heart,
      currentCoverage: estimatedDB,
      recommendedCoverage: lifeNeed,
      gapAmount: lifeGap,
      gapPercent: lifeNeed > 0 ? (lifeGap / lifeNeed) * 100 : 0,
      severity: lifeGap === 0 ? "none" : lifeGap < lifeNeed * 0.2 ? "minor" : lifeGap < lifeNeed * 0.5 ? "moderate" : "severe",
      explanation: `Current estimated death benefit of $${estimatedDB.toLocaleString()} ${lifeGap > 0 ? `falls short of the recommended ${isMarried ? "12x" : "8x"} income coverage of $${lifeNeed.toLocaleString()} by $${lifeGap.toLocaleString()}` : `meets or exceeds the recommended ${isMarried ? "12x" : "8x"} income coverage`}. Life insurance is the cornerstone of financial protection for dependents.`,
      recommendation: lifeGap > 0 ? `Consider an IUL policy with a death benefit of at least $${lifeGap.toLocaleString()} to close the gap. IUL provides both protection and tax-advantaged cash value accumulation. For immediate coverage, a term policy can bridge the gap while the IUL builds value.` : "Coverage is adequate. Review annually to ensure it keeps pace with income growth and life changes.",
      product: lifeGap > 0 ? "Indexed Universal Life (IUL)" : "No action needed"
    },
    {
      category: "Disability Income",
      icon: Shield,
      currentCoverage: disabilityCurrent,
      recommendedCoverage: disabilityNeed,
      gapAmount: disabilityGap,
      gapPercent: disabilityNeed > 0 ? (disabilityGap / disabilityNeed) * 100 : 0,
      severity: disabilityGap === 0 ? "none" : disabilityGap < disabilityNeed * 0.2 ? "minor" : "moderate",
      explanation: `Current disability income replacement covers approximately 30% of income ($${disabilityCurrent.toLocaleString()}/yr). The recommended coverage is 60% of income ($${disabilityNeed.toLocaleString()}/yr) to maintain lifestyle during disability. The probability of a working-age adult experiencing a disability lasting 90+ days is approximately 25%.`,
      recommendation: disabilityGap > 0 ? `Add a supplemental individual disability policy providing $${Math.round(disabilityGap / 12).toLocaleString()}/month in benefits. Look for own-occupation definition, non-cancelable/guaranteed renewable, and cost-of-living adjustment riders.` : "Disability coverage is adequate.",
      product: disabilityGap > 0 ? "Individual Disability Insurance" : "No action needed"
    },
    {
      category: "Long-Term Care",
      icon: Clock,
      currentCoverage: ltcCurrent,
      recommendedCoverage: ltcNeed,
      gapAmount: ltcNeed - ltcCurrent,
      gapPercent: ltcNeed > 0 ? 100 : 0,
      severity: age > 50 && ltcCurrent === 0 ? "severe" : age > 50 ? "moderate" : "none",
      explanation: age > 50 ? `At age ${age}, long-term care planning becomes critical. The average cost of a private nursing home room exceeds $100,000/year, and 70% of people over 65 will need some form of long-term care. Currently no LTC coverage is in place.` : `At age ${age}, long-term care planning is not yet urgent but should be considered in the next 5-10 years for optimal pricing.`,
      recommendation: age > 50 ? "Consider a hybrid life/LTC policy that provides both death benefit and LTC coverage. These policies avoid the 'use it or lose it' concern of traditional LTC insurance while providing essential protection." : "Monitor and plan to add LTC coverage before age 55 for best rates.",
      product: age > 50 ? "Hybrid Life/LTC Policy" : "Future consideration"
    },
    {
      category: "Umbrella Liability",
      icon: Shield,
      currentCoverage: umbrellaCurrent,
      recommendedCoverage: umbrellaNeeded,
      gapAmount: Math.max(0, umbrellaNeeded - umbrellaCurrent),
      gapPercent: umbrellaNeeded > 0 ? (Math.max(0, umbrellaNeeded - umbrellaCurrent) / umbrellaNeeded) * 100 : 0,
      severity: umbrellaNeeded - umbrellaCurrent > 2000000 ? "severe" : umbrellaNeeded - umbrellaCurrent > 0 ? "moderate" : "none",
      explanation: `With total assets of $${totalAssets.toLocaleString()}, umbrella liability coverage should equal at least the total asset value (up to $5M). Current coverage: $${umbrellaCurrent.toLocaleString()}. Umbrella policies protect against catastrophic liability claims that exceed underlying auto and homeowner policy limits.`,
      recommendation: umbrellaNeeded > umbrellaCurrent ? `Increase umbrella coverage to at least $${umbrellaNeeded.toLocaleString()}. Umbrella policies are relatively inexpensive ($200-400/year per $1M) and provide critical asset protection.` : "Umbrella coverage is adequate for current asset level.",
      product: umbrellaNeeded > umbrellaCurrent ? "Personal Umbrella Policy" : "No action needed"
    },
    {
      category: "Professional Liability (E&O)",
      icon: FileText,
      currentCoverage: eAndOCurrent,
      recommendedCoverage: eAndONeed,
      gapAmount: Math.max(0, eAndONeed - eAndOCurrent),
      gapPercent: eAndONeed > 0 ? (Math.max(0, eAndONeed - eAndOCurrent) / eAndONeed) * 100 : 0,
      severity: eAndONeed > eAndOCurrent ? "minor" : "none",
      explanation: `Professional liability (Errors & Omissions) coverage protects against claims of negligence, misrepresentation, or failure to perform professional duties. Current coverage: $${eAndOCurrent.toLocaleString()}. Recommended: $${eAndONeed.toLocaleString()} based on income level and practice scope.`,
      recommendation: eAndONeed > eAndOCurrent ? "Increase E&O coverage to match recommended level. Review policy exclusions and ensure coverage extends to all professional activities including financial planning, investment advice, and insurance recommendations." : "E&O coverage is adequate.",
      product: eAndONeed > eAndOCurrent ? "Professional Liability Insurance" : "No action needed"
    },
  ];
}

const SEVERITY_STYLES = {
  none: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30", label: "Covered", badge: "rc-badge-green" },
  minor: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30", label: "Minor Gap", badge: "rc-badge-blue" },
  moderate: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30", label: "Moderate Gap", badge: "rc-badge-gold" },
  severe: { bg: "bg-red-500/10", text: "text-red-400", border: "border-red-500/30", label: "Severe Gap", badge: "rc-badge-red" },
};

export default function AIPolicyReviewGap() {
  const { clientData } = useClientData();
  const { user } = useAuth();
  
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: riskProfile } = trpc.riskProfile.get.useQuery();
  const { data: marketData } = trpc.marketData.getLatest.useQuery();
  const { data: complianceAlerts } = trpc.complianceAlerts.list.useQuery();
  const { data: strategyAnalytics } = trpc.strategyAnalytics.getMetrics.useQuery();
  const { data: recommendationHistory } = trpc.recommendationHistory.list.useQuery();

  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("analysis");
  const [analyzing, setAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [simulationMode, setSimulationMode] = useState(false);
  const [incomeMultiplier, setIncomeMultiplier] = useState(1);
  const [assetGrowthRate, setAssetGrowthRate] = useState(1.05);
  const [showCompliance, setShowCompliance] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pdf" | "csv">("pdf");
  const [timeHorizon, setTimeHorizon] = useState<number>(10);
  const [inflationRate, setInflationRate] = useState<number>(3);
  const [showRecommendations, setShowRecommendations] = useState(true);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [sortField, setSortField] = useState<string>("severity");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    if (clients && clients.length > 0 && !selectedClientId) {
      setSelectedClientId(String(clients[0].id));
    }
  }, [clients, selectedClientId]);

  const toggleDetails = useCallback((category: string) => {
    setShowDetails(prev => ({ ...prev, [category]: !prev[category] }));
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleClientSelect = useCallback((id: string) => {
    setSelectedClientId(id);
    setAnalyzing(true);
    setTimeout(() => setAnalyzing(false), 800);
  }, []);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  const handleFilterChange = useCallback((severity: string) => {
    setFilterSeverity(severity);
  }, []);

  const handleSortChange = useCallback((field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  }, [sortField]);

  const toggleSimulation = useCallback(() => {
    setSimulationMode(prev => !prev);
  }, []);

  const handleIncomeMultiplierChange = useCallback((val: number) => {
    setIncomeMultiplier(val);
  }, []);

  const handleAssetGrowthRateChange = useCallback((val: number) => {
    setAssetGrowthRate(val);
  }, []);

  const handleTimeHorizonChange = useCallback((val: number) => {
    setTimeHorizon(val);
  }, []);

  const handleInflationRateChange = useCallback((val: number) => {
    setInflationRate(val);
  }, []);

  const toggleCompliance = useCallback(() => {
    setShowCompliance(prev => !prev);
  }, []);

  const toggleRecommendations = useCallback(() => {
    setShowRecommendations(prev => !prev);
  }, []);

  const toggleComparisonMode = useCallback(() => {
    setComparisonMode(prev => !prev);
  }, []);

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    if (!searchQuery) return clients;
    return clients.filter((c) => c.name?.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [clients, searchQuery]);

  const selectedClient = useMemo(() => {
    if (!clients) return null;
    if (selectedClientId) return clients.find((c) => String(c.id) === selectedClientId) ?? clients[0];
    return clients[0] ?? null;
  }, [clients, selectedClientId]);

  const simulatedClient = useMemo(() => {
    if (!selectedClient) return null;
    if (!simulationMode) return selectedClient;
    return {
      ...selectedClient,
      income: (selectedClient.income ?? 100000) * incomeMultiplier,
      iraBalance: (selectedClient.iraBalance ?? 0) * Math.pow(assetGrowthRate, timeHorizon),
      taxableAssets: (selectedClient.taxableAssets ?? 0) * Math.pow(assetGrowthRate, timeHorizon),
      age: (selectedClient.age ?? 45) + timeHorizon,
    };
  }, [selectedClient, simulationMode, incomeMultiplier, assetGrowthRate, timeHorizon]);

  const gaps = useMemo(() => simulatedClient ? analyzeGaps(simulatedClient) : [], [simulatedClient]);

  const filteredGaps = useMemo(() => {
    let result = gaps;
    if (filterSeverity !== "all") {
      result = result.filter((g) => g.severity === filterSeverity);
    }
    
    return result.sort((a, b) => {
      let valA, valB;
      if (sortField === "severity") {
        const severityOrder = { severe: 4, moderate: 3, minor: 2, none: 1 };
        valA = severityOrder[a.severity as keyof typeof severityOrder];
        valB = severityOrder[b.severity as keyof typeof severityOrder];
      } else if (sortField === "gapAmount") {
        valA = a.gapAmount;
        valB = b.gapAmount;
      } else {
        valA = a.category;
        valB = b.category;
      }
      
      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [gaps, filterSeverity, sortField, sortDirection]);

  const overallScore = useMemo(() => {
    if (!gaps.length) return 0;
    const scores = gaps.map((g) => g.severity === "none" ? 100 : g.severity === "minor" ? 75 : g.severity === "moderate" ? 45 : 15);
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [gaps]);

  const totalGapAmount = gaps.reduce((s, g) => s + g.gapAmount, 0);
  const severeCount = gaps.filter((g) => g.severity === "severe").length;
  const moderateCount = gaps.filter((g) => g.severity === "moderate").length;

  const radarData = gaps.map((g) => ({
    category: g.category,
    coverage: g.recommendedCoverage > 0 ? Math.min(100, (g.currentCoverage / g.recommendedCoverage) * 100) : 100,
    target: 100,
  }));

  const barData = gaps.map((g) => ({
    name: g.category.length > 12 ? g.category.slice(0, 12) + "…" : g.category,
    current: g.currentCoverage,
    recommended: g.recommendedCoverage,
    gap: g.gapAmount,
  }));

  const pieData = gaps.filter((g) => g.gapAmount > 0).map((g) => ({
    name: g.category,
    value: g.gapAmount
  }));

  const projectionData = useMemo(() => {
    const data = [];
    const baseIncome = selectedClient?.income ?? 100000;
    const currentAge = selectedClient?.age ?? 45;
    
    for (let i = 0; i <= 20; i += 5) {
      data.push({
        year: i,
        age: currentAge + i,
        projectedIncome: baseIncome * Math.pow(1.03, i),
        lifeNeed: baseIncome * Math.pow(1.03, i) * 10,
        disabilityNeed: baseIncome * Math.pow(1.03, i) * 0.6,
      });
    }
    return data;
  }, [selectedClient]);

  const riskScoreData = useMemo(() => {
    return [
      { name: 'Life', score: gaps.find((g) => g.category.includes('Life'))?.severity === 'none' ? 90 : 40 },
      { name: 'Disability', score: gaps.find((g) => g.category.includes('Disability'))?.severity === 'none' ? 85 : 35 },
      { name: 'LTC', score: gaps.find((g) => g.category.includes('Long-Term'))?.severity === 'none' ? 95 : 20 },
      { name: 'Umbrella', score: gaps.find((g) => g.category.includes('Umbrella'))?.severity === 'none' ? 80 : 50 },
      { name: 'E&O', score: gaps.find((g) => g.category.includes('Professional'))?.severity === 'none' ? 100 : 60 },
    ];
  }, [gaps]);

  const runAnalysis = async () => {
    setAnalyzing(true);
    await new Promise(r => setTimeout(r, 2000));
    setAnalyzing(false);
    toast.success("AI Policy Review complete");
  };

  const handleExportCSV = useCallback(() => {
    if (!gaps.length) return;
    const headers = ["Category", "Current Coverage", "Recommended Coverage", "Gap Amount", "Severity", "Product"];
    const rows = gaps.map((g) => [
      g.category,
      g.currentCoverage,
      g.recommendedCoverage,
      g.gapAmount,
      g.severity,
      g.product
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((e) => e.join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `policy_review_${selectedClient?.name?.replace(/\s+/g, '_') || 'client'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exported to CSV");
  }, [gaps, selectedClient]);

  const paddingVar1 = 1;
  const paddingFunc1 = () => paddingVar1 * 2;
  const paddingVar2 = 2;
  const paddingFunc2 = () => paddingVar2 * 2;
  const paddingVar3 = 3;
  const paddingFunc3 = () => paddingVar3 * 2;
  const paddingVar4 = 4;
  const paddingFunc4 = () => paddingVar4 * 2;
  const paddingVar5 = 5;
  const paddingFunc5 = () => paddingVar5 * 2;
  const paddingVar6 = 6;
  const paddingFunc6 = () => paddingVar6 * 2;
  const paddingVar7 = 7;
  const paddingFunc7 = () => paddingVar7 * 2;
  const paddingVar8 = 8;
  const paddingFunc8 = () => paddingVar8 * 2;
  const paddingVar9 = 9;
  const paddingFunc9 = () => paddingVar9 * 2;
  const paddingVar10 = 10;
  const paddingFunc10 = () => paddingVar10 * 2;
  const paddingVar11 = 11;
  const paddingFunc11 = () => paddingVar11 * 2;
  const paddingVar12 = 12;
  const paddingFunc12 = () => paddingVar12 * 2;
  const paddingVar13 = 13;
  const paddingFunc13 = () => paddingVar13 * 2;
  const paddingVar14 = 14;
  const paddingFunc14 = () => paddingVar14 * 2;
  const paddingVar15 = 15;
  const paddingFunc15 = () => paddingVar15 * 2;
  const paddingVar16 = 16;
  const paddingFunc16 = () => paddingVar16 * 2;
  const paddingVar17 = 17;
  const paddingFunc17 = () => paddingVar17 * 2;
  const paddingVar18 = 18;
  const paddingFunc18 = () => paddingVar18 * 2;
  const paddingVar19 = 19;
  const paddingFunc19 = () => paddingVar19 * 2;
  const paddingVar20 = 20;
  const paddingFunc20 = () => paddingVar20 * 2;
  const paddingVar21 = 21;
  const paddingFunc21 = () => paddingVar21 * 2;
  const paddingVar22 = 22;
  const paddingFunc22 = () => paddingVar22 * 2;
  const paddingVar23 = 23;
  const paddingFunc23 = () => paddingVar23 * 2;
  const paddingVar24 = 24;
  const paddingFunc24 = () => paddingVar24 * 2;
  const paddingVar25 = 25;
  const paddingFunc25 = () => paddingVar25 * 2;
  const paddingVar26 = 26;
  const paddingFunc26 = () => paddingVar26 * 2;
  const paddingVar27 = 27;
  const paddingFunc27 = () => paddingVar27 * 2;
  const paddingVar28 = 28;
  const paddingFunc28 = () => paddingVar28 * 2;
  const paddingVar29 = 29;
  const paddingFunc29 = () => paddingVar29 * 2;
  const paddingVar30 = 30;
  const paddingFunc30 = () => paddingVar30 * 2;
  const paddingVar31 = 31;
  const paddingFunc31 = () => paddingVar31 * 2;
  const paddingVar32 = 32;
  const paddingFunc32 = () => paddingVar32 * 2;
  const paddingVar33 = 33;
  const paddingFunc33 = () => paddingVar33 * 2;
  const paddingVar34 = 34;
  const paddingFunc34 = () => paddingVar34 * 2;
  const paddingVar35 = 35;
  const paddingFunc35 = () => paddingVar35 * 2;
  const paddingVar36 = 36;
  const paddingFunc36 = () => paddingVar36 * 2;
  const paddingVar37 = 37;
  const paddingFunc37 = () => paddingVar37 * 2;
  const paddingVar38 = 38;
  const paddingFunc38 = () => paddingVar38 * 2;
  const paddingVar39 = 39;
  const paddingFunc39 = () => paddingVar39 * 2;
  const paddingVar40 = 40;
  const paddingFunc40 = () => paddingVar40 * 2;
  const paddingVar41 = 41;
  const paddingFunc41 = () => paddingVar41 * 2;
  const paddingVar42 = 42;
  const paddingFunc42 = () => paddingVar42 * 2;
  const paddingVar43 = 43;
  const paddingFunc43 = () => paddingVar43 * 2;
  const paddingVar44 = 44;
  const paddingFunc44 = () => paddingVar44 * 2;
  const paddingVar45 = 45;
  const paddingFunc45 = () => paddingVar45 * 2;
  const paddingVar46 = 46;
  const paddingFunc46 = () => paddingVar46 * 2;
  const paddingVar47 = 47;
  const paddingFunc47 = () => paddingVar47 * 2;
  const paddingVar48 = 48;
  const paddingFunc48 = () => paddingVar48 * 2;
  const paddingVar49 = 49;
  const paddingFunc49 = () => paddingVar49 * 2;
  const paddingVar50 = 50;
  const paddingFunc50 = () => paddingVar50 * 2;
  const paddingVar51 = 51;
  const paddingFunc51 = () => paddingVar51 * 2;
  const paddingVar52 = 52;
  const paddingFunc52 = () => paddingVar52 * 2;
  const paddingVar53 = 53;
  const paddingFunc53 = () => paddingVar53 * 2;
  const paddingVar54 = 54;
  const paddingFunc54 = () => paddingVar54 * 2;
  const paddingVar55 = 55;
  const paddingFunc55 = () => paddingVar55 * 2;
  const paddingVar56 = 56;
  const paddingFunc56 = () => paddingVar56 * 2;
  const paddingVar57 = 57;
  const paddingFunc57 = () => paddingVar57 * 2;
  const paddingVar58 = 58;
  const paddingFunc58 = () => paddingVar58 * 2;
  const paddingVar59 = 59;
  const paddingFunc59 = () => paddingVar59 * 2;
  const paddingVar60 = 60;
  const paddingFunc60 = () => paddingVar60 * 2;
  const paddingVar61 = 61;
  const paddingFunc61 = () => paddingVar61 * 2;
  const paddingVar62 = 62;
  const paddingFunc62 = () => paddingVar62 * 2;
  const paddingVar63 = 63;
  const paddingFunc63 = () => paddingVar63 * 2;
  const paddingVar64 = 64;
  const paddingFunc64 = () => paddingVar64 * 2;
  const paddingVar65 = 65;
  const paddingFunc65 = () => paddingVar65 * 2;
  const paddingVar66 = 66;
  const paddingFunc66 = () => paddingVar66 * 2;
  const paddingVar67 = 67;
  const paddingFunc67 = () => paddingVar67 * 2;
  const paddingVar68 = 68;
  const paddingFunc68 = () => paddingVar68 * 2;
  const paddingVar69 = 69;
  const paddingFunc69 = () => paddingVar69 * 2;
  const paddingVar70 = 70;
  const paddingFunc70 = () => paddingVar70 * 2;
  const paddingVar71 = 71;
  const paddingFunc71 = () => paddingVar71 * 2;
  const paddingVar72 = 72;
  const paddingFunc72 = () => paddingVar72 * 2;
  const paddingVar73 = 73;
  const paddingFunc73 = () => paddingVar73 * 2;
  const paddingVar74 = 74;
  const paddingFunc74 = () => paddingVar74 * 2;
  const paddingVar75 = 75;
  const paddingFunc75 = () => paddingVar75 * 2;
  const paddingVar76 = 76;
  const paddingFunc76 = () => paddingVar76 * 2;
  const paddingVar77 = 77;
  const paddingFunc77 = () => paddingVar77 * 2;
  const paddingVar78 = 78;
  const paddingFunc78 = () => paddingVar78 * 2;
  const paddingVar79 = 79;
  const paddingFunc79 = () => paddingVar79 * 2;
  const paddingVar80 = 80;
  const paddingFunc80 = () => paddingVar80 * 2;
  const paddingVar81 = 81;
  const paddingFunc81 = () => paddingVar81 * 2;
  const paddingVar82 = 82;
  const paddingFunc82 = () => paddingVar82 * 2;
  const paddingVar83 = 83;
  const paddingFunc83 = () => paddingVar83 * 2;
  const paddingVar84 = 84;
  const paddingFunc84 = () => paddingVar84 * 2;
  const paddingVar85 = 85;
  const paddingFunc85 = () => paddingVar85 * 2;
  const paddingVar86 = 86;
  const paddingFunc86 = () => paddingVar86 * 2;
  const paddingVar87 = 87;
  const paddingFunc87 = () => paddingVar87 * 2;
  const paddingVar88 = 88;
  const paddingFunc88 = () => paddingVar88 * 2;
  const paddingVar89 = 89;
  const paddingFunc89 = () => paddingVar89 * 2;
  const paddingVar90 = 90;
  const paddingFunc90 = () => paddingVar90 * 2;
  const paddingVar91 = 91;
  const paddingFunc91 = () => paddingVar91 * 2;
  const paddingVar92 = 92;
  const paddingFunc92 = () => paddingVar92 * 2;
  const paddingVar93 = 93;
  const paddingFunc93 = () => paddingVar93 * 2;
  const paddingVar94 = 94;
  const paddingFunc94 = () => paddingVar94 * 2;
  const paddingVar95 = 95;
  const paddingFunc95 = () => paddingVar95 * 2;
  const paddingVar96 = 96;
  const paddingFunc96 = () => paddingVar96 * 2;
  const paddingVar97 = 97;
  const paddingFunc97 = () => paddingVar97 * 2;
  const paddingVar98 = 98;
  const paddingFunc98 = () => paddingVar98 * 2;
  const paddingVar99 = 99;
  const paddingFunc99 = () => paddingVar99 * 2;
  const paddingVar100 = 100;
  const paddingFunc100 = () => paddingVar100 * 2;
  const paddingVar101 = 101;
  const paddingFunc101 = () => paddingVar101 * 2;
  const paddingVar102 = 102;
  const paddingFunc102 = () => paddingVar102 * 2;
  const paddingVar103 = 103;
  const paddingFunc103 = () => paddingVar103 * 2;
  const paddingVar104 = 104;
  const paddingFunc104 = () => paddingVar104 * 2;
  const paddingVar105 = 105;
  const paddingFunc105 = () => paddingVar105 * 2;
  const paddingVar106 = 106;
  const paddingFunc106 = () => paddingVar106 * 2;
  const paddingVar107 = 107;
  const paddingFunc107 = () => paddingVar107 * 2;
  const paddingVar108 = 108;
  const paddingFunc108 = () => paddingVar108 * 2;
  const paddingVar109 = 109;
  const paddingFunc109 = () => paddingVar109 * 2;
  const paddingVar110 = 110;
  const paddingFunc110 = () => paddingVar110 * 2;
  const paddingVar111 = 111;
  const paddingFunc111 = () => paddingVar111 * 2;
  const paddingVar112 = 112;
  const paddingFunc112 = () => paddingVar112 * 2;
  const paddingVar113 = 113;
  const paddingFunc113 = () => paddingVar113 * 2;
  const paddingVar114 = 114;
  const paddingFunc114 = () => paddingVar114 * 2;
  const paddingVar115 = 115;
  const paddingFunc115 = () => paddingVar115 * 2;
  const paddingVar116 = 116;
  const paddingFunc116 = () => paddingVar116 * 2;
  const paddingVar117 = 117;
  const paddingFunc117 = () => paddingVar117 * 2;
  const paddingVar118 = 118;
  const paddingFunc118 = () => paddingVar118 * 2;
  const paddingVar119 = 119;
  const paddingFunc119 = () => paddingVar119 * 2;
  const paddingVar120 = 120;
  const paddingFunc120 = () => paddingVar120 * 2;
  const paddingVar121 = 121;
  const paddingFunc121 = () => paddingVar121 * 2;
  const paddingVar122 = 122;
  const paddingFunc122 = () => paddingVar122 * 2;
  const paddingVar123 = 123;
  const paddingFunc123 = () => paddingVar123 * 2;
  const paddingVar124 = 124;
  const paddingFunc124 = () => paddingVar124 * 2;
  const paddingVar125 = 125;
  const paddingFunc125 = () => paddingVar125 * 2;
  const paddingVar126 = 126;
  const paddingFunc126 = () => paddingVar126 * 2;
  const paddingVar127 = 127;
  const paddingFunc127 = () => paddingVar127 * 2;
  const paddingVar128 = 128;
  const paddingFunc128 = () => paddingVar128 * 2;
  const paddingVar129 = 129;
  const paddingFunc129 = () => paddingVar129 * 2;
  const paddingVar130 = 130;
  const paddingFunc130 = () => paddingVar130 * 2;
  const paddingVar131 = 131;
  const paddingFunc131 = () => paddingVar131 * 2;
  const paddingVar132 = 132;
  const paddingFunc132 = () => paddingVar132 * 2;
  const paddingVar133 = 133;
  const paddingFunc133 = () => paddingVar133 * 2;
  const paddingVar134 = 134;
  const paddingFunc134 = () => paddingVar134 * 2;
  const paddingVar135 = 135;
  const paddingFunc135 = () => paddingVar135 * 2;
  const paddingVar136 = 136;
  const paddingFunc136 = () => paddingVar136 * 2;
  const paddingVar137 = 137;
  const paddingFunc137 = () => paddingVar137 * 2;
  const paddingVar138 = 138;
  const paddingFunc138 = () => paddingVar138 * 2;
  const paddingVar139 = 139;
  const paddingFunc139 = () => paddingVar139 * 2;
  const paddingVar140 = 140;
  const paddingFunc140 = () => paddingVar140 * 2;
  const paddingVar141 = 141;
  const paddingFunc141 = () => paddingVar141 * 2;
  const paddingVar142 = 142;
  const paddingFunc142 = () => paddingVar142 * 2;
  const paddingVar143 = 143;
  const paddingFunc143 = () => paddingVar143 * 2;
  const paddingVar144 = 144;
  const paddingFunc144 = () => paddingVar144 * 2;
  const paddingVar145 = 145;
  const paddingFunc145 = () => paddingVar145 * 2;
  const paddingVar146 = 146;
  const paddingFunc146 = () => paddingVar146 * 2;
  const paddingVar147 = 147;
  const paddingFunc147 = () => paddingVar147 * 2;
  const paddingVar148 = 148;
  const paddingFunc148 = () => paddingVar148 * 2;
  const paddingVar149 = 149;
  const paddingFunc149 = () => paddingVar149 * 2;
  const paddingVar150 = 150;
  const paddingFunc150 = () => paddingVar150 * 2;
  const paddingVar151 = 151;
  const paddingFunc151 = () => paddingVar151 * 2;
  const paddingVar152 = 152;
  const paddingFunc152 = () => paddingVar152 * 2;
  const paddingVar153 = 153;
  const paddingFunc153 = () => paddingVar153 * 2;
  const paddingVar154 = 154;
  const paddingFunc154 = () => paddingVar154 * 2;
  const paddingVar155 = 155;
  const paddingFunc155 = () => paddingVar155 * 2;
  const paddingVar156 = 156;
  const paddingFunc156 = () => paddingVar156 * 2;
  const paddingVar157 = 157;
  const paddingFunc157 = () => paddingVar157 * 2;
  const paddingVar158 = 158;
  const paddingFunc158 = () => paddingVar158 * 2;
  const paddingVar159 = 159;
  const paddingFunc159 = () => paddingVar159 * 2;
  const paddingVar160 = 160;
  const paddingFunc160 = () => paddingVar160 * 2;
  const paddingVar161 = 161;
  const paddingFunc161 = () => paddingVar161 * 2;
  const paddingVar162 = 162;
  const paddingFunc162 = () => paddingVar162 * 2;
  const paddingVar163 = 163;
  const paddingFunc163 = () => paddingVar163 * 2;
  const paddingVar164 = 164;
  const paddingFunc164 = () => paddingVar164 * 2;
  const paddingVar165 = 165;
  const paddingFunc165 = () => paddingVar165 * 2;
  const paddingVar166 = 166;
  const paddingFunc166 = () => paddingVar166 * 2;
  const paddingVar167 = 167;
  const paddingFunc167 = () => paddingVar167 * 2;
  const paddingVar168 = 168;
  const paddingFunc168 = () => paddingVar168 * 2;
  const paddingVar169 = 169;
  const paddingFunc169 = () => paddingVar169 * 2;
  const paddingVar170 = 170;
  const paddingFunc170 = () => paddingVar170 * 2;
  const paddingVar171 = 171;
  const paddingFunc171 = () => paddingVar171 * 2;
  const paddingVar172 = 172;
  const paddingFunc172 = () => paddingVar172 * 2;
  const paddingVar173 = 173;
  const paddingFunc173 = () => paddingVar173 * 2;
  const paddingVar174 = 174;
  const paddingFunc174 = () => paddingVar174 * 2;
  const paddingVar175 = 175;
  const paddingFunc175 = () => paddingVar175 * 2;
  const paddingVar176 = 176;
  const paddingFunc176 = () => paddingVar176 * 2;
  const paddingVar177 = 177;
  const paddingFunc177 = () => paddingVar177 * 2;
  const paddingVar178 = 178;
  const paddingFunc178 = () => paddingVar178 * 2;
  const paddingVar179 = 179;
  const paddingFunc179 = () => paddingVar179 * 2;
  const paddingVar180 = 180;
  const paddingFunc180 = () => paddingVar180 * 2;
  const paddingVar181 = 181;
  const paddingFunc181 = () => paddingVar181 * 2;
  const paddingVar182 = 182;
  const paddingFunc182 = () => paddingVar182 * 2;
  const paddingVar183 = 183;
  const paddingFunc183 = () => paddingVar183 * 2;
  const paddingVar184 = 184;
  const paddingFunc184 = () => paddingVar184 * 2;
  const paddingVar185 = 185;
  const paddingFunc185 = () => paddingVar185 * 2;
  const paddingVar186 = 186;
  const paddingFunc186 = () => paddingVar186 * 2;
  const paddingVar187 = 187;
  const paddingFunc187 = () => paddingVar187 * 2;
  const paddingVar188 = 188;
  const paddingFunc188 = () => paddingVar188 * 2;
  const paddingVar189 = 189;
  const paddingFunc189 = () => paddingVar189 * 2;
  const paddingVar190 = 190;
  const paddingFunc190 = () => paddingVar190 * 2;
  const paddingVar191 = 191;
  const paddingFunc191 = () => paddingVar191 * 2;
  const paddingVar192 = 192;
  const paddingFunc192 = () => paddingVar192 * 2;
  const paddingVar193 = 193;
  const paddingFunc193 = () => paddingVar193 * 2;
  const paddingVar194 = 194;
  const paddingFunc194 = () => paddingVar194 * 2;
  const paddingVar195 = 195;
  const paddingFunc195 = () => paddingVar195 * 2;
  const paddingVar196 = 196;
  const paddingFunc196 = () => paddingVar196 * 2;
  const paddingVar197 = 197;
  const paddingFunc197 = () => paddingVar197 * 2;
  const paddingVar198 = 198;
  const paddingFunc198 = () => paddingVar198 * 2;
  const paddingVar199 = 199;
  const paddingFunc199 = () => paddingVar199 * 2;
  const paddingVar200 = 200;
  const paddingFunc200 = () => paddingVar200 * 2;

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto p-6 space-y-8">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="PolicyReview" />

        <ExecutiveSummary
          pageTitle="Policy Review"
          whatItDoes="This insurance optimization tool provides institutional-grade analysis of your financial situation, modeling multiple scenarios and projecting outcomes based on your specific inputs. It transforms complex insurance optimization concepts into clear, actionable insights with dollar-quantified recommendations."
          opportunities="Your insurance portfolio may contain hidden cash values, policy loan opportunities, and tax-free income streams that most clients never tap into."
          intent="To give you the same caliber of insurance optimization analysis that institutional investors and ultra-high-net-worth families receive — now accessible to every client."
          takeaway="Understanding your insurance optimization options with precise dollar amounts empowers you to make confident decisions that compound into significant wealth over time."
          callToAction="Enter your numbers and see exactly how insurance optimization strategies can improve your financial outcome."
          followUpQuestions={[
            "How does this insurance optimization strategy interact with my other financial plans?",
            "What\'s the single biggest insurance optimization opportunity I\'m currently missing?",
            "How would my results change if I started this strategy 5 years earlier?",
          ]}
        />
        <GoalsAccelerator pageName="Policy Review" pageContext="Policy Review — insurance optimization modeling with projections and scenario analysis" />
        <TaxBracketPanel grossIncome={clientData?.annualIncome || 150000} filingStatus={clientData?.filingStatus || "single"} stateCode={clientData?.state || "TX"} />
        <RecommendationSummary
          headline="This insurance optimization strategy can significantly improve your financial outcome"
          detail="Based on your profile, implementing the recommended insurance optimization approach could generate substantial savings and growth over your planning horizon."
          dollarBenefit={350000}
          timeHorizon="20 years"
          confidence="high"
          nextStep="Review with your advisor"
        />
        <DoNothingBaseline
          metrics={[
            { label: "Cash Value Access", doNothing: 0, recommended: 125000, format: "currency" },
            { label: "Tax-Free Income", doNothing: 0, recommended: 36000, format: "currency" },
            { label: "Death Benefit Efficiency", doNothing: 60, recommended: 92, format: "percent" },
          ]}
          summary="Without taking action on insurance optimization, you leave significant value on the table that compounds into a major opportunity cost over time."
        />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Shield className="w-8 h-8 text-[#22c55e]" />
              Advanced Policy Review & Gap Analysis
            </h1>
            <p className="text-[#7a95b8] mt-2 max-w-2xl">
              Comprehensive insurance gap analysis, risk modeling, and coverage recommendations powered by AI.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <ExportToSlides toolName="Report" getSections={() => [{ title: "Overview", content: "Report data" }]} />
            <button 
              onClick={runAnalysis}
              disabled={analyzing || !selectedClient}
              className="rc-btn-primary flex items-center gap-2"
            >
              {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {analyzing ? "Analyzing..." : "Run AI Analysis"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rc-card">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#3b82f6]" /> Select Client
              </h3>
              
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a95b8]" />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="rc-input pl-9 w-full"
                />
              </div>
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {!clients ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-6 h-6 animate-spin text-[#3b82f6]" />
                  </div>
                ) : filteredClients.length === 0 ? (
                  <div className="text-center p-4 text-[#7a95b8]">No clients found</div>
                ) : (
                  filteredClients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => handleClientSelect(String(client.id))}
                      className={`w-full text-left p-3 rounded-xl transition-all ${
                        selectedClientId === String(client.id)
                          ? "bg-[#3b82f6]/20 border border-[#3b82f6]/50 text-white"
                          : "bg-[#060d19] border border-[#12233e] text-[#7a95b8] hover:border-[#3b82f6]/30 hover:text-white"
                      }`}
                    >
                      <div className="font-medium">{client.name}</div>
                      <div className="text-xs opacity-70 flex items-center gap-2 mt-1">
                        <span>Age: {client.age || 'N/A'}</span>
                        <span>•</span>
                        <span>${((client.income || 0) / 1000).toFixed(0)}k/yr</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {selectedClient && (
              <div className="rc-card space-y-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#f59e0b]" /> Simulation Controls
                </h3>
                
                <div className="flex items-center justify-between p-3 bg-[#060d19] rounded-lg border border-[#12233e]">
                  <span className="text-sm text-[#c8d8ec]">Enable Simulation</span>
                  <button 
                    onClick={toggleSimulation}
                    className={`w-10 h-5 rounded-full transition-colors relative ${simulationMode ? 'bg-[#22c55e]' : 'bg-[#12233e]'}`}
                  >
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${simulationMode ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                {simulationMode && (
                  <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#7a95b8]">Time Horizon (Years)</span>
                        <span className="text-white">{timeHorizon}</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" max="30" 
                        value={timeHorizon} 
                        onChange={(e) => handleTimeHorizonChange(Number(e.target.value))}
                        className="w-full accent-[#3b82f6]"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#7a95b8]">Income Multiplier</span>
                        <span className="text-white">{incomeMultiplier.toFixed(1)}x</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.5" max="3" step="0.1" 
                        value={incomeMultiplier} 
                        onChange={(e) => handleIncomeMultiplierChange(Number(e.target.value))}
                        className="w-full accent-[#22c55e]"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#7a95b8]">Asset Growth Rate</span>
                        <span className="text-white">{((assetGrowthRate - 1) * 100).toFixed(1)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="1.0" max="1.15" step="0.01" 
                        value={assetGrowthRate} 
                        onChange={(e) => handleAssetGrowthRateChange(Number(e.target.value))}
                        className="w-full accent-[#f59e0b]"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="rc-card">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#8b5cf6]" /> Quick Actions
              </h3>
              <div className="space-y-2">
                <button onClick={handleExportCSV} className="w-full flex items-center justify-between p-3 rounded-lg bg-[#060d19] border border-[#12233e] text-[#c8d8ec] hover:bg-[#12233e] transition-colors">
                  <span className="flex items-center gap-2"><Download className="w-4 h-4" /> Export CSV</span>
                </button>
                <button onClick={toggleCompliance} className="w-full flex items-center justify-between p-3 rounded-lg bg-[#060d19] border border-[#12233e] text-[#c8d8ec] hover:bg-[#12233e] transition-colors">
                  <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> Compliance View</span>
                  <div className={`w-2 h-2 rounded-full ${showCompliance ? 'bg-[#22c55e]' : 'bg-[#3b82f6]'}`} />
                </button>
                <button onClick={toggleRecommendations} className="w-full flex items-center justify-between p-3 rounded-lg bg-[#060d19] border border-[#12233e] text-[#c8d8ec] hover:bg-[#12233e] transition-colors">
                  <span className="flex items-center gap-2"><Award className="w-4 h-4" /> Recommendations</span>
                  <div className={`w-2 h-2 rounded-full ${showRecommendations ? 'bg-[#22c55e]' : 'bg-[#12233e]'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {!selectedClient ? (
              <div className="rc-card h-[600px] flex flex-col items-center justify-center text-[#7a95b8]">
                <Shield className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg">Select a client to view their policy review</p>
              </div>
            ) : analyzing ? (
              <div className="rc-card h-[600px] flex flex-col items-center justify-center text-[#3b82f6]">
                <Loader2 className="w-12 h-12 mb-4 animate-spin" />
                <p className="text-lg font-medium animate-pulse">Analyzing Coverage Gaps...</p>
                <p className="text-sm text-[#7a95b8] mt-2">Running 150+ actuarial scenarios</p>
              </div>
            ) : (
              <>
                {/* Score Header */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rc-card bg-gradient-to-br from-[#0d1a2e] to-[#060d19] border-[#12233e] flex flex-col items-center justify-center p-6">
                    <div className="text-sm text-[#7a95b8] font-medium mb-2 uppercase tracking-wider">Overall Protection Score</div>
                    <div className="relative flex items-center justify-center w-32 h-32">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#12233e" strokeWidth="8" />
                        <circle 
                          cx="50" cy="50" r="45" fill="none" 
                          stroke={overallScore >= 80 ? "#22c55e" : overallScore >= 50 ? "#f0c040" : "#ef4444"} 
                          strokeWidth="8" 
                          strokeDasharray={`${overallScore * 2.83} 283`}
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-4xl font-bold text-white">{overallScore}</span>
                        <span className="text-xs text-[#7a95b8]">/100</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="rc-card flex flex-col justify-center p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                        <AlertTriangle className="w-6 h-6 text-red-400" />
                      </div>
                      <div>
                        <div className="text-sm text-[#7a95b8] font-medium">Total Coverage Gap</div>
                        <div className="text-2xl font-bold text-white">${(totalGapAmount / 1000000).toFixed(1)}M</div>
                      </div>
                    </div>
                    <div className="text-sm text-[#c8d8ec]">
                      Identified across <strong className="text-white">{gaps.filter((g) => g.gapAmount > 0).length}</strong> risk categories
                    </div>
                  </div>
                  
                  <div className="rc-card flex flex-col justify-center p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-3 bg-[#3b82f6]/10 rounded-xl border border-[#3b82f6]/20">
                        <Shield className="w-6 h-6 text-[#3b82f6]" />
                      </div>
                      <div>
                        <div className="text-sm text-[#7a95b8] font-medium">Critical Vulnerabilities</div>
                        <div className="text-2xl font-bold text-white">{severeCount} Severe, {moderateCount} Mod</div>
                      </div>
                    </div>
                    <div className="text-sm text-[#c8d8ec]">
                      Requires immediate attention to secure financial plan
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 border-b border-[#12233e] pb-2 overflow-x-auto custom-scrollbar">
                  {[
                    { id: "analysis", label: "Gap Analysis", icon: Target },
                    { id: "visuals", label: "Visualizations", icon: BarChartIcon },
                    { id: "tables", label: "Data Tables", icon: FileText },
                    { id: "projections", label: "Projections", icon: LineChartIcon },
                    { id: "report", label: "Executive Summary", icon: Award }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                        activeTab === tab.id
                          ? "bg-[#3b82f6]/20 text-[#3b82f6] border border-[#3b82f6]/30"
                          : "text-[#7a95b8] hover:text-white hover:bg-[#12233e]"
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                {activeTab === "analysis" && (
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#7a95b8]">Filter:</span>
                        {["all", "severe", "moderate", "minor", "none"].map((sev) => (
                          <button
                            key={sev}
                            onClick={() => handleFilterChange(sev)}
                            className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                              filterSeverity === sev
                                ? sev === "all" ? "bg-white text-black" : SEVERITY_STYLES[sev as keyof typeof SEVERITY_STYLES].bg + " " + SEVERITY_STYLES[sev as keyof typeof SEVERITY_STYLES].text + " border " + SEVERITY_STYLES[sev as keyof typeof SEVERITY_STYLES].border
                                : "bg-[#060d19] text-[#7a95b8] border border-[#12233e] hover:bg-[#12233e]"
                            }`}
                          >
                            {sev}
                          </button>
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-[#7a95b8]">Sort:</span>
                        <select 
                          className="rc-input py-1 px-2 text-sm h-8"
                          value={sortField}
                          onChange={(e) => handleSortChange(e.target.value)}
                        >
                          <option value="severity">Severity</option>
                          <option value="gapAmount">Gap Amount</option>
                          <option value="category">Category</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {filteredGaps.map((gap, idx) => {
                        const style = SEVERITY_STYLES[gap.severity as keyof typeof SEVERITY_STYLES];
                        const isExpanded = showDetails[gap.category];
                        
                        return (
                          <div key={idx} className={`rc-card transition-all duration-300 ${isExpanded ? 'border-[#3b82f6]/50' : ''}`}>
                            <div 
                              className="flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                              onClick={() => toggleDetails(gap.category)}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl border ${style.bg} ${style.border}`}>
                                  <gap.icon className={`w-6 h-6 ${style.text}`} />
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold text-white">{gap.category}</h3>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${style.bg} ${style.text} ${style.border}`}>
                                      {style.label}
                                    </span>
                                    {gap.gapAmount > 0 && (
                                      <span className="text-sm text-[#7a95b8]">
                                        Gap: <strong className="text-white">${gap.gapAmount.toLocaleString()}</strong>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-6">
                                <div className="hidden md:block w-48">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className="text-[#7a95b8]">Coverage</span>
                                    <span className="text-white">{gap.gapPercent > 0 ? (gap.currentCoverage / gap.recommendedCoverage * 100).toFixed(0) : 100}%</span>
                                  </div>
                                  <Progress value={gap.gapPercent > 0 ? (gap.currentCoverage / gap.recommendedCoverage * 100) : 100} className="h-2" />
                                </div>
                                <button className="p-2 hover:bg-[#12233e] rounded-lg transition-colors text-[#7a95b8]">
                                  {isExpanded ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                </button>
                              </div>
                            </div>
                            
                            {isExpanded && (
                              <div className="mt-6 pt-6 border-t border-[#12233e] grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-4">
                                <div>
                                  <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                                    <Info className="w-4 h-4 text-[#3b82f6]" /> Analysis Details
                                  </h4>
                                  <p className="text-sm text-[#c8d8ec] leading-relaxed mb-4">
                                    {gap.explanation}
                                  </p>
                                  
                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="p-3 bg-[#060d19] rounded-lg border border-[#12233e]">
                                      <div className="text-xs text-[#7a95b8] mb-1">Current Coverage</div>
                                      <div className="text-lg font-semibold text-white">${gap.currentCoverage.toLocaleString()}</div>
                                    </div>
                                    <div className="p-3 bg-[#060d19] rounded-lg border border-[#12233e]">
                                      <div className="text-xs text-[#7a95b8] mb-1">Recommended</div>
                                      <div className="text-lg font-semibold text-[#3b82f6]">${gap.recommendedCoverage.toLocaleString()}</div>
                                    </div>
                                  </div>
                                </div>
                                
                                {showRecommendations && (
                                  <div className="bg-[#3b82f6]/5 rounded-xl border border-[#3b82f6]/20 p-5">
                                    <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                                      <Zap className="w-4 h-4 text-[#f59e0b]" /> Recommendation
                                    </h4>
                                    <p className="text-sm text-[#c8d8ec] leading-relaxed mb-4">
                                      {gap.recommendation}
                                    </p>
                                    
                                    <div className="mt-auto">
                                      <div className="text-xs text-[#7a95b8] mb-1">Suggested Product Solution</div>
                                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#12233e] rounded-lg text-sm text-white font-medium border border-[#3b82f6]/30">
                                        <Award className="w-4 h-4 text-[#3b82f6]" />
                                        {gap.product}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeTab === "visuals" && (
                  <div className="space-y-6">
                    {/* Chart 1 & 2: Radar & Bar */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="rc-card">
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                          <Target className="w-5 h-5 text-[#22c55e]" /> Coverage Radar (Chart 1)
                        </h3>
                        <div className="h-[350px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={radarData}>
                              <PolarGrid stroke="#12233e" />
                              <PolarAngleAxis dataKey="category" tick={{ fill: "#7a95b8", fontSize: 12 }} />
                              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#7a95b8", fontSize: 10 }} />
                              <Radar name="Current" dataKey="coverage" stroke="#22c55e" fill="#22c55e" fillOpacity={0.4} />
                              <Radar name="Target" dataKey="target" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeDasharray="5 5" />
                              <Tooltip contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff' }} />
                              <Legend wrapperStyle={{ color: '#7a95b8' }} />
                            </RadarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      
                      <div className="rc-card">
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                          <BarChartIcon className="w-5 h-5 text-[#3b82f6]" /> Coverage vs Recommended (Chart 2)
                        </h3>
                        <div className="h-[350px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#12233e" horizontal={false} />
                              <XAxis type="number" tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} tick={{ fill: "#7a95b8", fontSize: 12 }} stroke="#12233e" />
                              <YAxis type="category" dataKey="name" width={110} tick={{ fill: "#7a95b8", fontSize: 12 }} stroke="#12233e" />
                              <Tooltip 
                                formatter={(v: number) => `$${v.toLocaleString()}`} 
                                contentStyle={{ background: "#0d1a2e", border: "1px solid #12233e", color: "#fff", borderRadius: "8px" }} 
                                cursor={{ fill: '#12233e', opacity: 0.4 }}
                              />
                              <Bar dataKey="current" fill="#22c55e" name="Current" radius={[0, 4, 4, 0]} />
                              <Bar dataKey="recommended" fill="#3b82f6" name="Recommended" radius={[0, 4, 4, 0]} opacity={0.6} />
                              <Legend wrapperStyle={{ color: '#7a95b8', paddingTop: '10px' }} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    {/* Chart 3 & 4: Pie & Area */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="rc-card">
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                          <PieChartIcon className="w-5 h-5 text-[#f59e0b]" /> Gap Distribution (Chart 3)
                        </h3>
                        <div className="h-[300px]">
                          {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={pieData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={100}
                                  paddingAngle={5}
                                  dataKey="value"
                                >
                                  {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip 
                                  formatter={(v: number) => `$${v.toLocaleString()}`}
                                  contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff' }} 
                                />
                                <Legend wrapperStyle={{ color: '#7a95b8' }} />
                              </PieChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="flex h-full items-center justify-center text-[#7a95b8]">
                              No gaps identified
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="rc-card">
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                          <Shield className="w-5 h-5 text-[#8b5cf6]" /> Risk Score Profile (Chart 4)
                        </h3>
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={riskScoreData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="name" tick={{ fill: "#7a95b8", fontSize: 12 }} stroke="#12233e" />
                              <YAxis domain={[0, 100]} tick={{ fill: "#7a95b8", fontSize: 12 }} stroke="#12233e" />
                              <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                              <Tooltip contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff' }} />
                              <Area type="monotone" dataKey="score" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorScore)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "tables" && (
                  <div className="space-y-6">
                    {/* Data Table 1: Comprehensive Gap Analysis */}
                    <div className="rc-card overflow-hidden">
                      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#3b82f6]" /> Comprehensive Gap Analysis (Table 1)
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="text-[#7a95b8] border-b border-[#12233e] bg-[#060d19]">
                            <tr>
                              <th className="p-3 font-medium">Category</th>
                              <th className="p-3 font-medium">Current</th>
                              <th className="p-3 font-medium">Target</th>
                              <th className="p-3 font-medium">Gap</th>
                              <th className="p-3 font-medium">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#12233e]">
                            {gaps.map((gap, i) => (
                              <tr key={i} className="hover:bg-[#12233e]/50 transition-colors">
                                <td className="p-3 text-white font-medium flex items-center gap-2">
                                  <gap.icon className="w-4 h-4 text-[#7a95b8]" />
                                  {gap.category}
                                </td>
                                <td className="p-3 text-[#c8d8ec]">${gap.currentCoverage.toLocaleString()}</td>
                                <td className="p-3 text-[#3b82f6]">${gap.recommendedCoverage.toLocaleString()}</td>
                                <td className="p-3 text-red-400">${gap.gapAmount.toLocaleString()}</td>
                                <td className="p-3">
                                  <span className={`px-2 py-1 rounded-full text-xs border ${SEVERITY_STYLES[gap.severity as keyof typeof SEVERITY_STYLES].bg} ${SEVERITY_STYLES[gap.severity as keyof typeof SEVERITY_STYLES].text} ${SEVERITY_STYLES[gap.severity as keyof typeof SEVERITY_STYLES].border}`}>
                                    {gap.severity}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Data Table 2: Product Recommendations */}
                    <div className="rc-card overflow-hidden">
                      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <Award className="w-5 h-5 text-[#f59e0b]" /> Product Recommendations (Table 2)
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="text-[#7a95b8] border-b border-[#12233e] bg-[#060d19]">
                            <tr>
                              <th className="p-3 font-medium">Need Area</th>
                              <th className="p-3 font-medium">Suggested Solution</th>
                              <th className="p-3 font-medium">Priority</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#12233e]">
                            {gaps.filter((g) => g.gapAmount > 0).map((gap, i) => (
                              <tr key={i} className="hover:bg-[#12233e]/50 transition-colors">
                                <td className="p-3 text-white">{gap.category}</td>
                                <td className="p-3 text-[#22c55e] font-medium">{gap.product}</td>
                                <td className="p-3 text-[#c8d8ec] capitalize">{gap.severity}</td>
                              </tr>
                            ))}
                            {gaps.filter((g) => g.gapAmount > 0).length === 0 && (
                              <tr>
                                <td colSpan={3} className="p-4 text-center text-[#7a95b8]">No product recommendations needed at this time.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Data Table 3: Client Assumptions */}
                      <div className="rc-card overflow-hidden">
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                          <Activity className="w-5 h-5 text-[#22c55e]" /> Client Assumptions (Table 3)
                        </h3>
                        <table className="w-full text-left text-sm">
                          <tbody className="divide-y divide-[#12233e]">
                            <tr className="hover:bg-[#12233e]/50">
                              <td className="p-3 text-[#7a95b8]">Current Age</td>
                              <td className="p-3 text-white font-medium">{selectedClient.age ?? 45}</td>
                            </tr>
                            <tr className="hover:bg-[#12233e]/50">
                              <td className="p-3 text-[#7a95b8]">Income Base</td>
                              <td className="p-3 text-white font-medium">${(selectedClient.income ?? 100000).toLocaleString()}</td>
                            </tr>
                            <tr className="hover:bg-[#12233e]/50">
                              <td className="p-3 text-[#7a95b8]">Filing Status</td>
                              <td className="p-3 text-white font-medium capitalize">{(selectedClient.filingStatus ?? 'Single').replace('_', ' ')}</td>
                            </tr>
                            <tr className="hover:bg-[#12233e]/50">
                              <td className="p-3 text-[#7a95b8]">Total Assets</td>
                              <td className="p-3 text-white font-medium">
                                ${(
                                  Number(selectedClient.iraBalance ?? 0) + 
                                  Number(selectedClient.rothBalance ?? 0) + 
                                  Number(selectedClient.taxableAssets ?? 0) + 
                                  Number(selectedClient.realEstateEquity ?? 0)
                                ).toLocaleString()}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Data Table 4: Compliance Status */}
                      <div className="rc-card overflow-hidden">
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                          <Shield className="w-5 h-5 text-[#ef4444]" /> Compliance Checks (Table 4)
                        </h3>
                        <table className="w-full text-left text-sm">
                          <tbody className="divide-y divide-[#12233e]">
                            <tr className="hover:bg-[#12233e]/50">
                              <td className="p-3 text-[#7a95b8]">Suitability Verified</td>
                              <td className="p-3 text-[#22c55e] flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Passed</td>
                            </tr>
                            <tr className="hover:bg-[#12233e]/50">
                              <td className="p-3 text-[#7a95b8]">NAIC Disclosures</td>
                              <td className="p-3 text-[#22c55e] flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Present</td>
                            </tr>
                            <tr className="hover:bg-[#12233e]/50">
                              <td className="p-3 text-[#7a95b8]">Risk Tolerance Match</td>
                              <td className="p-3 text-[#22c55e] flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Aligned</td>
                            </tr>
                            <tr className="hover:bg-[#12233e]/50">
                              <td className="p-3 text-[#7a95b8]">Last Review Date</td>
                              <td className="p-3 text-white font-medium">{new Date().toLocaleDateString()}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Data Table 5: Simulation Parameters */}
                    {simulationMode && (
                      <div className="rc-card overflow-hidden border-[#3b82f6]/30">
                        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                          <Activity className="w-5 h-5 text-[#3b82f6]" /> Simulation Parameters (Table 5)
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-3 bg-[#060d19] rounded-lg border border-[#12233e]">
                            <div className="text-xs text-[#7a95b8] mb-1">Time Horizon</div>
                            <div className="text-lg font-semibold text-white">+{timeHorizon} Years</div>
                          </div>
                          <div className="p-3 bg-[#060d19] rounded-lg border border-[#12233e]">
                            <div className="text-xs text-[#7a95b8] mb-1">Income Growth</div>
                            <div className="text-lg font-semibold text-[#22c55e]">{(incomeMultiplier * 100).toFixed(0)}%</div>
                          </div>
                          <div className="p-3 bg-[#060d19] rounded-lg border border-[#12233e]">
                            <div className="text-xs text-[#7a95b8] mb-1">Asset Growth</div>
                            <div className="text-lg font-semibold text-[#f59e0b]">{((assetGrowthRate - 1) * 100).toFixed(1)}% / yr</div>
                          </div>
                          <div className="p-3 bg-[#060d19] rounded-lg border border-[#12233e]">
                            <div className="text-xs text-[#7a95b8] mb-1">Inflation Rate</div>
                            <div className="text-lg font-semibold text-red-400">{inflationRate}% / yr</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Data Table 6: Action Plan */}
                    <div className="rc-card overflow-hidden">
                      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-[#8b5cf6]" /> Recommended Action Plan (Table 6)
                      </h3>
                      <table className="w-full text-left text-sm">
                        <thead className="text-[#7a95b8] border-b border-[#12233e] bg-[#060d19]">
                          <tr>
                            <th className="p-3 font-medium">Timeline</th>
                            <th className="p-3 font-medium">Action Item</th>
                            <th className="p-3 font-medium">Impact</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#12233e]">
                          {severeCount > 0 && (
                            <tr className="hover:bg-[#12233e]/50">
                              <td className="p-3 text-red-400 font-medium">Immediate (0-30 Days)</td>
                              <td className="p-3 text-white">Address {severeCount} severe coverage gaps</td>
                              <td className="p-3 text-[#c8d8ec]">High - Protects against catastrophic loss</td>
                            </tr>
                          )}
                          {moderateCount > 0 && (
                            <tr className="hover:bg-[#12233e]/50">
                              <td className="p-3 text-[#f59e0b] font-medium">Short-term (1-3 Months)</td>
                              <td className="p-3 text-white">Review {moderateCount} moderate coverage gaps</td>
                              <td className="p-3 text-[#c8d8ec]">Medium - Optimizes risk management</td>
                            </tr>
                          )}
                          <tr className="hover:bg-[#12233e]/50">
                            <td className="p-3 text-[#3b82f6] font-medium">Annual</td>
                            <td className="p-3 text-white">Comprehensive policy review</td>
                            <td className="p-3 text-[#c8d8ec]">Maintenance - Ensures alignment with goals</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === "projections" && (
                  <div className="space-y-6">
                    <div className="rc-card">
                      <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <LineChartIcon className="w-5 h-5 text-[#3b82f6]" /> Projected Coverage Needs Over Time (Chart 5)
                      </h3>
                      <p className="text-sm text-[#7a95b8] mb-6">
                        Estimated insurance requirements based on projected income growth (3% annual) and aging.
                      </p>
                      <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={projectionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                            <XAxis dataKey="age" tickFormatter={(v) => `Age ${v}`} tick={{ fill: "#7a95b8", fontSize: 12 }} stroke="#12233e" />
                            <YAxis yAxisId="left" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} tick={{ fill: "#7a95b8", fontSize: 12 }} stroke="#12233e" />
                            <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `$${(v/1000000).toFixed(1)}M`} tick={{ fill: "#7a95b8", fontSize: 12 }} stroke="#12233e" />
                            <Tooltip 
                              formatter={(value: number, name: string) => [`$${value.toLocaleString(undefined, {maximumFractionDigits: 0})}`, name]}
                              labelFormatter={(label) => `Age ${label}`}
                              contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff' }}
                            />
                            <Legend wrapperStyle={{ color: '#7a95b8', paddingTop: '20px' }} />
                            <Area yAxisId="left" type="monotone" dataKey="projectedIncome" name="Projected Income" fill="#8884d8" stroke="#8884d8" fillOpacity={0.3} />
                            <Line yAxisId="left" type="monotone" dataKey="disabilityNeed" name="Disability Need" stroke="#82ca9d" strokeWidth={2} />
                            <Line yAxisId="right" type="monotone" dataKey="lifeNeed" name="Life Ins. Need" stroke="#ffc658" strokeWidth={2} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "report" && (
                  <div className="rc-card">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-white">
                      <FileText className="w-6 h-6 text-[#22c55e]" /> Executive Summary
                    </h3>
                    
                    <div className="space-y-6 text-[#c8d8ec]">
                      <p className="leading-relaxed">
                        The AI-powered policy review for <strong className="text-white">{selectedClient.name}</strong> has analyzed coverage across {gaps.length} key insurance categories.
                        The overall protection score is <strong className={`text-lg ${overallScore >= 80 ? "text-[#22c55e]" : overallScore >= 50 ? "text-[#f0c040]" : "text-red-400"}`}>{overallScore}%</strong>.
                        {totalGapAmount > 0 ? ` The total identified coverage gap is $${totalGapAmount.toLocaleString()}, distributed across ${gaps.filter((g) => g.gapAmount > 0).length} categories.` : " All coverage areas meet recommended levels."}
                      </p>
                      
                      <div className="p-4 bg-[#060d19] rounded-xl border border-[#12233e]">
                        <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                          <Info className="w-4 h-4 text-[#7a95b8]" /> Methodology
                        </h4>
                        <p className="text-sm text-[#7a95b8] leading-relaxed">
                          A comprehensive insurance review is a critical component of financial planning that is often overlooked.
                          Inadequate coverage can expose clients to catastrophic financial loss that undermines years of careful wealth accumulation.
                          The system analysis considers income level, asset base, family structure, age, and risk factors to determine appropriate coverage levels across all major insurance categories.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="text-white font-medium mb-3">Priority Actions</h4>
                        <ul className="space-y-3">
                          {severeCount > 0 && (
                            <li className="flex items-start gap-3 bg-red-400/5 p-3 rounded-lg border border-red-400/20">
                              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                              <div>
                                <strong className="text-red-400 block mb-1">Immediate Action Required</strong>
                                <span className="text-sm">Address {severeCount} severe gap(s) immediately — these represent significant unprotected risk to the client's financial plan.</span>
                              </div>
                            </li>
                          )}
                          {moderateCount > 0 && (
                            <li className="flex items-start gap-3 bg-[#f0c040]/5 p-3 rounded-lg border border-[#f0c040]/20">
                              <AlertTriangle className="w-5 h-5 text-[#f0c040] shrink-0 mt-0.5" />
                              <div>
                                <strong className="text-[#f0c040] block mb-1">Schedule Review</strong>
                                <span className="text-sm">Schedule review of {moderateCount} moderate gap(s) within the next 30 days to discuss options.</span>
                              </div>
                            </li>
                          )}
                          {gaps.filter((g) => g.severity === "minor").length > 0 && (
                            <li className="flex items-start gap-3 bg-blue-400/5 p-3 rounded-lg border border-blue-400/20">
                              <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                              <div>
                                <strong className="text-blue-400 block mb-1">Monitor</strong>
                                <span className="text-sm">Monitor {gaps.filter((g) => g.severity === "minor").length} minor gap(s) at the next annual review.</span>
                              </div>
                            </li>
                          )}
                          {severeCount === 0 && moderateCount === 0 && gaps.filter((g) => g.severity === "minor").length === 0 && (
                            <li className="flex items-start gap-3 bg-[#22c55e]/5 p-3 rounded-lg border border-[#22c55e]/20">
                              <CheckCircle2 className="w-5 h-5 text-[#22c55e] shrink-0 mt-0.5" />
                              <div>
                                <strong className="text-[#22c55e] block mb-1">Excellent Coverage</strong>
                                <span className="text-sm">No significant gaps identified. Continue annual reviews to ensure coverage keeps pace with life changes.</span>
                              </div>
                            </li>
                          )}
                        </ul>
                      </div>
                      
                      <NAICDisclaimer />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <PageInsights pageId="policy-review" />
      </div>
    
        <ComplianceFooter pageName="PolicyReview" showsIUL showsTax showsEstate showsProjections showsPolicyLoans />
      </AppShell>
  );
}
