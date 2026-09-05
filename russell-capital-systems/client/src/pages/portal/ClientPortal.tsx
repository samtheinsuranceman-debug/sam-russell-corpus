// @ts-nocheck
import { useState, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  User,
  FileText,
  Calendar,
  Shield,
  Bell,
  Lock,
  CheckCircle2,
  Clock,
  Eye,
  Search,
  Download,
  MessageSquare,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Briefcase,
  DollarSign,
  Target,
  Activity,
  Settings,
  ShieldAlert,
  Key,
  Link as LinkIcon,
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart, Scatter
} from "recharts";
import { toast } from "sonner";

interface ClientDocument {
  id: string;
  name: string;
  type: string;
  date: string;
  status: "ready" | "pending" | "action-required";
  category: string;
}

interface PlanMilestone {
  id: string;
  title: string;
  status: "completed" | "in-progress" | "upcoming";
  date: string;
  description: string;
}

const SAMPLE_DOCUMENTS: ClientDocument[] = [{ id: "1", name: "Financial Needs Analysis", type: "PDF", date: "2026-03-15", status: "ready", category: "Analysis" },
,
  { id: "2", name: "IUL Illustration - National Life", type: "PDF", date: "2026-03-28", status: "ready", category: "Illustration" },
,
  { id: "3", name: "Roth Conversion Analysis", type: "PDF", date: "2026-03-22", status: "ready", category: "Analysis" },
,
  { id: "4", name: "Estate Plan Summary", type: "PDF", date: "2026-04-01", status: "pending", category: "Legal" },
,
  { id: "5", name: "Insurance Application", type: "Form", date: "2026-04-05", status: "action-required", category: "Forms" }
];

const MILESTONES: PlanMilestone[] = [
  { id: "1", title: "Discovery Meeting", status: "completed", date: "2026-03-15", description: "Initial financial assessment and goal setting" },
  { id: "2", title: "Risk Assessment", status: "completed", date: "2026-03-18", description: "Risk tolerance scoring and investment profile" },
  { id: "3", title: "Tax Analysis", status: "completed", date: "2026-03-22", description: "Roth conversion and tax optimization strategy" },
  { id: "4", title: "Insurance Review", status: "in-progress", date: "2026-03-28", description: "IUL illustration and coverage analysis" },
  { id: "5", title: "Estate Plan Update", status: "upcoming", date: "2026-04-15", description: "Will/trust review with estate attorney" },
  { id: "6", title: "Plan Presentation", status: "upcoming", date: "2026-05-01", description: "Comprehensive plan delivery and review" },
  { id: "7", title: "Implementation", status: "upcoming", date: "2026-05-15", description: "Policy applications and account setup" },
  { id: "8", title: "First Annual Review", status: "upcoming", date: "2027-03-01", description: "Progress review and plan adjustments" },
];

const ASSET_ALLOCATION = [
  { name: "Equities", value: 60, color: "#22c55e" },
  { name: "Fixed Income", value: 25, color: "#3b82f6" },
  { name: "Cash", value: 5, color: "#f0c040" },
  { name: "Alternatives", value: 10, color: "#8b5cf6" },
];

const PROJECTED_WEALTH = [
  { year: "2026", value: 1200000, target: 1100000 },
  { year: "2030", value: 1650000, target: 1500000 },
  { year: "2035", value: 2400000, target: 2100000 },
  { year: "2040", value: 3500000, target: 3000000 },
  { year: "2045", value: 4800000, target: 4200000 },
];

const RISK_DATA = [
  { subject: 'Market Risk', A: 120, B: 110, fullMark: 150 },
  { subject: 'Inflation', A: 98, B: 130, fullMark: 150 },
  { subject: 'Longevity', A: 86, B: 130, fullMark: 150 },
  { subject: 'Tax Rate', A: 99, B: 100, fullMark: 150 },
  { subject: 'Sequence', A: 85, B: 90, fullMark: 150 },
  { subject: 'Liquidity', A: 65, B: 85, fullMark: 150 },
];

const INCOME_SOURCES = [
  { month: 'Jan', pension: 4000, socialSecurity: 2500, investments: 1500, annuity: 1000 },
  { month: 'Feb', pension: 4000, socialSecurity: 2500, investments: 1600, annuity: 1000 },
  { month: 'Mar', pension: 4000, socialSecurity: 2500, investments: 1400, annuity: 1000 },
  { month: 'Apr', pension: 4000, socialSecurity: 2500, investments: 1700, annuity: 1000 },
  { month: 'May', pension: 4000, socialSecurity: 2500, investments: 1500, annuity: 1000 },
  { month: 'Jun', pension: 4000, socialSecurity: 2500, investments: 1800, annuity: 1000 },
];

const TAX_PROJECTION = [
  { year: '2026', current: 45000, proposed: 38000 },
  { year: '2027', current: 48000, proposed: 35000 },
  { year: '2028', current: 52000, proposed: 32000 },
  { year: '2029', current: 55000, proposed: 29000 },
  { year: '2030', current: 60000, proposed: 25000 },
];

const TRANSACTIONS = [
  { id: "t1", date: "2026-04-10", description: "Monthly Contribution", amount: 2500, type: "deposit", account: "Brokerage" },
  { id: "t2", date: "2026-04-05", description: "Dividend Payment", amount: 450.25, type: "income", account: "IRA" },
  { id: "t3", date: "2026-04-01", description: "Advisory Fee", amount: -150, type: "fee", account: "Brokerage" },
  { id: "t4", date: "2026-03-28", description: "Rebalancing Trade", amount: 0, type: "trade", account: "Roth IRA" },
  { id: "t5", date: "2026-03-15", description: "Monthly Contribution", amount: 2500, type: "deposit", account: "Brokerage" },
];

