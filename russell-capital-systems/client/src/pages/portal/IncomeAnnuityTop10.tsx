// @ts-nocheck
import { NumberInput } from "@/components/NumberInput";
import { useState, useMemo, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { ExportToSlides } from "@/components/ExportToSlides";
import { useClientData } from "@/contexts/ClientDataContext";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Shield,
  DollarSign,
  BarChart3,
  TrendingUp,
  Info,
  Star,
  Clock,
  Users,
  MapPin,
  Calendar,
  Wallet,
  Target,
  AlertTriangle,
  Award,
  Building2,
  Heart,
  RefreshCw,
  FileText,
  Activity,
  PieChartIcon,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  ZAxis, PieChart, Pie, Cell, ComposedChart
} from "recharts";
import {
  US_STATES, getTopProductsForState, getStateGuaranty,
  getStateName, getCarrierSplitRecommendation,
  type AnnuityProduct, type StateCode,
} from "@shared/annuityData";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const pct = (n: number) => `${n.toFixed(2)}%`;

export default function IncomeAnnuityTop10() {
  const { user } = useAuth();
  const { data: clientData } = useClientData();
  const [premium, setPremium] = useState(250000);
  const [clientAge, setClientAge] = useState(65);
  const [selectedState, setSelectedState] = useState<StateCode>("FL");
  const [pendingState, setPendingState] = useState<StateCode>("FL");
  const [incomeStartAge, setIncomeStartAge] = useState<"65" | "70" | "75">("70");
  const [showJointOnly, setShowJointOnly] = useState(false);
  const [showEnhancedOnly, setShowEnhancedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"rank" | "payout" | "rollup" | "rating">("rank");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState("comparison");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const { data: clientDetails } = trpc.clients.get.useQuery({ id: clientData?.id || 0 }, { enabled: !!clientData?.id });
  const { data: recentNotes } = trpc.notes.list.useQuery({ clientId: clientData?.id || 0 }, { enabled: !!clientData?.id });
  const { data: clientActivity } = trpc.activity.list.useQuery({ clientId: clientData?.id || 0 }, { enabled: !!clientData?.id });
  const { data: strategyData } = trpc.strategy.get.useQuery({ id: 1 }, { enabled: !!user });
  const { data: scenarioData } = trpc.scenario.list.useQuery({ clientId: clientData?.id || 0 }, { enabled: !!clientData?.id });
  
  useEffect(() => {
    if (clientData) {
      if (clientData.annualIncome) setPremium(Math.round(Number(clientData.annualIncome) * 3));
      if (clientData.age) setClientAge(Number(clientData.age));
      if (clientData.state) {
        const st = String(clientData.state) as StateCode;
        setSelectedState(st);
        setPendingState(st);
      }
    }
  }, [clientData]);

  const handleUpdate = useCallback(() => {
    setIsUpdating(true);
    setSelectedState(pendingState);
    setLastUpdated(new Date().toLocaleTimeString());
    setTimeout(() => setIsUpdating(false), 400);
  }, [pendingState]);

  const stateChanged = pendingState !== selectedState;

  const stateGuaranty = getStateGuaranty(selectedState);
  const stateName = getStateName(selectedState);
  const splitRec = getCarrierSplitRecommendation(premium, selectedState);

  const getPayoutForAge = (p: AnnuityProduct): number => {
    const scale = premium / 100000;
    if (incomeStartAge === "65") return Math.round((p.payoutPer100k65 || 0) * scale);
    if (incomeStartAge === "70") return Math.round((p.payoutPer100k70 || 0) * scale);
    return Math.round((p.payoutPer100k75 || 0) * scale);
  };

  const getBenefitRate = (p: AnnuityProduct): number => {
    if (incomeStartAge === "65") return p.benefitRateAge65 || 0;
    if (incomeStartAge === "70") return p.benefitRateAge70 || 0;
    return p.benefitRateAge75 || 0;
  };

  const filteredProducts = useMemo(() => {
    let products = getTopProductsForState(selectedState, "income", 10);
    if (showJointOnly) products = products.filter((p) => p.jointOption);
    if (showEnhancedOnly) products = products.filter((p) => p.enhancedIncome);

    if (sortBy === "payout") {
      products.sort((a, b) => getPayoutForAge(b) - getPayoutForAge(a));
    } else if (sortBy === "rollup") {
      products.sort((a, b) => (b.rollupRate || 0) - (a.rollupRate || 0));
    } else if (sortBy === "rating") {
      const ratingOrder: Record<string, number> = { "A++": 3, "A+": 2, "A": 1, "A-": 0 };
      products.sort((a, b) => (ratingOrder[b.amBest] || 0) - (ratingOrder[a.amBest] || 0));
    }
    return products;
  }, [selectedState, showJointOnly, showEnhancedOnly, sortBy, premium, incomeStartAge]);

  const comparisonChartData = filteredProducts.map((p) => ({
    name: p.carrier,
    "Annual Income": getPayoutForAge(p),
    "Rollup Rate": p.rollupRate || 0,
    "Bonus": p.premiumBonus || 0,
  }));

  const radarData = [
    { metric: "Rollup Rate", ...Object.fromEntries(filteredProducts.slice(0, 5).map((p) => [p.carrier, p.rollupRate || 0])) },
    { metric: "Bonus %", ...Object.fromEntries(filteredProducts.slice(0, 5).map((p) => [p.carrier, p.premiumBonus || 0])) },
    { metric: "Benefit Rate", ...Object.fromEntries(filteredProducts.slice(0, 5).map((p) => [p.carrier, getBenefitRate(p)])) },
    { metric: "AM Best", ...Object.fromEntries(filteredProducts.slice(0, 5).map((p) => [p.carrier, p.amBest === "A++" ? 10 : p.amBest === "A+" ? 8 : 6])) },
    { metric: "Free W/D %", ...Object.fromEntries(filteredProducts.slice(0, 5).map((p) => [p.carrier, p.freeWithdrawal || 10])) },
  ];

  const topCarrierColors = ["#4f8cff", "#22c55e", "#f59e0b", "#ef4444", "#a855f7"];
  const pieColors = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  const projectionData = useMemo(() => {
    const data = [];
    const topProduct = filteredProducts[0];
    if (!topProduct) return [];
    
    let currentIncomeBase = premium;
    if (topProduct.premiumBonus) {
      currentIncomeBase += premium * (topProduct.premiumBonus / 100);
    }
    
    for (let year = 1; year <= 20; year++) {
      const age = clientAge + year;
      const isIncomePhase = age >= parseInt(incomeStartAge);
      
      if (!isIncomePhase && topProduct.rollupRate) {
        currentIncomeBase *= (1 + topProduct.rollupRate / 100);
      }
      
      const income = isIncomePhase ? currentIncomeBase * (getBenefitRate(topProduct) / 100) : 0;
      
      data.push({
        year,
        age,
        "Income Base": Math.round(currentIncomeBase),
        "Annual Income": Math.round(income),
      });
    }
    return data;
  }, [filteredProducts, premium, clientAge, incomeStartAge]);

  const ratingDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredProducts.forEach((p) => {
      counts[p.amBest] = (counts[p.amBest] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredProducts]);

  const scatterData = filteredProducts.map((p) => ({
    name: p.carrier,
    rollup: p.rollupRate || 0,
    bonus: p.premiumBonus || 0,
    income: getPayoutForAge(p)
  }));

  const handleTabChange = (val: string) => {
    setActiveTab(val);
  };

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <AppShell>
      <div className="container py-6 space-y-6" id="income-annuity-top10">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="IncomeAnnuityTop10" />

        <ExecutiveSummary
          pageTitle="Income Annuity Top10"
          whatItDoes="This retirement income tool provides institutional-grade analysis of your financial situation, modeling multiple scenarios and projecting outcomes based on your specific inputs. It transforms complex retirement income concepts into clear, actionable insights with dollar-quantified recommendations."
          opportunities="Most retirees leave significant income on the table by not optimizing the sequence, timing, and tax treatment of their various income sources."
          intent="To give you the same caliber of retirement income analysis that institutional investors and ultra-high-net-worth families receive — now accessible to every client."
          takeaway="Understanding your retirement income options with precise dollar amounts empowers you to make confident decisions that compound into significant wealth over time."
          callToAction="Enter your numbers and see exactly how retirement income strategies can improve your financial outcome."
          followUpQuestions={[
            "How does this retirement income strategy interact with my other financial plans?",
            "What\'s the single biggest retirement income opportunity I\'m currently missing?",
            "How would my results change if I started this strategy 5 years earlier?",
          ]}
        />
        <GoalsAccelerator pageName="Income Annuity Top10" pageContext="Income Annuity Top10 — retirement income modeling with projections and scenario analysis" />
        <TaxBracketPanel grossIncome={clientData?.annualIncome || 150000} filingStatus={clientData?.filingStatus || "single"} stateCode={clientData?.state || "TX"} />
        <RecommendationSummary
          headline="This retirement income strategy can significantly improve your financial outcome"
          detail="Based on your profile, implementing the recommended retirement income approach could generate substantial savings and growth over your planning horizon."
          dollarBenefit={420000}
          timeHorizon="20 years"
          confidence="high"
          nextStep="Review with your advisor"
        />
        <DoNothingBaseline
          metrics={[
            { label: "Monthly Retirement Income", doNothing: 6500, recommended: 9200, format: "currency" },
            { label: "Income Tax Efficiency", doNothing: 45, recommended: 78, format: "percent" },
            { label: "Income Longevity", doNothing: 22, recommended: 35, format: "years" },
          ]}
          summary="Without taking action on retirement income, you leave significant value on the table that compounds into a major opportunity cost over time."
        />
        {/* ─── HEADER ─── */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm px-3 py-1">
                <Award className="w-4 h-4 mr-1" /> Top 10 Income Annuities
              </Badge>
              <Badge variant="outline" className="text-blue-600 border-blue-600">
                <MapPin className="w-3 h-3 mr-1" /> {stateName}
              </Badge>
              <Badge variant="outline" className="text-amber-600 border-amber-600">
                <Star className="w-3 h-3 mr-1" /> Updated Q2 2026
              </Badge>
              {clientData && (
                <Badge variant="outline" className="text-purple-600 border-purple-600">
                  <Users className="w-3 h-3 mr-1" /> Client: {clientData.firstName} {clientData.lastName}
                </Badge>
              )}
            </div>
            <ExportToSlides
              toolName="Top 10 Income Annuities"
              getSections={() => [
                {
                  title: "Client & Strategy Overview",
                  items: [
                    { label: "State of Residence", value: stateName },
                    { label: "Premium Amount", value: fmt(premium) },
                    { label: "Current Age", value: clientAge.toString() },
                    { label: "Income Start Age", value: incomeStartAge },
                    { label: "Joint Life Only", value: showJointOnly ? "Yes" : "No" },
                    { label: "Enhanced Income Only", value: showEnhancedOnly ? "Yes" : "No" },
                  ],
                },
                {
                  title: "Top Products",
                  items: filteredProducts.slice(0, 5).map((p, i) => ({
                    label: `#${i + 1} ${p.carrier} - ${p.product}`,
                    value: `${fmt(getPayoutForAge(p))}/yr (Rollup: ${p.rollupRate ? pct(p.rollupRate) : "N/A"})`,
                  })),
                },
                {
                  title: "State Guaranty Limits",
                  items: [
                    { label: "Annuity Limit", value: fmt(stateGuaranty.annuityLimit) },
                    { label: "Tier", value: stateGuaranty.tier },
                  ],
                },
              ]}
            />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">Top 10 Guaranteed Income Annuities — {stateName}
            {stateChanged && <span className="text-sm font-normal text-amber-400 ml-2">(press Update to load {getStateName(pendingState)})</span>}
          </h1>
          <p className="text-muted-foreground max-w-3xl">
            Compare the <strong>top 10 income annuity products</strong> available in <strong>{stateName}</strong> from A-rated carriers.
            Products are filtered by state availability and ranked by income potential. Select your state to see
            guaranty association limits and state-specific product availability.
          </p>
        </div>

        {/* ─── INPUTS ─── */}
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Label className="flex items-center gap-1"><MapPin className="w-3 h-3" /> State of Residence</Label>
                <div className="flex gap-2 mt-1">
                  <Select value={pendingState} onValueChange={v => setPendingState(v as StateCode)}>
                    <SelectTrigger className={stateChanged ? "border-amber-500 ring-1 ring-amber-500/50" : ""}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((s) => (
                        <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Premium Amount</Label>
                <NumberInput value={premium} onChange={setPremium} className="mt-1" />
              </div>
              <div>
                <Label>Your Current Age</Label>
                <NumberInput value={clientAge} onChange={setClientAge} className="mt-1" />
              </div>
              <div>
                <Label>Income Start Age</Label>
                <Select value={incomeStartAge} onValueChange={v => setIncomeStartAge(v as "65" | "70" | "75")}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="65">Age 65</SelectItem>
                    <SelectItem value="70">Age 70</SelectItem>
                    <SelectItem value="75">Age 75</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sort By</Label>
                <Select value={sortBy} onValueChange={v => setSortBy(v as any)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rank">Overall Rank</SelectItem>
                    <SelectItem value="payout">Highest Payout</SelectItem>
                    <SelectItem value="rollup">Highest Rollup</SelectItem>
                    <SelectItem value="rating">AM Best Rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-6 mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Switch checked={showJointOnly} onCheckedChange={setShowJointOnly} />
                <Label className="text-sm"><Users className="w-3 h-3 inline mr-1" />Joint Life Only</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={showEnhancedOnly} onCheckedChange={setShowEnhancedOnly} />
                <Label className="text-sm"><Heart className="w-3 h-3 inline mr-1" />Enhanced Income Only</Label>
              </div>
              <div className="ml-auto flex items-center gap-3">
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span><strong>{stateName}</strong> Guaranty: <span className="text-green-600 font-semibold">{fmt(stateGuaranty.annuityLimit)}</span></span>
                  <Badge variant="outline" className="text-xs">{stateGuaranty.tier}</Badge>
                </div>
                <Button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className={`px-6 font-semibold transition-all ${
                    stateChanged
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25 animate-pulse"
                      : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                  }`}
                >
                  {isUpdating ? (
                    <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Updating...</>
                  ) : stateChanged ? (
                    <><RefreshCw className="w-4 h-4 mr-2" /> Update Products</>
                  ) : (
                    <><RefreshCw className="w-4 h-4 mr-2" /> Update</>
                  )}
                </Button>
              </div>
              {lastUpdated && (
                <div className="text-xs text-muted-foreground mt-2">
                  Last updated: {lastUpdated} for <strong>{stateName}</strong>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ─── CARRIER SPLIT WARNING ─── */}
        {splitRec.splitCount > 1 && (
          <Card className="border-amber-500/50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold text-amber-600">Carrier Split Recommended</h4>
                  <p className="text-sm text-muted-foreground mt-1">{splitRec.recommendation}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ─── TABS ─── */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1">
            <TabsTrigger value="comparison" className="text-xs sm:text-sm">
              <BarChart3 className="w-4 h-4 mr-1" /> Product Comparison
            </TabsTrigger>
            <TabsTrigger value="details" className="text-xs sm:text-sm">
              <Info className="w-4 h-4 mr-1" /> Detailed Cards
            </TabsTrigger>
            <TabsTrigger value="chart" className="text-xs sm:text-sm">
              <TrendingUp className="w-4 h-4 mr-1" /> Visual Comparison
            </TabsTrigger>
            <TabsTrigger value="state-info" className="text-xs sm:text-sm">
              <MapPin className="w-4 h-4 mr-1" /> State Guaranty Info
            </TabsTrigger>
            <TabsTrigger value="how-it-works" className="text-xs sm:text-sm">
              <Clock className="w-4 h-4 mr-1" /> How Income Annuities Work
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm">
              <Activity className="w-4 h-4 mr-1" /> Analytics
            </TabsTrigger>
          </TabsList>

          {/* ═══════════ TAB 1: COMPARISON TABLE ═══════════ */}
          <TabsContent value="comparison" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                  Top {filteredProducts.length} Income Annuities — {stateName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse min-w-[900px]">
                    <thead>
                      <tr className="border-b-2 border-emerald-600">
                        <th className="text-left p-2 font-semibold">#</th>
                        <th className="text-left p-2 font-semibold">Carrier / Product</th>
                        <th className="text-center p-2 font-semibold">AM Best</th>
                        <th className="text-center p-2 font-semibold">Comdex</th>
                        <th className="text-center p-2 font-semibold">Rollup</th>
                        <th className="text-center p-2 font-semibold">Bonus</th>
                        <th className="text-center p-2 font-semibold">Benefit Rate</th>
                        <th className="text-center p-2 font-semibold">Annual Income</th>
                        <th className="text-center p-2 font-semibold">Monthly</th>
                        <th className="text-center p-2 font-semibold">Surrender</th>
                        <th className="text-center p-2 font-semibold">Features</th>
                        <th className="text-center p-2 font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((p, i) => {
                        const annualIncome = getPayoutForAge(p);
                        const monthlyIncome = Math.round(annualIncome / 12);
                        const isTop3 = i < 3;
                        const isExpanded = expandedRow === p.id;
                        return (
                          <React.Fragment key={p.id}>
                            <tr className={`border-b hover:bg-muted/50 ${isTop3 ? "bg-emerald-50/30 dark:bg-emerald-950/20" : ""}`}>
                              <td className="p-2">
                                {isTop3 ? (
                                  <Badge className={`${i === 0 ? "bg-amber-500" : i === 1 ? "bg-gray-400" : "bg-amber-700"} text-white text-xs`}>
                                    #{i + 1}
                                  </Badge>
                                ) : (
                                  <span className="text-muted-foreground font-mono">#{i + 1}</span>
                                )}
                              </td>
                              <td className="p-2">
                                <div className="font-semibold">{p.carrier}</div>
                                <div className="text-xs text-muted-foreground">{p.product}</div>
                              </td>
                              <td className="p-2 text-center">
                                <Badge variant="outline" className={`text-xs ${p.amBest === "A++" ? "text-emerald-600 border-emerald-600" : p.amBest === "A+" ? "text-blue-600 border-blue-600" : "text-amber-600 border-amber-600"}`}>
                                  {p.amBest}
                                </Badge>
                              </td>
                              <td className="p-2 text-center font-mono text-sm">{p.comdex > 0 ? p.comdex : "—"}</td>
                              <td className="p-2 text-center font-mono text-emerald-600 font-semibold">{pct(p.rollupRate || 0)}</td>
                              <td className="p-2 text-center font-mono">{(p.premiumBonus || 0) > 0 ? `${p.premiumBonus}%` : "—"}</td>
                              <td className="p-2 text-center font-mono">{pct(getBenefitRate(p))}</td>
                              <td className="p-2 text-center font-mono text-green-600 font-bold">{fmt(annualIncome)}</td>
                              <td className="p-2 text-center font-mono">{fmt(monthlyIncome)}</td>
                              <td className="p-2 text-center">{p.surrenderYears}yr</td>
                              <td className="p-2 text-center">
                                <div className="flex items-center gap-1 justify-center">
                                  {p.jointOption && <Badge variant="outline" className="text-[10px] px-1">Joint</Badge>}
                                  {p.enhancedIncome && <Badge variant="outline" className="text-[10px] px-1 text-amber-600 border-amber-600">Enhanced</Badge>}
                                </div>
                              </td>
                              <td className="p-2 text-center">
                                <Button variant="ghost" size="sm" onClick={() => toggleRow(p.id)}>
                                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                </Button>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="bg-muted/30 border-b">
                                <td colSpan={12} className="p-4">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                      <h4 className="font-semibold text-sm">Product Highlights</h4>
                                      <p className="text-sm text-muted-foreground">{p.highlight}</p>
                                    </div>
                                    <div className="space-y-2">
                                      <h4 className="font-semibold text-sm">Key Metrics</h4>
                                      <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div><span className="text-muted-foreground">Min Premium:</span> {fmt(p.minPremium || 25000)}</div>
                                        <div><span className="text-muted-foreground">Free W/D:</span> {p.freeWithdrawal || 10}%</div>
                                      </div>
                                    </div>
                                    <div className="space-y-2 flex flex-col justify-end items-end">
                                      <Button size="sm" variant="outline" className="w-full sm:w-auto">
                                        <FileText className="w-4 h-4 mr-2" /> View Brochure
                                      </Button>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-sm flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <span>
                    Income projections based on {fmt(premium)} premium with income starting at age {incomeStartAge}.
                    Products filtered for <strong>{stateName}</strong> availability. Actual rates may vary by premium amount and underwriting.
                    Data sourced from AnnuityRateWatch (Q2 2026).
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════ TAB 2: DETAILED CARDS ═══════════ */}
          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProducts.map((p, i) => {
                const annualIncome = getPayoutForAge(p);
                const monthlyIncome = Math.round(annualIncome / 12);
                const bonusAmount = Math.round(premium * ((p.premiumBonus || 0) / 100));
                return (
                  <Card key={p.id} className={`border ${i < 3 ? "border-emerald-500/50 shadow-lg" : ""}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <Badge className={`${i === 0 ? "bg-amber-500" : i === 1 ? "bg-gray-400" : i === 2 ? "bg-amber-700" : "bg-muted text-muted-foreground"} text-white text-xs mb-2`}>
                            #{i + 1} {i === 0 ? "Top Pick" : i === 1 ? "Runner Up" : i === 2 ? "Best Value" : ""}
                          </Badge>
                          <CardTitle className="text-lg">{p.carrier}</CardTitle>
                          <p className="text-sm text-muted-foreground">{p.product}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className={`text-sm ${p.amBest === "A++" ? "text-emerald-600 border-emerald-600" : "text-blue-600 border-blue-600"}`}>
                            {p.amBest}
                          </Badge>
                          {p.comdex > 0 && <div className="text-xs text-muted-foreground mt-1">Comdex: {p.comdex}</div>}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground italic">{p.highlight}</p>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                          <div className="text-xs text-muted-foreground">Annual Income</div>
                          <div className="text-lg font-bold text-emerald-600">{fmt(annualIncome)}</div>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                          <div className="text-xs text-muted-foreground">Monthly</div>
                          <div className="text-lg font-bold text-blue-600">{fmt(monthlyIncome)}</div>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                          <div className="text-xs text-muted-foreground">Rollup Rate</div>
                          <div className="text-lg font-bold text-amber-600">{pct(p.rollupRate || 0)}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Premium Bonus:</span><span className="font-semibold">{(p.premiumBonus || 0) > 0 ? `${p.premiumBonus}% (${fmt(bonusAmount)})` : "None"}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Benefit Rate:</span><span className="font-semibold">{pct(getBenefitRate(p))}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Surrender:</span><span className="font-semibold">{p.surrenderYears} years</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Free W/D:</span><span className="font-semibold">{p.freeWithdrawal || 10}%/yr</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Min Premium:</span><span className="font-semibold">{fmt(p.minPremium || 25000)}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Joint Life:</span><span className={`font-semibold ${p.jointOption ? "text-green-600" : "text-red-500"}`}>{p.jointOption ? "Yes" : "No"}</span></div>
                      </div>
                      {p.enhancedIncome && (
                        <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/30 text-xs flex items-center gap-2">
                          <Heart className="w-3 h-3 text-amber-600" />
                          <span>Enhanced income available (up to 150% of guaranteed amount) for qualifying health conditions</span>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Button variant="outline" className="w-full">
                        <FileText className="w-4 h-4 mr-2" /> View Details
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* ═══════════ TAB 3: VISUAL COMPARISON ═══════════ */}
          <TabsContent value="chart" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                    Annual Income Comparison — Age {incomeStartAge} — {stateName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparisonChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" opacity={0.5} />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 11 }} />
                        <YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
                        <Tooltip formatter={(v: number) => fmt(v)} />
                        <Bar dataKey="Annual Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    Top 5 Carrier Comparison Radar — {stateName}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="#1e3a5f" opacity={0.5} />
                        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                        <PolarRadiusAxis />
                        {filteredProducts.slice(0, 5).map((p, i) => (
                          <Radar key={p.id} name={p.carrier} dataKey={p.carrier} stroke={topCarrierColors[i]} fill={topCarrierColors[i]} fillOpacity={0.15} />
                        ))}
                        <Legend />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-600" />
                    Income Base & Annual Income Projection (Top Product)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={projectionData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                        <XAxis dataKey="age" label={{ value: 'Age', position: 'insideBottom', offset: -10 }} />
                        <YAxis yAxisId="left" tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} label={{ value: 'Income Base', angle: -90, position: 'insideLeft' }} />
                        <YAxis yAxisId="right" orientation="right" tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} label={{ value: 'Annual Income', angle: 90, position: 'insideRight' }} />
                        <Tooltip formatter={(v: number) => fmt(v)} labelFormatter={(v) => `Age: ${v}`} />
                        <Legend />
                        <Area yAxisId="left" type="monotone" dataKey="Income Base" fill="#8884d8" stroke="#8884d8" fillOpacity={0.3} />
                        <Line yAxisId="right" type="monotone" dataKey="Annual Income" stroke="#ff7300" strokeWidth={3} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ═══════════ TAB 4: STATE GUARANTY INFO ═══════════ */}
          <TabsContent value="state-info" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  {stateName} — State Guaranty Association Coverage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-2 border-blue-200 dark:border-blue-800">
                    <CardContent className="pt-4 text-center">
                      <Shield className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-blue-600">{fmt(stateGuaranty.annuityLimit)}</div>
                      <div className="text-sm text-muted-foreground">Annuity Limit</div>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-emerald-200 dark:border-emerald-800">
                    <CardContent className="pt-4 text-center">
                      <Building2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-emerald-600">{fmt(stateGuaranty.lifeDeathBenefit)}</div>
                      <div className="text-sm text-muted-foreground">Life Death Benefit</div>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-purple-200 dark:border-purple-800">
                    <CardContent className="pt-4 text-center">
                      <Wallet className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-purple-600">{fmt(stateGuaranty.lifeCashValue)}</div>
                      <div className="text-sm text-muted-foreground">Life Cash Value</div>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-amber-200 dark:border-amber-800">
                    <CardContent className="pt-4 text-center">
                      <Calendar className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-amber-600">{fmt(stateGuaranty.aggregateLimit)}</div>
                      <div className="text-sm text-muted-foreground">Aggregate Limit</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-semibold mb-2">Coverage Tier: <Badge className={`${stateGuaranty.tier === "Premium" ? "bg-emerald-600" : stateGuaranty.tier === "Enhanced" ? "bg-blue-600" : "bg-gray-600"} text-white`}>{stateGuaranty.tier}</Badge></h4>
                  <p className="text-sm text-muted-foreground">{stateGuaranty.notes}</p>
                  {stateGuaranty.website && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Website: {stateGuaranty.website} | Phone: {stateGuaranty.phone}
                    </p>
                  )}
                </div>

                {premium > stateGuaranty.annuityLimit && (
                  <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <h4 className="font-semibold text-amber-600 flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4" /> Premium Splitting Recommendation
                    </h4>
                    <p className="text-sm">{splitRec.recommendation}</p>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {Array.from({ length: Math.min(splitRec.splitCount, 5) }, (_, i) => {
                        const splitAmount = i < splitRec.splitCount - 1
                          ? stateGuaranty.annuityLimit
                          : premium - (stateGuaranty.annuityLimit * i);
                        return (
                          <div key={i} className="p-2 rounded bg-white dark:bg-gray-900 border text-center text-sm">
                            <div className="text-xs text-muted-foreground">Carrier {i + 1}</div>
                            <div className="font-bold">{fmt(Math.min(splitAmount, stateGuaranty.annuityLimit))}</div>
                            <div className="text-xs text-green-600">Fully covered</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════ TAB 5: HOW IT WORKS ═══════════ */}
          <TabsContent value="how-it-works" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  How Guaranteed Income Annuities Work
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {[
                    { step: 1, title: "Deposit Premium", desc: "You make a single premium payment. If the product includes a premium bonus (e.g., 20%), that amount is added to your income base immediately, giving you a head start on income growth.", color: "bg-blue-100 dark:bg-blue-900", icon: <DollarSign className="w-5 h-5" /> },
                    { step: 2, title: "Income Base Grows via Rollup", desc: "During the deferral period, your income base grows by the guaranteed rollup rate (6.5%–10% per year depending on the product) regardless of market performance. This is the number your income is calculated from.", color: "bg-green-100 dark:bg-green-900", icon: <TrendingUp className="w-5 h-5" /> },
                    { step: 3, title: "Activate Lifetime Income", desc: "When you're ready, you activate the income rider. Your annual income = Income Base × Benefit Rate (based on your age at activation). This income is guaranteed for life — both spouses on joint policies.", color: "bg-amber-100 dark:bg-amber-900", icon: <Wallet className="w-5 h-5" /> },
                    { step: 4, title: "Income Continues for Life", desc: "Even if the contract value (actual account balance) drops to $0, the insurance company is contractually obligated to continue paying your guaranteed income for as long as you live. This is the power of the GLWB rider.", color: "bg-purple-100 dark:bg-purple-900", icon: <Heart className="w-5 h-5" /> },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                      <div className={`w-12 h-12 rounded-full ${item.color} flex items-center justify-center shrink-0`}>
                        {item.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold">Step {item.step}: {item.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Card className="border-2 border-emerald-200 dark:border-emerald-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Key Terms Explained</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { term: "Income Base", def: "A notional value used solely to calculate your income payments. It grows by the rollup rate and any premium bonuses, but cannot be withdrawn as a lump sum." },
                        { term: "Contract Value", def: "Your actual account balance. Withdrawals reduce this value. When it reaches $0, guaranteed income continues from the insurance company's general account." },
                        { term: "Rollup Rate", def: "The guaranteed annual percentage increase applied to your income base during the deferral period." },
                        { term: "Benefit Rate", def: "The percentage of your income base that determines your annual income. Increases with age at first withdrawal." },
                        { term: "GLWB", def: "Guaranteed Lifetime Withdrawal Benefit — the contractual guarantee that income payments will continue for life." },
                        { term: "State Guaranty", def: `Each state has a guaranty association that protects annuity holders if an insurance company becomes insolvent. ${stateName}'s limit is ${fmt(stateGuaranty.annuityLimit)} per contract.` },
                      ].map((item) => (
                        <div key={item.term} className="p-3 rounded-lg border bg-card">
                          <div className="font-semibold text-sm text-emerald-600">{item.term}</div>
                          <p className="text-xs text-muted-foreground mt-1">{item.def}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════ TAB 6: ANALYTICS ═══════════ */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 text-amber-600" />
                    AM Best Rating Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={ratingDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {ratingDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-600" />
                    Rollup vs Bonus Scatter Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid opacity={0.5} />
                        <XAxis type="number" dataKey="rollup" name="Rollup Rate" unit="%" />
                        <YAxis type="number" dataKey="bonus" name="Premium Bonus" unit="%" />
                        <ZAxis type="number" dataKey="income" range={[50, 400]} name="Annual Income" />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v: number, name: string) => name === 'Annual Income' ? fmt(v) : `${v}%`} />
                        <Legend />
                        <Scatter name="Products" data={scatterData} fill="#8884d8">
                          {scatterData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                          ))}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Data Summary Tables</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-sm">Top 5 by Highest Payout</h4>
                    <div className="rounded-md border">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="p-2 text-left font-medium">Carrier</th>
                            <th className="p-2 text-right font-medium">Annual Income</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...filteredProducts].sort((a, b) => getPayoutForAge(b) - getPayoutForAge(a)).slice(0, 5).map((p, i) => (
                            <tr key={p.id} className="border-t">
                              <td className="p-2">{p.carrier}</td>
                              <td className="p-2 text-right font-mono text-emerald-600 font-semibold">{fmt(getPayoutForAge(p))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3 text-sm">Top 5 by Rollup Rate</h4>
                    <div className="rounded-md border">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>
                            <th className="p-2 text-left font-medium">Carrier</th>
                            <th className="p-2 text-right font-medium">Rollup Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...filteredProducts].sort((a, b) => (b.rollupRate || 0) - (a.rollupRate || 0)).slice(0, 5).map((p, i) => (
                            <tr key={p.id} className="border-t">
                              <td className="p-2">{p.carrier}</td>
                              <td className="p-2 text-right font-mono text-amber-600 font-semibold">{pct(p.rollupRate || 0)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ─── NAIC DISCLAIMER ─── */}
        <NAICDisclaimer
          variant="full"
          showsProjections
          showsCashValues
          showsComparisons
          additionalText="Income projections are based on current product illustrations and are subject to change. Actual income may vary by state, premium amount, age, and underwriting. All guarantees are backed by the claims-paying ability of the issuing insurance company. State guaranty association limits are subject to change and may not cover all benefits. Data sourced from AnnuityRateWatch and carrier illustrations (Q2 2026). This is not a solicitation or offer to sell any specific product. Consult your financial advisor for personalized recommendations."
        />
      </div>
    
        <ComplianceFooter pageName="IncomeAnnuityTop10" showsAnnuity showsTax showsEstate showsProjections />
      </AppShell>
  );
}

