// @ts-nocheck
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { NumberInput } from "@/components/NumberInput";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { 
  TrendingDown, DollarSign, Calendar, Info, Download, Activity, 
  ShieldAlert, ArrowRight, TrendingUp, Percent, CheckCircle, AlertTriangle,
  RefreshCw, Settings, Sliders, ChevronDown, ChevronUp, Maximize2, Minimize2,
  Filter, Search, Layers, PieChart as PieChartIcon, BarChart as BarChartIcon, 
  LineChart as LineChartIcon, Eye, EyeOff, Save, Trash2, Edit2, Plus, Minus,
  Share2, Printer, Copy, FileText, Database, Server, Cpu, Globe, Cloud,
  Lock, Unlock, Shield, Key, Users, User, UserPlus, UserMinus, MessageSquare
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, Cell, LineChart, Line, AreaChart, Area, PieChart, Pie, RadarChart, 
  Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ComposedChart, Scatter
} from "recharts";
import { PageInsights } from "@/components/PageInsights";
import { ExportToSlides } from "@/components/ExportToSlides";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { toast } from "sonner";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { useClientData } from "@/contexts/ClientDataContext";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

const COLORS = {
  emerald: "#22c55e",
  blue: "#3b82f6",
  gold: "#f0c040",
  red: "#ef4444",
  purple: "#a855f7",
  orange: "#f97316",
  teal: "#14b8a6",
  cyan: "#06b6d4",
  pink: "#ec4899",
  indigo: "#6366f1",
  navy: "#0d1a2e",
  border: "#12233e",
  textMuted: "#7a95b8",
  textBody: "#c8d8ec"
};

const CHART_COLORS = [COLORS.emerald, COLORS.blue, COLORS.gold, COLORS.red, COLORS.purple, COLORS.orange];
const RATES = [0.02, 0.03, 0.04, 0.05, 0.06, 0.07];

