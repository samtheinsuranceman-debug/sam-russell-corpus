// ============================================================
// THE TAPE RECORDER — the AI advisory team as one Financial Librarian.
// Press REC and speak (or TYPE), the deck thinks, then answers aloud.
// It only advises once the Financial Assessment is complete; before that it
// says so and hands the client the assessment. "Build my journey" distils
// everything asked into 3–5 core questions, the emergent question, and a
// 10–15 page path through the site.
// ============================================================
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { BookOpen, Circle, Keyboard, Play, Square } from "lucide-react";

type Mode = "idle" | "listening" | "thinking" | "speaking";
type Line = { role: "user" | "librarian"; text: string; at: number; contributors?: string[] };
export type JourneyView = { coreQuestions: string[]; emergentQuestion: string; steps: Array<{ id: string; path: string; title: string; why: string; kind: string }>; generatedBy: string };

type SpeechRecognitionLike = {
  lang: string; interimResults: boolean; continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null; onerror: (() => void) | null;
  start: () => void; stop: () => void; abort: () => void;
};
function getRecognizer(): SpeechRecognitionLike | null {
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;
  const r = new Ctor();
  r.lang = "en-US"; r.interimResults = false; r.continuous = false;
  return r;
}

const QUESTIONS_KEY = "rcs_librarian_questions";

