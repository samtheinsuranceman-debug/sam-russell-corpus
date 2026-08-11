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
import { useHeroVariant, currentHeroId } from "@/lib/heroExperiment";
import { ARCHETYPES } from "./archetypesData";
import { keystoneForLine } from "@shared/keystonePractices";
import { ALL_AXES } from "@shared/axisModes";

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
const CREAM2 = "#CFC5B0";
const MUTED = "#9C8F79";
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
// FREE FOUNDING ACCESS — email + a password of your choosing, no invite code.
// First N (FREE_ASSESSMENT_CAP) get the full assessment + membership free.
// First claim sets the password; returning sign-ins must match it.
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
    if (!passcode.trim()) { toast.error("Create a password — any password you'll remember."); return; }
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
        <p style={{ color: CREAM2, fontSize: 'clamp(15px,1.6vw,17px)', lineHeight: 1.6, maxWidth: '34em', margin: '0 auto 8px' }}>
          The first {cap ? cap.toLocaleString() : '10,000'} founding members get the full experience free — the voice
          assessment, the fully-underwritten multi-AI result, <b style={{ color: CREAM }}>and</b> the membership, no
          card ever. No invite code: just your email and a password you choose.
        </p>
        <p style={{ color: CREAM2, fontSize: 'clamp(12px,1.3vw,14px)', lineHeight: 1.55, maxWidth: '34em', margin: '0 auto 8px', opacity: 0.85 }}>
          Signing up <b style={{ color: CREAM }}>reserves</b> your spot for 14 days. <b style={{ color: CHAMPAGNE }}>Completing
          the assessment is what claims it — for life.</b> Membership is earned by finishing.
        </p>
        <p style={{ color: CREAM2, fontSize: 'clamp(12px,1.3vw,14px)', lineHeight: 1.55, maxWidth: '36em', margin: '0 auto 8px', opacity: 0.85 }}>
          This forum is for <b style={{ color: CREAM }}>intentional people</b> — the ones who keep their dreams alive with
          disciplined daily behavior instead of casual wishing. If that&rsquo;s you: welcome, founding member. And when it
          delivers for you, share it with the people you love — that&rsquo;s how this network gets built.
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
              placeholder="Create a password" autoComplete="new-password"
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
  const hero = useHeroVariant();
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
              {hero.lead}<em style={{ fontStyle: 'italic', background: `linear-gradient(96deg,${CHAMPAGNE},${BRONZE})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{hero.emph}</em>
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
              style={{ color: CREAM2, fontSize: 'clamp(16px,1.7vw,18px)', lineHeight: 1.6, maxWidth: '34em', margin: '18px 0 30px' }}
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
              <text style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }} fill={CREAM} x={CX} y={CY + 4} textAnchor="middle" fontSize="34">32 lines</text>
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
// FOUNDER STORY + INSURANCE THESIS — the section that screams.
// Ember accent (deliberately NOT the house gold) so the eye stops here.
// ============================================================
const EMBER = "#E2604A";
const EMBER_D = "#C85C44";

function WeakestLinkDiagram() {
  // A chain of strong links with one failing link — the whole thesis in one glance.
  return (
    <svg viewBox="0 0 560 84" style={{ width: '100%', maxWidth: '560px', display: 'block', margin: '0 auto' }} aria-label="A chain is only as strong as its weakest link">
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const weak = i === 4;
        return (
          <g key={i} transform={`translate(${20 + i * 78}, 42)`}>
            <ellipse className={weak ? "aq-pulse" : undefined} rx="34" ry="22" fill="none" stroke={weak ? EMBER : CHAMPAGNE} strokeWidth={weak ? 3 : 2} opacity={weak ? 1 : 0.55}
              strokeDasharray={weak ? "6 5" : "none"} />
            {weak && <text x="0" y="-32" textAnchor="middle" fill={EMBER} fontSize="11" fontFamily="'JetBrains Mono', monospace" letterSpacing="0.1em">THE ONE THAT SNAPS</text>}
          </g>
        );
      })}
      <text x="280" y="80" textAnchor="middle" fill={CREAM2} fontSize="11" fontFamily="'JetBrains Mono', monospace" letterSpacing="0.08em" opacity="0.7">
        YOUR OUTCOMES RUN AT THE STRENGTH OF YOUR WEAKEST LINE — NOT YOUR STRONGEST
      </text>
    </svg>
  );
}

// The treatment arc: an untreated line stays flat; a prescribed practice bends it up.
function TreatmentArcDiagram() {
  return (
    <svg viewBox="0 0 640 140" style={{ width: '100%', maxWidth: '640px', display: 'block', margin: '0 auto' }} aria-label="Untreated, a weak line stays flat — with a prescribed practice it rises">
      {[30, 60, 90].map((y) => (
        <line key={y} x1="36" y1={y} x2="616" y2={y} stroke={CREAM} strokeOpacity="0.06" strokeWidth="1" />
      ))}
      {/* untreated: flat, ember, dashed */}
      <path d="M 36 96 C 180 94 420 98 616 96" stroke={EMBER} strokeWidth="2" fill="none" strokeDasharray="6 5" opacity="0.75" />
      <text x="612" y="112" textAnchor="end" fill={EMBER} fontSize="10.5" fontFamily="'JetBrains Mono', monospace" letterSpacing="0.1em" opacity="0.9">UNTREATED — FLAT FOR DECADES</text>
      {/* treated: rises after the prescription lands */}
      <path d="M 36 96 C 140 96 180 92 232 84 C 330 68 480 44 616 26" stroke={CHAMPAGNE} strokeWidth="2.4" fill="none" />
      <circle className="aq-pulse" cx="232" cy="84" r="10" fill={`${CHAMPAGNE}22`} stroke={CHAMPAGNE} strokeWidth="1.6" />
      <text x="232" y="88" textAnchor="middle" fill={CHAMPAGNE} fontSize="9" fontFamily="'JetBrains Mono', monospace">Rx</text>
      <text x="232" y="64" textAnchor="middle" fill={CREAM2} fontSize="10.5" fontFamily="'JetBrains Mono', monospace" letterSpacing="0.08em">PRESCRIBED PRACTICE STARTS</text>
      <circle cx="616" cy="26" r="4.5" fill={CHAMPAGNE} />
      <text x="612" y="16" textAnchor="end" fill={CREAM} fontSize="10.5" fontFamily="'JetBrains Mono', monospace" letterSpacing="0.1em">TRAINED — GAINS PERSIST</text>
      <text x="320" y="134" textAnchor="middle" fill={CREAM2} fontSize="11" fontFamily="'JetBrains Mono', monospace" letterSpacing="0.08em" opacity="0.8">
        THE RESEARCH IS CLEAR: LINES CAN BE TRAINED — AND THE GAINS HOLD
      </text>
    </svg>
  );
}

function ThirtyDayLoopDiagram() {
  // The monthly engineering cycle: Assess → Prescribe → Practice → Track → Re-map.
  const steps = ["ASSESS", "PRESCRIBE", "PRACTICE", "TRACK", "RE-MAP"];
  return (
    <svg viewBox="0 0 640 120" style={{ width: '100%', maxWidth: '640px', display: 'block', margin: '0 auto' }} aria-label="The 30-day engineering loop">
      {steps.map((s, i) => (
        <g key={s} transform={`translate(${28 + i * 124}, 46)`}>
          <rect x="-2" y="-20" width="104" height="40" rx="20" fill="none" stroke={CHAMPAGNE} strokeWidth="1.5" opacity="0.75" />
          <text x="50" y="5" textAnchor="middle" fill={CREAM} fontSize="12" fontFamily="'JetBrains Mono', monospace" letterSpacing="0.08em">{s}</text>
          {i < steps.length - 1 && <path d={`M 106 0 L 118 0 M 113 -5 L 119 0 L 113 5`} stroke={CHAMPAGNE} strokeWidth="1.5" fill="none" opacity="0.6" />}
        </g>
      ))}
      <path className="aq-dash" d="M 580 66 Q 610 100 320 104 Q 30 100 40 70" stroke={EMBER} strokeWidth="1.5" fill="none" opacity="0.7" strokeDasharray="4 4" />
      <text x="320" y="118" textAnchor="middle" fill={CREAM2} fontSize="11" fontFamily="'JetBrains Mono', monospace" letterSpacing="0.08em" opacity="0.8">
        EVERY 30 DAYS — YOUR MAP UPDATES FROM WHAT YOU ACTUALLY DID
      </text>
    </svg>
  );
}

// Editorial act break — a hairline with a centered diamond, marking the page's movements.
function ActDivider() {
  return (
    <div aria-hidden="true" style={{ position: 'relative', maxWidth: '1160px', margin: '0 auto', padding: '0 clamp(20px,5vw,56px)' }}>
      <div className="section-divider" style={{ margin: '0' }} />
      <span style={{
        position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
        color: CHAMPAGNE, fontSize: '11px', background: INK, padding: '0 14px', letterSpacing: '0.1em',
      }}>◇</span>
    </div>
  );
}

// ============================================================
// THE TEN PROMISES — what's in it for you, before any detail.
// The founder's ten strongest scripts, in their persuasion order:
// promise → stakes → honesty → summary → fun → proof → belonging
// → science → offer → fear. Sits right under the hero, ahead of
// the 32-line dial, so a visitor knows what the machine DOES
// before they meet its parts.
// ============================================================

const TEN_PROMISES: { arc: string; title: string; text: string; accent: string }[] = [
  { arc: "The Promise", title: "The Direct Hit", accent: "#E0C68C",
    text: "Tell us your 10 biggest life goals. We'll tell you exactly how long each one will take, what's standing in your way, and which ones you should abandon before they waste another decade of your life. Then we'll engineer the fastest path to the ones worth keeping — using more data about your actual capabilities than any therapist, coach, or mentor has ever had. This is outcome engineering. You're the first generation to have it." },
  { arc: "The Stakes", title: "The Uninsured Mind", accent: "#E2604A",
    text: "You insure your car, your house, and your phone. Your mind — the machine that produces your marriage, your money, your health, and every outcome you'll ever have — runs uninsured, unmeasured, and unmaintained. Isn't that odd? Fix it in 30 days, one fun question at a time. The first 10,000 do it free, for life." },
  { arc: "The Honesty", title: "What You'll Never Be Good At", accent: "#E0C68C",
    text: "Every other platform tells you you can be anything. We're the only one honest enough to tell you what you'd be fighting your own wiring to become — and what to build instead. Low persuasion, low volitional, low financial self-management? Business ownership will eat you alive. But consulting might fit you like a glove — same authority, same expertise, none of the parts you're missing." },
  { arc: "The Whole Machine", title: "In One Breath", accent: "#E0C68C",
    text: "We measure everything your life runs on, tell you the truth about it, prescribe what the research proves works, track you every 30 days, and surround you with the people your mind has been looking for. First 10,000: free for life." },
  { arc: "The Experience", title: "The Test You'll Miss When It's Over", accent: "#9BC0B2",
    text: "IQ tests ask if you know what seven plus three is. Dating sites give you multiple choice. We hand you a private island, $80 million, and 180 days — and listen to what you build. Thirty questions, one a day for a month, each engineered to be the most fun conversation you've had with yourself in years." },
  { arc: "The Proof of Teeth", title: "The Clock Doesn't Lie", accent: "#E2604A",
    text: "Say you want five kids, then log zero hours meeting anyone for six months — and your clock will tell you: at this pace, never. That honesty stings once. Wasting a decade stings forever. The clock responds to effort, which means you control the clock." },
  { arc: "The Belonging", title: "Your Village", accent: "#9BC0B2",
    text: "If you're high in existential, moral, and linguistic intelligence, almost nobody around you can meet you where you think. We connect you with dozens of people whose minds run exactly where yours does — instant peers, conversations you've been starving for, a village where you finally fit. Whatever your highs are, your village exists here." },
  { arc: "The Science", title: "The Second Village", accent: "#9BC0B2",
    text: "Then there's the second village — the people whose strengths are your weaknesses, and whose weaknesses are your strengths. The research is real: sustained proximity to someone strong where you're weak measurably grows that line in you. Every friendship in this village upgrades both of you, automatically, just by existing." },
  { arc: "The Offer", title: "Free For Life, In Writing", accent: "#E0C68C",
    text: "The first 10,000 members get the entire platform free — lifetime. It's written into the user agreement; there is no going back on it. We're not discounting; we're choosing our founders. One condition: membership is earned by finishing your assessment." },
  { arc: "The Warning", title: "Blind Spots Bankrupt", accent: "#E2604A",
    text: "Nobody loses their marriage, their savings, and their health because their strengths failed. They lose it all to a weakness they were blind to — firing at the worst moment, unmanaged, unwatched. We find yours before it finds you." },
];

function TenPromisesSection() {
  const [first, ...rest] = TEN_PROMISES;
  return (
    <section style={{ background: `radial-gradient(760px 380px at 50% 0%, rgba(224,198,140,0.06), transparent 62%), linear-gradient(180deg,${INK},${INK2})`, borderTop: `1px solid ${LINE_C}`, borderBottom: `1px solid ${LINE_C}`, padding: 'clamp(56px,8vw,104px) 0' }}>
      <div className="max-w-[1160px] mx-auto px-[clamp(20px,5vw,56px)]">
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', letterSpacing: '0.26em', textTransform: 'uppercase', color: CHAMPAGNE, margin: '0 0 14px' }}>
          What this platform does for you · in ten statements
        </p>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: 'clamp(30px,4.6vw,52px)', lineHeight: 1.06, color: CREAM, margin: '0 0 10px', maxWidth: '18em' }}>
          Before the thirty-two lines — here&rsquo;s what&rsquo;s in it for you.
        </h2>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', letterSpacing: '0.1em', color: MUTED, margin: '0 0 36px' }}>
          Read these ten. If none of them lands, this isn&rsquo;t your platform. If one of them does — keep scrolling.
        </p>

        {/* #1 — full-width feature card */}
        <div style={{ position: 'relative', border: `1px solid ${first.accent}55`, borderLeft: `3px solid ${first.accent}`, borderRadius: '16px', background: 'rgba(224,198,140,0.05)', padding: 'clamp(24px,3.5vw,40px)', marginBottom: '18px' }}>
          <div className="flex items-baseline gap-4 flex-wrap" style={{ marginBottom: '12px' }}>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: 'clamp(34px,4vw,48px)', lineHeight: 1, color: first.accent }}>01</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase', color: first.accent }}>{first.arc}</span>
            <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: 'clamp(22px,2.6vw,30px)', color: CREAM }}>{first.title}</span>
          </div>
          <p style={{ fontSize: 'clamp(17px,2vw,21px)', lineHeight: 1.6, color: CREAM, margin: 0, maxWidth: '52em' }}>{first.text}</p>
        </div>

        {/* #2–#10 — two-column ledger */}
        <div className="aq-ten-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
          {rest.map((p, i) => (
            <div key={p.title} style={{ border: `1px solid ${LINE_C}`, borderLeft: `3px solid ${p.accent}`, borderRadius: '14px', background: INK2, padding: 'clamp(20px,2.6vw,28px)' }}>
              <div className="flex items-baseline gap-3 flex-wrap" style={{ marginBottom: '10px' }}>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: '30px', lineHeight: 1, color: p.accent }}>{String(i + 2).padStart(2, '0')}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9.5px', letterSpacing: '0.2em', textTransform: 'uppercase', color: p.accent }}>{p.arc}</span>
              </div>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: 'clamp(20px,2.2vw,24px)', lineHeight: 1.15, color: CREAM, margin: '0 0 8px' }}>{p.title}</p>
              <p style={{ fontSize: 'clamp(15px,1.6vw,17px)', lineHeight: 1.65, color: CREAM2, margin: 0 }}>{p.text}</p>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 820px) {
          .aq-ten-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

// §2 THE PROBLEM — the founder story, the hook.
function FounderStorySection() {
  return (
    <section style={{ background: `radial-gradient(720px 340px at 18% 0%, rgba(226,96,74,0.07), transparent 62%), linear-gradient(180deg,${INK},${INK2})`, borderTop: `2px solid ${EMBER_D}`, borderBottom: `1px solid ${LINE_C}`, padding: 'clamp(56px,8vw,104px) 0' }}>
      <div className="max-w-[1160px] mx-auto px-[clamp(20px,5vw,56px)]">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', letterSpacing: '0.28em', textTransform: 'uppercase', color: EMBER, marginBottom: '18px' }}>
          <span className="aq-pulse" style={{ width: '7px', height: '7px', borderRadius: '999px', background: EMBER, boxShadow: `0 0 9px ${EMBER}`, flex: 'none' }} />
          From the founder — read this before you start
        </div>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: 'clamp(30px,5vw,54px)', lineHeight: 1.06, color: CREAM, margin: '0 0 22px' }}>
          My strengths never failed me.<br />
          <span style={{ color: EMBER }}>My unmanaged weaknesses cost me fortunes.</span>
        </p>
        <div style={{ color: CREAM2, fontSize: 'clamp(16px,1.7vw,18px)', lineHeight: 1.7, maxWidth: '46em' }}>
          <p style={{ margin: '0 0 16px' }}>
            I test exceptionally high across almost every line of intelligence — and it didn&rsquo;t save me. I followed
            the best-selling advice of the strengths-finder movement: <em>maximize your strengths, mostly ignore your
            weaknesses.</em> It gave me an unbalanced way of navigating the world. I fell flat on my face a dozen times —
            money, romantic relationships, friendships — and it never mattered how high, strong, or integrated my
            strength clusters were. <b style={{ color: CREAM }}>They were null and void the moment a blind-spotted weak
            cluster activated at the exact wrong time, in the exact wrong place, with the exact wrong people.</b>
          </p>
          <p style={{ margin: 0 }}>
            That insight — learned the expensive way — is what this entire platform is built on.
          </p>
        </div>
      </div>
    </section>
  );
}

// §3 THE MECHANISM — Master Weakness: one weakness holds the cluster in place.
function MasterWeaknessDiagram() {
  const sats = [[-120, -34], [-72, 44], [0, -52], [76, 42], [124, -28], [30, 58]];
  return (
    <svg viewBox="0 0 340 150" style={{ width: '100%', maxWidth: '420px', display: 'block', margin: '0 auto' }} aria-label="One master weakness holds the other weaknesses in place">
      <g transform="translate(170,72)">
        {sats.map(([x, y], i) => (
          <g key={i}>
            <line x1="0" y1="0" x2={x} y2={y} stroke={EMBER} strokeWidth="1" opacity="0.45" strokeDasharray="3 3" />
            <circle cx={x} cy={y} r="11" fill="none" stroke={CREAM2} strokeWidth="1.2" opacity="0.55" />
          </g>
        ))}
        <circle className="aq-pulse" r="24" fill={`${EMBER}22`} stroke={EMBER} strokeWidth="2.5" />
        <text y="4" textAnchor="middle" fill={EMBER} fontSize="9" fontFamily="'JetBrains Mono', monospace" letterSpacing="0.05em">MASTER</text>
      </g>
      <text x="170" y="144" textAnchor="middle" fill={CREAM2} fontSize="10.5" fontFamily="'JetBrains Mono', monospace" letterSpacing="0.08em" opacity="0.8">
        ONE WEAKNESS HOLDS THE OTHERS IN PLACE — NEUTRALIZE IT FIRST
      </text>
    </svg>
  );
}

function MechanismSection() {
  return (
    <section style={{ background: `radial-gradient(720px 360px at 82% 18%, rgba(224,198,140,0.055), transparent 62%), linear-gradient(180deg,${INK2},${INK})`, borderBottom: `1px solid ${LINE_C}`, padding: 'clamp(56px,8vw,104px) 0' }}>
      <div className="max-w-[1160px] mx-auto px-[clamp(20px,5vw,56px)]">
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.26em', textTransform: 'uppercase', color: CHAMPAGNE, marginBottom: '14px' }}>
          The mechanism · the Master Weakness
        </div>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: 'clamp(28px,4.5vw,46px)', lineHeight: 1.06, color: CREAM, margin: '0 0 18px' }}>
          Your weaknesses aren&rsquo;t a list.<br />They&rsquo;re a system — with a ringleader.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 'clamp(24px,4vw,48px)', alignItems: 'center' }}>
          <div style={{ color: CREAM2, fontSize: 'clamp(15.5px,1.6vw,17px)', lineHeight: 1.68 }}>
            <p style={{ margin: '0 0 14px' }}>
              We map your mind as <b style={{ color: CREAM }}>32 distinct lines of intelligence</b> — not one number.
              Your weak lines don&rsquo;t just sit there independently: they reinforce each other, and in almost every
              profile <b style={{ color: EMBER }}>one Master Weakness has controlling influence over the rest</b>,
              keeping them locked in place like a keystone holds an arch.
            </p>
            <p style={{ margin: 0 }}>
              Attack weaknesses at random and the system snaps back. Identify the Master Weakness, neutralize it first
              with targeted practice, and the whole cluster loosens — <b style={{ color: CREAM }}>that&rsquo;s why the
              order of work matters more than the amount of work.</b>
            </p>
          </div>
          <MasterWeaknessDiagram />
        </div>
        <div style={{ margin: '30px 0 0' }}><WeakestLinkDiagram /></div>
      </div>
    </section>
  );
}

// §5 THE INSURANCE METAPHOR — seat belts, airbags, the isn't-it-odd challenge.
function InsuranceSection() {
  return (
    <section style={{ background: `radial-gradient(720px 340px at 22% 8%, rgba(226,96,74,0.06), transparent 62%), linear-gradient(180deg,${INK},${INK2})`, borderTop: `1px solid ${LINE_C}`, borderBottom: `1px solid ${LINE_C}`, padding: 'clamp(56px,8vw,104px) 0' }}>
      <div className="max-w-[1160px] mx-auto px-[clamp(20px,5vw,56px)]">
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.26em', textTransform: 'uppercase', color: EMBER, marginBottom: '14px' }}>
          This is insurance for your future
        </div>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: 'clamp(28px,4.5vw,46px)', lineHeight: 1.06, color: CREAM, margin: '0 0 18px' }}>
          It doesn&rsquo;t matter how fast you&rsquo;re driving<br />
          <span style={{ color: EMBER }}>if you run out of gas in the desert.</span>
        </p>
        <div style={{ color: CREAM2, fontSize: 'clamp(15.5px,1.6vw,17px)', lineHeight: 1.68, maxWidth: '46em' }}>
          <p style={{ margin: '0 0 14px' }}>
            One careless, multitasked mistake can set you back five years. So we work like safety engineers: the right
            <b style={{ color: CREAM }}> traction tires</b> for your specific road, <b style={{ color: CREAM }}>seat
            belts fastened around your weaknesses</b> so they can&rsquo;t move against you, and
            <b style={{ color: CREAM }}> airbags installed between you and your goals</b> — so when the worst happens,
            you shake it off and get back to business instead of starting over. Without a safety net, your most
            precious hopes — best parent, best spouse, provider, community leader — sit permanently exposed to sudden,
            unexpected failure.
          </p>
          <p style={{ margin: '0 0 14px' }}>
            Isn&rsquo;t it odd? <b style={{ color: CREAM }}>Roughly half of first marriages end — well over half of
            second marriages</b> — and yet people who happily pay every month to insure a car will spend nothing to
            limit the risk on their most important relationships. Couples slide into corrosive communication patterns
            and <em>neither brain registers the red flag</em> — because when we&rsquo;re sliding toward collapse, we are
            neurologically inclined to miss our own downward trajectory.
          </p>
          <p style={{ margin: 0 }}>
            The fix isn&rsquo;t vigilance-by-willpower. It&rsquo;s <b style={{ color: CREAM }}>monitoring the sources of
            failure every 30 days</b> — deliberately, on a system, before the slide gets steep.
          </p>
        </div>
      </div>
    </section>
  );
}

// §6 THE PROTOCOL — the subscription loop that actually delivers.
function ProtocolSection() {
  return (
    <section style={{ background: `radial-gradient(760px 380px at 50% 100%, rgba(224,198,140,0.06), transparent 65%), linear-gradient(180deg,${INK2},${INK})`, borderBottom: `1px solid ${LINE_C}`, padding: 'clamp(56px,8vw,104px) 0' }}>
      <div className="max-w-[1160px] mx-auto px-[clamp(20px,5vw,56px)]">
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.26em', textTransform: 'uppercase', color: CHAMPAGNE, marginBottom: '14px' }}>
          The protocol · every 30 days
        </div>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: 'clamp(28px,4.5vw,46px)', lineHeight: 1.06, color: CREAM, margin: '0 0 18px' }}>
          5&ndash;7 peer-reviewed practices.<br />You choose which become habits.
        </p>
        <p style={{ color: CREAM2, fontSize: 'clamp(15.5px,1.6vw,17px)', lineHeight: 1.68, maxWidth: '44em', margin: '0 0 26px' }}>
          Every 30 days your profile prescribes a short menu of clinically studied practices matched to your shape and
          your goals — high-resolution suggestions, never homework. Your tracker catalogs the frequency, duration, and
          intensity of what you actually did, and next month&rsquo;s re-assessment re-maps your profile from it.
          <b style={{ color: CREAM }}> Watch the shape of your own mind change, month over month.</b>{" "}
          <b style={{ color: EMBER }}>That is outcome engineering.</b>
        </p>
        <ThirtyDayLoopDiagram />
        <div style={{ margin: '34px 0 0' }}><TreatmentArcDiagram /></div>
      </div>
    </section>
  );
}

// ============================================================
// ARCHETYPE SHOWCASE — real documented patterns + the prescribed fix
// ============================================================
// Mini 32-line "spectrum" — the archetype's whole shape in one glance:
// tall champagne bars = the gift, short ember bars = the line that sabotages it.
function ArchetypeSpectrum({ high, low }: { high: string[]; low: string[] }) {
  const bars = ALL_AXES.map((axis, i) => {
    const isHigh = high.includes(axis);
    const isLow = low.includes(axis);
    const seed = (axis.charCodeAt(0) * 7 + i * 13) % 10; // stable per-axis mid height
    return {
      h: isHigh ? 30 : isLow ? 5 : 12 + seed,
      c: isHigh ? CHAMPAGNE : isLow ? EMBER : "rgba(241,234,219,0.22)",
      glow: isHigh || isLow,
    };
  });
  return (
    <svg viewBox="0 0 224 38" style={{ width: "100%", height: "38px", display: "block" }} aria-hidden="true">
      {bars.map((b, i) => (
        <rect key={i} className="aq-rise" style={{ animationDelay: `${i * 22}ms` }}
          x={i * 7} y={36 - b.h} width="5" height={b.h} rx="1.5" fill={b.c} opacity={b.glow ? 0.95 : 0.8} />
      ))}
    </svg>
  );
}

function ArchetypeShowcaseSection() {
  const picks = [
    ARCHETYPES.find((a) => a.name.includes("Derailed Executive")),
    ARCHETYPES.find((a) => a.name.includes("Leaky Bucket")),
    ARCHETYPES.find((a) => a.name.includes("Burned-Out Empath")),
    ARCHETYPES.find((a) => a.name.includes("Planner Who Never Ships")),
  ].filter(Boolean) as typeof ARCHETYPES;
  const firstSentence = (s: string) => { const m = s.match(/^.*?[.!?](\s|$)/); return (m ? m[0] : s).trim(); };
  return (
    <section style={{ background: `linear-gradient(180deg,${INK2},${INK})`, borderBottom: `1px solid ${LINE_C}`, padding: 'clamp(56px,8vw,104px) 0' }}>
      <div className="max-w-[1160px] mx-auto px-[clamp(20px,5vw,56px)]">
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.26em', textTransform: 'uppercase', color: CHAMPAGNE, marginBottom: '14px' }}>
          240+ documented archetypes · which one is quietly running you?
        </div>
        <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: 'clamp(28px,4.5vw,46px)', lineHeight: 1.06, color: CREAM, margin: '0 0 14px' }}>
          We don&rsquo;t just name the pattern. We prescribe the fix.
        </p>
        <p style={{ color: CREAM2, fontSize: 'clamp(15px,1.6vw,17px)', lineHeight: 1.6, maxWidth: '42em', margin: '0 0 32px' }}>
          Each archetype below is documented in peer-reviewed research — a strength profile with a specific weakness
          that predictably sabotages it, and the evidence-based practice that works on the system itself.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: '16px' }}>
          {picks.map((a) => {
            const lowLine = a.lowLines?.[0];
            const rx = lowLine ? keystoneForLine(lowLine) : undefined;
            return (
              <div key={a.id} className="transition-all duration-200 hover:-translate-y-[3px]" style={{ border: `1px solid ${LINE_C}`, borderRadius: '14px', padding: '20px', background: 'rgba(241,234,219,0.03)' }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: '20px', color: CREAM, marginBottom: '8px' }}>{a.name}</div>
                <div style={{ marginBottom: '10px' }}><ArchetypeSpectrum high={a.highLines} low={a.lowLines} /></div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '10px' }}>
                  {a.highLines.slice(0, 3).map((l) => (
                    <span key={l} style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '999px', border: `1px solid ${CHAMPAGNE}55`, color: CHAMPAGNE }}>{l}</span>
                  ))}
                  {a.lowLines.slice(0, 2).map((l) => (
                    <span key={l} style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '999px', border: `1px solid ${EMBER}66`, color: EMBER }}>low {l}</span>
                  ))}
                </div>
                <p style={{ color: CREAM2, fontSize: '14px', lineHeight: 1.55, margin: '0 0 10px' }}>
                  <span style={{ color: EMBER }}>The threat: </span>{firstSentence(a.untreatedTrajectory)}
                </p>
                <p style={{ color: CREAM2, fontSize: '14px', lineHeight: 1.55, margin: 0 }}>
                  <span style={{ color: CHAMPAGNE }}>The prescription: </span>
                  {rx ? `${rx.name} — ${rx.evidence.toLowerCase()} evidence.` : firstSentence(a.connectionCase)}
                </p>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: '24px' }}>
          <Link href="/archetypes" className="no-underline" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: CHAMPAGNE, borderBottom: `1px solid ${CHAMPAGNE}66`, paddingBottom: '2px' }}>
          See all 240+ archetypes and the research behind them →
          </Link>
        </div>
      </div>
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
        <p style={{ color: CREAM2, fontSize: 'clamp(16px,1.7vw,18px)', lineHeight: 1.65, maxWidth: '40em' }}>
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
        <p style={{ color: CREAM2, fontSize: 'clamp(16px,1.7vw,18px)', lineHeight: 1.65, maxWidth: '42em', margin: '0 0 36px' }}>
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
              <div style={{ color: CHAMPAGNE, letterSpacing: '2px', fontSize: '14px', marginBottom: '12px' }}>
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
        <p style={{ color: CREAM2, fontSize: 'clamp(16px,1.7vw,18px)', lineHeight: 1.65, maxWidth: '44em', margin: '0 0 40px' }}>
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
        <p style={{ color: CREAM2, fontSize: 'clamp(16px,1.7vw,18px)', lineHeight: 1.65, maxWidth: '40em' }}>
          Every intelligence, plotted in its honest mode — and read as one aggregate. The <b style={{ color: CREAM, fontWeight: 600 }}>independent axes</b> are ringed; they're the lines a single IQ score never even sees. Hover any point to read it — this is the map you walk away with.
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
              <text style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '8px', letterSpacing: '0.10em' }} fill={MUTED} x={CX} y={CY + 32} textAnchor="middle">32 LINES · ONE SYSTEM</text>
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
        <p style={{ color: CREAM2, fontSize: 'clamp(16px,1.7vw,18px)', lineHeight: 1.65, maxWidth: '40em' }}>
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
        <p style={{ color: CREAM2, fontSize: 'clamp(16px,1.7vw,18px)', lineHeight: 1.65, maxWidth: '40em' }}>
          An aggregate score is only worth having if it's honest. Here's what keeps ours from becoming the hype it's surrounded by.
        </p>
        <div className="grid gap-[clamp(16px,2.5vw,26px)] mt-[clamp(24px,3vw,44px)]" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>
          {EVIDENCE.map((e) => (
            <div key={e.t} className="rounded-[6px] transition-all duration-200 hover:-translate-y-[2px]" style={{ background: `linear-gradient(180deg,${INK2},${INK})`, border: `1px solid ${LINE_C}`, padding: '24px 26px' }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: '22px', marginBottom: '8px', color: CREAM }}>
                <span style={{ color: CHAMPAGNE, fontSize: '14px', marginRight: '9px', verticalAlign: 'middle' }}>◇</span>{e.t}
              </div>
              <div style={{ color: CREAM2, fontSize: '14.5px', lineHeight: 1.6 }}>{e.d}</div>
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
        <p style={{ color: CREAM2, fontSize: 'clamp(16px,1.7vw,18px)', lineHeight: 1.65, maxWidth: '40em' }}>
          The rarest valuable minds aren't spiked in one thing and hollow everywhere else. They're elevated across many independent lines at once — a combination that's both hard to find and genuinely powerful.
        </p>
        <div className="grid gap-[clamp(16px,2.5vw,26px)] mt-[clamp(24px,3vw,40px)]" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
          {SAMPLES.map((s) => (
            <div key={s.rarity} className="rounded-[6px] text-center" style={{ border: `1px solid ${LINE_C}`, padding: '26px', background: `radial-gradient(420px 200px at 50% 0%, rgba(224,198,140,0.06), transparent 70%), ${INK2}` }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 'clamp(30px,4.5vw,44px)', lineHeight: 1, background: `linear-gradient(96deg,${CHAMPAGNE},${BRONZE})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.rarity}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: CREAM, margin: '14px 0 8px' }}>{s.shape}</div>
              <div style={{ color: CREAM2, fontSize: '14px', lineHeight: 1.55 }}>{s.desc}</div>
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
// Pillar glyphs — each pillar's mechanism drawn, not just described.

