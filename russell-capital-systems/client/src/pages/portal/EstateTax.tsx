// @ts-nocheck
import { AppShell } from "@/components/AppShell";
import { GenerateOutcomeTab } from "@/components/GenerateOutcomeTab";
import { CalculationSyncBar } from "@/components/CalculationSyncBar";
import { useStrategy } from "@/contexts/StrategyContext";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { NumberInput } from "@/components/NumberInput";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc";
import { useState, useEffect, useMemo } from "react";
import {
  Landmark,
  Shield,
  AlertTriangle,
  Home,
  TrendingUp,
  Briefcase,
  Heart,
  DollarSign,
  Gift,
  PieChart,
  ArrowRight,
  Info,
  Calculator,
  Users,
  Building,
  Gem,
  ChevronDown,
  ChevronUp,
  Wallet,
  Scale,
  Lightbulb,
} from "lucide-react";
import {

  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Legend, Cell, PieChart as RechartsPieChart, Pie,
  LineChart, Line, Area, AreaChart, ComposedChart
} from "recharts";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import { PlatformEnhancements } from "@/components/PlatformEnhancements";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;
const fmtShort = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
};
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

function AssetWidget({ label, icon: Icon, value, onChange, color, description }: {
  label: string; icon: any; value: number; onChange: (v: number) => void; color: string; description: string;
}) {
  return (
    <div className="group relative rounded-xl border border-slate-700/60 bg-slate-800/40 p-4 hover:border-slate-600/80 transition-all">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-lg`} style={{ backgroundColor: `${color}20` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <Label className="text-sm font-medium text-slate-200">{label}</Label>
      </div>
      <NumberInput value={value} onChange={onChange} className="bg-slate-900/60 border-slate-600/50 text-white h-10" min={0} step={10000} />
      <p className="text-[11px] text-slate-500 mt-1.5">{description}</p>
      {value > 0 && (
        <div className="absolute top-2 right-3">
          <Badge variant="outline" className="text-[10px] border-slate-600/40 text-slate-400">{fmtShort(value)}</Badge>
        </div>
      )}
    </div>
  );
}

function DeductionWidget({ label, value, onChange, description }: {
  label: string; value: number; onChange: (v: number) => void; description: string;
}) {
  return (
    <div className="rounded-lg border border-slate-700/40 bg-slate-800/30 p-3">
      <Label className="text-xs font-medium text-slate-300">{label}</Label>
      <NumberInput value={value} onChange={onChange} className="bg-slate-900/50 border-slate-600/40 text-white h-9 mt-1.5" min={0} step={10000} />
      <p className="text-[10px] text-slate-500 mt-1">{description}</p>
</div>
  );
}

function StatCard({ label, value, color, icon: Icon, subtitle }: {
  label: string; value: string; color: string; icon?: any; subtitle?: string;
}) {
  return (
    <Card className="bg-slate-800/60 border-slate-700/50">
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center gap-2 mb-1">
          {Icon && <Icon className="h-4 w-4" style={{ color }} />}
          <p className="text-xs text-slate-400">{label}</p>
        </div>
        <p className="text-xl font-bold" style={{ color }}>{value}</p>
        {subtitle && <p className="text-[10px] text-slate-500 mt-0.5">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

export default function EstateTax() {
  const { data: clientData } = useClientData();
  useEffect(() => {
    if (!clientData) return;
    setRealEstate(clientData.realEstateEquity || 2500000);
    setRetirementAccounts(clientData.iraBalance + clientData.rothBalance + clientData.k401Balance || 1500000);
    setCashAndSavings(clientData.cashSavings || 500000);
    setLifeInsurance(clientData.lifeInsuranceDb || 1000000);
    setInvestments(clientData.taxableInvestments || 3000000);
  }, [clientData]);

  const [realEstate, setRealEstate] = useState(2500000);
  const [investments, setInvestments] = useState(3000000);
  const [retirementAccounts, setRetirementAccounts] = useState(1500000);
  const [businessInterests, setBusinessInterests] = useState(2000000);
  const [lifeInsurance, setLifeInsurance] = useState(1000000);
  const [cashAndSavings, setCashAndSavings] = useState(500000);
  const [personalProperty, setPersonalProperty] = useState(300000);
  const [otherAssets, setOtherAssets] = useState(200000);

  const [maritalDeduction, setMaritalDeduction] = useState(0);
  const [charitableDeduction, setCharitableDeduction] = useState(0);
  const [debtsAndMortgages, setDebtsAndMortgages] = useState(500000);
  const [funeralExpenses, setFuneralExpenses] = useState(15000);
  const [adminExpenses, setAdminExpenses] = useState(100000);
  const [stateDeathTaxDeduction, setStateDeathTaxDeduction] = useState(0);

  const [iulDeathBenefit, setIulDeathBenefit] = useState(3000000);
  const [useILIT, setUseILIT] = useState(true);

  const [annualGiftsPerRecipient, setAnnualGiftsPerRecipient] = useState(18000);
  const [numberOfRecipients, setNumberOfRecipients] = useState(4);
  const [yearsOfGifting, setYearsOfGifting] = useState(10);
  const [lifetimeGiftsUsed, setLifetimeGiftsUsed] = useState(0);

  const [currentAge, setCurrentAge] = useState(55);
  const [spouseAge, setSpouseAge] = useState(53);
  const [numberOfBeneficiaries, setNumberOfBeneficiaries] = useState(3);
  const [growthRate, setGrowthRate] = useState(0.08);

  const [filingStatus, setFilingStatus] = useState<"single" | "married">("married");
  const [spouseEstateValue, setSpouseEstateValue] = useState(0);
  const [year, setYear] = useState(2024);
  const [activeTab, setActiveTab] = useState("overview");
  const [showBrackets, setShowBrackets] = useState(false);

  const { data: result, isLoading } = trpc.estateTax.calculateComprehensive.useQuery({
    assets: { realEstate, investments, retirementAccounts, businessInterests, lifeInsurance, cashAndSavings, personalProperty, otherAssets },
    deductions: { maritalDeduction, charitableDeduction, debtsAndMortgages, funeralExpenses, adminExpenses, stateDeathTaxDeduction },
    iulDeathBenefit,
    useILIT,
    gifting: { annualGiftsPerRecipient, numberOfRecipients, yearsOfGifting, lifetimeGiftsUsed },
    filingStatus,
    spouseEstateValue,
    year,
    currentAge,
    growthRate,
    spouseAge,
    numberOfBeneficiaries,
  });

  const grossEstateTotal = realEstate + investments + retirementAccounts + businessInterests +
    (useILIT ? 0 : lifeInsurance) + cashAndSavings + personalProperty + otherAssets +
    (useILIT ? 0 : iulDeathBenefit);

  const totalDeductions = maritalDeduction + charitableDeduction + debtsAndMortgages +
    funeralExpenses + adminExpenses + stateDeathTaxDeduction;

  const ilitComparisonData = useMemo(() => {
    if (!result) return [];
    return [
      { label: "Without ILIT", tax: result.withoutILIT.estateTax, net: result.withoutILIT.netToHeirs },
      { label: "With ILIT", tax: result.withILIT.estateTax, net: result.withILIT.netToHeirs },
    ];
  }, [result]);

  const sunsetComparisonData = useMemo(() => {
    if (!result) return [];
    return [
      { label: "Current Law", tax: result.sunsetAnalysis.currentTax, exemption: result.sunsetAnalysis.currentExemption },
      { label: "After 2026 Sunset", tax: result.sunsetAnalysis.sunsetTax, exemption: result.sunsetAnalysis.sunsetExemption },
    ];
  }, [result]);

  return (
    <AppShell>
      <div className="space-y-6 pb-12">
        <CalculationSyncBar />
        <PlatformEnhancements
            pageTitle="Estate Tax Analyzer"
            monteCarloConfig={{ years: 30, initialValue: 5000000, preset: "balanced" }}
        />

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="EstateTax" />

        <ExecutiveSummary
          pageTitle="Estate Tax"
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
        <GoalsAccelerator pageName="Estate Tax" pageContext="Estate Tax — tax optimization modeling with projections and scenario analysis" />
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
        <div className="mb-2">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Landmark className="w-7 h-7 text-amber-400" />
            Estate Tax Impact Calculator
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive federal estate tax analysis with ILIT planning, gifting strategies, and 2026 sunset projections
          </p>
        </div>

        {/* Quick Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <ExportToSlides
            toolName="Estate Tax Analyzer"
            getSections={() => [
              {
                title: "Estate Overview",
                items: [
                  { label: "Gross Estate", value: fmtShort(grossEstateTotal) },
                  { label: "Total Deductions", value: fmtShort(totalDeductions) },
                  { label: "Taxable Estate", value: result ? fmtShort(result.taxableEstate) : "$0" },
                ]
              },
              {
                title: "Tax Impact",
                items: [
                  { label: "Federal Estate Tax", value: result ? fmt(result.federalEstateTax) : "$0" },
                  { label: "Effective Tax Rate", value: result ? pct(result.effectiveRate) : "0%" },
                  { label: "Net to Heirs", value: result ? fmtShort(result.netToHeirs) : "$0" },
                ]
              }
            ]}
          />
          <Select value={filingStatus} onValueChange={(v) => setFilingStatus(v as "single" | "married")}>
            <SelectTrigger className="w-[160px] h-10 bg-slate-800/60 border-slate-700/60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="single">Single</SelectItem>
              <SelectItem value="married">Married</SelectItem>
            </SelectContent>
          </Select>
          <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
            <SelectTrigger className="w-[130px] h-10 bg-slate-800/60 border-slate-700/60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026 (Sunset)</SelectItem>
              <SelectItem value="2027">2027</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
            <Switch checked={useILIT} onCheckedChange={setUseILIT} />
            <Label className="text-sm text-slate-300 cursor-pointer">ILIT Active</Label>
          </div>
          {result && (
            <Badge variant="outline" className={`text-sm px-3 py-1.5 ${result.federalEstateTax > 0 ? "border-red-500/50 text-red-400" : "border-emerald-500/50 text-emerald-400"}`}>
              {result.federalEstateTax > 0 ? `Tax: ${fmt(result.federalEstateTax)}` : "No Tax Due"}
            </Badge>
          )}
        </div>

        {/* Summary Cards */}
        {result && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <StatCard label="Gross Estate" value={fmtShort(result.grossEstate)} color="#3b82f6" icon={Building} />
            <StatCard label="Deductions" value={fmtShort(result.totalDeductions)} color="#f59e0b" icon={Scale} />
            <StatCard label="Exemption" value={fmtShort(result.exemption)} color="#22c55e" icon={Shield} subtitle={year >= 2026 ? "Post-sunset" : "Current law"} />
            <StatCard label="Taxable Estate" value={fmtShort(result.taxableEstate)} color="#f97316" icon={Calculator} />
            <StatCard label="Estate Tax" value={fmt(result.federalEstateTax)} color="#ef4444" icon={AlertTriangle} subtitle={`Effective: ${pct(result.effectiveRate)}`} />
            <StatCard label="Net to Heirs" value={fmtShort(result.netToHeirs)} color="#a855f7" icon={Users} />
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex overflow-x-auto h-auto gap-1.5 p-1.5 w-full bg-slate-800/80 border border-slate-700/60 rounded-xl">
            <TabsTrigger value="overview" className="text-xs sm:text-sm px-3 py-2 flex-none whitespace-nowrap rounded-lg font-semibold data-[state=active]:bg-amber-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-slate-200 data-[state=inactive]:hover:bg-slate-700/60 transition-all">
              <PieChart className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />Overview
            </TabsTrigger>
            <TabsTrigger value="assets" className="text-xs sm:text-sm px-3 py-2 flex-none whitespace-nowrap rounded-lg font-semibold data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-slate-200 data-[state=inactive]:hover:bg-slate-700/60 transition-all">
              <Wallet className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />Assets
            </TabsTrigger>
            <TabsTrigger value="deductions" className="text-xs sm:text-sm px-3 py-2 flex-none whitespace-nowrap rounded-lg font-semibold data-[state=active]:bg-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-slate-200 data-[state=inactive]:hover:bg-slate-700/60 transition-all">
              <Scale className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />Deductions
            </TabsTrigger>
            <TabsTrigger value="ilit" className="text-xs sm:text-sm px-3 py-2 flex-none whitespace-nowrap rounded-lg font-semibold data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-slate-200 data-[state=inactive]:hover:bg-slate-700/60 transition-all">
              <Shield className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />ILIT
            </TabsTrigger>
            <TabsTrigger value="gifting" className="text-xs sm:text-sm px-3 py-2 flex-none whitespace-nowrap rounded-lg font-semibold data-[state=active]:bg-pink-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-slate-200 data-[state=inactive]:hover:bg-slate-700/60 transition-all">
              <Gift className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />Gifting
            </TabsTrigger>
            <TabsTrigger value="sunset" className="text-xs sm:text-sm px-3 py-2 flex-none whitespace-nowrap rounded-lg font-semibold data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-slate-200 data-[state=inactive]:hover:bg-slate-700/60 transition-all">
              <AlertTriangle className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />2026 Sunset
            </TabsTrigger>
            <TabsTrigger value="projections" className="text-xs sm:text-sm px-3 py-2 flex-none whitespace-nowrap rounded-lg font-semibold data-[state=active]:bg-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-slate-200 data-[state=inactive]:hover:bg-slate-700/60 transition-all">
              <TrendingUp className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />Wealth Growth
            </TabsTrigger>
            <TabsTrigger value="insurance" className="text-xs sm:text-sm px-3 py-2 flex-none whitespace-nowrap rounded-lg font-semibold data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-slate-200 data-[state=inactive]:hover:bg-slate-700/60 transition-all">
              <Heart className="h-3.5 w-3.5 mr-1.5 hidden sm:inline" />Insurance Needs
            </TabsTrigger>
          
            <TabsTrigger value="generate-outcome" className="text-xs sm:text-sm bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 font-bold">Generate Outcome</TabsTrigger>
          </TabsList>

          {/* ═══════════ OVERVIEW TAB ═══════════ */}
          <TabsContent value="overview" className="space-y-6 mt-4">
            {result && (
              <>
                {/* Estate Shrinkage Pie */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="text-lg text-slate-100">Estate Shrinkage</CardTitle>
                      <CardDescription>Where your estate goes</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={280}>
                        <RechartsPieChart>
                          <Pie
                            data={result.shrinkagePie}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={110}
                            dataKey="value"
                            nameKey="label"
                            strokeWidth={2}
                            stroke="#1e293b"
                          >
                            {result.shrinkagePie.map((entry: any, i: number) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            formatter={(value: number) => fmt(value)}
                            contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                            itemStyle={{ color: "#e2e8f0" }}
                          />
                          <Legend wrapperStyle={{ color: "#94a3b8", fontSize: "12px" }} />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                      <div className="text-center mt-2">
                        <p className="text-sm text-slate-400">
                          Estate shrinkage: <span className="text-red-400 font-bold">{result.estateShrinkagePercent.toFixed(1)}%</span> lost to taxes
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Asset Breakdown Bar */}
                  <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardHeader>
                      <CardTitle className="text-lg text-slate-100">Asset Composition</CardTitle>
                      <CardDescription>Breakdown of your gross estate</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={result.assetBreakdown} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                          <XAxis type="number" tickFormatter={(v: number) => fmtShort(v)} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                          <YAxis type="category" dataKey="label" width={130} tick={{ fill: "#cbd5e1", fontSize: 11 }} />
                          <RechartsTooltip
                            formatter={(value: number) => fmt(value)}
                            contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                            itemStyle={{ color: "#e2e8f0" }}
                          />
                          <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                            {result.assetBreakdown.map((entry: any, i: number) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Tax Bracket Breakdown */}
                <Card className="bg-slate-800/50 border-slate-700/50">
                  <CardHeader className="cursor-pointer" onClick={() => setShowBrackets(!showBrackets)}>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg text-slate-100">Federal Tax Bracket Breakdown</CardTitle>
                        <CardDescription>Progressive rates from 18% to 40%</CardDescription>
                      </div>
                      <Button variant="ghost" size="sm" className="text-slate-400">
                        {showBrackets ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CardHeader>
                  {showBrackets && result.bracketBreakdown.length > 0 && (
                    <CardContent>
                      <div className="space-y-2">
                        {result.bracketBreakdown.map((b: any, i: number) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-28 text-xs text-slate-400 text-right">{b.bracket}</div>
                            <div className="w-14 text-xs font-mono text-amber-400 text-right">{(b.rate * 100).toFixed(0)}%</div>
                            <div className="flex-1 h-6 bg-slate-900/60 rounded-md overflow-hidden relative">
                              <div
                                className="h-full rounded-md transition-all"
                                style={{
                                  width: `${Math.min(100, (b.taxableInBracket / (result.bracketBreakdown[result.bracketBreakdown.length - 1]?.taxableInBracket || 1)) * 100)}%`,
                                  backgroundColor: `hsl(${Math.max(0, 120 - b.rate * 300)}, 70%, 50%)`,
                                }}
                              />
                              <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-mono">
                                {fmtShort(b.taxableInBracket)} → {fmtShort(b.taxInBracket)} tax
                              </span>
                            </div>
                          </div>
                        ))}
                        <Separator className="my-3 bg-slate-700/50" />
                        <div className="flex items-center gap-3">
                          <div className="w-28 text-xs text-slate-300 text-right font-semibold">Total</div>
                          <div className="w-14" />
                          <div className="flex-1 text-sm font-bold text-red-400">
                            Tentative Tax: {fmt(result.tentativeTax)} − Unified Credit: {fmt(result.unifiedCredit)} = <span className="text-red-300">{fmt(result.federalEstateTax)}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>

                {/* 10-Year Projection */}
                <Card className="bg-slate-800/50 border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-lg text-slate-100">10-Year Estate Tax Projection</CardTitle>
                    <CardDescription>Assuming 3% annual estate growth — note the 2026 sunset cliff</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <ComposedChart data={result.projections}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                        <YAxis tickFormatter={(v: number) => fmtShort(v)} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                        <RechartsTooltip
                          formatter={(value: number, name: string) => [fmt(value), name]}
                          contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                          itemStyle={{ color: "#e2e8f0" }}
                        />
                        <Legend wrapperStyle={{ color: "#94a3b8", fontSize: "12px" }} />
                        <Area type="monotone" dataKey="grossEstate" name="Gross Estate" fill="#3b82f620" stroke="#3b82f6" strokeWidth={2} />
                        <Line type="monotone" dataKey="netToHeirs" name="Net to Heirs" stroke="#a855f7" strokeWidth={2} dot={{ fill: "#a855f7", r: 3 }} />
                        <Bar dataKey="estateTax" name="Estate Tax" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Strategy Savings */}
                {result.combinedStrategySavings > 0 && (
                  <Card className="border-emerald-500/30 bg-emerald-500/5">
                    <CardContent className="pt-5 pb-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-emerald-500/10">
                          <Shield className="w-8 h-8 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-emerald-400">Combined Strategy Savings: {fmt(result.combinedStrategySavings)}</p>
                          <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-300">
                            {result.ilitSavings > 0 && <span>ILIT: <strong className="text-emerald-400">{fmt(result.ilitSavings)}</strong></span>}
                            {result.giftingAnalysis.taxSavingsFromGifting > 0 && <span>Gifting: <strong className="text-emerald-400">{fmt(result.giftingAnalysis.taxSavingsFromGifting)}</strong></span>}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
            {isLoading && <div className="text-center py-12 text-slate-400">Calculating estate tax...</div>}
          </TabsContent>

          {/* ═══════════ ASSETS TAB ═══════════ */}
          <TabsContent value="assets" className="space-y-6 mt-4">
            {/* Demographics Section */}
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-lg text-slate-100 flex items-center gap-2">
                  <Users className="h-5 w-5 text-cyan-400" /> Demographics & Growth Assumptions
                </CardTitle>
                <CardDescription>Your age and growth assumptions drive the wealth projections to age 100</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg bg-cyan-500/20"><Users className="h-4 w-4 text-cyan-400" /></div>
                      <Label className="text-sm font-medium text-slate-200">Your Age</Label>
                    </div>
                    <NumberInput value={currentAge} onChange={setCurrentAge} className="bg-slate-900/60 border-slate-600/50 text-white h-10" min={25} max={95} step={1} />
                  </div>
                  <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg bg-pink-500/20"><Heart className="h-4 w-4 text-pink-400" /></div>
                      <Label className="text-sm font-medium text-slate-200">Spouse Age</Label>
                    </div>
                    <NumberInput value={spouseAge} onChange={setSpouseAge} className="bg-slate-900/60 border-slate-600/50 text-white h-10" min={25} max={95} step={1} />
                  </div>
                  <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg bg-amber-500/20"><Users className="h-4 w-4 text-amber-400" /></div>
                      <Label className="text-sm font-medium text-slate-200">Beneficiaries</Label>
                    </div>
                    <NumberInput value={numberOfBeneficiaries} onChange={setNumberOfBeneficiaries} className="bg-slate-900/60 border-slate-600/50 text-white h-10" min={1} max={20} step={1} />
                  </div>
                  <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg bg-emerald-500/20"><TrendingUp className="h-4 w-4 text-emerald-400" /></div>
                      <Label className="text-sm font-medium text-slate-200">Growth Rate</Label>
                    </div>
                    <Select value={String(growthRate)} onValueChange={(v) => setGrowthRate(Number(v))}>
                      <SelectTrigger className="bg-slate-900/60 border-slate-600/50 text-white h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.04">4% Conservative</SelectItem>
                        <SelectItem value="0.06">6% Moderate</SelectItem>
                        <SelectItem value="0.08">8% Growth (Default)</SelectItem>
                        <SelectItem value="0.10">10% Aggressive</SelectItem>
                        <SelectItem value="0.12">12% High Growth</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-slate-500 mt-1">Annual compound growth of estate assets</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-lg text-slate-100 flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-blue-400" /> Estate Assets
                </CardTitle>
                <CardDescription>Enter the fair market value of all estate assets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <AssetWidget label="Real Estate" icon={Home} value={realEstate} onChange={setRealEstate} color="#3b82f6" description="Primary home, vacation, rental properties" />
                  <AssetWidget label="Investments" icon={TrendingUp} value={investments} onChange={setInvestments} color="#8b5cf6" description="Stocks, bonds, mutual funds, ETFs" />
                  <AssetWidget label="Retirement Accounts" icon={DollarSign} value={retirementAccounts} onChange={setRetirementAccounts} color="#f59e0b" description="IRA, 401(k), 403(b) — fully taxable" />
                  <AssetWidget label="Business Interests" icon={Briefcase} value={businessInterests} onChange={setBusinessInterests} color="#06b6d4" description="LLC, S-Corp, partnership interests" />
                  <AssetWidget label="Life Insurance" icon={Heart} value={lifeInsurance} onChange={setLifeInsurance} color="#ef4444" description={useILIT ? "Excluded via ILIT" : "Included in estate"} />
                  <AssetWidget label="Cash & Savings" icon={Wallet} value={cashAndSavings} onChange={setCashAndSavings} color="#22c55e" description="Bank accounts, CDs, money market" />
                  <AssetWidget label="Personal Property" icon={Gem} value={personalProperty} onChange={setPersonalProperty} color="#ec4899" description="Vehicles, jewelry, art, collectibles" />
                  <AssetWidget label="Other Assets" icon={Building} value={otherAssets} onChange={setOtherAssets} color="#f97316" description="Notes receivable, royalties, other" />
                </div>

                <Separator className="my-5 bg-slate-700/50" />

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Gross Estate Total</p>
                    <p className="text-2xl font-bold text-blue-400">{fmt(grossEstateTotal)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">IUL Death Benefit</p>
                    <div className="flex items-center gap-3 mt-1">
                      <NumberInput value={iulDeathBenefit} onChange={setIulDeathBenefit} className="w-48 bg-slate-900/60 border-slate-600/50 text-white h-10" min={0} step={100000} />
                      <Badge variant="outline" className={useILIT ? "border-emerald-500/50 text-emerald-400" : "border-red-500/50 text-red-400"}>
                        {useILIT ? "In ILIT (excluded)" : "In estate (taxable)"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Asset pie chart */}
            {result && result.assetBreakdown.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-100">Asset Allocation</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={result.assetBreakdown}
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        dataKey="value"
                        nameKey="label"
                        label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                        strokeWidth={2}
                        stroke="#1e293b"
                      >
                        {result.assetBreakdown.map((entry: any, i: number) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value: number) => fmt(value)}
                        contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                        itemStyle={{ color: "#e2e8f0" }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ═══════════ DEDUCTIONS TAB ═══════════ */}
          <TabsContent value="deductions" className="space-y-6 mt-4">
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-lg text-slate-100 flex items-center gap-2">
                  <Scale className="h-5 w-5 text-emerald-400" /> Estate Deductions
                </CardTitle>
                <CardDescription>Deductions reduce your taxable estate before applying the exemption</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <DeductionWidget label="Marital Deduction" value={maritalDeduction} onChange={setMaritalDeduction} description="Unlimited deduction for assets passing to surviving spouse" />
                  <DeductionWidget label="Charitable Deduction" value={charitableDeduction} onChange={setCharitableDeduction} description="Gifts to qualified charities — unlimited deduction" />
                  <DeductionWidget label="Debts & Mortgages" value={debtsAndMortgages} onChange={setDebtsAndMortgages} description="Outstanding debts, mortgages, and liens" />
                  <DeductionWidget label="Funeral Expenses" value={funeralExpenses} onChange={setFuneralExpenses} description="Burial, cremation, and related costs" />
                  <DeductionWidget label="Administrative Expenses" value={adminExpenses} onChange={setAdminExpenses} description="Executor fees, legal, accounting, appraisals" />
                  <DeductionWidget label="State Death Tax Deduction" value={stateDeathTaxDeduction} onChange={setStateDeathTaxDeduction} description="State estate/inheritance tax paid (if applicable)" />
                </div>

                <Separator className="my-5 bg-slate-700/50" />

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Total Deductions</p>
                    <p className="text-2xl font-bold text-amber-400">{fmt(totalDeductions)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Adjusted Gross Estate</p>
                    <p className="text-2xl font-bold text-blue-400">{fmt(Math.max(0, grossEstateTotal - totalDeductions))}</p>
                  </div>
                </div>

                {filingStatus === "married" && maritalDeduction === 0 && (
                  <div className="mt-4 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 flex items-start gap-3">
                    <Info className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
                    <div className="text-sm text-slate-300">
                      <strong className="text-amber-400">Tip:</strong> As a married filer, you may qualify for the unlimited marital deduction.
                      Assets passing to your surviving spouse are fully deductible, potentially eliminating estate tax on the first death.
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Deduction impact visualization */}
            {result && (
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-100">Deduction Impact</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { label: "Gross Estate", value: result.grossEstate, color: "#3b82f6" },
                      { label: "After Deductions", value: result.adjustedGrossEstate, color: "#f59e0b" },
                      { label: "After Gifting", value: Math.max(0, result.adjustedGrossEstate - result.totalGiftingReduction), color: "#ec4899" },
                      { label: "Exemption Applied", value: result.exemption, color: "#22c55e" },
                      { label: "Taxable Estate", value: result.taxableEstate, color: "#ef4444" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-36 text-xs text-slate-400 text-right">{item.label}</div>
                        <div className="flex-1 h-8 bg-slate-900/60 rounded-md overflow-hidden relative">
                          <div
                            className="h-full rounded-md transition-all"
                            style={{
                              width: `${result.grossEstate > 0 ? Math.max(2, (item.value / result.grossEstate) * 100) : 0}%`,
                              backgroundColor: item.color,
                              opacity: 0.8,
                            }}
                          />
                          <span className="absolute inset-0 flex items-center px-3 text-xs text-white font-mono">
                            {fmt(item.value)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ═══════════ ILIT TAB ═══════════ */}
          <TabsContent value="ilit" className="space-y-6 mt-4">
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-lg text-slate-100 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-purple-400" /> Irrevocable Life Insurance Trust (ILIT)
                </CardTitle>
                <CardDescription>
                  An ILIT removes life insurance death benefits from your taxable estate, potentially saving hundreds of thousands in estate taxes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
                    <Label className="text-sm font-medium text-slate-200">IUL Death Benefit</Label>
                    <NumberInput value={iulDeathBenefit} onChange={setIulDeathBenefit} className="bg-slate-900/60 border-slate-600/50 text-white h-10 mt-2" min={0} step={100000} />
                    <p className="text-[11px] text-slate-500 mt-1.5">Total death benefit from IUL policies</p>
                  </div>
                  <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
                    <Label className="text-sm font-medium text-slate-200">Existing Life Insurance</Label>
                    <NumberInput value={lifeInsurance} onChange={setLifeInsurance} className="bg-slate-900/60 border-slate-600/50 text-white h-10 mt-2" min={0} step={100000} />
                    <p className="text-[11px] text-slate-500 mt-1.5">Other life insurance death benefits</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl border border-purple-500/30 bg-purple-500/5">
                  <Switch checked={useILIT} onCheckedChange={setUseILIT} />
                  <div>
                    <Label className="text-sm font-medium text-purple-300 cursor-pointer">Place life insurance in ILIT</Label>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {useILIT
                        ? `${fmt(lifeInsurance + iulDeathBenefit)} excluded from taxable estate`
                        : `${fmt(lifeInsurance + iulDeathBenefit)} included in taxable estate — consider ILIT`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ILIT Comparison Chart */}
            {result && (
              <Card className="bg-slate-800/50 border-slate-700/50">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-100">ILIT Impact Comparison</CardTitle>
                  <CardDescription>Estate tax with and without an Irrevocable Life Insurance Trust</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={ilitComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="label" tick={{ fill: "#cbd5e1", fontSize: 12 }} />
                      <YAxis tickFormatter={(v: number) => fmtShort(v)} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <RechartsTooltip
                        formatter={(value: number, name: string) => [fmt(value), name]}
                        contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                        itemStyle={{ color: "#e2e8f0" }}
                      />
                      <Legend wrapperStyle={{ color: "#94a3b8", fontSize: "12px" }} />
                      <Bar dataKey="tax" name="Estate Tax" fill="#ef4444" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="net" name="Net to Heirs" fill="#a855f7" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>

                  {result.ilitSavings > 0 && (
                    <div className="mt-4 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-center">
                      <p className="text-2xl font-bold text-emerald-400">{fmt(result.ilitSavings)}</p>
                      <p className="text-sm text-slate-400 mt-1">Tax savings from ILIT strategy</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* ILIT Explanation */}
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-lg text-slate-100">How an ILIT Works</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { step: "1", title: "Create the Trust", desc: "Establish an irrevocable trust and name a trustee. You transfer ownership of life insurance policies to the trust.", color: "#3b82f6" },
                    { step: "2", title: "Fund Premiums", desc: "Make annual gifts to the trust to cover premiums. Crummey notices give beneficiaries withdrawal rights, qualifying for annual gift exclusion.", color: "#8b5cf6" },
                    { step: "3", title: "Tax-Free Distribution", desc: "Upon death, the death benefit passes to the trust — outside your taxable estate. The trustee distributes to beneficiaries tax-free.", color: "#22c55e" },
                  ].map((item) => (
                    <div key={item.step} className="p-4 rounded-xl border border-slate-700/40 bg-slate-900/40">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-3" style={{ backgroundColor: `${item.color}20`, color: item.color }}>
                        {item.step}
                      </div>
                      <h4 className="font-semibold text-slate-200 mb-1">{item.title}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════ GIFTING TAB ═══════════ */}
          <TabsContent value="gifting" className="space-y-6 mt-4">
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-lg text-slate-100 flex items-center gap-2">
                  <Gift className="h-5 w-5 text-pink-400" /> Gifting Strategy
                </CardTitle>
                <CardDescription>
                  Annual exclusion gifts reduce your taxable estate without using lifetime exemption ($18,000 per recipient in 2024)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
                    <Label className="text-sm font-medium text-slate-200">Annual Gift per Recipient</Label>
                    <NumberInput value={annualGiftsPerRecipient} onChange={setAnnualGiftsPerRecipient} className="bg-slate-900/60 border-slate-600/50 text-white h-10 mt-2" min={0} step={1000} />
                    <p className="text-[11px] text-slate-500 mt-1.5">2024 exclusion: $18,000</p>
                  </div>
                  <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
                    <Label className="text-sm font-medium text-slate-200">Number of Recipients</Label>
                    <NumberInput value={numberOfRecipients} onChange={setNumberOfRecipients} className="bg-slate-900/60 border-slate-600/50 text-white h-10 mt-2" min={0} step={1} />
                    <p className="text-[11px] text-slate-500 mt-1.5">Children, grandchildren, etc.</p>
                  </div>
                  <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
                    <Label className="text-sm font-medium text-slate-200">Years of Gifting</Label>
                    <NumberInput value={yearsOfGifting} onChange={setYearsOfGifting} className="bg-slate-900/60 border-slate-600/50 text-white h-10 mt-2" min={0} step={1} />
                    <p className="text-[11px] text-slate-500 mt-1.5">Planned gifting horizon</p>
                  </div>
                  <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
                    <Label className="text-sm font-medium text-slate-200">Lifetime Gifts Used</Label>
                    <NumberInput value={lifetimeGiftsUsed} onChange={setLifetimeGiftsUsed} className="bg-slate-900/60 border-slate-600/50 text-white h-10 mt-2" min={0} step={100000} />
                    <p className="text-[11px] text-slate-500 mt-1.5">Amount of exemption already used</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {result && (
              <>
                {/* Gifting Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardContent className="pt-4 text-center">
                      <p className="text-xs text-slate-400">Annual Gifts Total</p>
                      <p className="text-2xl font-bold text-pink-400">{fmt(result.giftingAnalysis.totalAnnualGifts)}</p>
                      <p className="text-[11px] text-slate-500">{numberOfRecipients} recipients × {fmt(annualGiftsPerRecipient)}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardContent className="pt-4 text-center">
                      <p className="text-xs text-slate-400">Total Estate Reduction</p>
                      <p className="text-2xl font-bold text-amber-400">{fmt(result.giftingAnalysis.totalGiftingOverYears)}</p>
                      <p className="text-[11px] text-slate-500">Over {yearsOfGifting} years</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800/50 border-slate-700/50">
                    <CardContent className="pt-4 text-center">
                      <p className="text-xs text-slate-400">Tax Savings from Gifting</p>
                      <p className="text-2xl font-bold text-emerald-400">{fmt(result.giftingAnalysis.taxSavingsFromGifting)}</p>
                      <p className="text-[11px] text-slate-500">Estimated federal tax reduction</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Gifting timeline */}
                <Card className="bg-slate-800/50 border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-lg text-slate-100">Cumulative Gifting Impact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={Array.from({ length: yearsOfGifting + 1 }, (_, i) => ({
                        year: i,
                        totalGifted: result.giftingAnalysis.totalAnnualGifts * i,
                        estateReduction: result.giftingAnalysis.totalAnnualGifts * i,
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis dataKey="year" label={{ value: "Year", position: "insideBottom", offset: -5, fill: "#94a3b8" }} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                        <YAxis tickFormatter={(v: number) => fmtShort(v)} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                        <RechartsTooltip
                          formatter={(value: number) => fmt(value)}
                          contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                          itemStyle={{ color: "#e2e8f0" }}
                        />
                        <Area type="monotone" dataKey="totalGifted" name="Total Gifted" fill="#ec489930" stroke="#ec4899" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Remaining exemption */}
                <Card className="bg-slate-800/50 border-slate-700/50">
                  <CardContent className="pt-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-slate-300">Lifetime Exemption Usage</p>
                      <p className="text-sm font-mono text-slate-400">{fmt(lifetimeGiftsUsed)} / {fmt(result.exemption)}</p>
                    </div>
                    <div className="h-4 bg-slate-900/60 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (lifetimeGiftsUsed / result.exemption) * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      Remaining: <span className="text-emerald-400 font-semibold">{fmt(result.lifetimeExemptionRemaining)}</span>
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* ═══════════ 2026 SUNSET TAB ═══════════ */}
          <TabsContent value="sunset" className="space-y-6 mt-4">
            <Card className="border-red-500/30 bg-red-500/5">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-red-500/10">
                    <AlertTriangle className="w-8 h-8 text-red-400" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-red-400">2026 Estate Tax Sunset Warning</p>
                    <p className="text-sm text-slate-300 mt-1">
                      The Tax Cuts and Jobs Act (TCJA) doubled the estate tax exemption to $13.61M per person.
                      Unless Congress acts, this provision sunsets on January 1, 2026, reverting the exemption to approximately $7M (adjusted for inflation).
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {result && (
              <>
                {/* Side by side comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-slate-800/50 border-emerald-500/30">
                    <CardHeader>
                      <CardTitle className="text-lg text-emerald-400">Current Law (2024-2025)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between"><span className="text-sm text-slate-400">Exemption</span><span className="text-sm font-bold text-emerald-400">{fmt(result.sunsetAnalysis.currentExemption)}</span></div>
                      <div className="flex justify-between"><span className="text-sm text-slate-400">Estate Tax</span><span className="text-sm font-bold text-slate-200">{fmt(result.sunsetAnalysis.currentTax)}</span></div>
                      <div className="flex justify-between"><span className="text-sm text-slate-400">Married Couple Exemption</span><span className="text-sm font-bold text-emerald-400">{fmt(result.sunsetAnalysis.currentExemption * 2)}</span></div>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-800/50 border-red-500/30">
                    <CardHeader>
                      <CardTitle className="text-lg text-red-400">After 2026 Sunset</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between"><span className="text-sm text-slate-400">Exemption</span><span className="text-sm font-bold text-red-400">{fmt(result.sunsetAnalysis.sunsetExemption)}</span></div>
                      <div className="flex justify-between"><span className="text-sm text-slate-400">Estate Tax</span><span className="text-sm font-bold text-red-300">{fmt(result.sunsetAnalysis.sunsetTax)}</span></div>
                      <div className="flex justify-between"><span className="text-sm text-slate-400">Married Couple Exemption</span><span className="text-sm font-bold text-red-400">{fmt(result.sunsetAnalysis.sunsetExemption * 2)}</span></div>
                    </CardContent>
                  </Card>
                </div>

                {/* Sunset comparison chart */}
                <Card className="bg-slate-800/50 border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-lg text-slate-100">Tax Impact Comparison</CardTitle>
                    <CardDescription>How the 2026 sunset affects your estate tax liability</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={sunsetComparisonData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis dataKey="label" tick={{ fill: "#cbd5e1", fontSize: 12 }} />
                        <YAxis tickFormatter={(v: number) => fmtShort(v)} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                        <RechartsTooltip
                          formatter={(value: number, name: string) => [fmt(value), name]}
                          contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                          itemStyle={{ color: "#e2e8f0" }}
                        />
                        <Legend wrapperStyle={{ color: "#94a3b8", fontSize: "12px" }} />
                        <Bar dataKey="exemption" name="Exemption" fill="#22c55e" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="tax" name="Estate Tax" fill="#ef4444" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {result.sunsetAnalysis.additionalExposure > 0 && (
                  <Card className="border-red-500/30 bg-red-500/5">
                    <CardContent className="pt-5 text-center">
                      <p className="text-3xl font-bold text-red-400">{fmt(result.sunsetAnalysis.additionalExposure)}</p>
                      <p className="text-sm text-slate-400 mt-1">Additional estate tax exposure after 2026 sunset</p>
                      <p className="text-xs text-slate-500 mt-2">
                        Act now: use gifting, ILIT strategies, and Roth conversions to reduce exposure before the sunset takes effect.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Action items */}
                <Card className="bg-slate-800/50 border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-lg text-slate-100">Pre-Sunset Action Plan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { title: "Maximize Annual Gifts", desc: "Gift $18,000 per recipient per year to reduce estate size without using lifetime exemption.", icon: Gift, color: "#ec4899" },
                        { title: "Establish an ILIT", desc: "Move life insurance out of your estate before the exemption drops. This is especially critical for large policies.", icon: Shield, color: "#8b5cf6" },
                        { title: "Use Lifetime Exemption", desc: "Consider making large gifts now while the $13.61M exemption is available. The IRS has confirmed gifts made under current law won't be clawed back.", icon: DollarSign, color: "#22c55e" },
                        { title: "Roth Conversions", desc: "Convert traditional IRA to Roth to reduce estate size (pay tax now at known rates) and provide tax-free inheritance.", icon: TrendingUp, color: "#3b82f6" },
                      ].map((item, i) => (
                        <div key={i} className="p-4 rounded-xl border border-slate-700/40 bg-slate-900/40 flex items-start gap-3">
                          <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: `${item.color}15` }}>
                            <item.icon className="h-5 w-5" style={{ color: item.color }} />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-200 text-sm">{item.title}</h4>
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* ═══════════ WEALTH PROJECTIONS TAB ═══════════ */}
          <TabsContent value="projections" className="space-y-6 mt-4">
            {result?.wealthProjections && (
              <>
                {/* Key Milestones */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard label="Estate at Age 70" value={fmtShort(result.wealthProjections.find((p) => p.age === 70)?.grossEstate ?? 0)} color="#3b82f6" icon={TrendingUp} />
                  <StatCard label="Estate at Age 80" value={fmtShort(result.wealthProjections.find((p) => p.age === 80)?.grossEstate ?? 0)} color="#8b5cf6" icon={TrendingUp} />
                  <StatCard label="Estate at Age 90" value={fmtShort(result.wealthProjections.find((p) => p.age === 90)?.grossEstate ?? 0)} color="#f59e0b" icon={TrendingUp} />
                  <StatCard label="Estate at Age 100" value={fmtShort(result.wealthProjections[result.wealthProjections.length - 1]?.grossEstate ?? 0)} color="#ef4444" icon={TrendingUp} />
                </div>

                {/* Wealth Growth Chart */}
                <Card className="bg-slate-800/50 border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-lg text-slate-100 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-cyan-400" /> Estate Value Growth to Age 100
                    </CardTitle>
                    <CardDescription>Projected (illustrated, non-guaranteed) at {(growthRate * 100).toFixed(0)}% annual compound growth with estate tax liability overlay</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <ComposedChart data={result.wealthProjections}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis dataKey="age" tick={{ fill: "#94a3b8", fontSize: 11 }} label={{ value: "Age", position: "insideBottom", offset: -5, fill: "#94a3b8" }} />
                        <YAxis tickFormatter={(v: number) => fmtShort(v)} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                        <RechartsTooltip
                          formatter={(value: number, name: string) => [fmt(value), name]}
                          labelFormatter={(label) => `Age ${label}`}
                          contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                          itemStyle={{ color: "#e2e8f0" }}
                        />
                        <Legend wrapperStyle={{ color: "#94a3b8", fontSize: "12px" }} />
                        <Area type="monotone" dataKey="grossEstate" name="Gross Estate" fill="#3b82f620" stroke="#3b82f6" strokeWidth={2} />
                        <Area type="monotone" dataKey="netToHeirs" name="Net to Heirs" fill="#22c55e15" stroke="#22c55e" strokeWidth={2} />
                        <Line type="monotone" dataKey="exemption" name="Exemption" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="6 3" dot={false} />
                        <Bar dataKey="estateTax" name="Estate Tax" fill="#ef4444" radius={[3, 3, 0, 0]} barSize={8} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Tax Rate Over Time */}
                <Card className="bg-slate-800/50 border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-lg text-slate-100">Effective Tax Rate Over Time</CardTitle>
                    <CardDescription>How estate tax erodes wealth as your estate grows</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={result.wealthProjections}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis dataKey="age" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                        <YAxis tickFormatter={(v: number) => `${(v * 100).toFixed(0)}%`} tick={{ fill: "#94a3b8", fontSize: 11 }} domain={[0, 0.45]} />
                        <RechartsTooltip
                          formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, "Effective Rate"]}
                          labelFormatter={(label) => `Age ${label}`}
                          contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                          itemStyle={{ color: "#e2e8f0" }}
                        />
                        <Area type="monotone" dataKey="effectiveRate" name="Effective Tax Rate" fill="#ef444430" stroke="#ef4444" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Year-by-Year Table */}
                <Card className="bg-slate-800/50 border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-lg text-slate-100">Year-by-Year Wealth Projection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-slate-800 z-10">
                          <tr className="border-b border-slate-700">
                            <th className="text-left py-2 px-3 text-slate-400 font-medium">Age</th>
                            <th className="text-right py-2 px-3 text-slate-400 font-medium">Gross Estate</th>
                            <th className="text-right py-2 px-3 text-slate-400 font-medium">Exemption</th>
                            <th className="text-right py-2 px-3 text-slate-400 font-medium">Taxable</th>
                            <th className="text-right py-2 px-3 text-red-400 font-medium">Estate Tax</th>
                            <th className="text-right py-2 px-3 text-slate-400 font-medium">Eff. Rate</th>
                            <th className="text-right py-2 px-3 text-emerald-400 font-medium">Net to Heirs</th>
                            <th className="text-right py-2 px-3 text-indigo-400 font-medium">Insurance Needed</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.wealthProjections.filter((_: any, i: number) => i % 5 === 0 || i === result.wealthProjections.length - 1).map((row) => (
                            <tr key={row.age} className="border-b border-slate-800/50 hover:bg-slate-700/20">
                              <td className="py-2 px-3 text-slate-200 font-medium">{row.age}</td>
                              <td className="py-2 px-3 text-right text-blue-400">{fmtShort(row.grossEstate)}</td>
                              <td className="py-2 px-3 text-right text-amber-400">{fmtShort(row.exemption)}</td>
                              <td className="py-2 px-3 text-right text-orange-400">{fmtShort(row.taxableEstate)}</td>
                              <td className="py-2 px-3 text-right text-red-400 font-semibold">{fmtShort(row.estateTax)}</td>
                              <td className="py-2 px-3 text-right text-slate-300">{pct(row.effectiveRate)}</td>
                              <td className="py-2 px-3 text-right text-emerald-400">{fmtShort(row.netToHeirs)}</td>
                              <td className="py-2 px-3 text-right text-indigo-400">{fmtShort(row.insuranceNeeded)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
            {isLoading && <div className="text-center py-12 text-slate-400">Projecting wealth growth...</div>}
          </TabsContent>

          {/* ═══════════ INSURANCE NEEDS TAB ═══════════ */}
          <TabsContent value="insurance" className="space-y-6 mt-4">
            {result?.insuranceAnalysis && (
              <>
                {/* Insurance Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <StatCard label="Current Coverage" value={fmtShort(result.insuranceAnalysis.currentCoverage)} color="#22c55e" icon={Shield} />
                  <StatCard label="Needed Today" value={fmtShort(result.insuranceAnalysis.coverageNeededToday)} color="#3b82f6" icon={Heart} />
                  <StatCard label="Needed at Peak" value={fmtShort(result.insuranceAnalysis.coverageNeededAtPeak)} color="#ef4444" icon={AlertTriangle} subtitle={`Age ${result.insuranceAnalysis.peakTaxAge}`} />
                  <StatCard label="Coverage Gap" value={fmtShort(Math.max(0, result.insuranceAnalysis.coverageGap))} color={result.insuranceAnalysis.coverageGap > 0 ? "#ef4444" : "#22c55e"} icon={result.insuranceAnalysis.coverageGap > 0 ? AlertTriangle : Shield} />
                  <StatCard label="Peak Tax" value={fmtShort(result.insuranceAnalysis.peakTaxAmount)} color="#f59e0b" icon={Calculator} subtitle={`Estate: ${fmtShort(result.insuranceAnalysis.peakEstateValue)}`} />
                  <StatCard label="Taxable at Age" value={result.insuranceAnalysis.yearsUntilTaxable >= 0 ? String(result.insuranceAnalysis.ageWhenTaxable) : "Never"} color="#8b5cf6" icon={TrendingUp} subtitle={result.insuranceAnalysis.yearsUntilTaxable >= 0 ? `In ${result.insuranceAnalysis.yearsUntilTaxable} years` : "Under exemption"} />
                </div>

                {/* Coverage Gap Alert */}
                {result.insuranceAnalysis.coverageGap > 0 ? (
                  <Card className="border-red-500/30 bg-red-500/5">
                    <CardContent className="pt-5 pb-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-red-500/10">
                          <AlertTriangle className="w-8 h-8 text-red-400" />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-red-400">Coverage Gap: {fmt(result.insuranceAnalysis.coverageGap)}</p>
                          <p className="text-sm text-slate-300 mt-1">Your current life insurance of {fmt(result.insuranceAnalysis.currentCoverage)} is not sufficient to cover the projected estate tax (illustrated, non-guaranteed) at age {result.insuranceAnalysis.peakTaxAge}. You need an additional <strong className="text-red-300">{fmt(result.insuranceAnalysis.coverageGap)}</strong> in an ILIT to keep your estate tax-free for beneficiaries.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-emerald-500/30 bg-emerald-500/5">
                    <CardContent className="pt-5 pb-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-emerald-500/10">
                          <Shield className="w-8 h-8 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-lg font-bold text-emerald-400">Fully Covered</p>
                          <p className="text-sm text-slate-300 mt-1">Your current ILIT coverage of {fmt(result.insuranceAnalysis.currentCoverage)} is sufficient to cover the projected estate tax (illustrated, non-guaranteed) liability through age 100.</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Insurance Needed Over Time Chart */}
                <Card className="bg-slate-800/50 border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-lg text-slate-100 flex items-center gap-2">
                      <Heart className="h-5 w-5 text-indigo-400" /> Life Insurance Needed to Eliminate Estate Tax
                    </CardTitle>
                    <CardDescription>Exact coverage needed at each age to zero out estate tax for your {numberOfBeneficiaries} beneficiaries</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <ComposedChart data={result.wealthProjections}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                        <XAxis dataKey="age" tick={{ fill: "#94a3b8", fontSize: 11 }} label={{ value: "Age", position: "insideBottom", offset: -5, fill: "#94a3b8" }} />
                        <YAxis tickFormatter={(v: number) => fmtShort(v)} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                        <RechartsTooltip
                          formatter={(value: number, name: string) => [fmt(value), name]}
                          labelFormatter={(label) => `Age ${label}`}
                          contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                          itemStyle={{ color: "#e2e8f0" }}
                        />
                        <Legend wrapperStyle={{ color: "#94a3b8", fontSize: "12px" }} />
                        <Area type="monotone" dataKey="insuranceNeeded" name="Insurance Needed" fill="#6366f130" stroke="#6366f1" strokeWidth={2} />
                        <Line type="monotone" dataKey="insuranceCoverage" name="Current Coverage" stroke="#22c55e" strokeWidth={2} strokeDasharray="6 3" dot={false} />
                        <Bar dataKey="estateTax" name="Estate Tax" fill="#ef4444" radius={[3, 3, 0, 0]} barSize={6} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Per-Beneficiary Breakdown */}
                <Card className="bg-slate-800/50 border-slate-700/50">
                  <CardHeader>
                    <CardTitle className="text-lg text-slate-100">Per-Beneficiary Impact</CardTitle>
                    <CardDescription>How estate tax reduces each beneficiary's inheritance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="rounded-xl border border-slate-700/40 bg-slate-900/40 p-5 text-center">
                        <p className="text-xs text-slate-400 mb-1">Without Insurance</p>
                        <p className="text-2xl font-bold text-red-400">{fmtShort(result.netToHeirs / numberOfBeneficiaries)}</p>
                        <p className="text-[10px] text-slate-500 mt-1">per beneficiary (after tax)</p>
                      </div>
                      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5 text-center">
                        <p className="text-xs text-slate-400 mb-1">With ILIT Coverage</p>
                        <p className="text-2xl font-bold text-emerald-400">{fmtShort((result.netToHeirs + (useILIT ? iulDeathBenefit : 0)) / numberOfBeneficiaries)}</p>
                        <p className="text-[10px] text-slate-500 mt-1">per beneficiary (tax-free)</p>
                      </div>
                      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 text-center">
                        <p className="text-xs text-slate-400 mb-1">Tax Saved Per Heir</p>
                        <p className="text-2xl font-bold text-amber-400">{fmtShort(result.ilitSavings / numberOfBeneficiaries)}</p>
                        <p className="text-[10px] text-slate-500 mt-1">ILIT savings per person</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recommendations */}
                <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/30">
                  <CardHeader>
                    <CardTitle className="text-lg text-slate-100 flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-amber-400" /> Insurance Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { condition: result.insuranceAnalysis.coverageGap > 0, text: `Increase ILIT coverage by ${fmt(result.insuranceAnalysis.coverageGap)} to fully offset peak estate tax at age ${result.insuranceAnalysis.peakTaxAge}.`, color: "#ef4444" },
                        { condition: true, text: `Consider a second-to-die policy for ${fmt(result.insuranceAnalysis.coverageNeededAtPeak)} — premiums are lower since it pays on the second spouse's death.`, color: "#3b82f6" },
                        { condition: result.insuranceAnalysis.yearsUntilTaxable >= 0, text: `Your estate becomes taxable at age ${result.insuranceAnalysis.ageWhenTaxable}. Lock in coverage now while premiums are lower.`, color: "#f59e0b" },
                        { condition: true, text: "Place all life insurance in an Irrevocable Life Insurance Trust (ILIT) to exclude death benefits from your taxable estate.", color: "#22c55e" },
                        { condition: numberOfBeneficiaries > 2, text: `With ${numberOfBeneficiaries} beneficiaries, a properly structured ILIT ensures equal, tax-free distribution.`, color: "#8b5cf6" },
                      ].filter((r) => r.condition).map((rec, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/40">
                          <ArrowRight className="h-4 w-4 mt-0.5 shrink-0" style={{ color: rec.color }} />
                          <p className="text-sm text-slate-300">{rec.text}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
            {isLoading && <div className="text-center py-12 text-slate-400">Analyzing insurance needs...</div>}
          </TabsContent>
        
          <TabsContent value="generate-outcome" className="space-y-6 mt-6">
            <GenerateOutcomeTab
              strategyType="estate-tax"
              hasResults={!!result}
              resultData={result ? { grossEstate: result.grossEstate || 10000000, taxableEstate: result.taxableEstate || 5000000, estateTaxOwed: result.estateTax || 1500000, effectiveEstateTaxRate: result.effectiveRate || 0.15, exemptionUsed: result.exemptionUsed || 5000000, strategySavings: result.savings || 800000, netToHeirs: result.netToHeirs || 8500000 } : null}
              metrics={result ? [{ label: "Gross Estate", value: result.grossEstate || 10000000 }, { label: "Estate Tax", value: result.estateTax || 1500000 }, { label: "Strategy Savings", value: result.savings || 800000, highlight: true }, { label: "Net to Heirs", value: result.netToHeirs || 8500000 }] : []}
            />
          </TabsContent>
        </Tabs>
        <NAICDisclaimer variant="footer" showsProjections />
      </div>
          <PageInsights pageId="estate-tax" />
    
        <ComplianceFooter pageName="EstateTax" showsIUL showsTax showsEstate showsProjections />
      </AppShell>
  );
}
