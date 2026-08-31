// @ts-nocheck
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { useState, useMemo, useEffect } from "react";
import {
  FileText,
  Download,
  Loader2,
  CheckCircle2,
  TrendingUp,
  Mail,
  Send,
  Search,
  Filter,
  Shield,
  AlertTriangle,
  Clock,
  Calendar,
  Briefcase,
  Target,
  PieChart as PieChartIcon,
  Activity,
  DollarSign,
  Settings,
  Zap,
  Database,
  Globe,
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
  Plus,
  Minus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area, 
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ComposedChart
} from "recharts";
import { toast } from "sonner";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/_core/hooks/useAuth";

const CHART_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#14b8a6"];

const REPORT_TEMPLATES = [
  { id: "executive_summary", name: "Executive Summary", description: "High-level overview of all client strategies and outcomes", sections: ["portfolio_overview", "key_metrics", "recommendations"] },
  { id: "iul_performance", name: "IUL Performance Report", description: "Detailed IUL policy performance with index crediting analysis", sections: ["iul_summary", "index_performance", "cash_value_projection"] },
  { id: "roth_analysis", name: "Roth Conversion Analysis", description: "Multi-year Roth conversion impact with tax bracket analysis", sections: ["roth_summary", "tax_impact", "conversion_schedule"] },
  { id: "estate_planning", name: "Estate Planning Report", description: "Estate tax projections and wealth transfer strategies", sections: ["estate_overview", "tax_projections", "trust_analysis"] },
  { id: "compliance_audit", name: "Compliance Audit Report", description: "Full compliance review with suitability documentation", sections: ["compliance_summary", "suitability_checks", "disclosure_log"] },
  { id: "practice_analytics", name: "Practice Analytics", description: "Business metrics including AUM, client growth, and revenue", sections: ["practice_overview", "growth_metrics", "revenue_analysis"] },
  { id: "risk_assessment", name: "Risk Assessment Report", description: "Detailed risk profile analysis and mitigation strategies", sections: ["risk_profile", "mitigation_strategies", "scenario_analysis"] },
  { id: "tax_optimization", name: "Tax Optimization Strategy", description: "Comprehensive tax reduction strategies across all accounts", sections: ["current_tax", "optimization_opportunities", "projected_savings"] },
];

