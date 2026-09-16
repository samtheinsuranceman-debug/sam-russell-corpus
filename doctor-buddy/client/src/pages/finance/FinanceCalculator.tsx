import { useMemo } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, Lock, ShieldAlert } from "lucide-react";
import NavBar from "@/components/NavBar";
import CalcRunner from "@/components/finance/CalcRunner";
import { TIER_STYLE } from "@/components/finance/ReadinessPanel";
import { Badge } from "@/components/ui/badge";
import { useClinicalEvidence } from "@/lib/clinicalEvidence";
import { CLINICAL_TOOLS_ENABLED } from "@/lib/releasePolicy";
import { loadFactFinder, financialContextFrom, calcDefaultsFrom } from "@/lib/financeStorage";
import { calcById } from "@shared/finance/calc";
import { calculatorFlags } from "@shared/engines/psychFinancialBridge";
import NotFound from "@/pages/NotFound";

export default function FinanceCalculator() {
  const { id } = useParams<{ id: string }>();
  const def = id ? calcById(id) : undefined;
  const stored = useMemo(() => loadFactFinder(), []);
  const context = useMemo(() => financialContextFrom(stored?.data ?? null), [stored]);
  const initial = useMemo(() => calcDefaultsFrom(stored?.data ?? null), [stored]);
  const { profile } = useClinicalEvidence(context);

  if (!def) return <NotFound />;

  const flags = calculatorFlags(def);
  const g = profile.guardrails;
  const recommended = profile.calculators.find(c => c.id === def.id);
  const tier = TIER_STYLE[profile.tier];

  const note =
    g.irreversibleLocked && (flags.irreversible || flags.leverage)
      ? "Protective hold is in force. This calculator still runs so you can learn what it models, but nothing it describes is initiated right now."
      : flags.leverage && g.leverageMultiplier < 1
        ? `This models borrowing. At your current tier, borrowing is limited to ${Math.round(g.leverageMultiplier * 100)}% of the plan default and no single move commits more than ${Math.round(g.maxSingleDecisionShare * 100)}% of liquid assets.`
        : flags.irreversible && g.coolingOffDays > 1
          ? `This models a step that cannot be undone. At your current tier, ${g.coolingOffDays} days sit between deciding and executing it${g.requireCoSignature ? (CLINICAL_TOOLS_ENABLED ? ", and your advisor and clinician both sign off" : ", and a second person you trust looks it over with you") : ""}.`
          : null;

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container py-8 max-w-6xl">
        <Link href="/finance" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft className="h-4 w-4" /> All calculators
        </Link>
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{def.category}</div>
            <h1 className="text-2xl font-bold text-foreground">{def.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{def.blurb}</p>
          </div>
          <Badge className={`border ${tier.badge}`}>{tier.label} · capacity {profile.decisionCapacity}</Badge>
        </div>

        {note && (
          <div className={`mb-6 flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${g.irreversibleLocked ? "border-rose-400/30 bg-rose-400/10 text-rose-100" : "border-amber-400/30 bg-amber-400/10 text-amber-100"}`}>
            {g.irreversibleLocked ? <Lock className="mt-0.5 h-4 w-4 shrink-0" /> : <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />}
            <span>{note}</span>
          </div>
        )}
        {recommended && (
          <p className="mb-6 text-sm text-muted-foreground">Open for your profile: {recommended.reason}</p>
        )}

        <CalcRunner def={def} initial={initial} />

        {stored && (
          <p className="mt-4 text-xs text-muted-foreground">
            Pre-filled from your fact finder where the meaning is unambiguous. <Link href="/finance/fact-finder" className="text-primary underline underline-offset-4">Update it</Link>.
          </p>
        )}
      </div>
    </div>
  );
}
