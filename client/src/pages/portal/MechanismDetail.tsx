// ============================================================
// MECHANISM DETAIL — three views of one strategy.
//
//   /portal/mechanism/:slug             how it actually works, step by step
//   /portal/mechanism/:slug/providers   who provides it, and what to ask them
//   /portal/mechanism/:slug/sequences   where it sits, and every legal ordering
//
// One component serves all three because they share a header, a colour and a
// dossier; `view` comes from the route. Splitting them into three files would
// duplicate the header three times and let them drift.
//
// The sequences view is the one worth reading twice. It renders the orderings
// from shared/sequenceOrderings.ts, which carries three numbers per ordering
// that are kept apart on purpose: share (of people running this combination,
// how many should run it this way), confidence (how well-supported the claim
// is) and likelihood (whether an ordinary household ever needs it at all). A
// high share with a low likelihood is the common and correct shape.
// ============================================================
import { Link, useParams } from "wouter";
import { AppShell } from "@/components/AppShell";
import { MechanismTitle, RatingChip } from "@/components/MechanismTitle";
import { ArrowLeft, AlertTriangle, CheckCircle2, ExternalLink, Lock, Info } from "lucide-react";
import { MECHANISMS, type MechanismId } from "@shared/cycleEngine";
import { dossier, PROVIDER_DISCLOSURE } from "@shared/mechanismDossiers";
import {
  COMBINATIONS, orderingsFor, rankedOrderings, shortLabel, ROLE_FITNESS, roleAt,
  ROLE_MEANING, ORDER_RULES, plausibility, type Role,
} from "@shared/sequenceOrderings";

const CARD = "rounded-2xl border border-white/10 bg-white/[0.04]";
const LABEL = "text-[10px] uppercase tracking-[0.18em] text-slate-400";

function Score({ label, value, hint, accent }: { label: string; value: number; hint: string; accent: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/25 p-3">
      <div className={LABEL}>{label}</div>
      <div className="mt-1 text-2xl font-black tabular-nums" style={{ color: accent }}>
        {value}<span className="text-sm text-slate-500">/10</span>
      </div>
      <p className="mt-1 text-[11px] text-slate-400 leading-snug">{hint}</p>
    </div>
  );
}

