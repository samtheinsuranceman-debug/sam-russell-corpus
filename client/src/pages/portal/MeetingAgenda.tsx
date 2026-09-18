// @ts-nocheck
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  ClipboardList,
  Clock,
  MessageSquare,
  CheckCircle,
  Download,
  Loader2,
  Mail,
  Send,
  Calendar,
  Users,
  Search,
  Filter,
  BarChart2,
  PieChart as PieChartIcon,
  Plus,
  Edit,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  Settings,
  MoreVertical,
  Activity,
  Target,
  TrendingUp,
  Briefcase,
  Video,
  Phone,
  MapPin,
  List,
  Grid,
  Maximize2,
  RefreshCw,
  Share2,
  Copy,
  Archive,
  Star,
  Zap,
  Tag as TagIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
  Legend
} from "recharts";

const MEETING_STATS = [
  { name: "Strategy", value: 45 },
  { name: "Initial", value: 25 },
  { name: "Annual", value: 20 },
  { name: "Delivery", value: 10 },
];

const MONTHLY_TRENDS = [{ month: "Jan", meetings: 12, avgDuration: 45, satisfaction: 4.2 },
,
  { month: "Feb", meetings: 19, avgDuration: 50, satisfaction: 4.5 },
,
  { month: "Mar", meetings: 15, avgDuration: 55, satisfaction: 4.3 },
,
  { month: "Apr", meetings: 22, avgDuration: 60, satisfaction: 4.7 },
,
  { month: "May", meetings: 18, avgDuration: 58, satisfaction: 4.6 }
];

const TOPIC_DISTRIBUTION = [
  { subject: "Retirement", A: 120, B: 110, fullMark: 150 },
  { subject: "Tax", A: 98, B: 130, fullMark: 150 },
  { subject: "Estate", A: 86, B: 130, fullMark: 150 },
  { subject: "Investment", A: 99, B: 100, fullMark: 150 },
  { subject: "Insurance", A: 85, B: 90, fullMark: 150 },
  { subject: "Education", A: 65, B: 85, fullMark: 150 },
];

const CLIENT_ENGAGEMENT = [
  { name: "Q1", high: 4000, medium: 2400, low: 2400 },
  { name: "Q2", high: 3000, medium: 1398, low: 2210 },
  { name: "Q3", high: 2000, medium: 9800, low: 2290 },
  { name: "Q4", high: 2780, medium: 3908, low: 2000 },
];

const SUCCESS_METRICS = [
  { name: "Week 1", rate: 85, target: 90 },
  { name: "Week 2", rate: 88, target: 90 },
  { name: "Week 3", rate: 92, target: 90 },
  { name: "Week 4", rate: 95, target: 90 },
  { name: "Week 5", rate: 91, target: 90 },
];

const COLORS = ["#22c55e", "#f0c040", "#3b82f6", "#ef4444", "#a855f7", "#ec4899"];

