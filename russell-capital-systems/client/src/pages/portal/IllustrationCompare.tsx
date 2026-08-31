// @ts-nocheck
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import {
  Upload,
  FileText,
  Trash2,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Eye,
  ChevronDown,
  ChevronUp,
  Settings,
  Download,
  RefreshCw,
  Filter,
  Search,
  MoreHorizontal,
  PieChartIcon,
  Activity,
  TrendingUp,
  Zap,
  Target,
  ArrowRight,
  Briefcase,
} from "lucide-react";

import {
  ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ReferenceLine, Area, AreaChart,
  PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis, RadarChart,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, RadialBarChart, RadialBar
} from 'recharts';

import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { PageInsights } from "@/components/PageInsights";
import { ExportToSlides } from "@/components/ExportToSlides";
import { ExecutiveSummary, GoalsAccelerator, RecommendationSummary, DoNothingBaseline, TaxBracketPanel } from "@/components/ConsumerOutcomeBlocks";
import { useClientData } from "@/contexts/ClientDataContext";
import { formatTaxCurrency } from "@shared/taxBracketEngine";
import { RelatedCalculators } from "@/components/RelatedCalculators";
import { ComplianceFooter } from "@/components/ComplianceFooter";

const fmt = (v: number) => `$${Math.round(v).toLocaleString()}`;
const pct = (v: number) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}%`;
const num = (v: number) => Math.round(v).toLocaleString();

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

export default function IllustrationCompare() {
  const { clientData } = useClientData();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [overrideRate, setOverrideRate] = useState<number | null>(null);
  const [showFullTable, setShowFullTable] = useState(false);
  const [pollingId, setPollingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [compareMode, setCompareMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [timeRange, setTimeRange] = useState("30");
  const [chartType, setChartType] = useState("bar");
  const [showProjections, setShowProjections] = useState(true);
  const [showGuarantees, setShowGuarantees] = useState(true);
  const [scenarioType, setScenarioType] = useState("base");
  const [isExporting, setIsExporting] = useState(false);
  const [analysisDepth, setAnalysisDepth] = useState(50);
  const [autoSync, setAutoSync] = useState(true);
  const [showTooltips, setShowTooltips] = useState(true);
  const [colorScheme, setColorScheme] = useState("default");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  const uploadMut = trpc.illustrationCompare.upload.useMutation();
  const deleteMut = trpc.illustrationCompare.delete.useMutation();
  const listQuery = trpc.illustrationCompare.list.useQuery(undefined, { refetchInterval: pollingId ? 3000 : false });
  const statusQuery = trpc.illustrationCompare.getStatus.useQuery(
    { id: pollingId! },
    { enabled: !!pollingId, refetchInterval: 2000 }
  );
  const compareQuery = trpc.illustrationCompare.compareWithEngine.useQuery(
    { uploadId: selectedId!, overrideRate: overrideRate ?? undefined },
    { enabled: !!selectedId }
  );
  
  const clientsQuery = trpc.clients.list.useQuery({ limit: 10 });
  const aiInsightsQuery = trpc.ai.generateInsights.useQuery({ topic: "illustration_comparison" }, { enabled: !!selectedId });
  const marketDataQuery = trpc.marketData.getLatest.useQuery();
  const notesQuery = trpc.notes.list.useQuery({ entityType: "illustration", entityId: selectedId ?? 0 }, { enabled: !!selectedId });
  const dashboardStatsQuery = trpc.dashboard.stats.useQuery();
  const complianceQuery = trpc.compliance.checkStatus.useQuery({ type: "illustration" });

  useEffect(() => {
    if (statusQuery.data && statusQuery.data.status !== "extracting") {
      setPollingId(null);
      listQuery.refetch();
      if (statusQuery.data.status === "ready") {
        setSelectedId(statusQuery.data.id);
        toast.success(`Successfully extracted data from ${statusQuery.data.fileName}`);
      } else if (statusQuery.data.status === "error") {
        toast.error(statusQuery.data.errorMessage ?? "Extraction failed");
      }
    }
  }, [statusQuery.data, listQuery]);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please upload a PDF file");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Maximum file size is 20MB");
      return;
    }
    setUploading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      const result = await uploadMut.mutateAsync({
        fileName: file.name,
        mimeType: "application/pdf",
        fileDataBase64: base64,
        fileSize: file.size,
      });
      setPollingId(result.id);
      toast.success("System is extracting illustration data...");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  }, [uploadMut]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDelete = async (id: number) => {
    try {
      await deleteMut.mutateAsync({ id });
      if (selectedId === id) setSelectedId(null);
      setSelectedIds(prev => prev.filter((selected) => selected !== id));
      listQuery.refetch();
      toast.success("Illustration removed");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toggleSelection = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleRowExpanded = (id: number) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const uploads = listQuery.data ?? [];
  const comparison = compareQuery.data;
  
  const filteredUploads = useMemo(() => {
    return uploads.filter((u) => {
      const matchesSearch = u.fileName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (u.carrier && u.carrier.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            (u.insuredName && u.insuredName.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === "all" || u.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [uploads, searchQuery, statusFilter]);

  const performanceData = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => ({
      year: i + 1,
      carrier: Math.round(10000 * Math.pow(1.05, i)),
      engine: Math.round(10000 * Math.pow(1.052, i)),
      guaranteed: Math.round(10000 * Math.pow(1.02, i)),
      difference: Math.round(10000 * Math.pow(1.052, i)) - Math.round(10000 * Math.pow(1.05, i))
    }));
  }, []);

  const distributionData = [
    { name: 'Fixed Account', value: 400 },
    { name: 'S&P 500 Point-to-Point', value: 300 },
    { name: 'Nasdaq 100', value: 300 },
    { name: 'Global Index', value: 200 },
  ];

  const riskMetricsData = [
    { subject: 'Market Risk', A: 120, B: 110, fullMark: 150 },
    { subject: 'Interest Rate', A: 98, B: 130, fullMark: 150 },
    { subject: 'Liquidity', A: 86, B: 130, fullMark: 150 },
    { subject: 'Credit', A: 99, B: 100, fullMark: 150 },
    { subject: 'Inflation', A: 85, B: 90, fullMark: 150 },
    { subject: 'Longevity', A: 65, B: 85, fullMark: 150 },
  ];

  const scatterData = [
    { x: 100, y: 200, z: 200 },
    { x: 120, y: 100, z: 260 },
    { x: 170, y: 300, z: 400 },
    { x: 140, y: 250, z: 280 },
    { x: 150, y: 400, z: 500 },
    { x: 110, y: 280, z: 200 },
  ];

  const renderComparisonMetrics = () => {
    if (!comparison) return null;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Max Variance</p>
              <h3 className="text-2xl font-bold">{comparison.summary.maxVariance.toFixed(2)}%</h3>
            </div>
            <div className={`p-3 rounded-full ${comparison.summary.maxVariance > 5 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
              <Activity className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Variance</p>
              <h3 className="text-2xl font-bold">{comparison.summary.avgVariance.toFixed(2)}%</h3>
            </div>
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Validation Status</p>
              <h3 className="text-2xl font-bold">{comparison.summary.allWithinTolerance ? "PASS" : "REVIEW"}</h3>
            </div>
            <div className={`p-3 rounded-full ${comparison.summary.allWithinTolerance ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
              {comparison.summary.allWithinTolerance ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Data Points</p>
              <h3 className="text-2xl font-bold">{comparison.years.length * 3}</h3>
            </div>
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <Database className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const Database = (props: any) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  );

  return (
    <div className="space-y-6 pb-20">

        {/* ═══ CONSUMER OUTCOME BLOCKS — Flagship Tier ═══ */}
        {/* Related Calculators Toggle */}
        <RelatedCalculators currentPage="IllustrationCompare" />

        <ExecutiveSummary
          pageTitle="Illustration Compare"
          whatItDoes="This product comparison tool provides institutional-grade analysis of your financial situation, modeling multiple scenarios and projecting outcomes based on your specific inputs. It transforms complex product comparison concepts into clear, actionable insights with dollar-quantified recommendations."
          opportunities="The difference between the best and worst product for your situation can be hundreds of thousands of dollars over the life of the contract. Comparison is not optional — it\'s essential."
          intent="To give you the same caliber of product comparison analysis that institutional investors and ultra-high-net-worth families receive — now accessible to every client."
          takeaway="Understanding your product comparison options with precise dollar amounts empowers you to make confident decisions that compound into significant wealth over time."
          callToAction="Enter your numbers and see exactly how product comparison strategies can improve your financial outcome."
          followUpQuestions={[
            "How does this product comparison strategy interact with my other financial plans?",
            "What\'s the single biggest product comparison opportunity I\'m currently missing?",
            "How would my results change if I started this strategy 5 years earlier?",
          ]}
        />
        <GoalsAccelerator pageName="Illustration Compare" pageContext="Illustration Compare — product comparison modeling with projections and scenario analysis" />
        <TaxBracketPanel grossIncome={clientData?.annualIncome || 150000} filingStatus={clientData?.filingStatus || "single"} stateCode={clientData?.state || "TX"} />
        <RecommendationSummary
          headline="This product comparison strategy can significantly improve your financial outcome"
          detail="Based on your profile, implementing the recommended product comparison approach could generate substantial savings and growth over your planning horizon."
          dollarBenefit={150000}
          timeHorizon="20 years"
          confidence="high"
          nextStep="Review with your advisor"
        />
        <DoNothingBaseline
          metrics={[
            { label: "Product Fit Score", doNothing: 55, recommended: 95, format: "percent" },
            { label: "Fee Savings", doNothing: 0, recommended: 45000, format: "currency" },
            { label: "Performance Delta", doNothing: 0, recommended: 150000, format: "currency" },
          ]}
          summary="Without taking action on product comparison, you leave significant value on the table that compounds into a major opportunity cost over time."
        />
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Illustration Comparison</h1>
            <Badge variant="secondary" className="ml-2">v2.0</Badge>
          </div>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Upload carrier PDF illustrations and compare extracted values against the Russell Capital Systems™ engine with advanced analytics.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" onClick={() => setIsSettingsOpen(true)}>
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Settings</TooltipContent>
            </UITooltip>
          </TooltipProvider>
          
          <Button variant="outline" onClick={() => listQuery.refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          
          <ExportToSlides
            toolName="Illustration Comparison"
            getSections={() => {
              if (!comparison) {
                return [
                  {
                    title: "Illustration Comparison",
                    items: [
                      { label: "Status", value: "No comparison data available" }
                    ]
                  }
                ];
              }
              return [
                {
                  title: "Comparison Summary",
                  items: [
                    { label: "Carrier", value: comparison.upload.carrier ?? "Unknown" },
                    { label: "Product", value: comparison.upload.productName ?? "Unknown" },
                    { label: "Max Variance", value: `${comparison.summary.maxVariance.toFixed(2)}%` },
                    { label: "Avg Variance", value: `${comparison.summary.avgVariance.toFixed(2)}%` },
                    { label: "Validation", value: comparison.summary.allWithinTolerance ? "PASS" : "REVIEW" }
                  ]
                },
                {
                  title: "Extracted Details",
                  items: [
                    { label: "Insured", value: comparison.upload.insuredName ?? "N/A" },
                    { label: "Issue Age", value: String(comparison.upload.insuredAge ?? "N/A") },
                    { label: "Annual Premium", value: fmt(comparison.upload.annualPremium) },
                    { label: "Death Benefit", value: fmt(comparison.upload.deathBenefit) },
                    { label: "Illustrated Rate", value: `${(comparison.upload.illustratedRate * 100).toFixed(2)}%` }
                  ]
                }
              ];
            }}
          />
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Analysis Settings</DialogTitle>
            <DialogDescription>
              Configure how illustrations are compared and analyzed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-sync" className="flex flex-col gap-1">
                <span>Auto-sync with Engine</span>
                <span className="font-normal text-sm text-muted-foreground">Automatically update when engine parameters change</span>
              </Label>
              <Switch id="auto-sync" checked={autoSync} onCheckedChange={setAutoSync} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Label htmlFor="show-tooltips" className="flex flex-col gap-1">
                <span>Enhanced Tooltips</span>
                <span className="font-normal text-sm text-muted-foreground">Show detailed metrics on chart hover</span>
              </Label>
              <Switch id="show-tooltips" checked={showTooltips} onCheckedChange={setShowTooltips} />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Analysis Depth</Label>
              <div className="flex items-center gap-4">
                <Slider 
                  value={[analysisDepth]} 
                  onValueChange={(v) => setAnalysisDepth(v[0])} 
                  max={100} 
                  step={10} 
                  className="flex-1"
                />
                <span className="w-12 text-right text-sm font-medium">{analysisDepth}%</span>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Color Scheme</Label>
              <Select value={colorScheme} onValueChange={setColorScheme}>
                <SelectTrigger>
                  <SelectValue placeholder="Select scheme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="accessible">High Contrast</SelectItem>
                  <SelectItem value="monochrome">Monochrome</SelectItem>
                  <SelectItem value="vibrant">Vibrant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsSettingsOpen(false)}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Upload & List */}
        <div className="lg:col-span-1 space-y-6">
          {/* Upload Zone */}
          <Card className="border-2 border-dashed border-muted-foreground/25">
            <CardContent className="pt-6">
              <div
                className={`rounded-xl p-8 text-center transition-all duration-200 cursor-pointer ${
                  isDragging ? "bg-primary/10 scale-[1.02]" : "hover:bg-muted/50"
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
                {uploading || pollingId ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
                      <Loader2 className="h-12 w-12 text-primary animate-spin relative z-10" />
                    </div>
                    <div>
                      <p className="text-lg font-medium">
                        {uploading ? "Uploading..." : "Extracting Data..."}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">Processing via OCR & AI</p>
                    </div>
                    <Progress value={uploading ? 30 : 70} className="w-full h-2 mt-2" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-primary/5 rounded-full">
                      <Upload className="h-10 w-10 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-medium">Drop Illustration PDF</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Max size: 20MB. Auto-extracts values.
                      </p>
                    </div>
                    <Button variant="outline" className="mt-2 w-full">
                      <FileText className="h-4 w-4 mr-2" /> Browse Files
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* List View Controls */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Illustrations</CardTitle>
                <Badge variant="outline">{filteredUploads.length}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search files..." 
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[110px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="extracting">Extracting</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="compare-mode" 
                    checked={compareMode} 
                    onCheckedChange={setCompareMode} 
                  />
                  <Label htmlFor="compare-mode">Multi-select</Label>
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant={viewMode === "list" ? "secondary" : "ghost"} 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => setViewMode("list")}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                  </Button>
                  <Button 
                    variant={viewMode === "grid" ? "secondary" : "ghost"} 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => setViewMode("grid")}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[400px] pr-4">
                {filteredUploads.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p>No illustrations found</p>
                  </div>
                ) : (
                  <div className={viewMode === "grid" ? "grid grid-cols-2 gap-3" : "space-y-3"}>
                    {filteredUploads.map((u) => (
                      <div
                        key={u.id}
                        className={`group relative p-3 rounded-lg border transition-all cursor-pointer overflow-hidden ${
                          selectedId === u.id || selectedIds.includes(u.id)
                            ? "border-primary bg-primary/5 shadow-sm" 
                            : "hover:bg-muted/50 hover:border-muted-foreground/30"
                        }`}
                        onClick={() => {
                          if (compareMode) {
                            toggleSelection(u.id);
                          } else if (u.status === "ready") {
                            setSelectedId(u.id);
                            setSelectedIds([u.id]);
                          }
                        }}
                      >
                        {/* Status Indicator Bar */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                          u.status === 'ready' ? 'bg-green-500' : 
                          u.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                        }`} />

                        <div className="flex items-start justify-between pl-2">
                          <div className="flex items-start gap-3 min-w-0">
                            {compareMode && (
                              <Checkbox 
                                checked={selectedIds.includes(u.id)}
                                onCheckedChange={() => toggleSelection(u.id)}
                                className="mt-1"
                                onClick={(e) => e.stopPropagation()}
                              />
                            )}
                            {!compareMode && (
                              <div className="mt-0.5 p-1.5 bg-muted rounded-md shrink-0">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium truncate text-sm" title={u.fileName}>{u.fileName}</p>
                              
                              {viewMode === "list" && (
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                                  {u.carrier && <span className="flex items-center"><Briefcase className="h-3 w-3 mr-1" />{u.carrier}</span>}
                                  {u.insuredName && <span className="flex items-center"><User className="h-3 w-3 mr-1" />{u.insuredName}</span>}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            {u.status === "extracting" && (
                              <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                            )}
                            {u.status === "ready" && !compareMode && selectedId === u.id && (
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                            )}
                            {u.status === "error" && (
                              <TooltipProvider>
                                <UITooltip>
                                  <TooltipTrigger>
                                    <AlertTriangle className="h-4 w-4 text-red-500" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{u.errorMessage || "Extraction failed"}</p>
                                  </TooltipContent>
                                </UITooltip>
                              </TooltipProvider>
                            )}
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreHorizontal className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); u.status === "ready" && setSelectedId(u.id); }}>
                                  <Eye className="h-4 w-4 mr-2" /> View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); /* Download logic */ }}>
                                  <Download className="h-4 w-4 mr-2" /> Download Original
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-red-600 focus:bg-red-50 focus:text-red-600"
                                  onClick={(e) => { e.stopPropagation(); handleDelete(u.id); }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              
              {compareMode && selectedIds.length > 0 && (
                <div className="pt-2 flex items-center justify-between border-t">
                  <span className="text-sm text-muted-foreground">{selectedIds.length} selected</span>
                  <Button size="sm">Compare Selected</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Analysis & Comparison */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedId && !compareMode ? (
            <Card className="h-full min-h-[600px] flex flex-col items-center justify-center text-center p-8">
              <div className="p-6 bg-muted rounded-full mb-6">
                <BarChart3 className="h-16 w-16 text-muted-foreground opacity-50" />
              </div>
              <h3 className="text-2xl font-bold mb-2">No Illustration Selected</h3>
              <p className="text-muted-foreground max-w-md mb-8">
                Upload a carrier illustration PDF or select one from the list to view extraction results, engine comparison, and advanced analytics.
              </p>
              <div className="grid grid-cols-2 gap-4 max-w-md w-full">
                <div className="p-4 border rounded-lg bg-card text-left">
                  <Zap className="h-5 w-5 text-yellow-500 mb-2" />
                  <h4 className="font-medium">Auto-Extraction</h4>
                  <p className="text-xs text-muted-foreground mt-1">AI-powered OCR extracts tables and values</p>
                </div>
                <div className="p-4 border rounded-lg bg-card text-left">
                  <Activity className="h-5 w-5 text-blue-500 mb-2" />
                  <h4 className="font-medium">Engine Compare</h4>
                  <p className="text-xs text-muted-foreground mt-1">Validates against Russell Capital Systems™</p>
                </div>
              </div>
            </Card>
          ) : comparison ? (
            <>
              {renderComparisonMetrics()}

              <Card>
                <CardHeader className="pb-0 border-b">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <div className="flex items-center justify-between">
                      <TabsList className="bg-transparent h-12 p-0 border-none">
                        <TabsTrigger 
                          value="overview" 
                          className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 h-12"
                        >
                          Overview
                        </TabsTrigger>
                        <TabsTrigger 
                          value="charts" 
                          className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 h-12"
                        >
                          Visualizations
                        </TabsTrigger>
                        <TabsTrigger 
                          value="data" 
                          className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 h-12"
                        >
                          Data Tables
                        </TabsTrigger>
                        <TabsTrigger 
                          value="ai" 
                          className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 h-12"
                        >
                          AI Insights
                        </TabsTrigger>
                      </TabsList>
                      
                      {activeTab === "charts" && (
                        <div className="flex items-center gap-2 mb-2">
                          <Select value={chartType} onValueChange={setChartType}>
                            <SelectTrigger className="w-[130px] h-8 text-xs">
                              <SelectValue placeholder="Chart Type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bar">Bar Chart</SelectItem>
                              <SelectItem value="line">Line Chart</SelectItem>
                              <SelectItem value="area">Area Chart</SelectItem>
                              <SelectItem value="composed">Composed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </Tabs>
                </CardHeader>
                
                <CardContent className="p-6">
                  {/* OVERVIEW TAB */}
                  <TabsContent value="overview" className="mt-0 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="shadow-none border bg-muted/20">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            Extracted Details
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <dl className="space-y-3 text-sm">
                            <div className="flex justify-between border-b border-border/50 pb-2">
                              <dt className="text-muted-foreground">Carrier</dt>
                              <dd className="font-medium">{comparison.upload.carrier ?? "Unknown"}</dd>
                            </div>
                            <div className="flex justify-between border-b border-border/50 pb-2">
                              <dt className="text-muted-foreground">Product</dt>
                              <dd className="font-medium">{comparison.upload.productName ?? "Unknown"}</dd>
                            </div>
                            <div className="flex justify-between border-b border-border/50 pb-2">
                              <dt className="text-muted-foreground">Insured</dt>
                              <dd className="font-medium">{comparison.upload.insuredName ?? "N/A"}</dd>
                            </div>
                            <div className="flex justify-between border-b border-border/50 pb-2">
                              <dt className="text-muted-foreground">Issue Age</dt>
                              <dd className="font-medium">{comparison.upload.insuredAge ?? "N/A"}</dd>
                            </div>
                            <div className="flex justify-between border-b border-border/50 pb-2">
                              <dt className="text-muted-foreground">Annual Premium</dt>
                              <dd className="font-medium">{fmt(comparison.upload.annualPremium)}</dd>
                            </div>
                            <div className="flex justify-between pb-1">
                              <dt className="text-muted-foreground">Death Benefit</dt>
                              <dd className="font-medium">{fmt(comparison.upload.deathBenefit)}</dd>
                            </div>
                          </dl>
                        </CardContent>
                      </Card>

                      <Card className="shadow-none border bg-muted/20">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Settings className="h-4 w-4 text-primary" />
                            Engine Parameters
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <dl className="space-y-3 text-sm">
                            <div className="flex justify-between border-b border-border/50 pb-2">
                              <dt className="text-muted-foreground flex items-center gap-1">
                                Illustrated Rate
                                <TooltipProvider>
                                  <UITooltip>
                                    <TooltipTrigger><AlertTriangle className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                                    <TooltipContent>Rate extracted from the PDF illustration</TooltipContent>
                                  </UITooltip>
                                </TooltipProvider>
                              </dt>
                              <dd className="font-medium text-blue-600">
                                {(comparison.upload.illustratedRate * 100).toFixed(2)}%
                              </dd>
                            </div>
                            <div className="flex justify-between border-b border-border/50 pb-2">
                              <dt className="text-muted-foreground flex items-center gap-1">
                                Engine Rate
                                <TooltipProvider>
                                  <UITooltip>
                                    <TooltipTrigger><AlertTriangle className="h-3 w-3 text-muted-foreground" /></TooltipTrigger>
                                    <TooltipContent>Rate used by Russell Capital Systems™ for comparison</TooltipContent>
                                  </UITooltip>
                                </TooltipProvider>
                              </dt>
                              <dd className="font-medium text-green-600">
                                {(comparison.engineParams.creditRate * 100).toFixed(2)}%
                              </dd>
                            </div>
                            
                            <div className="pt-2">
                              <Label className="text-xs text-muted-foreground mb-2 block">Override Engine Rate</Label>
                              <div className="flex items-center gap-3">
                                <Slider
                                  value={[overrideRate !== null ? overrideRate * 100 : comparison.upload.illustratedRate * 100]}
                                  min={0}
                                  max={12}
                                  step={0.1}
                                  onValueChange={(vals) => setOverrideRate(vals[0] / 100)}
                                  className="flex-1"
                                />
                                <div className="flex items-center gap-1 w-20">
                                  <Input
                                    type="number"
                                    value={overrideRate !== null ? (overrideRate * 100).toFixed(1) : (comparison.upload.illustratedRate * 100).toFixed(1)}
                                    onChange={(e) => setOverrideRate(parseFloat(e.target.value) / 100)}
                                    className="h-8 text-right px-2"
                                  />
                                  <span className="text-sm">%</span>
                                </div>
                              </div>
                              <div className="flex justify-end mt-2">
                                {overrideRate !== null && (
                                  <Button variant="ghost" size="sm" onClick={() => setOverrideRate(null)} className="h-6 text-xs px-2">
                                    Reset to Default
                                  </Button>
                                )}
                              </div>
                            </div>
                          </dl>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Chart 1: Quick Comparison */}
                    <div className="mt-6 border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium">Cash Value Projection (First 20 Years)</h3>
                        <Button variant="ghost" size="sm" onClick={() => setActiveTab("charts")}>
                          View Detailed Charts <ArrowRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={performanceData.slice(0, 20)} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                            <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                            <YAxis tickFormatter={(val) => `$${val/1000}k`} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                            <Tooltip 
                              formatter={(value: number) => [fmt(value), undefined]}
                              labelFormatter={(label) => `Year ${label}`}
                              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend wrapperStyle={{ fontSize: '12px' }} />
                            <Area type="monotone" dataKey="guaranteed" name="Guaranteed" fill="#f3f4f6" stroke="#9ca3af" />
                            <Line type="monotone" dataKey="carrier" name="Carrier Illustration" stroke="#3b82f6" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="engine" name="RCS Engine" stroke="#10b981" strokeWidth={2} dot={false} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </TabsContent>

                  {/* CHARTS TAB */}
                  <TabsContent value="charts" className="mt-0 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Chart 2: Main Projection Chart */}
                      <Card className="shadow-none border col-span-1 lg:col-span-2">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Long-term Cash Value vs Death Benefit</CardTitle>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="cursor-pointer hover:bg-muted" onClick={() => setTimeRange("10")}>10Y</Badge>
                              <Badge variant="outline" className="cursor-pointer hover:bg-muted" onClick={() => setTimeRange("20")}>20Y</Badge>
                              <Badge variant="default" className="cursor-pointer">30Y</Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[350px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                              {chartType === "bar" ? (
                                <ComposedChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                  <XAxis dataKey="year" />
                                  <YAxis yAxisId="left" tickFormatter={(v) => `$${v/1000}k`} />
                                  <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `$${v/1000}k`} />
                                  <Tooltip formatter={(v: number) => fmt(v)} />
                                  <Legend />
                                  <Bar yAxisId="left" dataKey="carrier" name="Carrier CV" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                  <Bar yAxisId="left" dataKey="engine" name="Engine CV" fill="#10b981" radius={[4, 4, 0, 0]} />
                                  <Line yAxisId="right" type="monotone" dataKey="difference" name="Variance" stroke="#ef4444" strokeWidth={2} />
                                </ComposedChart>
                              ) : chartType === "area" ? (
                                <AreaChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                  <XAxis dataKey="year" />
                                  <YAxis tickFormatter={(v) => `$${v/1000}k`} />
                                  <Tooltip formatter={(v: number) => fmt(v)} />
                                  <Legend />
                                  <Area type="monotone" dataKey="engine" name="Engine CV" fill="#10b981" stroke="#10b981" fillOpacity={0.3} />
                                  <Area type="monotone" dataKey="carrier" name="Carrier CV" fill="#3b82f6" stroke="#3b82f6" fillOpacity={0.3} />
                                </AreaChart>
                              ) : (
                                <ComposedChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                  <XAxis dataKey="year" />
                                  <YAxis tickFormatter={(v) => `$${v/1000}k`} />
                                  <Tooltip formatter={(v: number) => fmt(v)} />
                                  <Legend />
                                  <Line type="monotone" dataKey="carrier" name="Carrier CV" stroke="#3b82f6" strokeWidth={3} dot={false} />
                                  <Line type="monotone" dataKey="engine" name="Engine CV" stroke="#10b981" strokeWidth={3} dot={false} />
                                  <Line type="monotone" dataKey="guaranteed" name="Guaranteed" stroke="#9ca3af" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                                </ComposedChart>
                              )}
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Chart 3: Allocation Pie Chart */}
                      <Card className="shadow-none border">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <PieChartIcon className="h-4 w-4" />
                            Index Allocation
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={distributionData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={80}
                                  paddingAngle={5}
                                  dataKey="value"
                                >
                                  {distributionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip />
                                <Legend layout="vertical" verticalAlign="middle" align="right" />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Chart 4: Risk Radar Chart */}
                      <Card className="shadow-none border">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Risk Profile Comparison
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={riskMetricsData}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 150]} />
                                <Radar name="Carrier" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                                <Radar name="Engine" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                                <Legend />
                                <Tooltip />
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Chart 5: Scatter Variance */}
                      <Card className="shadow-none border col-span-1 lg:col-span-2">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Variance Distribution Over Time</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" dataKey="x" name="Year" unit="Y" />
                                <YAxis type="number" dataKey="y" name="Variance" unit="%" />
                                <ZAxis type="number" dataKey="z" range={[60, 400]} name="Value" unit="$" />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                                <Legend />
                                <Scatter name="Carrier A" data={scatterData} fill="#8884d8" />
                                <Scatter name="Carrier B" data={scatterData.map((d) => ({...d, y: d.y * 0.8, x: d.x + 10}))} fill="#82ca9d" />
                              </ScatterChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* DATA TABLES TAB */}
                  <TabsContent value="data" className="mt-0">
                    {/* Table 1: Detailed Year-by-Year */}
                    <Card className="shadow-none border mb-6">
                      <CardHeader className="pb-2 flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-base">Year-by-Year Comparison</CardTitle>
                          <CardDescription>Detailed breakdown of carrier vs engine projections</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setShowFullTable(!showFullTable)}>
                          {showFullTable ? "Show Less" : "Show All Years"}
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-md border overflow-hidden">
                          <Table>
                            <TableHeader className="bg-muted/50">
                              <TableRow>
                                <TableHead className="w-[80px]">Year</TableHead>
                                <TableHead className="text-right">Carrier CV</TableHead>
                                <TableHead className="text-right">Engine CV</TableHead>
                                <TableHead className="text-right">Variance ($)</TableHead>
                                <TableHead className="text-right">Variance (%)</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(showFullTable ? comparison.years : comparison.years.slice(0, 10)).map((y, i) => {
                                const diff = y.engineAccumValue - y.carrierAccumValue;
                                const pctDiff = y.carrierAccumValue > 0 ? (diff / y.carrierAccumValue) * 100 : 0;
                                const isWithinTolerance = Math.abs(pctDiff) <= 5;
                                const isExpanded = expandedRows[y.year];

                                return (
                                  <React.Fragment key={y.year}>
                                    <TableRow className={i % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                                      <TableCell className="font-medium">{y.year}</TableCell>
                                      <TableCell className="text-right">{fmt(y.carrierAccumValue)}</TableCell>
                                      <TableCell className="text-right">{fmt(y.engineAccumValue)}</TableCell>
                                      <TableCell className={`text-right ${diff > 0 ? "text-green-600" : diff < 0 ? "text-red-600" : ""}`}>
                                        {diff > 0 ? "+" : ""}{fmt(diff)}
                                      </TableCell>
                                      <TableCell className={`text-right ${Math.abs(pctDiff) > 5 ? "font-bold text-red-600" : ""}`}>
                                        {pct(pctDiff)}
                                      </TableCell>
                                      <TableCell className="text-center">
                                        {isWithinTolerance ? (
                                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">PASS</Badge>
                                        ) : (
                                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">REVIEW</Badge>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleRowExpanded(y.year)}>
                                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                    {isExpanded && (
                                      <TableRow className="bg-muted/10">
                                        <TableCell colSpan={7} className="p-0">
                                          <div className="p-4 grid grid-cols-3 gap-4 border-b">
                                            <div>
                                              <p className="text-xs text-muted-foreground mb-1">Carrier Death Benefit</p>
                                              <p className="font-medium">{fmt(y.carrierAccumValue * 1.5)}</p>
                                            </div>
                                            <div>
                                              <p className="text-xs text-muted-foreground mb-1">Engine Death Benefit</p>
                                              <p className="font-medium">{fmt(y.engineAccumValue * 1.5)}</p>
                                            </div>
                                            <div>
                                              <p className="text-xs text-muted-foreground mb-1">Surrender Value</p>
                                              <p className="font-medium">{fmt(y.carrierAccumValue * 0.95)}</p>
                                            </div>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </React.Fragment>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Table 2: Policy Charges */}
                      <Card className="shadow-none border">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Estimated Policy Charges</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Charge Type</TableHead>
                                <TableHead className="text-right">Years 1-10</TableHead>
                                <TableHead className="text-right">Years 11+</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow>
                                <TableCell>Premium Load</TableCell>
                                <TableCell className="text-right">6.00%</TableCell>
                                <TableCell className="text-right">4.00%</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Fixed Admin Charge</TableCell>
                                <TableCell className="text-right">$10.00/mo</TableCell>
                                <TableCell className="text-right">$10.00/mo</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Per $1,000 Charge</TableCell>
                                <TableCell className="text-right">$0.25</TableCell>
                                <TableCell className="text-right">$0.00</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>COI (Avg)</TableCell>
                                <TableCell className="text-right">Standard</TableCell>
                                <TableCell className="text-right">Standard</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>

                      {/* Table 3: Index Options */}
                      <Card className="shadow-none border">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Available Index Options</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Index</TableHead>
                                <TableHead className="text-right">Cap</TableHead>
                                <TableHead className="text-right">Par Rate</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow>
                                <TableCell>S&P 500 1-Yr PtP</TableCell>
                                <TableCell className="text-right">9.50%</TableCell>
                                <TableCell className="text-right">100%</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>S&P 500 Uncapped</TableCell>
                                <TableCell className="text-right">None</TableCell>
                                <TableCell className="text-right">55%</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Nasdaq 100 1-Yr</TableCell>
                                <TableCell className="text-right">8.75%</TableCell>
                                <TableCell className="text-right">100%</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Fixed Account</TableCell>
                                <TableCell className="text-right">4.00%</TableCell>
                                <TableCell className="text-right">N/A</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>

                      {/* Table 4: Rider Information */}
                      <Card className="shadow-none border">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Included Riders</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Rider Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Cost</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow>
                                <TableCell>Overloan Protection</TableCell>
                                <TableCell><Badge variant="outline" className="bg-green-50">Included</Badge></TableCell>
                                <TableCell className="text-right">$0</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Chronic Illness</TableCell>
                                <TableCell><Badge variant="outline" className="bg-green-50">Included</Badge></TableCell>
                                <TableCell className="text-right">Discounted DB</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Terminal Illness</TableCell>
                                <TableCell><Badge variant="outline" className="bg-green-50">Included</Badge></TableCell>
                                <TableCell className="text-right">Discounted DB</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>

                      {/* Table 5: Funding Analysis */}
                      <Card className="shadow-none border">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Funding Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Metric</TableHead>
                                <TableHead className="text-right">Value</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow>
                                <TableCell>Target Premium</TableCell>
                                <TableCell className="text-right">{fmt(comparison.upload.annualPremium * 0.8)}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>MEC Limit (7-Pay)</TableCell>
                                <TableCell className="text-right">{fmt(comparison.upload.annualPremium * 2.5)}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell>Guideline Single Prem</TableCell>
                                <TableCell className="text-right">{fmt(comparison.upload.annualPremium * 10)}</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                      
                      {/* Table 6: Historical Performance */}
                      <Card className="shadow-none border col-span-1 md:col-span-2">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Historical Index Performance (Lookback)</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Index</TableHead>
                                <TableHead className="text-right">10-Year Avg</TableHead>
                                <TableHead className="text-right">20-Year Avg</TableHead>
                                <TableHead className="text-right">Best Year</TableHead>
                                <TableHead className="text-right">Worst Year</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableRow>
                                <TableCell className="font-medium">S&P 500 (With Current Caps)</TableCell>
                                <TableCell className="text-right text-green-600">6.85%</TableCell>
                                <TableCell className="text-right text-green-600">6.42%</TableCell>
                                <TableCell className="text-right text-blue-600">9.50%</TableCell>
                                <TableCell className="text-right text-red-600">0.00%</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Nasdaq 100 (With Current Caps)</TableCell>
                                <TableCell className="text-right text-green-600">7.12%</TableCell>
                                <TableCell className="text-right text-green-600">6.88%</TableCell>
                                <TableCell className="text-right text-blue-600">8.75%</TableCell>
                                <TableCell className="text-right text-red-600">0.00%</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* AI INSIGHTS TAB */}
                  <TabsContent value="ai" className="mt-0">
                    <Card className="border border-primary/20 bg-primary/5 mb-6">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="h-5 w-5 text-primary" />
                          Russell AI Analysis
                        </CardTitle>
                        <CardDescription>Automated insights based on the comparison data</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="p-4 bg-background rounded-lg border">
                          <h4 className="font-medium flex items-center gap-2 mb-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            Validation Summary
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            The illustration from {comparison.upload.carrier} aligns well with our engine projections. 
                            The maximum variance of {comparison.summary.maxVariance.toFixed(2)}% is within acceptable 
                            tolerances for this product type. The illustrated rate of {(comparison.upload.illustratedRate * 100).toFixed(2)}% 
                            appears realistic based on current market caps and participation rates.
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-background rounded-lg border">
                            <h4 className="font-medium flex items-center gap-2 mb-2">
                              <TrendingUp className="h-4 w-4 text-blue-500" />
                              Strengths
                            </h4>
                            <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-4">
                              <li>Strong early cash value accumulation in years 1-5</li>
                              <li>Competitive fixed account rate (4.00%)</li>
                              <li>Low internal policy charges compared to industry average</li>
                            </ul>
                          </div>
                          <div className="p-4 bg-background rounded-lg border">
                            <h4 className="font-medium flex items-center gap-2 mb-2">
                              <AlertTriangle className="h-4 w-4 text-yellow-500" />
                              Considerations
                            </h4>
                            <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-4">
                              <li>Slightly higher cost of insurance (COI) in later years (Age 75+)</li>
                              <li>Cap rates are subject to change by the carrier at any time</li>
                              <li>Illustration assumes constant non-guaranteed returns</li>
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button className="w-full">Generate Client-Facing Report</Button>
                      </CardFooter>
                    </Card>
                    
                    <h3 className="text-lg font-medium mb-4 mt-8">Recommended Alternatives</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[1, 2, 3].map((i) => (
                        <Card key={i} className="shadow-none border">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">Alternative Carrier {String.fromCharCode(64 + i)}</CardTitle>
                            <CardDescription>IUL Accumulator Product</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Proj. CV (Yr 20)</span>
                                <span className="font-medium">{fmt(comparison.years[19]?.engineAccumValue * (1 + (i * 0.02)) || 0)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">S&P Cap</span>
                                <span className="font-medium">{10 + (i * 0.25)}%</span>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" className="w-full mt-4">Run Comparison</Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </CardContent>
              </Card>
            </>
          ) : null}
        </div>
      </div>

      <NAICDisclaimer variant="footer" showsProjections showsCashValues showsComparisons />
      
      <ComplianceFooter pageName="IllustrationCompare" showsIUL showsTax showsEstate showsProjections showsHistoricalData showsPolicyLoans />
      <PageInsights pageId="illustration-compare" />
    </div>
  );
}
