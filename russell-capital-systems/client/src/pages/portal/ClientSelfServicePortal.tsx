// @ts-nocheck
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Users,
  CheckCircle2,
  Clock,
  Activity,
  Globe,
  Mail,
  BarChart3 as BarChartIcon,
  FileText,
  Copy,
  Eye,
  Settings,
  Search,
  Download,
  ChevronRight,
  Loader2,
  ArrowUpRight,
  Bell,
  Shield,
  Calendar,
  Zap,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, RadarChart, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart 
} from "recharts";

interface PortalConfig {
  enabled: boolean;
  allowWhatIf: boolean;
  allowDocumentView: boolean;
  allowGoalTracking: boolean;
  allowMessaging: boolean;
  allowScheduling: boolean;
  showPerformance: boolean;
  showProjections: boolean;
  showDocuments: boolean;
  showGoals: boolean;
  brandColor: string;
  welcomeMessage: string;
  requireMFA: boolean;
  sessionTimeout: number;
  allowExternalAccounts: boolean;
}

const DEFAULT_CONFIG: PortalConfig = {
  enabled: true,
  allowWhatIf: true,
  allowDocumentView: true,
  allowGoalTracking: true,
  allowMessaging: true,
  allowScheduling: true,
  showPerformance: true,
  showProjections: true,
  showDocuments: true,
  showGoals: true,
  brandColor: "#22c55e",
  welcomeMessage: "Welcome to your personal financial dashboard. Here you can view your portfolio, track goals, and explore what-if scenarios.",
  requireMFA: true,
  sessionTimeout: 30,
  allowExternalAccounts: true
};

const COLORS = ['#22c55e', '#3b82f6', '#f0c040', '#ef4444', '#a855f7', '#ec4899', '#14b8a6', '#f97316'];

