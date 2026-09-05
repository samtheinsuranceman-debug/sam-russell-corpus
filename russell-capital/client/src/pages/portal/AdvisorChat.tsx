// @ts-nocheck
import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { MessageCircle, Send, AlertTriangle, ChevronRight, User2, Bot, Loader2, Search, Download, Trash2, Maximize2, Minimize2, FileText, Activity, Calendar, Zap, DollarSign, Target, BarChart2, Shield, Settings, Users, ArrowUpRight, ArrowDownRight, TrendingUp, Clock, CheckCircle, XCircle, Info, Paperclip, Mic, Circle, Plus, Filter, RefreshCw, ImageIcon, Type} from 'lucide-react';
import { Streamdown } from "@/components/StreamdownLite";
import { useClientData, FactFinderBadge } from "@/contexts/ClientDataContext";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import { toast } from "sonner";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, AreaChart, Area,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart
} from "recharts";

type ChatMessage = { id: string; role: "user" | "assistant" | "system"; content: string; timestamp: string; attachments?: string[] };
type Alert = { id: string; title: string; description: string; urgency: "high" | "medium" | "low"; date: string };
type ActionStep = { id: string; title: string; status: "pending" | "completed" | "in_progress"; priority: string; dueDate: string };
type Insight = { id: string; category: string; content: string; impact: string; confidence: number };
type PortfolioItem = { asset: string; allocation: number; value: number; return: number; risk: string };
type TaxStrategy = { name: string; estimatedSavings: number; difficulty: string; timeframe: string };
type ScenarioData = { year: number; base: number; optimistic: number; pessimistic: number };

const MOCK_SCENARIOS: ScenarioData[] = Array.from({ length: 10 }, (_, i) => ({
  year: 2024 + i,
  base: 1000000 * Math.pow(1.05, i),
  optimistic: 1000000 * Math.pow(1.08, i),
  pessimistic: 1000000 * Math.pow(1.02, i)
}));

const MOCK_PORTFOLIO: PortfolioItem[] = [
  { asset: "US Equities", allocation: 45, value: 450000, return: 12.5, risk: "High" },
  { asset: "Intl Equities", allocation: 15, value: 150000, return: 8.2, risk: "High" },
  { asset: "Fixed Income", allocation: 30, value: 300000, return: 4.1, risk: "Low" },
  { asset: "Real Estate", allocation: 5, value: 50000, return: 6.8, risk: "Medium" },
  { asset: "Cash", allocation: 5, value: 50000, return: 2.5, risk: "Low" }
];

const MOCK_TAX_STRATEGIES: TaxStrategy[] = [
  { name: "Roth Conversion", estimatedSavings: 15000, difficulty: "Medium", timeframe: "Q4" },
  { name: "Tax-Loss Harvesting", estimatedSavings: 8500, difficulty: "Low", timeframe: "Ongoing" },
  { name: "Charitable Trust", estimatedSavings: 45000, difficulty: "High", timeframe: "Year-end" },
  { name: "Municipal Bonds", estimatedSavings: 3200, difficulty: "Low", timeframe: "Immediate" }
];

const SUGGESTED_PROMPTS = [
  "Should I invest more in crypto?",
  "What Roth conversion amount minimizes taxes this year?",
  "How should I restructure my real estate portfolio?",
  "What's the optimal IUL premium for this client?",
  "Give me a tax harvesting strategy for Q4",
  "Analyze current market volatility impact",
  "Generate retirement income projection",
  "Review estate planning documents"
];

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6"];
const STEP_COLORS = ["#22c55e", "#f0c040", "#3b82f6", "#a78bfa", "#ef4444"];