export default function MechanismDetail({ view = "mechanics" }: { view?: "mechanics" | "providers" | "sequences" }) {
  const { slug = "" } = useParams<{ slug: string }>();
  const d = dossier(slug as MechanismId);
  const m = MECHANISMS.find((x) => x.id === slug);

  if (!d || !m) {
    return (
      <AppShell>
        <div className="mx-auto max-w-3xl px-4 py-16 text-center space-y-4">
          <h1 className="text-2xl font-bold text-white">No such mechanism</h1>
          <p className="text-slate-400">There are five. They are listed on the index.</p>
          <Link href="/portal/mechanisms" className="text-amber-300 hover:underline">
            Back to the mechanisms
          </Link>
        </div>
      </AppShell>
    );
  }

  const tabs = [
    { key: "mechanics", href: `/portal/mechanism/${d.id}`, label: "How it works" },
    { key: "providers", href: `/portal/mechanism/${d.id}/providers`, label: "Who provides it" },
    { key: "sequences", href: `/portal/mechanism/${d.id}/sequences`, label: "Sequences" },
  ];

  const combos = COMBINATIONS.filter((c) => c.members.includes(d.id));

  return (
    <AppShell>
      <div
        className="border-b border-white/10"
        style={{ background: `linear-gradient(140deg, ${d.accent.deep}, rgba(0,0,0,0.5))` }}
      >
        <div className="mx-auto max-w-5xl px-4 py-10">
          <Link href="/portal/mechanisms" className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white mb-5">
            <ArrowLeft className="h-3.5 w-3.5" /> All five mechanisms
          </Link>
          <MechanismTitle accent={d.accent} depth={6} eyebrow={m.shortName}>
            {m.name}
          </MechanismTitle>
          <p className="mt-5 max-w-3xl text-slate-200 leading-relaxed">{d.plainly}</p>
          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
            <RatingChip label="Value" score={d.valueRating} accent={d.accent.glow} />
            <RatingChip label="Frequency" score={d.frequencyRating} accent={d.accent.base} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4">
        <nav className="flex flex-wrap gap-2 py-5 border-b border-white/10">
          {tabs.map((t) => (
            <Link
              key={t.key}
              href={t.href}
              className={`rounded-lg px-3 py-1.5 text-sm transition ${
                t.key === view
                  ? "bg-white/[0.14] text-white font-semibold"
                  : "border border-white/12 text-slate-300 hover:bg-white/[0.08]"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
        {view === "mechanics" && (
          <>
            <section className="space-y-4">
              <h2 className="text-xl font-bold text-white">What actually happens, in order</h2>
              <ol className="space-y-3">
                {d.mechanics.map((s, i) => (
                  <li key={i} className={`${CARD} p-5`}>
                    <div className="flex gap-4">
                      <span
                        className="shrink-0 grid h-8 w-8 place-items-center rounded-full text-sm font-black"
                        style={{ background: d.accent.base, color: "#fff" }}
                      >
                        {i + 1}
                      </span>
                      <div className="space-y-2 min-w-0">
                        <p className="font-semibold text-white">{s.step}</p>
                        <p className="text-sm text-slate-300">
                          <span className={LABEL}>What moves</span>
                          <br />
                          {s.whatMoves}
                        </p>
                        {s.governedBy && (
                          <p className="text-sm text-amber-200/90 flex gap-2">
                            <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                            <span>
                              <span className={LABEL}>Governed by</span>
                              <br />
                              {s.governedBy}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <div className="grid gap-5 md:grid-cols-2">
              <section className={`${CARD} p-5`}>
                <h3 className="flex items-center gap-2 font-bold text-emerald-300 mb-3">
                  <CheckCircle2 className="h-4 w-4" /> When this is the right tool
                </h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  {d.bestWhen.map((b, i) => <li key={i} className="flex gap-2"><span className="text-emerald-400">·</span>{b}</li>)}
                </ul>
              </section>
              <section className={`${CARD} p-5`}>
                <h3 className="flex items-center gap-2 font-bold text-rose-300 mb-3">
                  <AlertTriangle className="h-4 w-4" /> When it is the wrong one
                </h3>
                <ul className="space-y-2 text-sm text-slate-300">
                  {d.worstWhen.map((b, i) => <li key={i} className="flex gap-2"><span className="text-rose-400">·</span>{b}</li>)}
                </ul>
              </section>
            </div>

            <section className="grid gap-4 sm:grid-cols-2">
              <Score label="Value, to someone it suits" value={d.valueRating} hint={d.valueWhy} accent={d.accent.glow} />
              <Score label="Frequency, for a normal household" value={d.frequencyRating} hint={d.frequencyWhy} accent={d.accent.base} />
            </section>

            <section className={`${CARD} p-5`}>
              <h3 className="font-bold text-white mb-3">How it combines with the other four</h3>
              <div className="space-y-3">
                {d.interop.map((io) => {
                  const other = MECHANISMS.find((x) => x.id === io.with)!;
                  return (
                    <div key={io.with} className="rounded-lg border border-white/10 bg-black/25 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Link href={`/portal/mechanism/${io.with}`} className="font-semibold text-white hover:underline">
                          with {other.shortName}
                        </Link>
                        <span className="text-xs tabular-nums text-slate-400">
                          together {io.strength}/10
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-300">{io.how}</p>
                      <p className="mt-2 text-sm text-amber-200/85 flex gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        {io.caution}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {view === "providers" && (
          <>
            <section className="space-y-2">
              <h2 className="text-xl font-bold text-white">{d.providers.length} companies that do this</h2>
              <p className="text-sm text-slate-400 max-w-3xl">{PROVIDER_DISCLOSURE}</p>
            </section>
            <div className="space-y-3">
              {d.providers.map((p) => (
                <article key={p.name} className={`${CARD} p-5`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h3 className="font-bold text-white">{p.name}</h3>
                    <div className="flex items-center gap-3">
                      {p.registryId && (
                        <Link
                          href={`/portal/alt-credit/${p.registryId}`}
                          className="text-xs text-emerald-300 hover:underline"
                        >
                          Verified record →
                        </Link>
                      )}
                      <a
                        href={p.homepage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-amber-300 hover:underline"
                      >
                        Their site <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{p.what}</p>
                  <p className="mt-3 rounded-lg border border-white/10 bg-black/25 p-3 text-sm text-white">
                    <span className={LABEL}>Ask this first</span>
                    <br />
                    {p.askFirst}
                  </p>
                </article>
              ))}
            </div>
          </>
        )}

        {view === "sequences" && (
          <>
            <section className={`${CARD} p-5 space-y-3`}>
              <h2 className="text-xl font-bold text-white">Position is a role, not a number</h2>
              <p className="text-sm text-slate-300">
                The same mechanism does a different job depending on where it sits. Here is what{" "}
                {m.shortName} is being asked to do in each position.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {(["source", "converter", "sink"] as Role[]).map((r) => {
                  const f = ROLE_FITNESS[d.id][r];
                  return (
                    <div key={r} className="rounded-lg border border-white/10 bg-black/25 p-4">
                      <div className="flex items-baseline justify-between">
                        <span className="text-sm font-bold capitalize text-white">{r}</span>
                        <span className="text-lg font-black tabular-nums" style={{ color: d.accent.glow }}>
                          {f.fit}<span className="text-xs text-slate-500">/10</span>
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">{ROLE_MEANING[r]}</p>
                      <p className="mt-2 text-sm text-slate-300">{f.meaning}</p>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className={`${CARD} p-5 space-y-3`}>
              <h3 className="font-bold text-white">Orders the paperwork forbids</h3>
              <p className="text-sm text-slate-400">
                These are contract terms, not preferences. An ordering that breaks one is removed
                from every list on this site rather than ranked low.
              </p>
              <ul className="space-y-2">
                {ORDER_RULES.filter((r) => r.strength === "hard").map((r) => (
                  <li key={r.id} className="rounded-lg border border-rose-400/25 bg-rose-500/[0.06] p-3">
                    <div className="text-sm font-semibold text-rose-200">
                      {shortLabel([r.before])} must come before {shortLabel([r.after])}
                    </div>
                    <p className="mt-1 text-sm text-slate-300">{r.why}</p>
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-5">
              <h2 className="text-xl font-bold text-white">
                {combos.length} combinations use {m.shortName}
              </h2>
              {combos.map((c) => {
                const os = orderingsFor(c.id);
                const legal = rankedOrderings(c.members);
                return (
                  <article key={c.id} className={`${CARD} p-5 space-y-4`}>
                    <header>
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h3 className="text-lg font-bold text-white">{c.name}</h3>
                        <span className="text-xs text-slate-400 tabular-nums">
                          {legal.length} legal of {[1, 1, 2, 6, 24, 120][c.members.length]} orderings
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-300">{c.premise}</p>
                      <p className="mt-1 text-xs text-slate-500">{shortLabel(c.members)}</p>
                    </header>

                    {os.map((o) => (
                      <div key={o.order.join()} className="rounded-lg border border-white/10 bg-black/25 p-4 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-wider"
                            style={{ background: d.accent.base, color: "#fff" }}
                          >
                            Order {o.rank}
                          </span>
                          <span className="font-semibold text-white text-sm">{shortLabel(o.order)}</span>
                        </div>

                        <div className="flex flex-wrap gap-4 text-xs">
                          <span className="text-slate-300">
                            <span className={LABEL}>Share</span>{" "}
                            <strong className="tabular-nums text-white">{o.sharePct}%</strong>{" "}
                            <span className="text-slate-500">of people running this combination</span>
                          </span>
                          <span className="text-slate-300">
                            <span className={LABEL}>Confidence</span>{" "}
                            <strong className="tabular-nums text-white">{o.confidence}/10</strong>
                          </span>
                          <span className="text-slate-300">
                            <span className={LABEL}>Likelihood you need it</span>{" "}
                            <strong className="tabular-nums text-white">{o.likelihood}/10</strong>
                          </span>
                          <span className="text-slate-500">
                            rules score {plausibility(o.order)}
                          </span>
                        </div>

                        <div>
                          <div className={LABEL}>Shines when</div>
                          <ul className="mt-1 space-y-1 text-sm text-slate-300">
                            {o.shinesWhen.map((s, i) => (
                              <li key={i} className="flex gap-2"><span style={{ color: d.accent.glow }}>·</span>{s}</li>
                            ))}
                          </ul>
                        </div>
                        <p className="text-sm text-rose-200/90 flex gap-2">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                          <span><span className={LABEL}>Fails when</span><br />{o.failsWhen}</span>
                        </p>
                        <p className="text-sm text-emerald-200/90">
                          <span className={LABEL}>What emerges</span>
                          <br />
                          {o.emergent}
                        </p>
                      </div>
                    ))}

                    <p className="flex gap-2 text-xs text-slate-500 pt-1">
                      <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      The remaining {c.residualPct}% of households running this combination land on
                      an ordering not written up here. The list is ranked, not exhaustive.
                    </p>
                  </article>
                );
              })}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

export function MechanismProviders() { return <MechanismDetail view="providers" />; }
export function MechanismSequences() { return <MechanismDetail view="sequences" />; }
