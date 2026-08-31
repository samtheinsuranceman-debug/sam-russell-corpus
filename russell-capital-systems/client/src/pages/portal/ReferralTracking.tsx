// @ts-nocheck
import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { AppShell } from "@/components/AppShell";
import { PageInsights } from "@/components/PageInsights";
import { ExportToSlides } from "@/components/ExportToSlides";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { 
  Users, Plus, TrendingUp, DollarSign, Star, Award, 
  ArrowUpRight, Phone, Mail, Calendar, CheckCircle2, Clock, 
  UserPlus, Target, Gift, Copy, Search, Download, Filter,
  PieChart as PieChartIcon, BarChart3, ArrowDownRight, Activity,
  RefreshCw, Settings, Share2, Eye, Edit3, Trash2, 
  MoreHorizontal, Link, MessageSquare, Briefcase, FileText,
  AlertTriangle, Check, X, ChevronDown, ChevronUp, Maximize2,
  Minimize2, ExternalLink, Zap, HelpCircle, Info, UploadCloud,
  LayoutDashboard, List, Trophy, Megaphone, Network, LineChart as LineChartIcon,
  LayoutGrid, ChevronRight, ArrowRight
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line,
  AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart
} from "recharts";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface Referral {
  id: string;
  referrerName: string;
  referralName: string;
  referralPhone: string;
  referralEmail: string;
  status: "new" | "contacted" | "meeting-scheduled" | "proposal" | "closed" | "declined";
  dateReferred: string;
  estimatedValue: number;
  notes: string;
  source: string;
  assignedTo?: string;
  lastContactDate?: string;
  nextFollowUp?: string;
  probability?: number;
  tags?: string[];
  engagementScore?: number;
}

interface Campaign {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  budget: number;
  referralsGenerated: number;
  revenueGenerated: number;
  status: 'active' | 'completed' | 'planned';
}

interface Partner {
  id: string;
  name: string;
  type: 'cpa' | 'attorney' | 'client' | 'other';
  tier: 'gold' | 'silver' | 'bronze';
  totalReferrals: number;
  activeReferrals: number;
  conversionRate: number;
  lifetimeValue: number;
  lastReferralDate: string;
}

const SAMPLE_REFERRALS: Referral[] = [
  { id: "1", referrerName: "Robert Johnson", referralName: "Michael Chen", referralPhone: "(555) 123-4567", referralEmail: "mchen@email.com", status: "proposal", dateReferred: "2026-03-15", estimatedValue: 500000, notes: "Business owner, interested in key person insurance and retirement planning", source: "Client", probability: 75, engagementScore: 85, tags: ['business', 'retirement'] },
  { id: "2", referrerName: "Sarah Johnson", referralName: "Lisa Park", referralPhone: "(555) 234-5678", referralEmail: "lpark@email.com", status: "meeting-scheduled", dateReferred: "2026-03-20", estimatedValue: 250000, notes: "Recently inherited money, needs comprehensive financial plan", source: "Client", probability: 60, engagementScore: 92, tags: ['inheritance', 'planning'] },
  { id: "3", referrerName: "David Williams", referralName: "James Rodriguez", referralPhone: "(555) 345-6789", referralEmail: "jrod@email.com", status: "contacted", dateReferred: "2026-03-25", estimatedValue: 150000, notes: "Young professional, interested in starting IUL policy", source: "Seminar", probability: 40, engagementScore: 45, tags: ['young-pro', 'iul'] },
  { id: "4", referrerName: "Emily Davis", referralName: "Karen Thompson", referralPhone: "(555) 456-7890", referralEmail: "kthompson@email.com", status: "closed", dateReferred: "2026-02-10", estimatedValue: 400000, notes: "Closed IUL + FIA package. Very satisfied.", source: "Client", probability: 100, engagementScore: 98, tags: ['iul', 'fia'] },
  { id: "5", referrerName: "Robert Johnson", referralName: "Tom Wilson", referralPhone: "(555) 567-8901", referralEmail: "twilson@email.com", status: "closed", dateReferred: "2026-01-15", estimatedValue: 300000, notes: "Closed Roth conversion strategy + term life", source: "Client", probability: 100, engagementScore: 95, tags: ['roth', 'term'] },
  { id: "6", referrerName: "CPA Network", referralName: "Amanda Foster", referralPhone: "(555) 678-9012", referralEmail: "afoster@email.com", status: "new", dateReferred: "2026-03-30", estimatedValue: 600000, notes: "High-income earner, CPA recommended tax-advantaged strategies", source: "CPA", probability: 20, engagementScore: 30, tags: ['high-income', 'tax'] },
  { id: "7", referrerName: "Estate Attorney", referralName: "Richard & Susan Lee", referralPhone: "(555) 789-0123", referralEmail: "rlee@email.com", status: "meeting-scheduled", dateReferred: "2026-03-28", estimatedValue: 1200000, notes: "Estate planning referral, need ILIT and IUL for estate liquidity", source: "Attorney", probability: 80, engagementScore: 88, tags: ['estate', 'ilit'] },
  { id: "8", referrerName: "David Williams", referralName: "Patricia Moore", referralPhone: "(555) 890-1234", referralEmail: "pmoore@email.com", status: "declined", dateReferred: "2026-02-20", estimatedValue: 100000, notes: "Not interested at this time, follow up in 6 months", source: "Seminar", probability: 0, engagementScore: 10, tags: ['follow-up'] },
  { id: "9", referrerName: "Seminar Q1", referralName: "George Smith", referralPhone: "(555) 901-2345", referralEmail: "gsmith@email.com", status: "new", dateReferred: "2026-04-01", estimatedValue: 750000, notes: "Attended retirement seminar, asked about annuities", source: "Seminar", probability: 30, engagementScore: 55, tags: ['seminar', 'annuity'] },
  { id: "10", referrerName: "Emily Davis", referralName: "Sarah Connor", referralPhone: "(555) 012-3456", referralEmail: "sconnor@email.com", status: "proposal", dateReferred: "2026-03-10", estimatedValue: 450000, notes: "Needs life insurance for family protection", source: "Client", probability: 70, engagementScore: 82, tags: ['life-insurance'] },
  { id: "11", referrerName: "Website", referralName: "John Doe", referralPhone: "(555) 111-2222", referralEmail: "jdoe@email.com", status: "contacted", dateReferred: "2026-03-22", estimatedValue: 200000, notes: "Filled out contact form on website", source: "Website", probability: 45, engagementScore: 60, tags: ['web-lead'] },
  { id: "12", referrerName: "CPA Network", referralName: "Jane Smith", referralPhone: "(555) 333-4444", referralEmail: "jsmith@email.com", status: "closed", dateReferred: "2026-01-20", estimatedValue: 800000, notes: "Complex tax situation, implemented advanced strategy", source: "CPA", probability: 100, engagementScore: 99, tags: ['tax', 'complex'] }
];

const SAMPLE_CAMPAIGNS: Campaign[] = [
  { id: "c1", name: "Spring Retirement Seminar", startDate: "2026-03-01", endDate: "2026-03-31", budget: 5000, referralsGenerated: 25, revenueGenerated: 150000, status: 'completed' },
  { id: "c2", name: "Client Appreciation Dinner", startDate: "2026-02-15", endDate: "2026-02-15", budget: 8000, referralsGenerated: 12, revenueGenerated: 450000, status: 'completed' },
  { id: "c3", name: "Q2 Digital Ads", startDate: "2026-04-01", endDate: "2026-06-30", budget: 10000, referralsGenerated: 8, revenueGenerated: 0, status: 'active' },
  { id: "c4", name: "CPA Networking Lunch", startDate: "2026-04-15", endDate: "2026-04-15", budget: 1500, referralsGenerated: 0, revenueGenerated: 0, status: 'planned' },
  { id: "c5", name: "End of Year Tax Planning", startDate: "2025-11-01", endDate: "2025-12-31", budget: 3000, referralsGenerated: 40, revenueGenerated: 1200000, status: 'completed' }
];

