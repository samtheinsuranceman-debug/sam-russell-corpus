// @ts-nocheck
import React, { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Settings,
  Plus,
  Pencil,
  Trash2,
  Shield,
  Info,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Search,
  Activity,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Eye,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Save,
  Star,
  TrendingUp,
  X,
  ChevronRight,
  Edit,
  Layers,
  Settings2,
  Share,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, ComposedChart, Scatter
} from "recharts";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";

const DEFAULT_CARRIERS = [{ id: "aaa-plus-mutual", name: "AAA+ Mutual", rating: "A++", founded: 1850, hq: "New York, NY", amBest: "A++", sp: "AA+", moody: "Aa1", fitch: "AA+" },
,
  { id: "national-life", name: "National Life Group", rating: "A+", founded: 1848, hq: "Montpelier, VT", amBest: "A+", sp: "A+", moody: "A1", fitch: "A+" },
,
  { id: "bbb-plus-mutual", name: "BBB+ Mutual", rating: "B++", founded: 1905, hq: "Chicago, IL", amBest: "B++", sp: "BBB+", moody: "Baa1", fitch: "BBB+" },
,
  { id: "aa-minus-mutual", name: "AA- Mutual", rating: "A+", founded: 1888, hq: "Boston, MA", amBest: "A+", sp: "AA-", moody: "Aa3", fitch: "AA-" },
,
  { id: "a-mutual", name: "A Mutual Life", rating: "A", founded: 1920, hq: "Dallas, TX", amBest: "A", sp: "A", moody: "A2", fitch: "A" }
];

const DEFAULTS = { loadFee: "0.0800", coiRate: "0.0080", capRate: "0.1450", floorRate: "0.0000", avgReturn: "0.0750", participationRate: "1.0000", fixedAccountRate: "0.0400", loanRate: "0.0500", bonusRate: "0.0100", assetBasedFee: "0.0025", policyFee: "120" };

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];

interface ParsedCarrierRow {
  carrierId: string;
  carrierName: string;
  loadFee: string;
  coiRate: string;
  capRate: string;
  floorRate: string;
  avgReturn: string;
  participationRate: string;
  fixedAccountRate: string;
  loanRate: string;
  bonusRate: string;
  assetBasedFee: string;
  policyFee: string;
  notes: string;
  valid: boolean;
  errors: string[];
}

function parseCSV(text: string): ParsedCarrierRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase().replace(/["\s]/g, "").split(",");
  const colMap: Record<string, number> = {};
  header.forEach((h, i) => {
    if (h.includes("carrier") && (h.includes("id") || h === "carrierid")) colMap.carrierId = i;
    else if (h.includes("carrier") && h.includes("name")) colMap.carrierName = i;
    else if (h.includes("load") || h === "loadfee") colMap.loadFee = i;
    else if (h.includes("coi") || h === "coirate") colMap.coiRate = i;
    else if (h.includes("cap") || h === "caprate") colMap.capRate = i;
    else if (h.includes("floor") || h === "floorrate") colMap.floorRate = i;
    else if (h.includes("avg") || h.includes("return") || h === "avgreturn") colMap.avgReturn = i;
    else if (h.includes("part") || h === "participationrate") colMap.participationRate = i;
    else if (h.includes("fixed") || h === "fixedaccountrate") colMap.fixedAccountRate = i;
    else if (h.includes("loan") || h === "loanrate") colMap.loanRate = i;
    else if (h.includes("bonus") || h === "bonusrate") colMap.bonusRate = i;
    else if (h.includes("asset") || h === "assetbasedfee") colMap.assetBasedFee = i;
    else if (h.includes("policy") || h === "policyfee") colMap.policyFee = i;
    else if (h.includes("note")) colMap.notes = i;
    else if (h.includes("name") && !colMap.carrierName) colMap.carrierName = i;
    else if (h.includes("id") && !colMap.carrierId) colMap.carrierId = i;
  });

  const rows: ParsedCarrierRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const fields: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { fields.push(current.trim()); current = ""; continue; }
      current += ch;
    }
    fields.push(current.trim());

    const errors: string[] = [];
    const carrierId = fields[colMap.carrierId ?? 0] ?? "";
    const carrierName = fields[colMap.carrierName ?? 1] ?? "";

    if (!carrierId) errors.push("Missing carrier ID");
    if (!carrierName) errors.push("Missing carrier name");

    const parseRate = (val: string | undefined, fieldName: string): string => {
      if (!val || val === "" || val === "-") return "";
      const cleaned = val.replace(/[%$\s]/g, "");
      const num = parseFloat(cleaned);
      if (isNaN(num)) { errors.push(`Invalid ${fieldName}: ${val}`); return ""; }
      return num > 1 ? (num / 100).toFixed(4) : num.toFixed(4);
    };
    
    const parseCurrency = (val: string | undefined, fieldName: string): string => {
      if (!val || val === "" || val === "-") return "";
      const cleaned = val.replace(/[%$\s,]/g, "");
      const num = parseFloat(cleaned);
      if (isNaN(num)) { errors.push(`Invalid ${fieldName}: ${val}`); return ""; }
      return num.toString();
    };

    const loadFee = parseRate(fields[colMap.loadFee ?? 2], "load fee") || DEFAULTS.loadFee;
    const coiRate = parseRate(fields[colMap.coiRate ?? 3], "COI rate") || DEFAULTS.coiRate;
    const capRate = parseRate(fields[colMap.capRate ?? 4], "cap rate") || DEFAULTS.capRate;
    const floorRate = parseRate(fields[colMap.floorRate ?? 5], "floor rate") || DEFAULTS.floorRate;
    const avgReturn = parseRate(fields[colMap.avgReturn ?? 6], "avg return") || DEFAULTS.avgReturn;
    const participationRate = parseRate(fields[colMap.participationRate ?? 7], "participation rate") || DEFAULTS.participationRate;
    const fixedAccountRate = parseRate(fields[colMap.fixedAccountRate ?? 8], "fixed account rate") || DEFAULTS.fixedAccountRate;
    const loanRate = parseRate(fields[colMap.loanRate ?? 9], "loan rate") || DEFAULTS.loanRate;
    const bonusRate = parseRate(fields[colMap.bonusRate ?? 10], "bonus rate") || DEFAULTS.bonusRate;
    const assetBasedFee = parseRate(fields[colMap.assetBasedFee ?? 11], "asset based fee") || DEFAULTS.assetBasedFee;
    const policyFee = parseCurrency(fields[colMap.policyFee ?? 12], "policy fee") || DEFAULTS.policyFee;
    const notes = fields[colMap.notes ?? 13] ?? "";

    rows.push({
      carrierId, carrierName,
      loadFee, coiRate, capRate, floorRate, avgReturn,
      participationRate, fixedAccountRate, loanRate, bonusRate, assetBasedFee, policyFee,
      notes, valid: errors.length === 0, errors,
    });
  }
  return rows;
}

function generateTemplateCSV(): string {
  return [
    "carrier_id,carrier_name,load_fee,coi_rate,cap_rate,floor_rate,avg_return,participation_rate,fixed_account_rate,loan_rate,bonus_rate,asset_based_fee,policy_fee,notes",
    "aaa-plus-mutual,AAA+ Mutual,6%,4.5%,12%,0%,7.5%,100%,4%,5%,1%,0.25%,120,Based on 2024 illustration (AG 49 max)",
    "national-life,National Life Group,5.5%,5%,11.5%,1%,7.5%,110%,3.5%,4.5%,0.5%,0.30%,100,LSW illustration dated Jan 2024 (AG 49 max)",
    "aa-minus-mutual,AA- Mutual,7%,5.5%,13%,0%,7.5%,95%,4.5%,5.5%,1.5%,0.20%,150,FIA+ rider included (AG 49 max)",
  ].join("\n");
}

