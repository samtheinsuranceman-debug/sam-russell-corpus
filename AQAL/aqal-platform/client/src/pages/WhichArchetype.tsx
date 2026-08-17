// ============================================================
// WHICH ARCHETYPE MIGHT YOU BE? — the 2-minute teaser quiz.
// Honest by design: eight forced choices produce a MIGHT, loudly
// labeled as not-a-measurement, funneling into the real 27-question
// assessment. The share loop that doesn't wait for members.
// ============================================================
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";
import { ARCHETYPES } from "./archetypesData";

const INK = "#141009";
const INK2 = "#1B1610";
const CREAM = "#F1EADB";
const CREAM2 = "#CFC5B0";
const MUTED = "#9C8F79";
const CHAMPAGNE = "#E0C68C";
const JADE = "#9BC0B2";
const EMBER = "#E2604A";
const LINE_C = "rgba(241,234,219,0.10)";
const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;
const serif = { fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 } as const;

type Opt = { label: string; w: Record<string, number> };
type Q = { q: string; opts: Opt[] };

const QUESTIONS: Q[] = [
  { q: "A big group project is falling apart. Your instinct?", opts: [
    { label: "Take charge and reassign the work", w: { Leadership: 2, Strategic: 1 } },
    { label: "Talk to each person and find out what's really wrong", w: { Interpersonal: 2, Empathic: 1 } },
    { label: "Rebuild the plan from first principles", w: { Logical: 2, Systematic: 1 } },
    { label: "Quietly do the critical piece yourself, tonight", w: { Volitional: 2, Tactical: 1 } },
  ]},
  { q: "What do people come to you for?", opts: [
    { label: "Hard decisions — I see the whole board", w: { Strategic: 2, Systematic: 1 } },
    { label: "Comfort — they feel understood around me", w: { Empathic: 2, Interpersonal: 1 } },
    { label: "Ideas nobody else would think of", w: { Creative: 2, Intuitive: 1 } },
    { label: "Getting unstuck — I make things move", w: { Volitional: 2, Leadership: 1 } },
  ]},
  { q: "Your idea of a perfect Saturday?", opts: [
    { label: "Building or fixing something with my hands", w: { Kinesthetic: 2, Architectural: 1 } },
    { label: "A long conversation that goes somewhere deep", w: { Existential: 2, Empathic: 1 } },
    { label: "A competition — game, sport, market, anything", w: { Adversarial: 2, Strategic: 1 } },
    { label: "Making something — music, writing, food, art", w: { Creative: 2, Aesthetic: 1 } },
  ]},
  { q: "In an argument, your strength is…", opts: [
    { label: "The airtight case", w: { Logical: 2, Linguistic: 1 } },
    { label: "Reading what they actually need to hear", w: { Influence: 2, Interpersonal: 1 } },
    { label: "Staying calm while they lose it", w: { Resilient: 2, Emotional: 1 } },
    { label: "Knowing when to walk away", w: { Intrapersonal: 2, Adaptive: 1 } },
  ]},
  { q: "The compliment that would mean the most?", opts: [
    { label: "\"You saw it coming before anyone.\"", w: { Intuitive: 2, Strategic: 1 } },
    { label: "\"You changed how I see myself.\"", w: { Empathic: 2, Influence: 1 } },
    { label: "\"You never quit. Ever.\"", w: { Volitional: 2, Resilient: 1 } },
    { label: "\"You built something that lasts.\"", w: { Architectural: 2, "Community-Founding": 1 } },
  ]},
  { q: "What derails you most often?", opts: [
    { label: "I overthink until the moment passes", w: { Logical: 1, Intrapersonal: 1 } },
    { label: "I say yes to everyone and drown", w: { Empathic: 1, Interpersonal: 1 } },
    { label: "I start fires I don't finish", w: { Creative: 1, Intuitive: 1 } },
    { label: "I bulldoze people without noticing", w: { Leadership: 1, Volitional: 1 } },
  ]},
  { q: "Money, honestly:", opts: [
    { label: "Tracked, planned, compounding", w: { "Financial-Self-Management": 2, Systematic: 1 } },
    { label: "It comes, it goes, life is now", w: { Emotional: 1, Creative: 1 } },
    { label: "I earn hard but manage soft", w: { Volitional: 1, Tactical: 1 } },
    { label: "I'd rather build wealth in people", w: { "Community-Founding": 2, Interpersonal: 1 } },
  ]},
  { q: "Which loss would cut deepest?", opts: [
    { label: "My independence", w: { Volitional: 1, Intrapersonal: 1 } },
    { label: "My people", w: { Interpersonal: 2, Empathic: 1 } },
    { label: "My edge — being the best at what I do", w: { Adversarial: 2, Strategic: 1 } },
    { label: "My sense of why any of it matters", w: { Existential: 2, Philosophical: 1 } },
  ]},
];

