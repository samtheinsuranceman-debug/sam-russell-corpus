import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";

/**
 * AQAL Intelligence Platform — The Weakness-Finder
 * Adapted from Claude's self-contained mockup into the platform's design system.
 * 
 * Signature element: the System Integrity meter. Integrity is the GEOMETRIC MEAN
 * of the eight lines — the honest O-ring math — so one line near zero collapses
 * the whole readout no matter how strong the rest are.
 */

/* ─── Palette (matches platform Atelier tokens) ─── */
const T = {
  ink: "#141009",
  panel: "#1B1610",
  panel2: "#221B12",
  champagne: "#E0C68C",
  champagneDim: "#B9A57A",
  gold: "#C9A96B",
  text: "#ECE5D5",
  muted: "#8B8172",
  faint: "#5C544733",
  risk: "#C85C44",
  riskDeep: "#7A3B32",
  rule: "rgba(224,198,140,0.14)",
};

const LINES = [
  { key: "strategic", label: "Strategic" },
  { key: "rhetorical", label: "Rhetorical" },
  { key: "financial", label: "Financial" },
  { key: "volitional", label: "Volitional" },
  { key: "meta", label: "Meta-Cognitive" },
  { key: "emotional", label: "Emotional" },
  { key: "interpersonal", label: "Interpersonal" },
  { key: "interoceptive", label: "Interoceptive" },
];

const PRESETS: Record<string, { label: string; [key: string]: number | string }> = {
  balanced: { label: "All lines holding", strategic: 82, rhetorical: 80, financial: 84, volitional: 81, meta: 83, emotional: 80, interpersonal: 82, interoceptive: 79 },
  founder: { label: "The Confident Founder", strategic: 90, rhetorical: 72, financial: 21, volitional: 29, meta: 26, emotional: 54, interpersonal: 52, interoceptive: 36 },
  isolated: { label: "The Isolated Achiever", strategic: 91, rhetorical: 66, financial: 86, volitional: 76, meta: 71, emotional: 28, interpersonal: 19, interoceptive: 44 },
};

const RISK = 30;

function mean(vals: number[]) {
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}
function geoMean(vals: number[]) {
  if (vals.some((v) => v <= 0)) return 0;
  const logSum = vals.reduce((a, b) => a + Math.log(b / 100), 0);
  return Math.exp(logSum / vals.length) * 100;
}

const font = {
  display: "'Cormorant Garamond', Georgia, serif",
  body: "'Inter', system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
};

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) { setShown(true); return; }
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setShown(true); },
      { threshold: 0.18 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, shown] as const;
}

