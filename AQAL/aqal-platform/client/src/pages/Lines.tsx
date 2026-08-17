// ============================================================
// THE 32 LINES — public glossary. Every line: what it is, how we
// score it, whether it's independent of g, its keystone practice,
// and its top evidence-backed protocols. SEO surface + the answer
// to every "what's Interoceptive?" question, in one place.
// ============================================================
import { useState } from "react";
import { Link } from "wouter";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";
import { ALL_AXES, axisMode, axisIndep, MODE_META } from "@shared/axisModes";
import { keystoneForLine } from "@shared/keystonePractices";
import { therapiesForLine, THERAPY_THIN_LINES } from "@shared/therapyLineMap";

const INK = "#141009";
const CREAM = "#F1EADB";
const CREAM2 = "#CFC5B0";
const MUTED = "#9C8F79";
const CHAMPAGNE = "#E0C68C";
const JADE = "#9BC0B2";
const LINE_C = "rgba(241,234,219,0.10)";

// One honest sentence per engine line.
const LINE_BLURBS: Record<string, string> = {
  Logical: "Formal inference — spotting contradictions, following an argument under load, knowing what follows from what.",
  Mathematical: "Quantitative reasoning — fluency with numbers, proportions, and symbolic systems in real decisions.",
  Spatial: "Holding shapes and systems in the mind's eye — rotation, navigation, seeing the whole layout at once.",
  Linguistic: "Range, precision, and generativity in language — saying exactly what you mean, and no less.",
  Volitional: "Sustained will — starting, continuing, and finishing under friction. Independent of IQ.",
  "Meta-Cognitive": "Knowing what you know and don't — catching your own thinking mid-flight and correcting it.",
  Intrapersonal: "Accuracy of the self-model — how well your story about yourself matches the person acting.",
  Reflective: "Learning from your own past — turning experience into revised behavior instead of repeated behavior.",
  Existential: "Working seriously with meaning, mortality, and what any of it is for.",
  Philosophical: "Epistemic cognition — reasoning through ill-structured questions where no answer key exists.",
  Integrative: "Holding multiple frames at once and synthesizing them into something none contained alone.",
  Interpersonal: "Modeling other minds — reading what people want, fear, and intend, and moving with it.",
  Empathic: "Feeling with another person accurately — resonance that lands as understood, not performed.",
  Intuitive: "Fast pattern recognition below awareness — the trained hunch that arrives before the analysis. Independent of IQ.",
  Musical: "Pitch, rhythm, and phrasing — structure heard in sound. Mostly independent of IQ.",
  Kinesthetic: "Trained control of the body toward a skilled end — a separate factor from cognitive ability.",
  Naturalistic: "Reading living systems — fine distinctions in plants, animals, weather, and land.",
  Strategic: "Multi-move sequencing toward an end nobody can see yet.",
  Tactical: "Action regulation — initiating and shielding execution when the plan meets the day.",
  Adaptive: "Psychological flexibility — changing course without losing the thread. Independent of IQ.",
  Resilient: "Stress recovery — how fast you return to baseline after a hit. Tracks stability, not IQ.",
  Systematic: "Seeing wholes, loops, and second-order effects — what happens after what happens.",
  Architectural: "Complex problem solving — exploring and controlling multi-variable dynamic systems.",
  Adversarial: "Performance against an opponent trying to beat you — strategy under opposition. Independent of IQ.",
  Interoceptive: "Fidelity of the inward signal — reading your own body's data accurately. Independent of IQ.",
  Aesthetic: "Discernment of form — what makes a thing land. Tracks Openness, not IQ.",
  Influence: "Moving a listener from one position to another — persuasion as a trainable craft.",
  Humor: "State-change capacity — shifting a room at will. Style is independent of IQ.",
  Parenting: "Developmental altitude expressed in raising a person — mentalizing the child as a mind.",
  Seduction: "Relational draw severed from appearance — initiating and deepening romantic connection.",
  "Community-Founding": "Bringing a durable group into being around a shared frame.",
  "Financial-Self-Management": "Conative money sense — the behaviors that compound or destroy wealth, largely independent of IQ.",
};

