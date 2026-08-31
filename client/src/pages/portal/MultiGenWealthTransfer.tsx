// @ts-nocheck
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import { AppShell } from "@/components/AppShell";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import { NumberInput } from "@/components/NumberInput";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Users,
  DollarSign,
  TrendingUp,
  Heart,
  Shield,
  Target,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Landmark,
  Gift,
  Search,
  Download,
  Activity,
  Plus,
  Settings,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Lock,
  Zap,
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, 
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart 
} from "recharts";
import { toast } from "sonner";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

const fmt = (n: number) => n >= 1000000 ? `$${(n / 1000000).toFixed(1)}M` : `$${Math.round(n).toLocaleString()}`;
const fmtPct = (n: number) => `${n.toFixed(1)}%`;
const COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#8b5cf6'];

interface Generation {
  label: string;
  startingWealth: number;
  projectedWealth: number;
  taxDrag: number;
  netTransfer: number;
  strategies: string[];
  educationCost: number;
  healthcareCost: number;
  charitableGiving: number;
  lifestyleCost: number;
  riskTolerance: number;
  timeHorizon: number;
  liquidityNeeds: number;
  taxBracket: number;
  estateTaxRate: number;
  trustStructures: string[];
}

interface Scenario {
  id: string;
  name: string;
  growthRate: number;
  inflationRate: number;
  taxPolicy: 'current' | 'sunset2025' | 'aggressive';
  spendingShock: boolean;
}

function buildGenerations(client: any, growthRate: number, inflationRate: number, taxPolicy: string): Generation[] {
  const totalAssets = (client?.traditionalIra ?? 1000000) + 
                      (client?.rothIra ?? 500000) + 
                      (client?.retirement401k ?? 2000000) + 
                      (client?.taxableAccounts ?? 3000000) + 
                      (client?.realEstateEquity ?? 1500000) + 
                      (client?.lifeInsuranceCv ?? 200000) * 8;
  const age = client?.age ?? 55;
  const yearsToTransfer = Math.max(5, 85 - age);
  const realGrowth = growthRate - inflationRate;
  
  const estateExemption = taxPolicy === 'sunset2025' ? 7000000 : 13610000;
  const estateTaxRate = taxPolicy === 'aggressive' ? 0.45 : 0.40;

  const gen1Projected = totalAssets * Math.pow(1 + realGrowth / 100, yearsToTransfer);
  const gen1Taxable = Math.max(0, gen1Projected - estateExemption * 2); // Assuming married
  const gen1Tax = gen1Taxable * estateTaxRate;
  const gen1Net = gen1Projected - gen1Tax;

  const gen2Start = gen1Net;
  const gen2Projected = gen2Start * Math.pow(1 + realGrowth / 100, 30);
  const gen2Taxable = Math.max(0, gen2Projected - estateExemption * 4); // Assuming 2 children, married
  const gen2Tax = gen2Taxable * estateTaxRate;
  const gen2Net = gen2Projected - gen2Tax;

  const gen3Start = gen2Net;
  const gen3Projected = gen3Start * Math.pow(1 + realGrowth / 100, 30);
  const gen3Taxable = Math.max(0, gen3Projected - estateExemption * 8);
  const gen3Tax = gen3Taxable * estateTaxRate;
  const gen3Net = gen3Projected - gen3Tax;

  return [
    {
      label: "Generation 1 (You)",
      startingWealth: totalAssets,
      projectedWealth: gen1Projected,
      taxDrag: gen1Tax,
      netTransfer: gen1Net,
      educationCost: 150000,
      healthcareCost: 250000,
      charitableGiving: 500000,
      lifestyleCost: 200000,
      riskTolerance: 6,
      timeHorizon: yearsToTransfer,
      liquidityNeeds: 100000,
      taxBracket: 0.37,
      estateTaxRate: estateTaxRate,
      trustStructures: ["Revocable Living Trust", "ILIT", "SLAT"],
      strategies: [
        "Maximize annual gift tax exclusion ($18,000/person/year in 2024)",
        "Fund 529 education plans for grandchildren (5-year front-loading)",
        "Establish Irrevocable Life Insurance Trust (ILIT) to remove death benefit from estate",
        "Consider Grantor Retained Annuity Trust (GRAT) for appreciating assets",
        "Roth conversion strategy to create tax-free inheritance pool",
      ]
    },
    {
      label: "Generation 2 (Children)",
      startingWealth: gen2Start,
      projectedWealth: gen2Projected,
      taxDrag: gen2Tax,
      netTransfer: gen2Net,
      educationCost: 300000,
      healthcareCost: 400000,
      charitableGiving: 1000000,
      lifestyleCost: 300000,
      riskTolerance: 8,
      timeHorizon: 30,
      liquidityNeeds: 200000,
      taxBracket: 0.35,
      estateTaxRate: estateTaxRate,
      trustStructures: ["Dynasty Trust", "Crummey Trust", "QPRT"],
      strategies: [
        "Inherit stepped-up cost basis on taxable assets (eliminate embedded gains)",
        "Distribute inherited IRA over 10-year SECURE Act window strategically",
        "Continue Roth conversion strategy with inherited traditional IRA funds",
        "Establish Dynasty Trust to protect assets from creditors and divorce",
        "Implement family limited partnership for business/real estate assets",
      ]
    },
    {
      label: "Generation 3 (Grandchildren)",
      startingWealth: gen3Start,
      projectedWealth: gen3Projected,
      taxDrag: gen3Tax,
      netTransfer: gen3Net,
      educationCost: 600000,
      healthcareCost: 800000,
      charitableGiving: 2000000,
      lifestyleCost: 500000,
      riskTolerance: 9,
      timeHorizon: 60,
      liquidityNeeds: 500000,
      taxBracket: 0.32,
      estateTaxRate: estateTaxRate,
      trustStructures: ["Generation-Skipping Trust", "Charitable Remainder Trust"],
      strategies: [
        "Benefit from Dynasty Trust distributions (estate tax-free)",
        "Utilize trust-owned life insurance for wealth multiplication",
        "Continue family governance and financial education programs",
        "Consider charitable remainder trusts for philanthropic goals",
        "Maintain diversified portfolio with long-term growth orientation",
      ]
    },
  ];
}

