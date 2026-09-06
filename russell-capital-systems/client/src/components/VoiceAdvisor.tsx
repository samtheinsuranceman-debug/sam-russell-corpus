// ============================================================
// VOICE ADVISOR — the every-page blue microphone.
// A floating button on ALL pages, public and portal, that stays in reach
// no matter how far the visitor scrolls: they speak (transcribed locally by
// the browser — audio never leaves the machine) or type, choose how they
// want the answer — direct, deeper, integrated, what's in it for them,
// legal with citations, or all of them — and the AI advisor answers with
// the current page and the saved profile in mind. "All" can be emailed as a
// PDF after they confirm the address and give permission.
// ============================================================
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ADVISOR_MODES, type AdvisorMode } from "@shared/advisorModes";

export const ULTRA_PROFILE_KEY = "rcs_ultra_profile_v1";

export function readSavedProfileSummary(): string {
  try {
    const raw = localStorage.getItem(ULTRA_PROFILE_KEY);
    if (!raw) return "";
    const data = JSON.parse(raw) as { summary?: string };
    return data.summary ?? "";
  } catch {
    return "";
  }
}

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((ev: unknown) => void) | null;
  start: () => void;
  stop: () => void;
};

function getRecognizer(): SpeechRecognitionLike | null {
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

type Section = { id: AdvisorMode; title: string; text: string; via?: string };

export default function VoiceAdvisor() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [asked, setAsked] = useState("");
  const [mode, setMode] = useState<AdvisorMode>("surface");
  const [sections, setSections] = useState<Section[]>([]);
  const [status, setStatus] = useState("");
  const [voiceOut, setVoiceOut] = useState(true);
  const [emailOpen, setEmailOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [mailStatus, setMailStatus] = useState("");
  const recognizerRef = useRef<SpeechRecognitionLike | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const ask = trpc.ultra.ask.useMutation();
  const speak = trpc.ultra.speak.useMutation();
  const emailAnswer = trpc.ultra.emailAnswer.useMutation();
  const providers = trpc.ultra.providers.useQuery(undefined, { staleTime: 5 * 60_000 });

  useEffect(() => () => { recognizerRef.current?.stop(); audioRef.current?.pause(); }, []);

  const submit = async (text: string, chosen: AdvisorMode = mode) => {
    const q = text.trim();
    if (!q) return;
    setStatus(chosen === "all" ? "Answering six ways — this takes a little longer…" : "Thinking…");
    setSections([]);
    setMailStatus("");
    setAsked(q);
    try {
      const res = await ask.mutateAsync({ question: q, pagePath: location, profileSummary: readSavedProfileSummary(), mode: chosen });
      const got: Section[] = res.sections?.length ? res.sections : [{ id: chosen, title: ADVISOR_MODES.find((m) => m.id === chosen)?.label ?? "Answer", text: res.answer, via: res.via }];
      setSections(got);
      setStatus("");
      if (voiceOut && providers.data?.voiceOut && got[0]) {
        try {
          const audio = await speak.mutateAsync({ text: got[0].text.slice(0, 1200) });
          if (audio.ok) {
            const el = new Audio(`data:${audio.mimeType};base64,${audio.audioBase64}`);
            audioRef.current = el;
            void el.play();
          }
        } catch { /* voice is best-effort; the text answer already rendered */ }
      }
    } catch {
      setStatus("The advisor is unavailable right now — try again in a moment.");
    }
  };

  const sendEmail = async () => {
    setMailStatus("Preparing the PDF and sending…");
    try {
      const r = await emailAnswer.mutateAsync({ question: asked || transcript, pagePath: location, profileSummary: readSavedProfileSummary(), email, confirmEmail, consent: true, sections: sections.length >= 5 ? sections : undefined });
      setMailStatus(r.sent ? `Sent to ${r.to} — the full answering process (${r.sections} sections) is in the PDF.` : r.reason);
      if (r.sent) setEmailOpen(false);
    } catch (e) {
      setMailStatus((e as Error).message || "Could not send.");
    }
  };

  const toggleMic = () => {
    if (listening) {
      recognizerRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = getRecognizer();
    if (!rec) {
      setStatus("This browser has no speech recognition — type your question below instead.");
      return;
    }
    recognizerRef.current = rec;
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    let finalText = "";
    rec.onresult = (ev) => {
      let text = "";
      for (let i = 0; i < ev.results.length; i++) text += ev.results[i][0]?.transcript ?? "";
      finalText = text;
      setTranscript(text);
    };
    rec.onend = () => {
      setListening(false);
      if (finalText.trim()) void submit(finalText);
    };
    rec.onerror = () => { setListening(false); setStatus("Microphone unavailable or permission denied."); };
    setTranscript("");
    setStatus("Listening… tap the mic again when you're done.");
    setListening(true);
    rec.start();
  };

  const canEmail = providers.data?.mailOut !== false;

  return (
    // Above the phone's sticky call-to-action bar on small screens, clear of the corner on large ones.
    <div className="fixed right-4 z-[70] bottom-[calc(5.4rem+env(safe-area-inset-bottom))] sm:bottom-5 sm:right-5" data-testid="voice-advisor">
      {open && (
        <div className="mb-3 max-h-[78vh] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-sky-400/40 bg-slate-950/95 p-4 text-sm text-slate-100 shadow-2xl backdrop-blur" role="dialog" aria-label="AI advisor">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-semibold text-sky-300">AI Advisor — ask anything, anywhere</span>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white" aria-label="Close advisor">✕</button>
          </div>
          <p className="mb-2 text-xs text-slate-400">The advisor knows this page and your saved profile. Pick how you want the answer, then speak or type.</p>
          <div className="mb-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label="How to answer">
            {ADVISOR_MODES.map((m) => (
              <button key={m.id} role="radio" aria-checked={mode === m.id} title={m.blurb} onClick={() => { setMode(m.id); if (asked) void submit(asked, m.id); }}
                className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${mode === m.id ? "border-sky-400 bg-sky-500 text-slate-950" : "border-slate-700 bg-slate-800 text-slate-200 hover:border-sky-400/60"}`}>
                {m.short}
              </button>
            ))}
          </div>
          <p className="mb-2 text-[11px] text-sky-200/70">{ADVISOR_MODES.find((m) => m.id === mode)?.blurb}</p>
          <div className="mb-2 flex gap-2">
            <button onClick={toggleMic} className={`flex-1 rounded-lg px-3 py-2 font-semibold ${listening ? "bg-red-600 text-white" : "bg-sky-500 text-slate-950"}`}>
              {listening ? "■ Stop & ask" : "🎙 Speak"}
            </button>
            <button onClick={() => setVoiceOut((v) => !v)} title="Toggle spoken answers" className={`rounded-lg px-3 py-2 ${voiceOut ? "bg-slate-700 text-sky-300" : "bg-slate-800 text-slate-500"}`}>🔊</button>
          </div>
          <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} placeholder="…or type your question" rows={2} className="mb-2 w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-100" />
          <button onClick={() => void submit(transcript)} disabled={ask.isPending || !transcript.trim()} className="w-full rounded-lg bg-slate-700 px-3 py-2 font-semibold text-white disabled:opacity-50">
            {ask.isPending ? "Answering…" : "Ask the advisor"}
          </button>
          {status && <p className="mt-2 text-xs text-slate-400">{status}</p>}
          {sections.length > 0 && (
            <div className="mt-2 max-h-72 space-y-3 overflow-y-auto rounded-lg bg-slate-900/80 p-3 text-slate-100">
              {sections.map((s) => (
                <section key={s.id}>
                  {sections.length > 1 && <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-sky-300">{s.title}</h4>}
                  <p className="whitespace-pre-wrap">{s.text}</p>
                </section>
              ))}
            </div>
          )}
          {sections.length > 0 && (
            <div className="mt-3 rounded-lg border border-slate-700 p-3">
              {!emailOpen ? (
                <button onClick={() => { setEmailOpen(true); setMailStatus(""); }} className="w-full rounded-lg border border-sky-400/50 px-3 py-2 text-xs font-semibold text-sky-200 hover:bg-sky-500/10">
                  📄 Email me the whole answering process as a PDF
                </button>
              ) : (
                <div className="space-y-2 text-xs">
                  <p className="text-slate-300">May we email you a PDF with your question answered all six ways? Confirm your address and give permission below.</p>
                  <input type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-100" aria-label="Email address" />
                  <input type="email" autoComplete="email" placeholder="Confirm your email" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-100" aria-label="Confirm email address" />
                  <label className="flex items-start gap-2 text-slate-300"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" /> Yes, email me this PDF. I understand it is education, not tax, legal or investment advice.</label>
                  {!canEmail && <p className="text-amber-300">Email is not switched on for this site yet.</p>}
                  <div className="flex gap-2">
                    <button onClick={() => void sendEmail()} disabled={!consent || !email || email.toLowerCase() !== confirmEmail.toLowerCase() || emailAnswer.isPending || !canEmail} className="flex-1 rounded-lg bg-sky-500 px-3 py-2 font-semibold text-slate-950 disabled:opacity-50">
                      {emailAnswer.isPending ? "Sending…" : "Send the PDF"}
                    </button>
                    <button onClick={() => setEmailOpen(false)} className="rounded-lg border border-slate-700 px-3 py-2 text-slate-300">Not now</button>
                  </div>
                </div>
              )}
              {mailStatus && <p className="mt-2 text-xs text-sky-200">{mailStatus}</p>}
            </div>
          )}
          <p className="mt-2 text-[10px] leading-tight text-slate-500">
            Projections and education only — not tax, legal, or investment advice. Speech is transcribed in your browser; only the text of your question and saved profile are sent to the advisor.
          </p>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close the AI advisor" : "Ask the AI advisor"}
        aria-expanded={open}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-sky-500 text-white shadow-[0_10px_30px_rgba(14,165,233,.45)] ring-2 ring-white/20 transition hover:scale-105 hover:bg-sky-400"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
      </button>
    </div>
  );
}