export default function TapeRecorderAdvisor({ onJourney }: { onJourney?: (j: JourneyView) => void }) {
  const status = trpc.librarian.status.useQuery(undefined, { refetchOnWindowFocus: false });
  const ask = trpc.librarian.ask.useMutation();
  const journey = trpc.librarian.journey.useMutation();
  const speakMut = trpc.ultra.speak.useMutation();

  const [mode, setMode] = useState<Mode>("idle");
  const [lines, setLines] = useState<Line[]>([]);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const [asked, setAsked] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem(QUESTIONS_KEY) || "[]"); } catch { return []; } });
  const recognizerRef = useRef<SpeechRecognitionLike | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const tapeRef = useRef<HTMLDivElement | null>(null);
  const canListen = useMemo(() => typeof window !== "undefined" && Boolean((window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition), []);

  useEffect(() => { if (!canListen) setTyping(true); }, [canListen]);
  useEffect(() => { tapeRef.current?.scrollTo({ top: tapeRef.current.scrollHeight, behavior: "smooth" }); }, [lines]);
  useEffect(() => { try { localStorage.setItem(QUESTIONS_KEY, JSON.stringify(asked.slice(-40))); } catch { /* ignore */ } }, [asked]);

  const stopSpeaking = useCallback(() => {
    audioRef.current?.pause(); audioRef.current = null;
    try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
  }, []);

  const speak = useCallback(async (text: string) => {
    stopSpeaking();
    setMode("speaking");
    const done = () => setMode("idle");
    try {
      const r = await speakMut.mutateAsync({ text: text.slice(0, 2000) });
      if (r.ok) {
        const a = new Audio(`data:${r.mimeType};base64,${r.audioBase64}`);
        audioRef.current = a;
        a.onended = done; a.onerror = done;
        await a.play();
        return;
      }
    } catch { /* fall through to the browser voice */ }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.98; u.pitch = 1;
      const calm = window.speechSynthesis.getVoices().find((v) => /en[-_]US/i.test(v.lang) && /female|samantha|aria|jenny|zira/i.test(v.name));
      if (calm) u.voice = calm;
      u.onend = done; u.onerror = done;
      window.speechSynthesis.speak(u);
    } else done();
  }, [speakMut, stopSpeaking]);

  const submit = useCallback(async (question: string) => {
    const q = question.trim();
    if (!q) return;
    setDraft("");
    setLines((l) => [...l, { role: "user", text: q, at: Date.now() }]);
    setAsked((a) => [...a, q]);
    setMode("thinking");
    try {
      const history = lines.slice(-8).map((l) => ({ role: l.role, text: l.text }));
      const r = await ask.mutateAsync({ question: q, history });
      const text = r.gated ? r.spoken : r.answer;
      setLines((l) => [...l, { role: "librarian", text, at: Date.now(), contributors: r.contributors }]);
      if (r.gated) void status.refetch();
      await speak(text);
    } catch (e) {
      const text = "I couldn't reach the advisory team just now. Please try again in a moment.";
      setLines((l) => [...l, { role: "librarian", text, at: Date.now() }]);
      setMode("idle");
    }
  }, [ask, lines, speak, status]);

  const startListening = useCallback(() => {
    if (mode === "listening") { recognizerRef.current?.stop(); return; }
    const r = getRecognizer();
    if (!r) { setTyping(true); return; }
    stopSpeaking();
    recognizerRef.current = r;
    r.onresult = (e) => { const t = e.results[0]?.[0]?.transcript ?? ""; if (t) void submit(t); };
    r.onend = () => { setMode((m) => (m === "listening" ? "idle" : m)); };
    r.onerror = () => setMode("idle");
    setMode("listening");
    try { r.start(); } catch { setMode("idle"); }
  }, [mode, stopSpeaking, submit]);

  const stopAll = useCallback(() => {
    recognizerRef.current?.abort();
    stopSpeaking();
    setMode("idle");
  }, [stopSpeaking]);

  const replay = useCallback(() => {
    const last = [...lines].reverse().find((l) => l.role === "librarian");
    if (last) void speak(last.text);
  }, [lines, speak]);

  const buildJourney = useCallback(async () => {
    const qs = asked.slice(-40);
    if (qs.length === 0) { void submit("Where should I start?"); return; }
    setMode("thinking");
    try {
      const r = await journey.mutateAsync({ questions: qs });
      const text = r.gated ? r.spoken : r.spoken;
      setLines((l) => [...l, { role: "librarian", text, at: Date.now() }]);
      if (!r.gated && r.journey) onJourney?.(r.journey);
      await speak(text);
    } catch {
      setLines((l) => [...l, { role: "librarian", text: "I couldn't build the journey just now. Please try again.", at: Date.now() }]);
      setMode("idle");
    }
  }, [asked, journey, onJourney, speak, submit]);

  const gated = status.data ? !status.data.complete : false;
  const spinning = mode === "listening" || mode === "speaking";
  const contributorLine = status.data
    ? status.data.contributorCount > 0 ? `${status.data.contributorCount} advisors online · one voice` : "advisory team offline · one voice"
    : "one voice";
  const modeLabel = { idle: gated ? "ASSESSMENT REQUIRED" : "READY", listening: "LISTENING", thinking: "THINKING", speaking: "SPEAKING" }[mode];

  return (
    <div className="mx-auto w-full max-w-3xl">
      <style>{`
        @keyframes rcs-reel { to { transform: rotate(360deg); } }
        @keyframes rcs-vu { 0%,100% { transform: scaleY(.25); } 50% { transform: scaleY(1); } }
        .rcs-reel { animation: rcs-reel 2.4s linear infinite; }
        .rcs-reel-paused { animation-play-state: paused; }
        .rcs-vu-bar { transform-origin: bottom; animation: rcs-vu .9s ease-in-out infinite; }
      `}</style>

      {/* ── the deck ── */}
      <div className="relative overflow-hidden rounded-[28px] border border-violet-400/25 bg-[linear-gradient(160deg,#1a1c26,#0c0e15_60%,#090b11)] p-5 shadow-[0_40px_120px_rgba(0,0,0,.6),inset_0_1px_0_rgba(255,255,255,.06)] sm:p-7">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/70 to-transparent" />
        {/* label strip */}
        <div className="flex items-center justify-between gap-3">
          <div className="rounded-md border border-white/10 bg-[#f5f0e6] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.28em] text-[#2a2440] shadow-inner">RCS · AI Financial Advisor</div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-violet-200/70">
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${gated ? "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,.9)]" : mode === "listening" ? "bg-red-400 shadow-[0_0_12px_rgba(248,113,113,.9)] animate-pulse" : mode === "speaking" ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.9)]" : mode === "thinking" ? "bg-amber-300 animate-pulse" : "bg-emerald-500/70"}`} />
            {modeLabel}
          </div>
        </div>
        <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-slate-400">The Financial Librarian · {contributorLine}</p>

        {/* cassette window */}
        <div className="mt-5 rounded-2xl border border-white/10 bg-[#05070b] p-4 shadow-[inset_0_10px_30px_rgba(0,0,0,.8)]">
          <div className="flex items-center justify-between gap-4">
            <Reel spinning={spinning} />
            <div className="flex-1">
              <div className="mx-auto h-1.5 w-full max-w-[220px] rounded-full bg-gradient-to-r from-[#3a2f1a] via-[#7a5c2c] to-[#3a2f1a]" />
              <div className="mt-3 flex h-8 items-end justify-center gap-1" aria-hidden="true">
                {Array.from({ length: 14 }).map((_, i) => (
                  <span key={i} className={`w-1.5 rounded-sm ${i < 9 ? "bg-emerald-400" : i < 12 ? "bg-amber-300" : "bg-red-400"} ${mode === "speaking" ? "rcs-vu-bar" : "scale-y-[.15]"}`} style={{ height: "100%", animationDelay: `${(i % 7) * 80}ms` }} />
                ))}
              </div>
              <div className="mt-2 text-center font-mono text-xs tracking-[0.3em] text-slate-400">{String(lines.filter((l) => l.role === "librarian").length).padStart(4, "0")}</div>
            </div>
            <Reel spinning={spinning} />
          </div>
        </div>

        {/* transport */}
        <div className="mt-5 grid grid-cols-5 gap-2">
          <TransportButton label={mode === "listening" ? "Stop recording" : "Record your question"} onClick={startListening} disabled={!canListen || mode === "thinking"} active={mode === "listening"} tone="red">
            <Circle size={14} fill="currentColor" /> REC
          </TransportButton>
          <TransportButton label="Replay the last answer" onClick={replay} disabled={mode === "thinking" || !lines.some((l) => l.role === "librarian")}>
            <Play size={14} fill="currentColor" /> PLAY
          </TransportButton>
          <TransportButton label="Stop" onClick={stopAll} disabled={mode === "idle"}>
            <Square size={14} fill="currentColor" /> STOP
          </TransportButton>
          <TransportButton label="Type a question" onClick={() => setTyping((t) => !t)} active={typing}>
            <Keyboard size={14} /> TYPE
          </TransportButton>
          <TransportButton label="Build my journey" onClick={buildJourney} disabled={mode === "thinking" || gated} tone="violet">
            <BookOpen size={14} /> JOURNEY
          </TransportButton>
        </div>
        {!canListen && <p className="mt-2 text-center text-xs text-slate-500">Voice input isn't available in this browser — type your question instead.</p>}

        {typing && (
          <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); void submit(draft); }}>
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={gated ? "Ask anything — the librarian will point you to the assessment first" : "Ask the librarian anything about your plan…"}
              className="flex-1 rounded-xl border border-violet-400/25 bg-[#0b0f1a] px-4 py-3 text-white placeholder:text-slate-500 focus:border-violet-300 focus:outline-none" aria-label="Your question" />
            <button type="submit" disabled={mode === "thinking" || !draft.trim()} className="rounded-xl bg-violet-500 px-5 py-3 font-semibold text-white hover:bg-violet-400 disabled:opacity-50">Ask</button>
          </form>
        )}

        {gated && status.data && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3">
            <p className="text-sm text-red-100">The librarian advises only on a complete picture. Your Financial Assessment is {status.data.percent}% complete{status.data.missingSections.length ? ` — still open: ${status.data.missingSections.join(", ")}` : ""}.</p>
            <Link href="/portal/financial-assessment" className="rounded-lg bg-red-400 px-4 py-2 text-sm font-semibold text-black hover:bg-red-300">Complete my Financial Assessment ({status.data.percent}%)</Link>
          </div>
        )}
      </div>

      {/* ── the tape (transcript) ── */}
      <div ref={tapeRef} className="mt-4 max-h-[22rem] space-y-3 overflow-y-auto rounded-2xl border border-violet-400/20 bg-white/[0.03] p-4" aria-live="polite" aria-label="Conversation">
        {lines.length === 0 && <p className="text-sm text-slate-500">Press REC and ask anything — how to pay less tax, whether to pay off the mortgage, what happens if markets fall, how to protect your family. Ask as many questions as you like; when you're ready, press JOURNEY.</p>}
        {lines.map((l, i) => (
          <div key={i} className={`flex ${l.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${l.role === "user" ? "bg-violet-500/25 text-white" : "bg-[#0b0f1a] text-slate-100 border border-white/10"}`}>
              <div className="mb-0.5 text-[10px] uppercase tracking-[0.2em] text-slate-500">{l.role === "user" ? "You" : "Librarian"} · {new Date(l.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}{l.contributors?.length ? ` · ${l.contributors.length} advisors` : ""}</div>
              {l.text}
            </div>
          </div>
        ))}
        {mode === "thinking" && <p className="text-sm text-violet-200/70">The librarian is thinking…</p>}
      </div>
      <p className="mt-3 text-center text-xs text-slate-500">Education and projections only — not tax, legal, or investment advice. Every recommendation is reviewed by a licensed advisor and our tax professional team for suitability and IRS compliance before anything is implemented.</p>
    </div>
  );
}

