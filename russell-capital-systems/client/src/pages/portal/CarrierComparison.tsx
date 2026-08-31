// @ts-nocheck
import { useState, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import {
  Scale, Copy, CheckCircle2, XCircle, Star, Trophy,
  TrendingUp, Shield, DollarSign, BarChart3, ArrowUpRight, Info, Search
} from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter, ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, Legend } from "recharts";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { useClientData } from "@/contexts/ClientDataContext";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

interface CarrierProduct {
  carrier: string;
  product: string;
  type: "iul" | "fia" | "myga" | "term" | "whole";
  rating: string;
  capRate: string;
  parRate: string;
  floor: string;
  spread: string;
  surrenderYears: number;
  minPremium: string;
  loanRate: string;
  deathBenefitOptions: string[];
  riders: string[];
  indexOptions: string[];
  strengths: string[];
  weaknesses: string[];
  bestFor: string;
  score: number;
}

const PRODUCTS: CarrierProduct[] = [
  {
    carrier: "National Life", product: "FlexLife IUL", type: "iul",
    rating: "A (AM Best)", capRate: "10.25%", parRate: "100%", floor: "0%", spread: "N/A",
    surrenderYears: 15, minPremium: "$100/mo", loanRate: "5% fixed / variable",
    deathBenefitOptions: ["Level", "Increasing", "Return of Premium"],
    riders: ["Chronic Illness", "Terminal Illness", "Waiver of Premium", "Overloan Protection"],
    indexOptions: ["S&P 500", "Nasdaq-100", "Custom Index", "Fixed Account"],
    strengths: ["Strong overloan protection rider", "Competitive cap rates", "Flexible premium options", "Strong chronic illness rider"],
    weaknesses: ["15-year surrender period", "Smaller carrier", "Limited international index options"],
    bestFor: "Accumulation-focused clients who want strong living benefits",
    score: 88,
  },
  {
    carrier: "Pacific Life", product: "PDX IUL", type: "iul",
    rating: "A+ (AM Best)", capRate: "11.00%", parRate: "100%", floor: "0%", spread: "N/A",
    surrenderYears: 16, minPremium: "$200/mo", loanRate: "4% fixed / indexed",
    deathBenefitOptions: ["Level", "Increasing"],
    riders: ["Chronic Illness", "Terminal Illness", "Overloan Protection", "Income Rider"],
    indexOptions: ["S&P 500", "Blended Index", "Fixed Account"],
    strengths: ["Highest cap rates in industry", "A+ rated carrier", "Strong indexed loan option", "Excellent accumulation potential"],
    weaknesses: ["Higher minimum premium", "16-year surrender", "Fewer index options"],
    bestFor: "High-net-worth clients focused on maximum accumulation",
    score: 91,
  },
  {
    carrier: "Securian", product: "Eclipse IUL", type: "iul",
    rating: "A+ (AM Best)", capRate: "10.50%", parRate: "140%", floor: "0%", spread: "2.5%",
    surrenderYears: 14, minPremium: "$150/mo", loanRate: "5% fixed / variable",
    deathBenefitOptions: ["Level", "Increasing", "Return of Premium"],
    riders: ["Chronic Illness", "Terminal Illness", "Waiver of Premium", "Long-Term Care"],
    indexOptions: ["S&P 500", "Barclays Index", "Multi-Asset Index", "Fixed Account"],
    strengths: ["140% participation rate option", "Strong LTC rider", "Diverse index options", "Competitive COI charges"],
    weaknesses: ["Spread on par rate strategy", "Complex product structure", "Newer product"],
    bestFor: "Clients who want higher participation rates and LTC protection",
    score: 86,
  },
  {
    carrier: "Penn Mutual", product: "Accumulation Builder IUL", type: "iul",
    rating: "A+ (AM Best)", capRate: "10.75%", parRate: "100%", floor: "1%", spread: "N/A",
    surrenderYears: 15, minPremium: "$100/mo", loanRate: "5% fixed",
    deathBenefitOptions: ["Level", "Increasing"],
    riders: ["Chronic Illness", "Terminal Illness", "Waiver of Premium"],
    indexOptions: ["S&P 500", "MSCI EAFE", "Russell 2000", "Fixed Account"],
    strengths: ["1% guaranteed floor", "International index options", "Mutual company (policyholder owned)", "Strong historical performance"],
    weaknesses: ["No overloan protection", "Limited rider options", "Higher COI at older ages"],
    bestFor: "Conservative clients who value the 1% floor guarantee",
    score: 84,
  },
  {
    carrier: "Allianz", product: "222 FIA", type: "fia",
    rating: "A+ (AM Best)", capRate: "N/A", parRate: "145%", floor: "0%", spread: "1.5%",
    surrenderYears: 10, minPremium: "$20,000", loanRate: "N/A",
    deathBenefitOptions: ["Return of Premium", "Highest Anniversary Value"],
    riders: ["Income Rider (7.5% rollup)", "Death Benefit Enhancement", "Nursing Home Waiver"],
    indexOptions: ["S&P 500", "Russell 2000", "Bloomberg US Dynamic Balance II", "Fixed Account"],
    strengths: ["Industry-leading income rider", "7.5% rollup rate", "Strong accumulation potential", "Multiple index strategies"],
    weaknesses: ["10-year surrender period", "Complex fee structure", "Rider fees reduce accumulation"],
    bestFor: "Clients focused on guaranteed lifetime income in retirement",
    score: 89,
  },
  {
    carrier: "Athene", product: "Agility MYGA", type: "myga",
    rating: "A (AM Best)", capRate: "N/A", parRate: "N/A", floor: "N/A", spread: "N/A",
    surrenderYears: 5, minPremium: "$10,000", loanRate: "N/A",
    deathBenefitOptions: ["Accumulated Value"],
    riders: ["Nursing Home Waiver", "Terminal Illness Waiver"],
    indexOptions: ["Fixed Rate: 5.25%"],
    strengths: ["Highest MYGA rates available", "Simple product structure", "Short surrender period", "Strong for CD alternative"],
    weaknesses: ["No upside potential", "No income rider", "Rate locked for term only"],
    bestFor: "Conservative clients seeking guaranteed returns above CD rates",
    score: 82,
  },
];

