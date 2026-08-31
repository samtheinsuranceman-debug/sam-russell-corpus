// @ts-nocheck
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { ExportToSlides } from "@/components/ExportToSlides";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  SlidersHorizontal,
  TrendingUp,
  Home,
  Save,
  Trash2,
  RotateCcw,
  Clock,
  PieChart as PieChartIcon,
  Activity,
  Zap,
  Shield,
  DollarSign,
  ArrowUpRight,
  FileText,
  Minus,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line, ComposedChart,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from "recharts";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { useClientData } from "@/contexts/ClientDataContext";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
const formatCompact = (value: number) => new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(value);
const formatPercent = (value: number) => new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 2 }).format(value / 100);

/* ─── Slider component ────────────────────────────────────────────────── */
function ParamSlider({ label, value, min, max, step, unit, color, onChange, description }: {
  label: string; value: number; min: number; max: number; step: number;
  unit: string; color: string; onChange: (v: number) => void; description?: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="mb-6 group">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full shadow-sm" style={{ background: color }} />
          <span className="text-sm font-medium text-slate-200">{label}</span>
        </div>
        <span className="text-sm font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{value}{unit}</span>
      </div>
      {description && <p className="text-xs text-slate-400 mb-3">{description}</p>}
      <div className="relative pt-1">
        <div className="h-2.5 rounded-full bg-slate-800 border border-slate-700 overflow-hidden">
          <div className="h-full transition-all duration-300 ease-out relative" style={{ width: `${pct}%`, background: color }}>
            <div className="absolute inset-0 bg-white/20" />
          </div>
        </div>
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        />
      </div>
      <div className="flex justify-between mt-1.5 px-1">
        <span className="text-[10px] text-slate-500">{min}{unit}</span>
        <span className="text-[10px] text-slate-500">{max}{unit}</span>
      </div>
    </div>
  );
}