export default function WhichArchetype() {
  const [answers, setAnswers] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const step = answers.length;

  const result = useMemo(() => {
    if (!done) return null;
    const weights: Record<string, number> = {};
    answers.forEach((a, i) => {
      const w = QUESTIONS[i].opts[a].w;
      Object.entries(w).forEach(([line, pts]) => { weights[line] = (weights[line] ?? 0) + pts; });
    });
    const scored = ARCHETYPES
      .filter((ar) => ar.kind === "archetype")
      .map((ar) => ({ ar, score: ar.highLines.reduce((s, l) => s + (weights[l] ?? 0), 0) }))
      .sort((a, b) => b.score - a.score);
    const topLines = Object.entries(weights).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([l]) => l);
    return { best: scored[0]?.ar, runner: scored[1]?.ar, topLines };
  }, [done, answers]);

  const pick = (i: number) => {
    const next = [...answers, i];
    setAnswers(next);
    if (next.length >= QUESTIONS.length) setDone(true);
  };

  const shareResult = async () => {
    const text = `The 2-minute teaser says I might be near "${result?.best?.name}" — the real measurement is 32 lines, scored by an 8-AI panel. First 10,000 free for life: https://joinaqal.com/which-archetype`;
    try {
      if (navigator.share) await navigator.share({ text });
      else { await navigator.clipboard.writeText(text); toast.success("Copied — paste it anywhere."); }
    } catch { /* cancelled */ }
  };

  return (
    <div className="min-h-screen" style={{ background: INK }}>
      <PublicHeader />
      <div className="max-w-[720px] mx-auto px-6 py-16">
        <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.26em", textTransform: "uppercase", color: CHAMPAGNE, marginBottom: "12px" }}>
          The 2-minute teaser · not the measurement
        </p>
        <h1 style={{ ...serif, fontSize: "clamp(30px,5vw,48px)", lineHeight: 1.05, color: CREAM, margin: "0 0 10px" }}>
          Which archetype might you be?
        </h1>
        <p style={{ color: CREAM2, fontSize: "15px", lineHeight: 1.65, marginBottom: "6px", maxWidth: "42em" }}>
          Eight forced choices. A <em>might</em>, not a measurement — the real thing is 27 spoken questions scored by an
          8-AI panel across all 32 lines. This is the trailer.
        </p>
        <p style={{ ...mono, fontSize: "10.5px", color: MUTED, marginBottom: "32px" }}>
          No signup. Nothing stored. {QUESTIONS.length} questions, ~2 minutes.
        </p>

        {!done && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              {QUESTIONS.map((_, i) => (
                <span key={i} className="h-[3px] flex-1 rounded-full" style={{ background: i < step ? CHAMPAGNE : "rgba(241,234,219,0.12)" }} />
              ))}
            </div>
            <p style={{ ...serif, fontSize: "24px", color: CREAM, marginBottom: "18px" }}>
              {step + 1}. {QUESTIONS[step].q}
            </p>
            <div className="space-y-2.5">
              {QUESTIONS[step].opts.map((o, i) => (
                <button key={i} onClick={() => pick(i)}
                  className="block w-full text-left px-5 py-4 rounded-xl border transition-colors cursor-pointer hover:border-[#E0C68C88]"
                  style={{ borderColor: LINE_C, background: INK2, color: CREAM2, fontSize: "15px", lineHeight: 1.5 }}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {done && result?.best && (
          <div>
            <div style={{ border: `1px solid ${CHAMPAGNE}55`, borderLeft: `3px solid ${CHAMPAGNE}`, borderRadius: "16px", background: "rgba(224,198,140,0.05)", padding: "28px", marginBottom: "16px" }}>
              <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: CHAMPAGNE, marginBottom: "10px" }}>
                You might be near…
              </p>
              <p style={{ ...serif, fontSize: "clamp(26px,4vw,38px)", lineHeight: 1.1, color: CREAM, marginBottom: "10px" }}>
                {result.best.name}
              </p>
              <p style={{ color: CREAM2, fontSize: "14.5px", lineHeight: 1.65, marginBottom: "12px" }}>{result.best.pattern}</p>
              <p style={{ ...mono, fontSize: "10.5px", color: MUTED }}>
                Strongest signals from your answers: {result.topLines.join(" · ")}
                {result.runner ? ` · second guess: ${result.runner.name}` : ""}
              </p>
            </div>

            <div style={{ border: `1px solid ${EMBER}44`, borderRadius: "12px", background: "rgba(226,96,74,0.05)", padding: "18px", marginBottom: "24px" }}>
              <p style={{ color: CREAM2, fontSize: "13.5px", lineHeight: 1.6, margin: 0 }}>
                <b style={{ color: EMBER }}>The honest part:</b> eight taps cannot measure a mind. This guess used{" "}
                {QUESTIONS.length} data points; the real assessment gives the panel <b style={{ color: CREAM }}>hours of your
                own spoken thinking</b> and maps all 32 lines with confidence intervals. If this teaser felt even half
                right, the full map will feel like being read out loud.
              </p>
            </div>

            <div className="flex gap-3 flex-wrap">
              <Link href="/assessment">
                <a className="px-5 py-3.5 rounded-lg font-bold" style={{ ...mono, fontSize: "12px", letterSpacing: "0.1em", textTransform: "uppercase", background: CHAMPAGNE, color: INK }}>
                  Take the real assessment — free for the first 10,000
                </a>
              </Link>
              <button onClick={shareResult} className="px-5 py-3.5 rounded-lg cursor-pointer" style={{ ...mono, fontSize: "12px", letterSpacing: "0.1em", textTransform: "uppercase", background: "transparent", color: JADE, border: `1px solid ${JADE}55` }}>
                Share my result
              </button>
              <button onClick={() => { setAnswers([]); setDone(false); }} className="px-4 py-3.5 cursor-pointer" style={{ ...mono, fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", background: "transparent", color: MUTED, border: 0 }}>
                Retake
              </button>
            </div>
          </div>
        )}
      </div>
      <PublicFooter />
    </div>
  );
}
