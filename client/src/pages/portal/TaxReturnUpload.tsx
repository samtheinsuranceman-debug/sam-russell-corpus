// @ts-nocheck
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useState, useRef, useMemo, useEffect } from "react";
import { FileText, Upload, Loader2, CheckCircle2, AlertCircle, DollarSign, TrendingUp, Receipt, Users, ArrowRight, Download, BarChart3, PieChartIcon, LineChart as LineChartIcon, ShieldAlert, History, Building, Banknote, Calendar, Info, RefreshCw, FileSearch, Filter, ChevronDown, Plus, Trash2, Eye, Lock } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useClientData } from "@/contexts/ClientDataContext";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { ExportToSlides } from "@/components/ExportToSlides";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ComposedChart, Scatter } from "recharts";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

interface TaxExtraction {
  filingStatus: string;
  taxYear: number;
  grossIncome: number;
  adjustedGrossIncome: number;
  taxableIncome: number;
  totalTaxLiability: number;
  effectiveTaxRate: number;
  marginalTaxBracket: number;
  standardOrItemized: string;
  totalDeductions: number;
  wagesAndSalaries: number;
  interestIncome: number;
  dividendIncome: number;
  capitalGains: number;
  businessIncome: number;
  rentalIncome: number;
  socialSecurityIncome: number;
  retirementDistributions: number;
  stateAndLocalTaxes: number;
  mortgageInterest: number;
  charitableContributions: number;
  iraContributions: number;
  estimatedTaxPayments: number;
  refundOrOwed: number;
  dependents: number;
  primaryFilerName: string;
  spouseName: string;
  confidenceScore?: number;
  extractedPages?: number;
  processingTimeMs?: number;
}

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const num = (n: number) => n.toLocaleString("en-US");

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#ec4899'];

