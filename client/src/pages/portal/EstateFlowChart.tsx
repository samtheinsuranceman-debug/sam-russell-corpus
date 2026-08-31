// @ts-nocheck
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { NumberInput } from "@/components/NumberInput";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import {
  ArrowDown,
  ArrowRight,
  Building2,
  Home,
  Landmark,
  Shield,
  Users,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Heart,
  PieChart as PieChartIcon,
  BarChart3,
  Activity,
  Briefcase,
  Scale,
  Info,
  Plus,
  Trash2,
} from "lucide-react";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import { ExportToSlides } from "@/components/ExportToSlides";
import {
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, Legend, ResponsiveContainer
} from "recharts";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

interface AssetNode {
  id: string;
  label: string;
  value: number;
  type: "asset" | "entity" | "beneficiary" | "tax" | "trust" | "charity";
  icon: React.ReactNode;
  color: string;
}

interface FlowEdge {
  from: string;
  to: string;
  label: string;
  value: number;
  taxable: boolean;
}

interface StrategyInfo {
  id: string;
  title: string;
  description: string;
  impact: number;
  complexity: "Low" | "Medium" | "High";
  setupCost: number;
  annualCost: number;
  active: boolean;
}

interface Beneficiary {
  id: string;
  name: string;
  relation: string;
  percentage: number;
  amount: number;
  age: number;
  needsProtection: boolean;
}

interface Charity {
  id: string;
  name: string;
  type: string;
  amount: number;
  recurring: boolean;
}

const fmt = (n: number) => {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(2)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
};

const fmtPct = (n: number) => `${n.toFixed(1)}%`;

function FlowNode({ node, selected, onClick }: { node: AssetNode; selected: boolean; onClick: () => void }) {
  const bgColors: Record<string, string> = {
    asset: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
    entity: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
    beneficiary: "from-green-500/20 to-green-600/10 border-green-500/30",
    tax: "from-red-500/20 to-red-600/10 border-red-500/30",
    trust: "from-amber-500/20 to-amber-600/10 border-amber-500/30",
    charity: "from-pink-500/20 to-pink-600/10 border-pink-500/30",
  };

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-xl bg-gradient-to-br border transition-all text-left w-full ${bgColors[node.type] || bgColors.asset} ${
        selected ? "ring-2 ring-primary shadow-lg scale-105" : "hover:scale-102"
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        {node.icon}
        <span className="font-semibold text-sm truncate">{node.label}</span>
      </div>
      <div className="text-xl font-bold">{fmt(node.value)}</div>
      <Badge variant="outline" className="text-[10px] mt-1">{node.type}</Badge>
    </button>
  );
}

function FlowArrow({ label, value, taxable, direction = "down" }: { label: string; value: number; taxable: boolean; direction?: "down" | "right" | "left" | "up" }) {
  const Icon = direction === "down" ? ArrowDown : direction === "right" ? ArrowRight : direction === "left" ? ArrowRight : ArrowDown;
  const rotation = direction === "left" ? "rotate-180" : direction === "up" ? "rotate-180" : "";
  
  return (
    <div className={`flex items-center gap-1 ${direction === "down" || direction === "up" ? "flex-col py-2" : "flex-row px-2"}`}>
      {direction === "down" || direction === "up" ? (
        <Icon className={`h-5 w-5 ${rotation} ${taxable ? "text-red-400" : "text-green-400"}`} />
      ) : (
        <Icon className={`h-5 w-5 ${rotation} ${taxable ? "text-red-400" : "text-green-400"}`} />
      )}
      <div className="text-xs text-center">
        <div className="font-medium">{label}</div>
        <div className={taxable ? "text-red-400" : "text-green-400"}>{fmt(value)}</div>
      </div>
    </div>
  );
}