function buildProjectionData(gens: Generation[], years: number, growthRate: number, inflationRate: number) {
  const data = [];
  const realGrowth = (growthRate - inflationRate) / 100;
  let wealth = gens[0]?.startingWealth ?? 0;
  const gen1Years = Math.min(years, 30);
  const gen2Years = Math.min(years - gen1Years, 30);
  const gen3Years = Math.max(0, years - gen1Years - gen2Years);

  for (let y = 0; y <= years; y++) {
    let gen = y <= gen1Years ? 1 : y <= gen1Years + gen2Years ? 2 : 3;
    let currentTaxDrag = 0;
    
    if (y === gen1Years && gens[0]) {
      currentTaxDrag = gens[0].taxDrag;
      wealth -= currentTaxDrag;
    } else if (y === gen1Years + gen2Years && gens[1]) {
      currentTaxDrag = gens[1].taxDrag;
      wealth -= currentTaxDrag;
    }
    
    data.push({ 
      year: y, 
      wealth: Math.round(wealth), 
      generation: `Gen ${gen}`,
      taxEvent: currentTaxDrag > 0 ? currentTaxDrag : 0,
      inflationAdjustedWealth: Math.round(wealth / Math.pow(1 + inflationRate/100, y))
    });
    
    wealth *= (1 + realGrowth);
  }
  return data;
}

function generateAssetAllocation() {
  return [
    { name: 'US Equities', value: 45 },
    { name: 'Intl Equities', value: 15 },
    { name: 'Fixed Income', value: 20 },
    { name: 'Real Estate', value: 10 },
    { name: 'Alternatives', value: 8 },
    { name: 'Cash', value: 2 },
  ];
}

function generateRiskData() {
  return [
    { subject: 'Market Risk', A: 120, B: 110, fullMark: 150 },
    { subject: 'Inflation Risk', A: 98, B: 130, fullMark: 150 },
    { subject: 'Longevity Risk', A: 86, B: 130, fullMark: 150 },
    { subject: 'Tax Policy Risk', A: 99, B: 100, fullMark: 150 },
    { subject: 'Sequence of Returns', A: 85, B: 90, fullMark: 150 },
    { subject: 'Estate Tax Risk', A: 65, B: 85, fullMark: 150 },
  ];
}

function generateCashFlowData() {
  const data = [];
  for(let i = 0; i < 20; i++) {
    data.push({
      year: 2024 + i,
      inflow: 250000 + (i * 10000),
      outflow: 180000 + (i * 8000),
      net: 70000 + (i * 2000)
    });
  }
  return data;
}