/* ─── System Integrity Meter ─── */
function IntegrityMeter() {
  const [vals, setVals] = useState<Record<string, number | string>>({ ...PRESETS.balanced });
  const [mode, setMode] = useState<"multiplicative" | "additive">("multiplicative");
  const arr = LINES.map((l) => vals[l.key] as number);
  const avg = Math.round(mean(arr));
  const integ = Math.round(geoMean(arr));
  const shown = mode === "multiplicative" ? integ : avg;

  const lowest = LINES.reduce(
    (lo, l) => ((vals[l.key] as number) < lo.v ? { label: l.label, v: vals[l.key] as number } : lo),
    { label: "", v: 101 }
  );
  const exposed = LINES.filter((l) => (vals[l.key] as number) <= RISK);

  const set = (k: string, v: string) => setVals((s) => ({ ...s, [k]: Number(v) }));

  const integColor = integ >= 60 ? T.champagne : integ >= 35 ? "#D9A24E" : T.risk;
  const caption =
    exposed.length === 0
      ? "Every line is holding. Drag any single line toward zero — or load a profile below — and watch what one unguarded gap does to the whole."
      : `One line — ${lowest.label} at ${lowest.v} — pulls your System Integrity down to ${integ}, even though your average across all eight still reads ${avg}. The strong lines cannot buy the weak one back.`;

  return (
    <div style={{ background: T.panel, border: `1px solid ${T.rule}`, borderRadius: 14, padding: "26px 24px 22px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: "0.22em", color: T.muted, textTransform: "uppercase" }}>
            {mode === "multiplicative" ? "System integrity · geometric" : "Simple average · the myth"}
          </div>
          <div style={{ fontFamily: font.mono, fontWeight: 700, fontSize: 66, lineHeight: 1, color: integColor, transition: "color .3s" }}>
            {String(shown).padStart(2, "0")}
            <span style={{ fontSize: 22, color: T.muted }}> / 100</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, background: T.ink, borderRadius: 999, padding: 4 }}>
          {([["multiplicative", "Reality"], ["additive", "The myth"]] as const).map(([m, lbl]) => (
            <button key={m} onClick={() => setMode(m as "multiplicative" | "additive")}
              style={{
                fontFamily: font.body, fontSize: 12, fontWeight: 600, letterSpacing: "0.04em",
                padding: "7px 14px", borderRadius: 999, border: "none", cursor: "pointer",
                color: mode === m ? T.ink : T.champagneDim,
                background: mode === m ? T.champagne : "transparent", transition: "all .2s",
              }}>
              {lbl}
            </button>
          ))}
        </div>
      </div>

      {/* bars */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 11 }}>
        {LINES.map((l) => {
          const v = vals[l.key] as number;
          const low = v <= RISK;
          return (
            <div key={l.key} style={{ display: "grid", gridTemplateColumns: "112px 1fr 34px", alignItems: "center", gap: 12 }}>
              <label htmlFor={`wf-${l.key}`} style={{ fontFamily: font.body, fontSize: 12.5, color: low ? T.risk : T.text, fontWeight: low ? 600 : 400, transition: "color .2s" }}>
                {l.label}
              </label>
              <div style={{ position: "relative", height: 8, borderRadius: 6, overflow: "visible" }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: 6, background: "#2A2217" }} />
                <div style={{ position: "absolute", top: 0, left: 0, height: 8, width: `${v}%`, borderRadius: 6,
                  background: low ? T.risk : `linear-gradient(90deg, ${T.gold}, ${T.champagne})`, transition: "width .08s linear, background .2s" }} />
                <input id={`wf-${l.key}`} className="wf-range" type="range" min="0" max="100" value={v}
                  onChange={(e) => set(l.key, e.target.value)}
                  style={{ position: "absolute", top: -6, left: 0, width: "100%", margin: 0 }} />
              </div>
              <span style={{ fontFamily: font.mono, fontSize: 12, color: low ? T.risk : T.muted, textAlign: "right" }}>{v}</span>
            </div>
          );
        })}
      </div>

      {/* presets */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 20 }}>
        <span style={{ fontFamily: font.mono, fontSize: 10, letterSpacing: "0.18em", color: T.muted, textTransform: "uppercase", alignSelf: "center", marginRight: 2 }}>Load a profile</span>
        {Object.entries(PRESETS).map(([k, p]) => (
          <button key={k} onClick={() => setVals({ ...p })}
            style={{ fontFamily: font.body, fontSize: 12, color: T.champagneDim, background: T.ink,
              border: `1px solid ${T.rule}`, borderRadius: 999, padding: "6px 13px", cursor: "pointer" }}>
            {p.label as string}
          </button>
        ))}
      </div>

      <p style={{ fontFamily: font.body, fontSize: 13.5, lineHeight: 1.6, color: exposed.length ? T.text : T.muted, margin: "18px 2px 0", minHeight: 44 }}>
        {caption}
      </p>
    </div>
  );
}

