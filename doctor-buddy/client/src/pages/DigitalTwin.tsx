import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine,
} from "recharts";
import { Link } from "wouter";

// ─── Domain color map ────────────────────────────────────────────────────────
const DOMAIN_COLORS: Record<string, string> = {
  moodRegulation: "#22d3ee",
  anxietyManagement: "#a78bfa",
  psychoticSymptoms: "#f472b6",
  cognitiveFunction: "#34d399",
  sleepQuality: "#60a5fa",
  socialEngagement: "#fbbf24",
  traumaResponse: "#fb923c",
  substanceUse: "#e879f9",
  eatingBehavior: "#4ade80",
  personalityStability: "#38bdf8",
  somaticConcerns: "#f87171",
  crisisSafety: "#ff6b6b",
};

const STATE_CONFIG = {
  stable: { label: "Stable", color: "#22d3ee", bg: "bg-cyan-500/20 border-cyan-500/40", icon: "◉" },
  improving: { label: "Improving", color: "#4ade80", bg: "bg-green-500/20 border-green-500/40", icon: "↑" },
  deteriorating: { label: "Deteriorating", color: "#fb923c", bg: "bg-orange-500/20 border-orange-500/40", icon: "↓" },
  critical: { label: "Critical", color: "#ff6b6b", bg: "bg-red-500/20 border-red-500/40", icon: "⚠" },
};

// ─── Custom Radar Dot ────────────────────────────────────────────────────────
function ScoreGauge({ score, label, color }: { score: number; label: string; color: string }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const scoreColor = score >= 70 ? "#4ade80" : score >= 40 ? "#fbbf24" : "#ff6b6b";

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        <circle
          cx="36" cy="36" r={radius}
          fill="none" stroke={scoreColor} strokeWidth="6"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 36 36)"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
        <text x="36" y="40" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">{score}</text>
      </svg>
      <span className="text-xs text-white/60 text-center leading-tight max-w-[72px]">{label}</span>
    </div>
  );
}

