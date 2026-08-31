// @ts-nocheck
import { AppShell } from "@/components/AppShell";
import { GenerateOutcomeTab } from "@/components/GenerateOutcomeTab";
import { CalculationSyncBar } from "@/components/CalculationSyncBar";
import { useStrategy } from "@/contexts/StrategyContext";
import { 
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, 
  LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, Legend
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useClientData } from "@/contexts/ClientDataContext";
import { OilGasToggle, type OilGasResult } from "@/components/OilGasToggle";
import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Home,
  Plus,
  Trash2,
  TrendingUp,
  DollarSign,
  Building2,
  BarChart3,
  Target,
  Shield,
  Wallet,
  MapPin,
  Sparkles,
  PiggyBank,
  ArrowUpRight,
  AlertCircle,
  RefreshCw,
  Settings,
  Save,
  FileText,
  Briefcase,
  Percent,
  Activity,
  Calendar,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
} from "lucide-react";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { IbbotsonYearSelector } from "@/components/IbbotsonYearSelector";
import { Switch } from "@/components/ui/switch";
import { SP500_ANNUAL_RETURNS, calculateCreditedRate, IBBOTSON_DEFAULT_START_YEAR, IBBOTSON_SHORT_DISCLAIMER } from "@shared/ibbotsonModel";
import { PageInsights } from "@/components/PageInsights";
import { ExportToSlides } from "@/components/ExportToSlides";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

interface Property {
  id: number;
  name: string;
  purchasePrice: number;
  downPayment: number;
  mortgageRate: number;
  mortgageTerm: number;
  monthlyRent: number;
  monthlyExpenses: number;
  appreciation: number;
  vacancy: number;
  propertyType: string;
  state: string;
  yearBuilt: number;
  sqft: number;
  propertyTaxRate: number;
  insuranceRate: number;
  maintenanceRate: number;
  managementFeeRate: number;
  renovationBudget: number;
  expectedRentIncrease: number;
}

const DEFAULT_PROPERTY: Omit<Property, "id"> = {
  name: "Rental Property 1",
  purchasePrice: 300000,
  downPayment: 20,
  mortgageRate: 6.5,
  mortgageTerm: 30,
  monthlyRent: 2200,
  monthlyExpenses: 400,
  appreciation: 3.5,
  vacancy: 5,
  propertyType: "single_family",
  state: "TX",
  yearBuilt: 2010,
  sqft: 1500,
  propertyTaxRate: 1.2,
  insuranceRate: 0.5,
  maintenanceRate: 1.0,
  managementFeeRate: 8.0,
  renovationBudget: 5000,
  expectedRentIncrease: 3.0,
};

const PROPERTY_TYPES = [{ value: "single_family", label: "Single Family" },
,
  { value: "duplex", label: "Duplex" },
,
  { value: "triplex", label: "Triplex" },
,
  { value: "fourplex", label: "Fourplex" },
,
  { value: "condo", label: "Condo" }
];

const STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", 
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", 
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", 
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", 
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

const fmt = (n: number) => "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
const pct = (n: number) => n.toFixed(2) + "%";
const fmtDec = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });

function NumberInput({ value, onChange, ...props }: { value: number; onChange: (v: number) => void; className?: string; min?: number; max?: number; step?: number; disabled?: boolean }) {
  return (
    <Input
      type="number"
      value={value || ""}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      {...props}
    />
  );
}

function calcProperty(p: Property, years: number) {
  const loanAmount = p.purchasePrice * (1 - p.downPayment / 100);
  const monthlyRate = p.mortgageRate / 100 / 12;
  const numPayments = p.mortgageTerm * 12;
  const monthlyPayment = monthlyRate > 0
    ? loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)
    : loanAmount / numPayments;

  const effectiveRent = p.monthlyRent * (1 - p.vacancy / 100);
  
  const propertyTaxMonthly = (p.purchasePrice * (p.propertyTaxRate / 100)) / 12;
  const insuranceMonthly = (p.purchasePrice * (p.insuranceRate / 100)) / 12;
  const maintenanceMonthly = (p.purchasePrice * (p.maintenanceRate / 100)) / 12;
  const managementMonthly = p.monthlyRent * (p.managementFeeRate / 100);
  
  const totalMonthlyExpenses = p.monthlyExpenses + propertyTaxMonthly + insuranceMonthly + maintenanceMonthly + managementMonthly;
  
  const monthlyCashFlow = effectiveRent - monthlyPayment - totalMonthlyExpenses;
  const annualCashFlow = monthlyCashFlow * 12;
  const downPaymentAmount = p.purchasePrice * (p.downPayment / 100);
  const initialInvestment = downPaymentAmount + p.renovationBudget;
  const cashOnCash = initialInvestment > 0 ? (annualCashFlow / initialInvestment) * 100 : 0;

  const noi = (effectiveRent - totalMonthlyExpenses) * 12;
  const capRate = p.purchasePrice > 0 ? (noi / p.purchasePrice) * 100 : 0;
  
  const grm = p.monthlyRent > 0 ? p.purchasePrice / (p.monthlyRent * 12) : 0;

  const projection: Array<{
    year: number;
    propertyValue: number;
    loanBalance: number;
    equity: number;
    annualRent: number;
    annualExpenses: number;
    annualCashFlow: number;
    totalReturn: number;
    noi: number;
    capRate: number;
    roi: number;
  }> = [];

  let currentValue = p.purchasePrice;
  let remainingLoan = loanAmount;
  let totalCashFlow = 0;

  for (let y = 0; y <= years; y++) {
    const equity = currentValue - remainingLoan;
    
    const currentRent = effectiveRent * Math.pow(1 + p.expectedRentIncrease / 100, y);
    const currentExpenses = totalMonthlyExpenses * Math.pow(1.02, y); // Assume 2% inflation on expenses
    
    const yearlyRent = currentRent * 12;
    const yearlyExpenses = currentExpenses * 12;
    const yearlyNOI = yearlyRent - yearlyExpenses;
    const yearlyCashFlow = yearlyNOI - (monthlyPayment * 12);
    
    projection.push({
      year: y,
      propertyValue: currentValue,
      loanBalance: remainingLoan,
      equity,
      annualRent: yearlyRent,
      annualExpenses: yearlyExpenses,
      annualCashFlow: yearlyCashFlow,
      totalReturn: equity - initialInvestment + totalCashFlow,
      noi: yearlyNOI,
      capRate: currentValue > 0 ? (yearlyNOI / currentValue) * 100 : 0,
      roi: initialInvestment > 0 ? ((equity - initialInvestment + totalCashFlow) / initialInvestment) * 100 : 0,
    });

    currentValue *= (1 + p.appreciation / 100);
    
    if (y < p.mortgageTerm) {
      const yearlyInterest = remainingLoan * (p.mortgageRate / 100);
      const yearlyPrincipal = (monthlyPayment * 12) - yearlyInterest;
      remainingLoan = Math.max(0, remainingLoan - yearlyPrincipal);
    } else {
      remainingLoan = 0;
    }
    
    totalCashFlow += yearlyCashFlow;
  }

  return {
    monthlyPayment,
    monthlyCashFlow,
    annualCashFlow,
    cashOnCash,
    downPaymentAmount,
    loanAmount,
    initialInvestment,
    capRate,
    noi,
    grm,
    totalMonthlyExpenses,
    projection,
    totalEquityAtEnd: projection[projection.length - 1]?.equity ?? 0,
    totalValueAtEnd: projection[projection.length - 1]?.propertyValue ?? 0,
    totalCashFlowGenerated: totalCashFlow,
  };
}

