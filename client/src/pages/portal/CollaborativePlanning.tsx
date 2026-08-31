// @ts-nocheck
import { useState, useEffect, useMemo, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import { ExportToSlides } from "@/components/ExportToSlides";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import {
  Users,
  MessageSquare,
  FileText,
  CheckCircle2,
  Clock,
  Plus,
  Send,
  Paperclip,
  CalendarDays,
  ClipboardList,
  ArrowRight,
  TrendingUp,
  Shield,
  PieChartIcon,
  BarChart3,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  MoreVertical,
  Download,
  Upload,
  Briefcase,
  Zap,
  Target,
  Activity,
} from "lucide-react";

interface PlanningTask {
  id: string;
  title: string;
  assignee: string;
  status: "pending" | "in-progress" | "completed" | "blocked";
  priority: "high" | "medium" | "low";
  dueDate: string;
  notes: string;
  category: string;
  tags: string[];
  estimatedHours: number;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  email: string;
  phone: string;
  department: string;
  status: "online" | "offline" | "busy";
}

interface Note {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  type: "note" | "decision" | "action-item" | "question" | "milestone";
  attachments?: string[];
  replies?: Note[];
}

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  uploadDate: string;
  status: "verified" | "pending" | "rejected";
}

const TEAM_MEMBERS: TeamMember[] = [
  { id: "1", name: "Lead Advisor", role: "Financial Advisor", avatar: "LA", email: "la@russellcap.com", phone: "555-0101", department: "Wealth Management", status: "online" },
  { id: "2", name: "Tax Specialist", role: "CPA / Tax Advisor", avatar: "TS", email: "ts@russellcap.com", phone: "555-0102", department: "Tax Planning", status: "busy" },
  { id: "3", name: "Estate Attorney", role: "Estate Planning", avatar: "EA", email: "ea@russellcap.com", phone: "555-0103", department: "Legal", status: "offline" },
  { id: "4", name: "Insurance Specialist", role: "IUL / Annuity Expert", avatar: "IS", email: "is@russellcap.com", phone: "555-0104", department: "Insurance", status: "online" },
  { id: "5", name: "Client", role: "Plan Participant", avatar: "CL", email: "client@example.com", phone: "555-0105", department: "Client", status: "online" },
  { id: "6", name: "Analyst", role: "Financial Analyst", avatar: "AN", email: "an@russellcap.com", phone: "555-0106", department: "Research", status: "online" },
];

const DEFAULT_TASKS: PlanningTask[] = [{ id: "1", title: "Complete risk tolerance assessment", assignee: "Lead Advisor", status: "completed", priority: "high", dueDate: "2026-03-15", notes: "Score: 65 - Moderate", category: "Discovery", tags: ["Risk", "Onboarding"], estimatedHours: 2 },
,
  { id: "2", title: "Gather tax returns (last 3 years)", assignee: "Tax Specialist", status: "completed", priority: "high", dueDate: "2026-03-20", notes: "2023-2025 returns received", category: "Discovery", tags: ["Tax", "Documents"], estimatedHours: 4 },
,
  { id: "3", title: "Review existing insurance policies", assignee: "Insurance Specialist", status: "in-progress", priority: "high", dueDate: "2026-04-01", notes: "Term policy expiring 2028, no permanent coverage", category: "Analysis", tags: ["Insurance", "Review"], estimatedHours: 5 },
,
  { id: "4", title: "Estate plan review", assignee: "Estate Attorney", status: "pending", priority: "medium", dueDate: "2026-04-15", notes: "Will last updated 2019", category: "Analysis", tags: ["Legal", "Review"], estimatedHours: 8 },
,
  { id: "5", title: "Roth conversion analysis", assignee: "Tax Specialist", status: "in-progress", priority: "high", dueDate: "2026-04-10", notes: "Modeling $80K/yr conversion for 10 years", category: "Strategy", tags: ["Tax", "Modeling"], estimatedHours: 6 }
];

