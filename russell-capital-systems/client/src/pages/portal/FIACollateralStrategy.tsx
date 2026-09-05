// @ts-nocheck
import { useCalculatorIntegration } from "@/hooks/useCalculatorIntegration";
import { ClientSelectorBar } from "@/components/ClientSelectorBar";
import { useState, useMemo, useCallback } from "react";
import { GenerateOutcomeTab } from "@/components/GenerateOutcomeTab";
import { CalculationSyncBar } from "@/components/CalculationSyncBar";
import { useStrategy } from "@/contexts/StrategyContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { NumberInput } from "@/components/NumberInput";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import { PageInsights } from "@/components/PageInsights";
import { ExportToSlides } from "@/components/ExportToSlides";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import {
  Shield,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Landmark,
  Star,
  Fuel,
  Banknote,
  Home,
  PiggyBank,
  BarChart3,
  Layers,
  Target,
  CheckCircle2,
  Percent,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell, ComposedChart, Line,
  ReferenceLine, PieChart, Pie,
} from "recharts";
import {
  FIA_PRODUCTS, COLLATERAL_PRODUCTS, INCOME_PRODUCTS,
  runFIAWaterfall, getDefaultFIAInput, runAllCombinations,
  type FIAWaterfallInput, type FIAProduct, type ProductCombo,
} from "@shared/fiaCollateralEngine";

const fmt = (v: number) => "$" + v.toLocaleString("en-US", { maximumFractionDigits: 0 });
const pct = (v: number) => v.toFixed(1) + "%";

/* ─── PRODUCT CARD ─── */
function ProductCard({ product, selected, onSelect }: { product: FIAProduct; selected: boolean; onSelect: () => void }) {
  const sleeveColor = product.sleeve === "collateral" ? "emerald" : "amber";
  return (
    <Card
      className={`cursor-pointer transition-all duration-200 ${selected ? `ring-2 ring-${sleeveColor}-500 bg-${sleeveColor}-500/10` : "hover:bg-white/5"}`}
      onClick={onSelect}
    >

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
        calculatorName="FIACollateralStrategy"
      />
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-${sleeveColor}-400 border-${sleeveColor}-500/30 text-xs`}>
                #{product.rank} {product.sleeve === "collateral" ? "Collateral" : "Income"}
              </Badge>
              {selected && <CheckCircle2 className="w-4 h-4 text-green-400" />}
            </div>
            <h3 className="font-semibold mt-1">{product.carrier}</h3>
            <p className="text-sm text-muted-foreground">{product.name}</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-emerald-400">{pct(product.annualCap)}</div>
            <div className="text-xs text-muted-foreground">Annual Cap</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
          <div className="bg-white/5 rounded p-1.5 text-center">
            <div className="font-medium">{product.participationRate}%</div>
            <div className="text-muted-foreground">Part. Rate</div>
          </div>
          <div className="bg-white/5 rounded p-1.5 text-center">
            <div className="font-medium">{product.surrenderYears}yr</div>
            <div className="text-muted-foreground">Surrender</div>
          </div>
          <div className="bg-white/5 rounded p-1.5 text-center">
            <div className="font-medium">{(product.ltvBand[0]*100).toFixed(0)}-{(product.ltvBand[1]*100).toFixed(0)}%</div>
            <div className="text-muted-foreground">LTV Band</div>
          </div>
        </div>
        {product.bonusRate > 0 && (
          <div className="mt-2 flex items-center gap-1 text-xs text-amber-400">
            <Star className="w-3 h-3" /> {product.bonusRate}% Premium Bonus
          </div>
        )}
        {product.incomeRider && (
          <div className="mt-1 flex items-center gap-1 text-xs text-blue-400">
            <Target className="w-3 h-3" /> {product.incomeRider.rollUpRate}% {product.incomeRider.rollUpType} roll-up
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── LTV GAUGE ─── */
function LTVGauge({ product, loanAmount, collateralValue }: { product: FIAProduct; loanAmount: number; collateralValue: number }) {
  const currentLTV = collateralValue > 0 ? loanAmount / collateralValue : 0;
  const maxLTV = product.ltvBand[1];
  const minLTV = product.ltvBand[0];
  const pctFill = Math.min(currentLTV / 0.7, 1) * 100;
  const isOverMax = currentLTV > maxLTV;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span>Current LTV: {(currentLTV * 100).toFixed(1)}%</span>
        <span className={isOverMax ? "text-red-400" : "text-emerald-400"}>
          Max: {(maxLTV * 100).toFixed(0)}%
        </span>
      </div>
      <div className="h-3 bg-gray-800 rounded-full overflow-hidden relative">
        <div
          className={`h-full rounded-full transition-all ${isOverMax ? "bg-red-500" : "bg-emerald-500"}`}
          style={{ width: `${pctFill}%` }}
        />
        <div
          className="absolute top-0 h-full w-0.5 bg-yellow-400"
          style={{ left: `${(minLTV / 0.7) * 100}%` }}
        />
        <div
          className="absolute top-0 h-full w-0.5 bg-red-400"
          style={{ left: `${(maxLTV / 0.7) * 100}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>0%</span>
        <span className="text-yellow-400">{(minLTV*100).toFixed(0)}% min</span>
        <span className="text-red-400">{(maxLTV*100).toFixed(0)}% max</span>
        <span>70%</span>
      </div>
    </div>
  );
}

