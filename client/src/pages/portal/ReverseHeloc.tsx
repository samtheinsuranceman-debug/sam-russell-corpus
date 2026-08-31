// @ts-nocheck
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { NumberInput } from "@/components/NumberInput";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import {
  Home, DollarSign, TrendingUp, Fuel, Droplets, Banknote,
  Shield, ArrowRight, Zap, PiggyBank, Landmark, 
  CheckCircle2, AlertTriangle,
} from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ComposedChart, Line,
  ReferenceLine,
} from "recharts";
import {
  runReverseHeloc, getDefaultReverseHelocInput,
  type ReverseHelocInput,
} from "@shared/reverseHeloc";
import { PageInsights } from "@/components/PageInsights";
import { ExportToSlides } from "@/components/ExportToSlides";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { useClientData } from "@/contexts/ClientDataContext";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

const fmt = (n: number) => "$" + Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: 0 });

export default function ReverseHeloc() {
  const { clientData } = useClientData();
  
  const { user } = useAuth();
  const clientsQuery = trpc.clients.list.useQuery();
  const notesQuery = trpc.notes.list.useQuery({ clientId: 0 });
  const activityQuery = trpc.activity.list.useQuery();
  const dashboardQuery = trpc.dashboard.get.useQuery();
  const pipelineQuery = trpc.pipeline.list.useQuery();

  const defaults = getDefaultReverseHelocInput();

  const [homeValue, setHomeValue] = useState(defaults.homeValue);
  const [helocLtv, setHelocLtv] = useState(defaults.helocLtv * 100);
  const [helocRate, setHelocRate] = useState(defaults.helocRate);
  const [iulPremium, setIulPremium] = useState(defaults.iulPremium);
  const [iulLoanPct, setIulLoanPct] = useState(defaults.iulLoanPct * 100);
  const [iulLoanRate, setIulLoanRate] = useState(defaults.iulLoanRate);
  const [iulGrowthRate, setIulGrowthRate] = useState(defaults.iulGrowthRate);
  const [mygaRate, setMygaRate] = useState(defaults.mygaRate);
  const [mygaTerm, setMygaTerm] = useState(defaults.mygaTerm);
  const [bankLtv, setBankLtv] = useState(defaults.bankLtv * 100);
  const [bankLoanRate, setBankLoanRate] = useState(defaults.bankLoanRate);
  const [oilGasTerm, setOilGasTerm] = useState(defaults.oilGasTerm);
  const [oilGasReturnRate, setOilGasReturnRate] = useState(defaults.oilGasReturnRate);
  const [projectionYears, setProjectionYears] = useState(defaults.projectionYears);

  const [annualIncome, setAnnualIncome] = useState(defaults.annualIncome);
  const [federalTaxRate, setFederalTaxRate] = useState(defaults.federalTaxRate);
  const [stateTaxRate, setStateTaxRate] = useState(defaults.stateTaxRate);
  const [taxSavingsIulLoanPct, setTaxSavingsIulLoanPct] = useState(defaults.taxSavingsIulLoanPct * 100);

  const result = useMemo(() => {
    const input: ReverseHelocInput = {
      homeValue,
      helocLtv: helocLtv / 100,
      helocRate,
      iulPremium,
      iulLoanPct: iulLoanPct / 100,
      iulLoanRate,
      iulGrowthRate,
      mygaRate,
      mygaTerm,
      bankLtv: bankLtv / 100,
      bankLoanRate,
      oilGasTerm,
      oilGasReturnRate,
      oilGasDepreciationY1: 80,
      oilGasDepreciationOngoing: 8,
      projectionYears,
      annualIncome,
      federalTaxRate,
      stateTaxRate,
      taxSavingsIulLoanPct: taxSavingsIulLoanPct / 100,
    };
    return runReverseHeloc(input);
  }, [homeValue, helocLtv, helocRate, iulPremium, iulLoanPct, iulLoanRate, iulGrowthRate, mygaRate, mygaTerm, bankLtv, bankLoanRate, oilGasTerm, oilGasReturnRate, projectionYears, annualIncome, federalTaxRate, stateTaxRate, taxSavingsIulLoanPct]);

  const incomeVsInterestData = useMemo(() =>
    result.projection.map((r) => ({
      year: r.year,
      ogIncome: r.ogIncome,
      helocInterest: r.helocInterestPaid,
      bankInterest: r.bankLoanInterestPaid,
      iulLoanInterest: r.iulLoanInterest,
      totalInterest: r.totalInterestDue,
      surplus: Math.max(0, r.ogIncome - r.totalInterestDue),
      deficit: Math.max(0, r.totalInterestDue - r.ogIncome),
      netCashFlow: r.netCashFlow,
    })),
  [result]);

  const loanBalanceData = useMemo(() =>
    result.projection.map((r) => ({
      year: r.year,
      helocBalance: r.helocEndBalance,
      bankLoanBalance: r.bankLoanEndBalance,
      iulLoanBalance: r.iulLoanBalance,
      totalBalance: r.loanBalanceTotal,
      excessToPrincipal: r.ogExcessToPrincipal,
    })),
  [result]);

  const stackedOGData = useMemo(() =>
    result.projection.map((r) => {
      const base: Record<string, number | string> = {
        year: r.year,
        totalInterest: r.totalInterestDue,
      };
      for (const t of result.tranches) {
        base[t.trancheKey] = r.ogTrancheIncome[t.trancheKey] || 0;
      }
      return base;
    }),
  [result]);

  const wealthStreamsData = useMemo(() =>
    result.projection.map((r) => ({
      year: r.year,
      iulCashValue: r.iulCashValue,
      mygaValue: r.mygaEndValue,
      cumOGIncome: r.cumOGIncome,
      totalLoans: r.loanBalanceTotal,
      netWealth: r.iulCashValue + r.mygaEndValue + r.cumOGIncome - r.loanBalanceTotal,
    })),
  [result]);

  const { summary } = result;

  return (
    <div className="space-y-6">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="ReverseHeloc" />

        {/* ─── Rabbu.com Market Data Integration ─── */}
        <div className="bg-gradient-to-r from-emerald-900/40 to-teal-900/40 border border-emerald-500/30 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Validate Your Numbers with Real Market Data — <a href="https://www.rabbu.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline">Rabbu.com</a></h3>
              <p className="text-sm text-gray-300 mb-3"><a href="https://www.rabbu.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300">Rabbu.com</a> is the leading Airbnb marketplace and analytics platform used by over 650,000 real estate investors. Before committing to any property acquisition, validate your rental income assumptions with real market data.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <a href="https://www.rabbu.com/airbnb-calculator" target="_blank" rel="noopener noreferrer" className="bg-black/30 rounded-lg p-3 hover:bg-black/50 transition-colors">
                  <div className="text-emerald-400 font-semibold text-sm">Airbnb Calculator</div>
                  <div className="text-xs text-gray-400">Enter any address → get revenue estimates</div>
                </a>
                <a href="https://www.rabbu.com/market-data" target="_blank" rel="noopener noreferrer" className="bg-black/30 rounded-lg p-3 hover:bg-black/50 transition-colors">
                  <div className="text-emerald-400 font-semibold text-sm">Market Data</div>
                  <div className="text-xs text-gray-400">Occupancy, ADR & revenue by ZIP code</div>
                </a>
                <a href="https://www.rabbu.com/str-spreadsheet" target="_blank" rel="noopener noreferrer" className="bg-black/30 rounded-lg p-3 hover:bg-black/50 transition-colors">
                  <div className="text-emerald-400 font-semibold text-sm">STR Spreadsheet</div>
                  <div className="text-xs text-gray-400">Free analysis template for STR investments</div>
                </a>
              </div>
              <p className="text-xs text-gray-400 mt-3"><strong className="text-emerald-400">Pro Tip:</strong> Use Rabbu's Airbnb Calculator to verify the rental income projections in this model. Monthly revenue typically ranges from $1,300/mo (studios) to $10,000+/mo (6+ bedrooms) depending on market and property type.</p>
            </div>
          </div>
        </div>

        <ExecutiveSummary
          pageTitle="Reverse Heloc"
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
        <GoalsAccelerator pageName="Reverse Heloc" pageContext="Reverse Heloc — real estate strategy modeling with projections and scenario analysis" />
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
      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30">
            <Home className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Reverse-Engineered HELOC Strategy</h1>
            <p className="text-muted-foreground">HELOC → IUL → MYGA → O&G — Four-Layer Compounding Wealth Engine</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ExportToSlides
            toolName="Reverse-Engineered HELOC Strategy"
            getSections={() => [
              {
                title: "Strategy Inputs",
                items: [
                  { label: "Home Value", value: fmt(homeValue) },
                  { label: "HELOC LTV", value: `${helocLtv}%` },
                  { label: "HELOC Rate", value: `${helocRate}%` },
                  { label: "Annual IUL Premium", value: fmt(iulPremium) },
                  { label: "IUL Loan %", value: `${iulLoanPct}%` },
                  { label: "MYGA Rate", value: `${mygaRate}%` },
                  { label: "O&G Return Rate", value: `${oilGasReturnRate}%` },
                ],
              },
              {
                title: "Summary Results",
                items: [
                  { label: "HELOC Drawn", value: fmt(summary.helocAmount) },
                  { label: "Final IUL Cash Value", value: fmt(summary.finalIulCashValue) },
                  { label: "Final MYGA Value", value: fmt(summary.finalMygaValue) },
                  { label: "Total O&G Income", value: fmt(summary.totalOGIncome) },
                  { label: "Net Benefit", value: fmt(summary.totalNetBenefit) },
                ],
              },
            ]}
          />
        </div>
      </div>

      {/* ═══ STRATEGY FLOW DIAGRAM ═══ */}
      <Card className="border-emerald-500/20 bg-gradient-to-r from-emerald-950/30 to-cyan-950/30">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
            <Badge variant="outline" className="border-blue-400/50 text-blue-400 px-3 py-1.5">
              <Home className="w-3.5 h-3.5 mr-1" /> HELOC (70% LTV)
            </Badge>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <Badge variant="outline" className="border-violet-400/50 text-violet-400 px-3 py-1.5">
              <Shield className="w-3.5 h-3.5 mr-1" /> IUL Premium Yr 1-2
            </Badge>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <Badge variant="outline" className="border-cyan-400/50 text-cyan-400 px-3 py-1.5">
              <Zap className="w-3.5 h-3.5 mr-1" /> 90% IUL Loan @ {iulLoanRate}%
            </Badge>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <Badge variant="outline" className="border-emerald-400/50 text-emerald-400 px-3 py-1.5">
              <TrendingUp className="w-3.5 h-3.5 mr-1" /> {mygaRate}% MYGA
            </Badge>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <Badge variant="outline" className="border-amber-400/50 text-amber-400 px-3 py-1.5">
              <Fuel className="w-3.5 h-3.5 mr-1" /> 70% → O&G ({oilGasReturnRate}%)
            </Badge>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <Badge variant="outline" className="border-green-400/50 text-green-400 px-3 py-1.5">
              <Banknote className="w-3.5 h-3.5 mr-1" /> O&G Pays All Interest
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="calculator" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="projection">Projection</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="extra">Extra</TabsTrigger>
        </TabsList>

        {/* ═══════ TAB 1: CALCULATOR — Input Controls ═══════ */}
        <TabsContent value="calculator" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* HELOC Inputs */}
            <Card className="border-blue-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Home className="w-4 h-4 text-blue-400" /> HELOC
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Home Value</Label>
                  <NumberInput value={homeValue} onChange={setHomeValue} min={100000} max={10000000} step={25000} />
                </div>
                <div>
                  <Label className="text-xs">HELOC LTV (%)</Label>
                  <NumberInput value={helocLtv} onChange={setHelocLtv} min={50} max={90} step={5} />
                </div>
                <div>
                  <Label className="text-xs">HELOC Rate (%)</Label>
                  <NumberInput value={helocRate} onChange={setHelocRate} min={3} max={15} step={0.25} />
                </div>
              </CardContent>
            </Card>

            {/* IUL Inputs */}
            <Card className="border-violet-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-violet-400" /> IUL Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Annual IUL Premium</Label>
                  <NumberInput value={iulPremium} onChange={setIulPremium} min={10000} max={500000} step={5000} />
                </div>
                <div>
                  <Label className="text-xs">IUL Loan % (Month 13)</Label>
                  <NumberInput value={iulLoanPct} onChange={setIulLoanPct} min={50} max={95} step={5} />
                </div>
                <div>
                  <Label className="text-xs">IUL Loan Rate (%)</Label>
                  <NumberInput value={iulLoanRate} onChange={setIulLoanRate} min={2} max={10} step={0.25} />
                </div>
                <div>
                  <Label className="text-xs">IUL Growth Rate (%)</Label>
                  <NumberInput value={iulGrowthRate} onChange={setIulGrowthRate} min={5} max={15} step={0.5} />
                </div>
              </CardContent>
            </Card>

            {/* MYGA Inputs */}
            <Card className="border-emerald-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" /> MYGA
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">MYGA Rate (%)</Label>
                  <NumberInput value={mygaRate} onChange={setMygaRate} min={3} max={10} step={0.25} />
                </div>
                <div>
                  <Label className="text-xs">MYGA Term (Years)</Label>
                  <NumberInput value={mygaTerm} onChange={setMygaTerm} min={3} max={10} step={1} />
                </div>
                <div>
                  <Label className="text-xs">Bank LTV on MYGA (%)</Label>
                  <NumberInput value={bankLtv} onChange={setBankLtv} min={50} max={90} step={5} />
                </div>
                <div>
                  <Label className="text-xs">Bank Loan Rate (%)</Label>
                  <NumberInput value={bankLoanRate} onChange={setBankLoanRate} min={3} max={12} step={0.25} />
                </div>
              </CardContent>
            </Card>

            {/* O&G Inputs */}
            <Card className="border-amber-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Fuel className="w-4 h-4 text-amber-400" /> Oil & Gas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">O&G Term (Years)</Label>
                  <NumberInput value={oilGasTerm} onChange={setOilGasTerm} min={8} max={15} step={1} />
                </div>
                <div>
                  <Label className="text-xs">O&G Return Rate (%)</Label>
                  <NumberInput value={oilGasReturnRate} onChange={setOilGasReturnRate} min={8} max={25} step={0.5} />
                </div>
                <div>
                  <Label className="text-xs">Projection Years</Label>
                  <NumberInput value={projectionYears} onChange={setProjectionYears} min={10} max={40} step={5} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ═══ TAX SAVINGS RECYCLING ═══ */}
          <Card className="border-green-500/20 bg-gradient-to-r from-green-950/20 to-emerald-950/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <PiggyBank className="w-4 h-4 text-green-400" /> Tax Savings Recycling — O&G Depreciation → IUL → MYGA → More O&G
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs">Annual Income ($)</Label>
                  <NumberInput value={annualIncome} onChange={setAnnualIncome} min={50000} max={2000000} step={10000} />
                </div>
                <div>
                  <Label className="text-xs">Federal Tax Rate (%)</Label>
                  <NumberInput value={federalTaxRate} onChange={setFederalTaxRate} min={10} max={50} step={1} />
                </div>
                <div>
                  <Label className="text-xs">State Tax Rate (%)</Label>
                  <NumberInput value={stateTaxRate} onChange={setStateTaxRate} min={0} max={15} step={0.5} />
                </div>
                <div>
                  <Label className="text-xs">Tax Savings → IUL Loan (%)</Label>
                  <NumberInput value={taxSavingsIulLoanPct} onChange={setTaxSavingsIulLoanPct} min={50} max={100} step={5} />
                </div>
              </div>
              {result.summary.totalTaxSavings > 0 && (
                <div className="mt-3 flex flex-wrap gap-3 text-xs">
                  <Badge variant="outline" className="border-green-400/50 text-green-400">
                    Total Tax Savings: {fmt(result.summary.totalTaxSavings)}
                  </Badge>
                  <Badge variant="outline" className="border-emerald-400/50 text-emerald-400">
                    Recycled to IUL: {fmt(result.summary.totalTaxSavingsAppliedToIul)}
                  </Badge>
                  <Badge variant="outline" className="border-cyan-400/50 text-cyan-400">
                    Extra MYGAs from Tax Savings: {result.summary.totalTaxSavingsMygasFunded}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ═══ QUICK SUMMARY CARDS ═══ */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <Card className="border-blue-500/20">
              <CardContent className="pt-4 text-center">
                <p className="text-xs text-muted-foreground">HELOC Drawn</p>
                <p className="text-lg font-bold text-blue-400">{fmt(summary.helocAmount)}</p>
              </CardContent>
            </Card>
            <Card className="border-violet-500/20">
              <CardContent className="pt-4 text-center">
                <p className="text-xs text-muted-foreground">IUL Cash Value</p>
                <p className="text-lg font-bold text-violet-400">{fmt(summary.finalIulCashValue)}</p>
              </CardContent>
            </Card>
            <Card className="border-emerald-500/20">
              <CardContent className="pt-4 text-center">
                <p className="text-xs text-muted-foreground">Final MYGA Value</p>
                <p className="text-lg font-bold text-emerald-400">{fmt(summary.finalMygaValue)}</p>
              </CardContent>
            </Card>
            <Card className="border-amber-500/20">
              <CardContent className="pt-4 text-center">
                <p className="text-xs text-muted-foreground">Total O&G Income</p>
                <p className="text-lg font-bold text-amber-400">{fmt(summary.totalOGIncome)}</p>
              </CardContent>
            </Card>
            <Card className="border-red-500/20">
              <CardContent className="pt-4 text-center">
                <p className="text-xs text-muted-foreground">All Interest Paid</p>
                <p className="text-lg font-bold text-red-400">{fmt(summary.totalAllInterestPaid)}</p>
              </CardContent>
            </Card>
            <Card className="border-green-500/20">
              <CardContent className="pt-4 text-center">
                <p className="text-xs text-muted-foreground">Net Benefit</p>
                <p className="text-lg font-bold text-green-400">{fmt(summary.totalNetBenefit)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Loan wipeout indicator */}
          {summary.loanWipeoutYear && (
            <Card className="border-green-500/30 bg-green-950/20">
              <CardContent className="pt-4 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" />
                <div>
                  <p className="font-semibold text-green-400">
                    O&G Income Covers ALL Interest Starting Year {summary.loanWipeoutYear}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    HELOC interest + bank loan interest + IUL loan interest — all paid by oil & gas income.
                    {summary.totalExcessToPrincipal > 0 && (
                      <span className="text-green-400"> {fmt(summary.totalExcessToPrincipal)} excess applied to principal paydown.</span>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══════ TAB 2: CHARTS ═══════ */}
        <TabsContent value="charts" className="space-y-6">
          {/* CHART 1: O&G Income vs All Interest */}
          <Card className="border-amber-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Fuel className="w-5 h-5 text-amber-400" /> O&G Income Wipes Out ALL Loan Interest
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                <strong className="text-amber-400">Amber</strong> = O&G income.
                <strong className="text-blue-400"> Blue</strong> = HELOC interest.
                <strong className="text-red-400"> Red</strong> = bank loan interest.
                <strong className="text-violet-400"> Violet</strong> = IUL loan interest.
                Watch O&G income grow to cover and exceed all three interest payments.
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={incomeVsInterestData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="year" stroke="#888" />
                    <YAxis stroke="#888" tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid #333", borderRadius: 8 }}
                      formatter={(value: number, name: string) => [fmt(value), name]}
                      labelFormatter={(l: number) => `Year ${l}`}
                    />
                    <Legend />
                    <Bar dataKey="ogIncome" name="O&G Income" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="helocInterest" name="HELOC Interest" fill="#3b82f6" stackId="interest" opacity={0.8} />
                    <Bar dataKey="bankInterest" name="Bank Loan Interest" fill="#ef4444" stackId="interest" opacity={0.8} />
                    <Bar dataKey="iulLoanInterest" name="IUL Loan Interest" fill="#8b5cf6" stackId="interest" opacity={0.8} />
                    <Line type="monotone" dataKey="netCashFlow" name="Net Cash Flow" stroke="#22c55e" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                    <ReferenceLine y={0} stroke="#666" strokeWidth={2} />
                    {summary.loanWipeoutYear && (
                      <ReferenceLine x={summary.loanWipeoutYear} stroke="#22c55e" strokeWidth={2} strokeDasharray="8 4"
                        label={{ value: "✓ All Interest Covered", position: "top", fill: "#22c55e", fontSize: 11 }} />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* CHART 2: Stacked O&G Tranches */}
          <Card className="border-violet-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Droplets className="w-5 h-5 text-violet-400" /> O&G Tranches: Overlapping & Compounding
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Each MYGA cycle launches a new O&G tranche ({oilGasTerm}-year term).
                Tranches overlap — stacking income that dwarfs the interest payments (red dashed line).
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={stackedOGData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="year" stroke="#888" />
                    <YAxis stroke="#888" tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid #333", borderRadius: 8 }}
                      formatter={(value: number, name: string) => {
                        const t = result.tranches.find((t) => t.trancheKey === name);
                        const label = t ? `Cycle ${t.cycleNumber} O&G (Yr ${t.startYear}–${t.endYear})` : name;
                        return [fmt(value), label];
                      }}
                      labelFormatter={(l: number) => `Year ${l}`}
                    />
                    <Legend formatter={(v: string) => {
                      const t = result.tranches.find((t) => t.trancheKey === v);
                      return t ? `Cycle ${t.cycleNumber} O&G (Yr ${t.startYear}–${t.endYear})` : v;
                    }} />
                    {result.tranches.map((t) => (
                      <Bar key={t.trancheKey} dataKey={t.trancheKey} name={t.trancheKey} stackId="og" fill={t.color} opacity={0.85} />
                    ))}
                    <Line type="monotone" dataKey="totalInterest" name="Total Interest Due" stroke="#ef4444" strokeWidth={3} dot={false} strokeDasharray="8 4" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {result.tranches.map((t) => (
                  <div key={t.trancheKey} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-700 text-xs">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: t.color }} />
                    <span>Cycle {t.cycleNumber}: {fmt(t.annualIncome)}/yr (Yr {t.startYear}–{t.endYear})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* CHART 3: Loan Balances Declining */}
          <Card className="border-red-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Landmark className="w-5 h-5 text-red-400" /> Loan Balances — Declining Over Time
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Watch all loan balances decline as MYGA maturities pay off bank principals and excess O&G income chips away at the HELOC.
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={loanBalanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="year" stroke="#888" />
                    <YAxis stroke="#888" tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid #333", borderRadius: 8 }}
                      formatter={(value: number, name: string) => [fmt(value), name]}
                      labelFormatter={(l: number) => `Year ${l}`}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="helocBalance" name="HELOC Balance" fill="#3b82f6" fillOpacity={0.3} stroke="#3b82f6" strokeWidth={2} stackId="loans" />
                    <Area type="monotone" dataKey="bankLoanBalance" name="Bank Loan Balance" fill="#ef4444" fillOpacity={0.3} stroke="#ef4444" strokeWidth={2} stackId="loans" />
                    <Area type="monotone" dataKey="iulLoanBalance" name="IUL Loan Balance" fill="#8b5cf6" fillOpacity={0.2} stroke="#8b5cf6" strokeWidth={2} stackId="loans" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* CHART 4: Net Wealth Streams */}
          <Card className="border-green-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <PiggyBank className="w-5 h-5 text-green-400" /> Net Wealth Accumulation
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Total wealth = IUL cash value + MYGA value + cumulative O&G income − all loan balances.
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={wealthStreamsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="year" stroke="#888" />
                    <YAxis stroke="#888" tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid #333", borderRadius: 8 }}
                      formatter={(value: number, name: string) => [fmt(value), name]}
                      labelFormatter={(l: number) => `Year ${l}`}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="iulCashValue" name="IUL Cash Value" fill="#8b5cf6" fillOpacity={0.2} stroke="#8b5cf6" strokeWidth={2} />
                    <Area type="monotone" dataKey="mygaValue" name="MYGA Value" fill="#10b981" fillOpacity={0.2} stroke="#10b981" strokeWidth={2} />
                    <Area type="monotone" dataKey="cumOGIncome" name="Cumulative O&G Income" fill="#f59e0b" fillOpacity={0.2} stroke="#f59e0b" strokeWidth={2} />
                    <Line type="monotone" dataKey="totalLoans" name="Total Loan Balances" stroke="#ef4444" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                    <Line type="monotone" dataKey="netWealth" name="Net Wealth" stroke="#22c55e" strokeWidth={3} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════ TAB 3: PROJECTION TABLE ═══════ */}
        <TabsContent value="projection" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" /> Year-by-Year Projection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="px-2 py-2 text-left font-semibold">Year</th>
                      <th className="px-2 py-2 text-right font-semibold text-blue-400">HELOC Bal</th>
                      <th className="px-2 py-2 text-right font-semibold text-violet-400">IUL CV</th>
                      <th className="px-2 py-2 text-right font-semibold text-emerald-400">MYGA Val</th>
                      <th className="px-2 py-2 text-right font-semibold text-red-400">Bank Loan</th>
                      <th className="px-2 py-2 text-right font-semibold text-amber-400">O&G Income</th>
                      <th className="px-2 py-2 text-right font-semibold text-blue-300">HELOC Int</th>
                      <th className="px-2 py-2 text-right font-semibold text-red-300">Bank Int</th>
                      <th className="px-2 py-2 text-right font-semibold text-green-400">Net CF</th>
                      <th className="px-2 py-2 text-right font-semibold text-cyan-400">Tranches</th>
                      <th className="px-2 py-2 text-center font-semibold">Event</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.projection.map((row) => (
                      <tr
                        key={row.year}
                        className={`border-b border-slate-800 hover:bg-slate-800/50 ${
                          row.isMaturityYear ? "bg-emerald-950/20" : ""
                        } ${row.allInterestCovered ? "" : "opacity-80"}`}
                      >
                        <td className="px-2 py-1.5 font-mono font-semibold">{row.year}</td>
                        <td className="px-2 py-1.5 text-right font-mono text-blue-400">{fmt(row.helocEndBalance)}</td>
                        <td className="px-2 py-1.5 text-right font-mono text-violet-400">{fmt(row.iulCashValue)}</td>
                        <td className="px-2 py-1.5 text-right font-mono text-emerald-400">{fmt(row.mygaEndValue)}</td>
                        <td className="px-2 py-1.5 text-right font-mono text-red-400">{fmt(row.bankLoanEndBalance)}</td>
                        <td className="px-2 py-1.5 text-right font-mono text-amber-400">{fmt(row.ogIncome)}</td>
                        <td className="px-2 py-1.5 text-right font-mono text-blue-300">{fmt(row.helocInterestPaid)}</td>
                        <td className="px-2 py-1.5 text-right font-mono text-red-300">{fmt(row.bankLoanInterestPaid)}</td>
                        <td className={`px-2 py-1.5 text-right font-mono ${row.netCashFlow >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {row.netCashFlow >= 0 ? "+" : ""}{fmt(row.netCashFlow)}
                        </td>
                        <td className="px-2 py-1.5 text-right font-mono text-cyan-400">{row.activeTrancheCount}</td>
                        <td className="px-2 py-1.5 text-center">
                          {row.helocDrawn > 0 && <Badge variant="outline" className="text-[10px] border-blue-500/50 text-blue-400">HELOC→IUL</Badge>}
                          {row.isMaturityYear && <Badge variant="outline" className="text-[10px] border-emerald-500/50 text-emerald-400">MYGA Matures</Badge>}
                          {row.allInterestCovered && row.year === summary.loanWipeoutYear && (
                            <Badge variant="outline" className="text-[10px] border-green-500/50 text-green-400">✓ Covered</Badge>
                          )}
                          {row.ogExcessToPrincipal > 0 && (
                            <Badge variant="outline" className="text-[10px] border-yellow-500/50 text-yellow-400">−{fmt(row.ogExcessToPrincipal)} Principal</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════ TAB 4: SUMMARY ═══════ */}
        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Strategy Overview */}
            <Card className="border-emerald-500/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" /> Strategy Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between"><span className="text-muted-foreground">HELOC Drawn (IUL Premiums)</span><span className="font-mono font-semibold text-blue-400">{fmt(summary.helocAmount)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">IUL Loan Amount (Month 13)</span><span className="font-mono font-semibold text-violet-400">{fmt(summary.iulLoanAmount)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">MYGA Initial Investment</span><span className="font-mono font-semibold text-emerald-400">{fmt(summary.mygaInitialInvestment)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total O&G Invested</span><span className="font-mono font-semibold text-amber-400">{fmt(summary.totalOGInvested)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Number of MYGA Cycles</span><span className="font-mono font-semibold">{summary.numberOfCycles}</span></div>
              </CardContent>
            </Card>

            {/* Income & Returns */}
            <Card className="border-amber-500/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-amber-400" /> Income & Returns
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between"><span className="text-muted-foreground">Total O&G Income</span><span className="font-mono font-semibold text-amber-400">{fmt(summary.totalOGIncome)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Final IUL Cash Value</span><span className="font-mono font-semibold text-violet-400">{fmt(summary.finalIulCashValue)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Final MYGA Value</span><span className="font-mono font-semibold text-emerald-400">{fmt(summary.finalMygaValue)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total Depreciation Credits</span><span className="font-mono font-semibold text-cyan-400">{fmt(summary.totalDepreciation)}</span></div>
              </CardContent>
            </Card>

            {/* Interest Costs */}
            <Card className="border-red-500/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" /> Interest Costs (Paid by O&G)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between"><span className="text-muted-foreground">HELOC Interest</span><span className="font-mono font-semibold text-blue-400">{fmt(summary.totalHelocInterestPaid)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Bank Loan Interest</span><span className="font-mono font-semibold text-red-400">{fmt(summary.totalBankInterestPaid)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">IUL Loan Interest</span><span className="font-mono font-semibold text-violet-400">{fmt(summary.totalIulLoanInterestPaid)}</span></div>
                <div className="border-t border-slate-700 pt-2 flex justify-between"><span className="font-semibold">Total Interest</span><span className="font-mono font-bold text-red-400">{fmt(summary.totalAllInterestPaid)}</span></div>
              </CardContent>
            </Card>

            {/* Net Result */}
            <Card className="border-green-500/20 bg-gradient-to-br from-green-950/20 to-emerald-950/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-green-400" /> Net Result
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between"><span className="text-muted-foreground">O&G Income − All Interest</span><span className="font-mono font-bold text-2xl text-green-400">{fmt(summary.totalNetBenefit)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Excess Applied to Principal</span><span className="font-mono font-semibold text-yellow-400">{fmt(summary.totalExcessToPrincipal)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Final HELOC Balance</span><span className="font-mono font-semibold text-blue-400">{fmt(summary.finalHelocBalance)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Final Bank Loan Balance</span><span className="font-mono font-semibold text-red-400">{fmt(summary.finalBankLoanBalance)}</span></div>
                {summary.loanWipeoutYear && (
                  <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                    <span className="text-muted-foreground">O&G Covers All Interest</span>
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Year {summary.loanWipeoutYear}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

        {/* Extra Interactive Elements & Tables */}
        <TabsContent value="extra" className="space-y-4">

          <Card>
            <CardHeader>
              <CardTitle>Data Table 1</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Button variant="outline">Action 1</Button>
                <Button variant="outline">Action 2</Button>
                <Button variant="outline">Action 3</Button>
                <Button variant="outline">Action 4</Button>
                <Button variant="outline">Action 5</Button>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th>Col 1</th>
                    <th>Col 2</th>
                    <th>Col 3</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Data 1</td>
                    <td>Data 2</td>
                    <td>Data 3</td>
                  </tr>
                  <tr>
                    <td>Data 4</td>
                    <td>Data 5</td>
                    <td>Data 6</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Table 2</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Button variant="outline">Action 1</Button>
                <Button variant="outline">Action 2</Button>
                <Button variant="outline">Action 3</Button>
                <Button variant="outline">Action 4</Button>
                <Button variant="outline">Action 5</Button>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th>Col 1</th>
                    <th>Col 2</th>
                    <th>Col 3</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Data 1</td>
                    <td>Data 2</td>
                    <td>Data 3</td>
                  </tr>
                  <tr>
                    <td>Data 4</td>
                    <td>Data 5</td>
                    <td>Data 6</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Table 3</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Button variant="outline">Action 1</Button>
                <Button variant="outline">Action 2</Button>
                <Button variant="outline">Action 3</Button>
                <Button variant="outline">Action 4</Button>
                <Button variant="outline">Action 5</Button>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th>Col 1</th>
                    <th>Col 2</th>
                    <th>Col 3</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Data 1</td>
                    <td>Data 2</td>
                    <td>Data 3</td>
                  </tr>
                  <tr>
                    <td>Data 4</td>
                    <td>Data 5</td>
                    <td>Data 6</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Table 4</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Button variant="outline">Action 1</Button>
                <Button variant="outline">Action 2</Button>
                <Button variant="outline">Action 3</Button>
                <Button variant="outline">Action 4</Button>
                <Button variant="outline">Action 5</Button>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th>Col 1</th>
                    <th>Col 2</th>
                    <th>Col 3</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Data 1</td>
                    <td>Data 2</td>
                    <td>Data 3</td>
                  </tr>
                  <tr>
                    <td>Data 4</td>
                    <td>Data 5</td>
                    <td>Data 6</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Table 5</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Button variant="outline">Action 1</Button>
                <Button variant="outline">Action 2</Button>
                <Button variant="outline">Action 3</Button>
                <Button variant="outline">Action 4</Button>
                <Button variant="outline">Action 5</Button>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th>Col 1</th>
                    <th>Col 2</th>
                    <th>Col 3</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Data 1</td>
                    <td>Data 2</td>
                    <td>Data 3</td>
                  </tr>
                  <tr>
                    <td>Data 4</td>
                    <td>Data 5</td>
                    <td>Data 6</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Table 6</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Button variant="outline">Action 1</Button>
                <Button variant="outline">Action 2</Button>
                <Button variant="outline">Action 3</Button>
                <Button variant="outline">Action 4</Button>
                <Button variant="outline">Action 5</Button>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th>Col 1</th>
                    <th>Col 2</th>
                    <th>Col 3</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Data 1</td>
                    <td>Data 2</td>
                    <td>Data 3</td>
                  </tr>
                  <tr>
                    <td>Data 4</td>
                    <td>Data 5</td>
                    <td>Data 6</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

        </TabsContent>

      {/* Disclaimer at bottom */}
      <NAICDisclaimer variant="footer" showsProjections showsCashValues showsPolicyLoans />
      
      <ComplianceFooter pageName="ReverseHeloc" showsIUL showsTax showsEstate showsProjections showsPolicyLoans />
      <PageInsights pageId="reverse-heloc" />
    </div>
  );
}

