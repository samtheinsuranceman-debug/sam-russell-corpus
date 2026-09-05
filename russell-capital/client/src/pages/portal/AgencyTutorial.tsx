// @ts-nocheck
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { GraduationCap, ChevronRight, ChevronLeft, CheckCircle2, Trophy, Target, TrendingUp, Shield, DollarSign, Clock, Award, ArrowRight, BarChart3, Rocket, BookOpen, Calculator, Layers, Settings, RefreshCw, Upload, Database, UserPlus, Building2, Phone, Crown, Icon} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { ExportToSlides } from "@/components/ExportToSlides";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { PageInsights } from "@/components/PageInsights";

const WELCOME_SLIDES = [
  {
    id: "w1",
    title: "Welcome, Agency Leader!",
    subtitle: "Your Team's Unfair Advantage Starts Here",
    content: "You're about to give your entire team access to a system that would cost over $2.8 million to build independently. But more importantly, you're about to see how Russell Capital Solutions™ transforms you from a 'manager who also sells' into a true agency commander — with real-time visibility into every advisor's pipeline, automated lead distribution, and compliance oversight that runs itself.",
    icon: Crown,
    gradient: "from-amber-500 to-orange-500",
  },
  {
    id: "w2",
    title: "The Agency Leader's Problem",
    subtitle: "Sound Familiar?",
    content: "Your advisors are using different tools, different spreadsheets, different processes. You can't see their pipelines. Leads fall through cracks. New agents take 6 months to become productive. Compliance is a nightmare of paper trails. You're spending 60% of your time on admin instead of growing the agency.",
    icon: Shield,
    gradient: "from-red-500 to-rose-500",
    painPoints: [
      { problem: "No visibility into advisor pipelines", cost: "$15K/month in lost deals" },
      { problem: "Leads assigned manually, many forgotten", cost: "$8K/month in wasted leads" },
      { problem: "New agents take 6+ months to ramp", cost: "$30K per agent in lost production" },
      { problem: "Compliance tracking is manual", cost: "$50K+ risk per violation" },
    ],
  },
  {
    id: "w3",
    title: "The Russell Capital Solutions™ Agency Solution",
    subtitle: "One Platform, Total Control",
    content: "Imagine logging in and seeing every advisor's pipeline value, close rate, and activity score in one dashboard. Leads auto-distribute based on expertise and capacity. New agents complete a guided tutorial and start producing in weeks, not months. Compliance logs itself. That's what you're about to set up.",
    icon: Building2,
    gradient: "from-emerald-500 to-cyan-500",
    stats: [
      { label: "Faster Agent Ramp-Up", value: "3x" },
      { label: "Lead Conversion Lift", value: "+45%" },
      { label: "Admin Time Saved", value: "70%" },
      { label: "Compliance Coverage", value: "100%" },
    ],
  },
  {
    id: "w4",
    title: "This Tutorial Is Built for You",
    subtitle: "Agency Management, Not Just Sales Tools",
    content: "This isn't the individual agent tutorial. This is specifically designed for agency leaders and team managers. We'll cover database uploads, lead management, team performance tracking, advisor onboarding, compliance oversight, and the management dashboards that let you run your agency like a Fortune 500 operation. Earn badges and points as you go!",
    icon: GraduationCap,
    gradient: "from-violet-500 to-purple-500",
  },
];

const QUESTIONNAIRE = [{
    id: "q1",
    question: "How many advisors are currently on your team?",
    options: [
      { value: "small", label: "2-5 advisors — tight-knit team" },
      { value: "medium", label: "6-15 advisors — growing agency" },
      { value: "large", label: "16-30 advisors — established operation" },
      { value: "enterprise", label: "30+ advisors — large agency or IMO" },
    ],
  },
,
  {
    id: "q2",
    question: "How do you currently distribute leads to your team?",
    options: [
      { value: "manual", label: "I manually assign them via email or text" },
      { value: "round-robin", label: "Simple round-robin or rotation" },
      { value: "cherry-pick", label: "Advisors cherry-pick from a shared list" },
      { value: "system", label: "We have an automated distribution system" },
    ],
  },
,
  {
    id: "q3",
    question: "What's your biggest frustration managing your team?",
    options: [
      { value: "visibility", label: "I can't see what my advisors are actually doing" },
      { value: "training", label: "New agents take too long to become productive" },
      { value: "leads", label: "Good leads are being wasted by underperformers" },
      { value: "compliance", label: "Keeping everyone compliant is a full-time job" },
    ],
  },
,
  {
    id: "q4",
    question: "Do you currently have a client database? If so, where?",
    options: [
      { value: "none", label: "No centralized database — each advisor has their own" },
      { value: "spreadsheet", label: "Excel/Google Sheets with client info" },
      { value: "crm", label: "A CRM like Salesforce, HubSpot, or AgencyBloc" },
      { value: "mixed", label: "A mix of systems — it's a mess" },
    ],
  },
,
  {
    id: "q5",
    question: "How many total leads does your agency generate per month?",
    options: [
      { value: "few", label: "Under 20 — we need more lead sources" },
      { value: "moderate", label: "20-50 — decent flow but inconsistent" },
      { value: "strong", label: "50-150 — solid pipeline" },
      { value: "high", label: "150+ — we have more leads than we can handle" },
    ],
  }
];