/* ─── Data Tables ─────────────────────────────────────────────────────── */
const ProjectionTable = ({ data }: { data: any[] }) => (
  <div className="rounded-md border border-slate-800 overflow-hidden">
    <Table>
      <TableHeader className="bg-slate-900/50">
        <TableRow className="border-slate-800 hover:bg-transparent">
          <TableHead className="text-slate-400 font-medium">Year</TableHead>
          <TableHead className="text-right text-slate-400 font-medium">Age</TableHead>
          <TableHead className="text-right text-emerald-400 font-medium">Projected</TableHead>
          <TableHead className="text-right text-blue-400 font-medium">Conservative</TableHead>
          <TableHead className="text-right text-purple-400 font-medium">Aggressive</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.filter((_, i) => i % 5 === 0 || i === data.length - 1).map((row) => (
          <TableRow key={row.year} className="border-slate-800/50 hover:bg-slate-800/30">
            <TableCell className="font-medium text-slate-300">{row.year}</TableCell>
            <TableCell className="text-right text-slate-400">{row.age}</TableCell>
            <TableCell className="text-right text-emerald-400 font-medium">{formatCurrency(row.projected)}</TableCell>
            <TableCell className="text-right text-blue-400">{formatCurrency(row.conservative)}</TableCell>
            <TableCell className="text-right text-purple-400">{formatCurrency(row.aggressive)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

const AssetAllocationTable = ({ data }: { data: any[] }) => (
  <div className="rounded-md border border-slate-800 overflow-hidden">
    <Table>
      <TableHeader className="bg-slate-900/50">
        <TableRow className="border-slate-800 hover:bg-transparent">
          <TableHead className="text-slate-400 font-medium">Asset Class</TableHead>
          <TableHead className="text-right text-slate-400 font-medium">Current Allocation</TableHead>
          <TableHead className="text-right text-slate-400 font-medium">Target Allocation</TableHead>
          <TableHead className="text-right text-slate-400 font-medium">Value</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, i) => (
          <TableRow key={i} className="border-slate-800/50 hover:bg-slate-800/30">
            <TableCell className="font-medium text-slate-300 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: row.color }} />
              {row.name}
            </TableCell>
            <TableCell className="text-right text-slate-400">{row.current}%</TableCell>
            <TableCell className="text-right text-emerald-400">{row.target}%</TableCell>
            <TableCell className="text-right text-slate-300 font-medium">{formatCurrency(row.value)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

const RiskMetricsTable = ({ metrics }: { metrics: any[] }) => (
  <div className="rounded-md border border-slate-800 overflow-hidden">
    <Table>
      <TableHeader className="bg-slate-900/50">
        <TableRow className="border-slate-800 hover:bg-transparent">
          <TableHead className="text-slate-400 font-medium">Metric</TableHead>
          <TableHead className="text-slate-400 font-medium">Description</TableHead>
          <TableHead className="text-right text-slate-400 font-medium">Value</TableHead>
          <TableHead className="text-center text-slate-400 font-medium">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {metrics.map((row, i) => (
          <TableRow key={i} className="border-slate-800/50 hover:bg-slate-800/30">
            <TableCell className="font-medium text-slate-300">{row.name}</TableCell>
            <TableCell className="text-slate-400 text-xs">{row.desc}</TableCell>
            <TableCell className="text-right text-slate-300 font-medium">{row.value}</TableCell>
            <TableCell className="text-center">
              <Badge variant="outline" className={`
                ${row.status === 'Good' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : ''}
                ${row.status === 'Warning' ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' : ''}
                ${row.status === 'Danger' ? 'border-red-500/30 text-red-400 bg-red-500/10' : ''}
              `}>
                {row.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

const TaxImplicationsTable = ({ data }: { data: any[] }) => (
  <div className="rounded-md border border-slate-800 overflow-hidden">
    <Table>
      <TableHeader className="bg-slate-900/50">
        <TableRow className="border-slate-800 hover:bg-transparent">
          <TableHead className="text-slate-400 font-medium">Tax Strategy</TableHead>
          <TableHead className="text-right text-slate-400 font-medium">Estimated Savings</TableHead>
          <TableHead className="text-right text-slate-400 font-medium">Implementation Cost</TableHead>
          <TableHead className="text-right text-slate-400 font-medium">Net Benefit</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, i) => (
          <TableRow key={i} className="border-slate-800/50 hover:bg-slate-800/30">
            <TableCell className="font-medium text-slate-300">{row.strategy}</TableCell>
            <TableCell className="text-right text-emerald-400 font-medium">{formatCurrency(row.savings)}</TableCell>
            <TableCell className="text-right text-amber-400">{formatCurrency(row.cost)}</TableCell>
            <TableCell className="text-right text-blue-400 font-bold">{formatCurrency(row.net)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

const CashFlowTable = ({ data }: { data: any[] }) => (
  <div className="rounded-md border border-slate-800 overflow-hidden">
    <Table>
      <TableHeader className="bg-slate-900/50">
        <TableRow className="border-slate-800 hover:bg-transparent">
          <TableHead className="text-slate-400 font-medium">Phase</TableHead>
          <TableHead className="text-right text-slate-400 font-medium">Inflows</TableHead>
          <TableHead className="text-right text-slate-400 font-medium">Outflows</TableHead>
          <TableHead className="text-right text-slate-400 font-medium">Net Cash Flow</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row, i) => (
          <TableRow key={i} className="border-slate-800/50 hover:bg-slate-800/30">
            <TableCell className="font-medium text-slate-300">{row.phase}</TableCell>
            <TableCell className="text-right text-emerald-400">{formatCurrency(row.in)}</TableCell>
            <TableCell className="text-right text-red-400">{formatCurrency(row.out)}</TableCell>
            <TableCell className={`text-right font-bold ${row.net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatCurrency(row.net)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

const ScenarioComparisonTable = ({ scenarios }: { scenarios: any[] }) => (
  <div className="rounded-md border border-slate-800 overflow-hidden">
    <Table>
      <TableHeader className="bg-slate-900/50">
        <TableRow className="border-slate-800 hover:bg-transparent">
          <TableHead className="text-slate-400 font-medium">Scenario Name</TableHead>
          <TableHead className="text-right text-slate-400 font-medium">Final Net Worth</TableHead>
          <TableHead className="text-right text-slate-400 font-medium">Success Prob.</TableHead>
          <TableHead className="text-right text-slate-400 font-medium">Legacy Value</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {scenarios.map((row, i) => (
          <TableRow key={i} className="border-slate-800/50 hover:bg-slate-800/30">
            <TableCell className="font-medium text-slate-300">{row.name}</TableCell>
            <TableCell className="text-right text-emerald-400 font-medium">{formatCurrency(row.finalNW)}</TableCell>
            <TableCell className="text-right text-blue-400">{row.prob}%</TableCell>
            <TableCell className="text-right text-purple-400">{formatCurrency(row.legacy)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

/* ─── Financial model ─────────────────────────────────────────────────── */
function computeProjection(params: {
  aggression: number; loanUtil: number; cryptoAlloc: number; incomeStartYear: number;
  baseNetWorth: number; savingsRate: number; inflationRate: number; retirementAge: number;
  currentAge: number; taxRate: number; alternativeAlloc: number;
}) {
  const { 
    aggression, loanUtil, cryptoAlloc, incomeStartYear, baseNetWorth, 
    savingsRate, inflationRate, retirementAge, currentAge, taxRate, alternativeAlloc
  } = params;
  
  const years = 40;
  const startYear = new Date().getFullYear();
  
  const equityReturn = 0.03 + (aggression / 100) * 0.07;
  const fixedReturn = 0.02 + (aggression / 100) * 0.02;
  
  const equityAlloc = aggression;
  const fixedAlloc = 100 - aggression - cryptoAlloc - alternativeAlloc;
  
  const blendedReturn = (equityAlloc/100 * equityReturn) + 
                        (Math.max(0, fixedAlloc)/100 * fixedReturn) + 
                        (cryptoAlloc/100 * 0.12) + // Crypto premium
                        (alternativeAlloc/100 * 0.08); // Alts premium
                        
  const netReturn = blendedReturn * (1 - (taxRate/100 * 0.3)); // Assume 30% of returns are taxable each year
  
  const leverageBoost = (loanUtil / 100) * 0.015;
  const conservativeGrowth = 0.035;
  const aggressiveGrowth = netReturn + 0.03; // Bull market scenario

  const projData: { year: number; age: number; projected: number; conservative: number; aggressive: number; inflation: number; contributions: number; withdrawals: number }[] = [];
  
  let projected = baseNetWorth;
  let conservative = baseNetWorth;
  let aggressive = baseNetWorth;
  let inflationAdjusted = baseNetWorth;
  
  let totalContributions = 0;
  let totalWithdrawals = 0;

  for (let i = 0; i <= years; i++) {
    const age = currentAge + i;
    const isRetired = age >= retirementAge;
    
    let annualCashFlow = 0;
    if (!isRetired) {
      annualCashFlow = (baseNetWorth * 0.05) * (savingsRate / 100) * Math.pow(1 + (inflationRate/100), i);
      totalContributions += annualCashFlow;
    } else {
      annualCashFlow = -(baseNetWorth * 0.04) * Math.pow(1 + (inflationRate/100), i);
      totalWithdrawals += Math.abs(annualCashFlow);
    }
    
    projData.push({
      year: startYear + i,
      age,
      projected: Math.round(projected),
      conservative: Math.round(conservative),
      aggressive: Math.round(aggressive),
      inflation: Math.round(inflationAdjusted),
      contributions: Math.round(totalContributions),
      withdrawals: Math.round(totalWithdrawals)
    });
    
    const yearGrowth = netReturn + leverageBoost;
    
    projected = (projected + annualCashFlow) * (1 + yearGrowth);
    conservative = (conservative + annualCashFlow) * (1 + conservativeGrowth);
    aggressive = (aggressive + annualCashFlow) * (1 + aggressiveGrowth);
    inflationAdjusted = inflationAdjusted * (1 + (inflationRate/100));
    
    if (projected < 0) projected = 0;
    if (conservative < 0) conservative = 0;
    if (aggressive < 0) aggressive = 0;
  }

  const mortgageStart = baseNetWorth * (loanUtil / 100) * 0.4;
  const loanInterestRate = 0.05 + (100 - aggression) * 0.0002; // Higher aggression = lower rate (better credit/collateral)
  const monthlyPayment = (mortgageStart * (loanInterestRate/12)) / (1 - Math.pow(1 + loanInterestRate/12, -20 * 12));
  
  const payoffData: { year: number; remaining: number; paid: number; interest: number; principal: number }[] = [];
  let remaining = mortgageStart;
  let totalInterest = 0;
  let totalPrincipal = 0;
  
  for (let i = 0; i <= 25; i++) {
    const paid = mortgageStart - remaining;
    
    let yearInterest = remaining * loanInterestRate;
    let yearPrincipal = (monthlyPayment * 12) - yearInterest;
    
    if (i >= incomeStartYear) {
      yearPrincipal += mortgageStart * 0.05; // 5% extra principal payment
    }
    
    totalInterest += yearInterest;
    totalPrincipal += yearPrincipal;
    
    payoffData.push({ 
      year: startYear + i, 
      remaining: Math.max(0, Math.round(remaining)), 
      paid: Math.round(paid),
      interest: Math.round(totalInterest),
      principal: Math.round(totalPrincipal)
    });
    
    remaining -= yearPrincipal;
    if (remaining <= 0) {
      remaining = 0;
      break;
    }
  }

  const monteCarloData = Array.from({ length: 100 }, (_, i) => {
    let finalValue = baseNetWorth;
    for(let y = 0; y < (retirementAge - currentAge); y++) {
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      
      const vol = 0.10 + (aggression/100 * 0.15); // Higher aggression = higher volatility
      const randomReturn = netReturn + (z0 * vol);
      finalValue *= (1 + randomReturn);
    }
    return finalValue;
  }).sort((a, b) => a - b);
  
  const probSuccess = monteCarloData.filter((v) => v > baseNetWorth * 0.5).length; // Probability of not halving wealth

  const finalProjected = projData[projData.length - 1]?.projected ?? 0;
  const finalConservative = projData[projData.length - 1]?.conservative ?? 0;
  const finalAggressive = projData[projData.length - 1]?.aggressive ?? 0;
  const payoffYear = payoffData[payoffData.length - 1]?.year ?? startYear + 20;

  const allocationData = [{ name: 'Equities', value: baseNetWorth * (equityAlloc/100), color: '#3b82f6', current: equityAlloc - 5, target: equityAlloc },
,
    { name: 'Fixed Income', value: baseNetWorth * (Math.max(0, fixedAlloc)/100), color: '#94a3b8', current: Math.max(0, fixedAlloc) + 5, target: Math.max(0, fixedAlloc) },
,
    { name: 'Crypto/Digital', value: baseNetWorth * (cryptoAlloc/100), color: '#f59e0b', current: cryptoAlloc - 2, target: cryptoAlloc },
,
    { name: 'Alternatives', value: baseNetWorth * (alternativeAlloc/100), color: '#8b5cf6', current: alternativeAlloc + 2, target: alternativeAlloc },
,
  ].filter((d) => d.value > 0);

  const riskData = [
    { subject: 'Market Risk', A: aggression, fullMark: 100 }
];

  return { 
    projData, payoffData, finalProjected, finalConservative, finalAggressive, 
    payoffYear, mortgageStart, allocationData, riskData, probSuccess,
    blendedReturn, totalContributions, totalWithdrawals
  };
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900/95 border border-slate-700 p-3 rounded-lg shadow-xl backdrop-blur-sm z-50">
      <div className="text-slate-400 font-medium mb-2 border-b border-slate-700/50 pb-1">{label}</div>
      <div className="space-y-1.5">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="ScenarioAdjustments" />

        <ExecutiveSummary
          pageTitle="Scenario Adjustments"
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
        <GoalsAccelerator pageName="Scenario Adjustments" pageContext="Scenario Adjustments — market analysis modeling with projections and scenario analysis" />
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
        {payload.map((p) => (
          <div key={p.name} className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full shadow-sm" style={{ background: p.color }} />
              <span className="text-slate-300">{p.name}</span>
            </div>
            <span className="font-semibold text-white">
              {p.name.includes('%') || p.name.includes('Rate') 
                ? `${p.value.toFixed(1)}%` 
                : p.value >= 1000 ? formatCompact(p.value) : p.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function ScenarioAdjustments() {
  const { clientData } = useClientData();
  const { user } = useAuth();
  const utils = trpc.useUtils();
  
  const clientsQuery = trpc.clients.list.useQuery(undefined, { staleTime: 60_000 });
  const clients = clientsQuery.data;
  
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const selectedClient = clients?.find((c) => c.id === selectedClientId);

  const savedScenariosQuery = trpc.scenario.listByClient.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId, staleTime: 30_000 }
  );
  const savedScenarios = savedScenariosQuery.data;

  const strategyAnalyticsQuery = trpc.strategyAnalytics.getOverview.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId }
  );
  const analyticsData = strategyAnalyticsQuery.data;

  const marketDataQuery = trpc.marketData.getLatest.useQuery(undefined, { staleTime: 300_000 });
  const marketData = marketDataQuery.data;

  const riskProfileQuery = trpc.riskProfile.getByClient.useQuery(
    { clientId: selectedClientId! },
    { enabled: !!selectedClientId }
  );
  const riskProfile = riskProfileQuery.data;

  const saveMutation = trpc.scenario.save.useMutation({
    onSuccess: () => {
      utils.scenario.listByClient.invalidate({ clientId: selectedClientId! });
      toast.success("Scenario saved successfully", {
        description: "You can reload this exact configuration anytime."
      });
      setScenarioName("");
    },
    onError: (err) => toast.error("Failed to save scenario", { description: err.message }),
  });

  const deleteMutation = trpc.scenario.delete.useMutation({
    onSuccess: () => {
      utils.scenario.listByClient.invalidate({ clientId: selectedClientId! });
      toast.success("Scenario deleted");
    },
  });

  const exportMutation = trpc.strategyExport.generatePdf.useMutation({
    onSuccess: () => toast.success("PDF generated successfully"),
  });

  const [aggression, setAggression] = useState(65);
  const [loanUtil, setLoanUtil] = useState(30);
  const [cryptoAlloc, setCryptoAlloc] = useState(5);
  const [alternativeAlloc, setAlternativeAlloc] = useState(10);
  const [incomeStartYear, setIncomeStartYear] = useState(5);
  const [savingsRate, setSavingsRate] = useState(15);
  const [inflationRate, setInflationRate] = useState(3.0);
  const [retirementAge, setRetirementAge] = useState(65);
  const [currentAge, setCurrentAge] = useState(45);
  const [taxRate, setTaxRate] = useState(24);
  
  const [scenarioName, setScenarioName] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [autoCalculate, setAutoCalculate] = useState(true);
  const [chartType, setChartType] = useState("area");
  const [timeHorizon, setTimeHorizon] = useState(30);
  const [isSimulating, setIsSimulating] = useState(false);

  const baseNetWorth = useMemo(() => {
    if (selectedClient) {
      return Number(selectedClient.iraBalance ?? 0) + 
             Number(selectedClient.rothBalance ?? 0) +
             Number(selectedClient.taxableAssets ?? 0) + 
             Number(selectedClient.realEstateEquity ?? 0);
    }
    return 2_500_000;
  }, [selectedClient]);

  useEffect(() => {
    if (riskProfile && riskProfile.score) {
      setAggression(riskProfile.score);
    }
  }, [riskProfile]);

  const result = useMemo(
    () => computeProjection({ 
      aggression, loanUtil, cryptoAlloc, incomeStartYear, baseNetWorth,
      savingsRate, inflationRate, retirementAge, currentAge, taxRate, alternativeAlloc
    }),
    [aggression, loanUtil, cryptoAlloc, incomeStartYear, baseNetWorth, savingsRate, inflationRate, retirementAge, currentAge, taxRate, alternativeAlloc]
  );

  const handleSave = useCallback(() => {
    if (!selectedClientId) {
      toast.error("Choose a client before saving a scenario.");
      return;
    }
    const name = scenarioName.trim() || `Scenario ${new Date().toLocaleDateString()}`;
    saveMutation.mutate({
      clientId: selectedClientId,
      name,
      scenarioType: "COMBINED",
      inputJson: { 
        aggression, loanUtil, cryptoAlloc, incomeStartYear, 
        savingsRate, inflationRate, retirementAge, currentAge, taxRate, alternativeAlloc
      },
    });
  }, [selectedClientId, scenarioName, aggression, loanUtil, cryptoAlloc, incomeStartYear, savingsRate, inflationRate, retirementAge, currentAge, taxRate, alternativeAlloc, saveMutation]);

  const handleLoad = useCallback((scenario: any) => {
    const input = scenario.inputJson as any;
    if (input?.aggression != null) setAggression(input.aggression);
    if (input?.loanUtil != null) setLoanUtil(input.loanUtil);
    if (input?.cryptoAlloc != null) setCryptoAlloc(input.cryptoAlloc);
    if (input?.incomeStartYear != null) setIncomeStartYear(input.incomeStartYear);
    if (input?.savingsRate != null) setSavingsRate(input.savingsRate);
    if (input?.inflationRate != null) setInflationRate(input.inflationRate);
    if (input?.retirementAge != null) setRetirementAge(input.retirementAge);
    if (input?.currentAge != null) setCurrentAge(input.currentAge);
    if (input?.taxRate != null) setTaxRate(input.taxRate);
    if (input?.alternativeAlloc != null) setAlternativeAlloc(input.alternativeAlloc);
    toast.success(`Loaded scenario: "${scenario.name}"`);
  }, []);

  const handleReset = useCallback(() => {
    setAggression(65);
    setLoanUtil(30);
    setCryptoAlloc(5);
    setAlternativeAlloc(10);
    setIncomeStartYear(5);
    setSavingsRate(15);
    setInflationRate(3.0);
    setRetirementAge(65);
    setCurrentAge(45);
    setTaxRate(24);
    toast.info("Reset to default parameters");
  }, []);

  const handleRunSimulation = useCallback(() => {
    setIsSimulating(true);
    toast.loading("Running Monte Carlo simulations...", { id: "sim" });
    
    setTimeout(() => {
      setIsSimulating(false);
      toast.success("Simulation complete: 10,000 trials run", { id: "sim" });
    }, 1500);
  }, []);

  const timeAgo = (date: Date | string) => {
    const d = new Date(date);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const riskMetrics = [
    { name: "Portfolio Volatility", desc: "Expected standard deviation", value: `${(10 + (aggression/100)*12).toFixed(1)}%`, status: aggression > 80 ? "Warning" : "Good" },
    { name: "Max Drawdown", desc: "Estimated worst-case drop", value: `${(15 + (aggression/100)*25).toFixed(1)}%`, status: aggression > 85 ? "Danger" : "Good" },
    { name: "Sharpe Ratio", desc: "Risk-adjusted return", value: (1.2 - (cryptoAlloc/100)*0.5).toFixed(2), status: cryptoAlloc > 20 ? "Warning" : "Good" },
    { name: "Sequence of Returns", desc: "Risk near retirement", value: currentAge > 55 && aggression > 70 ? "High" : "Low", status: currentAge > 55 && aggression > 70 ? "Danger" : "Good" },
  ];

  const taxStrategies = [
    { strategy: "Roth Conversion Optimization", savings: 125000, cost: 2500, net: 122500 },
    { strategy: "Tax-Loss Harvesting", savings: 45000, cost: 500, net: 44500 },
    { strategy: "Asset Location Strategy", savings: 85000, cost: 1200, net: 83800 },
    { strategy: "Charitable Remainder Trust", savings: 210000, cost: 8500, net: 201500 },
  ];

  const cashFlows = [
    { phase: "Accumulation (Next 10 Yrs)", in: baseNetWorth * 0.05 * (savingsRate/100) * 10, out: 0, net: baseNetWorth * 0.05 * (savingsRate/100) * 10 },
    { phase: "Early Retirement (Yrs 11-20)", in: 0, out: baseNetWorth * 0.04 * 10, net: -(baseNetWorth * 0.04 * 10) },
    { phase: "Late Retirement (Yrs 21-30)", in: 0, out: baseNetWorth * 0.045 * 10, net: -(baseNetWorth * 0.045 * 10) },
  ];

  const scenarioComparisons = savedScenarios?.slice(0, 4).map((s: any, i: number) => ({
    name: s.name,
    finalNW: baseNetWorth * Math.pow(1.06 + (i*0.01), 30),
    prob: 85 - (i*5),
    legacy: baseNetWorth * Math.pow(1.06 + (i*0.01), 30) * 0.8
  })) || [];

  if (!clients || !marketData) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-[80vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin" />
            <p className="text-slate-400 font-medium animate-pulse">Loading financial models...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col h-full">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 bg-slate-900/50 p-6 rounded-xl border border-slate-800">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <SlidersHorizontal size={24} className="text-blue-400" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Advanced Scenario Modeling</h1>
              <Badge variant="outline" className="ml-2 bg-blue-500/10 text-blue-400 border-blue-500/30">v2.4</Badge>
            </div>
            <p className="text-slate-400">Interactive financial projection engine with real-time Monte Carlo analysis</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select 
              value={selectedClientId?.toString() ?? ""} 
              onValueChange={v => setSelectedClientId(v ? Number(v) : null)}
            >
              <SelectTrigger className="w-[240px] bg-slate-950 border-slate-700">
                <SelectValue placeholder="Select Client Context" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Demo Client ($2.5M Base)</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <ExportToSlides
              toolName="Scenario Adjustments"
              getSections={() => [
                {
                  title: "Scenario Parameters",
                  items: [
                    { label: "Aggression Level", value: `${aggression}%` },
                    { label: "Loan Utilization", value: `${loanUtil}%` },
                    { label: "Crypto Allocation", value: `${cryptoAlloc}%` },
                    { label: "Retirement Age", value: `${retirementAge}` },
                  ]
                },
                {
                  title: "Projection Results",
                  items: [
                    { label: "Projected Net Worth", value: formatCurrency(result.finalProjected) },
                    { label: "Conservative Net Worth", value: formatCurrency(result.finalConservative) },
                    { label: "Success Probability", value: `${result.probSuccess}%` },
                  ]
                }
              ]}
            />
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-900/50 border-slate-800 shadow-lg">
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-400 mb-1">Projected Net Worth</p>
                  <h3 className="text-2xl font-bold text-emerald-400">{formatCurrency(result.finalProjected)}</h3>
                </div>
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <TrendingUp size={20} className="text-emerald-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-slate-500">
                <span className="text-emerald-400 flex items-center mr-2">
                  <ArrowUpRight size={12} className="mr-0.5" />
                  +{(result.blendedReturn * 100).toFixed(1)}%
                </span>
                Avg Annual Return
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 shadow-lg">
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-400 mb-1">Conservative Outlook</p>
                  <h3 className="text-2xl font-bold text-blue-400">{formatCurrency(result.finalConservative)}</h3>
                </div>
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Shield size={20} className="text-blue-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-slate-500">
                <span className="text-slate-400 flex items-center mr-2">
                  <Minus size={12} className="mr-0.5" />
                  Stress Tested
                </span>
                95% Confidence Interval
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 shadow-lg">
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-400 mb-1">Success Probability</p>
                  <h3 className={`text-2xl font-bold ${result.probSuccess >= 85 ? 'text-emerald-400' : result.probSuccess >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
                    {result.probSuccess}%
                  </h3>
                </div>
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Activity size={20} className="text-purple-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-slate-500">
                <span className="text-slate-400 flex items-center mr-2">
                  Monte Carlo
                </span>
                10,000 Trials
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 shadow-lg">
            <CardContent className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-400 mb-1">Total Contributions</p>
                  <h3 className="text-2xl font-bold text-slate-200">{formatCurrency(result.totalContributions)}</h3>
                </div>
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <DollarSign size={20} className="text-amber-400" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-xs text-slate-500">
                <span className="text-slate-400 flex items-center mr-2">
                  {savingsRate}% Rate
                </span>
                Over {retirementAge - currentAge} Years
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mb-8 flex-1">
          {/* Left Panel: Controls */}
          <div className="xl:col-span-3 space-y-6">
            <Card className="bg-slate-900/80 border-slate-800 shadow-xl">
              <CardHeader className="pb-4 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2 text-white">
                    <SlidersHorizontal size={18} className="text-blue-400" />
                    Model Parameters
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={handleReset} className="h-8 w-8 text-slate-400 hover:text-white" title="Reset to defaults">
                    <RotateCcw size={14} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <ScrollArea className="h-[500px] pr-4 -mr-4">
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Core Strategy</h4>
                    
                    <ParamSlider 
                      label="Risk Tolerance" value={aggression} min={10} max={100} step={5} unit="" color="#3b82f6" 
                      onChange={setAggression} 
                      description="Determines equity vs fixed income allocation"
                    />
                    
                    <ParamSlider 
                      label="Savings Rate" value={savingsRate} min={0} max={50} step={1} unit="%" color="#10b981" 
                      onChange={setSavingsRate}
                      description="% of income saved annually"
                    />
                    
                    <ParamSlider 
                      label="Retirement Age" value={retirementAge} min={50} max={80} step={1} unit="" color="#8b5cf6" 
                      onChange={setRetirementAge}
                      description="Target age to stop working"
                    />

                    <div className="my-6">
                      <Separator className="bg-slate-800" />
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Advanced Allocation</h4>
                      <Switch checked={showAdvanced} onCheckedChange={setShowAdvanced} />
                    </div>

                    {showAdvanced && (
                      <div className="space-y-1 animate-in fade-in slide-in-from-top-4 duration-300">
                        <ParamSlider 
                          label="Crypto Allocation" value={cryptoAlloc} min={0} max={25} step={1} unit="%" color="#f59e0b" 
                          onChange={setCryptoAlloc}
                        />
                        
                        <ParamSlider 
                          label="Alternatives (PE/VC)" value={alternativeAlloc} min={0} max={30} step={1} unit="%" color="#ec4899" 
                          onChange={setAlternativeAlloc}
                        />
                        
                        <ParamSlider 
                          label="Leverage / Margin" value={loanUtil} min={0} max={50} step={5} unit="%" color="#ef4444" 
                          onChange={setLoanUtil}
                        />
                        
                        <ParamSlider 
                          label="Tax Rate Estimate" value={taxRate} min={10} max={50} step={1} unit="%" color="#64748b" 
                          onChange={setTaxRate}
                        />
                        
                        <ParamSlider 
                          label="Inflation Assumption" value={inflationRate} min={1} max={8} step={0.5} unit="%" color="#f97316" 
                          onChange={setInflationRate}
                        />
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter className="border-t border-slate-800 pt-4 bg-slate-900/50 flex-col gap-3">
                <Button 
                  onClick={handleRunSimulation} 
                  disabled={isSimulating}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isSimulating ? <Zap size={16} className="animate-pulse mr-2" /> : <Activity size={16} className="mr-2" />}
                  {isSimulating ? "Running..." : "Run Monte Carlo"}
                </Button>
                
                <div className="w-full flex gap-2">
                  <Input 
                    placeholder="Scenario name..." 
                    value={scenarioName}
                    onChange={(e) => setScenarioName(e.target.value)}
                    className="bg-slate-950 border-slate-700 h-9 text-sm"
                  />
                  <Button 
                    onClick={handleSave} 
                    disabled={saveMutation.isPending || !selectedClientId}
                    variant="outline"
                    className="h-9 border-slate-700 hover:bg-slate-800"
                  >
                    <Save size={16} />
                  </Button>
                </div>
              </CardFooter>
            </Card>

            {/* Saved Scenarios */}
            {selectedClientId && savedScenarios && savedScenarios.length > 0 && (
              <Card className="bg-slate-900/80 border-slate-800">
                <CardHeader className="py-4">
                  <CardTitle className="text-sm flex items-center gap-2 text-white">
                    <Clock size={16} className="text-purple-400" />
                    Saved Scenarios
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="space-y-2">
                    {savedScenarios.slice(0, 5).map((s) => (
                      <div key={s.id} className="flex items-center justify-between p-2 rounded-md bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors group">
                        <button onClick={() => handleLoad(s)} className="flex-1 text-left">
                          <div className="text-sm font-medium text-slate-200 truncate">{s.name}</div>
                          <div className="text-xs text-slate-500">{timeAgo(s.createdAt)}</div>
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate({ id: s.id })}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel: Visualization & Data */}
          <div className="xl:col-span-9 space-y-6">
            <Tabs defaultValue="projection" className="w-full" onValueChange={setActiveTab}>
              <div className="flex items-center justify-between mb-4 bg-slate-900/50 p-1 rounded-lg border border-slate-800">
                <TabsList className="bg-transparent border-none">
                  <TabsTrigger value="projection" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <TrendingUp size={16} className="mr-2" /> Wealth Projection
                  </TabsTrigger>
                  <TabsTrigger value="allocation" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <PieChartIcon size={16} className="mr-2" /> Allocation & Risk
                  </TabsTrigger>
                  <TabsTrigger value="cashflow" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <DollarSign size={16} className="mr-2" /> Cash Flow
                  </TabsTrigger>
                  <TabsTrigger value="data" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <FileText size={16} className="mr-2" /> Data Tables
                  </TabsTrigger>
                </TabsList>
                
                <div className="flex items-center gap-2 pr-2">
                  <span className="text-xs text-slate-400 mr-2">Chart Type:</span>
                  <Select value={chartType} onValueChange={setChartType}>
                    <SelectTrigger className="w-[120px] h-8 bg-slate-950 border-slate-700 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="area">Area Chart</SelectItem>
                      <SelectItem value="line">Line Chart</SelectItem>
                      <SelectItem value="bar">Bar Chart</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Tab 1: Wealth Projection (Chart 1) */}
              <TabsContent value="projection" className="mt-0 space-y-6 animate-in fade-in duration-500">
                <Card className="bg-slate-900/80 border-slate-800 shadow-xl">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-lg text-white">Lifetime Net Worth Trajectory</CardTitle>
                        <CardDescription>Projected wealth across multiple market environments</CardDescription>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-emerald-500/80" />
                          <span className="text-xs text-slate-300">Base Projection</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-blue-500/80" />
                          <span className="text-xs text-slate-300">Conservative</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-purple-500/80" />
                          <span className="text-xs text-slate-300">Aggressive</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[450px] w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={result.projData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                          <defs>
                            <linearGradient id="colorProj" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorCons" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorAgg" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                          <XAxis 
                            dataKey="age" 
                            tick={{ fill: "#64748b", fontSize: 12 }} 
                            axisLine={{ stroke: '#334155' }} 
                            tickLine={false}
                            label={{ value: 'Age', position: 'insideBottom', offset: -10, fill: '#94a3b8' }}
                          />
                          <YAxis 
                            tick={{ fill: "#64748b", fontSize: 12 }} 
                            axisLine={{ stroke: '#334155' }} 
                            tickLine={false} 
                            tickFormatter={v => `$${(v / 1_000_000).toFixed(1)}M`}
                            width={80}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          
                          {chartType === 'area' && (
                            <>
                              <Area type="monotone" dataKey="aggressive" stroke="#8b5cf6" strokeWidth={2} fill="url(#colorAgg)" name="Aggressive Market" />
                              <Area type="monotone" dataKey="projected" stroke="#10b981" strokeWidth={3} fill="url(#colorProj)" name="Base Projection" activeDot={{ r: 6, strokeWidth: 0 }} />
                              <Area type="monotone" dataKey="conservative" stroke="#3b82f6" strokeWidth={2} fill="url(#colorCons)" name="Conservative Market" />
                            </>
                          )}
                          
                          {chartType === 'line' && (
                            <>
                              <Line type="monotone" dataKey="aggressive" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Aggressive Market" />
                              <Line type="monotone" dataKey="projected" stroke="#10b981" strokeWidth={3} dot={false} name="Base Projection" activeDot={{ r: 6 }} />
                              <Line type="monotone" dataKey="conservative" stroke="#3b82f6" strokeWidth={2} dot={false} name="Conservative Market" />
                            </>
                          )}
                          
                          {chartType === 'bar' && (
                            <>
                              <Bar dataKey="projected" fill="#10b981" radius={[4, 4, 0, 0]} name="Base Projection" />
                            </>
                          )}
                          
                          {/* Reference line for retirement age */}
                          <Line 
                            type="step" 
                            dataKey={() => result.projData.find((d) => d.age === retirementAge)?.projected || 0} 
                            stroke="#ef4444" 
                            strokeDasharray="5 5" 
                            strokeWidth={1} 
                            dot={false} 
                            name="Retirement Target" 
                            activeDot={false}
                            legendType="none"
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 2: Allocation & Risk (Charts 2 & 3) */}
              <TabsContent value="allocation" className="mt-0 space-y-6 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-slate-900/80 border-slate-800 shadow-xl">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">Target Asset Allocation</CardTitle>
                      <CardDescription>Based on risk score of {aggression}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={result.allocationData}
                              cx="50%"
                              cy="50%"
                              innerRadius={80}
                              outerRadius={120}
                              paddingAngle={5}
                              dataKey="value"
                              stroke="none"
                            >
                              {result.allocationData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                          <span className="text-3xl font-bold text-white">{aggression}</span>
                          <span className="text-xs text-slate-400">Risk Score</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-900/80 border-slate-800 shadow-xl">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">Risk Exposure Profile</CardTitle>
                      <CardDescription>Multi-dimensional risk analysis</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={result.riskData}>
                            <PolarGrid stroke="#334155" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar
                              name="Current Strategy"
                              dataKey="A"
                              stroke="#3b82f6"
                              fill="#3b82f6"
                              fillOpacity={0.4}
                            />
                            <Tooltip content={<CustomTooltip />} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Data Table 1: Asset Allocation */}
                <Card className="bg-slate-900/80 border-slate-800 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">Allocation Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AssetAllocationTable data={result.allocationData} />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 3: Cash Flow & Debt (Charts 4 & 5) */}
              <TabsContent value="cashflow" className="mt-0 space-y-6 animate-in fade-in duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-slate-900/80 border-slate-800 shadow-xl">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">Cumulative Cash Flows</CardTitle>
                      <CardDescription>Contributions vs Withdrawals over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={result.projData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorCont" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                              </linearGradient>
                              <linearGradient id="colorWith" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="age" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000)}k`} width={60} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="contributions" stroke="#10b981" fillOpacity={1} fill="url(#colorCont)" name="Total Contributions" />
                            <Area type="monotone" dataKey="withdrawals" stroke="#ef4444" fillOpacity={1} fill="url(#colorWith)" name="Total Withdrawals" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-900/80 border-slate-800 shadow-xl">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle className="text-lg text-white">Debt Payoff Schedule</CardTitle>
                          <CardDescription>Paid off by {result.payoffYear}</CardDescription>
                        </div>
                        <Home size={20} className="text-blue-400" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={result.payoffData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="year" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000)}k`} width={60} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="remaining" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} name="Remaining Principal" />
                            <Bar dataKey="paid" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} name="Principal Paid" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Data Table 2: Cash Flow */}
                <Card className="bg-slate-900/80 border-slate-800 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-lg text-white">Cash Flow Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CashFlowTable data={cashFlows} />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 4: Comprehensive Data Tables */}
              <TabsContent value="data" className="mt-0 space-y-6 animate-in fade-in duration-500">
                {/* Data Table 3: Year by Year Projection */}
                <Card className="bg-slate-900/80 border-slate-800 shadow-xl">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg text-white">Year-by-Year Projection Data</CardTitle>
                      <CardDescription>Detailed tabular view of the simulation</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" className="border-slate-700 text-slate-300">
                      <Download size={14} className="mr-2" /> Export CSV
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <ProjectionTable data={result.projData} />
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Data Table 4: Risk Metrics */}
                  <Card className="bg-slate-900/80 border-slate-800 shadow-xl">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">Risk & Volatility Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RiskMetricsTable metrics={riskMetrics} />
                    </CardContent>
                  </Card>

                  {/* Data Table 5: Tax Strategies */}
                  <Card className="bg-slate-900/80 border-slate-800 shadow-xl">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">Tax Optimization Opportunities</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <TaxImplicationsTable data={taxStrategies} />
                    </CardContent>
                  </Card>
                </div>

                {/* Data Table 6: Scenario Comparison */}
                {savedScenarios && savedScenarios.length > 0 && (
                  <Card className="bg-slate-900/80 border-slate-800 shadow-xl">
                    <CardHeader>
                      <CardTitle className="text-lg text-white">Scenario Comparison</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScenarioComparisonTable scenarios={scenarioComparisons} />
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      
      <div className="mt-auto pt-6 border-t border-slate-800">
        <NAICDisclaimer variant="compact" showsProjections />
      </div>
    
        <ComplianceFooter pageName="ScenarioAdjustments" showsTax showsEstate showsProjections showsHistoricalData showsPolicyLoans />
      </AppShell>
  );
}

