// @ts-nocheck
import { NumberInput } from "@/components/NumberInput";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Shield, DollarSign, TrendingUp, Calendar, Sun, Lock, Unlock, MapPin,
  ArrowRight, CheckCircle2, XCircle, AlertTriangle, Clock, Percent,
  BarChart3, Table2, Lightbulb, ChevronRight
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import ExportPdfButton from "@/components/ExportPdfButton";
import { ExportToSlides } from "@/components/ExportToSlides";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import {
  US_STATES, getTopProductsForState, getStateGuaranty, getStateName,
  getCarrierSplitRecommendation, type StateCode,
} from "@shared/annuityData";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { PlatformEnhancements } from "@/components/PlatformEnhancements";
import { PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer } from "recharts";
import { RelatedCalculators } from "@/components/RelatedCalculators";

const TABS = [
  { id: "overview", label: "Policy Overview", icon: Shield },
  { id: "solar", label: "Solar Strategy", icon: Sun },
  { id: "comparison", label: "Income Comparison", icon: BarChart3 },
  { id: "timeline", label: "Accumulation Timeline", icon: Table2 },
  { id: "whytaxfree", label: "Why Tax-Free", icon: Lightbulb },
] as const;

type TabId = typeof TABS[number]["id"];

export default function LifetimeGuaranteedIncome() {
  const { data: clientData } = useClientData();
  const [stateCode, setStateCode] = useState<StateCode>("FL");

  useEffect(() => {
    if (!clientData) return;
    setCurrentAge(clientData.age || 53);
    if (clientData.retirementAge) setIncomeStartAge(clientData.retirementAge);
    if (clientData.state) setStateCode(clientData.state as StateCode);
  }, [clientData]);

  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const [premium, setPremium] = useState(510000);
  const [currentAge, setCurrentAge] = useState(53);
  const [incomeStartAge, setIncomeStartAge] = useState(65);
  const [lifeExpectancy, setLifeExpectancy] = useState(90);
  const [filingStatus, setFilingStatus] = useState<"single" | "married">("single");
  const [otherTaxableIncome, setOtherTaxableIncome] = useState(50000);
  const [stateTaxRate, setStateTaxRate] = useState(5);
  const [solarGrowth, setSolarGrowth] = useState(25);

  const guaranty = useMemo(() => getStateGuaranty(stateCode), [stateCode]);
  const incomeProducts = useMemo(() => getTopProductsForState(stateCode, "income", 10), [stateCode]);
  const splitRec = useMemo(() => getCarrierSplitRecommendation(premium, stateCode), [premium, stateCode]);

  const { data: result, isLoading } = trpc.lifetimeIncome.calculate.useQuery({
    premium,
    currentAge,
    incomeStartAge,
    lifeExpectancy,
    filingStatus,
    otherTaxableIncome,
    stateTaxRate: stateTaxRate / 100,
    solarStrategyGrowth: solarGrowth / 100,
    incomeBaseGrowthRate: 0.10,
    premiumBonusPercent: 0.20,
  });

  const { data: rateTable } = trpc.lifetimeIncome.getRateTable.useQuery();

  const fmt = (n: number) => "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  const fmtPct = (n: number) => n.toFixed(1) + "%";

  const incomeYears = lifeExpectancy - incomeStartAge;

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6 p-4 md:p-6">
        <PlatformEnhancements
            pageTitle="Lifetime Guaranteed Income"
            monteCarloConfig={{ years: 30, initialValue: 500000, preset: "iulConservative" }}
        />

        {/* ─── CONSUMER OUTCOME BLOCKS ─── */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="LifetimeGuaranteedIncome" />

        <ExecutiveSummary
          pageTitle="Lifetime Guaranteed Income"
          whatItDoes="This calculator models guaranteed lifetime income streams from fixed and indexed annuities, showing you exactly how much monthly income you can lock in for life regardless of market conditions. It factors in your age, premium amount, and state-specific guaranty fund protections."
          opportunities="Many clients overlook the power of combining multiple annuity types — a MYGA for guaranteed growth with an income annuity for lifetime payments. You may also be missing state guaranty fund coverage that effectively insures your annuity up to $250K-$500K depending on your state."
          intent="To give you absolute clarity on what guaranteed income looks like — no market risk, no guesswork — so you can build a retirement floor that never drops."
          takeaway="Guaranteed income eliminates the #1 retirement fear: running out of money. Even a portion of your portfolio in guaranteed income can transform your retirement confidence."
          callToAction="Compare your current projected Social Security + pension income against your needs — then see how an annuity fills the gap."
          followUpQuestions={[
            "What happens to my guaranteed income if the insurance company fails? (Hint: state guaranty funds)",
            "Should I ladder multiple annuities across different carriers for maximum protection?",
            "How does guaranteed annuity income interact with my Social Security optimization strategy?",
          ]}
        />
        <GoalsAccelerator pageName="Lifetime Guaranteed Income" pageContext="Models guaranteed lifetime income from annuities with carrier comparison, state guaranty analysis, and income projections" />
        <TaxBracketPanel grossIncome={clientData?.annualIncome || 150000} filingStatus={clientData?.filingStatus || "single"} stateCode={clientData?.state || "TX"} />
        <RecommendationSummary
          headline="Guaranteed income eliminates market risk from your retirement"
          detail="By allocating a portion of your portfolio to guaranteed income products, you create a retirement floor that covers essential expenses regardless of market conditions."
          dollarBenefit={Math.round((clientData?.annualIncomeNeeded || 150000) * 0.6 * 20)}
          timeHorizon="lifetime"
          confidence="high"
          nextStep="Run a carrier comparison for your state"
        />
        <DoNothingBaseline
          metrics={[
            { label: "Income Certainty", doNothing: 40, recommended: 95, format: "percent" },
            { label: "Market Risk Exposure", doNothing: 80, recommended: 30, format: "percent", higherIsBetter: false },
            { label: "Monthly Guaranteed Income", doNothing: (clientData?.pensionIncome || 0) + (clientData?.socialSecurityEstimate || 2000), recommended: (clientData?.pensionIncome || 0) + (clientData?.socialSecurityEstimate || 2000) + 3500, format: "currency" },
          ]}
          summary="Without guaranteed income, you're relying entirely on market performance and withdrawal strategies that may fail in a prolonged downturn."
        />

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                Lifetime Guaranteed Income
              </h1>
            </div>
            <>
              <ExportPdfButton
                pageTitle="Lifetime Guaranteed Income Analysis"
                getSections={() => [
                  { title: "Income Strategy", items: [
                    { label: "Strategy", value: "Solar Strategy — Roth convert, then annuitize for tax-free income" },
                    { label: "Benefit", value: "Up to 70% more effective guaranteed lifetime income" },
                    { label: "Tax Treatment", value: "Tax-free distributions via Roth conversion" },
                  ]},
                ]}
                getBullets={() => [
                  "Roth conversion eliminates future tax uncertainty on retirement income",
                  "Guaranteed lifetime income provides predictable budgeting",
                  "Solar Strategy combines Roth conversion with annuity income for maximum tax efficiency",
                ]}
              />
              <ExportToSlides
                toolName="Lifetime Guaranteed Income"
                getSections={() => [
                  { title: "Income Strategy", items: [
                    { label: "Strategy", value: "Solar Strategy — Roth convert, then annuitize for tax-free income" },
                    { label: "Benefit", value: "Up to 70% more effective guaranteed lifetime income" },
                    { label: "Tax Treatment", value: "Tax-free distributions via Roth conversion" },
                  ]},
                  { title: "Key Inputs", items: [
                    { label: "Premium", value: `$${premium.toLocaleString()}` },
                    { label: "Current Age", value: currentAge.toString() },
                    { label: "Income Start Age", value: incomeStartAge.toString() },
                    { label: "Life Expectancy", value: lifeExpectancy.toString() },
                  ]},
                  { title: "Comparison Results", items: result ? [
                    { label: "Tax-Free Annual Income", value: `$${result.solarStrategy.taxFreeAnnualIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
                    { label: "Taxable After-Tax Income", value: `$${result.taxableScenario.afterTaxIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
                    { label: "Annual Advantage", value: `+$${result.comparison.annualAdvantageTaxFree.toLocaleString(undefined, { maximumFractionDigits: 0 })}/yr` },
                    { label: "Lifetime Advantage", value: `+$${result.comparison.lifetimeAdvantage.toLocaleString(undefined, { maximumFractionDigits: 0 })}` },
                  ] : [
                    { label: "Status", value: "Calculating..." }
                  ]}
                ]}
                getBullets={() => [
                  "Roth conversion eliminates future tax uncertainty on retirement income",
                  "Guaranteed lifetime income provides predictable budgeting",
                  "Solar Strategy combines Roth conversion with annuity income for maximum tax efficiency",
                ]}
              />
            </>
          </div>
          <p className="text-muted-foreground max-w-3xl text-sm">
            Discover how the Solar Strategy of Roth converting your funds first creates tax-free lifetime income — 
            allowing better budgeting because no one knows what future taxes will be. Receive up to <strong className="text-amber-400">70% more</strong> effective 
            guaranteed lifetime income through proactive tax planning.
          </p>
        </div>

        {/* Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="rc-card">
            <div className="text-sm font-semibold text-white mb-3">Lifetime Income Advantage</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={result ? [
                { name: "Taxable", value: result.taxableScenario.lifetimeAfterTaxIncome },
                { name: "Tax-Free", value: result.solarStrategy.lifetimeTaxFreeIncome }
              ] : []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                <XAxis dataKey="name" stroke="#8892b0" fontSize={12} />
                <YAxis stroke="#8892b0" fontSize={12} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <RTooltip 
                  contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Lifetime Income"]}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {result ? [
                    <Cell key="cell-0" fill="#ef4444" />,
                    <Cell key="cell-1" fill="#22c55e" />
                  ] : []}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="rc-card">
            <div className="text-sm font-semibold text-white mb-3">Income Base Growth</div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={result ? result.accumulationTimeline : []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                <XAxis dataKey="age" stroke="#8892b0" fontSize={12} />
                <YAxis stroke="#8892b0" fontSize={12} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <RTooltip 
                  contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Income Base"]}
                  labelFormatter={(label) => `Age ${label}`}
                />
                <Area type="monotone" dataKey="incomeBase" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
              </AreaChart>
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
                  <strong>{incomeProducts.length}</strong> income annuity products available in {getStateName(stateCode)}
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

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "bg-card/50 text-muted-foreground hover:bg-card hover:text-foreground border border-transparent"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ═══════════════════════ TAB: Policy Overview ═══════════════════════ */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Policy Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 border-blue-700/30">
                <CardContent className="p-4 text-center">
                  <DollarSign className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-xs text-blue-300/70 uppercase tracking-wider">Premium</p>
                  <p className="text-2xl font-bold text-blue-200">{fmt(premium)}</p>
                  <p className="text-xs text-blue-400 mt-1">+ 20% Bonus = {fmt(premium * 1.2)}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 border-emerald-700/30">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-xs text-emerald-300/70 uppercase tracking-wider">Income Base at {incomeStartAge}</p>
                  <p className="text-2xl font-bold text-emerald-200">{result ? fmt(result.policyDetails.incomeBaseAtStart) : "..."}</p>
                  <p className="text-xs text-emerald-400 mt-1">10% Simple Interest Growth</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-amber-900/40 to-amber-800/20 border-amber-700/30">
                <CardContent className="p-4 text-center">
                  <Calendar className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-xs text-amber-300/70 uppercase tracking-wider">Income Starts</p>
                  <p className="text-2xl font-bold text-amber-200">Age {incomeStartAge}</p>
                  <p className="text-xs text-amber-400 mt-1">{incomeStartAge - currentAge} Years Deferral</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border-purple-700/30">
                <CardContent className="p-4 text-center">
                  <Shield className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <p className="text-xs text-purple-300/70 uppercase tracking-wider">Guaranteed Annual</p>
                  <p className="text-2xl font-bold text-purple-200">{result ? fmt(result.taxableScenario.annualIncome) : "..."}</p>
                  <p className="text-xs text-purple-400 mt-1">For Life — Never Runs Out</p>
                </CardContent>
              </Card>
            </div>

            {/* Product Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="w-5 h-5 text-amber-400" />
                  Athene Ascent SM Pro 10 Bonus Annuity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-amber-400">Product Features</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between py-1 border-b border-border/30">
                        <span className="text-muted-foreground">Product Type</span>
                        <span>Fixed Indexed Deferred Annuity</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-border/30">
                        <span className="text-muted-foreground">Premium Bonus</span>
                        <span className="text-emerald-400 font-medium">20% ({fmt(premium * 0.2)})</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-border/30">
                        <span className="text-muted-foreground">Income Base Growth</span>
                        <span>10% Simple Interest / Year</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-border/30">
                        <span className="text-muted-foreground">Growth Period</span>
                        <span>Up to 20 Years</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-border/30">
                        <span className="text-muted-foreground">Rider Charge</span>
                        <span>1.00% Annual</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-border/30">
                        <span className="text-muted-foreground">Income Option</span>
                        <span>Single Life Level</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-muted-foreground">0% Floor Protection</span>
                        <span className="text-emerald-400">Yes — Never Lose Principal</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-semibold text-amber-400">Income Rate Schedule</h3>
                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-background">
                          <tr className="border-b border-border/50">
                            <th className="text-left py-1 text-muted-foreground font-medium">Defer</th>
                            <th className="text-left py-1 text-muted-foreground font-medium">Age</th>
                            <th className="text-right py-1 text-muted-foreground font-medium">Base</th>
                            <th className="text-right py-1 text-muted-foreground font-medium">Rate</th>
                            <th className="text-right py-1 text-muted-foreground font-medium">Income</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rateTable?.map((row: { deferralYears: number; beginAge: number; incomeBase: number; incomePercent: number }, i: number) => (
                            <tr key={i} className={`border-b border-border/20 ${row.beginAge === incomeStartAge ? "bg-amber-500/10 font-semibold" : ""}`}>
                              <td className="py-1">{row.deferralYears}yr</td>
                              <td className="py-1">{row.beginAge}</td>
                              <td className="text-right py-1">{fmt(row.incomeBase)}</td>
                              <td className="text-right py-1">{row.incomePercent.toFixed(2)}%</td>
                              <td className="text-right py-1 text-amber-400">{fmt(Math.round(row.incomeBase * row.incomePercent / 100))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Key Insight */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 mt-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-amber-400 mb-1">Critical Tax Insight</h4>
                      <p className="text-sm text-muted-foreground">
                        This annuity uses <strong>qualified (IRA/401k) money</strong>, meaning every dollar of the {result ? fmt(result.taxableScenario.annualIncome) : "..."}/year 
                        lifetime income is <strong className="text-red-400">fully taxable as ordinary income</strong>. By Roth converting these funds first through the 
                        Solar Strategy, the entire income stream becomes <strong className="text-emerald-400">100% tax-free for life</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        {/* ═══════════════════════ TAB: Solar Strategy ═══════════════════════ */}
        {activeTab === "solar" && (
          <div className="space-y-6">
            {/* Inputs Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sun className="w-5 h-5 text-amber-400" />
                  Solar Strategy Calculator — Roth Conversion First
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Premium Amount</Label>
                    <NumberInput value={premium} onChange={setPremium} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Current Age</Label>
                    <NumberInput value={currentAge} onChange={setCurrentAge} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Income Start Age</Label>
                    <NumberInput value={incomeStartAge} onChange={setIncomeStartAge} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Life Expectancy</Label>
                    <NumberInput value={lifeExpectancy} onChange={setLifeExpectancy} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Filing Status</Label>
                    <Select value={filingStatus} onValueChange={(v) => setFilingStatus(v as "single" | "married")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married Filing Jointly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Other Taxable Income</Label>
                    <NumberInput value={otherTaxableIncome} onChange={setOtherTaxableIncome} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">State Tax Rate (%)</Label>
                    <NumberInput value={stateTaxRate} onChange={setStateTaxRate} />
                  </div>
                  <div className="space-y-2 col-span-full md:col-span-2">
                    <Label className="text-xs">Solar Strategy Growth: {solarGrowth}% additional tax-free growth</Label>
                    <Slider
                      value={[solarGrowth]}
                      onValueChange={([v]) => setSolarGrowth(v)}
                      min={10}
                      max={40}
                      step={1}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground">Typical range: 22-28%. The Roth conversion process adds this percentage to your principal base through tax-free compounding growth.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Solar Strategy Results */}
            {result && (
              <div className="space-y-6">
                {/* Recommended vs Taxable */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* RECOMMENDED: Solar Strategy */}
                  <Card className="bg-gradient-to-br from-emerald-900/30 to-emerald-800/10 border-emerald-500/40 relative overflow-hidden">
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-emerald-500 text-white text-xs">RECOMMENDED</Badge>
                    </div>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg text-emerald-400">
                        <Unlock className="w-5 h-5" />
                        Solar Strategy — Tax-Free Income
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-2 border-b border-emerald-500/20">
                          <span className="text-muted-foreground">Roth Conversion Amount</span>
                          <span>{fmt(result.solarStrategy.rothConversionAmount)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-emerald-500/20">
                          <span className="text-muted-foreground">One-Time Conversion Tax</span>
                          <span className="text-red-400">{fmt(result.solarStrategy.conversionTaxCost)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-emerald-500/20">
                          <span className="text-muted-foreground">Additional Growth ({solarGrowth}%)</span>
                          <span className="text-emerald-400">+{fmt(result.solarStrategy.additionalGrowthAmount)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-emerald-500/20">
                          <span className="text-muted-foreground">Enhanced Premium</span>
                          <span className="font-semibold">{fmt(result.solarStrategy.enhancedPremium)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-emerald-500/20">
                          <span className="text-muted-foreground">Enhanced Income Base at {incomeStartAge}</span>
                          <span className="font-semibold">{fmt(result.solarStrategy.enhancedIncomeBaseAtStart)}</span>
                        </div>
                        <div className="flex justify-between py-3 bg-emerald-500/10 rounded-lg px-3 mt-2">
                          <span className="font-semibold text-emerald-400">Tax-Free Annual Income</span>
                          <span className="text-xl font-bold text-emerald-300">{fmt(result.solarStrategy.taxFreeAnnualIncome)}/yr</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-muted-foreground">Lifetime Tax-Free Income ({incomeYears} yrs)</span>
                          <span className="font-bold text-emerald-400">{fmt(result.solarStrategy.lifetimeTaxFreeIncome)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-400 text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>100% predictable — no tax rate surprises</span>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-400 text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>No IRMAA surcharges on Medicare</span>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-400 text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Social Security not taxed by this income</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* TAXABLE: No Roth Conversion */}
                  <Card className="bg-gradient-to-br from-red-900/20 to-red-800/10 border-red-500/30 relative overflow-hidden">
                    <div className="absolute top-3 right-3">
                      <Badge variant="outline" className="border-red-500/50 text-red-400 text-xs">TAXABLE</Badge>
                    </div>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg text-red-400">
                        <Lock className="w-5 h-5" />
                        Traditional — Taxable Income
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between py-2 border-b border-red-500/20">
                          <span className="text-muted-foreground">Gross Annual Income</span>
                          <span>{fmt(result.taxableScenario.annualIncome)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-red-500/20">
                          <span className="text-muted-foreground">Federal Tax</span>
                          <span className="text-red-400">-{fmt(result.taxableScenario.federalTax)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-red-500/20">
                          <span className="text-muted-foreground">State Tax ({stateTaxRate}%)</span>
                          <span className="text-red-400">-{fmt(result.taxableScenario.stateTax)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-red-500/20">
                          <span className="text-muted-foreground">Total Annual Tax</span>
                          <span className="text-red-400 font-semibold">-{fmt(result.taxableScenario.totalTax)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-red-500/20">
                          <span className="text-muted-foreground">Effective Tax Rate</span>
                          <span className="text-red-400">{fmtPct(result.taxableScenario.effectiveRate * 100)}</span>
                        </div>
                        <div className="flex justify-between py-3 bg-red-500/10 rounded-lg px-3 mt-2">
                          <span className="font-semibold text-red-400">After-Tax Annual Income</span>
                          <span className="text-xl font-bold text-red-300">{fmt(result.taxableScenario.afterTaxIncome)}/yr</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-muted-foreground">Lifetime After-Tax Income ({incomeYears} yrs)</span>
                          <span className="font-bold text-red-400">{fmt(result.taxableScenario.lifetimeAfterTaxIncome)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-red-400 text-sm">
                        <XCircle className="w-4 h-4" />
                        <span>Subject to future tax rate increases</span>
                      </div>
                      <div className="flex items-center gap-2 text-red-400 text-sm">
                        <XCircle className="w-4 h-4" />
                        <span>May trigger IRMAA Medicare surcharges</span>
                      </div>
                      <div className="flex items-center gap-2 text-red-400 text-sm">
                        <XCircle className="w-4 h-4" />
                        <span>Can cause Social Security to be taxed</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Advantage Summary */}
                <Card className="bg-gradient-to-r from-amber-900/30 via-amber-800/20 to-amber-900/30 border-amber-500/40">
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-center">
                      <div>
                        <p className="text-xs text-amber-300/70 uppercase tracking-wider mb-1">Annual Advantage</p>
                        <p className="text-2xl font-bold text-amber-300">+{fmt(result.comparison.annualAdvantageTaxFree)}/yr</p>
                        <p className="text-xs text-muted-foreground mt-1">More in your pocket</p>
                      </div>
                      <div>
                        <p className="text-xs text-amber-300/70 uppercase tracking-wider mb-1">Effective Income Boost</p>
                        <p className="text-2xl font-bold text-amber-300">+{fmtPct(result.comparison.effectiveIncomeBoost)}</p>
                        <p className="text-xs text-muted-foreground mt-1">More effective income</p>
                      </div>
                      <div>
                        <p className="text-xs text-amber-300/70 uppercase tracking-wider mb-1">Lifetime Advantage</p>
                        <p className="text-2xl font-bold text-emerald-400">+{fmt(result.comparison.lifetimeAdvantage)}</p>
                        <p className="text-xs text-muted-foreground mt-1">Over {incomeYears} years</p>
                      </div>
                      <div>
                        <p className="text-xs text-amber-300/70 uppercase tracking-wider mb-1">Breakeven</p>
                        <p className="text-2xl font-bold text-amber-300">{result.comparison.yearsToBreakeven} Years</p>
                        <p className="text-xs text-muted-foreground mt-1 whitespace-normal">To recoup conversion tax</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════ TAB: Income Comparison ═══════════════════════ */}
        {activeTab === "comparison" && result && (
          <div className="space-y-6">
            {/* Visual Bar Comparison */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="w-5 h-5 text-amber-400" />
                  Annual Income Comparison
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Tax-Free Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Sun className="w-4 h-4 text-emerald-400" />
                      <span className="font-medium text-emerald-400">Solar Strategy (Tax-Free)</span>
                      <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">RECOMMENDED</Badge>
                    </span>
                    <span className="font-bold text-emerald-300">{fmt(result.solarStrategy.taxFreeAnnualIncome)}/yr</span>
                  </div>
                  <div className="h-10 bg-muted/30 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-lg flex items-center justify-end pr-3"
                      style={{ width: "100%" }}
                    >
                      <span className="text-xs font-bold text-white">100% Tax-Free</span>
                    </div>
                  </div>
                </div>

                {/* Taxable Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-red-400" />
                      <span className="font-medium text-red-400">Traditional (Taxable)</span>
                      <Badge variant="outline" className="border-red-500/50 text-red-400 text-xs">UNRELIABLE</Badge>
                    </span>
                    <span className="font-bold text-red-300">{fmt(result.taxableScenario.afterTaxIncome)}/yr after tax</span>
                  </div>
                  <div className="h-10 bg-muted/30 rounded-lg overflow-hidden flex">
                    <div
                      className="h-full bg-gradient-to-r from-blue-700 to-blue-500 flex items-center justify-end pr-2"
                      style={{ width: `${(result.taxableScenario.afterTaxIncome / result.solarStrategy.taxFreeAnnualIncome) * 100}%` }}
                    >
                      <span className="text-xs font-bold text-white">After Tax</span>
                    </div>
                    <div
                      className="h-full bg-gradient-to-r from-red-700 to-red-500 flex items-center justify-center"
                      style={{ width: `${(result.taxableScenario.totalTax / result.solarStrategy.taxFreeAnnualIncome) * 100}%` }}
                    >
                      <span className="text-xs font-bold text-white">Tax</span>
                    </div>
                  </div>
                </div>

                <div className="text-center text-sm text-muted-foreground mt-4">
                  The Solar Strategy delivers <strong className="text-amber-400">{fmtPct(result.comparison.effectiveIncomeBoost)} more</strong> effective 
                  lifetime income compared to the taxable approach.
                </div>
              </CardContent>
            </Card>

            {/* Year-by-Year Income Phase Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Table2 className="w-5 h-5 text-amber-400" />
                  Year-by-Year Income Phase — Age {incomeStartAge} to {lifeExpectancy}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-background z-10">
                      <tr className="border-b border-border/50">
                        <th className="text-left py-2 px-2 text-muted-foreground font-medium">Age</th>
                        <th className="text-right py-2 px-2 text-red-400 font-medium">Taxable Gross</th>
                        <th className="text-right py-2 px-2 text-red-400 font-medium">After Tax</th>
                        <th className="text-right py-2 px-2 text-emerald-400 font-medium">Tax-Free</th>
                        <th className="text-right py-2 px-2 text-amber-400 font-medium">Tax Saved</th>
                        <th className="text-right py-2 px-2 text-muted-foreground font-medium">Cum. Taxable</th>
                        <th className="text-right py-2 px-2 text-muted-foreground font-medium">Cum. Tax-Free</th>
                        <th className="text-right py-2 px-2 text-amber-400 font-medium">Cum. Tax Saved</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.incomePhaseTimeline.map((row: any, i: number) => (
                        <tr key={i} className="border-b border-border/20 hover:bg-muted/10">
                          <td className="py-1.5 px-2 font-medium">{row.age}</td>
                          <td className="text-right py-1.5 px-2 text-red-300">{fmt(row.taxableGrossIncome)}</td>
                          <td className="text-right py-1.5 px-2 text-red-400">{fmt(row.taxableAfterTaxIncome)}</td>
                          <td className="text-right py-1.5 px-2 text-emerald-400 font-medium">{fmt(row.solarTaxFreeIncome)}</td>
                          <td className="text-right py-1.5 px-2 text-amber-400">{fmt(row.annualTaxSaved)}</td>
                          <td className="text-right py-1.5 px-2 text-muted-foreground">{fmt(row.cumulativeTaxableAfterTax)}</td>
                          <td className="text-right py-1.5 px-2 text-muted-foreground">{fmt(row.cumulativeTaxFree)}</td>
                          <td className="text-right py-1.5 px-2 text-amber-400 font-medium">{fmt(row.cumulativeTaxSaved)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Lifetime Totals */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-red-900/20 border-red-500/30">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-red-300/70 uppercase tracking-wider">Lifetime Taxable (After-Tax)</p>
                  <p className="text-2xl font-bold text-red-300 mt-1">{fmt(result.taxableScenario.lifetimeAfterTaxIncome)}</p>
                  <p className="text-xs text-red-400 mt-1">Taxes paid: {fmt(result.taxableScenario.lifetimeTaxPaid)}</p>
                </CardContent>
              </Card>
              <Card className="bg-emerald-900/20 border-emerald-500/30">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-emerald-300/70 uppercase tracking-wider">Lifetime Tax-Free (Solar)</p>
                  <p className="text-2xl font-bold text-emerald-300 mt-1">{fmt(result.solarStrategy.lifetimeTaxFreeIncome)}</p>
                  <p className="text-xs text-emerald-400 mt-1">Taxes paid: $0</p>
                </CardContent>
              </Card>
              <Card className="bg-amber-900/20 border-amber-500/30">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-amber-300/70 uppercase tracking-wider">Total Lifetime Advantage</p>
                  <p className="text-2xl font-bold text-amber-300 mt-1">+{fmt(result.comparison.lifetimeAdvantage)}</p>
                  <p className="text-xs text-amber-400 mt-1">More money in your pocket</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        {/* ═══════════════════════ TAB: Accumulation Timeline ═══════════════════════ */}
        {activeTab === "timeline" && result && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="w-5 h-5 text-amber-400" />
                  Income Base Growth — Deferral Period (Age {currentAge} to {incomeStartAge})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  The income base grows by 10% simple interest per year on the original premium. The longer you defer, the higher your 
                  guaranteed income percentage and the larger your income base — resulting in significantly more lifetime income.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-background">
                      <tr className="border-b border-border/50">
                        <th className="text-left py-2 px-2 text-muted-foreground font-medium">Year</th>
                        <th className="text-left py-2 px-2 text-muted-foreground font-medium">Age</th>
                        <th className="text-right py-2 px-2 text-blue-400 font-medium">Income Base</th>
                        <th className="text-right py-2 px-2 text-muted-foreground font-medium">Rate</th>
                        <th className="text-right py-2 px-2 text-amber-400 font-medium">If Income Starts</th>
                        <th className="text-right py-2 px-2 text-red-400 font-medium">After Tax</th>
                        <th className="text-right py-2 px-2 text-emerald-400 font-medium">Solar Tax-Free</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.accumulationTimeline.map((row: any, i: number) => (
                        <tr key={i} className={`border-b border-border/20 hover:bg-muted/10 ${row.age === incomeStartAge ? "bg-amber-500/10 font-semibold" : ""}`}>
                          <td className="py-1.5 px-2">{i}</td>
                          <td className="py-1.5 px-2">{row.age}</td>
                          <td className="text-right py-1.5 px-2 text-blue-400">{fmt(row.incomeBase)}</td>
                          <td className="text-right py-1.5 px-2">{row.incomePercent.toFixed(2)}%</td>
                          <td className="text-right py-1.5 px-2 text-amber-400">{fmt(row.guaranteedIncome)}/yr</td>
                          <td className="text-right py-1.5 px-2 text-red-400">{fmt(row.taxableAfterTax)}/yr</td>
                          <td className="text-right py-1.5 px-2 text-emerald-400">{fmt(row.solarTaxFreeIncome)}/yr</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Growth Visualization */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Income Base Growth Visualization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.accumulationTimeline.map((row: any, i: number) => {
                    const maxBase = result.accumulationTimeline[result.accumulationTimeline.length - 1].incomeBase;
                    const pct = (row.incomeBase / maxBase) * 100;
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-8 text-right">{row.age}</span>
                        <div className="flex-1 h-6 bg-muted/20 rounded overflow-hidden">
                          <div
                            className={`h-full rounded transition-all ${row.age === incomeStartAge ? "bg-amber-500" : "bg-blue-500/60"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono w-24 text-right">{fmt(row.incomeBase)}</span>
</div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ═══════════════════════ TAB: Why Tax-Free ═══════════════════════ */}
        {activeTab === "whytaxfree" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lightbulb className="w-5 h-5 text-amber-400" />
                  Why Tax-Free Lifetime Income Changes Everything
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* The Problem */}
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-5">
                  <h3 className="font-semibold text-red-400 text-lg mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    The Problem: Nobody Knows Future Tax Rates
                  </h3>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>
                      When you receive taxable lifetime income from a qualified annuity, you are at the mercy of whatever Congress decides 
                      tax rates should be in the future. Historical top marginal rates have ranged from <strong className="text-red-400">7% to 94%</strong>.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                      <div className="bg-red-900/30 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-red-300">94%</p>
                        <p className="text-xs text-red-400">1944 Top Rate</p>
                      </div>
                      <div className="bg-red-900/30 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-red-300">70%</p>
                        <p className="text-xs text-red-400">1970s Top Rate</p>
                      </div>
                      <div className="bg-amber-900/30 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-amber-300">37%</p>
                        <p className="text-xs text-amber-400">2024 Top Rate</p>
                      </div>
                      <div className="bg-red-900/30 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-red-300">???</p>
                        <p className="text-xs text-red-400">Future Rate</p>
                      </div>
                    </div>
                    <p className="mt-3">
                      With <strong>$35+ trillion in national debt</strong> and growing, many experts predict tax rates will need to increase 
                      significantly. Your "guaranteed" income becomes <strong className="text-red-400">unreliable</strong> when you cannot predict 
                      how much the government will take.
                    </p>
                  </div>
                </div>

                {/* The Solution */}
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-5">
                  <h3 className="font-semibold text-emerald-400 text-lg mb-3 flex items-center gap-2">
                    <Sun className="w-5 h-5" />
                    The Solution: Solar Strategy — Roth Convert First
                  </h3>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>
                      The Solar Strategy involves Roth converting your IRA/401k funds <strong>before</strong> purchasing the lifetime income annuity. 
                      This one-time tax event creates a permanent tax-free income stream for life.
                    </p>
                    <div className="space-y-2 mt-3">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-amber-400 font-bold text-sm">1</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Roth Convert Your IRA/401k</p>
                          <p className="text-xs">Pay taxes once at today's known rates. The conversion process typically adds 22-28% additional growth to your principal base through tax-free compounding.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-amber-400 font-bold text-sm">2</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Purchase Annuity with Roth Funds</p>
                          <p className="text-xs">Your enhanced principal (original + 22-28% growth) goes into the annuity, creating a larger income base.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-emerald-400 font-bold text-sm">3</span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Receive Tax-Free Income for Life</p>
                          <p className="text-xs">Every dollar of your guaranteed lifetime income is 100% tax-free. No federal tax, no state tax, no surprises.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* The Math */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-5">
                  <h3 className="font-semibold text-amber-400 text-lg mb-3 flex items-center gap-2">
                    <Percent className="w-5 h-5" />
                    The Math: Up to 70% More Effective Lifetime Income
                  </h3>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>
                      When you combine the <strong>22-28% additional tax-free growth</strong> from the Roth conversion process with the 
                      <strong> elimination of all future taxes</strong> on the income stream, the result is dramatic:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      <div className="bg-background/50 rounded-lg p-4 space-y-2">
                        <h4 className="font-medium text-red-400">Without Solar Strategy</h4>
                        <div className="flex justify-between text-xs py-1 border-b border-border/20">
                          <span>Gross Income</span>
                          <span>{result ? fmt(result.taxableScenario.annualIncome) : "$76,500"}</span>
                        </div>
                        <div className="flex justify-between text-xs py-1 border-b border-border/20">
                          <span>Federal + State Tax</span>
                          <span className="text-red-400">-{result ? fmt(result.taxableScenario.totalTax) : "$18,000"}</span>
                        </div>
                        <div className="flex justify-between text-xs py-1 font-semibold">
                          <span>You Keep</span>
                          <span className="text-red-400">{result ? fmt(result.taxableScenario.afterTaxIncome) : "$58,500"}</span>
                        </div>
                      </div>
                      <div className="bg-background/50 rounded-lg p-4 space-y-2">
                        <h4 className="font-medium text-emerald-400">With Solar Strategy</h4>
                        <div className="flex justify-between text-xs py-1 border-b border-border/20">
                          <span>Enhanced Income</span>
                          <span>{result ? fmt(result.solarStrategy.taxFreeAnnualIncome) : "$95,625"}</span>
                        </div>
                        <div className="flex justify-between text-xs py-1 border-b border-border/20">
                          <span>Tax</span>
                          <span className="text-emerald-400">$0</span>
                        </div>
                        <div className="flex justify-between text-xs py-1 font-semibold">
                          <span>You Keep</span>
                          <span className="text-emerald-400">{result ? fmt(result.solarStrategy.taxFreeAnnualIncome) : "$95,625"}</span>
                        </div>
                      </div>
                    </div>
                    {result && (
                      <p className="mt-3 text-center">
                        That is <strong className="text-amber-400 text-lg">{fmtPct(result.comparison.effectiveIncomeBoost)} more</strong> effective 
                        income every single year, guaranteed for life.
                      </p>
                    )}
                  </div>
                </div>

                {/* Budget Certainty */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-5">
                  <h3 className="font-semibold text-blue-400 text-lg mb-3 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Budget Certainty: The Hidden Superpower
                  </h3>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>
                      Beyond the raw numbers, tax-free income provides something priceless: <strong>certainty</strong>. 
                      When you know exactly how much hits your bank account every month — with zero tax variability — 
                      you can plan your retirement with complete confidence.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      <div className="space-y-2">
                        <h4 className="font-medium text-emerald-400 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" /> Tax-Free Benefits
                        </h4>
                        <ul className="space-y-1 text-xs">
                          <li className="flex items-start gap-2"><ChevronRight className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />Exact monthly budget — no tax surprises</li>
                          <li className="flex items-start gap-2"><ChevronRight className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />No IRMAA Medicare premium surcharges</li>
                          <li className="flex items-start gap-2"><ChevronRight className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />Social Security benefits not taxed by this income</li>
                          <li className="flex items-start gap-2"><ChevronRight className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />No state income tax on distributions</li>
                          <li className="flex items-start gap-2"><ChevronRight className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />Protected from future tax rate increases</li>
                          <li className="flex items-start gap-2"><ChevronRight className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />No Required Minimum Distributions (RMDs)</li>
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium text-red-400 flex items-center gap-2">
                          <XCircle className="w-4 h-4" /> Taxable Risks
                        </h4>
                        <ul className="space-y-1 text-xs">
                          <li className="flex items-start gap-2"><ChevronRight className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />Tax rates could double (historical precedent)</li>
                          <li className="flex items-start gap-2"><ChevronRight className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />IRMAA surcharges add $2,000-$12,000/yr</li>
                          <li className="flex items-start gap-2"><ChevronRight className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />Up to 85% of Social Security becomes taxable</li>
                          <li className="flex items-start gap-2"><ChevronRight className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />State taxes add 3-13% on top</li>
                          <li className="flex items-start gap-2"><ChevronRight className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />Net Investment Income Tax (3.8%) may apply</li>
                          <li className="flex items-start gap-2"><ChevronRight className="w-3 h-3 text-red-400 mt-0.5 shrink-0" />Cannot predict actual take-home amount</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="text-center py-4">
                  <Button
                    onClick={() => setActiveTab("solar")}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-8 py-3"
                  >
                    <Sun className="w-5 h-5 mr-2" />
                    Calculate Your Solar Strategy
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400" />
          </div>
        )}
      </div>

      <NAICDisclaimer variant="footer" showsProjections showsCashValues />
    </AppShell>
  );
}
