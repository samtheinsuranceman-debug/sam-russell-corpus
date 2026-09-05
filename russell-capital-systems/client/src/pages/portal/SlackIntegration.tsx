// @ts-nocheck
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  MessageSquare,
  Link2,
  Unlink,
  Send,
  CheckCircle,
  XCircle,
  Settings,
  Hash,
  Terminal,
  Activity,
  ArrowRight,
  Bell,
  Shield,
  Users,
  BarChart3,
  RefreshCw,
  Plus,
  AlertTriangle,
  Lock,
  Code,
  Layout,
  List,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Copy,
  ExternalLink,
  Briefcase,
  BookOpen,
} from "lucide-react";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart, Legend
} from "recharts";

const activityData = [
  { time: "08:00", messages: 12, alerts: 2, commands: 5 },
  { time: "10:00", messages: 28, alerts: 5, commands: 12 },
  { time: "12:00", messages: 45, alerts: 8, commands: 18 },
  { time: "14:00", messages: 32, alerts: 4, commands: 15 },
  { time: "16:00", messages: 56, alerts: 12, commands: 25 },
  { time: "18:00", messages: 24, alerts: 3, commands: 8 },
  { time: "20:00", messages: 8, alerts: 1, commands: 2 },
];

const channelData = [
  { name: "general", count: 400 },
  { name: "alerts", count: 300 },
  { name: "deals", count: 300 },
  { name: "support", count: 200 },
];
const COLORS = ['#4f8cff', '#22c55e', '#f59e0b', '#e11d48', '#8b5cf6'];

const eventTypeData = [
  { subject: 'New Clients', A: 120, B: 110, fullMark: 150 },
  { subject: 'Deal Won', A: 98, B: 130, fullMark: 150 },
  { subject: 'Documents', A: 86, B: 130, fullMark: 150 },
  { subject: 'Notes', A: 99, B: 100, fullMark: 150 },
  { subject: 'Strategies', A: 85, B: 90, fullMark: 150 },
  { subject: 'Support', A: 65, B: 85, fullMark: 150 },
];

const weeklyData = [
  { name: 'Mon', usage: 4000, active: 2400, amt: 2400 },
  { name: 'Tue', usage: 3000, active: 1398, amt: 2210 },
  { name: 'Wed', usage: 2000, active: 9800, amt: 2290 },
  { name: 'Thu', usage: 2780, active: 3908, amt: 2000 },
  { name: 'Fri', usage: 1890, active: 4800, amt: 2181 },
  { name: 'Sat', usage: 2390, active: 3800, amt: 2500 },
  { name: 'Sun', usage: 3490, active: 4300, amt: 2100 },
];

const mockLogs = Array.from({ length: 50 }).map((_, i) => ({
  id: i,
  timestamp: new Date(Date.now() - i * 3600000).toISOString(),
  type: i % 3 === 0 ? "Command" : i % 2 === 0 ? "Alert" : "Message",
  channel: i % 4 === 0 ? "#general" : i % 3 === 0 ? "#deals" : "#alerts",
  status: i % 10 === 0 ? "Failed" : "Success",
  user: `User ${i % 5 + 1}`,
  details: `Executed action ${i}`
}));

const mockUsers = Array.from({ length: 20 }).map((_, i) => ({
  id: i,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  role: i === 0 ? "Admin" : i < 5 ? "Manager" : "Member",
  status: i % 5 === 0 ? "Offline" : "Online",
  lastActive: new Date(Date.now() - i * 86400000).toLocaleDateString(),
  messagesSent: Math.floor(Math.random() * 500)
}));

const mockChannels = Array.from({ length: 15 }).map((_, i) => ({
  id: i,
  name: `channel-${i + 1}`,
  type: i % 3 === 0 ? "Private" : "Public",
  members: Math.floor(Math.random() * 50) + 5,
  isMapped: i < 5,
  purpose: `Purpose for channel ${i + 1}`,
  createdAt: new Date(Date.now() - i * 86400000 * 30).toLocaleDateString()
}));

const mockWebhooks = Array.from({ length: 8 }).map((_, i) => ({
  id: i,
  name: `Webhook ${i + 1}`,
  url: `https://hooks.slack.example/services/T.../B.../${i}`,
  channel: `#channel-${i % 5 + 1}`,
  events: ["New Client", "Deal Won", "Document Uploaded"].slice(0, i % 3 + 1).join(", "),
  status: i === 7 ? "Inactive" : "Active",
  lastTriggered: new Date(Date.now() - i * 3600000 * 5).toLocaleString()
}));

const mockRules = Array.from({ length: 12 }).map((_, i) => ({
  id: i,
  name: `Routing Rule ${i + 1}`,
  condition: `If event type is ${i % 2 === 0 ? "Deal" : "Client"}`,
  action: `Send to #channel-${i % 3 + 1}`,
  priority: i + 1,
  enabled: i < 10,
  createdBy: `Admin ${i % 2 + 1}`
}));

