// @ts-nocheck
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/_core/hooks/useAuth";
import { PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer } from "recharts";
import { trpc } from "@/lib/trpc";
import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import {
  GraduationCap,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Trophy,
  Zap,
  Target,
  TrendingUp,
  Users,
  Brain,
  DollarSign,
  Award,
  ArrowRight,
  Rocket,
  BookOpen,
  Calculator,
  Home,
  Layers,
  Activity,
  Settings,
  Leaf,
  RefreshCw,
  Presentation,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExportToSlides } from "@/components/ExportToSlides";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const WELCOME_SLIDES = [
  {
    id: "w1",
    title: "Welcome, Advisor!",
    subtitle: "Your Personal Command Center Awaits",
    content: "You just unlocked the most advanced financial advisory toolkit ever assembled. Every feature on RussellCapitalSystems.com was designed to do one thing: put more money in your pocket by making you faster, sharper, and more persuasive than any competitor in your market.",
    icon: Rocket,
    gradient: "from-emerald-500 to-cyan-500",
  },
  {
    id: "w2",
    title: "Before Russell Capital Systems™ vs. After Russell Capital Systems™",
    subtitle: "The Day-to-Day Transformation",
    content: "Before: You spend 4 hours prepping a single client presentation, juggling spreadsheets, carrier websites, and generic slides. After: You walk into every meeting with system-generated strategies, real-time tax analysis, interactive projections, and closing scripts — all prepared in under 15 minutes.",
    icon: Zap,
    gradient: "from-amber-500 to-orange-500",
    comparison: [
      { before: "4 hrs prep per meeting", after: "15 min prep per meeting" },
      { before: "1 strategy option", after: "3-4 custom strategies" },
      { before: "Generic illustrations", after: "system-personalized projections" },
      { before: "Guessing tax impact", after: "Exact bracket analysis" },
    ],
  },
  {
    id: "w3",
    title: "Your Production Potential",
    subtitle: "What Top Advisors Achieve With These Tools",
    content: "The advisors who master these tools don't just improve — they transform. We're talking about going from 3 cases/month to 5+, from $8K average premium to $14K+, and from 60-hour weeks to 40-hour weeks with higher income.",
    icon: Trophy,
    gradient: "from-violet-500 to-purple-500",
    stats: [
      { label: "Monthly Cases", value: "3→5+" },
      { label: "Avg Premium", value: "$8K→$14K" },
      { label: "Work Hours", value: "60→40/wk" },
      { label: "Annual Income", value: "+$120K" },
    ],
  },
  {
    id: "w4",
    title: "How This Tutorial Works",
    subtitle: "Learn, Practice, Earn Badges, Dominate",
    content: "We'll start with the basics — comfortable navigation and the tools you'll use every single day. Then we'll build up to advanced strategies. Answer honestly in the assessment and we'll customize which features to focus on first. Every section earns you points and badges. Let's go!",
    icon: GraduationCap,
    gradient: "from-blue-500 to-indigo-500",
  },
];

const QUESTIONNAIRE = [{
    id: "q1",
    question: "How long have you been selling life insurance or annuities?",
    options: [
      { value: "new", label: "I'm brand new (0-6 months)" },
      { value: "junior", label: "1-3 years — still building my book" },
      { value: "mid", label: "3-7 years — consistent producer" },
      { value: "senior", label: "7+ years — seasoned veteran" },
    ],
  },
,
  {
    id: "q2",
    question: "What's your primary selling environment?",
    options: [
      { value: "in-person", label: "In-person kitchen table meetings" },
      { value: "virtual", label: "Virtual/Zoom presentations" },
      { value: "hybrid", label: "Mix of both in-person and virtual" },
      { value: "seminar", label: "Seminar-based selling" },
    ],
  },
,
  {
    id: "q3",
    question: "Which product do you feel LEAST confident presenting?",
    options: [
      { value: "iul", label: "Indexed Universal Life (IUL)" },
      { value: "fia", label: "Fixed Indexed Annuities (FIA)" },
      { value: "roth", label: "Roth Conversion Strategies" },
      { value: "tax", label: "Tax-advantaged planning" },
    ],
  },
,
  {
    id: "q4",
    question: "What kills most of your deals?",
    options: [
      { value: "stall", label: "Client says 'Let me think about it'" },
      { value: "spouse", label: "Spouse isn't on board" },
      { value: "trust", label: "Client doesn't fully trust the product" },
      { value: "price", label: "Premium is too high" },
    ],
  },
,
  {
    id: "q5",
    question: "How many prospects are currently in your pipeline right now?",
    options: [
      { value: "few", label: "Less than 5 — I need more leads" },
      { value: "some", label: "5-15 — decent but could be better" },
      { value: "good", label: "15-30 — solid pipeline" },
      { value: "full", label: "30+ — I can barely keep up" },
    ],
  }
];

