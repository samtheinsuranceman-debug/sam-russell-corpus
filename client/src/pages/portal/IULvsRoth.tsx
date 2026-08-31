// @ts-nocheck
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { NumberInput } from "@/components/NumberInput";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Scale,
  TrendingUp,
  Shield,
  Crown,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  Ban,
  Banknote,
  RefreshCw,
  Search,
  Activity,
  Star,
  Settings,
  Target,
  FileText,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, AreaChart, Area, BarChart, Bar, Cell,
  PieChart, Pie, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart
} from "recharts";
import { toast } from "sonner";
import ExportPdfButton from "@/components/ExportPdfButton";
import { ExportToSlides } from "@/components/ExportToSlides";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { TimeMachineToggle, useTimeMachine } from "@/components/TimeMachineToggle";
import { TimeMachineInlineDisclaimer } from "@/components/TimeMachineInlineDisclaimer";
import { IbbotsonYearSelector } from "@/components/IbbotsonYearSelector";
import { Switch } from "@/components/ui/switch";
import { SP500_ANNUAL_RETURNS as IBBOTSON_RETURNS, calculateCreditedRate, IBBOTSON_DEFAULT_START_YEAR } from "@shared/ibbotsonModel";
import { PlatformEnhancements } from "@/components/PlatformEnhancements";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { useClientData } from "@/contexts/ClientDataContext";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;
const fmtM = (n: number) => n >= 1000000 ? `$${(n / 1000000).toFixed(2)}M` : fmt(n);
const fmtPct = (n: number) => `${(n * 100).toFixed(2)}%`;

const TM_TOOLTIP = "Time Machine values represent a hypothetical pre-existing account large enough that, when credited at AG 49-compliant rates (0–7.5%), it produces the same dollar interest credit that actual 30-year historical index returns would have generated. No AG 49 laws are violated.";

const ROTH_LIMITS = {
  contributionUnder50: 7000,
  contributionOver50: 8000,
  catchUpAge: 50,
  incomePhaseOutSingleStart: 146000,
  incomePhaseOutSingleEnd: 161000,
  incomePhaseOutMarriedStart: 230000,
  incomePhaseOutMarriedEnd: 240000,
  earlyWithdrawalPenalty: 0.10,
  earlyWithdrawalAge: 59.5,
  fiveYearRule: 5,
};

const COMPARISON_FEATURES = [
  {
    category: "Contribution Limits",
    features: [
      { feature: "Annual Contribution Limit", iul: "UNLIMITED", roth: `$${ROTH_LIMITS.contributionUnder50.toLocaleString()} ($${ROTH_LIMITS.contributionOver50.toLocaleString()} if 50+)`, iulWins: true },
      { feature: "Income Eligibility Limits", iul: "No income limits", roth: `Phased out: $${(ROTH_LIMITS.incomePhaseOutSingleStart / 1000).toFixed(0)}K-$${(ROTH_LIMITS.incomePhaseOutSingleEnd / 1000).toFixed(0)}K (Single), $${(ROTH_LIMITS.incomePhaseOutMarriedStart / 1000).toFixed(0)}K-$${(ROTH_LIMITS.incomePhaseOutMarriedEnd / 1000).toFixed(0)}K (Married)`, iulWins: true },
      { feature: "Lifetime Contribution Cap", iul: "No cap — fund as much as you want", roth: "Limited by annual caps × years", iulWins: true },
    ],
  },
  {
    category: "Access & Withdrawals",
    features: [
      { feature: "Access to Full Illustrated Policy Value", iul: "Yes — borrow against 100% of illustrated policy value via policy loans at any age", roth: "No — can only withdraw CONTRIBUTIONS tax-free before 59½. EARNINGS are locked until 59½ AND 5-year rule met", iulWins: true },
      { feature: "Early Withdrawal Penalty", iul: "NONE — policy loans are not withdrawals, no penalties ever", roth: "10% penalty on EARNINGS before age 59½ + income tax", iulWins: true },
      { feature: "5-Year Waiting Rule", iul: "No waiting period — access illustrated policy value immediately", roth: "Must wait 5 years from first contribution for tax-free earnings withdrawal", iulWins: true },
      { feature: "Age 59½ Restriction", iul: "No age restrictions on accessing funds", roth: "Earnings locked until 59½ (plus 5-year rule)", iulWins: true },
      { feature: "Required Minimum Distributions", iul: "No RMDs ever", roth: "No RMDs (advantage shared)", iulWins: false },
    ],
  },
  {
    category: "Tax Treatment",
    features: [
      { feature: "Tax-Free Growth", iul: "Yes — illustrated policy value grows tax-deferred", roth: "Yes — grows tax-free", iulWins: false },
      { feature: "Tax-Free Income", iul: "Yes — via policy loans (not reported as income)", roth: "Yes — but only after 59½ AND 5-year rule", iulWins: true },
      { feature: "Tax-Free Death Benefit", iul: "Yes — income tax-free to beneficiaries", roth: "Inherited Roth is tax-free but must be distributed within 10 years (SECURE Act)", iulWins: true },
    ],
  },
  {
    category: "Protection & Benefits",
    features: [
      { feature: "Downside Market Protection", iul: "0% floor — never lose money in a down market", roth: "No protection — full market exposure and loss risk", iulWins: true },
      { feature: "Death Benefit", iul: "Immediate leveraged death benefit (often 10-20x first premium)", roth: "Only account balance — no leverage", iulWins: true },
      { feature: "Long-Term Care Rider", iul: "Available — 4% of death benefit monthly for chronic illness", roth: "Not available", iulWins: true },
      { feature: "Creditor Protection", iul: "Protected in most states", roth: "Varies by state — limited protection", iulWins: true },
      { feature: "Chronic Illness Accelerated Benefit", iul: "Available — access death benefit while living", roth: "Not available", iulWins: true },
    ],
  },
];

const TAX_BRACKETS_SINGLE = [
  { rate: 0.10, upTo: 11600 },
  { rate: 0.12, upTo: 47150 },
  { rate: 0.22, upTo: 100525 },
  { rate: 0.24, upTo: 191950 },
  { rate: 0.32, upTo: 243725 },
  { rate: 0.35, upTo: 609350 },
  { rate: 0.37, upTo: Infinity }
];

