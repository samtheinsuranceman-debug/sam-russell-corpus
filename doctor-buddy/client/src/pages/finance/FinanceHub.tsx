import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Calculator, ClipboardList, Landmark, Lock, ArrowRight, Sparkles } from "lucide-react";
import NavBar from "@/components/NavBar";
import ReadinessPanel from "@/components/finance/ReadinessPanel";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useClinicalEvidence } from "@/lib/clinicalEvidence";
import { loadFactFinder, factFinderProgress, financialContextFrom, loadPause } from "@/lib/financeStorage";
import { CLINICAL_TOOLS_ENABLED } from "@/lib/releasePolicy";
import { STRATEGIES } from "@shared/finance/strategies";
import { calcsByCategory } from "@shared/finance/calc";
import { calculatorFlags, type StrategyStatus } from "@shared/engines/psychFinancialBridge";

const STATUS_STYLE: Record<StrategyStatus, string> = {
  recommended: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
  conditional: "bg-cyan-400/15 text-cyan-300 border-cyan-400/30",
  deferred: "bg-amber-400/15 text-amber-300 border-amber-400/30",
  blocked: "bg-rose-400/15 text-rose-300 border-rose-400/30",
};

export default function FinanceHub() {
  const stored = useMemo(() => loadFactFinder(), []);
  const context = useMemo(() => financialContextFrom(stored?.data ?? null), [stored]);
  const [pause, setPause] = useState(() => loadPause());
  const evidence = useClinicalEvidence(context, pause);
  const { profile } = evidence;
  const progress = stored ? factFinderProgress(stored.data) : null;
  const recommendedIds = new Set(profile.calculators.map(c => c.id));
  const groups = useMemo(() => calcsByCategory(), []);
  const gateBySlug = new Map(profile.strategies.map(s => [s.slug, s]));

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container py-8 max-w-6xl">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Landmark className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground font-medium">Medically-driven financial planning</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{CLINICAL_TOOLS_ENABLED ? "A financial plan that reads the clinical picture first" : "Financial education that starts with how you feel"}</h1>
          <p className="text-muted-foreground text-sm max-w-3xl">
            Every strategy in Russell Capital Systems — tax-free income, mortgage elimination, divorce shielding, legacy, practice
            protection — sits behind one gate: how you are doing right now. {CLINICAL_TOOLS_ENABLED
              ? "Your anxiety, stability and volatility set the cooling-off periods, the liquidity floor, the borrowing limit and which strategies open at all. A strong balance sheet cannot argue a safety signal out of the way; a calmer week can."
              : "Your self-reported wellness check-ins set personal guardrails for these educational tools: a cooling-off period before big moves, an emergency fund target, a borrowing limit, and which strategy explainers open first. Learn at a pace that reflects how you feel."}
          </p>
        </div>

        <ReadinessPanel profile={profile} hasClinicalData={evidence.hasClinicalData} hasIntake={evidence.hasIntake} pause={pause} onPauseChange={setPause} />

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Link href="/finance/fact-finder">
            <Card className="card-hover cursor-pointer bg-card border border-primary/20 h-full">
              <CardContent className="p-5 flex items-start gap-4">
                <div className="rounded-lg bg-primary/10 p-2.5"><ClipboardList className="h-5 w-5 text-primary" /></div>
                <div className="flex-1">
                  <div className="font-semibold text-foreground">Financial fact finder</div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Income, tax, assets, debts, protection, goals. Saves as you go — do it in pieces. It turns every ratio above into dollars and pre-fills every calculator.
                  </p>
                  {progress && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {progress.answered} of {progress.total} answered · {Math.round(progress.ratio * 100)}% — <span className="text-primary">resume</span>
                    </div>
                  )}
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground mt-1" />
              </CardContent>
            </Card>
          </Link>
          <Card className="bg-card border-border h-full">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="rounded-lg bg-primary/10 p-2.5"><Sparkles className="h-5 w-5 text-primary" /></div>
              <div>
                <div className="font-semibold text-foreground">How the gate works</div>
                <p className="text-sm text-muted-foreground mt-1">
                  Disclosure outranks behaviour. Guardrails only tighten. Assumptions are named. Same inputs, same answer. The engine
                  is deterministic and every default it had to assume is listed on the panel above.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <h2 className="mt-10 mb-3 text-lg font-semibold text-foreground">Strategies, gated by your profile</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {STRATEGIES.map(s => {
            const gate = gateBySlug.get(s.slug);
            const status = gate?.status ?? "conditional";
            return (
              <Link key={s.slug} href={`/finance/strategy/${s.slug}`}>
                <Card className="card-hover cursor-pointer bg-card border-border h-full">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">{s.kicker}</span>
                      <Badge className={`border ${STATUS_STYLE[status]}`}>
                        {status === "blocked" && <Lock className="mr-1 h-3 w-3" />}{status}
                      </Badge>
                    </div>
                    <div className="font-semibold text-foreground">{s.title}</div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{s.summary}</p>
                    {gate && (
                      <div className="mt-3 text-xs text-muted-foreground">
                        Fit {gate.fit} · {gate.reasons[0]}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <h2 className="mt-10 mb-1 text-lg font-semibold text-foreground">Calculators</h2>
        <p className="text-sm text-muted-foreground mb-4">
          {profile.calculators.length} of the {groups.reduce((n, g) => n + g.calcs.length, 0)} are open for your profile right now and marked below. The rest still run — they just carry a guardrail note.
        </p>
        {groups.map(({ category, calcs }) => (
          <div key={category} className="mb-6">
            <div className="mb-2 text-sm font-medium text-foreground">{category}</div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {calcs.map(c => {
                const open = recommendedIds.has(c.id);
                const flags = calculatorFlags(c);
                return (
                  <Link key={c.id} href={`/finance/calc/${c.id}`}>
                    <div className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 hover:bg-muted/40 cursor-pointer ${open ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
                      <Calculator className={`mt-0.5 h-4 w-4 shrink-0 ${open ? "text-primary" : "text-muted-foreground"}`} />
                      <div className="min-w-0">
                        <div className="text-sm text-foreground truncate">{c.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {open ? "open for your profile" : flags.leverage ? "models borrowing" : flags.irreversible ? "irreversible step" : "runs with a guardrail note"}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        <p className="mt-8 text-xs text-muted-foreground max-w-3xl">
          General education, not tax, legal, investment, insurance or medical advice. Figures are illustrations under stated assumptions and are not
          guaranteed. {CLINICAL_TOOLS_ENABLED
            ? "Every strategy is reviewed by a licensed advisor for suitability and by your treating clinician before anything is implemented."
            : "Talk with a licensed professional about your own situation before acting on anything here."} <Link href="/financial-disclaimer" className="text-cyan-400 underline">Financial disclaimer</Link>.
        </p>
      </div>
    </div>
  );
}
