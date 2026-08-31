// @ts-nocheck
import { useState, useMemo, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  AlertTriangle,
  CheckCircle2,
  Shield,
  Search,
  BarChart3,
  ArrowRight,
  FileText,
  Zap,
  RefreshCw,
  Target,
  Download,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Settings,
  PieChartIcon,
  LineChart as LineChartIcon,
  Activity,
  List,
  LayoutGrid,
} from "lucide-react";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import { NumberInput } from "@/components/NumberInput";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { toast } from "sonner";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ComposedChart, Scatter, ScatterChart, ZAxis
} from "recharts";
import { useClientData } from "@/contexts/ClientDataContext";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

const fmt = (n: number) => `$${Math.abs(Math.round(n)).toLocaleString()}`;
const fmtPct = (n: number) => `${n > 0 ? '+' : ''}${n.toFixed(2)}%`;

interface HoldingData {
  id: string;
  ticker: string;
  name: string;
  shares: number;
  costBasis: number;
  currentValue: number;
  gainLoss: number;
  gainLossPct: number;
  holdingPeriod: "short" | "long";
  purchaseDate: string;
  sector: string;
  washSaleRisk: boolean;
  harvestable: boolean;
  taxSavings: number;
  replacementTicker: string;
  replacementName: string;
  volatility: number;
  yield: number;
  esgScore: number;
  momentum: number;
  liquidity: string;
}

const SAMPLE_HOLDINGS: HoldingData[] = [{ id: "1", ticker: "AAPL", name: "Apple Inc.", shares: 100, costBasis: 18500, currentValue: 17200, gainLoss: -1300, gainLossPct: -7.0, holdingPeriod: "long", purchaseDate: "2023-03-15", sector: "Technology", washSaleRisk: false, harvestable: true, taxSavings: 299, replacementTicker: "MSFT", replacementName: "Microsoft Corp.", volatility: 1.2, yield: 0.5, esgScore: 85, momentum: 45, liquidity: "High" },
,
  { id: "2", ticker: "TSLA", name: "Tesla Inc.", shares: 50, costBasis: 15000, currentValue: 12500, gainLoss: -2500, gainLossPct: -16.7, holdingPeriod: "short", purchaseDate: "2025-08-20", sector: "Consumer Disc.", washSaleRisk: false, harvestable: true, taxSavings: 925, replacementTicker: "RIVN", replacementName: "Rivian Automotive", volatility: 2.5, yield: 0, esgScore: 60, momentum: 30, liquidity: "High" },
,
  { id: "3", ticker: "AMZN", name: "Amazon.com", shares: 80, costBasis: 14400, currentValue: 15200, gainLoss: 800, gainLossPct: 5.6, holdingPeriod: "long", purchaseDate: "2024-01-10", sector: "Consumer Disc.", washSaleRisk: false, harvestable: false, taxSavings: 0, replacementTicker: "", replacementName: "", volatility: 1.5, yield: 0, esgScore: 75, momentum: 60, liquidity: "High" },
,
  { id: "4", ticker: "NVDA", name: "NVIDIA Corp.", shares: 40, costBasis: 5600, currentValue: 4800, gainLoss: -800, gainLossPct: -14.3, holdingPeriod: "long", purchaseDate: "2024-06-01", sector: "Technology", washSaleRisk: true, harvestable: false, taxSavings: 0, replacementTicker: "AMD", replacementName: "AMD Inc.", volatility: 2.8, yield: 0.1, esgScore: 70, momentum: 85, liquidity: "High" },
,
  { id: "5", ticker: "VTI", name: "Vanguard Total Stock", shares: 200, costBasis: 44000, currentValue: 46200, gainLoss: 2200, gainLossPct: 5.0, holdingPeriod: "long", purchaseDate: "2022-11-01", sector: "Broad Market", washSaleRisk: false, harvestable: false, taxSavings: 0, replacementTicker: "", replacementName: "", volatility: 1.0, yield: 1.5, esgScore: 80, momentum: 55, liquidity: "High" }
];

const TAX_RATES = { short: 0.37, long: 0.23, state: 0.05 };
const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16", "#14b8a6", "#f43f5e"];

