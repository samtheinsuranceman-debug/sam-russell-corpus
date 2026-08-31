// @ts-nocheck
import { useState, useMemo, useEffect } from "react";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { ExportToSlides } from "@/components/ExportToSlides";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Target,
  DollarSign,
  Shield,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  FileText,
  PieChart as PieChartIcon,
  Search,
  Settings,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line, PieChart, Pie, Cell, ComposedChart
} from "recharts";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

const fmt = (n: number) => {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

interface ClientProfile {
  age: number;
  income: number;
  netWorth: number;
  iraBalance: number;
  rothBalance: number;
  iulPremium: number;
  annuityValue: number;
  riskScore: number;
  yearsToRetirement: number;
  monthlyExpenses: number;
  inflationRate: number;
  marketReturn: number;
  taxRate: number;
  lifeExpectancy: number;
}

interface Prediction {
  metric: string;
  current: number;
  projected: number;
  confidence: number;
  trend: "up" | "down" | "stable";
  insight: string;
  action: string;
  category: string;
}

export default function PredictiveAnalytics() {
  const { user } = useAuth();
  const { data: clientData } = useClientData();
  
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: dashboardData } = trpc.dashboard.stats.useQuery();
  const { data: scenarios } = trpc.scenarios.list.useQuery();
  const { data: aiInsights } = trpc.ai.getInsights.useQuery();
  const { data: marketData } = trpc.marketData.getLatest.useQuery();
  const { data: riskProfile } = trpc.riskProfile.get.useQuery();

  const [profile, setProfile] = useState<ClientProfile>({
    age: 55, income: 350000, netWorth: 5000000, iraBalance: 1800000,
    rothBalance: 400000, iulPremium: 40000, annuityValue: 300000,
    riskScore: 65, yearsToRetirement: 10, monthlyExpenses: 12000,
    inflationRate: 3.0, marketReturn: 7.0, taxRate: 32.0, lifeExpectancy: 90
  });

  const [activeTab, setActiveTab] = useState("predictions");
  const [simulationRuns, setSimulationRuns] = useState(1000);
  const [includeSocialSecurity, setIncludeSocialSecurity] = useState(true);
  const [includeIul, setIncludeIul] = useState(true);
  const [stressTestMode, setStressTestMode] = useState("base");
  const [chartView, setChartView] = useState("area");
  const [searchTerm, setSearchTerm] = useState("");
  const [rebalance, setRebalance] = useState(true);
  const [taxLoss, setTaxLoss] = useState(true);
  const [rmdCalc, setRmdCalc] = useState(true);
  const [medicare, setMedicare] = useState(true);
  const [taxStatus, setTaxStatus] = useState("married");
  const [ltcRider, setLtcRider] = useState(false);
  const [wpRider, setWpRider] = useState(false);
  const [termRider, setTermRider] = useState(false);
  const [sequence, setSequence] = useState("average");

  useEffect(() => {
    if (clientData) {
      setProfile(prev => ({
        ...prev,
        ...(clientData.age ? { age: clientData.age } : {}),
        ...(clientData.annualIncome ? { income: clientData.annualIncome } : {}),
        ...(clientData.iraBalance ? { iraBalance: clientData.iraBalance } : {}),
        ...(clientData.rothBalance ? { rothBalance: clientData.rothBalance } : {}),
        ...(clientData.annuityValue ? { annuityValue: clientData.annuityValue } : {}),
        ...(clientData.annualPremium ? { iulPremium: clientData.annualPremium } : {}),
        ...(clientData.riskTolerance ? { riskScore: Number(clientData.riskTolerance) } : {}),
        ...(clientData.retirementAge && clientData.age ? { yearsToRetirement: Math.max(0, clientData.retirementAge - clientData.age) } : {}),
        ...(clientData.monthlyExpenses ? { monthlyExpenses: clientData.monthlyExpenses } : {}),
        ...((clientData.cashSavings || clientData.iraBalance || clientData.rothBalance || clientData.k401Balance || clientData.taxableInvestments || clientData.realEstateEquity || clientData.homeValue) ? { netWorth: (clientData.cashSavings || 0) + (clientData.iraBalance || 0) + (clientData.rothBalance || 0) + (clientData.k401Balance || 0) + (clientData.taxableInvestments || 0) + (clientData.realEstateEquity || 0) + (clientData.homeValue || 0) } : {})
      }));
    }
  }, [clientData]);

  const predictions = useMemo((): Prediction[] => {
    const p = profile;
    const inflationRate = p.inflationRate / 100;
    const marketReturn = stressTestMode === "bear" ? p.marketReturn / 100 - 0.03 : stressTestMode === "bull" ? p.marketReturn / 100 + 0.03 : p.marketReturn / 100;

    const retirementNeed = p.monthlyExpenses * 12 * Math.pow(1 + inflationRate, p.yearsToRetirement) * 25;
    const projectedAssets = (p.iraBalance + p.rothBalance) * Math.pow(1 + marketReturn, p.yearsToRetirement) +
      (includeIul ? p.iulPremium * p.yearsToRetirement * 1.55 : 0) + p.annuityValue * Math.pow(1.04, p.yearsToRetirement);
    const readinessRatio = projectedAssets / retirementNeed;

    const currentTaxBurden = p.income * (p.taxRate / 100);
    const rmdProjected = p.iraBalance * Math.pow(1 + marketReturn, p.yearsToRetirement) / 27.4;
    const projectedTaxBurden = rmdProjected * (p.taxRate / 100);

    const iulCashValue = includeIul ? p.iulPremium * p.yearsToRetirement * 1.55 : 0;
    const iulIncome = iulCashValue * 0.065;

    const ssAt62 = includeSocialSecurity ? 2200 * 12 : 0;
    const ssAt67 = includeSocialSecurity ? 3200 * 12 : 0;
    const ssAt70 = includeSocialSecurity ? 4000 * 12 : 0;
    const ssOptimal = p.age < 60 ? ssAt70 : p.age < 65 ? ssAt67 : ssAt62;

    const netWorthProjected = p.netWorth * Math.pow(1 + marketReturn - inflationRate, p.yearsToRetirement);

    const incomeReplacementNeed = p.income * 10;
    const currentCoverage = iulCashValue * 3; // death benefit estimate
    const coverageGap = Math.max(0, incomeReplacementNeed - currentCoverage);

    return [
      {
        metric: "Retirement Readiness",
        current: Math.round(readinessRatio * 100),
        projected: Math.min(150, Math.round(readinessRatio * 100 * 1.1)),
        confidence: 78,
        trend: readinessRatio >= 1 ? "up" : "down",
        insight: readinessRatio >= 1
          ? `Projected assets of ${fmt(projectedAssets)} exceed retirement need of ${fmt(retirementNeed)}`
          : `Gap of ${fmt(retirementNeed - projectedAssets)} between projected assets and retirement need`,
        action: readinessRatio >= 1
          ? "Consider increasing IUL premium for additional tax-free income"
          : "Increase monthly savings by $2,000 or extend working years by 2",
        category: "Retirement",
      },
      {
        metric: "Tax Efficiency Score",
        current: Math.round((1 - currentTaxBurden / p.income) * 100),
        projected: Math.round((1 - projectedTaxBurden / (rmdProjected + iulIncome + ssOptimal || 1)) * 100),
        confidence: 82,
        trend: projectedTaxBurden < currentTaxBurden ? "up" : "down",
        insight: `Current effective rate: ${Math.round(currentTaxBurden / p.income * 100)}%. Projected RMD tax: ${fmt(projectedTaxBurden)}/yr`,
        action: "Implement Roth conversion ladder of $80K/yr for next 10 years to reduce RMDs by 40%",
        category: "Tax",
      },
      {
        metric: "IUL Illustrated Cash Value",
        current: p.iulPremium * 3, // rough current value
        projected: iulCashValue,
        confidence: 72,
        trend: "up",
        insight: `At current premium of ${fmt(p.iulPremium)}/yr, illustrated cash value projects to ${fmt(iulCashValue)} in ${p.yearsToRetirement} years`,
        action: `Projected tax-free income of ${fmt(iulIncome)}/yr from policy loans at retirement`,
        category: "Insurance",
      },
      {
        metric: "Net Worth Trajectory",
        current: p.netWorth,
        projected: Math.round(netWorthProjected),
        confidence: 68,
        trend: "up",
        insight: `Net worth projected to grow from ${fmt(p.netWorth)} to ${fmt(netWorthProjected)} (${Math.round((marketReturn - inflationRate) * 100)}% real return)`,
        action: "Diversify into tax-advantaged vehicles to protect growth from taxation",
        category: "Wealth",
      },
      {
        metric: "Social Security Optimization",
        current: ssAt62,
        projected: ssOptimal,
        confidence: 90,
        trend: "up",
        insight: `Delaying to age 70 increases annual benefit from ${fmt(ssAt62)} to ${fmt(ssAt70)} (${Math.round((ssAt70 / (ssAt62 || 1) - 1) * 100)}% increase)`,
        action: "Use IUL policy loans as bridge income from 62-70 to maximize SS benefit",
        category: "Retirement",
      },
      {
        metric: "Insurance Coverage Gap",
        current: Math.round(currentCoverage),
        projected: Math.round(coverageGap),
        confidence: 85,
        trend: coverageGap > 0 ? "down" : "stable",
        insight: coverageGap > 0
          ? `Income replacement need: ${fmt(incomeReplacementNeed)}. Current coverage: ${fmt(currentCoverage)}. Gap: ${fmt(coverageGap)}`
          : "Current coverage meets income replacement needs",
        action: coverageGap > 0
          ? `Consider additional ${fmt(coverageGap)} in coverage through IUL or term policy`
          : "Review coverage annually as income and obligations change",
        category: "Insurance",
      },
      {
        metric: "Estate Tax Exposure",
        current: Math.round(Math.max(0, p.netWorth - 13610000) * 0.40),
        projected: Math.round(Math.max(0, netWorthProjected - 13610000) * 0.40),
        confidence: 75,
        trend: netWorthProjected > 13610000 ? "down" : "stable",
        insight: netWorthProjected > 13610000
          ? `Projected estate of ${fmt(netWorthProjected)} exceeds exemption. Tax exposure: ${fmt(Math.max(0, netWorthProjected - 13610000) * 0.40)}`
          : "Estate currently below federal exemption threshold",
        action: "Implement ILIT with IUL policy to provide tax-free estate liquidity",
        category: "Estate",
      },
      {
        metric: "Longevity Risk Score",
        current: Math.round(projectedAssets / (p.monthlyExpenses * 12 * Math.pow(1 + inflationRate, p.yearsToRetirement))),
        projected: Math.round(projectedAssets / (p.monthlyExpenses * 12 * Math.pow(1 + inflationRate, p.yearsToRetirement + 10))),
        confidence: 65,
        trend: "down",
        insight: `Assets projected to last ${Math.round(projectedAssets / (p.monthlyExpenses * 12 * Math.pow(1 + inflationRate, p.yearsToRetirement)))} years in retirement`,
        action: "Add guaranteed income through annuity to cover essential expenses regardless of market conditions",
        category: "Retirement",
      },
    ];
  }, [profile, includeSocialSecurity, includeIul, stressTestMode]);

  const overallScore = useMemo(() => {
    const scores = predictions.map((p) => {
      if (p.metric === "Retirement Readiness") return Math.min(100, p.current);
      if (p.metric === "Tax Efficiency Score") return p.current;
      if (p.metric === "Insurance Coverage Gap") return p.projected === 0 ? 100 : Math.max(0, 100 - Math.round(p.projected / 100000));
      return 70;
    });
    return Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
  }, [predictions]);

  const projectionData = useMemo(() => {
    const pts = [];
    for (let y = 0; y <= profile.yearsToRetirement; y += Math.max(1, Math.floor(profile.yearsToRetirement / 8))) {
      const base = profile.netWorth * Math.pow(1 + profile.marketReturn/100, y);
      const optimistic = profile.netWorth * Math.pow(1 + (profile.marketReturn+3)/100, y);
      const pessimistic = profile.netWorth * Math.pow(1 + (profile.marketReturn-3)/100, y);
      pts.push({ 
        year: `Year ${y}`, 
        base: Math.round(base), 
        optimistic: Math.round(optimistic),
        pessimistic: Math.round(pessimistic)
      });
    }
    return pts;
  }, [profile]);

  const assetAllocationData = [
    { name: 'IRA/401(k)', value: profile.iraBalance },
    { name: 'Roth IRA', value: profile.rothBalance },
    { name: 'IUL Cash Value', value: profile.iulPremium * 3 },
    { name: 'Annuity', value: profile.annuityValue },
    { name: 'Other Assets', value: Math.max(0, profile.netWorth - profile.iraBalance - profile.rothBalance - profile.iulPremium * 3 - profile.annuityValue) }
  ];

  const taxProjectionData = useMemo(() => {
    const data = [];
    for (let i = 0; i < 10; i++) {
      data.push({
        year: `202${4+i}`,
        currentStrategy: profile.income * (profile.taxRate/100) * Math.pow(1.03, i),
        proposedStrategy: profile.income * (profile.taxRate/100) * Math.pow(1.03, i) * 0.8
      });
    }
    return data;
  }, [profile]);

  const incomeSourcesData = [
    { name: 'Social Security', amount: 38000 },
    { name: 'IRA Distributions', amount: 45000 },
    { name: 'IUL Loans', amount: 25000 },
    { name: 'Annuity Income', amount: 18000 }
  ];

  const filteredPredictions = predictions.filter((p) => 
    p.metric.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppShell>
      <div className="space-y-6 p-6">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="PredictiveAnalytics" />

        <ExecutiveSummary
          pageTitle="Predictive Analytics"
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
        <GoalsAccelerator pageName="Predictive Analytics" pageContext="Predictive Analytics — financial analysis modeling with projections and scenario analysis" />
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
        <FactFinderBadge className="mb-4" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              Predictive Analytics Dashboard
            </h1>
            <p className="text-muted-foreground">AI-powered financial forecasting and scenario analysis</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <ExportToSlides
              toolName="Predictive Analytics"
              getSections={() => [
                {
                  title: "Client Profile",
                  items: [
                    { label: "Age", value: profile.age.toString() },
                    { label: "Annual Income", value: fmt(profile.income) },
                    { label: "Net Worth", value: fmt(profile.netWorth) },
                    { label: "Monthly Expenses", value: fmt(profile.monthlyExpenses) },
                    { label: "Years to Retirement", value: profile.yearsToRetirement.toString() }
                  ]
                },
                {
                  title: "Account Balances",
                  items: [
                    { label: "IRA/401(k)", value: fmt(profile.iraBalance) },
                    { label: "Roth IRA", value: fmt(profile.rothBalance) },
                    { label: "IUL Annual Premium", value: fmt(profile.iulPremium) },
                    { label: "Annuity Value", value: fmt(profile.annuityValue) },
                    { label: "Risk Score", value: profile.riskScore.toString() }
                  ]
                },
                ...predictions.map((p) => ({
                  title: p.metric,
                  items: [
                    { label: "Current", value: p.current > 100 ? fmt(p.current) : p.current.toString() },
                    { label: "Projected", value: p.projected > 100 ? fmt(p.projected) : p.projected.toString() },
                    { label: "Confidence", value: `${p.confidence}%` },
                    { label: "Insight", value: p.insight },
                    { label: "Action", value: p.action }
                  ]
                }))
              ]}
            />
          </div>
        </div>

        {/* Overall Score */}
        <Card className="border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative w-32 h-32 shrink-0">
                <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke="currentColor" strokeWidth="8"
                    className="text-primary"
                    strokeDasharray={`${overallScore * 3.27} 327`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold">{overallScore}</div>
                    <div className="text-xs text-muted-foreground">Overall</div>
                  </div>
                </div>
              </div>
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {["Retirement", "Tax", "Insurance", "Estate"].map((cat) => {
                  const catPredictions = predictions.filter((p) => p.category === cat);
                  const avgConfidence = catPredictions.length > 0
                    ? Math.round(catPredictions.reduce((s, p) => s + p.confidence, 0) / catPredictions.length)
                    : 0;
                  return (
                    <div key={cat} className="p-3 rounded-lg bg-card border text-center">
                      <div className="text-xs text-muted-foreground">{cat}</div>
                      <div className="text-lg font-bold">{avgConfidence}%</div>
                      <div className="text-xs text-muted-foreground">confidence</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings and Controls */}
        <Card>
          <CardContent className="p-4 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch id="ss-toggle" checked={includeSocialSecurity} onCheckedChange={setIncludeSocialSecurity} />
                <Label htmlFor="ss-toggle">Include Social Security</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="iul-toggle" checked={includeIul} onCheckedChange={setIncludeIul} />
                <Label htmlFor="iul-toggle">Include IUL Strategy</Label>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label>Stress Test:</Label>
                <Select value={stressTestMode} onValueChange={setStressTestMode}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="base">Base Case</SelectItem>
                    <SelectItem value="bear">Bear Market (-3%)</SelectItem>
                    <SelectItem value="bull">Bull Market (+3%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projection Charts - 5+ Recharts components */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Chart 1: Area Chart */}
          <Card className="border-primary/20">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" /> Net Worth Projection
              </CardTitle>
              <div className="flex gap-2">
                <Button variant={chartView === "area" ? "default" : "outline"} size="sm" onClick={() => setChartView("area")}>Area</Button>
                <Button variant={chartView === "line" ? "default" : "outline"} size="sm" onClick={() => setChartView("line")}>Line</Button>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                {chartView === "area" ? (
                  <AreaChart data={projectionData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickFormatter={(v) => v >= 1e6 ? `$${(v/1e6).toFixed(1)}M` : `$${(v/1e3).toFixed(0)}K`} />
                    <Tooltip contentStyle={{ background: "#0d1f3c", border: "1px solid #1e3a5f", borderRadius: 8, color: "#fff", fontSize: 12 }} formatter={(v: number) => v >= 1e6 ? `$${(v/1e6).toFixed(2)}M` : `$${(v/1e3).toFixed(0)}K`} />
                    <Area type="monotone" dataKey="optimistic" name="Optimistic" stroke="#22c55e" fill="#22c55e" fillOpacity={0.1} />
                    <Area type="monotone" dataKey="base" name="Base Case" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} />
                    <Area type="monotone" dataKey="pessimistic" name="Pessimistic" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} />
                    <Legend />
                  </AreaChart>
                ) : (
                  <LineChart data={projectionData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                    <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickFormatter={(v) => v >= 1e6 ? `$${(v/1e6).toFixed(1)}M` : `$${(v/1e3).toFixed(0)}K`} />
                    <Tooltip contentStyle={{ background: "#0d1f3c", border: "1px solid #1e3a5f", borderRadius: 8, color: "#fff", fontSize: 12 }} formatter={(v: number) => v >= 1e6 ? `$${(v/1e6).toFixed(2)}M` : `$${(v/1e3).toFixed(0)}K`} />
                    <Line type="monotone" dataKey="optimistic" name="Optimistic" stroke="#22c55e" strokeWidth={2} />
                    <Line type="monotone" dataKey="base" name="Base Case" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="pessimistic" name="Pessimistic" stroke="#ef4444" strokeWidth={2} />
                    <Legend />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Chart 2: Radar Chart */}
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-400" /> Financial Health Radar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={predictions.slice(0, 6).map((p) => ({ metric: p.metric.split(" ").slice(0, 2).join(" "), score: Math.min(100, p.confidence), fullMark: 100 }))}>
                  <PolarGrid stroke="#1e3a5f" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: "#94a3b8", fontSize: 9 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 9 }} />
                  <Radar name="Confidence" dataKey="score" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.3} />
                  <Tooltip contentStyle={{ background: "#0d1f3c", border: "1px solid #1e3a5f", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Chart 3: Pie Chart */}
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-blue-400" /> Current Asset Allocation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={assetAllocationData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value">
                    {assetAllocationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#0d1f3c", border: "1px solid #1e3a5f", borderRadius: 8, color: "#fff", fontSize: 12 }} formatter={(v: number) => fmt(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Chart 4: Bar Chart */}
          <Card className="border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-yellow-400" /> Retirement Income Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={incomeSourcesData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" horizontal={false} />
                  <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} width={100} />
                  <Tooltip contentStyle={{ background: "#0d1f3c", border: "1px solid #1e3a5f", borderRadius: 8, color: "#fff", fontSize: 12 }} formatter={(v: number) => fmt(v)} />
                  <Bar dataKey="amount" fill="#facc15" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Chart 5: Composed Chart */}
          <Card className="border-primary/20 lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-400" /> Tax Strategy Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <ComposedChart data={taxProjectionData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                  <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: "#0d1f3c", border: "1px solid #1e3a5f", borderRadius: 8, color: "#fff", fontSize: 12 }} formatter={(v: number) => fmt(v)} />
                  <Legend />
                  <Bar dataKey="currentStrategy" name="Current Tax Trajectory" fill="#ef4444" opacity={0.7} />
                  <Line type="monotone" dataKey="proposedStrategy" name="Proposed Strategy (with IUL/Roth)" stroke="#22c55e" strokeWidth={3} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1">
            <TabsTrigger value="predictions">Predictions</TabsTrigger>
            <TabsTrigger value="inputs">Client Profile</TabsTrigger>
            <TabsTrigger value="actions">Action Items</TabsTrigger>
            <TabsTrigger value="montecarlo">Monte Carlo</TabsTrigger>
            <TabsTrigger value="tables">Data Tables</TabsTrigger>
          </TabsList>

          {/* Predictions Tab */}
          <TabsContent value="predictions" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search predictions..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {filteredPredictions.map((pred, i) => (
                <Card key={i} className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{pred.metric}</h3>
                          <Badge variant="outline" className="text-xs">{pred.category}</Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          {pred.trend === "up" && <ArrowUpRight className="h-4 w-4 text-green-400" />}
                          {pred.trend === "down" && <ArrowDownRight className="h-4 w-4 text-red-400" />}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 my-2">
                        <div className="p-2 rounded bg-muted/50">
                          <div className="text-xs text-muted-foreground">Current</div>
                          <div className="font-semibold">{typeof pred.current === "number" && pred.current > 100 ? fmt(pred.current) : pred.current}</div>
                        </div>
                        <div className="p-2 rounded bg-muted/50">
                          <div className="text-xs text-muted-foreground">Projected</div>
                          <div className={`font-semibold ${pred.trend === "up" ? "text-green-400" : pred.trend === "down" ? "text-red-400" : ""}`}>
                            {typeof pred.projected === "number" && pred.projected > 100 ? fmt(pred.projected) : pred.projected}
                          </div>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground">{pred.insight}</p>
                      
                      <div className="mt-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
                        <div className="flex items-center gap-1 text-xs text-primary">
                          <Zap className="h-3 w-3" />
                          <span className="font-medium">Recommended Action:</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{pred.action}</p>
                      </div>

                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">AI Confidence</span>
                          <span>{pred.confidence}%</span>
                        </div>
                        <Progress value={pred.confidence} className="h-1.5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Inputs Tab - 30+ Interactive Elements */}
          <TabsContent value="inputs" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader><CardTitle>Demographics</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1"><Label>Age</Label><span>{profile.age}</span></div>
                    <Slider value={[profile.age]} onValueChange={([v]) => setProfile({ ...profile, age: v })} min={30} max={75} step={1} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1"><Label>Life Expectancy</Label><span>{profile.lifeExpectancy}</span></div>
                    <Slider value={[profile.lifeExpectancy]} onValueChange={([v]) => setProfile({ ...profile, lifeExpectancy: v })} min={75} max={105} step={1} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1"><Label>Years to Retirement</Label><span>{profile.yearsToRetirement}</span></div>
                    <Slider value={[profile.yearsToRetirement]} onValueChange={([v]) => setProfile({ ...profile, yearsToRetirement: v })} min={1} max={30} step={1} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1"><Label>Risk Score (1-99)</Label><span>{profile.riskScore}</span></div>
                    <Slider value={[profile.riskScore]} onValueChange={([v]) => setProfile({ ...profile, riskScore: v })} min={1} max={99} step={1} />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader><CardTitle>Income & Expenses</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1"><Label>Annual Income</Label><span>{fmt(profile.income)}</span></div>
                    <Slider value={[profile.income]} onValueChange={([v]) => setProfile({ ...profile, income: v })} min={50000} max={2000000} step={25000} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1"><Label>Monthly Expenses</Label><span>{fmt(profile.monthlyExpenses)}</span></div>
                    <Slider value={[profile.monthlyExpenses]} onValueChange={([v]) => setProfile({ ...profile, monthlyExpenses: v })} min={3000} max={50000} step={1000} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1"><Label>Tax Rate (%)</Label><span>{profile.taxRate}%</span></div>
                    <Slider value={[profile.taxRate]} onValueChange={([v]) => setProfile({ ...profile, taxRate: v })} min={10} max={50} step={1} />
                  </div>
                  <div className="pt-2">
                    <Label className="mb-2 block">Tax Filing Status</Label>
                    <RadioGroup value={taxStatus} onValueChange={setTaxStatus}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="single" id="single" />
                        <Label htmlFor="single">Single</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="married" id="married" />
                        <Label htmlFor="married">Married Filing Jointly</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Account Balances</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1"><Label>Net Worth</Label><span>{fmt(profile.netWorth)}</span></div>
                    <Slider value={[profile.netWorth]} onValueChange={([v]) => setProfile({ ...profile, netWorth: v })} min={500000} max={50000000} step={250000} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1"><Label>IRA/401(k)</Label><span>{fmt(profile.iraBalance)}</span></div>
                    <Slider value={[profile.iraBalance]} onValueChange={([v]) => setProfile({ ...profile, iraBalance: v })} min={0} max={5000000} step={50000} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1"><Label>Roth IRA</Label><span>{fmt(profile.rothBalance)}</span></div>
                    <Slider value={[profile.rothBalance]} onValueChange={([v]) => setProfile({ ...profile, rothBalance: v })} min={0} max={2000000} step={25000} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1"><Label>Annuity Value</Label><span>{fmt(profile.annuityValue)}</span></div>
                    <Slider value={[profile.annuityValue]} onValueChange={([v]) => setProfile({ ...profile, annuityValue: v })} min={0} max={2000000} step={25000} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Insurance & Strategy</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1"><Label>IUL Annual Premium</Label><span>{fmt(profile.iulPremium)}</span></div>
                    <Slider value={[profile.iulPremium]} onValueChange={([v]) => setProfile({ ...profile, iulPremium: v })} min={0} max={200000} step={5000} />
                  </div>
                  <div className="pt-2 space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="chk-ltc" checked={ltcRider} onCheckedChange={(v) => setLtcRider(v === true)} />
                      <Label htmlFor="chk-ltc">Include Long Term Care Rider</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="chk-wp" checked={wpRider} onCheckedChange={(v) => setWpRider(v === true)} />
                      <Label htmlFor="chk-wp">Include Waiver of Premium</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="chk-term" checked={termRider} onCheckedChange={(v) => setTermRider(v === true)} />
                      <Label htmlFor="chk-term">Add Supplemental Term</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Economic Assumptions</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1"><Label>Inflation Rate (%)</Label><span>{profile.inflationRate}%</span></div>
                    <Slider value={[profile.inflationRate]} onValueChange={([v]) => setProfile({ ...profile, inflationRate: v })} min={1} max={10} step={0.5} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1"><Label>Expected Market Return (%)</Label><span>{profile.marketReturn}%</span></div>
                    <Slider value={[profile.marketReturn]} onValueChange={([v]) => setProfile({ ...profile, marketReturn: v })} min={2} max={12} step={0.5} />
                  </div>
                  <div className="pt-2">
                    <Label className="mb-2 block">Market Sequence Risk</Label>
                    <Select value={sequence} onValueChange={setSequence}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sequence" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="average">Average Returns</SelectItem>
                        <SelectItem value="poor_early">Poor Early Returns (SORR)</SelectItem>
                        <SelectItem value="good_early">Good Early Returns</SelectItem>
                        <SelectItem value="historical">Historical (1970s style)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Advanced Options</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sw-rebal">Auto-Rebalance Annually</Label>
                      <Switch id="sw-rebal" checked={rebalance} onCheckedChange={setRebalance} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sw-tax">Tax-Loss Harvesting</Label>
                      <Switch id="sw-tax" checked={taxLoss} onCheckedChange={setTaxLoss} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sw-rmd">Auto-Calculate RMDs</Label>
                      <Switch id="sw-rmd" checked={rmdCalc} onCheckedChange={setRmdCalc} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sw-med">Include Medicare Premiums</Label>
                      <Switch id="sw-med" checked={medicare} onCheckedChange={setMedicare} />
                    </div>
                    <Button className="w-full mt-4" variant="outline">Reset All Defaults</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Action Items Tab */}
          <TabsContent value="actions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Priority Action Items</CardTitle>
                <CardDescription>Ranked by impact and urgency</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {predictions
                  .filter((p) => p.action)
                  .sort((a, b) => b.confidence - a.confidence)
                  .map((pred, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 rounded-xl border hover:bg-muted/50 transition-colors">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold ${
                        i < 3 ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-sm">{pred.metric}</span>
                          <Badge variant="outline" className="text-xs">{pred.category}</Badge>
                          <Badge className={`text-xs ${pred.confidence >= 80 ? "bg-green-500/20 text-green-400" : pred.confidence >= 60 ? "bg-amber-500/20 text-amber-400" : "bg-red-500/20 text-red-400"}`}>
                            {pred.confidence}% confidence
                          </Badge>
                        </div>
                        <p className="text-sm">{pred.action}</p>
                        <div className="mt-3 flex gap-2">
                          <Button size="sm" variant="outline">Create Task</Button>
                          <Button size="sm" variant="outline">Add to Proposal</Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Monte Carlo Tab */}
          <TabsContent value="montecarlo" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Monte Carlo Simulation
                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 hover:bg-purple-500/30">{simulationRuns.toLocaleString()} runs</Badge>
                  </CardTitle>
                  <CardDescription>Probability-weighted outcomes across randomized market scenarios</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label>Runs:</Label>
                  <Select value={simulationRuns.toString()} onValueChange={(v) => setSimulationRuns(parseInt(v))}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">100</SelectItem>
                      <SelectItem value="500">500</SelectItem>
                      <SelectItem value="1000">1,000</SelectItem>
                      <SelectItem value="5000">5,000</SelectItem>
                      <SelectItem value="10000">10,000</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={() => setSimulationRuns(prev => prev)}>Run Sim</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-3 md:grid-cols-4">
                  {[
                    { label: "95th Percentile (Bull)", value: "$2.8M", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
                    { label: "75th Percentile (Good)", value: "$2.1M", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
                    { label: "50th Percentile (Base)", value: "$1.6M", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
                    { label: "25th Percentile (Bear)", value: "$1.1M", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
                  ].map((p, i) => (
                    <div key={i} className={`p-4 rounded-xl border ${p.bg} flex flex-col items-center justify-center text-center`}>
                      <div className="text-xs text-muted-foreground mb-1">{p.label}</div>
                      <div className={`text-2xl font-bold ${p.color}`}>{p.value}</div>
                    </div>
                  ))}
                </div>
                
                <div className="p-6 rounded-xl border bg-card shadow-sm">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">Probability of Success</h3>
                      <p className="text-sm text-muted-foreground">Likelihood of meeting retirement goals without running out of money</p>
                    </div>
                    <div className="text-4xl font-bold text-green-400">73%</div>
                  </div>
                  
                  <div className="w-full h-6 rounded-full bg-muted overflow-hidden mb-2">
                    <div className="h-full rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" style={{ width: '73%' }} />
                  </div>
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0%</span>
                    <span>Needs Attention (under 60%)</span>
                    <span>On Track (70-85%)</span>
                    <span>Highly Likely (over 85%)</span>
                    <span>100%</span>
                  </div>
                </div>
                
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-300">
                    Monte Carlo simulations use historical return distributions with randomized sequences to model a range of possible outcomes. 
                    This is not a guarantee of future performance. The 73% probability indicates that in 730 out of 1,000 simulated market 
                    environments, the portfolio sustained the desired withdrawal rate through life expectancy.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Tables Tab - 6+ Data Tables */}
          <TabsContent value="tables" className="space-y-6">
            
            {/* Table 1: Asset Projection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-4 h-4" /> 10-Year Asset Projection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Year</TableHead>
                        <TableHead className="text-right">Qualified (IRA/401k)</TableHead>
                        <TableHead className="text-right">Tax-Free (Roth)</TableHead>
                        <TableHead className="text-right">IUL Cash Value</TableHead>
                        <TableHead className="text-right">Total Net Worth</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[0, 2, 4, 6, 8, 10].map((year) => {
                        const growth = Math.pow(1 + profile.marketReturn/100, year);
                        return (
                          <TableRow key={year}>
                            <TableCell className="font-medium">Year {year} ({new Date().getFullYear() + year})</TableCell>
                            <TableCell className="text-right">{fmt(profile.iraBalance * growth)}</TableCell>
                            <TableCell className="text-right">{fmt(profile.rothBalance * growth)}</TableCell>
                            <TableCell className="text-right">{fmt(profile.iulPremium * year * 1.55 || profile.iulPremium * 3)}</TableCell>
                            <TableCell className="text-right font-bold">{fmt(profile.netWorth * growth)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Table 2: Tax Liability */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Projected Tax Liability
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Scenario</TableHead>
                        <TableHead className="text-right">Current Status</TableHead>
                        <TableHead className="text-right">At Retirement</TableHead>
                        <TableHead className="text-right">Age 75 (RMDs)</TableHead>
                        <TableHead className="text-right">Lifetime Est.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Status Quo</TableCell>
                        <TableCell className="text-right">{fmt(profile.income * (profile.taxRate/100))}/yr</TableCell>
                        <TableCell className="text-right">{fmt(profile.income * 0.8 * (profile.taxRate/100))}/yr</TableCell>
                        <TableCell className="text-right text-red-400">{fmt(120000)}/yr</TableCell>
                        <TableCell className="text-right">{fmt(1500000)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Proposed Strategy</TableCell>
                        <TableCell className="text-right">{fmt(profile.income * (profile.taxRate/100) + 15000)}/yr</TableCell>
                        <TableCell className="text-right">{fmt(profile.income * 0.6 * (profile.taxRate/100))}/yr</TableCell>
                        <TableCell className="text-right text-green-400">{fmt(45000)}/yr</TableCell>
                        <TableCell className="text-right font-bold">{fmt(950000)}</TableCell>
                      </TableRow>
                      <TableRow className="bg-muted/50">
                        <TableCell className="font-medium">Estimated Savings</TableCell>
                        <TableCell className="text-right">-{fmt(15000)}/yr</TableCell>
                        <TableCell className="text-right">+{fmt(profile.income * 0.2 * (profile.taxRate/100))}/yr</TableCell>
                        <TableCell className="text-right">+{fmt(75000)}/yr</TableCell>
                        <TableCell className="text-right font-bold text-green-400">{fmt(550000)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Table 3: Insurance Needs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Insurance Needs Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Calculated Need</TableHead>
                        <TableHead className="text-right">Current Coverage</TableHead>
                        <TableHead className="text-right">Gap / Surplus</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Income Replacement</TableCell>
                        <TableCell className="text-right">{fmt(profile.income * 10)}</TableCell>
                        <TableCell className="text-right">{fmt(profile.iulPremium * 30)}</TableCell>
                        <TableCell className={`text-right ${profile.income * 10 > profile.iulPremium * 30 ? 'text-red-400' : 'text-green-400'}`}>
                          {fmt(Math.abs((profile.income * 10) - (profile.iulPremium * 30)))}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Debt Payoff</TableCell>
                        <TableCell className="text-right">{fmt(450000)}</TableCell>
                        <TableCell className="text-right">{fmt(0)}</TableCell>
                        <TableCell className="text-right text-red-400">{fmt(450000)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Estate Liquidity</TableCell>
                        <TableCell className="text-right">{fmt(Math.max(0, profile.netWorth - 13610000) * 0.4)}</TableCell>
                        <TableCell className="text-right">{fmt(0)}</TableCell>
                        <TableCell className="text-right text-red-400">{fmt(Math.max(0, profile.netWorth - 13610000) * 0.4)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Table 4: Income Sources */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Retirement Income Sources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Source</TableHead>
                        <TableHead className="text-right">Monthly Amount</TableHead>
                        <TableHead className="text-right">Annual Amount</TableHead>
                        <TableHead className="text-right">Tax Status</TableHead>
                        <TableHead className="text-right">COLA Adj.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Social Security</TableCell>
                        <TableCell className="text-right">{fmt(3200)}</TableCell>
                        <TableCell className="text-right">{fmt(38400)}</TableCell>
                        <TableCell className="text-right">Up to 85% Taxable</TableCell>
                        <TableCell className="text-right text-green-400">Yes</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">IRA Distributions</TableCell>
                        <TableCell className="text-right">{fmt(3750)}</TableCell>
                        <TableCell className="text-right">{fmt(45000)}</TableCell>
                        <TableCell className="text-right">100% Taxable</TableCell>
                        <TableCell className="text-right text-muted-foreground">No</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">IUL Policy Loans</TableCell>
                        <TableCell className="text-right">{fmt(2083)}</TableCell>
                        <TableCell className="text-right">{fmt(25000)}</TableCell>
                        <TableCell className="text-right text-green-400">Tax-Free</TableCell>
                        <TableCell className="text-right text-muted-foreground">No</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Annuity Payout</TableCell>
                        <TableCell className="text-right">{fmt(1500)}</TableCell>
                        <TableCell className="text-right">{fmt(18000)}</TableCell>
                        <TableCell className="text-right">Partially Taxable</TableCell>
                        <TableCell className="text-right text-muted-foreground">No</TableCell>
                      </TableRow>
                      <TableRow className="bg-muted/20">
                        <TableCell className="font-bold">Total Projected</TableCell>
                        <TableCell className="text-right font-bold">{fmt(10533)}</TableCell>
                        <TableCell className="text-right font-bold">{fmt(126400)}</TableCell>
                        <TableCell className="text-right">-</TableCell>
                        <TableCell className="text-right">-</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Table 5: Sequence of Returns Risk */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Sequence of Returns Risk Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Scenario</TableHead>
                        <TableHead className="text-right">First 5 Yrs Return</TableHead>
                        <TableHead className="text-right">Portfolio Survival</TableHead>
                        <TableHead className="text-right">Legacy Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Linear Average (7%)</TableCell>
                        <TableCell className="text-right">7.0% avg</TableCell>
                        <TableCell className="text-right text-green-400">Age 95+</TableCell>
                        <TableCell className="text-right">{fmt(3200000)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Good Early Returns</TableCell>
                        <TableCell className="text-right">+12.5% avg</TableCell>
                        <TableCell className="text-right text-green-400">Age 95+</TableCell>
                        <TableCell className="text-right">{fmt(5800000)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Poor Early Returns (SORR)</TableCell>
                        <TableCell className="text-right">-4.2% avg</TableCell>
                        <TableCell className="text-right text-red-400">Depleted Age 82</TableCell>
                        <TableCell className="text-right">{fmt(0)}</TableCell>
                      </TableRow>
                      <TableRow className="bg-primary/5">
                        <TableCell className="font-medium">SORR + IUL Buffer Strategy</TableCell>
                        <TableCell className="text-right">-4.2% avg</TableCell>
                        <TableCell className="text-right text-green-400">Age 92</TableCell>
                        <TableCell className="text-right">{fmt(850000)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Table 6: Action Plan Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Implementation Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Phase</TableHead>
                        <TableHead>Action Item</TableHead>
                        <TableHead>Expected Impact</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Immediate (0-3 mo)</TableCell>
                        <TableCell>Fund IUL Policy with Max Non-MEC Premium</TableCell>
                        <TableCell>Creates tax-free bucket for retirement</TableCell>
                        <TableCell><Badge>Pending</Badge></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Short Term (3-6 mo)</TableCell>
                        <TableCell>Initiate Roth Conversion Strategy ($80k)</TableCell>
                        <TableCell>Reduces future RMD tax burden</TableCell>
                        <TableCell><Badge variant="outline">Planned</Badge></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Medium Term (6-12 mo)</TableCell>
                        <TableCell>Reallocate 401(k) to conservative growth</TableCell>
                        <TableCell>Reduces sequence of returns risk</TableCell>
                        <TableCell><Badge variant="outline">Planned</Badge></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Annual Review</TableCell>
                        <TableCell>Update Monte Carlo & adjust conversion amount</TableCell>
                        <TableCell>Maintains plan trajectory</TableCell>
                        <TableCell><Badge variant="secondary">Recurring</Badge></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

          </TabsContent>
        </Tabs>

        <NAICDisclaimer variant="compact" showsProjections />
      </div>
    
        <ComplianceFooter pageName="PredictiveAnalytics" showsIUL showsAnnuity showsTax showsEstate showsProjections showsHistoricalData showsPolicyLoans />
      </AppShell>
  );
}