/* ─── MAIN PAGE ─── */
export default function FIACollateralStrategy() {
  const calcIntegration = useCalculatorIntegration({
    calculatorName: "FIACollateralStrategy",
    strategyType: "fia-collateral",
  });

  const { clientData } = useClientData();
  const [input, setInput] = useState<FIAWaterfallInput>(() => {
    const defaults = getDefaultFIAInput();
    if (clientData) {
      defaults.annualIncome = clientData.annualIncome || defaults.annualIncome;
      defaults.homeValue = clientData.homeValue || defaults.homeValue;
      defaults.mortgageBalance = clientData.mortgageBalance || defaults.mortgageBalance;
      defaults.clientAge = clientData.age || defaults.clientAge;
    }
    return defaults;
  });
  const [showComparison, setShowComparison] = useState(false);

  const update = useCallback((key: string, value: any) => {
    setInput(prev => ({ ...prev, [key]: value }));
  }, []);

  const result = useMemo(() => runFIAWaterfall(input), [input]);
  const combos = useMemo(() => showComparison ? runAllCombinations(input) : [], [input, showComparison]);
  const { summary, projection, collateralProduct, incomeProduct } = result;

  const waterfallData = projection.map(r => ({
    year: r.year,
    collateral: Math.round(r.collateralEndValue),
    income: Math.round(r.incomeEndValue),
    riderValue: Math.round(r.incomeRiderValue),
    loanBalance: Math.round(r.bankLoanBalance),
    ogIncome: Math.round(r.oilGasCumulativeIncome),
    taxSavings: Math.round(r.cumulativeTaxSavings),
    helocBalance: Math.round(r.helocBalance),
    netBenefit: Math.round(r.totalBenefit),
  }));

  const cashFlowData = projection.map(r => ({
    year: r.year,
    ogIncome: Math.round(r.oilGasIncome),
    taxSavings: Math.round(r.taxSavings),
    incomeWithdrawal: Math.round(r.incomeWithdrawal),
    bankInterest: -Math.round(r.bankLoanInterestPaid),
    helocInterest: -Math.round(r.helocInterestPaid),
    net: Math.round(r.netCashFlow),
  }));

  const allocationData = [
    { name: "Collateral Sleeve", value: summary.collateralPremium, fill: "#22c55e" },
    { name: "Income Sleeve", value: summary.incomePremium, fill: "#f59e0b" },
  ];

  const pageContent = `FIA Collateral & Income Strategy — Split-ticket: ${fmt(summary.collateralPremium)} collateral (${collateralProduct.name}) + ${fmt(summary.incomePremium)} income (${incomeProduct.name}). Max loan: ${fmt(summary.maxLoanAmount)}. Total benefit at year ${input.projectionYears}: ${fmt(summary.totalNetBenefit)}. HELOC payoff: ${summary.helocPayoffYear ? `Year ${summary.helocPayoffYear}` : "N/A"}. Estimated annual income: ${fmt(summary.estimatedAnnualIncome)}.`;

  return (
    <AppShell>
      <div className="container max-w-7xl py-6 space-y-6">
        <CalculationSyncBar />
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Layers className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">FIA Collateral & Income Strategy</h1>
                <p className="text-sm text-muted-foreground">Split-ticket structure with LTV-constrained lending</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FactFinderBadge />
            <ExportToSlides pageTitle="FIA Collateral Strategy" pageContent={pageContent} />
          </div>
        </div>

        {/* Executive Summary */}
        <ExecutiveSummary
          pageTitle="FIA Collateral & Income Strategy"
          summary="This page models a split-ticket annuity strategy: one FIA contract optimized for bank collateral (maximum loan-to-value), and a separate FIA contract optimized for guaranteed lifetime income. The bank loan funds oil & gas investments whose tax depreciation pays down your HELOC."
          whatYouCanLearn="How to structure two FIA contracts to simultaneously maximize borrowing power AND lifetime income without compromising either. Compare 9 product combinations across 6 carrier products."
          opportunities="Most advisors use a single annuity for both collateral and income — compromising both. Split-ticket structure can increase probable loan size by 15-25% while preserving full income rider benefits."
          intent="To give you a side-by-side comparison of the best collateral and income FIA products available, with realistic LTV bands based on bank underwriting analysis."
          callToAction="Select your preferred collateral and income products, adjust the allocation split, and compare all 9 combinations to find your optimal strategy."
          followUpQuestions={[
            "How does the ClearLine no-surrender-charge advantage translate to actual loan dollars vs. Athene PE Plus?",
            "At what allocation split does the income sleeve generate enough lifetime income to replace Social Security?",
            "How many years until the O&G tax savings fully pay off the HELOC?",
          ]}
        />
        <GoalsAccelerator pageTitle="FIA Collateral Strategy" pageContent={pageContent} />

        <Tabs defaultValue="products" className="space-y-4">
          <TabsList className="bg-gray-900/50 p-1 flex-wrap h-auto">
            <TabsTrigger value="products">Product Selection</TabsTrigger>
            <TabsTrigger value="waterfall">Waterfall Projection</TabsTrigger>
            <TabsTrigger value="cashflow">Cash Flow Analysis</TabsTrigger>
            <TabsTrigger value="comparison">9-Way Comparison</TabsTrigger>
            <TabsTrigger value="details">Product Details</TabsTrigger>
          
            <TabsTrigger value="generate-outcome" className="text-xs sm:text-sm bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 font-bold">Generate Outcome</TabsTrigger>
          </TabsList>

          {/* ─── TAB 1: PRODUCT SELECTION ─── */}
          <TabsContent value="products" className="space-y-6">
            {/* Input Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  Strategy Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Total Premium</Label>
                    <NumberInput value={input.totalPremium} onChange={v => update("totalPremium", v)} prefix="$" />
                  </div>
                  <div>
                    <Label>Collateral Allocation: {(input.collateralAllocation * 100).toFixed(0)}%</Label>
                    <Slider
                      value={[input.collateralAllocation * 100]}
                      onValueChange={([v]) => update("collateralAllocation", v / 100)}
                      min={50} max={85} step={5}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Collateral: {fmt(input.totalPremium * input.collateralAllocation)}</span>
                      <span>Income: {fmt(input.totalPremium * (1 - input.collateralAllocation))}</span>
                    </div>
                  </div>
                  <div>
                    <Label>Assumed Index Return</Label>
                    <NumberInput value={input.assumedIndexReturn} onChange={v => update("assumedIndexReturn", v)} suffix="%" />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label>Bank Loan Rate</Label>
                    <NumberInput value={input.bankLoanRate} onChange={v => update("bankLoanRate", v)} suffix="%" />
                  </div>
                  <div>
                    <Label>O&G Return Rate</Label>
                    <NumberInput value={input.oilGasReturnRate} onChange={v => update("oilGasReturnRate", v)} suffix="%" />
                  </div>
                  <div>
                    <Label>Annual Income</Label>
                    <NumberInput value={input.annualIncome} onChange={v => update("annualIncome", v)} prefix="$" />
                  </div>
                  <div>
                    <Label>Client Age</Label>
                    <NumberInput value={input.clientAge} onChange={v => update("clientAge", v)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label>Federal Tax Rate</Label>
                    <NumberInput value={input.federalTaxRate} onChange={v => update("federalTaxRate", v)} suffix="%" />
                  </div>
                  <div>
                    <Label>State Tax Rate</Label>
                    <NumberInput value={input.stateTaxRate} onChange={v => update("stateTaxRate", v)} suffix="%" />
                  </div>
                  <div>
                    <Label>Home Value</Label>
                    <NumberInput value={input.homeValue} onChange={v => update("homeValue", v)} prefix="$" />
                  </div>
                  <div>
                    <Label>Mortgage Balance</Label>
                    <NumberInput value={input.mortgageBalance} onChange={v => update("mortgageBalance", v)} prefix="$" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Allocation Pie + Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-sm font-medium mb-2 text-center">Allocation Split</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={allocationData} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
                        {allocationData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => fmt(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center gap-4 text-xs">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Collateral</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> Income</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="md:col-span-2">
                <CardContent className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "Max Loan", value: fmt(summary.maxLoanAmount), icon: Landmark, color: "emerald" },
                    { label: "Total Benefit (Yr " + input.projectionYears + ")", value: fmt(summary.totalNetBenefit), icon: TrendingUp, color: "green" },
                    { label: "HELOC Payoff", value: summary.helocPayoffYear ? `Year ${summary.helocPayoffYear}` : "N/A", icon: Home, color: "blue" },
                    { label: "Est. Annual Income", value: fmt(summary.estimatedAnnualIncome), icon: Banknote, color: "amber" },
                    { label: "Total O&G Income", value: fmt(summary.totalOilGasIncome), icon: Fuel, color: "orange" },
                    { label: "Total Tax Savings", value: fmt(summary.totalTaxSavings), icon: PiggyBank, color: "purple" },
                    { label: "FIA Growth", value: fmt(summary.totalFIAGrowth), icon: BarChart3, color: "cyan" },
                    { label: "Eff. Annual Return", value: pct(summary.effectiveAnnualReturn), icon: Percent, color: "pink" },
                  ].map((m, i) => (
                    <div key={i} className="bg-white/5 rounded-lg p-3 text-center">
                      <m.icon className={`w-4 h-4 mx-auto mb-1 text-${m.color}-400`} />
                      <div className="text-lg font-bold">{m.value}</div>
                      <div className="text-[10px] text-muted-foreground">{m.label}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* LTV Gauge */}
            <Card>
              <CardContent className="p-4">
                <h3 className="text-sm font-medium mb-3">Loan-to-Value Constraint — {collateralProduct.fullName}</h3>
                <LTVGauge product={collateralProduct} loanAmount={summary.maxLoanAmount} collateralValue={summary.collateralPremium * (1 + collateralProduct.bonusRate / 100)} />
                <p className="text-xs text-muted-foreground mt-2">
                  <AlertTriangle className="w-3 h-3 inline mr-1 text-yellow-400" />
                  Loan amount is capped at the product's LTV band. {collateralProduct.name} allows {(collateralProduct.ltvBand[0]*100).toFixed(0)}–{(collateralProduct.ltvBand[1]*100).toFixed(0)}% of net realizable value.
                </p>
              </CardContent>
            </Card>

            {/* Product Selection */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" /> Collateral Sleeve — Select Product
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {COLLATERAL_PRODUCTS.map(p => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    selected={input.collateralProductId === p.id}
                    onSelect={() => update("collateralProductId", p.id)}
                  />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-400" /> Income Sleeve — Select Product
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {INCOME_PRODUCTS.map(p => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    selected={input.incomeProductId === p.id}
                    onSelect={() => update("incomeProductId", p.id)}
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ─── TAB 2: WATERFALL PROJECTION ─── */}
          <TabsContent value="waterfall" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Asset Growth Waterfall — {input.projectionYears} Year Projection</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={450}>
                  <ComposedChart data={waterfallData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="year" stroke="#888" label={{ value: "Year", position: "insideBottom", offset: -5 }} />
                    <YAxis stroke="#888" tickFormatter={(v: number) => `$${(v/1000000).toFixed(1)}M`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid #333", borderRadius: 8 }}
                      formatter={(v: number, name: string) => [fmt(v), name]}
                      labelFormatter={(l: number) => `Year ${l}`}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="collateral" name="Collateral FIA" fill="#22c55e" fillOpacity={0.3} stroke="#22c55e" strokeWidth={2} />
                    <Area type="monotone" dataKey="income" name="Income FIA" fill="#f59e0b" fillOpacity={0.2} stroke="#f59e0b" strokeWidth={2} />
                    <Line type="monotone" dataKey="riderValue" name="Income Rider Value" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    <Line type="monotone" dataKey="ogIncome" name="Cumulative O&G Income" stroke="#f97316" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="taxSavings" name="Cumulative Tax Savings" stroke="#a855f7" strokeWidth={1.5} dot={false} />
                    <Area type="monotone" dataKey="loanBalance" name="Loan Balance" fill="#ef4444" fillOpacity={0.1} stroke="#ef4444" strokeWidth={1.5} />
                    {summary.helocPayoffYear && (
                      <ReferenceLine x={summary.helocPayoffYear} stroke="#22d3ee" strokeDasharray="3 3" label={{ value: "HELOC Paid Off", fill: "#22d3ee", fontSize: 10 }} />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* HELOC Paydown Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="w-5 h-5 text-cyan-400" /> HELOC Paydown from Tax Savings + O&G Excess
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={waterfallData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="year" stroke="#888" />
                    <YAxis stroke="#888" tickFormatter={(v: number) => `$${(v/1000).toFixed(0)}K`} />
                    <Tooltip contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid #333", borderRadius: 8 }} formatter={(v: number) => fmt(v)} />
                    <Area type="monotone" dataKey="helocBalance" name="HELOC Balance" fill="#ef4444" fillOpacity={0.3} stroke="#ef4444" strokeWidth={2} />
                    <Area type="monotone" dataKey="taxSavings" name="Cumulative Tax Savings" fill="#a855f7" fillOpacity={0.2} stroke="#a855f7" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Year-by-Year Table */}
            <Card>
              <CardHeader><CardTitle>Year-by-Year Projection</CardTitle></CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="p-2 text-left">Yr</th>
                      <th className="p-2 text-right">Collateral FIA</th>
                      <th className="p-2 text-right">Income FIA</th>
                      <th className="p-2 text-right">Rider Value</th>
                      <th className="p-2 text-right">Loan Balance</th>
                      <th className="p-2 text-right">O&G Income</th>
                      <th className="p-2 text-right">Tax Savings</th>
                      <th className="p-2 text-right">HELOC Bal</th>
                      <th className="p-2 text-right">Net Benefit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projection.map(r => (
                      <tr key={r.year} className={`border-b border-gray-800 ${r.isMaturityYear ? "bg-emerald-500/10" : ""}`}>
                        <td className="p-2">{r.year}</td>
                        <td className="p-2 text-right text-emerald-400">{fmt(r.collateralEndValue)}</td>
                        <td className="p-2 text-right text-amber-400">{fmt(r.incomeEndValue)}</td>
                        <td className="p-2 text-right text-blue-400">{fmt(r.incomeRiderValue)}</td>
                        <td className="p-2 text-right text-red-400">{fmt(r.bankLoanBalance)}</td>
                        <td className="p-2 text-right text-orange-400">{fmt(r.oilGasIncome)}</td>
                        <td className="p-2 text-right text-purple-400">{fmt(r.taxSavings)}</td>
                        <td className="p-2 text-right">{fmt(r.helocBalance)}</td>
                        <td className="p-2 text-right font-medium">{fmt(r.totalBenefit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── TAB 3: CASH FLOW ANALYSIS ─── */}
          <TabsContent value="cashflow" className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Annual Cash Flow Breakdown</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={cashFlowData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="year" stroke="#888" />
                    <YAxis stroke="#888" tickFormatter={(v: number) => `$${(v/1000).toFixed(0)}K`} />
                    <Tooltip contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid #333", borderRadius: 8 }} formatter={(v: number) => fmt(Math.abs(v))} />
                    <Legend />
                    <Bar dataKey="ogIncome" name="O&G Income" fill="#f97316" stackId="pos" />
                    <Bar dataKey="taxSavings" name="Tax Savings" fill="#a855f7" stackId="pos" />
                    <Bar dataKey="incomeWithdrawal" name="Income Withdrawal" fill="#f59e0b" stackId="pos" />
                    <Bar dataKey="bankInterest" name="Bank Interest" fill="#ef4444" stackId="neg" />
                    <Bar dataKey="helocInterest" name="HELOC Interest" fill="#f87171" stackId="neg" />
                    <Line type="monotone" dataKey="net" name="Net Cash Flow" stroke="#22c55e" strokeWidth={2} dot={false} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Tax Bracket Panel */}
            <TaxBracketPanel
              annualIncome={input.annualIncome}
              federalRate={input.federalTaxRate}
              stateRate={input.stateTaxRate}
              deductions={summary.totalTaxSavings / input.projectionYears}
              strategyName="FIA Collateral Strategy"
            />
          </TabsContent>

          {/* ─── TAB 4: 9-WAY COMPARISON ─── */}
          <TabsContent value="comparison" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>All Product Combinations — Ranked by Total Benefit</span>
                  <Button size="sm" onClick={() => setShowComparison(true)} variant={showComparison ? "outline" : "default"}>
                    {showComparison ? "Refresh" : "Run Comparison"}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {combos.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    Click "Run Comparison" to analyze all 9 product combinations
                  </div>
                ) : (
                  <div className="space-y-3">
                    {combos.map((c, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between p-4 rounded-lg border ${i === 0 ? "border-emerald-500/50 bg-emerald-500/10" : "border-gray-700 bg-white/5"} cursor-pointer hover:bg-white/10 transition-colors`}
                        onClick={() => {
                          update("collateralProductId", c.collateralId);
                          update("incomeProductId", c.incomeId);
                          toast.success(`Selected: ${c.label}`);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? "bg-emerald-500 text-white" : "bg-gray-700"}`}>
                            {i + 1}
                          </div>
                          <div>
                            <div className="font-medium">{c.label}</div>
                            <div className="text-xs text-muted-foreground">
                              Max Loan: {fmt(c.maxLoan)} • HELOC Payoff: {c.helocPayoffYear ? `Yr ${c.helocPayoffYear}` : "N/A"}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-emerald-400">{fmt(c.totalBenefit)}</div>
                          <div className="text-xs text-muted-foreground">Est. Income: {fmt(c.estimatedIncome)}/yr</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── TAB 5: PRODUCT DETAILS ─── */}
          <TabsContent value="details" className="space-y-6">
            {FIA_PRODUCTS.map(p => (
              <Card key={p.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {p.sleeve === "collateral" ? <Shield className="w-5 h-5 text-emerald-400" /> : <Target className="w-5 h-5 text-amber-400" />}
                      {p.fullName}
                    </div>
                    <Badge variant="outline" className={p.sleeve === "collateral" ? "text-emerald-400 border-emerald-500/30" : "text-amber-400 border-amber-500/30"}>
                      #{p.rank} {p.sleeve === "collateral" ? "Collateral" : "Income"} Sleeve
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                    <div className="bg-white/5 rounded p-3">
                      <div className="text-xs text-muted-foreground">Annual Cap</div>
                      <div className="text-lg font-bold text-emerald-400">{pct(p.annualCap)}</div>
                    </div>
                    <div className="bg-white/5 rounded p-3">
                      <div className="text-xs text-muted-foreground">Participation Rate</div>
                      <div className="text-lg font-bold">{p.participationRate}%</div>
                    </div>
                    <div className="bg-white/5 rounded p-3">
                      <div className="text-xs text-muted-foreground">LTV Band</div>
                      <div className="text-lg font-bold">{(p.ltvBand[0]*100).toFixed(0)}–{(p.ltvBand[1]*100).toFixed(0)}%</div>
                    </div>
                    <div className="bg-white/5 rounded p-3">
                      <div className="text-xs text-muted-foreground">Surrender</div>
                      <div className="text-lg font-bold">{p.surrenderYears} yr</div>
                    </div>
                    <div className="bg-white/5 rounded p-3">
                      <div className="text-xs text-muted-foreground">Free Withdrawal</div>
                      <div className="text-lg font-bold">{p.freeWithdrawalPct}%</div>
                    </div>
                  </div>
                  <div className="text-sm"><strong>Crediting:</strong> {p.creditingStrategy}</div>
                  {p.incomeRider && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-sm">
                      <strong className="text-blue-400">Income Rider:</strong> {p.incomeRider.rollUpRate}% {p.incomeRider.rollUpType} roll-up for {p.incomeRider.rollUpYears} years.
                      Payout: {p.incomeRider.payoutRateAge65}% (age 65), {p.incomeRider.payoutRateAge70}% (age 70), {p.incomeRider.payoutRateAge75}% (age 75).
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <h4 className="text-sm font-medium text-emerald-400 mb-1">Key Features</h4>
                      {p.features.map((f, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs mb-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-amber-400 mb-1">Considerations</h4>
                      {p.warnings.map((w, i) => (
                        <div key={i} className="flex items-start gap-1.5 text-xs mb-1">
                          <AlertTriangle className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
                          <span>{w}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {p.surrenderSchedule.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground mb-1">Surrender Schedule</h4>
                      <div className="flex gap-1">
                        {p.surrenderSchedule.map((sc, i) => (
                          <div key={i} className="bg-white/5 rounded px-2 py-1 text-xs text-center">
                            <div className="text-muted-foreground">Yr {i}</div>
                            <div className={sc > 0 ? "text-red-400" : "text-emerald-400"}>{sc}%</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        
          <TabsContent value="generate-outcome" className="space-y-6 mt-6">
            <GenerateOutcomeTab
              strategyType="fia-collateral"
              hasResults={!!result}
              resultData={result ? { fiaAccountValue: result.finalValue || 800000, collateralLoanAmount: result.loanAmount || 500000, netArbitrage: result.arbitrage || 25000, annualCrediting: result.creditRate || 6.5, loanInterestRate: result.loanRate || 4.5, projectionData: [] } : null}
              metrics={result ? [{ label: "FIA Value", value: result.finalValue || 800000, highlight: true }, { label: "Loan Amount", value: result.loanAmount || 500000 }, { label: "Net Arbitrage", value: result.arbitrage || 25000 }, { label: "Credit Rate", value: (result.creditRate || 6.5) / 100, format: "percent" }] : []}
            />
          </TabsContent>
        </Tabs>

        {/* Recommendation Summary */}
        <RecommendationSummary
          strategyName="FIA Collateral & Income Strategy"
          totalBenefit={summary.totalNetBenefit}
          annualTaxSavings={summary.totalTaxSavings / input.projectionYears}
          yearsToPayoff={summary.helocPayoffYear}
          recommendation={`Deploy ${fmt(summary.collateralPremium)} into ${collateralProduct.fullName} (collateral sleeve) and ${fmt(summary.incomePremium)} into ${incomeProduct.fullName} (income sleeve). This generates a ${fmt(summary.maxLoanAmount)} bank loan for O&G investment, producing ${fmt(summary.totalOilGasIncome)} in cumulative income and ${fmt(summary.totalTaxSavings)} in tax savings over ${input.projectionYears} years. Estimated lifetime income: ${fmt(summary.estimatedAnnualIncome)}/year.`}
        />

        {/* Do Nothing Baseline */}
        <DoNothingBaseline
          doNothingValue={input.totalPremium * Math.pow(1.04, input.projectionYears)}
          strategyValue={summary.totalNetBenefit + input.totalPremium}
          years={input.projectionYears}
          doNothingLabel="Leave in CDs at 4%"
          strategyLabel="FIA Split-Ticket + O&G + Tax Savings"
        />

        <PageInsights pageName="FIA Collateral Strategy" />
        <RelatedCalculators currentPage="FIACollateralStrategy" />
        <NAICDisclaimer />
      </div>
    </AppShell>
  );
}
