// @ts-nocheck
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import {
  Shield,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowRight,
  Loader2,
  Search,
  Info,
  Activity,
  Clock,
  Users,
  PieChart as PieChartIcon,
  BarChart3,
  LineChart as LineChartIcon,
  Radar as RadarIcon,
  TrendingUp,
  ShieldCheck,
  Calendar,
  Download,
  RefreshCw,
  Eye,
  Settings,
  Key,
  FileCheck,
} from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

const generateMockData = () => {
  return Array.from({ length: 12 }).map((_, i) => ({
    name: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    value: Math.floor(Math.random() * 1000) + 500,
    uv: Math.floor(Math.random() * 500) + 100,
    pv: Math.floor(Math.random() * 800) + 200,
    amt: Math.floor(Math.random() * 1200) + 300,
  }));
};

const generateActivityData = () => {
  return Array.from({ length: 7 }).map((_, i) => ({
    day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
    logins: Math.floor(Math.random() * 20) + 5,
    views: Math.floor(Math.random() * 100) + 20,
    actions: Math.floor(Math.random() * 50) + 10,
  }));
};

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function SupervisorMonitoringAgreement() {
  const { user } = useAuth();

  const [signatureName, setSignatureName] = useState("");
  const [signatureDate, setSignatureDate] = useState(
    new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  );
  const [agreedTerms, setAgreedTerms] = useState<Record<string, boolean>>({});
  const [signing, setSigning] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [chartData, setChartData] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [radarData, setRadarData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const toggleSection = useCallback((section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  }, []);

  const handleRefresh = useCallback(() => {
    setChartData(generateMockData());
    setActivityData(generateActivityData());
    toast.success("Data refreshed successfully");
  }, []);

  useEffect(() => {
    setChartData(generateMockData());
    setActivityData(generateActivityData());
    
    setRadarData([
      { subject: 'Compliance', A: 120, B: 110, fullMark: 150 },
      { subject: 'Security', A: 98, B: 130, fullMark: 150 },
      { subject: 'Privacy', A: 86, B: 130, fullMark: 150 },
      { subject: 'Monitoring', A: 99, B: 100, fullMark: 150 },
      { subject: 'Access', A: 85, B: 90, fullMark: 150 },
      { subject: 'Audit', A: 65, B: 85, fullMark: 150 },
    ]);
    
    setPieData([
      { name: 'Compliant', value: 400 },
      { name: 'Pending', value: 300 },
      { name: 'Under Review', value: 300 },
      { name: 'Action Needed', value: 200 },
    ]);
  }, []);

  const agreementStatus = trpc.agency.checkAgreementStatus.useQuery();
  const { data: clientsData } = trpc.clients?.list?.useQuery(undefined, { enabled: false }) || { data: null };
  const { data: notesData } = trpc.notes?.list?.useQuery(undefined, { enabled: false }) || { data: null };
  const { data: activityDataQuery } = trpc.activity?.recent?.useQuery(undefined, { enabled: false }) || { data: null };
  const { data: dashboardData } = trpc.dashboard?.summary?.useQuery(undefined, { enabled: false }) || { data: null };
  
  const signMutation = trpc.agency.signMonitoringAgreement.useMutation({
    onSuccess: () => {
      toast.success("Agreement Signed — You now have full access to the platform.");
      agreementStatus.refetch();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const isLoading = !agreementStatus.data;

  if (isLoading) {
    return (
      <AppShell>
        <div className="min-h-[80vh] flex flex-col items-center justify-center">
          <Loader2 className="w-12 h-12 text-[#22c55e] animate-spin mb-4" />
          <div className="text-[#c8d8ec] animate-pulse font-medium">Verifying Agreement Status...</div>
        </div>
      </AppShell>
    );
  }

  const status = agreementStatus.data;
  
  const TERMS = [{ id: "monitoring", label: "I consent to my supervisor and the platform administrator monitoring my activity, including login times, pages visited, client records, and all platform interactions." },
,
    { id: "clientData", label: "I understand my supervisor may view all client data, lead information, and business activity associated with my account." },
,
    { id: "confidentiality", label: "I agree to maintain the confidentiality of all client data, proprietary strategies, and platform features." },
,
    { id: "compliance", label: "I agree to use the platform in accordance with all applicable laws, regulations, and industry standards." },
,
    { id: "dataProtection", label: "I understand all data is protected by enterprise-grade security and access is controlled by role permissions." }
];

  const filteredTerms = TERMS.filter((t) => t.label.toLowerCase().includes(searchQuery.toLowerCase()));
  const allTermsAgreed = TERMS.every(t => agreedTerms[t.id]);
  const agreedCount = TERMS.filter((t) => agreedTerms[t.id]).length;
  const progressPercentage = (agreedCount / TERMS.length) * 100;
  
  const canSign = allTermsAgreed && signatureName.trim().length >= 2 && signatureDate.trim().length > 0;

  const handleSign = async () => {
    if (!canSign || !status?.teamId) return;
    setSigning(true);
    try {
      await signMutation.mutateAsync({
        teamId: status.teamId,
        signatureName: signatureName.trim(),
        signatureDate: signatureDate.trim(),
      });
    } finally {
      setSigning(false);
    }
  };

  const toggleTerm = (id: string) => {
    setAgreedTerms(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const selectAllTerms = () => {
    const newTerms = { ...agreedTerms };
    TERMS.forEach((t) => {
      newTerms[t.id] = true;
    });
    setAgreedTerms(newTerms);
  };

  const clearAllTerms = () => {
    setAgreedTerms({});
  };

  const mockTablesData = {
    recentActivity: [
      { id: 1, action: "Login", time: "2 mins ago", ip: "192.168.1.1", status: "Success" },
      { id: 2, action: "View Client", time: "15 mins ago", ip: "192.168.1.1", status: "Success" },
      { id: 3, action: "Update Note", time: "1 hour ago", ip: "192.168.1.1", status: "Success" },
      { id: 4, action: "Export Data", time: "2 hours ago", ip: "192.168.1.1", status: "Warning" },
      { id: 5, action: "Failed Login", time: "1 day ago", ip: "10.0.0.5", status: "Failed" },
    ],
    complianceChecks: [
      { id: 1, check: "Data Privacy Training", date: "2023-10-15", result: "Pass", expiry: "2024-10-15" },
      { id: 2, check: "Security Audit", date: "2023-11-02", result: "Pass", expiry: "2024-05-02" },
      { id: 3, check: "Access Review", date: "2024-01-20", result: "Pass", expiry: "2024-07-20" },
      { id: 4, check: "Policy Acknowledgment", date: "2023-08-10", result: "Pass", expiry: "2024-08-10" },
    ],
    supervisorLogs: [
      { id: 1, supervisor: status?.supervisorName || "Admin", action: "Review Account", date: "2024-02-15", notes: "Routine check" },
      { id: 2, supervisor: status?.supervisorName || "Admin", action: "Approve Access", date: "2024-01-10", notes: "Initial setup" },
      { id: 3, supervisor: "System", action: "Automated Scan", date: "2024-02-20", notes: "No issues found" },
    ],
    teamMembers: [
      { id: 1, name: "John Doe", role: "Agent", status: "Active", lastActive: "Today" },
      { id: 2, name: "Jane Smith", role: "Agent", status: "Active", lastActive: "Yesterday" },
      { id: 3, name: "Mike Johnson", role: "Trainee", status: "Pending", lastActive: "Never" },
      { id: 4, name: "Sarah Williams", role: "Agent", status: "Active", lastActive: "Today" },
    ],
    systemAlerts: [
      { id: 1, severity: "Low", message: "New login from recognized device", time: "2024-02-21 08:30" },
      { id: 2, severity: "Medium", message: "Unusual export volume detected", time: "2024-02-20 14:15" },
      { id: 3, severity: "Info", message: "System maintenance scheduled", time: "2024-02-19 10:00" },
    ],
    accessPermissions: [
      { id: 1, resource: "Client Records", level: "Read/Write", condition: "Supervised" },
      { id: 2, resource: "Financial Data", level: "Read Only", condition: "Restricted" },
      { id: 3, resource: "Export Functions", level: "None", condition: "Requires Approval" },
      { id: 4, resource: "Team Reports", level: "Read Only", condition: "Standard" },
    ]
  };

  if (!status?.isDownlineAgent || status.agreementSigned) {
    return (
      <AppShell>
        <div className="max-w-7xl mx-auto space-y-6 pb-20">
          <div className="rc-page-header">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#0d1a2e] rounded-xl border border-[#12233e]">
                <Shield className="w-8 h-8 text-[#22c55e]" />
              </div>
              <div>
                <h1 className="rc-page-title">Monitoring Agreement</h1>
                <p className="rc-page-subtitle">Platform Access Authorization & Activity Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleRefresh}
                className="p-2 bg-[#060d19] border border-[#12233e] rounded-lg hover:bg-[#0d1a2e] transition-colors text-[#c8d8ec]"
                title="Refresh Data"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <ExportToSlides
                toolName="Monitoring Agreement"
                getSections={() => [
                  {
                    title: "Agreement Status",
                    items: [
                      { label: "Status", value: "Signed / Access Granted" },
                      { label: "Team", value: status?.teamName || "N/A" },
                      { label: "Supervisor", value: status?.supervisorName || "N/A" }
                    ]
                  }
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="rc-card bg-[#060d19] border-[#22c55e]/30 flex flex-col items-center justify-center py-8 text-center md:col-span-1 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#22c55e]/10 rounded-full blur-2xl -mr-8 -mt-8 transition-transform group-hover:scale-110 duration-500"></div>
              <div className="w-16 h-16 bg-[#22c55e]/10 rounded-full flex items-center justify-center mb-4 relative z-10">
                <CheckCircle2 className="w-8 h-8 text-[#22c55e]" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2 relative z-10">Access Granted</h2>
              <p className="text-[#c8d8ec] text-sm relative z-10">
                {status?.isDownlineAgent
                  ? "Agreement active"
                  : "No agreement required"}
              </p>
            </div>
            
            <div className="rc-card bg-[#060d19] p-6 flex flex-col justify-center md:col-span-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <div className="text-sm text-[#7a95b8] flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Supervisor</div>
                  <div className="font-medium text-white text-lg">{status?.supervisorName || "N/A"}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-[#7a95b8] flex items-center gap-2"><Users className="w-4 h-4" /> Team</div>
                  <div className="font-medium text-white text-lg">{status?.teamName || "N/A"}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm text-[#7a95b8] flex items-center gap-2"><Calendar className="w-4 h-4" /> Status</div>
                  <div className="font-medium text-[#22c55e] text-lg flex items-center gap-2">Active <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse"></div></div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-[#12233e] overflow-x-auto no-scrollbar">
            <button
              onClick={() => handleTabChange("overview")}
              className={`px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === "overview" ? "border-[#22c55e] text-[#22c55e]" : "border-transparent text-[#7a95b8] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2"><Activity className="w-4 h-4" /> Activity Overview</div>
            </button>
            <button
              onClick={() => handleTabChange("compliance")}
              className={`px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === "compliance" ? "border-[#22c55e] text-[#22c55e]" : "border-transparent text-[#7a95b8] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2"><Shield className="w-4 h-4" /> Compliance & Security</div>
            </button>
            <button
              onClick={() => handleTabChange("logs")}
              className={`px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === "logs" ? "border-[#22c55e] text-[#22c55e]" : "border-transparent text-[#7a95b8] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2"><FileText className="w-4 h-4" /> Audit Logs</div>
            </button>
            <button
              onClick={() => handleTabChange("details")}
              className={`px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                activeTab === "details" ? "border-[#22c55e] text-[#22c55e]" : "border-transparent text-[#7a95b8] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2"><Info className="w-4 h-4" /> Agreement Details</div>
            </button>
          </div>

          {activeTab === "overview" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart 1: Area Chart */}
                <div className="rc-card flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-[#3b82f6]" />
                      Platform Usage Trends
                    </h3>
                    <select className="bg-[#060d19] border border-[#12233e] text-sm text-[#c8d8ec] rounded-lg px-3 py-1 outline-none">
                      <option>Last 30 Days</option>
                      <option>Last 3 Months</option>
                      <option>Year to Date</option>
                    </select>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                        <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }}
                          itemStyle={{ color: '#c8d8ec' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                        <Area type="monotone" dataKey="uv" name="Client Views" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUv)" />
                        <Area type="monotone" dataKey="pv" name="Actions Taken" stroke="#22c55e" fillOpacity={1} fill="url(#colorPv)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Bar Chart */}
                <div className="rc-card flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-[#f59e0b]" />
                      Weekly Activity Breakdown
                    </h3>
                    <button className="text-[#7a95b8] hover:text-white transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={activityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                        <XAxis dataKey="day" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                          cursor={{ fill: '#12233e', opacity: 0.4 }}
                          contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                        <Bar dataKey="logins" name="Logins" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="views" name="Page Views" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="actions" name="Updates" fill="#ec4899" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Table 1: Recent Activity */}
              <div className="rc-card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#22c55e]" />
                    Recent Monitored Activity
                  </h3>
                  <button className="text-sm text-[#3b82f6] hover:text-[#60a5fa] transition-colors flex items-center gap-1">
                    View Full Log <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#12233e]">
                        <th className="py-3 px-4 text-sm font-medium text-[#7a95b8]">Action</th>
                        <th className="py-3 px-4 text-sm font-medium text-[#7a95b8]">Time</th>
                        <th className="py-3 px-4 text-sm font-medium text-[#7a95b8]">IP Address</th>
                        <th className="py-3 px-4 text-sm font-medium text-[#7a95b8]">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockTablesData.recentActivity.map((row, i) => (
                        <tr key={row.id} className="border-b border-[#12233e]/50 hover:bg-[#0d1a2e]/50 transition-colors">
                          <td className="py-3 px-4 text-sm text-white flex items-center gap-2">
                            {i % 2 === 0 ? <Eye className="w-4 h-4 text-[#7a95b8]" /> : <Settings className="w-4 h-4 text-[#7a95b8]" />}
                            {row.action}
                          </td>
                          <td className="py-3 px-4 text-sm text-[#c8d8ec]">{row.time}</td>
                          <td className="py-3 px-4 text-sm text-[#7a95b8] font-mono">{row.ip}</td>
                          <td className="py-3 px-4 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              row.status === 'Success' ? 'bg-[#22c55e]/10 text-[#22c55e]' : 
                              row.status === 'Warning' ? 'bg-[#f59e0b]/10 text-[#f59e0b]' : 
                              'bg-[#ef4444]/10 text-[#ef4444]'
                            }`}>
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "compliance" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart 3: Radar Chart */}
                <div className="rc-card lg:col-span-1 flex flex-col items-center">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2 w-full mb-2">
                    <RadarIcon className="w-5 h-5 text-[#8b5cf6]" />
                    Compliance Score
                  </h3>
                  <p className="text-sm text-[#7a95b8] w-full mb-4">Your current compliance metrics vs team average</p>
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="#12233e" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#7a95b8', fontSize: 11 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                        <Radar name="You" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
                        <Radar name="Team Avg" dataKey="B" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 4: Pie Chart */}
                <div className="rc-card lg:col-span-1 flex flex-col items-center">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2 w-full mb-2">
                    <PieChartIcon className="w-5 h-5 text-[#ec4899]" />
                    Task Status
                  </h3>
                  <p className="text-sm text-[#7a95b8] w-full mb-4">Distribution of compliance tasks</p>
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }} />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Info Cards */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="rc-card bg-[#060d19] border-[#12233e] p-5">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-[#22c55e]/10 rounded-lg shrink-0">
                        <ShieldCheck className="w-5 h-5 text-[#22c55e]" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium mb-1">Status: Fully Compliant</h4>
                        <p className="text-sm text-[#7a95b8]">All required training and agreements are up to date. No action required.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="rc-card bg-[#060d19] border-[#12233e] p-5">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-[#3b82f6]/10 rounded-lg shrink-0">
                        <Calendar className="w-5 h-5 text-[#3b82f6]" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium mb-1">Next Review: Oct 15, 2024</h4>
                        <p className="text-sm text-[#7a95b8]">Your next scheduled compliance review and agreement renewal.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="rc-card bg-[#060d19] border-[#12233e] p-5">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-[#f59e0b]/10 rounded-lg shrink-0">
                        <Key className="w-5 h-5 text-[#f59e0b]" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium mb-1">Access Level: Standard</h4>
                        <p className="text-sm text-[#7a95b8]">You have standard agent access with supervisor oversight enabled.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Table 2: Compliance Checks */}
              <div className="rc-card">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
                  <FileCheck className="w-5 h-5 text-[#3b82f6]" />
                  Compliance Requirements
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#12233e]">
                        <th className="py-3 px-4 text-sm font-medium text-[#7a95b8]">Requirement</th>
                        <th className="py-3 px-4 text-sm font-medium text-[#7a95b8]">Completion Date</th>
                        <th className="py-3 px-4 text-sm font-medium text-[#7a95b8]">Expiry Date</th>
                        <th className="py-3 px-4 text-sm font-medium text-[#7a95b8]">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockTablesData.complianceChecks.map((row) => (
                        <tr key={row.id} className="border-b border-[#12233e]/50 hover:bg-[#0d1a2e]/50 transition-colors">
                          <td className="py-3 px-4 text-sm text-white font-medium">{row.check}</td>
                          <td className="py-3 px-4 text-sm text-[#c8d8ec]">{row.date}</td>
                          <td className="py-3 px-4 text-sm text-[#c8d8ec]">{row.expiry}</td>
                          <td className="py-3 px-4 text-sm">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#22c55e]/10 text-[#22c55e] flex items-center gap-1 w-max">
                              <CheckCircle2 className="w-3 h-3" /> {row.result}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "logs" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Chart 5: Line Chart */}
              <div className="rc-card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <LineChartIcon className="w-5 h-5 text-[#ef4444]" />
                    System Events History
                  </h3>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 text-xs rounded-md bg-[#12233e] text-white">All Events</button>
                    <button className="px-3 py-1 text-xs rounded-md border border-[#12233e] text-[#7a95b8] hover:text-white">Warnings Only</button>
                  </div>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                      <XAxis dataKey="name" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff', borderRadius: '8px' }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Line type="monotone" dataKey="amt" name="Total Events" stroke="#ef4444" strokeWidth={2} dot={{ r: 4, fill: '#0d1a2e', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="pv" name="Supervised Actions" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Table 3: Supervisor Logs */}
                <div className="rc-card">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
                    <Eye className="w-5 h-5 text-[#8b5cf6]" />
                    Supervisor Access Logs
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#12233e]">
                          <th className="py-3 px-4 text-sm font-medium text-[#7a95b8]">Date</th>
                          <th className="py-3 px-4 text-sm font-medium text-[#7a95b8]">Action</th>
                          <th className="py-3 px-4 text-sm font-medium text-[#7a95b8]">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockTablesData.supervisorLogs.map((row) => (
                          <tr key={row.id} className="border-b border-[#12233e]/50 hover:bg-[#0d1a2e]/50 transition-colors">
                            <td className="py-3 px-4 text-sm text-[#c8d8ec] whitespace-nowrap">{row.date}</td>
                            <td className="py-3 px-4 text-sm text-white">{row.action}</td>
                            <td className="py-3 px-4 text-sm text-[#7a95b8] italic">{row.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Table 4: System Alerts */}
                <div className="rc-card">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
                    <AlertTriangle className="w-5 h-5 text-[#f59e0b]" />
                    System Alerts
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#12233e]">
                          <th className="py-3 px-4 text-sm font-medium text-[#7a95b8]">Time</th>
                          <th className="py-3 px-4 text-sm font-medium text-[#7a95b8]">Severity</th>
                          <th className="py-3 px-4 text-sm font-medium text-[#7a95b8]">Message</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockTablesData.systemAlerts.map((row) => (
                          <tr key={row.id} className="border-b border-[#12233e]/50 hover:bg-[#0d1a2e]/50 transition-colors">
                            <td className="py-3 px-4 text-sm text-[#c8d8ec] whitespace-nowrap">{row.time}</td>
                            <td className="py-3 px-4 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                row.severity === 'Low' ? 'bg-[#3b82f6]/10 text-[#3b82f6]' : 
                                row.severity === 'Medium' ? 'bg-[#f59e0b]/10 text-[#f59e0b]' : 
                                'bg-[#ef4444]/10 text-[#ef4444]'
                              }`}>
                                {row.severity}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-white">{row.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "details" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Agreement Terms Re-display (Read Only) */}
                  <div className="rc-card">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#22c55e]" />
                        Agreed Terms & Conditions
                      </h2>
                      <button 
                        onClick={() => setShowDetails(!showDetails)}
                        className="text-sm text-[#3b82f6] hover:text-[#60a5fa] transition-colors"
                      >
                        {showDetails ? "Collapse All" : "Expand All"}
                      </button>
                    </div>

                    <div className="space-y-3">
                      {TERMS.map((term, idx) => (
                        <div key={term.id} className="border border-[#12233e] rounded-xl overflow-hidden">
                          <div 
                            className="p-4 bg-[#060d19] flex items-center justify-between cursor-pointer hover:bg-[#0d1a2e] transition-colors"
                            onClick={() => toggleSection(term.id)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-full bg-[#22c55e]/20 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-4 h-4 text-[#22c55e]" />
                              </div>
                              <span className="text-white font-medium text-sm">Term {idx + 1}: {term.id.charAt(0).toUpperCase() + term.id.slice(1)}</span>
                            </div>
                            <div className={`transition-transform duration-300 ${expandedSection === term.id || showDetails ? 'rotate-90' : ''}`}>
                              <ArrowRight className="w-4 h-4 text-[#7a95b8]" />
                            </div>
                          </div>
                          
                          {(expandedSection === term.id || showDetails) && (
                            <div className="p-4 bg-[#0a1526] border-t border-[#12233e] text-sm text-[#c8d8ec] leading-relaxed animate-in slide-in-from-top-2 duration-200">
                              {term.label}
                              <div className="mt-3 pt-3 border-t border-[#12233e]/50 text-xs text-[#7a95b8] flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Agreed on: {signatureDate || "Unknown"}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Signature Info */}
                  <div className="rc-card sticky top-6">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
                      <Lock className="w-5 h-5 text-[#f0c040]" />
                      Signature Record
                    </h2>
                    
                    <div className="space-y-4">
                      <div className="p-4 bg-[#060d19] rounded-xl border border-[#12233e] space-y-4">
                        <div>
                          <div className="text-xs text-[#7a95b8] mb-1">Signed By</div>
                          <div className="font-serif italic text-lg text-white border-b border-[#12233e] pb-2">{user?.name || "User"}</div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-[#7a95b8] mb-1">Date</div>
                            <div className="text-sm text-white">{signatureDate || "N/A"}</div>
                          </div>
                          <div>
                            <div className="text-xs text-[#7a95b8] mb-1">Status</div>
                            <div className="text-sm text-[#22c55e] font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Valid
                            </div>
                          </div>
                        </div>
                        
                        <div className="pt-3 border-t border-[#12233e]">
                          <div className="text-xs text-[#7a95b8] mb-1">IP Address (Recorded)</div>
                          <div className="text-xs font-mono text-white bg-[#0d1a2e] p-2 rounded">192.168.x.x (Masked)</div>
                        </div>
                      </div>
                      
                      <button className="w-full py-2.5 px-4 rounded-xl border border-[#12233e] text-[#c8d8ec] hover:text-white hover:bg-[#0d1a2e] transition-colors text-sm font-medium flex items-center justify-center gap-2">
                        <Download className="w-4 h-4" /> Download PDF Copy
                      </button>
                    </div>
                  </div>
                  
                  {/* Table 5: Access Permissions */}
                  <div className="rc-card">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
                      <Key className="w-4 h-4 text-[#3b82f6]" />
                      Current Permissions
                    </h3>
                    <div className="space-y-2">
                      {mockTablesData.accessPermissions.map((row) => (
                        <div key={row.id} className="flex items-center justify-between p-2 rounded-lg bg-[#060d19] border border-[#12233e]">
                          <span className="text-xs text-[#c8d8ec]">{row.resource}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                            row.level === 'Read/Write' ? 'bg-[#22c55e]/10 text-[#22c55e]' :
                            row.level === 'Read Only' ? 'bg-[#3b82f6]/10 text-[#3b82f6]' :
                            'bg-[#ef4444]/10 text-[#ef4444]'
                          }`}>{row.level}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <PageInsights pageId="supervisor-monitoring-agreement" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-6 pb-20">
        {/* Header */}
        <div className="rc-page-header">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#0d1a2e] rounded-xl border border-[#12233e]">
              <Shield className="w-8 h-8 text-[#f0c040]" />
            </div>
            <div>
              <h1 className="rc-page-title">Supervisor Monitoring Agreement</h1>
              <p className="rc-page-subtitle">Required for Platform Access</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ExportToSlides
              toolName="Supervisor Monitoring Agreement"
              getSections={() => [
                {
                  title: "Agreement Status",
                  items: [
                    { label: "Status", value: "Pending Signature" },
                    { label: "Team", value: status?.teamName || "N/A" },
                    { label: "Supervisor", value: status?.supervisorName || "N/A" }
                  ]
                }
              ]}
            />
          </div>
        </div>

        {/* Warning Banner */}
        <div className="rc-card border-[#f0c040]/30 bg-[#f0c040]/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#f0c040]/10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-500"></div>
          <div className="flex gap-4 relative z-10">
            <div className="w-12 h-12 rounded-full bg-[#f0c040]/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-[#f0c040]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#f0c040] mb-1">Action Required: Agreement Pending</h3>
              <p className="text-[#c8d8ec] leading-relaxed">
                Before accessing the Russell Capital Systems™ platform, you must read and agree to the monitoring terms as a member of <strong className="text-white">{status?.teamName}</strong> under the supervision of <strong className="text-white">{status?.supervisorName}</strong>. Platform access is blocked until this agreement is signed.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Agreement Terms */}
            <div className="rc-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#22c55e]" />
                    Terms & Conditions
                  </h2>
                  <p className="text-[#7a95b8] text-sm mt-1">Review and accept all {TERMS.length} terms below</p>
                </div>
                
                <div className="relative">
                  <Search className="w-4 h-4 text-[#7a95b8] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search terms..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="rc-input pl-9 w-full sm:w-64"
                  />
                </div>
              </div>

              <div className="mb-6 space-y-3">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <span className="text-sm text-[#7a95b8]">Agreement Progress</span>
                    <div className="text-lg text-white font-medium">{agreedCount} of {TERMS.length} terms accepted</div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={selectAllTerms}
                      className="text-xs px-3 py-1.5 rounded-md bg-[#12233e] text-[#c8d8ec] hover:text-white hover:bg-[#1a3055] transition-colors"
                    >
                      Accept All
                    </button>
                    <button 
                      onClick={clearAllTerms}
                      className="text-xs px-3 py-1.5 rounded-md border border-[#12233e] text-[#7a95b8] hover:text-white transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <Progress value={progressPercentage} className="h-2 bg-[#12233e]" />
              </div>

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredTerms.length > 0 ? (
                  filteredTerms.map((term) => (
                    <div 
                      key={term.id} 
                      className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer flex gap-4 ${
                        agreedTerms[term.id] 
                          ? "bg-[#22c55e]/10 border-[#22c55e]/30 shadow-[0_0_15px_rgba(34,197,94,0.05)]" 
                          : "bg-[#060d19] border-[#12233e] hover:border-[#7a95b8]/50 hover:bg-[#0a1526]"
                      }`}
                      onClick={() => toggleTerm(term.id)}
                    >
                      <div className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        agreedTerms[term.id]
                          ? "bg-[#22c55e] border-[#22c55e]"
                          : "border-[#7a95b8] bg-transparent"
                      }`}>
                        {agreedTerms[term.id] && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                      <div className={`text-sm leading-relaxed transition-colors ${
                        agreedTerms[term.id] ? "text-white" : "text-[#c8d8ec]"
                      }`}>
                        {term.label}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-[#7a95b8] bg-[#060d19] rounded-xl border border-[#12233e] border-dashed">
                    <Info className="w-8 h-8 mx-auto mb-3 opacity-50" />
                    <p>No terms matching "{searchQuery}"</p>
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="mt-4 text-sm text-[#3b82f6] hover:underline"
                    >
                      Clear search
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Table 6: Team Members Preview */}
            <div className="rc-card">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-[#3b82f6]" />
                Your Team ({status?.teamName})
              </h3>
              <p className="text-sm text-[#7a95b8] mb-4">You will be collaborating with these members under supervisor oversight.</p>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#12233e]">
                      <th className="py-2 px-4 text-xs font-medium text-[#7a95b8] uppercase tracking-wider">Name</th>
                      <th className="py-2 px-4 text-xs font-medium text-[#7a95b8] uppercase tracking-wider">Role</th>
                      <th className="py-2 px-4 text-xs font-medium text-[#7a95b8] uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockTablesData.teamMembers.map((member) => (
                      <tr key={member.id} className="border-b border-[#12233e]/30">
                        <td className="py-3 px-4 text-sm text-white flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#12233e] flex items-center justify-center text-xs text-[#7a95b8]">
                            {member.name.charAt(0)}
                          </div>
                          {member.name}
                        </td>
                        <td className="py-3 px-4 text-sm text-[#c8d8ec]">{member.role}</td>
                        <td className="py-3 px-4 text-sm">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            member.status === 'Active' ? 'bg-[#22c55e]/10 text-[#22c55e]' : 'bg-[#f59e0b]/10 text-[#f59e0b]'
                          }`}>
                            {member.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* E-Signature */}
            <div className="rc-card sticky top-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-[#f0c040]" />
                  Electronic Signature
                </h2>
                <p className="text-[#7a95b8] text-sm mt-1">Complete to gain access</p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="sig-name" className="text-sm font-medium text-[#c8d8ec] flex justify-between">
                    Full Legal Name
                    {signatureName.length > 0 && signatureName.length < 2 && (
                      <span className="text-xs text-[#ef4444]">Min 2 chars</span>
                    )}
                  </label>
                  <input
                    id="sig-name"
                    placeholder="Type your full name..."
                    value={signatureName}
                    onChange={(e) => setSignatureName(e.target.value)}
                    className="rc-input font-serif italic w-full bg-[#060d19]"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="sig-date" className="text-sm font-medium text-[#c8d8ec]">Date</label>
                  <input
                    id="sig-date"
                    value={signatureDate}
                    onChange={(e) => setSignatureDate(e.target.value)}
                    className="rc-input w-full bg-[#060d19] text-[#7a95b8]"
                    readOnly
                  />
                </div>

                <div className="p-4 bg-[#060d19] rounded-xl border border-[#12233e] space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#7a95b8]">Team</span>
                    <span className="text-white font-medium text-right">{status?.teamName}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#7a95b8]">Supervisor</span>
                    <span className="text-white font-medium text-right">{status?.supervisorName}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#7a95b8]">Email</span>
                    <span className="text-white font-medium truncate max-w-[150px] text-right" title={user?.email || ""}>{user?.email ?? "Not provided"}</span>
                  </div>
                </div>

                <div className="text-xs text-[#7a95b8] italic flex gap-2 bg-[#060d19] p-3 rounded-lg border border-[#12233e]/50">
                  <Info className="w-4 h-4 shrink-0 text-[#3b82f6]" />
                  <p>This agreement will be stored as a legal document. Your IP address and browser information will be recorded for verification.</p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSign}
                    disabled={!canSign || signing}
                    className={`w-full py-3.5 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-300 ${
                      canSign && !signing
                        ? "bg-[#22c55e] hover:bg-[#1ea34d] text-white shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] transform hover:-translate-y-0.5"
                        : "bg-[#12233e] text-[#7a95b8] cursor-not-allowed"
                    }`}
                  >
                    {signing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Signing Agreement...
                      </>
                    ) : (
                      <>
                        {canSign ? <CheckCircle2 className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                        I Agree — Sign & Access
                      </>
                    )}
                  </button>
                  
                  {!allTermsAgreed && (
                    <p className="text-xs text-center text-[#f0c040] mt-3 flex items-center justify-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Please accept all {TERMS.length} terms to sign
                    </p>
                  )}
                  {allTermsAgreed && signatureName.length < 2 && (
                    <p className="text-xs text-center text-[#f0c040] mt-3 flex items-center justify-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Please enter your full legal name
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Quick Links */}
            <div className="rc-card bg-transparent border-none p-0">
              <h3 className="text-sm font-medium text-[#7a95b8] mb-3 uppercase tracking-wider">Resources</h3>
              <div className="space-y-2">
                <a href="#" className="flex items-center justify-between p-3 rounded-lg bg-[#060d19] border border-[#12233e] hover:border-[#3b82f6]/50 transition-colors group">
                  <div className="flex items-center gap-3 text-sm text-[#c8d8ec] group-hover:text-white transition-colors">
                    <FileText className="w-4 h-4 text-[#7a95b8] group-hover:text-[#3b82f6]" />
                    Full Privacy Policy
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#7a95b8] opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
                <a href="#" className="flex items-center justify-between p-3 rounded-lg bg-[#060d19] border border-[#12233e] hover:border-[#3b82f6]/50 transition-colors group">
                  <div className="flex items-center gap-3 text-sm text-[#c8d8ec] group-hover:text-white transition-colors">
                    <Shield className="w-4 h-4 text-[#7a95b8] group-hover:text-[#3b82f6]" />
                    Data Handling Guidelines
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#7a95b8] opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </div>
            </div>
          </div>
        </div>
        
        <PageInsights pageId="supervisor-monitoring-agreement" />
      </div>
    </AppShell>
  );
}