/* ─── Radar Profile ─── */
function RadarProfile() {
  const data = [
    { label: "Logical", v: 88 }, { label: "Strategic", v: 84 }, { label: "Rhetorical", v: 79 },
    { label: "Creative", v: 86 }, { label: "Financial", v: 18 }, { label: "Emotional", v: 72 },
    { label: "Systemic", v: 81 }, { label: "Leadership", v: 77 },
  ];
  const size = 300, c = size / 2, R = 112;
  const pt = (i: number, r: number) => {
    const a = (Math.PI * 2 * i) / data.length - Math.PI / 2;
    return [c + Math.cos(a) * r, c + Math.sin(a) * r];
  };
  const poly = data.map((d, i) => pt(i, (d.v / 100) * R).join(",")).join(" ");
  const weakIdx = data.findIndex((d) => d.v <= RISK);
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ maxWidth: 340, display: "block", margin: "0 auto" }} role="img" aria-label="Radar profile with a single collapsed line">
      {[0.25, 0.5, 0.75, 1].map((f, i) => (
        <polygon key={i}
          points={data.map((_, j) => pt(j, R * f).join(",")).join(" ")}
          fill="none" stroke={T.rule} strokeWidth="1" />
      ))}
      {data.map((_, i) => {
        const [x, y] = pt(i, R);
        return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke={T.rule} strokeWidth="1" />;
      })}
      <polygon points={poly} fill="rgba(224,198,140,0.13)" stroke={T.champagne} strokeWidth="1.5" />
      {data.map((d, i) => {
        const [x, y] = pt(i, (d.v / 100) * R);
        const low = d.v <= RISK;
        return <circle key={i} cx={x} cy={y} r={low ? 4.5 : 2.6} fill={low ? T.risk : T.champagne} />;
      })}
      {data.map((d, i) => {
        const [x, y] = pt(i, R + 20);
        const low = d.v <= RISK;
        return (
          <text key={i} x={x} y={y} fill={low ? T.risk : T.muted}
            fontFamily={font.mono} fontSize="9" fontWeight={low ? 700 : 400}
            textAnchor={Math.abs(x - c) < 8 ? "middle" : x > c ? "start" : "end"}
            dominantBaseline="middle">{d.label}</text>
        );
      })}
      {weakIdx >= 0 && (() => {
        const [x, y] = pt(weakIdx, R + 40);
        return <text x={x} y={y} fill={T.risk} fontFamily={font.mono} fontSize="8.5" textAnchor="middle">the gap</text>;
      })()}
    </svg>
  );
}