export default function AdvancedReporting() {
  const { user } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [emailRecipient, setEmailRecipient] = useState("");
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("templates");
  const [timeRange, setTimeRange] = useState("6m");
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [showMetrics, setShowMetrics] = useState(true);
  const [chartType, setChartType] = useState("bar");
  const [theme, setTheme] = useState("dark");
  const [showProjections, setShowProjections] = useState(true);
  const [confidenceLevel, setConfidenceLevel] = useState(95);
  const [inflationRate, setInflationRate] = useState(3.0);
  const [taxBracket, setTaxBracket] = useState(24);
  const [reportFormat, setReportFormat] = useState("pdf");
  const [includeCover, setIncludeCover] = useState(true);
  const [includeTOC, setIncludeTOC] = useState(true);
  const [includeDisclaimers, setIncludeDisclaimers] = useState(true);
  const [watermark, setWatermark] = useState("Draft");
  const [pageSize, setPageSize] = useState("letter");
  const [orientation, setOrientation] = useState("portrait");
  const [margins, setMargins] = useState("normal");
  const [fontFamily, setFontFamily] = useState("inter");
  const [fontSize, setFontSize] = useState("11");
  const [colorScheme, setColorScheme] = useState("default");
  const [customTitle, setCustomTitle] = useState("");
  const [customSubtitle, setCustomSubtitle] = useState("");
  const [customFooter, setCustomFooter] = useState("");
  const [showPageNumbers, setShowPageNumbers] = useState(true);
  const [showDate, setShowDate] = useState(true);
  const [showAuthor, setShowAuthor] = useState(true);

  const { data: clients } = trpc.clients.list.useQuery();
  const { data: dashboardData } = trpc.dashboard.getMetrics.useQuery();
  const { data: complianceData } = trpc.compliance.getAuditStatus.useQuery();
  const { data: aiInsights } = trpc.ai.getInsights.useQuery();
  const { data: practiceMetrics } = trpc.reports.getPracticeMetrics.useQuery();
  
  const generateMut = trpc.reportBuilder.generate.useMutation();
  const exportPdfMut = trpc.reportBuilder.exportPdf.useMutation({
    onSuccess: (data) => {
      window.open(data.url, "_blank");
      toast.success("PDF exported successfully!");
    },
    onError: () => toast.error("Failed to export PDF"),
  });

  const emailReportMut = trpc.reportBuilder.emailReport.useMutation({
    onSuccess: () => {
      toast.success("Report emailed successfully!");
      setEmailDialogOpen(false);
      setEmailRecipient("");
    },
    onError: () => toast.error("Failed to send email"),
  });

  const handleEmailReport = () => {
    if (!emailRecipient || !exportPdfMut.data?.url) return;
    const report = generateMut.data;
    emailReportMut.mutate({
      pdfUrl: exportPdfMut.data.url,
      clientEmail: emailRecipient,
      clientName: report?.clientName ?? "Client",
      reportTitle: report?.title ?? "Report",
    });
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) { toast.error("Select a report template"); return; }
    const template = REPORT_TEMPLATES.find((t) => t.id === selectedTemplate);
    if (!template) return;
    setGenerating(true);
    try {
      await generateMut.mutateAsync({
        clientId: selectedClientId ?? undefined,
        sections: template.sections,
        title: customTitle || template.name,
      });
      toast.success("Report generated successfully!");
      setActiveTab("results");
    } catch {
      toast.error("Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  const handleExportPdf = () => {
    const report = generateMut.data;
    if (!report) return;
    exportPdfMut.mutate({
      title: customTitle || report.title,
      clientName: report.clientName,
      advisorName: report.advisorName,
      reportId: report.reportId,
      generatedAt: report.generatedAt,
      sections: report.sections,
    });
  };

  const filteredTemplates = useMemo(() => {
    let result = REPORT_TEMPLATES;
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter((t) => 
        t.name.toLowerCase().includes(lowerQuery) || 
        t.description.toLowerCase().includes(lowerQuery)
      );
    }
    if (filterCategory !== "all") {
      result = result.filter((t) => t.id.includes(filterCategory) || filterCategory === "all");
    }
    if (sortBy === "name") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "sections") {
      result = [...result].sort((a, b) => b.sections.length - a.sections.length);
    }
    return result;
  }, [searchQuery, filterCategory, sortBy]);

  const practiceData = useMemo(() => ({
    monthlyRevenue: [
      { month: "Oct", revenue: 45000, expenses: 12000, profit: 33000 }, 
      { month: "Nov", revenue: 52000, expenses: 14000, profit: 38000 }, 
      { month: "Dec", revenue: 48000, expenses: 15000, profit: 33000 },
      { month: "Jan", revenue: 61000, expenses: 13000, profit: 48000 }, 
      { month: "Feb", revenue: 58000, expenses: 14000, profit: 44000 }, 
      { month: "Mar", revenue: 67000, expenses: 16000, profit: 51000 },
    ],
    clientDistribution: [
      { name: "IUL Only", value: 35 }, { name: "Roth + IUL", value: 28 },
      { name: "Estate Planning", value: 18 }, { name: "Comprehensive", value: 19 },
    ],
    aumGrowth: [
      { month: "Oct", aum: 12.5, target: 13.0 }, { month: "Nov", aum: 13.1, target: 13.5 }, 
      { month: "Dec", aum: 13.8, target: 14.0 }, { month: "Jan", aum: 14.5, target: 14.5 }, 
      { month: "Feb", aum: 15.2, target: 15.0 }, { month: "Mar", aum: 16.1, target: 15.5 },
    ],
    riskProfile: [
      { subject: "Market Risk", A: 120, B: 110, fullMark: 150 },
      { subject: "Inflation Risk", A: 98, B: 130, fullMark: 150 },
      { subject: "Longevity Risk", A: 86, B: 130, fullMark: 150 },
      { subject: "Tax Risk", A: 99, B: 100, fullMark: 150 },
      { subject: "Sequence Risk", A: 85, B: 90, fullMark: 150 },
      { subject: "Liquidity Risk", A: 65, B: 85, fullMark: 150 },
    ],
    revenueByProduct: [
      { name: "Life Insurance", IUL: 4000, Term: 2400, Whole: 2400 },
      { name: "Annuities", Fixed: 3000, Variable: 1398, Indexed: 2210 },
      { name: "AUM", Equities: 2000, Bonds: 9800, Alternatives: 2290 },
      { name: "Planning", Hourly: 2780, Flat: 3908, Retainer: 2000 },
    ]
  }), []);

  const recentReports = [
    { id: "RPT-001", name: "Smith Family Estate Plan", type: "Estate Planning", date: "2024-03-15", status: "Completed" },
    { id: "RPT-002", name: "Johnson Q1 Review", type: "Executive Summary", date: "2024-03-14", status: "Completed" },
    { id: "RPT-003", name: "Williams Roth Analysis", type: "Roth Conversion", date: "2024-03-12", status: "Pending Review" },
    { id: "RPT-004", name: "Davis IUL Projection", type: "IUL Performance", date: "2024-03-10", status: "Completed" },
    { id: "RPT-005", name: "Miller Compliance Audit", type: "Compliance", date: "2024-03-08", status: "Flagged" },
  ];

  const clientActivity = [
    { client: "Robert Smith", action: "Viewed Report", time: "2 hours ago", device: "Desktop" },
    { client: "Sarah Johnson", action: "Downloaded PDF", time: "5 hours ago", device: "Mobile" },
    { client: "Michael Williams", action: "Signed Document", time: "1 day ago", device: "Desktop" },
    { client: "Emily Davis", action: "Viewed Portal", time: "2 days ago", device: "Tablet" },
    { client: "David Miller", action: "Requested Update", time: "3 days ago", device: "Mobile" },
  ];

  const complianceAlerts = [
    { issue: "Missing Signature", client: "Robert Smith", severity: "High", date: "2024-03-15" },
    { issue: "Outdated Suitability", client: "Sarah Johnson", severity: "Medium", date: "2024-03-10" },
    { issue: "Unverified Identity", client: "Michael Williams", severity: "High", date: "2024-03-05" },
    { issue: "Incomplete Profile", client: "Emily Davis", severity: "Low", date: "2024-03-01" },
  ];

  const systemLogs = [
    { event: "Report Generated", user: "Advisor A", ip: "192.168.1.1", time: "10:30 AM" },
    { event: "Data Export", user: "Advisor B", ip: "192.168.1.2", time: "09:15 AM" },
    { event: "Settings Changed", user: "Admin", ip: "192.168.1.3", time: "08:45 AM" },
    { event: "Login Attempt", user: "Unknown", ip: "10.0.0.1", time: "02:00 AM" },
  ];

  const upcomingReviews = [
    { client: "Robert Smith", type: "Annual Review", date: "2024-04-01", prepStatus: "In Progress" },
    { client: "Sarah Johnson", type: "Q2 Update", date: "2024-04-15", prepStatus: "Not Started" },
    { client: "Michael Williams", type: "Strategy Shift", date: "2024-04-20", prepStatus: "Ready" },
    { client: "Emily Davis", type: "Policy Anniversary", date: "2024-05-05", prepStatus: "Not Started" },
  ];

  const performanceMetrics = [
    { metric: "Report Generation Time", value: "2.4s", trend: "-0.3s", status: "Good" },
    { metric: "API Response Time", value: "150ms", trend: "+10ms", status: "Warning" },
    { portal: "Client Portal Uptime", value: "99.99%", trend: "Stable", status: "Excellent" },
    { metric: "Database Load", value: "45%", trend: "-5%", status: "Good" },
  ];


  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto pb-12">
        <div className="rc-page-header">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#12233e] rounded-lg">
              <FileText className="w-6 h-6 text-[#22c55e]" />
            </div>
            <h1 className="rc-page-title">Advanced Reporting & Analytics</h1>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <p className="rc-page-subtitle">
              Generate comprehensive reports, analyze practice metrics, and monitor compliance across your entire book of business.
            </p>
            <div className="flex items-center gap-3">
              <button 
                className="rc-btn rc-btn-ghost border border-[#12233e]"
                onClick={() => setIsAdvancedMode(!isAdvancedMode)}
              >
                {isAdvancedMode ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {isAdvancedMode ? "Simple Mode" : "Advanced Mode"}
              </button>
              <ExportToSlides
                toolName="Advanced Reporting"
                getSections={() => [
                  {
                    title: "Practice Analytics Summary",
                    items: [
                      { label: "Selected Template", value: selectedTemplate ? (REPORT_TEMPLATES.find((t) => t.id === selectedTemplate)?.name || selectedTemplate) : "None" },
                      { label: "Selected Client ID", value: selectedClientId ? String(selectedClientId) : "All" },
                      { label: "Time Range", value: timeRange }
                    ]
                  }
                ]}
              />
            </div>
          </div>
        </div>

        {/* Tab Navigation (Interactive Element 1-4) */}
        <div className="flex space-x-1 border-b border-[#12233e] mb-6">
          <button 
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "templates" ? "border-[#22c55e] text-white" : "border-transparent text-[#7a95b8] hover:text-[#c8d8ec]"}`}
            onClick={() => setActiveTab("templates")}
          >
            Report Builder
          </button>
          <button 
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "analytics" ? "border-[#22c55e] text-white" : "border-transparent text-[#7a95b8] hover:text-[#c8d8ec]"}`}
            onClick={() => setActiveTab("analytics")}
          >
            Practice Analytics
          </button>
          <button 
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "results" ? "border-[#22c55e] text-white" : "border-transparent text-[#7a95b8] hover:text-[#c8d8ec]"}`}
            onClick={() => setActiveTab("results")}
            disabled={!generateMut.data && !exportPdfMut.data}
          >
            Generated Results
          </button>
          <button 
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "settings" ? "border-[#22c55e] text-white" : "border-transparent text-[#7a95b8] hover:text-[#c8d8ec]"}`}
            onClick={() => setActiveTab("settings")}
          >
            Configuration
          </button>
        </div>

        {activeTab === "templates" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Report Generator Controls */}
            <div className="lg:col-span-1 space-y-6">
              <div className="rc-card">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Filter className="w-5 h-5 text-[#7a95b8]" />
                  Report Configuration
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#c8d8ec] mb-1.5">Search Templates</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a95b8]" />
                      <Input 
                        placeholder="Search reports..." 
                        className="rc-input pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-[#c8d8ec] mb-1.5">Category</label>
                      <select 
                        className="rc-input w-full bg-[#060d19] border-[#12233e] text-white h-10 px-3 rounded-md focus:ring-1 focus:ring-[#22c55e] outline-none"
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                      >
                        <option value="all">All Categories</option>
                        <option value="summary">Summaries</option>
                        <option value="analysis">Analysis</option>
                        <option value="compliance">Compliance</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[#c8d8ec] mb-1.5">Sort By</label>
                      <select 
                        className="rc-input w-full bg-[#060d19] border-[#12233e] text-white h-10 px-3 rounded-md focus:ring-1 focus:ring-[#22c55e] outline-none"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                      >
                        <option value="name">Name (A-Z)</option>
                        <option value="sections">Complexity</option>
                        <option value="popular">Popularity</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#c8d8ec] mb-1.5">Target Client</label>
                    <select 
                      className="rc-input w-full bg-[#060d19] border-[#12233e] text-white h-10 px-3 rounded-md focus:ring-1 focus:ring-[#22c55e] outline-none"
                      value={selectedClientId ? String(selectedClientId) : "all"}
                      onChange={(e) => setSelectedClientId(e.target.value === "all" ? null : Number(e.target.value))}
                    >
                      <option value="all">All Clients (Practice Level)</option>
                      {clients?.map((c) => (
                        <option key={c.id} value={String(c.id)}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {isAdvancedMode && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-[#c8d8ec] mb-1.5">Custom Title (Optional)</label>
                        <Input 
                          placeholder="e.g. Q3 Comprehensive Review" 
                          className="rc-input"
                          value={customTitle}
                          onChange={(e) => setCustomTitle(e.target.value)}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#060d19] border border-[#12233e]">
                        <span className="text-sm text-[#c8d8ec]">Include Cover Page</span>
                        <button 
                          className={`w-10 h-5 rounded-full relative transition-colors ${includeCover ? 'bg-[#22c55e]' : 'bg-[#12233e]'}`}
                          onClick={() => setIncludeCover(!includeCover)}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${includeCover ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-[#060d19] border border-[#12233e]">
                        <span className="text-sm text-[#c8d8ec]">Include Disclaimers</span>
                        <button 
                          className={`w-10 h-5 rounded-full relative transition-colors ${includeDisclaimers ? 'bg-[#22c55e]' : 'bg-[#12233e]'}`}
                          onClick={() => setIncludeDisclaimers(!includeDisclaimers)}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${includeDisclaimers ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    </>
                  )}

                  <div className="pt-2">
                    <button 
                      className="rc-btn rc-btn-primary w-full justify-center py-2.5"
                      onClick={handleGenerate} 
                      disabled={generating || !selectedTemplate}
                    >
                      {generating ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating Report...</>
                      ) : (
                        <><FileText className="w-4 h-4 mr-2" /> Generate Selected Report</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Table 1: Recent Reports */}
              <div className="rc-card">
                <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#7a95b8]" /> Recent Reports
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-[#7a95b8] bg-[#060d19] border-b border-[#12233e]">
                      <tr>
                        <th className="px-3 py-2 font-medium">Name</th>
                        <th className="px-3 py-2 font-medium">Date</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentReports.slice(0, 4).map((r, i) => (
                        <tr key={i} className="border-b border-[#12233e] hover:bg-[#12233e]/30">
                          <td className="px-3 py-2 text-[#c8d8ec] truncate max-w-[120px]">{r.name}</td>
                          <td className="px-3 py-2 text-[#7a95b8]">{r.date}</td>
                          <td className="px-3 py-2">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${r.status === 'Completed' ? 'bg-[#22c55e]/20 text-[#22c55e]' : r.status === 'Flagged' ? 'bg-[#ef4444]/20 text-[#ef4444]' : 'bg-[#f59e0b]/20 text-[#f59e0b]'}`}>
                              {r.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Report Templates Selection */}
            <div className="lg:col-span-2">
              <div className="rc-card h-full">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-white">Available Templates</h2>
                  <span className="text-sm text-[#7a95b8]">{filteredTemplates.length} templates found</span>
                </div>
                
                {filteredTemplates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-[#12233e] rounded-xl bg-[#060d19]">
                    <FileText className="w-12 h-12 text-[#7a95b8] mb-3 opacity-50" />
                    <p className="text-[#c8d8ec] font-medium">No templates found</p>
                    <p className="text-sm text-[#7a95b8] mt-1">Try adjusting your search query or filters</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredTemplates.map((t) => (
                      <div
                        key={t.id}
                        className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                          selectedTemplate === t.id 
                            ? "bg-[#22c55e]/10 border-[#22c55e] shadow-[0_0_15px_rgba(34,197,94,0.1)]" 
                            : "bg-[#060d19] border-[#12233e] hover:border-[#7a95b8]/50 hover:bg-[#12233e]/50"
                        }`}
                        onClick={() => setSelectedTemplate(t.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg mt-0.5 ${selectedTemplate === t.id ? "bg-[#22c55e]/20 text-[#22c55e]" : "bg-[#12233e] text-[#7a95b8] group-hover:text-white"}`}>
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <h3 className={`font-medium text-sm mb-1 ${selectedTemplate === t.id ? "text-white" : "text-[#c8d8ec]"}`}>
                                {t.name}
                              </h3>
                              {selectedTemplate === t.id && <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />}
                            </div>
                            <p className="text-xs text-[#7a95b8] line-clamp-2 mb-3">
                              {t.description}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {t.sections.slice(0, 2).map((s) => (
                                <span key={s} className="text-[9px] px-1.5 py-0.5 rounded-md bg-[#12233e] text-[#7a95b8] border border-[#12233e]/50 uppercase tracking-wider">
                                  {s.replace(/_/g, " ")}
                                </span>
                              ))}
                              {t.sections.length > 2 && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-[#12233e] text-[#7a95b8] border border-[#12233e]/50">
                                  +{t.sections.length - 2}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-[#060d19] p-4 rounded-xl border border-[#12233e]">
              <div className="flex gap-4">
                <button 
                  className={`px-3 py-1.5 text-xs rounded-md transition-colors ${timeRange === "1m" ? "bg-[#22c55e]/20 text-[#22c55e]" : "bg-[#12233e] text-[#7a95b8] hover:text-white"}`}
                  onClick={() => setTimeRange("1m")}
                >1 Month</button>
                <button 
                  className={`px-3 py-1.5 text-xs rounded-md transition-colors ${timeRange === "3m" ? "bg-[#22c55e]/20 text-[#22c55e]" : "bg-[#12233e] text-[#7a95b8] hover:text-white"}`}
                  onClick={() => setTimeRange("3m")}
                >3 Months</button>
                <button 
                  className={`px-3 py-1.5 text-xs rounded-md transition-colors ${timeRange === "6m" ? "bg-[#22c55e]/20 text-[#22c55e]" : "bg-[#12233e] text-[#7a95b8] hover:text-white"}`}
                  onClick={() => setTimeRange("6m")}
                >6 Months</button>
                <button 
                  className={`px-3 py-1.5 text-xs rounded-md transition-colors ${timeRange === "1y" ? "bg-[#22c55e]/20 text-[#22c55e]" : "bg-[#12233e] text-[#7a95b8] hover:text-white"}`}
                  onClick={() => setTimeRange("1y")}
                >1 Year</button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#7a95b8]">Chart Type:</span>
                <select 
                  className="bg-[#12233e] border-none text-white text-sm rounded-md px-2 py-1 outline-none"
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value)}
                >
                  <option value="bar">Bar</option>
                  <option value="line">Line</option>
                  <option value="area">Area</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Chart 1: Monthly Revenue & Profit (ComposedChart) */}
              <div className="rc-card lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-[#c8d8ec] flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-[#22c55e]" /> Financial Performance
                  </h3>
                  <span className="rc-badge rc-badge-green text-xs">Revenue vs Profit</span>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={practiceData.monthlyRevenue} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                      <XAxis dataKey="month" stroke="#7a95b8" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="left" stroke="#7a95b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                      <YAxis yAxisId="right" orientation="right" stroke="#7a95b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(v: number) => [`$${v.toLocaleString()}`, undefined]} 
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', color: '#c8d8ec' }} />
                      <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      <Bar yAxisId="left" dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      <Line yAxisId="right" type="monotone" dataKey="profit" name="Net Profit" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Client Distribution (PieChart) */}
              <div className="rc-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-[#c8d8ec] flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-[#8b5cf6]" /> Client Distribution
                  </h3>
                  <span className="rc-badge rc-badge-purple text-xs">By Strategy</span>
                </div>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={practiceData.clientDistribution} 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={60} 
                        outerRadius={90} 
                        paddingAngle={5}
                        dataKey="value" 
                        nameKey="name" 
                        stroke="#0d1a2e"
                        strokeWidth={2}
                      >
                        {practiceData.clientDistribution.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(v: number) => [`${v}%`, 'Distribution']} 
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', color: '#c8d8ec' }} layout="vertical" verticalAlign="middle" align="right" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 3: AUM Growth (AreaChart) */}
              <div className="rc-card lg:col-span-1 md:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-[#c8d8ec] flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#f59e0b]" /> AUM Growth
                  </h3>
                  <span className="rc-badge rc-badge-gold text-xs">Actual vs Target</span>
                </div>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={practiceData.aumGrowth} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                      <defs>
                        <linearGradient id="colorAum" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                      <XAxis dataKey="month" stroke="#7a95b8" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#7a95b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `$${v}M`} domain={['dataMin - 1', 'dataMax + 1']} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(v: number) => [`$${v}M`, undefined]} 
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', color: '#c8d8ec' }} />
                      <Area type="monotone" dataKey="aum" name="Actual AUM" stroke="#f59e0b" fillOpacity={1} fill="url(#colorAum)" strokeWidth={2} />
                      <Line type="monotone" dataKey="target" name="Target AUM" stroke="#7a95b8" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 4: Risk Profile (RadarChart) */}
              <div className="rc-card lg:col-span-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-[#c8d8ec] flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#ef4444]" /> Risk Exposure
                  </h3>
                  <span className="rc-badge rc-badge-red text-xs">Practice Level</span>
                </div>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={practiceData.riskProfile}>
                      <PolarGrid stroke="#12233e" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#7a95b8', fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                      <Radar name="Current Exposure" dataKey="A" stroke="#ef4444" fill="#ef4444" fillOpacity={0.4} />
                      <Radar name="Target Exposure" dataKey="B" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                      <Legend wrapperStyle={{ fontSize: '10px', color: '#c8d8ec' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 5: Revenue by Product (BarChart Stacked) */}
              <div className="rc-card lg:col-span-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-[#c8d8ec] flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-[#06b6d4]" /> Revenue Breakdown
                  </h3>
                  <span className="rc-badge rc-badge-cyan text-xs">By Category</span>
                </div>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={practiceData.revenueByProduct} layout="vertical" margin={{ top: 5, right: 5, bottom: 5, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#12233e" horizontal={true} vertical={false} />
                      <XAxis type="number" stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `$${(v/1000)}k`} />
                      <YAxis dataKey="name" type="category" stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }}
                        formatter={(v: number) => [`$${v.toLocaleString()}`, undefined]} 
                      />
                      <Legend wrapperStyle={{ fontSize: '10px', color: '#c8d8ec' }} />
                      <Bar dataKey="IUL" stackId="a" fill="#3b82f6" />
                      <Bar dataKey="Term" stackId="a" fill="#60a5fa" />
                      <Bar dataKey="Whole" stackId="a" fill="#93c5fd" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Table 2: Client Activity */}
              <div className="rc-card">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#3b82f6]" /> Client Portal Activity
                  </h3>
                  <button className="text-xs text-[#3b82f6] hover:text-white transition-colors">View All</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-[#7a95b8] bg-[#060d19] border-b border-[#12233e]">
                      <tr>
                        <th className="px-3 py-2 font-medium">Client</th>
                        <th className="px-3 py-2 font-medium">Action</th>
                        <th className="px-3 py-2 font-medium">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientActivity.map((a, i) => (
                        <tr key={i} className="border-b border-[#12233e] hover:bg-[#12233e]/30">
                          <td className="px-3 py-2 text-[#c8d8ec]">{a.client}</td>
                          <td className="px-3 py-2 text-[#7a95b8]">{a.action}</td>
                          <td className="px-3 py-2 text-[#7a95b8] text-xs">{a.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Table 3: Compliance Alerts */}
              <div className="rc-card">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium text-white flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#ef4444]" /> Compliance Alerts
                  </h3>
                  <span className="bg-[#ef4444]/20 text-[#ef4444] text-[10px] px-2 py-0.5 rounded-full font-medium">4 Active</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-[#7a95b8] bg-[#060d19] border-b border-[#12233e]">
                      <tr>
                        <th className="px-3 py-2 font-medium">Issue</th>
                        <th className="px-3 py-2 font-medium">Client</th>
                        <th className="px-3 py-2 font-medium">Severity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {complianceAlerts.map((a, i) => (
                        <tr key={i} className="border-b border-[#12233e] hover:bg-[#12233e]/30">
                          <td className="px-3 py-2 text-[#c8d8ec]">{a.issue}</td>
                          <td className="px-3 py-2 text-[#7a95b8]">{a.client}</td>
                          <td className="px-3 py-2">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${a.severity === 'High' ? 'bg-[#ef4444]/20 text-[#ef4444]' : a.severity === 'Medium' ? 'bg-[#f59e0b]/20 text-[#f59e0b]' : 'bg-[#3b82f6]/20 text-[#3b82f6]'}`}>
                              {a.severity}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "results" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {generateMut.data ? (
                <div className="rc-card border-[#22c55e]/30 relative overflow-hidden h-full">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#22c55e]/50 to-transparent"></div>
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-medium text-white flex items-center gap-2">
                        <CheckCircle2 className="w-6 h-6 text-[#22c55e]" />
                        {generateMut.data.title}
                      </h3>
                      <p className="text-sm text-[#7a95b8] mt-2">
                        Client: {generateMut.data.clientName} | Advisor: {generateMut.data.advisorName}
                      </p>
                      <p className="text-xs text-[#7a95b8] mt-1">
                        ID: {generateMut.data.reportId} · Generated: {new Date(generateMut.data.generatedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        className="rc-btn rc-btn-primary text-sm px-4 py-2"
                        onClick={handleExportPdf}
                        disabled={exportPdfMut.isPending}
                      >
                        {exportPdfMut.isPending ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Exporting...</>
                        ) : (
                          <><Download className="w-4 h-4 mr-2" /> Export to PDF</>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <h4 className="text-sm font-medium text-[#c8d8ec] mb-2">Report Sections</h4>
                    {generateMut.data.sections?.map((s: any, idx: number) => (
                      <div key={s.id} className="rounded-lg bg-[#060d19] border border-[#12233e] overflow-hidden transition-all">
                        <div 
                          className="flex items-center justify-between p-3 cursor-pointer hover:bg-[#12233e]/50"
                          onClick={() => setExpandedSection(expandedSection === s.id ? null : s.id)}
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#12233e] text-xs text-[#7a95b8]">
                              {idx + 1}
                            </span>
                            <span className="text-sm font-medium text-[#c8d8ec] capitalize">
                              {s.id.replace(/_/g, " ")}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#22c55e]/20 text-[#22c55e]">Complete</span>
                            {expandedSection === s.id ? <Minus className="w-4 h-4 text-[#7a95b8]" /> : <Plus className="w-4 h-4 text-[#7a95b8]" />}
                          </div>
                        </div>
                        {expandedSection === s.id && (
                          <div className="p-4 border-t border-[#12233e] bg-[#0a1324] text-sm text-[#7a95b8]">
                            <p>Content preview for {s.id.replace(/_/g, " ")} section. In a real application, this would show a summary or preview of the generated content for this specific section of the report.</p>
                            <div className="mt-3 h-2 bg-[#12233e] rounded-full overflow-hidden">
                              <div className="h-full bg-[#3b82f6] w-[100%]"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rc-card h-full flex flex-col items-center justify-center py-20 text-center">
                  <FileText className="w-16 h-16 text-[#12233e] mb-4" />
                  <h3 className="text-lg font-medium text-[#c8d8ec] mb-2">No Report Generated</h3>
                  <p className="text-sm text-[#7a95b8] max-w-md">
                    Go to the Report Builder tab to configure and generate a new report.
                  </p>
                  <button 
                    className="mt-6 rc-btn rc-btn-primary"
                    onClick={() => setActiveTab("templates")}
                  >
                    Go to Report Builder
                  </button>
                </div>
              )}
            </div>

            <div className="lg:col-span-1 space-y-6">
              {exportPdfMut.data && (
                <div className="rc-card border-[#3b82f6]/30 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#3b82f6]/50 to-transparent"></div>
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <Download className="w-5 h-5 text-[#3b82f6]" />
                    Export Ready
                  </h3>
                  
                  <div className="p-4 rounded-lg bg-[#3b82f6]/10 border border-[#3b82f6]/20 mb-6">
                    <p className="text-sm text-[#c8d8ec] mb-2 font-medium truncate">
                      {exportPdfMut.data.fileName}
                    </p>
                    <div className="flex gap-2">
                      <a 
                        href={exportPdfMut.data.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="rc-btn rc-btn-primary text-xs py-1.5 flex-1 justify-center"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1.5" /> View
                      </a>
                      <a 
                        href={exportPdfMut.data.url} 
                        download
                        className="rc-btn rc-btn-ghost border border-[#12233e] text-xs py-1.5 flex-1 justify-center"
                      >
                        <Download className="w-3.5 h-3.5 mr-1.5" /> Save
                      </a>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-[#c8d8ec]">Share Report</h4>
                    
                    <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                      <DialogTrigger asChild>
                        <button className="rc-btn rc-btn-ghost w-full justify-center border border-[#12233e]">
                          <Mail className="w-4 h-4 mr-2" /> Email to Client
                        </button>
                      </DialogTrigger>
                      <DialogContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                        <DialogHeader>
                          <DialogTitle>Email Report to Client</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <p className="text-sm text-[#c8d8ec]">
                            Send the exported PDF report directly to your client's email address securely.
                          </p>
                          <div>
                            <label className="block text-sm font-medium text-[#c8d8ec] mb-1.5">Recipient Email</label>
                            <Input
                              type="email"
                              placeholder="client@example.com"
                              className="rc-input"
                              value={emailRecipient}
                              onChange={(e) => setEmailRecipient(e.target.value)}
                            />
                          </div>
                          <div className="p-3 rounded-lg bg-[#060d19] border border-[#12233e]">
                            <div className="flex items-center gap-2 text-sm text-[#c8d8ec] mb-1">
                              <ShieldCheck className="w-4 h-4 text-[#22c55e]" /> Secure Delivery Enabled
                            </div>
                            <p className="text-xs text-[#7a95b8]">Link will expire in 7 days and requires client authentication.</p>
                          </div>
                        </div>
                        <DialogFooter className="sm:justify-end gap-2">
                          <DialogClose asChild>
                            <button className="rc-btn rc-btn-ghost">Cancel</button>
                          </DialogClose>
                          <button 
                            className="rc-btn rc-btn-primary" 
                            onClick={handleEmailReport} 
                            disabled={!emailRecipient || emailReportMut.isPending}
                          >
                            {emailReportMut.isPending ? (
                              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                            ) : (
                              <><Send className="w-4 h-4 mr-2" /> Send Email</>
                            )}
                          </button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <button className="rc-btn rc-btn-ghost w-full justify-center border border-[#12233e]">
                      <Globe className="w-4 h-4 mr-2" /> Publish to Portal
                    </button>
                    
                    <button className="rc-btn rc-btn-ghost w-full justify-center border border-[#12233e]">
                      <Database className="w-4 h-4 mr-2" /> Save to Vault
                    </button>
                  </div>
                </div>
              )}

              {/* Table 4: System Logs */}
              <div className="rc-card">
                <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#7a95b8]" /> Audit Log
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-[#7a95b8] bg-[#060d19] border-b border-[#12233e]">
                      <tr>
                        <th className="px-3 py-2 font-medium">Event</th>
                        <th className="px-3 py-2 font-medium">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {systemLogs.slice(0, 4).map((l, i) => (
                        <tr key={i} className="border-b border-[#12233e] hover:bg-[#12233e]/30">
                          <td className="px-3 py-2 text-[#c8d8ec] text-xs">{l.event}</td>
                          <td className="px-3 py-2 text-[#7a95b8] text-xs">{l.time}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="rc-card">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-[#7a95b8]" />
                  Global Report Settings
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-[#c8d8ec] border-b border-[#12233e] pb-2">Assumptions & Projections</h3>
                    
                    <div>
                      <label className="block text-sm text-[#7a95b8] mb-1.5 flex justify-between">
                        <span>Inflation Rate</span>
                        <span className="text-white">{inflationRate}%</span>
                      </label>
                      <input 
                        type="range" 
                        min="0" max="10" step="0.1" 
                        value={inflationRate} 
                        onChange={(e) => setInflationRate(parseFloat(e.target.value))}
                        className="w-full accent-[#22c55e]"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-[#7a95b8] mb-1.5 flex justify-between">
                        <span>Default Tax Bracket</span>
                        <span className="text-white">{taxBracket}%</span>
                      </label>
                      <input 
                        type="range" 
                        min="10" max="37" step="1" 
                        value={taxBracket} 
                        onChange={(e) => setTaxBracket(parseInt(e.target.value))}
                        className="w-full accent-[#3b82f6]"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-[#7a95b8] mb-1.5 flex justify-between">
                        <span>Monte Carlo Confidence</span>
                        <span className="text-white">{confidenceLevel}%</span>
                      </label>
                      <input 
                        type="range" 
                        min="50" max="99" step="1" 
                        value={confidenceLevel} 
                        onChange={(e) => setConfidenceLevel(parseInt(e.target.value))}
                        className="w-full accent-[#f59e0b]"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-[#c8d8ec] border-b border-[#12233e] pb-2">Appearance & Branding</h3>
                    
                    <div>
                      <label className="block text-sm text-[#7a95b8] mb-1.5">Color Theme</label>
                      <div className="flex gap-2">
                        <button 
                          className={`w-8 h-8 rounded-full border-2 ${colorScheme === 'default' ? 'border-white' : 'border-transparent'} bg-gradient-to-br from-[#3b82f6] to-[#22c55e]`}
                          onClick={() => setColorScheme('default')}
                        />
                        <button 
                          className={`w-8 h-8 rounded-full border-2 ${colorScheme === 'corporate' ? 'border-white' : 'border-transparent'} bg-gradient-to-br from-[#1e3a8a] to-[#0f172a]`}
                          onClick={() => setColorScheme('corporate')}
                        />
                        <button 
                          className={`w-8 h-8 rounded-full border-2 ${colorScheme === 'wealth' ? 'border-white' : 'border-transparent'} bg-gradient-to-br from-[#b45309] to-[#000000]`}
                          onClick={() => setColorScheme('wealth')}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-[#7a95b8] mb-1.5">Font Family</label>
                      <select 
                        className="rc-input w-full bg-[#060d19] border-[#12233e] text-white h-10 px-3 rounded-md"
                        value={fontFamily}
                        onChange={(e) => setFontFamily(e.target.value)}
                      >
                        <option value="inter">Inter (Modern)</option>
                        <option value="merriweather">Merriweather (Classic)</option>
                        <option value="roboto">Roboto (Clean)</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#7a95b8]">Watermark Text</span>
                      <Input 
                        className="rc-input w-32 h-8 text-xs" 
                        value={watermark} 
                        onChange={(e) => setWatermark(e.target.value)} 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Table 5: Upcoming Reviews */}
              <div className="rc-card">
                <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#3b82f6]" /> Upcoming Client Reviews
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-[#7a95b8] bg-[#060d19] border-b border-[#12233e]">
                      <tr>
                        <th className="px-3 py-2 font-medium">Client</th>
                        <th className="px-3 py-2 font-medium">Review Type</th>
                        <th className="px-3 py-2 font-medium">Date</th>
                        <th className="px-3 py-2 font-medium">Prep Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {upcomingReviews.map((r, i) => (
                        <tr key={i} className="border-b border-[#12233e] hover:bg-[#12233e]/30">
                          <td className="px-3 py-2 text-[#c8d8ec]">{r.client}</td>
                          <td className="px-3 py-2 text-[#7a95b8]">{r.type}</td>
                          <td className="px-3 py-2 text-[#7a95b8]">{r.date}</td>
                          <td className="px-3 py-2">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${r.prepStatus === 'Ready' ? 'bg-[#22c55e]/20 text-[#22c55e]' : r.prepStatus === 'In Progress' ? 'bg-[#3b82f6]/20 text-[#3b82f6]' : 'bg-[#ef4444]/20 text-[#ef4444]'}`}>
                              {r.prepStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1 space-y-6">
              <div className="rc-card">
                <h3 className="text-sm font-medium text-white mb-4">Export Preferences</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2 rounded bg-[#060d19] border border-[#12233e]">
                    <span className="text-xs text-[#c8d8ec]">Page Numbers</span>
                    <button 
                      className={`w-8 h-4 rounded-full relative transition-colors ${showPageNumbers ? 'bg-[#22c55e]' : 'bg-[#12233e]'}`}
                      onClick={() => setShowPageNumbers(!showPageNumbers)}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${showPageNumbers ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 rounded bg-[#060d19] border border-[#12233e]">
                    <span className="text-xs text-[#c8d8ec]">Print Date</span>
                    <button 
                      className={`w-8 h-4 rounded-full relative transition-colors ${showDate ? 'bg-[#22c55e]' : 'bg-[#12233e]'}`}
                      onClick={() => setShowDate(!showDate)}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${showDate ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-2 rounded bg-[#060d19] border border-[#12233e]">
                    <span className="text-xs text-[#c8d8ec]">Advisor Name</span>
                    <button 
                      className={`w-8 h-4 rounded-full relative transition-colors ${showAuthor ? 'bg-[#22c55e]' : 'bg-[#12233e]'}`}
                      onClick={() => setShowAuthor(!showAuthor)}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${showAuthor ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  <div className="pt-2">
                    <button className="rc-btn rc-btn-primary w-full justify-center py-2 text-xs">
                      Save Preferences
                    </button>
                  </div>
                </div>
              </div>

              {/* Table 6: System Performance */}
              <div className="rc-card">
                <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#f59e0b]" /> System Health
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-[#7a95b8] bg-[#060d19] border-b border-[#12233e]">
                      <tr>
                        <th className="px-3 py-2 font-medium">Metric</th>
                        <th className="px-3 py-2 font-medium">Value</th>
                        <th className="px-3 py-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {performanceMetrics.map((m, i) => (
                        <tr key={i} className="border-b border-[#12233e] hover:bg-[#12233e]/30">
                          <td className="px-3 py-2 text-[#c8d8ec] text-xs">{m.metric || m.portal}</td>
                          <td className="px-3 py-2 text-[#7a95b8] text-xs font-mono">{m.value}</td>
                          <td className="px-3 py-2">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${m.status === 'Excellent' || m.status === 'Good' ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-[#f59e0b]/20 text-[#f59e0b]'}`}>
                              {m.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8">
          <NAICDisclaimer variant="compact" showsProjections={showProjections} />
        </div>
      </div>
      <PageInsights pageId="advanced-reporting" />
    </AppShell>
  );
}
