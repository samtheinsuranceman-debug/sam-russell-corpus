import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  AlertTriangle, BarChart3, Bell, BookOpen, Brain, Building2, Calendar, CheckCheck, ChevronDown, ChevronRight,
  CircleDollarSign, FileCheck, FileText, Home, Landmark, LayoutDashboard, LogOut, Menu,
  MessageCircle, MessageSquare, Palette, Scale, Settings, Shield, ShieldAlert, SlidersHorizontal, Trophy, Users, Webhook, X, Zap, Link2,
  Briefcase, Coins, DollarSign, Star, TrendingDown, Clock, Wallet, PieChart, Target, Lightbulb, Calculator,
  ClipboardList, Activity, FileBarChart, ScrollText, Phone, TrendingUp, Home as HomeIcon, Swords, Sparkles, Leaf, Lock, PiggyBank, Mail,
  History, Layers, Award, Flame, FileUp, Recycle, GraduationCap, Crown, ShieldCheck, Eye, UserCheck, Database, FolderLock,
  Heart, HeartPulse, Scissors, UserPlus, Gift, Receipt, ArrowRightLeft, Search, Gauge,
  Presentation, FileSpreadsheet, Umbrella, BarChart, LineChart, Compass, BookOpenCheck, Gem,
  Ghost, Radio, Dna, Archive, GitBranch, Waves, Megaphone, Image,
  Sword, Volume2, Video, User
} from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useEntrainment } from "@/contexts/EntrainmentEngine";
import { useDisclaimer } from "@/contexts/DisclaimerContext";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { TAB_SCORES } from "@shared/tabScores";
import { useClientData } from "@/contexts/ClientDataContext";
import { GlobalSearch } from "@/components/GlobalSearch";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CommandPalette } from "@/components/CommandPalette";
import { QuickActionsFAB } from "@/components/QuickActionsFAB";
import { SessionTimeout } from "@/components/SessionTimeout";
import TrialCountdownWidget from "@/components/TrialCountdownWidget";
import { Sun, Moon, Inbox } from "lucide-react";
import { MusicPlayerMiniBar } from "@/components/MusicPlayerMiniBar";
import { JourneyProgressBar } from "@/components/JourneyProgressBar";
import { FactFinderBadge } from "@/contexts/ClientDataContext";

/* ═══════════════════════════════════════════════════════════════════
   COLOR-CODED NAVIGATION — Intuitive categories with visual coding
   
   Color Legend:
   🟢 green    → Dashboard & Home (core hub)
   🔵 blue     → Client Management & CRM
   🔷 cyan     → Calculators & Number Crunchers
   🟣 purple   → Intelligence Tools
   🟡 amber    → Retirement & Income Planning
   🟠 orange   → Tax & Estate Strategy
   💚 emerald  → Annuities & Insurance Products
   🌸 rose     → Sales, Presentations & Marketing
   🔴 red      → Compliance & Legal
   ⚪ slate    → Administration & Settings
   🏠 teal     → Real Estate & Property
   📊 indigo   → Market Data & Analytics
   ═══════════════════════════════════════════════════════════════════ */

type ColorCategory = "green" | "blue" | "cyan" | "purple" | "amber" | "orange" | "emerald" | "rose" | "red" | "slate" | "teal" | "indigo" | "gold";

type NavItem = { path: string; label: string; icon: any; color?: ColorCategory };
type NavSubgroup = { subLabel: string; color?: ColorCategory; items: NavItem[] };
type NavSection = {
  label: string;
  icon: any;
  color?: ColorCategory;
  items?: NavItem[];
  subgroups?: NavSubgroup[];
  defaultOpen?: boolean;
};

/** Color map for icon tinting */
const COLOR_MAP: Record<ColorCategory, string> = {
  green:   "text-emerald-300",
  blue:    "text-blue-300",
  cyan:    "text-cyan-300",
  purple:  "text-violet-300",
  amber:   "text-amber-300",
  orange:  "text-orange-300",
  emerald: "text-emerald-200",
  rose:    "text-rose-300",
  red:     "text-red-300",
  slate:   "text-slate-300",
  teal:    "text-teal-300",
  indigo:  "text-indigo-300",
  gold:    "text-yellow-300",
};

const COLOR_DOT_MAP: Record<ColorCategory, string> = {
  green:   "bg-emerald-300",
  blue:    "bg-blue-300",
  cyan:    "bg-cyan-300",
  purple:  "bg-violet-300",
  amber:   "bg-amber-300",
  orange:  "bg-orange-300",
  emerald: "bg-emerald-200",
  rose:    "bg-rose-300",
  red:     "bg-red-300",
  slate:   "bg-slate-300",
  teal:    "bg-teal-300",
  indigo:  "bg-indigo-300",
  gold:    "bg-yellow-300",
};

const COLOR_BORDER_MAP: Record<ColorCategory, string> = {
  green:   "border-emerald-400/20",
  blue:    "border-blue-400/20",
  cyan:    "border-cyan-400/20",
  purple:  "border-violet-400/20",
  amber:   "border-amber-400/20",
  orange:  "border-orange-400/20",
  emerald: "border-emerald-300/20",
  rose:    "border-rose-400/20",
  red:     "border-red-400/20",
  slate:   "border-slate-400/20",
  teal:    "border-teal-400/20",
  indigo:  "border-indigo-400/20",
  gold:    "border-yellow-400/20",
};