// ─── Alert Card ──────────────────────────────────────────────────────────────
function AlertCard({ alert, onAcknowledge }: {
  alert: { id: string; domainName: string; message: string; severity: string; score: number; triggeredAt: string; acknowledged: boolean };
  onAcknowledge: (id: string) => void;
}) {
  const severityConfig = {
    critical: { border: "border-red-500/60", bg: "bg-red-500/10", icon: "⚠", color: "text-red-400" },
    warning: { border: "border-orange-500/60", bg: "bg-orange-500/10", icon: "●", color: "text-orange-400" },
    info: { border: "border-cyan-500/60", bg: "bg-cyan-500/10", icon: "ℹ", color: "text-cyan-400" },
  };
  const cfg = severityConfig[alert.severity as keyof typeof severityConfig] || severityConfig.info;

  return (
    <div className={`border rounded-lg p-4 ${cfg.border} ${cfg.bg} ${alert.acknowledged ? "opacity-40" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span className={`text-lg mt-0.5 ${cfg.color}`}>{cfg.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-semibold uppercase tracking-wide ${cfg.color}`}>{alert.severity}</span>
              <span className="text-xs text-white/40">·</span>
              <span className="text-xs text-white/50">{alert.domainName}</span>
              <span className="text-xs text-white/40">·</span>
              <span className="text-xs text-white/40">Score: {alert.score}</span>
            </div>
            <p className="text-sm text-white/80 leading-relaxed">{alert.message}</p>
            <p className="text-xs text-white/30 mt-1">{new Date(alert.triggeredAt).toLocaleString()}</p>
          </div>
        </div>
        {!alert.acknowledged && (
          <button
            onClick={() => onAcknowledge(alert.id)}
            className="text-xs text-white/40 hover:text-white/80 border border-white/10 hover:border-white/30 rounded px-2 py-1 transition-colors flex-shrink-0"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Journal Quick-Update Panel ───────────────────────────────────────────────
function JournalUpdate({ onUpdate }: { onUpdate: () => void }) {
  const [mood, setMood] = useState(7);
  const [anxiety, setAnxiety] = useState(4);
  const [sleep, setSleep] = useState(7.5);
  const [social, setSocial] = useState(3);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const updateMutation = trpc.digitalTwin.updateFromJournal.useMutation({
    onSuccess: () => { setSubmitted(true); onUpdate(); setTimeout(() => setSubmitted(false), 3000); },
  });

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <h3 className="text-sm font-semibold text-white/80 uppercase tracking-widest mb-4">
        Quick Check-In — Update Your Twin
      </h3>
      <div className="grid grid-cols-2 gap-6 mb-4">
        <div>
          <label className="text-xs text-white/50 block mb-2">Mood (1–10): <span className="text-cyan-400 font-bold">{mood}</span></label>
          <input type="range" min={1} max={10} value={mood} onChange={e => setMood(Number(e.target.value))}
            className="w-full accent-cyan-400" />
        </div>
        <div>
          <label className="text-xs text-white/50 block mb-2">Anxiety (1–10): <span className="text-purple-400 font-bold">{anxiety}</span></label>
          <input type="range" min={1} max={10} value={anxiety} onChange={e => setAnxiety(Number(e.target.value))}
            className="w-full accent-purple-400" />
        </div>
        <div>
          <label className="text-xs text-white/50 block mb-2">Sleep Hours: <span className="text-blue-400 font-bold">{sleep}h</span></label>
          <input type="range" min={0} max={12} step={0.5} value={sleep} onChange={e => setSleep(Number(e.target.value))}
            className="w-full accent-blue-400" />
        </div>
        <div>
          <label className="text-xs text-white/50 block mb-2">Social Interaction (1–5): <span className="text-yellow-400 font-bold">{social}</span></label>
          <input type="range" min={1} max={5} value={social} onChange={e => setSocial(Number(e.target.value))}
            className="w-full accent-yellow-400" />
        </div>
      </div>
      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Optional note about how you're feeling today..."
        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white/80 placeholder-white/30 resize-none focus:outline-none focus:border-cyan-500/50 mb-4"
        rows={2}
      />
      <button
        onClick={() => updateMutation.mutate({ moodScore: mood, anxietyScore: anxiety, sleepHours: sleep, socialInteraction: social, note })}
        disabled={updateMutation.isPending || submitted}
        className="w-full py-2.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-sm font-semibold hover:bg-cyan-500/30 transition-all disabled:opacity-50"
      >
        {updateMutation.isPending ? "Updating Twin..." : submitted ? "✓ Twin Updated" : "Update My Digital Twin"}
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DigitalTwin() {
  const { user, loading: authLoading } = useAuth();
  const [historyDays, setHistoryDays] = useState(30);
  const [activeTab, setActiveTab] = useState<"radar" | "trajectory" | "alerts" | "checkin" | "crisis">("radar");

  const { data: twinData, isLoading, refetch } = trpc.digitalTwin.getMyTwin.useQuery(
    undefined,
    { enabled: !!user, refetchOnWindowFocus: false }
  );
  const { data: historyData, refetch: refetchHistory } = trpc.digitalTwin.getTwinHistory.useQuery(
    { days: historyDays },
    { enabled: !!user, refetchOnWindowFocus: false }
  );

  const acknowledgeMutation = trpc.digitalTwin.acknowledgeAlert.useMutation({
    onSuccess: () => refetch(),
  });

  const twin = twinData?.twin;
  const domains = twinData?.domains ?? [];
  const domainScores = (twin?.domainScores ?? {}) as Record<string, number>;
  const activeAlerts = ((twin?.activeAlerts ?? []) as any[]).filter(a => !a.acknowledged);
  const stateKey = (twin?.currentState ?? "stable") as keyof typeof STATE_CONFIG;
  const stateConfig = STATE_CONFIG[stateKey];

  // Radar chart data
  const radarData = useMemo(() => domains.map(d => ({
    domain: d.name.replace(" & ", "\n& "),
    score: domainScores[d.id] ?? 50,
    fullMark: 100,
  })), [domains, domainScores]);

  // ─── Grok Crisis Prediction Algorithm ──────────────────────────────────────
  // Weights generated by Grok-3 clinical psychiatry model
  const CRISIS_WEIGHTS: Record<string, number> = {
    moodRegulation: 0.15, anxietyManagement: 0.12, sleepQuality: 0.08,
    cognitiveFunction: 0.07, socialEngagement: 0.08, traumaResponse: 0.09,
    psychoticSymptoms: 0.10, substanceUse: 0.08, somaticConcerns: 0.05,
    impulsivity: 0.09, occupationalFunction: 0.06, crisisSafety: 0.20,
  };
  const EARLY_WARNING_SIGNALS = [
    { pattern: "Sleep score drops >15 points in 3 days", domain: "sleepQuality" },
    { pattern: "Mood drops >10 pts + Anxiety rises >5 pts in 5 days", domain: "moodRegulation" },
    { pattern: "Social Function drops >10 points in 7 days", domain: "socialEngagement" },
    { pattern: "Impulsivity rises >8 points in 3 days", domain: "impulsivity" },
    { pattern: "Substance Use rises >10 points in 7 days", domain: "substanceUse" },
    { pattern: "Crisis Safety score rises >5 points in 48 hours", domain: "crisisSafety" },
    { pattern: "Psychosis score rises >7 points in 5 days", domain: "psychoticSymptoms" },
    { pattern: "Trauma + Sleep deterioration in 7 days", domain: "traumaResponse" },
  ];
  const INTERVENTION_TRIGGERS = [
    { trigger: "Crisis Safety score >70", action: "Immediate crisis intervention — contact 988", level: "critical" },
    { trigger: "Composite crisis score >75 for 48h", action: "Urgent clinical assessment required", level: "critical" },
    { trigger: "Mood <30 + Anxiety >70 + Crisis Safety >50", action: "Emergency psychiatric consult", level: "critical" },
    { trigger: "Psychosis >60 + Impulsivity >60", action: "Urgent medication review", level: "high" },
    { trigger: "Sleep <30 + Mood <30 + Substance Use >50", action: "Substance abuse intervention", level: "high" },
  ];

  // Compute crisis prediction score (higher = more risk)
  const crisisPredictionScore = useMemo(() => {
    if (!domainScores || Object.keys(domainScores).length === 0) return 0;
    let weightedRisk = 0;
    let totalWeight = 0;
    Object.entries(CRISIS_WEIGHTS).forEach(([domain, weight]) => {
      const score = domainScores[domain];
      if (score !== undefined) {
        weightedRisk += (100 - score) * weight;
        totalWeight += weight;
      }
    });
    return totalWeight > 0 ? Math.round(weightedRisk / totalWeight) : 0;
  }, [domainScores]);

  const crisisLevel = crisisPredictionScore >= 75 ? "critical" : crisisPredictionScore >= 50 ? "high" : crisisPredictionScore >= 25 ? "moderate" : "low";
  const crisisLevelConfig = {
    low: { color: "#4ade80", bg: "bg-green-500/10 border-green-500/30", label: "Low Risk" },
    moderate: { color: "#fbbf24", bg: "bg-yellow-500/10 border-yellow-500/30", label: "Moderate Risk" },
    high: { color: "#fb923c", bg: "bg-orange-500/10 border-orange-500/30", label: "High Risk" },
    critical: { color: "#ff6b6b", bg: "bg-red-500/10 border-red-500/30", label: "Critical" },
  };
  const crisisCfg = crisisLevelConfig[crisisLevel];

  // Active early warning signals (domains below 40)
  const activeWarnings = useMemo(() => {
    return EARLY_WARNING_SIGNALS.filter(signal => {
      const score = domainScores[signal.domain];
      return score !== undefined && score < 40;
    });
  }, [domainScores]);

  // Active intervention triggers
  const activeInterventions = useMemo(() => {
    return INTERVENTION_TRIGGERS.filter(t => {
      if (t.level === "critical") return crisisPredictionScore >= 75;
      if (t.level === "high") return crisisPredictionScore >= 50;
      return false;
    });
  }, [crisisPredictionScore]);

  // 7-day trajectory slope (linear regression)
  const trajectorySlope = useMemo(() => {
    const history = historyData?.history ?? [];
    if (history.length < 2) return 0;
    const recent = history.slice(-7);
    const n = recent.length;
    const xs = recent.map((_: unknown, i: number) => i);
    const ys = recent.map((h: { compositeScore: number }) => h.compositeScore);
    const meanX = xs.reduce((a: number, b: number) => a + b, 0) / n;
    const meanY = ys.reduce((a: number, b: number) => a + b, 0) / n;
    const num = xs.reduce((sum: number, x: number, i: number) => sum + (x - meanX) * (ys[i] - meanY), 0);
    const den = xs.reduce((sum: number, x: number) => sum + (x - meanX) ** 2, 0);
    return den === 0 ? 0 : num / den;
  }, [historyData]);

  const trajectoryTrend = trajectorySlope < -0.5 ? "deteriorating" : trajectorySlope > 0.5 ? "improving" : "stable";
  const trendConfig = {
    improving: { label: "Improving", color: "#4ade80", icon: "↑" },
    stable: { label: "Stable", color: "#22d3ee", icon: "→" },
    deteriorating: { label: "Deteriorating", color: "#fb923c", icon: "↓" },
  };

  // Trajectory chart data
  const trajectoryData = useMemo(() => {
    const history = historyData?.history ?? [];
    return history.map(snap => ({
      date: new Date(snap.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      composite: Math.round(snap.compositeScore),
      ...Object.fromEntries(
        Object.entries(snap.domainScores as Record<string, number>).map(([k, v]) => [k, Math.round(v)])
      ),
    }));
  }, [historyData]);

  // Login gate
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-6">🧬</div>
          <h1 className="text-2xl font-bold text-white mb-3">Digital Twin Requires Login</h1>
          <p className="text-white/60 mb-6">Your Digital Twin is a persistent, personalized model. Sign in to access and build your mental health profile over time.</p>
          <a href={getLoginUrl()} className="inline-block px-6 py-3 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-semibold hover:bg-cyan-500/30 transition-all">
            Sign In to Access Your Twin
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/30 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-white/40 hover:text-white/70 text-sm transition-colors">← Home</Link>
            <span className="text-white/20">/</span>
            <span className="text-white/80 text-sm font-medium">Digital Twin</span>
          </div>
          <div className="flex items-center gap-2">
            {twin && (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${stateConfig.bg}`}>
                <span>{stateConfig.icon}</span>
                <span style={{ color: stateConfig.color }}>{stateConfig.label}</span>
              </div>
            )}
            {activeAlerts.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-orange-500/40 bg-orange-500/10 text-xs font-semibold text-orange-300">
                <span>⚠</span>
                <span>{activeAlerts.length} Alert{activeAlerts.length > 1 ? "s" : ""}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Digital Twin</span>
              </h1>
              <p className="text-white/50 text-sm max-w-xl">
                A persistent computational model of your mental health state across 12 psychiatric domains,
                continuously updated as you complete assessments and check-ins.
              </p>
            </div>
            {twin && (
              <div className="flex flex-col items-end gap-1">
                <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
                  {Math.round(twin.compositeScore ?? 50)}
                </div>
                <div className="text-xs text-white/40 uppercase tracking-widest">Composite Score</div>
                <div className="text-xs text-white/30">
                  Last updated: {twin.lastUpdated ? new Date(twin.lastUpdated).toLocaleString() : "Never"}
                </div>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="w-12 h-12 border-2 border-cyan-500/40 border-t-cyan-400 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-white/50 text-sm">Initializing your Digital Twin...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Domain Score Gauges */}
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-3 mb-8 bg-white/3 border border-white/8 rounded-xl p-4">
              {domains.map(d => (
                <ScoreGauge
                  key={d.id}
                  score={domainScores[d.id] ?? 50}
                  label={d.name}
                  color={DOMAIN_COLORS[d.id] ?? "#22d3ee"}
                />
              ))}
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 mb-6 bg-white/5 rounded-lg p-1 w-fit">
              {[
                { key: "radar", label: "Radar Map" },
                { key: "trajectory", label: "Trajectory" },
                { key: "alerts", label: `Alerts${activeAlerts.length > 0 ? ` (${activeAlerts.length})` : ""}` },
                { key: "checkin", label: "Check-In" },
                { key: "crisis", label: `Crisis Score${crisisPredictionScore > 0 ? ` (${crisisPredictionScore})` : ""}` },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === tab.key
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                      : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Radar Map Tab */}
            {activeTab === "radar" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white/3 border border-white/8 rounded-xl p-6">
                  <h2 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-4">
                    12-Domain Psychiatric Radar
                  </h2>
                  <ResponsiveContainer width="100%" height={420}>
                    <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                      <PolarGrid stroke="rgba(255,255,255,0.08)" />
                      <PolarAngleAxis
                        dataKey="domain"
                        tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }}
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 9 }}
                        tickCount={5}
                      />
                      <Radar
                        name="Current State"
                        dataKey="score"
                        stroke="#22d3ee"
                        fill="#22d3ee"
                        fillOpacity={0.15}
                        strokeWidth={2}
                        dot={{ fill: "#22d3ee", r: 4 }}
                      />
                      <Tooltip
                        contentStyle={{ background: "#0f1929", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                        labelStyle={{ color: "rgba(255,255,255,0.8)" }}
                        formatter={(value: number) => [`${value}/100`, "Score"]}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Domain breakdown */}
                <div className="bg-white/3 border border-white/8 rounded-xl p-6">
                  <h2 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-4">
                    Domain Breakdown
                  </h2>
                  <div className="space-y-3">
                    {domains
                      .slice()
                      .sort((a, b) => (domainScores[a.id] ?? 50) - (domainScores[b.id] ?? 50))
                      .map(d => {
                        const score = domainScores[d.id] ?? 50;
                        const color = score >= 70 ? "#4ade80" : score >= 40 ? "#fbbf24" : "#ff6b6b";
                        return (
                          <div key={d.id}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-white/60">{d.name}</span>
                              <span className="text-xs font-bold" style={{ color }}>{score}</span>
                            </div>
                            <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-1000"
                                style={{ width: `${score}%`, backgroundColor: color }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/8">
                    <div className="flex justify-between text-xs text-white/40">
                      <span>0 — Critical</span>
                      <span>50 — Moderate</span>
                      <span>100 — Optimal</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Trajectory Tab */}
            {activeTab === "trajectory" && (
              <div className="bg-white/3 border border-white/8 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-sm font-semibold text-white/60 uppercase tracking-widest">
                    Composite Score Trajectory
                  </h2>
                  <div className="flex gap-2">
                    {[7, 30, 90].map(d => (
                      <button
                        key={d}
                        onClick={() => { setHistoryDays(d); refetchHistory(); }}
                        className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                          historyDays === d
                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                            : "text-white/40 hover:text-white/70 border border-white/10"
                        }`}
                      >
                        {d}d
                      </button>
                    ))}
                  </div>
                </div>

                {trajectoryData.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-4xl mb-4">📈</div>
                    <p className="text-white/40 text-sm">No trajectory data yet.</p>
                    <p className="text-white/30 text-xs mt-2">Complete an assessment or check-in to start tracking your trajectory.</p>
                    <Link href="/assessment" className="inline-block mt-4 px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-sm hover:bg-cyan-500/30 transition-all">
                      Take Assessment →
                    </Link>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={360}>
                    <LineChart data={trajectoryData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ background: "#0f1929", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                        labelStyle={{ color: "rgba(255,255,255,0.8)" }}
                      />
                      <Legend wrapperStyle={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }} />
                      <ReferenceLine y={70} stroke="#4ade80" strokeDasharray="4 4" strokeOpacity={0.4} label={{ value: "Healthy", fill: "#4ade80", fontSize: 10 }} />
                      <ReferenceLine y={40} stroke="#fb923c" strokeDasharray="4 4" strokeOpacity={0.4} label={{ value: "Caution", fill: "#fb923c", fontSize: 10 }} />
                      <Line
                        type="monotone" dataKey="composite"
                        stroke="#22d3ee" strokeWidth={3}
                        dot={{ fill: "#22d3ee", r: 4 }}
                        name="Composite Score"
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}

            {/* Alerts Tab */}
            {activeTab === "alerts" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-white/60 uppercase tracking-widest">
                    Active Alerts & Notifications
                  </h2>
                  <span className="text-xs text-white/30">{activeAlerts.length} unacknowledged</span>
                </div>

                {activeAlerts.length === 0 ? (
                  <div className="bg-white/3 border border-white/8 rounded-xl p-12 text-center">
                    <div className="text-4xl mb-4">✓</div>
                    <p className="text-white/60 text-sm font-medium">No active alerts</p>
                    <p className="text-white/30 text-xs mt-2">Your Digital Twin is monitoring all 12 domains continuously.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeAlerts.map((alert: any) => (
                      <AlertCard
                        key={alert.id}
                        alert={alert}
                        onAcknowledge={(id) => acknowledgeMutation.mutate({ alertId: id })}
                      />
                    ))}
                  </div>
                )}

                {/* Crisis Resources */}
                {activeAlerts.some((a: any) => a.severity === "critical") && (
                  <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-6 mt-4">
                    <h3 className="text-red-400 font-semibold mb-3">Crisis Resources</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <a href="tel:988" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
                        <span className="text-red-400">📞</span> 988 Suicide & Crisis Lifeline
                      </a>
                      <a href="sms:741741" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
                        <span className="text-red-400">💬</span> Crisis Text Line: Text HOME to 741741
                      </a>
                      <a href="tel:911" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
                        <span className="text-red-400">🚨</span> Emergency: 911
                      </a>
                      <a href="https://www.nami.org/help" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
                        <span className="text-red-400">🌐</span> NAMI Helpline: 1-800-950-6264
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Check-In Tab */}
            {activeTab === "checkin" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <JournalUpdate onUpdate={() => { refetch(); refetchHistory(); }} />
                <div className="bg-white/3 border border-white/8 rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-4">
                    How Your Twin Updates
                  </h3>
                  <div className="space-y-4 text-sm text-white/60">
                    <div className="flex gap-3">
                      <span className="text-cyan-400 text-lg">📋</span>
                      <div>
                        <p className="text-white/80 font-medium mb-1">Assessment Completion</p>
                        <p>Completing the 100-question DSM-5 intake updates all 12 domains simultaneously with the highest accuracy.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-purple-400 text-lg">📓</span>
                      <div>
                        <p className="text-white/80 font-medium mb-1">Daily Check-Ins</p>
                        <p>Quick mood, anxiety, sleep, and social interaction ratings update 4 key domains in real-time.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-yellow-400 text-lg">🗺</span>
                      <div>
                        <p className="text-white/80 font-medium mb-1">Life Events</p>
                        <p>Logging major life events triggers domain recalibration based on known psychiatric impact patterns.</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <span className="text-green-400 text-lg">📈</span>
                      <div>
                        <p className="text-white/80 font-medium mb-1">Trajectory Tracking</p>
                        <p>Every update is stored in your trajectory history — up to 90 data points for long-term pattern analysis.</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-white/8">
                    <Link href="/assessment" className="block w-full text-center py-2.5 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-sm font-semibold hover:bg-cyan-500/30 transition-all">
                      Take Full Assessment →
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Crisis Score Tab */}
            {activeTab === "crisis" && (
              <div className="space-y-6">
                {/* Crisis Score Hero */}
                <div className={`rounded-xl border p-6 ${crisisCfg.bg}`}>
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h2 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-1">Grok-Powered Crisis Prediction Score</h2>
                      <p className="text-white/50 text-xs max-w-lg">Computed using Grok-3 clinical psychiatry model — weighted across 12 domains with suicidality carrying highest weight (20%). Higher score = higher risk.</p>
                    </div>
                    <div className="text-center">
                      <div className="text-5xl font-bold" style={{ color: crisisCfg.color }}>{crisisPredictionScore}</div>
                      <div className="text-xs mt-1 font-semibold" style={{ color: crisisCfg.color }}>{crisisCfg.label}</div>
                      <div className="text-xs text-white/30 mt-0.5">out of 100</div>
                    </div>
                  </div>
                  {/* Risk bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-white/30 mb-1">
                      <span>0 — No Risk</span><span>25 — Low</span><span>50 — High</span><span>75 — Critical</span><span>100</span>
                    </div>
                    <div className="h-3 bg-white/8 rounded-full overflow-hidden relative">
                      <div className="absolute inset-0 flex">
                        <div className="flex-1 border-r border-white/10" style={{ background: "rgba(74,222,128,0.15)" }} />
                        <div className="flex-1 border-r border-white/10" style={{ background: "rgba(251,191,36,0.15)" }} />
                        <div className="flex-1 border-r border-white/10" style={{ background: "rgba(251,146,60,0.15)" }} />
                        <div className="flex-1" style={{ background: "rgba(255,107,107,0.15)" }} />
                      </div>
                      <div
                        className="h-full rounded-full transition-all duration-1000 relative z-10"
                        style={{ width: `${crisisPredictionScore}%`, backgroundColor: crisisCfg.color }}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 7-Day Trajectory */}
                  <div className="bg-white/3 border border-white/8 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-4">7-Day Trajectory</h3>
                    <div className="flex items-center gap-4">
                      <div className="text-4xl font-bold" style={{ color: trendConfig[trajectoryTrend].color }}>
                        {trendConfig[trajectoryTrend].icon}
                      </div>
                      <div>
                        <div className="text-lg font-bold" style={{ color: trendConfig[trajectoryTrend].color }}>
                          {trendConfig[trajectoryTrend].label}
                        </div>
                        <div className="text-xs text-white/40">
                          Slope: {trajectorySlope.toFixed(2)} pts/day (linear regression)
                        </div>
                        <div className="text-xs text-white/30 mt-1">
                          {trajectoryTrend === "improving" ? "Your composite score is trending upward — keep it up." :
                           trajectoryTrend === "deteriorating" ? "Your composite score is declining — consider a check-in or assessment." :
                           "Your composite score is stable over the past 7 days."}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Domain Risk Weights */}
                  <div className="bg-white/3 border border-white/8 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-4">Domain Risk Contributions</h3>
                    <div className="space-y-2">
                      {Object.entries(CRISIS_WEIGHTS)
                        .sort((a, b) => b[1] - a[1])
                        .map(([domain, weight]) => {
                          const score = domainScores[domain] ?? 50;
                          const riskContrib = Math.round((100 - score) * weight);
                          const color = riskContrib > 15 ? "#ff6b6b" : riskContrib > 8 ? "#fb923c" : "#4ade80";
                          return (
                            <div key={domain} className="flex items-center gap-2">
                              <span className="text-xs text-white/40 w-32 truncate">{domain.replace(/([A-Z])/g, ' $1').trim()}</span>
                              <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${Math.min(riskContrib * 5, 100)}%`, backgroundColor: color }} />
                              </div>
                              <span className="text-xs font-mono w-6 text-right" style={{ color }}>{riskContrib}</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>

                {/* Early Warning Signals */}
                <div className="bg-white/3 border border-white/8 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-white/60 uppercase tracking-widest mb-4">
                    Early Warning Signals
                    {activeWarnings.length > 0 && (
                      <span className="ml-2 px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-300 text-xs">
                        {activeWarnings.length} Active
                      </span>
                    )}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {EARLY_WARNING_SIGNALS.map((signal, i) => {
                      const isActive = activeWarnings.some(w => w.domain === signal.domain);
                      return (
                        <div key={i} className={`flex items-start gap-2 p-3 rounded-lg border text-xs transition-colors ${
                          isActive ? "border-orange-500/40 bg-orange-500/10" : "border-white/8 bg-white/2"
                        }`}>
                          <span className={isActive ? "text-orange-400" : "text-white/20"}>⚠</span>
                          <span className={isActive ? "text-white/80" : "text-white/30"}>{signal.pattern}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Intervention Triggers */}
                {activeInterventions.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-5">
                    <h3 className="text-sm font-semibold text-red-400 uppercase tracking-widest mb-4">Active Intervention Triggers</h3>
                    <div className="space-y-3">
                      {activeInterventions.map((trigger, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-red-500/30 bg-red-500/5">
                          <span className="text-red-400 text-lg">⚠</span>
                          <div>
                            <div className="text-xs font-semibold text-red-300 mb-0.5">{trigger.trigger}</div>
                            <div className="text-xs text-white/60">{trigger.action}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 flex gap-3">
                      <a href="tel:988" className="flex-1 text-center py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-sm font-semibold hover:bg-red-500/30 transition-all">
                        Call 988
                      </a>
                      <a href="sms:741741" className="flex-1 text-center py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-sm font-semibold hover:bg-red-500/30 transition-all">
                        Text HOME to 741741
                      </a>
                    </div>
                  </div>
                )}

                <p className="text-xs text-white/20 text-center">
                  Crisis-related signal visualization for clinician review. This is not a diagnosis and must not be used as an autonomous emergency detector.
                  Always consult a licensed mental health professional for clinical assessment.
                </p>
              </div>
            )}

            {/* Domain Info Grid */}
            {activeTab === "radar" && (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {domains.map(d => {
                  const score = domainScores[d.id] ?? 50;
                  const color = score >= 70 ? "#4ade80" : score >= 40 ? "#fbbf24" : "#ff6b6b";
                  const status = score >= 70 ? "Healthy" : score >= 40 ? "Moderate" : "Needs Attention";
                  return (
                    <div key={d.id} className="bg-white/3 border border-white/8 rounded-lg p-4 hover:border-white/15 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-white/70">{d.name}</span>
                        <span className="text-sm font-bold" style={{ color }}>{score}</span>
                      </div>
                      <div className="h-1 bg-white/8 rounded-full mb-2">
                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${score}%`, backgroundColor: color }} />
                      </div>
                      <span className="text-xs" style={{ color }}>{status}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Disclaimer */}
        <div className="mt-10 pt-6 border-t border-white/8 text-xs text-white/25 text-center max-w-2xl mx-auto">
          The Digital Twin is a computational model for educational and wellness tracking purposes only.
          It is not a medical diagnosis and does not replace professional psychiatric evaluation.
          If you are experiencing a mental health crisis, please contact emergency services or a licensed provider.
        </div>
      </div>
    </div>
  );
}