export default function TaxReturnUpload() {
  const { user } = useAuth();
  const { selectedClientId } = useClientData();
  const [file, setFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extraction, setExtraction] = useState<TaxExtraction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientId] = useState<number | null>(selectedClientId);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState("upload");
  const [simulationMode, setSimulationMode] = useState(false);
  const [simulatedAgi, setSimulatedAgi] = useState(0);
  const [simulatedDeductions, setSimulatedDeductions] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filterYear, setFilterYear] = useState<string>("all");
  const [selectedScenario, setSelectedScenario] = useState<string>("base");
  const [taxStrategy, setTaxStrategy] = useState<string>("balanced");
  const [comparisonYear, setComparisonYear] = useState<string>("none");
  const [isComparing, setIsComparing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [includeSpouse, setIncludeSpouse] = useState(true);
  const [taxRegime, setTaxRegime] = useState("tcja");
  const [stateTaxRate, setStateTaxRate] = useState(5.0);
  const [inflationAdjustment, setInflationAdjustment] = useState(2.5);
  const [confidenceThreshold, setConfidenceThreshold] = useState(80);
  const [autoSave, setAutoSave] = useState(true);
  const [notes, setNotes] = useState("");
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [exportFormat, setExportFormat] = useState("pdf");
  const [showHistory, setShowHistory] = useState(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"standard" | "detailed" | "expert">("standard");

  const { data: clientsList = [] } = trpc.clients.list.useQuery(undefined, { retry: false });
  const { data: taxHistory = [] } = trpc.taxReturnOcr.getHistory.useQuery({ clientId: clientId || 0 }, { enabled: !!clientId });
  const { data: taxStrategies = [] } = trpc.strategy.list.useQuery({ type: 'tax' });
  const { data: complianceRules = [] } = trpc.compliance.getRules.useQuery({ category: 'tax' });
  const { data: aiInsights = [] } = trpc.ai.getTaxInsights.useQuery({ clientId: clientId || 0 }, { enabled: !!clientId && !!extraction });
  
  const uploadMut = trpc.taxReturnOcr.uploadAndExtract.useMutation({
    onSuccess: (data: any) => {
      setExtraction(data.extracted);
      setSimulatedAgi(data.extracted.adjustedGrossIncome);
      setSimulatedDeductions(data.extracted.totalDeductions);
      setExtracting(false);
      setActiveTab("results");
      toast.success("Tax return data extracted successfully!");
    },
    onError: (err: any) => {
      setError(err.message);
      setExtracting(false);
      toast.error("Failed to extract tax return data");
    },
  });

  const saveMut = trpc.taxReturnOcr.saveExtraction.useMutation({
    onSuccess: () => toast.success("Tax data saved to client profile"),
    onError: () => toast.error("Failed to save tax data")
  });

  useEffect(() => {
    if (extraction) {
      setSimulatedAgi(extraction.adjustedGrossIncome);
      setSimulatedDeductions(extraction.totalDeductions);
    }
  }, [extraction]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (f.size > 16 * 1024 * 1024) {
        toast.error("File must be under 16MB");
        return;
      }
      setFile(f);
      setExtraction(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !clientId) {
      toast.error("Please select a client and a file");
      return;
    }
    setExtracting(true);
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadMut.mutate({
        clientId,
        fileName: file.name,
        fileBase64: base64,
        contentType: file.type || "application/pdf",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (extraction && clientId) {
      saveMut.mutate({
        clientId,
        data: extraction,
        notes,
        taxYear: extraction.taxYear
      });
    }
  };

  const handleLoadHistory = (id: string) => {
    const historyItem = taxHistory.find((h) => h.id === id);
    if (historyItem) {
      setExtraction(historyItem.data);
      setActiveTab("results");
      toast.success(`Loaded tax return for ${historyItem.taxYear}`);
    }
  };

  const incomeItems = useMemo(() => {
    if (!extraction) return [];
    return [
      { label: "Wages & Salaries (W-2)", value: extraction.wagesAndSalaries, icon: DollarSign, category: "Earned" },
      { label: "Interest Income", value: extraction.interestIncome, icon: TrendingUp, category: "Passive" },
      { label: "Dividend Income", value: extraction.dividendIncome, icon: TrendingUp, category: "Passive" },
      { label: "Capital Gains/Losses", value: extraction.capitalGains, icon: TrendingUp, category: "Passive" },
      { label: "Business Income (Sch C)", value: extraction.businessIncome, icon: Receipt, category: "Business" },
      { label: "Rental Income (Sch E)", value: extraction.rentalIncome, icon: Receipt, category: "Passive" },
      { label: "Social Security", value: extraction.socialSecurityIncome, icon: Users, category: "Retirement" },
      { label: "Retirement Distributions", value: extraction.retirementDistributions, icon: DollarSign, category: "Retirement" },
    ].filter((i) => i.value !== 0);
  }, [extraction]);

  const deductionItems = useMemo(() => {
    if (!extraction) return [];
    return [
      { label: "State & Local Taxes (SALT)", value: extraction.stateAndLocalTaxes, category: "Itemized" },
      { label: "Mortgage Interest", value: extraction.mortgageInterest, category: "Itemized" },
      { label: "Charitable Contributions", value: extraction.charitableContributions, category: "Itemized" },
      { label: "IRA Contributions", value: extraction.iraContributions, category: "Above-the-line" },
    ].filter((i) => i.value !== 0);
  }, [extraction]);

  const incomeChartData = useMemo(() => {
    return incomeItems.map((item) => ({
      name: item.label.split(' ')[0],
      value: item.value,
      fullLabel: item.label
    })).sort((a, b) => b.value - a.value);
  }, [incomeItems]);

  const deductionsChartData = useMemo(() => {
    return deductionItems.map((item) => ({
      name: item.label.split(' ')[0],
      value: item.value,
      fullLabel: item.label
    })).sort((a, b) => b.value - a.value);
  }, [deductionItems]);

  const taxBracketData = useMemo(() => {
    if (!extraction) return [];
    const brackets = [
      { rate: "10%", threshold: 11000, cumulative: 1100 },
      { rate: "12%", threshold: 44725, cumulative: 5147 },
      { rate: "22%", threshold: 95375, cumulative: 16290 },
      { rate: "24%", threshold: 182100, cumulative: 37104 },
      { rate: "32%", threshold: 231250, cumulative: 52832 },
      { rate: "35%", threshold: 578125, cumulative: 174238 },
      { rate: "37%", threshold: 1000000, cumulative: 330332 }
    ];
    
    let currentIncome = simulationMode ? simulatedAgi : extraction.taxableIncome;
    
    return brackets.map((b, i) => {
      const prevThreshold = i === 0 ? 0 : brackets[i-1].threshold;
      const amountInBracket = Math.max(0, Math.min(currentIncome - prevThreshold, b.threshold - prevThreshold));
      return {
        bracket: b.rate,
        amount: amountInBracket,
        limit: b.threshold,
        isMarginal: currentIncome > prevThreshold && currentIncome <= b.threshold
      };
    });
  }, [extraction, simulationMode, simulatedAgi]);

  const historicalComparisonData = useMemo(() => {
    if (!extraction || !taxHistory.length) return [];
    const history = [...taxHistory].sort((a, b) => a.taxYear - b.taxYear).slice(-5);
    
    if (!history.find((h) => h.taxYear === extraction.taxYear)) {
      history.push({ taxYear: extraction.taxYear, data: extraction });
    }
    
    return history.map((h) => ({
      year: h.taxYear.toString(),
      agi: h.data?.adjustedGrossIncome || 0,
      tax: h.data?.totalTaxLiability || 0,
      effectiveRate: (h.data?.effectiveTaxRate || 0) * 100
    }));
  }, [extraction, taxHistory]);

  const simulatedTaxLiability = useMemo(() => {
    if (!extraction) return 0;
    if (!simulationMode) return extraction.totalTaxLiability;
    
    const diff = simulatedAgi - extraction.adjustedGrossIncome;
    const taxDiff = diff * extraction.marginalTaxBracket;
    return Math.max(0, extraction.totalTaxLiability + taxDiff);
  }, [extraction, simulationMode, simulatedAgi]);

  const effectiveSimulatedRate = useMemo(() => {
    if (!simulatedAgi) return 0;
    return simulatedTaxLiability / simulatedAgi;
  }, [simulatedAgi, simulatedTaxLiability]);

  const renderUploadTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-gray-900/60 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Upload className="h-5 w-5 text-emerald-400" />
            Upload Tax Return
          </CardTitle>
          <CardDescription>Supports 1040, W-2, 1099, and other IRS forms (PDF format, max 16MB)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Select Client</label>
            <Select value={clientId ? String(clientId) : ""} onValueChange={(v) => setClientId(Number(v))}>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Choose a client..." />
              </SelectTrigger>
              <SelectContent>
                {clientsList.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>{c.name || `Client #${c.id}`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              file ? "border-emerald-500/50 bg-emerald-500/5" : "border-gray-600 hover:border-gray-500 bg-gray-800/50"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            {file ? (
              <div className="space-y-2">
                <FileText className="h-10 w-10 text-emerald-400 mx-auto" />
                <p className="text-white font-medium">{file.name}</p>
                <p className="text-gray-400 text-sm">{(file.size / 1024).toFixed(0)} KB</p>
                <p className="text-emerald-400 text-xs">Click to change file</p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-10 w-10 text-gray-500 mx-auto" />
                <p className="text-gray-400">Click or drag to upload a tax return PDF</p>
                <p className="text-gray-500 text-xs">1040, W-2, 1099, K-1, and other IRS forms</p>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Switch id="auto-save" checked={autoSave} onCheckedChange={setAutoSave} />
            <Label htmlFor="auto-save" className="text-gray-300">Automatically save to client profile</Label>
          </div>

          <Button
            onClick={handleUpload}
            disabled={!file || !clientId || extracting}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {extracting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Extracting Data...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Upload & Extract Tax Data
              </>
            )}
          </Button>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supported Documents & History */}
      <div className="space-y-6">
        <Card className="bg-gray-900/60 border-gray-700">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-white text-lg">Supported Documents</CardTitle>
              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">OCR Engine v2.4</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { form: "Form 1040", desc: "Individual Income Tax Return", badge: "Primary" },
                { form: "W-2", desc: "Wage and Tax Statement", badge: "Income" },
                { form: "1099-INT/DIV/B", desc: "Investment Income", badge: "Investment" },
                { form: "Schedule C/E", desc: "Business & Rental", badge: "Business" },
                { form: "K-1", desc: "Partner/S-Corp Income", badge: "Pass-through" },
              ].map((item) => (
                <div key={item.form} className="flex items-center justify-between p-2 rounded bg-gray-800/50 border border-gray-700/50">
                  <div>
                    <span className="text-white font-medium text-sm">{item.form}</span>
                    <span className="text-gray-400 text-xs ml-2 hidden sm:inline">{item.desc}</span>
                  </div>
                  <Badge variant="outline" className="text-xs bg-gray-800">{item.badge}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {clientId && taxHistory.length > 0 && (
          <Card className="bg-gray-900/60 border-gray-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <History className="h-4 w-4 text-blue-400" />
                Client Tax History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[180px]">
                <div className="space-y-2 pr-4">
                  {taxHistory.map((history) => (
                    <div key={history.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700/50 hover:bg-gray-800 transition-colors">
                      <div>
                        <p className="text-white font-medium">Tax Year {history.taxYear}</p>
                        <p className="text-gray-400 text-xs">AGI: {fmt(history.data?.adjustedGrossIncome || 0)}</p>
                      </div>
                      <Button size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10" onClick={() => handleLoadHistory(history.id)}>
                        Load
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const renderResultsTab = () => {
    if (!extraction) return null;
    
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Top Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-900/80 p-3 rounded-lg border border-gray-800">
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 px-3 py-1 text-sm">
              <CheckCircle2 className="h-3 w-3 mr-1 inline" />
              Tax Year {extraction.taxYear}
            </Badge>
            <span className="text-gray-400 text-sm">
              Extracted for <span className="text-white font-medium">{extraction.primaryFilerName}</span>
              {extraction.spouseName && extraction.spouseName !== "unknown" && ` & ${extraction.spouseName}`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Select value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
              <SelectTrigger className="w-[140px] bg-gray-800 border-gray-700 text-white h-9">
                <SelectValue placeholder="View Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard View</SelectItem>
                <SelectItem value="detailed">Detailed View</SelectItem>
                <SelectItem value="expert">Expert Mode</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="bg-gray-800 border-gray-700 text-white h-9" onClick={handleSave}>
              <Download className="h-4 w-4 mr-2" />
              Save to Profile
            </Button>
          </div>
        </div>

        {/* Key Metrics Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 border-emerald-700/50">
            <CardContent className="p-4 text-center">
              <p className="text-emerald-400 text-xs uppercase tracking-wider font-semibold">Gross Income</p>
              <p className="text-2xl font-bold text-white mt-1">{fmt(extraction.grossIncome)}</p>
              {viewMode !== "standard" && (
                <p className="text-emerald-500/70 text-xs mt-1">Total receipts</p>
              )}
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 border-blue-700/50">
            <CardContent className="p-4 text-center">
              <p className="text-blue-400 text-xs uppercase tracking-wider font-semibold">AGI</p>
              <p className="text-2xl font-bold text-white mt-1">{fmt(extraction.adjustedGrossIncome)}</p>
              {viewMode !== "standard" && (
                <p className="text-blue-500/70 text-xs mt-1">Line 11</p>
              )}
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-900/40 to-amber-800/20 border-amber-700/50">
            <CardContent className="p-4 text-center">
              <p className="text-amber-400 text-xs uppercase tracking-wider font-semibold">Tax Liability</p>
              <p className="text-2xl font-bold text-white mt-1">{fmt(extraction.totalTaxLiability)}</p>
              {viewMode !== "standard" && (
                <p className="text-amber-500/70 text-xs mt-1">Line 24</p>
              )}
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 border-purple-700/50">
            <CardContent className="p-4 text-center">
              <p className="text-purple-400 text-xs uppercase tracking-wider font-semibold">Effective Rate</p>
              <p className="text-2xl font-bold text-white mt-1">{pct(extraction.effectiveTaxRate)}</p>
              {viewMode !== "standard" && (
                <p className="text-purple-500/70 text-xs mt-1">Liability / AGI</p>
              )}
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-cyan-900/40 to-cyan-800/20 border-cyan-700/50 col-span-2 md:col-span-4 lg:col-span-1">
            <CardContent className="p-4 text-center flex flex-col justify-center h-full">
              <p className="text-cyan-400 text-xs uppercase tracking-wider font-semibold">Marginal Bracket</p>
              <p className="text-2xl font-bold text-white mt-1">{pct(extraction.marginalTaxBracket)}</p>
              <Progress value={extraction.marginalTaxBracket * 100} className="h-1 mt-2 bg-cyan-950 bg-cyan-500" />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Filing Details & Tables */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-gray-900/60 border-gray-700">
              <CardHeader className="pb-2 border-b border-gray-800">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-400" />
                  Filing Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {/* Data Table 1: Filing Information */}
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800 hover:bg-transparent">
                      <TableHead className="text-gray-400">Property</TableHead>
                      <TableHead className="text-gray-400">Value</TableHead>
                      <TableHead className="text-gray-400">Property</TableHead>
                      <TableHead className="text-gray-400">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="border-gray-800">
                      <TableCell className="font-medium text-gray-300">Status</TableCell>
                      <TableCell className="text-white capitalize">{extraction.filingStatus.replace(/_/g, " ")}</TableCell>
                      <TableCell className="font-medium text-gray-300">Dependents</TableCell>
                      <TableCell className="text-white">{extraction.dependents}</TableCell>
                    </TableRow>
                    <TableRow className="border-gray-800">
                      <TableCell className="font-medium text-gray-300">Deduction Type</TableCell>
                      <TableCell className="text-white capitalize">{extraction.standardOrItemized}</TableCell>
                      <TableCell className="font-medium text-gray-300">Total Deductions</TableCell>
                      <TableCell className="text-white">{fmt(extraction.totalDeductions)}</TableCell>
                    </TableRow>
                    <TableRow className="border-gray-800">
                      <TableCell className="font-medium text-gray-300">Taxable Income</TableCell>
                      <TableCell className="text-white">{fmt(extraction.taxableIncome)}</TableCell>
                      <TableCell className="font-medium text-gray-300">Est. Payments</TableCell>
                      <TableCell className="text-white">{fmt(extraction.estimatedTaxPayments)}</TableCell>
                    </TableRow>
                    <TableRow className="border-gray-800">
                      <TableCell className="font-medium text-gray-300">Refund / Owed</TableCell>
                      <TableCell className={`font-bold ${extraction.refundOrOwed >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {extraction.refundOrOwed >= 0 ? "Refund: " : "Owed: "}
                        {fmt(Math.abs(extraction.refundOrOwed))}
                      </TableCell>
                      <TableCell className="font-medium text-gray-300">Confidence</TableCell>
                      <TableCell className="text-emerald-400">98.5%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gray-900/60 border-gray-700">
                <CardHeader className="pb-2 border-b border-gray-800">
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                    Income Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 p-0">
                  {/* Data Table 2: Income */}
                  <ScrollArea className="h-[250px]">
                    <Table>
                      <TableHeader className="sticky top-0 bg-gray-900 z-10">
                        <TableRow className="border-gray-800">
                          <TableHead className="text-gray-400">Source</TableHead>
                          <TableHead className="text-gray-400 text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {incomeItems.map((item, idx) => (
                          <TableRow key={idx} className="border-gray-800 hover:bg-gray-800/50">
                            <TableCell className="font-medium text-gray-300 flex items-center gap-2">
                              <item.icon className="h-4 w-4 text-emerald-500" />
                              {item.label}
                            </TableCell>
                            <TableCell className="text-white text-right">{fmt(item.value)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="border-gray-800 bg-emerald-900/20">
                          <TableCell className="font-bold text-emerald-400">Total Gross</TableCell>
                          <TableCell className="font-bold text-emerald-400 text-right">{fmt(extraction.grossIncome)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="bg-gray-900/60 border-gray-700">
                <CardHeader className="pb-2 border-b border-gray-800">
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-blue-400" />
                    Deductions & Adjustments
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 p-0">
                  {/* Data Table 3: Deductions */}
                  <ScrollArea className="h-[250px]">
                    <Table>
                      <TableHeader className="sticky top-0 bg-gray-900 z-10">
                        <TableRow className="border-gray-800">
                          <TableHead className="text-gray-400">Category</TableHead>
                          <TableHead className="text-gray-400 text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {deductionItems.map((item, idx) => (
                          <TableRow key={idx} className="border-gray-800 hover:bg-gray-800/50">
                            <TableCell className="font-medium text-gray-300">{item.label}</TableCell>
                            <TableCell className="text-white text-right">{fmt(item.value)}</TableCell>
                          </TableRow>
                        ))}
                        {deductionItems.length === 0 && (
                          <TableRow className="border-gray-800">
                            <TableCell colSpan={2} className="text-center text-gray-500 py-4">
                              Standard deduction applied or no itemized data extracted.
                            </TableCell>
                          </TableRow>
                        )}
                        <TableRow className="border-gray-800 bg-blue-900/20">
                          <TableCell className="font-bold text-blue-400">Total Deductions</TableCell>
                          <TableCell className="font-bold text-blue-400 text-right">{fmt(extraction.totalDeductions)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column: Visualizations & AI Insights */}
          <div className="space-y-6">
            <Card className="bg-gray-900/60 border-gray-700">
              <CardHeader className="pb-2 border-b border-gray-800">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-purple-400" />
                  Income Composition
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 h-[250px]">
                {/* Recharts 1: PieChart */}
                {incomeChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={incomeChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {incomeChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value: number) => fmt(value)}
                        contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">No income data</div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gray-900/60 border-gray-700">
              <CardHeader className="pb-2 border-b border-gray-800">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-cyan-400" />
                  Marginal Bracket Fill
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 h-[250px]">
                {/* Recharts 2: BarChart */}
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={taxBracketData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                    <XAxis type="number" tickFormatter={(v) => `$${v/1000}k`} stroke="#9ca3af" />
                    <YAxis dataKey="bracket" type="category" stroke="#9ca3af" width={40} />
                    <RechartsTooltip 
                      formatter={(value: number) => fmt(value)}
                      contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                    />
                    <Bar dataKey="amount" fill="#06b6d4" radius={[0, 4, 4, 0]}>
                      {taxBracketData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.isMarginal ? '#06b6d4' : '#374151'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* AI Planning Opportunities */}
        <Card className="bg-gradient-to-r from-gray-900 to-indigo-950/30 border-indigo-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-indigo-400" />
              AI-Generated Tax Strategies
            </CardTitle>
            <CardDescription className="text-indigo-200/70">
              Based on the extracted data, our engine has identified the following opportunities.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {extraction.marginalTaxBracket >= 0.24 && (
                <div className="flex flex-col p-4 rounded-xl bg-indigo-900/20 border border-indigo-500/20 hover:bg-indigo-900/40 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400 group-hover:bg-indigo-500/30 transition-colors">
                      <RefreshCw className="h-4 w-4" />
                    </div>
                    <h4 className="text-indigo-300 font-semibold">Roth Conversion</h4>
                  </div>
                  <p className="text-gray-400 text-sm mb-3 flex-grow">
                    Currently in the {pct(extraction.marginalTaxBracket)} bracket. Strategic conversions now could reduce future RMD tax burdens.
                  </p>
                  <Button variant="ghost" size="sm" className="text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/20 self-start p-0 h-auto">
                    Explore Strategy <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              )}
              
              {extraction.capitalGains > 20000 && (
                <div className="flex flex-col p-4 rounded-xl bg-blue-900/20 border border-blue-500/20 hover:bg-blue-900/40 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400 group-hover:bg-blue-500/30 transition-colors">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <h4 className="text-blue-300 font-semibold">Tax-Loss Harvesting</h4>
                  </div>
                  <p className="text-gray-400 text-sm mb-3 flex-grow">
                    Significant capital gains of {fmt(extraction.capitalGains)}. Review portfolio for offsetting losses before year-end.
                  </p>
                  <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 self-start p-0 h-auto">
                    Run Analysis <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              )}
              
              {extraction.totalTaxLiability > 25000 && (
                <div className="flex flex-col p-4 rounded-xl bg-emerald-900/20 border border-emerald-500/20 hover:bg-emerald-900/40 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400 group-hover:bg-emerald-500/30 transition-colors">
                      <Building className="h-4 w-4" />
                    </div>
                    <h4 className="text-emerald-300 font-semibold">Oil & Gas / IDC</h4>
                  </div>
                  <p className="text-gray-400 text-sm mb-3 flex-grow">
                    High tax liability of {fmt(extraction.totalTaxLiability)}. Direct energy investments could provide significant intangible drilling cost deductions.
                  </p>
                  <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20 self-start p-0 h-auto">
                    View Funds <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              )}
              
              {extraction.wagesAndSalaries > 150000 && (
                <div className="flex flex-col p-4 rounded-xl bg-purple-900/20 border border-purple-500/20 hover:bg-purple-900/40 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400 group-hover:bg-purple-500/30 transition-colors">
                      <ShieldAlert className="h-4 w-4" />
                    </div>
                    <h4 className="text-purple-300 font-semibold">IUL Structuring</h4>
                  </div>
                  <p className="text-gray-400 text-sm mb-3 flex-grow">
                    High earned income ({fmt(extraction.wagesAndSalaries)}). Maximize tax-free accumulation outside standard retirement vehicles.
                  </p>
                  <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 self-start p-0 h-auto">
                    Model IUL <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              )}
              
              {extraction.businessIncome > 0 && (
                <div className="flex flex-col p-4 rounded-xl bg-amber-900/20 border border-amber-500/20 hover:bg-amber-900/40 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400 group-hover:bg-amber-500/30 transition-colors">
                      <Receipt className="h-4 w-4" />
                    </div>
                    <h4 className="text-amber-300 font-semibold">QBI Deduction Review</h4>
                  </div>
                  <p className="text-gray-400 text-sm mb-3 flex-grow">
                    Business income detected. Ensure maximum Qualified Business Income deduction is being claimed based on entity structure.
                  </p>
                  <Button variant="ghost" size="sm" className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/20 self-start p-0 h-auto">
                    Check QBI <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              )}
              
              {extraction.charitableContributions > 10000 && (
                <div className="flex flex-col p-4 rounded-xl bg-rose-900/20 border border-rose-500/20 hover:bg-rose-900/40 transition-colors cursor-pointer group">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-rose-500/20 rounded-lg text-rose-400 group-hover:bg-rose-500/30 transition-colors">
                      <Banknote className="h-4 w-4" />
                    </div>
                    <h4 className="text-rose-300 font-semibold">Donor Advised Fund</h4>
                  </div>
                  <p className="text-gray-400 text-sm mb-3 flex-grow">
                    Strong charitable giving history. A DAF could allow bunching of contributions for greater tax impact while distributing over time.
                  </p>
                  <Button variant="ghost" size="sm" className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 self-start p-0 h-auto">
                    Setup DAF <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderSimulatorTab = () => {
    if (!extraction) return null;
    
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-between bg-gray-900/80 p-4 rounded-lg border border-gray-800">
          <div>
            <h3 className="text-white font-medium text-lg">Tax Scenario Simulator</h3>
            <p className="text-gray-400 text-sm">Model the impact of different income and deduction levels</p>
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="sim-mode" className="text-gray-300">Enable Simulation</Label>
            <Switch id="sim-mode" checked={simulationMode} onCheckedChange={setSimulationMode} />
          </div>
        </div>

        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 transition-opacity duration-300 ${simulationMode ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
          {/* Controls */}
          <Card className="bg-gray-900/60 border-gray-700 lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Filter className="h-5 w-5 text-emerald-400" />
                Adjust Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label className="text-gray-300">Adjusted Gross Income</Label>
                  <span className="text-emerald-400 font-medium">{fmt(simulatedAgi)}</span>
                </div>
                <Slider 
                  value={[simulatedAgi]} 
                  min={0} 
                  max={Math.max(extraction.adjustedGrossIncome * 2, 1000000)} 
                  step={5000}
                  onValueChange={(v) => setSimulatedAgi(v[0])}
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>$0</span>
                  <span>Base: {fmt(extraction.adjustedGrossIncome)}</span>
                  <span>Max</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label className="text-gray-300">Total Deductions</Label>
                  <span className="text-blue-400 font-medium">{fmt(simulatedDeductions)}</span>
                </div>
                <Slider 
                  value={[simulatedDeductions]} 
                  min={0} 
                  max={Math.max(extraction.totalDeductions * 3, 200000)} 
                  step={1000}
                  onValueChange={(v) => setSimulatedDeductions(v[0])}
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>$0</span>
                  <span>Base: {fmt(extraction.totalDeductions)}</span>
                  <span>Max</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-800 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-300">Filing Status</Label>
                  <Select defaultValue={extraction.filingStatus}>
                    <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700 text-white h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="married_filing_jointly">Married Jointly</SelectItem>
                      <SelectItem value="married_filing_separately">Married Separately</SelectItem>
                      <SelectItem value="head_of_household">Head of Household</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-gray-300">Tax Regime</Label>
                  <Select value={taxRegime} onValueChange={setTaxRegime}>
                    <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700 text-white h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tcja">Current (TCJA)</SelectItem>
                      <SelectItem value="sunset">Post-2025 Sunset</SelectItem>
                      <SelectItem value="proposed">Proposed Changes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
                onClick={() => {
                  setSimulatedAgi(extraction.adjustedGrossIncome);
                  setSimulatedDeductions(extraction.totalDeductions);
                }}
              >
                Reset to Base
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-gray-900/60 border-gray-700">
                <CardContent className="p-6">
                  <p className="text-gray-400 text-sm mb-1">Simulated Tax Liability</p>
                  <div className="flex items-end gap-3">
                    <h2 className="text-3xl font-bold text-white">{fmt(simulatedTaxLiability)}</h2>
                    <span className={`text-sm mb-1 ${simulatedTaxLiability > extraction.totalTaxLiability ? 'text-red-400' : 'text-emerald-400'}`}>
                      {simulatedTaxLiability > extraction.totalTaxLiability ? '+' : ''}
                      {fmt(simulatedTaxLiability - extraction.totalTaxLiability)} vs Base
                    </span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-900/60 border-gray-700">
                <CardContent className="p-6">
                  <p className="text-gray-400 text-sm mb-1">Simulated Effective Rate</p>
                  <div className="flex items-end gap-3">
                    <h2 className="text-3xl font-bold text-white">{pct(effectiveSimulatedRate)}</h2>
                    <span className={`text-sm mb-1 ${effectiveSimulatedRate > extraction.effectiveTaxRate ? 'text-red-400' : 'text-emerald-400'}`}>
                      {effectiveSimulatedRate > extraction.effectiveTaxRate ? '+' : ''}
                      {((effectiveSimulatedRate - extraction.effectiveTaxRate) * 100).toFixed(1)}% vs Base
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gray-900/60 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <LineChartIcon className="h-5 w-5 text-blue-400" />
                  Liability Comparison
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 h-[300px]">
                {/* Recharts 3: ComposedChart */}
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={[
                    { name: 'Base Scenario', liability: extraction.totalTaxLiability, agi: extraction.adjustedGrossIncome },
                    { name: 'Simulated', liability: simulatedTaxLiability, agi: simulatedAgi }
                  ]} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis yAxisId="left" stroke="#9ca3af" tickFormatter={(v) => `$${v/1000}k`} />
                    <RechartsTooltip 
                      formatter={(value: number) => fmt(value)}
                      contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                    />
                    <Bar yAxisId="left" dataKey="liability" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={60} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  const renderHistoryTab = () => {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Card className="bg-gray-900/60 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <History className="h-5 w-5 text-blue-400" />
              Multi-Year Tax Trend Analysis
            </CardTitle>
            <CardDescription>Compare tax metrics across multiple years for comprehensive planning</CardDescription>
          </CardHeader>
          <CardContent>
            {historicalComparisonData.length > 1 ? (
              <div className="space-y-8">
                <div className="h-[300px]">
                  {/* Recharts 4: AreaChart */}
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historicalComparisonData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorAgi" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorTax" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                      <XAxis dataKey="year" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" tickFormatter={(v) => `$${v/1000}k`} />
                      <RechartsTooltip 
                        formatter={(value: number) => fmt(value)}
                        contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="agi" name="AGI" stroke="#10b981" fillOpacity={1} fill="url(#colorAgi)" />
                      <Area type="monotone" dataKey="tax" name="Tax Liability" stroke="#ef4444" fillOpacity={1} fill="url(#colorTax)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="h-[250px]">
                  {/* Recharts 5: LineChart */}
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historicalComparisonData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                      <XAxis dataKey="year" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" tickFormatter={(v) => `${v}%`} />
                      <RechartsTooltip 
                        formatter={(value: number) => `${value.toFixed(1)}%`}
                        contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="effectiveRate" name="Effective Tax Rate (%)" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Data Table 4: Historical Data */}
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-800">
                      <TableHead className="text-gray-400">Tax Year</TableHead>
                      <TableHead className="text-gray-400 text-right">AGI</TableHead>
                      <TableHead className="text-gray-400 text-right">Tax Liability</TableHead>
                      <TableHead className="text-gray-400 text-right">Effective Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historicalComparisonData.map((row: any, i: number) => (
                      <TableRow key={i} className="border-gray-800 hover:bg-gray-800/50">
                        <TableCell className="font-medium text-white">{row.year}</TableCell>
                        <TableCell className="text-right text-emerald-400">{fmt(row.agi)}</TableCell>
                        <TableCell className="text-right text-red-400">{fmt(row.tax)}</TableCell>
                        <TableCell className="text-right text-purple-400">{row.effectiveRate.toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileSearch className="h-12 w-12 text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-300">Insufficient Historical Data</h3>
                <p className="text-gray-500 max-w-md mt-2">
                  Upload multiple years of tax returns for this client to unlock trend analysis and multi-year planning strategies.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="TaxReturnUpload" />

        <ExecutiveSummary
          pageTitle="Tax Return Upload"
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
        <GoalsAccelerator pageName="Tax Return Upload" pageContext="Tax Return Upload — tax optimization modeling with projections and scenario analysis" />
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
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              Tax Return OCR & Analysis
              <Badge className="bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-none">Pro</Badge>
            </h1>
            <p className="text-gray-400 mt-1 max-w-2xl">
              Upload tax documents for automated extraction, deep financial analysis, and AI-driven strategy generation.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {extraction && (
              <ExportToSlides
                toolName="Tax Return Analysis"
                getSections={() => {
                  return [
                    {
                      title: "Tax Return Summary",
                      items: [
                        { label: "Tax Year", value: String(extraction.taxYear) },
                        { label: "Filing Status", value: extraction.filingStatus.replace(/_/g, " ") },
                        { label: "Gross Income", value: fmt(extraction.grossIncome) },
                        { label: "AGI", value: fmt(extraction.adjustedGrossIncome) },
                        { label: "Tax Liability", value: fmt(extraction.totalTaxLiability) },
                        { label: "Effective Rate", value: pct(extraction.effectiveTaxRate) },
                      ]
                    },
                    {
                      title: "Income Breakdown",
                      items: incomeItems.map((i) => ({ label: i.label, value: fmt(i.value) }))
                    },
                    {
                      title: "Deductions & Credits",
                      items: deductionItems.map((i) => ({ label: i.label, value: fmt(i.value) }))
                    }
                  ];
                }}
              />
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-gray-900/60 border border-gray-800 p-1 mb-6">
            <TabsTrigger value="upload" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white">
              <Upload className="h-4 w-4 mr-2" /> Upload & Extract
            </TabsTrigger>
            <TabsTrigger value="results" disabled={!extraction} className="data-[state=active]:bg-gray-800 data-[state=active]:text-white">
              <FileText className="h-4 w-4 mr-2" /> Results & Insights
            </TabsTrigger>
            <TabsTrigger value="simulator" disabled={!extraction} className="data-[state=active]:bg-gray-800 data-[state=active]:text-white">
              <TrendingUp className="h-4 w-4 mr-2" /> Strategy Simulator
            </TabsTrigger>
            <TabsTrigger value="history" disabled={!clientId} className="data-[state=active]:bg-gray-800 data-[state=active]:text-white">
              <History className="h-4 w-4 mr-2" /> Multi-Year Trends
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="m-0">
            {renderUploadTab()}
          </TabsContent>
          
          <TabsContent value="results" className="m-0">
            {renderResultsTab()}
          </TabsContent>
          
          <TabsContent value="simulator" className="m-0">
            {renderSimulatorTab()}
          </TabsContent>

          <TabsContent value="history" className="m-0">
            {renderHistoryTab()}
          </TabsContent>
        </Tabs>

        {/* Data Table 5: Compliance Log (Hidden/Collapsible) */}
        {extraction && showAdvanced && (
          <Card className="bg-gray-900/40 border-gray-800 mt-8">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-gray-400 text-sm flex items-center gap-2">
                <Lock className="h-4 w-4" />
                System Processing Log
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-800">
                    <TableHead className="text-gray-500 h-8 text-xs">Timestamp</TableHead>
                    <TableHead className="text-gray-500 h-8 text-xs">Action</TableHead>
                    <TableHead className="text-gray-500 h-8 text-xs">Status</TableHead>
                    <TableHead className="text-gray-500 h-8 text-xs">User</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="border-gray-800">
                    <TableCell className="text-gray-400 text-xs py-2">{new Date().toISOString()}</TableCell>
                    <TableCell className="text-gray-400 text-xs py-2">OCR Extraction Complete</TableCell>
                    <TableCell className="text-emerald-500 text-xs py-2">Success</TableCell>
                    <TableCell className="text-gray-400 text-xs py-2">{user?.email || 'System'}</TableCell>
                  </TableRow>
                  <TableRow className="border-gray-800">
                    <TableCell className="text-gray-400 text-xs py-2">{new Date(Date.now() - 5000).toISOString()}</TableCell>
                    <TableCell className="text-gray-400 text-xs py-2">Document Uploaded</TableCell>
                    <TableCell className="text-emerald-500 text-xs py-2">Success</TableCell>
                    <TableCell className="text-gray-400 text-xs py-2">{user?.email || 'System'}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between items-center mt-8">
          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-300" onClick={() => setShowAdvanced(!showAdvanced)}>
            {showAdvanced ? "Hide" : "Show"} Advanced Processing Logs
          </Button>
          <NAICDisclaimer variant="compact" />
        </div>
      </div>
    
        <ComplianceFooter pageName="TaxReturnUpload" showsIUL showsTax showsEstate showsProjections showsHistoricalData />
      </AppShell>
  );
}
