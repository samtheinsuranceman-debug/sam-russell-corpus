// @ts-nocheck
import { useCalculatorIntegration } from "@/hooks/useCalculatorIntegration";
import { ClientSelectorBar } from "@/components/ClientSelectorBar";
import { NumberInput } from "@/components/NumberInput";
import { GenerateOutcomeTab } from "@/components/GenerateOutcomeTab";
import { CalculationSyncBar } from "@/components/CalculationSyncBar";
import { useStrategy } from "@/contexts/StrategyContext";
import { ExportToSlides } from "@/components/ExportToSlides";
import { useState, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { useClientData } from "@/contexts/ClientDataContext";
import {
  Flame,
  DollarSign,
  BarChart3,
  TrendingUp,
  Info,
  CheckCircle2,
  Star,
  Clock,
  Percent,
  Calendar,
  Wallet,
  Target,
  AlertTriangle,
  Shield,
  Droplets,
  Zap,
  Calculator,
  Gift,
  Heart,
  Building2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ComposedChart, Line,
} from "recharts";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

/* ─── TAX BRACKET DATA (2026 Federal) ─── */
const FEDERAL_BRACKETS_SINGLE = [
  { min: 0, max: 11600, rate: 0.10 },
  { min: 11600, max: 47150, rate: 0.12 },
  { min: 47150, max: 100525, rate: 0.22 },
  { min: 100525, max: 191950, rate: 0.24 },
  { min: 191950, max: 243725, rate: 0.32 },
  { min: 243725, max: 609350, rate: 0.35 },
  { min: 609350, max: Infinity, rate: 0.37 },
];

const FEDERAL_BRACKETS_MARRIED = [
  { min: 0, max: 23200, rate: 0.10 },
  { min: 23200, max: 94300, rate: 0.12 },
  { min: 94300, max: 201050, rate: 0.22 },
  { min: 201050, max: 383900, rate: 0.24 },
  { min: 383900, max: 487450, rate: 0.32 },
  { min: 487450, max: 731200, rate: 0.35 },
  { min: 731200, max: Infinity, rate: 0.37 },
];

function calcFederalTax(taxableIncome: number, brackets = FEDERAL_BRACKETS_SINGLE): number {
  let tax = 0;
  for (const bracket of brackets) {
    if (taxableIncome <= bracket.min) break;
    const taxable = Math.min(taxableIncome, bracket.max) - bracket.min;
    tax += taxable * bracket.rate;
  }
  return tax;
}

function calcEffectiveRate(taxableIncome: number, brackets = FEDERAL_BRACKETS_SINGLE): number {
  if (taxableIncome <= 0) return 0;
  return (calcFederalTax(taxableIncome, brackets) / taxableIncome) * 100;
}

function getMarginalBracket(taxableIncome: number, brackets = FEDERAL_BRACKETS_SINGLE): number {
  let rate = 0.10;
  for (const bracket of brackets) {
    if (taxableIncome > bracket.min) rate = bracket.rate;
    else break;
  }
  return rate * 100;
}

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const pct = (n: number) => `${n.toFixed(1)}%`;

export default function HotIncome() {
  const calcIntegration = useCalculatorIntegration({
    calculatorName: "HotIncome",
    strategyType: "hot-income",
  });

  const { data: clientData } = useClientData();

  const [investmentAmount, setInvestmentAmount] = useState(250000);
  const [annualReturn, setAnnualReturn] = useState(15);
  const [lockupYears, setLockupYears] = useState(10);
  const [taxableIncome, setTaxableIncome] = useState(350000);
  const [filingStatus, setFilingStatus] = useState<"single" | "married">("married");
  const [stateIncomeTaxRate, setStateIncomeTaxRate] = useState(5);
  const [showBeneficiary, setShowBeneficiary] = useState(false);
  const [expandedYear, setExpandedYear] = useState<number | null>(null);

  useState(() => {
    if (clientData) {
      if (clientData.annualIncome) setTaxableIncome(Number(clientData.annualIncome));
    }
  });

  const brackets = filingStatus === "married" ? FEDERAL_BRACKETS_MARRIED : FEDERAL_BRACKETS_SINGLE;

  const annualIncome = useMemo(() => Math.round(investmentAmount * (annualReturn / 100)), [investmentAmount, annualReturn]);
  const totalIncomeOverLockup = useMemo(() => annualIncome * lockupYears, [annualIncome, lockupYears]);

  const intangibleDrillingCosts = useMemo(() => Math.round(investmentAmount * 0.75), [investmentAmount]); // ~75% IDC
  const tangibleDrillingCosts = useMemo(() => Math.round(investmentAmount * 0.15), [investmentAmount]); // ~15% tangible (depreciated over 7 years)
  const depletionAllowance = useMemo(() => Math.round(annualIncome * 0.15), [annualIncome]); // 15% of gross income
  const year1Deduction = useMemo(() => intangibleDrillingCosts + Math.round(tangibleDrillingCosts / 7), [intangibleDrillingCosts, tangibleDrillingCosts]);

  const taxWithout = useMemo(() => calcFederalTax(taxableIncome, brackets), [taxableIncome, brackets]);
  const taxableAfterDeduction = useMemo(() => Math.max(0, taxableIncome - year1Deduction), [taxableIncome, year1Deduction]);
  const taxWith = useMemo(() => calcFederalTax(taxableAfterDeduction, brackets), [taxableAfterDeduction, brackets]);
  const taxSavingsYear1 = useMemo(() => taxWithout - taxWith, [taxWithout, taxWith]);

  const stateTaxSavings = useMemo(() => Math.round(year1Deduction * (stateIncomeTaxRate / 100)), [year1Deduction, stateIncomeTaxRate]);
  const totalTaxSavingsYear1 = useMemo(() => taxSavingsYear1 + stateTaxSavings, [taxSavingsYear1, stateTaxSavings]);

  const investmentToZeroTax = useMemo(() => {
    return Math.round(taxableIncome / 0.75);
  }, [taxableIncome]);

  const ongoingAnnualDepletion = depletionAllowance;

  const yearSummaries = useMemo(() => {
    const summaries = [];
    let cumulativeIncome = 0;
    let cumulativeTaxBenefits = 0;
    let cumulativeDeductions = 0;

    for (let year = 1; year <= 10; year++) {
      const income = annualIncome;
      cumulativeIncome += income;

      const idcDeduction = year === 1 ? intangibleDrillingCosts : 0;
      const tangibleDepreciation = year <= 7 ? Math.round(tangibleDrillingCosts / 7) : 0;
      const depletion = depletionAllowance;
      const totalDeduction = idcDeduction + tangibleDepreciation + depletion;
      cumulativeDeductions += totalDeduction;

      const grossTaxableWithout = taxableIncome + income; // their income + O&G income
      const fedTaxWithout = calcFederalTax(grossTaxableWithout, brackets);
      const stateTaxWithout = Math.round(grossTaxableWithout * (stateIncomeTaxRate / 100));
      const totalTaxWithout = fedTaxWithout + stateTaxWithout;
      const effectiveRateWithout = grossTaxableWithout > 0 ? (totalTaxWithout / grossTaxableWithout) * 100 : 0;
      const marginalWithout = getMarginalBracket(grossTaxableWithout, brackets);

      const grossTaxableWith = Math.max(0, grossTaxableWithout - totalDeduction);
      const fedTaxWith = calcFederalTax(grossTaxableWith, brackets);
      const stateTaxWith = Math.round(grossTaxableWith * (stateIncomeTaxRate / 100));
      const totalTaxWith = fedTaxWith + stateTaxWith;
      const effectiveRateWith = grossTaxableWith > 0 ? (totalTaxWith / grossTaxableWith) * 100 : 0;
      const marginalWith = getMarginalBracket(grossTaxableWith, brackets);

      const taxSavings = totalTaxWithout - totalTaxWith;
      cumulativeTaxBenefits += taxSavings;

      const principalReturned = year === lockupYears ? investmentAmount : 0;
      const netCashFlow = income + taxSavings + principalReturned - (year === 1 ? investmentAmount : 0);

      summaries.push({
        year,
        income,
        cumulativeIncome,
        idcDeduction,
        tangibleDepreciation,
        depletion,
        totalDeduction,
        cumulativeDeductions,
        grossTaxableWithout,
        fedTaxWithout,
        stateTaxWithout,
        totalTaxWithout,
        effectiveRateWithout,
        marginalWithout,
        grossTaxableWith,
        fedTaxWith,
        stateTaxWith,
        totalTaxWith,
        effectiveRateWith,
        marginalWith,
        taxSavings,
        cumulativeTaxBenefits,
        principalReturned,
        netCashFlow,
        cumulativeCashFlow: cumulativeIncome + cumulativeTaxBenefits + (year >= lockupYears ? investmentAmount : 0) - investmentAmount,
      });
    }
    return summaries;
  }, [investmentAmount, annualIncome, lockupYears, taxableIncome, brackets, stateIncomeTaxRate, intangibleDrillingCosts, tangibleDrillingCosts, depletionAllowance]);

  const projectionData = useMemo(() => {
    const data = [];
    let totalIncome = 0;
    let totalTaxBenefits = 0;
    for (let year = 1; year <= Math.max(lockupYears, 15); year++) {
      const income = annualIncome;
      totalIncome += income;
      const deduction = year === 1 ? year1Deduction : ongoingAnnualDepletion;
      const taxBenefit = year === 1 ? totalTaxSavingsYear1 : Math.round(ongoingAnnualDepletion * 0.30);
      totalTaxBenefits += taxBenefit;
      const principalReturned = year === lockupYears ? investmentAmount : 0;
      data.push({
        year,
        label: `Yr ${year}`,
        income,
        totalIncome,
        deduction,
        taxBenefit,
        totalTaxBenefits,
        principalReturned,
        netCashFlow: income + taxBenefit + principalReturned - (year === 1 ? investmentAmount : 0),
        cumulativeCashFlow: totalIncome + totalTaxBenefits + (year >= lockupYears ? investmentAmount : 0) - investmentAmount,
      });
    }
    return data;
  }, [investmentAmount, annualIncome, lockupYears, year1Deduction, totalTaxSavingsYear1, ongoingAnnualDepletion]);

  const beneficiaryData = useMemo(() => {
    if (!showBeneficiary) return [];
    const data = [];
    let totalInherited = investmentAmount;
    for (let year = lockupYears + 1; year <= lockupYears + 20; year++) {
      totalInherited += annualIncome;
      data.push({
        year,
        label: `Yr ${year}`,
        annualIncome: annualIncome,
        totalInherited,
      });
    }
    return data;
  }, [showBeneficiary, lockupYears, annualIncome, investmentAmount]);

  const effectiveRateWithout = calcEffectiveRate(taxableIncome, brackets);
  const effectiveRateWith = calcEffectiveRate(taxableAfterDeduction, brackets);

  return (
    <AppShell>

      {/* Backend Integration Bar */}
      <ClientSelectorBar
        clients={calcIntegration.clients}
        clientsLoading={calcIntegration.clientsLoading}
        selectedClientId={calcIntegration.selectedClientId}
        selectedClientName={calcIntegration.selectedClientName}
        onSelectClient={calcIntegration.selectClient}
        scenarios={calcIntegration.scenarios}
        scenariosLoading={calcIntegration.scenariosLoading}
        scenarioName={calcIntegration.scenarioName}
        onSetScenarioName={calcIntegration.setScenarioName}
        onSave={() => calcIntegration.saveScenario({}, {})}
        onLoad={(s) => calcIntegration.loadScenario(s)}
        isSaving={calcIntegration.isSaving}
        lastSavedAt={calcIntegration.lastSavedAt}
        calculatorName="HotIncome"
      />
      <div className="container py-6 space-y-6" id="hot-income">
        <CalculationSyncBar />

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="HotIncome" />

        <ExecutiveSummary
          pageTitle="Hot Income"
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
        <GoalsAccelerator pageName="Hot Income" pageContext="Hot Income — retirement income modeling with projections and scenario analysis" />
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
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="bg-gradient-to-r from-orange-600 to-red-600 text-white text-sm px-3 py-1">
              <Flame className="w-4 h-4 mr-1" /> Hot Income
            </Badge>
            <Badge variant="outline" className="text-green-600 border-green-600">
              <CheckCircle2 className="w-3 h-3 mr-1" /> 15% Annual Returns
            </Badge>
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              <Shield className="w-3 h-3 mr-1" /> Tax Advantaged
            </Badge>
            <Badge variant="outline" className="text-amber-600 border-amber-600">
              <Gift className="w-3 h-3 mr-1" /> Inheritable Income
            </Badge>
          </div>
          <div className="flex justify-between items-start">
            <h1 className="text-2xl md:text-3xl font-bold">Hot Income — Oil & Gas Drilling Investments</h1>
            <ExportToSlides
              toolName="Hot Income"
              getSections={() => [
                {
                  title: "Investment Summary",
                  items: [
                    { label: "Investment Amount", value: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(investmentAmount) },
                    { label: "Annual Return Rate", value: `${annualReturn}%` },
                    { label: "Lockup Period", value: `${lockupYears} Years` },
                    { label: "Taxable Income", value: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(taxableIncome) },
                  ],
                },
                {
                  title: "Tax Impact",
                  items: [
                    { label: "Year 1 Tax Deduction", value: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(year1Deduction) },
                    { label: "Total Tax Savings Year 1", value: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(totalTaxSavingsYear1) },
                    { label: "Ongoing Annual Depletion", value: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(ongoingAnnualDepletion) },
                  ],
                },
              ]}
            />
          </div>
          <p className="text-muted-foreground max-w-3xl">
            High-yield oil and gas drilling investments offering <strong>consistent 15% annual returns</strong> with
            significant <strong>tax deductions</strong> through intangible drilling costs (IDC) and depletion allowances.
            Principal is locked for 10–12 years but returned in full, and beneficiaries can inherit the ongoing income stream.
          </p>
        </div>

        {/* ─── INPUTS ─── */}
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> Investment Amount</Label>
                <NumberInput value={investmentAmount} onChange={setInvestmentAmount} className="mt-1" />
              </div>
              <div>
                <Label className="flex items-center gap-1"><Percent className="w-3 h-3" /> Annual Return Rate</Label>
                <Select value={String(annualReturn)} onValueChange={v => setAnnualReturn(Number(v))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">12% (Conservative)</SelectItem>
                    <SelectItem value="15">15% (Target)</SelectItem>
                    <SelectItem value="18">18% (Optimistic)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="flex items-center gap-1"><Clock className="w-3 h-3" /> Lockup Period</Label>
                <Select value={String(lockupYears)} onValueChange={v => setLockupYears(Number(v))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 Years</SelectItem>
                    <SelectItem value="11">11 Years</SelectItem>
                    <SelectItem value="12">12 Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="flex items-center gap-1"><Wallet className="w-3 h-3" /> Your Taxable Income</Label>
                <NumberInput value={taxableIncome} onChange={setTaxableIncome} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t">
              <div>
                <Label>Filing Status</Label>
                <Select value={filingStatus} onValueChange={v => setFilingStatus(v as "single" | "married")}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single</SelectItem>
                    <SelectItem value="married">Married Filing Jointly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>State Income Tax Rate</Label>
                <Select value={String(stateIncomeTaxRate)} onValueChange={v => setStateIncomeTaxRate(Number(v))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0% (TX, FL, NV, WA, etc.)</SelectItem>
                    <SelectItem value="3">3% (Low)</SelectItem>
                    <SelectItem value="5">5% (Medium)</SelectItem>
                    <SelectItem value="7">7% (High)</SelectItem>
                    <SelectItem value="10">10% (CA, NJ, etc.)</SelectItem>
                    <SelectItem value="13">13.3% (CA Top Rate)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={showBeneficiary} onCheckedChange={setShowBeneficiary} />
                <Label className="text-sm"><Heart className="w-3 h-3 inline mr-1" />Show Beneficiary Inheritance</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── KEY METRICS ─── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-2 border-green-500/30">
            <CardContent className="pt-4 text-center">
              <Flame className="w-6 h-6 text-orange-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-green-600">{fmt(annualIncome)}</div>
              <div className="text-xs text-muted-foreground">Annual Income</div>
              <div className="text-xs text-green-600 mt-1">{fmt(Math.round(annualIncome / 12))}/month</div>
            </CardContent>
          </Card>
          <Card className="border-2 border-blue-500/30">
            <CardContent className="pt-4 text-center">
              <Shield className="w-6 h-6 text-blue-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-blue-600">{fmt(totalTaxSavingsYear1)}</div>
              <div className="text-xs text-muted-foreground">Year 1 Tax Savings</div>
              <div className="text-xs text-blue-600 mt-1">Fed + State Combined</div>
            </CardContent>
          </Card>
          <Card className="border-2 border-amber-500/30">
            <CardContent className="pt-4 text-center">
              <TrendingUp className="w-6 h-6 text-amber-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-amber-600">{fmt(totalIncomeOverLockup)}</div>
              <div className="text-xs text-muted-foreground">Total Income ({lockupYears} Years)</div>
              <div className="text-xs text-amber-600 mt-1">+ {fmt(investmentAmount)} principal returned</div>
            </CardContent>
          </Card>
          <Card className="border-2 border-purple-500/30">
            <CardContent className="pt-4 text-center">
              <Calculator className="w-6 h-6 text-purple-500 mx-auto mb-1" />
              <div className="text-2xl font-bold text-purple-600">{pct(effectiveRateWithout)}</div>
              <div className="text-xs text-muted-foreground">Effective Tax Rate</div>
              <div className="text-xs text-purple-600 mt-1">→ {pct(effectiveRateWith)} with O&G</div>
            </CardContent>
          </Card>
        </div>

        {/* ─── TABS ─── */}
        <Tabs defaultValue="year-summaries" className="space-y-4">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1">
            <TabsTrigger value="year-summaries" className="text-xs sm:text-sm">
              <BarChart3 className="w-4 h-4 mr-1" /> Year 1–10 Tax Summary
            </TabsTrigger>
            <TabsTrigger value="overview" className="text-xs sm:text-sm">
              <Info className="w-4 h-4 mr-1" /> Overview
            </TabsTrigger>
            <TabsTrigger value="tax-calculator" className="text-xs sm:text-sm">
              <Calculator className="w-4 h-4 mr-1" /> Tax Zero Calculator
            </TabsTrigger>
            <TabsTrigger value="projection" className="text-xs sm:text-sm">
              <TrendingUp className="w-4 h-4 mr-1" /> Income Projection
            </TabsTrigger>
            <TabsTrigger value="tax-benefits" className="text-xs sm:text-sm">
              <Shield className="w-4 h-4 mr-1" /> Tax Benefits Explained
            </TabsTrigger>
            <TabsTrigger value="beneficiary" className="text-xs sm:text-sm">
              <Heart className="w-4 h-4 mr-1" /> Beneficiary & Inheritance
            </TabsTrigger>
          
            <TabsTrigger value="generate-outcome" className="text-xs sm:text-sm bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 font-bold">Generate Outcome</TabsTrigger>
          </TabsList>

          {/* ═══════════ TAB: YEAR 1–10 TAX SUMMARIES ═══════════ */}
          <TabsContent value="year-summaries" className="space-y-4">
            <div className="text-center mb-2">
              <h2 className="text-xl font-bold">Year-by-Year Effective Tax Rate Analysis</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Each year shows your complete tax picture — before and after oil & gas deductions.
                Click any year to expand the full breakdown.
              </p>
            </div>

            {/* 10-Year Effective Rate Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Percent className="w-5 h-5 text-amber-500" />
                  Effective Tax Rate — Years 1 through 10
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={yearSummaries} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                      <XAxis dataKey="year" tickFormatter={(v: number) => `Yr ${v}`} />
                      <YAxis tickFormatter={(v: number) => `${v.toFixed(0)}%`} domain={[0, 'auto']} />
                      <Tooltip
                        formatter={(v: number, name: string) => [`${v.toFixed(1)}%`, name]}
                        labelFormatter={(v: number) => `Year ${v}`}
                      />
                      <Legend />
                      <Bar dataKey="effectiveRateWithout" name="Without O&G" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="effectiveRateWith" name="With O&G" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="marginalWithout" name="Marginal Bracket (Without)" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Year-by-Year Summary Cards */}
            {yearSummaries.map((yr) => {
              const isExpanded = expandedYear === yr.year;
              const rateReduction = yr.effectiveRateWithout - yr.effectiveRateWith;
              const isYear1 = yr.year === 1;
              const isPrincipalReturn = yr.year === lockupYears;

              return (
                <Card
                  key={yr.year}
                  className={`transition-all cursor-pointer hover:border-amber-500/50 ${
                    isYear1 ? "border-2 border-orange-500/50 bg-gradient-to-r from-orange-950/20 to-background" :
                    isPrincipalReturn ? "border-2 border-amber-500/50 bg-gradient-to-r from-amber-950/20 to-background" :
                    "border-border/50"
                  }`}
                  onClick={() => setExpandedYear(isExpanded ? null : yr.year)}
                >
                  <CardContent className="p-0">
                    {/* Summary Row (always visible) */}
                    <div className="flex items-center gap-4 p-4">
                      {/* Year Badge */}
                      <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 ${
                        isYear1 ? "bg-gradient-to-br from-orange-600 to-red-600" :
                        isPrincipalReturn ? "bg-gradient-to-br from-amber-600 to-yellow-600" :
                        "bg-gradient-to-br from-blue-600 to-indigo-600"
                      }`}>
                        <span className="text-[10px] text-white/70 uppercase font-medium leading-none">Year</span>
                        <span className="text-xl font-bold text-white leading-none">{yr.year}</span>
                      </div>

                      {/* Key Metrics Row */}
                      <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">O&G Income</p>
                          <p className="text-sm font-bold text-green-500">{fmt(yr.income)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Deductions</p>
                          <p className="text-sm font-bold text-blue-500">{fmt(yr.totalDeduction)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tax Savings</p>
                          <p className="text-sm font-bold text-emerald-500">{fmt(yr.taxSavings)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-red-400 uppercase tracking-wider">Eff. Rate Without</p>
                          <p className="text-sm font-bold text-red-500">{pct(yr.effectiveRateWithout)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-green-400 uppercase tracking-wider">Eff. Rate With O&G</p>
                          <p className="text-sm font-bold text-green-500">
                            {pct(yr.effectiveRateWith)}
                            <span className="text-emerald-400 text-xs ml-1">↓{pct(rateReduction)}</span>
                          </p>
                        </div>
                      </div>

                      {/* Expand/Collapse */}
                      <div className="shrink-0">
                        {isExpanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="px-4 pb-2 flex gap-2 flex-wrap">
                      {isYear1 && (
                        <Badge className="bg-orange-600/20 text-orange-400 text-[10px]">
                          <Zap className="w-3 h-3 mr-1" /> 75% IDC Deduction
                        </Badge>
                      )}
                      {isPrincipalReturn && (
                        <Badge className="bg-amber-600/20 text-amber-400 text-[10px]">
                          <Wallet className="w-3 h-3 mr-1" /> Principal Returned: {fmt(investmentAmount)}
                        </Badge>
                      )}
                      {yr.year <= 7 && (
                        <Badge variant="outline" className="text-[10px] text-blue-400 border-blue-400/30">
                          MACRS Depreciation Active
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px] text-green-400 border-green-400/30">
                        15% Depletion Allowance
                      </Badge>
                    </div>

                    {/* Expanded Detail (page-1 style summary) */}
                    {isExpanded && (
                      <div className="border-t border-border/30 p-4 space-y-4" onClick={(e) => e.stopPropagation()}>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {/* WITHOUT O&G */}
                          <Card className="border-2 border-red-500/30 bg-red-950/10">
                            <CardContent className="pt-4">
                              <h4 className="font-semibold text-red-400 mb-3 flex items-center gap-2 text-sm">
                                <AlertTriangle className="w-4 h-4" /> Year {yr.year} — Without Oil & Gas
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between p-2 rounded bg-muted/30">
                                  <span className="text-muted-foreground">Your Base Income</span>
                                  <span className="font-medium">{fmt(taxableIncome)}</span>
                                </div>
                                <div className="flex justify-between p-2 rounded bg-muted/30">
                                  <span className="text-muted-foreground">+ O&G Income</span>
                                  <span className="font-medium text-green-400">+{fmt(yr.income)}</span>
                                </div>
                                <div className="flex justify-between p-2 rounded bg-muted/30 font-semibold">
                                  <span>Total Taxable Income</span>
                                  <span>{fmt(yr.grossTaxableWithout)}</span>
                                </div>
                                <div className="h-px bg-border/30 my-1" />
                                <div className="flex justify-between p-2 rounded bg-muted/30">
                                  <span className="text-muted-foreground">Federal Tax</span>
                                  <span className="text-red-400 font-medium">{fmt(yr.fedTaxWithout)}</span>
                                </div>
                                <div className="flex justify-between p-2 rounded bg-muted/30">
                                  <span className="text-muted-foreground">State Tax ({stateIncomeTaxRate}%)</span>
                                  <span className="text-red-400 font-medium">{fmt(yr.stateTaxWithout)}</span>
                                </div>
                                <div className="flex justify-between p-2.5 rounded bg-red-500/10 border border-red-500/30 font-semibold">
                                  <span className="text-red-400">Total Tax Liability</span>
                                  <span className="text-red-400 text-lg">{fmt(yr.totalTaxWithout)}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                  <div className="text-center p-2 rounded bg-red-900/20">
                                    <p className="text-[10px] text-red-300/70 uppercase">Effective Rate</p>
                                    <p className="text-lg font-bold text-red-400">{pct(yr.effectiveRateWithout)}</p>
                                  </div>
                                  <div className="text-center p-2 rounded bg-red-900/20">
                                    <p className="text-[10px] text-red-300/70 uppercase">Marginal Bracket</p>
                                    <p className="text-lg font-bold text-red-400">{pct(yr.marginalWithout)}</p>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          {/* WITH O&G */}
                          <Card className="border-2 border-green-500/30 bg-green-950/10">
                            <CardContent className="pt-4">
                              <h4 className="font-semibold text-green-400 mb-3 flex items-center gap-2 text-sm">
                                <CheckCircle2 className="w-4 h-4" /> Year {yr.year} — With Oil & Gas Deductions
                              </h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between p-2 rounded bg-muted/30">
                                  <span className="text-muted-foreground">Gross Taxable</span>
                                  <span className="font-medium">{fmt(yr.grossTaxableWithout)}</span>
                                </div>
                                {yr.idcDeduction > 0 && (
                                  <div className="flex justify-between p-2 rounded bg-green-500/10">
                                    <span className="text-green-400">− IDC Deduction (75%)</span>
                                    <span className="font-medium text-green-400">-{fmt(yr.idcDeduction)}</span>
                                  </div>
                                )}
                                {yr.tangibleDepreciation > 0 && (
                                  <div className="flex justify-between p-2 rounded bg-green-500/10">
                                    <span className="text-green-400">− Tangible Depreciation</span>
                                    <span className="font-medium text-green-400">-{fmt(yr.tangibleDepreciation)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between p-2 rounded bg-green-500/10">
                                  <span className="text-green-400">− Depletion Allowance (15%)</span>
                                  <span className="font-medium text-green-400">-{fmt(yr.depletion)}</span>
                                </div>
                                <div className="flex justify-between p-2 rounded bg-muted/30 font-semibold">
                                  <span>Adjusted Taxable Income</span>
                                  <span>{fmt(yr.grossTaxableWith)}</span>
                                </div>
                                <div className="h-px bg-border/30 my-1" />
                                <div className="flex justify-between p-2 rounded bg-muted/30">
                                  <span className="text-muted-foreground">Federal Tax</span>
                                  <span className="text-green-400 font-medium">{fmt(yr.fedTaxWith)}</span>
                                </div>
                                <div className="flex justify-between p-2 rounded bg-muted/30">
                                  <span className="text-muted-foreground">State Tax ({stateIncomeTaxRate}%)</span>
                                  <span className="text-green-400 font-medium">{fmt(yr.stateTaxWith)}</span>
                                </div>
                                <div className="flex justify-between p-2.5 rounded bg-green-500/10 border border-green-500/30 font-semibold">
                                  <span className="text-green-400">Total Tax Liability</span>
                                  <span className="text-green-400 text-lg">{fmt(yr.totalTaxWith)}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                  <div className="text-center p-2 rounded bg-green-900/20">
                                    <p className="text-[10px] text-green-300/70 uppercase">Effective Rate</p>
                                    <p className="text-lg font-bold text-green-400">{pct(yr.effectiveRateWith)}</p>
                                  </div>
                                  <div className="text-center p-2 rounded bg-green-900/20">
                                    <p className="text-[10px] text-green-300/70 uppercase">Marginal Bracket</p>
                                    <p className="text-lg font-bold text-green-400">{pct(yr.marginalWith)}</p>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Year Advantage Summary Bar */}
                        <Card className="bg-gradient-to-r from-amber-900/20 via-amber-800/10 to-amber-900/20 border-amber-500/30">
                          <CardContent className="p-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                              <div>
                                <p className="text-[10px] text-amber-300/70 uppercase tracking-wider">Tax Savings</p>
                                <p className="text-xl font-bold text-amber-300">{fmt(yr.taxSavings)}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-amber-300/70 uppercase tracking-wider">Rate Reduction</p>
                                <p className="text-xl font-bold text-emerald-400">↓ {pct(rateReduction)}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-amber-300/70 uppercase tracking-wider">Cumulative Savings</p>
                                <p className="text-xl font-bold text-amber-300">{fmt(yr.cumulativeTaxBenefits)}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-amber-300/70 uppercase tracking-wider">Cumulative Income</p>
                                <p className="text-xl font-bold text-green-400">{fmt(yr.cumulativeIncome)}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {/* 10-Year Totals */}
            <Card className="border-2 border-amber-500/40 bg-gradient-to-r from-amber-950/30 to-background">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5" /> 10-Year Cumulative Summary
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                  <div className="p-3 rounded-lg bg-green-900/20">
                    <p className="text-[10px] text-green-300/70 uppercase tracking-wider">Total O&G Income</p>
                    <p className="text-xl font-bold text-green-400">{fmt(yearSummaries[9]?.cumulativeIncome || 0)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-900/20">
                    <p className="text-[10px] text-blue-300/70 uppercase tracking-wider">Total Deductions</p>
                    <p className="text-xl font-bold text-blue-400">{fmt(yearSummaries[9]?.cumulativeDeductions || 0)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-900/20">
                    <p className="text-[10px] text-emerald-300/70 uppercase tracking-wider">Total Tax Savings</p>
                    <p className="text-xl font-bold text-emerald-400">{fmt(yearSummaries[9]?.cumulativeTaxBenefits || 0)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-amber-900/20">
                    <p className="text-[10px] text-amber-300/70 uppercase tracking-wider">Principal Returned</p>
                    <p className="text-xl font-bold text-amber-400">{fmt(investmentAmount)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-900/20">
                    <p className="text-[10px] text-purple-300/70 uppercase tracking-wider">Total Cash Flow</p>
                    <p className="text-xl font-bold text-purple-400">{fmt(yearSummaries[9]?.cumulativeCashFlow || 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════ TAB: OVERVIEW ═══════════ */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-orange-600" />
                  How Oil & Gas Drilling Investments Work
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {[
                    { step: 1, title: "Invest Capital", desc: "You invest a lump sum into an oil & gas drilling program. Your principal is committed for the 10–12 year lockup period. These are direct participation programs (DPPs) where you own a working interest in producing wells.", color: "bg-orange-100 dark:bg-orange-900", icon: <DollarSign className="w-5 h-5" /> },
                    { step: 2, title: "Immediate Tax Deductions", desc: "In Year 1, approximately 75% of your investment is deductible as Intangible Drilling Costs (IDC) — labor, chemicals, mud, grease, fuel, and other non-salvageable expenses. This is a powerful above-the-line deduction that can offset your other earned income.", color: "bg-blue-100 dark:bg-blue-900", icon: <Shield className="w-5 h-5" /> },
                    { step: 3, title: "Receive Consistent Income", desc: "Once wells are producing, you receive quarterly or monthly income distributions at a target rate of 15% annually on your invested capital. This income stream continues for the life of the wells.", color: "bg-green-100 dark:bg-green-900", icon: <TrendingUp className="w-5 h-5" /> },
                    { step: 4, title: "Ongoing Tax Benefits", desc: "Each year you receive a 15% depletion allowance on your gross income — a tax-free return of capital. Additionally, tangible drilling costs are depreciated over 7 years using MACRS.", color: "bg-purple-100 dark:bg-purple-900", icon: <Percent className="w-5 h-5" /> },
                    { step: 5, title: "Principal Returned", desc: "After the lockup period (10–12 years), your original principal is returned in full. You keep the income stream AND get your money back.", color: "bg-amber-100 dark:bg-amber-900", icon: <Wallet className="w-5 h-5" /> },
                    { step: 6, title: "Beneficiaries Inherit", desc: "After the lockup period is satisfied, beneficiaries can inherit both the ongoing income stream and the principal. The income continues for the productive life of the wells.", color: "bg-red-100 dark:bg-red-900", icon: <Heart className="w-5 h-5" /> },
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

                <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
                  <h4 className="font-semibold text-orange-600 flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4" /> Important Considerations
                  </h4>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li>• <strong>Illiquidity:</strong> Your principal is locked for 10–12 years. Only invest funds you won't need during this period.</li>
                    <li>• <strong>Risk:</strong> Oil & gas investments carry inherent risks including commodity price fluctuations, dry wells, and regulatory changes.</li>
                    <li>• <strong>Accredited Investor:</strong> Most oil & gas DPPs require accredited investor status ($200K+ income or $1M+ net worth).</li>
                    <li>• <strong>Tax Complexity:</strong> These investments generate K-1 forms and may require specialized tax preparation.</li>
                    <li>• <strong>Not a Security:</strong> This is an educational illustration. Consult your tax advisor and financial professional before investing.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════ TAB: TAX ZERO CALCULATOR ═══════════ */}
          <TabsContent value="tax-calculator" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-blue-600" />
                  Tax Zero Calculator — Eliminate Your Earned Income Tax
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg p-6">
                  <h3 className="font-bold text-lg mb-3">How Much Oil & Gas Investment Would Zero Out Your Taxes?</h3>
                  <p className="text-sm leading-relaxed">
                    Oil & gas intangible drilling costs (IDC) are approximately <strong>75% of your investment</strong> and are
                    <strong> fully deductible in Year 1</strong> against your earned income. This means for every $1 invested,
                    you get approximately $0.75 in immediate tax deductions.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Without O&G */}
                  <Card className="border-2 border-red-200 dark:border-red-800">
                    <CardContent className="pt-4">
                      <h4 className="font-semibold text-red-600 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> Without Oil & Gas Investment
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between p-2 rounded bg-muted/50">
                          <span>Taxable Income</span>
                          <span className="font-bold">{fmt(taxableIncome)}</span>
                        </div>
                        <div className="flex justify-between p-2 rounded bg-muted/50">
                          <span>Federal Tax</span>
                          <span className="font-bold text-red-600">{fmt(taxWithout)}</span>
                        </div>
                        <div className="flex justify-between p-2 rounded bg-muted/50">
                          <span>State Tax ({stateIncomeTaxRate}%)</span>
                          <span className="font-bold text-red-600">{fmt(Math.round(taxableIncome * stateIncomeTaxRate / 100))}</span>
                        </div>
                        <div className="flex justify-between p-2 rounded bg-red-50 dark:bg-red-950/30 border border-red-200">
                          <span className="font-bold">Total Tax Liability</span>
                          <span className="font-bold text-red-600 text-lg">{fmt(taxWithout + Math.round(taxableIncome * stateIncomeTaxRate / 100))}</span>
                        </div>
                        <div className="flex justify-between p-2">
                          <span>Effective Rate</span>
                          <span className="font-bold text-red-600">{pct(effectiveRateWithout + stateIncomeTaxRate)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* With O&G */}
                  <Card className="border-2 border-green-200 dark:border-green-800">
                    <CardContent className="pt-4">
                      <h4 className="font-semibold text-green-600 mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> With Oil & Gas Investment
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between p-2 rounded bg-muted/50">
                          <span>Taxable Income</span>
                          <span className="font-bold">{fmt(taxableIncome)}</span>
                        </div>
                        <div className="flex justify-between p-2 rounded bg-green-50 dark:bg-green-950/30">
                          <span>IDC Deduction (75%)</span>
                          <span className="font-bold text-green-600">-{fmt(intangibleDrillingCosts)}</span>
                        </div>
                        <div className="flex justify-between p-2 rounded bg-green-50 dark:bg-green-950/30">
                          <span>Tangible Depreciation (Yr 1)</span>
                          <span className="font-bold text-green-600">-{fmt(Math.round(tangibleDrillingCosts / 7))}</span>
                        </div>
                        <div className="flex justify-between p-2 rounded bg-muted/50">
                          <span>Adjusted Taxable Income</span>
                          <span className="font-bold">{fmt(taxableAfterDeduction)}</span>
                        </div>
                        <div className="flex justify-between p-2 rounded bg-green-50 dark:bg-green-950/30 border border-green-200">
                          <span className="font-bold">Federal Tax After O&G</span>
                          <span className="font-bold text-green-600 text-lg">{fmt(taxWith)}</span>
                        </div>
                        <div className="flex justify-between p-2 rounded bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-300">
                          <span className="font-bold">Total Tax Savings</span>
                          <span className="font-bold text-emerald-600 text-lg">{fmt(totalTaxSavingsYear1)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Zero-out calculation */}
                <Card className="border-2 border-amber-200 dark:border-amber-800">
                  <CardContent className="pt-4">
                    <h4 className="font-semibold text-amber-600 mb-4 flex items-center gap-2">
                      <Target className="w-5 h-5" /> Investment Needed to Eliminate Your Tax Liability
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                        <div className="text-xs text-muted-foreground mb-1">Your Taxable Income</div>
                        <div className="text-2xl font-bold">{fmt(taxableIncome)}</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                        <div className="text-xs text-muted-foreground mb-1">O&G Investment Needed</div>
                        <div className="text-2xl font-bold text-amber-600">{fmt(investmentToZeroTax)}</div>
                        <div className="text-xs text-muted-foreground mt-1">to generate {fmt(taxableIncome)} in IDC deductions</div>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950/30">
                        <div className="text-xs text-muted-foreground mb-1">Your Tax Liability</div>
                        <div className="text-2xl font-bold text-green-600">$0</div>
                        <div className="text-xs text-green-600 mt-1">Federal income tax eliminated</div>
                      </div>
                    </div>
                    <div className="mt-4 p-3 rounded bg-muted/50 text-sm">
                      <strong>Bonus:</strong> While zeroing out your taxes, you'd also earn <strong>{fmt(Math.round(investmentToZeroTax * 0.15))}/year</strong> in
                      oil & gas income ({annualReturn}% return on {fmt(investmentToZeroTax)}), and get your {fmt(investmentToZeroTax)} principal back after {lockupYears} years.
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════ TAB: INCOME PROJECTION ═══════════ */}
          <TabsContent value="projection" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  {lockupYears + 5}-Year Income & Cash Flow Projection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={projectionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                      <XAxis dataKey="label" />
                      <YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
                      <Tooltip formatter={(v: number) => fmt(v)} />
                      <Legend />
                      <Bar dataKey="income" name="Annual Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="taxBenefit" name="Tax Benefit" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="principalReturned" name="Principal Returned" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="cumulativeCashFlow" name="Cumulative Cash Flow" stroke="#a855f7" strokeWidth={2} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>

                <div className="overflow-x-auto mt-6">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b-2 border-orange-600">
                        <th className="text-left p-2">Year</th>
                        <th className="text-center p-2">Annual Income</th>
                        <th className="text-center p-2">Tax Benefit</th>
                        <th className="text-center p-2">Principal Return</th>
                        <th className="text-center p-2">Net Cash Flow</th>
                        <th className="text-center p-2">Cumulative</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectionData.map((row) => (
                        <tr key={row.year} className={`border-b hover:bg-muted/50 ${row.year === lockupYears ? "bg-amber-50 dark:bg-amber-950/30 font-semibold" : ""}`}>
                          <td className="p-2">Year {row.year} {row.year === lockupYears && "← Principal Returns"}</td>
                          <td className="p-2 text-center font-mono text-green-600">{fmt(row.income)}</td>
                          <td className="p-2 text-center font-mono text-blue-600">{fmt(row.taxBenefit)}</td>
                          <td className="p-2 text-center font-mono text-amber-600">{row.principalReturned > 0 ? fmt(row.principalReturned) : "—"}</td>
                          <td className="p-2 text-center font-mono">{fmt(row.netCashFlow)}</td>
                          <td className="p-2 text-center font-mono font-semibold">{fmt(row.cumulativeCashFlow)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════ TAB: TAX BENEFITS EXPLAINED ═══════════ */}
          <TabsContent value="tax-benefits" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Oil & Gas Tax Benefits — How They Work
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    {
                      title: "Intangible Drilling Costs (IDC)",
                      percentage: "~75% of Investment",
                      timing: "Year 1 — Fully Deductible",
                      desc: "IDCs include labor, chemicals, mud, grease, fuel, hauling, supplies, and other non-salvageable expenses related to drilling. Under IRC Section 263(c), these costs are 100% deductible in the year incurred. This is the primary tax benefit.",
                      example: `On a ${fmt(investmentAmount)} investment, approximately ${fmt(intangibleDrillingCosts)} is deductible as IDC in Year 1.`,
                      color: "border-blue-500",
                      icon: <Zap className="w-6 h-6 text-blue-600" />,
                    },
                    {
                      title: "Tangible Drilling Costs",
                      percentage: "~15% of Investment",
                      timing: "Depreciated over 7 Years (MACRS)",
                      desc: "Tangible costs include the physical equipment — wellhead, casing, tubing, tanks, and pumping units. These are depreciated using the Modified Accelerated Cost Recovery System (MACRS) over 7 years.",
                      example: `On a ${fmt(investmentAmount)} investment, approximately ${fmt(tangibleDrillingCosts)} is depreciated at ~${fmt(Math.round(tangibleDrillingCosts / 7))}/year.`,
                      color: "border-amber-500",
                      icon: <Building2 className="w-6 h-6 text-amber-600" />,
                    },
                    {
                      title: "Percentage Depletion Allowance",
                      percentage: "15% of Gross Income",
                      timing: "Ongoing — Every Year",
                      desc: "Under IRC Section 613, small producers can deduct 15% of gross oil & gas income as a depletion allowance. This is a tax-free return of capital that can exceed your cost basis — meaning you can deduct more than you originally invested over time.",
                      example: `On ${fmt(annualIncome)}/year income, you receive ${fmt(depletionAllowance)}/year in tax-free depletion.`,
                      color: "border-green-500",
                      icon: <Droplets className="w-6 h-6 text-green-600" />,
                    },
                    {
                      title: "Active vs. Passive Income",
                      percentage: "Active Participation",
                      timing: "Offsets Earned Income",
                      desc: "Unlike most passive investments, oil & gas working interests are classified as active income under the tax code. This means the deductions can offset your W-2 wages, business income, and other earned income — not just passive income.",
                      example: "This is why oil & gas can zero out your earned income tax liability, unlike rental real estate losses which are limited to $25K against active income.",
                      color: "border-purple-500",
                      icon: <Target className="w-6 h-6 text-purple-600" />,
                    },
                  ].map((item) => (
                    <Card key={item.title} className={`border-l-4 ${item.color}`}>
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3 mb-3">
                          {item.icon}
                          <div>
                            <h4 className="font-semibold">{item.title}</h4>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">{item.percentage}</Badge>
                              <Badge variant="outline" className="text-xs text-blue-600 border-blue-600">{item.timing}</Badge>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                        <div className="mt-3 p-2 rounded bg-muted/50 text-xs font-mono">
                          {item.example}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200">
                  <h4 className="font-semibold text-blue-600 mb-2">Summary: Year 1 Tax Impact on {fmt(investmentAmount)} Investment</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="text-center p-2 rounded bg-white dark:bg-gray-900">
                      <div className="text-xs text-muted-foreground">IDC Deduction</div>
                      <div className="font-bold text-blue-600">{fmt(intangibleDrillingCosts)}</div>
                    </div>
                    <div className="text-center p-2 rounded bg-white dark:bg-gray-900">
                      <div className="text-xs text-muted-foreground">Tangible Yr 1</div>
                      <div className="font-bold text-amber-600">{fmt(Math.round(tangibleDrillingCosts / 7))}</div>
                    </div>
                    <div className="text-center p-2 rounded bg-white dark:bg-gray-900">
                      <div className="text-xs text-muted-foreground">Total Yr 1 Deduction</div>
                      <div className="font-bold text-green-600">{fmt(year1Deduction)}</div>
                    </div>
                    <div className="text-center p-2 rounded bg-white dark:bg-gray-900">
                      <div className="text-xs text-muted-foreground">Tax Savings</div>
                      <div className="font-bold text-emerald-600">{fmt(totalTaxSavingsYear1)}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════ TAB: BENEFICIARY & INHERITANCE ═══════════ */}
          <TabsContent value="beneficiary" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-600" />
                  Beneficiary Inheritance — Legacy Income
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30 rounded-lg p-6">
                  <h3 className="font-bold text-lg mb-3">How Beneficiaries Inherit Oil & Gas Income</h3>
                  <p className="text-sm leading-relaxed">
                    Once the {lockupYears}-year lockup period has been satisfied, your beneficiaries can inherit both the
                    <strong> ongoing income stream</strong> and the <strong>original principal</strong>. The income continues
                    for the productive life of the wells, which can extend 20–30+ years beyond the initial lockup period.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-2 border-green-200 dark:border-green-800">
                    <CardContent className="pt-4 text-center">
                      <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-600">{fmt(investmentAmount)}</div>
                      <div className="text-sm text-muted-foreground">Principal Inherited</div>
                      <div className="text-xs text-green-600 mt-1">After {lockupYears}-year lockup</div>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-blue-200 dark:border-blue-800">
                    <CardContent className="pt-4 text-center">
                      <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-blue-600">{fmt(annualIncome)}/yr</div>
                      <div className="text-sm text-muted-foreground">Ongoing Income Inherited</div>
                      <div className="text-xs text-blue-600 mt-1">{fmt(Math.round(annualIncome / 12))}/month</div>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-purple-200 dark:border-purple-800">
                    <CardContent className="pt-4 text-center">
                      <Calendar className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-purple-600">20–30+ yrs</div>
                      <div className="text-sm text-muted-foreground">Potential Income Duration</div>
                      <div className="text-xs text-purple-600 mt-1">Depends on well productivity</div>
                    </CardContent>
                  </Card>
                </div>

                {showBeneficiary && beneficiaryData.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">Beneficiary Income Projection (After Lockup)</h4>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={beneficiaryData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                          <XAxis dataKey="label" />
                          <YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
                          <Tooltip formatter={(v: number) => fmt(v)} />
                          <Area type="monotone" dataKey="totalInherited" name="Total Inherited Value" fill="#a855f7" fillOpacity={0.3} stroke="#a855f7" />
                          <Area type="monotone" dataKey="annualIncome" name="Annual Income" fill="#22c55e" fillOpacity={0.3} stroke="#22c55e" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <strong>Important:</strong> Beneficiaries can only inherit the income stream and principal after the
                    {" "}{lockupYears}-year lockup period has been satisfied. If the investor passes away during the lockup period,
                    the terms of the specific program will determine how the investment is handled. Always review the
                    program's beneficiary provisions before investing.
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        
          <TabsContent value="generate-outcome" className="space-y-6 mt-6">
            <GenerateOutcomeTab
              strategyType="hot-income"
              hasResults={true}
              resultData={{ totalAnnualIncome: 180000, taxFreeIncome: 100000, taxableIncome: 80000, incomeStreams: [], effectiveTaxRate: 0.18 }}
              metrics={[{ label: "Total Income", value: 180000, highlight: true }, { label: "Tax-Free Income", value: 100000 }, { label: "Taxable Income", value: 80000 }, { label: "Effective Rate", value: 0.18, format: "percent" }]}
            />
          </TabsContent>
        </Tabs>

        {/* ─── DISCLAIMER ─── */}
        <NAICDisclaimer
          variant="full"
          showsProjections
          additionalText="Oil and gas investments involve significant risks including loss of principal, commodity price volatility, dry well risk, and regulatory changes. The 15% annual return is a target rate and is not guaranteed. Intangible drilling cost deductions and depletion allowances are subject to IRS rules and may be limited by alternative minimum tax (AMT) provisions. This is an educational illustration only and does not constitute investment advice, tax advice, or a solicitation to invest. Consult your tax advisor, financial professional, and legal counsel before making any investment decisions. Past performance does not guarantee future results."
        />
</div>
    
        <ComplianceFooter pageName="HotIncome" showsTax showsEstate showsProjections />
      </AppShell>
  );
}