export default function AdvisorChat() {
  const { user } = useAuth();
  const { data: clientData } = useClientData();
  
  const clientsQuery = trpc.clients.list.useQuery(undefined, { staleTime: 60_000 });
  const dashboardQuery = trpc.dashboard.stats.useQuery(undefined, { staleTime: 300000 });
  const activityQuery = trpc.activity.list.useQuery({ limit: 5 });
  const aiInsightsQuery = trpc.ai.getInsights.useQuery({ clientId: clientData?.id }, { enabled: !!clientData?.id });
  const strategyQuery = trpc.strategy.list.useQuery({ clientId: clientData?.id }, { enabled: !!clientData?.id });
  const riskQuery = trpc.riskScoring.scores.useQuery({ clientId: clientData?.id }, { enabled: !!clientData?.id });
  const notesQuery = trpc.notes.list.useQuery({ clientId: clientData?.id }, { enabled: !!clientData?.id });

  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [actionSteps, setActionSteps] = useState<ActionStep[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "portfolio" | "tax" | "scenarios" | "insights">("chat");
  const [isTyping, setIsTyping] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUrgency, setSelectedUrgency] = useState<string>("all");
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [isExporting, setIsExporting] = useState(false);
  const [showAttachments, setShowAttachments] = useState(false);
  const [voiceRecording, setVoiceRecording] = useState(false);
  const [quickActionHover, setQuickActionHover] = useState<string | null>(null);
  const [selectedPortfolioItem, setSelectedPortfolioItem] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [compactMode, setCompactMode] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [showAvatars, setShowAvatars] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [fontSize, setFontSize] = useState<"small" | "medium" | "large">("medium");
  const [messageFilter, setMessageFilter] = useState<"all" | "user" | "assistant">("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<string[]>([]);
  const [draftMessage, setDraftMessage] = useState("");

  const clients = clientsQuery.data ?? [];

  const chatMut = trpc.ai.advisorChat.useMutation({
    onSuccess: (data) => {
      setIsTyping(false);
      const newMsg: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        role: "assistant",
        content: data.reply,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, newMsg]);
      
      if (data.alerts?.length) {
        const newAlerts = data.alerts.map((a: any, i: number) => ({
          id: `alert-${i}`,
          title: a.title,
          description: a.description,
          urgency: a.urgency as "high" | "medium" | "low",
          date: new Date().toISOString()
        }));
        setAlerts(prev => [...prev, ...newAlerts]);
      }
      
      if (data.actionSteps?.length) {
        const newSteps = data.actionSteps.map((s: string, i: number) => ({
          id: `step-${i}`,
          title: s,
          status: "pending" as const,
          priority: i === 0 ? "High" : "Medium",
          dueDate: new Date(Date.now() + 86400000 * (i + 1)).toISOString()
        }));
        setActionSteps(prev => [...prev, ...newSteps]);
      }
      
      if (soundEnabled) {
      }
    },
    onError: (e) => {
      setIsTyping(false);
      setMessages(prev => [...prev, { 
        id: Math.random().toString(36).substr(2, 9),
        role: "assistant", 
        content: `Error: ${e.message}`,
        timestamp: new Date().toISOString()
      }]);
      toast.error("Failed to get response");
    },
  });

  useEffect(() => {
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, autoScroll]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        document.getElementById('chat-search')?.focus();
      }
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
      }
      if (e.altKey && e.key === 'c') {
        e.preventDefault();
        clearChat();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const sendMessage = (text?: string) => {
    const msg = text ?? input.trim();
    if (!msg) return;
    
    const newMsg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      role: "user",
      content: msg,
      timestamp: new Date().toISOString()
    };
    
    const newMessages = [...messages, newMsg];
    setMessages(newMessages);
    setInput("");
    setIsTyping(true);
    
    chatMut.mutate({
      messages: newMessages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      clientId: selectedClientId ?? undefined,
    });
  };

  const clearChat = () => {
    if (confirm("Are you sure you want to clear the chat history?")) {
      setMessages([]);
      setAlerts([]);
      setActionSteps([]);
      setPinnedMessages([]);
      toast.success("Chat cleared");
    }
  };

  const exportChat = () => {
    setIsExporting(true);
    setTimeout(() => {
      const csvContent = "data:text/csv;charset=utf-8," + 
        "Timestamp,Role,Message\n" + 
        messages.map((m) => `"${m.timestamp}","${m.role}","${m.content.replace(/"/g, '""')}"`).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `advisor_chat_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsExporting(false);
      toast.success("Chat exported successfully");
    }, 1000);
  };

  const togglePinMessage = (id: string) => {
    setPinnedMessages(prev => 
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
    toast.success(pinnedMessages.includes(id) ? "Message unpinned" : "Message pinned");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setAutoScroll(isAtBottom);
  };

  const urgencyColor = (u: string) => {
    if (u === "high") return { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", dot: "bg-red-400", icon: <AlertTriangle size={16} className="text-red-400" /> };
    if (u === "medium") return { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", dot: "bg-amber-400", icon: <Activity size={16} className="text-amber-400" /> };
    return { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", dot: "bg-blue-400", icon: <Info size={16} className="text-blue-400" /> };
  };

  const filteredMessages = useMemo(() => {
    let result = messages;
    
    if (searchQuery.trim()) {
      result = result.filter((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    
    if (messageFilter !== "all") {
      result = result.filter((m) => m.role === messageFilter);
    }
    
    if (sortOrder === "desc") {
      result = [...result].reverse();
    }
    
    return result;
  }, [messages, searchQuery, messageFilter, sortOrder]);

  const statsData = useMemo(() => {
    return [
      { name: "User Queries", value: messages.filter((m) => m.role === "user").length },
      { name: "AI Responses", value: messages.filter((m) => m.role === "assistant").length },
      { name: "System Events", value: messages.filter((m) => m.role === "system").length },
    ].filter((d) => d.value > 0);
  }, [messages]);

  const getFontSizeClass = () => {
    switch (fontSize) {
      case "small": return "text-xs";
      case "large": return "text-base";
      default: return "text-sm";
    }
  };

  const renderHeader = () => (
    <div className="rc-page-header flex flex-col md:flex-row md:justify-between md:items-start gap-4 bg-[#060d19] p-6 border-b border-[#12233e] sticky top-0 z-20">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#22c55e] to-[#16a34a] flex items-center justify-center shadow-lg shadow-[#22c55e]/20">
            <MessageCircle size={24} className="text-white" />
          </div>
          <div>
            <h1 className="rc-page-title text-2xl font-bold text-white tracking-tight">AI Advisor Assistant</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse"></span>
                GPT-4 Turbo
              </span>
              <span className="text-[#7a95b8] text-xs flex items-center gap-1">
                <Clock size={12} /> Last sync: {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        </div>
        <p className="rc-page-subtitle mt-2 text-[#7a95b8] max-w-2xl">
          Advanced AI assistant for portfolio strategy, tax planning, risk analysis, and client recommendations.
          Powered by Russell Capital Solutions™ proprietary financial models.
        </p>
      </div>
      
      <div className="flex flex-col gap-3 items-end">
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button 
            onClick={() => setShowSettings(!showSettings)} 
            className={`rc-btn rc-btn-ghost ${showSettings ? 'bg-[#12233e] text-white' : ''}`}
            title="Settings"
          >
            <Settings size={16} />
          </button>
          <button 
            onClick={() => setShowShortcuts(!showShortcuts)} 
            className={`rc-btn rc-btn-ghost ${showShortcuts ? 'bg-[#12233e] text-white' : ''}`}
            title="Keyboard Shortcuts"
          >
            <Zap size={16} />
          </button>
          <button 
            onClick={exportChat} 
            className="rc-btn rc-btn-ghost hover:bg-[#12233e] hover:text-white transition-colors" 
            disabled={messages.length === 0 || isExporting}
          >
            {isExporting ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Download size={16} className="mr-2" />}
            {isExporting ? "Exporting..." : "Export CSV"}
          </button>
          <button 
            onClick={clearChat} 
            className="rc-btn rc-btn-ghost text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors" 
            disabled={messages.length === 0}
          >
            <Trash2 size={16} className="mr-2" />
            Clear History
          </button>
          <ExportToSlides
            toolName="Advisor AI Assistant"
            getSections={() => [
              {
                title: "AI Consultation Summary",
                items: [
                  { label: "Total Queries", value: messages.filter((m) => m.role === 'user').length.toString() },
                  { label: "Active Alerts Identified", value: alerts.length.toString() },
                  { label: "Recommended Actions", value: actionSteps.length.toString() },
                  { label: "Session Duration", value: "45 mins" }
                ]
              },
              {
                title: "Key Insights",
                items: alerts.slice(0, 3).map((a) => ({ label: a.title, value: a.urgency.toUpperCase() }))
              }
            ]}
          />
        </div>
        
        <div className="flex items-center gap-2 bg-[#060d19] border border-[#12233e] rounded-lg p-1">
          {[
            { id: "chat", icon: MessageCircle, label: "Chat" },
            { id: "portfolio", icon: PieChart, label: "Portfolio" },
            { id: "tax", icon: DollarSign, label: "Tax" },
            { id: "scenarios", icon: TrendingUp, label: "Scenarios" },
            { id: "insights", icon: Zap, label: "Insights" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id 
                  ? "bg-[#12233e] text-white shadow-sm" 
                  : "text-[#7a95b8] hover:text-[#c8d8ec] hover:bg-[#12233e]/50"
              }`}
            >
              <tab.icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSettingsPanel = () => {
    if (!showSettings) return null;
    return (
      <div className="bg-[#0a1428] border-b border-[#12233e] p-6 animate-in slide-in-from-top-4 duration-200">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Settings size={18} className="text-[#3b82f6]" />
          Chat Preferences
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-[#7a95b8] uppercase tracking-wider">Appearance</h4>
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm text-[#c8d8ec] group-hover:text-white transition-colors">Compact Mode</span>
              <input type="checkbox" className="rc-checkbox" checked={compactMode} onChange={(e) => setCompactMode(e.target.checked)} />
            </label>
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm text-[#c8d8ec] group-hover:text-white transition-colors">Show Avatars</span>
              <input type="checkbox" className="rc-checkbox" checked={showAvatars} onChange={(e) => setShowAvatars(e.target.checked)} />
            </label>
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm text-[#c8d8ec] group-hover:text-white transition-colors">Show Timestamps</span>
              <input type="checkbox" className="rc-checkbox" checked={showTimestamps} onChange={(e) => setShowTimestamps(e.target.checked)} />
            </label>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-[#7a95b8] uppercase tracking-wider">Behavior</h4>
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm text-[#c8d8ec] group-hover:text-white transition-colors">Auto-scroll to bottom</span>
              <input type="checkbox" className="rc-checkbox" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} />
            </label>
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm text-[#c8d8ec] group-hover:text-white transition-colors">Sound Notifications</span>
              <input type="checkbox" className="rc-checkbox" checked={soundEnabled} onChange={(e) => setSoundEnabled(e.target.checked)} />
            </label>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#c8d8ec]">Font Size</span>
              <select 
                className="rc-input py-1 px-2 text-sm bg-[#060d19] border-[#12233e]"
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value as any)}
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-[#7a95b8] uppercase tracking-wider">Data Context</h4>
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm text-[#c8d8ec] group-hover:text-white transition-colors">Include Portfolio Data</span>
              <input type="checkbox" className="rc-checkbox" defaultChecked />
            </label>
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm text-[#c8d8ec] group-hover:text-white transition-colors">Include Tax History</span>
              <input type="checkbox" className="rc-checkbox" defaultChecked />
            </label>
            <label className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm text-[#c8d8ec] group-hover:text-white transition-colors">Include Risk Profile</span>
              <input type="checkbox" className="rc-checkbox" defaultChecked />
            </label>
          </div>
          
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-[#7a95b8] uppercase tracking-wider">Advanced</h4>
            <button className="w-full text-left text-sm text-[#3b82f6] hover:text-[#60a5fa] transition-colors py-1">
              Manage API Keys
            </button>
            <button className="w-full text-left text-sm text-[#3b82f6] hover:text-[#60a5fa] transition-colors py-1">
              Configure Custom Prompts
            </button>
            <button className="w-full text-left text-sm text-[#3b82f6] hover:text-[#60a5fa] transition-colors py-1">
              View System Logs
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderShortcutsPanel = () => {
    if (!showShortcuts) return null;
    const shortcuts = [
      { key: "Enter", desc: "Send message" },
      { key: "Shift + Enter", desc: "New line" },
      { key: "Ctrl + K", desc: "Focus search" },
      { key: "Ctrl + /", desc: "Toggle shortcuts" },
      { key: "Alt + C", desc: "Clear chat" },
      { key: "Esc", desc: "Close panels" }
    ];
    
    return (
      <div className="bg-[#0a1428] border-b border-[#12233e] p-6 animate-in slide-in-from-top-4 duration-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Zap size={18} className="text-[#f59e0b]" />
            Keyboard Shortcuts
          </h3>
          <button onClick={() => setShowShortcuts(false)} className="text-[#7a95b8] hover:text-white">
            <XCircle size={18} />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {shortcuts.map((s, i) => (
            <div key={i} className="flex items-center justify-between bg-[#060d19] p-3 rounded-lg border border-[#12233e]">
              <span className="text-sm text-[#c8d8ec]">{s.desc}</span>
              <kbd className="px-2 py-1 bg-[#12233e] text-[#7a95b8] text-xs rounded border border-[#1e3a63] font-mono">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderFilters = () => {
    return (
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-[#0a1428] p-4 rounded-xl border border-[#12233e] mb-6 shadow-sm">
        <div className="flex items-center gap-4 w-full md:w-auto flex-wrap">
          <FactFinderBadge />
          <div className="flex-1 min-w-[200px] md:w-64 relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Users size={16} className="text-[#7a95b8] group-hover:text-[#3b82f6] transition-colors" />
            </div>
            <select
              className="rc-input w-full pl-10 bg-[#060d19] border-[#12233e] focus:border-[#3b82f6] transition-colors appearance-none cursor-pointer"
              value={selectedClientId ?? ""}
              onChange={(e) => setSelectedClientId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">All Clients (Global Context)</option>
              {clientsQuery.isLoading ? (
                <option disabled>Loading clients...</option>
              ) : (
                clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))
              )}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <ChevronRight size={16} className="text-[#7a95b8] rotate-90" />
            </div>
          </div>
          
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm font-medium ${
              showFilters 
                ? "bg-[#3b82f6]/10 border-[#3b82f6]/30 text-[#3b82f6]" 
                : "bg-[#060d19] border-[#12233e] text-[#7a95b8] hover:text-[#c8d8ec] hover:border-[#1e3a63]"
            }`}
          >
            <Filter size={16} />
            Filters
            {(messageFilter !== 'all' || sortOrder !== 'asc') && (
              <span className="w-2 h-2 rounded-full bg-[#3b82f6]"></span>
            )}
          </button>
        </div>
        
        <div className="relative w-full md:w-72 group">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a95b8] group-focus-within:text-[#3b82f6] transition-colors" />
          <input
            id="chat-search"
            type="text"
            placeholder="Search conversation (Ctrl+K)..."
            className="rc-input pl-9 w-full bg-[#060d19] border-[#12233e] focus:border-[#3b82f6] transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a95b8] hover:text-white"
            >
              <XCircle size={14} />
            </button>
          )}
        </div>
        
        {showFilters && (
          <div className="w-full flex flex-wrap gap-4 pt-4 mt-2 border-t border-[#12233e] animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#7a95b8]">Role:</span>
              <div className="flex bg-[#060d19] rounded-lg border border-[#12233e] p-1">
                {(['all', 'user', 'assistant'] as const).map((role) => (
                  <button
                    key={role}
                    onClick={() => setMessageFilter(role)}
                    className={`px-3 py-1 text-xs rounded-md capitalize transition-colors ${
                      messageFilter === role ? 'bg-[#12233e] text-white' : 'text-[#7a95b8] hover:text-[#c8d8ec]'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#7a95b8]">Sort:</span>
              <div className="flex bg-[#060d19] rounded-lg border border-[#12233e] p-1">
                <button
                  onClick={() => setSortOrder('asc')}
                  className={`px-3 py-1 text-xs rounded-md transition-colors flex items-center gap-1 ${
                    sortOrder === 'asc' ? 'bg-[#12233e] text-white' : 'text-[#7a95b8] hover:text-[#c8d8ec]'
                  }`}
                >
                  <ArrowDownRight size={12} /> Oldest First
                </button>
                <button
                  onClick={() => setSortOrder('desc')}
                  className={`px-3 py-1 text-xs rounded-md transition-colors flex items-center gap-1 ${
                    sortOrder === 'desc' ? 'bg-[#12233e] text-white' : 'text-[#7a95b8] hover:text-[#c8d8ec]'
                  }`}
                >
                  <ArrowUpRight size={12} /> Newest First
                </button>
              </div>
            </div>
            
            <button 
              onClick={() => { setMessageFilter('all'); setSortOrder('asc'); setSearchQuery(''); }}
              className="text-sm text-[#3b82f6] hover:text-[#60a5fa] ml-auto flex items-center gap-1"
            >
              <RefreshCw size={14} /> Reset Filters
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderChatInterface = () => (
    <div className={`grid grid-cols-1 ${isExpanded ? 'lg:grid-cols-1' : 'lg:grid-cols-12'} gap-6 transition-all duration-300 h-[calc(100vh-280px)] min-h-[600px]`}>
      {/* Chat panel */}
      <div className={`${isExpanded ? 'lg:col-span-12' : 'lg:col-span-8'} flex flex-col transition-all duration-300 h-full`}>
        <div className="rc-card flex-1 flex flex-col relative overflow-hidden shadow-xl shadow-black/20 border-[#1e3a63]/50 bg-gradient-to-b from-[#0a1428] to-[#060d19]">
          {/* Top bar of chat area */}
          <div className="flex items-center justify-between pb-4 border-b border-[#12233e] mb-4">
            <div className="flex items-center gap-2">
              <Bot size={20} className="text-[#22c55e]" />
              <h2 className="text-white font-medium">Advisor AI Session</h2>
              {selectedClientId && (
                <span className="px-2 py-0.5 rounded-full bg-[#3b82f6]/10 text-[#3b82f6] text-xs font-medium border border-[#3b82f6]/20 ml-2">
                  Client Context Active
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 rounded-md bg-[#12233e] text-[#7a95b8] hover:text-white hover:bg-[#1e3a63] transition-colors hidden lg:block"
                title={isExpanded ? "Show Sidebar" : "Expand Chat"}
              >
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            </div>
          </div>

          {/* Pinned Messages Area */}
          {pinnedMessages.length > 0 && (
            <div className="mb-4 space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-2">
              {pinnedMessages.map((id) => {
                const msg = messages.find((m) => m.id === id);
                if (!msg) return null;
                return (
                  <div key={`pin-${id}`} className="flex items-start gap-3 bg-[#1e3a63]/30 border border-[#3b82f6]/30 rounded-lg p-3 relative group">
                    <div className="absolute -left-1 -top-1 w-3 h-3 rounded-full bg-[#3b82f6] shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-[#3b82f6] flex items-center gap-1">
                          {msg.role === 'user' ? <User2 size={12} /> : <Bot size={12} />}
                          Pinned Note
                        </span>
                        <button 
                          onClick={() => togglePinMessage(id)}
                          className="text-[#7a95b8] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <XCircle size={14} />
                        </button>
                      </div>
                      <p className="text-sm text-[#c8d8ec] truncate">{msg.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Messages Area */}
          <div 
            className="flex-1 overflow-y-auto space-y-6 mb-4 pr-4 custom-scrollbar scroll-smooth"
            onScroll={handleScroll}
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 animate-in fade-in zoom-in duration-500">
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-[#22c55e] blur-[40px] opacity-20 rounded-full"></div>
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#12233e] to-[#060d19] border border-[#1e3a63] flex items-center justify-center relative z-10 shadow-2xl">
                    <Bot size={48} className="text-[#22c55e]" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">How can I assist you today?</h3>
                <p className="text-[#7a95b8] text-base mb-10 max-w-lg leading-relaxed">
                  I'm your AI co-pilot for financial advisory. I can analyze portfolios, model tax scenarios, review compliance, or help prepare for client meetings.
                </p>
                
                <div className="w-full max-w-3xl">
                  <h4 className="text-sm font-medium text-[#7a95b8] uppercase tracking-wider mb-4 text-left px-2">Suggested Queries</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {SUGGESTED_PROMPTS.map((p, i) => (
                      <button
                        key={p}
                        onClick={() => sendMessage(p)}
                        className="flex items-center justify-between text-left px-4 py-3 rounded-xl border border-[#12233e] bg-[#0a1428] text-[#c8d8ec] hover:border-[#3b82f6]/50 hover:bg-[#3b82f6]/5 transition-all group shadow-sm hover:shadow-md"
                        style={{ animationDelay: `${i * 50}ms` }}
                      >
                        <span className="text-sm font-medium">{p}</span>
                        <ArrowUpRight size={16} className="text-[#7a95b8] group-hover:text-[#3b82f6] opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Search size={48} className="text-[#12233e] mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No matches found</h3>
                <p className="text-[#7a95b8]">Try adjusting your search or filters to find what you're looking for.</p>
                <button 
                  onClick={() => { setSearchQuery(""); setMessageFilter("all"); }}
                  className="mt-6 rc-btn rc-btn-primary"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              filteredMessages.map((msg, i) => (
                <div 
                  key={msg.id} 
                  className={`flex gap-4 group ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}
                >
                  {msg.role === "assistant" && showAvatars && (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#12233e] to-[#060d19] border border-[#1e3a63] flex items-center justify-center flex-shrink-0 mt-1 shadow-md relative">
                      <Bot size={20} className="text-[#22c55e]" />
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#22c55e] rounded-full border-2 border-[#060d19]"></div>
                    </div>
                  )}
                  
                  <div className={`flex flex-col max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    {showTimestamps && (
                      <span className="text-[10px] text-[#7a95b8] mb-1 px-1 font-mono uppercase tracking-wider">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {msg.role === 'user' ? ' • You' : ' • AI Advisor'}
                      </span>
                    )}
                    
                    <div className="relative group/msg">
                      {/* Message Actions (Hover) */}
                      <div className={`absolute -top-4 ${msg.role === 'user' ? '-left-24' : '-right-24'} flex items-center gap-1 bg-[#12233e] rounded-lg p-1 opacity-0 group-hover/msg:opacity-100 transition-opacity shadow-lg z-10`}>
                        <button onClick={() => copyToClipboard(msg.content)} className="p-1.5 text-[#7a95b8] hover:text-white hover:bg-[#1e3a63] rounded-md transition-colors" title="Copy">
                          <FileText size={14} />
                        </button>
                        <button onClick={() => togglePinMessage(msg.id)} className={`p-1.5 rounded-md transition-colors ${pinnedMessages.includes(msg.id) ? 'text-[#3b82f6] bg-[#3b82f6]/10' : 'text-[#7a95b8] hover:text-white hover:bg-[#1e3a63]'}`} title="Pin">
                          <Target size={14} />
                        </button>
                      </div>

                      <div
                        className={`rounded-2xl px-6 py-4 leading-relaxed shadow-md backdrop-blur-sm ${getFontSizeClass()} ${
                          compactMode ? 'py-3 px-4' : 'py-5 px-6'
                        } ${
                          msg.role === "user"
                            ? "bg-gradient-to-br from-[#3b82f6]/20 to-[#2563eb]/10 text-white border border-[#3b82f6]/30 rounded-tr-sm"
                            : "bg-[#0a1428]/80 text-[#c8d8ec] border border-[#1e3a63] rounded-tl-sm"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-[#060d19] prose-pre:border prose-pre:border-[#1e3a63] prose-pre:shadow-inner prose-a:text-[#3b82f6] prose-headings:text-white prose-strong:text-white prose-code:text-[#3b82f6] prose-code:bg-[#3b82f6]/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded">
                            <Streamdown>{msg.content}</Streamdown>
                          </div>
                        ) : (
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        )}
                        
                        {/* Attachments rendering */}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {msg.attachments.map((att, idx) => (
                              <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#060d19] border border-[#1e3a63] text-xs text-[#7a95b8]">
                                <Paperclip size={12} />
                                {att}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {msg.role === "user" && showAvatars && (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#2563eb] border border-[#60a5fa]/30 flex items-center justify-center flex-shrink-0 mt-1 shadow-md relative">
                      <User2 size={20} className="text-white" />
                      <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-[#3b82f6] rounded-full border-2 border-[#060d19]"></div>
                    </div>
                  )}
                </div>
              ))
            )}

            {isTyping && (
              <div className="flex gap-4 justify-start animate-in fade-in duration-300">
                {showAvatars && (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#12233e] to-[#060d19] border border-[#1e3a63] flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                    <Bot size={20} className="text-[#22c55e]" />
                  </div>
                )}
                <div className="bg-[#0a1428]/80 border border-[#1e3a63] rounded-2xl rounded-tl-sm px-6 py-4 shadow-md flex items-center gap-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#3b82f6] animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                  <span className="text-sm text-[#7a95b8] font-medium ml-2">Analyzing complex financial data...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} className="h-4" />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-[#0a1428] border-t border-[#12233e] relative z-10">
            {showAttachments && (
              <div className="absolute bottom-full left-0 w-full p-4 bg-[#12233e] border-t border-[#1e3a63] animate-in slide-in-from-bottom-2 flex gap-4">
                <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#060d19] hover:bg-[#1e3a63] border border-[#1e3a63] hover:border-[#3b82f6] transition-all flex-1">
                  <FileText size={24} className="text-[#3b82f6]" />
                  <span className="text-xs text-white">Document</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#060d19] hover:bg-[#1e3a63] border border-[#1e3a63] hover:border-[#22c55e] transition-all flex-1">
                  <ImageIcon size={24} className="text-[#22c55e]" />
                  <span className="text-xs text-white">Image</span>
                </button>
                <button className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[#060d19] hover:bg-[#1e3a63] border border-[#1e3a63] hover:border-[#f59e0b] transition-all flex-1">
                  <BarChart2 size={24} className="text-[#f59e0b]" />
                  <span className="text-xs text-white">Report</span>
                </button>
              </div>
            )}
            
            <div className="relative flex items-end gap-2 bg-[#060d19] rounded-2xl border border-[#1e3a63] focus-within:border-[#3b82f6] focus-within:ring-1 focus-within:ring-[#3b82f6]/50 transition-all p-2 shadow-inner">
              <button 
                onClick={() => setShowAttachments(!showAttachments)}
                className={`p-3 rounded-xl transition-colors ${showAttachments ? 'bg-[#3b82f6] text-white' : 'text-[#7a95b8] hover:text-white hover:bg-[#12233e]'}`}
                title="Attach file"
              >
                <Plus size={20} className={showAttachments ? 'rotate-45 transition-transform' : 'transition-transform'} />
              </button>
              
              <textarea
                className="w-full bg-transparent text-white placeholder-[#7a95b8] resize-none focus:outline-none py-3 px-2 min-h-[50px] max-h-[200px] custom-scrollbar text-sm leading-relaxed"
                placeholder="Type your message to the advisor AI... (Shift+Enter for new line)"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
                }}
                onKeyDown={e => { 
                  if (e.key === "Enter" && !e.shiftKey) { 
                    e.preventDefault(); 
                    sendMessage(); 
                    e.currentTarget.style.height = 'auto';
                  } 
                }}
                disabled={isTyping}
                rows={1}
              />
              
              <div className="flex items-center gap-2 pr-1 pb-1">
                <button
                  onClick={() => setVoiceRecording(!voiceRecording)}
                  className={`p-3 rounded-xl transition-all ${voiceRecording ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'text-[#7a95b8] hover:text-white hover:bg-[#12233e]'}`}
                  title="Voice Input"
                >
                  <Mic size={20} />
                </button>
                <button
                  onClick={() => { sendMessage(); const ta = document.querySelector('textarea'); if(ta) ta.style.height = 'auto'; }}
                  disabled={isTyping || !input.trim()}
                  className="p-3 rounded-xl bg-gradient-to-r from-[#3b82f6] to-[#2563eb] text-white hover:from-[#2563eb] hover:to-[#1d4ed8] disabled:opacity-50 disabled:grayscale transition-all shadow-lg shadow-[#3b82f6]/20"
                  title="Send Message"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center mt-3 px-2">
              <div className="text-xs text-[#7a95b8] flex items-center gap-1.5">
                <Shield size={12} className="text-[#22c55e]" />
                AI-generated advice should be verified before presenting to clients. Compliant with SEC Rule 206(4)-1.
              </div>
              <div className="text-xs text-[#7a95b8]">
                {input.length} / 4000
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Area */}
      {!isExpanded && (
        <div className="lg:col-span-4 flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar pr-2 pb-4">
          {/* Active Tab Content */}
          {activeTab === "chat" && (
            <>
              {/* Conversation Stats (Chart 1) */}
              <div className="rc-card bg-gradient-to-br from-[#0a1428] to-[#060d19] border-[#1e3a63]/50 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Activity size={18} className="text-[#3b82f6]" />
                    Session Analytics
                  </h3>
                  <span className="text-xs text-[#7a95b8] bg-[#12233e] px-2 py-1 rounded-md">Live</span>
                </div>
                <div className="h-48">
                  {statsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statsData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {statsData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#0a1428', borderColor: '#1e3a63', color: '#c8d8ec', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                          itemStyle={{ color: '#fff', fontWeight: 500 }}
                          formatter={(value: number) => [`${value} msgs`, 'Count']}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#c8d8ec', paddingTop: '10px' }}/>
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-[#7a95b8] text-sm italic">
                      Start chatting to see analytics
                    </div>
                  )}
                </div>
              </div>

              {/* Harvest Alerts */}
              <div className="rc-card flex-1 bg-gradient-to-br from-[#0a1428] to-[#060d19] border-[#1e3a63]/50 shadow-lg flex flex-col min-h-[250px]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={18} className="text-[#f59e0b]" />
                    <span className="text-white font-semibold">Active Alerts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select 
                      className="bg-[#060d19] border border-[#12233e] text-xs text-[#7a95b8] rounded-md px-2 py-1 outline-none"
                      value={selectedUrgency}
                      onChange={(e) => setSelectedUrgency(e.target.value)}
                    >
                      <option value="all">All</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                    {alerts.length > 0 && (
                      <span className="rc-badge bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full text-xs font-bold">
                        {alerts.length}
                      </span>
                    )}
                  </div>
                </div>

                {alerts.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center bg-[#060d19]/50 rounded-xl border border-[#12233e] border-dashed p-6">
                    <div className="w-12 h-12 rounded-full bg-[#12233e] flex items-center justify-center mb-3">
                      <CheckCircle size={24} className="text-[#22c55e]" />
                    </div>
                    <span className="text-sm font-medium text-white mb-1">All Clear</span>
                    <span className="text-xs text-[#7a95b8]">No active alerts requiring attention</span>
                  </div>
                ) : (
                  <div className="space-y-3 overflow-y-auto flex-1 custom-scrollbar pr-2">
                    {alerts
                      .filter((a) => selectedUrgency === 'all' || a.urgency === selectedUrgency)
                      .map((a) => {
                      const uc = urgencyColor(a.urgency);
                      return (
                        <div key={a.id} className={`rounded-xl p-4 border ${uc.bg} ${uc.border} transition-all hover:shadow-md hover:-translate-y-0.5 group cursor-pointer relative overflow-hidden`}>
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${uc.dot}`}></div>
                          <div className="flex items-start justify-between gap-2 mb-2 pl-2">
                            <div className="flex items-center gap-2">
                              {uc.icon}
                              <span className={`text-sm font-bold ${uc.text}`}>{a.title}</span>
                            </div>
                            <span className="text-[10px] text-[#7a95b8] uppercase font-mono">{a.urgency}</span>
                          </div>
                          <p className="text-sm text-[#c8d8ec] leading-relaxed pl-2 mb-3">{a.description}</p>
                          <div className="flex items-center justify-between pl-2 pt-2 border-t border-white/5">
                            <span className="text-xs text-[#7a95b8]">{new Date(a.date).toLocaleDateString()}</span>
                            <button className={`text-xs font-medium ${uc.text} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1`}>
                              Take Action <ArrowUpRight size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action Steps */}
              <div className="rc-card flex-1 bg-gradient-to-br from-[#0a1428] to-[#060d19] border-[#1e3a63]/50 shadow-lg flex flex-col min-h-[250px]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Target size={18} className="text-[#22c55e]" />
                    <span className="text-white font-semibold">Action Plan</span>
                  </div>
                  {actionSteps.length > 0 && (
                    <span className="rc-badge bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30 px-2 py-0.5 rounded-full text-xs font-bold">
                      {actionSteps.filter((s) => s.status !== 'completed').length} pending
                    </span>
                  )}
                </div>

                {actionSteps.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center bg-[#060d19]/50 rounded-xl border border-[#12233e] border-dashed p-6">
                    <div className="w-12 h-12 rounded-full bg-[#12233e] flex items-center justify-center mb-3">
                      <Target size={24} className="text-[#7a95b8]" />
                    </div>
                    <span className="text-sm font-medium text-white mb-1">No Action Plan</span>
                    <span className="text-xs text-[#7a95b8]">Ask AI to generate a strategy to see steps here</span>
                  </div>
                ) : (
                  <div className="space-y-3 overflow-y-auto flex-1 custom-scrollbar pr-2">
                    {actionSteps.map((step, i) => (
                      <div key={step.id} className="flex flex-col gap-2 bg-[#060d19] hover:bg-[#12233e]/50 border border-[#1e3a63] rounded-xl p-3 transition-all group shadow-sm">
                        <div className="flex items-start gap-3">
                          <button 
                            onClick={() => {
                              setActionSteps(prev => prev.map((s) => 
                                s.id === step.id ? { ...s, status: s.status === 'completed' ? 'pending' : 'completed' } : s
                              ));
                            }}
                            className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors border-2 ${
                              step.status === 'completed' 
                                ? 'bg-[#22c55e] border-[#22c55e] text-white' 
                                : 'bg-transparent border-[#3b82f6] text-transparent hover:bg-[#3b82f6]/20'
                            }`}
                          >
                            <CheckCircle size={14} className={step.status === 'completed' ? 'opacity-100' : 'opacity-0'} />
                          </button>
                          <div className="flex-1 min-w-0">
                            <span className={`text-sm font-medium block truncate ${step.status === 'completed' ? 'text-[#7a95b8] line-through' : 'text-[#c8d8ec]'}`}>
                              {step.title}
                            </span>
                            <div className="flex items-center gap-3 mt-2">
                              <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider ${
                                step.priority === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                              }`}>
                                {step.priority}
                              </span>
                              <span className="text-[10px] text-[#7a95b8] flex items-center gap-1">
                                <Calendar size={10} />
                                {new Date(step.dueDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Portfolio Tab Content (Chart 2 & 3, Table 1 & 2) */}
          {activeTab === "portfolio" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="rc-card bg-gradient-to-br from-[#0a1428] to-[#060d19] border-[#1e3a63]/50 shadow-lg">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <PieChart size={18} className="text-[#3b82f6]" />
                  Current Allocation
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={MOCK_PORTFOLIO} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e3a63" horizontal={false} />
                      <XAxis type="number" stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} />
                      <YAxis dataKey="asset" type="category" stroke="#7a95b8" tick={{ fill: '#c8d8ec', fontSize: 12 }} width={80} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#0a1428', borderColor: '#1e3a63', color: '#c8d8ec', borderRadius: '8px' }}
                        cursor={{ fill: '#12233e', opacity: 0.4 }}
                        formatter={(val: number) => [`${val}%`, 'Allocation']}
                      />
                      <Bar dataKey="allocation" radius={[0, 4, 4, 0]}>
                        {MOCK_PORTFOLIO.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rc-card bg-[#0a1428] border-[#1e3a63]/50">
                <h3 className="text-white font-semibold mb-4">Asset Details</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#1e3a63]">
                        <th className="py-3 px-4 text-xs font-medium text-[#7a95b8] uppercase tracking-wider">Asset Class</th>
                        <th className="py-3 px-4 text-xs font-medium text-[#7a95b8] uppercase tracking-wider text-right">Value</th>
                        <th className="py-3 px-4 text-xs font-medium text-[#7a95b8] uppercase tracking-wider text-right">Return</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_PORTFOLIO.map((item, i) => (
                        <tr key={i} className="border-b border-[#1e3a63]/50 hover:bg-[#12233e]/50 transition-colors cursor-pointer" onClick={() => setSelectedPortfolioItem(item.asset)}>
                          <td className="py-3 px-4 text-sm text-white font-medium flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                            {item.asset}
                          </td>
                          <td className="py-3 px-4 text-sm text-[#c8d8ec] text-right">${item.value.toLocaleString()}</td>
                          <td className={`py-3 px-4 text-sm text-right font-medium ${item.return >= 0 ? 'text-[#22c55e]' : 'text-red-400'}`}>
                            {item.return >= 0 ? '+' : ''}{item.return}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tax Tab Content (Table 3) */}
          {activeTab === "tax" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="rc-card bg-gradient-to-br from-[#0a1428] to-[#060d19] border-[#1e3a63]/50 shadow-lg">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <DollarSign size={18} className="text-[#22c55e]" />
                    Tax Optimization Strategies
                  </h3>
                  <span className="text-2xl font-bold text-[#22c55e]">
                    ${MOCK_TAX_STRATEGIES.reduce((sum, s) => sum + s.estimatedSavings, 0).toLocaleString()}
                  </span>
                </div>
                
                <div className="space-y-4">
                  {MOCK_TAX_STRATEGIES.map((strategy, i) => (
                    <div key={i} className="bg-[#060d19] border border-[#1e3a63] rounded-xl p-4 hover:border-[#22c55e]/50 transition-colors group">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-white font-medium group-hover:text-[#22c55e] transition-colors">{strategy.name}</h4>
                        <span className="text-[#22c55e] font-bold">+${strategy.estimatedSavings.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-3">
                        <span className={`text-xs px-2 py-1 rounded-md border ${
                          strategy.difficulty === 'Low' ? 'bg-[#22c55e]/10 border-[#22c55e]/30 text-[#22c55e]' :
                          strategy.difficulty === 'Medium' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                          'bg-red-500/10 border-red-500/30 text-red-400'
                        }`}>
                          Complexity: {strategy.difficulty}
                        </span>
                        <span className="text-xs text-[#7a95b8] flex items-center gap-1">
                          <Clock size={12} /> {strategy.timeframe}
                        </span>
                      </div>
                      <button 
                        onClick={() => sendMessage(`Tell me more about implementing a ${strategy.name} strategy`)}
                        className="mt-4 w-full py-2 bg-[#12233e] hover:bg-[#1e3a63] text-white text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        Ask AI for details <Bot size={14} className="text-[#22c55e]" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Scenarios Tab Content (Chart 4 & 5, Table 4) */}
          {activeTab === "scenarios" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="rc-card bg-gradient-to-br from-[#0a1428] to-[#060d19] border-[#1e3a63]/50 shadow-lg">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp size={18} className="text-[#8b5cf6]" />
                  10-Year Growth Projection
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={MOCK_SCENARIOS} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorBase" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e3a63" vertical={false} />
                      <XAxis dataKey="year" stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} />
                      <YAxis stroke="#7a95b8" tick={{ fill: '#7a95b8', fontSize: 12 }} tickFormatter={(val) => `$${(val/1000000).toFixed(1)}M`} width={60} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#0a1428', borderColor: '#1e3a63', color: '#c8d8ec', borderRadius: '8px' }}
                        formatter={(val: number) => [`$${val.toLocaleString(undefined, {maximumFractionDigits: 0})}`, '']}
                        labelStyle={{ color: '#fff', fontWeight: 'bold', marginBottom: '8px' }}
                      />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px', color: '#c8d8ec' }}/>
                      <Area type="monotone" dataKey="base" name="Base Case (5%)" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorBase)" />
                      <Line type="monotone" dataKey="optimistic" name="Optimistic (8%)" stroke="#22c55e" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                      <Line type="monotone" dataKey="pessimistic" name="Pessimistic (2%)" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rc-card bg-[#0a1428] border-[#1e3a63]/50">
                <h3 className="text-white font-semibold mb-4">Scenario Data Table</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#1e3a63]">
                        <th className="py-2 px-3 text-xs font-medium text-[#7a95b8] uppercase">Year</th>
                        <th className="py-2 px-3 text-xs font-medium text-[#7a95b8] uppercase text-right">Pessimistic</th>
                        <th className="py-2 px-3 text-xs font-medium text-[#7a95b8] uppercase text-right">Base</th>
                        <th className="py-2 px-3 text-xs font-medium text-[#7a95b8] uppercase text-right">Optimistic</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_SCENARIOS.slice(0, 5).map((row, i) => (
                        <tr key={i} className="border-b border-[#1e3a63]/30 hover:bg-[#12233e]/30">
                          <td className="py-2 px-3 text-sm text-white">{row.year}</td>
                          <td className="py-2 px-3 text-sm text-red-400 text-right">${Math.round(row.pessimistic).toLocaleString()}</td>
                          <td className="py-2 px-3 text-sm text-[#3b82f6] font-medium text-right">${Math.round(row.base).toLocaleString()}</td>
                          <td className="py-2 px-3 text-sm text-[#22c55e] text-right">${Math.round(row.optimistic).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="text-center mt-3">
                    <button className="text-xs text-[#3b82f6] hover:text-white transition-colors">View Full Table</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Insights Tab Content (Chart 6, Table 5 & 6) */}
          {activeTab === "insights" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="rc-card bg-gradient-to-br from-[#0a1428] to-[#060d19] border-[#1e3a63]/50 shadow-lg">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <Zap size={18} className="text-[#f59e0b]" />
                  Risk Profile Analysis
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                      { subject: 'Market Risk', A: 120, fullMark: 150 },
                      { subject: 'Inflation', A: 98, fullMark: 150 },
                      { subject: 'Liquidity', A: 86, fullMark: 150 },
                      { subject: 'Longevity', A: 99, fullMark: 150 },
                      { subject: 'Tax', A: 85, fullMark: 150 },
                      { subject: 'Concentration', A: 65, fullMark: 150 },
                    ]}>
                      <PolarGrid stroke="#1e3a63" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#c8d8ec', fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
                      <Radar name="Current Client" dataKey="A" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.4} />
                      <RechartsTooltip contentStyle={{ backgroundColor: '#0a1428', borderColor: '#1e3a63', color: '#fff' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rc-card bg-[#0a1428] border-[#1e3a63]/50">
                <h3 className="text-white font-semibold mb-4">AI Generated Insights</h3>
                <div className="space-y-3">
                  {[
                    { title: "High Cash Drag", desc: "Current cash allocation (5%) exceeds target (2%) by 3%. Recommend deploying to short-term fixed income.", impact: "Medium" },
                    { title: "Concentration Risk", desc: "Top 3 tech holdings account for 22% of total equity. Consider rebalancing.", impact: "High" },
                    { title: "Required Minimum Distribution", desc: "Client turns 73 this year. RMD calculation and withdrawal strategy needed by Q4.", impact: "High" }
                  ].map((insight, i) => (
                    <div key={i} className="p-3 bg-[#060d19] border border-[#1e3a63] rounded-lg border-l-4" style={{ borderLeftColor: insight.impact === 'High' ? '#ef4444' : '#f59e0b' }}>
                      <h4 className="text-sm font-bold text-white mb-1">{insight.title}</h4>
                      <p className="text-xs text-[#c8d8ec] mb-2">{insight.desc}</p>
                      <button 
                        onClick={() => sendMessage(`How should we address the ${insight.title} issue?`)}
                        className="text-xs text-[#3b82f6] hover:text-white transition-colors flex items-center gap-1"
                      >
                        Ask AI <ArrowUpRight size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <AppShell>
      {renderHeader()}
      {renderSettingsPanel()}
      {renderShortcutsPanel()}
      
      <div className="px-6 pb-8 pt-6 max-w-[1600px] mx-auto">
        {renderFilters()}
        {renderChatInterface()}
      </div>
      
      <PageInsights pageId="advisor-chat" />
    </AppShell>
  );
}
