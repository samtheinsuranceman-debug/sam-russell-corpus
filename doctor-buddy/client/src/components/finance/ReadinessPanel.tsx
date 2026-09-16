import { useState } from "react";
import { Link } from "wouter";
import { AlertTriangle, Brain, ShieldCheck, Activity, Gauge, ClipboardList, PauseCircle, PlayCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { DecisionTier, FinancialReadinessProfile } from "@shared/engines/psychFinancialBridge";
import { pauseActive, pauseDaysLeft, type SelfPause } from "@shared/engines/readinessEvidence";
import { money } from "@shared/finance/format";
import { CLINICAL_TOOLS_ENABLED } from "@/lib/releasePolicy";
import { clearPause, savePause } from "@/lib/financeStorage";

export const TIER_STYLE: Record<DecisionTier, { label: string; badge: string; bar: string }> = {
  clear: { label: "Clear", badge: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30", bar: "[&>div]:bg-emerald-400" },
  measured: { label: "Measured", badge: "bg-cyan-400/15 text-cyan-300 border-cyan-400/30", bar: "[&>div]:bg-cyan-400" },
  guarded: { label: "Guarded", badge: "bg-amber-400/15 text-amber-300 border-amber-400/30", bar: "[&>div]:bg-amber-400" },
  "protective-hold": { label: "Protective hold", badge: "bg-rose-400/15 text-rose-300 border-rose-400/30", bar: "[&>div]:bg-rose-400" },
};

/**
 * The words change by edition; the numbers do not. The public wellness
 * edition reads the person's own check-ins and must never present a clinical
 * instrument, a risk score, or a second signature from a clinician.
 */
const COPY = CLINICAL_TOOLS_ENABLED
  ? {
      title: "Financial readiness, from your clinical picture",
      withData: (sources: string) => `Read from: ${sources}. Nothing here is a diagnosis or a suitability determination — it is the set of constraints your advisor and your clinician review together.`,
      noData: "No clinical data yet, so every index is at its population default. Complete the intake and this panel becomes yours.",
      ctaHref: "/assessment",
      cta: "Take the 100-question intake — about 20 minutes — and the financial engine starts reading your actual state instead of an average.",
      capped: "A stated safety signal outranks every other number on this page. Education and protection planning continue; execution waits.",
      anxiety: ["Anxiety index", "How much you are carrying right now. Higher raises the liquidity floor and favours products with a contractual floor."],
      stability: ["Stability index", "Mood, behavioural control and treatment engagement together."],
      volatility: ["Volatility index", "How fast the picture is moving. Needs a series; from a one-off intake it is derived and labelled as such."],
      coSign: "advisor + clinician",
      capacity: "Decision capacity",
      rows: { cooling: "Cooling-off", cushion: "Liquidity floor", borrowing: "Borrowing", move: "Max single move", floor: "Floor products", automation: "Automation", second: "Co-signature", review: "Review every" },
      pause: "Want a cooling-off period before anything that cannot be undone? Set one for yourself. It lifts on its own, or whenever you say.",
    }
  : {
      title: "Your check-ins and the finance tools",
      withData: (sources: string) => `Read from: ${sources}. These are your own 1-5 ratings, kept in this browser. Nothing here is a medical score, a diagnosis, or financial advice — it is a set of educational guardrails you can talk through with a licensed professional.`,
      noData: "No check-in yet, so every index is at a neutral default. Save a one-minute wellness check-in and this panel reads your own ratings instead of an average.",
      ctaHref: "/progress",
      cta: "Save a wellness check-in — about a minute — and the guardrails start reading how you actually rated today instead of an average.",
      capped: "A note you raised about your safety outranks every other number on this page. Education and protection planning continue; anything that cannot be undone waits.",
      anxiety: ["Your reported stress", "From how rested and focused you rated yourself. Higher suggests a bigger emergency fund and simpler products."],
      stability: ["Your reported stability", "Mood, energy and connection together, from your latest check-in."],
      volatility: ["Your reported recent change", "How much your check-ins have moved lately. Needs at least three; from a single check-in it is estimated and labelled as such."],
      coSign: "advisor + someone you trust",
      capacity: "Check-in score",
      rows: { cooling: "Cooling-off period", cushion: "Emergency fund target", borrowing: "Borrowing limit", move: "Max transaction size", floor: "Simple products", automation: "Automated actions", second: "Second opinion", review: "Review cadence" },
      pause: "Set a cooling-off period to create a waiting time before making large financial changes. This is a personal pause you can turn on or off at any time.",
    };

function Meter({ label, value, invert = false, hint }: { label: string; value: number; invert?: boolean; hint: string }) {
  // Anxiety and volatility are "lower is better"; colour them that way.
  const good = invert ? value < 40 : value > 60;
  const bad = invert ? value > 65 : value < 40;
  const color = bad ? "[&>div]:bg-rose-400" : good ? "[&>div]:bg-emerald-400" : "[&>div]:bg-amber-400";
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-sm text-foreground">{label}</span>
        <span className="font-mono text-sm tabular-nums text-muted-foreground">{value}</span>
      </div>
      <Progress value={value} className={`h-2 bg-muted ${color}`} />
      <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}

function PauseControl({ pause, onChange }: { pause: SelfPause | null; onChange: (p: SelfPause | null) => void }) {
  const [days, setDays] = useState(7);
  const active = pauseActive(pause);
  const left = pauseDaysLeft(pause);
  return (
    <div className="rounded-lg border border-border bg-secondary/20 px-4 py-3 text-sm" data-testid="pause-control">
      {active ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-foreground"><PauseCircle className="h-4 w-4 text-amber-300" /> You paused irreversible steps for {left} more day{left === 1 ? "" : "s"}.</span>
          <Button size="sm" variant="outline" onClick={() => { clearPause(); onChange(null); }}><PlayCircle className="mr-1.5 h-4 w-4" /> Lift the pause</Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-muted-foreground">{COPY.pause}</span>
          <div className="flex items-center gap-2">
            <select value={days} onChange={e => setDays(Number(e.target.value))} className="rounded-md border border-border bg-background px-2 py-1 text-sm" aria-label="Pause length in days">
              {[3, 7, 14, 30].map(d => <option key={d} value={d}>{d} days</option>)}
            </select>
            <Button size="sm" variant="outline" onClick={() => { const p = { startedAt: Date.now(), days }; if (savePause(p)) onChange(p); }}><PauseCircle className="mr-1.5 h-4 w-4" /> Pause</Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReadinessPanel({ profile, hasClinicalData, hasIntake, pause = null, onPauseChange }: {
  profile: FinancialReadinessProfile;
  hasClinicalData: boolean;
  hasIntake: boolean;
  pause?: SelfPause | null;
  onPauseChange?: (p: SelfPause | null) => void;
}) {
  const tier = TIER_STYLE[profile.tier];
  const g = profile.guardrails;

  return (
    <Card className="bg-card border-border" data-testid="readiness-panel">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5 text-primary" />
            {COPY.title}
          </CardTitle>
          <Badge className={`border ${tier.badge}`}>{tier.label}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{hasClinicalData ? COPY.withData(profile.sources.join(", ")) : COPY.noData}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {!hasIntake && (
          <Link href={COPY.ctaHref}>
            <div className="flex cursor-pointer items-center gap-3 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-sm hover:bg-primary/15">
              <ClipboardList className="h-4 w-4 text-primary" />
              <span className="text-foreground">{COPY.cta}</span>
            </div>
          </Link>
        )}

        {profile.cappedBy && (
          <div className="flex items-start gap-3 rounded-lg border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
            <div>
              <div className="font-medium text-rose-200">Decision capacity was capped: {profile.cappedBy}.</div>
              <div className="text-rose-200/80">{COPY.capped}</div>
            </div>
          </div>
        )}

        {onPauseChange && <PauseControl pause={pause} onChange={onPauseChange} />}

        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex items-baseline justify-between">
                <span className="flex items-center gap-2 text-sm font-medium text-foreground"><Gauge className="h-4 w-4 text-primary" /> {COPY.capacity}</span>
                <span className="font-mono text-2xl font-semibold tabular-nums text-foreground">{profile.decisionCapacity}<span className="text-sm text-muted-foreground"> / 100</span></span>
              </div>
              <Progress value={profile.decisionCapacity} className={`h-3 bg-muted ${tier.bar}`} />
            </div>
            <Meter label={COPY.anxiety[0]} value={profile.anxietyIndex} invert hint={COPY.anxiety[1]} />
            <Meter label={COPY.stability[0]} value={profile.stabilityIndex} hint={COPY.stability[1]} />
            <Meter label={COPY.volatility[0]} value={profile.volatilityIndex} invert hint={COPY.volatility[1]} />
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground"><ShieldCheck className="h-4 w-4 text-primary" /> Guardrails in force</div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">{COPY.rows.cooling}</dt>
              <dd className="font-mono tabular-nums">{g.irreversibleLocked ? "paused" : `${g.coolingOffDays} day${g.coolingOffDays === 1 ? "" : "s"}`}</dd>
              <dt className="text-muted-foreground">{COPY.rows.cushion}</dt>
              <dd className="font-mono tabular-nums">{g.liquidityFloorMonths} mo{g.liquidityFloorDollars !== null ? ` · ${money(g.liquidityFloorDollars)}` : ""}</dd>
              <dt className="text-muted-foreground">{COPY.rows.borrowing}</dt>
              <dd className="font-mono tabular-nums">{Math.round(g.leverageMultiplier * 100)}% of plan default</dd>
              <dt className="text-muted-foreground">{COPY.rows.move}</dt>
              <dd className="font-mono tabular-nums">{Math.round(g.maxSingleDecisionShare * 100)}% of liquid{g.maxSingleDecisionDollars !== null ? ` · ${money(g.maxSingleDecisionDollars)}` : ""}</dd>
              <dt className="text-muted-foreground">{COPY.rows.floor}</dt>
              <dd>{g.preferFloorProducts ? "favoured" : "neutral"}</dd>
              <dt className="text-muted-foreground">{COPY.rows.automation}</dt>
              <dd>{g.preferAutomation ? "contributions run automatically" : "neutral"}</dd>
              <dt className="text-muted-foreground">{COPY.rows.second}</dt>
              <dd>{g.requireCoSignature ? COPY.coSign : "advisor"}</dd>
              <dt className="text-muted-foreground">{COPY.rows.review}</dt>
              <dd className="font-mono tabular-nums">{g.reviewCadenceDays} days</dd>
            </dl>
          </div>
        </div>

        <ul className="space-y-1.5 border-t border-border pt-4 text-sm text-muted-foreground">
          {profile.explanation.map((line, i) => (
            <li key={i} className="flex gap-2.5"><Activity className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" /><span>{line}</span></li>
          ))}
        </ul>

        {profile.assumptions.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Not observed, defaulted to population-typical values: {profile.assumptions.join("; ")}.
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          General education, not tax, legal, investment, insurance or medical advice. <Link href="/financial-disclaimer" className="text-cyan-400 underline">Read the financial disclaimer</Link>.
        </p>
      </CardContent>
    </Card>
  );
}