const TOP_FEATURES = [{
    id: "f1",
    rank: 1,
    name: "Your Dashboard — Home Base",
    path: "/portal",
    icon: Compass,
    category: "Getting Started",
    difficulty: "Beginner",
    monthlyImpact: "$1,500",
    annualImpact: "$18,000",
    retailBuildCost: "$185,000",
    timeToLearn: "3 min",
    description: "Think of the Dashboard as your cockpit. It shows your total clients, active deals, pipeline value, and coaching alerts — all in one glance. No more opening 5 tabs to figure out where you stand.",
    whyItMatters: "The first 10 minutes of your day set the tone. When you open your Dashboard and instantly see which clients need follow-up, which deals are stalling, and what your numbers look like — you start every day with a plan instead of scrambling.",
    howItWorks: "Log in and you're here. Stat cards show key metrics with 30-day sparklines. Click any card to drill into the data. The system coaching section flags your highest-priority actions for the day.",
    salesImpact: "Advisors who check their dashboard daily close 25% more cases because they never lose track of opportunities. That's an extra 1-2 cases/month for most producers.",
    drillDowns: [
      { id: "d1-1", title: "Reading Your Stat Cards", content: "Each card shows a number and a sparkline trend. Green trending up = you're growing. Amber flat = maintain effort. Red declining = needs attention. Click any card to see the underlying data." },
      { id: "d1-2", title: "Coaching Alerts", content: "The system analyzes your activity and surfaces the most impactful action you can take today. 'Call Mrs. Johnson — her follow-up is 5 days overdue and she's a $15K case.' These alerts are gold." },
      { id: "d1-3", title: "Quick Navigation", content: "Every section of the site is accessible from the left sidebar. The Dashboard is always one click away via the top-left logo. Learn the sidebar sections and you'll never feel lost." },
    ],
  },
,
  {
    id: "f2",
    rank: 2,
    name: "Adding & Managing Clients",
    path: "/portal/clients",
    icon: Users,
    category: "Getting Started",
    difficulty: "Beginner",
    monthlyImpact: "$3,000",
    annualImpact: "$36,000",
    retailBuildCost: "$240,000",
    timeToLearn: "8 min",
    description: "Every tool on Russell Capital Systems™ connects to your client profiles. Add a client once, and every calculator, strategy engine, and projection tool automatically pulls their data. No re-entering numbers.",
    whyItMatters: "Your client data is the fuel for every feature on this platform. The more complete the profile, the more powerful every tool becomes. A client with full financial data gets smart strategies that are 10x more relevant than generic illustrations.",
    howItWorks: "Click 'Clients' in the sidebar → 'Add Client' button. Enter name, age, income, assets (IRA, Roth, taxable, real estate). The system auto-calculates their opportunity score and flags which tools will be most impactful for their situation.",
    salesImpact: "Organized advisors with complete client data close 35% more referral cases. When a client says 'My neighbor Bob might be interested,' you can pull up Bob's profile in 2 seconds and have a strategy ready in 30 seconds.",
    drillDowns: [
      { id: "d2-1", title: "The Client Card", content: "Each client shows as a card with name, net worth, opportunity score (1-100), and a color-coded 'last contacted' indicator. Green = recent. Yellow = getting stale. Red = you're losing them." },
      { id: "d2-2", title: "Financial Snapshot", content: "Click any client to see their full picture: IRA balance, Roth balance, taxable assets, real estate equity, income sources, and tax bracket. This is what feeds every calculator." },
      { id: "d2-3", title: "Activity Timeline", content: "Every interaction is logged: calls, meetings, emails, strategy runs. You'll never forget what you discussed or what you promised to follow up on." },
      { id: "d2-4", title: "Pro Tip: Batch Entry", content: "Got 20 clients to add? Use the import feature to upload a CSV. Name, age, income, assets — done in 2 minutes instead of 2 hours." },
    ],
  },
,
  {
    id: "f3",
    rank: 3,
    name: "The Retirement Drivers — Your Opening Pitch",
    path: "/portal/ecological-drivers",
    icon: Leaf,
    category: "Presentation Tools",
    difficulty: "Beginner",
    monthlyImpact: "$4,500",
    annualImpact: "$54,000",
    retailBuildCost: "$320,000",
    timeToLearn: "12 min",
    description: "This is your secret weapon for first meetings. Show clients the 10 biggest threats to their retirement — ranked by severity with interactive charts — and watch their eyes widen. Then present the IUL solution for each threat.",
    whyItMatters: "Most advisors walk into a first meeting and start talking about products. That's backwards. The Retirement Drivers tool lets you start with PROBLEMS — the client's problems — and position yourself as the expert who has solutions. This completely changes the power dynamic.",
    howItWorks: "Open the tool and share your screen (or turn your laptop). The radar chart shows all 10 threats at once. Click any threat to expand the analysis. Each one includes discovery questions you can ask the client, real-world impact data, and the specific IUL strategy that addresses it.",
    salesImpact: "Advisors who lead with Retirement Drivers report 50% higher first-meeting engagement. Clients go from 'I'm just looking' to 'What do we do about this?' in 10 minutes. Average time to proposal: cut in half.",
    drillDowns: [
      { id: "d3-1", title: "The Radar Chart — Your Visual Hook", content: "The radar chart shows all 10 threats simultaneously. It's visually striking and immediately communicates scope. Clients can't ignore 10 red zones on a chart. Use this as your opening visual." },
      { id: "d3-2", title: "Discovery Questions Built In", content: "Each threat includes 2-3 questions to ask the client. 'Have you calculated how much of your Social Security will be taxed?' These questions create urgency without being pushy." },
      { id: "d3-3", title: "The IUL Solution Panel", content: "After showing the problem, click to reveal the solution. Each threat maps to a specific IUL benefit: tax-free income, downside protection, inflation hedge, etc. The transition from problem to solution is seamless." },
      { id: "d3-4", title: "Presentation Mode", content: "Click the expand icon to go full-screen. Perfect for screen sharing on Zoom or turning your laptop toward the client. Clean, professional, impressive." },
    ],
  },
,
  {
    id: "f4",
    rank: 4,
    name: "Tax Waterfall — The 'Aha Moment' Generator",
    path: "/portal/tax-waterfall",
    icon: TrendingUp,
    category: "Presentation Tools",
    difficulty: "Intermediate",
    monthlyImpact: "$3,500",
    annualImpact: "$42,000",
    retailBuildCost: "$195,000",
    timeToLearn: "10 min",
    description: "Show clients exactly how their income flows through tax brackets with a stunning waterfall visualization. Then show them the 'headroom' — how much they can convert to Roth or redirect to IUL before hitting the next bracket.",
    whyItMatters: "When a client SEES their money flowing through brackets — and sees the gap between where they are and where the next bracket starts — the Roth/IUL conversation becomes obvious. You're not selling; you're showing them money they're leaving on the table.",
    howItWorks: "Enter the client's income and filing status (or select a client and it auto-fills). The waterfall chart shows income stacking through each bracket. The green 'headroom' zone shows how much room they have before the next bracket. IRMAA thresholds are marked with warning lines.",
    salesImpact: "Tax-visual presentations close 45% larger cases. When clients see $47,000 of headroom in the 22% bracket, they immediately understand why converting now saves them $100K+ over 20 years.",
    drillDowns: [
      { id: "d4-1", title: "Reading the Waterfall", content: "Income stacks from bottom to top through brackets: 10%, 12%, 22%, 24%, 32%, 35%, 37%. Each band is color-coded. The client's income fills bands until it stops — the remaining space is their opportunity." },
      { id: "d4-2", title: "IRMAA Warning Lines", content: "Medicare IRMAA surcharges kick in at specific income thresholds. The waterfall marks these with red dashed lines. If a client is near an IRMAA cliff, you can show them exactly how much a Roth conversion would cost vs. save." },
      { id: "d4-3", title: "The Headroom Pitch", content: "Point to the green zone and say: 'This is money you could be moving from your IRA to a Roth — or into an IUL — at your CURRENT tax rate, before rates go up.' This is the most powerful visual in your arsenal." },
    ],
  },
,
  {
    id: "f5",
    rank: 5,
    name: "Strategy Lab — Does the Heavy Lifting",
    path: "/portal/strategy",
    icon: Brain,
    category: "Strategy Tools",
    difficulty: "Intermediate",
    monthlyImpact: "$5,000",
    annualImpact: "$60,000",
    retailBuildCost: "$450,000",
    timeToLearn: "15 min",
    description: "Select a client, click 'Generate Strategy,' and watch the system build a complete financial plan in 30 seconds. Roth conversion ladder, IUL projections, real estate sheltering — all customized to their exact situation.",
    whyItMatters: "This is the tool that turns a 4-hour prep session into a 30-second button click. The system considers 50+ variables simultaneously — tax brackets, IRMAA, sequence risk, inflation, longevity — and produces a plan that would take a CFP team a full day to create manually.",
    howItWorks: "Select a client from the dropdown (their data auto-loads). Choose strategy types: Roth Conversion, IUL Optimization, Real Estate Shelter, or Combined. Click Generate. The system produces year-by-year projections with explanations in plain English.",
    salesImpact: "You can now present 3-4 custom strategies per meeting instead of 1 generic illustration. More options = higher close rates. Advisors using Strategy Lab report $5,000/month in additional production from faster, more personalized proposals.",
    drillDowns: [
      { id: "d5-1", title: "Strategy Types Explained", content: "Roth Ladder: Multi-year conversion plan. IUL Optimization: Premium and benefit projections. Real Estate Shelter: Equity repositioning. Combined: All three working together. Start with Combined for the biggest impact." },
      { id: "d5-2", title: "Reading the system Output", content: "The the system generates a narrative explanation ('Based on John's $450K IRA and 24% bracket...') plus a data table with year-by-year numbers. Share the narrative with the client, use the table for detail questions." },
      { id: "d5-3", title: "Save & Compare", content: "Save multiple strategies to a client's profile. In the next meeting, pull up 3 options side-by-side and let the client choose. This 'menu approach' increases close rates by 35%." },
      { id: "d5-4", title: "Advisor Scripts", content: "Each strategy includes suggested talking points and objection handlers. 'If the client asks about fees...' 'If the client worries about market risk...' You're never caught off guard." },
    ],
  }
];