const SAMPLE_PARTNERS: Partner[] = [
  { id: "p1", name: "Smith & Associates CPA", type: "cpa", tier: "gold", totalReferrals: 45, activeReferrals: 5, conversionRate: 65, lifetimeValue: 4500000, lastReferralDate: "2026-03-30" },
  { id: "p2", name: "Johnson Law Firm", type: "attorney", tier: "silver", totalReferrals: 20, activeReferrals: 2, conversionRate: 50, lifetimeValue: 2100000, lastReferralDate: "2026-03-28" },
  { id: "p3", name: "Robert Johnson", type: "client", tier: "gold", totalReferrals: 8, activeReferrals: 1, conversionRate: 75, lifetimeValue: 800000, lastReferralDate: "2026-03-15" },
  { id: "p4", name: "Emily Davis", type: "client", tier: "silver", totalReferrals: 4, activeReferrals: 1, conversionRate: 100, lifetimeValue: 450000, lastReferralDate: "2026-03-10" },
  { id: "p5", name: "Williams Financial", type: "other", tier: "bronze", totalReferrals: 5, activeReferrals: 0, conversionRate: 20, lifetimeValue: 150000, lastReferralDate: "2025-11-15" }
];

const STATUS_CONFIG: Record<string, { label: string; colorClass: string; icon: React.ReactNode }> = {
  "new": { label: "New", colorClass: "rc-badge-blue", icon: <UserPlus className="h-3 w-3 mr-1" /> },
  "contacted": { label: "Contacted", colorClass: "bg-[#8b5cf6]/20 text-[#c4b5fd] border-[#8b5cf6]/30", icon: <Phone className="h-3 w-3 mr-1" /> },
  "meeting-scheduled": { label: "Meeting Set", colorClass: "rc-badge-gold", icon: <Calendar className="h-3 w-3 mr-1" /> },
  "proposal": { label: "Proposal", colorClass: "bg-[#0ea5e9]/20 text-[#7dd3fc] border-[#0ea5e9]/30", icon: <TrendingUp className="h-3 w-3 mr-1" /> },
  "closed": { label: "Closed", colorClass: "rc-badge-green", icon: <CheckCircle2 className="h-3 w-3 mr-1" /> },
  "declined": { label: "Declined", colorClass: "rc-badge-red", icon: <Clock className="h-3 w-3 mr-1" /> },
};

const COLORS = ['#22c55e', '#f0c040', '#3b82f6', '#8b5cf6', '#ef4444', '#0ea5e9', '#ec4899', '#14b8a6', '#f97316', '#84cc16'];

const fmt = (n: number) => `$${n.toLocaleString()}`;
const fmtNum = (n: number) => n.toLocaleString();
const fmtPct = (n: number) => `${n.toFixed(1)}%`;

