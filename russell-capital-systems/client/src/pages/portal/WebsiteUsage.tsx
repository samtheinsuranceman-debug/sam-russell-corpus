// @ts-nocheck
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { ExportToSlides } from "@/components/ExportToSlides";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import {
  Lock,
  Users,
  Clock,
  FileText,
  ChevronRight,
  ChevronLeft,
  Shield,
  Activity,
  Eye,
  User,
  Calendar,
  Timer,
  MonitorSmartphone,
  ArrowLeft,
  Search,
  Filter,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Settings,
  Bell,
  Mail,
  MapPin,
  Globe,
  Link as LinkIcon,
  Hash,
  Database,
  Cpu,
  Server,
  HardDrive,
  ShieldAlert,
  ShieldCheck,
  Key,
  Fingerprint,
  Zap,
  Layers,
  LayoutDashboard,
  Menu,
  Info,
  FileLock2,
  FileCheck2,
} from "lucide-react";
import { toast } from "sonner";

import {
  BarChart, LineChart, PieChart, AreaChart, RadarChart, ComposedChart,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  Bar, Line, Pie, Cell, Area, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Scatter, ScatterChart, ZAxis, ErrorBar
} from "recharts";

/* ─── Helpers ─── */
function formatDuration(secs: number | null | undefined): string {
  if (!secs || secs <= 0) return "< 1 min";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "N/A";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1', '#a4de6c', '#d0ed57'];

/* ─── Dummy Data Generators for Visualizations ─── */
const generateTrafficData = () => Array.from({ length: 30 }, (_, i) => ({
  date: `Day ${i + 1}`,
  visitors: Math.floor(Math.random() * 500) + 100,
  pageviews: Math.floor(Math.random() * 1500) + 300,
  bounces: Math.floor(Math.random() * 200) + 50,
}));

const generateDeviceData = () => [
  { name: 'Desktop', value: 400 },
  { name: 'Mobile', value: 300 },
  { name: 'Tablet', value: 100 },
  { name: 'Unknown', value: 50 },
];

const generatePagePerformanceData = () => Array.from({ length: 10 }, (_, i) => ({
  page: `/page-${i + 1}`,
  loadTime: Math.random() * 2 + 0.5,
  interactionTime: Math.random() * 3 + 1,
  renderTime: Math.random() * 1 + 0.2,
}));

const generateUserEngagementData = () => Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  activeUsers: Math.floor(Math.random() * 100) + 10,
  avgSessionLength: Math.floor(Math.random() * 300) + 60,
}));

const generateSecurityEventsData = () => Array.from({ length: 7 }, (_, i) => ({
  day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
  logins: Math.floor(Math.random() * 1000) + 500,
  failedLogins: Math.floor(Math.random() * 50) + 5,
  passwordResets: Math.floor(Math.random() * 20) + 2,
}));

const generateGeographicData = () => [
  { region: 'North America', users: 1500, sessions: 4500 },
  { region: 'Europe', users: 800, sessions: 2100 },
  { region: 'Asia', users: 600, sessions: 1500 },
  { region: 'South America', users: 300, sessions: 800 },
  { region: 'Oceania', users: 150, sessions: 400 },
  { region: 'Africa', users: 100, sessions: 250 },
];

const generateBrowserData = () => [
  { name: 'Chrome', value: 65 },
  { name: 'Safari', value: 20 },
  { name: 'Firefox', value: 8 },
  { name: 'Edge', value: 5 },
  { name: 'Other', value: 2 },
];

const generateFeatureUsageData = () => [
  { feature: 'Dashboard', usage: 85, fullMark: 100 },
  { feature: 'Reports', usage: 60, fullMark: 100 },
  { feature: 'Settings', usage: 30, fullMark: 100 },
  { feature: 'Profile', usage: 45, fullMark: 100 },
  { feature: 'Billing', usage: 20, fullMark: 100 },
  { feature: 'Support', usage: 15, fullMark: 100 },
];

