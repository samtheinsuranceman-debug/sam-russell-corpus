import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  Shield, ArrowLeft, Brain, TrendingUp, AlertTriangle,
  CheckCircle, Info, Lock, BarChart3, Activity
} from "lucide-react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip
} from "recharts";
import { loadLocalResult } from "@/lib/intakeStorage";
import { deriveRiskFeatures } from "@shared/intake/riskFeatures";
import { assessRisk } from "@shared/engines/riskScoring";

const PRS_BANDS = [
  { min: 800, max: 1000, label: "Optimal", color: "#22c55e", bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", description: "Exceptional mental health resilience. Strong protective factors across all domains.", action: "Maintain current wellness practices and schedule annual mental health check-ins." },
  { min: 600, max: 799, label: "Resilient", color: "#3b82f6", bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", description: "Good mental health foundation with manageable risk factors in select domains.", action: "Consider preventive therapy and targeted lifestyle interventions in flagged domains." },
  { min: 400, max: 599, label: "Moderate Risk", color: "#f59e0b", bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", description: "Elevated risk in multiple domains. Symptoms may be present but manageable.", action: "Professional evaluation recommended. Evidence-based therapy and structured support advised." },
  { min: 200, max: 399, label: "Elevated Risk", color: "#f97316", bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400", description: "Significant psychiatric risk factors present. Functional impairment likely.", action: "Prompt clinical evaluation strongly recommended. Consider medication evaluation and intensive therapy." },
  { min: 0, max: 199, label: "Critical", color: "#ef4444", bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-400", description: "Severe psychiatric risk across multiple domains. Immediate support needed.", action: "Seek immediate professional mental health care. Crisis resources available 24/7: 988 Suicide & Crisis Lifeline." },
];

const DOMAIN_DESCRIPTIONS: Record<string, string> = {
  "Mood": "Depression, bipolar spectrum, dysthymia",
  "Anxiety": "GAD, panic, social anxiety, specific phobias",
  "Trauma": "PTSD, acute stress, complex trauma",
  "Psychotic": "Schizophrenia spectrum, psychotic features",
  "Personality": "Borderline, narcissistic, antisocial patterns",
  "Substance": "Alcohol, drug, behavioral addictions",
  "Neurodevelopmental": "ADHD, autism spectrum, learning disorders",
  "Somatic": "Somatic symptom disorder, health anxiety",
};

function ScoreGauge({ score }: { score: number }) {
  const band = PRS_BANDS.find(b => score >= b.min && score <= b.max) || PRS_BANDS[4];
  const pct = (score / 1000) * 100;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-48 flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="oklch(0.15 0.02 240)" strokeWidth="10" />
          <circle
            cx="50" cy="50" r="40" fill="none"
            stroke={band.color}
            strokeWidth="10"
            strokeDasharray={`${pct * 2.513} 251.3`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1.5s ease" }}
          />
        </svg>
        <div className="text-center z-10">
          <div className="text-5xl font-black font-mono" style={{ color: band.color }}>{score}</div>
          <div className="text-xs text-muted-foreground font-mono">/ 1000</div>
        </div>
      </div>
      <Badge className={`mt-3 ${band.bg} ${band.border} ${band.text} border text-sm px-4 py-1`}>
        {band.label}
      </Badge>
    </div>
  );
}

export default function PsychiatricRiskScore() {
  const { user, isAuthenticated } = useAuth();
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<number | null>(null);

  const { data: reports } = trpc.report.myReports.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Use the most recent report that has a PRS score
  const latestReport = (reports as any[])?.find((r: any) => r.prsScore != null);

  const PRS_DOMAIN_WEIGHTS: Record<string, number> = {
    Mood: 0.20, Anxiety: 0.18, Trauma: 0.15, Psychotic: 0.12,
    Personality: 0.12, Substance: 0.10, Neurodevelopmental: 0.08, Somatic: 0.05,
  };

  // A locally-scored intake is real data about this person, so it outranks the
  // demo numbers. It also means the page works before login, which is when most
  // people will first see it.
  const localIntake = loadLocalResult();

  // Run the patent-04 engine over the intake rather than showing a number with
  // no interval. With no calibration set the engine refuses to fake precision
  // and reports that honestly — which is the behaviour the whole design claims.
  const engineAssessment = localIntake
    ? (() => {
        const derived = deriveRiskFeatures(localIntake.answers);
        return { derived, risk: assessRisk(derived.features, []) };
      })()
    : null;

  const hasPRS = !!latestReport?.prsScore;

  // Precedence: a server-computed score, else the local engine, else demo.
  // The demo path is labelled as demo everywhere it surfaces.
  const engineScore = engineAssessment
    ? Math.round(1000 - engineAssessment.risk.interval.riskScore * 10)
    : null;

  /*
    Disclosure outranks behaviour, on this page too.

    Most risk features come from longitudinal data a one-off intake cannot
    observe, so they sit at population-typical — that is, healthy — defaults.
    With six of eight features defaulted healthy, a patient who reported daily
    suicidal ideation scored 833/1000 and was shown "Optimal — exceptional
    mental health resilience". Assumed-healthy inputs must never be able to
    outvote a stated one.

    So a safety endorsement caps the score into the band matching its urgency.
    The cap can only lower the score, never raise it.
  */
  const SAFETY_CAP = { immediate: 380, same_day: 560 } as const;
  const safetyUrgency = localIntake?.result.safety.urgency ?? "none";
  const safetyCapped =
    engineScore !== null && safetyUrgency !== "none"
      ? Math.min(engineScore, SAFETY_CAP[safetyUrgency])
      : engineScore;
  const scoreWasCapped = engineScore !== null && safetyCapped !== engineScore;

  const prsScore = latestReport?.prsScore ?? safetyCapped ?? 647;

  const prsBreakdownRaw: Record<string, number> = latestReport?.prsBreakdown
    ?? (localIntake
      ? Object.fromEntries(
          localIntake.result.candidates.slice(0, 8).map(c => [c.domain, c.severity]),
        )
      : {
          Mood: 72, Anxiety: 58, Trauma: 81, Psychotic: 94,
          Personality: 68, Substance: 85, Neurodevelopmental: 61, Somatic: 74,
        });

  const dataSource: "server" | "intake" | "demo" =
    hasPRS ? "server" : engineAssessment ? "intake" : "demo";

  const prsData = {
    score: prsScore,
    domains: Object.entries(prsBreakdownRaw).map(([domain, score]) => ({
      domain,
      score: Math.round(score as number),
      weight: PRS_DOMAIN_WEIGHTS[domain] ?? 0.05,
    })),
    // Approximate percentile: score/10 mapped to 0-100
    percentile: Math.min(99, Math.round(prsScore / 10)),
    computedAt: latestReport?.createdAt ?? new Date().toISOString(),
  };

  const band = PRS_BANDS.find(b => prsData.score >= b.min && b.max >= prsData.score) || PRS_BANDS[2];

  const radarData = prsData.domains.map(d => ({
    domain: d.domain,
    score: d.score,
    fullMark: 100,
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/30 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <ArrowLeft className="w-4 h-4 mr-1.5" />Back
              </Button>
            </Link>
            <div className="w-px h-5 bg-border" />
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              <h1 className="font-bold text-lg">Psychiatric Risk Score™</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-emerald-400/30 text-emerald-400 bg-emerald-400/5 text-xs font-mono">
              PRS™ PATENT PENDING
            </Badge>
          </div>
        </div>
      </div>

      <div className="container py-8 max-w-5xl mx-auto">
        {/* Intro */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-2xl font-bold">Your Mental Health Credit Score</h2>
            {isAuthenticated && (
              <span className={`text-xs px-2 py-1 rounded-full border font-semibold ${
                hasPRS
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-400"
              }`}>
                {dataSource === "server" ? "Live Score" : dataSource === "intake" ? "From your intake" : "Demo Data"}
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl">
            The Psychiatric Risk Score™ (PRS) is a composite 0–1000 index — the first standardized mental health risk metric of its kind — 
            computed from your DSM-5 assessment across 8 clinical domains. Like a FICO score for your mind, it quantifies risk, 
            tracks progress, and guides intervention priority.
          </p>
        </div>

        {/*
          Gate on having data, not on having an account. A visitor who just
          completed the intake has everything this page needs — the engine runs
          on-device — so demanding a login here would hide a result they already
          produced.
        */}
        {!isAuthenticated && !engineAssessment ? (
          <Card className="bg-card border-border/50 text-center py-16">
            <CardContent>
              <Lock className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Complete Your Assessment First</h3>
              <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                Your PRS is computed from your 100-question DSM-5 intake. Sign in and complete the assessment to generate your score.
              </p>
              <div className="flex gap-3 justify-center">
                <a href={getLoginUrl()}>
                  <Button variant="outline">Sign In</Button>
                </a>
                <Link href="/assessment">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <Brain className="w-4 h-4 mr-2" />Start Assessment
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/*
              The uncertainty block. The product's headline claim is that risk
              scores ship with conformal intervals; before this the page showed a
              bare number (a hardcoded 647 when there was no report) with no
              interval anywhere. If the engine cannot support a guarantee it says
              so here rather than implying precision it does not have.
            */}
            {scoreWasCapped && (
              <Card className="border-red-500/40 bg-red-950/25">
                <CardContent className="p-5 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-300 mb-1">
                      Score limited by a safety disclosure
                    </h3>
                    <p className="text-sm text-red-200/80">
                      You endorsed an item about self-harm or suicide. The behavioural model scored{" "}
                      {engineScore}, but most of its inputs were assumed healthy because a one-off
                      questionnaire cannot observe them. What you actually reported takes
                      precedence, so the score shown is capped. Please talk to someone — call or
                      text <strong>988</strong>.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {engineAssessment && (
              <Card className="bg-card border-border/50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <BarChart3 className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">How certain is this?</h3>
                      <p className="text-sm text-muted-foreground">
                        {engineAssessment.risk.interval.calibrationSize === 0 ? (
                          <>
                            No calibration data is available, so this score carries{" "}
                            <strong>no coverage guarantee</strong>. It is a point estimate from the
                            reference models only. Treat it as a prompt for conversation, not a
                            measurement.
                          </>
                        ) : (
                          <>
                            {Math.round(engineAssessment.risk.interval.coverage * 100)}% prediction
                            interval: <strong>{engineAssessment.risk.interval.riskLower}–
                            {engineAssessment.risk.interval.riskUpper}</strong> on the 0–100 risk
                            scale, from {engineAssessment.risk.interval.calibrationSize} calibration
                            examples.
                            {engineAssessment.risk.interval.tooUncertainToAct &&
                              " That interval is too wide to act on without more information."}
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {engineAssessment.derived.unobserved.length > 0 && (
                    <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-3">
                      <p className="text-xs text-amber-200/80 leading-relaxed">
                        <strong>{engineAssessment.derived.observed.length} of{" "}
                        {engineAssessment.derived.observed.length +
                          engineAssessment.derived.unobserved.length}</strong>{" "}
                        risk features came from your answers. The rest sit at population defaults
                        because a one-off questionnaire cannot observe them:{" "}
                        <span className="font-mono">
                          {engineAssessment.derived.unobserved.join(", ")}
                        </span>
                        . Signing in and using the app over time replaces those assumptions with
                        your own data.
                      </p>
                    </div>
                  )}

                  {engineAssessment.risk.drivers.length > 0 && (
                    <div className="mt-4">
                      <div className="text-xs text-muted-foreground mb-2">What moved the score</div>
                      <div className="flex flex-wrap gap-2">
                        {engineAssessment.risk.drivers.slice(0, 6).map(d => (
                          <Badge
                            key={d.feature}
                            variant="outline"
                            className={`text-[10px] font-mono ${
                              d.direction === "raises"
                                ? "border-red-500/30 text-red-300 bg-red-500/5"
                                : "border-emerald-500/30 text-emerald-300 bg-emerald-500/5"
                            }`}
                          >
                            {d.direction === "raises" ? "↑" : "↓"} {d.feature} {d.contribution}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Score Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Gauge */}
              <Card className="bg-card border-border/50 lg:col-span-1">
                <CardContent className="p-8 flex flex-col items-center">
                  <ScoreGauge score={prsData.score} />
                  <div className="mt-6 text-center">
                    <div className="text-sm text-muted-foreground mb-1">Population Percentile</div>
                    <div className="text-2xl font-bold font-mono text-primary">{prsData.percentile}th</div>
                    <div className="text-xs text-muted-foreground mt-1">Better than {prsData.percentile}% of adults</div>
                  </div>
                </CardContent>
              </Card>

              {/* Band Info + Radar */}
              <Card className="bg-card border-border/50 lg:col-span-2">
                <CardContent className="p-6">
                  <div className={`p-4 rounded-xl ${band.bg} border ${band.border} mb-6`}>
                    <div className="flex items-start gap-3">
                      <CheckCircle className={`w-5 h-5 ${band.text} flex-shrink-0 mt-0.5`} />
                      <div>
                        <div className={`font-semibold ${band.text} mb-1`}>{band.label} Range</div>
                        <p className="text-sm text-muted-foreground">{band.description}</p>
                        <p className={`text-sm ${band.text} mt-2 font-medium`}>{band.action}</p>
                      </div>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="oklch(0.2 0.02 240)" />
                      <PolarAngleAxis dataKey="domain" tick={{ fill: "oklch(0.55 0.02 240)", fontSize: 11 }} />
                      <Radar name="Score" dataKey="score" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} strokeWidth={2} />
                      <Tooltip contentStyle={{ backgroundColor: "oklch(0.11 0.015 240)", border: "1px solid oklch(0.2 0.02 240)", borderRadius: "8px" }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Domain Breakdown */}
            <Card className="bg-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Domain Score Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {prsData.domains.map(d => {
                    const domainBand = d.score >= 80 ? PRS_BANDS[0] : d.score >= 60 ? PRS_BANDS[1] : d.score >= 40 ? PRS_BANDS[2] : PRS_BANDS[3];
                    return (
                      <div key={d.domain} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium">{d.domain}</span>
                            <span className="text-xs text-muted-foreground ml-2">{DOMAIN_DESCRIPTIONS[d.domain]}</span>
                          </div>
                          <span className={`text-sm font-mono font-bold ${domainBand.text}`}>{d.score}</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-1000"
                            style={{ width: `${d.score}%`, backgroundColor: domainBand.color }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Weight: {Math.round(d.weight * 100)}% of PRS</span>
                          <span className={domainBand.text}>{domainBand.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Score Bands Reference */}
            <Card className="bg-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Info className="w-4 h-4 text-primary" />
                  PRS™ Score Bands
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {PRS_BANDS.map(b => (
                    <div key={b.label} className={`flex items-center gap-4 p-3 rounded-lg ${b.bg} border ${b.border} ${prsData.score >= b.min && prsData.score <= b.max ? "ring-1 ring-offset-1 ring-offset-background" : ""}`} >
                      <div className={`text-lg font-black font-mono w-24 text-right ${b.text}`}>{b.min}–{b.max}</div>
                      <div className="w-px h-8 bg-border/50" />
                      <div className="flex-1">
                        <div className={`font-semibold text-sm ${b.text}`}>{b.label}</div>
                        <div className="text-xs text-muted-foreground">{b.description}</div>
                      </div>
                      {prsData.score >= b.min && prsData.score <= b.max && (
                        <Badge className={`${b.bg} ${b.border} ${b.text} border text-xs`}>Your Score</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/life-maps">
                <Card className="bg-primary/5 border-primary/20 cursor-pointer hover:border-primary/40 transition-colors h-full">
                  <CardContent className="p-5 flex items-center gap-3">
                    <Activity className="w-8 h-8 text-primary flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-sm">View Life Maps</div>
                      <div className="text-xs text-muted-foreground">See your treated vs. untreated trajectories</div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/ai-advisory">
                <Card className="bg-violet-400/5 border-violet-400/20 cursor-pointer hover:border-violet-400/40 transition-colors h-full">
                  <CardContent className="p-5 flex items-center gap-3">
                    <Brain className="w-8 h-8 text-violet-400 flex-shrink-0" />
                    <div>
                      <div className="font-semibold text-sm">AI Advisory</div>
                      <div className="text-xs text-muted-foreground">Get evidence-based treatment recommendations</div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" />
              PRS™ is an educational risk assessment tool. It does not constitute a clinical diagnosis. Always consult a qualified mental health professional.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
