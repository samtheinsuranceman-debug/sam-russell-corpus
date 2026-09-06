// ============================================================
// THE PLAN LEDGER — the client's own append-only record: every fact they
// gave, every journey built, every message, every decision, with time and
// source. Filter by kind, scrub back in time to see the assessment as it
// stood, and verify the chain has not been altered.
// ============================================================
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { BookOpenCheck, ShieldCheck, ShieldAlert, History, Filter, Clock, ArrowRight } from "lucide-react";
import { groupByDay, formatFactValue, LEDGER_KINDS, type LedgerKind } from "@shared/planLedger";
import { FACT_FINDER_SECTIONS } from "@shared/clientFactFinder";

const CARD = "rounded-2xl border border-violet-400/20 bg-white/[0.04]";
const KIND_STYLE: Record<LedgerKind, { label: string; color: string }> = {
  fact: { label: "Fact", color: "text-sky-300 border-sky-400/40" },
  assumption: { label: "Assumption", color: "text-amber-200 border-amber-300/40" },
  decision: { label: "Decision", color: "text-emerald-300 border-emerald-400/40" },
  message: { label: "Message", color: "text-fuchsia-300 border-fuchsia-400/40" },
  document: { label: "Document", color: "text-slate-200 border-slate-400/40" },
  outcome: { label: "Outcome", color: "text-lime-300 border-lime-400/40" },
  scenario: { label: "Scenario", color: "text-cyan-300 border-cyan-400/40" },
  journey: { label: "Journey", color: "text-violet-300 border-violet-400/40" },
  status: { label: "Status", color: "text-orange-300 border-orange-400/40" },
  note: { label: "Note", color: "text-slate-300 border-slate-500/40" },
  consent: { label: "Consent", color: "text-teal-300 border-teal-400/40" },
  mandate: { label: "Mandate", color: "text-indigo-300 border-indigo-400/40" },
  advice: { label: "Advice", color: "text-emerald-200 border-emerald-300/40" },
  control: { label: "Control", color: "text-rose-200 border-rose-300/40" },
  automation: { label: "Automation", color: "text-yellow-200 border-yellow-300/40" },
  rules: { label: "Rules", color: "text-pink-200 border-pink-300/40" },
};

