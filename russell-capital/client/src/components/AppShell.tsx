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
  Presentation, FileSpreadsheet, Umbrella, BarChart, LineChart, Compass, Gem,
  Ghost, Radio, Dna, Archive, GitBranch, Waves, Megaphone, Image,
  Sword, Volume2, Video, User, Stethoscope, Network, Map as MapIcon
} from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useEntrainment } from "@/contexts/EntrainmentEngine";
import { useDisclaimer } from "@/contexts/DisclaimerContext";
import { Link, useLocation, useSearch } from "wouter";
import { isPrimaryNav, ROUTE_LAYER } from "@/navConfig";
import { type NavNode, MEDICAL_TREE, collectPaths, flattenNavTree } from "@/navTree";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { TAB_SCORES } from "@shared/tabScores";
import { useClientData } from "@/contexts/ClientDataContext";
import PrintBrandHeader from "@/components/PrintBrandHeader";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NeuralMeshInterceptor } from "@/components/NeuralMeshInterceptor";
import { ToolUsageTracker } from "@/components/ToolUsageTracker";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CommandPalette } from "@/components/CommandPalette";
import { QuickActionsFAB } from "@/components/QuickActionsFAB";
import { SessionTimeout } from "@/components/SessionTimeout";
import TrialCountdownWidget from "@/components/TrialCountdownWidget";
import { IntelligenceCommandPanel } from "@/components/IntelligenceCommandPanel";
import UniversalCalculatorEnhancer from "./UniversalCalculatorEnhancer";
import CalcPageAutoWirer from "./CalcPageAutoWirer";
import ClientPortalEnhancer from "./ClientPortalEnhancer";
import AdvisorProductivityTracker from "./AdvisorProductivityTracker";
import ComplianceAutoLogger from "./ComplianceAutoLogger";
import CrossCalcRecommendationEngine from "./CrossCalcRecommendationEngine";
import FinancialHealthPulse from "./FinancialHealthPulse";
import { OrganismStatusBar } from "@/components/OrganismStatusBar";
import { Sun, Moon } from "lucide-react";
import { MusicPlayerMiniBar } from "@/components/MusicPlayerMiniBar";

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
  // 1. HOME
  {
    label: "Home",
    icon: Home,
    color: "green",
    defaultOpen: true,
    subgroups: [
      {
        subLabel: "Dashboards",
        color: "green",
        items: [
          { path: "/portal", label: "Your Wealth Story", icon: Waves, color: "green" },
          { path: "/portal/dashboard", label: "Practice Dashboard", icon: LayoutDashboard, color: "green" },
          { path: "/portal/client-portfolio", label: "Your Portfolio", icon: Briefcase, color: "green" },
          { path: "/portal/nerve-center", label: "Nerve Center", icon: Activity, color: "green" },
          { path: "/portal/command-center", label: "Command Center", icon: Activity, color: "green" },
          { path: "/portal/tool-explorer", label: "Tool Explorer (593)", icon: Compass, color: "green" },
          { path: "/portal/calculator-hub", label: "Calculator Hub", icon: Calculator, color: "green" },
        ],
      },
      {
        subLabel: "Daily Views",
        color: "gold",
        items: [
          { path: "/portal/daily-briefing", label: "Daily Briefing", icon: Sun, color: "gold" },
          { path: "/portal/morning-ritual", label: "Pre-Rounds Briefing", icon: Flame, color: "gold" },
          { path: "/portal/toilet", label: "Between-Patients Glance", icon: Zap, color: "gold" },
          { path: "/portal/daily-discovery", label: "Daily Discovery", icon: Compass, color: "gold" },
          { path: "/portal/infinite-scroll", label: "Financial Grand Rounds", icon: Waves, color: "gold" },
        ],
      },
      {
        subLabel: "Health Scores",
        color: "emerald",
        items: [
          { path: "/portal/advisory-summary", label: "Financial Check-Up", icon: BarChart3, color: "emerald" },
          { path: "/portal/client-health", label: "Physician Financial Vitals", icon: Activity, color: "emerald" },
          { path: "/portal/physician-vitals", label: "Financial Vitals", icon: Activity, color: "emerald" },
          { path: "/portal/financial-health-score", label: "Financial Health Score", icon: Gauge, color: "emerald" },
          { path: "/portal/financial-freedom-number", label: "Financial Freedom #", icon: Star, color: "emerald" },
          { path: "/portal/russell-number", label: "Your Wealth Vital Sign", icon: Gauge, color: "emerald" },
          { path: "/portal/net-worth-tracker", label: "Net Worth Tracker", icon: TrendingUp, color: "emerald" },
          { path: "/portal/onboarding-quiz", label: "Financial Physical Quiz", icon: Stethoscope, color: "emerald" },
          { path: "/portal/annual-financial-physical", label: "Annual Financial Physical", icon: Heart, color: "emerald" },
        ],
      },
    ],
  },
  // 2. CLIENTS
  {
    label: "Clients",
    icon: Users,
    color: "blue",
    subgroups: [
      {
        subLabel: "Client Management",
        color: "blue",
        items: [
          { path: "/portal/clients", label: "My Patients", icon: Users, color: "blue" },
          { path: "/portal/client-onboarding", label: "New Patient Onboarding", icon: Sparkles, color: "blue" },
          { path: "/portal/client-intake", label: "Patient Intake", icon: MessageCircle, color: "blue" },
          { path: "/portal/client-intake-recommender", label: "New Patient Financial Intake", icon: User, color: "blue" },
          { path: "/portal/client-snapshot", label: "Patient Snapshot", icon: PieChart, color: "blue" },
          { path: "/portal/ai-meeting-notes", label: "Chart Notes (Financial)", icon: Brain, color: "blue" },
          { path: "/portal/client-retention", label: "Client Retention Predictor", icon: UserCheck, color: "blue" },
          { path: "/portal/prospect-qualification", label: "Prospect Qualification", icon: Target, color: "blue" },
          { path: "/portal/onboarding-workflow", label: "Client Onboarding Workflow", icon: UserPlus, color: "blue" },
          { path: "/portal/report-builder", label: "Client Report Builder", icon: FileText, color: "blue" },
        ],
      },
      {
        subLabel: "Practice & Business",
        color: "indigo",
        items: [
          { path: "/portal/business-owner", label: "Business Owner", icon: Briefcase, color: "indigo" },
          { path: "/portal/business-valuation", label: "Business Valuation", icon: Briefcase, color: "indigo" },
          { path: "/portal/cash-balance-plan", label: "Cash Balance Plan", icon: PiggyBank, color: "indigo" },
          { path: "/portal/entity-comparison", label: "Entity Comparison", icon: Scale, color: "indigo" },
          { path: "/portal/qbi-calculator", label: "QBI Calculator", icon: Receipt, color: "indigo" },
          { path: "/portal/captive-insurance", label: "Captive Insurance", icon: Shield, color: "indigo" },
          { path: "/portal/succession-plan", label: "Succession Plan", icon: Users, color: "indigo" },
          { path: "/portal/esop-calculator", label: "ESOP Calculator", icon: Award, color: "indigo" },
          { path: "/portal/severance-calculator", label: "Severance Calculator", icon: DollarSign, color: "indigo" },
          { path: "/portal/overhead-expense", label: "Overhead Expense", icon: FileSpreadsheet, color: "indigo" },
          { path: "/portal/succession-valuation", label: "Succession Valuation", icon: Briefcase, color: "indigo" },
          { path: "/portal/commission-optimizer", label: "Commission Optimizer", icon: DollarSign, color: "indigo" },
        ],
      },
      {
        subLabel: "Physician Career",
        color: "rose",
        items: [
          { path: "/portal/peer-benchmarking", label: "Peer Benchmarking", icon: BarChart3, color: "rose" },
          { path: "/portal/physician-forum", label: "Physician Lounge", icon: Users, color: "rose" },
          { path: "/portal/residency-to-attending", label: "Residency Pipeline", icon: TrendingUp, color: "rose" },
          { path: "/portal/physician-contract", label: "Contract Analyzer", icon: FileText, color: "rose" },
          { path: "/portal/pslf-calculator", label: "PSLF Calculator", icon: GraduationCap, color: "rose" },
          { path: "/portal/idr-comparison", label: "IDR Plan Comparison", icon: Scale, color: "rose" },
          { path: "/portal/own-occ-disability", label: "Own-Occ Disability", icon: ShieldCheck, color: "rose" },
          { path: "/portal/peer-intel", label: "Peer Benchmarking Intel", icon: BarChart3, color: "rose" },
          { path: "/portal/ce-credits", label: "CE Credit Tracker", icon: Award, color: "rose" },
        ],
      },
    ],
  },
  // 3. TAX
  {
    label: "Tax",
    icon: Receipt,
    color: "orange",
    subgroups: [
      {
        subLabel: "Tax Calculators",
        color: "orange",
        items: [
          { path: "/portal/tax-waterfall", label: "Tax Waterfall", icon: TrendingDown, color: "orange" },
          { path: "/portal/marginal-tax-rate", label: "Marginal Tax Rate", icon: BarChart3, color: "orange" },
          { path: "/portal/capital-gains-tax", label: "Capital Gains Tax", icon: TrendingDown, color: "orange" },
          { path: "/portal/amt-calculator", label: "AMT Calculator", icon: Scale, color: "orange" },
          { path: "/portal/self-employment-tax", label: "Self-Employment Tax", icon: Briefcase, color: "orange" },
          { path: "/portal/tax-equivalent-yield", label: "Tax-Equivalent Yield", icon: PieChart, color: "orange" },
          { path: "/portal/w4-optimizer", label: "W-4 Optimizer", icon: FileText, color: "orange" },
          { path: "/portal/crypto-tax", label: "Crypto Tax", icon: Coins, color: "orange" },
          { path: "/portal/rsu-tax", label: "RSU Tax", icon: DollarSign, color: "orange" },
          { path: "/portal/rmd-calculator", label: "RMD Calculator", icon: Receipt, color: "orange" },
          { path: "/portal/hsa-triple-tax", label: "HSA Triple Tax", icon: Shield, color: "orange" },
        ],
      },
      {
        subLabel: "Tax Strategies",
        color: "rose",
        items: [
          { path: "/portal/tax-advantaged-growth", label: "Tax-Advantaged Growth", icon: Scale, color: "rose" },
          { path: "/portal/hot-income", label: "Hot Income (Oil & Gas)", icon: Flame, color: "rose" },
          { path: "/portal/deduction-optimizer", label: "Deduction Optimizer", icon: Target, color: "rose" },
          { path: "/portal/gain-loss-harvesting", label: "Gain/Loss Harvesting", icon: Scissors, color: "rose" },
          { path: "/portal/tax-loss-harvest-calc", label: "Tax-Loss Harvesting", icon: Scissors, color: "rose" },
          { path: "/portal/state-tax-arbitrage", label: "State Tax Arbitrage", icon: Compass, color: "rose" },
          { path: "/portal/income-shifting", label: "Income Shifting", icon: Users, color: "rose" },
          { path: "/portal/charitable-stock-donation", label: "Charitable Stock", icon: Gift, color: "rose" },
          { path: "/portal/installment-sale", label: "Installment Sale", icon: FileText, color: "rose" },
          { path: "/portal/like-kind-exchange", label: "Like-Kind Exchange", icon: ArrowRightLeft, color: "rose" },
          { path: "/portal/str-strategy", label: "Short-Term Rental Tax Rx", icon: Building2, color: "rose" },
          { path: "/portal/tax-code-simulator", label: "Tax Code Change Simulator", icon: Zap, color: "rose" },
          { path: "/portal/state-tax-migration", label: "State Tax Migration Planner", icon: Compass, color: "rose" },
          { path: "/portal/tax-optimization-command", label: "Tax Optimization Command", icon: Calculator, color: "rose" },
        ],
      },
      {
        subLabel: "Roth & Conversions",
        color: "purple",
        items: [
          { path: "/portal/mega-backdoor-roth", label: "Mega Backdoor Roth", icon: Zap, color: "purple" },
          { path: "/portal/backdoor-roth", label: "Backdoor Roth", icon: Lock, color: "purple" },
          { path: "/portal/roth-vs-traditional", label: "Roth vs Traditional", icon: Scale, color: "purple" },
          { path: "/portal/roth-conversion", label: "Roth Strategies (6)", icon: Landmark, color: "purple" },
          { path: "/portal/iul-vs-roth", label: "IUL vs Roth", icon: Scale, color: "purple" },
          { path: "/portal/nua-calculator", label: "NUA Calculator", icon: DollarSign, color: "purple" },
        ],
      },
      {
        subLabel: "Physician Tax Playbooks",
        color: "emerald",
        items: [
          { path: "/portal/secret-secrets", label: "100 Physician Tax Strategies", icon: Lock, color: "emerald" },
          { path: "/portal/tax-combos", label: "100 Tax-Free Rx Combos", icon: Gem, color: "emerald" },
          { path: "/portal/combo-recommender", label: "AI Strategy Prescriber", icon: Brain, color: "emerald" },
          { path: "/portal/physicians-edge", label: "Physician's Edge", icon: HeartPulse, color: "emerald" },
        ],
      },
    ],
  },
  // 4. RETIREMENT
  {
    label: "Retirement",
    icon: PiggyBank,
    color: "amber",
    subgroups: [
      {
        subLabel: "Income Planning",
        color: "amber",
        items: [
          { path: "/portal/ecological-drivers", label: "What Drives Your Retirement", icon: Leaf, color: "amber" },
          { path: "/portal/social-security", label: "Social Security", icon: Shield, color: "amber" },
          { path: "/portal/income-gap", label: "Income Gap Analyzer", icon: PieChart, color: "amber" },
          { path: "/portal/lifetime-income", label: "Lifetime Income", icon: Shield, color: "amber" },
          { path: "/portal/income-timeline", label: "Income Timeline", icon: Clock, color: "amber" },
          { path: "/portal/advisor-income-calculator", label: "Income Calculator", icon: Calculator, color: "amber" },
          { path: "/portal/spousal-ss-coordination", label: "Spousal SS Coordination", icon: Users, color: "amber" },
          { path: "/portal/ss-bridge", label: "Social Security Bridge", icon: Landmark, color: "amber" },
          { path: "/portal/pension-vs-lump-sum", label: "Pension vs Lump Sum", icon: Scale, color: "amber" },
          { path: "/portal/pension-max", label: "Pension Max", icon: TrendingUp, color: "amber" },
          { path: "/portal/deferred-compensation", label: "Deferred Compensation", icon: Clock, color: "amber" },
        ],
      },
      {
        subLabel: "Withdrawal & Readiness",
        color: "gold",
        items: [
          { path: "/portal/withdrawal-sequencing", label: "Withdrawal Sequencing", icon: Layers, color: "gold" },
          { path: "/portal/safe-withdrawal-rate", label: "Safe Withdrawal Rate", icon: Shield, color: "gold" },
          { path: "/portal/fire-calculator", label: "FIRE Calculator", icon: Flame, color: "gold" },
          { path: "/portal/retirement-budget", label: "Retirement Budget", icon: Wallet, color: "gold" },
          { path: "/portal/inflation-adjusted-income", label: "Inflation-Adjusted Income", icon: TrendingUp, color: "gold" },
          { path: "/portal/retirement-gap", label: "Retirement Gap (Inflation)", icon: TrendingDown, color: "gold" },
          { path: "/portal/retirement-readiness", label: "Retirement Readiness", icon: Target, color: "gold" },
          { path: "/portal/retirement-advantage", label: "Retirement Advantage", icon: Crown, color: "gold" },
          { path: "/portal/qlac-calculator", label: "QLAC Calculator", icon: Lock, color: "gold" },
          { path: "/portal/retirement-healthcare", label: "Retirement Healthcare", icon: HeartPulse, color: "gold" },
          { path: "/portal/medicare-irmaa-calc", label: "Medicare IRMAA", icon: Shield, color: "gold" },
          { path: "/portal/dca-vs-lump-sum", label: "DCA vs Lump Sum", icon: BarChart3, color: "gold" },
        ],
      },
    ],
  },
  // 5. INSURANCE
  {
    label: "Insurance",
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
          { path: "/portal/time-machine-calculator", label: "Time Machine Calculator", icon: Clock, color: "cyan" },
          { path: "/portal/time-machine-ag49", label: "AG 49 Compounding", icon: TrendingUp, color: "cyan" },
          { path: "/portal/time-machine-method", label: "Dual Illustration", icon: Zap, color: "cyan" },
          { path: "/portal/multi-carrier-iul", label: "Multi-Carrier IUL Optimizer", icon: Layers, color: "cyan" },
          { path: "/portal/premium-financing-arbitrage", label: "Premium Financing Arbitrage", icon: TrendingUp, color: "cyan" },
          { path: "/portal/captive-iul", label: "Captive Insurance + IUL", icon: Building2, color: "cyan" },
          { path: "/portal/term-vs-whole-vs-iul", label: "Term vs Whole vs IUL", icon: Scale, color: "cyan" },
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
          { path: "/portal/annuity-comparison", label: "Annuity Comparison", icon: BarChart3, color: "emerald" },
          { path: "/portal/annuity-fee-detector", label: "Annuity Hidden Fee Detector", icon: Search, color: "emerald" },
          { path: "/portal/carrier-strength", label: "Carrier Strength Monitor", icon: Shield, color: "emerald" },
        ],
      },
      {
        subLabel: "Coverage & Protection",
        color: "blue",
        items: [
          { path: "/portal/life-insurance-needs", label: "Life Insurance Needs", icon: Shield, color: "blue" },
          { path: "/portal/disability-insurance-needs", label: "Disability Insurance", icon: ShieldCheck, color: "blue" },
          { path: "/portal/ltc-cost", label: "Long-Term Care Cost", icon: Heart, color: "blue" },
          { path: "/portal/umbrella-insurance", label: "Umbrella Insurance", icon: Umbrella, color: "blue" },
          { path: "/portal/key-person-insurance", label: "Key Person Insurance", icon: UserCheck, color: "blue" },
          { path: "/portal/buy-sell-funding", label: "Buy-Sell Funding", icon: ArrowRightLeft, color: "blue" },
          { path: "/portal/aca-subsidy", label: "ACA Subsidy", icon: HeartPulse, color: "blue" },
          { path: "/portal/ai-policy-review", label: "Policy Gap Analysis", icon: Search, color: "blue" },
          { path: "/portal/policy-replacement", label: "Policy Replacement Analyzer", icon: ArrowRightLeft, color: "blue" },
          { path: "/portal/living-benefits", label: "Living Benefits Probability", icon: HeartPulse, color: "blue" },
          { path: "/portal/insurance-coverage-command", label: "Insurance Coverage Command", icon: Shield, color: "blue" },
          { path: "/portal/disability-gap", label: "Disability Gap Analysis", icon: ShieldAlert, color: "blue" },
        ],
      },
    ],
  },
  // 6. WEALTH
  {
    label: "Wealth",
    icon: TrendingUp,
    color: "indigo",
    subgroups: [
      {
        subLabel: "Investments",
        color: "indigo",
        items: [
          { path: "/portal/asset-allocation", label: "Asset Allocation", icon: PieChart, color: "indigo" },
          { path: "/portal/pe-irr-calculator", label: "Private Equity IRR", icon: TrendingUp, color: "indigo" },
          { path: "/portal/bond-ladder", label: "Bond Ladder", icon: Layers, color: "indigo" },
          { path: "/portal/muni-bond-ladder", label: "Muni Bond Ladder", icon: Landmark, color: "indigo" },
          { path: "/portal/drip-growth", label: "DRIP Growth", icon: Recycle, color: "indigo" },
          { path: "/portal/options-profit-loss", label: "Options Profit/Loss", icon: BarChart, color: "indigo" },
          { path: "/portal/portfolio-risk-return", label: "Portfolio Risk/Return", icon: Activity, color: "indigo" },
          { path: "/portal/sector-rotation", label: "Sector Rotation", icon: Compass, color: "indigo" },
          { path: "/portal/fee-impact", label: "Fee Impact", icon: DollarSign, color: "indigo" },
          { path: "/portal/multi-currency", label: "Multi-Currency Wealth", icon: Coins, color: "indigo" },
        ],
      },
      {
        subLabel: "Budgeting & Savings",
        color: "green",
        items: [
          { path: "/portal/compound-interest", label: "Compound Interest", icon: Layers, color: "green" },
          { path: "/portal/millionaire-calculator", label: "Millionaire Calculator", icon: Star, color: "green" },
          { path: "/portal/emergency-fund-vs-iul", label: "Emergency Fund vs IUL", icon: Shield, color: "green" },
          { path: "/portal/529-vs-iul", label: "529 vs IUL", icon: GraduationCap, color: "green" },
          { path: "/portal/debt-payoff-optimizer", label: "Debt Payoff Optimizer", icon: Target, color: "green" },
          { path: "/portal/budget-50-30-20", label: "50/30/20 Budget", icon: PieChart, color: "green" },
          { path: "/portal/zero-based-budget", label: "Zero-Based Budget", icon: Target, color: "green" },
          { path: "/portal/spend-vs-invest", label: "Spend vs Invest", icon: Scale, color: "green" },
          { path: "/portal/lease-vs-buy", label: "Lease vs Buy", icon: ArrowRightLeft, color: "green" },
          { path: "/portal/student-loan-vs-invest", label: "Student Loan vs Invest", icon: GraduationCap, color: "green" },
          { path: "/portal/credit-card-payoff", label: "Credit Card Payoff", icon: Receipt, color: "green" },
          { path: "/portal/savings-rate-impact", label: "Savings Rate Impact", icon: TrendingUp, color: "green" },
          { path: "/portal/cost-of-waiting", label: "Cost of Waiting", icon: Clock, color: "green" },
          { path: "/portal/lifestyle-inflation", label: "Lifestyle Inflation", icon: TrendingUp, color: "green" },
        ],
      },
      {
        subLabel: "Real Estate",
        color: "teal",
        items: [
          { path: "/portal/mortgage-killer", label: "Mortgage Killer", icon: Home, color: "teal" },
          { path: "/portal/mortgage-killer-v3", label: "Mortgage Elimination Rx", icon: Home, color: "teal" },
          { path: "/portal/house-recycling", label: "House Recycling", icon: Recycle, color: "teal" },
          { path: "/portal/household-wealth", label: "Household Wealth", icon: Home, color: "teal" },
          { path: "/portal/real-estate-mogul", label: "Real Estate Mogul", icon: Building2, color: "teal" },
          { path: "/portal/reverse-heloc", label: "Reverse HELOC", icon: Landmark, color: "teal" },
          { path: "/portal/rental-property-roi", label: "Rental Property ROI", icon: Building2, color: "teal" },
          { path: "/portal/1031-exchange", label: "1031 Exchange", icon: ArrowRightLeft, color: "teal" },
          { path: "/portal/opportunity-zone", label: "Opportunity Zone", icon: Target, color: "teal" },
          { path: "/portal/home-affordability", label: "Home Affordability", icon: Home, color: "teal" },
          { path: "/portal/refinance-break-even", label: "Refinance Break-Even", icon: Scale, color: "teal" },
          { path: "/portal/cost-of-living", label: "Cost of Living", icon: DollarSign, color: "teal" },
          { path: "/portal/reverse-mortgage", label: "Reverse Mortgage", icon: Landmark, color: "teal" },
          { path: "/portal/depreciation-tax-shield", label: "Depreciation Tax Shield", icon: Shield, color: "teal" },
          { path: "/portal/property-tax-appeal", label: "Property Tax Appeal", icon: FileText, color: "teal" },
          { path: "/portal/vacation-rental", label: "Vacation Rental", icon: Home, color: "teal" },
        ],
      },
      {
        subLabel: "Estate & Trusts",
        color: "purple",
        items: [
          { path: "/portal/estate-tax", label: "Estate Tax", icon: Landmark, color: "purple" },
          { path: "/portal/estate-flow", label: "Estate Flow Chart", icon: Landmark, color: "purple" },
          { path: "/portal/beneficiary-optimization", label: "Beneficiary Optimizer", icon: Users, color: "purple" },
          { path: "/portal/crt-calculator", label: "CRT Calculator", icon: Landmark, color: "purple" },
          { path: "/portal/grat-calculator", label: "GRAT Calculator", icon: Landmark, color: "purple" },
          { path: "/portal/ilit-calculator", label: "ILIT Calculator", icon: Shield, color: "purple" },
          { path: "/portal/qprt-calculator", label: "QPRT Calculator", icon: Home, color: "purple" },
          { path: "/portal/gstt-calculator", label: "GSTT Calculator", icon: Crown, color: "purple" },
          { path: "/portal/daf-vs-direct-giving", label: "DAF vs Direct Giving", icon: Gift, color: "purple" },
          { path: "/portal/estate-liquidity", label: "Estate Liquidity", icon: DollarSign, color: "purple" },
          { path: "/portal/trusts", label: "Trust Structures", icon: Landmark, color: "purple" },
          { path: "/portal/will-writer", label: "Will Writer", icon: ScrollText, color: "purple" },
          { path: "/portal/special-needs-trust", label: "Special Needs Trust", icon: Heart, color: "purple" },
          { path: "/portal/crt-wealth-replacement", label: "CRT Wealth Replacement", icon: Gift, color: "purple" },
          { path: "/portal/generational-wealth", label: "Generational Wealth Sim", icon: Crown, color: "purple" },
          { path: "/portal/estate-wealth-transfer", label: "Estate Wealth Transfer", icon: Building2, color: "purple" },
          { path: "/portal/family-tree", label: "Family Tree Financial Map", icon: GitBranch, color: "purple" },
          { path: "/portal/generational-wealth-sim", label: "Generational Wealth Sim Pro", icon: Crown, color: "purple" },
        ],
      },
      {
        subLabel: "Life Events",
        color: "red",
        items: [
          { path: "/portal/divorce-calculator", label: "Divorce Financial Impact", icon: Scissors, color: "red" },
          { path: "/portal/divorce-settlement-enhanced", label: "Divorce Settlement", icon: Scissors, color: "red" },
          { path: "/portal/divorce-impact", label: "Divorce Financial Impact Pro", icon: Scissors, color: "red" },
          { path: "/portal/alimony-tax-impact", label: "Alimony Tax Impact", icon: Scale, color: "red" },
          { path: "/portal/windfall-management", label: "Windfall Management", icon: Sparkles, color: "red" },
          { path: "/portal/sabbatical-planner", label: "Sabbatical Planner", icon: Calendar, color: "red" },
        ],
      },
    ],
  },
  // 7. STRATEGY
  {
    label: "Strategy",
    icon: Brain,
    color: "purple",
    subgroups: [
      {
        subLabel: "Compare & Analyze",
        color: "purple",
        items: [
          { path: "/portal/strategy", label: "Strategy Lab", icon: Brain, color: "purple" },
          { path: "/portal/strategy-compare", label: "Strategy Compare", icon: BarChart3, color: "purple" },
          { path: "/portal/scenarios", label: "Scenario Builder", icon: SlidersHorizontal, color: "purple" },
          { path: "/portal/scenario-side-by-side", label: "Side-by-Side Compare", icon: Scale, color: "purple" },
          { path: "/portal/comparison", label: "5-Slot Comparison", icon: Layers, color: "purple" },
          { path: "/portal/risk-tolerance", label: "Risk Tolerance", icon: Activity, color: "purple" },
          { path: "/portal/market-stress-test", label: "Market Stress Test", icon: Activity, color: "purple" },
          { path: "/portal/behavioral-bias", label: "Behavioral Bias Detector", icon: Brain, color: "purple" },
        ],
      },
      {
        subLabel: "AI Assistants",
        color: "cyan",
        items: [
          { path: "/portal/ai-assist", label: "Strategy Assist", icon: Zap, color: "cyan" },
          { path: "/portal/ai-recommender", label: "Strategy Recommender", icon: Brain, color: "cyan" },
          { path: "/portal/data-query", label: "Ask Your Data", icon: MessageSquare, color: "cyan" },
          { path: "/portal/predictive-analytics", label: "Predictive Analytics", icon: TrendingUp, color: "cyan" },
          { path: "/portal/ai-brain-hub", label: "AI Brain Hub", icon: Brain, color: "cyan" },
          { path: "/portal/behavioral-planning", label: "Behavioral Financial AI", icon: Brain, color: "cyan" },
          { path: "/portal/cross-feature-intelligence", label: "Cross-Feature Intelligence", icon: Network, color: "cyan" },
          { path: "/portal/concierge", label: "AI Concierge", icon: Brain, color: "cyan" },
          { path: "/portal/ai-strategy-lab", label: "AI Strategy Lab Pro", icon: Brain, color: "cyan" },
          { path: "/portal/client-retention-ai", label: "Client Retention AI", icon: Heart, color: "cyan" },
          { path: "/portal/stale-digest", label: "Stale Digest", icon: AlertTriangle, color: "cyan" },
        ],
      },
      {
        subLabel: "Presentations & Content",
        color: "rose",
        items: [
          { path: "/portal/sales-story", label: "Case Presentation Builder", icon: Sparkles, color: "rose" },
          { path: "/portal/lead-generator", label: "Patient Acquisition Engine", icon: Zap, color: "rose" },
          { path: "/portal/competitive", label: "Market Intelligence", icon: Swords, color: "rose" },
          { path: "/portal/presentation-builder", label: "Presentation Builder", icon: FileBarChart, color: "rose" },
          { path: "/portal/ai-slides", label: "AI Slide Generator", icon: Presentation, color: "rose" },
          { path: "/portal/my-slides", label: "My Slides Library", icon: Layers, color: "rose" },
          { path: "/portal/document-templates", label: "Document Templates", icon: ScrollText, color: "rose" },
          { path: "/portal/video-proposals", label: "Video Proposals (AI)", icon: Video, color: "rose" },
          { path: "/portal/video-library", label: "Video Library", icon: Video, color: "rose" },
          { path: "/portal/presentation-vault", label: "Presentation Vault", icon: Presentation, color: "rose" },
        ],
      },
      {
        subLabel: "Innovation Lab",
        color: "gold",
        items: [
          { path: "/portal/innovation-dashboard", label: "Innovation Dashboard", icon: Dna, color: "gold" },
          { path: "/portal/engine-chaining", label: "Engine Chaining", icon: Link2, color: "gold" },
          { path: "/portal/engine-fusion", label: "Engine Fusion Lab", icon: Swords, color: "gold" },
          { path: "/portal/deal-closer", label: "AI Deal Closer", icon: Target, color: "gold" },
          { path: "/portal/wealth-odyssey", label: "Wealth Odyssey", icon: Compass, color: "gold" },
          { path: "/portal/persona-hub", label: "Persona Hub", icon: User, color: "gold" },
          { path: "/portal/elite-showdown", label: "Elite Showdown", icon: Swords, color: "gold" },
          { path: "/portal/financial-dna", label: "Financial DNA Profiler", icon: Dna, color: "gold" },
          { path: "/portal/holographic-mirage", label: "Holographic Mirage", icon: Layers, color: "gold" },
          { path: "/portal/mastery-nexus", label: "Mastery Nexus", icon: Network, color: "gold" },
          { path: "/portal/heartfire-legacy", label: "Heartfire Legacy", icon: Heart, color: "gold" },
          { path: "/portal/strategy-synergy", label: "Strategy Synergy Hub", icon: Users, color: "gold" },
          { path: "/portal/predictive-arena", label: "Predictive Insight Arena", icon: Eye, color: "gold" },
          { path: "/portal/moat-fortress", label: "Moat Fortress", icon: Shield, color: "gold" },
          { path: "/portal/cascading-optimizer", label: "Cascading Strategy Optimizer", icon: Layers, color: "gold" },
          { path: "/portal/longitudinal-risk", label: "Longitudinal Risk Optimizer", icon: TrendingUp, color: "gold" },
          { path: "/portal/wealth-warrior", label: "Wealth Warrior Challenges", icon: Trophy, color: "gold" },
          { path: "/portal/projection-theater", label: "Projection Theater", icon: Sparkles, color: "gold" },
          { path: "/portal/wealth-canvas", label: "Wealth Canvas", icon: Layers, color: "gold" },
          { path: "/portal/journey-navigator", label: "Journey Navigator", icon: MapIcon, color: "gold" },
          { path: "/portal/market-pulse", label: "Market Pulse", icon: Activity, color: "gold" },
          { path: "/portal/impact-scorecard", label: "Impact Scorecard", icon: Trophy, color: "gold" },
          { path: "/portal/legacy-vault", label: "Legacy Vault", icon: Lock, color: "gold" },
          { path: "/portal/wealth-timeline", label: "Wealth Timeline", icon: Target, color: "gold" },
          { path: "/portal/strategy-comparison", label: "Strategy Comparison", icon: ArrowRightLeft, color: "gold" },
        ],
      },
    ],
  },
  // 8. ENGAGE
  {
    label: "Engage",
    icon: Sparkles,
    color: "gold",
    subgroups: [
      {
        subLabel: "Social & Compete",
        color: "gold",
        items: [
          { path: "/portal/arena", label: "Physician Leaderboard", icon: Trophy, color: "gold" },
          { path: "/portal/social", label: "Physician Network", icon: Radio, color: "gold" },
          { path: "/portal/couples", label: "Couples Mode", icon: Heart, color: "gold" },
          { path: "/portal/my-world", label: "My World", icon: Sparkles, color: "gold" },
          { path: "/portal/rewards", label: "Rewards Vault", icon: Gift, color: "gold" },
          { path: "/portal/wealth-rituals", label: "Wealth Rituals", icon: Flame, color: "gold" },
        ],
      },
      {
        subLabel: "Simulations & Games",
        color: "amber",
        items: [
          { path: "/portal/war-room", label: "Strategy Operating Room", icon: Target, color: "amber" },
          { path: "/portal/war-story-generator", label: "Case Study Generator", icon: Sword, color: "amber" },
          { path: "/portal/time-machine", label: "Time Machine", icon: Clock, color: "amber" },
          { path: "/portal/time-lapse", label: "Time-Lapse", icon: BarChart, color: "amber" },
          { path: "/portal/black-mirror", label: "What-If Simulator", icon: Ghost, color: "amber" },
          { path: "/portal/story-generator", label: "Story Generator", icon: BookOpen, color: "amber" },
          { path: "/portal/pet", label: "Wellness Companion", icon: Heart, color: "amber" },
          { path: "/portal/endgame", label: "Your Legacy Plan", icon: Gem, color: "amber" },
          { path: "/portal/wrapped", label: "Your Year in Review", icon: Gift, color: "amber" },
          { path: "/portal/revenue-guarantee", label: "Revenue Guarantee", icon: Shield, color: "amber" },
        ],
      },
      {
        subLabel: "AI Companions",
        color: "purple",
        items: [
          { path: "/portal/co-pilot", label: "Live Financial Attending", icon: Brain, color: "purple" },
          { path: "/portal/avatar-twins", label: "Avatar Twins", icon: Image, color: "purple" },
        ],
      },
    ],
  },
  // 9. ADMIN
  {
    label: "Admin",
    icon: Settings,
    color: "slate",
    subgroups: [
      {
        subLabel: "Compliance",
        color: "red",
        items: [
          { path: "/portal/compliance", label: "Compliance Center", icon: FileCheck, color: "red" },
          { path: "/portal/compliance-monitoring", label: "Compliance Monitor", icon: Gauge, color: "red" },
          { path: "/portal/compliance-alerts", label: "Alerts", icon: ShieldAlert, color: "red" },
          { path: "/portal/compliance-audit-trail", label: "Audit Trail", icon: ScrollText, color: "red" },
          { path: "/portal/compliance-doc-gen", label: "Compliance Doc Generator", icon: FileCheck, color: "red" },
          { path: "/portal/risk-compliance", label: "Risk & Compliance Dashboard", icon: ShieldAlert, color: "red" },
          { path: "/portal/compliance-center", label: "Compliance Center Pro", icon: ShieldCheck, color: "red" },
          { path: "/portal/iul-compliance-engine", label: "IUL Compliance Engine", icon: ShieldCheck, color: "red" },
        ],
      },
      {
        subLabel: "Platform",
        color: "slate",
        items: [
          { path: "/portal/billing", label: "Billing & Plans", icon: CircleDollarSign, color: "slate" },
          { path: "/portal/agent-tutorial", label: "Platform Training", icon: GraduationCap, color: "slate" },
          { path: "/portal/integrations", label: "Integrations", icon: Link2, color: "slate" },
          { path: "/portal/bulk-generation", label: "Bulk Generation", icon: Lock, color: "slate" },
          { path: "/portal/leaderboard", label: "Leaderboard", icon: Trophy, color: "slate" },
          { path: "/portal/usage-analytics", label: "Usage Analytics", icon: BarChart3, color: "slate" },
          { path: "/portal/patent-showcase", label: "Proprietary Methods", icon: Shield, color: "slate" },
          { path: "/portal/fluency-academy", label: "Fluency Academy", icon: GraduationCap, color: "slate" },
          { path: "/portal/peer-network", label: "Peer Trust Network", icon: Users, color: "slate" },
          { path: "/portal/autopilot", label: "AutoPilot Workflow", icon: Zap, color: "slate" },
        ],
      },
      {
        subLabel: "System Health",
        color: "emerald",
        items: [
          { path: "/portal/pavlovian-engagement", label: "Pavlovian Engagement", icon: Trophy, color: "emerald" },
          { path: "/portal/entrainment-engine", label: "Entrainment Engine", icon: Activity, color: "emerald" },
          { path: "/portal/data-bus-dashboard", label: "Data Bus Dashboard", icon: BarChart3, color: "emerald" },
          { path: "/portal/living-risk-profile", label: "Living Risk Profile", icon: HeartPulse, color: "emerald" },
          { path: "/portal/organism-dashboard", label: "Organism Dashboard", icon: Activity, color: "emerald" },
          { path: "/portal/calc-interop-matrix", label: "Calc Interop Matrix", icon: BarChart3, color: "emerald" },
          { path: "/portal/alert-command-center", label: "Alert Command Center", icon: ShieldCheck, color: "emerald" },
          { path: "/portal/data-completeness", label: "Data Completeness", icon: Target, color: "emerald" },
          { path: "/portal/cross-calc-aggregation", label: "Cross-Calc Aggregation", icon: Layers, color: "emerald" },
          { path: "/portal/smart-routing", label: "Smart Routing", icon: ArrowRightLeft, color: "emerald" },
          { path: "/portal/mesh-health", label: "Mesh Health Monitor", icon: HeartPulse, color: "emerald" },
          { path: "/portal/data-flow-visualizer", label: "Data Flow Visualizer", icon: BarChart3, color: "emerald" },
          { path: "/portal/practice-sync", label: "Practice Wealth Sync", icon: Building2, color: "emerald" },
          { path: "/portal/admin/health", label: "Platform Health", icon: Activity, color: "emerald" },
        ],
      },
    ],
  },
];

