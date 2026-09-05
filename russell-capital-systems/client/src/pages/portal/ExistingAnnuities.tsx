// @ts-nocheck
import { NumberInput } from "@/components/NumberInput";
import { useState, useMemo, useEffect } from "react";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/AppShell";
import {
  Shield, TrendingUp, DollarSign, Heart, CheckCircle2, XCircle,
  AlertTriangle, ArrowRight, Sparkles, Calculator, PiggyBank, MapPin,
  Plane, Home, Car, Utensils, Wifi, Smartphone, ShoppingBag,
  Stethoscope, Gift, TreePine, Palette, Wine, Dumbbell, GraduationCap,
  Users, Sun, Moon, CloudRain, Umbrella, RefreshCw, Zap
} from "lucide-react";
import { ReplacementRadarPanel } from "@/components/ReplacementRadarPanel";
import {
  US_STATES, getStateGuaranty, getStateName,
  getCarrierSplitRecommendation, type StateCode,
} from "@shared/annuityData";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer } from "recharts";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

type TabId = "finder" | "conversion" | "taxchart" | "budget" | "longevity" | "radar";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "finder", label: "Annuity Fact Finder", icon: <Calculator className="w-4 h-4" /> },
  { id: "radar" as TabId, label: "Replacement Radar", icon: <Zap className="w-4 h-4" /> },
  { id: "conversion", label: "Conversion Analysis", icon: <RefreshCw className="w-4 h-4" /> },
  { id: "taxchart", label: "Tax Fluctuation Charts", icon: <TrendingUp className="w-4 h-4" /> },
  { id: "budget", label: "Lifestyle Budget Planner", icon: <Home className="w-4 h-4" /> },
  { id: "longevity", label: "Live Longer & Happier", icon: <Heart className="w-4 h-4" /> },
];

const fmt = (n: number) => "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
const fmtPct = (n: number) => n.toFixed(1) + "%";

