import { motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { playClick } from "@/lib/audio";
import { SHOW_GENERATIONAL_RARITY } from "@/config/features";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";
import { trpc } from "@/lib/trpc";
import { requireAgreement } from "@/lib/agreement";

// ============================================================
// AQAL HOME — Merged: Viral hook + Claude's Atelier dial UI
// "Out of a million people" hook → interactive 32-line dial →
// thesis → process → evidence → samples → CTA
// Long, compelling scroll for trained professionals.
// ============================================================

// Atelier color constants (matching Claude's design)
const INK = "#141009";
const INK2 = "#1B1610";
const INK3 = "#231C14";
const CREAM = "#F1EADB";
const CREAM2 = "#C4B89F";
const MUTED = "#867A66";
const LINE_C = "rgba(241,234,219,0.10)";
const CHAMPAGNE = "#E0C68C";
const CHAMPAGNE_D = "#C9A24B";
const JADE = "#9BC0B2";
const BRONZE = "#D19A72";

const MODE: Record<string, { c: string; label: string; verb: string }> = {
  measured:      { c: CHAMPAGNE, label: "Measured",      verb: "measured percentile" },
  developmental: { c: JADE,      label: "Developmental", verb: "developmental altitude" },
  demonstrated:  { c: BRONZE,    label: "Demonstrated",  verb: "verified from evidence" },
};

const LINES = [
  { name: "Logical",             short: "Logical",       mode: "measured",      v: 82, note: "Formal inference and contradiction-spotting under load." },
  { name: "Mathematical",        short: "Math",          mode: "measured",      v: 68, note: "Quantitative fluency across symbolic systems." },
  { name: "Spatial",             short: "Spatial",       mode: "measured",      v: 74, note: "Mental rotation; holding a whole system in view." },
  { name: "Linguistic",          short: "Linguistic",    mode: "measured",      v: 88, note: "Range, precision, and generativity in language." },
  { name: "Musical",             short: "Musical",       mode: "measured",      v: 55, note: "Pitch, rhythm, phrasing; structure in sound." },
  { name: "Bodily-Kinesthetic",  short: "Kinesthetic",   mode: "demonstrated",  v: 60, note: "Trained control of the body toward a skilled end." },
  { name: "Naturalist",          short: "Naturalist",    mode: "demonstrated",  v: 48, note: "Reading living systems; fine distinctions within them." },
  { name: "Interpersonal",       short: "Interpersonal", mode: "measured",      v: 80, note: "Modelling other minds; moving a room." },
  { name: "Intrapersonal",       short: "Intrapersonal", mode: "developmental", v: 72, note: "Accuracy of the self-model; knowing your own states." },
  { name: "Existential",         short: "Existential",   mode: "developmental", v: 78, note: "Working seriously with meaning and mortality." },
  { name: "Moral",               short: "Moral",         mode: "developmental", v: 76, note: "Altitude of the ethical frame actually lived." },
  { name: "Aesthetic",           short: "Aesthetic",     mode: "developmental", v: 70, note: "Discernment of form; what makes a thing land." },
  { name: "Emotional",           short: "Emotional",     mode: "measured",      v: 66, note: "Granularity and regulation of affect in real time." },
  { name: "Meta-Cognitive",      short: "Meta-Cog",      mode: "measured",      v: 90, indep: true, note: "Catching your own moves mid-flight." },
  { name: "Volitional",          short: "Volitional",    mode: "demonstrated",  v: 93, indep: true, note: "Sustained will — starting, continuing, finishing under friction." },
  { name: "Adversarial",         short: "Adversarial",   mode: "demonstrated",  v: 84, indep: true, note: "Performance against an opponent trying to beat you." },
  { name: "Interoceptive",       short: "Interoceptive", mode: "measured",      v: 58, indep: true, note: "Fidelity of the inward signal; reading the body." },
  { name: "Strategic",           short: "Strategic",     mode: "demonstrated",  v: 89, note: "Multi-move sequencing toward an unseen end." },
  { name: "Systemic",            short: "Systemic",      mode: "measured",      v: 83, note: "Seeing wholes, loops, and second-order effects." },
  { name: "Entrepreneurial",     short: "Entrepren.",    mode: "demonstrated",  v: 91, note: "Turning a vision into a shipped, funded thing." },
  { name: "Creative",            short: "Creative",      mode: "demonstrated",  v: 86, note: "Producing the genuinely new, not the recombined." },
  { name: "Rhetorical",          short: "Rhetorical",    mode: "demonstrated",  v: 88, note: "Moving a listener from one position to another." },
  { name: "Leadership",          short: "Leadership",    mode: "demonstrated",  v: 79, note: "Real commitment and coordinated action from others." },
  { name: "Mechanical",          short: "Mechanical",    mode: "demonstrated",  v: 64, note: "Practical mastery of how physical things work." },
  { name: "Pattern-Recognition", short: "Pattern",       mode: "measured",      v: 87, note: "Seeing the shape early, from sparse signal." },
  { name: "Social-Perceptual",   short: "Social",        mode: "measured",      v: 81, note: "Reading status, intent, and the unspoken." },
  { name: "Financial",           short: "Financial",     mode: "measured",      v: 77, indep: true, note: "Conative money sense, largely independent of IQ." },
  { name: "Humor",               short: "Humor",         mode: "developmental", v: 82, note: "State-change capacity; shifting a room at will." },
  { name: "Parenting",           short: "Parenting",     mode: "developmental", v: 69, note: "Developmental altitude expressed in raising a person." },
  { name: "Seduction",           short: "Seduction",     mode: "developmental", v: 74, note: "Relational draw, severed from appearance." },
  { name: "Community-Founding",  short: "Community",     mode: "developmental", v: 85, note: "Bringing a durable group into being around a frame." },
  { name: "Street Smarts",       short: "Street",        mode: "demonstrated",  v: 80, note: "Real-world reads under real stakes." },
];

const CX = 310, CY = 310;
const R_MAX = 190, R_MIN = 40;
const N = LINES.length;
const rFor = (v: number) => R_MIN + (R_MAX - R_MIN) * (v / 100);
const angFor = (i: number) => (-90 + (i * 360) / N) * (Math.PI / 180);

const STEPS = [
  { n: "01", t: "Speak", d: "A conversational voice interview — 30 to 60 minutes. You speak naturally about how you think, decide, create, and make sense of the world. No checkboxes. No multiple choice." },
  { n: "02", t: "Prove", d: "Upload evidence: transcripts, certifications, awards, portfolios, tax returns. Your aggregate hardens from estimate to verified — every line backed by documentation." },
  { n: "03", t: "Match", d: "Meet complementary minds across the country — people whose strengths cover your edges, and whose edges you cover. The network that makes rare minds useful." },
];

const EVIDENCE = [
  { t: "Rare because capable — not odd", d: "Your number climbs with genuine capability across independent lines, not with being a statistical weirdo. A mind that's low everywhere isn't rare to us — it's just low." },
  { t: "Only independent axes count", d: "Thirty-two lines, but ~6.5 genuinely independent dimensions. Your aggregate is built from those — so it can't be inflated by stacking scores that all move together." },
  { t: "Mahalanobis, not multiplication", d: "Rarity is computed from the geometry of your whole profile — never by multiplying correlated scores into a fantasy figure with too many zeros." },
  { t: "No inflation. Ever.", d: "Most tests flatter you. This one won't. An honest aggregate is the only one worth sharing — and the only one that matches you to the right people." },
];

const SAMPLES = [
  { rarity: "1 in 5,000",   shape: "Strong generalist", desc: "Genuinely high across several independent lines at once — and no weak spots dragging the whole down." },
  { rarity: "1 in 60,000",  shape: "Rare elevation",    desc: "Near the ceiling across most of the independent axes. The kind of mind a room reorganizes around." },
  { rarity: "1 in 250,000", shape: "Exceptional",       desc: "The full independent set, lifted together. Vanishingly few minds carry this much, this broadly." },
];

// ============================================================
// FREE FOUNDING ACCESS — email + passcode, right on the home page.
// First N (FREE_ASSESSMENT_CAP) get the full assessment free with passcode "Welcome1".
// ============================================================
function FreeFoundingAccess() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [passcode, setPasscode] = useState("");
  const info = trpc.freeAccess.info.useQuery(undefined, { retry: false });
  const utils = trpc.useUtils();
  const claim = trpc.freeAccess.claim.useMutation({
    onSuccess: async (res) => {
      if (!res.success) { toast.error(res.error || "That access code isn't valid."); return; }
      toast.success("You're in — welcome, Founding Member. Let's begin.");
      await utils.auth.me.invalidate();
      navigate("/assessment");
    },
    onError: () => toast.error("Something went wrong. Please try again."),
  });
  const submit = () => {
    const e = email.trim();
    if (!e || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) { toast.error("Please enter a valid email address."); return; }
    if (!passcode.trim()) { toast.error("Enter your access passcode."); return; }
    requireAgreement(() => claim.mutate({ email: e, passcode: passcode.trim() }));
  };
  if (info.data?.enabled === false) return null;
  const remaining = typeof info.data?.remaining === "number" ? info.data.remaining : null;
  const cap = info.data?.cap ?? 0;
  const full = info.data?.full;

  return (
    <section id="claim" style={{ background: `linear-gradient(180deg,${INK},${INK2})`, borderTop: `1px solid ${LINE_C}`, borderBottom: `1px solid ${LINE_C}`, padding: 'clamp(48px,7vw,88px) 0' }}>
      <div className="max-w-[640px] mx-auto px-[clamp(20px,5vw,56px)] text-center">
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.26em', textTransform: 'uppercase', color: CHAMPAGNE, marginBottom: '14px' }}>
          Free founding access — no card
        </div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: 'clamp(28px,4.5vw,46px)', lineHeight: 1.04, color: CREAM, margin: '0 0 12px' }}>
          Claim your free assessment
        </h2>
        <p style={{ color: CREAM2, fontSize: 'clamp(14px,1.6vw,17px)', lineHeight: 1.6, maxWidth: '34em', margin: '0 auto 8px' }}>
          The first {cap ? cap.toLocaleString() : '10,000'} founding members get the full experience free — the voice
          assessment <b style={{ color: CREAM }}>and</b> the fully-underwritten, multi-AI result. Enter your email and the passcode.
        </p>
        {remaining !== null && cap > 0 && (
          <div style={{ margin: '4px 0 20px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: CREAM, border: `1px solid ${CHAMPAGNE}55`, borderRadius: '999px', padding: '5px 12px', background: 'rgba(224,198,140,0.06)' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '999px', background: CHAMPAGNE, boxShadow: `0 0 7px ${CHAMPAGNE}` }} />
              <b style={{ color: CHAMPAGNE }}>{remaining.toLocaleString()}</b> of {cap.toLocaleString()} free spots left
            </span>
          </div>
        )}
        {full ? (
          <div style={{ marginTop: '18px' }}>
            <div style={{ color: CREAM2, marginBottom: '12px' }}>All free founding spots have been claimed.</div>
            <Link href="/pricing"><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '11px 20px', background: `linear-gradient(180deg,${CHAMPAGNE},${CHAMPAGNE_D})`, color: INK, fontWeight: 500, borderRadius: '3px', display: 'inline-block', cursor: 'pointer' }}>See pricing</span></Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '380px', margin: '20px auto 0' }}>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com" autoComplete="email"
              style={{ width: '100%', background: 'rgba(241,234,219,0.04)', border: `1px solid ${LINE_C}`, borderRadius: '8px', padding: '13px 14px', fontSize: '15px', color: CREAM, outline: 'none' }}
            />
            <input
              type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
              placeholder="Access passcode"
              style={{ width: '100%', background: 'rgba(241,234,219,0.04)', border: `1px solid ${LINE_C}`, borderRadius: '8px', padding: '13px 14px', fontSize: '15px', color: CREAM, outline: 'none' }}
            />
            <button
              onClick={submit} disabled={claim.isPending}
              style={{ width: '100%', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '14px', background: `linear-gradient(180deg,${CHAMPAGNE},${CHAMPAGNE_D})`, color: INK, fontWeight: 600, border: 0, borderRadius: '6px', cursor: 'pointer', boxShadow: '0 6px 26px -10px rgba(224,198,140,0.6)' }}
            >
              {claim.isPending ? 'Unlocking…' : 'Get free founding access'}
            </button>
            <p style={{ fontSize: '11px', color: MUTED, lineHeight: 1.5, margin: '4px 0 0' }}>
              Your email is your username. We'll email your results there. No card, ever.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

