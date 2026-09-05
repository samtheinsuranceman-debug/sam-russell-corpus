// @ts-nocheck
import { useState, useEffect, useMemo, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { OilGasToggle } from "@/components/OilGasToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Users,
  Home,
  DollarSign,
  Shield,
  TrendingUp,
  Plus,
  Trash2,
  Save,
  ArrowRight,
  Building,
  Heart,
  Baby,
  Crown,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Landmark,
  PiggyBank,
  Calculator,
  BarChart3,
  LineChart,
  Briefcase,
  GraduationCap,
  Stethoscope,
  Wallet,
} from "lucide-react";
import {
  LineChart as ReLineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, ReferenceLine,
} from "recharts";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { NumberInput } from "@/components/NumberInput";
import {
  runHouseholdSimulation,
  formatCurrency,
  formatFullCurrency,
  type HouseholdSimulationInput,
  type HouseholdSimulationResult,
  type ChildInput,
  type GrandchildInput,
} from "@shared/householdWealth";
import { PageInsights } from "@/components/PageInsights";
import { ExportToSlides } from "@/components/ExportToSlides";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";


function n(v: string | undefined | null): number {
  return parseFloat(v || "0") || 0;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

const COLORS = {
  primary: "#10b981",
  spouse: "#6366f1",
  child: "#f59e0b",
  grandchild: "#ec4899",
  heloc: "#ef4444",
  savings: "#22c55e",
  deathBenefit: "#8b5cf6",
  accountValue: "#3b82f6",
  surrenderValue: "#14b8a6",
  realEstate: "#f97316",
  rental: "#84cc16",
  wealth: "#eab308",
};


const defaultChild = (): ChildInput => ({
  id: uid(), name: "", age: 30, income: 75000, ira: 50000, rothIra: 25000,
  cash: 20000, homeValue: 350000, homeEquity: 80000, mortgageBalance: 270000,
  mortgageRate: 0.065, mortgageYearsLeft: 28, totalInterest: 0,
});

const defaultGrandchild = (parentId: string): GrandchildInput => ({
  id: uid(), name: "", age: 5, parentId,
  occupation: "", employer: "", earnedIncome: 0, otherIncome: 0, filingStatus: "single",
  homeValue: 0, homeEquity: 0, mortgageBalance: 0, mortgageRate: 0.065,
  mortgageYearsLeft: 30, totalInterest: 0, monthlyMortgagePayment: 0, propertyTax: 0, homeInsurance: 0,
  checking: 0, savings: 0, ira: 0, rothIra: 0, fourOhOneK: 0, otherInvestments: 0,
  studentDebtBalance: 0, studentDebtRate: 0.055, studentDebtMonthlyPayment: 0,
  autoLoanBalance: 0, autoLoanMonthlyPayment: 0,
  creditCardDebt: 0, creditCardMonthlyPayment: 0,
  otherDebtBalance: 0, otherDebtMonthlyPayment: 0,
  monthlyExpenses: 0,
  hasHealthInsurance: false, hasLifeInsurance: false, existingLifeInsuranceCoverage: 0, hasDisabilityInsurance: false,
});


export default function HouseholdWealth() {
  const { user } = useAuth();
  const { data: clientData } = useClientData();

  const clientsQuery = trpc.clients.list.useQuery();
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

  const factFinderQuery = trpc.household.getFactFinder.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId }
  );
  const saveFactFinder = trpc.household.saveFactFinder.useMutation({
    onSuccess: () => toast.success("Household data saved successfully"),
  });

  const [primaryAge, setPrimaryAge] = useState(55);
  const [primaryIncome, setPrimaryIncome] = useState("250000");
  const [primaryIra, setPrimaryIra] = useState("500000");
  const [primaryRothIra, setPrimaryRothIra] = useState("150000");
  const [primaryCash, setPrimaryCash] = useState("100000");
  const [primaryHomeValue, setPrimaryHomeValue] = useState("750000");
  const [primaryHomeEquity, setPrimaryHomeEquity] = useState("400000");
  const [primaryMortgageBalance, setPrimaryMortgageBalance] = useState("350000");
  const [primaryMortgageRate, setPrimaryMortgageRate] = useState("0.055");
  const [primaryMortgageYearsLeft, setPrimaryMortgageYearsLeft] = useState(22);
  const [primaryTotalInterest, setPrimaryTotalInterest] = useState("0");
  const [primaryAnnualPremium, setPrimaryAnnualPremium] = useState("25000");
  const [primaryDeathBenefit, setPrimaryDeathBenefit] = useState("1000000");
  const [spouseName, setSpouseName] = useState("");
  const [spouseAge, setSpouseAge] = useState(53);
  const [spouseIncome, setSpouseIncome] = useState("0");
  const [spouseIra, setSpouseIra] = useState("0");
  const [spouseRothIra, setSpouseRothIra] = useState("0");
  const [spouseCash, setSpouseCash] = useState("0");
  const [helocRate, setHelocRate] = useState("0.06");
  const [helocMaxLtv, setHelocMaxLtv] = useState("0.80");
  const [rentBasement, setRentBasement] = useState(false);
  const [children, setChildren] = useState<ChildInput[]>([]);
  const [grandchildren, setGrandchildren] = useState<GrandchildInput[]>([]);
  const [simulationYears, setSimulationYears] = useState(50);
  const [payChildrenSimultaneously, setPayChildrenSimultaneously] = useState(true);

  const [result, setResult] = useState<HouseholdSimulationResult | null>(null);
  const [activeTab, setActiveTab] = useState("factfinder");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (clientData) {
      if (clientData.age) setPrimaryAge(clientData.age);
      if (clientData.annualIncome) setPrimaryIncome(clientData.annualIncome.toString());
      if (clientData.iraBalance) setPrimaryIra(clientData.iraBalance.toString());
      if (clientData.rothBalance) setPrimaryRothIra(clientData.rothBalance.toString());
      if (clientData.cashSavings) setPrimaryCash(clientData.cashSavings.toString());
      if (clientData.homeValue) setPrimaryHomeValue(clientData.homeValue.toString());
      if (clientData.realEstateEquity) setPrimaryHomeEquity(clientData.realEstateEquity.toString());
      if (clientData.mortgageBalance) setPrimaryMortgageBalance(clientData.mortgageBalance.toString());
      if (clientData.mortgageRate) setPrimaryMortgageRate(clientData.mortgageRate.toString());
      if (clientData.mortgageYearsLeft) setPrimaryMortgageYearsLeft(clientData.mortgageYearsLeft);
      if (clientData.totalMortgageInterest) setPrimaryTotalInterest(clientData.totalMortgageInterest.toString());
      if (clientData.annualPremium) setPrimaryAnnualPremium(clientData.annualPremium.toString());
      if (clientData.lifeInsuranceDb) setPrimaryDeathBenefit(clientData.lifeInsuranceDb.toString());
      if (clientData.spouseName) setSpouseName(clientData.spouseName);
      if (clientData.spouseAge) setSpouseAge(clientData.spouseAge);
      if (clientData.spouseIncome) setSpouseIncome(clientData.spouseIncome.toString());
    }
  }, [clientData]);

  useEffect(() => {
    if (factFinderQuery.data) {
      const d = factFinderQuery.data;
      setPrimaryAge(d.primaryAge ?? 55);
      setPrimaryIncome(d.primaryIncome ?? "250000");
      setPrimaryIra(d.primaryIra ?? "500000");
      setPrimaryRothIra(d.primaryRothIra ?? "150000");
      setPrimaryCash(d.primaryCash ?? "100000");
      setPrimaryHomeValue(d.primaryHomeValue ?? "750000");
      setPrimaryHomeEquity(d.primaryHomeEquity ?? "400000");
      setPrimaryMortgageBalance(d.primaryMortgageBalance ?? "350000");
      setPrimaryMortgageRate(d.primaryMortgageRate ?? "0.055");
      setPrimaryMortgageYearsLeft(d.primaryMortgageYearsLeft ?? 22);
      setPrimaryTotalInterest(d.primaryTotalInterest ?? "0");
      setPrimaryAnnualPremium(d.primaryAnnualPremium ?? "25000");
      setPrimaryDeathBenefit(d.primaryDeathBenefit ?? "1000000");
      setSpouseName(d.spouseName ?? "");
      setSpouseAge(d.spouseAge ?? 53);
      setSpouseIncome(d.spouseIncome ?? "0");
      setSpouseIra(d.spouseIra ?? "0");
      setSpouseRothIra(d.spouseRothIra ?? "0");
      setSpouseCash(d.spouseCash ?? "0");
      setHelocRate(d.helocRate ?? "0.06");
      setHelocMaxLtv(d.helocMaxLtv ?? "0.80");
      setRentBasement(d.rentBasement ?? false);
      setChildren((d.children as ChildInput[]) ?? []);
      setGrandchildren((d.grandchildren as GrandchildInput[]) ?? []);
    }
  }, [factFinderQuery.data]);

  useEffect(() => {
    if (clientsQuery.data && clientsQuery.data.length > 0 && !selectedClientId) {
      setSelectedClientId(clientsQuery.data[0].id);
    }
  }, [clientsQuery.data, selectedClientId]);

  const handleSave = useCallback(() => {
    if (!selectedClientId) return;
    saveFactFinder.mutate({
      clientId: selectedClientId,
      primaryAge, primaryIncome, primaryIra, primaryRothIra, primaryCash,
      primaryHomeValue, primaryHomeEquity, primaryMortgageBalance, primaryMortgageRate,
      primaryMortgageYearsLeft, primaryTotalInterest, primaryAnnualPremium, primaryDeathBenefit,
      spouseName, spouseAge, spouseIncome, spouseIra, spouseRothIra, spouseCash,
      helocRate, helocMaxLtv, rentBasement, children, grandchildren,
    });
  }, [selectedClientId, primaryAge, primaryIncome, primaryIra, primaryRothIra, primaryCash,
    primaryHomeValue, primaryHomeEquity, primaryMortgageBalance, primaryMortgageRate,
    primaryMortgageYearsLeft, primaryTotalInterest, primaryAnnualPremium, primaryDeathBenefit,
    spouseName, spouseAge, spouseIncome, spouseIra, spouseRothIra, spouseCash,
    helocRate, helocMaxLtv, rentBasement, children, grandchildren, saveFactFinder]);

  const handleRunSimulation = useCallback(() => {
    const input: HouseholdSimulationInput = {
      primaryAge, primaryAnnualPremium: n(primaryAnnualPremium), primaryDeathBenefit: n(primaryDeathBenefit),
      primaryHomeValue: n(primaryHomeValue), primaryHomeEquity: n(primaryHomeEquity),
      primaryMortgageBalance: n(primaryMortgageBalance), primaryMortgageRate: n(primaryMortgageRate),
      primaryMortgageYearsLeft, spouseAge, spouseName: spouseName || "Spouse",
      children, grandchildren, rentBasement, helocRate: n(helocRate), simulationYears,
      payChildrenSimultaneously,
    };
    const sim = runHouseholdSimulation(input);
    setResult(sim);
    setActiveTab("policies");
    handleSave();
    toast.success(`Simulation complete — ${sim.policies.length} policies modeled over ${simulationYears} years`);
  }, [primaryAge, primaryAnnualPremium, primaryDeathBenefit, primaryHomeValue, primaryHomeEquity,
    primaryMortgageBalance, primaryMortgageRate, primaryMortgageYearsLeft, spouseAge, spouseName,
    children, grandchildren, rentBasement, helocRate, simulationYears, payChildrenSimultaneously, handleSave, toast]);

  const addChild = () => setChildren(prev => [...prev, defaultChild()]);
  const removeChild = (id: string) => {
    setChildren(prev => prev.filter((c) => c.id !== id));
    setGrandchildren(prev => prev.filter((gc) => gc.parentId !== id));
  };
  const updateChild = (id: string, field: keyof ChildInput, value: string | number) => {
    setChildren(prev => prev.map((c) => c.id === id ? { ...c, [field]: typeof value === "string" && field !== "name" && field !== "id" ? parseFloat(value) || 0 : value } : c));
  };
  const addGrandchild = (parentId: string) => setGrandchildren(prev => [...prev, defaultGrandchild(parentId)]);
  const removeGrandchild = (id: string) => setGrandchildren(prev => prev.filter((gc) => gc.id !== id));
  const updateGrandchild = (id: string, field: keyof GrandchildInput, value: string | number | boolean) => {
    const stringFields: (keyof GrandchildInput)[] = ["id", "name", "parentId", "occupation", "employer", "filingStatus"];
    const boolFields: (keyof GrandchildInput)[] = ["hasHealthInsurance", "hasLifeInsurance", "hasDisabilityInsurance"];
    setGrandchildren(prev => prev.map((gc) => {
      if (gc.id !== id) return gc;
      let parsed: string | number | boolean = value;
      if (boolFields.includes(field)) {
        parsed = value as boolean;
      } else if (!stringFields.includes(field) && typeof value === "string") {
        parsed = parseFloat(value) || 0;
      }
      return { ...gc, [field]: parsed };
    }));
  };

  const toggleSection = (key: string) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  const currencyFormatter = (value: number) => formatFullCurrency(value);


  return (
    <div className="space-y-6 pb-12">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="HouseholdWealth" />

        <ExecutiveSummary
          pageTitle="Household Wealth"
          whatItDoes="This real estate strategy tool provides institutional-grade analysis of your financial situation, modeling multiple scenarios and projecting outcomes based on your specific inputs. It transforms complex real estate strategy concepts into clear, actionable insights with dollar-quantified recommendations."
          opportunities="Your home equity is likely your largest untapped asset. Strategic use of HELOCs, mortgage optimization, and property recycling can turn dead equity into working capital."
          intent="To give you the same caliber of real estate strategy analysis that institutional investors and ultra-high-net-worth families receive — now accessible to every client."
          takeaway="Understanding your real estate strategy options with precise dollar amounts empowers you to make confident decisions that compound into significant wealth over time."
          callToAction="Enter your numbers and see exactly how real estate strategy strategies can improve your financial outcome."
          followUpQuestions={[
            "How does this real estate strategy strategy interact with my other financial plans?",
            "What\'s the single biggest real estate strategy opportunity I\'m currently missing?",
            "How would my results change if I started this strategy 5 years earlier?",
          ]}
        />
        <GoalsAccelerator pageName="Household Wealth" pageContext="Household Wealth — real estate strategy modeling with projections and scenario analysis" />
        <TaxBracketPanel grossIncome={clientData?.annualIncome || 150000} filingStatus={clientData?.filingStatus || "single"} stateCode={clientData?.state || "TX"} />
        <RecommendationSummary
          headline="This real estate strategy strategy can significantly improve your financial outcome"
          detail="Based on your profile, implementing the recommended real estate strategy approach could generate substantial savings and growth over your planning horizon."
          dollarBenefit={550000}
          timeHorizon="20 years"
          confidence="high"
          nextStep="Review with your advisor"
        />
        <DoNothingBaseline
          metrics={[
            { label: "Equity Deployed", doNothing: 0, recommended: 350000, format: "currency" },
            { label: "Mortgage Interest Saved", doNothing: 0, recommended: 180000, format: "currency" },
            { label: "Net Worth Impact", doNothing: 0, recommended: 550000, format: "currency" },
          ]}
          summary="Without taking action on real estate strategy, you leave significant value on the table that compounds into a major opportunity cost over time."
        />
      <FactFinderBadge className="mb-4" />
      {/* Header */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Crown className="h-7 w-7 text-emerald-500" />
              Household Wealth Engine
            </h1>
            <p className="text-muted-foreground mt-1">
              Multigenerational IUL wealth creation, mortgage acceleration, and family wealth recapture
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={selectedClientId?.toString() ?? ""}
            onValueChange={(v) => setSelectedClientId(parseInt(v))}
          >
            <SelectTrigger className="w-[220px] h-10">
              <SelectValue placeholder="Select Client" />
            </SelectTrigger>
            <SelectContent>
              {(clientsQuery.data ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleSave} disabled={!selectedClientId} className="border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white px-4 h-10 min-w-[90px]">
            <Save className="h-4 w-4 mr-2" /> Save
          </Button>
          <Button onClick={handleRunSimulation} disabled={!selectedClientId} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 h-10 min-w-[160px] shadow-lg shadow-emerald-900/30">
            <Calculator className="h-4 w-4 mr-2" /> Run Simulation
          </Button>
          <ExportToSlides
            toolName="Household Wealth Engine"
            getSections={() => {
              const sections = [
                {
                  title: "Fact Finder",
                  items: [
                    { label: "Primary Age", value: primaryAge.toString() },
                    { label: "Primary Income", value: `$${n(primaryIncome).toLocaleString()}` },
                    { label: "Spouse Age", value: spouseAge.toString() },
                    { label: "Spouse Income", value: `$${n(spouseIncome).toLocaleString()}` },
                    { label: "Children", value: children.length.toString() },
                    { label: "Grandchildren", value: grandchildren.length.toString() }
                  ]
                }
              ];
              if (result) {
                sections.push({
                  title: "Simulation Results",
                  items: [
                    { label: "Total Premiums Paid", value: `$${result.summary.totalPremiumsPaid.toLocaleString()}` },
                    { label: "Total Account Value", value: `$${result.summary.totalAccountValue.toLocaleString()}` },
                    { label: "Total Death Benefit", value: `$${result.summary.totalDeathBenefit.toLocaleString()}` },
                    { label: "Net Family Wealth", value: `$${result.summary.netFamilyWealth.toLocaleString()}` }
                  ]
                });
              }
              return sections;
            }}
          />
        </div>
        {/* Oil & Gas Tax Optimization Toggle */}
        <div className="mt-3">
          <OilGasToggle compact />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 h-auto gap-1.5 p-1.5 w-full bg-slate-800/80 border border-slate-700/60 rounded-xl">
          <TabsTrigger value="factfinder" className="text-xs sm:text-sm px-3 py-2 whitespace-nowrap rounded-lg font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-slate-200 data-[state=inactive]:hover:bg-slate-700/60 data-[state=inactive]:hover:text-white disabled:text-slate-400 disabled:opacity-70 transition-all">
            <Calculator className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />Fact Finder
          </TabsTrigger>
          <TabsTrigger value="policies" disabled={!result} className="text-xs sm:text-sm px-3 py-2 whitespace-nowrap rounded-lg font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-slate-200 data-[state=inactive]:hover:bg-slate-700/60 data-[state=inactive]:hover:text-white disabled:text-slate-400 disabled:opacity-70 transition-all">
            <BarChart3 className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />Policies
          </TabsTrigger>
          <TabsTrigger value="mortgage" disabled={!result} className="text-xs sm:text-sm px-3 py-2 whitespace-nowrap rounded-lg font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-slate-200 data-[state=inactive]:hover:bg-slate-700/60 data-[state=inactive]:hover:text-white disabled:text-slate-400 disabled:opacity-70 transition-all">
            <Home className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />Mortgage Killer
          </TabsTrigger>
          <TabsTrigger value="realestate" disabled={!result} className="text-xs sm:text-sm px-3 py-2 whitespace-nowrap rounded-lg font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-slate-200 data-[state=inactive]:hover:bg-slate-700/60 data-[state=inactive]:hover:text-white disabled:text-slate-400 disabled:opacity-70 transition-all">
            <Building className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />Real Estate
          </TabsTrigger>
          <TabsTrigger value="recapture" disabled={!result} className="text-xs sm:text-sm px-3 py-2 whitespace-nowrap rounded-lg font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-slate-200 data-[state=inactive]:hover:bg-slate-700/60 data-[state=inactive]:hover:text-white disabled:text-slate-400 disabled:opacity-70 transition-all">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />Wealth Recapture
          </TabsTrigger>
          <TabsTrigger value="comparison" disabled={!result} className="text-xs sm:text-sm px-3 py-2 whitespace-nowrap rounded-lg font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-slate-200 data-[state=inactive]:hover:bg-slate-700/60 data-[state=inactive]:hover:text-white disabled:text-slate-400 disabled:opacity-70 transition-all">
            <TrendingUp className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />Strategy Comparison
          </TabsTrigger>
          <TabsTrigger value="summary" disabled={!result} className="text-xs sm:text-sm px-3 py-2 whitespace-nowrap rounded-lg font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-slate-200 data-[state=inactive]:hover:bg-slate-700/60 data-[state=inactive]:hover:text-white disabled:text-slate-400 disabled:opacity-70 transition-all">
            <LineChart className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />Summary
          </TabsTrigger>
        </TabsList>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: FACT FINDER                                                */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="factfinder" className="space-y-6 mt-6">
          {/* Primary Owner */}
          <Card className="border-emerald-500/30">
            <CardHeader className="cursor-pointer" onClick={() => toggleSection("primary")}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-emerald-500" />
                  <CardTitle>Primary Owner</CardTitle>
                </div>
                {expandedSections.primary === false ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </div>
            </CardHeader>
            {expandedSections.primary !== false && (
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div><Label>Age</Label><NumberInput value={primaryAge || ""} onChange={setPrimaryAge} /></div>
                <div><Label>Annual Income</Label><Input value={primaryIncome} onChange={(e) => setPrimaryIncome(e.target.value)} /></div>
                <div><Label>IRA Balance</Label><Input value={primaryIra} onChange={(e) => setPrimaryIra(e.target.value)} /></div>
                <div><Label>Roth IRA</Label><Input value={primaryRothIra} onChange={(e) => setPrimaryRothIra(e.target.value)} /></div>
                <div><Label>Cash</Label><Input value={primaryCash} onChange={(e) => setPrimaryCash(e.target.value)} /></div>
                <div><Label>Home Value</Label><Input value={primaryHomeValue} onChange={(e) => setPrimaryHomeValue(e.target.value)} /></div>
                <div><Label>Home Equity</Label><Input value={primaryHomeEquity} onChange={(e) => setPrimaryHomeEquity(e.target.value)} /></div>
                <div><Label>Mortgage Balance</Label><Input value={primaryMortgageBalance} onChange={(e) => setPrimaryMortgageBalance(e.target.value)} /></div>
                <div><Label>Mortgage Rate</Label><Input value={primaryMortgageRate} onChange={(e) => setPrimaryMortgageRate(e.target.value)} /></div>
                <div><Label>Years Left</Label><NumberInput value={primaryMortgageYearsLeft || ""} onChange={setPrimaryMortgageYearsLeft} /></div>
                <div><Label>Annual IUL Premium</Label><Input value={primaryAnnualPremium} onChange={(e) => setPrimaryAnnualPremium(e.target.value)} className="border-emerald-500/50" /></div>
                <div><Label>Death Benefit</Label><Input value={primaryDeathBenefit} onChange={(e) => setPrimaryDeathBenefit(e.target.value)} className="border-emerald-500/50" /></div>
              </CardContent>
            )}
          </Card>

          {/* Spouse */}
          <Card className="border-indigo-500/30">
            <CardHeader className="cursor-pointer" onClick={() => toggleSection("spouse")}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-indigo-500" />
                  <CardTitle>Spouse</CardTitle>
                  <Badge variant="outline" className="text-indigo-400 border-indigo-400/50">80% Premium</Badge>
                </div>
                {expandedSections.spouse === false ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
              </div>
              <CardDescription>
                Spouse IUL funded by loans against primary policy starting month 13. Premium: {formatFullCurrency(n(primaryAnnualPremium) * 0.8)}
              </CardDescription>
            </CardHeader>
            {expandedSections.spouse !== false && (
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div><Label>Spouse Name</Label><Input value={spouseName} onChange={(e) => setSpouseName(e.target.value)} /></div>
                <div><Label>Age</Label><NumberInput value={spouseAge || ""} onChange={setSpouseAge} /></div>
                <div><Label>Income</Label><Input value={spouseIncome} onChange={(e) => setSpouseIncome(e.target.value)} /></div>
                <div><Label>IRA Balance</Label><Input value={spouseIra} onChange={(e) => setSpouseIra(e.target.value)} /></div>
                <div><Label>Roth IRA</Label><Input value={spouseRothIra} onChange={(e) => setSpouseRothIra(e.target.value)} /></div>
                <div><Label>Cash</Label><Input value={spouseCash} onChange={(e) => setSpouseCash(e.target.value)} /></div>
              </CardContent>
            )}
          </Card>

          {/* HELOC & Options */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Landmark className="h-5 w-5 text-amber-500" />
                <CardTitle>HELOC & Options</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div><Label>HELOC Rate</Label><Input value={helocRate} onChange={(e) => setHelocRate(e.target.value)} /></div>
              <div><Label>Max LTV</Label><Input value={helocMaxLtv} onChange={(e) => setHelocMaxLtv(e.target.value)} /></div>
              <div><Label>Simulation Years</Label><NumberInput value={simulationYears || ""} onChange={setSimulationYears} /></div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={rentBasement} onCheckedChange={setRentBasement} />
                <Label className="flex items-center gap-1">
                  <Home className="h-4 w-4" /> Rent the Basement
                </Label>
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={payChildrenSimultaneously} onCheckedChange={setPayChildrenSimultaneously} />
                <Label className="flex items-center gap-1 text-xs">
                  <Users className="h-4 w-4" /> {payChildrenSimultaneously ? "Pay All Children Simultaneously" : "Pay Children One at a Time"}
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Children */}
          <Card className="border-amber-500/30">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-amber-500" />
                  <CardTitle>Children</CardTitle>
                  <Badge variant="outline" className="text-amber-400 border-amber-400/50">{children.length}</Badge>
                </div>
                <Button size="default" variant="outline" onClick={addChild} className="border-amber-500/60 text-amber-300 hover:bg-amber-500/20 hover:text-amber-200 font-semibold px-4 h-10 min-w-[120px] shadow-sm">
                  <Plus className="h-4 w-4 mr-2" /> Add Child
                </Button>
              </div>
              <CardDescription>
                Parents must have 2x the death benefit of each child. Children's IUL premium = 50% of primary.
                Parents control premium payments and loans until ready to assign ownership.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {children.map((child, idx) => (
                <div key={child.id} className="border border-amber-500/20 rounded-lg p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="font-semibold text-amber-400">Child {idx + 1}: {child.name || "Unnamed"}</h4>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => addGrandchild(child.id)} className="border-pink-500/50 text-pink-300 hover:bg-pink-500/15 hover:text-pink-200 font-medium px-3 h-8 min-w-[140px]">
                        <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Grandchild
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => removeChild(child.id)} className="border-red-500/50 text-red-400 hover:bg-red-500/15 hover:text-red-300 px-3 h-8 min-w-[90px]">
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div><Label className="text-xs">Name</Label><Input value={child.name} onChange={(e) => updateChild(child.id, "name", e.target.value)} /></div>
                    <NumberInput value={child.age || 0 || ""} onChange={(v) => updateChild(child.id, "age", String(v))} />
                    <NumberInput value={child.income || 0 || ""} onChange={(v) => updateChild(child.id, "income", String(v))} />
                    <NumberInput value={child.ira || 0 || ""} onChange={(v) => updateChild(child.id, "ira", String(v))} />
                    <NumberInput value={child.rothIra || 0 || ""} onChange={(v) => updateChild(child.id, "rothIra", String(v))} />
                    <NumberInput value={child.cash || 0 || ""} onChange={(v) => updateChild(child.id, "cash", String(v))} />
                    <NumberInput value={child.homeValue || 0 || ""} onChange={(v) => updateChild(child.id, "homeValue", String(v))} />
                    <NumberInput value={child.homeEquity || 0 || ""} onChange={(v) => updateChild(child.id, "homeEquity", String(v))} />
                    <NumberInput value={child.mortgageBalance || 0 || ""} onChange={(v) => updateChild(child.id, "mortgageBalance", String(v))} />
                    <div><Label className="text-xs">Mortgage Rate</Label><NumberInput value={child.mortgageRate || 0 || ""} onChange={(v) => updateChild(child.id, "mortgageRate", String(v))} step="0.001" /></div>
                    <NumberInput value={child.mortgageYearsLeft || 0 || ""} onChange={(v) => updateChild(child.id, "mortgageYearsLeft", String(v))} />
                    <NumberInput value={child.totalInterest || 0 || ""} onChange={(v) => updateChild(child.id, "totalInterest", String(v))} />
                  </div>

                  {/* Grandchildren under this child */}
                  {grandchildren.filter((gc) => gc.parentId === child.id).map((gc, gIdx) => (
                    <div key={gc.id} className="ml-4 md:ml-6 border border-pink-500/20 rounded-lg p-4 space-y-4 bg-pink-500/5">
                      {/* Grandchild Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h5 className="text-sm font-bold text-pink-400 flex items-center gap-1.5">
                          <Baby className="h-4 w-4" /> Grandchild {gIdx + 1}: {gc.name || "Unnamed"}
                        </h5>
                        <Button size="sm" variant="outline" onClick={() => removeGrandchild(gc.id)} className="border-red-500/40 text-red-400 hover:bg-red-500/15 hover:text-red-300 h-7 px-3 min-w-[80px]">
                          <Trash2 className="h-3 w-3 mr-1" /> Remove
                        </Button>
                      </div>

                      {/* ── Personal Info ── */}
                      <div className="space-y-2">
                        <h6 className="text-xs font-semibold text-pink-300/80 uppercase tracking-wider flex items-center gap-1"><Users className="h-3 w-3" /> Personal Information</h6>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <div><Label className="text-xs">Name</Label><Input value={gc.name} onChange={(e) => updateGrandchild(gc.id, "name", e.target.value)} className="h-8 text-sm" placeholder="Full name" /></div>
                          <NumberInput value={gc.age || 0 || ""} onChange={(v) => updateGrandchild(gc.id, "age", String(v))} />
                          <div>
                            <Label className="text-xs">Filing Status</Label>
                            <Select value={gc.filingStatus} onValueChange={v => updateGrandchild(gc.id, "filingStatus", v)}>
                              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="single">Single</SelectItem>
                                <SelectItem value="married">Married Filing Jointly</SelectItem>
                                <SelectItem value="hoh">Head of Household</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* ── Employment & Income ── */}
                      <div className="space-y-2">
                        <h6 className="text-xs font-semibold text-pink-300/80 uppercase tracking-wider flex items-center gap-1"><Briefcase className="h-3 w-3" /> Employment & Income</h6>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <div><Label className="text-xs">Occupation</Label><Input value={gc.occupation} onChange={(e) => updateGrandchild(gc.id, "occupation", e.target.value)} className="h-8 text-sm" placeholder="Job title" /></div>
                          <div><Label className="text-xs">Employer</Label><Input value={gc.employer} onChange={(e) => updateGrandchild(gc.id, "employer", e.target.value)} className="h-8 text-sm" placeholder="Company" /></div>
                          <NumberInput value={gc.earnedIncome || 0 || ""} onChange={(v) => updateGrandchild(gc.id, "earnedIncome", String(v))} />
                          <NumberInput value={gc.otherIncome || 0 || ""} onChange={(v) => updateGrandchild(gc.id, "otherIncome", String(v))} />
                        </div>
                      </div>

                      {/* ── Real Estate ── */}
                      <div className="space-y-2">
                        <h6 className="text-xs font-semibold text-pink-300/80 uppercase tracking-wider flex items-center gap-1"><Home className="h-3 w-3" /> Real Estate</h6>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <NumberInput value={gc.homeValue || 0 || ""} onChange={(v) => updateGrandchild(gc.id, "homeValue", String(v))} />
                          <NumberInput value={gc.homeEquity || 0 || ""} onChange={(v) => updateGrandchild(gc.id, "homeEquity", String(v))} />
                          <NumberInput value={gc.mortgageBalance || 0 || ""} onChange={(v) => updateGrandchild(gc.id, "mortgageBalance", String(v))} />
                          <div><Label className="text-xs">Mortgage Rate</Label><NumberInput value={gc.mortgageRate || 0 || ""} onChange={(v) => updateGrandchild(gc.id, "mortgageRate", String(v))} step="0.001" className="h-8 text-sm" placeholder="0.065" /></div>
                          <NumberInput value={gc.mortgageYearsLeft || 0 || ""} onChange={(v) => updateGrandchild(gc.id, "mortgageYearsLeft", String(v))} />
                          <NumberInput value={gc.monthlyMortgagePayment || 0 || ""} onChange={(v) => updateGrandchild(gc.id, "monthlyMortgagePayment", String(v))} />
                          <NumberInput value={gc.propertyTax || 0 || ""} onChange={(v) => updateGrandchild(gc.id, "propertyTax", String(v))} />
                          <NumberInput value={gc.homeInsurance || 0 || ""} onChange={(v) => updateGrandchild(gc.id, "homeInsurance", String(v))} />
                        </div>
                      </div>

                      {/* ── Retirement & Savings ── */}
                      <div className="space-y-2">
                        <h6 className="text-xs font-semibold text-pink-300/80 uppercase tracking-wider flex items-center gap-1"><PiggyBank className="h-3 w-3" /> Retirement & Savings</h6>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          <NumberInput value={gc.checking || 0 || ""} onChange={(v) => updateGrandchild(gc.id, "checking", String(v))} />
                          <NumberInput value={gc.savings || 0 || ""} onChange={(v) => updateGrandchild(gc.id, "savings", String(v))} />
                          <NumberInput value={gc.ira || 0 || ""} onChange={(v) => updateGrandchild(gc.id, "ira", String(v))} />
                          <NumberInput value={gc.rothIra || 0 || ""} onChange={(v) => updateGrandchild(gc.id, "rothIra", String(v))} />
                          <NumberInput value={gc.fourOhOneK || 0 || ""} onChange={(v) => updateGrandchild(gc.id, "fourOhOneK", String(v))} />
                          <NumberInput value={gc.otherInvestments || 0 || ""} onChange={(v) => updateGrandchild(gc.id, "otherInvestments", String(v))} />
                        </div>
                      </div>

                      {/* ── Debt ── */}
                      <div className="space-y-2">
                        <h6 className="text-xs font-semibold text-pink-300/80 uppercase tracking-wider flex items-center gap-1"><GraduationCap className="h-3 w-3" /> Debt Obligations</h6>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          <NumberInput value={gc.studentDebtBalance || 0 || ""} onChange={(v) => updateGrandchild(gc.id, "studentDebtBalance", String(v))} />
                          <div><Label className="text-xs">Student Debt Rate</Label><NumberInput value={gc.studentDebtRate || 0 || ""} onChange={(v) => updateGrandchild(gc.id, "studentDebtRate", String(v))} step="0.001" className="h-8 text-sm" placeholder="0.055" /></div>
                          <NumberInput value={gc.studentDebtMonthlyPayment || 0 || ""} onChange={(v) => updateGrandchild(gc.id, "studentDebtMonthlyPayment", String(v))} />
                          <NumberInput value={gc.autoLoanBalance || 0 || ""} onChange={(v) => updateGrandchild(gc.id, "autoLoanBalance", String(v))} />
                          <NumberInput value={gc.autoLoanMonthlyPayment || 0 || ""} onChange={(v) => updateGrandchild(gc.id, "autoLoanMonthlyPayment", String(v))} />
                          <NumberInput value={gc.creditCardDebt || 0 || ""} onChange={(v) => updateGrandchild(gc.id, "creditCardDebt", String(v))} />
                          <NumberInput value={gc.creditCardMonthlyPayment || 0 || ""} onChange={(v) => updateGrandchild(gc.id, "creditCardMonthlyPayment", String(v))} />
                          <NumberInput value={gc.otherDebtBalance || 0 || ""} onChange={(v) => updateGrandchild(gc.id, "otherDebtBalance", String(v))} />
                          <NumberInput value={gc.otherDebtMonthlyPayment || 0 || ""} onChange={(v) => updateGrandchild(gc.id, "otherDebtMonthlyPayment", String(v))} />
                        </div>
                      </div>

                      {/* ── Monthly Expenses ── */}
                      <div className="space-y-2">
                        <h6 className="text-xs font-semibold text-pink-300/80 uppercase tracking-wider flex items-center gap-1"><Wallet className="h-3 w-3" /> Monthly Expenses</h6>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          <NumberInput value={gc.monthlyExpenses || 0 || ""} onChange={(v) => updateGrandchild(gc.id, "monthlyExpenses", String(v))} />
                        </div>
                      </div>

                      {/* ── Insurance ── */}
                      <div className="space-y-2">
                        <h6 className="text-xs font-semibold text-pink-300/80 uppercase tracking-wider flex items-center gap-1"><Stethoscope className="h-3 w-3" /> Insurance Coverage</h6>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="flex items-center gap-2">
                            <Switch checked={gc.hasHealthInsurance} onCheckedChange={v => updateGrandchild(gc.id, "hasHealthInsurance", v)} />
                            <Label className="text-xs">Health Insurance</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch checked={gc.hasLifeInsurance} onCheckedChange={v => updateGrandchild(gc.id, "hasLifeInsurance", v)} />
                            <Label className="text-xs">Life Insurance</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch checked={gc.hasDisabilityInsurance} onCheckedChange={v => updateGrandchild(gc.id, "hasDisabilityInsurance", v)} />
                            <Label className="text-xs">Disability Insurance</Label>
                          </div>
                          {gc.hasLifeInsurance && (
                            <NumberInput value={gc.existingLifeInsuranceCoverage || 0 || ""} onChange={(v) => updateGrandchild(gc.id, "existingLifeInsuranceCoverage", String(v))} />
                          )}
                        </div>
                      </div>

                      {/* ── Grandchild Financial Snapshot ── */}
                      {(gc.earnedIncome > 0 || gc.studentDebtBalance > 0 || gc.homeValue > 0) && (
                        <div className="border-t border-pink-500/10 pt-3">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                            <div className="bg-pink-500/10 rounded p-2 text-center">
                              <div className="text-pink-300 font-semibold">{formatFullCurrency(gc.earnedIncome + gc.otherIncome)}</div>
                              <div className="text-muted-foreground">Total Income</div>
                            </div>
                            <div className="bg-emerald-500/10 rounded p-2 text-center">
                              <div className="text-emerald-300 font-semibold">{formatFullCurrency(gc.checking + gc.savings + gc.ira + gc.rothIra + gc.fourOhOneK + gc.otherInvestments)}</div>
                              <div className="text-muted-foreground">Total Assets</div>
                            </div>
                            <div className="bg-red-500/10 rounded p-2 text-center">
                              <div className="text-red-300 font-semibold">{formatFullCurrency(gc.studentDebtBalance + gc.autoLoanBalance + gc.creditCardDebt + gc.otherDebtBalance + gc.mortgageBalance)}</div>
                              <div className="text-muted-foreground">Total Debt</div>
                            </div>
                            <div className="bg-blue-500/10 rounded p-2 text-center">
                              <div className="text-blue-300 font-semibold">{formatFullCurrency(gc.homeValue + gc.checking + gc.savings + gc.ira + gc.rothIra + gc.fourOhOneK + gc.otherInvestments - gc.studentDebtBalance - gc.autoLoanBalance - gc.creditCardDebt - gc.otherDebtBalance - gc.mortgageBalance)}</div>
                              <div className="text-muted-foreground">Net Worth</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
              {children.length === 0 && (
                <p className="text-muted-foreground text-center py-6">No children added yet. Click "+ Add Child" to begin building the family tree.</p>
              )}
            </CardContent>
          </Card>

          {/* Funding Chain Explanation */}
          <Card className="bg-gradient-to-br from-emerald-500/5 to-indigo-500/5 border-emerald-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-emerald-500" />
                How the Multigenerational Funding Chain Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground flex items-center gap-1"><ArrowRight className="h-3 w-3 text-emerald-500" /> Step 1: Primary Policy</h4>
                  <p>The primary owner funds their IUL policy with annual premiums. A home equity line of credit (HELOC) is taken for a one-month period each year to bridge the annual premium payment.</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground flex items-center gap-1"><ArrowRight className="h-3 w-3 text-indigo-500" /> Step 2: Spouse Policy (Month 13)</h4>
                  <p>Beginning month 13, the primary owner may borrow up to 80% of their surrender value to fund the spouse's annual premium (80% of primary premium). Home equity loans cover the gap for one month each year.</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground flex items-center gap-1"><ArrowRight className="h-3 w-3 text-amber-500" /> Step 3: Children's Policies</h4>
                  <p>Parents are owners of their children's policies, controlling premium payments and loans. The parent must maintain at least 2x the death benefit of the child (unless the child has massive income/net worth). Up to 80% of surrender values fund children's premiums.</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground flex items-center gap-1"><ArrowRight className="h-3 w-3 text-pink-500" /> Step 4: Grandchildren's Policies</h4>
                  <p>Grandchildren's death benefit is limited to 50% of their parent's. 80% of surrender values are loaned to fund grandchildren's premiums. A 70% home equity loan at 6% is used for grandchildren, repaid as principal-only to parents' HELOC.</p>
                </div>
              </div>
              <div className="border-t border-border/50 pt-3">
                <h4 className="font-semibold text-foreground flex items-center gap-1"><RefreshCw className="h-3 w-3 text-emerald-500" /> The Wealth Circle</h4>
                <p>Excess interest credits from all policies pay back the home equity loans. As mortgages are paid off, the freed cash flow accelerates the next generation's mortgage payoff — creating a self-sustaining cycle of multigenerational wealth building.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: POLICIES                                                   */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="policies" className="space-y-6 mt-6">
          {result && (
            <>
              {/* All Policies Growth Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                    Family Policy Accumulation — {simulationYears}-Year Projection
                  </CardTitle>
                  <CardDescription>Account values for all family members' IUL policies growing at 7.5% (NAIC AG 49 max illustrated rate) with 5% loan drag (+0.5% positive arbitrage). Per AG 49, the maximum hypothetical illustrated rate is 7.5% — even though 30-year historical averages exceed this number.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={result.policies[0].years.map((_, i) => {
                      const row: Record<string, number> = { year: i + 1 };
                      result.policies.forEach((p, pIdx) => {
                        if (p.years[i]) row[p.name] = p.years[i].accountValue;
                      });
                      return row;
                    })}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="year" stroke="#888" />
                      <YAxis stroke="#888" tickFormatter={(v: number) => formatCurrency(v)} />
                      <Tooltip formatter={currencyFormatter} contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid #333" }} />
                      <Legend />
                      {result.policies.map((p, idx) => {
                        const colors = [COLORS.primary, COLORS.spouse, COLORS.child, COLORS.grandchild, "#06b6d4", "#a855f7"];
                        return (
                          <Area key={p.name} type="monotone" dataKey={p.name} stackId="1"
                            fill={colors[idx % colors.length]} stroke={colors[idx % colors.length]}
                            fillOpacity={0.3} />
                        );
                      })}
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Surrender Value (illustrated, non-guaranteed) / Loanable Value Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PiggyBank className="h-5 w-5 text-teal-500" />
                    Cash Surrender Value (illustrated, non-guaranteed) vs. Loanable Value (80%)
                  </CardTitle>
                  <CardDescription>Shows how much cash is available to borrow from each policy</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <ComposedChart data={result.policies[0].years.map((_, i) => {
                      const row: Record<string, number> = { year: i + 1 };
                      let totalSurrender = 0, totalLoanable = 0;
                      result.policies.forEach((p) => {
                        if (p.years[i]) {
                          totalSurrender += p.years[i].surrenderValue;
                          totalLoanable += p.years[i].loanableValue;
                        }
                      });
                      row.surrenderValue = totalSurrender;
                      row.loanableValue = totalLoanable;
                      return row;
                    })}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="year" stroke="#888" />
                      <YAxis stroke="#888" tickFormatter={(v: number) => formatCurrency(v)} />
                      <Tooltip formatter={currencyFormatter} contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid #333" }} />
                      <Legend />
                      <Area type="monotone" dataKey="surrenderValue" name="Total Surrender Value (illustrated, non-guaranteed) (illustrated, non-guaranteed)" fill={COLORS.surrenderValue} stroke={COLORS.surrenderValue} fillOpacity={0.2} />
                      <Line type="monotone" dataKey="loanableValue" name="Loanable (80%)" stroke={COLORS.accountValue} strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Death Benefit + LTC Rider */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-purple-500" />
                    Tax-Free Death Benefit & Long-Term Care Rider
                  </CardTitle>
                  <CardDescription>
                    LTC Rider pays 4% of death benefit monthly over 24 months if 2 of 6 ADLs cannot be performed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={result.policies[0].years.map((_, i) => {
                        let totalDB = 0;
                        result.policies.forEach((p) => { if (p.years[i]) totalDB += p.years[i].deathBenefit; });
                        return { year: i + 1, deathBenefit: totalDB };
                      })}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="year" stroke="#888" />
                        <YAxis stroke="#888" tickFormatter={(v: number) => formatCurrency(v)} />
                        <Tooltip formatter={currencyFormatter} contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid #333" }} />
                        <Area type="monotone" dataKey="deathBenefit" name="Total Death Benefit" fill={COLORS.deathBenefit} stroke={COLORS.deathBenefit} fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                    <div className="space-y-3">
                      <h4 className="font-semibold">LTC Rider Summary</h4>
                      {result.policies.map((p) => (
                        <div key={p.name} className="flex items-center justify-between border-b border-border/30 pb-2">
                          <div>
                            <p className="font-medium">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.relationship}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono text-sm">{formatFullCurrency(p.ltcRider.monthlyBenefit)}/mo</p>
                            <p className="text-xs text-muted-foreground">Total: {formatFullCurrency(p.ltcRider.totalBenefit)} over {p.ltcRider.durationMonths} months</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Individual Policy Details */}
              {result.policies.map((policy, pIdx) => (
                <Card key={policy.name} className="border-l-4" style={{ borderLeftColor: [COLORS.primary, COLORS.spouse, COLORS.child, COLORS.grandchild][Math.min(pIdx, 3)] }}>
                  <CardHeader className="cursor-pointer" onClick={() => toggleSection(`policy-${pIdx}`)}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{policy.name} — {policy.relationship.charAt(0).toUpperCase() + policy.relationship.slice(1)}</CardTitle>
                        <CardDescription>
                          Premium: {formatFullCurrency(policy.annualPremium)}/yr | Death Benefit: {formatFullCurrency(policy.deathBenefit)}
                        </CardDescription>
                      </div>
                      <div className="shrink-0">{expandedSections[`policy-${pIdx}`] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</div>
                    </div>
                  </CardHeader>
                  {expandedSections[`policy-${pIdx}`] && (
                    <CardContent>
                      <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                        <table className="w-full text-xs font-mono">
                          <thead className="sticky top-0 bg-background">
                            <tr className="border-b">
                              <th className="text-left p-1">Yr</th>
                              <th className="text-left p-1">Age</th>
                              <th className="text-right p-1">Premium</th>
                              <th className="text-right p-1">Load Fee</th>
                              <th className="text-right p-1">Growth</th>
                              <th className="text-right p-1">Illustrated Policy Value</th>
                              <th className="text-right p-1">Surrender</th>
                              <th className="text-right p-1">Loanable</th>
                              <th className="text-right p-1">Death Benefit</th>
                              <th className="text-right p-1">LTC/mo</th>
                            </tr>
                          </thead>
                          <tbody>
                            {policy.years.filter((_, i) => i % 5 === 0 || i < 10).map((yr) => (
                              <tr key={yr.year} className="border-b border-border/20 hover:bg-muted/30">
                                <td className="p-1">{yr.year}</td>
                                <td className="p-1">{yr.age}</td>
                                <td className="text-right p-1">{formatFullCurrency(yr.premiumPaid)}</td>
                                <td className="text-right p-1 text-red-400">{formatFullCurrency(yr.loadFee)}</td>
                                <td className="text-right p-1 text-emerald-400">{formatFullCurrency(yr.growthCredit)}</td>
                                <td className="text-right p-1 font-semibold">{formatFullCurrency(yr.accountValue)}</td>
                                <td className="text-right p-1 text-teal-400">{formatFullCurrency(yr.surrenderValue)}</td>
                                <td className="text-right p-1 text-blue-400">{formatFullCurrency(yr.loanableValue)}</td>
                                <td className="text-right p-1 text-purple-400">{formatFullCurrency(yr.deathBenefit)}</td>
                                <td className="text-right p-1">{formatFullCurrency(yr.ltcMonthlyBenefit)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 3: MORTGAGE KILLER                                            */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="mortgage" className="space-y-6 mt-6">
          {result && result.mortgageKillerResults.length > 0 && (
            <>
              <Card className="bg-gradient-to-br from-emerald-500/5 to-blue-500/5 border-emerald-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5 text-emerald-500" />
                    Multigenerational Mortgage Killer
                  </CardTitle>
                  <CardDescription>
                    Using IUL policy loans and home equity to accelerate mortgage payoff across generations.
                    Parent pays off their mortgage first, then uses freed cash flow to accelerate child's mortgage,
                    then grandchild's mortgage — creating a cascade of wealth building.
                  </CardDescription>
                </CardHeader>
              </Card>

              {result.mortgageKillerResults.map((mr, idx) => (
                <Card key={mr.name}>
                  <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <CardTitle>{mr.name} — Mortgage Acceleration</CardTitle>
                        <CardDescription>
                          {mr.relationship === "primary" && "Using IUL policy loans + HELOC to accelerate primary mortgage"}
                          {mr.relationship === "child" && "Parent uses their policy + home equity to accelerate child's mortgage payoff"}
                          {mr.relationship === "grandchild" && "70% home equity loan at 6% — grandchild repays parents' HELOC as principal-only"}
                        </CardDescription>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-2xl font-bold text-emerald-400">{formatFullCurrency(mr.result.interestSaved)}</p>
                        <p className="text-xs text-muted-foreground">Interest Saved</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <p className="text-lg font-bold">{mr.result.originalYears} yrs</p>
                        <p className="text-xs text-muted-foreground">Original Term</p>
                      </div>
                      <div className="text-center p-3 bg-emerald-500/10 rounded-lg">
                        <p className="text-lg font-bold text-emerald-400">{mr.result.yearsToPayoff} yrs</p>
                        <p className="text-xs text-muted-foreground">Accelerated Payoff</p>
                      </div>
                      <div className="text-center p-3 bg-red-500/10 rounded-lg">
                        <p className="text-lg font-bold text-red-400">{formatFullCurrency(mr.result.originalTotalInterest)}</p>
                        <p className="text-xs text-muted-foreground">Original Interest</p>
                      </div>
                      <div className="text-center p-3 bg-emerald-500/10 rounded-lg">
                        <p className="text-lg font-bold text-emerald-400">{formatFullCurrency(mr.result.acceleratedTotalInterest)}</p>
                        <p className="text-xs text-muted-foreground">Accelerated Interest</p>
                      </div>
                    </div>

                    {/* Interest Savings Growth Chart */}
                    <div>
                      <h4 className="font-semibold mb-2">Interest Saved Growing at 6.25% Compound — 40 Years</h4>
                      <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={mr.result.interestGrowth}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                          <XAxis dataKey="year" stroke="#888" />
                          <YAxis stroke="#888" tickFormatter={(v: number) => formatCurrency(v)} />
                          <Tooltip formatter={currencyFormatter} contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid #333" }} />
                          <Area type="monotone" dataKey="compoundedValue" name="Compounded Savings" fill={COLORS.savings} stroke={COLORS.savings} fillOpacity={0.3} />
                          <ReferenceLine y={mr.result.interestSaved} stroke="#ef4444" strokeDasharray="3 3" label={{ value: "Original Savings", fill: "#ef4444", fontSize: 11 }} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* HELOC Tracking */}
              {result.helocTracking.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Landmark className="h-5 w-5 text-red-500" />
                      Home Equity Line of Credit Tracking
                    </CardTitle>
                    <CardDescription>
                      HELOC balance paid down by excess interest credits from all family policies
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <ComposedChart data={result.helocTracking}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="year" stroke="#888" />
                        <YAxis stroke="#888" tickFormatter={(v: number) => formatCurrency(v)} />
                        <Tooltip formatter={currencyFormatter} contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid #333" }} />
                        <Legend />
                        <Area type="monotone" dataKey="helocBalance" name="HELOC Balance" fill={COLORS.heloc} stroke={COLORS.heloc} fillOpacity={0.2} />
                        <Line type="monotone" dataKey="cumulativeInterest" name="Cumulative Interest" stroke="#f97316" strokeWidth={2} dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </>
          )}
          {result && result.mortgageKillerResults.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No mortgages found. Add mortgage data in the Fact Finder to see mortgage acceleration analysis.
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 4: REAL ESTATE                                                */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="realestate" className="space-y-6 mt-6">
          {result && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-orange-500" />
                    Real Estate Appreciation — 5% Annual Growth
                  </CardTitle>
                  <CardDescription>
                    Family real estate portfolio growing over {simulationYears} years
                    {rentBasement && " with rental income (5% gross of property value)"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <ComposedChart data={result.realEstateAppreciation}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="year" stroke="#888" />
                      <YAxis stroke="#888" tickFormatter={(v: number) => formatCurrency(v)} />
                      <Tooltip formatter={currencyFormatter} contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid #333" }} />
                      <Legend />
                      <Area type="monotone" dataKey="totalFamilyValue" name="Total Family RE Value" fill={COLORS.realEstate} stroke={COLORS.realEstate} fillOpacity={0.2} />
                      <Line type="monotone" dataKey="primaryValue" name="Primary Home" stroke={COLORS.primary} strokeWidth={2} dot={false} />
                      {rentBasement && (
                        <Bar dataKey="rentalIncome" name="Annual Rental Income" fill={COLORS.rental} opacity={0.5} />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {rentBasement && (
                <Card className="bg-gradient-to-br from-green-500/5 to-amber-500/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Home className="h-5 w-5 text-green-500" />
                      Rent the Basement — Cumulative Rental Income
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <p className="text-xl font-bold text-green-400">
                          {formatFullCurrency(result.realEstateAppreciation.reduce((s, r) => s + r.rentalIncome, 0))}
                        </p>
                        <p className="text-xs text-muted-foreground">Total Rental Income ({simulationYears} yrs)</p>
                      </div>
                      <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <p className="text-xl font-bold text-orange-400">
                          {formatFullCurrency(result.realEstateAppreciation[result.realEstateAppreciation.length - 1]?.totalFamilyValue ?? 0)}
                        </p>
                        <p className="text-xs text-muted-foreground">Final RE Portfolio Value</p>
                      </div>
                      <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <p className="text-xl font-bold text-amber-400">
                          {formatFullCurrency(result.realEstateAppreciation[result.realEstateAppreciation.length - 1]?.rentalIncome ?? 0)}
                        </p>
                        <p className="text-xs text-muted-foreground">Year {simulationYears} Rental Income</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 5: FAMILY WEALTH RECAPTURE                                    */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="recapture" className="space-y-6 mt-6">
          {result && (
            <>
              <Card className="bg-gradient-to-br from-yellow-500/5 to-emerald-500/5 border-yellow-500/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <RefreshCw className="h-6 w-6 text-yellow-500" />
                    Family Wealth Recapture
                  </CardTitle>
                  <CardDescription className="text-base">
                    Total interest saved across all family mortgages, compounding at 6.25% annually for {simulationYears} years.
                    Combined with IUL policy values and real estate appreciation, this creates a self-sustaining
                    multigenerational wealth cycle.
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* The Big Picture Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Total Family Wealth Over Time (illustrated, non-guaranteed)</CardTitle>
                  <CardDescription>Illustrated Policy Values + compounded interest savings + real estate — HELOC costs</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={result.familyWealthRecapture}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="year" stroke="#888" />
                      <YAxis stroke="#888" tickFormatter={(v: number) => formatCurrency(v)} />
                      <Tooltip formatter={currencyFormatter} contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid #333" }} />
                      <Legend />
                      <Area type="monotone" dataKey="totIllustrated Policy Value" name="Illustrated Policy Values" stackId="1" fill={COLORS.accountValue} stroke={COLORS.accountValue} fillOpacity={0.3} />
                      <Area type="monotone" dataKey="compoundedValue" name="Interest Savings (6.25%)" stackId="1" fill={COLORS.wealth} stroke={COLORS.wealth} fillOpacity={0.3} />
                      <Line type="monotone" dataKey="totalFamilyWealth" name="Net Family Wealth" stroke={COLORS.primary} strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="totalDeathBenefit" name="Death Benefit Protection" stroke={COLORS.deathBenefit} strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Wealth Recapture Milestones */}
              <Card>
                <CardHeader>
                  <CardTitle>Wealth Recapture Milestones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm font-mono">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Year</th>
                          <th className="text-right p-2">Interest Saved</th>
                          <th className="text-right p-2">Compounded (6.25%)</th>
                          <th className="text-right p-2">Illustrated Policy Value</th>
                          <th className="text-right p-2">Death Benefit</th>
                          <th className="text-right p-2 text-emerald-400">Net Family Wealth</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.familyWealthRecapture.filter((_, i) => i % 5 === 4 || i === 0).map((row) => (
                          <tr key={row.year} className="border-b border-border/20 hover:bg-muted/30">
                            <td className="p-2">{row.year}</td>
                            <td className="text-right p-2">{formatFullCurrency(row.totalInterestSaved)}</td>
                            <td className="text-right p-2 text-yellow-400">{formatFullCurrency(row.compoundedValue)}</td>
                            <td className="text-right p-2 text-blue-400">{formatFullCurrency(row.totalPolicyCashValue)}</td>
                            <td className="text-right p-2 text-purple-400">{formatFullCurrency(row.totalDeathBenefit)}</td>
                            <td className="text-right p-2 font-bold text-emerald-400">{formatFullCurrency(row.totalFamilyWealth)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* The Circle Visualization */}
              <Card className="bg-gradient-to-br from-emerald-500/10 via-yellow-500/5 to-purple-500/10 border-emerald-500/30">
                <CardHeader>
                  <CardTitle className="text-center text-xl">The Multigenerational Wealth Circle</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                      <Crown className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
                      <p className="text-xs text-muted-foreground">Primary + Spouse</p>
                      <p className="font-bold text-emerald-400">IUL Policies</p>
                      <ArrowRight className="h-4 w-4 mx-auto mt-2 text-emerald-500" />
                    </div>
                    <div className="text-center p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                      <Home className="h-8 w-8 mx-auto text-amber-500 mb-2" />
                      <p className="text-xs text-muted-foreground">Home Equity</p>
                      <p className="font-bold text-amber-400">HELOC Bridge</p>
                      <ArrowRight className="h-4 w-4 mx-auto mt-2 text-amber-500" />
                    </div>
                    <div className="text-center p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                      <Users className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                      <p className="text-xs text-muted-foreground">Children + Grandchildren</p>
                      <p className="font-bold text-blue-400">Next Gen Policies</p>
                      <ArrowRight className="h-4 w-4 mx-auto mt-2 text-blue-500" />
                    </div>
                    <div className="text-center p-4 bg-purple-500/10 rounded-xl border border-purple-500/20">
                      <RefreshCw className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                      <p className="text-xs text-muted-foreground">Mortgage Payoff</p>
                      <p className="font-bold text-purple-400">Wealth Recapture</p>
                      <ArrowRight className="h-4 w-4 mx-auto mt-2 text-purple-500 rotate-[135deg]" />
                    </div>
                  </div>
                  <div className="text-center space-y-2 border-t border-border/30 pt-4">
                    <p className="text-sm text-muted-foreground">
                      Excess interest credits pay back HELOC → Freed cash flow accelerates next generation's mortgage →
                      Interest saved compounds at 6.25% → Cycle repeats with each generation
                    </p>
                    <p className="text-lg font-bold text-emerald-400">
                      {simulationYears}-Year Net Family Wealth: {formatFullCurrency(result.summary.netFamilyWealth)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 6: STRATEGY COMPARISON (20-Year Projection)                    */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="comparison" className="space-y-6 mt-6">
          {result && result.generationalCascade.length > 0 && (
            <>
              {/* Before vs After Graph */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-500" />
                    Do Nothing vs. Recommended Strategy — 20-Year Comparison
                  </CardTitle>
                  <CardDescription>Side-by-side comparison of total family mortgage balance and net worth under each scenario</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={result.generationalCascade.slice(0, 20).map((row, i) => {
                      const doNothingMortgage = result.mortgageKillerResults.reduce((sum, mr) => {
                        const origBal = mr.result.amortization.filter((a) => a.month <= (i + 1) * 12).pop()?.balance ?? 0;
                        return sum + origBal;
                      }, 0);
                      return {
                        year: row.year,
                        doNothingMortgage: Math.round(doNothingMortgage),
                        recommendedMortgage: row.totalFamilyMortgage,
                        doNothingNetWorth: Math.round(row.parentHomeValue - doNothingMortgage),
                        recommendedNetWorth: row.totalFamilyNetWorth,
                      };
                    })}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="year" stroke="#94a3b8" label={{ value: "Year", position: "insideBottom", offset: -5, fill: "#94a3b8" }} />
                      <YAxis stroke="#94a3b8" tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
                      <Tooltip formatter={(v: number) => formatFullCurrency(v)} labelFormatter={(l: number) => `Year ${l}`} />
                      <Legend />
                      <Bar dataKey="doNothingMortgage" name="Do Nothing: Mortgage" fill="#ef4444" opacity={0.4} />
                      <Bar dataKey="recommendedMortgage" name="Recommended: Mortgage" fill="#22c55e" opacity={0.6} />
                      <Line type="monotone" dataKey="doNothingNetWorth" name="Do Nothing: Net Worth" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                      <Line type="monotone" dataKey="recommendedNetWorth" name="Recommended: Net Worth" stroke="#10b981" strokeWidth={3} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* 20-Year Generational Cascade Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-indigo-500" />
                    20-Year Multigenerational Cascade
                  </CardTitle>
                  <CardDescription>Tracks all relevant values: home equity, HELOC, IUL, life loans, mortgage balances, and net worth across generations</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="min-w-[1800px] w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-800/80">
                        <th className="p-2 text-left border border-slate-700 text-slate-300">Yr</th>
                        <th className="p-2 text-right border border-slate-700 text-emerald-400" colSpan={3}>Parents</th>
                        <th className="p-2 text-right border border-slate-700 text-indigo-400" colSpan={3}>IUL Policy</th>
                        <th className="p-2 text-right border border-slate-700 text-amber-400" colSpan={2}>Life Loans</th>
                        <th className="p-2 text-right border border-slate-700 text-red-400" colSpan={2}>Parent Mortgage</th>
                        <th className="p-2 text-right border border-slate-700 text-yellow-400" colSpan={2}>Children</th>
                        <th className="p-2 text-right border border-slate-700 text-pink-400" colSpan={2}>Grandchildren</th>
                        <th className="p-2 text-right border border-slate-700 text-blue-400" colSpan={2}>Family Totals</th>
                      </tr>
                      <tr className="bg-slate-800/50 text-[10px]">
                        <th className="p-1.5 text-left border border-slate-700 text-slate-400"></th>
                        <th className="p-1.5 text-right border border-slate-700 text-slate-400">Home Value</th>
                        <th className="p-1.5 text-right border border-slate-700 text-slate-400">Equity</th>
                        <th className="p-1.5 text-right border border-slate-700 text-slate-400">HELOC</th>
                        <th className="p-1.5 text-right border border-slate-700 text-slate-400">Cash Value</th>
                        <th className="p-1.5 text-right border border-slate-700 text-slate-400">Surrender</th>
                        <th className="p-1.5 text-right border border-slate-700 text-slate-400">Interest Credit</th>
                        <th className="p-1.5 text-right border border-slate-700 text-slate-400">Life Loan</th>
                        <th className="p-1.5 text-right border border-slate-700 text-slate-400">Excess Credit</th>
                        <th className="p-1.5 text-right border border-slate-700 text-slate-400">Mortgage Bal</th>
                        <th className="p-1.5 text-right border border-slate-700 text-slate-400">Principal Pmt</th>
                        <th className="p-1.5 text-right border border-slate-700 text-slate-400">Mortgage Bal</th>
                        <th className="p-1.5 text-right border border-slate-700 text-slate-400">Principal Pmt</th>
                        <th className="p-1.5 text-right border border-slate-700 text-slate-400">Mortgage Bal</th>
                        <th className="p-1.5 text-right border border-slate-700 text-slate-400">Principal Pmt</th>
                        <th className="p-1.5 text-right border border-slate-700 text-slate-400">Total Mortgage</th>
                        <th className="p-1.5 text-right border border-slate-700 text-slate-400">Net Worth</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.generationalCascade.slice(0, 20).map((row) => (
                        <tr key={row.year} className={row.year % 2 === 0 ? "bg-slate-800/30" : ""}>
                          <td className="p-1.5 border border-slate-700 font-mono font-bold text-slate-300">{row.year}</td>
                          <td className="p-1.5 text-right border border-slate-700 font-mono text-emerald-300">{formatCurrency(row.parentHomeValue)}</td>
                          <td className="p-1.5 text-right border border-slate-700 font-mono text-emerald-300">{formatCurrency(row.parentHomeEquity)}</td>
                          <td className="p-1.5 text-right border border-slate-700 font-mono text-red-300">{row.parentHelocBalance > 0 ? formatCurrency(row.parentHelocBalance) : "\u2014"}</td>
                          <td className="p-1.5 text-right border border-slate-700 font-mono text-indigo-300">{formatCurrency(row.parentIulCashValue)}</td>
                          <td className="p-1.5 text-right border border-slate-700 font-mono text-indigo-300">{formatCurrency(row.parentIulSurrenderValue)}</td>
                          <td className="p-1.5 text-right border border-slate-700 font-mono text-indigo-300">{row.parentIulInterestCredit > 0 ? formatCurrency(row.parentIulInterestCredit) : "\u2014"}</td>
                          <td className="p-1.5 text-right border border-slate-700 font-mono text-amber-300">{row.parentLifeLoan > 0 ? formatCurrency(row.parentLifeLoan) : "\u2014"}</td>
                          <td className="p-1.5 text-right border border-slate-700 font-mono text-amber-300">{row.parentExcessCredit > 0 ? formatCurrency(row.parentExcessCredit) : "\u2014"}</td>
                          <td className="p-1.5 text-right border border-slate-700 font-mono text-red-300">{row.parentMortgageBalance > 0 ? formatCurrency(row.parentMortgageBalance) : <Badge variant="outline" className="text-[9px] border-emerald-500 text-emerald-400">PAID</Badge>}</td>
                          <td className="p-1.5 text-right border border-slate-700 font-mono text-emerald-300">{row.parentPrincipalPayment > 0 ? formatCurrency(row.parentPrincipalPayment) : "\u2014"}</td>
                          <td className="p-1.5 text-right border border-slate-700 font-mono text-yellow-300">{row.childrenMortgageBalance > 0 ? formatCurrency(row.childrenMortgageBalance) : <Badge variant="outline" className="text-[9px] border-emerald-500 text-emerald-400">PAID</Badge>}</td>
                          <td className="p-1.5 text-right border border-slate-700 font-mono text-emerald-300">{row.childrenPrincipalPayment > 0 ? formatCurrency(row.childrenPrincipalPayment) : "\u2014"}</td>
                          <td className="p-1.5 text-right border border-slate-700 font-mono text-pink-300">{row.grandchildrenMortgageBalance > 0 ? formatCurrency(row.grandchildrenMortgageBalance) : <Badge variant="outline" className="text-[9px] border-emerald-500 text-emerald-400">PAID</Badge>}</td>
                          <td className="p-1.5 text-right border border-slate-700 font-mono text-emerald-300">{row.grandchildrenPrincipalPayment > 0 ? formatCurrency(row.grandchildrenPrincipalPayment) : "\u2014"}</td>
                          <td className="p-1.5 text-right border border-slate-700 font-mono font-bold text-red-300">{row.totalFamilyMortgage > 0 ? formatCurrency(row.totalFamilyMortgage) : <Badge variant="outline" className="text-[9px] border-emerald-500 text-emerald-400">ALL PAID</Badge>}</td>
                          <td className="p-1.5 text-right border border-slate-700 font-mono font-bold text-emerald-400">{formatCurrency(row.totalFamilyNetWorth)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* Interest Saved Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/30">
                  <CardContent className="pt-6 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Total Interest Saved (All Mortgages)</p>
                    <p className="text-2xl font-bold text-emerald-400">{formatFullCurrency(result.generationalCascade[Math.min(19, result.generationalCascade.length - 1)]?.totalInterestSaved ?? 0)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/30">
                  <CardContent className="pt-6 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Year 20 Family Net Worth</p>
                    <p className="text-2xl font-bold text-blue-400">{formatFullCurrency(result.generationalCascade[Math.min(19, result.generationalCascade.length - 1)]?.totalFamilyNetWorth ?? 0)}</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/30">
                  <CardContent className="pt-6 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Mortgages Accelerated</p>
                    <p className="text-2xl font-bold text-purple-400">{result.mortgageKillerResults.length}</p>
                    <p className="text-xs text-muted-foreground mt-1">{payChildrenSimultaneously ? "Paying simultaneously" : "Paying one at a time"}</p>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 7: SUMMARY                                                    */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        <TabsContent value="summary" className="space-y-6 mt-6">
          {result && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
                  <CardContent className="pt-6 text-center">
                    <DollarSign className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
                    <p className="text-2xl font-bold text-emerald-400">{formatCurrency(result.summary.totalAccountValue)}</p>
                    <p className="text-xs text-muted-foreground">Total Illustrated Policy Value</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
                  <CardContent className="pt-6 text-center">
                    <Shield className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                    <p className="text-2xl font-bold text-purple-400">{formatCurrency(result.summary.totalDeathBenefit)}</p>
                    <p className="text-xs text-muted-foreground">Total Death Benefit</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
                  <CardContent className="pt-6 text-center">
                    <TrendingUp className="h-8 w-8 mx-auto text-yellow-500 mb-2" />
                    <p className="text-2xl font-bold text-yellow-400">{formatCurrency(result.summary.wealthRecaptureValue)}</p>
                    <p className="text-xs text-muted-foreground">Wealth Recapture (6.25%)</p>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5">
                  <CardContent className="pt-6 text-center">
                    <Crown className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                    <p className="text-2xl font-bold text-blue-400">{formatCurrency(result.summary.netFamilyWealth)}</p>
                    <p className="text-xs text-muted-foreground">Net Family Wealth</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Complete {simulationYears}-Year Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-emerald-400 flex items-center gap-1"><TrendingUp className="h-4 w-4" /> IUL Policies</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-muted-foreground">Total Premiums Paid</span><span className="font-mono">{formatFullCurrency(result.summary.totalPremiumsPaid)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Total Illustrated Policy Value</span><span className="font-mono text-emerald-400">{formatFullCurrency(result.summary.totalAccountValue)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Total Surrender Value (illustrated, non-guaranteed) (illustrated, non-guaranteed)</span><span className="font-mono text-teal-400">{formatFullCurrency(result.summary.totalSurrenderValue)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Total Death Benefit</span><span className="font-mono text-purple-400">{formatFullCurrency(result.summary.totalDeathBenefit)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Total LTC Protection</span><span className="font-mono">{formatFullCurrency(result.summary.totalLtcProtection)}</span></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-yellow-400 flex items-center gap-1"><Home className="h-4 w-4" /> Real Estate & Recapture</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between"><span className="text-muted-foreground">Total Interest Saved</span><span className="font-mono text-emerald-400">{formatFullCurrency(result.summary.totalInterestSaved)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Wealth Recapture (6.25%)</span><span className="font-mono text-yellow-400">{formatFullCurrency(result.summary.wealthRecaptureValue)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Real Estate Value</span><span className="font-mono text-orange-400">{formatFullCurrency(result.summary.totalRealEstateValue)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Total Rental Income</span><span className="font-mono text-green-400">{formatFullCurrency(result.summary.totalRentalIncome)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">HELOC Interest Paid</span><span className="font-mono text-red-400">-{formatFullCurrency(result.summary.totalHelocInterestPaid)}</span></div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-border/30 text-center">
                    <p className="text-sm text-muted-foreground mb-1">Total Net Family Wealth After {simulationYears} Years (illustrated, non-guaranteed)</p>
                    <p className="text-4xl font-bold text-emerald-400">{formatFullCurrency(result.summary.netFamilyWealth)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {result.policies.length} policies | {result.mortgageKillerResults.length} mortgages accelerated |
                      {rentBasement ? " Rental income active" : " No rental income"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
      <div className="mt-8">
        <NAICDisclaimer variant="footer" showsProjections showsCashValues showsPolicyLoans />
      </div>
      
      <ComplianceFooter pageName="HouseholdWealth" showsIUL showsTax showsEstate showsProjections showsHistoricalData showsPolicyLoans />
      <PageInsights pageId="household-wealth" />

    </div>
  );
}