const NAV_SECTIONS: NavSection[] = [
  // ── 1. HOME ──────────────────────────────────────────────────────
  {
    label: "Home",
    icon: LayoutDashboard,
    color: "green",
    defaultOpen: true,
    items: [
      { path: "/portal", label: "Wealth Reels", icon: Waves, color: "green" },
      { path: "/portal/dashboard", label: "Dashboard", icon: LayoutDashboard, color: "green" },
      { path: "/portal/advisory-summary", label: "Advisory Summary", icon: BarChart3, color: "green" },
      { path: "/portal/client-health", label: "Client Health", icon: Activity, color: "green" },
      { path: "/portal/client-portfolio", label: "Client Portfolio", icon: Briefcase, color: "green" },
    ],
  },
  // ── 2. CLIENTS ───────────────────────────────────────────────────
  {
    label: "Clients",
    icon: Users,
    color: "blue",
    items: [
      { path: "/portal/clients", label: "Client Directory", icon: Users, color: "blue" },
      { path: "/portal/leads", label: "Lead Inbox", icon: Inbox, color: "blue" },
      { path: "/portal/planning-cases", label: "Planning Cases", icon: ClipboardList, color: "blue" },
      { path: "/portal/client-onboarding", label: "Onboarding", icon: Sparkles, color: "blue" },
      { path: "/portal/client-intake", label: "Smart Intake", icon: MessageCircle, color: "blue" },
      { path: "/portal/ai-meeting-notes", label: "Meeting Notes", icon: Brain, color: "blue" },
      { path: "/portal/client-snapshot", label: "Snapshot Map", icon: PieChart, color: "blue" },
    ],
  },
  // ── 3. NEW CLIENT WELCOME LIST — assessment → AI advisor → genome → the seven journey pages
  {
    label: "New Client Welcome List",
    icon: Compass,
    color: "purple",
    defaultOpen: true,
    items: [
      { path: "/portal/financial-assessment", label: "Financial Assessment", icon: ClipboardList, color: "purple" },
      { path: "/portal/ai-advisor", label: "AI Financial Advisor", icon: Sparkles, color: "purple" },
      { path: "/portal/my-journey", label: "My Secret Journey", icon: Compass, color: "purple" },
      { path: "/portal/plan-ledger", label: "Plan Ledger", icon: BookOpenCheck, color: "purple" },
      { path: "/portal/controls", label: "Controls", icon: BookOpenCheck, color: "purple" },
      { path: "/portal/wealth-genome", label: "Wealth Genome Analysis", icon: Activity, color: "purple" },
      { path: "/portal/the-arrival", label: "1. The Arrival", icon: Sparkles, color: "purple" },
      { path: "/portal/the-mirror", label: "2. The Mirror", icon: Eye, color: "purple" },
      { path: "/portal/the-strategy-table", label: "3. Strategy Table", icon: Presentation, color: "purple" },
      { path: "/portal/the-field", label: "4. The Field", icon: Target, color: "purple" },
      { path: "/portal/the-map", label: "5. The Map", icon: Compass, color: "purple" },
      { path: "/portal/the-legacy", label: "6. The Legacy", icon: Landmark, color: "purple" },
      { path: "/portal/the-brotherhood", label: "7. The Brotherhood", icon: Users, color: "purple" },
    ],
  },
  // ── 3. PLANNING ──────────────────────────────────────────────────
  {
    label: "Planning",
    icon: Target,
    color: "amber",
    subgroups: [
      {
        subLabel: "Retirement & Income",
        color: "amber",
        items: [
          { path: "/portal/ecological-drivers", label: "Retirement Drivers", icon: Leaf, color: "amber" },
          { path: "/portal/social-security", label: "Social Security", icon: Shield, color: "amber" },
          { path: "/portal/income-gap", label: "Income Gap Analyzer", icon: PieChart, color: "amber" },
          { path: "/portal/withdrawal-sequencing", label: "Withdrawal Sequencing", icon: Layers, color: "amber" },
          { path: "/portal/lifetime-income", label: "Lifetime Income", icon: Shield, color: "amber" },
          { path: "/portal/income-timeline", label: "Income Timeline", icon: Clock, color: "amber" },
          { path: "/portal/advisor-income-calculator", label: "Income Calculator", icon: Calculator, color: "amber" },
        ],
      },
      {
        subLabel: "Tax & Estate",
        color: "orange",
        items: [
          { path: "/portal/tax-waterfall", label: "Tax Waterfall", icon: TrendingDown, color: "orange" },
          { path: "/portal/tax-advantaged-growth", label: "Tax-Advantaged Growth", icon: Scale, color: "orange" },
          { path: "/portal/hot-income", label: "Hot Income (Oil & Gas)", icon: Flame, color: "orange" },
          { path: "/portal/estate-tax", label: "Estate Tax", icon: Landmark, color: "orange" },
          { path: "/portal/estate-flow", label: "Estate Flow Chart", icon: Landmark, color: "orange" },
          { path: "/portal/beneficiary-optimization", label: "Beneficiary Optimizer", icon: Users, color: "orange" },
        ],
      },
      {
        subLabel: "Strategy & Scenarios",
        color: "purple",
        items: [
          { path: "/portal/strategy", label: "Strategy Lab", icon: Brain, color: "purple" },
          { path: "/portal/roth-conversion", label: "Roth Strategies (6)", icon: Landmark, color: "purple" },
          { path: "/portal/strategy-compare", label: "Strategy Compare", icon: BarChart3, color: "purple" },
          { path: "/portal/scenarios", label: "Scenario Builder", icon: SlidersHorizontal, color: "purple" },
          { path: "/portal/scenario-side-by-side", label: "Side-by-Side Compare", icon: Scale, color: "purple" },
          { path: "/portal/comparison", label: "5-Slot Comparison", icon: Layers, color: "purple" },
          { path: "/portal/iul-vs-roth", label: "IUL vs Roth", icon: Scale, color: "purple" },
          { path: "/portal/risk-tolerance", label: "Risk Tolerance", icon: Activity, color: "purple" },
          { path: "/portal/market-stress-test", label: "Market Stress Test", icon: Activity, color: "purple" },
        ],
      },
    ],
  },
  // ── 4. PRODUCTS ──────────────────────────────────────────────────
  {
    label: "Products",
    icon: Shield,
    color: "emerald",
    subgroups: [
      {
        subLabel: "IUL & Index",
        color: "cyan",
        items: [
          { path: "/portal/ibbotson-charts", label: "Ibbotson Charts", icon: BarChart3, color: "cyan" },
          { path: "/portal/iul-historical", label: "IUL Historical", icon: History, color: "cyan" },
          { path: "/portal/index-strategies", label: "Index Strategies", icon: Layers, color: "cyan" },
          { path: "/portal/policy-loans", label: "Policy Loans", icon: Wallet, color: "cyan" },
          { path: "/portal/premium-financing", label: "Premium Financing", icon: DollarSign, color: "cyan" },
          { path: "/portal/index-backtester", label: "Index Backtester", icon: BarChart3, color: "cyan" },
          { path: "/portal/time-machine-calculator", label: "Time Machine", icon: Clock, color: "cyan" },
          { path: "/portal/time-machine-ag49", label: "AG 49 Compounding", icon: TrendingUp, color: "cyan" },
          { path: "/portal/time-machine-method", label: "Dual Illustration", icon: Zap, color: "cyan" },
        ],
      },
      {
        subLabel: "Annuities",
        color: "emerald",
        items: [
          { path: "/portal/growth-annuities", label: "Growth Annuities", icon: TrendingUp, color: "emerald" },
          { path: "/portal/myga-fixed-rate", label: "MYGA Waterfall", icon: Lock, color: "emerald" },
          { path: "/portal/existing-annuities", label: "Existing Annuities", icon: PiggyBank, color: "emerald" },
          { path: "/portal/income-annuity-top10", label: "Top 10 Income", icon: Award, color: "emerald" },
          { path: "/portal/fia-top10", label: "Top 10 FIA", icon: TrendingUp, color: "emerald" },
          { path: "/portal/annuity-accumulation-db", label: "Accumulation DB", icon: Database, color: "emerald" },
          { path: "/portal/carrier-comparison", label: "Carrier Compare", icon: Scale, color: "emerald" },
          { path: "/portal/illustration-compare", label: "Illustration Compare", icon: BarChart3, color: "emerald" },
          { path: "/portal/ai-policy-review", label: "Policy Gap Analysis", icon: Search, color: "emerald" },
        ],
      },
      {
        subLabel: "Real Estate",
        color: "teal",
        items: [
          { path: "/portal/mortgage-killer", label: "Mortgage Killer", icon: Home, color: "teal" },
          { path: "/portal/house-recycling", label: "House Recycling", icon: Recycle, color: "teal" },
          { path: "/portal/household-wealth", label: "Household Wealth", icon: HomeIcon, color: "teal" },
          { path: "/portal/real-estate-mogul", label: "Real Estate Mogul", icon: Building2, color: "teal" },
          { path: "/portal/reverse-heloc", label: "Reverse HELOC", icon: Landmark, color: "teal" },
        ],
      },
      {
        subLabel: "Specialty",
        color: "cyan",
        items: [
          { path: "/portal/business-owner", label: "Business Owner", icon: Briefcase, color: "cyan" },
        ],
      },
    ],
  },
  // ── 5. AI & TOOLS ────────────────────────────────────────────────
  {
    label: "AI & Tools",
    icon: Zap,
    color: "purple",
    subgroups: [
      {
        subLabel: "AI Assistants",
        color: "purple",
        items: [
          { path: "/portal/ai-assist", label: "Strategy Assist", icon: Zap, color: "purple" },
          { path: "/portal/ai-recommender", label: "Strategy Recommender", icon: Brain, color: "purple" },
          { path: "/portal/data-query", label: "Ask Your Data", icon: MessageSquare, color: "purple" },
          { path: "/portal/predictive-analytics", label: "Predictive Analytics", icon: TrendingUp, color: "purple" },
          { path: "/portal/stale-digest", label: "Stale Digest", icon: AlertTriangle, color: "purple" },
        ],
      },
      {
        subLabel: "Sales & Content",
        color: "rose",
        items: [
          { path: "/portal/sales-story", label: "Sales Story Builder", icon: Sparkles, color: "rose" },
          { path: "/portal/lead-generator", label: "Lead Generator", icon: Zap, color: "rose" },
          { path: "/portal/competitive", label: "Competitive Analysis", icon: Swords, color: "rose" },
          { path: "/portal/presentation-builder", label: "Presentation Builder", icon: FileBarChart, color: "rose" },
          { path: "/portal/ai-slides", label: "AI Slide Generator", icon: Presentation, color: "rose" },
          { path: "/portal/my-slides", label: "My Slides Library", icon: Layers, color: "rose" },
          { path: "/portal/document-templates", label: "Document Templates", icon: ScrollText, color: "rose" },
          { path: "/portal/video-proposals", label: "Video Proposals (AI)", icon: Video, color: "rose" },
        ],
      },
    ],
  },
  // ── 6. COMPLIANCE ────────────────────────────────────────────────
  {
    label: "Compliance",
    icon: ShieldCheck,
    color: "red",
    items: [
      { path: "/portal/compliance", label: "Compliance Center", icon: FileCheck, color: "red" },
      { path: "/portal/compliance-monitoring", label: "Compliance Monitor", icon: Gauge, color: "red" },
      { path: "/portal/compliance-alerts", label: "Alerts", icon: ShieldAlert, color: "red" },
      { path: "/portal/compliance-audit-trail", label: "Audit Trail", icon: ScrollText, color: "red" },
    ],
  },
  // ── 7. THE EXPERIENCE ─────────────────────────────────────────────
  {
    label: "The Experience",
    icon: Sparkles,
    color: "gold",
    defaultOpen: true,
    subgroups: [
      {
        subLabel: "Command",
        color: "gold",
        items: [
          { path: "/portal/daily-briefing", label: "Daily Briefing", icon: Sun, color: "gold" },
          { path: "/portal/nerve-center", label: "Nerve Center", icon: Activity, color: "gold" },
          { path: "/portal/toilet", label: "Quick Glance", icon: Zap, color: "gold" },
          { path: "/portal/russell-number", label: "Russell Number", icon: Gauge, color: "gold" },
          { path: "/portal/daily-discovery", label: "Daily Discovery", icon: Compass, color: "gold" },
          { path: "/portal/my-world", label: "My World", icon: Sparkles, color: "gold" },
          { path: "/portal/avatar-twins", label: "Avatar Twins", icon: Image, color: "gold" },
          { path: "/portal/morning-ritual", label: "Morning Ritual", icon: Flame, color: "gold" },
          { path: "/portal/infinite-scroll", label: "Wealth Feed", icon: Waves, color: "gold" },
        ],
      },
      {
        subLabel: "Compete",
        color: "gold",
        items: [
          { path: "/portal/arena", label: "The Arena", icon: Trophy, color: "gold" },
          { path: "/portal/war-room", label: "War Room", icon: Target, color: "gold" },
          { path: "/portal/war-story-generator", label: "War Story Gen", icon: Sword, color: "gold" },
          { path: "/portal/time-machine", label: "Time Machine", icon: Clock, color: "gold" },
          { path: "/portal/time-lapse", label: "Time-Lapse", icon: BarChart, color: "gold" },
        ],
      },
      {
        subLabel: "Earn",
        color: "gold",
        items: [
          { path: "/portal/rewards", label: "Rewards Vault", icon: Gift, color: "gold" },
          { path: "/portal/revenue-guarantee", label: "Revenue Guarantee", icon: Shield, color: "gold" },
          { path: "/portal/pet", label: "Pet Companion", icon: Heart, color: "gold" },
        ],
      },
      {
        subLabel: "Explore",
        color: "gold",
        items: [
          { path: "/portal/black-mirror", label: "Black Mirror", icon: Ghost, color: "gold" },
          { path: "/portal/social", label: "Social Narcotic", icon: Radio, color: "gold" },
        ],
      },
      {
        subLabel: "Transcend",
        color: "gold",
        items: [
          { path: "/portal/endgame", label: "The Endgame", icon: Gem, color: "gold" },
          { path: "/portal/will-writer", label: "Will Writer", icon: ScrollText, color: "gold" },
          { path: "/portal/couples", label: "Couples Mode", icon: Heart, color: "gold" },
          { path: "/portal/wrapped", label: "Russell Wrapped", icon: Gift, color: "gold" },
          { path: "/portal/story-generator", label: "Story Generator", icon: BookOpen, color: "gold" },
          { path: "/portal/co-pilot", label: "Live Co-Pilot", icon: Brain, color: "gold" },
        ],
      },
    ],
  },
  // ── 8. TAX SECRETS ────────────────────────────────────────────────
  {
    label: "Tax Secrets",
    icon: Crown,
    color: "purple",
    defaultOpen: true,
    items: [
      { path: "/portal/secret-secrets", label: "100 Secret Strategies", icon: Lock, color: "purple" },
      { path: "/portal/tax-combos", label: "100 Tax-Free Combos", icon: Gem, color: "emerald" },
      { path: "/portal/combo-recommender", label: "AI Combo Recommender", icon: Brain, color: "purple" },
      { path: "/portal/client-intake-recommender", label: "Client Intake Form", icon: User, color: "cyan" },
      { path: "/portal/divorce-calculator", label: "Divorce Devastation Engine", icon: Scissors, color: "red" },
      { path: "/portal/trusts", label: "Trust Structures", icon: Landmark, color: "orange" },
      { path: "/portal/mortgage-killer-v3", label: "Mortgage Killer V3", icon: Home, color: "teal" },
      { path: "/portal/str-strategy", label: "STR Tax Strategy", icon: Building2, color: "amber" },
      { path: "/portal/physicians-edge", label: "Physician's Edge", icon: HeartPulse, color: "emerald" },
    ],
  },
  // ── SECONDARY INFORMATION ────────────────────────────────────────
  {
    label: "Secondary Information",
    icon: Archive,
    color: "slate",
    items: [
      { path: "/portal/secondary-information", label: "Secondary Library", icon: Archive, color: "slate" },
      { path: "/portal/tool-explorer", label: "Tool Explorer", icon: Compass, color: "slate" },
      { path: "/portal/knowledge-library", label: "Knowledge Library", icon: BookOpen, color: "slate" },
      { path: "/portal/video-library", label: "Video Library", icon: Video, color: "slate" },
      { path: "/portal/patent-showcase", label: "Patent Portfolio", icon: Shield, color: "slate" },
    ],
  },
  // ── 9. SETTINGS ──────────────────────────────────────────────────
  {
    label: "Settings",
    icon: Settings,
    color: "slate",
    items: [
      { path: "/portal/billing", label: "Billing & Plans", icon: CircleDollarSign, color: "slate" },
      { path: "/portal/agent-tutorial", label: "Platform Training", icon: GraduationCap, color: "slate" },
      { path: "/portal/connections", label: "Connections", icon: Link2, color: "slate" },
      { path: "/portal/integrations", label: "Integrations", icon: Link2, color: "slate" },
      { path: "/portal/bulk-generation", label: "Bulk Generation", icon: Lock, color: "slate" },
      { path: "/portal/command-center", label: "Command Center", icon: Activity, color: "slate" },
      { path: "/portal/system-health", label: "System Health", icon: Activity, color: "purple" },
      { path: "/portal/leaderboard", label: "Leaderboard", icon: Trophy, color: "slate" },
    ],
  },
];