// HERO — outcome-led: reach your goals with less friction, effort, and failure.
// ============================================================
function HeroSection() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  const pts = useMemo(() => LINES.map((l, i) => {
    const a = angFor(i);
    const r = rFor(l.v);
    const ca = Math.cos(a), sa = Math.sin(a);
    return { i, l, x: CX + r * ca, y: CY + r * sa, ca, sa };
  }), []);
  const poly = useMemo(() => pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" "), [pts]);
  const aggregate = useMemo(() => Math.round(LINES.reduce((s, l) => s + l.v, 0) / N), []);

  return (
    <section className="relative" style={{ padding: 'clamp(56px,9vw,120px) 0 clamp(40px,6vw,72px)', background: INK }}>
      {/* Subtle radial glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(760px 460px at 82% 8%, rgba(224,198,140,0.10), transparent 60%), radial-gradient(620px 420px at 6% 96%, rgba(209,154,114,0.06), transparent 58%)'
      }} />

      <div className="relative max-w-[1160px] mx-auto px-[clamp(20px,5vw,56px)]">
        <div className="grid gap-[clamp(28px,4vw,56px)] items-center" style={{ gridTemplateColumns: 'minmax(0,1.02fr) minmax(0,0.98fr)' }}>
          {/* Left: Copy */}
          <div>
            <motion.div
              className="mb-4"
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.30em', textTransform: 'uppercase', color: CHAMPAGNE }}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.05, ease: [0.2, 0.7, 0.3, 1] }}
            >
              32 lines · measured, mapped, engineered
            </motion.div>

            <motion.h1
              style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, lineHeight: 0.98, fontSize: 'clamp(44px,7vw,80px)', letterSpacing: '-0.01em', color: CREAM, marginTop: '20px' }}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15, ease: [0.2, 0.7, 0.3, 1] }}
            >
              How predictable, protected, and consistent is your mind <em style={{ fontStyle: 'italic', background: `linear-gradient(96deg,${CHAMPAGNE},${BRONZE})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>at getting you what you want?</em>
            </motion.h1>

            <motion.p
              style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 500, fontSize: 'clamp(17px,2.1vw,24px)', lineHeight: 1.25, color: CREAM2, margin: '14px 0 0' }}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.18, ease: [0.2, 0.7, 0.3, 1] }}
            >
              You've probably never measured it — almost no one has. <b style={{ color: CREAM, fontWeight: 600 }}>We do.</b> Then we re-engineer the mind to close the gap between where you stand today and the outcomes you're chasing.
            </motion.p>

            <motion.p
              style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: 'clamp(21px,2.7vw,32px)', lineHeight: 1.15, color: CREAM, margin: '20px 0 0' }}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: [0.2, 0.7, 0.3, 1] }}
            >
              Measure the mind. <span style={{ color: CHAMPAGNE }}>Map the system.</span> Engineer the outcome.
            </motion.p>

            <motion.p
              style={{ color: CREAM2, fontSize: 'clamp(15px,1.7vw,18px)', lineHeight: 1.6, maxWidth: '34em', margin: '18px 0 30px' }}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.25, ease: [0.2, 0.7, 0.3, 1] }}
            >
              Every other test hands you a number and walks away. We map your mind as a <b style={{ color: CREAM, fontWeight: 600 }}>system of 32 lines</b> and run precise, surgical interventions on the ones that matter — <b style={{ color: CREAM, fontWeight: 600 }}>fortifying the strengths that drive your goals</b> and <b style={{ color: CREAM, fontWeight: 600 }}>dismantling the weaknesses that sabotage them</b> — so you reach your outcomes with the greatest result and the least time, effort, and failure. The tools, the training, and the research, individualized to your assessment and your goals.
            </motion.p>

            <motion.div
              className="flex gap-[14px] flex-wrap items-center"
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.35, ease: [0.2, 0.7, 0.3, 1] }}
            >
              <a href="#claim" className="inline-flex items-center gap-2 cursor-pointer border-0 no-underline rounded-[3px] transition-all duration-150 hover:-translate-y-[1px]" onClick={playClick}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '11px 20px', background: `linear-gradient(180deg,${CHAMPAGNE},${CHAMPAGNE_D})`, color: INK, fontWeight: 500, boxShadow: '0 6px 26px -10px rgba(224,198,140,0.6)', borderRadius: '3px', display: 'inline-block' }}>Measure yourself — free</span>
              </a>
              <Link href="/weakness-finder" className="inline-flex items-center gap-2 cursor-pointer border rounded-[3px] no-underline transition-all duration-150 hover:border-[#C85C44] hover:text-[#C85C44]"
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '11px 20px', background: 'transparent', color: CREAM, borderColor: LINE_C }}
              >
                See what your strengths can’t protect you from
              </Link>
              <a href="#dial" className="inline-flex items-center gap-2 cursor-pointer border rounded-[3px] no-underline transition-all duration-150 hover:border-[#E0C68C] hover:text-[#E0C68C]"
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '11px 20px', background: 'transparent', color: CREAM, borderColor: LINE_C }}
              >
                See how it works ↓
              </a>
            </motion.div>

            <motion.div
              className="flex gap-[18px] flex-wrap mt-[26px]"
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9.5px', letterSpacing: '0.10em', color: MUTED }}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.35, ease: [0.2, 0.7, 0.3, 1] }}
            >
              <span className="inline-flex items-center gap-[7px]"><span className="w-[5px] h-[5px] rounded-full" style={{ background: JADE, boxShadow: `0 0 7px ${JADE}` }} /> Methodology disclosed</span>
              <Link href="/verification"><span className="inline-flex items-center gap-[7px] cursor-pointer hover:opacity-80 transition-opacity"><span className="w-[5px] h-[5px] rounded-full" style={{ background: JADE, boxShadow: `0 0 7px ${JADE}` }} /> 10,000+ sources · 0 fabricated</span></Link>
              <span className="inline-flex items-center gap-[7px]"><span className="w-[5px] h-[5px] rounded-full" style={{ background: JADE, boxShadow: `0 0 7px ${JADE}` }} /> No score inflation, ever</span>
            </motion.div>
          </div>

          {/* Right: The Dial (hero medallion) */}
          <div className="relative">
            <div className="absolute inset-[-6%] z-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 46%, rgba(224,198,140,0.14), transparent 62%)' }} />
            <svg className="relative z-[1] w-full h-auto block overflow-visible" viewBox="0 0 620 620" role="img" aria-label="Sample AQAL profile: aggregate capability across 32 lines">
              <g style={{ opacity: mounted ? 1 : 0, transition: 'opacity 1000ms ease 80ms' }}>
                <circle cx={CX} cy={CY} r={272} fill="none" stroke={CHAMPAGNE} strokeOpacity="0.30" strokeWidth="1" />
                <circle cx={CX} cy={CY} r={250} fill="none" stroke={CHAMPAGNE} strokeOpacity="0.16" strokeWidth="1" />
                {Array.from({ length: 72 }).map((_, k) => {
                  const a = (k * 5 - 90) * (Math.PI / 180);
                  const long = k % 6 === 0;
                  const r1 = 252, r2 = 272 - (long ? 3 : 11);
                  return (<line key={"tk" + k} x1={CX + r1 * Math.cos(a)} y1={CY + r1 * Math.sin(a)} x2={CX + r2 * Math.cos(a)} y2={CY + r2 * Math.sin(a)} stroke={CHAMPAGNE} strokeOpacity={long ? 0.5 : 0.22} strokeWidth={long ? 1.1 : 0.8} />);
                })}
              </g>
              {[25, 50, 75, 100].map((g) => (
                <circle key={"g" + g} cx={CX} cy={CY} r={rFor(g)} fill="none" stroke={CREAM} strokeOpacity={g === 100 ? 0.12 : 0.055} strokeWidth="1" />
              ))}
              {pts.map((p) => (
                <line key={"sp" + p.i} x1={CX} y1={CY} x2={CX + R_MAX * p.ca} y2={CY + R_MAX * p.sa} stroke={CREAM} strokeOpacity="0.04" strokeWidth="0.8" />
              ))}
              <polygon
                points={poly}
                fill="rgba(224,198,140,0.06)" stroke={CHAMPAGNE} strokeWidth="1.6" strokeLinejoin="round"
                style={{ strokeDasharray: 1700, strokeDashoffset: mounted ? 0 : 1700, transition: 'stroke-dashoffset 1500ms cubic-bezier(.22,.61,.36,1) 200ms' }}
              />
              {pts.map((p) => {
                const c = MODE[p.l.mode].c;
                return (
                  <g key={"pt" + p.i}>
                    {p.l.indep && <circle cx={p.x} cy={p.y} r={8} fill="none" stroke={c} strokeOpacity="0.5" strokeDasharray="2 2" />}
                    <circle cx={p.x} cy={p.y} r={4.2} fill={c} />
                    <circle cx={p.x} cy={p.y} r={1.8} fill={INK} />
                  </g>
                );
              })}
              {/* Center text */}
              <text style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '8.5px', letterSpacing: '0.24em' }} fill={CREAM2} x={CX} y={CY - 34} textAnchor="middle">AGGREGATE · SAMPLE</text>
              <text style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }} fill={CREAM} x={CX} y={CY + 4} textAnchor="middle" fontSize="40">1 in 5,000</text>
              <text style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '8px', letterSpacing: '0.10em' }} fill={MUTED} x={CX} y={CY + 24} textAnchor="middle">CAPABILITY {aggregate} · 32 LINES · ~6.5 EFF. DIM</text>
            </svg>
          </div>
        </div>
      </div>

      {/* Responsive override for mobile */}
      <style>{`
        @media (max-width: 900px) {
          .aq-hero-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

// ============================================================
// THESIS — "One number undersells you."
// ============================================================
function ThesisSection() {
  return (
    <section style={{ background: `linear-gradient(180deg,${INK2},${INK})`, borderTop: `1px solid ${LINE_C}`, borderBottom: `1px solid ${LINE_C}`, padding: 'clamp(56px,8vw,108px) 0' }}>
      <div className="max-w-[1160px] mx-auto px-[clamp(20px,5vw,56px)]">
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.26em', textTransform: 'uppercase', color: CHAMPAGNE, marginBottom: '16px' }}>
          Why one number undervalues you
        </div>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 500, fontSize: 'clamp(34px,6vw,64px)', lineHeight: 1.02, color: CREAM, margin: '0 0 20px' }}>
          "One number undersells you."
        </p>
        <p style={{ color: CREAM2, fontSize: 'clamp(15px,1.7vw,18px)', lineHeight: 1.65, maxWidth: '40em' }}>
          The frugal grandmother who out-saved the whole family had a financial mind sharper than anyone at the table —
          and an IQ test would have called her average. <b style={{ color: CREAM, fontWeight: 600 }}>That's the flaw in a single score:</b> it doesn't just
          mislabel you, it <em>undercounts</em> you. Measure all thirty-two lines and your real worth — the aggregate a
          lone number hides — finally shows.
        </p>
      </div>
    </section>
  );
}

// ============================================================
// GENERATIONAL MEASUREMENT & MATCHING — the differentiator, in few words
// ============================================================
function GenerationSection() {
  return (
    <section style={{ background: `linear-gradient(180deg,${INK2},${INK})`, borderTop: `1px solid ${LINE_C}`, borderBottom: `1px solid ${LINE_C}`, padding: 'clamp(56px,8vw,108px) 0' }}>
      <div className="max-w-[1160px] mx-auto px-[clamp(20px,5vw,56px)]">
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.26em', textTransform: 'uppercase', color: CHAMPAGNE, marginBottom: '16px' }}>
          Measured by generation · matched by generation
        </div>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 500, fontSize: 'clamp(34px,6vw,64px)', lineHeight: 1.02, color: CREAM, margin: '0 0 20px' }}>
          "Rare for your age is the only rare that counts."
        </p>
        <p style={{ color: CREAM2, fontSize: 'clamp(15px,1.7vw,18px)', lineHeight: 1.65, maxWidth: '42em', margin: '0 0 36px' }}>
          A twenty-five-year-old at the frontier of human development is not a sixty-five-year-old who had forty
          extra years to get there. We score you <b style={{ color: CREAM, fontWeight: 600 }}>against your own generation</b>,
          so the young prodigy reads as rare — not average — and sheer time-to-compound never inflates the number.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 'clamp(20px,3vw,40px)' }}>
          <div style={{ borderLeft: `2px solid ${CHAMPAGNE}`, paddingLeft: '18px' }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: '22px', color: CREAM, marginBottom: '8px' }}>Cohort rarity</div>
            <p style={{ color: CREAM2, fontSize: '14.5px', lineHeight: 1.6 }}>
              Two numbers, both true: how rare you are in the whole population, and how rare you are among people your age. The second is the one that moves you.
            </p>
          </div>
          <div style={{ borderLeft: `2px solid ${CHAMPAGNE}`, paddingLeft: '18px' }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: '22px', color: CREAM, marginBottom: '8px' }}>Generational matching</div>
            <p style={{ color: CREAM2, fontSize: '14.5px', lineHeight: 1.6 }}>
              A generation apart to cover your blind spots — mentor to protégé, protégé to mentor. Same generation to find the peers who move at your pace.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// TESTIMONIALS — real, consented, approved. Hidden until they exist.