const BOTTOM_TABS = [
  { path: "/portal", label: "Dashboard", icon: LayoutDashboard },
  { path: "/portal/clients", label: "Patients", icon: Users },
  { path: "/portal/nerve-center", label: "Lounge", icon: Sparkles },
  { path: "/portal/ai-assist", label: "AI CFO", icon: Zap },
  { path: "/portal/lab", label: "The Lab", icon: Trophy },
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
          {/* Flat items — primary-nav layer only (L2/L3/cut/merge hidden via navConfig) */}
          {section.items?.filter((item) => isPrimaryNav(item.path)).map((item) => {
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
  const visibleItems = subgroup.items.filter(item => isPrimaryNav(item.path));
  const hasActiveChild = visibleItems.some(item =>
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
        <span className="text-[9px] opacity-40 font-bold">{visibleItems.length}</span>
      </button>
      {isOpen && (
        <div className={`ml-1 border-l pl-1 ${subgroup.color ? COLOR_BORDER_MAP[subgroup.color] : 'border-[#12233e]/60'}`}>
          {visibleItems.map((item) => {
            const isActive = location === item.path || (item.path !== "/portal" && location.startsWith(item.path));
            return <NavItemLink key={item.path} item={item} isActive={isActive} onClose={onClose} isFavorited={favoritePaths?.has(item.path)} onToggleFavorite={onToggleFavorite} />;
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Recursive renderer for the medical-themed nav tree (up to 5 levels deep).
 * depth 0 = top-level tab, depth 1 = folder, depth 2+ = sub-folders, leaves = links.
 * Leaf nodes with a `path` link to the real page; placeholder leaves link to
 * /portal/nav-placeholder with the breadcrumb trail encoded in the query string.
 */
function NavTreeNode({
  node, depth, location, search, onClose, crumbs, favoritePaths, onToggleFavorite,
}: {
  node: NavNode;
  depth: number;
  location: string;
  search: string;
  onClose: () => void;
  crumbs: string[];
  favoritePaths?: Set<string>;
  onToggleFavorite?: (path: string, label: string) => void;
}) {
  const newCrumbs = [...crumbs, node.label];
  const allPaths = useMemo(() => collectPaths(node), [node]);
  // Placeholder pages all share /portal/nav-placeholder and are disambiguated by
  // the ?t= (label) and ?bc= (breadcrumb trail) query params. Detect active +
  // ancestor auto-expand for placeholder leaves using those params.
  const onPlaceholder = location === "/portal/nav-placeholder";
  const phParams = onPlaceholder ? new URLSearchParams(search) : null;
  const curT = phParams?.get("t") ?? null;
  const curBc = phParams?.get("bc") ?? null;
  const trail = newCrumbs.join(" › ");
  const placeholderInSubtree =
    onPlaceholder && curBc != null && (curBc === trail || curBc.startsWith(trail + " › "));
  const hasActive = placeholderInSubtree || allPaths.some(
    (p) => location === p || (p !== "/portal" && location.startsWith(p)),
  );
  const [open, setOpen] = useState(depth === 0 || hasActive || !!node.defaultOpen);

  useEffect(() => {
    if (hasActive && !open) setOpen(true);
  }, [hasActive]);

  // ── FOLDER NODES ──────────────────────────────────────────────────────────
  if (node.children) {
    const colorClass = node.color ? COLOR_MAP[node.color as ColorCategory] : "text-[#7a95b8]";
    const dotClass = node.color ? COLOR_DOT_MAP[node.color as ColorCategory] : "";
    const borderClass = node.color ? COLOR_BORDER_MAP[node.color as ColorCategory] : "border-[#12233e]/60";
    const childCount = allPaths.length;

    const kids = (
      node.children.map((child, i) => (
        <NavTreeNode
          key={`${child.label}-${i}`}
          node={child}
          depth={depth + 1}
          location={location}
          search={search}
          onClose={onClose}
          crumbs={newCrumbs}
          favoritePaths={favoritePaths}
          onToggleFavorite={onToggleFavorite}
        />
      ))
    );

    // depth 0 — top-level tab
    if (depth === 0) {
      return (
        <div>
          <button
            onClick={() => setOpen(!open)}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] font-extrabold transition-all duration-200 cursor-pointer select-none ${
              hasActive ? "text-[#22c55e] drop-shadow-[0_0_6px_rgba(34,197,94,0.4)]" : `${colorClass} hover:brightness-125`
            }`}
          >
            {node.color && (
              <span className={`w-1 h-1 rounded-full flex-shrink-0 ${dotClass} shadow-[0_0_4px_currentColor]`} />
            )}
            <span className="flex-1 text-left">{node.label}</span>
            <ChevronRight size={11} className={`transition-transform duration-200 flex-shrink-0 opacity-60 ${open ? "rotate-90" : ""}`} />
          </button>
          {open && <div className="pb-1">{kids}</div>}
        </div>
      );
    }

    // depth 1 — folder
    if (depth === 1) {
      return (
        <div className="ml-2">
          <button
            onClick={() => setOpen(!open)}
            className={`w-full flex items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase tracking-[0.1em] font-bold transition-all duration-200 cursor-pointer select-none ${
              hasActive ? "text-[#22c55e]/80" : `${colorClass} opacity-70 hover:opacity-100`
            }`}
          >
            {node.color && (
              <span className={`w-1 h-1 rounded-full flex-shrink-0 opacity-60 ${dotClass}`} />
            )}
            <ChevronRight size={10} className={`transition-transform duration-200 flex-shrink-0 opacity-50 ${open ? "rotate-90" : ""}`} />
            <span className="flex-1 text-left">{node.label}</span>
            <span className="text-[9px] opacity-40 font-bold">{childCount}</span>
          </button>
          {open && <div className={`ml-1 border-l pl-1 ${borderClass}`}>{kids}</div>}
        </div>
      );
    }

    // depth 2+ — sub-folders (smaller)
    return (
      <div className="ml-2">
        <button
          onClick={() => setOpen(!open)}
          className={`w-full flex items-center gap-1.5 px-2 py-0.5 text-[9px] uppercase tracking-[0.08em] font-semibold transition-all duration-200 cursor-pointer select-none ${
            hasActive ? "text-[#22c55e]/70" : "text-[#4a6a8e] opacity-60 hover:opacity-95"
          }`}
        >
          <ChevronRight size={9} className={`transition-transform duration-200 flex-shrink-0 opacity-40 ${open ? "rotate-90" : ""}`} />
          <span className="flex-1 text-left">{node.label}</span>
          <span className="text-[8px] opacity-30 font-bold">{childCount}</span>
        </button>
        {open && <div className="ml-1 border-l border-[#12233e]/40 pl-1">{kids}</div>}
      </div>
    );
  }

  // ── LEAF NODES ────────────────────────────────────────────────────────────
  // Guard: a real-page leaf must be in the primary-nav layer.
  if (node.path && !isPrimaryNav(node.path)) return null;

  const href = node.path
    ?? `/portal/nav-placeholder?t=${encodeURIComponent(node.label)}&bc=${encodeURIComponent(crumbs.join(" › "))}`;
  const isActive = node.path
    ? location === node.path || (node.path !== "/portal" && location.startsWith(node.path))
    : onPlaceholder && curT === node.label && curBc === crumbs.join(" › ");
  const score = node.path ? TAB_SCORES[node.path] : undefined;
  const isHighScore = score !== undefined && score >= 9;
  const isFavorited = node.path ? favoritePaths?.has(node.path) : false;
  const scoreBgColor = score !== undefined
    ? score >= 10 ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/30"
    : score >= 9 ? "bg-blue-500/20 text-blue-300 border border-blue-500/25"
    : score >= 7 ? "bg-slate-500/15 text-slate-400 border border-slate-500/20"
    : "bg-orange-500/15 text-orange-400 border border-orange-500/20"
    : "";

  return (
    <div className="relative group">
      <Link
        href={href}
        className={`rc-sidebar-item ${isActive ? "active" : ""}`}
        onClick={onClose}
        style={isHighScore ? { fontSize: "1.05em" } : undefined}
      >
        <FileText size={isHighScore ? 15 : 14} className={isActive ? "" : "text-[#4a6a8e]"} />
        <span style={{ flex: "1 1 0", minWidth: 0, wordBreak: "break-word", fontWeight: isHighScore ? 700 : 600 }}>
          {node.label}
        </span>
        {node.isPlaceholder && (
          <span className="inline-flex items-center justify-center h-4 px-1 rounded text-[8px] font-bold flex-shrink-0 bg-violet-500/15 text-violet-300 border border-violet-500/25 uppercase tracking-wide">
            soon
          </span>
        )}
        {score !== undefined && (
          <span className={`inline-flex items-center justify-center h-4 min-w-4 px-0.5 rounded text-[9px] font-bold flex-shrink-0 ${scoreBgColor}`}>
            {score}
          </span>
        )}
      </Link>
      {onToggleFavorite && node.path && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(node.path!, node.label); }}
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

function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [location] = useLocation();
  const search = useSearch();
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

  // Build a lookup from path -> NavItem for favorites rendering (from the medical tree)
  const navItemLookup = useMemo(() => {
    const map = new Map<string, NavItem>();
    flattenNavTree(MEDICAL_TREE).forEach((node, path) => {
      map.set(path, { path, label: node.label, icon: FileText });
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
              <div className="text-xs font-bold text-white leading-tight">Russell Capital Solutions™</div>
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
                {favorites.filter((fav: any) => ROUTE_LAYER[fav.path] !== "CUT").map((fav: any) => {
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

          {MEDICAL_TREE.map((tab) => (
            <NavTreeNode
              key={tab.label}
              node={tab}
              depth={0}
              location={location}
              search={search}
              onClose={onClose}
              crumbs={[]}
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

export function AppShell({ children, title: _title, subtitle: _subtitle }: { children: React.ReactNode; title?: string; subtitle?: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-[#060f20] relative">
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

        {/* Branded print header — hidden on screen, shown on Ctrl+P */}
        <PrintBrandHeader />

        {/* Page content — ambient breathing micro-shift */}
        <main id="main-content" className="rc-fade-in page-enter rc-breathe-ambient">
          {children}
        </main>
      </div>

      <ToolUsageTracker />
      <NeuralMeshInterceptor />
      <UniversalCalculatorEnhancer />
            <CalcPageAutoWirer />
            <ClientPortalEnhancer />
            <AdvisorProductivityTracker />
            <ComplianceAutoLogger />
            <CrossCalcRecommendationEngine />
            <FinancialHealthPulse />
      <IntelligenceCommandPanel />
      <OrganismStatusBar />
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
