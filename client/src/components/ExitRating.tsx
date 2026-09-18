// ============================================================
// EXIT RATING — as the mouse heads for the close button, one question:
// with what you learned today, how likely are you to reach your goals, 1 to
// 10? Asked once per session, only after the visitor has been here long
// enough to have learned something, and the answer is kept with the page it
// was given on. This is the platform's satisfaction score.
// ============================================================
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { EXIT_QUESTION } from "@shared/careerEngine";

const KEY = "rcs_exit_rating_asked";
const MIN_SECONDS_ON_SITE = 90;

export default function ExitRating() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [before, setBefore] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);
  const rate = trpc.career.exitRating.useMutation();

  useEffect(() => {
    const started = Date.now();
    let asked = false;
    try { asked = sessionStorage.getItem(KEY) === "1"; } catch { /* no storage: ask at most once per page load */ }
    const onLeave = (e: MouseEvent) => {
      if (asked || e.clientY > 0 || Date.now() - started < MIN_SECONDS_ON_SITE * 1000) return;
      asked = true;
      try { sessionStorage.setItem(KEY, "1"); } catch { /* ignore */ }
      setOpen(true);
    };
    document.addEventListener("mouseleave", onLeave);
    return () => document.removeEventListener("mouseleave", onLeave);
  }, []);

  if (!open) return null;
  const send = async () => {
    if (score == null) return;
    try { await rate.mutateAsync({ path: location, score, before: before ?? undefined, note: note.trim() || undefined }); } catch { /* the answer is best-effort */ }
    setDone(true);
    setTimeout(() => setOpen(false), 1800);
  };
  const Scale = ({ value, onPick }: { value: number | null; onPick: (n: number) => void }) => (
    <div className="mt-2 flex flex-wrap gap-1">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button key={n} type="button" onClick={() => onPick(n)} className={`h-9 w-9 rounded-lg border text-sm font-semibold ${value === n ? "border-emerald-300 bg-emerald-400 text-black" : "border-white/15 text-white hover:bg-white/10"}`}>{n}</button>
      ))}
    </div>
  );
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label={EXIT_QUESTION}>
      <div className="w-full max-w-md rounded-2xl border border-emerald-400/30 bg-[#0b1220] p-6 text-white shadow-2xl">
        {done ? (
          <p className="text-sm text-emerald-200">Thank you. That number is how we measure whether a visit was worth your time.</p>
        ) : (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/80">One question before you go</p>
            <h2 className="mt-1 text-lg font-semibold">{EXIT_QUESTION}</h2>
            <Scale value={score} onPick={setScore} />
            <p className="mt-4 text-xs text-white/60">And on the path you were on before today, 1 to 10?</p>
            <Scale value={before} onPick={setBefore} />
            <textarea className="mt-3 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm" rows={2} placeholder="Anything that would have made it higher (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="mt-3 flex items-center justify-between">
              <button type="button" className="text-xs text-white/50 hover:text-white" onClick={() => setOpen(false)}>Not now</button>
              <button type="button" disabled={score == null || rate.isPending} onClick={send} className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-black hover:bg-emerald-300 disabled:opacity-50">Send</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