export default function ExistingAnnuities() {
  const [activeTab, setActiveTab] = useState<TabId>("finder");
  const [stateCode, setStateCode] = useState<StateCode>("FL");

  const { data: clientData } = useClientData();

  useEffect(() => {
    if (clientData) {
      if (clientData.state) setStateCode(clientData.state as StateCode);
      if (clientData.annuityValue) setAnnuityValue(clientData.annuityValue);
      if (clientData.age) setCurrentAge(clientData.age);
      if (clientData.filingStatus) setFilingStatus(clientData.filingStatus as "single" | "married");
      if (clientData.retirementAge) setIncomeStartAge(clientData.retirementAge);
      if (clientData.mortgageBalance) setMortgage(clientData.mortgageBalance);
      if (clientData.annualIncome) setOtherTaxableIncome(clientData.annualIncome);
    }
  }, [clientData]);

  const guaranty = useMemo(() => getStateGuaranty(stateCode), [stateCode]);
  const splitRec = useMemo(() => getCarrierSplitRecommendation(350000, stateCode), [stateCode]);
  
  const [annuityValue, setAnnuityValue] = useState(350000);
  const [companyName, setCompanyName] = useState("Jackson National");
  const [yearsInForce, setYearsInForce] = useState(6);
  const [currentSurrenderValue, setCurrentSurrenderValue] = useState(308000);
  const [guaranteedMonthlyIncome, setGuaranteedMonthlyIncome] = useState(1604);
  const [accountType, setAccountType] = useState<"taxfree" | "ira" | "401k" | "403b" | "tsp">("ira");
  const [currentAge, setCurrentAge] = useState(62);
  const [lifeExpectancy, setLifeExpectancy] = useState(90);
  const [filingStatus, setFilingStatus] = useState<"single" | "married">("single");
  const [otherTaxableIncome, setOtherTaxableIncome] = useState(45000);
  const [stateTaxRate, setStateTaxRate] = useState(5);
  const [surrenderPenaltyPercent, setSurrenderPenaltyPercent] = useState(12);
  const [premiumBonusPercent, setPremiumBonusPercent] = useState(20);
  const [solarGrowthPercent, setSolarGrowthPercent] = useState(25);
  const [incomeStartAge, setIncomeStartAge] = useState(65);
  
  const [mortgage, setMortgage] = useState(1800);
  const [utilities, setUtilities] = useState(350);
  const [insurance, setInsurance] = useState(450);
  const [groceries, setGroceries] = useState(600);
  const [carPayment, setCarPayment] = useState(450);
  const [healthcare, setHealthcare] = useState(650);
  const [phone, setPhone] = useState(120);
  const [internet, setInternet] = useState(80);
  const [subscriptions, setSubscriptions] = useState(75);
  const [gasTransport, setGasTransport] = useState(200);
  const [clothing, setClothing] = useState(150);
  const [dining, setDining] = useState(300);
  const [personalCare, setPersonalCare] = useState(100);
  const [petCare, setPetCare] = useState(75);
  const [otherMonthly, setOtherMonthly] = useState(200);
  
  const [vacations, setVacations] = useState(6000);
  const [propertyTaxes, setPropertyTaxes] = useState(4200);
  const [homeMaintenance, setHomeMaintenance] = useState(3000);
  const [gifts, setGifts] = useState(2400);
  const [charitableGiving, setCharitableGiving] = useState(1200);
  const [hobbies, setHobbies] = useState(1800);
  const [emergencyFund, setEmergencyFund] = useState(2400);
  const [otherAnnual, setOtherAnnual] = useState(1000);

  const queryInput = useMemo(() => ({
    annuityValue,
    companyName,
    yearsInForce,
    currentSurrenderValue,
    guaranteedMonthlyIncome,
    accountType,
    currentAge,
    lifeExpectancy,
    filingStatus,
    otherTaxableIncome,
    stateTaxRate: stateTaxRate / 100,
    surrenderPenaltyPercent: surrenderPenaltyPercent / 100,
    premiumBonusPercent: premiumBonusPercent / 100,
    solarGrowthPercent: solarGrowthPercent / 100,
    incomeStartAge,
    monthlyExpenses: {
      mortgage, utilities, insurance, groceries, carPayment, healthcare,
      phone, internet, subscriptions, gasTransport, clothing, dining,
      personalCare, petCare, otherMonthly,
    },
    annualExpenses: {
      vacations, propertyTaxes, homeMaintenance, gifts,
      charitableGiving, hobbies, emergencyFund, otherAnnual,
    },
  }), [annuityValue, companyName, yearsInForce, currentSurrenderValue,
    guaranteedMonthlyIncome, accountType, currentAge, lifeExpectancy,
    filingStatus, otherTaxableIncome, stateTaxRate, surrenderPenaltyPercent,
    premiumBonusPercent, solarGrowthPercent, incomeStartAge,
    mortgage, utilities, insurance, groceries, carPayment, healthcare,
    phone, internet, subscriptions, gasTransport, clothing, dining,
    personalCare, petCare, otherMonthly, vacations, propertyTaxes,
    homeMaintenance, gifts, charitableGiving, hobbies, emergencyFund, otherAnnual]);

  const { data: result } = trpc.lifetimeIncome.analyzeExisting.useQuery(queryInput);

  const numField = (label: string, value: number, setter: (v: number) => void, prefix = "$", icon?: React.ReactNode) => (
    <div>
      <Label className="text-xs text-muted-foreground flex items-center gap-1 whitespace-normal leading-tight">{icon}{label}</Label>
      <div className="relative mt-1">
        {prefix && <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{prefix}</span>}
        <NumberInput value={value} onChange={setter} className={`h-8 text-sm ${prefix ? "pl-6" : ""}`}/>
      </div>
    </div>
  );

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6 p-4">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="ExistingAnnuities" />

        <ExecutiveSummary
          pageTitle="Existing Annuities"
          whatItDoes="This financial analysis tool provides institutional-grade analysis of your financial situation, modeling multiple scenarios and projecting outcomes based on your specific inputs. It transforms complex financial analysis concepts into clear, actionable insights with dollar-quantified recommendations."
          opportunities="This tool reveals insights that most clients never see because they don\'t have access to institutional-grade analysis. The data here can change how you think about your entire financial picture."
          intent="To give you the same caliber of financial analysis analysis that institutional investors and ultra-high-net-worth families receive — now accessible to every client."
          takeaway="Understanding your financial analysis options with precise dollar amounts empowers you to make confident decisions that compound into significant wealth over time."
          callToAction="Enter your numbers and see exactly how financial analysis strategies can improve your financial outcome."
          followUpQuestions={[
            "How does this financial analysis strategy interact with my other financial plans?",
            "What\'s the single biggest financial analysis opportunity I\'m currently missing?",
            "How would my results change if I started this strategy 5 years earlier?",
          ]}
        />
        <GoalsAccelerator pageName="Existing Annuities" pageContext="Existing Annuities — financial analysis modeling with projections and scenario analysis" />
        <TaxBracketPanel grossIncome={clientData?.annualIncome || 150000} filingStatus={clientData?.filingStatus || "single"} stateCode={clientData?.state || "TX"} />
        <RecommendationSummary
          headline="This financial analysis strategy can significantly improve your financial outcome"
          detail="Based on your profile, implementing the recommended financial analysis approach could generate substantial savings and growth over your planning horizon."
          dollarBenefit={200000}
          timeHorizon="20 years"
          confidence="high"
          nextStep="Review with your advisor"
        />
        <DoNothingBaseline
          metrics={[
            { label: "Financial Clarity Score", doNothing: 40, recommended: 90, format: "percent" },
            { label: "Optimization Potential", doNothing: 0, recommended: 200000, format: "currency" },
            { label: "Decision Confidence", doNothing: 35, recommended: 92, format: "percent" },
          ]}
          summary="Without taking action on financial analysis, you leave significant value on the table that compounds into a major opportunity cost over time."
        />
        <FactFinderBadge className="mb-4" />
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="text-center space-y-2 flex-1">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
              Your Existing Annuities
            </h1>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              Discover how surrendering your current taxable annuity and Roth converting at 0% tax liability — 
              even with early surrender penalties — can result in <strong className="text-amber-400">significantly more</strong> guaranteed 
              lifetime income that is <strong className="text-emerald-400">100% tax-free</strong>.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportToSlides
              toolName="Existing Annuities"
              getSections={() => {
                if (!result) return [{ title: "Existing Annuities", items: [{ label: "Status", value: "No data" }] }];
                return [
                  {
                    title: "Current Annuity Details",
                    items: [
                      { label: "Company", value: companyName },
                      { label: "Current Value", value: "$" + annuityValue.toLocaleString() },
                      { label: "Surrender Value", value: "$" + currentSurrenderValue.toLocaleString() },
                      { label: "Guaranteed Monthly Income", value: "$" + guaranteedMonthlyIncome.toLocaleString() },
                    ]
                  },
                  {
                    title: "Conversion Assumptions",
                    items: [
                      { label: "Surrender Penalty", value: surrenderPenaltyPercent + "%" },
                      { label: "Solar Strategy Growth", value: solarGrowthPercent + "%" },
                      { label: "Premium Bonus", value: premiumBonusPercent + "%" },
                    ]
                  },
                  {
                    title: "Summary Results",
                    items: [
                      { label: "Current After-Tax Monthly", value: "$" + result.currentSituation.afterTaxMonthlyIncome.toLocaleString(undefined, { maximumFractionDigits: 0 }) },
                      { label: "New Tax-Free Monthly", value: "$" + result.newIncome.monthlyTaxFreeIncome.toLocaleString(undefined, { maximumFractionDigits: 0 }) },
                      { label: "Monthly Income Increase", value: "+$" + result.newIncome.monthlyIncomeIncrease.toLocaleString(undefined, { maximumFractionDigits: 0 }) },
                    ]
                  }
                ];
              }}
            />
          </div>
        </div>

        {/* Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="rc-card">
            <div className="text-sm font-semibold text-white mb-3">Income Comparison</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={result ? [
                { name: 'Current (After-Tax)', value: result.currentSituation.afterTaxMonthlyIncome },
                { name: 'New (Tax-Free)', value: result.newIncome.monthlyTaxFreeIncome }
              ] : [
                { name: 'Current (After-Tax)', value: 0 },
                { name: 'New (Tax-Free)', value: 0 }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                <RTooltip 
                  contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Monthly Income']}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {
                    (result ? [result.currentSituation.afterTaxMonthlyIncome, result.newIncome.monthlyTaxFreeIncome] : [0, 0]).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? "#ef4444" : "#22c55e"} />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="rc-card">
            <div className="text-sm font-semibold text-white mb-3">Value Comparison</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={[
                { name: 'Current Value', value: annuityValue },
                { name: 'Surrender Value', value: currentSurrenderValue }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`} />
                <RTooltip 
                  contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {
                    [annuityValue, currentSurrenderValue].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? "#3b82f6" : "#f0c040"} />
                    ))
                  }
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ─── STATE SELECTOR ─── */}
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs font-semibold flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-400" /> Client State of Residence
                </Label>
                <Select value={stateCode} onValueChange={v => setStateCode(v as StateCode)}>
                  <SelectTrigger className="mt-1 border-amber-500/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((s) => (
                      <SelectItem key={s.code} value={s.code}>{s.name} ({s.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded bg-muted/10">
                  <p className="text-xs text-muted-foreground">Annuity Guaranty Limit</p>
                  <p className="text-lg font-bold text-amber-400">${(guaranty.annuityLimit / 1000).toFixed(0)}K</p>
                </div>
                <Badge variant="outline" className={`text-xs ${guaranty.tier === "Premium" ? "border-emerald-500/50 text-emerald-400" : guaranty.tier === "Enhanced" ? "border-blue-500/50 text-blue-400" : guaranty.tier === "Below Standard" ? "border-red-500/50 text-red-400" : "border-slate-500/50 text-slate-400"}`}>
                  {guaranty.tier} Protection
                </Badge>
              </div>
              <div className="flex items-center">
                <p className="text-xs text-muted-foreground">
                  {getStateName(stateCode)} guaranty covers up to <strong className="text-amber-400">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(guaranty.annuityLimit)}</strong> per annuity contract
                  {splitRec.splitCount > 1 && (
                    <span className="block mt-1 text-amber-400">
                      <AlertTriangle className="w-3 h-3 inline mr-1" />
                      Consider splitting across {splitRec.splitCount} carriers
                    </span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                  : "bg-card/50 text-muted-foreground hover:bg-card hover:text-foreground border border-transparent"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ═══ TAB: FACT FINDER ═══ */}
        {activeTab === "finder" && (
          <div className="space-y-6">
            {/* Current Annuity Details */}
            <Card className="border-amber-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <PiggyBank className="w-5 h-5 text-amber-400" />
                  Current Annuity Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground whitespace-normal leading-tight">Insurance Company</Label>
                    <Input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="h-8 text-sm mt-1"
                      placeholder="e.g. Jackson National"
                    />
                  </div>
                  {numField("Current Annuity Value", annuityValue, setAnnuityValue)}
                  {numField("Current Surrender Value", currentSurrenderValue, setCurrentSurrenderValue)}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {numField("Years In Force", yearsInForce, setYearsInForce, "")}
                  {numField("Guaranteed Monthly Income", guaranteedMonthlyIncome, setGuaranteedMonthlyIncome)}
                  <div>
                    <Label className="text-xs text-muted-foreground whitespace-normal leading-tight">Account Type</Label>
                    <Select value={accountType} onValueChange={(v: string) => setAccountType(v as typeof accountType)}>
                      <SelectTrigger className="h-8 text-sm mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ira">Traditional IRA</SelectItem>
                        <SelectItem value="401k">401(k)</SelectItem>
                        <SelectItem value="403b">403(b)</SelectItem>
                        <SelectItem value="tsp">TSP</SelectItem>
                        <SelectItem value="taxfree">Already Tax-Free (Roth)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client Info */}
            <Card className="border-blue-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {numField("Current Age", currentAge, setCurrentAge, "")}
                  {numField("Income Start Age", incomeStartAge, setIncomeStartAge, "")}
                  {numField("Life Expectancy", lifeExpectancy, setLifeExpectancy, "")}
                  <div>
                    <Label className="text-xs text-muted-foreground whitespace-normal leading-tight">Filing Status</Label>
                    <Select value={filingStatus} onValueChange={(v: string) => setFilingStatus(v as typeof filingStatus)}>
                      <SelectTrigger className="h-8 text-sm mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married Filing Jointly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                  {numField("Other Taxable Income", otherTaxableIncome, setOtherTaxableIncome)}
                  {numField("State Tax Rate (%)", stateTaxRate, setStateTaxRate, "")}
                </div>
              </CardContent>
            </Card>

            {/* Conversion Assumptions */}
            <Card className="border-emerald-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  Solar Strategy Conversion Assumptions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Surrender Penalty</span>
                    <span className="font-semibold text-red-400">{surrenderPenaltyPercent}%</span>
                  </div>
                  <Slider
                    value={[surrenderPenaltyPercent]}
                    onValueChange={([v]) => setSurrenderPenaltyPercent(v)}
                    min={0} max={20} step={1}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Solar Strategy Tax-Free Growth</span>
                    <span className="font-semibold text-amber-400">{solarGrowthPercent}%</span>
                  </div>
                  <Slider
                    value={[solarGrowthPercent]}
                    onValueChange={([v]) => setSolarGrowthPercent(v)}
                    min={15} max={35} step={1}
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Premium Bonus (New Annuity)</span>
                    <span className="font-semibold text-emerald-400">{premiumBonusPercent}%</span>
                  </div>
                  <Slider
                    value={[premiumBonusPercent]}
                    onValueChange={([v]) => setPremiumBonusPercent(v)}
                    min={10} max={36} step={1}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quick Summary */}
            {result && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-red-500/10 border-red-500/30">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground">Current After-Tax Monthly</p>
                    <p className="text-2xl font-bold text-red-400">{fmt(result.currentSituation.afterTaxMonthlyIncome)}</p>
                    <Badge variant="outline" className="mt-1 text-red-400 border-red-500/30">
                      {fmtPct(result.currentSituation.effectiveTaxRate)} effective tax
                    </Badge>
                  </CardContent>
                </Card>
                <Card className="bg-emerald-500/10 border-emerald-500/30">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground">New Tax-Free Monthly</p>
                    <p className="text-2xl font-bold text-emerald-400">{fmt(result.newIncome.monthlyTaxFreeIncome)}</p>
                    <Badge variant="outline" className="mt-1 text-emerald-400 border-emerald-500/30">
                      0% tax — forever
                    </Badge>
                  </CardContent>
                </Card>
                <Card className="bg-amber-500/10 border-amber-500/30">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground">Monthly Income Increase</p>
                    <p className="text-2xl font-bold text-amber-400">+{fmt(result.newIncome.monthlyIncomeIncrease)}</p>
                    <Badge variant="outline" className="mt-1 text-amber-400 border-amber-500/30">
                      +{fmtPct(result.newIncome.percentIncomeIncrease)} more
                    </Badge>
                  </CardContent>
                </Card>
              </div>
            )}

            <Button onClick={() => setActiveTab("conversion")} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold">
              <ArrowRight className="w-4 h-4 mr-2" />
              See Full Conversion Analysis
            </Button>
          </div>
        )}

        {/* ═══ TAB: CONVERSION ANALYSIS ═══ */}
        {activeTab === "conversion" && result && (
          <div className="space-y-6">
            {/* Penalty Recovery Waterfall */}
            <Card className="border-amber-500/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-amber-400" />
                  How the Surrender Penalty is More Than Recovered
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Visual waterfall */}
                  <div className="space-y-2">
                    {[
                      { label: "Current Surrender Value", value: result.rothConversion.surrenderValue, color: "bg-blue-500", textColor: "text-blue-400" },
                      { label: `Surrender Penalty (${surrenderPenaltyPercent}%)`, value: -result.rothConversion.surrenderPenalty, color: "bg-red-500", textColor: "text-red-400" },
                      { label: "Net After Penalty", value: result.rothConversion.netProceedsAfterPenalty, color: "bg-yellow-500", textColor: "text-yellow-400" },
                      { label: "Roth Conversion Tax Cost", value: -result.rothConversion.conversionTaxCost, color: "bg-red-500", textColor: "text-emerald-400", note: "0% strategy" },
                      { label: `Solar Strategy Growth (+${solarGrowthPercent}%)`, value: result.rothConversion.solarGrowthAmount, color: "bg-amber-500", textColor: "text-amber-400" },
                      { label: `Premium Bonus (+${premiumBonusPercent}%)`, value: result.rothConversion.premiumBonusAmount, color: "bg-emerald-500", textColor: "text-emerald-400" },
                    ].map((item, i) => {
                      const maxVal = result.rothConversion.totalEnhancedValue;
                      const pct = Math.abs(item.value) / maxVal * 100;
                      return (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-48 text-xs text-right text-muted-foreground shrink-0">{item.label}</div>
                          <div className="flex-1 h-7 bg-muted/30 rounded overflow-hidden relative">
                            <div className={`h-full ${item.color} rounded opacity-80`} style={{ width: `${Math.max(pct, 2)}%` }} />
                          </div>
                          <div className={`w-28 text-sm font-semibold text-right shrink-0 ${item.textColor}`}>
                            {item.value < 0 ? `-${fmt(Math.abs(item.value))}` : fmt(item.value)}
                            {item.note && <span className="text-xs ml-1">({item.note})</span>}
                          </div>
                        </div>
                      );
                    })}
                    {/* Total line */}
                    <div className="flex items-center gap-3 border-t border-amber-500/30 pt-2 mt-2">
                      <div className="w-48 text-xs text-right font-semibold text-amber-400 shrink-0">Total Enhanced Value</div>
                      <div className="flex-1 h-8 bg-gradient-to-r from-amber-500/30 to-emerald-500/30 rounded overflow-hidden relative">
                        <div className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded opacity-80 w-full" />
                      </div>
                      <div className="w-28 text-lg font-bold text-right text-amber-400 shrink-0">{fmt(result.rothConversion.totalEnhancedValue)}</div>
                    </div>
                  </div>

                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 mt-4">
                    <p className="text-sm text-emerald-300">
                      <strong>Net Result:</strong> {result.rothConversion.penaltyRecoveryExplanation}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Income Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-red-500/30 bg-red-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-red-400 flex items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    Current: Taxable & Unreliable
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Gross Annual Income</span>
                    <span>{fmt(result.currentSituation.currentAnnualIncome)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-red-400">
                    <span>Annual Tax Burden</span>
                    <span>-{fmt(result.currentSituation.annualTaxOnIncome)}</span>
                  </div>
                  <div className="border-t border-red-500/30 pt-2 flex justify-between font-semibold">
                    <span>After-Tax Annual</span>
                    <span className="text-red-400">{fmt(result.currentSituation.afterTaxAnnualIncome)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">After-Tax Monthly</span>
                    <span className="text-red-400">{fmt(result.currentSituation.afterTaxMonthlyIncome)}</span>
                  </div>
                  <div className="bg-red-500/10 rounded p-3 mt-2">
                    <p className="text-xs text-red-300">
                      <AlertTriangle className="w-3 h-3 inline mr-1" />
                      Tax rates can change at any time. Your actual take-home is unpredictable 
                      and could decrease by 20-45% depending on future legislation.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-emerald-500/30 bg-emerald-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Recommended: Tax-Free & Guaranteed
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax-Free Annual Income</span>
                    <span>{fmt(result.newIncome.annualTaxFreeIncome)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-emerald-400">
                    <span>Tax Burden</span>
                    <span>$0 — Forever</span>
                  </div>
                  <div className="border-t border-emerald-500/30 pt-2 flex justify-between font-semibold">
                    <span>Take-Home Annual</span>
                    <span className="text-emerald-400">{fmt(result.newIncome.annualTaxFreeIncome)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Take-Home Monthly</span>
                    <span className="text-emerald-400">{fmt(result.newIncome.monthlyTaxFreeIncome)}</span>
                  </div>
                  <div className="bg-emerald-500/10 rounded p-3 mt-2">
                    <p className="text-xs text-emerald-300">
                      <Shield className="w-3 h-3 inline mr-1" />
                      100% predictable. No matter what Congress does to tax rates, 
                      your income stays exactly the same — guaranteed for life.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Lifetime Totals */}
            <Card className="border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-emerald-500/5">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Lifetime Tax-Free Income</p>
                    <p className="text-2xl font-bold text-emerald-400">{fmt(result.newIncome.lifetimeTaxFreeIncome)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Lifetime Tax Saved</p>
                    <p className="text-2xl font-bold text-amber-400">{fmt(result.newIncome.lifetimeTaxSaved)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Income Increase</p>
                    <p className="text-2xl font-bold text-blue-400">+{fmtPct(result.newIncome.percentIncomeIncrease)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ═══ TAB: TAX FLUCTUATION CHARTS ═══ */}
        {activeTab === "taxchart" && result && (
          <div className="space-y-6">
            <Card className="border-amber-500/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                  40-Year Tax Fluctuation: Taxable vs. Tax-Free Income
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Federal tax rates fluctuate between 20-45% over 40 years based on economic cycles, 
                  debt levels, and political changes. Your tax-free income remains constant.
                </p>
              </CardHeader>
              <CardContent>
                {/* Chart 1: Annual Income Comparison Bar Chart */}
                <div className="mb-8">
                  <h3 className="text-sm font-semibold mb-3 text-blue-400">Chart 1: Annual After-Tax Income (Taxable vs. Tax-Free)</h3>
                  <div className="space-y-1 max-h-[500px] overflow-y-auto">
                    {result.taxFluctuationTimeline.slice(0, 40).map((yr: { year: number; age: number; taxRate: number; taxableNetIncome: number; taxFreeIncome: number; annualDifference: number }, i: number) => {
                      const maxIncome = result.newIncome.annualTaxFreeIncome * 1.1;
                      const taxablePct = (yr.taxableNetIncome / maxIncome) * 100;
                      const taxFreePct = (yr.taxFreeIncome / maxIncome) * 100;
                      return (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <div className="w-16 text-right text-muted-foreground shrink-0">
                            Yr {yr.year} ({yr.age})
                          </div>
                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-center gap-1">
                              <div className="h-3 bg-red-500/70 rounded" style={{ width: `${taxablePct}%` }} />
                              <span className="text-red-400 shrink-0">{fmt(yr.taxableNetIncome)}</span>
                              <span className="text-muted-foreground shrink-0">({yr.taxRate}%)</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="h-3 bg-emerald-500/70 rounded" style={{ width: `${taxFreePct}%` }} />
                              <span className="text-emerald-400 shrink-0">{fmt(yr.taxFreeIncome)}</span>
                            </div>
                          </div>
                          <div className={`w-20 text-right font-semibold shrink-0 ${yr.annualDifference > 0 ? "text-emerald-400" : "text-red-400"}`}>
                            +{fmt(yr.annualDifference)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-6 mt-3 text-xs text-muted-foreground justify-center">
                    <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500/70 rounded" /> Taxable (after tax)</span>
                    <span className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-500/70 rounded" /> Tax-Free</span>
                  </div>
                </div>

                {/* Chart 2: Tax Rate Volatility */}
                <div className="mb-8">
                  <h3 className="text-sm font-semibold mb-3 text-amber-400">Chart 2: Federal Tax Rate Volatility Over 40 Years</h3>
                  <div className="relative h-48 border border-muted/30 rounded-lg overflow-hidden">
                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 bottom-0 w-10 flex flex-col justify-between text-xs text-muted-foreground py-1">
                      <span>45%</span>
                      <span>35%</span>
                      <span>25%</span>
                      <span>20%</span>
                    </div>
                    {/* Chart area */}
                    <div className="ml-10 h-full flex items-end gap-px px-1">
                      {result.taxFluctuationTimeline.slice(0, 40).map((yr: { year: number; taxRate: number }, i: number) => {
                        const height = ((yr.taxRate - 15) / 35) * 100;
                        const isHigh = yr.taxRate >= 40;
                        const isMed = yr.taxRate >= 33;
                        return (
                          <div key={i} className="flex-1 flex flex-col justify-end h-full" title={`Year ${yr.year}: ${yr.taxRate}%`}>
                            <div
                              className={`w-full rounded-t transition-all ${isHigh ? "bg-red-500" : isMed ? "bg-amber-500" : "bg-emerald-500"}`}
                              style={{ height: `${height}%` }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground justify-center">
                    <span className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-500 rounded" /> Low (20-32%)</span>
                    <span className="flex items-center gap-1"><div className="w-3 h-3 bg-amber-500 rounded" /> Medium (33-39%)</span>
                    <span className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded" /> High (40-45%)</span>
                  </div>
                </div>

                {/* Chart 3: Cumulative Wealth Gap */}
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-emerald-400">Chart 3: Cumulative Income Gap (Tax-Free vs. Taxable)</h3>
                  <div className="space-y-1">
                    {[5, 10, 15, 20, 25, 30, 35, 40].map((yr) => {
                      const entry = result.taxFluctuationTimeline[yr - 1];
                      if (!entry) return null;
                      const maxCum = result.taxFluctuationTimeline[result.taxFluctuationTimeline.length - 1]?.cumulativeTaxFree || 1;
                      const taxablePct = (entry.cumulativeTaxableNet / maxCum) * 100;
                      const taxFreePct = (entry.cumulativeTaxFree / maxCum) * 100;
                      return (
                        <div key={yr} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground w-20">Year {yr}</span>
                            <span className="text-amber-400 font-semibold">Gap: {fmt(entry.cumulativeDifference)}</span>
                          </div>
                          <div className="flex gap-1 h-5">
                            <div className="bg-red-500/60 rounded h-full" style={{ width: `${taxablePct}%` }}>
                              <span className="text-[10px] text-white px-1 leading-5 whitespace-nowrap">{fmt(entry.cumulativeTaxableNet)}</span>
                            </div>
                          </div>
                          <div className="flex gap-1 h-5">
                            <div className="bg-emerald-500/60 rounded h-full" style={{ width: `${taxFreePct}%` }}>
                              <span className="text-[10px] text-white px-1 leading-5 whitespace-nowrap">{fmt(entry.cumulativeTaxFree)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Insight */}
            <Card className="bg-gradient-to-r from-amber-500/10 to-red-500/10 border-amber-500/30">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-amber-400 mb-1">The Unpredictability Tax</h3>
                    <p className="text-sm text-muted-foreground">
                      Over 40 years, tax rates will fluctuate dramatically. Some years you'll keep more, 
                      some years the government takes nearly half. With tax-free income, you keep 
                      <strong className="text-emerald-400"> 100% every single year</strong>. 
                      The cumulative difference is <strong className="text-amber-400">
                        {result.taxFluctuationTimeline.length > 0 ? fmt(result.taxFluctuationTimeline[result.taxFluctuationTimeline.length - 1].cumulativeDifference) : "$0"}
                      </strong> more in your pocket over your lifetime.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ═══ TAB: LIFESTYLE BUDGET PLANNER ═══ */}
        {activeTab === "budget" && result && (
          <div className="space-y-6">
            {/* Income Header */}
            <Card className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border-emerald-500/30">
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground mb-1">Your Guaranteed Tax-Free Monthly Income</p>
                <p className="text-4xl font-bold text-emerald-400">{fmt(result.lifestyleBudget.monthlyTaxFreeIncome)}</p>
                <p className="text-xs text-muted-foreground mt-1">Every month, guaranteed for life, with 100% certainty</p>
              </CardContent>
            </Card>

            {/* Monthly Expenses Editor */}
            <Card className="border-blue-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-blue-400" />
                  Your Monthly Expenses
                </CardTitle>
                <p className="text-xs text-muted-foreground">Adjust your actual monthly expenses to see exactly what your guaranteed income covers.</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {numField("Mortgage / Rent", mortgage, setMortgage, "$", <Home className="w-3 h-3" />)}
                  {numField("Utilities", utilities, setUtilities, "$", <Wifi className="w-3 h-3" />)}
                  {numField("Insurance", insurance, setInsurance, "$", <Shield className="w-3 h-3" />)}
                  {numField("Groceries", groceries, setGroceries, "$", <Utensils className="w-3 h-3" />)}
                  {numField("Car Payment", carPayment, setCarPayment, "$", <Car className="w-3 h-3" />)}
                  {numField("Healthcare", healthcare, setHealthcare, "$", <Stethoscope className="w-3 h-3" />)}
                  {numField("Phone", phone, setPhone, "$", <Smartphone className="w-3 h-3" />)}
                  {numField("Internet", internet, setInternet, "$", <Wifi className="w-3 h-3" />)}
                  {numField("Subscriptions", subscriptions, setSubscriptions, "$", <ShoppingBag className="w-3 h-3" />)}
                  {numField("Gas / Transport", gasTransport, setGasTransport, "$", <Car className="w-3 h-3" />)}
                  {numField("Clothing", clothing, setClothing, "$", <ShoppingBag className="w-3 h-3" />)}
                  {numField("Dining Out", dining, setDining, "$", <Utensils className="w-3 h-3" />)}
                  {numField("Personal Care", personalCare, setPersonalCare, "$", <Heart className="w-3 h-3" />)}
                  {numField("Pet Care", petCare, setPetCare, "$", <Heart className="w-3 h-3" />)}
                  {numField("Other Monthly", otherMonthly, setOtherMonthly, "$", <DollarSign className="w-3 h-3" />)}
                </div>
              </CardContent>
            </Card>

            {/* Annual Expenses Editor */}
            <Card className="border-purple-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TreePine className="w-5 h-5 text-purple-400" />
                  Your Annual Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {numField("Vacations & Travel", vacations, setVacations, "$", <Plane className="w-3 h-3" />)}
                  {numField("Property Taxes", propertyTaxes, setPropertyTaxes, "$", <Home className="w-3 h-3" />)}
                  {numField("Home Maintenance", homeMaintenance, setHomeMaintenance, "$", <Home className="w-3 h-3" />)}
                  {numField("Gifts & Celebrations", gifts, setGifts, "$", <Gift className="w-3 h-3" />)}
                  {numField("Charitable Giving", charitableGiving, setCharitableGiving, "$", <Heart className="w-3 h-3" />)}
                  {numField("Hobbies & Recreation", hobbies, setHobbies, "$", <Palette className="w-3 h-3" />)}
                  {numField("Emergency Fund", emergencyFund, setEmergencyFund, "$", <Shield className="w-3 h-3" />)}
                  {numField("Other Annual", otherAnnual, setOtherAnnual, "$", <DollarSign className="w-3 h-3" />)}
                </div>
              </CardContent>
            </Card>

            {/* Budget Coverage Visualization */}
            <Card className="border-emerald-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  What Your Guaranteed Income Covers
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  With {fmt(result.lifestyleBudget.monthlyTaxFreeIncome)}/month guaranteed tax-free, here is exactly what you can plan for with 100% confidence:
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.lifestyleBudget.expenseBreakdown.map((exp: { category: string; monthlyAmount: number; annualAmount: number; covered: boolean; runningTotal: number }, i: number) => {
                    const pct = (exp.runningTotal / result.lifestyleBudget.monthlyTaxFreeIncome) * 100;
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-5 shrink-0">
                          {exp.covered 
                            ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            : <XCircle className="w-4 h-4 text-red-400" />
                          }
                        </div>
                        <div className="w-48 text-xs text-muted-foreground shrink-0 truncate">{exp.category}</div>
                        <div className="flex-1 h-5 bg-muted/20 rounded overflow-hidden relative">
                          <div 
                            className={`h-full rounded transition-all ${exp.covered ? "bg-emerald-500/60" : "bg-red-500/60"}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                          {pct <= 100 && (
                            <div className="absolute right-1 top-0 h-full flex items-center">
                              <span className="text-[10px] text-muted-foreground">{pct.toFixed(0)}%</span>
                            </div>
                          )}
                        </div>
                        <div className="w-20 text-xs text-right shrink-0 font-medium">
                          {fmt(exp.monthlyAmount)}/mo
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Summary Bar */}
                <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/30">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Monthly Expenses</p>
                      <p className="text-lg font-bold">{fmt(result.lifestyleBudget.totalMonthlyBudgetNeeded)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Guaranteed Income</p>
                      <p className="text-lg font-bold text-emerald-400">{fmt(result.lifestyleBudget.monthlyTaxFreeIncome)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Coverage</p>
                      <p className={`text-lg font-bold ${result.lifestyleBudget.isFullyCovered ? "text-emerald-400" : "text-amber-400"}`}>
                        {fmtPct(result.lifestyleBudget.coveragePercent)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Monthly Remaining</p>
                      <p className={`text-lg font-bold ${result.lifestyleBudget.monthlyRemaining >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {result.lifestyleBudget.monthlyRemaining >= 0 ? "+" : ""}{fmt(result.lifestyleBudget.monthlyRemaining)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Affordable Extras */}
            {result.lifestyleBudget.discretionaryMonthly > 0 && (
              <Card className="border-amber-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    What Else You Can Enjoy — Calmly & Confidently
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    With {fmt(result.lifestyleBudget.discretionaryMonthly)}/month in discretionary income 
                    ({fmt(result.lifestyleBudget.discretionaryAnnual)}/year), here are the experiences and luxuries you can plan for:
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {result.lifestyleBudget.affordableExtras.map((extra: { item: string; monthlyCost: number; canAfford: boolean }, i: number) => {
                      const icons: Record<string, React.ReactNode> = {
                        "Weekly Date Night Dinner": <Utensils className="w-4 h-4" />,
                        "Monthly Spa Day": <Sun className="w-4 h-4" />,
                        "Annual European Vacation": <Plane className="w-4 h-4" />,
                        "Annual Caribbean Cruise": <Umbrella className="w-4 h-4" />,
                        "Golf Club Membership": <TreePine className="w-4 h-4" />,
                        "Country Club Membership": <Users className="w-4 h-4" />,
                        "New Car Every 5 Years": <Car className="w-4 h-4" />,
                        "Grandchildren College Fund": <GraduationCap className="w-4 h-4" />,
                        "Annual Family Reunion Trip": <Users className="w-4 h-4" />,
                        "Fitness & Wellness Program": <Dumbbell className="w-4 h-4" />,
                        "Season Tickets (Sports/Theater)": <Sparkles className="w-4 h-4" />,
                        "Home Improvement Projects": <Home className="w-4 h-4" />,
                        "Weekend Getaways (Quarterly)": <Moon className="w-4 h-4" />,
                        "Photography / Art Classes": <Palette className="w-4 h-4" />,
                        "Wine Club & Tasting Events": <Wine className="w-4 h-4" />,
                      };
                      return (
                        <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${
                          extra.canAfford 
                            ? "bg-emerald-500/5 border-emerald-500/30" 
                            : "bg-muted/5 border-muted/20 opacity-50"
                        }`}>
                          <div className={`shrink-0 ${extra.canAfford ? "text-emerald-400" : "text-muted-foreground"}`}>
                            {icons[extra.item] || <Sparkles className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${extra.canAfford ? "" : "text-muted-foreground"}`}>{extra.item}</p>
                            <p className="text-xs text-muted-foreground">{fmt(extra.monthlyCost)}/mo</p>
                          </div>
                          {extra.canAfford 
                            ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            : <XCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                          }
</div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Calm Planning Message */}
            <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Shield className="w-8 h-8 text-blue-400 shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-blue-400 mb-2">Plan Your Life With Absolute Certainty</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Imagine waking up every morning knowing <strong>exactly</strong> how much money will be in your account. 
                      No worrying about tax rate changes. No anxiety about market crashes. No fear of outliving your savings. 
                      With guaranteed tax-free lifetime income, you can calmly plan every vacation, every dinner out, 
                      every gift for your grandchildren, and every home improvement project — because you know with 
                      <strong className="text-emerald-400"> 100% certainty</strong> that the money will be there. 
                      Month after month. Year after year. For the rest of your life.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ═══ TAB: LIVE LONGER & HAPPIER ═══ */}
        {activeTab === "longevity" && result && (
          <div className="space-y-6">
            {/* Hero */}
            <Card className="bg-gradient-to-br from-rose-500/10 via-pink-500/10 to-purple-500/10 border-rose-500/30">
              <CardContent className="p-8 text-center">
                <Heart className="w-12 h-12 text-rose-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold bg-gradient-to-r from-rose-400 to-purple-400 bg-clip-text text-transparent mb-3">
                  {result.longevityBenefits.headline}
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Research consistently shows that retirees with guaranteed income streams experience 
                  dramatically better physical health, mental wellness, and overall life satisfaction 
                  compared to those without income certainty.
                </p>
              </CardContent>
            </Card>

            {/* Research Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {result.longevityBenefits.stats.map((stat: { label: string; value: string; source: string }, i: number) => {
                const icons = [
                  <Shield key="s" className="w-6 h-6" />,
                  <Heart key="h" className="w-6 h-6" />,
                  <Stethoscope key="st" className="w-6 h-6" />,
                  <Sun key="su" className="w-6 h-6" />,
                  <TrendingUp key="t" className="w-6 h-6" />,
                  <Sparkles key="sp" className="w-6 h-6" />,
                ];
                const colors = [
                  "text-blue-400 bg-blue-500/10 border-blue-500/30",
                  "text-rose-400 bg-rose-500/10 border-rose-500/30",
                  "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
                  "text-amber-400 bg-amber-500/10 border-amber-500/30",
                  "text-purple-400 bg-purple-500/10 border-purple-500/30",
                  "text-pink-400 bg-pink-500/10 border-pink-500/30",
                ];
                return (
                  <Card key={i} className={`${colors[i]} border`}>
                    <CardContent className="p-5">
                      <div className={`${colors[i].split(" ")[0]} mb-3`}>
                        {icons[i]}
                      </div>
                      <h3 className="font-semibold text-sm mb-1">{stat.label}</h3>
                      <p className={`text-xl font-bold ${colors[i].split(" ")[0]} mb-2`}>{stat.value}</p>
                      <p className="text-xs text-muted-foreground italic">Source: {stat.source}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* The Science */}
            <Card className="border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-purple-400" />
                  The Science Behind Income Security & Longevity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-blue-400">1</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">Cortisol Reduction</h4>
                        <p className="text-xs text-muted-foreground">
                          Financial uncertainty triggers chronic cortisol production — the stress hormone linked to 
                          heart disease, diabetes, and cognitive decline. Guaranteed income eliminates this trigger.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-emerald-400">2</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">Better Sleep Quality</h4>
                        <p className="text-xs text-muted-foreground">
                          Retirees with guaranteed income report 40% better sleep quality. Quality sleep is the 
                          single most important factor in longevity and cognitive health.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-amber-400">3</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">Social Engagement</h4>
                        <p className="text-xs text-muted-foreground">
                          People with income certainty are 3x more likely to maintain active social lives — 
                          dining out, traveling, joining clubs — all proven to extend lifespan.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-rose-400">4</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">Preventive Healthcare</h4>
                        <p className="text-xs text-muted-foreground">
                          With predictable income, retirees are more likely to invest in preventive care, 
                          regular checkups, and wellness programs rather than deferring medical attention.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-purple-400">5</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">Purpose & Generosity</h4>
                        <p className="text-xs text-muted-foreground">
                          Guaranteed income allows retirees to give generously — to family, charity, and community — 
                          which research shows activates the brain's reward centers and promotes longevity.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-pink-400">6</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm">Relationship Quality</h4>
                        <p className="text-xs text-muted-foreground">
                          Financial stress is the #1 cause of relationship conflict in retirement. 
                          Removing money anxiety strengthens marriages and family bonds.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* The Message */}
            <Card className="bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-purple-500/10 border-emerald-500/30">
              <CardContent className="p-8 text-center">
                <div className="max-w-3xl mx-auto">
                  <h3 className="text-xl font-bold text-emerald-400 mb-4">
                    This Isn't Just a Financial Decision — It's a Life Decision
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-6">
                    {result.longevityBenefits.message}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <CloudRain className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">Without Guaranteed Income</p>
                      <p className="text-sm font-semibold text-red-400 mt-1">Anxiety, uncertainty, fear of running out</p>
                    </div>
                    <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <ArrowRight className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">The Transformation</p>
                      <p className="text-sm font-semibold text-amber-400 mt-1">One decision changes everything</p>
                    </div>
                    <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <Sun className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">With Guaranteed Income</p>
                      <p className="text-sm font-semibold text-emerald-400 mt-1">Peace, confidence, joy, longevity</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Your Numbers */}
            <Card className="border-amber-500/30">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-amber-400 mb-4 text-center">Your Personal Transformation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-5 rounded-lg bg-red-500/5 border border-red-500/20 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Current: Taxable & Unpredictable</p>
                    <p className="text-3xl font-bold text-red-400">{fmt(result.currentSituation.afterTaxMonthlyIncome)}/mo</p>
                    <p className="text-xs text-red-300 mt-1">Subject to 20-45% tax fluctuations</p>
                  </div>
                  <div className="p-5 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Recommended: Tax-Free & Guaranteed</p>
                    <p className="text-3xl font-bold text-emerald-400">{fmt(result.newIncome.monthlyTaxFreeIncome)}/mo</p>
                    <p className="text-xs text-emerald-300 mt-1">100% predictable, forever</p>
                  </div>
                </div>
                <div className="text-center mt-4">
                  <p className="text-sm text-muted-foreground">
                    That's <strong className="text-amber-400 text-lg">+{fmt(result.newIncome.monthlyIncomeIncrease)}/month more</strong> — 
                    and <strong className="text-emerald-400">{fmt(result.newIncome.lifetimeTaxSaved)} in lifetime tax savings</strong>.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Replacement Radar Tab */}
        {activeTab === "radar" && (
          <ReplacementRadarPanel />
        )}

        {/* Loading state for tabs that need result */}
        {activeTab !== "finder" && activeTab !== "radar" && !result && (
          <Card className="border-muted/30">
            <CardContent className="p-12 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground">Calculating your personalized analysis...</p>
            </CardContent>
          </Card>
        )}
      </div>

      <NAICDisclaimer variant="footer" showsProjections showsCashValues />
    
        <ComplianceFooter pageName="ExistingAnnuities" showsAnnuity showsTax showsEstate showsProjections />
      </AppShell>
  );
}
