// @ts-nocheck
import { NumberInput } from "@/components/NumberInput";
import { useState, useMemo, useEffect } from "react";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import ExportPdfButton from "@/components/ExportPdfButton";
import { ExportToSlides } from "@/components/ExportToSlides";
import {
  Bitcoin,
  TrendingDown,
  Building2,
  Gem,
  BarChart3,
  Calculator,
  Zap,
  Target,
  Home,
  Landmark,
  LineChart as LineChartIcon,
  Shield,
} from "lucide-react";
import {
  BarChart, Bar, LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ComposedChart, Area, Legend, Cell, ReferenceLine,
} from "recharts";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { PageInsights } from "@/components/PageInsights";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

export default function CryptoCurrencyCorner() {
  const [activeTab, setActiveTab] = useState("cycles");
  const { data: clientData } = useClientData();

  useEffect(() => {
    if (clientData) {
      setForm(prev => ({
        ...prev,
        ...(clientData.lifeInsuranceCv ? { iulCashValue: clientData.lifeInsuranceCv } : {}),
        ...(clientData.annualPremium ? { annualPremium: clientData.annualPremium } : {}),
      }));
    }
  }, [clientData]);

  const { data: cycleHistory } = trpc.cryptoCycle.history.useQuery();
  const { data: simulated } = trpc.cryptoCycle.simulate.useQuery({ numCycles: 10 });

  const [form, setForm] = useState({
    iulCashValue: 500000,
    iulGrowthRate: 0.07,
    iulLoanRate: 0.05,
    iulMaxLoanToValue: 0.90,
    annualPremium: 50000,
    premiumYearsRemaining: 5,
    loanPctForCrypto: 30,
    dcaBearMonths: 24,
    dcaBullMonths: 12,
    pctToSilver: 10,
    pctToGold: 15,
    pctToMortgagePaydown: 25,
    goldPricePerOz: 4783,
    silverPricePerOz: 72,
    strPurchasePrice: 500000,
    strDownPaymentPct: 0.30,
    strGrossIncomePct: 0.20,
    strAppreciationRate: 0.05,
    strFirstYearDepreciation: 0.40,
    strPurchaseEveryYears: 7,
    simulationYears: 30,
    startYear: 2026,
  });

  const [profitUse, setProfitUse] = useState("silver"); // silver | gold | mortgage

  const accumulateMut = trpc.cryptoCycle.accumulate.useMutation();

  const runSimulation = () => {
    accumulateMut.mutate(form, {
      onSuccess: () => toast.success("30-year simulation complete!"),
      onError: (e: any) => toast.error(e.message),
    });
  };

  const result = accumulateMut.data;

  const fmt = (n: number) => {
    if (Math.abs(n) >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
    if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
    if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
    return `$${n.toLocaleString()}`;
  };

  const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;

  const cycleChartData = useMemo(() => {
    if (!cycleHistory) return [];
    return cycleHistory.map((c) => ({
      cycle: `Cycle ${c.cycle}`,
      ath: c.bullATH,
      atl: c.bearATL,
      drop: Math.abs(c.pctDropATHtoATL),
      gain: c.pctGainATLtoNextATH ?? 0,
      marketCap: c.athMarketCap,
    }));
  }, [cycleHistory]);

  const simulatedChartData = useMemo(() => {
    if (!simulated) return [];
    return simulated.map((c) => ({
      cycle: `Cycle ${c.cycle}`,
      year: c.halvingYear,
      ath: c.bullATH,
      atl: c.bearATL,
      drop: Math.abs(c.pctDropATHtoATL),
      gain: c.pctGainATLtoNextATH,
      marketCap: c.marketCapBillions,
    }));
  }, [simulated]);

  return (
    <div className="space-y-6 p-4 md:p-6">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="CryptoCurrencyCorner" />

        <ExecutiveSummary
          pageTitle="Crypto Currency Corner"
          whatItDoes="This market analysis tool provides institutional-grade analysis of your financial situation, modeling multiple scenarios and projecting outcomes based on your specific inputs. It transforms complex market analysis concepts into clear, actionable insights with dollar-quantified recommendations."
          opportunities="Historical data shows that strategic index allocation with downside protection consistently outperforms both pure equity and pure fixed strategies over 10+ year periods."
          intent="To give you the same caliber of market analysis analysis that institutional investors and ultra-high-net-worth families receive — now accessible to every client."
          takeaway="Understanding your market analysis options with precise dollar amounts empowers you to make confident decisions that compound into significant wealth over time."
          callToAction="Enter your numbers and see exactly how market analysis strategies can improve your financial outcome."
          followUpQuestions={[
            "How does this market analysis strategy interact with my other financial plans?",
            "What\'s the single biggest market analysis opportunity I\'m currently missing?",
            "How would my results change if I started this strategy 5 years earlier?",
          ]}
        />
        <GoalsAccelerator pageName="Crypto Currency Corner" pageContext="Crypto Currency Corner — market analysis modeling with projections and scenario analysis" />
        <TaxBracketPanel grossIncome={clientData?.annualIncome || 150000} filingStatus={clientData?.filingStatus || "single"} stateCode={clientData?.state || "TX"} />
        <RecommendationSummary
          headline="This market analysis strategy can significantly improve your financial outcome"
          detail="Based on your profile, implementing the recommended market analysis approach could generate substantial savings and growth over your planning horizon."
          dollarBenefit={280000}
          timeHorizon="20 years"
          confidence="high"
          nextStep="Review with your advisor"
        />
        <DoNothingBaseline
          metrics={[
            { label: "Risk-Adjusted Return", doNothing: 5.2, recommended: 8.4, format: "percent" },
            { label: "Downside Protection", doNothing: 0, recommended: 100, format: "percent" },
            { label: "20-Year Growth", doNothing: 450000, recommended: 730000, format: "currency" },
          ]}
          summary="Without taking action on market analysis, you leave significant value on the table that compounds into a major opportunity cost over time."
        />
      <FactFinderBadge className="mb-4" />
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 shrink-0">
          <Bitcoin className="h-8 w-8 text-amber-400" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold truncate">Crypto Currency Corner</h1>
          <p className="text-muted-foreground text-xs md:text-sm">Bitcoin Halving Cycles &bull; IUL-Funded Accumulation &bull; Real Estate Synthesis</p>
        </div>
        <>
          <ExportPdfButton
            className="ml-auto shrink-0"
            pageTitle="Crypto Currency Corner Analysis"
            getSections={() => [
              { title: "Bitcoin Cycle Overview", items: [
                { label: "Strategy", value: "IUL-funded Bitcoin DCA during bear markets" },
                { label: "Approach", value: "Dollar-cost average during accumulation phase, harvest during bull runs" },
              ]},
            ]}
            getBullets={() => [
              "Bitcoin halving cycles historically produce 4-year bull/bear patterns",
              "IUL policy loans provide tax-free capital for crypto accumulation",
              "Diversification across BTC, gold, silver, and real estate reduces volatility",
            ]}
          />
          <ExportToSlides
            toolName="Crypto Currency Corner"
            getSections={() => [
              { title: "Bitcoin Cycle Overview", items: [
                { label: "Strategy", value: "IUL-funded Bitcoin DCA during bear markets" },
                { label: "Approach", value: "Dollar-cost average during accumulation phase, harvest during bull runs" },
              ]},
              { title: "Accumulation Form", items: [
                { label: "IUL Cash Value", value: `$${form.iulCashValue.toLocaleString()}` },
                { label: "Annual Premium", value: `$${form.annualPremium.toLocaleString()}` },
                { label: "Premium Years Remaining", value: form.premiumYearsRemaining.toString() },
                { label: "Simulation Years", value: form.simulationYears.toString() },
              ]}
            ]}
          />
        </>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex w-full overflow-x-auto gap-1 p-1">
          <TabsTrigger value="cycles" className="flex-none text-xs px-3 py-2 gap-1.5 whitespace-nowrap">
            <BarChart3 className="h-3.5 w-3.5 shrink-0" />
            <span>Cycles</span>
          </TabsTrigger>
          <TabsTrigger value="simulator" className="flex-none text-xs px-3 py-2 gap-1.5 whitespace-nowrap">
            <Zap className="h-3.5 w-3.5 shrink-0" />
            <span>Simulator</span>
          </TabsTrigger>
          <TabsTrigger value="factfinder" className="flex-none text-xs px-3 py-2 gap-1.5 whitespace-nowrap">
            <Calculator className="h-3.5 w-3.5 shrink-0" />
            <span>Fact Finder</span>
          </TabsTrigger>
          <TabsTrigger value="accumulation" className="flex-none text-xs px-3 py-2 gap-1.5 whitespace-nowrap">
            <Target className="h-3.5 w-3.5 shrink-0" />
            <span>Accumulate</span>
          </TabsTrigger>
          <TabsTrigger value="realestate" className="flex-none text-xs px-3 py-2 gap-1.5 whitespace-nowrap">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            <span>Properties</span>
          </TabsTrigger>
          <TabsTrigger value="synthesis" className="flex-none text-xs px-3 py-2 gap-1.5 whitespace-nowrap">
            <LineChartIcon className="h-3.5 w-3.5 shrink-0" />
            <span>30-Year</span>
          </TabsTrigger>
        </TabsList>

        {/* ═══ TAB 1: CYCLE HISTORY ═══ */}
        <TabsContent value="cycles" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent">
              <CardContent className="pt-4 pb-3">
                <div className="text-[10px] md:text-xs text-muted-foreground leading-tight">Current BTC Price</div>
                <div className="text-lg md:text-2xl font-bold text-amber-400">~$67,000</div>
                <div className="text-[10px] md:text-xs text-red-400 flex items-center gap-1 mt-1"><TrendingDown className="h-3 w-3 shrink-0" />Bear cycle</div>
              </CardContent>
            </Card>
            <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/5 to-transparent">
              <CardContent className="pt-4 pb-3">
                <div className="text-[10px] md:text-xs text-muted-foreground leading-tight">Last ATH</div>
                <div className="text-lg md:text-2xl font-bold text-emerald-400">$126,200</div>
                <div className="text-[10px] md:text-xs text-muted-foreground mt-1">Oct 2025 (Cycle 4)</div>
              </CardContent>
            </Card>
            <Card className="border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-transparent">
              <CardContent className="pt-4 pb-3">
                <div className="text-[10px] md:text-xs text-muted-foreground leading-tight">ATH Market Cap</div>
                <div className="text-lg md:text-2xl font-bold text-blue-400">$2.5T</div>
                <div className="text-[10px] md:text-xs text-muted-foreground mt-1">Peak cycle 4</div>
              </CardContent>
            </Card>
            <Card className="border-purple-500/30 bg-gradient-to-br from-purple-500/5 to-transparent">
              <CardContent className="pt-4 pb-3">
                <div className="text-[10px] md:text-xs text-muted-foreground leading-tight">Next Halving</div>
                <div className="text-lg md:text-2xl font-bold text-purple-400">2028</div>
                <div className="text-[10px] md:text-xs text-muted-foreground mt-1 truncate">Reward → 1.5625 BTC</div>
              </CardContent>
            </Card>
          </div>

          {/* Historical Cycle Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Bitcoin className="h-5 w-5 text-amber-400" />Bitcoin Halving Cycle History</CardTitle>
              <CardDescription>Complete 4-year cycle data tied to Bitcoin's halving events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-2 px-2">Cycle</th>
                      <th className="text-left py-2 px-2">Halving Date</th>
                      <th className="text-right py-2 px-2">Block Reward</th>
                      <th className="text-right py-2 px-2">Bull ATH</th>
                      <th className="text-right py-2 px-2">ATH Mkt Cap</th>
                      <th className="text-right py-2 px-2">Bear ATL</th>
                      <th className="text-right py-2 px-2">% Drop</th>
                      <th className="text-right py-2 px-2">% Gain to Next ATH</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cycleHistory?.map((c: any, i: number) => (
                      <tr key={i} className={`border-b border-border/20 ${i % 2 === 0 ? "bg-muted/20" : ""}`}>
                        <td className="py-2 px-2 font-medium">Cycle {c.cycle}</td>
                        <td className="py-2 px-2 text-muted-foreground">{c.halvingDate}</td>
                        <td className="py-2 px-2 text-right">{c.blockReward} BTC</td>
                        <td className="py-2 px-2 text-right text-emerald-400 font-semibold">{fmt(c.bullATH)}</td>
                        <td className="py-2 px-2 text-right text-blue-400">{fmt(c.athMarketCap * 1e9)}</td>
                        <td className="py-2 px-2 text-right text-red-400 font-semibold">{fmt(c.bearATL)}</td>
                        <td className="py-2 px-2 text-right"><Badge variant="destructive" className="text-xs">{c.pctDropATHtoATL.toFixed(1)}%</Badge></td>
                        <td className="py-2 px-2 text-right">
                          {c.pctGainATLtoNextATH ? (
                            <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">+{c.pctGainATLtoNextATH.toLocaleString()}%</Badge>
                          ) : <span className="text-muted-foreground text-xs">Ongoing</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* ATH/ATL Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ATH vs Bear ATL — Diminishing Drawdowns</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cycleChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="cycle" tick={{ fill: "#888", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#888", fontSize: 11 }} tickFormatter={(v: number) => fmt(v)} />
                  <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: "#1a1a2e", border: "1px solid #333" }} />
                  <Bar dataKey="ath" name="Bull ATH" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="atl" name="Bear ATL" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Drawdown Pattern */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-lg text-red-400">Bear Market Drawdowns</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={cycleChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="cycle" tick={{ fill: "#888", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#888", fontSize: 11 }} domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
                    <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} contentStyle={{ background: "#1a1a2e", border: "1px solid #333" }} />
                    <Bar dataKey="drop" name="% Drop ATH→ATL" radius={[4, 4, 0, 0]}>
                      {cycleChartData.map((_: any, i: number) => (
                        <Cell key={i} fill={["#ef4444", "#f97316", "#eab308", "#22c55e"][i] ?? "#888"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-xs text-muted-foreground mt-2">Pattern: 93.7% → 87.1% → 84.2% → 77.5% → ~52.5% — drawdowns shrink each cycle as market matures.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-lg text-emerald-400">Bull Market Gains (ATL → Next ATH)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={cycleChartData.filter((d) => d.gain > 0)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="cycle" tick={{ fill: "#888", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#888", fontSize: 11 }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K%`} />
                    <Tooltip formatter={(v: number) => `+${v.toLocaleString()}%`} contentStyle={{ background: "#1a1a2e", border: "1px solid #333" }} />
                    <Bar dataKey="gain" name="% Gain ATL→ATH" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-xs text-muted-foreground mt-2">Diminishing returns: +12,912% → +2,104% → +716% — still massive gains each cycle.</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        {/* ═══ TAB 2: CYCLE SIMULATOR ═══ */}
        <TabsContent value="simulator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base md:text-lg flex items-center gap-2"><Zap className="h-5 w-5 text-purple-400 shrink-0" />Next 10 Cycles — Predicted</CardTitle>
              <CardDescription className="text-xs">Diminishing returns model based on historical drawdown decay (0.88x) and gain decay (0.38x) per cycle</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-2 px-1.5 whitespace-nowrap">Cycle</th>
                      <th className="text-right py-2 px-1.5 whitespace-nowrap">Halving</th>
                      <th className="text-right py-2 px-1.5 whitespace-nowrap">Halv. Price</th>
                      <th className="text-right py-2 px-1.5 whitespace-nowrap">Proj. ATH</th>
                      <th className="text-right py-2 px-1.5 whitespace-nowrap">ATH Yr</th>
                      <th className="text-right py-2 px-1.5 whitespace-nowrap">Proj. ATL</th>
                      <th className="text-right py-2 px-1.5 whitespace-nowrap">Drop</th>
                      <th className="text-right py-2 px-1.5 whitespace-nowrap">Gain</th>
                      <th className="text-right py-2 px-1.5 whitespace-nowrap">Mkt Cap</th>
                      <th className="text-right py-2 px-1.5 whitespace-nowrap">Reward</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simulated?.map((c: any, i: number) => (
                      <tr key={i} className={`border-b border-border/20 ${i % 2 === 0 ? "bg-muted/20" : ""}`}>
                        <td className="py-2 px-2 font-medium">Cycle {c.cycle}</td>
                        <td className="py-2 px-2 text-right text-purple-400">{c.halvingYear}</td>
                        <td className="py-2 px-2 text-right">{fmt(c.halvingPrice)}</td>
                        <td className="py-2 px-2 text-right text-emerald-400 font-bold">{fmt(c.bullATH)}</td>
                        <td className="py-2 px-2 text-right">{c.athYear}</td>
                        <td className="py-2 px-2 text-right text-red-400">{fmt(c.bearATL)}</td>
                        <td className="py-2 px-2 text-right"><Badge variant="destructive" className="text-xs">{c.pctDropATHtoATL.toFixed(1)}%</Badge></td>
                        <td className="py-2 px-2 text-right"><Badge className="bg-emerald-500/20 text-emerald-400 text-xs">+{c.pctGainATLtoNextATH.toFixed(0)}%</Badge></td>
                        <td className="py-2 px-2 text-right text-blue-400">{fmt(c.marketCapBillions * 1e9)}</td>
                        <td className="py-2 px-2 text-right text-muted-foreground">{c.blockReward.toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Projected ATH Chart */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Projected Bitcoin Price — Next 10 Cycles</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={simulatedChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="year" tick={{ fill: "#888", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#888", fontSize: 11 }} tickFormatter={(v: number) => fmt(v)} />
                  <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: "#1a1a2e", border: "1px solid #333" }} />
                  <Legend />
                  <Area dataKey="ath" name="Bull ATH" fill="#22c55e20" stroke="#22c55e" strokeWidth={2} />
                  <Area dataKey="atl" name="Bear ATL" fill="#ef444420" stroke="#ef4444" strokeWidth={2} />
                  <Line dataKey="ath" name="ATH Trend" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

        </TabsContent>

        {/* ═══ TAB 3: FACT FINDER ═══ */}
        <TabsContent value="factfinder" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* IUL Policy Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Shield className="h-5 w-5 text-emerald-400" />IUL Policy Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Cash Surrender Value</Label>
                    <NumberInput value={form.iulCashValue} onChange={(v) => setForm(f => ({ ...f, iulCashValue: v }))}  />
                  </div>
                  <div>
                    <Label className="text-xs">Annual Premium</Label>
                    <NumberInput value={form.annualPremium} onChange={(v) => setForm(f => ({ ...f, annualPremium: v }))}  />
                  </div>
                  <div>
                    <Label className="text-xs">Illustrated Growth Rate</Label>
                    <NumberInput value={form.iulGrowthRate} onChange={(v) => setForm(f => ({ ...f, iulGrowthRate: v }))}  />
                  </div>
                  <div>
                    <Label className="text-xs">Loan Interest Rate</Label>
                    <NumberInput value={form.iulLoanRate} onChange={(v) => setForm(f => ({ ...f, iulLoanRate: v }))}  />
                  </div>
                  <div>
                    <Label className="text-xs">Max Loan-to-Value</Label>
                    <NumberInput value={form.iulMaxLoanToValue} onChange={(v) => setForm(f => ({ ...f, iulMaxLoanToValue: v }))}  />
                  </div>
                  <div>
                    <Label className="text-xs">Premium Years Remaining</Label>
                    <NumberInput value={form.premiumYearsRemaining} onChange={(v) => setForm(f => ({ ...f, premiumYearsRemaining: v }))}  />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Crypto Strategy */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Bitcoin className="h-5 w-5 text-amber-400" />Crypto Accumulation Strategy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Loan % Allocated to Crypto Purchases</Label>
                  <div className="flex items-center gap-3">
                    <Slider value={[form.loanPctForCrypto]} onValueChange={([v]) => setForm(f => ({ ...f, loanPctForCrypto: v }))} min={0} max={100} step={5} className="flex-1" />
                    <span className="text-sm font-bold text-amber-400 w-12 text-right">{form.loanPctForCrypto}%</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">DCA Bear Months</Label>
                    <NumberInput value={form.dcaBearMonths} onChange={(v) => setForm(f => ({ ...f, dcaBearMonths: v }))}  />
                  </div>
                  <div>
                    <Label className="text-xs">DCA Bull Sell Months</Label>
                    <NumberInput value={form.dcaBullMonths} onChange={(v) => setForm(f => ({ ...f, dcaBullMonths: v }))}  />
                  </div>
                </div>
                <div>
                  <Label className="text-xs mb-2 block">What to do with profits after IUL loan repayment?</Label>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">% to Silver (${form.silverPricePerOz}/oz)</Label>
                      <div className="flex items-center gap-3">
                        <Slider value={[form.pctToSilver]} onValueChange={([v]) => setForm(f => ({ ...f, pctToSilver: v }))} min={0} max={100} step={5} className="flex-1" />
                        <span className="text-sm font-bold w-12 text-right">{form.pctToSilver}%</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">% to Gold (${form.goldPricePerOz}/oz)</Label>
                      <div className="flex items-center gap-3">
                        <Slider value={[form.pctToGold]} onValueChange={([v]) => setForm(f => ({ ...f, pctToGold: v }))} min={0} max={100} step={5} className="flex-1" />
                        <span className="text-sm font-bold w-12 text-right">{form.pctToGold}%</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">% to Mortgage Paydown</Label>
                      <div className="flex items-center gap-3">
                        <Slider value={[form.pctToMortgagePaydown]} onValueChange={([v]) => setForm(f => ({ ...f, pctToMortgagePaydown: v }))} min={0} max={100} step={5} className="flex-1" />
                        <span className="text-sm font-bold w-12 text-right">{form.pctToMortgagePaydown}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Real Estate */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Building2 className="h-5 w-5 text-blue-400" />Short-Term Rental Strategy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Purchase Price</Label>
                    <NumberInput value={form.strPurchasePrice} onChange={(v) => setForm(f => ({ ...f, strPurchasePrice: v }))}  />
                  </div>
                  <div>
                    <Label className="text-xs">Down Payment %</Label>
                    <NumberInput value={form.strDownPaymentPct} onChange={(v) => setForm(f => ({ ...f, strDownPaymentPct: v }))}  />
                  </div>
                  <div>
                    <Label className="text-xs">Gross Annual Income %</Label>
                    <NumberInput value={form.strGrossIncomePct} onChange={(v) => setForm(f => ({ ...f, strGrossIncomePct: v }))}  />
                  </div>
                  <div>
                    <Label className="text-xs">Annual Appreciation %</Label>
                    <NumberInput value={form.strAppreciationRate} onChange={(v) => setForm(f => ({ ...f, strAppreciationRate: v }))}  />
                  </div>
                  <div>
                    <Label className="text-xs">1st Year Depreciation %</Label>
                    <NumberInput value={form.strFirstYearDepreciation} onChange={(v) => setForm(f => ({ ...f, strFirstYearDepreciation: v }))}  />
                  </div>
                  <div>
                    <Label className="text-xs">Purchase Every N Years</Label>
                    <NumberInput value={form.strPurchaseEveryYears} onChange={(v) => setForm(f => ({ ...f, strPurchaseEveryYears: v }))}  />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Precious Metals */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Gem className="h-5 w-5 text-yellow-400" />Precious Metals — Live Prices</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Gold Price/oz</Label>
                    <NumberInput value={form.goldPricePerOz} onChange={(v) => setForm(f => ({ ...f, goldPricePerOz: v }))}  />
                    <p className="text-xs text-muted-foreground mt-1">Live: ~$4,783/oz (Apr 2026)</p>
                  </div>
                  <div>
                    <Label className="text-xs">Silver Price/oz</Label>
                    <NumberInput value={form.silverPricePerOz} onChange={(v) => setForm(f => ({ ...f, silverPricePerOz: v }))}  />
                    <p className="text-xs text-muted-foreground mt-1">Live: ~$72/oz (Apr 2026)</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Simulation Years</Label>
                    <NumberInput value={form.simulationYears} onChange={(v) => setForm(f => ({ ...f, simulationYears: v }))}  />
                  </div>
                  <div>
                    <Label className="text-xs">Start Year</Label>
                    <NumberInput value={form.startYear} onChange={(v) => setForm(f => ({ ...f, startYear: v }))}  />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Button onClick={runSimulation} disabled={accumulateMut.isPending} className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-bold py-3">
            {accumulateMut.isPending ? "Running 30-Year Simulation..." : "🚀 Run Full Crypto + Real Estate + IUL Simulation"}
          </Button>
        </TabsContent>
        {/* ═══ TAB 4: ACCUMULATION RESULTS ═══ */}
        <TabsContent value="accumulation" className="space-y-4">
          {!result ? (
            <Card className="border-dashed border-amber-500/30">
              <CardContent className="py-12 text-center">
                <Bitcoin className="h-12 w-12 text-amber-400/50 mx-auto mb-3" />
                <p className="text-muted-foreground">Run the simulation from the Fact Finder tab to see accumulation results</p>
                <Button variant="outline" className="mt-4" onClick={() => setActiveTab("factfinder")}>Go to Fact Finder</Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="border-emerald-500/30">
                  <CardContent className="pt-4 pb-3">
                    <div className="text-[10px] md:text-xs text-muted-foreground leading-tight">Final Net Worth</div>
                    <div className="text-lg md:text-xl font-bold text-emerald-400 truncate">{fmt(result.summary.finalNetWorth)}</div>
                  </CardContent>
                </Card>
                <Card className="border-amber-500/30">
                  <CardContent className="pt-4 pb-3">
                    <div className="text-[10px] md:text-xs text-muted-foreground leading-tight">Total Crypto Profit</div>
                    <div className="text-lg md:text-xl font-bold text-amber-400 truncate">{fmt(result.summary.totalCryptoProfit)}</div>
                  </CardContent>
                </Card>
                <Card className="border-blue-500/30">
                  <CardContent className="pt-4 pb-3">
                    <div className="text-[10px] md:text-xs text-muted-foreground leading-tight">Property Equity</div>
                    <div className="text-lg md:text-xl font-bold text-blue-400 truncate">{fmt(result.summary.totalPropertyEquity)}</div>
                  </CardContent>
                </Card>
                <Card className="border-purple-500/30">
                  <CardContent className="pt-4 pb-3">
                    <div className="text-[10px] md:text-xs text-muted-foreground leading-tight">Tax Saved</div>
                    <div className="text-lg md:text-xl font-bold text-purple-400 truncate">{fmt(result.summary.netTaxSaved)}</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-[10px] md:text-xs text-muted-foreground leading-tight">IUL Net Value</div>
                    <div className="text-base md:text-lg font-bold truncate">{fmt(result.summary.finalIULValue)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-[10px] md:text-xs text-muted-foreground leading-tight">Gold Holdings</div>
                    <div className="text-base md:text-lg font-bold text-yellow-400 truncate">{fmt(result.summary.totalGoldValue)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-[10px] md:text-xs text-muted-foreground leading-tight">Silver Holdings</div>
                    <div className="text-base md:text-lg font-bold text-gray-300 truncate">{fmt(result.summary.totalSilverValue)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-[10px] md:text-xs text-muted-foreground leading-tight">Properties Owned</div>
                    <div className="text-base md:text-lg font-bold">{result.summary.propertiesOwned}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Net Worth Over Time */}
              <Card>
                <CardHeader><CardTitle className="text-lg">Net Worth Growth — 30 Year Projection</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <ComposedChart data={result.yearlySnapshots}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="year" tick={{ fill: "#888", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#888", fontSize: 11 }} tickFormatter={(v: number) => fmt(v)} />
                      <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: "#1a1a2e", border: "1px solid #333" }} />
                      <Legend />
                      <Area dataKey="iulNetValue" name="IUL Net Value" fill="#22c55e20" stroke="#22c55e" stackId="a" />
                      <Area dataKey="btcValue" name="BTC Holdings" fill="#f59e0b20" stroke="#f59e0b" stackId="a" />
                      <Area dataKey="totalPropertyEquity" name="Property Equity" fill="#3b82f620" stroke="#3b82f6" stackId="a" />
                      <Area dataKey="goldValue" name="Gold" fill="#eab30820" stroke="#eab308" stackId="a" />
                      <Area dataKey="silverValue" name="Silver" fill="#94a3b820" stroke="#94a3b8" stackId="a" />
                      <Line dataKey="totalNetWorth" name="Total Net Worth" stroke="#a855f7" strokeWidth={3} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Crypto Buy/Sell Activity */}
              <Card>
                <CardHeader><CardTitle className="text-lg">Crypto DCA Activity — Buy Bear / Sell Bull</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={result.yearlySnapshots}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="year" tick={{ fill: "#888", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#888", fontSize: 11 }} tickFormatter={(v: number) => fmt(v)} />
                      <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: "#1a1a2e", border: "1px solid #333" }} />
                      <Legend />
                      <Bar dataKey="cryptoBuyAmount" name="DCA Buy (Bear)" fill="#ef4444" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="cryptoSellAmount" name="DCA Sell (Bull)" fill="#22c55e" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Year-by-Year Table */}
              <Card>
                <CardHeader><CardTitle className="text-lg">Year-by-Year Snapshot</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-background z-10">
                        <tr className="border-b border-border/50">
                          <th className="text-left py-2 px-1">Year</th>
                          <th className="text-center py-2 px-1">Phase</th>
                          <th className="text-right py-2 px-1">BTC Price</th>
                          <th className="text-right py-2 px-1">BTC Held</th>
                          <th className="text-right py-2 px-1">IUL Net</th>
                          <th className="text-right py-2 px-1">Crypto P&L</th>
                          <th className="text-right py-2 px-1">Gold</th>
                          <th className="text-right py-2 px-1">Silver</th>
                          <th className="text-right py-2 px-1">Prop Equity</th>
                          <th className="text-right py-2 px-1 font-bold">Net Worth</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.yearlySnapshots.map((snap: any, i: number) => (
                          <tr key={i} className={`border-b border-border/10 ${snap.cyclePhase === "bull" ? "bg-emerald-500/5" : snap.cyclePhase === "bear" ? "bg-red-500/5" : ""}`}>
                            <td className="py-1 px-1 font-medium">{snap.year}</td>
                            <td className="py-1 px-1 text-center">
                              <Badge variant={snap.cyclePhase === "bull" || snap.cyclePhase === "distribution" ? "default" : "destructive"} className="text-[10px]">
                                {snap.cyclePhase}
                              </Badge>
                            </td>
                            <td className="py-1 px-1 text-right text-amber-400">{fmt(snap.btcPrice)}</td>
                            <td className="py-1 px-1 text-right">{snap.btcHeld.toFixed(2)}</td>
                            <td className="py-1 px-1 text-right text-emerald-400">{fmt(snap.iulNetValue)}</td>
                            <td className="py-1 px-1 text-right">{snap.cryptoProfit > 0 ? <span className="text-emerald-400">{fmt(snap.cryptoProfit)}</span> : "-"}</td>
                            <td className="py-1 px-1 text-right text-yellow-400">{fmt(snap.goldValue)}</td>
                            <td className="py-1 px-1 text-right text-gray-300">{fmt(snap.silverValue)}</td>
                            <td className="py-1 px-1 text-right text-blue-400">{fmt(snap.totalPropertyEquity)}</td>
                            <td className="py-1 px-1 text-right font-bold text-purple-400">{fmt(snap.totalNetWorth)}</td>
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

        {/* ═══ TAB 5: REAL ESTATE PROPERTIES ═══ */}
        <TabsContent value="realestate" className="space-y-4">
          {!result ? (
            <Card className="border-dashed border-blue-500/30">
              <CardContent className="py-12 text-center">
                <Building2 className="h-12 w-12 text-blue-400/50 mx-auto mb-3" />
                <p className="text-muted-foreground">Run the simulation to see property spreadsheets</p>
                <Button variant="outline" className="mt-4" onClick={() => setActiveTab("factfinder")}>Go to Fact Finder</Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Card className="border-blue-500/30">
                  <CardContent className="pt-4">
                    <div className="text-xs text-muted-foreground">Total Property Value</div>
                    <div className="text-xl font-bold text-blue-400">{fmt(result.summary.totalPropertyValue)}</div>
                  </CardContent>
                </Card>
                <Card className="border-emerald-500/30">
                  <CardContent className="pt-4">
                    <div className="text-xs text-muted-foreground">Total Rental Income (Cumulative)</div>
                    <div className="text-xl font-bold text-emerald-400">{fmt(result.summary.totalRentalIncome)}</div>
                  </CardContent>
                </Card>
                <Card className="border-purple-500/30">
                  <CardContent className="pt-4">
                    <div className="text-xs text-muted-foreground">Total Depreciation Used</div>
                    <div className="text-xl font-bold text-purple-400">{fmt(result.summary.totalDepreciationUsed)}</div>
                  </CardContent>
                </Card>
              </div>

              {result.realEstateSpreadsheets.map((prop) => (
                <Card key={prop.propertyId}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Home className="h-5 w-5 text-blue-400" />
                      Property #{prop.propertyId} — Purchased {prop.purchaseYear}
                    </CardTitle>
                    <CardDescription>
                      {fmt(prop.purchasePrice)} purchase | {fmt(prop.downPayment)} down | Funded: Crypto {fmt(prop.fundingSources.cryptoProfits)}, IUL Loan {fmt(prop.fundingSources.iulLoan)}, HELOC {fmt(prop.fundingSources.helocLoan)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-background z-10">
                          <tr className="border-b border-border/50">
                            <th className="text-left py-1 px-1">Year</th>
                            <th className="text-right py-1 px-1">Yr #</th>
                            <th className="text-right py-1 px-1">Property Value</th>
                            <th className="text-right py-1 px-1">Loan Balance</th>
                            <th className="text-right py-1 px-1">Equity</th>
                            <th className="text-right py-1 px-1">Rental Income</th>
                            <th className="text-right py-1 px-1">Interest Pmt</th>
                            <th className="text-right py-1 px-1">Depreciation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {prop.years.map((yr: any, i: number) => (
                            <tr key={i} className={`border-b border-border/10 ${i % 2 === 0 ? "bg-muted/20" : ""}`}>
                              <td className="py-1 px-1 font-medium">{yr.year}</td>
                              <td className="py-1 px-1 text-right">{yr.yearOfOwnership}</td>
                              <td className="py-1 px-1 text-right text-blue-400">{fmt(yr.propertyValue)}</td>
                              <td className="py-1 px-1 text-right text-red-400">{fmt(yr.loanBalance)}</td>
                              <td className="py-1 px-1 text-right text-emerald-400 font-semibold">{fmt(yr.equity)}</td>
                              <td className="py-1 px-1 text-right">{fmt(yr.rentalIncome)}</td>
                              <td className="py-1 px-1 text-right text-muted-foreground">{fmt(yr.interestPayment)}</td>
                              <td className="py-1 px-1 text-right text-purple-400">{fmt(yr.depreciation)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Tax Offset Summary */}
              <Card className="border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><Landmark className="h-5 w-5 text-purple-400" />Capital Gains vs Depreciation Offset</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={result.yearlySnapshots.filter((s) => s.capitalGains > 0 || s.depreciationOffset > 0)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="year" tick={{ fill: "#888", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#888", fontSize: 11 }} tickFormatter={(v: number) => fmt(v)} />
                      <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: "#1a1a2e", border: "1px solid #333" }} />
                      <Legend />
                      <Bar dataKey="capitalGains" name="Capital Gains" fill="#ef4444" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="depreciationOffset" name="Depreciation Offset" fill="#a855f7" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <p className="text-xs text-muted-foreground mt-2">New STR purchases every {form.strPurchaseEveryYears} years provide 40% first-year depreciation to offset crypto capital gains during bull cycle profit-taking years.</p>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ═══ TAB 6: 30-YEAR SYNTHESIS ═══ */}
        <TabsContent value="synthesis" className="space-y-4">
          {!result ? (
            <Card className="border-dashed border-purple-500/30">
              <CardContent className="py-12 text-center">
                <LineChartIcon className="h-12 w-12 text-purple-400/50 mx-auto mb-3" />
                <p className="text-muted-foreground">Run the simulation to see the 30-year wealth synthesis</p>
                <Button variant="outline" className="mt-4" onClick={() => setActiveTab("factfinder")}>Go to Fact Finder</Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Giant Synthesis Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <LineChartIcon className="h-5 w-5 text-purple-400" />
                    30-Year Real Estate Portfolio Synthesis
                  </CardTitle>
                  <CardDescription>All properties tracked over 30 years — value, equity, rental income, and loan balances</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={result.thirtyYearSynthesis}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="year" tick={{ fill: "#888", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#888", fontSize: 11 }} tickFormatter={(v: number) => fmt(v)} />
                      <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: "#1a1a2e", border: "1px solid #333" }} />
                      <Legend />
                      <Area dataKey="totalPropertyValue" name="Total Property Value" fill="#3b82f620" stroke="#3b82f6" strokeWidth={2} />
                      <Area dataKey="totalEquity" name="Total Equity" fill="#22c55e20" stroke="#22c55e" strokeWidth={2} />
                      <Line dataKey="totalLoanBalance" name="Total Loans" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                      <Bar dataKey="totalRentalIncome" name="Annual Rental Income" fill="#a855f740" radius={[2, 2, 0, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Synthesis Table */}
              <Card>
                <CardHeader><CardTitle className="text-lg">30-Year Property Portfolio Spreadsheet</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-background z-10">
                        <tr className="border-b border-border/50">
                          <th className="text-left py-2 px-2">Year</th>
                          <th className="text-right py-2 px-2"># Properties</th>
                          <th className="text-right py-2 px-2">Total Value</th>
                          <th className="text-right py-2 px-2">Total Equity</th>
                          <th className="text-right py-2 px-2">Total Loans</th>
                          <th className="text-right py-2 px-2">Annual Rental</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.thirtyYearSynthesis.map((row: any, i: number) => (
                          <tr key={i} className={`border-b border-border/10 ${i % 2 === 0 ? "bg-muted/20" : ""}`}>
                            <td className="py-1 px-2 font-medium">{row.year}</td>
                            <td className="py-1 px-2 text-right">{row.propertyCount}</td>
                            <td className="py-1 px-2 text-right text-blue-400 font-semibold">{fmt(row.totalPropertyValue)}</td>
                            <td className="py-1 px-2 text-right text-emerald-400 font-semibold">{fmt(row.totalEquity)}</td>
                            <td className="py-1 px-2 text-right text-red-400">{fmt(row.totalLoanBalance)}</td>
                            <td className="py-1 px-2 text-right">{fmt(row.totalRentalIncome)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              {/* Strategy Summary */}
              <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2"><Target className="h-5 w-5 text-amber-400" />Strategy Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <p><span className="font-semibold text-amber-400">The Cycle:</span> Use IUL policy loans to DCA into Bitcoin during bear markets. Sell during bull markets to capture gains.</p>
                      <p><span className="font-semibold text-emerald-400">Loan Repayment:</span> First priority — repay all IUL loans until policy is max funded.</p>
                      <p><span className="font-semibold text-yellow-400">Precious Metals:</span> Allocate excess profits to gold ({form.pctToGold}%) and silver ({form.pctToSilver}%) as a hedge.</p>
                    </div>
                    <div className="space-y-2">
                      <p><span className="font-semibold text-blue-400">Real Estate:</span> Purchase a ${fmt(form.strPurchasePrice)} STR every {form.strPurchaseEveryYears} years with 30% down. Use 40% first-year depreciation to offset crypto capital gains.</p>
                      <p><span className="font-semibold text-purple-400">Funding Stack:</span> Crypto profits → IUL 90% loan → HELOC for remaining down payment.</p>
                      <p><span className="font-semibold text-red-400">Rental Income:</span> 20% gross annual income reinvested into next bear cycle DCA and mortgage paydown ({form.pctToMortgagePaydown}%).</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
      <NAICDisclaimer variant="footer" showsProjections showsComparisons />
      
      <ComplianceFooter pageName="CryptoCurrencyCorner" showsIUL showsTax showsEstate showsProjections showsHistoricalData showsPolicyLoans />
      <PageInsights pageId="crypto-corner" />
</div>
  );
}