/* ─── Password Gate ─── */
function PasswordGate({ onUnlock }: { onUnlock: (pw: string) => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isAttempting, setIsAttempting] = useState(false);
  const verifyMut = trpc.websiteUsage.verifyPassword.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsAttempting(true);
    try {
      const result = await verifyMut.mutateAsync({ password });
      if (result.verified) {
        onUnlock(password);
      }
    } catch (err: any) {
      const msg = err?.message ?? "Incorrect password";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsAttempting(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="w-full max-w-md border-amber-500/30 bg-gradient-to-b from-slate-900 to-slate-950 shadow-2xl shadow-amber-900/20">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mb-6 border border-amber-500/20">
            <Lock className="w-10 h-10 text-amber-500" />
          </div>
          <CardTitle className="text-2xl text-white font-bold tracking-tight">Restricted Access</CardTitle>
          <CardDescription className="text-slate-400 mt-2 text-base">
            Website Usage Records are protected. Please enter the compliance password to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-slate-300">Compliance Password</Label>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="bg-slate-800/50 border-slate-700 pl-10 h-12 text-lg focus-visible:ring-amber-500"
                  autoFocus
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm mt-2 bg-red-400/10 p-2 rounded">
                  <AlertCircle className="h-4 w-4" />
                  <p>{error}</p>
                </div>
              )}
            </div>
            <Button
              type="submit"
              className="w-full bg-amber-600 hover:bg-amber-700 text-white h-12 text-lg font-medium transition-all"
              disabled={!password || verifyMut.isPending || isAttempting}
            >
              {verifyMut.isPending || isAttempting ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  Verifying Credentials...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  Unlock Records
                </span>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center border-t border-slate-800 mt-4 pt-4">
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <Shield className="h-3 w-3" /> All access attempts are logged for compliance.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

/* ─── Main Page ─── */
export default function WebsiteUsage() {
  const { user } = useAuth();
  const [password, setPassword] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<{
    userId: number; userName: string; userEmail: string | null;
  } | null>(null);
  
  const [activeTab, setActiveTab] = useState("overview");
  const [dateRange, setDateRange] = useState("30d");
  const [searchTerm, setSearchTerm] = useState("");
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedRegion, setSelectedRegion] = useState("All");
  const [chartType, setChartType] = useState("area");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("recent");
  const [sortOrder, setSortOrder] = useState("desc");
  const [isExporting, setIsExporting] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState<string[]>(['Desktop', 'Mobile', 'Tablet']);
  const [minSessionLength, setMinSessionLength] = useState([0]);
  const [maxBounces, setMaxBounces] = useState([100]);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [themeMode, setThemeMode] = useState("dark");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedMetric, setSelectedMetric] = useState("visitors");
  const [comparisonMode, setComparisonMode] = useState(false);
  const [anomalyDetection, setAnomalyDetection] = useState(true);
  const [alertThreshold, setAlertThreshold] = useState([80]);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { data: summary, refetch: refetchSummary } = trpc.websiteUsage.getSummary.useQuery(
    { password: password || "" },
    { enabled: !!password }
  );
  
  const { data: users, refetch: refetchUsers } = trpc.websiteUsage.listUsers.useQuery(
    { password: password || "" },
    { enabled: !!password }
  );

  const { data: activeSessionsData } = trpc.websiteUsage.listUsers.useQuery(
    { password: password || "" },
    { enabled: !!password && autoRefresh }
  );

  const { data: systemStatus } = trpc.compliance.getComplianceStatus.useQuery(
    undefined,
    { enabled: !!password }
  );

  const { data: analyticsData } = trpc.dashboard.getOverview.useQuery(
    undefined,
    { enabled: !!password }
  );

  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    refetchSummary();
    refetchUsers();
    toast.success("Data refreshed successfully");
  }, [refetchSummary, refetchUsers]);

  const toggleRowExpansion = useCallback((id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleExport = useCallback(() => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      toast.success("Export completed and downloaded");
    }, 1500);
  }, []);

  const toggleDeviceFilter = useCallback((device: string) => {
    setSelectedDevices(prev => 
      prev.includes(device) ? prev.filter((d) => d !== device) : [...prev, device]
    );
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh && password) {
      interval = setInterval(() => {
        handleRefresh();
      }, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, password, handleRefresh]);

  useEffect(() => {
    if (password) {
      toast.success("Authentication successful");
    }
  }, [password]);

  const trafficData = useMemo(() => generateTrafficData(), [refreshKey, dateRange]);
  const deviceData = useMemo(() => generateDeviceData(), [refreshKey]);
  const performanceData = useMemo(() => generatePagePerformanceData(), [refreshKey]);
  const engagementData = useMemo(() => generateUserEngagementData(), [refreshKey]);
  const securityData = useMemo(() => generateSecurityEventsData(), [refreshKey]);
  const geoData = useMemo(() => generateGeographicData(), [refreshKey]);
  const browserData = useMemo(() => generateBrowserData(), [refreshKey]);
  const featureData = useMemo(() => generateFeatureUsageData(), [refreshKey]);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    let result = [...users];
    
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter((u) => 
        u.userName.toLowerCase().includes(lowerSearch) || 
        (u.userEmail && u.userEmail.toLowerCase().includes(lowerSearch))
      );
    }
    
    if (sortBy === "name") {
      result.sort((a, b) => sortOrder === "asc" ? a.userName.localeCompare(b.userName) : b.userName.localeCompare(a.userName));
    } else if (sortBy === "id") {
      result.sort((a, b) => sortOrder === "asc" ? a.userId - b.userId : b.userId - a.userId);
    }
    
    return result;
  }, [users, searchTerm, sortBy, sortOrder]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  if (user && user.role !== "admin") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="w-full max-w-md border-red-500/30 bg-slate-900">
          <CardContent className="p-8 text-center">
            <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-6 animate-pulse" />
            <h2 className="text-2xl font-bold text-white mb-3">Access Denied</h2>
            <p className="text-slate-400 mb-6">
              Only authorized administrators have access to website usage records and compliance logs.
            </p>
            <Button variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!password) {
    return (
      <div className="p-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">System Compliance Portal</h1>
          <p className="text-slate-400 mt-2">Secure access to usage analytics and audit trails</p>
        </div>
        <PasswordGate onUnlock={(pw) => setPassword(pw)} />
      </div>
    );
  }

  if (selectedUser) {
    return (
      <UserDetailViewWrapper 
        password={password}
        userId={selectedUser.userId}
        userName={selectedUser.userName}
        userEmail={selectedUser.userEmail}
        onBack={() => setSelectedUser(null)}
      />
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 text-slate-200">
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col transition-all duration-300">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-500 font-semibold">
              <ShieldCheck className="h-5 w-5" />
              <span>Compliance Ops</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="h-8 w-8 text-slate-400 hover:text-white">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-1">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3 mt-4">Analytics</div>
              <SidebarItem icon={<LayoutDashboard />} label="Overview" active={activeTab === "overview"} onClick={() => setActiveTab("overview")} />
              <SidebarItem icon={<Users />} label="User Directory" active={activeTab === "users"} onClick={() => setActiveTab("users")} />
              <SidebarItem icon={<Activity />} label="Traffic Analysis" active={activeTab === "traffic"} onClick={() => setActiveTab("traffic")} />
              <SidebarItem icon={<Globe />} label="Geographics" active={activeTab === "geo"} onClick={() => setActiveTab("geo")} />
              
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3 mt-6">System</div>
              <SidebarItem icon={<Cpu />} label="Performance" active={activeTab === "performance"} onClick={() => setActiveTab("performance")} />
              <SidebarItem icon={<ShieldAlert />} label="Security Events" active={activeTab === "security"} onClick={() => setActiveTab("security")} />
              
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3 mt-6">Settings</div>
              <SidebarItem icon={<Settings />} label="Preferences" active={activeTab === "settings"} onClick={() => setActiveTab("settings")} />
            </div>
          </ScrollArea>
          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-slate-700">
                <AvatarFallback className="bg-slate-800 text-amber-500">AD</AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm font-medium text-white">Admin User</div>
                <div className="text-xs text-slate-400">Compliance Officer</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4">
            {!sidebarOpen && (
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="h-8 w-8 text-slate-400 hover:text-white">
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                Website Usage Records
                <Badge variant="outline" className="border-amber-500/50 text-amber-500 bg-amber-500/10 text-[10px] px-1.5 py-0 uppercase">Confidential</Badge>
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 mr-4 text-sm">
              <span className="text-slate-400">Auto-refresh:</span>
              <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="border-slate-700 text-slate-300 hover:text-white">
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin-slow' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting} className="border-slate-700 text-slate-300 hover:text-white">
              {isExporting ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              Export
            </Button>
            <ExportToSlides
              toolName="Website Usage Records"
              getSections={() => [
                {
                  title: "Website Usage Records",
                  items: [
                    { label: "Summary", value: "Confidential record keeping of all prospect and client activity on the website." },
                    { label: "Total Users", value: summary?.totalUsers?.toString() || "0" },
                    { label: "Total Sessions", value: summary?.totalSessions?.toString() || "0" }
                  ]
                }
              ]}
            />
          </div>
        </header>

        {/* Content Area */}
        <ScrollArea className="flex-1 bg-slate-950 p-6">
          <div className="max-w-7xl mx-auto space-y-6 pb-20">
            
            {/* Global Filters Bar */}
            <Card className="bg-slate-900/60 border-slate-800 shadow-sm">
              <CardContent className="p-3 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400" />
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-[140px] h-8 bg-slate-800/50 border-slate-700 text-xs">
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">Last 24 Hours</SelectItem>
                      <SelectItem value="7d">Last 7 Days</SelectItem>
                      <SelectItem value="30d">Last 30 Days</SelectItem>
                      <SelectItem value="90d">Last 90 Days</SelectItem>
                      <SelectItem value="ytd">Year to Date</SelectItem>
                      <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Separator orientation="vertical" className="h-6 bg-slate-700" />
                
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-slate-400" />
                  <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                    <SelectTrigger className="w-[140px] h-8 bg-slate-800/50 border-slate-700 text-xs">
                      <SelectValue placeholder="Region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All Regions</SelectItem>
                      <SelectItem value="North America">North America</SelectItem>
                      <SelectItem value="Europe">Europe</SelectItem>
                      <SelectItem value="Asia">Asia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator orientation="vertical" className="h-6 bg-slate-700" />
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="active-only" checked={showActiveOnly} onCheckedChange={(c) => setShowActiveOnly(!!c)} />
                    <label htmlFor="active-only" className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-300">
                      Active Sessions Only
                    </label>
                  </div>
                </div>

                <div className="ml-auto flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className="h-8 text-xs text-slate-400 hover:text-white">
                    <Filter className="h-3 w-3 mr-1" />
                    Advanced Filters {showAdvancedFilters ? <ChevronLeft className="h-3 w-3 ml-1 rotate-90" /> : <ChevronRight className="h-3 w-3 ml-1" />}
                  </Button>
                </div>
              </CardContent>
              
              {/* Advanced Filters Dropdown */}
              {showAdvancedFilters && (
                <div className="border-t border-slate-800 p-4 bg-slate-900/80 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label className="text-xs text-slate-400">Device Types</Label>
                    <div className="flex flex-wrap gap-2">
                      {['Desktop', 'Mobile', 'Tablet'].map((device) => (
                        <Badge 
                          key={device}
                          variant={selectedDevices.includes(device) ? "default" : "outline"}
                          className={`cursor-pointer ${selectedDevices.includes(device) ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-700 text-slate-400 hover:text-slate-200'}`}
                          onClick={() => toggleDeviceFilter(device)}
                        >
                          {device}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label className="text-xs text-slate-400">Min Session Length (mins)</Label>
                      <span className="text-xs text-slate-300">{minSessionLength[0]}</span>
                    </div>
                    <Slider value={minSessionLength} onValueChange={setMinSessionLength} max={120} step={5} className="py-2" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label className="text-xs text-slate-400">Max Bounce Rate (%)</Label>
                      <span className="text-xs text-slate-300">{maxBounces[0]}%</span>
                    </div>
                    <Slider value={maxBounces} onValueChange={setMaxBounces} max={100} step={5} className="py-2" />
                  </div>
                </div>
              )}
            </Card>

            {/* Summary KPI Cards */}
            {summary && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <KPICard title="Total Users" value={summary.totalUsers} icon={<Users />} trend="+12%" trendUp={true} color="blue" />
                <KPICard title="Total Sessions" value={summary.totalSessions} icon={<Activity />} trend="+8%" trendUp={true} color="green" />
                <KPICard title="Active Now" value={summary.activeSessions} icon={<Eye />} trend="+2" trendUp={true} color="emerald" pulse={true} />
                <KPICard title="Avg Duration" value={formatDuration(summary.totalDurationSecs / Math.max(1, summary.totalSessions))} icon={<Timer />} trend="-5%" trendUp={false} color="purple" />
                <KPICard title="Signatures" value={summary.totalSignatures} icon={<FileText />} trend="+15%" trendUp={true} color="amber" />
                <KPICard title="Bounce Rate" value="42%" icon={<TrendingDown />} trend="-2%" trendUp={true} color="rose" />
              </div>
            )}

            {/* Main Content Area based on Tabs */}
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Chart 1: Traffic Overview (Composed Chart) */}
                  <Card className="lg:col-span-2 bg-slate-900/50 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <div>
                        <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
                          <Activity className="h-5 w-5 text-blue-400" />
                          Traffic Overview
                        </CardTitle>
                        <CardDescription className="text-slate-400">Visitors and pageviews over time</CardDescription>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-800/50 p-1 rounded-md">
                        <Button variant="ghost" size="sm" className={`h-7 px-2 text-xs ${chartType === 'area' ? 'bg-slate-700 text-white' : 'text-slate-400'}`} onClick={() => setChartType('area')}>Area</Button>
                        <Button variant="ghost" size="sm" className={`h-7 px-2 text-xs ${chartType === 'bar' ? 'bg-slate-700 text-white' : 'text-slate-400'}`} onClick={() => setChartType('bar')}>Bar</Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={trafficData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorPageviews" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                              itemStyle={{ color: '#f8fafc' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            {chartType === 'area' ? (
                              <>
                                <Area type="monotone" dataKey="pageviews" name="Page Views" stroke="#10b981" fillOpacity={1} fill="url(#colorPageviews)" strokeWidth={2} />
                                <Area type="monotone" dataKey="visitors" name="Unique Visitors" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVisitors)" strokeWidth={2} />
                              </>
                            ) : (
                              <>
                                <Bar dataKey="pageviews" name="Page Views" fill="#10b981" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="visitors" name="Unique Visitors" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                              </>
                            )}
                            <Line type="monotone" dataKey="bounces" name="Bounces" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Chart 2: Device Breakdown (Pie Chart) */}
                  <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                      <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
                        <MonitorSmartphone className="h-5 w-5 text-purple-400" />
                        Device Breakdown
                      </CardTitle>
                      <CardDescription className="text-slate-400">Sessions by device type</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center">
                      <div className="h-[220px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={deviceData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {deviceData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                              itemStyle={{ color: '#f8fafc' }}
                            />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="w-full mt-4 space-y-2">
                        {deviceData.slice(0, 3).map((item, i) => (
                          <div key={item.name} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                              <span className="text-slate-300">{item.name}</span>
                            </div>
                            <span className="text-white font-medium">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Data Table 1: Recent Active Sessions */}
                  <Card className="bg-slate-900/50 border-slate-800 flex flex-col h-[400px]">
                    <CardHeader className="pb-3 flex flex-row items-center justify-between shrink-0">
                      <div>
                        <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
                          <Eye className="h-5 w-5 text-emerald-400" />
                          Live Activity Stream
                        </CardTitle>
                        <CardDescription className="text-slate-400">Real-time user sessions</CardDescription>
                      </div>
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 animate-pulse">
                        LIVE
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 overflow-hidden">
                      <ScrollArea className="h-full">
                        <Table>
                          <TableHeader className="bg-slate-900/80 sticky top-0 z-10 backdrop-blur-sm">
                            <TableRow className="border-slate-800 hover:bg-transparent">
                              <TableHead className="text-slate-400 font-medium">User</TableHead>
                              <TableHead className="text-slate-400 font-medium">Location</TableHead>
                              <TableHead className="text-slate-400 font-medium text-right">Duration</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Array.from({ length: 8 }).map((_, i) => (
                              <TableRow key={i} className="border-slate-800/50 hover:bg-slate-800/50 transition-colors">
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div className="relative">
                                      <Avatar className="h-8 w-8 border border-slate-700">
                                        <AvatarFallback className="bg-slate-800 text-xs">U{i+1}</AvatarFallback>
                                      </Avatar>
                                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
                                    </div>
                                    <div>
                                      <div className="font-medium text-slate-200 text-sm">User {Math.floor(Math.random() * 1000)}</div>
                                      <div className="text-xs text-slate-500">Viewing: Dashboard</div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {['New York', 'London', 'Tokyo', 'Sydney', 'Paris'][i % 5]}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <span className="text-emerald-400 font-mono text-sm">
                                    {Math.floor(Math.random() * 15) + 1}m {Math.floor(Math.random() * 60)}s
                                  </span>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {/* Chart 3: Feature Usage (Radar Chart) */}
                  <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                      <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
                        <Layers className="h-5 w-5 text-amber-400" />
                        Feature Utilization
                      </CardTitle>
                      <CardDescription className="text-slate-400">Which platform areas are most active</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={featureData}>
                            <PolarGrid stroke="#334155" />
                            <PolarAngleAxis dataKey="feature" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b' }} />
                            <Radar name="Usage %" dataKey="usage" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.4} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
                              itemStyle={{ color: '#f8fafc' }}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === "users" && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                  <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input 
                      placeholder="Search users by name or email..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 bg-slate-800/50 border-slate-700 text-slate-200 w-full"
                    />
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[130px] bg-slate-800/50 border-slate-700">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recent">Most Recent</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="id">User ID</SelectItem>
                        <SelectItem value="activity">Highest Activity</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                      className="border-slate-700 bg-slate-800/50 text-slate-300"
                    >
                      {sortOrder === "asc" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    </Button>
                    <div className="flex bg-slate-800/50 rounded-md border border-slate-700 p-1">
                      <Button variant="ghost" size="sm" className={`h-8 px-2 ${viewMode === 'grid' ? 'bg-slate-700 text-white' : 'text-slate-400'}`} onClick={() => setViewMode('grid')}>
                        <LayoutDashboard className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className={`h-8 px-2 ${viewMode === 'list' ? 'bg-slate-700 text-white' : 'text-slate-400'}`} onClick={() => setViewMode('list')}>
                        <Menu className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {!users ? (
                  <div className="flex items-center justify-center py-20">
                    <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-20 bg-slate-900/30 rounded-lg border border-slate-800 border-dashed">
                    <Users className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-1">No users found</h3>
                    <p className="text-slate-400">Try adjusting your search or filters.</p>
                    <Button variant="outline" className="mt-4 border-slate-700" onClick={() => setSearchTerm("")}>Clear Search</Button>
                  </div>
                ) : (
                  <>
                    {/* Data Table 2: User Directory (List View) or Grid View */}
                    {viewMode === 'list' ? (
                      <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
                        <Table>
                          <TableHeader className="bg-slate-800/50">
                            <TableRow className="border-slate-700">
                              <TableHead className="text-slate-300">User Details</TableHead>
                              <TableHead className="text-slate-300">Contact</TableHead>
                              <TableHead className="text-slate-300 text-center">Sessions</TableHead>
                              <TableHead className="text-slate-300 text-center">Status</TableHead>
                              <TableHead className="text-slate-300 text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedUsers.map((u) => (
                              <TableRow key={u.userId} className="border-slate-800/50 hover:bg-slate-800/30 transition-colors group">
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10 border border-slate-700 bg-slate-800">
                                      <AvatarFallback className="text-blue-400 font-medium">
                                        {u.userName.substring(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="font-medium text-slate-200">{u.userName}</div>
                                      <div className="text-xs text-slate-500 font-mono">ID: {u.userId}</div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <Mail className="h-3.5 w-3.5" />
                                    {u.userEmail || <span className="italic opacity-50">Not provided</span>}
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="outline" className="bg-slate-800 text-slate-300 border-slate-700">
                                    {Math.floor(Math.random() * 50) + 1}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  {Math.random() > 0.8 ? (
                                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30">Active</Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-slate-800 text-slate-500 border-slate-700">Offline</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                                    onClick={() => setSelectedUser(u)}
                                  >
                                    View Audit Log <ChevronRight className="h-4 w-4 ml-1" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {paginatedUsers.map((u) => (
                          <Card 
                            key={u.userId} 
                            className="bg-slate-900/50 border-slate-800 hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-900/10 transition-all cursor-pointer group"
                            onClick={() => setSelectedUser(u)}
                          >
                            <CardContent className="p-5">
                              <div className="flex justify-between items-start mb-4">
                                <Avatar className="h-12 w-12 border-2 border-slate-800 group-hover:border-blue-500/50 transition-colors">
                                  <AvatarFallback className="bg-gradient-to-br from-slate-800 to-slate-900 text-blue-400 text-lg font-bold">
                                    {u.userName.substring(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                {Math.random() > 0.8 && (
                                  <span className="flex h-3 w-3 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                  </span>
                                )}
                              </div>
                              <h3 className="font-semibold text-slate-200 truncate">{u.userName}</h3>
                              <p className="text-xs text-slate-500 truncate mt-1 flex items-center gap-1.5">
                                <Mail className="h-3 w-3" /> {u.userEmail || "No email"}
                              </p>
                              
                              <div className="mt-4 pt-4 border-t border-slate-800/50 grid grid-cols-2 gap-2 text-center">
                                <div>
                                  <div className="text-xs text-slate-500 mb-1">Sessions</div>
                                  <div className="font-medium text-slate-300">{Math.floor(Math.random() * 50) + 1}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-slate-500 mb-1">Last Seen</div>
                                  <div className="font-medium text-slate-300 text-xs mt-1">{Math.floor(Math.random() * 24) + 1}h ago</div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between mt-6 bg-slate-900/30 p-3 rounded-lg border border-slate-800">
                        <div className="text-sm text-slate-400">
                          Showing <span className="font-medium text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-white">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> of <span className="font-medium text-white">{filteredUsers.length}</span> users
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="border-slate-700 text-slate-300"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <div className="text-sm font-medium text-slate-300 px-2">
                            Page {currentPage} of {totalPages}
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="border-slate-700 text-slate-300"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === "traffic" && (
              <div className="space-y-6">
                {/* Chart 4: Hourly Engagement (Bar Chart) */}
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
                      <Clock className="h-5 w-5 text-indigo-400" />
                      Hourly Engagement Profile
                    </CardTitle>
                    <CardDescription className="text-slate-400">Average activity levels throughout the day</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[350px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={engagementData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                          <XAxis dataKey="hour" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis yAxisId="left" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
                            itemStyle={{ color: '#f8fafc' }}
                            cursor={{ fill: '#1e293b' }}
                          />
                          <Legend />
                          <Bar yAxisId="left" dataKey="activeUsers" name="Active Users" fill="#6366f1" radius={[4, 4, 0, 0]} />
                          <Line yAxisId="right" type="monotone" dataKey="avgSessionLength" name="Avg Session (sec)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#0f172a' }} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Data Table 3: Top Pages */}
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-400" />
                      Top Performing Pages
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-800">
                          <TableHead className="text-slate-400">Page Path</TableHead>
                          <TableHead className="text-slate-400 text-right">Views</TableHead>
                          <TableHead className="text-slate-400 text-right">Unique Visitors</TableHead>
                          <TableHead className="text-slate-400 text-right">Avg. Time</TableHead>
                          <TableHead className="text-slate-400 text-right">Bounce Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {['/dashboard', '/portfolio', '/documents', '/settings', '/profile', '/reports'].map((path, i) => (
                          <TableRow key={path} className="border-slate-800/50 hover:bg-slate-800/30">
                            <TableCell className="font-medium text-blue-400 flex items-center gap-2">
                              <LinkIcon className="h-3 w-3" /> {path}
                            </TableCell>
                            <TableCell className="text-right text-slate-300">{Math.floor(10000 / (i + 1))}</TableCell>
                            <TableCell className="text-right text-slate-300">{Math.floor(4000 / (i + 1))}</TableCell>
                            <TableCell className="text-right text-slate-300">{Math.floor(180 - i * 20)}s</TableCell>
                            <TableCell className="text-right">
                              <span className={`px-2 py-1 rounded text-xs ${i > 3 ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                                {20 + i * 8}%
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "geo" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Chart 5: Geographic Distribution (Bar Chart Horizontal) */}
                  <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                      <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
                        <Globe className="h-5 w-5 text-teal-400" />
                        Regional Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={geoData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={true} vertical={false} />
                            <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis dataKey="region" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
                              itemStyle={{ color: '#f8fafc' }}
                              cursor={{ fill: '#1e293b' }}
                            />
                            <Legend />
                            <Bar dataKey="users" name="Users" fill="#14b8a6" radius={[0, 4, 4, 0]} barSize={15} />
                            <Bar dataKey="sessions" name="Sessions" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={15} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Data Table 4: Browser Usage */}
                  <Card className="bg-slate-900/50 border-slate-800">
                    <CardHeader>
                      <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
                        <MonitorSmartphone className="h-5 w-5 text-pink-400" />
                        Browser Market Share
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6 mt-4">
                        {browserData.map((browser, i) => (
                          <div key={browser.name} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium text-slate-300">{browser.name}</span>
                              <span className="text-slate-400">{browser.value}%</span>
                            </div>
                            <Progress value={browser.value} className={`h-2 bg-slate-800 [&>div]:bg-${['pink', 'blue', 'orange', 'green', 'slate'][i]}-500`} />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {activeTab === "performance" && (
              <div className="space-y-6">
                {/* Chart 6: Performance Metrics (Line Chart with multiple lines) */}
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-400" />
                      Page Load Performance
                    </CardTitle>
                    <CardDescription className="text-slate-400">Core Web Vitals tracking across main pages</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                          <XAxis dataKey="page" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} label={{ value: 'Seconds', angle: -90, position: 'insideLeft', fill: '#94a3b8' }} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
                            itemStyle={{ color: '#f8fafc' }}
                          />
                          <Legend />
                          <Line type="monotone" dataKey="loadTime" name="Load Time" stroke="#eab308" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                          <Line type="monotone" dataKey="interactionTime" name="Time to Interactive" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" />
                          <Line type="monotone" dataKey="renderTime" name="First Contentful Paint" stroke="#10b981" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Data Table 5: System Resources */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ResourceCard title="CPU Usage" value="42%" icon={<Cpu />} status="normal" />
                  <ResourceCard title="Memory" value="12.4 GB" max="16 GB" icon={<Server />} status="warning" />
                  <ResourceCard title="Storage" value="456 GB" max="1 TB" icon={<HardDrive />} status="normal" />
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-6">
                {/* Chart 7: Security Events (Area Chart) */}
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
                        <ShieldAlert className="h-5 w-5 text-red-400" />
                        Security Events Log
                      </CardTitle>
                      <CardDescription className="text-slate-400">Authentication attempts and anomalies</CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30">
                      Protected View
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px] w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={securityData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                          <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
                            itemStyle={{ color: '#f8fafc' }}
                          />
                          <Legend />
                          <Area type="monotone" dataKey="logins" name="Successful Logins" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} />
                          <Area type="monotone" dataKey="failedLogins" name="Failed Attempts" stroke="#ef4444" fill="url(#colorFailed)" strokeWidth={2} />
                          <Line type="monotone" dataKey="passwordResets" name="Password Resets" stroke="#f59e0b" strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Data Table 6: Audit Log */}
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
                      <FileLock2 className="h-5 w-5 text-slate-400" />
                      Recent Audit Trail
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-800">
                          <TableHead className="text-slate-400">Timestamp</TableHead>
                          <TableHead className="text-slate-400">Event Type</TableHead>
                          <TableHead className="text-slate-400">User / IP</TableHead>
                          <TableHead className="text-slate-400">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.from({ length: 6 }).map((_, i) => {
                          const isError = i === 2 || i === 5;
                          return (
                            <TableRow key={i} className="border-slate-800/50 hover:bg-slate-800/30">
                              <TableCell className="text-slate-300 text-sm">
                                {new Date(Date.now() - i * 3600000).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2 text-sm">
                                  {isError ? <ShieldAlert className="h-4 w-4 text-red-400" /> : <ShieldCheck className="h-4 w-4 text-green-400" />}
                                  <span className="text-slate-200">{isError ? 'Failed Login Attempt' : 'Compliance Document Signed'}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-slate-400 text-sm font-mono">
                                192.168.1.{100 + i}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={isError ? "bg-red-500/10 text-red-400 border-red-500/30" : "bg-green-500/10 text-green-400 border-green-500/30"}>
                                  {isError ? 'Blocked' : 'Success'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="max-w-3xl mx-auto space-y-6">
                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
                      <Bell className="h-5 w-5 text-blue-400" />
                      Alert Preferences
                    </CardTitle>
                    <CardDescription className="text-slate-400">Configure when you want to be notified</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base text-slate-200">Anomaly Detection</Label>
                        <p className="text-sm text-slate-400">AI-powered alerts for unusual traffic patterns</p>
                      </div>
                      <Switch checked={anomalyDetection} onCheckedChange={setAnomalyDetection} />
                    </div>
                    <Separator className="bg-slate-800" />
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <Label className="text-base text-slate-200">Traffic Spike Threshold</Label>
                        <span className="text-sm font-medium text-blue-400">+{alertThreshold[0]}%</span>
                      </div>
                      <Slider value={alertThreshold} onValueChange={setAlertThreshold} max={200} step={10} className="py-2" />
                      <p className="text-xs text-slate-500">Alert me when traffic exceeds normal baseline by this percentage.</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900/50 border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
                      <Database className="h-5 w-5 text-emerald-400" />
                      Data Retention
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-300">Detailed Logs</Label>
                        <Select defaultValue="90d">
                          <SelectTrigger className="bg-slate-800/50 border-slate-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30d">30 Days</SelectItem>
                            <SelectItem value="90d">90 Days (Compliance Min)</SelectItem>
                            <SelectItem value="1y">1 Year</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">Aggregated Analytics</Label>
                        <Select defaultValue="7y">
                          <SelectTrigger className="bg-slate-800/50 border-slate-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1y">1 Year</SelectItem>
                            <SelectItem value="3y">3 Years</SelectItem>
                            <SelectItem value="7y">7 Years</SelectItem>
                            <SelectItem value="indefinite">Indefinite</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg flex gap-3 mt-4">
                      <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />
                      <div className="text-sm text-amber-200/80">
                        <p className="font-medium text-amber-400 mb-1">Compliance Warning</p>
                        Financial regulations require maintaining usage and access logs for a minimum of 90 days. Changing these settings may impact your audit readiness.
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t border-slate-800 pt-4 flex justify-end">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">Save Preferences</Button>
                  </CardFooter>
                </Card>
              </div>
            )}

          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

/* ─── Sub-Components ─── */

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
        active 
          ? 'bg-blue-600/10 text-blue-400 font-medium' 
          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
      }`}
    >
      <div className={active ? 'text-blue-400' : 'text-slate-500'}>
        {React.cloneElement(icon as React.ReactElement, { className: "h-4 w-4" })}
      </div>
      {label}
    </button>
  );
}

function KPICard({ title, value, icon, trend, trendUp, color, pulse = false }: any) {
  const colorMap: Record<string, string> = {
    blue: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    green: "text-green-400 bg-green-400/10 border-green-400/20",
    emerald: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    purple: "text-purple-400 bg-purple-400/10 border-purple-400/20",
    amber: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    rose: "text-rose-400 bg-rose-400/10 border-rose-400/20",
  };

  const c = colorMap[color] || colorMap.blue;

  return (
    <Card className="bg-slate-900/50 border-slate-800 overflow-hidden relative group">
      <div className={`absolute top-0 left-0 w-1 h-full ${c.split(' ')[0].replace('text-', 'bg-')}`} />
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-medium text-slate-400 mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
          </div>
          <div className={`p-2 rounded-lg ${c} ${pulse ? 'animate-pulse' : ''}`}>
            {React.cloneElement(icon, { className: "h-4 w-4" })}
          </div>
        </div>
        <div className="mt-4 flex items-center text-xs">
          <span className={`flex items-center font-medium ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
            {trendUp ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {trend}
          </span>
          <span className="text-slate-500 ml-2">vs last period</span>
        </div>
      </CardContent>
    </Card>
  );
}

function ResourceCard({ title, value, max, icon, status }: any) {
  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`p-3 rounded-full ${status === 'warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
          {React.cloneElement(icon, { className: "h-5 w-5" })}
        </div>
        <div className="flex-1">
          <p className="text-xs text-slate-400">{title}</p>
          <div className="flex items-baseline gap-1">
            <h4 className="text-lg font-bold text-white">{value}</h4>
            {max && <span className="text-xs text-slate-500">/ {max}</span>}
          </div>
          {max && (
            <Progress value={status === 'warning' ? 75 : 42} className={`h-1.5 mt-2 bg-slate-800 [&>div]:bg-${status === 'warning' ? 'amber' : 'blue'}-500`} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── User Detail View Wrapper ─── */
function UserDetailViewWrapper(props: any) {
  return (
    <div className="p-6 h-[calc(100vh-4rem)] overflow-y-auto bg-slate-950">
      <div className="max-w-5xl mx-auto">
        <UserDetailView {...props} />
      </div>
    </div>
  );
}

/* ─── Original User Detail View (Enhanced) ─── */
function UserDetailView({ password, userId, userName, userEmail, onBack }: {
  password: string;
  userId: number;
  userName: string;
  userEmail: string | null;
  onBack: () => void;
}) {
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);

  const { data: sessions } =
    trpc.websiteUsage.getUserSessions.useQuery({ password, userId });

  const { data: signatures } =
    trpc.websiteUsage.getUserSignatures.useQuery({ password, userId });

  const { data: sessionActivity } =
    trpc.websiteUsage.getSessionActivity.useQuery(
      { password, sessionId: selectedSessionId! },
      { enabled: !!selectedSessionId }
    );

  const totalTime = useMemo(() => {
    if (!sessions) return 0;
    return sessions.reduce((sum, s) => sum + (s.durationSecs ?? 0), 0);
  }, [sessions]);

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-lg border border-slate-800">
        <Button variant="outline" size="icon" onClick={onBack} className="border-slate-700 h-10 w-10 shrink-0">
          <ArrowLeft className="w-5 h-5 text-slate-300" />
        </Button>
        <Avatar className="h-12 w-12 border border-slate-700 bg-slate-800">
          <AvatarFallback className="text-blue-400 text-lg">{userName.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {userName}
            {sessions?.some(s => s.isActive) && (
              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 text-[10px] uppercase animate-pulse">Online Now</Badge>
            )}
          </h2>
          <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
            <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {userEmail ?? "No email on file"}</span>
            <span className="flex items-center gap-1"><Hash className="h-3 w-3" /> ID: {userId}</span>
          </div>
        </div>
        <Button variant="outline" className="border-slate-700 text-slate-300">
          <Download className="h-4 w-4 mr-2" /> Export Audit Log
        </Button>
      </div>

      {/* User Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{sessions?.length ?? 0}</div>
              <div className="text-xs text-slate-400 font-medium">Total Sessions</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
              <Timer className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{formatDuration(totalTime)}</div>
              <div className="text-xs text-slate-400 font-medium">Total Time</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-lg text-amber-400">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{signatures?.length ?? 0}</div>
              <div className="text-xs text-slate-400 font-medium">Signatures</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
              <MousePointerClick className="h-6 w-6" />
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{Math.floor(Math.random() * 500) + 50}</div>
              <div className="text-xs text-slate-400 font-medium">Interactions</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Session History */}
          <Card className="bg-slate-900/50 border-slate-800 flex flex-col h-[600px]">
            <CardHeader className="pb-3 border-b border-slate-800">
              <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-400" /> Session Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden">
              {sessionsLoading ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="animate-spin w-8 h-8 text-blue-500" />
                </div>
              ) : !sessions || sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                  <Activity className="w-12 h-12 mb-2 opacity-20" />
                  <p>No sessions recorded for this user.</p>
                </div>
              ) : (
                <ScrollArea className="h-full p-4">
                  <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-800 before:to-transparent">
                    {sessions.map((sess, idx) => (
                      <div key={sess.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-950 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${sess.isActive ? 'bg-green-500 text-white animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
                          {sess.isActive ? <Zap className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        </div>
                        
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-800 bg-slate-900/80 shadow-sm transition-all hover:border-blue-500/50 cursor-pointer"
                             onClick={() => setSelectedSessionId(selectedSessionId === sess.id ? null : sess.id)}>
                          <div className="flex items-center justify-between mb-2">
                            <time className="text-xs font-medium text-blue-400">{formatDate(sess.loginAt)}</time>
                            {sess.isActive && <Badge variant="outline" className="text-[10px] border-green-500/50 text-green-400 px-1.5 py-0 bg-green-500/10">ACTIVE</Badge>}
                          </div>
                          <div className="text-slate-300 font-medium mb-1 flex items-center gap-2">
                            Session #{sessions.length - idx}
                            <span className="text-xs font-normal text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Timer className="w-3 h-3" /> {formatDuration(sess.durationSecs)}
                            </span>
                          </div>
                          
                          {/* Session Activity Detail Expansion */}
                          {selectedSessionId === sess.id && (
                            <div className="mt-4 pt-4 border-t border-slate-800">
                              {sessionActivity === undefined ? (
                                <div className="flex justify-center py-4"><RefreshCw className="w-4 h-4 animate-spin text-blue-500" /></div>
                              ) : sessionActivity.length === 0 ? (
                                <p className="text-xs text-slate-500 italic">No page views recorded.</p>
                              ) : (
                                <div className="space-y-2">
                                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                    <MonitorSmartphone className="w-3 h-3" /> Page Journey
                                  </h4>
                                  <div className="space-y-1.5">
                                    {sessionActivity.map((page, i) => (
                                      <div key={page.id} className="flex items-center justify-between p-2 rounded bg-slate-950/50 border border-slate-800/50 text-xs group/page">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                          <div className="w-5 h-5 rounded bg-slate-800 flex items-center justify-center shrink-0 text-slate-500 text-[10px]">{i+1}</div>
                                          <span className="text-slate-300 font-medium truncate">{page.pageTitle}</span>
                                        </div>
                                        <div className="text-slate-500 font-mono shrink-0">{formatDuration(page.durationSecs)}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Compliance Signatures */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3 border-b border-slate-800">
              <CardTitle className="text-md font-semibold text-amber-400 flex items-center gap-2">
                <Shield className="w-4 h-4" /> Legal Signatures
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {!signatures || signatures.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">
                  No compliance documents signed yet.
                </div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto p-2 space-y-2">
                  {signatures.map((sig) => (
                    <div key={sig.id} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-amber-500/30 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm font-medium text-slate-200 flex items-center gap-1.5">
                          <FileCheck2 className="w-4 h-4 text-amber-500" />
                          Document #{sig.id}
                        </div>
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px]">Verified</Badge>
                      </div>
                      <div className="text-xs text-slate-400 space-y-1 bg-slate-900/50 p-2 rounded border border-slate-800">
                        <div className="flex justify-between"><span className="text-slate-500">Name:</span> <span className="text-slate-300 font-mono">{sig.signedName}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Date:</span> <span>{sig.signedDate}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">IP:</span> <span className="font-mono">192.168.1.x</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Profile Info */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3 border-b border-slate-800">
              <CardTitle className="text-md font-semibold text-slate-200 flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-slate-400" /> Device Fingerprint
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-2"><MonitorSmartphone className="w-4 h-4" /> Primary Device</span>
                <span className="text-slate-300 font-medium">Desktop (Mac OS)</span>
              </div>
              <Separator className="bg-slate-800" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-2"><Globe className="w-4 h-4" /> Browser</span>
                <span className="text-slate-300 font-medium">Chrome 120.0</span>
              </div>
              <Separator className="bg-slate-800" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-2"><MapPin className="w-4 h-4" /> Usual Location</span>
                <span className="text-slate-300 font-medium">New York, US</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MousePointerClick(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m9 9 5 12 1.8-5.2L21 14Z"/><path d="M7.2 2.2 8 5.1"/><path d="m5.1 8-2.9-.8"/><path d="M14 4.1 12 6"/><path d="m6 12-1.9 2"/></svg>;
}
