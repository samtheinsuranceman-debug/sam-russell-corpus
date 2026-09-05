// @ts-nocheck
import { NumberInput } from "@/components/NumberInput";
import { useState, useMemo, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { ExportToSlides } from "@/components/ExportToSlides";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { PageInsights } from "@/components/PageInsights";
import {
  FileText,
  Download,
  Eye,
  Settings,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Printer,
  BarChart3,
  Activity,
  List,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ComposedChart, Scatter
} from "recharts";

const REPORT_SECTIONS = [{ id: "cover", label: "Cover Page", icon: FileText, description: "Branded cover with client name, advisor info, and date" },
,
  { id: "executive", label: "Executive Summary", icon: Eye, description: "System-generated summary of key findings and recommendations" },
,
  { id: "netWorth", label: "Net Worth Analysis", icon: DollarSign, description: "Current assets, liabilities, and net worth breakdown" },
,
  { id: "taxWaterfall", label: "Tax Waterfall Analysis", icon: BarChart3, description: "Income flow through tax brackets with optimization strategies" },
,
  { id: "iulProjection", label: "IUL Illustration", icon: TrendingUp, description: "Indexed Universal Life policy projection with credited rates" }
];

const REPORT_THEMES = [
  { id: "professional", label: "Professional Navy", primary: "#1e3a5f", accent: "#c9a84c", description: "Classic navy and gold" },
  { id: "modern", label: "Modern Dark", primary: "#0f172a", accent: "#22c55e", description: "Dark theme with green accent" },
  { id: "clean", label: "Clean White", primary: "#1a1a2e", accent: "#3b82f6", description: "Light background, blue accent" },
  { id: "wealth", label: "Wealth Management", primary: "#1c1c1c", accent: "#d4af37", description: "Black and gold luxury" },
];

const COLORS = ['#1e3a5f', '#c9a84c', '#22c55e', '#3b82f6', '#d4af37', '#f43f5e', '#8b5cf6'];

export default function ClientReportGenerator() {
  const { user } = useAuth();
  
  const clientsQuery = trpc.clients.list.useQuery();
  const notesQuery = trpc.notes.list.useQuery({ clientId: 0 });
  const activityQuery = trpc.activity.list.useQuery();
  const reportMutation = trpc.reports.create.useMutation();
  const settingsQuery = trpc.workspace.getSettings.useQuery();

  const [clientName, setClientName] = useState("John & Jane Smith");
  const [clientAge, setClientAge] = useState<number>(55);
  const [spouseAge, setSpouseAge] = useState<number>(52);
  const [advisorName, setAdvisorName] = useState("Samuel A. Russell V");
  const [advisorTitle, setAdvisorTitle] = useState("Senior Financial Strategist");
  const [firmName, setFirmName] = useState("Russell Capital Systems™");
  const [selectedTheme, setSelectedTheme] = useState("professional");
  const [selectedSections, setSelectedSections] = useState<Record<string, boolean>>(
    Object.fromEntries(REPORT_SECTIONS.map((s) => [s.id, true]))
  );
  const [customNotes, setCustomNotes] = useState("");
  const [reportFormat, setReportFormat] = useState("pdf");
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  
  const [includeCoverPage, setIncludeCoverPage] = useState(true);
  const [includeToc, setIncludeToc] = useState(true);
  const [includeDisclosures, setIncludeDisclosures] = useState(true);
  const [showPageNumbers, setShowPageNumbers] = useState(true);
  const [watermark, setWatermark] = useState("CONFIDENTIAL");
  const [headerText, setHeaderText] = useState("Financial Plan");
  const [footerText, setFooterText] = useState("Russell Capital Systems™");
  const [fontSize, setFontSize] = useState("12");
  const [marginSize, setMarginSize] = useState("normal");
  const [orientation, setOrientation] = useState("portrait");
  const [paperSize, setPaperSize] = useState("letter");
  const [colorMode, setColorMode] = useState("color");
  const [chartStyle, setChartStyle] = useState("modern");
  const [tableStyle, setTableStyle] = useState("striped");
  const [coverLayout, setCoverLayout] = useState("centered");
  const [bindingMargin, setBindingMargin] = useState(false);
  const [twoSided, setTwoSided] = useState(false);
  const [highQuality, setHighQuality] = useState(true);
  const [compressImages, setCompressImages] = useState(false);
  const [embedFonts, setEmbedFonts] = useState(true);
  const [passwordProtect, setPasswordProtect] = useState(false);
  const [reportPassword, setReportPassword] = useState("");
  const [allowPrinting, setAllowPrinting] = useState(true);
  const [allowCopying, setAllowCopying] = useState(true);
  const [addSignatureBlock, setAddSignatureBlock] = useState(false);
  const [signatureCount, setSignatureCount] = useState<number>(2);
  const [includeAppendix, setIncludeAppendix] = useState(false);
  const [appendixTitle, setAppendixTitle] = useState("Appendix");
  const [showDate, setShowDate] = useState(true);
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");
  const [showTime, setShowTime] = useState(false);
  

  const sampleData = useMemo(() => ({
    netWorth: {
      totalAssets: 4250000,
      totalLiabilities: 850000,
      netWorth: 3400000,
      assets: [
        { category: "Real Estate", value: 1200000, pct: 28.2 },
        { category: "Retirement Accounts", value: 1450000, pct: 34.1 },
        { category: "Investment Accounts", value: 800000, pct: 18.8 },
        { category: "Life Insurance CV", value: 350000, pct: 8.2 },
        { category: "Business Interest", value: 300000, pct: 7.1 },
        { category: "Cash & Savings", value: 150000, pct: 3.5 },
      ],
      history: [
        { year: 2020, assets: 3000000, liabilities: 1000000, netWorth: 2000000 },
        { year: 2021, assets: 3400000, liabilities: 950000, netWorth: 2450000 },
        { year: 2022, assets: 3200000, liabilities: 900000, netWorth: 2300000 },
        { year: 2023, assets: 3800000, liabilities: 880000, netWorth: 2920000 },
        { year: 2024, assets: 4250000, liabilities: 850000, netWorth: 3400000 },
      ]
    },
    taxAnalysis: {
      currentBracket: "32%",
      effectiveRate: "24.3%",
      totalTax: 97200,
      optimizedTax: 72400,
      savings: 24800,
      strategies: ["Roth Conversion Ladder", "IUL Tax-Free Loans", "Charitable Remainder Trust"],
      brackets: [
        { bracket: "10%", amount: 22000, tax: 2200 },
        { bracket: "12%", amount: 67450, tax: 8094 },
        { bracket: "22%", amount: 101300, tax: 22286 },
        { bracket: "24%", amount: 173350, tax: 41604 },
        { bracket: "32%", amount: 35900, tax: 11488 },
      ]
    },
    iulProjection: {
      premium: 50000,
      years: 20,
      illustratedValue: 1847000,
      deathBenefit: 3500000,
      taxFreeIncome: 125000,
      creditingRate: "6.5%",
      projectionData: Array.from({ length: 30 }, (_, i) => ({
        year: i + 1,
        age: 55 + i,
        premium: i < 20 ? 50000 : 0,
        cashValue: Math.round(50000 * (i < 20 ? i + 1 : 20) * Math.pow(1.065, i)),
        deathBenefit: Math.max(3500000, Math.round(50000 * (i < 20 ? i + 1 : 20) * Math.pow(1.065, i) * 1.2)),
        income: i >= 20 ? 125000 : 0
      }))
    },
    socialSecurity: {
      husbandPIA: 3200,
      wifePIA: 1800,
      optimalStrategy: "Husband claims at 70, Wife claims at 67",
      lifetimeBenefit: 1245000,
      vsEarly: 312000,
      breakevenData: Array.from({ length: 25 }, (_, i) => ({
        age: 62 + i,
        early: Math.round((3200 * 0.7 + 1800 * 0.7) * 12 * (i + 1)),
        fra: i >= 5 ? Math.round((3200 + 1800) * 12 * i) : 0,
        delayed: i >= 8 ? Math.round((3200 * 1.24 + 1800) * 12 * (i - 3)) : 0,
      }))
    },
    estateTax: {
      grossEstate: 8500000,
      projectedEstate2035: 18300000,
      taxExposure: 1872000,
      withPlanning: 0,
      savings: 1872000,
      growthData: Array.from({ length: 20 }, (_, i) => ({
        year: 2025 + i,
        estateValue: Math.round(8500000 * Math.pow(1.05, i)),
        exemption: 27000000 * Math.pow(1.02, i), // Assuming sunset doesn't happen for illustration
        taxExposure: Math.max(0, Math.round((8500000 * Math.pow(1.05, i) - 27000000 * Math.pow(1.02, i)) * 0.4))
      }))
    },
  }), []);

  const activeSections = REPORT_SECTIONS.filter((s) => selectedSections[s.id]);
  const currentTheme = REPORT_THEMES.find((t) => t.id === selectedTheme) || REPORT_THEMES[0];

  const handleGenerate = () => {
    setIsGenerating(true);
    reportMutation.mutate({
      title: `Client Report - ${clientName}`,
      content: "Report generated",
      type: "client_report"
    }, {
      onSettled: () => {
        setTimeout(() => {
          setIsGenerating(false);
          setPreviewMode(true);
        }, 2000);
      }
    });
  };

  const toggleSection = (id: string) => {
    setSelectedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };


  return (
    <AppShell>
      <div className="space-y-6 p-6 rc-page-wrapper">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 rc-page-title text-white">
              <FileText className="h-6 w-6 text-primary" />
              Client Report Generator
            </h1>
            <p className="rc-page-subtitle text-[#7a95b8] mt-1">
              Create compliance-ready, branded PDF reports combining data from multiple calculators
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="rc-btn rc-btn-ghost" onClick={() => setPreviewMode(!previewMode)}>
              <Eye className="h-4 w-4 mr-2" />
              {previewMode ? "Edit Mode" : "Preview"}
            </Button>
            <Button className="rc-btn rc-btn-primary" onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? (
                <>Generating...</>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
            <ExportToSlides
              toolName="Client Report Generator"
              getSections={() => [
                {
                  title: "Client Info",
                  items: [
                    { label: "Client Name", value: clientName },
                    { label: "Client Age", value: clientAge.toString() },
                    { label: "Spouse Age", value: spouseAge.toString() }
                  ]
                },
                {
                  title: "Advisor Info",
                  items: [
                    { label: "Advisor Name", value: advisorName },
                    { label: "Advisor Title", value: advisorTitle },
                    { label: "Firm Name", value: firmName }
                  ]
                },
                {
                  title: "Report Configuration",
                  items: [
                    { label: "Selected Theme", value: currentTheme.label },
                    { label: "Sections Included", value: activeSections.length.toString() },
                    { label: "Format", value: reportFormat.toUpperCase() }
                  ]
                }
              ]}
            />
          </div>
        </div>

        <Tabs defaultValue="content" className="space-y-4">
          <TabsList className="flex flex-wrap gap-1 h-auto p-1 bg-[#0d1a2e] border border-[#12233e] rounded-lg">
            <TabsTrigger value="content" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white text-[#7a95b8]">Report Content</TabsTrigger>
            <TabsTrigger value="client" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white text-[#7a95b8]">Client Info</TabsTrigger>
            <TabsTrigger value="branding" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white text-[#7a95b8]">Branding</TabsTrigger>
            <TabsTrigger value="advanced" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white text-[#7a95b8]">Advanced Settings</TabsTrigger>
            <TabsTrigger value="preview" className="data-[state=active]:bg-[#1e3a5f] data-[state=active]:text-white text-[#7a95b8]">Live Preview</TabsTrigger>
          </TabsList>

          {/* Report Content Tab */}
          <TabsContent value="content" className="space-y-4">
            <Card className="rc-card">
              <CardHeader>
                <CardTitle className="text-white">Report Sections</CardTitle>
                <CardDescription className="text-[#7a95b8]">
                  Select which sections to include in the client report. Each section pulls data from the corresponding calculator.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {REPORT_SECTIONS.map((section) => {
                    const Icon = section.icon;
                    return (
                      <div
                        key={section.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedSections[section.id]
                            ? "border-primary bg-primary/5"
                            : "border-[#12233e] hover:border-muted-foreground/30 bg-[#0a1120]"
                        }`}
                        onClick={() => toggleSection(section.id)}
                      >
                        <div className={`mt-0.5 ${selectedSections[section.id] ? "text-primary" : "text-muted-foreground"}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className={`font-medium text-sm ${selectedSections[section.id] ? "text-white" : "text-[#c8d8ec]"}`}>
                            {section.label}
                          </div>
                          <div className="text-xs text-[#7a95b8] mt-1 line-clamp-2">
                            {section.description}
                          </div>
                        </div>
                        <div className="ml-auto">
                          <Switch checked={selectedSections[section.id]} onCheckedChange={() => toggleSection(section.id)} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Client Info Tab */}
          <TabsContent value="client" className="space-y-4">
            <Card className="rc-card">
              <CardHeader>
                <CardTitle className="text-white">Client Information</CardTitle>
                <CardDescription className="text-[#7a95b8]">Basic details that will appear on the cover page and throughout the report.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-[#c8d8ec]">Client Name(s)</Label>
                    <Input value={clientName} onChange={(e) => setClientName(e.target.value)} className="bg-[#0a1120] border-[#12233e] text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#c8d8ec]">Primary Client Age</Label>
                    <NumberInput value={clientAge} onChange={setClientAge} className="bg-[#0a1120] border-[#12233e] text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#c8d8ec]">Spouse Age (if applicable)</Label>
                    <NumberInput value={spouseAge} onChange={setSpouseAge} className="bg-[#0a1120] border-[#12233e] text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#c8d8ec]">Report Date</Label>
                    <Input type="date" className="bg-[#0a1120] border-[#12233e] text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#c8d8ec]">Custom Notes / Executive Summary Override</Label>
                  <Textarea 
                    value={customNotes} 
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder="Enter any custom notes or summary text to include in the report..."
                    className="min-h-[100px] bg-[#0a1120] border-[#12233e] text-white"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rc-card">
              <CardHeader>
                <CardTitle className="text-white">Advisor Information</CardTitle>
                <CardDescription className="text-[#7a95b8]">Your details as they will appear on the report.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-[#c8d8ec]">Advisor Name</Label>
                    <Input value={advisorName} onChange={(e) => setAdvisorName(e.target.value)} className="bg-[#0a1120] border-[#12233e] text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#c8d8ec]">Advisor Title</Label>
                    <Input value={advisorTitle} onChange={(e) => setAdvisorTitle(e.target.value)} className="bg-[#0a1120] border-[#12233e] text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#c8d8ec]">Firm Name</Label>
                    <Input value={firmName} onChange={(e) => setFirmName(e.target.value)} className="bg-[#0a1120] border-[#12233e] text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#c8d8ec]">Contact Email</Label>
                    <Input type="email" placeholder="advisor@firm.com" className="bg-[#0a1120] border-[#12233e] text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Branding Tab */}
          <TabsContent value="branding" className="space-y-4">
            <Card className="rc-card">
              <CardHeader>
                <CardTitle className="text-white">Visual Theme</CardTitle>
                <CardDescription className="text-[#7a95b8]">Select a color palette for the report.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {REPORT_THEMES.map((theme) => (
                    <div
                      key={theme.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedTheme === theme.id
                          ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                          : "border-[#12233e] hover:border-muted-foreground/30 bg-[#0a1120]"
                      }`}
                      onClick={() => setSelectedTheme(theme.id)}
                    >
                      <div className="flex gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full shadow-sm" style={{ backgroundColor: theme.primary }} />
                        <div className="w-8 h-8 rounded-full shadow-sm" style={{ backgroundColor: theme.accent }} />
                      </div>
                      <div className={`font-medium text-sm ${selectedTheme === theme.id ? "text-white" : "text-[#c8d8ec]"}`}>
                        {theme.label}
                      </div>
                      <div className="text-xs text-[#7a95b8] mt-1">{theme.description}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card className="rc-card">
              <CardHeader>
                <CardTitle className="text-white">Output Format</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[#c8d8ec]">Format</Label>
                    <Select value={reportFormat} onValueChange={setReportFormat}>
                      <SelectTrigger className="bg-[#0a1120] border-[#12233e] text-white">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF Document (Recommended)</SelectItem>
                        <SelectItem value="ppt">PowerPoint Presentation</SelectItem>
                        <SelectItem value="word">Word Document</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border border-[#12233e] rounded-lg bg-[#0a1120]">
                    <div className="space-y-0.5">
                      <Label className="text-white">Include Cover Page</Label>
                      <div className="text-xs text-[#7a95b8]">Add a branded cover page with client details</div>
                    </div>
                    <Switch checked={includeCoverPage} onCheckedChange={setIncludeCoverPage} />
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border border-[#12233e] rounded-lg bg-[#0a1120]">
                    <div className="space-y-0.5">
                      <Label className="text-white">Table of Contents</Label>
                      <div className="text-xs text-[#7a95b8]">Automatically generate a table of contents</div>
                    </div>
                    <Switch checked={includeToc} onCheckedChange={setIncludeToc} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Settings Tab */}
          <TabsContent value="advanced" className="space-y-4">
            <Card className="rc-card">
              <CardHeader>
                <CardTitle className="text-white">Document Settings</CardTitle>
                <CardDescription className="text-[#7a95b8]">Fine-tune the appearance and structure of the report.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-2">
                  {/* Left Column */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[#c8d8ec]">Paper Size</Label>
                      <Select value={paperSize} onValueChange={setPaperSize}>
                        <SelectTrigger className="bg-[#0a1120] border-[#12233e] text-white">
                          <SelectValue placeholder="Select paper size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="letter">Letter (8.5" x 11")</SelectItem>
                          <SelectItem value="legal">Legal (8.5" x 14")</SelectItem>
                          <SelectItem value="a4">A4 (210 x 297 mm)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-[#c8d8ec]">Orientation</Label>
                      <Select value={orientation} onValueChange={setOrientation}>
                        <SelectTrigger className="bg-[#0a1120] border-[#12233e] text-white">
                          <SelectValue placeholder="Select orientation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="portrait">Portrait</SelectItem>
                          <SelectItem value="landscape">Landscape</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#c8d8ec]">Margins</Label>
                      <Select value={marginSize} onValueChange={setMarginSize}>
                        <SelectTrigger className="bg-[#0a1120] border-[#12233e] text-white">
                          <SelectValue placeholder="Select margin size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal (1")</SelectItem>
                          <SelectItem value="narrow">Narrow (0.5")</SelectItem>
                          <SelectItem value="wide">Wide (1.5")</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#c8d8ec]">Base Font Size</Label>
                      <Select value={fontSize} onValueChange={setFontSize}>
                        <SelectTrigger className="bg-[#0a1120] border-[#12233e] text-white">
                          <SelectValue placeholder="Select font size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10 pt</SelectItem>
                          <SelectItem value="11">11 pt</SelectItem>
                          <SelectItem value="12">12 pt</SelectItem>
                          <SelectItem value="14">14 pt</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#c8d8ec]">Header Text</Label>
                      <Input value={headerText} onChange={(e) => setHeaderText(e.target.value)} className="bg-[#0a1120] border-[#12233e] text-white" />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#c8d8ec]">Footer Text</Label>
                      <Input value={footerText} onChange={(e) => setFooterText(e.target.value)} className="bg-[#0a1120] border-[#12233e] text-white" />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[#c8d8ec]">Chart Style</Label>
                      <Select value={chartStyle} onValueChange={setChartStyle}>
                        <SelectTrigger className="bg-[#0a1120] border-[#12233e] text-white">
                          <SelectValue placeholder="Select chart style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="modern">Modern (Flat)</SelectItem>
                          <SelectItem value="classic">Classic (3D)</SelectItem>
                          <SelectItem value="minimal">Minimalist</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#c8d8ec]">Table Style</Label>
                      <Select value={tableStyle} onValueChange={setTableStyle}>
                        <SelectTrigger className="bg-[#0a1120] border-[#12233e] text-white">
                          <SelectValue placeholder="Select table style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="striped">Striped Rows</SelectItem>
                          <SelectItem value="bordered">Bordered</SelectItem>
                          <SelectItem value="clean">Clean (No Borders)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#c8d8ec]">Watermark Text</Label>
                      <Input value={watermark} onChange={(e) => setWatermark(e.target.value)} placeholder="e.g. DRAFT" className="bg-[#0a1120] border-[#12233e] text-white" />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[#c8d8ec]">Color Mode</Label>
                      <Select value={colorMode} onValueChange={setColorMode}>
                        <SelectTrigger className="bg-[#0a1120] border-[#12233e] text-white">
                          <SelectValue placeholder="Select color mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="color">Full Color</SelectItem>
                          <SelectItem value="grayscale">Grayscale</SelectItem>
                          <SelectItem value="bw">Black & White</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center justify-between p-3 border border-[#12233e] rounded-lg bg-[#0a1120]">
                      <div className="space-y-0.5">
                        <Label className="text-white">Show Page Numbers</Label>
                      </div>
                      <Switch checked={showPageNumbers} onCheckedChange={setShowPageNumbers} />
                    </div>

                    <div className="flex items-center justify-between p-3 border border-[#12233e] rounded-lg bg-[#0a1120]">
                      <div className="space-y-0.5">
                        <Label className="text-white">Two-Sided Printing</Label>
                      </div>
                      <Switch checked={twoSided} onCheckedChange={setTwoSided} />
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-[#12233e] grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <Switch checked={highQuality} onCheckedChange={setHighQuality} />
                    <Label className="text-[#c8d8ec]">High Quality Print</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={compressImages} onCheckedChange={setCompressImages} />
                    <Label className="text-[#c8d8ec]">Compress Images</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={embedFonts} onCheckedChange={setEmbedFonts} />
                    <Label className="text-[#c8d8ec]">Embed Fonts</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={passwordProtect} onCheckedChange={setPasswordProtect} />
                    <Label className="text-[#c8d8ec]">Password Protect</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={allowPrinting} onCheckedChange={setAllowPrinting} />
                    <Label className="text-[#c8d8ec]">Allow Printing</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={allowCopying} onCheckedChange={setAllowCopying} />
                    <Label className="text-[#c8d8ec]">Allow Copying</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Live Preview Tab */}
          <TabsContent value="preview" className="space-y-4">
            <div className="grid gap-6">
              {/* Cover Page Preview */}
              {selectedSections.cover && (
                <Card className="border-[#12233e] bg-[#0d1a2e]">
                  <CardHeader>
                    <CardTitle className="text-white">Cover Page Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-[8.5/11] bg-white rounded-lg p-12 flex flex-col justify-center items-center text-center relative overflow-hidden" style={{ borderTop: `8px solid ${currentTheme.primary}` }}>
                      <div className="absolute top-0 left-0 w-full h-32 opacity-10" style={{ backgroundColor: currentTheme.primary }}></div>
                      <div className="z-10 w-full">
                        <h2 className="text-4xl font-serif text-slate-900 mb-2">{headerText}</h2>
                        <div className="w-24 h-1 mx-auto my-8" style={{ backgroundColor: currentTheme.accent }}></div>
                        <h1 className="text-5xl font-bold text-slate-900 mb-6">{clientName}</h1>
                        <p className="text-xl text-slate-600 mb-16">Prepared specially for you</p>
                        
                        <div className="mt-auto pt-24">
                          <p className="text-lg font-bold text-slate-800">{advisorName}</p>
                          <p className="text-md text-slate-600">{advisorTitle}</p>
                          <p className="text-md text-slate-600 font-medium mt-2">{firmName}</p>
                          <p className="text-sm text-slate-400 mt-8">Generated on {new Date().toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Net Worth Preview */}
              {selectedSections.netWorth && (
                <Card className="border-[#12233e] bg-[#0d1a2e]">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-6 rounded" style={{ backgroundColor: currentTheme.accent }} />
                      <CardTitle className="text-white">Net Worth Analysis</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-3 mb-6">
                      <div className="p-4 rounded-lg border border-[#12233e] bg-[#0a1120]">
                        <div className="text-xs text-[#7a95b8]">Total Assets</div>
                        <div className="text-xl font-bold text-white">${(sampleData.netWorth.totalAssets / 1000000).toFixed(1)}M</div>
                      </div>
                      <div className="p-4 rounded-lg border border-[#12233e] bg-[#0a1120]">
                        <div className="text-xs text-[#7a95b8]">Total Liabilities</div>
                        <div className="text-xl font-bold text-white">${(sampleData.netWorth.totalLiabilities / 1000).toFixed(0)}K</div>
                      </div>
                      <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
                        <div className="text-xs text-[#7a95b8]">Net Worth</div>
                        <div className="text-xl font-bold text-primary">${(sampleData.netWorth.netWorth / 1000000).toFixed(1)}M</div>
                      </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                      {/* Recharts 1: Net Worth History */}
                      <div className="h-[300px] w-full">
                        <h3 className="text-sm font-medium text-white mb-4">Net Worth Growth</h3>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={sampleData.netWorth.history} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={currentTheme.primary} stopOpacity={0.8}/>
                                <stop offset="95%" stopColor={currentTheme.primary} stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                            <XAxis dataKey="year" stroke="#7a95b8" />
                            <YAxis stroke="#7a95b8" tickFormatter={(val) => `$${(val/1000000).toFixed(1)}M`} />
                            <RechartsTooltip 
                              contentStyle={{ backgroundColor: '#0a1120', borderColor: '#12233e', color: '#fff' }}
                              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Net Worth']}
                            />
                            <Area type="monotone" dataKey="netWorth" stroke={currentTheme.primary} fillOpacity={1} fill="url(#colorNetWorth)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Recharts 2: Asset Allocation */}
                      <div className="h-[300px] w-full">
                        <h3 className="text-sm font-medium text-white mb-4">Asset Allocation</h3>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={sampleData.netWorth.assets}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {sampleData.netWorth.assets.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip 
                              contentStyle={{ backgroundColor: '#0a1120', borderColor: '#12233e', color: '#fff' }}
                              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
                            />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Data Table 1: Asset Details */}
                    <div className="mt-6 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-[#12233e]">
                            <th className="text-left py-2 font-medium text-[#c8d8ec]">Asset Category</th>
                            <th className="text-right py-2 font-medium text-[#c8d8ec]">Value</th>
                            <th className="text-right py-2 font-medium text-[#c8d8ec]">% of Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sampleData.netWorth.assets.map((a, i) => (
                            <tr key={a.category} className="border-b border-[#12233e]">
                              <td className="py-2 text-[#7a95b8]">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                  {a.category}
                                </div>
                              </td>
                              <td className="text-right py-2 text-[#c8d8ec]">${(a.value / 1000).toFixed(0)}K</td>
                              <td className="text-right py-2">
                                <div className="flex items-center justify-end gap-2">
                                  <div className="w-16 h-2 bg-[#12233e] rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${a.pct}%`, backgroundColor: currentTheme.accent }} />
                                  </div>
                                  <span className="text-xs text-[#7a95b8] w-10 text-right">{a.pct}%</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tax Analysis Preview */}
              {selectedSections.taxWaterfall && (
                <Card className="border-[#12233e] bg-[#0d1a2e]">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-6 rounded" style={{ backgroundColor: currentTheme.accent }} />
                      <CardTitle className="text-white">Tax Optimization Analysis</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 mb-6">
                      <div className="p-4 rounded-lg border border-[#12233e] bg-[#0a1120]">
                        <div className="text-xs text-[#7a95b8] mb-1">Current Tax Burden</div>
                        <div className="text-2xl font-bold text-red-400">${sampleData.taxAnalysis.totalTax.toLocaleString()}</div>
                        <div className="text-xs text-[#7a95b8]">
                          Marginal: {sampleData.taxAnalysis.currentBracket} | Effective: {sampleData.taxAnalysis.effectiveRate}
                        </div>
                      </div>
                      <div className="p-4 rounded-lg border border-[#22c55e]/30 bg-[#0a1120]">
                        <div className="text-xs text-[#7a95b8] mb-1">Optimized Tax Burden</div>
                        <div className="text-2xl font-bold text-[#22c55e]">${sampleData.taxAnalysis.optimizedTax.toLocaleString()}</div>
                        <div className="text-xs text-[#22c55e]">
                          Annual savings: ${sampleData.taxAnalysis.savings.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                      {/* Recharts 3: Tax Brackets */}
                      <div className="h-[300px] w-full">
                        <h3 className="text-sm font-medium text-white mb-4">Income by Tax Bracket</h3>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={sampleData.taxAnalysis.brackets} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                            <XAxis type="number" stroke="#7a95b8" />
                            <YAxis dataKey="bracket" type="category" stroke="#7a95b8" />
                            <RechartsTooltip 
                              contentStyle={{ backgroundColor: '#0a1120', borderColor: '#12233e', color: '#fff' }}
                              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Income in Bracket']}
                            />
                            <Bar dataKey="amount" fill={currentTheme.primary} radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Data Table 2: Tax Bracket Details */}
                      <div className="overflow-x-auto">
                        <h3 className="text-sm font-medium text-white mb-4">Bracket Breakdown</h3>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-[#12233e]">
                              <th className="text-left py-2 font-medium text-[#c8d8ec]">Bracket</th>
                              <th className="text-right py-2 font-medium text-[#c8d8ec]">Income</th>
                              <th className="text-right py-2 font-medium text-[#c8d8ec]">Tax Paid</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sampleData.taxAnalysis.brackets.map((b, i) => (
                              <tr key={i} className="border-b border-[#12233e]">
                                <td className="py-2 text-[#7a95b8]">{b.bracket}</td>
                                <td className="text-right py-2 text-[#c8d8ec]">${b.amount.toLocaleString()}</td>
                                <td className="text-right py-2 text-red-400">${b.tax.toLocaleString()}</td>
                              </tr>
                            ))}
                            <tr className="font-bold">
                              <td className="py-2 text-white">Total</td>
                              <td className="text-right py-2 text-white">${sampleData.taxAnalysis.brackets.reduce((sum, b) => sum + b.amount, 0).toLocaleString()}</td>
                              <td className="text-right py-2 text-red-400">${sampleData.taxAnalysis.totalTax.toLocaleString()}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="mt-6 space-y-2">
                      <div className="text-sm font-medium text-[#c8d8ec]">Recommended Strategies:</div>
                      {sampleData.taxAnalysis.strategies.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-[#7a95b8]">
                          <CheckCircle2 className="h-4 w-4 text-[#22c55e]" />
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* IUL Projection Preview */}
              {selectedSections.iulProjection && (
                <Card className="border-[#12233e] bg-[#0d1a2e]">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-6 rounded" style={{ backgroundColor: currentTheme.accent }} />
                      <CardTitle className="text-white">IUL Policy Illustration</CardTitle>
                    </div>
                    <CardDescription className="text-[#7a95b8]">Illustrated values based on current non-guaranteed elements</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-4 mb-6">
                      <div className="p-3 rounded-lg border border-[#12233e] bg-[#0a1120]">
                        <div className="text-xs text-[#7a95b8]">Annual Premium</div>
                        <div className="text-lg font-bold text-white">${sampleData.iulProjection.premium.toLocaleString()}</div>
                      </div>
                      <div className="p-3 rounded-lg border border-[#12233e] bg-[#0a1120]">
                        <div className="text-xs text-[#7a95b8]">Illustrated Policy Value (Yr {sampleData.iulProjection.years})</div>
                        <div className="text-lg font-bold text-primary">${(sampleData.iulProjection.illustratedValue / 1000).toFixed(0)}K</div>
                      </div>
                      <div className="p-3 rounded-lg border border-[#12233e] bg-[#0a1120]">
                        <div className="text-xs text-[#7a95b8]">Death Benefit</div>
                        <div className="text-lg font-bold text-white">${(sampleData.iulProjection.deathBenefit / 1000000).toFixed(1)}M</div>
                      </div>
                      <div className="p-3 rounded-lg border border-[#22c55e]/30 bg-[#0a1120]">
                        <div className="text-xs text-[#7a95b8]">Tax-Free Income Potential</div>
                        <div className="text-lg font-bold text-[#22c55e]">${(sampleData.iulProjection.taxFreeIncome / 1000).toFixed(0)}K/yr</div>
                      </div>
                    </div>

                    {/* Recharts 4: IUL Projection */}
                    <div className="h-[350px] w-full mb-6">
                      <h3 className="text-sm font-medium text-white mb-4">Policy Value & Death Benefit Projection</h3>
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={sampleData.iulProjection.projectionData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                          <XAxis dataKey="age" stroke="#7a95b8" label={{ value: 'Age', position: 'insideBottomRight', offset: -10, fill: '#7a95b8' }} />
                          <YAxis yAxisId="left" stroke="#7a95b8" tickFormatter={(val) => `$${(val/1000000).toFixed(1)}M`} />
                          <YAxis yAxisId="right" orientation="right" stroke="#7a95b8" tickFormatter={(val) => `$${(val/1000).toFixed(0)}K`} />
                          <RechartsTooltip 
                            contentStyle={{ backgroundColor: '#0a1120', borderColor: '#12233e', color: '#fff' }}
                            formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name === 'cashValue' ? 'Cash Value' : name === 'deathBenefit' ? 'Death Benefit' : name === 'premium' ? 'Premium' : 'Income']}
                          />
                          <Legend />
                          <Bar yAxisId="right" dataKey="premium" name="Premium" fill="#3b82f6" stackId="a" />
                          <Bar yAxisId="right" dataKey="income" name="Income" fill="#22c55e" stackId="a" />
                          <Line yAxisId="left" type="monotone" dataKey="cashValue" name="Cash Value" stroke={currentTheme.primary} strokeWidth={3} dot={false} />
                          <Line yAxisId="left" type="monotone" dataKey="deathBenefit" name="Death Benefit" stroke={currentTheme.accent} strokeWidth={2} strokeDasharray="5 5" dot={false} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Data Table 3: IUL Projection Data */}
                    <div className="overflow-x-auto max-h-[300px] overflow-y-auto mb-4 border border-[#12233e] rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-[#0d1a2e] z-10">
                          <tr className="border-b border-[#12233e]">
                            <th className="text-left py-2 px-4 font-medium text-[#c8d8ec]">Year</th>
                            <th className="text-left py-2 px-4 font-medium text-[#c8d8ec]">Age</th>
                            <th className="text-right py-2 px-4 font-medium text-[#c8d8ec]">Premium</th>
                            <th className="text-right py-2 px-4 font-medium text-[#c8d8ec]">Cash Value</th>
                            <th className="text-right py-2 px-4 font-medium text-[#c8d8ec]">Death Benefit</th>
                            <th className="text-right py-2 px-4 font-medium text-[#c8d8ec]">Income</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sampleData.iulProjection.projectionData.filter((_, i) => i % 5 === 0 || i === 29).map((d, i) => (
                            <tr key={i} className="border-b border-[#12233e] hover:bg-[#12233e]/50">
                              <td className="py-2 px-4 text-[#7a95b8]">{d.year}</td>
                              <td className="py-2 px-4 text-[#7a95b8]">{d.age}</td>
                              <td className="text-right py-2 px-4 text-[#c8d8ec]">${d.premium.toLocaleString()}</td>
                              <td className="text-right py-2 px-4 text-primary font-medium">${d.cashValue.toLocaleString()}</td>
                              <td className="text-right py-2 px-4 text-[#c8d8ec]">${d.deathBenefit.toLocaleString()}</td>
                              <td className="text-right py-2 px-4 text-[#22c55e]">${d.income.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-[#f0c040]">
                      <AlertTriangle className="h-3 w-3 inline mr-1" />
                      Illustrated crediting rate of {sampleData.iulProjection.creditingRate} is not guaranteed. Actual results may vary based on index performance and current cap/participation rates.
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Social Security Preview */}
              {selectedSections.socialSecurity && (
                <Card className="border-[#12233e] bg-[#0d1a2e]">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-6 rounded" style={{ backgroundColor: currentTheme.accent }} />
                      <CardTitle className="text-white">Social Security Strategy</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-3 mb-6">
                      <div className="p-4 rounded-lg border border-[#12233e] bg-[#0a1120]">
                        <div className="text-xs text-[#7a95b8]">Optimal Strategy</div>
                        <div className="text-sm font-bold text-white mt-1">{sampleData.socialSecurity.optimalStrategy}</div>
                      </div>
                      <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
                        <div className="text-xs text-[#7a95b8]">Lifetime Benefit</div>
                        <div className="text-xl font-bold text-primary">${(sampleData.socialSecurity.lifetimeBenefit / 1000000).toFixed(2)}M</div>
                      </div>
                      <div className="p-4 rounded-lg border border-[#22c55e]/30 bg-[#0a1120]">
                        <div className="text-xs text-[#7a95b8]">Advantage vs Early Claiming</div>
                        <div className="text-xl font-bold text-[#22c55e]">+${sampleData.socialSecurity.vsEarly.toLocaleString()}</div>
                      </div>
                    </div>

                    {/* Recharts 5: Social Security Breakeven */}
                    <div className="h-[350px] w-full mb-6">
                      <h3 className="text-sm font-medium text-white mb-4">Cumulative Benefit Breakeven Analysis</h3>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sampleData.socialSecurity.breakevenData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                          <XAxis dataKey="age" stroke="#7a95b8" label={{ value: 'Age', position: 'insideBottomRight', offset: -10, fill: '#7a95b8' }} />
                          <YAxis stroke="#7a95b8" tickFormatter={(val) => `$${(val/1000).toFixed(0)}K`} />
                          <RechartsTooltip 
                            contentStyle={{ backgroundColor: '#0a1120', borderColor: '#12233e', color: '#fff' }}
                            formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name === 'early' ? 'Claim at 62' : name === 'fra' ? 'Claim at FRA' : 'Optimal Strategy']}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="early" name="Claim at 62" stroke="#f43f5e" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="fra" name="Claim at FRA" stroke="#eab308" strokeWidth={2} dot={false} />
                          <Line type="monotone" dataKey="delayed" name="Optimal Strategy" stroke="#22c55e" strokeWidth={3} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Data Table 4: Social Security Comparison */}
                    <div className="overflow-x-auto border border-[#12233e] rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-[#0a1120]">
                          <tr className="border-b border-[#12233e]">
                            <th className="text-left py-3 px-4 font-medium text-[#c8d8ec]">Strategy</th>
                            <th className="text-right py-3 px-4 font-medium text-[#c8d8ec]">Monthly Benefit (Husband)</th>
                            <th className="text-right py-3 px-4 font-medium text-[#c8d8ec]">Monthly Benefit (Wife)</th>
                            <th className="text-right py-3 px-4 font-medium text-[#c8d8ec]">Total Lifetime Benefit (Age 90)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-[#12233e]">
                            <td className="py-3 px-4 text-[#7a95b8]">Claim Early (Age 62)</td>
                            <td className="text-right py-3 px-4 text-[#c8d8ec]">${Math.round(sampleData.socialSecurity.husbandPIA * 0.7).toLocaleString()}</td>
                            <td className="text-right py-3 px-4 text-[#c8d8ec]">${Math.round(sampleData.socialSecurity.wifePIA * 0.7).toLocaleString()}</td>
                            <td className="text-right py-3 px-4 text-[#c8d8ec]">${Math.round((sampleData.socialSecurity.lifetimeBenefit - sampleData.socialSecurity.vsEarly)).toLocaleString()}</td>
                          </tr>
                          <tr className="border-b border-[#12233e]">
                            <td className="py-3 px-4 text-[#7a95b8]">Claim at FRA</td>
                            <td className="text-right py-3 px-4 text-[#c8d8ec]">${sampleData.socialSecurity.husbandPIA.toLocaleString()}</td>
                            <td className="text-right py-3 px-4 text-[#c8d8ec]">${sampleData.socialSecurity.wifePIA.toLocaleString()}</td>
                            <td className="text-right py-3 px-4 text-[#c8d8ec]">${Math.round((sampleData.socialSecurity.lifetimeBenefit - sampleData.socialSecurity.vsEarly * 0.4)).toLocaleString()}</td>
                          </tr>
                          <tr className="bg-primary/10 font-medium">
                            <td className="py-3 px-4 text-primary">Optimal Strategy</td>
                            <td className="text-right py-3 px-4 text-primary">${Math.round(sampleData.socialSecurity.husbandPIA * 1.24).toLocaleString()}</td>
                            <td className="text-right py-3 px-4 text-primary">${sampleData.socialSecurity.wifePIA.toLocaleString()}</td>
                            <td className="text-right py-3 px-4 text-primary">${sampleData.socialSecurity.lifetimeBenefit.toLocaleString()}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Estate Tax Preview */}
              {selectedSections.estateTax && (
                <Card className="border-[#12233e] bg-[#0d1a2e]">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-6 rounded" style={{ backgroundColor: currentTheme.accent }} />
                      <CardTitle className="text-white">Estate Tax Analysis</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-4 mb-6">
                      <div className="p-3 rounded-lg border border-[#12233e] bg-[#0a1120]">
                        <div className="text-xs text-[#7a95b8]">Current Gross Estate</div>
                        <div className="text-lg font-bold text-white">${(sampleData.estateTax.grossEstate / 1000000).toFixed(1)}M</div>
                      </div>
                      <div className="p-3 rounded-lg border border-[#12233e] bg-[#0a1120]">
                        <div className="text-xs text-[#7a95b8]">Projected Estate (2035)</div>
                        <div className="text-lg font-bold text-white">${(sampleData.estateTax.projectedEstate2035 / 1000000).toFixed(1)}M</div>
                      </div>
                      <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/5">
                        <div className="text-xs text-red-400">Projected Tax Exposure</div>
                        <div className="text-lg font-bold text-red-400">${(sampleData.estateTax.taxExposure / 1000000).toFixed(2)}M</div>
                      </div>
                      <div className="p-3 rounded-lg border border-[#22c55e]/30 bg-[#0a1120]">
                        <div className="text-xs text-[#7a95b8]">Estate Tax with Planning</div>
                        <div className="text-lg font-bold text-[#22c55e]">${sampleData.estateTax.withPlanning}</div>
                      </div>
                    </div>

                    {/* Recharts 6: Estate Growth vs Exemption */}
                    <div className="h-[350px] w-full mb-6">
                      <h3 className="text-sm font-medium text-white mb-4">Estate Growth vs. Exemption Amount</h3>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={sampleData.estateTax.growthData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                          <XAxis dataKey="year" stroke="#7a95b8" />
                          <YAxis stroke="#7a95b8" tickFormatter={(val) => `$${(val/1000000).toFixed(0)}M`} />
                          <RechartsTooltip 
                            contentStyle={{ backgroundColor: '#0a1120', borderColor: '#12233e', color: '#fff' }}
                            formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name === 'estateValue' ? 'Estate Value' : name === 'exemption' ? 'Exemption Amount' : 'Tax Exposure']}
                          />
                          <Legend />
                          <Area type="monotone" dataKey="exemption" name="Exemption Amount" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeDasharray="5 5" />
                          <Area type="monotone" dataKey="estateValue" name="Estate Value" stroke={currentTheme.primary} fill={currentTheme.primary} fillOpacity={0.3} />
                          <Area type="monotone" dataKey="taxExposure" name="Tax Exposure" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.5} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Data Table 5: Estate Planning Strategies */}
                    <div className="overflow-x-auto border border-[#12233e] rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-[#0a1120]">
                          <tr className="border-b border-[#12233e]">
                            <th className="text-left py-3 px-4 font-medium text-[#c8d8ec]">Strategy</th>
                            <th className="text-left py-3 px-4 font-medium text-[#c8d8ec]">Description</th>
                            <th className="text-right py-3 px-4 font-medium text-[#c8d8ec]">Estimated Savings</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-[#12233e]">
                            <td className="py-3 px-4 text-white font-medium">Irrevocable Life Insurance Trust (ILIT)</td>
                            <td className="py-3 px-4 text-[#7a95b8]">Purchase life insurance inside an ILIT to provide tax-free liquidity for estate taxes.</td>
                            <td className="text-right py-3 px-4 text-[#22c55e]">${(sampleData.estateTax.taxExposure).toLocaleString()}</td>
                          </tr>
                          <tr className="border-b border-[#12233e]">
                            <td className="py-3 px-4 text-white font-medium">Annual Gifting Program</td>
                            <td className="py-3 px-4 text-[#7a95b8]">Utilize annual exclusion ($18,000/person) to transfer wealth to heirs tax-free.</td>
                            <td className="text-right py-3 px-4 text-[#22c55e]">$144,000/yr</td>
                          </tr>
                          <tr>
                            <td className="py-3 px-4 text-white font-medium">Spousal Lifetime Access Trust (SLAT)</td>
                            <td className="py-3 px-4 text-[#7a95b8]">Lock in current high exemption amounts before potential sunset while maintaining indirect access.</td>
                            <td className="text-right py-3 px-4 text-[#22c55e]">Varies</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Plan Preview */}
              {selectedSections.actionPlan && (
                <Card className="border-[#12233e] bg-[#0d1a2e]">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-6 rounded" style={{ backgroundColor: currentTheme.accent }} />
                      <CardTitle className="text-white">Recommended Action Plan</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Data Table 6: Action Plan */}
                    <div className="space-y-3">
                      {[
                        { priority: "Immediate", action: "Begin Roth Conversion Ladder — Convert $80,000/year for 5 years", timeline: "Q2 2026", status: "Pending" },
                        { priority: "Immediate", action: "Apply for IUL policy — $50,000 annual premium, 20-year funding", timeline: "Q2 2026", status: "In Progress" },
                        { priority: "Short-term", action: "Establish ILIT for estate tax elimination", timeline: "Q3 2026", status: "Not Started" },
                        { priority: "Short-term", action: "Review Social Security claiming strategy at age 62 decision point", timeline: "2033", status: "Future" },
                        { priority: "Medium-term", action: "Begin IUL tax-free loan distributions at retirement", timeline: "2036", status: "Future" },
                        { priority: "Ongoing", action: "Annual review of tax bracket positioning and strategy adjustments", timeline: "Annually", status: "Ongoing" },
                      ].map((item, i) => (
                        <div key={i} className="flex items-start gap-3 p-4 rounded-lg border border-[#12233e] bg-[#0a1120] hover:border-primary/50 transition-colors">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold flex-shrink-0 mt-0.5" style={{ backgroundColor: currentTheme.accent, color: currentTheme.primary }}>
                            {i + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-4">
                              <span className="font-medium text-base text-white">{item.action}</span>
                              <Badge className={`
                                ${item.status === 'Pending' ? 'bg-amber-500/20 text-amber-500' : ''}
                                ${item.status === 'In Progress' ? 'bg-blue-500/20 text-blue-500' : ''}
                                ${item.status === 'Not Started' ? 'bg-slate-500/20 text-slate-400' : ''}
                                ${item.status === 'Future' ? 'bg-purple-500/20 text-purple-400' : ''}
                                ${item.status === 'Ongoing' ? 'bg-green-500/20 text-green-500' : ''}
                              `}>
                                {item.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-2">
                              <div className="flex items-center gap-1">
                                <Activity className="h-3.5 w-3.5 text-[#7a95b8]" />
                                <span className="text-xs text-[#7a95b8] font-medium uppercase tracking-wider">{item.priority}</span>
                              </div>
                              <div className="w-1 h-1 rounded-full bg-[#12233e]"></div>
                              <div className="flex items-center gap-1">
                                <List className="h-3.5 w-3.5 text-[#7a95b8]" />
                                <span className="text-xs text-[#7a95b8]">Target: {item.timeline}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Disclaimers Preview */}
              {selectedSections.disclaimers && (
                <Card className="border-[#12233e] bg-[#0d1a2e]">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-6 rounded" style={{ backgroundColor: currentTheme.accent }} />
                      <CardTitle className="text-white">Disclaimers & Disclosures</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <NAICDisclaimer
                      variant="full"
                      showsProjections
                      showsCashValues
                      showsHistoricalData
                      showsComparisons
                      showsPolicyLoans
                    />
                  </CardContent>
                </Card>
              )}

              {/* Print / Download Actions */}
              <div className="flex flex-wrap gap-3 justify-center py-8">
                <Button size="lg" className="rc-btn rc-btn-primary px-8" onClick={handleGenerate} disabled={isGenerating}>
                  <Download className="h-5 w-5 mr-2" />
                  {isGenerating ? "Generating..." : "Download PDF Report"}
                </Button>
                <Button size="lg" variant="outline" className="rc-btn rc-btn-ghost px-8" onClick={() => window.print()}>
                  <Printer className="h-5 w-5 mr-2" />
                  Print Report
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <PageInsights pageId="client-report-generator" />
      
    </AppShell>
  );
}
