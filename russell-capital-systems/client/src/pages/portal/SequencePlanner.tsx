// ============================================================
// THE SEQUENCE PLANNER — /portal/sequence-planner.
//
// Situation in, ranked plans out, every stage carrying its own numbers.
//
// The page has three parts. The situation form, which is the household's
// inputs and nothing else. The archetypes, which are the dozen shapes the
// search keeps finding, run live through the planner so the prose and the
// arithmetic cannot disagree. And the search itself: a beam search over every
// legal move against the stated goal, with the count of legal plans shown
// beside the results so "thousands of options" is a number on the screen
// rather than a claim in a brochure.
//
// Every stage shows capital in, capital out, the obligation created and
// whether it amortises, the months it takes, the variant that set the
// numbers, what to expect and what to watch. The covenants are enforced per
// property, and a refused move is shown with the reason it was refused.
// ============================================================
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { AppShell } from "@/components/AppShell";
import { Layers, Search, AlertTriangle, ChevronDown, Info, Ban } from "lucide-react";
import {
  type Situation, type Plan, type Stage, type Goal, type Documentation, type MoveId,
  THIRTY_HOUSE_OPERATOR, FIRST_TIME_HOUSEHOLD, rankPlans, enumeratePlans, runPlan, describeSequence,
  MOVES, refusal, initialState, PLANNER_DISCLOSURE,
} from "@shared/sequencePlanner";
import { ARCHETYPES, byLikelihood, type Archetype } from "@shared/sequenceArchetypes";
import { THRESHOLD_COUNT, VARIANT_COUNT } from "@shared/thresholds";

const CARD = "rounded-2xl border border-white/10 bg-white/[0.04]";
const LABEL = "text-[10px] uppercase tracking-[0.18em] text-slate-400";
const INPUT = "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white tabular-nums";
const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const short = (n: number) => (Math.abs(n) >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : `$${Math.round(n / 1e3)}k`);

function Num({ label, value, onChange, step = 1, hint }: { label: string; value: number; onChange: (n: number) => void; step?: number; hint?: string }) {
  return (
    <label className="block">
      <span className={LABEL}>{label}</span>
      <input type="number" className={INPUT} value={value} step={step} onChange={(e) => onChange(Number(e.target.value))} />
      {hint && <span className="text-[11px] text-slate-500">{hint}</span>}
    </label>
  );
}

function StageRow({ s }: { s: Stage }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="rounded-lg border border-white/10 bg-black/25">
      <button className="w-full text-left p-3 flex items-start gap-3" onClick={() => setOpen((o) => !o)}>
        <span className="shrink-0 grid h-7 w-7 place-items-center rounded-full bg-amber-400/20 text-amber-200 text-xs font-black">{s.index}</span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-white text-sm">{s.label}{s.via ? <span className="ml-2 text-[10px] uppercase tracking-wider text-emerald-300">via {s.via}</span> : null}</span>
          <span className="block text-xs text-slate-400 tabular-nums mt-0.5">
            {s.months}mo · in {short(s.capitalIn)} · out {short(s.capitalOut)} · {s.amortises ? "amortises" : "balloon"} · after: {s.after.properties} props, debt {short(s.after.totalDebt)}, reserve {short(s.after.reserve)}
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-3 pb-3 pl-[52px] space-y-2 text-sm">
          <p className="text-slate-200"><span className={LABEL}>Expected</span><br />{s.expected}</p>
          <p className="text-amber-200/90 flex gap-2"><AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" /><span><span className={LABEL}>Watch</span><br />{s.watch}</span></p>
          <p className="text-xs text-slate-500">Cost of capital {Math.round(s.costOfCapital.low * 100)}–{Math.round(s.costOfCapital.high * 100)}% · obligation created {usd(s.obligationCreated)} · acts on {s.targets.join(", ")}</p>
        </div>
      )}
    </li>
  );
}

function PlanCard({ p, rank }: { p: Plan; rank: number }) {
  return (
    <article className={`${CARD} p-5 space-y-3`}>
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <span className="rounded bg-amber-400/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-200 mr-2">Plan {rank}</span>
          <span className="text-sm text-white font-semibold">{p.stages.length} stages · {(p.final.monthsElapsed / 12).toFixed(1)} years</span>
        </div>
        <span className="text-xs tabular-nums text-slate-400">score {p.score} · balloons {p.balloons}</span>
      </header>
      <p className="text-sm text-slate-300">{describeSequence(p.moves)}</p>
      <p className="text-sm text-emerald-200">{p.verdict}</p>
      <ol className="space-y-2">{p.stages.map((s) => <StageRow key={s.index} s={s} />)}</ol>
    </article>
  );
}

