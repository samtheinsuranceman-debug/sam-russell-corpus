// @ts-nocheck
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Presentation,
  Clock,
  Users,
  Target,
  FileText,
  Copy,
  CheckCircle2,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Info,
  List,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  BarChart3,
  Zap,
  Settings,
  Download,
  Upload,
  Play,
  Layout,
  Type,
  Monitor,
  TrendingUp,
  Users2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  BarChart, LineChart, PieChart, AreaChart, RadarChart, ComposedChart,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  Bar, Line, Pie, Cell, Area, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";

interface SlideContent {
  id: string;
  title: string;
  bullets: string[];
  speakerNotes: string;
  type: "title" | "content" | "chart" | "case-study" | "cta" | "interactive" | "poll" | "qna";
  duration: number; // in seconds
  data?: any;
}

interface SeminarTemplate {
  id: string;
  name: string;
  description: string;
  duration: string;
  audience: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  category: "tax" | "estate" | "business" | "retirement" | "investment" | "insurance";
  tags: string[];
  slides: SlideContent[];
  createdAt: string;
  updatedAt: string;
  author: string;
  rating: number;
  usageCount: number;
  conversionRate: number;
}

const COLORS = ['#22c55e', '#3b82f6', '#f0c040', '#a855f7', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6'];

const MOCK_PERFORMANCE_DATA = [
  { month: 'Jan', attendees: 120, conversions: 24, revenue: 120000, satisfaction: 4.2 },
  { month: 'Feb', attendees: 150, conversions: 35, revenue: 175000, satisfaction: 4.5 },
  { month: 'Mar', attendees: 180, conversions: 42, revenue: 210000, satisfaction: 4.6 },
  { month: 'Apr', attendees: 140, conversions: 30, revenue: 150000, satisfaction: 4.3 },
  { month: 'May', attendees: 200, conversions: 55, revenue: 275000, satisfaction: 4.8 },
  { month: 'Jun', attendees: 220, conversions: 65, revenue: 325000, satisfaction: 4.9 },
];

const MOCK_AUDIENCE_DEMOGRAPHICS = [
  { ageGroup: '30-40', percentage: 15, value: 150 },
  { ageGroup: '41-50', percentage: 25, value: 250 },
  { ageGroup: '51-60', percentage: 40, value: 400 },
  { ageGroup: '61+', percentage: 20, value: 200 },
];

const MOCK_TOPIC_ENGAGEMENT = [
  { topic: 'Tax Strategies', engagement: 85, retention: 75, questions: 45 },
  { topic: 'Estate Planning', engagement: 70, retention: 80, questions: 30 },
  { topic: 'Market Volatility', engagement: 90, retention: 65, questions: 60 },
  { topic: 'Social Security', engagement: 80, retention: 85, questions: 50 },
  { topic: 'Healthcare Costs', engagement: 75, retention: 70, questions: 40 },
];

const MOCK_CONVERSION_FUNNEL = [
  { stage: 'Registered', count: 1000 },
  { stage: 'Attended', count: 650 },
  { stage: 'Stayed > 30m', count: 500 },
  { stage: 'Requested Consult', count: 150 },
  { stage: 'Became Client', count: 45 },
];

const MOCK_SPEAKER_RATINGS = [
  { subject: 'Clarity', A: 90, fullMark: 100 },
  { subject: 'Knowledge', A: 95, fullMark: 100 },
  { subject: 'Engagement', A: 85, fullMark: 100 },
  { subject: 'Pacing', A: 80, fullMark: 100 },
  { subject: 'Visuals', A: 88, fullMark: 100 },
  { subject: 'Q&A Handling', A: 92, fullMark: 100 },
];

const INITIAL_TEMPLATES: Record<string, SeminarTemplate> = {
  "retirement-tax": {
    id: "retirement-tax",
    name: "Retirement Tax Optimization",
    description: "How to reduce taxes in retirement using IUL, Roth conversions, and strategic withdrawal sequencing",
    duration: "45 min",
    audience: "Pre-retirees (55-65)",
    difficulty: "intermediate",
    category: "tax",
    tags: ["tax", "retirement", "IUL", "Roth"],
    createdAt: "2023-01-15T00:00:00Z",
    updatedAt: "2023-10-20T00:00:00Z",
    author: "Jane Doe",
    rating: 4.8,
    usageCount: 1250,
    conversionRate: 18.5,
    slides: [
      { id: "s1", title: "The Retirement Tax Time Bomb", bullets: ["Your 401(k) isn't all yours—Uncle Sam owns up to 37%", "RMDs force you to withdraw (and pay taxes) starting at 73", "Medicare IRMAA surcharges can cost $5,000+/year", "The good news: there are legal strategies to minimize this"], speakerNotes: "Open with the shock factor. Most people don't realize how much of their retirement savings will go to taxes.", type: "title", duration: 120 },
      { id: "s2", title: "The Three Tax Buckets", bullets: ["Taxable: Brokerage accounts, savings (capital gains rates)", "Tax-Deferred: 401(k), IRA, 403(b) (ordinary income rates)", "Tax-Free: Roth IRA, IUL policy loans, municipal bonds", "Goal: Shift assets from tax-deferred to tax-free BEFORE retirement"], speakerNotes: "Draw the three buckets on the whiteboard. Ask audience which bucket most of their money is in.", type: "content", duration: 180 },
      { id: "s3", title: "Strategy #1: Roth Conversion Ladder", bullets: ["Convert IRA to Roth during low-income years", "Pay taxes now at known rates vs. unknown future rates", "Reduces future RMDs and IRMAA exposure", "Case study: $1.2M IRA → $800K Roth over 10 years saves $340K in lifetime taxes"], speakerNotes: "Walk through the math. Show the comparison chart of total taxes paid with and without conversions.", type: "content", duration: 240 },
      { id: "s4", title: "Strategy #2: IUL Tax-Free Income", bullets: ["Indexed Universal Life builds illustrated cash value tax-deferred", "Policy loans provide tax-free retirement income", "No RMDs, no IRMAA impact, no contribution limits", "Death benefit passes income tax-free to beneficiaries"], speakerNotes: "This is where you introduce IUL. Emphasize it's not replacing their 401(k), it's complementing it.", type: "content", duration: 300 },
      { id: "s5", title: "Strategy #3: Withdrawal Sequencing", bullets: ["The order you withdraw matters as much as the amount", "Pre-73: Fill low tax brackets with IRA distributions", "73+: Take RMDs, supplement with IUL loans", "Result: 40-60% lower effective tax rate in retirement"], speakerNotes: "Show the withdrawal sequencing chart. This is the 'aha moment' for most attendees.", type: "chart", duration: 240 },
      { id: "s6", title: "Case Study: The Johnson Family", bullets: ["Ages 58 & 55, combined income $420K", "IRA: $1.8M, Roth: $200K, Taxable: $500K", "Without strategy: $1.2M in lifetime taxes", "With strategy: $680K in lifetime taxes (43% reduction)", "Key moves: Roth conversion + IUL + delayed Social Security"], speakerNotes: "Use real-looking numbers. Let the audience see themselves in this case study.", type: "case-study", duration: 300 },
      { id: "s7", title: "Your Next Step", bullets: ["Schedule a complimentary Tax Efficiency Review", "We'll analyze YOUR specific situation", "No obligation, no pressure—just clarity", "Limited to 15 appointments from tonight's seminar"], speakerNotes: "Create urgency with the limited appointments. Have sign-up sheets ready at every table.", type: "cta", duration: 180 },
    ],
  },
  "estate-planning": {
    id: "estate-planning",
    name: "Estate Planning with Life Insurance",
    description: "Protecting your legacy and minimizing estate taxes through strategic insurance planning",
    duration: "60 min",
    audience: "High net worth (50+)",
    difficulty: "advanced",
    category: "estate",
    tags: ["estate", "legacy", "ILIT", "taxes"],
    createdAt: "2023-02-10T00:00:00Z",
    updatedAt: "2023-11-05T00:00:00Z",
    author: "John Smith",
    rating: 4.9,
    usageCount: 850,
    conversionRate: 22.4,
    slides: [
      { id: "e1", title: "Your Legacy at Risk", bullets: ["Estate tax exemption: $13.61M (2024) but may drop to $6M in 2026", "40% federal estate tax on amounts above exemption", "State estate taxes can add another 10-16%", "Without planning, your heirs could lose 40-55% of your estate"], speakerNotes: "Start with the sunset provision. This creates urgency—they need to act before 2026.", type: "title", duration: 150 },
      { id: "e2", title: "The Estate Tax Math", bullets: ["$15M estate - $13.61M exemption = $1.39M taxable", "Federal tax: $556,000 at 40%", "If exemption drops to $6M: $3.6M in taxes", "Life insurance in an ILIT provides tax-free liquidity"], speakerNotes: "Show the comparison chart. The difference is dramatic and motivating.", type: "chart", duration: 240 },
      { id: "e3", title: "ILIT: The Estate Tax Eraser", bullets: ["Irrevocable Life Insurance Trust owns the policy", "Death benefit is excluded from taxable estate", "Provides immediate liquidity to pay estate taxes", "Preserves business and real estate for heirs"], speakerNotes: "Explain ILIT structure simply. Use the analogy of a 'firewall' between the policy and the estate.", type: "content", duration: 300 },
      { id: "e4", title: "IUL for Living Benefits", bullets: ["Tax-free retirement income through policy loans", "Long-term care acceleration rider", "Chronic illness benefit", "Death benefit for estate liquidity"], speakerNotes: "Position IUL as a multi-purpose tool, not just death benefit.", type: "content", duration: 240 },
      { id: "e5", title: "Case Study: The Williams Estate", bullets: ["$22M estate including $8M business", "Without planning: $3.4M estate tax, family forced to sell business", "With ILIT + IUL: $0 estate tax, business preserved for children", "Annual premium: $85K for $5M death benefit"], speakerNotes: "This case study should resonate with business owners in the audience.", type: "case-study", duration: 360 },
      { id: "e6", title: "Take Action Now", bullets: ["Free estate tax exposure analysis", "Review your current beneficiary designations", "Evaluate ILIT suitability for your situation", "Act before the 2026 exemption sunset"], speakerNotes: "Emphasize the time-sensitive nature. The sunset provision is real and coming.", type: "cta", duration: 180 },
    ],
  },
  "business-owner": {
    id: "business-owner",
    name: "Business Owner Protection Strategies",
    description: "Key person insurance, buy-sell agreements, and executive benefits for business owners",
    duration: "45 min",
    audience: "Business owners",
    difficulty: "intermediate",
    category: "business",
    tags: ["business", "buy-sell", "key-person", "executive-bonus"],
    createdAt: "2023-03-20T00:00:00Z",
    updatedAt: "2023-09-15T00:00:00Z",
    author: "Sarah Johnson",
    rating: 4.7,
    usageCount: 920,
    conversionRate: 15.8,
    slides: [
      { id: "b1", title: "What Happens to Your Business If...", bullets: ["You become disabled and can't work?", "Your key employee leaves or passes away?", "Your partner wants out (or passes away)?", "You want to retire but can't find a buyer?"], speakerNotes: "Open with questions. Let the audience think about their own vulnerability.", type: "title", duration: 120 },
      { id: "b2", title: "The Four Pillars of Business Protection", bullets: ["Key Person Insurance: Protect against losing critical talent", "Buy-Sell Agreement: Funded succession plan", "Executive Benefits: Retain and reward top performers", "Exit Strategy: Build transferable value"], speakerNotes: "Overview slide. We'll go deep on each pillar.", type: "content", duration: 180 },
      { id: "b3", title: "Key Person Insurance", bullets: ["Coverage = 5-10x salary + replacement costs + revenue impact", "Business owns the policy and is the beneficiary", "Premiums may be tax-deductible as business expense", "IUL provides living benefits if key person becomes disabled"], speakerNotes: "Ask: 'How long would it take to replace your best employee?' Then show the cost.", type: "content", duration: 240 },
      { id: "b4", title: "Buy-Sell Agreements", bullets: ["Cross-purchase vs. entity purchase vs. hybrid", "Funded with life insurance for immediate liquidity", "Establishes fair market value for tax purposes", "Prevents unwanted partners (spouse, creditors)"], speakerNotes: "Use the analogy: 'A buy-sell is a prenup for your business partnership.'", type: "content", duration: 300 },
      { id: "b5", title: "Executive Bonus (Section 162)", bullets: ["Company pays IUL premiums as tax-deductible bonus", "Executive owns the policy personally", "Builds tax-free retirement income", "Golden handcuffs with vesting schedule"], speakerNotes: "This is often the most exciting strategy for business owners. It's a win-win.", type: "content", duration: 240 },
      { id: "b6", title: "Let's Protect Your Business", bullets: ["Complimentary Business Protection Audit", "We'll review your current coverage gaps", "Identify tax-saving opportunities", "Create a customized protection plan"], speakerNotes: "Offer the audit as the next step. Business owners love audits—it implies efficiency.", type: "cta", duration: 180 },
    ],
  },
};

export default function SeminarGenerator() {
  const { user } = useAuth();
  
  const [templates, setTemplates] = useState<Record<string, SeminarTemplate>>(INITIAL_TEMPLATES);
  const [selectedTemplateId, setSelectedTemplateId] = useState("retirement-tax");
  const [advisorName, setAdvisorName] = useState("Russell Capital Systems™");
  const [customTitle, setCustomTitle] = useState("");
  const [includeDisclaimer, setIncludeDisclaimer] = useState(true);
  const [showSpeakerNotes, setShowSpeakerNotes] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"setup" | "slides" | "preview" | "analytics" | "editor" | "audience" | "settings">("setup");
  
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBullets, setEditBullets] = useState<string[]>([]);
  const [editNotes, setEditNotes] = useState("");
  const [editType, setEditType] = useState<SlideContent["type"]>("content");
  const [editDuration, setEditDuration] = useState(60);
  
  const [timeRange, setTimeRange] = useState("6m");
  const [metricType, setMetricType] = useState("conversions");
  
  const [themeColor, setThemeColor] = useState("#22c55e");
  const [fontFamily, setFontFamily] = useState("Inter");
  const [logoUrl, setLogoUrl] = useState("");
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [showSlideNumbers, setShowSlideNumbers] = useState(true);
  const [enableQnA, setEnableQnA] = useState(true);
  
  const { data: clientData } = trpc.clients.list.useQuery();
  const { data: teamData } = trpc.team.members.useQuery();
  const { data: meetingData } = trpc.meetings.list.useQuery();
  const { data: analyticsData } = trpc.strategyAnalytics.getOverview.useQuery();
  const { data: campaignData } = trpc.emailCampaigns.list.useQuery();
  const { data: recommendationData } = trpc.recommendations.list.useQuery();
  
  const updateSettingsMutation = trpc.settings.update.useMutation();
  const saveTemplateMutation = trpc.savedStrategies.save.useMutation();
  const logActivityMutation = trpc.activity.log.useMutation();
  const generateSlidesMutation = trpc.ai.generateSlides.useMutation();
  
  const template = templates[selectedTemplateId];
  const slides = template?.slides || [];
  
  const totalDuration = useMemo(() => {
    return slides.reduce((acc, slide) => acc + slide.duration, 0);
  }, [slides]);
  
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const copySlideContent = (index: number) => {
    const slide = slides[index];
    const text = `${slide.title}\n\n${slide.bullets.map((b) => `• ${b}`).join("\n")}${showSpeakerNotes ? `\n\nSpeaker Notes:\n${slide.speakerNotes}` : ""}`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    
    logActivityMutation.mutate({
      type: "COPY_SLIDE",
      details: `Copied slide ${index + 1} from template ${template.name}`
    });
  };

  const copyAllSlides = () => {
    const text = slides.map((slide, i) => {
      return `--- Slide ${i + 1}: ${slide.title} ---\n\n${slide.bullets.map((b) => `• ${b}`).join("\n")}${showSpeakerNotes ? `\n\nSpeaker Notes:\n${slide.speakerNotes}` : ""}`;
    }).join("\n\n");
    navigator.clipboard.writeText(`${customTitle || template.name}\nPresented by ${advisorName}\n\n${text}`);
    
    logActivityMutation.mutate({
      type: "COPY_ALL_SLIDES",
      details: `Copied all slides from template ${template.name}`
    });
  };

  const handleTemplateChange = (val: string) => {
    setSelectedTemplateId(val);
    setActiveSlide(0);
  };
  
  const startEditingSlide = (slide: SlideContent) => {
    setEditingSlideId(slide.id);
    setEditTitle(slide.title);
    setEditBullets([...slide.bullets]);
    setEditNotes(slide.speakerNotes);
    setEditType(slide.type);
    setEditDuration(slide.duration);
    setActiveTab("editor");
  };
  
  const saveEditedSlide = () => {
    if (!editingSlideId) return;
    
    setTemplates(prev => {
      const newTemplates = { ...prev };
      const tmpl = { ...newTemplates[selectedTemplateId] };
      const slideIndex = tmpl.slides.findIndex(s => s.id === editingSlideId);
      
      if (slideIndex !== -1) {
        tmpl.slides[slideIndex] = {
          ...tmpl.slides[slideIndex],
          title: editTitle,
          bullets: editBullets,
          speakerNotes: editNotes,
          type: editType,
          duration: editDuration
        };
        newTemplates[selectedTemplateId] = tmpl;
      }
      
      return newTemplates;
    });
    
    setEditingSlideId(null);
    setActiveTab("slides");
  };
  
  const addBullet = () => {
    setEditBullets([...editBullets, ""]);
  };
  
  const updateBullet = (index: number, value: string) => {
    const newBullets = [...editBullets];
    newBullets[index] = value;
    setEditBullets(newBullets);
  };
  
  const removeBullet = (index: number) => {
    const newBullets = [...editBullets];
    newBullets.splice(index, 1);
    setEditBullets(newBullets);
  };
  
  const addNewSlide = () => {
    const newSlide: SlideContent = {
      id: `s${Date.now()}`,
      title: "New Slide",
      bullets: ["Point 1", "Point 2"],
      speakerNotes: "Add notes here...",
      type: "content",
      duration: 120
    };
    
    setTemplates(prev => {
      const newTemplates = { ...prev };
      const tmpl = { ...newTemplates[selectedTemplateId] };
      tmpl.slides = [...tmpl.slides, newSlide];
      newTemplates[selectedTemplateId] = tmpl;
      return newTemplates;
    });
    
    setActiveSlide(slides.length);
  };
  
  const deleteSlide = (index: number) => {
    if (slides.length <= 1) return; // Don't delete last slide
    
    setTemplates(prev => {
      const newTemplates = { ...prev };
      const tmpl = { ...newTemplates[selectedTemplateId] };
      tmpl.slides = tmpl.slides.filter((_, i) => i !== index);
      newTemplates[selectedTemplateId] = tmpl;
      return newTemplates;
    });
    
    if (activeSlide >= index && activeSlide > 0) {
      setActiveSlide(activeSlide - 1);
    }
  };
  
  const moveSlide = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === slides.length - 1) return;
    
    setTemplates(prev => {
      const newTemplates = { ...prev };
      const tmpl = { ...newTemplates[selectedTemplateId] };
      const newSlides = [...tmpl.slides];
      
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      const temp = newSlides[index];
      newSlides[index] = newSlides[swapIndex];
      newSlides[swapIndex] = temp;
      
      tmpl.slides = newSlides;
      newTemplates[selectedTemplateId] = tmpl;
      return newTemplates;
    });
    
    setActiveSlide(direction === 'up' ? index - 1 : index + 1);
  };

  const generateAITemplate = async () => {
    try {
      const result = await generateSlidesMutation.mutateAsync({
        topic: "Advanced Wealth Transfer Strategies",
        audience: "High Net Worth Individuals",
        duration: 45
      });
      
      alert("AI Template generated successfully! (Mocked)");
    } catch (error) {
      console.error("Failed to generate AI template", error);
    }
  };

  return (
    <AppShell>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="rc-page-header">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#0d1a2e] border border-[#12233e] flex items-center justify-center">
              <Presentation className="h-6 w-6 text-[#22c55e]" />
            </div>
            <div>
              <h1 className="rc-page-title">Seminar Presentation Generator Pro</h1>
              <p className="rc-page-subtitle">
                Create, customize, and analyze high-converting seminar presentations
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="bg-[#060d19] border-[#12233e] text-white hover:bg-[#12233e]" onClick={generateAITemplate}>
              <Zap className="h-4 w-4 mr-2 text-yellow-500" />
              AI Generate
            </Button>
            <ExportToSlides
              toolName="Seminar Presentation Generator"
              data={[
                {
                  title: "Seminar Details",
                  items: [
                    { label: "Template", value: template.name },
                    { label: "Duration", value: template.duration },
                    { label: "Audience", value: template.audience },
                    { label: "Slides", value: String(slides.length) }
                  ]
                }
              ]}
            />
            <button className="rc-btn rc-btn-primary" onClick={copyAllSlides}>
              <Copy className="h-4 w-4 mr-2" />
              Copy All Slides
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex border-b border-[#12233e] overflow-x-auto custom-scrollbar">
          <button
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "setup"
                ? "border-[#22c55e] text-white"
                : "border-transparent text-[#7a95b8] hover:text-[#c8d8ec]"
            }`}
            onClick={() => setActiveTab("setup")}
          >
            <Settings className="h-4 w-4 inline mr-2" />
            Setup
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "slides"
                ? "border-[#22c55e] text-white"
                : "border-transparent text-[#7a95b8] hover:text-[#c8d8ec]"
            }`}
            onClick={() => setActiveTab("slides")}
          >
            <Layout className="h-4 w-4 inline mr-2" />
            Slide Deck
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "editor"
                ? "border-[#22c55e] text-white"
                : "border-transparent text-[#7a95b8] hover:text-[#c8d8ec]"
            }`}
            onClick={() => setActiveTab("editor")}
          >
            <Edit className="h-4 w-4 inline mr-2" />
            Editor
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "preview"
                ? "border-[#22c55e] text-white"
                : "border-transparent text-[#7a95b8] hover:text-[#c8d8ec]"
            }`}
            onClick={() => setActiveTab("preview")}
          >
            <Play className="h-4 w-4 inline mr-2" />
            Preview
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "analytics"
                ? "border-[#22c55e] text-white"
                : "border-transparent text-[#7a95b8] hover:text-[#c8d8ec]"
            }`}
            onClick={() => setActiveTab("analytics")}
          >
            <BarChart3 className="h-4 w-4 inline mr-2" />
            Analytics
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "audience"
                ? "border-[#22c55e] text-white"
                : "border-transparent text-[#7a95b8] hover:text-[#c8d8ec]"
            }`}
            onClick={() => setActiveTab("audience")}
          >
            <Users2 className="h-4 w-4 inline mr-2" />
            Audience
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === "settings"
                ? "border-[#22c55e] text-white"
                : "border-transparent text-[#7a95b8] hover:text-[#c8d8ec]"
            }`}
            onClick={() => setActiveTab("settings")}
          >
            <Settings className="h-4 w-4 inline mr-2" />
            Settings
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "setup" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="rc-card">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Presentation className="h-5 w-5 mr-2 text-[#22c55e]" />
                  Presentation Configuration
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-[#c8d8ec]">Seminar Template</Label>
                    <Select value={selectedTemplateId} onValueChange={handleTemplateChange}>
                      <SelectTrigger className="w-full bg-[#060d19] border-[#12233e] text-white h-11">
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                        {Object.entries(templates).map(([key, tmpl]) => (
                          <SelectItem key={key} value={key} className="focus:bg-[#12233e] focus:text-white">
                            <div className="flex items-center justify-between w-full">
                              <span>{tmpl.name}</span>
                              <Badge variant="outline" className="ml-2 bg-[#12233e] border-none text-xs">
                                {tmpl.category}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[#c8d8ec]">Advisor/Company Name</Label>
                    <Input
                      value={advisorName}
                      onChange={(e) => setAdvisorName(e.target.value)}
                      className="rc-input h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[#c8d8ec]">Custom Title (Optional)</Label>
                    <Input
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      placeholder={template.name}
                      className="rc-input h-11"
                    />
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-[#12233e] grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-white mb-3">Compliance & Display</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-[#c8d8ec] block mb-1">Include NAIC Disclaimer</Label>
                        <span className="text-xs text-[#7a95b8]">Required for compliance in most states</span>
                      </div>
                      <Switch
                        checked={includeDisclaimer}
                        onCheckedChange={setIncludeDisclaimer}
                        className="data-[state=checked]:bg-[#22c55e]"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-[#c8d8ec] block mb-1">Show Speaker Notes</Label>
                        <span className="text-xs text-[#7a95b8]">Include talking points for each slide</span>
                      </div>
                      <Switch
                        checked={showSpeakerNotes}
                        onCheckedChange={setShowSpeakerNotes}
                        className="data-[state=checked]:bg-[#22c55e]"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-white mb-3">Interactivity</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-[#c8d8ec] block mb-1">Live Q&A Session</Label>
                        <span className="text-xs text-[#7a95b8]">Enable audience question submission</span>
                      </div>
                      <Switch
                        checked={enableQnA}
                        onCheckedChange={setEnableQnA}
                        className="data-[state=checked]:bg-[#22c55e]"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-[#c8d8ec] block mb-1">Interactive Polls</Label>
                        <span className="text-xs text-[#7a95b8]">Include QR codes for live polling</span>
                      </div>
                      <Switch
                        checked={true}
                        onCheckedChange={() => {}}
                        className="data-[state=checked]:bg-[#22c55e]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rc-card">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                  <Info className="h-5 w-5 mr-2 text-[#3b82f6]" />
                  Template Details
                </h2>
                <div className="p-4 rounded-xl bg-[#060d19] border border-[#12233e] mb-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-[#22c55e]">{template.name}</h3>
                    <Badge className="bg-[#12233e] text-white hover:bg-[#1a2e4c]">
                      {template.difficulty}
                    </Badge>
                  </div>
                  <p className="text-sm text-[#c8d8ec] leading-relaxed mb-4">{template.description}</p>
                  
                  <div className="flex flex-wrap gap-2 mt-3">
                    {template.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="border-[#3b82f6]/30 text-[#3b82f6] bg-[#3b82f6]/10">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rc-card">
                <h2 className="text-lg font-semibold text-white mb-4">Quick Stats</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#060d19] border border-[#12233e] flex flex-col items-center justify-center text-center group hover:border-[#22c55e]/50 transition-colors">
                    <Clock className="h-6 w-6 text-[#7a95b8] mb-2 group-hover:text-[#22c55e] transition-colors" />
                    <span className="rc-stat-value text-lg">{template.duration}</span>
                    <span className="rc-stat-label">Duration</span>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-[#060d19] border border-[#12233e] flex flex-col items-center justify-center text-center group hover:border-[#f0c040]/50 transition-colors">
                    <Users className="h-6 w-6 text-[#7a95b8] mb-2 group-hover:text-[#f0c040] transition-colors" />
                    <span className="rc-stat-value text-lg line-clamp-1" title={template.audience}>{template.audience}</span>
                    <span className="rc-stat-label">Target Audience</span>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-[#060d19] border border-[#12233e] flex flex-col items-center justify-center text-center group hover:border-[#3b82f6]/50 transition-colors">
                    <FileText className="h-6 w-6 text-[#7a95b8] mb-2 group-hover:text-[#3b82f6] transition-colors" />
                    <span className="rc-stat-value text-lg">{slides.length}</span>
                    <span className="rc-stat-label">Total Slides</span>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-[#060d19] border border-[#12233e] flex flex-col items-center justify-center text-center group hover:border-[#a855f7]/50 transition-colors">
                    <Target className="h-6 w-6 text-[#7a95b8] mb-2 group-hover:text-[#a855f7] transition-colors" />
                    <span className="rc-stat-value text-lg">{template.conversionRate}%</span>
                    <span className="rc-stat-label">Avg. Conversion</span>
                  </div>
                </div>
              </div>

              <div className="rc-card">
                <h2 className="text-lg font-semibold text-white mb-4">Template Performance</h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[#c8d8ec]">User Rating</span>
                      <span className="text-white font-medium">{template.rating} / 5.0</span>
                    </div>
                    <Progress value={template.rating * 20} className="h-2 bg-[#12233e] bg-[#f0c040]" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[#c8d8ec]">Usage Count</span>
                      <span className="text-white font-medium">{template.usageCount.toLocaleString()}</span>
                    </div>
                    <Progress value={Math.min(100, (template.usageCount / 2000) * 100)} className="h-2 bg-[#12233e] bg-[#3b82f6]" />
                  </div>
                </div>
                <div className="mt-6 p-3 bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-lg flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#22c55e] shrink-0 mt-0.5" />
                  <p className="text-sm text-[#c8d8ec]">This template is performing <strong>24% better</strong> than average for {template.category} seminars.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "slides" && (
          <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-250px)] min-h-[600px]">
            {/* Slide Navigator */}
            <div className="w-full lg:w-80 shrink-0 flex flex-col bg-[#0d1a2e] border border-[#12233e] rounded-xl overflow-hidden">
              <div className="p-4 border-b border-[#12233e] flex items-center justify-between bg-[#060d19]">
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center">
                  <List className="h-4 w-4 mr-2" />
                  Slide Outline
                </h3>
                <Badge className="bg-[#3b82f6] hover:bg-[#2563eb] text-white">{slides.length} Slides</Badge>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {slides.map((slide, i) => (
                  <div 
                    key={slide.id}
                    className={`group relative rounded-xl border transition-all ${
                      activeSlide === i 
                        ? "bg-[#12233e] border-[#22c55e]" 
                        : "bg-[#060d19] border-[#12233e] hover:border-[#7a95b8]"
                    }`}
                  >
                    <button
                      onClick={() => setActiveSlide(i)}
                      className="w-full text-left p-3 flex flex-col gap-2"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                          activeSlide === i ? "bg-[#22c55e]/20 text-[#22c55e]" : "bg-[#12233e] text-[#7a95b8]"
                        }`}>
                          {i + 1}
                        </div>
                        <span className={`text-sm font-medium line-clamp-2 ${activeSlide === i ? "text-white" : "text-[#c8d8ec]"}`}>
                          {slide.title}
                        </span>
                      </div>
                      <div className="pl-9 flex justify-between items-center">
                        <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          slide.type === 'title' ? 'bg-blue-500/10 text-blue-400' :
                          slide.type === 'content' ? 'bg-gray-500/10 text-gray-400' :
                          slide.type === 'chart' ? 'bg-purple-500/10 text-purple-400' :
                          slide.type === 'case-study' ? 'bg-amber-500/10 text-amber-400' :
                          slide.type === 'interactive' ? 'bg-pink-500/10 text-pink-400' :
                          'bg-green-500/10 text-green-400'
                        }`}>
                          {slide.type}
                        </span>
                        <span className="text-xs text-[#7a95b8] flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDuration(slide.duration)}
                        </span>
                      </div>
                    </button>
                    
                    {/* Quick Actions (visible on hover or active) */}
                    <div className={`absolute right-2 top-2 flex flex-col gap-1 ${activeSlide === i ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                      <button onClick={(e) => { e.stopPropagation(); startEditingSlide(slide); }} className="p-1.5 bg-[#1a2e4c] rounded text-[#7a95b8] hover:text-white hover:bg-[#3b82f6] transition-colors" title="Edit Slide">
                        <Edit className="h-3 w-3" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); moveSlide(i, 'up'); }} disabled={i === 0} className="p-1.5 bg-[#1a2e4c] rounded text-[#7a95b8] hover:text-white hover:bg-[#3b82f6] disabled:opacity-30 transition-colors" title="Move Up">
                        <ChevronLeft className="h-3 w-3 rotate-90" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); moveSlide(i, 'down'); }} disabled={i === slides.length - 1} className="p-1.5 bg-[#1a2e4c] rounded text-[#7a95b8] hover:text-white hover:bg-[#3b82f6] disabled:opacity-30 transition-colors" title="Move Down">
                        <ChevronRight className="h-3 w-3 rotate-90" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); deleteSlide(i); }} disabled={slides.length <= 1} className="p-1.5 bg-[#1a2e4c] rounded text-[#7a95b8] hover:text-white hover:bg-red-500 disabled:opacity-30 transition-colors" title="Delete Slide">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-4 border-t border-[#12233e] bg-[#060d19]">
                <Button onClick={addNewSlide} className="w-full bg-[#12233e] hover:bg-[#1a2e4c] text-white border border-[#2a4365]">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Slide
                </Button>
                <div className="mt-3 text-center text-xs text-[#7a95b8]">
                  Total Est. Time: {formatDuration(totalDuration)}
                </div>
              </div>
            </div>

            {/* Active Slide Viewer */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="rc-card flex-1 flex flex-col overflow-hidden p-0">
                <div className="flex items-center justify-between border-b border-[#12233e] p-4 bg-[#060d19]">
                  <div className="flex items-center gap-3">
                    <span className={`text-xs uppercase tracking-wider px-2.5 py-1 rounded-full font-medium ${
                      slides[activeSlide]?.type === 'title' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                      slides[activeSlide]?.type === 'content' ? 'bg-gray-500/10 text-gray-400 border border-gray-500/20' :
                      slides[activeSlide]?.type === 'chart' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                      slides[activeSlide]?.type === 'case-study' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      slides[activeSlide]?.type === 'interactive' ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20' :
                      'bg-green-500/10 text-green-400 border border-green-500/20'
                    }`}>
                      {slides[activeSlide]?.type || 'Unknown'}
                    </span>
                    <span className="text-sm text-[#7a95b8] font-medium">Slide {activeSlide + 1} of {slides.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-8 bg-[#12233e] border-[#2a4365] text-white hover:bg-[#1a2e4c]"
                      onClick={() => startEditingSlide(slides[activeSlide])}
                    >
                      <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit Slide
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 text-xs px-3 hover:bg-[#12233e] text-[#c8d8ec]"
                      onClick={() => copySlideContent(activeSlide)}
                    >
                      {copiedIndex === activeSlide ? (
                        <><CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-[#22c55e]" /> Copied</>
                      ) : (
                        <><Copy className="h-3.5 w-3.5 mr-1.5" /> Copy Text</>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#0d1a2e] relative">
                  {/* Aspect Ratio Container for Slide Preview */}
                  <div className="max-w-4xl mx-auto aspect-[16/9] bg-[#060d19] border border-[#12233e] rounded-xl shadow-2xl overflow-hidden flex flex-col relative">
                    {/* Theme Accent Line */}
                    <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: themeColor }}></div>
                    
                    <div className="p-10 flex-1 flex flex-col">
                      <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-8">
                        {slides[activeSlide]?.title}
                      </h2>

                      <div className="flex-1 flex flex-col justify-center">
                        {slides[activeSlide]?.type === 'title' ? (
                          <div className="text-center space-y-6 max-w-2xl mx-auto">
                            {slides[activeSlide]?.bullets.map((bullet, i) => (
                              <p key={i} className="text-xl text-[#c8d8ec] leading-relaxed">{bullet}</p>
                            ))}
                          </div>
                        ) : slides[activeSlide]?.type === 'chart' ? (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full items-center">
                            <div className="space-y-4">
                              {slides[activeSlide]?.bullets.map((bullet, i) => (
                                <div key={i} className="flex items-start gap-3">
                                  <div className="mt-2 w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: themeColor }}></div>
                                  <span className="text-lg text-[#c8d8ec] leading-relaxed">{bullet}</span>
                                </div>
                              ))}
                            </div>
                            <div className="h-64 bg-[#12233e]/50 rounded-xl border border-[#12233e] p-4 flex items-center justify-center">
                              <BarChart3 className="h-16 w-16 text-[#3b82f6]/50" />
                              <span className="ml-4 text-[#7a95b8]">Chart Placeholder</span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-6 max-w-3xl">
                            {slides[activeSlide]?.bullets.map((bullet, i) => (
                              <div key={i} className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-[#12233e] flex items-center justify-center shrink-0 border border-[#2a4365]">
                                  <span className="text-sm font-bold" style={{ color: themeColor }}>{i + 1}</span>
                                </div>
                                <span className="text-xl text-[#c8d8ec] leading-relaxed pt-0.5">{bullet}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Slide Footer */}
                      <div className="mt-8 pt-4 border-t border-[#12233e] flex justify-between items-center text-[#7a95b8] text-sm">
                        <div className="flex items-center">
                          {logoUrl ? (
                            <img src={logoUrl} alt="Logo" className="h-6 object-contain" />
                          ) : (
                            <span className="font-semibold">{advisorName}</span>
                          )}
                        </div>
                        {showSlideNumbers && <span>{activeSlide + 1}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Speaker Notes below slide */}
                  {showSpeakerNotes && (
                    <div className="max-w-4xl mx-auto mt-8 p-6 rounded-xl bg-[#f0c040]/5 border border-[#f0c040]/20 relative overflow-hidden shadow-lg">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-[#f0c040]"></div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-5 w-5 text-[#f0c040]" />
                          <span className="text-sm font-bold text-[#f0c040] uppercase tracking-wider">Speaker Notes</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#7a95b8] bg-[#060d19] px-3 py-1.5 rounded-full border border-[#12233e]">
                          <Clock className="h-3.5 w-3.5" />
                          Target Time: {formatDuration(slides[activeSlide]?.duration || 0)}
                        </div>
                      </div>
                      <p className="text-[16px] text-[#c8d8ec] leading-relaxed pl-7 border-l-2 border-[#12233e]">
                        {slides[activeSlide]?.speakerNotes || "No speaker notes provided for this slide."}
                      </p>
                    </div>
                  )}
                </div>

                {/* Navigation Controls */}
                <div className="p-4 border-t border-[#12233e] bg-[#060d19] flex items-center justify-between">
                  <Button 
                    variant="outline"
                    className="bg-[#12233e] border-[#2a4365] text-white hover:bg-[#1a2e4c]"
                    onClick={() => setActiveSlide(Math.max(0, activeSlide - 1))}
                    disabled={activeSlide === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous Slide
                  </Button>
                  
                  <div className="flex gap-1.5 flex-wrap justify-center max-w-[50%]">
                    {slides.map((_, i) => (
                      <button 
                        key={i}
                        onClick={() => setActiveSlide(i)}
                        className={`h-2 rounded-full transition-all ${
                          activeSlide === i ? "w-8" : "w-2 bg-[#12233e] hover:bg-[#2a4365]"
                        }`}
                        style={{ backgroundColor: activeSlide === i ? themeColor : undefined }}
                        title={`Go to slide ${i + 1}`}
                      />
                    ))}
                  </div>
                  
                  <Button 
                    variant="outline"
                    className="bg-[#12233e] border-[#2a4365] text-white hover:bg-[#1a2e4c]"
                    onClick={() => setActiveSlide(Math.min(slides.length - 1, activeSlide + 1))}
                    disabled={activeSlide === slides.length - 1}
                  >
                    Next Slide
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "editor" && (
          <div className="rc-card max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#12233e]">
              <h2 className="text-xl font-bold text-white flex items-center">
                <Edit className="h-5 w-5 mr-2 text-[#3b82f6]" />
                {editingSlideId ? "Edit Slide" : "Create New Slide"}
              </h2>
              {editingSlideId && (
                <Button variant="ghost" size="sm" onClick={() => { setEditingSlideId(null); setActiveTab("slides"); }} className="text-[#7a95b8] hover:text-white">
                  <X className="h-4 w-4 mr-2" /> Cancel
                </Button>
              )}
            </div>

            {editingSlideId ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[#c8d8ec]">Slide Title</Label>
                    <Input 
                      value={editTitle} 
                      onChange={(e) => setEditTitle(e.target.value)} 
                      className="rc-input bg-[#060d19]"
                      placeholder="Enter slide title..."
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[#c8d8ec]">Slide Type</Label>
                      <Select value={editType} onValueChange={(val: any) => setEditType(val)}>
                        <SelectTrigger className="bg-[#060d19] border-[#12233e] text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                          <SelectItem value="title">Title Slide</SelectItem>
                          <SelectItem value="content">Content</SelectItem>
                          <SelectItem value="chart">Chart/Data</SelectItem>
                          <SelectItem value="case-study">Case Study</SelectItem>
                          <SelectItem value="interactive">Interactive/Poll</SelectItem>
                          <SelectItem value="cta">Call to Action</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-[#c8d8ec]">Est. Duration (sec)</Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="number" 
                          value={editDuration} 
                          onChange={(e) => setEditDuration(Number(e.target.value))} 
                          className="rc-input bg-[#060d19]"
                          min={10}
                          step={10}
                        />
                        <span className="text-sm text-[#7a95b8] w-12">{formatDuration(editDuration)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-[#c8d8ec]">Bullet Points</Label>
                    <Button variant="ghost" size="sm" onClick={addBullet} className="h-8 text-xs text-[#3b82f6] hover:text-[#60a5fa] hover:bg-[#3b82f6]/10">
                      <Plus className="h-3 w-3 mr-1" /> Add Bullet
                    </Button>
                  </div>
                  
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {editBullets.map((bullet, i) => (
                      <div key={i} className="flex gap-2 items-start">
                        <div className="w-8 h-10 flex items-center justify-center shrink-0 text-[#7a95b8] font-medium">
                          {i + 1}.
                        </div>
                        <Textarea 
                          value={bullet} 
                          onChange={(e) => updateBullet(i, e.target.value)} 
                          className="rc-input bg-[#060d19] min-h-[40px] py-2 resize-none"
                          rows={2}
                        />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeBullet(i)} 
                          className="shrink-0 text-[#7a95b8] hover:text-red-400 hover:bg-red-400/10 mt-1"
                          disabled={editBullets.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#c8d8ec] flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2 text-[#f0c040]" />
                    Speaker Notes
                  </Label>
                  <Textarea 
                    value={editNotes} 
                    onChange={(e) => setEditNotes(e.target.value)} 
                    className="rc-input bg-[#060d19] min-h-[120px]"
                    placeholder="Add talking points, cues, and details for the presenter..."
                  />
                </div>

                <div className="pt-6 border-t border-[#12233e] flex justify-end gap-3">
                  <Button variant="outline" onClick={() => { setEditingSlideId(null); setActiveTab("slides"); }} className="bg-transparent border-[#2a4365] text-white hover:bg-[#12233e]">
                    Cancel
                  </Button>
                  <Button onClick={saveEditedSlide} className="bg-[#22c55e] hover:bg-[#16a34a] text-white">
                    <Save className="h-4 w-4 mr-2" />
                    Save Slide
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-[#12233e] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Layout className="h-8 w-8 text-[#7a95b8]" />
                </div>
                <h3 className="text-xl font-medium text-white mb-2">No Slide Selected</h3>
                <p className="text-[#7a95b8] mb-6 max-w-md mx-auto">
                  Select a slide from the Slide Deck tab to edit its content, or create a new slide to add to your presentation.
                </p>
                <Button onClick={() => setActiveTab("slides")} className="bg-[#3b82f6] hover:bg-[#2563eb] text-white">
                  Go to Slide Deck
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === "preview" && (
          <div className="space-y-8 max-w-5xl mx-auto">
            <div className="flex justify-between items-center bg-[#0d1a2e] p-4 rounded-xl border border-[#12233e]">
              <div>
                <h2 className="text-lg font-bold text-white">Full Presentation Preview</h2>
                <p className="text-sm text-[#7a95b8]">Review how your slides will look when presented</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="bg-[#060d19] border-[#2a4365] text-white">
                  <Monitor className="h-4 w-4 mr-2" /> Present Mode
                </Button>
                <Button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white">
                  <Download className="h-4 w-4 mr-2" /> Export PDF
                </Button>
              </div>
            </div>

            {/* Title Slide Preview */}
            <div className="aspect-[16/9] bg-[#060d19] border border-[#12233e] rounded-2xl flex flex-col items-center justify-center p-12 text-center relative overflow-hidden shadow-xl">
              <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: themeColor }}></div>
              <div className="absolute top-12 left-12 opacity-5">
                <Presentation className="h-48 w-48 text-white" />
              </div>
              
              <div className="z-10 max-w-3xl w-full">
                <h1 className="text-5xl md:text-6xl font-bold text-white mb-8 leading-tight">
                  {customTitle || template.name}
                </h1>
                <div className="w-24 h-1.5 mx-auto mb-8 rounded-full" style={{ backgroundColor: themeColor }}></div>
                <p className="text-2xl text-[#c8d8ec] mb-12">Presented by {advisorName}</p>
                
                <div className="flex justify-center gap-8">
                  <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-[#12233e] border border-[#2a4365]">
                    <Clock className="h-5 w-5 text-[#7a95b8]" />
                    <span className="text-base text-[#c8d8ec]">{template.duration}</span>
                  </div>
                  <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-[#12233e] border border-[#2a4365]">
                    <Users className="h-5 w-5 text-[#7a95b8]" />
                    <span className="text-base text-[#c8d8ec]">{template.audience}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Slides Preview Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {slides.map((slide, i) => (
                <div key={i} className="rc-card flex flex-col h-full relative overflow-hidden group hover:border-[#3b82f6]/50 transition-colors">
                  <div className={`absolute top-0 left-0 w-full h-1.5 ${
                    slide.type === 'title' ? 'bg-blue-500' :
                    slide.type === 'content' ? 'bg-gray-500' :
                    slide.type === 'chart' ? 'bg-purple-500' :
                    slide.type === 'case-study' ? 'bg-amber-500' :
                    slide.type === 'interactive' ? 'bg-pink-500' :
                    'bg-green-500'
                  }`}></div>
                  
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-[#060d19] border border-[#12233e] flex items-center justify-center text-base font-bold text-[#7a95b8]">
                        {i + 1}
                      </div>
                      <h3 className="text-xl font-bold text-white line-clamp-2 leading-tight">{slide.title}</h3>
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-4 mb-6 bg-[#060d19] p-5 rounded-xl border border-[#12233e]/50">
                    {slide.bullets.map((b, j) => (
                      <div key={j} className="flex items-start gap-3">
                        <div className="mt-2 w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: themeColor }}></div>
                        <span className="text-base text-[#c8d8ec] leading-relaxed">{b}</span>
                      </div>
                    ))}
                  </div>
                  
                  {showSpeakerNotes && (
                    <div className="mt-auto p-4 rounded-xl bg-[#f0c040]/5 border border-[#f0c040]/20 text-sm text-[#c8d8ec]">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4 text-[#f0c040]" />
                        <span className="font-semibold text-[#f0c040]">Notes</span>
                      </div>
                      <span className="line-clamp-3 opacity-90">{slide.speakerNotes}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {includeDisclaimer && (
              <div className="mt-12 p-8 bg-[#060d19] border border-[#12233e] rounded-2xl">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                  <Info className="h-5 w-5 mr-2 text-[#7a95b8]" />
                  Compliance Disclaimers
                </h3>
                <NAICDisclaimer variant="full" showsProjections showsCashValues showsPolicyLoans showsComparisons />
              </div>
            )}
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Seminar Performance Analytics</h2>
              <div className="flex gap-2">
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-32 bg-[#060d19] border-[#12233e] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                    <SelectItem value="1m">Last Month</SelectItem>
                    <SelectItem value="3m">Last 3 Months</SelectItem>
                    <SelectItem value="6m">Last 6 Months</SelectItem>
                    <SelectItem value="1y">Last Year</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="bg-[#060d19] border-[#12233e] text-white">
                  <Download className="h-4 w-4 mr-2" /> Export
                </Button>
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-[#060d19] border-[#12233e]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-[#7a95b8]">Total Attendees</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">1,245</div>
                  <p className="text-xs text-[#22c55e] flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" /> +12% from previous period
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-[#060d19] border-[#12233e]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-[#7a95b8]">Avg. Conversion Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">18.4%</div>
                  <p className="text-xs text-[#22c55e] flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" /> +2.1% from previous period
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-[#060d19] border-[#12233e]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-[#7a95b8]">Generated Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">$1.42M</div>
                  <p className="text-xs text-[#22c55e] flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" /> +15% from previous period
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-[#060d19] border-[#12233e]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-[#7a95b8]">Avg. Satisfaction</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">4.8/5.0</div>
                  <p className="text-xs text-[#7a95b8] flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1 text-[#7a95b8]" /> Stable
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Chart 1 */}
              <Card className="bg-[#060d19] border-[#12233e]">
                <CardHeader>
                  <CardTitle className="text-white">Attendance vs Conversions</CardTitle>
                  <CardDescription className="text-[#7a95b8]">Monthly performance over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={MOCK_PERFORMANCE_DATA} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                        <XAxis dataKey="month" stroke="#7a95b8" />
                        <YAxis yAxisId="left" stroke="#7a95b8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#7a95b8" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff' }}
                          itemStyle={{ color: '#c8d8ec' }}
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="attendees" name="Attendees" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Line yAxisId="right" type="monotone" dataKey="conversions" name="Conversions" stroke="#22c55e" strokeWidth={3} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Chart 2 */}
              <Card className="bg-[#060d19] border-[#12233e]">
                <CardHeader>
                  <CardTitle className="text-white">Conversion Funnel</CardTitle>
                  <CardDescription className="text-[#7a95b8]">Drop-off rates at each stage</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={MOCK_CONVERSION_FUNNEL} layout="vertical" margin={{ top: 20, right: 20, bottom: 20, left: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#12233e" horizontal={false} />
                        <XAxis type="number" stroke="#7a95b8" />
                        <YAxis dataKey="stage" type="category" stroke="#7a95b8" width={100} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff' }}
                          cursor={{ fill: '#12233e' }}
                        />
                        <Bar dataKey="count" name="People" fill="#a855f7" radius={[0, 4, 4, 0]}>
                          {MOCK_CONVERSION_FUNNEL.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Performance Chart 3 */}
              <Card className="bg-[#060d19] border-[#12233e]">
                <CardHeader>
                  <CardTitle className="text-white">Revenue Generation</CardTitle>
                  <CardDescription className="text-[#7a95b8]">Monthly revenue from seminar leads</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={MOCK_PERFORMANCE_DATA} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                        <XAxis dataKey="month" stroke="#7a95b8" />
                        <YAxis stroke="#7a95b8" tickFormatter={(value) => `$${value/1000}k`} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff' }}
                          formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="#f0c040" fill="#f0c040" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              {/* Performance Chart 4 */}
              <Card className="bg-[#060d19] border-[#12233e]">
                <CardHeader>
                  <CardTitle className="text-white">Speaker Ratings Breakdown</CardTitle>
                  <CardDescription className="text-[#7a95b8]">Average scores from attendee feedback</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={MOCK_SPEAKER_RATINGS}>
                        <PolarGrid stroke="#12233e" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#c8d8ec', fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#7a95b8' }} />
                        <Radar name="Score" dataKey="A" stroke="#22c55e" fill="#22c55e" fillOpacity={0.5} />
                        <Tooltip contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Data Table */}
            <Card className="bg-[#060d19] border-[#12233e]">
              <CardHeader>
                <CardTitle className="text-white">Recent Seminars</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-[#7a95b8] uppercase bg-[#0d1a2e] border-b border-[#12233e]">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Topic</th>
                        <th className="px-4 py-3">Location</th>
                        <th className="px-4 py-3">Attendees</th>
                        <th className="px-4 py-3">Conversions</th>
                        <th className="px-4 py-3">Rating</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-[#12233e] hover:bg-[#0d1a2e]/50">
                        <td className="px-4 py-3 text-white">Oct 15, 2023</td>
                        <td className="px-4 py-3 text-white font-medium">Retirement Tax Optimization</td>
                        <td className="px-4 py-3 text-[#c8d8ec]">Capital Grille, Seattle</td>
                        <td className="px-4 py-3 text-white">42</td>
                        <td className="px-4 py-3 text-[#22c55e] font-medium">8 (19%)</td>
                        <td className="px-4 py-3 text-[#f0c040]">4.8</td>
                        <td className="px-4 py-3"><Badge className="bg-green-500/10 text-green-400 hover:bg-green-500/20">Completed</Badge></td>
                      </tr>
                      <tr className="border-b border-[#12233e] hover:bg-[#0d1a2e]/50">
                        <td className="px-4 py-3 text-white">Oct 02, 2023</td>
                        <td className="px-4 py-3 text-white font-medium">Estate Planning Essentials</td>
                        <td className="px-4 py-3 text-[#c8d8ec]">Country Club, Bellevue</td>
                        <td className="px-4 py-3 text-white">28</td>
                        <td className="px-4 py-3 text-[#22c55e] font-medium">6 (21%)</td>
                        <td className="px-4 py-3 text-[#f0c040]">4.9</td>
                        <td className="px-4 py-3"><Badge className="bg-green-500/10 text-green-400 hover:bg-green-500/20">Completed</Badge></td>
                      </tr>
                      <tr className="border-b border-[#12233e] hover:bg-[#0d1a2e]/50">
                        <td className="px-4 py-3 text-white">Sep 18, 2023</td>
                        <td className="px-4 py-3 text-white font-medium">Business Owner Strategies</td>
                        <td className="px-4 py-3 text-[#c8d8ec]">Chamber of Commerce</td>
                        <td className="px-4 py-3 text-white">35</td>
                        <td className="px-4 py-3 text-[#22c55e] font-medium">5 (14%)</td>
                        <td className="px-4 py-3 text-[#f0c040]">4.5</td>
                        <td className="px-4 py-3"><Badge className="bg-green-500/10 text-green-400 hover:bg-green-500/20">Completed</Badge></td>
                      </tr>
                      <tr className="border-b border-[#12233e] hover:bg-[#0d1a2e]/50">
                        <td className="px-4 py-3 text-white">Sep 05, 2023</td>
                        <td className="px-4 py-3 text-white font-medium">Retirement Tax Optimization</td>
                        <td className="px-4 py-3 text-[#c8d8ec]">Webinar</td>
                        <td className="px-4 py-3 text-white">120</td>
                        <td className="px-4 py-3 text-[#22c55e] font-medium">12 (10%)</td>
                        <td className="px-4 py-3 text-[#f0c040]">4.6</td>
                        <td className="px-4 py-3"><Badge className="bg-green-500/10 text-green-400 hover:bg-green-500/20">Completed</Badge></td>
                      </tr>
                      <tr className="hover:bg-[#0d1a2e]/50">
                        <td className="px-4 py-3 text-white">Nov 12, 2023</td>
                        <td className="px-4 py-3 text-white font-medium">Year-End Tax Planning</td>
                        <td className="px-4 py-3 text-[#c8d8ec]">Morton's, Seattle</td>
                        <td className="px-4 py-3 text-white">45 (Reg)</td>
                        <td className="px-4 py-3 text-[#7a95b8]">-</td>
                        <td className="px-4 py-3 text-[#7a95b8]">-</td>
                        <td className="px-4 py-3"><Badge className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20">Upcoming</Badge></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "audience" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Audience Insights</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Demographics Chart */}
              <Card className="bg-[#060d19] border-[#12233e]">
                <CardHeader>
                  <CardTitle className="text-white">Age Demographics</CardTitle>
                  <CardDescription className="text-[#7a95b8]">Distribution of attendees across age groups</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={MOCK_AUDIENCE_DEMOGRAPHICS}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {MOCK_AUDIENCE_DEMOGRAPHICS.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff' }}
                          formatter={(value: number, name: string, props: any) => [`${props.payload.percentage}%`, props.payload.ageGroup]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Engagement Chart */}
              <Card className="bg-[#060d19] border-[#12233e]">
                <CardHeader>
                  <CardTitle className="text-white">Topic Engagement</CardTitle>
                  <CardDescription className="text-[#7a95b8]">Which topics hold audience attention longest</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={MOCK_TOPIC_ENGAGEMENT} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                        <XAxis dataKey="topic" stroke="#7a95b8" tick={{ fontSize: 12 }} />
                        <YAxis stroke="#7a95b8" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff' }}
                          cursor={{ fill: '#12233e' }}
                        />
                        <Legend />
                        <Bar dataKey="engagement" name="Engagement Score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="retention" name="Retention Rate" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Questions Table */}
            <Card className="bg-[#060d19] border-[#12233e]">
              <CardHeader>
                <CardTitle className="text-white">Frequently Asked Questions</CardTitle>
                <CardDescription className="text-[#7a95b8]">Most common questions asked during Q&A sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-[#7a95b8] uppercase bg-[#0d1a2e] border-b border-[#12233e]">
                      <tr>
                        <th className="px-4 py-3">Question Category</th>
                        <th className="px-4 py-3">Sample Question</th>
                        <th className="px-4 py-3">Frequency</th>
                        <th className="px-4 py-3">Suggested Slide Update</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-[#12233e] hover:bg-[#0d1a2e]/50">
                        <td className="px-4 py-3 text-white font-medium">Roth Conversions</td>
                        <td className="px-4 py-3 text-[#c8d8ec]">"How do I pay the tax on the conversion?"</td>
                        <td className="px-4 py-3 text-white">
                          <div className="flex items-center">
                            <span className="mr-2">High</span>
                            <Progress value={85} className="h-1.5 w-16 bg-[#12233e] bg-red-500" />
                          </div>
                        </td>
                        <td className="px-4 py-3"><Button variant="link" className="text-[#3b82f6] p-0 h-auto">Add to Slide 3</Button></td>
                      </tr>
                      <tr className="border-b border-[#12233e] hover:bg-[#0d1a2e]/50">
                        <td className="px-4 py-3 text-white font-medium">IUL Mechanics</td>
                        <td className="px-4 py-3 text-[#c8d8ec]">"What happens if the market goes down?"</td>
                        <td className="px-4 py-3 text-white">
                          <div className="flex items-center">
                            <span className="mr-2">High</span>
                            <Progress value={78} className="h-1.5 w-16 bg-[#12233e] bg-orange-500" />
                          </div>
                        </td>
                        <td className="px-4 py-3"><Button variant="link" className="text-[#3b82f6] p-0 h-auto">Add to Slide 4</Button></td>
                      </tr>
                      <tr className="border-b border-[#12233e] hover:bg-[#0d1a2e]/50">
                        <td className="px-4 py-3 text-white font-medium">Fees & Costs</td>
                        <td className="px-4 py-3 text-[#c8d8ec]">"How much does an ILIT cost to set up?"</td>
                        <td className="px-4 py-3 text-white">
                          <div className="flex items-center">
                            <span className="mr-2">Med</span>
                            <Progress value={55} className="h-1.5 w-16 bg-[#12233e] bg-yellow-500" />
                          </div>
                        </td>
                        <td className="px-4 py-3"><Button variant="link" className="text-[#3b82f6] p-0 h-auto">Add to Slide 3</Button></td>
                      </tr>
                      <tr className="hover:bg-[#0d1a2e]/50">
                        <td className="px-4 py-3 text-white font-medium">Timing</td>
                        <td className="px-4 py-3 text-[#c8d8ec]">"When should I start taking Social Security?"</td>
                        <td className="px-4 py-3 text-white">
                          <div className="flex items-center">
                            <span className="mr-2">Low</span>
                            <Progress value={30} className="h-1.5 w-16 bg-[#12233e] bg-green-500" />
                          </div>
                        </td>
                        <td className="px-4 py-3"><Button variant="link" className="text-[#3b82f6] p-0 h-auto">Add to Slide 6</Button></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">Global Presentation Settings</h2>
            
            <Card className="bg-[#060d19] border-[#12233e]">
              <CardHeader>
                <CardTitle className="text-white">Branding & Appearance</CardTitle>
                <CardDescription className="text-[#7a95b8]">Customize how your slides look</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[#c8d8ec]">Theme Primary Color</Label>
                    <div className="flex gap-3 mt-2">
                      {['#22c55e', '#3b82f6', '#f0c040', '#a855f7', '#ec4899', '#f97316'].map((color) => (
                        <button
                          key={color}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${themeColor === color ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                          style={{ backgroundColor: color }}
                          onClick={() => setThemeColor(color)}
                          title={`Select color ${color}`}
                        />
                      ))}
                      <div className="relative">
                        <input 
                          type="color" 
                          value={themeColor} 
                          onChange={(e) => setThemeColor(e.target.value)}
                          className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                        />
                        <div 
                          className="w-8 h-8 rounded-full border-2 border-dashed border-[#7a95b8] flex items-center justify-center bg-[#0d1a2e]"
                          title="Custom color"
                        >
                          <Plus className="h-4 w-4 text-[#7a95b8]" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-[#c8d8ec]">Font Family</Label>
                    <Select value={fontFamily} onValueChange={setFontFamily}>
                      <SelectTrigger className="bg-[#0d1a2e] border-[#12233e] text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                        <SelectItem value="Inter">Inter (Modern Sans)</SelectItem>
                        <SelectItem value="Merriweather">Merriweather (Classic Serif)</SelectItem>
                        <SelectItem value="Montserrat">Montserrat (Geometric)</SelectItem>
                        <SelectItem value="Playfair Display">Playfair Display (Elegant)</SelectItem>
                        <SelectItem value="Roboto">Roboto (Clean)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#c8d8ec]">Company Logo URL</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={logoUrl} 
                      onChange={(e) => setLogoUrl(e.target.value)} 
                      placeholder="https://example.com/logo.png"
                      className="rc-input bg-[#0d1a2e]"
                    />
                    <Button variant="outline" className="bg-[#12233e] border-[#2a4365] text-white shrink-0">
                      <Upload className="h-4 w-4 mr-2" /> Upload
                    </Button>
                  </div>
                  {logoUrl && (
                    <div className="mt-2 p-4 bg-[#0d1a2e] rounded-lg border border-[#12233e] flex items-center justify-center h-24">
                      <img src={logoUrl} alt="Logo Preview" className="max-h-full max-w-full object-contain" onError={() => setLogoUrl('')} />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#060d19] border-[#12233e]">
              <CardHeader>
                <CardTitle className="text-white">Playback Preferences</CardTitle>
                <CardDescription className="text-[#7a95b8]">Control how the presentation behaves</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-[#0d1a2e] rounded-lg border border-[#12233e]">
                  <div>
                    <Label className="text-white font-medium">Auto-Advance Slides</Label>
                    <p className="text-xs text-[#7a95b8] mt-1">Automatically move to next slide based on estimated duration</p>
                  </div>
                  <Switch checked={autoAdvance} onCheckedChange={setAutoAdvance} className="data-[state=checked]:bg-[#22c55e]" />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-[#0d1a2e] rounded-lg border border-[#12233e]">
                  <div>
                    <Label className="text-white font-medium">Show Slide Numbers</Label>
                    <p className="text-xs text-[#7a95b8] mt-1">Display current slide number in bottom right corner</p>
                  </div>
                  <Switch checked={showSlideNumbers} onCheckedChange={setShowSlideNumbers} className="data-[state=checked]:bg-[#22c55e]" />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-[#0d1a2e] rounded-lg border border-[#12233e]">
                  <div>
                    <Label className="text-white font-medium">Presenter View by Default</Label>
                    <p className="text-xs text-[#7a95b8] mt-1">Always open presentations with speaker notes visible</p>
                  </div>
                  <Switch checked={true} onCheckedChange={() => {}} className="data-[state=checked]:bg-[#22c55e]" />
                </div>
              </CardContent>
              <CardFooter className="border-t border-[#12233e] pt-4 flex justify-end">
                <Button className="bg-[#22c55e] hover:bg-[#16a34a] text-white">
                  <Save className="h-4 w-4 mr-2" /> Save Settings
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
        
        <PageInsights pageId="seminar-generator" />
      </div>
    </AppShell>
  );
}
