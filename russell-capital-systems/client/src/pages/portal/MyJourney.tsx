// ============================================================
// MY SECRET JOURNEY — the client's latest librarian journey as a page of its
// own: the 3–5 questions it answers, the one they hadn't asked, what they
// control, and the ordered pages with progress and a Resume button.
// ============================================================
import { Link } from "wouter";
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Check, Compass, Lightbulb, ListChecks, SlidersHorizontal, Wind } from "lucide-react";

const CARD = "rounded-2xl border border-violet-400/20 bg-white/[0.04]";

export default function MyJourney() {
  const latest = trpc.librarian.latestJourney.useQuery(undefined, { refetchOnWindowFocus: false });
  const j = latest.data?.journey ?? null;
  const visited = j ? j.steps.filter((s) => s.visitedAt).length : 0;
  const next = j ? j.steps.find((s) => !s.visitedAt) ?? null : null;

  return (
    <AppShell title="My Secret Journey">
      <div className="mx-auto max-w-5xl space-y-6 pb-16">
        <div className={`${CARD} p-6`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-300/80"><Compass size={12} className="mr-1 inline" /> New Client Welcome List · your journey</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">My Secret Journey</h1>
          {!j && !latest.isLoading && (
            <div className="mt-4 rounded-xl border border-violet-400/25 bg-violet-400/10 px-4 py-3">
              <p className="text-sm text-violet-100">No journey yet. Ask the AI Financial Advisor your questions — as many as you like — then press <span className="font-semibold">JOURNEY</span> and it will build yours.</p>
              <Link href="/portal/ai-advisor" className="mt-3 inline-flex items-center gap-1 rounded-lg bg-violet-500 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-400">Go to the advisor <ArrowRight size={14} /></Link>
            </div>
          )}
          {j && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-400">{j.steps.length} pages · {visited} visited · built {latest.data?.createdAt ? new Date(latest.data.createdAt).toLocaleDateString() : ""}</p>
              {next ? (
                <Link href={next.path} className="inline-flex items-center gap-1 rounded-lg bg-violet-500 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-400">{visited === 0 ? "Start" : "Resume"}: {next.title} <ArrowRight size={14} /></Link>
              ) : (
                <Link href="/portal/ai-advisor" className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-400"><Check size={14} /> Journey complete — ask what's next</Link>
              )}
            </div>
          )}
        </div>

        {j && (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              <div className={`${CARD} p-5`}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-200/80"><ListChecks size={12} className="mr-1 inline" /> It comes down to {j.coreQuestions.length} questions</p>
                <ol className="mt-2 space-y-2">{j.coreQuestions.map((q, i) => <li key={i} className="flex gap-2 text-sm text-white"><span className="text-violet-300">{i + 1}.</span>{q}</li>)}</ol>
              </div>
              <div className="rounded-2xl border border-amber-300/30 bg-amber-300/10 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200"><Lightbulb size={12} className="mr-1 inline" /> The question you haven't asked</p>
                <p className="mt-2 text-sm leading-relaxed text-amber-50">{j.emergentQuestion}</p>
              </div>
            </div>

            {j.controls && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className={`${CARD} p-5`}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-200"><SlidersHorizontal size={12} className="mr-1 inline" /> Variables you control</p>
                  <ul className="mt-2 space-y-1.5">{j.controls.youControl.map((c, i) => <li key={i} className="flex gap-2 text-sm text-white"><Check size={14} className="mt-0.5 shrink-0 text-emerald-300" />{c}</li>)}</ul>
                </div>
                <div className={`${CARD} p-5`}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400"><Wind size={12} className="mr-1 inline" /> What the plan is built to survive</p>
                  <ul className="mt-2 space-y-1.5">{j.controls.youDont.map((c, i) => <li key={i} className="flex gap-2 text-sm text-slate-300"><span className="mt-0.5 text-slate-500">•</span>{c}</li>)}</ul>
                  <p className="mt-3 text-xs text-slate-500">The journey controls the volatility of these by fixing the variables above — reserves, floors, sequencing, protection — not by predicting them.</p>
                </div>
              </div>
            )}

            <ol className="space-y-2">
              {j.steps.map((s, i) => (
                <li key={s.id} className={`rounded-xl border p-4 ${s.visitedAt ? "border-emerald-400/30 bg-emerald-400/5" : "border-white/10 bg-white/[0.02]"}`}>
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${s.visitedAt ? "border-emerald-400 bg-emerald-400 text-black" : "border-violet-300/50 text-violet-200"}`}>{s.visitedAt ? <Check size={14} /> : i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={s.path} className="font-semibold text-white hover:text-violet-200">{s.title}</Link>
                        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-400">{s.kind}</span>
                        {s.visitedAt && <span className="text-[10px] text-emerald-300">visited {new Date(s.visitedAt).toLocaleDateString()}</span>}
                      </div>
                      <p className="mt-0.5 text-sm text-slate-400">{s.why}</p>
                      {s.guide && <p className="mt-2 rounded-lg border border-violet-400/15 bg-violet-500/10 px-3 py-2 text-sm text-violet-50"><span className="font-semibold text-violet-200">Librarian: </span>{s.guide}</p>}
                    </div>
                    <Link href={s.path} className="shrink-0 rounded-lg bg-violet-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-violet-400">Open</Link>
                  </div>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </AppShell>
  );
}