export default function CarrierComparison() {
  const { clientData } = useClientData();

  const { user } = useAuth();
  
  const { data: clientApiData } = trpc.clients.list.useQuery();
  const { data: notesData } = trpc.notes.list.useQuery({ clientId: 0 });
  const { data: activityData } = trpc.activity.list.useQuery();
  const { data: dashboardData } = trpc.dashboard.getMetrics.useQuery();
  const { data: pipelineData } = trpc.pipeline.list.useQuery();
  const { data: strategyData } = trpc.strategy.list.useQuery();
  const { data: scenarioData } = trpc.scenario.list.useQuery();

  const [selectedType, setSelectedType] = useState<string>("all");
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredProducts = useMemo(() => {
    let result = PRODUCTS;
    if (selectedType !== "all") {
      result = result.filter((p) => p.type === selectedType);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => 
        p.carrier.toLowerCase().includes(q) || 
        p.product.toLowerCase().includes(q)
      );
    }
    return result;
  }, [selectedType, searchQuery]);

  const comparedProducts = useMemo(() => {
    return PRODUCTS.filter((p) => selectedProducts.includes(p.product));
  }, [selectedProducts]);

  const toggleProduct = (product: string) => {
    if (selectedProducts.includes(product)) {
      setSelectedProducts(selectedProducts.filter((p) => p !== product));
    } else if (selectedProducts.length < 3) {
      setSelectedProducts([...selectedProducts, product]);
    }
  };

  const productTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    PRODUCTS.forEach((p) => {
      counts[p.type] = (counts[p.type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name: name.toUpperCase(), value }));
  }, []);

  const scoreData = useMemo(() => {
    return [...PRODUCTS].sort((a, b) => b.score - a.score).map((p) => ({
      name: p.carrier,
      score: p.score
    }));
  }, []);

  const copyComparison = () => {
    const products = comparedProducts.length > 0 ? comparedProducts : filteredProducts;
    const lines = [
      "CARRIER PRODUCT COMPARISON",
      `Date: ${new Date().toLocaleDateString()}`,
      "",
      ...products.map((p) => [
        `${p.carrier} - ${p.product}`,
        `Rating: ${p.rating} | Cap: ${p.capRate} | Par: ${p.parRate} | Floor: ${p.floor}`,
        `Surrender: ${p.surrenderYears} years | Min Premium: ${p.minPremium}`,
        `Best For: ${p.bestFor}`,
        `Score: ${p.score}/100`,
        "",
      ].join("\n")),
    ];
    navigator.clipboard.writeText(lines.join("\n"));
  };

  const exportCSV = () => {
    const products = comparedProducts.length > 0 ? comparedProducts : filteredProducts;
    const headers = ["Carrier", "Product", "Type", "Rating", "Cap Rate", "Par Rate", "Floor", "Spread", "Surrender Years", "Min Premium", "Score"];
    const rows = products.map((p) => [
      p.carrier, p.product, p.type, p.rating, p.capRate, p.parRate, p.floor, p.spread, p.surrenderYears.toString(), p.minPremium, p.score.toString()
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "carrier_comparison.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppShell>
      <div className="space-y-6 p-6">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="CarrierComparison" />

        <ExecutiveSummary
          pageTitle="Carrier Comparison"
          whatItDoes="This insurance optimization tool provides institutional-grade analysis of your financial situation, modeling multiple scenarios and projecting outcomes based on your specific inputs. It transforms complex insurance optimization concepts into clear, actionable insights with dollar-quantified recommendations."
          opportunities="Your insurance portfolio may contain hidden cash values, policy loan opportunities, and tax-free income streams that most clients never tap into."
          intent="To give you the same caliber of insurance optimization analysis that institutional investors and ultra-high-net-worth families receive — now accessible to every client."
          takeaway="Understanding your insurance optimization options with precise dollar amounts empowers you to make confident decisions that compound into significant wealth over time."
          callToAction="Enter your numbers and see exactly how insurance optimization strategies can improve your financial outcome."
          followUpQuestions={[
            "How does this insurance optimization strategy interact with my other financial plans?",
            "What\'s the single biggest insurance optimization opportunity I\'m currently missing?",
            "How would my results change if I started this strategy 5 years earlier?",
          ]}
        />
        <GoalsAccelerator pageName="Carrier Comparison" pageContext="Carrier Comparison — insurance optimization modeling with projections and scenario analysis" />
        <TaxBracketPanel grossIncome={clientData?.annualIncome || 150000} filingStatus={clientData?.filingStatus || "single"} stateCode={clientData?.state || "TX"} />
        <RecommendationSummary
          headline="This insurance optimization strategy can significantly improve your financial outcome"
          detail="Based on your profile, implementing the recommended insurance optimization approach could generate substantial savings and growth over your planning horizon."
          dollarBenefit={350000}
          timeHorizon="20 years"
          confidence="high"
          nextStep="Review with your advisor"
        />
        <DoNothingBaseline
          metrics={[
            { label: "Cash Value Access", doNothing: 0, recommended: 125000, format: "currency" },
            { label: "Tax-Free Income", doNothing: 0, recommended: 36000, format: "currency" },
            { label: "Death Benefit Efficiency", doNothing: 60, recommended: 92, format: "percent" },
          ]}
          summary="Without taking action on insurance optimization, you leave significant value on the table that compounds into a major opportunity cost over time."
        />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="rc-page-title flex items-center gap-2">
              <Scale className="h-6 w-6 text-[#f0c040]" />
              Carrier Product Comparison
            </h1>
            <p className="rc-page-subtitle mt-1">
              Side-by-side product analysis across carriers with ratings, features, and suitability scoring
            </p>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <div className="flex items-center gap-2 mr-2">
              <Switch checked={compareMode} onCheckedChange={setCompareMode} />
              <Label className="text-sm text-[#c8d8ec]">Compare Mode</Label>
            </div>
            <Button variant="outline" onClick={copyComparison} className="rc-btn rc-btn-ghost border-[#12233e] text-[#c8d8ec]">
              <Copy className="h-4 w-4 mr-1" /> Copy
            </Button>
            <Button variant="outline" onClick={exportCSV} className="rc-btn rc-btn-ghost border-[#12233e] text-[#c8d8ec]">
              <ArrowUpRight className="h-4 w-4 mr-1" /> Export CSV
            </Button>
            <ExportToSlides
              toolName="Carrier Product Comparison"
              getSections={() => [
                {
                  title: "Carrier Product Comparison",
                  items: [
                    { label: "Selected Type", value: selectedType },
                    { label: "Compare Mode", value: compareMode ? "On" : "Off" },
                    { label: "Compared Products", value: comparedProducts.length > 0 ? comparedProducts.map((p) => p.carrier).join(", ") : "None" }
                  ]
                }
              ]}
            />
          </div>
        </div>

        {/* Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5">
            <div className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#7a95b8]" />
              Product Types Distribution
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={productTypeData.length > 0 ? productTypeData : [{ name: "Empty", value: 1 }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(productTypeData.length > 0 ? productTypeData : [{ name: "Empty", value: 1 }]).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={["#22c55e", "#3b82f6", "#f0c040", "#a78bfa", "#ef4444"][index % 5]} />
                  ))}
                </Pie>
                <RTooltip contentStyle={{ background: "#0d1a2e", border: "1px solid #12233e", borderRadius: 8, color: "#c8d8ec", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5">
            <div className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#7a95b8]" />
              Carrier Scores Comparison
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={scoreData.length > 0 ? scoreData : [{ name: "Empty", score: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                <XAxis dataKey="name" stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} domain={['auto', 100]} />
                <RTooltip contentStyle={{ background: "#0d1a2e", border: "1px solid #12233e", borderRadius: 8, color: "#c8d8ec", fontSize: 12 }} cursor={{ fill: '#12233e' }} />
                <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Additional Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5">
            <div className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#7a95b8]" />
              Score Trend
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={scoreData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                <XAxis dataKey="name" stroke="#7a95b8" fontSize={10} />
                <YAxis stroke="#7a95b8" fontSize={10} />
                <RTooltip contentStyle={{ background: "#0d1a2e", border: "1px solid #12233e", borderRadius: 8 }} />
                <Line type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5">
            <div className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#7a95b8]" />
              Carrier Ratings
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={scoreData}>
                <PolarGrid stroke="#12233e" />
                <PolarAngleAxis dataKey="name" stroke="#7a95b8" fontSize={10} />
                <PolarRadiusAxis stroke="#7a95b8" fontSize={10} />
                <Radar name="Score" dataKey="score" stroke="#f0c040" fill="#f0c040" fillOpacity={0.6} />
                <RTooltip contentStyle={{ background: "#0d1a2e", border: "1px solid #12233e", borderRadius: 8 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5">
            <div className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#7a95b8]" />
              Surrender Years
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={PRODUCTS}>
                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                <XAxis dataKey="carrier" stroke="#7a95b8" fontSize={10} />
                <YAxis stroke="#7a95b8" fontSize={10} />
                <RTooltip contentStyle={{ background: "#0d1a2e", border: "1px solid #12233e", borderRadius: 8 }} />
                <Area type="monotone" dataKey="surrenderYears" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5">
            <div className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-[#7a95b8]" />
              Cap vs Par Rate
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                <XAxis type="number" dataKey="score" name="Score" stroke="#7a95b8" fontSize={10} />
                <YAxis type="number" dataKey="surrenderYears" name="Surrender" stroke="#7a95b8" fontSize={10} />
                <RTooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ background: "#0d1a2e", border: "1px solid #12233e", borderRadius: 8 }} />
                <Scatter name="Products" data={PRODUCTS} fill="#ef4444" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          
          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5">
            <div className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#7a95b8]" />
              Composed Analysis
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <ComposedChart data={PRODUCTS}>
                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                <XAxis dataKey="carrier" stroke="#7a95b8" fontSize={10} />
                <YAxis stroke="#7a95b8" fontSize={10} />
                <RTooltip contentStyle={{ background: "#0d1a2e", border: "1px solid #12233e", borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="score" fill="#3b82f6" />
                <Line type="monotone" dataKey="surrenderYears" stroke="#f0c040" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 justify-between mb-6">
          <Tabs value={selectedType} onValueChange={setSelectedType} className="w-full md:w-auto">
            <TabsList className="bg-[#0d1a2e] border border-[#12233e]">
              <TabsTrigger value="all" className="data-[state=active]:bg-[#12233e] data-[state=active]:text-white text-[#7a95b8]">All Products</TabsTrigger>
              <TabsTrigger value="iul" className="data-[state=active]:bg-[#12233e] data-[state=active]:text-white text-[#7a95b8]">IUL</TabsTrigger>
              <TabsTrigger value="fia" className="data-[state=active]:bg-[#12233e] data-[state=active]:text-white text-[#7a95b8]">FIA</TabsTrigger>
              <TabsTrigger value="myga" className="data-[state=active]:bg-[#12233e] data-[state=active]:text-white text-[#7a95b8]">MYGA</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#7a95b8]" />
            <Input
              type="text"
              placeholder="Search carriers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rc-input pl-9 bg-[#0d1a2e] border-[#12233e] text-[#c8d8ec] placeholder:text-[#7a95b8]"
            />
          </div>
        </div>

        {compareMode && selectedProducts.length > 0 ? (
          /* Side-by-side Comparison */
          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-[#12233e]">
              <h3 className="text-lg font-semibold text-white">Side-by-Side Comparison</h3>
              <p className="text-sm text-[#7a95b8]">Comparing {comparedProducts.length} products</p>
            </div>
            <div className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#12233e] bg-[#0b1628]">
                      <th className="text-left p-4 font-medium w-40 text-[#c8d8ec]">Feature</th>
                      {comparedProducts.map((p) => (
                        <th key={p.product} className="text-center p-4 font-medium text-white">
                          {p.carrier}<br />
                          <span className="text-xs font-normal text-[#7a95b8]">{p.product}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: "Rating", key: "rating" },
                      { label: "Cap Rate", key: "capRate" },
                      { label: "Par Rate", key: "parRate" },
                      { label: "Floor", key: "floor" },
                      { label: "Spread", key: "spread" },
                      { label: "Surrender Years", key: "surrenderYears" },
                      { label: "Min Premium", key: "minPremium" },
                      { label: "Loan Rate", key: "loanRate" },
                      { label: "Score", key: "score" },
                      { label: "Best For", key: "bestFor" },
                    ].map((row) => (
                      <tr key={row.key} className="border-b border-[#12233e] hover:bg-[#12233e]/50 transition-colors">
                        <td className="p-4 font-medium text-[#c8d8ec]">{row.label}</td>
                        {comparedProducts.map((p) => (
                          <td key={p.product} className="p-4 text-center text-[#c8d8ec]">
                            {row.key === "score" ? (
                              <Badge className={`rc-badge ${(p as any)[row.key] >= 90 ? "rc-badge-green" : (p as any)[row.key] >= 85 ? "rc-badge-blue" : "rc-badge-gold"}`}>
                                {(p as any)[row.key]}/100
                              </Badge>
                            ) : (
                              <span>{String((p as any)[row.key])}</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                    <tr className="border-b border-[#12233e] hover:bg-[#12233e]/50 transition-colors">
                      <td className="p-4 font-medium text-[#c8d8ec]">Index Options</td>
                      {comparedProducts.map((p) => (
                        <td key={p.product} className="p-4 text-center">
                          <div className="flex flex-wrap gap-1 justify-center">
                            {p.indexOptions.map((idx) => <Badge key={idx} variant="outline" className="text-[10px] border-[#12233e] text-[#c8d8ec] bg-[#0b1628]">{idx}</Badge>)}
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-[#12233e] hover:bg-[#12233e]/50 transition-colors">
                      <td className="p-4 font-medium text-[#c8d8ec]">Riders</td>
                      {comparedProducts.map((p) => (
                        <td key={p.product} className="p-4 text-center">
                          <div className="flex flex-wrap gap-1 justify-center">
                            {p.riders.map((r) => <Badge key={r} variant="outline" className="text-[10px] border-[#12233e] text-[#c8d8ec] bg-[#0b1628]">{r}</Badge>)}
                          </div>
                        </td>
                      ))}
                    </tr>
                    <tr className="border-b border-[#12233e] hover:bg-[#12233e]/50 transition-colors">
                      <td className="p-4 font-medium text-[#c8d8ec]">Strengths</td>
                      {comparedProducts.map((p) => (
                        <td key={p.product} className="p-4">
                          <ul className="space-y-1.5 text-left">
                            {p.strengths.map((s) => (
                              <li key={s} className="flex items-start gap-1.5 text-xs text-[#c8d8ec]">
                                <CheckCircle2 className="h-3.5 w-3.5 text-[#22c55e] shrink-0 mt-0.5" />
                                <span>{s}</span>
                              </li>
                            ))}
                          </ul>
                        </td>
                      ))}
                    </tr>
                    <tr className="hover:bg-[#12233e]/50 transition-colors">
                      <td className="p-4 font-medium text-[#c8d8ec]">Weaknesses</td>
                      {comparedProducts.map((p) => (
                        <td key={p.product} className="p-4">
                          <ul className="space-y-1.5 text-left">
                            {p.weaknesses.map((w) => (
                              <li key={w} className="flex items-start gap-1.5 text-xs text-[#c8d8ec]">
                                <XCircle className="h-3.5 w-3.5 text-[#ef4444] shrink-0 mt-0.5" />
                                <span>{w}</span>
                              </li>
                            ))}
                          </ul>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="m-4 flex items-start gap-2 px-4 py-3 rounded-lg bg-[#f0c040]/10 border border-[#f0c040]/20 text-xs text-[#f0c040]/90">
                <Info className="w-4 h-4 mt-0.5 shrink-0 text-[#f0c040]" />
                <span>
                  <strong className="text-[#f0c040] font-semibold">Policy Loan Rate Disclosure:</strong>{" "}
                  Stated loan rates shown above are carrier-quoted rates. The actual net cost to the policyholder
                  is typically only the 0.50% "wash" spread (positive arbitrage) because borrowed funds continue
                  earning index credits. The stated loan rate significantly overstates the true borrowing cost.
                  Loan rates and arbitrage spreads are not guaranteed and may vary by carrier and policy year.
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Product Cards */
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.length > 0 ? filteredProducts.map((product) => (
              <div key={product.product} className={`rc-card bg-[#0d1a2e] border rounded-2xl p-5 hover:border-[#3b82f6]/50 transition-all duration-200 ${compareMode && selectedProducts.includes(product.product) ? "border-[#3b82f6] shadow-[0_0_15px_rgba(59,130,246,0.15)]" : "border-[#12233e]"}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-white">{product.carrier}</h3>
                    <p className="text-sm text-[#7a95b8]">{product.product}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={`rc-badge ${product.score >= 90 ? "rc-badge-green" : product.score >= 85 ? "rc-badge-blue" : "rc-badge-gold"}`}>
                      {product.score}/100
                    </Badge>
                    {compareMode && (
                      <Button 
                        variant={selectedProducts.includes(product.product) ? "default" : "outline"} 
                        size="sm" 
                        onClick={() => toggleProduct(product.product)}
                        className={`h-7 text-xs ${selectedProducts.includes(product.product) ? "bg-[#3b82f6] text-white hover:bg-[#2563eb] border-none" : "rc-btn-ghost border-[#12233e] text-[#c8d8ec]"}`}
                      >
                        {selectedProducts.includes(product.product) ? "Selected" : "Compare"}
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl bg-[#0b1628] border border-[#12233e]">
                      <div className="rc-stat-label text-[10px] uppercase tracking-wider text-[#7a95b8]">Rating</div>
                      <div className="rc-stat-value text-sm font-medium text-white">{product.rating}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#0b1628] border border-[#12233e]">
                      <div className="rc-stat-label text-[10px] uppercase tracking-wider text-[#7a95b8]">Cap Rate</div>
                      <div className="rc-stat-value text-sm font-medium text-[#22c55e]">{product.capRate}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#0b1628] border border-[#12233e]">
                      <div className="rc-stat-label text-[10px] uppercase tracking-wider text-[#7a95b8]">Par Rate</div>
                      <div className="rc-stat-value text-sm font-medium text-white">{product.parRate}</div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[#0b1628] border border-[#12233e]">
                      <div className="rc-stat-label text-[10px] uppercase tracking-wider text-[#7a95b8]">Floor</div>
                      <div className="rc-stat-value text-sm font-medium text-[#3b82f6]">{product.floor}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {product.riders.slice(0, 3).map((r) => <Badge key={r} variant="outline" className="text-[10px] border-[#12233e] text-[#c8d8ec] bg-[#0b1628] px-1.5 py-0">{r}</Badge>)}
                    {product.riders.length > 3 && <Badge variant="outline" className="text-[10px] border-[#12233e] text-[#7a95b8] bg-[#0b1628] px-1.5 py-0">+{product.riders.length - 3}</Badge>}
                  </div>

                  <div className="space-y-1.5">
                    {product.strengths.slice(0, 2).map((s) => (
                      <div key={s} className="flex items-start gap-1.5 text-xs text-[#c8d8ec]">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#22c55e] shrink-0 mt-0.5" />
                        <span className="line-clamp-1">{s}</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 rounded-xl bg-[#3b82f6]/5 border border-[#3b82f6]/10 mt-2">
                    <div className="text-[10px] uppercase tracking-wider text-[#3b82f6] font-semibold mb-1">Best For</div>
                    <div className="text-xs text-[#c8d8ec] leading-snug">{product.bestFor}</div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-12 w-12 text-[#12233e] mb-4" />
                <h3 className="text-lg font-medium text-white">No products found</h3>
                <p className="text-[#7a95b8] mt-1">Try adjusting your filters or search query</p>
                <Button 
                  variant="outline" 
                  className="mt-4 rc-btn-ghost border-[#12233e] text-[#c8d8ec]"
                  onClick={() => { setSelectedType("all"); setSearchQuery(""); }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        )}

        <NAICDisclaimer variant="compact" />
        <PageInsights pageId="carrier-comparison" />
      </div>
    
        <ComplianceFooter pageName="CarrierComparison" showsIUL showsTax showsEstate showsProjections showsHistoricalData showsPolicyLoans />
      </AppShell>
  );
}