/* ─── Cluster Gallery ─── */
const CLUSTERS = [
  // ENTREPRENEURSHIP & BUSINESS
  { domain: "Business", title: "The confident founder who bets the company",
    strong: ["Entrepreneurial", "Mathematical"], weak: ["Financial", "Volitional", "Meta-Cognitive"],
    collapse: "Conviction pours into escalating, poorly-modeled bets the founder can\u2019t emotionally exit. The strength becomes the mechanism of ruin." },
  { domain: "Business", title: "The brilliant product nobody buys",
    strong: ["Creative", "Strategic"], weak: ["Rhetorical", "Interpersonal"],
    collapse: "Dies at the one task those lines own \u2014 persuading a customer, an investor, or a first hire to say yes." },
  { domain: "Business", title: "The founder who can\u2019t forecast or endure",
    strong: ["Cognitive", "Systemic"], weak: ["Meta-Cognitive", "Volitional"],
    collapse: "Rosy projections meet an inability to persist through the trough. The runway ends before reality is priced in." },
  { domain: "Business", title: "The technical genius who can\u2019t hold a team",
    strong: ["Technical", "Logical"], weak: ["Emotional", "Interpersonal"],
    collapse: "A venture is a multi-person O-ring system. The co-founder relationship or the early team fractures, and the company implodes socially rather than technically." },
  { domain: "Business", title: "The operator who burns down the operator",
    strong: ["Entrepreneurial", "Financial"], weak: ["Interoceptive", "Volitional"],
    collapse: "Under sustained stress the person \u2014 not the business model \u2014 fails: burnout, health collapse, or reliance on stimulants to keep going. Self-regulation is a system-level line." },
  // MARRIAGE & PARTNERSHIP
  { domain: "Marriage", title: "Two sharp minds, both poor with money",
    strong: ["Cognitive", "Cognitive"], weak: ["Financial", "Financial"],
    collapse: "Financial disagreement is the single strongest disagreement-type predictor of divorce \u2014 and the most changeable of the major threats." },
  { domain: "Marriage", title: "The forecastable divorce",
    strong: ["Achievement", "Achievement"], weak: ["Emotional", "Repair-Communication"],
    collapse: "Interaction markers predict dissolution years in advance. Shared intelligence doesn\u2019t offset a corrosive pattern." },
  { domain: "Marriage", title: "Smart parents, failing as a unit",
    strong: ["Cognitive", "Professional"], weak: ["Parental", "Interpersonal"],
    collapse: "High Cognitive couple with children, but BOTH low Parental and low Meta-Cognitive. Neither can co-regulate or adapt; child stress and marital strain compound each other." },
  { domain: "Marriage", title: "Charm without commitment",
    strong: ["Interpersonal", "Seductive"], weak: ["Moral", "Volitional"],
    collapse: "The relationship carries elevated infidelity risk \u2014 a recurring \u2018final straw\u2019 in divorce accounts." },
  { domain: "Marriage", title: "Matched interests, no repair",
    strong: ["Intellectual", "Compatible"], weak: ["Emotional", "Communication"],
    collapse: "The bond erodes through accumulated unrepaired ruptures despite genuine compatibility." },
  // PARENTING
  { domain: "Parenting", title: "The unreachable high-achiever parent",
    strong: ["Cognitive", "Strategic"], weak: ["Emotional", "Interpersonal"],
    collapse: "The child\u2019s emotional needs go unmet; the cost shows up in attachment and behavior, not report cards." },
  { domain: "Parenting", title: "The parent who can\u2019t regulate the parent",
    strong: ["Cognitive", "Professional"], weak: ["Meta-Cognitive", "Emotional"],
    collapse: "Own frustration goes unmanaged, producing harsh reactive cycles the parent later regrets but repeats." },
  { domain: "Parenting", title: "Two capable parents, one broken seam",
    strong: ["Individual Competence", "Individual Competence"], weak: ["Co-Parenting Alignment", "Communication"],
    collapse: "Mixed signals and undercutting set the outcome \u2014 the weakest link in the parenting system, not the strongest parent, governs the result." },
  // RETIREMENT, AGING & LATE LIFE
  { domain: "Retirement", title: "The big house with no one in it",
    strong: ["Financial", "Strategic"], weak: ["Interpersonal", "Emotional"],
    collapse: "Materially comfortable, socially isolated for the last decades. Isolation is itself a health risk, not merely a sadness." },
  { domain: "Retirement", title: "The mind that ignores the body",
    strong: ["Cognitive", "Achievement"], weak: ["Interoceptive", "Bodily"],
    collapse: "Early or subtle symptoms are dismissed or unnoticed, so care is sought later and outcomes are worse. Better bodily awareness prompts earlier medical attention." },
  { domain: "Retirement", title: "Wealth without decumulation discipline",
    strong: ["Financial Accumulation", "Lifetime Achievement"], weak: ["Financial-Behavioral", "Meta-Cognitive"],
    collapse: "Overspending or heightened fraud vulnerability erodes a fortune exactly when it can no longer be rebuilt." },
  { domain: "Retirement", title: "The late divorce that erases the retirement",
    strong: ["Financial", "Relational"], weak: ["Emotional", "Communication"],
    collapse: "A financial + relational weakness cluster realized at the worst moment: \u2018gray divorce\u2019 after 50 cuts wealth by roughly half for both spouses. Timing turns an ordinary cluster into a catastrophe." },
  // MEANING, PURPOSE & RELATIONSHIPS
  { domain: "Meaning", title: "Everything except a reason",
    strong: ["Cognitive", "Financial"], weak: ["Existential", "Intrapersonal"],
    collapse: "External achievement without internal meaning \u2014 the well-resourced midlife collapse into anhedonia or crisis." },
  { domain: "Meaning", title: "The career that cost the connections",
    strong: ["Strategic", "Career"], weak: ["Relational", "Interpersonal"],
    collapse: "Status arrives; the people who would have made it matter have drifted away." },
  // INTEGRITY, COMPETITION & SELF-REGULATION
  { domain: "Integrity", title: "Self-regulation as the master seam",
    strong: ["Cognitive", "Multiple Lines"], weak: ["Interoceptive", "Volitional"],
    collapse: "A single self-regulation failure \u2014 around a substance, a compulsion, or health \u2014 can collapse the whole system regardless of intellect. The decades-long self-control evidence makes this the most under-rated cluster of all." },
  { domain: "Integrity", title: "Persuasion without integrity",
    strong: ["Rhetorical", "Influence"], weak: ["Moral", "Ethical"],
    collapse: "The capacity to move people, uncoupled from principle, ends in reputational or legal collapse \u2014 fraud, scandal, ruin." },
  { domain: "Integrity", title: "The winner with no allies",
    strong: ["Adversarial", "Competitive"], weak: ["Interpersonal", "Emotional"],
    collapse: "Wins the fights, loses the coalition \u2014 isolated, then outmaneuvered by people who were merely better connected." },
];

