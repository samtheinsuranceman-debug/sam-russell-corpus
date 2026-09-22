/**
 * Patient Portal — Solo AI Advisor Interaction Hub
 * Landing page with tool grid + full-screen Dr. Buddy chat below.
 */
import { useState, useRef, useEffect } from "react";
import { useLocation, Link } from "wouter";
import {
  Bot, Send, Brain, FileText, BookOpen, Heart, Activity,
  Shield, ChevronRight, MessageCircle, ClipboardList,
  Pill, Sparkles, User, LogIn, Home, AlertTriangle,
  Calendar, TrendingUp, Dna, Zap, BarChart3,
  Stethoscope, ArrowRight, Mic, Phone, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { cn } from "@/lib/utils";
import { detectCrisisTier, CrisisDetectionBanner, type CrisisTier } from "@/components/CrisisDetectionBanner";
import { useBrain } from "@/contexts/UnifiedDataBus";
import { SupportModeSelector } from "@/components/SupportModeSelector";
import { SUPPORT_MODE_COPY, useSupportMode } from "@/contexts/SupportModeContext";
import { CLINICAL_TOOLS_ENABLED } from "@/lib/releasePolicy";
import { usePageTitle } from "@/lib/usePageTitle";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  isCrisis?: boolean;
}

// ─── Patient Tools ──────────────────────────────────────────────────────────
const patientTools = [
  { label: "AI Advisor", href: "/patient#chat", icon: Bot, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20", desc: "Talk to Doctor Buddy in the communication style you choose" },
  { label: "Adaptive Support", href: "/support-lab", icon: Sparkles, color: "text-fuchsia-400", bg: "bg-fuchsia-500/10 border-fuchsia-500/20", desc: "50 reflection, decision, regulation, relationship, and privacy tools" },
  { label: "Assessment", href: "/assessment", icon: ClipboardList, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", desc: "Non-diagnostic self-check to organize your own observations" },
  { label: "My Reports", href: "/dashboard", icon: FileText, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20", desc: "Assessment summaries, history, and clinician-preparation reports" },
  { label: "Digital Twin", href: "/digital-twin", icon: Dna, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20", desc: "Your 10-domain mental health model" },
  { label: "Mood Journal", href: "/journal", icon: BookOpen, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", desc: "Private self-reflection and optional mood logging" },
  { label: "Wellness Plan", href: "/wellness-plan", icon: Heart, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20", desc: "Everyday wellness routine based on goals you choose" },
  { label: "Medications", href: "/medications", icon: Pill, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", desc: "Organize medications you already use and keep a personal dose log" },
  { label: "Check-In", href: "/progress", icon: Activity, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20", desc: "Quick self-reported daily check-in" },
  { label: "Life Maps", href: "/life-maps", icon: Calendar, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20", desc: "Visualize life events & their impact" },
  { label: "Risk Score", href: "/prs", icon: TrendingUp, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20", desc: "AI-assessed psychiatric risk score" },
  { label: "Vital Signs", href: "/vital-signs", icon: BarChart3, color: "text-teal-400", bg: "bg-teal-500/10 border-teal-500/20", desc: "8 mental health vital sign metrics" },
  { label: "Digital Twin", href: "/digital-twin", icon: Eye, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/20", desc: "Your simulated mental health model" },
  { label: "Conditions", href: "/conditions", icon: Stethoscope, color: "text-sky-400", bg: "bg-sky-500/10 border-sky-500/20", desc: "General condition education and reference information" },
  { label: "Journal", href: "/journal", icon: Heart, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", desc: "Private self-reflection journal" },
  { label: "Crisis Help", href: "/crisis", icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", desc: "988 hotline & emergency resources" },
].filter(item => CLINICAL_TOOLS_ENABLED || !["/dashboard", "/digital-twin", "/life-maps", "/prs", "/vital-signs"].includes(item.href));

const sidebarNavItems = [
  { label: "Home", href: "/patient", icon: Home, color: "text-violet-400" },
  { label: "AI Advisor", href: "/patient#chat", icon: Bot, color: "text-violet-400" },
  { label: "Adaptive Support", href: "/support-lab", icon: Sparkles, color: "text-fuchsia-400" },
  { label: "Assessment", href: "/assessment", icon: ClipboardList, color: "text-emerald-400" },
  { label: "My Reports", href: "/dashboard", icon: FileText, color: "text-cyan-400" },
  { label: "Digital Twin", href: "/digital-twin", icon: Dna, color: "text-pink-400" },
  { label: "Mood Journal", href: "/journal", icon: BookOpen, color: "text-amber-400" },
  { label: "Wellness Plan", href: "/wellness-plan", icon: Heart, color: "text-rose-400" },
  { label: "Medications", href: "/medications", icon: Pill, color: "text-blue-400" },
  { label: "Check-In", href: "/progress", icon: Activity, color: "text-green-400" },
  { label: "Life Maps", href: "/life-maps", icon: Calendar, color: "text-purple-400" },
  { label: "Risk Score", href: "/prs", icon: TrendingUp, color: "text-orange-400" },
  { label: "Vital Signs", href: "/vital-signs", icon: BarChart3, color: "text-teal-400" },
  { label: "Crisis Help", href: "/crisis", icon: AlertTriangle, color: "text-red-400" },
].filter(item => CLINICAL_TOOLS_ENABLED || !["/dashboard", "/digital-twin", "/life-maps", "/prs", "/vital-signs"].includes(item.href));

export default function PatientPortal() {
  usePageTitle("Your space");
  const { user, isAuthenticated, loading } = useAuth();
  const { mode } = useSupportMode();
  const [, navigate] = useLocation();
  const [location] = useLocation();
  const [input, setInput] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Welcome to Doctor Buddy — an AI support and health-education tool. Choose Friend, Therapist, or Psychiatrist Zone to control how I communicate. Those modes change style, not credentials: I am not a licensed clinician.\n\nI can help you reflect, organize your observations, understand general mental-health information, prepare questions for your care team, and connect you with crisis resources when needed.\n\nWhat would be useful right now?",
      timestamp: Date.now(),
    },
  ]);
  const [crisisTier, setCrisisTier] = useState<CrisisTier>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatSectionRef = useRef<HTMLDivElement>(null);
  const brain = useBrain();

  const chatMutation = trpc.drBuddy.chat.useMutation({
    onSuccess: (data) => {
      const assistantMsg: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: "assistant",
        content: data.reply,
        timestamp: Date.now(),
        isCrisis: data.crisisDetected,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      if (data.crisisDetected) {
        setCrisisTier((prev) => prev ?? (data.urgent ? "tier1_emergency" : data.cssrsLevel >= 2 ? "tier2_high_risk" : "tier3_elevated"));
        brain.report("crisis_detected", { source: "patient_portal_chat" });
      }
    },
    onError: () => {
      setMessages((prev) => [...prev, {
        id: `err_${Date.now()}`,
        role: "assistant",
        content: "I'm sorry, I encountered an error processing your message. Please try again.",
        timestamp: Date.now(),
      }]);
    },
  });

  const { data: twinData } = trpc.digitalTwin.getMyTwin.useQuery(undefined, {
    enabled: isAuthenticated && CLINICAL_TOOLS_ENABLED,
    retry: false,
  });
  const { data: reports } = trpc.report.myReports.useQuery(undefined, { enabled: isAuthenticated && CLINICAL_TOOLS_ENABLED });
  const { data: journalData } = trpc.journal.list.useQuery({ limit: 10 }, { enabled: isAuthenticated });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle hash navigation to chat
  useEffect(() => {
    if (window.location.hash === "#chat") {
      setShowChat(true);
      setTimeout(() => chatSectionRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, []);

  const handleSend = () => {
    const text = input.trim();
    if (!text || chatMutation.isPending) return;
    const { tier } = detectCrisisTier(text);
    if (tier) setCrisisTier(tier);
    const userMsg: ChatMessage = { id: `msg_${Date.now()}`, role: "user", content: text, timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    brain.report("patient_portal_message_sent", { messageLength: text.length });
    chatMutation.mutate({
      message: text,
      supportMode: mode,
      history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content, timestamp: new Date(m.timestamp).toISOString() })),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleQuickAction = (text: string) => {
    setShowChat(true);
    setTimeout(() => {
      chatSectionRef.current?.scrollIntoView({ behavior: "smooth" });
      const userMsg: ChatMessage = { id: `msg_${Date.now()}`, role: "user", content: text, timestamp: Date.now() };
      setMessages((prev) => [...prev, userMsg]);
      chatMutation.mutate({
        message: text,
        supportMode: mode,
        history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content, timestamp: new Date(m.timestamp).toISOString() })),
      });
    }, 300);
  };

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500/40 border-t-violet-400 rounded-full animate-spin" />
      </div>
    );
  }

  // ─── Not Authenticated ─────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="h-20 w-20 rounded-2xl bg-violet-700/20 border border-violet-600/30 flex items-center justify-center mx-auto mb-6">
            <Bot className="h-10 w-10 text-violet-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">{CLINICAL_TOOLS_ENABLED ? "Patient Portal" : "My Space"}</h1>
          <p className="text-gray-400 text-sm mb-2">Your private AI-assisted support and education workspace.</p>
          <p className="text-gray-500 text-xs mb-8">Sign in to access Doctor Buddy, review your own information, and use adaptive support tools.</p>
          <div className="flex flex-col gap-3">
            <a href={getLoginUrl("/patient")}>
              <Button className="w-full bg-violet-600 hover:bg-violet-500 text-white">
                <LogIn className="w-4 h-4 mr-2" /> Sign In to My Space
              </Button>
            </a>
            <Link href="/assessment">
              <Button variant="outline" className="w-full border-violet-700/50 text-violet-300 hover:bg-violet-900/30">
                <Brain className="w-4 h-4 mr-2" /> Take Free Assessment (No Login)
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" className="w-full text-gray-500 hover:text-gray-300">
                <Home className="w-4 h-4 mr-2" /> Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Data ──────────────────────────────────────────────────────────────────
  const twin = twinData?.twin;
  const compositeScore = twin?.compositeScore ?? null;
  const unreadAlerts = (twin?.activeAlerts as any[] | undefined)?.filter((a: any) => !a.acknowledged).length ?? 0;
  const reportCount = reports?.length ?? 0;
  const journalCount = journalData?.length ?? 0;

  return (
    <div className="min-h-screen bg-[#070b14] flex">
      {/* ─── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className={cn(
        "fixed left-0 top-0 bottom-0 z-40 bg-gray-900/95 border-r border-violet-800/30 flex flex-col transition-all duration-300",
        sidebarOpen ? "w-60" : "w-16"
      )}>
        <div className="p-4 border-b border-violet-800/30">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="flex items-center gap-2 w-full">
            <div className="h-8 w-8 rounded-lg bg-violet-700/30 border border-violet-600/40 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-violet-400" />
            </div>
            {sidebarOpen && (
              <div className="text-left">
                <p className="text-sm font-bold text-white leading-none">{CLINICAL_TOOLS_ENABLED ? "Patient Portal" : "My Space"}</p>
                <p className="text-[10px] text-violet-400">AI support · not medical care</p>
              </div>
            )}
          </button>
        </div>

        {sidebarOpen && (
          <div className="px-4 py-3 border-b border-violet-800/20">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-violet-700/30 flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-violet-300" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-white truncate">{user?.name || "Member"}</p>
                <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            {compositeScore !== null && (
              <div className="mt-2 flex items-center gap-2">
                <div className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-medium",
                  compositeScore >= 70 ? "bg-green-900/40 text-green-400" :
                  compositeScore >= 40 ? "bg-yellow-900/40 text-yellow-400" :
                  "bg-red-900/40 text-red-400"
                )}>
                  Wellness: {compositeScore}/100
                </div>
              </div>
            )}
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {sidebarNavItems.map(({ label, href, icon: Icon, color }) => {
            const isActive = (href === "/patient" && location === "/patient") || (href !== "/patient" && location === href);
            return (
              <Link key={label} href={href.startsWith("/patient#") ? "/patient" : href}>
                <button
                  onClick={() => {
                    if (href === "/patient#chat") {
                      setShowChat(true);
                      setTimeout(() => chatSectionRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
                    }
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-0.5",
                    isActive ? "bg-violet-600/20 text-violet-300 border border-violet-700/30" : "text-gray-400 hover:text-white hover:bg-gray-800/60"
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", isActive ? color : "")} />
                  {sidebarOpen && <span className="truncate">{label}</span>}
                  {label === "Crisis Help" && unreadAlerts > 0 && sidebarOpen && (
                    <span className="ml-auto text-xs bg-red-600 text-white rounded-full px-1.5 py-0.5">{unreadAlerts}</span>
                  )}
                </button>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-violet-800/20">
          <Link href="/">
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800/40 transition-colors">
              <Home className="h-3.5 w-3.5" />
              {sidebarOpen && "Back to Doctor Buddy"}
            </button>
          </Link>
        </div>
      </aside>

      {/* ─── Main Content ─────────────────────────────────────────────────── */}
      <main className={cn("flex-1 min-h-screen transition-all duration-300", sidebarOpen ? "ml-60" : "ml-16")}>

        {/* ─── Hero Section ─────────────────────────────────────────────── */}
        <section className="relative px-6 pt-8 pb-6 border-b border-violet-800/20">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-transparent to-pink-900/10" />
          <div className="relative max-w-5xl mx-auto">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">
                  Welcome back, <span className="text-violet-400">{user?.name?.split(" ")[0] || "Patient"}</span>
                </h1>
                <p className="text-gray-400 text-sm max-w-lg">
                  Your personal mental health command center. Access all your tools, track your progress, and talk to Dr. Buddy anytime.
                </p>
              </div>
              <div className="flex items-center gap-3">
                {compositeScore !== null && (
                  <div className={cn(
                    "px-4 py-2 rounded-xl border text-center",
                    compositeScore >= 70 ? "bg-green-900/20 border-green-700/30" :
                    compositeScore >= 40 ? "bg-yellow-900/20 border-yellow-700/30" :
                    "bg-red-900/20 border-red-700/30"
                  )}>
                    <p className="text-2xl font-bold text-white">{compositeScore}</p>
                    <p className={cn("text-xs font-medium",
                      compositeScore >= 70 ? "text-green-400" : compositeScore >= 40 ? "text-yellow-400" : "text-red-400"
                    )}>Wellness Score</p>
                  </div>
                )}
                <div className="px-4 py-2 rounded-xl border bg-cyan-900/20 border-cyan-700/30 text-center">
                  <p className="text-2xl font-bold text-white">{reportCount}</p>
                  <p className="text-xs font-medium text-cyan-400">Reports</p>
                </div>
                <div className="px-4 py-2 rounded-xl border bg-amber-900/20 border-amber-700/30 text-center">
                  <p className="text-2xl font-bold text-white">{journalCount}</p>
                  <p className="text-xs font-medium text-amber-400">Journal Entries</p>
                </div>
              </div>
            </div>

            {/* Quick Start Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
              {[
                { label: "Talk to Dr. Buddy", icon: MessageCircle, color: "violet", action: () => { setShowChat(true); setTimeout(() => chatSectionRef.current?.scrollIntoView({ behavior: "smooth" }), 100); } },
                { label: "Start Assessment", icon: ClipboardList, color: "emerald", action: () => navigate("/assessment") },
                { label: "View Reports", icon: FileText, color: "cyan", action: () => navigate("/dashboard") },
                { label: "Check Vital Signs", icon: BarChart3, color: "teal", action: () => navigate("/vital-signs") },
              ].map(({ label, icon: Icon, color, action }) => (
                <button
                  key={label}
                  onClick={action}
                  className={`flex items-center gap-3 p-4 rounded-xl border bg-${color}-500/5 border-${color}-500/20 hover:bg-${color}-500/10 hover:border-${color}-500/40 transition-all group`}
                >
                  <div className={`h-10 w-10 rounded-lg bg-${color}-500/15 flex items-center justify-center shrink-0`}>
                    <Icon className={`h-5 w-5 text-${color}-400`} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white">{label}</p>
                    <p className="text-xs text-gray-500">Quick action</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-600 ml-auto group-hover:text-gray-400 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Crisis Banner ────────────────────────────────────────────── */}
        {crisisTier && (
          <div className="px-6 pt-4 max-w-5xl mx-auto">
            <CrisisDetectionBanner tier={crisisTier} context="Patient Portal" onDismiss={() => setCrisisTier(null)} />
          </div>
        )}

        {/* ─── Nudge / Recommendation ───────────────────────────────────── */}
        {isAuthenticated && (
          <div className="px-6 pt-6 max-w-5xl mx-auto">
            <div className="flex gap-3 overflow-x-auto pb-2">
              {!journalCount && (
                <Link href="/journal">
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 transition-colors shrink-0 cursor-pointer">
                    <BookOpen className="h-4 w-4 text-amber-400" />
                    <span className="text-xs text-amber-300 font-medium">Start your first journal entry</span>
                    <ArrowRight className="h-3 w-3 text-amber-500" />
                  </div>
                </Link>
              )}
              {!reportCount && (
                <Link href="/assessment">
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 transition-colors shrink-0 cursor-pointer">
                    <ClipboardList className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs text-emerald-300 font-medium">Take your first assessment</span>
                    <ArrowRight className="h-3 w-3 text-emerald-500" />
                  </div>
                </Link>
              )}
              <button onClick={() => handleQuickAction("How am I doing today?")} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/15 transition-colors shrink-0">
                <Bot className="h-4 w-4 text-violet-400" />
                <span className="text-xs text-violet-300 font-medium">Ask Dr. Buddy: How am I doing?</span>
                <ArrowRight className="h-3 w-3 text-violet-500" />
              </button>
            </div>
          </div>
        )}

        {/* ─── Tool Grid ────────────────────────────────────────────────── */}
        <section className="px-6 py-8 max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-white">Your Tools</h2>
              <p className="text-sm text-gray-500 mt-0.5">All {patientTools.length} tools at your fingertips</p>
            </div>
            <Badge className="bg-violet-900/40 text-violet-300 border border-violet-700/30 text-xs">
              <Shield className="h-3 w-3 mr-1" /> Privacy controls enabled
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {patientTools.map(({ label, href, icon: Icon, color, bg, desc }) => (
              <Link key={label} href={href.startsWith("/patient#") ? "/patient" : href}>
                <button
                  onClick={() => {
                    if (href === "/patient#chat") {
                      setShowChat(true);
                      setTimeout(() => chatSectionRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
                    }
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 rounded-xl border transition-all hover:scale-[1.01] text-left group",
                    bg
                  )}
                >
                  <div className="h-10 w-10 rounded-lg bg-gray-800/60 flex items-center justify-center shrink-0">
                    <Icon className={cn("h-5 w-5", color)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-white">{label}</p>
                    <p className="text-xs text-gray-500 truncate">{desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-gray-400 shrink-0" />
                </button>
              </Link>
            ))}
          </div>
        </section>

        {/* ─── Dr. Buddy Chat Section ───────────────────────────────────── */}
        <section ref={chatSectionRef} className="border-t border-violet-800/20">
          {/* Chat toggle header */}
          <button
            onClick={() => setShowChat(!showChat)}
            className="w-full flex items-center justify-between px-6 py-4 bg-gray-900/50 hover:bg-gray-900/70 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-xl bg-violet-700/30 border border-violet-600/40 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-violet-400" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-400 rounded-full border-2 border-[#070b14]" />
              </div>
              <div className="text-left">
                <h2 className="text-lg font-bold text-white">Dr. Buddy — AI Advisor</h2>
                <p className="text-xs text-violet-400">Always available · Click to {showChat ? "collapse" : "expand"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-violet-900/40 text-violet-300 border border-violet-700/30 text-xs">
                <Sparkles className="h-3 w-3 mr-1" /> AI-Powered
              </Badge>
              <ChevronRight className={cn("h-5 w-5 text-gray-500 transition-transform", showChat && "rotate-90")} />
            </div>
          </button>

          {showChat && (
            <div className="flex flex-col" style={{ height: "70vh" }}>
              <div className="px-6 pt-4">
                <SupportModeSelector />
                <p className="text-[11px] text-gray-500 mt-2">{SUPPORT_MODE_COPY[mode].boundary}</p>
              </div>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                    {msg.role === "assistant" && (
                      <div className="h-8 w-8 rounded-full bg-violet-700/40 flex items-center justify-center mr-3 mt-1 shrink-0">
                        <Bot className="h-4 w-4 text-violet-300" />
                      </div>
                    )}
                    <div className={cn(
                      "max-w-[70%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                      msg.role === "user" ? "bg-violet-600 text-white rounded-tr-sm" :
                      msg.isCrisis ? "bg-red-900/40 border border-red-700/40 text-red-100 rounded-tl-sm" :
                      "bg-gray-800/80 text-gray-100 rounded-tl-sm border border-gray-700/30"
                    )}>
                      {msg.content}
                    </div>
                    {msg.role === "user" && (
                      <div className="h-8 w-8 rounded-full bg-emerald-700/30 flex items-center justify-center ml-3 mt-1 shrink-0">
                        <User className="h-4 w-4 text-emerald-300" />
                      </div>
                    )}
                  </div>
                ))}
                {chatMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="h-8 w-8 rounded-full bg-violet-700/40 flex items-center justify-center mr-3 mt-1 shrink-0">
                      <Bot className="h-4 w-4 text-violet-300" />
                    </div>
                    <div className="bg-gray-800/80 rounded-2xl rounded-tl-sm px-5 py-3.5 flex items-center gap-1.5 border border-gray-700/30">
                      <span className="h-2 w-2 bg-violet-400 rounded-full animate-bounce [animation-delay:0ms]" />
                      <span className="h-2 w-2 bg-violet-400 rounded-full animate-bounce [animation-delay:150ms]" />
                      <span className="h-2 w-2 bg-violet-400 rounded-full animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick actions for new conversations */}
              {messages.length <= 1 && (
                <div className="px-6 pb-2">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {[
                      { label: "Review my assessment", icon: ClipboardList },
                      { label: "How am I doing?", icon: TrendingUp },
                      { label: "Help me understand my report", icon: Brain },
                      { label: "Wellness tips", icon: Heart },
                    ].map(({ label, icon: Icon }) => (
                      <button
                        key={label}
                        onClick={() => handleQuickAction(label)}
                        className="flex items-center gap-2 p-3 rounded-xl border border-violet-800/30 bg-gray-800/40 hover:bg-violet-900/20 hover:border-violet-700/50 transition-all text-left"
                      >
                        <Icon className="h-4 w-4 text-violet-400 shrink-0" />
                        <span className="text-xs text-gray-300">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input area */}
              <div className="px-6 pb-4 pt-2 border-t border-violet-800/20 bg-gray-900/30">
                <div className="flex gap-3 items-end max-w-4xl mx-auto">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={SUPPORT_MODE_COPY[mode].placeholder}
                    className="resize-none min-h-[48px] max-h-[120px] bg-gray-800/80 border-violet-800/40 text-sm text-white placeholder:text-gray-500 focus:border-violet-500 rounded-xl"
                    rows={1}
                  />
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={!input.trim() || chatMutation.isPending}
                    className="bg-violet-600 hover:bg-violet-500 shrink-0 h-12 w-12 rounded-xl"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
                <p className="text-xs text-gray-600 mt-2 text-center">
                  Doctor Buddy is AI, not a licensed clinician. The three zones change communication style only. For emergencies call 911 or 988.
                </p>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