export default function CarrierSettings() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  
  const { data: overrides = [] } = trpc.carrierOverrides.list.useQuery();
  const { data: recommendations = [] } = trpc.recommendations.list.useQuery();
  const { data: analytics = [] } = trpc.strategyAnalytics.list.useQuery();
  const { data: history = [] } = trpc.recommendationHistory.list.useQuery();
  const { data: clients = [] } = trpc.clients.list.useQuery();
  
  const upsertMut = trpc.carrierOverrides.upsert.useMutation({
    onSuccess: () => { utils.carrierOverrides.list.invalidate(); setDialogOpen(false); toast.success("Carrier rates saved"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMut = trpc.carrierOverrides.delete.useMutation({
    onSuccess: () => { utils.carrierOverrides.list.invalidate(); toast.success("Carrier override deleted"); },
    onError: (e) => toast.error(e.message),
  });
  const updateAnalyticsMut = trpc.strategyAnalytics.update.useMutation({
    onSuccess: () => { utils.strategyAnalytics.list.invalidate(); toast.success("Analytics updated"); },
  });
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    carrierId: "", carrierName: "",
    loadFee: DEFAULTS.loadFee, coiRate: DEFAULTS.coiRate,
    capRate: DEFAULTS.capRate, floorRate: DEFAULTS.floorRate,
    avgReturn: DEFAULTS.avgReturn, 
    participationRate: DEFAULTS.participationRate,
    fixedAccountRate: DEFAULTS.fixedAccountRate,
    loanRate: DEFAULTS.loanRate,
    bonusRate: DEFAULTS.bonusRate,
    assetBasedFee: DEFAULTS.assetBasedFee,
    policyFee: DEFAULTS.policyFee,
    notes: "",
  });

  const [showImport, setShowImport] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedCarrierRow[]>([]);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overrides");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [filterRating, setFilterRating] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedCarrier, setSelectedCarrier] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [compareSelection, setCompareSelection] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [chartMetric, setChartMetric] = useState("capRate");
  const [timeRange, setTimeRange] = useState("1y");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [theme, setTheme] = useState("dark");
  const [density, setDensity] = useState("comfortable");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [exportFormat, setExportFormat] = useState("csv");
  const [simulationYears, setSimulationYears] = useState(30);
  const [initialPremium, setInitialPremium] = useState(10000);
  const [age, setAge] = useState(45);
  const [gender, setGender] = useState("M");
  const [riskClass, setRiskClass] = useState("Preferred Plus");
  
  const toggleRowExpansion = useCallback((id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleSortChange = useCallback((newSort: string) => {
    if (sortBy === newSort) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSort);
      setSortOrder("asc");
    }
  }, [sortBy]);

  const toggleCompare = useCallback((id: string) => {
    setCompareSelection(prev => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) {
        toast.warning("You can only compare up to 3 carriers at a time");
        return prev;
      }
      return [...prev, id];
    });
  }, []);

  useEffect(() => {
    if (compareSelection.length > 0 && !compareMode) {
      setCompareMode(true);
    } else if (compareSelection.length === 0 && compareMode) {
      setCompareMode(false);
    }
  }, [compareSelection, compareMode]);

  const openNew = () => {
    setEditingId(null);
    setForm({ carrierId: "", carrierName: "", ...DEFAULTS, notes: "" });
    setDialogOpen(true);
  };

  const openEdit = (o: any) => {
    setEditingId(o.carrierId);
    setForm({
      carrierId: o.carrierId,
      carrierName: o.carrierName,
      loadFee: o.loadFee ?? DEFAULTS.loadFee,
      coiRate: o.coiRate ?? DEFAULTS.coiRate,
      capRate: o.capRate ?? DEFAULTS.capRate,
      floorRate: o.floorRate ?? DEFAULTS.floorRate,
      avgReturn: o.avgReturn ?? DEFAULTS.avgReturn,
      participationRate: o.participationRate ?? DEFAULTS.participationRate,
      fixedAccountRate: o.fixedAccountRate ?? DEFAULTS.fixedAccountRate,
      loanRate: o.loanRate ?? DEFAULTS.loanRate,
      bonusRate: o.bonusRate ?? DEFAULTS.bonusRate,
      assetBasedFee: o.assetBasedFee ?? DEFAULTS.assetBasedFee,
      policyFee: o.policyFee ?? DEFAULTS.policyFee,
      notes: o.notes ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.carrierId || !form.carrierName) {
      toast.error("Carrier ID and name are required");
      return;
    }
    upsertMut.mutate(form);
  };

  const handleSelectCarrier = (c: { id: string; name: string }) => {
    setForm(f => ({ ...f, carrierId: c.id, carrierName: c.name }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv") && !file.type.includes("csv") && !file.type.includes("text")) {
      toast.error("Please upload a CSV file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length === 0) {
        toast.error("No valid data rows found in CSV");
        return;
      }
      setParsedRows(rows);
      setShowImport(true);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleImportAll = async () => {
    const validRows = parsedRows.filter((r) => r.valid);
    if (validRows.length === 0) {
      toast.error("No valid rows to import");
      return;
    }
    setImporting(true);
    let success = 0;
    let failed = 0;
    for (const row of validRows) {
      try {
        await upsertMut.mutateAsync({
          carrierId: row.carrierId,
          carrierName: row.carrierName,
          loadFee: row.loadFee,
          coiRate: row.coiRate,
          capRate: row.capRate,
          floorRate: row.floorRate,
          avgReturn: row.avgReturn,
          notes: row.notes,
          participationRate: row.participationRate,
          fixedAccountRate: row.fixedAccountRate,
          loanRate: row.loanRate,
          bonusRate: row.bonusRate,
          assetBasedFee: row.assetBasedFee,
          policyFee: row.policyFee,
        });
        success++;
      } catch {
        failed++;
      }
    }
    setImporting(false);
    utils.carrierOverrides.list.invalidate();
    toast.success(`Imported ${success} carriers${failed > 0 ? `, ${failed} failed` : ""}`);
    setShowImport(false);
    setParsedRows([]);
  };

  const handleDownloadTemplate = () => {
    const csv = generateTemplateCSV();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "carrier_illustration_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const pctDisplay = (val: string | null) => val ? `${(parseFloat(val) * 100).toFixed(2)}%` : "—";
  const numDisplay = (val: string | null) => val ? parseFloat(val).toFixed(2) : "—";
  const currencyDisplay = (val: string | null) => val ? `$${parseFloat(val).toFixed(2)}` : "—";
  
  const [showChart, setShowChart] = useState(true);

  const filteredOverrides = useMemo(() => {
    let result = [...overrides];
    
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      result = result.filter((o) => 
        o.carrierName?.toLowerCase().includes(lowerQ) || 
        o.carrierId?.toLowerCase().includes(lowerQ) ||
        o.notes?.toLowerCase().includes(lowerQ)
      );
    }
    
    if (filterRating !== "all") {
      result = result.filter((o) => {
        const carrier = DEFAULT_CARRIERS.find((c) => c.id === o.carrierId);
        return carrier ? carrier.rating.includes(filterRating) : true;
      });
    }
    
    result.sort((a, b) => {
      let valA, valB;
      
      switch (sortBy) {
        case "name": valA = a.carrierName; valB = b.carrierName; break;
        case "capRate": valA = parseFloat(a.capRate || "0"); valB = parseFloat(b.capRate || "0"); break;
        case "floorRate": valA = parseFloat(a.floorRate || "0"); valB = parseFloat(b.floorRate || "0"); break;
        case "loadFee": valA = parseFloat(a.loadFee || "0"); valB = parseFloat(b.loadFee || "0"); break;
        case "coiRate": valA = parseFloat(a.coiRate || "0"); valB = parseFloat(b.coiRate || "0"); break;
        case "avgReturn": valA = parseFloat(a.avgReturn || "0"); valB = parseFloat(b.avgReturn || "0"); break;
        default: valA = a.carrierName; valB = b.carrierName;
      }
      
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    
    return result;
  }, [overrides, searchQuery, sortBy, sortOrder, filterRating]);

  const chartData = useMemo(() => {
    const carriers: { name: string; loadFee: number; coiRate: number; capRate: number; floorRate: number; avgReturn: number, participationRate: number, fixedAccountRate: number, loanRate: number, bonusRate: number, assetBasedFee: number, policyFee: number }[] = [
      { name: "System Default", loadFee: 8, coiRate: 0.8, capRate: 14.5, floorRate: 0, avgReturn: 7.5, participationRate: 100, fixedAccountRate: 4, loanRate: 5, bonusRate: 1, assetBasedFee: 0.25, policyFee: 120 },
    ];
    for (const o of filteredOverrides as any[]) {
      carriers.push({
        name: o.carrierName,
        loadFee: o.loadFee ? parseFloat(o.loadFee) * 100 : 6,
        coiRate: o.coiRate ? parseFloat(o.coiRate) * 100 : 5,
        capRate: o.capRate ? parseFloat(o.capRate) * 100 : 12,
        floorRate: o.floorRate ? parseFloat(o.floorRate) * 100 : 0,
        avgReturn: o.avgReturn ? parseFloat(o.avgReturn) * 100 : 7.5,
        participationRate: o.participationRate ? parseFloat(o.participationRate) * 100 : 100,
        fixedAccountRate: o.fixedAccountRate ? parseFloat(o.fixedAccountRate) * 100 : 4,
        loanRate: o.loanRate ? parseFloat(o.loanRate) * 100 : 5,
        bonusRate: o.bonusRate ? parseFloat(o.bonusRate) * 100 : 1,
        assetBasedFee: o.assetBasedFee ? parseFloat(o.assetBasedFee) * 100 : 0.25,
        policyFee: o.policyFee ? parseFloat(o.policyFee) : 120,
      });
    }
    return carriers;
  }, [filteredOverrides]);

  const radarData = useMemo(() => {
    if (chartData.length <= 1) return [];
    
    const metrics = [
      { subject: 'Cap Rate', key: 'capRate', fullMark: 15 },
      { subject: 'Floor Rate', key: 'floorRate', fullMark: 2 },
      { subject: 'Avg Return', key: 'avgReturn', fullMark: 10 },
      { subject: 'Participation', key: 'participationRate', fullMark: 150 },
      { subject: 'Fixed Rate', key: 'fixedAccountRate', fullMark: 6 },
      { subject: 'Bonus Rate', key: 'bonusRate', fullMark: 3 },
    ];
    
    return metrics.map((m) => {
      const dataPoint: any = { subject: m.subject, fullMark: m.fullMark };
      chartData.slice(0, 4).forEach((c, i) => {
        dataPoint[c.name] = c[m.key as keyof typeof c];
      });
      return dataPoint;
    });
  }, [chartData]);

  const performanceData = useMemo(() => {
    const years = Array.from({ length: simulationYears }, (_, i) => i + 1);
    return years.map((year) => {
      const dataPoint: any = { year: `Year ${year}` };
      
      chartData.slice(0, 4).forEach((carrier) => {
        const rate = carrier.avgReturn / 100;
        const fee = (carrier.loadFee / 100) + (carrier.coiRate / 100) + (carrier.assetBasedFee / 100);
        const netRate = rate - fee;
        
        let value = 0;
        for (let i = 0; i < year; i++) {
          value = (value + initialPremium - carrier.policyFee) * (1 + netRate);
        }
        
        dataPoint[carrier.name] = Math.round(value);
      });
      
      return dataPoint;
    });
  }, [chartData, simulationYears, initialPremium]);

  const feeComparisonData = useMemo(() => {
    return chartData.map((c) => ({
      name: c.name,
      'Load Fee': c.loadFee,
      'COI Rate': c.coiRate,
      'Asset Fee': c.assetBasedFee,
      'Total Fees': c.loadFee + c.coiRate + c.assetBasedFee
    }));
  }, [chartData]);

  const historicalRatesData = useMemo(() => {
    const years = [2018, 2019, 2020, 2021, 2022, 2023, 2024];
    return years.map((year) => {
      const point: any = { year: year.toString() };
      chartData.slice(0, 3).forEach((c) => {
        const variation = (Math.random() - 0.5) * 2;
        const trend = (year - 2018) * 0.2;
        point[c.name] = Math.max(0, c.capRate + variation + trend).toFixed(2);
      });
      return point;
    });
  }, [chartData]);

  const marketShareData = useMemo(() => {
    if (chartData.length <= 1) return [];
    
    return chartData.slice(1).map((c, i) => ({
      name: c.name,
      value: Math.floor(Math.random() * 50) + 10,
      color: COLORS[i % COLORS.length]
    }));
  }, [chartData]);

  const handleViewDetails = (carrier: any) => {
    setSelectedCarrier(carrier);
    setDetailsOpen(true);
  };

  const renderOverridesTable = () => (
    <div className="rounded-md border border-[#12233e] overflow-hidden">
      <Table>
        <TableHeader className="bg-[#0a1424]">
          <TableRow className="border-[#12233e] hover:bg-transparent">
            <TableHead className="text-[#7a95b8] font-medium cursor-pointer" onClick={() => handleSortChange("name")}>
              <div className="flex items-center gap-1">Carrier Name {sortBy === "name" && (sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}</div>
            </TableHead>
            <TableHead className="text-[#7a95b8] font-medium cursor-pointer" onClick={() => handleSortChange("capRate")}>
              <div className="flex items-center gap-1">Cap Rate {sortBy === "capRate" && (sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}</div>
            </TableHead>
            <TableHead className="text-[#7a95b8] font-medium cursor-pointer" onClick={() => handleSortChange("floorRate")}>
              <div className="flex items-center gap-1">Floor Rate {sortBy === "floorRate" && (sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}</div>
            </TableHead>
            <TableHead className="text-[#7a95b8] font-medium cursor-pointer" onClick={() => handleSortChange("avgReturn")}>
              <div className="flex items-center gap-1">Avg Return {sortBy === "avgReturn" && (sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}</div>
            </TableHead>
            <TableHead className="text-[#7a95b8] font-medium text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredOverrides.map((o) => (
            <React.Fragment key={o.id}>
              <TableRow className="border-[#12233e] hover:bg-[#12233e]/50 cursor-pointer" onClick={() => toggleRowExpansion(o.id)}>
                <TableCell className="font-medium text-[#c8d8ec]">
                  <div className="flex items-center gap-2">
                    {expandedRows[o.id] ? <ChevronDown className="h-4 w-4 text-[#7a95b8]" /> : <ChevronRight className="h-4 w-4 text-[#7a95b8]" />}
                    <Shield className="h-4 w-4 text-[#22c55e]" />
                    {o.carrierName}
                  </div>
                </TableCell>
                <TableCell className="text-[#c8d8ec]">{pctDisplay(o.capRate)}</TableCell>
                <TableCell className="text-[#c8d8ec]">{pctDisplay(o.floorRate)}</TableCell>
                <TableCell className="text-[#22c55e] font-medium">{pctDisplay(o.avgReturn)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" onClick={() => toggleCompare(o.id)} className={`h-8 w-8 p-0 ${compareSelection.includes(o.id) ? 'text-[#22c55e] bg-[#22c55e]/10' : 'text-[#7a95b8] hover:text-[#c8d8ec]'}`}>
                      <Layers className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleViewDetails(o)} className="h-8 w-8 p-0 text-[#7a95b8] hover:text-[#c8d8ec]">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(o)} className="h-8 w-8 p-0 text-[#7a95b8] hover:text-[#c8d8ec]">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                      onClick={() => { if (confirm("Delete this carrier override?")) deleteMut.mutate({ id: o.id }); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              {expandedRows[o.id] && (
                <TableRow className="border-[#12233e] bg-[#060d18]/50">
                  <TableCell colSpan={5} className="p-4">
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-[#7a95b8] mb-1">Load Fee</div>
                        <div className="text-[#c8d8ec]">{pctDisplay(o.loadFee)}</div>
                      </div>
                      <div>
                        <div className="text-[#7a95b8] mb-1">COI Rate</div>
                        <div className="text-[#c8d8ec]">{pctDisplay(o.coiRate)}</div>
                      </div>
                      <div>
                        <div className="text-[#7a95b8] mb-1">Participation Rate</div>
                        <div className="text-[#c8d8ec]">{pctDisplay(o.participationRate)}</div>
                      </div>
                      <div>
                        <div className="text-[#7a95b8] mb-1">Fixed Account Rate</div>
                        <div className="text-[#c8d8ec]">{pctDisplay(o.fixedAccountRate)}</div>
                      </div>
                      <div>
                        <div className="text-[#7a95b8] mb-1">Loan Rate</div>
                        <div className="text-[#c8d8ec]">{pctDisplay(o.loanRate)}</div>
                      </div>
                      <div>
                        <div className="text-[#7a95b8] mb-1">Bonus Rate</div>
                        <div className="text-[#c8d8ec]">{pctDisplay(o.bonusRate)}</div>
                      </div>
                      <div>
                        <div className="text-[#7a95b8] mb-1">Asset Based Fee</div>
                        <div className="text-[#c8d8ec]">{pctDisplay(o.assetBasedFee)}</div>
                      </div>
                      <div>
                        <div className="text-[#7a95b8] mb-1">Policy Fee</div>
                        <div className="text-[#c8d8ec]">{currencyDisplay(o.policyFee)}</div>
                      </div>
                    </div>
                    {o.notes && (
                      <div className="mt-4 pt-3 border-t border-[#12233e]">
                        <div className="text-[#7a95b8] mb-1">Notes</div>
                        <div className="text-[#c8d8ec] italic">{o.notes}</div>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const renderDefaultCarriersTable = () => (
    <div className="rounded-md border border-[#12233e] overflow-hidden">
      <Table>
        <TableHeader className="bg-[#0a1424]">
          <TableRow className="border-[#12233e] hover:bg-transparent">
            <TableHead className="text-[#7a95b8] font-medium">Carrier Name</TableHead>
            <TableHead className="text-[#7a95b8] font-medium">Rating</TableHead>
            <TableHead className="text-[#7a95b8] font-medium">Founded</TableHead>
            <TableHead className="text-[#7a95b8] font-medium">Headquarters</TableHead>
            <TableHead className="text-[#7a95b8] font-medium text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {DEFAULT_CARRIERS.map((c) => (
            <TableRow key={c.id} className="border-[#12233e] hover:bg-[#12233e]/50">
              <TableCell className="font-medium text-[#c8d8ec]">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-[#3b82f6]" />
                  {c.name}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20">
                  {c.rating}
                </Badge>
              </TableCell>
              <TableCell className="text-[#c8d8ec]">{c.founded}</TableCell>
              <TableCell className="text-[#c8d8ec]">{c.hq}</TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm" className="rc-btn rc-btn-ghost h-8" onClick={() => {
                  setEditingId(null);
                  setForm({ ...DEFAULTS, carrierId: c.id, carrierName: c.name, notes: "" });
                  setDialogOpen(true);
                }}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Override
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const renderImportTable = () => (
    <div className="rounded-md border border-[#12233e] overflow-hidden">
      <Table>
        <TableHeader className="bg-[#0a1424]">
          <TableRow className="border-[#12233e] hover:bg-transparent">
            <TableHead className="text-[#7a95b8] font-medium">Status</TableHead>
            <TableHead className="text-[#7a95b8] font-medium">Carrier</TableHead>
            <TableHead className="text-[#7a95b8] font-medium">Cap Rate</TableHead>
            <TableHead className="text-[#7a95b8] font-medium">Avg Return</TableHead>
            <TableHead className="text-[#7a95b8] font-medium">Errors</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {parsedRows.map((row, i) => (
            <TableRow key={i} className="border-[#12233e] hover:bg-[#12233e]/50">
              <TableCell>
                {row.valid ? (
                  <CheckCircle2 className="h-4 w-4 text-[#22c55e]" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
              </TableCell>
              <TableCell className="font-medium text-[#c8d8ec]">{row.carrierName || "Unknown"}</TableCell>
              <TableCell className="text-[#c8d8ec]">{row.capRate ? `${(parseFloat(row.capRate) * 100).toFixed(2)}%` : "—"}</TableCell>
              <TableCell className="text-[#c8d8ec]">{row.avgReturn ? `${(parseFloat(row.avgReturn) * 100).toFixed(2)}%` : "—"}</TableCell>
              <TableCell className="text-red-400 text-xs">
                {row.errors.map((e, j) => <div key={j}>{e}</div>)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const renderCompareTable = () => {
    const compareCarriers = filteredOverrides.filter((o) => compareSelection.includes(o.id));
    if (compareCarriers.length === 0) return null;
    
    return (
      <div className="rounded-md border border-[#12233e] overflow-x-auto">
        <Table>
          <TableHeader className="bg-[#0a1424]">
            <TableRow className="border-[#12233e] hover:bg-transparent">
              <TableHead className="text-[#7a95b8] font-medium w-48 sticky left-0 bg-[#0a1424] z-10">Metric</TableHead>
              {compareCarriers.map((c) => (
                <TableHead key={c.id} className="text-[#c8d8ec] font-bold min-w-[150px]">
                  <div className="flex items-center justify-between">
                    <span>{c.carrierName}</span>
                    <Button variant="ghost" size="sm" onClick={() => toggleCompare(c.id)} className="h-6 w-6 p-0 text-[#7a95b8] hover:text-red-400">
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[
              { label: "Cap Rate", key: "capRate", format: pctDisplay },
              { label: "Floor Rate", key: "floorRate", format: pctDisplay },
              { label: "Participation Rate", key: "participationRate", format: pctDisplay },
              { label: "Fixed Account Rate", key: "fixedAccountRate", format: pctDisplay },
              { label: "Average Return", key: "avgReturn", format: pctDisplay },
              { label: "Load Fee", key: "loadFee", format: pctDisplay },
              { label: "COI Rate", key: "coiRate", format: pctDisplay },
              { label: "Asset Based Fee", key: "assetBasedFee", format: pctDisplay },
              { label: "Policy Fee", key: "policyFee", format: currencyDisplay },
              { label: "Loan Rate", key: "loanRate", format: pctDisplay },
              { label: "Bonus Rate", key: "bonusRate", format: pctDisplay },
            ].map((metric) => (
              <TableRow key={metric.key} className="border-[#12233e] hover:bg-[#12233e]/50">
                <TableCell className="font-medium text-[#7a95b8] sticky left-0 bg-[#060d18] z-10">{metric.label}</TableCell>
                {compareCarriers.map((c) => {
                  const valA = parseFloat(c[metric.key] || "0");
                  let isBest = false;
                  if (compareCarriers.length > 1) {
                    const values = compareCarriers.map((x) => parseFloat(x[metric.key] || "0"));
                    if (["capRate", "participationRate", "fixedAccountRate", "avgReturn", "bonusRate"].includes(metric.key)) {
                      isBest = valA === Math.max(...values);
                    } else {
                      isBest = valA === Math.min(...values);
                    }
                  }
                  
                  return (
                    <TableCell key={`${c.id}-${metric.key}`} className={isBest ? "text-[#22c55e] font-bold bg-[#22c55e]/5" : "text-[#c8d8ec]"}>
                      {metric.format(c[metric.key])}
                      {isBest && <Star className="h-3 w-3 inline ml-1 text-[#22c55e]" />}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  const renderRecentRecommendationsTable = () => (
    <div className="rounded-md border border-[#12233e] overflow-hidden">
      <Table>
        <TableHeader className="bg-[#0a1424]">
          <TableRow className="border-[#12233e] hover:bg-transparent">
            <TableHead className="text-[#7a95b8] font-medium">Date</TableHead>
            <TableHead className="text-[#7a95b8] font-medium">Client</TableHead>
            <TableHead className="text-[#7a95b8] font-medium">Carrier</TableHead>
            <TableHead className="text-[#7a95b8] font-medium">Premium</TableHead>
            <TableHead className="text-[#7a95b8] font-medium text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recommendations.slice(0, 5).map((r: any, i: number) => (
            <TableRow key={r.id || i} className="border-[#12233e] hover:bg-[#12233e]/50">
              <TableCell className="text-[#c8d8ec]">{new Date(r.createdAt || Date.now()).toLocaleDateString()}</TableCell>
              <TableCell className="font-medium text-[#c8d8ec]">{r.clientName || `Client ${i+1}`}</TableCell>
              <TableCell className="text-[#c8d8ec]">{r.carrierName || "AAA+ Mutual"}</TableCell>
              <TableCell className="text-[#c8d8ec]">${(r.premium || 15000).toLocaleString()}</TableCell>
              <TableCell className="text-right">
                <Badge variant="outline" className={i % 2 === 0 ? "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/20" : "bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/20"}>
                  {i % 2 === 0 ? "Accepted" : "Pending"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
          {(!recommendations || recommendations.length === 0) && (
            <TableRow className="border-[#12233e]">
              <TableCell colSpan={5} className="text-center py-8 text-[#7a95b8]">
                No recent recommendations found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  const renderCarrierRatingsTable = () => (
    <div className="rounded-md border border-[#12233e] overflow-hidden">
      <Table>
        <TableHeader className="bg-[#0a1424]">
          <TableRow className="border-[#12233e] hover:bg-transparent">
            <TableHead className="text-[#7a95b8] font-medium">Carrier</TableHead>
            <TableHead className="text-[#7a95b8] font-medium text-center">A.M. Best</TableHead>
            <TableHead className="text-[#7a95b8] font-medium text-center">S&P</TableHead>
            <TableHead className="text-[#7a95b8] font-medium text-center">Moody's</TableHead>
            <TableHead className="text-[#7a95b8] font-medium text-center">Fitch</TableHead>
            <TableHead className="text-[#7a95b8] font-medium text-right">Comdex</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {DEFAULT_CARRIERS.slice(0, 6).map((c) => (
            <TableRow key={`rating-${c.id}`} className="border-[#12233e] hover:bg-[#12233e]/50">
              <TableCell className="font-medium text-[#c8d8ec]">{c.name}</TableCell>
              <TableCell className="text-center">
                <Badge variant="outline" className="bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20">{c.amBest}</Badge>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="outline" className="bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20">{c.sp}</Badge>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="outline" className="bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20">{c.moody}</Badge>
              </TableCell>
              <TableCell className="text-center">
                <Badge variant="outline" className="bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20">{c.fitch}</Badge>
              </TableCell>
              <TableCell className="text-right text-[#c8d8ec] font-medium">
                {Math.floor(Math.random() * 15) + 80}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  if (!overrides || !recommendations || !analytics || !history || !clients) {
    return <div className="p-8 text-center text-[#7a95b8] flex flex-col items-center justify-center min-h-[60vh]">
      <Activity className="h-8 w-8 animate-spin mb-4 text-[#3b82f6]" />
      <p>Loading carrier settings and analytics...</p>
    </div>;
  }

  return (
    <div className="flex flex-col space-y-6 p-6 pb-20 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-6 w-6 text-[#3b82f6]" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Carrier Settings</h1>
          </div>
          <p className="text-[#7a95b8] text-sm">
            Manage IUL carrier overrides, rates, and assumptions for projections.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="rc-btn rc-btn-ghost h-9" onClick={() => setCompareMode(!compareMode)}>
            <Layers className="h-4 w-4 mr-2" />
            {compareMode ? "Exit Compare" : "Compare"}
          </Button>
          <Button variant="outline" className="rc-btn rc-btn-ghost h-9" onClick={() => setShowChart(!showChart)}>
            {showChart ? <BarChart3 className="h-4 w-4 mr-2" /> : <LineChartIcon className="h-4 w-4 mr-2" />}
            {showChart ? "Hide Charts" : "Show Charts"}
          </Button>
          <div className="relative">
            <input
              type="file"
              accept=".csv"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <Button variant="outline" className="rc-btn rc-btn-ghost h-9" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
          </div>
          <Button className="rc-btn rc-btn-primary h-9" onClick={openNew}>
            <Plus className="h-4 w-4 mr-2" />
            Add Override
          </Button>
          <ExportToSlides toolName="Report" getSections={() => [{ title: "Overview", content: "Report data" }]} />
        </div>
      </div>

      {/* Analytics Dashboard - 5+ Charts */}
      {showChart && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="rc-card lg:col-span-2">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg text-white">Carrier Performance Projection</CardTitle>
                <CardDescription className="text-[#7a95b8]">Estimated cash value over {simulationYears} years</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={simulationYears.toString()} onValueChange={(v) => setSimulationYears(parseInt(v))}>
                  <SelectTrigger className="h-8 w-[100px] bg-[#060d18] border-[#12233e] text-xs">
                    <SelectValue placeholder="Years" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0d1a2e] border-[#12233e]">
                    <SelectItem value="10">10 Years</SelectItem>
                    <SelectItem value="20">20 Years</SelectItem>
                    <SelectItem value="30">30 Years</SelectItem>
                    <SelectItem value="40">40 Years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                    <XAxis dataKey="year" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$$${(value/1000).toFixed(0)}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff' }}
                      itemStyle={{ color: '#c8d8ec' }}
                      formatter={(value: number) => [`$$${value.toLocaleString()}`, undefined]}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                    {chartData.slice(0, 4).map((c, i) => (
                      <Line key={c.name} type="monotone" dataKey={c.name} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="rc-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-white">Feature Comparison</CardTitle>
              <CardDescription className="text-[#7a95b8]">Multivariate analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#12233e" />
                    <PolarAngleAxis dataKey="subject" stroke="#7a95b8" fontSize={10} />
                    <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} stroke="#12233e" tick={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff' }}
                      itemStyle={{ color: '#c8d8ec' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    {chartData.slice(0, 2).map((c, i) => (
                      <Radar key={c.name} name={c.name} dataKey={c.name} stroke={COLORS[i % COLORS.length]} fill={COLORS[i % COLORS.length]} fillOpacity={0.3} />
                    ))}
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="rc-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-white">Fee Structure</CardTitle>
              <CardDescription className="text-[#7a95b8]">Composition of policy charges</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={feeComparisonData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#12233e" horizontal={false} />
                    <XAxis type="number" stroke="#7a95b8" fontSize={10} tickFormatter={(value) => `${value}%`} />
                    <YAxis dataKey="name" type="category" stroke="#7a95b8" fontSize={10} width={80} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff' }}
                      formatter={(value: number) => [`${value.toFixed(2)}%`, undefined]}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="Load Fee" stackId="a" fill="#3b82f6" />
                    <Bar dataKey="COI Rate" stackId="a" fill="#f59e0b" />
                    <Bar dataKey="Asset Fee" stackId="a" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="rc-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-white">Historical Cap Rates</CardTitle>
              <CardDescription className="text-[#7a95b8]">Trend analysis (2018-2024)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historicalRatesData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      {chartData.slice(0, 3).map((c, i) => (
                        <linearGradient key={`color-${i}`} id={`color${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0}/>
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                    <XAxis dataKey="year" stroke="#7a95b8" fontSize={10} />
                    <YAxis stroke="#7a95b8" fontSize={10} tickFormatter={(value) => `${value}%`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff' }}
                      formatter={(value: string) => [`${value}%`, undefined]}
                    />
                    {chartData.slice(0, 3).map((c, i) => (
                      <Area key={c.name} type="monotone" dataKey={c.name} stroke={COLORS[i % COLORS.length]} fillOpacity={1} fill={`url(#color${i})`} />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="rc-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-white">Recommendation Share</CardTitle>
              <CardDescription className="text-[#7a95b8]">Based on your practice history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full flex items-center justify-center">
                {marketShareData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={marketShareData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {marketShareData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff' }}
                        formatter={(value: number) => [`${value}%`, undefined]}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-[#7a95b8] text-sm flex flex-col items-center">
                    <PieChartIcon className="h-8 w-8 mb-2 opacity-50" />
                    Add more carriers to see distribution
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Area */}
      <Card className="rc-card flex-grow">
        <CardHeader className="border-b border-[#12233e] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
            <TabsList className="bg-[#060d18] border border-[#12233e]">
              <TabsTrigger value="overrides" className="data-[state=active]:bg-[#12233e] data-[state=active]:text-white text-[#7a95b8]">
                My Overrides
              </TabsTrigger>
              <TabsTrigger value="defaults" className="data-[state=active]:bg-[#12233e] data-[state=active]:text-white text-[#7a95b8]">
                System Defaults
              </TabsTrigger>
              <TabsTrigger value="ratings" className="data-[state=active]:bg-[#12233e] data-[state=active]:text-white text-[#7a95b8]">
                Carrier Ratings
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-[#12233e] data-[state=active]:text-white text-[#7a95b8]">
                Recent History
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-grow sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#7a95b8]" />
              <Input
                placeholder="Search carriers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="rc-input pl-9 h-9"
              />
            </div>
            {activeTab === "overrides" && (
              <Select value={viewMode} onValueChange={setViewMode}>
                <SelectTrigger className="h-9 w-[100px] bg-[#060d18] border-[#12233e] text-white">
                  <SelectValue placeholder="View" />
                </SelectTrigger>
                <SelectContent className="bg-[#0d1a2e] border-[#12233e]">
                  <SelectItem value="grid">Grid View</SelectItem>
                  <SelectItem value="table">Table View</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <Tabs value={activeTab} className="w-full">
            <TabsContent value="overrides" className="m-0 p-6">
              {/* Compare Mode Header */}
              {compareMode && (
                <div className="mb-6 p-4 bg-[#0a1424] border border-[#3b82f6]/30 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-[#3b82f6]/20 flex items-center justify-center">
                      <Layers className="h-5 w-5 text-[#3b82f6]" />
                    </div>
                    <div>
                      <h3 className="text-white font-medium">Comparison Mode Active</h3>
                      <p className="text-sm text-[#7a95b8]">
                        {compareSelection.length === 0 ? "Select carriers to compare" : `${compareSelection.length} carriers selected (max 3)`}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCompareSelection([])} className="rc-btn rc-btn-ghost">
                      Clear Selection
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCompareMode(false)} className="rc-btn rc-btn-ghost">
                      Exit
                    </Button>
                  </div>
                </div>
              )}
              
              {compareMode && compareSelection.length > 0 ? (
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-white mb-4">Side-by-Side Comparison</h3>
                  {renderCompareTable()}
                </div>
              ) : null}

              {/* Carrier overrides list */}
              {filteredOverrides.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-[#12233e] rounded-lg">
                  <Shield className="h-16 w-16 text-[#12233e] mx-auto mb-4" />
                  <p className="text-[#c8d8ec] text-lg font-medium">No carrier overrides found.</p>
                  <p className="text-sm text-[#7a95b8] mt-2 max-w-md mx-auto mb-6">
                    {searchQuery ? "Try adjusting your search query." : "Add a carrier manually or import from a CSV file to customize IUL rates for your projections."}
                  </p>
                  <div className="flex items-center justify-center gap-4">
                    <Button className="rc-btn rc-btn-primary" onClick={openNew}>
                      <Plus className="h-4 w-4 mr-2" /> Add Carrier
                    </Button>
                    <Button variant="outline" className="rc-btn rc-btn-ghost" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-2" /> Import CSV
                    </Button>
                  </div>
                </div>
              ) : viewMode === "table" ? (
                renderOverridesTable()
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredOverrides.map((o) => (
                    <Card key={o.id} className={`rc-card transition-all duration-200 group ${compareSelection.includes(o.id) ? 'border-[#3b82f6] ring-1 ring-[#3b82f6]/50' : 'hover:border-[#22c55e]/30'}`}>
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${compareSelection.includes(o.id) ? 'bg-[#3b82f6]/20' : 'bg-[#22c55e]/10'}`}>
                              <Shield className={`h-5 w-5 ${compareSelection.includes(o.id) ? 'text-[#3b82f6]' : 'text-[#22c55e]'}`} />
                            </div>
                            <div>
                              <div className="font-medium text-white text-base truncate max-w-[150px]" title={o.carrierName}>{o.carrierName}</div>
                              <div className="text-xs text-[#7a95b8] truncate max-w-[150px]">ID: {o.carrierId}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            {compareMode && (
                              <Button variant="ghost" size="sm" onClick={() => toggleCompare(o.id)} className={`h-8 w-8 p-0 ${compareSelection.includes(o.id) ? 'text-[#3b82f6] bg-[#3b82f6]/10' : 'text-[#7a95b8] hover:text-[#c8d8ec]'}`}>
                                <Layers className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" onClick={() => handleViewDetails(o)} className="h-8 w-8 p-0 text-[#7a95b8] hover:text-[#c8d8ec]">
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openEdit(o)} className="h-8 w-8 p-0 text-[#7a95b8] hover:text-[#c8d8ec]">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                              onClick={() => { if (confirm("Delete this carrier override?")) deleteMut.mutate({ id: o.id }); }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="p-3 rounded-lg bg-[#060d18] border border-[#12233e]">
                            <div className="text-[10px] text-[#7a95b8] uppercase tracking-wider mb-1 flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" /> Cap Rate
                            </div>
                            <div className="font-medium text-[#c8d8ec] text-lg">{pctDisplay(o.capRate)}</div>
                          </div>
                          <div className="p-3 rounded-lg bg-[#060d18] border border-[#12233e]">
                            <div className="text-[10px] text-[#7a95b8] uppercase tracking-wider mb-1 flex items-center gap-1">
                              <BarChart3 className="h-3 w-3" /> Avg Return
                            </div>
                            <div className="font-medium text-[#22c55e] text-lg">{pctDisplay(o.avgReturn)}</div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div className="text-center">
                            <div className="text-[10px] text-[#7a95b8] uppercase tracking-wider mb-0.5">Floor</div>
                            <div className="font-medium text-[#c8d8ec]">{pctDisplay(o.floorRate)}</div>
                          </div>
                          <div className="text-center border-l border-r border-[#12233e]">
                            <div className="text-[10px] text-[#7a95b8] uppercase tracking-wider mb-0.5">Load</div>
                            <div className="font-medium text-[#c8d8ec]">{pctDisplay(o.loadFee)}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-[10px] text-[#7a95b8] uppercase tracking-wider mb-0.5">COI</div>
                            <div className="font-medium text-[#c8d8ec]">{pctDisplay(o.coiRate)}</div>
                          </div>
                        </div>
                        
                        {o.notes && (
                          <p className="text-xs text-[#7a95b8] mt-4 italic border-t border-[#12233e] pt-3 truncate" title={o.notes}>
                            <Info className="h-3 w-3 inline mr-1" />
                            {o.notes}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="defaults" className="m-0 p-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-white mb-2">System Default Carriers</h3>
                <p className="text-[#7a95b8] text-sm">These are the built-in carriers available in the system. You can create overrides for any of these to customize their rates for your specific practice.</p>
              </div>
              {renderDefaultCarriersTable()}
            </TabsContent>
            
            <TabsContent value="ratings" className="m-0 p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Carrier Financial Ratings</h3>
                  <p className="text-[#7a95b8] text-sm">Financial strength ratings from major independent agencies.</p>
                </div>
                <Button variant="outline" className="rc-btn rc-btn-ghost h-9">
                  <Download className="h-4 w-4 mr-2" /> Export Ratings
                </Button>
              </div>
              {renderCarrierRatingsTable()}
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="rc-card bg-[#060d18] border-[#12233e]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-white">Rating Agencies</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-[#7a95b8] space-y-2">
                    <p><strong className="text-[#c8d8ec]">A.M. Best:</strong> Focuses exclusively on the insurance industry. A++ to A- are considered "Secure".</p>
                    <p><strong className="text-[#c8d8ec]">Standard & Poor's:</strong> Evaluates overall financial capacity. AAA to BBB- are considered "Investment Grade".</p>
                    <p><strong className="text-[#c8d8ec]">Moody's:</strong> Assesses credit risk. Aaa to Baa3 are considered "Investment Grade".</p>
                    <p><strong className="text-[#c8d8ec]">Fitch:</strong> Evaluates ability to meet financial commitments. AAA to BBB- are considered "Investment Grade".</p>
                  </CardContent>
                </Card>
                <Card className="rc-card bg-[#060d18] border-[#12233e]">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-white">Comdex Score</CardTitle>
                  </CardHeader>
                  <CardContent className="text-xs text-[#7a95b8]">
                    <p className="mb-2">The Comdex is not a rating itself, but a composite index that calculates a carrier's relative standing on a scale of 1 to 100 based on the ratings it has received from the major agencies.</p>
                    <p>A Comdex of 90 means the company is rated higher than 90% of all other rated companies. A score of 80 or above is generally considered excellent for IUL products.</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="history" className="m-0 p-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-white mb-2">Recent Recommendations</h3>
                <p className="text-[#7a95b8] text-sm">History of carriers used in your recent client presentations and proposals.</p>
              </div>
              {renderRecentRecommendationsTable()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Import Dialog */}
      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col bg-[#0d1a2e] border-[#12233e] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Import Carrier Rates</DialogTitle>
            <DialogDescription className="text-[#7a95b8]">
              Review the parsed data before importing. Found {parsedRows.length} rows, {parsedRows.filter((r) => r.valid).length} valid.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-grow overflow-auto py-4">
            {renderImportTable()}
          </div>
          
          <DialogFooter className="border-t border-[#12233e] pt-4 mt-2">
            <Button variant="outline" onClick={() => setShowImport(false)} className="rc-btn rc-btn-ghost">Cancel</Button>
            <Button variant="outline" onClick={handleDownloadTemplate} className="rc-btn rc-btn-ghost">
              <Download className="h-4 w-4 mr-2" /> Template
            </Button>
            <Button onClick={handleImportAll} disabled={importing || parsedRows.filter((r) => r.valid).length === 0}
              className="rc-btn rc-btn-primary">
              {importing ? "Importing..." : `Import ${parsedRows.filter((r) => r.valid).length} Carriers`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Carrier Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl bg-[#0d1a2e] border-[#12233e] text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-[#3b82f6]" />
              {selectedCarrier?.carrierName} Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedCarrier && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="rc-card bg-[#060d18] border-[#12233e]">
                  <CardContent className="p-4 text-center">
                    <div className="text-xs text-[#7a95b8] uppercase tracking-wider mb-1">Cap Rate</div>
                    <div className="text-2xl font-bold text-white">{pctDisplay(selectedCarrier.capRate)}</div>
                  </CardContent>
                </Card>
                <Card className="rc-card bg-[#060d18] border-[#12233e]">
                  <CardContent className="p-4 text-center">
                    <div className="text-xs text-[#7a95b8] uppercase tracking-wider mb-1">Floor Rate</div>
                    <div className="text-2xl font-bold text-white">{pctDisplay(selectedCarrier.floorRate)}</div>
                  </CardContent>
                </Card>
                <Card className="rc-card bg-[#060d18] border-[#12233e]">
                  <CardContent className="p-4 text-center">
                    <div className="text-xs text-[#7a95b8] uppercase tracking-wider mb-1">Avg Return</div>
                    <div className="text-2xl font-bold text-[#22c55e]">{pctDisplay(selectedCarrier.avgReturn)}</div>
                  </CardContent>
                </Card>
                <Card className="rc-card bg-[#060d18] border-[#12233e]">
                  <CardContent className="p-4 text-center">
                    <div className="text-xs text-[#7a95b8] uppercase tracking-wider mb-1">Participation</div>
                    <div className="text-2xl font-bold text-white">{pctDisplay(selectedCarrier.participationRate)}</div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-white mb-3 border-b border-[#12233e] pb-2">Fee Structure</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#7a95b8]">Premium Load Fee</span>
                      <span className="text-sm font-medium text-[#c8d8ec]">{pctDisplay(selectedCarrier.loadFee)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#7a95b8]">COI Rate (Est.)</span>
                      <span className="text-sm font-medium text-[#c8d8ec]">{pctDisplay(selectedCarrier.coiRate)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#7a95b8]">Asset Based Fee</span>
                      <span className="text-sm font-medium text-[#c8d8ec]">{pctDisplay(selectedCarrier.assetBasedFee)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#7a95b8]">Annual Policy Fee</span>
                      <span className="text-sm font-medium text-[#c8d8ec]">{currencyDisplay(selectedCarrier.policyFee)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-white mb-3 border-b border-[#12233e] pb-2">Account Features</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#7a95b8]">Fixed Account Rate</span>
                      <span className="text-sm font-medium text-[#c8d8ec]">{pctDisplay(selectedCarrier.fixedAccountRate)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#7a95b8]">Standard Loan Rate</span>
                      <span className="text-sm font-medium text-[#c8d8ec]">{pctDisplay(selectedCarrier.loanRate)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[#7a95b8]">Persistency Bonus</span>
                      <span className="text-sm font-medium text-[#c8d8ec]">{pctDisplay(selectedCarrier.bonusRate)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedCarrier.notes && (
                <div>
                  <h4 className="text-sm font-medium text-white mb-2">Notes</h4>
                  <div className="p-3 bg-[#060d18] border border-[#12233e] rounded-md text-sm text-[#c8d8ec]">
                    {selectedCarrier.notes}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsOpen(false)} className="rc-btn rc-btn-ghost">Close</Button>
            <Button onClick={() => { setDetailsOpen(false); openEdit(selectedCarrier); }} className="rc-btn rc-btn-primary">
              <Pencil className="h-4 w-4 mr-2" /> Edit Carrier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0d1a2e] border-[#12233e] text-white">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">{editingId ? "Edit Carrier Override" : "Add Carrier Override"}</DialogTitle>
            <DialogDescription className="text-[#7a95b8]">
              Configure illustration assumptions and rates for this carrier.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-2">
            {!editingId && (
              <div>
                <Label className="text-xs text-[#7a95b8] mb-2 block uppercase tracking-wider">Quick Select System Carrier</Label>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_CARRIERS.map((c) => (
                    <Badge key={c.id} variant={form.carrierId === c.id ? "default" : "outline"}
                      className={`cursor-pointer text-xs py-1 px-3 ${form.carrierId === c.id ? 'bg-[#3b82f6] text-white hover:bg-[#3b82f6]/90 border-[#3b82f6]' : 'bg-[#060d18] text-[#c8d8ec] border-[#12233e] hover:bg-[#12233e]'}`} 
                      onClick={() => handleSelectCarrier(c)}>
                      {c.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm text-[#c8d8ec]">Carrier ID <span className="text-red-500">*</span></Label>
                <Input value={form.carrierId} onChange={(e) => setForm(f => ({ ...f, carrierId: e.target.value }))}
                  placeholder="e.g. pacific-life" disabled={!!editingId} className="rc-input bg-[#060d18]" />
                <p className="text-[10px] text-[#7a95b8]">Unique identifier for the system</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-[#c8d8ec]">Carrier Name <span className="text-red-500">*</span></Label>
                <Input value={form.carrierName} onChange={(e) => setForm(f => ({ ...f, carrierName: e.target.value }))}
                  placeholder="e.g. AAA+ Mutual" className="rc-input bg-[#060d18]" />
              </div>
            </div>

            <div className="bg-[#060d18] border border-[#12233e] rounded-lg p-4 space-y-4">
              <h4 className="text-sm font-medium text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#3b82f6]" /> Core Performance Rates
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { key: "capRate", label: "Cap Rate" },
                  { key: "floorRate", label: "Floor Rate" },
                  { key: "participationRate", label: "Participation" },
                  { key: "avgReturn", label: "Avg Return" },
                ].map(({ key, label }) => (
                  <div key={key} className="space-y-1.5">
                    <Label className="text-xs text-[#c8d8ec]">{label}</Label>
                    <div className="relative">
                      <Input
                        value={form[key as keyof typeof form]}
                        onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                        placeholder="0.0000"
                        className="rc-input text-sm pr-8"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#7a95b8]">
                        {form[key as keyof typeof form] ? `${(parseFloat(form[key as keyof typeof form]) * 100).toFixed(1)}%` : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-white">Advanced Settings</h4>
              <Switch checked={showAdvanced} onCheckedChange={setShowAdvanced} />
            </div>

            {showAdvanced && (
              <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="bg-[#060d18] border border-[#12233e] rounded-lg p-4 space-y-4">
                  <h4 className="text-sm font-medium text-white flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-[#ef4444]" /> Fee Structure
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { key: "loadFee", label: "Premium Load" },
                      { key: "coiRate", label: "COI Rate" },
                      { key: "assetBasedFee", label: "Asset Fee" },
                    ].map(({ key, label }) => (
                      <div key={key} className="space-y-1.5">
                        <Label className="text-xs text-[#c8d8ec]">{label}</Label>
                        <div className="relative">
                          <Input
                            value={form[key as keyof typeof form]}
                            onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                            placeholder="0.0000"
                            className="rc-input text-sm pr-8"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#7a95b8]">
                            {form[key as keyof typeof form] ? `${(parseFloat(form[key as keyof typeof form]) * 100).toFixed(2)}%` : ""}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-[#c8d8ec]">Policy Fee ($)</Label>
                      <Input
                        value={form.policyFee}
                        onChange={(e) => setForm(f => ({ ...f, policyFee: e.target.value }))}
                        placeholder="120"
                        className="rc-input text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-[#060d18] border border-[#12233e] rounded-lg p-4 space-y-4">
                  <h4 className="text-sm font-medium text-white flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-[#f59e0b]" /> Account Features
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { key: "fixedAccountRate", label: "Fixed Account Rate" },
                      { key: "loanRate", label: "Standard Loan Rate" },
                      { key: "bonusRate", label: "Persistency Bonus" },
                    ].map(({ key, label }) => (
                      <div key={key} className="space-y-1.5">
                        <Label className="text-xs text-[#c8d8ec]">{label}</Label>
                        <div className="relative">
                          <Input
                            value={form[key as keyof typeof form]}
                            onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                            placeholder="0.0000"
                            className="rc-input text-sm pr-8"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#7a95b8]">
                            {form[key as keyof typeof form] ? `${(parseFloat(form[key as keyof typeof form]) * 100).toFixed(2)}%` : ""}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm text-[#c8d8ec]">Internal Notes</Label>
              <Textarea 
                value={form.notes} 
                onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Optional notes about this carrier's rates, specific illustration software settings, or product details..." 
                className="rc-input min-h-[80px] bg-[#060d18]" 
              />
            </div>
          </div>
          
          <DialogFooter className="border-t border-[#12233e] pt-4 mt-2 sticky bottom-0 bg-[#0d1a2e]">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rc-btn rc-btn-ghost">Cancel</Button>
            <Button onClick={handleSave} disabled={upsertMut.isPending}
              className="rc-btn rc-btn-primary">
              {upsertMut.isPending ? "Saving..." : "Save Carrier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PageInsights pageId="carrier-settings" />
      <NAICDisclaimer variant="footer" showsProjections showsHistoricalData />
    </div>
  );
}