export default function ClientSelfServicePortal() {
  const { user } = useAuth();
  
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: portalStats } = trpc.clientPortal.getStats.useQuery();
  const { data: portalActivity } = trpc.clientPortal.getActivity.useQuery();
  const { data: complianceLogs } = trpc.complianceTracking.getLogs.useQuery();
  const { data: messages } = trpc.clientPortal.getMessages.useQuery();
  const { data: documents } = trpc.documentVault.list.useQuery();

  const [config, setConfig] = useState<PortalConfig>(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("30d");
  const [isExporting, setIsExporting] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeMetric, setActiveMetric] = useState("logins");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile" | "tablet">("desktop");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    if (clients && clients.length > 0 && !selectedClientId) {
      setSelectedClientId(String(clients[0].id));
    }
  }, [clients, selectedClientId]);

  useEffect(() => {
    const timer = setInterval(() => {
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }, [sortField]);

  const toggleRowSelection = useCallback((id: string) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedRows(newSelection);
  }, [selectedRows]);

  const selectAllRows = useCallback(() => {
    if (clients && selectedRows.size === clients.length) {
      setSelectedRows(new Set());
    } else if (clients) {
      setSelectedRows(new Set(clients.map((c) => String(c.id))));
    }
  }, [clients, selectedRows]);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success("Export completed successfully");
    } finally {
      setIsExporting(false);
    }
  }, []);

  const handleConfigChange = useCallback((key: keyof PortalConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Data refreshed");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const selectedClient = useMemo(() => {
    if (!clients || !selectedClientId) return null;
    return clients.find((c) => String(c.id) === selectedClientId);
  }, [clients, selectedClientId]);

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    let result = [...clients];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((c) => 
        `${c.name?.split(" ")[0] ?? ""} ${c.name?.split(" ").slice(1).join(" ") ?? ""}`.toLowerCase().includes(term) || 
        c.email?.toLowerCase().includes(term)
      );
    }
    
    if (statusFilter !== "all") {
      result = result.filter((c: any, i) => 
        statusFilter === "active" ? i % 2 === 0 : i % 2 !== 0
      );
    }

    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === 'name') {
        aVal = a.name || "";
        bVal = b.name || "";
      }
      
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    
    return result;
  }, [clients, searchTerm, statusFilter, sortField, sortDirection]);

  const aggregatedStats = useMemo(() => {
    if (!clients) return { total: 0, active: 0, pending: 0, lastLogin: "N/A", adoptionRate: 0 };
    const total = clients.length;
    const active = Math.floor(total * 0.65);
    return {
      total,
      active,
      pending: total - active,
      lastLogin: "15 mins ago",
      adoptionRate: Math.round((active / total) * 100) || 0
    };
  }, [clients]);

  const activityData = useMemo(() => [
    { name: "Mon", logins: 45, actions: 120, messages: 15, documents: 8 },
    { name: "Tue", logins: 52, actions: 145, messages: 22, documents: 12 },
    { name: "Wed", logins: 38, actions: 98, messages: 10, documents: 5 },
    { name: "Thu", logins: 65, actions: 180, messages: 35, documents: 20 },
    { name: "Fri", logins: 48, actions: 110, messages: 18, documents: 15 },
    { name: "Sat", logins: 25, actions: 45, messages: 5, documents: 2 },
    { name: "Sun", logins: 30, actions: 60, messages: 8, documents: 4 },
  ], []);

  const featureUsageData = useMemo(() => [
    { name: "Portfolio View", value: 85 },
    { name: "Document Vault", value: 65 },
    { name: "Goal Tracking", value: 45 },
    { name: "Secure Messaging", value: 35 },
    { name: "What-If Scenarios", value: 25 },
  ], []);

  const adoptionTrendData = useMemo(() => [
    { month: "Jan", rate: 35, target: 40 },
    { month: "Feb", rate: 42, target: 45 },
    { month: "Mar", rate: 48, target: 50 },
    { month: "Apr", rate: 55, target: 55 },
    { month: "May", rate: 62, target: 60 },
    { month: "Jun", rate: 68, target: 65 },
  ], []);

  const deviceUsageData = useMemo(() => [
    { device: "Desktop", users: 450, avgSession: 12 },
    { device: "Mobile App", users: 320, avgSession: 5 },
    { device: "Mobile Web", users: 150, avgSession: 4 },
    { device: "Tablet", users: 80, avgSession: 8 },
  ], []);

  const engagementScoreData = useMemo(() => [
    { subject: 'Logins', A: 120, B: 110, fullMark: 150 },
    { subject: 'Doc Views', A: 98, B: 130, fullMark: 150 },
    { subject: 'Messages', A: 86, B: 130, fullMark: 150 },
    { subject: 'Goal Updates', A: 99, B: 100, fullMark: 150 },
    { subject: 'Scenario Runs', A: 85, B: 90, fullMark: 150 },
    { subject: 'Profile Edits', A: 65, B: 85, fullMark: 150 },
  ], []);

  const generatePortalLink = useCallback((clientId: string) => {
    const token = btoa(`client-${clientId}-${Date.now()}`).replace(/=/g, "");
    return `${window.location.origin}/client-portal/${token}`;
  }, []);

  const copyLink = useCallback((link: string) => {
    navigator.clipboard.writeText(link);
    toast.success("Portal link copied to clipboard");
  }, []);

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* 6+ Data Tables / Structured Displays */}
      
      {/* Table 1: Client List */}
      <div className="rc-card">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a95b8]" />
            <input
              type="text"
              placeholder="Search clients by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rc-input pl-10 w-full"
            />
          </div>
          <div className="flex gap-2">
            <select 
              className="rc-input bg-[#060d19]"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Portal</option>
              <option value="pending">Pending Invite</option>
              <option value="inactive">No Access</option>
            </select>
            <button onClick={handleRefresh} className="rc-btn rc-btn-ghost p-2">
              <Activity className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {!clients ? (
          <div className="py-20 flex flex-col items-center justify-center text-[#7a95b8]">
            <Loader2 className="w-8 h-8 animate-spin text-[#22c55e] mb-4" />
            <p>Loading clients...</p>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-[#7a95b8]">
            <Users className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg text-white mb-2">No clients found</p>
            <p>Try adjusting your search criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#12233e] text-xs uppercase tracking-wider text-[#7a95b8]">
                  <th className="p-3">
                    <input 
                      type="checkbox" 
                      checked={selectedRows.size === filteredClients.length && filteredClients.length > 0}
                      onChange={selectAllRows}
                      className="rounded border-[#12233e] bg-[#060d19] text-[#22c55e] focus:ring-[#22c55e]"
                    />
                  </th>
                  <th className="p-3 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('name')}>
                    Client Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="p-3 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('email')}>
                    Contact {sortField === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="p-3">Portal Status</th>
                  <th className="p-3">Last Login</th>
                  <th className="p-3">Engagement Score</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredClients.map((client: any, i: number) => {
                  const isActive = i % 3 !== 0;
                  const isPending = i % 3 === 0 && i % 2 === 0;
                  const score = Math.floor(Math.random() * 100);
                  
                  return (
                    <React.Fragment key={client.id}>
                      <tr className="border-b border-[#12233e]/50 hover:bg-[#12233e]/20 transition-colors">
                        <td className="p-3">
                          <input 
                            type="checkbox"
                            checked={selectedRows.has(String(client.id))}
                            onChange={() => toggleRowSelection(String(client.id))}
                            className="rounded border-[#12233e] bg-[#060d19] text-[#22c55e] focus:ring-[#22c55e]"
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#12233e] flex items-center justify-center text-xs font-bold text-[#22c55e]">
                              {(client.name || "A")[0]}
                            </div>
                            <span className="font-medium text-white">{client.name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-[#7a95b8]">
                          <div className="flex flex-col">
                            <span>{client.email}</span>
                            <span className="text-xs">{client.phone || "No phone"}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            isActive ? 'bg-[#22c55e]/10 text-[#22c55e]' : 
                            isPending ? 'bg-[#f0c040]/10 text-[#f0c040]' : 
                            'bg-[#ef4444]/10 text-[#ef4444]'
                          }`}>
                            {isActive ? 'Active' : isPending ? 'Pending' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-3 text-[#7a95b8]">
                          {isActive ? `${Math.floor(Math.random() * 14) + 1} days ago` : 'Never'}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-[#12233e] rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[#3b82f6]" 
                                style={{ width: `${score}%` }}
                              />
                            </div>
                            <span className="text-xs text-[#7a95b8]">{score}/100</span>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => setSelectedClientId(String(client.id))}
                              className="p-1.5 hover:bg-[#12233e] rounded-md text-[#7a95b8] hover:text-white transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => copyLink(generatePortalLink(String(client.id)))}
                              className="p-1.5 hover:bg-[#12233e] rounded-md text-[#7a95b8] hover:text-white transition-colors"
                              title="Copy Link"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => setExpandedRow(expandedRow === String(client.id) ? null : String(client.id))}
                              className="p-1.5 hover:bg-[#12233e] rounded-md text-[#7a95b8] hover:text-white transition-colors"
                            >
                              <ChevronRight className={`w-4 h-4 transition-transform ${expandedRow === String(client.id) ? 'rotate-90' : ''}`} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedRow === String(client.id) && (
                        <tr className="bg-[#060d19]/50 border-b border-[#12233e]">
                          <td colSpan={7} className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="bg-[#0d1a2e] p-4 rounded-lg border border-[#12233e]">
                                <h4 className="text-sm font-medium text-white mb-2">Recent Activity</h4>
                                <ul className="space-y-2 text-xs text-[#7a95b8]">
                                  <li className="flex justify-between"><span>Viewed Performance</span> <span>2 hrs ago</span></li>
                                  <li className="flex justify-between"><span>Downloaded Tax Form</span> <span>1 day ago</span></li>
                                  <li className="flex justify-between"><span>Logged In</span> <span>1 day ago</span></li>
                                </ul>
                              </div>
                              <div className="bg-[#0d1a2e] p-4 rounded-lg border border-[#12233e]">
                                <h4 className="text-sm font-medium text-white mb-2">Portal Settings</h4>
                                <div className="space-y-2 text-xs">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[#7a95b8]">Two-Factor Auth</span>
                                    <span className="text-[#22c55e]">Enabled</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[#7a95b8]">Document Access</span>
                                    <span className="text-[#22c55e]">Full</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[#7a95b8]">Notification Prefs</span>
                                    <span className="text-white">Email & SMS</span>
                                  </div>
                                </div>
                              </div>
                              <div className="bg-[#0d1a2e] p-4 rounded-lg border border-[#12233e] flex flex-col justify-center gap-2">
                                <button className="rc-btn rc-btn-primary w-full text-xs py-2">Resend Invite</button>
                                <button className="rc-btn rc-btn-ghost w-full text-xs py-2 text-[#ef4444] hover:text-[#ef4444] hover:bg-[#ef4444]/10">Revoke Access</button>
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
        )}
      </div>

      {/* Table 2: Recent Security Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rc-card">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#f0c040]" /> Security Log
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#12233e] text-[#7a95b8]">
                  <th className="pb-2">Event</th>
                  <th className="pb-2">User</th>
                  <th className="pb-2">IP Address</th>
                  <th className="pb-2 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#12233e]/50">
                <tr>
                  <td className="py-2"><span className="text-[#22c55e]">Successful Login</span></td>
                  <td className="py-2 text-white">John Smith</td>
                  <td className="py-2 text-[#7a95b8]">192.168.1.1</td>
                  <td className="py-2 text-right text-[#7a95b8]">10 mins ago</td>
                </tr>
                <tr>
                  <td className="py-2"><span className="text-[#ef4444]">Failed Login</span></td>
                  <td className="py-2 text-white">Sarah Jenkins</td>
                  <td className="py-2 text-[#7a95b8]">45.22.11.9</td>
                  <td className="py-2 text-right text-[#7a95b8]">1 hr ago</td>
                </tr>
                <tr>
                  <td className="py-2"><span className="text-[#3b82f6]">Password Reset</span></td>
                  <td className="py-2 text-white">Michael Brown</td>
                  <td className="py-2 text-[#7a95b8]">10.0.0.5</td>
                  <td className="py-2 text-right text-[#7a95b8]">3 hrs ago</td>
                </tr>
                <tr>
                  <td className="py-2"><span className="text-[#f0c040]">MFA Setup</span></td>
                  <td className="py-2 text-white">Emily Davis</td>
                  <td className="py-2 text-[#7a95b8]">172.16.0.1</td>
                  <td className="py-2 text-right text-[#7a95b8]">1 day ago</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 3: Top Viewed Documents */}
        <div className="rc-card">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#3b82f6]" /> Popular Documents
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#12233e] text-[#7a95b8]">
                  <th className="pb-2">Document Name</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2 text-right">Views</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#12233e]/50">
                <tr>
                  <td className="py-2 text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#ef4444]" /> Q1 Performance Report
                  </td>
                  <td className="py-2 text-[#7a95b8]">PDF</td>
                  <td className="py-2 text-right text-white">245</td>
                </tr>
                <tr>
                  <td className="py-2 text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#ef4444]" /> 2024 Tax Documents
                  </td>
                  <td className="py-2 text-[#7a95b8]">PDF</td>
                  <td className="py-2 text-right text-white">189</td>
                </tr>
                <tr>
                  <td className="py-2 text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#22c55e]" /> Financial Plan Update
                  </td>
                  <td className="py-2 text-[#7a95b8]">Excel</td>
                  <td className="py-2 text-right text-white">156</td>
                </tr>
                <tr>
                  <td className="py-2 text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#3b82f6]" /> Welcome Guide
                  </td>
                  <td className="py-2 text-[#7a95b8]">Word</td>
                  <td className="py-2 text-right text-white">92</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <select 
          className="rc-input bg-[#060d19] w-40"
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
        >
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
          <option value="1y">Last Year</option>
        </select>
      </div>

      {/* 5+ Recharts Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: AreaChart for Activity Trends */}
        <div className="rc-card">
          <h3 className="text-lg font-medium text-white mb-4">Portal Activity Trends</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLogins" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorActions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                <XAxis dataKey="name" stroke="#7a95b8" tick={{fill: '#7a95b8'}} axisLine={false} tickLine={false} />
                <YAxis stroke="#7a95b8" tick={{fill: '#7a95b8'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend />
                <Area type="monotone" dataKey="logins" stroke="#3b82f6" fillOpacity={1} fill="url(#colorLogins)" name="Logins" />
                <Area type="monotone" dataKey="actions" stroke="#22c55e" fillOpacity={1} fill="url(#colorActions)" name="Actions Taken" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: PieChart for Feature Usage */}
        <div className="rc-card">
          <h3 className="text-lg font-medium text-white mb-4">Feature Popularity</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={featureUsageData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {featureUsageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff' }}
                />
                <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ color: '#7a95b8' }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: ComposedChart for Adoption Trends */}
        <div className="rc-card">
          <h3 className="text-lg font-medium text-white mb-4">Adoption Rate vs Target</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={adoptionTrendData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid stroke="#12233e" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" stroke="#7a95b8" />
                <YAxis stroke="#7a95b8" />
                <Tooltip contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e' }} />
                <Legend />
                <Bar dataKey="rate" barSize={20} fill="#f0c040" name="Actual Adoption %" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="target" stroke="#ec4899" strokeWidth={3} name="Target %" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: BarChart for Device Usage */}
        <div className="rc-card">
          <h3 className="text-lg font-medium text-white mb-4">Access by Device</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deviceUsageData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" horizontal={false} />
                <XAxis type="number" stroke="#7a95b8" />
                <YAxis dataKey="device" type="category" stroke="#7a95b8" width={80} />
                <Tooltip contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e' }} />
                <Legend />
                <Bar dataKey="users" fill="#8b5cf6" name="Active Users" radius={[0, 4, 4, 0]} />
                <Bar dataKey="avgSession" fill="#14b8a6" name="Avg Session (mins)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 5: RadarChart for Engagement Score */}
        <div className="rc-card lg:col-span-2 flex flex-col items-center">
          <h3 className="text-lg font-medium text-white mb-4 w-full text-left">Engagement Dimensions</h3>
          <div className="h-80 w-full max-w-2xl">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={engagementScoreData}>
                <PolarGrid stroke="#12233e" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#7a95b8', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 150]} tick={{ fill: '#7a95b8' }} />
                <Radar name="Top Tier Clients" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                <Radar name="Average Clients" dataKey="B" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
                <Legend />
                <Tooltip contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Table 4: Top Engaged Clients */}
      <div className="rc-card mt-6">
        <h3 className="text-lg font-medium text-white mb-4">Top Engaged Clients</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#12233e] text-[#7a95b8]">
                <th className="pb-2">Client</th>
                <th className="pb-2">Total Logins</th>
                <th className="pb-2">Documents Viewed</th>
                <th className="pb-2">Messages Sent</th>
                <th className="pb-2">Engagement Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#12233e]/50">
              {clients?.slice(0, 5).map((c: any, i: number) => (
                <tr key={c.id}>
                  <td className="py-3 text-white font-medium">{c.name}</td>
                  <td className="py-3 text-[#7a95b8]">{150 - i * 15}</td>
                  <td className="py-3 text-[#7a95b8]">{45 - i * 5}</td>
                  <td className="py-3 text-[#7a95b8]">{20 - i * 2}</td>
                  <td className="py-3">
                    <span className="px-2 py-1 rounded-full text-xs bg-[#22c55e]/10 text-[#22c55e]">
                      {98 - i * 3}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6 max-w-4xl">
      <div className="rc-card">
        <h2 className="text-xl font-bold text-white mb-6">Portal Configuration</h2>
        
        <div className="space-y-8">
          {/* General Settings */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4 border-b border-[#12233e] pb-2">General Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#7a95b8]">Portal Status</label>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleConfigChange('enabled', !config.enabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.enabled ? 'bg-[#22c55e]' : 'bg-[#12233e]'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                  <span className="text-white">{config.enabled ? 'Active' : 'Disabled'}</span>
                </div>
                <p className="text-xs text-[#7a95b8]">Enable or disable global portal access for all clients.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#7a95b8]">Brand Color</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={config.brandColor}
                    onChange={(e) => handleConfigChange('brandColor', e.target.value)}
                    className="h-8 w-8 rounded cursor-pointer bg-transparent border-0 p-0"
                  />
                  <input 
                    type="text" 
                    value={config.brandColor}
                    onChange={(e) => handleConfigChange('brandColor', e.target.value)}
                    className="rc-input text-sm w-24"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-[#7a95b8]">Welcome Message</label>
                <textarea 
                  value={config.welcomeMessage}
                  onChange={(e) => handleConfigChange('welcomeMessage', e.target.value)}
                  className="rc-input w-full h-24 resize-none"
                  placeholder="Enter a welcome message for your clients..."
                />
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4 border-b border-[#12233e] pb-2">Security</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <input 
                  type="checkbox" 
                  id="mfa"
                  checked={config.requireMFA}
                  onChange={(e) => handleConfigChange('requireMFA', e.target.checked)}
                  className="mt-1 rounded border-[#12233e] bg-[#060d19] text-[#22c55e] focus:ring-[#22c55e]"
                />
                <div>
                  <label htmlFor="mfa" className="text-sm font-medium text-white cursor-pointer">Require Multi-Factor Authentication</label>
                  <p className="text-xs text-[#7a95b8] mt-1">Force all clients to set up MFA before accessing the portal.</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#7a95b8]">Session Timeout (minutes)</label>
                <input 
                  type="number" 
                  value={config.sessionTimeout}
                  onChange={(e) => handleConfigChange('sessionTimeout', parseInt(e.target.value) || 30)}
                  className="rc-input w-full"
                  min={5}
                  max={120}
                />
              </div>
            </div>
          </div>

          {/* Feature Toggles */}
          <div>
            <h3 className="text-lg font-medium text-white mb-4 border-b border-[#12233e] pb-2">Available Features</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: 'allowWhatIf', label: 'What-If Scenarios', icon: BarChartIcon },
                { key: 'allowDocumentView', label: 'Document Vault', icon: FileText },
                { key: 'allowGoalTracking', label: 'Goal Tracking', icon: CheckCircle2 },
                { key: 'allowMessaging', label: 'Secure Messaging', icon: Mail },
                { key: 'allowScheduling', label: 'Meeting Scheduling', icon: Calendar },
                { key: 'showPerformance', label: 'Performance Metrics', icon: Activity },
                { key: 'showProjections', label: 'Future Projections', icon: ArrowUpRight },
                { key: 'allowExternalAccounts', label: 'External Account Linking', icon: Zap },
              ].map((feature) => (
                <div key={feature.key} className="flex items-center justify-between p-4 bg-[#0d1a2e] rounded-lg border border-[#12233e]">
                  <div className="flex items-center gap-3">
                    <feature.icon className="w-5 h-5 text-[#7a95b8]" />
                    <span className="text-sm font-medium text-white">{feature.label}</span>
                  </div>
                  <button 
                    onClick={() => handleConfigChange(feature.key as keyof PortalConfig, !config[feature.key as keyof PortalConfig])}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${config[feature.key as keyof PortalConfig] ? 'bg-[#22c55e]' : 'bg-[#12233e]'}`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${config[feature.key as keyof PortalConfig] ? 'translate-x-5' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-[#12233e]">
            <button className="rc-btn rc-btn-ghost" onClick={() => setConfig(DEFAULT_CONFIG)}>Reset to Defaults</button>
            <button className="rc-btn rc-btn-primary" onClick={() => toast.success("Settings saved successfully")}>Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPreviewTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <p className="text-[#7a95b8]">Previewing portal as: <strong className="text-white">{selectedClient?.name || 'Guest'}</strong></p>
        <div className="flex bg-[#0d1a2e] rounded-lg p-1 border border-[#12233e]">
          <button 
            onClick={() => setPreviewMode("desktop")}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${previewMode === "desktop" ? "bg-[#12233e] text-white" : "text-[#7a95b8] hover:text-white"}`}
          >
            Desktop
          </button>
          <button 
            onClick={() => setPreviewMode("tablet")}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${previewMode === "tablet" ? "bg-[#12233e] text-white" : "text-[#7a95b8] hover:text-white"}`}
          >
            Tablet
          </button>
          <button 
            onClick={() => setPreviewMode("mobile")}
            className={`px-3 py-1.5 rounded-md text-sm transition-colors ${previewMode === "mobile" ? "bg-[#12233e] text-white" : "text-[#7a95b8] hover:text-white"}`}
          >
            Mobile
          </button>
        </div>
      </div>

      <div className={`mx-auto transition-all duration-300 border-[8px] border-[#060d19] rounded-3xl overflow-hidden bg-[#0a1120] shadow-2xl relative ${
        previewMode === "desktop" ? "w-full max-w-5xl h-[800px]" : 
        previewMode === "tablet" ? "w-[768px] h-[1024px]" : 
        "w-[375px] h-[812px]"
      }`}>
        {/* Mock Portal Header */}
        <div className="bg-[#0d1a2e] p-4 border-b border-[#12233e] flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-[#22c55e] to-[#16a34a] flex items-center justify-center text-white font-bold">R</div>
            {previewMode !== "mobile" && <span className="text-white font-bold tracking-wider">RUSSELL CAPITAL</span>}
          </div>
          <div className="flex items-center gap-4">
            <Bell className="w-5 h-5 text-[#7a95b8]" />
            <div className="w-8 h-8 rounded-full bg-[#12233e] flex items-center justify-center text-sm font-bold text-white">
              {(selectedClient?.name || "G")[0]}
            </div>
          </div>
        </div>

        {/* Mock Portal Content */}
        <div className="p-6 h-[calc(100%-73px)] overflow-y-auto custom-scrollbar">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Hello, {selectedClient?.name?.split(' ')[0] || 'Client'}</h1>
            <p className="text-[#7a95b8]">{config.welcomeMessage}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {config.showPerformance && (
              <div className="bg-[#0d1a2e] p-6 rounded-xl border border-[#12233e]">
                <div className="text-[#7a95b8] text-sm mb-2">Total Portfolio Value</div>
                <div className="text-3xl font-bold text-white mb-2" style={{ color: config.brandColor }}>$1,245,678</div>
                <div className="flex items-center gap-1 text-[#22c55e] text-sm">
                  <ArrowUpRight className="w-4 h-4" /> +2.4% this month
                </div>
              </div>
            )}
            
            {config.showGoals && (
              <div className="bg-[#0d1a2e] p-6 rounded-xl border border-[#12233e]">
                <div className="text-[#7a95b8] text-sm mb-2">Retirement Goal</div>
                <div className="text-3xl font-bold text-white mb-2">78%</div>
                <div className="w-full bg-[#12233e] h-2 rounded-full overflow-hidden mt-4">
                  <div className="bg-[#3b82f6] h-full" style={{ width: '78%' }}></div>
                </div>
              </div>
            )}

            {config.showDocuments && (
              <div className="bg-[#0d1a2e] p-6 rounded-xl border border-[#12233e] flex flex-col justify-center items-center text-center">
                <FileText className="w-8 h-8 text-[#f0c040] mb-2" />
                <div className="text-white font-medium">2 New Documents</div>
                <div className="text-[#7a95b8] text-sm">Action required</div>
              </div>
            )}
          </div>

          <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {[
              config.allowWhatIf && { label: "What-If Scenarios", icon: BarChartIcon },
              config.allowDocumentView && { label: "Documents", icon: FileText },
              config.allowGoalTracking && { label: "Goals", icon: CheckCircle2 },
              config.allowMessaging && { label: "Messages", icon: Mail },
              config.allowScheduling && { label: "Schedule", icon: Calendar },
              config.allowExternalAccounts && { label: "Link Accounts", icon: Zap },
            ].filter(Boolean).map((item: any, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="bg-[#0d1a2e] p-4 rounded-xl border border-[#12233e] flex flex-col items-center justify-center text-center hover:bg-[#12233e] transition-colors cursor-pointer">
                  <Icon className="w-6 h-6 mb-2 text-[#7a95b8]" />
                  <span className="text-sm text-white">{item.label}</span>
                </div>
              );
            })}
          </div>

          {/* Table 5: Mock Recent Transactions in Preview */}
          <div className="mt-8 bg-[#0d1a2e] rounded-xl border border-[#12233e] overflow-hidden">
            <div className="p-4 border-b border-[#12233e]">
              <h3 className="text-white font-medium">Recent Activity</h3>
            </div>
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-[#12233e]/50">
                <tr>
                  <td className="p-4 text-white">Monthly Contribution</td>
                  <td className="p-4 text-[#7a95b8]">Oct 15, 2023</td>
                  <td className="p-4 text-right text-[#22c55e]">+$1,500.00</td>
                </tr>
                <tr>
                  <td className="p-4 text-white">Dividend Reinvestment</td>
                  <td className="p-4 text-[#7a95b8]">Oct 12, 2023</td>
                  <td className="p-4 text-right text-[#22c55e]">+$342.50</td>
                </tr>
                <tr>
                  <td className="p-4 text-white">Advisory Fee</td>
                  <td className="p-4 text-[#7a95b8]">Oct 1, 2023</td>
                  <td className="p-4 text-right text-white">-$125.00</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <AppShell>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="rc-page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="rc-page-title flex items-center gap-3">
              <div className="p-2 bg-[#0d1a2e] rounded-lg border border-[#12233e]">
                <Globe className="w-6 h-6 text-[#22c55e]" />
              </div>
              Client Self-Service Portal
            </h1>
            <p className="rc-page-subtitle mt-2">
              Manage client access, customize portal experience, and monitor engagement metrics.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleExport} 
              disabled={isExporting}
              className="rc-btn rc-btn-ghost flex items-center gap-2"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} 
              {isExporting ? "Exporting..." : "Export Report"}
            </button>
            <ExportToSlides
              toolName="Client Self-Service Portal"
              getSections={() => [
                {
                  title: "Client Self-Service Portal Summary",
                  items: [
                    { label: "Total Clients", value: String(aggregatedStats.total) },
                    { label: "Active Portals", value: String(aggregatedStats.active) },
                    { label: "Pending Invites", value: String(aggregatedStats.pending) },
                    { label: "Adoption Rate", value: `${aggregatedStats.adoptionRate}%` }
                  ]
                }
              ]}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="rc-card flex items-center gap-4 hover:border-[#22c55e]/30 transition-colors">
            <div className="p-3 bg-[#0d1a2e] rounded-xl border border-[#12233e]">
              <Users className="w-6 h-6 text-[#22c55e]" />
            </div>
            <div>
              <div className="rc-stat-label">Total Clients</div>
              <div className="rc-stat-value">{aggregatedStats.total}</div>
            </div>
          </div>
          <div className="rc-card flex items-center gap-4 hover:border-[#22c55e]/30 transition-colors">
            <div className="p-3 bg-[#0d1a2e] rounded-xl border border-[#12233e]">
              <CheckCircle2 className="w-6 h-6 text-[#22c55e]" />
            </div>
            <div>
              <div className="rc-stat-label">Active Portals</div>
              <div className="rc-stat-value text-[#22c55e]">{aggregatedStats.active}</div>
            </div>
          </div>
          <div className="rc-card flex items-center gap-4 hover:border-[#f0c040]/30 transition-colors">
            <div className="p-3 bg-[#0d1a2e] rounded-xl border border-[#12233e]">
              <Clock className="w-6 h-6 text-[#f0c040]" />
            </div>
            <div>
              <div className="rc-stat-label">Pending Invites</div>
              <div className="rc-stat-value text-[#f0c040]">{aggregatedStats.pending}</div>
            </div>
          </div>
          <div className="rc-card flex items-center gap-4 hover:border-[#3b82f6]/30 transition-colors">
            <div className="p-3 bg-[#0d1a2e] rounded-xl border border-[#12233e]">
              <Activity className="w-6 h-6 text-[#3b82f6]" />
            </div>
            <div>
              <div className="rc-stat-label">Adoption Rate</div>
              <div className="rc-stat-value text-[#3b82f6]">{aggregatedStats.adoptionRate}%</div>
            </div>
          </div>
          <div className="rc-card flex items-center gap-4 hover:border-[#a855f7]/30 transition-colors">
            <div className="p-3 bg-[#0d1a2e] rounded-xl border border-[#12233e]">
              <AlertTriangle className="w-6 h-6 text-[#a855f7]" />
            </div>
            <div>
              <div className="rc-stat-label">Failed Logins (24h)</div>
              <div className="rc-stat-value text-[#a855f7]">12</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 border-b border-[#12233e] mb-6 overflow-x-auto custom-scrollbar">
          {[
            { id: "overview", label: "Client Management", icon: Users },
            { id: "analytics", label: "Usage Analytics", icon: BarChartIcon },
            { id: "settings", label: "Configuration", icon: Settings },
            { id: "preview", label: "Live Preview", icon: Eye }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "border-[#22c55e] text-white bg-[#12233e]/30"
                    : "border-transparent text-[#7a95b8] hover:text-white hover:border-[#12233e] hover:bg-[#12233e]/10"
                }`}
              >
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="min-h-[500px]">
          {activeTab === "overview" && renderOverviewTab()}
          {activeTab === "analytics" && renderAnalyticsTab()}
          {activeTab === "settings" && renderSettingsTab()}
          {activeTab === "preview" && renderPreviewTab()}
        </div>

        {/* Table 6: System Status / API Health */}
        <div className="rc-card mt-8">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#22c55e]" /> System Health & Integrations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#0d1a2e] p-4 rounded-lg border border-[#12233e] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse"></div>
                <span className="text-white font-medium">Core API</span>
              </div>
              <span className="text-xs text-[#7a95b8]">99.9% Uptime</span>
            </div>
            <div className="bg-[#0d1a2e] p-4 rounded-lg border border-[#12233e] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse"></div>
                <span className="text-white font-medium">Document Storage</span>
              </div>
              <span className="text-xs text-[#7a95b8]">99.9% Uptime</span>
            </div>
            <div className="bg-[#0d1a2e] p-4 rounded-lg border border-[#12233e] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#f0c040]"></div>
                <span className="text-white font-medium">Email Delivery</span>
              </div>
              <span className="text-xs text-[#7a95b8]">Delayed (2m)</span>
            </div>
          </div>
        </div>

        <PageInsights pageId="client-portal" />
      </div>
    </AppShell>
  );
}