const TOP_FEATURES = [{
    id: "f1",
    rank: 1,
    name: "Uploading Your Client Database",
    path: "/portal/clients",
    icon: Upload,
    category: "Database Setup",
    difficulty: "First Priority",
    monthlyImpact: "$8,000",
    annualImpact: "$96,000",
    retailBuildCost: "$240,000",
    timeToLearn: "15 min",
    description: "Your existing client database is a goldmine sitting in a spreadsheet. Upload it to Russell Capital Solutions™ and every client instantly gets an opportunity score, tax bracket analysis, and system-recommended strategies. What used to be a static list becomes an active, intelligent pipeline.",
    whyItMatters: "Most agencies have 200-2,000+ clients scattered across spreadsheets and CRMs. Each client represents $500-$5,000 in untapped annual premium. By uploading your database, the the system identifies the top 20% of clients with the highest opportunity scores — that's where your team should focus first.",
    howItWorks: "Go to Clients → Import. Upload a CSV with columns: Name, Age, Email, Phone, IRA Balance, Roth Balance, Taxable Assets, Income, Filing Status. The system auto-maps columns, validates data, and creates client profiles. Each client gets an system-generated opportunity score (1-100) within seconds.",
    salesImpact: "Agencies that upload their full database see an average $8,000/month revenue increase in the first 60 days. The the system surfaces 'hidden gold' — clients who looked dormant but have massive Roth conversion opportunities or IUL potential that was never identified.",
    drillDowns: [
      { id: "d1-1", title: "CSV Format & Template", content: "Download our template CSV from the Import page. Required columns: First Name, Last Name, Date of Birth, Email. Recommended: Phone, IRA Balance, Roth Balance, Taxable Assets, Annual Income, Filing Status, Assigned Advisor. The more data you provide, the better the smart scoring." },
      { id: "d1-2", title: "Data Validation & Cleanup", content: "The importer flags issues: duplicate names, invalid emails, missing ages. Fix them before import or let the system create partial profiles. Partial profiles still get scored — you can enrich them later." },
      { id: "d1-3", title: "Opportunity Scoring", content: "Each client gets a score from 1-100 based on: IRA size (Roth conversion potential), age (urgency), income (tax bracket optimization), and existing coverage gaps. Sort by score to find your best opportunities instantly." },
      { id: "d1-4", title: "Assigning Clients to Advisors", content: "During import, you can assign clients to specific advisors via the 'Assigned Advisor' column. Or import first and bulk-assign later from the client list. Each advisor sees only their assigned clients in their dashboard." },
      { id: "d1-5", title: "What to Do After Upload", content: "Step 1: Sort by opportunity score. Step 2: Assign top-50 clients to your best closers. Step 3: Run batch smart strategies on the top 20. Step 4: Schedule follow-up campaigns. Your database just went from 'dead list' to 'active pipeline.'" },
    ],
  },
,
  {
    id: "f2",
    rank: 2,
    name: "Uploading & Managing Your Lead Database",
    path: "/portal/clients",
    icon: Database,
    category: "Database Setup",
    difficulty: "First Priority",
    monthlyImpact: "$12,000",
    annualImpact: "$144,000",
    retailBuildCost: "$195,000",
    timeToLearn: "12 min",
    description: "Leads are different from clients — they haven't bought yet. Upload your lead lists (seminar attendees, mailer responses, web inquiries) and Russell Capital Solutions™ scores them, prioritizes them, and can auto-assign them to the right advisor based on expertise and capacity.",
    whyItMatters: "The #1 reason agencies waste leads is speed-to-contact. 78% of leads go to the first advisor who calls. If your leads sit in an email inbox for 3 days before someone picks them up, you've already lost. Automated lead distribution solves this permanently.",
    howItWorks: "Upload leads via CSV (Name, Phone, Email, Source, Interest). The system scores each lead based on completeness and source quality. Set up auto-distribution rules: round-robin, expertise-based, or capacity-based. Advisors get instant notifications when new leads are assigned.",
    salesImpact: "Agencies with automated lead distribution see 45% higher conversion rates. At 50 leads/month with a 15% conversion rate increase, that's 7-8 additional cases/month across your team. At $10K average premium, that's $70K-$80K/month.",
    drillDowns: [
      { id: "d2-1", title: "Lead vs. Client: The Difference", content: "Leads are prospects who haven't purchased. They go into a separate pipeline with different stages: New → Contacted → Qualified → Appointment Set → Proposal → Converted. When a lead converts, they automatically become a client with full profile." },
      { id: "d2-2", title: "Lead Scoring Algorithm", content: "Leads are scored 1-100 based on: data completeness (more info = higher score), source quality (referral > seminar > cold list), responsiveness (opened email? answered phone?), and financial indicators (high income, large IRA = hot lead)." },
      { id: "d2-3", title: "Auto-Distribution Rules", content: "Set rules like: 'IUL leads go to Sarah and Mike (IUL specialists).' 'Annuity leads go to Tom and Lisa.' 'High-value leads ($500K+ assets) go to senior advisors only.' 'Round-robin everything else.' The system handles it automatically." },
      { id: "d2-4", title: "Lead Source Tracking", content: "Tag every lead with its source: Seminar, Mailer, Website, Referral, Social Media. Track which sources produce the highest conversion rates. Stop spending money on sources that don't convert. Double down on what works." },
      { id: "d2-5", title: "Speed-to-Contact Dashboard", content: "See exactly how long each advisor takes to contact new leads. Set SLA targets (e.g., 'Contact within 1 hour'). Advisors who miss SLAs get flagged. Leads that go uncontacted for 24 hours auto-reassign to the next available advisor." },
    ],
  },
,
  {
    id: "f3",
    rank: 3,
    name: "Team Performance Dashboard",
    path: "/portal/advisor-metrics",
    icon: BarChart3,
    category: "Team Management",
    difficulty: "Essential",
    monthlyImpact: "$6,000",
    annualImpact: "$72,000",
    retailBuildCost: "$320,000",
    timeToLearn: "10 min",
    description: "See every advisor's production, pipeline value, close rate, activity score, and lead response time in one real-time dashboard. No more waiting for monthly reports or guessing who's performing. You know — right now.",
    whyItMatters: "You can't manage what you can't measure. Most agency leaders find out an advisor is struggling 2-3 months too late — after the leads are wasted and the revenue is lost. Real-time visibility lets you intervene in week 1, not month 3.",
    howItWorks: "The dashboard auto-populates from advisor activity. Each advisor gets a performance card showing: cases closed (MTD/YTD), pipeline value, close rate, average case size, lead response time, and an system-generated 'health score.' Filter by time period, product type, or lead source.",
    salesImpact: "Agencies with real-time performance dashboards see 30% higher team production. Early intervention on struggling advisors saves an average of $15K/quarter in wasted leads and lost production.",
    drillDowns: [
      { id: "d3-1", title: "The Advisor Scorecard", content: "Each advisor gets a composite score (1-100) based on: close rate (30%), pipeline value (25%), activity level (20%), lead response time (15%), and client satisfaction (10%). Use this for coaching conversations, not punishment." },
      { id: "d3-2", title: "Pipeline Visibility", content: "See every advisor's pipeline in kanban view. How many deals in each stage? Where are deals stalling? Which advisor has $200K in proposals but hasn't closed anything in 3 weeks? This visibility is priceless." },
      { id: "d3-3", title: "Trend Analysis", content: "Weekly and monthly trend lines for each advisor. Is Sarah improving? Is Mike declining? Catch trends early. A 2-week decline is coachable. A 2-month decline is a crisis." },
      { id: "d3-4", title: "Team Comparison View", content: "Side-by-side comparison of all advisors. Who has the highest close rate? Who handles the most leads? Who has the largest average case? Use this to identify best practices and share them across the team." },
    ],
  },
,
  {
    id: "f4",
    rank: 4,
    name: "Leaderboard — Gamified Competition",
    path: "/portal/leaderboard",
    icon: Trophy,
    category: "Team Management",
    difficulty: "Essential",
    monthlyImpact: "$5,000",
    annualImpact: "$60,000",
    retailBuildCost: "$145,000",
    timeToLearn: "5 min",
    description: "Nothing motivates salespeople like competition. The Leaderboard ranks your advisors by production, close rate, and activity — with weekly, monthly, and annual views. Public recognition drives performance.",
    whyItMatters: "Gamification increases sales team productivity by 20-30%. When advisors can see their ranking and know that the top 3 get recognized (or rewarded), discretionary effort goes through the roof. The advisor who was 'good enough' suddenly wants to be #1.",
    howItWorks: "The Leaderboard auto-updates from advisor activity. Rankings are based on: premium written, cases closed, pipeline growth, and activity score. Weekly resets keep competition fresh. Display it on a TV in the office for maximum impact.",
    salesImpact: "Teams with visible leaderboards produce 25% more than teams without. The bottom 20% of performers improve the most — they don't want to be last. Average agency production increase: $5,000/month.",
    drillDowns: [
      { id: "d4-1", title: "Ranking Categories", content: "Multiple leaderboards: Total Premium, Cases Closed, Largest Case, Best Close Rate, Fastest Lead Response, Most Active. Different advisors can win different categories, keeping everyone motivated." },
      { id: "d4-2", title: "Weekly Sprints", content: "Set weekly challenges: 'Most proposals sent this week wins lunch.' 'First advisor to close 3 cases gets a bonus.' Short sprints create urgency and excitement." },
      { id: "d4-3", title: "Recognition & Rewards", content: "The system auto-generates 'Top Performer' badges. Share these in team meetings. Pair with real rewards (gift cards, extra leads, prime territory) for maximum impact." },
    ],
  },
,
  {
    id: "f5",
    rank: 5,
    name: "New Advisor Onboarding System",
    path: "/portal/agent-tutorial",
    icon: UserPlus,
    category: "Training & Onboarding",
    difficulty: "Essential",
    monthlyImpact: "$4,000",
    annualImpact: "$48,000",
    retailBuildCost: "$280,000",
    timeToLearn: "8 min",
    description: "When you hire a new advisor, send them to the Individual Agent Tutorial. It walks them through every tool, teaches them the sales process, and gets them producing in weeks instead of months. You don't have to personally train every new hire anymore.",
    whyItMatters: "The average agency spends 40+ hours training each new advisor. At your hourly value ($200+/hr), that's $8,000+ per hire in your time alone. The tutorial handles 80% of that training automatically, freeing you to focus on advanced coaching and deal support.",
    howItWorks: "New advisors access the Individual Agent Tutorial from their sidebar. It covers: navigation basics, client management, presentation tools, strategy engines, objection handling, and compliance. They earn badges and a completion score. You can track their progress from your dashboard.",
    salesImpact: "Agencies using structured onboarding see new advisors produce 3x faster. Instead of 3-6 months to first sale, expect 3-6 weeks. Each month of acceleration = $5,000-$15,000 in production per advisor.",
    drillDowns: [
      { id: "d5-1", title: "Tracking New Advisor Progress", content: "From your Team dashboard, see each advisor's tutorial completion percentage, quiz scores, and time spent. If someone is stuck at 40%, reach out and help them over the hump." },
      { id: "d5-2", title: "Customizing the Learning Path", content: "The tutorial adapts based on the advisor's questionnaire answers. IUL-focused advisors get more IUL content. Annuity specialists get annuity-heavy training. Everyone gets the fundamentals." },
      { id: "d5-3", title: "Certification Tracking", content: "When an advisor completes the tutorial with 80%+ score, they earn a 'Russell Capital Solutions™ Certified' badge. Use this as a milestone in your onboarding process. 'Complete certification before week 3.'" },
    ],
  }
];