function Reel({ spinning }: { spinning: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className={`h-20 w-20 shrink-0 rcs-reel ${spinning ? "" : "rcs-reel-paused"}`} aria-hidden="true">
      <circle cx="50" cy="50" r="46" fill="#15181f" stroke="#3b3f52" strokeWidth="2" />
      <circle cx="50" cy="50" r="30" fill="#1f2230" stroke="#8b7bf0" strokeWidth="1.5" opacity=".9" />
      {Array.from({ length: 6 }).map((_, i) => (
        <rect key={i} x="47" y="6" width="6" height="18" rx="2" fill="#8b7bf0" opacity=".8" transform={`rotate(${i * 60} 50 50)`} />
      ))}
      <circle cx="50" cy="50" r="8" fill="#0b0f1a" stroke="#a78bfa" strokeWidth="2" />
    </svg>
  );
}

function TransportButton({ children, label, onClick, disabled, active, tone }: { children: React.ReactNode; label: string; onClick: () => void; disabled?: boolean; active?: boolean; tone?: "red" | "violet" }) {
  const base = "flex flex-col items-center justify-center gap-1 rounded-xl border px-2 py-3 text-[11px] font-bold tracking-[0.18em] transition active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40";
  const look = active
    ? tone === "red" ? "border-red-400 bg-red-500 text-white shadow-[0_0_18px_rgba(239,68,68,.6)]" : "border-violet-300 bg-violet-500 text-white"
    : tone === "violet" ? "border-violet-400/50 bg-violet-500/20 text-violet-100 hover:bg-violet-500/35"
    : tone === "red" ? "border-white/15 bg-[#1b1e28] text-red-300 hover:bg-[#242836]"
    : "border-white/15 bg-[#1b1e28] text-slate-200 hover:bg-[#242836]";
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled} aria-pressed={active} className={`${base} ${look}`}>
      {children}
    </button>
  );
}
