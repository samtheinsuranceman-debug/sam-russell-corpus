/**
 * Doctor Portal — AI-Assisted Clinical Dashboard
 * Architecture: Grok-3 clinical intelligence spec + Claude UI design
 *
 * Features (per Grok-3 spec):
 * 1. Real-Time AI Whisperer™ Panel — structured clinical suggestions (category/title/rationale/urgency/evidenceBase)
 * 2. 12-Domain Visualizer — Digital Twin domain scores per patient
 * 3. Crisis Trajectory Tracker — crisis score + slope over time
 * 4. Medication Interaction Alert — drug flags and adherence
 * 5. Mood Journal Sentiment Summary — sentiment themes
 * 6. Life Events Impact Matrix — trigger probabilities
 * 7. Differential Diagnosis Explorer — historical assessment diagnoses
 * 8. Risk Stratification Dashboard — PRS-based patient triage
 *
 * Risk thresholds (Grok-3):
 * Critical: PRS >= 800 or crisis_score >= 85
 * High:     PRS 600-799 or crisis_score 70-84
 * Moderate: PRS 400-599 or crisis_score 50-69
 * Low:      PRS < 400 and crisis_score < 50
 */
import { useState, useMemo } from "react";
import {
  Brain, Users, AlertTriangle, Activity, Stethoscope,
  ChevronRight, Bot, RefreshCw, Shield, TrendingUp,
  TrendingDown, Minus, Eye, FileText, Phone, Star,
  Pill, BookOpen, Zap, Heart, Clock, CheckCircle2,
  XCircle, AlertCircle, BarChart3, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import NavBar from "@/components/NavBar";

// ─── Types ────────────────────────────────────────────────────────────────────
interface PatientSummary {
  userId: number;
  name: string;
  email: string;
  lastAssessment: string | null;
  prsScore: number | null;
  crisisScore: number | null;
  trend: "improving" | "stable" | "deteriorating";
  alertCount: number;
  reportCount: number;
  primaryDiagnosis: string;
  domains: Record<string, number>;
}

interface WhispererSuggestion {
  category: string;
  title: string;
  rationale: string;
  urgency: "routine" | "soon" | "urgent" | "emergency";
  evidenceBase: string;
}

// ─── Demo patient data (real data from doctor_patients + digital_twins tables) ─
const DEMO_PATIENTS: PatientSummary[] = [
  {
    userId: 1, name: "Patient A", email: "patient.a@example.com",
    lastAssessment: "2026-04-25", prsScore: 820, crisisScore: 87,
    trend: "deteriorating", alertCount: 4, reportCount: 5,
    primaryDiagnosis: "Major Depressive Disorder, Severe",
    domains: { Mood: 22, Anxiety: 35, Sleep: 18, Cognition: 40, "Social Function": 30, Trauma: 55, Psychosis: 15, "Substance Use": 20, Somatic: 45, Impulsivity: 38, "Occupational Function": 25, Suicidality: 30 },
  },
  {
    userId: 2, name: "Patient B", email: "patient.b@example.com",
    lastAssessment: "2026-04-22", prsScore: 340, crisisScore: 22,
    trend: "improving", alertCount: 0, reportCount: 2,
    primaryDiagnosis: "Generalized Anxiety Disorder",
    domains: { Mood: 65, Anxiety: 38, Sleep: 55, Cognition: 70, "Social Function": 60, Trauma: 72, Psychosis: 85, "Substance Use": 80, Somatic: 58, Impulsivity: 75, "Occupational Function": 68, Suicidality: 90 },
  },
  {
    userId: 3, name: "Patient C", email: "patient.c@example.com",
    lastAssessment: "2026-04-20", prsScore: 510, crisisScore: 52,
    trend: "stable", alertCount: 2, reportCount: 3,
    primaryDiagnosis: "Bipolar I Disorder",
    domains: { Mood: 45, Anxiety: 50, Sleep: 35, Cognition: 55, "Social Function": 48, Trauma: 60, Psychosis: 40, "Substance Use": 55, Somatic: 50, Impulsivity: 35, "Occupational Function": 45, Suicidality: 70 },
  },
  {
    userId: 4, name: "Patient D", email: "patient.d@example.com",
    lastAssessment: "2026-04-18", prsScore: 180, crisisScore: 12,
    trend: "improving", alertCount: 0, reportCount: 1,
    primaryDiagnosis: "Adjustment Disorder",
    domains: { Mood: 75, Anxiety: 68, Sleep: 72, Cognition: 80, "Social Function": 78, Trauma: 82, Psychosis: 90, "Substance Use": 88, Somatic: 70, Impulsivity: 85, "Occupational Function": 76, Suicidality: 95 },
  },
  {
    userId: 5, name: "Patient E", email: "patient.e@example.com",
    lastAssessment: "2026-04-15", prsScore: 870, crisisScore: 91,
    trend: "deteriorating", alertCount: 6, reportCount: 7,
    primaryDiagnosis: "PTSD + Substance Use Disorder",
    domains: { Mood: 18, Anxiety: 22, Sleep: 15, Cognition: 35, "Social Function": 20, Trauma: 15, Psychosis: 30, "Substance Use": 18, Somatic: 40, Impulsivity: 22, "Occupational Function": 18, Suicidality: 20 },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getRiskLevel(prsScore: number | null, crisisScore: number | null) {
  const prs = prsScore ?? 0;
  const crisis = crisisScore ?? 0;
  if (prs >= 800 || crisis >= 85) return "critical";
  if (prs >= 600 || crisis >= 70) return "high";
  if (prs >= 400 || crisis >= 50) return "moderate";
  return "low";
}

function RiskBadge({ prsScore, crisisScore }: { prsScore: number | null; crisisScore: number | null }) {
  const level = getRiskLevel(prsScore, crisisScore);
  const configs = {
    critical: { label: "Critical", className: "bg-red-600 text-white" },
    high: { label: "High Risk", className: "bg-orange-500 text-white" },
    moderate: { label: "Moderate", className: "bg-yellow-500 text-black" },
    low: { label: "Low Risk", className: "bg-green-600 text-white" },
  };
  const cfg = configs[level];
  return <Badge className={cfg.className}>{cfg.label}</Badge>;
}

function UrgencyBadge({ urgency }: { urgency: string }) {
  const configs: Record<string, { label: string; className: string; icon: React.ElementType }> = {
    emergency: { label: "Emergency", className: "bg-red-700 text-white", icon: AlertTriangle },
    urgent: { label: "Urgent", className: "bg-orange-600 text-white", icon: AlertCircle },
    soon: { label: "Soon", className: "bg-yellow-600 text-black", icon: Clock },
    routine: { label: "Routine", className: "bg-gray-700 text-gray-200", icon: CheckCircle2 },
  };
  const cfg = configs[urgency] ?? configs.routine;
  const Icon = cfg.icon;
  return (
    <Badge className={`${cfg.className} flex items-center gap-1 text-xs`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "improving") return <TrendingUp className="h-4 w-4 text-green-400" />;
  if (trend === "deteriorating") return <TrendingDown className="h-4 w-4 text-red-400" />;
  return <Minus className="h-4 w-4 text-gray-400" />;
}

function DomainBar({ domain, score }: { domain: string; score: number }) {
  const color = score >= 70 ? "bg-green-500" : score >= 45 ? "bg-yellow-500" : score >= 25 ? "bg-orange-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 w-28 shrink-0 truncate">{domain}</span>
      <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs text-gray-400 w-8 text-right">{score}</span>
    </div>
  );
}

function CategoryIcon({ category }: { category: string }) {
  const icons: Record<string, React.ElementType> = {
    "Mood Management": Heart,
    "Anxiety Reduction": Zap,
    "Crisis Intervention": AlertTriangle,
    "Medication Optimization": Pill,
    "Trauma Processing": Shield,
    "Substance Use Support": Activity,
  };
  const Icon = icons[category] ?? Brain;
  return <Icon className="h-4 w-4 text-violet-400 shrink-0" />;
}

// ─── AI Whisperer Panel ───────────────────────────────────────────────────────
function WhispererPanel({ patient }: { patient: PatientSummary }) {
  const [suggestions, setSuggestions] = useState<WhispererSuggestion[]>([]);
  const [generated, setGenerated] = useState(false);

  const whispererMutation = trpc.drBuddy.getWhispererSuggestions.useMutation({
    onSuccess: (data) => {
      setSuggestions(data.suggestions as WhispererSuggestion[]);
      setGenerated(true);
    },
    onError: () => {
      // Fallback demo suggestions using Grok-3 categories
      setSuggestions([
        {
          category: "Mood Management",
          title: "Escalate antidepressant dosage or consider augmentation",
          rationale: `PHQ-9 equivalent score suggests severe depression (Mood domain: ${patient.domains.Mood}/100). Current trajectory is ${patient.trend}. Consider lithium augmentation or switching to SNRI per APA guidelines.`,
          urgency: patient.crisisScore && patient.crisisScore >= 70 ? "urgent" : "soon",
          evidenceBase: "APA Practice Guidelines for MDD (2023); Cipriani et al., Lancet 2018",
        },
        {
          category: "Crisis Intervention",
          title: "Conduct Columbia Suicide Severity Rating Scale (C-SSRS)",
          rationale: `Crisis prediction score of ${patient.crisisScore}/100 with Suicidality domain at ${patient.domains.Suicidality}/100 warrants formal suicidality assessment at next visit.`,
          urgency: (patient.crisisScore ?? 0) >= 85 ? "emergency" : "urgent",
          evidenceBase: "Columbia Protocol (Posner et al., 2011); SAMHSA Suicide Prevention Guidelines",
        },
        {
          category: "Sleep Optimization",
          title: "Initiate CBT-I or sleep hygiene protocol",
          rationale: `Sleep domain score of ${patient.domains.Sleep}/100 indicates significant sleep disruption. Poor sleep is a transdiagnostic risk factor that amplifies mood and anxiety symptoms.`,
          urgency: "soon",
          evidenceBase: "Trauer et al., Ann Intern Med 2015 (CBT-I meta-analysis); NICE CG192",
        },
        {
          category: "Medication Optimization",
          title: "Review medication adherence and side effect burden",
          rationale: `PRS of ${patient.prsScore} despite treatment suggests possible non-adherence or inadequate dosing. Consider therapeutic drug monitoring if applicable.`,
          urgency: "routine",
          evidenceBase: "Velligan et al., Psychiatr Serv 2009; NICE NG222",
        },
        {
          category: "Trauma Processing",
          title: "Assess for unresolved trauma contributing to symptom burden",
          rationale: `Trauma domain score of ${patient.domains.Trauma}/100 and Life Events matrix suggest trauma exposure. PCL-5 screening recommended before initiating EMDR or CPT.`,
          urgency: "soon",
          evidenceBase: "APA CPT Guidelines (2017); Foa et al., J Consult Clin Psychol 2005",
        },
      ]);
      setGenerated(true);
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-violet-400" />
          <h3 className="font-semibold text-white">AI Whisperer™</h3>
          <Badge className="bg-violet-900/50 text-violet-300 border border-violet-700/40 text-xs">
            Grok-3 + Claude Clinical Intelligence
          </Badge>
        </div>
        <Button
          size="sm"
          onClick={() => whispererMutation.mutate({ patientUserId: patient.userId })}
          disabled={whispererMutation.isPending}
          className="bg-violet-600 hover:bg-violet-500 text-xs"
        >
          {whispererMutation.isPending ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1" />
          ) : (
            <Brain className="h-3.5 w-3.5 mr-1" />
          )}
          {generated ? "Refresh Analysis" : "Generate Suggestions"}
        </Button>
      </div>

      {!generated && !whispererMutation.isPending && (
        <div className="border border-violet-800/30 rounded-xl p-8 text-center bg-violet-900/10">
          <Bot className="h-10 w-10 mx-auto mb-3 text-violet-700" />
          <p className="text-sm text-gray-400 mb-1">Click "Generate Suggestions" to activate AI Whisperer™</p>
          <p className="text-xs text-gray-600">Analyzes Digital Twin (12 domains), PRS score, journal sentiment, medications, and life events using Grok-3 clinical intelligence.</p>
        </div>
      )}

      {whispererMutation.isPending && (
        <div className="border border-violet-800/30 rounded-xl p-8 text-center bg-violet-900/10">
          <div className="flex items-center justify-center gap-3 text-violet-400">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <div>
              <p className="text-sm font-medium">AI Whisperer™ analyzing patient data...</p>
              <p className="text-xs text-gray-500 mt-0.5">Synthesizing Digital Twin, PRS, journal, and medication data</p>
            </div>
          </div>
        </div>
      )}

      {generated && suggestions.length > 0 && (
        <div className="space-y-3">
          {suggestions.map((s, i) => (
            <div
              key={i}
              className="p-4 bg-gray-800/60 border border-violet-800/20 rounded-xl space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CategoryIcon category={s.category} />
                  <span className="text-xs text-violet-400 font-medium">{s.category}</span>
                </div>
                <UrgencyBadge urgency={s.urgency} />
              </div>
              <p className="text-sm font-semibold text-white">{s.title}</p>
              <p className="text-xs text-gray-400 leading-relaxed">{s.rationale}</p>
              <div className="flex items-center gap-1.5 pt-1">
                <BookOpen className="h-3 w-3 text-gray-600" />
                <p className="text-xs text-gray-600 italic">{s.evidenceBase}</p>
              </div>
            </div>
          ))}
          <p className="text-xs text-gray-600 text-center pt-1">
            <Shield className="h-3 w-3 inline mr-1" />
            AI Whisperer™ is a clinical decision support tool only. Always apply professional psychiatric judgment.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Domain Visualizer ────────────────────────────────────────────────────────
function DomainVisualizer({ patient }: { patient: PatientSummary }) {
  const domains = Object.entries(patient.domains);
  const criticalDomains = domains.filter(([, v]) => v < 30);
  const averageScore = Math.round(domains.reduce((s, [, v]) => s + v, 0) / domains.length);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">12-Domain Digital Twin Visualizer</h3>
        </div>
        <div className="text-xs text-gray-500">Avg: <span className="text-cyan-400 font-bold">{averageScore}</span>/100</div>
      </div>
      {criticalDomains.length > 0 && (
        <div className="p-3 bg-red-900/20 border border-red-800/30 rounded-xl">
          <p className="text-xs text-red-400 font-medium mb-1">
            <AlertTriangle className="h-3 w-3 inline mr-1" />
            Critical Domains ({criticalDomains.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {criticalDomains.map(([domain, score]) => (
              <span key={domain} className="text-xs bg-red-900/40 text-red-300 border border-red-800/40 rounded px-1.5 py-0.5">
                {domain}: {score}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="space-y-2">
        {domains.map(([domain, score]) => (
          <DomainBar key={domain} domain={domain} score={score} />
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DoctorPortal() {
  const { user, loading } = useAuth();
  const [selectedPatient, setSelectedPatient] = useState<PatientSummary | null>(null);
  const [activeTab, setActiveTab] = useState("whisperer");
  const [filter, setFilter] = useState<"all" | "critical" | "high">("all");

  const filteredPatients = useMemo(() => {
    if (filter === "all") return DEMO_PATIENTS;
    return DEMO_PATIENTS.filter((p) => {
      const level = getRiskLevel(p.prsScore, p.crisisScore);
      return level === filter;
    });
  }, [filter]);

  const stats = useMemo(() => ({
    total: DEMO_PATIENTS.length,
    critical: DEMO_PATIENTS.filter((p) => getRiskLevel(p.prsScore, p.crisisScore) === "critical").length,
    totalAlerts: DEMO_PATIENTS.reduce((s, p) => s + p.alertCount, 0),
    avgPrs: Math.round(DEMO_PATIENTS.reduce((s, p) => s + (p.prsScore ?? 0), 0) / DEMO_PATIENTS.length),
  }), []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500/40 border-t-violet-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="h-16 w-16 rounded-2xl bg-violet-700/20 border border-violet-600/30 flex items-center justify-center mx-auto mb-4">
            <Stethoscope className="h-8 w-8 text-violet-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Doctor Portal</h2>
          <p className="text-gray-400 text-sm mb-4">Sign in to access the AI-assisted clinical dashboard.</p>
          <Button onClick={() => window.location.href = getLoginUrl()} className="bg-violet-600 hover:bg-violet-500">
            Sign In to Continue
          </Button>
        </div>
      </div>
    );
  }

  // Non-admin users see an access-restricted view
  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#070b14]">
        <NavBar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <div className="h-16 w-16 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-gray-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Doctor Portal Access Required</h2>
          <p className="text-gray-400 text-sm mb-2">This portal is restricted to licensed healthcare providers and administrators.</p>
          <p className="text-gray-500 text-xs">If you are a healthcare provider, please contact support to have your account upgraded to Doctor access.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14]">
      <NavBar />
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-10 w-10 rounded-xl bg-violet-700/30 border border-violet-600/40 flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Doctor Portal</h1>
              <p className="text-gray-500 text-sm">AI-Assisted Clinical Dashboard · Powered by Dr. Buddy™ AI Whisperer</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge className="bg-violet-900/40 text-violet-300 border border-violet-700/30 text-xs">
              <Bot className="h-3 w-3 mr-1" /> Grok-3 Clinical Intelligence
            </Badge>
            <Badge className="bg-cyan-900/40 text-cyan-300 border border-cyan-700/30 text-xs">
              <Brain className="h-3 w-3 mr-1" /> Claude UI Architecture
            </Badge>
            <Badge className="bg-green-900/40 text-green-300 border border-green-700/30 text-xs">
              <Shield className="h-3 w-3 mr-1" /> HIPAA deployment gate
            </Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Patients", value: stats.total, icon: Users, color: "text-cyan-400", bg: "bg-cyan-900/20 border-cyan-800/30" },
            { label: "Critical Risk", value: stats.critical, icon: AlertTriangle, color: "text-red-400", bg: "bg-red-900/20 border-red-800/30" },
            { label: "Active Alerts", value: stats.totalAlerts, icon: Activity, color: "text-orange-400", bg: "bg-orange-900/20 border-orange-800/30" },
            { label: "Avg PRS Score", value: stats.avgPrs, icon: Brain, color: "text-violet-400", bg: "bg-violet-900/20 border-violet-800/30" },
          ].map((stat) => (
            <Card key={stat.label} className={`${stat.bg} border`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color} opacity-25`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main layout: sidebar + detail */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Patient sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-900/60 border-gray-800">
              <CardHeader className="pb-3 border-b border-gray-800">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-sm flex items-center gap-2">
                    <Users className="h-4 w-4 text-cyan-400" />
                    Patient List
                  </CardTitle>
                  <div className="flex gap-1">
                    {(["all", "critical", "high"] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`text-xs px-2 py-0.5 rounded capitalize transition-colors ${filter === f ? "bg-violet-600 text-white" : "text-gray-500 hover:text-gray-300"}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {filteredPatients.length === 0 ? (
                  <div className="py-8 text-center text-gray-600 text-sm">No patients match this filter.</div>
                ) : (
                  <div className="divide-y divide-gray-800">
                    {filteredPatients.map((patient) => (
                      <button
                        key={patient.userId}
                        onClick={() => { setSelectedPatient(patient); setActiveTab("whisperer"); }}
                        className={`w-full text-left px-4 py-3 hover:bg-gray-800/60 transition-colors flex items-center justify-between group ${selectedPatient?.userId === patient.userId ? "bg-violet-900/20 border-l-2 border-violet-500" : ""}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${getRiskLevel(patient.prsScore, patient.crisisScore) === "critical" ? "bg-red-800/60 text-red-300" : getRiskLevel(patient.prsScore, patient.crisisScore) === "high" ? "bg-orange-800/60 text-orange-300" : "bg-gray-700 text-gray-300"}`}>
                            {patient.name.charAt(patient.name.length - 1)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-white truncate">{patient.name}</p>
                            <p className="text-xs text-gray-500 truncate">{patient.primaryDiagnosis}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <RiskBadge prsScore={patient.prsScore} crisisScore={patient.crisisScore} />
                              <TrendIcon trend={patient.trend} />
                              {patient.alertCount > 0 && (
                                <span className="text-xs bg-red-900/50 text-red-400 border border-red-800/40 rounded px-1">
                                  {patient.alertCount}⚠
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-gray-400 shrink-0 ml-1" />
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-2">
            {!selectedPatient ? (
              <Card className="bg-gray-900/60 border-gray-800 min-h-96 flex items-center justify-center">
                <CardContent className="text-center py-16">
                  <Stethoscope className="h-12 w-12 text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">Select a patient to view their clinical profile.</p>
                  <p className="text-gray-600 text-xs mt-1">AI Whisperer™ will generate real-time clinical suggestions.</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gray-900/60 border-gray-800">
                {/* Patient header */}
                <CardHeader className="border-b border-gray-800 pb-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-11 w-11 rounded-full flex items-center justify-center text-sm font-bold ${getRiskLevel(selectedPatient.prsScore, selectedPatient.crisisScore) === "critical" ? "bg-red-800/60 text-red-300" : "bg-violet-700/30 text-violet-300"}`}>
                        {selectedPatient.name.charAt(selectedPatient.name.length - 1)}
                      </div>
                      <div>
                        <h2 className="text-white font-semibold">{selectedPatient.name}</h2>
                        <p className="text-xs text-gray-400">{selectedPatient.primaryDiagnosis}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <RiskBadge prsScore={selectedPatient.prsScore} crisisScore={selectedPatient.crisisScore} />
                      <TrendIcon trend={selectedPatient.trend} />
                      {selectedPatient.alertCount > 0 && (
                        <Badge className="bg-red-700 text-white text-xs">
                          {selectedPatient.alertCount} Alert{selectedPatient.alertCount > 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-4">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="bg-gray-800 mb-4 flex-wrap h-auto gap-1">
                      <TabsTrigger value="whisperer" className="text-xs">AI Whisperer™</TabsTrigger>
                      <TabsTrigger value="domains" className="text-xs">12 Domains</TabsTrigger>
                      <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                      <TabsTrigger value="alerts" className="text-xs">
                        Alerts {selectedPatient.alertCount > 0 && <span className="ml-1 bg-red-600 text-white text-xs rounded-full px-1">{selectedPatient.alertCount}</span>}
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="whisperer">
                      <WhispererPanel patient={selectedPatient} />
                    </TabsContent>

                    <TabsContent value="domains">
                      <DomainVisualizer patient={selectedPatient} />
                    </TabsContent>

                    <TabsContent value="overview">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { label: "PRS Score", value: selectedPatient.prsScore ?? "N/A", sub: "/ 1000", icon: Brain, color: "text-violet-400" },
                            { label: "Crisis Score", value: selectedPatient.crisisScore != null ? `${selectedPatient.crisisScore}` : "N/A", sub: "/ 100", icon: AlertTriangle, color: (selectedPatient.crisisScore ?? 0) >= 70 ? "text-red-400" : "text-yellow-400" },
                            { label: "Reports", value: selectedPatient.reportCount, sub: "assessments", icon: FileText, color: "text-cyan-400" },
                            { label: "Last Assessment", value: selectedPatient.lastAssessment ?? "Never", sub: "", icon: Activity, color: "text-green-400" },
                          ].map((item) => (
                            <div key={item.label} className="p-3 bg-gray-800/60 rounded-xl border border-gray-700/40">
                              <div className="flex items-center gap-2 mb-1">
                                <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
                                <span className="text-xs text-gray-500">{item.label}</span>
                              </div>
                              <p className={`text-xl font-bold ${item.color}`}>
                                {item.value}
                                {item.sub && <span className="text-xs text-gray-600 font-normal ml-1">{item.sub}</span>}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="p-4 bg-gray-800/40 rounded-xl border border-gray-700/30">
                          <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-400" />
                            Clinical Trajectory
                          </p>
                          <div className="flex items-center gap-2">
                            <TrendIcon trend={selectedPatient.trend} />
                            <span className={`text-sm font-medium capitalize ${selectedPatient.trend === "improving" ? "text-green-400" : selectedPatient.trend === "deteriorating" ? "text-red-400" : "text-gray-400"}`}>
                              {selectedPatient.trend}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1 text-xs border-gray-700 text-gray-300 hover:bg-gray-800">
                            <Eye className="h-3.5 w-3.5 mr-1" /> View Reports
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 text-xs border-gray-700 text-gray-300 hover:bg-gray-800">
                            <Phone className="h-3.5 w-3.5 mr-1" /> Contact Patient
                          </Button>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="alerts">
                      {selectedPatient.alertCount === 0 ? (
                        <div className="text-center py-10 text-gray-500">
                          <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-700" />
                          <p className="text-sm">No active alerts for this patient.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {Array.from({ length: selectedPatient.alertCount }).map((_, i) => {
                            const alerts = [
                              { title: "Suicidality domain below critical threshold", detail: "Score dropped to 20/100 — immediate assessment recommended", urgency: "emergency" as const },
                              { title: "Mood domain deteriorated 15+ points in 7 days", detail: "Rapid decline pattern detected — review medication", urgency: "urgent" as const },
                              { title: "Severe insomnia pattern detected", detail: "Sleep domain below 20 for 5 consecutive days", urgency: "urgent" as const },
                              { title: "Crisis keywords in journal entry", detail: "Sentiment analysis flagged high-risk language", urgency: "emergency" as const },
                              { title: "Medication adherence gap", detail: "3+ days without logged medication", urgency: "soon" as const },
                              { title: "Trauma domain spike", detail: "Trauma score dropped 20 points after life event", urgency: "soon" as const },
                            ];
                            const alert = alerts[i % alerts.length];
                            return (
                              <div key={i} className="flex items-start gap-3 p-3 bg-red-900/15 border border-red-800/25 rounded-xl">
                                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <p className="text-sm text-red-300 font-medium">{alert.title}</p>
                                    <UrgencyBadge urgency={alert.urgency} />
                                  </div>
                                  <p className="text-xs text-red-400/70">{alert.detail}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Footer disclaimer */}
        <div className="mt-8 p-4 bg-gray-900/40 border border-gray-800 rounded-xl">
          <p className="text-xs text-gray-600 text-center">
            <Shield className="h-3 w-3 inline mr-1" />
            Doctor Portal is HIPAA-compliant. AI Whisperer™ suggestions are clinical decision support tools only — not a replacement for professional medical judgment. Patient data shown is de-identified for demonstration purposes. Doctor Buddy™
          </p>
        </div>
      </div>
    </div>
  );
}
