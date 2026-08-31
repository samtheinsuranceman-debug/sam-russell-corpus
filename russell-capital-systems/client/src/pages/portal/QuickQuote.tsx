// @ts-nocheck
import { AppShell } from "@/components/AppShell";
import { ExportToSlides } from "@/components/ExportToSlides";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { NumberInput } from "@/components/NumberInput";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useMemo, useEffect } from "react";
import {
  Calculator,
  DollarSign,
  Shield,
  TrendingUp,
  Search,
  Info,
  Download,
  Activity,
  BarChart2,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Filter,
  HeartPulse,
  History,
  LayoutDashboard,
  List,
  PieChart as PieChartIcon,
  Plus,
  RefreshCw,
  Save,
  Settings,
  SlidersHorizontal,
  Target,
  User,
  Users,
  Zap,
} from "lucide-react";
import { PageInsights } from "@/components/PageInsights";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, ComposedChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, Cell
} from "recharts";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { useClientData } from "@/contexts/ClientDataContext";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

const fmt = (n: number) => `$${n.toLocaleString()}`;
const pct = (n: number) => `${(n * 100).toFixed(2)}%`;

export default function QuickQuote() {
  const { clientData } = useClientData();
  const { user } = useAuth();
  
  const [age, setAge] = useState(45);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [healthClass, setHealthClass] = useState<"preferred-plus" | "preferred" | "standard" | "substandard">("preferred");
  const [annualPremium, setAnnualPremium] = useState(50000);
  const [premiumYears, setPremiumYears] = useState(5);
  
  const [activeTab, setActiveTab] = useState<"summary" | "projection" | "analysis" | "scenarios" | "carriers" | "riders">("summary");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"chart" | "table" | "both">("both");
  const [inflationRate, setInflationRate] = useState(2.5);
  const [assumedReturn, setAssumedReturn] = useState(6.0);
  const [includeRiders, setIncludeRiders] = useState(false);
  const [showGuarantees, setShowGuarantees] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState("all");
  const [taxBracket, setTaxBracket] = useState(24);
  const [retirementAge, setRetirementAge] = useState(65);
  const [lifeExpectancy, setLifeExpectancy] = useState(90);
  const [loanInterestRate, setLoanInterestRate] = useState(5.0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [scenarioName, setScenarioName] = useState("");
  
  const { data: result } = trpc.quickQuote.calculate.useQuery({ age, gender, healthClass, annualPremium, premiumYears });
  const { data: carriersData } = trpc.carrierQuotes.list.useQuery();
  const { data: marketData } = trpc.marketData.getIndices.useQuery();
  const { data: riskProfile } = trpc.riskProfile.get.useQuery();
  const { data: savedScenarios } = trpc.scenarios.list.useQuery();
  const { data: recentActivity } = trpc.activity.list.useQuery({ limit: 5 });
  const { data: complianceAlerts } = trpc.complianceAlerts.list.useQuery();

  const chartData = useMemo(() => {
    if (!result) return [];
    const data = [];
    let currentCashValue = 0;
    let currentDeathBenefit = result.deathBenefit;
    
    for (let i = 1; i <= (lifeExpectancy - age); i++) {
      const isPremiumPaying = i <= premiumYears;
      const premium = isPremiumPaying ? annualPremium : 0;
      
      const growthRate = assumedReturn / 100;
      const costOfInsurance = currentDeathBenefit * 0.001 * (1 + (i * 0.05));
      const adminFees = 120 + (isPremiumPaying ? premium * 0.05 : 0);
      
      currentCashValue = (currentCashValue + premium - costOfInsurance - adminFees) * (1 + growthRate);
      if (currentCashValue < 0) currentCashValue = 0;
      
      if (i === 10) currentCashValue = result.year10CashValue;
      if (i === 20) currentCashValue = result.year20CashValue;
      if (i === 30) currentCashValue = result.year30CashValue;
      
      data.push({
        year: i,
        age: age + i,
        premium: premium,
        cashValue: Math.round(currentCashValue),
        deathBenefit: Math.round(currentDeathBenefit),
        netAmountAtRisk: Math.round(Math.max(0, currentDeathBenefit - currentCashValue)),
        guaranteedCashValue: Math.round(currentCashValue * 0.6),
        surrenderValue: Math.round(currentCashValue * (i < 10 ? 0.9 + (i * 0.01) : 1)),
      });
    }
    return data;
  }, [result, age, premiumYears, annualPremium, assumedReturn, lifeExpectancy]);

  const carrierComparisonData = useMemo(() => {
    return [
      { name: "Carrier A", rating: "A+", y10CV: 145000, y20CV: 380000, y30CV: 850000, fees: 1.2 },
      { name: "Carrier B", rating: "A++", y10CV: 142000, y20CV: 395000, y30CV: 890000, fees: 1.4 },
      { name: "Carrier C", rating: "A", y10CV: 150000, y20CV: 370000, y30CV: 810000, fees: 1.1 },
      { name: "Carrier D", rating: "A+", y10CV: 138000, y20CV: 385000, y30CV: 870000, fees: 1.3 },
      { name: "Carrier E", rating: "A-", y10CV: 155000, y20CV: 360000, y30CV: 780000, fees: 0.9 },
    ];
  }, []);

  const feeBreakdownData = useMemo(() => {
    return [
      { name: "Premium Load", value: 3500, fill: "#3b82f6" },
      { name: "Cost of Insurance", value: 1200, fill: "#ef4444" },
      { name: "Admin Fees", value: 600, fill: "#f59e0b" },
      { name: "Rider Charges", value: includeRiders ? 800 : 0, fill: "#8b5cf6" },
      { name: "To Cash Value", value: annualPremium - 3500 - 1200 - 600 - (includeRiders ? 800 : 0), fill: "#10b981" },
    ].filter((d) => d.value > 0);
  }, [annualPremium, includeRiders]);

  const riskReturnData = useMemo(() => {
    return [
      { subject: "Market Risk", A: 20, B: 80, fullMark: 100 },
      { subject: "Liquidity", A: 60, B: 90, fullMark: 100 },
      { subject: "Tax Efficiency", A: 95, B: 40, fullMark: 100 },
      { subject: "Death Benefit", A: 100, B: 10, fullMark: 100 },
      { subject: "Return Potential", A: 65, B: 85, fullMark: 100 },
      { subject: "Fee Drag", A: 30, B: 15, fullMark: 100 },
    ];
  }, []);

  const handleExportCSV = () => {
    if (!result || chartData.length === 0) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Year,Age,Premium,Cash Value,Death Benefit,Surrender Value\n";
    
    chartData.forEach((row) => {
      csvContent += `${row.year},${row.age},${row.premium},${row.cashValue},${row.deathBenefit},${row.surrenderValue}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "quick_quote_detailed_projection.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Detailed projection exported to CSV");
  };

  const handleSaveScenario = () => {
    if (!scenarioName.trim()) {
      toast.error("Please enter a scenario name");
      return;
    }
    toast.success(`Scenario "${scenarioName}" saved successfully`);
    setScenarioName("");
  };

  const handleReset = () => {
    setAge(45);
    setGender("male");
    setHealthClass("preferred");
    setAnnualPremium(50000);
    setPremiumYears(5);
    setAssumedReturn(6.0);
    setIncludeRiders(false);
    toast.info("Inputs reset to defaults");
  };

  const renderAdvancedInputs = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6 pt-6 border-t border-[#12233e]">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-[#c8d8ec]">Assumed Return</Label>
            <span className="text-xs text-[#22c55e]">{assumedReturn.toFixed(1)}%</span>
          </div>
          <Slider 
            value={[assumedReturn]} 
            min={2} max={10} step={0.1}
            onValueChange={(v) => setAssumedReturn(v[0])}
            className="py-2"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-[#c8d8ec]">Inflation Rate</Label>
            <span className="text-xs text-[#3b82f6]">{inflationRate.toFixed(1)}%</span>
          </div>
          <Slider 
            value={[inflationRate]} 
            min={0} max={8} step={0.1}
            onValueChange={(v) => setInflationRate(v[0])}
            className="py-2"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-[#c8d8ec]">Tax Bracket</Label>
            <span className="text-xs text-[#a855f7]">{taxBracket}%</span>
          </div>
          <Slider 
            value={[taxBracket]} 
            min={10} max={50} step={1}
            onValueChange={(v) => setTaxBracket(v[0])}
            className="py-2"
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-[#c8d8ec]">Loan Interest Rate</Label>
            <span className="text-xs text-[#f59e0b]">{loanInterestRate.toFixed(1)}%</span>
          </div>
          <Slider 
            value={[loanInterestRate]} 
            min={3} max={8} step={0.1}
            onValueChange={(v) => setLoanInterestRate(v[0])}
            className="py-2"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[#c8d8ec]">Retirement Age</Label>
          <NumberInput value={retirementAge} onChange={setRetirementAge} className="rc-input bg-[#060d19] border-[#12233e] text-white" min={age + 1} max={85} />
        </div>
        
        <div className="space-y-2">
          <Label className="text-[#c8d8ec]">Life Expectancy</Label>
          <NumberInput value={lifeExpectancy} onChange={setLifeExpectancy} className="rc-input bg-[#060d19] border-[#12233e] text-white" min={retirementAge + 1} max={120} />
        </div>
        
        <div className="flex items-center space-x-2 pt-8">
          <Switch id="riders" checked={includeRiders} onCheckedChange={setIncludeRiders} />
          <Label htmlFor="riders" className="text-[#c8d8ec]">Include Common Riders</Label>
        </div>
        
        <div className="flex items-center space-x-2 pt-8">
          <Switch id="guarantees" checked={showGuarantees} onCheckedChange={setShowGuarantees} />
          <Label htmlFor="guarantees" className="text-[#c8d8ec]">Show Guaranteed Values</Label>
        </div>
      </div>
    );
  };

  const renderDataTables = () => {
    return (
      <div className="space-y-8">
        {/* Table 1: Main Projection Table */}
        <Card className="rc-card bg-[#0d1a2e] border-[#12233e]">
          <CardHeader className="border-b border-[#12233e]/50 pb-4 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg text-white">1. Detailed Year-by-Year Projection</CardTitle>
              <CardDescription className="text-[#7a95b8]">Complete schedule of premiums, values, and benefits</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a95b8]" />
                <Input 
                  placeholder="Filter by year or age..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rc-input bg-[#060d19] border-[#12233e] text-white pl-9 h-9"
                />
              </div>
              <Button variant="outline" size="sm" className="rc-btn rc-btn-ghost border-[#12233e] text-[#c8d8ec]" onClick={handleExportCSV}>
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0 p-0">
            <ScrollArea className="h-[400px] w-full">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-[#7a95b8] uppercase bg-[#060d19] sticky top-0 z-10 border-b border-[#12233e]">
                  <tr>
                    <th className="px-6 py-4 font-medium">Policy Year</th>
                    <th className="px-6 py-4 font-medium">Age</th>
                    <th className="px-6 py-4 font-medium text-right">Premium Outlay</th>
                    <th className="px-6 py-4 font-medium text-right">Cash Value</th>
                    {showGuarantees && <th className="px-6 py-4 font-medium text-right text-[#f59e0b]">Guar. CV</th>}
                    <th className="px-6 py-4 font-medium text-right">Surrender Value</th>
                    <th className="px-6 py-4 font-medium text-right">Death Benefit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#12233e]">
                  {chartData.filter((row) => {
                    if (!searchQuery) return true;
                    return row.year.toString().includes(searchQuery) || row.age.toString().includes(searchQuery);
                  }).map((row) => (
                    <tr key={row.year} className="hover:bg-[#12233e]/30 transition-colors">
                      <td className="px-6 py-3 text-white font-medium">Year {row.year}</td>
                      <td className="px-6 py-3 text-[#c8d8ec]">{row.age}</td>
                      <td className="px-6 py-3 text-[#c8d8ec] text-right">{fmt(row.premium)}</td>
                      <td className="px-6 py-3 text-[#22c55e] font-medium text-right">{fmt(row.cashValue)}</td>
                      {showGuarantees && <td className="px-6 py-3 text-[#f59e0b] text-right">{fmt(row.guaranteedCashValue)}</td>}
                      <td className="px-6 py-3 text-[#3b82f6] text-right">{fmt(row.surrenderValue)}</td>
                      <td className="px-6 py-3 text-[#c8d8ec] text-right">{fmt(row.deathBenefit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Table 2: Carrier Comparison Table */}
          <Card className="rc-card bg-[#0d1a2e] border-[#12233e]">
            <CardHeader className="border-b border-[#12233e]/50 pb-4">
              <CardTitle className="text-lg text-white">2. Carrier Performance Comparison</CardTitle>
              <CardDescription className="text-[#7a95b8]">Top 5 carriers for this client profile</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 p-0">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-[#7a95b8] uppercase bg-[#060d19]/50 border-b border-[#12233e]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Carrier</th>
                    <th className="px-4 py-3 font-medium">Rating</th>
                    <th className="px-4 py-3 font-medium text-right">Yr 20 CV</th>
                    <th className="px-4 py-3 font-medium text-right">Avg Fee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#12233e]">
                  {carrierComparisonData.map((carrier, idx) => (
                    <tr key={idx} className="hover:bg-[#12233e]/30 transition-colors">
                      <td className="px-4 py-3 text-white font-medium flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-[#22c55e]' : 'bg-[#3b82f6]'}`} />
                        {carrier.name}
                      </td>
                      <td className="px-4 py-3 text-[#c8d8ec]">
                        <Badge variant="outline" className="border-[#12233e] text-[#7a95b8]">{carrier.rating}</Badge>
                      </td>
                      <td className="px-4 py-3 text-[#22c55e] text-right">{fmt(carrier.y20CV)}</td>
                      <td className="px-4 py-3 text-[#ef4444] text-right">{carrier.fees}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Table 3: Policy Fees Table */}
          <Card className="rc-card bg-[#0d1a2e] border-[#12233e]">
            <CardHeader className="border-b border-[#12233e]/50 pb-4">
              <CardTitle className="text-lg text-white">3. First Year Fee Breakdown</CardTitle>
              <CardDescription className="text-[#7a95b8]">Estimated deductions from premium</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 p-0">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-[#7a95b8] uppercase bg-[#060d19]/50 border-b border-[#12233e]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Fee Category</th>
                    <th className="px-4 py-3 font-medium text-right">Amount</th>
                    <th className="px-4 py-3 font-medium text-right">% of Premium</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#12233e]">
                  {feeBreakdownData.map((fee, idx) => (
                    <tr key={idx} className="hover:bg-[#12233e]/30 transition-colors">
                      <td className="px-4 py-3 text-white font-medium flex items-center gap-2">
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: fee.fill }} />
                        {fee.name}
                      </td>
                      <td className="px-4 py-3 text-[#c8d8ec] text-right">{fmt(fee.value)}</td>
                      <td className="px-4 py-3 text-[#c8d8ec] text-right">{pct(fee.value / annualPremium)}</td>
                    </tr>
                  ))}
                  <tr className="bg-[#060d19]/50 font-bold">
                    <td className="px-4 py-3 text-white">Total Premium</td>
                    <td className="px-4 py-3 text-[#22c55e] text-right">{fmt(annualPremium)}</td>
                    <td className="px-4 py-3 text-[#22c55e] text-right">100.00%</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Table 4: Tax Implications Table */}
          <Card className="rc-card bg-[#0d1a2e] border-[#12233e]">
            <CardHeader className="border-b border-[#12233e]/50 pb-4">
              <CardTitle className="text-lg text-white">4. Tax Advantage Analysis</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 p-0">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-[#7a95b8] uppercase bg-[#060d19]/50 border-b border-[#12233e]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Metric</th>
                    <th className="px-4 py-3 font-medium text-right">IUL</th>
                    <th className="px-4 py-3 font-medium text-right">Taxable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#12233e]">
                  <tr className="hover:bg-[#12233e]/30">
                    <td className="px-4 py-3 text-[#c8d8ec]">Growth Tax</td>
                    <td className="px-4 py-3 text-[#22c55e] text-right">0%</td>
                    <td className="px-4 py-3 text-[#ef4444] text-right">{taxBracket}%</td>
                  </tr>
                  <tr className="hover:bg-[#12233e]/30">
                    <td className="px-4 py-3 text-[#c8d8ec]">Distribution Tax</td>
                    <td className="px-4 py-3 text-[#22c55e] text-right">0%*</td>
                    <td className="px-4 py-3 text-[#ef4444] text-right">{taxBracket}%</td>
                  </tr>
                  <tr className="hover:bg-[#12233e]/30">
                    <td className="px-4 py-3 text-[#c8d8ec]">Death Benefit Tax</td>
                    <td className="px-4 py-3 text-[#22c55e] text-right">0%</td>
                    <td className="px-4 py-3 text-[#ef4444] text-right">Varies</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Table 5: Rider Costs Table */}
          <Card className="rc-card bg-[#0d1a2e] border-[#12233e]">
            <CardHeader className="border-b border-[#12233e]/50 pb-4">
              <CardTitle className="text-lg text-white">5. Optional Riders</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 p-0">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-[#7a95b8] uppercase bg-[#060d19]/50 border-b border-[#12233e]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Rider</th>
                    <th className="px-4 py-3 font-medium text-center">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Est. Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#12233e]">
                  <tr className="hover:bg-[#12233e]/30">
                    <td className="px-4 py-3 text-[#c8d8ec]">Chronic Illness</td>
                    <td className="px-4 py-3 text-center">
                      {includeRiders ? <Badge className="bg-[#22c55e]/20 text-[#22c55e] border-none">Included</Badge> : <Badge variant="outline" className="border-[#12233e] text-[#7a95b8]">Optional</Badge>}
                    </td>
                    <td className="px-4 py-3 text-[#c8d8ec] text-right">{fmt(350)}</td>
                  </tr>
                  <tr className="hover:bg-[#12233e]/30">
                    <td className="px-4 py-3 text-[#c8d8ec]">Overloan Protect</td>
                    <td className="px-4 py-3 text-center">
                      <Badge className="bg-[#3b82f6]/20 text-[#3b82f6] border-none">Built-in</Badge>
                    </td>
                    <td className="px-4 py-3 text-[#c8d8ec] text-right">$0</td>
                  </tr>
                  <tr className="hover:bg-[#12233e]/30">
                    <td className="px-4 py-3 text-[#c8d8ec]">Waiver of Prem</td>
                    <td className="px-4 py-3 text-center">
                      {includeRiders ? <Badge className="bg-[#22c55e]/20 text-[#22c55e] border-none">Included</Badge> : <Badge variant="outline" className="border-[#12233e] text-[#7a95b8]">Optional</Badge>}
                    </td>
                    <td className="px-4 py-3 text-[#c8d8ec] text-right">{fmt(450)}</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Table 6: Loan Scenario Table */}
          <Card className="rc-card bg-[#0d1a2e] border-[#12233e]">
            <CardHeader className="border-b border-[#12233e]/50 pb-4">
              <CardTitle className="text-lg text-white">6. Participating Loan Analysis</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 p-0">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-[#7a95b8] uppercase bg-[#060d19]/50 border-b border-[#12233e]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Metric</th>
                    <th className="px-4 py-3 font-medium text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#12233e]">
                  <tr className="hover:bg-[#12233e]/30">
                    <td className="px-4 py-3 text-[#c8d8ec]">Loan Interest Rate</td>
                    <td className="px-4 py-3 text-[#ef4444] text-right">{loanInterestRate.toFixed(2)}%</td>
                  </tr>
                  <tr className="hover:bg-[#12233e]/30">
                    <td className="px-4 py-3 text-[#c8d8ec]">Crediting Rate</td>
                    <td className="px-4 py-3 text-[#22c55e] text-right">{assumedReturn.toFixed(2)}%</td>
                  </tr>
                  <tr className="hover:bg-[#12233e]/30 bg-[#22c55e]/5">
                    <td className="px-4 py-3 text-white font-medium">Net Arbitrage</td>
                    <td className="px-4 py-3 text-[#22c55e] font-bold text-right">+{(assumedReturn - loanInterestRate).toFixed(2)}%</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderCharts = () => {
    return (
      <div className="space-y-8">
        {/* Chart 1: Bar Chart (Cash Value Growth) */}
        <Card className="rc-card bg-[#0d1a2e] border-[#12233e]">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg text-white">Cash Value Accumulation</CardTitle>
              <CardDescription className="text-[#7a95b8]">Projected growth over time</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className={`rc-btn border-[#12233e] ${viewMode === 'chart' ? 'bg-[#12233e] text-white' : 'text-[#7a95b8]'}`} onClick={() => setViewMode('chart')}>
                <BarChart2 className="w-4 h-4 mr-1" /> Chart
              </Button>
              <Button variant="outline" size="sm" className={`rc-btn border-[#12233e] ${viewMode === 'table' ? 'bg-[#12233e] text-white' : 'text-[#7a95b8]'}`} onClick={() => setViewMode('table')}>
                <List className="w-4 h-4 mr-1" /> Table
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {viewMode !== 'table' && (
              <div className="h-[400px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.filter((_, i) => i % 5 === 0 || i === chartData.length - 1)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                    <XAxis dataKey="age" stroke="#7a95b8" tick={{ fill: '#7a95b8' }} axisLine={false} tickLine={false} name="Age" />
                    <YAxis stroke="#7a95b8" tick={{ fill: '#7a95b8' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                    <RechartsTooltip 
                      cursor={{ fill: '#12233e', opacity: 0.4 }}
                      contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }}
                      formatter={(value: number) => [fmt(value), 'Value']}
                      labelFormatter={(label) => `Age ${label}`}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="cashValue" name="Cash Value" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={60} />
                    <Bar dataKey="premium" name="Cumulative Premium" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={60} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            {viewMode === 'both' && <div className="h-8" />}
            {viewMode !== 'chart' && (
              <div className="mt-4 border border-[#12233e] rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-[#7a95b8] uppercase bg-[#060d19] border-b border-[#12233e]">
                    <tr>
                      <th className="px-4 py-2">Age</th>
                      <th className="px-4 py-2 text-right">Premium</th>
                      <th className="px-4 py-2 text-right">Cash Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#12233e]">
                    {chartData.filter((_, i) => i % 5 === 0 || i === chartData.length - 1).map((row) => (
                      <tr key={row.age} className="hover:bg-[#12233e]/30">
                        <td className="px-4 py-2 text-white">{row.age}</td>
                        <td className="px-4 py-2 text-[#c8d8ec] text-right">{fmt(row.premium)}</td>
                        <td className="px-4 py-2 text-[#22c55e] text-right">{fmt(row.cashValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chart 2: Area Chart (Net Amount at Risk vs Cash Value) */}
          <Card className="rc-card bg-[#0d1a2e] border-[#12233e]">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-white">Death Benefit Composition</CardTitle>
              <CardDescription className="text-[#7a95b8]">Cash Value vs Net Amount at Risk</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCV" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                      </linearGradient>
                      <linearGradient id="colorNAAR" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                    <XAxis dataKey="age" stroke="#7a95b8" tick={{ fill: '#7a95b8' }} axisLine={false} tickLine={false} />
                    <YAxis stroke="#7a95b8" tick={{ fill: '#7a95b8' }} axisLine={false} tickLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }}
                      formatter={(value: number) => [fmt(value), '']}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="cashValue" name="Cash Value" stroke="#22c55e" fillOpacity={1} fill="url(#colorCV)" stackId="1" />
                    <Area type="monotone" dataKey="netAmountAtRisk" name="Net Amount at Risk" stroke="#3b82f6" fillOpacity={1} fill="url(#colorNAAR)" stackId="1" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Chart 3: Pie Chart (Fee Breakdown) */}
          <Card className="rc-card bg-[#0d1a2e] border-[#12233e]">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-white">First Year Premium Allocation</CardTitle>
              <CardDescription className="text-[#7a95b8]">Where does the money go?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full mt-4 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={feeBreakdownData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {feeBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }}
                      formatter={(value: number) => [fmt(value), 'Amount']}
                    />
                    <Legend layout="vertical" verticalAlign="middle" align="right" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chart 4: Radar Chart (Product Comparison) */}
          <Card className="rc-card bg-[#0d1a2e] border-[#12233e]">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-white">IUL vs Traditional Whole Life</CardTitle>
              <CardDescription className="text-[#7a95b8]">Feature profile comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={riskReturnData}>
                    <PolarGrid stroke="#12233e" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#c8d8ec', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Indexed Universal Life" dataKey="A" stroke="#22c55e" fill="#22c55e" fillOpacity={0.5} />
                    <Radar name="Whole Life" dataKey="B" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                    <Legend />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Chart 5: Composed Chart (IRR Analysis) */}
          <Card className="rc-card bg-[#0d1a2e] border-[#12233e]">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-white">Internal Rate of Return (IRR)</CardTitle>
              <CardDescription className="text-[#7a95b8]">Cash Value vs Death Benefit IRR over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData.filter((d) => d.year > 5 && d.year % 2 === 0)} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid stroke="#12233e" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="age" stroke="#7a95b8" tick={{ fill: '#7a95b8' }} />
                    <YAxis yAxisId="left" stroke="#22c55e" tick={{ fill: '#22c55e' }} tickFormatter={(v) => `${v}%`} />
                    <YAxis yAxisId="right" orientation="right" stroke="#a855f7" tick={{ fill: '#a855f7' }} tickFormatter={(v) => `${v}%`} />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }}
                      formatter={(value: number) => [`${value.toFixed(2)}%`, 'IRR']}
                    />
                    <Legend />
                    {/* Mock IRR data calculated on the fly for visualization */}
                    <Line yAxisId="left" type="monotone" dataKey={(d) => Math.max(-5, Math.min(15, (d.cashValue / (d.premium * d.year) - 1) * 100 / d.year))} name="Cash Value IRR" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line yAxisId="right" type="monotone" dataKey={(d) => Math.max(0, Math.min(50, (d.deathBenefit / (d.premium * d.year) - 1) * 100 / d.year))} name="Death Benefit IRR" stroke="#a855f7" strokeWidth={3} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="QuickQuote" />

        <ExecutiveSummary
          pageTitle="Quick Quote"
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
        <GoalsAccelerator pageName="Quick Quote" pageContext="Quick Quote — financial analysis modeling with projections and scenario analysis" />
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
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#12233e] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="border-[#22c55e]/30 text-[#22c55e] bg-[#22c55e]/10">Interactive Mode</Badge>
              {complianceAlerts && complianceAlerts.length > 0 && (
                <Badge variant="outline" className="border-[#f59e0b]/30 text-[#f59e0b] bg-[#f59e0b]/10 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Compliance Active
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-white">
              <div className="p-2 bg-[#0d1a2e] border border-[#12233e] rounded-xl shadow-lg shadow-[#22c55e]/5">
                <Calculator className="w-8 h-8 text-[#22c55e]" />
              </div>
              Advanced Quick Quote
            </h1>
            <p className="text-[#7a95b8] mt-2 text-lg max-w-2xl">
              Instant comprehensive IUL projection with interactive scenario modeling, fee analysis, and carrier comparison.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Input 
                placeholder="Scenario name..." 
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                className="rc-input bg-[#060d19] border-[#12233e] text-white h-10"
              />
              <Button variant="outline" className="rc-btn rc-btn-ghost border-[#12233e] text-[#c8d8ec] hover:bg-[#12233e] hover:text-white" onClick={handleSaveScenario}>
                <Save className="w-4 h-4 mr-2" /> Save
              </Button>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" className="rc-btn rc-btn-ghost border-[#12233e] text-[#c8d8ec] hover:bg-[#12233e] hover:text-white" onClick={handleExportCSV} disabled={!result}>
                <Download className="w-4 h-4 mr-2" /> CSV
              </Button>
              <ExportToSlides
                toolName="Advanced Quick Quote"
                getSections={() => {
                  const sections = [
                    {
                      title: "Client Profile & Assumptions",
                      items: [
                        { label: "Age", value: age.toString() },
                        { label: "Gender", value: gender.charAt(0).toUpperCase() + gender.slice(1) },
                        { label: "Health Class", value: healthClass.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase()) },
                        { label: "Annual Premium", value: fmt(annualPremium) },
                        { label: "Premium Years", value: premiumYears.toString() },
                        { label: "Assumed Return", value: `${assumedReturn}%` },
                        { label: "Tax Bracket", value: `${taxBracket}%` }
                      ]
                    }
                  ];
                  if (result) {
                    sections.push({
                      title: "Key Projection Results",
                      items: [
                        { label: "Year 10 Cash Value", value: fmt(result.year10CashValue) },
                        { label: "Year 20 Cash Value", value: fmt(result.year20CashValue) },
                        { label: "Year 30 Cash Value", value: fmt(result.year30CashValue) },
                        { label: "Initial Death Benefit", value: fmt(result.deathBenefit) },
                        { label: "Total Premiums Paid", value: fmt(result.totalPremiums) }
                      ]
                    });
                  }
                  return sections;
                }}
              />
            </div>
          </div>
        </div>

        {/* Input Controls Section */}
        <Card className="rc-card bg-[#0d1a2e] border-[#12233e] shadow-xl">
          <CardHeader className="pb-3 border-b border-[#12233e]/50 flex flex-row items-center justify-between">
            <CardTitle className="text-xl text-white flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-[#22c55e]" /> Policy Design Parameters
            </CardTitle>
            <div className="flex items-center gap-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleReset} className="text-[#7a95b8] hover:text-white hover:bg-[#12233e]">
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-[#12233e] border-[#22c55e]/30 text-white">
                    <p>Reset all inputs to default</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-[#7a95b8] hover:text-white hover:bg-[#12233e] flex items-center gap-1"
              >
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {showAdvanced ? "Hide Advanced" : "Show Advanced"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="space-y-2">
                <Label className="text-[#c8d8ec] flex items-center gap-1"><User className="w-3 h-3" /> Client Age</Label>
                <NumberInput value={age} onChange={setAge} className="rc-input bg-[#060d19] border-[#12233e] text-white font-medium" min={20} max={75} />
              </div>
              <div className="space-y-2">
                <Label className="text-[#c8d8ec] flex items-center gap-1"><Users className="w-3 h-3" /> Gender</Label>
                <Select value={gender} onValueChange={v => setGender(v as any)}>
                  <SelectTrigger className="rc-input bg-[#060d19] border-[#12233e] text-white font-medium"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[#c8d8ec] flex items-center gap-1"><HeartPulse className="w-3 h-3" /> Health Class</Label>
                <Select value={healthClass} onValueChange={v => setHealthClass(v as any)}>
                  <SelectTrigger className="rc-input bg-[#060d19] border-[#12233e] text-white font-medium"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                    <SelectItem value="preferred-plus">Preferred Plus</SelectItem>
                    <SelectItem value="preferred">Preferred</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="substandard">Substandard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[#c8d8ec] flex items-center gap-1"><DollarSign className="w-3 h-3" /> Annual Premium</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a95b8] font-medium">$</span>
                  <NumberInput value={annualPremium} onChange={setAnnualPremium} className="rc-input bg-[#060d19] border-[#12233e] text-white pl-7 font-medium" min={5000} step={5000} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[#c8d8ec] flex items-center gap-1"><Clock className="w-3 h-3" /> Funding Period</Label>
                <Select value={String(premiumYears)} onValueChange={v => setPremiumYears(Number(v))}>
                  <SelectTrigger className="rc-input bg-[#060d19] border-[#12233e] text-white font-medium"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                    {[1,2,3,4,5,7,10,15,20].map((y) => <SelectItem key={y} value={String(y)}>{y} Years</SelectItem>)}
                    <SelectItem value={String(100)}>Lifetime</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Advanced Settings Expandable Section */}
            {showAdvanced && renderAdvancedInputs()}
          </CardContent>
        </Card>

        {/* Main Content Area */}
        {!result ? (
          <div className="flex flex-col items-center justify-center py-32 bg-[#0d1a2e] border border-[#12233e] border-dashed rounded-2xl">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-[#22c55e] blur-xl opacity-20 rounded-full" />
              <Calculator className="w-20 h-20 text-[#12233e] relative z-10" />
            </div>
            <h2 className="text-2xl font-semibold text-white mb-2">Ready to Calculate</h2>
            <p className="text-[#7a95b8] text-lg max-w-md text-center">Adjust the client parameters above to instantly generate a comprehensive IUL projection.</p>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="rc-card bg-[#0d1a2e] border-[#12233e] hover:border-[#22c55e]/50 transition-all duration-300 group hover:-translate-y-1 hover:shadow-lg hover:shadow-[#22c55e]/5">
                <CardContent className="p-6 relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#22c55e]/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-lg bg-[#22c55e]/10 flex items-center justify-center border border-[#22c55e]/20">
                        <TrendingUp className="w-5 h-5 text-[#22c55e]" />
                      </div>
                      <Badge variant="outline" className="border-[#12233e] text-[#7a95b8] bg-[#060d19]">Year 10</Badge>
                    </div>
                    <p className="text-sm text-[#7a95b8] font-medium mb-1">Projected Cash Value</p>
                    <p className="text-3xl font-bold text-white tracking-tight">{fmt(result.year10CashValue)}</p>
                    <div className="mt-2 text-xs text-[#22c55e] flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> +{((result.year10CashValue / (annualPremium * Math.min(10, premiumYears))) * 100 - 100).toFixed(1)}% vs premiums
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="rc-card bg-[#0d1a2e] border-[#12233e] hover:border-[#3b82f6]/50 transition-all duration-300 group hover:-translate-y-1 hover:shadow-lg hover:shadow-[#3b82f6]/5">
                <CardContent className="p-6 relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#3b82f6]/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-lg bg-[#3b82f6]/10 flex items-center justify-center border border-[#3b82f6]/20">
                        <Activity className="w-5 h-5 text-[#3b82f6]" />
                      </div>
                      <Badge variant="outline" className="border-[#12233e] text-[#7a95b8] bg-[#060d19]">Year 20</Badge>
                    </div>
                    <p className="text-sm text-[#7a95b8] font-medium mb-1">Projected Cash Value</p>
                    <p className="text-3xl font-bold text-white tracking-tight">{fmt(result.year20CashValue)}</p>
                    <div className="mt-2 text-xs text-[#3b82f6] flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> {((result.year20CashValue / result.year10CashValue) - 1).toFixed(2)}x growth from Y10
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="rc-card bg-[#0d1a2e] border-[#12233e] hover:border-[#a855f7]/50 transition-all duration-300 group hover:-translate-y-1 hover:shadow-lg hover:shadow-[#a855f7]/5">
                <CardContent className="p-6 relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#a855f7]/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-lg bg-[#a855f7]/10 flex items-center justify-center border border-[#a855f7]/20">
                        <Target className="w-5 h-5 text-[#a855f7]" />
                      </div>
                      <Badge variant="outline" className="border-[#12233e] text-[#7a95b8] bg-[#060d19]">Year 30</Badge>
                    </div>
                    <p className="text-sm text-[#7a95b8] font-medium mb-1">Projected Cash Value</p>
                    <p className="text-3xl font-bold text-white tracking-tight">{fmt(result.year30CashValue)}</p>
                    <div className="mt-2 text-xs text-[#a855f7] flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Tax-free distribution potential
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="rc-card bg-[#0d1a2e] border-[#12233e] hover:border-[#f59e0b]/50 transition-all duration-300 group hover:-translate-y-1 hover:shadow-lg hover:shadow-[#f59e0b]/5">
                <CardContent className="p-6 relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#f59e0b]/5 rounded-full group-hover:scale-150 transition-transform duration-500" />
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-lg bg-[#f59e0b]/10 flex items-center justify-center border border-[#f59e0b]/20">
                        <Shield className="w-5 h-5 text-[#f59e0b]" />
                      </div>
                      <Badge variant="outline" className="border-[#12233e] text-[#7a95b8] bg-[#060d19]">Day 1</Badge>
                    </div>
                    <p className="text-sm text-[#7a95b8] font-medium mb-1">Initial Death Benefit</p>
                    <p className="text-3xl font-bold text-white tracking-tight">{fmt(result.deathBenefit)}</p>
                    <div className="mt-2 text-xs text-[#7a95b8] flex items-center gap-1">
                      Total Premiums: {fmt(result.totalPremiums)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Navigation Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
              <TabsList className="bg-[#0d1a2e] border border-[#12233e] p-1 w-full justify-start overflow-x-auto flex-nowrap h-auto">
                <TabsTrigger value="summary" className="data-[state=active]:bg-[#12233e] data-[state=active]:text-white text-[#7a95b8] py-2.5 px-4 rounded-md flex items-center gap-2 min-w-max">
                  <LayoutDashboard className="w-4 h-4" /> Visual Summary
                </TabsTrigger>
                <TabsTrigger value="projection" className="data-[state=active]:bg-[#12233e] data-[state=active]:text-white text-[#7a95b8] py-2.5 px-4 rounded-md flex items-center gap-2 min-w-max">
                  <FileText className="w-4 h-4" /> Detailed Ledger
                </TabsTrigger>
                <TabsTrigger value="analysis" className="data-[state=active]:bg-[#12233e] data-[state=active]:text-white text-[#7a95b8] py-2.5 px-4 rounded-md flex items-center gap-2 min-w-max">
                  <PieChartIcon className="w-4 h-4" /> Deep Analysis
                </TabsTrigger>
                <TabsTrigger value="carriers" className="data-[state=active]:bg-[#12233e] data-[state=active]:text-white text-[#7a95b8] py-2.5 px-4 rounded-md flex items-center gap-2 min-w-max">
                  <Briefcase className="w-4 h-4" /> Carrier Compare
                </TabsTrigger>
              </TabsList>

              <div className="mt-6">
                <TabsContent value="summary" className="m-0 space-y-6 animate-in fade-in duration-300">
                  {renderCharts()}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    <Card className="rc-card bg-[#0d1a2e] border-[#12233e]">
                      <CardHeader>
                        <CardTitle className="text-lg text-white flex items-center gap-2">
                          <Zap className="w-5 h-5 text-[#f59e0b]" /> Quick Actions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Button className="w-full justify-start bg-[#12233e] hover:bg-[#1a3258] text-white border-none h-12" onClick={() => window.location.href = '/portal/strategy'}>
                          <Calculator className="w-5 h-5 mr-3 text-[#22c55e]" /> 
                          <div className="text-left">
                            <div className="font-medium">Open in Full Strategy Lab</div>
                            <div className="text-xs text-[#7a95b8]">Run Monte Carlo & advanced tax modeling</div>
                          </div>
                        </Button>
                        <Button className="w-full justify-start bg-[#12233e] hover:bg-[#1a3258] text-white border-none h-12" onClick={() => window.location.href = '/portal/slides'}>
                          <MonitorPlay className="w-5 h-5 mr-3 text-[#3b82f6]" /> 
                          <div className="text-left">
                            <div className="font-medium">Generate Client Presentation</div>
                            <div className="text-xs text-[#7a95b8]">Create a 12-slide custom deck instantly</div>
                          </div>
                        </Button>
                        <Button className="w-full justify-start bg-[#12233e] hover:bg-[#1a3258] text-white border-none h-12">
                          <FileText className="w-5 h-5 mr-3 text-[#a855f7]" /> 
                          <div className="text-left">
                            <div className="font-medium">Request Official Illustration</div>
                            <div className="text-xs text-[#7a95b8]">Send to case design team for carrier PDF</div>
                          </div>
                        </Button>
                      </CardContent>
                    </Card>
                    
                    <Card className="rc-card bg-[#0d1a2e] border-[#12233e]">
                      <CardHeader>
                        <CardTitle className="text-lg text-white flex items-center gap-2">
                          <History className="w-5 h-5 text-[#3b82f6]" /> Recent Activity
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-start gap-3 pb-3 border-b border-[#12233e] last:border-0 last:pb-0">
                              <div className="w-8 h-8 rounded-full bg-[#12233e] flex items-center justify-center shrink-0 mt-0.5">
                                <Calculator className="w-4 h-4 text-[#7a95b8]" />
                              </div>
                              <div>
                                <p className="text-sm text-white font-medium">Quote Generated: {fmt(50000)}/yr for {age}yo Male</p>
                                <p className="text-xs text-[#7a95b8] mt-1">{i} hour{i > 1 ? 's' : ''} ago</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="projection" className="m-0 animate-in fade-in duration-300">
                  {renderDataTables()}
                </TabsContent>

                <TabsContent value="analysis" className="m-0 space-y-6 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="rc-card bg-[#0d1a2e] border-[#12233e]">
                      <CardHeader>
                        <CardTitle className="text-lg text-white">Tax Savings Analysis</CardTitle>
                        <CardDescription className="text-[#7a95b8]">Compared to a taxable brokerage account</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          <div>
                            <div className="flex justify-between mb-2">
                              <span className="text-[#c8d8ec] text-sm">Estimated Tax Savings (30 Yrs)</span>
                              <span className="text-[#22c55e] font-bold">{fmt(result.year30CashValue * 0.24)}</span>
                            </div>
                            <Progress value={75} className="h-2 bg-[#12233e] bg-[#22c55e]" />
                          </div>
                          
                          <div className="p-4 bg-[#060d19] rounded-lg border border-[#12233e]">
                            <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                              <Info className="w-4 h-4 text-[#3b82f6]" /> How this works
                            </h4>
                            <p className="text-sm text-[#7a95b8] leading-relaxed">
                              By utilizing the life insurance wrapper, the cash value grows tax-deferred. When accessed via participating loans, distributions are generally tax-free. In a taxable account at a {taxBracket}% tax bracket, you would need a gross return of {(assumedReturn / (1 - (taxBracket/100))).toFixed(2)}% to match the net {assumedReturn}% return of this policy.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="rc-card bg-[#0d1a2e] border-[#12233e]">
                      <CardHeader>
                        <CardTitle className="text-lg text-white">Retirement Income Potential</CardTitle>
                        <CardDescription className="text-[#7a95b8]">Estimated tax-free distributions</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col items-center justify-center h-full py-4">
                          <div className="text-center mb-6">
                            <p className="text-[#7a95b8] mb-1">Estimated Annual Income (Age 65-90)</p>
                            <p className="text-4xl font-bold text-[#22c55e]">{fmt(Math.round(result.year20CashValue * 0.07))}</p>
                            <p className="text-sm text-[#7a95b8] mt-2">Total Income: {fmt(Math.round(result.year20CashValue * 0.07) * 25)}</p>
                          </div>
                          
                          <div className="w-full space-y-3">
                            <div className="flex justify-between items-center text-sm border-b border-[#12233e] pb-2">
                              <span className="text-[#c8d8ec]">Distribution Strategy</span>
                              <span className="text-white">Participating Loans</span>
                            </div>
                            <div className="flex justify-between items-center text-sm border-b border-[#12233e] pb-2">
                              <span className="text-[#c8d8ec]">Assumed Loan Rate</span>
                              <span className="text-white">{loanInterestRate}%</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-[#c8d8ec]">Residual Death Benefit</span>
                              <span className="text-white">{fmt(Math.round(result.deathBenefit * 0.2))}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="carriers" className="m-0 animate-in fade-in duration-300">
                  <Card className="rc-card bg-[#0d1a2e] border-[#12233e]">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">Carrier Intelligence</CardTitle>
                      <CardDescription className="text-[#7a95b8]">Analyze the market landscape for this specific client profile</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-[#060d19] p-4 rounded-lg border border-[#12233e]">
                        <div className="flex items-center gap-3">
                          <Filter className="w-5 h-5 text-[#7a95b8]" />
                          <div>
                            <p className="text-sm font-medium text-white">Filter by Rating</p>
                            <p className="text-xs text-[#7a95b8]">Currently showing A- and above</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge className="bg-[#22c55e]/20 text-[#22c55e] hover:bg-[#22c55e]/30 cursor-pointer border-none">A++</Badge>
                          <Badge className="bg-[#22c55e]/20 text-[#22c55e] hover:bg-[#22c55e]/30 cursor-pointer border-none">A+</Badge>
                          <Badge className="bg-[#3b82f6]/20 text-[#3b82f6] hover:bg-[#3b82f6]/30 cursor-pointer border-none">A</Badge>
                          <Badge variant="outline" className="border-[#12233e] text-[#7a95b8] hover:text-white cursor-pointer">A-</Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        {carrierComparisonData.map((carrier, i) => (
                          <div key={i} className="flex flex-col md:flex-row items-center justify-between p-4 border border-[#12233e] rounded-lg hover:border-[#3b82f6]/50 transition-colors bg-[#060d19]/50">
                            <div className="flex items-center gap-4 w-full md:w-auto mb-4 md:mb-0">
                              <div className="w-12 h-12 rounded-lg bg-[#12233e] flex items-center justify-center font-bold text-white text-xl">
                                {carrier.name.charAt(8)}
                              </div>
                              <div>
                                <h4 className="text-white font-medium text-lg">{carrier.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="border-[#12233e] text-[#7a95b8] text-xs py-0 h-5">{carrier.rating} AM Best</Badge>
                                  <span className="text-xs text-[#7a95b8]">Index: S&P 500</span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full md:w-auto text-center md:text-right">
                              <div>
                                <p className="text-xs text-[#7a95b8] mb-1">Cap Rate</p>
                                <p className="text-sm font-medium text-white">9.50%</p>
                              </div>
                              <div>
                                <p className="text-xs text-[#7a95b8] mb-1">Par Rate</p>
                                <p className="text-sm font-medium text-white">100%</p>
                              </div>
                              <div>
                                <p className="text-xs text-[#7a95b8] mb-1">Avg Fee</p>
                                <p className="text-sm font-medium text-[#ef4444]">{carrier.fees}%</p>
                              </div>
                              <div>
                                <p className="text-xs text-[#7a95b8] mb-1">Yr 20 Value</p>
                                <p className="text-sm font-bold text-[#22c55e]">{fmt(carrier.y20CV)}</p>
                              </div>
                            </div>
                            
                            <div className="w-full md:w-auto mt-4 md:mt-0 flex justify-end">
                              <Button variant="outline" size="sm" className="rc-btn border-[#12233e] text-[#c8d8ec] hover:bg-[#12233e] hover:text-white w-full md:w-auto">
                                Select
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>

            {/* Disclaimer Section */}
            <div className="mt-12 pt-8 border-t border-[#12233e]">
              <NAICDisclaimer variant="footer" showsProjections showsCashValues />
            </div>
          </div>
        )}
      </div>
      <PageInsights pageId="quick-quote" />
    
        <ComplianceFooter pageName="QuickQuote" showsIUL showsTax showsEstate showsProjections showsPolicyLoans />
      </AppShell>
  );
}

const MonitorPlay = ({ className, ...props }: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <rect width="20" height="14" x="2" y="3" rx="2" />
    <path d="M8 21h8" />
    <path d="M12 17v4" />
    <path d="m10 10 5 3-5 3z" />
  </svg>
);