// ============================================================
function TestimonialsStrip() {
  const q = trpc.testimonials.approved.useQuery(undefined, { staleTime: 5 * 60_000, retry: false });
  const items = q.data ?? [];
  if (items.length === 0) return null; // honest: no fabricated social proof

  return (
    <section style={{ background: INK2, borderTop: `1px solid ${LINE_C}`, borderBottom: `1px solid ${LINE_C}`, padding: 'clamp(56px,8vw,100px) 0' }}>
      <div className="max-w-[1160px] mx-auto px-[clamp(20px,5vw,56px)]">
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.26em', textTransform: 'uppercase', color: CHAMPAGNE, marginBottom: '28px' }}>
          In their words
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 'clamp(16px,2vw,28px)' }}>
          {items.map((t, i) => (
            <div key={i} style={{ border: `1px solid ${LINE_C}`, borderRadius: '10px', padding: '24px', background: INK }}>
              <div style={{ color: CHAMPAGNE, letterSpacing: '2px', fontSize: '13px', marginBottom: '12px' }}>
                {'★'.repeat(Math.max(1, Math.min(5, t.rating || 5)))}<span style={{ color: MUTED }}>{'★'.repeat(5 - Math.max(1, Math.min(5, t.rating || 5)))}</span>
              </div>
              {t.quote && (
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: '18px', lineHeight: 1.4, color: CREAM, margin: '0 0 14px' }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
              )}
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.08em', color: CREAM2 }}>
                {t.displayName || 'Verified member'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// SYSTEMS ENGINEERING — the meta-level differentiator
// ============================================================
function EngineeringSection() {
  const principles = [
    { h: "The controlling weakness", d: "Network science finds the one weakness with the most influence over the rest — the domino to shield first, not the loudest complaint." },
    { h: "The weakest link", d: "A single deficiency can cap your outcome no matter how strong you are elsewhere. We find it before it finds you." },
    { h: "The keystone strength", d: "Sharpen the right strength and it lifts the entire shape — a few high-leverage lines quietly carry the others." },
    { h: "The highest-leverage move", d: "One tracked change, aimed at the most influential node, re-engineers the odds more than ten scattered efforts." },
  ];
  return (
    <section style={{ background: INK, padding: 'clamp(56px,8vw,108px) 0' }}>
      <div className="max-w-[1160px] mx-auto px-[clamp(20px,5vw,56px)]">
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.26em', textTransform: 'uppercase', color: CHAMPAGNE, marginBottom: '16px' }}>
          Diagnosis, then intervention
        </div>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontWeight: 500, fontSize: 'clamp(32px,5.5vw,58px)', lineHeight: 1.03, color: CREAM, margin: '0 0 20px', maxWidth: '16em' }}>
          "Most platforms stop at the score. We operate on the system."
        </p>
        <p style={{ color: CREAM2, fontSize: 'clamp(15px,1.7vw,18px)', lineHeight: 1.65, maxWidth: '44em', margin: '0 0 40px' }}>
          Once your 32 lines are measured, the real work begins — <b style={{ color: CREAM, fontWeight: 600 }}>precise surgery on the system.</b>{" "}
          We read how the lines interact, then intervene with intent: <b style={{ color: CREAM, fontWeight: 600 }}>fortify and sharpen the strengths</b> that
          carry you, and <b style={{ color: CREAM, fontWeight: 600 }}>patch, route around, or dismantle the weaknesses</b> quietly sabotaging your outcomes.
          Every move is drawn from peer-reviewed research and aimed at the one node that changes the odds — engineering the
          outcomes of your life by operating on the mind that produces them. No other assessment on the internet works at this level.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 'clamp(16px,2vw,24px)' }}>
          {principles.map((p) => (
            <div key={p.h} style={{ border: `1px solid ${LINE_C}`, borderRadius: '8px', padding: '22px', background: `linear-gradient(180deg,${INK2},${INK})` }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: '21px', color: CREAM, marginBottom: '8px' }}>{p.h}</div>
              <p style={{ color: CREAM2, fontSize: '14px', lineHeight: 1.6 }}>{p.d}</p>
            </div>
          ))}
        </div>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10.5px', letterSpacing: '0.06em', color: MUTED, marginTop: '20px' }}>
          Grounded in established systems science — with the skeptical papers included. See the{" "}
          <Link href="/science" style={{ color: CHAMPAGNE, textDecoration: 'underline' }}>method</Link>.
        </p>
      </div>
    </section>
  );
}