const BADGES = [{ id: "b1", name: "First Steps", emoji: "👣", description: "Completed the welcome slides" },
,
  { id: "b2", name: "Self-Aware", emoji: "🧠", description: "Completed the assessment" },
,
  { id: "b3", name: "Navigator", emoji: "🧭", description: "Learned 5 features" },
,
  { id: "b4", name: "Power User", emoji: "⚡", description: "Learned 10 features" },
,
  { id: "b5", name: "Master Advisor", emoji: "🏆", description: "Completed all 15 features" }
];

const COST_SUMMARY = {
  totalRetailCost: "$2,810,000",
  hourlyDevRate: "$175",
  estimatedHours: "16,057",
  teamSize: "8-12 developers",
  timeToBuilt: "18-24 months",
  annualMaintenance: "$340,000",
  totalMonthlyImpact: "$41,500",
  totalAnnualImpact: "$498,000",
};

type TutorialStep = "welcome" | "questionnaire" | "features" | "cost" | "complete";
const STEP_ORDER: TutorialStep[] = ["welcome", "questionnaire", "features", "cost", "complete"];
const STEP_LABELS: Record<TutorialStep, string> = {
  welcome: "Welcome",
  questionnaire: "Assessment",
  features: "Feature Walkthroughs",
  cost: "Value & ROI",
  complete: "Graduation",
};

