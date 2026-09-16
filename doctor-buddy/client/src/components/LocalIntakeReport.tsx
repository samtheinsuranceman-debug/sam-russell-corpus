/**
 * The intake result rendered from a locally-scored assessment.
 *
 * This is what a visitor sees when they complete the DSM-5 intake without an
 * account or before any backend exists. It is deliberately explicit about being
 * a screening output: the severity bars carry their coverage, provisional
 * domains say so, and the safety block outranks everything on the page.
 */
import { useMemo } from "react";
import { Link } from "wouter";
import {
  Brain, AlertTriangle, Phone, Download, ArrowRight, Info, ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import NavBar from "@/components/NavBar";
import { loadLocalResult } from "@/lib/intakeStorage";
import { NOTABLE_THRESHOLD, type IntakeCandidate } from "@shared/intake/scoring";

const BAND_STYLE: Record<IntakeCandidate["band"], { label: string; cls: string; bar: string }> = {
  severe: { label: "Severe range", cls: "text-red-400 border-red-500/40 bg-red-500/10", bar: "bg-red-500" },
  moderate: { label: "Moderate range", cls: "text-amber-400 border-amber-500/40 bg-amber-500/10", bar: "bg-amber-500" },
  mild: { label: "Mild range", cls: "text-yellow-400 border-yellow-500/40 bg-yellow-500/10", bar: "bg-yellow-500" },
  minimal: { label: "Minimal", cls: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10", bar: "bg-emerald-500" },
};

export default function LocalIntakeReport({ id }: { id: string }) {
  const stored = useMemo(() => loadLocalResult(id), [id]);

  if (!stored) {
    return (
      <div className="min-h-screen bg-background">
        <NavBar />
        <div className="container pt-24 pb-12 max-w-2xl">
          <Card className="border-border bg-card">
            <CardContent className="p-8 text-center">
              <Info className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <h1 className="text-lg font-semibold mb-2">This result is no longer available</h1>
              <p className="text-sm text-muted-foreground mb-6">
                Locally-scored results live in this browser only. They are cleared when site data is
                cleared, and they do not transfer between devices.
              </p>
              <Link href="/assessment">
                <Button>Take the intake</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { result, completedAt } = stored;
  const notable = result.candidates.filter(c => c.severity >= NOTABLE_THRESHOLD);

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container pt-24 pb-16 max-w-3xl">
        {/* Safety first — before anything else on the page. */}
        {result.safety.flagged && (
          <Card className="border-red-500/40 bg-red-950/30 mb-6">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h2 className="font-semibold text-red-300 mb-1">
                    You endorsed an item about self-harm or suicide
                  </h2>
                  <p className="text-sm text-red-200/80 mb-3">
                    {result.safety.urgency === "immediate"
                      ? "Please talk to someone today. If you are in immediate danger, call 911."
                      : "Please raise this with a clinician. You do not have to wait for an appointment to talk to someone."}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <a href="tel:988">
                      <Button size="sm" className="bg-red-600 hover:bg-red-500 text-white">
                        <Phone className="w-3.5 h-3.5 mr-1.5" /> Call or text 988
                      </Button>
                    </a>
                    <Link href="/crisis">
                      <Button size="sm" variant="outline" className="border-red-500/40 text-red-300">
                        More crisis resources
                      </Button>
                    </Link>
                  </div>
                  <p className="text-[11px] text-red-200/50 mt-3">
                    Doctor Buddy does not contact emergency services on your behalf. That decision
                    belongs to you and your clinician.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1.5">
            <Brain className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Screening result
            </span>
          </div>
          <h1 className="text-2xl font-bold mb-1">Your DSM-5 intake summary</h1>
          <p className="text-sm text-muted-foreground">
            Completed {new Date(completedAt).toLocaleString()} · {result.answered} of {result.inPlay} items
            answered
          </p>
        </div>

        {/* What this is and is not. */}
        <Card className="border-amber-500/25 bg-amber-500/5 mb-6">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-200/80 leading-relaxed">
              This is a <strong>screening score, not a diagnosis</strong>. It reflects only what you
              reported today, on a fixed questionnaire. A high score is a reason to talk to a
              clinician, not a conclusion about you. A low score does not rule anything out.
            </p>
          </CardContent>
        </Card>

        {!result.sufficient && (
          <Card className="border-border bg-secondary/20 mb-6">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                You answered {Math.round(result.completeness * 100)}% of the items in play. The ranking
                below is incomplete — treat unanswered domains as <em>unknown</em>, not as negative.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Domain ranking */}
        <Card className="border-border bg-card mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              What stood out{notable.length === 0 ? "" : ` — ${notable.length} domain${notable.length === 1 ? "" : "s"}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.candidates.length === 0 && (
              <p className="text-sm text-muted-foreground">No domain had enough answers to score.</p>
            )}
            {result.candidates.map(c => {
              const style = BAND_STYLE[c.band];
              return (
                <div key={c.domain}>
                  <div className="flex items-center justify-between gap-3 mb-1.5 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium truncate">{c.condition}</span>
                      <Badge variant="outline" className={`text-[10px] shrink-0 ${style.cls}`}>
                        {style.label}
                      </Badge>
                      {c.provisional && (
                        <Badge
                          variant="outline"
                          className="text-[10px] shrink-0 text-muted-foreground border-border"
                        >
                          provisional
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground font-mono shrink-0">
                      {c.severity} · {c.scored}/{c.inPlay} items
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full ${style.bar}`}
                      style={{ width: `${Math.max(2, c.severity)}%`, opacity: 0.4 + 0.6 * c.confidence }}
                    />
                  </div>
                </div>
              );
            })}
            <p className="text-[11px] text-muted-foreground pt-1">
              Bar length is severity; bar opacity is confidence. A pale bar means the domain was scored
              from few items and should be confirmed before it is acted on.
            </p>
          </CardContent>
        </Card>

        {/* The note a clinician would actually read */}
        <Card className="border-border bg-card mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Clinical note</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed font-mono">
              {result.clinicalNote}
            </p>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => {
              const blob = new Blob([JSON.stringify(stored, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `drbuddy-intake-${id}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="w-3.5 h-3.5 mr-1.5" /> Download result
          </Button>
          <Link href="/conditions">
            <Button variant="outline">
              Read about these conditions <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
          <Link href="/assessment">
            <Button variant="ghost">Retake</Button>
          </Link>
        </div>

        <p className="text-[11px] text-muted-foreground mt-6">
          This result is stored in this browser only. Nothing was uploaded. Sign in to keep a
          longitudinal record and share it with a provider.
        </p>
      </div>
    </div>
  );
}
