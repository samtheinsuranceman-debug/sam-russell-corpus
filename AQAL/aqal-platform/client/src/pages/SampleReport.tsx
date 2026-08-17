// ============================================================
// SAMPLE REPORT — a complete fictional report visitors can walk
// through before claiming. Loudly labeled: JORDAN IS NOT REAL.
// The format, the honesty mechanics, and the feel are exactly
// what a member receives; only the person is invented.
// ============================================================
import { Link } from "wouter";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";
import { ALL_AXES } from "@shared/axisModes";

const INK = "#141009";
const INK2 = "#1B1610";
const CREAM = "#F1EADB";
const CREAM2 = "#CFC5B0";
const MUTED = "#9C8F79";
const CHAMPAGNE = "#E0C68C";
const JADE = "#9BC0B2";
const EMBER = "#E2604A";
const LINE_C = "rgba(241,234,219,0.12)";
const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;
const serif = { fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 } as const;

// Jordan, 41 — a deliberately believable composite: strong strategist,
// starved interoception, financial line held hostage by volitional dips.
const SAMPLE_SCORES: Record<string, { v: number; err: number }> = {
  Logical: { v: 81, err: 3 }, Mathematical: { v: 72, err: 4 }, Spatial: { v: 64, err: 5 },
  Linguistic: { v: 84, err: 3 }, Volitional: { v: 52, err: 6 }, "Meta-Cognitive": { v: 76, err: 4 },
  Intrapersonal: { v: 61, err: 5 }, Reflective: { v: 69, err: 4 }, Existential: { v: 78, err: 4 },
  Philosophical: { v: 74, err: 5 }, Integrative: { v: 70, err: 5 }, Interpersonal: { v: 79, err: 3 },
  Empathic: { v: 73, err: 4 }, Intuitive: { v: 77, err: 5 }, Musical: { v: 41, err: 7 },
  Kinesthetic: { v: 55, err: 6 }, Naturalistic: { v: 48, err: 7 }, Strategic: { v: 88, err: 2 },
  Tactical: { v: 66, err: 5 }, Adaptive: { v: 71, err: 4 }, Resilient: { v: 68, err: 5 },
  Systematic: { v: 82, err: 3 }, Architectural: { v: 75, err: 4 }, Adversarial: { v: 80, err: 4 },
  Interoceptive: { v: 33, err: 8 }, Aesthetic: { v: 62, err: 5 }, Influence: { v: 83, err: 3 },
  Humor: { v: 74, err: 4 }, Parenting: { v: 0, err: 0 }, Seduction: { v: 0, err: 0 },
  "Community-Founding": { v: 0, err: 0 }, "Financial-Self-Management": { v: 0, err: 0 },
};

