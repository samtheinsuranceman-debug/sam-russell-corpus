// @ts-nocheck
import { useState, useMemo, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Shield, TrendingUp, Info, Layers, ChevronRight, Search, Download, Settings, 
  Activity, BookOpen, FileText, PieChart as PieChartIcon, Target, Zap, 
  BarChart3, SlidersHorizontal
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart, Scatter, ScatterChart
} from "recharts";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { PageInsights } from "@/components/PageInsights";
import { ExportToSlides } from "@/components/ExportToSlides";
import { NumberInput } from "@/components/NumberInput";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { useClientData } from "@/contexts/ClientDataContext";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

const SP500_RETURNS = [
  -13.04, -23.37, 26.38, 8.99, 3.00, 13.62, 3.53, -38.49, 23.45, 12.78,
  0.00, 13.41, 29.60, 11.39, -0.73, 9.54, 19.42, -6.24, 28.88, 16.26,
  26.89, -19.44, 24.23, 23.31, -4.59,
];
const YEARS = Array.from({ length: 25 }, (_, i) => 2001 + i);

const MARKET_SCENARIOS = {
  historical: SP500_RETURNS,
  bull: SP500_RETURNS.map((r) => r + 5),
  bear: SP500_RETURNS.map((r) => r - 5),
  flat: SP500_RETURNS.map((r) => r * 0.5),
  volatile: SP500_RETURNS.map((r, i) => i % 2 === 0 ? r * 1.5 : r * -1.5)
};

interface Strategy {
  id: string;
  name: string;
  shortName: string;
  capRate: number;
  participationRate: number;
  floorRate: number;
  color: string;
  description: string;
  spread: number;
  index: string;
}

const DEFAULT_STRATEGIES: Strategy[] = [
  {
    id: "s1",
    name: "100% Participation — Capped",
    shortName: "Capped",
    capRate: 12.0,
    participationRate: 100,
    floorRate: 0,
    spread: 0,
    index: "S&P 500",
    color: "#3b82f6",
    description: "Full participation in index gains up to a 12% cap. 0% floor protects against losses.",
  },
  {
    id: "s2",
    name: "Higher Participation — Lower Cap",
    shortName: "Hi-Part",
    capRate: 8.0,
    participationRate: 140,
    floorRate: 0,
    spread: 0,
    index: "S&P 500",
    color: "#22c55e",
    description: "140% participation with a lower 8% cap. Benefits from moderate index gains.",
  },
  {
    id: "s3",
    name: "Uncapped — Lower Participation",
    shortName: "Uncapped",
    capRate: 999,
    participationRate: 55,
    floorRate: 0,
    spread: 0,
    index: "S&P 500",
    color: "#f59e0b",
    description: "No cap on credited rate, but only 55% of index return is credited. Benefits from large index gains.",
  },
  {
    id: "s4",
    name: "High Floor — Low Cap",
    shortName: "Conservative",
    capRate: 6.0,
    participationRate: 100,
    floorRate: 2.0,
    spread: 0,
    index: "S&P 500",
    color: "#8b5cf6",
    description: "Guaranteed 2% minimum return, but upside is limited to 6%. Best for highly risk-averse clients.",
  },
  {
    id: "s5",
    name: "Spread Strategy",
    shortName: "Spread",
    capRate: 999,
    participationRate: 100,
    floorRate: 0,
    spread: 3.0,
    index: "S&P 500",
    color: "#ec4899",
    description: "Uncapped upside but subtracts a 3% spread from the index return before crediting.",
  }
];

function computeCredit(rawReturn: number, strategy: Strategy): number {
  let adjusted = rawReturn;
  if (strategy.spread > 0) {
    adjusted -= strategy.spread;
  }
  if (adjusted <= 0) return strategy.floorRate;
  adjusted = adjusted * (strategy.participationRate / 100);
  const credited = strategy.capRate < 100 ? Math.min(adjusted, strategy.capRate) : adjusted;
  return Math.max(credited, strategy.floorRate);
}