const DEFAULT_NOTES: Note[] = [
  { id: "1", author: "Lead Advisor", content: "Initial discovery meeting completed. Client is concerned about tax burden in retirement. Current IRA balance of $1.8M will generate significant RMDs.", timestamp: "2026-03-15 10:30 AM", type: "note", replies: [{ id: "1-1", author: "Tax Specialist", content: "I'll start looking into Roth conversion strategies to mitigate the RMD impact.", timestamp: "2026-03-15 11:15 AM", type: "note" }] },
  { id: "2", author: "Tax Specialist", content: "DECISION: Recommend Roth conversion ladder of $80K/year for next 10 years. This keeps client in 24% bracket while converting.", timestamp: "2026-03-22 2:15 PM", type: "decision" },
  { id: "3", author: "Insurance Specialist", content: "ACTION: Request IUL illustration from carrier - $40K premium, 15-year funding period, S&P 500 index strategy.", timestamp: "2026-03-25 11:00 AM", type: "action-item" },
  { id: "4", author: "Estate Attorney", content: "QUESTION: Does client want to include business succession planning in the estate plan? Business valued at ~$6M.", timestamp: "2026-03-28 3:45 PM", type: "question" },
  { id: "5", author: "Lead Advisor", content: "MILESTONE: Discovery phase officially complete. All documents gathered and initial analysis underway.", timestamp: "2026-03-30 09:00 AM", type: "milestone" },
];

const DOCUMENTS: Document[] = [
  { id: "1", name: "2025_Tax_Return_Draft.pdf", type: "PDF", size: "4.2 MB", uploadedBy: "Client", uploadDate: "2026-03-18", status: "verified" },
  { id: "2", name: "Current_Will_2019.pdf", type: "PDF", size: "1.8 MB", uploadedBy: "Client", uploadDate: "2026-03-19", status: "verified" },
  { id: "3", name: "Term_Life_Policy_Summary.docx", type: "Word", size: "500 KB", uploadedBy: "Insurance Specialist", uploadDate: "2026-03-22", status: "verified" },
  { id: "4", name: "Business_Valuation_Report.pdf", type: "PDF", size: "8.5 MB", uploadedBy: "Analyst", uploadDate: "2026-04-02", status: "pending" },
  { id: "5", name: "Risk_Questionnaire_Results.pdf", type: "PDF", size: "1.2 MB", uploadedBy: "Lead Advisor", uploadDate: "2026-03-15", status: "verified" },
];

const TASK_COMPLETION_DATA = [
  { name: 'Week 1', completed: 2, added: 5 },
  { name: 'Week 2', completed: 4, added: 2 },
  { name: 'Week 3', completed: 6, added: 3 },
  { name: 'Week 4', completed: 8, added: 1 },
  { name: 'Week 5', completed: 10, added: 4 },
];

const RESOURCE_ALLOCATION_DATA = [
  { name: 'Lead Advisor', hours: 25 },
  { name: 'Tax Specialist', hours: 18 },
  { name: 'Estate Attorney', hours: 15 },
  { name: 'Insurance Specialist', hours: 12 },
  { name: 'Analyst', hours: 20 },
];