function SampleRadar() {
  const CX = 200, CY = 200, R_MAX = 150, R_MIN = 30;
  const axes = ALL_AXES.filter((a) => (SAMPLE_SCORES[a]?.v ?? 0) > 0);
  const n = axes.length;
  const pts = axes.map((a, i) => {
    const ang = (-90 + (i * 360) / n) * (Math.PI / 180);
    const r = R_MIN + (R_MAX - R_MIN) * ((SAMPLE_SCORES[a].v) / 100);
    return `${(CX + r * Math.cos(ang)).toFixed(1)},${(CY + r * Math.sin(ang)).toFixed(1)}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 400 400" className="w-full max-w-[380px] mx-auto block" role="img" aria-label="Sample member's 32-line radar">
      {[0.25, 0.5, 0.75, 1].map((g) => (
        <circle key={g} cx={CX} cy={CY} r={R_MIN + (R_MAX - R_MIN) * g} fill="none" stroke={CREAM} strokeOpacity="0.07" />
      ))}
      <polygon points={pts} fill="rgba(224,198,140,0.10)" stroke={CHAMPAGNE} strokeWidth="2" strokeLinejoin="round" />
      <text x={CX} y={CY - 6} textAnchor="middle" fill={CREAM} style={{ ...serif, fontSize: "26px" }}>71</text>
      <text x={CX} y={CY + 14} textAnchor="middle" fill={MUTED} style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em" }}>AGGREGATE · SAMPLE</text>
    </svg>
  );
}

export default function SampleReport() {
  const top = [["Strategic", 88, 2], ["Linguistic", 84, 3], ["Influence", 83, 3]] as const;
  return (
    <div className="min-h-screen" style={{ background: INK }}>
      <PublicHeader />
      {/* The banner that never leaves the screen */}
      <div className="sticky top-14 z-40 text-center py-2" style={{ background: EMBER, color: CREAM }}>
        <p style={{ ...mono, fontSize: "10.5px", letterSpacing: "0.18em", textTransform: "uppercase", margin: 0 }}>
          Sample report · &ldquo;Jordan&rdquo; is fictional · the format is exactly what you receive
        </p>
      </div>
      <div className="max-w-[860px] mx-auto px-6 py-14">
        <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.26em", textTransform: "uppercase", color: CHAMPAGNE, marginBottom: "12px" }}>
          What you actually get · walk the real format
        </p>
        <h1 style={{ ...serif, fontSize: "clamp(30px,5vw,46px)", lineHeight: 1.06, color: CREAM, margin: "0 0 12px" }}>
          Jordan, 41. Measured completely<br />for the first time in their life.
        </h1>
        <p style={{ color: CREAM2, fontSize: "15px", lineHeight: 1.65, maxWidth: "44em", marginBottom: "34px" }}>
          A composite member built to show you the machine: every section below — the map, the error bars, the Master
          Weakness, the prescriptions, the honest mechanics — renders for real members exactly this way, from their own
          spoken answers, scored by the 8-AI panel.
        </p>

        {/* The map */}
        <div className="rounded-2xl border p-7 mb-5" style={{ borderColor: LINE_C, background: INK2 }}>
          <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: CHAMPAGNE, marginBottom: "14px" }}>The shape of Jordan</p>
          <SampleRadar />
          <p style={{ ...mono, fontSize: "10px", color: MUTED, textAlign: "center", marginTop: "10px" }}>
            28 scored lines + 4 developmental stances (reported as stage bands, never percentiles)
          </p>
        </div>

        {/* Strengths with error bars */}
        <div className="rounded-2xl border p-7 mb-5" style={{ borderColor: LINE_C, background: INK2 }}>
          <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: JADE, marginBottom: "12px" }}>Strongest lines — with the panel's honesty attached</p>
          {top.map(([name, v, err]) => (
            <div key={name} className="flex items-center gap-3 mb-2">
              <span className="w-[130px] flex-none text-[14px]" style={{ color: CREAM }}>{name}</span>
              <div className="h-[6px] flex-1 rounded-full overflow-hidden" style={{ background: "rgba(241,234,219,0.08)" }}>
                <div className="h-full rounded-full" style={{ width: `${v}%`, background: JADE }} />
              </div>
              <span style={{ ...mono, fontSize: "13px", color: JADE }}>{v} <span style={{ color: MUTED }}>±{err}</span></span>
            </div>
          ))}
          <p style={{ fontSize: "13px", color: CREAM2, lineHeight: 1.6, marginTop: "10px" }}>
            The ±bars are real panel disagreement — tighter consensus, smaller bar. No other assessment shows you how sure it isn&rsquo;t.
          </p>
        </div>

        {/* Master Weakness */}
        <div className="rounded-2xl border p-7 mb-5" style={{ borderColor: `${EMBER}55`, background: "rgba(226,96,74,0.05)" }}>
          <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: EMBER, marginBottom: "10px" }}>The Master Weakness — the keystone holding the arch</p>
          <p style={{ ...serif, fontSize: "26px", color: CREAM, margin: "0 0 8px" }}>Interoceptive · 33 ±8</p>
          <p style={{ fontSize: "14px", color: CREAM2, lineHeight: 1.65, marginBottom: "12px" }}>
            Jordan cannot read their own body&rsquo;s signals — fatigue registers as laziness, stress as ambition, hunger as
            focus. The panel traced the volitional dips (52) and the stalled financial discipline to this line: you cannot
            regulate what you cannot detect. Attack the weaknesses at random and the system snaps back; lift this one and
            the cluster loosens.
          </p>
          <div className="flex gap-2 flex-wrap">
            {["Interoception training (body-scan protocol)", "Heartbeat-detection practice", "Aerobic exercise"].map((t) => (
              <span key={t} style={{ ...mono, fontSize: "10.5px", color: CHAMPAGNE, border: `1px solid ${CHAMPAGNE}44`, borderRadius: "999px", padding: "5px 12px" }}>{t}</span>
            ))}
          </div>
        </div>

        {/* Goals clock teaser */}
        <div className="rounded-2xl border p-7 mb-5" style={{ borderColor: LINE_C, background: INK2 }}>
          <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: CHAMPAGNE, marginBottom: "12px" }}>One of Jordan&rsquo;s goal clocks</p>
          <p style={{ ...serif, fontSize: "21px", color: CREAM, margin: "0 0 6px" }}>&ldquo;Own my consulting practice&rdquo;</p>
          <p style={{ fontSize: "14px", color: CREAM2, lineHeight: 1.6 }}>
            Baseline 30 months · logging 22h/month against a 35h floor →{" "}
            <b style={{ color: EMBER }}>at this pace: 4.1 years</b>. The clock responds to effort — 40 logged hours next
            month pulls it under 3. Honest clocks sting once; wasted decades sting forever.
          </p>
        </div>

        {/* The honesty mechanics strip */}
        <div className="grid sm:grid-cols-3 gap-3 mb-10">
          {[
            ["Mock-proof", "No AI keys connected → the platform says UNAVAILABLE. It never fakes a score."],
            ["Versioned norms", "Every report is stamped with its norming version and frozen — re-norms never silently rewrite you."],
            ["Crashes annotate", "The Black Box reads your history for pattern — it never lowers a score."],
          ].map(([t, d]) => (
            <div key={t} className="rounded-xl border p-4" style={{ borderColor: LINE_C }}>
              <p style={{ ...mono, fontSize: "9.5px", letterSpacing: "0.14em", textTransform: "uppercase", color: JADE, marginBottom: "5px" }}>{t}</p>
              <p style={{ fontSize: "12.5px", color: CREAM2, lineHeight: 1.55, margin: 0 }}>{d}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <p style={{ ...serif, fontSize: "clamp(22px,3.5vw,30px)", color: CREAM, marginBottom: "16px" }}>
            Jordan is invented. Your map won&rsquo;t be.
          </p>
          <Link href="/assessment">
            <a className="inline-block px-7 py-4 rounded-lg font-bold" style={{ ...mono, fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", background: CHAMPAGNE, color: INK }}>
              Claim yours — free for the first 10,000
            </a>
          </Link>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