// ============================================================
// INTERACTIVE DIAL — Full 32-line exploration
// ============================================================
function DialSection() {
  const [selected, setSelected] = useState(14);

  const pts = useMemo(() => LINES.map((l, i) => {
    const a = angFor(i);
    const r = rFor(l.v);
    const ca = Math.cos(a), sa = Math.sin(a);
    const rl = R_MAX + (i % 2 === 0 ? 20 : 40);
    return {
      i, l, ca, sa,
      x: CX + r * ca, y: CY + r * sa,
      lx: CX + rl * ca, ly: CY + rl * sa,
      anchor: (ca > 0.06 ? "start" : ca < -0.06 ? "end" : "middle") as "start" | "end" | "middle",
    };
  }), []);
  const poly = useMemo(() => pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" "), [pts]);
  const aggregate = useMemo(() => Math.round(LINES.reduce((s, l) => s + l.v, 0) / N), []);
  const counts = useMemo(() => { const c = { measured: 0, developmental: 0, demonstrated: 0 }; LINES.forEach((l) => c[l.mode as keyof typeof c]++); return c; }, []);
  const grouped = useMemo(() => {
    const g: Record<string, Array<typeof LINES[0] & { i: number }>> = { measured: [], developmental: [], demonstrated: [] };
    LINES.forEach((l, i) => g[l.mode].push({ ...l, i }));
    return g;
  }, []);
  const sel = LINES[selected];
  const guides = [25, 50, 75, 100];

  return (
    <section id="dial" style={{ padding: 'clamp(56px,8vw,108px) 0', background: INK }}>
      <div className="max-w-[1160px] mx-auto px-[clamp(20px,5vw,56px)]">
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.26em', textTransform: 'uppercase', color: CHAMPAGNE, marginBottom: '16px' }}>
          Your mind, in full
        </div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, lineHeight: 1.02, fontSize: 'clamp(32px,5vw,54px)', letterSpacing: '-0.005em', color: CREAM, margin: '0 0 18px' }}>
          Thirty-two lines on <em style={{ fontStyle: 'italic', color: CHAMPAGNE }}>one dial</em>.
        </h2>
        <p style={{ color: CREAM2, fontSize: 'clamp(15px,1.7vw,18px)', lineHeight: 1.65, maxWidth: '40em' }}>
          Every intelligence, plotted in its honest mode — and read as one aggregate. The <b style={{ color: CREAM, fontWeight: 600 }}>independent axes</b> are ringed; they carry most of what makes a capable mind genuinely rare. Hover any point to read it.
        </p>

        {/* Dial + Detail panel */}
        <div className="grid gap-[clamp(24px,4vw,52px)] items-center mt-[clamp(20px,3vw,40px)]" style={{ gridTemplateColumns: 'minmax(0,1.1fr) minmax(0,0.9fr)' }}>
          {/* SVG Dial */}
          <div className="relative">
            <div className="absolute inset-[-6%] z-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 46%, rgba(224,198,140,0.14), transparent 62%)' }} />
            <svg className="relative z-[1] w-full h-auto block overflow-visible" viewBox="0 0 620 620" role="img" aria-label="Interactive dial of 32 intelligence lines">
              <g style={{ opacity: 1 }}>
                <circle cx={CX} cy={CY} r={272} fill="none" stroke={CHAMPAGNE} strokeOpacity="0.30" strokeWidth="1" />
                <circle cx={CX} cy={CY} r={250} fill="none" stroke={CHAMPAGNE} strokeOpacity="0.16" strokeWidth="1" />
                {Array.from({ length: 72 }).map((_, k) => {
                  const a = (k * 5 - 90) * (Math.PI / 180);
                  const long = k % 6 === 0;
                  const r1 = 252, r2 = 272 - (long ? 3 : 11);
                  return (<line key={"tk2" + k} x1={CX + r1 * Math.cos(a)} y1={CY + r1 * Math.sin(a)} x2={CX + r2 * Math.cos(a)} y2={CY + r2 * Math.sin(a)} stroke={CHAMPAGNE} strokeOpacity={long ? 0.5 : 0.22} strokeWidth={long ? 1.1 : 0.8} />);
                })}
              </g>
              {guides.map((g) => (
                <circle key={"g2" + g} cx={CX} cy={CY} r={rFor(g)} fill="none" stroke={CREAM} strokeOpacity={g === 100 ? 0.12 : 0.055} strokeWidth="1" />
              ))}
              {pts.map((p) => (
                <line key={"sp2" + p.i} x1={CX} y1={CY} x2={CX + R_MAX * p.ca} y2={CY + R_MAX * p.sa} stroke={CREAM} strokeOpacity="0.04" strokeWidth="0.8" />
              ))}
              <polygon points={poly} fill="rgba(224,198,140,0.06)" stroke={CHAMPAGNE} strokeWidth="1.6" strokeLinejoin="round" />
              {pts.map((p) => {
                const on = selected === p.i; const c = MODE[p.l.mode].c;
                return (
                  <g key={"pt2" + p.i} className="cursor-pointer" onMouseEnter={() => setSelected(p.i)} onClick={() => setSelected(p.i)}>
                    {p.l.indep && <circle cx={p.x} cy={p.y} r={on ? 11 : 8} fill="none" stroke={c} strokeOpacity="0.5" strokeDasharray="2 2" />}
                    <circle cx={p.x} cy={p.y} r={on ? 7 : 4.2} fill={c} />
                    <circle cx={p.x} cy={p.y} r={on ? 2.8 : 1.8} fill={INK} />
                  </g>
                );
              })}
              {pts.map((p) => {
                const on = selected === p.i;
                return (
                  <text key={"lb2" + p.i} x={p.lx} y={p.ly} textAnchor={p.anchor} dominantBaseline="middle"
                    className="cursor-pointer select-none"
                    style={{ fontFamily: "'Inter', sans-serif", fontWeight: on ? 700 : 600, fontSize: on ? '12.5px' : '11px', letterSpacing: '0.005em', paintOrder: 'stroke', stroke: INK, strokeWidth: '3px', strokeLinejoin: 'round', transition: 'font-size .16s ease, fill .16s ease' }}
                    fill={on ? MODE[p.l.mode].c : CREAM}
                    onMouseEnter={() => setSelected(p.i)} onClick={() => setSelected(p.i)}>
                    {p.l.short}
                  </text>
                );
              })}
              <text style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '8.5px', letterSpacing: '0.24em' }} fill={CREAM2} x={CX} y={CY - 20} textAnchor="middle">AGGREGATE CAPABILITY</text>
              <text style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }} fill={CREAM} x={CX} y={CY + 14} textAnchor="middle" fontSize="46">{aggregate}</text>
              <text style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '8px', letterSpacing: '0.10em' }} fill={MUTED} x={CX} y={CY + 32} textAnchor="middle">32 LINES · ~6.5 EFF. DIM</text>
            </svg>
            <div className="text-center mt-3" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: MUTED }}>
              Illustrative example — not your data
            </div>
          </div>

          {/* Detail Panel */}
          <div style={{ background: `linear-gradient(180deg,${INK2},${INK})`, border: `1px solid ${LINE_C}`, borderRadius: '6px', padding: '26px 28px' }} aria-live="polite">
            <span className="inline-flex items-center gap-2" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9.5px', letterSpacing: '0.16em', textTransform: 'uppercase', color: MODE[sel.mode].c }}>
              <span className="w-[9px] h-[9px] rounded-[2px] flex-none" style={{ background: MODE[sel.mode].c }} /> {MODE[sel.mode].label}
            </span>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: 'clamp(30px,4.4vw,44px)', lineHeight: 1.0, margin: '12px 0 3px', color: CREAM }}>{sel.name}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.08em', color: CREAM2, marginBottom: '18px' }}>{MODE[sel.mode].verb}</div>
            <div className="flex items-baseline justify-between mb-[9px]">
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '26px', color: MODE[sel.mode].c }}>{sel.v}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', letterSpacing: '0.14em', color: MUTED }}>/ 100</span>
            </div>
            <div className="h-[4px] rounded-[4px] relative overflow-hidden" style={{ background: 'rgba(241,234,219,0.10)' }}>
              <span className="absolute inset-y-0 left-0 rounded-[4px]" style={{ width: `${sel.v}%`, background: MODE[sel.mode].c, transition: 'width .7s cubic-bezier(.22,.61,.36,1)' }} />
            </div>
            <div style={{ color: CREAM2, fontSize: '14px', lineHeight: 1.62, marginTop: '18px' }}>{sel.note}</div>
            {sel.indep && <div className="mt-[15px] inline-flex items-center gap-[7px]" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', letterSpacing: '0.10em', color: CHAMPAGNE }}>◇ Independent axis — carries the effective-dimension count</div>}
            <div className="flex gap-5 flex-wrap mt-6 pt-[18px]" style={{ borderTop: `1px solid ${LINE_C}` }}>
              <span className="inline-flex items-center gap-2" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9.5px', letterSpacing: '0.08em', color: CREAM2 }}><span className="w-[9px] h-[9px] rounded-[2px] flex-none" style={{ background: CHAMPAGNE }} /> Measured · {counts.measured}</span>
              <span className="inline-flex items-center gap-2" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9.5px', letterSpacing: '0.08em', color: CREAM2 }}><span className="w-[9px] h-[9px] rounded-[2px] flex-none" style={{ background: JADE }} /> Developmental · {counts.developmental}</span>
              <span className="inline-flex items-center gap-2" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9.5px', letterSpacing: '0.08em', color: CREAM2 }}><span className="w-[9px] h-[9px] rounded-[2px] flex-none" style={{ background: BRONZE }} /> Demonstrated · {counts.demonstrated}</span>
            </div>
          </div>
        </div>

        {/* 3-column list */}
        <div className="grid gap-[clamp(16px,3vw,32px)] mt-[38px]" style={{ gridTemplateColumns: 'repeat(3,minmax(0,1fr))' }}>
          {(["measured", "developmental", "demonstrated"] as const).map((m) => (
            <div key={m}>
              <div className="flex items-center gap-2 pb-[9px] mb-[5px]" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9.5px', letterSpacing: '0.14em', textTransform: 'uppercase', color: MODE[m].c, borderBottom: `1px solid ${LINE_C}` }}>
                <span className="w-[9px] h-[9px] rounded-[2px] flex-none" style={{ background: MODE[m].c }} /> {MODE[m].label}
              </div>
              {grouped[m].map((l) => (
                <div key={l.i} tabIndex={0} className="flex items-center justify-between gap-3 rounded-[5px] cursor-pointer border border-transparent transition-all duration-150 hover:border-[rgba(241,234,219,0.10)]"
                  style={{ padding: '8px', background: selected === l.i ? INK3 : 'transparent', borderColor: selected === l.i ? LINE_C : 'transparent' }}
                  onMouseEnter={() => setSelected(l.i)} onFocus={() => setSelected(l.i)} onClick={() => setSelected(l.i)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelected(l.i); } }}>
                  <span className="flex items-center gap-[7px]" style={{ fontSize: '14px', color: CREAM }}>
                    {l.indep && <span style={{ color: CHAMPAGNE, fontSize: '10px' }}>◇</span>}{l.name}
                  </span>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '19px', color: MODE[m].c }}>{l.v}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Responsive */}
      <style>{`
        @media (max-width: 900px) {
          #dial .grid[style*="1.1fr"] { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 760px) {
          #dial .grid[style*="repeat(3"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

// ============================================================
// PROCESS — "Speak. Prove. Match."
// ============================================================
function ProcessSection() {
  return (
    <section id="how" style={{ padding: 'clamp(56px,8vw,108px) 0', background: INK }}>
      <div className="max-w-[1160px] mx-auto px-[clamp(20px,5vw,56px)]">
        <div className="h-[1px] mb-[clamp(56px,8vw,108px)]" style={{ background: LINE_C }} />
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.26em', textTransform: 'uppercase', color: CHAMPAGNE, marginBottom: '16px' }}>
          The process
        </div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, lineHeight: 1.02, fontSize: 'clamp(32px,5vw,54px)', letterSpacing: '-0.005em', color: CREAM, margin: '0 0 18px' }}>
          Speak. Prove. <em style={{ fontStyle: 'italic', color: CHAMPAGNE }}>Match.</em>
        </h2>
        <p style={{ color: CREAM2, fontSize: 'clamp(15px,1.7vw,18px)', lineHeight: 1.65, maxWidth: '40em' }}>
          Two phases and a network. It starts loose and fast, then hardens into a verified aggregate — and a use for it.
        </p>
        <div className="grid gap-[clamp(20px,3vw,40px)] mt-[clamp(24px,3vw,44px)]" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
          {STEPS.map((s) => (
            <div key={s.n} className="pt-[26px]" style={{ borderTop: `2px solid ${CHAMPAGNE}` }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', letterSpacing: '0.16em', color: CHAMPAGNE, marginBottom: '10px' }}>{s.n}</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: '26px', color: CREAM, marginBottom: '8px' }}>{s.t}</div>
              <div style={{ color: CREAM2, fontSize: '14px', lineHeight: 1.6 }}>{s.d}</div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 760px) {
          #how .grid[style*="repeat(3"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

// ============================================================
// EVIDENCE — "Why you can trust the number"
// ============================================================
function EvidenceSection() {
  return (
    <section id="evidence" style={{ padding: 'clamp(56px,8vw,108px) 0', background: `linear-gradient(180deg,${INK2},${INK})`, borderTop: `1px solid ${LINE_C}`, borderBottom: `1px solid ${LINE_C}` }}>
      <div className="max-w-[1160px] mx-auto px-[clamp(20px,5vw,56px)]">
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.26em', textTransform: 'uppercase', color: CHAMPAGNE, marginBottom: '16px' }}>
          Why you can trust the number
        </div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, lineHeight: 1.02, fontSize: 'clamp(32px,5vw,54px)', letterSpacing: '-0.005em', color: CREAM, margin: '0 0 18px' }}>
          Evidence-based, or it's <em style={{ fontStyle: 'italic', color: CHAMPAGNE }}>worthless</em>.
        </h2>
        <p style={{ color: CREAM2, fontSize: 'clamp(15px,1.7vw,18px)', lineHeight: 1.65, maxWidth: '40em' }}>
          An aggregate score is only worth having if it's honest. Here's what keeps ours from becoming the hype it's surrounded by.
        </p>
        <div className="grid gap-[clamp(16px,2.5vw,26px)] mt-[clamp(24px,3vw,44px)]" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>
          {EVIDENCE.map((e) => (
            <div key={e.t} className="rounded-[6px] transition-all duration-200 hover:-translate-y-[2px]" style={{ background: `linear-gradient(180deg,${INK2},${INK})`, border: `1px solid ${LINE_C}`, padding: '24px 26px' }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: '22px', marginBottom: '8px', color: CREAM }}>
                <span style={{ color: CHAMPAGNE, fontSize: '13px', marginRight: '9px', verticalAlign: 'middle' }}>◇</span>{e.t}
              </div>
              <div style={{ color: CREAM2, fontSize: '13.5px', lineHeight: 1.6 }}>{e.d}</div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 720px) {
          #evidence .grid[style*="repeat(2"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

// ============================================================
// SAMPLES — "What a rare mind looks like"
// ============================================================
function SamplesSection() {
  return (
    <section style={{ padding: 'clamp(56px,8vw,108px) 0', background: INK }}>
      <div className="max-w-[1160px] mx-auto px-[clamp(20px,5vw,56px)]">
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.26em', textTransform: 'uppercase', color: CHAMPAGNE, marginBottom: '16px' }}>
          What a rare mind looks like
        </div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, lineHeight: 1.02, fontSize: 'clamp(32px,5vw,54px)', letterSpacing: '-0.005em', color: CREAM, margin: '0 0 18px' }}>
          More capable. <em style={{ fontStyle: 'italic', color: CHAMPAGNE }}>Rarer.</em>
        </h2>
        <p style={{ color: CREAM2, fontSize: 'clamp(15px,1.7vw,18px)', lineHeight: 1.65, maxWidth: '40em' }}>
          The rarest valuable minds aren't spiked in one thing and hollow everywhere else. They're elevated across many independent lines at once — a combination that's both hard to find and genuinely powerful.
        </p>
        <div className="grid gap-[clamp(16px,2.5vw,26px)] mt-[clamp(24px,3vw,40px)]" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
          {SAMPLES.map((s) => (
            <div key={s.rarity} className="rounded-[6px] text-center" style={{ border: `1px solid ${LINE_C}`, padding: '26px', background: `radial-gradient(420px 200px at 50% 0%, rgba(224,198,140,0.06), transparent 70%), ${INK2}` }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 'clamp(30px,4.5vw,44px)', lineHeight: 1, background: `linear-gradient(96deg,${CHAMPAGNE},${BRONZE})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.rarity}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: CREAM, margin: '14px 0 8px' }}>{s.shape}</div>
              <div style={{ color: CREAM2, fontSize: '13px', lineHeight: 1.55 }}>{s.desc}</div>
            </div>
          ))}
        </div>
        <div className="text-center mt-[18px]" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9.5px', letterSpacing: '0.12em', color: MUTED }}>
          Sample results · every figure is an estimate within the AQAL population, computed from your own aggregate, then refined by the evidence-based scoring method
        </div>
      </div>
      <style>{`
        @media (max-width: 760px) {
          section:has(.aq-samples-grid) .grid[style*="repeat(3"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

// ============================================================
// SERVICE PILLARS — Strength Maximization, Weakness Shielding, Matching
// ============================================================
function ServicePillars() {
  return (
    <section style={{ padding: 'clamp(56px,8vw,108px) 0', background: `linear-gradient(180deg,${INK2},${INK})`, borderTop: `1px solid ${LINE_C}`, borderBottom: `1px solid ${LINE_C}` }}>
      <div className="max-w-[1160px] mx-auto px-[clamp(20px,5vw,56px)]">
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.26em', textTransform: 'uppercase', color: CHAMPAGNE, marginBottom: '16px' }}>
          What we do with your architecture
        </div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, lineHeight: 1.02, fontSize: 'clamp(32px,5vw,54px)', letterSpacing: '-0.005em', color: CREAM, margin: '0 0 18px' }}>
          Maximize. Shield. <em style={{ fontStyle: 'italic', color: CHAMPAGNE }}>Connect.</em>
        </h2>
        <p style={{ color: CREAM2, fontSize: 'clamp(15px,1.7vw,18px)', lineHeight: 1.65, maxWidth: '40em', marginBottom: 'clamp(32px,4vw,56px)' }}>
          Knowing your 32-line architecture is the beginning. What matters is what you do with it — and what it does for you when properly deployed.
        </p>

        {/* Three pillars */}
        <div className="grid gap-[clamp(20px,3vw,32px)]" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
          {/* Pillar 1: Strength Maximization */}
          <div className="rounded-[6px]" style={{ border: `1px solid ${LINE_C}`, padding: '28px 24px', background: `radial-gradient(300px 180px at 50% 0%, rgba(224,198,140,0.05), transparent 70%), ${INK}` }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', letterSpacing: '0.20em', textTransform: 'uppercase', color: CHAMPAGNE, marginBottom: '12px' }}>01 · Maximize</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: '24px', color: CREAM, marginBottom: '14px' }}>Strength Cluster Optimization</div>
            <div style={{ color: CREAM2, fontSize: '13.5px', lineHeight: 1.6 }}>
              <p style={{ marginBottom: '12px' }}>Your highest lines form <b style={{ color: CREAM, fontWeight: 600 }}>strength clusters</b> — groups that amplify each other when used together. We identify these clusters and show you how to deploy them toward your stated goals.</p>
              <p style={{ marginBottom: '12px' }}>The <b style={{ color: CREAM, fontWeight: 600 }}>second-order effects</b> of combining your top lines optimally are often more powerful than any individual strength. Strategic × Interpersonal doesn't just mean "good at planning and people" — it means you can architect social outcomes most people can't even see.</p>
              <p>A panel of independent AIs analyzes your specific cluster patterns and generates prescriptions for career decisions, relationship dynamics, creative output, and long-term planning.</p>
            </div>
          </div>

          {/* Pillar 2: Weakness Protection */}
          <div className="rounded-[6px]" style={{ border: `1px solid rgba(200,92,68,0.25)`, padding: '28px 24px', background: `radial-gradient(300px 180px at 50% 0%, rgba(200,92,68,0.04), transparent 70%), ${INK}` }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', letterSpacing: '0.20em', textTransform: 'uppercase', color: '#C85C44', marginBottom: '12px' }}>02 · Shield</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: '24px', color: CREAM, marginBottom: '14px' }}>Weakness Cluster Protection</div>
            <div style={{ color: CREAM2, fontSize: '13.5px', lineHeight: 1.6 }}>
              <p style={{ marginBottom: '12px' }}>Your lowest lines aren't just "areas for improvement" — they're <b style={{ color: CREAM, fontWeight: 600 }}>structural vulnerabilities</b> that can destroy everything your strengths have built. One weak line can collapse the entire system geometrically, not additively.</p>
              <p style={{ marginBottom: '12px' }}>We assess the <b style={{ color: CREAM, fontWeight: 600 }}>likelihood</b> of your weakness clusters threatening the system, then prescribe: identify, shield with structural protections, bolster through targeted training (permanent gains, per the research), and insure against worst-case scenarios.</p>
              <p>The evidence shows intelligence lines can be trained. The gains persist across decades. Your weaknesses are not destiny — but unattended, they control the outcome.</p>
            </div>
          </div>

          {/* Pillar 3: Complementary Matching */}
          <div className="rounded-[6px]" style={{ border: `1px solid ${LINE_C}`, padding: '28px 24px', background: `radial-gradient(300px 180px at 50% 0%, rgba(155,192,178,0.05), transparent 70%), ${INK}` }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', letterSpacing: '0.20em', textTransform: 'uppercase', color: JADE, marginBottom: '12px' }}>03 · Connect</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: '24px', color: CREAM, marginBottom: '14px' }}>Complementary Relationship Matching</div>
            <div style={{ color: CREAM2, fontSize: '13.5px', lineHeight: 1.6 }}>
              <p style={{ marginBottom: '12px' }}>We match you with members whose <b style={{ color: CREAM, fontWeight: 600 }}>strength clusters align with your weakness clusters</b> — and vice versa. By forming friendships and professional relationships with these people, their natural strengths begin to elevate your weak areas through proximity and collaboration.</p>
              <p style={{ marginBottom: '12px' }}>The relationship itself is the intervention. Sustained connection with someone strong in your weak area produces measurable, permanent improvement in that line — not through formal training, but through friendship and shared problem-solving.</p>
              <p>We offer members the opportunity to reach out, connect, and build genuine relationships as friends, colleagues, and accountability partners.</p>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          section:has([style*="repeat(3"]) .grid[style*="repeat(3"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

// ============================================================
// FINAL CTA
// ============================================================
function FinalCTA() {
  return (
    <section id="start" className="text-center" style={{ padding: 'clamp(64px,9vw,120px) 0', background: `radial-gradient(700px 380px at 50% 10%, rgba(224,198,140,0.10), transparent 65%)` }}>
      <div className="max-w-[1160px] mx-auto px-[clamp(20px,5vw,56px)]">
        <div className="flex justify-center mb-4" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.26em', textTransform: 'uppercase', color: CHAMPAGNE }}>
          Know your mind. Protect it. Maximize it.
        </div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, lineHeight: 1.02, fontSize: 'clamp(32px,5vw,54px)', letterSpacing: '-0.005em', color: CREAM, margin: '0 0 14px' }}>
          Discover your architecture. <em style={{ fontStyle: 'italic', color: CHAMPAGNE }}>Deploy it.</em>
        </h2>
        <p style={{ color: CREAM2, fontSize: 'clamp(14px,1.5vw,16px)', lineHeight: 1.6, maxWidth: '36em', margin: '0 auto 26px' }}>
          Start with your voice. Verify with evidence. Maximize your strength clusters. Shield your vulnerabilities. Connect with minds that complete yours.
        </p>
        <div className="flex gap-[14px] flex-wrap justify-center">
          <Link href="/assessment" className="inline-flex items-center gap-2 cursor-pointer border-0 no-underline rounded-[3px] transition-all duration-150 hover:-translate-y-[1px]" onClick={playClick}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '15px 30px', background: `linear-gradient(180deg,${CHAMPAGNE},${CHAMPAGNE_D})`, color: INK, fontWeight: 500, boxShadow: '0 6px 26px -10px rgba(224,198,140,0.6)', borderRadius: '3px', display: 'inline-block' }}>Begin the assessment — free</span>
          </Link>
          <Link href="/about" className="inline-flex items-center gap-2 cursor-pointer border rounded-[3px] no-underline transition-all duration-150 hover:border-[#E0C68C] hover:text-[#E0C68C]" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '15px 30px', background: 'transparent', color: CREAM, borderColor: LINE_C }}>
            Learn how it works
          </Link>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// HONEST FOOTER NOTE
// ============================================================
function HonestFooter() {
  return (
    <div style={{ borderTop: `1px solid ${LINE_C}`, padding: '34px 0 48px', background: INK }}>
      <div className="max-w-[1160px] mx-auto px-[clamp(20px,5vw,56px)] flex justify-between gap-5 flex-wrap items-start">
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: '23px', letterSpacing: '0.02em', color: CREAM }}>AQAL<b style={{ color: CHAMPAGNE, fontWeight: 600 }}>.</b></div>
        <div style={{ color: MUTED, fontSize: '12px', lineHeight: 1.6, maxWidth: '560px' }}>
          <b style={{ color: CREAM2, fontWeight: 500 }}>Honest note:</b> profile values shown here are illustrative. Real percentiles and the true covariance
          require Phase-2 population data before any aggregate or rarity read is final. The center number is a computed
          estimate built from your independent axes — not a fixed fact, and never a multiplied one.
        </div>
      </div>
    </div>
  );
}

// ============================================================
// RESEARCH LIBRARY — what makes it different (in kind, not size)
// ============================================================
const LIB_STATS = [
  { n: "5,000+", l: "research clusters" },
  { n: "10,000+", l: "verified sources" },
  { n: "0", l: "fabricated" },
  { n: "32", l: "lines mapped" },
];
const LIB_POINTS = [
  { t: "Honest by design", d: "The debunked myths are kept in and labeled — power posing, homeopathy, detox cleanses, the fish-oil legend — rated at the floor with the debunking source, never buried. About 3% of the library is flagged this way, and you can filter it in or out." },
  { t: "Global, not just Western", d: "Deliberately sourced beyond the usual WEIRD samples: East & Southeast Asia, the Nordics, Africa & the Middle East, Latin America, the Pacific, the Himalaya, and Indigenous cohorts — with every cross-cultural caveat stated." },
  { t: "Verdict-rated & searchable", d: "Every entry carries an honest gauge — how big the effect, how proven, how lasting — plus a validated-vs-debunked verdict you can toggle. Real safety costs (kava's liver risk, Ayurvedic heavy metals) are flagged too." },
  { t: "Individualized to you", d: "It isn't a reference dump. Once your 32 lines are measured, the library is filtered to the interventions that move your specific strengths and weaknesses toward the goals you name." },
];
function ResearchLibrarySection() {
  return (
    <section id="library" style={{ padding: 'clamp(56px,8vw,108px) 0', background: INK }}>
      <div className="max-w-[1160px] mx-auto px-[clamp(20px,5vw,56px)]">
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.26em', textTransform: 'uppercase', color: CHAMPAGNE, marginBottom: '16px' }}>
          The research library
        </div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, lineHeight: 1.02, fontSize: 'clamp(32px,5vw,54px)', letterSpacing: '-0.005em', color: CREAM, margin: '0 0 18px' }}>
          First of its kind — in <em style={{ fontStyle: 'italic', color: CHAMPAGNE }}>kind</em>, not size.
        </h2>
        <p style={{ color: CREAM2, fontSize: 'clamp(15px,1.7vw,18px)', lineHeight: 1.65, maxWidth: '46em' }}>
          Raw databases like PubMed hold millions of records — that isn't this, and we won't pretend it is. As a single, curated, plain-language library that rates every regimen <b style={{ color: CREAM, fontWeight: 600 }}>honestly</b> — the myths kept in and labeled, not hidden — sourced from around the world and tied to your 32 lines, we can't point to another one like it. Arguably first-of-its-kind in <b style={{ color: CREAM, fontWeight: 600 }}>kind</b>, not in raw count. That candor is the whole moat: it can't be faked, and the companies selling the debunked therapies can't copy it.
        </p>

        {/* Stat row */}
        <div className="grid gap-[clamp(12px,2vw,20px)] mt-[clamp(24px,3vw,40px)]" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
          {LIB_STATS.map((s) => (
            <div key={s.l} className="rounded-[6px] text-center" style={{ border: `1px solid ${LINE_C}`, padding: '22px 14px', background: `radial-gradient(360px 160px at 50% 0%, rgba(224,198,140,0.06), transparent 70%), ${INK2}` }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 'clamp(26px,4vw,40px)', lineHeight: 1, background: `linear-gradient(96deg,${CHAMPAGNE},${BRONZE})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.n}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9.5px', letterSpacing: '0.14em', textTransform: 'uppercase', color: CREAM2, marginTop: '10px' }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* Differentiators */}
        <div className="grid gap-[clamp(16px,2.5vw,26px)] mt-[clamp(20px,2.5vw,26px)]" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>
          {LIB_POINTS.map((p) => (
            <div key={p.t} className="rounded-[6px]" style={{ background: `linear-gradient(180deg,${INK2},${INK})`, border: `1px solid ${LINE_C}`, padding: '24px 26px' }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: '22px', marginBottom: '8px', color: CREAM }}>
                <span style={{ color: CHAMPAGNE, fontSize: '13px', marginRight: '9px', verticalAlign: 'middle' }}>◇</span>{p.t}
              </div>
              <div style={{ color: CREAM2, fontSize: '13.5px', lineHeight: 1.6 }}>{p.d}</div>
            </div>
          ))}
        </div>
        <div className="mt-[clamp(20px,2.5vw,28px)]">
          <Link href="/research-library"><span className="inline-flex items-center gap-[8px] cursor-pointer hover:opacity-80 transition-opacity" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: CHAMPAGNE }}><span className="w-[5px] h-[5px] rounded-full" style={{ background: JADE, boxShadow: `0 0 7px ${JADE}` }} /> Browse the library →</span></Link>
        </div>
      </div>
      <style>{`
        @media (max-width: 720px) {
          #library .grid[style*="repeat(2"] { grid-template-columns: 1fr !important; }
          #library .grid[style*="repeat(4"] { grid-template-columns: repeat(2,1fr) !important; }
        }
      `}</style>
    </section>
  );
}

