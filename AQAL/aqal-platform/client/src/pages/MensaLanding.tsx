import { Link } from "wouter";
import { motion } from "framer-motion";
import { useEffect } from "react";

// ============================================================
// MENSA LANDING PAGE — Channel-specific page for Mensa Bulletin
// Tracks conversions from the Mensa classified/ad link
// Messaging: IQ → 32 lines upsell, rarity hook, evidence-based
// ============================================================

const LINES_PREVIEW = [
  "Analytical", "Emotional", "Spatial", "Somatic", "Strategic",
  "Linguistic", "Aesthetic", "Meta-Cognitive", "Systems", "Pattern",
  "Social", "Influence", "Volitional", "Adversarial", "Interoceptive",
  "Financial", "Rhetorical", "Musical", "Moral", "Naturalist",
  "Bodily-Kinesthetic", "Entrepreneurial", "Creative", "Memory",
  "Interpersonal", "Mathematical", "Mechanical", "Fluid",
  "Crystallized", "Spiritual", "Existential", "Temporal"
];

export default function MensaLanding() {
  // Track Mensa channel visit
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const utm = params.get("utm_source") || "mensa_bulletin";
      sessionStorage.setItem("aqal_channel", utm);
      sessionStorage.setItem("aqal_channel_ts", Date.now().toString());
    } catch {}
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Minimal header — no full nav, just logo + back */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/">
            <span className="text-lg font-medium text-foreground hover:text-primary transition-colors cursor-pointer" style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: '0.02em' }}>
              AQAL
            </span>
          </Link>
          <span className="font-mono text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60">
            Mensa Member Access
          </span>
        </div>
      </header>
      <div className="h-14" />

      {/* Hero */}
      <section className="py-20 sm:py-28 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          >
            <p className="font-mono text-[10.5px] tracking-[0.3em] uppercase text-primary/80 mb-6">
              For Mensa Members
            </p>
            <h1 className="font-display text-[clamp(32px,5.5vw,56px)] leading-[1.1] font-medium text-foreground">
              Your IQ Proved You're Exceptional.
              <br />
              <span className="text-primary italic">Now Discover How.</span>
            </h1>
            <p className="mt-8 text-[16px] leading-relaxed text-muted-foreground max-w-[52ch] mx-auto">
              G is one dimension. Your mind operates across <strong className="text-foreground">thirty-two</strong>. 
              The AQAL Intelligence Assessment maps your complete cognitive architecture — each line 
              measured independently, each carrying its own weight in your rarity composite.
            </p>
          </motion.div>
        </div>
      </section>

      {/* The 32 Lines Grid */}
      <section className="py-16 px-4 border-t border-border/20">
        <div className="max-w-4xl mx-auto">
          <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground/60 text-center mb-8">
            32 Independent Intelligence Lines
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {LINES_PREVIEW.map((line, i) => (
              <motion.div
                key={line}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.02, duration: 0.25 }}
                className="bg-secondary/60 border border-border/40 rounded px-2 py-2 text-center"
              >
                <span className="font-mono text-[9px] tracking-[0.04em] text-muted-foreground leading-tight block">
                  {line}
                </span>
              </motion.div>
            ))}
          </div>
          <p className="text-center mt-6 text-[13px] text-muted-foreground/70 max-w-[48ch] mx-auto">
            IQ tests measure one axis. You have thirty-two — each uncorrelated, each multiplicative 
            in its contribution to your cognitive rarity.
          </p>
        </div>
      </section>

      {/* What You Receive */}
      <section className="py-20 px-4 border-t border-border/20">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-[clamp(24px,4vw,36px)] font-medium text-center mb-12">
            What the Assessment Delivers
          </h2>
          <div className="space-y-8">
            {[
              {
                title: "Strength Clusters",
                desc: "Your 4–7 elite dimensions identified with precision. Specific strategies for deploying them toward your stated goals — not generic advice, but prescriptions calibrated to your unique architecture.",
                accent: "#E0C68C"
              },
              {
                title: "Vulnerability Map",
                desc: "The dimensions where your organism is silently exposed. Evidence-based shielding prescriptions, strengthening protocols, and second-order effect analysis showing how unattended weaknesses threaten the entire system.",
                accent: "#C85C44"
              },
              {
                title: "Complementary Matching",
                desc: "Introduction to members whose cognitive architecture completes yours — whose strengths cover your gaps, and whose gaps match your strengths. The relationship itself becomes the intervention.",
                accent: "#9FB98C"
              },
              {
                title: "Five-AI Coaching",
                desc: "Not one algorithm. Five independent AI systems working in consensus — measuring, cross-referencing, and prescribing. Disagreement triggers deeper analysis. Ongoing synthesis that tracks your development across all 32 lines.",
                accent: "#B8A080"
              }
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="flex gap-5 items-start"
              >
                <div className="w-1 h-16 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: item.accent }} />
                <div>
                  <h3 className="font-display text-[18px] font-medium text-foreground mb-2">{item.title}</h3>
                  <p className="text-[14px] leading-relaxed text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* The Process */}
      <section className="py-20 px-4 border-t border-border/20 bg-secondary/20">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-[clamp(24px,4vw,36px)] font-medium text-center mb-4">
            Two-Stage Process
          </h2>
          <p className="text-center text-[14px] text-muted-foreground mb-12 max-w-[48ch] mx-auto">
            Confidence builds in layers. Stage 1 gives you a directional map. Stage 2 gives you verified precision.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-background border border-border/40 rounded-lg p-6">
              <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-primary/70 mb-3">Stage 1 — Voice Assessment</div>
              <h3 className="font-display text-[18px] font-medium mb-3">Directional Confidence</h3>
              <ul className="space-y-2 text-[13px] text-muted-foreground">
                <li className="flex gap-2"><span className="text-primary/60">→</span> 30–60 minute structured voice interview</li>
                <li className="flex gap-2"><span className="text-primary/60">→</span> A panel of AIs analyzes verbal markers</li>
                <li className="flex gap-2"><span className="text-primary/60">→</span> All 32 lines scored at low-confidence level</li>
                <li className="flex gap-2"><span className="text-primary/60">→</span> Immediate preliminary profile generated</li>
              </ul>
              <div className="mt-4 font-mono text-[10px] text-muted-foreground/50 tracking-[0.06em]">
                Confidence: Directional · Useful for initial mapping
              </div>
            </div>
            <div className="bg-background border border-accent/30 rounded-lg p-6">
              <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-accent mb-3">Stage 2 — Evidence Upload</div>
              <h3 className="font-display text-[18px] font-medium mb-3">Verified Precision</h3>
              <ul className="space-y-2 text-[13px] text-muted-foreground">
                <li className="flex gap-2"><span className="text-accent/80">→</span> Upload credentials, publications, portfolios</li>
                <li className="flex gap-2"><span className="text-accent/80">→</span> Every claim cross-referenced against evidence</li>
                <li className="flex gap-2"><span className="text-accent/80">→</span> Scores locked only when the AI panel reaches consensus</li>
                <li className="flex gap-2"><span className="text-accent/80">→</span> High-confidence rarity composite calculated</li>
              </ul>
              <div className="mt-4 font-mono text-[10px] text-accent/60 tracking-[0.06em]">
                Confidence: High · Evidence-grounded · Verified
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Rarity Hook */}
      <section className="py-20 px-4 border-t border-border/20">
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-muted-foreground/60 mb-4">
            Beyond the Top 2%
          </p>
          <h2 className="font-display text-[clamp(24px,4.5vw,40px)] font-medium mb-6">
            How Rare Is Your Specific Combination?
          </h2>
          <p className="text-[15px] leading-relaxed text-muted-foreground max-w-[52ch] mx-auto mb-8">
            IQ places you in the top 2% on one axis. But when you measure thirty-two independent 
            dimensions — each uncorrelated — the multiplicative effect on rarity is exponential. 
            Most Mensans discover their specific architecture is far rarer than IQ alone suggests.
          </p>
          <p className="text-[13px] text-muted-foreground/60 italic max-w-[44ch] mx-auto">
            Rarity isn't the point. Knowing what makes you rare — and what to do with it — is.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 border-t border-border/20 bg-secondary/20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-[clamp(24px,4vw,34px)] font-medium mb-4">
            Begin Your Assessment
          </h2>
          <p className="text-[14px] text-muted-foreground mb-8 max-w-[44ch] mx-auto">
            The full 26-question assessment is free — no payment required. You'll get your
            voice-based rarity estimate before deciding to verify it with evidence.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Link href="/assessment">
              <button className="px-8 py-3.5 bg-primary text-primary-foreground font-mono text-[11px] tracking-[0.15em] uppercase rounded-sm cursor-pointer hover:bg-primary/90 transition-colors active:scale-[0.97]">
                Start Free Preliminary
              </button>
            </Link>
            <Link href="/pricing">
              <button className="px-8 py-3.5 bg-transparent border border-primary/30 text-primary font-mono text-[11px] tracking-[0.15em] uppercase rounded-sm cursor-pointer hover:bg-primary/5 transition-colors">
                View Pricing
              </button>
            </Link>
          </div>
          <div className="space-y-1">
            <p className="font-mono text-[11px] text-primary tracking-[0.06em]">
              Founding member rate: $299 <span className="text-muted-foreground/60">(first 100 members only)</span>
            </p>
            <p className="font-mono text-[10px] text-muted-foreground/50 tracking-[0.04em]">
              Regular assessment: $1,500
            </p>
          </div>
        </div>
      </section>

      {/* Trust Footer */}
      <section className="py-12 px-4 border-t border-border/20">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 font-mono text-[10px] tracking-[0.08em] text-muted-foreground/50 uppercase">
            <span>Five-AI Consensus</span>
            <span>·</span>
            <span>Evidence-Verified</span>
            <span>·</span>
            <span>32 Independent Lines</span>
            <span>·</span>
            <span>140+ Peer-Reviewed Sources</span>
          </div>
          <div className="flex justify-center gap-6 mt-6">
            <Link href="/science">
              <span className="text-[12px] text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer">Research Library</span>
            </Link>
            <Link href="/about">
              <span className="text-[12px] text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer">How It Works</span>
            </Link>
            <Link href="/weakness-finder">
              <span className="text-[12px] text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer">Weakness-Finder</span>
            </Link>
          </div>
          <p className="text-center mt-8 text-[11px] text-muted-foreground/40">
            © {new Date().getFullYear()} AQAL Intelligence Platform. This page is designed for Mensa members 
            arriving from the Mensa Bulletin. All claims are evidence-based and verifiable in our{" "}
            <Link href="/research-library"><span className="underline cursor-pointer hover:text-foreground/60">Research Library</span></Link>.
          </p>
        </div>
      </section>
    </div>
  );
}
