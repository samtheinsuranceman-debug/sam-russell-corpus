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
import { toast } from "sonner";
import { FACT_FINDER_SECTIONS } from "@shared/clientFactFinder";
import { ArrowRight, Check, Compass, Lightbulb, ListChecks, SlidersHorizontal, Wind } from "lucide-react";

const CARD = "rounded-2xl border border-violet-400/20 bg-white/[0.04]";
const DONE_KEY = "rcs_journey_done";
const BTN = "rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-40";
const PRIMARY = "rounded-lg bg-violet-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-400 disabled:opacity-40";
const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

/**
 * The questions you haven't asked. Consent first at every step, nothing shown
 * before yes, and a place to add to the profile before the answers.
 */
function UnaskedQuestions() {
  const status = trpc.unasked.status.useQuery(undefined, { refetchOnWindowFocus: false });
  const utils = trpc.useUtils();
  const [count, setCount] = useState<"3-5" | "5-7" | "5-10">("3-5");
  const [stage, setStage] = useState<"offer" | "shown" | "answered" | "declined">("offer");
  const [questions, setQuestions] = useState<Array<{ id: string; question: string; why: string; scale: number; scaleNote: string; horizonYears: number; path: string; needs?: string[] }>>([]);
  const [spoken, setSpoken] = useState<string>("");
  const [more, setMore] = useState("");
  const [answers, setAnswers] = useState<Array<{ id: string; answer: string; via: string }>>([]);
  const propose = trpc.unasked.propose.useMutation({ onSuccess: (r) => { setSpoken(r.spoken); if (r.shown) { setQuestions(r.questions); setStage("shown"); } else setStage("declined"); utils.unasked.status.invalidate(); }, onError: (e) => toast.error(e.message) });
  const disclose = trpc.unasked.disclose.useMutation({ onSuccess: (r) => { toast.success(r.spoken); setMore(""); utils.factFinder.get.invalidate(); utils.unasked.status.invalidate(); }, onError: (e) => toast.error(e.message) });
  const answer = trpc.unasked.answer.useMutation({ onSuccess: (r) => { setSpoken(r.spoken); if (r.answered) { setAnswers(r.answers); setStage("answered"); } else setStage("declined"); }, onError: (e) => toast.error(e.message) });
  const s = status.data;
  if (!s || !s.assessmentPresent || (!s.offer && stage === "offer")) return null;
  return (
    <section className="rounded-2xl border border-amber-300/30 bg-amber-300/5 p-5" aria-label="The questions you haven't asked">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200"><Lightbulb size={12} className="mr-1 inline" /> The questions you haven't asked · one voice for the whole team</p>
      {stage === "offer" && (
        <div className="mt-2 space-y-3 text-sm">
          <p className="text-amber-50">{s.script}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
            <span>How many?</span>
            {s.counts.map((c) => <button key={c.id} type="button" onClick={() => setCount(c.id as "3-5")} className={`rounded-full border px-3 py-1 ${count === c.id ? "border-amber-300 bg-amber-300/20 text-amber-100" : "border-white/15"}`}>{c.label}</button>)}
            <button type="button" className={PRIMARY} disabled={propose.isPending} onClick={() => propose.mutate({ count, permission: true })}>Yes, show me</button>
            <button type="button" className={BTN} disabled={propose.isPending} onClick={() => propose.mutate({ count, permission: false })}>Not now</button>
          </div>
          <p className="text-[11px] text-slate-500">{s.available} questions are waiting; the reason it is offered now: {s.reason}. Your answer is recorded on your Plan Ledger either way.</p>
        </div>
      )}
      {stage === "declined" && <p className="mt-2 text-sm text-slate-300">{spoken}</p>}
      {(stage === "shown" || stage === "answered") && (
        <div className="mt-2 space-y-3 text-sm">
          <ol className="space-y-2">{questions.map((q, i) => (
            <li key={q.id} className="rounded-xl border border-white/10 bg-[#0b0f1a] p-3">
              <p className="text-white"><span className="text-amber-300">{i + 1}.</span> {q.question}</p>
              <p className="mt-1 text-xs text-slate-400">{q.why}</p>
              <p className="mt-1 text-[11px] text-slate-500">{q.scale > 0 ? `About ${usd(q.scale)} — ${q.scaleNote}.` : q.scaleNote} You would otherwise meet this in about {q.horizonYears} years. <Link href={q.path} className="text-violet-200 underline decoration-dotted">The page that works it through</Link>{q.needs?.length ? ` · sharper with: ${q.needs.join(", ")}` : ""}</p>
              {stage === "answered" && answers.find((a) => a.id === q.id) && <p className="mt-2 rounded-lg border border-amber-300/20 bg-amber-300/10 p-2 text-xs text-amber-50"><span className="font-semibold text-amber-200">Librarian ({answers.find((a) => a.id === q.id)!.via}):</span> {answers.find((a) => a.id === q.id)!.answer}</p>}
            </li>
          ))}</ol>
          {stage === "shown" && (
            <div className="space-y-2">
              <p className="text-amber-50">May I answer them from everything I know about you? And is there anything else you want me to know first? Anything you add goes into your profile and improves every answer on this site.</p>
              <textarea value={more} onChange={(e) => setMore(e.target.value)} className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white" rows={3} placeholder="Anything else — a plan to sell, a health matter, a family change, an account we do not know about…" />
              <div className="flex flex-wrap gap-2">
                <button type="button" className={BTN} disabled={disclose.isPending || !more.trim()} onClick={() => disclose.mutate({ text: more })}>Add this to my profile</button>
                <button type="button" className={PRIMARY} disabled={answer.isPending} onClick={() => answer.mutate({ questionIds: questions.map((q) => q.id), permission: true })}>{answer.isPending ? "Answering…" : "Yes, answer them"}</button>
                <button type="button" className={BTN} disabled={answer.isPending} onClick={() => answer.mutate({ questionIds: questions.map((q) => q.id), permission: false })}>Not yet</button>
              </div>
            </div>
          )}
          {stage === "answered" && <p className="text-[11px] text-slate-500">Every answer is sealed on your Plan Ledger as signed advice with the facts it used. Directional education, not advice; your Russell Capital Systems advisor confirms every specific.</p>}
        </div>
      )}
    </section>
  );
}

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

        <UnaskedQuestions />

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