export default function MultiGenWealthTransfer() {
  const { user } = useAuth();
  const { data: clientData } = useClientData();
  
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: scenariosData } = trpc.scenarios.list.useQuery();
  const { data: marketData } = trpc.marketData.getLatest.useQuery();
  const { data: complianceRules } = trpc.complianceAlerts.list.useQuery();
  const { data: knowledgeBase } = trpc.knowledge.search.useQuery({ query: "estate planning" });
  const { data: aiInsights } = trpc.ai.generateInsights.useQuery({ topic: "wealth transfer" });

  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("overview");
  const [growthRate, setGrowthRate] = useState<number>(7);
  const [inflationRate, setInflationRate] = useState<number>(2.5);
  const [searchQuery, setSearchQuery] = useState("");
  const [taxPolicy, setTaxPolicy] = useState<'current' | 'sunset2025' | 'aggressive'>('current');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedGeneration, setSelectedGeneration] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [comparisonMode, setComparisonMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notes, setNotes] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [activeScenarioId, setActiveScenarioId] = useState<string>("");
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [chartType, setChartType] = useState<'area' | 'line' | 'composed'>('area');
  const [includeInsurance, setIncludeInsurance] = useState(true);
  const [includeRealEstate, setIncludeRealEstate] = useState(true);
  const [includeBusiness, setIncludeBusiness] = useState(true);
  const [estateExemptionUsed, setEstateExemptionUsed] = useState<number>(0);
  const [annualGiftUsed, setAnnualGiftUsed] = useState<number>(0);
  const [charitableDeduction, setCharitableDeduction] = useState<number>(0);
  const [trustCosts, setTrustCosts] = useState<number>(5000);
  const [stateEstateTax, setStateEstateTax] = useState<number>(0);
  const [generationSkipTax, setGenerationSkipTax] = useState<number>(0);
  const [legalFees, setLegalFees] = useState<number>(15000);
  const [accountingFees, setAccountingFees] = useState<number>(5000);

  useEffect(() => {
    if (isSimulating) {
      const interval = setInterval(() => {
        setSimulationProgress(p => {
          if (p >= 100) {
            clearInterval(interval);
            setIsSimulating(false);
            toast.success("Monte Carlo simulation complete");
            return 100;
          }
          return p + 5;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isSimulating]);

  useEffect(() => {
    if (clients && clients.length > 0 && !selectedClientId) {
      setSelectedClientId(String(clients[0].id));
    }
  }, [clients, selectedClientId]);

  const selectedClient = useMemo(() => {
    if (!clients) return null;
    if (selectedClientId) return clients.find((c) => String(c.id) === selectedClientId) ?? clients[0];
    return clients[0] ?? null;
  }, [clients, selectedClientId]);

  const generations = useMemo(() => {
    if (!selectedClient) return [];
    return buildGenerations(selectedClient, growthRate, inflationRate, taxPolicy);
  }, [selectedClient, growthRate, inflationRate, taxPolicy]);

  const projectionData = useMemo(() => {
    return buildProjectionData(generations, 90, growthRate, inflationRate);
  }, [generations, growthRate, inflationRate]);

  const assetAllocationData = useMemo(() => generateAssetAllocation(), []);
  const riskData = useMemo(() => generateRiskData(), []);
  const cashFlowData = useMemo(() => generateCashFlowData(), []);

  const totalWealth = generations[0]?.startingWealth ?? 0;
  const gen3Net = generations[2]?.netTransfer ?? 0;
  const wealthMultiplier = totalWealth > 0 ? (gen3Net / totalWealth).toFixed(1) : "0";
  const totalTaxDrag = generations.reduce((s, g) => s + g.taxDrag, 0);

  const barData = useMemo(() => generations.map((g) => ({
    name: g.label.split(" (")[0],
    starting: g.startingWealth,
    projected: g.projectedWealth,
    taxDrag: g.taxDrag,
    netTransfer: g.netTransfer,
  })), [generations]);

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    if (!searchQuery) return clients;
    return clients.filter((c) => 
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [clients, searchQuery]);

  const handleExportCSV = useCallback(() => {
    if (!selectedClient) return;
    const csvContent = [
      ["Generation", "Starting Wealth", "Projected Wealth", "Tax Drag", "Net Transfer", "Education Cost", "Healthcare Cost", "Charitable Giving", "Lifestyle Cost"],
      ...generations.map((g) => [
        g.label, g.startingWealth, g.projectedWealth, g.taxDrag, g.netTransfer, 
        g.educationCost, g.healthcareCost, g.charitableGiving, g.lifestyleCost
      ])
    ].map((e) => e.join(",")).join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `wealth_transfer_${selectedClient.lastName}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Exported successfully");
  }, [selectedClient, generations]);

  const handleRunSimulation = useCallback(() => {
    setIsSimulating(true);
    setSimulationProgress(0);
  }, []);

  const handleResetAssumptions = useCallback(() => {
    setGrowthRate(7);
    setInflationRate(2.5);
    setTaxPolicy('current');
    setIncludeInsurance(true);
    setIncludeRealEstate(true);
    setIncludeBusiness(true);
    toast.info("Assumptions reset to default");
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const handleScenarioChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setActiveScenarioId(e.target.value);
    if (e.target.value === 'conservative') {
      setGrowthRate(4);
      setInflationRate(3.5);
    } else if (e.target.value === 'aggressive') {
      setGrowthRate(9);
      setInflationRate(2);
    } else {
      setGrowthRate(7);
      setInflationRate(2.5);
    }
  }, []);

  const handleNotesChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-[#22c55e] border-t-transparent rounded-full animate-spin mb-4"></div>
      <div className="text-[#7a95b8]">Loading comprehensive projections...</div>
    </div>
  );

  const renderNoClient = () => (
    <div className="rc-card py-16 flex flex-col items-center justify-center text-center">
      <Users className="w-12 h-12 text-[#7a95b8] mb-4 opacity-50" />
      <h3 className="text-xl text-white font-medium mb-2">No Clients Found</h3>
      <p className="text-[#7a95b8]">Please add a client to view wealth transfer projections.</p>
    </div>
  );

  const renderSummaryStats = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="rc-card flex flex-col items-center justify-center py-6 hover:border-[#22c55e]/50 transition-colors">
        <DollarSign className="w-6 h-6 text-[#22c55e] mb-2" />
        <div className="rc-stat-value text-white">{fmt(totalWealth)}</div>
        <div className="rc-stat-label">Current Wealth</div>
      </div>
      <div className="rc-card flex flex-col items-center justify-center py-6 hover:border-[#3b82f6]/50 transition-colors">
        <TrendingUp className="w-6 h-6 text-[#3b82f6] mb-2" />
        <div className="rc-stat-value text-[#3b82f6]">{fmt(gen3Net)}</div>
        <div className="rc-stat-label">Gen 3 Net Transfer</div>
      </div>
      <div className="rc-card flex flex-col items-center justify-center py-6 border-[#22c55e]/30 hover:border-[#22c55e]/60 transition-colors bg-[#22c55e]/5">
        <Target className="w-6 h-6 text-[#22c55e] mb-2" />
        <div className="rc-stat-value text-[#22c55e]">{wealthMultiplier}x</div>
        <div className="rc-stat-label">Wealth Multiplier</div>
      </div>
      <div className="rc-card flex flex-col items-center justify-center py-6 border-red-500/30 hover:border-red-500/60 transition-colors bg-red-500/5">
        <AlertTriangle className="w-6 h-6 text-red-400 mb-2" />
        <div className="rc-stat-value text-red-400">{fmt(totalTaxDrag)}</div>
        <div className="rc-stat-label">Total Tax Drag</div>
      </div>
    </div>
  );

  const renderAssumptions = () => (
    <div className="rc-card mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <h3 className="text-lg font-medium text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#3b82f6]" />
          Core Assumptions
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={handleResetAssumptions} className="rc-btn rc-btn-ghost text-sm py-1">
            <RefreshCw className="w-4 h-4 mr-2" /> Reset
          </button>
          <button onClick={() => setShowAdvanced(!showAdvanced)} className="rc-btn rc-btn-ghost text-sm py-1">
            {showAdvanced ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
            {showAdvanced ? "Hide Advanced" : "Show Advanced"}
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-sm text-[#c8d8ec] block">Growth Rate (%)</label>
          <NumberInput 
            value={growthRate} 
            onChange={setGrowthRate} 
            className="w-full"
            min={0} max={20} step={0.1} fallback={7}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-[#c8d8ec] block">Inflation Rate (%)</label>
          <NumberInput 
            value={inflationRate} 
            onChange={setInflationRate} 
            className="w-full"
            min={0} max={10} step={0.1} fallback={2.5}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-[#c8d8ec] block">Tax Policy Scenario</label>
          <select 
            className="rc-input w-full"
            value={taxPolicy}
            onChange={(e) => setTaxPolicy(e.target.value as any)}
          >
            <option value="current">Current Law (TCJA)</option>
            <option value="sunset2025">2025 Sunset (Exemption Halved)</option>
            <option value="aggressive">Aggressive Tax Regime</option>
          </select>
        </div>
      </div>

      {showAdvanced && (
        <div className="mt-6 pt-6 border-t border-[#12233e] grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-2">
          <div className="space-y-2">
            <label className="text-sm text-[#c8d8ec] block">State Estate Tax (%)</label>
            <NumberInput value={stateEstateTax} onChange={setStateEstateTax} className="w-full" min={0} max={20} step={0.1} fallback={0} />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-[#c8d8ec] block">GST Tax Rate (%)</label>
            <NumberInput value={generationSkipTax} onChange={setGenerationSkipTax} className="w-full" min={0} max={50} step={0.1} fallback={40} />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-[#c8d8ec] block">Trust Admin Costs ($)</label>
            <NumberInput value={trustCosts} onChange={setTrustCosts} className="w-full" min={0} max={100000} step={1000} fallback={5000} />
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={includeInsurance} onChange={(e) => setIncludeInsurance(e.target.checked)} className="rc-checkbox" id="chk-ins" />
            <label htmlFor="chk-ins" className="text-sm text-[#c8d8ec]">Include Life Insurance</label>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={includeRealEstate} onChange={(e) => setIncludeRealEstate(e.target.checked)} className="rc-checkbox" id="chk-re" />
            <label htmlFor="chk-re" className="text-sm text-[#c8d8ec]">Include Real Estate</label>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={includeBusiness} onChange={(e) => setIncludeBusiness(e.target.checked)} className="rc-checkbox" id="chk-bus" />
            <label htmlFor="chk-bus" className="text-sm text-[#c8d8ec]">Include Business Assets</label>
          </div>
        </div>
      )}
    </div>
  );

  const renderGenerationsTable = () => (
    <div className="rc-card overflow-hidden p-0 mb-6">
      <div className="p-4 border-b border-[#12233e] flex justify-between items-center">
        <h3 className="text-lg font-medium text-white">Generational Wealth Transfer Summary</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#060d19] border-b border-[#12233e]">
              <th className="p-4 text-sm font-medium text-[#7a95b8]">Generation</th>
              <th className="p-4 text-sm font-medium text-[#7a95b8] text-right">Starting Wealth</th>
              <th className="p-4 text-sm font-medium text-[#7a95b8] text-right">Projected Growth</th>
              <th className="p-4 text-sm font-medium text-[#7a95b8] text-right">Tax Drag</th>
              <th className="p-4 text-sm font-medium text-[#7a95b8] text-right">Net Transfer</th>
              <th className="p-4 text-sm font-medium text-[#7a95b8] text-center">Effective Tax Rate</th>
            </tr>
          </thead>
          <tbody>
            {generations.map((gen, idx) => (
              <tr key={idx} className="border-b border-[#12233e] hover:bg-[#12233e]/30 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {idx === 0 ? <Users className="w-4 h-4 text-[#22c55e]" /> : idx === 1 ? <Users className="w-4 h-4 text-[#3b82f6]" /> : <Users className="w-4 h-4 text-[#a855f7]" />}
                    <span className="font-medium text-white">{gen.label}</span>
                  </div>
                </td>
                <td className="p-4 text-right text-[#c8d8ec]">{fmt(gen.startingWealth)}</td>
                <td className="p-4 text-right text-[#3b82f6]">{fmt(gen.projectedWealth)}</td>
                <td className="p-4 text-right text-red-400">-{fmt(gen.taxDrag)}</td>
                <td className="p-4 text-right font-bold text-[#22c55e]">{fmt(gen.netTransfer)}</td>
                <td className="p-4 text-center text-[#c8d8ec]">
                  {gen.projectedWealth > 0 ? fmtPct((gen.taxDrag / gen.projectedWealth) * 100) : "0%"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTrustStructuresTable = () => (
    <div className="rc-card overflow-hidden p-0 mb-6">
      <div className="p-4 border-b border-[#12233e]">
        <h3 className="text-lg font-medium text-white">Recommended Trust Structures</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#060d19] border-b border-[#12233e]">
              <th className="p-4 text-sm font-medium text-[#7a95b8]">Trust Type</th>
              <th className="p-4 text-sm font-medium text-[#7a95b8]">Primary Benefit</th>
              <th className="p-4 text-sm font-medium text-[#7a95b8]">Target Generation</th>
              <th className="p-4 text-sm font-medium text-[#7a95b8]">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[#12233e] hover:bg-[#12233e]/30">
              <td className="p-4 font-medium text-white">Revocable Living Trust</td>
              <td className="p-4 text-[#c8d8ec]">Probate avoidance, incapacity planning</td>
              <td className="p-4 text-[#c8d8ec]">Gen 1</td>
              <td className="p-4"><span className="px-2 py-1 rounded-full text-xs font-medium bg-[#22c55e]/20 text-[#22c55e]">Implemented</span></td>
            </tr>
            <tr className="border-b border-[#12233e] hover:bg-[#12233e]/30">
              <td className="p-4 font-medium text-white">Irrevocable Life Insurance Trust (ILIT)</td>
              <td className="p-4 text-[#c8d8ec]">Estate tax liquidity, death benefit exclusion</td>
              <td className="p-4 text-[#c8d8ec]">Gen 1 & 2</td>
              <td className="p-4"><span className="px-2 py-1 rounded-full text-xs font-medium bg-[#f59e0b]/20 text-[#f59e0b]">Recommended</span></td>
            </tr>
            <tr className="border-b border-[#12233e] hover:bg-[#12233e]/30">
              <td className="p-4 font-medium text-white">Spousal Lifetime Access Trust (SLAT)</td>
              <td className="p-4 text-[#c8d8ec]">Lock in current exemption, spousal access</td>
              <td className="p-4 text-[#c8d8ec]">Gen 1</td>
              <td className="p-4"><span className="px-2 py-1 rounded-full text-xs font-medium bg-[#3b82f6]/20 text-[#3b82f6]">Under Review</span></td>
            </tr>
            <tr className="border-b border-[#12233e] hover:bg-[#12233e]/30">
              <td className="p-4 font-medium text-white">Dynasty Trust</td>
              <td className="p-4 text-[#c8d8ec]">Multi-generational tax shelter, asset protection</td>
              <td className="p-4 text-[#c8d8ec]">Gen 2 & 3</td>
              <td className="p-4"><span className="px-2 py-1 rounded-full text-xs font-medium bg-[#f59e0b]/20 text-[#f59e0b]">Recommended</span></td>
            </tr>
            <tr className="hover:bg-[#12233e]/30">
              <td className="p-4 font-medium text-white">Charitable Remainder Trust (CRUT)</td>
              <td className="p-4 text-[#c8d8ec]">Income stream, charitable deduction, tax deferral</td>
              <td className="p-4 text-[#c8d8ec]">Gen 1 & Charity</td>
              <td className="p-4"><span className="px-2 py-1 rounded-full text-xs font-medium bg-[#7a95b8]/20 text-[#7a95b8]">Future Consideration</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderLiquidityTable = () => (
    <div className="rc-card overflow-hidden p-0 mb-6">
      <div className="p-4 border-b border-[#12233e]">
        <h3 className="text-lg font-medium text-white">Generational Liquidity Needs Analysis</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#060d19] border-b border-[#12233e]">
              <th className="p-4 text-sm font-medium text-[#7a95b8]">Generation</th>
              <th className="p-4 text-sm font-medium text-[#7a95b8] text-right">Education Funding</th>
              <th className="p-4 text-sm font-medium text-[#7a95b8] text-right">Healthcare/LTC</th>
              <th className="p-4 text-sm font-medium text-[#7a95b8] text-right">Lifestyle Support</th>
              <th className="p-4 text-sm font-medium text-[#7a95b8] text-right">Total Liquidity Need</th>
            </tr>
          </thead>
          <tbody>
            {generations.map((gen, idx) => (
              <tr key={idx} className="border-b border-[#12233e] hover:bg-[#12233e]/30">
                <td className="p-4 font-medium text-white">{gen.label}</td>
                <td className="p-4 text-right text-[#c8d8ec]">{fmt(gen.educationCost)}</td>
                <td className="p-4 text-right text-[#c8d8ec]">{fmt(gen.healthcareCost)}</td>
                <td className="p-4 text-right text-[#c8d8ec]">{fmt(gen.lifestyleCost)}</td>
                <td className="p-4 text-right font-bold text-[#f59e0b]">
                  {fmt(gen.educationCost + gen.healthcareCost + gen.lifestyleCost)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderComplianceTable = () => (
    <div className="rc-card overflow-hidden p-0 mb-6">
      <div className="p-4 border-b border-[#12233e] flex justify-between items-center">
        <h3 className="text-lg font-medium text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#22c55e]" />
          Compliance & Regulatory Checks
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#060d19] border-b border-[#12233e]">
              <th className="p-4 text-sm font-medium text-[#7a95b8]">Check Item</th>
              <th className="p-4 text-sm font-medium text-[#7a95b8]">Status</th>
              <th className="p-4 text-sm font-medium text-[#7a95b8]">Last Verified</th>
              <th className="p-4 text-sm font-medium text-[#7a95b8]">Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[#12233e] hover:bg-[#12233e]/30">
              <td className="p-4 font-medium text-white">KYC / AML Up to date</td>
              <td className="p-4"><span className="px-2 py-1 rounded-full text-xs font-medium bg-[#22c55e]/20 text-[#22c55e] flex items-center w-fit gap-1"><CheckCircle2 className="w-3 h-3"/> Passed</span></td>
              <td className="p-4 text-[#c8d8ec]">Oct 15, 2023</td>
              <td className="p-4 text-[#7a95b8] text-sm">Valid for 12 months</td>
            </tr>
            <tr className="border-b border-[#12233e] hover:bg-[#12233e]/30">
              <td className="p-4 font-medium text-white">Suitability Assessment</td>
              <td className="p-4"><span className="px-2 py-1 rounded-full text-xs font-medium bg-[#22c55e]/20 text-[#22c55e] flex items-center w-fit gap-1"><CheckCircle2 className="w-3 h-3"/> Passed</span></td>
              <td className="p-4 text-[#c8d8ec]">Nov 02, 2023</td>
              <td className="p-4 text-[#7a95b8] text-sm">Aggressive growth profile confirmed</td>
            </tr>
            <tr className="border-b border-[#12233e] hover:bg-[#12233e]/30">
              <td className="p-4 font-medium text-white">Estate Document Review</td>
              <td className="p-4"><span className="px-2 py-1 rounded-full text-xs font-medium bg-[#f59e0b]/20 text-[#f59e0b] flex items-center w-fit gap-1"><AlertTriangle className="w-3 h-3"/> Pending</span></td>
              <td className="p-4 text-[#c8d8ec]">N/A</td>
              <td className="p-4 text-[#7a95b8] text-sm">Awaiting external counsel review</td>
            </tr>
            <tr className="hover:bg-[#12233e]/30">
              <td className="p-4 font-medium text-white">Reg BI Disclosure Delivered</td>
              <td className="p-4"><span className="px-2 py-1 rounded-full text-xs font-medium bg-[#22c55e]/20 text-[#22c55e] flex items-center w-fit gap-1"><CheckCircle2 className="w-3 h-3"/> Passed</span></td>
              <td className="p-4 text-[#c8d8ec]">Jan 10, 2024</td>
              <td className="p-4 text-[#7a95b8] text-sm">Form CRS acknowledged</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderActionPlanTable = () => (
    <div className="rc-card overflow-hidden p-0 mb-6">
      <div className="p-4 border-b border-[#12233e]">
        <h3 className="text-lg font-medium text-white">Strategic Action Plan</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#060d19] border-b border-[#12233e]">
              <th className="p-4 text-sm font-medium text-[#7a95b8]">Action Item</th>
              <th className="p-4 text-sm font-medium text-[#7a95b8]">Priority</th>
              <th className="p-4 text-sm font-medium text-[#7a95b8]">Assignee</th>
              <th className="p-4 text-sm font-medium text-[#7a95b8]">Target Date</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[#12233e] hover:bg-[#12233e]/30">
              <td className="p-4 font-medium text-white">Draft ILIT Documents</td>
              <td className="p-4"><span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">High</span></td>
              <td className="p-4 text-[#c8d8ec]">Estate Attorney</td>
              <td className="p-4 text-[#c8d8ec]">Q2 2024</td>
            </tr>
            <tr className="border-b border-[#12233e] hover:bg-[#12233e]/30">
              <td className="p-4 font-medium text-white">Fund 529 Plans for Grandchildren</td>
              <td className="p-4"><span className="px-2 py-1 rounded-full text-xs font-medium bg-[#f59e0b]/20 text-[#f59e0b]">Medium</span></td>
              <td className="p-4 text-[#c8d8ec]">Advisor</td>
              <td className="p-4 text-[#c8d8ec]">Q3 2024</td>
            </tr>
            <tr className="border-b border-[#12233e] hover:bg-[#12233e]/30">
              <td className="p-4 font-medium text-white">Execute Roth Conversions</td>
              <td className="p-4"><span className="px-2 py-1 rounded-full text-xs font-medium bg-[#22c55e]/20 text-[#22c55e]">Low</span></td>
              <td className="p-4 text-[#c8d8ec]">CPA / Advisor</td>
              <td className="p-4 text-[#c8d8ec]">Q4 2024</td>
            </tr>
            <tr className="hover:bg-[#12233e]/30">
              <td className="p-4 font-medium text-white">Family Governance Meeting</td>
              <td className="p-4"><span className="px-2 py-1 rounded-full text-xs font-medium bg-[#f59e0b]/20 text-[#f59e0b]">Medium</span></td>
              <td className="p-4 text-[#c8d8ec]">Lead Advisor</td>
              <td className="p-4 text-[#c8d8ec]">Annual</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderTaxEfficiencyTable = () => (
    <div className="rc-card overflow-hidden p-0 mb-6">
      <div className="p-4 border-b border-[#12233e]">
        <h3 className="text-lg font-medium text-white">Tax Efficiency Metrics</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#060d19] border-b border-[#12233e]">
              <th className="p-4 text-sm font-medium text-[#7a95b8]">Metric</th>
              <th className="p-4 text-sm font-medium text-[#7a95b8] text-right">Current Strategy</th>
              <th className="p-4 text-sm font-medium text-[#7a95b8] text-right">Proposed Strategy</th>
              <th className="p-4 text-sm font-medium text-[#7a95b8] text-right">Improvement</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[#12233e] hover:bg-[#12233e]/30">
              <td className="p-4 font-medium text-white">Effective Estate Tax Rate</td>
              <td className="p-4 text-right text-[#c8d8ec]">38.5%</td>
              <td className="p-4 text-right text-[#c8d8ec]">18.2%</td>
              <td className="p-4 text-right font-bold text-[#22c55e]">-20.3%</td>
            </tr>
            <tr className="border-b border-[#12233e] hover:bg-[#12233e]/30">
              <td className="p-4 font-medium text-white">Income Tax Drag (Annual)</td>
              <td className="p-4 text-right text-[#c8d8ec]">1.2%</td>
              <td className="p-4 text-right text-[#c8d8ec]">0.8%</td>
              <td className="p-4 text-right font-bold text-[#22c55e]">-0.4%</td>
            </tr>
            <tr className="border-b border-[#12233e] hover:bg-[#12233e]/30">
              <td className="p-4 font-medium text-white">Wealth Multiplier</td>
              <td className="p-4 text-right text-[#c8d8ec]">1.8x</td>
              <td className="p-4 text-right text-[#c8d8ec]">{wealthMultiplier}x</td>
              <td className="p-4 text-right font-bold text-[#22c55e]">+{Number(wealthMultiplier) - 1.8}x</td>
            </tr>
            <tr className="hover:bg-[#12233e]/30">
              <td className="p-4 font-medium text-white">Probate Exposure</td>
              <td className="p-4 text-right text-[#c8d8ec]">$2.5M</td>
              <td className="p-4 text-right text-[#c8d8ec]">$0.1M</td>
              <td className="p-4 text-right font-bold text-[#22c55e]">-$2.4M</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCharts = () => (
    <div className="space-y-6">
      {/* Chart 1: Projection Area Chart */}
      <div className="rc-card">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-white">90-Year Wealth Projection</h3>
          <div className="flex gap-2">
            <button onClick={() => setChartType('area')} className={`px-3 py-1 text-xs rounded-md ${chartType === 'area' ? 'bg-[#22c55e] text-white' : 'bg-[#12233e] text-[#7a95b8]'}`}>Area</button>
            <button onClick={() => setChartType('line')} className={`px-3 py-1 text-xs rounded-md ${chartType === 'line' ? 'bg-[#3b82f6] text-white' : 'bg-[#12233e] text-[#7a95b8]'}`}>Line</button>
            <button onClick={() => setChartType('composed')} className={`px-3 py-1 text-xs rounded-md ${chartType === 'composed' ? 'bg-[#a855f7] text-white' : 'bg-[#12233e] text-[#7a95b8]'}`}>Composed</button>
          </div>
        </div>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={projectionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorWealth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                <XAxis dataKey="year" stroke="#7a95b8" tick={{ fill: "#7a95b8", fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(v: number) => fmt(v)} stroke="#7a95b8" tick={{ fill: "#7a95b8", fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v: number) => [fmt(v), "Family Wealth"]} labelFormatter={(v) => `Year ${v}`} contentStyle={{ backgroundColor: "#0d1a2e", borderColor: "#12233e", borderRadius: "8px", color: "#fff" }} itemStyle={{ color: "#22c55e" }} />
                <Legend />
                <Area type="monotone" dataKey="wealth" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorWealth)" name="Nominal Wealth" />
                <Area type="monotone" dataKey="inflationAdjustedWealth" stroke="#3b82f6" strokeWidth={2} fillOpacity={0.2} fill="#3b82f6" name="Real Wealth (Inf. Adj)" />
              </AreaChart>
            ) : chartType === 'line' ? (
              <LineChart data={projectionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                <XAxis dataKey="year" stroke="#7a95b8" tick={{ fill: "#7a95b8", fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(v: number) => fmt(v)} stroke="#7a95b8" tick={{ fill: "#7a95b8", fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v: number) => [fmt(v), "Wealth"]} labelFormatter={(v) => `Year ${v}`} contentStyle={{ backgroundColor: "#0d1a2e", borderColor: "#12233e", borderRadius: "8px", color: "#fff" }} />
                <Legend />
                <Line type="monotone" dataKey="wealth" stroke="#22c55e" strokeWidth={3} dot={false} name="Nominal Wealth" />
                <Line type="monotone" dataKey="inflationAdjustedWealth" stroke="#3b82f6" strokeWidth={2} dot={false} name="Real Wealth" />
              </LineChart>
            ) : (
              <ComposedChart data={projectionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                <XAxis dataKey="year" stroke="#7a95b8" tick={{ fill: "#7a95b8", fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(v: number) => fmt(v)} stroke="#7a95b8" tick={{ fill: "#7a95b8", fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v: number) => [fmt(v), "Amount"]} labelFormatter={(v) => `Year ${v}`} contentStyle={{ backgroundColor: "#0d1a2e", borderColor: "#12233e", borderRadius: "8px", color: "#fff" }} />
                <Legend />
                <Area type="monotone" dataKey="wealth" fill="#22c55e" fillOpacity={0.1} stroke="#22c55e" name="Wealth" />
                <Bar dataKey="taxEvent" fill="#ef4444" name="Tax Events" />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chart 2: Generational Bar Chart */}
        <div className="rc-card">
          <h3 className="text-lg font-medium text-white mb-6">Generational Comparison</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                <XAxis dataKey="name" stroke="#7a95b8" tick={{ fill: "#7a95b8", fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(v: number) => fmt(v)} stroke="#7a95b8" tick={{ fill: "#7a95b8", fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ backgroundColor: "#0d1a2e", borderColor: "#12233e", borderRadius: "8px", color: "#fff" }} />
                <Legend wrapperStyle={{ paddingTop: "10px" }} />
                <Bar dataKey="starting" fill="#3b82f6" name="Starting Wealth" radius={[4, 4, 0, 0]} />
                <Bar dataKey="netTransfer" fill="#22c55e" name="Net Transfer" radius={[4, 4, 0, 0]} />
                <Bar dataKey="taxDrag" fill="#ef4444" name="Tax Drag" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Asset Allocation Pie Chart */}
        <div className="rc-card">
          <h3 className="text-lg font-medium text-white mb-6">Target Asset Allocation</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={assetAllocationData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {assetAllocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value}%`, 'Allocation']} contentStyle={{ backgroundColor: "#0d1a2e", borderColor: "#12233e", borderRadius: "8px", color: "#fff" }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Risk Radar Chart */}
        <div className="rc-card">
          <h3 className="text-lg font-medium text-white mb-6">Risk Profile Assessment</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={riskData}>
                <PolarGrid stroke="#12233e" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#7a95b8', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                <Radar name="Current Portfolio" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                <Radar name="Proposed Portfolio" dataKey="B" stroke="#22c55e" fill="#22c55e" fillOpacity={0.5} />
                <Legend />
                <Tooltip contentStyle={{ backgroundColor: "#0d1a2e", borderColor: "#12233e", borderRadius: "8px", color: "#fff" }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 5: Cash Flow Line Chart */}
        <div className="rc-card">
          <h3 className="text-lg font-medium text-white mb-6">Projected Cash Flows (20 Years)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cashFlowData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                <XAxis dataKey="year" stroke="#7a95b8" tick={{ fill: "#7a95b8", fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(v: number) => `$${v/1000}k`} stroke="#7a95b8" tick={{ fill: "#7a95b8", fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v: number) => fmt(v)} labelFormatter={(v) => `Year ${v}`} contentStyle={{ backgroundColor: "#0d1a2e", borderColor: "#12233e", borderRadius: "8px", color: "#fff" }} />
                <Legend />
                <Line type="monotone" dataKey="inflow" stroke="#22c55e" strokeWidth={2} name="Inflows" dot={false} />
                <Line type="monotone" dataKey="outflow" stroke="#ef4444" strokeWidth={2} name="Outflows" dot={false} />
                <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={2} name="Net Cash Flow" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  if (!clients) return renderLoading();

  return (
    <AppShell>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="MultiGenWealthTransfer" />

        <ExecutiveSummary
          pageTitle="Multi Gen Wealth Transfer"
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
        <GoalsAccelerator pageName="Multi Gen Wealth Transfer" pageContext="Multi Gen Wealth Transfer — financial analysis modeling with projections and scenario analysis" />
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
        
        {/* Header */}
        <div className="rc-page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="rc-page-title flex items-center gap-2">
              <Users className="w-6 h-6 text-[#22c55e]" /> 
              Multi-Generational Wealth Transfer
            </h1>
            <p className="rc-page-subtitle mt-1">
              3-generation wealth projection with estate tax optimization, trust strategies, and legacy planning.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ExportToSlides
              toolName="Multi-Generational Wealth Transfer"
              getSections={() => [
                {
                  title: "Wealth Overview",
                  items: [
                    { label: "Current Wealth", value: fmt(totalWealth) },
                    { label: "Gen 3 Net Transfer", value: fmt(gen3Net) },
                    { label: "Wealth Multiplier", value: `${wealthMultiplier}x` },
                    { label: "Total Tax Drag", value: fmt(totalTaxDrag) }
                  ]
                },
                ...generations.map((gen) => ({
                  title: gen.label,
                  items: [
                    { label: "Starting Wealth", value: fmt(gen.startingWealth) },
                    { label: "Projected Wealth", value: fmt(gen.projectedWealth) },
                    { label: "Tax Drag", value: fmt(gen.taxDrag) },
                    { label: "Net Transfer", value: fmt(gen.netTransfer) }
                  ]
                }))
              ]}
            />
            <button onClick={handleExportCSV} className="rc-btn rc-btn-ghost">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
            <button onClick={handleRunSimulation} disabled={isSimulating} className="rc-btn rc-btn-primary">
              <Activity className="w-4 h-4 mr-2" />
              {isSimulating ? `Simulating ${simulationProgress}%` : "Run Monte Carlo"}
            </button>
            <div className="relative">
              <select 
                className="rc-input pl-10 w-[260px] appearance-none"
                value={selectedClientId || String(selectedClient?.id ?? "")} 
                onChange={(e) => setSelectedClientId(e.target.value)}
              >
                {filteredClients.map((c) => (
                  <option key={c.id} value={String(c.id)}>{c.firstName} {c.lastName}</option>
                ))}
              </select>
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7a95b8]" />
            </div>
          </div>
        </div>

        {!selectedClient ? renderNoClient() : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main Content Area */}
            <div className={`flex-1 space-y-6 transition-all duration-300`}>
              {renderSummaryStats()}
              {renderAssumptions()}

              {/* Tabs */}
              <div className="space-y-4">
                <div className="flex space-x-2 border-b border-[#12233e] pb-px overflow-x-auto">
                  {["overview", "projection", "strategies", "tables", "compliance", "ai_insights"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 text-sm font-medium capitalize whitespace-nowrap border-b-2 transition-colors ${
                        activeTab === tab 
                          ? "border-[#22c55e] text-[#22c55e]" 
                          : "border-transparent text-[#7a95b8] hover:text-[#c8d8ec] hover:border-[#12233e]"
                      }`}
                    >
                      {tab.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                {activeTab === "overview" && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {generations.map((gen, i) => (
                      <div key={i} className={`rc-card ${i === 0 ? "border-[#22c55e]/30 bg-[#22c55e]/5" : ""}`}>
                        <div className="flex items-center gap-3 mb-6">
                          <div className={`p-3 rounded-xl ${i === 0 ? "bg-[#22c55e]/20" : i === 1 ? "bg-[#3b82f6]/20" : "bg-[#a855f7]/20"}`}>
                            <Users className={`w-6 h-6 ${i === 0 ? "text-[#22c55e]" : i === 1 ? "text-[#3b82f6]" : "text-[#a855f7]"}`} />
                          </div>
                          <h3 className="font-semibold text-xl text-white">{gen.label}</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          <div className="bg-[#060d19] p-4 rounded-xl border border-[#12233e]">
                            <div className="rc-stat-label mb-1">Starting</div>
                            <div className="text-lg font-bold text-white">{fmt(gen.startingWealth)}</div>
                          </div>
                          <div className="bg-[#060d19] p-4 rounded-xl border border-[#12233e]">
                            <div className="rc-stat-label mb-1">Projected</div>
                            <div className="text-lg font-bold text-[#3b82f6]">{fmt(gen.projectedWealth)}</div>
                          </div>
                          <div className="bg-[#060d19] p-4 rounded-xl border border-red-500/20">
                            <div className="rc-stat-label mb-1">Tax Drag</div>
                            <div className="text-lg font-bold text-red-400">-{fmt(gen.taxDrag)}</div>
                          </div>
                          <div className="bg-[#060d19] p-4 rounded-xl border border-[#22c55e]/20">
                            <div className="rc-stat-label mb-1">Net Transfer</div>
                            <div className="text-lg font-bold text-[#22c55e]">{fmt(gen.netTransfer)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === "projection" && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {renderCharts()}
                  </div>
                )}

                {activeTab === "strategies" && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {generations.map((gen, i) => (
                        <div key={i} className="rc-card h-full">
                          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2 pb-3 border-b border-[#12233e]">
                            {i === 0 ? <Landmark className="w-5 h-5 text-[#22c55e]" /> : 
                             i === 1 ? <Gift className="w-5 h-5 text-[#3b82f6]" /> : 
                             <Heart className="w-5 h-5 text-[#a855f7]" />} 
                            {gen.label}
                          </h3>
                          <div className="space-y-3">
                            {gen.strategies.map((s, j) => (
                              <div key={j} className="flex items-start gap-3 text-sm text-[#c8d8ec] bg-[#060d19] p-3 rounded-lg border border-[#12233e]">
                                <CheckCircle2 className="w-4 h-4 text-[#22c55e] mt-0.5 flex-shrink-0" />
                                <span className="leading-snug">{s}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="rc-card bg-gradient-to-br from-[#0d1a2e] to-[#0a1424]">
                      <h3 className="text-lg font-medium text-white mb-3 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#f0c040]" /> 
                        Wealth Transfer Philosophy
                      </h3>
                      <p className="text-[#c8d8ec] leading-relaxed mb-4">
                        Multi-generational wealth transfer is not just about minimizing taxes — it's about creating a family governance framework that preserves values alongside assets.
                        Research shows that <span className="text-white font-medium">70% of wealth transfers fail by the second generation, and 90% by the third</span>.
                        The primary causes are a breakdown in family communication, lack of financial education for heirs, and absence of a shared family mission.
                        A comprehensive wealth transfer plan addresses all three pillars: financial optimization, family governance, and philanthropic purpose.
                      </p>
                      {showDisclaimer && <NAICDisclaimer />}
                    </div>
                  </div>
                )}

                {activeTab === "tables" && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {renderGenerationsTable()}
                    {renderTrustStructuresTable()}
                    {renderLiquidityTable()}
                    {renderTaxEfficiencyTable()}
                  </div>
                )}

                {activeTab === "compliance" && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {renderComplianceTable()}
                    {renderActionPlanTable()}
                  </div>
                )}

                {activeTab === "ai_insights" && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="rc-card">
                      <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-[#a855f7]" />
                        AI-Generated Insights
                      </h3>
                      {aiInsights ? (
                        <div className="space-y-4">
                          <div className="p-4 bg-[#060d19] rounded-lg border border-[#12233e]">
                            <h4 className="font-medium text-white mb-2">Optimization Opportunity</h4>
                            <p className="text-sm text-[#c8d8ec]">Based on the current trajectory, establishing a Grantor Retained Annuity Trust (GRAT) could shift an additional $1.2M to Generation 2 tax-free over the next 10 years.</p>
                          </div>
                          <div className="p-4 bg-[#060d19] rounded-lg border border-[#12233e]">
                            <h4 className="font-medium text-white mb-2">Risk Alert</h4>
                            <p className="text-sm text-[#c8d8ec]">The 2025 sunset of the TCJA estate tax exemption could expose an additional $6.8M of the estate to a 40% tax rate. Consider accelerating lifetime gifts.</p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-[#7a95b8]">Generating insights...</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            {sidebarOpen && (
              <div className="w-full lg:w-80 space-y-6 flex-shrink-0 animate-in slide-in-from-right-4 duration-300">
                <div className="rc-card">
                  <h3 className="text-lg font-medium text-white mb-4">Scenario Manager</h3>
                  <select className="rc-input w-full mb-4" value={activeScenarioId} onChange={handleScenarioChange}>
                    <option value="">Select a scenario...</option>
                    <option value="base">Base Case (7% / 2.5%)</option>
                    <option value="conservative">Conservative (4% / 3.5%)</option>
                    <option value="aggressive">Aggressive (9% / 2.0%)</option>
                  </select>
                  <button className="rc-btn rc-btn-secondary w-full justify-center">
                    <Plus className="w-4 h-4 mr-2" /> Create Scenario
                  </button>
                </div>

                <div className="rc-card">
                  <h3 className="text-lg font-medium text-white mb-4">Advisor Notes</h3>
                  <textarea 
                    className="rc-input w-full h-32 resize-none" 
                    placeholder="Enter notes for this wealth transfer plan..."
                    value={notes}
                    onChange={handleNotesChange}
                  ></textarea>
                  <button className="rc-btn rc-btn-primary w-full justify-center mt-4">
                    Save Notes
                  </button>
                </div>

                <div className="rc-card bg-[#060d19] border-[#12233e]">
                  <h3 className="text-sm font-medium text-[#7a95b8] mb-3 uppercase tracking-wider">Quick Actions</h3>
                  <div className="space-y-2">
                    <button className="w-full text-left px-3 py-2 text-sm text-[#c8d8ec] hover:bg-[#12233e] rounded-md transition-colors flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-[#3b82f6]" /> Generate PDF Report
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-[#c8d8ec] hover:bg-[#12233e] rounded-md transition-colors flex items-center">
                      <Users className="w-4 h-4 mr-2 text-[#22c55e]" /> Invite Family Members
                    </button>
                    <button className="w-full text-left px-3 py-2 text-sm text-[#c8d8ec] hover:bg-[#12233e] rounded-md transition-colors flex items-center">
                      <Lock className="w-4 h-4 mr-2 text-[#f59e0b]" /> Lock Current Plan
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        <PageInsights pageId="multi-gen-wealth-transfer" />
      </div>
    
        <ComplianceFooter pageName="MultiGenWealthTransfer" showsAnnuity showsTax showsEstate showsProjections />
      </AppShell>
  );
}