const CATEGORY_DISTRIBUTION_DATA = [
  { name: 'Discovery', value: 20 },
  { name: 'Analysis', value: 35 },
  { name: 'Strategy', value: 25 },
  { name: 'Implementation', value: 15 },
  { name: 'Ongoing', value: 5 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const RISK_ASSESSMENT_DATA = [
  { subject: 'Market Risk', A: 80, fullMark: 100 },
  { subject: 'Inflation Risk', A: 65, fullMark: 100 },
  { subject: 'Longevity Risk', A: 90, fullMark: 100 },
  { subject: 'Tax Risk', A: 85, fullMark: 100 },
  { subject: 'Sequence Risk', A: 70, fullMark: 100 },
  { subject: 'Liquidity Risk', A: 50, fullMark: 100 },
];

const PORTFOLIO_PROJECTION_DATA = [
  { year: 2026, conservative: 1800000, moderate: 1800000, aggressive: 1800000 },
  { year: 2031, conservative: 2100000, moderate: 2400000, aggressive: 2800000 },
  { year: 2036, conservative: 2450000, moderate: 3100000, aggressive: 4200000 },
  { year: 2041, conservative: 2800000, moderate: 4000000, aggressive: 6100000 },
  { year: 2046, conservative: 3200000, moderate: 5100000, aggressive: 8800000 },
];

const STATUS_COLORS = {
  pending: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  "in-progress": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  blocked: "bg-red-500/20 text-red-400 border-red-500/30",
};

const PRIORITY_COLORS = {
  high: "bg-red-500/20 text-red-400 border-red-500/30",
  medium: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  low: "bg-green-500/20 text-green-400 border-green-500/30",
};

const NOTE_ICONS = {
  note: <MessageSquare className="h-4 w-4" />,
  decision: <CheckCircle2 className="h-4 w-4 text-green-400" />,
  "action-item": <ArrowRight className="h-4 w-4 text-blue-400" />,
  question: <AlertCircle className="h-4 w-4 text-amber-400" />,
  milestone: <Target className="h-4 w-4 text-purple-400" />,
};

export default function CollaborativePlanning() {
  const { user } = useAuth();
  
  const { data: clientsData } = trpc.clients.list.useQuery(undefined, { enabled: false });
  const { data: notesData } = trpc.notes.list.useQuery(undefined, { enabled: false });
  const { data: activityData } = trpc.activity.recent.useQuery(undefined, { enabled: false });
  const { data: dashboardData } = trpc.dashboard.summary.useQuery(undefined, { enabled: false });
  const { data: tasksData } = trpc.tasks?.list?.useQuery(undefined, { enabled: false }) || { data: undefined };

  const [tasks, setTasks] = useState<PlanningTask[]>(DEFAULT_TASKS);
  const [notes, setNotes] = useState<Note[]>(DEFAULT_NOTES);
  const [newNote, setNewNote] = useState("");
  const [noteType, setNoteType] = useState<Note["type"]>("note");
  const [noteAuthor, setNoteAuthor] = useState("Lead Advisor");
  const [clientName, setClientName] = useState("Johnson Family");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [selectedTask, setSelectedTask] = useState<PlanningTask | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const updateTaskStatus = useCallback((id: string, status: PlanningTask["status"]) => {
    setTasks(prev => prev.map((t) => t.id === id ? { ...t, status } : t));
  }, []);

  const addNote = useCallback(() => {
    if (!newNote.trim()) return;
    const note: Note = {
      id: Date.now().toString(),
      author: noteAuthor,
      content: newNote,
      timestamp: new Date().toLocaleString(),
      type: noteType,
    };
    setNotes(prev => [...prev, note]);
    setNewNote("");
  }, [newNote, noteAuthor, noteType]);

  const toggleTaskPriority = (id: string) => {
    setTasks(prev => prev.map((t) => {
      if (t.id !== id) return t;
      const nextPriority = t.priority === "low" ? "medium" : t.priority === "medium" ? "high" : "low";
      return { ...t, priority: nextPriority };
    }));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter((t) => t.id !== id));
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            task.assignee.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === "all" || task.status === filterStatus;
      const matchesCategory = filterCategory === "all" || task.category === filterCategory;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [tasks, searchQuery, filterStatus, filterCategory]);

  const tasksByCategory = useMemo(() => {
    return filteredTasks.reduce((acc, task) => {
      if (!acc[task.category]) acc[task.category] = [];
      acc[task.category].push(task);
      return acc;
    }, {} as Record<string, PlanningTask[]>);
  }, [filteredTasks]);

  const categories = useMemo(() => Array.from(new Set(tasks.map((t) => t.category))), [tasks]);
  
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const progressPercent = Math.round((completedCount / tasks.length) * 100) || 0;
  
  const totalEstimatedHours = tasks.reduce((sum, task) => sum + task.estimatedHours, 0);
  const completedHours = tasks.filter((t) => t.status === "completed").reduce((sum, task) => sum + task.estimatedHours, 0);

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <AppShell>
      <div className="space-y-6 p-6 max-w-[1600px] mx-auto">
        {/* Header Section */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between bg-card p-6 rounded-xl border shadow-sm">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Collaborative Planning Workspace</h1>
              <p className="text-muted-foreground mt-1 flex items-center gap-2">
                <Briefcase className="h-4 w-4" /> Multi-advisor planning with shared notes, task tracking, and team coordination
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                value={clientName} 
                onChange={(e) => setClientName(e.target.value)} 
                className="pl-9 w-full font-medium" 
                placeholder="Client Name..." 
              />
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
              <ExportToSlides
                toolName="Collaborative Planning Workspace"
                getSections={() => [
                  {
                    title: "Plan Overview",
                    items: [
                      { label: "Client", value: clientName },
                      { label: "Progress", value: `${progressPercent}%` },
                      { label: "Completed Tasks", value: `${completedCount}/${tasks.length}` },
                      { label: "Total Notes", value: notes.length.toString() },
                      { label: "Decisions Made", value: notes.filter((n) => n.type === "decision").length.toString() }
                    ]
                  }
                ]}
              />
            </div>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-primary">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Overall Progress</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-bold">{progressPercent}%</h3>
                  <span className="text-sm text-muted-foreground">({completedCount}/{tasks.length} tasks)</span>
                </div>
                <Progress value={progressPercent} className="h-2 mt-3" />
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <Activity className="h-6 w-6 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Active Team</p>
                <h3 className="text-3xl font-bold">{TEAM_MEMBERS.length}</h3>
                <div className="flex -space-x-2 mt-2">
                  {TEAM_MEMBERS.slice(0, 4).map((m) => (
                    <div key={m.id} className="w-7 h-7 rounded-full bg-blue-500/20 border-2 border-background flex items-center justify-center text-[10px] font-bold text-blue-700" title={`${m.name} - ${m.role}`}>
                      {m.avatar}
                    </div>
                  ))}
                  {TEAM_MEMBERS.length > 4 && (
                    <div className="w-7 h-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-bold">
                      +{TEAM_MEMBERS.length - 4}
                    </div>
                  )}
                </div>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-full">
                <Users className="h-6 w-6 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-green-500">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Decisions Made</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-bold">{notes.filter((n) => n.type === "decision").length}</h3>
                  <span className="text-sm text-muted-foreground">/ {notes.length} notes</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" /> +2 this week
                </p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-amber-500">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Time Logged</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-bold">{completedHours}h</h3>
                  <span className="text-sm text-muted-foreground">/ {totalEstimatedHours}h est.</span>
                </div>
                <Progress value={(completedHours / totalEstimatedHours) * 100} className="h-2 mt-3 bg-amber-100 [&>div]:bg-amber-500" />
              </div>
              <div className="p-3 bg-amber-500/10 rounded-full">
                <Clock className="h-6 w-6 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="bg-card p-1 rounded-lg border inline-flex w-full overflow-x-auto scrollbar-hide">
            <TabsList className="flex flex-nowrap w-full justify-start h-auto bg-transparent p-0">
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-muted px-6 py-2.5 rounded-md whitespace-nowrap">
                <BarChart3 className="h-4 w-4 mr-2" /> Dashboard
              </TabsTrigger>
              <TabsTrigger value="tasks" className="data-[state=active]:bg-muted px-6 py-2.5 rounded-md whitespace-nowrap">
                <ClipboardList className="h-4 w-4 mr-2" /> Task Board
              </TabsTrigger>
              <TabsTrigger value="notes" className="data-[state=active]:bg-muted px-6 py-2.5 rounded-md whitespace-nowrap">
                <MessageSquare className="h-4 w-4 mr-2" /> Planning Notes
              </TabsTrigger>
              <TabsTrigger value="team" className="data-[state=active]:bg-muted px-6 py-2.5 rounded-md whitespace-nowrap">
                <Users className="h-4 w-4 mr-2" /> Team View
              </TabsTrigger>
              <TabsTrigger value="timeline" className="data-[state=active]:bg-muted px-6 py-2.5 rounded-md whitespace-nowrap">
                <CalendarDays className="h-4 w-4 mr-2" /> Timeline
              </TabsTrigger>
              <TabsTrigger value="documents" className="data-[state=active]:bg-muted px-6 py-2.5 rounded-md whitespace-nowrap">
                <FileText className="h-4 w-4 mr-2" /> Documents
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6 animate-in fade-in-50 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              
              {/* Chart 1: Task Completion Trend */}
              <Card className="xl:col-span-2 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" /> Task Completion Trend
                  </CardTitle>
                  <CardDescription>Tasks completed vs added over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={TASK_COMPLETION_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorAdded" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend />
                        <Area type="monotone" dataKey="completed" stroke="#10b981" fillOpacity={1} fill="url(#colorCompleted)" name="Completed Tasks" />
                        <Area type="monotone" dataKey="added" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAdded)" name="Added Tasks" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Chart 2: Category Distribution */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5 text-primary" /> Task Distribution
                  </CardTitle>
                  <CardDescription>By planning category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={CATEGORY_DISTRIBUTION_DATA}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={renderCustomizedLabel}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {CATEGORY_DISTRIBUTION_DATA.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Chart 3: Resource Allocation */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" /> Resource Allocation
                  </CardTitle>
                  <CardDescription>Estimated hours by team member</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={RESOURCE_ALLOCATION_DATA} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                        <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis dataKey="name" type="category" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} width={100} />
                        <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="hours" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Est. Hours">
                          {RESOURCE_ALLOCATION_DATA.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Chart 4: Risk Assessment Profile */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" /> Risk Profile Analysis
                  </CardTitle>
                  <CardDescription>Client exposure across risk dimensions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={RISK_ASSESSMENT_DATA}>
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#888888', fontSize: 11 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#888888', fontSize: 10 }} />
                        <Radar name="Client Exposure" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Chart 5: Portfolio Projection */}
              <Card className="xl:col-span-2 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <LineChart className="h-5 w-5 text-primary" /> Wealth Projection Scenarios
                  </CardTitle>
                  <CardDescription>Projected portfolio value under different strategies</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={PORTFOLIO_PROJECTION_DATA} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="year" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis 
                          stroke="#888888" 
                          fontSize={12} 
                          tickLine={false} 
                          axisLine={false}
                          tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                        />
                        <Tooltip 
                          formatter={(value: number) => [`$${value.toLocaleString()}`, undefined]}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                        />
                        <Legend />
                        <Line type="monotone" dataKey="aggressive" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Aggressive Strategy" />
                        <Line type="monotone" dataKey="moderate" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Moderate Strategy" />
                        <Line type="monotone" dataKey="conservative" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Conservative Strategy" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4 animate-in fade-in-50 duration-500">
            <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-lg border shadow-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search tasks..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Briefcase className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" /> Add Task
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
              {Object.entries(tasksByCategory).map(([category, catTasks]) => (
                <Card key={category} className="shadow-sm border-t-4 border-t-primary/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold">{category}</CardTitle>
                      <Badge variant="secondary" className="font-mono">
                        {catTasks.filter((t) => t.status === "completed").length}/{catTasks.length}
                      </Badge>
                    </div>
                    <Progress 
                      value={(catTasks.filter((t) => t.status === "completed").length / catTasks.length) * 100} 
                      className="h-1 mt-2"
                    />
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0 max-h-[600px] overflow-y-auto scrollbar-thin">
                    {catTasks.length === 0 ? (
                      <div className="text-center p-4 text-muted-foreground text-sm italic">No tasks found</div>
                    ) : (
                      catTasks.map((task) => (
                        <div key={task.id} className="group flex flex-col p-4 rounded-xl border bg-card hover:border-primary/50 hover:shadow-md transition-all">
                          <div className="flex items-start gap-3">
                            <button 
                              onClick={() => {
                                const next = task.status === "pending" ? "in-progress" : task.status === "in-progress" ? "completed" : task.status === "completed" ? "pending" : "pending";
                                updateTaskStatus(task.id, next);
                              }}
                              className="mt-0.5 shrink-0 transition-transform hover:scale-110"
                            >
                              {task.status === "completed" ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : 
                               task.status === "in-progress" ? <Clock className="h-5 w-5 text-blue-500" /> : 
                               task.status === "blocked" ? <AlertCircle className="h-5 w-5 text-red-500" /> :
                               <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 hover:border-primary" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <span className={`text-sm font-semibold leading-tight ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                                  {task.title}
                                </span>
                                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleTaskPriority(task.id)}>
                                    <Zap className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteTask(task.id)}>
                                    <AlertCircle className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                <Badge variant="outline" className={`text-[10px] uppercase font-semibold px-1.5 py-0 border ${PRIORITY_COLORS[task.priority]}`}>
                                  {task.priority}
                                </Badge>
                                <Badge variant="outline" className={`text-[10px] uppercase font-semibold px-1.5 py-0 border ${STATUS_COLORS[task.status]}`}>
                                  {task.status}
                                </Badge>
                                {task.tags.map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0 bg-muted/50 text-muted-foreground">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                              
                              {task.notes && (
                                <p className="text-xs text-muted-foreground mt-2 bg-muted/30 p-2 rounded-md border border-border/50">
                                  {task.notes}
                                </p>
                              )}
                              
                              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[9px] text-primary">
                                    {TEAM_MEMBERS.find((m) => m.name === task.assignee)?.avatar || "??"}
                                  </div>
                                  {task.assignee}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                                  <CalendarDays className="h-3 w-3" />
                                  {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-6 animate-in fade-in-50 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-6">
                <Card className="shadow-sm sticky top-6">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Plus className="h-5 w-5 text-primary" /> Create Note
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Author</Label>
                      <Select value={noteAuthor} onValueChange={setNoteAuthor}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TEAM_MEMBERS.map((m) => (
                            <SelectItem key={m.id} value={m.name}>
                              <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px]">{m.avatar}</div>
                                {m.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Note Type</Label>
                      <Select value={noteType} onValueChange={v => setNoteType(v as Note["type"])}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="note"><div className="flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Note</div></SelectItem>
                          <SelectItem value="decision"><div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Decision</div></SelectItem>
                          <SelectItem value="action-item"><div className="flex items-center gap-2"><ArrowRight className="h-4 w-4 text-blue-500" /> Action Item</div></SelectItem>
                          <SelectItem value="question"><div className="flex items-center gap-2"><AlertCircle className="h-4 w-4 text-amber-500" /> Question</div></SelectItem>
                          <SelectItem value="milestone"><div className="flex items-center gap-2"><Target className="h-4 w-4 text-purple-500" /> Milestone</div></SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Content</Label>
                      <Textarea 
                        value={newNote} 
                        onChange={(e) => setNewNote(e.target.value)} 
                        placeholder="Type your planning note here..." 
                        className="min-h-[120px] resize-none" 
                      />
                    </div>
                    
                    <div className="flex items-center justify-between pt-2">
                      <Button variant="outline" size="icon" title="Attach file">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Button onClick={addNote} className="w-full ml-2">
                        <Send className="h-4 w-4 mr-2" /> Post Note
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between bg-card p-3 rounded-lg border shadow-sm">
                  <h3 className="font-semibold text-lg">Discussion Thread</h3>
                  <Badge variant="secondary">{notes.length} entries</Badge>
                </div>
                
                <div className="space-y-4">
                  {[...notes].reverse().map((note) => (
                    <Card key={note.id} className={`shadow-sm overflow-hidden border-l-4 ${
                      note.type === "decision" ? "border-l-green-500" : 
                      note.type === "question" ? "border-l-amber-500" : 
                      note.type === "action-item" ? "border-l-blue-500" : 
                      note.type === "milestone" ? "border-l-purple-500" : 
                      "border-l-muted"
                    }`}>
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold shrink-0 border border-primary/20">
                            {TEAM_MEMBERS.find((m) => m.name === note.author)?.avatar || "??"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm">{note.author}</span>
                                <Badge variant="outline" className={`text-[10px] uppercase flex items-center gap-1 bg-background ${
                                  note.type === "decision" ? "text-green-600 border-green-200" : 
                                  note.type === "question" ? "text-amber-600 border-amber-200" : 
                                  note.type === "action-item" ? "text-blue-600 border-blue-200" : 
                                  note.type === "milestone" ? "text-purple-600 border-purple-200" : ""
                                }`}>
                                  {NOTE_ICONS[note.type]}
                                  {note.type}
                                </Badge>
                              </div>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {note.timestamp}
                              </span>
                            </div>
                            
                            <div className="text-sm leading-relaxed whitespace-pre-wrap">
                              {note.content}
                            </div>
                            
                            {note.replies && note.replies.length > 0 && (
                              <div className="mt-4 pt-4 border-t space-y-3 pl-4 border-l-2 border-l-border ml-2">
                                {note.replies.map((reply) => (
                                  <div key={reply.id} className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold shrink-0">
                                      {TEAM_MEMBERS.find((m) => m.name === reply.author)?.avatar || "??"}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2 mb-0.5">
                                        <span className="font-semibold text-xs">{reply.author}</span>
                                        <span className="text-[10px] text-muted-foreground">{reply.timestamp}</span>
                                      </div>
                                      <p className="text-sm text-muted-foreground">{reply.content}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            <div className="mt-3 pt-3 flex items-center gap-2">
                              <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground">
                                <MessageSquare className="h-3 w-3 mr-1" /> Reply
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground">
                                <CheckCircle2 className="h-3 w-3 mr-1" /> Acknowledge
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Team View Tab */}
          <TabsContent value="team" className="space-y-6 animate-in fade-in-50 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {TEAM_MEMBERS.map((member) => {
                const memberTasks = tasks.filter((t) => t.assignee === member.name);
                const completed = memberTasks.filter((t) => t.status === "completed").length;
                const workload = memberTasks.reduce((sum, t) => sum + (t.status !== 'completed' ? t.estimatedHours : 0), 0);
                
                return (
                  <Card key={member.id} className="shadow-sm overflow-hidden group">
                    <div className="h-2 w-full bg-primary/20 group-hover:bg-primary/40 transition-colors" />
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-lg font-bold text-primary">
                              {member.avatar}
                            </div>
                            <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-background ${
                              member.status === 'online' ? 'bg-green-500' : 
                              member.status === 'busy' ? 'bg-amber-500' : 'bg-gray-400'
                            }`} />
                          </div>
                          <div>
                            <div className="font-bold text-lg">{member.name}</div>
                            <div className="text-sm text-muted-foreground">{member.role}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{member.department}</div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="bg-muted/50 p-2 rounded-md text-center">
                          <div className="text-xs text-muted-foreground mb-1">Tasks</div>
                          <div className="font-semibold">{completed} / {memberTasks.length}</div>
                        </div>
                        <div className="bg-muted/50 p-2 rounded-md text-center">
                          <div className="text-xs text-muted-foreground mb-1">Active Load</div>
                          <div className="font-semibold">{workload} hrs</div>
                        </div>
                      </div>

                      <Separator className="my-4" />
                      
                      <div className="space-y-2">
                        <div className="text-sm font-semibold mb-2 flex items-center justify-between">
                          Current Focus
                          <Badge variant="outline" className="text-[10px]">{memberTasks.length - completed} pending</Badge>
                        </div>
                        {memberTasks.length > 0 ? (
                          <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1 scrollbar-thin">
                            {memberTasks.filter((t) => t.status !== 'completed').slice(0, 3).map((task) => (
                              <div key={task.id} className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/30 border border-border/50">
                                <div className="flex items-center gap-2 truncate">
                                  {task.status === "in-progress" ? <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" /> : <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30 shrink-0" />}
                                  <span className="truncate text-xs font-medium">{task.title}</span>
                                </div>
                                <Badge className={`text-[9px] px-1 py-0 shrink-0 ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</Badge>
                              </div>
                            ))}
                            {memberTasks.filter((t) => t.status !== 'completed').length > 3 && (
                              <div className="text-xs text-center text-muted-foreground pt-1">
                                + {memberTasks.filter((t) => t.status !== 'completed').length - 3} more tasks
                              </div>
                            )}
                            {memberTasks.filter((t) => t.status !== 'completed').length === 0 && (
                              <div className="text-xs text-muted-foreground text-center py-2 italic">All caught up!</div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground text-center py-4 bg-muted/20 rounded-md border border-dashed">No tasks assigned</div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="p-3 bg-muted/20 border-t flex justify-between">
                      <Button variant="ghost" size="sm" className="text-xs w-full"><MessageSquare className="h-3 w-3 mr-2" /> Message</Button>
                      <Separator orientation="vertical" className="h-4" />
                      <Button variant="ghost" size="sm" className="text-xs w-full"><CalendarDays className="h-3 w-3 mr-2" /> Schedule</Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-6 animate-in fade-in-50 duration-500">
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-muted/10">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <CalendarDays className="h-5 w-5 text-primary" /> Master Planning Timeline
                    </CardTitle>
                    <CardDescription className="mt-1">Chronological view of all milestones and deadlines for {clientName}</CardDescription>
                  </div>
                  <Button variant="outline"><Download className="h-4 w-4 mr-2" /> Export PDF</Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative p-8">
                  <div className="absolute left-[120px] top-8 bottom-8 w-0.5 bg-border hidden md:block" />
                  
                  <div className="space-y-8">
                    {tasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).map((task, i) => {
                      const isPast = new Date(task.dueDate) < new Date() && task.status !== 'completed';
                      
                      return (
                        <div key={task.id} className="relative flex flex-col md:flex-row items-start gap-4 md:gap-8 group">
                          <div className="md:w-[90px] text-left md:text-right shrink-0 pt-1">
                            <div className={`text-sm font-bold ${isPast ? 'text-red-500' : ''}`}>
                              {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </div>
                            <div className="text-xs text-muted-foreground">{new Date(task.dueDate).getFullYear()}</div>
                          </div>
                          
                          <div className="hidden md:flex flex-col items-center relative z-10">
                            <div className={`w-4 h-4 rounded-full border-2 bg-background flex items-center justify-center transition-transform group-hover:scale-125 ${
                              task.status === "completed" ? "border-green-500" : 
                              task.status === "in-progress" ? "border-blue-500" : 
                              isPast ? "border-red-500" : "border-muted-foreground"
                            }`}>
                              {task.status === "completed" && <div className="w-2 h-2 rounded-full bg-green-500" />}
                              {task.status === "in-progress" && <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />}
                            </div>
                          </div>
                          
                          <div className={`flex-1 p-4 rounded-lg border shadow-sm transition-all group-hover:shadow-md ${
                            task.status === "completed" ? "bg-muted/10 border-green-500/20" : 
                            task.status === "in-progress" ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-500/30" : 
                            isPast ? "bg-red-50/50 dark:bg-red-950/20 border-red-500/30" : "bg-card hover:border-primary/30"
                          }`}>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                              <h4 className={`font-semibold ${task.status === "completed" ? "text-muted-foreground line-through" : ""}`}>
                                {task.title}
                              </h4>
                              <div className="flex gap-2">
                                <Badge variant="outline" className={`text-[10px] ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</Badge>
                                <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[task.status]}`}>{task.status}</Badge>
                              </div>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-3">{task.notes || "No additional notes provided."}</p>
                            
                            <div className="flex items-center justify-between text-xs pt-3 border-t border-border/50">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center font-bold text-[9px] text-primary">
                                  {TEAM_MEMBERS.find((m) => m.name === task.assignee)?.avatar}
                                </div>
                                <span className="font-medium">{task.assignee}</span>
                                <span className="text-muted-foreground mx-1">&bull;</span>
                                <span className="text-muted-foreground">{task.category}</span>
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-3 w-3" /> {task.estimatedHours}h
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6 animate-in fade-in-50 duration-500">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/10 pb-4">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" /> Shared Documents
                  </CardTitle>
                  <CardDescription className="mt-1">Files uploaded and verified for this planning session</CardDescription>
                </div>
                <Button><Upload className="h-4 w-4 mr-2" /> Upload File</Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b">
                      <tr>
                        <th className="px-6 py-4 font-medium">Document Name</th>
                        <th className="px-6 py-4 font-medium">Type</th>
                        <th className="px-6 py-4 font-medium">Size</th>
                        <th className="px-6 py-4 font-medium">Uploaded By</th>
                        <th className="px-6 py-4 font-medium">Date</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                        <th className="px-6 py-4 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {DOCUMENTS.map((doc) => (
                        <tr key={doc.id} className="bg-card border-b hover:bg-muted/20 transition-colors">
                          <td className="px-6 py-4 font-medium flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary/70" />
                            {doc.name}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">{doc.type}</td>
                          <td className="px-6 py-4 text-muted-foreground">{doc.size}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary">
                                {TEAM_MEMBERS.find((m) => m.name === doc.uploadedBy)?.avatar || "??"}
                              </div>
                              {doc.uploadedBy}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">{doc.uploadDate}</td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className={`text-[10px] ${
                              doc.status === 'verified' ? 'bg-green-500/10 text-green-600 border-green-200' :
                              doc.status === 'pending' ? 'bg-amber-500/10 text-amber-600 border-amber-200' :
                              'bg-red-500/10 text-red-600 border-red-200'
                            }`}>
                              {doc.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                              <AlertCircle className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        <div className="pt-8">
          <NAICDisclaimer variant="compact" />
        </div>
      </div>
    </AppShell>
  );
}
