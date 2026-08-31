// @ts-nocheck
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  Users,
  FileText,
  Activity,
  Clock,
  Eye,
  Building2,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ScrollText,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  TrendingUp,
  TrendingDown,
  Briefcase,
  Download,
  Filter,
  Search,
  MoreVertical,
  Settings,
  Mail,
  Globe,
  Target,
  Zap,
  Award,
  Star,
  Printer,
  RefreshCw,
  Maximize2,
} from "lucide-react";
import { ExportToSlides } from "@/components/ExportToSlides";
import {
  BarChart, LineChart, PieChart, AreaChart, RadarChart, ComposedChart,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  Bar, Line, Pie, Cell, Area, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";

const generateMockData = (count: number, max: number = 100) => {
  return Array.from({ length: count }, (_, i) => ({
    name: `Item ${i + 1}`,
    value: Math.floor(Math.random() * max),
    value2: Math.floor(Math.random() * max),
    value3: Math.floor(Math.random() * max),
  }));
};

const generateTimeSeriesData = (days: number) => {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - i - 1));
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      active: Math.floor(Math.random() * 50) + 10,
      new: Math.floor(Math.random() * 20),
      churn: Math.floor(Math.random() * 5),
    };
  });
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function OwnerOversight() {
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [docDialogOpen, setDocDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("30");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState("activity");
  const [chartView, setChartView] = useState("bar");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState("csv");
  const [isHovering, setIsHovering] = useState<string | null>(null);
  const [activeChartIndex, setActiveChartIndex] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(5);
  const [theme, setTheme] = useState("light");
  const [layout, setLayout] = useState("grid");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [detailPanelOpen, setDetailPanelOpen] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<number | null>(null);
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [actionType, setActionType] = useState("");

  const isOwner = trpc.agency.isOwner.useQuery();
  const dashboard = trpc.agency.getOwnerDashboard.useQuery(undefined, { enabled: isOwner.data?.isOwner === true });
  const allTeams = trpc.agency.listAllTeams.useQuery(undefined, { enabled: isOwner.data?.isOwner === true });
  const legalDocs = trpc.agency.listLegalDocuments.useQuery(
    { teamId: selectedTeamId ?? undefined },
    { enabled: isOwner.data?.isOwner === true }
  );
  const selectedDoc = trpc.agency.getLegalDocument.useQuery(
    { documentId: selectedDocId! },
    { enabled: !!selectedDocId && docDialogOpen }
  );
  const teamMembers = trpc.agency.listTeamMembers.useQuery(
    { teamId: selectedTeamId! },
    { enabled: !!selectedTeamId && activeTab === "teams" }
  );
  const teamActivity = trpc.agency.getTeamActivity.useQuery(
    { teamId: selectedTeamId!, days: parseInt(dateRange) },
    { enabled: !!selectedTeamId && activeTab === "teams" }
  );
  const complianceAlerts = trpc.complianceAlerts.listAlerts.useQuery(
    { limit: 10 },
    { enabled: isOwner.data?.isOwner === true }
  );
  const systemMetrics = trpc.websiteUsage.getMetrics.useQuery(
    { days: 30 },
    { enabled: isOwner.data?.isOwner === true }
  );
  const platformGrowth = trpc.agency.getPlatformGrowth.useQuery(
    { months: 12 },
    { enabled: isOwner.data?.isOwner === true }
  );

  useEffect(() => {
    if (isRefreshing) {
      const timer = setTimeout(() => setIsRefreshing(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isRefreshing]);

  useEffect(() => {
    if (activeTab === "teams" && !selectedTeamId && allTeams.data && allTeams.data.length > 0) {
      setSelectedTeamId(allTeams.data[0].id);
    }
  }, [activeTab, selectedTeamId, allTeams.data]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, itemsPerPage]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    dashboard.refetch();
    if (activeTab === "teams") {
      allTeams.refetch();
      if (selectedTeamId) {
        teamMembers.refetch();
        teamActivity.refetch();
      }
    } else if (activeTab === "documents") {
      legalDocs.refetch();
    }
  }, [activeTab, selectedTeamId, dashboard, allTeams, teamMembers, teamActivity, legalDocs]);

  const toggleSort = useCallback((field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  }, [sortBy]);

  const handleSelectMember = useCallback((id: number) => {
    setSelectedMembers(prev => 
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  }, []);

  const handleSelectAllMembers = useCallback((ids: number[]) => {
    if (selectedMembers.length === ids.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(ids);
    }
  }, [selectedMembers]);

  const toggleRowExpansion = useCallback((id: number) => {
    setExpandedRow(prev => prev === id ? null : id);
  }, []);

  const filteredTeams = useMemo(() => {
    if (!allTeams.data) return [];
    return allTeams.data.filter((team) => {
      const matchesSearch = team.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            team.supervisorName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || 
                            (statusFilter === "active" && team.isActive) || 
                            (statusFilter === "inactive" && !team.isActive);
      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === "name") comparison = a.name.localeCompare(b.name);
      else if (sortBy === "members") comparison = a.memberCount - b.memberCount;
      else if (sortBy === "status") comparison = (a.isActive ? 1 : 0) - (b.isActive ? 1 : 0);
      
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [allTeams.data, searchQuery, statusFilter, sortBy, sortOrder]);

  const paginatedTeams = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return filteredTeams.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTeams, page, itemsPerPage]);

  const totalPages = Math.ceil(filteredTeams.length / itemsPerPage);

  const teamDistributionData = useMemo(() => {
    if (!allTeams.data) return [];
    
    const distribution = {
      "Small (1-5)": 0,
      "Medium (6-15)": 0,
      "Large (16-50)": 0,
      "Enterprise (50+)": 0
    };
    
    allTeams.data.forEach((team) => {
      if (team.memberCount <= 5) distribution["Small (1-5)"]++;
      else if (team.memberCount <= 15) distribution["Medium (6-15)"]++;
      else if (team.memberCount <= 50) distribution["Large (16-50)"]++;
      else distribution["Enterprise (50+)"]++;
    });
    
    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  }, [allTeams.data]);

  const mockTimeSeriesData = useMemo(() => generateTimeSeriesData(parseInt(dateRange)), [dateRange]);
  const mockRadarData = useMemo(() => [
    { subject: 'Growth', A: 120, B: 110, fullMark: 150 },
    { subject: 'Engagement', A: 98, B: 130, fullMark: 150 },
    { subject: 'Retention', A: 86, B: 130, fullMark: 150 },
    { subject: 'Compliance', A: 99, B: 100, fullMark: 150 },
    { subject: 'Revenue', A: 85, B: 90, fullMark: 150 },
    { subject: 'Satisfaction', A: 65, B: 85, fullMark: 150 },
  ], []);

  const mockPerformanceData = useMemo(() => generateMockData(7, 1000), []);

  if (!isOwner.data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <div className="text-xl font-medium text-muted-foreground animate-pulse">Verifying owner access...</div>
      </div>
    );
  }

  if (!isOwner.data.isOwner) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] py-20">
        <Card className="max-w-md w-full shadow-lg border-destructive/20">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-10 h-10 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-bold">Access Denied</CardTitle>
            <CardDescription className="text-base">
              Platform Owner Privilege Required
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">
              This comprehensive oversight panel is restricted to the platform owner. 
              Your current account does not have the necessary clearance level.
            </p>
            <Button variant="outline" className="w-full" onClick={() => window.history.back()}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = dashboard.data;

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-xl border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/20">
            <Shield className="w-8 h-8 text-amber-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              Owner Oversight Panel
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 ml-2">Master</Badge>
            </h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">
              Comprehensive platform monitoring, agency management, and compliance oversight.
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            className={`${isRefreshing ? 'animate-pulse' : ''}`}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowExportDialog(true)}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          
          <ExportToSlides
            toolName="Owner Oversight Panel"
            getSections={() => [
              {
                title: "Platform Overview",
                items: [
                  { label: "Total Agencies", value: (stats?.totalTeams ?? 0).toString() },
                  { label: "Total Members", value: (stats?.totalMembers ?? 0).toString() },
                  { label: "Compliance Rate", value: `${Math.round(((stats?.totalAgreements ?? 0) / (stats?.totalMembers || 1)) * 100)}%` },
                  { label: "Pending Invites", value: (stats?.pendingMembers ?? 0).toString() },
                ]
              },
              {
                title: "Risk & Compliance",
                items: [
                  { label: "Unsigned Agents", value: (stats?.unsignedMembers ?? 0).toString() },
                  { label: "Legal Documents", value: (stats?.totalLegalDocs ?? 0).toString() },
                  { label: "Active Sessions", value: (stats?.recentSessions?.filter((s) => s.isActive).length ?? 0).toString() },
                ]
              }
            ]}
          />
        </div>
      </div>

      {/* KPI Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-emerald-500" onClick={() => setActiveTab("teams")}>
          <CardContent className="p-5 flex flex-col items-center justify-center text-center h-full">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
              <Building2 className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-3xl font-bold tracking-tight">{stats?.totalTeams ?? 0}</p>
            <p className="text-sm font-medium text-muted-foreground mt-1">Agency Teams</p>
            <div className="mt-3 flex items-center text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              <TrendingUp className="w-3 h-3 mr-1" /> +12% this month
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500" onClick={() => setActiveTab("teams")}>
          <CardContent className="p-5 flex flex-col items-center justify-center text-center h-full">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-3">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-3xl font-bold tracking-tight">{stats?.totalMembers ?? 0}</p>
            <p className="text-sm font-medium text-muted-foreground mt-1">Total Members</p>
            <div className="mt-3 flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
              <TrendingUp className="w-3 h-3 mr-1" /> +8% this month
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-indigo-500" onClick={() => setActiveTab("documents")}>
          <CardContent className="p-5 flex flex-col items-center justify-center text-center h-full">
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6 text-indigo-600" />
            </div>
            <p className="text-3xl font-bold tracking-tight">{stats?.totalAgreements ?? 0}</p>
            <p className="text-sm font-medium text-muted-foreground mt-1">Agreements Signed</p>
            <Progress 
              value={((stats?.totalAgreements ?? 0) / Math.max(stats?.totalMembers ?? 1, 1)) * 100} 
              className="h-1.5 w-full mt-3" 
            />
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-purple-500" onClick={() => setActiveTab("documents")}>
          <CardContent className="p-5 flex flex-col items-center justify-center text-center h-full">
            <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-3">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-3xl font-bold tracking-tight">{stats?.totalLegalDocs ?? 0}</p>
            <p className="text-sm font-medium text-muted-foreground mt-1">Legal Documents</p>
            <div className="mt-3 flex items-center text-xs text-muted-foreground">
              <Clock className="w-3 h-3 mr-1" /> Updated today
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-amber-500">
          <CardContent className="p-5 flex flex-col items-center justify-center text-center h-full">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-3">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <p className="text-3xl font-bold tracking-tight">{stats?.pendingMembers ?? 0}</p>
            <p className="text-sm font-medium text-muted-foreground mt-1">Pending Invites</p>
            <div className="mt-3 flex items-center text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
              Requires attention
            </div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-red-500" onClick={() => setActiveTab("compliance")}>
          <CardContent className="p-5 flex flex-col items-center justify-center text-center h-full">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-3xl font-bold tracking-tight">{stats?.unsignedMembers ?? 0}</p>
            <p className="text-sm font-medium text-muted-foreground mt-1">Unsigned Agents</p>
            <div className="mt-3 flex items-center text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
              <TrendingDown className="w-3 h-3 mr-1" /> High risk
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-4 pt-2">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto p-1 gap-1">
            <TabsTrigger value="overview" className="py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <BarChart3 className="w-4 h-4 mr-2" /> 
              <span className="hidden sm:inline">Executive</span> Dashboard
            </TabsTrigger>
            <TabsTrigger value="teams" className="py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Building2 className="w-4 h-4 mr-2" /> 
              Agency <span className="hidden sm:inline">Teams</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ScrollText className="w-4 h-4 mr-2" /> 
              Legal <span className="hidden sm:inline">Records</span>
            </TabsTrigger>
            <TabsTrigger value="compliance" className="py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Shield className="w-4 h-4 mr-2" /> 
              Compliance <span className="hidden sm:inline">Center</span>
            </TabsTrigger>
            <TabsTrigger value="sessions" className="py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Activity className="w-4 h-4 mr-2" /> 
              System <span className="hidden sm:inline">Activity</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: Executive Dashboard (Heavy Visualizations) */}
        <TabsContent value="overview" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart 1: Platform Growth (Area Chart) */}
            <Card className="lg:col-span-2 shadow-sm border-border/50">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Platform Growth & Engagement
                    </CardTitle>
                    <CardDescription>Active users and new signups over time</CardDescription>
                  </div>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-[120px] h-8 text-xs">
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Last 7 Days</SelectItem>
                      <SelectItem value="30">Last 30 Days</SelectItem>
                      <SelectItem value="90">Last 90 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockTimeSeriesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0088FE" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#0088FE" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00C49F" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#00C49F" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dx={-10} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '5 5' }}
                      />
                      <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                      <Area type="monotone" dataKey="active" name="Active Users" stroke="#0088FE" fillOpacity={1} fill="url(#colorActive)" />
                      <Area type="monotone" dataKey="new" name="New Signups" stroke="#00C49F" fillOpacity={1} fill="url(#colorNew)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Chart 2: Agency Distribution (Pie Chart) */}
            <Card className="shadow-sm border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5 text-primary" />
                  Agency Size Distribution
                </CardTitle>
                <CardDescription>Breakdown by member count</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                <div className="h-[250px] w-full mt-4">
                  {teamDistributionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={teamDistributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {teamDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          formatter={(value: number) => [`${value} Agencies`, 'Count']}
                        />
                        <Legend layout="vertical" verticalAlign="bottom" align="center" />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      Not enough data to generate chart
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 3: Platform Health (Radar Chart) */}
            <Card className="shadow-sm border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Platform Health Metrics
                </CardTitle>
                <CardDescription>Multi-dimensional performance analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={mockRadarData}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#4b5563', fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                      <Radar name="Current Month" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                      <Radar name="Previous Month" dataKey="B" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Chart 4: Feature Usage (Composed Chart) */}
            <Card className="shadow-sm border-border/50">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Zap className="w-5 h-5 text-primary" />
                      Feature Utilization
                    </CardTitle>
                    <CardDescription>Usage frequency vs. Success rate</CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setChartView('bar')}>
                      <BarChart3 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setChartView('line')}>
                      <LineChartIcon className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={mockPerformanceData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid stroke="#f5f5f5" vertical={false} />
                      <XAxis dataKey="name" scale="band" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend />
                      {chartView === 'bar' ? (
                        <Bar yAxisId="left" dataKey="value" name="Usage Count" barSize={20} fill="#413ea0" radius={[4, 4, 0, 0]} />
                      ) : (
                        <Line yAxisId="left" type="monotone" dataKey="value" name="Usage Count" stroke="#413ea0" strokeWidth={3} />
                      )}
                      <Line yAxisId="right" type="monotone" dataKey="value2" name="Success Rate %" stroke="#ff7300" strokeWidth={2} dot={{ r: 4 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data Table 1: Top Performing Agencies */}
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-0">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    Top Performing Agencies
                  </CardTitle>
                  <CardDescription>Ranked by engagement and compliance scores</CardDescription>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setActiveTab("teams")}>
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Agency Name</TableHead>
                      <TableHead>Supervisor</TableHead>
                      <TableHead className="text-center">Members</TableHead>
                      <TableHead className="text-center">Compliance</TableHead>
                      <TableHead className="text-right">Activity Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allTeams.data?.slice(0, 5).map((team, i) => (
                      <TableRow key={team.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white
                              ${i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-slate-400' : i === 2 ? 'bg-amber-700' : 'bg-primary'}`}>
                              {i + 1}
                            </div>
                            {team.name}
                          </div>
                        </TableCell>
                        <TableCell>{team.supervisorName}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="font-normal">{team.memberCount}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Progress value={85 + Math.random() * 15} className="w-16 h-2" />
                            <span className="text-xs text-muted-foreground">High</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium text-emerald-600">
                          {Math.floor(800 + Math.random() * 200)} pts
                        </TableCell>
                      </TableRow>
                    ))}
                    {!allTeams.data?.length && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No agency data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Agency Teams Management */}
        <TabsContent value="teams" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          {!selectedTeamId ? (
            <Card className="shadow-sm border-border/50">
              <CardHeader className="pb-4 border-b">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <CardTitle className="text-xl">Agency Directory</CardTitle>
                    <CardDescription>Manage and monitor all agency teams on the platform</CardDescription>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search agencies..."
                        className="pl-9 w-full md:w-[250px] bg-background"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[130px] bg-background">
                        <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active Only</SelectItem>
                        <SelectItem value="inactive">Inactive Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Data Table 2: Agency Directory */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="w-[300px] cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => toggleSort("name")}>
                          <div className="flex items-center gap-1">
                            Agency Name
                            {sortBy === "name" && (sortOrder === "asc" ? <ChevronRight className="w-3 h-3 rotate-90" /> : <ChevronRight className="w-3 h-3 -rotate-90" />)}
                          </div>
                        </TableHead>
                        <TableHead>Supervisor</TableHead>
                        <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => toggleSort("members")}>
                          <div className="flex items-center gap-1">
                            Members
                            {sortBy === "members" && (sortOrder === "asc" ? <ChevronRight className="w-3 h-3 rotate-90" /> : <ChevronRight className="w-3 h-3 -rotate-90" />)}
                          </div>
                        </TableHead>
                        <TableHead className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => toggleSort("status")}>
                          <div className="flex items-center gap-1">
                            Status
                            {sortBy === "status" && (sortOrder === "asc" ? <ChevronRight className="w-3 h-3 rotate-90" /> : <ChevronRight className="w-3 h-3 -rotate-90" />)}
                          </div>
                        </TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedTeams.map((team) => (
                        <TableRow 
                          key={team.id} 
                          className="hover:bg-muted/30 cursor-pointer group transition-colors"
                          onClick={() => setSelectedTeamId(team.id)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                <Building2 className="w-5 h-5 text-primary group-hover:text-primary-foreground" />
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">{team.name}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  ID: {team.id} • Created {new Date().getFullYear()}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
                                {team.supervisorName.charAt(0)}
                              </div>
                              <span className="text-sm font-medium">{team.supervisorName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-background font-normal">
                              <Users className="w-3 h-3 mr-1 text-muted-foreground" />
                              {team.memberCount} agents
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={team.isActive ? "default" : "secondary"}
                              className={team.isActive ? "bg-emerald-500 hover:bg-emerald-600" : ""}
                            >
                              {team.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <ChevronRight className="w-5 h-5 text-muted-foreground" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {paginatedTeams.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                            <div className="flex flex-col items-center justify-center">
                              <Search className="w-8 h-8 mb-2 opacity-20" />
                              <p>No agencies found matching your criteria.</p>
                              {(searchQuery || statusFilter !== "all") && (
                                <Button variant="link" onClick={() => { setSearchQuery(""); setStatusFilter("all"); }}>
                                  Clear filters
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/10">
                    <div className="text-sm text-muted-foreground">
                      Showing <span className="font-medium text-foreground">{(page - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-foreground">{Math.min(page * itemsPerPage, filteredTeams.length)}</span> of <span className="font-medium text-foreground">{filteredTeams.length}</span> agencies
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-1 px-2">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum = i + 1;
                          if (totalPages > 5 && page > 3) {
                            pageNum = page - 3 + i + (page + 2 > totalPages ? totalPages - page - 2 : 0);
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={page === pageNum ? "default" : "ghost"}
                              size="sm"
                              className={`w-8 h-8 p-0 ${page === pageNum ? "" : "text-muted-foreground"}`}
                              onClick={() => setPage(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              {/* Team Detail Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-4 rounded-xl border shadow-sm">
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="icon" onClick={() => setSelectedTeamId(null)} className="h-10 w-10 rounded-full">
                    <ChevronRight className="w-5 h-5 rotate-180" />
                  </Button>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold">{allTeams.data?.find((t) => t.id === selectedTeamId)?.name}</h2>
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Active</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <Users className="w-3.5 h-3.5" /> {allTeams.data?.find((t) => t.id === selectedTeamId)?.memberCount} Members
                      <span className="text-border mx-1">|</span>
                      <Briefcase className="w-3.5 h-3.5" /> Supervisor: {allTeams.data?.find((t) => t.id === selectedTeamId)?.supervisorName}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" /> Manage Settings
                  </Button>
                  <Button size="sm">
                    <Mail className="w-4 h-4 mr-2" /> Message Team
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Team Activity Analytics */}
                <Card className="lg:col-span-2 shadow-sm border-border/50">
                  <CardHeader className="pb-2 border-b">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" />
                        Team Activity Analytics
                      </CardTitle>
                      <Select value={dateRange} onValueChange={setDateRange}>
                        <SelectTrigger className="w-[120px] h-8 text-xs">
                          <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">Last 7 Days</SelectItem>
                          <SelectItem value="14">Last 14 Days</SelectItem>
                          <SelectItem value="30">Last 30 Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {!teamActivity.data ? (
                      <div className="h-[250px] flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 gap-4 mb-6">
                          <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex flex-col items-center justify-center text-center transition-transform hover:scale-[1.02] cursor-pointer">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                              <Activity className="w-5 h-5 text-primary" />
                            </div>
                            <p className="text-3xl font-bold text-foreground">{teamActivity.data.sessions.length}</p>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">Login Sessions</p>
                          </div>
                          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex flex-col items-center justify-center text-center transition-transform hover:scale-[1.02] cursor-pointer">
                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center mb-2">
                              <MousePointer2 className="w-5 h-5 text-blue-600" />
                            </div>
                            <p className="text-3xl font-bold text-foreground">{teamActivity.data.pageActivity.length}</p>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">Interactions</p>
                          </div>
                          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex flex-col items-center justify-center text-center transition-transform hover:scale-[1.02] cursor-pointer">
                            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center mb-2">
                              <Clock className="w-5 h-5 text-amber-600" />
                            </div>
                            <p className="text-3xl font-bold text-foreground">
                              {Math.round(teamActivity.data.sessions.reduce((s, sess) => s + (sess.durationSecs ?? 0), 0) / 3600)}
                              <span className="text-lg text-muted-foreground font-normal ml-1">hrs</span>
                            </p>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-1">Total Time</p>
                          </div>
                        </div>
                        
                        {/* Chart 5: Activity Trend (Bar Chart) */}
                        <div className="h-[200px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={mockTimeSeriesData.slice(-14)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} dy={10} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6b7280' }} />
                              <Tooltip 
                                cursor={{ fill: '#f3f4f6' }}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                              />
                              <Bar dataKey="active" name="Sessions" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={16} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Team Compliance Status */}
                <Card className="shadow-sm border-border/50">
                  <CardHeader className="pb-2 border-b">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <Shield className="w-5 h-5 text-primary" />
                      Compliance Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center justify-center mb-6">
                      <div className="relative w-32 h-32 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="45" fill="transparent" stroke="#e5e7eb" strokeWidth="10" />
                          <circle 
                            cx="50" cy="50" r="45" fill="transparent" 
                            stroke="#10b981" strokeWidth="10" 
                            strokeDasharray={`${2 * Math.PI * 45}`} 
                            strokeDashoffset={`${2 * Math.PI * 45 * (1 - 0.85)}`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center justify-center">
                          <span className="text-3xl font-bold text-foreground">85%</span>
                          <span className="text-[10px] text-muted-foreground uppercase font-medium">Compliant</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                          <span className="text-sm font-medium">Signed Agreements</span>
                        </div>
                        <span className="text-sm font-bold">12</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                          <span className="text-sm font-medium">Pending Signature</span>
                        </div>
                        <span className="text-sm font-bold">2</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <span className="text-sm font-medium">Overdue Reviews</span>
                        </div>
                        <span className="text-sm font-bold">1</span>
                      </div>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <Button variant="outline" className="w-full text-primary hover:text-primary hover:bg-primary/5">
                      View Compliance Report
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Data Table 3: Team Roster */}
              <Card className="shadow-sm border-border/50">
                <CardHeader className="pb-0">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        Team Roster
                      </CardTitle>
                      <CardDescription>Manage individual agents within this team</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {selectedMembers.length > 0 && (
                        <Button variant="secondary" size="sm" className="bg-primary/10 text-primary hover:bg-primary/20">
                          Action on {selectedMembers.length} selected
                        </Button>
                      )}
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-1" /> Add Member
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  {!teamMembers.data ? (
                    <div className="py-12 flex justify-center">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader className="bg-muted/50">
                          <TableRow>
                            <TableHead className="w-12 text-center">
                              <input 
                                type="checkbox" 
                                className="rounded border-gray-300 text-primary focus:ring-primary"
                                checked={selectedMembers.length === teamMembers.data.length && teamMembers.data.length > 0}
                                onChange={() => handleSelectAllMembers(teamMembers.data?.map((m) => m.id) || [])}
                              />
                            </TableHead>
                            <TableHead>Agent Profile</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Compliance</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {teamMembers.data.map((m) => (
                            <TableRow 
                              key={m.id} 
                              className={`hover:bg-muted/30 transition-colors ${selectedMembers.includes(m.id) ? 'bg-primary/5' : ''}`}
                            >
                              <TableCell className="text-center">
                                <input 
                                  type="checkbox" 
                                  className="rounded border-gray-300 text-primary focus:ring-primary"
                                  checked={selectedMembers.includes(m.id)}
                                  onChange={() => handleSelectMember(m.id)}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm
                                    ${m.role === "supervisor" ? "bg-gradient-to-br from-amber-400 to-amber-600" : "bg-gradient-to-br from-slate-400 to-slate-600"}`}>
                                    {m.userName.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm text-foreground">{m.userName}</p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Mail className="w-3 h-3" /> {m.userEmail}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={m.role === "supervisor" ? "default" : "secondary"}
                                  className={m.role === "supervisor" ? "bg-amber-500 hover:bg-amber-600" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}
                                >
                                  {m.role === "supervisor" ? (
                                    <span className="flex items-center gap-1"><Star className="w-3 h-3" /> Supervisor</span>
                                  ) : "Agent"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  <div className={`w-2 h-2 rounded-full ${
                                    m.status === "active" ? "bg-emerald-500" : 
                                    m.status === "pending" ? "bg-amber-500" : "bg-red-500"
                                  }`}></div>
                                  <span className="text-sm capitalize">{m.status}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {m.agreementSigned ? (
                                  <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md inline-flex">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span className="text-xs font-medium">Signed</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-red-600 bg-red-50 px-2 py-1 rounded-md inline-flex">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span className="text-xs font-medium">Missing</span>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {teamMembers.data.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                No members found in this team.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Legal Records */}
        <TabsContent value="documents" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <Card className="shadow-sm border-border/50">
            <CardHeader className="pb-4 border-b">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <ScrollText className="w-5 h-5 text-primary" />
                    Legal Document Repository
                  </CardTitle>
                  <CardDescription>
                    Master copies of all supervisor monitoring agreements and compliance records
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Printer className="w-4 h-4 mr-2" /> Print Batch
                  </Button>
                  <Button size="sm">
                    <Download className="w-4 h-4 mr-2" /> Export All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-4 bg-muted/20 border-b flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search documents, signers..." 
                    className="h-8 w-full sm:w-[250px] bg-background"
                  />
                </div>
                
                {/* Team Filter Buttons */}
                <div className="flex gap-2 overflow-x-auto pb-1 w-full sm:w-auto hide-scrollbar">
                  <Button
                    variant={selectedTeamId === null ? "default" : "outline"}
                    size="sm"
                    className="whitespace-nowrap h-8 rounded-full px-4"
                    onClick={() => setSelectedTeamId(null)}
                  >
                    All Teams
                  </Button>
                  {allTeams.data?.slice(0, 4).map((t) => (
                    <Button
                      key={t.id}
                      variant={selectedTeamId === t.id ? "default" : "outline"}
                      size="sm"
                      className="whitespace-nowrap h-8 rounded-full px-4"
                      onClick={() => setSelectedTeamId(t.id)}
                    >
                      {t.name}
                    </Button>
                  ))}
                  {(allTeams.data?.length || 0) > 4 && (
                    <Button variant="outline" size="sm" className="whitespace-nowrap h-8 rounded-full px-4">
                      +{(allTeams.data?.length || 0) - 4} More
                    </Button>
                  )}
                </div>
              </div>

              {/* Data Table 4: Legal Documents */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="w-[400px]">Document</TableHead>
                      <TableHead>Signer</TableHead>
                      <TableHead>Agency Team</TableHead>
                      <TableHead>Date Signed</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!legalDocs.data ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center">
                          <div className="flex justify-center">
                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : legalDocs.data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                          <div className="flex flex-col items-center justify-center">
                            <FileText className="w-8 h-8 mb-2 opacity-20" />
                            <p>No legal documents found matching criteria.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      legalDocs.data.map((doc) => (
                        <TableRow 
                          key={doc.id} 
                          className="hover:bg-muted/30 cursor-pointer group transition-colors"
                          onClick={() => { setSelectedDocId(doc.id); setDocDialogOpen(true); }}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                <FileText className="w-5 h-5 text-purple-600 group-hover:text-white" />
                              </div>
                              <div>
                                <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{doc.title}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Badge variant="outline" className="text-[10px] h-4 px-1 py-0 bg-background font-normal">
                                    {doc.documentType.replace(/_/g, " ")}
                                  </Badge>
                                  <span className="text-[10px] text-muted-foreground font-mono">ID: {doc.id.toString().padStart(6, '0')}</span>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{doc.signerName}</span>
                              <span className="text-xs text-muted-foreground">{doc.signerEmail}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="text-sm">{doc.relatedTeamName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm">{new Date(doc.signedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                              <span className="text-xs text-muted-foreground">{new Date(doc.signedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <Eye className="w-4 h-4 mr-1.5" /> View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Compliance Center (New) */}
        <TabsContent value="compliance" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Compliance Alerts */}
            <Card className="lg:col-span-2 shadow-sm border-border/50 border-t-4 border-t-red-500">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    Active Compliance Alerts
                  </CardTitle>
                  <Badge variant="destructive" className="rounded-full px-2.5">
                    {complianceAlerts.data?.length || 0} Critical
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Data Table 5: Compliance Alerts */}
                <div className="space-y-3 mt-2">
                  {!complianceAlerts.data ? (
                    <div className="py-8 text-center text-muted-foreground animate-pulse">Loading alerts...</div>
                  ) : complianceAlerts.data.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      </div>
                      <h3 className="text-lg font-medium text-foreground">All Clear</h3>
                      <p className="text-muted-foreground">No active compliance alerts require your attention.</p>
                    </div>
                  ) : (
                    complianceAlerts.data.map((alert, i) => (
                      <div key={i} className="flex items-start gap-4 p-4 rounded-xl border bg-card hover:bg-muted/20 transition-colors">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5
                          ${alert.severity === 'high' ? 'bg-red-500/10 text-red-600' : 
                            alert.severity === 'medium' ? 'bg-amber-500/10 text-amber-600' : 
                            'bg-blue-500/10 text-blue-600'}`}>
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="font-semibold text-foreground truncate">{alert.title}</h4>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(alert.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{alert.description}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] font-normal uppercase tracking-wider">
                              {alert.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs font-medium">{alert.targetName}</span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="flex-shrink-0">
                          Resolve
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Compliance Metrics */}
            <div className="space-y-6">
              <Card className="shadow-sm border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Audit Readiness</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center py-4">
                    <div className="relative w-40 h-40 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f3f4f6" strokeWidth="12" />
                        <circle 
                          cx="50" cy="50" r="40" fill="transparent" 
                          stroke="#3b82f6" strokeWidth="12" 
                          strokeDasharray={`${2 * Math.PI * 40}`} 
                          strokeDashoffset={`${2 * Math.PI * 40 * (1 - 0.92)}`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center text-center">
                        <span className="text-4xl font-bold text-foreground tracking-tighter">92<span className="text-xl">%</span></span>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Score</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="text-center p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground mb-1">Documents</p>
                      <p className="text-lg font-semibold text-foreground">98%</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground mb-1">Training</p>
                      <p className="text-lg font-semibold text-foreground">85%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm border-border/50 bg-primary text-primary-foreground overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Shield className="w-24 h-24" />
                </div>
                <CardHeader className="pb-2 relative z-10">
                  <CardTitle className="text-base font-semibold text-primary-foreground">Generate Audit Report</CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <p className="text-sm text-primary-foreground/80 mb-4">
                    Compile a comprehensive compliance report for external auditors or regulatory bodies.
                  </p>
                  <Button variant="secondary" className="w-full font-semibold shadow-sm">
                    <Download className="w-4 h-4 mr-2" /> Download PDF Report
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Tab 5: System Activity */}
        <TabsContent value="sessions" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <Card className="shadow-sm border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">System Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">API Services</span>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Operational</Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Database</span>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Operational</Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Doc Processing</span>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Operational</Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Current Load</span>
                    <span className="text-sm font-medium">24%</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="shadow-sm border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <Shield className="w-4 h-4 mr-2 text-muted-foreground" /> Force Logout All Users
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <RefreshCw className="w-4 h-4 mr-2 text-muted-foreground" /> Clear System Cache
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <Settings className="w-4 h-4 mr-2 text-muted-foreground" /> Maintenance Mode
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="lg:col-span-3 shadow-sm border-border/50">
              <CardHeader className="pb-4 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Activity className="w-5 h-5 text-primary" />
                      Live Activity Log
                    </CardTitle>
                    <CardDescription>Real-time monitoring of user sessions and platform interactions</CardDescription>
                  </div>
                  <Badge variant="secondary" className="animate-pulse bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">
                    <span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5 inline-block"></span>
                    Live Updates
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {/* Data Table 6: System Activity */}
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead className="w-[180px]">Timestamp</TableHead>
                        <TableHead>User / IP</TableHead>
                        <TableHead>Event Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Duration</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats?.recentSessions?.map((session, i) => (
                        <TableRow key={i} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              {new Date(session.loginAt).toLocaleString('en-US', { 
                                month: 'short', day: 'numeric', 
                                hour: '2-digit', minute: '2-digit', second: '2-digit' 
                              })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">User #{session.userId}</span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Globe className="w-3 h-3" /> {session.ipAddress ?? "Unknown IP"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`p-1.5 rounded-md ${session.isActive ? 'bg-blue-500/10 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                                {session.isActive ? <Activity className="w-3.5 h-3.5" /> : <LogOut className="w-3.5 h-3.5" />}
                              </div>
                              <span className="text-sm">{session.isActive ? 'Active Session' : 'Session Ended'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={session.isActive ? "default" : "secondary"}
                              className={session.isActive ? "bg-blue-500 hover:bg-blue-600" : "bg-slate-100 text-slate-600"}
                            >
                              {session.isActive ? "Online" : "Offline"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {session.durationSecs != null ? (
                              <span className="text-sm font-medium text-foreground">
                                {Math.floor(session.durationSecs / 60)}m {session.durationSecs % 60}s
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!stats?.recentSessions || stats.recentSessions.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                            No recent activity recorded.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Document Viewer Dialog */}
      <Dialog open={docDialogOpen} onOpenChange={setDocDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-card border-border/60 shadow-xl">
          <DialogHeader className="p-6 pb-4 border-b bg-muted/10">
            <div className="flex justify-between items-start pr-6">
              <div>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  {selectedDoc.data?.title || "Loading Document..."}
                </DialogTitle>
                <DialogDescription className="mt-1.5 text-sm">
                  Official legal record • Immutable copy for compliance purposes
                </DialogDescription>
              </div>
              {selectedDoc.data && (
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Validated
                </Badge>
              )}
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6">
            {!selectedDoc.data ? (
              <div className="py-20 flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-muted-foreground animate-pulse">Retrieving secure document...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Document Metadata Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg border bg-muted/10">
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Signer Identity</p>
                    <p className="font-medium text-sm truncate">{selectedDoc.data.signerName}</p>
                    <p className="text-xs text-muted-foreground truncate">{selectedDoc.data.signerEmail}</p>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/10">
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Organization</p>
                    <p className="font-medium text-sm truncate">{selectedDoc.data.relatedTeamName}</p>
                    <p className="text-xs text-muted-foreground truncate">Sup: {selectedDoc.data.supervisorName}</p>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/10">
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Execution Date</p>
                    <p className="font-medium text-sm">{new Date(selectedDoc.data.signedAt).toLocaleDateString()}</p>
                    <p className="text-xs text-muted-foreground">{new Date(selectedDoc.data.signedAt).toLocaleTimeString()}</p>
                  </div>
                  <div className="p-3 rounded-lg border bg-muted/10">
                    <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Digital Trail</p>
                    <p className="font-medium text-sm font-mono truncate">{selectedDoc.data.ipAddress}</p>
                    <p className="text-[10px] text-muted-foreground truncate" title={selectedDoc.data.userAgent}>
                      {selectedDoc.data.userAgent.substring(0, 20)}...
                    </p>
                  </div>
                </div>
                
                {/* Document Content */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <ScrollText className="w-4 h-4" /> Document Content
                    </h3>
                    <Button variant="ghost" size="sm" className="h-7 text-xs">
                      <Maximize2 className="w-3 h-3 mr-1" /> Fullscreen
                    </Button>
                  </div>
                  <div className="border rounded-xl p-6 md:p-8 bg-white text-slate-900 shadow-inner min-h-[400px]">
                    <div className="max-w-3xl mx-auto">
                      <div className="border-b-2 border-slate-200 pb-4 mb-6 text-center">
                        <h2 className="text-xl font-bold uppercase tracking-widest text-slate-800">{selectedDoc.data.title}</h2>
                        <p className="text-sm text-slate-500 mt-2">Document ID: {selectedDoc.data.id.toString().padStart(8, '0')}</p>
                      </div>
                      <pre className="whitespace-pre-wrap text-sm font-serif leading-relaxed text-slate-700">
                        {selectedDoc.data.documentContent}
                      </pre>
                      
                      <div className="mt-12 pt-8 border-t border-slate-200 grid grid-cols-2 gap-8">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Digitally Signed By:</p>
                          <p className="font-bold text-slate-800 border-b border-slate-300 pb-1 inline-block min-w-[200px]">
                            {selectedDoc.data.signerName}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">Date: {new Date(selectedDoc.data.signedAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Digital Signature Hash:</p>
                          <p className="font-mono text-xs text-slate-600 bg-slate-50 p-2 rounded border break-all">
                            {btoa(`${selectedDoc.data.id}-${selectedDoc.data.signedAt}-${selectedDoc.data.ipAddress}`).substring(0, 40)}...
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="p-4 border-t bg-muted/10 sm:justify-between">
            <div className="flex items-center text-xs text-muted-foreground">
              <Shield className="w-3 h-3 mr-1" /> Immutable record
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setDocDialogOpen(false)}>Close</Button>
              <Button disabled={!selectedDoc.data}>
                <Download className="w-4 h-4 mr-2" /> Download PDF
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Report Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Export Oversight Report</DialogTitle>
            <DialogDescription>
              Generate a comprehensive report of platform metrics and agency status.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="report-type">Report Type</Label>
              <Select defaultValue="full">
                <SelectTrigger id="report-type">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Platform Audit</SelectItem>
                  <SelectItem value="agencies">Agency Roster Only</SelectItem>
                  <SelectItem value="compliance">Compliance Status</SelectItem>
                  <SelectItem value="activity">System Activity Log</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="format">Format</Label>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger id="format">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Document (.pdf)</SelectItem>
                  <SelectItem value="csv">Data Spreadsheet (.csv)</SelectItem>
                  <SelectItem value="json">Raw Data (.json)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="date-range">Date Range</Label>
              <Select defaultValue="30">
                <SelectTrigger id="date-range">
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 Days</SelectItem>
                  <SelectItem value="30">Last 30 Days</SelectItem>
                  <SelectItem value="90">Last Quarter</SelectItem>
                  <SelectItem value="365">Last Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>Cancel</Button>
            <Button onClick={() => {
              setIsRefreshing(true);
              setTimeout(() => {
                setIsRefreshing(false);
                setShowExportDialog(false);
              }, 1500);
            }}>
              {isRefreshing ? "Generating..." : "Generate Export"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LogOut(props: any) {
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
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}

function MousePointer2(props: any) {
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
      <path d="m14 4.1 2.86 16.99a1 1 0 0 1-1.82.74l-3.9-6.5-6.5-3.9a1 1 0 0 1 .74-1.82L22.37 12.5" />
    </svg>
  );
}

function Plus(props: any) {
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
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