export default function EstateFlowChart() {
  const { user } = useAuth();
  const { data: clientData } = useClientData();

  const { data: strategiesData } = trpc.strategy.list.useQuery(undefined, { enabled: !!user });
  const { data: scenariosData } = trpc.scenarios.list.useQuery(undefined, { enabled: !!user });
  const { data: marketData } = trpc.marketData.getLatest.useQuery(undefined, { enabled: !!user });
  const { data: goalsData } = trpc.goals.list.useQuery(undefined, { enabled: !!user });
  const { data: complianceData } = trpc.complianceAlerts.list.useQuery(undefined, { enabled: !!user });
  const { data: riskData } = trpc.riskScoring.scores.useQuery(undefined, { enabled: !!user });

  const [grossEstate, setGrossEstate] = useState(12000000);
  const [primaryHome, setPrimaryHome] = useState(2500000);
  const [investmentAccounts, setInvestmentAccounts] = useState(3500000);
  const [retirementAccounts, setRetirementAccounts] = useState(2000000);
  const [businessInterests, setBusinessInterests] = useState(2000000);
  const [lifeInsurance, setLifeInsurance] = useState(2000000);
  const [realEstate, setRealEstate] = useState(0);
  const [cashEquivalents, setCashEquivalents] = useState(500000);
  const [collectibles, setCollectibles] = useState(0);
  const [cryptoAssets, setCryptoAssets] = useState(0);
  
  const [hasILIT, setHasILIT] = useState(true);
  const [hasRevocableTrust, setHasRevocableTrust] = useState(true);
  const [hasBypassTrust, setHasBypassTrust] = useState(false);
  const [hasQPRT, setHasQPRT] = useState(false);
  const [hasCharitableTrust, setHasCharitableTrust] = useState(false);
  const [hasGRAT, setHasGRAT] = useState(false);
  const [hasFLP, setHasFLP] = useState(false);
  const [hasSLAT, setHasSLAT] = useState(false);
  const [hasCRT, setHasCRT] = useState(false);
  const [hasCLT, setHasCLT] = useState(false);
  
  const [charitablePercent, setCharitablePercent] = useState(10);
  const [numBeneficiaries, setNumBeneficiaries] = useState(3);
  const [filingStatus, setFilingStatus] = useState<"single" | "married">("married");
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [growthRate, setGrowthRate] = useState(5.0);
  const [inflationRate, setInflationRate] = useState(2.5);
  const [projectionYears, setProjectionYears] = useState(10);
  const [activeTab, setActiveTab] = useState("overview");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [discountRate, setDiscountRate] = useState(4.0);
  const [stateTaxRate, setStateTaxRate] = useState(0);
  const [includeStateTax, setIncludeStateTax] = useState(false);
  const [simulationMode, setSimulationMode] = useState<"deterministic" | "monte_carlo">("deterministic");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);

  const [beneficiariesList, setBeneficiariesList] = useState<Beneficiary[]>([
    { id: "1", name: "John Doe Jr", relation: "Son", percentage: 33.3, amount: 0, age: 35, needsProtection: false },
    { id: "2", name: "Jane Doe", relation: "Daughter", percentage: 33.3, amount: 0, age: 32, needsProtection: false },
    { id: "3", name: "Jimmy Doe", relation: "Son", percentage: 33.4, amount: 0, age: 28, needsProtection: true },
  ]);

  const [charitiesList, setCharitiesList] = useState<Charity[]>([
    { id: "1", name: "Local University", type: "Education", amount: 500000, recurring: true },
    { id: "2", name: "Children's Hospital", type: "Healthcare", amount: 250000, recurring: false },
  ]);

  useEffect(() => {
    if (!clientData) return;
    setPrimaryHome(clientData.homeValue || 2500000);
    setRetirementAccounts((clientData.iraBalance || 0) + (clientData.rothBalance || 0) + (clientData.k401Balance || 0) || 2000000);
    setLifeInsurance(clientData.lifeInsuranceDb || 2000000);
    setInvestmentAccounts(clientData.taxableInvestments || 3500000);
    setCashEquivalents(clientData.cashSavings || 500000);
    
    const total = (clientData.homeValue || 0) + 
                  (clientData.taxableInvestments || 0) + 
                  (clientData.iraBalance || 0) + 
                  (clientData.rothBalance || 0) + 
                  (clientData.k401Balance || 0) +
                  (clientData.lifeInsuranceDb || 0) + 
                  (clientData.cashSavings || 0);
    if (total > 0) setGrossEstate(total);
  }, [clientData]);

  const handleNodeClick = useCallback((id: string) => {
    setSelectedNode(id === selectedNode ? null : id);
  }, [selectedNode]);

  const handleSimulate = useCallback(() => {
    setIsSimulating(true);
    setSimulationProgress(0);
    
    const interval = setInterval(() => {
      setSimulationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSimulating(false);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, []);

  const handleAddBeneficiary = useCallback(() => {
    const newId = Date.now().toString();
    setBeneficiariesList(prev => [
      ...prev,
      { id: newId, name: `Beneficiary ${prev.length + 1}`, relation: "Other", percentage: 0, amount: 0, age: 25, needsProtection: false }
    ]);
    setNumBeneficiaries(prev => prev + 1);
  }, []);

  const handleRemoveBeneficiary = useCallback((id: string) => {
    setBeneficiariesList(prev => prev.filter((b) => b.id !== id));
    setNumBeneficiaries(prev => Math.max(1, prev - 1));
  }, []);

  const handleUpdateBeneficiary = useCallback((id: string, field: keyof Beneficiary, value: any) => {
    setBeneficiariesList(prev => prev.map((b) => b.id === id ? { ...b, [field]: value } : b));
  }, []);

  const exemption2024 = filingStatus === "married" ? 27220000 : 13610000;
  const exemption2026 = filingStatus === "married" ? 14000000 : 7000000;
  
  const stateExemption = 5000000; // Example state exemption
  const maxStateRate = 0.16;

  const analysis = useMemo(() => {
    const totalEstate = primaryHome + investmentAccounts + retirementAccounts + businessInterests + lifeInsurance + realEstate + cashEquivalents + collectibles + cryptoAssets;
    
    const iliProtected = hasILIT ? lifeInsurance : 0;
    const qprtReduction = hasQPRT ? Math.round(primaryHome * 0.35) : 0;
    const flpDiscount = hasFLP ? Math.round((businessInterests + realEstate) * 0.30) : 0;
    const gratReduction = hasGRAT ? Math.round(businessInterests * 0.20) : 0;
    const slatReduction = hasSLAT ? Math.round(investmentAccounts * 0.50) : 0;
    
    let charitableDeduction = 0;
    if (hasCharitableTrust || hasCRT || hasCLT) {
      charitableDeduction = Math.round(totalEstate * (charitablePercent / 100));
    } else {
      charitableDeduction = charitiesList.reduce((sum, c) => sum + c.amount, 0);
    }

    const totalReductions = iliProtected + qprtReduction + flpDiscount + gratReduction + slatReduction + charitableDeduction;
    const taxableEstate = Math.max(0, totalEstate - totalReductions);
    
    const bypassAmount = hasBypassTrust ? Math.min(exemption2026, taxableEstate) : 0;

    const netTaxableEstate2024 = Math.max(0, taxableEstate - exemption2024);
    const federalEstateTax2024 = Math.round(netTaxableEstate2024 * 0.40);
    
    const netTaxableEstate2026 = Math.max(0, taxableEstate - exemption2026);
    const federalEstateTax2026 = Math.round(netTaxableEstate2026 * 0.40);

    let stateEstateTax = 0;
    if (includeStateTax) {
      const stateTaxable = Math.max(0, totalEstate - stateExemption - charitableDeduction);
      stateEstateTax = Math.round(stateTaxable * (stateTaxRate > 0 ? stateTaxRate / 100 : maxStateRate));
    }

    const totalTax2024 = federalEstateTax2024 + stateEstateTax;
    const totalTax2026 = federalEstateTax2026 + stateEstateTax;

    const toBeneficiaries2024 = totalEstate - totalTax2024 - charitableDeduction;
    const toBeneficiaries2026 = totalEstate - totalTax2026 - charitableDeduction;

    const perBeneficiary2024 = Math.round(toBeneficiaries2024 / Math.max(1, beneficiariesList.length));
    const perBeneficiary2026 = Math.round(toBeneficiaries2026 / Math.max(1, beneficiariesList.length));

    const updatedBeneficiaries2024 = beneficiariesList.map((b) => ({
      ...b,
      amount: Math.round(toBeneficiaries2024 * (b.percentage / 100))
    }));

    const updatedBeneficiaries2026 = beneficiariesList.map((b) => ({
      ...b,
      amount: Math.round(toBeneficiaries2026 * (b.percentage / 100))
    }));

    return {
      totalEstate, iliProtected, taxableEstate, charitableDeduction, bypassAmount, qprtReduction, flpDiscount, gratReduction, slatReduction, totalReductions,
      netTaxableEstate2024, netTaxableEstate2026, 
      federalEstateTax2024, federalEstateTax2026, stateEstateTax, totalTax2024, totalTax2026,
      toBeneficiaries2024, toBeneficiaries2026, perBeneficiary2024, perBeneficiary2026,
      updatedBeneficiaries2024, updatedBeneficiaries2026
    };
  }, [
    primaryHome, investmentAccounts, retirementAccounts, businessInterests, lifeInsurance, realEstate, cashEquivalents, collectibles, cryptoAssets,
    hasILIT, hasRevocableTrust, hasBypassTrust, hasQPRT, hasCharitableTrust, hasGRAT, hasFLP, hasSLAT, hasCRT, hasCLT,
    charitablePercent, charitiesList, beneficiariesList, filingStatus, exemption2024, exemption2026, includeStateTax, stateTaxRate
  ]);

  const projectionData = useMemo(() => {
    const data = [];
    let currentEstate = analysis.totalEstate;
    let currentExemption2024 = exemption2024;
    let currentExemption2026 = exemption2026;
    
    for (let year = 0; year <= projectionYears; year++) {
      const actualYear = new Date().getFullYear() + year;
      
      const estateValue = currentEstate * Math.pow(1 + growthRate / 100, year);
      
      let currentExemption = actualYear < 2026 ? currentExemption2024 : currentExemption2026;
      currentExemption = currentExemption * Math.pow(1 + inflationRate / 100, year);
      
      const taxable = Math.max(0, estateValue - analysis.totalReductions * Math.pow(1 + growthRate / 100, year));
      const netTaxable = Math.max(0, taxable - currentExemption);
      const tax = netTaxable * 0.40;
      const toHeirs = estateValue - tax - (analysis.charitableDeduction * Math.pow(1 + growthRate / 100, year));
      
      data.push({
        year: actualYear,
        estateValue: Math.round(estateValue),
        exemption: Math.round(currentExemption),
        tax: Math.round(tax),
        toHeirs: Math.round(toHeirs)
      });
    }
    return data;
  }, [analysis.totalEstate, analysis.totalReductions, analysis.charitableDeduction, exemption2024, exemption2026, growthRate, inflationRate, projectionYears]);

  const assetCompositionData = [{ name: "Primary Home", value: primaryHome, fill: "#3b82f6" },
,
    { name: "Investments", value: investmentAccounts, fill: "#8b5cf6" },
,
    { name: "Retirement", value: retirementAccounts, fill: "#10b981" },
,
    { name: "Business", value: businessInterests, fill: "#f59e0b" },
,
    { name: "Life Insurance", value: lifeInsurance, fill: "#ef4444" }
];

  const waterfallData = [{ name: "Gross Estate", value: analysis.totalEstate, isTotal: true },
,
    { name: "ILIT Protection", value: -analysis.iliProtected },
,
    { name: "Charitable", value: -analysis.charitableDeduction },
,
    { name: "QPRT Discount", value: -analysis.qprtReduction },
,
    { name: "FLP Discount", value: -analysis.flpDiscount }
];

  let runningTotal = 0;
  const processedWaterfallData = waterfallData.map((item, index) => {
    if (item.isTotal) {
      runningTotal = item.value;
      return {
        name: item.name,
        start: 0,
        end: item.value,
        val: item.value,
        fill: item.name === "To Heirs" ? "#10b981" : item.name === "Estate Tax" || item.name === "Net Taxable" ? "#ef4444" : "#3b82f6"
      };
    } else {
      const start = runningTotal;
      runningTotal += item.value;
      return {
        name: item.name,
        start: start,
        end: runningTotal,
        val: item.value,
        fill: item.value < 0 ? "#f59e0b" : "#10b981"
      };
    }
  });

  const getExportSections = useCallback(() => {
    return [
      {
        title: "Estate Composition",
        items: [
          { label: "Primary Home", value: fmt(primaryHome) },
          { label: "Investment Accounts", value: fmt(investmentAccounts) },
          { label: "Retirement Accounts", value: fmt(retirementAccounts) },
          { label: "Business Interests", value: fmt(businessInterests) },
          { label: "Life Insurance", value: fmt(lifeInsurance) },
          { label: "Other Assets", value: fmt(realEstate + cashEquivalents + collectibles + cryptoAssets) },
          { label: "Total Gross Estate", value: fmt(analysis.totalEstate) },
        ]
      },
      {
        title: "Tax Analysis (2024 Current Law)",
        items: [
          { label: "Taxable Estate", value: fmt(analysis.taxableEstate) },
          { label: "Exemption Available", value: fmt(exemption2024) },
          { label: "Net Taxable Estate", value: fmt(analysis.netTaxableEstate2024) },
          { label: "Federal Estate Tax", value: fmt(analysis.federalEstateTax2024) },
          { label: "State Estate Tax", value: fmt(analysis.stateEstateTax) },
          { label: "Total Tax Liability", value: fmt(analysis.totalTax2024) },
          { label: "To Beneficiaries", value: fmt(analysis.toBeneficiaries2024) },
        ]
      },
      {
        title: "Tax Analysis (2026 Sunset)",
        items: [
          { label: "Taxable Estate", value: fmt(analysis.taxableEstate) },
          { label: "Exemption Available", value: fmt(exemption2026) },
          { label: "Net Taxable Estate", value: fmt(analysis.netTaxableEstate2026) },
          { label: "Federal Estate Tax", value: fmt(analysis.federalEstateTax2026) },
          { label: "State Estate Tax", value: fmt(analysis.stateEstateTax) },
          { label: "Total Tax Liability", value: fmt(analysis.totalTax2026) },
          { label: "To Beneficiaries", value: fmt(analysis.toBeneficiaries2026) },
        ]
      },
      {
        title: "Strategy Impact",
        items: [
          { label: "Total Reductions", value: fmt(analysis.totalReductions) },
          { label: "Tax Savings (vs No Planning)", value: fmt(Math.round(analysis.totalReductions * 0.4)) },
          { label: "ILIT Protected", value: fmt(analysis.iliProtected) },
          { label: "Charitable Giving", value: fmt(analysis.charitableDeduction) },
          { label: "Valuation Discounts", value: fmt(analysis.flpDiscount + analysis.qprtReduction) },
        ]
      }
    ];
  }, [analysis, primaryHome, investmentAccounts, retirementAccounts, businessInterests, lifeInsurance, realEstate, cashEquivalents, collectibles, cryptoAssets, exemption2024, exemption2026]);

  return (
    <AppShell>
      <div className="space-y-6 p-6 max-w-7xl mx-auto">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="EstateFlowChart" />

        <ExecutiveSummary
          pageTitle="Estate Flow Chart"
          whatItDoes="This estate planning tool provides institutional-grade analysis of your financial situation, modeling multiple scenarios and projecting outcomes based on your specific inputs. It transforms complex estate planning concepts into clear, actionable insights with dollar-quantified recommendations."
          opportunities="Without proper estate planning, your heirs could lose 40% or more of your wealth to estate taxes and probate costs. Strategic planning can preserve nearly all of it."
          intent="To give you the same caliber of estate planning analysis that institutional investors and ultra-high-net-worth families receive — now accessible to every client."
          takeaway="Understanding your estate planning options with precise dollar amounts empowers you to make confident decisions that compound into significant wealth over time."
          callToAction="Enter your numbers and see exactly how estate planning strategies can improve your financial outcome."
          followUpQuestions={[
            "How does this estate planning strategy interact with my other financial plans?",
            "What\'s the single biggest estate planning opportunity I\'m currently missing?",
            "How would my results change if I started this strategy 5 years earlier?",
          ]}
        />
        <GoalsAccelerator pageName="Estate Flow Chart" pageContext="Estate Flow Chart — estate planning modeling with projections and scenario analysis" />
        <TaxBracketPanel grossIncome={clientData?.annualIncome || 150000} filingStatus={clientData?.filingStatus || "single"} stateCode={clientData?.state || "TX"} />
        <RecommendationSummary
          headline="This estate planning strategy can significantly improve your financial outcome"
          detail="Based on your profile, implementing the recommended estate planning approach could generate substantial savings and growth over your planning horizon."
          dollarBenefit={800000}
          timeHorizon="20 years"
          confidence="high"
          nextStep="Review with your advisor"
        />
        <DoNothingBaseline
          metrics={[
            { label: "Estate Tax Exposure", doNothing: 500000, recommended: 50000, format: "currency", higherIsBetter: false },
            { label: "Wealth Transferred", doNothing: 1500000, recommended: 2300000, format: "currency" },
            { label: "Probate Avoidance", doNothing: 0, recommended: 95, format: "percent" },
          ]}
          summary="Without taking action on estate planning, you leave significant value on the table that compounds into a major opportunity cost over time."
        />
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-2xl border shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Advanced Estate Architecture</h1>
                <p className="text-muted-foreground mt-1 text-lg">
                  Comprehensive modeling for high-net-worth wealth transfer and tax mitigation
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="px-3 py-1.5 text-sm font-medium">
              <Activity className="w-4 h-4 mr-2 text-primary" />
              Live Modeling
            </Badge>
            <ExportToSlides
              toolName="Advanced Estate Architecture"
              getSections={getExportSections}
            />
          </div>
        </div>

        {/* Main Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-6 h-auto p-1 bg-muted/50 rounded-xl">
            <TabsTrigger value="overview" className="py-3 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <PieChartIcon className="w-4 h-4 mr-2" /> Overview
            </TabsTrigger>
            <TabsTrigger value="assets" className="py-3 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Wallet className="w-4 h-4 mr-2" /> Assets
            </TabsTrigger>
            <TabsTrigger value="flow" className="py-3 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <ArrowRight className="w-4 h-4 mr-2" /> Flow Chart
            </TabsTrigger>
            <TabsTrigger value="taxes" className="py-3 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Scale className="w-4 h-4 mr-2" /> Tax Impact
            </TabsTrigger>
            <TabsTrigger value="strategies" className="py-3 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Shield className="w-4 h-4 mr-2" /> Strategies
            </TabsTrigger>
            <TabsTrigger value="projections" className="py-3 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <TrendingUp className="w-4 h-4 mr-2" /> Projections
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-blue-600/80 dark:text-blue-400/80 mb-1">Gross Estate Value</p>
                      <h3 className="text-3xl font-bold text-blue-700 dark:text-blue-300">{fmt(analysis.totalEstate)}</h3>
                    </div>
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Landmark className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <TrendingUp className="w-4 h-4 mr-1 text-blue-500" />
                    <span className="text-blue-600 dark:text-blue-400 font-medium">Top 1% bracket</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-purple-600/80 dark:text-purple-400/80 mb-1">Protected Assets</p>
                      <h3 className="text-3xl font-bold text-purple-700 dark:text-purple-300">{fmt(analysis.totalReductions)}</h3>
                    </div>
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <span className="text-purple-600 dark:text-purple-400 font-medium">{fmtPct((analysis.totalReductions / analysis.totalEstate) * 100)} of gross estate</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-red-600/80 dark:text-red-400/80 mb-1">Est. Tax Liability (2026)</p>
                      <h3 className="text-3xl font-bold text-red-700 dark:text-red-300">{fmt(analysis.totalTax2026)}</h3>
                    </div>
                    <div className="p-2 bg-red-500/20 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <ArrowDown className="w-4 h-4 mr-1 text-red-500" />
                    <span className="text-red-600 dark:text-red-400 font-medium">Requires liquidity planning</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-green-600/80 dark:text-green-400/80 mb-1">To Beneficiaries (2026)</p>
                      <h3 className="text-3xl font-bold text-green-700 dark:text-green-300">{fmt(analysis.toBeneficiaries2026)}</h3>
                    </div>
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm">
                    <CheckCircle2 className="w-4 h-4 mr-1 text-green-500" />
                    <span className="text-green-600 dark:text-green-400 font-medium">{fmt(analysis.perBeneficiary2026)} per heir</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1: Asset Composition (Pie) */}
              <Card className="border shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 text-primary" />
                    Asset Composition
                  </CardTitle>
                  <CardDescription>Breakdown of gross estate value by asset class</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={assetCompositionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={110}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {assetCompositionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <RTooltip 
                          formatter={(value: number) => fmt(value)}
                          contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)' }}
                        />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Chart 2: Tax Distribution Comparison (Bar) */}
              <Card className="border shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Distribution: 2024 vs 2026
                  </CardTitle>
                  <CardDescription>Impact of the TCJA sunset on estate distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { 
                            name: '2024 (Current Law)', 
                            'To Beneficiaries': analysis.toBeneficiaries2024,
                            'Federal Tax': analysis.federalEstateTax2024,
                            'State Tax': analysis.stateEstateTax,
                            'Charity': analysis.charitableDeduction
                          },
                          { 
                            name: '2026 (Post-Sunset)', 
                            'To Beneficiaries': analysis.toBeneficiaries2026,
                            'Federal Tax': analysis.federalEstateTax2026,
                            'State Tax': analysis.stateEstateTax,
                            'Charity': analysis.charitableDeduction
                          }
                        ]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="name" tick={{ fill: 'var(--foreground)' }} />
                        <YAxis tickFormatter={(val) => `$${(val/1000000).toFixed(0)}M`} tick={{ fill: 'var(--foreground)' }} />
                        <RTooltip 
                          formatter={(value: number) => fmt(value)}
                          contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)' }}
                        />
                        <Legend />
                        <Bar dataKey="To Beneficiaries" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                        <Bar dataKey="Charity" stackId="a" fill="#ec4899" />
                        <Bar dataKey="State Tax" stackId="a" fill="#f97316" />
                        <Bar dataKey="Federal Tax" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Table 1: Beneficiary Summary */}
            <Card className="border shadow-sm">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      Beneficiary Summary
                    </CardTitle>
                    <CardDescription>Projected inheritance per beneficiary based on 2026 sunset</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab("assets")}>
                    Edit Beneficiaries
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Name</TableHead>
                        <TableHead>Relation</TableHead>
                        <TableHead className="text-right">Allocation</TableHead>
                        <TableHead className="text-right">Projected Amount (2024)</TableHead>
                        <TableHead className="text-right">Projected Amount (2026)</TableHead>
                        <TableHead className="text-center">Protection Needed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analysis.updatedBeneficiaries2026.map((b, i) => (
                        <TableRow key={b.id}>
                          <TableCell className="font-medium">{b.name}</TableCell>
                          <TableCell>{b.relation}</TableCell>
                          <TableCell className="text-right">{b.percentage}%</TableCell>
                          <TableCell className="text-right text-green-600 dark:text-green-400 font-medium">
                            {fmt(analysis.updatedBeneficiaries2024[i].amount)}
                          </TableCell>
                          <TableCell className="text-right text-amber-600 dark:text-amber-400 font-medium">
                            {fmt(b.amount)}
                          </TableCell>
                          <TableCell className="text-center">
                            {b.needsProtection ? (
                              <Badge variant="destructive" className="text-[10px]">Yes</Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px]">No</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ASSETS TAB */}
          <TabsContent value="assets" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="border shadow-sm">
                  <CardHeader>
                    <CardTitle>Estate Assets & Liabilities</CardTitle>
                    <CardDescription>Detailed input of all assets subject to estate tax</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2 text-muted-foreground border-b pb-2">
                          <Home className="w-4 h-4" /> Real Property
                        </h4>
                        <div className="space-y-2">
                          <Label>Primary Residence</Label>
                          <NumberInput value={primaryHome} onChange={setPrimaryHome} min={0} step={100000} />
                        </div>
                        <div className="space-y-2">
                          <Label>Other Real Estate</Label>
                          <NumberInput value={realEstate} onChange={setRealEstate} min={0} step={100000} />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2 text-muted-foreground border-b pb-2">
                          <Wallet className="w-4 h-4" /> Liquid Assets
                        </h4>
                        <div className="space-y-2">
                          <Label>Investment Accounts (Taxable)</Label>
                          <NumberInput value={investmentAccounts} onChange={setInvestmentAccounts} min={0} step={100000} />
                        </div>
                        <div className="space-y-2">
                          <Label>Cash & Equivalents</Label>
                          <NumberInput value={cashEquivalents} onChange={setCashEquivalents} min={0} step={50000} />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2 text-muted-foreground border-b pb-2">
                          <Briefcase className="w-4 h-4" /> Retirement & Business
                        </h4>
                        <div className="space-y-2">
                          <Label>Retirement Accounts (IRA/401k)</Label>
                          <NumberInput value={retirementAccounts} onChange={setRetirementAccounts} min={0} step={100000} />
                        </div>
                        <div className="space-y-2">
                          <Label>Business Interests</Label>
                          <NumberInput value={businessInterests} onChange={setBusinessInterests} min={0} step={100000} />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2 text-muted-foreground border-b pb-2">
                          <Shield className="w-4 h-4" /> Other Assets
                        </h4>
                        <div className="space-y-2">
                          <Label>Life Insurance (Death Benefit)</Label>
                          <NumberInput value={lifeInsurance} onChange={setLifeInsurance} min={0} step={100000} />
                        </div>
                        <div className="space-y-2">
                          <Label>Collectibles & Crypto</Label>
                          <NumberInput value={collectibles + cryptoAssets} onChange={(val) => setCollectibles(val)} min={0} step={50000} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border shadow-sm">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Beneficiaries</CardTitle>
                        <CardDescription>Individuals inheriting the estate</CardDescription>
                      </div>
                      <Button onClick={handleAddBeneficiary} size="sm" className="gap-1">
                        <Plus className="w-4 h-4" /> Add
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {beneficiariesList.map((b, i) => (
                        <div key={b.id} className="p-4 border rounded-xl bg-card flex flex-col md:flex-row gap-4 items-start md:items-center">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
                            <div className="space-y-1">
                              <Label className="text-xs">Name</Label>
                              <Input value={b.name} onChange={(e) => handleUpdateBeneficiary(b.id, 'name', e.target.value)} />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Relation</Label>
                              <Select value={b.relation} onValueChange={(val) => handleUpdateBeneficiary(b.id, 'relation', val)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Spouse">Spouse</SelectItem>
                                  <SelectItem value="Son">Son</SelectItem>
                                  <SelectItem value="Daughter">Daughter</SelectItem>
                                  <SelectItem value="Grandchild">Grandchild</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Allocation (%)</Label>
                              <NumberInput value={b.percentage} onChange={(val) => handleUpdateBeneficiary(b.id, 'percentage', val)} min={0} max={100} />
                            </div>
                            <div className="space-y-1 flex items-center h-full pt-5">
                              <div className="flex items-center space-x-2">
                                <Switch 
                                  checked={b.needsProtection} 
                                  onCheckedChange={(val) => handleUpdateBeneficiary(b.id, 'needsProtection', val)} 
                                  id={`protect-${b.id}`}
                                />
                                <Label htmlFor={`protect-${b.id}`} className="text-xs cursor-pointer">Trust Protection</Label>
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleRemoveBeneficiary(b.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      
                      {/* Validation Warning */}
                      {beneficiariesList.reduce((sum, b) => sum + b.percentage, 0) !== 100 && (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-2 text-amber-600 dark:text-amber-400 text-sm">
                          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                          <p>Total allocation is {beneficiariesList.reduce((sum, b) => sum + b.percentage, 0)}%. It should equal 100%.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="border shadow-sm bg-muted/30">
                  <CardHeader>
                    <CardTitle>Estate Parameters</CardTitle>
                    <CardDescription>Global settings affecting calculations</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <Label className="flex justify-between">
                        <span>Filing Status</span>
                      </Label>
                      <Select value={filingStatus} onValueChange={(val: "single" | "married") => setFilingStatus(val)}>
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single">Single</SelectItem>
                          <SelectItem value="married">Married Filing Jointly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Include State Estate Tax</Label>
                        <Switch checked={includeStateTax} onCheckedChange={setIncludeStateTax} />
                      </div>
                      {includeStateTax && (
                        <div className="p-3 bg-background border rounded-lg space-y-3 mt-2">
                          <div className="space-y-1">
                            <Label className="text-xs">State Top Marginal Rate (%)</Label>
                            <NumberInput value={stateTaxRate} onChange={setStateTaxRate} min={0} max={20} step={0.1} />
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            Assuming standard state exemption of $5M for calculation purposes.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t space-y-4">
                      <div className="p-4 rounded-xl bg-card border shadow-sm text-center space-y-1">
                        <div className="text-sm font-medium text-muted-foreground">Total Gross Estate</div>
                        <div className="text-3xl font-bold text-primary">{fmt(analysis.totalEstate)}</div>
                      </div>
                      
                      <div className="p-4 rounded-xl bg-card border shadow-sm text-center space-y-1">
                        <div className="text-sm font-medium text-muted-foreground">Current Exemption (2024)</div>
                        <div className="text-2xl font-bold">{fmt(exemption2024)}</div>
                      </div>
                      
                      <div className="p-4 rounded-xl bg-card border shadow-sm text-center space-y-1">
                        <div className="text-sm font-medium text-muted-foreground">Projected Exemption (2026)</div>
                        <div className="text-2xl font-bold text-amber-500">{fmt(exemption2026)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* FLOW CHART TAB */}
          <TabsContent value="flow" className="space-y-6 mt-6">
            <Card className="border shadow-sm">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Wealth Transfer Architecture</CardTitle>
                    <CardDescription>Visual mapping of asset flow to entities and beneficiaries</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">Assets</Badge>
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">Trusts</Badge>
                    <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">Taxes</Badge>
                    <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">Heirs</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative min-h-[600px] bg-muted/10 rounded-xl border p-8 overflow-x-auto">
                  <div className="min-w-[800px] flex flex-col items-center gap-6">
                    
                    {/* Level 1: Gross Estate */}
                    <div className="w-64">
                      <FlowNode 
                        node={{ id: "gross", label: "Gross Estate", value: analysis.totalEstate, type: "asset", icon: <Building2 className="w-4 h-4" />, color: "blue" }}
                        selected={selectedNode === "gross"}
                        onClick={() => handleNodeClick("gross")}
                      />
                    </div>

                    <FlowArrow label="Transfers" value={analysis.totalEstate} taxable={false} />

                    {/* Level 2: Entity Structures */}
                    <div className="flex justify-center gap-8 w-full px-4">
                      {hasILIT && (
                        <div className="w-48 flex flex-col items-center">
                          <FlowNode 
                            node={{ id: "ilit", label: "ILIT", value: lifeInsurance, type: "trust", icon: <Shield className="w-4 h-4" />, color: "amber" }}
                            selected={selectedNode === "ilit"}
                            onClick={() => handleNodeClick("ilit")}
                          />
                          <FlowArrow label="Tax-Free" value={lifeInsurance} taxable={false} />
                        </div>
                      )}
                      
                      {hasQPRT && (
                        <div className="w-48 flex flex-col items-center">
                          <FlowNode 
                            node={{ id: "qprt", label: "QPRT", value: primaryHome, type: "trust", icon: <Home className="w-4 h-4" />, color: "amber" }}
                            selected={selectedNode === "qprt"}
                            onClick={() => handleNodeClick("qprt")}
                          />
                          <FlowArrow label="Discounted" value={primaryHome - analysis.qprtReduction} taxable={false} />
                        </div>
                      )}

                      {hasCharitableTrust && (
                        <div className="w-48 flex flex-col items-center">
                          <FlowNode 
                            node={{ id: "crt", label: "Charitable Trust", value: analysis.charitableDeduction, type: "charity", icon: <Heart className="w-4 h-4" />, color: "pink" }}
                            selected={selectedNode === "crt"}
                            onClick={() => handleNodeClick("crt")}
                          />
                          <FlowArrow label="Deduction" value={analysis.charitableDeduction} taxable={false} />
                        </div>
                      )}

                      <div className="w-64 flex flex-col items-center">
                        <FlowNode 
                          node={{ id: "taxable", label: "Taxable Estate", value: analysis.taxableEstate, type: "asset", icon: <Scale className="w-4 h-4" />, color: "blue" }}
                          selected={selectedNode === "taxable"}
                          onClick={() => handleNodeClick("taxable")}
                        />
                        <FlowArrow label="Subject to Tax" value={analysis.taxableEstate} taxable={true} />
                      </div>
                    </div>

                    {/* Level 3: Tax Calculation */}
                    <div className="flex justify-end w-full max-w-4xl pr-12 gap-8">
                      <div className="w-48 flex flex-col items-center">
                        <FlowNode 
                          node={{ id: "tax2026", label: "Estate Tax (2026)", value: analysis.totalTax2026, type: "tax", icon: <Landmark className="w-4 h-4" />, color: "red" }}
                          selected={selectedNode === "tax2026"}
                          onClick={() => handleNodeClick("tax2026")}
                        />
                      </div>
                      
                      <div className="w-64 flex flex-col items-center">
                        <FlowNode 
                          node={{ id: "net", label: "Net to Heirs", value: analysis.toBeneficiaries2026, type: "asset", icon: <Wallet className="w-4 h-4" />, color: "green" }}
                          selected={selectedNode === "net"}
                          onClick={() => handleNodeClick("net")}
                        />
                        <FlowArrow label="Distributions" value={analysis.toBeneficiaries2026} taxable={false} />
                      </div>
                    </div>

                    {/* Level 4: Beneficiaries */}
                    <div className="flex justify-center flex-wrap gap-4 w-full max-w-5xl mt-4 border-t border-dashed pt-8 relative">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-background px-4 text-sm font-medium text-muted-foreground">
                        Beneficiary Distributions
                      </div>
                      
                      {beneficiariesList.map((b) => (
                        <div key={b.id} className="w-48">
                          <FlowNode 
                            node={{ 
                              id: `ben-${b.id}`, 
                              label: b.name, 
                              value: b.amount, 
                              type: b.needsProtection ? "trust" : "beneficiary", 
                              icon: b.needsProtection ? <Shield className="w-4 h-4" /> : <Users className="w-4 h-4" />, 
                              color: b.needsProtection ? "amber" : "green" 
                            }}
                            selected={selectedNode === `ben-${b.id}`}
                            onClick={() => handleNodeClick(`ben-${b.id}`)}
                          />
                        </div>
                      ))}
                    </div>

                  </div>
                </div>

                {/* Node Details Panel */}
                {selectedNode && (
                  <div className="mt-6 p-4 rounded-xl border bg-card shadow-sm animate-in slide-in-from-bottom-2">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Info className="w-5 h-5 text-primary" />
                        Node Details
                      </h3>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedNode(null)}>Close</Button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {selectedNode === "gross" && "The total fair market value of all assets owned at death, before any deductions or exemptions."}
                      {selectedNode === "taxable" && "The gross estate minus allowable deductions (debts, administration expenses, marital deduction, charitable deduction)."}
                      {selectedNode === "ilit" && "Irrevocable Life Insurance Trust. Removes the death benefit from the taxable estate while providing liquidity."}
                      {selectedNode === "tax2026" && "Estimated federal and state estate tax liability based on the 2026 exemption sunset rules."}
                      {selectedNode.startsWith("ben-") && "Final distribution amount projected for this beneficiary after all taxes and deductions."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAX IMPACT TAB */}
          <TabsContent value="taxes" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Waterfall Chart */}
              <Card className="border shadow-sm lg:col-span-2">
                <CardHeader>
                  <CardTitle>Estate Value Waterfall (2026)</CardTitle>
                  <CardDescription>Step-by-step reduction from Gross Estate to Beneficiaries</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={processedWaterfallData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="name" tick={{ fill: 'var(--foreground)', fontSize: 12 }} angle={-45} textAnchor="end" />
                        <YAxis tickFormatter={(val) => `$${(val/1000000).toFixed(1)}M`} tick={{ fill: 'var(--foreground)' }} />
                        <RTooltip 
                          formatter={(value: number, name: string, props: any) => [fmt(props.payload.val), "Amount"]}
                          contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)' }}
                        />
                        <Bar dataKey="end" fill="transparent" stackId="a" />
                        <Bar dataKey="val" stackId="a">
                          {processedWaterfallData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* 2024 Breakdown */}
              <Card className="border-green-500/20 shadow-sm">
                <CardHeader className="pb-4">
                  <Badge className="w-fit mb-2 bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20">Current Law</Badge>
                  <CardTitle className="text-xl">2024 Exemption</CardTitle>
                  <CardDescription>Exemption amount: {fmt(exemption2024)}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between p-3 rounded-lg bg-card border">
                    <span className="text-muted-foreground">Gross Estate</span><span className="font-bold">{fmt(analysis.totalEstate)}</span>
                  </div>
                  <div className="flex justify-between p-3 rounded-lg bg-card border">
                    <span className="text-muted-foreground">Total Deductions</span><span className="font-bold text-green-500">-{fmt(analysis.totalReductions)}</span>
                  </div>
                  <div className="flex justify-between p-3 rounded-lg bg-card border">
                    <span className="text-muted-foreground">Taxable Estate</span><span className="font-bold">{fmt(analysis.taxableEstate)}</span>
                  </div>
                  <div className="flex justify-between p-3 rounded-lg bg-card border">
                    <span className="text-muted-foreground">Exemption Applied</span><span className="font-bold text-green-500">-{fmt(Math.min(analysis.taxableEstate, exemption2024))}</span>
                  </div>
                  <div className="flex justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                    <span className="font-semibold">Net Taxable Estate</span><span className="font-bold text-red-500">{fmt(analysis.netTaxableEstate2024)}</span>
                  </div>
                  <div className="flex justify-between p-4 rounded-xl bg-red-500/10 border border-red-500/20 mt-4">
                    <span className="font-bold text-lg">Total Tax Liability</span>
                    <span className="font-bold text-lg text-red-500">{fmt(analysis.totalTax2024)}</span>
                  </div>
                  <div className="flex justify-between p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                    <span className="font-bold">To Beneficiaries</span>
                    <span className="font-bold text-green-600 dark:text-green-400">{fmt(analysis.toBeneficiaries2024)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* 2026 Breakdown */}
              <Card className="border-red-500/20 shadow-sm">
                <CardHeader className="pb-4">
                  <Badge className="w-fit mb-2 bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/20">TCJA Sunset</Badge>
                  <CardTitle className="text-xl">2026 Exemption</CardTitle>
                  <CardDescription>Exemption amount: {fmt(exemption2026)}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between p-3 rounded-lg bg-card border">
                    <span className="text-muted-foreground">Gross Estate</span><span className="font-bold">{fmt(analysis.totalEstate)}</span>
                  </div>
                  <div className="flex justify-between p-3 rounded-lg bg-card border">
                    <span className="text-muted-foreground">Total Deductions</span><span className="font-bold text-green-500">-{fmt(analysis.totalReductions)}</span>
                  </div>
                  <div className="flex justify-between p-3 rounded-lg bg-card border">
                    <span className="text-muted-foreground">Taxable Estate</span><span className="font-bold">{fmt(analysis.taxableEstate)}</span>
                  </div>
                  <div className="flex justify-between p-3 rounded-lg bg-card border">
                    <span className="text-muted-foreground">Exemption Applied</span><span className="font-bold text-amber-500">-{fmt(Math.min(analysis.taxableEstate, exemption2026))}</span>
                  </div>
                  <div className="flex justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                    <span className="font-semibold">Net Taxable Estate</span><span className="font-bold text-red-500">{fmt(analysis.netTaxableEstate2026)}</span>
                  </div>
                  <div className="flex justify-between p-4 rounded-xl bg-red-500/10 border border-red-500/20 mt-4">
                    <span className="font-bold text-lg">Total Tax Liability</span>
                    <span className="font-bold text-lg text-red-500">{fmt(analysis.totalTax2026)}</span>
                  </div>
                  <div className="flex justify-between p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                    <span className="font-bold">To Beneficiaries</span>
                    <span className="font-bold text-green-600 dark:text-green-400">{fmt(analysis.toBeneficiaries2026)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Table 2: Tax Liability Comparison */}
              <Card className="border shadow-sm lg:col-span-2">
                <CardHeader>
                  <CardTitle>Detailed Tax Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Metric</TableHead>
                        <TableHead className="text-right">2024 (Current)</TableHead>
                        <TableHead className="text-right">2026 (Sunset)</TableHead>
                        <TableHead className="text-right">Difference</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Federal Estate Tax</TableCell>
                        <TableCell className="text-right">{fmt(analysis.federalEstateTax2024)}</TableCell>
                        <TableCell className="text-right">{fmt(analysis.federalEstateTax2026)}</TableCell>
                        <TableCell className="text-right text-red-500">+{fmt(analysis.federalEstateTax2026 - analysis.federalEstateTax2024)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">State Estate Tax</TableCell>
                        <TableCell className="text-right">{fmt(analysis.stateEstateTax)}</TableCell>
                        <TableCell className="text-right">{fmt(analysis.stateEstateTax)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">$0</TableCell>
                      </TableRow>
                      <TableRow className="bg-muted/30">
                        <TableCell className="font-bold">Total Tax Liability</TableCell>
                        <TableCell className="text-right font-bold">{fmt(analysis.totalTax2024)}</TableCell>
                        <TableCell className="text-right font-bold text-red-500">{fmt(analysis.totalTax2026)}</TableCell>
                        <TableCell className="text-right font-bold text-red-500">+{fmt(analysis.totalTax2026 - analysis.totalTax2024)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Effective Tax Rate</TableCell>
                        <TableCell className="text-right">{((analysis.totalTax2024 / analysis.totalEstate) * 100).toFixed(1)}%</TableCell>
                        <TableCell className="text-right">{((analysis.totalTax2026 / analysis.totalEstate) * 100).toFixed(1)}%</TableCell>
                        <TableCell className="text-right text-red-500">+{(((analysis.totalTax2026 - analysis.totalTax2024) / analysis.totalEstate) * 100).toFixed(1)}%</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* STRATEGIES TAB */}
          <TabsContent value="strategies" className="space-y-6 mt-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold">Advanced Planning Strategies</h2>
                <p className="text-muted-foreground text-sm">Toggle strategies to model their impact on the estate</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Total Strategy Savings:</span>
                <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-base px-3 py-1">
                  {fmt(Math.round(analysis.totalReductions * 0.4))}
                </Badge>
              </div>
            </div>

            {/* Chart 3: Strategy Impact (Radar) */}
            <Card className="border shadow-sm mb-6">
              <CardContent className="pt-6">
                <div className="h-[350px] w-full flex flex-col md:flex-row items-center">
                  <div className="w-full md:w-1/2 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={strategyImpactData}>
                        <PolarGrid stroke="var(--border)" />
                        <PolarAngleAxis dataKey="name" tick={{ fill: 'var(--foreground)', fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                        <Radar name="Strategy Impact" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                        <RTooltip 
                          formatter={(value: number) => fmt(value)}
                          contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)' }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full md:w-1/2 space-y-4 p-4">
                    <h3 className="font-semibold text-lg border-b pb-2">Strategy Effectiveness</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm flex items-center gap-2"><Shield className="w-4 h-4 text-amber-500" /> ILIT Protection</span>
                        <span className="font-medium">{fmt(hasILIT ? lifeInsurance : 0)}</span>
                      </div>
                      <Progress value={hasILIT ? (lifeInsurance / analysis.totalEstate) * 100 : 0} className="h-2" />
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm flex items-center gap-2"><Home className="w-4 h-4 text-purple-500" /> QPRT Discount</span>
                        <span className="font-medium">{fmt(hasQPRT ? analysis.qprtReduction : 0)}</span>
                      </div>
                      <Progress value={hasQPRT ? (analysis.qprtReduction / analysis.totalEstate) * 100 : 0} className="h-2" />
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm flex items-center gap-2"><Building2 className="w-4 h-4 text-blue-500" /> FLP Discount</span>
                        <span className="font-medium">{fmt(hasFLP ? analysis.flpDiscount : 0)}</span>
                      </div>
                      <Progress value={hasFLP ? (analysis.flpDiscount / analysis.totalEstate) * 100 : 0} className="h-2" />
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm flex items-center gap-2"><Heart className="w-4 h-4 text-pink-500" /> Charitable</span>
                        <span className="font-medium">{fmt(analysis.charitableDeduction)}</span>
                      </div>
                      <Progress value={(analysis.charitableDeduction / analysis.totalEstate) * 100} className="h-2" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Strategy Cards */}
              {[
                { 
                  id: "ilit", title: "ILIT", fullName: "Irrevocable Life Insurance Trust", 
                  desc: "Removes life insurance death benefit from taxable estate.", 
                  enabled: hasILIT, toggle: setHasILIT, 
                  impact: Math.round(lifeInsurance * 0.40), icon: Shield, color: "amber" 
                },
                { 
                  id: "qprt", title: "QPRT", fullName: "Qualified Personal Residence Trust", 
                  desc: "Transfers home at discounted value. Reduces taxable estate by ~35% of home value.", 
                  enabled: hasQPRT, toggle: setHasQPRT, 
                  impact: Math.round(analysis.qprtReduction * 0.40), icon: Home, color: "purple" 
                },
                { 
                  id: "flp", title: "FLP / FLLC", fullName: "Family Limited Partnership", 
                  desc: "Discount business and real estate values by 25-40% for gift/estate tax purposes.", 
                  enabled: hasFLP, toggle: setHasFLP, 
                  impact: Math.round(analysis.flpDiscount * 0.40), icon: Building2, color: "blue" 
                },
                { 
                  id: "grat", title: "GRAT", fullName: "Grantor Retained Annuity Trust", 
                  desc: "Transfer appreciating assets at reduced gift tax cost.", 
                  enabled: hasGRAT, toggle: setHasGRAT, 
                  impact: Math.round(analysis.gratReduction * 0.40), icon: TrendingUp, color: "green" 
                },
                { 
                  id: "slat", title: "SLAT", fullName: "Spousal Lifetime Access Trust", 
                  desc: "Lock in current high exemption while allowing spouse access to funds.", 
                  enabled: hasSLAT, toggle: setHasSLAT, 
                  impact: Math.round(analysis.slatReduction * 0.40), icon: Users, color: "indigo" 
                },
                { 
                  id: "charitable", title: "Charitable Trust", fullName: "CRT / CLT", 
                  desc: "Provide income stream + charitable deduction. Reduces estate tax.", 
                  enabled: hasCharitableTrust, toggle: setHasCharitableTrust, 
                  impact: Math.round(analysis.charitableDeduction * 0.40), icon: Heart, color: "pink" 
                },
              ].map((strategy) => {
                const Icon = strategy.icon;
                return (
                  <Card key={strategy.id} className={`border transition-all ${strategy.enabled ? `border-${strategy.color}-500/50 shadow-md ring-1 ring-${strategy.color}-500/20` : "hover:border-primary/30"}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg ${strategy.enabled ? `bg-${strategy.color}-500/20` : "bg-muted"}`}>
                            <Icon className={`h-5 w-5 ${strategy.enabled ? `text-${strategy.color}-500 dark:text-${strategy.color}-400` : "text-muted-foreground"}`} />
                          </div>
                          <div>
                            <CardTitle className="text-base">{strategy.title}</CardTitle>
                            <CardDescription className="text-xs truncate max-w-[150px]">{strategy.fullName}</CardDescription>
                          </div>
                        </div>
                        <Switch checked={strategy.enabled} onCheckedChange={strategy.toggle} />
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <p className="text-sm text-muted-foreground min-h-[60px]">{strategy.desc}</p>
                      
                      {strategy.id === "charitable" && strategy.enabled && (
                        <div className="mt-3 p-3 bg-muted/50 rounded-lg space-y-2">
                          <div className="flex justify-between text-xs">
                            <Label>Charitable Percentage</Label>
                            <span>{charitablePercent}%</span>
                          </div>
                          <Slider 
                            value={[charitablePercent]} 
                            onValueChange={(vals) => setCharitablePercent(vals[0])} 
                            max={50} step={1} 
                          />
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="pt-2 border-t mt-2">
                      <div className="w-full flex justify-between items-center">
                        <span className="text-xs font-medium text-muted-foreground">Est. Tax Savings</span>
                        <span className={`font-bold ${strategy.enabled ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                          {fmt(strategy.impact)}
                        </span>
                      </div>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>

            {/* Table 3: Strategy Implementation Matrix */}
            <Card className="border shadow-sm mt-6">
              <CardHeader>
                <CardTitle>Implementation Matrix</CardTitle>
                <CardDescription>Complexity and cost analysis for active strategies</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Strategy</TableHead>
                      <TableHead>Complexity</TableHead>
                      <TableHead>Est. Setup Cost</TableHead>
                      <TableHead>Annual Maintenance</TableHead>
                      <TableHead>Irrevocability</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hasILIT && (
                      <TableRow>
                        <TableCell className="font-medium">ILIT</TableCell>
                        <TableCell><Badge variant="outline" className="bg-blue-500/10 text-blue-600">Medium</Badge></TableCell>
                        <TableCell>$3,500 - $5,000</TableCell>
                        <TableCell>$500 - $1,000</TableCell>
                        <TableCell>High</TableCell>
                        <TableCell className="text-right"><Button variant="ghost" size="sm">Details</Button></TableCell>
                      </TableRow>
                    )}
                    {hasQPRT && (
                      <TableRow>
                        <TableCell className="font-medium">QPRT</TableCell>
                        <TableCell><Badge variant="outline" className="bg-amber-500/10 text-amber-600">High</Badge></TableCell>
                        <TableCell>$5,000 - $8,000</TableCell>
                        <TableCell>$0 - $500</TableCell>
                        <TableCell>High</TableCell>
                        <TableCell className="text-right"><Button variant="ghost" size="sm">Details</Button></TableCell>
                      </TableRow>
                    )}
                    {hasFLP && (
                      <TableRow>
                        <TableCell className="font-medium">FLP / FLLC</TableCell>
                        <TableCell><Badge variant="outline" className="bg-red-500/10 text-red-600">Very High</Badge></TableCell>
                        <TableCell>$10,000 - $25,000</TableCell>
                        <TableCell>$2,000 - $5,000</TableCell>
                        <TableCell>Medium</TableCell>
                        <TableCell className="text-right"><Button variant="ghost" size="sm">Details</Button></TableCell>
                      </TableRow>
                    )}
                    {!hasILIT && !hasQPRT && !hasFLP && !hasGRAT && !hasSLAT && !hasCharitableTrust && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                          No advanced strategies currently active. Enable strategies above to view implementation details.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PROJECTIONS TAB */}
          <TabsContent value="projections" className="space-y-6 mt-6">
            <Card className="border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Estate Growth & Tax Projections</CardTitle>
                  <CardDescription>10-year forecast of estate value vs. exemption limits</CardDescription>
                </div>
                <Button onClick={handleSimulate} disabled={isSimulating} className="gap-2">
                  {isSimulating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Simulating...
                    </>
                  ) : (
                    <>
                      <Activity className="w-4 h-4" /> Run Monte Carlo
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                {isSimulating && (
                  <div className="mb-6 space-y-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Running 10,000 market scenarios...</span>
                      <span>{simulationProgress}%</span>
                    </div>
                    <Progress value={simulationProgress} className="h-2" />
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div className="lg:col-span-3 h-[400px]">
                    {/* Chart 4: Growth Projections (Area) */}
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={projectionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <defs>
                          <linearGradient id="colorEstate" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorExemption" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorTax" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis dataKey="year" tick={{ fill: 'var(--foreground)' }} />
                        <YAxis tickFormatter={(val) => `$${(val/1000000).toFixed(0)}M`} tick={{ fill: 'var(--foreground)' }} />
                        <RTooltip 
                          formatter={(value: number) => fmt(value)}
                          labelFormatter={(label) => `Year ${label}`}
                          contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)' }}
                        />
                        <Legend />
                        <Area type="monotone" dataKey="estateValue" name="Gross Estate" stroke="#3b82f6" fillOpacity={1} fill="url(#colorEstate)" />
                        <Area type="step" dataKey="exemption" name="Exemption Limit" stroke="#10b981" fillOpacity={1} fill="url(#colorExemption)" />
                        <Area type="monotone" dataKey="tax" name="Projected Tax" stroke="#ef4444" fillOpacity={1} fill="url(#colorTax)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="p-4 rounded-xl bg-muted/50 border space-y-4">
                      <h4 className="font-semibold text-sm border-b pb-2">Projection Variables</h4>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <Label>Annual Growth Rate</Label>
                          <span>{growthRate.toFixed(1)}%</span>
                        </div>
                        <Slider value={[growthRate]} onValueChange={(v) => setGrowthRate(v[0])} min={0} max={12} step={0.1} />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <Label>Inflation (Exemption Growth)</Label>
                          <span>{inflationRate.toFixed(1)}%</span>
                        </div>
                        <Slider value={[inflationRate]} onValueChange={(v) => setInflationRate(v[0])} min={0} max={6} step={0.1} />
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <Label>Projection Horizon</Label>
                          <span>{projectionYears} Years</span>
                        </div>
                        <Slider value={[projectionYears]} onValueChange={(v) => setProjectionYears(v[0])} min={5} max={30} step={1} />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-card border shadow-sm space-y-2">
                      <h4 className="font-semibold text-sm text-red-500">Year {new Date().getFullYear() + projectionYears} Risk</h4>
                      <div className="text-2xl font-bold">{fmt(projectionData[projectionData.length - 1]?.tax || 0)}</div>
                      <p className="text-xs text-muted-foreground">Projected tax liability at end of horizon</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Chart 5: Wealth Transfer Efficiency (Line) */}
            <Card className="border shadow-sm mt-6">
              <CardHeader>
                <CardTitle>Wealth Transfer Efficiency</CardTitle>
                <CardDescription>Percentage of estate successfully transferred to heirs over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={projectionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                      <XAxis dataKey="year" tick={{ fill: 'var(--foreground)' }} />
                      <YAxis domain={[0, 100]} tickFormatter={(val) => `${val}%`} tick={{ fill: 'var(--foreground)' }} />
                      <RTooltip 
                        formatter={(value: number) => `${value.toFixed(1)}%`}
                        labelFormatter={(label) => `Year ${label}`}
                        contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'var(--background)' }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey={(d) => (d.toHeirs / d.estateValue) * 100} 
                        name="Transfer Efficiency (%)" 
                        stroke="#8b5cf6" 
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      {/* Reference line for 2026 sunset drop */}
                      <Line 
                        type="step" 
                        dataKey={() => 60} 
                        name="Inefficient Baseline" 
                        stroke="#ef4444" 
                        strokeDasharray="5 5"
                        strokeWidth={1}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <NAICDisclaimer variant="compact" showsProjections showsCashValues />
      </div>
    
        <ComplianceFooter pageName="EstateFlowChart" showsAnnuity showsTax showsEstate showsProjections />
      </AppShell>
  );
}