export default function IndividualAgentTutorial() {
  const { user } = useAuth();
  const progressQuery = trpc.tutorial.getProgress.useQuery(undefined, { enabled: !!user });
  const saveMutation = trpc.tutorial.saveProgress.useMutation();
  const completeSectionMutation = trpc.tutorial.completeSection.useMutation();

  const [currentStep, setCurrentStep] = useState<TutorialStep>("welcome");
  const [welcomeSlide, setWelcomeSlide] = useState(0);
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<Record<string, string>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questionnaireComplete, setQuestionnaireComplete] = useState(false);
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState(0);
  const [expandedDrillDown, setExpandedDrillDown] = useState<Record<string, string | null>>({});
  const [completedSections, setCompletedSections] = useState<string[]>([]);
  const [completedSubSections, setCompletedSubSections] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [badges, setBadges] = useState<{id: string; name: string; emoji: string; description: string; earnedAt: string}[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [showBadgePopup, setShowBadgePopup] = useState<typeof BADGES[0] | null>(null);
  const [featureFilter, setFeatureFilter] = useState<string>("all");
  const [startTime] = useState(() => Date.now());

  useEffect(() => {
    if (progressQuery.data) {
      const p = progressQuery.data;
      if (p.questionnaireAnswers) setQuestionnaireAnswers(p.questionnaireAnswers as any);
      if (p.questionnaireCompleted) setQuestionnaireComplete(true);
      if (p.completedSections) setCompletedSections(p.completedSections);
      if (p.completedSubSections) setCompletedSubSections(p.completedSubSections as any || []);
      if (p.score) setScore(p.score);
      if (p.badges) setBadges(p.badges as any);
      if (p.totalPointsEarned) setTotalPoints(p.totalPointsEarned);
      if (p.currentStep) {
        const stepIdx = Math.min(p.currentStep, STEP_ORDER.length - 1);
        setCurrentStep(STEP_ORDER[stepIdx]);
      }
    }
  }, [progressQuery.data]);

  const saveProgress = useCallback((overrides: Record<string, any> = {}) => {
    const stepIdx = STEP_ORDER.indexOf(currentStep);
    saveMutation.mutate({
      role: "solo_agent",
      questionnaireAnswers,
      questionnaireCompleted: questionnaireComplete,
      completedSections,
      completedSubSections,
      currentStep: stepIdx,
      score,
      badges,
      totalPointsEarned: totalPoints,
      ...overrides,
    });
  }, [currentStep, questionnaireAnswers, questionnaireComplete, completedSections, completedSubSections, score, badges, totalPoints]);

  const awardBadge = useCallback((badgeId: string) => {
    if (badges.some(b => b.id === badgeId)) return;
    const badge = BADGES.find((b) => b.id === badgeId);
    if (!badge) return;
    const newBadge = { ...badge, earnedAt: new Date().toISOString() };
    setBadges(prev => [...prev, newBadge]);
    setTotalPoints(prev => prev + 50);
    setShowBadgePopup(badge);
    toast.success(`Badge Earned: ${badge.emoji} ${badge.name}!`);
    setTimeout(() => setShowBadgePopup(null), 3000);
  }, [badges]);

  const markSectionComplete = useCallback((sectionId: string, points: number = 10) => {
    if (completedSections.includes(sectionId)) return;
    setCompletedSections(prev => [...prev, sectionId]);
    setTotalPoints(prev => prev + points);
    const newCount = completedSections.length + 1;
    setScore(Math.min(100, Math.round((newCount / 20) * 100)));
    completeSectionMutation.mutate({ sectionId, pointsEarned: points });
  }, [completedSections]);

  const overallProgress = useMemo(() => {
    const totalSteps = 4 + QUESTIONNAIRE.length + TOP_FEATURES.length + 1;
    return Math.round((completedSections.length / totalSteps) * 100);
  }, [completedSections]);

  const categories = useMemo(() => {
    const cats: string[] = [];
    TOP_FEATURES.forEach((f) => { if (!cats.includes(f.category)) cats.push(f.category); });
    return ["all", ...cats];
  }, []);

  const filteredFeatures = useMemo(() => {
    if (featureFilter === "all") return TOP_FEATURES;
    return TOP_FEATURES.filter((f) => f.category === featureFilter);
  }, [featureFilter]);

  const recommendedFeatures = useMemo(() => {
    if (!questionnaireComplete) return TOP_FEATURES;
    const a = questionnaireAnswers;
    const priority: string[] = [];
    if (a.q3 === "iul") priority.push("f7", "f3", "f8");
    if (a.q3 === "roth") priority.push("f9", "f4", "f5");
    if (a.q3 === "tax") priority.push("f4", "f9", "f5");
    if (a.q4 === "stall") priority.push("f13", "f7", "f14");
    if (a.q4 === "trust") priority.push("f3", "f7", "f8");
    if (a.q4 === "price") priority.push("f6", "f5", "f4");
    if (a.q10 === "closing") priority.push("f14", "f10", "f7");
    if (a.q10 === "time") priority.push("f1", "f5", "f15");
    if (a.q10 === "knowledge") priority.push("f10", "f9", "f3");
    return [...TOP_FEATURES].sort((a, b) => {
      const aIdx = priority.indexOf(a.id);
      const bIdx = priority.indexOf(b.id);
      if (aIdx >= 0 && bIdx < 0) return -1;
      if (aIdx < 0 && bIdx >= 0) return 1;
      if (aIdx >= 0 && bIdx >= 0) return aIdx - bIdx;
      return 0;
    });
  }, [questionnaireComplete, questionnaireAnswers]);

  const featuresCanIgnore = useMemo(() => {
    if (!questionnaireComplete) return [];
    const a = questionnaireAnswers;
    const ignore: string[] = [];
    if (a.q1 === "senior") ignore.push("f1");
    if (a.q5 === "few") ignore.push("f11");
    if (a.q9 === "always") ignore.push("f13");
    return ignore;
  }, [questionnaireComplete, questionnaireAnswers]);

  const goToStep = (step: TutorialStep) => {
    setCurrentStep(step);
    saveProgress({ currentStep: STEP_ORDER.indexOf(step) });
  };

  const nextStep = () => {
    const idx = STEP_ORDER.indexOf(currentStep);
    if (idx < STEP_ORDER.length - 1) goToStep(STEP_ORDER[idx + 1]);
  };

  const renderWelcome = () => {
    const slide = WELCOME_SLIDES[welcomeSlide];
    const Icon = slide.icon;
    return (
      <div className="space-y-6">
        <div className={cn("relative overflow-hidden rounded-2xl bg-gradient-to-br p-8 md:p-12 text-white", slide.gradient)}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                <Icon className="w-8 h-8" />
              </div>
              <div>
                <p className="text-white/70 text-sm font-medium uppercase tracking-wider">{slide.subtitle}</p>
                <h2 className="text-3xl md:text-4xl font-bold">{slide.title}</h2>
              </div>
            </div>
            <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-3xl">{slide.content}</p>
            {slide.stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                {slide.stats.map((s, i) => (
                  <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                    <div className="text-2xl md:text-3xl font-bold">{s.value}</div>
                    <div className="text-sm text-white/70 mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            )}
            {"comparison" in slide && slide.comparison && (
              <div className="grid md:grid-cols-2 gap-4 mt-8">
                <div className="bg-red-500/20 backdrop-blur-sm rounded-xl p-5">
                  <h4 className="font-bold text-red-200 mb-3">Without Russell Capital Systems™</h4>
                  {(slide.comparison as any[]).map((c: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-red-100/80 text-sm mb-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />{c.before}
                    </div>
                  ))}
                </div>
                <div className="bg-emerald-500/20 backdrop-blur-sm rounded-xl p-5">
                  <h4 className="font-bold text-emerald-200 mb-3">With Russell Capital Systems™</h4>
                  {(slide.comparison as any[]).map((c: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-emerald-100/80 text-sm mb-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />{c.after}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-center gap-2">
          {WELCOME_SLIDES.map((_, i) => (
            <button key={i} onClick={() => setWelcomeSlide(i)}
              className={cn("w-3 h-3 rounded-full transition-all", i === welcomeSlide ? "bg-emerald-500 w-8" : "bg-zinc-600 hover:bg-zinc-500")} />
          ))}
        </div>
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setWelcomeSlide(Math.max(0, welcomeSlide - 1))} disabled={welcomeSlide === 0}>
            <ChevronLeft className="w-4 h-4 mr-2" /> Previous
          </Button>
          {welcomeSlide < WELCOME_SLIDES.length - 1 ? (
            <Button onClick={() => setWelcomeSlide(welcomeSlide + 1)} className="bg-emerald-600 hover:bg-emerald-700">
              Next <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={() => { markSectionComplete("agent-welcome", 20); awardBadge("b1"); nextStep(); }} className="bg-emerald-600 hover:bg-emerald-700">
              Start Assessment <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderQuestionnaire = () => {
    if (questionnaireComplete) {
      return (
        <div className="space-y-6">
          <div className="text-center p-8 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-2xl border border-emerald-500/20">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">Assessment Complete!</h2>
            <p className="text-zinc-400 text-lg">We've customized your learning path based on your answers.</p>
            {featuresCanIgnore.length > 0 && (
              <div className="mt-6 p-4 bg-zinc-800/50 rounded-xl max-w-2xl mx-auto">
                <p className="text-amber-400 font-medium mb-2">Features you can skip for now:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {featuresCanIgnore.map((fid) => {
                    const f = TOP_FEATURES.find((x) => x.id === fid);
                    return f ? <Badge key={fid} variant="outline" className="border-amber-500/30 text-amber-300">{f.name}</Badge> : null;
                  })}
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-center">
            <Button onClick={nextStep} className="bg-emerald-600 hover:bg-emerald-700 px-8 py-3 text-lg">
              Start Feature Walkthroughs <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      );
    }
    const q = QUESTIONNAIRE[currentQuestion];
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Badge variant="outline" className="border-emerald-500/30 text-emerald-400">Question {currentQuestion + 1} of {QUESTIONNAIRE.length}</Badge>
          <span className="text-zinc-500 text-sm">{Math.round(((currentQuestion) / QUESTIONNAIRE.length) * 100)}% complete</span>
        </div>
        <Progress value={((currentQuestion) / QUESTIONNAIRE.length) * 100} className="h-2" />
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardHeader><CardTitle className="text-xl text-white">{q.question}</CardTitle></CardHeader>
          <CardContent>
            <RadioGroup value={questionnaireAnswers[q.id] || ""} onValueChange={(val) => setQuestionnaireAnswers(prev => ({ ...prev, [q.id]: val }))}>
              <div className="space-y-3">
                {q.options.map((opt) => (
                  <div key={opt.value} className={cn("flex items-center space-x-3 p-4 rounded-xl border transition-all cursor-pointer",
                    questionnaireAnswers[q.id] === opt.value ? "border-emerald-500 bg-emerald-500/10" : "border-zinc-700 hover:border-zinc-500")}>
                    <RadioGroupItem value={opt.value} id={`${q.id}-${opt.value}`} />
                    <Label htmlFor={`${q.id}-${opt.value}`} className="text-zinc-200 cursor-pointer flex-1">{opt.label}</Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))} disabled={currentQuestion === 0}>
            <ChevronLeft className="w-4 h-4 mr-2" /> Previous
          </Button>
          {currentQuestion < QUESTIONNAIRE.length - 1 ? (
            <Button onClick={() => { if (questionnaireAnswers[q.id]) { markSectionComplete(`agent-q-${q.id}`, 5); setCurrentQuestion(currentQuestion + 1); } }}
              disabled={!questionnaireAnswers[q.id]} className="bg-emerald-600 hover:bg-emerald-700">
              Next <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={() => { markSectionComplete(`agent-q-${q.id}`, 5); setQuestionnaireComplete(true); awardBadge("b2"); saveProgress({ questionnaireCompleted: true }); }}
              disabled={!questionnaireAnswers[q.id]} className="bg-emerald-600 hover:bg-emerald-700">
              Complete Assessment <CheckCircle2 className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderFeatures = () => {
    const feature = filteredFeatures[currentFeatureIndex] || TOP_FEATURES[0];
    const Icon = feature.icon;
    const isCompleted = completedSections.includes(`agent-feature-${feature.id}`);
    const isIgnorable = featuresCanIgnore.includes(feature.id);
    const completedFeatureCount = TOP_FEATURES.filter((f) => completedSections.includes(`agent-feature-${f.id}`)).length;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-600">{completedFeatureCount}/{TOP_FEATURES.length} Learned</Badge>
            {isIgnorable && <Badge variant="outline" className="border-amber-500/30 text-amber-300">Can skip for now</Badge>}
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <Button key={cat} size="sm" variant={featureFilter === cat ? "default" : "outline"}
                onClick={() => { setFeatureFilter(cat); setCurrentFeatureIndex(0); }}
                className={featureFilter === cat ? "bg-emerald-600" : ""}>
                {cat === "all" ? "All" : cat}
              </Button>
            ))}
          </div>
        </div>

        <Card className="bg-zinc-800/50 border-zinc-700 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 p-6 border-b border-zinc-700">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Icon className="w-7 h-7 text-emerald-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge variant="outline" className="text-xs border-zinc-600">#{feature.rank}</Badge>
                  <Badge variant="outline" className="text-xs border-zinc-600">{feature.category}</Badge>
                  <Badge variant="outline" className={cn("text-xs", feature.difficulty === "Beginner" ? "border-green-500/30 text-green-400" : feature.difficulty === "Intermediate" ? "border-amber-500/30 text-amber-400" : "border-red-500/30 text-red-400")}>
                    {feature.difficulty}
                  </Badge>
                  {isCompleted && <Badge className="bg-emerald-600 text-xs">Completed</Badge>}
                </div>
                <h3 className="text-2xl font-bold text-white">{feature.name}</h3>
                <p className="text-zinc-400 text-sm mt-1">Time to learn: {feature.timeToLearn}</p>
              </div>
            </div>
          </div>
          <CardContent className="p-6 space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-white mb-2 flex items-center gap-2"><BookOpen className="w-5 h-5 text-emerald-400" /> What It Does</h4>
              <p className="text-zinc-300 leading-relaxed">{feature.description}</p>
            </div>
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5">
              <h4 className="text-lg font-semibold text-emerald-400 mb-2 flex items-center gap-2"><Target className="w-5 h-5" /> Why It Matters to YOUR Bottom Line</h4>
              <p className="text-zinc-300 leading-relaxed">{feature.whyItMatters}</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-2 flex items-center gap-2"><Settings className="w-5 h-5 text-cyan-400" /> How to Use It</h4>
              <p className="text-zinc-300 leading-relaxed">{feature.howItWorks}</p>
            </div>
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5">
              <h4 className="text-lg font-semibold text-amber-400 mb-2 flex items-center gap-2"><DollarSign className="w-5 h-5" /> Sales Production Impact</h4>
              <p className="text-zinc-300 leading-relaxed">{feature.salesImpact}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Monthly Impact", value: feature.monthlyImpact, color: "text-emerald-400" },
                { label: "Annual Impact", value: feature.annualImpact, color: "text-cyan-400" },
                { label: "Retail Build Cost", value: feature.retailBuildCost, color: "text-amber-400" },
                { label: "Time to Learn", value: feature.timeToLearn, color: "text-violet-400" },
              ].map((s, i) => (
                <div key={i} className="bg-zinc-900/50 rounded-xl p-4 text-center border border-zinc-700">
                  <div className={cn("text-xl font-bold", s.color)}>{s.value}</div>
                  <div className="text-zinc-500 text-xs mt-1">{s.label}</div>
                </div>
              ))}
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><Layers className="w-5 h-5 text-violet-400" /> Deep Dive</h4>
              <div className="space-y-2">
                {feature.drillDowns.map((dd) => {
                  const isExpanded = expandedDrillDown[feature.id] === dd.id;
                  const isSubComplete = completedSubSections.includes(dd.id);
                  return (
                    <div key={dd.id} className={cn("border rounded-xl transition-all", isExpanded ? "border-emerald-500/30 bg-emerald-500/5" : "border-zinc-700")}>
                      <button onClick={() => {
                        setExpandedDrillDown(prev => ({ ...prev, [feature.id]: isExpanded ? null : dd.id }));
                        if (!isSubComplete) {
                          setCompletedSubSections(prev => [...prev, dd.id]);
                          setTotalPoints(prev => prev + 5);
                          if (completedSubSections.length + 1 >= 10) awardBadge("b6");
                        }
                      }} className="w-full flex items-center justify-between p-4 text-left">
                        <div className="flex items-center gap-3">
                          {isSubComplete ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <ChevronRight className={cn("w-5 h-5 text-zinc-500 shrink-0 transition-transform", isExpanded && "rotate-90")} />}
                          <span className="text-zinc-200 font-medium">{dd.title}</span>
                        </div>
                        <Badge variant="outline" className="text-xs border-zinc-600">+5 pts</Badge>
                      </button>
                      {isExpanded && <div className="px-4 pb-4 pl-12"><p className="text-zinc-400 leading-relaxed">{dd.content}</p></div>}
                    </div>
                  );
                })}
              </div>
            </div>
            {!isCompleted && (
              <div className="flex justify-center pt-4">
                <Button onClick={() => {
                  markSectionComplete(`agent-feature-${feature.id}`, 15);
                  const newCount = TOP_FEATURES.filter((f) => completedSections.includes(`agent-feature-${f.id}`) || f.id === feature.id).length;
                  if (newCount >= 5) awardBadge("b3");
                  if (newCount >= 10) awardBadge("b4");
                  if (newCount >= 15) awardBadge("b5");
                  const objectionFeatures = ["f7", "f8"];
                  if (objectionFeatures.every(fid => completedSections.includes(`agent-feature-${fid}`) || fid === feature.id)) awardBadge("b9");
                  saveProgress();
                }} className="bg-emerald-600 hover:bg-emerald-700 px-8">
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Mark as Learned (+15 pts)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentFeatureIndex(Math.max(0, currentFeatureIndex - 1))} disabled={currentFeatureIndex === 0}>
            <ChevronLeft className="w-4 h-4 mr-2" /> Previous
          </Button>
          {currentFeatureIndex < filteredFeatures.length - 1 ? (
            <Button onClick={() => setCurrentFeatureIndex(currentFeatureIndex + 1)} className="bg-emerald-600 hover:bg-emerald-700">
              Next Feature <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={nextStep} className="bg-emerald-600 hover:bg-emerald-700">
              View Value & ROI <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderCostSummary = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white">What You'd Pay to Build This Yourself</h2>
        <p className="text-zinc-400 mt-2 text-lg">Professional development costs at market rates</p>
      </div>
      <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-2xl border border-emerald-500/20 p-8 text-center">
        <p className="text-zinc-400 text-lg mb-2">Total Retail Development Cost</p>
        <div className="text-5xl md:text-6xl font-bold text-emerald-400 mb-4">{COST_SUMMARY.totalRetailCost}</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[
            { value: COST_SUMMARY.hourlyDevRate, label: "/hour dev rate" },
            { value: COST_SUMMARY.estimatedHours, label: "dev hours" },
            { value: COST_SUMMARY.teamSize, label: "developers needed" },
            { value: COST_SUMMARY.timeToBuilt, label: "to build" },
          ].map((s, i) => (
            <div key={i} className="bg-zinc-900/50 rounded-xl p-4">
              <div className="text-xl font-bold text-white">{s.value}</div>
              <div className="text-zinc-500 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
        <p className="text-zinc-400 mt-6">Plus <span className="text-amber-400 font-bold">{COST_SUMMARY.annualMaintenance}</span>/year in ongoing maintenance</p>
      </div>
      <Card className="bg-zinc-800/50 border-zinc-700">
        <CardHeader><CardTitle className="text-white flex items-center gap-2"><Calculator className="w-5 h-5 text-emerald-400" /> Your Personal ROI</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-700">
                  <th className="text-left py-3 px-4 text-zinc-400 font-medium">#</th>
                  <th className="text-left py-3 px-4 text-zinc-400 font-medium">Feature</th>
                  <th className="text-right py-3 px-4 text-zinc-400 font-medium">Build Cost</th>
                  <th className="text-right py-3 px-4 text-zinc-400 font-medium">Monthly ROI</th>
                  <th className="text-right py-3 px-4 text-zinc-400 font-medium">Annual ROI</th>
                </tr>
              </thead>
              <tbody>
                {TOP_FEATURES.map((f) => (
                  <tr key={f.id} className="border-b border-zinc-700/50 hover:bg-zinc-700/20">
                    <td className="py-3 px-4 text-zinc-500">{f.rank}</td>
                    <td className="py-3 px-4 text-zinc-200">{f.name}</td>
                    <td className="py-3 px-4 text-right text-amber-400 font-mono">{f.retailBuildCost}</td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-mono">{f.monthlyImpact}</td>
                    <td className="py-3 px-4 text-right text-cyan-400 font-mono">{f.annualImpact}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-emerald-500/30">
                  <td colSpan={2} className="py-4 px-4 text-white font-bold text-lg">TOTAL</td>
                  <td className="py-4 px-4 text-right text-amber-400 font-bold text-lg font-mono">{COST_SUMMARY.totalRetailCost}</td>
                  <td className="py-4 px-4 text-right text-emerald-400 font-bold text-lg font-mono">{COST_SUMMARY.totalMonthlyImpact}</td>
                  <td className="py-4 px-4 text-right text-cyan-400 font-bold text-lg font-mono">{COST_SUMMARY.totalAnnualImpact}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-center">
        <Button onClick={() => { markSectionComplete("agent-cost", 25); awardBadge("b7"); nextStep(); saveProgress(); }} className="bg-emerald-600 hover:bg-emerald-700 px-8 py-3 text-lg">
          Complete Tutorial <Trophy className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderCompletion = () => {
    const elapsed = Math.round((Date.now() - startTime) / 60000);
    if (elapsed < 30 && !badges.some(b => b.id === "b8")) awardBadge("b8");
    if (score >= 100 && !badges.some(b => b.id === "b10")) awardBadge("b10");
    return (
      <div className="space-y-8">
        <div className="text-center bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-violet-500/10 rounded-2xl border border-emerald-500/20 p-12">
          <div className="text-6xl mb-4">🎓</div>
          <h2 className="text-4xl font-bold text-white mb-2">You're Ready to Dominate!</h2>
          <p className="text-xl text-zinc-300">Individual Agent Tutorial Complete</p>
          <div className="grid grid-cols-3 gap-6 mt-8 max-w-2xl mx-auto">
            {[
              { value: `${score}/100`, label: "Understanding", color: "text-emerald-400" },
              { value: String(totalPoints), label: "Points", color: "text-cyan-400" },
              { value: String(badges.length), label: "Badges", color: "text-amber-400" },
            ].map((s, i) => (
              <div key={i} className="bg-zinc-900/50 rounded-xl p-4">
                <div className={cn("text-3xl font-bold", s.color)}>{s.value}</div>
                <div className="text-zinc-500 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardHeader><CardTitle className="text-white flex items-center gap-2"><Award className="w-5 h-5 text-amber-400" /> Your Badges</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {BADGES.map((badge) => {
                const earned = badges.some(b => b.id === badge.id);
                return (
                  <div key={badge.id} className={cn("text-center p-4 rounded-xl border transition-all",
                    earned ? "border-emerald-500/30 bg-emerald-500/5" : "border-zinc-700 opacity-40")}>
                    <div className="text-3xl mb-2">{badge.emoji}</div>
                    <div className={cn("font-medium text-sm", earned ? "text-white" : "text-zinc-500")}>{badge.name}</div>
                    <div className="text-xs text-zinc-500 mt-1">{badge.description}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardHeader><CardTitle className="text-white flex items-center gap-2"><Rocket className="w-5 h-5 text-emerald-400" /> Your First 5 Actions</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { step: 1, text: "Add your top 5 clients with full financial data", path: "/portal/clients" },
                { step: 2, text: "Run the Retirement Drivers analysis and practice presenting it", path: "/portal/ecological-drivers" },
                { step: 3, text: "Generate an smart strategy for your best prospect", path: "/portal/strategy" },
                { step: 4, text: "Pull up the Time Machine for your next 'market is better' objection", path: "/portal/time-machine-calculator" },
                { step: 5, text: "Set up your pipeline with your current active deals", path: "/portal/pipeline" },
              ].map((item) => (
                <a key={item.step} href={item.path} className="flex items-center gap-4 p-4 rounded-xl border border-zinc-700 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">{item.step}</div>
                  <span className="text-zinc-200">{item.text}</span>
                  <ArrowRight className="w-4 h-4 text-zinc-500 ml-auto" />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => { setCurrentStep("welcome"); setWelcomeSlide(0); }}>
            <RefreshCw className="w-4 h-4 mr-2" /> Restart
          </Button>
          <Button onClick={() => window.location.href = "/portal"} className="bg-emerald-600 hover:bg-emerald-700">
            Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto px-4 py-6">
        {showBadgePopup && (
          <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-right fade-in duration-500">
            <div className="bg-zinc-800 border border-emerald-500/30 rounded-2xl p-6 shadow-2xl shadow-emerald-500/20 max-w-xs">
              <div className="text-center">
                <div className="text-4xl mb-2">{showBadgePopup.emoji}</div>
                <div className="text-emerald-400 font-bold text-lg">Badge Earned!</div>
                <div className="text-white font-medium">{showBadgePopup.name}</div>
                <div className="text-zinc-400 text-sm mt-1">{showBadgePopup.description}</div>
                <div className="text-amber-400 text-sm mt-2">+50 points</div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Individual Agent Tutorial</h1>
                <p className="text-zinc-400 text-sm">Master the tools that close deals and grow your book</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <ExportToSlides
                toolName="Individual Agent Tutorial"
                getSections={() => [
                  {
                    title: "Tutorial Progress",
                    items: [
                      { label: "Score", value: `${score}/100` },
                      { label: "Points", value: String(totalPoints) },
                      { label: "Badges Earned", value: String(badges.length) },
                      { label: "Overall Progress", value: `${overallProgress}%` }
                    ]
                  }
                ]}
              />
              <div className="text-right">
                <div className="text-sm text-zinc-400">Score</div>
                <div className="text-2xl font-bold text-emerald-400">{score}/100</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-zinc-400">Points</div>
                <div className="text-2xl font-bold text-amber-400">{totalPoints}</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-2">
            {STEP_ORDER.map((step, i) => {
              const isCurrent = currentStep === step;
              const isPast = STEP_ORDER.indexOf(currentStep) > i;
              return (
                <button key={step} onClick={() => goToStep(step)}
                  className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                    isCurrent ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" :
                    isPast ? "bg-zinc-800 text-emerald-400" : "bg-zinc-800/50 text-zinc-500 hover:text-zinc-300")}>
                  {isPast ? <CheckCircle2 className="w-4 h-4" /> : <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-xs">{i + 1}</span>}
                  {STEP_LABELS[step]}
                </button>
              );
            })}
          </div>
          <Progress value={overallProgress} className="h-2" />
          <p className="text-zinc-500 text-xs mt-1">{overallProgress}% complete</p>
        </div>

        {/* Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="rc-card">
            <div className="text-sm font-semibold text-white mb-3">Feature Difficulty Distribution</div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Beginner', value: TOP_FEATURES.filter((f) => f.difficulty === 'Beginner').length || 1 },
                    { name: 'Intermediate', value: TOP_FEATURES.filter((f) => f.difficulty === 'Intermediate').length || 1 },
                    { name: 'Advanced', value: TOP_FEATURES.filter((f) => f.difficulty === 'Advanced').length || 1 }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#22c55e" />
                  <Cell fill="#3b82f6" />
                  <Cell fill="#f0c040" />
                </Pie>
                <RTooltip contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="rc-card">
            <div className="text-sm font-semibold text-white mb-3">Tutorial Progress Over Steps</div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={[
                { name: 'Welcome', progress: completedSections.length >= 1 ? 20 : 0 },
                { name: 'Assessment', progress: questionnaireComplete ? 40 : 20 },
                { name: 'Features', progress: Math.min(80, 40 + (completedSections.length * 2)) },
                { name: 'ROI', progress: completedSections.includes('agent-cost') ? 90 : 80 },
                { name: 'Complete', progress: score >= 100 ? 100 : overallProgress }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="name" stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#888" fontSize={10} tickLine={false} axisLine={false} />
                <RTooltip contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                <Area type="monotone" dataKey="progress" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {currentStep === "welcome" && renderWelcome()}
        {currentStep === "questionnaire" && renderQuestionnaire()}
        {currentStep === "features" && renderFeatures()}
        {currentStep === "cost" && renderCostSummary()}
        {currentStep === "complete" && renderCompletion()}
      </div>
    </AppShell>
  );
}
