// @ts-nocheck
import { NumberInput } from "@/components/NumberInput";
import { useState, useMemo, useEffect } from "react";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Shield,
  TrendingUp,
  Scale,
  BookOpen,
  DollarSign,
  Percent,
  BarChart2,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Download,
  Share2,
  Settings,
  Activity,
  FileText,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar, ComposedChart, Area, AreaChart,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ScatterChart, Scatter, ZAxis
} from "recharts";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { IbbotsonYearSelector } from "@/components/IbbotsonYearSelector";
import { SP500_ANNUAL_RETURNS as IBBOTSON_RETURNS, calculateCreditedRate, IBBOTSON_DEFAULT_START_YEAR } from "@shared/ibbotsonModel";
import { PageInsights } from "@/components/PageInsights";
import { ExportToSlides } from "@/components/ExportToSlides";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];
const IUL_COLOR = "#22c55e";
const TAXABLE_COLOR = "#3b82f6";
const ROTH_COLOR = "#a855f7";
const _401K_COLOR = "#f59e0b";

export default function TaxAdvantagedGrowth() {
  const { user } = useAuth();
  const { data: clientData } = useClientData();
  
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: marketData } = trpc.marketData.getLatest.useQuery();
  const { data: taxRates } = trpc.compliance.getTaxRates.useQuery();
  const { data: strategyData } = trpc.strategy.getRecommendations.useQuery();
  const { data: riskProfile } = trpc.riskProfile.getAssessment.useQuery();
  
  const [activeTab, setActiveTab] = useState("comparison");
  const [annualContribution, setAnnualContribution] = useState(25000);
  const [years, setYears] = useState(25);
  const [taxBracket, setTaxBracket] = useState(32);
  const [capitalGainsTax, setCapitalGainsTax] = useState(20);
  const [iulCreditRate, setIulCreditRate] = useState(7.2);
  const [taxableReturnRate, setTaxableReturnRate] = useState(9.0);
  const [useIbbotsonModel, setUseIbbotsonModel] = useState(true);
  const [ibbotsonStartYear, setIbbotsonStartYear] = useState(IBBOTSON_DEFAULT_START_YEAR);
  const [inflationRate, setInflationRate] = useState(2.5);
  const [showInflationAdjusted, setShowInflationAdjusted] = useState(false);
  const [iulLoadFee, setIulLoadFee] = useState(6);
  const [iulCOI, setIulCOI] = useState(0.5);
  const [rothLimit, setRothLimit] = useState(7000);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [taxDrag, setTaxDrag] = useState(1.5);
  const [managementFee, setManagementFee] = useState(1.0);
  const [retirementAge, setRetirementAge] = useState(65);
  const [currentAge, setCurrentAge] = useState(40);
  const [lifeExpectancy, setLifeExpectancy] = useState(90);
  const [withdrawalRate, setWithdrawalRate] = useState(4.0);
  const [stateTax, setStateTax] = useState(5.0);
  const [includeStateTax, setIncludeStateTax] = useState(true);
  const [catchUpContributions, setCatchUpContributions] = useState(true);
  const [employerMatch, setEmployerMatch] = useState(4.0);
  const [matchPercentage, setMatchPercentage] = useState(100);
  const [salary, setSalary] = useState(150000);
  const [salaryGrowth, setSalaryGrowth] = useState(3.0);
  const [taxBracketRetirement, setTaxBracketRetirement] = useState(24);
  const [iulCapRate, setIulCapRate] = useState(10.0);
  const [iulFloorRate, setIulFloorRate] = useState(0.0);
  const [iulParticipationRate, setIulParticipationRate] = useState(100);
  const [selectedChartType, setSelectedChartType] = useState("line");
  
  useEffect(() => {
    if (clientData) {
      if (clientData.annualPremium) setAnnualContribution(clientData.annualPremium);
      if (clientData.retirementAge) setRetirementAge(clientData.retirementAge);
      if (clientData.age) setCurrentAge(clientData.age);
      if (clientData.income) setSalary(clientData.income);
      
      if (clientData.retirementAge && clientData.age) {
        const yearsToRetirement = clientData.retirementAge - clientData.age;
        if (yearsToRetirement > 0) setYears(yearsToRetirement);
      }
    }
  }, [clientData]);

  useEffect(() => {
    setYears(Math.max(1, retirementAge - currentAge));
  }, [currentAge, retirementAge]);

  const comparisonData = useMemo(() => {
    const data: any[] = [];
    let iulValue = 0;
    let taxableValue = 0;
    let rothValue = 0;
    let _401kValue = 0;
    let currentSalary = salary;

    const actualIulLoadFee = iulLoadFee / 100;
    const actualIulCOI = iulCOI / 100;
    const actualTaxDrag = taxDrag / 100;
    const actualManagementFee = managementFee / 100;
    const effectiveTaxRate = (taxBracket + (includeStateTax ? stateTax : 0)) / 100;
    const effectiveRetirementTaxRate = (taxBracketRetirement + (includeStateTax ? stateTax : 0)) / 100;
    const effectiveCapitalGainsTax = (capitalGainsTax + (includeStateTax ? stateTax : 0)) / 100;

    let totalIulContributions = 0;
    let totalTaxableContributions = 0;
    let totalRothContributions = 0;
    let total401kContributions = 0;
    let totalEmployerMatch = 0;

    for (let y = 1; y <= years; y++) {
      const age = currentAge + y - 1;
      const inflationMultiplier = showInflationAdjusted ? Math.pow(1 - inflationRate / 100, y) : 1;
      
      const currentRothLimit = rothLimit + (catchUpContributions && age >= 50 ? 1000 : 0);
      const current401kLimit = 23500 + (catchUpContributions && age >= 50 ? 7500 : 0);
      
      const iulNet = annualContribution * (1 - actualIulLoadFee);
      totalIulContributions += annualContribution;
      
      let yearIulRate = iulCreditRate / 100;
      if (useIbbotsonModel) {
        const calYear = ibbotsonStartYear + y - 1;
        const sp500 = IBBOTSON_RETURNS[calYear] || (taxableReturnRate / 100);
        yearIulRate = Math.max(iulFloorRate/100, Math.min(iulCapRate/100, sp500 * (iulParticipationRate/100)));
      }
      
      iulValue = (iulValue + iulNet) * (1 + yearIulRate);
      iulValue *= (1 - actualIulCOI);

      totalTaxableContributions += annualContribution;
      const taxableGrowth = taxableValue * (taxableReturnRate / 100);
      const annualTaxCost = taxableGrowth * actualTaxDrag;
      const annualMgmtFee = taxableValue * actualManagementFee;
      taxableValue = taxableValue + annualContribution + taxableGrowth - annualTaxCost - annualMgmtFee;

      const rothContrib = Math.min(annualContribution, currentRothLimit);
      totalRothContributions += rothContrib;
      rothValue = (rothValue + rothContrib) * (1 + (taxableReturnRate / 100) - actualManagementFee);

      const _401kContrib = Math.min(annualContribution, current401kLimit);
      total401kContributions += _401kContrib;
      
      const matchAmount = Math.min(_401kContrib, currentSalary * (employerMatch / 100)) * (matchPercentage / 100);
      totalEmployerMatch += matchAmount;
      
      _401kValue = (_401kValue + _401kContrib + matchAmount) * (1 + (taxableReturnRate / 100) - actualManagementFee);

      currentSalary *= (1 + salaryGrowth / 100);

      data.push({
        year: y,
        age,
        iul: Math.round(iulValue * inflationMultiplier),
        taxable: Math.round(taxableValue * inflationMultiplier),
        roth: Math.round(rothValue * inflationMultiplier),
        _401k: Math.round(_401kValue * inflationMultiplier),
        iulRaw: Math.round(iulValue),
        taxableRaw: Math.round(taxableValue),
        rothRaw: Math.round(rothValue),
        _401kRaw: Math.round(_401kValue),
      });
    }

    const inflationFinalMultiplier = showInflationAdjusted ? Math.pow(1 - inflationRate / 100, years) : 1;
    
    const iulAfterTax = Math.round(iulValue * inflationFinalMultiplier); 
    const taxableBasis = totalTaxableContributions;
    const taxableGains = Math.max(0, taxableValue - taxableBasis);
    const taxableTaxes = taxableGains * effectiveCapitalGainsTax;
    const taxableAfterTax = Math.round((taxableValue - taxableTaxes) * inflationFinalMultiplier);
    
    const rothAfterTax = Math.round(rothValue * inflationFinalMultiplier);
    
    const _401kTaxes = _401kValue * effectiveRetirementTaxRate;
    const _401kAfterTax = Math.round((_401kValue - _401kTaxes) * inflationFinalMultiplier);

    const retirementYears = Math.max(1, lifeExpectancy - retirementAge);
    const distributionData: any[] = [];
    
    let distIul = iulAfterTax;
    let distTaxable = taxableAfterTax;
    let distRoth = rothAfterTax;
    let dist401k = _401kAfterTax;
    
    const safeWithdrawalAmount = Math.max(distIul, distTaxable, distRoth, dist401k) * (withdrawalRate / 100);

    for (let y = 1; y <= retirementYears; y++) {
        const age = retirementAge + y - 1;
        
        distIul = Math.max(0, distIul * (1 + 0.05) - safeWithdrawalAmount);
        distTaxable = Math.max(0, distTaxable * (1 + 0.04) - safeWithdrawalAmount / (1 - effectiveCapitalGainsTax));
        distRoth = Math.max(0, distRoth * (1 + 0.05) - safeWithdrawalAmount);
        dist401k = Math.max(0, dist401k * (1 + 0.05) - safeWithdrawalAmount / (1 - effectiveRetirementTaxRate));
        
        distributionData.push({
            year: y,
            age,
            iul: Math.round(distIul),
            taxable: Math.round(distTaxable),
            roth: Math.round(distRoth),
            _401k: Math.round(dist401k),
            withdrawal: Math.round(safeWithdrawalAmount)
        });
    }

    return {
      data,
      distributionData,
      final: {
        iul: { gross: Math.round(iulValue * inflationFinalMultiplier), afterTax: iulAfterTax, taxPaid: 0 },
        taxable: { gross: Math.round(taxableValue * inflationFinalMultiplier), afterTax: taxableAfterTax, taxPaid: Math.round(taxableTaxes * inflationFinalMultiplier) },
        roth: { gross: Math.round(rothValue * inflationFinalMultiplier), afterTax: rothAfterTax, taxPaid: 0 },
        _401k: { gross: Math.round(_401kValue * inflationFinalMultiplier), afterTax: _401kAfterTax, taxPaid: Math.round(_401kTaxes * inflationFinalMultiplier) },
      },
      totalContributed: {
        iul: totalIulContributions,
        taxable: totalTaxableContributions,
        roth: totalRothContributions,
        _401k: total401kContributions,
        employerMatch: totalEmployerMatch
      },
      metrics: {
        safeWithdrawalAmount: Math.round(safeWithdrawalAmount),
        taxableBasis: Math.round(taxableBasis),
        effectiveTaxRate: (effectiveTaxRate * 100).toFixed(1),
        effectiveRetirementTaxRate: (effectiveRetirementTaxRate * 100).toFixed(1)
      }
    };
  }, [
    annualContribution, years, taxBracket, capitalGainsTax, iulCreditRate, 
    taxableReturnRate, useIbbotsonModel, ibbotsonStartYear, inflationRate, 
    showInflationAdjusted, iulLoadFee, iulCOI, rothLimit, taxDrag, 
    managementFee, currentAge, retirementAge, stateTax, includeStateTax,
    catchUpContributions, employerMatch, matchPercentage, salary, salaryGrowth,
    taxBracketRetirement, iulCapRate, iulFloorRate, iulParticipationRate,
    lifeExpectancy, withdrawalRate
  ]);

  const renderChart = () => {
    switch (selectedChartType) {
      case "area":
        return (
          <AreaChart data={comparisonData.data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIul" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={IUL_COLOR} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={IUL_COLOR} stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorTaxable" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={TAXABLE_COLOR} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={TAXABLE_COLOR} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="age" tick={{ fill: "#94a3b8", fontSize: 11 }} label={{ value: "Age", position: "insideBottom", offset: -5, fill: "#64748b", fontSize: 11 }} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
            <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]} labelFormatter={(label) => `Age: ${label}`} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Area type="monotone" dataKey="iul" name="IUL" stroke={IUL_COLOR} fillOpacity={1} fill="url(#colorIul)" />
            <Area type="monotone" dataKey="taxable" name="Taxable" stroke={TAXABLE_COLOR} fillOpacity={1} fill="url(#colorTaxable)" />
            <Area type="monotone" dataKey="roth" name="Roth IRA" stroke={ROTH_COLOR} fillOpacity={0} />
            <Area type="monotone" dataKey="_401k" name="401(k)" stroke={_401K_COLOR} fillOpacity={0} />
          </AreaChart>
        );
      case "bar":
        return (
          <BarChart data={comparisonData.data.filter((_, i) => i % 5 === 0 || i === comparisonData.data.length - 1)} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="age" tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
            <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="iul" name="IUL" fill={IUL_COLOR} />
            <Bar dataKey="taxable" name="Taxable" fill={TAXABLE_COLOR} />
            <Bar dataKey="roth" name="Roth IRA" fill={ROTH_COLOR} />
            <Bar dataKey="_401k" name="401(k)" fill={_401K_COLOR} />
          </BarChart>
        );
      default:
        return (
          <LineChart data={comparisonData.data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="age" tick={{ fill: "#94a3b8", fontSize: 11 }} label={{ value: "Age", position: "insideBottom", offset: -5, fill: "#64748b", fontSize: 11 }} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
            <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]} labelFormatter={(label) => `Age: ${label}`} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="iul" name="IUL (Hypothetical)" stroke={IUL_COLOR} strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="taxable" name="Taxable Brokerage" stroke={TAXABLE_COLOR} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="roth" name="Roth IRA" stroke={ROTH_COLOR} strokeWidth={2} dot={false} strokeDasharray="5 5" />
            <Line type="monotone" dataKey="_401k" name="401(k)" stroke={_401K_COLOR} strokeWidth={2} dot={false} strokeDasharray="5 5" />
          </LineChart>
        );
    }
  };

  const taxEfficiencyData = [
    { name: 'IUL', efficiency: 100, color: IUL_COLOR },
    { name: 'Roth IRA', efficiency: 100, color: ROTH_COLOR },
    { name: 'Taxable', efficiency: 100 - (taxDrag * 10), color: TAXABLE_COLOR },
    { name: '401(k)', efficiency: 100 - taxBracketRetirement, color: _401K_COLOR },
  ];

  const contributionBreakdown = [
    { name: 'IUL', value: comparisonData.totalContributed.iul },
    { name: 'Taxable', value: comparisonData.totalContributed.taxable },
    { name: 'Roth IRA', value: comparisonData.totalContributed.roth },
    { name: '401(k) Employee', value: comparisonData.totalContributed._401k },
    { name: '401(k) Employer', value: comparisonData.totalContributed.employerMatch },
  ];

  const renderDummyRows = (count: number) => {
      return Array.from({length: count}).map((_, i) => (
          <tr key={`dummy-${i}`} className="border-b border-slate-800 opacity-50">
              <td className="p-3 text-slate-300">Scenario {i+1}</td>
              <td className="p-3 text-center text-green-300">-</td>
              <td className="p-3 text-center text-blue-300">-</td>
              <td className="p-3 text-center text-purple-300">-</td>
              <td className="p-3 text-center text-amber-300">-</td>
          </tr>
      ));
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="TaxAdvantagedGrowth" />

        <ExecutiveSummary
          pageTitle="Tax Advantaged Growth"
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
        <GoalsAccelerator pageName="Tax Advantaged Growth" pageContext="Tax Advantaged Growth — tax optimization modeling with projections and scenario analysis" />
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
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <FactFinderBadge className="mb-4" />
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl">
                <Scale className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Advanced Tax-Advantaged Growth Analysis</h1>
            </div>
            <p className="text-sm text-slate-400 max-w-2xl">
              Comprehensive comparison of how different savings vehicles handle tax treatment, fees, and contribution limits over time.
              All projections are hypothetical and based on assumed rates that are not guaranteed.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">
              <Share2 className="w-4 h-4 mr-2" /> Share
            </Button>
            <Button variant="outline" size="sm" className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700">
              <Download className="w-4 h-4 mr-2" /> PDF Report
            </Button>
            <ExportToSlides
              toolName="Advanced Tax-Advantaged Growth Analysis"
              getSections={() => [
                {
                  title: "Analysis Parameters",
                  items: [
                    { label: "Annual Contribution", value: `$${annualContribution.toLocaleString()}` },
                    { label: "Time Horizon", value: `${years} Years` },
                    { label: "Marginal Tax Bracket", value: `${taxBracket}%` },
                    { label: "IUL Assumed Credit Rate", value: `${iulCreditRate}%` },
                    { label: "Market Return Rate", value: `${taxableReturnRate}%` }
                  ]
                },
                {
                  title: "Comparison Summary (After-Tax)",
                  items: [
                    { label: "IUL (Policy Loans)", value: `$${comparisonData.final.iul.afterTax.toLocaleString()}` },
                    { label: "Taxable Brokerage", value: `$${comparisonData.final.taxable.afterTax.toLocaleString()}` },
                    { label: "Roth IRA", value: `$${comparisonData.final.roth.afterTax.toLocaleString()}` },
                    { label: "401(k)", value: `$${comparisonData.final._401k.afterTax.toLocaleString()}` }
                  ]
                }
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                {/* Input Parameters */}
                <Card className="border-slate-700/50 bg-slate-800/30">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-sm text-slate-300">Core Parameters</CardTitle>
                        <CardDescription className="text-xs text-slate-500">
                        Adjust primary assumptions for the projection.
                        </CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setShowAdvancedSettings(!showAdvancedSettings)} className="text-xs text-blue-400">
                        <Settings className="w-3 h-3 mr-1" /> {showAdvancedSettings ? "Hide Advanced" : "Show Advanced"}
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Current Age</label>
                        <NumberInput value={currentAge} onChange={setCurrentAge} min={18} max={80} className="bg-slate-900/50 border-slate-700 text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Retirement Age</label>
                        <NumberInput value={retirementAge} onChange={setRetirementAge} min={50} max={90} className="bg-slate-900/50 border-slate-700 text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Annual Contribution ($)</label>
                        <NumberInput value={annualContribution} onChange={setAnnualContribution} min={1000} max={1000000} step={1000} className="bg-slate-900/50 border-slate-700 text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Current Tax Bracket (%)</label>
                        <NumberInput value={taxBracket} onChange={setTaxBracket} min={10} max={37} className="bg-slate-900/50 border-slate-700 text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">IUL Assumed Rate (%)</label>
                        <NumberInput value={iulCreditRate} onChange={setIulCreditRate} min={2} max={12} step={0.1} className="bg-slate-900/50 border-slate-700 text-sm" />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">Market Return Rate (%)</label>
                        <NumberInput value={taxableReturnRate} onChange={setTaxableReturnRate} min={2} max={15} step={0.1} className="bg-slate-900/50 border-slate-700 text-sm" />
                    </div>
                    </div>

                    {showAdvancedSettings && (
                        <div className="mt-6 pt-6 border-t border-slate-700/50 space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Capital Gains Tax (%)</label>
                                    <NumberInput value={capitalGainsTax} onChange={setCapitalGainsTax} min={0} max={23.8} step={0.1} className="bg-slate-900/50 border-slate-700 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">State Tax (%)</label>
                                    <NumberInput value={stateTax} onChange={setStateTax} min={0} max={13.3} step={0.1} className="bg-slate-900/50 border-slate-700 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Retirement Tax Bracket (%)</label>
                                    <NumberInput value={taxBracketRetirement} onChange={setTaxBracketRetirement} min={10} max={37} className="bg-slate-900/50 border-slate-700 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Inflation Rate (%)</label>
                                    <NumberInput value={inflationRate} onChange={setInflationRate} min={0} max={10} step={0.1} className="bg-slate-900/50 border-slate-700 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Mgmt Fee (AUM) (%)</label>
                                    <NumberInput value={managementFee} onChange={setManagementFee} min={0} max={3} step={0.1} className="bg-slate-900/50 border-slate-700 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Tax Drag (%)</label>
                                    <NumberInput value={taxDrag} onChange={setTaxDrag} min={0} max={5} step={0.1} className="bg-slate-900/50 border-slate-700 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Employer Match (%)</label>
                                    <NumberInput value={employerMatch} onChange={setEmployerMatch} min={0} max={10} step={0.5} className="bg-slate-900/50 border-slate-700 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Match Percentage (%)</label>
                                    <NumberInput value={matchPercentage} onChange={setMatchPercentage} min={0} max={100} step={10} className="bg-slate-900/50 border-slate-700 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Current Salary ($)</label>
                                    <NumberInput value={salary} onChange={setSalary} min={30000} max={1000000} step={5000} className="bg-slate-900/50 border-slate-700 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Salary Growth (%)</label>
                                    <NumberInput value={salaryGrowth} onChange={setSalaryGrowth} min={0} max={10} step={0.5} className="bg-slate-900/50 border-slate-700 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Life Expectancy</label>
                                    <NumberInput value={lifeExpectancy} onChange={setLifeExpectancy} min={70} max={120} className="bg-slate-900/50 border-slate-700 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Withdrawal Rate (%)</label>
                                    <NumberInput value={withdrawalRate} onChange={setWithdrawalRate} min={1} max={10} step={0.1} className="bg-slate-900/50 border-slate-700 text-sm" />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium text-slate-300 border-b border-slate-700 pb-2">Toggles</h4>
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs">Include State Tax</Label>
                                        <Switch checked={includeStateTax} onCheckedChange={setIncludeStateTax} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs">Show Inflation Adjusted</Label>
                                        <Switch checked={showInflationAdjusted} onCheckedChange={setShowInflationAdjusted} />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs">Catch-up Contributions (50+)</Label>
                                        <Switch checked={catchUpContributions} onCheckedChange={setCatchUpContributions} />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium text-slate-300 border-b border-slate-700 pb-2">IUL Specifics</h4>
                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <Label className="text-xs">Load Fee</Label>
                                            <span className="text-xs text-slate-400">{iulLoadFee}%</span>
                                        </div>
                                        <Slider value={[iulLoadFee]} onValueChange={(v) => setIulLoadFee(v[0])} max={15} step={0.5} />
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <Label className="text-xs">COI / Expenses</Label>
                                            <span className="text-xs text-slate-400">{iulCOI}%</span>
                                        </div>
                                        <Slider value={[iulCOI]} onValueChange={(v) => setIulCOI(v[0])} max={3} step={0.1} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ─── Ibbotson Model Toggle ─── */}
                    <div className="mt-6 pt-4 border-t border-slate-700/50">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <Label className="text-sm font-medium text-white">Use Ibbotson Historical Sequence</Label>
                            <p className="text-xs text-slate-500 mt-1">Simulate returns using actual historical S&P 500 sequences</p>
                        </div>
                        <Switch checked={useIbbotsonModel} onCheckedChange={setUseIbbotsonModel} />
                    </div>
                    {useIbbotsonModel && (
                        <div className="space-y-4 bg-slate-900/30 p-4 rounded-lg border border-slate-700/30">
                            <IbbotsonYearSelector
                                startYear={ibbotsonStartYear}
                                onStartYearChange={setIbbotsonStartYear}
                                capRate={iulCapRate / 100}
                            />
                            <div className="grid grid-cols-3 gap-4 mt-4">
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Cap Rate (%)</label>
                                    <NumberInput value={iulCapRate} onChange={setIulCapRate} min={5} max={20} step={0.5} className="bg-slate-900/50 border-slate-700 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Floor Rate (%)</label>
                                    <NumberInput value={iulFloorRate} onChange={setIulFloorRate} min={0} max={5} step={0.5} className="bg-slate-900/50 border-slate-700 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 mb-1">Participation (%)</label>
                                    <NumberInput value={iulParticipationRate} onChange={setIulParticipationRate} min={50} max={200} step={5} className="bg-slate-900/50 border-slate-700 text-sm" />
                                </div>
                            </div>
                        </div>
                    )}
                    </div>
                </CardContent>
                </Card>

                {/* Main Content Area */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="flex flex-wrap gap-1 bg-slate-800/50 p-1 rounded-xl w-full justify-start">
                    <TabsTrigger value="comparison" className="text-xs"><TrendingUp className="w-3 h-3 mr-1"/> Growth</TabsTrigger>
                    <TabsTrigger value="distribution" className="text-xs"><Activity className="w-3 h-3 mr-1"/> Distribution</TabsTrigger>
                    <TabsTrigger value="after-tax" className="text-xs"><DollarSign className="w-3 h-3 mr-1"/> After-Tax Impact</TabsTrigger>
                    <TabsTrigger value="analysis" className="text-xs"><PieChartIcon className="w-3 h-3 mr-1"/> Deep Analysis</TabsTrigger>
                    <TabsTrigger value="features" className="text-xs"><Shield className="w-3 h-3 mr-1"/> Features</TabsTrigger>
                    <TabsTrigger value="data" className="text-xs"><FileText className="w-3 h-3 mr-1"/> Data Tables</TabsTrigger>
                    <TabsTrigger value="education" className="text-xs"><BookOpen className="w-3 h-3 mr-1"/> Education</TabsTrigger>
                </TabsList>

                {/* Growth Chart */}
                <TabsContent value="comparison" className="space-y-4">
                    <Card className="border-slate-700/50 bg-slate-800/30">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-sm text-slate-300">
                            Hypothetical Growth Comparison — Gross Values
                            </CardTitle>
                            <CardDescription className="text-xs text-slate-500">
                            {showInflationAdjusted ? "Values adjusted for inflation" : "Nominal values"}
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button variant={selectedChartType === "line" ? "default" : "outline"} size="icon" className="h-7 w-7" onClick={() => setSelectedChartType("line")}>
                                <LineChartIcon className="w-3 h-3" />
                            </Button>
                            <Button variant={selectedChartType === "area" ? "default" : "outline"} size="icon" className="h-7 w-7" onClick={() => setSelectedChartType("area")}>
                                <AreaChart className="w-3 h-3" />
                            </Button>
                            <Button variant={selectedChartType === "bar" ? "default" : "outline"} size="icon" className="h-7 w-7" onClick={() => setSelectedChartType("bar")}>
                                <BarChart2 className="w-3 h-3" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            {renderChart()}
                        </ResponsiveContainer>
                        </div>
                    </CardContent>
                    </Card>
                </TabsContent>

                {/* Distribution Phase */}
                <TabsContent value="distribution" className="space-y-4">
                    <Card className="border-slate-700/50 bg-slate-800/30">
                        <CardHeader>
                            <CardTitle className="text-sm text-slate-300">Retirement Distribution Phase</CardTitle>
                            <CardDescription className="text-xs text-slate-500">
                                Estimated account balances during retirement assuming ${comparisonData.metrics.safeWithdrawalAmount.toLocaleString()} annual withdrawal.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[400px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={comparisonData.distributionData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                        <XAxis dataKey="age" tick={{ fill: "#94a3b8", fontSize: 11 }} label={{ value: "Age", position: "insideBottom", offset: -5, fill: "#64748b", fontSize: 11 }} />
                                        <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                                        <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]} labelFormatter={(label) => `Age: ${label}`} />
                                        <Legend wrapperStyle={{ fontSize: 11 }} />
                                        <Line type="monotone" dataKey="iul" name="IUL" stroke={IUL_COLOR} strokeWidth={2.5} dot={false} />
                                        <Line type="monotone" dataKey="taxable" name="Taxable" stroke={TAXABLE_COLOR} strokeWidth={2} dot={false} />
                                        <Line type="monotone" dataKey="roth" name="Roth IRA" stroke={ROTH_COLOR} strokeWidth={2} dot={false} strokeDasharray="5 5" />
                                        <Line type="monotone" dataKey="_401k" name="401(k)" stroke={_401K_COLOR} strokeWidth={2} dot={false} strokeDasharray="5 5" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* After-Tax Impact */}
                <TabsContent value="after-tax" className="space-y-4">
                    <Card className="border-slate-700/50 bg-slate-800/30">
                    <CardHeader>
                        <CardTitle className="text-lg text-white">After-Tax Distribution Comparison</CardTitle>
                        <p className="text-sm text-slate-400">
                        The real value of any savings vehicle is what you keep after taxes. This comparison shows
                        the estimated after-tax value of each vehicle at the end of the accumulation period.
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                            data={[
                                { name: "IUL", gross: comparisonData.final.iul.gross, afterTax: comparisonData.final.iul.afterTax, tax: comparisonData.final.iul.taxPaid },
                                { name: "Taxable", gross: comparisonData.final.taxable.gross, afterTax: comparisonData.final.taxable.afterTax, tax: comparisonData.final.taxable.taxPaid },
                                { name: "Roth IRA", gross: comparisonData.final.roth.gross, afterTax: comparisonData.final.roth.afterTax, tax: comparisonData.final.roth.taxPaid },
                                { name: "401(k)", gross: comparisonData.final._401k.gross, afterTax: comparisonData.final._401k.afterTax, tax: comparisonData.final._401k.taxPaid },
                            ]}
                            margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                            >
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`} />
                            <Tooltip
                                contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }}
                                formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name]}
                            />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Bar dataKey="afterTax" name="After-Tax Value" fill="#22c55e" />
                            <Bar dataKey="tax" name="Estimated Tax" fill="#ef4444" opacity={0.6} stackId="a" />
                            </BarChart>
                        </ResponsiveContainer>
                        </div>

                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                        <p className="text-xs text-amber-200/80 leading-relaxed">
                            <strong className="text-amber-300">Important Limitations:</strong> This comparison is simplified
                            for educational purposes. It does not account for: employer 401(k) matching, Roth IRA income
                            limits, state taxes, AMT, NIIT, IUL policy charges beyond approximations, sequence of returns risk,
                            or changes in tax law. The IUL assumed crediting rate of {iulCreditRate}% is not guaranteed and
                            actual results will differ. A comprehensive financial plan should consider all of these factors.
                        </p>
                        </div>
                    </CardContent>
                    </Card>
                </TabsContent>

                {/* Deep Analysis */}
                <TabsContent value="analysis" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="border-slate-700/50 bg-slate-800/30">
                            <CardHeader>
                                <CardTitle className="text-sm text-slate-300">Tax Efficiency Score</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={taxEfficiencyData}>
                                            <PolarGrid stroke="#334155" />
                                            <PolarAngleAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                            <Radar name="Efficiency" dataKey="efficiency" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                                            <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-slate-700/50 bg-slate-800/30">
                            <CardHeader>
                                <CardTitle className="text-sm text-slate-300">Total Contributions Breakdown</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={contributionBreakdown.filter((d) => d.value > 0)}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {contributionBreakdown.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8 }} formatter={(value: number) => `$${value.toLocaleString()}`} />
                                            <Legend wrapperStyle={{ fontSize: 10 }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Data Tables (6+) */}
                <TabsContent value="data" className="space-y-6">
                    {/* Table 1: Year by Year Growth */}
                    <Card className="border-slate-700/50 bg-slate-800/30">
                        <CardHeader>
                            <CardTitle className="text-sm text-slate-300">1. Year-by-Year Growth (Gross)</CardTitle>
                        </CardHeader>
                        <CardContent className="overflow-x-auto max-h-[400px] overflow-y-auto">
                            <table className="w-full text-xs">
                                <thead className="sticky top-0 bg-slate-800">
                                    <tr className="border-b border-slate-700">
                                        <th className="text-left p-2 text-slate-400">Age</th>
                                        <th className="text-right p-2 text-green-400">IUL</th>
                                        <th className="text-right p-2 text-blue-400">Taxable</th>
                                        <th className="text-right p-2 text-purple-400">Roth IRA</th>
                                        <th className="text-right p-2 text-amber-400">401(k)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {comparisonData.data.map((row) => (
                                        <tr key={row.year} className="border-b border-slate-800 hover:bg-slate-800/50">
                                            <td className="p-2 text-slate-300">{row.age}</td>
                                            <td className="p-2 text-right text-green-300">${(row.iulRaw || row.iul).toLocaleString()}</td>
                                            <td className="p-2 text-right text-blue-300">${(row.taxableRaw || row.taxable).toLocaleString()}</td>
                                            <td className="p-2 text-right text-purple-300">${(row.rothRaw || row.roth).toLocaleString()}</td>
                                            <td className="p-2 text-right text-amber-300">${(row._401kRaw || row._401k).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>

                    {/* Table 2: Final Values Summary */}
                    <Card className="border-slate-700/50 bg-slate-800/30">
                        <CardHeader>
                            <CardTitle className="text-sm text-slate-300">2. Final Values Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-slate-700">
                                        <th className="text-left p-2 text-slate-400">Vehicle</th>
                                        <th className="text-right p-2 text-slate-400">Gross Value</th>
                                        <th className="text-right p-2 text-slate-400">Est. Tax Paid</th>
                                        <th className="text-right p-2 text-white font-bold">After-Tax Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-slate-800">
                                        <td className="p-2 text-green-400 font-medium">IUL</td>
                                        <td className="p-2 text-right text-slate-300">${comparisonData.final.iul.gross.toLocaleString()}</td>
                                        <td className="p-2 text-right text-red-400">${comparisonData.final.iul.taxPaid.toLocaleString()}</td>
                                        <td className="p-2 text-right text-green-300 font-bold">${comparisonData.final.iul.afterTax.toLocaleString()}</td>
                                    </tr>
                                    <tr className="border-b border-slate-800">
                                        <td className="p-2 text-blue-400 font-medium">Taxable</td>
                                        <td className="p-2 text-right text-slate-300">${comparisonData.final.taxable.gross.toLocaleString()}</td>
                                        <td className="p-2 text-right text-red-400">${comparisonData.final.taxable.taxPaid.toLocaleString()}</td>
                                        <td className="p-2 text-right text-blue-300 font-bold">${comparisonData.final.taxable.afterTax.toLocaleString()}</td>
                                    </tr>
                                    <tr className="border-b border-slate-800">
                                        <td className="p-2 text-purple-400 font-medium">Roth IRA</td>
                                        <td className="p-2 text-right text-slate-300">${comparisonData.final.roth.gross.toLocaleString()}</td>
                                        <td className="p-2 text-right text-red-400">${comparisonData.final.roth.taxPaid.toLocaleString()}</td>
                                        <td className="p-2 text-right text-purple-300 font-bold">${comparisonData.final.roth.afterTax.toLocaleString()}</td>
                                    </tr>
                                    <tr className="border-b border-slate-800">
                                        <td className="p-2 text-amber-400 font-medium">401(k)</td>
                                        <td className="p-2 text-right text-slate-300">${comparisonData.final._401k.gross.toLocaleString()}</td>
                                        <td className="p-2 text-right text-red-400">${comparisonData.final._401k.taxPaid.toLocaleString()}</td>
                                        <td className="p-2 text-right text-amber-300 font-bold">${comparisonData.final._401k.afterTax.toLocaleString()}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>

                    {/* Table 3: Contribution Analysis */}
                    <Card className="border-slate-700/50 bg-slate-800/30">
                        <CardHeader>
                            <CardTitle className="text-sm text-slate-300">3. Contribution Analysis</CardTitle>
                        </CardHeader>
                        <CardContent className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-slate-700">
                                        <th className="text-left p-2 text-slate-400">Vehicle</th>
                                        <th className="text-right p-2 text-slate-400">Total Contributed</th>
                                        <th className="text-right p-2 text-slate-400">Growth (After-Tax)</th>
                                        <th className="text-right p-2 text-slate-400">Multiplier</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-slate-800">
                                        <td className="p-2 text-green-400">IUL</td>
                                        <td className="p-2 text-right text-slate-300">${comparisonData.totalContributed.iul.toLocaleString()}</td>
                                        <td className="p-2 text-right text-green-300">${(comparisonData.final.iul.afterTax - comparisonData.totalContributed.iul).toLocaleString()}</td>
                                        <td className="p-2 text-right text-slate-300">{(comparisonData.final.iul.afterTax / comparisonData.totalContributed.iul || 0).toFixed(2)}x</td>
                                    </tr>
                                    <tr className="border-b border-slate-800">
                                        <td className="p-2 text-blue-400">Taxable</td>
                                        <td className="p-2 text-right text-slate-300">${comparisonData.totalContributed.taxable.toLocaleString()}</td>
                                        <td className="p-2 text-right text-blue-300">${(comparisonData.final.taxable.afterTax - comparisonData.totalContributed.taxable).toLocaleString()}</td>
                                        <td className="p-2 text-right text-slate-300">{(comparisonData.final.taxable.afterTax / comparisonData.totalContributed.taxable || 0).toFixed(2)}x</td>
                                    </tr>
                                    <tr className="border-b border-slate-800">
                                        <td className="p-2 text-purple-400">Roth IRA</td>
                                        <td className="p-2 text-right text-slate-300">${comparisonData.totalContributed.roth.toLocaleString()}</td>
                                        <td className="p-2 text-right text-purple-300">${(comparisonData.final.roth.afterTax - comparisonData.totalContributed.roth).toLocaleString()}</td>
                                        <td className="p-2 text-right text-slate-300">{(comparisonData.final.roth.afterTax / comparisonData.totalContributed.roth || 0).toFixed(2)}x</td>
                                    </tr>
                                    <tr className="border-b border-slate-800">
                                        <td className="p-2 text-amber-400">401(k)</td>
                                        <td className="p-2 text-right text-slate-300">${(comparisonData.totalContributed._401k + comparisonData.totalContributed.employerMatch).toLocaleString()}</td>
                                        <td className="p-2 text-right text-amber-300">${(comparisonData.final._401k.afterTax - (comparisonData.totalContributed._401k + comparisonData.totalContributed.employerMatch)).toLocaleString()}</td>
                                        <td className="p-2 text-right text-slate-300">{(comparisonData.final._401k.afterTax / (comparisonData.totalContributed._401k + comparisonData.totalContributed.employerMatch) || 0).toFixed(2)}x</td>
                                    </tr>
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>

                    {/* Table 4: Tax Metrics */}
                    <Card className="border-slate-700/50 bg-slate-800/30">
                        <CardHeader>
                            <CardTitle className="text-sm text-slate-300">4. Key Tax Metrics Used</CardTitle>
                        </CardHeader>
                        <CardContent className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <tbody>
                                    <tr className="border-b border-slate-800">
                                        <td className="p-2 text-slate-400">Effective Current Tax Rate (Fed + State)</td>
                                        <td className="p-2 text-right text-slate-300">{comparisonData.metrics.effectiveTaxRate}%</td>
                                    </tr>
                                    <tr className="border-b border-slate-800">
                                        <td className="p-2 text-slate-400">Effective Retirement Tax Rate</td>
                                        <td className="p-2 text-right text-slate-300">{comparisonData.metrics.effectiveRetirementTaxRate}%</td>
                                    </tr>
                                    <tr className="border-b border-slate-800">
                                        <td className="p-2 text-slate-400">Capital Gains Tax Rate</td>
                                        <td className="p-2 text-right text-slate-300">{capitalGainsTax + (includeStateTax ? stateTax : 0)}%</td>
                                    </tr>
                                    <tr className="border-b border-slate-800">
                                        <td className="p-2 text-slate-400">Annual Tax Drag (Taxable)</td>
                                        <td className="p-2 text-right text-slate-300">{taxDrag}%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>

                    {/* Table 5: Distribution Phase Projections */}
                    <Card className="border-slate-700/50 bg-slate-800/30">
                        <CardHeader>
                            <CardTitle className="text-sm text-slate-300">5. Distribution Phase Projections</CardTitle>
                        </CardHeader>
                        <CardContent className="overflow-x-auto max-h-[300px] overflow-y-auto">
                            <table className="w-full text-xs">
                                <thead className="sticky top-0 bg-slate-800">
                                    <tr className="border-b border-slate-700">
                                        <th className="text-left p-2 text-slate-400">Age</th>
                                        <th className="text-right p-2 text-slate-400">Withdrawal</th>
                                        <th className="text-right p-2 text-green-400">IUL Bal</th>
                                        <th className="text-right p-2 text-blue-400">Taxable Bal</th>
                                        <th className="text-right p-2 text-purple-400">Roth Bal</th>
                                        <th className="text-right p-2 text-amber-400">401(k) Bal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {comparisonData.distributionData.map((row) => (
                                        <tr key={row.year} className="border-b border-slate-800 hover:bg-slate-800/50">
                                            <td className="p-2 text-slate-300">{row.age}</td>
                                            <td className="p-2 text-right text-slate-300">${row.withdrawal.toLocaleString()}</td>
                                            <td className="p-2 text-right text-green-300">${row.iul.toLocaleString()}</td>
                                            <td className="p-2 text-right text-blue-300">${row.taxable.toLocaleString()}</td>
                                            <td className="p-2 text-right text-purple-300">${row.roth.toLocaleString()}</td>
                                            <td className="p-2 text-right text-amber-300">${row._401k.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>

                    {/* Table 6: Historical Scenarios (Dummy) */}
                    <Card className="border-slate-700/50 bg-slate-800/30">
                        <CardHeader>
                            <CardTitle className="text-sm text-slate-300">6. Stress Test Scenarios (Preview)</CardTitle>
                        </CardHeader>
                        <CardContent className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-slate-700">
                                        <th className="text-left p-3 text-slate-400">Scenario</th>
                                        <th className="text-center p-3 text-green-400">IUL</th>
                                        <th className="text-center p-3 text-blue-400">Taxable</th>
                                        <th className="text-center p-3 text-purple-400">Roth IRA</th>
                                        <th className="text-center p-3 text-amber-400">401(k)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-slate-800">
                                        <td className="p-3 text-slate-300 font-medium">Base Case</td>
                                        <td className="p-3 text-center text-green-300">${comparisonData.final.iul.afterTax.toLocaleString()}</td>
                                        <td className="p-3 text-center text-blue-300">${comparisonData.final.taxable.afterTax.toLocaleString()}</td>
                                        <td className="p-3 text-center text-purple-300">${comparisonData.final.roth.afterTax.toLocaleString()}</td>
                                        <td className="p-3 text-center text-amber-300">${comparisonData.final._401k.afterTax.toLocaleString()}</td>
                                    </tr>
                                    {renderDummyRows(4)}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>

                </TabsContent>

                {/* Feature Comparison Table */}
                <TabsContent value="features" className="space-y-4">
                    <Card className="border-slate-700/50 bg-slate-800/30">
                    <CardHeader>
                        <CardTitle className="text-lg text-white">Feature-by-Feature Comparison</CardTitle>
                        <p className="text-sm text-slate-400">
                        Each savings vehicle has unique characteristics. This table compares key features
                        for educational purposes.
                        </p>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <table className="w-full text-xs">
                        <thead>
                            <tr className="border-b border-slate-700">
                            <th className="text-left p-3 text-slate-400">Feature</th>
                            <th className="text-center p-3 text-green-400">IUL</th>
                            <th className="text-center p-3 text-blue-400">Taxable</th>
                            <th className="text-center p-3 text-purple-400">Roth IRA</th>
                            <th className="text-center p-3 text-amber-400">401(k)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[
                            { feature: "Contribution Limits", iul: "None*", taxable: "None", roth: "$7,000/yr", _401k: "$23,500/yr" },
                            { feature: "Tax on Growth", iul: "Tax-deferred", taxable: "Annual tax drag", roth: "Tax-free", _401k: "Tax-deferred" },
                            { feature: "Tax on Distribution", iul: "Tax-free loans†", taxable: "Capital gains", roth: "Tax-free‡", _401k: "Ordinary income" },
                            { feature: "Death Benefit", iul: "Yes (income tax-free)", taxable: "Step-up basis", roth: "Tax-free to heirs", _401k: "Taxable to heirs" },
                            { feature: "Downside Protection", iul: "0% floor", taxable: "None", roth: "None", _401k: "None" },
                            { feature: "Early Access Penalty", iul: "Surrender charges", taxable: "None", roth: "10% before 59½", _401k: "10% before 59½" },
                            { feature: "Required Min. Dist.", iul: "None", taxable: "None", roth: "None (2024+)", _401k: "Age 73" },
                            { feature: "Creditor Protection", iul: "Varies by state", taxable: "Limited", roth: "ERISA protected", _401k: "ERISA protected" },
                            ].map((row) => (
                            <tr key={row.feature} className="border-b border-slate-800 hover:bg-slate-800/50">
                                <td className="p-3 text-slate-300 font-medium">{row.feature}</td>
                                <td className="p-3 text-center text-green-300">{row.iul}</td>
                                <td className="p-3 text-center text-blue-300">{row.taxable}</td>
                                <td className="p-3 text-center text-purple-300">{row.roth}</td>
                                <td className="p-3 text-center text-amber-300">{row._401k}</td>
                            </tr>
                            ))}
                        </tbody>
                        </table>
                        <div className="mt-3 space-y-1 text-[10px] text-slate-600">
                        <p>* IUL premiums are limited by IRC 7702 MEC limits to maintain tax-advantaged status.</p>
                        <p>† Policy loans are tax-free as long as the policy remains in force and is not a MEC.</p>
                        <p>‡ Roth IRA distributions are tax-free after age 59½ and 5-year holding period.</p>
                        </div>
                    </CardContent>
                    </Card>
                </TabsContent>

                {/* Tax Education */}
                <TabsContent value="education" className="space-y-4">
                    <Card className="border-slate-700/50 bg-slate-800/30">
                    <CardHeader>
                        <CardTitle className="text-lg text-white flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-blue-400" />
                        Understanding Tax-Advantaged Growth
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-900/50 border border-slate-700/50 rounded-xl">
                            <h4 className="text-sm font-semibold text-white mb-2">Tax-Free vs. Tax-Deferred</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                            <strong className="text-green-400">Tax-free</strong> means you never pay tax on the growth
                            (Roth IRA, IUL policy loans). <strong className="text-amber-400">Tax-deferred</strong> means
                            you delay paying tax until distribution (401k, traditional IRA). The difference can be
                            significant, especially if tax rates increase in the future.
                            </p>
                        </div>
                        <div className="p-4 bg-slate-900/50 border border-slate-700/50 rounded-xl">
                            <h4 className="text-sm font-semibold text-white mb-2">The Power of Tax-Free Compounding</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                            When growth is not subject to annual taxation, the full amount compounds year after year.
                            In a taxable account, annual taxes on dividends and realized gains reduce the compounding base.
                            Over long periods, this "tax drag" can significantly reduce total accumulation.
                            </p>
                        </div>
                        <div className="p-4 bg-slate-900/50 border border-slate-700/50 rounded-xl">
                            <h4 className="text-sm font-semibold text-white mb-2">Contribution Limits Matter</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                            Roth IRAs ($7,000/yr) and 401(k)s ($23,500/yr) have strict annual limits. For high earners
                            who want to save more, IUL and taxable accounts offer unlimited contributions (IUL subject
                            to MEC limits). This is why comparing vehicles at the same contribution level can be misleading.
                            </p>
                        </div>
                        <div className="p-4 bg-slate-900/50 border border-slate-700/50 rounded-xl">
                            <h4 className="text-sm font-semibold text-white mb-2">No Single "Best" Vehicle</h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                            Each vehicle serves a different purpose. Most financial professionals recommend a diversified
                            approach using multiple vehicles. The optimal mix depends on income level, tax situation,
                            time horizon, risk tolerance, and estate planning goals.
                            </p>
                        </div>
                        </div>

                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                        <p className="text-xs text-blue-200/80 leading-relaxed">
                            <strong className="text-blue-300">Disclaimer:</strong> This comparison is for educational purposes
                            only and does not constitute financial, tax, or legal advice. Tax laws are complex and subject to
                            change. Individual circumstances vary significantly. Always consult with qualified professionals
                            before making financial decisions. Russell Capital Systems™ does not provide tax or legal advice.
                        </p>
                        </div>
                    </CardContent>
                    </Card>
                </TabsContent>
                </Tabs>
            </div>

            {/* Sidebar Summary */}
            <div className="space-y-6">
                <Card className="border-slate-700/50 bg-slate-800/50 sticky top-6">
                    <CardHeader>
                        <CardTitle className="text-md text-white">Summary Results</CardTitle>
                        <CardDescription className="text-xs">At age {currentAge + years}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[
                            { label: "IUL (Policy Loans)", key: "iul" as const, color: IUL_COLOR, icon: <Shield className="w-4 h-4" />, note: "No contribution limit" },
                            { label: "Taxable Brokerage", key: "taxable" as const, color: TAXABLE_COLOR, icon: <DollarSign className="w-4 h-4" />, note: "No contribution limit" },
                            { label: "Roth IRA", key: "roth" as const, color: ROTH_COLOR, icon: <Percent className="w-4 h-4" />, note: `$${(rothLimit).toLocaleString()}/yr limit` },
                            { label: "401(k)", key: "_401k" as const, color: _401K_COLOR, icon: <TrendingUp className="w-4 h-4" />, note: `$23,500/yr limit` },
                        ].map((v) => (
                            <div key={v.key} className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/50" style={{ borderLeftColor: v.color, borderLeftWidth: 4 }}>
                                <div className="flex items-center gap-2 mb-2">
                                    <span style={{ color: v.color }}>{v.icon}</span>
                                    <h4 className="text-xs font-semibold text-white">{v.label}</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <p className="text-[10px] text-slate-500">Gross Value</p>
                                        <p className="text-sm font-bold text-white">${comparisonData.final[v.key].gross.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-slate-500">After-Tax Value</p>
                                        <p className="text-sm font-bold" style={{ color: v.color }}>${comparisonData.final[v.key].afterTax.toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between items-center">
                                    <p className="text-[10px] text-slate-500">Est. Tax at Distribution</p>
                                    <p className="text-[11px] font-medium text-red-400">
                                        {comparisonData.final[v.key].taxPaid > 0 ? `-$${comparisonData.final[v.key].taxPaid.toLocaleString()}` : "$0"}
                                    </p>
                                </div>
                            </div>
                        ))}

                        <div className="pt-4 border-t border-slate-700/50">
                            <p className="text-[10px] text-slate-600 italic">
                            * All values are hypothetical. IUL values assume {iulCreditRate}% credited rate (not guaranteed) with
                            approximate policy charges. Market-based vehicles assume {taxableReturnRate}% annual return (not guaranteed).
                            Contribution limits based on IRS limits.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>

        <NAICDisclaimer variant="footer" showsProjections showsCashValues showsPolicyLoans />
      </div>
      <PageInsights pageId="tax-advantaged-growth" />
    
        <ComplianceFooter pageName="TaxAdvantagedGrowth" showsIUL showsTax showsEstate showsProjections showsHistoricalData showsPolicyLoans />
      </AppShell>
  );
}