// 01 · Maximize: a strength CLUSTER — high lines wired together, amplifying.
function ClusterGlyph() {
  const nodes: [number, number, number][] = [[70, 20, 7], [130, 34, 9], [40, 52, 6], [100, 62, 11], [160, 66, 6], [66, 78, 7]];
  return (
    <svg viewBox="0 0 200 96" style={{ width: '100%', height: '84px', display: 'block' }} aria-hidden="true">
      {nodes.map(([x1, y1], i) => nodes.slice(i + 1).map(([x2, y2], j) => (
        <line key={`${i}-${j}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={CHAMPAGNE} strokeWidth="1" opacity="0.28" />
      )))}
      {nodes.map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r + 4} fill={`${CHAMPAGNE}18`} />
          <circle className={i === 3 ? "aq-pulse" : undefined} cx={x} cy={y} r={r} fill="none" stroke={CHAMPAGNE} strokeWidth="1.6" opacity={0.85} />
        </g>
      ))}
    </svg>
  );
}

// 02 · Shield: the weak line belted inside a protective arc — it can't move against you.
function ShieldGlyph() {
  return (
    <svg viewBox="0 0 200 96" style={{ width: '100%', height: '84px', display: 'block' }} aria-hidden="true">
      <path d="M 100 8 C 132 18 152 18 158 24 C 158 60 136 80 100 90 C 64 80 42 60 42 24 C 48 18 68 18 100 8 Z"
        fill="rgba(224,198,140,0.05)" stroke={CHAMPAGNE} strokeWidth="1.6" opacity="0.85" />
      <circle className="aq-pulse" cx="100" cy="48" r="13" fill={`${EMBER}22`} stroke={EMBER} strokeWidth="2" strokeDasharray="4 3" />
      <path d="M 74 48 L 87 48 M 113 48 L 126 48" stroke={CHAMPAGNE} strokeWidth="2.4" strokeLinecap="round" opacity="0.9" />
      <path d="M 100 22 L 100 35 M 100 61 L 100 74" stroke={CHAMPAGNE} strokeWidth="2.4" strokeLinecap="round" opacity="0.9" />
    </svg>
  );
}

// 03 · Connect: two profiles interlocking — their peak lands exactly on your gap.
function MatchGlyph() {
  const yours = [26, 12, 30, 6, 24];  // bar heights; index 3 is the gap
  const theirs = [10, 22, 8, 30, 12]; // index 3 is their peak
  return (
    <svg viewBox="0 0 200 96" style={{ width: '100%', height: '84px', display: 'block' }} aria-hidden="true">
      {yours.map((h, i) => (
        <rect key={`y${i}`} x={26 + i * 13} y={64 - h} width="9" height={h} rx="2"
          fill={i === 3 ? EMBER : CHAMPAGNE} opacity={i === 3 ? 0.95 : 0.75} />
      ))}
      {theirs.map((h, i) => (
        <rect key={`t${i}`} x={112 + i * 13} y={64 - h} width="9" height={h} rx="2"
          fill={i === 3 ? JADE : "rgba(241,234,219,0.35)"} opacity={i === 3 ? 0.95 : 0.8} />
      ))}
      <path className="aq-dash" d="M 169 32 C 150 6 90 6 74 52" stroke={JADE} strokeWidth="1.6" fill="none" strokeDasharray="5 4" opacity="0.9" />
      <path d="M 78 44 L 74 53 L 83 51" stroke={JADE} strokeWidth="1.6" fill="none" opacity="0.9" />
      <text x="52" y="80" textAnchor="middle" fill={CREAM2} fontSize="9" fontFamily="'JetBrains Mono', monospace" letterSpacing="0.1em">YOU</text>
      <text x="144" y="80" textAnchor="middle" fill={CREAM2} fontSize="9" fontFamily="'JetBrains Mono', monospace" letterSpacing="0.1em">YOUR MATCH</text>
    </svg>
  );
}

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
        <p style={{ color: CREAM2, fontSize: 'clamp(16px,1.7vw,18px)', lineHeight: 1.65, maxWidth: '40em', marginBottom: 'clamp(32px,4vw,56px)' }}>
          Knowing your 32-line architecture is the beginning. What matters is what you do with it — and what it does for you when properly deployed.
        </p>

        {/* Three pillars */}
        <div className="grid gap-[clamp(20px,3vw,32px)]" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
          {/* Pillar 1: Strength Maximization */}
          <div className="rounded-[6px]" style={{ border: `1px solid ${LINE_C}`, padding: '28px 24px', background: `radial-gradient(300px 180px at 50% 0%, rgba(224,198,140,0.05), transparent 70%), ${INK}` }}>
            <ClusterGlyph />
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', letterSpacing: '0.20em', textTransform: 'uppercase', color: CHAMPAGNE, margin: '10px 0 12px' }}>01 · Maximize</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: '24px', color: CREAM, marginBottom: '14px' }}>Strength Cluster Optimization</div>
            <div style={{ color: CREAM2, fontSize: '14.5px', lineHeight: 1.6 }}>
              <p style={{ marginBottom: '12px' }}>Your highest lines form <b style={{ color: CREAM, fontWeight: 600 }}>strength clusters</b> — groups that amplify each other when used together. We identify these clusters and show you how to deploy them toward your stated goals.</p>
              <p style={{ marginBottom: '12px' }}>The <b style={{ color: CREAM, fontWeight: 600 }}>second-order effects</b> of combining your top lines optimally are often more powerful than any individual strength. Strategic × Interpersonal doesn't just mean "good at planning and people" — it means you can architect social outcomes most people can't even see.</p>
              <p>A panel of independent AIs analyzes your specific cluster patterns and generates prescriptions for career decisions, relationship dynamics, creative output, and long-term planning.</p>
            </div>
          </div>

          {/* Pillar 2: Weakness Protection */}
          <div className="rounded-[6px]" style={{ border: `1px solid rgba(200,92,68,0.25)`, padding: '28px 24px', background: `radial-gradient(300px 180px at 50% 0%, rgba(200,92,68,0.04), transparent 70%), ${INK}` }}>
            <ShieldGlyph />
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', letterSpacing: '0.20em', textTransform: 'uppercase', color: '#C85C44', margin: '10px 0 12px' }}>02 · Shield</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: '24px', color: CREAM, marginBottom: '14px' }}>Weakness Cluster Protection</div>
            <div style={{ color: CREAM2, fontSize: '14.5px', lineHeight: 1.6 }}>
              <p style={{ marginBottom: '12px' }}>Your lowest lines aren't just "areas for improvement" — they're <b style={{ color: CREAM, fontWeight: 600 }}>structural vulnerabilities</b> that can destroy everything your strengths have built. One weak line can collapse the entire system geometrically, not additively.</p>
              <p style={{ marginBottom: '12px' }}>We assess the <b style={{ color: CREAM, fontWeight: 600 }}>likelihood</b> of your weakness clusters threatening the system, then prescribe: identify, shield with structural protections, bolster through targeted training (permanent gains, per the research), and insure against worst-case scenarios.</p>
              <p>The evidence shows intelligence lines can be trained. The gains persist across decades. Your weaknesses are not destiny — but unattended, they control the outcome.</p>
            </div>
          </div>

          {/* Pillar 3: Complementary Matching */}
          <div className="rounded-[6px]" style={{ border: `1px solid ${LINE_C}`, padding: '28px 24px', background: `radial-gradient(300px 180px at 50% 0%, rgba(155,192,178,0.05), transparent 70%), ${INK}` }}>
            <MatchGlyph />
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', letterSpacing: '0.20em', textTransform: 'uppercase', color: JADE, margin: '10px 0 12px' }}>03 · Connect</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: '24px', color: CREAM, marginBottom: '14px' }}>Complementary Relationship Matching</div>
            <div style={{ color: CREAM2, fontSize: '14.5px', lineHeight: 1.6 }}>
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
        <p style={{ color: CREAM2, fontSize: 'clamp(15px,1.5vw,16px)', lineHeight: 1.6, maxWidth: '36em', margin: '0 auto 26px' }}>
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
        <p style={{ color: CREAM2, fontSize: 'clamp(16px,1.7vw,18px)', lineHeight: 1.65, maxWidth: '46em' }}>
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
                <span style={{ color: CHAMPAGNE, fontSize: '14px', marginRight: '9px', verticalAlign: 'middle' }}>◇</span>{p.t}
              </div>
              <div style={{ color: CREAM2, fontSize: '14.5px', lineHeight: 1.6 }}>{p.d}</div>
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
        <p style={{ color: CREAM, fontSize: 'clamp(16px,1.9vw,20px)', lineHeight: 1.6, maxWidth: '46em', fontStyle: 'italic', marginBottom: '14px' }}>
          Do it solo for a private read, or bring your partner or best friend for a sharper, funnier one.
        </p>
        <p style={{ color: CREAM2, fontSize: 'clamp(16px,1.7vw,18px)', lineHeight: 1.65, maxWidth: '46em' }}>
          It isn't just more fun: the science says a person who knows you well reads your <b style={{ color: CREAM, fontWeight: 600 }}>outward</b> lines — humor, charm, influence, how you command a room — more accurately than you read yourself, while <b style={{ color: CREAM, fontWeight: 600 }}>you</b> stay the better judge of the inward ones. Any high-acquaintance person works — partner, best friend, sibling, business partner — never spouse-only, and solo is always the full experience. We keep both answers separate, score the gap, and the reveal — <i>"you rate your humor how high?"</i> — is the best part.
        </p>
        <div className="grid gap-[clamp(16px,2.5vw,26px)] mt-[clamp(24px,3vw,40px)]" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
          {[
            { t: "Sharper, not softer", d: "Your partner corrects the lines you're worst at rating for yourself — charm, humor, presence, leadership. Two honest signals beat one biased one." },
            { t: "The gap is the gold", d: "We don't blend the answers — we score the difference. A big gap between how you and they see a line is itself an insight (and the funniest moment of the night)." },
            { t: "Solo loses nothing", d: "Companion mode is a bonus, never a requirement. The solo assessment is the full experience — private questions stay private, and single members get everything." },
          ].map((c) => (
            <div key={c.t} className="rounded-[6px]" style={{ border: `1px solid ${LINE_C}`, padding: '26px 24px', background: `radial-gradient(300px 180px at 50% 0%, rgba(224,198,140,0.05), transparent 70%), ${INK}` }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: '22px', color: CREAM, marginBottom: '10px' }}>{c.t}</div>
              <div style={{ color: CREAM2, fontSize: '14.5px', lineHeight: 1.6 }}>{c.d}</div>
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
    track.mutate({ type: "landing_view", variant: currentHeroId() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen relative" style={{ background: INK }}>
      {/* Shared motion — subtle, sensory, and off for reduced-motion users */}
      <style>{`
        @keyframes aqPulse { 0%,100% { opacity:.5 } 50% { opacity:1 } }
        @keyframes aqDash { to { stroke-dashoffset: -36 } }
        @keyframes aqRise { from { transform: scaleY(0.2) } to { transform: scaleY(1) } }
        .aq-pulse { animation: aqPulse 2.6s ease-in-out infinite; }
        .aq-dash { animation: aqDash 2.4s linear infinite; }
        .aq-rise { transform-origin: bottom; animation: aqRise 0.9s cubic-bezier(.22,.61,.36,1) both; }
        @media (prefers-reduced-motion: reduce) {
          .aq-pulse, .aq-dash, .aq-rise { animation: none; }
        }
      `}</style>
      <PublicHeader />
      <div className="relative z-10">
        {/* ── THE HOOK ── promise, then an immediate toy to play with */}
        <HeroSection />
        {/* What's in it for them — the ten promises, before any 32-line detail */}
        <div data-reveal><TenPromisesSection /></div>
        {/* Instant payoff: the interactive 32-line dial — touch the product before reading a word */}
        <div data-reveal><DialSection /></div>
        <ActDivider />
        {/* ── THE STORY ARC ── tension → aha → "that's me" → fear → plan */}
        <div data-reveal><FounderStorySection /></div>
        <div data-reveal><MechanismSection /></div>
        <div data-reveal><ArchetypeShowcaseSection /></div>
        <div data-reveal><InsuranceSection /></div>
        <div data-reveal><ProtocolSection /></div>
        {/* Action valve at peak motivation — a button the moment they want one */}
        <div data-reveal><FinalCTA /></div>
        <ActDivider />
        {/* ── THE OFFER ── how it works, then everything membership does for you */}
        <div data-reveal><ProcessSection /></div>
        <div data-reveal><ServicePillars /></div>
        <div data-reveal><CompanionSection /></div>
        {/* ── THE TRUST LADDER ── evidence, the library, real voices */}
        <div data-reveal><EvidenceSection /></div>
        <div data-reveal><ResearchLibrarySection /></div>
        <div data-reveal><TestimonialsStrip /></div>
        <ActDivider />
        {/* ── THE CLOSE ── scarcity + the founding claim */}
        <div data-reveal><FreeFoundingAccess /></div>
        <HonestFooter />
        <PublicFooter />
      </div>
    </div>
  );
}
