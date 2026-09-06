// ============================================================
// JOURNEY PROGRESS BAR — shown at the top of any portal page that is a step
// in the client's latest librarian journey: "Step N of M · next: …". Opening
// a step marks it visited (server-side, so progress follows the client).
// ============================================================
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ArrowRight, BookOpen, Check, Compass, Volume2 } from "lucide-react";

export function JourneyProgressBar() {
  const [location] = useLocation();
  const latest = trpc.librarian.latestJourney.useQuery(undefined, { refetchOnWindowFocus: false, retry: false, staleTime: 60_000 });
  const utils = trpc.useUtils();
  const mark = trpc.librarian.markVisited.useMutation({ onSuccess: () => { void utils.librarian.latestJourney.invalidate(); } });

  const [open, setOpen] = useState(false);
  const speakMut = trpc.ultra.speak.useMutation();
  const journey = latest.data?.journey ?? null;
  const journeyId = latest.data?.id ?? null;
  const index = useMemo(() => (journey ? journey.steps.findIndex((s) => s.path === location) : -1), [journey, location]);
  const step = index >= 0 && journey ? journey.steps[index] : null;

  useEffect(() => {
    if (step && journeyId && !step.visitedAt && !mark.isPending) mark.mutate({ journeyId, stepId: step.id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.id, journeyId]);

  if (!journey || !step) return null;
  const readAloud = async (text: string) => {
    try {
      const r = await speakMut.mutateAsync({ text: text.slice(0, 2000) });
      if (r.ok) { await new Audio(`data:${r.mimeType};base64,${r.audioBase64}`).play(); return; }
    } catch { /* fall back */ }
    if (window.speechSynthesis) { window.speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.rate = 0.98; window.speechSynthesis.speak(u); }
  };
  const total = journey.steps.length;
  const visited = journey.steps.filter((s) => s.visitedAt).length;
  const prev = index > 0 ? journey.steps[index - 1] : null;
  const next = index < total - 1 ? journey.steps[index + 1] : null;

  return (
    <div className="mb-4 rounded-2xl border border-violet-400/25 bg-[linear-gradient(120deg,rgba(139,123,240,.16),rgba(56,189,248,.08))] px-4 py-3" role="navigation" aria-label="Your journey">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500 text-xs font-bold text-white"><Compass size={14} /></span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-violet-200/80">Your journey · step {index + 1} of {total} · {visited} visited</p>
            <p className="truncate text-sm text-white"><span className="font-semibold">{step.title}</span><span className="text-slate-400"> — {step.why}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {prev && <Link href={prev.path} className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/5"><ArrowLeft size={13} /> {prev.title}</Link>}
          {next ? (
            <Link href={next.path} className="inline-flex items-center gap-1 rounded-lg bg-violet-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-400">Next: {next.title} <ArrowRight size={13} /></Link>
          ) : (
            <Link href="/portal/ai-advisor" className="inline-flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-emerald-400"><Check size={13} /> Journey complete — back to the advisor</Link>
          )}
        </div>
      </div>
      {step.guide && (
        <div className="mt-2 flex flex-wrap items-start gap-2">
          <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="inline-flex items-center gap-1 rounded-lg border border-violet-300/30 px-2.5 py-1 text-xs text-violet-100 hover:bg-violet-500/20"><BookOpen size={12} /> {open ? "Hide" : "What to do on this page"}</button>
          <button type="button" onClick={() => void readAloud(`${step.title}. ${step.guide}`)} className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1 text-xs text-slate-200 hover:bg-white/5"><Volume2 size={12} /> Read aloud</button>
          {open && <p className="w-full rounded-lg border border-violet-400/15 bg-violet-500/10 px-3 py-2 text-sm text-violet-50"><span className="font-semibold text-violet-200">Librarian: </span>{step.guide}</p>}
        </div>
      )}
      <div className="mt-2 flex gap-1" aria-hidden="true">
        {journey.steps.map((s, i) => (
          <span key={s.id} className={`h-1 flex-1 rounded-full ${i === index ? "bg-cyan-300" : s.visitedAt ? "bg-violet-400" : "bg-white/10"}`} />
        ))}
      </div>
    </div>
  );
}