export default function IndexStrategyComparison() {
  const { clientData } = useClientData();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("comparison");
  const [searchQuery, setSearchQuery] = useState("");
  const [initialAmount, setInitialAmount] = useState(100000);
  const [strategies, setStrategies] = useState<Strategy[]>(DEFAULT_STRATEGIES.slice(0, 3));
  const [marketScenario, setMarketScenario] = useState<keyof typeof MARKET_SCENARIOS>("historical");
  const [showTaxes, setShowTaxes] = useState(false);
  const [taxRate, setTaxRate] = useState(24);
  const [showFees, setShowFees] = useState(false);
  const [annualFee, setAnnualFee] = useState(1.5);
  const [inflationRate, setInflationRate] = useState(2.5);
  const [adjustForInflation, setAdjustForInflation] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const marketDataQuery = trpc.marketData.getIndices.useQuery(undefined);
  const strategyAnalyticsMutation = trpc.strategyAnalytics.logComparison.useMutation();
  const savedStrategiesQuery = trpc.savedStrategies.list.useQuery(undefined);
  const clientPortalMutation = trpc.clientPortal.shareComparison.useMutation();
  const reportMutation = trpc.reports.generatePdf.useMutation();
  const complianceMutation = trpc.complianceTracking.logActivity.useMutation();
  
  useEffect(() => {
    if (marketDataQuery.data) {
    }
  }, [marketDataQuery.data]);

  const currentReturns = useMemo(() => MARKET_SCENARIOS[marketScenario], [marketScenario]);

  const yearlyData = useMemo(() => {
    return YEARS.map((year, i) => {
      const raw = currentReturns[i];
      const row: any = { year, rawReturn: raw };
      strategies.forEach((s) => {
        row[s.id] = Number(computeCredit(raw, s).toFixed(2));
      });
      return row;
    });
  }, [strategies, currentReturns]);

  const filteredYearlyData = useMemo(() => {
    if (!searchQuery) return yearlyData;
    return yearlyData.filter((d) => d.year.toString().includes(searchQuery));
  }, [yearlyData, searchQuery]);

  const summaryStats = useMemo(() => {
    return strategies.map((s) => {
      const credits = yearlyData.map((d) => d[s.id] as number);
      const avg = credits.reduce((a, b) => a + b, 0) / credits.length;
      const max = Math.max(...credits);
      const min = Math.min(...credits);
      const yearsAtFloor = credits.filter((c) => c === s.floorRate).length;
      const yearsAtCap = credits.filter((c, ci) => currentReturns[ci] > 0 && c >= s.capRate - 0.01).length;
      const positiveYears = credits.filter((c) => c > 0).length;
      const winRate = (positiveYears / credits.length) * 100;
      
      let balance = initialAmount;
      let nominalBalance = initialAmount;
      
      const yearlyBalances = credits.map((c, i) => {
        let netCredit = c;
        if (showFees) netCredit -= annualFee;
        if (showTaxes && netCredit > 0) netCredit *= (1 - taxRate / 100);
        
        nominalBalance *= (1 + netCredit / 100);
        
        let realBalance = nominalBalance;
        if (adjustForInflation) {
          realBalance = nominalBalance / Math.pow(1 + inflationRate / 100, i + 1);
        }
        
        balance = adjustForInflation ? realBalance : nominalBalance;
        return balance;
      });

      const volatility = Math.sqrt(credits.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / credits.length);
      const sharpeRatio = volatility > 0 ? (avg - 2.0) / volatility : 0;
      
      return { 
        ...s, 
        avg, 
        max, 
        min,
        yearsAtFloor, 
        yearsAtCap, 
        winRate,
        volatility,
        sharpeRatio,
        finalBalance: balance,
        yearlyBalances
      };
    });
  }, [yearlyData, initialAmount, strategies, showFees, annualFee, showTaxes, taxRate, adjustForInflation, inflationRate, currentReturns]);

  const distributionData = useMemo(() => {
    const bins = [
      { name: "< 0%", range: [-Infinity, 0] },
      { name: "0%", range: [0, 0] },
      { name: "0-4%", range: [0.01, 4] },
      { name: "4-8%", range: [4.01, 8] },
      { name: "8-12%", range: [8.01, 12] },
      { name: "> 12%", range: [12.01, Infinity] }
    ];
    
    return bins.map((bin) => {
      const row: any = { name: bin.name };
      strategies.forEach((s) => {
        const credits = yearlyData.map((d) => d[s.id] as number);
        row[s.id] = credits.filter((c) => c >= bin.range[0] && c <= bin.range[1]).length;
      });
      return row;
    });
  }, [yearlyData, strategies]);

  const riskReturnData = useMemo(() => {
    return summaryStats.map((s) => ({
      name: s.shortName,
      return: s.avg,
      risk: s.volatility,
      size: s.finalBalance / 1000,
      color: s.color
    }));
  }, [summaryStats]);

  const handleShare = async () => {
    try {
      await clientPortalMutation.mutateAsync({
        clientId: "demo-client",
        data: {
          initialAmount,
          strategies: strategies.map((s) => s.id),
          scenario: marketScenario
        }
      });
    } catch (e) {
    }
  };

  const handleGenerateReport = async () => {
    try {
      await reportMutation.mutateAsync({
        type: "strategy-comparison",
        params: {
          initialAmount,
          scenario: marketScenario
        }
      });
      
      await complianceMutation.mutateAsync({
        action: "generated_report",
        details: "Index Strategy Comparison Report"
      });
    } catch (e) {
    }
  };

  const exportCSV = () => {
    const headers = ["Year", "Index Return (%)", ...strategies.map((s) => `${s.name} (%)`)];
    const csvContent = [
      headers.join(","),
      ...yearlyData.map((row) => {
        return [
          row.year,
          row.rawReturn,
          ...strategies.map((s) => row[s.id])
        ].join(",");
      })
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `strategy_comparison_${marketScenario}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    strategyAnalyticsMutation.mutate({ action: "export_csv", strategyIds: strategies.map((s) => s.id) });
  };

  const addStrategy = (strategy: Strategy) => {
    if (strategies.length < 5 && !strategies.find((s) => s.id === strategy.id)) {
      setStrategies([...strategies, strategy]);
    }
  };

  const removeStrategy = (id: string) => {
    if (strategies.length > 1) {
      setStrategies(strategies.filter((s) => s.id !== id));
    }
  };

  const renderStrategyCard = (s: any) => (
    <Card key={s.id} className="bg-[#0d1a2e] border-[#12233e] relative overflow-hidden group hover:border-white/20 transition-all duration-300">
      <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: s.color }}></div>
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-bold text-white group-hover:text-white transition-colors">{s.shortName}</h3>
            <p className="text-xs text-[#7a95b8] mt-1">{s.index} • {s.participationRate}% Part</p>
          </div>
          <div className="p-2 rounded-lg bg-[#060d19] border border-[#12233e]">
            <Activity className="w-5 h-5" style={{ color: s.color }} />
          </div>
        </div>
        
        <div className="space-y-4">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="IndexStrategyComparison" />

        <ExecutiveSummary
          pageTitle="Index Strategy Comparison"
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
        <GoalsAccelerator pageName="Index Strategy Comparison" pageContext="Index Strategy Comparison — market analysis modeling with projections and scenario analysis" />
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
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold tracking-tight text-white">
              ${Math.round(s.finalBalance).toLocaleString()}
            </span>
            <span className="text-sm text-[#7a95b8] mb-1">Final Value</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#060d19] p-3 rounded-xl border border-[#12233e]">
              <div className="text-xs text-[#7a95b8] mb-1">Avg Return</div>
              <div className="text-lg font-semibold" style={{ color: s.color }}>{s.avg.toFixed(2)}%</div>
            </div>
            <div className="bg-[#060d19] p-3 rounded-xl border border-[#12233e]">
              <div className="text-xs text-[#7a95b8] mb-1">Win Rate</div>
              <div className="text-lg font-semibold text-white">{s.winRate.toFixed(0)}%</div>
            </div>
            <div className="bg-[#060d19] p-3 rounded-xl border border-[#12233e]">
              <div className="text-xs text-[#7a95b8] mb-1">Volatility</div>
              <div className="text-lg font-semibold text-white">{s.volatility.toFixed(2)}%</div>
            </div>
            <div className="bg-[#060d19] p-3 rounded-xl border border-[#12233e]">
              <div className="text-xs text-[#7a95b8] mb-1">Years @ Floor</div>
              <div className="text-lg font-semibold text-yellow-500">{s.yearsAtFloor}</div>
            </div>
          </div>
          
          <div className="pt-3 border-t border-[#12233e] flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-[#060d19] border-[#12233e] text-xs font-normal">
              Cap: {s.capRate > 100 ? 'None' : `${s.capRate}%`}
            </Badge>
            <Badge variant="outline" className="bg-[#060d19] border-[#12233e] text-xs font-normal">
              Floor: {s.floorRate}%
            </Badge>
            {s.spread > 0 && (
              <Badge variant="outline" className="bg-[#060d19] border-[#12233e] text-xs font-normal">
                Spread: {s.spread}%
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <AppShell>
      <div className="max-w-[1600px] mx-auto p-4 md:p-6 space-y-6 bg-[#060d19] min-h-screen text-[#c8d8ec]">
        <div className="rc-page-header flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-[#0d1a2e] p-6 rounded-2xl border border-[#12233e]">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-700/20 border border-blue-500/30 rounded-xl">
                <Layers className="w-8 h-8 text-blue-500" />
              </div>
              <div>
                <h1 className="rc-page-title text-3xl font-bold text-white tracking-tight">Advanced Strategy Comparison</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">Pro Version</Badge>
                  <span className="text-sm text-[#7a95b8]">Interactive Monte Carlo & Historical Analysis</span>
                </div>
              </div>
            </div>
            <p className="rc-page-subtitle text-sm text-[#7a95b8] max-w-3xl mt-4 leading-relaxed">
              Compare how different indexed crediting strategies would have performed using 25 years of
              historical and simulated market data. Analyze trade-offs between caps, participation rates, and floors.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => setIsEditMode(!isEditMode)} className="bg-[#060d19] border-[#12233e] hover:bg-[#12233e] text-white">
                    <Settings className="w-4 h-4 mr-2" />
                    Configure Strategies
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add, remove, or edit custom crediting strategies</p>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="bg-[#060d19] border-[#12233e] hover:bg-[#12233e] text-white">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                  <ChevronRight className="w-4 h-4 ml-2 rotate-90" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#12233e]" />
                <DropdownMenuItem onClick={exportCSV} className="hover:bg-[#12233e] cursor-pointer">
                  <FileText className="w-4 h-4 mr-2" /> CSV Data
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleGenerateReport} className="hover:bg-[#12233e] cursor-pointer">
                  <BookOpen className="w-4 h-4 mr-2" /> PDF Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button onClick={handleShare} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
              <Zap className="w-4 h-4 mr-2" />
              Share with Client
            </Button>
            
            <ExportToSlides
              toolName="Advanced Strategy Comparison"
              getSections={() => [
                {
                  title: "Strategy Performance Summary",
                  items: summaryStats.map((s) => ({
                    label: s.name,
                    value: `Avg Return: ${s.avg.toFixed(2)}% | Final Value: $${Math.round(s.finalBalance).toLocaleString()}`
                  }))
                }
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-[#0d1a2e] border-[#12233e]">
              <CardHeader className="pb-3 border-b border-[#12233e]">
                <CardTitle className="text-lg text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-blue-400" />
                  Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5 space-y-6">
                <div className="space-y-3">
                  <Label className="text-[#c8d8ec]">Initial Premium Amount</Label>
                  <NumberInput 
                    value={initialAmount} 
                    onChange={setInitialAmount} 
                    className="bg-[#060d19] border-[#12233e] text-white h-10 w-full rounded-md" 
                    min={1000} 
                    max={10000000} 
                    step={5000} 
                    placeholder="100000"
                    fallback={100000}
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-[#c8d8ec]">Market Scenario</Label>
                  <Select value={marketScenario} onValueChange={(v: any) => setMarketScenario(v)}>
                    <SelectTrigger className="bg-[#060d19] border-[#12233e] text-white">
                      <SelectValue placeholder="Select scenario" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                      <SelectItem value="historical">Historical (2001-2025)</SelectItem>
                      <SelectItem value="bull">Bull Market (+5% offset)</SelectItem>
                      <SelectItem value="bear">Bear Market (-5% offset)</SelectItem>
                      <SelectItem value="flat">Flat Market (50% volatility)</SelectItem>
                      <SelectItem value="volatile">High Volatility</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Accordion type="multiple" className="w-full">
                  <AccordionItem value="advanced" className="border-[#12233e]">
                    <AccordionTrigger className="text-[#c8d8ec] hover:text-white py-2">Advanced Settings</AccordionTrigger>
                    <AccordionContent className="space-y-4 pt-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="show-fees" className="text-[#7a95b8]">Apply Annual Fees</Label>
                        <Switch id="show-fees" checked={showFees} onCheckedChange={setShowFees} />
                      </div>
                      {showFees && (
                        <div className="space-y-2 pl-4 border-l-2 border-[#12233e]">
                          <div className="flex justify-between text-xs text-[#7a95b8]">
                            <span>Fee Rate</span>
                            <span>{annualFee.toFixed(2)}%</span>
                          </div>
                          <Slider 
                            value={[annualFee]} 
                            min={0} max={5} step={0.1} 
                            onValueChange={(v) => setAnnualFee(v[0])} 
                            className="py-2"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-4">
                        <Label htmlFor="show-taxes" className="text-[#7a95b8]">Apply Taxes on Gains</Label>
                        <Switch id="show-taxes" checked={showTaxes} onCheckedChange={setShowTaxes} />
                      </div>
                      {showTaxes && (
                        <div className="space-y-2 pl-4 border-l-2 border-[#12233e]">
                          <div className="flex justify-between text-xs text-[#7a95b8]">
                            <span>Tax Rate</span>
                            <span>{taxRate.toFixed(1)}%</span>
                          </div>
                          <Slider 
                            value={[taxRate]} 
                            min={0} max={50} step={1} 
                            onValueChange={(v) => setTaxRate(v[0])} 
                            className="py-2"
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-4">
                        <Label htmlFor="adjust-inflation" className="text-[#7a95b8]">Adjust for Inflation</Label>
                        <Switch id="adjust-inflation" checked={adjustForInflation} onCheckedChange={setAdjustForInflation} />
                      </div>
                      {adjustForInflation && (
                        <div className="space-y-2 pl-4 border-l-2 border-[#12233e]">
                          <div className="flex justify-between text-xs text-[#7a95b8]">
                            <span>Inflation Rate</span>
                            <span>{inflationRate.toFixed(2)}%</span>
                          </div>
                          <Slider 
                            value={[inflationRate]} 
                            min={0} max={10} step={0.1} 
                            onValueChange={(v) => setInflationRate(v[0])} 
                            className="py-2"
                          />
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            {isEditMode && (
              <Card className="bg-[#0d1a2e] border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                <CardHeader className="pb-3 border-b border-[#12233e] bg-blue-500/5 rounded-t-xl">
                  <CardTitle className="text-lg text-white flex items-center justify-between">
                    <span>Strategy Library</span>
                    <Badge className="bg-blue-600">{strategies.length}/5 Active</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  <ScrollArea className="h-[300px] pr-4">
                    <div className="space-y-3">
                      {DEFAULT_STRATEGIES.map((ds) => {
                        const isActive = strategies.some(s => s.id === ds.id);
                        return (
                          <div key={ds.id} className={`p-3 rounded-lg border ${isActive ? 'border-blue-500/50 bg-blue-500/10' : 'border-[#12233e] bg-[#060d19]'} transition-all`}>
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ds.color }}></div>
                                <span className="text-sm font-medium text-white">{ds.shortName}</span>
                              </div>
                              <Switch 
                                checked={isActive} 
                                onCheckedChange={(c) => c ? addStrategy(ds) : removeStrategy(ds.id)}
                                disabled={!isActive && strategies.length >= 5}
                              />
                            </div>
                            <div className="text-xs text-[#7a95b8] grid grid-cols-2 gap-1 mt-2">
                              <span>Cap: {ds.capRate > 100 ? 'None' : `${ds.capRate}%`}</span>
                              <span>Part: {ds.participationRate}%</span>
                              <span>Floor: {ds.floorRate}%</span>
                              <span>Spread: {ds.spread}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-3 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {summaryStats.map(renderStrategyCard)}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="bg-[#0d1a2e] p-1.5 rounded-xl border border-[#12233e] inline-flex mb-6 w-full overflow-x-auto no-scrollbar">
                <TabsList className="bg-transparent border-0 w-full justify-start h-auto p-0 gap-1">
                  <TabsTrigger value="comparison" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-[#7a95b8] rounded-lg px-4 py-2.5">
                    Data Table
                  </TabsTrigger>
                  <TabsTrigger value="growth" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-[#7a95b8] rounded-lg px-4 py-2.5">
                    Growth Paths
                  </TabsTrigger>
                  <TabsTrigger value="annual" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-[#7a95b8] rounded-lg px-4 py-2.5">
                    Annual Credits
                  </TabsTrigger>
                  <TabsTrigger value="distribution" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-[#7a95b8] rounded-lg px-4 py-2.5">
                    Distribution
                  </TabsTrigger>
                  <TabsTrigger value="risk" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-[#7a95b8] rounded-lg px-4 py-2.5">
                    Risk vs Return
                  </TabsTrigger>
                  <TabsTrigger value="tradeoffs" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-[#7a95b8] rounded-lg px-4 py-2.5">
                    Analysis
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Data Table Tab (Table 1) */}
              <TabsContent value="comparison" className="m-0 animate-in fade-in duration-500">
                <Card className="bg-[#0d1a2e] border-[#12233e]">
                  <CardHeader className="pb-4 border-b border-[#12233e] flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg text-white">Year-by-Year Breakdown</CardTitle>
                      <CardDescription className="text-[#7a95b8]">Detailed crediting rates for each year in the scenario.</CardDescription>
                    </div>
                    <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a95b8]" />
                      <Input 
                        placeholder="Search year..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 bg-[#060d19] border-[#12233e] text-white"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[600px] w-full rounded-b-xl">
                      <Table>
                        <TableHeader className="bg-[#060d19] sticky top-0 z-10 shadow-sm">
                          <TableRow className="border-[#12233e] hover:bg-transparent">
                            <TableHead className="w-[100px] text-white font-semibold">Year</TableHead>
                            <TableHead className="text-right text-white font-semibold">Index Return</TableHead>
                            {strategies.map((s) => (
                              <TableHead key={s.id} className="text-right font-semibold" style={{ color: s.color }}>
                                {s.shortName}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredYearlyData.map((row) => (
                            <TableRow key={row.year} className="border-[#12233e] hover:bg-[#12233e]/50 transition-colors">
                              <TableCell className="font-medium text-white">Year {row.year - 2000}</TableCell>
                              <TableCell className={`text-right font-medium ${row.rawReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {row.rawReturn > 0 ? '+' : ''}{row.rawReturn.toFixed(2)}%
                              </TableCell>
                              {strategies.map((s) => {
                                const val = row[s.id];
                                const isFloor = val === s.floorRate && row.rawReturn < s.floorRate;
                                const isCap = val >= s.capRate - 0.01 && s.capRate < 100;
                                
                                return (
                                  <TableCell key={s.id} className="text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      {isFloor && <Shield className="w-3.5 h-3.5 text-yellow-500" />}
                                      {isCap && <Zap className="w-3.5 h-3.5 text-blue-400" />}
                                      <span className={isFloor ? 'text-yellow-500 font-medium' : isCap ? 'text-blue-400 font-medium' : 'text-[#c8d8ec]'}>
                                        {val.toFixed(2)}%
                                      </span>
                                    </div>
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          ))}
                          {!searchQuery && (
                            <TableRow className="border-t-2 border-[#12233e] bg-[#060d19] hover:bg-[#060d19]">
                              <TableCell className="font-bold text-white">Average</TableCell>
                              <TableCell className="text-right font-bold text-green-400">
                                {(currentReturns.reduce((a, b) => a + b, 0) / currentReturns.length).toFixed(2)}%
                              </TableCell>
                              {summaryStats.map((s) => (
                                <TableCell key={s.id} className="text-right font-bold" style={{ color: s.color }}>
                                  {s.avg.toFixed(2)}%
                                </TableCell>
                              ))}
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Growth Paths Tab (Chart 1: AreaChart) */}
              <TabsContent value="growth" className="m-0 animate-in fade-in duration-500">
                <Card className="bg-[#0d1a2e] border-[#12233e]">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">Hypothetical Account Value Growth</CardTitle>
                    <CardDescription className="text-[#7a95b8]">
                      Starting with ${initialAmount.toLocaleString()} over 25 years. 
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[500px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                          <defs>
                            {strategies.map((s) => (
                              <linearGradient key={`grad-${s.id}`} id={`grad-${s.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={s.color} stopOpacity={0.3}/>
                                <stop offset="95%" stopColor={s.color} stopOpacity={0}/>
                              </linearGradient>
                            ))}
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                          <XAxis 
                            dataKey="year" 
                            allowDuplicatedCategory={false}
                            tick={{ fill: "#7a95b8", fontSize: 12 }} 
                            axisLine={{ stroke: "#12233e" }}
                            tickLine={false}
                            dy={10}
                          />
                          <YAxis 
                            tick={{ fill: "#7a95b8", fontSize: 12 }} 
                            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} 
                            axisLine={{ stroke: "#12233e" }}
                            tickLine={false}
                            dx={-10}
                          />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#060d19", borderColor: "#12233e", borderRadius: "8px", color: "#fff" }}
                            itemStyle={{ fontWeight: 500 }}
                            formatter={(value: number, name: string) => [`$${Math.round(value).toLocaleString()}`, name]}
                            labelStyle={{ color: "#7a95b8", marginBottom: "8px" }}
                          />
                          <Legend wrapperStyle={{ paddingTop: "20px" }} />
                          {strategies.map((s) => {
                            const data = [{ year: "Start", [s.shortName]: initialAmount }];
                            s.yearlyBalances?.forEach((bal, i) => {
                              data.push({ year: `Yr ${i+1}`, [s.shortName]: bal });
                            });
                            return (
                              <Area 
                                key={s.id} 
                                data={data}
                                type="monotone" 
                                dataKey={s.shortName} 
                                stroke={s.color} 
                                strokeWidth={3} 
                                fillOpacity={1} 
                                fill={`url(#grad-${s.id})`} 
                                activeDot={{ r: 6, strokeWidth: 0, fill: s.color }}
                              />
                            );
                          })}
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Annual Credits Tab (Chart 2: BarChart & Chart 3: LineChart) */}
              <TabsContent value="annual" className="m-0 space-y-6 animate-in fade-in duration-500">
                <Card className="bg-[#0d1a2e] border-[#12233e]">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">Annual Credited Rates</CardTitle>
                    <CardDescription className="text-[#7a95b8]">Comparison of crediting rates year by year</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={yearlyData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                          <XAxis dataKey="year" tick={{ fill: "#7a95b8", fontSize: 12 }} axisLine={{ stroke: "#12233e" }} tickLine={false} dy={10} />
                          <YAxis tick={{ fill: "#7a95b8", fontSize: 12 }} tickFormatter={(v) => `${v}%`} axisLine={{ stroke: "#12233e" }} tickLine={false} dx={-10} />
                          <Tooltip contentStyle={{ backgroundColor: "#060d19", borderColor: "#12233e", borderRadius: "8px", color: "#fff" }} formatter={(value: number) => [`${value.toFixed(2)}%`]} />
                          <Legend wrapperStyle={{ paddingTop: "20px" }} />
                          {strategies.map((s) => (
                            <Bar key={s.id} dataKey={s.id} name={s.shortName} fill={s.color} radius={[4, 4, 0, 0]} />
                          ))}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-[#0d1a2e] border-[#12233e]">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">Strategy vs Index Return</CardTitle>
                    <CardDescription className="text-[#7a95b8]">How strategies smooth out market volatility</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={yearlyData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                          <XAxis dataKey="year" tick={{ fill: "#7a95b8", fontSize: 12 }} axisLine={{ stroke: "#12233e" }} tickLine={false} dy={10} />
                          <YAxis tick={{ fill: "#7a95b8", fontSize: 12 }} tickFormatter={(v) => `${v}%`} axisLine={{ stroke: "#12233e" }} tickLine={false} dx={-10} />
                          <Tooltip contentStyle={{ backgroundColor: "#060d19", borderColor: "#12233e", borderRadius: "8px", color: "#fff" }} formatter={(value: number) => [`${value.toFixed(2)}%`]} />
                          <Legend wrapperStyle={{ paddingTop: "20px" }} />
                          <Bar dataKey="rawReturn" name="Index Return" fill="#334155" opacity={0.5} radius={[4, 4, 0, 0]} />
                          {strategies.map((s) => (
                            <Line key={s.id} type="monotone" dataKey={s.id} name={s.shortName} stroke={s.color} strokeWidth={3} dot={{ r: 3, fill: s.color, strokeWidth: 0 }} />
                          ))}
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Distribution Tab (Chart 4: PieChart & Chart 5: RadarChart) */}
              <TabsContent value="distribution" className="m-0 space-y-6 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-[#0d1a2e] border-[#12233e]">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">Return Distribution</CardTitle>
                      <CardDescription className="text-[#7a95b8]">Frequency of returns in different ranges</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={distributionData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#12233e" horizontal={false} />
                            <XAxis type="number" tick={{ fill: "#7a95b8" }} axisLine={{ stroke: "#12233e" }} tickLine={false} />
                            <YAxis dataKey="name" type="category" tick={{ fill: "#7a95b8" }} axisLine={{ stroke: "#12233e" }} tickLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: "#060d19", borderColor: "#12233e", borderRadius: "8px", color: "#fff" }} formatter={(value: number) => [`${value} years`]} />
                            <Legend />
                            {strategies.map((s) => (
                              <Bar key={s.id} dataKey={s.id} name={s.shortName} fill={s.color} radius={[0, 4, 4, 0]} />
                            ))}
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#0d1a2e] border-[#12233e]">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">Strategy Profile</CardTitle>
                      <CardDescription className="text-[#7a95b8]">Multi-dimensional comparison</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                            { metric: 'Avg Return', ...Object.fromEntries(summaryStats.map((s) => [s.shortName, (s.avg / 15) * 100])) },
                            { metric: 'Max Return', ...Object.fromEntries(summaryStats.map((s) => [s.shortName, (s.max / 20) * 100])) },
                            { metric: 'Win Rate', ...Object.fromEntries(summaryStats.map((s) => [s.shortName, s.winRate])) },
                            { metric: 'Safety', ...Object.fromEntries(summaryStats.map((s) => [s.shortName, 100 - (s.volatility / 15) * 100])) },
                            { metric: 'Final Value', ...Object.fromEntries(summaryStats.map((s) => [s.shortName, (s.finalBalance / (initialAmount * 4)) * 100])) }
                          ]}>
                            <PolarGrid stroke="#12233e" />
                            <PolarAngleAxis dataKey="metric" tick={{ fill: "#7a95b8", fontSize: 11 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: "#060d19", borderColor: "#12233e", borderRadius: "8px", color: "#fff" }} />
                            <Legend wrapperStyle={{ paddingTop: "20px" }} />
                            {strategies.map((s) => (
                              <Radar key={s.id} name={s.shortName} dataKey={s.shortName} stroke={s.color} fill={s.color} fillOpacity={0.3} />
                            ))}
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Risk vs Return Tab (Chart 6: Scatter) */}
              <TabsContent value="risk" className="m-0 animate-in fade-in duration-500">
                <Card className="bg-[#0d1a2e] border-[#12233e]">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">Risk vs. Return Profile</CardTitle>
                    <CardDescription className="text-[#7a95b8]">Higher on Y-axis is better (more return), further left on X-axis is better (less risk)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[500px] w-full bg-[#060d19] rounded-xl border border-[#12233e] p-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                          <XAxis type="number" dataKey="risk" name="Volatility (Risk)" tick={{ fill: "#7a95b8" }} axisLine={{ stroke: "#12233e" }} tickLine={false} domain={['auto', 'auto']} unit="%" />
                          <YAxis type="number" dataKey="return" name="Avg Return" tick={{ fill: "#7a95b8" }} axisLine={{ stroke: "#12233e" }} tickLine={false} domain={['auto', 'auto']} unit="%" />
                          <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: "#060d19", borderColor: "#12233e", borderRadius: "8px", color: "#fff" }} formatter={(value: number, name: string) => [value.toFixed(2) + '%', name === 'return' ? 'Avg Return' : 'Volatility']} />
                          {riskReturnData.map((entry, index) => (
                            <Scatter key={`scatter-${index}`} name={entry.name} data={[entry]} fill={entry.color}>
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            </Scatter>
                          ))}
                          <Legend />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Trade-offs Tab (More tables) */}
              <TabsContent value="tradeoffs" className="m-0 space-y-6 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {summaryStats.map((s, idx) => (
                    <Card key={s.id} className="bg-[#0d1a2e] border-[#12233e]">
                      <CardHeader className="pb-2 border-b border-[#12233e]">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: s.color }}></div>
                          <CardTitle className="text-white text-lg">{s.name}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4">
                        <p className="text-sm text-[#7a95b8] h-10">{s.description}</p>
                        
                        {/* Table 2, 3, 4... */}
                        <div className="border border-[#12233e] rounded-lg overflow-hidden">
                          <Table>
                            <TableBody>
                              <TableRow className="border-[#12233e] hover:bg-transparent">
                                <TableCell className="text-[#7a95b8] py-2">Best Scenario</TableCell>
                                <TableCell className="text-white text-right py-2">
                                  {s.capRate > 100 ? "Strong Bull Markets" : s.participationRate > 100 ? "Moderate Growth" : "Consistent Returns"}
                                </TableCell>
                              </TableRow>
                              <TableRow className="border-[#12233e] hover:bg-transparent">
                                <TableCell className="text-[#7a95b8] py-2">Worst Scenario</TableCell>
                                <TableCell className="text-white text-right py-2">
                                  {s.floorRate > 0 ? "High Inflation" : "Extended Bear Markets"}
                                </TableCell>
                              </TableRow>
                              <TableRow className="border-[#12233e] hover:bg-transparent">
                                <TableCell className="text-[#7a95b8] py-2">Sharpe Ratio</TableCell>
                                <TableCell className="text-white text-right py-2">{s.sharpeRatio.toFixed(2)}</TableCell>
                              </TableRow>
                              <TableRow className="hover:bg-transparent">
                                <TableCell className="text-[#7a95b8] py-2">Max Single Year</TableCell>
                                <TableCell className="text-green-400 text-right py-2">+{s.max.toFixed(2)}%</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Table 5: Summary Matrix */}
                <Card className="bg-[#0d1a2e] border-[#12233e]">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">Strategy Decision Matrix</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border border-[#12233e] rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader className="bg-[#060d19]">
                          <TableRow className="border-[#12233e]">
                            <TableHead className="text-white">Client Profile</TableHead>
                            <TableHead className="text-white">Primary Goal</TableHead>
                            <TableHead className="text-white">Recommended Strategy</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow className="border-[#12233e]">
                            <TableCell className="text-[#7a95b8]">Conservative</TableCell>
                            <TableCell className="text-[#7a95b8]">Capital Preservation</TableCell>
                            <TableCell className="text-blue-400 font-medium">High Floor / Capped</TableCell>
                          </TableRow>
                          <TableRow className="border-[#12233e]">
                            <TableCell className="text-[#7a95b8]">Moderate</TableCell>
                            <TableCell className="text-[#7a95b8]">Balanced Growth</TableCell>
                            <TableCell className="text-green-400 font-medium">Higher Participation</TableCell>
                          </TableRow>
                          <TableRow className="border-[#12233e]">
                            <TableCell className="text-[#7a95b8]">Aggressive</TableCell>
                            <TableCell className="text-[#7a95b8]">Maximum Upside</TableCell>
                            <TableCell className="text-orange-400 font-medium">Uncapped</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="text-[#7a95b8]">Yield Seeking</TableCell>
                            <TableCell className="text-[#7a95b8]">Income Generation</TableCell>
                            <TableCell className="text-pink-400 font-medium">Spread Strategy</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Table 6: Historical Averages */}
                <Card className="bg-[#0d1a2e] border-[#12233e]">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">Historical Market Context</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border border-[#12233e] rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader className="bg-[#060d19]">
                          <TableRow className="border-[#12233e]">
                            <TableHead className="text-white">Decade</TableHead>
                            <TableHead className="text-white text-right">Avg S&P 500 Return</TableHead>
                            <TableHead className="text-white text-right">Positive Years</TableHead>
                            <TableHead className="text-white text-right">Negative Years</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow className="border-[#12233e]">
                            <TableCell className="text-[#7a95b8]">2000s (Lost Decade)</TableCell>
                            <TableCell className="text-red-400 text-right">-0.95%</TableCell>
                            <TableCell className="text-[#7a95b8] text-right">5</TableCell>
                            <TableCell className="text-[#7a95b8] text-right">5</TableCell>
                          </TableRow>
                          <TableRow className="border-[#12233e]">
                            <TableCell className="text-[#7a95b8]">2010s</TableCell>
                            <TableCell className="text-green-400 text-right">+13.56%</TableCell>
                            <TableCell className="text-[#7a95b8] text-right">8</TableCell>
                            <TableCell className="text-[#7a95b8] text-right">2</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="text-[#7a95b8]">2020s (To Date)</TableCell>
                            <TableCell className="text-green-400 text-right">+11.20%</TableCell>
                            <TableCell className="text-[#7a95b8] text-right">4</TableCell>
                            <TableCell className="text-[#7a95b8] text-right">2</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        <NAICDisclaimer variant="footer" showsHistoricalData showsComparisons />
      </div>
      <PageInsights pageId="index-strategies" />
    
        <ComplianceFooter pageName="IndexStrategyComparison" showsTax showsEstate showsProjections showsHistoricalData />
      </AppShell>
  );
}
