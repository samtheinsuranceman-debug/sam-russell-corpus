// @ts-nocheck
import { useState, useEffect, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer } from "recharts";
import ExportPdfButton from "@/components/ExportPdfButton";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NumberInput } from "@/components/NumberInput";
import {
  TrendingUp, Shield, Gem, Calculator, FileText, BarChart3,
  CheckCircle2, XCircle, ArrowRight, DollarSign, Zap, Globe,
  AlertTriangle, ExternalLink, Coins, MapPin,
} from "lucide-react";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import {
  US_STATES, getTopProductsForState, getStateGuaranty, getStateName,
  getCarrierSplitRecommendation, type StateCode,
} from "@shared/annuityData";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

export default function GrowthAnnuities() {
  const productQuery = trpc.growthAnnuity.getProductData.useQuery();
  const analyzeMut = trpc.growthAnnuity.analyze.useMutation();

  const [stateCode, setStateCode] = useState<StateCode>("FL");

  const [form, setForm] = useState({
    initialPremium: 250000,
    annualReturnRate: 22,
    projectionYears: 20,
    existingAnnuityValue: 300000,
    existingAnnuityCompany: "",
    yearsInForce: 5,
    currentSurrenderValue: 255000,
    accountType: "ira" as "ira" | "401k" | "403b" | "tsp" | "roth" | "nonqualified",
    surrenderPenaltyPct: 15,
    premiumBonusPct: 25,
    doRothConversion: true,
    currentTaxBracket: 28,
  });

  const { data: clientData } = useClientData();
  useEffect(() => {
    if (!clientData) return;
    setForm(p => ({
      ...p,
      initialPremium: clientData.annualIncome ? Math.round(clientData.annualIncome * 1.5) : p.initialPremium,
    }));
    if (clientData.state) setStateCode(clientData.state as StateCode);
  }, [clientData]);

  const guaranty = useMemo(() => getStateGuaranty(stateCode), [stateCode]);
  const growthProducts = useMemo(() => getTopProductsForState(stateCode, "growth", 10), [stateCode]);
  const splitRec = useMemo(() => getCarrierSplitRecommendation(form.initialPremium, stateCode), [form.initialPremium, stateCode]);

  const updateForm = (key: string, val: string | number | boolean) =>
    setForm((p) => ({ ...p, [key]: val }));

  const handleAnalyze = () => analyzeMut.mutate(form);

  const product = productQuery.data;
  const result = analyzeMut.data;

  const fmt = (n: number) => {
    if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
    if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
    return `$${n.toLocaleString()}`;
  };

  return (
    <AppShell>
      <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="GrowthAnnuities" />

        <ExecutiveSummary
          pageTitle="Growth Annuities"
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
        <GoalsAccelerator pageName="Growth Annuities" pageContext="Growth Annuities — financial analysis modeling with projections and scenario analysis" />
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
        {/* Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="rc-card bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-sm font-semibold text-white mb-3">Strategy Allocation</div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={product?.strategies?.length ? product.strategies.map((s) => ({ name: s.name, value: s.participationRate })) : [{ name: "No Data", value: 1 }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {(product?.strategies || [{ name: "No Data" }]).map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={["#22c55e", "#3b82f6", "#f0c040", "#a78bfa", "#ef4444"][index % 5]} />
                  ))}
                </Pie>
                <RTooltip contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="rc-card bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="text-sm font-semibold text-white mb-3">Projected Growth</div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={result?.projections || [{ year: 1, endValue: form.initialPremium }]}>
                <defs>
                  <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="year" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <RTooltip contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 }} formatter={(value: number) => [`$${value.toLocaleString()}`, "Value"]} />
                <Area type="monotone" dataKey="endValue" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorGrowth)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
              <Gem className="w-3 h-3 mr-1" /> F&G + BlackRock
            </Badge>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">
              Managed ETF Technology
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-bold">Growth Annuities</h1>
            <div className="flex items-center gap-2">
              <ExportToSlides
                toolName="Growth Annuities"
                getSections={() => [
                  { title: "Product Overview", items: [
                    { label: "Product", value: "F&G + BlackRock Fixed Index Annuity" },
                    { label: "Strategy", value: "Benchmarks to BlackRock iShares ETFs" },
                    { label: "Downside Protection", value: "0% floor — zero downside risk" },
                    { label: "Return Potential", value: "Double-digit returns via managed ETF technology" },
                  ]},
                ]}
                getBullets={() => [
                  "Only FIA that benchmarks directly to BlackRock iShares ETFs",
                  "Zero downside risk with managed, transparent return potential",
                  "25% premium bonus on qualifying deposits",
                ]}
              />
              <ExportPdfButton
            pageTitle="Growth Annuities — F&G BlackRock FIA"
            getSections={() => [
              { title: "Product Overview", items: [
                { label: "Product", value: "F&G + BlackRock Fixed Index Annuity" },
                { label: "Strategy", value: "Benchmarks to BlackRock iShares ETFs" },
                { label: "Downside Protection", value: "0% floor — zero downside risk" },
                { label: "Return Potential", value: "Double-digit returns via managed ETF technology" },
              ]},
            ]}
            getBullets={() => [
              "Only FIA that benchmarks directly to BlackRock iShares ETFs",
              "Zero downside risk with managed, transparent return potential",
              "25% premium bonus on qualifying deposits",
              ]}
            />
            </div>
          </div>
          <p className="text-muted-foreground max-w-3xl">
            The only Fixed Index Annuity that benchmarks directly to BlackRock iShares ETFs —
            delivering managed, transparent, double-digit return potential with zero downside risk.
          </p>
        </div>

        {/* ─── STATE SELECTOR ─── */}
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs font-semibold flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-400" /> Client State of Residence
                </Label>
                <Select value={stateCode} onValueChange={v => setStateCode(v as StateCode)}>
                  <SelectTrigger className="mt-1 border-emerald-500/30">
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
                  <p className="text-lg font-bold text-emerald-400">${(guaranty.annuityLimit / 1000).toFixed(0)}K</p>
                </div>
                <Badge variant="outline" className={`text-xs ${guaranty.tier === "Premium" ? "border-emerald-500/50 text-emerald-400" : guaranty.tier === "Enhanced" ? "border-blue-500/50 text-blue-400" : guaranty.tier === "Below Standard" ? "border-red-500/50 text-red-400" : "border-slate-500/50 text-slate-400"}`}>
                  {guaranty.tier} Protection
                </Badge>
              </div>
              <div className="flex items-center">
                <p className="text-xs text-muted-foreground">
                  <strong>{growthProducts.length}</strong> growth FIA products available in {getStateName(stateCode)}
                  {splitRec.splitCount > 1 && (
                    <span className="block mt-1 text-amber-400">
                      <AlertTriangle className="w-3 h-3 inline mr-1" />
                      Consider splitting across {splitRec.splitCount} carriers for full guaranty coverage
                    </span>
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1 bg-muted/50">
            <TabsTrigger value="overview" className="text-xs sm:text-sm whitespace-nowrap">
              <FileText className="w-3.5 h-3.5 mr-1" /> Product Overview
            </TabsTrigger>
            <TabsTrigger value="etf-vs-traditional" className="text-xs sm:text-sm whitespace-nowrap">
              <Zap className="w-3.5 h-3.5 mr-1" /> ETF vs Traditional
            </TabsTrigger>
            <TabsTrigger value="precious-metals" className="text-xs sm:text-sm whitespace-nowrap">
              <Coins className="w-3.5 h-3.5 mr-1" /> Precious Metals
            </TabsTrigger>
            <TabsTrigger value="fact-finder" className="text-xs sm:text-sm whitespace-nowrap">
              <Calculator className="w-3.5 h-3.5 mr-1" /> Fact Finder
            </TabsTrigger>
            <TabsTrigger value="growth-calc" className="text-xs sm:text-sm whitespace-nowrap">
              <BarChart3 className="w-3.5 h-3.5 mr-1" /> Growth Calculator
            </TabsTrigger>
            <TabsTrigger value="roth-conversion" className="text-xs sm:text-sm whitespace-nowrap">
              <TrendingUp className="w-3.5 h-3.5 mr-1" /> Roth Conversion
            </TabsTrigger>
          </TabsList>

          {/* ═══ TAB 1: Product Overview ═══ */}
          <TabsContent value="overview" className="space-y-4">
            {product && (
              <>
                {/* Product At-a-Glance */}
                <Card className="border-emerald-500/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-emerald-400" />
                      F&G Power Accumulator — At a Glance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-muted/30 rounded-lg p-4 text-center">
                        <p className="text-xs text-muted-foreground">Carrier</p>
                        <p className="font-semibold text-sm mt-1">{product.product.carrier}</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-4 text-center">
                        <p className="text-xs text-muted-foreground">AM Best Rating</p>
                        <p className="font-bold text-emerald-400 text-lg mt-1">{product.product.amBestRating}</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-4 text-center">
                        <p className="text-xs text-muted-foreground">10-Year Hypothetical</p>
                        <p className="font-bold text-emerald-400 text-lg mt-1">8.28% avg</p>
                        <p className="text-xs text-muted-foreground">$100K → $221,557</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-4 text-center">
                        <p className="text-xs text-muted-foreground">Downside Protection</p>
                        <p className="font-bold text-emerald-400 text-lg mt-1">0% Floor</p>
                        <p className="text-xs text-muted-foreground">Never lose principal</p>
                      </div>
                    </div>

                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4">
                      <p className="text-sm font-semibold text-emerald-400 mb-2">What Makes This Different</p>
                      <p className="text-sm text-muted-foreground">
                        {product.product.keyDifferentiator}. Unlike traditional FIAs that use opaque, custom-built indices,
                        the F&G Power Accumulator benchmarks to real BlackRock iShares ETFs with decades of verifiable
                        performance data. You can look up IVV, IAU, EFA, or IYR on any financial site and see exactly
                        how these assets have performed historically.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Index Strategies */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-blue-400" />
                      BlackRock ETF Index Strategies
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/50">
                            <th className="text-left py-2 px-3 font-medium">Strategy</th>
                            <th className="text-center py-2 px-3 font-medium">Participation</th>
                            <th className="text-center py-2 px-3 font-medium">Cap</th>
                            <th className="text-center py-2 px-3 font-medium">Vol Target</th>
                            <th className="text-center py-2 px-3 font-medium">ETF-Based</th>
                            <th className="text-left py-2 px-3 font-medium hidden lg:table-cell">Managed By</th>
                          </tr>
                        </thead>
                        <tbody>
                          {product.strategies.map((s: any, i: number) => (
                            <tr key={i} className="border-b border-border/20 hover:bg-muted/20">
                              <td className="py-2 px-3">
                                <p className="font-medium text-xs sm:text-sm">{s.name}</p>
                                <p className="text-xs text-muted-foreground hidden md:block">{s.assetClasses.join(", ")}</p>
                              </td>
                              <td className="text-center py-2 px-3">
                                <span className="font-bold text-emerald-400">{s.participationRate}%</span>
                              </td>
                              <td className="text-center py-2 px-3">
                                {s.capRate ? `${s.capRate}%` : "None"}
                              </td>
                              <td className="text-center py-2 px-3">
                                {s.volatilityTarget ? `${s.volatilityTarget}%` : "—"}
                              </td>
                              <td className="text-center py-2 px-3">
                                {s.isETFBased ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                                ) : (
                                  <XCircle className="w-4 h-4 text-muted-foreground mx-auto" />
                                )}
                              </td>
                              <td className="py-2 px-3 text-xs text-muted-foreground hidden lg:table-cell">{s.managedBy}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-4 bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                      <p className="text-xs text-amber-400 font-semibold">Example: Balanced Asset 5 at 170% Participation</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        If the index gains 8% in a year, you are credited <strong className="text-emerald-400">13.6%</strong> (8% × 170%).
                        In a strong year, you keep significantly more than the index return — with zero downside risk.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Sources */}
                <Card className="border-muted">
                  <CardContent className="pt-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">Sources & References</p>
                    <div className="flex flex-wrap gap-2">
                      {product.product.sources.map((s: any, i: number) => (
                        <a
                          key={i}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 bg-blue-500/5 px-2 py-1 rounded"
                        >
                          <ExternalLink className="w-3 h-3" /> {s.name} ({s.date})
                        </a>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* ═══ TAB 2: ETF vs Traditional ═══ */}
          <TabsContent value="etf-vs-traditional" className="space-y-4">
            <Card className="border-blue-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-400" />
                  Managed ETFs vs. Stale Insurance Company Indices
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
                  <p className="text-sm font-semibold text-blue-400 mb-2">The Critical Difference</p>
                  <p className="text-sm text-muted-foreground">
                    Traditional fixed index annuities link your returns to custom indices created by investment banks —
                    essentially <strong>black boxes</strong> with no transparency about how they work. These indices are
                    <strong> not actively managed</strong>. Once created, they follow a static formula regardless of
                    market conditions.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    The F&G Power Accumulator is fundamentally different. It benchmarks to <strong>real BlackRock iShares ETFs</strong> —
                    actual exchange-traded funds where billions of dollars are <strong>actively mobilized on an hourly and daily basis</strong>.
                    BlackRock's algorithms continuously rebalance across 8+ asset classes, responding to market conditions in real-time.
                    This active management creates a dramatically higher likelihood of producing <strong>double-digit earnings returns</strong>
                    compared to a traditional FIA.
                  </p>
                </div>

                {product && (
                  <div className="space-y-3">
                    {product.comparison.map((c: any, i: number) => (
                      <div key={i} className="border border-border/30 rounded-lg overflow-hidden">
                        <div className="bg-muted/30 px-4 py-2 flex items-center justify-between">
                          <span className="font-semibold text-sm">{c.category}</span>
                          {c.advantage === "etf" && (
                            <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">ETF Advantage</Badge>
                          )}
                          {c.advantage === "neutral" && (
                            <Badge variant="outline" className="text-xs">Equal</Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/20">
                          <div className={`p-3 ${c.advantage === "etf" ? "bg-emerald-500/5" : ""}`}>
                            <p className="text-xs font-semibold text-emerald-400 mb-1">Managed ETF (F&G + BlackRock)</p>
                            <p className="text-xs text-muted-foreground">{c.managedETF}</p>
                          </div>
                          <div className={`p-3 ${c.advantage === "traditional" ? "bg-red-500/5" : ""}`}>
                            <p className="text-xs font-semibold text-red-400 mb-1">Traditional Insurance Index</p>
                            <p className="text-xs text-muted-foreground">{c.traditionalIndex}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                  <p className="text-sm font-bold text-emerald-400 mb-2">Bottom Line</p>
                  <p className="text-sm text-muted-foreground">
                    When your annuity is linked to actively managed ETFs that are rebalanced daily by the world's
                    largest asset manager (BlackRock manages over $10 trillion), your money is working harder every
                    single day. Traditional insurance indices sit idle — they don't adapt, they don't rebalance,
                    and they don't mobilize capital. The F&G Power Accumulator offers a <strong>much greater
                    likelihood of producing double-digit earnings returns</strong> than any traditional fixed index annuity.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ TAB 3: Precious Metals ═══ */}
          <TabsContent value="precious-metals" className="space-y-4">
            {product && (
              <>
                <Card className="border-amber-500/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Coins className="w-5 h-5 text-amber-400" />
                      Precious Metals Index — 20-25% Annualized Returns
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-amber-500/10 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">Gold Price</p>
                        <p className="text-lg font-bold text-amber-400">${product.preciousMetals.gold.currentPrice.toLocaleString()}/oz</p>
                      </div>
                      <div className="bg-gray-500/10 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">Silver Price</p>
                        <p className="text-lg font-bold text-gray-300">${product.preciousMetals.silver.currentPrice}/oz</p>
                      </div>
                      <div className="bg-emerald-500/10 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">Gold 2025 Return</p>
                        <p className="text-lg font-bold text-emerald-400">+64.6%</p>
                      </div>
                      <div className="bg-emerald-500/10 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">Silver 2025 Return</p>
                        <p className="text-lg font-bold text-emerald-400">+148%</p>
                      </div>
                    </div>

                    {/* Performance Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/50">
                            <th className="text-left py-2 px-3">Year</th>
                            <th className="text-center py-2 px-3">Gold Return</th>
                            <th className="text-center py-2 px-3">Silver Return</th>
                            <th className="text-left py-2 px-3 hidden md:table-cell">Source</th>
                          </tr>
                        </thead>
                        <tbody>
                          {product.preciousMetals.gold.performance.map((g: any, i: number) => {
                            const s = product.preciousMetals.silver.performance[i];
                            return (
                              <tr key={i} className="border-b border-border/20">
                                <td className="py-2 px-3 font-medium">{g.year}</td>
                                <td className={`text-center py-2 px-3 font-bold ${g.returnPct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                  {g.returnPct >= 0 ? "+" : ""}{g.returnPct}%
                                </td>
                                <td className={`text-center py-2 px-3 font-bold ${s?.returnPct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                  {s ? `${s.returnPct >= 0 ? "+" : ""}${s.returnPct}%` : "—"}
                                </td>
                                <td className="py-2 px-3 text-xs text-muted-foreground hidden md:table-cell">{g.source}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Why This Trend Continues */}
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4 space-y-3">
                      <p className="text-sm font-bold text-amber-400">Why Precious Metals Will Continue to Outperform</p>
                      <p className="text-sm text-muted-foreground">
                        The precious metals index has delivered <strong>20-25% annualized returns</strong> over the last two years,
                        and multiple structural forces suggest this trend is likely to continue and potentially accelerate:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {product.fiatData.keyPoints.map((point: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 bg-muted/20 rounded p-2">
                            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                            <p className="text-xs text-muted-foreground">{point}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Fiat Currency Warning */}
                    <Card className="border-red-500/20 bg-red-500/5">
                      <CardContent className="pt-4 space-y-3">
                        <p className="text-sm font-bold text-red-400 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" /> The Fiat Currency Crisis
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="bg-muted/30 rounded-lg p-3 text-center">
                            <p className="text-xs text-muted-foreground">US National Debt</p>
                            <p className="text-lg font-bold text-red-400">$36+ Trillion</p>
                          </div>
                          <div className="bg-muted/30 rounded-lg p-3 text-center">
                            <p className="text-xs text-muted-foreground">M2 Money Supply Increase</p>
                            <p className="text-lg font-bold text-red-400">+41% (2020-2025)</p>
                          </div>
                          <div className="bg-muted/30 rounded-lg p-3 text-center">
                            <p className="text-xs text-muted-foreground">Dollar Purchasing Power Lost</p>
                            <p className="text-lg font-bold text-red-400">-87% Since 1971</p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Precious metals are the ultimate hedge against the fiat-based currency system. If the government's
                          growing trend of money printing and debt creation continues — and there is no indication it will stop —
                          this is <strong>one of the only recommendation chassis that will outperform inflation</strong> and create
                          heavy double-digit returns <strong>without the possibility of loss</strong>. Gold cannot be printed,
                          digitally expanded, or inflated away. Since 1971, gold has appreciated over <strong>13,500%</strong> while
                          the US dollar has lost 87% of its purchasing power.
                        </p>
                        <p className="text-xs text-muted-foreground italic">
                          Sources: J.P. Morgan Research (Dec 2025), BlackRock/iShares (Mar 2026), Sprott Insights (Jan 2026),
                          LSEG/FTSE Russell (Sep 2025), Investing.com (Feb 2026)
                        </p>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* ═══ TAB 4: Fact Finder ═══ */}
          <TabsContent value="fact-finder" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  Financial Fact Finder
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* New Premium Section */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" /> New Premium Investment
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs">Initial Premium ($)</Label>
                      <NumberInput value={form.initialPremium} onChange={(v) => updateForm("initialPremium", v)} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs whitespace-normal leading-tight">Expected Annual Return (%)</Label>
                      <NumberInput value={form.annualReturnRate} onChange={(v) => updateForm("annualReturnRate", v)} className="mt-1" />
                      <p className="text-xs text-muted-foreground mt-1">Precious metals index: 20-25% recent</p>
                    </div>
                    <div>
                      <Label className="text-xs">Projection Years</Label>
                      <NumberInput value={form.projectionYears} onChange={(v) => updateForm("projectionYears", v)} className="mt-1" />
                    </div>
                  </div>
                </div>

                {/* Existing Annuity Section */}
                <div className="space-y-3 border-t border-border/30 pt-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-400" /> Your Existing Annuity
                  </h3>
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3 mb-3">
                    <p className="text-xs text-amber-400 font-semibold">Important</p>
                    <p className="text-xs text-muted-foreground">
                      If your current annuity hasn't been Roth converted, it hasn't been maximized for full earning potential.
                      All gains remain tax-deferred — meaning you'll owe taxes on every dollar you withdraw.
                      By Roth converting first, all future gains become <strong>100% tax-free</strong>.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs">Annuity Company Name</Label>
                      <Input
                        value={form.existingAnnuityCompany}
                        onChange={(e) => updateForm("existingAnnuityCompany", e.target.value)}
                        placeholder="e.g., Athene, Allianz, Pacific Life"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Original Annuity Value ($)</Label>
                      <NumberInput value={form.existingAnnuityValue} onChange={(v) => updateForm("existingAnnuityValue", v)} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">Current Surrender Value ($)</Label>
                      <NumberInput value={form.currentSurrenderValue} onChange={(v) => updateForm("currentSurrenderValue", v)} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">Years In Force</Label>
                      <NumberInput value={form.yearsInForce} onChange={(v) => updateForm("yearsInForce", v)} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">Account Type</Label>
                      <Select value={form.accountType} onValueChange={(v) => updateForm("accountType", v)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ira">Traditional IRA</SelectItem>
                          <SelectItem value="401k">401(k)</SelectItem>
                          <SelectItem value="403b">403(b)</SelectItem>
                          <SelectItem value="tsp">TSP</SelectItem>
                          <SelectItem value="roth">Already Roth</SelectItem>
                          <SelectItem value="nonqualified">Non-Qualified</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Surrender Penalty (%)</Label>
                      <NumberInput value={form.surrenderPenaltyPct} onChange={(v) => updateForm("surrenderPenaltyPct", v)} className="mt-1" />
                    </div>
                  </div>
                </div>

                {/* Roth Conversion Toggle */}
                <div className="space-y-3 border-t border-border/30 pt-4">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" /> Roth Conversion & Premium Bonus
                  </h3>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={form.doRothConversion}
                      onCheckedChange={(v) => updateForm("doRothConversion", v)}
                    />
                    <Label className="text-sm">Apply Roth Conversion + Premium Bonus Strategy</Label>
                  </div>
                  {form.doRothConversion && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">Premium Bonus (%)</Label>
                        <NumberInput value={form.premiumBonusPct} onChange={(v) => updateForm("premiumBonusPct", v)} className="mt-1" />
                        <p className="text-xs text-muted-foreground mt-1">Typical range: 20-30% applied tax-free</p>
                      </div>
                      <div>
                        <Label className="text-xs">Current Tax Bracket (%)</Label>
                        <NumberInput value={form.currentTaxBracket} onChange={(v) => updateForm("currentTaxBracket", v)} className="mt-1" />
                      </div>
                    </div>
                  )}
                </div>

                <Button onClick={handleAnalyze} className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={analyzeMut.isPending}>
                  {analyzeMut.isPending ? "Analyzing..." : "Run Growth Analysis"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ TAB 5: Growth Calculator ═══ */}
          <TabsContent value="growth-calc" className="space-y-4">
            {!result ? (
              <Card className="border-dashed">
                <CardContent className="pt-6 text-center space-y-3">
                  <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground">Complete the Fact Finder and click "Run Growth Analysis" to see projections</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card className="bg-emerald-500/10 border-emerald-500/30">
                    <CardContent className="pt-4 text-center">
                      <p className="text-xs text-muted-foreground">Final Value</p>
                      <p className="text-xl font-bold text-emerald-400">{fmt(result.finalValue)}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-blue-500/10 border-blue-500/30">
                    <CardContent className="pt-4 text-center">
                      <p className="text-xs text-muted-foreground">Total Growth</p>
                      <p className="text-xl font-bold text-blue-400">{fmt(result.totalGrowth)}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-amber-500/10 border-amber-500/30">
                    <CardContent className="pt-4 text-center">
                      <p className="text-xs text-muted-foreground">Avg Annual Return</p>
                      <p className="text-xl font-bold text-amber-400">{result.averageAnnualReturn}%</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-purple-500/10 border-purple-500/30">
                    <CardContent className="pt-4 text-center">
                      <p className="text-xs text-muted-foreground">Return Multiple</p>
                      <p className="text-xl font-bold text-purple-400">{(result.finalValue / form.initialPremium).toFixed(1)}x</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Growth Comparison Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Growth Comparison: F&G Power Accumulator vs Traditional FIA</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {result.projections.filter((_: any, i: number) => i % Math.max(1, Math.floor(result.projections.length / 10)) === 0 || i === result.projections.length - 1).map((yr: any, i: number) => {
                        const trad = result.traditionalProjections[yr.year - 1];
                        const maxVal = result.projections[result.projections.length - 1]?.endValue || 1;
                        const pctMain = (yr.endValue / maxVal) * 100;
                        const pctTrad = (trad?.endValue / maxVal) * 100;
                        return (
                          <div key={i} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-muted-foreground">Year {yr.year}</span>
                              <span className="text-emerald-400 font-medium">{fmt(yr.endValue)}</span>
                            </div>
                            <div className="relative h-5 bg-muted/30 rounded-full overflow-hidden">
                              <div
                                className="absolute top-0 left-0 h-full bg-emerald-500/30 rounded-full"
                                style={{ width: `${pctMain}%` }}
                              />
                              <div
                                className="absolute top-0 left-0 h-full bg-red-500/20 rounded-full border-r-2 border-red-400"
                                style={{ width: `${pctTrad}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-red-400">Traditional: {fmt(trad?.endValue || 0)}</span>
                              <span className="text-emerald-400">+{fmt(yr.endValue - (trad?.endValue || 0))} advantage</span>
                            </div>
</div>
                        );
                      })}
                    </div>
                    <div className="flex gap-4 mt-4 text-xs">
                      <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-emerald-500/30" /> F&G Power Accumulator ({form.annualReturnRate}%)</div>
                      <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-500/20 border border-red-400" /> Traditional FIA (5.5%)</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Precious Metals Projection */}
                <Card className="border-amber-500/20">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Coins className="w-4 h-4 text-amber-400" />
                      Precious Metals Index Projection (22.5% annualized)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border/50">
                            <th className="text-left py-2 px-2">Year</th>
                            <th className="text-right py-2 px-2">Start Value</th>
                            <th className="text-right py-2 px-2">Growth</th>
                            <th className="text-right py-2 px-2">End Value</th>
                            <th className="text-right py-2 px-2">Cumulative Return</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.preciousMetalsProjections.filter((_: any, i: number) => i < 5 || i === result.preciousMetalsProjections.length - 1).map((yr: any, i: number) => (
                            <tr key={i} className="border-b border-border/20">
                              <td className="py-1.5 px-2">{yr.year}</td>
                              <td className="text-right py-1.5 px-2">{fmt(yr.startValue)}</td>
                              <td className="text-right py-1.5 px-2 text-emerald-400">+{fmt(yr.growth)}</td>
                              <td className="text-right py-1.5 px-2 font-medium">{fmt(yr.endValue)}</td>
                              <td className="text-right py-1.5 px-2 text-amber-400">+{yr.cumulativeReturnPct}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Full Projection Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Year-by-Year Growth Projection</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto max-h-96 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-background">
                          <tr className="border-b border-border/50">
                            <th className="text-left py-2 px-2">Year</th>
                            <th className="text-right py-2 px-2">Start Value</th>
                            <th className="text-right py-2 px-2">Annual Growth</th>
                            <th className="text-right py-2 px-2">End Value</th>
                            <th className="text-right py-2 px-2">Cumulative Growth</th>
                            <th className="text-right py-2 px-2">Total Return</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.projections.map((yr: any, i: number) => (
                            <tr key={i} className="border-b border-border/20 hover:bg-muted/20">
                              <td className="py-1.5 px-2">{yr.year}</td>
                              <td className="text-right py-1.5 px-2">{fmt(yr.startValue)}</td>
                              <td className="text-right py-1.5 px-2 text-emerald-400">+{fmt(yr.growth)}</td>
                              <td className="text-right py-1.5 px-2 font-medium">{fmt(yr.endValue)}</td>
                              <td className="text-right py-1.5 px-2">{fmt(yr.cumulativeGrowth)}</td>
                              <td className="text-right py-1.5 px-2 text-amber-400">+{yr.cumulativeReturnPct}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* ═══ TAB 6: Roth Conversion ═══ */}
          <TabsContent value="roth-conversion" className="space-y-4">
            {!result?.rothConversion ? (
              <Card className="border-dashed">
                <CardContent className="pt-6 text-center space-y-3">
                  <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto" />
                  <p className="text-muted-foreground">
                    Enable "Apply Roth Conversion + Premium Bonus Strategy" in the Fact Finder tab,
                    then click "Run Growth Analysis" to see the conversion advantage.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Conversion Waterfall */}
                <Card className="border-emerald-500/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                      Roth Conversion Advantage
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-lg p-4">
                      <p className="text-sm font-semibold text-emerald-400 mb-2">The Strategy</p>
                      <p className="text-sm text-muted-foreground">
                        By taking a {form.surrenderPenaltyPct}% early surrender penalty to Roth convert the funds at
                        <strong> 0% tax liability</strong> (through proper tax planning), then receiving an additional
                        tax-free bonus of <strong>{form.premiumBonusPct}%</strong> on top of the surrender value —
                        the math more than makes up for any early penalties or surrender charges.
                        All future gains are then <strong>100% tax-free, not tax-deferred</strong> like traditional annuities.
                      </p>
                    </div>

                    {/* Waterfall Steps */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
                        <span className="text-sm">Original Surrender Value</span>
                        <span className="font-bold">{fmt(result.rothConversion.originalValue)}</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <ArrowRight className="w-4 h-4 text-red-400 rotate-90" />
                      </div>
                      <div className="flex items-center justify-between bg-red-500/10 rounded-lg p-3">
                        <span className="text-sm text-red-400">Surrender Penalty ({form.surrenderPenaltyPct}%)</span>
                        <span className="font-bold text-red-400">-{fmt(result.rothConversion.surrenderPenalty)}</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <ArrowRight className="w-4 h-4 text-muted-foreground rotate-90" />
                      </div>
                      <div className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
                        <span className="text-sm">After Penalty Value</span>
                        <span className="font-bold">{fmt(result.rothConversion.afterPenaltyValue)}</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <ArrowRight className="w-4 h-4 text-emerald-400 rotate-90" />
                      </div>
                      <div className="flex items-center justify-between bg-blue-500/10 rounded-lg p-3">
                        <span className="text-sm text-blue-400">Roth Conversion Tax</span>
                        <span className="font-bold text-blue-400">$0 (0% with proper planning)</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <ArrowRight className="w-4 h-4 text-emerald-400 rotate-90" />
                      </div>
                      <div className="flex items-center justify-between bg-emerald-500/10 rounded-lg p-3">
                        <span className="text-sm text-emerald-400">Premium Bonus ({result.rothConversion.premiumBonusPct}%)</span>
                        <span className="font-bold text-emerald-400">+{fmt(result.rothConversion.premiumBonus)}</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <ArrowRight className="w-4 h-4 text-emerald-400 rotate-90" />
                      </div>
                      <div className="flex items-center justify-between bg-emerald-500/20 border border-emerald-500/30 rounded-lg p-3">
                        <span className="text-sm font-bold text-emerald-400">Enhanced Tax-Free Value</span>
                        <span className="text-xl font-bold text-emerald-400">{fmt(result.rothConversion.enhancedValue)}</span>
                      </div>
                    </div>

                    {/* Net Result */}
                    <div className={`rounded-lg p-4 text-center ${result.rothConversion.netGainPct >= 0 ? "bg-emerald-500/10 border border-emerald-500/30" : "bg-amber-500/10 border border-amber-500/30"}`}>
                      <p className="text-xs text-muted-foreground">Net Result vs. Original Surrender Value</p>
                      <p className={`text-2xl font-bold ${result.rothConversion.netGainPct >= 0 ? "text-emerald-400" : "text-amber-400"}`}>
                        {result.rothConversion.netGainPct >= 0 ? "+" : ""}{result.rothConversion.netGainPct}%
                        ({result.rothConversion.netGainOverOriginal >= 0 ? "+" : ""}{fmt(result.rothConversion.netGainOverOriginal)})
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Plus ALL future gains are now 100% tax-free forever
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Roth vs Traditional Projection Comparison */}
                {result.rothProjections && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Tax-Free (Roth) vs Tax-Deferred Growth Projection</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto max-h-80 overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead className="sticky top-0 bg-background">
                            <tr className="border-b border-border/50">
                              <th className="text-left py-2 px-2">Year</th>
                              <th className="text-right py-2 px-2 text-emerald-400">Roth (Tax-Free)</th>
                              <th className="text-right py-2 px-2 text-red-400">Traditional (Taxable)</th>
                              <th className="text-right py-2 px-2">Tax-Free Advantage</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(result.rothProjections ?? []).filter((_: any, i: number) => i < 5 || i % 5 === 4 || i === (result.rothProjections ?? []).length - 1).map((yr: any, i: number) => {
                              const tradYr = result.projections[yr.year - 1];
                              const tradAfterTax = tradYr ? tradYr.endValue * (1 - form.currentTaxBracket / 100) + form.initialPremium * (form.currentTaxBracket / 100) : 0;
                              const advantage = yr.endValue - tradAfterTax;
                              return (
                                <tr key={i} className="border-b border-border/20">
                                  <td className="py-1.5 px-2">{yr.year}</td>
                                  <td className="text-right py-1.5 px-2 font-medium text-emerald-400">{fmt(yr.endValue)}</td>
                                  <td className="text-right py-1.5 px-2 text-red-400">{fmt(Math.round(tradAfterTax))}</td>
                                  <td className="text-right py-1.5 px-2 font-medium text-blue-400">+{fmt(Math.round(advantage))}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <p className="text-xs text-muted-foreground mt-3 italic">
                        Traditional column shows after-tax value assuming {form.currentTaxBracket}% tax rate on gains at withdrawal.
                        Roth column is 100% tax-free — every dollar is yours to keep.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Tax-Free Advantage Explanation */}
                <Card className="border-emerald-500/20 bg-emerald-500/5">
                  <CardContent className="pt-4 space-y-3">
                    <p className="text-sm font-bold text-emerald-400">Why Tax-Free Matters More Than You Think</p>
                    <p className="text-sm text-muted-foreground">
                      With traditional tax-deferred annuities, every dollar of growth is subject to ordinary income tax
                      when you withdraw it. At a 28% federal rate (which could easily be 35-40% in the future),
                      you're giving back nearly a third of your gains to the government.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      By Roth converting first and then placing funds into the F&G Power Accumulator with its
                      managed ETF strategies and precious metals exposure, <strong>all the large gains earned on this
                      annuity are tax-free — not tax-deferred like other traditional annuities</strong>. This is the
                      difference between keeping 100% of a 22% annual return versus keeping only 72% of it.
                    </p>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="bg-emerald-500/10 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">Tax-Free (Roth)</p>
                        <p className="text-lg font-bold text-emerald-400">Keep 100%</p>
                        <p className="text-xs text-emerald-400">of every dollar earned</p>
                      </div>
                      <div className="bg-red-500/10 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">Tax-Deferred (Traditional)</p>
                        <p className="text-lg font-bold text-red-400">Keep ~72%</p>
                        <p className="text-xs text-red-400">at current 28% tax rate</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <NAICDisclaimer variant="footer" showsProjections showsCashValues />
          <PageInsights pageId="growth-annuities" />
    
        <ComplianceFooter pageName="GrowthAnnuities" showsAnnuity showsTax showsEstate showsProjections showsHistoricalData />
      </AppShell>
  );
}
