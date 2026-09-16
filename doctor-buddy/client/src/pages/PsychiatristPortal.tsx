/**
 * Psychiatrist Portal — Clinician Patient Management Dashboard
 * Admin-only portal for psychiatrists to manage patients, view AI Whisperer
 * suggestions, review assessments, and monitor crisis alerts.
 */
import { useState, useMemo } from "react";
import { useLocation, Link } from "wouter";
import {
  Stethoscope, Users, Brain, AlertTriangle, FileText, Activity,
  Search, ChevronRight, Shield, Eye, MessageCircle, TrendingUp,
  Clock, User, LogIn, Home, Sparkles, Dna, BookOpen,
  ClipboardList, BarChart3, Bell, Settings, Pill, Edit3, Save, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────
interface PatientSummary {
  id: number;
  doctorUserId: number;
  patientUserId: number;
  clinicalNotes: string | null;
  whispererSuggestions: any[] | null;
  patientConsentGiven: boolean;
  assignedAt: Date;
  updatedAt: Date;
}

// ─── Sidebar Nav ─────────────────────────────────────────────────────────────
const psychiatristNavItems = [
  { label: "Overview", id: "overview", icon: BarChart3, color: "text-cyan-400" },
  { label: "My Patients", id: "patients", icon: Users, color: "text-violet-400" },
  { label: "AI Whisperer", id: "whisperer", icon: Brain, color: "text-pink-400" },
  { label: "Crisis Alerts", id: "alerts", icon: AlertTriangle, color: "text-red-400" },
  { label: "Reports", id: "reports", icon: FileText, color: "text-emerald-400" },
];

export default function PsychiatristPortal() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Fetch doctor's patients
  const { data: patients, isLoading: patientsLoading, refetch: refetchPatients } = trpc.drBuddy.getDoctorPatients.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
    retry: false,
  });

  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState("");

  // Patient detail query
  const { data: patientDetail, isLoading: detailLoading } = trpc.drBuddy.getPatientDetail.useQuery(
    { patientUserId: selectedPatientId! },
    { enabled: isAuthenticated && user?.role === "admin" && selectedPatientId !== null }
  );

  // Clinical notes mutation
  const updateNotesMutation = trpc.drBuddy.updateClinicalNotes.useMutation({
    onSuccess: () => {
      toast.success("Clinical notes saved");
      setEditingNotes(false);
      refetchPatients();
    },
    onError: (err) => toast.error(`Save failed: ${err.message}`),
  });

  // AI Whisperer mutation
  const whispererMutation = trpc.drBuddy.getWhispererSuggestions.useMutation({
    onSuccess: () => {
      toast.success("AI Whisperer analysis complete");
    },
    onError: (err) => {
      toast.error(`Whisperer error: ${err.message}`);
    },
  });

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500/40 border-t-cyan-400 rounded-full animate-spin" />
      </div>
    );
  }

  // ─── Not Authenticated ─────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="h-20 w-20 rounded-2xl bg-cyan-700/20 border border-cyan-600/30 flex items-center justify-center mx-auto mb-6">
            <Stethoscope className="h-10 w-10 text-cyan-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Psychiatrist Portal</h1>
          <p className="text-gray-400 text-sm mb-2">Clinician dashboard for patient management and AI-assisted care.</p>
          <p className="text-gray-500 text-xs mb-8">This portal is restricted to authorized clinicians. Sign in with your administrator account.</p>
          <div className="flex flex-col gap-3">
            <a href={getLoginUrl("/psychiatrist")}>
              <Button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white">
                <LogIn className="w-4 h-4 mr-2" /> Sign In as Clinician
              </Button>
            </a>
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

  // ─── Not Admin ─────────────────────────────────────────────────────────────
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="h-16 w-16 rounded-2xl bg-red-700/20 border border-red-600/30 flex items-center justify-center mx-auto mb-6">
            <Shield className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Access Restricted</h1>
          <p className="text-gray-400 text-sm mb-6">The Psychiatrist Portal is only available to authorized clinicians with administrator access.</p>
          <div className="flex flex-col gap-3">
            <Link href="/patient">
              <Button className="w-full bg-violet-600 hover:bg-violet-500 text-white">
                <User className="w-4 h-4 mr-2" /> Go to Patient Portal
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

  // ─── Authenticated Psychiatrist Portal ─────────────────────────────────────
  const patientList = patients ?? [];
  const filteredPatients = searchQuery
    ? patientList.filter((p: PatientSummary) =>
        String(p.patientUserId).includes(searchQuery) ||
        (p.clinicalNotes ?? "").toLowerCase().includes(searchQuery.toLowerCase())
      )
    : patientList;

  const handleWhisperer = (patientUserId: number) => {
    setSelectedPatientId(patientUserId);
    whispererMutation.mutate({ patientUserId });
  };

  return (
    <div className="min-h-screen bg-[#070b14] flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 bottom-0 z-40 bg-gray-900/95 border-r border-cyan-800/30 flex flex-col transition-all duration-300",
        sidebarOpen ? "w-60" : "w-16"
      )}>
        {/* Logo */}
        <div className="p-4 border-b border-cyan-800/30">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="flex items-center gap-2 w-full">
            <div className="h-8 w-8 rounded-lg bg-cyan-700/30 border border-cyan-600/40 flex items-center justify-center shrink-0">
              <Stethoscope className="h-4 w-4 text-cyan-400" />
            </div>
            {sidebarOpen && (
              <div className="text-left">
                <p className="text-sm font-bold text-white leading-none">Psychiatrist</p>
                <p className="text-[10px] text-cyan-400">Clinician Portal</p>
              </div>
            )}
          </button>
        </div>

        {/* Doctor info */}
        {sidebarOpen && (
          <div className="px-4 py-3 border-b border-cyan-800/20">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-cyan-700/30 flex items-center justify-center shrink-0">
                <Stethoscope className="h-4 w-4 text-cyan-300" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-white truncate">Dr. {user?.name || "Clinician"}</p>
                <p className="text-[10px] text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Badge className="bg-cyan-900/40 text-cyan-300 border border-cyan-700/30 text-[10px]">
                {patientList.length} Patient{patientList.length !== 1 ? "s" : ""}
              </Badge>
              <Badge className="bg-green-900/40 text-green-300 border border-green-700/30 text-[10px]">
                Admin
              </Badge>
            </div>
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-2 px-2">
          {psychiatristNavItems.map(({ label, id, icon: Icon, color }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-0.5",
                  isActive
                    ? "bg-cyan-600/20 text-cyan-300 border border-cyan-700/30"
                    : "text-gray-400 hover:text-white hover:bg-gray-800/60"
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", isActive ? color : "")} />
                {sidebarOpen && <span className="truncate">{label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer links */}
        <div className="p-3 border-t border-cyan-800/20 space-y-1">
          <Link href="/doctor">
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800/40 transition-colors">
              <Eye className="h-3.5 w-3.5" />
              {sidebarOpen && "Legacy Doctor Portal"}
            </button>
          </Link>
          <Link href="/">
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800/40 transition-colors">
              <Home className="h-3.5 w-3.5" />
              {sidebarOpen && "Back to Doctor Buddy"}
            </button>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className={cn(
        "flex-1 min-h-screen transition-all duration-300 p-6",
        sidebarOpen ? "ml-60" : "ml-16"
      )}>
        {/* ─── Overview Tab ─────────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Clinical Overview</h2>
              <p className="text-sm text-gray-400">Welcome back, Dr. {user?.name}. Here's your practice summary.</p>
            </div>

            {/* Stats cards — clickable */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gray-900/60 border-cyan-800/30 cursor-pointer hover:border-cyan-600/50 transition-colors" onClick={() => setActiveTab("patients")}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Total Patients</p>
                      <p className="text-2xl font-bold text-white">{patientList.length}</p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-cyan-700/20 flex items-center justify-center">
                      <Users className="h-5 w-5 text-cyan-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gray-900/60 border-emerald-800/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Active Cases</p>
                      <p className="text-2xl font-bold text-white">
                        {patientList.filter((p: PatientSummary) => p.patientConsentGiven).length}
                      </p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-emerald-700/20 flex items-center justify-center">
                      <Activity className="h-5 w-5 text-emerald-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gray-900/60 border-red-800/30 cursor-pointer hover:border-red-600/50 transition-colors" onClick={() => setActiveTab("alerts")}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Crisis Alerts</p>
                      <p className="text-2xl font-bold text-red-400">0</p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-red-700/20 flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-red-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gray-900/60 border-violet-800/30 cursor-pointer hover:border-violet-600/50 transition-colors" onClick={() => setActiveTab("whisperer")}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">AI Whisperer</p>
                      <p className="text-2xl font-bold text-violet-400">Ready</p>
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-violet-700/20 flex items-center justify-center">
                      <Brain className="h-5 w-5 text-violet-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick actions */}
            <Card className="bg-gray-900/60 border-gray-700/30">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-cyan-400" /> Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => setActiveTab("patients")}
                    className="flex items-center gap-3 p-4 rounded-xl border border-cyan-800/30 bg-gray-800/40 hover:bg-cyan-900/20 hover:border-cyan-700/50 transition-all text-left"
                  >
                    <Users className="h-5 w-5 text-cyan-400" />
                    <div>
                      <p className="text-sm font-medium text-white">View Patients</p>
                      <p className="text-xs text-gray-500">Manage your patient roster</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab("whisperer")}
                    className="flex items-center gap-3 p-4 rounded-xl border border-violet-800/30 bg-gray-800/40 hover:bg-violet-900/20 hover:border-violet-700/50 transition-all text-left"
                  >
                    <Brain className="h-5 w-5 text-violet-400" />
                    <div>
                      <p className="text-sm font-medium text-white">AI Whisperer</p>
                      <p className="text-xs text-gray-500">Get AI-powered clinical insights</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveTab("alerts")}
                    className="flex items-center gap-3 p-4 rounded-xl border border-red-800/30 bg-gray-800/40 hover:bg-red-900/20 hover:border-red-700/50 transition-all text-left"
                  >
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                    <div>
                      <p className="text-sm font-medium text-white">Crisis Alerts</p>
                      <p className="text-xs text-gray-500">Monitor patient safety flags</p>
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Recent patients */}
            {patientList.length > 0 && (
              <Card className="bg-gray-900/60 border-gray-700/30">
                <CardHeader>
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-gray-400" /> Recent Patients
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {patientList.slice(0, 5).map((p: PatientSummary) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-gray-700/30 bg-gray-800/30 hover:bg-gray-800/60 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedPatientId(p.patientUserId);
                          setActiveTab("patients");
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-violet-700/30 flex items-center justify-center">
                            <User className="h-4 w-4 text-violet-300" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">Patient #{p.patientUserId}</p>
                            <p className="text-xs text-gray-500">{p.clinicalNotes || "No notes"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={cn(
                            "text-[10px]",
                            p.patientConsentGiven ? "bg-green-900/40 text-green-300 border-green-700/30" :
                            "bg-gray-800/60 text-gray-400 border-gray-700/30"
                          )}>
                            {p.patientConsentGiven ? "active" : "pending"}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-gray-600" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {patientList.length === 0 && (
              <Card className="bg-gray-900/60 border-gray-700/30">
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No Patients Assigned</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Patients are assigned through the admin panel. Once assigned, their Digital Twin data, assessments, and AI Whisperer insights will appear here.
                  </p>
                  <Link href="/admin">
                    <Button className="bg-cyan-600 hover:bg-cyan-500">
                      <Settings className="w-4 h-4 mr-2" /> Go to Admin Panel
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* ─── Clinician Tool Grid ─────────────────────────────────── */}
            <Card className="bg-gray-900/60 border-gray-700/30">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-cyan-400" /> Clinician Tools
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { label: "Patient List", desc: "Search, filter, and manage all patients", icon: Users, color: "text-cyan-400", bg: "border-cyan-500/20", action: () => setActiveTab("patients") },
                    { label: "AI Whisperer", desc: "Generate automated patient insight briefs", icon: Brain, color: "text-pink-400", bg: "border-pink-500/20", action: () => setActiveTab("whisperer") },
                    { label: "Crisis Alerts", desc: "Monitor and respond to urgent alerts", icon: AlertTriangle, color: "text-red-400", bg: "border-red-500/20", action: () => setActiveTab("alerts") },
                    { label: "Clinical Notes", desc: "Access and edit patient notes", icon: Edit3, color: "text-emerald-400", bg: "border-emerald-500/20", action: () => setActiveTab("patients") },
                    { label: "Patient Reports", desc: "View diagnostic reports and histories", icon: FileText, color: "text-amber-400", bg: "border-amber-500/20", action: () => setActiveTab("reports") },
                    { label: "Admin Panel", desc: "Compliance audit logs and settings", icon: Shield, color: "text-violet-400", bg: "border-violet-500/20", action: () => navigate("/admin") },
                    { label: "Condition Library", desc: "DSM-5 condition reference", icon: BookOpen, color: "text-sky-400", bg: "border-sky-500/20", action: () => navigate("/conditions") },
                    { label: "Digital Twin Viewer", desc: "View patient mental health models", icon: Dna, color: "text-purple-400", bg: "border-purple-500/20", action: () => setActiveTab("patients") },
                    { label: "Medication Review", desc: "Review patient medications", icon: Pill, color: "text-blue-400", bg: "border-blue-500/20", action: () => setActiveTab("patients") },
                  ].map(({ label, desc, icon: Icon, color, bg, action }) => (
                    <button
                      key={label}
                      onClick={action}
                      className={`flex items-center gap-3 p-4 rounded-xl border ${bg} bg-gray-800/20 hover:bg-gray-800/50 transition-all text-left group`}
                    >
                      <div className="h-10 w-10 rounded-lg bg-gray-800/60 flex items-center justify-center shrink-0">
                        <Icon className={`h-5 w-5 ${color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white">{label}</p>
                        <p className="text-xs text-gray-500 truncate">{desc}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-gray-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ─── Patients Tab ─────────────────────────────────────────────────── */}
        {activeTab === "patients" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">My Patients</h2>
                <p className="text-sm text-gray-400">{patientList.length} patient{patientList.length !== 1 ? "s" : ""} assigned to your care</p>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search patients..."
                  className="pl-9 bg-gray-800/60 border-gray-700/40 text-white placeholder:text-gray-500"
                />
              </div>
            </div>

            {patientsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-cyan-500/40 border-t-cyan-400 rounded-full animate-spin" />
              </div>
            ) : filteredPatients.length === 0 ? (
              <Card className="bg-gray-900/60 border-gray-700/30">
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {searchQuery ? "No Matching Patients" : "No Patients Yet"}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {searchQuery ? "Try a different search term." : "Patients will appear here once assigned through the admin panel."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredPatients.map((p: PatientSummary) => (
                  <Card key={p.id} className={cn(
                    "bg-gray-900/60 border-gray-700/30 hover:border-cyan-700/40 transition-all cursor-pointer",
                    selectedPatientId === p.patientUserId && "border-cyan-600/50 bg-cyan-900/10"
                  )}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-violet-700/20 border border-violet-600/30 flex items-center justify-center">
                            <User className="h-6 w-6 text-violet-300" />
                          </div>
                          <div>
                            <p className="text-base font-semibold text-white">Patient #{p.patientUserId}</p>
                            <p className="text-xs text-gray-500">
                              Assigned: {new Date(p.assignedAt).toLocaleDateString()}
                            </p>
                            {p.clinicalNotes && <p className="text-xs text-gray-400 mt-1">{p.clinicalNotes}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={cn(
                            "text-xs",
                            p.patientConsentGiven ? "bg-green-900/40 text-green-300 border-green-700/30" :
                            "bg-gray-800/60 text-gray-400 border-gray-700/30"
                          )}>
                            {p.patientConsentGiven ? "active" : "pending"}
                          </Badge>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleWhisperer(p.patientUserId);
                            }}
                            disabled={whispererMutation.isPending && selectedPatientId === p.patientUserId}
                            className="bg-violet-600 hover:bg-violet-500 text-xs"
                          >
                            <Brain className="h-3.5 w-3.5 mr-1" />
                            {whispererMutation.isPending && selectedPatientId === p.patientUserId
                              ? "Analyzing..."
                              : "AI Whisperer"}
                          </Button>
                        </div>
                      </div>

                      {/* Whisperer results */}
                      {whispererMutation.data && selectedPatientId === p.patientUserId && (
                        <div className="mt-4 p-4 rounded-xl bg-violet-900/20 border border-violet-700/30">
                          <div className="flex items-center gap-2 mb-3">
                            <Brain className="h-4 w-4 text-violet-400" />
                            <p className="text-sm font-semibold text-violet-300">AI Whisperer Insights</p>
                          </div>
                           <div className="space-y-3">
                            {typeof whispererMutation.data.suggestions === "string"
                              ? <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{whispererMutation.data.suggestions}</p>
                              : Array.isArray(whispererMutation.data.suggestions)
                                ? (whispererMutation.data.suggestions as any[]).map((s: any, i: number) => (
                                    <div key={i} className="p-3 rounded-lg border border-violet-800/20 bg-gray-800/30">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Badge className="text-[10px] bg-violet-900/40 text-violet-300 border-violet-700/30">{s.category}</Badge>
                                        {s.urgency && <Badge className="text-[10px] bg-amber-900/40 text-amber-300 border-amber-700/30">{s.urgency}</Badge>}
                                      </div>
                                      <p className="text-sm font-medium text-white">{s.title}</p>
                                      {s.rationale && <p className="text-xs text-gray-400 mt-1">{s.rationale}</p>}
                                    </div>
                                  ))
                                : <p className="text-sm text-gray-400">No suggestions available.</p>
                            }
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            {/* ─── Patient Detail Panel ─────────────────────────────────── */}
            {selectedPatientId !== null && (
              <Card className="bg-gray-900/60 border-cyan-800/30 mt-4">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                      <User className="h-5 w-5 text-cyan-400" />
                      Patient #{selectedPatientId} — Detail View
                    </CardTitle>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedPatientId(null)} className="text-gray-400 hover:text-white">
                      <ArrowLeft className="h-4 w-4 mr-1" /> Close
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {detailLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="w-6 h-6 border-2 border-cyan-500/40 border-t-cyan-400 rounded-full animate-spin" />
                    </div>
                  ) : patientDetail ? (
                    <>
                      {/* Patient Info */}
                      {patientDetail.user && (
                        <div className="p-4 rounded-xl border border-gray-700/30 bg-gray-800/30">
                          <p className="text-xs text-gray-500 mb-1">Patient Information</p>
                          <p className="text-sm text-white font-medium">{patientDetail.user.name || "Anonymous"}</p>
                          <p className="text-xs text-gray-400">{patientDetail.user.email}</p>
                          <p className="text-xs text-gray-500 mt-1">Registered: {new Date(patientDetail.user.createdAt).toLocaleDateString()}</p>
                        </div>
                      )}

                      {/* Clinical Notes — Editable */}
                      <div className="p-4 rounded-xl border border-cyan-800/30 bg-gray-800/30">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-medium text-cyan-300">Clinical Notes</p>
                          {editingNotes ? (
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" onClick={() => setEditingNotes(false)} className="text-gray-400 hover:text-white text-xs h-7">
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => updateNotesMutation.mutate({ patientUserId: selectedPatientId, notes: notesText })}
                                disabled={updateNotesMutation.isPending}
                                className="bg-cyan-600 hover:bg-cyan-500 text-xs h-7"
                              >
                                <Save className="h-3 w-3 mr-1" />
                                {updateNotesMutation.isPending ? "Saving..." : "Save"}
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const currentPatient = patientList.find((p: PatientSummary) => p.patientUserId === selectedPatientId);
                                setNotesText(currentPatient?.clinicalNotes || "");
                                setEditingNotes(true);
                              }}
                              className="text-cyan-400 hover:text-cyan-300 text-xs h-7"
                            >
                              <Edit3 className="h-3 w-3 mr-1" /> Edit
                            </Button>
                          )}
                        </div>
                        {editingNotes ? (
                          <Textarea
                            value={notesText}
                            onChange={(e) => setNotesText(e.target.value)}
                            placeholder="Enter clinical notes for this patient..."
                            className="bg-gray-900/60 border-gray-700/40 text-sm text-white placeholder:text-gray-500 min-h-[100px]"
                          />
                        ) : (
                          <p className="text-sm text-gray-300 whitespace-pre-wrap">
                            {patientList.find((p: PatientSummary) => p.patientUserId === selectedPatientId)?.clinicalNotes || "No clinical notes yet. Click Edit to add notes."}
                          </p>
                        )}
                      </div>

                      {/* Digital Twin Summary */}
                      {patientDetail.twin && (
                        <div className="p-4 rounded-xl border border-pink-800/30 bg-gray-800/30">
                          <p className="text-xs font-medium text-pink-300 mb-2">Digital Twin — Latest Snapshot</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {patientDetail.twin.domainScores && typeof patientDetail.twin.domainScores === "object" &&
                              Object.entries(patientDetail.twin.domainScores as Record<string, number>).slice(0, 8).map(([domain, score]) => (
                                <div key={domain} className="p-2 rounded-lg border border-gray-700/30 bg-gray-900/40 text-center">
                                  <p className="text-[10px] text-gray-500 capitalize">{domain.replace(/([A-Z])/g, " $1").trim()}</p>
                                  <p className={cn(
                                    "text-lg font-bold",
                                    (score as number) >= 70 ? "text-green-400" : (score as number) >= 40 ? "text-yellow-400" : "text-red-400"
                                  )}>{score}</p>
                                </div>
                              ))
                            }
                          </div>
                          <p className="text-xs text-gray-500 mt-2">Composite: {patientDetail.twin.compositeScore ?? "N/A"}/100</p>
                        </div>
                      )}

                      {/* Assessment History */}
                      <div className="p-4 rounded-xl border border-emerald-800/30 bg-gray-800/30">
                        <p className="text-xs font-medium text-emerald-300 mb-2">Assessment History ({patientDetail.assessments.length})</p>
                        {patientDetail.assessments.length > 0 ? (
                          <div className="space-y-2">
                            {patientDetail.assessments.map((a: any) => (
                              <div key={a.id} className="flex items-center justify-between p-2 rounded-lg border border-gray-700/20 bg-gray-900/30">
                                <div>
                                  <p className="text-xs text-white">Assessment #{a.id}</p>
                                  <p className="text-[10px] text-gray-500">{new Date(a.createdAt).toLocaleString()}</p>
                                </div>
                                <Badge className={cn(
                                  "text-[10px]",
                                  a.status === "completed" ? "bg-green-900/40 text-green-300 border-green-700/30" :
                                  a.status === "in_progress" ? "bg-yellow-900/40 text-yellow-300 border-yellow-700/30" :
                                  "bg-gray-800/60 text-gray-400 border-gray-700/30"
                                )}>{a.status}</Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500">No assessments found.</p>
                        )}
                      </div>

                      {/* Diagnostic Reports */}
                      <div className="p-4 rounded-xl border border-blue-800/30 bg-gray-800/30">
                        <p className="text-xs font-medium text-blue-300 mb-2">Diagnostic Reports ({patientDetail.reports.length})</p>
                        {patientDetail.reports.length > 0 ? (
                          <div className="space-y-2">
                            {patientDetail.reports.map((r: any) => (
                              <div key={r.id} className="flex items-center justify-between p-2 rounded-lg border border-gray-700/20 bg-gray-900/30">
                                <div>
                                  <p className="text-xs text-white">Report #{r.id}</p>
                                  <p className="text-[10px] text-gray-500">{new Date(r.createdAt).toLocaleString()}</p>
                                  {r.prsScore !== null && (
                                    <p className="text-[10px] text-cyan-400">PRS: {r.prsScore}/100</p>
                                  )}
                                </div>
                                <Badge className="text-[10px] bg-blue-900/40 text-blue-300 border-blue-700/30">View</Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500">No diagnostic reports found.</p>
                        )}
                      </div>

                      {/* Crisis Events */}
                      <div className="p-4 rounded-xl border border-red-800/30 bg-gray-800/30">
                        <p className="text-xs font-medium text-red-300 mb-2">Crisis Events ({patientDetail.crisisEvents.length})</p>
                        {patientDetail.crisisEvents.length > 0 ? (
                          <div className="space-y-2">
                            {patientDetail.crisisEvents.map((c: any) => (
                              <div key={c.id} className="flex items-center justify-between p-2 rounded-lg border border-red-800/20 bg-red-900/10">
                                <div>
                                  <p className="text-xs text-white">{c.eventType}</p>
                                  <p className="text-[10px] text-gray-500">{new Date(c.createdAt).toLocaleString()}</p>
                                </div>
                                <Badge className="text-[10px] bg-red-900/40 text-red-300 border-red-700/30">{c.severity || "flagged"}</Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-green-400">No crisis events recorded.</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400">Unable to load patient details.</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
        {/* ─── AI Whisperer Tab ─────────────────────────────────────────────── */}
        {activeTab === "whisperer" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">AI Whisperer</h2>
              <p className="text-sm text-gray-400">AI-powered clinical decision support. Select a patient to generate insights.</p>
            </div>

            <Card className="bg-gray-900/60 border-violet-800/30">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-violet-700/20 border border-violet-600/30 flex items-center justify-center shrink-0">
                    <Brain className="h-6 w-6 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">How AI Whisperer Works</h3>
                    <p className="text-sm text-gray-400 leading-relaxed mb-4">
                      The AI Whisperer analyzes a patient's complete Digital Twin — including assessment history, mood journal entries,
                      medication logs, vital signs, and behavioral patterns — to generate clinician-facing insights. These suggestions
                      are designed to augment your clinical judgment, not replace it.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-3 rounded-lg border border-violet-800/30 bg-gray-800/30">
                        <p className="text-xs font-medium text-violet-300 mb-1">Treatment Suggestions</p>
                        <p className="text-xs text-gray-500">Evidence-based treatment modifications based on patient trajectory</p>
                      </div>
                      <div className="p-3 rounded-lg border border-violet-800/30 bg-gray-800/30">
                        <p className="text-xs font-medium text-violet-300 mb-1">Risk Flags</p>
                        <p className="text-xs text-gray-500">Early warning indicators from behavioral and self-report data</p>
                      </div>
                      <div className="p-3 rounded-lg border border-violet-800/30 bg-gray-800/30">
                        <p className="text-xs font-medium text-violet-300 mb-1">Progress Analysis</p>
                        <p className="text-xs text-gray-500">Longitudinal trends in symptom severity and wellness scores</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Patient selector for whisperer */}
            {patientList.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-300">Select a patient to analyze:</p>
                {patientList.map((p: PatientSummary) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-700/30 bg-gray-900/40 hover:bg-gray-800/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-violet-700/30 flex items-center justify-center">
                        <User className="h-5 w-5 text-violet-300" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Patient #{p.patientUserId}</p>
                        <p className="text-xs text-gray-500">{p.clinicalNotes || "No notes"}</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleWhisperer(p.patientUserId)}
                      disabled={whispererMutation.isPending}
                      className="bg-violet-600 hover:bg-violet-500"
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      {whispererMutation.isPending && selectedPatientId === p.patientUserId
                        ? "Analyzing..."
                        : "Generate Insights"}
                    </Button>
                  </div>
                ))}

                {/* Show results */}
                {whispererMutation.data && (
                  <Card className="bg-violet-900/20 border-violet-700/30">
                    <CardHeader>
                      <CardTitle className="text-violet-300 text-lg flex items-center gap-2">
                        <Sparkles className="h-5 w-5" /> AI Whisperer Results — Patient #{selectedPatientId}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {typeof whispererMutation.data.suggestions === "string"
                          ? <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{whispererMutation.data.suggestions}</p>
                          : Array.isArray(whispererMutation.data.suggestions)
                            ? (whispererMutation.data.suggestions as any[]).map((s: any, i: number) => (
                                <div key={i} className="p-3 rounded-lg border border-violet-800/20 bg-gray-800/30">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge className="text-[10px] bg-violet-900/40 text-violet-300 border-violet-700/30">{s.category}</Badge>
                                    {s.urgency && <Badge className="text-[10px] bg-amber-900/40 text-amber-300 border-amber-700/30">{s.urgency}</Badge>}
                                  </div>
                                  <p className="text-sm font-medium text-white">{s.title}</p>
                                  {s.rationale && <p className="text-xs text-gray-400 mt-1">{s.rationale}</p>}
                                </div>
                              ))
                            : <p className="text-sm text-gray-400">No suggestions available.</p>
                        }
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="bg-gray-900/60 border-gray-700/30">
                <CardContent className="p-8 text-center">
                  <Brain className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-sm text-gray-400">No patients assigned. Assign patients through the admin panel to use AI Whisperer.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ─── Crisis Alerts Tab ────────────────────────────────────────────── */}
        {activeTab === "alerts" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Crisis Alerts</h2>
              <p className="text-sm text-gray-400">Real-time monitoring of patient safety flags and crisis escalations.</p>
            </div>

            <Card className="bg-gray-900/60 border-red-800/30">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-red-700/20 border border-red-600/30 flex items-center justify-center shrink-0">
                    <Shield className="h-6 w-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">3-Tier Crisis Detection</h3>
                    <p className="text-sm text-gray-400 leading-relaxed mb-4">
                      Doctor Buddy monitors all patient interactions for crisis indicators using a 3-tier system:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-3 rounded-lg border border-red-800/30 bg-red-900/10">
                        <p className="text-xs font-bold text-red-400 mb-1">Tier 1 — Emergency</p>
                        <p className="text-xs text-gray-500">Active suicidal ideation, self-harm in progress. Immediate 988/911 escalation.</p>
                      </div>
                      <div className="p-3 rounded-lg border border-orange-800/30 bg-orange-900/10">
                        <p className="text-xs font-bold text-orange-400 mb-1">Tier 2 — High Risk</p>
                        <p className="text-xs text-gray-500">Passive ideation, severe distress. Crisis resources + clinician notification.</p>
                      </div>
                      <div className="p-3 rounded-lg border border-yellow-800/30 bg-yellow-900/10">
                        <p className="text-xs font-bold text-yellow-400 mb-1">Tier 3 — Distress</p>
                        <p className="text-xs text-gray-500">Elevated distress signals. Wellness check-in + resource suggestions.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/60 border-gray-700/30">
              <CardContent className="p-8 text-center">
                <div className="h-16 w-16 rounded-2xl bg-green-700/20 border border-green-600/30 flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No Active Crisis Alerts</h3>
                <p className="text-sm text-gray-400">All patients are within normal parameters. Crisis alerts will appear here in real-time when detected.</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ─── Reports Tab ──────────────────────────────────────────────────── */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Patient Reports</h2>
              <p className="text-sm text-gray-400">View diagnostic reports and assessment histories for your patients.</p>
            </div>

            <Card className="bg-gray-900/60 border-gray-700/30">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-emerald-700/20 border border-emerald-600/30 flex items-center justify-center shrink-0">
                    <FileText className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Report Access</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      Patient diagnostic reports are generated automatically after each assessment completion.
                      Reports include DSM-5 domain scores, AI-generated clinical impressions, treatment recommendations,
                      and Digital Twin state analysis. Access individual patient reports through the Patients tab.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {patientList.length > 0 ? (
              <div className="space-y-3">
                {patientList.map((p: PatientSummary) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-700/30 bg-gray-900/40 hover:bg-gray-800/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-emerald-700/30 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-emerald-300" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">Patient #{p.patientUserId}</p>
                        <p className="text-xs text-gray-500">View assessment history and reports</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-emerald-700/40 text-emerald-300 hover:bg-emerald-900/20"
                      onClick={() => { setSelectedPatientId(p.patientUserId); setActiveTab("patients"); }}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" /> View Reports
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <Card className="bg-gray-900/60 border-gray-700/30">
                <CardContent className="p-8 text-center">
                  <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-sm text-gray-400">No patients assigned. Reports will be available once patients are added to your roster.</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
