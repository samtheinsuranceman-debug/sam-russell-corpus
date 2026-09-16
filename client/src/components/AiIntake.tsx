// ============================================================
// AI INTAKE — the blue microphone that runs the spoken fact finder.
//
// Press the microphone and the advisor starts talking: one question at a
// time from shared/aiIntakeScript.ts, spoken aloud (ElevenLabs when the host
// has it, the browser's own voice otherwise) and answered by voice (the
// browser transcribes locally) or by typing. When the questions are done
// the advisor re-explains everything back, asks what matters most, asks
// for three magic wishes, asks permission, and delivers the three
// questions the person would otherwise ask in five, ten and fifteen years.
// Signed-in users get the answers merged into their Financial Assessment.
// ============================================================
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  INTAKE_STORAGE_KEY, PERMISSION_ASK, PHASE_TITLES, INTAKE_STEP_BY_ID,
  applicableSteps, buildRecap, intakeProgress, intakeTotals, money, nextStep, parseAnswer, parseYesNo,
  type Answers, type IntakeRole, type IntakeStep,
} from "@shared/aiIntakeScript";

type Stage = "idle" | "asking" | "recap" | "fix" | "priorities" | "wish1" | "wish2" | "wish3" | "permission" | "questions" | "declined" | "done";

type Persisted = { answers: Answers; stage: Stage; priorities: string; wishes: { account: string; future: string; outcomes: string } };

type SpeechRecognitionLike = {
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null; onerror: ((ev: unknown) => void) | null;
  start: () => void; stop: () => void; abort?: () => void;
};