const TAX_BRACKETS_MARRIED = [
  { rate: 0.10, upTo: 23200 },
  { rate: 0.12, upTo: 94300 },
  { rate: 0.22, upTo: 201050 },
  { rate: 0.24, upTo: 383900 },
  { rate: 0.32, upTo: 487450 },
  { rate: 0.35, upTo: 731200 },
  { rate: 0.37, upTo: Infinity }
];

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#a855f7", "#ec4899", "#06b6d4", "#f97316"];

export default function IULvsRoth() {
  const { clientData } = useClientData();
  const { user } = useAuth();
  
  const [age, setAge] = useState(35);
  const [annualContribution, setAnnualContribution] = useState(50000);
  const [years, setYears] = useState(30);
  const [iulRate, setIulRate] = useState(0.075); 
  const [rothRate, setRothRate] = useState(0.08);
  const [income, setIncome] = useState(250000);
  const [filingStatus, setFilingStatus] = useState<"single" | "married">("married");
  const [useIbbotsonModel, setUseIbbotsonModel] = useState(true);
  const [ibbotsonStartYear, setIbbotsonStartYear] = useState(IBBOTSON_DEFAULT_START_YEAR);
  const [inflationRate, setInflationRate] = useState(0.025);
  const [stateTaxRate, setStateTaxRate] = useState(0.05);
  const [activeTab, setActiveTab] = useState("overview");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [retirementAge, setRetirementAge] = useState(65);
  const [lifeExpectancy, setLifeExpectancy] = useState(90);
  const [withdrawalRate, setWithdrawalRate] = useState(0.04);
  const [loanInterestRate, setLoanInterestRate] = useState(0.05);
  const [iulFees, setIulFees] = useState(0.015);
  const [rothFees, setRothFees] = useState(0.005);
  const [showTooltips, setShowTooltips] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [currentScenario, setCurrentScenario] = useState("base");
  const [marketCondition, setMarketCondition] = useState("average");
  const [riskTolerance, setRiskTolerance] = useState(5);
  const [includeSocialSecurity, setIncludeSocialSecurity] = useState(false);
  const [ssAmount, setSsAmount] = useState(3000);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const tm = useTimeMachine();

  const compareMut = trpc.iulVsRoth.compare.useMutation();
  const saveScenarioMut = trpc.scenarios.save.useMutation();
  
  const { data: clientApiData, refetch: refetchClient } = trpc.clients.get.useQuery({ id: user?.id || "" }, { enabled: !!user?.id });
  const { data: marketData } = trpc.marketData.getHistorical.useQuery({ years: 30 }, { staleTime: 1000 * 60 * 60 });
  const { data: taxRates } = trpc.taxReturnOcr.getRates.useQuery({ year: new Date().getFullYear() }, { retry: false });
  const { data: aiInsights } = trpc.ai.generateInsights.useQuery({
    prompt: `Compare IUL vs Roth for age ${age}, income ${income}, contribution ${annualContribution}`
  }, { enabled: showAdvanced });
  const { data: riskProfile } = trpc.riskProfile.get.useQuery({ clientId: user?.id || "" }, { enabled: !!user?.id });

  const handleAgeChange = useCallback((val: number) => setAge(Math.max(18, Math.min(80, val))), []);
  const handleContributionChange = useCallback((val: number) => setAnnualContribution(Math.max(1000, val)), []);
  const handleYearsChange = useCallback((val: number) => setYears(Math.max(5, Math.min(50, val))), []);
  const handleIulRateChange = useCallback((val: number) => setIulRate(Math.max(0, Math.min(0.15, val))), []);
  const handleRothRateChange = useCallback((val: number) => setRothRate(Math.max(0, Math.min(0.15, val))), []);
  const handleIncomeChange = useCallback((val: number) => setIncome(Math.max(0, val)), []);
  const handleRetirementAgeChange = useCallback((val: number) => setRetirementAge(Math.max(age + 1, Math.min(85, val))), [age]);
  const handleLifeExpectancyChange = useCallback((val: number) => setLifeExpectancy(Math.max(retirementAge + 1, Math.min(120, val))), [retirementAge]);
  
  const toggleAdvanced = useCallback(() => setShowAdvanced(prev => !prev), []);
  const toggleTooltips = useCallback(() => setShowTooltips(prev => !prev), []);
  const toggleSocialSecurity = useCallback(() => setIncludeSocialSecurity(prev => !prev), []);
  
  const handleTabChange = useCallback((val: string) => setActiveTab(val), []);
  const handleScenarioChange = useCallback((val: string) => setCurrentScenario(val), []);
  const handleMarketConditionChange = useCallback((val: string) => setMarketCondition(val), []);
  const handleFilingStatusChange = useCallback((val: "single" | "married") => setFilingStatus(val), []);
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value), []);
  const handleRowExpand = useCallback((id: string) => setExpandedRow(prev => prev === id ? null : id), []);

  const runCompare = useCallback(() => {
    setIsSimulating(true);
    setSimulationProgress(0);
    
    const interval = setInterval(() => {
      setSimulationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSimulating(false);
          compareMut.mutate({ age, annualContribution, years, iulRate, rothRate });
          toast.success("Mega Roth comparison complete!");
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  }, [age, annualContribution, years, iulRate, rothRate, compareMut]);

  const saveScenario = useCallback(() => {
    saveScenarioMut.mutate({
      name: `IUL vs Roth - ${fmt(annualContribution)}/yr`,
      data: { age, annualContribution, years, iulRate, rothRate, income, filingStatus }
    });
    toast.success("Scenario saved successfully");
  }, [age, annualContribution, years, iulRate, rothRate, income, filingStatus, saveScenarioMut]);

  const resetDefaults = useCallback(() => {
    setAge(35);
    setAnnualContribution(50000);
    setYears(30);
    setIulRate(0.075);
    setRothRate(0.08);
    setIncome(250000);
    setFilingStatus("married");
    setRetirementAge(65);
    toast.info("Reset to default values");
  }, []);

  const result = compareMut.data;

  const rothEligible = useMemo(() => {
    const limit = filingStatus === "single" ? ROTH_LIMITS.incomePhaseOutSingleEnd : ROTH_LIMITS.incomePhaseOutMarriedEnd;
    const start = filingStatus === "single" ? ROTH_LIMITS.incomePhaseOutSingleStart : ROTH_LIMITS.incomePhaseOutMarriedStart;
    if (income >= limit) return { eligible: false, maxContribution: 0, reason: "Income exceeds Roth IRA limit" };
    if (income >= start) {
      const reduction = Math.round(((income - start) / (limit - start)) * ROTH_LIMITS.contributionUnder50);
      const max = Math.max(0, (age >= 50 ? ROTH_LIMITS.contributionOver50 : ROTH_LIMITS.contributionUnder50) - reduction);
      return { eligible: true, maxContribution: max, reason: "Reduced contribution (phase-out range)" };
    }
    return { eligible: true, maxContribution: age >= 50 ? ROTH_LIMITS.contributionOver50 : ROTH_LIMITS.contributionUnder50, reason: "Full contribution allowed" };
  }, [income, age, filingStatus]);

  const taxAnalysis = useMemo(() => {
    const brackets = filingStatus === "single" ? TAX_BRACKETS_SINGLE : TAX_BRACKETS_MARRIED;
    let taxOwed = 0;
    let remainingIncome = income;
    let prevLimit = 0;
    
    for (const bracket of brackets) {
      if (remainingIncome > 0) {
        const taxableInBracket = Math.min(remainingIncome, bracket.upTo - prevLimit);
        taxOwed += taxableInBracket * bracket.rate;
        remainingIncome -= taxableInBracket;
        prevLimit = bracket.upTo;
      } else {
        break;
      }
    }
    
    const stateTaxOwed = income * stateTaxRate;
    const totalTax = taxOwed + stateTaxOwed;
    const effectiveRate = totalTax / income;
    const marginalRate = brackets.find((b) => income <= b.upTo)?.rate || 0.37;
    
    return { federalTax: taxOwed, stateTax: stateTaxOwed, totalTax, effectiveRate, marginalRate };
  }, [income, filingStatus, stateTaxRate]);

  const megaRothAdvantage = useMemo(() => {
    const rothMaxAnnual = rothEligible.maxContribution;
    const iulAnnual = annualContribution;
    const excessPerYear = iulAnnual - rothMaxAnnual;

    const iulData = [];
    let iulValue = 0;
    let iulBasis = 0;
    
    for (let y = 1; y <= years; y++) {
      const netPremium = iulAnnual * (1 - iulFees);
      iulBasis += iulAnnual;
      let yearRate = iulRate;
      
      if (useIbbotsonModel) {
        const calYear = ibbotsonStartYear + y - 1;
        const sp500 = IBBOTSON_RETURNS[calYear];
        if (sp500 !== undefined) {
          yearRate = calculateCreditedRate(sp500, iulRate, 0, 1.0);
        }
      }
      
      iulValue = (iulValue + netPremium) * (1 + yearRate);
      iulData.push({ 
        year: y, 
        age: age + y, 
        iulValue: Math.round(iulValue), 
        iulBasis,
        rothValue: 0, 
        rothBasis: 0,
        excess: Math.round(excessPerYear * y),
        taxSavings: Math.round(iulValue * taxAnalysis.effectiveRate)
      });
    }

    let rothValue = 0;
    let rothBasis = 0;
    for (let y = 1; y <= years; y++) {
      rothBasis += rothMaxAnnual;
      rothValue = (rothValue + rothMaxAnnual * (1 - rothFees)) * (1 + rothRate);
      iulData[y - 1].rothValue = Math.round(rothValue);
      iulData[y - 1].rothBasis = rothBasis;
    }

    return {
      data: iulData,
      totalIulContributed: iulAnnual * years,
      totalRothContributed: rothMaxAnnual * years,
      excessFundingPerYear: excessPerYear,
      totalExcess: excessPerYear * years,
      iulFinal: iulData[iulData.length - 1]?.iulValue ?? 0,
      rothFinal: iulData[iulData.length - 1]?.rothValue ?? 0,
    };
  }, [annualContribution, years, iulRate, rothRate, age, rothEligible.maxContribution, useIbbotsonModel, ibbotsonStartYear, iulFees, rothFees, taxAnalysis.effectiveRate]);

  const tmOverlay = useMemo(() => {
    if (!tm.enabled || tm.selectedOptions.length === 0) return null;
    return tm.generateOverlay(
      { annualPremium: annualContribution, fundingYears: years },
      age,
      years,
    );
  }, [tm.enabled, tm.selectedOptions, tm.startYear, annualContribution, years, age]);

  const mergedGrowthData = useMemo(() => {
    return megaRothAdvantage.data.map((d, i) => ({
      ...d,
      tmValue: tmOverlay?.[i]?.accountValue,
      difference: d.iulValue - d.rothValue
    }));
  }, [megaRothAdvantage.data, tmOverlay]);

  const accessTimeline = useMemo(() => {
    const data = [];
    for (let a = age; a <= Math.min(age + years, 80); a++) {
      const yearsIn = a - age;
      const rothContribBasis = rothEligible.maxContribution * yearsIn;
      const rothEarnings = yearsIn > 0 ? megaRothAdvantage.data[yearsIn - 1]?.rothValue - rothContribBasis : 0;
      const iulCashValue = yearsIn > 0 ? megaRothAdvantage.data[yearsIn - 1]?.iulValue ?? 0 : 0;

      const rothAccessible = a < 59.5 ? Math.max(0, rothContribBasis) : (yearsIn >= 5 ? megaRothAdvantage.data[Math.min(yearsIn - 1, megaRothAdvantage.data.length - 1)]?.rothValue ?? 0 : Math.max(0, rothContribBasis));
      const iulAccessible = iulCashValue * 0.80;
      const tmAccessible = tmOverlay && yearsIn > 0 ? (tmOverlay[yearsIn - 1]?.surrenderValue ?? 0) * 0.80 : undefined;

      data.push({
        age: a,
        "IUL Accessible (80% CSV)": Math.round(iulAccessible),
        "Roth Accessible": Math.round(rothAccessible),
        "Roth Locked Earnings": Math.round(rothEarnings > 0 && a < 59.5 ? rothEarnings : 0),
        "TM Accessible (80% SV)": tmAccessible ? Math.round(tmAccessible) : undefined,
      });
    }
    return data;
  }, [age, years, rothEligible.maxContribution, megaRothAdvantage.data, tmOverlay]);

  const retirementIncomeData = useMemo(() => {
    const data = [];
    let iulBalance = megaRothAdvantage.iulFinal;
    let rothBalance = megaRothAdvantage.rothFinal;
    const retirementYears = lifeExpectancy - retirementAge;
    
    for (let i = 0; i <= retirementYears; i++) {
      const currentAge = retirementAge + i;
      const iulIncome = iulBalance * withdrawalRate;
      const rothIncome = rothBalance * withdrawalRate;
      const ssIncome = includeSocialSecurity ? ssAmount * 12 * Math.pow(1 + inflationRate, currentAge - 65) : 0;
      
      data.push({
        age: currentAge,
        iulIncome: Math.round(iulIncome),
        rothIncome: Math.round(rothIncome),
        ssIncome: Math.round(ssIncome),
        totalIulIncome: Math.round(iulIncome + ssIncome),
        totalRothIncome: Math.round(rothIncome + ssIncome),
        iulBalance: Math.round(iulBalance),
        rothBalance: Math.round(rothBalance)
      });
      
      iulBalance = (iulBalance - iulIncome) * (1 + iulRate) * (1 - iulFees);
      rothBalance = (rothBalance - rothIncome) * (1 + rothRate) * (1 - rothFees);
    }
    return data;
  }, [megaRothAdvantage.iulFinal, megaRothAdvantage.rothFinal, retirementAge, lifeExpectancy, withdrawalRate, iulRate, rothRate, iulFees, rothFees, includeSocialSecurity, ssAmount, inflationRate]);

  const riskMetricsData = useMemo(() => {
    return [
      { subject: 'Market Risk', A: 10, B: 100, fullMark: 100 },
      { subject: 'Tax Risk', A: 20, B: 80, fullMark: 100 },
      { subject: 'Longevity Risk', A: 30, B: 90, fullMark: 100 },
      { subject: 'Inflation Risk', A: 60, B: 70, fullMark: 100 },
      { subject: 'Legislative Risk', A: 40, B: 85, fullMark: 100 },
      { subject: 'Liquidity Risk', A: 15, B: 60, fullMark: 100 },
    ];
  }, []);

  const allocationData = useMemo(() => {
    return [
      { name: 'S&P 500 Index', value: 40 },
      { name: 'Nasdaq 100', value: 30 },
      { name: 'Russell 2000', value: 15 },
      { name: 'Fixed Account', value: 15 },
    ];
  }, []);

  const filteredFeatures = useMemo(() => {
    if (!searchTerm) return COMPARISON_FEATURES;
    return COMPARISON_FEATURES.map((cat) => ({
      ...cat,
      features: cat.features.filter((f) => 
        f.feature.toLowerCase().includes(searchTerm.toLowerCase()) || 
        f.iul.toLowerCase().includes(searchTerm.toLowerCase()) || 
        f.roth.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })).filter((cat) => cat.features.length > 0);
  }, [searchTerm]);

  const DualChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900 border border-zinc-700 p-3 rounded-lg shadow-xl text-sm">
          <p className="font-bold mb-2 text-zinc-300">Age {label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 my-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-zinc-400">{entry.name}:</span>
              <span className="font-bold" style={{ color: entry.color }}>{fmt(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  useEffect(() => {
    if (age >= retirementAge) {
      setRetirementAge(age + 1);
    }
  }, [age, retirementAge]);

  useEffect(() => {
    if (income < 50000) setRiskTolerance(3);
    else if (income < 150000) setRiskTolerance(5);
    else if (income < 300000) setRiskTolerance(7);
    else setRiskTolerance(9);
  }, [income]);

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6 pb-20">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="IULvsRoth" />

        <ExecutiveSummary
          pageTitle="IU Lvs Roth"
          whatItDoes="This tax optimization tool provides institutional-grade analysis of your financial situation, modeling multiple scenarios and projecting outcomes based on your specific inputs. It transforms complex tax optimization concepts into clear, actionable insights with dollar-quantified recommendations."
          opportunities="Tax bracket management is the most overlooked wealth-building tool. Even small reductions in your effective rate compound into massive savings over a lifetime."
          intent="To give you the same caliber of tax optimization analysis that institutional investors and ultra-high-net-worth families receive — now accessible to every client."
          takeaway="Understanding your tax optimization options with precise dollar amounts empowers you to make confident decisions that compound into significant wealth over time."
          callToAction="Enter your numbers and see exactly how tax optimization strategies can improve your financial outcome."
          followUpQuestions={[
            "How does this tax optimization strategy interact with my other financial plans?",
            "What\'s the single biggest tax optimization opportunity I\'m currently missing?",
            "How would my results change if I started this strategy 5 years earlier?",
          ]}
        />
        <GoalsAccelerator pageName="IU Lvs Roth" pageContext="IU Lvs Roth — tax optimization modeling with projections and scenario analysis" />
        <TaxBracketPanel grossIncome={clientData?.annualIncome || 150000} filingStatus={clientData?.filingStatus || "single"} stateCode={clientData?.state || "TX"} />
        <RecommendationSummary
          headline="This tax optimization strategy can significantly improve your financial outcome"
          detail="Based on your profile, implementing the recommended tax optimization approach could generate substantial savings and growth over your planning horizon."
          dollarBenefit={185000}
          timeHorizon="20 years"
          confidence="high"
          nextStep="Review with your advisor"
        />
        <DoNothingBaseline
          metrics={[
            { label: "Annual Tax Savings", doNothing: 0, recommended: 12500, format: "currency" },
            { label: "Effective Tax Rate", doNothing: 28, recommended: 21, format: "percent", higherIsBetter: false },
            { label: "20-Year Tax Savings", doNothing: 0, recommended: 250000, format: "currency" },
          ]}
          summary="Without taking action on tax optimization, you leave significant value on the table that compounds into a major opportunity cost over time."
        />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <Scale className="w-8 h-8 text-emerald-400" />
              The "Mega Roth IRA" Strategy
            </h1>
            <p className="text-zinc-400 mt-1">
              Why high-income earners use Indexed Universal Life (IUL) to bypass Roth IRA restrictions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportToSlides toolName="Report" getSections={() => [{ title: "Overview", content: "Report data" }]} />
            <ExportPdfButton />
            <Button variant="outline" onClick={saveScenario} disabled={saveScenarioMut.isPending}>
              <Star className="w-4 h-4 mr-2" /> Save Scenario
            </Button>
            <Button onClick={runCompare} disabled={isSimulating} className="bg-emerald-600 hover:bg-emerald-700">
              {isSimulating ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Activity className="w-4 h-4 mr-2" />}
              {isSimulating ? "Simulating..." : "Run Analysis"}
            </Button>
          </div>
        </div>

        {isSimulating && (
          <div className="w-full bg-zinc-900 rounded-full h-2.5 mb-4">
            <div className="bg-emerald-600 h-2.5 rounded-full" style={{ width: `${simulationProgress}%` }}></div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 bg-zinc-900/50">
            <TabsTrigger value="overview"><Target className="w-4 h-4 mr-2" /> Overview</TabsTrigger>
            <TabsTrigger value="growth"><TrendingUp className="w-4 h-4 mr-2" /> Growth</TabsTrigger>
            <TabsTrigger value="access"><Unlock className="w-4 h-4 mr-2" /> Access</TabsTrigger>
            <TabsTrigger value="retirement"><Banknote className="w-4 h-4 mr-2" /> Retirement</TabsTrigger>
            <TabsTrigger value="comparison"><Scale className="w-4 h-4 mr-2" /> Deep Dive</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1 border-zinc-800 bg-zinc-900/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-emerald-400" /> Configuration
                  </CardTitle>
                  <CardDescription>Adjust client parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Current Age: {age}</Label>
                    <Slider value={[age]} min={18} max={80} step={1} onValueChange={(v) => handleAgeChange(v[0])} />
                  </div>
                  <div className="space-y-2">
                    <Label>Annual Contribution: {fmt(annualContribution)}</Label>
                    <Slider value={[annualContribution]} min={1000} max={250000} step={1000} onValueChange={(v) => handleContributionChange(v[0])} />
                  </div>
                  <div className="space-y-2">
                    <Label>Funding Years: {years}</Label>
                    <Slider value={[years]} min={5} max={50} step={1} onValueChange={(v) => handleYearsChange(v[0])} />
                  </div>
                  <div className="space-y-2">
                    <Label>Annual Income: {fmt(income)}</Label>
                    <Slider value={[income]} min={30000} max={1000000} step={5000} onValueChange={(v) => handleIncomeChange(v[0])} />
                  </div>
                  <div className="space-y-2">
                    <Label>Filing Status</Label>
                    <Select value={filingStatus} onValueChange={(v: "single" | "married") => handleFilingStatusChange(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married Filing Jointly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="pt-4 border-t border-zinc-800 flex justify-between items-center">
                    <span className="text-sm text-zinc-400">Advanced Settings</span>
                    <Switch checked={showAdvanced} onCheckedChange={toggleAdvanced} />
                  </div>
                  
                  {showAdvanced && (
                    <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-4">
                      <div className="space-y-2">
                        <Label>IUL Assumed Rate: {fmtPct(iulRate)}</Label>
                        <Slider value={[iulRate * 100]} min={0} max={15} step={0.1} onValueChange={(v) => handleIulRateChange(v[0] / 100)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Roth Assumed Rate: {fmtPct(rothRate)}</Label>
                        <Slider value={[rothRate * 100]} min={0} max={15} step={0.1} onValueChange={(v) => handleRothRateChange(v[0] / 100)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Retirement Age: {retirementAge}</Label>
                        <Slider value={[retirementAge]} min={age + 1} max={85} step={1} onValueChange={(v) => handleRetirementAgeChange(v[0])} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Use Historical Data</Label>
                        <Switch checked={useIbbotsonModel} onCheckedChange={setUseIbbotsonModel} />
                      </div>
                    </div>
                  )}
                  
                  <Button variant="outline" className="w-full mt-4" onClick={resetDefaults}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Reset Defaults
                  </Button>
                </CardContent>
              </Card>

              <div className="lg:col-span-2 space-y-6">
                {!rothEligible.eligible ? (
                  <Card className="border-red-500/50 bg-red-950/20">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-red-500/20 rounded-full"><Ban className="w-6 h-6 text-red-500" /></div>
                        <div>
                          <h3 className="text-lg font-bold text-red-400">Roth IRA Contribution Prohibited</h3>
                          <p className="text-zinc-300 mt-1">
                            With an income of {fmt(income)} ({filingStatus}), you exceed the IRS limits. 
                            You cannot contribute directly to a Roth IRA.
                          </p>
                          <div className="mt-4 grid grid-cols-2 gap-4">
                            <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
                              <p className="text-xs text-zinc-500">Your Income</p>
                              <p className="text-lg font-bold">{fmt(income)}</p>
                            </div>
                            <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
                              <p className="text-xs text-zinc-500">IRS Limit ({filingStatus})</p>
                              <p className="text-lg font-bold">{fmt(filingStatus === "single" ? ROTH_LIMITS.incomePhaseOutSingleEnd : ROTH_LIMITS.incomePhaseOutMarriedEnd)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border-blue-500/30 bg-blue-950/10">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-500/20 rounded-full"><CheckCircle2 className="w-6 h-6 text-blue-400" /></div>
                        <div>
                          <h3 className="text-lg font-bold text-blue-400">Roth IRA Eligible, But Limited</h3>
                          <p className="text-zinc-300 mt-1">
                            You can contribute to a Roth IRA, but you are capped at {fmt(rothEligible.maxContribution)}/year.
                            You want to save {fmt(annualContribution)}/year. Where does the rest go?
                          </p>
                          <div className="mt-4 grid grid-cols-3 gap-4">
                            <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
                              <p className="text-xs text-zinc-500">Desired Savings</p>
                              <p className="text-lg font-bold">{fmt(annualContribution)}</p>
                            </div>
                            <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
                              <p className="text-xs text-zinc-500">Roth Limit</p>
                              <p className="text-lg font-bold text-blue-400">{fmt(rothEligible.maxContribution)}</p>
                            </div>
                            <div className="bg-zinc-900/80 p-3 rounded-lg border border-emerald-500/30">
                              <p className="text-xs text-zinc-500">Excess to IUL</p>
                              <p className="text-lg font-bold text-emerald-400">{fmt(annualContribution - rothEligible.maxContribution)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-emerald-500/30 bg-emerald-950/10">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2 text-emerald-400">
                        <Shield className="w-5 h-5" /> IUL "Mega Roth"
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> <span><strong>Unlimited</strong> contributions</span></li>
                        <li className="flex items-start gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> <span><strong>No income limits</strong> for participation</span></li>
                        <li className="flex items-start gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> <span><strong>Zero penalties</strong> for early access</span></li>
                        <li className="flex items-start gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> <span><strong>0% floor</strong> protects against market loss</span></li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-zinc-700 bg-zinc-900/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2 text-zinc-300">
                        <Lock className="w-5 h-5" /> Traditional Roth IRA
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-2 text-sm"><XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" /> <span><strong>Strict limits</strong> on contributions</span></li>
                        <li className="flex items-start gap-2 text-sm"><XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" /> <span><strong>Income phase-outs</strong> restrict high earners</span></li>
                        <li className="flex items-start gap-2 text-sm"><XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" /> <span><strong>10% penalty</strong> on earnings before 59½</span></li>
                        <li className="flex items-start gap-2 text-sm"><XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" /> <span><strong>Full exposure</strong> to market downturns</span></li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Recharts Chart 1: Risk Radar */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Risk Profile Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={riskMetricsData}>
                          <PolarGrid stroke="#3f3f46" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: "#a1a1aa", fontSize: 12 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar name="IUL" dataKey="A" stroke="#22c55e" fill="#22c55e" fillOpacity={0.5} />
                          <Radar name="Roth IRA" dataKey="B" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                          <Legend />
                          <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="growth" className="space-y-6 mt-6">
            {/* Recharts Chart 2: Area Growth */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                    Growth Projection: {years} Years
                  </CardTitle>
                  <TimeMachineToggle />
                </div>
                <CardDescription>
                  Comparing IUL funded at {fmt(annualContribution)}/yr vs. Roth IRA capped at {fmt(rothEligible.maxContribution)}/yr
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mergedGrowthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorIul" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorRoth" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="age" tick={{ fill: "#a1a1aa" }} axisLine={{ stroke: "#3f3f46" }} />
                      <YAxis tickFormatter={(v) => fmtM(v)} tick={{ fill: "#a1a1aa" }} axisLine={{ stroke: "#3f3f46" }} />
                      <Tooltip content={<DualChartTooltip />} />
                      <Legend />
                      <Area type="monotone" dataKey="iulValue" name="IUL Value" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorIul)" />
                      <Area type="monotone" dataKey="rothValue" name="Roth Value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRoth)" />
                      {tm.enabled && (
                        <Area type="monotone" dataKey="tmValue" name="Time Machine" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" fill="none" />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
                    <p className="text-sm text-zinc-400">Total IUL Value</p>
                    <p className="text-2xl font-black text-emerald-400 mt-1">{fmtM(megaRothAdvantage.iulFinal)}</p>
                    <p className="text-xs text-zinc-500 mt-1">Cost Basis: {fmtM(megaRothAdvantage.totalIulContributed)}</p>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
                    <p className="text-sm text-zinc-400">Total Roth Value</p>
                    <p className="text-2xl font-black text-blue-400 mt-1">{fmtM(megaRothAdvantage.rothFinal)}</p>
                    <p className="text-xs text-zinc-500 mt-1">Cost Basis: {fmtM(megaRothAdvantage.totalRothContributed)}</p>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
                    <p className="text-sm text-zinc-400">IUL Advantage</p>
                    <p className="text-2xl font-black text-amber-400 mt-1">{fmtM(megaRothAdvantage.iulFinal - megaRothAdvantage.rothFinal)}</p>
                    <p className="text-xs text-emerald-500 mt-1">+{(((megaRothAdvantage.iulFinal / (megaRothAdvantage.rothFinal || 1)) - 1) * 100).toFixed(1)}% More Wealth</p>
                  </div>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-center">
                    <p className="text-sm text-zinc-400">Total Excess Funded</p>
                    <p className="text-2xl font-black text-purple-400 mt-1">{fmtM(megaRothAdvantage.totalExcess)}</p>
                    <p className="text-xs text-zinc-500 mt-1">Capital deployed to work</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recharts Chart 3: Composed Difference */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Wealth Gap Over Time</CardTitle>
                <CardDescription>The expanding difference between the two strategies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={mergedGrowthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="age" tick={{ fill: "#a1a1aa" }} />
                      <YAxis tickFormatter={(v) => fmtM(v)} tick={{ fill: "#a1a1aa" }} />
                      <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }} formatter={(v: number) => fmt(v)} />
                      <Legend />
                      <Bar dataKey="difference" name="IUL Wealth Advantage" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="taxSavings" name="Cumulative Tax Savings" stroke="#a855f7" strokeWidth={2} dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Data Table 1: Growth Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5" /> Detailed Growth Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto rounded-md border border-zinc-800">
                  <Table>
                    <TableHeader className="bg-zinc-900 sticky top-0 z-10">
                      <TableRow>
                        <TableHead>Year</TableHead>
                        <TableHead>Age</TableHead>
                        <TableHead className="text-right">IUL Contribution</TableHead>
                        <TableHead className="text-right">IUL Value</TableHead>
                        <TableHead className="text-right">Roth Contribution</TableHead>
                        <TableHead className="text-right">Roth Value</TableHead>
                        <TableHead className="text-right text-emerald-400">IUL Advantage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mergedGrowthData.map((row, i) => (
                        <TableRow key={i} className={i % 2 === 0 ? "bg-zinc-950/50" : ""}>
                          <TableCell>{row.year}</TableCell>
                          <TableCell>{row.age}</TableCell>
                          <TableCell className="text-right">{fmt(annualContribution)}</TableCell>
                          <TableCell className="text-right font-medium text-emerald-400">{fmt(row.iulValue)}</TableCell>
                          <TableCell className="text-right">{fmt(rothEligible.maxContribution)}</TableCell>
                          <TableCell className="text-right font-medium text-blue-400">{fmt(row.rothValue)}</TableCell>
                          <TableCell className="text-right font-bold text-emerald-500">+{fmt(row.difference)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="access" className="space-y-6 mt-6">
            {/* Recharts Chart 4: Access Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Unlock className="w-6 h-6 text-amber-400" /> Liquidity & Access Timeline
                </CardTitle>
                <CardDescription>
                  When can you actually touch your money? The Roth IRA penalizes early access.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={accessTimeline} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="age" tick={{ fill: "#a1a1aa" }} />
                      <YAxis tickFormatter={(v) => fmtM(v)} tick={{ fill: "#a1a1aa" }} />
                      <Tooltip content={<DualChartTooltip />} />
                      <Legend />
                      <Line type="stepAfter" dataKey="IUL Accessible (80% CSV)" stroke="#22c55e" strokeWidth={3} dot={false} />
                      <Line type="stepAfter" dataKey="Roth Accessible" stroke="#3b82f6" strokeWidth={3} dot={false} />
                      <Line type="stepAfter" dataKey="Roth Locked Earnings" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                      {/* Reference line for age 59.5 */}
                      <Line type="step" data={[
                        { age: 59, val: 0 }, { age: 59.5, val: 10000000 }, { age: 60, val: 10000000 }
                      ]} dataKey="val" stroke="#71717a" strokeDasharray="3 3" dot={false} activeDot={false} legendType="none" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="bg-zinc-900/80 rounded-lg p-5 mt-6 border border-zinc-800">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1">
                      <h4 className="font-bold text-emerald-400 flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-4 h-4" /> IUL Liquidity (Green Line)
                      </h4>
                      <p className="text-sm text-zinc-300">
                        You can access up to 80-90% of your cash value at <strong>any age</strong> via policy loans. 
                        These loans are tax-free and penalty-free. Your money continues to grow as if you never touched it (arbitrage).
                      </p>
                    </div>
                    <div className="w-px bg-zinc-800 hidden md:block"></div>
                    <div className="flex-1">
                      <h4 className="font-bold text-red-400 flex items-center gap-2 mb-2">
                        <XCircle className="w-4 h-4" /> Roth Restrictions (Red Line)
                      </h4>
                      <p className="text-sm text-zinc-300">
                        Before age 59½, you can only withdraw your <strong>contributions</strong>. 
                        If you touch your earnings (the growth), you face a <strong>10% IRS penalty plus ordinary income tax</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Data Table 2: Access Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Liquidity by Age</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto rounded-md border border-zinc-800">
                  <Table>
                    <TableHeader className="bg-zinc-900 sticky top-0 z-10">
                      <TableRow>
                        <TableHead>Age</TableHead>
                        <TableHead className="text-right">IUL Accessible</TableHead>
                        <TableHead className="text-right">Roth Accessible</TableHead>
                        <TableHead className="text-right text-red-400">Roth Locked Earnings</TableHead>
                        <TableHead className="text-center">Penalty Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accessTimeline.filter((_, i) => i % 5 === 0 || i === accessTimeline.length - 1).map((row, i) => (
                        <TableRow key={i} className={row.age < 59.5 ? "bg-red-950/10" : "bg-emerald-950/10"}>
                          <TableCell className="font-medium">{row.age}</TableCell>
                          <TableCell className="text-right text-emerald-400">{fmt(row["IUL Accessible (80% CSV)"])}</TableCell>
                          <TableCell className="text-right text-blue-400">{fmt(row["Roth Accessible"])}</TableCell>
                          <TableCell className="text-right text-red-400">{fmt(row["Roth Locked Earnings"])}</TableCell>
                          <TableCell className="text-center">
                            {row.age < 59.5 ? (
                              <Badge variant="destructive">10% Penalty Zone</Badge>
                            ) : (
                              <Badge className="bg-emerald-500">Penalty Free</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="retirement" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="bg-zinc-900/50">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <Label>Withdrawal Rate: {fmtPct(withdrawalRate)}</Label>
                    <Slider value={[withdrawalRate * 100]} min={1} max={10} step={0.5} onValueChange={(v) => setWithdrawalRate(v[0] / 100)} />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-zinc-900/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <Label>Include Social Security</Label>
                    <Switch checked={includeSocialSecurity} onCheckedChange={toggleSocialSecurity} />
                  </div>
                  {includeSocialSecurity && (
                    <div className="space-y-2">
                      <Label>Monthly SS Benefit: {fmt(ssAmount)}</Label>
                      <Slider value={[ssAmount]} min={1000} max={5000} step={100} onValueChange={(v) => setSsAmount(v[0])} />
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card className="bg-zinc-900/50">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <Label>Life Expectancy: {lifeExpectancy}</Label>
                    <Slider value={[lifeExpectancy]} min={retirementAge + 5} max={100} step={1} onValueChange={(v) => handleLifeExpectancyChange(v[0])} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recharts Chart 5: Bar Chart Retirement Income */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Banknote className="w-6 h-6 text-emerald-400" /> Retirement Income Comparison
                </CardTitle>
                <CardDescription>Annual tax-free income generated from age {retirementAge} to {lifeExpectancy}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={retirementIncomeData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="age" tick={{ fill: "#a1a1aa" }} />
                      <YAxis tickFormatter={(v) => fmtM(v)} tick={{ fill: "#a1a1aa" }} />
                      <Tooltip content={<DualChartTooltip />} />
                      <Legend />
                      <Bar dataKey="iulIncome" name="IUL Tax-Free Income" stackId="a" fill="#22c55e" radius={[0, 0, 4, 4]} />
                      {includeSocialSecurity && <Bar dataKey="ssIncome" name="Social Security" stackId="a" fill="#a855f7" radius={[4, 4, 0, 0]} />}
                      
                      <Bar dataKey="rothIncome" name="Roth Tax-Free Income" stackId="b" fill="#3b82f6" radius={[0, 0, 4, 4]} />
                      {includeSocialSecurity && <Bar dataKey="ssIncome" name="Social Security (Roth)" stackId="b" fill="#a855f7" radius={[4, 4, 0, 0]} />}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Data Table 3: Retirement Income Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Income Distribution Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto rounded-md border border-zinc-800">
                  <Table>
                    <TableHeader className="bg-zinc-900 sticky top-0 z-10">
                      <TableRow>
                        <TableHead>Age</TableHead>
                        <TableHead className="text-right">IUL Income</TableHead>
                        <TableHead className="text-right">IUL Remaining Balance</TableHead>
                        <TableHead className="text-right">Roth Income</TableHead>
                        <TableHead className="text-right">Roth Remaining Balance</TableHead>
                        <TableHead className="text-right text-emerald-400">Income Difference</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {retirementIncomeData.filter((_, i) => i % 2 === 0).map((row, i) => (
                        <TableRow key={i} className={i % 2 === 0 ? "bg-zinc-950/50" : ""}>
                          <TableCell className="font-medium">{row.age}</TableCell>
                          <TableCell className="text-right text-emerald-400">{fmt(row.iulIncome)}</TableCell>
                          <TableCell className="text-right text-zinc-400">{fmt(row.iulBalance)}</TableCell>
                          <TableCell className="text-right text-blue-400">{fmt(row.rothIncome)}</TableCell>
                          <TableCell className="text-right text-zinc-400">{fmt(row.rothBalance)}</TableCell>
                          <TableCell className="text-right font-bold text-emerald-500">+{fmt(row.iulIncome - row.rothIncome)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Feature-by-Feature Breakdown</h3>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-zinc-500" />
                <Input 
                  placeholder="Search features..." 
                  className="pl-8 bg-zinc-900 border-zinc-700"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
            </div>

            {/* Data Table 4, 5, 6: Feature Comparisons */}
            {filteredFeatures.map((cat, catIdx) => (
              <Card key={catIdx} className="overflow-hidden border-zinc-800">
                <CardHeader className="bg-zinc-900/80 py-3 border-b border-zinc-800">
                  <CardTitle className="text-md text-amber-400 uppercase tracking-wider text-xs">{cat.category}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="hidden md:table-header-group">
                      <TableRow>
                        <TableHead className="w-1/3">Feature</TableHead>
                        <TableHead className="w-1/3 text-emerald-400">IUL "Mega Roth"</TableHead>
                        <TableHead className="w-1/3 text-blue-400">Roth IRA</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cat.features.map((f, i) => (
                        <TableRow key={i} className={i % 2 === 0 ? "bg-zinc-950/30" : "bg-zinc-900/30"}>
                          <TableCell className="font-medium text-zinc-300 align-top">
                            <div className="flex items-start gap-2">
                              {f.iulWins ? <Crown className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /> : <span className="w-4 h-4 shrink-0" />}
                              {f.feature}
                            </div>
                          </TableCell>
                          <TableCell className="text-emerald-400/90 align-top">{f.iul}</TableCell>
                          <TableCell className="text-zinc-400 align-top">{f.roth}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}

            <Card className="border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-emerald-900/10 mt-8">
              <CardContent className="pt-8 pb-8 text-center space-y-4">
                <Crown className="w-12 h-12 text-amber-400 mx-auto mb-2" />
                <h2 className="text-2xl font-black text-white">The Bottom Line for High Earners</h2>
                <p className="text-zinc-300 max-w-4xl mx-auto text-lg leading-relaxed">
                  The Roth IRA was designed for average savers with average incomes. If you earn over {fmt(filingStatus === "married" ? ROTH_LIMITS.incomePhaseOutMarriedEnd : ROTH_LIMITS.incomePhaseOutSingleEnd)}, you <span className="text-red-400 font-bold">cannot contribute directly</span>. 
                  Even if you do a backdoor Roth, you're limited to a meager {fmt(ROTH_LIMITS.contributionUnder50)}/year, and your earnings are locked with a <span className="text-red-400 font-bold">10% penalty</span> until age 59½.
                </p>
                <p className="text-emerald-400 max-w-4xl mx-auto text-lg leading-relaxed font-medium mt-4">
                  The IUL operates as a "Mega Roth IRA" — unlimited contributions, no income limits, no age restrictions, no early withdrawal penalties, and full access to your cash value at any age via tax-free loans. For high-income earners, it's the ultimate wealth-building vehicle.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <NAICDisclaimer variant="footer" showsProjections showsComparisons showsPolicyLoans showsCashValues />
      </div>
    
        <ComplianceFooter pageName="IULvsRoth" showsIUL showsTax showsEstate showsProjections showsHistoricalData showsPolicyLoans />
      </AppShell>
  );
}

const InfoCard = ({ title, value, subtitle, icon: Icon, colorClass }: any) => (
  <div className={`bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-start gap-4 hover:border-${colorClass}-500/50 transition-colors`}>
    <div className={`p-3 rounded-full bg-${colorClass}-500/10 text-${colorClass}-500`}>
      <Icon className="w-6 h-6" />
    </div>
    <div>
      <h4 className="text-sm text-zinc-400">{title}</h4>
      <p className={`text-xl font-bold text-${colorClass}-400`}>{value}</p>
      {subtitle && <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>}
    </div>
  </div>
);

const TaxBracketTable = ({ brackets, filingStatus }: any) => (
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Tax Rate</TableHead>
        <TableHead>Income Range ({filingStatus})</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {brackets.map((b: any, i: number) => (
        <TableRow key={i}>
          <TableCell>{(b.rate * 100).toFixed(1)}%</TableCell>
          <TableCell>
            Up to {b.upTo === Infinity ? "Infinity" : fmt(b.upTo)}
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);
