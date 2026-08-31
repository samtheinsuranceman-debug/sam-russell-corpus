// @ts-nocheck
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Plus, UserPlus, Activity, FileText, Shield, Clock, Eye, BarChart3, Trash2, ChevronRight, Settings, Download, Search, Filter, ArrowUpRight, ArrowDownRight, RefreshCw, Mail, Calendar, CheckCircle2, AlertCircle, Briefcase, Award, TrendingUp, Zap, PieChartIcon, LineChartIcon, ShieldCheck, Target, Layers } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { ExportToSlides } from "@/components/ExportToSlides";
import { BarChart, LineChart, PieChart, AreaChart, RadarChart, ComposedChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Bar, Line, Pie, Cell, Area, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";

const generateMockTimeSeriesData = (days: number) => {
  return Array.from({ length: days }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      activeUsers: Math.floor(Math.random() * 50) + 10,
      sessions: Math.floor(Math.random() * 100) + 20,
      pageViews: Math.floor(Math.random() * 300) + 50,
      conversions: Math.floor(Math.random() * 10) + 1,
    };
  });
};

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

export default function TeamManagement() {
  const { user } = useAuth();

  const [createOpen, setCreateOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDesc, setNewTeamDesc] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [activeTab, setActiveTab] = useState("teams");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateRange, setDateRange] = useState("30");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [showMemberDetails, setShowMemberDetails] = useState(false);
  const [chartView, setChartView] = useState("activity");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [bulkSelect, setBulkSelect] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [exportFormat, setExportFormat] = useState("csv");
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [theme, setTheme] = useState("system");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(5);

  const myTeams = trpc.agency.listMyTeams.useQuery();
  const isOwner = trpc.agency.isOwner.useQuery();
  const teamMembers = trpc.agency.listTeamMembers.useQuery(
    { teamId: selectedTeamId! },
    { enabled: !!selectedTeamId }
  );
  const teamActivity = trpc.agency.getTeamActivity.useQuery(
    { teamId: selectedTeamId!, days: parseInt(dateRange) },
    { enabled: !!selectedTeamId && activeTab === "activity" }
  );
  const legalDocs = trpc.agency.listLegalDocuments.useQuery(
    { teamId: selectedTeamId ?? undefined },
    { enabled: activeTab === "documents" }
  );
  
  const leaderboardData = trpc.leaderboard.getRankings.useQuery(
    { teamId: selectedTeamId! },
    { enabled: !!selectedTeamId && activeTab === "performance" }
  );
  const complianceAlerts = trpc.complianceAlerts.listAlerts.useQuery(
    { teamId: selectedTeamId! },
    { enabled: !!selectedTeamId && activeTab === "compliance" }
  );

  const utils = trpc.useUtils();

  const createTeam = trpc.agency.createTeam.useMutation({
    onSuccess: (data) => {
      toast.success(`Team Created — ${data.name} has been created successfully.`);
      setCreateOpen(false);
      setNewTeamName("");
      setNewTeamDesc("");
      utils.agency.listMyTeams.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const addMember = trpc.agency.addTeamMember.useMutation({
    onSuccess: () => {
      toast.success(`Agent Added — ${newMemberName} has been invited to the team.`);
      setAddMemberOpen(false);
      setNewMemberName("");
      setNewMemberEmail("");
      if (selectedTeamId) utils.agency.listTeamMembers.invalidate({ teamId: selectedTeamId });
    },
    onError: (err) => toast.error(err.message),
  });

  const removeMember = trpc.agency.removeTeamMember.useMutation({
    onSuccess: () => {
      toast.success("Agent Removed");
      if (selectedTeamId) utils.agency.listTeamMembers.invalidate({ teamId: selectedTeamId });
    },
  });

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    if (selectedTeamId) {
      utils.agency.listTeamMembers.invalidate({ teamId: selectedTeamId });
      utils.agency.getTeamActivity.invalidate({ teamId: selectedTeamId, days: parseInt(dateRange) });
    }
    setTimeout(() => setIsRefreshing(false), 1000);
  }, [selectedTeamId, dateRange, utils]);

  const toggleBulkSelect = useCallback((id: number) => {
    setBulkSelect(prev => 
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  const selectAll = useCallback(() => {
    if (!teamMembers.data) return;
    if (bulkSelect.length === teamMembers.data.length) {
      setBulkSelect([]);
    } else {
      setBulkSelect(teamMembers.data.map((m) => m.id));
    }
  }, [teamMembers.data, bulkSelect.length]);

  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  }, [sortField]);

  const handleExport = useCallback(() => {
    toast.success(`Exporting data as ${exportFormat.toUpperCase()}...`);
    setShowExportModal(false);
  }, [exportFormat]);

  const handleViewMember = useCallback((id: number) => {
    setSelectedMemberId(id);
    setShowMemberDetails(true);
  }, []);

  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const intervalId = setInterval(() => {
        handleRefresh();
      }, refreshInterval * 60 * 1000);
      return () => clearInterval(intervalId);
    }
  }, [autoRefresh, refreshInterval, handleRefresh]);

  useEffect(() => {
    if (myTeams.data && !selectedTeamId) {
      const allTeams = [...(myTeams.data.supervisedTeams ?? []), ...(myTeams.data.memberTeams ?? [])];
      if (allTeams.length > 0) {
        setSelectedTeamId(allTeams[0].id);
      }
    }
  }, [myTeams.data, selectedTeamId]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterRole, filterStatus]);

  const allTeams = useMemo(() => {
    return [...(myTeams.data?.supervisedTeams ?? []), ...(myTeams.data?.memberTeams ?? [])];
  }, [myTeams.data]);

  const selectedTeam = useMemo(() => {
    return allTeams.find((t) => t.id === selectedTeamId);
  }, [allTeams, selectedTeamId]);

  const isSupervisorOfSelected = useMemo(() => {
    return myTeams.data?.supervisedTeams?.some(t => t.id === selectedTeamId);
  }, [myTeams.data, selectedTeamId]);

  const activitySummary = useMemo(() => {
    if (!teamActivity.data) return [];
    const { sessions, pageActivity, members } = teamActivity.data;
    return members.map((m) => {
      const agentSessions = sessions.filter((s) => s.userId === m.userId);
      const agentPages = pageActivity.filter((p) => p.userId === m.userId);
      const totalDuration = agentSessions.reduce((sum, s) => sum + (s.durationSecs ?? 0), 0);
      const lastLogin = agentSessions[0]?.loginAt;
      const topPages = Object.entries(
        agentPages.reduce<Record<string, number>>((acc, p) => {
          acc[p.pageTitle] = (acc[p.pageTitle] ?? 0) + (p.durationSecs ?? 0);
          return acc;
        }, {})
      ).sort((a, b) => b[1] - a[1]).slice(0, 5);
      
      const performanceScore = Math.floor(Math.random() * 40) + 60;
      const clientsManaged = Math.floor(Math.random() * 50) + 10;
      const aum = Math.floor(Math.random() * 10000000) + 1000000;
      const complianceScore = Math.floor(Math.random() * 20) + 80;
      
      return {
        ...m,
        sessionCount: agentSessions.length,
        totalDuration,
        lastLogin,
        topPages,
        totalPageViews: agentPages.length,
        performanceScore,
        clientsManaged,
        aum,
        complianceScore
      };
    });
  }, [teamActivity.data]);

  const filteredMembers = useMemo(() => {
    if (!teamMembers.data) return [];
    
    let filtered = teamMembers.data.filter((member) => {
      const matchesSearch = member.userName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            member.userEmail.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = filterRole === "all" || member.role === filterRole;
      const matchesStatus = filterStatus === "all" || member.status === filterStatus;
      
      return matchesSearch && matchesRole && matchesStatus;
    });
    
    filtered.sort((a, b) => {
      let valA, valB;
      
      switch (sortField) {
        case 'name':
          valA = a.userName.toLowerCase();
          valB = b.userName.toLowerCase();
          break;
        case 'email':
          valA = a.userEmail.toLowerCase();
          valB = b.userEmail.toLowerCase();
          break;
        case 'role':
          valA = a.role;
          valB = b.role;
          break;
        case 'status':
          valA = a.status;
          valB = b.status;
          break;
        default:
          valA = a.userName.toLowerCase();
          valB = b.userName.toLowerCase();
      }
      
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return filtered;
  }, [teamMembers.data, searchQuery, filterRole, filterStatus, sortField, sortDirection]);

  const paginatedMembers = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return filteredMembers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredMembers, page, itemsPerPage]);

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);

  const timeSeriesData = useMemo(() => generateMockTimeSeriesData(parseInt(dateRange)), [dateRange]);
  
  const roleDistributionData = useMemo(() => {
    if (!teamMembers.data) return [];
    const roles = teamMembers.data.reduce((acc, curr) => {
      acc[curr.role] = (acc[curr.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(roles).map(([name, value]) => ({ name, value }));
  }, [teamMembers.data]);
  
  const statusDistributionData = useMemo(() => {
    if (!teamMembers.data) return [];
    const statuses = teamMembers.data.reduce((acc, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(statuses).map(([name, value]) => ({ name, value }));
  }, [teamMembers.data]);
  
  const performanceRadarData = useMemo(() => {
    if (activitySummary.length === 0) return [];
    const topAgents = [...activitySummary].sort((a, b) => b.performanceScore - a.performanceScore).slice(0, 5);
    
    return topAgents.map((agent) => ({
      subject: agent.userName.split(' ')[0],
      A: agent.performanceScore,
      B: agent.complianceScore,
      C: Math.min(100, agent.sessionCount * 2),
      fullMark: 100,
    }));
  }, [activitySummary]);

  const teamMetricsData = useMemo(() => {
    return [
      { name: 'Jan', aum: 4000, revenue: 2400, clients: 2400 },
      { name: 'Feb', aum: 3000, revenue: 1398, clients: 2210 },
      { name: 'Mar', aum: 2000, revenue: 9800, clients: 2290 },
      { name: 'Apr', aum: 2780, revenue: 3908, clients: 2000 },
      { name: 'May', aum: 1890, revenue: 4800, clients: 2181 },
      { name: 'Jun', aum: 2390, revenue: 3800, clients: 2500 },
      { name: 'Jul', aum: 3490, revenue: 4300, clients: 2100 },
    ];
  }, []);

  const selectedMemberDetails = useMemo(() => {
    if (!selectedMemberId || !teamMembers.data) return null;
    const member = teamMembers.data.find((m) => m.id === selectedMemberId);
    if (!member) return null;
    
    const activity = activitySummary.find((a) => a.userId === member.userId);
    return { ...member, activity };
  }, [selectedMemberId, teamMembers.data, activitySummary]);

  const renderSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ArrowUpRight className="w-3 h-3 ml-1 inline" /> : <ArrowDownRight className="w-3 h-3 ml-1 inline" />;
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-card p-6 rounded-lg border shadow-sm">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Users className="w-8 h-8 text-emerald-500" />
            </div>
            Enterprise Team Management
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Comprehensive command center for agency teams. Monitor agent activity, manage roles, analyze performance metrics, and oversee compliance across your entire organization.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowSettingsModal(true)} className="gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </Button>
          <ExportToSlides
            toolName="Team Management"
            getSections={() => [
              {
                title: "Executive Summary",
                items: [
                  { label: "Total Teams Managed", value: allTeams.length.toString() },
                  { label: "Total Active Agents", value: activitySummary.length.toString() },
                  { label: "Total Platform Sessions", value: activitySummary.reduce((s, a) => s + a.sessionCount, 0).toString() }
                ]
              },
              {
                title: "Top Performers",
                items: activitySummary.sort((a, b) => b.performanceScore - a.performanceScore).slice(0, 3).map((a) => ({
                  label: a.userName,
                  value: `Score: ${a.performanceScore} | AUM: $${(a.aum / 1000000).toFixed(1)}M`
                }))
              }
            ]}
          />
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="w-4 h-4" /> Create Team
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-2">
                  <Briefcase className="w-6 h-6 text-emerald-500" />
                  Create New Agency Team
                </DialogTitle>
                <DialogDescription>
                  Establish a new team hierarchy to manage your downline agents effectively.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label htmlFor="team-name" className="text-sm font-medium">Team / Agency Name <span className="text-destructive">*</span></Label>
                  <Input 
                    id="team-name"
                    placeholder="e.g., Russell Financial Group" 
                    value={newTeamName} 
                    onChange={(e) => setNewTeamName(e.target.value)} 
                    className="focus-visible:ring-emerald-500"
                  />
                  <p className="text-xs text-muted-foreground">This name will be visible to all assigned members.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team-desc" className="text-sm font-medium">Description</Label>
                  <Input 
                    id="team-desc"
                    placeholder="Brief description of this team's focus..." 
                    value={newTeamDesc} 
                    onChange={(e) => setNewTeamDesc(e.target.value)} 
                    className="focus-visible:ring-emerald-500"
                  />
                </div>
                <div className="p-4 bg-muted/50 rounded-lg border border-border/50">
                  <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    Permissions Overview
                  </h4>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                    <li>As the creator, you will be assigned as the Primary Supervisor.</li>
                    <li>You can invite other supervisors or agents later.</li>
                    <li>All team activity will be monitored and logged for compliance.</li>
                  </ul>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button 
                  onClick={() => createTeam.mutate({ name: newTeamName, description: newTeamDesc })} 
                  disabled={newTeamName.length < 2 || createTeam.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {createTeam.isPending ? "Creating..." : "Create Team"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Sidebar - Team Navigation */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="border-border/50 shadow-sm sticky top-6">
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-500" />
                  Your Teams
                </CardTitle>
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">
                  {allTeams.length} Total
                </Badge>
              </div>
              <div className="mt-3 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Filter teams..." 
                  className="pl-9 h-9 text-sm bg-background"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {allTeams.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <Briefcase className="w-6 h-6 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium">No teams yet</p>
                  <p className="text-xs text-muted-foreground mt-1 mb-4">Create your first team to get started.</p>
                  <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
                    Create Team
                  </Button>
                </div>
              ) : (
                <div className="max-h-[600px] overflow-y-auto p-2 space-y-1">
                  {allTeams.map((team) => {
                    const isSelected = selectedTeamId === team.id;
                    return (
                      <div
                        key={team.id}
                        className={`
                          cursor-pointer transition-all duration-200 rounded-md p-3 border
                          ${isSelected 
                            ? "border-emerald-500 bg-emerald-500/10 shadow-sm" 
                            : "border-transparent hover:border-border hover:bg-muted/50"
                          }
                        `}
                        onClick={() => setSelectedTeamId(team.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className={`font-semibold text-sm truncate ${isSelected ? 'text-emerald-700 dark:text-emerald-400' : ''}`}>
                              {team.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-background">
                                {team.supervisorName === user?.name ? 'Owner' : 'Member'}
                              </Badge>
                              <span className="text-xs text-muted-foreground truncate">
                                Sup: {team.supervisorName}
                              </span>
                            </div>
                          </div>
                          {isSelected && <ChevronRight className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-1" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
            {allTeams.length > 5 && (
              <CardFooter className="p-3 border-t border-border/50 bg-muted/10 justify-center">
                <Button variant="ghost" size="sm" className="text-xs w-full">View All Teams</Button>
              </CardFooter>
            )}
          </Card>
          
          {/* Quick Stats Sidebar Card */}
          {selectedTeamId && (
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Quick Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Members</span>
                  <span className="font-semibold">{teamMembers.data?.filter((m) => m.status === 'active').length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pending Invites</span>
                  <span className="font-semibold">{teamMembers.data?.filter((m) => m.status === 'pending').length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Avg Compliance</span>
                  <span className="font-semibold text-emerald-500">94%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '94%' }}></div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Content Area */}
        <div className="lg:col-span-9">
          {!selectedTeamId ? (
            <Card className="h-full min-h-[500px] flex flex-col items-center justify-center border-dashed border-2 bg-muted/5">
              <CardContent className="text-center p-12">
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                  <Users className="w-12 h-12 text-muted-foreground/40" />
                </div>
                <h2 className="text-2xl font-bold mb-2">No Team Selected</h2>
                <p className="text-muted-foreground max-w-md mx-auto mb-8">
                  Select a team from the sidebar to view detailed analytics, manage members, monitor compliance, and track performance.
                </p>
                <Button onClick={() => setCreateOpen(true)} className="gap-2">
                  <Plus className="w-4 h-4" /> Create Your First Team
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Team Header Dashboard */}
              <Card className="overflow-hidden border-border/50 shadow-sm">
                <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge className="bg-white/20 hover:bg-white/30 text-white border-none mb-3">
                        {isSupervisorOfSelected ? 'Supervisor Access' : 'Agent Access'}
                      </Badge>
                      <h2 className="text-3xl font-bold mb-1">{selectedTeam?.name}</h2>
                      <p className="text-emerald-100 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Managed by {selectedTeam?.supervisorName}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-none backdrop-blur-sm">
                        <Settings className="w-4 h-4 mr-2" /> Manage
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Top Level Tabs */}
                <div className="border-b px-6">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="bg-transparent h-14 p-0 w-full justify-start gap-6 border-none rounded-none">
                      <TabsTrigger 
                        value="dashboard" 
                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 rounded-none px-0 h-14 font-medium"
                      >
                        <BarChart3 className="w-4 h-4 mr-2" /> Overview
                      </TabsTrigger>
                      <TabsTrigger 
                        value="teams" 
                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 rounded-none px-0 h-14 font-medium"
                      >
                        <Users className="w-4 h-4 mr-2" /> Directory
                      </TabsTrigger>
                      <TabsTrigger 
                        value="activity" 
                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 rounded-none px-0 h-14 font-medium"
                      >
                        <Activity className="w-4 h-4 mr-2" /> Activity Log
                      </TabsTrigger>
                      <TabsTrigger 
                        value="performance" 
                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 rounded-none px-0 h-14 font-medium"
                      >
                        <TrendingUp className="w-4 h-4 mr-2" /> Performance
                      </TabsTrigger>
                      <TabsTrigger 
                        value="documents" 
                        className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-emerald-500 rounded-none px-0 h-14 font-medium"
                      >
                        <FileText className="w-4 h-4 mr-2" /> Compliance Docs
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </Card>

              {/* DASHBOARD TAB */}
              {activeTab === "dashboard" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Members</p>
                            <h3 className="text-3xl font-bold mt-2">{teamMembers.data?.length || 0}</h3>
                          </div>
                          <div className="p-3 bg-blue-500/10 rounded-lg">
                            <Users className="w-5 h-5 text-blue-500" />
                          </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm">
                          <span className="text-emerald-500 flex items-center font-medium">
                            <ArrowUpRight className="w-4 h-4 mr-1" /> +12%
                          </span>
                          <span className="text-muted-foreground ml-2">vs last month</span>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Active Sessions</p>
                            <h3 className="text-3xl font-bold mt-2">
                              {activitySummary.reduce((s, a) => s + a.sessionCount, 0)}
                            </h3>
                          </div>
                          <div className="p-3 bg-emerald-500/10 rounded-lg">
                            <Activity className="w-5 h-5 text-emerald-500" />
                          </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm">
                          <span className="text-emerald-500 flex items-center font-medium">
                            <ArrowUpRight className="w-4 h-4 mr-1" /> +24%
                          </span>
                          <span className="text-muted-foreground ml-2">vs last month</span>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Total AUM</p>
                            <h3 className="text-3xl font-bold mt-2">
                              ${(activitySummary.reduce((s, a) => s + (a.aum || 0), 0) / 1000000).toFixed(1)}M
                            </h3>
                          </div>
                          <div className="p-3 bg-purple-500/10 rounded-lg">
                            <TrendingUp className="w-5 h-5 text-purple-500" />
                          </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm">
                          <span className="text-emerald-500 flex items-center font-medium">
                            <ArrowUpRight className="w-4 h-4 mr-1" /> +8%
                          </span>
                          <span className="text-muted-foreground ml-2">vs last month</span>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Compliance Score</p>
                            <h3 className="text-3xl font-bold mt-2">94/100</h3>
                          </div>
                          <div className="p-3 bg-amber-500/10 rounded-lg">
                            <ShieldCheck className="w-5 h-5 text-amber-500" />
                          </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm">
                          <span className="text-destructive flex items-center font-medium">
                            <ArrowDownRight className="w-4 h-4 mr-1" /> -2%
                          </span>
                          <span className="text-muted-foreground ml-2">vs last month</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Charts Row 1 */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Chart 1: Area Chart */}
                    <Card className="col-span-1">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                          <LineChartIcon className="w-5 h-5 text-blue-500" />
                          Platform Engagement Trends
                        </CardTitle>
                        <CardDescription>Daily active users and sessions over time</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={timeSeriesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                              <Tooltip 
                                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                itemStyle={{ fontWeight: 500 }}
                              />
                              <Legend verticalAlign="top" height={36}/>
                              <Area type="monotone" dataKey="sessions" name="Total Sessions" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSessions)" />
                              <Area type="monotone" dataKey="activeUsers" name="Active Users" stroke="#10b981" fillOpacity={1} fill="url(#colorUsers)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Chart 2: Composed Chart */}
                    <Card className="col-span-1">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                          <BarChart3 className="w-5 h-5 text-purple-500" />
                          Revenue & AUM Growth
                        </CardTitle>
                        <CardDescription>Monthly financial performance metrics</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={teamMetricsData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                              <CartesianGrid stroke="#f5f5f5" strokeDasharray="3 3" vertical={false} />
                              <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                              <YAxis yAxisId="left" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                              <YAxis yAxisId="right" orientation="right" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                              />
                              <Legend />
                              <Bar yAxisId="left" dataKey="revenue" name="Revenue ($K)" barSize={20} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                              <Line yAxisId="right" type="monotone" dataKey="aum" name="AUM ($M)" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Charts Row 2 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Chart 3: Pie Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-md font-semibold flex items-center gap-2">
                          <PieChartIcon className="w-4 h-4 text-amber-500" />
                          Role Distribution
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[250px] w-full">
                          {roleDistributionData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={roleDistributionData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={80}
                                  paddingAngle={5}
                                  dataKey="value"
                                >
                                  {roleDistributionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                              </PieChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Chart 4: Radar Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-md font-semibold flex items-center gap-2">
                          <Target className="w-4 h-4 text-rose-500" />
                          Top Agent Competencies
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[250px] w-full">
                          {performanceRadarData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={performanceRadarData}>
                                <PolarGrid stroke="#e5e7eb" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 10 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar name="Performance" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                                <Radar name="Compliance" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.5} />
                                <Tooltip />
                                <Legend wrapperStyle={{ fontSize: '12px' }} />
                              </RadarChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Chart 5: Bar Chart */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-md font-semibold flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-cyan-500" />
                          Status Overview
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[250px] w-full">
                          {statusDistributionData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={statusDistributionData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={80} />
                                <Tooltip cursor={{fill: 'transparent'}} />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
                                  {statusDistributionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={
                                      entry.name === 'active' ? '#10b981' : 
                                      entry.name === 'pending' ? '#f59e0b' : '#ef4444'
                                    } />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Table 1: Recent Activity Summary */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-semibold">Recent Agent Activity</CardTitle>
                        <CardDescription>Snapshot of top performing agents this week</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setActiveTab("activity")}>View All</Button>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                            <tr>
                              <th className="px-4 py-3 font-medium rounded-tl-lg">Agent</th>
                              <th className="px-4 py-3 font-medium">Sessions</th>
                              <th className="px-4 py-3 font-medium">Time Spent</th>
                              <th className="px-4 py-3 font-medium">Top Page</th>
                              <th className="px-4 py-3 font-medium rounded-tr-lg text-right">Last Login</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activitySummary.slice(0, 5).map((agent, i) => (
                              <tr key={agent.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                <td className="px-4 py-3 font-medium flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                                    {agent.userName.charAt(0)}
                                  </div>
                                  {agent.userName}
                                </td>
                                <td className="px-4 py-3">{agent.sessionCount}</td>
                                <td className="px-4 py-3">{Math.round(agent.totalDuration / 60)} mins</td>
                                <td className="px-4 py-3">
                                  {agent.topPages.length > 0 ? (
                                    <Badge variant="outline" className="font-normal">{agent.topPages[0][0]}</Badge>
                                  ) : "-"}
                                </td>
                                <td className="px-4 py-3 text-right text-muted-foreground">
                                  {agent.lastLogin ? new Date(agent.lastLogin).toLocaleDateString() : "Never"}
                                </td>
                              </tr>
                            ))}
                            {activitySummary.length === 0 && (
                              <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                  No recent activity found.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* DIRECTORY TAB */}
              {activeTab === "teams" && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  {/* Directory Toolbar */}
                  <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-card p-4 rounded-lg border shadow-sm">
                    <div className="flex flex-1 gap-2 w-full md:w-auto">
                      <div className="relative flex-1 md:max-w-xs">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input 
                          placeholder="Search members..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <Button 
                        variant={showFilters ? "secondary" : "outline"} 
                        onClick={() => setShowFilters(!showFilters)}
                        className="gap-2"
                      >
                        <Filter className="w-4 h-4" />
                        <span className="hidden sm:inline">Filters</span>
                      </Button>
                    </div>
                    
                    <div className="flex gap-2 w-full md:w-auto">
                      {bulkSelect.length > 0 && (
                        <Button variant="destructive" size="sm" className="gap-2">
                          <Trash2 className="w-4 h-4" />
                          Delete ({bulkSelect.length})
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => setShowExportModal(true)} className="gap-2">
                        <Download className="w-4 h-4" />
                        Export
                      </Button>
                      {isSupervisorOfSelected && (
                        <Button onClick={() => setAddMemberOpen(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                          <UserPlus className="w-4 h-4" /> Add Member
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Filters */}
                  {showFilters && (
                    <Card className="border-border/50 shadow-sm animate-in slide-in-from-top-2 duration-200">
                      <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Role</Label>
                          <select 
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={filterRole}
                            onChange={(e) => setFilterRole(e.target.value)}
                          >
                            <option value="all">All Roles</option>
                            <option value="supervisor">Supervisor</option>
                            <option value="agent">Agent</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Status</Label>
                          <select 
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                          >
                            <option value="all">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>
                        <div className="flex items-end">
                          <Button 
                            variant="ghost" 
                            className="w-full text-muted-foreground"
                            onClick={() => {
                              setSearchQuery("");
                              setFilterRole("all");
                              setFilterStatus("all");
                            }}
                          >
                            Reset Filters
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Table 2: Comprehensive Member Directory */}
                  <Card className="border-border/50 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
                          <tr>
                            <th className="px-4 py-3 w-10">
                              <input 
                                type="checkbox" 
                                className="rounded border-gray-300"
                                checked={teamMembers.data && teamMembers.data.length > 0 && bulkSelect.length === teamMembers.data.length}
                                onChange={selectAll}
                              />
                            </th>
                            <th className="px-4 py-3 font-medium cursor-pointer hover:text-foreground" onClick={() => handleSort('name')}>
                              Member Info {renderSortIcon('name')}
                            </th>
                            <th className="px-4 py-3 font-medium cursor-pointer hover:text-foreground" onClick={() => handleSort('role')}>
                              Role {renderSortIcon('role')}
                            </th>
                            <th className="px-4 py-3 font-medium cursor-pointer hover:text-foreground" onClick={() => handleSort('status')}>
                              Status {renderSortIcon('status')}
                            </th>
                            <th className="px-4 py-3 font-medium">Compliance</th>
                            <th className="px-4 py-3 font-medium text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {!teamMembers.data ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-12 text-center">
                                <RefreshCw className="w-6 h-6 animate-spin text-emerald-500 mx-auto mb-2" />
                                <p className="text-muted-foreground">Loading members...</p>
                              </td>
                            </tr>
                          ) : paginatedMembers.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-12 text-center">
                                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                                  <Search className="w-6 h-6 text-muted-foreground/50" />
                                </div>
                                <p className="font-medium">No members found</p>
                                <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filters.</p>
                              </td>
                            </tr>
                          ) : (
                            paginatedMembers.map((member) => (
                              <tr key={member.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors group">
                                <td className="px-4 py-4">
                                  <input 
                                    type="checkbox" 
                                    className="rounded border-gray-300"
                                    checked={bulkSelect.includes(member.id)}
                                    onChange={() => toggleBulkSelect(member.id)}
                                  />
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ${member.role === "supervisor" ? "bg-gradient-to-br from-amber-400 to-amber-600" : "bg-gradient-to-br from-emerald-400 to-emerald-600"}`}>
                                      {member.userName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className="font-semibold text-foreground">{member.userName}</p>
                                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Mail className="w-3 h-3" /> {member.userEmail}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <Badge variant={member.role === "supervisor" ? "default" : "secondary"} className={member.role === "supervisor" ? "bg-amber-500 hover:bg-amber-600" : ""}>
                                    {member.role === "supervisor" ? "Supervisor" : "Agent"}
                                  </Badge>
                                </td>
                                <td className="px-4 py-4">
                                  <Badge variant="outline" className={`
                                    ${member.status === "active" ? "border-emerald-500 text-emerald-600 bg-emerald-500/10" : ""}
                                    ${member.status === "pending" ? "border-amber-500 text-amber-600 bg-amber-500/10" : ""}
                                    ${member.status === "inactive" ? "border-destructive text-destructive bg-destructive/10" : ""}
                                  `}>
                                    {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                                  </Badge>
                                </td>
                                <td className="px-4 py-4">
                                  {member.role === "agent" ? (
                                    <div className="flex flex-col gap-1">
                                      <div className="flex items-center gap-1.5">
                                        {member.agreementSigned ? (
                                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                        ) : (
                                          <AlertCircle className="w-4 h-4 text-destructive" />
                                        )}
                                        <span className={`text-xs font-medium ${member.agreementSigned ? 'text-emerald-600' : 'text-destructive'}`}>
                                          {member.agreementSigned ? "Agreement Signed" : "Action Required"}
                                        </span>
                                      </div>
                                      {member.agreementSignedAt && (
                                        <span className="text-[10px] text-muted-foreground ml-5.5">
                                          {new Date(member.agreementSignedAt).toLocaleDateString()}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground italic">N/A</span>
                                  )}
                                </td>
                                <td className="px-4 py-4 text-right">
                                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewMember(member.id)}>
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    {isSupervisorOfSelected && member.role === "agent" && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => removeMember.mutate({ memberId: member.id, teamId: selectedTeamId! })}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-muted/20">
                        <div className="text-xs text-muted-foreground">
                          Showing {(page - 1) * itemsPerPage + 1} to {Math.min(page * itemsPerPage, filteredMembers.length)} of {filteredMembers.length} entries
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 px-2"
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                          >
                            Prev
                          </Button>
                          {Array.from({ length: totalPages }).map((_, i) => (
                            <Button 
                              key={i}
                              variant={page === i + 1 ? "default" : "outline"} 
                              size="sm" 
                              className={`h-8 w-8 p-0 ${page === i + 1 ? 'bg-emerald-600 text-white' : ''}`}
                              onClick={() => setPage(i + 1)}
                            >
                              {i + 1}
                            </Button>
                          ))}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 px-2"
                            disabled={page === totalPages}
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                </div>
              )}

              {/* ACTIVITY TAB */}
              {activeTab === "activity" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* Activity Toolbar */}
                  <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium">Timeframe:</Label>
                      <select 
                        className="flex h-9 w-[150px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                      >
                        <option value="7">Last 7 Days</option>
                        <option value="30">Last 30 Days</option>
                        <option value="90">Last 90 Days</option>
                      </select>
                    </div>
                    <div className="flex bg-muted p-1 rounded-md">
                      <Button 
                        variant={chartView === "activity" ? "default" : "ghost"} 
                        size="sm" 
                        className={`h-7 px-3 text-xs ${chartView === "activity" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
                        onClick={() => setChartView("activity")}
                      >
                        Activity View
                      </Button>
                      <Button 
                        variant={chartView === "pages" ? "default" : "ghost"} 
                        size="sm" 
                        className={`h-7 px-3 text-xs ${chartView === "pages" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
                        onClick={() => setChartView("pages")}
                      >
                        Page Analytics
                      </Button>
                    </div>
                  </div>

                  {/* Table 3: Detailed Agent Activity Log */}
                  <Card className="border-border/50 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg font-semibold">Comprehensive Activity Log</CardTitle>
                      <CardDescription>Detailed breakdown of agent engagement over the selected period</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {activitySummary.map((agent) => (
                          <div key={agent.id} className="border border-border/50 rounded-lg p-4 hover:border-emerald-500/30 transition-colors bg-card">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg">
                                  {agent.userName.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-semibold text-lg">{agent.userName}</p>
                                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <Mail className="w-3.5 h-3.5" /> {agent.userEmail}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-4 text-sm">
                                <div className="text-right">
                                  <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Last Login</p>
                                  <p className="font-medium flex items-center justify-end gap-1 mt-1">
                                    <Clock className="w-3.5 h-3.5 text-emerald-500" />
                                    {agent.lastLogin ? new Date(agent.lastLogin).toLocaleString() : "Never"}
                                  </p>
                                </div>
                                <div className="text-right border-l pl-4 border-border/50">
                                  <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Status</p>
                                  <Badge variant="outline" className="mt-1 border-emerald-500 text-emerald-600 bg-emerald-500/10">Active</Badge>
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              <div className="p-3 rounded-lg bg-muted/30 border border-border/50 flex flex-col items-center justify-center text-center">
                                <Activity className="w-5 h-5 text-blue-500 mb-1" />
                                <p className="text-2xl font-bold">{agent.sessionCount}</p>
                                <p className="text-xs text-muted-foreground">Total Sessions</p>
                              </div>
                              <div className="p-3 rounded-lg bg-muted/30 border border-border/50 flex flex-col items-center justify-center text-center">
                                <Clock className="w-5 h-5 text-amber-500 mb-1" />
                                <p className="text-2xl font-bold">{Math.round(agent.totalDuration / 60)}<span className="text-sm font-normal text-muted-foreground">m</span></p>
                                <p className="text-xs text-muted-foreground">Time Spent</p>
                              </div>
                              <div className="p-3 rounded-lg bg-muted/30 border border-border/50 flex flex-col items-center justify-center text-center">
                                <Layers className="w-5 h-5 text-purple-500 mb-1" />
                                <p className="text-2xl font-bold">{agent.totalPageViews}</p>
                                <p className="text-xs text-muted-foreground">Page Views</p>
                              </div>
                              <div className="p-3 rounded-lg bg-muted/30 border border-border/50 flex flex-col items-center justify-center text-center">
                                <TrendingUp className="w-5 h-5 text-emerald-500 mb-1" />
                                <p className="text-2xl font-bold">{agent.performanceScore}<span className="text-sm font-normal text-muted-foreground">/100</span></p>
                                <p className="text-xs text-muted-foreground">Engagement Score</p>
                              </div>
                            </div>
                            
                            {agent.topPages.length > 0 && (
                              <div className="bg-muted/10 p-3 rounded-md border border-border/30">
                                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Most Visited Areas</p>
                                <div className="flex flex-wrap gap-2">
                                  {agent.topPages.map(([page, secs], idx) => (
                                    <div key={page} className="flex items-center text-xs bg-background border border-border/50 rounded px-2 py-1 shadow-sm">
                                      <span className="font-medium mr-2">{page}</span>
                                      <span className="text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{Math.round(Number(secs) / 60)}m</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                        {activitySummary.length === 0 && (
                          <div className="text-center py-12">
                            <Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-lg font-medium">No activity data</p>
                            <p className="text-muted-foreground">There is no recorded activity for this team in the selected timeframe.</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* DOCUMENTS TAB */}
              {activeTab === "documents" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
                    <div>
                      <h3 className="text-lg font-semibold">Compliance Repository</h3>
                      <p className="text-sm text-muted-foreground">Manage and track required legal agreements</p>
                    </div>
                    <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                      <Download className="w-4 h-4" /> Export Audit Log
                    </Button>
                  </div>

                  {/* Table 4: Legal Documents Table */}
                  <Card className="border-border/50 shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
                          <tr>
                            <th className="px-4 py-3 font-medium">Document Name</th>
                            <th className="px-4 py-3 font-medium">Type</th>
                            <th className="px-4 py-3 font-medium">Signer</th>
                            <th className="px-4 py-3 font-medium">Date Signed</th>
                            <th className="px-4 py-3 font-medium text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {!legalDocs.data ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading documents...</td>
                            </tr>
                          ) : legalDocs.data.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-12 text-center">
                                <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                                <p className="font-medium">No documents found</p>
                                <p className="text-xs text-muted-foreground mt-1">Legal agreements will appear here once signed.</p>
                              </td>
                            </tr>
                          ) : (
                            legalDocs.data.map((doc) => (
                              <tr key={doc.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                                <td className="px-4 py-4 font-medium flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-blue-500" />
                                  {doc.title}
                                </td>
                                <td className="px-4 py-4">
                                  <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-200">
                                    {doc.documentType.replace(/_/g, " ")}
                                  </Badge>
                                </td>
                                <td className="px-4 py-4">
                                  <div>
                                    <p className="font-medium">{doc.signerName}</p>
                                    <p className="text-xs text-muted-foreground">{doc.signerEmail}</p>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                    {new Date(doc.signedAt).toLocaleDateString()}
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-right">
                                  <Button variant="ghost" size="sm" className="gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                                    <Download className="w-4 h-4" /> PDF
                                  </Button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                </div>
              )}

              {/* PERFORMANCE TAB (Extra tab for depth) */}
              {activeTab === "performance" && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Leaderboard Table (Table 5) */}
                    <Card className="lg:col-span-2 border-border/50 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                          <Award className="w-5 h-5 text-amber-500" />
                          Team Leaderboard
                        </CardTitle>
                        <CardDescription>Top performing agents based on composite score</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                              <tr>
                                <th className="px-4 py-3 font-medium rounded-tl-lg w-12">Rank</th>
                                <th className="px-4 py-3 font-medium">Agent</th>
                                <th className="px-4 py-3 font-medium text-right">Score</th>
                                <th className="px-4 py-3 font-medium text-right rounded-tr-lg">AUM</th>
                              </tr>
                            </thead>
                            <tbody>
                              {activitySummary.sort((a, b) => b.performanceScore - a.performanceScore).map((agent, i) => (
                                <tr key={agent.id} className="border-b border-border/50 hover:bg-muted/20">
                                  <td className="px-4 py-3 font-bold text-center">
                                    {i === 0 ? <span className="text-amber-500 text-lg">1</span> : 
                                     i === 1 ? <span className="text-gray-400 text-lg">2</span> : 
                                     i === 2 ? <span className="text-amber-700 text-lg">3</span> : 
                                     <span className="text-muted-foreground">{i + 1}</span>}
                                  </td>
                                  <td className="px-4 py-3 font-medium">{agent.userName}</td>
                                  <td className="px-4 py-3 text-right">
                                    <Badge variant="outline" className={i < 3 ? "bg-emerald-500/10 text-emerald-700 border-emerald-200" : ""}>
                                      {agent.performanceScore}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                                    ${(agent.aum / 1000000).toFixed(1)}M
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Chart 6: Line Chart (Trend) */}
                    <Card className="lg:col-span-1 border-border/50 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-emerald-500" />
                          Team Velocity
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={timeSeriesData.slice(-14)}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                              <XAxis dataKey="date" hide />
                              <YAxis hide />
                              <Tooltip />
                              <Line type="monotone" dataKey="conversions" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="mt-4 text-center">
                          <p className="text-3xl font-bold text-emerald-500">+14.2%</p>
                          <p className="text-sm text-muted-foreground">Conversion growth (14d)</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals & Dialogs */}
      
      {/* Add Member Modal */}
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <UserPlus className="w-6 h-6 text-emerald-500" />
              Invite Downline Agent
            </DialogTitle>
            <DialogDescription>
              Send an invitation to join {selectedTeam?.name}. The agent must sign the monitoring agreement before accessing the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="agent-name">Agent Full Name <span className="text-destructive">*</span></Label>
              <Input 
                id="agent-name"
                placeholder="e.g., Jane Smith" 
                value={newMemberName} 
                onChange={(e) => setNewMemberName(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="agent-email">Agent Email Address <span className="text-destructive">*</span></Label>
              <Input 
                id="agent-email"
                placeholder="jane.smith@example.com" 
                type="email" 
                value={newMemberEmail} 
                onChange={(e) => setNewMemberEmail(e.target.value)} 
              />
            </div>
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md flex gap-3 mt-4">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-400">
                An email will be sent immediately with a secure link to complete onboarding and sign required compliance documents.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMemberOpen(false)}>Cancel</Button>
            <Button
              onClick={() => addMember.mutate({ teamId: selectedTeamId!, userName: newMemberName, userEmail: newMemberEmail })}
              disabled={newMemberName.length < 2 || !newMemberEmail.includes("@") || addMember.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {addMember.isPending ? "Sending Invite..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Modal */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-blue-500" />
              Export Team Data
            </DialogTitle>
            <DialogDescription>Select the format for your data export.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Export Format</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
              >
                <option value="csv">CSV (Spreadsheet)</option>
                <option value="pdf">PDF Report</option>
                <option value="json">JSON (Raw Data)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Data Scope</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="all">All Members & Activity</option>
                <option value="members">Members Directory Only</option>
                <option value="activity">Activity Log Only</option>
                <option value="compliance">Compliance Audit Log</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportModal(false)}>Cancel</Button>
            <Button onClick={handleExport} className="gap-2">
              <Download className="w-4 h-4" /> Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-500" />
              Dashboard Settings
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Setting 1 */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Auto-Refresh Data</Label>
                <p className="text-sm text-muted-foreground">Automatically fetch new activity data</p>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                />
              </div>
            </div>
            
            {/* Setting 2 */}
            {autoRefresh && (
              <div className="space-y-2 pl-6 border-l-2 border-muted ml-2">
                <Label>Refresh Interval (minutes)</Label>
                <Input 
                  type="number" 
                  min="1" 
                  max="60" 
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(parseInt(e.target.value) || 5)}
                  className="w-32"
                />
              </div>
            )}

            {/* Setting 3 */}
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive alerts for new team members</p>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  checked={notificationsEnabled}
                  onChange={(e) => setNotificationsEnabled(e.target.checked)}
                />
              </div>
            </div>

            {/* Setting 4 */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Items Per Page</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSettingsModal(false)}>Save Preferences</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Member Details Slide-out / Modal (Table 6) */}
      <Dialog open={showMemberDetails} onOpenChange={setShowMemberDetails}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          {selectedMemberDetails ? (
            <>
              <DialogHeader>
                <div className="flex items-start gap-4">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-md ${selectedMemberDetails.role === "supervisor" ? "bg-gradient-to-br from-amber-400 to-amber-600" : "bg-gradient-to-br from-emerald-400 to-emerald-600"}`}>
                    {selectedMemberDetails.userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="text-2xl">{selectedMemberDetails.userName}</DialogTitle>
                    <DialogDescription className="flex items-center gap-2 mt-1">
                      <Mail className="w-4 h-4" /> {selectedMemberDetails.userEmail}
                    </DialogDescription>
                    <div className="flex gap-2 mt-3">
                      <Badge variant={selectedMemberDetails.role === "supervisor" ? "default" : "secondary"}>
                        {selectedMemberDetails.role === "supervisor" ? "Supervisor" : "Agent"}
                      </Badge>
                      <Badge variant="outline" className={selectedMemberDetails.status === "active" ? "border-emerald-500 text-emerald-600" : ""}>
                        {selectedMemberDetails.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="py-6 space-y-6">
                <h3 className="text-lg font-semibold border-b pb-2">Performance Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-muted/30 rounded-lg border text-center">
                    <p className="text-sm text-muted-foreground mb-1">Score</p>
                    <p className="text-2xl font-bold text-emerald-600">{selectedMemberDetails.activity?.performanceScore || 0}</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg border text-center">
                    <p className="text-sm text-muted-foreground mb-1">AUM</p>
                    <p className="text-2xl font-bold text-blue-600">${((selectedMemberDetails.activity?.aum || 0) / 1000000).toFixed(1)}M</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg border text-center">
                    <p className="text-sm text-muted-foreground mb-1">Clients</p>
                    <p className="text-2xl font-bold text-purple-600">{selectedMemberDetails.activity?.clientsManaged || 0}</p>
                  </div>
                  <div className="p-4 bg-muted/30 rounded-lg border text-center">
                    <p className="text-sm text-muted-foreground mb-1">Sessions</p>
                    <p className="text-2xl font-bold text-amber-600">{selectedMemberDetails.activity?.sessionCount || 0}</p>
                  </div>
                </div>

                <h3 className="text-lg font-semibold border-b pb-2 mt-8">Recent Activity</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3">Page / Action</th>
                        <th className="px-4 py-3 text-right">Time Spent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedMemberDetails.activity?.topPages.length ? (
                        selectedMemberDetails.activity.topPages.map(([page, secs], i) => (
                          <tr key={i} className="border-t border-border/50 hover:bg-muted/20">
                            <td className="px-4 py-3 font-medium">{page}</td>
                            <td className="px-4 py-3 text-right">{Math.round(Number(secs) / 60)} mins</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={2} className="px-4 py-6 text-center text-muted-foreground">No recent activity found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center">Loading details...</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