function Chip({ label, risk }: { label: string; risk?: boolean }) {
  return (
    <span style={{
      fontFamily: font.mono, fontSize: 10.5, letterSpacing: "0.02em",
      padding: "3px 9px", borderRadius: 999,
      color: risk ? T.risk : T.champagneDim,
      background: risk ? "rgba(200,92,68,0.09)" : "rgba(224,198,140,0.07)",
      border: `1px solid ${risk ? "rgba(200,92,68,0.32)" : T.rule}`,
    }}>{label}</span>
  );
}

function ClusterCard({ c, i }: { c: typeof CLUSTERS[number]; i: number }) {
  const [ref, shown] = useReveal();
  return (
    <div ref={ref} style={{
      background: T.panel, border: `1px solid ${T.rule}`, borderRadius: 12, padding: "20px 20px 22px",
      opacity: shown ? 1 : 0, transform: shown ? "translateY(0)" : "translateY(16px)",
      transition: `opacity .6s ${i * 60}ms, transform .6s ${i * 60}ms`,
    }}>
      <div style={{ fontFamily: font.mono, fontSize: 9.5, letterSpacing: "0.22em", color: T.muted, textTransform: "uppercase", marginBottom: 9 }}>{c.domain}</div>
      <h3 style={{ fontFamily: font.display, fontWeight: 600, fontSize: 22, lineHeight: 1.15, color: T.text, margin: "0 0 14px" }}>{c.title}</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
        {c.strong.map((s, k) => <Chip key={k} label={"\u25B2 " + s} />)}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        {c.weak.map((w, k) => <Chip key={k} label={"\u25BC " + w} risk />)}
      </div>
      <p style={{ fontFamily: font.body, fontSize: 13, lineHeight: 1.55, color: T.muted, margin: 0 }}>{c.collapse}</p>
    </div>
  );
}

/* ─── Shield Pathway ─── */
const STEPS = [
  { n: "01", verb: "Identify", body: "Measure it from the outside \u2014 self-perception is built to miss your weakest lines." },
  { n: "02", verb: "Shield", body: "Put structures around the gap so a bad day can\u2019t become a catastrophe." },
  { n: "03", verb: "Bolster", body: "Train the line. These competencies respond to deliberate work \u2014 weakness isn\u2019t destiny." },
  { n: "04", verb: "Insure", body: "Arrange the financial, legal, and relational protections that cap the downside." },
  { n: "05", verb: "Build in", body: "Design the venture, the marriage, the retirement around the known gap \u2014 not around a pretense it isn\u2019t there." },
];

function Section({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <section style={{ maxWidth: 1080, margin: "0 auto", padding: "0 24px", ...style }}>{children}</section>;
}
function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div style={{ fontFamily: font.mono, fontSize: 10.5, letterSpacing: "0.28em", color: T.champagneDim, textTransform: "uppercase", marginBottom: 14 }}>{children}</div>;
}