function ArchetypeCard({ a }: { a: Archetype }) {
  const [open, setOpen] = useState(false);
  const plan = useMemo(() => runPlan(a.situation, a.sequence), [a]);
  return (
    <article className={`${CARD} p-5 space-y-3`}>
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-bold text-white">{a.name}</h3>
        <span className="text-xs tabular-nums text-slate-400">confidence {a.confidence}/10 · likelihood {a.likelihood}/10 · {a.sequence.length} stages</span>
      </header>
      <p className="text-sm text-slate-300">{a.who}</p>
      {plan ? <p className="text-sm text-emerald-200">{plan.verdict}</p> : <p className="text-sm text-rose-300">This archetype's sequence is refused by the planner — a rule changed under it.</p>}
      <button className="text-xs text-amber-300 hover:underline" onClick={() => setOpen((o) => !o)}>{open ? "Hide" : "Show"} the reasoning and every stage</button>
      {open && (
        <div className="space-y-3 text-sm">
          <p className="text-slate-200"><span className={LABEL}>Why this order</span><br />{a.whyThisOrder}</p>
          <div><span className={LABEL}>Shines when</span><ul className="mt-1 space-y-1 text-slate-300">{a.shinesWhen.map((s, i) => <li key={i} className="flex gap-2"><span className="text-amber-300">·</span>{s}</li>)}</ul></div>
          <p className="text-rose-200/90 flex gap-2"><AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" /><span><span className={LABEL}>Fails when</span><br />{a.failsWhen}</span></p>
          <p className="text-emerald-200/90"><span className={LABEL}>What emerges</span><br />{a.emergent}</p>
          {plan && <ol className="space-y-2">{plan.stages.map((s) => <StageRow key={s.index} s={s} />)}</ol>}
        </div>
      )}
    </article>
  );
}

export default function SequencePlanner() {
  const [s, setS] = useState<Situation>(THIRTY_HOUSE_OPERATOR);
  const [depth, setDepth] = useState(8);
  const [ran, setRan] = useState<{ plans: Plan[]; count: number; ms: number } | null>(null);
  const set = <K extends keyof Situation>(k: K, v: Situation[K]) => setS((x) => ({ ...x, [k]: v }));

  const refused = useMemo(() => {
    const st = initialState(s);
    return MOVES.map((m) => ({ m, r: refusal(st, s, m.id) })).filter((x) => x.r);
  }, [s]);

  const run = () => {
    const t = performance.now();
    const plans = rankPlans(s, { depth, width: 30, top: 5 });
    const count = enumeratePlans(s, Math.min(4, depth)).count;
    setRan({ plans, count, ms: Math.round(performance.now() - t) });
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-10">
        <header className="space-y-3">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-amber-300/80"><Layers className="h-3.5 w-3.5" /> The sequence planner</div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Your situation, every legal sequence, ranked</h1>
          <p className="text-slate-300 max-w-3xl leading-relaxed">
            The covenants that limit a single house bind <strong className="text-white">per property</strong>. An equity share on the primary closes nothing on rental seven. So the planner tracks every asset's own flags, refuses only what that asset's paperwork forbids, and searches the rest against your goal. The count of legal plans is computed and shown; the stage numbers come from the engine and the{" "}
            <Link href="/portal/thresholds" className="text-amber-300 hover:underline">threshold registry</Link> ({THRESHOLD_COUNT} thresholds, {VARIANT_COUNT} documented ways they move).
          </p>
        </header>

        <section className={`${CARD} p-5 space-y-4`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-bold text-white">The household</h2>
            <div className="flex gap-2">
              <button className="rounded-lg border border-white/15 px-3 py-1 text-xs text-white hover:bg-white/10" onClick={() => setS(THIRTY_HOUSE_OPERATOR)}>Thirty-house operator</button>
              <button className="rounded-lg border border-white/15 px-3 py-1 text-xs text-white hover:bg-white/10" onClick={() => setS(FIRST_TIME_HOUSEHOLD)}>First-time household</button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Num label="Rentals owned" value={s.rentals} onChange={(v) => set("rentals", v)} />
            <Num label="Avg rental value" value={s.avgRentalValue} step={5000} onChange={(v) => set("avgRentalValue", v)} />
            <Num label="Avg rental LTV" value={s.avgRentalLtv} step={0.05} onChange={(v) => set("avgRentalLtv", v)} hint="0–1" />
            <Num label="Avg monthly rent" value={s.avgRent} step={100} onChange={(v) => set("avgRent", v)} />
            <Num label="Primary value" value={s.primaryValue} step={10000} onChange={(v) => set("primaryValue", v)} />
            <Num label="Primary LTV" value={s.primaryLtv} step={0.05} onChange={(v) => set("primaryLtv", v)} />
            <Num label="Monthly surplus" value={s.monthlySurplus} step={500} onChange={(v) => set("monthlySurplus", v)} />
            <Num label="Cash reserve" value={s.reserve} step={5000} onChange={(v) => set("reserve", v)} />
            <Num label="Renovation uplift" value={s.renovationUplift} step={0.02} onChange={(v) => set("renovationUplift", v)} hint="ARV ÷ all-in. Below 1.34 a BRRRR shrinks." />
            <Num label="Appreciation" value={s.appreciation} step={0.005} onChange={(v) => set("appreciation", v)} />
            <Num label="Existing rate" value={s.existingRate} step={0.0025} onChange={(v) => set("existingRate", v)} />
            <Num label="Horizon (years)" value={s.horizonYears} onChange={(v) => set("horizonYears", v)} />
            <label className="block"><span className={LABEL}>Goal</span>
              <select className={INPUT} value={s.goal} onChange={(e) => set("goal", e.target.value as Goal)}>
                {(["payoff", "expand", "payoff-then-expand", "income", "exit"] as Goal[]).map((g) => <option key={g} value={g}>{g}</option>)}
              </select></label>
            <label className="block"><span className={LABEL}>Documentation</span>
              <select className={INPUT} value={s.documentation} onChange={(e) => set("documentation", e.target.value as Documentation)}>
                {(["full", "thin", "none"] as Documentation[]).map((g) => <option key={g} value={g}>{g}</option>)}
              </select></label>
            <label className="flex items-center gap-2 text-sm text-white pt-5"><input type="checkbox" checked={s.hasPrimary} onChange={(e) => set("hasPrimary", e.target.checked)} /> Owns a primary</label>
            <label className="flex items-center gap-2 text-sm text-white pt-5"><input type="checkbox" checked={s.insurable} onChange={(e) => set("insurable", e.target.checked)} /> Insurable</label>
            <label className="flex items-center gap-2 text-sm text-white pt-5"><input type="checkbox" checked={s.offMarketAccess} onChange={(e) => set("offMarketAccess", e.target.checked)} /> Can find seller-carry deals</label>
            <Num label="Max stages" value={depth} onChange={(v) => setDepth(Math.max(2, Math.min(24, v)))} hint="2–24" />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-bold text-black hover:bg-amber-300" onClick={run}><Search className="h-4 w-4" /> Search every legal sequence</button>
            {ran && <span className="text-xs text-slate-400 tabular-nums">{ran.count.toLocaleString()} legal plans at depth {Math.min(4, depth)} · searched to depth {depth} in {ran.ms}ms</span>}
          </div>
          {refused.length > 0 && (
            <div className="rounded-lg border border-rose-400/25 bg-rose-500/[0.06] p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-200"><Ban className="h-3.5 w-3.5" /> Not available to this household as a first move</div>
              <ul className="mt-1 space-y-1 text-xs text-slate-300">{refused.map(({ m, r }) => <li key={m.id}><span className="text-white">{m.label}</span> — {r!.reason}</li>)}</ul>
            </div>
          )}
        </section>

        {ran && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white">The best {ran.plans.length} against "{s.goal}"</h2>
            {ran.plans.map((p, i) => <PlanCard key={p.moves.join()} p={p} rank={i + 1} />)}
          </section>
        )}

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white">{ARCHETYPES.length} shapes the search keeps finding</h2>
          <p className="text-sm text-slate-400 max-w-3xl">Ordered by how many ordinary households are in each position, most common first. Every one is run through the planner live, so the verdict is arithmetic and the prose cannot drift from it.</p>
          {byLikelihood().map((a) => <ArchetypeCard key={a.id} a={a} />)}
        </section>

        <p className={`${CARD} p-4 flex gap-2 text-xs text-slate-400`}><Info className="h-4 w-4 shrink-0 mt-0.5" /><span>{PLANNER_DISCLOSURE}</span></p>
      </div>
    </AppShell>
  );
}
