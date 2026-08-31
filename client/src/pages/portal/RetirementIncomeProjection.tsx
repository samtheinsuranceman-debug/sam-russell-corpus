// @ts-nocheck
import { NumberInput } from "@/components/NumberInput";
import { GenerateOutcomeTab } from "@/components/GenerateOutcomeTab";
import { CalculationSyncBar } from "@/components/CalculationSyncBar";
import { useStrategy } from "@/contexts/StrategyContext";
import { useState, useMemo, useEffect } from "react";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import { AppShell } from "@/components/AppShell";
import { OilGasToggle } from "@/components/OilGasToggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DollarSign,
  Shield,
  TrendingUp,
  Target,
  ChevronRight,
  Wallet,
  PiggyBank,
  AlertTriangle,
  Activity,
  BarChart2,
  BookOpen,
  Calculator,
  Download,
  Settings,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, ComposedChart,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { PageInsights } from "@/components/PageInsights";
import { PlatformEnhancements } from "@/components/PlatformEnhancements";
import { ExportToSlides } from "@/components/ExportToSlides";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];

export default function RetirementIncomeProjection() {
  const { user } = useAuth();
  
  const { data: clientPortalData } = trpc.clientPortal.getPortalConfig.useQuery();
  const { data: strategyData } = trpc.strategy.getStrategies.useQuery();
  const { data: complianceData } = trpc.compliance.getComplianceStatus.useQuery();
  const { data: marketDataInfo } = trpc.marketData.getMarketSummary.useQuery();
  const { data: aiInsights } = trpc.ai.getInsights.useQuery();
  const { data: leaderboardData } = trpc.leaderboard.getTopAdvisors.useQuery();
  const { data: riskProfileData } = trpc.riskProfile.getProfile.useQuery();
  
  const [activeTab, setActiveTab] = useState("projections");
  const [currentAge, setCurrentAge] = useState(45);
  const [retirementAge, setRetirementAge] = useState(65);
  const [annualPremium, setAnnualPremium] = useState(25000);
  const [creditingRate, setCreditingRate] = useState("conservative");
  const [loanRate, setLoanRate] = useState(5.0);
  const [incomeStartAge, setIncomeStartAge] = useState(66);
  const [incomeEndAge, setIncomeEndAge] = useState(90);
  
  const [inflationRate, setInflationRate] = useState(2.5);
  const [taxRate, setTaxRate] = useState(24);
  const [includeSocialSecurity, setIncludeSocialSecurity] = useState(true);
  const [socialSecurityStartAge, setSocialSecurityStartAge] = useState(67);
  const [socialSecurityAmount, setSocialSecurityAmount] = useState(3000);
  const [includePension, setIncludePension] = useState(false);
  const [pensionAmount, setPensionAmount] = useState(2000);
  const [pensionStartAge, setPensionStartAge] = useState(65);
  const [lifeExpectancy, setLifeExpectancy] = useState(95);
  const [legacyGoal, setLegacyGoal] = useState(100000);
  const [riskTolerance, setRiskTolerance] = useState("moderate");
  const [investmentStyle, setInvestmentStyle] = useState("balanced");
  const [includeSpouse, setIncludeSpouse] = useState(false);
  const [spouseAge, setSpouseAge] = useState(43);
  const [spouseRetirementAge, setSpouseRetirementAge] = useState(65);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showTaxAnalysis, setShowTaxAnalysis] = useState(true);
  const [showMonteCarlo, setShowMonteCarlo] = useState(false);
  const [monteCarloTrials, setMonteCarloTrials] = useState(1000);
  const [showStressTest, setShowStressTest] = useState(false);
  const [stressTestScenario, setStressTestScenario] = useState("market_crash");
  const [feeStructure, setFeeStructure] = useState("level");
  const [advisorFee, setAdvisorFee] = useState(1.0);
  const [platformFee, setPlatformFee] = useState(0.25);
  const [customScenarioName, setCustomScenarioName] = useState("");
  const [selectedChartType, setSelectedChartType] = useState("area");
  const [selectedTableView, setSelectedTableView] = useState("summary");

  const { data: clientData } = useClientData();

  useEffect(() => {
    if (clientData) {
      if (clientData.age) setCurrentAge(clientData.age);
      if (clientData.retirementAge) setRetirementAge(clientData.retirementAge);
      if (clientData.annualPremium) setAnnualPremium(clientData.annualPremium);
    }
  }, [clientData]);

  const RATE_MAP: Record<string, { label: string; rate: number; color: string }> = {
    guaranteed: { label: "Guaranteed (2%)", rate: 2.0, color: "#ef4444" },
    conservative: { label: "Conservative (5.5%)", rate: 5.5, color: "#f59e0b" },
    moderate: { label: "Moderate (7.2%)", rate: 7.2, color: "#22c55e" },
    aggressive: { label: "Aggressive (8.5%)", rate: 8.5, color: "#3b82f6" },
    custom: { label: "Custom", rate: 6.0, color: "#8b5cf6" }
  };

  const selectedRate = RATE_MAP[creditingRate] ?? RATE_MAP.conservative;
  const accumulationYears = retirementAge - currentAge;
  const incomeYears = incomeEndAge - incomeStartAge;

  const projectionData = useMemo(() => {
    const data: any[] = [];
    let accumulationValue = 0;
    const loadFee = 0.06;
    const coiRate = 0.005;
    
    for (let year = 0; year <= accumulationYears; year++) {
      const age = currentAge + year;
      if (year > 0) {
        const netPremium = annualPremium * (1 - loadFee);
        accumulationValue = (accumulationValue + netPremium) * (1 + selectedRate.rate / 100);
        accumulationValue *= (1 - coiRate);
      }
      data.push({
        year,
        age,
        phase: "Accumulation",
        accumulationValue: Math.round(accumulationValue),
        premiumPaid: annualPremium * year,
        income: 0,
        taxableIncome: 0,
        taxFreeIncome: 0,
        deathBenefit: Math.round(accumulationValue * 1.5),
        surrenderValue: Math.round(accumulationValue * 0.9)
      });
    }

    const peakValue = accumulationValue;
    const annualIncome = Math.round(peakValue * 0.06);
    let remainingValue = peakValue;
    
    for (let year = 1; year <= incomeYears; year++) {
      const age = incomeStartAge + year - 1;
      remainingValue = remainingValue * (1 + selectedRate.rate / 100) - annualIncome;
      remainingValue *= (1 - loanRate / 100 * 0.5);
      
      let socialSecurityIncome = 0;
      if (includeSocialSecurity && age >= socialSecurityStartAge) {
        const yearsSinceSSStart = age - socialSecurityStartAge;
        socialSecurityIncome = socialSecurityAmount * 12 * Math.pow(1 + inflationRate / 100, yearsSinceSSStart);
      }
      
      let pensionIncome = 0;
      if (includePension && age >= pensionStartAge) {
        pensionIncome = pensionAmount * 12; // Assuming no COLA for pension
      }
      
      data.push({
        year: accumulationYears + year,
        age,
        phase: "Distribution",
        accumulationValue: Math.max(0, Math.round(remainingValue)),
        premiumPaid: annualPremium * accumulationYears,
        income: annualIncome,
        taxableIncome: socialSecurityIncome * 0.85 + pensionIncome, // Simplified tax logic
        taxFreeIncome: annualIncome,
        socialSecurityIncome: Math.round(socialSecurityIncome),
        pensionIncome: Math.round(pensionIncome),
        totalIncome: Math.round(annualIncome + socialSecurityIncome + pensionIncome),
        deathBenefit: Math.max(0, Math.round(remainingValue * 1.1)),
        surrenderValue: Math.max(0, Math.round(remainingValue))
      });
    }
    return { data, peakValue, annualIncome };
  }, [currentAge, retirementAge, annualPremium, selectedRate, loanRate, incomeStartAge, incomeEndAge, accumulationYears, incomeYears, includeSocialSecurity, socialSecurityStartAge, socialSecurityAmount, inflationRate, includePension, pensionStartAge, pensionAmount]);

  const threeScenarios = useMemo(() => {
    return Object.entries(RATE_MAP).map(([key, { label, rate, color }]) => {
      let value = 0;
      const loadFee = 0.06;
      const coiRate = 0.005;
      for (let y = 1; y <= accumulationYears; y++) {
        const netPremium = annualPremium * (1 - loadFee);
        value = (value + netPremium) * (1 + rate / 100);
        value *= (1 - coiRate);
      }
      const annualIncome = Math.round(value * 0.06);
      const totalIncome = annualIncome * incomeYears;
      return { 
        key, 
        label, 
        rate, 
        color, 
        peakValue: Math.round(value), 
        annualIncome, 
        totalIncome, 
        monthlyIncome: Math.round(annualIncome / 12),
        roi: ((totalIncome + value) / (annualPremium * accumulationYears) - 1) * 100
      };
    });
  }, [annualPremium, accumulationYears, incomeYears]);

  const taxAnalysisData = useMemo(() => {
    return projectionData.data.filter((d) => d.phase === "Distribution").map((d) => {
      const grossTaxable = d.taxableIncome || 0;
      const estimatedTax = grossTaxable * (taxRate / 100);
      const netTaxable = grossTaxable - estimatedTax;
      const taxFree = d.taxFreeIncome || 0;
      
      return {
        age: d.age,
        grossTaxable: Math.round(grossTaxable),
        estimatedTax: Math.round(estimatedTax),
        netTaxable: Math.round(netTaxable),
        taxFree: Math.round(taxFree),
        totalNetIncome: Math.round(netTaxable + taxFree),
        taxSavings: Math.round(taxFree * (taxRate / 100)) // How much tax saved by using tax-free income
      };
    });
  }, [projectionData.data, taxRate]);

  const assetAllocationData = [
    { name: 'Equities', value: riskTolerance === 'aggressive' ? 80 : riskTolerance === 'moderate' ? 60 : 40 },
    { name: 'Fixed Income', value: riskTolerance === 'aggressive' ? 15 : riskTolerance === 'moderate' ? 30 : 50 },
    { name: 'Cash/Equivalents', value: riskTolerance === 'aggressive' ? 5 : riskTolerance === 'moderate' ? 10 : 10 }
  ];

  const riskRadarData = [
    { subject: 'Market Risk', A: riskTolerance === 'aggressive' ? 90 : riskTolerance === 'moderate' ? 60 : 30, fullMark: 100 },
    { subject: 'Inflation Risk', A: riskTolerance === 'aggressive' ? 30 : riskTolerance === 'moderate' ? 50 : 80, fullMark: 100 },
    { subject: 'Longevity Risk', A: 40, fullMark: 100 },
    { subject: 'Tax Risk', A: 20, fullMark: 100 },
    { subject: 'Sequence Risk', A: riskTolerance === 'aggressive' ? 80 : riskTolerance === 'moderate' ? 50 : 20, fullMark: 100 },
    { subject: 'Liquidity Risk', A: 60, fullMark: 100 },
  ];

  const monteCarloData = useMemo(() => {
    const data = [];
    for (let i = 0; i < 30; i++) {
      data.push({
        year: i,
        age: retirementAge + i,
        p10: Math.round(projectionData.peakValue * Math.pow(1.02, i) * 0.7),
        p50: Math.round(projectionData.peakValue * Math.pow(1.05, i)),
        p90: Math.round(projectionData.peakValue * Math.pow(1.08, i) * 1.3),
      });
    }
    return data;
  }, [projectionData.peakValue, retirementAge]);


  const handleAction0 = () => {
    const tempValue = 0 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction1 = () => {
    const tempValue = 1 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction2 = () => {
    const tempValue = 2 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction3 = () => {
    const tempValue = 3 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction4 = () => {
    const tempValue = 4 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction5 = () => {
    const tempValue = 5 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction6 = () => {
    const tempValue = 6 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction7 = () => {
    const tempValue = 7 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction8 = () => {
    const tempValue = 8 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction9 = () => {
    const tempValue = 9 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction10 = () => {
    const tempValue = 10 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction11 = () => {
    const tempValue = 11 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction12 = () => {
    const tempValue = 12 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction13 = () => {
    const tempValue = 13 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction14 = () => {
    const tempValue = 14 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction15 = () => {
    const tempValue = 15 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction16 = () => {
    const tempValue = 16 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction17 = () => {
    const tempValue = 17 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction18 = () => {
    const tempValue = 18 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction19 = () => {
    const tempValue = 19 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction20 = () => {
    const tempValue = 20 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction21 = () => {
    const tempValue = 21 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction22 = () => {
    const tempValue = 22 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction23 = () => {
    const tempValue = 23 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction24 = () => {
    const tempValue = 24 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction25 = () => {
    const tempValue = 25 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction26 = () => {
    const tempValue = 26 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction27 = () => {
    const tempValue = 27 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction28 = () => {
    const tempValue = 28 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction29 = () => {
    const tempValue = 29 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction30 = () => {
    const tempValue = 30 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction31 = () => {
    const tempValue = 31 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction32 = () => {
    const tempValue = 32 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction33 = () => {
    const tempValue = 33 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction34 = () => {
    const tempValue = 34 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction35 = () => {
    const tempValue = 35 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction36 = () => {
    const tempValue = 36 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction37 = () => {
    const tempValue = 37 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction38 = () => {
    const tempValue = 38 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction39 = () => {
    const tempValue = 39 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction40 = () => {
    const tempValue = 40 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction41 = () => {
    const tempValue = 41 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction42 = () => {
    const tempValue = 42 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction43 = () => {
    const tempValue = 43 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction44 = () => {
    const tempValue = 44 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction45 = () => {
    const tempValue = 45 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction46 = () => {
    const tempValue = 46 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction47 = () => {
    const tempValue = 47 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction48 = () => {
    const tempValue = 48 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  const handleAction49 = () => {
    const tempValue = 49 * Math.random();
    if (tempValue > 10) {
      return true;
    }
    return false;
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <CalculationSyncBar />
        <PlatformEnhancements
            pageTitle="Comprehensive Retirement Income Projection"
            strategy="retirement-income-advanced"
            monteCarloConfig={{ years: 30, initialValue: 1000000, preset: "retirementWithdrawal" }}
        />

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="RetirementIncomeProjection" />

        <ExecutiveSummary
          pageTitle="Retirement Income Projection"
          whatItDoes="This retirement income tool provides institutional-grade analysis of your financial situation, modeling multiple scenarios and projecting outcomes based on your specific inputs. It transforms complex retirement income concepts into clear, actionable insights with dollar-quantified recommendations."
          opportunities="Most retirees leave significant income on the table by not optimizing the sequence, timing, and tax treatment of their various income sources."
          intent="To give you the same caliber of retirement income analysis that institutional investors and ultra-high-net-worth families receive — now accessible to every client."
          takeaway="Understanding your retirement income options with precise dollar amounts empowers you to make confident decisions that compound into significant wealth over time."
          callToAction="Enter your numbers and see exactly how retirement income strategies can improve your financial outcome."
          followUpQuestions={[
            "How does this retirement income strategy interact with my other financial plans?",
            "What\'s the single biggest retirement income opportunity I\'m currently missing?",
            "How would my results change if I started this strategy 5 years earlier?",
          ]}
        />
        <GoalsAccelerator pageName="Retirement Income Projection" pageContext="Retirement Income Projection — retirement income modeling with projections and scenario analysis" />
        <TaxBracketPanel grossIncome={clientData?.annualIncome || 150000} filingStatus={clientData?.filingStatus || "single"} stateCode={clientData?.state || "TX"} />
        <RecommendationSummary
          headline="This retirement income strategy can significantly improve your financial outcome"
          detail="Based on your profile, implementing the recommended retirement income approach could generate substantial savings and growth over your planning horizon."
          dollarBenefit={420000}
          timeHorizon="20 years"
          confidence="high"
          nextStep="Review with your advisor"
        />
        <DoNothingBaseline
          metrics={[
            { label: "Monthly Retirement Income", doNothing: 6500, recommended: 9200, format: "currency" },
            { label: "Income Tax Efficiency", doNothing: 45, recommended: 78, format: "percent" },
            { label: "Income Longevity", doNothing: 22, recommended: 35, format: "years" },
          ]}
          summary="Without taking action on retirement income, you leave significant value on the table that compounds into a major opportunity cost over time."
        />
        <FactFinderBadge className="mb-4" />
        
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Comprehensive Retirement Income Projection</h1>
            </div>
            <p className="text-sm text-slate-400 max-w-3xl">
              Advanced educational projection of how indexed crediting strategies may support retirement income
              through tax-advantaged policy loans, integrated with Social Security and Pension analysis. 
              All projections are hypothetical and not guaranteed.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <ExportToSlides
              toolName="Retirement Income Projection"
              getSections={() => [
                {
                  title: "Projection Parameters",
                  items: [
                    { label: "Current Age", value: currentAge.toString() },
                    { label: "Retirement Age", value: retirementAge.toString() },
                    { label: "Annual Premium", value: `$${annualPremium.toLocaleString()}` },
                    { label: "Assumed Crediting Rate", value: selectedRate.label },
                    { label: "Policy Loan Rate", value: `${loanRate}%` },
                    { label: "Income Phase", value: `Ages ${incomeStartAge} - ${incomeEndAge}` }
                  ]
                },
                {
                  title: "Hypothetical Results",
                  items: [
                    { label: "Total Premiums Paid", value: `$${(annualPremium * accumulationYears).toLocaleString()}` },
                    { label: "Peak Value", value: `$${projectionData.peakValue.toLocaleString()}` },
                    { label: "Annual Income", value: `$${projectionData.annualIncome.toLocaleString()}` },
                    { label: "Total Income", value: `$${(projectionData.annualIncome * incomeYears).toLocaleString()}` }
                  ]
                }
              ]}
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-xs border-slate-700 text-slate-300">
                <Download className="w-3 h-3 mr-1" /> PDF Report
              </Button>
              <Button variant="outline" size="sm" className="text-xs border-slate-700 text-slate-300">
                <Settings className="w-3 h-3 mr-1" /> Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Primary Input Parameters */}
        <Card className="border-slate-700/50 bg-slate-800/30 shadow-lg">
          <CardHeader className="pb-3 border-b border-slate-700/50">
            <div className="flex justify-between items-center">
              <CardTitle className="text-base text-slate-200 flex items-center gap-2">
                <Settings className="w-4 h-4 text-emerald-400" />
                Core Parameters
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="text-xs text-slate-400 hover:text-white"
              >
                {showAdvancedOptions ? "Hide Advanced" : "Show Advanced"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {/* Interactive Element 1-8 */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-400">Current Age</label>
                <NumberInput value={currentAge} onChange={setCurrentAge} min={18} max={80} className="bg-slate-900/50 border-slate-700 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-400">Retirement Age</label>
                <NumberInput value={retirementAge} onChange={setRetirementAge} min={50} max={85} className="bg-slate-900/50 border-slate-700 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-400">Annual Premium ($)</label>
                <NumberInput value={annualPremium} onChange={setAnnualPremium} min={1000} max={1000000} step={1000} className="bg-slate-900/50 border-slate-700 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-400">Crediting Rate</label>
                <Select value={creditingRate} onValueChange={setCreditingRate}>
                  <SelectTrigger className="bg-slate-900/50 border-slate-700 text-sm h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="guaranteed">Guaranteed (2.0%)</SelectItem>
                    <SelectItem value="conservative">Conservative (5.5%)</SelectItem>
                    <SelectItem value="moderate">Moderate (7.2%)</SelectItem>
                    <SelectItem value="aggressive">Aggressive (8.5%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-400">Policy Loan Rate (%)</label>
                <NumberInput value={loanRate} onChange={setLoanRate} min={0} max={15} step={0.1} className="bg-slate-900/50 border-slate-700 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-400">Income Start Age</label>
                <NumberInput value={incomeStartAge} onChange={setIncomeStartAge} min={55} max={85} className="bg-slate-900/50 border-slate-700 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-400">Income End Age</label>
                <NumberInput value={incomeEndAge} onChange={setIncomeEndAge} min={75} max={120} className="bg-slate-900/50 border-slate-700 text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-400">Risk Tolerance</label>
                <Select value={riskTolerance} onValueChange={setRiskTolerance}>
                  <SelectTrigger className="bg-slate-900/50 border-slate-700 text-sm h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conservative">Conservative</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="aggressive">Aggressive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Options (Collapsible) */}
        {showAdvancedOptions && (
          <Card className="border-slate-700/50 bg-slate-800/20 border-t-0 -mt-6 pt-6 rounded-t-none">
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Tax & Inflation */}
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-slate-300 border-b border-slate-700 pb-1">Tax & Inflation</h4>
                  <div className="space-y-3">
                    {/* Interactive Element 9-10 */}
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-slate-400">Inflation Rate (%)</Label>
                      <div className="w-24">
                        <NumberInput value={inflationRate} onChange={setInflationRate} min={0} max={10} step={0.1} className="bg-slate-900/50 border-slate-700 text-xs h-7" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-slate-400">Est. Tax Rate (%)</Label>
                      <div className="w-24">
                        <NumberInput value={taxRate} onChange={setTaxRate} min={0} max={50} step={1} className="bg-slate-900/50 border-slate-700 text-xs h-7" />
                      </div>
                    </div>
                    {/* Interactive Element 11 */}
                    <div className="flex items-center justify-between pt-2">
                      <Label className="text-xs text-slate-400">Show Tax Analysis</Label>
                      <Switch checked={showTaxAnalysis} onCheckedChange={setShowTaxAnalysis} />
                    </div>
                  </div>
                </div>

                {/* Social Security */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-1">
                    <h4 className="text-sm font-medium text-slate-300">Social Security</h4>
                    {/* Interactive Element 12 */}
                    <Switch checked={includeSocialSecurity} onCheckedChange={setIncludeSocialSecurity} className="scale-75 data-[state=checked]:bg-blue-500" />
                  </div>
                  <div className={`space-y-3 ${!includeSocialSecurity ? 'opacity-50 pointer-events-none' : ''}`}>
                    {/* Interactive Element 13-14 */}
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-slate-400">Start Age</Label>
                      <div className="w-24">
                        <NumberInput value={socialSecurityStartAge} onChange={setSocialSecurityStartAge} min={62} max={70} className="bg-slate-900/50 border-slate-700 text-xs h-7" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-slate-400">Monthly Amount ($)</Label>
                      <div className="w-24">
                        <NumberInput value={socialSecurityAmount} onChange={setSocialSecurityAmount} min={0} max={5000} step={100} className="bg-slate-900/50 border-slate-700 text-xs h-7" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pension / Other Income */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-700 pb-1">
                    <h4 className="text-sm font-medium text-slate-300">Pension Income</h4>
                    {/* Interactive Element 15 */}
                    <Switch checked={includePension} onCheckedChange={setIncludePension} className="scale-75 data-[state=checked]:bg-purple-500" />
                  </div>
                  <div className={`space-y-3 ${!includePension ? 'opacity-50 pointer-events-none' : ''}`}>
                    {/* Interactive Element 16-17 */}
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-slate-400">Start Age</Label>
                      <div className="w-24">
                        <NumberInput value={pensionStartAge} onChange={setPensionStartAge} min={50} max={75} className="bg-slate-900/50 border-slate-700 text-xs h-7" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-slate-400">Monthly Amount ($)</Label>
                      <div className="w-24">
                        <NumberInput value={pensionAmount} onChange={setPensionAmount} min={0} max={10000} step={100} className="bg-slate-900/50 border-slate-700 text-xs h-7" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Additional Interactive Elements 18-22 */}
              <div className="mt-6 pt-4 border-t border-slate-700/50 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox id="includeSpouse" checked={includeSpouse} onCheckedChange={(c) => setIncludeSpouse(c === true)} />
                  <Label htmlFor="includeSpouse" className="text-xs text-slate-300">Include Spouse</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="showMonteCarlo" checked={showMonteCarlo} onCheckedChange={(c) => setShowMonteCarlo(c === true)} />
                  <Label htmlFor="showMonteCarlo" className="text-xs text-slate-300">Monte Carlo Simulation</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="showStressTest" checked={showStressTest} onCheckedChange={(c) => setShowStressTest(c === true)} />
                  <Label htmlFor="showStressTest" className="text-xs text-slate-300">Market Stress Test</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Input 
                    placeholder="Custom Scenario Name" 
                    value={customScenarioName} 
                    onChange={(e) => setCustomScenarioName(e.target.value)}
                    className="h-7 text-xs bg-slate-900/50 border-slate-700"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Oil & Gas Tax Optimization Toggle */}
        <OilGasToggle compact />

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          <Card className="border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
            <CardContent className="p-4 text-center">
              <div className="mx-auto w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
                <PiggyBank className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-xs text-slate-400 mb-1">Total Premiums Paid</p>
              <p className="text-xl font-bold text-white">${(annualPremium * accumulationYears).toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 mt-1">{accumulationYears} years × ${(annualPremium/1000).toFixed(1)}k</p>
            </CardContent>
          </Card>
          <Card className="border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
            <CardContent className="p-4 text-center">
              <div className="mx-auto w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xs text-slate-400 mb-1">Hypothetical Peak Value*</p>
              <p className="text-xl font-bold" style={{ color: selectedRate.color }}>${projectionData.peakValue.toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 mt-1">At age {retirementAge}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
            <CardContent className="p-4 text-center">
              <div className="mx-auto w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
                <DollarSign className="w-4 h-4 text-green-400" />
              </div>
              <p className="text-xs text-slate-400 mb-1">Tax-Free Annual Income*</p>
              <p className="text-xl font-bold text-green-400">${projectionData.annualIncome.toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 mt-1">${Math.round(projectionData.annualIncome / 12).toLocaleString()}/mo</p>
            </CardContent>
          </Card>
          <Card className="border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
            <CardContent className="p-4 text-center">
              <div className="mx-auto w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center mb-2">
                <Activity className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-xs text-slate-400 mb-1">Total Lifetime Income*</p>
              <p className="text-xl font-bold text-amber-400">${(projectionData.annualIncome * incomeYears).toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 mt-1">{incomeYears} years of income</p>
            </CardContent>
          </Card>
          <Card className="border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50 transition-colors hidden lg:block">
            <CardContent className="p-4 text-center">
              <div className="mx-auto w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center mb-2">
                <Shield className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-xs text-slate-400 mb-1">Est. Tax Savings*</p>
              <p className="text-xl font-bold text-purple-400">${Math.round(projectionData.annualIncome * incomeYears * (taxRate/100)).toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 mt-1">Over {incomeYears} years</p>
            </CardContent>
          </Card>
        </div>
        
        <p className="text-[10px] text-slate-500 text-center italic">
          * All values are hypothetical projections based on assumed {selectedRate.label} crediting rate.
          Actual results will differ. Policy charges, cost of insurance, and other fees are approximated.
        </p>

        {/* Interactive Element 23: Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex flex-wrap gap-1 bg-slate-800/50 p-1 rounded-xl w-full justify-start h-auto">
            <TabsTrigger value="projections" className="text-xs data-[state=active]:bg-slate-700"><BarChart2 className="w-3 h-3 mr-1.5" /> Projection Chart</TabsTrigger>
            <TabsTrigger value="scenarios" className="text-xs data-[state=active]:bg-slate-700"><Target className="w-3 h-3 mr-1.5" /> Scenario Comparison</TabsTrigger>
            <TabsTrigger value="tax-analysis" className="text-xs data-[state=active]:bg-slate-700"><Calculator className="w-3 h-3 mr-1.5" /> Tax Analysis</TabsTrigger>
            <TabsTrigger value="risk-profile" className="text-xs data-[state=active]:bg-slate-700"><Activity className="w-3 h-3 mr-1.5" /> Risk Profile</TabsTrigger>
            <TabsTrigger value="data-tables" className="text-xs data-[state=active]:bg-slate-700"><BookOpen className="w-3 h-3 mr-1.5" /> Data Tables</TabsTrigger>
            <TabsTrigger value="tax-advantage" className="text-xs data-[state=active]:bg-slate-700"><Shield className="w-3 h-3 mr-1.5" /> Tax Advantage</TabsTrigger>
          
            <TabsTrigger value="generate-outcome" className="text-xs sm:text-sm bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 font-bold">Generate Outcome</TabsTrigger>
          </TabsList>

          {/* Tab 1: Projection Chart */}
          <TabsContent value="projections" className="space-y-4 mt-4">
            <Card className="border-slate-700/50 bg-slate-800/30">
              <CardHeader className="pb-2 border-b border-slate-700/50 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base text-slate-200">
                    Accumulation &amp; Distribution Phases
                  </CardTitle>
                  <p className="text-xs text-slate-400 mt-1">Hypothetical account value and income over time</p>
                </div>
                {/* Interactive Element 24 */}
                <div className="flex bg-slate-900/50 rounded-lg p-1">
                  <Button 
                    variant={selectedChartType === "area" ? "secondary" : "ghost"} 
                    size="sm" 
                    className="h-7 text-xs px-2"
                    onClick={() => setSelectedChartType("area")}
                  >
                    Area
                  </Button>
                  <Button 
                    variant={selectedChartType === "line" ? "secondary" : "ghost"} 
                    size="sm" 
                    className="h-7 text-xs px-2"
                    onClick={() => setSelectedChartType("line")}
                  >
                    Line
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[450px]">
                  {/* Recharts Component 1: ComposedChart */}
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={projectionData.data} margin={{ top: 10, right: 10, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis 
                        dataKey="age" 
                        tick={{ fill: "#94a3b8", fontSize: 11 }} 
                        label={{ value: "Client Age", position: "bottom", offset: 0, fill: "#64748b", fontSize: 12 }} 
                        tickMargin={10}
                      />
                      <YAxis 
                        yAxisId="left"
                        tick={{ fill: "#94a3b8", fontSize: 11 }} 
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} 
                        label={{ value: "Account Value ($)", angle: -90, position: "insideLeft", offset: -10, fill: "#64748b", fontSize: 12 }}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        tick={{ fill: "#94a3b8", fontSize: 11 }} 
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} 
                      />
                      <Tooltip
                        contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
                        itemStyle={{ fontSize: 12 }}
                        labelStyle={{ color: "#94a3b8", marginBottom: 4, fontWeight: "bold" }}
                        formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]}
                        labelFormatter={(label) => `Age ${label}`}
                      />
                      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 20 }} />
                      
                      {selectedChartType === "area" ? (
                        <Area yAxisId="left" type="monotone" dataKey="accumulationValue" name="Hypothetical Account Value" fill={selectedRate.color} fillOpacity={0.15} stroke={selectedRate.color} strokeWidth={2} />
                      ) : (
                        <Line yAxisId="left" type="monotone" dataKey="accumulationValue" name="Hypothetical Account Value" stroke={selectedRate.color} strokeWidth={3} dot={false} />
                      )}
                      
                      <Bar yAxisId="right" dataKey="income" name="Tax-Free Income (Loans)" fill="#22c55e" opacity={0.8} radius={[4, 4, 0, 0]} maxBarSize={40} />
                      
                      {(includeSocialSecurity || includePension) && (
                        <Bar yAxisId="right" dataKey="taxableIncome" name="Taxable Income (SS/Pension)" fill="#f59e0b" opacity={0.8} stackId="income" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      )}
                      
                      <Line yAxisId="left" type="stepAfter" dataKey="premiumPaid" name="Total Premiums Paid" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                      <Line yAxisId="left" type="monotone" dataKey="deathBenefit" name="Est. Death Benefit" stroke="#8b5cf6" strokeWidth={1} strokeDasharray="3 3" dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {showMonteCarlo && (
              <Card className="border-slate-700/50 bg-slate-800/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    Monte Carlo Simulation ({monteCarloTrials} Trials)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {/* Recharts Component 2: LineChart */}
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monteCarloData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="age" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                        <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip
                          contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }}
                          formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Line type="monotone" dataKey="p90" name="90th Percentile (Favorable)" stroke="#22c55e" strokeWidth={1} strokeDasharray="3 3" dot={false} />
                        <Line type="monotone" dataKey="p50" name="50th Percentile (Median)" stroke="#3b82f6" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="p10" name="10th Percentile (Poor)" stroke="#ef4444" strokeWidth={1} strokeDasharray="3 3" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab 2: Scenarios */}
          <TabsContent value="scenarios" className="space-y-4 mt-4">
            <Card className="border-slate-700/50 bg-slate-800/30">
              <CardHeader>
                <CardTitle className="text-lg text-white">Scenario Comparison</CardTitle>
                <p className="text-sm text-slate-400">
                  Always consider the full range of possible outcomes. The guaranteed scenario shows the
                  contractual minimum; other scenarios are hypothetical and not guaranteed.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {threeScenarios.filter((s) => s.key !== 'custom').map((s) => (
                    <div key={s.key} className="p-4 rounded-xl border relative overflow-hidden group" style={{ borderColor: `${s.color}33`, background: `${s.color}08` }}>
                      <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-40 transition-opacity">
                        <Target className="w-8 h-8" style={{ color: s.color }} />
                      </div>
                      <h4 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: s.color }}>
                        <div className="w-2 h-2 rounded-full" style={{ background: s.color }}></div>
                        {s.label}
                      </h4>
                      <div className="space-y-4 relative z-10">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Peak Accumulation</p>
                          <p className="text-xl font-bold text-white">${s.peakValue.toLocaleString()}</p>
                        </div>
                        <div className="pt-2 border-t border-slate-700/50">
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Annual Income</p>
                          <p className="text-xl font-bold" style={{ color: s.color }}>${s.annualIncome.toLocaleString()}</p>
                          <p className="text-xs text-slate-400 mt-1">${s.monthlyIncome.toLocaleString()}/mo</p>
                        </div>
                        <div className="pt-2 border-t border-slate-700/50">
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Total Lifetime Income</p>
                          <p className="text-lg font-medium text-slate-200">${s.totalIncome.toLocaleString()}</p>
                        </div>
                        <div className="pt-2 border-t border-slate-700/50">
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Est. ROI</p>
                          <p className="text-sm font-medium text-emerald-400">+{s.roi.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="h-[300px] mt-8">
                  <h4 className="text-sm font-medium text-slate-300 mb-4 text-center">Total Lifetime Income Comparison</h4>
                  {/* Recharts Component 3: BarChart */}
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={threeScenarios.filter((s) => s.key !== 'custom')} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                      <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        cursor={{ fill: '#1e293b', opacity: 0.4 }}
                        contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Total Income']}
                      />
                      <Bar dataKey="totalIncome" radius={[4, 4, 0, 0]}>
                        {threeScenarios.filter((s) => s.key !== 'custom').map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Tax Analysis */}
          <TabsContent value="tax-analysis" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="border-slate-700/50 bg-slate-800/30 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base text-white flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-purple-400" />
                    Income Source & Tax Analysis
                  </CardTitle>
                  <p className="text-xs text-slate-400">Comparing taxable vs tax-free income sources during distribution phase</p>
                </CardHeader>
                <CardContent>
                  <div className="h-[350px]">
                    {/* Recharts Component 4: AreaChart */}
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={taxAnalysisData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="age" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                        <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                        <Tooltip
                          contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }}
                          formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <Area type="monotone" dataKey="taxFree" name="Tax-Free Income (Loans)" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
                        <Area type="monotone" dataKey="netTaxable" name="Net Taxable Income" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                        <Area type="monotone" dataKey="estimatedTax" name="Estimated Taxes Paid" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-700/50 bg-slate-800/30">
                <CardHeader>
                  <CardTitle className="text-base text-white">Tax Savings Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl text-center">
                    <p className="text-xs text-purple-300 mb-1">Estimated Lifetime Tax Savings</p>
                    <p className="text-3xl font-bold text-purple-400">
                      ${Math.round(projectionData.annualIncome * incomeYears * (taxRate/100)).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-2">By utilizing tax-free policy loans instead of taxable withdrawals</p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-slate-300 border-b border-slate-700 pb-1">Annual Breakdown (Average)</h4>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Gross Income Needed</span>
                      <span className="text-white">${Math.round(projectionData.annualIncome / (1 - taxRate/100)).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Tax-Free Income Used</span>
                      <span className="text-green-400">${projectionData.annualIncome.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm font-medium pt-2 border-t border-slate-700/50">
                      <span className="text-slate-300">Annual Tax Saved</span>
                      <span className="text-purple-400">${Math.round(projectionData.annualIncome * (taxRate/100)).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="pt-4">
                    {/* Interactive Element 25 */}
                    <Label className="text-xs text-slate-400 mb-2 block">Adjust Effective Tax Rate (%)</Label>
                    <div className="flex items-center gap-4">
                      <Slider 
                        value={[taxRate]} 
                        onValueChange={(v) => setTaxRate(v[0])} 
                        max={50} 
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium text-white w-8">{taxRate}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab 4: Risk Profile */}
          <TabsContent value="risk-profile" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-slate-700/50 bg-slate-800/30">
                <CardHeader>
                  <CardTitle className="text-base text-white">Risk Exposure Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    {/* Recharts Component 5: RadarChart */}
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={riskRadarData}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="Risk Exposure" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                        <Tooltip 
                          contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }}
                          formatter={(value: number) => [`${value}/100`, 'Risk Level']}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-700/50 bg-slate-800/30">
                <CardHeader>
                  <CardTitle className="text-base text-white">Suggested Asset Allocation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex flex-col">
                    {/* Recharts Component 6: PieChart */}
                    <div className="flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={assetAllocationData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {assetAllocationData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }}
                            formatter={(value: number) => [`${value}%`, 'Allocation']}
                          />
                          <Legend wrapperStyle={{ fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-slate-400 text-center mt-4">
                      Based on selected {riskTolerance} risk tolerance profile.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab 5: Data Tables */}
          <TabsContent value="data-tables" className="space-y-4 mt-4">
            <Card className="border-slate-700/50 bg-slate-800/30">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm text-slate-300">Detailed Projection Tables</CardTitle>
                {/* Interactive Element 26 */}
                <div className="flex bg-slate-900/50 rounded-lg p-1">
                  <Button 
                    variant={selectedTableView === "summary" ? "secondary" : "ghost"} 
                    size="sm" 
                    className="h-7 text-xs px-2"
                    onClick={() => setSelectedTableView("summary")}
                  >
                    Summary (5-Yr)
                  </Button>
                  <Button 
                    variant={selectedTableView === "annual" ? "secondary" : "ghost"} 
                    size="sm" 
                    className="h-7 text-xs px-2"
                    onClick={() => setSelectedTableView("annual")}
                  >
                    Annual (All)
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Data Table 1: Main Projection Data */}
                <div className="mb-8">
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Account Values & Cash Flows</h4>
                  <div className="overflow-x-auto rounded-md border border-slate-700/50">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-900/80">
                        <tr className="border-b border-slate-700">
                          <th className="text-left p-2.5 text-slate-400 font-medium">Year</th>
                          <th className="text-left p-2.5 text-slate-400 font-medium">Age</th>
                          <th className="text-left p-2.5 text-slate-400 font-medium">Phase</th>
                          <th className="text-right p-2.5 text-slate-400 font-medium">Premium Paid</th>
                          <th className="text-right p-2.5 text-slate-400 font-medium">Account Value*</th>
                          <th className="text-right p-2.5 text-slate-400 font-medium">Surrender Value</th>
                          <th className="text-right p-2.5 text-slate-400 font-medium">Death Benefit</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {projectionData.data
                          .filter((_, i) => selectedTableView === "annual" || i % 5 === 0 || i === projectionData.data.length - 1)
                          .map((row) => (
                          <tr key={`t1-${row.age}`} className="hover:bg-slate-800/50 transition-colors">
                            <td className="p-2.5 text-slate-400">{row.year}</td>
                            <td className="p-2.5 text-slate-300 font-medium">{row.age}</td>
                            <td className="p-2.5">
                              <Badge variant="outline" className={row.phase === "Accumulation" ? "border-blue-500/30 text-blue-400 text-[10px] bg-blue-500/10" : "border-green-500/30 text-green-400 text-[10px] bg-green-500/10"}>
                                {row.phase}
                              </Badge>
                            </td>
                            <td className="p-2.5 text-right text-slate-400">${row.premiumPaid.toLocaleString()}</td>
                            <td className="p-2.5 text-right text-white font-medium">${row.accumulationValue.toLocaleString()}</td>
                            <td className="p-2.5 text-right text-slate-400">${row.surrenderValue.toLocaleString()}</td>
                            <td className="p-2.5 text-right text-purple-400">${row.deathBenefit.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Data Table 2: Income Distribution Data */}
                <div className="mb-8">
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Income Distribution Phase</h4>
                  <div className="overflow-x-auto rounded-md border border-slate-700/50">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-900/80">
                        <tr className="border-b border-slate-700">
                          <th className="text-left p-2.5 text-slate-400 font-medium">Age</th>
                          <th className="text-right p-2.5 text-slate-400 font-medium">Tax-Free Income*</th>
                          <th className="text-right p-2.5 text-slate-400 font-medium">Social Security</th>
                          <th className="text-right p-2.5 text-slate-400 font-medium">Pension</th>
                          <th className="text-right p-2.5 text-slate-400 font-medium">Total Gross Income</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {projectionData.data
                          .filter((row) => row.phase === "Distribution")
                          .filter((_, i) => selectedTableView === "annual" || i % 5 === 0 || i === incomeYears - 1)
                          .map((row) => (
                          <tr key={`t2-${row.age}`} className="hover:bg-slate-800/50 transition-colors">
                            <td className="p-2.5 text-slate-300 font-medium">{row.age}</td>
                            <td className="p-2.5 text-right text-green-400 font-medium">${row.income.toLocaleString()}</td>
                            <td className="p-2.5 text-right text-slate-400">${row.socialSecurityIncome?.toLocaleString() || '0'}</td>
                            <td className="p-2.5 text-right text-slate-400">${row.pensionIncome?.toLocaleString() || '0'}</td>
                            <td className="p-2.5 text-right text-white font-bold">${row.totalIncome?.toLocaleString() || row.income.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Data Table 3: Tax Implications */}
                <div className="mb-8">
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Estimated Tax Implications</h4>
                  <div className="overflow-x-auto rounded-md border border-slate-700/50">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-900/80">
                        <tr className="border-b border-slate-700">
                          <th className="text-left p-2.5 text-slate-400 font-medium">Age</th>
                          <th className="text-right p-2.5 text-slate-400 font-medium">Gross Taxable</th>
                          <th className="text-right p-2.5 text-slate-400 font-medium">Est. Tax ({taxRate}%)</th>
                          <th className="text-right p-2.5 text-slate-400 font-medium">Net Taxable</th>
                          <th className="text-right p-2.5 text-slate-400 font-medium">Tax-Free Add-on</th>
                          <th className="text-right p-2.5 text-slate-400 font-medium">Total Net Income</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {taxAnalysisData
                          .filter((_, i) => selectedTableView === "annual" || i % 5 === 0 || i === taxAnalysisData.length - 1)
                          .map((row) => (
                          <tr key={`t3-${row.age}`} className="hover:bg-slate-800/50 transition-colors">
                            <td className="p-2.5 text-slate-300 font-medium">{row.age}</td>
                            <td className="p-2.5 text-right text-slate-400">${row.grossTaxable.toLocaleString()}</td>
                            <td className="p-2.5 text-right text-red-400">-${row.estimatedTax.toLocaleString()}</td>
                            <td className="p-2.5 text-right text-slate-300">${row.netTaxable.toLocaleString()}</td>
                            <td className="p-2.5 text-right text-green-400">+${row.taxFree.toLocaleString()}</td>
                            <td className="p-2.5 text-right text-white font-bold">${row.totalNetIncome.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Data Table 4: Scenario Comparison */}
                <div className="mb-8">
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Scenario Comparison Matrix</h4>
                  <div className="overflow-x-auto rounded-md border border-slate-700/50">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-900/80">
                        <tr className="border-b border-slate-700">
                          <th className="text-left p-2.5 text-slate-400 font-medium">Scenario</th>
                          <th className="text-right p-2.5 text-slate-400 font-medium">Assumed Rate</th>
                          <th className="text-right p-2.5 text-slate-400 font-medium">Peak Value</th>
                          <th className="text-right p-2.5 text-slate-400 font-medium">Annual Income</th>
                          <th className="text-right p-2.5 text-slate-400 font-medium">Total Lifetime Income</th>
                          <th className="text-right p-2.5 text-slate-400 font-medium">Est. ROI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {threeScenarios.map((row) => (
                          <tr key={`t4-${row.key}`} className="hover:bg-slate-800/50 transition-colors">
                            <td className="p-2.5 font-medium flex items-center gap-2" style={{ color: row.color }}>
                              <div className="w-2 h-2 rounded-full" style={{ background: row.color }}></div>
                              {row.label}
                            </td>
                            <td className="p-2.5 text-right text-slate-300">{row.rate}%</td>
                            <td className="p-2.5 text-right text-slate-300">${row.peakValue.toLocaleString()}</td>
                            <td className="p-2.5 text-right text-slate-300">${row.annualIncome.toLocaleString()}</td>
                            <td className="p-2.5 text-right text-slate-300">${row.totalIncome.toLocaleString()}</td>
                            <td className="p-2.5 text-right text-emerald-400">+{row.roi.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Data Table 5: Fee Breakdown */}
                <div className="mb-8">
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Estimated Fee Breakdown (Sample)</h4>
                  <div className="overflow-x-auto rounded-md border border-slate-700/50">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-900/80">
                        <tr className="border-b border-slate-700">
                          <th className="text-left p-2.5 text-slate-400 font-medium">Year</th>
                          <th className="text-left p-2.5 text-slate-400 font-medium">Age</th>
                          <th className="text-right p-2.5 text-slate-400 font-medium">Premium Load (6%)</th>
                          <th className="text-right p-2.5 text-slate-400 font-medium">Est. COI</th>
                          <th className="text-right p-2.5 text-slate-400 font-medium">Total Est. Fees</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {[1, 5, 10, 15, 20].map((year) => {
                          const age = currentAge + year;
                          const load = annualPremium * 0.06;
                          const coi = (annualPremium * year) * 0.005; // simplified
                          return (
                            <tr key={`t5-${year}`} className="hover:bg-slate-800/50 transition-colors">
                              <td className="p-2.5 text-slate-400">{year}</td>
                              <td className="p-2.5 text-slate-300 font-medium">{age}</td>
                              <td className="p-2.5 text-right text-slate-400">${load.toLocaleString()}</td>
                              <td className="p-2.5 text-right text-slate-400">${Math.round(coi).toLocaleString()}</td>
                              <td className="p-2.5 text-right text-amber-400">${Math.round(load + coi).toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Data Table 6: Monte Carlo Percentiles */}
                {showMonteCarlo && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-2">Monte Carlo Simulation Percentiles</h4>
                    <div className="overflow-x-auto rounded-md border border-slate-700/50">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-900/80">
                          <tr className="border-b border-slate-700">
                            <th className="text-left p-2.5 text-slate-400 font-medium">Year in Retirement</th>
                            <th className="text-left p-2.5 text-slate-400 font-medium">Age</th>
                            <th className="text-right p-2.5 text-slate-400 font-medium">10th Percentile (Poor)</th>
                            <th className="text-right p-2.5 text-slate-400 font-medium">50th Percentile (Median)</th>
                            <th className="text-right p-2.5 text-slate-400 font-medium">90th Percentile (Favorable)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {monteCarloData.filter((_, i) => i % 5 === 0).map((row) => (
                            <tr key={`t6-${row.age}`} className="hover:bg-slate-800/50 transition-colors">
                              <td className="p-2.5 text-slate-400">{row.year}</td>
                              <td className="p-2.5 text-slate-300 font-medium">{row.age}</td>
                              <td className="p-2.5 text-right text-red-400">${row.p10.toLocaleString()}</td>
                              <td className="p-2.5 text-right text-blue-400 font-medium">${row.p50.toLocaleString()}</td>
                              <td className="p-2.5 text-right text-green-400">${row.p90.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 6: Tax Advantage */}
          <TabsContent value="tax-advantage" className="space-y-4 mt-4">
            <Card className="border-slate-700/50 bg-slate-800/30">
              <CardHeader>
                <CardTitle className="text-lg text-white">Understanding Tax-Advantaged Income</CardTitle>
                <p className="text-sm text-slate-400">
                  Policy loans from a properly structured life insurance policy are generally not considered
                  taxable income under current tax law (IRC Section 7702). This section explains the mechanics.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <h4 className="text-sm font-semibold text-green-300 mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4" /> Policy Loan Income
                    </h4>
                    <ul className="space-y-2 text-xs text-green-200/80">
                      <li className="flex items-start gap-1.5"><ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" /><span>Generally not reported as taxable income</span></li>
                      <li className="flex items-start gap-1.5"><ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" /><span>No contribution limits (unlike Roth IRA)</span></li>
                      <li className="flex items-start gap-1.5"><ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" /><span>No age restrictions on access</span></li>
                      <li className="flex items-start gap-1.5"><ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" /><span>Does not affect Social Security taxation</span></li>
                    </ul>
                  </div>
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <h4 className="text-sm font-semibold text-amber-300 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Important Considerations
                    </h4>
                    <ul className="space-y-2 text-xs text-amber-200/80">
                      <li className="flex items-start gap-1.5"><ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" /><span>Policy must remain in force for tax benefits</span></li>
                      <li className="flex items-start gap-1.5"><ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" /><span>Loans accrue interest that reduces account value</span></li>
                      <li className="flex items-start gap-1.5"><ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" /><span>Excessive loans may cause policy lapse (taxable event)</span></li>
                      <li className="flex items-start gap-1.5"><ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" /><span>Tax laws may change; consult a tax professional</span></li>
                    </ul>
                  </div>
                </div>

                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl mt-4">
                  <p className="text-xs text-blue-200/80 leading-relaxed">
                    <strong className="text-blue-300">Disclaimer:</strong> The tax treatment described above is based on
                    current federal tax law (IRC Section 7702) and may change. State tax treatment may vary.
                    This information is educational and does not constitute tax advice. Consult with a qualified
                    tax professional regarding your specific situation. Russell Capital Systems™ does not provide
                    tax, legal, or accounting advice.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        
          <TabsContent value="generate-outcome" className="space-y-6 mt-6">
            <GenerateOutcomeTab
              strategyType="retirement-income"
              hasResults={true}
              resultData={{ monthlyIncome: 12000, annualIncome: 144000, incomeGap: 0, socialSecurity: 36000, pensionIncome: 24000, annuityIncome: 48000, portfolioWithdrawal: 36000, yearsOfIncome: 30 }}
              metrics={[{ label: "Monthly Income", value: 12000, highlight: true }, { label: "Annual Income", value: 144000 }, { label: "Social Security", value: 36000 }, { label: "Annuity Income", value: 48000 }]}
            />
          </TabsContent>
        </Tabs>

        <NAICDisclaimer variant="footer" showsProjections showsCashValues />
      </div>
      <PageInsights pageId="retirement-income-advanced" />
    
        <ComplianceFooter pageName="RetirementIncomeProjection" showsTax showsEstate showsProjections showsPolicyLoans />
      </AppShell>
  );
}
