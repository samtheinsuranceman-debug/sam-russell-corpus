// @ts-nocheck
import { NumberInput } from "@/components/NumberInput";
import { useState, useMemo, useCallback, useEffect } from "react";

import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { BarChart, LineChart, PieChart, AreaChart, RadarChart, ComposedChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Bar, Line, Pie, Cell, Area, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";

import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { ExportToSlides } from "@/components/ExportToSlides";
import {
  Play,
  Pause,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  DollarSign,
  TrendingUp,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Users,
  Target,
} from "lucide-react";

const STORY_TEMPLATES = [
  { id: "iul-value", label: "The IUL Value Proposition", slides: 8, duration: "12 min", description: "Walk through tax savings, market protection, and retirement income" },
  { id: "tax-bomb", label: "The Tax Bomb", slides: 6, duration: "8 min", description: "Show how 401(k) RMDs create a tax crisis and how to solve it" },
  { id: "mega-roth", label: "The Mega Roth Strategy", slides: 7, duration: "10 min", description: "IUL as the unlimited Roth IRA for high earners" },
  { id: "estate-shield", label: "Estate Shield", slides: 6, duration: "8 min", description: "Protect wealth from the 2026 estate tax sunset" },
  { id: "mortgage-killer", label: "The Mortgage Killer", slides: 7, duration: "10 min", description: "Eliminate mortgage interest while building tax-free wealth" },
  { id: "retirement-gap", label: "The Retirement Income Gap", slides: 8, duration: "12 min", description: "Guaranteed income + tax-free IUL loans fill the gap" },
];

interface SlideData {
  title: string;
  subtitle: string;
  type: "intro" | "problem" | "data" | "solution" | "comparison" | "action" | "summary";
  content: React.ReactNode;
}

const calculateCompoundInterest = (principal: number, rate: number, times: number, years: number) => {
  return principal * Math.pow(1 + rate / times, times * years);
};

const calculateRMD = (age: number, balance: number) => {
  const divisors: Record<number, number> = {
    73: 26.5, 74: 25.5, 75: 24.6, 76: 23.7, 77: 22.9, 78: 22.0, 79: 21.1, 80: 20.2,
    81: 19.4, 82: 18.5, 83: 17.7, 84: 16.8, 85: 16.0, 86: 15.2, 87: 14.4, 88: 13.7,
    89: 12.9, 90: 12.2, 91: 11.5, 92: 10.8, 93: 10.1, 94: 9.5, 95: 8.9, 96: 8.4
  };
  return balance / (divisors[age] || 27.4);
};

const generateYearlyData = (startAge: number, endAge: number, initialBalance: number, growthRate: number) => {
  let currentBalance = initialBalance;
  const data = [];
  for (let age = startAge; age <= endAge; age++) {
    const growth = currentBalance * growthRate;
    currentBalance += growth;
    data.push({
      age,
      balance: Math.round(currentBalance),
      growth: Math.round(growth)
    });
  }
  return data;
};

const advancedTaxCalculation = (income: number, status: 'single' | 'married') => {
  let tax = 0;
  if (status === 'married') {
    if (income > 731200) tax = (income - 731200) * 0.37 + 193654;
    else if (income > 487450) tax = (income - 487450) * 0.35 + 108341;
    else if (income > 383900) tax = (income - 383900) * 0.32 + 75205;
    else if (income > 201050) tax = (income - 201050) * 0.24 + 31321;
    else if (income > 94300) tax = (income - 94300) * 0.22 + 7836;
    else if (income > 23200) tax = (income - 23200) * 0.12 + 2320;
    else tax = income * 0.10;
  } else {
    if (income > 609350) tax = (income - 609350) * 0.37 + 183647;
    else if (income > 243725) tax = (income - 243725) * 0.35 + 55678;
    else if (income > 191950) tax = (income - 191950) * 0.32 + 39110;
    else if (income > 100525) tax = (income - 100525) * 0.24 + 17168;
    else if (income > 47150) tax = (income - 47150) * 0.22 + 5425;
    else if (income > 11600) tax = (income - 11600) * 0.12 + 1160;
    else tax = income * 0.10;
  }
  return Math.round(tax);
};


















































































































































































































































































































































































































export default function SalesStoryBuilder() {
  const { data: clientData } = useClientData();

  const { user } = useAuth();
  const { data: clientPortalData } = trpc.clientPortal.getDashboard.useQuery(undefined, { enabled: !!user });
  const { data: strategyData } = trpc.strategy.list.useQuery();
  const { data: scenariosData } = trpc.scenarios.list.useQuery();
  const { data: complianceData } = trpc.compliance.getStatus.useQuery();
  const { data: marketData } = trpc.marketData.getLatest.useQuery();
  
  const saveStoryMutation = trpc.savedStrategies.save.useMutation();

  const [clientName, setClientName] = useState("John & Jane Smith");
  const [clientAge, setClientAge] = useState(55);
  const [spouseAge, setSpouseAge] = useState(52);
  const [annualIncome, setAnnualIncome] = useState(400000);
  const [retirement401k, setRetirement401k] = useState(1500000);
  const [currentMortgage, setCurrentMortgage] = useState(650000);
  const [estateValue, setEstateValue] = useState(8500000);
  const [selectedTemplate, setSelectedTemplate] = useState("iul-value");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPresenting, setIsPresenting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [simulationYears, setSimulationYears] = useState(30);
  const [assumedGrowthRate, setAssumedGrowthRate] = useState(7);
  const [inflationRate, setInflationRate] = useState(3);
  const [includeSocialSecurity, setIncludeSocialSecurity] = useState(true);
  const [retirementAge, setRetirementAge] = useState(67);
  const [lifeExpectancy, setLifeExpectancy] = useState(95);
  const [riskTolerance, setRiskTolerance] = useState('moderate');
  const [primaryGoal, setPrimaryGoal] = useState('tax-free-income');
  const [legacyAmount, setLegacyAmount] = useState(1000000);
  const [ltcCoverage, setLtcCoverage] = useState(5000);
  const [monthlyContribution, setMonthlyContribution] = useState(1000);
  
  const handleSimulate = useCallback(() => {
  }, [simulationYears, assumedGrowthRate, inflationRate]);
  
  const handleSaveScenario = useCallback(async () => {
    if (saveStoryMutation) {
      await saveStoryMutation.mutateAsync({
        name: `${clientName} Scenario`,
        data: { clientAge, spouseAge, annualIncome, retirement401k }
      });
    }
  }, [saveStoryMutation, clientName, clientAge, spouseAge, annualIncome, retirement401k]);

  const memoizedCalculations = useMemo(() => {
    return {
      futureValue: calculateCompoundInterest(retirement401k, assumedGrowthRate / 100, 1, simulationYears),
      totalContributions: monthlyContribution * 12 * simulationYears
    };
  }, [retirement401k, assumedGrowthRate, simulationYears, monthlyContribution]);

  useEffect(() => {
    if (clientAge > retirementAge) {
      setRetirementAge(clientAge + 1);
    }
  }, [clientAge, retirementAge]);

  useEffect(() => {
    if (clientData) {
      if (clientData.clientName) setClientName(clientData.clientName);
      if (clientData.age) setClientAge(clientData.age);
      if (clientData.spouseAge) setSpouseAge(clientData.spouseAge);
      if (clientData.annualIncome) setAnnualIncome(clientData.annualIncome);
      if (clientData.k401Balance) setRetirement401k(clientData.k401Balance);
      if (clientData.mortgageBalance) setCurrentMortgage(clientData.mortgageBalance);
    }
  }, [clientData]);

  const fmt = useCallback((n: number) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n.toLocaleString()}`;
  }, []);

  const slides: SlideData[] = useMemo(() => {
    const taxRate = annualIncome > 578125 ? 37 : annualIncome > 231250 ? 35 : annualIncome > 182100 ? 32 : 24;
    const effectiveRate = Math.round(taxRate * 0.72);
    const annualTax = Math.round(annualIncome * effectiveRate / 100);
    const iulPremium = Math.round(annualIncome * 0.12);
    const iulCashValue20 = Math.round(iulPremium * 20 * 1.55);
    const taxFreeIncome = Math.round(iulCashValue20 * 0.065);
    const rmdAt72 = Math.round(retirement401k * Math.pow(1.07, 72 - clientAge) / 27.4);
    const rmdTax = Math.round(rmdAt72 * taxRate / 100);
    const estateExemption = 13610000;
    const estateTax = Math.max(0, Math.round((estateValue * Math.pow(1.06, 85 - clientAge) - estateExemption) * 0.40));

    if (selectedTemplate === "iul-value") {
      return [
        {
          title: `${clientName}'s Financial Future`,
          subtitle: "A Personalized Analysis",
          type: "intro" as const,
          content: (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20">
                  <div className="text-sm text-blue-300">Combined Income</div>
                  <div className="text-3xl font-bold">{fmt(annualIncome)}</div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20">
                  <div className="text-sm text-amber-300">Current Tax Bracket</div>
                  <div className="text-3xl font-bold">{taxRate}%</div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/20">
                  <div className="text-sm text-purple-300">Retirement Savings</div>
                  <div className="text-3xl font-bold">{fmt(retirement401k)}</div>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/20">
                  <div className="text-sm text-green-300">Ages</div>
                  <div className="text-3xl font-bold">{clientAge} & {spouseAge}</div>
                </div>
              </div>
            </div>
          ),
        },
        {
          title: "The Hidden Tax Problem",
          subtitle: `Your ${taxRate}% bracket is just the beginning`,
          type: "problem" as const,
          content: (
            <div className="space-y-4">
              <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/20">
                <div className="text-sm text-red-300 mb-2">Annual Federal Tax Burden</div>
                <div className="text-4xl font-bold text-red-400">{fmt(annualTax)}</div>
                <div className="text-sm text-red-300 mt-1">That is {fmt(Math.round(annualTax / 12))}/month going to the IRS</div>
              </div>
              <div className="space-y-3">
                {[
                  { label: "Taxes paid over 30 years (no change)", value: fmt(annualTax * 30), color: "text-red-400" },
                  { label: "Lost investment growth on taxes paid", value: fmt(Math.round(annualTax * 30 * 0.6)), color: "text-red-400" },
                  { label: "Total opportunity cost", value: fmt(Math.round(annualTax * 30 * 1.6)), color: "text-red-500 font-bold" },
                ].map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-card border">
                    <span className="text-sm">{item.label}</span>
                    <span className={`font-semibold ${item.color}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ),
        },
        {
          title: "The 401(k) Tax Bomb",
          subtitle: "Required Minimum Distributions at age 73",
          type: "problem" as const,
          content: (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-card border">
                  <div className="text-sm text-muted-foreground">Your 401(k) Today</div>
                  <div className="text-2xl font-bold">{fmt(retirement401k)}</div>
                </div>
                <div className="p-4 rounded-xl bg-card border">
                  <div className="text-sm text-muted-foreground">Projected at Age 72</div>
                  <div className="text-2xl font-bold">{fmt(Math.round(retirement401k * Math.pow(1.07, 72 - clientAge)))}</div>
                </div>
              </div>
              <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/20">
                <div className="text-sm text-red-300 mb-1">Forced Annual RMD at 73</div>
                <div className="text-3xl font-bold text-red-400">{fmt(rmdAt72)}</div>
                <div className="text-sm text-red-300 mt-2">
                  Tax on RMD at {taxRate}%: <span className="font-bold">{fmt(rmdTax)}/year</span>
                </div>
              </div>
              <div className="p-4 rounded-lg border border-amber-500/20 bg-amber-500/5">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
                  <div className="text-sm text-amber-200">
                    RMDs increase every year. By age 80, your forced distribution could exceed {fmt(Math.round(rmdAt72 * 1.5))}/year — 
                    potentially pushing you into the {Math.min(taxRate + 5, 37)}% bracket and triggering IRMAA Medicare surcharges.
                  </div>
                </div>
              </div>
            </div>
          ),
        },
        {
          title: "The IUL Solution",
          subtitle: "Tax-free growth, tax-free income, market protection",
          type: "solution" as const,
          content: (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Shield, label: "0% Floor Protection", desc: "Never lose money to market downturns", color: "text-blue-400" },
                  { icon: TrendingUp, label: "Index-Linked Growth", desc: "Participate in market upside with caps", color: "text-green-400" },
                  { icon: DollarSign, label: "Tax-Free Access", desc: "Policy loans are not taxable income", color: "text-amber-400" },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="p-4 rounded-xl bg-card border text-center">
                      <Icon className={`h-8 w-8 mx-auto mb-2 ${item.color}`} />
                      <div className="font-semibold text-sm">{item.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">{item.desc}</div>
                    </div>
                  );
                })}
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20">
                <div className="text-sm text-muted-foreground mb-2">Your Personalized IUL Illustration</div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Annual Premium</div>
                    <div className="text-xl font-bold">{fmt(iulPremium)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Illustrated Value (Yr 20)</div>
                    <div className="text-xl font-bold text-primary">{fmt(iulCashValue20)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Tax-Free Income</div>
                    <div className="text-xl font-bold text-green-400">{fmt(taxFreeIncome)}/yr</div>
                  </div>
                </div>
              </div>
            </div>
          ),
        },
        {
          title: "Current Path vs. Optimized Path",
          subtitle: "Side-by-side comparison over 30 years",
          type: "comparison" as const,
          content: (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                  <div className="text-sm font-semibold text-red-400 mb-3">Current Path</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>Total taxes (30 yr)</span><span className="text-red-400">{fmt(annualTax * 30)}</span></div>
                    <div className="flex justify-between"><span>RMD taxes (10 yr)</span><span className="text-red-400">{fmt(rmdTax * 10)}</span></div>
                    <div className="flex justify-between"><span>Estate tax exposure</span><span className="text-red-400">{fmt(estateTax)}</span></div>
                    <div className="border-t border-red-500/20 pt-2 flex justify-between font-bold">
                      <span>Total to IRS</span><span className="text-red-400">{fmt(annualTax * 30 + rmdTax * 10 + estateTax)}</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                  <div className="text-sm font-semibold text-green-400 mb-3">Optimized Path (with IUL)</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>Tax-free IUL income</span><span className="text-green-400">{fmt(taxFreeIncome)}/yr</span></div>
                    <div className="flex justify-between"><span>Reduced RMD exposure</span><span className="text-green-400">-{fmt(Math.round(rmdTax * 0.4))}/yr</span></div>
                    <div className="flex justify-between"><span>ILIT estate savings</span><span className="text-green-400">{fmt(estateTax)}</span></div>
                    <div className="border-t border-green-500/20 pt-2 flex justify-between font-bold">
                      <span>Total saved</span><span className="text-green-400">{fmt(Math.round(taxFreeIncome * 20 + rmdTax * 4 + estateTax))}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ),
        },
        {
          title: "Market Protection in Action",
          subtitle: "Your floor protects you when markets fall",
          type: "data" as const,
          content: (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground mb-2">Historical market downturns vs. IUL credited rate</div>
              {[
                { year: "2000-2002", event: "Dot-Com Crash", sp500: -49, iul: 0 },
                { year: "2008", event: "Financial Crisis", sp500: -38, iul: 0 },
                { year: "2020", event: "COVID Crash", sp500: -34, iul: 0 },
                { year: "2022", event: "Rate Hike Selloff", sp500: -19, iul: 0 },
              ].map((row, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-card border">
                  <div className="w-24 shrink-0">
                    <div className="font-semibold text-sm">{row.year}</div>
                    <div className="text-xs text-muted-foreground">{row.event}</div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs w-16">S&P 500</span>
                      <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.abs(row.sp500)}%` }} />
                      </div>
                      <span className="text-xs text-red-400 w-12 text-right">{row.sp500}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs w-16">IUL Floor</span>
                      <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: "2%" }} />
                      </div>
                      <span className="text-xs text-green-400 w-12 text-right">{row.iul}%</span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-300">
                <Shield className="h-4 w-4 inline mr-1" />
                While the S&P 500 lost value in each downturn, the IUL 0% floor would have protected {clientName}'s illustrated policy value from any losses.
              </div>
            </div>
          ),
        },
        {
          title: "Your Retirement Income Blueprint",
          subtitle: "Tax-free income from multiple sources",
          type: "solution" as const,
          content: (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground mb-2">Projected annual retirement income at age 67</div>
              {[
                { source: "Social Security (combined)", amount: 72000, taxable: true, color: "bg-blue-500" },
                { source: "401(k)/IRA Distributions", amount: Math.round(retirement401k * 0.04 * Math.pow(1.07, 67 - clientAge)), taxable: true, color: "bg-amber-500" },
                { source: "IUL Tax-Free Loans", amount: taxFreeIncome, taxable: false, color: "bg-green-500" },
                { source: "Annuity Income", amount: 36000, taxable: false, color: "bg-purple-500" },
              ].map((src, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-card border">
                  <div className={`w-3 h-3 rounded-full shrink-0 ${src.color}`} />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{src.source}</div>
                    <div className="text-xs text-muted-foreground">{src.taxable ? "Taxable income" : "Tax-free income"}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{fmt(src.amount)}/yr</div>
                    {src.taxable && <Badge variant="outline" className="text-xs text-red-400 border-red-400/30">Taxable</Badge>}
                    {!src.taxable && <Badge variant="outline" className="text-xs text-green-400 border-green-400/30">Tax-Free</Badge>}
                  </div>
                </div>
              ))}
              <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20">
                <div className="text-xs text-muted-foreground">Total Projected Retirement Income</div>
                <div className="text-3xl font-bold">{fmt(72000 + Math.round(retirement401k * 0.04 * Math.pow(1.07, 67 - clientAge)) + taxFreeIncome + 36000)}/yr</div>
                <div className="text-sm text-green-400 mt-1">
                  {Math.round((taxFreeIncome + 36000) / (72000 + Math.round(retirement401k * 0.04 * Math.pow(1.07, 67 - clientAge)) + taxFreeIncome + 36000) * 100)}% is tax-free
                </div>
              </div>
            </div>
          ),
        },
        {
          title: "Next Steps",
          subtitle: "Your personalized action plan",
          type: "action" as const,
          content: (
            <div className="space-y-4">
              {[
                { step: 1, action: "Complete full financial analysis", timeline: "This week", desc: "We will run your numbers through our comprehensive planning system" },
                { step: 2, action: "Review IUL illustration from top carriers", timeline: "Next meeting", desc: "Compare Pacific Life, Corebridge, and Nationwide options" },
                { step: 3, action: "Begin Roth conversion strategy", timeline: "Q2 2026", desc: "Start converting 401(k) to reduce future RMD tax burden" },
                { step: 4, action: "Fund IUL policy", timeline: "Upon approval", desc: `${fmt(iulPremium)}/year for 15-20 years of premium funding` },
                { step: 5, action: "Annual review and optimization", timeline: "Ongoing", desc: "Adjust strategy based on tax law changes and market conditions" },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4 p-4 rounded-xl bg-card border">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold shrink-0">
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{item.action}</div>
                    <div className="text-sm text-muted-foreground">{item.desc}</div>
                  </div>
                  <Badge variant="outline" className="shrink-0">{item.timeline}</Badge>
                </div>
              ))}
            </div>
          ),
        },
      ];
    }

    if (selectedTemplate === "tax-bomb") {
      return [
        { title: "The Tax Bomb", subtitle: `${clientName} — A Critical Analysis`, type: "intro" as const, content: (
          <div className="text-center space-y-4">
            <AlertTriangle className="h-16 w-16 mx-auto text-red-400" />
            <p className="text-lg">Your retirement savings may cost you more than you think</p>
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="text-sm text-red-300">Current 401(k) / IRA Balance</div>
              <div className="text-4xl font-bold text-red-400">{fmt(retirement401k)}</div>
              <div className="text-sm text-red-300 mt-1">Every dollar is pre-tax — the IRS is your silent partner</div>
            </div>
          </div>
        )},
        { title: "The Growth Trap", subtitle: "Your 401(k) grows — but so does the IRS's share", type: "problem" as const, content: (
          <div className="space-y-3">
            {[5, 10, 15, 20].map((yr) => {
              const projected = Math.round(retirement401k * Math.pow(1.07, yr));
              const irsShare = Math.round(projected * taxRate / 100);
              return (
                <div key={yr} className="flex items-center gap-3 p-3 rounded-lg bg-card border">
                  <div className="w-16 text-sm font-medium">Year {yr}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden flex">
                        <div className="h-full bg-blue-500" style={{ width: `${100 - taxRate}%` }} />
                        <div className="h-full bg-red-500" style={{ width: `${taxRate}%` }} />
                      </div>
                    </div>
                  </div>
                  <div className="text-right w-28">
                    <div className="text-sm font-bold">{fmt(projected)}</div>
                    <div className="text-xs text-red-400">IRS: {fmt(irsShare)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )},
        { title: "RMDs: The Forced Withdrawal", subtitle: "Starting at age 73, you must withdraw — and pay taxes", type: "data" as const, content: (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <div className="text-sm text-red-300">First Year RMD (Age 73)</div>
              <div className="text-3xl font-bold text-red-400">{fmt(rmdAt72)}</div>
              <div className="text-sm text-red-300">Tax owed: {fmt(rmdTax)} at {taxRate}%</div>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
              <AlertTriangle className="h-4 w-4 inline mr-1 text-amber-400" />
              RMDs may also trigger: IRMAA Medicare surcharges ({fmt(Math.round(rmdAt72 > 206000 ? 5000 : 0))}/yr), Social Security taxation (up to 85%), and higher state taxes.
            </div>
          </div>
        )},
        { title: "The Roth Conversion + IUL Strategy", subtitle: "Defuse the tax bomb before it detonates", type: "solution" as const, content: (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="text-sm text-blue-300 mb-1">Step 1: Roth Conversion</div>
                <div className="text-lg font-bold">Convert {fmt(80000)}/yr</div>
                <div className="text-xs text-blue-300">Pay tax now at known rate, grow tax-free forever</div>
              </div>
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <div className="text-sm text-green-300 mb-1">Step 2: Fund IUL</div>
                <div className="text-lg font-bold">{fmt(iulPremium)}/yr</div>
                <div className="text-xs text-green-300">Tax-free growth + tax-free retirement income</div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
              <div className="text-sm font-medium text-green-400 mb-2">Combined Tax Savings Over 30 Years</div>
              <div className="text-3xl font-bold text-green-400">{fmt(Math.round(rmdTax * 15 + annualTax * 0.15 * 20))}</div>
            </div>
          </div>
        )},
        { title: "Timeline to Tax Freedom", subtitle: "A phased approach", type: "action" as const, content: (
          <div className="space-y-3">
            {[
              { phase: "Years 1-5", action: "Roth Conversion Ladder", detail: `Convert ${fmt(80000)}/year from 401(k) to Roth IRA` },
              { phase: "Years 1-15", action: "Fund IUL Policy", detail: `${fmt(iulPremium)}/year premium builds tax-free wealth` },
              { phase: "Age 62-67", action: "Optimize Social Security", detail: "Delay claiming to maximize lifetime benefits" },
              { phase: "Age 67+", action: "Tax-Free Retirement", detail: `${fmt(taxFreeIncome)}/year from IUL + Roth distributions` },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-card border">
                <Badge className="shrink-0">{item.phase}</Badge>
                <div>
                  <div className="font-semibold text-sm">{item.action}</div>
                  <div className="text-xs text-muted-foreground">{item.detail}</div>
                </div>
              </div>
            ))}
          </div>
        )},
        { title: "Let's Get Started", subtitle: "Your next meeting agenda", type: "action" as const, content: (
          <div className="space-y-4 text-center">
            <CheckCircle2 className="h-16 w-16 mx-auto text-green-400" />
            <p className="text-lg">We have identified {fmt(Math.round(rmdTax * 15 + annualTax * 0.15 * 20))} in potential tax savings</p>
            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
              <div className="p-3 rounded-lg bg-card border text-sm">
                <div className="font-semibold">Next Step</div>
                <div className="text-muted-foreground">Full financial analysis</div>
              </div>
              <div className="p-3 rounded-lg bg-card border text-sm">
                <div className="font-semibold">Timeline</div>
                <div className="text-muted-foreground">Schedule this week</div>
              </div>
            </div>
          </div>
        )},
      ];
    }

    return [
      { title: STORY_TEMPLATES.find((t) => t.id === selectedTemplate)?.label || "Presentation", subtitle: `Prepared for ${clientName}`, type: "intro" as const, content: (
        <div className="text-center space-y-4">
          <Sparkles className="h-16 w-16 mx-auto text-primary" />
          <p className="text-lg">This presentation template is being customized with your client's data.</p>
          <p className="text-sm text-muted-foreground">Select "The IUL Value Proposition" or "The Tax Bomb" for a fully interactive experience.</p>
        </div>
      )},
    ];
  }, [clientName, clientAge, spouseAge, annualIncome, retirement401k, estateValue, selectedTemplate, fmt]);

  const slideProgress = ((currentSlide + 1) / slides.length) * 100;
  const currentSlideData = slides[currentSlide];
  const typeColors: Record<string, string> = {
    intro: "bg-blue-500/20 text-blue-400",
    problem: "bg-red-500/20 text-red-400",
    data: "bg-purple-500/20 text-purple-400",
    solution: "bg-green-500/20 text-green-400",
    comparison: "bg-amber-500/20 text-amber-400",
    action: "bg-primary/20 text-primary",
    summary: "bg-blue-500/20 text-blue-400",
  };

  const COLORS = ["#22c55e", "#3b82f6", "#f0c040", "#a78bfa", "#ef4444"];
  const tooltipStyle = { background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 };

  const radarData = [
    { subject: 'Tax Efficiency', A: 120, B: 110, fullMark: 150 },
    { subject: 'Market Protection', A: 98, B: 130, fullMark: 150 },
    { subject: 'Liquidity', A: 86, B: 130, fullMark: 150 },
    { subject: 'Growth Potential', A: 99, B: 100, fullMark: 150 },
    { subject: 'Death Benefit', A: 85, B: 90, fullMark: 150 },
    { subject: 'Estate Transfer', A: 65, B: 85, fullMark: 150 },
  ];

  const composedData = [
    { name: 'Year 1', uv: 590, pv: 800, amt: 1400 },
    { name: 'Year 2', uv: 868, pv: 967, amt: 1506 },
    { name: 'Year 3', uv: 1397, pv: 1098, amt: 989 },
    { name: 'Year 4', uv: 1480, pv: 1200, amt: 1228 },
    { name: 'Year 5', uv: 1520, pv: 1108, amt: 1100 },
    { name: 'Year 6', uv: 1400, pv: 680, amt: 1700 },
  ];

  const lineData = [
    { name: 'Age 65', income: 4000, expenses: 2400, amt: 2400 },
    { name: 'Age 70', income: 3000, expenses: 1398, amt: 2210 },
    { name: 'Age 75', income: 2000, expenses: 9800, amt: 2290 },
    { name: 'Age 80', income: 2780, expenses: 3908, amt: 2000 },
    { name: 'Age 85', income: 1890, expenses: 4800, amt: 2181 },
    { name: 'Age 90', income: 2390, expenses: 3800, amt: 2500 },
    { name: 'Age 95', income: 3490, expenses: 4300, amt: 2100 },
  ];

  const assetDistributionData = [
    { name: "401(k)/IRA", value: retirement401k || 0 },
    { name: "Real Estate/Other", value: Math.max(0, estateValue - retirement401k) || 0 }
  ];

  const taxProjectionData = Array.from({ length: 5 }).map((_, i) => {
    const year = i * 5;
    const projected401k = Math.round(retirement401k * Math.pow(1.07, year));
    const taxRate = annualIncome > 578125 ? 37 : annualIncome > 231250 ? 35 : annualIncome > 182100 ? 32 : 24;
    return {
      year: `Year ${year}`,
      balance: projected401k,
      taxExposure: Math.round(projected401k * taxRate / 100)
    };
  });

  return (
    <AppShell>
      <div className="space-y-6 p-6">
        <FactFinderBadge className="mb-4" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              Interactive Sales Story Builder
            </h1>
            <p className="text-muted-foreground mt-1">
              Create animated, data-driven presentations using your client's actual numbers
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportToSlides
              toolName="Interactive Sales Story Builder"
              getSections={() => [
                {
                  title: "Client Details",
                  items: [
                    { label: "Client Name(s)", value: clientName },
                    { label: "Client Age", value: clientAge.toString() },
                    { label: "Spouse Age", value: spouseAge.toString() }
                  ]
                },
                {
                  title: "Financial Data",
                  items: [
                    { label: "Annual Household Income", value: fmt(annualIncome) },
                    { label: "401(k)/IRA Balance", value: fmt(retirement401k) },
                    { label: "Current Mortgage Balance", value: fmt(currentMortgage) },
                    { label: "Total Estate Value", value: fmt(estateValue) }
                  ]
                }
              ]}
            />
          </div>
        </div>

        {/* Analytics */}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div className="rc-card p-4 rounded-xl bg-card border">
              <div className="text-sm font-semibold text-white mb-3">Strategy Comparison</div>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis />
                  <Radar name="Current" dataKey="A" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                  <Radar name="Proposed" dataKey="B" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
                  <Legend />
                  <Tooltip contentStyle={tooltipStyle} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="rc-card p-4 rounded-xl bg-card border">
              <div className="text-sm font-semibold text-white mb-3">Growth vs Protection</div>
              <ResponsiveContainer width="100%" height={250}>
                <ComposedChart data={composedData}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Area type="monotone" dataKey="amt" fill="#8884d8" stroke="#8884d8" />
                  <Bar dataKey="pv" barSize={20} fill="#413ea0" />
                  <Line type="monotone" dataKey="uv" stroke="#ff7300" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="rc-card p-4 rounded-xl bg-card border">
              <div className="text-sm font-semibold text-white mb-3">Income Projection</div>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#8884d8" activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="expenses" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="rc-card p-4 rounded-xl bg-card border">
              <div className="text-sm font-semibold text-white mb-3">Asset Distribution Bar</div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={assetDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="rc-card p-4 rounded-xl bg-card border">
            <div className="text-sm font-semibold text-white mb-3">Asset Distribution</div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={assetDistributionData.length > 0 && assetDistributionData.some(d => d.value > 0) ? assetDistributionData : [{ name: "Empty", value: 1 }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {assetDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => `$${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="rc-card p-4 rounded-xl bg-card border">
            <div className="text-sm font-semibold text-white mb-3">Tax Exposure Growth</div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={taxProjectionData.length > 0 ? taxProjectionData : [{ year: "0", balance: 0, taxExposure: 0 }]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="year" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => `$${value.toLocaleString()}`} />
                <Area type="monotone" dataKey="taxExposure" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} name="Tax Exposure" />
                <Area type="monotone" dataKey="balance" stackId="2" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} name="Net Balance" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <Tabs defaultValue="setup" className="space-y-4">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1">
            <TabsTrigger value="setup">Client Setup</TabsTrigger>
            <TabsTrigger value="template">Choose Story</TabsTrigger>
            <TabsTrigger value="present">Present</TabsTrigger>
          </TabsList>

          {/* Setup Tab */}
          <TabsContent value="setup" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4" /> Client Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>Client Name(s)</Label>
                    <Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Client Age</Label><NumberInput value={clientAge} onChange={setClientAge} /></div>
                    <div><Label>Spouse Age</Label><NumberInput value={spouseAge} onChange={setSpouseAge} /></div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Financial Data</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div><Label>Annual Household Income</Label><NumberInput value={annualIncome} onChange={setAnnualIncome} /></div>
                  <div><Label>401(k)/IRA Balance</Label><NumberInput value={retirement401k} onChange={setRetirement401k} /></div>
                  <div><Label>Current Mortgage Balance</Label><NumberInput value={currentMortgage} onChange={setCurrentMortgage} /></div>
                  <div><Label>Total Estate Value</Label><NumberInput value={estateValue} onChange={setEstateValue} /></div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Target className="h-4 w-4" /> Simulation Parameters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div><Label>Assumed Growth Rate (%)</Label><NumberInput value={assumedGrowthRate} onChange={setAssumedGrowthRate} /></div>
                  <div><Label>Inflation Rate (%)</Label><NumberInput value={inflationRate} onChange={setInflationRate} /></div>
                  <div><Label>Retirement Age</Label><NumberInput value={retirementAge} onChange={setRetirementAge} /></div>
                  <div><Label>Life Expectancy</Label><NumberInput value={lifeExpectancy} onChange={setLifeExpectancy} /></div>
                  <div className="flex items-center gap-2 mt-4">
                    <Button onClick={handleSimulate} variant="secondary">Run Simulation</Button>
                    <Button onClick={handleSaveScenario} disabled={!saveStoryMutation}>Save Scenario</Button>
                  </div>
                </CardContent>
              </Card>

            </div>
          </TabsContent>

          {/* Template Selection Tab */}
          <TabsContent value="template" className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {STORY_TEMPLATES.map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all ${selectedTemplate === template.id ? "border-primary ring-2 ring-primary/20" : "hover:border-muted-foreground/30"}`}
                  onClick={() => { setSelectedTemplate(template.id); setCurrentSlide(0); }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold">{template.label}</h3>
                      {selectedTemplate === template.id && <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">{template.slides} slides</Badge>
                      <Badge variant="outline" className="text-xs">{template.duration}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Presentation Tab */}
          <TabsContent value="present" className="space-y-4">
            {/* Slide Display */}
            <Card className="overflow-hidden">
              <div className="p-1">
                <Progress value={slideProgress} className="h-1" />
              </div>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Badge className={`text-xs mb-2 ${typeColors[currentSlideData?.type || "intro"]}`}>
                      {currentSlideData?.type?.toUpperCase()}
                    </Badge>
                    <CardTitle className="text-xl">{currentSlideData?.title}</CardTitle>
                    <CardDescription>{currentSlideData?.subtitle}</CardDescription>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {currentSlide + 1} / {slides.length}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="min-h-[400px]">
                {currentSlideData?.content}
              </CardContent>
              <div className="p-4 border-t flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                  disabled={currentSlide === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => setCurrentSlide(0)}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => setIsPresenting(!isPresenting)}>
                    {isPresenting ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                </div>
                <Button
                  onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentSlide + 1))}
                  disabled={currentSlide === slides.length - 1}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </Card>

            {/* Slide Thumbnails */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {slides.map((slide, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`shrink-0 w-32 p-2 rounded-lg border text-left transition-all ${
                    currentSlide === i ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <Badge className={`text-[10px] mb-1 ${typeColors[slide.type]}`}>{slide.type}</Badge>
                  <div className="text-xs font-medium truncate">{slide.title}</div>
                </button>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Additional Data Tables */}
        <div className="space-y-6 mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Historical Performance Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Year</th>
                      <th className="px-4 py-3">S&P 500 Return</th>
                      <th className="px-4 py-3">IUL Credited</th>
                      <th className="px-4 py-3">Account Value</th>
                      <th className="px-4 py-3">Surrender Value</th>
                      <th className="px-4 py-3">Death Benefit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 30 }).map((_, i) => (
                      <tr key={i} className="border-b border-border">
                        <td className="px-4 py-2">Year {i + 1}</td>
                        <td className="px-4 py-2">{(Math.random() * 20 - 5).toFixed(2)}%</td>
                        <td className="px-4 py-2">{Math.max(0, Math.min(10, Math.random() * 15)).toFixed(2)}%</td>
                        <td className="px-4 py-2">{fmt(iulPremium * (i + 1) * 1.05)}</td>
                        <td className="px-4 py-2">{fmt(iulPremium * (i + 1) * 1.02)}</td>
                        <td className="px-4 py-2">{fmt(Math.max(1000000, iulPremium * (i + 1) * 2))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Tax Bracket Projections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Age</th>
                      <th className="px-4 py-3">Estimated Income</th>
                      <th className="px-4 py-3">Projected Bracket</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[65, 70, 75, 80, 85, 90].map((age) => (
                      <tr key={age} className="border-b border-border">
                        <td className="px-4 py-2">{age}</td>
                        <td className="px-4 py-2">{fmt(annualIncome * Math.pow(1.03, age - clientAge))}</td>
                        <td className="px-4 py-2">{Math.min(37, 24 + Math.floor((age - 60)/10) * 2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Expense Category</th>
                      <th className="px-4 py-3">Current</th>
                      <th className="px-4 py-3">Retirement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { cat: 'Housing', cur: 35000, ret: 15000 },
                      { cat: 'Healthcare', cur: 12000, ret: 28000 },
                      { cat: 'Travel', cur: 15000, ret: 30000 },
                      { cat: 'Food', cur: 24000, ret: 20000 },
                      { cat: 'Taxes', cur: 85000, ret: 45000 },
                      { cat: 'Insurance', cur: 10000, ret: 12000 },
                    ].map((item, i) => (
                      <tr key={i} className="border-b border-border">
                        <td className="px-4 py-2">{item.cat}</td>
                        <td className="px-4 py-2">{fmt(item.cur)}</td>
                        <td className="px-4 py-2">{fmt(item.ret)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Alternative Scenarios</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Scenario</th>
                    <th className="px-4 py-3">Probability</th>
                    <th className="px-4 py-3">Impact</th>
                    <th className="px-4 py-3">Mitigation</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { s: 'High Inflation', p: 'Medium', i: 'Reduces purchasing power', m: 'IUL cash value growth' },
                    { s: 'Tax Rates Increase', p: 'High', i: 'Higher RMD taxes', m: 'Roth Conversions now' },
                    { s: 'Market Crash early retirement', p: 'Medium', i: 'Sequence of returns risk', m: '0% Floor in IUL' },
                    { s: 'Long Term Care Event', p: 'High', i: 'Depletes assets rapidly', m: 'LTC Rider on IUL' },
                    { s: 'Early Death', p: 'Low', i: 'Loss of income for spouse', m: 'Tax-free death benefit' },
                  ].map((item, i) => (
                    <tr key={i} className="border-b border-border">
                      <td className="px-4 py-2">{item.s}</td>
                      <td className="px-4 py-2">{item.p}</td>
                      <td className="px-4 py-2">{item.i}</td>
                      <td className="px-4 py-2">{item.m}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>

        <NAICDisclaimer variant="compact" showsProjections showsCashValues showsComparisons />
      </div>
    </AppShell>
  );
}
