// ============================================================
// VOICE ADVISOR — the every-page speaker button.
// A floating mic on ALL pages: the client (or the advisor) speaks,
// the browser transcribes locally (Web Speech API — audio never
// leaves the machine for transcription), the transcript goes to the
// AI advisor with the current page path and the saved profile, and
// the answer comes back on screen — and out loud via the configured
// ElevenLabs voice when the server has voice keys set.
// ============================================================
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

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

export default function VoiceAdvisor() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState("");
  const [voiceOut, setVoiceOut] = useState(true);
  const recognizerRef = useRef<SpeechRecognitionLike | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const ask = trpc.ultra.ask.useMutation();
  const speak = trpc.ultra.speak.useMutation();
  const providers = trpc.ultra.providers.useQuery(undefined, { staleTime: 5 * 60_000 });

  useEffect(() => () => { recognizerRef.current?.stop(); audioRef.current?.pause(); }, []);

  const submit = async (text: string) => {
    const q = text.trim();
    if (!q) return;
    setStatus("Thinking…");
    setAnswer("");
    try {
      const res = await ask.mutateAsync({
        question: q,
        pagePath: location,
        profileSummary: readSavedProfileSummary(),
      });
      setAnswer(res.answer);
      setStatus("");
      if (voiceOut && providers.data?.voiceOut) {
        try {
          const audio = await speak.mutateAsync({ text: res.answer.slice(0, 1200) });
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

  return (
    <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 60 }}>
      {open && (
        <div className="mb-3 w-80 rounded-xl border border-amber-500/40 bg-slate-900/95 p-4 text-sm text-slate-100 shadow-2xl backdrop-blur">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-semibold text-amber-400">AI Advisor — this page</span>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white" aria-label="Close advisor">✕</button>
          </div>
          <p className="mb-2 text-xs text-slate-400">
            Ask "what does this page mean for me?" — the advisor knows your saved profile and where you are on the site.
          </p>
          <div className="mb-2 flex gap-2">
            <button
              onClick={toggleMic}
              className={`flex-1 rounded-lg px-3 py-2 font-semibold ${listening ? "bg-red-600 text-white" : "bg-amber-500 text-slate-900"}`}
            >
              {listening ? "■ Stop & ask" : "🎙 Speak"}
            </button>
            <button
              onClick={() => setVoiceOut((v) => !v)}
              title="Toggle spoken answers"
              className={`rounded-lg px-3 py-2 ${voiceOut ? "bg-slate-700 text-amber-300" : "bg-slate-800 text-slate-500"}`}
            >
              🔊
            </button>
          </div>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="…or type your question"
            rows={2}
            className="mb-2 w-full rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-100"
          />
          <button
            onClick={() => void submit(transcript)}
            disabled={ask.isPending || !transcript.trim()}
            className="w-full rounded-lg bg-slate-700 px-3 py-2 font-semibold text-white disabled:opacity-50"
          >
            Ask the advisor
          </button>
          {status && <p className="mt-2 text-xs text-slate-400">{status}</p>}
          {answer && (
            <div className="mt-2 max-h-56 overflow-y-auto rounded-lg bg-slate-800/80 p-3 text-slate-100 whitespace-pre-wrap">
              {answer}
            </div>
          )}
          <p className="mt-2 text-[10px] leading-tight text-slate-500">
            Projections and education only — not tax, legal, or investment advice. Speech is transcribed in your
            browser; only the text of your question and saved profile are sent to the advisor.
          </p>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open AI voice advisor"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-2xl shadow-xl transition hover:scale-105"
      >
        🎙
      </button>
    </div>
  );
}