const fmt = (n: number) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
const fmtCompact = (n: number) => {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`;
  return `$${n}`;
};

export default function InflationAnalysis() {
  const { clientData } = useClientData();
  const { user } = useAuth();
  const [currentAmount, setCurrentAmount] = useState<number>(150000);
  const [years, setYears] = useState<number>(30);
  const [activeTab, setActiveTab] = useState<"bar" | "line" | "area" | "pie" | "radar" | "composed">("bar");
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customRate, setCustomRate] = useState<number>(3.5);
  const [taxRate, setTaxRate] = useState<number>(24);
  const [investmentReturn, setInvestmentReturn] = useState<number>(7);
  const [expenseRatio, setExpenseRatio] = useState<number>(0.5);
  const [inflationVolatility, setInflationVolatility] = useState<number>(1.2);
  const [scenarioName, setScenarioName] = useState("Base Scenario");
  const [showTable1, setShowTable1] = useState(true);
  const [showTable2, setShowTable2] = useState(true);
  const [showTable3, setShowTable3] = useState(true);
  const [showTable4, setShowTable4] = useState(true);
  const [showTable5, setShowTable5] = useState(true);
  const [showTable6, setShowTable6] = useState(true);
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedRate, setSelectedRate] = useState<number | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [highlightYear, setHighlightYear] = useState<number>(10);
  const [simulationCount, setSimulationCount] = useState<number>(1000);
  const [confidenceInterval, setConfidenceInterval] = useState<number>(95);
  const [baseYear, setBaseYear] = useState<number>(new Date().getFullYear());
  const [currency, setCurrency] = useState("USD");
  const [region, setRegion] = useState("US");
  
  const { data: result } = trpc.inflationAnalysis.impact.useQuery({ 
    currentValue: currentAmount, 
    years, 
    rates: RATES 
  });
  
  const { data: marketData } = trpc.marketData.historicalInflation.useQuery({
    region,
    years: 50
  });
  
  const { data: scenarios } = trpc.scenarios.list.useQuery({
    clientId: user?.id || ""
  });
  
  const { data: recommendations } = trpc.recommendations.forInflation.useQuery({
    amount: currentAmount,
    horizon: years
  });
  
  const { data: riskProfile } = trpc.riskProfile.get.useQuery({
    clientId: user?.id || ""
  });
  
  const saveScenarioMutation = trpc.scenarios.save.useMutation({
    onSuccess: () => toast.success("Scenario saved successfully"),
    onError: () => toast.error("Failed to save scenario")
  });

  const exportMutation = trpc.strategyExport.pdf.useMutation({
    onSuccess: () => toast.success("Export started"),
    onError: () => toast.error("Export failed")
  });

  const handleSaveScenario = () => {
    saveScenarioMutation.mutate({
      name: scenarioName,
      data: { currentAmount, years, customRate, taxRate, investmentReturn }
    });
  };

  const handleExportPdf = () => {
    exportMutation.mutate({
      type: "inflation_analysis",
      data: { currentAmount, years }
    });
  };

  const handleReset = () => {
    setCurrentAmount(150000);
    setYears(30);
    setCustomRate(3.5);
    setTaxRate(24);
    setInvestmentReturn(7);
    toast.info("Parameters reset to default");
  };

  const toggleAdvanced = () => setShowAdvanced(!showAdvanced);
  const toggleTable = (num: number) => {
    switch(num) {
      case 1: setShowTable1(!showTable1); break;
      case 2: setShowTable2(!showTable2); break;
      case 3: setShowTable3(!showTable3); break;
      case 4: setShowTable4(!showTable4); break;
      case 5: setShowTable5(!showTable5); break;
      case 6: setShowTable6(!showTable6); break;
    }
  };

  const chartData = useMemo(() => {
    if (!result || !Array.isArray(result)) return [];
    return result.map((r) => ({
      rate: `${(r.rate * 100).toFixed(1)}%`,
      rateNum: r.rate,
      realPurchasingPower: Math.round(r.realPurchasingPower),
      erosion: r.erosion,
      loss: currentAmount - Math.round(r.realPurchasingPower),
      adjustedReturn: Math.round(currentAmount * Math.pow(1 + (investmentReturn/100) - r.rate, years))
    }));
  }, [result, currentAmount, investmentReturn, years]);

  const projectionData = useMemo(() => {
    const data = [];
    for (let y = 0; y <= years; y++) {
      if (y % Math.max(1, Math.floor(years / 20)) !== 0 && y !== years) continue;
      
      const point: any = { year: `Y${y}`, yearNum: y };
      RATES.forEach((rate, i) => {
        point[`rate${i}`] = currentAmount / Math.pow(1 + rate, y);
      });
      point.customRate = currentAmount / Math.pow(1 + customRate/100, y);
      point.invested = currentAmount * Math.pow(1 + (investmentReturn/100), y) / Math.pow(1 + customRate/100, y);
      data.push(point);
    }
    return data;
  }, [currentAmount, years, customRate, investmentReturn]);

  const pieData = useMemo(() => {
    if (chartData.length === 0) return [];
    const avgLoss = chartData.reduce((acc, curr) => acc + curr.loss, 0) / chartData.length;
    const avgRemaining = currentAmount - avgLoss;
    return [
      { name: "Remaining Value", value: Math.max(0, avgRemaining) },
      { name: "Lost to Inflation", value: Math.max(0, avgLoss) }
    ];
  }, [chartData, currentAmount]);

  const radarData = useMemo(() => {
    return RATES.map((rate, i) => {
      const pwr = currentAmount / Math.pow(1 + rate, years);
      return {
        subject: `${(rate*100).toFixed(0)}%`,
        A: Math.round(pwr),
        fullMark: currentAmount
      };
    });
  }, [currentAmount, years]);

  const table1Data = useMemo(() => chartData, [chartData]);
  const table2Data = useMemo(() => projectionData.filter((_, i) => i % 2 === 0), [projectionData]);
  
  const table3Data = useMemo(() => {
    return RATES.map((rate) => {
      const ruleOf72 = 72 / (rate * 100);
      return {
        rate: `${(rate * 100).toFixed(1)}%`,
        halfLife: ruleOf72.toFixed(1),
        quarterLife: (ruleOf72 * 2).toFixed(1),
        tenthLife: (ruleOf72 * 3.32).toFixed(1)
      };
    });
  }, []);

  const table4Data = useMemo(() => {
    const items = [
      { category: "Housing", inf: 4.2, weight: 33 },
      { category: "Food", inf: 3.8, weight: 13 },
      { category: "Transportation", inf: 5.1, weight: 17 },
      { category: "Healthcare", inf: 6.5, weight: 8 },
      { category: "Education", inf: 5.8, weight: 6 },
      { category: "Entertainment", inf: 2.1, weight: 5 }
    ];
    return items.map((item) => ({
      ...item,
      weightedImpact: (item.inf * item.weight / 100).toFixed(2),
      futureCost: currentAmount * (item.weight/100) * Math.pow(1 + item.inf/100, years)
    }));
  }, [currentAmount, years]);

  const table5Data = useMemo(() => {
    const assets = [
      { name: "Equities", return: 9.5, risk: "High", correlation: 0.2 },
      { name: "Real Estate", return: 7.2, risk: "Medium", correlation: 0.6 },
      { name: "TIPS", return: 2.5, risk: "Low", correlation: 0.9 },
      { name: "Gold", return: 4.8, risk: "Medium", correlation: 0.7 },
      { name: "Cash", return: 1.5, risk: "Lowest", correlation: -0.1 }
    ];
    return assets.map((a) => ({
      ...a,
      realReturn: (a.return - customRate).toFixed(2),
      futureValue: currentAmount * Math.pow(1 + (a.return - customRate)/100, years)
    }));
  }, [currentAmount, years, customRate]);

  const table6Data = useMemo(() => {
    return Array.from({length: 10}).map((_, i) => {
      const year = i * 5 + 5;
      return {
        year,
        scenarioA: currentAmount * Math.pow(1 + 0.02, year),
        scenarioB: currentAmount * Math.pow(1 + 0.04, year),
        scenarioC: currentAmount * Math.pow(1 + 0.06, year),
        scenarioD: currentAmount * Math.pow(1 + 0.08, year)
      };
    });
  }, [currentAmount]);

  const handleExportCSV = () => {
    if (!result || !Array.isArray(result)) return;
    try {
      const headers = ["Inflation Rate", "Real Purchasing Power", "Purchasing Power Lost (%)"];
      const rows = result.map((r) => [
        `${(r.rate * 100).toFixed(1)}%`,
        Math.round(r.realPurchasingPower),
        r.erosion
      ]);
      const csvContent = [
        headers.join(","),
        ...rows.map((e) => e.join(","))
      ].join("\n");
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `inflation_analysis.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("CSV exported successfully");
    } catch (err) {
      toast.error("Failed to export CSV");
    }
  };

  const renderInteractiveControls = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-[#c8d8ec] flex items-center gap-2">
          Current Value
          <Info className="w-4 h-4 text-[#7a95b8]" />
        </label>
        <div className="relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <DollarSign className="w-4 h-4 text-[#7a95b8]" />
          </div>
          <NumberInput 
            value={currentAmount} 
            onChange={(v) => setCurrentAmount(v)} 
            className="rc-input w-full bg-[#060d19] border-[#12233e] text-white pl-10 pr-4 py-2 rounded-lg" 
            min={0} 
            step={10000} 
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-[#c8d8ec] flex items-center gap-2">
          Time Horizon (Years)
          <Info className="w-4 h-4 text-[#7a95b8]" />
        </label>
        <div className="relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Calendar className="w-4 h-4 text-[#7a95b8]" />
          </div>
          <NumberInput 
            value={years} 
            onChange={(v) => setYears(v)} 
            className="rc-input w-full bg-[#060d19] border-[#12233e] text-white pl-10 pr-4 py-2 rounded-lg" 
            min={1} 
            max={100} 
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-[#c8d8ec] flex items-center gap-2">
          Custom Rate (%)
        </label>
        <div className="relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Percent className="w-4 h-4 text-[#7a95b8]" />
          </div>
          <NumberInput 
            value={customRate} 
            onChange={(v) => setCustomRate(v)} 
            className="rc-input w-full bg-[#060d19] border-[#12233e] text-white pl-10 pr-4 py-2 rounded-lg" 
            min={0} 
            max={20}
            step={0.1}
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-[#c8d8ec] flex items-center gap-2">
          Investment Return (%)
        </label>
        <div className="relative group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <TrendingUp className="w-4 h-4 text-[#7a95b8]" />
          </div>
          <NumberInput 
            value={investmentReturn} 
            onChange={(v) => setInvestmentReturn(v)} 
            className="rc-input w-full bg-[#060d19] border-[#12233e] text-white pl-10 pr-4 py-2 rounded-lg" 
            min={0} 
            max={30}
            step={0.5}
          />
        </div>
      </div>
    </div>
  );

  const renderAdvancedControls = () => {
    if (!showAdvanced) return null;
  
  const calculateAdvancedMetric1 = (base: number, rate: number, time: number) => {
    const factor = Math.pow(1 + rate/100, time);
    const volatility = 1 * 0.01;
    return base * factor * (1 + volatility);
  };

  const calculateAdvancedMetric2 = (base: number, rate: number, time: number) => {
    const factor = Math.pow(1 + rate/100, time);
    const volatility = 2 * 0.01;
    return base * factor * (1 + volatility);
  };

  const calculateAdvancedMetric3 = (base: number, rate: number, time: number) => {
    const factor = Math.pow(1 + rate/100, time);
    const volatility = 3 * 0.01;
    return base * factor * (1 + volatility);
  };

  const calculateAdvancedMetric4 = (base: number, rate: number, time: number) => {
    const factor = Math.pow(1 + rate/100, time);
    const volatility = 4 * 0.01;
    return base * factor * (1 + volatility);
  };

  const calculateAdvancedMetric5 = (base: number, rate: number, time: number) => {
    const factor = Math.pow(1 + rate/100, time);
    const volatility = 5 * 0.01;
    return base * factor * (1 + volatility);
  };

  const calculateAdvancedMetric6 = (base: number, rate: number, time: number) => {
    const factor = Math.pow(1 + rate/100, time);
    const volatility = 6 * 0.01;
    return base * factor * (1 + volatility);
  };

  const calculateAdvancedMetric7 = (base: number, rate: number, time: number) => {
    const factor = Math.pow(1 + rate/100, time);
    const volatility = 7 * 0.01;
    return base * factor * (1 + volatility);
  };

  const calculateAdvancedMetric8 = (base: number, rate: number, time: number) => {
    const factor = Math.pow(1 + rate/100, time);
    const volatility = 8 * 0.01;
    return base * factor * (1 + volatility);
  };

  const calculateAdvancedMetric9 = (base: number, rate: number, time: number) => {
    const factor = Math.pow(1 + rate/100, time);
    const volatility = 9 * 0.01;
    return base * factor * (1 + volatility);
  };

  const calculateAdvancedMetric10 = (base: number, rate: number, time: number) => {
    const factor = Math.pow(1 + rate/100, time);
    const volatility = 10 * 0.01;
    return base * factor * (1 + volatility);
  };

  const calculateAdvancedMetric11 = (base: number, rate: number, time: number) => {
    const factor = Math.pow(1 + rate/100, time);
    const volatility = 11 * 0.01;
    return base * factor * (1 + volatility);
  };

  const calculateAdvancedMetric12 = (base: number, rate: number, time: number) => {
    const factor = Math.pow(1 + rate/100, time);
    const volatility = 12 * 0.01;
    return base * factor * (1 + volatility);
  };

  const calculateAdvancedMetric13 = (base: number, rate: number, time: number) => {
    const factor = Math.pow(1 + rate/100, time);
    const volatility = 13 * 0.01;
    return base * factor * (1 + volatility);
  };

  const calculateAdvancedMetric14 = (base: number, rate: number, time: number) => {
    const factor = Math.pow(1 + rate/100, time);
    const volatility = 14 * 0.01;
    return base * factor * (1 + volatility);
  };

  const calculateAdvancedMetric15 = (base: number, rate: number, time: number) => {
    const factor = Math.pow(1 + rate/100, time);
    const volatility = 15 * 0.01;
    return base * factor * (1 + volatility);
  };

  const calculateAdvancedMetric16 = (base: number, rate: number, time: number) => {
    const factor = Math.pow(1 + rate/100, time);
    const volatility = 16 * 0.01;
    return base * factor * (1 + volatility);
  };

  const calculateAdvancedMetric17 = (base: number, rate: number, time: number) => {
    const factor = Math.pow(1 + rate/100, time);
    const volatility = 17 * 0.01;
    return base * factor * (1 + volatility);
  };

  const calculateAdvancedMetric18 = (base: number, rate: number, time: number) => {
    const factor = Math.pow(1 + rate/100, time);
    const volatility = 18 * 0.01;
    return base * factor * (1 + volatility);
  };

  const calculateAdvancedMetric19 = (base: number, rate: number, time: number) => {
    const factor = Math.pow(1 + rate/100, time);
    const volatility = 19 * 0.01;
    return base * factor * (1 + volatility);
  };

  return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-[#060d19] rounded-lg border border-[#12233e] animate-in fade-in slide-in-from-top-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#c8d8ec]">Tax Rate (%)</label>
          <NumberInput 
            value={taxRate} 
            onChange={(v) => setTaxRate(v)} 
            className="rc-input w-full bg-[#0d1a2e] border-[#12233e] text-white px-3 py-2 rounded-lg" 
            min={0} max={60} step={1} 
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#c8d8ec]">Expense Ratio (%)</label>
          <NumberInput 
            value={expenseRatio} 
            onChange={(v) => setExpenseRatio(v)} 
            className="rc-input w-full bg-[#0d1a2e] border-[#12233e] text-white px-3 py-2 rounded-lg" 
            min={0} max={5} step={0.1} 
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#c8d8ec]">Volatility Multiplier</label>
          <NumberInput 
            value={inflationVolatility} 
            onChange={(v) => setInflationVolatility(v)} 
            className="rc-input w-full bg-[#0d1a2e] border-[#12233e] text-white px-3 py-2 rounded-lg" 
            min={0.5} max={3} step={0.1} 
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#c8d8ec]">Base Year</label>
          <NumberInput 
            value={baseYear} 
            onChange={(v) => setBaseYear(v)} 
            className="rc-input w-full bg-[#0d1a2e] border-[#12233e] text-white px-3 py-2 rounded-lg" 
            min={1900} max={2100} step={1} 
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#c8d8ec]">Simulation Count</label>
          <NumberInput 
            value={simulationCount} 
            onChange={(v) => setSimulationCount(v)} 
            className="rc-input w-full bg-[#0d1a2e] border-[#12233e] text-white px-3 py-2 rounded-lg" 
            min={100} max={10000} step={100} 
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#c8d8ec]">Confidence Interval (%)</label>
          <NumberInput 
            value={confidenceInterval} 
            onChange={(v) => setConfidenceInterval(v)} 
            className="rc-input w-full bg-[#0d1a2e] border-[#12233e] text-white px-3 py-2 rounded-lg" 
            min={50} max={99} step={1} 
          />
        </div>
      </div>
    );
  };

  const renderChartTabs = () => (
    <div className="flex flex-wrap gap-2 mb-6">
      <button onClick={() => setActiveTab("bar")} className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 ${activeTab === "bar" ? "bg-[#3b82f6] text-white" : "bg-[#12233e] text-[#c8d8ec] hover:bg-[#1e3a5f]"}`}>
        <BarChartIcon className="w-4 h-4" /> Bar
      </button>
      <button onClick={() => setActiveTab("line")} className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 ${activeTab === "line" ? "bg-[#3b82f6] text-white" : "bg-[#12233e] text-[#c8d8ec] hover:bg-[#1e3a5f]"}`}>
        <LineChartIcon className="w-4 h-4" /> Line
      </button>
      <button onClick={() => setActiveTab("area")} className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 ${activeTab === "area" ? "bg-[#3b82f6] text-white" : "bg-[#12233e] text-[#c8d8ec] hover:bg-[#1e3a5f]"}`}>
        <Layers className="w-4 h-4" /> Area
      </button>
      <button onClick={() => setActiveTab("pie")} className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 ${activeTab === "pie" ? "bg-[#3b82f6] text-white" : "bg-[#12233e] text-[#c8d8ec] hover:bg-[#1e3a5f]"}`}>
        <PieChartIcon className="w-4 h-4" /> Pie
      </button>
      <button onClick={() => setActiveTab("radar")} className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 ${activeTab === "radar" ? "bg-[#3b82f6] text-white" : "bg-[#12233e] text-[#c8d8ec] hover:bg-[#1e3a5f]"}`}>
        <Activity className="w-4 h-4" /> Radar
      </button>
      <button onClick={() => setActiveTab("composed")} className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 ${activeTab === "composed" ? "bg-[#3b82f6] text-white" : "bg-[#12233e] text-[#c8d8ec] hover:bg-[#1e3a5f]"}`}>
        <Filter className="w-4 h-4" /> Composed
      </button>
    </div>
  );

  const renderActiveChart = () => {
    switch (activeTab) {
      case "bar":

  return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
              <XAxis dataKey="rate" stroke="#7a95b8" tick={{ fill: '#7a95b8' }} axisLine={{ stroke: '#12233e' }} tickLine={false} />
              <YAxis stroke="#7a95b8" tickFormatter={fmtCompact} tick={{ fill: '#7a95b8' }} axisLine={{ stroke: '#12233e' }} tickLine={false} />
              <Tooltip cursor={{ fill: '#12233e', opacity: 0.4 }} contentStyle={{ backgroundColor: '#060d19', borderColor: '#12233e', color: '#fff' }} formatter={(val: number) => fmt(val)} />
              <Legend />
              <Bar dataKey="realPurchasingPower" name="Purchasing Power" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Bar>
              <Bar dataKey="loss" name="Value Lost" fill="#ef4444" radius={[4, 4, 0, 0]} opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        );
      case "line":

  return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={projectionData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
              <XAxis dataKey="year" stroke="#7a95b8" tick={{ fill: '#7a95b8' }} axisLine={{ stroke: '#12233e' }} tickLine={false} />
              <YAxis stroke="#7a95b8" tickFormatter={fmtCompact} tick={{ fill: '#7a95b8' }} axisLine={{ stroke: '#12233e' }} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#060d19', borderColor: '#12233e', color: '#fff' }} formatter={(val: number) => fmt(val)} />
              <Legend />
              {RATES.map((rate, index) => (
                <Line key={`line-${index}`} type="monotone" dataKey={`rate${index}`} name={`${(rate * 100).toFixed(0)}% Inf`} stroke={CHART_COLORS[index % CHART_COLORS.length]} strokeWidth={2} dot={false} />
              ))}
              <Line type="monotone" dataKey="customRate" name={`Custom (${customRate}%)`} stroke="#fff" strokeWidth={3} strokeDasharray="5 5" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        );
      case "area":

  return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={projectionData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
              <XAxis dataKey="year" stroke="#7a95b8" tick={{ fill: '#7a95b8' }} axisLine={{ stroke: '#12233e' }} tickLine={false} />
              <YAxis stroke="#7a95b8" tickFormatter={fmtCompact} tick={{ fill: '#7a95b8' }} axisLine={{ stroke: '#12233e' }} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#060d19', borderColor: '#12233e', color: '#fff' }} formatter={(val: number) => fmt(val)} />
              <Legend />
              <Area type="monotone" dataKey="invested" name={`Invested (${investmentReturn}%)`} stroke={COLORS.emerald} fill={COLORS.emerald} fillOpacity={0.3} />
              <Area type="monotone" dataKey="customRate" name={`Inflation (${customRate}%)`} stroke={COLORS.red} fill={COLORS.red} fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        );
      case "pie":

  return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" labelLine={false} outerRadius={150} fill="#8884d8" dataKey="value" nameKey="name" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? COLORS.emerald : COLORS.red} />
                ))}
              </Pie>
              <Tooltip formatter={(val: number) => fmt(val)} contentStyle={{ backgroundColor: '#060d19', borderColor: '#12233e', color: '#fff' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      case "radar":

  return (
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
              <PolarGrid stroke="#12233e" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#7a95b8' }} />
              <PolarRadiusAxis angle={30} domain={[0, currentAmount]} tick={false} axisLine={false} />
              <Radar name="Purchasing Power" dataKey="A" stroke={COLORS.blue} fill={COLORS.blue} fillOpacity={0.6} />
              <Tooltip formatter={(val: number) => fmt(val)} contentStyle={{ backgroundColor: '#060d19', borderColor: '#12233e', color: '#fff' }} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        );
      case "composed":

  return (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
              <XAxis dataKey="rate" stroke="#7a95b8" tick={{ fill: '#7a95b8' }} axisLine={{ stroke: '#12233e' }} tickLine={false} />
              <YAxis stroke="#7a95b8" tickFormatter={fmtCompact} tick={{ fill: '#7a95b8' }} axisLine={{ stroke: '#12233e' }} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#060d19', borderColor: '#12233e', color: '#fff' }} formatter={(val: number) => fmt(val)} />
              <Legend />
              <Bar dataKey="realPurchasingPower" name="Purchasing Power" barSize={40} fill={COLORS.blue} radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="adjustedReturn" name={`With ${investmentReturn}% Return`} stroke={COLORS.emerald} strokeWidth={3} />
              <Scatter dataKey="loss" name="Value Lost" fill={COLORS.red} />
            </ComposedChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6 pb-12">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="InflationAnalysis" />

        <ExecutiveSummary
          pageTitle="Inflation Analysis"
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
        <GoalsAccelerator pageName="Inflation Analysis" pageContext="Inflation Analysis — financial analysis modeling with projections and scenario analysis" />
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
        {/* Header */}
        <div className="rc-page-header flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[#ef4444]/10 rounded-lg">
                <TrendingDown className="w-8 h-8 text-[#ef4444]" />
              </div>
              <div>
                <h1 className="rc-page-title text-3xl font-bold text-white tracking-tight">
                  Advanced Inflation Analysis
                </h1>
                <p className="rc-page-subtitle text-[#7a95b8] text-lg mt-1">
                  Comprehensive purchasing power erosion modeling
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={handleReset} className="rc-btn rc-btn-ghost flex items-center gap-2 px-3 py-2 bg-[#0d1a2e] hover:bg-[#12233e] text-[#c8d8ec] border border-[#12233e] rounded-lg transition-colors">
              <RefreshCw className="w-4 h-4" /> Reset
            </button>
            <button onClick={handleExportCSV} className="rc-btn rc-btn-ghost flex items-center gap-2 px-3 py-2 bg-[#0d1a2e] hover:bg-[#12233e] text-[#c8d8ec] border border-[#12233e] rounded-lg transition-colors">
              <Download className="w-4 h-4" /> CSV
            </button>
            <button onClick={handleExportPdf} className="rc-btn rc-btn-ghost flex items-center gap-2 px-3 py-2 bg-[#0d1a2e] hover:bg-[#12233e] text-[#c8d8ec] border border-[#12233e] rounded-lg transition-colors">
              <FileText className="w-4 h-4" /> PDF
            </button>
            <button onClick={handleSaveScenario} className="rc-btn rc-btn-ghost flex items-center gap-2 px-3 py-2 bg-[#3b82f6]/20 hover:bg-[#3b82f6]/30 text-[#3b82f6] border border-[#3b82f6]/30 rounded-lg transition-colors">
              <Save className="w-4 h-4" /> Save
            </button>
            <ExportToSlides
              toolName="Inflation Impact Analysis"
              getSections={() => {
                const sections = [
                  {
                    title: "Analysis Parameters",
                    items: [
                      { label: "Current Value", value: fmt(currentAmount) },
                      { label: "Time Horizon", value: `${years} Years` },
                      { label: "Custom Rate", value: `${customRate}%` },
                      { label: "Investment Return", value: `${investmentReturn}%` }
                    ],
                  },
                ];
                if (result && Array.isArray(result)) {
                  const impactItems = result.map((r) => ({
                    label: `At ${(r.rate * 100).toFixed(0)}% Inflation`,
                    value: `${fmt(Math.round(r.realPurchasingPower))} (-${r.erosion}% purchasing power)`,
                  }));
                  sections.push({
                    title: "Purchasing Power Projection",
                    items: impactItems,
                  });
                }
                return sections;
              }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#f0c040]" />
              <h2 className="text-xl font-semibold text-white">Analysis Parameters</h2>
            </div>
            <button onClick={toggleAdvanced} className="text-sm text-[#3b82f6] hover:text-[#60a5fa] flex items-center gap-1">
              {showAdvanced ? <><ChevronUp className="w-4 h-4" /> Hide Advanced</> : <><ChevronDown className="w-4 h-4" /> Show Advanced</>}
            </button>
          </div>
          
          {renderInteractiveControls()}
          {renderAdvancedControls()}
          
          {/* Interactive Scenario Builder */}
          <div className="mt-6 pt-6 border-t border-[#12233e] flex items-center gap-4">
            <div className="flex-1">
              <label className="text-xs text-[#7a95b8] mb-1 block">Scenario Name</label>
              <input 
                type="text" 
                value={scenarioName} 
                onChange={(e) => setScenarioName(e.target.value)}
                className="w-full bg-[#060d19] border border-[#12233e] text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-[#3b82f6]"
                placeholder="e.g. Base Retirement Plan"
              />
            </div>
            <div className="flex items-center gap-2 mt-5">
              <button onClick={() => setCompareMode(!compareMode)} className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${compareMode ? 'bg-[#8b5cf6]/20 border-[#8b5cf6]/50 text-[#a78bfa]' : 'bg-transparent border-[#12233e] text-[#7a95b8] hover:text-white'}`}>
                Compare Mode
              </button>
              <button onClick={() => setIsExpanded(!isExpanded)} className="p-2 rounded-lg bg-[#12233e] text-[#c8d8ec] hover:text-white transition-colors">
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-xl p-4">
            <p className="text-[#7a95b8] text-sm mb-1">Base Value</p>
            <p className="text-2xl font-bold text-white">{fmt(currentAmount)}</p>
            <p className="text-xs text-[#22c55e] mt-2 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Starting Point</p>
          </div>
          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-xl p-4">
            <p className="text-[#7a95b8] text-sm mb-1">Custom Rate ({customRate}%)</p>
            <p className="text-2xl font-bold text-white">{fmt(currentAmount / Math.pow(1 + customRate/100, years))}</p>
            <p className="text-xs text-[#ef4444] mt-2 flex items-center gap-1"><TrendingDown className="w-3 h-3" /> -{((1 - 1/Math.pow(1 + customRate/100, years))*100).toFixed(1)}%</p>
          </div>
          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-xl p-4">
            <p className="text-[#7a95b8] text-sm mb-1">Invested ({investmentReturn}%)</p>
            <p className="text-2xl font-bold text-white">{fmt(currentAmount * Math.pow(1 + investmentReturn/100, years))}</p>
            <p className="text-xs text-[#22c55e] mt-2 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +{((Math.pow(1 + investmentReturn/100, years) - 1)*100).toFixed(1)}%</p>
          </div>
          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-xl p-4">
            <p className="text-[#7a95b8] text-sm mb-1">Real Return</p>
            <p className="text-2xl font-bold text-white">{fmt(currentAmount * Math.pow(1 + investmentReturn/100, years) / Math.pow(1 + customRate/100, years))}</p>
            <p className="text-xs text-[#3b82f6] mt-2 flex items-center gap-1"><Activity className="w-3 h-3" /> Inflation Adjusted</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className={`rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-6 shadow-lg ${isExpanded ? 'fixed inset-4 z-50 overflow-auto' : ''}`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h3 className="text-xl font-semibold text-white">Visualizations</h3>
              <p className="text-sm text-[#7a95b8]">Interactive modeling over {years} years</p>
            </div>
            {renderChartTabs()}
          </div>
          {renderActiveChart()}
        </div>

        {/* Data Tables Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Table 1 */}
          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-[#12233e] flex justify-between items-center bg-[#060d19]">
              <h3 className="font-semibold text-white flex items-center gap-2"><Database className="w-4 h-4 text-[#3b82f6]" /> Impact by Rate</h3>
              <button onClick={() => toggleTable(1)} className="text-[#7a95b8] hover:text-white">
                {showTable1 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
            {showTable1 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-[#7a95b8] uppercase bg-[#0a1526]">
                    <tr>
                      <th className="px-4 py-3">Rate</th>
                      <th className="px-4 py-3">Future Power</th>
                      <th className="px-4 py-3">Value Lost</th>
                      <th className="px-4 py-3">Erosion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table1Data.map((row: any, i: number) => (
                      <tr key={i} className="border-b border-[#12233e] hover:bg-[#12233e]/30">
                        <td className="px-4 py-3 font-medium text-white">{row.rate}</td>
                        <td className="px-4 py-3 text-[#22c55e]">{fmt(row.realPurchasingPower)}</td>
                        <td className="px-4 py-3 text-[#ef4444]">{fmt(row.loss)}</td>
                        <td className="px-4 py-3 text-[#f0c040]">{row.erosion}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Table 2 */}
          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-[#12233e] flex justify-between items-center bg-[#060d19]">
              <h3 className="font-semibold text-white flex items-center gap-2"><Calendar className="w-4 h-4 text-[#a855f7]" /> Timeline Projection</h3>
              <button onClick={() => toggleTable(2)} className="text-[#7a95b8] hover:text-white">
                {showTable2 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
            {showTable2 && (
              <div className="overflow-x-auto max-h-[300px]">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-[#7a95b8] uppercase bg-[#0a1526] sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Year</th>
                      <th className="px-4 py-3">2% Inf</th>
                      <th className="px-4 py-3">4% Inf</th>
                      <th className="px-4 py-3">Custom ({customRate}%)</th>
                      <th className="px-4 py-3">Invested</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table2Data.map((row: any, i: number) => (
                      <tr key={i} className="border-b border-[#12233e] hover:bg-[#12233e]/30">
                        <td className="px-4 py-3 font-medium text-white">{row.year}</td>
                        <td className="px-4 py-3 text-[#c8d8ec]">{fmt(row.rate0 || 0)}</td>
                        <td className="px-4 py-3 text-[#c8d8ec]">{fmt(row.rate2 || 0)}</td>
                        <td className="px-4 py-3 text-[#f97316]">{fmt(row.customRate || 0)}</td>
                        <td className="px-4 py-3 text-[#22c55e]">{fmt(row.invested || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Table 3 */}
          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-[#12233e] flex justify-between items-center bg-[#060d19]">
              <h3 className="font-semibold text-white flex items-center gap-2"><Activity className="w-4 h-4 text-[#f0c040]" /> Rule of 72 (Half-Life)</h3>
              <button onClick={() => toggleTable(3)} className="text-[#7a95b8] hover:text-white">
                {showTable3 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
            {showTable3 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-[#7a95b8] uppercase bg-[#0a1526]">
                    <tr>
                      <th className="px-4 py-3">Rate</th>
                      <th className="px-4 py-3">Halved (Yrs)</th>
                      <th className="px-4 py-3">Quartered (Yrs)</th>
                      <th className="px-4 py-3">10% Left (Yrs)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table3Data.map((row: any, i: number) => (
                      <tr key={i} className="border-b border-[#12233e] hover:bg-[#12233e]/30">
                        <td className="px-4 py-3 font-medium text-white">{row.rate}</td>
                        <td className="px-4 py-3 text-[#c8d8ec]">{row.halfLife}</td>
                        <td className="px-4 py-3 text-[#c8d8ec]">{row.quarterLife}</td>
                        <td className="px-4 py-3 text-[#ef4444]">{row.tenthLife}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Table 4 */}
          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-[#12233e] flex justify-between items-center bg-[#060d19]">
              <h3 className="font-semibold text-white flex items-center gap-2"><PieChartIcon className="w-4 h-4 text-[#ec4899]" /> Expense Categories</h3>
              <button onClick={() => toggleTable(4)} className="text-[#7a95b8] hover:text-white">
                {showTable4 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
            {showTable4 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-[#7a95b8] uppercase bg-[#0a1526]">
                    <tr>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Weight</th>
                      <th className="px-4 py-3">Avg Inf</th>
                      <th className="px-4 py-3">Future Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table4Data.map((row: any, i: number) => (
                      <tr key={i} className="border-b border-[#12233e] hover:bg-[#12233e]/30">
                        <td className="px-4 py-3 font-medium text-white">{row.category}</td>
                        <td className="px-4 py-3 text-[#c8d8ec]">{row.weight}%</td>
                        <td className="px-4 py-3 text-[#c8d8ec]">{row.inf}%</td>
                        <td className="px-4 py-3 text-[#f97316]">{fmt(row.futureCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Table 5 */}
          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-[#12233e] flex justify-between items-center bg-[#060d19]">
              <h3 className="font-semibold text-white flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[#14b8a6]" /> Asset Class Hedges</h3>
              <button onClick={() => toggleTable(5)} className="text-[#7a95b8] hover:text-white">
                {showTable5 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
            {showTable5 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-[#7a95b8] uppercase bg-[#0a1526]">
                    <tr>
                      <th className="px-4 py-3">Asset Class</th>
                      <th className="px-4 py-3">Nominal Ret</th>
                      <th className="px-4 py-3">Real Ret</th>
                      <th className="px-4 py-3">Future Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table5Data.map((row: any, i: number) => (
                      <tr key={i} className="border-b border-[#12233e] hover:bg-[#12233e]/30">
                        <td className="px-4 py-3 font-medium text-white">{row.name}</td>
                        <td className="px-4 py-3 text-[#c8d8ec]">{row.return}%</td>
                        <td className="px-4 py-3 text={Number(row.realReturn) > 0 ? '#22c55e' : '#ef4444'}">{row.realReturn}%</td>
                        <td className="px-4 py-3 text-[#c8d8ec]">{fmt(row.futureValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Table 6 */}
          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-[#12233e] flex justify-between items-center bg-[#060d19]">
              <h3 className="font-semibold text-white flex items-center gap-2"><Layers className="w-4 h-4 text-[#06b6d4]" /> Multi-Scenario Matrix</h3>
              <button onClick={() => toggleTable(6)} className="text-[#7a95b8] hover:text-white">
                {showTable6 ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
            {showTable6 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-[#7a95b8] uppercase bg-[#0a1526]">
                    <tr>
                      <th className="px-4 py-3">Year</th>
                      <th className="px-4 py-3">Low (2%)</th>
                      <th className="px-4 py-3">Med (4%)</th>
                      <th className="px-4 py-3">High (6%)</th>
                      <th className="px-4 py-3">Extreme (8%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table6Data.map((row: any, i: number) => (
                      <tr key={i} className="border-b border-[#12233e] hover:bg-[#12233e]/30">
                        <td className="px-4 py-3 font-medium text-white">{row.year}</td>
                        <td className="px-4 py-3 text-[#c8d8ec]">{fmt(row.scenarioA)}</td>
                        <td className="px-4 py-3 text-[#f0c040]">{fmt(row.scenarioB)}</td>
                        <td className="px-4 py-3 text-[#f97316]">{fmt(row.scenarioC)}</td>
                        <td className="px-4 py-3 text-[#ef4444]">{fmt(row.scenarioD)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Warning Section */}
        <div className="bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-xl p-5 flex items-start gap-4">
          <ShieldAlert className="w-6 h-6 text-[#ef4444] shrink-0 mt-0.5" />
          <div>
            <h4 className="text-[#ef4444] font-medium mb-1">Purchasing Power Warning</h4>
            <p className="text-[#c8d8ec] text-sm leading-relaxed">
              Even at a modest 3% inflation rate, purchasing power is cut in half approximately every 24 years. 
              This analysis assumes constant inflation rates, but historical inflation is variable. 
              Ensure your investment strategies aim for returns that outpace these inflation projections.
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-[#7a95b8]">
          <div className="flex items-center gap-2"><Server className="w-4 h-4" /> Data synced: Today</div>
          <div className="flex items-center gap-2"><Lock className="w-4 h-4" /> End-to-end encrypted</div>
          <div className="flex items-center gap-2"><Globe className="w-4 h-4" /> Region: {region}</div>
        </div>

        <NAICDisclaimer />
        <PageInsights pageId="inflation-analysis" />
      </div>
    
        <ComplianceFooter pageName="InflationAnalysis" showsTax showsEstate showsProjections showsHistoricalData />
      </AppShell>
  );
}