const PERFORMANCE_METRICS = [
  { metric: "YTD Return", value: "+4.2%", benchmark: "+3.8%", status: "positive" },
  { metric: "1 Year Return", value: "+12.5%", benchmark: "+10.2%", status: "positive" },
  { metric: "3 Year Ann.", value: "+8.7%", benchmark: "+7.5%", status: "positive" },
  { metric: "Risk Score", value: "65", benchmark: "60-70", status: "neutral" },
  { metric: "Max Drawdown", value: "-14.2%", benchmark: "-18.5%", status: "positive" },
  { metric: "Sharpe Ratio", value: "1.2", benchmark: "0.9", status: "positive" },
];

export default function ClientPortal() {
  const { user } = useAuth();
  const [clientName] = useState("Robert & Sarah Johnson");
  const [activeTab, setActiveTab] = useState("progress");
  const [searchQuery, setSearchQuery] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [timeRange, setTimeRange] = useState("ytd");
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  
  const { data: clientsData } = trpc.clients.list.useQuery();
  const { data: portalData } = trpc.clientPortal.getSettings.useQuery();
  const { data: docsData } = trpc.documentVault.list.useQuery();
  const { data: meetingsData } = trpc.meetings.list.useQuery();
  const { data: goalsData } = trpc.goals.list.useQuery();
  const { data: teamData } = trpc.team.members.useQuery();
  const { data: complianceData } = trpc.complianceTracking.getStatus.useQuery();
  const { data: riskData } = trpc.riskProfile.get.useQuery();

  const completedMilestones = MILESTONES.filter((m) => m.status === "completed").length;
  const progressPercent = Math.round((completedMilestones / MILESTONES.length) * 100);
  const actionRequired = SAMPLE_DOCUMENTS.filter((d) => d.status === "action-required").length;

  const filteredDocuments = useMemo(() => {
    if (!searchQuery) return SAMPLE_DOCUMENTS;
    return SAMPLE_DOCUMENTS.filter((doc) => 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleExportCSV = () => {
    setIsExporting(true);
    setTimeout(() => {
      toast.success("Documents exported to CSV successfully");
      setIsExporting(false);
    }, 1000);
  };

  const handleCompleteAction = (docName: string) => {
    toast.success(`Action initiated for ${docName}`);
  };

  const handleAcknowledge = () => {
    setShowDisclaimer(false);
    toast.success("Disclaimer acknowledged");
  };

  const handleContactAdvisor = () => {
    setActiveTab("messages");
    toast.info("Opening secure message to your advisor");
  };

  const handleScheduleMeeting = () => {
    toast.success("Opening meeting scheduler");
  };

  const handleUpdateProfile = () => {
    toast.success("Opening profile editor");
  };

  const handleViewStatement = (id: string) => {
    toast.success(`Opening statement ${id}`);
  };

  return (
    <AppShell>
      <div className="space-y-6 p-6 pb-24">
        {/* Page Header */}
        <div className="rc-page-header flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#0d1a2e] border border-[#12233e] flex items-center justify-center">
                <User className="h-6 w-6 text-[#22c55e]" />
              </div>
              <div>
                <h1 className="rc-page-title text-2xl font-bold text-white">Client Portal Preview</h1>
                <p className="rc-page-subtitle text-[#7a95b8] mt-1">
                  White-labeled client-facing view with document sharing, plan progress, and secure messaging
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="rc-badge bg-[#0d1a2e] border-[#12233e] text-[#7a95b8] flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm">
              <Eye className="h-4 w-4" /> Preview Mode
            </span>
            <ExportToSlides
              toolName="Client Portal"
              getSections={() => [
                {
                  title: "Client Portal Summary",
                  items: [
                    { label: "Client Name", value: clientName },
                    { label: "Plan Progress", value: `${progressPercent}%` },
                    { label: "Completed Milestones", value: `${completedMilestones}/${MILESTONES.length}` },
                    { label: "Action Required Items", value: actionRequired.toString() }
                  ]
                }
              ]}
            />
          </div>
        </div>

        {showDisclaimer && (
          <div className="bg-[#f0c040]/10 border border-[#f0c040]/30 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-[#f0c040] shrink-0 mt-0.5" />
              <div>
                <h3 className="text-[#f0c040] font-medium text-sm">Important Account Update</h3>
                <p className="text-[#c8d8ec] text-xs mt-1">Please review the updated terms of service and privacy policy for your account.</p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setShowDisclaimer(false)} className="text-xs text-[#7a95b8] hover:text-white px-3 py-1.5 transition-colors">Dismiss</button>
              <button onClick={handleAcknowledge} className="bg-[#f0c040] text-[#060d19] text-xs font-medium px-3 py-1.5 rounded hover:bg-[#f0c040]/90 transition-colors">Acknowledge</button>
            </div>
          </div>
        )}

        {/* Welcome Banner */}
        <div className="rc-card bg-gradient-to-r from-[#0d1a2e] to-[#060d19] border-[#22c55e]/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#22c55e]/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Welcome back, {clientName}</h2>
              <p className="text-[#c8d8ec] mb-4">Your comprehensive financial plan is <span className="text-[#22c55e] font-semibold">{progressPercent}%</span> complete</p>
              <div className="w-full sm:w-80 h-2 bg-[#060d19] rounded-full overflow-hidden border border-[#12233e]">
                <div 
                  className="h-full bg-[#22c55e] transition-all duration-1000 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            {actionRequired > 0 && (
              <div className="bg-[#f0c040]/10 border border-[#f0c040]/20 rounded-xl p-4 flex items-start gap-3 max-w-sm">
                <AlertCircle className="h-5 w-5 text-[#f0c040] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-[#f0c040] font-semibold text-sm mb-1">Action Required</h3>
                  <p className="text-[#c8d8ec] text-sm">You have {actionRequired} documents that require your attention or signature.</p>
                  <button 
                    onClick={() => setActiveTab("documents")}
                    className="mt-2 text-[#f0c040] text-sm font-medium hover:underline flex items-center gap-1"
                  >
                    View documents <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rc-card hover:border-[#22c55e]/50 transition-colors group cursor-pointer" onClick={() => setActiveTab("progress")}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-[#22c55e]/10 text-[#22c55e] group-hover:scale-110 transition-transform">
                <Target className="h-5 w-5" />
              </div>
              <span className="rc-stat-label text-[#7a95b8] font-medium">Plan Progress</span>
            </div>
            <div className="rc-stat-value text-3xl font-bold text-white mb-1">{progressPercent}%</div>
            <div className="text-sm text-[#7a95b8]">{completedMilestones} of {MILESTONES.length} milestones</div>
          </div>
          
          <div className="rc-card hover:border-[#3b82f6]/50 transition-colors group cursor-pointer" onClick={() => setActiveTab("documents")}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-[#3b82f6]/10 text-[#3b82f6] group-hover:scale-110 transition-transform">
                <FileText className="h-5 w-5" />
              </div>
              <span className="rc-stat-label text-[#7a95b8] font-medium">Documents</span>
            </div>
            <div className="rc-stat-value text-3xl font-bold text-white mb-1">{SAMPLE_DOCUMENTS.length}</div>
            <div className="text-sm text-[#7a95b8]">{SAMPLE_DOCUMENTS.filter((d) => d.status === "ready").length} ready to view</div>
          </div>
          
          <div className="rc-card hover:border-[#f0c040]/50 transition-colors group cursor-pointer" onClick={handleScheduleMeeting}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-[#f0c040]/10 text-[#f0c040] group-hover:scale-110 transition-transform">
                <Calendar className="h-5 w-5" />
              </div>
              <span className="rc-stat-label text-[#7a95b8] font-medium">Next Meeting</span>
            </div>
            <div className="rc-stat-value text-2xl font-bold text-white mb-1">May 1, 2026</div>
            <div className="text-sm text-[#7a95b8]">Plan Presentation</div>
          </div>
          
          <div className="rc-card hover:border-[#8b5cf6]/50 transition-colors group cursor-pointer" onClick={() => setActiveTab("overview")}>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-[#8b5cf6]/10 text-[#8b5cf6] group-hover:scale-110 transition-transform">
                <DollarSign className="h-5 w-5" />
              </div>
              <span className="rc-stat-label text-[#7a95b8] font-medium">Total Wealth</span>
            </div>
            <div className="rc-stat-value text-2xl font-bold text-white mb-1">$1.2M</div>
            <div className="text-sm text-[#22c55e] flex items-center gap-1"><TrendingUp className="h-3 w-3" /> +4.2% YTD</div>
          </div>
        </div>

        {/* Custom Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-[#12233e] pb-px">
          {[
            { id: "progress", label: "Plan Journey", icon: TrendingUp },
            { id: "overview", label: "Wealth Overview", icon: Activity },
            { id: "accounts", label: "Accounts & Activity", icon: Briefcase },
            { id: "documents", label: "Vault", icon: Lock, badge: actionRequired },
            { id: "messages", label: "Messages", icon: MessageSquare, badge: 2 },
            { id: "settings", label: "Settings", icon: Settings }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id 
                  ? "border-[#22c55e] text-[#22c55e]" 
                  : "border-transparent text-[#7a95b8] hover:text-[#c8d8ec] hover:border-[#12233e]"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.badge ? (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  tab.id === "documents" && actionRequired > 0 
                    ? "bg-[#f0c040] text-[#060d19]" 
                    : "bg-[#3b82f6] text-white"
                }`}>
                  {tab.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="min-h-[400px]">
          {/* Progress Tab */}
          {activeTab === "progress" && (
            <div className="space-y-6">
              <div className="rc-card">
                <div className="mb-6 flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-white">Your Financial Plan Journey</h3>
                    <p className="text-[#7a95b8] text-sm mt-1">Track the development and implementation of your comprehensive strategy</p>
                  </div>
                  <button onClick={handleScheduleMeeting} className="rc-btn rc-btn-primary text-sm px-4 py-2 bg-[#22c55e] text-[#060d19] hover:bg-[#22c55e]/90 rounded-lg font-medium">
                    Schedule Check-in
                  </button>
                </div>
                
                <div className="space-y-0">
                  {MILESTONES.map((milestone, i) => (
                    <div key={milestone.id} className="flex group">
                      <div className="flex flex-col items-center mr-6">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 z-10 transition-colors ${
                          milestone.status === "completed" ? "bg-[#22c55e]/20 border-[#22c55e] text-[#22c55e]" :
                          milestone.status === "in-progress" ? "bg-[#3b82f6]/20 border-[#3b82f6] text-[#3b82f6]" : 
                          "bg-[#060d19] border-[#12233e] text-[#7a95b8]"
                        }`}>
                          {milestone.status === "completed" ? (
                            <CheckCircle2 className="h-5 w-5" />
                          ) : milestone.status === "in-progress" ? (
                            <Clock className="h-5 w-5" />
                          ) : (
                            <span className="text-sm font-bold">{i + 1}</span>
                          )}
                        </div>
                        {i < MILESTONES.length - 1 && (
                          <div className={`w-0.5 h-full min-h-[40px] my-1 ${
                            milestone.status === "completed" ? "bg-[#22c55e]/50" : "bg-[#12233e]"
                          }`} />
                        )}
                      </div>
                      <div className={`flex-1 pb-8 pt-1 ${milestone.status === "upcoming" ? "opacity-60" : ""}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-1">
                          <h4 className="text-base font-semibold text-white">{milestone.title}</h4>
                          <span className={`rc-badge text-xs px-2 py-0.5 rounded-full border ${
                            milestone.status === "completed" ? "bg-[#22c55e]/10 border-[#22c55e]/30 text-[#22c55e]" :
                            milestone.status === "in-progress" ? "bg-[#3b82f6]/10 border-[#3b82f6]/30 text-[#3b82f6]" :
                            "bg-[#060d19] border-[#12233e] text-[#7a95b8]"
                          }`}>
                            {milestone.status === "completed" ? "Completed" : 
                             milestone.status === "in-progress" ? "In Progress" : "Upcoming"}
                          </span>
                        </div>
                        <p className="text-[#c8d8ec] text-sm mb-2">{milestone.description}</p>
                        <div className="flex items-center gap-1.5 text-xs text-[#7a95b8]">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(milestone.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                        </div>
                        
                        {milestone.status === "in-progress" && (
                          <div className="mt-3 p-3 bg-[#3b82f6]/5 border border-[#3b82f6]/20 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs text-[#c8d8ec] font-medium">Current Step: Reviewing IUL Options</span>
                              <span className="text-xs text-[#3b82f6] font-medium">60%</span>
                            </div>
                            <div className="w-full h-1.5 bg-[#060d19] rounded-full overflow-hidden">
                              <div className="h-full bg-[#3b82f6] w-[60%] rounded-full" />
                            </div>
                            <button onClick={() => setActiveTab("documents")} className="mt-2 text-xs text-[#3b82f6] hover:underline flex items-center gap-1">
                              View related documents <ChevronRight className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rc-card">
                  <h3 className="text-lg font-bold text-white mb-4">Risk Profile</h3>
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={RISK_DATA}>
                        <PolarGrid stroke="#12233e" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#7a95b8', fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                        <Radar name="Your Profile" dataKey="A" stroke="#22c55e" fill="#22c55e" fillOpacity={0.4} />
                        <Radar name="Target" dataKey="B" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                        <Legend wrapperStyle={{ fontSize: '12px', color: '#c8d8ec' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', borderRadius: '8px', color: '#fff' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 text-center">
                    <span className="text-sm text-[#c8d8ec]">Overall Risk Score: <strong className="text-[#22c55e] text-lg">65</strong> (Moderate)</span>
                  </div>
                </div>
                
                <div className="rc-card">
                  <h3 className="text-lg font-bold text-white mb-4">Key Objectives</h3>
                  <div className="space-y-4">
                    {[
                      { title: "Retire by 62", progress: 75, color: "bg-[#22c55e]" },
                      { title: "Fund Grandchildren's College", progress: 40, color: "bg-[#3b82f6]" },
                      { title: "Pay off Mortgage", progress: 90, color: "bg-[#8b5cf6]" },
                      { title: "Leave Legacy to Charity", progress: 20, color: "bg-[#f0c040]" }
                    ].map((goal, i) => (
                      <div key={i}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-[#c8d8ec]">{goal.title}</span>
                          <span className="text-xs text-[#7a95b8]">{goal.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-[#060d19] border border-[#12233e] rounded-full overflow-hidden">
                          <div className={`h-full ${goal.color}`} style={{ width: `${goal.progress}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-6 py-2 border border-[#12233e] rounded-lg text-sm text-[#7a95b8] hover:bg-[#12233e] hover:text-white transition-colors">
                    Review All Goals
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rc-card flex flex-col">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-white">Projected Wealth Growth</h3>
                  <p className="text-[#7a95b8] text-sm mt-1">Estimated trajectory based on current plan</p>
                </div>
                <div className="h-[300px] w-full mt-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={PROJECTED_WEALTH} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                      <XAxis dataKey="year" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                      <YAxis stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} dx={-10} />
                      <Tooltip 
                        cursor={{ fill: '#12233e', opacity: 0.4 }}
                        contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', borderRadius: '8px', color: '#fff' }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', color: '#c8d8ec' }} />
                      <Bar dataKey="value" name="Projected Wealth" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      <Line type="monotone" dataKey="target" name="Target Goal" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rc-card flex flex-col">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-white">Target Asset Allocation</h3>
                  <p className="text-[#7a95b8] text-sm mt-1">Recommended portfolio distribution</p>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={ASSET_ALLOCATION}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                        >
                          {ASSET_ALLOCATION.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', borderRadius: '8px', color: '#fff' }}
                          itemStyle={{ fontWeight: 'bold' }}
                          formatter={(value: number) => [`${value}%`, 'Allocation']}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          iconType="circle"
                          wrapperStyle={{ fontSize: '12px', color: '#c8d8ec' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="rc-card flex flex-col">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-white">Projected Retirement Income</h3>
                  <p className="text-[#7a95b8] text-sm mt-1">Monthly income sources during retirement</p>
                </div>
                <div className="h-[250px] w-full mt-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={INCOME_SOURCES} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                      <XAxis dataKey="month" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', borderRadius: '8px', color: '#fff' }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', color: '#c8d8ec' }} />
                      <Area type="monotone" dataKey="pension" stackId="1" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} name="Pension" />
                      <Area type="monotone" dataKey="socialSecurity" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Social Security" />
                      <Area type="monotone" dataKey="investments" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} name="Investments" />
                      <Area type="monotone" dataKey="annuity" stackId="1" stroke="#f0c040" fill="#f0c040" fillOpacity={0.6} name="Annuity" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rc-card flex flex-col">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-white">Tax Optimization Strategy</h3>
                  <p className="text-[#7a95b8] text-sm mt-1">Projected tax savings with Roth conversions</p>
                </div>
                <div className="h-[250px] w-full mt-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={TAX_PROJECTION} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                      <XAxis dataKey="year" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                      <Tooltip 
                        cursor={{ fill: '#12233e', opacity: 0.4 }}
                        contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', borderRadius: '8px', color: '#fff' }}
                        formatter={(value: number) => [`$${value.toLocaleString()}`, 'Taxes']}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', color: '#c8d8ec' }} />
                      <Bar dataKey="current" name="Current Strategy" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={30} />
                      <Bar dataKey="proposed" name="Proposed Strategy" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={30} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rc-card lg:col-span-2">
                <div className="mb-6 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-white">Performance Metrics</h3>
                    <p className="text-[#7a95b8] text-sm mt-1">Key indicators of your portfolio health</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 text-xs bg-[#12233e] text-white rounded hover:bg-[#1e3a5f]">YTD</button>
                    <button className="px-3 py-1 text-xs text-[#7a95b8] hover:text-white rounded">1Y</button>
                    <button className="px-3 py-1 text-xs text-[#7a95b8] hover:text-white rounded">3Y</button>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#12233e]">
                        <th className="pb-3 px-4 font-medium text-[#7a95b8] text-sm">Metric</th>
                        <th className="pb-3 px-4 font-medium text-[#7a95b8] text-sm">Your Portfolio</th>
                        <th className="pb-3 px-4 font-medium text-[#7a95b8] text-sm">Benchmark</th>
                        <th className="pb-3 px-4 font-medium text-[#7a95b8] text-sm">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#12233e]">
                      {PERFORMANCE_METRICS.map((metric, i) => (
                        <tr key={i} className="hover:bg-[#060d19]/50 transition-colors">
                          <td className="py-3 px-4 text-sm font-medium text-white">{metric.metric}</td>
                          <td className="py-3 px-4 text-sm font-bold text-white">{metric.value}</td>
                          <td className="py-3 px-4 text-sm text-[#7a95b8]">{metric.benchmark}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              metric.status === 'positive' ? 'bg-[#22c55e]/10 text-[#22c55e]' :
                              metric.status === 'negative' ? 'bg-[#ef4444]/10 text-[#ef4444]' :
                              'bg-[#f0c040]/10 text-[#f0c040]'
                            }`}>
                              {metric.status === 'positive' ? 'On Track' : metric.status === 'negative' ? 'Needs Attention' : 'Monitoring'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rc-card lg:col-span-2">
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-white">Your Advisory Team</h3>
                  <p className="text-[#7a95b8] text-sm mt-1">Dedicated professionals managing your wealth</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { name: "Michael Russell", role: "Lead Advisor", email: "michael@russellcapital.com", color: "bg-[#22c55e]/20 text-[#22c55e]" },
                    { name: "Sarah Jenkins", role: "Tax Strategist", email: "sarah@russellcapital.com", color: "bg-[#3b82f6]/20 text-[#3b82f6]" },
                    { name: "David Chen", role: "Estate Attorney", email: "david@russellcapital.com", color: "bg-[#8b5cf6]/20 text-[#8b5cf6]" },
                    { name: "Elena Rodriguez", role: "Client Success", email: "elena@russellcapital.com", color: "bg-[#f0c040]/20 text-[#f0c040]" },
                  ].map((member) => (
                    <div key={member.name} className="bg-[#060d19] border border-[#12233e] rounded-xl p-4 text-center hover:border-[#3b82f6]/30 transition-colors">
                      <div className={`w-14 h-14 rounded-full ${member.color} flex items-center justify-center mx-auto mb-3 text-lg font-bold border border-current/20`}>
                        {member.name.split(" ").map((w) => w[0]).join("")}
                      </div>
                      <div className="font-semibold text-white text-sm">{member.name}</div>
                      <div className="text-xs text-[#22c55e] font-medium mt-1 mb-3">{member.role}</div>
                      <button onClick={handleContactAdvisor} className="rc-btn rc-btn-ghost w-full text-xs py-1.5 border border-[#12233e] hover:bg-[#12233e] rounded-lg text-[#c8d8ec]">
                        Contact
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Accounts Tab */}
          {activeTab === "accounts" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 rc-card">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-white">Recent Activity</h3>
                    <select 
                      value={selectedAccount}
                      onChange={(e) => setSelectedAccount(e.target.value)}
                      className="bg-[#060d19] border border-[#12233e] text-sm text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-[#3b82f6]"
                    >
                      <option value="all">All Accounts</option>
                      <option value="brokerage">Brokerage</option>
                      <option value="ira">IRA</option>
                      <option value="roth">Roth IRA</option>
                    </select>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#12233e]">
                          <th className="pb-3 px-4 font-medium text-[#7a95b8] text-sm">Date</th>
                          <th className="pb-3 px-4 font-medium text-[#7a95b8] text-sm">Description</th>
                          <th className="pb-3 px-4 font-medium text-[#7a95b8] text-sm">Account</th>
                          <th className="pb-3 px-4 font-medium text-[#7a95b8] text-sm text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#12233e]">
                        {TRANSACTIONS.map((tx) => (
                          <tr key={tx.id} className="hover:bg-[#060d19]/50 transition-colors">
                            <td className="py-3 px-4 text-sm text-[#c8d8ec]">{new Date(tx.date).toLocaleDateString()}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${
                                  tx.type === 'deposit' ? 'bg-[#22c55e]' :
                                  tx.type === 'income' ? 'bg-[#3b82f6]' :
                                  tx.type === 'fee' ? 'bg-[#ef4444]' : 'bg-[#7a95b8]'
                                }`} />
                                <span className="text-sm font-medium text-white">{tx.description}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-[#7a95b8]">{tx.account}</td>
                            <td className={`py-3 px-4 text-sm font-medium text-right ${
                              tx.amount > 0 ? 'text-[#22c55e]' : tx.amount < 0 ? 'text-[#ef4444]' : 'text-[#7a95b8]'
                            }`}>
                              {tx.amount > 0 ? '+' : ''}{tx.amount === 0 ? '-' : `$${Math.abs(tx.amount).toFixed(2)}`}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 text-center">
                    <button className="text-sm text-[#3b82f6] hover:underline">View All Transactions</button>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="rc-card">
                    <h3 className="text-lg font-bold text-white mb-4">Account Summary</h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-[#060d19] border border-[#12233e] rounded-lg hover:border-[#3b82f6]/50 transition-colors cursor-pointer">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-white">Joint Brokerage</span>
                          <span className="text-sm font-bold text-white">$650,000</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-[#7a95b8]">...4592</span>
                          <span className="text-xs text-[#22c55e]">+2.4% YTD</span>
                        </div>
                      </div>
                      <div className="p-3 bg-[#060d19] border border-[#12233e] rounded-lg hover:border-[#3b82f6]/50 transition-colors cursor-pointer">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-white">Robert's IRA</span>
                          <span className="text-sm font-bold text-white">$350,000</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-[#7a95b8]">...8831</span>
                          <span className="text-xs text-[#22c55e]">+5.1% YTD</span>
                        </div>
                      </div>
                      <div className="p-3 bg-[#060d19] border border-[#12233e] rounded-lg hover:border-[#3b82f6]/50 transition-colors cursor-pointer">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-white">Sarah's Roth IRA</span>
                          <span className="text-sm font-bold text-white">$200,000</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-[#7a95b8]">...1124</span>
                          <span className="text-xs text-[#22c55e]">+6.8% YTD</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="rc-card">
                    <h3 className="text-lg font-bold text-white mb-4">Statements & Tax Forms</h3>
                    <div className="space-y-2">
                      <button onClick={() => handleViewStatement('Q1-2026')} className="w-full flex items-center justify-between p-2 hover:bg-[#060d19] rounded-lg transition-colors group">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-[#7a95b8] group-hover:text-[#3b82f6]" />
                          <span className="text-sm text-[#c8d8ec] group-hover:text-white">Q1 2026 Statement</span>
                        </div>
                        <Download className="h-4 w-4 text-[#7a95b8] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                      <button onClick={() => handleViewStatement('1099-2025')} className="w-full flex items-center justify-between p-2 hover:bg-[#060d19] rounded-lg transition-colors group">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-[#7a95b8] group-hover:text-[#3b82f6]" />
                          <span className="text-sm text-[#c8d8ec] group-hover:text-white">2025 1099 Consolidated</span>
                        </div>
                        <Download className="h-4 w-4 text-[#7a95b8] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                      <button onClick={() => setActiveTab('documents')} className="w-full text-center mt-2 text-sm text-[#3b82f6] hover:underline">
                        View All in Vault
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === "documents" && (
            <div className="space-y-6">
              {actionRequired > 0 && (
                <div className="rc-card border-[#f0c040]/30 bg-gradient-to-b from-[#f0c040]/5 to-transparent">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertCircle className="h-5 w-5 text-[#f0c040]" />
                    <h3 className="text-lg font-bold text-white">Action Required</h3>
                  </div>
                  <div className="space-y-3">
                    {SAMPLE_DOCUMENTS.filter((d) => d.status === "action-required").map((doc) => (
                      <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-[#060d19] border border-[#f0c040]/20 gap-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-[#f0c040]/10 text-[#f0c040] shrink-0">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">{doc.name}</div>
                            <div className="text-xs text-[#7a95b8] mt-1">Due by {new Date(doc.date).toLocaleDateString()} &middot; {doc.type}</div>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleCompleteAction(doc.name)}
                          className="rc-btn bg-[#f0c040] text-[#060d19] hover:bg-[#f0c040]/90 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors"
                        >
                          Review & Sign
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rc-card">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white">Document Vault</h3>
                    <p className="text-[#7a95b8] text-sm mt-1">Secure access to all your financial documents</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7a95b8]" />
                      <input 
                        type="text"
                        placeholder="Search documents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="rc-input w-full bg-[#060d19] border border-[#12233e] rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-[#7a95b8] focus:outline-none focus:border-[#3b82f6] transition-colors"
                      />
                    </div>
                    <button 
                      onClick={handleExportCSV}
                      disabled={isExporting}
                      className="rc-btn rc-btn-ghost border border-[#12233e] p-2 rounded-lg text-[#c8d8ec] hover:bg-[#12233e] hover:text-white transition-colors"
                      title="Export List"
                    >
                      {isExporting ? <Clock className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {filteredDocuments.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-[#12233e] rounded-xl">
                    <div className="w-16 h-16 bg-[#060d19] rounded-full flex items-center justify-center mb-4 border border-[#12233e]">
                      <Search className="h-8 w-8 text-[#7a95b8]" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-1">No documents found</h3>
                    <p className="text-[#7a95b8] text-sm max-w-md">
                      We couldn't find any documents matching "{searchQuery}". Try adjusting your search terms.
                    </p>
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="mt-4 text-[#3b82f6] text-sm hover:underline"
                    >
                      Clear search
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#12233e]">
                          <th className="pb-3 px-4 font-medium text-[#7a95b8] text-sm">Document Name</th>
                          <th className="pb-3 px-4 font-medium text-[#7a95b8] text-sm hidden sm:table-cell">Category</th>
                          <th className="pb-3 px-4 font-medium text-[#7a95b8] text-sm hidden md:table-cell">Date Added</th>
                          <th className="pb-3 px-4 font-medium text-[#7a95b8] text-sm">Status</th>
                          <th className="pb-3 px-4 font-medium text-[#7a95b8] text-sm text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#12233e]">
                        {filteredDocuments.map((doc) => (
                          <tr key={doc.id} className="hover:bg-[#060d19]/50 transition-colors group">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <FileText className={`h-5 w-5 ${
                                  doc.type === 'PDF' ? 'text-[#ef4444]' : 'text-[#3b82f6]'
                                }`} />
                                <div>
                                  <div className="text-sm font-medium text-white group-hover:text-[#3b82f6] transition-colors cursor-pointer" onClick={() => handleViewStatement(doc.id)}>{doc.name}</div>
                                  <div className="text-xs text-[#7a95b8] sm:hidden mt-0.5">{doc.category} &middot; {new Date(doc.date).toLocaleDateString()}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 hidden sm:table-cell text-sm text-[#c8d8ec]">{doc.category}</td>
                            <td className="py-4 px-4 hidden md:table-cell text-sm text-[#c8d8ec]">{new Date(doc.date).toLocaleDateString()}</td>
                            <td className="py-4 px-4">
                              <span className={`rc-badge text-xs px-2.5 py-1 rounded-full border ${
                                doc.status === "ready" ? "bg-[#22c55e]/10 border-[#22c55e]/30 text-[#22c55e]" :
                                doc.status === "pending" ? "bg-[#7a95b8]/10 border-[#7a95b8]/30 text-[#7a95b8]" :
                                "bg-[#f0c040]/10 border-[#f0c040]/30 text-[#f0c040]"
                              }`}>
                                {doc.status === "ready" ? "Ready" : 
                                 doc.status === "pending" ? "Pending" : "Action Required"}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              {doc.status === "ready" ? (
                                <button onClick={() => handleViewStatement(doc.id)} className="p-2 text-[#7a95b8] hover:text-white hover:bg-[#12233e] rounded-lg transition-colors" title="View Document">
                                  <Eye className="h-4 w-4" />
                                </button>
                              ) : doc.status === "action-required" ? (
                                <button onClick={() => handleCompleteAction(doc.name)} className="text-xs font-medium text-[#f0c040] hover:underline">
                                  Review
                                </button>
                              ) : (
                                <span className="text-xs text-[#7a95b8] italic">Processing</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === "messages" && (
            <div className="rc-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white">Secure Communications</h3>
                  <p className="text-[#7a95b8] text-sm mt-1">End-to-end encrypted messaging with your team</p>
                </div>
                <button onClick={handleContactAdvisor} className="rc-btn rc-btn-primary bg-[#3b82f6] hover:bg-[#2563eb] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  New Message
                </button>
              </div>

              <div className="space-y-3">
                {[
                  { id: "m1", from: "Michael Russell", role: "Lead Advisor", date: "Mar 28, 2026", subject: "IUL Illustration Ready", preview: "Hi Robert & Sarah, I've uploaded the IUL illustration we discussed. Please review at your convenience...", unread: true },
                  { id: "m2", from: "Sarah Jenkins", role: "Tax Strategist", date: "Mar 25, 2026", subject: "Roth Conversion Analysis Complete", preview: "I've completed the Roth conversion analysis. The optimal strategy shows converting $80K/year...", unread: true },
                  { id: "m3", from: "Michael Russell", role: "Lead Advisor", date: "Mar 20, 2026", subject: "Annual Review Follow-Up", preview: "Thank you for meeting with us today. Here's a summary of what we discussed and next steps...", unread: false },
                  { id: "m4", from: "System", role: "Automated", date: "Mar 18, 2026", subject: "Risk Assessment Results", preview: "Your risk tolerance assessment has been completed. Score: 65 (Moderate). This will guide...", unread: false },
                  { id: "m5", from: "David Chen", role: "Estate Attorney", date: "Feb 15, 2026", subject: "Trust Documents for Review", preview: "The updated trust documents are ready for your review. Please let me know if you have any questions...", unread: false },
                ].map((msg) => (
                  <div key={msg.id} onClick={() => toast.info(`Viewing message: ${msg.subject}`)} className={`flex items-start gap-4 p-4 rounded-xl border transition-colors cursor-pointer ${
                    msg.unread 
                      ? "bg-[#3b82f6]/5 border-[#3b82f6]/30 hover:bg-[#3b82f6]/10" 
                      : "bg-[#060d19] border-[#12233e] hover:border-[#7a95b8]/30"
                  }`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border ${
                      msg.unread ? "bg-[#3b82f6]/20 text-[#3b82f6] border-[#3b82f6]/30" : "bg-[#12233e] text-[#7a95b8] border-transparent"
                    }`}>
                      {msg.from === "System" ? <Activity className="h-5 w-5" /> : msg.from.split(" ").map((w) => w[0]).join("").substring(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold text-sm ${msg.unread ? "text-white" : "text-[#c8d8ec]"}`}>{msg.from}</span>
                          <span className="text-xs text-[#7a95b8] hidden sm:inline-block">&middot; {msg.role}</span>
                          {msg.unread && <span className="rc-badge bg-[#3b82f6] text-white text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">New</span>}
                        </div>
                        <span className="text-xs text-[#7a95b8]">{msg.date}</span>
                      </div>
                      <div className={`text-sm mb-1 ${msg.unread ? "font-semibold text-[#c8d8ec]" : "font-medium text-[#7a95b8]"}`}>
                        {msg.subject}
                      </div>
                      <p className="text-sm text-[#7a95b8] truncate">{msg.preview}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <div className="rc-card">
                <h3 className="text-lg font-bold text-white mb-6">Account Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <User className="h-4 w-4 text-[#7a95b8]" /> Personal Information
                      </h4>
                      <div className="space-y-4">
                        <div className="bg-[#060d19] p-4 rounded-lg border border-[#12233e]">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs text-[#7a95b8]">Primary Client</span>
                            <button onClick={handleUpdateProfile} className="text-xs text-[#3b82f6] hover:underline">Edit</button>
                          </div>
                          <div className="text-sm text-white font-medium">Robert Johnson</div>
                          <div className="text-sm text-[#c8d8ec]">robert.j@example.com</div>
                          <div className="text-sm text-[#c8d8ec]">(555) 123-4567</div>
                        </div>
                        <div className="bg-[#060d19] p-4 rounded-lg border border-[#12233e]">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs text-[#7a95b8]">Co-Client</span>
                            <button onClick={handleUpdateProfile} className="text-xs text-[#3b82f6] hover:underline">Edit</button>
                          </div>
                          <div className="text-sm text-white font-medium">Sarah Johnson</div>
                          <div className="text-sm text-[#c8d8ec]">sarah.j@example.com</div>
                          <div className="text-sm text-[#c8d8ec]">(555) 987-6543</div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <Bell className="h-4 w-4 text-[#7a95b8]" /> Notifications
                      </h4>
                      <div className="space-y-3">
                        {[
                          { label: "New Documents", desc: "When a new document is added to your vault", active: true },
                          { label: "Messages", desc: "When you receive a new secure message", active: true },
                          { label: "Meeting Reminders", desc: "24 hours before a scheduled meeting", active: true },
                          { label: "Weekly Summary", desc: "Weekly portfolio performance update", active: false }
                        ].map((pref, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-[#060d19] border border-[#12233e] rounded-lg">
                            <div>
                              <div className="text-sm font-medium text-white">{pref.label}</div>
                              <div className="text-xs text-[#7a95b8]">{pref.desc}</div>
                            </div>
                            <button 
                              onClick={() => toast.success(`Notification preference updated`)}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${pref.active ? 'bg-[#22c55e]' : 'bg-[#12233e]'}`}
                            >
                              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${pref.active ? 'translate-x-5' : 'translate-x-1'}`} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-[#7a95b8]" /> Security
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-[#060d19] border border-[#12233e] rounded-lg">
                          <div>
                            <div className="text-sm font-medium text-white">Two-Factor Authentication</div>
                            <div className="text-xs text-[#22c55e] flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Enabled</div>
                          </div>
                          <button onClick={() => toast.info("Opening 2FA settings")} className="text-xs px-3 py-1.5 border border-[#12233e] rounded text-[#c8d8ec] hover:bg-[#12233e]">Manage</button>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-[#060d19] border border-[#12233e] rounded-lg">
                          <div>
                            <div className="text-sm font-medium text-white">Password</div>
                            <div className="text-xs text-[#7a95b8]">Last changed 3 months ago</div>
                          </div>
                          <button onClick={() => toast.info("Opening password change dialog")} className="text-xs px-3 py-1.5 border border-[#12233e] rounded text-[#c8d8ec] hover:bg-[#12233e]">Change</button>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-[#060d19] border border-[#12233e] rounded-lg">
                          <div>
                            <div className="text-sm font-medium text-white">Trusted Devices</div>
                            <div className="text-xs text-[#7a95b8]">2 devices recognized</div>
                          </div>
                          <button onClick={() => toast.info("Viewing trusted devices")} className="text-xs px-3 py-1.5 border border-[#12233e] rounded text-[#c8d8ec] hover:bg-[#12233e]">View</button>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-[#7a95b8]" /> Linked Accounts
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-[#060d19] border border-[#12233e] rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-white flex items-center justify-center font-bold text-[#060d19] text-xs">Fid</div>
                            <div>
                              <div className="text-sm font-medium text-white">Fidelity Investments</div>
                              <div className="text-xs text-[#22c55e]">Connected</div>
                            </div>
                          </div>
                          <button onClick={() => toast.info("Managing connection")} className="text-[#7a95b8] hover:text-white"><Settings className="h-4 w-4" /></button>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-[#060d19] border border-[#12233e] rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-[#0070ba] flex items-center justify-center font-bold text-white text-xs">Cha</div>
                            <div>
                              <div className="text-sm font-medium text-white">Chase Bank</div>
                              <div className="text-xs text-[#22c55e]">Connected</div>
                            </div>
                          </div>
                          <button onClick={() => toast.info("Managing connection")} className="text-[#7a95b8] hover:text-white"><Settings className="h-4 w-4" /></button>
                        </div>
                        <button onClick={() => toast.info("Opening account linking flow")} className="w-full py-2 border border-dashed border-[#3b82f6]/50 rounded-lg text-sm text-[#3b82f6] hover:bg-[#3b82f6]/10 transition-colors flex items-center justify-center gap-2">
                          <LinkIcon className="h-4 w-4" /> Link Another Institution
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <NAICDisclaimer variant="compact" showsProjections />
        
        <PageInsights pageId="client-portal" />
      </div>
    </AppShell>
  );
}
