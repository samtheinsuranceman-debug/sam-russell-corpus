import { useMemo } from "react";
import { Link, useParams } from "wouter";
import { ArrowLeft, Lock } from "lucide-react";
import NavBar from "@/components/NavBar";
import CalcRunner from "@/components/finance/CalcRunner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useClinicalEvidence } from "@/lib/clinicalEvidence";
import { loadFactFinder, financialContextFrom, calcDefaultsFrom } from "@/lib/financeStorage";
import { strategyBySlug } from "@shared/finance/strategies";
import { calcById } from "@shared/finance/calc";
import NotFound from "@/pages/NotFound";

const STATUS_STYLE = {
  recommended: "bg-emerald-400/15 text-emerald-300 border-emerald-400/30",
  conditional: "bg-cyan-400/15 text-cyan-300 border-cyan-400/30",
  deferred: "bg-amber-400/15 text-amber-300 border-amber-400/30",
  blocked: "bg-rose-400/15 text-rose-300 border-rose-400/30",
} as const;

export default function FinanceStrategy() {
  const { slug } = useParams<{ slug: string }>();
  const strategy = slug ? strategyBySlug(slug) : undefined;
  const stored = useMemo(() => loadFactFinder(), []);
  const context = useMemo(() => financialContextFrom(stored?.data ?? null), [stored]);
  const initial = useMemo(() => calcDefaultsFrom(stored?.data ?? null), [stored]);
  const { profile } = useClinicalEvidence(context);

  if (!strategy) return <NotFound />;
  const gate = profile.strategies.find(s => s.slug === strategy.slug);

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <div className="container py-8 max-w-5xl">
        <Link href="/finance" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-4">
          <ArrowLeft className="h-4 w-4" /> All strategies
        </Link>
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">{strategy.kicker}</span>
            {gate && (
              <Badge className={`border ${STATUS_STYLE[gate.status]}`}>
                {gate.status === "blocked" && <Lock className="mr-1 h-3 w-3" />}{gate.status} · fit {gate.fit}
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold text-foreground">{strategy.title}</h1>
          <p className="mt-2 text-muted-foreground">{strategy.lede}</p>
        </div>

        {gate && (
          <Card className={`mb-8 border ${STATUS_STYLE[gate.status]}`}>
            <CardContent className="p-4 text-sm">
              <div className="font-medium mb-1">For your profile right now</div>
              <ul className="list-disc pl-5 space-y-1 opacity-90">{gate.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
            </CardContent>
          </Card>
        )}

        {strategy.sections.map(sec => (
          <section key={sec.heading} className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-2">{sec.heading}</h2>
            {sec.body.map((p, i) => <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-3">{p}</p>)}
          </section>
        ))}

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-2">The uncomfortable part</h2>
          <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">{strategy.caveats.map((c, i) => <li key={i}>{c}</li>)}</ul>
        </section>

        <h2 className="text-lg font-semibold text-foreground mb-3">Run the numbers</h2>
        <div className="space-y-8">
          {strategy.calculators.map(id => {
            const def = calcById(id);
            if (!def) return null;
            return (
              <div key={id}>
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <h3 className="font-medium text-foreground">{def.name}</h3>
                  <Link href={`/finance/calc/${def.id}`} className="text-xs text-primary underline underline-offset-4">Open</Link>
                </div>
                <CalcRunner def={def} initial={initial} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