const BADGES = [{ id: "b1", name: "Agency Commander", emoji: "👑", description: "Completed the welcome briefing" },
,
  { id: "b2", name: "Self-Assessed", emoji: "📋", description: "Completed the agency assessment" },
,
  { id: "b3", name: "Database Master", emoji: "🗄️", description: "Learned database upload features" },
,
  { id: "b4", name: "Team Builder", emoji: "👥", description: "Learned 5 management features" },
,
  { id: "b5", name: "Agency Architect", emoji: "🏗️", description: "Completed all 15 features" }
];

const COST_SUMMARY = {
  totalRetailCost: "$3,425,000",
  hourlyDevRate: "$175",
  estimatedHours: "19,571",
  teamSize: "10-15 developers",
  timeToBuilt: "24-30 months",
  annualMaintenance: "$420,000",
  totalMonthlyImpact: "$71,000",
  totalAnnualImpact: "$852,000",
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

export default function AgencyTutorial() {
  const { user } = useAuth();
  const progressQuery = trpc.tutorial.getProgress.useQuery(undefined, { enabled: !!user });
  const saveMutation = trpc.tutorial.saveProgress.useMutation();
  const completeSectionMutation = trpc.tutorial.completeSection.useMutation();

  const [currentStep, setCurrentStep] = useState<TutorialStep>("welcome");
  const [welcomeSlide, setWelcomeSlide] = useState<number>(0);
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState<Record<string, string>>({});
  const [currentQuestion, setCurrentQuestion] = useState<number>(0);
  const [questionnaireComplete, setQuestionnaireComplete] = useState<boolean>(false);
  const [currentFeatureIndex, setCurrentFeatureIndex] = useState<number>(0);
  const [expandedDrillDown, setExpandedDrillDown] = useState<Record<string, string | null>>({});
  const [completedSections, setCompletedSections] = useState<string[]>([]);
  const [completedSubSections, setCompletedSubSections] = useState<string[]>([]);
  const [score, setScore] = useState<number>(0);
  const [badges, setBadges] = useState<{id: string; name: string; emoji: string; description: string; earnedAt: string}[]>([]);
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [showBadgePopup, setShowBadgePopup] = useState<typeof BADGES[0] | null>(null);
  const [featureFilter, setFeatureFilter] = useState<string>("all");
  const [startTime] = useState<number>(() => Date.now());

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
      role: "team_lead",
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
  }, [currentStep, questionnaireAnswers, questionnaireComplete, completedSections, completedSubSections, score, badges, totalPoints, saveMutation]);

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
    setScore(Math.min(100, Math.round((newCount / 22) * 100)));
    completeSectionMutation.mutate({ sectionId, pointsEarned: points });
  }, [completedSections, completeSectionMutation]);

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
    if (a.q3 === "visibility") priority.push("f3", "f4", "f15");
    if (a.q3 === "training") priority.push("f5", "f9", "f4");
    if (a.q3 === "leads") priority.push("f2", "f6", "f8");
    if (a.q3 === "compliance") priority.push("f7", "f15", "f3");
    if (a.q10 === "leads") priority.push("f2", "f6", "f8", "f12");
    if (a.q10 === "visibility") priority.push("f3", "f4", "f15");
    if (a.q10 === "training") priority.push("f5", "f9");
    if (a.q10 === "scale") priority.push("f10", "f13", "f14", "f15");
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
    if (a.q1 === "small" && a.q5 === "few") ignore.push("f10");
    if (a.q6 === "excellent") ignore.push("f14");
    if (a.q9 === "automated") ignore.push("f7");
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
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2" />
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
            {"painPoints" in slide && slide.painPoints && (
              <div className="space-y-3 mt-8">
                {(slide.painPoints as any[]).map((p: any, i: number) => (
                  <div key={i} className="flex items-center justify-between bg-black/20 backdrop-blur-sm rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                      <span className="text-white/90">{p.problem}</span>
                    </div>
                    <span className="text-red-300 font-mono text-sm font-bold shrink-0 ml-4">{p.cost}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-center gap-2">
          {WELCOME_SLIDES.map((_, i) => (
            <button key={i} onClick={() => setWelcomeSlide(i)}
              className={cn("w-3 h-3 rounded-full transition-all", i === welcomeSlide ? "bg-amber-500 w-8" : "bg-zinc-600 hover:bg-zinc-500")} />
          ))}
        </div>
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setWelcomeSlide(Math.max(0, welcomeSlide - 1))} disabled={welcomeSlide === 0}>
            <ChevronLeft className="w-4 h-4 mr-2" /> Previous
          </Button>
          {welcomeSlide < WELCOME_SLIDES.length - 1 ? (
            <Button onClick={() => setWelcomeSlide(welcomeSlide + 1)} className="bg-amber-600 hover:bg-amber-700">
              Next <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={() => { markSectionComplete("agency-welcome", 20); awardBadge("b1"); nextStep(); }} className="bg-amber-600 hover:bg-amber-700">
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
          <div className="text-center p-8 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl border border-amber-500/20">
            <CheckCircle2 className="w-16 h-16 text-amber-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">Agency Assessment Complete!</h2>
            <p className="text-[#7a95b8] text-lg">We've customized your management learning path.</p>
            {featuresCanIgnore.length > 0 && (
              <div className="mt-6 p-4 bg-[#0d1a2e]/50 rounded-xl max-w-2xl mx-auto border border-[#12233e]">
                <p className="text-amber-400 font-medium mb-2">Features you can explore later:</p>
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
            <Button onClick={nextStep} className="bg-amber-600 hover:bg-amber-700 px-8 py-3 text-lg">
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
          <Badge variant="outline" className="border-amber-500/30 text-amber-400">Question {currentQuestion + 1} of {QUESTIONNAIRE.length}</Badge>
          <span className="text-[#7a95b8] text-sm">{Math.round(((currentQuestion) / QUESTIONNAIRE.length) * 100)}% complete</span>
        </div>
        <Progress value={((currentQuestion) / QUESTIONNAIRE.length) * 100} className="h-2" />
        <Card className="rc-card">
          <CardHeader><CardTitle className="text-xl text-white">{q.question}</CardTitle></CardHeader>
          <CardContent>
            <RadioGroup value={questionnaireAnswers[q.id] || ""} onValueChange={(val) => setQuestionnaireAnswers(prev => ({ ...prev, [q.id]: val }))}>
              <div className="space-y-3">
                {q.options.map((opt) => (
                  <div key={opt.value} className={cn("flex items-center space-x-3 p-4 rounded-xl border transition-all cursor-pointer",
                    questionnaireAnswers[q.id] === opt.value ? "border-amber-500 bg-amber-500/10" : "border-[#12233e] hover:border-zinc-500")}>
                    <RadioGroupItem value={opt.value} id={`${q.id}-${opt.value}`} />
                    <Label htmlFor={`${q.id}-${opt.value}`} className="text-[#c8d8ec] cursor-pointer flex-1">{opt.label}</Label>
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
            <Button onClick={() => { if (questionnaireAnswers[q.id]) { markSectionComplete(`agency-q-${q.id}`, 5); setCurrentQuestion(currentQuestion + 1); } }}
              disabled={!questionnaireAnswers[q.id]} className="bg-amber-600 hover:bg-amber-700">
              Next <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={() => { markSectionComplete(`agency-q-${q.id}`, 5); setQuestionnaireComplete(true); awardBadge("b2"); saveProgress({ questionnaireCompleted: true }); }}
              disabled={!questionnaireAnswers[q.id]} className="bg-amber-600 hover:bg-amber-700">
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
    const isCompleted = completedSections.includes(`agency-feature-${feature.id}`);
    const isIgnorable = featuresCanIgnore.includes(feature.id);
    const completedFeatureCount = TOP_FEATURES.filter((f) => completedSections.includes(`agency-feature-${f.id}`)).length;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-amber-600">{completedFeatureCount}/{TOP_FEATURES.length} Learned</Badge>
            {isIgnorable && <Badge variant="outline" className="border-amber-500/30 text-amber-300">Can explore later</Badge>}
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <Button key={cat} size="sm" variant={featureFilter === cat ? "default" : "outline"}
                onClick={() => { setFeatureFilter(cat); setCurrentFeatureIndex(0); }}
                className={featureFilter === cat ? "bg-amber-600" : ""}>
                {cat === "all" ? "All" : cat}
              </Button>
            ))}
          </div>
        </div>

        <Card className="rc-card overflow-hidden p-0">
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-6 border-b border-[#12233e]">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0">
                <Icon className="w-7 h-7 text-amber-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge variant="outline" className="text-xs border-zinc-600">#{feature.rank}</Badge>
                  <Badge variant="outline" className="text-xs border-zinc-600">{feature.category}</Badge>
                  <Badge variant="outline" className={cn("text-xs",
                    feature.difficulty === "First Priority" ? "border-red-500/30 text-red-400" :
                    feature.difficulty === "Essential" ? "border-amber-500/30 text-amber-400" :
                    feature.difficulty === "Beginner" ? "border-green-500/30 text-green-400" :
                    feature.difficulty === "Intermediate" ? "border-cyan-500/30 text-cyan-400" : "border-violet-500/30 text-violet-400")}>
                    {feature.difficulty}
                  </Badge>
                  {isCompleted && <Badge className="bg-amber-600 text-xs">Completed</Badge>}
                </div>
                <h3 className="text-2xl font-bold text-white">{feature.name}</h3>
                <p className="text-[#7a95b8] text-sm mt-1">Time to learn: {feature.timeToLearn}</p>
              </div>
            </div>
          </div>
          <CardContent className="p-6 space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-white mb-2 flex items-center gap-2"><BookOpen className="w-5 h-5 text-amber-400" /> What It Does</h4>
              <p className="text-[#c8d8ec] leading-relaxed">{feature.description}</p>
            </div>
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5">
              <h4 className="text-lg font-semibold text-amber-400 mb-2 flex items-center gap-2"><Target className="w-5 h-5" /> Why It Matters for YOUR Agency</h4>
              <p className="text-[#c8d8ec] leading-relaxed">{feature.whyItMatters}</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-2 flex items-center gap-2"><Settings className="w-5 h-5 text-cyan-400" /> How to Use It</h4>
              <p className="text-[#c8d8ec] leading-relaxed">{feature.howItWorks}</p>
            </div>
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5">
              <h4 className="text-lg font-semibold text-emerald-400 mb-2 flex items-center gap-2"><DollarSign className="w-5 h-5" /> Agency Revenue Impact</h4>
              <p className="text-[#c8d8ec] leading-relaxed">{feature.salesImpact}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Monthly Impact", value: feature.monthlyImpact, color: "text-emerald-400" },
                { label: "Annual Impact", value: feature.annualImpact, color: "text-cyan-400" },
                { label: "Retail Build Cost", value: feature.retailBuildCost, color: "text-amber-400" },
                { label: "Time to Learn", value: feature.timeToLearn, color: "text-violet-400" },
              ].map((s, i) => (
                <div key={i} className="bg-[#0d1a2e] rounded-xl p-4 text-center border border-[#12233e]">
                  <div className={cn("text-xl font-bold", s.color)}>{s.value}</div>
                  <div className="text-[#7a95b8] text-xs mt-1">{s.label}</div>
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
                    <div key={dd.id} className={cn("border rounded-xl transition-all", isExpanded ? "border-amber-500/30 bg-amber-500/5" : "border-[#12233e]")}>
                      <button onClick={() => {
                        setExpandedDrillDown(prev => ({ ...prev, [feature.id]: isExpanded ? null : dd.id }));
                        if (!isSubComplete) {
                          setCompletedSubSections(prev => [...prev, dd.id]);
                          setTotalPoints(prev => prev + 5);
                          if (completedSubSections.length + 1 >= 15) awardBadge("b6");
                        }
                      }} className="w-full flex items-center justify-between p-4 text-left">
                        <div className="flex items-center gap-3">
                          {isSubComplete ? <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" /> : <ChevronRight className={cn("w-5 h-5 text-zinc-500 shrink-0 transition-transform", isExpanded && "rotate-90")} />}
                          <span className="text-zinc-200 font-medium">{dd.title}</span>
                        </div>
                        <Badge variant="outline" className="text-xs border-zinc-600">+5 pts</Badge>
                      </button>
                      {isExpanded && <div className="px-4 pb-4 pl-12"><p className="text-[#c8d8ec] leading-relaxed">{dd.content}</p></div>}
                    </div>
                  );
                })}
              </div>
            </div>
            {!isCompleted && (
              <div className="flex justify-center pt-4">
                <Button onClick={() => {
                  markSectionComplete(`agency-feature-${feature.id}`, 15);
                  const newCount = TOP_FEATURES.filter((f) => completedSections.includes(`agency-feature-${f.id}`) || f.id === feature.id).length;
                  if (["f1", "f2"].every(fid => completedSections.includes(`agency-feature-${fid}`) || fid === feature.id)) awardBadge("b3");
                  if (newCount >= 5) awardBadge("b4");
                  if (newCount >= 15) awardBadge("b5");
                  if (["f7"].every(fid => completedSections.includes(`agency-feature-${fid}`) || fid === feature.id)) awardBadge("b9");
                  saveProgress();
                }} className="bg-amber-600 hover:bg-amber-700 px-8">
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
            <Button onClick={() => setCurrentFeatureIndex(currentFeatureIndex + 1)} className="bg-amber-600 hover:bg-amber-700">
              Next Feature <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={nextStep} className="bg-amber-600 hover:bg-amber-700">
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
        <h2 className="text-3xl font-bold text-white">What This Platform Would Cost to Build</h2>
        <p className="text-[#7a95b8] mt-2 text-lg">Agency-grade management tools at professional development rates</p>
      </div>
      <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl border border-amber-500/20 p-8 text-center">
        <p className="text-[#7a95b8] text-lg mb-2">Total Retail Development Cost</p>
        <div className="text-5xl md:text-6xl font-bold text-amber-400 mb-4">{COST_SUMMARY.totalRetailCost}</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[
            { value: COST_SUMMARY.hourlyDevRate, label: "/hour dev rate" },
            { value: COST_SUMMARY.estimatedHours, label: "dev hours" },
            { value: COST_SUMMARY.teamSize, label: "developers needed" },
            { value: COST_SUMMARY.timeToBuilt, label: "to build" },
          ].map((s, i) => (
            <div key={i} className="bg-[#0d1a2e] rounded-xl p-4">
              <div className="text-xl font-bold text-white">{s.value}</div>
              <div className="text-[#7a95b8] text-sm">{s.label}</div>
            </div>
          ))}
        </div>
        <p className="text-[#7a95b8] mt-6">Plus <span className="text-red-400 font-bold">{COST_SUMMARY.annualMaintenance}</span>/year in ongoing maintenance</p>
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="rc-card">
          <CardHeader><CardTitle className="text-white flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-400" /> Agency Revenue Impact</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-[#0d1a2e] rounded-lg">
              <span className="text-[#7a95b8]">Monthly Production Increase</span>
              <span className="text-emerald-400 font-bold text-xl">{COST_SUMMARY.totalMonthlyImpact}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-[#0d1a2e] rounded-lg">
              <span className="text-[#7a95b8]">Annual Production Increase</span>
              <span className="text-cyan-400 font-bold text-xl">{COST_SUMMARY.totalAnnualImpact}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-[#0d1a2e] rounded-lg">
              <span className="text-[#7a95b8]">3-Year Revenue Impact</span>
              <span className="text-amber-400 font-bold text-xl">$2,556,000</span>
            </div>
          </CardContent>
        </Card>
        <Card className="rc-card">
          <CardHeader><CardTitle className="text-white flex items-center gap-2"><Clock className="w-5 h-5 text-cyan-400" /> Time Savings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-[#0d1a2e] rounded-lg">
              <span className="text-[#7a95b8]">Admin Hours Saved/Month</span>
              <span className="text-emerald-400 font-bold text-xl">40+ hrs</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-[#0d1a2e] rounded-lg">
              <span className="text-[#7a95b8]">Training Hours Saved/Hire</span>
              <span className="text-cyan-400 font-bold text-xl">32 hrs</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-[#0d1a2e] rounded-lg">
              <span className="text-[#7a95b8]">Compliance Hours Saved/Month</span>
              <span className="text-amber-400 font-bold text-xl">20+ hrs</span>
            </div>
          </CardContent>
        </Card>
      </div>
      <Card className="rc-card p-0">
        <CardHeader className="p-5 border-b border-[#12233e]"><CardTitle className="text-white flex items-center gap-2"><Calculator className="w-5 h-5 text-amber-400" /> Feature-by-Feature Breakdown</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#12233e]">
                  <th className="text-left py-3 px-4 text-[#7a95b8] font-medium">#</th>
                  <th className="text-left py-3 px-4 text-[#7a95b8] font-medium">Feature</th>
                  <th className="text-right py-3 px-4 text-[#7a95b8] font-medium">Build Cost</th>
                  <th className="text-right py-3 px-4 text-[#7a95b8] font-medium">Monthly ROI</th>
                  <th className="text-right py-3 px-4 text-[#7a95b8] font-medium">Annual ROI</th>
                </tr>
              </thead>
              <tbody>
                {TOP_FEATURES.map((f) => (
                  <tr key={f.id} className="border-b border-[#12233e] hover:bg-[#12233e]/50">
                    <td className="py-3 px-4 text-[#7a95b8]">{f.rank}</td>
                    <td className="py-3 px-4 text-white">{f.name}</td>
                    <td className="py-3 px-4 text-right text-amber-400 font-mono">{f.retailBuildCost}</td>
                    <td className="py-3 px-4 text-right text-emerald-400 font-mono">{f.monthlyImpact}</td>
                    <td className="py-3 px-4 text-right text-cyan-400 font-mono">{f.annualImpact}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-amber-500/30">
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
        <Button onClick={() => { markSectionComplete("agency-cost", 25); awardBadge("b7"); nextStep(); saveProgress(); }} className="bg-amber-600 hover:bg-amber-700 px-8 py-3 text-lg">
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
        <div className="text-center bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-red-500/10 rounded-2xl border border-amber-500/20 p-12">
          <div className="text-6xl mb-4">👑</div>
          <h2 className="text-4xl font-bold text-white mb-2">You're Ready to Lead!</h2>
          <p className="text-xl text-[#c8d8ec]">Agency Tutorial Complete</p>
          <div className="grid grid-cols-3 gap-6 mt-8 max-w-2xl mx-auto">
            {[
              { value: `${score}/100`, label: "Understanding", color: "text-amber-400" },
              { value: String(totalPoints), label: "Points", color: "text-emerald-400" },
              { value: String(badges.length), label: "Badges", color: "text-cyan-400" },
            ].map((s, i) => (
              <div key={i} className="bg-[#0d1a2e] rounded-xl p-4 border border-[#12233e]">
                <div className={cn("text-3xl font-bold", s.color)}>{s.value}</div>
                <div className="text-[#7a95b8] text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <Card className="rc-card">
          <CardHeader><CardTitle className="text-white flex items-center gap-2"><Award className="w-5 h-5 text-amber-400" /> Your Badges</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {BADGES.map((badge) => {
                const earned = badges.some(b => b.id === badge.id);
                return (
                  <div key={badge.id} className={cn("text-center p-4 rounded-xl border transition-all",
                    earned ? "border-amber-500/30 bg-amber-500/5" : "border-[#12233e] opacity-40")}>
                    <div className="text-3xl mb-2">{badge.emoji}</div>
                    <div className={cn("font-medium text-sm", earned ? "text-white" : "text-[#7a95b8]")}>{badge.name}</div>
                    <div className="text-xs text-[#7a95b8] mt-1">{badge.description}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        <Card className="rc-card">
          <CardHeader><CardTitle className="text-white flex items-center gap-2"><Rocket className="w-5 h-5 text-amber-400" /> Your First 5 Actions as Agency Commander</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { step: 1, text: "Upload your full client database — every client gets an smart opportunity score", path: "/portal/clients" },
                { step: 2, text: "Upload your lead database and set up auto-distribution rules", path: "/portal/clients" },
                { step: 3, text: "Send your advisors to the Individual Agent Tutorial", path: "/portal/agent-tutorial" },
                { step: 4, text: "Set up the Leaderboard and announce the first weekly challenge", path: "/portal/leaderboard" },
                { step: 5, text: "Run a bulk smart strategy generation on your top 50 clients", path: "/portal/bulk-generation" },
              ].map((item) => (
                <a key={item.step} href={item.path} className="flex items-center gap-4 p-4 rounded-xl border border-[#12233e] hover:border-amber-500/30 hover:bg-amber-500/5 transition-all">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 font-bold">{item.step}</div>
                  <span className="text-[#c8d8ec]">{item.text}</span>
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
          <Button onClick={() => window.location.href = "/portal"} className="bg-amber-600 hover:bg-amber-700">
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
            <div className="bg-[#0d1526] border border-amber-500/30 rounded-2xl p-6 shadow-2xl shadow-amber-500/20 max-w-xs">
              <div className="text-center">
                <div className="text-4xl mb-2">{showBadgePopup.emoji}</div>
                <div className="text-amber-400 font-bold text-lg">Badge Earned!</div>
                <div className="text-white font-medium">{showBadgePopup.name}</div>
                <div className="text-[#7a95b8] text-sm mt-1">{showBadgePopup.description}</div>
                <div className="text-amber-400 text-sm mt-2">+50 points</div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center">
                <Crown className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white rc-page-title">Agency Leader Tutorial</h1>
                <p className="text-[#7a95b8] text-sm rc-page-subtitle">Master team management, database operations, and agency growth</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-[#7a95b8] rc-stat-label">Score</div>
                <div className="text-2xl font-bold text-amber-400 rc-stat-value">{score}/100</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-[#7a95b8] rc-stat-label">Points</div>
                <div className="text-2xl font-bold text-emerald-400 rc-stat-value">{totalPoints}</div>
              </div>
              <ExportToSlides
                toolName="Agency Leader Tutorial"
                getSections={() => [
                  {
                    title: "Tutorial Progress",
                    items: [
                      { label: "Score", value: `${score}/100` },
                      { label: "Points", value: totalPoints.toString() },
                      { label: "Progress", value: `${overallProgress}%` }
                    ]
                  }
                ]}
              />
            </div>
          </div>
          <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-2">
            {STEP_ORDER.map((step, i) => {
              const isCurrent = currentStep === step;
              const isPast = STEP_ORDER.indexOf(currentStep) > i;
              return (
                <button key={step} onClick={() => goToStep(step)}
                  className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                    isCurrent ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                    isPast ? "bg-[#0d1a2e] text-amber-400 border border-[#12233e]" : "bg-[#0d1a2e]/50 text-zinc-500 hover:text-[#c8d8ec] border border-[#12233e]/50")}>
                  {isPast ? <CheckCircle2 className="w-4 h-4" /> : <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-xs">{i + 1}</span>}
                  {STEP_LABELS[step]}
                </button>
              );
            })}
          </div>
          <Progress value={overallProgress} className="h-2" />
          <p className="text-[#7a95b8] text-xs mt-1">{overallProgress}% complete</p>
        </div>

        {currentStep === "welcome" && renderWelcome()}
        {currentStep === "questionnaire" && renderQuestionnaire()}
        {currentStep === "features" && renderFeatures()}
        {currentStep === "cost" && renderCostSummary()}
        {currentStep === "complete" && renderCompletion()}
        
        <div className="mt-8">
          <PageInsights pageId="agency-tutorial" />
        </div>
      </div>
    </AppShell>
  );
}
