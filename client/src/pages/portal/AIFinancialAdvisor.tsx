// ============================================================
// AI FINANCIAL ADVISOR — the Financial Librarian page: the tape recorder,
// what it knows (assessment completeness), and the customized journey it
// composes: 3–5 core questions, the emergent question, 10–15 pages in order.
// ============================================================
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { AppShell } from "@/components/AppShell";
import TapeRecorderAdvisor, { type JourneyView } from "@/components/TapeRecorderAdvisor";
import { trpc } from "@/lib/trpc";
import { FACT_FINDER_SECTIONS } from "@shared/clientFactFinder";
import { ArrowRight, Check, Compass, Lightbulb, ListChecks, SlidersHorizontal, Wind } from "lucide-react";

const CARD = "rounded-2xl border border-violet-400/20 bg-white/[0.04]";
const DONE_KEY = "rcs_journey_done";

export default function AIFinancialAdvisor() {
  const ff = trpc.factFinder.get.useQuery(undefined, { refetchOnWindowFocus: false });
  const latest = trpc.librarian.latestJourney.useQuery(undefined, { refetchOnWindowFocus: false });
  const [journey, setJourney] = useState<JourneyView | null>(null);
  const [done, setDone] = useState<Record<string, boolean>>(() => { try { return JSON.parse(localStorage.getItem(DONE_KEY) || "{}"); } catch { return {}; } });

  useEffect(() => { if (!journey && latest.data?.journey) setJourney(latest.data.journey); }, [latest.data, journey]);
  useEffect(() => { try { localStorage.setItem(DONE_KEY, JSON.stringify(done)); } catch { /* ignore */ } }, [done]);

  const completeness = ff.data?.completeness;
  const completedSteps = journey ? journey.steps.filter((s) => done[s.id]).length : 0;

  return (
    <AppShell title="AI Financial Advisor">
      <div className="mx-auto max-w-6xl space-y-6 pb-16">
        <div className={`${CARD} p-6`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-300/80">New Client Welcome List · Step 2</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">Ask the advisor anything about your plan. Press record, speak, and listen.</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-400">Nine AI advisors answer as one voice — the Financial Librarian. It knows your complete Financial Assessment and only advises once it is finished. Ask as many questions as you like; then press <span className="font-semibold text-violet-200">JOURNEY</span> and it boils everything down to three to five questions, names the one you haven't asked yet, and lays out the pages on this site — calculators included — that answer them in order.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <TapeRecorderAdvisor onJourney={setJourney} />

          <aside className={`${CARD} h-fit p-5`} aria-label="What the advisor knows">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-300/80">What it knows</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-semibold text-white">{completeness?.percent ?? 0}%</span>
              <span className="text-xs text-slate-400">of the assessment</span>
            </div>
            <ul className="mt-3 space-y-1.5">
              {FACT_FINDER_SECTIONS.map((s) => {
                const pct = completeness?.sectionPercent[s.id] ?? 0;
                return (
                  <li key={s.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">{s.title}</span>
                    {pct === 100 ? <Check size={14} className="text-emerald-300" /> : <span className="text-xs text-slate-500">{pct}%</span>}
                  </li>
                );
              })}
            </ul>
            <Link href="/portal/financial-assessment" className="mt-4 inline-flex items-center gap-1 text-sm text-violet-200 hover:text-white">{completeness?.complete ? "Review my assessment" : "Complete my assessment"} <ArrowRight size={14} /></Link>
          </aside>
        </div>

        {journey && (
          <section className={`${CARD} p-6`} aria-label="Your customized journey">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-300/80"><Compass size={12} className="mr-1 inline" /> Your customized journey</p>
                <h2 className="mt-1 text-xl font-semibold text-white">{journey.steps.length} pages, in the order that builds</h2>
              </div>
              <div className="text-right text-xs text-slate-400">
                <div className="text-2xl font-semibold text-white">{completedSteps}/{journey.steps.length}</div>
                visited
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-[#0b0f1a] p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-200/80"><ListChecks size={12} className="mr-1 inline" /> It comes down to {journey.coreQuestions.length} questions</p>
                <ol className="mt-2 space-y-2">
                  {journey.coreQuestions.map((q, i) => <li key={i} className="flex gap-2 text-sm text-white"><span className="text-violet-300">{i + 1}.</span>{q}</li>)}
                </ol>
              </div>
              <div className="rounded-xl border border-amber-300/30 bg-amber-300/10 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200"><Lightbulb size={12} className="mr-1 inline" /> The question you haven't asked</p>
                <p className="mt-2 text-sm leading-relaxed text-amber-50">{journey.emergentQuestion}</p>
              </div>
            </div>

            {journey.controls && (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-200"><SlidersHorizontal size={12} className="mr-1 inline" /> Variables you control</p>
                  <ul className="mt-2 space-y-1">{journey.controls.youControl.map((c, i) => <li key={i} className="flex gap-2 text-sm text-white"><Check size={14} className="mt-0.5 shrink-0 text-emerald-300" />{c}</li>)}</ul>
                </div>
                <div className="rounded-xl border border-white/10 bg-[#0b0f1a] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400"><Wind size={12} className="mr-1 inline" /> What the plan is built to survive</p>
                  <ul className="mt-2 space-y-1">{journey.controls.youDont.map((c, i) => <li key={i} className="text-sm text-slate-300">• {c}</li>)}</ul>
                </div>
              </div>
            )}

            <ol className="mt-6 space-y-2">
              {journey.steps.map((s, i) => (
                <li key={s.id} className={`flex items-start gap-3 rounded-xl border p-3 transition ${done[s.id] ? "border-emerald-400/30 bg-emerald-400/5" : "border-white/10 bg-white/[0.02] hover:border-violet-300/40"}`}>
                  <button type="button" aria-label={done[s.id] ? `Mark ${s.title} not visited` : `Mark ${s.title} visited`} onClick={() => setDone((d) => ({ ...d, [s.id]: !d[s.id] }))}
                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${done[s.id] ? "border-emerald-400 bg-emerald-400 text-black" : "border-violet-300/50 text-violet-200"}`}>
                    {done[s.id] ? <Check size={14} /> : i + 1}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={s.path} className="font-semibold text-white hover:text-violet-200">{s.title}</Link>
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-slate-400">{s.kind}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-slate-400">{s.why}</p>
                    {s.guide && <p className="mt-1.5 text-xs text-violet-100/80"><span className="font-semibold text-violet-200">Librarian:</span> {s.guide}</p>}
                  </div>
                  <Link href={s.path} onClick={() => setDone((d) => ({ ...d, [s.id]: true }))} className="shrink-0 rounded-lg bg-violet-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-violet-400">{i === 0 ? "Start" : "Open"}</Link>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-xs text-slate-500">Generated by {journey.generatedBy}. Every step is a page on this site; the sequence is built from your questions and your assessment. Find it again any time under <Link href="/portal/my-journey" className="text-violet-200 underline decoration-dotted">My Secret Journey</Link>.</p>
          </section>
        )}
      </div>
    </AppShell>
  );
}