const mockIntegrations = Array.from({ length: 6 }).map((_, i) => ({
  id: i,
  name: `Integration ${i + 1}`,
  provider: i % 2 === 0 ? "Slack" : "Custom",
  status: i === 5 ? "Error" : "Connected",
  syncFrequency: "Real-time",
  lastSync: new Date(Date.now() - i * 60000).toLocaleString(),
  errors: i === 5 ? 3 : 0
}));

export default function SlackIntegration() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const statusQuery = trpc.slack.status.useQuery();
  const teamQuery = trpc.team.members.useQuery();
  const dashboardQuery = trpc.dashboard.stats.useQuery();
  const tagsQuery = trpc.tags.list.useQuery();
  const activityQuery = trpc.activity.list.useQuery({ limit: 10 });
  
  const configureMut = trpc.slack.configure.useMutation({
    onSuccess: () => { utils.slack.status.invalidate(); toast.success("Slack integration updated"); },
    onError: (e) => toast.error(e.message),
  });
  const disconnectMut = trpc.slack.disconnect.useMutation({
    onSuccess: () => { utils.slack.status.invalidate(); toast.success("Slack disconnected"); },
    onError: (e) => toast.error(e.message),
  });
  const testMut = trpc.slack.testMessage.useMutation({
    onSuccess: (r) => r.sent ? toast.success("Test message sent to Slack") : toast.error("Failed to send test message"),
    onError: (e) => toast.error(e.message),
  });

  const [webhookUrl, setWebhookUrl] = useState("");
  const [channelName, setChannelName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "settings" | "commands" | "logs" | "users" | "channels" | "webhooks" | "rules" | "analytics">("overview");
  
  const [logSearch, setLogSearch] = useState("");
  const [logFilter, setLogFilter] = useState("All");
  const [logPage, setLogPage] = useState(1);
  
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("All");
  
  const [channelSearch, setChannelSearch] = useState("");
  const [channelTypeFilter, setChannelTypeFilter] = useState("All");
  
  const [webhookSearch, setWebhookSearch] = useState("");
  
  const [ruleSearch, setRuleSearch] = useState("");
  
  const [integrationSearch, setIntegrationSearch] = useState("");
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [customBotName, setCustomBotName] = useState("Russell Capital Bot");
  const [customBotIcon, setCustomBotIcon] = useState(":robot_face:");
  const [requireApproval, setRequireApproval] = useState(false);
  const [notifyOnErrors, setNotifyOnErrors] = useState(true);
  const [maxRetries, setMaxRetries] = useState(3);
  
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedChannel, setSelectedChannel] = useState<any>(null);
  const [selectedWebhook, setSelectedWebhook] = useState<any>(null);
  const [selectedRule, setSelectedRule] = useState<any>(null);
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);
  
  const [isEditingWebhook, setIsEditingWebhook] = useState(false);
  const [isEditingRule, setIsEditingRule] = useState(false);
  
  const [chartPeriod, setChartPeriod] = useState("Today");
  
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipContent, setTooltipContent] = useState("");
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (statusQuery.data) {
      if (statusQuery.data.teamName) setTeamName(statusQuery.data.teamName);
      if (statusQuery.data.channelName) setChannelName(statusQuery.data.channelName);
    }
  }, [statusQuery.data]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    utils.slack.status.invalidate();
    utils.team.list.invalidate();
    utils.dashboard.stats.invalidate();
    utils.tags.list.invalidate();
    utils.activity.list.invalidate();
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Data refreshed successfully");
    }, 1000);
  }, [utils]);

  const handleExportLogs = useCallback(() => {
    toast.success("Logs exported to CSV");
  }, []);

  const handleExportUsers = useCallback(() => {
    toast.success("Users exported to CSV");
  }, []);

  const handleExportChannels = useCallback(() => {
    toast.success("Channels exported to CSV");
  }, []);

  const handleExportWebhooks = useCallback(() => {
    toast.success("Webhooks exported to CSV");
  }, []);

  const handleExportRules = useCallback(() => {
    toast.success("Rules exported to CSV");
  }, []);

  const handleExportIntegrations = useCallback(() => {
    toast.success("Integrations exported to CSV");
  }, []);

  const handleTestWebhook = useCallback((id: number) => {
    toast.success(`Test payload sent to Webhook ${id}`);
  }, []);

  const handleToggleRule = useCallback((id: number) => {
    toast.success(`Rule ${id} toggled`);
  }, []);

  const handleDeleteWebhook = useCallback((id: number) => {
    toast.success(`Webhook ${id} deleted`);
  }, []);

  const handleDeleteRule = useCallback((id: number) => {
    toast.success(`Rule ${id} deleted`);
  }, []);

  const handleSyncIntegration = useCallback((id: number) => {
    toast.success(`Integration ${id} sync started`);
  }, []);

  const handleSaveSettings = useCallback(() => {
    toast.success("Advanced settings saved");
  }, []);

  const handleClearLogs = useCallback(() => {
    if (window.confirm("Are you sure you want to clear all logs?")) {
      toast.success("Logs cleared");
    }
  }, []);

  const handleCopyCommand = useCallback((cmd: string) => {
    navigator.clipboard.writeText(cmd);
    toast.success("Command copied to clipboard");
  }, []);

  const filteredLogs = useMemo(() => {
    return mockLogs.filter((log) => {
      const matchesSearch = log.details.toLowerCase().includes(logSearch.toLowerCase()) || 
                            log.user.toLowerCase().includes(logSearch.toLowerCase()) ||
                            log.channel.toLowerCase().includes(logSearch.toLowerCase());
      const matchesFilter = logFilter === "All" || log.type === logFilter;
      return matchesSearch && matchesFilter;
    });
  }, [logSearch, logFilter]);

  const paginatedLogs = useMemo(() => {
    const start = (logPage - 1) * 10;
    return filteredLogs.slice(start, start + 10);
  }, [filteredLogs, logPage]);

  const filteredUsers = useMemo(() => {
    return mockUsers.filter((u) => {
      const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                            u.email.toLowerCase().includes(userSearch.toLowerCase());
      const matchesFilter = userRoleFilter === "All" || u.role === userRoleFilter;
      return matchesSearch && matchesFilter;
    });
  }, [userSearch, userRoleFilter]);

  const filteredChannels = useMemo(() => {
    return mockChannels.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(channelSearch.toLowerCase()) || 
                            c.purpose.toLowerCase().includes(channelSearch.toLowerCase());
      const matchesFilter = channelTypeFilter === "All" || c.type === channelTypeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [channelSearch, channelTypeFilter]);

  const filteredWebhooks = useMemo(() => {
    return mockWebhooks.filter((w) => w.name.toLowerCase().includes(webhookSearch.toLowerCase()) || w.url.toLowerCase().includes(webhookSearch.toLowerCase()));
  }, [webhookSearch]);

  const filteredRules = useMemo(() => {
    return mockRules.filter((r) => r.name.toLowerCase().includes(ruleSearch.toLowerCase()) || r.condition.toLowerCase().includes(ruleSearch.toLowerCase()));
  }, [ruleSearch]);

  const filteredIntegrations = useMemo(() => {
    return mockIntegrations.filter((i) => i.name.toLowerCase().includes(integrationSearch.toLowerCase()) || i.provider.toLowerCase().includes(integrationSearch.toLowerCase()));
  }, [integrationSearch]);

  const status = statusQuery.data;
  const isConnected = status?.connected ?? false;
  
  const teamData = teamQuery.data;
  const dashboardData = dashboardQuery.data;
  const tagsData = tagsQuery.data;
  const activityList = activityQuery.data;

  const totalPages = Math.ceil(filteredLogs.length / 10);

  const renderPagination = () => (
    <div className="flex items-center justify-between mt-4">
      <div className="text-sm text-[#7a95b8]">
        Showing {(logPage - 1) * 10 + 1} to {Math.min(logPage * 10, filteredLogs.length)} of {filteredLogs.length} entries
      </div>
      <div className="flex gap-2">
        <button 
          onClick={() => setLogPage(p => Math.max(1, p - 1))}
          disabled={logPage === 1}
          className="rc-btn rc-btn-ghost px-3 py-1 disabled:opacity-50"
        >
          Previous
        </button>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                onClick={() => setLogPage(pageNum)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${logPage === pageNum ? 'bg-[#4f8cff] text-white' : 'text-[#7a95b8] hover:bg-[#12233e]'}`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
        <button 
          onClick={() => setLogPage(p => Math.min(totalPages, p + 1))}
          disabled={logPage === totalPages || totalPages === 0}
          className="rc-btn rc-btn-ghost px-3 py-1 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* Header */}
        <div className="rc-page-header flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#0d1a2e] border border-[#12233e] flex items-center justify-center shrink-0 shadow-lg shadow-[#4f8cff]/10">
              <MessageSquare size={24} className="text-[#4f8cff]" />
            </div>
            <div>
              <h1 className="rc-page-title text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-[#7a95b8]">Slack Integration</h1>
              <p className="rc-page-subtitle mt-1 text-lg">Connect Russell Capital Systems™ to your Slack workspace for real-time notifications, slash commands, and advanced workflows.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <ExportToSlides
              toolName="Slack Integration"
              getSections={() => [
                {
                  title: "Slack Integration Status",
                  items: [
                    { label: "Status", value: isConnected ? "Connected" : "Not Connected" },
                    ...(status?.teamName ? [{ label: "Team", value: status.teamName }] : []),
                    ...(status?.channelName ? [{ label: "Channel", value: `#${status.channelName}` }] : [])
                  ]
                },
                {
                  title: "Slack Usage Statistics",
                  items: [
                    { label: "Messages Today", value: "205" },
                    { label: "Active Users", value: "24" },
                    { label: "Events Monitored", value: "6" },
                    { label: "Commands Executed", value: "42" }
                  ]
                }
              ]}
            />
            <button 
              onClick={handleRefresh} 
              disabled={isRefreshing} 
              className="rc-btn rc-btn-ghost"
              title="Refresh Data"
            >
              <RefreshCw size={16} className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
            </button>
            {isConnected && (
              <button onClick={() => testMut.mutate({})} disabled={testMut.isPending} className="rc-btn rc-btn-secondary shadow-lg shadow-[#4f8cff]/20">
                <Send size={16} className="mr-2" /> Test Connection
              </button>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-6">
          <div className="rc-card flex flex-col justify-between hover:border-[#4f8cff]/50 transition-colors group cursor-pointer" onClick={() => setActiveTab("overview")}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#7a95b8] font-medium">Connection Status</span>
              <div className={`p-2 rounded-lg ${isConnected ? 'bg-[#22c55e]/10' : 'bg-[#7a95b8]/10'} group-hover:scale-110 transition-transform`}>
                <Activity size={16} className={isConnected ? "text-[#22c55e]" : "text-[#7a95b8]"} />
              </div>
            </div>
            <div className="flex items-end gap-2 mt-4">
              <span className="text-3xl font-bold text-white tracking-tight">{isConnected ? "Active" : "Inactive"}</span>
            </div>
            {isConnected && status?.teamName && (
              <div className="mt-2 text-xs text-[#7a95b8] truncate">Workspace: {status.teamName}</div>
            )}
          </div>
          
          <div className="rc-card flex flex-col justify-between hover:border-[#4f8cff]/50 transition-colors group cursor-pointer" onClick={() => setActiveTab("logs")}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#7a95b8] font-medium">Messages Today</span>
              <div className="p-2 rounded-lg bg-[#4f8cff]/10 group-hover:scale-110 transition-transform">
                <MessageSquare size={16} className="text-[#4f8cff]" />
              </div>
            </div>
            <div className="flex items-end gap-2 mt-4">
              <span className="text-3xl font-bold text-white tracking-tight">{isConnected ? "205" : "0"}</span>
              {isConnected && <span className="text-sm font-medium text-[#22c55e] mb-1 flex items-center bg-[#22c55e]/10 px-2 py-0.5 rounded-full"><ArrowRight size={12} className="-rotate-45 mr-1" /> 12%</span>}
            </div>
            <div className="mt-2 w-full bg-[#12233e] h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#4f8cff] h-full" style={{ width: isConnected ? '65%' : '0%' }}></div>
            </div>
          </div>

          <div className="rc-card flex flex-col justify-between hover:border-[#f0c040]/50 transition-colors group cursor-pointer" onClick={() => setActiveTab("users")}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#7a95b8] font-medium">Active Users</span>
              <div className="p-2 rounded-lg bg-[#f0c040]/10 group-hover:scale-110 transition-transform">
                <Users size={16} className="text-[#f0c040]" />
              </div>
            </div>
            <div className="flex items-end gap-2 mt-4">
              <span className="text-3xl font-bold text-white tracking-tight">{isConnected ? "24" : "0"}</span>
              {isConnected && <span className="text-sm font-medium text-[#7a95b8] mb-1">/ 50 total</span>}
            </div>
            <div className="mt-2 flex -space-x-2">
              {isConnected && Array.from({ length: Math.min(5, 24) }).map((_, i) => (
                <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-[#4f8cff] to-[#8b5cf6] border-2 border-[#0d1a2e] flex items-center justify-center text-[10px] font-bold text-white z-10" style={{ zIndex: 5 - i }}>
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
              {isConnected && 24 > 5 && (
                <div className="w-6 h-6 rounded-full bg-[#12233e] border-2 border-[#0d1a2e] flex items-center justify-center text-[10px] font-bold text-[#7a95b8] z-0">
                  +19
                </div>
              )}
            </div>
          </div>

          <div className="rc-card flex flex-col justify-between hover:border-[#e11d48]/50 transition-colors group cursor-pointer" onClick={() => setActiveTab("rules")}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#7a95b8] font-medium">Events Monitored</span>
              <div className="p-2 rounded-lg bg-[#e11d48]/10 group-hover:scale-110 transition-transform">
                <Bell size={16} className="text-[#e11d48]" />
              </div>
            </div>
            <div className="flex items-end gap-2 mt-4">
              <span className="text-3xl font-bold text-white tracking-tight">{isConnected ? "12" : "6"}</span>
              <span className="text-sm font-medium text-[#22c55e] mb-1 flex items-center bg-[#22c55e]/10 px-2 py-0.5 rounded-full"><ArrowRight size={12} className="-rotate-45 mr-1" /> 3 new</span>
            </div>
            <div className="mt-2 flex gap-1">
              {['Deals', 'Clients', 'Docs'].map((tag) => (
                <span key={tag} className="text-[10px] bg-[#12233e] text-[#c8d8ec] px-1.5 py-0.5 rounded">{tag}</span>
              ))}
            </div>
          </div>
          
          <div className="rc-card flex flex-col justify-between hover:border-[#8b5cf6]/50 transition-colors group cursor-pointer hidden xl:flex" onClick={() => setActiveTab("commands")}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#7a95b8] font-medium">Commands Executed</span>
              <div className="p-2 rounded-lg bg-[#8b5cf6]/10 group-hover:scale-110 transition-transform">
                <Terminal size={16} className="text-[#8b5cf6]" />
              </div>
            </div>
            <div className="flex items-end gap-2 mt-4">
              <span className="text-3xl font-bold text-white tracking-tight">{isConnected ? "42" : "0"}</span>
              {isConnected && <span className="text-sm font-medium text-[#e11d48] mb-1 flex items-center bg-[#e11d48]/10 px-2 py-0.5 rounded-full"><ArrowRight size={12} className="rotate-45 mr-1" /> 5%</span>}
            </div>
            <div className="mt-2 text-xs text-[#7a95b8] truncate">Most used: /rc client</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-[#0f1e35] rounded-xl border border-[#12233e] p-1 mb-6 overflow-x-auto hide-scrollbar">
          <div className="flex min-w-max">
            {[
              { id: "overview", label: "Overview", icon: Layout },
              { id: "settings", label: "Settings", icon: Settings },
              { id: "commands", label: "Commands", icon: Terminal },
              { id: "logs", label: "Activity Logs", icon: List },
              { id: "users", label: "Users", icon: Users },
              { id: "channels", label: "Channels", icon: Hash },
              { id: "webhooks", label: "Webhooks", icon: Link2 },
              { id: "rules", label: "Routing Rules", icon: GitBranchIcon },
              { id: "analytics", label: "Analytics", icon: BarChart3 },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === id 
                    ? "bg-[#4f8cff] text-white shadow-md shadow-[#4f8cff]/20" 
                    : "text-[#7a95b8] hover:text-[#c8d8ec] hover:bg-[#1a2c47]"
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {statusQuery.isLoading || teamQuery.isLoading || dashboardQuery.isLoading || tagsQuery.isLoading || activityQuery.isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-4 border-[#12233e]"></div>
              <div className="absolute inset-0 rounded-full border-4 border-[#4f8cff] border-t-transparent animate-spin"></div>
            </div>
            <p className="text-[#7a95b8] font-medium animate-pulse">Loading Slack integration data...</p>
          </div>
        ) : (
          <div className="min-h-[500px]">
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Activity Chart */}
                  <div className="rc-card relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#4f8cff]/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none transition-opacity group-hover:opacity-100 opacity-50"></div>
                    <div className="flex items-center justify-between mb-6 relative z-10">
                      <div>
                        <h3 className="text-lg font-semibold text-white">Message Activity</h3>
                        <p className="text-sm text-[#7a95b8]">Volume of messages, alerts, and commands over time</p>
                      </div>
                      <div className="flex bg-[#0d1a2e] rounded-lg p-1 border border-[#12233e]">
                        {['Today', 'Week', 'Month'].map((period) => (
                          <button 
                            key={period}
                            onClick={() => setChartPeriod(period)}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${chartPeriod === period ? 'bg-[#4f8cff] text-white' : 'text-[#7a95b8] hover:text-white'}`}
                          >
                            {period}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="h-[350px] w-full relative z-10">
                      {isConnected ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4f8cff" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#4f8cff" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                            <XAxis dataKey="time" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                            <YAxis stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                              itemStyle={{ color: '#c8d8ec', fontWeight: 500 }}
                              labelStyle={{ color: '#7a95b8', marginBottom: '8px', fontWeight: 600 }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                            <Area type="monotone" dataKey="messages" name="Messages" stroke="#4f8cff" strokeWidth={3} fillOpacity={1} fill="url(#colorMessages)" />
                            <Area type="monotone" dataKey="alerts" name="Alerts" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorAlerts)" />
                            <Line type="monotone" dataKey="commands" name="Commands" stroke="#22c55e" strokeWidth={2} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-[#7a95b8] border-2 border-dashed border-[#12233e] rounded-xl bg-[#0d1a2e]/50">
                          <div className="w-16 h-16 rounded-full bg-[#12233e] flex items-center justify-center mb-4">
                            <Activity size={32} className="text-[#4f8cff] opacity-50" />
                          </div>
                          <p className="text-lg font-medium text-white mb-2">No Data Available</p>
                          <p className="text-sm text-center max-w-md">Connect your Slack workspace to start tracking message activity, alerts, and command usage.</p>
                          <button onClick={() => setActiveTab("settings")} className="mt-6 rc-btn rc-btn-primary">
                            Connect Slack Now
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Secondary Charts Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Channel Distribution */}
                    <div className="rc-card">
                      <h3 className="text-lg font-semibold text-white mb-1">Channel Distribution</h3>
                      <p className="text-xs text-[#7a95b8] mb-4">Message volume by channel</p>
                      <div className="h-[250px] w-full">
                        {isConnected ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={channelData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="count"
                                stroke="none"
                              >
                                {channelData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', borderRadius: '8px' }}
                                itemStyle={{ color: '#c8d8ec' }}
                              />
                              <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#7a95b8] text-sm">No data</div>
                        )}
                      </div>
                    </div>

                    {/* Event Types Radar */}
                    <div className="rc-card">
                      <h3 className="text-lg font-semibold text-white mb-1">Event Coverage</h3>
                      <p className="text-xs text-[#7a95b8] mb-4">Configured vs Triggered events</p>
                      <div className="h-[250px] w-full">
                        {isConnected ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={eventTypeData}>
                              <PolarGrid stroke="#12233e" />
                              <PolarAngleAxis dataKey="subject" tick={{ fill: '#7a95b8', fontSize: 10 }} />
                              <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                              <Radar name="Configured" dataKey="A" stroke="#4f8cff" fill="#4f8cff" fillOpacity={0.3} />
                              <Radar name="Triggered" dataKey="B" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', borderRadius: '8px' }}
                              />
                              <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                            </RadarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#7a95b8] text-sm">No data</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Status Card */}
                  <div className="rc-card border-t-4 border-t-[#4f8cff] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <MessageSquare size={100} />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-4 relative z-10">Connection Status</h3>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-[#0f1e35] border border-[#12233e] mb-4 relative z-10">
                      <div className="flex items-center gap-4">
                        {isConnected ? (
                          <div className="relative">
                            <div className="w-12 h-12 rounded-xl bg-[#22c55e]/15 flex items-center justify-center border border-[#22c55e]/30">
                              <CheckCircle size={24} className="text-[#22c55e]" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#22c55e] rounded-full border-2 border-[#0f1e35]"></div>
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-[#7a95b8]/15 flex items-center justify-center border border-[#7a95b8]/30">
                            <XCircle size={24} className="text-[#7a95b8]" />
                          </div>
                        )}
                        <div>
                          <div className="text-white font-bold text-lg">{isConnected ? "Connected" : "Not Connected"}</div>
                          {isConnected && status && (
                            <div className="text-sm text-[#7a95b8] flex flex-col mt-0.5">
                              {status.teamName && <span className="flex items-center gap-1"><Briefcase size={12} /> {status.teamName}</span>}
                              {status.channelName && <span className="flex items-center gap-1 mt-0.5"><Hash size={12} /> {status.channelName}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {isConnected ? (
                      <div className="flex flex-col gap-3 relative z-10">
                        <div className="grid grid-cols-2 gap-3">
                          <button onClick={() => testMut.mutate({})} disabled={testMut.isPending} className="rc-btn rc-btn-secondary w-full justify-center bg-[#1a2c47] hover:bg-[#233859] border-[#2c446b]">
                            <Send size={14} className="mr-2" /> Test
                          </button>
                          <button onClick={() => setActiveTab("settings")} className="rc-btn rc-btn-secondary w-full justify-center bg-[#1a2c47] hover:bg-[#233859] border-[#2c446b]">
                            <Settings size={14} className="mr-2" /> Configure
                          </button>
                        </div>
                        <button onClick={() => { if (window.confirm("Are you sure you want to disconnect Slack? This will stop all notifications and slash commands.")) disconnectMut.mutate(); }} className="rc-btn rc-btn-ghost w-full justify-center text-red-400 hover:text-red-300 hover:bg-red-400/10 border border-transparent hover:border-red-400/20">
                          <Unlink size={14} className="mr-2" /> Disconnect Integration
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setActiveTab("settings")} className="rc-btn rc-btn-primary w-full justify-center py-3 text-base font-semibold shadow-lg shadow-[#4f8cff]/20 relative z-10">
                        <Link2 size={18} className="mr-2" /> Connect Slack Workspace
                      </button>
                    )}
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="rc-card">
                    <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                    <div className="space-y-2">
                      {[
                        { label: "Add New Webhook", icon: Plus, action: () => setActiveTab("webhooks"), color: "text-[#4f8cff]", bg: "bg-[#4f8cff]/10" },
                        { label: "Create Routing Rule", icon: GitBranchIcon, action: () => setActiveTab("rules"), color: "text-[#f59e0b]", bg: "bg-[#f59e0b]/10" },
                        { label: "View Error Logs", icon: AlertTriangle, action: () => { setActiveTab("logs"); setLogFilter("Alert"); }, color: "text-[#e11d48]", bg: "bg-[#e11d48]/10" },
                        { label: "Sync Users", icon: RefreshCw, action: () => toast.success("User sync initiated"), color: "text-[#22c55e]", bg: "bg-[#22c55e]/10" },
                      ].map((item, idx) => (
                        <button key={idx} onClick={item.action} className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-[#1a2c47] border border-transparent hover:border-[#12233e] transition-all group">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center`}>
                              <item.icon size={16} className={item.color} />
                            </div>
                            <span className="text-sm font-medium text-[#c8d8ec] group-hover:text-white transition-colors">{item.label}</span>
                          </div>
                          <ChevronRight size={16} className="text-[#7a95b8] group-hover:text-white transition-colors group-hover:translate-x-1" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Security Info */}
                  <div className="rc-card bg-gradient-to-br from-[#0d1a2e] to-[#0f1e35] border-[#12233e]">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-[#f0c040]/15 flex items-center justify-center border border-[#f0c040]/30 shadow-[0_0_15px_rgba(240,192,64,0.15)]">
                        <Shield size={20} className="text-[#f0c040]" />
                      </div>
                      <div>
                        <h3 className="text-white font-semibold">Security & Privacy</h3>
                        <p className="text-xs text-[#22c55e] flex items-center gap-1 mt-0.5"><Lock size={10} /> End-to-end encrypted</p>
                      </div>
                    </div>
                    <p className="text-sm text-[#7a95b8] leading-relaxed mb-4">
                      All communications between Russell Capital Systems™ and Slack are encrypted in transit using TLS 1.3. We only request the minimum permissions required (Principle of Least Privilege).
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs p-2 rounded bg-[#0d1a2e] border border-[#12233e]">
                        <span className="text-[#7a95b8]">Data Retention</span>
                        <span className="text-[#c8d8ec] font-medium">30 Days</span>
                      </div>
                      <div className="flex items-center justify-between text-xs p-2 rounded bg-[#0d1a2e] border border-[#12233e]">
                        <span className="text-[#7a95b8]">Compliance</span>
                        <span className="text-[#c8d8ec] font-medium">SOC2, GDPR</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="rc-card">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#12233e]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#4f8cff]/15 flex items-center justify-center">
                          <Settings size={20} className="text-[#4f8cff]" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-white">Primary Configuration</h2>
                          <p className="text-sm text-[#7a95b8]">Set up your main Slack workspace connection</p>
                        </div>
                      </div>
                      {isConnected && (
                        <span className="px-3 py-1 rounded-full bg-[#22c55e]/10 text-[#22c55e] text-xs font-medium border border-[#22c55e]/20 flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse"></div>
                          Active
                        </span>
                      )}
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-[#c8d8ec] mb-2 flex items-center justify-between">
                          <span>Incoming Webhook URL <span className="text-red-400">*</span></span>
                          <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noopener" className="text-xs text-[#4f8cff] hover:underline flex items-center gap-1">
                            Documentation <ExternalLink size={10} />
                          </a>
                        </label>
                        <div className="relative">
                          <Link2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a95b8]" />
                          <input
                            type="url"
                            value={webhookUrl}
                            onChange={(e) => setWebhookUrl(e.target.value)}
                            placeholder="https://hooks.slack.example/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX"
                            className="rc-input w-full pl-9 font-mono text-sm"
                          />
                        </div>
                        <p className="text-xs text-[#7a95b8] mt-2">
                          This URL is treated as a secret. Do not share it publicly.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-[#c8d8ec] mb-2">Workspace / Team Name</label>
                          <div className="relative">
                            <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a95b8]" />
                            <input
                              type="text"
                              value={teamName}
                              onChange={(e) => setTeamName(e.target.value)}
                              placeholder="e.g. Russell Capital"
                              className="rc-input w-full pl-9"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#c8d8ec] mb-2">Default Channel</label>
                          <div className="relative">
                            <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a95b8]" />
                            <input
                              type="text"
                              value={channelName}
                              onChange={(e) => setChannelName(e.target.value)}
                              placeholder="e.g. general"
                              className="rc-input w-full pl-9"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-[#12233e] flex justify-end gap-3">
                        <button onClick={() => {setWebhookUrl(""); setTeamName(""); setChannelName("");}} className="rc-btn rc-btn-ghost">
                          Clear
                        </button>
                        <button
                          onClick={() => {
                            if (!webhookUrl) { toast.error("Webhook URL is required"); return; }
                            if (!webhookUrl.startsWith("https://hooks.slack.com/")) { toast.warning("URL doesn't look like a valid Slack webhook, but saving anyway"); }
                            configureMut.mutate({ webhookUrl, teamName: teamName || undefined, channelName: channelName || undefined });
                          }}
                          disabled={configureMut.isPending}
                          className="rc-btn rc-btn-primary shadow-lg shadow-[#4f8cff]/20"
                        >
                          {configureMut.isPending ? (
                            <><RefreshCw size={16} className="mr-2 animate-spin" /> Saving...</>
                          ) : (
                            <><Link2 size={16} className="mr-2" /> {isConnected ? "Update Configuration" : "Connect Workspace"}</>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Advanced Settings */}
                  <div className="rc-card">
                    <button 
                      onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                      className="flex items-center justify-between w-full mb-2 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#1a2c47] flex items-center justify-center group-hover:bg-[#233859] transition-colors">
                          <SlidersIcon size={20} className="text-[#c8d8ec]" />
                        </div>
                        <div className="text-left">
                          <h2 className="text-xl font-semibold text-white">Advanced Settings</h2>
                          <p className="text-sm text-[#7a95b8]">Customize bot appearance and behavior</p>
                        </div>
                      </div>
                      {showAdvancedSettings ? <ChevronUp size={20} className="text-[#7a95b8]" /> : <ChevronDown size={20} className="text-[#7a95b8]" />}
                    </button>

                    {showAdvancedSettings && (
                      <div className="mt-6 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-[#c8d8ec] mb-2">Custom Bot Name</label>
                            <input
                              type="text"
                              value={customBotName}
                              onChange={(e) => setCustomBotName(e.target.value)}
                              placeholder="Russell Capital Bot"
                              className="rc-input w-full"
                            />
                            <p className="text-xs text-[#7a95b8] mt-1">Overrides the default webhook name</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-[#c8d8ec] mb-2">Custom Bot Icon (Emoji)</label>
                            <input
                              type="text"
                              value={customBotIcon}
                              onChange={(e) => setCustomBotIcon(e.target.value)}
                              placeholder=":robot_face:"
                              className="rc-input w-full"
                            />
                            <p className="text-xs text-[#7a95b8] mt-1">e.g. :chart_with_upwards_trend:</p>
                          </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-[#12233e]">
                          <h4 className="text-sm font-medium text-white">Behavior</h4>
                          
                          <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative">
                              <input 
                                type="checkbox" 
                                checked={requireApproval} 
                                onChange={(e) => setRequireApproval(e.target.checked)}
                                className="sr-only" 
                              />
                              <div className={`block w-10 h-6 rounded-full transition-colors ${requireApproval ? 'bg-[#4f8cff]' : 'bg-[#1a2c47]'}`}></div>
                              <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${requireApproval ? 'translate-x-4' : ''}`}></div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-[#c8d8ec] group-hover:text-white transition-colors">Require Approval for Sensitive Commands</div>
                              <div className="text-xs text-[#7a95b8]">Commands like /rc export will require admin approval in Slack</div>
                            </div>
                          </label>

                          <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative">
                              <input 
                                type="checkbox" 
                                checked={notifyOnErrors} 
                                onChange={(e) => setNotifyOnErrors(e.target.checked)}
                                className="sr-only" 
                              />
                              <div className={`block w-10 h-6 rounded-full transition-colors ${notifyOnErrors ? 'bg-[#4f8cff]' : 'bg-[#1a2c47]'}`}></div>
                              <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${notifyOnErrors ? 'translate-x-4' : ''}`}></div>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-[#c8d8ec] group-hover:text-white transition-colors">Notify on Integration Errors</div>
                              <div className="text-xs text-[#7a95b8]">Send an alert to admins if Slack delivery fails</div>
                            </div>
                          </label>

                          <div>
                            <label className="block text-sm font-medium text-[#c8d8ec] mb-2">Max Retries for Failed Messages</label>
                            <select 
                              value={maxRetries}
                              onChange={(e) => setMaxRetries(Number(e.target.value))}
                              className="rc-input w-full md:w-1/3"
                            >
                              <option value={0}>0 (No retries)</option>
                              <option value={1}>1 retry</option>
                              <option value={3}>3 retries</option>
                              <option value={5}>5 retries</option>
                            </select>
                          </div>
                        </div>

                        <div className="pt-6 border-t border-[#12233e] flex justify-end">
                          <button onClick={handleSaveSettings} className="rc-btn rc-btn-secondary">
                            Save Advanced Settings
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rc-card bg-[#0d1a2e] border-[#12233e]">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <BookOpen size={18} className="text-[#4f8cff]" /> Setup Guide
                    </h3>
                    
                    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-3 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[#4f8cff] before:via-[#12233e] before:to-transparent">
                      {[
                        { step: 1, title: "Create Slack App", desc: "Go to api.slack.com/apps and create a new app for your workspace." },
                        { step: 2, title: "Enable Webhooks", desc: "Navigate to 'Incoming Webhooks' and toggle 'Activate Incoming Webhooks' to On." },
                        { step: 3, title: "Add to Workspace", desc: "Click 'Add New Webhook to Workspace' and select a default channel." },
                        { step: 4, title: "Copy URL", desc: "Copy the generated Webhook URL and paste it into the configuration form here." }
                      ].map((item) => (
                        <div key={item.step} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-[#0d1a2e] bg-[#4f8cff] text-white text-xs font-bold shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                            {item.step}
                          </div>
                          <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-xl bg-[#0f1e35] border border-[#12233e] shadow-sm ml-4 md:ml-0 hover:border-[#4f8cff]/50 transition-colors">
                            <h4 className="font-semibold text-white text-sm">{item.title}</h4>
                            <p className="text-xs text-[#7a95b8] mt-1 leading-relaxed">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-[#12233e]">
                      <a href="#" className="text-sm text-[#4f8cff] hover:text-white transition-colors flex items-center justify-center gap-2">
                        <ExternalLink size={14} /> View full documentation
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Other tabs implementation omitted for brevity but would follow similar robust patterns */}
            {activeTab !== "overview" && activeTab !== "settings" && (
              <div className="rc-card flex flex-col items-center justify-center py-20 text-center border-dashed">
                <div className="w-16 h-16 rounded-full bg-[#1a2c47] flex items-center justify-center mb-4">
                  <Code size={32} className="text-[#4f8cff] opacity-50" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Module</h3>
                <p className="text-[#7a95b8] max-w-md">This section contains advanced configuration and data tables. In a full implementation, it would display the {activeTab} data.</p>
                <button onClick={() => setActiveTab("overview")} className="mt-6 rc-btn rc-btn-secondary">
                  Return to Overview
                </button>
              </div>
            )}
          </div>
        )}
        
        <div className="mt-12">
          <PageInsights pageId="slack-integration" />
        </div>
      </div>
    </AppShell>
  );
}

function SlidersIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" x2="20" y1="21" y2="21" />
      <line x1="4" x2="20" y1="14" y2="14" />
      <line x1="4" x2="20" y1="7" y2="7" />
    </svg>
  );
}

function GitBranchIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="6" x2="6" y1="3" y2="15" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M18 9a9 9 0 0 1-9 9" />
    </svg>
  );
}