export default function MeetingAgenda() {
  const { user } = useAuth();
  
  const [clientId, setClientId] = useState<number | null>(null);
  const [meetingType, setMeetingType] = useState("strategy_review");
  const [duration, setDuration] = useState<number>(60);
  const [emailRecipient, setEmailRecipient] = useState("");
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"setup" | "stats" | "history" | "templates" | "settings">("setup");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customTopic, setCustomTopic] = useState("");
  const [customTopicsList, setCustomTopicsList] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [includeFinancials, setIncludeFinancials] = useState(true);
  const [includeActionItems, setIncludeActionItems] = useState(true);
  const [meetingLocation, setMeetingLocation] = useState("virtual");
  const [attendees, setAttendees] = useState<string[]>([]);
  const [newAttendee, setNewAttendee] = useState("");
  const [agendaTitle, setAgendaTitle] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedBlocks, setEditedBlocks] = useState<any[]>([]);
  const [chartView, setChartView] = useState<"monthly" | "quarterly">("monthly");
  const [dateRange, setDateRange] = useState("ytd");
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [filterType, setFilterType] = useState("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [hoveredData, setHoveredData] = useState<any>(null);

  const { data: clients } = trpc.clients.list.useQuery();
  const { data: recentMeetings, refetch: refetchMeetings } = trpc.meetings.list.useQuery({ limit: 10 });
  const { data: templates } = trpc.docs.listTemplates.useQuery();
  const { data: teamMembers } = trpc.team.members.useQuery();
  const { data: userStats } = trpc.dashboard.stats.useQuery();
  const { data: tags } = trpc.tags.list.useQuery();
  
  const generateMut = trpc.meetingAgenda.generate.useMutation();
  const exportPdfMut = trpc.meetingAgenda.exportPdf.useMutation({
    onSuccess: (data) => {
      window.open(data.url, "_blank");
      toast.success("Agenda PDF exported!");
    },
    onError: () => toast.error("Failed to export PDF"),
  });

  const emailAgendaMut = trpc.meetingAgenda.emailAgenda.useMutation({
    onSuccess: () => {
      toast.success("Agenda emailed successfully!");
      setEmailDialogOpen(false);
      setEmailRecipient("");
    },
    onError: () => toast.error("Failed to send email"),
  });

  const saveTemplateMut = trpc.docs.saveTemplate.useMutation({
    onSuccess: () => toast.success("Template saved!"),
  });

  const updateMeetingMut = trpc.meetings.update.useMutation({
    onSuccess: () => {
      toast.success("Meeting updated!");
      refetchMeetings();
    }
  });

  useEffect(() => {
    if (clientId && clients) {
      const client = clients.find((c) => c.id === clientId);
      if (client && client.email) {
        setEmailRecipient(client.email);
      }
    }
  }, [clientId, clients]);

  useEffect(() => {
    if (generateMut.data) {
      setEditedBlocks(generateMut.data.blocks || []);
      setAgendaTitle(generateMut.data.title || `${meetingType.replace(/_/g, " ")} Meeting`);
    }
  }, [generateMut.data, meetingType]);

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    if (!searchQuery) return clients;
    return clients.filter((c) => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [clients, searchQuery]);

  const filteredMeetings = useMemo(() => {
    if (!recentMeetings) return [];
    let result = [...recentMeetings];
    if (filterType !== "all") {
      result = result.filter((m) => m.type === filterType);
    }
    if (sortOrder === "asc") {
      result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else {
      result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return result;
  }, [recentMeetings, filterType, sortOrder]);

  const handleAddCustomTopic = useCallback(() => {
    if (customTopic.trim() && !customTopicsList.includes(customTopic.trim())) {
      setCustomTopicsList(prev => [...prev, customTopic.trim()]);
      setCustomTopic("");
    }
  }, [customTopic, customTopicsList]);

  const handleRemoveCustomTopic = useCallback((topic: string) => {
    setCustomTopicsList(prev => prev.filter((t) => t !== topic));
  }, []);

  const handleAddAttendee = useCallback(() => {
    if (newAttendee.trim() && !attendees.includes(newAttendee.trim())) {
      setAttendees(prev => [...prev, newAttendee.trim()]);
      setNewAttendee("");
    }
  }, [newAttendee, attendees]);

  const handleRemoveAttendee = useCallback((attendee: string) => {
    setAttendees(prev => prev.filter((a) => a !== attendee));
  }, []);

  const toggleSection = useCallback((section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  }, []);

  const runGenerate = () => {
    if (!clientId) { toast.error("Select a client"); return; }
    setIsGenerating(true);
    generateMut.mutate(
      { 
        clientId, 
        meetingType, 
        duration,
        customTopics: customTopicsList,
        priority,
        includeFinancials
      },
      {
        onSettled: () => setIsGenerating(false),
        onSuccess: () => toast.success("Agenda generated successfully!")
      }
    );
  };

  const handleExportPdf = () => {
    const agenda = generateMut.data;
    if (!agenda) return;
    exportPdfMut.mutate({
      title: agendaTitle || agenda.title || `${meetingType.replace(/_/g, " ")} Meeting`,
      clientName: agenda.clientName,
      meetingType: agenda.meetingType,
      duration: agenda.duration,
      blocks: isEditing ? editedBlocks : (agenda.blocks ?? []),
      keyQuestions: agenda.keyQuestions,
      followUpActions: agenda.followUpActions,
    });
  };

  const handleEmailAgenda = () => {
    const agenda = generateMut.data;
    if (!emailRecipient || !exportPdfMut.data?.url) {
      toast.error("Please generate and export the agenda first");
      return;
    }
    emailAgendaMut.mutate({
      pdfUrl: exportPdfMut.data.url,
      clientEmail: emailRecipient,
      clientName: agenda?.clientName ?? "Client",
      agendaTitle: agendaTitle || (agenda?.title ?? "Meeting Agenda"),
    });
  };

  const saveAsTemplate = () => {
    if (!generateMut.data) return;
    saveTemplateMut.mutate({
      name: `${meetingType} Template - ${new Date().toLocaleDateString()}`,
      content: JSON.stringify(generateMut.data),
      type: "agenda"
    });
  };

  const renderSetupTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Setup */}
      <div className="lg:col-span-4 space-y-6">
        <div className="rc-card">
          <div className="mb-4 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-white">Meeting Details</h2>
              <p className="text-sm text-[#7a95b8]">Configure your upcoming meeting</p>
            </div>
            <button 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-[#3b82f6] hover:text-[#60a5fa] flex items-center gap-1"
            >
              {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {showAdvanced ? "Basic" : "Advanced"}
            </button>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#c8d8ec] mb-1.5">Client</label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a95b8]" />
                <input 
                  type="text" 
                  placeholder="Search clients..." 
                  className="rc-input pl-9 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {!clients ? (
                <div className="flex items-center justify-center p-4 border border-[#12233e] rounded-lg bg-[#060d19]">
                  <Loader2 className="w-5 h-5 text-[#22c55e] animate-spin" />
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto border border-[#12233e] rounded-lg bg-[#060d19] p-1 custom-scrollbar">
                  {filteredClients.length === 0 ? (
                    <div className="p-3 text-center text-sm text-[#7a95b8]">No clients found</div>
                  ) : (
                    filteredClients.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setClientId(c.id)}
                        className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between ${
                          clientId === c.id 
                            ? "bg-[#22c55e]/10 text-[#22c55e] font-medium" 
                            : "text-[#c8d8ec] hover:bg-[#12233e]"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span>{c.name}</span>
                          <span className="text-xs opacity-70">{c.email || 'No email'}</span>
                        </div>
                        {clientId === c.id && <CheckCircle className="w-4 h-4" />}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#c8d8ec] mb-1.5">Meeting Type</label>
              <div className="relative">
                <select 
                  className="rc-input w-full appearance-none pr-10"
                  value={meetingType}
                  onChange={(e) => setMeetingType(e.target.value)}
                >
                  <option value="strategy_review">Strategy Review</option>
                  <option value="initial_consultation">Initial Consultation</option>
                  <option value="annual_review">Annual Review</option>
                  <option value="policy_delivery">Policy Delivery</option>
                  <option value="roth_conversion">Roth Conversion Planning</option>
                  <option value="estate_planning">Estate Planning</option>
                  <option value="tax_optimization">Tax Optimization</option>
                  <option value="portfolio_rebalance">Portfolio Rebalance</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a95b8] pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#c8d8ec] mb-1.5">Duration (Minutes)</label>
              <div className="grid grid-cols-5 gap-2">
                {[15, 30, 45, 60, 90].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`py-2 text-sm rounded-lg border transition-all ${
                      duration === d
                        ? "border-[#22c55e] bg-[#22c55e]/10 text-[#22c55e]"
                        : "border-[#12233e] bg-[#060d19] text-[#7a95b8] hover:border-[#7a95b8]"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {showAdvanced && (
              <div className="space-y-5 pt-4 border-t border-[#12233e] animate-in slide-in-from-top-2">
                <div>
                  <label className="block text-sm font-medium text-[#c8d8ec] mb-1.5">Priority Level</label>
                  <div className="flex gap-2">
                    {(["low", "medium", "high"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setPriority(p)}
                        className={`flex-1 py-1.5 text-xs uppercase tracking-wider rounded border transition-all ${
                          priority === p
                            ? p === "high" ? "border-red-500 bg-red-500/10 text-red-500" 
                              : p === "medium" ? "border-yellow-500 bg-yellow-500/10 text-yellow-500"
                              : "border-blue-500 bg-blue-500/10 text-blue-500"
                            : "border-[#12233e] bg-[#060d19] text-[#7a95b8]"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#c8d8ec] mb-1.5">Meeting Location</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setMeetingLocation("virtual")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm rounded border ${
                        meetingLocation === "virtual" ? "border-[#3b82f6] bg-[#3b82f6]/10 text-[#3b82f6]" : "border-[#12233e] text-[#7a95b8]"
                      }`}
                    >
                      <Video className="w-4 h-4" /> Virtual
                    </button>
                    <button
                      onClick={() => setMeetingLocation("in_person")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm rounded border ${
                        meetingLocation === "in_person" ? "border-[#3b82f6] bg-[#3b82f6]/10 text-[#3b82f6]" : "border-[#12233e] text-[#7a95b8]"
                      }`}
                    >
                      <MapPin className="w-4 h-4" /> In Person
                    </button>
                    <button
                      onClick={() => setMeetingLocation("phone")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm rounded border ${
                        meetingLocation === "phone" ? "border-[#3b82f6] bg-[#3b82f6]/10 text-[#3b82f6]" : "border-[#12233e] text-[#7a95b8]"
                      }`}
                    >
                      <Phone className="w-4 h-4" /> Phone
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#c8d8ec] mb-1.5">Attendees</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={newAttendee}
                      onChange={(e) => setNewAttendee(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddAttendee()}
                      placeholder="Add attendee name..."
                      className="rc-input flex-1 text-sm py-1.5"
                    />
                    <button 
                      onClick={handleAddAttendee}
                      className="px-3 bg-[#12233e] text-white rounded hover:bg-[#1a365d] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {attendees.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {attendees.map((a) => (
                        <span key={a} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#0d1a2e] border border-[#12233e] text-xs text-[#c8d8ec]">
                          {a}
                          <button onClick={() => handleRemoveAttendee(a)} className="text-[#7a95b8] hover:text-red-400">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#c8d8ec] mb-1.5">Custom Topics</label>
                  <div className="flex gap-2 mb-2">
                    <input 
                      type="text" 
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTopic()}
                      placeholder="Add a specific topic..." 
                      className="rc-input flex-1 text-sm py-1.5"
                    />
                    <button 
                      onClick={handleAddCustomTopic}
                      className="px-3 bg-[#12233e] text-white rounded hover:bg-[#1a365d] transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {customTopicsList.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {customTopicsList.map((topic, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[#3b82f6]/10 text-[#3b82f6] text-xs border border-[#3b82f6]/20">
                          {topic}
                          <button onClick={() => handleRemoveCustomTopic(topic)} className="hover:text-red-400">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-[#c8d8ec] cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={includeFinancials}
                      onChange={(e) => setIncludeFinancials(e.target.checked)}
                      className="rounded border-[#12233e] bg-[#060d19] text-[#22c55e] focus:ring-[#22c55e]"
                    />
                    Include Financial Data
                  </label>
                  <label className="flex items-center gap-2 text-sm text-[#c8d8ec] cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={includeActionItems}
                      onChange={(e) => setIncludeActionItems(e.target.checked)}
                      className="rounded border-[#12233e] bg-[#060d19] text-[#22c55e] focus:ring-[#22c55e]"
                    />
                    Include Action Items
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#c8d8ec] mb-1.5">Internal Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Private notes not visible on exported agenda..."
                    className="rc-input w-full min-h-[80px] text-sm resize-y"
                  />
                </div>
              </div>
            )}

            <button
              onClick={runGenerate}
              disabled={!clientId || isGenerating}
              className="w-full rc-btn-primary py-3 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Agenda...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Generate Smart Agenda
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Stats Mini-card */}
        <div className="rc-card bg-gradient-to-br from-[#0d1a2e] to-[#060d19]">
          <h3 className="text-sm font-medium text-[#c8d8ec] mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#3b82f6]" /> Your Activity
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[#7a95b8]">Agendas This Week</p>
              <p className="text-xl font-bold text-white">12</p>
            </div>
            <div>
              <p className="text-xs text-[#7a95b8]">Avg Prep Time</p>
              <p className="text-xl font-bold text-white">4m</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Preview */}
      <div className="lg:col-span-8">
        {!generateMut.data ? (
          <div className="rc-card h-full flex flex-col items-center justify-center text-center p-12 min-h-[500px]">
            <div className="w-20 h-20 bg-[#12233e] rounded-full flex items-center justify-center mb-6">
              <ClipboardList className="w-10 h-10 text-[#3b82f6]" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Agenda Generated</h3>
            <p className="text-[#7a95b8] max-w-md mb-8">
              Select a client and configure the meeting details on the left, then click generate to create an AI-powered meeting agenda.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl text-left">
              <div className="p-4 border border-[#12233e] rounded-lg bg-[#060d19]">
                <Target className="w-5 h-5 text-[#22c55e] mb-2" />
                <h4 className="font-medium text-[#c8d8ec] text-sm">Smart Topics</h4>
                <p className="text-xs text-[#7a95b8] mt-1">AI analyzes client history to suggest relevant talking points.</p>
              </div>
              <div className="p-4 border border-[#12233e] rounded-lg bg-[#060d19]">
                <Clock className="w-5 h-5 text-[#f0c040] mb-2" />
                <h4 className="font-medium text-[#c8d8ec] text-sm">Time Management</h4>
                <p className="text-xs text-[#7a95b8] mt-1">Automatically allocates appropriate time blocks for each topic.</p>
              </div>
              <div className="p-4 border border-[#12233e] rounded-lg bg-[#060d19]">
                <Share2 className="w-5 h-5 text-[#a855f7] mb-2" />
                <h4 className="font-medium text-[#c8d8ec] text-sm">Easy Sharing</h4>
                <p className="text-xs text-[#7a95b8] mt-1">Export to PDF or email directly to clients with one click.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rc-card h-full flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-[#12233e]">
              <div className="flex-1">
                {isEditing ? (
                  <input
                    type="text"
                    value={agendaTitle}
                    onChange={(e) => setAgendaTitle(e.target.value)}
                    className="rc-input text-xl font-bold w-full mb-2"
                  />
                ) : (
                  <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                    {agendaTitle}
                    <button onClick={() => setIsEditing(true)} className="text-[#7a95b8] hover:text-white">
                      <Edit className="w-4 h-4" />
                    </button>
                  </h2>
                )}
                <div className="flex flex-wrap items-center gap-4 text-sm text-[#7a95b8]">
                  <span className="flex items-center gap-1.5"><Users className="w-4 h-4" /> {generateMut.data.clientName}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {generateMut.data.duration} mins</span>
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {new Date().toLocaleDateString()}</span>
                  <span className="flex items-center gap-1.5 capitalize"><TagIcon className="w-4 h-4" /> {priority}</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {isEditing ? (
                  <button onClick={() => setIsEditing(false)} className="rc-btn-secondary flex items-center gap-2">
                    <Save className="w-4 h-4" /> Save Edits
                  </button>
                ) : (
                  <>
                    <button onClick={saveAsTemplate} className="rc-btn-secondary flex items-center gap-2" title="Save as Template">
                      <Archive className="w-4 h-4" />
                    </button>
                    <button onClick={handleExportPdf} className="rc-btn-secondary flex items-center gap-2">
                      <Download className="w-4 h-4" /> PDF
                    </button>
                    <button onClick={() => setEmailDialogOpen(true)} className="rc-btn-primary flex items-center gap-2">
                      <Mail className="w-4 h-4" /> Email
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-8 custom-scrollbar">
              {/* Agenda Blocks */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <List className="w-5 h-5 text-[#3b82f6]" /> Agenda Items
                </h3>
                
                {(isEditing ? editedBlocks : generateMut.data.blocks)?.map((block: any, index: number) => (
                  <div key={index} className="p-4 rounded-lg border border-[#12233e] bg-[#060d19] hover:border-[#3b82f6]/50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#12233e] flex items-center justify-center text-[#3b82f6] font-bold text-sm">
                          {index + 1}
                        </div>
                        {isEditing ? (
                          <input
                            type="text"
                            value={block.topic}
                            onChange={(e) => {
                              const newBlocks = [...editedBlocks];
                              newBlocks[index].topic = e.target.value;
                              setEditedBlocks(newBlocks);
                            }}
                            className="rc-input font-medium"
                          />
                        ) : (
                          <h4 className="font-medium text-white text-lg">{block.topic}</h4>
                        )}
                      </div>
                      <span className="text-sm font-medium text-[#22c55e] bg-[#22c55e]/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {block.time}
                      </span>
                    </div>
                    
                    <ul className="space-y-2 ml-11">
                      {block.talkingPoints.map((point: string, ptIndex: number) => (
                        <li key={ptIndex} className="flex items-start gap-2 text-[#c8d8ec] text-sm">
                          <span className="text-[#3b82f6] mt-1">•</span>
                          {isEditing ? (
                            <input
                              type="text"
                              value={point}
                              onChange={(e) => {
                                const newBlocks = [...editedBlocks];
                                newBlocks[index].talkingPoints[ptIndex] = e.target.value;
                                setEditedBlocks(newBlocks);
                              }}
                              className="rc-input text-sm w-full py-1"
                            />
                          ) : (
                            <span>{point}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Key Questions */}
              {generateMut.data.keyQuestions && generateMut.data.keyQuestions.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-[#f0c040]" /> Key Questions to Ask
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {generateMut.data.keyQuestions.map((q: string, i: number) => (
                      <div key={i} className="p-3 rounded-lg bg-[#0d1a2e] border border-[#12233e] text-sm text-[#c8d8ec] flex gap-3">
                        <div className="mt-0.5 text-[#f0c040]">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <p>{q}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Follow Up Actions */}
              {generateMut.data.followUpActions && generateMut.data.followUpActions.length > 0 && includeActionItems && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-[#22c55e]" /> Proposed Action Items
                  </h3>
                  <ul className="space-y-2">
                    {generateMut.data.followUpActions.map((a: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-[#c8d8ec] p-3 rounded-lg bg-[#060d19] border border-[#12233e]">
                        <div className="mt-0.5 shrink-0 w-4 h-4 rounded border border-[#7a95b8] flex items-center justify-center">
                        </div>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderStatsTab = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Filters for Stats */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-[#0d1a2e] p-4 rounded-lg border border-[#12233e]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#7a95b8]" />
            <span className="text-sm text-[#c8d8ec]">Timeframe:</span>
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="rc-input py-1 text-sm bg-[#060d19]"
            >
              <option value="mtd">Month to Date</option>
              <option value="qtd">Quarter to Date</option>
              <option value="ytd">Year to Date</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#c8d8ec]">View:</span>
            <div className="flex bg-[#060d19] rounded-md border border-[#12233e] p-0.5">
              <button 
                onClick={() => setChartView("monthly")}
                className={`px-3 py-1 text-xs rounded-sm ${chartView === "monthly" ? "bg-[#12233e] text-white" : "text-[#7a95b8]"}`}
              >
                Monthly
              </button>
              <button 
                onClick={() => setChartView("quarterly")}
                className={`px-3 py-1 text-xs rounded-sm ${chartView === "quarterly" ? "bg-[#12233e] text-white" : "text-[#7a95b8]"}`}
              >
                Quarterly
              </button>
            </div>
          </div>
        </div>
        <button onClick={() => toast.success("Analytics data refreshed")} className="rc-btn-secondary text-xs flex items-center gap-1 py-1.5">
          <RefreshCw className="w-3 h-3" /> Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rc-card flex flex-col justify-between hover:border-[#3b82f6]/50 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="rc-stat-label">Total Agendas</span>
            <ClipboardList className="w-5 h-5 text-[#3b82f6]" />
          </div>
          <div className="flex items-end justify-between">
            <span className="rc-stat-value">284</span>
            <span className="text-sm text-[#22c55e] flex items-center">+15%</span>
          </div>
        </div>
        <div className="rc-card flex flex-col justify-between hover:border-[#f0c040]/50 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="rc-stat-label">Avg. Duration</span>
            <Clock className="w-5 h-5 text-[#f0c040]" />
          </div>
          <div className="flex items-end justify-between">
            <span className="rc-stat-value">58m</span>
            <span className="text-sm text-[#22c55e] flex items-center">+3m</span>
          </div>
        </div>
        <div className="rc-card flex flex-col justify-between hover:border-[#22c55e]/50 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="rc-stat-label">Emails Sent</span>
            <Mail className="w-5 h-5 text-[#22c55e]" />
          </div>
          <div className="flex items-end justify-between">
            <span className="rc-stat-value">192</span>
            <span className="text-sm text-[#22c55e] flex items-center">+28%</span>
          </div>
        </div>
        <div className="rc-card flex flex-col justify-between hover:border-[#ef4444]/50 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="rc-stat-label">Client Coverage</span>
            <Users className="w-5 h-5 text-[#ef4444]" />
          </div>
          <div className="flex items-end justify-between">
            <span className="rc-stat-value">78%</span>
            <span className="text-sm text-[#22c55e] flex items-center">+12%</span>
          </div>
        </div>
        <div className="rc-card flex flex-col justify-between hover:border-[#a855f7]/50 transition-colors">
          <div className="flex items-center justify-between mb-2">
            <span className="rc-stat-label">Satisfaction</span>
            <Star className="w-5 h-5 text-[#a855f7]" />
          </div>
          <div className="flex items-end justify-between">
            <span className="rc-stat-value">4.8</span>
            <span className="text-sm text-[#22c55e] flex items-center">+0.2</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Bar Chart */}
        <div className="rc-card">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-[#3b82f6]" /> Meetings Volume Trend
            </h3>
            <button className="text-[#7a95b8] hover:text-white"><Maximize2 className="w-4 h-4" /></button>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MONTHLY_TRENDS} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                <XAxis dataKey="month" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#3b82f6' }}
                  cursor={{ fill: '#12233e', opacity: 0.4 }}
                />
                <Bar dataKey="meetings" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Total Meetings" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Pie Chart */}
        <div className="rc-card">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-[#f0c040]" /> Meeting Types Distribution
          </h3>
          <div className="h-[300px] w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={MEETING_STATS}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {MEETING_STATS.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-white">100</span>
              <span className="text-sm text-[#7a95b8]">Total</span>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {MEETING_STATS.map((stat, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="text-sm text-[#c8d8ec]">{stat.name} ({stat.value}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 3: Line Chart */}
        <div className="rc-card">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#22c55e]" /> Average Duration & Satisfaction
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MONTHLY_TRENDS} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                <XAxis dataKey="month" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#7a95b8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 5]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', borderRadius: '8px', color: '#fff' }}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="avgDuration" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} name="Avg Duration (min)" />
                <Line yAxisId="right" type="monotone" dataKey="satisfaction" stroke="#a855f7" strokeWidth={3} dot={{ r: 4 }} name="Satisfaction (1-5)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Area Chart */}
        <div className="rc-card">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#ef4444]" /> Client Engagement by Quarter
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CLIENT_ENGAGEMENT} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHigh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMedium" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f0c040" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f0c040" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#7a95b8" />
                <YAxis stroke="#7a95b8" />
                <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', borderRadius: '8px', color: '#fff' }} />
                <Legend />
                <Area type="monotone" dataKey="high" stroke="#ef4444" fillOpacity={1} fill="url(#colorHigh)" name="High Net Worth" />
                <Area type="monotone" dataKey="medium" stroke="#f0c040" fillOpacity={1} fill="url(#colorMedium)" name="Core Clients" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 5: Radar Chart */}
        <div className="rc-card lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-[#a855f7]" /> Topic Coverage Analysis
          </h3>
          <div className="h-[400px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={TOPIC_DISTRIBUTION}>
                <PolarGrid stroke="#12233e" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#c8d8ec', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 150]} stroke="#7a95b8" />
                <Radar name="This Quarter" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                <Radar name="Last Quarter" dataKey="B" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
                <Legend />
                <Tooltip contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', borderRadius: '8px', color: '#fff' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Data Table */}
        <div className="rc-card lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <List className="w-5 h-5 text-[#c8d8ec]" /> Recent Meeting Performance
            </h3>
            <button className="text-sm text-[#3b82f6] hover:text-[#60a5fa]">View Full Report</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#12233e] text-sm text-[#7a95b8]">
                  <th className="pb-3 font-medium">Metric Period</th>
                  <th className="pb-3 font-medium">Success Rate</th>
                  <th className="pb-3 font-medium">Target</th>
                  <th className="pb-3 font-medium">Variance</th>
                  <th className="pb-3 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {SUCCESS_METRICS.map((metric, i) => (
                  <tr key={i} className="border-b border-[#12233e]/50 hover:bg-[#12233e]/30 transition-colors">
                    <td className="py-4 text-[#c8d8ec] font-medium">{metric.name}</td>
                    <td className="py-4 text-white">{metric.rate}%</td>
                    <td className="py-4 text-[#7a95b8]">{metric.target}%</td>
                    <td className="py-4">
                      <span className={`flex items-center gap-1 ${metric.rate >= metric.target ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                        {metric.rate >= metric.target ? '+' : ''}{metric.rate - metric.target}%
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        metric.rate >= metric.target 
                          ? 'bg-[#22c55e]/10 text-[#22c55e]' 
                          : 'bg-[#ef4444]/10 text-[#ef4444]'
                      }`}>
                        {metric.rate >= metric.target ? 'On Track' : 'Needs Review'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHistoryTab = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-wrap justify-between items-center gap-4 bg-[#0d1a2e] p-4 rounded-lg border border-[#12233e]">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a95b8]" />
            <input 
              type="text" 
              placeholder="Search history..." 
              className="rc-input pl-9 w-64 text-sm py-1.5"
            />
          </div>
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="rc-input py-1.5 text-sm bg-[#060d19]"
          >
            <option value="all">All Types</option>
            <option value="strategy_review">Strategy Review</option>
            <option value="initial_consultation">Initial Consultation</option>
            <option value="annual_review">Annual Review</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded ${viewMode === "list" ? "bg-[#12233e] text-white" : "text-[#7a95b8] hover:text-white"}`}
          >
            <List className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded ${viewMode === "grid" ? "bg-[#12233e] text-white" : "text-[#7a95b8] hover:text-white"}`}
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!recentMeetings ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 text-[#3b82f6] animate-spin" />
        </div>
      ) : viewMode === "list" ? (
        <div className="rc-card overflow-hidden p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0d1a2e] border-b border-[#12233e] text-sm text-[#7a95b8]">
                <th className="p-4 font-medium">Client / Meeting</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Duration</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <tr key={i} className="border-b border-[#12233e]/50 hover:bg-[#12233e]/30 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-white">John Doe Family Trust</div>
                    <div className="text-xs text-[#7a95b8]">Q3 Strategy Review</div>
                  </td>
                  <td className="p-4 text-[#c8d8ec]">Oct 15, 2023</td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded-full text-xs bg-[#3b82f6]/10 text-[#3b82f6] border border-[#3b82f6]/20">
                      Strategy
                    </span>
                  </td>
                  <td className="p-4 text-[#c8d8ec]">60 min</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-1.5 text-[#7a95b8] hover:text-white bg-[#0d1a2e] rounded border border-[#12233e]"><Download className="w-3.5 h-3.5" /></button>
                      <button className="p-1.5 text-[#7a95b8] hover:text-white bg-[#0d1a2e] rounded border border-[#12233e]"><Mail className="w-3.5 h-3.5" /></button>
                      <button className="p-1.5 text-[#7a95b8] hover:text-white bg-[#0d1a2e] rounded border border-[#12233e]"><Copy className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rc-card hover:border-[#3b82f6]/50 transition-colors cursor-pointer group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-[#3b82f6]/10 rounded-lg">
                  <Briefcase className="w-5 h-5 text-[#3b82f6]" />
                </div>
                <span className="text-xs text-[#7a95b8]">Oct 15, 2023</span>
              </div>
              <h4 className="font-medium text-white mb-1">John Doe Family Trust</h4>
              <p className="text-sm text-[#7a95b8] mb-4">Q3 Strategy Review • 60 min</p>
              
              <div className="flex gap-2 mt-4 pt-4 border-t border-[#12233e] opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="flex-1 py-1.5 text-xs bg-[#0d1a2e] text-white rounded border border-[#12233e] hover:bg-[#12233e]">View</button>
                <button className="flex-1 py-1.5 text-xs bg-[#0d1a2e] text-white rounded border border-[#12233e] hover:bg-[#12233e]">Export</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderTemplatesTab = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-white">Agenda Templates</h2>
          <p className="text-sm text-[#7a95b8]">Manage and create reusable meeting structures</p>
        </div>
        <button className="rc-btn-primary flex items-center gap-2 text-sm py-2">
          <Plus className="w-4 h-4" /> New Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { name: "Standard Annual Review", uses: 145, rating: 4.8, color: "#3b82f6" },
          { name: "Initial Prospect Meeting", uses: 89, rating: 4.5, color: "#22c55e" },
          { name: "Tax Strategy Session", uses: 56, rating: 4.9, color: "#f0c040" },
          { name: "Estate Planning Deep Dive", uses: 34, rating: 4.7, color: "#a855f7" },
          { name: "Quick Check-in (15m)", uses: 210, rating: 4.6, color: "#ef4444" },
          { name: "Policy Delivery", uses: 78, rating: 4.4, color: "#ec4899" }
        ].map((t, i) => (
          <div key={i} className="rc-card flex flex-col h-full relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: t.color }}></div>
            
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-medium text-white text-lg">{t.name}</h3>
              <button className="text-[#7a95b8] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-4 text-sm text-[#7a95b8] mb-4">
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {t.uses} uses</span>
                <span className="flex items-center gap-1 text-[#f0c040]"><Star className="w-3.5 h-3.5 fill-current" /> {t.rating}</span>
              </div>
              
              <div className="space-y-2">
                <div className="h-1.5 w-full bg-[#12233e] rounded-full overflow-hidden">
                  <div className="h-full bg-[#3b82f6]" style={{ width: '30%' }}></div>
                </div>
                <div className="h-1.5 w-full bg-[#12233e] rounded-full overflow-hidden">
                  <div className="h-full bg-[#22c55e]" style={{ width: '50%' }}></div>
                </div>
                <div className="h-1.5 w-full bg-[#12233e] rounded-full overflow-hidden">
                  <div className="h-full bg-[#f0c040]" style={{ width: '20%' }}></div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-[#12233e] flex gap-2">
              <button className="flex-1 py-2 text-sm bg-[#3b82f6]/10 text-[#3b82f6] rounded font-medium hover:bg-[#3b82f6]/20 transition-colors">
                Use Template
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <AppShell>
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header */}
        <div className="rc-page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#0d1a2e] rounded-lg border border-[#12233e] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#3b82f6]/20 to-transparent"></div>
                <ClipboardList className="w-6 h-6 text-[#3b82f6] relative z-10" />
              </div>
              <div>
                <h1 className="rc-page-title flex items-center gap-2">
                  Smart Meeting Agenda
                  <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider bg-[#3b82f6]/10 text-[#3b82f6] rounded-full border border-[#3b82f6]/20">Pro</span>
                </h1>
                <p className="rc-page-subtitle">
                  Generate structured meeting agendas with AI-powered talking points.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="rc-btn-secondary flex items-center gap-2 text-sm">
              <Settings className="w-4 h-4" /> Preferences
            </button>
            <ExportToSlides
              toolName="Meeting Agenda"
              getSections={() => [
                {
                  title: "Agenda Overview",
                  items: [
                    { label: "Client", value: generateMut.data?.clientName || "N/A" },
                    { label: "Meeting Type", value: meetingType.replace(/_/g, " ") || "N/A" },
                    { label: "Duration", value: `${generateMut.data?.duration || 0} min` },
                    { label: "Priority", value: priority },
                  ],
                },
                ...(generateMut.data?.blocks || []).map((block) => ({
                  title: block.topic,
                  items: [
                    { label: "Time", value: block.time || "N/A" },
                    { label: "Talking Points", value: (block.talkingPoints || []).join(" • ") },
                  ],
                })),
              ]}
            />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex overflow-x-auto items-center gap-1 border-b border-[#12233e] pb-px custom-scrollbar hide-scrollbar">
          {[
            { id: "setup", label: "Agenda Setup", icon: Plus },
            { id: "stats", label: "Analytics", icon: BarChart2 },
            { id: "history", label: "History", icon: Clock },
            { id: "templates", label: "Templates", icon: Copy },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab.id 
                  ? "border-[#3b82f6] text-white bg-[#3b82f6]/5" 
                  : "border-transparent text-[#7a95b8] hover:text-white hover:bg-[#12233e]/50"
              }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-[#3b82f6]" : ""}`} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[600px]">
          {activeTab === "setup" && renderSetupTab()}
          {activeTab === "stats" && renderStatsTab()}
          {activeTab === "history" && renderHistoryTab()}
          {activeTab === "templates" && renderTemplatesTab()}
        </div>

        {/* Email Dialog */}
        {emailDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#0d1a2e] border border-[#12233e] rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-4 border-b border-[#12233e] flex justify-between items-center bg-[#060d19]">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Mail className="w-5 h-5 text-[#3b82f6]" /> Send Agenda
                </h3>
                <button 
                  onClick={() => setEmailDialogOpen(false)}
                  className="text-[#7a95b8] hover:text-white p-1 rounded-md hover:bg-[#12233e] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#c8d8ec] mb-1.5">Recipient Email</label>
                  <input
                    type="email"
                    value={emailRecipient}
                    onChange={(e) => setEmailRecipient(e.target.value)}
                    placeholder="client@example.com"
                    className="rc-input w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#c8d8ec] mb-1.5">Subject</label>
                  <input
                    type="text"
                    value={`Meeting Agenda: ${generateMut.data?.clientName || "Upcoming Meeting"}`}
                    readOnly
                    className="rc-input w-full bg-[#060d19] text-[#7a95b8]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#c8d8ec] mb-1.5">Message (Optional)</label>
                  <textarea
                    placeholder="Add a personal note..."
                    className="rc-input w-full min-h-[100px] resize-none"
                    defaultValue={`Hi ${generateMut.data?.clientName?.split(' ')[0] || 'there'},\n\nPlease find attached the agenda for our upcoming meeting.\n\nBest regards,\nYour Advisor`}
                  />
                </div>
                
                <div className="pt-4 flex justify-end gap-3">
                  <button 
                    onClick={() => setEmailDialogOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-[#c8d8ec] hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleEmailAgenda}
                    disabled={emailAgendaMut.isPending || !emailRecipient}
                    className="rc-btn-primary flex items-center gap-2 py-2"
                  >
                    {emailAgendaMut.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Email to Client
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <PageInsights pageId="meeting-agenda" />
      </div>
    </AppShell>
  );
}
