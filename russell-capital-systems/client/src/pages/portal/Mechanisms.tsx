// ============================================================
// THE MECHANISM INDEX — /portal/mechanisms.
//
// Five strategies, each with its own three-page dossier. The index exists to
// make one point before anybody clicks anything: value and frequency are
// different numbers, and the list is sorted by FREQUENCY rather than by value.
//
// Sorted by value, the page would lead with BRRRR and the policy loan — the
// two that need the most capital, the most skill and the longest commitment.
// Sorted by frequency it leads with velocity banking, which most households
// can start this month. That ordering is the honest one and it is also the
// less impressive one, which is why almost nobody does it.
// ============================================================
import { Link } from "wouter";
import { AppShell } from "@/components/AppShell";
import { MechanismTitle, RatingChip } from "@/components/MechanismTitle";
import { Layers, ArrowRight, Info } from "lucide-react";
import { byFrequency, PROVIDER_COUNT, PROVIDER_DISCLOSURE } from "@shared/mechanismDossiers";
import { MECHANISMS } from "@shared/cycleEngine";
import { COMBINATIONS, ORDERING_COUNT } from "@shared/sequenceOrderings";

const CARD = "rounded-2xl border border-white/10 bg-white/[0.04]";

export default function Mechanisms() {
  const dossiers = byFrequency();
  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-10">
        <header className="space-y-4">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-amber-300/80">
            <Layers className="h-3.5 w-3.5" /> The five mechanisms
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Every strategy, rated twice
          </h1>
          <p className="text-slate-300 max-w-2xl leading-relaxed">
            Each mechanism carries two scores that are deliberately kept apart.{" "}
            <strong className="text-white">Value</strong> is how much it is worth to someone it
            suits. <strong className="text-white">Frequency</strong> is how often a normal household
            under ordinary circumstances actually has a use for it. Collapsing those into one number
            is the central dishonesty of financial marketing — a policy loan cycle is a 7 for value
            and a 2 for frequency, and one number cannot say both.
          </p>
          <p className="text-sm text-slate-400 max-w-2xl">
            This list is ordered by frequency, not by value. That puts the least impressive
            mechanism first, which is the correct order to read them in.
          </p>
        </header>

        <div className="space-y-5">
          {dossiers.map((d) => {
            const m = MECHANISMS.find((x) => x.id === d.id)!;
            return (
              <article
                key={d.id}
                className={`${CARD} p-6`}
                style={{ borderColor: `${d.accent.base}55`, background: `linear-gradient(135deg, ${d.accent.deep}40, rgba(255,255,255,0.03))` }}
              >
                <MechanismTitle
                  as="h2"
                  accent={d.accent}
                  depth={4}
                  className="text-2xl sm:text-3xl"
                  eyebrow={m.shortName}
                >
                  {m.name}
                </MechanismTitle>

                <p className="mt-4 text-slate-300 leading-relaxed">{d.plainly}</p>

                <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
                  <RatingChip label="Value" score={d.valueRating} accent={d.accent.glow} />
                  <RatingChip label="Frequency" score={d.frequencyRating} accent={d.accent.base} />
                </div>

                <div className="mt-5 rounded-lg border border-white/10 bg-black/25 p-4">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                    The one question that decides it
                  </div>
                  <p className="mt-1 text-white font-medium">{d.decidingQuestion}</p>
                </div>

                <nav className="mt-5 flex flex-wrap gap-2">
                  {[
                    { href: `/portal/mechanism/${d.id}`, label: "How it works" },
                    { href: `/portal/mechanism/${d.id}/providers`, label: `Who provides it (${d.providers.length})` },
                    { href: `/portal/mechanism/${d.id}/sequences`, label: "Where it sits in a sequence" },
                  ].map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.06] px-3 py-1.5 text-sm text-white hover:bg-white/[0.12] transition"
                    >
                      {l.label} <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  ))}
                </nav>
              </article>
            );
          })}
        </div>

        <section className={`${CARD} p-6 space-y-3`}>
          <h2 className="text-lg font-bold text-white">What else is here</h2>
          <ul className="text-sm text-slate-300 space-y-2">
            <li>
              <Link href="/portal/infinite-banking" className="text-amber-300 hover:underline">
                The cycle engine
              </Link>{" "}
              — twenty-year simulation whose headline output is the year the sequence breaks.
            </li>
            <li>
              {COMBINATIONS.length} combinations and {ORDERING_COUNT} annotated orderings, each with
              its own confidence and likelihood score. Reachable from any mechanism's sequences page.
            </li>
            <li>
              {PROVIDER_COUNT} named providers across the five mechanisms, each linking its own
              homepage.
            </li>
          </ul>
          <p className="flex gap-2 text-xs text-slate-400 pt-2 border-t border-white/10">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{PROVIDER_DISCLOSURE}</span>
          </p>
        </section>
      </div>
    </AppShell>
  );
}