function getRecognizer(): SpeechRecognitionLike | null {
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

function loadPersisted(): Persisted {
  try {
    const raw = localStorage.getItem(INTAKE_STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Persisted>;
      return {
        answers: p.answers ?? {},
        stage: p.stage && p.stage !== "questions" ? p.stage : "idle",
        priorities: p.priorities ?? "",
        wishes: { account: "", future: "", outcomes: "", ...(p.wishes ?? {}) },
      };
    }
  } catch { /* fresh start */ }
  return { answers: {}, stage: "idle", priorities: "", wishes: { account: "", future: "", outcomes: "" } };
}

const WISH_PROMPTS: Record<"wish1" | "wish2" | "wish3", string> = {
  wish1: "Now, three magic wishes. The first is for your accounts: if you could wave a wand over the money itself, what would be different?",
  wish2: "The second wish is for your future: five, ten, twenty years out, what does the picture look like when it has gone right?",
  wish3: "The third wish is for the outcomes: what has to be true, in plain words, for you to say this plan worked?",
};

const ROLE_OPENERS: Record<IntakeRole, string> = {
  physician: "Doctor, thank you for sitting down with me. I am going to ask about every asset you have, the way a seasoned advisor would across the table, and then I will explain it all back to you. Answer in round numbers; nothing has to be exact.",
  client: "Thank you for sitting down with me. I am going to walk through every asset you have, one question at a time, and then explain it all back to you. Round numbers are fine.",
  advisor: "Let's run the intake for this client. Answer for them in round numbers; I will map everything into the Financial Assessment and the calculators as we go.",
};

export default function AiIntake({ role, autoStart = false, onClose }: { role: IntakeRole; autoStart?: boolean; onClose?: () => void }) {
  const initial = useMemo(loadPersisted, []);
  const [answers, setAnswers] = useState<Answers>(initial.answers);
  const [stage, setStage] = useState<Stage>(initial.stage);
  const [priorities, setPriorities] = useState(initial.priorities);
  const [wishes, setWishes] = useState(initial.wishes);
  const [listening, setListening] = useState(false);
  const [handsFree, setHandsFree] = useState(true);
  const [voiceOn, setVoiceOn] = useState(true);
  const [transcript, setTranscript] = useState("");
  const [typed, setTyped] = useState("");
  const [status, setStatus] = useState("");
  const [saidPrompt, setSaidPrompt] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const [questions, setQuestions] = useState<Array<{ horizon: number; title: string; question: string; spoken: string; evidence: string[]; strategies: string[]; calculators: Array<{ label: string; path: string }> }> | null>(null);
  const [questionsVia, setQuestionsVia] = useState("");
  const [saveNote, setSaveNote] = useState("");
  const [micSupported] = useState(() => typeof window !== "undefined" && Boolean(getRecognizer()));

  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startedRef = useRef(false);
  const stageRef = useRef<Stage>(initial.stage);
  const answersRef = useRef<Answers>(initial.answers);
  const handsFreeRef = useRef(true);
  stageRef.current = stage;
  answersRef.current = answers;
  handsFreeRef.current = handsFree;

  const { isAuthenticated } = useAuth();
  const providers = trpc.ultra.providers.useQuery(undefined, { staleTime: 5 * 60_000 });
  const speak = trpc.ultra.speak.useMutation();
  const threeQuestions = trpc.intake.threeQuestions.useMutation();
  const save = trpc.intake.save.useMutation();
  const utils = trpc.useUtils();

  const step: IntakeStep | null = stage === "asking" ? nextStep(answers) : null;
  const progress = intakeProgress(answers);
  const totals = intakeTotals(answers);

  // Persist every change so a refresh never loses the conversation.
  useEffect(() => {
    try { localStorage.setItem(INTAKE_STORAGE_KEY, JSON.stringify({ answers, stage, priorities, wishes } satisfies Persisted)); } catch { /* private mode */ }
  }, [answers, stage, priorities, wishes]);

  useEffect(() => () => { recRef.current?.stop(); audioRef.current?.pause(); try { window.speechSynthesis?.cancel(); } catch { /* none */ } }, []);

  // ── speaking ─────────────────────────────────────────────────────────
  const say = useCallback(async (text: string): Promise<void> => {
    setSaidPrompt(text);
    if (!voiceOn) return;
    setSpeaking(true);
    try {
      audioRef.current?.pause();
      try { window.speechSynthesis?.cancel(); } catch { /* none */ }
      if (providers.data?.voiceOut) {
        try {
          const audio = await speak.mutateAsync({ text: text.slice(0, 1900) });
          if (audio.ok) {
            await new Promise<void>((resolve) => {
              const el = new Audio(`data:${audio.mimeType};base64,${audio.audioBase64}`);
              audioRef.current = el;
              el.onended = () => resolve();
              el.onerror = () => resolve();
              el.play().catch(() => resolve());
            });
            return;
          }
        } catch { /* fall through to the browser voice */ }
      }
      const synth = window.speechSynthesis;
      if (synth && typeof SpeechSynthesisUtterance !== "undefined") {
        await new Promise<void>((resolve) => {
          const u = new SpeechSynthesisUtterance(text);
          u.rate = 0.98;
          u.onend = () => resolve();
          u.onerror = () => resolve();
          synth.speak(u);
        });
      }
    } finally {
      setSpeaking(false);
    }
  }, [providers.data?.voiceOut, speak, voiceOn]);

  // ── listening ────────────────────────────────────────────────────────
  const stopListening = useCallback(() => { recRef.current?.stop(); setListening(false); }, []);

  const listen = useCallback((onHeard: (text: string) => void) => {
    const rec = getRecognizer();
    if (!rec) { setStatus("This browser has no speech recognition. Type your answer below."); return; }
    recRef.current?.abort?.();
    recRef.current = rec;
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = true;
    let finalText = "";
    rec.onresult = (ev) => {
      let text = "";
      for (let i = 0; i < ev.results.length; i++) text += ev.results[i][0]?.transcript ?? "";
      finalText = text;
      setTranscript(text);
    };
    rec.onerror = () => { setListening(false); setStatus("I did not catch that. Press the microphone or type your answer."); };
    rec.onend = () => {
      setListening(false);
      const heard = finalText.trim();
      if (heard) onHeard(heard);
    };
    setTranscript("");
    setStatus("Listening…");
    setListening(true);
    try { rec.start(); } catch { setListening(false); }
  }, []);

  // ── the conversation ─────────────────────────────────────────────────
  const promptFor = useCallback((s: Stage, a: Answers): string => {
    switch (s) {
      case "asking": return nextStep(a)?.say ?? "";
      case "recap": return buildRecap(a).join(" ");
      case "fix": return "Tell me which item to fix, or tap it below.";
      case "priorities": return "Of everything we just covered, what matters most to you? Tell me your priorities in order.";
      case "wish1": case "wish2": case "wish3": return WISH_PROMPTS[s];
      case "permission": return PERMISSION_ASK;
      case "declined": return "Understood. The three questions will be here whenever you want them. Everything you told me is saved.";
      case "done": return "Those are your three questions. Every strategy named in them is a calculator on this site, and the Calculator Chain runs all of them together through ten thousand simulations. Thank you for your trust.";
      default: return "";
    }
  }, []);

  const handleHeardRef = useRef<(text: string) => void>(() => undefined);

  const askStage = useCallback(async (s: Stage, a: Answers) => {
    const text = promptFor(s, a);
    if (!text) return;
    setStatus("");
    await say(text);
    if (handsFreeRef.current && micSupported && s !== "declined" && s !== "done" && s !== "questions") listen((t) => handleHeardRef.current(t));
  }, [listen, micSupported, promptFor, say]);

  const persistToAssessment = useCallback(async (a: Answers, extras: { priorities: string; wishes: typeof wishes }) => {
    if (!isAuthenticated) { setSaveNote("Sign in to save these answers into your Financial Assessment; for now they live in this browser."); return; }
    try {
      const r = await save.mutateAsync({ answers: a, extras: { priorities: extras.priorities || undefined, wishes: extras.wishes } });
      if (r.saved) { setSaveNote(`Saved into your Financial Assessment (${r.completeness.percent}% complete).`); void utils.factFinder.get.invalidate(); }
      else setSaveNote(r.reason);
    } catch (e) {
      setSaveNote((e as Error).message || "Could not save to the assessment.");
    }
  }, [isAuthenticated, save, utils.factFinder.get]);

  const deliverQuestions = useCallback(async (a: Answers, extras: { priorities: string; wishes: typeof wishes }) => {
    setStage("questions");
    setStatus("Building your three questions from your own numbers…");
    try {
      const r = await threeQuestions.mutateAsync({ answers: a, extras: { priorities: extras.priorities || undefined, wishes: extras.wishes } });
      setQuestions(r.questions);
      setQuestionsVia(r.via);
      setStatus("");
      for (const q of r.questions) {
        if (stageRef.current !== "questions") break;
        await say(`${q.horizon} years out. ${q.spoken}`);
      }
      setStage("done");
      await say(promptFor("done", a));
    } catch {
      setStatus("The questions could not be built right now. Your answers are saved; try again in a moment.");
      setStage("permission");
    }
  }, [promptFor, say, threeQuestions]);

  const advance = useCallback(async (from: Stage, a: Answers, extras: { priorities: string; wishes: typeof wishes }) => {
    let next: Stage = from;
    if (from === "asking") next = nextStep(a) ? "asking" : "recap";
    else if (from === "recap") next = "priorities";
    else if (from === "priorities") next = "wish1";
    else if (from === "wish1") next = "wish2";
    else if (from === "wish2") next = "wish3";
    else if (from === "wish3") { next = "permission"; void persistToAssessment(a, extras); }
    setStage(next);
    await askStage(next, a);
  }, [askStage, persistToAssessment]);

  const handleHeard = useCallback(async (text: string) => {
    const s = stageRef.current;
    const a = answersRef.current;
    const extras = { priorities, wishes };
    setTranscript(text);
    if (s === "asking") {
      const st = nextStep(a);
      if (!st) return;
      const v = parseAnswer(st, text);
      if (v === null) {
        setStatus(`I heard "${text}" but could not turn it into ${st.kind === "money" ? "an amount" : st.kind === "yesno" ? "a yes or no" : st.kind === "percent" ? "a percentage" : "an answer"}. Say it once more, or type it.`);
        if (handsFreeRef.current && micSupported) listen((t) => handleHeardRef.current(t));
        return;
      }
      const na = { ...a, [st.id]: v };
      setAnswers(na);
      await advance("asking", na, extras);
      return;
    }
    if (s === "recap") {
      const yn = parseYesNo(text);
      if (yn === false) { setStage("fix"); await askStage("fix", a); return; }
      await advance("recap", a, extras);
      return;
    }
    if (s === "fix") {
      const wanted = applicableSteps(a).find((st) => st.id in a && text.toLowerCase().split(/\s+/).some((w) => w.length > 3 && st.say.toLowerCase().includes(w)));
      if (wanted) { const na = { ...a }; delete na[wanted.id]; setAnswers(na); setStage("asking"); await askStage("asking", na); }
      else { setStatus("Tap the item to fix in the list below."); }
      return;
    }
    if (s === "priorities") { setPriorities(text); await advance("priorities", a, { ...extras, priorities: text }); return; }
    if (s === "wish1") { const w = { ...wishes, account: text }; setWishes(w); await advance("wish1", a, { ...extras, wishes: w }); return; }
    if (s === "wish2") { const w = { ...wishes, future: text }; setWishes(w); await advance("wish2", a, { ...extras, wishes: w }); return; }
    if (s === "wish3") { const w = { ...wishes, outcomes: text }; setWishes(w); await advance("wish3", a, { ...extras, wishes: w }); return; }
    if (s === "permission") {
      const yn = parseYesNo(text);
      if (yn === false) { setStage("declined"); await say(promptFor("declined", a)); return; }
      if (yn === null) { setStatus("A yes or a no is all I need."); if (handsFreeRef.current && micSupported) listen((t) => handleHeardRef.current(t)); return; }
      await deliverQuestions(a, extras);
    }
  }, [advance, askStage, deliverQuestions, listen, micSupported, priorities, promptFor, say, wishes]);
  handleHeardRef.current = (t) => { void handleHeard(t); };

  const start = useCallback(async () => {
    if (startedRef.current) return;
    startedRef.current = true;
    const a = answersRef.current;
    const resumeStage: Stage = stageRef.current === "idle" ? "asking" : stageRef.current;
    setStage(resumeStage);
    if (stageRef.current === "idle" || Object.keys(a).length === 0) await say(ROLE_OPENERS[role]);
    else await say("Welcome back. We pick up where we left off.");
    await askStage(resumeStage, a);
  }, [askStage, role, say]);

  useEffect(() => { if (autoStart) void start(); }, [autoStart, start]);

  const micPress = () => {
    if (!startedRef.current) { void start(); return; }
    if (listening) { stopListening(); return; }
    if (speaking) { audioRef.current?.pause(); try { window.speechSynthesis?.cancel(); } catch { /* none */ } setSpeaking(false); }
    listen((t) => handleHeardRef.current(t));
  };

  const submitTyped = (e: React.FormEvent) => {
    e.preventDefault();
    const t = typed.trim();
    if (!t) return;
    setTyped("");
    if (!startedRef.current) { startedRef.current = true; setStage("asking"); }
    stopListening();
    void handleHeard(t);
  };

  const restart = () => {
    stopListening();
    audioRef.current?.pause();
    try { window.speechSynthesis?.cancel(); } catch { /* none */ }
    setAnswers({}); setPriorities(""); setWishes({ account: "", future: "", outcomes: "" }); setQuestions(null); setSaveNote(""); setStatus(""); setSaidPrompt("");
    setStage("idle");
    startedRef.current = false;
  };

  const fixItem = (id: string) => {
    const na = { ...answersRef.current };
    delete na[id];
    setAnswers(na);
    setStage("asking");
    void askStage("asking", na);
  };

  const answeredSteps = applicableSteps(answers).filter((s) => s.id in answers);
  const inConversation = stage !== "idle";

  return (
    <section className="rounded-3xl border border-sky-300/25 bg-[#03110f]/85 p-5 text-white shadow-[0_30px_100px_rgba(2,132,199,.18)] backdrop-blur-xl" aria-label="AI intake conversation" data-testid="ai-intake">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">AI fact finder · spoken</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Talk to the advisor</h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-sky-100/70">
          <label className="flex items-center gap-1"><input type="checkbox" className="accent-sky-400" checked={voiceOn} onChange={(e) => setVoiceOn(e.target.checked)} /> Voice</label>
          <label className="flex items-center gap-1"><input type="checkbox" className="accent-sky-400" checked={handsFree} onChange={(e) => setHandsFree(e.target.checked)} /> Hands-free</label>
          {onClose && <button type="button" onClick={onClose} className="rounded-lg border border-white/15 px-2 py-1 hover:bg-white/10">Close</button>}
        </div>
      </div>

      <div className="mt-5 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <button
          type="button"
          onClick={micPress}
          aria-label={listening ? "Stop listening" : inConversation ? "Speak your answer" : "Start the AI fact finder"}
          aria-pressed={listening}
          data-testid="intake-mic"
          className={`relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white shadow-[0_0_40px_rgba(14,165,233,.55)] transition active:scale-95 ${listening ? "animate-pulse ring-4 ring-sky-300/60" : speaking ? "ring-4 ring-emerald-300/50" : "hover:bg-sky-400"}`}
        >
          <svg viewBox="0 0 24 24" className="h-11 w-11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M12 18v3" /><path d="M8 21h8" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          {!inConversation && (
            <p className="leading-7 text-sky-100/75">Press the blue microphone and the advisor starts asking: cash, stocks, bonds, funds and annuities, your home, your rentals, retirement accounts, the unusual assets. Then it explains everything back, asks what matters most, asks for three wishes, and hands you the three questions you would otherwise ask in five, ten and fifteen years.</p>
          )}
          {inConversation && (
            <>
              {step && <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300/80">{PHASE_TITLES[step.phase]} · {progress.answered + 1} of {progress.total}</p>}
              {stage !== "asking" && <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300/80">{stage === "recap" ? "Playing it back" : stage === "fix" ? "Fixing an answer" : stage === "priorities" ? "Your priorities" : stage.startsWith("wish") ? `Wish ${stage.slice(-1)} of 3` : stage === "permission" ? "One question first" : stage === "questions" ? "Your three questions" : stage === "declined" ? "Saved" : "Complete"}</p>}
              <p className="mt-2 text-lg leading-8" aria-live="polite" data-testid="intake-prompt">{saidPrompt}</p>
              {step?.options && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {step.options.map((o) => <button key={o} type="button" onClick={() => { stopListening(); void handleHeard(o); }} className="rounded-full border border-sky-300/30 px-3 py-1 text-sm hover:bg-sky-500/20">{o}</button>)}
                </div>
              )}
              {(step?.kind === "yesno" || stage === "recap" || stage === "permission") && (
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => { stopListening(); void handleHeard("yes"); }} className="rounded-full border border-emerald-300/40 px-4 py-1 text-sm hover:bg-emerald-500/20">Yes</button>
                  <button type="button" onClick={() => { stopListening(); void handleHeard("no"); }} className="rounded-full border border-white/20 px-4 py-1 text-sm hover:bg-white/10">No</button>
                </div>
              )}
              {transcript && <p className="mt-2 text-sm text-sky-200/70">Heard: “{transcript}”</p>}
              {status && <p className="mt-2 text-sm text-amber-200/90" role="status">{status}</p>}
            </>
          )}
          {stage !== "questions" && stage !== "done" && (
            <form onSubmit={submitTyped} className="mt-3 flex gap-2">
              <input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={inConversation ? "…or type your answer" : "…or type to begin"} aria-label="Type your answer" data-testid="intake-typed"
                className="min-w-0 flex-1 rounded-xl border border-sky-300/25 bg-black/30 px-4 py-2 text-white placeholder:text-sky-100/35 focus:border-sky-300 focus:outline-none" />
              <button type="submit" className="rounded-xl bg-sky-500/80 px-4 py-2 text-sm font-semibold hover:bg-sky-400">Send</button>
            </form>
          )}
        </div>
      </div>

      {inConversation && (
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10" aria-label="Intake progress">
          <div className="h-full bg-sky-400 transition-all" style={{ width: `${stage === "asking" ? progress.percent : 100}%` }} />
        </div>
      )}

      {stage === "fix" && (
        <ul className="mt-4 grid gap-1 sm:grid-cols-2">
          {answeredSteps.map((s) => (
            <li key={s.id}>
              <button type="button" onClick={() => fixItem(s.id)} className="w-full rounded-lg border border-white/10 px-3 py-2 text-left text-sm hover:bg-white/5">
                <span className="text-sky-200/70">{s.say.slice(0, 60)}{s.say.length > 60 ? "…" : ""}</span>
                <span className="block font-semibold">{formatAnswer(answers[s.id])}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {(stage === "recap" || stage === "priorities" || stage.startsWith("wish") || stage === "permission" || stage === "questions" || stage === "done" || stage === "declined") && (
        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          {[["Cash", totals.cash], ["Liquid", totals.liquid], ["Home equity", totals.homeEquity], ["Net worth", totals.netWorth]].map(([l, v]) => (
            <div key={String(l)} className="rounded-xl border border-white/10 bg-white/[0.04] p-3"><p className="text-xs text-sky-200/60">{l}</p><p className="text-lg font-semibold">{money(Number(v))}</p></div>
          ))}
        </div>
      )}

      {questions && (
        <ol className="mt-6 grid gap-4" data-testid="intake-questions">
          {questions.map((q) => (
            <li key={q.horizon} className="rounded-2xl border border-emerald-300/25 bg-emerald-500/[0.06] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">In {q.horizon} years</p>
              <h3 className="mt-1 text-xl font-semibold">{q.title}</h3>
              <p className="mt-3 leading-7 text-emerald-50/90">{q.spoken}</p>
              <details className="mt-3 text-sm text-emerald-100/75">
                <summary className="cursor-pointer font-semibold text-emerald-200">Why the numbers say so, and every strategy that bears on it</summary>
                <ul className="mt-2 list-disc space-y-1 pl-5">{q.evidence.map((e) => <li key={e}>{e}</li>)}</ul>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Strategies engaged</p>
                <ul className="mt-1 flex flex-wrap gap-1">{q.strategies.map((s) => <li key={s} className="rounded-full border border-emerald-300/25 px-2 py-0.5 text-xs">{s}</li>)}</ul>
              </details>
              <div className="mt-3 flex flex-wrap gap-2">
                {q.calculators.map((c) => <Link key={c.path} href={c.path} className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-semibold text-emerald-100 hover:bg-emerald-500/35">{c.label} →</Link>)}
              </div>
            </li>
          ))}
          {questionsVia && <li className="text-xs text-emerald-200/50">Wording by {questionsVia === "rule-engine" ? "the Russell rule engine" : questionsVia}; every figure comes from what you said.</li>}
        </ol>
      )}

      {saveNote && <p className="mt-4 text-sm text-sky-200/75" role="status">{saveNote}</p>}

      {inConversation && (
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {(stage === "done" || stage === "declined") && !questions && <button type="button" onClick={() => void deliverQuestions(answers, { priorities, wishes })} className="rounded-full bg-emerald-500 px-4 py-1.5 font-semibold text-white hover:bg-emerald-400">Show me the three questions</button>}
          {(stage === "done" || stage === "declined") && isAuthenticated && <Link href="/portal/financial-assessment" className="rounded-full border border-white/20 px-4 py-1.5 hover:bg-white/10">Open the Financial Assessment</Link>}
          {(stage === "done" || stage === "declined") && <Link href="/portal/chain" className="rounded-full border border-white/20 px-4 py-1.5 hover:bg-white/10">Run the Calculator Chain</Link>}
          <button type="button" onClick={restart} className="rounded-full border border-white/15 px-4 py-1.5 text-sky-100/70 hover:bg-white/10">Start over</button>
        </div>
      )}
    </section>
  );
}

function formatAnswer(v: Answers[string] | undefined): string {
  if (v === undefined || v === null) return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") return v >= 1000 ? money(v) : String(v);
  return v;
}

export { INTAKE_STEP_BY_ID };
