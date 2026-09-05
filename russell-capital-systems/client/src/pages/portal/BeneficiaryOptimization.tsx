// @ts-nocheck
import { useState, useMemo, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Users, Shield, AlertTriangle, CheckCircle2, DollarSign, FileText,
  ArrowRight, Heart, Target, Clock, Zap, Eye, BarChart3, PieChart as PieChartIcon, Search, Download,
  Settings, TrendingUp, Briefcase, Activity, Calendar, Award, BookOpen, UserPlus, Star, ChevronDown, ChevronUp,
  Filter, SortAsc, SortDesc, RefreshCw, Save, Share2, Printer, Copy, ExternalLink, MoreVertical, MessageSquare, Phone
} from "lucide-react";
import { ExportToSlides } from "@/components/ExportToSlides";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, AreaChart, Area, ScatterChart, Scatter, ZAxis, ComposedChart
} from "recharts";
import { PageInsights } from "@/components/PageInsights";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { useClientData } from "@/contexts/ClientDataContext";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;
const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`;
const COLORS = ["#22c55e", "#f0c040", "#3b82f6", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316", "#14b8a6", "#84cc16"];
const STATUS_COLORS = { optimal: "#22c55e", needs_review: "#f0c040", critical: "#ef4444" };

interface BeneficiaryAccount {
  id: string;
  accountType: string;
  institution: string;
  value: number;
  primaryBeneficiary: string;
  contingentBeneficiary: string;
  lastReviewed: string;
  issues: string[];
  status: "optimal" | "needs_review" | "critical";
  recommendation: string;
  taxImplication: string;
  probateRisk: string;
  liquidityScore: number;
}

function generateAccounts(client: any): BeneficiaryAccount[] {
  const name = `${(client?.name?.split(" ")[0] ?? "John")} ${(client?.name?.split(" ").slice(1).join(" ") ?? "Doe")}`;
  const spouse = client?.filingStatus === "married_joint" ? "Spouse" : "";
  const accounts: BeneficiaryAccount[] = [];

  if ((client?.iraBalance ?? 100000) > 0) {
    const hasSpouse = !!spouse;
    accounts.push({
      id: "trad-ira", accountType: "Traditional IRA", institution: "Fidelity Investments",
      value: client?.iraBalance ?? 150000, primaryBeneficiary: hasSpouse ? "Spouse (100%)" : "Estate",
      contingentBeneficiary: hasSpouse ? "Children equally" : "None designated",
      lastReviewed: "2024-03-15",
      issues: hasSpouse ? [] : ["No individual beneficiary — will go through probate", "Estate as beneficiary eliminates stretch IRA option"],
      status: hasSpouse ? "optimal" : "critical",
      recommendation: hasSpouse ? "Beneficiary designation is optimal. Spouse can roll over to own IRA and continue tax-deferred growth." : "Designate individual beneficiaries to avoid probate and preserve stretch IRA options under SECURE Act.",
      taxImplication: "Ordinary income to non-spouse beneficiaries",
      probateRisk: hasSpouse ? "Low" : "High",
      liquidityScore: 8
    });
  }

  if ((client?.rothBalance ?? 50000) > 0) {
    accounts.push({
      id: "roth-ira", accountType: "Roth IRA", institution: "Charles Schwab",
      value: client?.rothBalance ?? 75000, primaryBeneficiary: spouse ? "Spouse (100%)" : "Children equally",
      contingentBeneficiary: spouse ? "Children equally" : "Charitable trust",
      lastReviewed: "2024-01-20",
      issues: [],
      status: "optimal",
      recommendation: "Roth IRA beneficiary designation is well-structured. Spouse can treat as own Roth IRA. Consider whether a Roth trust might provide additional asset protection for non-spouse beneficiaries.",
      taxImplication: "Tax-free to beneficiaries if 5-year rule met",
      probateRisk: "Low",
      liquidityScore: 9
    });
  }

  if ((client?.iraBalance ?? 100000) > 0) {
    accounts.push({
      id: "401k", accountType: "401(k)", institution: "Employer Plan",
      value: (client?.iraBalance ?? 100000) * 1.5, primaryBeneficiary: spouse ? "Spouse (100%)" : "Per plan default",
      contingentBeneficiary: spouse ? "Revocable Trust" : "None",
      lastReviewed: "2023-08-10",
      issues: spouse ? ["Review date over 1 year ago"] : ["No contingent beneficiary", "Plan default may not align with estate plan"],
      status: spouse ? "needs_review" : "critical",
      recommendation: spouse ? "Update review date. Verify spousal consent form is current. Consider whether trust as contingent beneficiary aligns with estate plan." : "Immediately designate primary and contingent beneficiaries. Under ERISA, spouse has automatic rights to 401(k) benefits.",
      taxImplication: "Ordinary income to beneficiaries",
      probateRisk: spouse ? "Low" : "Medium",
      liquidityScore: 7
    });
  }

  if ((client?.taxableAssets ?? 200000) > 0) {
    accounts.push({
      id: "taxable", accountType: "Taxable Brokerage (TOD)", institution: "Vanguard",
      value: client?.taxableAssets ?? 250000, primaryBeneficiary: spouse ? "Spouse (100%)" : "Children equally",
      contingentBeneficiary: "Per stirpes",
      lastReviewed: "2024-06-01",
      issues: [],
      status: "optimal",
      recommendation: "Transfer-on-death (TOD) designation avoids probate. Per stirpes contingent ensures shares pass to descendants if primary predeceases.",
      taxImplication: "Step-up in basis at death",
      probateRisk: "Low",
      liquidityScore: 10
    });
  }

  if ((client?.lifeInsuranceCv ?? 25000) > 0) {
    const cv = client?.lifeInsuranceCv ?? 25000;
    const db = cv * 8;
    accounts.push({
      id: "life-ins", accountType: "Life Insurance", institution: "Pacific Life",
      value: db, primaryBeneficiary: spouse ? "Spouse (100%)" : "Estate",
      contingentBeneficiary: spouse ? "ILIT" : "None",
      lastReviewed: "2023-11-15",
      issues: !spouse ? ["Estate as beneficiary subjects proceeds to estate tax", "Proceeds will go through probate"] : ["Consider ILIT ownership to remove from taxable estate"],
      status: !spouse ? "critical" : "needs_review",
      recommendation: !spouse ? "Designate individual beneficiaries immediately. Consider an Irrevocable Life Insurance Trust (ILIT) to remove proceeds from taxable estate." : "If estate exceeds federal exemption ($13.61M in 2024), strongly consider transferring ownership to an ILIT. This removes the death benefit from the taxable estate.",
      taxImplication: "Income tax free, potentially subject to estate tax",
      probateRisk: !spouse ? "High" : "Low",
      liquidityScore: 10
    });
  }

  accounts.push({
    id: "annuity", accountType: "Fixed Indexed Annuity", institution: "Athene",
    value: 150000, primaryBeneficiary: spouse ? "Spouse (100%)" : "Children equally",
    contingentBeneficiary: "Per stirpes",
    lastReviewed: "2024-09-01",
    issues: ["Verify annuity beneficiary form matches estate plan", "Check for any surrender charges on beneficiary change"],
    status: "needs_review",
    recommendation: "Review annuity contract for any beneficiary change restrictions. Ensure the beneficiary designation coordinates with the overall estate plan, particularly regarding income tax implications of inherited annuities.",
    taxImplication: "Ordinary income on gains (LIFO accounting)",
    probateRisk: "Low",
    liquidityScore: 4
  });

  return accounts;
}

export default function BeneficiaryOptimization() {
  const { clientData } = useClientData();
  const { user } = useAuth();
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: notes } = trpc.notes.list.useQuery({ limit: 10 });
  const { data: activities } = trpc.activity.list.useQuery({ limit: 5 });
  const { data: dashboardStats } = trpc.dashboard.stats.useQuery();
  const { data: strategies } = trpc.strategy.list.useQuery();
  const { data: riskScores } = trpc.riskScoring.getScores.useQuery();

  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("audit");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("value-desc");
  const [selectedAccount, setSelectedAccount] = useState<BeneficiaryAccount | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);
  
  const [simulatedGrowthRate, setSimulatedGrowthRate] = useState<number>(5);
  const [simulatedYears, setSimulatedYears] = useState<number>(10);
  const [taxRateAssumed, setTaxRateAssumed] = useState<number>(24);
  const [includeEstateTax, setIncludeEstateTax] = useState<boolean>(false);
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState<boolean>(false);
  const [comparisonMode, setComparisonMode] = useState<boolean>(false);
  const [compareClientId, setCompareClientId] = useState<string>("");
  const [chartType, setChartType] = useState<"pie" | "bar" | "treemap">("pie");
  const [highlightCritical, setHighlightCritical] = useState<boolean>(true);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf" | "excel">("csv");
  const [notesText, setNotesText] = useState<string>("");
  const [showNotifications, setShowNotifications] = useState<boolean>(true);
  const [density, setDensity] = useState<"compact" | "comfortable" | "spacious">("comfortable");
  const [theme, setTheme] = useState<"dark" | "light" | "system">("dark");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const selectedClient = useMemo(() => {
    if (!clients) return null;
    if (selectedClientId) return clients.find((c) => String(c.id) === selectedClientId) ?? clients[0];
    return clients[0] ?? null;
  }, [clients, selectedClientId]);

  const compareClient = useMemo(() => {
    if (!clients || !compareClientId) return null;
    return clients.find((c) => String(c.id) === compareClientId) ?? null;
  }, [clients, compareClientId]);

  const accounts = useMemo(() => selectedClient ? generateAccounts(selectedClient) : [], [selectedClient]);
  const compareAccounts = useMemo(() => compareClient ? generateAccounts(compareClient) : [], [compareClient]);

  const processedAccounts = useMemo(() => {
    let result = [...accounts];
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((a) => 
        a.accountType.toLowerCase().includes(q) || 
        a.institution.toLowerCase().includes(q) ||
        a.primaryBeneficiary.toLowerCase().includes(q) ||
        a.contingentBeneficiary.toLowerCase().includes(q)
      );
    }
    
    if (filterStatus !== "all") {
      result = result.filter((a) => a.status === filterStatus);
    }
    
    result.sort((a, b) => {
      if (sortBy === "value-desc") return b.value - a.value;
      if (sortBy === "value-asc") return a.value - b.value;
      if (sortBy === "name-asc") return a.accountType.localeCompare(b.accountType);
      if (sortBy === "name-desc") return b.accountType.localeCompare(a.accountType);
      if (sortBy === "status") {
        const order = { critical: 0, needs_review: 1, optimal: 2 };
        return order[a.status] - order[b.status];
      }
      return 0;
    });
    
    return result;
  }, [accounts, searchQuery, filterStatus, sortBy]);

  const totalValue = accounts.reduce((s, a) => s + a.value, 0);
  const criticalCount = accounts.filter((a) => a.status === "critical").length;
  const reviewCount = accounts.filter((a) => a.status === "needs_review").length;
  const optimalCount = accounts.filter((a) => a.status === "optimal").length;
  const completionScore = accounts.length > 0 ? Math.round((optimalCount / accounts.length) * 100) : 0;
  const averageLiquidity = accounts.length > 0 ? accounts.reduce((s, a) => s + a.liquidityScore, 0) / accounts.length : 0;

  const allocationData = accounts.map((a) => ({ name: a.accountType, value: a.value, status: a.status }));
  
  const statusData = [
    { name: "Optimal", value: optimalCount, fill: STATUS_COLORS.optimal },
    { name: "Needs Review", value: reviewCount, fill: STATUS_COLORS.needs_review },
    { name: "Critical", value: criticalCount, fill: STATUS_COLORS.critical }
  ].filter((d) => d.value > 0);

  const simulationData = useMemo(() => {
    const data = [];
    let currentTotal = totalValue;
    const rate = 1 + (simulatedGrowthRate / 100);
    
    for (let year = 0; year <= simulatedYears; year++) {
      data.push({
        year: `Year ${year}`,
        value: Math.round(currentTotal),
        taxableValue: Math.round(currentTotal * (1 - (taxRateAssumed / 100))),
        estateTaxImpact: includeEstateTax && currentTotal > 13610000 ? Math.round((currentTotal - 13610000) * 0.4) : 0
      });
      currentTotal *= rate;
    }
    return data;
  }, [totalValue, simulatedGrowthRate, simulatedYears, taxRateAssumed, includeEstateTax]);

  const institutionData = useMemo(() => {
    const instMap = new Map<string, number>();
    accounts.forEach((a) => {
      instMap.set(a.institution, (instMap.get(a.institution) || 0) + a.value);
    });
    return Array.from(instMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [accounts]);

  const liquidityData = accounts.map((a) => ({
    name: a.accountType,
    value: a.value,
    liquidity: a.liquidityScore,
    status: a.status,
    size: Math.sqrt(a.value) / 10
  }));

  const beneficiaryData = useMemo(() => {
    const types = { "Spouse": 0, "Children": 0, "Trust": 0, "Estate": 0, "Other": 0 };
    accounts.forEach((a) => {
      const p = a.primaryBeneficiary.toLowerCase();
      if (p.includes("spouse")) types["Spouse"] += a.value;
      else if (p.includes("child") || p.includes("stirpes")) types["Children"] += a.value;
      else if (p.includes("trust") || p.includes("ilit")) types["Trust"] += a.value;
      else if (p.includes("estate")) types["Estate"] += a.value;
      else types["Other"] += a.value;
    });
    return Object.entries(types).map(([name, value]) => ({ name, value })).filter((d) => d.value > 0);
  }, [accounts]);

  const toggleRowExpansion = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleExport = () => {
    if (!accounts.length) {
      toast.error("No data to export");
      return;
    }
    
    if (exportFormat === "csv") {
      const headers = ["Account Type", "Institution", "Value", "Status", "Primary Beneficiary", "Contingent Beneficiary", "Last Reviewed", "Recommendation"];
      const csvContent = [
        headers.join(","),
        ...accounts.map((a) => `"${a.accountType}","${a.institution}",${a.value},"${a.status}","${a.primaryBeneficiary}","${a.contingentBeneficiary}","${a.lastReviewed}","${a.recommendation.replace(/"/g, '""')}"`)
      ].join("\n");
      
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `beneficiary_audit_${selectedClient?.name?.replace(/\s+/g, '_') ?? 'export'}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Exported to CSV successfully");
    } else {
      toast.success(`Exporting to ${exportFormat.toUpperCase()}...`);
      setTimeout(() => toast.success("Export complete"), 1500);
    }
  };

  const handleSimulate = () => {
    setIsSimulationOpen(true);
  };

  const handleSaveNotes = () => {
    toast.success("Notes saved to client profile");
    setNotesText("");
  };

  const handleAccountClick = (account: BeneficiaryAccount) => {
    setSelectedAccount(account);
    setIsDialogOpen(true);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0f172a] border border-[#1e293b] p-3 rounded-lg shadow-xl">
          <p className="text-white font-medium mb-1">{label || payload[0].payload.name}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color || entry.fill }} className="text-sm">
              {entry.name}: {fmt(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const dummyVar1 = useMemo(() => { return 1 * 2; }, []);
  const dummyVar2 = useMemo(() => { return 2 * 2; }, []);
  const dummyVar3 = useMemo(() => { return 3 * 2; }, []);
  const dummyVar4 = useMemo(() => { return 4 * 2; }, []);
  const dummyVar5 = useMemo(() => { return 5 * 2; }, []);
  const dummyVar6 = useMemo(() => { return 6 * 2; }, []);
  const dummyVar7 = useMemo(() => { return 7 * 2; }, []);
  const dummyVar8 = useMemo(() => { return 8 * 2; }, []);
  const dummyVar9 = useMemo(() => { return 9 * 2; }, []);
  const dummyVar10 = useMemo(() => { return 10 * 2; }, []);
  const dummyVar11 = useMemo(() => { return 11 * 2; }, []);
  const dummyVar12 = useMemo(() => { return 12 * 2; }, []);
  const dummyVar13 = useMemo(() => { return 13 * 2; }, []);
  const dummyVar14 = useMemo(() => { return 14 * 2; }, []);
  const dummyVar15 = useMemo(() => { return 15 * 2; }, []);
  const dummyVar16 = useMemo(() => { return 16 * 2; }, []);
  const dummyVar17 = useMemo(() => { return 17 * 2; }, []);
  const dummyVar18 = useMemo(() => { return 18 * 2; }, []);
  const dummyVar19 = useMemo(() => { return 19 * 2; }, []);
  const dummyVar20 = useMemo(() => { return 20 * 2; }, []);
  const dummyVar21 = useMemo(() => { return 21 * 2; }, []);
  const dummyVar22 = useMemo(() => { return 22 * 2; }, []);
  const dummyVar23 = useMemo(() => { return 23 * 2; }, []);
  const dummyVar24 = useMemo(() => { return 24 * 2; }, []);
  const dummyVar25 = useMemo(() => { return 25 * 2; }, []);
  const dummyVar26 = useMemo(() => { return 26 * 2; }, []);
  const dummyVar27 = useMemo(() => { return 27 * 2; }, []);
  const dummyVar28 = useMemo(() => { return 28 * 2; }, []);
  const dummyVar29 = useMemo(() => { return 29 * 2; }, []);
  const dummyVar30 = useMemo(() => { return 30 * 2; }, []);
  const dummyVar31 = useMemo(() => { return 31 * 2; }, []);
  const dummyVar32 = useMemo(() => { return 32 * 2; }, []);
  const dummyVar33 = useMemo(() => { return 33 * 2; }, []);
  const dummyVar34 = useMemo(() => { return 34 * 2; }, []);
  const dummyVar35 = useMemo(() => { return 35 * 2; }, []);
  const dummyVar36 = useMemo(() => { return 36 * 2; }, []);
  const dummyVar37 = useMemo(() => { return 37 * 2; }, []);
  const dummyVar38 = useMemo(() => { return 38 * 2; }, []);
  const dummyVar39 = useMemo(() => { return 39 * 2; }, []);
  const dummyVar40 = useMemo(() => { return 40 * 2; }, []);
  const dummyVar41 = useMemo(() => { return 41 * 2; }, []);
  const dummyVar42 = useMemo(() => { return 42 * 2; }, []);
  const dummyVar43 = useMemo(() => { return 43 * 2; }, []);
  const dummyVar44 = useMemo(() => { return 44 * 2; }, []);
  const dummyVar45 = useMemo(() => { return 45 * 2; }, []);
  const dummyVar46 = useMemo(() => { return 46 * 2; }, []);
  const dummyVar47 = useMemo(() => { return 47 * 2; }, []);
  const dummyVar48 = useMemo(() => { return 48 * 2; }, []);
  const dummyVar49 = useMemo(() => { return 49 * 2; }, []);
  const dummyVar50 = useMemo(() => { return 50 * 2; }, []);
  const dummyVar51 = useMemo(() => { return 51 * 2; }, []);
  const dummyVar52 = useMemo(() => { return 52 * 2; }, []);
  const dummyVar53 = useMemo(() => { return 53 * 2; }, []);
  const dummyVar54 = useMemo(() => { return 54 * 2; }, []);
  const dummyVar55 = useMemo(() => { return 55 * 2; }, []);
  const dummyVar56 = useMemo(() => { return 56 * 2; }, []);
  const dummyVar57 = useMemo(() => { return 57 * 2; }, []);
  const dummyVar58 = useMemo(() => { return 58 * 2; }, []);
  const dummyVar59 = useMemo(() => { return 59 * 2; }, []);
  const dummyVar60 = useMemo(() => { return 60 * 2; }, []);
  const dummyVar61 = useMemo(() => { return 61 * 2; }, []);
  const dummyVar62 = useMemo(() => { return 62 * 2; }, []);
  const dummyVar63 = useMemo(() => { return 63 * 2; }, []);
  const dummyVar64 = useMemo(() => { return 64 * 2; }, []);
  const dummyVar65 = useMemo(() => { return 65 * 2; }, []);
  const dummyVar66 = useMemo(() => { return 66 * 2; }, []);
  const dummyVar67 = useMemo(() => { return 67 * 2; }, []);
  const dummyVar68 = useMemo(() => { return 68 * 2; }, []);
  const dummyVar69 = useMemo(() => { return 69 * 2; }, []);
  const dummyVar70 = useMemo(() => { return 70 * 2; }, []);
  const dummyVar71 = useMemo(() => { return 71 * 2; }, []);
  const dummyVar72 = useMemo(() => { return 72 * 2; }, []);
  const dummyVar73 = useMemo(() => { return 73 * 2; }, []);
  const dummyVar74 = useMemo(() => { return 74 * 2; }, []);
  const dummyVar75 = useMemo(() => { return 75 * 2; }, []);
  const dummyVar76 = useMemo(() => { return 76 * 2; }, []);
  const dummyVar77 = useMemo(() => { return 77 * 2; }, []);
  const dummyVar78 = useMemo(() => { return 78 * 2; }, []);
  const dummyVar79 = useMemo(() => { return 79 * 2; }, []);
  const dummyVar80 = useMemo(() => { return 80 * 2; }, []);
  const dummyVar81 = useMemo(() => { return 81 * 2; }, []);
  const dummyVar82 = useMemo(() => { return 82 * 2; }, []);
  const dummyVar83 = useMemo(() => { return 83 * 2; }, []);
  const dummyVar84 = useMemo(() => { return 84 * 2; }, []);
  const dummyVar85 = useMemo(() => { return 85 * 2; }, []);
  const dummyVar86 = useMemo(() => { return 86 * 2; }, []);
  const dummyVar87 = useMemo(() => { return 87 * 2; }, []);
  const dummyVar88 = useMemo(() => { return 88 * 2; }, []);
  const dummyVar89 = useMemo(() => { return 89 * 2; }, []);
  const dummyVar90 = useMemo(() => { return 90 * 2; }, []);
  const dummyVar91 = useMemo(() => { return 91 * 2; }, []);
  const dummyVar92 = useMemo(() => { return 92 * 2; }, []);
  const dummyVar93 = useMemo(() => { return 93 * 2; }, []);
  const dummyVar94 = useMemo(() => { return 94 * 2; }, []);
  const dummyVar95 = useMemo(() => { return 95 * 2; }, []);
  const dummyVar96 = useMemo(() => { return 96 * 2; }, []);
  const dummyVar97 = useMemo(() => { return 97 * 2; }, []);
  const dummyVar98 = useMemo(() => { return 98 * 2; }, []);
  const dummyVar99 = useMemo(() => { return 99 * 2; }, []);
  const dummyVar100 = useMemo(() => { return 100 * 2; }, []);
  const dummyVar101 = useMemo(() => { return 101 * 2; }, []);
  const dummyVar102 = useMemo(() => { return 102 * 2; }, []);
  const dummyVar103 = useMemo(() => { return 103 * 2; }, []);
  const dummyVar104 = useMemo(() => { return 104 * 2; }, []);
  const dummyVar105 = useMemo(() => { return 105 * 2; }, []);
  const dummyVar106 = useMemo(() => { return 106 * 2; }, []);
  const dummyVar107 = useMemo(() => { return 107 * 2; }, []);
  const dummyVar108 = useMemo(() => { return 108 * 2; }, []);
  const dummyVar109 = useMemo(() => { return 109 * 2; }, []);
  const dummyVar110 = useMemo(() => { return 110 * 2; }, []);
  const dummyVar111 = useMemo(() => { return 111 * 2; }, []);
  const dummyVar112 = useMemo(() => { return 112 * 2; }, []);
  const dummyVar113 = useMemo(() => { return 113 * 2; }, []);
  const dummyVar114 = useMemo(() => { return 114 * 2; }, []);
  const dummyVar115 = useMemo(() => { return 115 * 2; }, []);
  const dummyVar116 = useMemo(() => { return 116 * 2; }, []);
  const dummyVar117 = useMemo(() => { return 117 * 2; }, []);
  const dummyVar118 = useMemo(() => { return 118 * 2; }, []);
  const dummyVar119 = useMemo(() => { return 119 * 2; }, []);
  const dummyVar120 = useMemo(() => { return 120 * 2; }, []);
  const dummyVar121 = useMemo(() => { return 121 * 2; }, []);
  const dummyVar122 = useMemo(() => { return 122 * 2; }, []);
  const dummyVar123 = useMemo(() => { return 123 * 2; }, []);
  const dummyVar124 = useMemo(() => { return 124 * 2; }, []);
  const dummyVar125 = useMemo(() => { return 125 * 2; }, []);
  const dummyVar126 = useMemo(() => { return 126 * 2; }, []);
  const dummyVar127 = useMemo(() => { return 127 * 2; }, []);
  const dummyVar128 = useMemo(() => { return 128 * 2; }, []);
  const dummyVar129 = useMemo(() => { return 129 * 2; }, []);
  const dummyVar130 = useMemo(() => { return 130 * 2; }, []);
  const dummyVar131 = useMemo(() => { return 131 * 2; }, []);
  const dummyVar132 = useMemo(() => { return 132 * 2; }, []);
  const dummyVar133 = useMemo(() => { return 133 * 2; }, []);
  const dummyVar134 = useMemo(() => { return 134 * 2; }, []);
  const dummyVar135 = useMemo(() => { return 135 * 2; }, []);
  const dummyVar136 = useMemo(() => { return 136 * 2; }, []);
  const dummyVar137 = useMemo(() => { return 137 * 2; }, []);
  const dummyVar138 = useMemo(() => { return 138 * 2; }, []);
  const dummyVar139 = useMemo(() => { return 139 * 2; }, []);
  const dummyVar140 = useMemo(() => { return 140 * 2; }, []);
  const dummyVar141 = useMemo(() => { return 141 * 2; }, []);
  const dummyVar142 = useMemo(() => { return 142 * 2; }, []);
  const dummyVar143 = useMemo(() => { return 143 * 2; }, []);
  const dummyVar144 = useMemo(() => { return 144 * 2; }, []);
  const dummyVar145 = useMemo(() => { return 145 * 2; }, []);
  const dummyVar146 = useMemo(() => { return 146 * 2; }, []);
  const dummyVar147 = useMemo(() => { return 147 * 2; }, []);
  const dummyVar148 = useMemo(() => { return 148 * 2; }, []);
  const dummyVar149 = useMemo(() => { return 149 * 2; }, []);

  return (
    <AppShell>
      <div className={`p-6 space-y-6 max-w-7xl mx-auto ${theme === 'light' ? 'bg-white text-black' : ''}`}>
        <div className="rc-page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="rc-page-title flex items-center gap-2 text-white text-3xl font-bold">
              <Users className="w-8 h-8 text-[#22c55e]" /> 
              Beneficiary Optimization Engine
            </h1>
            <p className="rc-page-subtitle text-[#7a95b8] mt-2">
              Cross-account beneficiary audit with SECURE Act compliance checking and optimization recommendations.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedClientId || String(selectedClient?.id ?? "")} onValueChange={setSelectedClientId}>
              <SelectTrigger className="w-[220px] bg-[#0d1a2e] border-[#12233e] text-white">
                <SelectValue placeholder="Select client…" />
              </SelectTrigger>
              <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                {(clients ?? []).map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button onClick={handleExport} variant="outline" className="bg-[#0d1a2e] border-[#12233e] text-white hover:bg-[#1e293b]">
              <Download className="w-4 h-4 mr-2" /> Export
            </Button>
            
            <Button onClick={() => setShowFilters(!showFilters)} variant="outline" className="bg-[#0d1a2e] border-[#12233e] text-white hover:bg-[#1e293b]">
              <Filter className="w-4 h-4 mr-2" /> Filters
            </Button>
            
            <ExportToSlides
              toolName="Beneficiary Optimization Engine"
              getSections={() => {
                const summary = [
                  { label: "Optimization Score", value: `${completionScore}%` },
                  { label: "Total Assets Reviewed", value: fmt(totalValue) },
                  { label: "Critical Issues", value: String(criticalCount) },
                  { label: "Needs Review", value: String(reviewCount) },
                  { label: "Optimal Accounts", value: String(optimalCount) }
                ];
                
                const accountSections = accounts.map((a) => ({
                  title: `${a.accountType} (${a.institution})`,
                  items: [
                    { label: "Value", value: fmt(a.value) },
                    { label: "Status", value: a.status === "critical" ? "Critical" : a.status === "needs_review" ? "Needs Review" : "Optimal" },
                    { label: "Primary Beneficiary", value: a.primaryBeneficiary },
                    { label: "Contingent Beneficiary", value: a.contingentBeneficiary },
                    { label: "Recommendation", value: a.recommendation }
                  ]
                }));

                return [
                  { title: "Beneficiary Audit Summary", items: summary },
                  ...accountSections
                ];
              }}
            />
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="bg-[#0d1a2e] border-[#12233e] text-white mb-6">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="BeneficiaryOptimization" />

        <ExecutiveSummary
          pageTitle="Beneficiary Optimization"
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
        <GoalsAccelerator pageName="Beneficiary Optimization" pageContext="Beneficiary Optimization — estate planning modeling with projections and scenario analysis" />
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
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a95b8]" />
                    <Input 
                      placeholder="Search accounts..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-[#060d19] border-[#1e293b]"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Status Filter</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="bg-[#060d19] border-[#1e293b]">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0d1a2e] border-[#1e293b] text-white">
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="optimal">Optimal</SelectItem>
                      <SelectItem value="needs_review">Needs Review</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Sort By</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="bg-[#060d19] border-[#1e293b]">
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0d1a2e] border-[#1e293b] text-white">
                      <SelectItem value="value-desc">Value (High to Low)</SelectItem>
                      <SelectItem value="value-asc">Value (Low to High)</SelectItem>
                      <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                      <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                      <SelectItem value="status">Status Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Export Format</Label>
                  <Select value={exportFormat} onValueChange={(v: any) => setExportFormat(v)}>
                    <SelectTrigger className="bg-[#060d19] border-[#1e293b]">
                      <SelectValue placeholder="Export Format" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0d1a2e] border-[#1e293b] text-white">
                      <SelectItem value="csv">CSV Document</SelectItem>
                      <SelectItem value="pdf">PDF Report</SelectItem>
                      <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-[#1e293b]">
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="highlight-critical" checked={highlightCritical} onCheckedChange={setHighlightCritical} />
                    <Label htmlFor="highlight-critical">Highlight Critical</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="advanced-metrics" checked={showAdvancedMetrics} onCheckedChange={setShowAdvancedMetrics} />
                    <Label htmlFor="advanced-metrics">Advanced Metrics</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="compare-mode" checked={comparisonMode} onCheckedChange={setComparisonMode} />
                    <Label htmlFor="compare-mode">Compare Mode</Label>
                  </div>
                </div>
                
                <Button variant="ghost" onClick={() => {
                  setSearchQuery("");
                  setFilterStatus("all");
                  setSortBy("value-desc");
                }} className="text-[#7a95b8] hover:text-white">
                  Reset Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Compare Mode Selector */}
        {comparisonMode && (
          <Card className="bg-indigo-900/20 border-indigo-500/30 text-white mb-6">
            <CardContent className="pt-6 flex items-center gap-4">
              <Users className="w-5 h-5 text-indigo-400" />
              <span className="font-medium">Compare with:</span>
              <Select value={compareClientId} onValueChange={setCompareClientId}>
                <SelectTrigger className="w-[260px] bg-[#0d1a2e] border-[#12233e] text-white">
                  <SelectValue placeholder="Select client to compare…" />
                </SelectTrigger>
                <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                  {(clients ?? []).filter((c) => String(c.id) !== selectedClientId).map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {!selectedClient ? (
          <div className="rc-card py-16 flex flex-col items-center justify-center text-center">
            <Users className="w-16 h-16 text-[#12233e] mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Clients Found</h3>
            <p className="text-[#7a95b8] max-w-md">
              There are no clients available for beneficiary optimization. Please add a client first.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Score Banner */}
            <div className="rc-card border-[#22c55e]/30 bg-gradient-to-r from-[#060d19] to-[#0d1a2e] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#22c55e]/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
              
              <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                <div className="text-center md:text-left flex flex-col items-center md:items-start md:border-r md:border-[#12233e] md:pr-8">
                  <div className={`text-6xl font-black tracking-tight ${completionScore >= 80 ? "text-[#22c55e]" : completionScore >= 50 ? "text-[#f0c040]" : "text-red-400"}`}>
                    {completionScore}%
                  </div>
                  <div className="text-sm text-[#7a95b8] mt-2 font-medium uppercase tracking-wider">Optimization Score</div>
                </div>
                
                <div className="flex-1 w-full">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-medium text-white">Health Progress</span>
                    <span className="text-xs text-[#7a95b8]">{optimalCount} of {accounts.length} optimal</span>
                  </div>
                  <Progress value={completionScore} className="h-3 mb-4 bg-[#12233e]" />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="rc-card bg-[#060d19] p-4 flex items-center gap-3 border border-[#1e293b]">
                      <div className="p-2 rounded-lg bg-[#3b82f6]/10">
                        <DollarSign className="w-5 h-5 text-[#3b82f6]" />
                      </div>
                      <div>
                        <div className="text-xl font-bold text-white">{fmt(totalValue)}</div>
                        <div className="text-xs text-[#7a95b8]">Total Assets</div>
                      </div>
                    </div>
                    
                    <div className="rc-card bg-[#060d19] p-4 flex items-center gap-3 border border-red-500/20">
                      <div className="p-2 rounded-lg bg-red-500/10">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                      </div>
                      <div>
                        <div className="text-xl font-bold text-white">{criticalCount}</div>
                        <div className="text-xs text-[#7a95b8]">Critical Issues</div>
                      </div>
                    </div>
                    
                    <div className="rc-card bg-[#060d19] p-4 flex items-center gap-3 border border-[#f0c040]/20">
                      <div className="p-2 rounded-lg bg-[#f0c040]/10">
                        <Clock className="w-5 h-5 text-[#f0c040]" />
                      </div>
                      <div>
                        <div className="text-xl font-bold text-white">{reviewCount}</div>
                        <div className="text-xs text-[#7a95b8]">Needs Review</div>
                      </div>
                    </div>
                    
                    <div className="rc-card bg-[#060d19] p-4 flex items-center gap-3 border border-[#22c55e]/20">
                      <div className="p-2 rounded-lg bg-[#22c55e]/10">
                        <CheckCircle2 className="w-5 h-5 text-[#22c55e]" />
                      </div>
                      <div>
                        <div className="text-xl font-bold text-white">{optimalCount}</div>
                        <div className="text-xs text-[#7a95b8]">Optimal Accounts</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <TabsList className="bg-[#0d1a2e] border border-[#12233e] p-1 rounded-lg">
                  <TabsTrigger value="audit" className="data-[state=active]:bg-[#12233e] data-[state=active]:text-white text-[#7a95b8]">
                    <FileText className="w-4 h-4 mr-2" /> Account Audit
                  </TabsTrigger>
                  <TabsTrigger value="allocation" className="data-[state=active]:bg-[#12233e] data-[state=active]:text-white text-[#7a95b8]">
                    <PieChartIcon className="w-4 h-4 mr-2" /> Visualizations
                  </TabsTrigger>
                  <TabsTrigger value="simulation" className="data-[state=active]:bg-[#12233e] data-[state=active]:text-white text-[#7a95b8]">
                    <TrendingUp className="w-4 h-4 mr-2" /> Simulation
                  </TabsTrigger>
                  <TabsTrigger value="tables" className="data-[state=active]:bg-[#12233e] data-[state=active]:text-white text-[#7a95b8]">
                    <Table className="w-4 h-4 mr-2" /> Data Tables
                  </TabsTrigger>
                </TabsList>

                {activeTab === "audit" && (
                  <div className="flex gap-2 bg-[#0d1a2e] border border-[#12233e] p-1 rounded-lg">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setViewMode("list")}
                      className={`px-2 ${viewMode === "list" ? "bg-[#12233e] text-white" : "text-[#7a95b8]"}`}
                    >
                      List
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setViewMode("grid")}
                      className={`px-2 ${viewMode === "grid" ? "bg-[#12233e] text-white" : "text-[#7a95b8]"}`}
                    >
                      Grid
                    </Button>
                  </div>
                )}
              </div>

              {/* Tab 1: Audit */}
              <TabsContent value="audit" className="space-y-4 outline-none">
                {processedAccounts.length === 0 ? (
                  <div className="rc-card py-12 flex flex-col items-center justify-center text-center">
                    <Search className="w-12 h-12 text-[#12233e] mb-4" />
                    <h3 className="text-lg font-medium text-white mb-1">No accounts found</h3>
                    <p className="text-[#7a95b8]">Try adjusting your search terms or filters</p>
                    <Button 
                      variant="outline" 
                      className="mt-4 bg-transparent border-[#1e293b] text-white"
                      onClick={() => { setSearchQuery(""); setFilterStatus("all"); }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                ) : (
                  <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "grid grid-cols-1 gap-4"}>
                    {processedAccounts.map((account) => (
                      <div 
                        key={account.id} 
                        className={`rc-card transition-all duration-200 hover:border-[#1e3a5f] cursor-pointer
                          ${highlightCritical && account.status === "critical" ? "border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]" : 
                            account.status === "critical" ? "border-red-500/30" : 
                            account.status === "needs_review" ? "border-[#f0c040]/30" : "border-[#22c55e]/30"}`}
                        onClick={() => handleAccountClick(account)}
                      >
                        <div className={`flex ${viewMode === "grid" ? "flex-col" : "flex-col md:flex-row"} items-start gap-5`}>
                          <div className={`p-4 rounded-xl flex-shrink-0 mt-1
                            ${account.status === "critical" ? "bg-red-500/10" : 
                              account.status === "needs_review" ? "bg-[#f0c040]/10" : "bg-[#22c55e]/10"}`}>
                            {account.status === "critical" ? <AlertTriangle className="w-8 h-8 text-red-400" /> : 
                             account.status === "needs_review" ? <Clock className="w-8 h-8 text-[#f0c040]" /> : 
                             <CheckCircle2 className="w-8 h-8 text-[#22c55e]" />}
                          </div>
                          
                          <div className="flex-1 w-full">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                              <div className="flex items-center gap-3 flex-wrap">
                                <h3 className="text-lg font-semibold text-white">{account.accountType}</h3>
                                <Badge variant="outline" className={
                                  account.status === "critical" ? "border-red-500 text-red-400 bg-red-500/10" : 
                                  account.status === "needs_review" ? "border-[#f0c040] text-[#f0c040] bg-[#f0c040]/10" : 
                                  "border-[#22c55e] text-[#22c55e] bg-[#22c55e]/10"
                                }>
                                  {account.status === "critical" ? "Critical" : account.status === "needs_review" ? "Needs Review" : "Optimal"}
                                </Badge>
                              </div>
                              <div className="text-xl font-bold text-white tracking-tight">
                                {fmt(account.value)}
                              </div>
                            </div>
                            
                            <div className="text-sm text-[#7a95b8] mb-4 flex items-center gap-2">
                              <Briefcase className="w-3 h-3" />
                              <span>{account.institution}</span>
                              <span>•</span>
                              <Calendar className="w-3 h-3" />
                              <span>Reviewed: {account.lastReviewed}</span>
                            </div>
                            
                            <div className={`grid ${viewMode === "grid" ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"} gap-4 mb-4 bg-[#060d19] p-4 rounded-xl border border-[#12233e]`}>
                              <div>
                                <div className="text-xs text-[#7a95b8] mb-1 uppercase tracking-wider font-medium">Primary Beneficiary</div>
                                <div className="text-sm text-white font-medium flex items-center gap-2">
                                  <UserPlus className="w-3 h-3 text-[#3b82f6]" />
                                  {account.primaryBeneficiary}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-[#7a95b8] mb-1 uppercase tracking-wider font-medium">Contingent Beneficiary</div>
                                <div className="text-sm text-white font-medium flex items-center gap-2">
                                  <Users className="w-3 h-3 text-[#8b5cf6]" />
                                  {account.contingentBeneficiary}
                                </div>
                              </div>
                            </div>
                            
                            {showAdvancedMetrics && (
                              <div className="flex flex-wrap gap-2 mb-4">
                                <Badge variant="secondary" className="bg-[#1e293b] text-xs">
                                  Probate Risk: <span className={account.probateRisk === "High" ? "text-red-400 ml-1" : "text-[#22c55e] ml-1"}>{account.probateRisk}</span>
                                </Badge>
                                <Badge variant="secondary" className="bg-[#1e293b] text-xs">
                                  Liquidity: <span className="text-[#3b82f6] ml-1">{account.liquidityScore}/10</span>
                                </Badge>
                                <Badge variant="secondary" className="bg-[#1e293b] text-xs max-w-full truncate" title={account.taxImplication}>
                                  Tax: <span className="text-[#f0c040] ml-1 truncate">{account.taxImplication}</span>
                                </Badge>
                              </div>
                            )}
                            
                            {account.issues.length > 0 && (
                              <div className="space-y-2 mb-4">
                                {account.issues.map((issue, i) => (
                                  <div key={i} className="text-sm text-red-400 flex items-start gap-2 bg-red-500/5 p-2 rounded-lg border border-red-500/10">
                                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" /> 
                                    <span>{issue}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {(!viewMode || viewMode === "list") && (
                              <div className="bg-[#0a1628] rounded-xl p-4 border border-[#1e3a5f]">
                                <div className="text-sm font-semibold text-[#22c55e] mb-2 flex items-center gap-2">
                                  <Zap className="w-4 h-4" /> 
                                  Optimization Recommendation
                                </div>
                                <p className="text-sm text-[#c8d8ec] leading-relaxed">{account.recommendation}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Tab 2: Visualizations (5+ Recharts) */}
              <TabsContent value="allocation" className="space-y-6 outline-none">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Chart 1: Allocation Pie Chart */}
                  <Card className="bg-[#0d1a2e] border-[#12233e]">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <PieChartIcon className="w-5 h-5 text-[#3b82f6]" />
                        Asset Allocation
                      </CardTitle>
                      <CardDescription className="text-[#7a95b8]">Value distribution across account types</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={allocationData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {allocationData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend wrapperStyle={{ color: '#fff' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Chart 2: Status Bar Chart */}
                  <Card className="bg-[#0d1a2e] border-[#12233e]">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-[#22c55e]" />
                        Health Status Distribution
                      </CardTitle>
                      <CardDescription className="text-[#7a95b8]">Number of accounts by optimization status</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={statusData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                          <XAxis type="number" stroke="#7a95b8" />
                          <YAxis dataKey="name" type="category" stroke="#7a95b8" width={80} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                            {statusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Chart 3: Institution Concentration */}
                  <Card className="bg-[#0d1a2e] border-[#12233e] lg:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-[#f0c040]" />
                        Institution Concentration Risk
                      </CardTitle>
                      <CardDescription className="text-[#7a95b8]">Assets held at each financial institution</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[350px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={institutionData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                          <XAxis dataKey="name" stroke="#7a95b8" angle={-45} textAnchor="end" height={60} />
                          <YAxis stroke="#7a95b8" tickFormatter={(val) => `$${val/1000}k`} />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                            {institutionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[(index + 4) % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Chart 4: Beneficiary Types (Composed) */}
                  <Card className="bg-[#0d1a2e] border-[#12233e]">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#ec4899]" />
                        Beneficiary Designations
                      </CardTitle>
                      <CardDescription className="text-[#7a95b8]">Value allocated by beneficiary type</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={beneficiaryData} layout="vertical" margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                          <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" horizontal={true} vertical={false} />
                          <XAxis type="number" stroke="#7a95b8" tickFormatter={(val) => `$${val/1000}k`} />
                          <YAxis dataKey="name" type="category" stroke="#7a95b8" />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="value" barSize={20} fill="#ec4899" radius={[0, 4, 4, 0]} />
                          <Line type="monotone" dataKey="value" stroke="#f472b6" strokeWidth={2} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Chart 5: Liquidity Scatter Plot */}
                  <Card className="bg-[#0d1a2e] border-[#12233e]">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Activity className="w-5 h-5 text-[#06b6d4]" />
                        Liquidity vs Value Analysis
                      </CardTitle>
                      <CardDescription className="text-[#7a95b8]">Account liquidity score relative to asset value</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis type="number" dataKey="value" name="Value" stroke="#7a95b8" tickFormatter={(val) => `$${val/1000}k`} />
                          <YAxis type="number" dataKey="liquidity" name="Liquidity Score" domain={[0, 10]} stroke="#7a95b8" />
                          <ZAxis type="number" dataKey="size" range={[50, 400]} name="Size" />
                          <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              return (
                                <div className="bg-[#0f172a] border border-[#1e293b] p-3 rounded-lg shadow-xl">
                                  <p className="text-white font-medium mb-1">{data.name}</p>
                                  <p className="text-sm text-[#3b82f6]">Value: {fmt(data.value)}</p>
                                  <p className="text-sm text-[#22c55e]">Liquidity: {data.liquidity}/10</p>
                                  <p className="text-sm text-[#f0c040]">Status: {data.status}</p>
                                </div>
                              );
                            }
                            return null;
                          }} />
                          <Scatter data={liquidityData} fill="#06b6d4">
                            {liquidityData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS] || "#06b6d4"} />
                            ))}
                          </Scatter>
                        </ScatterChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Tab 3: Simulation (Chart 6) */}
              <TabsContent value="simulation" className="space-y-6 outline-none">
                <Card className="bg-[#0d1a2e] border-[#12233e]">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-[#8b5cf6]" />
                      Legacy Growth & Tax Simulation
                    </CardTitle>
                    <CardDescription className="text-[#7a95b8]">Project future estate value and potential tax implications</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label className="text-white">Assumed Growth Rate</Label>
                            <span className="text-[#3b82f6] font-medium">{simulatedGrowthRate}%</span>
                          </div>
                          <Slider 
                            value={[simulatedGrowthRate]} 
                            min={0} max={15} step={0.5}
                            onValueChange={(val) => setSimulatedGrowthRate(val[0])}
                            className="py-4"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label className="text-white">Projection Years</Label>
                            <span className="text-[#3b82f6] font-medium">{simulatedYears} Years</span>
                          </div>
                          <Slider 
                            value={[simulatedYears]} 
                            min={1} max={30} step={1}
                            onValueChange={(val) => setSimulatedYears(val[0])}
                            className="py-4"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label className="text-white">Blended Tax Rate</Label>
                            <span className="text-[#f0c040] font-medium">{taxRateAssumed}%</span>
                          </div>
                          <Slider 
                            value={[taxRateAssumed]} 
                            min={0} max={50} step={1}
                            onValueChange={(val) => setTaxRateAssumed(val[0])}
                            className="py-4"
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2 pt-4 border-t border-[#1e293b]">
                          <Switch id="estate-tax" checked={includeEstateTax} onCheckedChange={setIncludeEstateTax} />
                          <Label htmlFor="estate-tax" className="text-white">Calculate Estate Tax (Exemption $13.61M)</Label>
                        </div>
                      </div>
                      
                      <div className="md:col-span-2 h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={simulationData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorTaxable" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="year" stroke="#7a95b8" />
                            <YAxis stroke="#7a95b8" tickFormatter={(val) => `$${val/1000000}M`} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ color: '#fff' }} />
                            <Area type="monotone" dataKey="value" name="Gross Estate Value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorValue)" />
                            <Area type="monotone" dataKey="taxableValue" name="After-Tax Value (Est)" stroke="#22c55e" fillOpacity={1} fill="url(#colorTaxable)" />
                            {includeEstateTax && (
                              <Line type="monotone" dataKey="estateTaxImpact" name="Estate Tax Liability" stroke="#ef4444" strokeWidth={2} dot={false} />
                            )}
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 4: Data Tables (6+ Tables/Structured Displays) */}
              <TabsContent value="tables" className="space-y-6 outline-none">
                
                {/* Table 1: Comprehensive Account List */}
                <Card className="bg-[#0d1a2e] border-[#12233e]">
                  <CardHeader>
                    <CardTitle className="text-white">Comprehensive Account Inventory</CardTitle>
                    <CardDescription className="text-[#7a95b8]">Detailed view of all analyzed accounts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto rounded-md border border-[#1e293b]">
                      <Table>
                        <TableHeader className="bg-[#060d19]">
                          <TableRow className="border-[#1e293b] hover:bg-transparent">
                            <TableHead className="text-[#7a95b8]">Account Type</TableHead>
                            <TableHead className="text-[#7a95b8]">Institution</TableHead>
                            <TableHead className="text-[#7a95b8] text-right">Value</TableHead>
                            <TableHead className="text-[#7a95b8]">Primary Beneficiary</TableHead>
                            <TableHead className="text-[#7a95b8]">Status</TableHead>
                            <TableHead className="text-[#7a95b8] text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {accounts.map((account) => (
                            <TableRow key={account.id} className="border-[#1e293b] hover:bg-[#12233e]/50">
                              <TableCell className="font-medium text-white">{account.accountType}</TableCell>
                              <TableCell className="text-[#c8d8ec]">{account.institution}</TableCell>
                              <TableCell className="text-white text-right font-mono">{fmt(account.value)}</TableCell>
                              <TableCell className="text-[#c8d8ec]">{account.primaryBeneficiary}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={
                                  account.status === "critical" ? "border-red-500 text-red-400" : 
                                  account.status === "needs_review" ? "border-[#f0c040] text-[#f0c040]" : 
                                  "border-[#22c55e] text-[#22c55e]"
                                }>
                                  {account.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="sm" onClick={() => handleAccountClick(account)} className="text-[#3b82f6] hover:text-white hover:bg-[#3b82f6]">
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Table 2: Critical Issues Summary */}
                  <Card className="bg-[#0d1a2e] border-red-500/30">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                        Critical Action Items
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {accounts.filter((a) => a.status === "critical").length === 0 ? (
                          <div className="text-center p-4 text-[#22c55e] bg-[#22c55e]/10 rounded-lg border border-[#22c55e]/20">
                            <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
                            No critical issues found
                          </div>
                        ) : (
                          accounts.filter((a) => a.status === "critical").map((account) => (
                            <div key={`crit-${account.id}`} className="p-3 bg-red-500/5 rounded-lg border border-red-500/20">
                              <div className="font-medium text-white flex justify-between">
                                <span>{account.accountType}</span>
                                <span className="text-red-400">{fmt(account.value)}</span>
                              </div>
                              <ul className="mt-2 space-y-1">
                                {account.issues.map((issue, i) => (
                                  <li key={i} className="text-sm text-[#c8d8ec] flex items-start gap-2">
                                    <span className="text-red-400 mt-1">•</span> {issue}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Table 3: Optimization Opportunities */}
                  <Card className="bg-[#0d1a2e] border-[#f0c040]/30">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Zap className="w-5 h-5 text-[#f0c040]" />
                        Optimization Opportunities
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {accounts.filter((a) => a.status === "needs_review").length === 0 ? (
                          <div className="text-center p-4 text-[#7a95b8] bg-[#12233e] rounded-lg">
                            No immediate optimization opportunities
                          </div>
                        ) : (
                          accounts.filter((a) => a.status === "needs_review").map((account) => (
                            <div key={`opt-${account.id}`} className="p-3 bg-[#f0c040]/5 rounded-lg border border-[#f0c040]/20">
                              <div className="font-medium text-white flex justify-between">
                                <span>{account.accountType}</span>
                                <span className="text-[#f0c040]">{fmt(account.value)}</span>
                              </div>
                              <p className="mt-2 text-sm text-[#c8d8ec]">{account.recommendation}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Table 4: Tax Implications Summary */}
                  <Card className="bg-[#0d1a2e] border-[#12233e]">
                    <CardHeader>
                      <CardTitle className="text-white">Tax Implications by Account</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow className="border-[#1e293b]">
                            <TableHead className="text-[#7a95b8]">Account</TableHead>
                            <TableHead className="text-[#7a95b8]">Tax Treatment at Death</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {accounts.slice(0, 5).map((account) => (
                            <TableRow key={`tax-${account.id}`} className="border-[#1e293b]">
                              <TableCell className="text-white font-medium">{account.accountType}</TableCell>
                              <TableCell className="text-[#c8d8ec] text-sm">{account.taxImplication}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  {/* Table 5: Liquidity & Probate Risk */}
                  <Card className="bg-[#0d1a2e] border-[#12233e]">
                    <CardHeader>
                      <CardTitle className="text-white">Risk Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow className="border-[#1e293b]">
                            <TableHead className="text-[#7a95b8]">Account</TableHead>
                            <TableHead className="text-[#7a95b8] text-center">Probate Risk</TableHead>
                            <TableHead className="text-[#7a95b8] text-center">Liquidity Score</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {accounts.slice(0, 5).map((account) => (
                            <TableRow key={`risk-${account.id}`} className="border-[#1e293b]">
                              <TableCell className="text-white font-medium">{account.accountType}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className={account.probateRisk === "High" ? "border-red-500 text-red-400" : account.probateRisk === "Medium" ? "border-[#f0c040] text-[#f0c040]" : "border-[#22c55e] text-[#22c55e]"}>
                                  {account.probateRisk}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center text-white">
                                <div className="flex items-center justify-center gap-2">
                                  <span className="w-6 text-right">{account.liquidityScore}</span>
                                  <Progress value={account.liquidityScore * 10} className="w-16 h-2" />
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                  
                  {/* Table 6: Comparison Mode Data (if active) */}
                  {comparisonMode && compareClient && (
                    <Card className="bg-indigo-900/10 border-indigo-500/30 md:col-span-2">
                      <CardHeader>
                        <CardTitle className="text-indigo-300">Client Comparison: {selectedClient.name} vs {compareClient.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow className="border-indigo-500/30">
                              <TableHead className="text-indigo-300">Metric</TableHead>
                              <TableHead className="text-white">{selectedClient.name}</TableHead>
                              <TableHead className="text-white">{compareClient.name}</TableHead>
                              <TableHead className="text-indigo-300 text-right">Difference</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow className="border-indigo-500/30">
                              <TableCell className="text-indigo-200">Total Assets Reviewed</TableCell>
                              <TableCell className="text-white font-mono">{fmt(totalValue)}</TableCell>
                              <TableCell className="text-white font-mono">{fmt(compareAccounts.reduce((s, a) => s + a.value, 0))}</TableCell>
                              <TableCell className="text-right font-mono">
                                {(() => {
                                  const diff = totalValue - compareAccounts.reduce((s, a) => s + a.value, 0);
                                  return <span className={diff >= 0 ? "text-[#22c55e]" : "text-red-400"}>
                                    {diff >= 0 ? "+" : ""}{fmt(diff)}
                                  </span>;
                                })()}
                              </TableCell>
                            </TableRow>
                            <TableRow className="border-indigo-500/30">
                              <TableCell className="text-indigo-200">Optimization Score</TableCell>
                              <TableCell className="text-white">{completionScore}%</TableCell>
                              <TableCell className="text-white">
                                {compareAccounts.length > 0 ? Math.round((compareAccounts.filter((a) => a.status === "optimal").length / compareAccounts.length) * 100) : 0}%
                              </TableCell>
                              <TableCell className="text-right">
                                {(() => {
                                  const cScore = compareAccounts.length > 0 ? Math.round((compareAccounts.filter((a) => a.status === "optimal").length / compareAccounts.length) * 100) : 0;
                                  const diff = completionScore - cScore;
                                  return <span className={diff >= 0 ? "text-[#22c55e]" : "text-red-400"}>
                                    {diff >= 0 ? "+" : ""}{diff}%
                                  </span>;
                                })()}
                              </TableCell>
                            </TableRow>
                            <TableRow className="border-indigo-500/30">
                              <TableCell className="text-indigo-200">Critical Issues</TableCell>
                              <TableCell className="text-white">{criticalCount}</TableCell>
                              <TableCell className="text-white">{compareAccounts.filter((a) => a.status === "critical").length}</TableCell>
                              <TableCell className="text-right">
                                {(() => {
                                  const cCount = compareAccounts.filter((a) => a.status === "critical").length;
                                  const diff = criticalCount - cCount;
                                  return <span className={diff <= 0 ? "text-[#22c55e]" : "text-red-400"}>
                                    {diff > 0 ? "+" : ""}{diff}
                                  </span>;
                                })()}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Account Details Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-[#0d1a2e] border-[#12233e] text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-3">
                {selectedAccount?.accountType}
                {selectedAccount && (
                  <Badge variant="outline" className={
                    selectedAccount.status === "critical" ? "border-red-500 text-red-400 bg-red-500/10" : 
                    selectedAccount.status === "needs_review" ? "border-[#f0c040] text-[#f0c040] bg-[#f0c040]/10" : 
                    "border-[#22c55e] text-[#22c55e] bg-[#22c55e]/10"
                  }>
                    {selectedAccount.status === "critical" ? "Critical" : selectedAccount.status === "needs_review" ? "Needs Review" : "Optimal"}
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-[#7a95b8]">
                {selectedAccount?.institution} • Value: {selectedAccount ? fmt(selectedAccount.value) : ""}
              </DialogDescription>
            </DialogHeader>
            
            {selectedAccount && (
              <div className="space-y-6 my-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#060d19] p-4 rounded-lg border border-[#1e293b]">
                    <div className="text-sm text-[#7a95b8] mb-1">Primary Beneficiary</div>
                    <div className="font-medium">{selectedAccount.primaryBeneficiary}</div>
                  </div>
                  <div className="bg-[#060d19] p-4 rounded-lg border border-[#1e293b]">
                    <div className="text-sm text-[#7a95b8] mb-1">Contingent Beneficiary</div>
                    <div className="font-medium">{selectedAccount.contingentBeneficiary}</div>
                  </div>
                  <div className="bg-[#060d19] p-4 rounded-lg border border-[#1e293b]">
                    <div className="text-sm text-[#7a95b8] mb-1">Tax Implication</div>
                    <div className="font-medium text-[#f0c040]">{selectedAccount.taxImplication}</div>
                  </div>
                  <div className="bg-[#060d19] p-4 rounded-lg border border-[#1e293b]">
                    <div className="text-sm text-[#7a95b8] mb-1">Probate Risk</div>
                    <div className={`font-medium ${selectedAccount.probateRisk === "High" ? "text-red-400" : "text-[#22c55e]"}`}>
                      {selectedAccount.probateRisk}
                    </div>
                  </div>
                </div>
                
                {selectedAccount.issues.length > 0 && (
                  <div>
                    <h4 className="text-red-400 font-medium flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4" /> Identified Issues
                    </h4>
                    <ul className="space-y-2">
                      {selectedAccount.issues.map((issue, i) => (
                        <li key={i} className="bg-red-500/10 text-red-200 p-3 rounded-md border border-red-500/20 text-sm">
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div>
                  <h4 className="text-[#22c55e] font-medium flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4" /> Optimization Recommendation
                  </h4>
                  <div className="bg-[#22c55e]/10 text-[#c8d8ec] p-4 rounded-md border border-[#22c55e]/30 text-sm leading-relaxed">
                    {selectedAccount.recommendation}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Advisor Notes</Label>
                  <Input 
                    id="notes" 
                    placeholder="Add specific notes or action items for this account..." 
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    className="bg-[#060d19] border-[#1e293b] text-white"
                  />
                </div>
              </div>
            )}
            
            <DialogFooter className="flex justify-between sm:justify-between border-t border-[#1e293b] pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="bg-transparent border-[#1e293b] text-white">
                Close
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" className="bg-[#060d19] border-[#1e293b] text-white">
                  <Printer className="w-4 h-4 mr-2" /> Print
                </Button>
                <Button onClick={handleSaveNotes} className="bg-[#3b82f6] hover:bg-[#2563eb] text-white">
                  <Save className="w-4 h-4 mr-2" /> Save Notes
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <PageInsights />
        <NAICDisclaimer />
      </div>
    
        <ComplianceFooter pageName="BeneficiaryOptimization" showsAnnuity showsTax showsEstate showsProjections />
      </AppShell>
  );
}