// ============================================================
// COMPANION MODE — bring your person (optional, higher precision + fun)
// ============================================================
function CompanionSection() {
  return (
    <section id="companion" style={{ padding: 'clamp(56px,8vw,108px) 0', background: `linear-gradient(180deg,${INK2},${INK})`, borderTop: `1px solid ${LINE_C}`, borderBottom: `1px solid ${LINE_C}` }}>
      <div className="max-w-[1160px] mx-auto px-[clamp(20px,5vw,56px)]">
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.26em', textTransform: 'uppercase', color: CHAMPAGNE, marginBottom: '16px' }}>
          Companion mode · optional, recommended
        </div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, lineHeight: 1.02, fontSize: 'clamp(32px,5vw,54px)', letterSpacing: '-0.005em', color: CREAM, margin: '0 0 18px' }}>
          Bring your <em style={{ fontStyle: 'italic', color: CHAMPAGNE }}>person.</em>
        </h2>
        <p style={{ color: CREAM2, fontSize: 'clamp(15px,1.7vw,18px)', lineHeight: 1.65, maxWidth: '46em' }}>
          Take it solo for a private read — or bring your partner or closest friend and play it together. It isn't just more fun: the science says a person who knows you well reads your <b style={{ color: CREAM, fontWeight: 600 }}>outward</b> lines — humor, charm, influence, how you command a room — more accurately than you read yourself, while <b style={{ color: CREAM, fontWeight: 600 }}>you</b> stay the better judge of the inward ones. We keep both answers separate, score the gap, and the reveal — <i>"you rate your humor how high?"</i> — is the best part.
        </p>
        <div className="grid gap-[clamp(16px,2.5vw,26px)] mt-[clamp(24px,3vw,40px)]" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
          {[
            { t: "Sharper, not softer", d: "Your partner corrects the lines you're worst at rating for yourself — charm, humor, presence, leadership. Two honest signals beat one biased one." },
            { t: "The gap is the gold", d: "We don't blend the answers — we score the difference. A big gap between how you and they see a line is itself an insight (and the funniest moment of the night)." },
            { t: "Solo loses nothing", d: "Companion mode is a bonus, never a requirement. The solo assessment is the full experience — private questions stay private, and single members get everything." },
          ].map((c) => (
            <div key={c.t} className="rounded-[6px]" style={{ border: `1px solid ${LINE_C}`, padding: '26px 24px', background: `radial-gradient(300px 180px at 50% 0%, rgba(224,198,140,0.05), transparent 70%), ${INK}` }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: '22px', color: CREAM, marginBottom: '10px' }}>{c.t}</div>
              <div style={{ color: CREAM2, fontSize: '13.5px', lineHeight: 1.6 }}>{c.d}</div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 760px) {
          #companion .grid[style*="repeat(3"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

// ============================================================
// MAIN EXPORT
// ============================================================
export default function Home() {
  useScrollReveal();

  // Top-of-funnel instrumentation (best-effort; ignored if the API is down).
  const track = trpc.analytics.track.useMutation();
  useEffect(() => {
    track.mutate({ type: "landing_view" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen relative" style={{ background: INK }}>
      <PublicHeader />
      <div className="relative z-10">
        <HeroSection />
        <div data-reveal><FreeFoundingAccess /></div>
        <div data-reveal><ThesisSection /></div>
        <div data-reveal><DialSection /></div>
        <div data-reveal><EngineeringSection /></div>
        <div data-reveal><ProcessSection /></div>
        <div data-reveal><CompanionSection /></div>
        {SHOW_GENERATIONAL_RARITY && <div data-reveal><GenerationSection /></div>}
        <div data-reveal><EvidenceSection /></div>
        <div data-reveal><ResearchLibrarySection /></div>
        <div data-reveal><SamplesSection /></div>
        <div data-reveal><ServicePillars /></div>
        <div data-reveal><TestimonialsStrip /></div>
        <div data-reveal><FinalCTA /></div>
        <HonestFooter />
        <PublicFooter />
      </div>
    </div>
  );
}