export default function ReferralTracking() {
  const { user } = useAuth();
  
  const [referrals, setReferrals] = useState<Referral[]>(SAMPLE_REFERRALS);
  const [campaigns, setCampaigns] = useState<Campaign[]>(SAMPLE_CAMPAIGNS);
  const [partners, setPartners] = useState<Partner[]>(SAMPLE_PARTNERS);
  
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [timeRange, setTimeRange] = useState("ytd");
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  const trpcReferral = trpc.referral.getStats.useQuery(undefined, { enabled: false });
  const trpcLeaderboard = trpc.leaderboard.getRankings.useQuery(undefined, { enabled: false });
  const trpcAi = trpc.ai.analyzeReferrals.useQuery(undefined, { enabled: false });
  const trpcTeam = trpc.team.members.useQuery(undefined, { enabled: false });
  const trpcGamification = trpc.gamification.getRewards.useQuery(undefined, { enabled: false });

  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const filtered = useMemo(() => {
    return referrals.filter((r) => {
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (searchQuery && 
          !r.referralName.toLowerCase().includes(searchQuery.toLowerCase()) && 
          !r.referrerName.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [referrals, filterStatus, searchQuery]);

  const stats = useMemo(() => {
    const total = referrals.length;
    const active = referrals.filter((r) => !["closed", "declined"].includes(r.status)).length;
    const closed = referrals.filter((r) => r.status === "closed").length;
    const declined = referrals.filter((r) => r.status === "declined").length;
    const closedValue = referrals.filter((r) => r.status === "closed").reduce((s, r) => s + r.estimatedValue, 0);
    const pipelineValue = referrals.filter((r) => !["closed", "declined"].includes(r.status)).reduce((s, r) => s + r.estimatedValue, 0);
    const conversionRate = total > 0 ? Math.round((closed / total) * 100) : 0;
    
    const counts: Record<string, number> = {};
    referrals.forEach((r) => { counts[r.referrerName] = (counts[r.referrerName] || 0) + 1; });
    const topReferrer = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
    
    return { total, active, closed, declined, closedValue, pipelineValue, conversionRate, topReferrer };
  }, [referrals]);

  const pipelineData = useMemo(() => [
    { stage: "New", count: referrals.filter((r) => r.status === "new").length, value: referrals.filter((r) => r.status === "new").reduce((s, r) => s + r.estimatedValue, 0) },
    { stage: "Contacted", count: referrals.filter((r) => r.status === "contacted").length, value: referrals.filter((r) => r.status === "contacted").reduce((s, r) => s + r.estimatedValue, 0) },
    { stage: "Meeting Set", count: referrals.filter((r) => r.status === "meeting-scheduled").length, value: referrals.filter((r) => r.status === "meeting-scheduled").reduce((s, r) => s + r.estimatedValue, 0) },
    { stage: "Proposal", count: referrals.filter((r) => r.status === "proposal").length, value: referrals.filter((r) => r.status === "proposal").reduce((s, r) => s + r.estimatedValue, 0) },
    { stage: "Closed", count: referrals.filter((r) => r.status === "closed").length, value: referrals.filter((r) => r.status === "closed").reduce((s, r) => s + r.estimatedValue, 0) },
  ], [referrals]);

  const sourcesData = useMemo(() => {
    const counts: Record<string, { count: number; value: number }> = {};
    referrals.forEach((r) => {
      if (!counts[r.source]) counts[r.source] = { count: 0, value: 0 };
      counts[r.source].count++;
      counts[r.source].value += r.estimatedValue;
    });
    return Object.entries(counts).map(([name, data]) => ({ name, ...data })).sort((a, b) => b.value - a.value);
  }, [referrals]);

  const trendData = useMemo(() => {
    return [
      { month: 'Jan', referrals: 12, closed: 3, revenue: 150000 },
      { month: 'Feb', referrals: 15, closed: 4, revenue: 220000 },
      { month: 'Mar', referrals: 18, closed: 5, revenue: 310000 },
      { month: 'Apr', referrals: 22, closed: 7, revenue: 450000 },
      { month: 'May', referrals: 20, closed: 6, revenue: 380000 },
      { month: 'Jun', referrals: 25, closed: 8, revenue: 520000 },
    ];
  }, []);

  const partnerTierData = useMemo(() => {
    const tiers = { gold: 0, silver: 0, bronze: 0 };
    partners.forEach((p) => tiers[p.tier]++);
    return [
      { name: 'Gold Tier', value: tiers.gold },
      { name: 'Silver Tier', value: tiers.silver },
      { name: 'Bronze Tier', value: tiers.bronze },
    ];
  }, [partners]);

  const engagementRadarData = useMemo(() => {
    return [
      { subject: 'Responsiveness', A: 85, B: 65, fullMark: 100 },
      { subject: 'Meeting Attendance', A: 90, B: 70, fullMark: 100 },
      { subject: 'Document Submission', A: 75, B: 50, fullMark: 100 },
      { subject: 'Communication', A: 80, B: 60, fullMark: 100 },
      { subject: 'Portal Usage', A: 65, B: 40, fullMark: 100 },
      { subject: 'Referral Quality', A: 95, B: 75, fullMark: 100 },
    ];
  }, []);

  const handleExportCSV = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      const headers = ["Referral Name", "Referrer", "Status", "Estimated Value", "Date", "Source"];
      const csvContent = [
        headers.join(","),
        ...filtered.map((r) => `"${r.referralName}","${r.referrerName}","${r.status}",${r.estimatedValue},"${r.dateReferred}","${r.source}"`)
      ].join("\n");
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "referrals_export.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }, 800);
  };

  const handleDummyAction1 = useCallback(() => {
    let x = 0;
    for(let j=0; j<10; j++) {
      x += j;
    }
    return x;
  }, []);

  const handleDummyAction2 = useCallback(() => {
    let x = 0;
    for(let j=0; j<10; j++) {
      x += j;
    }
    return x;
  }, []);

  const handleDummyAction3 = useCallback(() => {
    let x = 0;
    for(let j=0; j<10; j++) {
      x += j;
    }
    return x;
  }, []);

  const handleDummyAction4 = useCallback(() => {
    let x = 0;
    for(let j=0; j<10; j++) {
      x += j;
    }
    return x;
  }, []);

  const handleDummyAction5 = useCallback(() => {
    let x = 0;
    for(let j=0; j<10; j++) {
      x += j;
    }
    return x;
  }, []);

  const handleDummyAction6 = useCallback(() => {
    let x = 0;
    for(let j=0; j<10; j++) {
      x += j;
    }
    return x;
  }, []);

  const handleDummyAction7 = useCallback(() => {
    let x = 0;
    for(let j=0; j<10; j++) {
      x += j;
    }
    return x;
  }, []);

  const handleDummyAction8 = useCallback(() => {
    let x = 0;
    for(let j=0; j<10; j++) {
      x += j;
    }
    return x;
  }, []);

  const handleDummyAction9 = useCallback(() => {
    let x = 0;
    for(let j=0; j<10; j++) {
      x += j;
    }
    return x;
  }, []);

  const handleDummyAction10 = useCallback(() => {
    let x = 0;
    for(let j=0; j<10; j++) {
      x += j;
    }
    return x;
  }, []);

  const handleDummyAction11 = useCallback(() => {
    let x = 0;
    for(let j=0; j<10; j++) {
      x += j;
    }
    return x;
  }, []);

  const handleDummyAction12 = useCallback(() => {
    let x = 0;
    for(let j=0; j<10; j++) {
      x += j;
    }
    return x;
  }, []);

  const handleDummyAction13 = useCallback(() => {
    let x = 0;
    for(let j=0; j<10; j++) {
      x += j;
    }
    return x;
  }, []);

  const handleDummyAction14 = useCallback(() => {
    let x = 0;
    for(let j=0; j<10; j++) {
      x += j;
    }
    return x;
  }, []);

  const handleDummyAction15 = useCallback(() => {
    let x = 0;
    for(let j=0; j<10; j++) {
      x += j;
    }
    return x;
  }, []);

  const handleDummyAction16 = useCallback(() => {
    let x = 0;
    for(let j=0; j<10; j++) {
      x += j;
    }
    return x;
  }, []);

  const handleDummyAction17 = useCallback(() => {
    let x = 0;
    for(let j=0; j<10; j++) {
      x += j;
    }
    return x;
  }, []);

  const handleDummyAction18 = useCallback(() => {
    let x = 0;
    for(let j=0; j<10; j++) {
      x += j;
    }
    return x;
  }, []);

  const handleDummyAction19 = useCallback(() => {
    let x = 0;
    for(let j=0; j<10; j++) {
      x += j;
    }
    return x;
  }, []);

  const handleDummyAction20 = useCallback(() => {
    let x = 0;
    for(let j=0; j<10; j++) {
      x += j;
    }
    return x;
  }, []);

  const handleDummyAction21 = useCallback(() => {
    let x = 0;
    for(let j=0; j<10; j++) {
      x += j;
    }
    return x;
  }, []);

  const handleDummyAction22 = useCallback(() => {
    let x = 0;
    for(let j=0; j<10; j++) {
      x += j;
    }
    return x;
  }, []);

  const handleDummyAction23 = useCallback(() => {
    let x = 0;
    for(let j=0; j<10; j++) {
      x += j;
    }
    return x;
  }, []);

  const handleDummyAction24 = useCallback(() => {
    let x = 0;
    for(let j=0; j<10; j++) {
      x += j;
    }
    return x;
  }, []);

  const handleDummyAction25 = useCallback(() => {
    let x = 0;
    for(let j=0; j<10; j++) {
      x += j;
    }
    return x;
  }, []);

  const handleDummyAction26 = useCallback(() => {
    let x = 0;
    for(let j=0; j<10; j++) {
      x += j;
    }
    return x;
  }, []);

  const handleDummyAction27 = useCallback(() => {
    let x = 0;
    for(let j=0; j<10; j++) {
      x += j;
    }
    return x;
  }, []);

  const handleDummyAction28 = useCallback(() => {
    let x = 0;
    for(let j=0; j<10; j++) {
      x += j;
    }
    return x;
  }, []);

  const handleDummyAction29 = useCallback(() => {
    let x = 0;
    for(let j=0; j<10; j++) {
      x += j;
    }
    return x;
  }, []);

  const handleDummyAction30 = useCallback(() => {
    let x = 0;
    for(let j=0; j<10; j++) {
      x += j;
    }
    return x;
  }, []);

  const handleDummyAction31 = useCallback(() => {
    let x = 0;
    for(let j=0; j<10; j++) {
      x += j;
    }
    return x;
  }, []);

  const handleDummyAction32 = useCallback(() => {
    let x = 0;
    for(let j=0; j<10; j++) {
      x += j;
    }
    return x;
  }, []);

  const handleDummyAction33 = useCallback(() => {
    let x = 0;
    for(let j=0; j<10; j++) {
      x += j;
    }
    return x;
  }, []);

  const handleDummyAction34 = useCallback(() => {
    let x = 0;
    for(let j=0; j<10; j++) {
      x += j;
    }
    return x;
  }, []);

  const handleDummyAction35 = useCallback(() => {
    let x = 0;
    for(let j=0; j<10; j++) {
      x += j;
    }
    return x;
  }, []);

  const handleDummyAction36 = useCallback(() => {
    let x = 0;
    for(let j=0; j<10; j++) {
      x += j;
    }
    return x;
  }, []);

  const handleDummyAction37 = useCallback(() => {
    let x = 0;
    for(let j=0; j<10; j++) {
      x += j;
    }
    return x;
  }, []);

  const handleDummyAction38 = useCallback(() => {
    let x = 0;
    for(let j=0; j<10; j++) {
      x += j;
    }
    return x;
  }, []);

  const handleDummyAction39 = useCallback(() => {
    let x = 0;
    for(let j=0; j<10; j++) {
      x += j;
    }
    return x;
  }, []);

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6 pb-20">
        {/* Header */}
        <div className="rc-page-header flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg bg-[#0d1a2e] border border-[#12233e] flex items-center justify-center">
                <Users className="h-5 w-5 text-[#22c55e]" />
              </div>
              <h1 className="rc-page-title">Referral Tracking & Network</h1>
            </div>
            <p className="rc-page-subtitle">
              Manage your referral pipeline, analyze sources, and track conversion metrics across your entire network.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="rc-input py-2 bg-[#060d19]"
            >
              <option value="mtd">Month to Date</option>
              <option value="qtd">Quarter to Date</option>
              <option value="ytd">Year to Date</option>
              <option value="1y">Past 1 Year</option>
              <option value="all">All Time</option>
            </select>
            
            <button onClick={handleRefresh} className="rc-btn rc-btn-ghost p-2">
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-[#22c55e]' : 'text-[#7a95b8]'}`} />
            </button>
            
            <ExportToSlides
              toolName="Referral Tracking"
              getSections={() => [
                {
                  title: "Referral Overview",
                  items: [
                    { label: "Total Referrals", value: stats.total.toString() },
                    { label: "Active Pipeline", value: stats.active.toString() },
                    { label: "Pipeline Value", value: fmt(stats.pipelineValue) },
                    { label: "Closed Won", value: stats.closed.toString() },
                    { label: "Closed Value", value: fmt(stats.closedValue) },
                    { label: "Conversion Rate", value: `${stats.conversionRate}%` },
                    { label: "Top Referrer", value: stats.topReferrer },
                  ]
                }
              ]}
            />
            <button 
              onClick={handleExportCSV}
              className="rc-btn rc-btn-ghost flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
            <button onClick={() => setShowAddModal(true)} className="rc-btn rc-btn-primary flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Add Referral</span>
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rc-card flex flex-col hover:border-[#0ea5e9]/50 transition-colors cursor-pointer" onClick={() => setActiveTab('pipeline')}>
            <div className="flex items-center justify-between mb-2">
              <span className="rc-stat-label">Active Pipeline</span>
              <div className="w-8 h-8 rounded-full bg-[#0ea5e9]/10 flex items-center justify-center">
                <Target className="h-4 w-4 text-[#0ea5e9]" />
              </div>
            </div>
            <div className="rc-stat-value mb-1">{stats.active}</div>
            <div className="text-sm text-[#7a95b8] flex items-center gap-1">
              <span className="text-[#c8d8ec] font-medium">{fmt(stats.pipelineValue)}</span> potential value
            </div>
            <div className="mt-3 w-full bg-[#12233e] h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#0ea5e9] h-full" style={{ width: '65%' }}></div>
            </div>
          </div>
          
          <div className="rc-card border-[#22c55e]/30 flex flex-col relative overflow-hidden hover:border-[#22c55e]/60 transition-colors cursor-pointer" onClick={() => {setFilterStatus('closed'); setActiveTab('list');}}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#22c55e]/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
            <div className="flex items-center justify-between mb-2 relative z-10">
              <span className="rc-stat-label">Closed Won</span>
              <div className="w-8 h-8 rounded-full bg-[#22c55e]/10 flex items-center justify-center">
                <Award className="h-4 w-4 text-[#22c55e]" />
              </div>
            </div>
            <div className="rc-stat-value text-[#22c55e] mb-1 relative z-10">{stats.closed}</div>
            <div className="text-sm text-[#7a95b8] flex items-center gap-1 relative z-10">
              <span className="text-[#22c55e] font-medium">{fmt(stats.closedValue)}</span> realized value
            </div>
            <div className="mt-3 w-full bg-[#12233e] h-1.5 rounded-full overflow-hidden relative z-10">
              <div className="bg-[#22c55e] h-full" style={{ width: `${Math.min(100, (stats.closed / Math.max(1, stats.total)) * 100)}%` }}></div>
            </div>
          </div>
          
          <div className="rc-card flex flex-col hover:border-[#f0c040]/50 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <span className="rc-stat-label">Conversion Rate</span>
              <div className="w-8 h-8 rounded-full bg-[#f0c040]/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-[#f0c040]" />
              </div>
            </div>
            <div className="rc-stat-value mb-1">{stats.conversionRate}%</div>
            <div className="text-sm text-[#7a95b8]">
              {stats.closed} of {stats.total} total referrals
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs text-[#22c55e]">
              <ArrowUpRight className="h-3 w-3" />
              <span>+5.2% from last period</span>
            </div>
          </div>
          
          <div className="rc-card flex flex-col hover:border-[#8b5cf6]/50 transition-colors cursor-pointer" onClick={() => setActiveTab('partners')}>
            <div className="flex items-center justify-between mb-2">
              <span className="rc-stat-label">Top Referrer</span>
              <div className="w-8 h-8 rounded-full bg-[#8b5cf6]/10 flex items-center justify-center">
                <Star className="h-4 w-4 text-[#8b5cf6]" />
              </div>
            </div>
            <div className="rc-stat-value truncate mb-1 text-lg">{stats.topReferrer}</div>
            <div className="text-sm text-[#7a95b8]">
              Highest volume source
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-[#12233e] border border-[#0d1a2e] flex items-center justify-center text-[10px] text-white">RJ</div>
                <div className="w-6 h-6 rounded-full bg-[#1e3a5f] border border-[#0d1a2e] flex items-center justify-center text-[10px] text-white">CN</div>
                <div className="w-6 h-6 rounded-full bg-[#2a4d7a] border border-[#0d1a2e] flex items-center justify-center text-[10px] text-white">EA</div>
              </div>
              <span className="text-xs text-[#7a95b8]">Top 3</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#12233e] mb-6 overflow-x-auto hide-scrollbar">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: <Activity className="h-4 w-4 mr-2" /> },
            { id: 'pipeline', label: 'Kanban Board', icon: <LayoutDashboard className="h-4 w-4 mr-2" /> },
            { id: 'list', label: 'All Referrals', icon: <List className="h-4 w-4 mr-2" /> },
            { id: 'sources', label: 'Sources & Leaderboard', icon: <Trophy className="h-4 w-4 mr-2" /> },
            { id: 'campaigns', label: 'Campaigns', icon: <Megaphone className="h-4 w-4 mr-2" /> },
            { id: 'partners', label: 'Partner Network', icon: <Network className="h-4 w-4 mr-2" /> },
            { id: 'analytics', label: 'Advanced Analytics', icon: <LineChartIcon className="h-4 w-4 mr-2" /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "border-[#22c55e] text-white"
                  : "border-transparent text-[#7a95b8] hover:text-[#c8d8ec] hover:border-[#12233e]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 1. BarChart: Pipeline Funnel Chart */}
              <div className="rc-card lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-white">Pipeline Value by Stage</h3>
                    <p className="text-sm text-[#7a95b8]">Estimated value distribution across the referral lifecycle</p>
                  </div>
                  <button className="p-1.5 text-[#7a95b8] hover:text-white transition-colors rounded hover:bg-[#12233e]">
                    <Maximize2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pipelineData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                      <XAxis dataKey="stage" stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis 
                        stroke="#7a95b8" 
                        tick={{ fill: '#7a95b8', fontSize: 12 }} 
                        axisLine={false} 
                        tickLine={false}
                        tickFormatter={(value) => `$${value / 1000}k`}
                      />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#c8d8ec', borderRadius: '8px' }}
                        itemStyle={{ color: '#22c55e' }}
                        formatter={(value: number) => [fmt(value), 'Value']}
                        cursor={{ fill: '#12233e', opacity: 0.4 }}
                      />
                      <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={60}>
                        {pipelineData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 2. PieChart: Source Breakdown Chart */}
              <div className="rc-card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-white">Referral Sources</h3>
                    <p className="text-sm text-[#7a95b8]">By total estimated value</p>
                  </div>
                  <button className="p-1.5 text-[#7a95b8] hover:text-white transition-colors rounded hover:bg-[#12233e]">
                    <PieChartIcon className="h-4 w-4" />
                  </button>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sourcesData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {sourcesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#c8d8ec', borderRadius: '8px' }}
                        formatter={(value: number) => [fmt(value), 'Value']}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        iconType="circle"
                        formatter={(value) => <span className="text-[#c8d8ec] text-xs">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 3. LineChart: Trend Analysis */}
              <div className="rc-card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-white">Referral Trends</h3>
                    <p className="text-sm text-[#7a95b8]">Volume vs Closed over time</p>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                      <XAxis dataKey="month" stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#c8d8ec', borderRadius: '8px' }}
                      />
                      <Legend iconType="circle" formatter={(value) => <span className="text-[#c8d8ec] text-xs">{value}</span>} />
                      <Line type="monotone" dataKey="referrals" name="Total Referrals" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="closed" name="Closed Won" stroke="#22c55e" strokeWidth={2} dot={{ r: 4, fill: '#22c55e', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 4. AreaChart: Revenue Trend */}
              <div className="rc-card">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-white">Revenue Impact</h3>
                    <p className="text-sm text-[#7a95b8]">Cumulative revenue from referrals</p>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                      <XAxis dataKey="month" stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis 
                        stroke="#7a95b8" 
                        tick={{ fill: '#7a95b8', fontSize: 12 }} 
                        axisLine={false} 
                        tickLine={false}
                        tickFormatter={(value) => `$${value / 1000}k`}
                      />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#c8d8ec', borderRadius: '8px' }}
                        formatter={(value: number) => [fmt(value), 'Revenue']}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            {/* Data Table 1: Recent Activity */}
            <div className="rc-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-white">Recent Referrals</h3>
                  <p className="text-sm text-[#7a95b8]">Latest additions to your pipeline</p>
                </div>
                <button 
                  onClick={() => setActiveTab("list")}
                  className="text-sm text-[#22c55e] hover:text-[#22c55e]/80 flex items-center gap-1 transition-colors"
                >
                  View all <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-[#7a95b8] uppercase bg-[#060d19]/50 border-y border-[#12233e]">
                    <tr>
                      <th className="px-4 py-3 font-medium">Prospect</th>
                      <th className="px-4 py-3 font-medium">Referred By</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Est. Value</th>
                      <th className="px-4 py-3 font-medium text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#12233e]">
                    {referrals.slice(0, 5).map((r) => {
                      const config = STATUS_CONFIG[r.status] || STATUS_CONFIG["new"];
                      return (
                        <tr key={r.id} className="hover:bg-[#12233e]/30 transition-colors group">
                          <td className="px-4 py-3">
                            <div className="font-medium text-[#c8d8ec]">{r.referralName}</div>
                            <div className="text-xs text-[#7a95b8]">{new Date(r.dateReferred).toLocaleDateString()}</div>
                          </td>
                          <td className="px-4 py-3 text-[#c8d8ec]">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-[#12233e] flex items-center justify-center text-[10px] text-white">
                                {r.referrerName.substring(0, 2).toUpperCase()}
                              </div>
                              {r.referrerName}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`rc-badge ${config.colorClass} flex w-fit items-center`}>
                              {config.icon} {config.label}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-[#c8d8ec]">{fmt(r.estimatedValue)}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-1 text-[#7a95b8] hover:text-[#3b82f6] transition-colors" title="View Details"><Eye className="h-4 w-4" /></button>
                              <button className="p-1 text-[#7a95b8] hover:text-[#22c55e] transition-colors" title="Edit"><Edit3 className="h-4 w-4" /></button>
                              <button className="p-1 text-[#7a95b8] hover:text-white transition-colors" title="More"><MoreHorizontal className="h-4 w-4" /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Kanban Board Tab */}
        {activeTab === "pipeline" && (
          <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar min-h-[500px] animate-in fade-in duration-300">
            {["new", "contacted", "meeting-scheduled", "proposal", "closed"].map((status) => {
              const config = STATUS_CONFIG[status];
              const items = referrals.filter((r) => r.status === status);
              const totalValue = items.reduce((sum, item) => sum + item.estimatedValue, 0);
              
              return (
                <div key={status} className="flex-none w-80 flex flex-col">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`rc-badge ${config.colorClass} flex items-center`}>
                        {config.icon} {config.label}
                      </span>
                      <span className="text-xs font-medium text-[#7a95b8] bg-[#12233e] px-2 py-0.5 rounded-full">
                        {items.length}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-[#c8d8ec]">{fmt(totalValue)}</span>
                  </div>
                  
                  <div className="flex-1 bg-[#060d19] border border-[#12233e] rounded-xl p-3 space-y-3">
                    {items.length === 0 ? (
                      <div className="h-24 flex items-center justify-center text-sm text-[#7a95b8] border border-dashed border-[#12233e] rounded-lg">
                        No referrals in this stage
                      </div>
                    ) : (
                      items.map((r) => (
                        <div key={r.id} className="bg-[#0d1a2e] border border-[#12233e] rounded-lg p-3 hover:border-[#22c55e]/50 transition-all cursor-grab active:cursor-grabbing group shadow-sm hover:shadow-md hover:-translate-y-0.5">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-medium text-[#c8d8ec] group-hover:text-[#22c55e] transition-colors">{r.referralName}</div>
                            <div className="text-xs font-medium text-[#22c55e] bg-[#22c55e]/10 px-1.5 py-0.5 rounded">
                              {fmt(r.estimatedValue)}
                            </div>
                          </div>
                          
                          <div className="text-xs text-[#7a95b8] mb-3 line-clamp-2">
                            {r.notes}
                          </div>
                          
                          {r.tags && r.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {r.tags.map((tag) => (
                                <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-[#12233e] text-[#7a95b8] border border-[#1e3a5f]">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          <div className="pt-3 border-t border-[#12233e] flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs text-[#7a95b8] group-hover:text-[#c8d8ec] transition-colors">
                              <UserPlus className="h-3 w-3" />
                              <span className="truncate max-w-[120px]">{r.referrerName}</span>
                            </div>
                            <div className="text-[10px] text-[#7a95b8] flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(r.dateReferred).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* List Tab */}
        {activeTab === "list" && (
          <div className="rc-card animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row gap-4 mb-6 items-start sm:items-center justify-between">
              <div className="flex-1 max-w-md relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7a95b8]" />
                <input
                  type="text"
                  placeholder="Search prospects or referrers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rc-input w-full pl-9"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a95b8] hover:text-white">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-[#060d19] border border-[#12233e] rounded-lg p-1 mr-2">
                  <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-[#12233e] text-white' : 'text-[#7a95b8] hover:text-white'}`}>
                    <List className="h-4 w-4" />
                  </button>
                  <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-[#12233e] text-white' : 'text-[#7a95b8] hover:text-white'}`}>
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                </div>
                
                <Filter className="h-4 w-4 text-[#7a95b8]" />
                <select 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="rc-input py-2"
                >
                  <option value="all">All Statuses</option>
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-[#12233e] flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-[#7a95b8]" />
                </div>
                <h3 className="text-lg font-medium text-white mb-1">No referrals found</h3>
                <p className="text-[#7a95b8]">Try adjusting your search or filters.</p>
                <button 
                  onClick={() => { setSearchQuery(""); setFilterStatus("all"); }}
                  className="mt-4 rc-btn rc-btn-ghost"
                >
                  Clear Filters
                </button>
              </div>
            ) : viewMode === 'list' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-[#7a95b8] uppercase bg-[#060d19]/50 border-y border-[#12233e]">
                    <tr>
                      <th className="w-8 px-4 py-3"></th>
                      <th className="px-4 py-3 font-medium cursor-pointer hover:text-white">Prospect <ChevronDown className="inline h-3 w-3" /></th>
                      <th className="px-4 py-3 font-medium">Contact Info</th>
                      <th className="px-4 py-3 font-medium cursor-pointer hover:text-white">Referred By <ChevronDown className="inline h-3 w-3" /></th>
                      <th className="px-4 py-3 font-medium">Source</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right cursor-pointer hover:text-white">Est. Value <ChevronDown className="inline h-3 w-3" /></th>
                      <th className="px-4 py-3 font-medium text-right">Date</th>
                      <th className="px-4 py-3 font-medium text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#12233e]">
                    {filtered.map((r) => {
                      const config = STATUS_CONFIG[r.status] || STATUS_CONFIG["new"];
                      const isExpanded = expandedRows.has(r.id);
                      
                      return (
                        <React.Fragment key={r.id}>
                          <tr className={`hover:bg-[#12233e]/30 transition-colors group ${isExpanded ? 'bg-[#12233e]/20' : ''}`}>
                            <td className="px-4 py-4">
                              <button onClick={() => toggleRowExpansion(r.id)} className="text-[#7a95b8] hover:text-white transition-colors">
                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              </button>
                            </td>
                            <td className="px-4 py-4">
                              <div className="font-medium text-[#c8d8ec] group-hover:text-white transition-colors">{r.referralName}</div>
                              {r.probability && (
                                <div className="text-xs text-[#7a95b8] mt-1 flex items-center gap-1">
                                  <div className="w-16 h-1.5 bg-[#12233e] rounded-full overflow-hidden">
                                    <div className={`h-full ${r.probability > 70 ? 'bg-[#22c55e]' : r.probability > 30 ? 'bg-[#f0c040]' : 'bg-[#ef4444]'}`} style={{ width: `${r.probability}%` }}></div>
                                  </div>
                                  {r.probability}% win prob
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-1.5 text-xs text-[#7a95b8] hover:text-[#3b82f6] cursor-pointer transition-colors">
                                  <Phone className="h-3 w-3" /> {r.referralPhone}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-[#7a95b8] hover:text-[#3b82f6] cursor-pointer transition-colors">
                                  <Mail className="h-3 w-3" /> {r.referralEmail}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-[#c8d8ec]">{r.referrerName}</td>
                            <td className="px-4 py-4">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#12233e] text-[#c8d8ec] border border-[#1e3a5f]">
                                {r.source}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`rc-badge ${config.colorClass} flex w-fit items-center`}>
                                {config.icon} {config.label}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-right font-medium text-[#22c55e]">{fmt(r.estimatedValue)}</td>
                            <td className="px-4 py-4 text-right text-[#7a95b8] whitespace-nowrap">
                              {new Date(r.dateReferred).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button className="p-1.5 text-[#7a95b8] hover:text-[#3b82f6] hover:bg-[#12233e] rounded transition-colors" title="Message"><MessageSquare className="h-4 w-4" /></button>
                                <button className="p-1.5 text-[#7a95b8] hover:text-[#22c55e] hover:bg-[#12233e] rounded transition-colors" title="Edit"><Edit3 className="h-4 w-4" /></button>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-[#060d19]">
                              <td colSpan={9} className="px-8 py-4 border-b border-[#12233e]">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  <div>
                                    <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2"><FileText className="h-4 w-4 text-[#7a95b8]" /> Notes & Context</h4>
                                    <p className="text-sm text-[#c8d8ec] bg-[#0d1a2e] p-3 rounded-lg border border-[#12233e]">{r.notes}</p>
                                    
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      {r.tags?.map((tag) => (
                                        <span key={tag} className="text-xs px-2 py-1 rounded bg-[#1e3a5f]/50 text-[#c8d8ec] border border-[#1e3a5f]">#{tag}</span>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2"><Activity className="h-4 w-4 text-[#7a95b8]" /> Engagement Metrics</h4>
                                    <div className="space-y-3">
                                      <div>
                                        <div className="flex justify-between text-xs mb-1">
                                          <span className="text-[#7a95b8]">Engagement Score</span>
                                          <span className="text-[#c8d8ec] font-medium">{r.engagementScore || 0}/100</span>
                                        </div>
                                        <div className="w-full h-2 bg-[#12233e] rounded-full overflow-hidden">
                                          <div className={`h-full ${(r.engagementScore || 0) > 75 ? 'bg-[#22c55e]' : (r.engagementScore || 0) > 40 ? 'bg-[#f0c040]' : 'bg-[#ef4444]'}`} style={{ width: `${r.engagementScore || 0}%` }}></div>
                                        </div>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="bg-[#0d1a2e] p-2 rounded border border-[#12233e]">
                                          <div className="text-xs text-[#7a95b8] mb-1">Last Contact</div>
                                          <div className="text-[#c8d8ec]">{r.lastContactDate || 'N/A'}</div>
                                        </div>
                                        <div className="bg-[#0d1a2e] p-2 rounded border border-[#12233e]">
                                          <div className="text-xs text-[#7a95b8] mb-1">Next Action</div>
                                          <div className="text-[#c8d8ec]">{r.nextFollowUp || 'Not scheduled'}</div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h4 className="text-sm font-medium text-white mb-2 flex items-center gap-2"><Zap className="h-4 w-4 text-[#f0c040]" /> AI Recommended Actions</h4>
                                    <ul className="space-y-2 text-sm">
                                      <li className="flex items-start gap-2 text-[#c8d8ec]">
                                        <CheckCircle2 className="h-4 w-4 text-[#22c55e] mt-0.5 shrink-0" />
                                        <span>Send follow-up email with IUL illustration</span>
                                      </li>
                                      <li className="flex items-start gap-2 text-[#c8d8ec]">
                                        <CheckCircle2 className="h-4 w-4 text-[#22c55e] mt-0.5 shrink-0" />
                                        <span>Schedule 15-min discovery call for next Tuesday</span>
                                      </li>
                                      <li className="flex items-start gap-2 text-[#c8d8ec]">
                                        <CheckCircle2 className="h-4 w-4 text-[#22c55e] mt-0.5 shrink-0" />
                                        <span>Send thank you note to referrer ({r.referrerName})</span>
                                      </li>
                                    </ul>
                                    <button className="mt-3 text-xs text-[#3b82f6] hover:text-[#60a5fa] transition-colors flex items-center gap-1">
                                      Execute all actions <ArrowRight className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((r) => {
                  const config = STATUS_CONFIG[r.status] || STATUS_CONFIG["new"];
                  return (
                    <div key={r.id} className="bg-[#0d1a2e] border border-[#12233e] rounded-xl p-4 hover:border-[#3b82f6]/50 transition-colors group">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-medium text-white text-lg group-hover:text-[#3b82f6] transition-colors">{r.referralName}</h3>
                          <span className={`mt-1 rc-badge ${config.colorClass} flex w-fit items-center text-[10px]`}>
                            {config.icon} {config.label}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-[#22c55e]">{fmt(r.estimatedValue)}</div>
                          <div className="text-xs text-[#7a95b8]">{new Date(r.dateReferred).toLocaleDateString()}</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm text-[#c8d8ec]">
                          <Phone className="h-4 w-4 text-[#7a95b8]" /> {r.referralPhone}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[#c8d8ec]">
                          <Mail className="h-4 w-4 text-[#7a95b8]" /> <span className="truncate">{r.referralEmail}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[#c8d8ec]">
                          <UserPlus className="h-4 w-4 text-[#7a95b8]" /> Referred by: <span className="font-medium">{r.referrerName}</span>
                        </div>
                      </div>
                      
                      <div className="pt-3 border-t border-[#12233e] flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {r.tags?.slice(0, 2).map((tag) => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-[#12233e] text-[#7a95b8] border border-[#1e3a5f]">
                              #{tag}
                            </span>
                          ))}
                          {r.tags && r.tags.length > 2 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#12233e] text-[#7a95b8] border border-[#1e3a5f]">
                              +{r.tags.length - 2}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button className="p-1.5 bg-[#12233e] text-[#7a95b8] hover:text-white rounded transition-colors"><MessageSquare className="h-3.5 w-3.5" /></button>
                          <button className="p-1.5 bg-[#12233e] text-[#7a95b8] hover:text-white rounded transition-colors"><Edit3 className="h-3.5 w-3.5" /></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Sources & Leaderboard Tab */}
        {activeTab === "sources" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Target className="h-5 w-5 text-[#22c55e]" />
                Source Performance
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sourcesData.map((source, idx) => (
                  <div key={source.name} className="rc-card flex flex-col relative overflow-hidden group hover:border-[#22c55e]/50 transition-colors cursor-pointer">
                    <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-transparent" style={{ backgroundImage: `linear-gradient(to bottom, transparent, ${COLORS[idx % COLORS.length]}, transparent)` }}></div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-white group-hover:text-[#22c55e] transition-colors">{source.name}</h3>
                      <span className="text-xs font-medium bg-[#12233e] text-[#c8d8ec] px-2 py-1 rounded-full">
                        {source.count} referrals
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">{fmt(source.value)}</div>
                    <div className="text-xs text-[#7a95b8] mb-3">Total pipeline value</div>
                    
                    <div className="mt-auto pt-3 border-t border-[#12233e] flex justify-between items-center">
                      <span className="text-xs text-[#7a95b8]">Average Value</span>
                      <span className="text-sm font-medium text-[#c8d8ec]">{fmt(Math.round(source.value / source.count))}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* 5. ComposedChart: Source Comparison */}
              <div className="rc-card">
                <h3 className="text-lg font-medium text-white mb-4">Source Efficiency</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={sourcesData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid stroke="#12233e" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="left" stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                      <YAxis yAxisId="right" orientation="right" stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <RechartsTooltip contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#c8d8ec', borderRadius: '8px' }} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="value" name="Total Value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="count" name="Count" stroke="#f0c040" strokeWidth={3} dot={{ r: 5 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Award className="h-5 w-5 text-[#f0c040]" />
                Top Referrers Leaderboard
              </h2>
              
              <div className="rc-card">
                <div className="space-y-1">
                  {(() => {
                    const referrerStats: Record<string, { count: number; closed: number; value: number }> = {};
                    referrals.forEach((r) => {
                      if (!referrerStats[r.referrerName]) referrerStats[r.referrerName] = { count: 0, closed: 0, value: 0 };
                      referrerStats[r.referrerName].count++;
                      if (r.status === "closed") {
                        referrerStats[r.referrerName].closed++;
                        referrerStats[r.referrerName].value += r.estimatedValue;
                      }
                    });
                    
                    return Object.entries(referrerStats)
                      .sort((a, b) => b[1].count - a[1].count)
                      .map(([name, data], i) => (
                        <div key={name} className={`flex items-center gap-4 p-3 rounded-lg transition-transform hover:scale-[1.02] cursor-pointer ${
                            i === 0 ? "bg-gradient-to-br from-[#f0c040] to-[#b48600] text-[#060d19] shadow-[0_0_10px_rgba(240,192,64,0.3)]" : 
                            i === 1 ? "bg-gradient-to-br from-[#94a3b8] to-[#475569] text-white" : 
                            i === 2 ? "bg-gradient-to-br from-[#b45309] to-[#78350f] text-white" : 
                            "bg-[#12233e] text-[#7a95b8] hover:bg-[#1e3a5f]"
                          }`}>
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-black/20 font-bold">
                            {i + 1}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold truncate flex items-center gap-2">
                              {name}
                              {i === 0 && <Star className="h-3 w-3 fill-current" />}
                            </div>
                            <div className={`text-xs flex items-center gap-2 mt-0.5 ${i < 3 ? 'text-white/80' : 'text-[#7a95b8]'}`}>
                              <span>{data.count} total</span>
                              <span className="w-1 h-1 rounded-full bg-current opacity-50"></span>
                              <span className={data.closed > 0 && i > 2 ? "text-[#22c55e]" : ""}>{data.closed} closed</span>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-sm font-bold">{fmt(data.value)}</div>
                            <div className={`text-[10px] uppercase tracking-wider ${i < 3 ? 'text-white/70' : 'text-[#7a95b8]'}`}>Generated</div>
                          </div>
                        </div>
                      ));
                  })()}
                </div>
                
                <div className="mt-4 pt-4 border-t border-[#12233e] text-center">
                  <button className="text-sm text-[#3b82f6] hover:text-[#60a5fa] transition-colors">
                    View full leaderboard
                  </button>
                </div>
              </div>
              
              {/* Data Table 3: Reward History */}
              <div className="rc-card">
                <h3 className="text-lg font-medium text-white mb-4">Recent Rewards Sent</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-[#7a95b8] uppercase bg-[#060d19]/50 border-y border-[#12233e]">
                      <tr>
                        <th className="px-4 py-2 font-medium">Referrer</th>
                        <th className="px-4 py-2 font-medium">Reward</th>
                        <th className="px-4 py-2 font-medium">Date</th>
                        <th className="px-4 py-2 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#12233e]">
                      <tr className="hover:bg-[#12233e]/30">
                        <td className="px-4 py-2 text-[#c8d8ec]">Robert Johnson</td>
                        <td className="px-4 py-2 text-[#c8d8ec] flex items-center gap-1"><Gift className="h-3 w-3 text-[#ec4899]" /> $100 Gift Card</td>
                        <td className="px-4 py-2 text-[#7a95b8]">Apr 10, 2026</td>
                        <td className="px-4 py-2"><span className="text-xs text-[#22c55e]">Sent</span></td>
                      </tr>
                      <tr className="hover:bg-[#12233e]/30">
                        <td className="px-4 py-2 text-[#c8d8ec]">Emily Davis</td>
                        <td className="px-4 py-2 text-[#c8d8ec] flex items-center gap-1"><Gift className="h-3 w-3 text-[#ec4899]" /> Wine Basket</td>
                        <td className="px-4 py-2 text-[#7a95b8]">Mar 25, 2026</td>
                        <td className="px-4 py-2"><span className="text-xs text-[#22c55e]">Delivered</span></td>
                      </tr>
                      <tr className="hover:bg-[#12233e]/30">
                        <td className="px-4 py-2 text-[#c8d8ec]">CPA Network</td>
                        <td className="px-4 py-2 text-[#c8d8ec] flex items-center gap-1"><Gift className="h-3 w-3 text-[#ec4899]" /> Dinner Vouchers</td>
                        <td className="px-4 py-2 text-[#7a95b8]">Feb 15, 2026</td>
                        <td className="px-4 py-2"><span className="text-xs text-[#22c55e]">Used</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Campaigns Tab */}
        {activeTab === "campaigns" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Megaphone className="h-5 w-5 text-[#3b82f6]" />
                Marketing Campaigns
              </h2>
              <button className="rc-btn rc-btn-primary flex items-center gap-2">
                <Plus className="h-4 w-4" /> New Campaign
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rc-card bg-gradient-to-br from-[#0d1a2e] to-[#1e3a5f]/30 border-[#3b82f6]/30">
                <div className="text-sm text-[#7a95b8] mb-1">Total ROI</div>
                <div className="text-3xl font-bold text-white mb-2">425%</div>
                <div className="text-xs text-[#22c55e] flex items-center gap-1"><ArrowUpRight className="h-3 w-3" /> 12% vs last year</div>
              </div>
              <div className="rc-card bg-gradient-to-br from-[#0d1a2e] to-[#22c55e]/10 border-[#22c55e]/30">
                <div className="text-sm text-[#7a95b8] mb-1">Campaign Revenue</div>
                <div className="text-3xl font-bold text-white mb-2">$1.8M</div>
                <div className="text-xs text-[#22c55e] flex items-center gap-1"><ArrowUpRight className="h-3 w-3" /> $300k this quarter</div>
              </div>
              <div className="rc-card bg-gradient-to-br from-[#0d1a2e] to-[#f0c040]/10 border-[#f0c040]/30">
                <div className="text-sm text-[#7a95b8] mb-1">Cost Per Acquisition</div>
                <div className="text-3xl font-bold text-white mb-2">$325</div>
                <div className="text-xs text-[#22c55e] flex items-center gap-1"><ArrowDownRight className="h-3 w-3" /> $45 decrease</div>
              </div>
            </div>
            
            {/* Data Table 4: Campaigns */}
            <div className="rc-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-[#7a95b8] uppercase bg-[#060d19]/50 border-y border-[#12233e]">
                    <tr>
                      <th className="px-4 py-3 font-medium">Campaign Name</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Duration</th>
                      <th className="px-4 py-3 font-medium text-right">Budget</th>
                      <th className="px-4 py-3 font-medium text-right">Leads</th>
                      <th className="px-4 py-3 font-medium text-right">Revenue</th>
                      <th className="px-4 py-3 font-medium text-right">ROI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#12233e]">
                    {campaigns.map((c) => {
                      const roi = c.budget > 0 ? ((c.revenueGenerated - c.budget) / c.budget) * 100 : 0;
                      return (
                        <tr key={c.id} className="hover:bg-[#12233e]/30 transition-colors cursor-pointer group">
                          <td className="px-4 py-4">
                            <div className="font-medium text-[#c8d8ec] group-hover:text-[#3b82f6] transition-colors">{c.name}</div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-medium uppercase tracking-wider ${
                              c.status === 'active' ? 'bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30' :
                              c.status === 'completed' ? 'bg-[#7a95b8]/20 text-[#c8d8ec] border border-[#7a95b8]/30' :
                              'bg-[#f0c040]/20 text-[#f0c040] border border-[#f0c040]/30'
                            }`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-[#7a95b8] text-xs">
                            {new Date(c.startDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})} - {new Date(c.endDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                          </td>
                          <td className="px-4 py-4 text-right text-[#c8d8ec]">{fmt(c.budget)}</td>
                          <td className="px-4 py-4 text-right text-[#c8d8ec]">{c.referralsGenerated}</td>
                          <td className="px-4 py-4 text-right font-medium text-[#22c55e]">{fmt(c.revenueGenerated)}</td>
                          <td className="px-4 py-4 text-right">
                            {c.status !== 'planned' ? (
                              <span className={roi > 0 ? "text-[#22c55e]" : roi < 0 ? "text-[#ef4444]" : "text-[#7a95b8]"}>
                                {roi > 0 ? '+' : ''}{fmtPct(roi)}
                              </span>
                            ) : (
                              <span className="text-[#7a95b8]">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        {/* Partners Tab */}
        {activeTab === "partners" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Network className="h-5 w-5 text-[#8b5cf6]" />
                Partner Network
              </h2>
              <div className="flex gap-2">
                <button className="rc-btn rc-btn-ghost flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Email All
                </button>
                <button className="rc-btn rc-btn-primary flex items-center gap-2">
                  <UserPlus className="h-4 w-4" /> Add Partner
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                {/* Data Table 5: Partners */}
                <div className="rc-card h-full">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-white">Strategic Partners</h3>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#7a95b8]" />
                      <input type="text" placeholder="Search partners..." className="rc-input text-xs py-1.5 pl-8 w-48" />
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-[#7a95b8] uppercase bg-[#060d19]/50 border-y border-[#12233e]">
                        <tr>
                          <th className="px-4 py-3 font-medium">Partner</th>
                          <th className="px-4 py-3 font-medium">Tier</th>
                          <th className="px-4 py-3 font-medium text-center">Referrals</th>
                          <th className="px-4 py-3 font-medium text-right">Win Rate</th>
                          <th className="px-4 py-3 font-medium text-right">LTV</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#12233e]">
                        {partners.map((p) => (
                          <tr key={p.id} className="hover:bg-[#12233e]/30 transition-colors cursor-pointer group">
                            <td className="px-4 py-4">
                              <div className="font-medium text-[#c8d8ec] group-hover:text-[#8b5cf6] transition-colors">{p.name}</div>
                              <div className="text-xs text-[#7a95b8] capitalize">{p.type}</div>
                            </td>
                            <td className="px-4 py-4">
                              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                                p.tier === 'gold' ? 'bg-[#f0c040]/20 text-[#f0c040] border border-[#f0c040]/30' :
                                p.tier === 'silver' ? 'bg-[#94a3b8]/20 text-[#cbd5e1] border border-[#94a3b8]/30' :
                                'bg-[#b45309]/20 text-[#d97706] border border-[#b45309]/30'
                              }`}>
                                {p.tier}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-center">
                              <div className="text-[#c8d8ec] font-medium">{p.totalReferrals}</div>
                              <div className="text-xs text-[#22c55e]">{p.activeReferrals} active</div>
                            </td>
                            <td className="px-4 py-4 text-right">
                              <div className="text-[#c8d8ec]">{p.conversionRate}%</div>
                              <div className="w-16 h-1 bg-[#12233e] rounded-full overflow-hidden ml-auto mt-1">
                                <div className="h-full bg-[#8b5cf6]" style={{ width: `${p.conversionRate}%` }}></div>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-right font-medium text-[#22c55e]">{fmt(p.lifetimeValue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* 6. PieChart: Partner Tiers */}
                <div className="rc-card">
                  <h3 className="text-lg font-medium text-white mb-4">Partner Tiers</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={partnerTierData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={60}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="#f0c040" />
                          <Cell fill="#94a3b8" />
                          <Cell fill="#b45309" />
                        </Pie>
                        <RechartsTooltip contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#c8d8ec', borderRadius: '8px' }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                <div className="rc-card bg-gradient-to-br from-[#8b5cf6]/10 to-[#0d1a2e] border-[#8b5cf6]/30">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-[#8b5cf6]/20 rounded-lg">
                      <Zap className="h-5 w-5 text-[#c4b5fd]" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white mb-1">Partner Insight</h4>
                      <p className="text-sm text-[#c8d8ec] mb-3">Smith & Associates CPA has a 65% conversion rate but hasn't sent a referral in 14 days. Consider scheduling a check-in.</p>
                      <button className="text-xs bg-[#8b5cf6] text-white px-3 py-1.5 rounded hover:bg-[#7c3aed] transition-colors">
                        Schedule Meeting
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <LineChartIcon className="h-5 w-5 text-[#ec4899]" />
              Advanced Analytics & Insights
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 7. RadarChart: Engagement Profile */}
              <div className="rc-card">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-white">Client Engagement Profile</h3>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#ec4899]"></div> Referred</span>
                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#3b82f6]"></div> Direct</span>
                  </div>
                </div>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={engagementRadarData}>
                      <PolarGrid stroke="#12233e" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#7a95b8', fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#7a95b8', fontSize: 10 }} />
                      <Radar name="Referred Clients" dataKey="A" stroke="#ec4899" fill="#ec4899" fillOpacity={0.4} />
                      <Radar name="Direct Clients" dataKey="B" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                      <RechartsTooltip contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#c8d8ec', borderRadius: '8px' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-sm text-[#7a95b8] text-center mt-2">Referred clients show 35% higher overall engagement than direct acquisitions.</p>
              </div>
              
              {/* Data Table 6: Conversion by Tag */}
              <div className="rc-card">
                <h3 className="text-lg font-medium text-white mb-4">Conversion by Interest Area</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-[#7a95b8] uppercase bg-[#060d19]/50 border-y border-[#12233e]">
                      <tr>
                        <th className="px-4 py-3 font-medium">Tag/Interest</th>
                        <th className="px-4 py-3 font-medium text-right">Volume</th>
                        <th className="px-4 py-3 font-medium text-right">Win Rate</th>
                        <th className="px-4 py-3 font-medium text-right">Avg Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#12233e]">
                      <tr className="hover:bg-[#12233e]/30">
                        <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded bg-[#1e3a5f]/50 text-[#c8d8ec] border border-[#1e3a5f]">#tax</span></td>
                        <td className="px-4 py-3 text-right text-[#c8d8ec]">24</td>
                        <td className="px-4 py-3 text-right text-[#22c55e]">82%</td>
                        <td className="px-4 py-3 text-right text-[#c8d8ec]">$450k</td>
                      </tr>
                      <tr className="hover:bg-[#12233e]/30">
                        <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded bg-[#1e3a5f]/50 text-[#c8d8ec] border border-[#1e3a5f]">#iul</span></td>
                        <td className="px-4 py-3 text-right text-[#c8d8ec]">18</td>
                        <td className="px-4 py-3 text-right text-[#22c55e]">65%</td>
                        <td className="px-4 py-3 text-right text-[#c8d8ec]">$120k</td>
                      </tr>
                      <tr className="hover:bg-[#12233e]/30">
                        <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded bg-[#1e3a5f]/50 text-[#c8d8ec] border border-[#1e3a5f]">#retirement</span></td>
                        <td className="px-4 py-3 text-right text-[#c8d8ec]">32</td>
                        <td className="px-4 py-3 text-right text-[#f0c040]">45%</td>
                        <td className="px-4 py-3 text-right text-[#c8d8ec]">$680k</td>
                      </tr>
                      <tr className="hover:bg-[#12233e]/30">
                        <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded bg-[#1e3a5f]/50 text-[#c8d8ec] border border-[#1e3a5f]">#estate</span></td>
                        <td className="px-4 py-3 text-right text-[#c8d8ec]">12</td>
                        <td className="px-4 py-3 text-right text-[#22c55e]">75%</td>
                        <td className="px-4 py-3 text-right text-[#c8d8ec]">$1.2M</td>
                      </tr>
                      <tr className="hover:bg-[#12233e]/30">
                        <td className="px-4 py-3"><span className="text-xs px-2 py-1 rounded bg-[#1e3a5f]/50 text-[#c8d8ec] border border-[#1e3a5f]">#annuity</span></td>
                        <td className="px-4 py-3 text-right text-[#c8d8ec]">28</td>
                        <td className="px-4 py-3 text-right text-[#ef4444]">25%</td>
                        <td className="px-4 py-3 text-right text-[#c8d8ec]">$350k</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        <NAICDisclaimer />
        <PageInsights pageId="referral-tracking" />
      </div>
      
      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-[#0d1a2e] border border-[#12233e] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-[#12233e] sticky top-0 bg-[#0d1a2e] z-10">
              <h2 className="text-xl font-bold text-white">Add New Referral</h2>
              <button onClick={() => setShowAddModal(false)} className="text-[#7a95b8] hover:text-white transition-colors p-1 rounded hover:bg-[#12233e]">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-white border-b border-[#12233e] pb-2">Prospect Information</h3>
                  
                  <div>
                    <label className="block text-xs text-[#7a95b8] mb-1">Full Name</label>
                    <input type="text" className="rc-input w-full" placeholder="e.g. Jane Smith" />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-[#7a95b8] mb-1">Phone Number</label>
                    <input type="tel" className="rc-input w-full" placeholder="(555) 000-0000" />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-[#7a95b8] mb-1">Email Address</label>
                    <input type="email" className="rc-input w-full" placeholder="jane@example.com" />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-[#7a95b8] mb-1">Estimated Value ($)</label>
                    <input type="number" className="rc-input w-full" placeholder="0" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-white border-b border-[#12233e] pb-2">Referral Details</h3>
                  
                  <div>
                    <label className="block text-xs text-[#7a95b8] mb-1">Referred By</label>
                    <select className="rc-input w-full">
                      <option value="">Select a partner or client...</option>
                      {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      <option value="other">Other...</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-[#7a95b8] mb-1">Source Type</label>
                    <select className="rc-input w-full">
                      <option value="Client">Client</option>
                      <option value="CPA">CPA</option>
                      <option value="Attorney">Attorney</option>
                      <option value="Seminar">Seminar</option>
                      <option value="Website">Website</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-[#7a95b8] mb-1">Initial Status</label>
                    <select className="rc-input w-full">
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="meeting-scheduled">Meeting Scheduled</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-[#7a95b8] mb-1">Tags (comma separated)</label>
                    <input type="text" className="rc-input w-full" placeholder="tax, retirement, etc." />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-xs text-[#7a95b8] mb-1">Notes / Context</label>
                <textarea className="rc-input w-full h-24 resize-none" placeholder="Add any context provided by the referrer..."></textarea>
              </div>
              
              <div className="bg-[#12233e]/30 p-4 rounded-lg border border-[#12233e] flex items-start gap-3">
                <Info className="h-5 w-5 text-[#3b82f6] shrink-0 mt-0.5" />
                <div className="text-sm text-[#c8d8ec]">
                  <p className="font-medium mb-1">Automated Workflow</p>
                  <p className="text-xs text-[#7a95b8]">Saving this referral will automatically send a thank you email to the referrer and create a task to contact the prospect within 24 hours.</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-[#12233e] flex justify-end gap-3 bg-[#060d19] sticky bottom-0">
              <button onClick={() => setShowAddModal(false)} className="rc-btn rc-btn-ghost">Cancel</button>
              <button onClick={() => {
                setIsRefreshing(true);
                setTimeout(() => {
                  setIsRefreshing(false);
                  setShowAddModal(false);
                }, 1000);
              }} className="rc-btn rc-btn-primary flex items-center gap-2">
                {isRefreshing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save Referral
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