/* ─── Main Page Component ─── */
export default function WeaknessFinder() {
  const [g1, s1] = useReveal();
  return (
    <div style={{ background: T.ink, color: T.text, fontFamily: font.body, minHeight: "100vh" }}>
      <style>{`
        .wf-range { -webkit-appearance: none; appearance: none; background: transparent; height: 20px; cursor: pointer; }
        .wf-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; border-radius: 50%; background: ${T.champagne}; border: 2px solid ${T.ink}; box-shadow: 0 0 0 1px ${T.rule}; cursor: grab; }
        .wf-range::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: ${T.champagne}; border: 2px solid ${T.ink}; cursor: grab; }
        .wf-range:focus-visible::-webkit-slider-thumb { outline: 2px solid ${T.champagne}; outline-offset: 2px; }
        a.wf-cite { color: ${T.champagneDim}; text-decoration: underline; text-underline-offset: 2px; }
        a.wf-cite:hover { color: ${T.champagne}; }
        @media (prefers-reduced-motion: reduce) { .wf-range, .wf-range * { transition: none !important; animation: none !important; } }
      `}</style>

      {/* Nav */}
      <div style={{ borderBottom: `1px solid ${T.rule}` }}>
        <Section style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px" }}>
          <Link href="/">
            <span style={{ fontFamily: font.display, fontWeight: 700, fontSize: 20, color: T.champagne, letterSpacing: "0.01em", cursor: "pointer" }}>AQAL</span>
          </Link>
          <span style={{ fontFamily: font.mono, fontSize: 11, letterSpacing: "0.2em", color: T.muted, textTransform: "uppercase" }}>The Weakness-Finder</span>
        </Section>
      </div>

      {/* Hero — thesis + signature interaction */}
      <Section style={{ paddingTop: 64, paddingBottom: 40 }}>
        <div ref={g1} style={{ opacity: s1 ? 1 : 0, transform: s1 ? "none" : "translateY(14px)", transition: "opacity .7s, transform .7s" }}>
          <Eyebrow>The other half of the map</Eyebrow>
          <h1 style={{ fontFamily: font.display, fontWeight: 700, fontSize: "clamp(34px, 5.4vw, 58px)", lineHeight: 1.04, letterSpacing: "-0.01em", margin: "0 0 20px", color: T.text }}>
            Your strengths show you where to aim.<br />
            <span style={{ color: T.champagne }}>Your weaknesses show you where you can break.</span>
          </h1>
          <p style={{ fontSize: 16.5, lineHeight: 1.62, color: T.muted, maxWidth: 620, margin: "0 0 8px" }}>
            Real performance isn't a sum of your intelligences — it's a product. A career, a company, a marriage, a retirement is a chain of tasks that depend on each other, and when the terms multiply, one line near zero drags the whole result toward zero. No matter how strong everything else is.
          </p>
        </div>
        <div style={{ marginTop: 30 }}>
          <IntegrityMeter />
          <p style={{ fontFamily: font.body, fontSize: 12, color: T.muted, margin: "12px 4px 0", lineHeight: 1.5 }}>
            System Integrity is the geometric mean of your lines — the same multiplicative logic behind the O-ring theory of complex-system failure. Toggle to <em>The myth</em> to see how a simple average hides the exact gap that can sink you.
          </p>
        </div>
      </Section>

      {/* Hidden weakness */}
      <div style={{ borderTop: `1px solid ${T.rule}`, background: T.panel2 }}>
        <Section style={{ paddingTop: 56, paddingBottom: 56 }}>
          <div className="wf-grid" style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 40, alignItems: "center" }}>
            <div>
              <Eyebrow>Why it stays hidden</Eyebrow>
              <h2 style={{ fontFamily: font.display, fontWeight: 600, fontSize: "clamp(26px,3.6vw,38px)", lineHeight: 1.12, margin: "0 0 16px" }}>
                The lines you're weakest on are the ones you can't see.
              </h2>
              <p style={{ fontSize: 15, lineHeight: 1.62, color: T.muted, margin: "0 0 14px" }}>
                The skill it takes to perform in a domain is the same skill it takes to judge your performance in it. So the less capable you are on a line, the less equipped you are to notice — the weakest performers consistently overestimate themselves the most.
              </p>
              <p style={{ fontSize: 15, lineHeight: 1.62, color: T.muted, margin: 0 }}>
                This is why weakness clusters go unshielded: you are structurally blind to them. Below is a profile that looks formidable on average — and carries one collapsed line its owner almost certainly can't feel.
              </p>
            </div>
            <div>
              <RadarProfile />
            </div>
          </div>
        </Section>
      </div>

      {/* Cluster gallery */}
      <Section style={{ paddingTop: 60, paddingBottom: 30 }}>
        <Eyebrow>Twenty-two ways a strong profile still collapses</Eyebrow>
        <h2 style={{ fontFamily: font.display, fontWeight: 600, fontSize: "clamp(26px,3.6vw,38px)", lineHeight: 1.12, margin: "0 0 8px", maxWidth: 760 }}>
          Each of these people has real strengths. In every case, the strength isn't enough — and sometimes it's the very thing that breaks them.
        </h2>
        <p style={{ fontSize: 14, color: T.muted, margin: "0 0 34px" }}>{"\u25B2"} strong lines · {"\u25BC"} the unguarded gap</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {CLUSTERS.map((c, i) => <ClusterCard key={i} c={c} i={i} />)}
        </div>
      </Section>

      {/* Shield pathway */}
      <div style={{ borderTop: `1px solid ${T.rule}`, background: T.panel2, marginTop: 40 }}>
        <Section style={{ paddingTop: 60, paddingBottom: 60 }}>
          <Eyebrow>What we do with a gap once we find it</Eyebrow>
          <h2 style={{ fontFamily: font.display, fontWeight: 600, fontSize: "clamp(26px,3.6vw,38px)", lineHeight: 1.12, margin: "0 0 34px", maxWidth: 720 }}>
            A weakness identified is a weakness you can shield, rebuild, insure against, and design around.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(178px, 1fr))", gap: 0, borderLeft: `1px solid ${T.rule}` }}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ padding: "4px 20px 8px", borderRight: `1px solid ${T.rule}` }}>
                <div style={{ fontFamily: font.mono, fontSize: 12, color: T.champagne, marginBottom: 10 }}>{s.n}</div>
                <div style={{ fontFamily: font.display, fontWeight: 600, fontSize: 21, color: T.text, marginBottom: 8 }}>{s.verb}</div>
                <p style={{ fontSize: 12.5, lineHeight: 1.5, color: T.muted, margin: 0 }}>{s.body}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 30, padding: "18px 20px", background: T.panel, border: `1px solid ${T.rule}`, borderRadius: 12 }}>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: T.text, margin: 0 }}>
              <span style={{ color: T.champagne, fontWeight: 600 }}>The shield can be another person.</span> Because performance multiplies, a partner or advisor whose strong line covers your near-zero line lifts the entire result. Your weakness map is also a precise specification of the help worth recruiting — which is exactly what complementary matching is for.
            </p>
          </div>
        </Section>
      </div>

      {/* Evidence & trainability link */}
      <div style={{ borderTop: `1px solid ${T.rule}` }}>
        <Section style={{ paddingTop: 48, paddingBottom: 20 }}>
          <Eyebrow>The evidence that weakness lines are trainable</Eyebrow>
          <p style={{ fontSize: 15, lineHeight: 1.64, color: T.muted, maxWidth: 760, margin: "0 0 14px" }}>
            The same lines that create collapse risk respond to structured intervention. Our{" "}
            <Link href="/research-library?section=trainability" style={{ color: T.champagne, textDecoration: "underline", textUnderlineOffset: 2 }}>
              Trainability Evidence library
            </Link>{" "}
            documents the peer-reviewed trials — 22 sources across 19 intelligence domains — showing permanent gains from targeted training. Weakness is not destiny; it is a starting point.
          </p>
        </Section>
      </div>

      {/* Honest footer */}
      <div style={{ borderTop: `1px solid ${T.rule}` }}>
        <Section style={{ paddingTop: 48, paddingBottom: 56 }}>
          <Eyebrow>What this is — and what it isn't</Eyebrow>
          <p style={{ fontSize: 15, lineHeight: 1.64, color: T.muted, maxWidth: 760, margin: "0 0 14px" }}>
            The Weakness-Finder measures <span style={{ color: T.text }}>changeable risk factors with real predictive weight</span> — not destinies. It is not a divorce oracle, not a life-outcome oracle, and it makes no medical or disease-prediction claims. It reports on the person in front of it, never on a partner who hasn't been assessed. Every figure here is a risk factor, stated as one.
          </p>
          <p style={{ fontSize: 13, lineHeight: 1.7, color: T.muted, maxWidth: 820, margin: "18px 0 0" }}>
            Grounded in:{" "}
            <a className="wf-cite" href="https://doi.org/10.2307/2118400" target="_blank" rel="noopener noreferrer">Kremer, O-ring theory (QJE, 1993)</a>{" · "}
            <a className="wf-cite" href="https://doi.org/10.1037/0022-3514.77.6.1121" target="_blank" rel="noopener noreferrer">Kruger &amp; Dunning (JPSP, 1999)</a>{" · "}
            <a className="wf-cite" href="https://doi.org/10.1073/pnas.1010076108" target="_blank" rel="noopener noreferrer">Moffitt et al., self-control gradient (PNAS, 2011)</a>{" · "}
            <a className="wf-cite" href="https://doi.org/10.1111/j.1741-3729.2012.00715.x" target="_blank" rel="noopener noreferrer">Dew, Britt &amp; Huston, financial conflict &amp; divorce (2012)</a>{" · "}
            <a className="wf-cite" href="https://doi.org/10.1111/j.1741-3737.2000.00737.x" target="_blank" rel="noopener noreferrer">Gottman &amp; Levenson, timing of divorce (2000)</a>{" · "}
            <a className="wf-cite" href="https://doi.org/10.1111/j.1467-9280.2005.01641.x" target="_blank" rel="noopener noreferrer">Duckworth &amp; Seligman, self-discipline outdoes IQ (2005)</a>{" \u00B7 "}
            <a className="wf-cite" href="https://doi.org/10.1037/pspp0000102" target="_blank" rel="noopener noreferrer">Cred\u00E9 et al., grit meta-analysis (2017)</a>{" \u00B7 "}
            <a className="wf-cite" href="https://doi.org/10.1016/j.jfineco.2021.09.022" target="_blank" rel="noopener noreferrer">Kaiser et al., financial education works (2022)</a>.
          </p>
          <div style={{ marginTop: 34, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
            <Link href="/assessment">
              <span style={{ display: "inline-block", fontFamily: font.body, fontWeight: 600, fontSize: 15, color: T.ink, background: T.champagne, padding: "13px 26px", borderRadius: 999, textDecoration: "none", cursor: "pointer" }}>
                Find your weakness clusters
              </span>
            </Link>
            <span style={{ fontFamily: font.mono, fontSize: 11, color: T.muted, letterSpacing: "0.04em" }}>Part of your 32-line assessment</span>
          </div>
          <div style={{ marginTop: 20, display: "flex", flexWrap: "wrap", gap: 16 }}>
            <Link href="/research-library?section=trainability" style={{ fontFamily: font.mono, fontSize: 11, color: T.champagneDim, letterSpacing: "0.04em", textDecoration: "underline", textUnderlineOffset: 2 }}>
              View trainability evidence →
            </Link>
            <Link href="/blind-side" style={{ fontFamily: font.mono, fontSize: 11, color: T.champagneDim, letterSpacing: "0.04em", textDecoration: "underline", textUnderlineOffset: 2 }}>
              Try the Blind-Side Analyzer →
            </Link>
          </div>
        </Section>
      </div>

      <style>{`
        @media (max-width: 720px) {
          .wf-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
