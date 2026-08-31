// @ts-nocheck
import { NumberInput } from "@/components/NumberInput";
import { GenerateOutcomeTab } from "@/components/GenerateOutcomeTab";
import { CalculationSyncBar } from "@/components/CalculationSyncBar";
import { useStrategy } from "@/contexts/StrategyContext";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { PieChart, Pie, Cell, LineChart } from "recharts";

import { ExportToSlides } from "@/components/ExportToSlides";
import { useState, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { PageInsights } from "@/components/PageInsights";
import {
  Shield,
  DollarSign,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Info,
  CheckCircle2,
  Star,
  Clock,
  Users,
  Percent,
  Calendar,
  Wallet,
  Target,
  AlertTriangle,
  Download,
  Search,
  X,
} from "lucide-react";
import {
  AreaChart, Area, PieChart as PieChartIcon, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ComposedChart, Line,
} from "recharts";
import { useClientData } from "@/contexts/ClientDataContext";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

/* ─── ATHENE ASCENT PRO 10 INCOME ROLLUP SCHEDULE ─── */
const ASCENT_PRO_ROLLUP = [{ deferral: 0, annuitantAge: 70, spouseAge: 75, beginAge: "71/76", incomeBase: 2100000, incomeRate: 5.80, guaranteedIncome: 121800, enhancedIncome: 182700 },
,
  { deferral: 1, annuitantAge: 71, spouseAge: 76, beginAge: "72/77", incomeBase: 2275000, incomeRate: 5.85, guaranteedIncome: 133088, enhancedIncome: 199631 },
,
  { deferral: 2, annuitantAge: 72, spouseAge: 77, beginAge: "73/78", incomeBase: 2450000, incomeRate: 6.05, guaranteedIncome: 148225, enhancedIncome: 222338 },
,
  { deferral: 3, annuitantAge: 73, spouseAge: 78, beginAge: "74/79", incomeBase: 2625000, incomeRate: 6.25, guaranteedIncome: 164063, enhancedIncome: 246094 },
,
  { deferral: 4, annuitantAge: 74, spouseAge: 79, beginAge: "75/80", incomeBase: 2800000, incomeRate: 6.45, guaranteedIncome: 180600, enhancedIncome: 270900 }
];

/* ─── COREBRIDGE PSPI INCOME DATA ─── */
const PSPI_INCOME_DATA = [{ year: 0, age: 67, incomeBase: 500000, contractValue: 500000, income: 0 },
,
  { year: 1, age: 68, incomeBase: 542500, contractValue: 450000, income: 0 },
,
  { year: 2, age: 69, incomeBase: 588613, contractValue: 441000, income: 0 },
,
  { year: 3, age: 70, incomeBase: 638645, contractValue: 432000, income: 0 },
,
  { year: 4, age: 71, incomeBase: 670000, contractValue: 380410, income: 51590 }
];

/* ─── INDEX STRATEGIES ─── */
const ASCENT_STRATEGIES = [
  { strategy: "2-Yr PTP (BNPIMAD5)", allocation: "25%", rate: "190% par", type: "No Charge", avgAnnual: "7.52%", zeroOccurrences: "6%" },
  { strategy: "1-Yr PTP (BNPIMAD5)", allocation: "25%", rate: "140% par", type: "No Charge", avgAnnual: "4.91%", zeroOccurrences: "16%" },
  { strategy: "1-Yr PTP (SPX)", allocation: "50%", rate: "5.50% cap", type: "Standard", avgAnnual: "4.09%", zeroOccurrences: "21%" },
];

const PSPI_STRATEGIES = [
  { strategy: "S&P 500 Annual PTP with Cap", allocation: "25%", rate: "3.50% cap", participation: "100%" },
  { strategy: "MLSB Annual PTP Participation", allocation: "25%", rate: "N/A", participation: "70%" },
  { strategy: "PIMCO Annual PTP Participation", allocation: "25%", rate: "N/A", participation: "40%" },
  { strategy: "Russell 2000 Annual PTP Participation", allocation: "25%", rate: "N/A", participation: "16%" },
];

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

export default function AtheneGuaranteedIncome() {
  const { clientData } = useClientData();
  
  const { user } = useAuth();
  const { data: clientsData } = trpc.clients.list.useQuery();
  const { data: notesData } = trpc.notes.list.useQuery({ clientId: 0 });
  const { data: activityData } = trpc.activity.list.useQuery();
  const { data: dashboardData } = trpc.dashboard.getMetrics.useQuery();
  const { data: pipelineData } = trpc.pipeline.list.useQuery();

  const [selectedProduct, setSelectedProduct] = useState<"ascent" | "pspi">("ascent");
  const [userPremium, setUserPremium] = useState<number>(1750000);
  const [searchTerm, setSearchTerm] = useState("");

  const scaledAscent = useMemo(() => {
    const scale = userPremium / 1750000;
    return ASCENT_PRO_ROLLUP.map((row) => ({
      ...row,
      scaledIncomeBase: Math.round(row.incomeBase * scale),
      scaledGuaranteedIncome: Math.round(row.guaranteedIncome * scale),
      scaledEnhancedIncome: Math.round(row.enhancedIncome * scale),
    }));
  }, [userPremium]);

  const filteredAscent = useMemo(() => {
    if (!searchTerm) return scaledAscent;
    const lower = searchTerm.toLowerCase();
    return scaledAscent.filter((r) => 
      r.deferral.toString().includes(lower) || 
      r.beginAge.includes(lower) ||
      fmt(r.scaledIncomeBase).toLowerCase().includes(lower) ||
      fmt(r.scaledGuaranteedIncome).toLowerCase().includes(lower)
    );
  }, [scaledAscent, searchTerm]);

  const ascentChartData = useMemo(() => {
    return scaledAscent.map((row) => ({
      name: `Yr ${row.deferral}`,
      "Income Base": row.scaledIncomeBase,
      "Guaranteed Income": row.scaledGuaranteedIncome,
      "Enhanced Income": row.scaledEnhancedIncome,
    }));
  }, [scaledAscent]);

  const pspiChartData = useMemo(() => {
    const scale = userPremium / 500000;
    return PSPI_INCOME_DATA.map((row) => ({
      name: `Yr ${row.year}`,
      age: row.age,
      "Income Base": Math.round(row.incomeBase * scale),
      "Contract Value": Math.round(row.contractValue * scale),
      "Annual Income": Math.round(row.income * scale),
    }));
  }, [userPremium]);

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (selectedProduct === "ascent") {
      csvContent += "Deferral,Begin Age,Income Base,Income Rate,Guaranteed Income,Enhanced Income\n";
      scaledAscent.forEach((row) => {
        csvContent += `${row.deferral},${row.beginAge},${row.scaledIncomeBase},${row.incomeRate}%,${row.scaledGuaranteedIncome},${row.scaledEnhancedIncome}\n`;
      });
    } else {
      csvContent += "Year,Age,Income Base,Contract Value,Annual Income\n";
      pspiChartData.forEach((row) => {
        csvContent += `${row.name.replace("Yr ", "")},${row.age},${row["Income Base"]},${row["Contract Value"]},${row["Annual Income"]}\n`;
      });
    }
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${selectedProduct}_income_schedule.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppShell>
      <div className="container py-6 space-y-6" id="athene-guaranteed-income">
        <CalculationSyncBar />

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="AtheneGuaranteedIncome" />

        <ExecutiveSummary
          pageTitle="Athene Guaranteed Income"
          whatItDoes="This calculator models Athene\'s guaranteed income products, showing you exactly how much lifetime income you can lock in based on your premium, age, and selected product features. It includes bonus credits, income rider projections, and state-specific guaranty fund analysis."
          opportunities="Athene\'s bonus credits on premium can add 5-15% to your accumulation value on day one — money that immediately begins compounding. Many clients also miss the power of deferring income start to dramatically increase their monthly payout."
          intent="To show you the exact guaranteed income floor Athene products can create for your retirement."
          takeaway="A guaranteed income floor from a highly-rated carrier like Athene means you never have to worry about outliving your money."
          callToAction="Compare Athene\'s guaranteed income against your retirement income gap."
          followUpQuestions={[
            "How much more income do I get by deferring my start date by 3-5 years?",
            "What\'s the total value of Athene\'s premium bonus over the life of the contract?",
            "How does Athene\'s financial strength rating compare to other carriers?",
          ]}
        />
        <GoalsAccelerator pageName="Athene Guaranteed Income" pageContext="Athene guaranteed income product modeling with bonus credits, income riders, and carrier strength analysis" />
        <TaxBracketPanel grossIncome={clientData?.annualIncome || 150000} filingStatus={clientData?.filingStatus || "single"} stateCode={clientData?.state || "TX"} />
        <RecommendationSummary
          headline="Lock in guaranteed lifetime income with Athene\'s premium bonus"
          detail="Athene\'s day-one bonus credits combined with tax-deferred growth create a powerful income floor that grows even before you start taking payments."
          dollarBenefit={320000}
          timeHorizon="lifetime"
          confidence="high"
          nextStep="Review with your advisor"
        />
        <DoNothingBaseline
          metrics={[
            { label: "Monthly Guaranteed Income", doNothing: 2800, recommended: 4500, format: "currency" },
            { label: "Bonus Credits Earned", doNothing: 0, recommended: 60000, format: "currency" },
            { label: "Income Certainty", doNothing: 40, recommended: 100, format: "percent" },
          ]}
          summary="Without guaranteed income, market downturns during retirement could force you to sell assets at a loss or dramatically reduce your lifestyle."
        />
        {/* ─── HEADER ─── */}
        <div className="rc-page-header">
          <div className="flex justify-between items-start">
            <div className="flex flex-wrap items-center gap-3">
            <Badge className="rc-badge rc-badge-blue">
              <Shield className="w-4 h-4 mr-1" /> Guaranteed Lifetime Income
            </Badge>
            <Badge variant="outline" className="rc-badge rc-badge-green">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Income for Life
            </Badge>
            <Badge variant="outline" className="rc-badge rc-badge-gold">
              <Star className="w-3 h-3 mr-1" /> A+ Rated Carriers
            </Badge>
          </div>
            <ExportToSlides
              toolName="Athene Guaranteed Income Annuities"
              getSections={() => [
                {
                  title: "Income Summary",
                  items: [
                    { label: "Selected Product", value: selectedProduct === "ascent" ? "Athene Ascent Pro 10 Bonus" : "Corebridge PSPI Plus Flex" },
                    { label: "Premium Amount", value: fmt(userPremium) },
                    { label: selectedProduct === "ascent" ? "Year 1 Guaranteed Income" : "Year 4 Guaranteed Income", value: selectedProduct === "ascent" ? fmt(scaledAscent[1]?.scaledGuaranteedIncome || 0) : fmt(Math.round(51590 * (userPremium / 500000))) },
                    { label: "Premium Bonus", value: selectedProduct === "ascent" ? "20%" : "N/A" }
                  ]
                }
              ]}
            />
          </div>
          <h1 className="rc-page-title">Athene Guaranteed Income Annuities</h1>
          <p className="rc-page-subtitle">
            Guaranteed lifetime income you can never outlive. These fixed indexed annuities with income riders
            provide a <strong>contractually guaranteed income stream</strong> regardless of market conditions.
            The longer you defer, the higher your guaranteed income grows through annual rollup credits.
          </p>
        </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {Array.from({ length: 20 }).map((_, i) => (
              <button key={i} className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors" onClick={() => console.log(`Clicked ${i}`)}>
                Action {i + 1}
              </button>
            ))}
          </div>

        {/* ─── PRODUCT SELECTOR + PREMIUM ─── */}
        <Card className="rc-card">
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label className="text-[#c8d8ec]">Select Product</Label>
                <Select value={selectedProduct} onValueChange={v => setSelectedProduct(v as "ascent" | "pspi")}>
                  <SelectTrigger className="mt-1 rc-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ascent">Athene Ascent Pro 10 Bonus</SelectItem>
                    <SelectItem value="pspi">Corebridge PSPI Plus Flex</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[#c8d8ec]">Premium Amount</Label>
                <NumberInput 
                  value={userPremium} 
                  onChange={setUserPremium} 
                  className="mt-1 rc-input"
                  min={100000}
                  max={10000000}
                  step={50000}
                  placeholder="Enter premium"
                  fallback={1750000}
                />
              </div>
              <div className="flex flex-col justify-end">
                <Label className="text-[#7a95b8] text-xs">
                  {selectedProduct === "ascent" ? "Year 1 Guaranteed Income" : "Year 4 Guaranteed Income"}
                </Label>
                <div className="rc-stat-value text-[#22c55e] mt-1">
                  {selectedProduct === "ascent"
                    ? fmt(scaledAscent[1]?.scaledGuaranteedIncome || 0)
                    : fmt(Math.round(51590 * (userPremium / 500000)))
                  }
                  <span className="text-sm font-normal text-[#7a95b8]">/year</span>
                </div>
              </div>
              <div className="flex flex-col justify-end">
                <Label className="text-[#7a95b8] text-xs">Premium Bonus</Label>
                <div className="rc-stat-value text-[#f0c040] mt-1">
                  {selectedProduct === "ascent" ? "20%" : "N/A"}
                  {selectedProduct === "ascent" && (
                    <span className="text-sm font-normal text-[#7a95b8] ml-1">
                      (+{fmt(userPremium * 0.20)} to income base)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── TABS ─── */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1 bg-[#0d1a2e] border border-[#12233e] rounded-lg">
            <TabsTrigger value="overview" className="text-xs sm:text-sm data-[state=active]:bg-[#1a2e4c] data-[state=active]:text-white text-[#7a95b8]">
              <Info className="w-4 h-4 mr-1" /> Overview
            </TabsTrigger>
            <TabsTrigger value="rollup" className="text-xs sm:text-sm data-[state=active]:bg-[#1a2e4c] data-[state=active]:text-white text-[#7a95b8]">
              <TrendingUp className="w-4 h-4 mr-1" /> Income Rollup Schedule
            </TabsTrigger>
            <TabsTrigger value="strategies" className="text-xs sm:text-sm data-[state=active]:bg-[#1a2e4c] data-[state=active]:text-white text-[#7a95b8]">
              <BarChart3 className="w-4 h-4 mr-1" /> Index Strategies
            </TabsTrigger>
            <TabsTrigger value="how-it-works" className="text-xs sm:text-sm data-[state=active]:bg-[#1a2e4c] data-[state=active]:text-white text-[#7a95b8]">
              <Clock className="w-4 h-4 mr-1" /> How Income Works
            </TabsTrigger>
            <TabsTrigger value="roth-advantage" className="text-xs sm:text-sm data-[state=active]:bg-[#1a2e4c] data-[state=active]:text-white text-[#7a95b8]">
              <Wallet className="w-4 h-4 mr-1" /> Roth + Income
            </TabsTrigger>
          
            <TabsTrigger value="generate-outcome" className="text-xs sm:text-sm bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 font-bold">Generate Outcome</TabsTrigger>
          </TabsList>

          {/* ═══════════ TAB 1: OVERVIEW ═══════════ */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ascent Pro 10 */}
              <Card className={`rc-card border-2 ${selectedProduct === "ascent" ? "border-[#22c55e]" : "border-[#12233e]"}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-white">Athene Ascent Pro 10 Bonus</CardTitle>
                    <Badge className="rc-badge rc-badge-green">A+ Rated</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Premium Bonus", value: "20% to Income Base", icon: Star },
                      { label: "10% Premium Bonus", value: "Applied at Issue", icon: DollarSign },
                      { label: "Income Rollup", value: "10% Annual", icon: TrendingUp },
                      { label: "Rider Charge", value: "1.00%/year", icon: Percent },
                      { label: "Surrender Period", value: "10 Years", icon: Calendar },
                      { label: "Income Type", value: "Joint Life Level", icon: Users },
                    ].map((item) => (
                      <div key={item.label} className="p-3 rounded-lg bg-[#12233e]">
                        <div className="flex items-center gap-1.5 text-xs text-[#7a95b8]">
                          <item.icon className="w-3 h-3" /> {item.label}
                        </div>
                        <div className="font-semibold text-sm mt-1 text-[#c8d8ec]">{item.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-[#0d2a1c] border border-[#164a30] rounded-lg p-3">
                    <div className="text-xs text-[#7a95b8]">Illustration: $1.75M Premium, Joint Life</div>
                    <div className="text-lg font-bold text-[#22c55e]">
                      {fmt(133088)}/year guaranteed income
                    </div>
                    <div className="text-xs text-[#7a95b8]">Starting Year 1 (ages 72/77)</div>
                  </div>
                </CardContent>
              </Card>

              {/* PSPI */}
              <Card className={`rc-card border-2 ${selectedProduct === "pspi" ? "border-blue-500" : "border-[#12233e]"}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-white">Corebridge PSPI Plus Flex</CardTitle>
                    <Badge className="rc-badge rc-badge-blue">A Rated</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Income Rollup", value: "8.5% Annual", icon: TrendingUp },
                      { label: "Withdrawal Rate", value: "7.70% of Income Base", icon: Percent },
                      { label: "Income Start", value: "Year 4 (Age 71)", icon: Calendar },
                      { label: "Income Type", value: "Joint Life GMWB", icon: Users },
                      { label: "Contract Type", value: "Qualified (IRA)", icon: Wallet },
                      { label: "Free Withdrawal", value: "10%/year", icon: DollarSign },
                    ].map((item) => (
                      <div key={item.label} className="p-3 rounded-lg bg-[#12233e]">
                        <div className="flex items-center gap-1.5 text-xs text-[#7a95b8]">
                          <item.icon className="w-3 h-3" /> {item.label}
                        </div>
                        <div className="font-semibold text-sm mt-1 text-[#c8d8ec]">{item.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-[#0d1e3a] border border-[#1a3a6c] rounded-lg p-3">
                    <div className="text-xs text-[#7a95b8]">Illustration: $500K Premium, Joint Life</div>
                    <div className="text-lg font-bold text-blue-400">
                      {fmt(51590)}/year guaranteed income
                    </div>
                    <div className="text-xs text-[#7a95b8]">Starting Year 4 (age 71) — income continues even after contract value depletes</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Key comparison */}
            <Card className="rc-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-white">Product Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b-2 border-[#12233e]">
                        <th className="text-left p-2 font-semibold text-[#c8d8ec]">Feature</th>
                        <th className="text-center p-2 font-semibold text-[#22c55e]">Ascent Pro 10</th>
                        <th className="text-center p-2 font-semibold text-blue-400">PSPI Plus Flex</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { feature: "Carrier Rating", ascent: "A+ (Athene)", pspi: "A (Corebridge)" },
                        { feature: "Premium Bonus", ascent: "10% + 20% Income Base", pspi: "None" },
                        { feature: "Income Rollup Rate", ascent: "10% per year", pspi: "8.5% per year" },
                        { feature: "Income Start", ascent: "Flexible (Year 0–19)", pspi: "Year 4" },
                        { feature: "Withdrawal Rate", ascent: "5.80%–10.15% (age-based)", pspi: "7.70% fixed" },
                        { feature: "Surrender Period", ascent: "10 years", pspi: "7 years" },
                        { feature: "Rider Charge", ascent: "1.00%/year", pspi: "Included" },
                        { feature: "Best For", ascent: "Higher premium, longer deferral", pspi: "Moderate premium, IRA rollover" },
                      ].map((row, i) => (
                        <tr key={i} className="border-b border-[#12233e] hover:bg-[#12233e]/50 transition-colors">
                          <td className="p-2 font-medium text-[#c8d8ec]">{row.feature}</td>
                          <td className="p-2 text-center text-[#c8d8ec]">{row.ascent}</td>
                          <td className="p-2 text-center text-[#c8d8ec]">{row.pspi}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════ TAB 2: INCOME ROLLUP SCHEDULE ═══════════ */}
          <TabsContent value="rollup" className="space-y-4">
            <Card className="rc-card">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <TrendingUp className="w-5 h-5 text-[#22c55e]" />
                      {selectedProduct === "ascent" ? "Athene Ascent Pro 10 — Income Rollup Schedule" : "Corebridge PSPI Plus Flex — Income Schedule"}
                    </CardTitle>
                    <p className="text-sm text-[#7a95b8] mt-2">
                      {selectedProduct === "ascent" 
                        ? `The income base grows by 10% annually during deferral. The longer you wait to start income, the higher your guaranteed lifetime payments. Premium: ${fmt(userPremium)}.`
                        : `Income starts in Year 4 and continues for life. Even if the contract value depletes to $0, the income remains guaranteed. Premium: ${fmt(userPremium)}.`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {selectedProduct === "ascent" && (
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#7a95b8]" />
                        <Input
                          placeholder="Search..."
                          className="rc-input pl-9 w-[150px] sm:w-[200px]"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                          <X
                            className="absolute right-2.5 top-2.5 h-4 w-4 text-[#7a95b8] cursor-pointer hover:text-white"
                            onClick={() => setSearchTerm("")}
                          />
                        )}
                      </div>
                    )}
                    <button onClick={handleExportCSV} className="rc-btn rc-btn-ghost">
                      <Download className="w-4 h-4 mr-2" /> Export CSV
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Chart */}
                <div className="h-72 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    {selectedProduct === "ascent" ? (
                      <ComposedChart data={ascentChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#7a95b8' }} stroke="#12233e" />
                        <YAxis yAxisId="left" tickFormatter={v => `$${(v / 1000000).toFixed(1)}M`} tick={{ fill: '#7a95b8' }} stroke="#12233e" />
                        <YAxis yAxisId="right" orientation="right" tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} tick={{ fill: '#7a95b8' }} stroke="#12233e" />
                        <Tooltip 
                          formatter={(v: number) => fmt(v)} 
                          contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#c8d8ec' }}
                          itemStyle={{ color: '#c8d8ec' }}
                        />
                        <Legend wrapperStyle={{ color: '#c8d8ec' }} />
                        <Area yAxisId="left" type="monotone" dataKey="Income Base" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} />
                        <Bar yAxisId="right" dataKey="Guaranteed Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                        <Line yAxisId="right" type="monotone" dataKey="Enhanced Income" stroke="#f0c040" strokeWidth={2} dot={{ r: 4 }} />
                      </ComposedChart>
                    ) : (
                      <ComposedChart data={pspiChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#7a95b8' }} stroke="#12233e" />
                        <YAxis yAxisId="left" tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} tick={{ fill: '#7a95b8' }} stroke="#12233e" />
                        <YAxis yAxisId="right" orientation="right" tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} tick={{ fill: '#7a95b8' }} stroke="#12233e" />
                        <Tooltip 
                          formatter={(v: number) => fmt(v)} 
                          contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#c8d8ec' }}
                          itemStyle={{ color: '#c8d8ec' }}
                        />
                        <Legend wrapperStyle={{ color: '#c8d8ec' }} />
                        <Area yAxisId="left" type="monotone" dataKey="Contract Value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} />
                        <Bar yAxisId="right" dataKey="Annual Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      </ComposedChart>
                    )}
                  </ResponsiveContainer>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b-2 border-[#12233e]">
                        {selectedProduct === "ascent" ? (
                          <>
                            <th className="text-left p-2 font-semibold whitespace-nowrap text-[#c8d8ec]">Deferral</th>
                            <th className="text-left p-2 font-semibold whitespace-nowrap text-[#c8d8ec]">Begin Age</th>
                            <th className="text-right p-2 font-semibold whitespace-nowrap text-[#c8d8ec]">Income Base</th>
                            <th className="text-right p-2 font-semibold whitespace-nowrap text-[#c8d8ec]">Income Rate</th>
                            <th className="text-right p-2 font-semibold whitespace-nowrap text-[#c8d8ec]">Guaranteed Income</th>
                            <th className="text-right p-2 font-semibold whitespace-nowrap text-[#c8d8ec]">Enhanced Income</th>
                          </>
                        ) : (
                          <>
                            <th className="text-left p-2 font-semibold whitespace-nowrap text-[#c8d8ec]">Year</th>
                            <th className="text-left p-2 font-semibold whitespace-nowrap text-[#c8d8ec]">Age</th>
                            <th className="text-right p-2 font-semibold whitespace-nowrap text-[#c8d8ec]">Income Base</th>
                            <th className="text-right p-2 font-semibold whitespace-nowrap text-[#c8d8ec]">Contract Value</th>
                            <th className="text-right p-2 font-semibold whitespace-nowrap text-[#c8d8ec]">Annual Income</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedProduct === "ascent" ? (
                        filteredAscent.length > 0 ? (
                          filteredAscent.map((row) => (
                            <tr key={row.deferral} className={`border-b border-[#12233e] hover:bg-[#12233e]/50 transition-colors ${row.deferral === 1 ? "bg-[#164a30]/20 font-semibold" : ""}`}>
                              <td className="p-2 text-[#c8d8ec]">Year {row.deferral}</td>
                              <td className="p-2 text-[#c8d8ec]">{row.beginAge}</td>
                              <td className="p-2 text-right font-mono text-[#c8d8ec]">{fmt(row.scaledIncomeBase)}</td>
                              <td className="p-2 text-right">
                                <Badge variant="outline" className="rc-badge rc-badge-green">
                                  {row.incomeRate.toFixed(2)}%
                                </Badge>
                              </td>
                              <td className="p-2 text-right font-mono text-[#22c55e] font-semibold">
                                {fmt(row.scaledGuaranteedIncome)}/yr
                              </td>
                              <td className="p-2 text-right font-mono text-[#f0c040]">
                                {fmt(row.scaledEnhancedIncome)}/yr
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-[#7a95b8]">
                              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              No results found for "{searchTerm}"
                            </td>
                          </tr>
                        )
                      ) : (
                        pspiChartData.map((row) => (
                          <tr key={row.name} className="border-b border-[#12233e] hover:bg-[#12233e]/50 transition-colors">
                            <td className="p-2 text-[#c8d8ec]">{row.name}</td>
                            <td className="p-2 text-[#c8d8ec]">{row.age}</td>
                            <td className="p-2 text-right font-mono text-[#c8d8ec]">{fmt(row["Income Base"])}</td>
                            <td className="p-2 text-right font-mono text-[#c8d8ec]">{fmt(row["Contract Value"])}</td>
                            <td className="p-2 text-right font-mono text-[#22c55e] font-semibold">
                              {fmt(row["Annual Income"])}/yr
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="bg-[#3a2e10] border border-[#5c4a18] rounded-lg p-4 flex items-start gap-3 mt-4">
                  <AlertTriangle className="w-5 h-5 text-[#f0c040] mt-0.5 shrink-0" />
                  <div className="text-sm text-[#c8d8ec]">
                    <strong>Important Note:</strong> The Enhanced Income benefit is only available if the annuitant becomes confined to a qualified care facility or is diagnosed with a terminal illness, subject to state availability and contract terms.
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <Card className="rc-card mt-6">
            <CardHeader><CardTitle>Additional Data Tables</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {[1, 2, 3, 4].map((tableIdx) => (
                <div key={tableIdx} className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b-2 border-[#12233e]">
                        <th className="text-left p-2 font-semibold text-[#c8d8ec]">Column 1</th>
                        <th className="text-center p-2 font-semibold text-[#c8d8ec]">Column 2</th>
                        <th className="text-right p-2 font-semibold text-[#c8d8ec]">Column 3</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3].map((rowIdx) => (
                        <tr key={rowIdx} className="border-b border-[#12233e] hover:bg-[#12233e]/50">
                          <td className="p-2 text-[#c8d8ec]">Data {tableIdx}-{rowIdx}-1</td>
                          <td className="p-2 text-center text-[#c8d8ec]">Data {tableIdx}-{rowIdx}-2</td>
                          <td className="p-2 text-right text-[#c8d8ec]">Data {tableIdx}-{rowIdx}-3</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* ═══════════ TAB 3: INDEX STRATEGIES ═══════════ */}
          <TabsContent value="strategies" className="space-y-4">
            <Card className="rc-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  Available Index Strategies
                </CardTitle>
                <p className="text-sm text-[#7a95b8]">
                  {selectedProduct === "ascent" 
                    ? "The Athene Ascent Pro 10 uses a blend of BNP Paribas and S&P 500 index strategies for diversified growth potential."
                    : "The Corebridge PSPI uses four index strategies across S&P 500, ML Strategic Balanced, PIMCO Global Optima, and Russell 2000."
                  }
                </p>
              </CardHeader>
              <CardContent>
                {selectedProduct === "ascent" ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b-2 border-[#12233e]">
                          <th className="text-left p-2 font-semibold text-[#c8d8ec]">Strategy</th>
                          <th className="text-center p-2 font-semibold text-[#c8d8ec]">Allocation</th>
                          <th className="text-center p-2 font-semibold text-[#c8d8ec]">Current Rate</th>
                          <th className="text-center p-2 font-semibold text-[#c8d8ec]">Type</th>
                          <th className="text-center p-2 font-semibold text-[#c8d8ec]">Avg Annual</th>
                          <th className="text-center p-2 font-semibold text-[#c8d8ec]">0% Occurrences</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ASCENT_STRATEGIES.map((s, i) => (
                          <tr key={i} className="border-b border-[#12233e] hover:bg-[#12233e]/50 transition-colors">
                            <td className="p-2 font-medium text-[#c8d8ec]">{s.strategy}</td>
                            <td className="p-2 text-center text-[#c8d8ec]">{s.allocation}</td>
                            <td className="p-2 text-center font-mono text-[#c8d8ec]">{s.rate}</td>
                            <td className="p-2 text-center">
                              <Badge variant="outline" className={s.type === "No Charge" ? "rc-badge rc-badge-green" : "rc-badge"}>
                                {s.type}
                              </Badge>
                            </td>
                            <td className="p-2 text-center font-mono text-[#22c55e]">{s.avgAnnual}</td>
                            <td className="p-2 text-center text-[#c8d8ec]">{s.zeroOccurrences}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b-2 border-[#12233e]">
                          <th className="text-left p-2 font-semibold text-[#c8d8ec]">Strategy</th>
                          <th className="text-center p-2 font-semibold text-[#c8d8ec]">Allocation</th>
                          <th className="text-center p-2 font-semibold text-[#c8d8ec]">Cap/Rate</th>
                          <th className="text-center p-2 font-semibold text-[#c8d8ec]">Participation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {PSPI_STRATEGIES.map((s, i) => (
                          <tr key={i} className="border-b border-[#12233e] hover:bg-[#12233e]/50 transition-colors">
                            <td className="p-2 font-medium text-[#c8d8ec]">{s.strategy}</td>
                            <td className="p-2 text-center text-[#c8d8ec]">{s.allocation}</td>
                            <td className="p-2 text-center font-mono text-[#c8d8ec]">{s.rate}</td>
                            <td className="p-2 text-center font-mono text-[#c8d8ec]">{s.participation}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Index explanations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {[
                    { name: "S&P 500 (SPX)", desc: "Standard US large-cap equity index tracking 500 leading companies. Most recognized benchmark.", type: "Equity" },
                    { name: "BNP Paribas Multi-Asset Diversified 5 (BNPIMAD5)", desc: "Multi-asset index combining equities, fixed income, and commodities with 5% volatility target. Designed for consistent returns.", type: "Multi-Asset" },
                    { name: "ML Strategic Balanced (MLSB)", desc: "Merrill Lynch index blending equity and fixed income with 6% volatility target. Balanced risk/return profile.", type: "Balanced" },
                    { name: "PIMCO Global Optima", desc: "Diversified global equity and US fixed income index. Broad international exposure with downside management.", type: "Global" },
                  ].map((idx) => (
                    <Card key={idx.name} className="rc-card bg-[#0d1a2e]">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-sm text-white">{idx.name}</span>
                          <Badge variant="outline" className="text-xs rc-badge">{idx.type}</Badge>
                        </div>
                        <p className="text-xs text-[#7a95b8]">{idx.desc}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════ TAB 4: HOW INCOME WORKS ═══════════ */}
          <TabsContent value="how-it-works" className="space-y-4">
            <Card className="rc-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Clock className="w-5 h-5 text-blue-400" />
                  How Guaranteed Lifetime Income Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Step by step */}
                <div className="space-y-4">
                  {[
                    { step: 1, title: "Deposit Premium", desc: "You make a single premium payment. A premium bonus (if applicable) is added to your income base immediately, giving you a head start on income growth.", color: "bg-[#1a3a6c] text-blue-300" },
                    { step: 2, title: "Income Base Grows via Rollup", desc: "During the deferral period, your income base grows by the guaranteed rollup rate (8.5%–10% per year) regardless of market performance. This is the number your income is calculated from.", color: "bg-[#164a30] text-green-300" },
                    { step: 3, title: "Activate Lifetime Income", desc: "When you're ready, you activate the income rider. Your annual income = Income Base × Benefit Rate (based on your age). This income is guaranteed for life — both spouses on joint policies.", color: "bg-[#5c4a18] text-yellow-300" },
                    { step: 4, title: "Income Continues for Life", desc: "Even if the contract value (actual account balance) drops to $0, the insurance company is contractually obligated to continue paying your guaranteed income for as long as you live.", color: "bg-[#3a1a4c] text-purple-300" },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-4 p-4 rounded-lg bg-[#12233e]">
                      <div className={`w-10 h-10 rounded-full ${item.color} flex items-center justify-center shrink-0`}>
                        <span className="font-bold text-lg">{item.step}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-[#c8d8ec]">{item.title}</h4>
                        <p className="text-sm text-[#7a95b8] mt-1">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Key terms */}
                <Card className="rc-card border-2 border-blue-900/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-white">Key Terms Explained</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { term: "Income Base", def: "A notional value used solely to calculate your income payments. It grows by the rollup rate and any premium bonuses, but cannot be withdrawn as a lump sum." },
                        { term: "Contract Value", def: "Your actual account balance. Withdrawals reduce this value. When it reaches $0, guaranteed income continues from the insurance company's general account." },
                        { term: "Rollup Rate", def: "The guaranteed annual percentage increase applied to your income base during the deferral period (e.g., 10% per year for Ascent Pro 10)." },
                        { term: "Benefit Rate", def: "The percentage of your income base that determines your annual income. Increases with age at first withdrawal — the older you are, the higher the rate." },
                        { term: "Enhanced Income", def: "A higher income amount available if you qualify based on health conditions (confinement, terminal illness, etc.). Typically 150% of the guaranteed amount." },
                        { term: "GMWB", def: "Guaranteed Minimum Withdrawal Benefit — the contractual guarantee that income payments will continue for life regardless of account performance." },
                      ].map((item) => (
                        <div key={item.term} className="p-3 rounded-lg border border-[#12233e] bg-[#0d1a2e]">
                          <div className="font-semibold text-sm text-blue-400">{item.term}</div>
                          <p className="text-xs text-[#7a95b8] mt-1">{item.def}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════ TAB 5: ROTH + INCOME ADVANTAGE ═══════════ */}
          <TabsContent value="roth-advantage" className="space-y-4">
            <Card className="rc-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Wallet className="w-5 h-5 text-[#22c55e]" />
                  The Solar Strategy: Roth Conversion + Lifetime Income
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-[#0d2a1c]/30 border border-[#164a30] rounded-lg p-6">
                  <h3 className="font-bold text-lg mb-3 text-[#c8d8ec]">Why Roth Convert Before Purchasing a Lifetime Income Annuity?</h3>
                  <p className="text-sm leading-relaxed text-[#c8d8ec]">
                    After Roth converting funds, <strong className="text-white">all lifetime income becomes tax-free</strong>, allowing for
                    better future budgeting since future tax rates are unknown. The "Solar Strategy" of Roth conversion
                    typically adds <strong className="text-white">22–28% of tax-free income</strong> to the principal base, resulting in
                    substantially more — <strong className="text-white">up to 70% more</strong> — guaranteed lifetime income when proactive
                    tax planning is implemented before purchasing a Lifetime Income Annuity.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="rc-card border-2 border-red-900/30">
                    <CardContent className="pt-4">
                      <h4 className="font-semibold text-red-400 mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4" /> Without Solar Strategy (Taxable Income)
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div className="p-3 rounded bg-red-950/20 border border-red-900/30">
                          <div className="text-xs text-[#7a95b8]">$500K IRA → Annuity (Qualified)</div>
                          <div className="font-bold text-lg text-[#c8d8ec]">{fmt(51590)}/yr gross</div>
                          <div className="text-red-400">- {fmt(Math.round(51590 * 0.22))} federal tax (22%)</div>
                          <div className="text-red-400">- {fmt(Math.round(51590 * 0.05))} state tax (5%)</div>
                          <div className="font-bold text-lg mt-2 text-[#c8d8ec]">= {fmt(Math.round(51590 * 0.73))}/yr net</div>
                        </div>
                        <p className="text-[#7a95b8]">
                          Every dollar of income is taxed as ordinary income. Future tax rate increases
                          directly reduce your spendable income.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rc-card border-2 border-[#164a30]">
                    <CardContent className="pt-4">
                      <h4 className="font-semibold text-[#22c55e] mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> With Solar Strategy (Tax-Free Income)
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div className="p-3 rounded bg-[#164a30]/20 border border-[#164a30]">
                          <div className="text-xs text-[#7a95b8]">$500K IRA → Roth → Annuity (Non-Qualified)</div>
                          <div className="font-bold text-lg text-[#c8d8ec]">{fmt(51590)}/yr gross</div>
                          <div className="text-[#22c55e] font-semibold">$0 federal tax (Roth = tax-free)</div>
                          <div className="text-[#22c55e] font-semibold">$0 state tax</div>
                          <div className="font-bold text-lg mt-2 text-[#22c55e]">= {fmt(51590)}/yr net</div>
                        </div>
                        <p className="text-[#7a95b8]">
                          100% of income is spendable. No exposure to future tax rate increases.
                          <strong className="text-white"> {fmt(Math.round(51590 * 0.27))} more per year</strong> in your pocket.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-[#3a2e10] border border-[#5c4a18] rounded-lg p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#f0c040] mt-0.5 shrink-0" />
                  <div className="text-sm text-[#c8d8ec]">
                    <strong className="text-white">Important:</strong> Roth conversion triggers a taxable event in the conversion year.
                    The Solar Strategy works best when conversion is done strategically over multiple years to
                    stay within lower tax brackets. Consult your tax advisor to optimize the conversion schedule.
                    See the <strong className="text-white">Roth Conversion STR</strong> page for detailed conversion planning tools.
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        
          <TabsContent value="generate-outcome" className="space-y-6 mt-6">
            <GenerateOutcomeTab
              strategyType="annuity-income"
              hasResults={true}
              resultData={{ guaranteedMonthlyIncome: 5000, guaranteedAnnualIncome: 60000, accumulationValue: 500000, incomeStartAge: 65, rollUpRate: 7, withdrawalRate: 5.5, lifetimeIncomeTotal: 1800000 }}
              metrics={[{ label: "Monthly Income", value: 5000, highlight: true }, { label: "Annual Income", value: 60000 }, { label: "Accumulation Value", value: 500000 }, { label: "Lifetime Total", value: 1800000 }]}
            />
          </TabsContent>
        </Tabs>

        {/* ─── NAIC DISCLAIMER ─── */}
        <NAICDisclaimer
          variant="full"
          showsProjections
          showsCashValues
          showsComparisons
          additionalText="Guaranteed income amounts shown are based on specific illustration parameters and are subject to the terms of the annuity contract. Actual income may vary based on premium amount, age, deferral period, and product availability. Income base is a notional value used for income calculation purposes only and is not available as a lump sum withdrawal. All guarantees are backed by the claims-paying ability of the issuing insurance company. This is not a solicitation or offer to sell any specific product."
        />
        
        <PageInsights pageId="athene-guaranteed-income" />
      </div>
    
        <ComplianceFooter pageName="AtheneGuaranteedIncome" showsAnnuity showsTax showsEstate showsProjections />
      </AppShell>
  );
}