export default function PlanLedger() {
  const [kinds, setKinds] = useState<LedgerKind[]>([]);
  const [asOfIdx, setAsOfIdx] = useState<number | null>(null);
  const timeline = trpc.ledger.timeline.useQuery({ kinds: kinds.length ? kinds : undefined, limit: 300 }, { refetchOnWindowFocus: false });
  const verify = trpc.ledger.verify.useQuery({}, { refetchOnWindowFocus: false });
  const events = useMemo(() => (timeline.data?.events ?? []).map((e) => ({ ...e, occurredAt: new Date(e.occurredAt) })), [timeline.data]);
  const facts = useMemo(() => events.filter((e) => e.kind === "fact" || e.kind === "status").sort((a, b) => a.seq - b.seq), [events]);
  const asOf = asOfIdx == null || !facts.length ? null : facts[Math.min(asOfIdx, facts.length - 1)]!.occurredAt;
  const replay = trpc.ledger.replay.useQuery({ asOf: asOf ? asOf.toISOString() : undefined }, { enabled: asOf != null, refetchOnWindowFocus: false });
  const days = useMemo(() => groupByDay(events), [events]);
  const toggle = (k: LedgerKind) => setKinds((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k]));

  return (
    <AppShell title="Plan Ledger">
      <div className="mx-auto max-w-5xl space-y-6 pb-16">
        <div className={`${CARD} p-6`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-300/80"><BookOpenCheck size={12} className="mr-1 inline" /> New Client Welcome List · your record</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">Plan Ledger</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-300">Every fact you gave, every journey built, every message and decision, in the order it happened. Nothing here is ever edited or deleted; each entry is sealed to the one before it.</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
            <span className="text-slate-400">{timeline.data?.total ?? 0} entries</span>
            {verify.data && (verify.data.ok
              ? <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 px-2 py-0.5 text-emerald-300"><ShieldCheck size={12} /> Chain verified · {verify.data.events} sealed entries</span>
              : <span className="inline-flex items-center gap-1 rounded-full border border-rose-400/40 px-2 py-0.5 text-rose-300"><ShieldAlert size={12} /> Chain broken at entry {verify.data.brokenAtSeq}</span>)}
          </div>
        </div>

        {/* Time travel */}
        {facts.length > 0 && (
          <div className={`${CARD} p-5`} aria-label="Assessment as of">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-200/80"><History size={12} className="mr-1 inline" /> Your assessment as it stood</p>
              <span className="text-xs text-slate-400">{asOf ? asOf.toLocaleString() : "now"}</span>
            </div>
            <input type="range" min={0} max={facts.length - 1} value={asOfIdx ?? facts.length - 1} onChange={(e) => setAsOfIdx(Number(e.target.value))} aria-label="Scrub through time"
              className="mt-3 w-full accent-violet-400" />
            <div className="mt-1 flex justify-between text-[11px] text-slate-500"><span>{facts[0]!.occurredAt.toLocaleDateString()}</span><span>{facts[facts.length - 1]!.occurredAt.toLocaleDateString()}</span></div>
            {asOf && replay.data && (
              <div className="mt-4">
                <p className="text-xs text-slate-400">{replay.data.applied} facts applied · assessment {replay.data.completeness.percent}% complete at that moment</p>
                <div className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                  {FACT_FINDER_SECTIONS.flatMap((s) => s.fields.filter((f) => replay.data!.data.sections[s.id]?.[f.key] !== undefined && replay.data!.data.sections[s.id]?.[f.key] !== null).slice(0, 4).map((f) => (
                    <div key={`${s.id}.${f.key}`} className="flex items-center justify-between border-b border-white/5 py-1"><span className="text-slate-400">{f.label}</span><span className="font-medium text-white">{formatFactValue(replay.data!.data.sections[s.id]![f.key])}</span></div>
                  )))}
                </div>
                {asOfIdx != null && asOfIdx < facts.length - 1 && <button type="button" onClick={() => setAsOfIdx(null)} className="mt-3 text-xs text-violet-300 hover:underline">Back to now</button>}
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2" aria-label="Filter by kind">
          <Filter size={14} className="text-slate-500" />
          {LEDGER_KINDS.map((k) => (
            <button key={k} type="button" onClick={() => toggle(k)} aria-pressed={kinds.includes(k)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${kinds.includes(k) ? `${KIND_STYLE[k].color} bg-white/10` : "border-white/10 text-slate-400 hover:border-white/30"}`}>{KIND_STYLE[k].label}</button>
          ))}
          {kinds.length > 0 && <button type="button" onClick={() => setKinds([])} className="text-[11px] text-slate-400 hover:text-white">clear</button>}
        </div>

        {/* Timeline */}
        {timeline.isLoading ? <p className="text-sm text-slate-400">Loading your record…</p> : events.length === 0 ? (
          <div className={`${CARD} p-6`}>
            <p className="text-sm text-slate-300">Nothing recorded yet. The ledger starts writing the moment you answer the first question of your Financial Assessment.</p>
            <Link href="/portal/financial-assessment" className="mt-3 inline-flex items-center gap-1 rounded-lg bg-violet-500 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-400">Open the assessment <ArrowRight size={14} /></Link>
          </div>
        ) : (
          <div className="space-y-6">
            {days.map(({ day, events: evs }) => (
              <section key={day} aria-label={day}>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500"><Clock size={11} className="mr-1 inline" /> {new Date(`${day}T12:00:00Z`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
                <ol className="space-y-2">
                  {evs.map((e) => (
                    <li key={e.id} className={`${CARD} flex items-start gap-3 px-4 py-3`}>
                      <span className={`mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${KIND_STYLE[e.kind].color}`}>{KIND_STYLE[e.kind].label}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white">{e.summary}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">{e.occurredAt.toLocaleTimeString()} · {e.source}{e.actorName ? ` · ${e.actorName}` : ""} · #{e.seq}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