export default function RealEstateMogul() {
  const { user } = useAuth();
  const { data: clientData } = useClientData();
  
  const [properties, setProperties] = useState<Property[]>([
    { ...DEFAULT_PROPERTY, id: 1 },
  ]);
  const [projectionYears, setProjectionYears] = useState(30);
  const [expandedProperty, setExpandedProperty] = useState<number | null>(1);
  const [iulPremium, setIulPremium] = useState(24000);
  const [iulRate, setIulRate] = useState(7.0);
  const [oilGasEnabled, setOilGasEnabled] = useState(false);
  const [oilGasAmount, setOilGasAmount] = useState(100000);
  const [activeTab, setActiveTab] = useState("portfolio");
  const [ibbotsonStartYear, setIbbotsonStartYear] = useState(IBBOTSON_DEFAULT_START_YEAR);
  const [useIbbotsonModel, setUseIbbotsonModel] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [globalInflation, setGlobalInflation] = useState(2.5);
  const [taxBracket, setTaxBracket] = useState(32);
  const [capitalGainsTax, setCapitalGainsTax] = useState(15);
  const [depreciationYears, setDepreciationYears] = useState(27.5);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number>(1);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [scenarioName, setScenarioName] = useState("Base Scenario");
  
  const { data: marketData } = trpc.marketData.getRealEstateMetrics.useQuery(
    { state: properties[0]?.state || "TX" },
    { enabled: !!properties[0]?.state }
  );
  
  const { data: strategyData } = trpc.strategy.getRecommendations.useQuery(
    { clientId: clientData?.id || "default", strategyType: "real_estate" },
    { enabled: !!clientData?.id }
  );
  
  const { data: savedScenarios } = trpc.scenarios.list.useQuery(
    { type: "real_estate" }
  );
  
  const saveScenarioMutation = trpc.scenarios.save.useMutation();
  const analyzePortfolioMutation = trpc.ai.analyzeRealEstatePortfolio.useMutation();
  
  const portfolioCalcs = useMemo(() => {
    return properties.map((p) => ({ property: p, calc: calcProperty(p, projectionYears) }));
  }, [properties, projectionYears]);

  const totalMonthlyRent = properties.reduce((s, p) => s + p.monthlyRent * (1 - p.vacancy / 100), 0);
  const totalMonthlyCashFlow = portfolioCalcs.reduce((s, pc) => s + pc.calc.monthlyCashFlow, 0);
  const totalDownPayment = portfolioCalcs.reduce((s, pc) => s + pc.calc.downPaymentAmount, 0);
  const totalInitialInvestment = portfolioCalcs.reduce((s, pc) => s + pc.calc.initialInvestment, 0);
  const totalPropertyValue = properties.reduce((s, p) => s + p.purchasePrice, 0);
  const totalEquity = portfolioCalcs.reduce((s, pc) => s + pc.calc.totalEquityAtEnd, 0);
  const totalFutureValue = portfolioCalcs.reduce((s, pc) => s + pc.calc.totalValueAtEnd, 0);
  const totalNOI = portfolioCalcs.reduce((s, pc) => s + pc.calc.noi, 0);
  
  const avgCashOnCash = portfolioCalcs.length > 0
    ? portfolioCalcs.reduce((s, pc) => s + pc.calc.cashOnCash, 0) / portfolioCalcs.length
    : 0;
    
  const portfolioCapRate = totalPropertyValue > 0 ? (totalNOI / totalPropertyValue) * 100 : 0;

  const iulProjection = useMemo(() => {
    let cashValue = 0;
    const data: Array<{ year: number; premium: number; cashValue: number; deathBenefit: number; creditedRate: number; calendarYear?: number }> = [];
    const capRate = iulRate / 100;
    for (let y = 0; y <= projectionYears; y++) {
      let yearCreditRate = iulRate / 100;
      let calendarYear: number | undefined;
      if (useIbbotsonModel && y > 0) {
        calendarYear = ibbotsonStartYear + y - 1;
        const sp500 = SP500_ANNUAL_RETURNS[calendarYear];
        if (sp500 !== undefined) {
          yearCreditRate = calculateCreditedRate(sp500, capRate, 0, 1.0);
        }
      }
      data.push({
        year: y,
        premium: y > 0 ? iulPremium : 0,
        cashValue,
        deathBenefit: Math.max(cashValue * 1.5, iulPremium * 10),
        creditedRate: y > 0 ? yearCreditRate : 0,
        calendarYear,
      });
      if (y > 0) {
        cashValue = (cashValue + iulPremium) * (1 + yearCreditRate);
      }
    }
    return data;
  }, [iulPremium, iulRate, projectionYears, useIbbotsonModel, ibbotsonStartYear]);

  const iulFinalValue = iulProjection[iulProjection.length - 1]?.cashValue ?? 0;

  const oilGasProjection = useMemo(() => {
    if (!oilGasEnabled) return { totalIncome: 0, taxSavings: 0, principalReturn: 0, yearlyData: [] };
    const annualIncome = oilGasAmount * 0.15;
    const totalIncome = annualIncome * projectionYears;
    const year1Deduction = oilGasAmount * 0.85;
    const taxSavings = year1Deduction * (taxBracket / 100);
    const principalReturn = projectionYears >= 10 ? oilGasAmount : 0;
    
    const yearlyData = Array.from({ length: projectionYears + 1 }, (_, i) => ({
      year: i,
      income: i > 0 ? annualIncome : 0,
      cumulativeIncome: i > 0 ? annualIncome * i : 0,
      taxSavings: i === 1 ? taxSavings : 0,
      principal: i === projectionYears ? principalReturn : 0
    }));
    
    return { totalIncome, taxSavings, principalReturn, yearlyData };
  }, [oilGasEnabled, oilGasAmount, projectionYears, taxBracket]);

  const grandTotalWealth = totalFutureValue + iulFinalValue +
    (oilGasEnabled ? oilGasProjection.totalIncome + oilGasProjection.principalReturn : 0);

  const wealthCompositionData = [
    { name: 'Real Estate Equity', value: totalEquity, color: COLORS[0] },
    { name: 'IUL Cash Value', value: iulFinalValue, color: COLORS[1] },
  ];
  if (oilGasEnabled) {
    wealthCompositionData.push({ 
      name: 'Oil & Gas Returns', 
      value: oilGasProjection.totalIncome + oilGasProjection.principalReturn, 
      color: COLORS[2] 
    });
  }

  const timelineData = useMemo(() => {
    return Array.from({ length: projectionYears + 1 }, (_, year) => {
      const reValue = portfolioCalcs.reduce((s, pc) => s + (pc.calc.projection[year]?.propertyValue ?? 0), 0);
      const reEquity = portfolioCalcs.reduce((s, pc) => s + (pc.calc.projection[year]?.equity ?? 0), 0);
      const reCashFlow = portfolioCalcs.reduce((s, pc) => s + (pc.calc.projection[year]?.annualCashFlow ?? 0), 0);
      const iulValue = iulProjection[year]?.cashValue ?? 0;
      const ogIncome = oilGasEnabled && year > 0 ? oilGasProjection.yearlyData[year]?.cumulativeIncome ?? 0 : 0;
      
      return {
        year,
        reValue,
        reEquity,
        reCashFlow,
        iulValue,
        ogIncome,
        totalWealth: reEquity + iulValue + ogIncome,
        totalCashFlow: reCashFlow + (oilGasEnabled && year > 0 ? oilGasAmount * 0.15 : 0) + (year >= 10 ? iulValue * 0.05 : 0)
      };
    });
  }, [portfolioCalcs, iulProjection, oilGasProjection, oilGasEnabled, projectionYears, oilGasAmount]);

  const propertyTypeDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    properties.forEach((p) => {
      dist[p.propertyType] = (dist[p.propertyType] || 0) + p.purchasePrice;
    });
    return Object.entries(dist).map(([type, value], index) => ({
      name: PROPERTY_TYPES.find((pt) => pt.value === type)?.label || type,
      value,
      color: COLORS[index % COLORS.length]
    }));
  }, [properties]);

  const stateDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    properties.forEach((p) => {
      dist[p.state] = (dist[p.state] || 0) + 1;
    });
    return Object.entries(dist).map(([state, count], index) => ({
      name: state,
      count,
      color: COLORS[(index + 4) % COLORS.length]
    }));
  }, [properties]);

  const cashFlowAnalysisData = useMemo(() => {
    return properties.map((p) => {
      const calc = portfolioCalcs.find((pc) => pc.property.id === p.id)?.calc;
      return {
        name: p.name,
        rent: p.monthlyRent * 12,
        mortgage: (calc?.monthlyPayment || 0) * 12,
        expenses: (calc?.totalMonthlyExpenses || 0) * 12,
        cashFlow: (calc?.annualCashFlow || 0)
      };
    });
  }, [properties, portfolioCalcs]);

  const addProperty = useCallback(() => {
    if (properties.length >= 150) return;
    const nextId = Math.max(...properties.map((p) => p.id), 0) + 1;
    setProperties(prev => [...prev, {
      ...DEFAULT_PROPERTY,
      id: nextId,
      name: `Rental Property ${nextId}`,
    }]);
    setExpandedProperty(nextId);
    setSelectedPropertyId(nextId);
  }, [properties]);

  const removeProperty = useCallback((id: number) => {
    setProperties(prev => prev.filter((p) => p.id !== id));
    if (expandedProperty === id) setExpandedProperty(null);
    if (selectedPropertyId === id && properties.length > 1) {
      setSelectedPropertyId(properties.find((p) => p.id !== id)?.id || 1);
    }
  }, [expandedProperty, selectedPropertyId, properties]);

  const updateProperty = useCallback((id: number, field: keyof Property, value: any) => {
    setProperties(prev => prev.map((p) => p.id === id ? { ...p, [field]: value } : p));
  }, []);

  const addBulk = useCallback((count: number) => {
    const startId = Math.max(...properties.map((p) => p.id), 0) + 1;
    const newProps = Array.from({ length: Math.min(count, 150 - properties.length) }, (_, i) => ({
      ...DEFAULT_PROPERTY,
      id: startId + i,
      name: `Rental Property ${startId + i}`,
      purchasePrice: 250000 + Math.round(Math.random() * 200000),
      monthlyRent: 1800 + Math.round(Math.random() * 1200),
      state: STATES[Math.floor(Math.random() * STATES.length)],
      propertyType: PROPERTY_TYPES[Math.floor(Math.random() * PROPERTY_TYPES.length)].value,
    }));
    setProperties(prev => [...prev, ...newProps]);
  }, [properties]);

  const handleSimulate = () => {
    setIsSimulating(true);
    setSimulationProgress(0);
    
    const interval = setInterval(() => {
      setSimulationProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSimulating(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleSaveScenario = async () => {
    try {
      await saveScenarioMutation.mutateAsync({
        name: scenarioName,
        type: "real_estate",
        data: {
          properties,
          projectionYears,
          iulPremium,
          iulRate,
          oilGasEnabled,
          oilGasAmount,
          globalInflation,
          taxBracket
        }
      });
    } catch (error) {
      console.error("Failed to save scenario", error);
    }
  };

  const handleAnalyzePortfolio = async () => {
    try {
      await analyzePortfolioMutation.mutateAsync({
        portfolio: properties,
        metrics: {
          totalValue: totalPropertyValue,
          totalCashFlow: totalMonthlyCashFlow * 12,
          capRate: portfolioCapRate
        }
      });
    } catch (error) {
      console.error("Analysis failed", error);
    }
  };

  useEffect(() => {
    if (iulPremium === 0 && totalMonthlyCashFlow > 0) {
      setIulPremium(Math.round(totalMonthlyCashFlow * 12 * 0.5));
    }
  }, [totalMonthlyCashFlow, iulPremium]);

  const renderPropertyForm = (p: Property) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
      <div className="space-y-2">
        <Label className="text-xs">Property Name</Label>
        <Input value={p.name} onChange={(e) => updateProperty(p.id, "name", e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Property Type</Label>
        <Select value={p.propertyType} onValueChange={v => updateProperty(p.id, "propertyType", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {PROPERTY_TYPES.map((pt) => (
              <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">State</Label>
        <Select value={p.state} onValueChange={v => updateProperty(p.id, "state", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {STATES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Purchase Price ($)</Label>
        <NumberInput value={p.purchasePrice} onChange={(v) => updateProperty(p.id, "purchasePrice", v)} />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Down Payment (%)</Label>
        <NumberInput value={p.downPayment} onChange={(v) => updateProperty(p.id, "downPayment", v)} />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Mortgage Rate (%)</Label>
        <NumberInput value={p.mortgageRate} onChange={(v) => updateProperty(p.id, "mortgageRate", v)} step={0.1} />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Mortgage Term (Yrs)</Label>
        <NumberInput value={p.mortgageTerm} onChange={(v) => updateProperty(p.id, "mortgageTerm", v)} />
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Monthly Rent ($)</Label>
        <NumberInput value={p.monthlyRent} onChange={(v) => updateProperty(p.id, "monthlyRent", v)} />
      </div>
      
      {showAdvanced && (
        <>
          <div className="space-y-2">
            <Label className="text-xs">Vacancy Rate (%)</Label>
            <NumberInput value={p.vacancy} onChange={(v) => updateProperty(p.id, "vacancy", v)} step={0.1} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Appreciation (%)</Label>
            <NumberInput value={p.appreciation} onChange={(v) => updateProperty(p.id, "appreciation", v)} step={0.1} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Property Tax Rate (%)</Label>
            <NumberInput value={p.propertyTaxRate} onChange={(v) => updateProperty(p.id, "propertyTaxRate", v)} step={0.1} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Insurance Rate (%)</Label>
            <NumberInput value={p.insuranceRate} onChange={(v) => updateProperty(p.id, "insuranceRate", v)} step={0.1} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Maintenance Rate (%)</Label>
            <NumberInput value={p.maintenanceRate} onChange={(v) => updateProperty(p.id, "maintenanceRate", v)} step={0.1} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Management Fee (%)</Label>
            <NumberInput value={p.managementFeeRate} onChange={(v) => updateProperty(p.id, "managementFeeRate", v)} step={0.1} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Other Monthly Exp. ($)</Label>
            <NumberInput value={p.monthlyExpenses} onChange={(v) => updateProperty(p.id, "monthlyExpenses", v)} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Renovation Budget ($)</Label>
            <NumberInput value={p.renovationBudget} onChange={(v) => updateProperty(p.id, "renovationBudget", v)} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Expected Rent Inc. (%)</Label>
            <NumberInput value={p.expectedRentIncrease} onChange={(v) => updateProperty(p.id, "expectedRentIncrease", v)} step={0.1} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Year Built</Label>
            <NumberInput value={p.yearBuilt} onChange={(v) => updateProperty(p.id, "yearBuilt", v)} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Square Footage</Label>
            <NumberInput value={p.sqft} onChange={(v) => updateProperty(p.id, "sqft", v)} />
          </div>
        </>
      )}
    </div>
  );

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto pb-20">
        <CalculationSyncBar />

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="RealEstateMogul" />

        {/* ─── Rabbu.com Market Data Integration ─── */}
        <div className="bg-gradient-to-r from-emerald-900/40 to-teal-900/40 border border-emerald-500/30 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Validate Your Numbers with Real Market Data — <a href="https://www.rabbu.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 underline">Rabbu.com</a></h3>
              <p className="text-sm text-gray-300 mb-3"><a href="https://www.rabbu.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300">Rabbu.com</a> is the leading Airbnb marketplace and analytics platform used by over 650,000 real estate investors. Before committing to any property acquisition, validate your rental income assumptions with real market data.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <a href="https://www.rabbu.com/airbnb-calculator" target="_blank" rel="noopener noreferrer" className="bg-black/30 rounded-lg p-3 hover:bg-black/50 transition-colors">
                  <div className="text-emerald-400 font-semibold text-sm">Airbnb Calculator</div>
                  <div className="text-xs text-gray-400">Enter any address → get revenue estimates</div>
                </a>
                <a href="https://www.rabbu.com/market-data" target="_blank" rel="noopener noreferrer" className="bg-black/30 rounded-lg p-3 hover:bg-black/50 transition-colors">
                  <div className="text-emerald-400 font-semibold text-sm">Market Data</div>
                  <div className="text-xs text-gray-400">Occupancy, ADR & revenue by ZIP code</div>
                </a>
                <a href="https://www.rabbu.com/str-spreadsheet" target="_blank" rel="noopener noreferrer" className="bg-black/30 rounded-lg p-3 hover:bg-black/50 transition-colors">
                  <div className="text-emerald-400 font-semibold text-sm">STR Spreadsheet</div>
                  <div className="text-xs text-gray-400">Free analysis template for STR investments</div>
                </a>
              </div>
              <p className="text-xs text-gray-400 mt-3"><strong className="text-emerald-400">Pro Tip:</strong> Use Rabbu's Airbnb Calculator to verify the rental income projections in this model. Monthly revenue typically ranges from $1,300/mo (studios) to $10,000+/mo (6+ bedrooms) depending on market and property type.</p>
            </div>
          </div>
        </div>

        <ExecutiveSummary
          pageTitle="Real Estate Mogul"
          whatItDoes="This estate planning tool provides institutional-grade analysis of your financial situation, modeling multiple scenarios and projecting outcomes based on your specific inputs. It transforms complex estate planning concepts into clear, actionable insights with dollar-quantified recommendations."
          opportunities="Without proper estate planning, your heirs could lose 40% or more of your wealth to estate taxes and probate costs. Strategic planning can preserve nearly all of it."
          intent="To give you the same caliber of estate planning analysis that institutional investors and ultra-high-net-worth families receive — now accessible to every client."
          takeaway="Understanding your estate planning options with precise dollar amounts empowers you to make confident decisions that compound into significant wealth over time."
          callToAction="Enter your numbers and see exactly how estate planning strategies can improve your financial outcome."
          followUpQuestions={[
            "How does this estate planning strategy interact with my other financial plans?",
            "What\'s the single biggest estate planning opportunity I\'m currently missing?",
            "How would my results change if I started this strategy 5 years earlier?",
          ]}
        />
        <GoalsAccelerator pageName="Real Estate Mogul" pageContext="Real Estate Mogul — estate planning modeling with projections and scenario analysis" />
        <TaxBracketPanel grossIncome={clientData?.annualIncome || 150000} filingStatus={clientData?.filingStatus || "single"} stateCode={clientData?.state || "TX"} />
        <RecommendationSummary
          headline="This estate planning strategy can significantly improve your financial outcome"
          detail="Based on your profile, implementing the recommended estate planning approach could generate substantial savings and growth over your planning horizon."
          dollarBenefit={800000}
          timeHorizon="20 years"
          confidence="high"
          nextStep="Review with your advisor"
        />
        <DoNothingBaseline
          metrics={[
            { label: "Estate Tax Exposure", doNothing: 500000, recommended: 50000, format: "currency", higherIsBetter: false },
            { label: "Wealth Transferred", doNothing: 1500000, recommended: 2300000, format: "currency" },
            { label: "Probate Avoidance", doNothing: 0, recommended: 95, format: "percent" },
          ]}
          summary="Without taking action on estate planning, you leave significant value on the table that compounds into a major opportunity cost over time."
        />
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-xl border shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 rounded-lg">
                <Building2 className="w-8 h-8 text-emerald-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Real Estate Mogul</h1>
                <p className="text-muted-foreground mt-1 flex items-center gap-2">
                  <span>Build your rental empire — up to 150 properties</span>
                  <Badge variant="outline" className="text-xs bg-emerald-500/5 text-emerald-500 border-emerald-500/20">
                    Pro Tier
                  </Badge>
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ExportToSlides toolName="Report" getSections={() => [{ title: "Overview", content: "Report data" }]} />
            <Button variant="outline" onClick={handleAnalyzePortfolio} disabled={analyzePortfolioMutation.isPending}>
              {analyzePortfolioMutation.isPending ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2 text-amber-500" />}
              AI Analyze
            </Button>
            <Button onClick={handleSaveScenario} disabled={saveScenarioMutation.isPending}>
              <Save className="w-4 h-4 mr-2" /> Save Scenario
            </Button>
          </div>
        </div>

        {/* Global Settings & Market Data Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="md:col-span-3 bg-gradient-to-r from-slate-900 to-slate-800 text-white border-none">
            <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400">Total Portfolio Value</span>
                  <span className="text-xl font-bold text-emerald-400">{fmt(totalPropertyValue)}</span>
                </div>
                <div className="h-8 w-px bg-slate-700"></div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400">Monthly Cash Flow</span>
                  <span className="text-xl font-bold text-amber-400">{fmt(totalMonthlyCashFlow)}</span>
                </div>
                <div className="h-8 w-px bg-slate-700"></div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400">Avg Cash on Cash</span>
                  <span className="text-xl font-bold text-blue-400">{pct(avgCashOnCash)}</span>
                </div>
                <div className="h-8 w-px bg-slate-700"></div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400">Portfolio Cap Rate</span>
                  <span className="text-xl font-bold text-purple-400">{pct(portfolioCapRate)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-slate-300">Projection:</Label>
                <Select value={String(projectionYears)} onValueChange={v => setProjectionYears(Number(v))}>
                  <SelectTrigger className="w-24 h-8 bg-slate-800 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[5, 10, 15, 20, 25, 30, 40, 50].map((y) => <SelectItem key={y} value={String(y)}>{y} years</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800">
            <CardContent className="p-4 flex items-center justify-between h-full">
              <div>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Market Data ({properties[0]?.state || "TX"})
                </span>
                {marketData ? (
                  <div className="mt-1">
                    <div className="text-sm font-medium">Avg Rent: {fmt(marketData.averageRent || 2000)}</div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> +{marketData.yoyGrowth || 4.2}% YoY
                    </div>
                  </div>
                ) : (
                  <div className="mt-1 text-sm text-muted-foreground animate-pulse">Loading market data...</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 mb-8 h-auto p-1">
            <TabsTrigger value="portfolio" className="py-2.5"><Building2 className="w-4 h-4 mr-2" /> Portfolio</TabsTrigger>
            <TabsTrigger value="analysis" className="py-2.5"><BarChart3 className="w-4 h-4 mr-2" /> Analysis</TabsTrigger>
            <TabsTrigger value="projection" className="py-2.5"><TrendingUp className="w-4 h-4 mr-2" /> Projection</TabsTrigger>
            <TabsTrigger value="iul" className="py-2.5"><Shield className="w-4 h-4 mr-2" /> IUL Strategy</TabsTrigger>
            <TabsTrigger value="tax" className="py-2.5"><Percent className="w-4 h-4 mr-2" /> Tax Strategy</TabsTrigger>
            <TabsTrigger value="wealth" className="py-2.5"><Sparkles className="w-4 h-4 mr-2" /> Total Wealth</TabsTrigger>
          
            <TabsTrigger value="generate-outcome" className="text-xs sm:text-sm bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 font-bold">Generate Outcome</TabsTrigger>
          </TabsList>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="space-y-6 animate-in fade-in-50 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold">Property Roster</h2>
                <p className="text-sm text-muted-foreground">{properties.length} properties in your portfolio</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center space-x-2 mr-4 bg-muted/50 p-1.5 rounded-lg border">
                  <Switch id="advanced-mode" checked={showAdvanced} onCheckedChange={setShowAdvanced} />
                  <Label htmlFor="advanced-mode" className="text-xs cursor-pointer">Advanced Mode</Label>
                </div>
                <Button onClick={addProperty} size="sm" variant="default" className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-1" /> Add Property
                </Button>
                <Button onClick={() => addBulk(5)} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-1" /> Add 5
                </Button>
                <Button onClick={() => addBulk(20)} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-1" /> Add 20
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Property List Sidebar */}
              <div className="lg:col-span-1 space-y-2 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
                {properties.map((p) => {
                  const calc = portfolioCalcs.find((pc) => pc.property.id === p.id)?.calc;
                  const isSelected = selectedPropertyId === p.id;
                  
                  return (
                    <div 
                      key={p.id}
                      onClick={() => setSelectedPropertyId(p.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                        isSelected 
                          ? 'border-emerald-500 bg-emerald-500/10 shadow-sm' 
                          : 'border-border hover:border-emerald-500/50 hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-medium text-sm truncate pr-2">{p.name}</h4>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                          {p.state}
                        </Badge>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-2">
                        <span>{fmt(p.purchasePrice)}</span>
                        <span className={calc && calc.monthlyCashFlow > 0 ? "text-emerald-500 font-medium" : "text-red-500 font-medium"}>
                          {fmt(calc?.monthlyCashFlow || 0)}/mo
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Selected Property Details */}
              <div className="lg:col-span-3">
                {properties.filter((p) => p.id === selectedPropertyId).map((p) => {
                  const calc = portfolioCalcs.find((pc) => pc.property.id === p.id)?.calc;
                  
                  return (
                    <Card key={`detail-${p.id}`} className="border-emerald-500/20 shadow-md">
                      <CardHeader className="bg-muted/30 pb-4 border-b">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl flex items-center gap-2">
                              {p.name}
                              <Badge variant="secondary">{PROPERTY_TYPES.find((pt) => pt.value === p.propertyType)?.label}</Badge>
                            </CardTitle>
                            <CardDescription className="mt-1">
                              Detailed property metrics and assumptions
                            </CardDescription>
                          </div>
                          <Button variant="ghost" size="icon" onClick={() => removeProperty(p.id)} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6">
                        {renderPropertyForm(p)}
                        
                        {calc && (
                          <div className="mt-8 pt-6 border-t grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                              <div className="text-xs text-muted-foreground mb-1">Monthly Cash Flow</div>
                              <div className={`text-lg font-bold ${calc.monthlyCashFlow >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                {fmt(calc.monthlyCashFlow)}
                              </div>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                              <div className="text-xs text-muted-foreground mb-1">Cash on Cash</div>
                              <div className="text-lg font-bold text-blue-500">{pct(calc.cashOnCash)}</div>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                              <div className="text-xs text-muted-foreground mb-1">Cap Rate</div>
                              <div className="text-lg font-bold text-purple-500">{pct(calc.capRate)}</div>
                            </div>
                            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                              <div className="text-xs text-muted-foreground mb-1">Initial Investment</div>
                              <div className="text-lg font-bold">{fmt(calc.initialInvestment)}</div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Portfolio Summary Table */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="w-5 h-5" /> Portfolio Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Property</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Value</th>
                        <th className="px-4 py-3">Investment</th>
                        <th className="px-4 py-3">Rent/mo</th>
                        <th className="px-4 py-3">NOI/yr</th>
                        <th className="px-4 py-3">Cash Flow/mo</th>
                        <th className="px-4 py-3">Cap Rate</th>
                        <th className="px-4 py-3 rounded-tr-lg">CoC Return</th>
                      </tr>
                    </thead>
                    <tbody>
                      {portfolioCalcs.map((pc, i) => (
                        <tr key={pc.property.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 font-medium">{pc.property.name}</td>
                          <td className="px-4 py-3 text-xs">
                            <Badge variant="outline">{PROPERTY_TYPES.find((pt) => pt.value === pc.property.propertyType)?.label || pc.property.propertyType}</Badge>
                          </td>
                          <td className="px-4 py-3">{fmt(pc.property.purchasePrice)}</td>
                          <td className="px-4 py-3">{fmt(pc.calc.initialInvestment)}</td>
                          <td className="px-4 py-3">{fmt(pc.property.monthlyRent)}</td>
                          <td className="px-4 py-3">{fmt(pc.calc.noi)}</td>
                          <td className={`px-4 py-3 font-medium ${pc.calc.monthlyCashFlow >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {fmt(pc.calc.monthlyCashFlow)}
                          </td>
                          <td className="px-4 py-3">{pct(pc.calc.capRate)}</td>
                          <td className="px-4 py-3 font-medium text-blue-500">{pct(pc.calc.cashOnCash)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="font-bold bg-muted/30">
                      <tr>
                        <td className="px-4 py-3 rounded-bl-lg" colSpan={2}>TOTALS ({properties.length})</td>
                        <td className="px-4 py-3">{fmt(totalPropertyValue)}</td>
                        <td className="px-4 py-3">{fmt(totalInitialInvestment)}</td>
                        <td className="px-4 py-3">{fmt(totalMonthlyRent)}</td>
                        <td className="px-4 py-3">{fmt(totalNOI)}</td>
                        <td className={`px-4 py-3 ${totalMonthlyCashFlow >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {fmt(totalMonthlyCashFlow)}
                        </td>
                        <td className="px-4 py-3">{pct(portfolioCapRate)}</td>
                        <td className="px-4 py-3 rounded-br-lg text-blue-500">{pct(avgCashOnCash)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6 animate-in fade-in-50 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1: Cash Flow Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-500" /> Monthly Cash Flow Breakdown
                  </CardTitle>
                  <CardDescription>Rent vs Mortgage vs Expenses</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cashFlowAnalysisData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tickFormatter={(val) => `$${val/1000}k`} tick={{ fontSize: 12 }} />
                      <RTooltip 
                        formatter={(value: number) => [fmt(value), undefined]}
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: 'none', borderRadius: '8px', color: '#fff' }}
                      />
                      <Legend />
                      <Bar dataKey="rent" name="Gross Rent" fill={COLORS[0]} stackId="a" />
                      <Bar dataKey="mortgage" name="Mortgage" fill={COLORS[3]} stackId="b" />
                      <Bar dataKey="expenses" name="Expenses" fill={COLORS[2]} stackId="b" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Chart 2: Property Type Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-blue-500" /> Portfolio Composition
                  </CardTitle>
                  <CardDescription>By property type value</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={propertyTypeDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {propertyTypeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RTooltip formatter={(value: number) => [fmt(value), "Value"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Chart 3: Geographic Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-500" /> Geographic Diversification
                  </CardTitle>
                  <CardDescription>Number of properties by state</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stateDistribution} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.2} />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={50} />
                      <RTooltip />
                      <Bar dataKey="count" name="Properties" fill={COLORS[1]} radius={[0, 4, 4, 0]}>
                        {stateDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Chart 4: Risk Analysis Radar */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-purple-500" /> Portfolio Risk Metrics
                  </CardTitle>
                  <CardDescription>Normalized risk factors (0-100, lower is better)</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                      { subject: 'Leverage', A: Math.min(100, (totalPropertyValue - totalInitialInvestment) / totalPropertyValue * 100), fullMark: 100 },
                      { subject: 'Vacancy Risk', A: properties.reduce((s, p) => s + p.vacancy, 0) / properties.length * 5, fullMark: 100 }, // Scaled
                      { subject: 'Concentration', A: Math.max(...propertyTypeDistribution.map((d) => d.value)) / totalPropertyValue * 100, fullMark: 100 },
                      { subject: 'Cash Flow Buffer', A: Math.max(0, 100 - (totalMonthlyCashFlow / totalMonthlyRent * 100)), fullMark: 100 },
                      { subject: 'Age Risk', A: Math.min(100, (2025 - (properties.reduce((s, p) => s + p.yearBuilt, 0) / properties.length)) * 2), fullMark: 100 },
                    ]}>
                      <PolarGrid strokeOpacity={0.2} />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar name="Portfolio Risk" dataKey="A" stroke={COLORS[4]} fill={COLORS[4]} fillOpacity={0.4} />
                      <RTooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Projection Tab */}
          <TabsContent value="projection" className="space-y-6 animate-in fade-in-50 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-emerald-500/20 bg-emerald-500/5">
                <CardContent className="py-6 text-center">
                  <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-1">Future Portfolio Value</p>
                  <p className="text-4xl font-black text-emerald-500">{fmt(totalFutureValue)}</p>
                  <p className="text-xs text-muted-foreground mt-2">After {projectionYears} years of appreciation</p>
                </CardContent>
              </Card>
              <Card className="border-blue-500/20 bg-blue-500/5">
                <CardContent className="py-6 text-center">
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">Total Equity Built</p>
                  <p className="text-4xl font-black text-blue-500">{fmt(totalEquity)}</p>
                  <p className="text-xs text-muted-foreground mt-2">Appreciation + mortgage paydown</p>
                </CardContent>
              </Card>
              <Card className="border-amber-500/20 bg-amber-500/5">
                <CardContent className="py-6 text-center">
                  <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-1">Annual Cash Flow (Year {projectionYears})</p>
                  <p className="text-4xl font-black text-amber-500">
                    {fmt(portfolioCalcs.reduce((s, pc) => s + (pc.calc.projection[projectionYears]?.annualCashFlow ?? 0), 0))}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Passive income stream</p>
                </CardContent>
              </Card>
            </div>

            {/* Chart 5: Equity Growth Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <LineChartIcon className="w-4 h-4 text-blue-500" /> Wealth Accumulation Timeline
                </CardTitle>
                <CardDescription>Property Value vs Loan Balance vs Equity over {projectionYears} years</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={timelineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                    <XAxis dataKey="year" tickFormatter={(val) => `Yr ${val}`} />
                    <YAxis yAxisId="left" tickFormatter={(val) => `$${val/1000000}M`} />
                    <YAxis yAxisId="right" orientation="right" tickFormatter={(val) => `$${val/1000}k`} />
                    <RTooltip 
                      formatter={(value: number, name: string) => [fmt(value), name === 'reCashFlow' ? 'Annual Cash Flow' : name === 'reValue' ? 'Property Value' : 'Total Equity']}
                      labelFormatter={(label) => `Year ${label}`}
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: 'none', borderRadius: '8px', color: '#fff' }}
                    />
                    <Legend />
                    <Area yAxisId="left" type="monotone" dataKey="reValue" name="Property Value" fill={COLORS[0]} stroke={COLORS[0]} fillOpacity={0.1} />
                    <Area yAxisId="left" type="monotone" dataKey="reEquity" name="Total Equity" fill={COLORS[1]} stroke={COLORS[1]} fillOpacity={0.3} />
                    <Line yAxisId="right" type="monotone" dataKey="reCashFlow" name="Annual Cash Flow" stroke={COLORS[2]} strokeWidth={3} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Year-by-year table */}
            {portfolioCalcs.length > 0 && (
              <Card className="border-muted/30">
                <CardHeader>
                  <CardTitle className="text-sm">Portfolio Growth Timeline (Data Table)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left py-3 px-4 rounded-tl-lg">Year</th>
                          <th className="text-right py-3 px-4">Portfolio Value</th>
                          <th className="text-right py-3 px-4">Loan Balance</th>
                          <th className="text-right py-3 px-4">Total Equity</th>
                          <th className="text-right py-3 px-4">Annual Rent</th>
                          <th className="text-right py-3 px-4">Annual Expenses</th>
                          <th className="text-right py-3 px-4 rounded-tr-lg">Annual Cash Flow</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[0, 1, 2, 3, 4, 5, 10, 15, 20, 25, 30, 40, 50].filter((y) => y <= projectionYears).map((year) => {
                          const totalVal = portfolioCalcs.reduce((s, pc) => s + (pc.calc.projection[year]?.propertyValue ?? 0), 0);
                          const totalLoan = portfolioCalcs.reduce((s, pc) => s + (pc.calc.projection[year]?.loanBalance ?? 0), 0);
                          const totalEq = portfolioCalcs.reduce((s, pc) => s + (pc.calc.projection[year]?.equity ?? 0), 0);
                          const totalRent = portfolioCalcs.reduce((s, pc) => s + (pc.calc.projection[year]?.annualRent ?? 0), 0);
                          const totalExp = portfolioCalcs.reduce((s, pc) => s + (pc.calc.projection[year]?.annualExpenses ?? 0), 0);
                          const totalCf = portfolioCalcs.reduce((s, pc) => s + (pc.calc.projection[year]?.annualCashFlow ?? 0), 0);
                          return (
                            <tr key={year} className="border-b border-muted/20 hover:bg-muted/10">
                              <td className="py-3 px-4 font-medium">Year {year}</td>
                              <td className="py-3 px-4 text-right text-emerald-500">{fmt(totalVal)}</td>
                              <td className="py-3 px-4 text-right text-red-400">{fmt(totalLoan)}</td>
                              <td className="py-3 px-4 text-right text-blue-500 font-medium">{fmt(totalEq)}</td>
                              <td className="py-3 px-4 text-right">{fmt(totalRent)}</td>
                              <td className="py-3 px-4 text-right">{fmt(totalExp)}</td>
                              <td className={`py-3 px-4 text-right font-bold ${totalCf >= 0 ? "text-emerald-500" : "text-red-500"}`}>{fmt(totalCf)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* IUL Integration Tab */}
          <TabsContent value="iul" className="space-y-6 animate-in fade-in-50 duration-500">
            <Card className="border-blue-500/20 overflow-hidden">
              <div className="bg-blue-500/10 p-6 border-b border-blue-500/20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Shield className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">IUL Policy Integration</CardTitle>
                    <CardDescription className="text-blue-600/70 dark:text-blue-400/70">
                      Redirect rental cash flow into an IUL policy for tax-free retirement income + death benefit protection
                    </CardDescription>
                  </div>
                </div>
              </div>
              <CardContent className="p-6 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3 p-4 rounded-xl bg-muted/30 border">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-blue-500" /> Annual IUL Premium
                    </Label>
                    <div className="flex items-center gap-2">
                      <span className="text-lg text-muted-foreground">$</span>
                      <NumberInput value={iulPremium} onChange={setIulPremium} className="text-lg font-medium" />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Suggested (50% of cash flow):</span>
                      <span className="font-medium text-blue-500">{fmt(Math.max(0, totalMonthlyCashFlow * 12 * 0.5))}/yr</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-2 text-xs h-8"
                      onClick={() => setIulPremium(Math.round(totalMonthlyCashFlow * 12 * 0.5))}
                    >
                      Apply Suggested
                    </Button>
                  </div>
                  
                  <div className="space-y-3 p-4 rounded-xl bg-muted/30 border">
                    <Label className="text-sm font-semibold flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-500" /> Assumed Crediting Rate
                    </Label>
                    <div className="flex items-center gap-2">
                      <NumberInput value={iulRate} onChange={setIulRate} className="text-lg font-medium" step={0.1} />
                      <span className="text-lg text-muted-foreground">%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Historical average is typically 6-8% depending on caps and participation rates.
                    </p>
                  </div>
                  
                  <div className="space-y-3 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
                    <Label className="text-sm font-semibold flex items-center gap-2 text-blue-600 dark:text-blue-400">
                      <Calendar className="w-4 h-4" /> Projection Period
                    </Label>
                    <div className="text-3xl font-black text-blue-500 mt-2">{projectionYears} years</div>
                    <p className="text-xs text-blue-600/70 dark:text-blue-400/70">
                      Matches real estate projection timeline
                    </p>
                  </div>
                </div>

                {/* ─── Ibbotson Model Toggle ─── */}
                <div className="p-4 rounded-xl border bg-card">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <Label className="text-base font-semibold flex items-center gap-2">
                        <Activity className="w-4 h-4 text-purple-500" /> Use Ibbotson Historical Model
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Simulate returns using actual historical S&P 500 data sequences
                      </p>
                    </div>
                    <Switch checked={useIbbotsonModel} onCheckedChange={setUseIbbotsonModel} />
                  </div>
                  {useIbbotsonModel && (
                    <div className="pt-4 border-t">
                      <IbbotsonYearSelector
                        startYear={ibbotsonStartYear}
                        onStartYearChange={setIbbotsonStartYear}
                        capRate={iulRate / 100}
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-emerald-500/30 shadow-sm">
                    <CardContent className="py-6 text-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                        <PiggyBank className="w-5 h-5 text-emerald-500" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">IUL Cash Value</p>
                      <p className="text-3xl font-black text-emerald-500">{fmt(iulFinalValue)}</p>
                      <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70 mt-2 font-medium">Tax-free growth after {projectionYears} years</p>
                    </CardContent>
                  </Card>
                  <Card className="border-blue-500/30 shadow-sm">
                    <CardContent className="py-6 text-center">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                        <Wallet className="w-5 h-5 text-blue-500" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Total Premiums Paid</p>
                      <p className="text-3xl font-black text-blue-500">{fmt(iulPremium * projectionYears)}</p>
                      <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-2 font-medium">Funded by real estate cash flow</p>
                    </CardContent>
                  </Card>
                  <Card className="border-purple-500/30 shadow-sm">
                    <CardContent className="py-6 text-center">
                      <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-3">
                        <ArrowUpRight className="w-5 h-5 text-purple-500" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Tax-Free Income Potential</p>
                      <p className="text-3xl font-black text-purple-500">{fmt(iulFinalValue * 0.05)}<span className="text-lg font-normal">/yr</span></p>
                      <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-2 font-medium">Based on 5% policy loan rate</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Chart 6: IUL Growth */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">IUL Cash Value vs Premiums Paid</h3>
                  <div className="h-[300px] border rounded-xl p-4 bg-card">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={iulProjection} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                        <XAxis dataKey="year" tickFormatter={(val) => `Yr ${val}`} />
                        <YAxis tickFormatter={(val) => `$${val/1000}k`} />
                        <RTooltip 
                          formatter={(value: number, name: string) => [fmt(value), name === 'cashValue' ? 'Cash Value' : 'Cumulative Premiums']}
                          labelFormatter={(label) => `Year ${label}`}
                        />
                        <Legend />
                        <Area type="monotone" dataKey="cashValue" name="Cash Value" fill={COLORS[1]} stroke={COLORS[1]} fillOpacity={0.3} />
                        <Area type="monotone" dataKey={(d) => d.premium * d.year} name="Premiums Paid" fill={COLORS[3]} stroke={COLORS[3]} fillOpacity={0.1} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <Sparkles className="w-5 h-5" /> The Infinite Banking Pipeline Strategy
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ol className="space-y-3 text-sm list-decimal list-inside">
                      <li className="pl-2"><span className="font-semibold">Generate:</span> Rental properties produce <span className="text-emerald-500 font-bold">{fmt(totalMonthlyCashFlow * 12)}/yr</span> in passive cash flow.</li>
                      <li className="pl-2"><span className="font-semibold">Redirect:</span> Funnel <span className="text-blue-500 font-bold">{fmt(iulPremium)}/yr</span> of that cash flow into an IUL policy.</li>
                      <li className="pl-2"><span className="font-semibold">Compound:</span> Cash value grows tax-free, protected from market downturns via a 0% floor.</li>
                      <li className="pl-2"><span className="font-semibold">Harvest:</span> After {projectionYears} years, access <span className="text-purple-500 font-bold">{fmt(iulFinalValue * 0.05)}/yr</span> via tax-free policy loans.</li>
                      <li className="pl-2"><span className="font-semibold">Protect:</span> A death benefit of <span className="font-bold">~{fmt(iulFinalValue * 1.5)}</span> transfers wealth tax-free to heirs.</li>
                    </ol>
                    <div className="bg-white/50 dark:bg-black/20 p-4 rounded-lg flex flex-col justify-center">
                      <div className="text-center mb-4">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Synergy Effect</span>
                      </div>
                      <div className="flex items-center justify-between px-4">
                        <div className="text-center">
                          <Building2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                          <div className="text-xs font-medium">Real Estate</div>
                          <div className="text-[10px] text-muted-foreground">Cash Flow Engine</div>
                        </div>
                        <div className="flex-1 flex items-center justify-center">
                          <div className="h-0.5 w-full bg-gradient-to-r from-emerald-500 to-blue-500 relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background p-1 rounded-full border">
                              <ArrowUpRight className="w-3 h-3 text-muted-foreground" />
                            </div>
                          </div>
                        </div>
                        <div className="text-center">
                          <Shield className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                          <div className="text-xs font-medium">IUL Policy</div>
                          <div className="text-[10px] text-muted-foreground">Tax-Free Vault</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tax Strategy Tab */}
          <TabsContent value="tax" className="space-y-6 animate-in fade-in-50 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Percent className="w-5 h-5 text-amber-500" /> Tax Mitigation Strategy
                    </CardTitle>
                    <CardDescription>Leverage depreciation and energy investments to offset income</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Marginal Tax Bracket (%)</Label>
                        <Select value={String(taxBracket)} onValueChange={v => setTaxBracket(Number(v))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="22">22%</SelectItem>
                            <SelectItem value="24">24%</SelectItem>
                            <SelectItem value="32">32%</SelectItem>
                            <SelectItem value="35">35%</SelectItem>
                            <SelectItem value="37">37% (Highest)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Depreciation Schedule</Label>
                        <Select value={String(depreciationYears)} onValueChange={v => setDepreciationYears(Number(v))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="27.5">27.5 Years (Residential)</SelectItem>
                            <SelectItem value="39">39 Years (Commercial)</SelectItem>
                            <SelectItem value="15">15 Years (Cost Segregation Avg)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-muted/30 border">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-500" /> Real Estate Depreciation Shield
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground">Est. Building Value (80%)</p>
                          <p className="text-lg font-bold">{fmt(totalPropertyValue * 0.8)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Annual Depreciation</p>
                          <p className="text-lg font-bold text-emerald-500">{fmt((totalPropertyValue * 0.8) / depreciationYears)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Annual Tax Savings</p>
                          <p className="text-lg font-bold text-blue-500">{fmt(((totalPropertyValue * 0.8) / depreciationYears) * (taxBracket / 100))}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-4 italic">
                        *Assuming 80% of purchase price is depreciable building value. Land cannot be depreciated.
                      </p>
                    </div>

                    <div className="mt-6">
                      <OilGasToggle
                        taxableIncome={clientData?.annualIncome ?? 250000}
                        onChange={(result) => {
                          setOilGasEnabled(result.enabled);
                          if (result.enabled) setOilGasAmount(result.investmentAmount);
                        }}
                        defaultInvestment={oilGasAmount}
                      />
                    </div>
                  </CardContent>
                </Card>

                {oilGasEnabled && (
                  <Card className="border-amber-500/20">
                    <CardHeader>
                      <CardTitle className="text-sm">Oil & Gas Projection Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50">
                            <tr>
                              <th className="text-left py-2 px-3 rounded-tl-lg">Year</th>
                              <th className="text-right py-2 px-3">Annual Income</th>
                              <th className="text-right py-2 px-3">Cumulative Income</th>
                              <th className="text-right py-2 px-3">Tax Savings</th>
                              <th className="text-right py-2 px-3 rounded-tr-lg">Principal Return</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[1, 2, 3, 5, 10].filter((y) => y <= projectionYears).map((year) => {
                              const data = oilGasProjection.yearlyData[year];
                              if (!data) return null;
                              return (
                                <tr key={`og-${year}`} className="border-b border-muted/20">
                                  <td className="py-2 px-3 font-medium">Year {year}</td>
                                  <td className="py-2 px-3 text-right text-amber-500">{fmt(data.income)}</td>
                                  <td className="py-2 px-3 text-right">{fmt(data.cumulativeIncome)}</td>
                                  <td className="py-2 px-3 text-right text-blue-500">{fmt(data.taxSavings)}</td>
                                  <td className="py-2 px-3 text-right">{fmt(data.principal)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot className="font-bold bg-muted/30">
                            <tr>
                              <td className="py-2 px-3 rounded-bl-lg">TOTALS</td>
                              <td className="py-2 px-3 text-right text-amber-500">-</td>
                              <td className="py-2 px-3 text-right">{fmt(oilGasProjection.totalIncome)}</td>
                              <td className="py-2 px-3 text-right text-blue-500">{fmt(oilGasProjection.taxSavings)}</td>
                              <td className="py-2 px-3 text-right rounded-br-lg">{fmt(oilGasProjection.principalReturn)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="space-y-6">
                <Card className="bg-slate-900 text-white border-none shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5 text-emerald-400" /> Year 1 Tax Impact
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-700">
                      <span className="text-slate-300 text-sm">Real Estate Cash Flow</span>
                      <span className="font-medium">{fmt(totalMonthlyCashFlow * 12)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-700">
                      <span className="text-slate-300 text-sm">Real Estate Depreciation</span>
                      <span className="font-medium text-red-400">-{fmt((totalPropertyValue * 0.8) / depreciationYears)}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-slate-700">
                      <span className="text-slate-300 text-sm">Taxable RE Income</span>
                      <span className="font-medium text-amber-400">
                        {fmt(Math.max(0, (totalMonthlyCashFlow * 12) - ((totalPropertyValue * 0.8) / depreciationYears)))}
                      </span>
                    </div>
                    
                    {oilGasEnabled && (
                      <>
                        <div className="pt-2 flex justify-between items-center pb-2 border-b border-slate-700">
                          <span className="text-slate-300 text-sm">O&G Investment</span>
                          <span className="font-medium">{fmt(oilGasAmount)}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-slate-700">
                          <span className="text-slate-300 text-sm">Intangible Drilling Costs (85%)</span>
                          <span className="font-medium text-red-400">-{fmt(oilGasAmount * 0.85)}</span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-slate-700">
                          <span className="text-slate-300 text-sm">Tax Savings ({taxBracket}%)</span>
                          <span className="font-bold text-emerald-400">+{fmt((oilGasAmount * 0.85) * (taxBracket / 100))}</span>
                        </div>
                      </>
                    )}
                    
                    <div className="pt-4 mt-4 border-t-2 border-slate-600 flex justify-between items-center">
                      <span className="font-bold">Total Year 1 Tax Savings</span>
                      <span className="text-2xl font-black text-emerald-400">
                        {fmt(
                          (((totalPropertyValue * 0.8) / depreciationYears) * (taxBracket / 100)) + 
                          (oilGasEnabled ? (oilGasAmount * 0.85) * (taxBracket / 100) : 0)
                        )}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Total Wealth Tab */}
          <TabsContent value="wealth" className="space-y-6 animate-in fade-in-50 duration-500">
            <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-background to-emerald-500/5 shadow-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>
              
              <CardHeader className="text-center relative z-10">
                <CardTitle className="text-3xl flex items-center justify-center gap-2">
                  <Sparkles className="w-8 h-8 text-amber-500" /> Total Wealth Projection
                </CardTitle>
                <CardDescription className="text-base mt-2">Combined real estate + IUL + oil & gas after {projectionYears} years</CardDescription>
              </CardHeader>
              <CardContent className="space-y-10 relative z-10">
                <div className="text-center">
                  <p className="text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r from-amber-500 via-emerald-500 to-blue-500 drop-shadow-sm">
                    {fmt(grandTotalWealth)}
                  </p>
                  <p className="text-sm font-medium text-muted-foreground mt-4 uppercase tracking-widest">Grand Total Projected Wealth</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                  <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center transform transition-transform hover:scale-105">
                    <Home className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-1">Real Estate Equity</p>
                    <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-500">{fmt(totalEquity)}</p>
                    <p className="text-xs text-muted-foreground mt-2">{properties.length} properties, net of debt</p>
                    <div className="mt-4 flex items-center gap-2 text-xs">
                      <Progress value={(totalEquity / grandTotalWealth) * 100} className="h-2 flex-1 [&>div]:bg-emerald-500" />
                      <span className="font-medium">{pct((totalEquity / grandTotalWealth) * 100)}</span>
                    </div>
                  </div>
                  
                  <div className="p-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center transform transition-transform hover:scale-105">
                    <Shield className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-1">IUL Cash Value</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-500">{fmt(iulFinalValue)}</p>
                    <p className="text-xs text-muted-foreground mt-2">Tax-free accessible capital</p>
                    <div className="mt-4 flex items-center gap-2 text-xs">
                      <Progress value={(iulFinalValue / grandTotalWealth) * 100} className="h-2 flex-1 [&>div]:bg-blue-500" />
                      <span className="font-medium">{pct((iulFinalValue / grandTotalWealth) * 100)}</span>
                    </div>
                  </div>
                  
                  <div className={`p-6 rounded-2xl border text-center transform transition-transform hover:scale-105 ${oilGasEnabled ? 'bg-amber-500/10 border-amber-500/20' : 'bg-muted/30 border-muted opacity-50 grayscale'}`}>
                    <DollarSign className={`w-8 h-8 mx-auto mb-3 ${oilGasEnabled ? 'text-amber-500' : 'text-muted-foreground'}`} />
                    <p className={`text-sm font-semibold mb-1 ${oilGasEnabled ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground'}`}>Oil & Gas Returns</p>
                    <p className={`text-3xl font-bold ${oilGasEnabled ? 'text-amber-600 dark:text-amber-500' : 'text-muted-foreground'}`}>
                      {fmt(oilGasEnabled ? oilGasProjection.totalIncome + oilGasProjection.principalReturn : 0)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">Income + principal return</p>
                    <div className="mt-4 flex items-center gap-2 text-xs">
                      <Progress 
                        value={oilGasEnabled ? ((oilGasProjection.totalIncome + oilGasProjection.principalReturn) / grandTotalWealth) * 100 : 0} 
                        className="h-2 flex-1 [&>div]:bg-amber-500" 
                      />
                      <span className="font-medium">
                        {oilGasEnabled ? pct(((oilGasProjection.totalIncome + oilGasProjection.principalReturn) / grandTotalWealth) * 100) : '0.00%'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto mt-8">
                  {/* Chart 7: Wealth Composition Pie */}
                  <Card className="bg-background/50 backdrop-blur-sm border-muted/50">
                    <CardHeader>
                      <CardTitle className="text-base text-center">Wealth Composition at Year {projectionYears}</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={wealthCompositionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            {wealthCompositionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RTooltip formatter={(value: number) => [fmt(value), "Value"]} />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Income Streams Summary */}
                  <Card className="bg-slate-900 text-white border-none shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="w-5 h-5 text-emerald-400" /> Target Passive Income
                      </CardTitle>
                      <CardDescription className="text-slate-400">Annual streams at Year {projectionYears}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                          <span className="text-sm flex items-center gap-2 font-medium">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            Real Estate Cash Flow
                          </span>
                          <span className="font-bold text-emerald-400 text-lg">
                            {fmt(portfolioCalcs.reduce((s, pc) => s + (pc.calc.projection[projectionYears]?.annualCashFlow ?? 0), 0))}/yr
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                          <span className="text-sm flex items-center gap-2 font-medium">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            IUL Tax-Free Loans (5%)
                          </span>
                          <span className="font-bold text-blue-400 text-lg">{fmt(iulFinalValue * 0.05)}/yr</span>
                        </div>
                        {oilGasEnabled && (
                          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                            <span className="text-sm flex items-center gap-2 font-medium">
                              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                              Oil & Gas Distributions
                            </span>
                            <span className="font-bold text-amber-400 text-lg">{fmt(oilGasAmount * 0.15)}/yr</span>
                          </div>
                        )}
                        <div className="mt-6 pt-4 border-t border-slate-700 flex items-center justify-between">
                          <span className="text-base font-bold uppercase tracking-wider text-slate-300">Total Annual Income</span>
                          <span className="text-3xl font-black text-white">
                            {fmt(
                              portfolioCalcs.reduce((s, pc) => s + (pc.calc.projection[projectionYears]?.annualCashFlow ?? 0), 0) + 
                              iulFinalValue * 0.05 + 
                              (oilGasEnabled ? oilGasAmount * 0.15 : 0)
                            )}<span className="text-lg text-slate-400 font-normal">/yr</span>
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        
          <TabsContent value="generate-outcome" className="space-y-6 mt-6">
            <GenerateOutcomeTab
              strategyType="real-estate-mogul"
              hasResults={true}
              resultData={{ totalEquity: 2000000, cashFlow: 120000, appreciation: 150000, properties: 5, leverageRatio: 3.5, projectionData: [] }}
              metrics={[{ label: "Total Equity", value: 2000000, highlight: true }, { label: "Annual Cash Flow", value: 120000 }, { label: "Appreciation", value: 150000 }, { label: "Properties", value: 5, format: "number" }]}
            />
          </TabsContent>
        </Tabs>

        <NAICDisclaimer variant="footer" showsProjections showsCashValues showsPolicyLoans />
      </div>
      <PageInsights pageId="real-estate-mogul" />
    
        <ComplianceFooter pageName="RealEstateMogul" showsIUL showsTax showsEstate showsProjections showsHistoricalData showsPolicyLoans />
      </AppShell>
  );
}