export default function Lines() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="min-h-screen" style={{ background: INK }}>
      <PublicHeader />
      <div className="max-w-[900px] mx-auto px-6 py-16">
        <p className="font-mono text-[10px] tracking-[0.26em] uppercase mb-3" style={{ color: CHAMPAGNE }}>
          The glossary · all thirty-two, defined
        </p>
        <h1 className="text-5xl mb-4" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, color: CREAM }}>
          The 32 Lines
        </h1>
        <p className="text-[15px] mb-3 max-w-[46em]" style={{ color: CREAM2, lineHeight: 1.65 }}>
          Every line we measure, in plain language: what it is, how it&rsquo;s scored, whether the research shows it&rsquo;s
          independent of IQ, and the practice and protocols that move it. Lines marked{" "}
          <span style={{ color: CHAMPAGNE }}>◇ independent</span> carry almost no correlation with g in published studies —
          an IQ score tells you nothing about them.
        </p>
        <p className="font-mono text-[10.5px] mb-10" style={{ color: MUTED }}>
          Tap any line to expand it. Then <Link href="/assessment"><a style={{ color: CHAMPAGNE }}>measure yours</a></Link>.
        </p>

        <div className="space-y-2">
          {ALL_AXES.map((line) => {
            const mode = axisMode(line);
            const meta = (MODE_META as any)[mode];
            const indep = axisIndep(line);
            const isOpen = open === line;
            const keystone = keystoneForLine(line);
            const therapies = therapiesForLine(line, 3);
            const thin = THERAPY_THIN_LINES.includes(line);
            return (
              <div key={line} className="rounded-xl border transition-colors cursor-pointer"
                style={{ borderColor: isOpen ? `${CHAMPAGNE}55` : LINE_C, background: isOpen ? "rgba(224,198,140,0.04)" : "transparent" }}
                onClick={() => setOpen(isOpen ? null : line)}>
                <div className="flex items-baseline gap-3 px-5 py-3.5 flex-wrap">
                  <span className="text-[19px]" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, color: CREAM }}>
                    {indep && <span style={{ color: CHAMPAGNE }}>◇ </span>}{line}
                  </span>
                  <span className="font-mono text-[9.5px] uppercase tracking-[0.14em]" style={{ color: meta?.color ?? MUTED }}>
                    {mode}
                  </span>
                  {indep && <span className="font-mono text-[9.5px] uppercase tracking-[0.1em]" style={{ color: CHAMPAGNE }}>independent of g</span>}
                  <span className="ml-auto font-mono text-[12px]" style={{ color: MUTED }}>{isOpen ? "−" : "+"}</span>
                </div>
                {isOpen && (
                  <div className="px-5 pb-5">
                    <p className="text-[14.5px] mb-4" style={{ color: CREAM2, lineHeight: 1.65 }}>{LINE_BLURBS[line] ?? ""}</p>
                    {keystone && (
                      <p className="text-[13px] mb-2" style={{ color: CREAM2 }}>
                        <span style={{ color: JADE, fontWeight: 600 }}>Keystone practice: </span>
                        {keystone.name} — {keystone.prescription}
                      </p>
                    )}
                    {therapies.length > 0 && (
                      <p className="text-[13px] mb-2" style={{ color: CREAM2 }}>
                        <span style={{ color: CHAMPAGNE, fontWeight: 600 }}>Evidence-backed protocols: </span>
                        {therapies.map((t) => t.therapy).join(" · ")}
                      </p>
                    )}
                    {thin && (
                      <p className="font-mono text-[10.5px]" style={{ color: MUTED }}>
                        Honesty note: the intervention evidence for this line is thinner than most — flagged in our open citation audit.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Link href="/assessment">
            <a className="inline-block px-6 py-3.5 rounded-lg font-mono text-[12px] uppercase tracking-[0.12em] font-bold"
              style={{ background: CHAMPAGNE, color: INK }}>
              Measure all 32 of yours
            </a>
          </Link>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
