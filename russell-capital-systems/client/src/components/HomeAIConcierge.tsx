// ============================================================
// HOME AI CONCIERGE — the big "press the mic and ask anything" panel
// on the public homepage. The visitor speaks (or types) a question as
// descriptively as they like; it fans out to every configured AI via
// ultra.homepagePanel, the lead model synthesizes ONE warm answer, and
// the panel shows how many AI advisors contributed.
//
// The answer is deliberately high-level — concepts and frames only, no
// dollar figures or formulas (the server's PUBLIC_TEASER_SYSTEM prompt
// enforces this). Speech is transcribed in the browser (Web Speech API);
// only the text of the question is sent to the server.
// ============================================================
import { useEffect, useRef, useState } from "react";
import { Mic, Sparkles, Square, ArrowRight, Calendar } from "lucide-react";
import { trpc } from "@/lib/trpc";

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
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

const EXAMPLES = [
  "I'm a surgeon with student loans, a big mortgage, and a 401(k) — how would you help me keep more and pay debt off faster?",
  "How do you turn my home equity and taxable accounts into something that's protected and tax-efficient?",
  "What's the general idea behind making my money 'divorce-proof'?",
];

export default function HomeAIConcierge() {
  const [listening, setListening] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [contributors, setContributors] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const recognizerRef = useRef<SpeechRecognitionLike | null>(null);

  const panel = trpc.ultra.homepagePanel.useMutation();
  const providers = trpc.ultra.providers.useQuery(undefined, { staleTime: 5 * 60_000 });
  const teamCount = providers.data?.team.filter((t) => t.configured).length ?? 0;

  useEffect(() => () => { recognizerRef.current?.stop(); }, []);

  const submit = async (text: string) => {
    const q = text.trim();
    if (!q) return;
    setStatus("The AI advisors are reviewing your question…");
    setAnswer("");
    setContributors([]);
    try {
      const res = await panel.mutateAsync({ question: q });
      setAnswer(res.answer);
      setContributors(res.contributors);
      setStatus("");
    } catch {
      setStatus("The concierge is unavailable right now — please try again, or book a call below.");
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
      setStatus("This browser has no speech recognition — please type your question instead.");
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
      setQuestion(text);
    };
    rec.onend = () => { setListening(false); if (finalText.trim()) void submit(finalText); };
    rec.onerror = () => { setListening(false); setStatus("Microphone unavailable or permission denied — type your question instead."); };
    setQuestion("");
    setStatus("Listening… describe your situation in as much detail as you like, then tap the mic again.");
    setListening(true);
    rec.start();
  };

  return (
    <section
      id="ai-brain-trust"
      aria-label="Ask the AI brain trust"
      className="relative overflow-hidden border-t border-emerald-300/10 bg-[#050b0a] py-24"
    >
      {/* Emerald Dawn skyline, crisp — darkened only enough to read over */}
      <img src="/rcs-city-emerald.webp" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover object-top brightness-[.5] saturate-[1.1]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#03090a_0%,rgba(3,9,10,.5)_30%,rgba(3,9,10,.75)_100%)]" />
      <div className="container relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-emerald-300/35 bg-emerald-300/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[.2em] text-emerald-300">
            <Sparkles size={14} /> {teamCount > 0 ? `${teamCount} AI advisors, one answer` : "AI Brain Trust"}
          </p>
          <h2
            className="mt-5 text-[clamp(2rem,5vw,3.8rem)] font-extrabold leading-tight text-white [text-shadow:_0_0_26px_rgba(16,185,129,.4)]"
            style={{ fontFamily: "DM Sans, sans-serif" }}
          >
            Press the mic. Ask <span className="text-emerald-300 [text-shadow:_0_0_26px_rgba(52,211,153,.85)]">anything</span>.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-white/75">
            Describe your situation in as much detail as you want — income, debt, mortgage, savings, goals.
            A panel of AI advisors reviews it together and gives you the plain-language shape of a plan.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-3xl rounded-[1.6rem] border border-emerald-200/35 bg-black/55 p-5 shadow-[0_28px_90px_rgba(0,0,0,.5),inset_0_0_45px_rgba(16,185,129,.045)] backdrop-blur-xl sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={toggleMic}
              aria-label={listening ? "Stop recording and ask" : "Start recording your question"}
              className={`flex items-center justify-center gap-2 rounded-xl px-6 py-4 text-base font-semibold transition ${listening ? "bg-red-500 text-white" : "rc-btn rc-btn-primary"}`}
            >
              {listening ? <><Square size={18} /> Stop &amp; ask</> : <><Mic size={18} /> Speak your question</>}
            </button>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="…or type it here. The more detail, the better the answer."
              rows={3}
              className="flex-1 rounded-xl border border-emerald-200/20 bg-[#00110d]/70 p-4 text-sm text-white outline-none placeholder:text-white/40 focus:border-emerald-300"
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setQuestion(ex)}
                className="rounded-full border border-emerald-200/20 bg-black/30 px-3 py-1.5 text-left text-xs text-white/60 transition hover:border-emerald-300/40 hover:text-emerald-200"
              >
                {ex.length > 54 ? `${ex.slice(0, 54)}…` : ex}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void submit(question)}
            disabled={panel.isPending || !question.trim()}
            className="rc-btn rc-btn-primary mt-4 w-full justify-center rounded-xl py-3.5 text-base disabled:opacity-50"
          >
            {panel.isPending ? "Consulting the AI advisors…" : <>Ask the AI Brain Trust <ArrowRight size={16} /></>}
          </button>

          {status && <p className="mt-3 text-center text-sm text-white/60">{status}</p>}

          {answer && (
            <div className="mt-5 rounded-xl border border-emerald-200/20 bg-[#00110d]/72 p-5">
              {contributors.length > 0 && (
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-emerald-300">
                  Answered by {contributors.length} AI advisor{contributors.length === 1 ? "" : "s"} · {contributors.join(" · ")}
                </p>
              )}
              <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-white/90">{answer}</div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <a href="#planning-estimator" className="rc-btn rc-btn-primary flex-1 justify-center rounded-xl py-3 text-sm"><ArrowRight size={16} /> See your estimate &amp; get a plan</a>
                <a href="#consultation" className="rc-btn flex-1 justify-center rounded-xl border border-emerald-300/45 bg-black/30 py-3 text-sm text-white hover:bg-emerald-300/10"><Calendar size={16} /> Book a thorough evaluation</a>
              </div>
            </div>
          )}

          <p className="mt-4 text-center text-[11px] leading-relaxed text-white/45">
            General education only — not tax, legal, or investment advice, and no specific figures are shared here.
            Your speech is transcribed in your browser; only the text of your question is sent. A licensed
            professional confirms every specific in a personal review.
          </p>
        </div>
      </div>
    </section>
  );
}
