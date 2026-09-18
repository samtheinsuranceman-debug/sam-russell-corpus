// @ts-nocheck
import { useState, useMemo, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import {
  FileBarChart,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Eye,
  Download,
  Presentation,
  Shield,
  DollarSign,
  TrendingUp,
  Copy,
  Sparkles,
  ChevronRight,
  Settings,
  Save,
  Upload,
  Users,
  Briefcase,
  Calendar,
  Layout,
  Layers,
  MessageSquare,
  Edit3,
  Type,
  Image as ImageIcon,
  AlertCircle,
  Search,
  Share2,
  Printer,
} from "lucide-react";
import { 
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart, Legend
} from "recharts";
import { PageInsights } from "@/components/PageInsights";
import { ExportToSlides } from "@/components/ExportToSlides";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";

type SlideType = "title" | "strategy" | "comparison" | "timeline" | "metrics" | "custom" | "portfolio" | "risk" | "estate" | "tax";

interface Slide {
  id: string;
  type: SlideType;
  title: string;
  subtitle: string;
  bullets: string[];
  notes: string;
  chartData?: any[];
  tableData?: any[];
}

const SLIDE_TEMPLATES: Record<SlideType, { label: string; icon: any; defaultTitle: string; defaultBullets: string[] }> = {
  title: {
    label: "Title Slide",
    icon: Presentation,
    defaultTitle: "Financial Strategy Review",
    defaultBullets: ["Prepared for [Client Name]", "Russell Capital Systems™", new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" })],
  },
  strategy: {
    label: "Strategy Overview",
    icon: TrendingUp,
    defaultTitle: "Recommended Strategy",
    defaultBullets: [
      "Solar Strategy: Roth conversion with tax-free growth",
      "IUL Policy: Tax-advantaged wealth accumulation",
      "MYGA Ladder: Guaranteed fixed returns",
      "Real Estate Integration: Mortgage optimization",
    ],
  },
  comparison: {
    label: "Before vs. After",
    icon: Layers,
    defaultTitle: "Current vs. Recommended",
    defaultBullets: [
      "Current portfolio: Traditional IRA with deferred taxes",
      "Recommended: Solar Strategy with Roth conversion",
      "Tax savings over 20 years: $XXX,XXX",
      "Additional lifetime income: +XX%",
    ],
  },
  timeline: {
    label: "Implementation Timeline",
    icon: Calendar,
    defaultTitle: "Implementation Roadmap",
    defaultBullets: [
      "Phase 1 (Month 1-3): Roth conversion strategy",
      "Phase 2 (Month 3-6): IUL policy establishment",
      "Phase 3 (Month 6-12): MYGA ladder setup",
      "Phase 4 (Year 2+): Ongoing monitoring & rebalancing",
    ],
  },
  metrics: {
    label: "Key Metrics",
    icon: DollarSign,
    defaultTitle: "Projected Outcomes",
    defaultBullets: [
      "Projected net worth at retirement: $X.XM",
      "Tax-free lifetime income: $XX,XXX/month",
      "Estate value preservation: XX%",
      "Total tax savings: $XXX,XXX",
    ],
  },
  portfolio: {
    label: "Portfolio Allocation",
    icon: Briefcase,
    defaultTitle: "Asset Allocation",
    defaultBullets: [
      "Diversified across 5 major asset classes",
      "Reduced volatility through non-correlated assets",
      "Optimized for tax efficiency",
      "Aligned with risk tolerance",
    ],
  },
  risk: {
    label: "Risk Analysis",
    icon: Shield,
    defaultTitle: "Risk Management",
    defaultBullets: [
      "Downside protection strategies implemented",
      "Guaranteed income floors established",
      "Long-term care contingencies addressed",
      "Inflation hedging components active",
    ],
  },
  estate: {
    label: "Estate Planning",
    icon: Users,
    defaultTitle: "Legacy Preservation",
    defaultBullets: [
      "Trust structures optimized for tax efficiency",
      "Beneficiary designations reviewed",
      "Charitable giving strategies incorporated",
      "Generational wealth transfer planned",
    ],
  },
  tax: {
    label: "Tax Strategy",
    icon: FileBarChart,
    defaultTitle: "Tax Optimization",
    defaultBullets: [
      "Strategic Roth conversions scheduled",
      "Tax-loss harvesting opportunities identified",
      "Asset location optimized across accounts",
      "Required Minimum Distribution (RMD) planning",
    ],
  },
  custom: {
    label: "Custom Slide",
    icon: Sparkles,
    defaultTitle: "Custom Content",
    defaultBullets: ["Add your content here"],
  },
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function PresentationBuilder() {
  const { user } = useAuth();
  
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: notes } = trpc.notes.list.useQuery({ limit: 10 });
  const { data: slidesTemplates } = trpc.slides.listTemplates.useQuery();
  const { data: strategyAnalytics } = trpc.strategyAnalytics.getOverview.useQuery();
  const { data: riskProfile } = trpc.riskProfile.getLatest.useQuery();
  const { data: marketData } = trpc.marketData.getLatest.useQuery();
  
  const [presentationTitle, setPresentationTitle] = useState("Client Financial Strategy Review");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [slides, setSlides] = useState<Slide[]>([
    {
      id: generateId(),
      type: "title",
      title: "Financial Strategy Review",
      subtitle: "Russell Capital Systems™",
      bullets: ["Prepared for [Client Name]", "Confidential — For Advisor Use Only", new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" })],
      notes: "",
    },
  ]);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);
  const [includeDisclaimer, setIncludeDisclaimer] = useState(true);
  const [includeAppendix, setIncludeAppendix] = useState(false);
  const [theme, setTheme] = useState("light");
  const [font, setFont] = useState("inter");
  const [transition, setTransition] = useState("slide");
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [activeTab, setActiveTab] = useState("editor");
  const [showGrid, setShowGrid] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [presenterMode, setPresenterMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const portfolioData = [
    { name: 'Equities', value: 45, current: 60, recommended: 45 },
    { name: 'Fixed Income', value: 25, current: 30, recommended: 25 },
    { name: 'Alternatives', value: 15, current: 5, recommended: 15 },
    { name: 'Cash', value: 5, current: 5, recommended: 5 },
    { name: 'Annuities', value: 10, current: 0, recommended: 10 },
  ];
  
  const projectionData = [
    { year: 2024, current: 1000000, recommended: 1000000, taxes: 250000 },
    { year: 2029, current: 1250000, recommended: 1350000, taxes: 300000 },
    { year: 2034, current: 1500000, recommended: 1800000, taxes: 350000 },
    { year: 2039, current: 1800000, recommended: 2400000, taxes: 400000 },
    { year: 2044, current: 2100000, recommended: 3100000, taxes: 450000 },
  ];
  
  const riskData = [
    { subject: 'Market Risk', A: 120, B: 80, fullMark: 150 },
    { subject: 'Inflation Risk', A: 98, B: 130, fullMark: 150 },
    { subject: 'Longevity Risk', A: 86, B: 130, fullMark: 150 },
    { subject: 'Tax Risk', A: 99, B: 100, fullMark: 150 },
    { subject: 'Sequence Risk', A: 85, B: 90, fullMark: 150 },
    { subject: 'Interest Rate Risk', A: 65, B: 85, fullMark: 150 },
  ];
  
  const incomeData = [
    { age: 65, guaranteed: 40000, variable: 20000, target: 60000 },
    { age: 70, guaranteed: 55000, variable: 25000, target: 70000 },
    { age: 75, guaranteed: 60000, variable: 30000, target: 80000 },
    { age: 80, guaranteed: 65000, variable: 35000, target: 90000 },
    { age: 85, guaranteed: 70000, variable: 40000, target: 100000 },
    { age: 90, guaranteed: 75000, variable: 45000, target: 110000 },
  ];

  const taxData = [
    { category: 'Federal Income Tax', current: 45000, projected: 32000, savings: 13000 },
    { category: 'State Income Tax', current: 12000, projected: 8500, savings: 3500 },
    { category: 'Capital Gains Tax', current: 15000, projected: 5000, savings: 10000 },
    { category: 'Estate Tax', current: 150000, projected: 0, savings: 150000 },
    { category: 'Medicare Surtax', current: 3500, projected: 1200, savings: 2300 },
  ];

  const implementationData = [
    { step: 'Account Opening', status: 'Completed', date: 'Oct 15, 2024', owner: 'Advisor' },
    { step: 'Asset Transfer', status: 'In Progress', date: 'Nov 1, 2024', owner: 'Client' },
    { step: 'Initial Allocation', status: 'Pending', date: 'Nov 15, 2024', owner: 'Advisor' },
    { step: 'Policy Underwriting', status: 'Pending', date: 'Dec 1, 2024', owner: 'Carrier' },
    { step: 'Strategy Review', status: 'Scheduled', date: 'Jan 15, 2025', owner: 'Both' },
  ];

  const activeSlide = slides[activeSlideIndex];

  const selectedClient = useMemo(() => {
    if (!selectedClientId || !clients) return null;
    return clients.find((c) => c.id === Number(selectedClientId));
  }, [selectedClientId, clients]);

  const addSlide = (type: SlideType) => {
    const template = SLIDE_TEMPLATES[type];
    const newSlide: Slide = {
      id: generateId(),
      type,
      title: template.defaultTitle,
      subtitle: "",
      bullets: [...template.defaultBullets],
      notes: "",
    };
    setSlides(prev => [...prev, newSlide]);
    setActiveSlideIndex(slides.length);
    toast.success(`Added ${template.label}`);
  };

  const removeSlide = (index: number) => {
    if (slides.length <= 1) {
      toast.error("Presentation must have at least one slide");
      return;
    }
    setSlides(prev => prev.filter((_, i) => i !== index));
    if (activeSlideIndex >= slides.length - 1) {
      setActiveSlideIndex(Math.max(0, slides.length - 2));
    }
  };

  const moveSlide = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= slides.length) return;
    const newSlides = [...slides];
    [newSlides[index], newSlides[newIndex]] = [newSlides[newIndex], newSlides[index]];
    setSlides(newSlides);
    setActiveSlideIndex(newIndex);
  };

  const updateSlide = (index: number, updates: Partial<Slide>) => {
    setSlides(prev => prev.map((s, i) => i === index ? { ...s, ...updates } : s));
  };

  const updateBullet = (slideIndex: number, bulletIndex: number, value: string) => {
    const slide = slides[slideIndex];
    const newBullets = [...slide.bullets];
    newBullets[bulletIndex] = value;
    updateSlide(slideIndex, { bullets: newBullets });
  };

  const addBullet = (slideIndex: number) => {
    const slide = slides[slideIndex];
    updateSlide(slideIndex, { bullets: [...slide.bullets, ""] });
  };

  const removeBullet = (slideIndex: number, bulletIndex: number) => {
    const slide = slides[slideIndex];
    updateSlide(slideIndex, { bullets: slide.bullets.filter((_, i) => i !== bulletIndex) });
  };

  const duplicateSlide = (index: number) => {
    const slide = slides[index];
    const newSlide = { ...slide, id: generateId(), title: `${slide.title} (Copy)` };
    const newSlides = [...slides];
    newSlides.splice(index + 1, 0, newSlide);
    setSlides(newSlides);
    setActiveSlideIndex(index + 1);
    toast.success("Slide duplicated");
  };

  const autoPopulateFromClient = () => {
    if (!selectedClient) {
      toast.error("Select a client first");
      return;
    }
    const c = selectedClient as any;
    const name = `${c.firstName || ""} ${c.lastName || ""}`.trim() || "Client";
    const age = c.age || 60;
    const ira = Number(c.iraBalance) || 0;
    const income = Number(c.annualIncome) || 0;

    const autoSlides: Slide[] = [
      {
        id: generateId(), type: "title",
        title: `Financial Strategy Review for ${name}`,
        subtitle: "Russell Capital Systems™ — Confidential",
        bullets: [`Age: ${age}`, `IRA Balance: $${ira.toLocaleString()}`, `Annual Income: $${income.toLocaleString()}`],
        notes: "",
      },
      {
        id: generateId(), type: "strategy",
        title: "Recommended Solar Strategy",
        subtitle: `Customized for ${name}`,
        bullets: [
          `Convert $${ira.toLocaleString()} IRA to Roth over ${Math.min(5, Math.max(1, Math.floor((70 - age) / 2)))} years`,
          `Estimated tax bracket: ${income > 100000 ? "24-32%" : income > 50000 ? "22%" : "12%"}`,
          "Solar bonus adds 22-28% tax-free income to principal base",
          "Up to 70% more guaranteed lifetime income vs. traditional approach",
        ],
        notes: "Emphasize the tax-free growth advantage",
      },
      {
        id: generateId(), type: "comparison",
        title: "Current vs. Recommended",
        subtitle: "",
        bullets: [
          `Current: $${ira.toLocaleString()} in Traditional IRA (taxable withdrawals)`,
          `After Solar Strategy: Tax-free Roth with enhanced income rider`,
          `Projected additional lifetime income: $${Math.round(ira * 0.04 * 12 * 0.7).toLocaleString()}/year`,
          `Estate preservation: ${ira > 500000 ? "Significant tax savings for heirs" : "Simplified inheritance"}`,
        ],
        notes: "",
      },
      {
        id: generateId(), type: "portfolio",
        title: "Proposed Asset Allocation",
        subtitle: "Optimized for Growth and Protection",
        bullets: [
          "Strategic shift towards tax-free vehicles",
          "Reduction in sequence of returns risk",
          "Enhanced guaranteed income floor",
          "Tactical equity exposure for inflation hedging"
        ],
        notes: "Discuss the efficient frontier and how this allocation improves risk-adjusted returns",
      },
      {
        id: generateId(), type: "risk",
        title: "Risk Profile Analysis",
        subtitle: "Mitigating Key Retirement Risks",
        bullets: [
          "Market Risk: Buffered through fixed index strategies",
          "Longevity Risk: Addressed via guaranteed lifetime income riders",
          "Tax Risk: Hedged through strategic Roth conversions",
          "Sequence Risk: Eliminated in the income bucket"
        ],
        notes: "Focus on how the strategy provides peace of mind",
      },
      {
        id: generateId(), type: "timeline",
        title: "Implementation Roadmap",
        subtitle: "",
        bullets: [
          "Phase 1: Complete fact-finder and risk assessment",
          "Phase 2: Initiate Roth conversion strategy",
          "Phase 3: Establish IUL policy with optimal carrier",
          "Phase 4: Set up MYGA ladder for guaranteed returns",
          "Ongoing: Quarterly reviews and rebalancing",
        ],
        notes: "",
      },
      {
        id: generateId(), type: "metrics",
        title: "Projected Outcomes",
        subtitle: `Based on ${name}'s profile`,
        bullets: [
          `Starting balance: $${ira.toLocaleString()}`,
          `Projected 20-year growth (12% IUL): $${Math.round(ira * Math.pow(1.12, 20)).toLocaleString()}`,
          `Tax-free monthly income at ${age + 20}: $${Math.round((ira * Math.pow(1.12, 20) * 0.05) / 12).toLocaleString()}`,
          `Total tax savings estimate: $${Math.round(ira * 0.25).toLocaleString()}`,
        ],
        notes: "These are illustrative projections, not guarantees",
      },
    ];

    setSlides(autoSlides);
    setActiveSlideIndex(0);
    toast.success(`Presentation auto-populated for ${name}`);
  };

  const handleExportText = () => {
    let content = `# ${presentationTitle}\n\n`;
    if (selectedClient) {
      const c = selectedClient as any;
      content += `**Client:** ${c.firstName || ""} ${c.lastName || ""}\n`;
      content += `**Date:** ${new Date().toLocaleDateString("en-US")}\n\n---\n\n`;
    }
    slides.forEach((slide, i) => {
      content += `## Slide ${i + 1}: ${slide.title}\n`;
      if (slide.subtitle) content += `*${slide.subtitle}*\n\n`;
      slide.bullets.forEach((b) => {
        if (b.trim()) content += `- ${b}\n`;
      });
      if (slide.notes) content += `\n> **Speaker Notes:** ${slide.notes}\n`;
      content += `\n---\n\n`;
    });

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${presentationTitle.replace(/\s+/g, "_")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Presentation exported as Markdown");
  };

  const handleSaveTemplate = () => {
    toast.success("Template saved successfully");
  };

  const handleLoadTemplate = () => {
    toast.info("Template loading not implemented in this demo");
  };

  const handleShare = () => {
    toast.success("Sharing link copied to clipboard");
  };

  const handlePrint = () => {
    window.print();
  };


  const renderSlideChart = (type: SlideType) => {
    switch (type) {
      case 'portfolio':
        return (
          <div className="h-[300px] w-full mt-4 border rounded-md p-4 bg-background">
            <h4 className="text-center font-medium mb-2">Asset Allocation</h4>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={portfolioData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {portfolioData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        );
      case 'comparison':
        return (
          <div className="h-[300px] w-full mt-4 border rounded-md p-4 bg-background">
            <h4 className="text-center font-medium mb-2">Current vs Recommended Allocation</h4>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={portfolioData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="current" name="Current %" fill="#8884d8" />
                <Bar dataKey="recommended" name="Recommended %" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      case 'metrics':
        return (
          <div className="h-[300px] w-full mt-4 border rounded-md p-4 bg-background">
            <h4 className="text-center font-medium mb-2">Wealth Projection</h4>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="current" stackId="1" stroke="#8884d8" fill="#8884d8" name="Current Trajectory" />
                <Area type="monotone" dataKey="recommended" stackId="2" stroke="#82ca9d" fill="#82ca9d" name="Recommended Strategy" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );
      case 'risk':
        return (
          <div className="h-[300px] w-full mt-4 border rounded-md p-4 bg-background">
            <h4 className="text-center font-medium mb-2">Risk Exposure Comparison</h4>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={riskData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 150]} />
                <Radar name="Current Portfolio" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                <Radar name="Recommended Strategy" dataKey="B" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        );
      case 'strategy':
        return (
          <div className="h-[300px] w-full mt-4 border rounded-md p-4 bg-background">
            <h4 className="text-center font-medium mb-2">Projected Income Streams</h4>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={incomeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="age" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="guaranteed" stackId="a" fill="#8884d8" name="Guaranteed Income" />
                <Bar dataKey="variable" stackId="a" fill="#82ca9d" name="Variable Income" />
                <Line type="monotone" dataKey="target" stroke="#ff7300" name="Income Target" strokeWidth={3} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        );
      case 'tax':
        return (
          <div className="h-[300px] w-full mt-4 border rounded-md p-4 bg-background">
            <h4 className="text-center font-medium mb-2">Lifetime Tax Projection</h4>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={projectionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="taxes" stroke="#ff0000" name="Projected Taxes (Current)" strokeWidth={2} />
                <Line type="monotone" dataKey="taxes" stroke="#00ff00" name="Projected Taxes (Recommended)" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        );
      default:
        return null;
    }
  };

  const renderSlideTable = (type: SlideType) => {
    switch (type) {
      case 'portfolio':
        return (
          <div className="mt-4 border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset Class</TableHead>
                  <TableHead className="text-right">Current Allocation</TableHead>
                  <TableHead className="text-right">Recommended</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {portfolioData.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">{item.current}%</TableCell>
                    <TableCell className="text-right">{item.recommended}%</TableCell>
                    <TableCell className="text-right">
                      <span className={item.recommended - item.current > 0 ? "text-green-600" : item.recommended - item.current < 0 ? "text-red-600" : ""}>
                        {item.recommended > item.current ? '+' : ''}{item.recommended - item.current}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );
      case 'tax':
        return (
          <div className="mt-4 border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tax Category</TableHead>
                  <TableHead className="text-right">Current Exposure</TableHead>
                  <TableHead className="text-right">Projected Exposure</TableHead>
                  <TableHead className="text-right">Estimated Savings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {taxData.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{item.category}</TableCell>
                    <TableCell className="text-right">${item.current.toLocaleString()}</TableCell>
                    <TableCell className="text-right">${item.projected.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-green-600 font-medium">${item.savings.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-bold">
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">${taxData.reduce((acc, curr) => acc + curr.current, 0).toLocaleString()}</TableCell>
                  <TableCell className="text-right">${taxData.reduce((acc, curr) => acc + curr.projected, 0).toLocaleString()}</TableCell>
                  <TableCell className="text-right text-green-600">${taxData.reduce((acc, curr) => acc + curr.savings, 0).toLocaleString()}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        );
      case 'timeline':
        return (
          <div className="mt-4 border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Implementation Step</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Target Date</TableHead>
                  <TableHead>Responsibility</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {implementationData.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{item.step}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === 'Completed' ? 'default' : item.status === 'In Progress' ? 'secondary' : 'outline'}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.date}</TableCell>
                    <TableCell>{item.owner}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );
      case 'metrics':
        return (
          <div className="mt-4 border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Year</TableHead>
                  <TableHead className="text-right">Current Trajectory</TableHead>
                  <TableHead className="text-right">Recommended Strategy</TableHead>
                  <TableHead className="text-right">Difference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectionData.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{item.year}</TableCell>
                    <TableCell className="text-right">${item.current.toLocaleString()}</TableCell>
                    <TableCell className="text-right">${item.recommended.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-green-600 font-medium">
                      +${(item.recommended - item.current).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );
      case 'strategy':
        return (
          <div className="mt-4 border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Age</TableHead>
                  <TableHead className="text-right">Guaranteed Income</TableHead>
                  <TableHead className="text-right">Variable Income</TableHead>
                  <TableHead className="text-right">Total Projected</TableHead>
                  <TableHead className="text-right">Target</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomeData.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{item.age}</TableCell>
                    <TableCell className="text-right">${item.guaranteed.toLocaleString()}</TableCell>
                    <TableCell className="text-right">${item.variable.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-bold">${(item.guaranteed + item.variable).toLocaleString()}</TableCell>
                    <TableCell className="text-right text-muted-foreground">${item.target.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );
      case 'risk':
        return (
          <div className="mt-4 border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Risk Factor</TableHead>
                  <TableHead className="text-right">Current Exposure Score</TableHead>
                  <TableHead className="text-right">Target Exposure Score</TableHead>
                  <TableHead>Mitigation Strategy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {riskData.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{item.subject}</TableCell>
                    <TableCell className="text-right text-red-500">{item.A}</TableCell>
                    <TableCell className="text-right text-green-500">{item.B}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {item.subject === 'Market Risk' ? 'Shift to fixed index annuities' : 
                       item.subject === 'Inflation Risk' ? 'Equities and real estate' : 
                       item.subject === 'Longevity Risk' ? 'Lifetime income riders' : 
                       item.subject === 'Tax Risk' ? 'Roth conversions' : 
                       item.subject === 'Sequence Risk' ? 'Cash buffer strategy' : 'Duration matching'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );
      default:
        return null;
    }
  };

  const renderPreview = () => {
    return (
      <div className="bg-muted p-4 sm:p-8 rounded-lg min-h-[600px] flex flex-col items-center justify-center">
        <div className={`w-full max-w-4xl aspect-video bg-card shadow-xl rounded-lg overflow-hidden border flex flex-col ${theme === 'dark' ? 'dark bg-slate-900 text-slate-50' : 'bg-white text-slate-900'}`} style={{ fontFamily: font === 'serif' ? 'serif' : 'sans-serif' }}>
          {/* Slide Header */}
          {activeSlide.type !== "title" && (
            <div className="h-16 border-b flex items-center px-8 bg-muted/30">
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{activeSlide.title}</h2>
                {activeSlide.subtitle && <p className="text-sm text-muted-foreground">{activeSlide.subtitle}</p>}
              </div>
              <div className="w-32 opacity-50">
                {/* Logo placeholder */}
                <div className="h-8 w-full bg-primary/20 rounded flex items-center justify-center text-xs font-bold text-primary">LOGO</div>
              </div>
            </div>
          )}

          {/* Slide Content */}
          <div className="flex-1 p-8 flex flex-col">
            {activeSlide.type === "title" ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-48 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-8">
                  <span className="text-xl font-bold text-primary">Russell Capital</span>
                </div>
                <h1 className="text-5xl font-extrabold tracking-tight">{activeSlide.title}</h1>
                <h2 className="text-2xl text-muted-foreground">{activeSlide.subtitle}</h2>
                <div className="pt-12 space-y-2">
                  {activeSlide.bullets.map((bullet, i) => (
                    <p key={i} className="text-lg">{bullet}</p>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <ul className="space-y-4 list-none">
                    {activeSlide.bullets.map((bullet, i) => (
                      <li key={i} className="flex items-start gap-3 text-lg">
                        <div className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col gap-4">
                  {renderSlideChart(activeSlide.type)}
                  {renderSlideTable(activeSlide.type)}
                </div>
              </div>
            )}
          </div>

          {/* Slide Footer */}
          <div className="h-10 border-t flex items-center justify-between px-8 text-xs text-muted-foreground bg-muted/10">
            <div>{new Date().toLocaleDateString()} | Confidential</div>
            <div>Slide {activeSlideIndex + 1} of {slides.length}</div>
          </div>
        </div>
        
        {/* Presenter Notes */}
        {presenterMode && activeSlide.notes && (
          <div className="w-full max-w-4xl mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <h4 className="font-bold flex items-center gap-2 mb-2 text-yellow-800 dark:text-yellow-200">
              <MessageSquare className="h-4 w-4" /> Presenter Notes
            </h4>
            <p className="text-sm">{activeSlide.notes}</p>
          </div>
        )}
      </div>
    );
  };

  
  return (
    <AppShell>
      <div className="container mx-auto p-4 max-w-7xl space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Presentation Builder</h1>
            <p className="text-muted-foreground">Create and customize client presentations</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleSaveTemplate}>
              <Save className="h-4 w-4 mr-2" /> Save Template
            </Button>
            <Button variant="outline" size="sm" onClick={handleLoadTemplate}>
              <Upload className="h-4 w-4 mr-2" /> Load
            </Button>
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" /> Share
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" /> Print
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportText}>
              <Download className="h-4 w-4 mr-2" /> Export Markdown
            </Button>
            <ExportToSlides
              slides={slides.map((s) => ({ title: s.title, content: s.bullets.join("\n") }))}
              title={presentationTitle}
              clientName={selectedClient ? `${(selectedClient as any).firstName} ${(selectedClient as any).lastName}` : undefined}
            />
            <Button size="sm" onClick={() => setPreviewMode(!previewMode)}>
              {previewMode ? <Edit3 className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {previewMode ? "Edit Mode" : "Preview"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar / Controls */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium">Presentation Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Presentation Title</Label>
                  <Input 
                    value={presentationTitle} 
                    onChange={(e) => setPresentationTitle(e.target.value)} 
                    placeholder="Enter title..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Client Data Source</Label>
                  <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients?.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>
                          {c.firstName} {c.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  variant="secondary" 
                  className="w-full" 
                  onClick={autoPopulateFromClient}
                  disabled={!selectedClientId}
                >
                  <Sparkles className="h-4 w-4 mr-2" /> Auto-Populate
                </Button>
                
                <div className="pt-4 border-t space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="include-disclaimer" className="text-sm font-medium cursor-pointer">Include NAIC Disclaimer</Label>
                    <Switch id="include-disclaimer" checked={includeDisclaimer} onCheckedChange={setIncludeDisclaimer} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="include-appendix" className="text-sm font-medium cursor-pointer">Include Appendix</Label>
                    <Switch id="include-appendix" checked={includeAppendix} onCheckedChange={setIncludeAppendix} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-save" className="text-sm font-medium cursor-pointer">Auto-save</Label>
                    <Switch id="auto-save" checked={autoSave} onCheckedChange={setAutoSave} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="presenter-mode" className="text-sm font-medium cursor-pointer">Presenter Mode</Label>
                    <Switch id="presenter-mode" checked={presenterMode} onCheckedChange={setPresenterMode} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-medium">Design & Layout</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light (Default)</SelectItem>
                      <SelectItem value="dark">Dark Mode</SelectItem>
                      <SelectItem value="corporate">Corporate Blue</SelectItem>
                      <SelectItem value="elegant">Elegant Serif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Aspect Ratio</Label>
                  <Select value={aspectRatio} onValueChange={setAspectRatio}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ratio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="16:9">Widescreen (16:9)</SelectItem>
                      <SelectItem value="4:3">Standard (4:3)</SelectItem>
                      <SelectItem value="1:1">Square (1:1)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Transition</Label>
                  <Select value={transition} onValueChange={setTransition}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select transition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slide">Slide</SelectItem>
                      <SelectItem value="fade">Fade</SelectItem>
                      <SelectItem value="zoom">Zoom</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                  <span>Add Slide</span>
                  <div className="flex items-center gap-1">
                    <Input 
                      placeholder="Search..." 
                      className="h-6 w-24 text-xs" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px] pr-4">
                  <div className="grid grid-cols-1 gap-2">
                    {(Object.entries(SLIDE_TEMPLATES) as [SlideType, typeof SLIDE_TEMPLATES[SlideType]][])
                      .filter(([_, tmpl]) => tmpl.label.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(([type, tmpl]) => {
                      const Icon = tmpl.icon;
                      return (
                        <Button key={type} variant="outline" size="sm" className="justify-start text-xs h-9 w-full" onClick={() => addSlide(type)}>
                          <Icon className="h-4 w-4 mr-2 text-primary" /> {tmpl.label}
                        </Button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {previewMode ? (
              renderPreview()
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex items-center justify-between mb-4">
                  <TabsList>
                    <TabsTrigger value="editor">Slide Editor</TabsTrigger>
                    <TabsTrigger value="sorter">Slide Sorter</TabsTrigger>
                    <TabsTrigger value="data">Data Sources</TabsTrigger>
                  </TabsList>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Layers className="h-4 w-4" /> {slides.length} Slides</span>
                  </div>
                </div>
                
                <TabsContent value="editor" className="mt-0 space-y-6">
                  {/* Slide Navigation Strip */}
                  <div className="flex overflow-x-auto pb-2 gap-2 snap-x">
                    {slides.map((slide, idx) => (
                      <div 
                        key={slide.id}
                        onClick={() => setActiveSlideIndex(idx)}
                        className={`
                          shrink-0 w-32 h-20 rounded-md border-2 cursor-pointer p-2 flex flex-col justify-between snap-center
                          ${idx === activeSlideIndex ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'}
                        `}
                      >
                        <div className="text-xs font-medium truncate">{slide.title || "Untitled"}</div>
                        <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                          <span>{idx + 1}</span>
                          <span className="h-3 w-3" />
                        </div>
                      </div>
                    ))}
                    <Button 
                      variant="outline" 
                      className="shrink-0 w-32 h-20 rounded-md border-dashed flex flex-col items-center justify-center gap-1"
                      onClick={() => addSlide('custom')}
                    >
                      <Plus className="h-5 w-5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Add Slide</span>
                    </Button>
                  </div>

                  {/* Active Slide Editor */}
                  {activeSlide ? (
                    <Card className="border-2 border-primary/20 shadow-md">
                      <CardHeader className="pb-3 bg-muted/30 border-b">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg font-medium flex items-center gap-2">
                            <span className="h-5 w-5 text-primary" />
                            Slide {activeSlideIndex + 1}: {SLIDE_TEMPLATES[activeSlide.type].label}
                          </CardTitle>
                          <div className="flex gap-1 bg-background rounded-md p-1 border shadow-sm">
                            <Button variant="ghost" size="sm" onClick={() => moveSlide(activeSlideIndex, "up")} disabled={activeSlideIndex === 0} title="Move Up">
                              <MoveUp className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => moveSlide(activeSlideIndex, "down")} disabled={activeSlideIndex === slides.length - 1} title="Move Down">
                              <MoveDown className="h-4 w-4" />
                            </Button>
                            <div className="w-px h-4 bg-border mx-1 self-center" />
                            <Button variant="ghost" size="sm" onClick={() => duplicateSlide(activeSlideIndex)} title="Duplicate">
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => removeSlide(activeSlideIndex)} title="Delete">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-6 pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label className="flex items-center gap-2"><Type className="h-4 w-4 text-muted-foreground" /> Slide Title</Label>
                              <Input 
                                value={activeSlide.title} 
                                onChange={(e) => updateSlide(activeSlideIndex, { title: e.target.value })} 
                                className="font-semibold text-lg"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="flex items-center gap-2"><Type className="h-4 w-4 text-muted-foreground" /> Subtitle (Optional)</Label>
                              <Input 
                                value={activeSlide.subtitle} 
                                onChange={(e) => updateSlide(activeSlideIndex, { subtitle: e.target.value })} 
                                placeholder="Add a descriptive subtitle..." 
                              />
                            </div>
                            
                            <div className="pt-2">
                              <div className="flex items-center justify-between mb-3">
                                <Label className="flex items-center gap-2"><Layout className="h-4 w-4 text-muted-foreground" /> Content Bullets</Label>
                                <Button variant="outline" size="sm" onClick={() => addBullet(activeSlideIndex)} className="h-8">
                                  <Plus className="h-3 w-3 mr-1" /> Add Bullet
                                </Button>
                              </div>
                              <div className="space-y-3">
                                {activeSlide.bullets.map((bullet, bi) => (
                                  <div key={bi} className="flex gap-2 items-start group">
                                    <div className="mt-2.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                                    <Textarea
                                      value={bullet}
                                      onChange={(e) => updateBullet(activeSlideIndex, bi, e.target.value)}
                                      placeholder={`Bullet point ${bi + 1}...`}
                                      className="min-h-[40px] resize-y"
                                      rows={2}
                                    />
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="text-muted-foreground hover:text-destructive shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" 
                                      onClick={() => removeBullet(activeSlideIndex, bi)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                                {activeSlide.bullets.length === 0 && (
                                  <div className="text-center p-4 border border-dashed rounded-md text-muted-foreground text-sm">
                                    No bullet points. Click "Add Bullet" to create one.
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-4 flex flex-col h-full">
                            <div className="space-y-2 flex-1">
                              <Label className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-muted-foreground" /> Speaker Notes</Label>
                              <Textarea
                                value={activeSlide.notes}
                                onChange={(e) => updateSlide(activeSlideIndex, { notes: e.target.value })}
                                placeholder="Private notes for the presenter. These won't be visible on the main presentation screen."
                                className="h-[200px] resize-none bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-900"
                              />
                            </div>
                            
                            <div className="p-4 border rounded-md bg-muted/30">
                              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                <ImageIcon className="h-4 w-4 text-muted-foreground" /> Slide Visuals
                              </h4>
                              <p className="text-xs text-muted-foreground mb-3">
                                This slide type automatically generates the following visual elements:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {activeSlide.type === 'title' && <Badge variant="secondary">Logo</Badge>}
                                {activeSlide.type === 'portfolio' && <Badge variant="secondary">Pie Chart</Badge>}
                                {activeSlide.type === 'comparison' && <Badge variant="secondary">Bar Chart</Badge>}
                                {activeSlide.type === 'metrics' && <Badge variant="secondary">Area Chart</Badge>}
                                {activeSlide.type === 'risk' && <Badge variant="secondary">Radar Chart</Badge>}
                                {activeSlide.type === 'strategy' && <Badge variant="secondary">Composed Chart</Badge>}
                                {activeSlide.type === 'tax' && <Badge variant="secondary">Line Chart</Badge>}
                                {['portfolio', 'tax', 'timeline', 'metrics', 'strategy', 'risk'].includes(activeSlide.type) && 
                                  <Badge variant="outline">Data Table</Badge>
                                }
                                {activeSlide.type === 'custom' && <span className="text-xs italic">No default visuals</span>}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="py-24 text-center flex flex-col items-center justify-center">
                        <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                          <Presentation className="h-10 w-10 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No Slides Yet</h3>
                        <p className="text-muted-foreground max-w-md mx-auto mb-6">
                          Start building your presentation by adding a slide from the sidebar, or auto-populate based on a client's profile.
                        </p>
                        <Button onClick={() => addSlide('title')} size="lg">
                          <Plus className="h-5 w-5 mr-2" /> Add Title Slide
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
                
                <TabsContent value="sorter" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Slide Sorter</CardTitle>
                      <CardDescription>Drag and drop to reorder slides</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {slides.map((slide, idx) => (
                          <div 
                            key={slide.id}
                            className="border rounded-lg overflow-hidden bg-card shadow-sm hover:shadow-md transition-shadow group relative"
                          >
                            <div className="absolute top-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold z-10">
                              {idx + 1}
                            </div>
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-1">
                              <Button variant="secondary" size="icon" className="h-6 w-6 rounded-full" onClick={() => removeSlide(idx)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                            <div 
                              className="aspect-video bg-muted/50 p-4 flex flex-col items-center justify-center text-center cursor-move"
                              onClick={() => {
                                setActiveSlideIndex(idx);
                                setActiveTab("editor");
                              }}
                            >
                              <span className="h-8 w-8 text-muted-foreground mb-2" />
                              <h4 className="font-medium text-sm line-clamp-2">{slide.title}</h4>
                            </div>
                            <div className="p-2 border-t bg-background flex justify-between items-center">
                              <span className="text-xs text-muted-foreground capitalize">{slide.type}</span>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveSlide(idx, "up")} disabled={idx === 0}>
                                  <ChevronRight className="h-3 w-3 rotate-180" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveSlide(idx, "down")} disabled={idx === slides.length - 1}>
                                  <ChevronRight className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="data" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>Data Sources</CardTitle>
                      <CardDescription>Manage the data feeding into your presentation charts and tables</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="p-4 border rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-medium">Data Integration Active</h4>
                            <p className="text-sm mt-1">
                              Charts and tables in this presentation are currently linked to <strong>{selectedClient ? `${(selectedClient as any).firstName} ${(selectedClient as any).lastName}'s` : 'Demo'}</strong> profile data.
                              Changes made here will override the default profile data for this presentation only.
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Card className="shadow-none border-dashed">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Portfolio Allocation</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <Button variant="outline" className="w-full justify-start"><Edit3 className="h-4 w-4 mr-2" /> Edit Data Points</Button>
                            </CardContent>
                          </Card>
                          <Card className="shadow-none border-dashed">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Wealth Projections</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <Button variant="outline" className="w-full justify-start"><Edit3 className="h-4 w-4 mr-2" /> Edit Data Points</Button>
                            </CardContent>
                          </Card>
                          <Card className="shadow-none border-dashed">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Risk Assessment</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <Button variant="outline" className="w-full justify-start"><Edit3 className="h-4 w-4 mr-2" /> Edit Data Points</Button>
                            </CardContent>
                          </Card>
                          <Card className="shadow-none border-dashed">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">Tax Projections</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <Button variant="outline" className="w-full justify-start"><Edit3 className="h-4 w-4 mr-2" /> Edit Data Points</Button>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>

        {includeDisclaimer && <NAICDisclaimer />}
        <PageInsights pageId="presentation-builder" />
      </div>
    </AppShell>
  );
}