const BOTTOM_TABS = [
  { path: "/portal", label: "Home", icon: LayoutDashboard },
  { path: "/portal/clients", label: "Clients", icon: Users },
  { path: "/portal/nerve-center", label: "Experience", icon: Sparkles },
  { path: "/portal/ai-assist", label: "AI Tools", icon: Zap },
  { path: "/portal/arena", label: "Arena", icon: Trophy },
];

function DisclaimerToggle() {
  const { showDisclaimers, setShowDisclaimers } = useDisclaimer();
  return (
    <button
      onClick={() => setShowDisclaimers(!showDisclaimers)}
      className="flex items-center justify-between w-full group"
      title={showDisclaimers ? "Switch to Demo Mode (hide disclaimers)" : "Switch to Compliance Mode (show disclaimers)"}
    >
      <div className="flex items-center gap-2">
        <Shield size={10} className={showDisclaimers ? "text-amber-400" : "text-[#7a95b8]"} />
        <span className="text-[9px] text-[#7a95b8] group-hover:text-white transition-colors">
          {showDisclaimers ? "Compliance Mode" : "Demo Mode"}
        </span>
      </div>
      <div className={`w-8 h-4 rounded-full transition-colors relative ${
        showDisclaimers ? "bg-amber-500/30" : "bg-[#1a3055]"
      }`}>
        <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${
          showDisclaimers ? "left-4 bg-amber-400" : "left-0.5 bg-[#7a95b8]"
        }`} />
      </div>
    </button>
  );
}

function LiveDateTime() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const dayName = now.toLocaleDateString(undefined, { weekday: "long" });
  const dateStr = now.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const timeStr = now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true });

  return (
    <div className="mt-1.5 px-1 py-1 rounded-md bg-white/5 border border-white/10">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[8px] text-slate-400 leading-tight">{dayName}, {dateStr}</span>
          <span className="text-[10px] font-mono font-semibold text-emerald-300 leading-tight tracking-wide">{timeStr}</span>
        </div>
        <Clock className="w-3 h-3 text-slate-500" />
      </div>
    </div>
  );
}

function WorkspaceSwitcher() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const { data: workspaces } = trpc.workspaceSwitcher.list.useQuery(undefined, { staleTime: 60_000, enabled: isAuthenticated, retry: false });

  if (!isAuthenticated || !workspaces || workspaces.length <= 1) return null;

  const current = workspaces[0];

  return (
    <div className="relative px-4 py-2 border-b border-[#12233e]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[#12233e]/50 transition-colors text-left"
      >
        <div className="w-6 h-6 rounded bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-[10px] font-bold text-blue-400 flex-shrink-0">
          {current?.workspaceName?.[0]?.toUpperCase() ?? "W"}
        </div>
        <span className="text-xs text-white truncate flex-1">{current?.workspaceName ?? "Workspace"}</span>
        <ChevronDown size={12} className={`text-[#7a95b8] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-4 right-4 top-full mt-1 bg-[#0a1628] border border-[#12233e] rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
            {workspaces.map((ws: any) => (
              <button
                key={ws.workspaceId}
                onClick={() => { setOpen(false); /* Future: switch active workspace */ }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[#12233e]/50 transition-colors ${
                  ws.workspaceId === current?.workspaceId ? "bg-[#12233e]/30" : ""
                }`}
              >
                <div className="w-5 h-5 rounded bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-[9px] font-bold text-blue-400">
                  {ws.workspaceName?.[0]?.toUpperCase() ?? "W"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white truncate">{ws.workspaceName}</div>
                  <div className="text-[10px] text-[#7a95b8]">{ws.role}</div>
                </div>
                {ws.workspaceId === current?.workspaceId && (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ActiveClientSelector() {
  const { selectedClientId, setSelectedClientId, clients, clientsLoading, data } = useClientData();
  const [open, setOpen] = useState(false);

  if (clientsLoading) return (
    <div className="px-4 py-2 border-b border-[#12233e]">
      <div className="h-8 rounded bg-[#12233e]/50 animate-pulse" />
    </div>
  );

  if (clients.length === 0) return null;

  const selected = clients.find(c => c.id === selectedClientId);

  return (
    <div className="relative px-4 py-2 border-b border-[#12233e]">
      <div className="text-[10px] uppercase tracking-wider text-[#7a95b8] mb-1 font-semibold">Active Client</div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[#12233e]/50 transition-colors text-left border border-[#1a3050]"
      >
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
          selected ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400" : "bg-[#12233e] border border-[#1a3050] text-[#7a95b8]"
        }`}>
          {selected ? selected.name[0]?.toUpperCase() : "?"}
        </div>
        <span className={`text-xs truncate flex-1 ${selected ? "text-white" : "text-[#7a95b8]"}`}>
          {selected ? selected.name : "Select a client..."}
        </span>
        {data && (
          <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500" title="Fact Finder loaded" />
        )}
        <ChevronDown size={12} className={`text-[#7a95b8] transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-4 right-4 top-full mt-1 bg-[#0a1628] border border-[#12233e] rounded-lg shadow-xl z-50 max-h-56 overflow-y-auto">
            <button
              onClick={() => { setSelectedClientId(null); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[#12233e]/50 transition-colors text-xs ${
                !selectedClientId ? "bg-[#12233e]/30 text-white" : "text-[#7a95b8]"
              }`}
            >
              <X size={12} /> Clear selection
            </button>
            {clients.map(c => (
              <button
                key={c.id}
                onClick={() => { setSelectedClientId(c.id); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[#12233e]/50 transition-colors ${
                  c.id === selectedClientId ? "bg-[#12233e]/30" : ""
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                  c.id === selectedClientId ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400" : "bg-[#12233e] border border-[#1a3050] text-[#7a95b8]"
                }`}>
                  {c.name[0]?.toUpperCase()}
                </div>
                <span className={`text-xs truncate ${c.id === selectedClientId ? "text-white font-medium" : "text-[#c8d8e8]"}`}>
                  {c.name}
                </span>
                {c.id === selectedClientId && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function NavItemLink({ item, isActive, onClose, badgeCount = 0, isFavorited, onToggleFavorite }: { item: NavItem; isActive: boolean; onClose: () => void; badgeCount?: number; isFavorited?: boolean; onToggleFavorite?: (path: string, label: string) => void }) {
  const Icon = item.icon;
  const iconColor = item.color && !isActive ? COLOR_MAP[item.color] : "";
  const score = TAB_SCORES[item.path];
  const isHighScore = score !== undefined && score >= 9;
  const scoreBgColor = score !== undefined
    ? score >= 10 ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/30"
    : score >= 9 ? "bg-blue-500/20 text-blue-300 border border-blue-500/25"
    : score >= 7 ? "bg-slate-500/15 text-slate-400 border border-slate-500/20"
    : "bg-orange-500/15 text-orange-400 border border-orange-500/20"
    : "";
  return (
    <div className="relative group">
      <Link
        href={item.path}
        className={`rc-sidebar-item ${isActive ? "active" : ""}`}
        onClick={onClose}
        style={isHighScore ? { fontSize: '1.05em' } : undefined}
      >
        <Icon size={isHighScore ? 15 : 14} className={`${isActive ? '' : iconColor} ${!isActive && item.color ? 'brightness-125' : ''}`} />
        <span style={{ flex: '1 1 0', minWidth: 0, wordBreak: 'break-word', fontWeight: isHighScore ? 700 : 600 }}>{item.label}</span>
        {score !== undefined && (
          <span className={`inline-flex items-center justify-center h-4 min-w-4 px-0.5 rounded text-[9px] font-bold flex-shrink-0 ${scoreBgColor}`}>
            {score}
          </span>
        )}
        {badgeCount > 0 && (
          <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-[#22c55e]/20 text-[#22c55e] text-[10px] font-bold">
            {badgeCount}
          </span>
        )}
      </Link>
      {/* Pin/Unpin star - always in DOM, shown via CSS group-hover */}
      {onToggleFavorite && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(item.path, item.label); }}
          className={`absolute right-1 top-1/2 -translate-y-1/2 p-1 rounded-md transition-all z-10 ${
            isFavorited
              ? "text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 opacity-100"
              : "text-[#4a6a8e] hover:text-amber-400 hover:bg-amber-500/10 opacity-0 group-hover:opacity-100"
          }`}
          title={isFavorited ? "Remove from favorites" : "Add to favorites"}
        >
          <Star size={10} fill={isFavorited ? "currentColor" : "none"} />
        </button>
      )}
    </div>
  );
}

function CollapsibleSection({ section, location, onClose, clientCount, favoritePaths, onToggleFavorite }: { section: NavSection; location: string; onClose: () => void; clientCount: number; favoritePaths?: Set<string>; onToggleFavorite?: (path: string, label: string) => void }) {
  // Check if any item in this section is active
  const allItems = useMemo(() => {
    const items: NavItem[] = [...(section.items || [])];
    section.subgroups?.forEach(sg => items.push(...sg.items));
    return items;
  }, [section]);

  const hasActiveChild = allItems.some(item =>
    location === item.path || (item.path !== "/portal" && location.startsWith(item.path))
  );

  const [isOpen, setIsOpen] = useState(section.defaultOpen || hasActiveChild);

  // Auto-open when a child becomes active
  useEffect(() => {
    if (hasActiveChild && !isOpen) setIsOpen(true);
  }, [hasActiveChild]);

  const SectionIcon = section.icon;

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] font-extrabold transition-all duration-200 cursor-pointer select-none ${
          hasActiveChild ? "text-[#22c55e] drop-shadow-[0_0_6px_rgba(34,197,94,0.4)]" : `${section.color ? COLOR_MAP[section.color] : 'text-[#7a95b8]'} hover:brightness-125`
        }`}
      >
        {section.color && (
          <span className={`w-1 h-1 rounded-full flex-shrink-0 ${COLOR_DOT_MAP[section.color]} shadow-[0_0_4px_currentColor]`} />
        )}
        <SectionIcon size={13} className={`flex-shrink-0 ${section.color && !hasActiveChild ? COLOR_MAP[section.color] : ""}`} />
        <span className="flex-1 text-left">{section.label}</span>
        <ChevronRight size={11} className={`transition-transform duration-200 flex-shrink-0 opacity-60 ${isOpen ? "rotate-90" : ""}`} />
      </button>
      {isOpen && (
        <div className="pb-1">
          {/* Flat items */}
          {section.items?.map((item) => {
            const isActive = location === item.path || (item.path !== "/portal" && location.startsWith(item.path));
            const badgeCount = item.path === "/portal/clients" ? clientCount : 0;
            return <NavItemLink key={item.path} item={item} isActive={isActive} onClose={onClose} badgeCount={badgeCount} isFavorited={favoritePaths?.has(item.path)} onToggleFavorite={onToggleFavorite} />;
          })}
          {/* Subgroups */}
          {section.subgroups?.map((sg) => (
            <SubgroupSection key={sg.subLabel} subgroup={sg} location={location} onClose={onClose} favoritePaths={favoritePaths} onToggleFavorite={onToggleFavorite} />
          ))}
        </div>
      )}
    </div>
  );
}

function SubgroupSection({ subgroup, location, onClose, favoritePaths, onToggleFavorite }: { subgroup: NavSubgroup; location: string; onClose: () => void; favoritePaths?: Set<string>; onToggleFavorite?: (path: string, label: string) => void }) {
  const hasActiveChild = subgroup.items.some(item =>
    location === item.path || (item.path !== "/portal" && location.startsWith(item.path))
  );
  const [isOpen, setIsOpen] = useState(hasActiveChild);

  useEffect(() => {
    if (hasActiveChild && !isOpen) setIsOpen(true);
  }, [hasActiveChild]);

  return (
    <div className="ml-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] font-bold transition-all duration-200 cursor-pointer select-none ${
          hasActiveChild ? "text-[#22c55e]/80" : `${subgroup.color ? COLOR_MAP[subgroup.color] : 'text-[#5a7a9e]'} opacity-70 hover:opacity-100`
        }`}
      >
        {subgroup.color && (
          <span className={`w-1 h-1 rounded-full flex-shrink-0 opacity-60 ${COLOR_DOT_MAP[subgroup.color]}`} />
        )}
        <ChevronRight size={10} className={`transition-transform duration-200 flex-shrink-0 opacity-50 ${isOpen ? "rotate-90" : ""}`} />
        <span className="flex-1 text-left">{subgroup.subLabel}</span>
        <span className="text-[9px] opacity-40 font-bold">{subgroup.items.length}</span>
      </button>
      {isOpen && (
        <div className={`ml-1 border-l pl-1 ${subgroup.color ? COLOR_BORDER_MAP[subgroup.color] : 'border-[#12233e]/60'}`}>
          {subgroup.items.map((item) => {
            const isActive = location === item.path || (item.path !== "/portal" && location.startsWith(item.path));
            return <NavItemLink key={item.path} item={item} isActive={isActive} onClose={onClose} isFavorited={favoritePaths?.has(item.path)} onToggleFavorite={onToggleFavorite} />;
          })}
        </div>
      )}
    </div>
  );
}

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [location] = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const statsQuery = trpc.dashboard.stats.useQuery(undefined, { staleTime: 60_000, retry: false });
  const clientCount = statsQuery.data?.clientCount ?? 0;

  // Favorites
  const utils = trpc.useUtils();
  const { data: favorites } = trpc.favorites.list.useQuery(undefined, { staleTime: 30_000, enabled: isAuthenticated, retry: false });
  const addFav = trpc.favorites.add.useMutation({
    onSuccess: () => utils.favorites.list.invalidate(),
  });
  const removeFav = trpc.favorites.remove.useMutation({
    onSuccess: () => utils.favorites.list.invalidate(),
  });

  const favoritePaths = useMemo(() => new Set((favorites ?? []).map((f: any) => f.path)), [favorites]);

  const handleToggleFavorite = useCallback((path: string, label: string) => {
    if (favoritePaths.has(path)) {
      removeFav.mutate({ path });
    } else {
      addFav.mutate({ path, label });
    }
  }, [favoritePaths, addFav, removeFav]);

  // Build a lookup from path -> NavItem for favorites rendering
  const navItemLookup = useMemo(() => {
    const map = new Map<string, NavItem>();
    NAV_SECTIONS.forEach(section => {
      section.items?.forEach(item => map.set(item.path, item));
      section.subgroups?.forEach(sg => sg.items.forEach(item => map.set(item.path, item)));
    });
    return map;
  }, []);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onClose}
        />
      )}
      <aside className={`rc-sidebar ${open ? "open" : ""}`}>
        {/* Logo */}
        <div className="rc-sidebar-logo">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#22c55e]/20 border border-[#22c55e]/30 flex items-center justify-center">
              <span className="text-[#22c55e] font-bold text-xs">RCS</span>
            </div>
            <div>
              <div className="text-xs font-bold text-white leading-tight">Russell Capital Systems™</div>
              <div className="text-[9px] text-[#22c55e]/70 leading-tight tracking-wide">Turn Capital Into Income™</div>
            </div>
          </div>
          <LiveDateTime />
        </div>

        {/* Workspace Switcher */}
        <WorkspaceSwitcher />

        {/* Active Client Selector */}
        <ActiveClientSelector />

        {/* Nav */}
        <nav className="rc-sidebar-nav">
          {/* ★ Favorites Section */}
          {isAuthenticated && favorites && favorites.length > 0 && (
            <div className="mb-1">
              <div className="flex items-center gap-1.5 px-3 py-1.5">
                <Star size={11} className="text-amber-400" fill="currentColor" />
                <span className="text-[10px] uppercase tracking-[0.1em] font-extrabold text-amber-400">Favorites</span>
                <span className="text-[9px] text-amber-400/50 font-bold">{favorites.length}</span>
              </div>
              <div className="pb-2 border-b border-amber-500/10 mb-1">
                {favorites.map((fav: any) => {
                  const navItem = navItemLookup.get(fav.path);
                  const item: NavItem = navItem ?? { path: fav.path, label: fav.label, icon: Star };
                  const isActive = location === fav.path || (fav.path !== "/portal" && location.startsWith(fav.path));
                  return (
                    <NavItemLink
                      key={`fav-${fav.path}`}
                      item={item}
                      isActive={isActive}
                      onClose={onClose}
                      isFavorited={true}
                      onToggleFavorite={handleToggleFavorite}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {NAV_SECTIONS.map((section) => (
            <CollapsibleSection
              key={section.label}
              section={section}
              location={location}
              onClose={onClose}
              clientCount={clientCount}
              favoritePaths={favoritePaths}
              onToggleFavorite={isAuthenticated ? handleToggleFavorite : undefined}
            />
          ))}
        </nav>

        {/* Disclaimer Mode Toggle */}
        <div className="px-3 py-1.5 border-t border-[#12233e]">
          <DisclaimerToggle />
        </div>

        {/* Music Player Mini-Bar */}
        <MusicPlayerMiniBar />

        {/* User footer */}
        <div className="p-3 border-t border-[#12233e]">
          {isAuthenticated && user ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-[10px] font-bold text-blue-300">
                  {user.name?.[0]?.toUpperCase() ?? "A"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold text-white truncate">{user.name ?? "Advisor"}</div>
                  <div className="text-[10px] text-[#7a95b8] truncate">{user.email ?? ""}</div>
                </div>
              </div>
              <button
                onClick={() => logout()}
                className="rc-sidebar-item w-full text-left"
              >
                <LogOut size={12} />
                Sign out
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-[#22c55e]/20 border border-[#22c55e]/30 flex items-center justify-center text-[10px] font-bold text-[#22c55e]">
                  G
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold text-white truncate">Guest</div>
                  <div className="text-[10px] text-[#7a95b8] truncate">Browsing as guest</div>
                </div>
              </div>
              <a
                href={getLoginUrl(location)}
                className="rc-sidebar-item w-full text-left inline-flex items-center gap-2"
              >
                <LogOut size={14} className="rotate-180" />
                Sign in for full access
              </a>
            </>
          )}
        </div>
      </aside>
    </>
  );
}

function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const { data: unread } = trpc.notifications.unreadCount.useQuery(undefined, { refetchInterval: 30_000, enabled: isAuthenticated, retry: false });
  const { data: notifications } = trpc.notifications.list.useQuery(undefined, { enabled: open && isAuthenticated, retry: false });
  const utils = trpc.useUtils();
  const markRead = trpc.notifications.markRead.useMutation({
    onSuccess: () => { utils.notifications.unreadCount.invalidate(); utils.notifications.list.invalidate(); },
  });
  const markAllRead = trpc.notifications.markAllRead.useMutation({
    onSuccess: () => { utils.notifications.unreadCount.invalidate(); utils.notifications.list.invalidate(); },
  });
  const count = unread?.count ?? 0;

  // Don't render for anonymous users
  if (!isAuthenticated) return null;

  return (
    <div className="relative mr-3">
      <button
        onClick={() => setOpen(!open)}
        className="relative rc-btn rc-btn-ghost p-2 text-[#7a95b8] hover:text-white"
      >
        <Bell size={18} />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-[#0a1628] border border-[#12233e] rounded-lg shadow-xl z-50">
            <div className="flex items-center justify-between p-3 border-b border-[#12233e]">
              <span className="text-sm font-semibold text-white">Notifications</span>
              {count > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  className="text-xs text-[#22c55e] hover:text-[#22c55e]/80 flex items-center gap-1"
                >
                  <CheckCheck size={12} /> Mark all read
                </button>
              )}
            </div>
            {!notifications || notifications.length === 0 ? (
              <div className="p-6 text-center text-[#7a95b8] text-sm">No notifications yet.</div>
            ) : (
              <div>
                {notifications.map((n: any) => (
                  <div
                    key={n.id}
                    className={`p-3 border-b border-[#12233e]/50 hover:bg-[#12233e]/30 cursor-pointer transition-colors ${
                      !n.read ? "bg-[#12233e]/20" : ""
                    }`}
                    onClick={() => {
                      if (!n.read) markRead.mutate({ notificationId: n.id });
                      if (n.link) window.location.href = n.link;
                    }}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && <div className="w-2 h-2 rounded-full bg-[#22c55e] mt-1.5 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{n.title}</p>
                        <p className="text-xs text-[#7a95b8] mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-[#4a6a8e] mt-1">
                          {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme, switchable } = useTheme();
  if (!switchable || !toggleTheme) return null;
  return (
    <button
      onClick={toggleTheme}
      className="rc-btn rc-btn-ghost p-2 text-[#7a95b8] hover:text-white mr-1"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

function AudioToggle() {
  const { audioEnabled, toggleAudio, beatMode } = useEntrainment();
  return (
    <button
      onClick={toggleAudio}
      className={`rc-btn rc-btn-ghost p-2 mr-1 transition-colors ${
        audioEnabled ? "text-emerald-400 hover:text-emerald-300" : "text-[#7a95b8] hover:text-white"
      }`}
      aria-label={audioEnabled ? "Mute focus audio" : "Enable focus audio"}
      title={audioEnabled ? `Focus audio on (${beatMode === 'gamma' ? '40Hz gamma' : '10Hz alpha'})` : "Enable subliminal focus audio"}
    >
      <Volume2 size={16} />
    </button>
  );
}

/** Map of route paths to their sub-tab names */
const PAGE_SUBTABS: Record<string, string[]> = {
  "/portal/dashboard": ["Workspace Overview", "Clients", "AUM Growth", "Strategy Trend", "Deal Pipeline", "Asset Allocation", "Goal Tracking", "Activity Feed"],
  "/portal/social-security": ["Claiming", "Breakeven", "Scenarios", "Taxation", "Projection", "Earnings", "Survivor", "WEP/GPO", "Bridge"],
  "/portal/tax-waterfall": ["Waterfall", "Brackets", "Scenarios", "Breakdown", "Roth Analysis", "Tax Bomb", "IRMAA", "Lifetime Heatmap", "Cap Gains", "Withdrawal Order"],
  "/portal/estate-tax": ["Overview", "Assets", "Deductions", "ILIT", "Gifting", "Sunset", "Projections", "Insurance"],
  "/portal/mortgage-killer": ["Fact Finder", "Current Plan", "Recommended", "Savings", "Scenarios", "Amortization", "Details"],
  "/portal/household-wealth": ["Fact Finder", "Policies", "Mortgage", "Real Estate", "Recapture", "Summary"],
  "/portal/hot-income": ["Year Summaries", "Overview", "Tax Calculator", "Projection", "Tax Benefits", "Beneficiary"],
  "/portal/growth-annuities": ["Overview", "ETF vs Traditional", "Precious Metals", "Fact Finder", "Growth Calc", "Roth Conversion"],
  "/portal/crypto-corner": ["Cycles", "Simulator", "Fact Finder", "Accumulation", "Real Estate", "Synthesis"],
  "/portal/iul-historical": ["Historical Credits", "Floor Protection", "Cap Rate History", "Three Scenarios", "How It Works"],
  "/portal/athene-guaranteed-income": ["Overview", "Rollup", "Strategies", "How It Works", "Roth Advantage"],
  "/portal/income-annuity-top10": ["Comparison", "Details", "Chart", "State Info", "How It Works"],
  "/portal/market-data": ["Interest Rates", "IUL Rate Context", "Annuity Rates", "Economic Indicators", "Talking Points"],
  "/portal/myga-fixed-rate": ["What Is MYGA", "Illustration", "Safety", "Guaranty", "Rates", "MYGA vs S&P", "Amazing Waterfall"],
  "/portal/estate-flow-chart": ["Flow Diagram", "Estate Inputs", "Trust Structures", "2024 vs 2026", "Tax Strategies"],
  "/portal/competitive": ["Intelligence", "Head-to-Head", "Simulator", "Battlecards", "Matrix"],
  "/portal/business-owner": ["Business Valuation", "Key Person", "Buy-Sell", "Succession", "Executive Benefits"],
  "/portal/ai-meeting-notes": ["Input Notes", "Summary", "Action Items", "Compliance", "Full Report"],
  "/portal/advisor-income-calculator": ["Ranking", "Accumulation", "Chart", "Deferral", "Breakdown"],
  "/portal/axonic-sp500": ["Strategies", "Historical", "Projection", "How It Works"],
  "/portal/athene-pe-plus15": ["Spreadsheet", "Indices", "Allocation", "Growth"],
  "/portal/annuity-memory": ["State Lookup", "All 50 States", "Guaranty Limits", "Product Database"],
  "/portal/annuity-accumulation-db": ["Rankings", "Growth Chart", "Product Details", "All 50 States"],
  "/portal/income-gap": ["Income Sources", "Year-by-Year", "Settings", "IUL Solution"],
  "/portal/goals-planning": ["All Goals", "Priority View", "Timeline", "Funding Sources"],
  "/portal/medicare-irmaa": ["IRMAA Brackets", "Client Inputs", "Roth Impact", "IUL Advantage"],
  "/portal/withdrawal-sequencing": ["Withdrawal Sequence", "Account Setup", "Balance Projection", "Tax Analysis"],
  "/portal/retirement-income": ["Projection Chart", "Three Scenarios", "Income Detail", "Tax Advantage"],
  "/portal/policy-loans": ["Overview", "Projections", "Radar Analysis", "Tax Impact"],
  "/portal/real-estate-mogul": ["Portfolio", "Projection", "IUL Integration", "Total Wealth"],
  "/portal/reverse-heloc": ["Calculator", "Charts", "Projection", "Summary"],
  "/portal/referral-tracker": ["Pipeline", "All Referrals", "Sources", "Leaderboard"],
  "/portal/fia-top10": ["Side-by-Side", "Rankings", "Product Details", "Growth Projection"],
  "/portal/index-strategies": ["Side-by-Side", "Visual Chart", "Growth Paths", "Trade-Off Analysis"],
  "/portal/tax-brackets": ["Bracket Visualization", "Client Inputs", "Roth Conversion", "IUL Tax Advantage"],
  "/portal/tax-advantaged": ["Growth Chart", "After-Tax Impact", "Feature Comparison", "Tax Education"],
  "/portal/collaborative": ["Task Board", "Planning Notes", "Team View", "Timeline"],
  "/portal/client-portal": ["Plan Progress", "Documents", "Plan Overview", "Messages"],
  "/portal/report-builder": ["Report Content", "Client Info", "Branding", "Live Preview"],
  "/portal/time-machine-calculator": ["AG 49 Compounding", "Dual Illustration", "Benchmark Matrix", "Generational Transfer", "Loan Arbitrage", "The Formula"],
  "/portal/time-machine-method": ["Setup", "Comparison", "Year-by-Year", "Loan Arbitrage", "Disclaimer"],
  "/portal/time-machine-ag49": ["Setup", "Projections", "Benchmarks", "Generations", "Formula"],
  "/portal/index-backtester": ["Allocate", "Results", "Rolling"],
  "/portal/sales-story": ["Client Setup", "Choose Story", "Present"],
  "/portal/seminar-generator": ["Setup", "Slide Deck", "Full Preview"],
  "/portal/multi-scenario": ["Configure", "Compare All", "Detailed Breakdown"],
  "/portal/predictive": ["Predictions", "Client Profile", "Action Items"],
  "/portal/compliance-reports": ["Checklist", "AG 49 Rate Validation", "Report Settings", "Full Report"],
  "/portal/income-timeline": ["Income Sources", "Year-by-Year", "Settings", "IUL Solution"],
  "/portal/roth-conversion": ["Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Solar"],
  "/portal/strategy": ["Strategy Lab", "Compare", "Scenario Builder", "Saved Scenarios"],
  "/portal/premium-financing": ["Overview", "Calculator", "Comparison", "Risk Analysis"],
  "/portal/lifetime-income": ["Income Projection", "Comparison", "Withdrawal", "Tax Impact"],
  "/portal/house-recycling": ["Overview", "Calculator", "Comparison", "Timeline"],
};

function SubTabDisclaimer() {
  const [dismissed, setDismissed] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const stored = sessionStorage.getItem("rc-subtab-disclaimer-dismissed");
    if (stored === "true") setDismissed(true);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem("rc-subtab-disclaimer-dismissed", "true");
  };

  // Find the sub-tabs for the current page
  const currentPageTabs = useMemo(() => {
    return PAGE_SUBTABS[location] || null;
  }, [location]);

  if (dismissed) return null;

  return (
    <div className="mx-4 mt-3 mb-1 relative overflow-hidden rounded-xl border-2 border-amber-400/60 shadow-lg shadow-amber-500/10">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15" />
      <div className="absolute inset-0 bg-[#0a1628]/80" />

      <div className="relative px-5 py-4 flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-400/40 flex items-center justify-center">
            <Lightbulb size={20} className="text-amber-400" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Important — Read Before Proceeding</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-[10px] font-bold text-amber-300 uppercase tracking-wider">Pro Tip</span>
          </div>
          <p className="text-sm text-white/90 leading-relaxed font-medium">
            Every tab in the left sidebar contains <span className="text-amber-300 font-bold">4–9 additional sub-tabs</span> with deeper customization options.
            Your selected tool may be incomplete without exploring all of its built-in features.
          </p>
          <p className="text-xs text-amber-200/60 mt-1.5 leading-relaxed">
            Look for the <span className="text-cyan-300 font-semibold">teal-bordered tab buttons</span> within each page — the <span className="text-amber-300 font-semibold">amber-highlighted tab</span> is your active view. Click the others to unlock targeted projections, comparison views, and advanced modeling.
          </p>

          {/* Dynamic sub-tab listing for current page */}
          {currentPageTabs && (
            <div className="mt-3 p-3 rounded-lg border border-amber-400/40 bg-amber-500/5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  This Page Has {currentPageTabs.length} Sub-Tabs
                </span>
                <span className="text-[10px] text-amber-300/60">— explore each one below</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {currentPageTabs.map((tab) => (
                  <span
                    key={tab}
                    className="inline-flex items-center px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-400/30 text-xs font-semibold text-amber-300"
                  >
                    {tab}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 mt-0.5 p-1.5 rounded-md hover:bg-white/10 transition-colors text-amber-300/60 hover:text-amber-300"
          aria-label="Dismiss disclaimer"
        >
          <X size={16} />
        </button>
      </div>

      {/* Bottom accent bar */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
    </div>
  );
}

/** One line on every portal page when the calculators are running on the user's own assessment. */
function AssessmentPrefillNotice() {
  const { source } = useClientData();
  if (source !== "assessment") return null;
  return <div className="mb-3"><FactFinderBadge /></div>;
}

export function AppShell({ children, title: _title, subtitle: _subtitle }: { children: React.ReactNode; title?: string; subtitle?: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();

  return (
    <div className="rc-portal-theme min-h-screen relative">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="rc-main">
        {/* Top bar */}
        <header className="rc-topbar">
          <button
            className="md:hidden rc-btn rc-btn-ghost p-2"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <GlobalSearch />
          <div className="flex-1" />
          <AudioToggle />
          <ThemeToggle />
          <NotificationBell />
          <Link href="/" className="text-xs text-[#7a95b8] hover:text-white transition-colors">
            <Home size={14} className="inline mr-1" />
            Home
          </Link>
        </header>
        <Breadcrumbs />

        {/* Sub-tab awareness disclaimer */}
        <SubTabDisclaimer />

        {/* Page content — ambient breathing micro-shift */}
        <main id="main-content" className="rc-fade-in page-enter rc-breathe-ambient">
          <JourneyProgressBar />
          <AssessmentPrefillNotice />
          {children}
        </main>
      </div>

      <CommandPalette />
      <QuickActionsFAB />
      <SessionTimeout />
      <TrialCountdownWidget />

      {/* Mobile bottom tabs */}
      <nav className="rc-bottom-tabs">
        {BOTTOM_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = location === tab.path || (tab.path !== "/portal" && location.startsWith(tab.path));
          return (
            <Link key={tab.path} href={tab.path} className={`rc-tab-item ${isActive ? "active" : ""}`}>
              <Icon size={20} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