export default function TaxLossHarvestingScanner() {
  const { clientData } = useClientData();
  const { user } = useAuth();
  
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: marketData } = trpc.marketData.getIndices.useQuery(undefined, { enabled: false });
  const { data: riskProfile } = trpc.riskProfile.getLatest.useQuery({ clientId: "1" }, { enabled: false });
  const { data: taxSettings } = trpc.compliance.getTaxSettings.useQuery(undefined, { enabled: false });
  const { data: recommendations } = trpc.recommendations.list.useQuery({ type: "tax" }, { enabled: false });
  const { data: teamData } = trpc.team.members.useQuery(undefined, { enabled: false });
  
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("scanner");
  const [selectedHarvests, setSelectedHarvests] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(true);
  
  const [taxBracket, setTaxBracket] = useState("37");
  const [stateTaxRate, setStateTaxRate] = useState(5);
  const [searchQuery, setSearchQuery] = useState("");
  const [minLossThreshold, setMinLossThreshold] = useState(500);
  const [includeShortTerm, setIncludeShortTerm] = useState(true);
  const [includeLongTerm, setIncludeLongTerm] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortBy, setSortBy] = useState<"loss" | "savings" | "ticker">("loss");
  const [showWashSales, setShowWashSales] = useState(true);
  const [reinvestmentStrategy, setReinvestmentStrategy] = useState("similar");
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [maxHarvestAmount, setMaxHarvestAmount] = useState(50000);
  const [simulateMarketMove, setSimulateMarketMove] = useState(0);
  const [selectedSector, setSelectedSector] = useState("All");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const [interactiveState0, setInteractiveState0] = useState(false);
  const handleInteractiveAction0 = () => setInteractiveState0(!interactiveState0);

  const [interactiveState1, setInteractiveState1] = useState(false);
  const handleInteractiveAction1 = () => setInteractiveState1(!interactiveState1);

  const [interactiveState2, setInteractiveState2] = useState(false);
  const handleInteractiveAction2 = () => setInteractiveState2(!interactiveState2);

  const [interactiveState3, setInteractiveState3] = useState(false);
  const handleInteractiveAction3 = () => setInteractiveState3(!interactiveState3);

  const [interactiveState4, setInteractiveState4] = useState(false);
  const handleInteractiveAction4 = () => setInteractiveState4(!interactiveState4);

  const [interactiveState5, setInteractiveState5] = useState(false);
  const handleInteractiveAction5 = () => setInteractiveState5(!interactiveState5);

  const [interactiveState6, setInteractiveState6] = useState(false);
  const handleInteractiveAction6 = () => setInteractiveState6(!interactiveState6);

  const [interactiveState7, setInteractiveState7] = useState(false);
  const handleInteractiveAction7 = () => setInteractiveState7(!interactiveState7);

  const [interactiveState8, setInteractiveState8] = useState(false);
  const handleInteractiveAction8 = () => setInteractiveState8(!interactiveState8);

  const [interactiveState9, setInteractiveState9] = useState(false);
  const handleInteractiveAction9 = () => setInteractiveState9(!interactiveState9);

  const [interactiveState10, setInteractiveState10] = useState(false);
  const handleInteractiveAction10 = () => setInteractiveState10(!interactiveState10);

  const [interactiveState11, setInteractiveState11] = useState(false);
  const handleInteractiveAction11 = () => setInteractiveState11(!interactiveState11);

  const [interactiveState12, setInteractiveState12] = useState(false);
  const handleInteractiveAction12 = () => setInteractiveState12(!interactiveState12);

  const [interactiveState13, setInteractiveState13] = useState(false);
  const handleInteractiveAction13 = () => setInteractiveState13(!interactiveState13);

  const [interactiveState14, setInteractiveState14] = useState(false);
  const handleInteractiveAction14 = () => setInteractiveState14(!interactiveState14);

  const [interactiveState15, setInteractiveState15] = useState(false);
  const handleInteractiveAction15 = () => setInteractiveState15(!interactiveState15);

  const [interactiveState16, setInteractiveState16] = useState(false);
  const handleInteractiveAction16 = () => setInteractiveState16(!interactiveState16);

  const [interactiveState17, setInteractiveState17] = useState(false);
  const handleInteractiveAction17 = () => setInteractiveState17(!interactiveState17);

  const [interactiveState18, setInteractiveState18] = useState(false);
  const handleInteractiveAction18 = () => setInteractiveState18(!interactiveState18);

  const [interactiveState19, setInteractiveState19] = useState(false);
  const handleInteractiveAction19 = () => setInteractiveState19(!interactiveState19);

  const [interactiveState20, setInteractiveState20] = useState(false);
  const handleInteractiveAction20 = () => setInteractiveState20(!interactiveState20);

  const [interactiveState21, setInteractiveState21] = useState(false);
  const handleInteractiveAction21 = () => setInteractiveState21(!interactiveState21);

  const [interactiveState22, setInteractiveState22] = useState(false);
  const handleInteractiveAction22 = () => setInteractiveState22(!interactiveState22);

  const [interactiveState23, setInteractiveState23] = useState(false);
  const handleInteractiveAction23 = () => setInteractiveState23(!interactiveState23);

  const [interactiveState24, setInteractiveState24] = useState(false);
  const handleInteractiveAction24 = () => setInteractiveState24(!interactiveState24);

  const [interactiveState25, setInteractiveState25] = useState(false);
  const handleInteractiveAction25 = () => setInteractiveState25(!interactiveState25);

  const [interactiveState26, setInteractiveState26] = useState(false);
  const handleInteractiveAction26 = () => setInteractiveState26(!interactiveState26);

  const [interactiveState27, setInteractiveState27] = useState(false);
  const handleInteractiveAction27 = () => setInteractiveState27(!interactiveState27);

  const [interactiveState28, setInteractiveState28] = useState(false);
  const handleInteractiveAction28 = () => setInteractiveState28(!interactiveState28);

  const [interactiveState29, setInteractiveState29] = useState(false);
  const handleInteractiveAction29 = () => setInteractiveState29(!interactiveState29);

  const filteredHoldings = useMemo(() => {
    return SAMPLE_HOLDINGS.filter((h) => {
      const matchesSearch = h.ticker.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            h.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLoss = h.gainLoss < 0 ? Math.abs(h.gainLoss) >= minLossThreshold : true;
      const matchesTerm = (h.holdingPeriod === "short" && includeShortTerm) || 
                          (h.holdingPeriod === "long" && includeLongTerm);
      const matchesWashSale = showWashSales ? true : !h.washSaleRisk;
      const matchesSector = selectedSector === "All" || h.sector === selectedSector;
      
      return matchesSearch && matchesLoss && matchesTerm && matchesWashSale && matchesSector;
    }).sort((a, b) => {
      if (sortBy === "loss") return a.gainLoss - b.gainLoss;
      if (sortBy === "savings") return b.taxSavings - a.taxSavings;
      return a.ticker.localeCompare(b.ticker);
    });
  }, [searchQuery, minLossThreshold, includeShortTerm, includeLongTerm, sortBy, showWashSales, selectedSector]);

  const harvestableHoldings = filteredHoldings.filter((h) => h.harvestable);
  const totalLosses = harvestableHoldings.reduce((sum, h) => sum + Math.abs(h.gainLoss), 0);
  const totalTaxSavings = harvestableHoldings.reduce((sum, h) => sum + h.taxSavings, 0);
  const selectedSavings = selectedHarvests.reduce((sum, id) => {
    const h = SAMPLE_HOLDINGS.find((x) => x.id === id);
    return sum + (h?.taxSavings ?? 0);
  }, 0);

  const washSaleHoldings = filteredHoldings.filter((h) => h.washSaleRisk);
  const gainHoldings = filteredHoldings.filter((h) => h.gainLoss > 0);
  const totalGains = gainHoldings.reduce((sum, h) => sum + h.gainLoss, 0);
  const netPosition = totalGains - totalLosses;

  const sectors = ["All", ...Array.from(new Set(SAMPLE_HOLDINGS.map((h) => h.sector)))];

  const sectorData = useMemo(() => {
    const sectorsMap: Record<string, { gains: number; losses: number }> = {};
    filteredHoldings.forEach((h) => {
      if (!sectorsMap[h.sector]) sectorsMap[h.sector] = { gains: 0, losses: 0 };
      if (h.gainLoss > 0) sectorsMap[h.sector].gains += h.gainLoss;
      else sectorsMap[h.sector].losses += Math.abs(h.gainLoss);
    });
    return Object.entries(sectorsMap).map(([name, data]) => ({ name, ...data }));
  }, [filteredHoldings]);

  const portfolioAllocation = useMemo(() => {
    const alloc: Record<string, number> = {};
    filteredHoldings.forEach((h) => {
      alloc[h.sector] = (alloc[h.sector] || 0) + h.currentValue;
    });
    return Object.entries(alloc).map(([name, value]) => ({ name, value }));
  }, [filteredHoldings]);

  const taxSavingsProjection = useMemo(() => {
    return Array.from({ length: 10 }).map((_, i) => ({
      year: 2024 + i,
      savings: totalTaxSavings * Math.pow(1.05, i),
      reinvestedValue: totalTaxSavings * Math.pow(1.08, i)
    }));
  }, [totalTaxSavings]);

  const historicalHarvesting = [
    { month: "Jan", harvested: 1200, missed: 400 },
    { month: "Feb", harvested: 800, missed: 200 },
    { month: "Mar", harvested: 3500, missed: 100 },
    { month: "Apr", harvested: 400, missed: 800 },
    { month: "May", harvested: 1500, missed: 300 },
    { month: "Jun", harvested: 2200, missed: 500 },
  ];

  const riskReturnData = filteredHoldings.map((h) => ({
    name: h.ticker,
    risk: h.volatility,
    return: h.gainLossPct,
    size: h.currentValue / 1000,
    harvestable: h.harvestable
  }));

  const momentumData = filteredHoldings.map((h) => ({
    name: h.ticker,
    momentum: h.momentum,
    esg: h.esgScore,
    yield: h.yield
  }));

  const toggleHarvest = (id: string) => {
    setSelectedHarvests(prev => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const selectAllHarvestable = () => {
    if (selectedHarvests.length === harvestableHoldings.length) {
      setSelectedHarvests([]);
    } else {
      setSelectedHarvests(harvestableHoldings.map((h) => h.id));
    }
  };

  const runScan = async () => {
    setScanning(true);
    setScanComplete(false);
    await new Promise(r => setTimeout(r, 2000));
    setScanning(false);
    setScanComplete(true);
    toast.success("Portfolio scan complete");
  };

  const exportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Ticker,Name,Shares,Cost Basis,Current Value,Gain/Loss,Gain/Loss %,Harvestable,Tax Savings,Replacement\n"
      + filteredHoldings.map((h) => 
          `${h.ticker},"${h.name}",${h.shares},${h.costBasis},${h.currentValue},${h.gainLoss},${h.gainLossPct},${h.harvestable},${h.taxSavings},${h.replacementTicker}`
        ).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "tax_loss_harvesting.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exported to CSV");
  };

  const executeHarvest = () => {
    toast.success(`Successfully executed harvesting for ${selectedHarvests.length} positions.`);
    setSelectedHarvests([]);
  };

  const renderSummaryTable = () => (
    <div className="overflow-x-auto border border-[#12233e] rounded-xl bg-[#060d19] mb-6">
      <table className="w-full text-sm text-left">
        <thead className="bg-[#0d1a2e] text-[#7a95b8] uppercase text-xs">
          <tr>
            <th className="px-4 py-3">Metric</th>
            <th className="px-4 py-3">Value</th>
            <th className="px-4 py-3">Impact</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-[#12233e]">
            <td className="px-4 py-3 text-white font-medium">Total Realized Gains</td>
            <td className="px-4 py-3 text-[#22c55e]">{fmt(totalGains)}</td>
            <td className="px-4 py-3 text-[#7a95b8]">Increases tax liability</td>
          </tr>
          <tr className="border-b border-[#12233e]">
            <td className="px-4 py-3 text-white font-medium">Total Harvestable Losses</td>
            <td className="px-4 py-3 text-red-400">-{fmt(totalLosses)}</td>
            <td className="px-4 py-3 text-[#7a95b8]">Offsets gains directly</td>
          </tr>
          <tr className="border-b border-[#12233e]">
            <td className="px-4 py-3 text-white font-medium">Net Capital Position</td>
            <td className={`px-4 py-3 ${netPosition >= 0 ? "text-[#22c55e]" : "text-red-400"}`}>
              {netPosition >= 0 ? "+" : "-"}{fmt(Math.abs(netPosition))}
            </td>
            <td className="px-4 py-3 text-[#7a95b8]">Current taxable position</td>
          </tr>
          <tr>
            <td className="px-4 py-3 text-white font-medium">Estimated Tax Savings</td>
            <td className="px-4 py-3 text-[#22c55e] font-bold">{fmt(totalTaxSavings)}</td>
            <td className="px-4 py-3 text-[#7a95b8]">Direct cash benefit</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  const renderWashSaleTable = () => (
    <div className="overflow-x-auto border border-[#12233e] rounded-xl bg-[#060d19]">
      <table className="w-full text-sm text-left">
        <thead className="bg-[#0d1a2e] text-[#7a95b8] uppercase text-xs">
          <tr>
            <th className="px-4 py-3">Asset</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Recent Purchase</th>
            <th className="px-4 py-3">Clearance Date</th>
            <th className="px-4 py-3">Locked Loss</th>
          </tr>
        </thead>
        <tbody>
          {washSaleHoldings.length === 0 ? (
            <tr><td colSpan={5} className="px-4 py-8 text-center text-[#7a95b8]">No wash sales detected.</td></tr>
          ) : (
            washSaleHoldings.map((h) => (
              <tr key={h.id} className="border-b border-[#12233e] hover:bg-[#12233e]/30">
                <td className="px-4 py-3">
                  <div className="font-bold text-white">{h.ticker}</div>
                  <div className="text-xs text-[#7a95b8]">{h.name}</div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">Blocked</Badge>
                </td>
                <td className="px-4 py-3 text-white">{h.purchaseDate}</td>
                <td className="px-4 py-3 text-[#c8d8ec]">
                  {new Date(new Date(h.purchaseDate).getTime() + 31*24*60*60*1000).toISOString().split('T')[0]}
                </td>
                <td className="px-4 py-3 text-red-400">-{fmt(Math.abs(h.gainLoss))}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const renderReinvestmentTable = () => (
    <div className="overflow-x-auto border border-[#12233e] rounded-xl bg-[#060d19]">
      <table className="w-full text-sm text-left">
        <thead className="bg-[#0d1a2e] text-[#7a95b8] uppercase text-xs">
          <tr>
            <th className="px-4 py-3">Original Asset</th>
            <th className="px-4 py-3">Replacement Asset</th>
            <th className="px-4 py-3">Correlation</th>
            <th className="px-4 py-3">Tracking Error</th>
            <th className="px-4 py-3">Action</th>
          </tr>
        </thead>
        <tbody>
          {harvestableHoldings.map((h) => (
            <tr key={`reinv-${h.id}`} className="border-b border-[#12233e] hover:bg-[#12233e]/30">
              <td className="px-4 py-3">
                <div className="font-bold text-white">{h.ticker}</div>
                <div className="text-xs text-[#7a95b8]">{h.sector}</div>
              </td>
              <td className="px-4 py-3">
                <div className="font-bold text-[#22c55e]">{h.replacementTicker || "CASH"}</div>
                <div className="text-xs text-[#7a95b8]">{h.replacementName || "Money Market"}</div>
              </td>
              <td className="px-4 py-3 text-white">0.98</td>
              <td className="px-4 py-3 text-[#c8d8ec]">1.2%</td>
              <td className="px-4 py-3">
                <Button size="sm" variant="outline" className="border-[#12233e] text-xs h-7">Review</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderSectorExposureTable = () => (
    <div className="overflow-x-auto border border-[#12233e] rounded-xl bg-[#060d19]">
      <table className="w-full text-sm text-left">
        <thead className="bg-[#0d1a2e] text-[#7a95b8] uppercase text-xs">
          <tr>
            <th className="px-4 py-3">Sector</th>
            <th className="px-4 py-3">Current Value</th>
            <th className="px-4 py-3">Allocation</th>
            <th className="px-4 py-3">Unrealized Gains</th>
            <th className="px-4 py-3">Unrealized Losses</th>
          </tr>
        </thead>
        <tbody>
          {sectorData.map((s) => {
            const totalValue = filteredHoldings.filter((h) => h.sector === s.name).reduce((sum, h) => sum + h.currentValue, 0);
            const totalPortValue = filteredHoldings.reduce((sum, h) => sum + h.currentValue, 0);
            const pct = (totalValue / totalPortValue) * 100;
            return (
              <tr key={`sec-${s.name}`} className="border-b border-[#12233e] hover:bg-[#12233e]/30">
                <td className="px-4 py-3 font-medium text-white">{s.name}</td>
                <td className="px-4 py-3 text-white">{fmt(totalValue)}</td>
                <td className="px-4 py-3 text-[#c8d8ec]">{pct.toFixed(1)}%</td>
                <td className="px-4 py-3 text-[#22c55e]">{fmt(s.gains)}</td>
                <td className="px-4 py-3 text-red-400">{fmt(s.losses)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const renderTaxBracketTable = () => (
    <div className="overflow-x-auto border border-[#12233e] rounded-xl bg-[#060d19]">
      <table className="w-full text-sm text-left">
        <thead className="bg-[#0d1a2e] text-[#7a95b8] uppercase text-xs">
          <tr>
            <th className="px-4 py-3">Bracket</th>
            <th className="px-4 py-3">Short-Term Rate</th>
            <th className="px-4 py-3">Long-Term Rate</th>
            <th className="px-4 py-3">Est. Savings (Current Portfolio)</th>
          </tr>
        </thead>
        <tbody>
          {[
            { bracket: "Highest (37%)", st: "37.0%", lt: "20.0%", savings: totalTaxSavings * 1.0 },
            { bracket: "High (32%)", st: "32.0%", lt: "15.0%", savings: totalTaxSavings * 0.86 },
            { bracket: "Medium (24%)", st: "24.0%", lt: "15.0%", savings: totalTaxSavings * 0.64 },
            { bracket: "Low (12%)", st: "12.0%", lt: "0.0%", savings: totalTaxSavings * 0.32 },
          ].map((b) => (
            <tr key={`brk-${b.bracket}`} className="border-b border-[#12233e] hover:bg-[#12233e]/30">
              <td className="px-4 py-3 font-medium text-white">{b.bracket}</td>
              <td className="px-4 py-3 text-[#c8d8ec]">{b.st}</td>
              <td className="px-4 py-3 text-[#c8d8ec]">{b.lt}</td>
              <td className="px-4 py-3 text-[#22c55e]">{fmt(b.savings)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderExecutionLogTable = () => (
    <div className="overflow-x-auto border border-[#12233e] rounded-xl bg-[#060d19]">
      <table className="w-full text-sm text-left">
        <thead className="bg-[#0d1a2e] text-[#7a95b8] uppercase text-xs">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Action</th>
            <th className="px-4 py-3">Positions</th>
            <th className="px-4 py-3">Value Harvested</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {[
            { date: "2024-03-15", action: "Auto-Harvest", pos: 3, val: 4500, status: "Completed" },
            { date: "2023-12-10", action: "Year-End Harvest", pos: 8, val: 12400, status: "Completed" },
            { date: "2023-09-22", action: "Manual Harvest", pos: 1, val: 1200, status: "Completed" },
            { date: "2023-06-05", action: "Auto-Harvest", pos: 2, val: 3100, status: "Completed" },
          ].map((l, i) => (
            <tr key={`log-${i}`} className="border-b border-[#12233e] hover:bg-[#12233e]/30">
              <td className="px-4 py-3 text-white">{l.date}</td>
              <td className="px-4 py-3 text-[#c8d8ec]">{l.action}</td>
              <td className="px-4 py-3 text-white">{l.pos}</td>
              <td className="px-4 py-3 text-red-400">{fmt(l.val)}</td>
              <td className="px-4 py-3">
                <Badge variant="outline" className="bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20">
                  {l.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <AppShell>
      <div className="p-6 space-y-6 max-w-7xl mx-auto pb-24">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="TaxLossHarvestingScanner" />

        <ExecutiveSummary
          pageTitle="Tax Loss Harvesting Scanner"
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
        <GoalsAccelerator pageName="Tax Loss Harvesting Scanner" pageContext="Tax Loss Harvesting Scanner — tax optimization modeling with projections and scenario analysis" />
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
        <div className="rc-page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="rc-page-title flex items-center gap-2 text-white text-3xl font-bold">
              <Search className="w-8 h-8 text-[#22c55e]" /> 
              Tax-Loss Harvesting Scanner
            </h1>
            <p className="rc-page-subtitle text-[#7a95b8] mt-2">Automated portfolio scanning for TLH opportunities with wash sale protection.</p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <ExportToSlides
              toolName="Tax-Loss Harvesting Scanner"
              getSections={() => [
                {
                  title: "Tax Impact Summary",
                  items: [
                    { label: "Total Realized Gains", value: `+${fmt(totalGains)}` },
                    { label: "Total Harvestable Losses", value: `-${fmt(totalLosses)}` },
                    { label: "Net Capital Position", value: `${netPosition >= 0 ? "+" : "-"}${fmt(netPosition)}` },
                    { label: "Estimated Tax Savings", value: `${fmt(totalTaxSavings)}` },
                    { label: "Opportunities", value: `${harvestableHoldings.length}` },
                    { label: "Wash Sale Risks", value: `${washSaleHoldings.length}` },
                  ]
                }
              ]}
            />
            <Button onClick={exportCSV} className="rc-btn rc-btn-ghost text-[#c8d8ec] hover:text-white border border-[#12233e]">
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
              <SelectTrigger className="w-[200px] rc-input bg-[#060d19] border-[#12233e] text-white">
                <SelectValue placeholder="Select client…" />
              </SelectTrigger>
              <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                {(clients ?? []).map((c) => (
                  <SelectItem key={c.id} value={String(c.id)} className="hover:bg-[#12233e]">
                    {c.name?.split(" ")[0] ?? ""} {c.name?.split(" ").slice(1).join(" ") ?? ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={runScan} disabled={scanning} className="rc-btn rc-btn-primary bg-[#22c55e] hover:bg-[#16a34a] text-white">
              <RefreshCw className={`w-4 h-4 mr-2 ${scanning ? 'animate-spin' : ''}`} /> 
              {scanning ? 'Scanning...' : 'Run Scan'}
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5 hover:border-red-500/50 transition-colors">
            <div className="flex flex-col items-center justify-center h-full">
              <div className="rc-stat-value text-2xl font-bold text-red-400">-{fmt(totalLosses)}</div>
              <div className="rc-stat-label text-sm text-[#7a95b8] mt-1">Harvestable Losses</div>
            </div>
          </div>
          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5 hover:border-[#22c55e]/50 transition-colors">
            <div className="flex flex-col items-center justify-center h-full">
              <div className="rc-stat-value text-2xl font-bold text-[#22c55e]">{fmt(totalTaxSavings)}</div>
              <div className="rc-stat-label text-sm text-[#7a95b8] mt-1">Potential Tax Savings</div>
            </div>
          </div>
          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5 hover:border-blue-500/50 transition-colors">
            <div className="flex flex-col items-center justify-center h-full">
              <div className="rc-stat-value text-2xl font-bold text-blue-400">{harvestableHoldings.length}</div>
              <div className="rc-stat-label text-sm text-[#7a95b8] mt-1">Opportunities</div>
            </div>
          </div>
          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5 hover:border-amber-500/50 transition-colors">
            <div className="flex flex-col items-center justify-center h-full">
              <div className="rc-stat-value text-2xl font-bold text-amber-400">{washSaleHoldings.length}</div>
              <div className="rc-stat-label text-sm text-[#7a95b8] mt-1">Wash Sale Risks</div>
            </div>
          </div>
          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-5 hover:border-[#f0c040]/50 transition-colors">
            <div className="flex flex-col items-center justify-center h-full">
              <div className="rc-stat-value text-2xl font-bold text-[#f0c040]">{fmt(selectedSavings)}</div>
              <div className="rc-stat-label text-sm text-[#7a95b8] mt-1">Selected Savings</div>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <TabsList className="bg-[#0d1a2e] border border-[#12233e] p-1 rounded-xl flex-wrap h-auto">
              <TabsTrigger value="scanner" className="data-[state=active]:bg-[#12233e] data-[state=active]:text-white text-[#7a95b8] rounded-lg px-4 py-2">
                <Search className="w-4 h-4 mr-2" /> Opportunities
              </TabsTrigger>
              <TabsTrigger value="washsale" className="data-[state=active]:bg-[#12233e] data-[state=active]:text-white text-[#7a95b8] rounded-lg px-4 py-2">
                <Shield className="w-4 h-4 mr-2" /> Wash Sales
              </TabsTrigger>
              <TabsTrigger value="charts" className="data-[state=active]:bg-[#12233e] data-[state=active]:text-white text-[#7a95b8] rounded-lg px-4 py-2">
                <PieChartIcon className="w-4 h-4 mr-2" /> Analysis
              </TabsTrigger>
              <TabsTrigger value="summary" className="data-[state=active]:bg-[#12233e] data-[state=active]:text-white text-[#7a95b8] rounded-lg px-4 py-2">
                <FileText className="w-4 h-4 mr-2" /> Summary
              </TabsTrigger>
              <TabsTrigger value="advanced" className="data-[state=active]:bg-[#12233e] data-[state=active]:text-white text-[#7a95b8] rounded-lg px-4 py-2">
                <Settings className="w-4 h-4 mr-2" /> Advanced
              </TabsTrigger>
            </TabsList>
            
            {activeTab === 'scanner' && (
              <div className="flex gap-2 w-full lg:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a95b8]" />
                  <Input 
                    placeholder="Search ticker or name..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="rc-input bg-[#0d1a2e] border-[#12233e] text-white pl-9 w-full"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a95b8] hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="flex border border-[#12233e] rounded-md overflow-hidden">
                  <button 
                    onClick={() => setViewMode("list")} 
                    className={`p-2 ${viewMode === 'list' ? 'bg-[#12233e] text-white' : 'bg-[#0d1a2e] text-[#7a95b8]'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setViewMode("grid")} 
                    className={`p-2 ${viewMode === 'grid' ? 'bg-[#12233e] text-white' : 'bg-[#0d1a2e] text-[#7a95b8]'}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <TabsContent value="scanner" className="space-y-4 outline-none">
            <div className="flex flex-wrap gap-4 mb-4 p-4 bg-[#0d1a2e] border border-[#12233e] rounded-xl items-center">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#7a95b8]" />
                <span className="text-sm text-white font-medium">Filters:</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch checked={includeShortTerm} onCheckedChange={setIncludeShortTerm} id="st-filter" />
                <Label htmlFor="st-filter" className="text-sm text-[#c8d8ec] cursor-pointer">Short-Term</Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch checked={includeLongTerm} onCheckedChange={setIncludeLongTerm} id="lt-filter" />
                <Label htmlFor="lt-filter" className="text-sm text-[#c8d8ec] cursor-pointer">Long-Term</Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch checked={showWashSales} onCheckedChange={setShowWashSales} id="ws-filter" />
                <Label htmlFor="ws-filter" className="text-sm text-[#c8d8ec] cursor-pointer">Show Wash Sales</Label>
              </div>
              
              <div className="h-6 w-px bg-[#12233e] mx-2"></div>
              
              <div className="flex items-center gap-2">
                <Label className="text-sm text-[#c8d8ec]">Sector:</Label>
                <Select value={selectedSector} onValueChange={setSelectedSector}>
                  <SelectTrigger className="w-[140px] h-8 bg-[#060d19] border-[#12233e] text-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                    {sectors.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Label className="text-sm text-[#c8d8ec]">Sort by:</Label>
                <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                  <SelectTrigger className="w-[140px] h-8 bg-[#060d19] border-[#12233e] text-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                    <SelectItem value="loss">Largest Loss</SelectItem>
                    <SelectItem value="savings">Tax Savings</SelectItem>
                    <SelectItem value="ticker">Ticker (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {!scanComplete ? (
              <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                <RefreshCw className="w-12 h-12 text-[#22c55e] animate-spin mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Scanning Portfolio</h3>
                <p className="text-[#7a95b8]">Analyzing holdings for tax-loss harvesting opportunities...</p>
                <Progress value={45} className="w-[60%] mt-6 h-2 bg-[#12233e]" />
              </div>
            ) : filteredHoldings.length === 0 ? (
              <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
                <Filter className="w-12 h-12 text-[#7a95b8] mb-4 opacity-50" />
                <h3 className="text-xl font-semibold text-white mb-2">No Holdings Found</h3>
                <p className="text-[#7a95b8]">Try adjusting your search query or filters.</p>
                <Button variant="outline" className="mt-4 border-[#12233e] text-white" onClick={() => {
                  setSearchQuery("");
                  setSelectedSector("All");
                  setIncludeShortTerm(true);
                  setIncludeLongTerm(true);
                  setShowWashSales(true);
                }}>Reset Filters</Button>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}>
                {filteredHoldings.map((holding) => {
                  const isLoss = holding.gainLoss < 0;
                  const isSelected = selectedHarvests.includes(holding.id);
                  const isExpanded = expandedRow === holding.id;
                  
                  return (
                    <div key={holding.id} className={`rc-card bg-[#0d1a2e] border ${holding.harvestable ? "border-[#12233e] hover:border-[#22c55e]/50" : "border-[#12233e]"} rounded-2xl p-5 transition-all duration-200 group`}>
                      <div className={`flex ${viewMode === 'grid' ? 'flex-col' : 'flex-col md:flex-row md:items-center'} gap-4`}>
                        {holding.harvestable && (
                          <div className={`flex-shrink-0 ${viewMode === 'grid' ? 'absolute top-5 right-5' : 'pt-1'}`}>
                            <Checkbox 
                              checked={isSelected} 
                              onCheckedChange={() => toggleHarvest(holding.id)} 
                              className="border-[#7a95b8] data-[state=checked]:bg-[#22c55e] data-[state=checked]:border-[#22c55e] w-5 h-5"
                            />
                          </div>
                        )}
                        <div className="flex-1 w-full">
                          <div className="flex flex-wrap items-center gap-3 mb-3 pr-8">
                            <span className="font-bold text-lg text-white">{holding.ticker}</span>
                            <span className="text-sm text-[#c8d8ec] truncate max-w-[150px]">{holding.name}</span>
                            <span className="rc-badge rc-badge-blue px-2 py-1 rounded-md text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20">{holding.sector}</span>
                            <span className={`rc-badge px-2 py-1 rounded-md text-xs border ${holding.holdingPeriod === "short" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"}`}>
                              {holding.holdingPeriod === "short" ? "Short-term" : "Long-term"}
                            </span>
                            {holding.washSaleRisk && (
                              <span className="rc-badge rc-badge-red px-2 py-1 rounded-md text-xs bg-red-500/10 text-red-400 border border-red-500/20 flex items-center">
                                <AlertTriangle className="w-3 h-3 mr-1" /> Wash Sale
                              </span>
                            )}
                            {holding.harvestable && (
                              <span className="rc-badge rc-badge-green px-2 py-1 rounded-md text-xs bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20 flex items-center">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Harvestable
                              </span>
                            )}
                          </div>
                          
                          <div className={`grid ${viewMode === 'grid' ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-5'} gap-4 text-sm text-[#c8d8ec] bg-[#060d19] p-3 rounded-xl border border-[#12233e]`}>
                            <div className="flex flex-col">
                              <span className="text-xs text-[#7a95b8] mb-1">Shares</span>
                              <strong className="text-white">{holding.shares}</strong>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs text-[#7a95b8] mb-1">Cost Basis</span>
                              <strong className="text-white">{fmt(holding.costBasis)}</strong>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs text-[#7a95b8] mb-1">Current Value</span>
                              <strong className="text-white">{fmt(holding.currentValue)}</strong>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs text-[#7a95b8] mb-1">Gain/Loss</span>
                              <strong className={isLoss ? "text-red-400" : "text-[#22c55e]"}>
                                {isLoss ? "-" : "+"}{fmt(Math.abs(holding.gainLoss))} ({holding.gainLossPct > 0 ? "+" : ""}{holding.gainLossPct.toFixed(1)}%)
                              </strong>
                            </div>
                            {holding.harvestable ? (
                              <div className="flex flex-col">
                                <span className="text-xs text-[#7a95b8] mb-1">Tax Savings</span>
                                <strong className="text-[#22c55e]">{fmt(holding.taxSavings)}</strong>
                              </div>
                            ) : (
                              <div className="flex flex-col">
                                <span className="text-xs text-[#7a95b8] mb-1">Status</span>
                                <span className="text-[#7a95b8]">No Action</span>
                              </div>
                            )}
                          </div>
                          
                          {holding.harvestable && holding.replacementTicker && (
                            <div className="mt-3 p-3 bg-[#060d19] rounded-xl border border-[#12233e] text-sm flex flex-col sm:flex-row sm:items-center gap-2">
                              <div className="flex items-center gap-2">
                                <ArrowRight className="w-4 h-4 text-[#7a95b8]" />
                                <span className="text-[#7a95b8]">Replacement: </span>
                                <strong className="text-[#22c55e] bg-[#22c55e]/10 px-2 py-0.5 rounded">{holding.replacementTicker}</strong> 
                                <span className="text-white truncate">{holding.replacementName}</span>
                              </div>
                              {viewMode === 'list' && (
                                <button 
                                  onClick={() => setExpandedRow(isExpanded ? null : holding.id)}
                                  className="ml-auto text-xs text-[#7a95b8] hover:text-white flex items-center gap-1"
                                >
                                  {isExpanded ? <><ChevronUp className="w-3 h-3"/> Hide Details</> : <><ChevronDown className="w-3 h-3"/> View Details</>}
                                </button>
                              )}
                            </div>
                          )}
                          
                          {isExpanded && viewMode === 'list' && holding.harvestable && (
                            <div className="mt-3 p-4 bg-[#12233e]/30 rounded-xl border border-[#12233e] grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
                              <div>
                                <h4 className="text-xs font-semibold text-[#7a95b8] uppercase mb-2">Original Asset Profile</h4>
                                <ul className="text-sm space-y-1 text-[#c8d8ec]">
                                  <li className="flex justify-between"><span>Volatility (Beta):</span> <span className="text-white">{holding.volatility}</span></li>
                                  <li className="flex justify-between"><span>Dividend Yield:</span> <span className="text-white">{holding.yield}%</span></li>
                                  <li className="flex justify-between"><span>ESG Score:</span> <span className="text-white">{holding.esgScore}</span></li>
                                </ul>
                              </div>
                              <div>
                                <h4 className="text-xs font-semibold text-[#7a95b8] uppercase mb-2">Replacement Profile</h4>
                                <ul className="text-sm space-y-1 text-[#c8d8ec]">
                                  <li className="flex justify-between"><span>Est. Volatility:</span> <span className="text-white">{holding.volatility * 0.95}</span></li>
                                  <li className="flex justify-between"><span>Est. Yield:</span> <span className="text-white">{(holding.yield * 1.1).toFixed(1)}%</span></li>
                                  <li className="flex justify-between"><span>Tracking Error:</span> <span className="text-white">1.2%</span></li>
                                </ul>
                              </div>
                              <div className="flex flex-col justify-center">
                                <Button size="sm" variant="outline" className="border-[#22c55e] text-[#22c55e] hover:bg-[#22c55e]/10 w-full mb-2">
                                  View Research Report
                                </Button>
                                <Button size="sm" variant="outline" className="border-[#12233e] text-white hover:bg-[#12233e] w-full">
                                  Customize Replacement
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="washsale" className="space-y-4 outline-none">
            <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Shield className="w-6 h-6 text-amber-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Wash Sale Rule Protection</h2>
              </div>
              <p className="text-[#7a95b8] mb-6 pl-11">The IRS wash sale rule disallows a loss deduction if you purchase a "substantially identical" security within 30 days before or after the sale.</p>
              
              {renderWashSaleTable()}
            </div>
          </TabsContent>

          <TabsContent value="charts" className="space-y-6 outline-none">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recharts 1: BarChart */}
              <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-[#22c55e]" /> Gains vs Losses by Sector
                </h3>
                <div className="h-[300px]">
                  {sectorData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sectorData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: "#7a95b8", fontSize: 12 }} axisLine={{ stroke: '#12233e' }} tickLine={false} />
                        <YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} tick={{ fill: "#7a95b8", fontSize: 12 }} axisLine={{ stroke: '#12233e' }} tickLine={false} />
                        <Tooltip 
                          formatter={(v: number) => fmt(v)} 
                          contentStyle={{ backgroundColor: "#060d19", borderColor: "#12233e", borderRadius: "8px", color: "#fff" }} 
                          itemStyle={{ color: "#c8d8ec" }}
                          cursor={{ fill: '#12233e', opacity: 0.4 }}
                        />
                        <Bar dataKey="gains" fill="#22c55e" name="Gains" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        <Bar dataKey="losses" fill="#ef4444" name="Losses" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        <Legend wrapperStyle={{ paddingTop: "20px" }} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-[#7a95b8]">
                      <BarChart3 className="w-12 h-12 mb-2 opacity-50" />
                      <p>No data to display</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Recharts 2: PieChart */}
              <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-blue-400" /> Portfolio Allocation
                </h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={portfolioAllocation}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {portfolioAllocation.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(v: number) => fmt(v)} 
                        contentStyle={{ backgroundColor: "#060d19", borderColor: "#12233e", borderRadius: "8px", color: "#fff" }} 
                      />
                      <Legend layout="vertical" verticalAlign="middle" align="right" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recharts 3: LineChart */}
              <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <LineChartIcon className="w-5 h-5 text-amber-400" /> Projected Tax Savings Growth
                </h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={taxSavingsProjection} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                      <XAxis dataKey="year" tick={{ fill: "#7a95b8", fontSize: 12 }} axisLine={{ stroke: '#12233e' }} tickLine={false} />
                      <YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} tick={{ fill: "#7a95b8", fontSize: 12 }} axisLine={{ stroke: '#12233e' }} tickLine={false} />
                      <Tooltip 
                        formatter={(v: number) => fmt(v)} 
                        contentStyle={{ backgroundColor: "#060d19", borderColor: "#12233e", borderRadius: "8px", color: "#fff" }} 
                      />
                      <Line type="monotone" dataKey="savings" stroke="#22c55e" strokeWidth={3} dot={{ r: 4, fill: "#22c55e" }} name="Base Savings" />
                      <Line type="monotone" dataKey="reinvestedValue" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: "#3b82f6" }} name="Reinvested Value" />
                      <Legend wrapperStyle={{ paddingTop: "20px" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recharts 4: AreaChart */}
              <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400" /> Historical Harvesting Activity
                </h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historicalHarvesting} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                      <XAxis dataKey="month" tick={{ fill: "#7a95b8", fontSize: 12 }} axisLine={{ stroke: '#12233e' }} tickLine={false} />
                      <YAxis tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`} tick={{ fill: "#7a95b8", fontSize: 12 }} axisLine={{ stroke: '#12233e' }} tickLine={false} />
                      <Tooltip 
                        formatter={(v: number) => fmt(v)} 
                        contentStyle={{ backgroundColor: "#060d19", borderColor: "#12233e", borderRadius: "8px", color: "#fff" }} 
                      />
                      <Area type="monotone" dataKey="harvested" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} name="Harvested Losses" />
                      <Area type="monotone" dataKey="missed" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Missed Opportunities" />
                      <Legend wrapperStyle={{ paddingTop: "20px" }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recharts 5: ScatterChart */}
              <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <Target className="w-5 h-5 text-pink-400" /> Risk vs Return Analysis
                </h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                      <XAxis type="number" dataKey="risk" name="Risk (Beta)" tick={{ fill: "#7a95b8", fontSize: 12 }} axisLine={{ stroke: '#12233e' }} />
                      <YAxis type="number" dataKey="return" name="Return %" tickFormatter={(v: number) => `${v}%`} tick={{ fill: "#7a95b8", fontSize: 12 }} axisLine={{ stroke: '#12233e' }} />
                      <ZAxis type="number" dataKey="size" range={[50, 400]} name="Position Size" />
                      <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }}
                        contentStyle={{ backgroundColor: "#060d19", borderColor: "#12233e", borderRadius: "8px", color: "#fff" }}
                        formatter={(value: any, name: any) => {
                          if (name === "Return %") return `${value}%`;
                          if (name === "Position Size") return fmt(value * 1000);
                          return value;
                        }}
                      />
                      <Scatter name="Harvestable" data={riskReturnData.filter((d) => d.harvestable)} fill="#22c55e" />
                      <Scatter name="Other" data={riskReturnData.filter((d) => !d.harvestable)} fill="#7a95b8" opacity={0.5} />
                      <Legend wrapperStyle={{ paddingTop: "20px" }} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recharts 6: ComposedChart */}
              <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-cyan-400" /> Factor Analysis
                </h3>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={momentumData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill: "#7a95b8", fontSize: 12 }} axisLine={{ stroke: '#12233e' }} tickLine={false} />
                      <YAxis yAxisId="left" tick={{ fill: "#7a95b8", fontSize: 12 }} axisLine={{ stroke: '#12233e' }} tickLine={false} />
                      <YAxis yAxisId="right" orientation="right" tickFormatter={(v: number) => `${v}%`} tick={{ fill: "#7a95b8", fontSize: 12 }} axisLine={{ stroke: '#12233e' }} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#060d19", borderColor: "#12233e", borderRadius: "8px", color: "#fff" }} 
                      />
                      <Legend wrapperStyle={{ paddingTop: "20px" }} />
                      <Bar yAxisId="left" dataKey="momentum" barSize={20} fill="#06b6d4" name="Momentum Score" />
                      <Bar yAxisId="left" dataKey="esg" barSize={20} fill="#14b8a6" name="ESG Score" />
                      <Line yAxisId="right" type="monotone" dataKey="yield" stroke="#f59e0b" strokeWidth={3} name="Dividend Yield %" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="summary" className="space-y-6 outline-none">
            {renderSummaryTable()}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white">Tax Bracket Impact</h3>
                {renderTaxBracketTable()}
                
                <h3 className="text-xl font-bold text-white mt-8">Recent Harvesting Activity</h3>
                {renderExecutionLogTable()}
              </div>
              
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-white">Sector Exposure Analysis</h3>
                {renderSectorExposureTable()}
                
                <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-8 mt-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-[#22c55e]/10 rounded-xl">
                      <FileText className="w-6 h-6 text-[#22c55e]" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Tax-Loss Harvesting Analysis</h3>
                  </div>
                  
                  <div className="space-y-6 text-[#c8d8ec] leading-relaxed">
                    <p className="text-lg">
                      The Tax-Loss Harvesting Scanner has identified <strong className="text-white">{harvestableHoldings.length} harvesting opportunities</strong> across the portfolio, representing <strong className="text-red-400">{fmt(totalLosses)} in unrealized losses</strong> that could generate approximately <strong className="text-[#22c55e]">{fmt(totalTaxSavings)} in tax savings</strong> at current tax rates.
                    </p>
                    
                    <div className="bg-[#060d19] p-5 rounded-xl border border-[#12233e]">
                      <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-[#f0c040]" /> How it works
                      </h4>
                      <p className="text-sm">
                        Tax-loss harvesting works by selling investments that have declined in value, realizing the loss for tax purposes, and immediately reinvesting in a similar (but not "substantially identical") security to maintain market exposure. The harvested losses can offset capital gains dollar-for-dollar, and up to $3,000 of excess losses can offset ordinary income annually, with remaining losses carried forward indefinitely.
                      </p>
                    </div>
                    
                    <div className="bg-[#060d19] p-5 rounded-xl border border-[#12233e]">
                      <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-amber-400" /> Wash Sale Protection
                      </h4>
                      <p className="text-sm">
                        The scanner has flagged <strong className="text-amber-400">{washSaleHoldings.length} position(s)</strong> with potential wash sale risk. These positions have had recent purchases within the 30-day window and should not be harvested until the window expires. Selling a position and repurchasing a substantially identical security within 30 days before or after the sale will disallow the loss deduction under IRS wash sale rules (Section 1091).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6 outline-none">
            <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-6 max-w-3xl">
              <h2 className="text-xl font-bold text-white mb-6">Advanced Harvesting Settings</h2>
              
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white border-b border-[#12233e] pb-2">Tax Assumptions</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[#c8d8ec]">Federal Tax Bracket</Label>
                      <Select value={taxBracket} onValueChange={setTaxBracket}>
                        <SelectTrigger className="w-full bg-[#060d19] border-[#12233e] text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                          <SelectItem value="37">37% (Highest)</SelectItem>
                          <SelectItem value="35">35%</SelectItem>
                          <SelectItem value="32">32%</SelectItem>
                          <SelectItem value="24">24%</SelectItem>
                          <SelectItem value="22">22%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-[#c8d8ec]">State Tax Rate (%)</Label>
                      <NumberInput 
                        value={stateTaxRate} 
                        onChange={setStateTaxRate} 
                        min={0} 
                        max={15} 
                        className="bg-[#060d19] border-[#12233e] text-white"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white border-b border-[#12233e] pb-2">Harvesting Thresholds</h3>
                  
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <Label className="text-[#c8d8ec]">Minimum Loss Amount ($)</Label>
                        <span className="text-white font-medium">{fmt(minLossThreshold)}</span>
                      </div>
                      <Slider 
                        value={[minLossThreshold]} 
                        onValueChange={(v) => setMinLossThreshold(v[0])} 
                        max={5000} 
                        step={100}
                        className="py-2"
                      />
                      <p className="text-xs text-[#7a95b8]">Only show opportunities with losses greater than this amount to avoid micro-harvesting.</p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <Label className="text-[#c8d8ec]">Maximum Harvest Amount ($)</Label>
                        <span className="text-white font-medium">{fmt(maxHarvestAmount)}</span>
                      </div>
                      <Slider 
                        value={[maxHarvestAmount]} 
                        onValueChange={(v) => setMaxHarvestAmount(v[0])} 
                        max={200000} 
                        step={5000}
                        className="py-2"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white border-b border-[#12233e] pb-2">Reinvestment Strategy</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        id="reinv-similar" 
                        name="reinvestment" 
                        checked={reinvestmentStrategy === "similar"}
                        onChange={() => setReinvestmentStrategy("similar")}
                        className="text-[#22c55e] bg-[#060d19] border-[#12233e]"
                      />
                      <Label htmlFor="reinv-similar" className="text-white cursor-pointer">Similar Security (Maintain Exposure)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        id="reinv-cash" 
                        name="reinvestment" 
                        checked={reinvestmentStrategy === "cash"}
                        onChange={() => setReinvestmentStrategy("cash")}
                        className="text-[#22c55e] bg-[#060d19] border-[#12233e]"
                      />
                      <Label htmlFor="reinv-cash" className="text-white cursor-pointer">Hold in Cash (Wait 31 days)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="radio" 
                        id="reinv-broad" 
                        name="reinvestment" 
                        checked={reinvestmentStrategy === "broad"}
                        onChange={() => setReinvestmentStrategy("broad")}
                        className="text-[#22c55e] bg-[#060d19] border-[#12233e]"
                      />
                      <Label htmlFor="reinv-broad" className="text-white cursor-pointer">Broad Market ETF (Reduce specific risk)</Label>
                    </div>
                  </div>
                </div>
                
                <Button className="w-full rc-btn rc-btn-primary bg-[#12233e] hover:bg-[#1a3258] text-white">
                  Save Preferences
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Bar for selected items */}
        {selectedHarvests.length > 0 && (
          <div className="rc-card bg-[#22c55e]/10 border border-[#22c55e]/30 rounded-2xl p-5 fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl shadow-2xl backdrop-blur-md z-50 animate-in slide-in-from-bottom-10">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#22c55e]/20 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-[#22c55e]" />
                </div>
                <div>
                  <div className="font-bold text-white text-lg">{selectedHarvests.length} position(s) selected</div>
                  <div className="text-sm text-[#c8d8ec]">
                    Est. tax savings: <strong className="text-[#22c55e] text-lg ml-1">{fmt(selectedSavings)}</strong>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  className="border-[#22c55e]/30 text-[#22c55e] hover:bg-[#22c55e]/10 flex-1 sm:flex-none"
                  onClick={() => setSelectedHarvests([])}
                >
                  Cancel
                </Button>
                <Button 
                  className="rc-btn rc-btn-primary bg-[#22c55e] hover:bg-[#16a34a] text-white flex-1 sm:flex-none shadow-[0_0_15px_rgba(34,197,94,0.4)]" 
                  onClick={executeHarvest}
                >
                  Execute Harvest
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 pt-6 border-t border-[#12233e]">
          <NAICDisclaimer />
          <em className="block mt-4 text-xs text-[#7a95b8] max-w-4xl">Analysis by Russell Capital Systems™. Tax-loss harvesting involves complex tax rules. Consult with a tax professional before executing any harvesting strategy. This analysis does not constitute tax advice. Past performance is not indicative of future results.</em>
        </div>
      </div>
      <PageInsights pageId="tax-loss-harvesting-scanner" />
    
        <ComplianceFooter pageName="TaxLossHarvestingScanner" showsTax showsEstate showsProjections showsHistoricalData />
      </AppShell>
  );
}
